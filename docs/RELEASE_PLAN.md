# Doodle River — release plan

Order: **polish → web portals → mobile stores**. The web launch is free and fast, and portal stats
(playtime, retention) tell you whether the game is worth the extra mobile work.

Portal terms change often. Re-check each portal's developer docs before you submit.

---

## Phase 0 — Make it ready (2–4 weeks)

- [ ] **Content:** 40+ levels (portals reward long sessions). Add 2–3 new mechanics from `docs/LEVEL_DESIGN.md`.
      *Now 30 levels; wind zones (16-22) and pipes (23-30) added. 10+ more to go.*
- [ ] **Playtest:** watch 5–10 people play on phone and laptop without helping them. Note where they get stuck or quit.
- [ ] **Art and sound:** replace synth beeps with real SFX (water splash, bloom, win jingle) and add one music loop.
      Use only assets you made or licensed for commercial use.
- [ ] **Coins and skins** (see MONETIZATION.md): rewards stars with coins and unlocks river colours. It is the main long-term hook.
- [x] **Store art:** icon, adaptive icon, splash, Play feature graphic and portal covers are in `art/store/` and `assets/`
      (`npm run art` re-renders them from `art/art.html`).
- [ ] **Store video and screenshots:** a 15–30 s gameplay video, 4–6 screenshots in portrait (record a real phone).
- [ ] **Website:** a one-page site (e.g. doodleriver.com or a page on your existing sites) with a **privacy policy**.
      The stores and AdMob require a privacy policy URL, and AdMob requires an `app-ads.txt` file on that site.
      A ready policy is in `docs/privacy.html`: fill in your email, then on GitHub go to Settings → Pages →
      "Deploy from a branch", `main`, folder `/docs`. It's then at `https://i-am-sarath.github.io/doodle-river/privacy.html`
      (free GitHub Pages needs a public repo; otherwise use any static host).
- [ ] `npm run check-levels`, `npm run typecheck`, then test every build target once.

## Phase 1 — Poki (submit first)

Poki is the biggest portal but selective, so try it first.
1. Create a developer account on Poki for Developers and read the SDK docs (sdk.poki.com).
2. `npm run build:poki`, then zip the **contents** of `dist/poki`.
3. Checklist for their review:
   - Initial download under 8 MB (this game is tiny, but watch music file sizes)
   - Fills the canvas on desktop, mobile and tablet. The game already does this; test at 640x360 and 1031x580.
   - Works in incognito mode and with an adblocker (SDK missing must not break the game)
   - Only Poki's SDK for ads; no other ads or trackers
   - `gameplayStart`/`gameplayStop` fire correctly (the adapter does this)
4. Poki tests the game with real players. If metrics are good they launch it, and they may offer an
   **exclusive deal** (they pay you, the game stays web-exclusive to them). **Do not upload to other portals
   until you hear back**, so that option stays open.

## Phase 2 — Other web portals

If Poki declines, or after you agree on terms that allow other portals:

| Portal | How | Notes |
|---|---|---|
| **CrazyGames** | Developer portal upload, `npm run build:crazygames` | Starts as a "Basic Launch" (no ads) for about two weeks. Good playtime/retention unlocks Full Launch with SDK ads. No exclusivity. Content must suit ages 13+. |
| **GameDistribution** | Upload in their dashboard, put your game ID in `.env.gamedistribution`, `npm run build:gd` | Syndicates your game to thousands of sites. Non-exclusive. |
| **Coolmath Games** | Apply through their developer/submission page | Curated, family-friendly logic games. A physics drawing puzzle fits well. They may want their own build tweaks. |
| **itch.io / your site** | `npm run build:web` | Good for early feedback and a demo link. Doesn't pay much. |

Upload builds one at a time and keep a simple spreadsheet: portal, date, build version, status, earnings.

## Phase 3 — Android (Google Play)

1. The `android/` project is already in the repo (Capacitor 8, targetSdk 36 as Google Play requires since 31 Aug 2026,
   portrait lock, icons and splash). Open it with:
   ```bash
   npm run build:mobile
   npx cap open android
   ```
2. **AdMob:** create an AdMob account, add the app (Android), create one interstitial and one rewarded unit.
   - Put the unit IDs in `.env.mobile` and set `VITE_ADMOB_TESTING=false` **only for the release build**.
   - Put your AdMob **App ID** in `android/app/src/main/res/values/strings.xml` (`admob_app_id`).
     It currently holds Google's test App ID; the manifest entry is already there.
   - Never click your own real ads; use test IDs during development.
3. ~~Portrait lock, icon and splash~~ done. To regenerate icons after changing the art:
   `npm run art && npx capacitor-assets generate --android --ios --iconBackgroundColor '#5cc4f5' --splashBackgroundColor '#7fd6ff'`.
   Bump `versionCode` in `android/app/build.gradle` for every upload.
4. Build a signed **AAB** in Android Studio (Build → Generate Signed Bundle). Back up the keystore. Losing it means you can't update the app.
5. **Play Console:** a personal developer account created after 13 Nov 2023 must run a **closed test with at least 12 testers
   opted in for 14 days in a row** before it can apply for production. Recruit friends/family early.
6. Fill in the store listing, content rating questionnaire, **Data safety** form (AdMob collects device data and ad IDs),
   and target audience. If you target children under 13, Google's Families policy applies and ads must be
   child-directed. Targeting 13+ is simpler.
7. After the 14 days, apply for production and release.

## Phase 4 — iOS (App Store)

You already have an Apple Developer account (individual), so this is the faster store.
1. The `ios/` project is already in the repo (Swift Package Manager, no CocoaPods needed). On your Mac:
   ```bash
   npm install
   npm run build:mobile
   npx cap open ios
   ```
2. `ios/App/App/Info.plist` already has `GADApplicationIdentifier` (Google's **test** ID: replace it with your
   AdMob iOS App ID), `NSUserTrackingUsageDescription`, `ITSAppUsesNonExemptEncryption = false` and Google's own
   SKAdNetwork ID. Add the rest of the `SKAdNetworkItems` list from Google's AdMob iOS docs.
3. Portrait, icon and launch screen are done. In Xcode pick your Team under Signing, then Product → Archive → upload.
4. App Store Connect: screenshots (6.7" and 6.5" iPhone, plus iPad if you support it), privacy "nutrition label"
   (AdMob: identifiers, usage data, ads), age rating, privacy policy URL.
5. Submit for review. TestFlight first is a good idea.

## Phase 5 — After launch (ongoing)

- Ship a level pack every 2–4 weeks; portals and stores reward updated games.
- Watch: average playtime, % of players who finish level 1, where players drop off, ad revenue per daily user.
- Add an in-app purchase on mobile ("Remove ads", river skin packs). RevenueCat is the easiest way to do purchases on both stores.
- Translate the hint text (Spanish, Portuguese, Hindi, Indonesian are big web-game markets).
