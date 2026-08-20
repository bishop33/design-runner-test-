// 주제별 목록 — 타임라인과 같은 원본을 주제 축으로 봅니다.
// 비용은 주제가 아니라 항목의 속성이므로 여기 목록에 넣지 않습니다.

import { getContent } from '../model.js';
import { esc, itemList } from '../ui.js';
import { icon } from '../icons.js';

export default {
  async render({ view, params }) {
    const c = getContent();
    const topic = params[0] || null;

    if (!topic) {
      const rows = c.meta.topics.map((t) => {
        const items = view.visible.filter((i) => i.topic === t);
        const done = items.filter((i) => i.done).length;
        const subs = [...new Set(items.map((i) => i.subtopic))];
        return `<li><a class="row row-plain" href="#/topics/${encodeURIComponent(t)}">
          <span class="row-body">
            <span class="row-title">${esc(t)}</span>
            <span class="row-meta">${subs.slice(0, 3).map(esc).join(' · ')}${subs.length > 3 ? ` 외 ${subs.length - 3}` : ''}</span>
          </span>
          <span class="row-when">${done}/${items.length}</span>
        </a></li>`;
      }).join('');

      return `
      <header class="topbar"><h1>주제별로 보기<span class="sub">${c.meta.itemCount}개 항목</span></h1></header>
      <main class="main" id="main"><ul class="divide">${rows}</ul></main>`;
    }

    const items = view.visible.filter((i) => i.topic === topic);
    const bySub = new Map();
    for (const i of items) {
      if (!bySub.has(i.subtopic)) bySub.set(i.subtopic, []);
      bySub.get(i.subtopic).push(i);
    }

    return `
    <header class="topbar">
      <a class="btn-icon" href="#/topics" aria-label="주제 목록">${icon('chevron-left', 22)}</a>
      <h1>${esc(topic)}<span class="sub">${items.length}개 항목</span></h1>
    </header>
    <main class="main" id="main">
      ${[...bySub.entries()].map(([sub, list]) => `
        <section class="section">
          <header><h2>${esc(sub)}</h2><span class="count">${list.filter((i) => i.done).length}/${list.length}</span></header>
          ${itemList(list.sort((a, b) => a.no - b.no), { showPhase: true })}
        </section>`).join('')}
    </main>`;
  },
};
