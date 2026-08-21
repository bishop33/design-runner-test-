// 검색 — 제목·주제·세부 주제·요약을 대상으로 합니다.

import { search as runSearch } from '../model.js';
import { frozen } from '../order.js';
import { esc, itemList } from '../ui.js';

export default {
  async render({ view, ui }) {
    const q = ui.search;
    const hits = frozen(`search:${q}`, () => runSearch(view, q), view.byId);
    return `
    <header class="topbar"><h1>검색</h1></header>
    <main class="main" id="main">
      <div style="padding-top:var(--s2)">
        <input type="search" data-role="q" value="${esc(q)}" placeholder="예: 출산가방, 예방접종, 조리원"
          aria-label="검색어" enterkeyhint="search" autocomplete="off" autocorrect="off"
          autocapitalize="off" spellcheck="false">
      </div>
      ${q
        ? `<section class="section"><header><h2>결과</h2><span class="count">${hits.length}개</span></header>
           ${itemList(hits, { showPhase: true })}</section>`
        : `<p class="hint" style="padding-top:var(--s3)">제목·주제·세부 주제·요약에서 찾습니다.</p>`}
    </main>`;
  },

  mount({ root, ui, render }) {
    const el = root.querySelector('[data-role="q"]');
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    let t;
    el.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { ui.search = el.value; render(); }, 200);
    });
    // 모바일 키보드의 '검색'을 누르면 키보드를 내리고 결과를 봅니다.
    el.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      clearTimeout(t);
      el.blur();
      ui.search = el.value;
      render();
    });
  },
};
