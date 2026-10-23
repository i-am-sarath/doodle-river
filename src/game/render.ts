import { H, PIPE_R, PR_DRAW, W } from '../config';
import type { Game } from './game';
import type { Pipe, Vec, Wind } from './types';

/** Where the 400x640 playfield sits on the screen canvas. */
export interface View { scale: number; ox: number; oy: number; dpr: number; cw: number; ch: number }

const INK = '#25193f';
const FONT = '"Lilita One", Impact, sans-serif';

export function render(ctx: CanvasRenderingContext2D, g: Game, v: View): void {
  const k = v.scale * v.dpr;
  ctx.setTransform(k, 0, 0, k, v.ox * v.dpr, v.oy * v.dpr);
  // visible logical area (the scenery extends past the playfield on wide/tall screens)
  const x0 = -v.ox / v.scale, x1 = (v.cw - v.ox) / v.scale;
  const y0 = -v.oy / v.scale, y1 = (v.ch - v.oy) / v.scale;
  drawBg(ctx, g.time, x0, x1, y0, y1);
  if (g.state === 'menu') { drawMenuRain(ctx, x0, x1); return; }

  const L = g.level, t = g.time;

  for (const l of L.lava) {
    ctx.fillStyle = '#ff5a36';
    ctx.beginPath(); ctx.moveTo(l.x, l.y + l.h);
    for (let x = l.x; x <= l.x + l.w; x += 8) ctx.lineTo(x, l.y + 6 + Math.sin(x * 0.12 + t * 4) * 3);
    ctx.lineTo(l.x + l.w, l.y + l.h); ctx.fill();
    ctx.fillStyle = '#ffc82e'; ctx.fillRect(l.x, l.y + 16, l.w, 3);
  }

  for (const w of L.winds ?? []) drawWind(ctx, w, t);
  for (const p of L.pipes ?? []) drawPipe(ctx, p, t, g.pipeT);

  for (const s of g.wallSegs) { const p = [{ x: s.ax, y: s.ay }, { x: s.bx, y: s.by }]; line(ctx, p, 14, INK); line(ctx, p, 7, '#8a6f5b'); }
  for (const m of g.movers) {
    const s = m.s;
    ctx.fillStyle = '#ffc82e'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc((s.ax + s.bx) / 2, (s.ay + s.by) / 2, 5, 0, 7); ctx.fill(); ctx.stroke();
  }

  drawSpring(ctx, L.tap.x, L.tap.y);
  drawFlowers(ctx, g);

  if (g.state === 'draw' && L.ghost && !g.drawing && !g.strokes.length) {
    const [a, b] = L.ghost;
    ctx.setLineDash([2, 14]); line(ctx, [{ x: a[0], y: a[1] }, { x: b[0], y: b[1] }], 8, 'rgba(37,25,63,.35)'); ctx.setLineDash([]);
    const q = (t * 0.6) % 1, hx = a[0] + (b[0] - a[0]) * q, hy = a[1] + (b[1] - a[1]) * q;
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hx, hy, 11, 0, 7); ctx.fill(); ctx.stroke();
  }

  // pond basin (squashes a little when water lands)
  const c = L.cup, sq = 1 + g.cupPulse * 0.03, fillK = Math.min(1, g.inCup / L.goal);
  const squash = () => { ctx.translate(c.x + c.w / 2, c.y + c.h); ctx.scale(sq, 2 - sq); ctx.translate(-(c.x + c.w / 2), -(c.y + c.h)); };
  ctx.save(); squash();
  ctx.fillStyle = `rgb(${Math.round(201 - 120 * fillK)},${Math.round(160 + 40 * fillK)},${Math.round(110 - 10 * fillK)})`;
  ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + 7, c.y + c.h); ctx.lineTo(c.x + c.w - 7, c.y + c.h); ctx.lineTo(c.x + c.w, c.y); ctx.fill();
  if (fillK < 1) {
    ctx.strokeStyle = `rgba(37,25,63,${0.35 * (1 - fillK)})`; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(c.x + 20, c.y + c.h - 10); ctx.lineTo(c.x + 38, c.y + c.h - 30); ctx.lineTo(c.x + 34, c.y + c.h - 50);
    ctx.moveTo(c.x + 38, c.y + c.h - 30); ctx.lineTo(c.x + 60, c.y + c.h - 24); ctx.lineTo(c.x + 76, c.y + c.h - 44); ctx.stroke();
  }
  ctx.restore();

  // water
  ctx.fillStyle = '#1d78ff'; ctx.beginPath();
  for (const p of g.parts) { ctx.moveTo(p.x + PR_DRAW, p.y); ctx.arc(p.x, p.y, PR_DRAW, 0, 7); }
  ctx.fill();
  ctx.fillStyle = 'rgba(140,200,255,.9)'; ctx.beginPath();
  for (const p of g.parts) { ctx.moveTo(p.x - 1 + 2.4, p.y - 2); ctx.arc(p.x - 1, p.y - 2, 2.4, 0, 7); }
  ctx.fill();

  ctx.save(); squash();
  line(ctx, [{ x: c.x, y: c.y }, { x: c.x + 7, y: c.y + c.h }, { x: c.x + c.w - 7, y: c.y + c.h }, { x: c.x + c.w, y: c.y }], 6, INK);
  ctx.fillStyle = '#4fcf6a';
  for (const gx of [c.x - 4, c.x + c.w + 4]) {
    ctx.beginPath(); ctx.moveTo(gx - 9, c.y + 2); ctx.lineTo(gx - 4, c.y - 12); ctx.lineTo(gx, c.y - 2); ctx.lineTo(gx + 4, c.y - 14); ctx.lineTo(gx + 9, c.y + 2); ctx.fill();
  }
  ctx.restore();

  // progress pill
  const cx = c.x + c.w / 2, cy = c.y - 26;
  ctx.fillStyle = INK; roundRect(ctx, cx - 38, cy - 15, 76, 30, 15); ctx.fill();
  if (fillK > 0.05) { ctx.fillStyle = fillK >= 1 ? '#4fcf6a' : '#1d78ff'; roundRect(ctx, cx - 35, cy - 12, 70 * fillK, 24, 12); ctx.fill(); }
  ctx.fillStyle = '#fff'; ctx.font = `18px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${g.inCup}/${L.goal}`, cx, cy + 1);

  // player riverbeds
  for (const st of g.strokes) {
    if (st.length > 1) {
      line(ctx, st, 12, INK); line(ctx, st, 6, '#a5764e');
      ctx.setLineDash([1, 9]); line(ctx, st, 2, '#d9b089'); ctx.setLineDash([]);
    } else if (st.length === 1) {
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(st[0].x, st[0].y, 5.5, 0, 7); ctx.fill();
    }
  }

  for (const f of g.fx) {
    if (f.kind === 'steam') {
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, f.life * 1.4)})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, 4 + (0.5 - f.life) * 10, 0, 7); ctx.fill();
    } else {
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); ctx.fillStyle = f.col ?? '#fff'; ctx.fillRect(-5, -3, 10, 6); ctx.restore();
    }
  }
}

function drawBg(ctx: CanvasRenderingContext2D, time: number, x0: number, x1: number, y0: number, y1: number): void {
  const grd = ctx.createLinearGradient(0, y0, 0, y1);
  grd.addColorStop(0, '#5cc4f5'); grd.addColorStop(1, '#b8ecff');
  ctx.fillStyle = grd; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  const span = x1 - x0 + 160;
  for (const [x, y, s] of [[70, 120, 1], [300, 90, 0.8], [230, 200, 0.6], [520, 150, 0.9], [-150, 60, 0.7]]) {
    const xx = x0 - 80 + ((((x - x0) + time * 8 * s) % span) + span) % span;
    ctx.beginPath(); ctx.arc(xx, y, 18 * s, 0, 7); ctx.arc(xx + 20 * s, y - 8 * s, 22 * s, 0, 7); ctx.arc(xx + 44 * s, y, 17 * s, 0, 7); ctx.fill();
  }
  ctx.fillStyle = '#9fe39a'; ctx.beginPath(); ctx.moveTo(x0, y1);
  for (let x = Math.floor(x0 / 20) * 20; x <= x1 + 20; x += 20) ctx.lineTo(x, 520 + Math.sin(x * 0.018) * 30 + Math.sin(x * 0.05) * 8);
  ctx.lineTo(x1 + 20, y1); ctx.fill();
  ctx.fillStyle = '#7bd57c'; ctx.beginPath(); ctx.moveTo(x0, y1);
  for (let x = Math.floor(x0 / 20) * 20; x <= x1 + 20; x += 20) ctx.lineTo(x, 570 + Math.sin(x * 0.025 + 2) * 22);
  ctx.lineTo(x1 + 20, y1); ctx.fill();
  // soft edge marks where the playable area ends on wide screens
  if (x0 < -1) { ctx.fillStyle = 'rgba(37,25,63,.08)'; ctx.fillRect(x0, y0, -x0, y1 - y0); ctx.fillRect(W, y0, x1 - W, y1 - y0); }
  if (y1 > H + 1) { ctx.fillStyle = '#5bbf63'; ctx.fillRect(x0, H, x1 - x0, y1 - H); }
}

let rain: { x: number; y: number; v: number }[] = [];
function drawMenuRain(ctx: CanvasRenderingContext2D, x0: number, x1: number): void {
  if (Math.random() < 0.6) rain.push({ x: x0 + Math.random() * (x1 - x0), y: -10, v: 200 + Math.random() * 200 });
  ctx.fillStyle = 'rgba(29,120,255,.35)'; ctx.beginPath();
  for (const d of rain) { d.y += d.v / 60; ctx.moveTo(d.x + 5, d.y); ctx.arc(d.x, d.y, 5, 0, 7); }
  ctx.fill();
  rain = rain.filter((d) => d.y < H + 10);
}

function drawWind(ctx: CanvasRenderingContext2D, w: Wind, t: number): void {
  const cx = w.x + w.w / 2, cy = w.y + w.h / 2, ang = Math.atan2(w.fy, w.fx), D = Math.hypot(w.w, w.h) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.22)'; roundRect(ctx, w.x, w.y, w.w, w.h, 14); ctx.fill();
  ctx.beginPath(); ctx.rect(w.x, w.y, w.w, w.h); ctx.clip();
  // work in a frame where the wind blows along +x; streaks drift with it
  ctx.translate(cx, cy); ctx.rotate(ang);
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
  const span = 2 * D + 40;
  for (let row = 0, y = -D; y < D; row++, y += 22) {
    const x = ((row * 97 + t * 140) % span) - D - 20;
    ctx.moveTo(x, y); ctx.lineTo(x + 20, y);
  }
  ctx.stroke();
  // arrow badge in the middle
  ctx.fillStyle = 'rgba(37,25,63,.55)'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -7); ctx.lineTo(-5, 7); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawPipe(ctx: CanvasRenderingContext2D, p: Pipe, t: number, flash: number): void {
  const [ax, ay] = p.a, [bx, by] = p.b;
  ctx.setLineDash([2, 10]); line(ctx, [{ x: ax, y: ay }, { x: bx, y: by }], 4, 'rgba(37,25,63,.18)'); ctx.setLineDash([]);
  for (const [x, y, col, dir] of [[ax, ay, '#ff9f1c', 1], [bx, by, '#1db5ff', -1]] as const) {
    const r = PIPE_R + 2 + flash * 2;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, r + 4, 0, 7); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#1a1230'; ctx.beginPath(); ctx.arc(x, y, r - 6, 0, 7); ctx.fill();
    // swirl: in for the entry, out for the exit
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r - 10, t * 5 * dir, t * 5 * dir + 3.6); ctx.stroke();
  }
}

function drawSpring(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x, y - 14, 34, 30, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#8f86a8'; ctx.beginPath(); ctx.ellipse(x, y - 15, 29, 25, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#b3abc9'; ctx.beginPath(); ctx.ellipse(x - 8, y - 24, 12, 8, -0.4, 0, 7); ctx.fill();
  ctx.fillStyle = '#4fcf6a'; ctx.beginPath(); ctx.ellipse(x + 4, y - 38, 22, 8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x, y + 4, 9, 5, 0, 0, 7); ctx.fill();
}

function drawFlowers(ctx: CanvasRenderingContext2D, g: Game): void {
  for (const f of g.flowers) {
    f.t = Math.min(1, f.t + (f.on ? 0.06 : 0));
    const k = f.t;
    line(ctx, [{ x: f.x, y: f.y + 12 }, { x: f.x, y: f.y - 4 - k * 6 }], 4, k > 0 ? '#3aa957' : '#9c8a6a');
    if (k > 0) {
      ctx.save(); ctx.translate(f.x, f.y - 8 - k * 6); ctx.rotate(g.time * 0.8);
      ctx.fillStyle = '#ff4f8b';
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(Math.cos(i * 1.257) * 7 * k, Math.sin(i * 1.257) * 7 * k, 5 * k, 4 * k, i * 1.257, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#ffc82e'; ctx.beginPath(); ctx.arc(0, 0, 4 * k, 0, 7); ctx.fill(); ctx.restore();
    } else {
      ctx.fillStyle = '#9c8a6a'; ctx.beginPath(); ctx.ellipse(f.x, f.y - 6 + Math.sin(g.time * 3), 5, 7, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(37,25,63,.5)'; ctx.lineWidth = 2; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(f.x, f.y, 17, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    }
  }
}

function line(ctx: CanvasRenderingContext2D, pts: Vec[], w: number, col: string): void {
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
