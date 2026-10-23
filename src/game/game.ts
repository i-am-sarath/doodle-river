import { H, LINE_R, MAX_SETTLE, SPAWN_RATE, THRIFTY, W, WALL_R } from '../config';
import type { Sfx } from './audio';
import { LEVELS } from './levels';
import { seg, simulate } from './physics';
import type { Flower, Fx, GameState, LevelDef, LevelResult, Mover, Particle, Seg, Vec } from './types';

/**
 * Pure game logic: level state, drawing, water, scoring.
 * Knows nothing about the DOM, ads or platforms. UI listens through the callbacks.
 */
export class Game {
  state: GameState = 'menu';
  levelIndex = 0;
  level: LevelDef = LEVELS[0];

  parts: Particle[] = [];
  statics: Seg[] = [];
  wallSegs: Seg[] = [];
  movers: Mover[] = [];
  strokes: Vec[][] = [];
  strokeSegs: Seg[] = [];
  flowers: Flower[] = [];
  fx: Fx[] = [];

  inkUsed = 0;
  inkMax = 0;
  drawing = false;
  spawned = 0;
  inCup = 0;
  time = 0;
  cupPulse = 0;

  private spawnAcc = 0;
  private endT = 0;
  private lvT = 0;
  private lastPlop = 0;
  private current: Vec[] = [];

  onInkChange?: () => void;
  onPourStart?: () => void;
  onFinish?: (r: LevelResult) => void;

  constructor(private sfx: Sfx) {}

  get levelCount(): number { return LEVELS.length; }

  load(i: number): void {
    this.levelIndex = i;
    const L = (this.level = LEVELS[i]);
    this.parts = []; this.strokes = []; this.strokeSegs = []; this.fx = []; this.current = [];
    this.inkUsed = 0; this.inkMax = L.ink;
    this.spawned = 0; this.spawnAcc = 0; this.endT = 0; this.inCup = 0; this.lvT = 0;
    this.drawing = false;
    this.movers = [];
    this.wallSegs = L.walls.map((w) => {
      const q = Array.isArray(w) ? w : w.p;
      const s = seg(q[0], q[1], q[2], q[3], WALL_R);
      if (!Array.isArray(w)) this.movers.push({ s, base: q, mx: w.mx ?? 0, my: w.my ?? 0, per: w.per ?? 2 });
      return s;
    });
    const c = L.cup;
    this.statics = [
      ...this.wallSegs,
      seg(c.x, c.y, c.x + 7, c.y + c.h, 3),
      seg(c.x + 7, c.y + c.h, c.x + c.w - 7, c.y + c.h, 3),
      seg(c.x + c.w - 7, c.y + c.h, c.x + c.w, c.y, 3),
    ];
    this.flowers = L.flowers.map(([x, y]) => ({ x, y, on: false, t: 0 }));
    this.state = 'draw';
    this.onInkChange?.();
  }

  /** Rewarded-ad bonus. */
  addInk(frac: number): void {
    this.inkMax += this.level.ink * frac;
    this.onInkChange?.();
  }

  get inkLeftFrac(): number { return Math.max(0, 1 - this.inkUsed / this.inkMax); }

  canDraw(): boolean {
    return this.state === 'draw' || (this.state === 'pour' && !!this.level.live && this.inkUsed < this.inkMax - 2);
  }

  // ---------- input ----------
  beginStroke(p: Vec): boolean {
    if (!this.canDraw()) return false;
    this.drawing = true;
    this.current = [clampField(p)];
    this.strokes.push(this.current);
    this.sfx.pen();
    return true;
  }

  moveStroke(raw: Vec): void {
    if (!this.drawing) return;
    const p = clampField(raw), last = this.current[this.current.length - 1];
    const dx = p.x - last.x, dy = p.y - last.y;
    let d = Math.hypot(dx, dy);
    if (d < 5) return;
    const left = this.inkMax - this.inkUsed;
    if (d > left) { const k = left / d; p.x = last.x + dx * k; p.y = last.y + dy * k; d = left; }
    this.current.push(p);
    this.inkUsed += d;
    this.strokeSegs.push(seg(last.x, last.y, p.x, p.y, LINE_R));
    this.onInkChange?.();
    if (this.inkUsed >= this.inkMax - 0.01) this.endStroke();
  }

  endStroke(): void {
    if (!this.drawing) return;
    this.drawing = false;
    if (this.state !== 'draw') return; // extra live stroke during pour
    if (this.inkUsed < 15) { // a tap, not a line: reset
      this.strokes = []; this.strokeSegs = []; this.inkUsed = 0; this.onInkChange?.();
      return;
    }
    this.state = 'pour';
    this.sfx.pour();
    this.onPourStart?.();
  }

  // ---------- simulation ----------
  step(dt: number): void {
    this.time += dt;
    this.cupPulse = Math.max(0, this.cupPulse - dt * 4);
    for (const f of this.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += f.g * dt; f.life -= dt; f.rot += f.vr * dt; }
    this.fx = this.fx.filter((f) => f.life > 0);
    if (this.state === 'menu') return;

    this.lvT += dt;
    for (const m of this.movers) {
      const o = Math.sin((this.lvT * Math.PI * 2) / m.per), s = m.s;
      s.ax = m.base[0] + m.mx * o; s.ay = m.base[1] + m.my * o;
      s.bx = m.base[2] + m.mx * o; s.by = m.base[3] + m.my * o;
    }
    if (this.state === 'draw') return;

    const L = this.level;
    if (this.spawned < L.drops) {
      this.spawnAcc += dt;
      while (this.spawnAcc >= 1 / SPAWN_RATE && this.spawned < L.drops) {
        this.spawnAcc -= 1 / SPAWN_RATE; this.spawned++;
        this.parts.push({ x: L.tap.x + (Math.random() - 0.5) * 8, y: L.tap.y + 12, vx: (Math.random() - 0.5) * 24, vy: 90, inCup: false, gx: 0, gy: 0 });
      }
    }

    simulate(this.parts, this.statics.concat(this.strokeSegs), dt);

    const c = L.cup;
    let n = 0, speed = 0;
    this.parts = this.parts.filter((p) => {
      if (p.y > H + 30 || p.x < -30 || p.x > W + 30) return false;
      for (const l of L.lava) {
        if (p.x > l.x && p.x < l.x + l.w && p.y > l.y + 6) {
          this.fx.push({ x: p.x, y: l.y + 4, vx: (Math.random() - 0.5) * 50, vy: -80 - Math.random() * 60, life: 0.5, g: 200, kind: 'steam', rot: 0, vr: 0 });
          return false;
        }
      }
      for (const f of this.flowers) {
        if (!f.on && Math.abs(p.x - f.x) < 16 && Math.abs(p.y - f.y) < 18) {
          f.on = true;
          this.sfx.bloom();
          this.burst(f.x, f.y - 10, 14, 160, ['#ff4f8b', '#ffc82e']);
        }
      }
      const inside = p.x > c.x + 5 && p.x < c.x + c.w - 5 && p.y > c.y - 2 && p.y < c.y + c.h;
      if (inside) {
        n++;
        if (!p.inCup) {
          p.inCup = true; this.cupPulse = 1;
          const now = performance.now();
          if (now - this.lastPlop > 45 && this.state === 'pour') { this.lastPlop = now; this.sfx.plop(this.inCup / L.goal); }
        }
      }
      speed += Math.abs(p.vx) + Math.abs(p.vy);
      return true;
    });
    this.inCup = n;

    if (this.state === 'pour' && this.spawned >= L.drops) {
      this.endT += dt;
      const avg = this.parts.length ? speed / this.parts.length : 0;
      if ((this.endT > 1.2 && avg < 40) || this.endT > MAX_SETTLE || !this.parts.length) this.finish();
    }
  }

  private finish(): void {
    const L = this.level;
    const won = this.inCup >= L.goal;
    const bloomed = this.flowers.filter((f) => f.on).length;
    const inkFrac = this.inkUsed / L.ink;
    const stars = won ? 1 + (bloomed === this.flowers.length ? 1 : 0) + (inkFrac <= THRIFTY ? 1 : 0) : 0;
    this.state = won ? 'win' : 'lose';
    if (won) {
      this.sfx.win();
      this.burst(L.cup.x + L.cup.w / 2, L.cup.y, 70, 420, ['#ffc82e', '#ff4f8b', '#4fcf6a', '#1d78ff', '#ffffff']);
    } else {
      this.sfx.lose();
    }
    this.onFinish?.({ won, stars, inCup: this.inCup, goal: L.goal, bloomed, flowerCount: this.flowers.length, inkFrac });
  }

  private burst(x: number, y: number, n: number, spread: number, cols: string[]): void {
    for (let i = 0; i < n; i++) {
      this.fx.push({ x, y, vx: (Math.random() - 0.5) * spread, vy: -spread * 0.6 - Math.random() * spread * 0.9, life: 1.6, g: 520, kind: 'conf',
        col: cols[i % cols.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14 });
    }
  }
}

function clampField(p: Vec): Vec {
  return { x: Math.max(4, Math.min(W - 4, p.x)), y: Math.max(4, Math.min(H - 4, p.y)) };
}
