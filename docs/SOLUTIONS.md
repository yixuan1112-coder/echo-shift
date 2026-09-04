# Solutions — SPOILERS

Every line below is the **optimal** solution, produced by `tools/solver.mjs`
(breadth-first search over the same rules engine the game runs) and re-checked
by `npm test`. The in-game **DEMO** button plays exactly these back.

`·` means *wait one turn* — usually the most important move on the board,
because waiting is how you make an echo linger on a plate.

## 1. ECHO  — 14 moves, echo -3

> Take a few steps, then look behind you. That flickering thing is you, three turns ago.

```
#########
#@......#
#######.#
#X......#
#########
```

→ → → → → → ↓ ↓ ← ← ← ← ← ←

## 2. HOLD THE PAST  — 9 moves, echo -3

> A gate is open only while every plate is held down. You cannot be in two places at once — but three turns ago, you can.

```
#########
#@..#X..#
#...g...#
#.p.#...#
#########
```

↓ ↓ → ↑ → · → → ↑

## 3. LINGER  — 8 moves, echo -3

> The gate stays open for exactly as long as you stood on the plate. A plate this close to the gate means standing there longer.

```
#########
#@.p#...#
#...g.X.#
#...#...#
#########
```

→ → ↓ ↑ ↓ → → →

## 4. BACKTRACK  — 17 moves, echo -5

> Your echo retraces the way you came. In a one-tile dead end you will always meet it head-on — unless you duck into the alcove and let it pass.

```
##########
#@..g...X#
#.########
#..#######
#p########
##########
```

↓ ↓ → ← ↑ ↓ ↓ ↑ ↑ ↑ → → → → → → →

## 5. EXACTLY FIVE  — 13 moves, echo -5

> Plate to gate is five steps. The delay is five turns. Nothing to spare.

```
##########
#@...#X..#
#....#...#
#....g...#
#....#...#
#p...#...#
##########
```

↓ ↓ ↓ ↓ ↑ ↑ → → → → → ↑ ↑

## 6. TWO OF YOU  — 13 moves, echo -3 / -6

> Two plates, two echoes. Three-turns-ago holds one, six-turns-ago holds the other, and you walk through the gap.

```
###########
#@..p#....#
#....#....#
#..p.g..X.#
#....#....#
###########
```

→ → → ↓ ↓ ← ↑ → ↓ → → → →

## 7. CROWDED  — 15 moves, echo -3 / -6

> Less room now. Hit both plates on time, and keep out of your own way.

```
############
#@...p#....#
#.....#....#
#...p.g...X#
#.....#....#
############
```

→ → → → ↓ ↓ ← ↑ → ↓ → → → → →

## 8. TRIO  — 12 moves, echo -2 / -4 / -6

> Three plates, three echoes, two turns apart. The whole route is one clock — a single wasted step breaks it.

```
##########
#@..#....#
#.p.#....#
#p..g..X.#
#.p.#....#
#...#....#
##########
```

↓ ↓ ↓ → ↑ ↑ → ↓ → → → →

---

Regenerate with `npm run solutions`.
