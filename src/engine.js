/**
 * ECHO SHIFT - core rules engine.
 *
 * Pure, deterministic, DOM-free: the browser build and the headless solver
 * (tools/verify.mjs) run the exact same code, so a level that the solver
 * proves solvable is solvable in the actual game.
 *
 * THE TWO RULES
 * -------------
 * 1. Every move you make is recorded. `delay` turns later an Echo re-walks it.
 *    Echoes are solid: they block you, they hold down pressure plates, and if
 *    one steps into you, that is a paradox.
 * 2. You MUST move every turn. There is no waiting.
 *
 * Rule 2 is what makes this hard. You cannot park on a plate, so an echo can
 * only ever touch a plate for a single turn at a time — a gate does not stay
 * open, it *blinks*. Time cannot be padded for free either: the only way to
 * spend a turn is to walk somewhere, and your echo will walk it again later.
 *
 * It also imposes a parity law. Every move flips (x + y) mod 2, so your
 * position parity at turn t is fixed. An echo `d` turns behind can therefore
 * only ever land on your tile when d is even, and can only ever swap through
 * you when d is odd — which kind of paradox threatens you is decided the
 * moment a level picks its delays.
 *
 * THREE THINGS THAT BEND THOSE RULES
 * ----------------------------------
 * SHARD    A relic you pick up by walking over it. The exit stays sealed until
 *          you hold every shard on the board, so the route is no longer "get
 *          to the door" but "get to the door having been everywhere else".
 *          Echoes walk over shards without touching them: only the present
 *          can pick anything up.
 *
 * SENTINEL A hostile that occupies its tile and blocks it until you cut it
 *          down.
 *
 * STRIKE   The attack, and the one crack in rule 2. It is legal only when a
 *          living sentinel stands next to you, it kills every sentinel
 *          adjacent to you, and it costs a turn *in which you do not move*.
 *          So each sentinel is a licensed pause, and a pause does two things
 *          nothing else in the game can do:
 *            - it FLIPS PARITY, because you spent a turn without changing
 *              (x + y) mod 2;
 *            - it makes your echo stand still later, which is the only way a
 *              plate is ever held for two turns running — the only way a gate
 *              stays open instead of blinking.
 *          Echoes replay your *movement*, not your actions: an echo repeating
 *          a struck turn simply stands there. It does not swing at anything.
 */

export const WALL = '#';
export const FLOOR = '.';
export const EXIT = 'X';
export const PLATE = 'p';
export const GATE = 'g';
export const SPAWN = '@';
export const SHARD = '*';
export const SENTINEL = 'S';

export const MOVES = {
  up:    { dx: 0, dy: -1 },
  down:  { dx: 0, dy: 1 },
  left:  { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export const DIRECTIONS = Object.keys(MOVES);

/** The attack. Not a direction: it is the one turn you can spend standing still. */
export const STRIKE = 'strike';

/** Everything the player (and the solver) may do on a turn. */
export const ACTIONS = [...DIRECTIONS, STRIKE];

const key = (x, y) => x + ',' + y;

/** Parse a level definition into an immutable board + an initial state. */
export function loadLevel(def) {
  const rows = def.grid;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const cells = [];
  let spawn = null;
  const plates = [];
  const gates = [];
  const shards = [];
  const sentinels = [];
  let exit = null;

  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x] ?? WALL;
      // Shards and sentinels are *occupants* of a floor tile, not tile types:
      // both come and go during play, so they live in the state, not the board.
      if (ch === SPAWN) {
        spawn = { x, y };
        row.push(FLOOR);
      } else if (ch === SHARD) {
        shards.push({ x, y });
        row.push(FLOOR);
      } else if (ch === SENTINEL) {
        sentinels.push({ x, y });
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
  if (shards.length > 16) throw new Error(`level ${def.id}: at most 16 shards`);
  if (sentinels.length > 16) throw new Error(`level ${def.id}: at most 16 sentinels`);

  const delays = [...def.delays].sort((a, b) => a - b);
  if (delays.some((d) => d < 1)) throw new Error(`level ${def.id}: delay must be >= 1`);

  const board = {
    id: def.id,
    title: def.title,
    hint: def.hint ?? '',
    w, h, cells, spawn, exit, plates, gates, shards, sentinels, delays,
    maxDelay: delays.length ? delays[delays.length - 1] : 0,
    // Bit per shard; the exit unseals when `taken` reaches this.
    allShards: (1 << shards.length) - 1,
    // Position lookups, so the hot path never scans a list.
    shardAt: new Map(shards.map((p, i) => [key(p.x, p.y), i])),
    sentinelAt: new Map(sentinels.map((p, i) => [key(p.x, p.y), i])),
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
    taken: 0,   // bitmask of shards picked up
    slain: 0,   // bitmask of sentinels cut down
    struck: false, // did the turn just played end in a strike? (for the renderer)
    status: 'playing', // 'playing' | 'won' | 'paradox' | 'stuck'
  };
}

/** Index of the shard still lying on (x, y), or -1. */
export function shardAt(board, state, x, y) {
  const i = board.shardAt.get(key(x, y));
  return i === undefined || (state.taken >> i) & 1 ? -1 : i;
}

/** Index of the sentinel still standing on (x, y), or -1. */
export function sentinelAt(board, state, x, y) {
  const i = board.sentinelAt.get(key(x, y));
  return i === undefined || (state.slain >> i) & 1 ? -1 : i;
}

/** Shards still on the board. */
export function shardsLeft(board, state) {
  return board.shards.length - popcount(state.taken);
}

/** The exit only accepts you once you are carrying every shard. */
export function exitOpen(board, state) {
  return state.taken === board.allShards;
}

function popcount(n) {
  let c = 0;
  while (n) { n &= n - 1; c++; }
  return c;
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
 * on screen is what you can walk through this turn. With no waiting allowed,
 * nobody can hold a plate for two turns running, so this blinks.
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
  if (t === EXIT && !exitOpen(board, state)) return false;   // sealed: shards first
  if (sentinelAt(board, state, nx, ny) >= 0) return false;    // something is in the way
  return true;
}

/**
 * The attack is legal only with a living sentinel beside you. That restriction
 * is the whole balance of it: without a sentinel there is still no way to spend
 * a turn in place, so every level's supply of parity flips is exactly the
 * number of sentinels the designer put on the board.
 */
export function canStrike(board, state) {
  if (state.status !== 'playing') return false;
  return DIRECTIONS.some((d) => {
    const m = MOVES[d];
    return sentinelAt(board, state, state.pos.x + m.dx, state.pos.y + m.dy) >= 0;
  });
}

/** Can the player take this action (a direction, or STRIKE) right now? */
export function canAct(board, state, action) {
  return action === STRIKE ? canStrike(board, state) : canMove(board, state, action);
}

/**
 * Advance one turn. Returns a NEW state (never mutates), or null if the move
 * was illegal — an illegal move costs no time, which keeps the puzzle fair.
 */
export function step(board, state, action) {
  if (!canAct(board, state, action)) return null;

  const striking = action === STRIKE;
  // A strike is a turn spent in place. The trail still gets an entry, so the
  // echo replaying it stands still too — that pause is the point of the move.
  const pos = striking
    ? { ...state.pos }
    : { x: state.pos.x + MOVES[action].dx, y: state.pos.y + MOVES[action].dy };

  let taken = state.taken;
  let slain = state.slain;
  if (striking) {
    for (const d of DIRECTIONS) {
      const m = MOVES[d];
      const i = sentinelAt(board, state, pos.x + m.dx, pos.y + m.dy);
      if (i >= 0) slain |= 1 << i;          // one swing clears every neighbour
    }
  } else {
    const si = shardAt(board, state, pos.x, pos.y);
    if (si >= 0) taken |= 1 << si;          // only the present can pick things up
  }

  const cap = board.maxDelay + 1;
  const trail = state.trail.length >= cap
    ? [...state.trail.slice(state.trail.length - cap + 1), pos]
    : [...state.trail, pos];
  const next = { turn: state.turn + 1, pos, trail, taken, slain, struck: striking, status: 'playing' };

  // Paradox: an echo walks into you, or you and an echo swap places.
  const echoesNow = echoPositions(board, state);
  const echoesNext = echoPositions(board, next);
  for (let k = 0; k < echoesNext.length; k++) {
    const e = echoesNext[k];
    if (!e) continue;
    if (same(e, pos)) { next.status = 'paradox'; return next; }
    if (same(echoesNow[k], pos) && same(e, state.pos)) { next.status = 'paradox'; return next; }
  }

  if (same(pos, board.exit)) { next.status = 'won'; return next; }

  // No waiting means having no legal action left is itself a way to lose.
  if (!ACTIONS.some((a) => canAct(board, next, a))) next.status = 'stuck';
  return next;
}

/**
 * Compact key for search / dedup. One character per position (cell index) plus
 * one for how far time has run — small enough to hold millions of them.
 */
export function stateKey(board, state) {
  const phase = Math.min(state.turn, board.maxDelay);
  // Two extra characters carry what has been collected and what has been
  // killed — both are permanent, so they belong in the identity of a state.
  let k = String.fromCharCode(phase, state.taken, state.slain);
  for (const p of state.trail) k += String.fromCharCode(p.y * board.w + p.x);
  return k;
}
