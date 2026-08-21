// 오늘 — 대시보드가 아니라 '지금 해야 할 일'이 먼저 보이는 화면.

import * as store from '../store.js';
import { nowList, soonList, recentlyDone, currentBandId } from '../model.js';
import { frozen } from '../order.js';
import { esc, itemList, patchRow } from '../ui.js';
import { icon } from '../icons.js';
import { stageLabel, diffDays, today as td, fmtShort, fmtStamp, fmtFull } from '../dates.js';

function dday(label, date, { est = false } = {}) {
  if (!date) return '';
  const d = diffDays(date, td());
  const rel = d === 0 ? 'D-day' : d > 0 ? `D-${d}` : `D+${-d}`;
  return `${label} <b>${rel}</b> ${fmtShort(date)}${est ? ' 추정' : ''}`;
}

/** 상단바는 스크롤해도 남습니다. 가장 자주 확인하는 한 마디만 압축해 둡니다. */
function shortMark(a) {
  const target = a.hasBirth ? null : a.due;
  if (!target) return '';
  const d = diffDays(target, td());
  return d >= 0 ? `출산 D-${d}` : `출산 예정일 ${-d}일 지남`;
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

/**
 * 여정 진행 바. 임신 중에는 40주, 출산 후에는 24개월을 기준으로 채웁니다.
 * 예정일·출생일에서 계산되는 값이라 콘텐츠를 만들어내는 것이 아닙니다.
 * 홈에서 채도색은 이 채움과 탭 아이콘 두 곳뿐입니다.
 */
function journeyBar(a) {
  const now = td();
  let pct = null;
  let cap = '';
  if (a.hasBirth && a.birth && now >= a.birth) {
    const m = diffDays(now, a.birth) / 30.44;
    pct = Math.min(100, (m / 24) * 100);
    cap = '생후 24개월까지';
  } else if (a.lmp) {
    const w = diffDays(now, a.lmp) / 7;
    if (w >= 0) {
      pct = Math.min(100, (w / 40) * 100);
      cap = '40주 중';
    }
  }
  if (pct === null) return '';
  return `<div class="journey" role="img" aria-label="${cap} ${Math.round(pct)}% 지남">
    <span class="journey-fill" style="width:${pct.toFixed(1)}%"></span>
  </div>`;
}

/** 주 단위 라벨 (일 단위 제외) — '임신 38주', '생후 2개월' 처럼 굵은 전환만 잡습니다. */
function coarseStage(a) {
  const l = stageLabel(a);
  return l.replace(/ \d+일$/, '');
}

let stageNews = null; // 이번 세션에서 감지한 주차 전환 (렌더 간 유지)
let stageChecked = false;

export default {
  /** 순서를 잠가 두므로 목록 구성이 안 바뀝니다. 그 줄과 숫자만 고칩니다. */
  patch({ root, view, itemId }) {
    const item = view.byId[itemId];
    const btn = root.querySelector(`.status-btn[data-id="${itemId}"]`);
    if (!item || !btn) return false;
    patchRow(btn.closest('.row'), item, { showWhen: true });

    const leftEl = root.querySelector('[data-role="left"]');
    if (leftEl) {
      const ids = [...root.querySelectorAll('[data-first] .status-btn')].map((b) => b.dataset.id);
      const left = ids.filter((id) => !view.byId[id]?.done).length;
      leftEl.textContent = `${left}개 남음`;
    }
    const progEl = root.querySelector('[data-role="bandprog"]');
    if (progEl && item.bandId === progEl.dataset.band) {
      const all = view.visible.filter((i) => i.bandId === item.bandId);
      progEl.querySelector('b').textContent = all.filter((i) => i.done).length;
    }
    return true;
  },

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

    // ── 지난 방문 이후 ─ 다시 열었을 때 "그동안 무슨 일이 있었나" 부터 보여 줍니다.
    // 배우자의 활동이 핵심입니다. 내가 한 일은 내가 압니다.
    const prevAt = store.prevVisitAt();
    const me = s.profile.activeMemberId;
    const sincePartner = prevAt
      ? s.activity.filter((e) => e.at > prevAt && e.by !== me)
      : [];
    const partnerDone = sincePartner.filter((e) => e.kind === '상태' && /→ 완료$/.test(e.detail || ''));
    const partnerNotes = sincePartner.filter((e) => e.kind === '메모');
    const resume = s.lastOpenedItem && !view.byId[s.lastOpenedItem]?.done ? view.byId[s.lastOpenedItem] : null;

    // ── 이 시기 알아두기 ─ 지금 구간의 가이드·증상 중 아직 안 읽은 것.
    // 할 일만 쌓으면 앱이 숙제장이 됩니다. 왜 이 시기가 특별한지도 함께 보여 줍니다.
    // 주가 바뀐 첫 방문에는 이 묶음이 "00주차가 됐어요" 로 승격되고 세 개를 보여 줍니다.
    if (!stageChecked) {
      stageChecked = true;
      stageNews = await store.stageChanged(coarseStage(a));
    }
    const learn = bandItems
      .filter((i) => (i.typeGroup === 'guide' || i.typeGroup === 'signal') && i.status === '확인 전')
      .sort((a, b) => b.score - a.score)
      .slice(0, stageNews ? 3 : 2);

    // 주가 바뀐 첫 방문에는 이 묶음이 "00주차가 됐어요" 로 맨 위에 옵니다.
    // 앱이 스스로 만들어내는 새로움이라, 재방문의 첫인사로 그것부터 보여 줍니다.
    const learnSection = learn.length
      ? `<section class="section">
          <header><h2>${stageNews ? `${esc(coarseStage(a))}가 됐어요` : '이 시기 알아두기'}</h2></header>
          ${stageNews ? `<p class="hint" style="margin-bottom:var(--s1)">이번 주에 새로 알아두면 좋은 것들이에요.</p>` : ''}
          ${itemList(learn)}
        </section>`
      : '';

    return `
    <header class="topbar">
      <h1>오늘<span class="sub">${esc([stageLabel(a), shortMark(a)].filter(Boolean).join(' · ') || fmtFull(td()))}</span></h1>
      <a class="btn-icon" href="#/activity" aria-label="부부 활동 내역">${icon('users', 20)}</a>
    </header>

    <main class="main" id="main">
      <section class="now">
        <h2>${esc(stageLabel(a) || '날짜를 입력해 주세요')}</h2>
        ${journeyBar(a)}
        <div class="marks">${marks(a, s.profile).map((m) => `<span>${m}</span>`).join('')}</div>
        ${bandItems.length
          ? `<p class="hint" style="margin-top:var(--s1)" data-role="bandprog" data-band="${bandId}">지금 구간 ${bandItems.length}개 중
             <b class="num">${bandDone}</b>개 완료</p>`
          : ''}
      </section>

      ${stageNews ? learnSection : ''}

      ${sincePartner.length || resume ? `<section class="section">
        <header><h2>지난 방문 이후</h2></header>
        <div class="since">
          ${partnerDone.length ? `<p>${icon('circle-check-big', 16)}
            <span><b>${esc(store.memberName(partnerDone[0].by))}</b>님이 ${partnerDone.length}개를 완료했어요
            <span class="hint">${partnerDone.slice(0, 2).map((e) => esc(e.title)).join(' · ')}${partnerDone.length > 2 ? ' 외' : ''}</span></span></p>` : ''}
          ${partnerNotes.length ? `<p>${icon('pen-line', 16)}
            <span><b>${esc(store.memberName(partnerNotes[0].by))}</b>님이 메모 ${partnerNotes.length}개를 남겼어요
            <a href="#/item/${encodeURIComponent(partnerNotes[0].itemId)}">${esc(partnerNotes[0].title)}</a></span></p>` : ''}
          ${resume ? `<p>${icon('book-open', 16)}
            <span>보던 항목 이어서 보기
            <a href="#/item/${encodeURIComponent(resume.id)}">${esc(resume.title)}</a></span></p>` : ''}
        </div>
      </section>` : ''}

      <section class="section">
        <header><h2>지금 먼저 할 일</h2><span class="count" data-role="left">${left}개 남음</span></header>
        <div data-first>${itemList(first, { showPhase: true })}</div>
        ${first.length && !left
          ? '<p class="hint">여기 있는 일은 다 했어요. 화면을 다시 열면 다음 항목이 올라옵니다.</p>'
          : ''}
      </section>

      ${stageNews ? '' : learnSection}

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
