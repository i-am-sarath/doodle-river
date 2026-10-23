# Doodle River

Draw the riverbed. Guide the water. Fill the pond.

A physics drawing puzzle for web portals and mobile, built with TypeScript + Vite (no game engine) and wrapped for Android/iOS with Capacitor.

## Quick start
```bash
npm install
npm run dev            # open the printed URL (also works on your phone over Wi-Fi)
npm run check-levels   # verifies all 15 levels are winnable
```

## Builds
| Target | Command | Output | Ads |
|---|---|---|---|
| Your own site / itch.io | `npm run build:web` | `dist/web` | fake placeholder (swap for AdSense for Games) |
| Poki | `npm run build:poki` | `dist/poki` | Poki SDK |
| CrazyGames | `npm run build:crazygames` | `dist/crazygames` | CrazyGames SDK v3 |
| GameDistribution | `npm run build:gd` | `dist/gamedistribution` | GD SDK (set `VITE_GD_GAME_ID` in `.env.gamedistribution`) |
| Android / iOS | `npm run build:mobile` | `android/`, `ios/` | AdMob (test IDs in `.env.mobile`) |

Zip the contents of a `dist/<target>` folder (not the folder itself) to upload to a portal.

### First-time mobile setup
```bash
npx cap add android
npx cap add ios        # needs a Mac with Xcode
npm run build:mobile
npx cap open android   # or: npx cap open ios
```
Then add your AdMob **App ID** to the native projects (see `docs/RELEASE_PLAN.md`, Phase 3).

## Docs
- `docs/RELEASE_PLAN.md` — step-by-step release plan for portals and stores
- `docs/MONETIZATION.md` — how the game makes money and where ads go
- `docs/LEVEL_DESIGN.md` — level format and design rules
- `CLAUDE.md` — project guide for Claude Code
