export interface Vec { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

export type Line4 = [number, number, number, number];
/** A rock wall: a fixed line, or a moving one that oscillates by (mx, my) every `per` seconds. */
export type WallDef = Line4 | { p: Line4; mx?: number; my?: number; per?: number };

export interface LevelDef {
  /** Spring (river source). Water appears just below this point. */
  tap: Vec;
  /** Dry pond basin. x,y = top-left of the opening. */
  cup: Rect;
  walls: WallDef[];
  lava: Rect[];
  /** Wind zones: water inside is pushed by (fx, fy) px/s^2. */
  winds?: Wind[];
  /** One-way pipes: water entering the orange mouth `a` comes out of the blue mouth `b` with the same velocity. */
  pipes?: Pipe[];
  /** Flowers bloom when water touches them. Blooming all = 1 star. */
  flowers: [number, number][];
  drops: number;
  goal: number;
  /** Total riverbed length the player can draw. */
  ink: number;
  /** If true, the player can keep drawing while the river flows. */
  live?: boolean;
  hint: string;
  /** Optional dashed tutorial line. */
  ghost?: [[number, number], [number, number]];
  /**
   * A known winning answer: a list of strokes, each a list of points. Verified by `npm run check-levels`.
   * Extra strokes are drawn right after the river starts (only possible on `live` levels). Never shown to players.
   */
  solution?: [number, number][][];
}

export interface Wind extends Rect { fx: number; fy: number }
export interface Pipe { a: [number, number]; b: [number, number] }

export interface Seg { ax: number; ay: number; bx: number; by: number; r: number }

export interface Particle { x: number; y: number; vx: number; vy: number; inCup: boolean; gx: number; gy: number; px: number; py: number }

export interface Mover { s: Seg; base: Line4; mx: number; my: number; per: number }

export interface Flower { x: number; y: number; on: boolean; t: number }

export interface Fx { x: number; y: number; vx: number; vy: number; life: number; g: number; kind: 'steam' | 'conf'; col?: string; rot: number; vr: number }

export type GameState = 'menu' | 'draw' | 'pour' | 'win' | 'lose';

export interface LevelResult {
  won: boolean;
  stars: number;
  inCup: number;
  goal: number;
  bloomed: number;
  flowerCount: number;
  inkFrac: number;
}
