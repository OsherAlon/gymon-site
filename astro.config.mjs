// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

/**
 * 🔴 Output shape is load-bearing — App Store Connect points at these URLs.
 *
 * - `outDir: ./docs` — GitHub Pages serves `docs/` on `main`; no Pages setting changes.
 * - `format: 'preserve'` — `src/pages/privacy.astro` → `docs/privacy.html` (served
 *   by Pages at `/privacy`, exactly as the old hand-rolled build did) and
 *   `src/pages/he/index.astro` → `docs/he/index.html` (served at `/he/`).
 *   `'directory'` would emit `privacy/index.html` and make `/privacy` a 301 to
 *   `/privacy/`; `'file'` would emit `he.html`.
 * - `compressHTML: false` — keeps the served HTML as close as possible to the
 *   previous output (whitespace between inline elements is part of the text).
 */
export default defineConfig({
  site: 'https://gymon.app',
  outDir: './docs',
  trailingSlash: 'ignore',
  compressHTML: false,
  // Smart quotes would turn "..." into English curly quotes inside Hebrew articles.
  markdown: { smartypants: false },
  build: { format: 'preserve' },
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
