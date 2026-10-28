import type { AdHooks, Platform } from './types';

/**
 * GameBooth (gamebooth.online). The site runs the game in a sandboxed iframe and shows the ads itself; the game
 * only sends requests to the parent page with postMessage, so there is no SDK script to load.
 * Protocol (v1), mirrored in gamebooth-web's `public/sdk/gamebooth-sdk.js`:
 *   game -> site: { source: 'gamebooth-game', v: 1, type, id? }   type: loadingFinished | gameplayStart |
 *                 gameplayStop | happyTime | commercialBreak | rewardedBreak (the last two carry an id)
 *   site -> game: { source: 'gamebooth', v: 1, type: 'ack' | 'adStart' | 'result', id, ok? }
 *                 ack: request received (an ad may still take a while to load). adStart: mute now. result: done.
 * Outside GameBooth (no parent frame, or a site that never answers) ads are simply skipped.
 */
const ACK_MS = 2000; // the site must answer (ack, adStart or result) this fast, or we carry on without the ad

type Pending = { resolve: (ok: boolean) => void; timer: number; started: boolean };

export class GameBoothPlatform implements Platform {
  readonly name = 'gamebooth';
  readonly hasRewarded = window.parent !== window;
  private pending = new Map<number, Pending>();
  private nextId = 1;
  private playing = false;
  constructor(private hooks: AdHooks) {}

  async init(): Promise<void> {
    window.addEventListener('message', (e) => {
      if (e.source !== window.parent) return;
      const m = e.data as { source?: string; v?: number; type?: string; id?: number; ok?: boolean } | null;
      if (!m || m.source !== 'gamebooth' || m.v !== 1 || typeof m.id !== 'number') return;
      const p = this.pending.get(m.id);
      if (!p) return;
      if (m.type === 'ack') {
        clearTimeout(p.timer);
      } else if (m.type === 'adStart') {
        clearTimeout(p.timer);
        if (!p.started) { p.started = true; this.hooks.onAdStart(); }
      } else if (m.type === 'result') {
        this.finish(m.id, m.ok === true);
      }
    });
  }

  loadingFinished(): void { this.send('loadingFinished'); }
  gameplayStart(): void { if (!this.playing) { this.playing = true; this.send('gameplayStart'); } }
  gameplayStop(): void { if (this.playing) { this.playing = false; this.send('gameplayStop'); } }
  happyTime(): void { this.send('happyTime'); }

  async commercialBreak(): Promise<void> { await this.request('commercialBreak'); }
  rewardedBreak(): Promise<boolean> { return this.request('rewardedBreak'); }

  private request(type: 'commercialBreak' | 'rewardedBreak'): Promise<boolean> {
    if (window.parent === window) return Promise.resolve(false);
    const id = this.nextId++;
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => this.finish(id, false), ACK_MS);
      this.pending.set(id, { resolve, timer, started: false });
      this.send(type, id);
    });
  }

  private finish(id: number, ok: boolean): void {
    const p = this.pending.get(id);
    if (!p) return;
    this.pending.delete(id);
    clearTimeout(p.timer);
    if (p.started) this.hooks.onAdEnd();
    p.resolve(ok);
  }

  private send(type: string, id?: number): void {
    if (window.parent === window) return;
    // Nothing secret in these messages, and the game can't know which domain hosts it, so '*' is fine.
    try { window.parent.postMessage({ source: 'gamebooth-game', v: 1, type, id }, '*'); } catch { /* ignore */ }
  }
}
