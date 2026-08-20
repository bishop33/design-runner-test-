// 설정 및 가족 정보 — 기준일, 우리 상황, 함께 쓰는 사람, 데이터.

import * as store from '../store.js';
import { getContent } from '../model.js';
import { esc } from '../ui.js';
import { icon } from '../icons.js';
import { toISO } from '../dates.js';

const YN = [['예', true], ['아니오', false], ['아직 모름', null]];

function seg(field, options, value) {
  return `<div class="seg" role="group">${options
    .map(([label, v]) => `<button type="button" data-seg="${field}" data-value='${JSON.stringify(v)}'
      aria-pressed="${JSON.stringify(v) === JSON.stringify(value)}">${esc(label)}</button>`)
    .join('')}</div>`;
}

function field(label, desc, control) {
  return `<label class="field"><span>${esc(label)}${desc ? `<span class="desc">${esc(desc)}</span>` : ''}</span>${control}</label>`;
}

export default {
  async render({ view }) {
    const p = store.get().profile;
    const a = view.anchors;
    const c = getContent();

    return `
    <header class="topbar">
      <a class="btn-icon" href="#/more" aria-label="더보기">${icon('chevron-left', 22)}</a>
      <h1>설정 · 가족 정보</h1>
    </header>
    <main class="main" id="main">
      <section class="section">
        <header><h2>기준일</h2><span class="count">모든 일정의 계산 기준</span></header>
        ${field('출산 예정일', '', `<input type="date" data-date="dueDate" value="${esc(p.dueDate)}">`)}
        ${field('병원 입원 예정일', '', `<input type="date" data-date="admissionDate" value="${esc(p.admissionDate)}">`)}
        ${field('출생일', '아기가 태어나면 입력합니다', `<input type="date" data-date="birthDate" value="${esc(p.birthDate)}">`)}
        ${field('조리원 입소일', `비우면 출생일 + 3일로 추정합니다 (현재 ${esc(toISO(a.careIn))})`, `<input type="date" data-date="careCenterInDate" value="${esc(p.careCenterInDate)}">`)}
        ${field('집 복귀일', `비우면 조리원 입소일 + 14일로 추정합니다 (현재 ${esc(toISO(a.home))})`, `<input type="date" data-date="homeReturnDate" value="${esc(p.homeReturnDate)}">`)}
      </section>

      <section class="section">
        <header><h2>우리 상황</h2><span class="count">항목 우선순위와 숨김에 씁니다</span></header>
        ${field('출산 방법', '', seg('deliveryPlan', [['자연분만', '자연분만'], ['유도분만', '유도분만'], ['제왕절개', '제왕절개'], ['아직 모름', '아직 모름']], p.deliveryPlan))}
        ${field('첫째인가요', '', seg('firstBaby', [['첫째', true], ['둘째 이상', false]], p.firstBaby))}
        ${field('조리원 이용', '', seg('usesCareCenter', YN, p.usesCareCenter))}
        ${field('자가용', '', seg('hasCar', YN, p.hasCar))}
        ${field('부모님 도움', '', seg('parentsHelp', YN, p.parentsHelp))}
        ${field('회사 휴가·제도', '', seg('hasCompanyLeave', YN, p.hasCompanyLeave))}
        ${field('반려동물', '', seg('hasPet', YN, p.hasPet))}
        ${field('산후도우미 이용', '', seg('usesPostpartumHelper', YN, p.usesPostpartumHelper))}
        ${field('어린이집 계획', '', seg('plansDaycare', YN, p.plansDaycare))}
        ${field('해당 없는 항목 숨기기', `현재 ${view.hiddenCount}개 숨김`, seg('hideNonApplicable', [['숨김', true], ['모두 보기', false]], p.hideNonApplicable))}
      </section>

      <section class="section">
        <header><h2>함께 쓰는 사람</h2></header>
        ${p.members.map((m, i) => field(`이름 ${i + 1}`, '', `<input type="text" data-member="${m.id}" value="${esc(m.name)}" maxlength="12">`)).join('')}
        ${field('지금 기록하는 사람', '상태 변경과 메모에 이 이름이 남습니다',
          seg('activeMemberId', p.members.map((m) => [m.name, m.id]), p.activeMemberId))}
      </section>

      <section class="section">
        <header><h2>데이터</h2></header>
        <p class="hint">콘텐츠 ${c.meta.itemCount}개 · 원본 시트에서 생성 · 검토 상태 전부 "초안".
          공식 출처 미기재 ${c.meta.gaps['공식 출처 미기재']}개, 예상 비용 미기재 ${c.meta.gaps['예상 비용 미기재']}개.</p>
        <p class="hint">기록은 이 브라우저(localStorage)에만 저장됩니다.</p>
        <button class="btn" data-role="export" style="margin-top:var(--s2)">${icon('external-link', 16)} 기록 내려받기 (JSON)</button>
        <button class="btn" data-role="reset" style="margin-top:var(--s1)">${icon('trash-2', 16)} 모든 기록 지우기</button>
      </section>
    </main>`;
  },

  mount({ root }) {
    root.querySelectorAll('[data-date]').forEach((el) =>
      el.addEventListener('change', () => store.saveProfile({ [el.dataset.date]: el.value })));

    root.querySelectorAll('[data-seg]').forEach((el) =>
      el.addEventListener('click', () => store.saveProfile({ [el.dataset.seg]: JSON.parse(el.dataset.value) })));

    root.querySelectorAll('[data-member]').forEach((el) =>
      el.addEventListener('change', () => {
        const members = store.get().profile.members.map((m) =>
          m.id === el.dataset.member ? { ...m, name: el.value.trim() || m.name } : m);
        store.saveProfile({ members });
      }));

    root.querySelector('[data-role="export"]').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(store.get(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'junbi-record.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    root.querySelector('[data-role="reset"]').addEventListener('click', async () => {
      if (!confirm('상태·메모·추가 항목을 모두 지웁니다. 되돌릴 수 없습니다.')) return;
      await store.resetAll();
      location.hash = '#/onboarding';
    });
  },
};
