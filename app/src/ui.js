// 화면 공통 조각. 상태·중요도·유형의 시각 체계를 여기 한 곳에서만 정의합니다.

import { icon } from './icons.js';
import { STATUSES } from './store.js';
import { fmtShort } from './dates.js';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** 상태 5단계 → Lucide 아이콘 */
export const STATUS_ICON = {
  '확인 전': 'circle',
  확인했어요: 'circle-dot',
  '준비 중': 'circle-dashed',
  완료: 'circle-check-big',
  '해당 없음': 'circle-slash',
};

/** 콘텐츠 유형 → Lucide 아이콘 */
export const TYPE_ICON = {
  '할 일': 'square-check',
  '검사·진료': 'stethoscope',
  '병원 확인 신호': 'triangle-alert',
  '증상·변화': 'activity',
  가이드: 'book-open',
  경험담: 'message-circle',
  '준비 목록': 'luggage',
  육아용품: 'package',
};

/** 타임라인 상단 필터 */
export const TYPE_GROUPS = [
  { key: 'all', label: '전체' },
  { key: 'todo', label: '할 일' },
  { key: 'care', label: '검사·진료' },
  { key: 'signal', label: '증상·변화' },
  { key: 'guide', label: '가이드' },
  { key: 'story', label: '경험담' },
];

export function statusButton(item) {
  const st = item.status;
  return `<button class="status-btn" data-act="cycle" data-id="${item.id}" data-status="${esc(st)}"
    aria-label="${esc(item.title)} · 상태 ${esc(st)} · 눌러서 ${st === '완료' ? '완료 취소' : '완료로 기록'}" title="${esc(st)}">
    ${icon(STATUS_ICON[st] || 'circle', 22)}</button>`;
}

/**
 * 중요도 표시.
 * 목록에서는 '필수·주의' 만 칩으로 보여 줍니다. 356개 중 239개가 권장·선택이라
 * 전부 표시하면 칩이 배경이 되어 정작 필수가 묻힙니다. 없으면 필수가 아니라는 뜻입니다.
 * 네 단계 전부는 상세 화면에서 봅니다.
 */
export function importanceTag(imp, { always = false } = {}) {
  if (!always && imp !== '필수' && imp !== '주의') return '';
  return `<span class="imp" data-imp="${esc(imp)}">${esc(imp)}</span>`;
}

/** 목록 한 줄. 타임라인·홈·검색·주제에서 같은 모양을 씁니다. */
/**
 * 오른쪽 끝 한 마디.
 * 끝낸 일에 남은 기한을 보여 줄 이유가 없습니다. 언제 했는지가 알고 싶은 것입니다.
 */
function whenText(item, showWhen) {
  const done = item.entry.doneAt;
  if (item.status === '완료' && done) {
    const d = new Date(`${done}T00:00:00`);
    return isToday(d) ? '오늘 완료' : `${fmtShort(d)} 완료`;
  }
  return showWhen ? item.whenLabel : '';
}

const isToday = (d) => {
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

/**
 * 목록 한 줄.
 * @param showPhase 시기를 메타에 보일지 (타임라인 밖에서 씀)
 * @param showWhen  오른쪽 날짜를 보일지. 타임라인에서는 구간 헤더가 같은 날짜를 이미 말하므로 끕니다.
 */
export function itemRow(item, { showPhase = false, showWhen = true } = {}) {
  const cls = ['row'];
  if (item.status === '완료') cls.push('is-done');
  if (item.status === '해당 없음') cls.push('is-skip');
  const late = !item.done && item.when === 'past';
  // 한 줄에 담기도록 유형은 아이콘으로만 두고(읽는 이름은 sr-only), 나머지는 텍스트로 둡니다.
  const meta = [
    `<span class="type-mark" title="${esc(item.type)}">${icon(TYPE_ICON[item.type] || 'square-check', 14)}<span class="sr-only">${esc(item.type)}</span></span>`,
    importanceTag(item.importance),
    `<span class="sep">·</span>${esc(item.action)}`,
    `<span class="sep">·</span>${esc(showPhase ? item.phase : item.subtopic)}`,
    item.conditionKey && item.verdict === true ? `<span class="sep">·</span>${esc(item.condition)}` : '',
  ].join(' ');

  return `<li>
    <div class="${cls.join(' ')}">
      ${statusButton(item)}
      <div class="row-body">
        <button class="row-title" data-act="open" data-id="${item.id}">${esc(item.title)}</button>
        <div class="row-meta">${meta}</div>
      </div>
      <span class="row-when${late ? ' is-late' : ''}">${esc(whenText(item, showWhen))}</span>
    </div>
  </li>`;
}

export function itemList(items, opts) {
  if (!items.length) return `<p class="empty">해당하는 항목이 없습니다.</p>`;
  return `<ul class="divide">${items.map((i) => itemRow(i, opts)).join('')}</ul>`;
}

/**
 * 목록을 다시 그리지 않고 한 줄만 갱신합니다.
 * 356개를 전부 펼친 상태에서 상태를 바꿀 때 전체 재렌더(수백 ms)를 피하려고 씁니다.
 */
export function patchRow(rowEl, item, { showWhen = true } = {}) {
  const btn = rowEl.querySelector('.status-btn');
  btn.dataset.status = item.status;
  btn.title = item.status;
  btn.setAttribute('aria-label', `${item.title} 상태: ${item.status}. 눌러서 다음 상태로 바꿉니다`);
  btn.innerHTML = icon(STATUS_ICON[item.status] || 'circle', 22);

  rowEl.classList.toggle('is-done', item.status === '완료');
  rowEl.classList.toggle('is-skip', item.status === '해당 없음');

  const when = rowEl.querySelector('.row-when');
  when.textContent = whenText(item, showWhen);
  when.classList.toggle('is-late', !item.done && item.when === 'past');
}

/**
 * 목록에서 원을 누르면 완료를 켜고 끕니다.
 * 5단계를 한 버튼으로 순환시키면 완료까지 세 번 눌러야 하고, 한 번 지나치면
 * '해당 없음' 이 되어 완료 기록이 지워집니다. 나머지 단계는 상세에서 고릅니다.
 */
export function toggleStatus(cur) {
  return cur === '완료' ? '확인했어요' : '완료';
}

export function topbar(title, { sub = '', back = null, right = '' } = {}) {
  return `<header class="topbar">
    ${back ? `<a class="btn-icon" href="${back}" aria-label="뒤로">${icon('chevron-left', 22)}</a>` : ''}
    <h1>${esc(title)}${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</h1>
    ${right}
  </header>`;
}

export function tabbar(active) {
  const tabs = [
    ['today', '#/today', '오늘', 'house'],
    ['timeline', '#/timeline', '타임라인', 'list'],
    ['topics', '#/topics', '주제', 'layout-grid'],
    ['search', '#/search', '검색', 'search'],
    ['more', '#/more', '더보기', 'ellipsis'],
  ];
  return `<nav class="tabbar" aria-label="주요 화면">
    ${tabs
      .map(([k, href, label, ic]) =>
        `<a href="${href}"${k === active ? ' aria-current="page"' : ''}>${icon(ic, 20)}<span>${label}</span></a>`)
      .join('')}
  </nav>`;
}
