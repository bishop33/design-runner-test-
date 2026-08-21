// 온보딩 — 일정 계산과 개인화에 필요한 최소 정보만 받습니다.

import * as store from '../store.js';
import { esc } from '../ui.js';
import { icon } from '../icons.js';
import { toISO, addDays, today } from '../dates.js';

const draft = {};
/** 상황 질문은 접어 둡니다. 첫 화면은 날짜 두 개와 시작하기까지만 보이면 됩니다. */
let open = false;

const YN = [
  ['예', true],
  ['아니오', false],
  ['아직 모름', null],
];

function seg(name, options, value) {
  return `<div class="seg" role="group">${options
    .map(([label, v]) => {
      const on = JSON.stringify(v) === JSON.stringify(value);
      return `<button type="button" data-field="${name}" data-value='${JSON.stringify(v)}' aria-pressed="${on}">${esc(label)}</button>`;
    })
    .join('')}</div>`;
}

function field(label, desc, control) {
  return `<label class="field"><span>${esc(label)}${desc ? `<span class="desc">${esc(desc)}</span>` : ''}</span>${control}</label>`;
}

export default {
  async render() {
    const p = { ...store.get().profile, ...draft };
    const defaultDue = toISO(addDays(today(), 30));

    return `
    <header class="topbar"><h1>준비<span class="sub">임신부터 출산 후 24개월까지</span></h1></header>
    <main class="main onb" id="main">
      <div class="lead">
        <h2>먼저 두 가지 날짜만 알려 주세요</h2>
        <p>이 날짜로 모든 항목의 시기를 계산합니다. 나머지는 건너뛰어도 되고 설정에서 언제든 바꿀 수 있습니다.</p>
      </div>

      ${field('출산 예정일', '임신 주차 계산의 기준입니다', `<input type="date" data-field="dueDate" value="${esc(p.dueDate || defaultDue)}" required>`)}
      ${field('병원 입원 예정일', '비워 두면 출산 예정일 하루 전으로 계산합니다', `<input type="date" data-field="admissionDate" value="${esc(p.admissionDate)}">`)}
      ${field('아기가 태어났다면 출생일', '출산 전이라면 비워 둡니다', `<input type="date" data-field="birthDate" value="${esc(p.birthDate)}">`)}

      <div class="steps" style="padding-top:var(--s4)">지금 계획 중인 출산 방법</div>
      ${seg('deliveryPlan', [['자연분만', '자연분만'], ['유도분만', '유도분만'], ['제왕절개', '제왕절개'], ['아직 모름', '아직 모름']], p.deliveryPlan)}

      <button type="button" class="fold" data-role="fold" aria-expanded="${open}">
        ${icon(open ? 'chevron-down' : 'chevron-right', 18)}
        우리 상황 알려주기<span class="desc">건너뛰어도 돼요</span>
      </button>

      <div class="fold-body"${open ? '' : ' hidden'}>
        <p class="hint">해당하지 않는 항목을 숨기고, 필요한 항목을 앞으로 당깁니다. 설정에서 언제든 바꿉니다.</p>
        ${field('첫째인가요', '', seg('firstBaby', [['첫째예요', true], ['둘째 이상', false]], p.firstBaby))}
        ${field('조리원을 이용하나요', '아니오를 고르면 조리원 항목을 기본으로 숨깁니다', seg('usesCareCenter', YN, p.usesCareCenter))}
        ${field('자가용이 있나요', '퇴원·이동 준비 우선순위에 씁니다', seg('hasCar', YN, p.hasCar))}
        ${field('출산 후 부모님 도움을 받나요', '', seg('parentsHelp', YN, p.parentsHelp))}
        ${field('회사 휴가·제도를 쓸 수 있나요', '', seg('hasCompanyLeave', YN, p.hasCompanyLeave))}
        ${field('반려동물이 있나요', '', seg('hasPet', YN, p.hasPet))}
        ${field('산후도우미를 이용할 계획인가요', '', seg('usesPostpartumHelper', YN, p.usesPostpartumHelper))}
        ${field('어린이집 이용을 계획하나요', '', seg('plansDaycare', YN, p.plansDaycare))}

        <div class="steps" style="padding-top:var(--s3)">함께 쓰는 사람</div>
        ${field('내 이름', '항목을 누가 완료했는지 표시할 때 씁니다', `<input type="text" data-field="m1" value="${esc(p.members[0].name)}" maxlength="12">`)}
        ${field('배우자 이름', '', `<input type="text" data-field="m2" value="${esc(p.members[1].name)}" maxlength="12">`)}
      </div>

      <div class="notice" style="margin-top:var(--s3)">
        ${icon('info', 18)}
        <span>기록은 이 기기의 브라우저에만 저장됩니다. 의료·지원 정책·비용은 반드시 공식 출처와 의료진 안내를 함께 확인하세요.</span>
      </div>

      <div class="onb-foot">
        <button class="btn btn-primary" data-act="start">시작하기</button>
      </div>
    </main>`;
  },

  mount({ root, render }) {
    root.querySelector('[data-role="fold"]').addEventListener('click', () => {
      open = !open;
      render();
    });

    root.querySelectorAll('[data-field]').forEach((el) => {
      if (el.tagName === 'BUTTON') {
        el.addEventListener('click', () => {
          draft[el.dataset.field] = JSON.parse(el.dataset.value);
          render();
        });
      } else {
        el.addEventListener('input', () => {
          draft[el.dataset.field] = el.value;
        });
      }
    });

    root.querySelector('[data-act="start"]').addEventListener('click', async () => {
      const p = { ...store.get().profile, ...draft };
      const dueInput = root.querySelector('[data-field="dueDate"]');
      if (!p.dueDate) p.dueDate = dueInput.value;
      if (!p.dueDate) {
        dueInput.focus();
        return;
      }
      const members = [
        { id: 'm1', name: (draft.m1 ?? p.members[0].name).trim() || '나' },
        { id: 'm2', name: (draft.m2 ?? p.members[1].name).trim() || '배우자' },
      ];
      delete p.m1;
      delete p.m2;
      await store.saveProfile({ ...p, members }, { onboarded: true });
      location.hash = '#/today';
    });
  },
};
