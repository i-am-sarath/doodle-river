# Doodle River — notes for Claude Code

Physics drawing puzzle: the player draws a riverbed line, water flows from a spring along it and must fill a dry pond.
Ships to web portals (Poki, CrazyGames, GameDistribution, Coolmath) and to Android/iOS through Capacitor, from one codebase.

## Commands
- `npm run dev` — local dev server (fake ads via `LocalPlatform`)
- `npm run typecheck` — must pass before every commit
- `npm run check-levels` — replays every level's `solution` headlessly; must print "All levels winnable"
- `npm run search-level -- <index> [tries]` — random-search a winning line for one level (0-based index)
- `npm run build:poki | build:crazygames | build:gd | build:web` — output in `dist/<target>`
- `npm run build:mobile` then `npx cap open android|ios`

## Architecture
- `src/config.ts` — game name, physics tuning, star rules, ad pacing. Tune here first.
- `src/game/` — pure logic, no DOM: `game.ts` (state machine + scoring), `physics.ts` (particle water), `levels.ts`, `render.ts` (canvas), `audio.ts` (synth sfx), `save.ts` (localStorage, never throws)
- `src/ui/` — DOM menus/HUD (`index.html` markup + `ui.ts`) and the ad flow (when interstitials/rewarded ads appear)
- `src/platform/` — one adapter per destination implementing `Platform` (`types.ts`). Selected by `VITE_PLATFORM` from `.env.<mode>`.
- `scripts/` — headless simulator + level checker (runs with tsx; imports `src/game` directly)

Playfield is a fixed logical 400x640 (portrait). It is scaled into the window; the canvas always fills the whole screen (Poki requires it) and scenery extends past the playfield. `HUD_H` reserves a strip above the playfield for the top bar.

## Rules
- Never call a portal SDK outside `src/platform/`. The game only uses the `Platform` interface.
- Every ad call must go through `UI.withAd()` so gameplay is stopped and audio muted during ads.
- No external network requests in game code (portals block them). Bundle all assets; fonts come from `@fontsource`.
- `localStorage` access must stay wrapped in try/catch (portal iframes can block it).
- After editing `levels.ts`: run `npm run check-levels`. Every level needs a `solution` that wins 3/3 times, and must NOT be winnable with a throwaway line (that means it plays itself).
- Keep the first 2 levels ad-free and teach one new idea per level group. See docs/LEVEL_DESIGN.md.
- `appId` in `capacitor.config.ts` must never change after the first store release.
