import '@fontsource/lilita-one/400.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import './ui/styles.css';

import { H, HUD_H, W } from './config';
import { Sfx } from './game/audio';
import { Game } from './game/game';
import { render, type View } from './game/render';
import { loadSave } from './game/save';
import { createPlatform } from './platform';
import { UI } from './ui/ui';

async function main(): Promise<void> {
  const sfx = new Sfx();
  const platform = await createPlatform({
    onAdStart: () => sfx.setAdMuted(true),
    onAdEnd: () => sfx.setAdMuted(false),
  });
  await platform.init();

  const game = new Game(sfx);
  const ui = new UI(game, platform, sfx, loadSave());

  const cv = document.getElementById('cv') as HTMLCanvasElement;
  const ctx = cv.getContext('2d')!;
  const field = document.getElementById('field') as HTMLDivElement;
  const safe = document.getElementById('safe') as HTMLDivElement;
  const view: View = { scale: 1, ox: 0, oy: 0, dpr: 1, cw: 0, ch: 0 };

  // Canvas fills the whole window (Poki requirement). The top-bar strip + 400x640 playfield are fitted inside the safe area.
  function layout(): void {
    const cw = innerWidth, ch = innerHeight, s = safe.getBoundingClientRect();
    const pad = 6;
    const aw = s.width - pad * 2, ah = s.height - pad * 2;
    const scale = Math.min(aw / W, ah / (H + HUD_H));
    view.scale = scale; view.cw = cw; view.ch = ch;
    view.ox = s.left + (s.width - W * scale) / 2;
    const top = s.top + (s.height - (H + HUD_H) * scale) / 2; // top bar strip, then the playfield
    view.oy = top + HUD_H * scale;
    view.dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(cw * view.dpr); cv.height = Math.round(ch * view.dpr);
    Object.assign(field.style, { left: `${view.ox}px`, top: `${top}px`, width: `${W * scale}px`, height: `${(H + HUD_H) * scale}px` });
    field.style.setProperty('--u', `${scale}px`);
  }
  addEventListener('resize', layout);
  layout();

  const toField = (e: PointerEvent) => ({ x: (e.clientX - view.ox) / view.scale, y: (e.clientY - view.oy) / view.scale });
  cv.addEventListener('pointerdown', (e) => {
    sfx.unlock();
    if (ui.adShowing) return; // portals require input to be blocked during ads
    if (game.beginStroke(toField(e))) { cv.setPointerCapture(e.pointerId); ui.hideHintOnDraw(); }
  });
  cv.addEventListener('pointermove', (e) => game.moveStroke(toField(e)));
  cv.addEventListener('pointerup', () => game.endStroke());
  cv.addEventListener('pointercancel', () => game.endStroke());
  cv.addEventListener('contextmenu', (e) => e.preventDefault());

  // Pause audio when the tab/app is hidden.
  document.addEventListener('visibilitychange', () => (document.hidden ? sfx.suspend() : sfx.resume()));

  // Fixed 60 Hz simulation, render every frame.
  let last = performance.now(), acc = 0;
  const frame = (now: number) => {
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    while (acc >= 1 / 60) { game.step(1 / 60); acc -= 1 / 60; }
    render(ctx, game, view);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  await document.fonts?.ready;
  platform.loadingFinished();
}

void main();
