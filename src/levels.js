/**
 * Levels.
 *
 * Grid legend:  # wall   . floor   @ you   X exit   p pressure plate   g gate
 *                * shard   S sentinel (1 HP)   1-9 sentinel with that HP
 *                o brittle floor (one crossing: it falls when you step off)
 * `noBacktrack: true` additionally forbids stepping back onto last turn's tile.
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
 * From L24 on, two more, both aimed at the same thing — pacing on the spot
 * (the ↑↓↑↓ that padded most of the solutions above) is time spent without a
 * decision in it, so it goes:
 *
 *   HP       Sentinels written as digits carry that much HP, and the only
 *            thing that beats HP is shards: POWER = 1 + shards held. A 3 HP
 *            guard costs two shards first, which turns a level into a chain —
 *            fetch, kill, fetch, kill. Too weak and no swing is offered at
 *            all, so a guard you cannot beat is not a free pause either.
 *   BRITTLE  `o` collapses the moment you step off it. One crossing, never a
 *            place to bounce.
 *   noBacktrack  You may not return to last turn's tile, so burning a turn
 *            has to be a real loop. WATCH OUT when designing: a one-tile
 *            alcove becomes a death trap, because you can never step back out
 *            of it — put shards ON a corridor, not in a pocket.
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

  // ---- no more pacing on the spot ----
  {
    id: 24, par: 14, title: 'CLOSED LOOP', delays: [8], noBacktrack: true,
    hint: 'Same two rooms as DETOUR, one new rule: you may not step back onto the tile you just left — the red bar shows which one. You still have to burn the difference before the blink, but now it has to be a loop.',
    grid: [
      '##########',
      '#@..#X...#',
      '#...g....#',
      '#.p.#....#',
      '##########',
    ],
  },
  {
    id: 25, par: 16, title: 'CRACKED', delays: [10], noBacktrack: true,
    hint: 'The dark tiles take your weight exactly once: step off one and it falls away behind you. Ten turns of delay to kill and a shrinking room to kill them in — work out which crossings you can afford to spend.',
    grid: [
      '##########',
      '#@oo#X...#',
      '#o..g....#',
      '#.po#....#',
      '##########',
    ],
  },
  {
    id: 26, par: 18, title: 'WHETSTONE', delays: [7], noBacktrack: true,
    hint: 'The guard in the doorway has 2 HP and you swing for 1, so it is grey and the STRIKE button will not even light. Your power is 1 plus the shards you carry — the one in the alcove is not treasure, it is a weapon.',
    grid: [
      '###########',
      '#@..#*.#..#',
      '#.p.g..2.X#',
      '#...#..#..#',
      '###########',
    ],
  },
  {
    id: 27, par: 25, title: 'THE ARMOURY', delays: [9], noBacktrack: true,
    hint: 'Two guards, 2 HP and 3 HP, and a shard in front of each. The order is forced; what is not forced is how you spend the nine turns before you ever reach the first door.',
    grid: [
      '#############',
      '#@..#*.#*.#.#',
      '#.p.g..2..3X#',
      '#...#..#..#.#',
      '#############',
    ],
  },
  {
    id: 28, par: 16, title: 'LOOP ROOM', delays: [9], noBacktrack: true,
    hint: 'A wide room with a brittle block in the middle of it, so the loops you can walk are a real choice and there are only so many of each length. Pick the one that lands you at the door on the blink.',
    grid: [
      '############',
      '#@....#X...#',
      '#..oo.#....#',
      '#.p...g....#',
      '#..oo.#....#',
      '#.....#....#',
      '############',
    ],
  },
  {
    id: 29, par: 18, title: 'LONG LOOP', delays: [2, 11], noBacktrack: true,
    hint: 'The same room, two echoes nine turns apart, and every tile you burn is a tile both of them will walk. This is the biggest search in the game — there is no wiggling your way into it.',
    grid: [
      '############',
      '#@....#X...#',
      '#..oo.#....#',
      '#.p...g....#',
      '#..oo.#....#',
      '#.....#....#',
      '############',
    ],
  },
  {
    id: 30, par: 23, title: 'VAULT OF ARMS', delays: [3, 11], noBacktrack: true,
    hint: 'Everything at once: a double gate that only a held plate opens, then 2 HP, then 3 HP, with the shard that arms you for each lying in the corridor just before it. Three swings, and the first one is not at a guard.',
    grid: [
      '##############',
      '#@..##..#..#.#',
      '#.p.gg*.2*.3X#',
      '#.S.##..#..#.#',
      '##############',
    ],
  },
];
