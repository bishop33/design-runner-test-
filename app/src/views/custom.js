// 사용자 추가 항목 — 기본 목록에 없는 우리 집 일을 직접 넣습니다.

import * as store from '../store.js';
import { getContent } from '../model.js';
import { esc, itemList } from '../ui.js';
import { icon } from '../icons.js';

export default {
  async render({ view }) {
    const c = getContent();
    const mine = view.all.filter((i) => i.custom);

    return `
    <header class="topbar">
      <a class="btn-icon" href="#/more" aria-label="더보기">${icon('chevron-left', 22)}</a>
      <h1>직접 추가한 항목<span class="sub">${mine.length}개</span></h1>
    </header>
    <main class="main" id="main">
      <section class="section">
        <header><h2>새 항목</h2></header>
        <label class="field"><span>할 일</span>
          <input type="text" data-role="title" placeholder="예: 산모수첩 챙기기" maxlength="60"></label>
        <label class="field"><span>어느 시기에 두나요</span>
          <select data-role="band">
            ${c.bands.map((b) => `<option value="${b.id}">${esc(b.phase)} · ${esc(b.band)}</option>`).join('')}
          </select></label>
        <label class="field"><span>주제</span>
          <select data-role="topic">${c.meta.topics.map((t) => `<option>${esc(t)}</option>`).join('')}</select></label>
        <label class="field"><span>중요도</span>
          <select data-role="importance">${c.meta.importanceOrder.map((t) => `<option${t === '권장' ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
        <label class="field"><span>메모<span class="desc">왜 필요한지 한 줄</span></span>
          <input type="text" data-role="summary" maxlength="120"></label>
        <button class="btn btn-primary" data-role="add" style="margin-top:var(--s2)">${icon('plus', 18)} 추가하기</button>
      </section>

      <section class="section">
        <header><h2>추가한 항목</h2></header>
        ${mine.length ? itemList(mine, { showPhase: true }) : '<p class="empty">아직 없습니다.</p>'}
        ${mine.length ? `<ul class="divide" style="padding-top:var(--s2)">${mine
          .map((m) => `<li class="note-item"><div class="who">${esc(m.title)}
            <button class="btn-quiet" data-role="del" data-id="${m.id}">${icon('trash-2', 12)} 삭제</button></div></li>`)
          .join('')}</ul>` : ''}
      </section>
    </main>`;
  },

  mount({ root }) {
    const c = getContent();
    root.querySelector('[data-role="add"]').addEventListener('click', async () => {
      const title = root.querySelector('[data-role="title"]').value.trim();
      if (!title) return;
      const band = c.bandById[root.querySelector('[data-role="band"]').value];
      await store.addCustomItem({
        title,
        summary: root.querySelector('[data-role="summary"]').value.trim(),
        topic: root.querySelector('[data-role="topic"]').value,
        importance: root.querySelector('[data-role="importance"]').value,
        phase: band.phase,
        band: band.band,
        bandId: band.id,
        anchor: band.anchor,
        start: band.start,
        end: band.end,
        unit: band.unit,
      });
    });

    root.querySelectorAll('[data-role="del"]').forEach((el) =>
      el.addEventListener('click', () => store.removeCustomItem(el.dataset.id)));
  },
};
