# Doodle River — how it makes money

## 1. Web portals: ads, shared with the portal

You never handle payments. The portal shows ads through its SDK and pays you part of the ad revenue.

| Portal | Model (check current terms before signing) |
|---|---|
| **Poki** | Ads only. 50/50 split on players Poki brings you; 100% on players who arrive from your own links, search or socials. Possible upfront/exclusive licensing deal for games they want to feature. |
| **CrazyGames** | Ad revenue share after "Full Launch" (unlocked by good playtime/retention in Basic Launch). Non-exclusive. Payout monthly once you pass €100. |
| **GameDistribution** | Ad revenue share from all the sites that embed your game. Non-exclusive. |
| **Your own site** | Google AdSense for Games (H5 Games Ads) or none. Small at first; mainly good for SEO and a link to share. |

Web earnings depend almost entirely on **traffic × playtime**. More levels, longer sessions and a game that
spreads by itself matter more than any ad trick.

## 2. Where ads appear (already wired in the code)

| Placement | Type | When | Config |
|---|---|---|---|
| Between levels | Interstitial (`commercialBreak`) | Before the next level starts, every 2nd win, never before level 3 | `INTERSTITIAL_EVERY`, `FIRST_AD_LEVEL` |
| "+50% INK" button | Rewarded (`rewardedBreak`) | Before drawing, from level 3, once per attempt | `BONUS_INK` |
| "SKIP LEVEL" button | Rewarded | After 2 fails in a row on the same level | `SKIP_AFTER_FAILS` |

Rewarded ads earn the most per view and players choose them, so they don't annoy anyone. Good rewarded ideas to add next:
- **Show the solution line** for a level (use the level's `solution`, drawn dashed like the level 1 tutorial)
- **Double coins** after a win
- **Unlock a skin for free** for one level

Rules the portals enforce, and the code follows:
- Never show an ad during active play. Stop gameplay, block input and mute audio during ads (`UI.withAd`, `Sfx.setAdMuted`).
- The game must keep working when an adblocker removes the SDK.
- Don't show too many ads in a row early on. First impressions decide retention.

## 3. Mobile (Google Play + App Store)

Same game, different money sources:

1. **AdMob ads**: interstitial + rewarded, the same placements as on web (adapter: `src/platform/mobile.ts`).
2. **In-app purchases** (add with RevenueCat):
   - **Remove ads**: one-time purchase. Remove interstitials only and keep the optional rewarded ads.
   - **River skin packs**: lava, chocolate, rainbow, galaxy water, neon riverbeds.
   - **Level packs**: "Desert", "Volcano", "Ice World", 20 levels each.
   - **Hint bundle**: a pack of solution reveals.
3. Optional later: a weekly **"Daily River"** challenge with a leaderboard to bring players back every day.

## 4. The coins and skins loop (build this next)

Stars → coins → unlock river colours and brush styles in a small shop.
It costs no money to run, works on web and mobile, gives players a goal beyond "next level", and later
gives you something to sell as an IAP and to offer for rewarded ads ("watch to double coins").

## 5. Other income

- **Sell or license the game**: some HTML5 publishers buy finished games or license them for a fee.
- **Sponsorship**: a brand could pay to have its logo on the loading screen of a web build.
- **Cross-promotion**: link your other games/apps from the menu once you have more than one.

## Rough expectations

Most portal games earn little; a hit earns a lot. Results vary hugely with traffic, country mix and playtime,
so don't plan around a number. Use the first month of portal stats to decide how much to invest in mobile.
