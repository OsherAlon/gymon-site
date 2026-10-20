// @ts-check
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { BLOG_PUBLIC } from './src/copy.mjs';

const SITE = 'https://gymon.app';
const OUT = fileURLToPath(new URL('./docs/', import.meta.url));

/** The built file for a site URL (format 'preserve'): / → index.html, /blog/ → blog/index.html, /privacy → privacy.html. */
/** @param {string} url */
function builtFile(url) {
  let path = decodeURIComponent(new URL(url).pathname).replace(/^\//, '');
  if (path.endsWith('.html')) return OUT + path;
  if (path === '' || path.endsWith('/')) return OUT + path + 'index.html';
  // `/he` is the directory `he/index.html`; `/privacy` is the file `privacy.html`.
  return existsSync(OUT + path + '.html') ? OUT + path + '.html' : OUT + path + '/index.html';
}

/**
 * The public URL exactly as the page's own canonical: extensionless files
 * (Pages serves privacy.html at /privacy) and a trailing slash on directories
 * (/he/, /blog/).
 */
/** @param {string} url */
function clean(url) {
  const u = new URL(url.replace(/\.html$/, '').replace(/\/index$/, '/'));
  if (!u.pathname.endsWith('/') && builtFile(u.href).endsWith('/index.html')) u.pathname += '/';
  return u.href;
}

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
 *
 * Sitemap (`docs/sitemap-index.xml` + `sitemap-0.xml`, plus `public/sitemap.xml`
 * pointing at them for the robots.txt line): every built page except 404 and any
 * page carrying `<meta name="robots" content="noindex">` (mock/preview articles,
 * and the blog indexes while they only list mocks) — decided from the built HTML
 * itself, so the sitemap can never disagree with the page. en/he alternates +
 * x-default → English, like the pages' own hreflang links.
 */
/**
 * Blog gate (BLOG_PUBLIC in src/copy.mjs). With the blog off, the article routes emit nothing
 * (their getStaticPaths return []), but two things still land in docs/blog/ and docs/he/blog/:
 * the static index pages (src/pages/blog/index.astro has no getStaticPaths to return [] from)
 * and public/blog/ (hero background, mock images — public/ is copied as-is), plus the index's
 * island chunk in _astro/. This removes them after the build. It runs before @astrojs/sitemap, whose filter skips missing files.
 */
/** @returns {import('astro').AstroIntegration} */
function blogGate() {
  return {
    name: 'gymon-blog-gate',
    hooks: {
      'astro:build:done': ({ logger }) => {
        if (BLOG_PUBLIC) return;
        for (const dir of ['blog', 'he/blog']) rmSync(OUT + dir, { recursive: true, force: true });
        // The blog index's React island chunk is referenced only by the removed index pages.
        for (const f of readdirSync(OUT + '_astro')) if (f.startsWith('blog-section.')) rmSync(OUT + '_astro/' + f);
        logger.info('BLOG_PUBLIC is false: removed docs/blog/, docs/he/blog/ and the blog-section chunk');
      },
    },
  };
}

export default defineConfig({
  site: SITE,
  outDir: './docs',
  trailingSlash: 'ignore',
  compressHTML: false,
  // Smart quotes would turn "..." into English curly quotes inside Hebrew articles.
  markdown: { smartypants: false },
  build: { format: 'preserve' },
  integrations: [
    react(),
    blogGate(),
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', he: 'he' } },
      filter: (page) => {
        if (/\/404(\.html)?$/.test(page)) return false;
        const file = builtFile(page);
        if (!existsSync(file)) return false;
        return !/<meta name="robots" content="noindex">/.test(readFileSync(file, 'utf8'));
      },
      serialize: (item) => {
        item.url = clean(item.url);
        const links = (item.links ?? []).map((l) => ({ ...l, url: clean(l.url) }));
        const en = links.find((l) => l.lang === 'en');
        if (links.length > 1 && en) links.push({ lang: 'x-default', url: en.url });
        item.links = links;
        return item;
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
