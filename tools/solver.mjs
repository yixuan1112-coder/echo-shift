/**
 * Breadth-first solver running the exact rules the game runs, so any level it
 * proves solvable is solvable for a real player.
 *
 * A state is fully described by the player's last `maxDelay + 1` positions
 * (everything the echoes can still reveal) plus how far time has run, which
 * keeps the space small. Nodes hold a parent pointer rather than a copied
 * path, so the frontier stays flat in memory.
 */
import { loadLevel, step, stateKey } from '../src/engine.js';

const DIRS = ['up', 'down', 'left', 'right', 'wait'];

export function solve(def, { maxNodes = 3_000_000 } = {}) {
  const { board, state } = loadLevel(def);

  const nodes = [{ state, parent: -1, move: null }];
  const seen = new Set([stateKey(board, state)]);
  let head = 0;

  const pathTo = (i) => {
    const out = [];
    while (i > 0) { out.push(nodes[i].move); i = nodes[i].parent; }
    return out.reverse();
  };

  while (head < nodes.length) {
    const idx = head++;
    const cur = nodes[idx].state;

    for (const dir of DIRS) {
      const next = step(board, cur, dir);
      if (!next) continue;                     // illegal move; no time passes
      if (next.status === 'paradox') continue; // dead branch
      if (next.status === 'won') {
        return { solved: true, moves: [...pathTo(idx), dir], explored: nodes.length, board };
      }
      const key = stateKey(board, next);
      if (seen.has(key)) continue;
      seen.add(key);
      nodes.push({ state: next, parent: idx, move: dir });
      if (nodes.length > maxNodes) {
        return { solved: false, reason: `node cap ${maxNodes}`, explored: nodes.length, board };
      }
    }
  }
  return { solved: false, reason: 'search exhausted', explored: nodes.length, board };
}

/** Same level with the echoes pushed out of reach: proves they are required. */
export function solveWithoutEchoes(def, opts) {
  return solve({ ...def, delays: [10_000] }, opts);
}

/** Replay a move list through the engine and report what really happened. */
export function replay(def, moves) {
  const { board, state } = loadLevel(def);
  let s = state;
  for (const dir of moves) {
    const n = step(board, s, dir);
    if (!n) return { ok: false, reason: `illegal move "${dir}" at turn ${s.turn}` };
    s = n;
    if (s.status === 'paradox') return { ok: false, reason: `paradox at turn ${s.turn}` };
    if (s.status === 'won') return { ok: true, turns: s.turn };
  }
  return { ok: false, reason: 'ran out of moves without reaching the exit' };
}
