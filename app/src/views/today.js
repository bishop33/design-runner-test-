// 오늘 — 대시보드가 아니라 '지금 해야 할 일'이 먼저 보이는 화면.

import * as store from '../store.js';
import { nowList, soonList, recentlyDone, unchecked } from '../model.js';
import { esc, itemList, tabbar } from '../ui.js';
import { icon } from '../icons.js';
import { stageLabel, diffDays, today as td, fmtShort, fmtStamp, fmtFull } from '../dates.js';

function dday(label, date, { est = false } = {}) {
  if (!date) return '';
  const d = diffDays(date, td());
  const rel = d === 0 ? 'D-day' : d > 0 ? `D-${d}` : `D+${-d}`;
  return `${label} <b>${rel}</b> ${fmtShort(date)}${est ? ' 추정' : ''}`;
}

/** 출산 전에는 예정일·입원일, 출산 후에는 출생일·조리원·집 복귀일을 보여 줍니다. */
function marks(a, profile) {
  if (a.hasBirth) {
    return [
      dday('출생일', a.birth),
      profile.usesCareCenter !== false ? dday('조리원 입소', a.careIn, { est: a.estimated.careIn }) : '',
      dday('집 복귀', a.home, { est: a.estimated.home }),
    ].filter(Boolean);
  }
  return [
    dday('출산 예정일', a.due),
    dday('입원일', a.admission, { est: a.estimated.admission }),
  ].filter(Boolean);
}

export default {
  async render({ view }) {
    const s = store.get();
    const a = view.anchors;
    const first = nowList(view, 5);
    const soon = soonList(view, 6, first);
    const done = recentlyDone(view, 4);
    const miss = unchecked(view, 4).filter((i) => !first.some((f) => f.id === i.id));
    const log = s.activity.slice(0, 5);

    return `
    <header class="topbar">
      <h1>오늘<span class="sub">${esc(fmtFull(td()))}</span></h1>
      <a class="btn-icon" href="#/activity" aria-label="부부 활동 내역">${icon('users', 20)}</a>
    </header>

    <main class="main" id="main">
      <section class="now">
        <h2>${esc(stageLabel(a) || '날짜를 입력해 주세요')}</h2>
        <div class="marks">${marks(a, s.profile).map((m) => `<span>${m}</span>`).join('')}</div>
      </section>

      <section class="section">
        <header><h2>지금 먼저 할 일</h2><span class="count">${first.length}개</span></header>
        ${itemList(first, { showPhase: true })}
      </section>

      ${miss.length ? `<section class="section">
        <header><h2>아직 확인하지 않은 중요 항목</h2><span class="count">${miss.length}개</span></header>
        ${itemList(miss, { showPhase: true })}
      </section>` : ''}

      <section class="section">
        <header><h2>곧 해야 할 일</h2><a class="more" href="#/timeline">타임라인 전체</a></header>
        ${itemList(soon, { showPhase: true })}
      </section>

      ${done.length ? `<section class="section">
        <header><h2>최근 완료한 일</h2></header>
        ${itemList(done, { showPhase: true })}
      </section>` : ''}

      <section class="section">
        <header><h2>부부가 남긴 기록</h2><a class="more" href="#/activity">전체 보기</a></header>
        ${log.length
          ? `<dl class="log">${log
              .map((e) => `<dt>${esc(fmtStamp(e.at))}</dt><dd>${esc(store.memberName(e.by))} · ${esc(e.kind)}
                 <a href="#/item/${encodeURIComponent(e.itemId)}">${esc(e.title)}</a>
                 <span class="hint">${esc(e.detail || '')}</span></dd>`)
              .join('')}</dl>`
          : '<p class="empty">아직 기록이 없습니다. 항목 왼쪽 동그라미를 눌러 상태를 바꿔 보세요.</p>'}
      </section>

      <section class="section">
        <header><h2>둘러보기</h2></header>
        <div class="seg">
          <a class="btn" href="#/timeline">${icon('list', 18)} 전체 타임라인</a>
          <a class="btn" href="#/topics">${icon('layout-grid', 18)} 주제별 탐색</a>
          <a class="btn" href="#/custom">${icon('plus', 18)} 항목 추가</a>
        </div>
      </section>
    </main>`;
  },
};
