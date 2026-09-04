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
import { WALL, EXIT, PLATE, GATE, tileAt, echoPositions, nextEchoPositions, gatesOpen } from './engine.js';

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

  function reset() { anim = new Map(); }

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

        ctx.fillStyle = C.floor;
        R(X, Y, cell, cell);
        ctx.fillStyle = C.floorDot;             // one dot per tile: a quiet lattice
        R(X, Y, u, u);
        if (tileAt(board, x, y - 1) === WALL) { ctx.fillStyle = C.wallEdge; R(X, Y, cell, u); }

        if (tile === EXIT) {
          // Corner brackets, pulsing in two discrete steps — no soft fades.
          const inset = Math.floor(time / 480) % 2 ? u : 0;
          ctx.fillStyle = C.exit;
          const a = u + inset, len = u * 2, t = u;
          const b = cell - a;
          R(X + a, Y + a, len, t);          R(X + a, Y + a, t, len);
          R(X + b - len, Y + a, len, t);    R(X + b - t, Y + a, t, len);
          R(X + a, Y + b - t, len, t);      R(X + a, Y + b - len, t, len);
          R(X + b - len, Y + b - t, len, t); R(X + b - t, Y + b - len, t, len);
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
      let gx = X + Math.round((cell - gw * gs) / 2);
      const gy = Y + Math.round((cell - 5 * gs) / 2);
      ctx.fillStyle = C.bg;
      R(gx - gs, gy - gs, (gw + 2) * gs, 7 * gs);
      ctx.fillStyle = C.echoA;
      for (const ch of label) {
        const g = GLYPH[ch];
        if (g) {
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 3; c++) if (g[r][c] === '1') R(gx + c * gs, gy + r * gs, gs, gs);
          }
        }
        gx += gs * 4;
      }
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

    if (state.status === 'paradox') {
      ctx.fillStyle = dither(C.paradox, u);
      ctx.globalAlpha = 0.5;
      ctx.fillRect(0, 0, L.w, L.h);
      ctx.globalAlpha = 1;
    }
  }

  return { draw, reset };
}
