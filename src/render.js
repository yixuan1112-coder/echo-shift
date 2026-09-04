/**
 * Canvas renderer.
 *
 * The visual language carries the mechanic: NOW is a solid warm square, the
 * PAST is a cool translucent one split into cyan/magenta ghosts — the same
 * body, dislocated in time. The dashed outline is where an echo steps next,
 * so every paradox is something you could have seen coming.
 */
import { WALL, EXIT, PLATE, GATE, tileAt, echoPositions, nextEchoPositions, gatesOpen } from './engine.js';

const C = {
  bg: '#080a0f',
  wall: '#0b0e14',
  wallEdge: '#141a26',
  floor: '#1a2130',
  grid: '#0f131c',
  exit: '#5ce08a',
  plate: '#5b6478',
  plateOn: '#f0b429',
  gate: '#e05263',
  player: '#f5c542',
  echoA: '#4dd6ff',
  echoB: '#ff5ea8',
};

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  // Smoothed positions so pieces glide between turns instead of snapping.
  let anim = new Map();

  function reset() { anim = new Map(); }

  function ease(key, target, dt) {
    const cur = anim.get(key);
    if (!cur) { anim.set(key, { ...target }); return target; }
    const k = 1 - Math.pow(0.0005, dt);
    cur.x += (target.x - cur.x) * k;
    cur.y += (target.y - cur.y) * k;
    if (Math.abs(cur.x - target.x) < 0.002) cur.x = target.x;
    if (Math.abs(cur.y - target.y) < 0.002) cur.y = target.y;
    return cur;
  }

  function layout(board) {
    const dpr = window.devicePixelRatio || 1;
    // The canvas takes the level's own aspect ratio so no level floats in a
    // sea of empty box.
    const avail = canvas.parentElement.clientWidth;
    const maxH = Math.min(window.innerHeight * 0.62, 520);
    const cell = Math.max(20, Math.floor(Math.min(avail / board.w, maxH / board.h)));
    const cssW = cell * board.w;
    const cssH = cell * board.h;
    if (canvas.style.height !== cssH + 'px') canvas.style.height = cssH + 'px';

    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {
      cell,
      ox: Math.round((rect.width - cssW) / 2),
      oy: Math.round((rect.height - cssH) / 2),
      w: rect.width, h: rect.height,
    };
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw(board, state, dt, t) {
    const L = layout(board);
    const { cell, ox, oy } = L;
    const px = (x) => ox + x * cell;
    const py = (y) => oy + y * cell;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, L.w, L.h);

    const open = gatesOpen(board, state);

    // --- tiles ---
    for (let y = 0; y < board.h; y++) {
      for (let x = 0; x < board.w; x++) {
        const tile = tileAt(board, x, y);
        const X = px(x), Y = py(y);
        if (tile === WALL) {
          ctx.fillStyle = C.wall;
          ctx.fillRect(X, Y, cell, cell);
          continue;
        }
        // Floor tiles are the lit shape; walls are the negative space around them.
        ctx.fillStyle = C.floor;
        ctx.fillRect(X, Y, cell, cell);
        ctx.strokeStyle = C.grid;
        ctx.lineWidth = 1;
        ctx.strokeRect(X + 0.5, Y + 0.5, cell - 1, cell - 1);
        ctx.fillStyle = C.wallEdge;
        if (tileAt(board, x, y - 1) === WALL) ctx.fillRect(X, Y, cell, 2);

        if (tile === EXIT) {
          const pulse = 0.55 + 0.45 * Math.sin(t / 420);
          ctx.strokeStyle = C.exit;
          ctx.globalAlpha = pulse;
          ctx.lineWidth = 2;
          roundRect(X + cell * 0.18, Y + cell * 0.18, cell * 0.64, cell * 0.64, cell * 0.14);
          ctx.stroke();
          ctx.globalAlpha = pulse * 0.18;
          ctx.fillStyle = C.exit;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        if (tile === PLATE) {
          const bodies = [state.pos, ...echoPositions(board, state).filter(Boolean)];
          const on = bodies.some((b) => b.x === x && b.y === y);
          ctx.strokeStyle = on ? C.plateOn : C.plate;
          ctx.lineWidth = on ? 3 : 2;
          ctx.beginPath();
          ctx.arc(X + cell / 2, Y + cell / 2, cell * 0.3, 0, Math.PI * 2);
          ctx.stroke();
          if (on) {
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = C.plateOn;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        if (tile === GATE) {
          if (open) {
            ctx.strokeStyle = C.gate;
            ctx.globalAlpha = 0.35;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(X + 3, Y + 3); ctx.lineTo(X + 3, Y + cell - 3);
            ctx.moveTo(X + cell - 3, Y + 3); ctx.lineTo(X + cell - 3, Y + cell - 3);
            ctx.stroke();
            ctx.globalAlpha = 1;
          } else {
            ctx.fillStyle = C.gate;
            ctx.globalAlpha = 0.85;
            ctx.fillRect(X + 2, Y + 2, cell - 4, cell - 4);
            ctx.globalAlpha = 0.35;
            ctx.strokeStyle = '#0d0f14';
            ctx.lineWidth = 2;
            for (let i = -cell; i < cell; i += 7) {
              ctx.beginPath();
              ctx.moveTo(X + i, Y + cell); ctx.lineTo(X + i + cell, Y);
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    // --- where each echo steps next: the fairness guarantee ---
    const upcoming = nextEchoPositions(board, state);
    ctx.setLineDash([4, 4]);
    upcoming.forEach((p, i) => {
      if (!p) return;
      ctx.strokeStyle = i % 2 ? C.echoB : C.echoA;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      roundRect(px(p.x) + cell * 0.22, py(p.y) + cell * 0.22, cell * 0.56, cell * 0.56, cell * 0.12);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
    ctx.setLineDash([]);

    // --- echoes: the past, split into two channels ---
    echoPositions(board, state).forEach((p, i) => {
      if (!p) return;
      const a = ease('echo' + i, p, dt);
      const X = px(a.x), Y = py(a.y);
      const off = cell * 0.045;
      const pad = cell * 0.16;
      const size = cell - pad * 2;
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = C.echoA;
      roundRect(X + pad - off, Y + pad, size, size, cell * 0.16); ctx.fill();
      ctx.fillStyle = C.echoB;
      roundRect(X + pad + off, Y + pad, size, size, cell * 0.16); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = C.echoA;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1.5;
      roundRect(X + pad, Y + pad, size, size, cell * 0.16); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.echoA;
      ctx.font = `600 ${Math.max(9, cell * 0.26)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('-' + board.delays[i], X + cell / 2, Y + cell / 2);
    });

    // --- you: the present ---
    const a = ease('player', state.pos, dt);
    const X = px(a.x), Y = py(a.y);
    const pad = cell * 0.14;
    ctx.shadowColor = C.player;
    ctx.shadowBlur = cell * 0.35;
    ctx.fillStyle = C.player;
    roundRect(X + pad, Y + pad, cell - pad * 2, cell - pad * 2, cell * 0.18);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (state.status === 'paradox') {
      ctx.fillStyle = 'rgba(224,82,99,0.22)';
      ctx.fillRect(0, 0, L.w, L.h);
    }
  }

  return { draw, reset };
}
