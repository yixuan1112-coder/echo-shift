/**
 * ECHO SHIFT - core rules engine.
 *
 * Pure, deterministic, DOM-free: the browser build and the headless solver
 * (tools/verify.mjs) run the exact same code, so a level that the solver
 * proves solvable is solvable in the actual game.
 *
 * THE ONE RULE
 * ------------
 * Every move you make is recorded. `delay` turns later an Echo re-walks it.
 * Echoes are solid: they block you, they hold down pressure plates, and if
 * one steps into you, that is a paradox and the run resets.
 *
 * The consequence that makes the whole game: an echo stands on a plate for
 * exactly as many turns as you did, so *how long you loiter in the past is
 * how long the gate stays open in the future*.
 */

export const WALL = '#';
export const FLOOR = '.';
export const EXIT = 'X';
export const PLATE = 'p';
export const GATE = 'g';
export const SPAWN = '@';

export const MOVES = {
  up:    { dx: 0, dy: -1 },
  down:  { dx: 0, dy: 1 },
  left:  { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
  wait:  { dx: 0, dy: 0 },
};

/** Parse a level definition into an immutable board + an initial state. */
export function loadLevel(def) {
  const rows = def.grid;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const cells = [];
  let spawn = null;
  const plates = [];
  const gates = [];
  let exit = null;

  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x] ?? WALL;
      if (ch === SPAWN) {
        spawn = { x, y };
        row.push(FLOOR);
      } else {
        if (ch === PLATE) plates.push({ x, y });
        if (ch === GATE) gates.push({ x, y });
        if (ch === EXIT) exit = { x, y };
        row.push(ch);
      }
    }
    cells.push(row);
  }
  if (!spawn) throw new Error(`level ${def.id}: no spawn (@)`);
  if (!exit) throw new Error(`level ${def.id}: no exit (X)`);

  const delays = [...def.delays].sort((a, b) => a - b);
  if (delays.some((d) => d < 1)) throw new Error(`level ${def.id}: delay must be >= 1`);

  const board = {
    id: def.id,
    title: def.title,
    hint: def.hint ?? '',
    w, h, cells, spawn, exit, plates, gates, delays,
    maxDelay: delays[delays.length - 1],
  };
  return { board, state: initialState(board) };
}

export function initialState(board) {
  return {
    turn: 0,
    pos: { ...board.spawn },
    // Only the last `maxDelay + 1` positions can still matter to an echo, so
    // the trail is bounded. trail[trail.length - 1] is always where you are now.
    trail: [{ ...board.spawn }],
    status: 'playing', // 'playing' | 'won' | 'paradox'
  };
}

/** Position `d` turns ago, or null if time has not run that far yet. */
export function pastPosition(state, d) {
  if (state.turn < d) return null;
  const i = state.trail.length - 1 - d;
  return i >= 0 ? state.trail[i] : null;
}

export function tileAt(board, x, y) {
  if (x < 0 || y < 0 || x >= board.w || y >= board.h) return WALL;
  return board.cells[y][x];
}

/** Where each echo stands right now (null while it has not caught up yet). */
export function echoPositions(board, state) {
  return board.delays.map((d) => pastPosition(state, d));
}

/** Where each echo will stand after the player takes one more turn. */
export function nextEchoPositions(board, state) {
  return board.delays.map((d) => pastPosition(state, d - 1));
}

const same = (a, b) => a && b && a.x === b.x && a.y === b.y;

/**
 * Gates are powered when EVERY plate carries an entity (you or an echo).
 * Evaluated from the CURRENT positions, before anyone moves, so what you see
 * on screen is what you can walk through this turn.
 */
export function gatesOpen(board, state) {
  if (board.plates.length === 0) return true;
  const bodies = [state.pos, ...echoPositions(board, state).filter(Boolean)];
  return board.plates.every((p) => bodies.some((b) => same(b, p)));
}

/** Can the player legally take this move right now? */
export function canMove(board, state, dir) {
  if (state.status !== 'playing') return false;
  const m = MOVES[dir];
  if (!m) return false;
  const nx = state.pos.x + m.dx;
  const ny = state.pos.y + m.dy;
  const t = tileAt(board, nx, ny);
  if (t === WALL) return false;
  if (t === GATE && !gatesOpen(board, state)) return false;
  return true;
}

/**
 * Advance one turn. Returns a NEW state (never mutates), or null if the move
 * was illegal — an illegal move costs no time, which keeps the puzzle fair.
 */
export function step(board, state, dir) {
  if (!canMove(board, state, dir)) return null;
  const m = MOVES[dir];
  const pos = { x: state.pos.x + m.dx, y: state.pos.y + m.dy };
  const cap = board.maxDelay + 1;
  const trail = state.trail.length >= cap
    ? [...state.trail.slice(state.trail.length - cap + 1), pos]
    : [...state.trail, pos];
  const next = { turn: state.turn + 1, pos, trail, status: 'playing' };

  // Paradox: an echo walks into you, or you and an echo swap places.
  const echoesNow = echoPositions(board, state);
  const echoesNext = echoPositions(board, next);
  for (let k = 0; k < echoesNext.length; k++) {
    const e = echoesNext[k];
    if (!e) continue;
    if (same(e, pos)) { next.status = 'paradox'; return next; }
    if (same(echoesNow[k], pos) && same(e, state.pos)) { next.status = 'paradox'; return next; }
  }

  if (same(pos, board.exit)) next.status = 'won';
  return next;
}

/**
 * Compact key for search / dedup. One character per position (cell index) plus
 * one for how far time has run — small enough to hold millions of them.
 */
export function stateKey(board, state) {
  const phase = Math.min(state.turn, board.maxDelay);
  let k = String.fromCharCode(phase);
  for (const p of state.trail) k += String.fromCharCode(p.y * board.w + p.x);
  return k;
}
