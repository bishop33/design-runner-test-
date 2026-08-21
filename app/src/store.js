// 사용자 상태 저장소.
// 콘텐츠 원본(app/data/content.json)에는 아무것도 쓰지 않습니다. 이 파일이 다루는 것만 사용자 데이터입니다.
//
// 저장은 어댑터 뒤에 두고 전부 async 로 노출합니다.
// 나중에 서버·DB 로 옮길 때 loadState/saveState 두 함수만 교체하면 됩니다.

const KEY = 'junbi.state.v1';
export const SCHEMA_VERSION = 1;

export const STATUSES = ['확인 전', '확인했어요', '준비 중', '완료', '해당 없음'];
export const GEAR_STATES = ['이미 있음', '구매 예정', '선물 받을 예정', '대여 예정', '필요 없음'];
export const BAGS = { birth: '출산가방', care: '조리원 가방' };
export const REACTIONS = ['좋은 점', '아쉬운 점', '직접 입력'];

function emptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    onboarded: false,
    profile: {
      dueDate: '',
      admissionDate: '',
      birthDate: '',
      careCenterInDate: '',
      homeReturnDate: '',
      deliveryPlan: '아직 모름', // 자연분만 | 유도분만 | 제왕절개 | 아직 모름
      firstBaby: true,
      usesCareCenter: null, // true | false | null(아직 모름)
      hasCar: null,
      parentsHelp: null,
      hasCompanyLeave: null,
      hasPet: null,
      plansDaycare: null,
      usesPostpartumHelper: null,
      members: [
        { id: 'm1', name: '나' },
        { id: 'm2', name: '배우자' },
      ],
      activeMemberId: 'm1',
      hideNonApplicable: true,
    },
    items: {},        // itemId -> { status, remindOn, doneAt, doneBy, gear, bags, updatedAt, updatedBy }
    notes: {},        // itemId -> [{ id, by, at, text }]
    experiences: {},  // itemId -> [{ id, by, at, reaction, text }]
    customItems: [],  // 사용자가 직접 추가한 항목
    activity: [],     // [{ id, at, by, itemId, title, kind, detail }] 최신순
    visits: {},       // memberId -> { lastAt, prevAt } 재방문 화면의 기준점
    lastOpenedItem: '', // 마지막으로 본 항목 — 이어서 보기
    lastSeenStage: '',  // 마지막으로 본 주차 라벨 — 주가 바뀐 첫 방문 감지
  };
}

/* ── 저장 어댑터 (localStorage) ───────────────────────── */

async function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion !== SCHEMA_VERSION) return emptyState();
    return { ...emptyState(), ...parsed, profile: { ...emptyState().profile, ...parsed.profile } };
  } catch {
    return emptyState();
  }
}

async function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('상태를 저장하지 못했습니다.', e);
  }
}

/* ── 스토어 ───────────────────────────────────────────── */

let state = emptyState();
const listeners = new Set();

export async function init() {
  state = await loadState();
  return state;
}

export function get() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * @param mutate 상태를 바꾸는 함수
 * @param hint   구독자가 전체 다시 그리기 대신 부분 갱신을 고를 수 있게 하는 단서
 */
async function commit(mutate, hint = null) {
  mutate(state);
  await saveState(state);
  listeners.forEach((fn) => fn(state, hint));
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const nowISO = () => new Date().toISOString();

export function actor() {
  const p = state.profile;
  return p.members.find((m) => m.id === p.activeMemberId) || p.members[0];
}

export function memberName(id) {
  return state.profile.members.find((m) => m.id === id)?.name || '알 수 없음';
}

/** 항목의 사용자 상태. 없으면 기본값. */
export function entry(itemId) {
  return state.items[itemId] || { status: '확인 전', remindOn: '', doneAt: '', doneBy: '', gear: '', bags: {} };
}

function pushActivity(draft, { itemId, title, kind, detail }) {
  draft.activity.unshift({ id: uid(), at: nowISO(), by: draft.profile.activeMemberId, itemId, title, kind, detail });
  if (draft.activity.length > 300) draft.activity.length = 300;
}

/* ── 변경 동작 ────────────────────────────────────────── */

/**
 * 세션 시작을 기록합니다. 마지막 방문에서 6시간 넘게 지났으면 새 방문으로 치고,
 * 그 이전 방문 시각을 prevAt 으로 남깁니다. '지난 방문 이후' 는 prevAt 기준으로 잘라 보여 줍니다.
 * 저장만 하고 알리지 않습니다 — 이 일로 화면을 다시 그릴 이유가 없습니다.
 */
export async function touchVisit() {
  const me = state.profile.activeMemberId;
  const v = state.visits[me] || { lastAt: '', prevAt: '' };
  const now = Date.now();
  const gap = v.lastAt ? now - new Date(v.lastAt).getTime() : Infinity;
  if (gap > 6 * 3600 * 1000) v.prevAt = v.lastAt;
  v.lastAt = new Date(now).toISOString();
  state.visits[me] = v;
  await saveState(state);
}

/**
 * 주차 라벨을 확인하고, 지난 방문과 달라졌으면 이전 라벨을 돌려줍니다.
 * 임신 주차는 앱이 스스로 만들어내는 유일한 '새로움' 이라, 주가 바뀐
 * 첫 방문에는 그것부터 알려 줍니다. 같으면 null.
 */
export async function stageChanged(label) {
  if (!label || state.lastSeenStage === label) return null;
  const prev = state.lastSeenStage;
  state.lastSeenStage = label;
  await saveState(state);
  return prev || null;
}

/** 이 사람의 지난 방문 시각. 첫 방문이면 ''. */
export function prevVisitAt() {
  return state.visits[state.profile.activeMemberId]?.prevAt || '';
}

/** 마지막으로 연 항목. 저장만 하고 알리지 않습니다. */
export async function rememberOpened(itemId) {
  state.lastOpenedItem = itemId;
  await saveState(state);
}

export async function saveProfile(patch, { onboarded } = {}) {
  await commit((d) => {
    d.profile = { ...d.profile, ...patch };
    if (onboarded !== undefined) d.onboarded = onboarded;
  });
}

export async function setStatus(item, status) {
  await commit((d) => {
    const prev = d.items[item.id]?.status || '확인 전';
    if (prev === status) return;
    const e = d.items[item.id] || { status: '확인 전', remindOn: '', doneAt: '', doneBy: '', gear: '', bags: {} };
    e.status = status;
    e.updatedAt = nowISO();
    e.updatedBy = d.profile.activeMemberId;
    if (status === '완료') {
      // 나중에 몰아서 기록할 수 있게, 완료일은 기본 오늘이되 상세에서 고칠 수 있습니다.
      if (!e.doneAt) e.doneAt = new Date().toISOString().slice(0, 10);
      e.doneBy = d.profile.activeMemberId;
    } else {
      e.doneAt = '';
      e.doneBy = '';
    }
    d.items[item.id] = e;
    pushActivity(d, { itemId: item.id, title: item.title, kind: '상태', detail: `${prev} → ${status}` });
  }, { kind: 'status', itemId: item.id });
}

/**
 * 항목을 열어본 것으로 표시합니다.
 * '확인했어요' 는 말 그대로 내용을 봤다는 뜻이라, 상세를 여는 것으로 갈음합니다.
 * 손으로 눌러야 하는 단계를 하나 없앱니다. 열람은 활동 목록에 쌓지 않습니다.
 */
export async function markSeen(item) {
  if ((state.items[item.id]?.status || '확인 전') !== '확인 전') return;
  await commit((d) => {
    const e = d.items[item.id] || { status: '확인 전', remindOn: '', doneAt: '', doneBy: '', gear: '', bags: {} };
    e.status = '확인했어요';
    e.updatedAt = nowISO();
    e.updatedBy = d.profile.activeMemberId;
    d.items[item.id] = e;
  }, { kind: 'status', itemId: item.id });
}

export async function setDoneAt(item, date) {
  await commit((d) => {
    const e = d.items[item.id];
    if (!e) return;
    e.doneAt = date;
    e.updatedAt = nowISO();
    pushActivity(d, { itemId: item.id, title: item.title, kind: '완료일', detail: date || '지움' });
  });
}

export async function setRemind(item, date) {
  await commit((d) => {
    const e = d.items[item.id] || { status: '확인 전', remindOn: '', doneAt: '', doneBy: '', gear: '', bags: {} };
    e.remindOn = date;
    e.updatedAt = nowISO();
    d.items[item.id] = e;
    pushActivity(d, { itemId: item.id, title: item.title, kind: '리마인드', detail: date || '지움' });
  });
}

/** 보유 상태(이미 있음·구매 예정 …). 가방 수납과는 별개입니다. */
export async function setGear(item, value) {
  await commit((d) => {
    const e = d.items[item.id] || { status: '확인 전', remindOn: '', doneAt: '', doneBy: '', gear: '', bags: {} };
    e.gear = value;
    e.updatedAt = nowISO();
    d.items[item.id] = e;
    pushActivity(d, { itemId: item.id, title: item.title, kind: '준비 상태', detail: value || '지움' });
  });
}

/** 가방 수납 여부. 보유 상태와 분리해서 저장합니다. */
export async function toggleBag(item, bagKey) {
  await commit((d) => {
    const e = d.items[item.id] || { status: '확인 전', remindOn: '', doneAt: '', doneBy: '', gear: '', bags: {} };
    e.bags = { ...e.bags, [bagKey]: !e.bags?.[bagKey] };
    e.updatedAt = nowISO();
    d.items[item.id] = e;
    pushActivity(d, {
      itemId: item.id, title: item.title, kind: '가방',
      detail: `${BAGS[bagKey]} ${e.bags[bagKey] ? '넣음' : '뺌'}`,
    });
  });
}

export async function addNote(item, text) {
  const t = text.trim();
  if (!t) return;
  await commit((d) => {
    (d.notes[item.id] ||= []).unshift({ id: uid(), by: d.profile.activeMemberId, at: nowISO(), text: t });
    pushActivity(d, { itemId: item.id, title: item.title, kind: '메모', detail: t.slice(0, 40) });
  });
}

export async function removeNote(itemId, noteId) {
  await commit((d) => {
    d.notes[itemId] = (d.notes[itemId] || []).filter((n) => n.id !== noteId);
  });
}

export async function addExperience(item, reaction, text) {
  const t = text.trim();
  if (!t) return;
  await commit((d) => {
    (d.experiences[item.id] ||= []).unshift({ id: uid(), by: d.profile.activeMemberId, at: nowISO(), reaction, text: t });
    pushActivity(d, { itemId: item.id, title: item.title, kind: '경험', detail: `${reaction} · ${t.slice(0, 30)}` });
  });
}

export async function addCustomItem(draft) {
  const id = `u${uid()}`;
  await commit((d) => {
    d.customItems.unshift({ ...draft, id, createdAt: nowISO(), createdBy: d.profile.activeMemberId });
    pushActivity(d, { itemId: id, title: draft.title, kind: '항목 추가', detail: draft.phase });
  });
  return id;
}

export async function removeCustomItem(id) {
  await commit((d) => {
    d.customItems = d.customItems.filter((c) => c.id !== id);
    delete d.items[id];
    delete d.notes[id];
    d.activity = d.activity.filter((a) => a.itemId !== id);
  });
}

export async function resetAll() {
  state = emptyState();
  await saveState(state);
  listeners.forEach((fn) => fn(state));
}
