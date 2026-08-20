// 더보기 — 자주 쓰지 않는 화면 모음.

import * as store from '../store.js';
import { esc } from '../ui.js';
import { icon } from '../icons.js';

export default {
  async render({ view }) {
    const s = store.get();
    const mine = view.all.filter((i) => i.custom).length;
    const links = [
      ['#/custom', 'plus', '직접 추가한 항목', `${mine}개`],
      ['#/activity', 'users', '부부 활동 내역', `${s.activity.length}건`],
      ['#/settings', 'settings', '설정 · 가족 정보', ''],
    ];
    return `
    <header class="topbar"><h1>더보기</h1></header>
    <main class="main" id="main">
      <ul class="divide">
        ${links.map(([href, ic, label, meta]) => `<li><a class="row row-plain" href="${href}">
          <span class="status-btn">${icon(ic, 20)}</span>
          <span class="row-body"><span class="row-title">${esc(label)}</span></span>
          <span class="row-when">${esc(meta)}</span></a></li>`).join('')}
      </ul>
      <p class="hint" style="padding-top:var(--s4)">기록은 이 브라우저에만 저장됩니다.
        의료·행정 내용은 공식 출처와 담당 의료진 안내를 먼저 확인하세요.</p>
    </main>`;
  },
};
