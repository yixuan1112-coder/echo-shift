#!/usr/bin/env node
/**
 * Regenerate src/solutions.js from the BFS solver: npm run solutions
 *
 * The in-game DEMO plays these back, so they are not hand-written hints —
 * they are the optimal solutions the solver proved, and tools/verify.mjs
 * fails the build if this file ever drifts from the levels.
 */
import { writeFile } from 'node:fs/promises';
import { LEVELS } from '../src/levels.js';
import { solve } from './solver.mjs';

export const CODE = { up: 'u', down: 'd', left: 'l', right: 'r', strike: 's' };

const entries = [];
for (const def of LEVELS) {
  const res = solve(def);
  if (!res.solved) { console.error(`L${def.id} unsolvable`); process.exit(1); }
  if (res.moves.length !== def.par) {
    console.error(`L${def.id}: par is ${def.par} but optimal is ${res.moves.length}`);
    process.exit(1);
  }
  entries.push(`  ${def.id}: '${res.moves.map((m) => CODE[m]).join('')}', // ${def.title}, ${res.moves.length} moves`);
  console.log(`L${def.id} ${def.title} — ${res.moves.length} moves`);
}

const file = `/**
 * Optimal solutions, one per level — GENERATED, do not edit by hand.
 * Run \`npm run solutions\` to regenerate; \`npm test\` fails if this drifts.
 *
 * Encoding: u/d/l/r = move, s = strike (kill the adjacent sentinels and
 * spend the turn standing still).
 */
export const MOVE_CODES = { u: 'up', d: 'down', l: 'left', r: 'right', s: 'strike' };

export const SOLUTIONS = {
${entries.join('\n')}
};

/** Decode a stored solution into engine move names. */
export function decodeSolution(code) {
  return [...(code ?? '')].map((c) => MOVE_CODES[c]).filter(Boolean);
}
`;
await writeFile(new URL('../src/solutions.js', import.meta.url), file);
console.log('\nwrote src/solutions.js');

// A human-readable companion, so the repo carries the answers too.
const ARROW = { up: '↑', down: '↓', left: '←', right: '→', strike: '✶' };
const doc = `# Solutions — SPOILERS

Every line below is the **optimal** solution, produced by \`tools/solver.mjs\`
(breadth-first search over the same rules engine the game runs) and re-checked
by \`npm test\`. The in-game **DEMO** button plays exactly these back.

\`✶\` is a **strike**: it cuts down every adjacent sentinel you outmatch
(POWER = 1 + shards held, against the sentinel's HP) and spends the turn
standing still. It is the only move that does not change your position, so it is
also the only way to flip parity and the only way to make an echo pause on a
plate — which is the only way a gate stays open for two turns instead of
blinking for one.

Levels from 24 on are flagged \`noBacktrack\`: you may not step back onto last
turn's tile, so none of these lines contain a U-turn. \`o\` in a grid is brittle
floor — one crossing, then it falls.

${LEVELS.map((def) => {
  const moves = solve(def).moves;
  return `## ${def.id}. ${def.title}  — ${moves.length} moves, echo ${def.delays.map((d) => '-' + d).join(' / ')}

> ${def.hint}

\`\`\`
${def.grid.join('\n')}
\`\`\`

${moves.map((m) => ARROW[m]).join(' ')}
`;
}).join('\n')}
---

Regenerate with \`npm run solutions\`.
`;
await writeFile(new URL('../docs/SOLUTIONS.md', import.meta.url), doc);
console.log('wrote docs/SOLUTIONS.md');
