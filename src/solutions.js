/**
 * Optimal solutions, one per level — GENERATED, do not edit by hand.
 * Run `npm run solutions` to regenerate; `npm test` fails if this drifts.
 *
 * Encoding: u/d/l/r = move, s = strike (kill the adjacent sentinels and
 * spend the turn standing still).
 */
export const MOVE_CODES = { u: 'up', d: 'down', l: 'left', r: 'right', s: 'strike' };

export const SOLUTIONS = {
  1: 'rrrrrrddllllll', // STEP, 14 moves
  2: 'ddurrrru', // BLINK, 8 moves
  3: 'ddruudrrru', // DETOUR, 10 moves
  4: 'ddrludduuurrrrrrr', // DEAD END, 17 moves
  5: 'ddddduuddrruur', // RING VAULT, 14 moves
  6: 'drududrrrrrrrd', // TWO DOORS, 14 moves
  7: 'rrrddlurdrrrr', // TWO OF YOU, 13 moves
  8: 'ddurddudrurrrr', // TRIO, 14 moves
  9: 'drudududrrrrrrrrrrr', // ASYMMETRY, 19 moves
  10: 'dddrruuurrddrrrrrr', // THE LONG WAY, 18 moves
  11: 'drududududrrrrrrrrrrr', // DEEPER, 21 moves
  12: 'dddrruuurrduddrrrrrr', // CLOCKWORK, 20 moves
  13: 'drududududrrrrrrrrrrrdrr', // THREE DOORS, 24 moves
  14: 'ddrdruurru', // RELIC, 10 moves
  15: 'drudurdrrurrddrr', // HOARD, 16 moves
  16: 'drudrrsrrrr', // THE GUARD, 11 moves
  17: 'ddruududrsrru', // OFF BEAT, 13 moves
  18: 'drsududrrrrrr', // HELD OPEN, 13 moves
  19: 'drudududrrrsrrrdr', // RELIQUARY, 17 moves
  20: 'drsudududrrrurrddrr', // THE LONG HELD, 19 moves
  21: 'druldrrulldrurdrrurrrdllllldl', // VAULT RUN, 29 moves
  22: 'drududududrrrrrrrrdr', // DEEP VAULT, 20 moves
  23: 'druduldudrsrrrurdudrrrrrr', // TWIN HOLDS, 25 moves
  24: 'ddruulddrurrru', // CLOSED LOOP, 14 moves
  25: 'ddruruldrdlurrru', // CRACKED, 16 moves
  26: 'drulddrurrrurdsrrr', // WHETSTONE, 18 moves
  27: 'drulddruurdrrurdsrrurdsrr', // THE ARMOURY, 25 moves
  28: 'ddruulddrrrrrruu', // LOOP ROOM, 16 moves
  29: 'ddruuldddrurrrrruu', // LONG LOOP, 18 moves
  30: 'drulddsruurdrrrrsrrrsrr', // VAULT OF ARMS, 23 moves
};

/** Decode a stored solution into engine move names. */
export function decodeSolution(code) {
  return [...(code ?? '')].map((c) => MOVE_CODES[c]).filter(Boolean);
}
