// 라우터와 앱 셸. 해시 라우팅으로 서버 없이 정적 파일만으로 동작합니다.

import * as store from './store.js';
import { loadContent, buildView } from './model.js';
import { tabbar, nextStatus } from './ui.js';

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

  const html = await route.view.render({ view, params: route.params, ui });
  root.innerHTML = `<div class="shell">${html}${route.tab ? tabbar(route.tab) : ''}</div>`;
  root.removeAttribute('aria-busy');
  route.view.mount?.({ root, view, params: route.params, ui, render });

  if (!location.hash.includes('#/item/')) window.scrollTo(0, 0);
}

/* 목록 어디서나 같은 동작: 제목을 누르면 상세, 상태 아이콘을 누르면 다음 상태. */
root.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('[data-act]');
  if (!btn || !current) return;
  const act = btn.dataset.act;
  const item = current.view.byId[btn.dataset.id];

  if (act === 'open' && item) {
    location.hash = `#/item/${encodeURIComponent(item.id)}`;
    return;
  }
  if (act === 'cycle' && item) {
    ev.preventDefault();
    await store.setStatus(item, nextStatus(item.status));
  }
});

window.addEventListener('hashchange', render);
store.subscribe(() => render());

(async function boot() {
  try {
    await Promise.all([store.init(), loadContent()]);
    await render();
  } catch (e) {
    root.innerHTML = `<div class="shell"><main class="main"><p class="boot">${e.message}<br>
      <span class="hint">app/ 폴더를 정적 서버로 열어 주세요. file:// 로는 데이터를 읽지 못합니다.</span></p></main></div>`;
    console.error(e);
  }
})();
