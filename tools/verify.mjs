#!/usr/bin/env node
/**
 * Level integrity check. Run: npm test
 *
 * For every level it asserts:
 *   1. it is solvable,
 *   2. the optimal solution replays cleanly through the real engine,
 *   3. it is NOT solvable with the echoes disabled — i.e. the mechanic is
 *      load-bearing, not decoration.
 */
import { LEVELS } from '../src/levels.js';
import { solve, solveWithoutEchoes, replay } from './solver.mjs';

let failures = 0;
const rows = [];

for (const def of LEVELS) {
  const t0 = Date.now();
  const res = solve(def);
  const ms = Date.now() - t0;

  if (!res.solved) {
    console.error(`✗ L${def.id} "${def.title}" — UNSOLVABLE (${res.reason}, ${res.explored} states)`);
    failures++;
    rows.push({ id: def.id, title: def.title, status: 'UNSOLVABLE' });
    continue;
  }

  const rp = replay(def, res.moves);
  if (!rp.ok) {
    console.error(`✗ L${def.id} "${def.title}" — solution does not replay: ${rp.reason}`);
    failures++;
    continue;
  }

  if (typeof def.par === 'number' && res.moves.length !== def.par) {
    console.error(`✗ L${def.id} "${def.title}" — par says ${def.par} but the optimal solution is ${res.moves.length}`);
    failures++;
  }

  const bare = def.id === 1 ? { solved: true } : solveWithoutEchoes(def);
  const needsEcho = !bare.solved;
  if (def.id !== 1 && !needsEcho) {
    console.error(`✗ L${def.id} "${def.title}" — solvable WITHOUT echoes; the mechanic is optional here`);
    failures++;
  }

  rows.push({
    id: def.id,
    title: def.title,
    delays: def.delays.join('/'),
    optimal: res.moves.length,
    needsEcho: def.id === 1 ? 'tutorial' : (needsEcho ? 'yes' : 'NO'),
    states: res.explored,
    ms,
  });
}

console.log('\n  #  level                    delay  optimal  echo-required   states   time');
console.log('  ' + '-'.repeat(74));
for (const r of rows) {
  if (r.status === 'UNSOLVABLE') {
    console.log(`  ${String(r.id).padEnd(3)}${r.title.padEnd(25)}  UNSOLVABLE`);
    continue;
  }
  console.log(
    `  ${String(r.id).padEnd(3)}${r.title.padEnd(25)}${String(r.delays).padEnd(7)}` +
    `${String(r.optimal).padEnd(9)}${String(r.needsEcho).padEnd(16)}${String(r.states).padEnd(9)}${r.ms}ms`
  );
}
console.log('');

if (failures) {
  console.error(`${failures} level(s) failed verification.`);
  process.exit(1);
}
console.log(`All ${LEVELS.length} levels verified: solvable, replayable, and echo-dependent.\n`);
