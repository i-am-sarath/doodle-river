// Renders art/art.html into every PNG the stores and portals ask for.  Run: npm run art
// Needs Playwright's Chromium (npx playwright install chromium) the first time.
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const page = pathToFileURL(resolve(here, 'art.html')).href;

const jobs = [
  // Capacitor source images: `npx @capacitor/assets generate` turns these into every native icon/splash size
  ['../assets/icon-only.png', 'icon', 1024, 1024],
  ['../assets/icon-foreground.png', 'icon-fg', 1024, 1024, true],
  ['../assets/icon-background.png', 'icon-bg', 1024, 1024],
  ['../assets/splash.png', 'splash', 2732, 2732],
  ['../assets/splash-dark.png', 'splash', 2732, 2732],
  // Store listings
  ['store/play-icon-512.png', 'icon', 512, 512],
  ['store/play-feature-1024x500.png', 'feature', 1024, 500],
  // Portal thumbnails (check each portal's current spec when uploading)
  ['store/cover-1920x1080.png', 'cover', 1920, 1080],
  ['store/cover-800x470.png', 'cover', 800, 470],
  ['store/cover-512x512.png', 'square', 512, 512],
  ['store/cover-1080x1920.png', 'cover', 1080, 1920],
];

const browser = await chromium.launch();
for (const [out, kind, w, h, transparent] of jobs) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  await p.goto(`${page}?kind=${kind}&w=${w}&h=${h}`);
  await p.waitForSelector('body[data-ready]');
  const file = resolve(here, out);
  mkdirSync(dirname(file), { recursive: true });
  await p.locator('#c').screenshot({ path: file, omitBackground: !!transparent });
  await p.close();
  console.log('wrote', out);
}
await browser.close();
