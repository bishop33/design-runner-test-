// 되돌릴 수 있는 알림.
//
// 상태를 잘못 눌러도 되돌릴 수 있어야 탭이 빨라집니다.
// #app 은 화면을 그릴 때마다 통째로 갈아 끼우므로, 토스트는 그 바깥에 둡니다.

import { icon } from './icons.js';
import { esc } from './ui.js';

let el = null;
let timer = null;

function ensure() {
  if (el) return el;
  el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.hidden = true;
  document.body.appendChild(el);
  return el;
}

export function hide() {
  clearTimeout(timer);
  if (el) el.hidden = true;
}

/**
 * @param text 무슨 일이 있었는지 (사실만)
 * @param undo 있으면 '되돌리기' 버튼을 붙입니다
 * @param ms   자동으로 사라지기까지
 */
export function show(text, { undo = null, ms = 5000 } = {}) {
  const node = ensure();
  clearTimeout(timer);
  node.hidden = false;
  node.innerHTML = `<span>${esc(text)}</span>${
    undo ? '<button type="button" data-toast="undo">되돌리기</button>' : ''
  }<button type="button" data-toast="close" aria-label="닫기">${icon('x', 16)}</button>`;

  node.onclick = (ev) => {
    const b = ev.target.closest('[data-toast]');
    if (!b) return;
    if (b.dataset.toast === 'undo') undo?.();
    hide();
  };

  timer = setTimeout(hide, ms);
}
