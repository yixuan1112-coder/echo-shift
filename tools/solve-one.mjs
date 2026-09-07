#!/usr/bin/env node
/** Print the optimal solution for one level: npm run solve -- 6 */
import { LEVELS } from '../src/levels.js';
import { solve } from './solver.mjs';

const id = Number(process.argv[2] || 1);
const def = LEVELS.find((l) => l.id === id);
if (!def) { console.error(`no level ${id} (have 1..${LEVELS.length})`); process.exit(1); }

const res = solve(def);
if (!res.solved) { console.error(`L${id} unsolvable: ${res.reason}`); process.exit(1); }
const arrow = { up: '↑', down: '↓', left: '←', right: '→', strike: '✶' };
console.log(`L${id} ${def.title} — ${res.moves.length} moves (searched ${res.explored} states)`);
console.log(res.moves.map((m) => arrow[m]).join(' '));
