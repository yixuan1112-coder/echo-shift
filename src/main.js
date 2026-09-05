/** Input, level flow and HUD. */
import { LEVELS } from './levels.js';
import { SOLUTIONS, decodeSolution } from './solutions.js';
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
  demo: document.getElementById('btn-demo'),
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
// DEMO plays back the solver's optimal line for the current level.
let demo = null;

function save() {
  try { localStorage.setItem(SAVE_KEY, String(unlocked)); } catch { /* ignore */ }
}

function loadIndex(i) {
  stopDemo();
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
    .map((d) => `<span class="chip">ECHO -${d}</span>`)
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

const DEMO_INTERVAL = 420;

function setDemoLabel() {
  if (!demo) { el.demo.textContent = 'DEMO'; el.demo.classList.remove('running'); return; }
  el.demo.textContent = `STOP ${demo.i}/${demo.moves.length}`;
  el.demo.classList.add('running');
}

function stopDemo() {
  if (demo) clearInterval(demo.timer);
  demo = null;
  setDemoLabel();
}

function startDemo() {
  const moves = decodeSolution(SOLUTIONS[LEVELS[index].id]);
  if (!moves.length) return;
  stopDemo();
  restart();
  demo = { moves, i: 0, timer: null };
  setDemoLabel();
  demo.timer = setInterval(() => {
    if (!demo) return;
    if (demo.i >= demo.moves.length) return stopDemo();
    doMove(demo.moves[demo.i], true);
    demo.i++;
    setDemoLabel();
    if (state.status !== 'playing') stopDemo();
  }, DEMO_INTERVAL);
}

function toggleDemo() {
  // Drop focus, or a later Space/Enter would re-trigger the button.
  el.demo.blur();
  demo ? stopDemo() : startDemo();
}

function showOverlay(title, body, btn, action) {
  el.overlayTitle.textContent = title;
  el.overlayBody.textContent = body;
  el.overlayBtn.textContent = btn;
  el.overlayBtn.onclick = action;
  el.overlay.classList.add('show');
}
function hideOverlay() { el.overlay.classList.remove('show'); }

function doMove(dir, fromDemo = false) {
  if (!state || state.status !== 'playing') return;
  if (demo && !fromDemo) return;               // hands off while the demo runs
  const next = step(board, state, dir);
  if (!next) return;
  undoStack.push(state);
  state = next;
  updateHud();

  if (state.status === 'paradox') {
    showOverlay(
      'PARADOX',
      'An echo stepped into your tile. It only ever replays your own route, so that collision is something you set up several turns ago.',
      'UNDO',
      undo,
    );
  } else if (state.status === 'stuck') {
    showOverlay(
      'STUCK',
      'Every direction is blocked and passing your turn is not allowed. Walk yourself somewhere with an exit next time.',
      'UNDO',
      undo,
    );
  } else if (state.status === 'won') {
    const def = LEVELS[index];
    const perfect = state.turn === def.par;
    if (index + 1 >= unlocked) { unlocked = Math.min(LEVELS.length, index + 2); save(); renderDots(); }
    const last = index === LEVELS.length - 1;
    const wasDemo = Boolean(demo);
    showOverlay(
      wasDemo ? 'DEMO COMPLETE' : (perfect ? 'PERFECT' : 'CLEAR'),
      wasDemo
        ? `That is the optimal line: ${state.turn} moves. Hit RESET and try it yourself.`
        : perfect
          ? `Solved in ${state.turn} moves — that is the optimum.`
          : `Solved in ${state.turn} moves. Par is ${def.par}.`,
      last ? 'REPLAY FROM 1' : 'NEXT LEVEL',
      () => loadIndex(last ? 0 : index + 1),
    );
  }
}

function undo() {
  stopDemo();
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
};

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey) return;
  const dir = KEYS[e.code];
  if (dir) { e.preventDefault(); doMove(dir); return; }
  if (e.code === 'KeyZ' || e.code === 'KeyU' || e.code === 'Backspace') { e.preventDefault(); undo(); }
  else if (e.code === 'KeyR') { e.preventDefault(); stopDemo(); restart(); }
  else if (e.code === 'KeyD') { e.preventDefault(); toggleDemo(); }
  else if (e.code === 'Escape') { e.preventDefault(); stopDemo(); }
  else if (e.code === 'BracketRight' && index + 1 < unlocked) loadIndex(index + 1);
  else if (e.code === 'BracketLeft') loadIndex(index - 1);
});

el.dots.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-i]');
  if (b) loadIndex(Number(b.dataset.i));
});
document.getElementById('btn-undo').onclick = undo;
document.getElementById('btn-restart').onclick = () => { stopDemo(); restart(); };
el.demo.onclick = toggleDemo;
for (const b of document.querySelectorAll('[data-move]')) {
  b.onclick = () => doMove(b.dataset.move);
}

// Touch: swipe to move. A tap does nothing — there is no waiting.
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
  if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;   // no waiting: a tap does nothing
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
