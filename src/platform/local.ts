import type { AdHooks, Platform } from './types';

/**
 * Dev + self-hosted web build. Shows a fake 1.2s "AD" panel so you can test ad flows locally.
 * For a real self-hosted site you could swap this for Google AdSense for Games (H5 Games Ads).
 */
export class LocalPlatform implements Platform {
  readonly name = 'local';
  readonly hasRewarded = true;
  constructor(private hooks: AdHooks) {}

  async init(): Promise<void> {}
  loadingFinished(): void { console.info('[platform] loadingFinished'); }
  gameplayStart(): void { console.info('[platform] gameplayStart'); }
  gameplayStop(): void { console.info('[platform] gameplayStop'); }
  happyTime(): void { console.info('[platform] happyTime'); }

  commercialBreak(): Promise<void> { return this.fakeAd('interstitial').then(() => undefined); }
  rewardedBreak(): Promise<boolean> { return this.fakeAd('rewarded'); }

  private fakeAd(kind: string): Promise<boolean> {
    console.info(`[platform] fake ${kind} ad`);
    const panel = document.getElementById('pAd');
    this.hooks.onAdStart();
    if (panel) panel.hidden = false;
    return new Promise((resolve) => setTimeout(() => {
      if (panel) panel.hidden = true;
      this.hooks.onAdEnd();
      resolve(true);
    }, 1200));
  }
}
