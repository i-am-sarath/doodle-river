// Headless runner shared by check-levels and your own experiments. No DOM, no audio.
import { Sfx } from '../src/game/audio';
import { Game } from '../src/game/game';
import type { LevelResult } from '../src/game/types';

export type Stroke = [number, number][];

function draw(g: Game, line: Stroke): void {
  g.beginStroke({ x: line[0][0], y: line[0][1] });
  for (let k = 1; k < line.length; k++) {
    const [ax, ay] = line[k - 1], [bx, by] = line[k];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 6));
    for (let s = 1; s <= n; s++) g.moveStroke({ x: ax + ((bx - ax) * s) / n, y: ay + ((by - ay) * s) / n });
  }
  g.endStroke();
}

export function play(i: number, strokes: Stroke[]): LevelResult | null {
  const g = new Game(new Sfx());
  let result: LevelResult | null = null;
  g.onFinish = (r) => { result = r; };
  g.load(i);
  if (!strokes.length || strokes[0].length < 2) return null;
  draw(g, strokes[0]);          // first stroke starts the river
  g.step(1 / 60);
  for (const s of strokes.slice(1)) draw(g, s); // extra strokes (live levels)
  for (let f = 0; f < 60 * 30 && !result; f++) g.step(1 / 60);
  return result;
}

