#!/usr/bin/env node
/**
 * Level design bench: node tools/probe.mjs <file exporting CANDIDATES>
 *
 * Reports for each candidate whether it is solvable, its optimal length, and
 * whether it still needs the echoes. Search size doubles as a difficulty
 * proxy — a big explored count means a big space to reason about.
 */
import { solve, solveWithoutEchoes } from './solver.mjs';

const mod = await import(process.argv[2]);
const list = mod.CANDIDATES ?? mod.LEVELS;
const arrow = { up: '↑', down: '↓', left: '←', right: '→', strike: '✶' };

console.log('  id  title              delay    optimal  echo   states    solution');
console.log('  ' + '-'.repeat(96));
for (const def of list) {
  const r = solve({ ...def, par: undefined });
  if (!r.solved) {
    console.log(`  ${String(def.id).padEnd(4)}${(def.title || '').padEnd(19)}${def.delays.join('/').padEnd(9)}UNSOLVABLE (${r.reason})`);
    continue;
  }
  const bare = solveWithoutEchoes(def);
  console.log(
    `  ${String(def.id).padEnd(4)}${(def.title || '').padEnd(19)}${def.delays.join('/').padEnd(9)}` +
    `${String(r.moves.length).padEnd(9)}${(bare.solved ? 'NO' : 'yes').padEnd(7)}${String(r.explored).padEnd(10)}` +
    r.moves.map((m) => arrow[m]).join('')
  );
}
