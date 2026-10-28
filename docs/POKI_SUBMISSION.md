# Doodle River: Poki submission fact sheet

Everything needed to fill in the Poki for Developers submission form. Copy fields as written.
Anything marked **[OWNER]** must come from the developer; don't guess it.

---

## Agent instructions

- Use only the facts on this page. If the form asks something not covered here, stop and ask the owner.
- Never tick a box claiming the game is already live elsewhere. It isn't live anywhere yet.
- Upload `doodle-river-poki.zip` (built from `dist/poki`, `index.html` at the zip root).
- Don't accept a deal, exclusivity term or payment details. Those are for the owner.

---

## Basics

| Field | Value |
|---|---|
| Game title | Doodle River |
| Developer / studio name | **[OWNER]** (e.g. Sarath Ramesh) |
| Contact email | **[OWNER]** |
| Country | **[OWNER]** |
| Genre | Puzzle |
| Sub-genre / style | Physics puzzle, drawing puzzle, casual |
| Tags | puzzle, physics, drawing, line, water, brain, logic, casual, mobile, kids-friendly |
| Engine / tech | Custom HTML5 (TypeScript + Canvas 2D), built with Vite. No game engine. |
| Version | 1.0.0 |
| Languages | English |
| Release status | Unreleased. Not published on any other web portal or website. |
| Other platforms | Android (Google Play) and iOS (App Store) versions planned |
| Monetisation | Poki SDK ads only (interstitials + rewarded). No in-game purchases, no other ad networks. |
| Target audience | Everyone / all ages. No violence, no text chat, no user accounts, no personal data collected. |

## Short description (1 sentence)

Draw a riverbed and guide the water into the dry pond in this relaxing physics puzzle.

## Description

Doodle River is a physics drawing puzzle. A spring bubbles at the top of the screen and a dry pond waits below.
Draw a single riverbed with your finger or mouse, and the water flows along it. Bend it around rocks,
carry it over walls and keep it away from lava until the pond is full.

Every level has three stars: fill the pond, make every flower bloom on the way, and use as little dirt as you can.
Over 30 levels the puzzles add moving rocks, levels where you keep drawing while the river flows,
gusts of wind that push the water off course, and pipes that send it across the map.

- 30 hand-made levels
- Real water physics: every drop flows, splashes and settles
- One line, many solutions: find the clever one for 3 stars
- Quick levels that play in seconds
- Works on phone, tablet and desktop

## How to play / controls

| | |
|---|---|
| Mouse (desktop) | Hold the left button and drag to draw the riverbed. Release to start the water. |
| Touch (mobile/tablet) | Drag a finger to draw. Lift to start the water. |
| Keyboard | `R` restart level · `Esc` back / level select |

Instruction text: *Draw a line from the spring to the pond. Release to let the water flow. Fill the pond to win.
Bloom every flower and use less dirt for 3 stars.*

## Technical details

| Field | Value |
|---|---|
| Orientation | Portrait gameplay. Works in any window: the canvas fills the full screen, and on wide/16:9 screens the playfield is centred with scenery filling the sides. |
| Desktop support | Yes (mouse) |
| Mobile support | Yes (touch), phones and tablets |
| Initial download size | 317 KB zipped, ~404 KB unzipped (28 files, all bundled locally, fonts included) |
| External requests | Only the Poki SDK (`https://game-cdn.poki.com/scripts/v2/poki-sdk.js`). No other network calls, trackers or analytics. |
| Save data | `localStorage` only (level progress, stars, sound setting). Fails silently if storage is blocked. |
| Works without the SDK | Yes. With an adblocker the game runs normally, just without ads. |
| Audio | Generated sound effects (Web Audio). Muted while ads play and when the tab is hidden; sound toggle on the title screen. |
| Loading | No loading screen needed; playable in under a second. |

## Poki SDK integration

| SDK call | When |
|---|---|
| `PokiSDK.init()` | On startup |
| `gameLoadingFinished()` | Once fonts are ready and the title screen shows |
| `gameplayStart()` | When a level starts (and when returning to a level from a menu) |
| `gameplayStop()` | On win/lose screens, opening the level menu, and before any ad |
| `commercialBreak()` | Before starting the next level, after every 2nd win, never before level 3 |
| `rewardedBreak()` | Player-chosen only: "+50% INK" button (from level 3) and "SKIP LEVEL" after 2 fails in a row |

Input is blocked and audio is muted for the whole duration of every ad. Levels 1-2 never show ads.

## Assets

| Asset | File |
|---|---|
| Game build (upload) | `doodle-river-poki.zip` (create with `npm run build:poki`, then zip the **contents** of `dist/poki`) |
| Thumbnail, landscape 1920 x 1080 | `art/store/cover-1920x1080.png` |
| Thumbnail, landscape 800 x 470 | `art/store/cover-800x470.png` |
| Thumbnail, square 512 x 512 | `art/store/cover-512x512.png` |
| Thumbnail, portrait 1080 x 1920 | `art/store/cover-1080x1920.png` |
| Icon 512 x 512 | `art/store/play-icon-512.png` |

If the form asks for a size not listed here, ask the owner. `npm run art` can render new sizes from `art/art.html`.

## Rights

All code, art and sound are original work owned by the developer. The fonts (Lilita One, Nunito) are licensed
under the SIL Open Font License, which allows commercial use. No third-party characters, music or brands.
