import type { AdHooks, Platform } from './types';

/** Picks the adapter from VITE_PLATFORM (set by the .env.<mode> file). Unused SDK code is not bundled. */
export async function createPlatform(hooks: AdHooks): Promise<Platform> {
  switch (import.meta.env.VITE_PLATFORM) {
    case 'poki': return new (await import('./poki')).PokiPlatform(hooks);
    case 'crazygames': return new (await import('./crazygames')).CrazyGamesPlatform(hooks);
    case 'gamedistribution': return new (await import('./gamedistribution')).GameDistributionPlatform(hooks);
    case 'mobile': return new (await import('./mobile')).MobilePlatform(hooks);
    default: return new (await import('./local')).LocalPlatform(hooks);
  }
}

export type { Platform };
