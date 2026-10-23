/**
 * Headless level checker. Runs the real game physics with no graphics.
 *
 *   npm run check-levels              -> replays every level's `solution`, reports win rate + stars
 *   npm run check-levels -- --search 7 -> random-searches for a winning line on level 8 (0-based index 7)
 *
 * Use it after every level edit so you never ship an unwinnable level.
 */
import { LEVELS } from '../src/game/levels';
import type { LevelResult } from '../src/game/types';
import { play, type Stroke } from './sim';

const TRIALS = 3; // the spring has a little randomness, so replay each solution a few times

function check(): void {
  let bad = 0;
  LEVELS.forEach((L, i) => {
    if (!L.solution) { console.log(`L${i + 1}  no solution recorded`); bad++; return; }
    const rs = Array.from({ length: TRIALS }, () => play(i, L.solution!));
    const wins = rs.filter((r) => r?.won).length;
    const best = Math.max(...rs.map((r) => r?.stars ?? 0));
    const cups = rs.map((r) => r?.inCup ?? 0).join('/');
    console.log(`L${String(i + 1).padEnd(2)} ${wins === TRIALS ? 'OK  ' : 'FAIL'} wins ${wins}/${TRIALS}  stars ${best}  drops ${cups} (goal ${L.goal})`);
    if (wins < TRIALS) bad++;
  });
  console.log(bad ? `\n${bad} level(s) need attention` : '\nAll levels winnable');
  if (bad) process.exitCode = 1;
}

function search(i: number, tries = 400): void {
  const L = LEVELS[i];
  const rnd = (a: number, b: number) => Math.round(a + Math.random() * (b - a));
  let best: { line: Stroke; r: LevelResult; score: number } | null = null;
  for (let t = 0; t < tries; t++) {
    const n = Math.random() < 0.5 ? 2 : 3;
    const line: Stroke = [[rnd(L.tap.x - 140, L.tap.x + 140), rnd(L.tap.y + 30, L.tap.y + 260)]];
    for (let k = 1; k < n; k++) {
      const [px, py] = line[k - 1];
      line.push([rnd(px - 260, px + 260), rnd(py - 40, py + 260)]);
    }
    for (const p of line) { p[0] = Math.max(6, Math.min(394, p[0])); p[1] = Math.max(6, Math.min(634, p[1])); }
    const r = play(i, [line]);
    if (!r?.won) continue;
    const score = r.stars * 1000 + r.inCup - r.inkFrac * 100;
    if (!best || score > best.score) { best = { line, r, score }; console.log(`try ${t}: stars ${r.stars} drops ${r.inCup} ink ${(r.inkFrac * 100) | 0}%  solution: ${JSON.stringify([line])}`); }
    if (r.stars === 3) break;
  }
  if (!best) console.log(`No winning line found for level ${i + 1} in ${tries} tries. The level may be too hard.`);
}

const si = process.argv.indexOf('--search');
if (si > -1) search(Number(process.argv[si + 1]), Number(process.argv[si + 2] ?? 400));
else check();
