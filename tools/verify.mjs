#!/usr/bin/env node
/**
 * Level integrity check. Run: npm test
 *
 * For every level it asserts:
 *   1. it is solvable,
 *   2. the optimal solution replays cleanly through the real engine,
 *   3. it is NOT solvable with the echoes disabled — i.e. the mechanic is
 *      load-bearing, not decoration,
 *   3b. and, on any level carrying a sentinel, NOT solvable with the strike
 *      disabled either, so the attack is never just a locked door,
 *   4. the stored solution the in-game DEMO plays back is still optimal and
 *      still wins — run `npm run solutions` if this drifts,
 *   5. and, on a `noBacktrack` level, that the optimal line really contains no
 *      immediate U-turns — the `pace` column below.
 */
import { LEVELS } from '../src/levels.js';
import { SOLUTIONS, decodeSolution } from '../src/solutions.js';
import { solve, solveWithoutEchoes, solveWithoutStrike, replay } from './solver.mjs';

const INVERSE = { up: 'down', down: 'up', left: 'right', right: 'left' };

/**
 * How many turns of the optimal line are an immediate U-turn. Hopping between
 * two tiles is how the early levels burn time, and it is time spent without a
 * decision in it — `noBacktrack` levels must report 0, and this column is how
 * you see at a glance which levels still allow it.
 */
const pacing = (moves) =>
  moves.reduce((n, m, i) => n + (i > 0 && INVERSE[moves[i - 1]] === m ? 1 : 0), 0);

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

  // The DEMO plays this back, so it must still be a winning, optimal line.
  const stored = decodeSolution(SOLUTIONS[def.id]);
  if (!stored.length) {
    console.error(`✗ L${def.id} "${def.title}" — no stored solution; run \`npm run solutions\``);
    failures++;
  } else {
    const sr = replay(def, stored);
    if (!sr.ok) {
      console.error(`✗ L${def.id} "${def.title}" — stored solution does not win: ${sr.reason}; run \`npm run solutions\``);
      failures++;
    } else if (stored.length !== res.moves.length) {
      console.error(`✗ L${def.id} "${def.title}" — stored solution is ${stored.length} moves but the optimum is ${res.moves.length}; run \`npm run solutions\``);
      failures++;
    }
  }

  const bare = def.id === 1 ? { solved: true } : solveWithoutEchoes(def);
  const needsEcho = !bare.solved;
  if (def.id !== 1 && !needsEcho) {
    console.error(`✗ L${def.id} "${def.title}" — solvable WITHOUT echoes; the mechanic is optional here`);
    failures++;
  }

  // Same test for the attack: a sentinel that can simply be walked around is
  // scenery, and a level that never needs the pause does not need the sentinel.
  // `S` is shorthand for 1 HP; a digit is a sentinel with that much HP.
  const hasSentinel = def.grid.some((row) => /[S1-9]/.test(row));
  let needsStrike = '-';
  if (hasSentinel) {
    needsStrike = solveWithoutStrike(def).solved ? 'NO' : 'yes';
    if (needsStrike === 'NO') {
      console.error(`✗ L${def.id} "${def.title}" — solvable WITHOUT striking; the sentinel is decoration`);
      failures++;
    }
  }

  const pace = pacing(res.moves);
  if (def.noBacktrack && pace > 0) {
    console.error(`✗ L${def.id} "${def.title}" — noBacktrack is set but the optimal line still paces ${pace} time(s)`);
    failures++;
  }

  rows.push({
    id: def.id,
    title: def.title,
    delays: def.delays.join('/'),
    optimal: res.moves.length,
    pace: def.noBacktrack ? `${pace} (banned)` : String(pace),
    needsEcho: def.id === 1 ? 'tutorial' : (needsEcho ? 'yes' : 'NO'),
    needsStrike,
    demo: stored.length === res.moves.length ? 'ok' : 'STALE',
    states: res.explored,
    ms,
  });
}

console.log('\n  #  level                    delay  optimal  echo-required  strike  pace       demo   states   time');
console.log('  ' + '-'.repeat(100));
for (const r of rows) {
  if (r.status === 'UNSOLVABLE') {
    console.log(`  ${String(r.id).padEnd(3)}${r.title.padEnd(25)}  UNSOLVABLE`);
    continue;
  }
  console.log(
    `  ${String(r.id).padEnd(3)}${r.title.padEnd(25)}${String(r.delays).padEnd(7)}` +
    `${String(r.optimal).padEnd(9)}${String(r.needsEcho).padEnd(15)}${String(r.needsStrike).padEnd(8)}${String(r.pace).padEnd(11)}${String(r.demo).padEnd(7)}${String(r.states).padEnd(9)}${r.ms}ms`
  );
}
console.log('');

if (failures) {
  console.error(`${failures} level(s) failed verification.`);
  process.exit(1);
}
console.log(`All ${LEVELS.length} levels verified: solvable, echo-dependent, strike-dependent where a sentinel stands, and the DEMO solutions are optimal.\n`);
