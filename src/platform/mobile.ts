import type { PluginListenerHandle } from '@capacitor/core';
import type { AdHooks, Platform } from './types';

type AdMobType = typeof import('@capacitor-community/admob').AdMob;
type AdMobModule = typeof import('@capacitor-community/admob');

// Android + iOS build (Capacitor) using Google AdMob through @capacitor-community/admob.
// Docs: https://github.com/capacitor-community/admob  (verify API for the version you install)
// Ad unit IDs come from .env.mobile. They default to Google's public TEST ids.
//
// Note: the plugin's show*() promises are not "ad closed" signals. showInterstitial() resolves as soon as the ad
// appears, and showRewardVideoAd() only resolves if the reward is earned (it never settles if the player closes
// the ad early). So ads here end on the Dismissed / FailedToShow events instead.
export class MobilePlatform implements Platform {
  readonly name = 'mobile';
  readonly hasRewarded = true;
  private admob?: AdMobType;
  private mod?: AdMobModule;
  private ios = false;
  private testing = import.meta.env.VITE_ADMOB_TESTING === 'true';
  private consentFormAvailable = false;
  constructor(private hooks: AdHooks) {}

  async init(): Promise<void> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return; // running `npm run dev` in a browser
      this.ios = Capacitor.getPlatform() === 'ios';
      this.mod = await import('@capacitor-community/admob');
      const AdMob = this.mod.AdMob;
      this.admob = AdMob;
      await AdMob.initialize({ initializeForTesting: this.testing });
      await this.gatherConsent();
      // iOS 14+: ask for tracking permission after the GDPR form (App Store requires the prompt text in Info.plist)
      if (this.ios) {
        try {
          const { status } = await AdMob.trackingAuthorizationStatus();
          if (status === 'notDetermined') await AdMob.requestTrackingAuthorization();
        } catch { /* user declined / not supported */ }
      }
    } catch (e) {
      console.warn('AdMob unavailable', e);
      this.admob = undefined;
    }
  }

  /** Google UMP consent form. Required before serving ads to users in the EEA, UK and Switzerland. */
  private async gatherConsent(): Promise<void> {
    const AdMob = this.admob!, { AdmobConsentStatus } = this.mod!;
    try {
      const info = await AdMob.requestConsentInfo();
      this.consentFormAvailable = !!info.isConsentFormAvailable;
      if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) await AdMob.showConsentForm();
    } catch (e) {
      console.warn('Consent info unavailable', e); // offline: ads will simply not fill
    }
  }

  /** Lets players change their ad consent later (GDPR). Only shown when a consent form exists for their region. */
  get hasPrivacyOptions(): boolean { return this.consentFormAvailable; }

  async privacyOptions(): Promise<void> {
    if (!this.admob) return;
    try {
      await this.admob.resetConsentInfo();
      const info = await this.admob.requestConsentInfo();
      if (info.isConsentFormAvailable) await this.admob.showConsentForm();
    } catch { /* ignore */ }
  }

  async onBackButton(handler: () => boolean): Promise<void> {
    try {
      const { App } = await import('@capacitor/app');
      await App.addListener('backButton', () => { if (!handler()) void App.exitApp(); });
    } catch { /* not native */ }
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
    const AdMob = this.admob, m = this.mod;
    if (!AdMob || !m) return;
    const ev = m.InterstitialAdPluginEvents;
    await this.untilClosed([ev.Dismissed, ev.FailedToShow], async () => {
      await AdMob.prepareInterstitial({ adId: this.id('INTERSTITIAL'), isTesting: this.testing });
      this.hooks.onAdStart();
      await AdMob.showInterstitial();
    });
  }

  async rewardedBreak(): Promise<boolean> {
    const AdMob = this.admob, m = this.mod;
    if (!AdMob || !m) return false;
    const ev = m.RewardAdPluginEvents;
    let earned = false;
    const h = await AdMob.addListener(ev.Rewarded, () => { earned = true; });
    await this.untilClosed([ev.Dismissed, ev.FailedToShow], async () => {
      await AdMob.prepareRewardVideoAd({ adId: this.id('REWARDED'), isTesting: this.testing });
      this.hooks.onAdStart();
      void AdMob.showRewardVideoAd().catch(() => undefined); // settles only on reward; see note at the top
    });
    void h.remove();
    return earned;
  }

  /** Runs `show`, then waits for one of the closing events. A failed load/show ends immediately. */
  private async untilClosed(events: string[], show: () => Promise<void>): Promise<void> {
    const AdMob = this.admob!;
    let done!: () => void;
    const closed = new Promise<void>((r) => (done = r));
    const handles: PluginListenerHandle[] = [];
    // addListener is typed per event name; the closing events all take a payload we ignore
    const add = AdMob.addListener as unknown as (e: string, f: () => void) => Promise<PluginListenerHandle>;
    for (const e of events) handles.push(await add.call(AdMob, e, () => done()));
    try {
      await show();
      await closed;
    } catch { /* no fill / offline */ }
    for (const h of handles) void h.remove();
    this.hooks.onAdEnd();
  }
}
