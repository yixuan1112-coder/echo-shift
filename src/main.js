/** Input, level flow and HUD. */
import { LEVELS } from './levels.js';
import { loadLevel, step, initialState } from './engine.js';
import { createRenderer } from './render.js';

const canvas = document.getElementById('board');
const renderer = createRenderer(canvas);

const el = {
  title: document.getElementById('level-title'),
  hint: document.getElementById('hint'),
  turns: document.getElementById('turns'),
  par: document.getElementById('par'),
  delays: document.getElementById('delays'),
  dots: document.getElementById('dots'),
  overlay: document.getElementById('overlay'),
  overlayTitle: document.getElementById('overlay-title'),
  overlayBody: document.getElementById('overlay-body'),
  overlayBtn: document.getElementById('overlay-btn'),
};

const SAVE_KEY = 'echo-shift/progress';
let unlocked = 1;
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) unlocked = Math.min(LEVELS.length, Math.max(1, parseInt(raw, 10) || 1));
} catch { /* private mode: just start from level 1 */ }

let index = 0;
let board = null;
let state = null;
let undoStack = [];

function save() {
  try { localStorage.setItem(SAVE_KEY, String(unlocked)); } catch { /* ignore */ }
}

function loadIndex(i) {
  index = Math.max(0, Math.min(LEVELS.length - 1, i));
  const def = LEVELS[index];
  const loaded = loadLevel(def);
  board = loaded.board;
  state = loaded.state;
  undoStack = [];
  renderer.reset();
  el.title.textContent = `${def.id}. ${def.title}`;
  el.hint.textContent = def.hint;
  el.par.textContent = String(def.par);
  el.delays.innerHTML = board.delays
    .map((d) => `<span class="chip">回声 −${d}</span>`)
    .join('');
  hideOverlay();
  renderDots();
  updateHud();
}

function renderDots() {
  el.dots.innerHTML = LEVELS.map((lv, i) => {
    const cls = ['dot'];
    if (i === index) cls.push('cur');
    if (i + 1 > unlocked) cls.push('locked');
    return `<button class="${cls.join(' ')}" data-i="${i}" ${i + 1 > unlocked ? 'disabled' : ''} title="${lv.title}">${lv.id}</button>`;
  }).join('');
}

function updateHud() { el.turns.textContent = String(state.turn); }

function showOverlay(title, body, btn, action) {
  el.overlayTitle.textContent = title;
  el.overlayBody.textContent = body;
  el.overlayBtn.textContent = btn;
  el.overlayBtn.onclick = action;
  el.overlay.classList.add('show');
}
function hideOverlay() { el.overlay.classList.remove('show'); }

function doMove(dir) {
  if (!state || state.status !== 'playing') return;
  const next = step(board, state, dir);
  if (!next) return;
  undoStack.push(state);
  state = next;
  updateHud();

  if (state.status === 'paradox') {
    showOverlay('时间悖论', '回声走进了你所在的格子。它重演的是你自己的路线——所以这一步，其实是你几回合前就决定好的。', '撤销一步', undo);
  } else if (state.status === 'won') {
    const def = LEVELS[index];
    const perfect = state.turn === def.par;
    if (index + 1 >= unlocked) { unlocked = Math.min(LEVELS.length, index + 2); save(); renderDots(); }
    const last = index === LEVELS.length - 1;
    showOverlay(
      perfect ? '最优解' : '过关',
      `用了 ${state.turn} 步${perfect ? '，正是最优步数。' : `，最优是 ${def.par} 步。`}`,
      last ? '重玩第一关' : '下一关',
      () => loadIndex(last ? 0 : index + 1),
    );
  }
}

function undo() {
  if (!undoStack.length) return;
  state = undoStack.pop();
  renderer.reset();
  hideOverlay();
  updateHud();
}

function restart() {
  state = initialState(board);
  undoStack = [];
  renderer.reset();
  hideOverlay();
  updateHud();
}

const KEYS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'wait', Period: 'wait', KeyE: 'wait',
};

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey) return;
  const dir = KEYS[e.code];
  if (dir) { e.preventDefault(); doMove(dir); return; }
  if (e.code === 'KeyZ' || e.code === 'KeyU' || e.code === 'Backspace') { e.preventDefault(); undo(); }
  else if (e.code === 'KeyR') { e.preventDefault(); restart(); }
  else if (e.code === 'BracketRight' && index + 1 < unlocked) loadIndex(index + 1);
  else if (e.code === 'BracketLeft') loadIndex(index - 1);
});

el.dots.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-i]');
  if (b) loadIndex(Number(b.dataset.i));
});
document.getElementById('btn-undo').onclick = undo;
document.getElementById('btn-restart').onclick = restart;
for (const b of document.querySelectorAll('[data-move]')) {
  b.onclick = () => doMove(b.dataset.move);
}

// Touch: swipe to move, tap to wait.
let touch = null;
canvas.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  touch = { x: t.clientX, y: t.clientY };
}, { passive: true });
canvas.addEventListener('touchend', (e) => {
  if (!touch) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touch.x;
  const dy = t.clientY - touch.y;
  touch = null;
  if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return doMove('wait');
  doMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
}, { passive: true });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (board) renderer.draw(board, state, dt, now);
  requestAnimationFrame(frame);
}

loadIndex(0);
requestAnimationFrame(frame);
