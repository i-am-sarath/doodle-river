/**
 * Every destination (Poki, CrazyGames, GameDistribution, mobile, plain web) implements this.
 * The game only ever talks to this interface, so adding a new portal = one new file.
 */
export interface Platform {
  readonly name: string;
  /** True if rewarded ads are available (shows the "+ink" and "skip" buttons). */
  readonly hasRewarded: boolean;
  init(): Promise<void>;
  /** Call once when the first screen is ready to play. */
  loadingFinished(): void;
  /** Player is actively playing (level on screen, not in a menu). */
  gameplayStart(): void;
  /** Player left gameplay (menu, win/lose screen, pause). */
  gameplayStop(): void;
  /** Interstitial ad. Resolves when the ad is done or skipped. Never rejects. */
  commercialBreak(): Promise<void>;
  /** Rewarded ad. Resolves true only if the player earned the reward. Never rejects. */
  rewardedBreak(): Promise<boolean>;
  /** Optional celebration signal (CrazyGames uses it). */
  happyTime(): void;
  /** True if players can reopen an ad-consent form (mobile GDPR). Shows the menu's "Privacy" button. */
  readonly hasPrivacyOptions?: boolean;
  privacyOptions?(): Promise<void>;
  /** Hardware back button (Android). `handler` returns false when the game should exit. */
  onBackButton?(handler: () => boolean): void;
}

/** The game mutes itself while ads play. */
export interface AdHooks {
  onAdStart(): void;
  onAdEnd(): void;
}

export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}
