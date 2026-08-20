// 화면 공통 조각. 상태·중요도·유형의 시각 체계를 여기 한 곳에서만 정의합니다.

import { icon } from './icons.js';
import { STATUSES } from './store.js';

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
    aria-label="${esc(item.title)} 상태: ${esc(st)}. 눌러서 다음 상태로 바꿉니다" title="${esc(st)}">
    ${icon(STATUS_ICON[st] || 'circle', 22)}</button>`;
}

export function importanceTag(imp) {
  return `<span class="imp" data-imp="${esc(imp)}">${esc(imp)}</span>`;
}

/** 목록 한 줄. 타임라인·홈·검색·주제에서 같은 모양을 씁니다. */
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
      <span class="row-when${late ? ' is-late' : ''}">${esc(
        showWhen ? item.whenLabel : item.entry.doneAt || '',
      )}</span>
    </div>
  </li>`;
}

export function itemList(items, opts) {
  if (!items.length) return `<p class="empty">해당하는 항목이 없습니다.</p>`;
  return `<ul class="divide">${items.map((i) => itemRow(i, opts)).join('')}</ul>`;
}

/** 상태 버튼을 누르면 다음 상태로. 완료 다음은 확인 전으로 돌아옵니다. */
export function nextStatus(cur) {
  const i = STATUSES.indexOf(cur);
  return STATUSES[(i + 1) % STATUSES.length];
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
