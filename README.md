# Doodle River

Draw the riverbed. Guide the water. Fill the pond.

A physics drawing puzzle for web portals and mobile, built with TypeScript + Vite (no game engine) and wrapped for Android/iOS with Capacitor.

## Quick start
```bash
npm install
npm run dev            # open the printed URL (also works on your phone over Wi-Fi)
npm run check-levels   # verifies all 30 levels are winnable and none plays itself
```

## Builds
| Target | Command | Output | Ads |
|---|---|---|---|
| Your own site / itch.io | `npm run build:web` | `dist/web` | fake placeholder (swap for AdSense for Games) |
| Poki | `npm run build:poki` | `dist/poki` | Poki SDK |
| CrazyGames | `npm run build:crazygames` | `dist/crazygames` | CrazyGames SDK v3 |
| GameDistribution | `npm run build:gd` | `dist/gamedistribution` | GD SDK (set `VITE_GD_GAME_ID` in `.env.gamedistribution`) |
| GameBooth | `npm run build:gamebooth` | `dist/gamebooth` | GameBooth site (postMessage to the parent page) |
| Android / iOS | `npm run build:mobile` | `android/`, `ios/` | AdMob (test IDs in `.env.mobile`) |

Zip the contents of a `dist/<target>` folder (not the folder itself) to upload to a portal.

### Mobile
The `android/` and `ios/` projects are in the repo (Capacitor 8). After any game change:
```bash
npm run build:mobile   # builds dist/mobile and copies it into both native projects
npx cap open android   # or: npx cap open ios   (Mac + Xcode)
```
Before release, replace Google's **test** AdMob IDs: unit IDs in `.env.mobile`, App IDs in
`android/app/src/main/res/values/strings.xml` and `ios/App/App/Info.plist` (see `docs/RELEASE_PLAN.md`).

### Art
`npm run art` renders the icon, splash and store/portal images from `art/art.html` into `assets/` and `art/store/`.
Then `npx capacitor-assets generate --android --ios` turns `assets/` into every native icon/splash size.

## Docs
- `docs/RELEASE_PLAN.md` — step-by-step release plan for portals and stores
- `docs/MONETIZATION.md` — how the game makes money and where ads go
- `docs/LEVEL_DESIGN.md` — level format and design rules
- `docs/privacy.html` — privacy policy for the store listings (host it; see RELEASE_PLAN)
- `CLAUDE.md` — project guide for Claude Code
