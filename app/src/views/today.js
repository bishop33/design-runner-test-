// 오늘 — 대시보드가 아니라 '지금 해야 할 일'이 먼저 보이는 화면.

import * as store from '../store.js';
import { nowList, soonList, recentlyDone, currentBandId } from '../model.js';
import { frozen } from '../order.js';
import { esc, itemList } from '../ui.js';
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
    // 이 화면에 머무는 동안 순서를 고정합니다. 하나 완료할 때마다 목록이 다시
    // 늘어서면 두 번째 탭이 엉뚱한 줄에 떨어집니다. 완료한 항목도 자리에 남습니다.
    const first = frozen('today:now', () => nowList(view, 5), view.byId);
    const soon = frozen('today:soon', () => soonList(view, 6, first), view.byId);
    const done = recentlyDone(view, 4);
    const log = s.activity.slice(0, 5);

    // 지금 구간의 진행. 얼마나 남았는지 숫자 하나로 보여 줍니다.
    const bandId = currentBandId(view);
    const bandItems = view.visible.filter((i) => i.bandId === bandId);
    const bandDone = bandItems.filter((i) => i.done).length;
    const left = first.filter((i) => !i.done).length;

    return `
    <header class="topbar">
      <h1>오늘<span class="sub">${esc(fmtFull(td()))}</span></h1>
      <a class="btn-icon" href="#/activity" aria-label="부부 활동 내역">${icon('users', 20)}</a>
    </header>

    <main class="main" id="main">
      <section class="now">
        <h2>${esc(stageLabel(a) || '날짜를 입력해 주세요')}</h2>
        <div class="marks">${marks(a, s.profile).map((m) => `<span>${m}</span>`).join('')}</div>
        ${bandItems.length
          ? `<p class="hint" style="margin-top:var(--s1)">지금 구간 ${bandItems.length}개 중
             <b class="num">${bandDone}</b>개 완료</p>`
          : ''}
      </section>

      <section class="section">
        <header><h2>지금 먼저 할 일</h2><span class="count">${left}개 남음</span></header>
        ${itemList(first, { showPhase: true })}
        ${first.length && !left
          ? '<p class="hint">여기 있는 일은 다 했어요. 화면을 다시 열면 다음 항목이 올라옵니다.</p>'
          : ''}
      </section>

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
