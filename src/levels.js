/**
 * Levels.
 *
 * Grid legend:  # wall   . floor   @ you   X exit   p pressure plate   g gate
 * `delays` lists one entry per echo: how many turns behind you it walks.
 *
 * `par` is the optimal solution length. It is not hand-written trivia:
 * tools/verify.mjs recomputes it by breadth-first search and fails the build
 * if a level edit ever changes it silently.
 *
 * Every level here is checked: solvable, and (from L2 on) NOT solvable if the
 * echoes are taken away — the mechanic has to be load-bearing.
 */
export const LEVELS = [
  {
    id: 1,
    par: 14,
    title: 'ECHO',
    delays: [3],
    hint: 'Take a few steps, then look behind you. That flickering thing is you, three turns ago.',
    grid: [
      '#########',
      '#@......#',
      '#######.#',
      '#X......#',
      '#########',
    ],
  },
  {
    id: 2,
    par: 9,
    title: 'HOLD THE PAST',
    delays: [3],
    hint: 'A gate is open only while every plate is held down. You cannot be in two places at once — but three turns ago, you can.',
    grid: [
      '#########',
      '#@..#X..#',
      '#...g...#',
      '#.p.#...#',
      '#########',
    ],
  },
  {
    id: 3,
    par: 8,
    title: 'LINGER',
    delays: [3],
    hint: 'The gate stays open for exactly as long as you stood on the plate. A plate this close to the gate means standing there longer.',
    grid: [
      '#########',
      '#@.p#...#',
      '#...g.X.#',
      '#...#...#',
      '#########',
    ],
  },
  {
    id: 4,
    par: 17,
    title: 'BACKTRACK',
    delays: [5],
    hint: 'Your echo retraces the way you came. In a one-tile dead end you will always meet it head-on — unless you duck into the alcove and let it pass.',
    grid: [
      '##########',
      '#@..g...X#',
      '#.########',
      '#..#######',
      '#p########',
      '##########',
    ],
  },
  {
    id: 5,
    par: 13,
    title: 'EXACTLY FIVE',
    delays: [5],
    hint: 'Plate to gate is five steps. The delay is five turns. Nothing to spare.',
    grid: [
      '##########',
      '#@...#X..#',
      '#....#...#',
      '#....g...#',
      '#....#...#',
      '#p...#...#',
      '##########',
    ],
  },
  {
    id: 6,
    par: 13,
    title: 'TWO OF YOU',
    delays: [3, 6],
    hint: 'Two plates, two echoes. Three-turns-ago holds one, six-turns-ago holds the other, and you walk through the gap.',
    grid: [
      '###########',
      '#@..p#....#',
      '#....#....#',
      '#..p.g..X.#',
      '#....#....#',
      '###########',
    ],
  },
  {
    id: 7,
    par: 15,
    title: 'CROWDED',
    delays: [3, 6],
    hint: 'Less room now. Hit both plates on time, and keep out of your own way.',
    grid: [
      '############',
      '#@...p#....#',
      '#.....#....#',
      '#...p.g...X#',
      '#.....#....#',
      '############',
    ],
  },
  {
    id: 8,
    par: 12,
    title: 'TRIO',
    delays: [2, 4, 6],
    hint: 'Three plates, three echoes, two turns apart. The whole route is one clock — a single wasted step breaks it.',
    grid: [
      '##########',
      '#@..#....#',
      '#.p.#....#',
      '#p..g..X.#',
      '#.p.#....#',
      '#...#....#',
      '##########',
    ],
  },
];
