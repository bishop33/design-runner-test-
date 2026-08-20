// 전체 타임라인 — 세로 시간 순서. 이 서비스의 중심 화면.
//
// 구간(밴드) 단위로 접고 펼치며, 지금 구간은 자동으로 펼쳐집니다.
// 상세를 열지 않아도 제목·시기·상태·중요도·유형을 한 줄에서 읽을 수 있어야 합니다.

import { getContent, currentBandId, bandWindow } from '../model.js';
import { esc, itemList, patchRow, TYPE_GROUPS } from '../ui.js';
import { icon } from '../icons.js';
import { fmtShort, today as td } from '../dates.js';
import * as store from '../store.js';

function defaults() {
  return { group: 'all', topic: '전체', hideDone: false, open: null, showFilters: false };
}

export default {
  /**
   * 완료 숨기기가 꺼져 있으면 상태를 바꿔도 목록 구성이 달라지지 않습니다.
   * 그럴 때는 전체를 다시 그리지 않고 해당 줄과 구간 숫자만 고칩니다.
   */
  patch({ root, view, ui, itemId }) {
    if (ui.timeline?.hideDone) return false;
    const item = view.byId[itemId];
    const rowBtn = root.querySelector(`.timeline .status-btn[data-id="${itemId}"]`);
    if (!item || !rowBtn) return false;

    patchRow(rowBtn.closest('.row'), item, { showWhen: false });

    const progEl = root.querySelector(`[data-prog="${item.bandId}"]`);
    if (progEl && !progEl.textContent.includes('표시')) {
      const all = view.visible.filter((i) => i.bandId === item.bandId);
      progEl.textContent = `${all.filter((i) => i.done).length}/${all.length} 완료`;
    }
    return true;
  },

  async render({ view, ui }) {
    const c = getContent();
    ui.timeline ||= defaults();
    const f = ui.timeline;
    const nowBand = currentBandId(view);
    const now = td();

    // 첫 진입에는 지금 구간과 그 다음 구간만 펼쳐 둡니다.
    if (!f.open) {
      const idx = c.bands.findIndex((b) => b.id === nowBand);
      f.open = new Set(c.bands.slice(Math.max(0, idx), idx + 2).map((b) => b.id));
    }

    const pass = (i) =>
      (f.group === 'all' || i.typeGroup === f.group) &&
      (f.topic === '전체' || i.topic === f.topic) &&
      !(f.hideDone && i.done);

    // 필터를 걸면 결과가 접힌 구간에 숨어 안 보이므로, 필터 중에는 전부 펼칩니다.
    const filtering = f.group !== 'all' || f.topic !== '전체';
    // 패널을 접어 둬도 걸려 있는 필터가 있으면 버튼에 표시합니다.
    const subFilterOn = f.topic !== '전체' || f.hideDone;

    const grouped = new Map(c.bands.map((b) => [b.id, []]));
    let shown = 0;
    for (const i of view.visible) {
      if (!i.bandId || !grouped.has(i.bandId) || !pass(i)) continue;
      grouped.get(i.bandId).push(i);
      shown += 1;
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => b.score - a.score || a.no - b.no);
    }

    const bands = c.bands
      .map((b) => {
        const items = grouped.get(b.id);
        const all = view.visible.filter((i) => i.bandId === b.id);
        const w = bandWindow(b, view.anchors);
        const when = !w ? 'unknown' : now > w.to ? 'past' : now >= w.from ? 'now' : 'future';
        const doneN = all.filter((i) => i.done).length;
        return { b, items, w, when, doneN, total: all.length };
      })
      .filter((x) => (filtering ? x.items.length : x.total));

    const topics = ['전체', ...c.meta.topics];

    return `
    <header class="topbar">
      <h1>전체 타임라인<span class="sub">${shown}개 항목 · ${bands.length}개 구간${filtering ? ' · 필터 적용' : ''}</span></h1>
      <a class="btn-icon" href="#/search" aria-label="검색">${icon('search', 20)}</a>
    </header>

    <main class="main" id="main">
      <div class="tl-tools">
        <div class="line">
          <div class="chips" role="group" aria-label="콘텐츠 유형 필터">
            ${TYPE_GROUPS.map((g) =>
              `<button class="chip" data-group="${g.key}" aria-pressed="${f.group === g.key}">${g.label}</button>`).join('')}
          </div>
          <button class="btn-icon tl-more${subFilterOn ? ' is-on' : ''}" data-role="toggleFilters"
            aria-expanded="${f.showFilters}" aria-label="주제와 보기 설정">${icon('list-filter', 20)}</button>
        </div>

        <div class="tl-panel"${f.showFilters ? '' : ' hidden'}>
          <label class="tl-panel-row">
            <span>주제</span>
            <select data-role="topic" aria-label="주제 필터">
              ${topics.map((t) => `<option value="${esc(t)}"${t === f.topic ? ' selected' : ''}>${esc(t)}</option>`).join('')}
            </select>
          </label>
          <div class="tl-panel-row">
            <button class="chip" data-role="hideDone" aria-pressed="${f.hideDone}">완료 숨기기</button>
            <button class="chip" data-role="toggleAll">${f.open.size > 2 ? '모두 접기' : '모두 펼치기'}</button>
            ${subFilterOn || f.group !== 'all'
              ? '<button class="chip" data-role="clearFilter">필터 해제</button>'
              : ''}
          </div>
        </div>
      </div>

      <div class="timeline">
        ${bands.map(({ b, items, w, when, doneN, total }) => {
          const open = filtering || f.open.has(b.id);
          return `<section class="band" data-when="${when}" data-band="${b.id}">
            <button class="band-head" data-role="band" data-band="${b.id}" aria-expanded="${open}">
              ${icon(open ? 'chevron-down' : 'chevron-right', 18)}
              <span class="band-head-text">
                <span class="band-head-line">
                  <h3>${esc(b.phase)}</h3>
                  <span class="range">${esc(b.band)}</span>
                  ${when === 'now' ? '<span class="now-badge">지금</span>' : ''}
                </span>
                <span class="prog">${w ? `${fmtShort(w.from)} ~ ${fmtShort(w.to)} · ` : ''}<span
                  data-prog="${b.id}">${filtering ? `${items.length}개 표시` : `${doneN}/${total} 완료`}</span></span>
              </span>
            </button>
            <div class="band-body"${open ? '' : ' hidden'}>
              ${open ? itemList(items, { showWhen: false }) : ''}
            </div>
          </section>`;
        }).join('')}
      </div>

      ${bands.length === 0 ? '<p class="empty">이 조건에 맞는 항목이 없습니다.</p>' : ''}

      ${view.hiddenCount
        ? `<p class="hint" style="padding-top:var(--s3)">우리 상황에 해당하지 않아 숨긴 항목 ${view.hiddenCount}개.
           <a href="#/settings">설정</a>에서 볼 수 있습니다.</p>`
        : ''}
    </main>`;
  },

  mount({ root, ui, render }) {
    const f = ui.timeline;

    root.querySelectorAll('[data-group]').forEach((el) =>
      el.addEventListener('click', () => { f.group = el.dataset.group; render(); }));

    root.querySelector('[data-role="toggleFilters"]').addEventListener('click', () => {
      f.showFilters = !f.showFilters;
      render();
    });

    // 패널은 좁은 화면에서 목록을 가리므로, 고르면 바로 닫습니다.
    // 무엇이 걸려 있는지는 필터 버튼 색으로 남습니다.
    root.querySelector('[data-role="topic"]').addEventListener('change', (e) => {
      f.topic = e.target.value;
      f.showFilters = false;
      render();
    });

    root.querySelector('[data-role="hideDone"]').addEventListener('click', () => {
      f.hideDone = !f.hideDone;
      f.showFilters = false;
      render();
    });

    root.querySelector('[data-role="toggleAll"]')?.addEventListener('click', () => {
      const all = [...root.querySelectorAll('[data-role="band"]')].map((el) => el.dataset.band);
      f.open = f.open.size > 2 ? new Set() : new Set(all);
      f.showFilters = false;
      render();
    });

    root.querySelector('[data-role="clearFilter"]')?.addEventListener('click', () => {
      f.group = 'all';
      f.topic = '전체';
      f.hideDone = false;
      f.showFilters = false;
      render();
    });

    root.querySelectorAll('[data-role="band"]').forEach((el) =>
      el.addEventListener('click', () => {
        const id = el.dataset.band;
        f.open.has(id) ? f.open.delete(id) : f.open.add(id);
        render();
      }));

    // 지금 구간을 화면에 보이게 (첫 렌더 1회)
    if (!f.scrolled) {
      f.scrolled = true;
      const el = root.querySelector('.band[data-when="now"]');
      if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
    }
  },
};
