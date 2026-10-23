import { type AdHooks, type Platform, loadScript } from './types';

// GameDistribution HTML5 SDK. Docs: https://github.com/GameDistribution/GD-HTML5  (verify before release)
interface GDEvent { name: string }
interface GDSDK { showAd(type?: string): Promise<unknown>; preloadAd?(type: string): Promise<unknown> }
declare global {
  interface Window {
    GD_OPTIONS?: { gameId: string; onEvent: (e: GDEvent) => void };
    gdsdk?: GDSDK;
  }
}

export class GameDistributionPlatform implements Platform {
  readonly name = 'gamedistribution';
  readonly hasRewarded = true;
  private rewardEarned = false;
  constructor(private hooks: AdHooks) {}

  async init(): Promise<void> {
    const gameId = import.meta.env.VITE_GD_GAME_ID as string | undefined;
    window.GD_OPTIONS = {
      gameId: gameId ?? '',
      onEvent: (e) => {
        switch (e.name) {
          case 'SDK_GAME_PAUSE': this.hooks.onAdStart(); break;
          case 'SDK_GAME_START': this.hooks.onAdEnd(); break;
          case 'SDK_REWARDED_WATCH_COMPLETE': this.rewardEarned = true; break;
        }
      },
    };
    try {
      await loadScript('https://html5.api.gamedistribution.com/main.min.js');
      void window.gdsdk?.preloadAd?.('rewarded').catch(() => undefined);
    } catch (e) {
      console.warn('GameDistribution SDK unavailable', e);
    }
  }

  loadingFinished(): void {}
  gameplayStart(): void {}
  gameplayStop(): void {}
  happyTime(): void {}

  async commercialBreak(): Promise<void> {
    try { await window.gdsdk?.showAd(); } catch { /* no fill */ }
    this.hooks.onAdEnd();
  }

  async rewardedBreak(): Promise<boolean> {
    this.rewardEarned = false;
    try { await window.gdsdk?.showAd('rewarded'); } catch { /* no fill */ }
    this.hooks.onAdEnd();
    void window.gdsdk?.preloadAd?.('rewarded').catch(() => undefined);
    return this.rewardEarned;
  }
}
