# Solutions — SPOILERS

Every line below is the **optimal** solution, produced by `tools/solver.mjs`
(breadth-first search over the same rules engine the game runs) and re-checked
by `npm test`. The in-game **DEMO** button plays exactly these back.

`✶` is a **strike**: it cuts down every sentinel next to you and spends the
turn standing still. It is the only move that does not change your position, so
it is also the only way to flip parity and the only way to make an echo pause on
a plate — which is the only way a gate stays open for two turns instead of
blinking for one.

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

## 14. RELIC  — 10 moves, echo -4

> The door is barred. A shard is lying in the near room and the exit will not open until you are carrying it — so the question is no longer how to reach the door, it is what the trip to the shard does to your timing.

```
##########
#@..#X...#
#...g....#
#.p.#....#
#..*#....#
##########
```

↓ ↓ → ↓ → ↑ ↑ → → ↑

## 15. HOARD  — 16 moves, echo -5

> Two shards, one on each side of the gate. You get exactly one blink through that door, so decide which shard you are collecting on which side of it before you take a step.

```
###########
#@.*#..*..#
#.p.g.....#
#...#....X#
###########
```

↓ → ↑ ↓ ↑ → ↓ → → ↑ → → ↓ ↓ → →

## 16. THE GUARD  — 11 moves, echo -3

> Something is standing in the only tile past the gate. Press space to strike it down — but a strike costs a turn in which you do not move, and you will be standing in the doorway when you spend it.

```
##########
#@..#....#
#.p.gS..X#
#...#....#
##########
```

↓ → ↑ ↓ → → ✶ → → → →

## 17. OFF BEAT  — 13 moves, echo -7

> Nothing is in your way here. The plate and the door are simply an odd number of steps apart, and every move you make flips your parity — so the only turn that can fix it is the one turn that does not move you at all.

```
##########
#@..#X...#
#...g....#
#.pS#....#
##########
```

↓ ↓ → ↑ ↑ ↓ ↑ ↓ → ✶ → → ↑

## 18. HELD OPEN  — 13 moves, echo -6

> Two gate tiles back to back: you need the door open on two consecutive turns, which no blink has ever given you. Strike while you are standing on the plate, and the echo replaying that turn will stand on it twice.

```
##########
#@..#....#
#.p.gg..X#
#.S.#....#
##########
```

↓ → ✶ ↑ ↓ ↑ ↓ → → → → → →

## 19. RELIQUARY  — 17 moves, echo -7

> The shard is behind the gate and something is standing between you and it. You have one blink to get in, and the turn you spend swinging is a turn your echo will spend standing still.

```
###########
#@..#..#..#
#.p.g.S*..#
#...#..#.X#
###########
```

↓ → ↑ ↓ ↑ ↓ ↑ ↓ → → → ✶ → → → ↓ →

## 20. THE LONG HELD  — 19 moves, echo -8

> A double gate, and the shard that unseals the exit is on the far side of it. Everything depends on which turn you choose to stand on the plate and swing.

```
###########
#@..#..*..#
#.p.gg....#
#.S.#....X#
###########
```

↓ → ✶ ↑ ↓ ↑ ↓ ↑ ↓ → → → ↑ → → ↓ ↓ → →

## 21. VAULT RUN  — 29 moves, echo -2 / -13

> The shard is through the door and the exit is back on this side, so you have to pass that one gate twice. The near echo is no use for the return trip — that is what the far one is for.

```
############
#@..#......#
#.p.g...*..#
#.X.#......#
############
```

↓ → ↑ ← ↓ → → ↑ ← ← ↓ → ↑ → ↓ → → ↑ → → → ↓ ← ← ← ← ← ↓ ←

## 22. DEEP VAULT  — 20 moves, echo -9

> Two doors in series and the shard is past both of them. Two blinks means two visits to the plate, spaced exactly as far apart as the doors — and this time you cannot leave until you have been all the way in.

```
#############
#@..#...#...#
#.p.g...g.*.#
#...#...#..X#
#############
```

↓ → ↑ ↓ ↑ ↓ ↑ ↓ ↑ ↓ → → → → → → → → ↓ →

## 23. TWIN HOLDS  — 25 moves, echo -3 / -10

> Two double gates, so you need the doors held open twice — and there is only one sentinel, so you only get one swing. That is enough: a single strike is replayed by BOTH echoes, and they are seven turns apart.

```
##############
#@..#...#....#
#.p.gg..gg..X#
#.S.#...#....#
##############
```

↓ → ↑ ↓ ↑ ← ↓ ↑ ↓ → ✶ → → → ↑ → ↓ ↑ ↓ → → → → → →

---

Regenerate with `npm run solutions`.
