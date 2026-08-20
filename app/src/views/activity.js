// 부부 활동 내역 — 누가 무엇을 언제 바꿨는지.

import * as store from '../store.js';
import { esc } from '../ui.js';
import { icon } from '../icons.js';
import { fmtStamp } from '../dates.js';

export default {
  async render() {
    const s = store.get();
    const log = s.activity;
    const byMember = s.profile.members.map((m) => ({
      name: m.name,
      n: log.filter((e) => e.by === m.id).length,
    }));

    return `
    <header class="topbar">
      <a class="btn-icon" href="#/today" aria-label="오늘">${icon('chevron-left', 22)}</a>
      <h1>부부 활동 내역<span class="sub">${log.length}건</span></h1>
    </header>
    <main class="main" id="main">
      <section class="now">
        <div class="marks">${byMember.map((m) => `<span>${esc(m.name)} <b>${m.n}건</b></span>`).join('')}</div>
      </section>
      <section class="section">
        ${log.length
          ? `<dl class="log">${log
              .map((e) => `<dt>${esc(fmtStamp(e.at))}</dt>
                <dd>${esc(store.memberName(e.by))} · ${esc(e.kind)}
                <a href="#/item/${encodeURIComponent(e.itemId)}">${esc(e.title)}</a>
                ${e.detail ? `<span class="hint">${esc(e.detail)}</span>` : ''}</dd>`)
              .join('')}</dl>`
          : '<p class="empty">아직 변경 내역이 없습니다.</p>'}
      </section>
    </main>`;
  },
};
