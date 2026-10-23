import type { AdHooks, Platform } from './types';

// Android + iOS build (Capacitor) using Google AdMob through @capacitor-community/admob.
// Docs: https://github.com/capacitor-community/admob  (verify API for the version you install)
// Ad unit IDs come from .env.mobile. They default to Google's public TEST ids.
export class MobilePlatform implements Platform {
  readonly name = 'mobile';
  readonly hasRewarded = true;
  private admob?: typeof import('@capacitor-community/admob').AdMob;
  private ios = false;
  constructor(private hooks: AdHooks) {}

  async init(): Promise<void> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return; // running `npm run dev` in a browser
      this.ios = Capacitor.getPlatform() === 'ios';
      const { AdMob } = await import('@capacitor-community/admob');
      this.admob = AdMob;
      // iOS 14+: ask for tracking permission before ads (App Store requires the prompt text in Info.plist)
      if (this.ios) { try { await AdMob.requestTrackingAuthorization(); } catch { /* user declined */ } }
      await AdMob.initialize({ initializeForTesting: import.meta.env.VITE_ADMOB_TESTING === 'true' });
    } catch (e) {
      console.warn('AdMob unavailable', e);
      this.admob = undefined;
    }
  }

  private id(kind: 'INTERSTITIAL' | 'REWARDED'): string {
    const env = import.meta.env as Record<string, string | undefined>;
    return env[`VITE_ADMOB_${kind}_${this.ios ? 'IOS' : 'ANDROID'}`] ?? '';
  }

  loadingFinished(): void {}
  gameplayStart(): void {}
  gameplayStop(): void {}
  happyTime(): void {}

  async commercialBreak(): Promise<void> {
    if (!this.admob) return;
    try {
      await this.admob.prepareInterstitial({ adId: this.id('INTERSTITIAL'), isTesting: import.meta.env.VITE_ADMOB_TESTING === 'true' });
      this.hooks.onAdStart();
      await this.admob.showInterstitial();
    } catch { /* no fill / offline */ }
    this.hooks.onAdEnd();
  }

  async rewardedBreak(): Promise<boolean> {
    if (!this.admob) return false;
    let ok = false;
    try {
      await this.admob.prepareRewardVideoAd({ adId: this.id('REWARDED'), isTesting: import.meta.env.VITE_ADMOB_TESTING === 'true' });
      this.hooks.onAdStart();
      const reward = await this.admob.showRewardVideoAd();
      ok = !!reward;
    } catch { ok = false; }
    this.hooks.onAdEnd();
    return ok;
  }
}
