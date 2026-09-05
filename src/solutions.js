/**
 * Optimal solutions, one per level — GENERATED, do not edit by hand.
 * Run `npm run solutions` to regenerate; `npm test` fails if this drifts.
 *
 * Encoding: u/d/l/r = move, w = wait one turn.
 */
export const MOVE_CODES = { u: 'up', d: 'down', l: 'left', r: 'right', w: 'wait' };

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
};

/** Decode a stored solution into engine move names. */
export function decodeSolution(code) {
  return [...(code ?? '')].map((c) => MOVE_CODES[c]).filter(Boolean);
}
