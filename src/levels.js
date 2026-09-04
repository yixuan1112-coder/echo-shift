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
    title: '回声 / Echo',
    delays: [3],
    hint: '走两步，看看身后。那个半透明的家伙，是三回合前的你。',
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
    title: '按住过去 / Hold the Past',
    delays: [3],
    hint: '闸门只在压力板被踩住时开启。你没法同时站在两个地方——但三回合前的你可以。',
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
    title: '站得久一点 / Linger',
    delays: [3],
    hint: '你在板上站了几回合，门就为你开几回合。板离门太近，就得站得更久。',
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
    title: '回头路 / Backtrack',
    delays: [5],
    hint: '回声会原样重走你的来路。在一格宽的死路里，你和它必然迎面相撞——除非你闪进旁边的凹口，等它过去。',
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
    title: '恰好五步 / Exactly Five',
    delays: [5],
    hint: '板到门刚好五步，延迟也刚好五回合。一步都不能浪费。',
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
    title: '两个自己 / Two of You',
    delays: [3, 6],
    hint: '两块板，两个回声。三回合前的你踩一块，六回合前的你踩另一块，现在的你走过去。',
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
    title: '拥挤 / Crowded',
    delays: [3, 6],
    hint: '空间变窄了。既要踩准两块板，又不能让回声撞上你。',
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
    title: '三重奏 / Trio',
    delays: [2, 4, 6],
    hint: '三块板，三个回声，间隔两回合。整条路线是一台钟表——差一步都不行。',
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
