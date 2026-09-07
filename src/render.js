/**
 * Pixel-art canvas renderer.
 *
 * Everything is drawn on an 8x8 sprite grid per tile, so `u` (one sprite pixel)
 * is the only unit that exists. Cell sizes are forced to multiples of 8 and
 * every coordinate is an integer, with image smoothing off — nothing here is
 * ever allowed to land on a half pixel.
 *
 * The visual language carries the mechanic: NOW is a solid bevelled block, the
 * PAST is the same block dissolved into a checkerboard dither and split into
 * cyan/magenta — one body, dislocated in time. Corner ticks mark where an echo
 * steps next, so every paradox is something you could have seen coming.
 */
import {
  WALL, EXIT, PLATE, GATE, BRITTLE,
  tileAt, echoPositions, nextEchoPositions, gatesOpen,
  shardAt, sentinelAt, exitOpen, power, isBroken, previousPosition,
} from './engine.js';

const C = {
  bg: '#0b0d12',
  wall: '#0b0d12',
  wallEdge: '#161c28',
  floor: '#161b26',
  floorDot: '#222a3a',
  exit: '#5ce08a',
  plate: '#4a5468',
  plateOn: '#f0b429',
  gate: '#e05263',
  gateOpen: '#4a2b32',
  now: '#f5c542',
  nowLight: '#fff0a8',
  nowDark: '#a37c14',
  echoA: '#4dd6ff',
  echoB: '#ff5ea8',
  paradox: '#e05263',
  shard: '#7ef0d5',
  shardLight: '#dffff6',
  sealed: '#2b3a33',      // the exit while shards are still out there
  sentinel: '#9d6bff',
  sentinelDark: '#5b3a99',
  sentinelEye: '#ffe8a8',
  sentinelTough: '#4a4260',     // stronger than you: no swing is even offered
  sentinelToughDark: '#2f2a3d',
  strike: '#fff0a8',
  brittle: '#3a3020',           // floor you get one crossing out of
  brittleCrack: '#12100b',
  voidRim: '#241d12',           // where a brittle tile used to be
  barred: '#5a2530',            // last turn's tile, under noBacktrack
};

// 3x5 bitmap digits, so even the numbers are made of the same pixels.
const GLYPH = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '001', '001', '001'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
};

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let anim = new Map();
  const ditherCache = new Map();
  // A strike is the only turn where nothing moves, so it needs its own tell.
  let flash = { turn: -1, t: 0 };

  function reset() { anim = new Map(); flash = { turn: -1, t: 0 }; }

  function ease(key, target, dt) {
    const cur = anim.get(key);
    if (!cur) { anim.set(key, { ...target }); return target; }
    const k = 1 - Math.pow(0.0004, dt);
    cur.x += (target.x - cur.x) * k;
    cur.y += (target.y - cur.y) * k;
    if (Math.abs(cur.x - target.x) < 0.004) cur.x = target.x;
    if (Math.abs(cur.y - target.y) < 0.004) cur.y = target.y;
    return cur;
  }

  /**
   * 50% checkerboard fill: how a solid body reads as a ghost in pixel art.
   * `phase` picks which half of the board gets filled, so two colours laid
   * down in opposite phases interleave into one dislocated body.
   */
  function dither(color, unit, phase = 0) {
    const key = color + '@' + unit + '/' + phase;
    let pat = ditherCache.get(key);
    if (!pat) {
      const off = document.createElement('canvas');
      off.width = off.height = unit * 2;
      const o = off.getContext('2d');
      o.fillStyle = color;
      if (phase) { o.fillRect(unit, 0, unit, unit); o.fillRect(0, unit, unit, unit); }
      else { o.fillRect(0, 0, unit, unit); o.fillRect(unit, unit, unit, unit); }
      pat = ctx.createPattern(off, 'repeat');
      ditherCache.set(key, pat);
    }
    return pat;
  }

  function layout(board) {
    const dpr = window.devicePixelRatio || 1;
    const avail = canvas.parentElement.clientWidth;
    const maxH = Math.min(window.innerHeight * 0.6, 520);
    // Multiples of 8 only, so one sprite pixel is always a whole pixel.
    const raw = Math.min(avail / board.w, maxH / board.h);
    const cell = Math.max(24, Math.floor(raw / 8) * 8);
    const cssW = cell * board.w;
    const cssH = cell * board.h;
    if (canvas.style.height !== cssH + 'px') canvas.style.height = cssH + 'px';

    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    return {
      cell, u: cell / 8,
      ox: Math.round((rect.width - cssW) / 2),
      oy: Math.round((rect.height - cssH) / 2),
      w: rect.width, h: rect.height,
    };
  }

  function draw(board, state, dt, time) {
    const L = layout(board);
    const { cell, u, ox, oy } = L;
    const R = (x, y, w, h) => ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    const px = (x) => ox + x * cell;
    const py = (y) => oy + y * cell;

    /** Draw a short number out of the 3x5 bitmap font, `gs` pixels per dot. */
    const glyphs = (text, gx, gy, gs, colour) => {
      ctx.fillStyle = colour;
      for (const ch of text) {
        const g = GLYPH[ch];
        if (g) {
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 3; c++) if (g[r][c] === '1') R(gx + c * gs, gy + r * gs, gs, gs);
          }
        }
        gx += gs * 4;
      }
    };

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, L.w, L.h);

    const open = gatesOpen(board, state);
    const bodies = [state.pos, ...echoPositions(board, state).filter(Boolean)];

    // ---- tiles ----
    for (let y = 0; y < board.h; y++) {
      for (let x = 0; x < board.w; x++) {
        const tile = tileAt(board, x, y);
        const X = px(x), Y = py(y);
        if (tile === WALL) { ctx.fillStyle = C.wall; R(X, Y, cell, cell); continue; }

        if (tile === BRITTLE && isBroken(board, state, x, y)) {
          // It fell. Leave a hole with a rim, so it never reads as "always wall".
          ctx.fillStyle = C.bg;
          R(X, Y, cell, cell);
          ctx.fillStyle = C.voidRim;
          R(X, Y, cell, u); R(X, Y + cell - u, cell, u);
          R(X, Y, u, cell); R(X + cell - u, Y, u, cell);
          continue;
        }

        ctx.fillStyle = tile === BRITTLE ? C.brittle : C.floor;
        R(X, Y, cell, cell);
        if (tile === BRITTLE) {                 // a fault line across the slab
          ctx.fillStyle = C.brittleCrack;
          R(X + u, Y + u * 2, u * 2, u);
          R(X + u * 3, Y + u * 3, u * 2, u);
          R(X + u * 2, Y + u * 4, u * 2, u);
          R(X + u * 4, Y + u * 5, u * 3, u);
        } else {
          ctx.fillStyle = C.floorDot;           // one dot per tile: a quiet lattice
          R(X, Y, u, u);
        }
        if (tileAt(board, x, y - 1) === WALL) { ctx.fillStyle = C.wallEdge; R(X, Y, cell, u); }

        if (tile === EXIT) {
          // Corner brackets, pulsing in two discrete steps — no soft fades.
          // While shards are still out there the door is dead: no pulse, no
          // colour, and a bar drawn straight across it.
          const live = exitOpen(board, state);
          const inset = live && Math.floor(time / 480) % 2 ? u : 0;
          ctx.fillStyle = live ? C.exit : C.sealed;
          const a = u + inset, len = u * 2, t = u;
          const b = cell - a;
          R(X + a, Y + a, len, t);          R(X + a, Y + a, t, len);
          R(X + b - len, Y + a, len, t);    R(X + b - t, Y + a, t, len);
          R(X + a, Y + b - t, len, t);      R(X + a, Y + b - len, t, len);
          R(X + b - len, Y + b - t, len, t); R(X + b - t, Y + b - len, t, len);
          if (!live) { ctx.fillStyle = C.sealed; R(X + u * 2, Y + u * 3.5, cell - u * 4, u); }
        }

        if (tile === PLATE) {
          // The ring sits on the tile edge, not inside it, so a plate still
          // reads as held even with a body standing on top of it.
          const on = bodies.some((b) => b.x === x && b.y === y);
          const t = Math.max(1, Math.round(u / 2));
          ctx.fillStyle = on ? C.plateOn : C.plate;
          R(X, Y, cell, t);
          R(X, Y + cell - t, cell, t);
          R(X, Y, t, cell);
          R(X + cell - t, Y, t, cell);
        }

        if (tile === GATE) {
          if (open) {                            // two posts: the doorway is clear
            ctx.fillStyle = C.gateOpen;
            R(X, Y, u, cell); R(X + cell - u, Y, u, cell);
          } else {                               // a portcullis, punched through
            ctx.fillStyle = C.gate;
            R(X, Y, cell, cell);
            ctx.fillStyle = C.bg;
            R(X + u * 2, Y, u, cell); R(X + u * 5, Y, u, cell);
          }
        }
      }
    }

    // ---- shards: what seals the exit ----
    for (const p of board.shards) {
      if (shardAt(board, state, p.x, p.y) < 0) continue;      // already taken
      const bob = Math.floor(time / 380) % 2 ? 0 : u;         // two frames, no tweening
      const X = px(p.x), Y = py(p.y) + bob;
      ctx.fillStyle = C.shard;                                 // a cut stone: 2/4/6/6/4/2
      R(X + u * 3, Y + u,     u * 2, u);
      R(X + u * 2, Y + u * 2, u * 4, u);
      R(X + u,     Y + u * 3, u * 6, u * 2);
      R(X + u * 2, Y + u * 5, u * 4, u);
      R(X + u * 3, Y + u * 6, u * 2, u);
      ctx.fillStyle = C.shardLight;                            // one lit facet
      R(X + u * 3, Y + u * 2, u, u);
      R(X + u * 2, Y + u * 3, u, u);
    }

    // ---- sentinels: what blocks it ----
    const pow = power(board, state);
    for (const p of board.sentinels) {
      if (sentinelAt(board, state, p.x, p.y) < 0) continue;    // cut down
      const X = px(p.x), Y = py(p.y);
      // Colour is the whole rule: lit means you are strong enough to swing at
      // it right now, grey means go and find another shard first.
      const weak = p.hp <= pow;
      ctx.fillStyle = weak ? C.sentinel : C.sentinelTough;
      R(X + u, Y + u * 2, u * 6, u * 5);
      R(X + u, Y + u, u, u);                                   // horns
      R(X + u * 6, Y + u, u, u);
      ctx.fillStyle = weak ? C.sentinelDark : C.sentinelToughDark;
      R(X + u, Y + u * 6, u * 6, u);
      if (p.hp > 1) {
        glyphs(String(p.hp), X + Math.round((cell - 3 * Math.max(2, Math.floor(u * 0.7))) / 2),
               Y + u * 3, Math.max(2, Math.floor(u * 0.7)),
               weak ? C.sentinelEye : '#8e86a8');
      } else {
        ctx.fillStyle = weak ? C.sentinelEye : '#8e86a8';
        const blink = Math.floor(time / 900) % 6 === 0 ? 0 : u; // rare, quick blink
        if (blink) { R(X + u * 2, Y + u * 3, u, u); R(X + u * 5, Y + u * 3, u, u); }
      }
    }

    // ---- the tile noBacktrack has taken away from you this turn ----
    if (board.noBacktrack && state.status === 'playing') {
      const back = previousPosition(state);
      if (back) {
        const X = px(back.x), Y = py(back.y);
        ctx.fillStyle = C.barred;
        R(X + u * 2, Y + u * 3, u * 4, u);                     // a bar: no return
      }
    }

    // ---- where each echo steps next ----
    nextEchoPositions(board, state).forEach((p, i) => {
      if (!p) return;
      ctx.fillStyle = i % 2 ? C.echoB : C.echoA;
      const X = px(p.x), Y = py(p.y), a = u, len = u * 2, b = cell - u;
      R(X + a, Y + a, len, u);           R(X + a, Y + a, u, len);
      R(X + b - len, Y + a, len, u);     R(X + b - u, Y + a, u, len);
      R(X + a, Y + b - u, len, u);       R(X + a, Y + b - len, u, len);
      R(X + b - len, Y + b - u, len, u); R(X + b - u, Y + b - len, u, len);
    });

    // ---- echoes: the past, dissolved ----
    echoPositions(board, state).forEach((p, i) => {
      if (!p) return;
      const a = ease('echo' + i, p, dt);
      const X = Math.round(px(a.x)), Y = Math.round(py(a.y));
      const body = u * 6;

      // Cyan and magenta on opposite phases of the same checkerboard: one
      // body, split across two channels, never quite in the same place.
      const d = Math.max(2, u / 2);
      ctx.save();
      ctx.translate(X, Y);
      ctx.fillStyle = dither(C.echoA, d, 0);
      ctx.fillRect(u, u, body, body);
      ctx.fillStyle = dither(C.echoB, d, 1);
      ctx.fillRect(u, u, body, body);
      ctx.restore();

      const edge = Math.max(1, Math.round(u / 2));
      ctx.fillStyle = C.echoA;                  // thin frame holds the shape
      R(X + u, Y + u, body, edge);
      R(X + u, Y + u * 7 - edge, body, edge);
      R(X + u, Y + u, edge, body);
      R(X + u * 7 - edge, Y + u, edge, body);

      // The delay, small and on a solid plate so the dither cannot eat it.
      const label = String(board.delays[i]);
      const gs = Math.max(2, Math.floor(u * 0.6));
      const gw = label.length * 4 - 1;
      const gx = X + Math.round((cell - gw * gs) / 2);
      const gy = Y + Math.round((cell - 5 * gs) / 2);
      ctx.fillStyle = C.bg;
      R(gx - gs, gy - gs, (gw + 2) * gs, 7 * gs);
      glyphs(label, gx, gy, gs, C.echoA);
    });

    // ---- you: the present ----
    const a = ease('player', state.pos, dt);
    const X = Math.round(px(a.x)), Y = Math.round(py(a.y));
    const body = u * 6;
    ctx.fillStyle = C.now;
    R(X + u, Y + u, body, body);
    ctx.fillStyle = C.nowLight;                 // bevel: light top-left
    R(X + u, Y + u, body, u);
    R(X + u, Y + u, u, body);
    ctx.fillStyle = C.nowDark;                  // bevel: dark bottom-right
    R(X + u, Y + u * 6, body, u);
    R(X + u * 6, Y + u, u, body);

    // A strike spends a turn without moving, so the only feedback is this:
    // a ring thrown out over the four tiles the swing covered.
    if (state.struck && state.turn !== flash.turn) flash = { turn: state.turn, t: 0.36 };
    if (flash.t > 0) {
      flash.t = Math.max(0, flash.t - dt);
      const k = 1 - flash.t / 0.36;
      const grow = Math.round(k * u * 6);
      const edge = Math.max(1, Math.round(u / 2));
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = C.strike;
      const rx = X - grow, ry = Y - grow, rw = cell + grow * 2;
      R(rx, ry, rw, edge);
      R(rx, ry + rw - edge, rw, edge);
      R(rx, ry, edge, rw);
      R(rx + rw - edge, ry, edge, rw);
      ctx.globalAlpha = 1;
    }

    if (state.status === 'paradox') {
      ctx.fillStyle = dither(C.paradox, u);
      ctx.globalAlpha = 0.5;
      ctx.fillRect(0, 0, L.w, L.h);
      ctx.globalAlpha = 1;
    }
  }

  return { draw, reset };
}
