import { AIR_DRAG, G, H, LINE_FRICTION, MAXV, PR, SUB, W } from '../config';
import type { Particle, Seg } from './types';

export function seg(ax: number, ay: number, bx: number, by: number, r: number): Seg {
  return { ax, ay, bx, by, r };
}

/** Push a particle out of a capsule-shaped line and bounce it slightly. */
function collide(p: Particle, s: Seg): void {
  const dx = s.bx - s.ax, dy = s.by - s.ay, l2 = dx * dx + dy * dy || 1e-6;
  let t = ((p.x - s.ax) * dx + (p.y - s.ay) * dy) / l2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = s.ax + dx * t, cy = s.ay + dy * t;
  let nx = p.x - cx, ny = p.y - cy;
  const R = PR + s.r, d2 = nx * nx + ny * ny;
  if (d2 >= R * R) return;
  let d = Math.sqrt(d2);
  if (d < 1e-4) { nx = -dy; ny = dx; d = Math.hypot(nx, ny) || 1; }
  nx /= d; ny /= d;
  p.x = cx + nx * R; p.y = cy + ny * R;
  const vn = p.vx * nx + p.vy * ny;
  if (vn < 0) { p.vx -= 1.15 * vn * nx; p.vy -= 1.15 * vn * ny; }
  p.vx *= LINE_FRICTION; p.vy *= LINE_FRICTION;
}

// Uniform grid for particle-particle contacts.
const CELL = 10;
const PAD_Y = 40;
const COLS = Math.ceil(W / CELL) + 2;
const ROWS = Math.ceil((H + PAD_Y * 2) / CELL) + 2;
const grid: (Particle[] | undefined)[] = new Array(COLS * ROWS);

/** Advance the water simulation by dt seconds against the given solid segments. */
export function simulate(parts: Particle[], segs: Seg[], dt: number): void {
  const h = dt / SUB, D = PR * 2 * 0.92;
  for (let s = 0; s < SUB; s++) {
    for (const p of parts) {
      p.vy += G * h; p.vx *= AIR_DRAG;
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > MAXV) { p.vx *= MAXV / sp; p.vy *= MAXV / sp; }
      p.x += p.vx * h; p.y += p.vy * h;
      for (const sg of segs) collide(p, sg);
    }
    grid.fill(undefined);
    for (const p of parts) {
      const gx = Math.min(COLS - 1, Math.max(0, ((p.x / CELL) | 0) + 1));
      const gy = Math.min(ROWS - 1, Math.max(0, (((p.y + PAD_Y) / CELL) | 0) + 1));
      p.gx = gx; p.gy = gy;
      const k = gx + gy * COLS;
      (grid[k] || (grid[k] = [])).push(p);
    }
    for (const a of parts) {
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const gx = a.gx + ox, gy = a.gy + oy;
        if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) continue;
        const cell = grid[gx + gy * COLS];
        if (!cell) continue;
        for (const b of cell) {
          // handle each pair once
          if (b === a || b.x < a.x || (b.x === a.x && b.y <= a.y)) continue;
          let nx = b.x - a.x, ny = b.y - a.y;
          const d2 = nx * nx + ny * ny;
          if (d2 >= D * D) continue;
          const d = Math.sqrt(d2) || 0.01;
          nx /= d; ny /= d;
          const o = (D - d) * 0.5;
          a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) { const im = rv * 0.5; a.vx += nx * im; a.vy += ny * im; b.vx -= nx * im; b.vy -= ny * im; }
          // a little viscosity so the river moves as one body
          const tx = (b.vx - a.vx) * 0.02, ty = (b.vy - a.vy) * 0.02;
          a.vx += tx; a.vy += ty; b.vx -= tx; b.vy -= ty;
        }
      }
    }
  }
}
