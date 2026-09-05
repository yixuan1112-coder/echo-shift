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
 * Because there is no waiting, nobody can hold a plate for two turns running,
 * so a gate does not stay open — it blinks for exactly one turn per visit.
 * Two consequences shape every level below:
 *
 *   PARITY  every move flips (x + y) mod 2, so the distance from a plate to a
 *           gate's approach tile must match the delay's parity. When it is
 *           short by two, you must burn the difference walking a detour.
 *   REVISIT n gates in series need n separate blinks, so you must return to
 *           the plate n times, spaced exactly as far apart as the gates are.
 *
 * Every level is checked: solvable, and (from L2 on) NOT solvable if the
 * echoes are taken away.
 */
export const LEVELS = [
  {
    id: 1, par: 14, title: 'STEP', delays: [3],
    hint: 'There is no waiting in this game — every turn you must move. Walk a while, then look behind you: that is you, three turns ago.',
    grid: [
      '#########',
      '#@......#',
      '#######.#',
      '#X......#',
      '#########',
    ],
  },
  {
    id: 2, par: 8, title: 'BLINK', delays: [3],
    hint: 'A gate opens only while a plate is held. You cannot stand still, so your echo can only touch the plate for a single turn — the gate blinks. Be at the doorway on exactly that turn.',
    grid: [
      '#########',
      '#@..#X..#',
      '#...g...#',
      '#p..#...#',
      '#########',
    ],
  },
  {
    id: 3, par: 10, title: 'DETOUR', delays: [4],
    hint: 'The plate is closer to the door than the delay is long. You cannot wait out the difference, so you have to walk it off — and a detour always costs an even number of turns.',
    grid: [
      '##########',
      '#@..#X...#',
      '#...g....#',
      '#.p.#....#',
      '##########',
    ],
  },
  {
    id: 4, par: 17, title: 'DEAD END', delays: [5],
    hint: 'Your echo retraces the way you came, and in a one-tile corridor you cannot dodge or wait. Use the alcove, and mind that with an odd delay the danger is swapping places with it.',
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
    id: 5, par: 14, title: 'RING VAULT', delays: [6],
    hint: 'One loop of corridor, one plate, one vault. The only question is where on the ring you should be when the blink comes.',
    grid: [
      '#########',
      '#@......#',
      '#.#####.#',
      '#.#...#.#',
      '#.#.X.#.#',
      '#.#g###.#',
      '#p......#',
      '#########',
    ],
  },
  {
    id: 6, par: 14, title: 'TWO DOORS', delays: [5],
    hint: 'Two gates means two blinks, which means visiting the plate twice — and the gap between your two visits has to match the gap between the doors exactly.',
    grid: [
      '###########',
      '#@..#...#.#',
      '#.p.g...g.#',
      '#...#...#X#',
      '###########',
    ],
  },
  {
    id: 7, par: 13, title: 'TWO OF YOU', delays: [3, 6],
    hint: 'Two plates, and every plate must be held at once. Three-turns-ago takes one, six-turns-ago takes the other, and you have to be somewhere else entirely.',
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
    id: 8, par: 14, title: 'TRIO', delays: [4, 6, 8],
    hint: 'Three plates, three echoes, two turns apart. Your route through those plates is the same route all three of them will walk — arrange it so they land together.',
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
  {
    id: 9, par: 19, title: 'ASYMMETRY', delays: [7],
    hint: 'The two rooms are not the same width, so the two blinks you need are not evenly spaced. Work out the second gap before you commit to the first.',
    grid: [
      '###############',
      '#@..#...#.....#',
      '#.p.g...g....X#',
      '#...#...#.....#',
      '###############',
    ],
  },
  {
    id: 10, par: 18, title: 'THE LONG WAY', delays: [2, 7],
    hint: 'Room enough to wander, which is the trap: both plates must be covered on the same turn by echoes that are five turns apart.',
    grid: [
      '#############',
      '#@...p#.....#',
      '#.....#.....#',
      '#.....g....X#',
      '#..p..#.....#',
      '#.....#.....#',
      '#############',
    ],
  },
  {
    id: 11, par: 21, title: 'DEEPER', delays: [9],
    hint: 'Same rooms, nine turns of delay. Everything you do now lands a very long time from now.',
    grid: [
      '###############',
      '#@..#...#.....#',
      '#.p.g...g....X#',
      '#...#...#.....#',
      '###############',
    ],
  },
  {
    id: 12, par: 20, title: 'CLOCKWORK', delays: [4, 9],
    hint: 'Two plates, two echoes, five turns apart, in a room big enough to lose yourself in. There is exactly one shape of path that lines them up.',
    grid: [
      '#############',
      '#@...p#.....#',
      '#.....#.....#',
      '#.....g....X#',
      '#..p..#.....#',
      '#.....#.....#',
      '#############',
    ],
  },
  {
    id: 13, par: 24, title: 'THREE DOORS', delays: [9],
    hint: 'Three gates, one plate, nine turns of delay. You must stand on that plate four separate times, at the right spacing, before you take a single step towards the first door.',
    grid: [
      '#################',
      '#@..#...#...#...#',
      '#.p.g...g...g...#',
      '#...#...#...#..X#',
      '#################',
    ],
  },
];
