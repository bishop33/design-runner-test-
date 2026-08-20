// 전체 타임라인 — 세로 시간 순서. 이 서비스의 중심 화면.
//
// 구간(밴드) 단위로 접고 펼치며, 지금 구간은 자동으로 펼쳐집니다.
// 상세를 열지 않아도 제목·시기·상태·중요도·유형을 한 줄에서 읽을 수 있어야 합니다.

import { getContent, currentBandId, bandWindow } from '../model.js';
import { esc, itemList, TYPE_GROUPS } from '../ui.js';
import { icon } from '../icons.js';
import { fmtShort, today as td } from '../dates.js';
import * as store from '../store.js';

function defaults() {
  return { group: 'all', topic: '전체', hideDone: false, open: null };
}

export default {
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
        <div class="chips" role="group" aria-label="콘텐츠 유형 필터">
          ${TYPE_GROUPS.map((g) =>
            `<button class="chip" data-group="${g.key}" aria-pressed="${f.group === g.key}">${g.label}</button>`).join('')}
        </div>
        <div class="line">
          <span class="type-mark">${icon('list-filter', 16)}</span>
          <select data-role="topic" aria-label="주제 필터">
            ${topics.map((t) => `<option value="${esc(t)}"${t === f.topic ? ' selected' : ''}>${esc(t)}</option>`).join('')}
          </select>
          <label class="toggle">
            <input type="checkbox" data-role="hideDone"${f.hideDone ? ' checked' : ''}> 완료 숨기기
          </label>
          <button class="btn-quiet" data-role="${filtering ? 'clearFilter' : 'toggleAll'}" style="margin-left:auto">
            ${filtering ? '필터 해제' : f.open.size > 2 ? '모두 접기' : '모두 펼치기'}
          </button>
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
                <span class="prog">${w ? `${fmtShort(w.from)} ~ ${fmtShort(w.to)} · ` : ''}${
                  filtering ? `${items.length}개 표시` : `${doneN}/${total} 완료`
                }</span>
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

    root.querySelector('[data-role="topic"]').addEventListener('change', (e) => {
      f.topic = e.target.value;
      render();
    });

    root.querySelector('[data-role="hideDone"]').addEventListener('change', (e) => {
      f.hideDone = e.target.checked;
      render();
    });

    root.querySelector('[data-role="toggleAll"]')?.addEventListener('click', () => {
      const all = [...root.querySelectorAll('[data-role="band"]')].map((el) => el.dataset.band);
      f.open = f.open.size > 2 ? new Set() : new Set(all);
      render();
    });

    root.querySelector('[data-role="clearFilter"]')?.addEventListener('click', () => {
      f.group = 'all';
      f.topic = '전체';
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
