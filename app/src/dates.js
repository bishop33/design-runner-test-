// 날짜 계산. 모든 일정은 사용자 기준일(출산 예정일·입원일·출생일 등)에서 계산합니다.
// 콘텐츠 원본에는 날짜를 저장하지 않습니다.

export const DAY = 86400000;
/** 만삭 40주 = 280일. 최종 월경 시작일(LMP)을 출산 예정일에서 역산할 때 씁니다. */
export const TERM_DAYS = 280;

export function toDate(v) {
  if (!v) return null;
  const d = v instanceof Date ? new Date(v) : new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function today() {
  return startOfDay(new Date());
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return startOfDay(x);
}

export function addMonths(d, n) {
  const x = new Date(d);
  const day = x.getDate();
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  // 말일 보정: 1/31 + 1개월 → 2/28
  x.setDate(Math.min(day, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()));
  return startOfDay(x);
}

export function diffDays(a, b) {
  return Math.round((startOfDay(a) - startOfDay(b)) / DAY);
}

export function toISO(d) {
  if (!d) return '';
  const x = startOfDay(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

const FMT = new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' });
const FMT_FULL = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
const FMT_TIME = new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export const fmtShort = (d) => (d ? FMT.format(d) : '');
export const fmtFull = (d) => (d ? FMT_FULL.format(d) : '');
export const fmtStamp = (iso) => (iso ? FMT_TIME.format(new Date(iso)) : '');

/** 오늘 기준 상대 표현. 과거는 '3일 지남', 오늘은 '오늘'. */
export function relDays(n) {
  if (n === 0) return '오늘';
  if (n === 1) return '내일';
  if (n === -1) return '어제';
  if (n > 0) return `D-${n}`;
  return `${-n}일 지남`;
}

/**
 * 온보딩 정보에서 일정 계산의 기준일 집합을 만듭니다.
 * 출생일·조리원 입소일·집 복귀일은 실제 값이 없으면 추정값을 쓰고 estimated 로 표시합니다.
 */
export function buildAnchors(profile) {
  const due = toDate(profile.dueDate);
  const birthActual = toDate(profile.birthDate);
  let admission = toDate(profile.admissionDate) || (due ? addDays(due, -1) : null);
  // 아기가 이미 태어났는데 입원 예정일이 그 뒤로 남아 있으면 예정일이 지난 값입니다.
  // 출생일로 당겨야 입원 전 준비 항목이 계속 '앞으로 할 일'로 남지 않습니다.
  if (birthActual && admission && admission > birthActual) admission = birthActual;
  const birth = birthActual || due;

  const careInActual = toDate(profile.careCenterInDate);
  const careIn = careInActual || (birth ? addDays(birth, 3) : null);

  const homeActual = toDate(profile.homeReturnDate);
  const home =
    homeActual ||
    (profile.usesCareCenter === false
      ? birth && addDays(birth, 3)
      : careIn && addDays(careIn, 14));

  return {
    lmp: due ? addDays(due, -TERM_DAYS) : null,
    due,
    admission,
    birth,
    careIn,
    home,
    estimated: {
      admission: !toDate(profile.admissionDate),
      birth: !birthActual,
      careIn: !careInActual,
      home: !homeActual,
    },
    hasBirth: Boolean(birthActual),
  };
}

/**
 * 항목의 기준·단위·시작/종료 값으로 실제 날짜 구간을 계산합니다.
 * @returns {{from: Date, to: Date}|null}
 */
export function itemWindow(item, a) {
  const { anchor, unit, start, end } = item;
  if (anchor === '임신 주차') {
    if (!a.lmp) return null;
    return { from: addDays(a.lmp, start * 7), to: addDays(a.lmp, end * 7 + 6) };
  }
  const base = { 입원일: a.admission, 출생일: a.birth, '조리원 입소일': a.careIn, '집 복귀일': a.home }[anchor];
  if (!base) return null;
  if (unit === '개월') {
    return { from: addMonths(base, start), to: addDays(addMonths(base, end + 1), -1) };
  }
  return { from: addDays(base, start), to: addDays(base, end) };
}

/** 임신 주수/일 또는 생후 일수·개월을 문장으로 만듭니다. */
export function stageLabel(a, now = today()) {
  if (a.hasBirth && a.birth && now >= a.birth) {
    const d = diffDays(now, a.birth);
    if (d < 28) return `생후 ${d}일`;
    const m = Math.floor(d / 30.44);
    return `생후 ${m}개월`;
  }
  if (!a.lmp) return '';
  const d = diffDays(now, a.lmp);
  if (d < 0) return '';
  const w = Math.floor(d / 7);
  const rest = d % 7;
  return rest ? `임신 ${w}주 ${rest}일` : `임신 ${w}주`;
}
