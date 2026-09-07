/**
 * Levels.
 *
 * Grid legend:  # wall   . floor   @ you   X exit   p pressure plate   g gate
 *                * shard   S sentinel
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
 * From L14 on, two more things are in play:
 *
 *   SHARD    the exit is barred until you are carrying every one of them, so
 *            the route stops being "reach the door" and becomes "reach the
 *            door having already been everywhere else".
 *   SENTINEL blocks its tile until you STRIKE it. A strike is the only turn
 *            you ever spend without moving, which makes it the only way to
 *            flip parity — and, later, the only way an echo stands still. An
 *            echo that stands still on a plate holds it for two turns running,
 *            and that is the only way a gate stays open instead of blinking.
 *            One swing clears every sentinel around you, so a given tile is
 *            worth exactly one pause, no matter how many you crowd next to it.
 *
 * Every level is checked: solvable, and (from L2 on) NOT solvable if the
 * echoes are taken away. Levels that carry a sentinel are checked a third
 * way — they must be unsolvable if the strike is taken away, so the attack is
 * load-bearing rather than scenery.
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

  // ---- shards and sentinels ----
  {
    id: 14, par: 10, title: 'RELIC', delays: [4],
    hint: 'The door is barred. A shard is lying in the near room and the exit will not open until you are carrying it — so the question is no longer how to reach the door, it is what the trip to the shard does to your timing.',
    grid: [
      '##########',
      '#@..#X...#',
      '#...g....#',
      '#.p.#....#',
      '#..*#....#',
      '##########',
    ],
  },
  {
    id: 15, par: 16, title: 'HOARD', delays: [5],
    hint: 'Two shards, one on each side of the gate. You get exactly one blink through that door, so decide which shard you are collecting on which side of it before you take a step.',
    grid: [
      '###########',
      '#@.*#..*..#',
      '#.p.g.....#',
      '#...#....X#',
      '###########',
    ],
  },
  {
    id: 16, par: 11, title: 'THE GUARD', delays: [3],
    hint: 'Something is standing in the only tile past the gate. Press space to strike it down — but a strike costs a turn in which you do not move, and you will be standing in the doorway when you spend it.',
    grid: [
      '##########',
      '#@..#....#',
      '#.p.gS..X#',
      '#...#....#',
      '##########',
    ],
  },
  {
    id: 17, par: 13, title: 'OFF BEAT', delays: [7],
    hint: 'Nothing is in your way here. The plate and the door are simply an odd number of steps apart, and every move you make flips your parity — so the only turn that can fix it is the one turn that does not move you at all.',
    grid: [
      '##########',
      '#@..#X...#',
      '#...g....#',
      '#.pS#....#',
      '##########',
    ],
  },
  {
    id: 18, par: 13, title: 'HELD OPEN', delays: [6],
    hint: 'Two gate tiles back to back: you need the door open on two consecutive turns, which no blink has ever given you. Strike while you are standing on the plate, and the echo replaying that turn will stand on it twice.',
    grid: [
      '##########',
      '#@..#....#',
      '#.p.gg..X#',
      '#.S.#....#',
      '##########',
    ],
  },
  {
    id: 19, par: 17, title: 'RELIQUARY', delays: [7],
    hint: 'The shard is behind the gate and something is standing between you and it. You have one blink to get in, and the turn you spend swinging is a turn your echo will spend standing still.',
    grid: [
      '###########',
      '#@..#..#..#',
      '#.p.g.S*..#',
      '#...#..#.X#',
      '###########',
    ],
  },
  {
    id: 20, par: 19, title: 'THE LONG HELD', delays: [8],
    hint: 'A double gate, and the shard that unseals the exit is on the far side of it. Everything depends on which turn you choose to stand on the plate and swing.',
    grid: [
      '###########',
      '#@..#..*..#',
      '#.p.gg....#',
      '#.S.#....X#',
      '###########',
    ],
  },
  {
    id: 21, par: 29, title: 'VAULT RUN', delays: [2, 13],
    hint: 'The shard is through the door and the exit is back on this side, so you have to pass that one gate twice. The near echo is no use for the return trip — that is what the far one is for.',
    grid: [
      '############',
      '#@..#......#',
      '#.p.g...*..#',
      '#.X.#......#',
      '############',
    ],
  },
  {
    id: 22, par: 20, title: 'DEEP VAULT', delays: [9],
    hint: 'Two doors in series and the shard is past both of them. Two blinks means two visits to the plate, spaced exactly as far apart as the doors — and this time you cannot leave until you have been all the way in.',
    grid: [
      '#############',
      '#@..#...#...#',
      '#.p.g...g.*.#',
      '#...#...#..X#',
      '#############',
    ],
  },
  {
    id: 23, par: 25, title: 'TWIN HOLDS', delays: [3, 10],
    hint: 'Two double gates, so you need the doors held open twice — and there is only one sentinel, so you only get one swing. That is enough: a single strike is replayed by BOTH echoes, and they are seven turns apart.',
    grid: [
      '##############',
      '#@..#...#....#',
      '#.p.gg..gg..X#',
      '#.S.#...#....#',
      '##############',
    ],
  },
];
