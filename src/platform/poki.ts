import { type AdHooks, type Platform, loadScript } from './types';

// Poki SDK v2. Docs: https://sdk.poki.com  (verify method names there before release)
interface PokiSDKType {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(onStart?: () => void): Promise<void>;
  rewardedBreak(onStart?: () => void): Promise<boolean>;
  setDebug?(v: boolean): void;
}
declare global { interface Window { PokiSDK?: PokiSDKType } }

export class PokiPlatform implements Platform {
  readonly name = 'poki';
  readonly hasRewarded = true;
  private sdk?: PokiSDKType;
  private playing = false;
  constructor(private hooks: AdHooks) {}

  async init(): Promise<void> {
    try {
      await loadScript('https://game-cdn.poki.com/scripts/v2/poki-sdk.js');
      this.sdk = window.PokiSDK;
      await this.sdk?.init();
      if (import.meta.env.DEV) this.sdk?.setDebug?.(true);
    } catch (e) {
      // Adblockers block the SDK. The game must still work, just without ads.
      console.warn('Poki SDK unavailable', e);
      this.sdk = undefined;
    }
  }

  loadingFinished(): void { this.sdk?.gameLoadingFinished(); }
  gameplayStart(): void { if (!this.playing) { this.playing = true; this.sdk?.gameplayStart(); } }
  gameplayStop(): void { if (this.playing) { this.playing = false; this.sdk?.gameplayStop(); } }
  happyTime(): void {}

  async commercialBreak(): Promise<void> {
    if (!this.sdk) return;
    try { await this.sdk.commercialBreak(() => this.hooks.onAdStart()); } catch { /* ignore */ }
    this.hooks.onAdEnd();
  }

  async rewardedBreak(): Promise<boolean> {
    if (!this.sdk) return false;
    let ok = false;
    try { ok = await this.sdk.rewardedBreak(() => this.hooks.onAdStart()); } catch { ok = false; }
    this.hooks.onAdEnd();
    return ok;
  }
}
