# Hosting a playable build on Cloudflare

Poki asks for a playable link before onboarding. We host the **Poki build** (`dist/poki`) so they see
the real SDK integration. Off poki.com the Poki SDK runs but serves no ads; if it's blocked the game
still plays (see `src/platform/poki.ts`).

The build is fully static, so either Cloudflare option below works. Both redeploy on every push to `main`.

## Option A: Workers (recommended, Cloudflare's current default)
1. Cloudflare dashboard → **Workers & Pages → Create → Import a repository** → pick `doodle-river`.
2. Build command: `npm run build:poki`
3. Deploy command: `npx wrangler deploy` (reads `wrangler.jsonc`, uploads `dist/poki`)
4. Deploy. The URL is `https://doodle-river.<your-subdomain>.workers.dev`.

## Option B: Pages
1. **Workers & Pages → Create → Pages → Connect to Git** → pick `doodle-river`.
2. Framework preset: None. Build command: `npm run build:poki`. Build output directory: `dist/poki`.
3. Deploy. The URL is `https://doodle-river.pages.dev`.

Node 22 is pinned by `.node-version` (Vite 7 needs Node 20.19+).

## Deploy from your machine instead
```
npm run build:poki
npx wrangler login
npx wrangler deploy
```

## Before sending the link to Poki
- Open it on desktop and on a phone; play through the first few levels.
- Check the console: `Poki SDK unavailable` is fine if you run an adblocker; nothing else should error.
