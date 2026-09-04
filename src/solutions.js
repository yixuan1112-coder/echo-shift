/**
 * Optimal solutions, one per level — GENERATED, do not edit by hand.
 * Run `npm run solutions` to regenerate; `npm test` fails if this drifts.
 *
 * Encoding: u/d/l/r = move, w = wait one turn.
 */
export const MOVE_CODES = { u: 'up', d: 'down', l: 'left', r: 'right', w: 'wait' };

export const SOLUTIONS = {
  1: 'rrrrrrddllllll', // ECHO, 14 moves
  2: 'ddrurwrru', // HOLD THE PAST, 9 moves
  3: 'rrdudrrr', // LINGER, 8 moves
  4: 'ddrludduuurrrrrrr', // BACKTRACK, 17 moves
  5: 'dddduurrrrruu', // EXACTLY FIVE, 13 moves
  6: 'rrrddlurdrrrr', // TWO OF YOU, 13 moves
  7: 'rrrrddlurdrrrrr', // CROWDED, 15 moves
  8: 'dddruurdrrrr', // TRIO, 12 moves
};

/** Decode a stored solution into engine move names. */
export function decodeSolution(code) {
  return [...(code ?? '')].map((c) => MOVE_CODES[c]).filter(Boolean);
}
