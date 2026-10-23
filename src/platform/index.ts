import type { AdHooks, Platform } from './types';

/**
 * Picks the adapter from VITE_PLATFORM (set by the .env.<mode> file).
 * Vite inlines VITE_PLATFORM, so the `if` chain becomes constant and the other adapters are dropped from the
 * bundle. (A `switch` is not pruned.) Portal QA rejects builds that mention other portals' SDKs.
 */
export async function createPlatform(hooks: AdHooks): Promise<Platform> {
  const p = import.meta.env.VITE_PLATFORM;
  if (p === 'poki') return new (await import('./poki')).PokiPlatform(hooks);
  if (p === 'crazygames') return new (await import('./crazygames')).CrazyGamesPlatform(hooks);
  if (p === 'gamedistribution') return new (await import('./gamedistribution')).GameDistributionPlatform(hooks);
  if (p === 'mobile') return new (await import('./mobile')).MobilePlatform(hooks);
  return new (await import('./local')).LocalPlatform(hooks);
}

export type { Platform };
