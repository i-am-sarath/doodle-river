import { BONUS_INK, FIRST_AD_LEVEL, INTERSTITIAL_EVERY, SKIP_AFTER_FAILS } from '../config';
import type { Sfx } from '../game/audio';
import type { Game } from '../game/game';
import { type SaveData, writeSave } from '../game/save';
import type { LevelResult } from '../game/types';
import type { Platform } from '../platform';

const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.6 6 21l1.3-6.8-5-4.7 6.8-.8z"/></svg>';
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const PANELS = ['#pMenu', '#pLevels', '#pWin', '#pLose'] as const;

/** DOM menus, HUD and the ad flow. */
export class UI {
  private winsSinceAd = 0;
  private failStreak = 0;
  private inkAdUsed = false;
  private busy = false; // an ad is showing
  get adShowing(): boolean { return this.busy; }
  /** True while an ad or any menu panel is up: the canvas must not accept drawing then. */
  get blocksInput(): boolean { return this.busy || PANELS.some((p) => !$(p).hidden); }

  constructor(private game: Game, private platform: Platform, private sfx: Sfx, private save: SaveData) {
    sfx.enabled = save.sfx;
    this.renderSfx();
    game.onInkChange = () => this.updInk();
    game.onPourStart = () => this.onPour();
    game.onFinish = (r) => this.onFinish(r);
    this.wire();
  }

  // ---------- flow ----------
  async startLevel(i: number): Promise<void> {
    if (this.busy) return;
    if (i !== this.game.levelIndex) this.failStreak = 0;
    await this.maybeInterstitial(i);
    this.game.load(i);
    this.inkAdUsed = false;
    this.show(null);
    $('#hud').hidden = false;
    $('#lvl').textContent = `LEVEL ${i + 1}`;
    this.setHint(this.game.level.hint);
    this.updInk();
    this.platform.gameplayStart();
  }

  private async maybeInterstitial(nextIndex: number): Promise<void> {
    if (nextIndex + 1 < FIRST_AD_LEVEL || this.winsSinceAd < INTERSTITIAL_EVERY) return;
    this.winsSinceAd = 0;
    await this.withAd(() => this.platform.commercialBreak());
  }

  private async withAd<T>(fn: () => Promise<T>): Promise<T> {
    this.busy = true;
    this.platform.gameplayStop();
    try { return await fn(); } finally { this.busy = false; }
  }

  private onPour(): void {
    if (this.game.level.live) {
      this.setHint('Keep drawing to steer the river!');
      setTimeout(() => { if (this.game.state !== 'draw') $('#hint').hidden = true; }, 1800);
    }
    $('#bMoreInk').hidden = true;
  }

  private onFinish(r: LevelResult): void {
    this.platform.gameplayStop();
    $('#bMoreInk').hidden = true;
    const i = this.game.levelIndex;
    if (r.won) {
      this.failStreak = 0;
      this.winsSinceAd++;
      this.save.stars[i] = Math.max(this.save.stars[i] ?? 0, r.stars);
      this.save.unlocked = Math.max(this.save.unlocked, Math.min(this.game.levelCount, i + 2));
      writeSave(this.save);
      if (r.stars === 3) this.platform.happyTime();
      $('#winT').textContent = ['POND FILLED!', 'RIVER RUNS!', 'PERFECT FLOW!'][r.stars - 1];
      $('#winStars').innerHTML = [0, 1, 2].map((k) => STAR.replace('<svg', `<svg class="${k < r.stars ? 'on' : ''}"`)).join('');
      const allF = r.bloomed === r.flowerCount;
      $('#winS').textContent = `Flowers ${r.bloomed}/${r.flowerCount} ${allF ? '✓' : '✗'} · Ink ${Math.round(r.inkFrac * 100)}% ${r.inkFrac <= 0.6 ? '✓' : '(need ≤60%)'}`;
      $('#bNext').textContent = i < this.game.levelCount - 1 ? 'NEXT' : 'LEVELS';
      setTimeout(() => { if (this.game.state === 'win') this.show('#pWin'); }, 650);
    } else {
      this.failStreak++;
      $('#loseS').textContent = `The pond got ${r.inCup} of ${r.goal} drops. Try a different path.`;
      $('#bSkip').hidden = !(this.platform.hasRewarded && this.failStreak >= SKIP_AFTER_FAILS && i < this.game.levelCount - 1);
      setTimeout(() => { if (this.game.state === 'lose') this.show('#pLose'); }, 500);
    }
  }

  // ---------- HUD ----------
  private updInk(): void {
    const left = this.game.inkLeftFrac;
    const ink = $('#ink');
    ink.style.transform = `scaleX(${left})`;
    ink.style.background = left < 0.2 ? 'var(--lava)' : left < 0.4 ? 'var(--gold)' : 'var(--ink)';
    // offer the rewarded "+ink" before the player starts drawing (once per attempt, not on the first levels)
    $('#bMoreInk').hidden = !(this.platform.hasRewarded && !this.inkAdUsed && this.game.state === 'draw'
      && !this.game.drawing && this.game.strokes.length === 0 && this.game.levelIndex + 1 >= FIRST_AD_LEVEL);
  }

  private setHint(t: string): void { $('#hintT').textContent = t; $('#hint').hidden = false; }

  private show(id: (typeof PANELS)[number] | null): void {
    for (const p of PANELS) $(p).hidden = p !== id;
    if (id === '#pMenu' || id === '#pLevels') { $('#hud').hidden = id === '#pMenu' || this.game.state === 'menu'; $('#hint').hidden = true; }
  }

  private buildLevels(): void {
    $('#grid').innerHTML = Array.from({ length: this.game.levelCount }, (_, i) => {
      const locked = i >= this.save.unlocked, s = this.save.stars[i] ?? 0;
      return `<button class="lv" data-i="${i}" ${locked ? 'disabled aria-label="Locked level"' : `aria-label="Level ${i + 1}, ${s} stars"`}>${locked ? '🔒' : i + 1}<small>${locked ? '' : '★'.repeat(s) + '☆'.repeat(3 - s)}</small></button>`;
    }).join('');
  }

  private openLevels(): void {
    this.platform.gameplayStop();
    this.buildLevels();
    this.show('#pLevels');
  }

  private renderSfx(): void {
    $('#sfxWave').style.opacity = this.sfx.enabled ? '1' : '0';
    $('#bSfx').style.background = this.sfx.enabled ? '' : '#9d97b5';
  }

  // ---------- wiring ----------
  private wire(): void {
    const on = (sel: string, fn: () => void) => $(sel).addEventListener('click', () => { this.sfx.unlock(); fn(); });
    on('#bPlay', () => void this.startLevel(Math.min(this.save.unlocked, this.game.levelCount) - 1));
    on('#bLevels', () => this.openLevels());
    on('#bMenu', () => this.openLevels());
    on('#bBack', () => {
      if (this.game.state === 'menu') this.show('#pMenu');
      else { this.show(null); $('#hud').hidden = false; if (this.game.state === 'draw' || this.game.state === 'pour') this.platform.gameplayStart(); else void this.startLevel(this.game.levelIndex); }
    });
    on('#bRetry', () => void this.startLevel(this.game.levelIndex));
    on('#bWinRetry', () => void this.startLevel(this.game.levelIndex));
    on('#bLoseRetry', () => void this.startLevel(this.game.levelIndex));
    on('#bLoseLv', () => this.openLevels());
    on('#bNext', () => {
      const i = this.game.levelIndex;
      if (i < this.game.levelCount - 1) void this.startLevel(i + 1); else this.openLevels();
    });
    $('#grid').addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.lv');
      if (b && !b.disabled) { this.sfx.unlock(); void this.startLevel(Number(b.dataset.i)); }
    });
    $('#bPrivacy').hidden = !this.platform.hasPrivacyOptions;
    on('#bPrivacy', () => { if (!this.busy) void this.withAd(() => this.platform.privacyOptions?.() ?? Promise.resolve()); });
    this.platform.onBackButton?.(() => this.back());
    on('#bSfx', () => { this.sfx.enabled = !this.sfx.enabled; this.save.sfx = this.sfx.enabled; writeSave(this.save); this.renderSfx(); });

    on('#bMoreInk', async () => {
      if (this.busy) return;
      $('#bMoreInk').hidden = true;
      const ok = await this.withAd(() => this.platform.rewardedBreak());
      this.platform.gameplayStart();
      if (ok) { this.inkAdUsed = true; this.game.addInk(BONUS_INK); }
      this.updInk();
    });
    on('#bSkip', async () => {
      if (this.busy) return;
      const ok = await this.withAd(() => this.platform.rewardedBreak());
      if (!ok) return;
      const i = this.game.levelIndex;
      this.save.unlocked = Math.max(this.save.unlocked, Math.min(this.game.levelCount, i + 2));
      writeSave(this.save);
      this.failStreak = 0;
      void this.startLevel(i + 1);
    });

    addEventListener('keydown', (e) => {
      if ((e.key === 'r' || e.key === 'R') && this.game.state !== 'menu' && !this.busy) void this.startLevel(this.game.levelIndex);
      if (e.key === 'Escape') this.back();
    });
  }

  /** Android back button / Escape. Returns false only on the title screen (the app may exit then). */
  back(): boolean {
    if (this.busy) return true;
    if (!$('#pMenu').hidden) return false;
    if (!$('#pLevels').hidden) $('#bBack').click();
    else if (this.game.state === 'menu') this.show('#pMenu');
    else this.openLevels();
    return true;
  }

  hideHintOnDraw(): void { $('#hint').hidden = true; $('#bMoreInk').hidden = true; }
}
