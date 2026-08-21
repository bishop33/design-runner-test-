// 항목 상세 — 왜·언제·어떻게 · 비용 · 출처 · 경험담 · 상태와 기록.
// 공식 정보와 부모 경험담은 화면에서 섞지 않고 영역을 나눕니다.

import * as store from '../store.js';
import { STATUSES, GEAR_STATES, BAGS, REACTIONS } from '../store.js';
import { getContent } from '../model.js';
import { esc, importanceTag, TYPE_ICON, STATUS_ICON, itemList } from '../ui.js';
import { icon } from '../icons.js';
import * as toast from '../toast.js';
import { fmtFull, fmtStamp, toISO } from '../dates.js';

function windowText(item, anchors) {
  if (!item.window) return '기준일이 없어 계산하지 못했습니다.';
  const est = {
    출생일: anchors.estimated.birth,
    '조리원 입소일': anchors.estimated.careIn,
    '집 복귀일': anchors.estimated.home,
    입원일: anchors.estimated.admission,
  }[item.anchor];
  const range = `${fmtFull(item.window.from)} ~ ${fmtFull(item.window.to)}`;
  const basis = `${item.anchor} 기준 ${item.start}~${item.end}${item.unit}`;
  return `${range}<span class="hint"> · ${basis}${est ? ' · 기준일 추정' : ''}</span>`;
}

export default {
  async render({ view, params }) {
    const item = view.byId[params[0]];
    if (!item) {
      return `<header class="topbar"><a class="btn-icon" href="#/timeline">${icon('chevron-left', 22)}</a><h1>항목 없음</h1></header>
        <main class="main" id="main"><p class="empty">해당 항목을 찾지 못했습니다.</p></main>`;
    }

    const c = getContent();
    const s = store.get();
    const e = item.entry;
    const notes = s.notes[item.id] || [];
    const stories = s.experiences[item.id] || [];
    const related = (item.related || []).map((id) => view.byId[id]).filter(Boolean);
    const chain = item.chain ? c.chainById[item.chain] : null;
    const chainItems = chain ? chain.items.map((id) => view.byId[id]).filter(Boolean) : [];
    const isStory = item.type === '경험담';
    const isGear = item.type === '육아용품';
    const isBag = item.type === '준비 목록';

    return `
    <header class="topbar">
      <a class="btn-icon" href="#/timeline" aria-label="타임라인으로">${icon('chevron-left', 22)}</a>
      <h1>${esc(item.phase)}<span class="sub">${esc(item.band)} · ${esc(item.topic)}</span></h1>
    </header>

    <main class="main" id="main">
      <h2 class="detail-title">${esc(item.title)}</h2>
      <div class="detail-meta">
        <span class="type-mark">${icon(TYPE_ICON[item.type] || 'square-check', 14)}</span>${esc(item.type)}
        ${importanceTag(item.importance)}
        <span class="sep">·</span>${esc(item.action)}
        <span class="sep">·</span>대상 ${esc(item.audience)}
        ${item.condition !== '공통' ? `<span class="sep">·</span>${esc(item.condition)}` : ''}
      </div>

      <div class="block">
        <h3>지금 확인해야 하는 이유</h3>
        <p>${esc(item.why || item.summary || '원본에 내용이 없습니다.')}</p>
      </div>

      <div class="block">
        <h3>언제 하나요</h3>
        <p>${windowText(item, view.anchors)}</p>
      </div>

      <div class="block">
        <h3>어떻게 하나요</h3>
        <p>${esc(item.how || '원본에 내용이 없습니다.')}</p>
      </div>

      <div class="block">
        <h3>비용과 바우처</h3>
        <dl class="facts">
          <dt>${icon('coins', 14)} 예상 비용</dt>
          <dd>${item.cost ? esc(item.cost) : '확인 필요 <span class="hint">원본 데이터에 값이 없습니다</span>'}</dd>
          <dt>${icon('ticket', 14)} 바우처</dt>
          <dd>${item.voucher ? esc(item.voucher) : '확인 필요 <span class="hint">원본 데이터에 값이 없습니다</span>'}</dd>
        </dl>
      </div>

      <div class="block">
        <h3>공식 출처</h3>
        ${item.source
          ? `<p><a class="source-link" href="${esc(item.source)}" target="_blank" rel="noopener">${icon('external-link', 14)}${esc(item.source)}</a></p>`
          : '<p>연결된 공식 출처가 없습니다.</p>'}
        <p class="hint">${icon('shield-check', 12)} 출처 상태 ${esc(item.sourceStatus)} · 검토 상태 ${esc(item.reviewStatus)}</p>
        <div class="notice" style="margin-top:var(--s1)">
          ${icon('info', 18)}
          <span>의료·지원 정책·비용은 공식 출처와 담당 의료진 안내가 우선입니다. 이 화면의 내용은 확인용 목록입니다.</span>
        </div>
      </div>

      <div class="block">
        <h3>상태</h3>
        <div class="seg" role="group" aria-label="상태 변경">
          ${STATUSES.map((st) =>
            `<button type="button" data-role="status" data-value="${esc(st)}" aria-pressed="${item.status === st}">
              ${icon(STATUS_ICON[st], 16)} ${esc(st)}</button>`).join('')}
        </div>

        ${isGear ? `<div style="padding-top:var(--s2)">
          <h3>준비 상태 <span class="hint">가방에 넣었는지와는 별개입니다</span></h3>
          <div class="seg" role="group" aria-label="준비 상태">
            ${GEAR_STATES.map((g) =>
              `<button type="button" data-role="gear" data-value="${esc(g)}" aria-pressed="${e.gear === g}">${esc(g)}</button>`).join('')}
          </div></div>` : ''}

        ${isGear || isBag ? `<div style="padding-top:var(--s2)">
          <h3>가방에 넣었나요</h3>
          <div class="seg" role="group" aria-label="가방">
            ${Object.entries(BAGS).map(([k, label]) =>
              `<button type="button" data-role="bag" data-value="${k}" aria-pressed="${Boolean(e.bags?.[k])}">
                ${icon('luggage', 16)} ${esc(label)}</button>`).join('')}
          </div></div>` : ''}

        <label class="field"><span>${icon('bell', 14)} 리마인드 날짜<span class="desc">확인할 날짜를 정해 둡니다</span></span>
          <input type="date" data-role="remind" value="${esc(e.remindOn || '')}"></label>

        <label class="field"><span>${icon('clock', 14)} 완료 날짜<span class="desc">며칠 뒤에 몰아서 기록해도 됩니다</span></span>
          <input type="date" data-role="doneAt" value="${esc(e.doneAt || '')}"${item.status === '완료' ? '' : ' disabled'}></label>

        <p class="hint">${e.doneBy ? `완료한 사람 ${esc(store.memberName(e.doneBy))}` : '아직 완료하지 않았습니다.'}
          ${e.updatedAt ? ` · 최근 변경 ${esc(store.memberName(e.updatedBy))} ${esc(fmtStamp(e.updatedAt))}` : ''}</p>
      </div>

      <div class="block">
        <h3>메모 <span class="hint">부부가 함께 봅니다</span></h3>
        <textarea data-role="note" rows="3" enterkeyhint="enter"
          placeholder="예: 병원에 전화해서 확인함. 담당 간호사 안내 받음." aria-label="메모"></textarea>
        <button class="btn btn-quiet" data-role="addNote" style="margin-top:var(--s1)">${icon('plus', 14)} 메모 남기기</button>
        ${notes.map((n) => `<div class="note-item">
          <div class="who">${esc(store.memberName(n.by))} · ${esc(fmtStamp(n.at))}
            <button class="btn-quiet" data-role="delNote" data-id="${n.id}">${icon('trash-2', 12)} 삭제</button></div>
          <p>${esc(n.text)}</p></div>`).join('')}
      </div>

      <div class="block">
        <h3>${isStory ? '실제 부모 경험담' : '우리 경험 기록'} <span class="hint">공식 정보와 구분된 영역입니다</span></h3>
        <div class="seg" role="group" aria-label="반응">
          ${REACTIONS.map((r) => `<button type="button" data-role="reaction" data-value="${esc(r)}" aria-pressed="false">${esc(r)}</button>`).join('')}
        </div>
        <textarea data-role="story" placeholder="좋았던 점·아쉬웠던 점·우리에게 맞았는지를 적어 두면 다음 결정이 쉬워집니다." aria-label="경험담" rows="3" style="margin-top:var(--s1)"></textarea>
        <button class="btn btn-quiet" data-role="addStory" style="margin-top:var(--s1)">${icon('plus', 14)} 경험 남기기</button>
        ${stories.length
          ? stories.map((x) => `<div class="story"><div class="who">${esc(x.reaction)} · ${esc(store.memberName(x.by))} · ${esc(fmtStamp(x.at))}</div><p>${esc(x.text)}</p></div>`).join('')
          : '<p class="hint" style="padding-top:var(--s1)">아직 남긴 경험이 없습니다.</p>'}
      </div>

      ${chainItems.length > 1 ? `<div class="block">
        <h3>${icon('link-2', 12)} 이 일의 흐름 — ${esc(chain.name)}</h3>
        <p class="hint">알아보는 시점과 실제 신청·이용 시점이 다릅니다.</p>
        ${itemList(chainItems, { showPhase: true })}
      </div>` : ''}

      ${related.length ? `<div class="block">
        <h3>관련 항목</h3>
        ${itemList(related, { showPhase: true })}
      </div>` : ''}

      <div class="detail-act">
        <span class="state">${icon(STATUS_ICON[item.status], 14)} ${esc(item.status)}${
          e.doneAt ? ` · ${esc(fmtFull(new Date(`${e.doneAt}T00:00:00`)))} ${esc(store.memberName(e.doneBy))}` : ''
        }</span>
        <button class="btn ${item.status === '완료' ? '' : 'btn-primary'}" data-role="primary">
          ${item.status === '완료' ? '완료 취소' : '완료로 기록'}
        </button>
      </div>
    </main>`;
  },

  mount({ root, view, params, render }) {
    const item = view.byId[params[0]];
    if (!item) return;
    let reaction = REACTIONS[0];

    // 상세를 열었다는 것은 내용을 봤다는 뜻입니다. '확인했어요' 를 손으로 누르게 하지 않습니다.
    store.markSeen(item);

    root.querySelector('[data-role="primary"]').addEventListener('click', () => {
      const prev = item.status;
      const next = prev === '완료' ? '확인했어요' : '완료';
      store.setStatus(item, next);
      toast.show(next === '완료' ? '완료로 기록했어요' : '완료를 취소했어요', {
        undo: () => store.setStatus(item, prev),
      });
    });

    root.querySelectorAll('[data-role="status"]').forEach((el) =>
      el.addEventListener('click', () => {
        const prev = item.status;
        store.setStatus(item, el.dataset.value);
        toast.show(`${el.dataset.value}(으)로 바꿨어요`, { undo: () => store.setStatus(item, prev) });
      }));

    root.querySelectorAll('[data-role="gear"]').forEach((el) =>
      el.addEventListener('click', () => store.setGear(item, el.dataset.value)));

    root.querySelectorAll('[data-role="bag"]').forEach((el) =>
      el.addEventListener('click', () => store.toggleBag(item, el.dataset.value)));

    root.querySelector('[data-role="remind"]').addEventListener('change', (ev) =>
      store.setRemind(item, ev.target.value));

    root.querySelector('[data-role="doneAt"]').addEventListener('change', (ev) =>
      store.setDoneAt(item, ev.target.value));

    root.querySelector('[data-role="addNote"]').addEventListener('click', () => {
      const ta = root.querySelector('[data-role="note"]');
      store.addNote(item, ta.value);
      ta.value = '';
    });

    root.querySelectorAll('[data-role="delNote"]').forEach((el) =>
      el.addEventListener('click', () => store.removeNote(item.id, el.dataset.id)));

    root.querySelectorAll('[data-role="reaction"]').forEach((el) =>
      el.addEventListener('click', () => {
        reaction = el.dataset.value;
        root.querySelectorAll('[data-role="reaction"]').forEach((x) =>
          x.setAttribute('aria-pressed', String(x === el)));
      }));

    root.querySelector('[data-role="addStory"]').addEventListener('click', () => {
      const ta = root.querySelector('[data-role="story"]');
      store.addExperience(item, reaction, ta.value);
      ta.value = '';
    });
  },
};
