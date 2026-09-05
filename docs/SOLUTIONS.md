# Solutions — SPOILERS

Every line below is the **optimal** solution, produced by `tools/solver.mjs`
(breadth-first search over the same rules engine the game runs) and re-checked
by `npm test`. The in-game **DEMO** button plays exactly these back.

`·` means *wait one turn* — usually the most important move on the board,
because waiting is how you make an echo linger on a plate.

## 1. STEP  — 14 moves, echo -3

> There is no waiting in this game — every turn you must move. Walk a while, then look behind you: that is you, three turns ago.

```
#########
#@......#
#######.#
#X......#
#########
```

→ → → → → → ↓ ↓ ← ← ← ← ← ←

## 2. BLINK  — 8 moves, echo -3

> A gate opens only while a plate is held. You cannot stand still, so your echo can only touch the plate for a single turn — the gate blinks. Be at the doorway on exactly that turn.

```
#########
#@..#X..#
#...g...#
#p..#...#
#########
```

↓ ↓ ↑ → → → → ↑

## 3. DETOUR  — 10 moves, echo -4

> The plate is closer to the door than the delay is long. You cannot wait out the difference, so you have to walk it off — and a detour always costs an even number of turns.

```
##########
#@..#X...#
#...g....#
#.p.#....#
##########
```

↓ ↓ → ↑ ↑ ↓ → → → ↑

## 4. DEAD END  — 17 moves, echo -5

> Your echo retraces the way you came, and in a one-tile corridor you cannot dodge or wait. Use the alcove, and mind that with an odd delay the danger is swapping places with it.

```
##########
#@..g...X#
#.########
#..#######
#p########
##########
```

↓ ↓ → ← ↑ ↓ ↓ ↑ ↑ ↑ → → → → → → →

## 5. RING VAULT  — 14 moves, echo -6

> One loop of corridor, one plate, one vault. The only question is where on the ring you should be when the blink comes.

```
#########
#@......#
#.#####.#
#.#...#.#
#.#.X.#.#
#.#g###.#
#p......#
#########
```

↓ ↓ ↓ ↓ ↓ ↑ ↑ ↓ ↓ → → ↑ ↑ →

## 6. TWO DOORS  — 14 moves, echo -5

> Two gates means two blinks, which means visiting the plate twice — and the gap between your two visits has to match the gap between the doors exactly.

```
###########
#@..#...#.#
#.p.g...g.#
#...#...#X#
###########
```

↓ → ↑ ↓ ↑ ↓ → → → → → → → ↓

## 7. TWO OF YOU  — 13 moves, echo -3 / -6

> Two plates, and every plate must be held at once. Three-turns-ago takes one, six-turns-ago takes the other, and you have to be somewhere else entirely.

```
###########
#@..p#....#
#....#....#
#..p.g..X.#
#....#....#
###########
```

→ → → ↓ ↓ ← ↑ → ↓ → → → →

## 8. TRIO  — 14 moves, echo -4 / -6 / -8

> Three plates, three echoes, two turns apart. Your route through those plates is the same route all three of them will walk — arrange it so they land together.

```
##########
#@..#....#
#.p.#....#
#p..g..X.#
#.p.#....#
#...#....#
##########
```

↓ ↓ ↑ → ↓ ↓ ↑ ↓ → ↑ → → → →

## 9. ASYMMETRY  — 19 moves, echo -7

> The two rooms are not the same width, so the two blinks you need are not evenly spaced. Work out the second gap before you commit to the first.

```
###############
#@..#...#.....#
#.p.g...g....X#
#...#...#.....#
###############
```

↓ → ↑ ↓ ↑ ↓ ↑ ↓ → → → → → → → → → → →

## 10. THE LONG WAY  — 18 moves, echo -2 / -7

> Room enough to wander, which is the trap: both plates must be covered on the same turn by echoes that are five turns apart.

```
#############
#@...p#.....#
#.....#.....#
#.....g....X#
#..p..#.....#
#.....#.....#
#############
```

↓ ↓ ↓ → → ↑ ↑ ↑ → → ↓ ↓ → → → → → →

## 11. DEEPER  — 21 moves, echo -9

> Same rooms, nine turns of delay. Everything you do now lands a very long time from now.

```
###############
#@..#...#.....#
#.p.g...g....X#
#...#...#.....#
###############
```

↓ → ↑ ↓ ↑ ↓ ↑ ↓ ↑ ↓ → → → → → → → → → → →

## 12. CLOCKWORK  — 20 moves, echo -4 / -9

> Two plates, two echoes, five turns apart, in a room big enough to lose yourself in. There is exactly one shape of path that lines them up.

```
#############
#@...p#.....#
#.....#.....#
#.....g....X#
#..p..#.....#
#.....#.....#
#############
```

↓ ↓ ↓ → → ↑ ↑ ↑ → → ↓ ↑ ↓ ↓ → → → → → →

## 13. THREE DOORS  — 24 moves, echo -9

> Three gates, one plate, nine turns of delay. You must stand on that plate four separate times, at the right spacing, before you take a single step towards the first door.

```
#################
#@..#...#...#...#
#.p.g...g...g...#
#...#...#...#..X#
#################
```

↓ → ↑ ↓ ↑ ↓ ↑ ↓ ↑ ↓ → → → → → → → → → → → ↓ → →

---

Regenerate with `npm run solutions`.
