// Branding and tuning knobs. Rename the game here (also index.html <title> and capacitor.config.ts).
export const GAME_NAME = 'Doodle River';
export const SAVE_KEY = 'doodle-river-save-v1';

// Logical playfield. All level coordinates use this space; it is scaled to fit any screen.
export const W = 400;
export const H = 640;
/** Strip above the playfield reserved for the top bar (level, ink, buttons), in playfield px. */
export const HUD_H = 76;

// Water simulation
export const PR = 4;          // particle radius (physics)
export const PR_DRAW = 6.8;   // particle radius when rendered (bigger = blobbier water)
export const G = 980;         // gravity, px/s^2
export const SUB = 3;         // physics substeps per frame (raise if water tunnels through lines)
export const MAXV = 650;      // speed cap, px/s
export const SPAWN_RATE = 48; // drops per second from the spring
export const LINE_R = 4;      // half-thickness of player riverbed lines
export const WALL_R = 5;      // half-thickness of rock walls
export const LINE_FRICTION = 0.992; // speed kept per contact per substep (lower = slower, calmer river)
export const AIR_DRAG = 0.997;      // horizontal speed kept per substep in the air (lower = water falls more straight down)

// Stars: 1 for filling the pond, +1 all flowers bloomed, +1 ink used <= THRIFTY
export const THRIFTY = 0.6;

// After the last drop leaves the spring, wait until the water settles (or this many seconds) before scoring.
export const MAX_SETTLE = 12;

// Ads. Portals rate-limit too, but keep it friendly: never before FIRST_AD_LEVEL.
export const FIRST_AD_LEVEL = 3;       // 1-based level number
export const INTERSTITIAL_EVERY = 2;   // completed levels between interstitials
export const SKIP_AFTER_FAILS = 2;     // show "Skip level (ad)" after this many fails in a row
export const BONUS_INK = 0.5;          // rewarded ad gives +50% ink
