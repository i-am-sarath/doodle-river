import { type AdHooks, type Platform, loadScript } from './types';

// CrazyGames HTML5 SDK v3. Docs: https://docs.crazygames.com  (verify before release)
interface CGAdCallbacks { adStarted?: () => void; adFinished?: () => void; adError?: (e: unknown) => void }
interface CGSDK {
  init(): Promise<void>;
  game: { loadingStart(): void; loadingStop(): void; gameplayStart(): void; gameplayStop(): void; happytime(): void };
  ad: { requestAd(type: 'midgame' | 'rewarded', cb: CGAdCallbacks): void };
}
declare global { interface Window { CrazyGames?: { SDK: CGSDK } } }

export class CrazyGamesPlatform implements Platform {
  readonly name = 'crazygames';
  readonly hasRewarded = true;
  private sdk?: CGSDK;
  private playing = false;
  constructor(private hooks: AdHooks) {}

  async init(): Promise<void> {
    try {
      await loadScript('https://sdk.crazygames.com/crazygames-sdk-v3.js');
      this.sdk = window.CrazyGames?.SDK;
      await this.sdk?.init();
      this.sdk?.game.loadingStart();
    } catch (e) {
      console.warn('CrazyGames SDK unavailable', e);
      this.sdk = undefined;
    }
  }

  loadingFinished(): void { this.sdk?.game.loadingStop(); }
  gameplayStart(): void { if (!this.playing) { this.playing = true; this.sdk?.game.gameplayStart(); } }
  gameplayStop(): void { if (this.playing) { this.playing = false; this.sdk?.game.gameplayStop(); } }
  happyTime(): void { this.sdk?.game.happytime(); }

  commercialBreak(): Promise<void> { return this.request('midgame').then(() => undefined); }
  rewardedBreak(): Promise<boolean> { return this.request('rewarded'); }

  private request(type: 'midgame' | 'rewarded'): Promise<boolean> {
    const sdk = this.sdk;
    if (!sdk) return Promise.resolve(false);
    return new Promise((resolve) => {
      sdk.ad.requestAd(type, {
        adStarted: () => this.hooks.onAdStart(),
        adFinished: () => { this.hooks.onAdEnd(); resolve(true); },
        adError: () => { this.hooks.onAdEnd(); resolve(false); },
      });
    });
  }
}
