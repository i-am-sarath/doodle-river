import { defineConfig } from 'vite';

// One codebase, one build per destination.
// `vite build --mode poki` reads .env.poki and writes to dist/poki, and so on.
export default defineConfig(({ mode }) => ({
  base: './', // relative paths: portals host the game in a sub-folder / iframe
  build: {
    outDir: `dist/${mode === 'production' ? 'web' : mode}`,
    emptyOutDir: true,
    assetsInlineLimit: 0,
    target: 'es2019', // old Android WebViews + school Chromebooks (Coolmath)
  },
  server: { host: true }, // lets you open the dev server on your phone over Wi-Fi
}));
