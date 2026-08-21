// 라우터와 앱 셸. 해시 라우팅으로 서버 없이 정적 파일만으로 동작합니다.

import * as store from './store.js';
import { loadContent, buildView } from './model.js';
import { tabbar, toggleStatus } from './ui.js';
import * as order from './order.js';
import * as toast from './toast.js';

import onboarding from './views/onboarding.js';
import today from './views/today.js';
import timeline from './views/timeline.js';
import topics from './views/topics.js';
import detail from './views/detail.js';
import search from './views/search.js';
import custom from './views/custom.js';
import activity from './views/activity.js';
import settings from './views/settings.js';
import more from './views/more.js';

const routes = [
  [/^\/onboarding$/, onboarding, null],
  [/^\/today$/, today, 'today'],
  [/^\/timeline$/, timeline, 'timeline'],
  [/^\/topics$/, topics, 'topics'],
  [/^\/topics\/(.+)$/, topics, 'topics'],
  [/^\/item\/(.+)$/, detail, null],
  [/^\/search$/, search, 'search'],
  [/^\/custom$/, custom, 'more'],
  [/^\/activity$/, activity, 'more'],
  [/^\/settings$/, settings, 'more'],
  [/^\/more$/, more, 'more'],
];

const root = document.getElementById('app');
/** 화면별로 유지되는 UI 상태(필터·펼침). 저장하지 않습니다. */
export const ui = { timeline: null, topic: null, search: '' };

/**
 * 화면별 스크롤 위치. 목록에서 상세로 들어갔다 돌아왔을 때
 * 보던 자리로 돌아오지 않으면 긴 목록에서 길을 잃습니다.
 */
const scrollByPath = new Map();
let activePath = null;

window.addEventListener(
  'scroll',
  () => {
    if (activePath) scrollByPath.set(activePath, window.scrollY);
  },
  { passive: true },
);

function parse() {
  const h = location.hash.replace(/^#/, '') || '/today';
  for (const [re, view, tab] of routes) {
    const m = re.exec(h);
    if (m) return { view, tab, params: m.slice(1).map(decodeURIComponent), path: h };
  }
  return { view: today, tab: 'today', params: [], path: '/today' };
}

let current = null;

export async function render() {
  const s = store.get();
  const route = parse();

  if (!s.onboarded && route.view !== onboarding) {
    location.hash = '#/onboarding';
    return;
  }

  const view = buildView();
  current = { route, view };

  // 화면이 바뀌면 목록 순서 잠금을 풉니다. 같은 화면에 머무는 동안에는 유지됩니다.
  if (route.path !== activePath) {
    order.release();
    toast.hide();
  }

  const html = await route.view.render({ view, params: route.params, ui });
  root.innerHTML = `<div class="shell">${html}${route.tab ? tabbar(route.tab) : ''}</div>`;
  root.removeAttribute('aria-busy');
  route.view.mount?.({ root, view, params: route.params, ui, render });

  activePath = route.path;
  window.scrollTo(0, scrollByPath.get(route.path) ?? 0);
}

/* 목록 어디서나 같은 동작: 줄을 누르면 상세, 상태 아이콘을 누르면 다음 상태. */
root.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('[data-act]');
  if (!btn || !current) return;
  const act = btn.dataset.act;
  const item = current.view.byId[btn.dataset.id];

  if (act === 'open' && item) {
    store.rememberOpened(item.id);
    location.hash = `#/item/${encodeURIComponent(item.id)}`;
    return;
  }
  if (act === 'cycle' && item) {
    ev.preventDefault();
    const prev = item.status;
    const next = toggleStatus(prev);
    await store.setStatus(item, next);
    toast.show(next === '완료' ? '완료로 기록했어요' : '완료를 취소했어요', {
      undo: () => store.setStatus(item, prev),
    });
  }
});

window.addEventListener('hashchange', render);

store.subscribe((_state, hint) => {
  // 상태 하나 바뀔 때마다 356줄을 다시 그리면 손끝에서 멈춤이 느껴집니다.
  // 화면이 부분 갱신을 지원하면 그쪽에 먼저 맡깁니다.
  if (hint?.kind === 'status' && current?.route.view.patch) {
    const view = buildView();
    if (current.route.view.patch({ root, view, ui, itemId: hint.itemId })) {
      current.view = view;
      return;
    }
  }
  render();
});

(async function boot() {
  try {
    await Promise.all([store.init(), loadContent()]);
    if (store.get().onboarded) await store.touchVisit();
    await render();
  } catch (e) {
    root.innerHTML = `<div class="shell"><main class="main"><p class="boot">${e.message}<br>
      <span class="hint">app/ 폴더를 정적 서버로 열어 주세요. file:// 로는 데이터를 읽지 못합니다.</span></p></main></div>`;
    console.error(e);
  }
})();
