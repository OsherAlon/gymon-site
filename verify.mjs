#!/usr/bin/env node
/**
 * Checks that the served pages carry the app's legal text, complete and in
 * order, that every URL answers 200, and that every blog article is served in
 * its language with its text in the HTML.
 *
 *   node verify.mjs                       # the local docs/ folder
 *   node verify.mjs http://localhost:4391 # after `npm run serve`
 *   node verify.mjs https://gymon.app
 *
 * The expected text is read from the same commit the pages were built from
 * (their `source-commit` meta), so a stale deploy shows up as a mismatch.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { privacyPolicy, termsOfService } from './src/documents.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(process.env.GYMON_REPO ?? join(ROOT, '..', 'gymon'));
const base = process.argv[2];

async function load(path) {
  if (!base) {
    const file = path === '/' ? 'index.html' : path.endsWith('/') ? `${path}index.html` : `${path}.html`;
    const full = join(ROOT, 'docs', file);
    return existsSync(full) ? { status: 200, html: readFileSync(full, 'utf8') } : { status: 404, html: '' };
  }
  const res = await fetch(base + path, { redirect: 'manual' });
  return { status: res.status, html: await res.text() };
}

const text = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<\/?(a|b)\b[^>]*>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
const norm = (s) => s.replace(/\s+/g, ' ').trim();

function expected(json, spec) {
  const out = [json.pageTitle, json.lastUpdated];
  const push = (s) => out.push(...String(s).split(/\n+/));
  for (const { section, blocks } of spec) {
    const sec = json.sections[section];
    out.push(sec.title);
    for (const b of blocks) {
      if (b.p) push(sec[b.p]);
      if (b.strong) push(sec[b.strong]);
      if (b.list) b.list.forEach((k) => push(sec[k]));
      if (b.sub) push(sec[b.sub].title), push(sec[b.sub].body);
    }
  }
  return out.map(norm).filter(Boolean);
}

let failed = 0;
const fail = (msg) => {
  failed++;
  console.log(`  ✗ ${msg}`);
};

const pages = ['/', '/privacy', '/terms', '/support', '/he/', '/he/privacy', '/he/terms', '/he/support'];
for (const path of pages) {
  const { status, html } = await load(path);
  const commit = html.match(/name="source-commit" content="(\w+)"/)?.[1];
  console.log(`${status} ${path}  (source ${commit})`);
  if (status !== 200) fail(`status ${status}`);

  const doc = path.endsWith('privacy') ? ['privacyPolicy', privacyPolicy] : path.endsWith('terms') ? ['termsOfService', termsOfService] : null;
  if (!doc) continue;
  const lang = path.startsWith('/he') ? 'he' : 'en';
  const json = JSON.parse(
    execFileSync('git', ['-C', REPO, 'show', `${commit}:app/src/locales/${lang}/${doc[0]}.json`], { encoding: 'utf8' }),
  );
  const body = text(html);
  let at = 0;
  const strings = expected(json, doc[1]);
  for (const s of strings) {
    const i = body.indexOf(s, at);
    if (i === -1) {
      fail(`missing or out of order: "${s.slice(0, 70)}…"`);
      continue;
    }
    at = i + s.length;
  }
  console.log(`  ${strings.length} strings checked in order`);
}

// ------------------------------------------------------------------ home ---

for (const [path, href] of [['/', '/blog/'], ['/he/', '/he/blog/']]) {
  const { html } = await load(path);
  if (!html.includes(`href="${href}"`)) fail(`${path} has no link to ${href}`);
}

// ----------------------------------------------------------------- hosting --

if (!base) {
  const cnameFile = join(ROOT, 'docs', 'CNAME');
  const cname = existsSync(cnameFile) ? readFileSync(cnameFile, 'utf8').trim() : '';
  console.log(`CNAME ${cname || 'MISSING'}`);
  if (cname !== 'gymon.app') fail('docs/CNAME must hold gymon.app');
  // Without it, Pages runs Jekyll, which drops the `_astro/` folder (leading underscore).
  if (!existsSync(join(ROOT, 'docs', '.nojekyll'))) fail('docs/.nojekyll is missing');
  if (!existsSync(join(ROOT, 'docs', '404.html'))) fail('docs/404.html is missing');
} else {
  const res = await fetch(`${base}/no-such-page-${Date.now()}`, { redirect: 'manual' });
  console.log(`${res.status} /no-such-page (expect 404)`);
  if (res.status !== 404) fail('unknown paths must answer 404');
}

// -------------------------------------------------------------------- blog --

/** Every non-draft article under src/content/blog, read from its frontmatter. */
function articles(dir = join(ROOT, 'src', 'content', 'blog')) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return articles(full);
    if (!name.endsWith('.md')) return [];
    const fm = readFileSync(full, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    const field = (k) =>
      fm
        .match(new RegExp(`^${k}:\\s*(.*)$`, 'm'))?.[1]
        ?.trim()
        .replace(/^(["'])(.*)\1$/, '$2')
        .replace(/\\"/g, '"');
    if (field('draft') === 'true') return [];
    return [{ lang: field('lang'), slug: field('slug'), title: field('title') }];
  });
}

/** Every JSON (doctrine) article under src/content/articles. */
function docArticles(dir = join(ROOT, 'src', 'content', 'articles')) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return docArticles(full);
    if (!name.endsWith('.json')) return [];
    const a = JSON.parse(readFileSync(full, 'utf8'));
    return [{ lang: a.lang, slug: a.slug, title: a.title, doc: a }];
  });
}

const docs = docArticles();
const posts = [...docs, ...articles().filter((p) => !docs.some((d) => d.slug === p.slug && d.lang === p.lang))];
for (const lang of ['en', 'he']) {
  const prefix = lang === 'en' ? '' : '/he';
  const index = `${prefix}/blog/`;
  const { status, html } = await load(index);
  console.log(`${status} ${index}`);
  if (status !== 200) fail(`status ${status}`);
  const own = posts.filter((p) => p.lang === lang);
  for (const post of own) {
    if (!text(html).includes(post.title)) fail(`${index} does not list "${post.title}"`);
    const path = `${prefix}/blog/${post.slug}`;
    const page = await load(path);
    const tag = page.html.match(/<html lang="(\w+)" dir="(\w+)"/);
    const okLang = tag?.[1] === lang && tag?.[2] === (lang === 'he' ? 'rtl' : 'ltr');
    const okText = text(page.html).includes(post.title);
    console.log(`${page.status} ${path}${okLang ? '' : '  (wrong lang/dir)'}${okText ? '' : '  (title not in HTML)'}`);
    if (page.status !== 200) fail(`status ${page.status}`);
    if (!okLang) fail(`${path}: <html> must be lang="${lang}" dir="${lang === 'he' ? 'rtl' : 'ltr'}"`);
    if (!okText) fail(`${path}: the title is not in the served HTML`);
    if (post.doc) {
      // Doctrine template: answer first, always visible, structured data present.
      const body = text(page.html);
      const plain = (t) => t.replace(/\[\[[^\]]+\]\]/g, '').replace(/\*\*/g, '').replace(/\s+([.,;:])/g, '$1').replace(/\s+/g, ' ').trim();
      if (!body.includes(plain(post.doc.tldr).slice(0, 60))) fail(`${path}: the bottom line is not in the HTML`);
      if (/opacity:\s*0[;"]/.test(page.html.split('<article')[1] ?? '')) fail(`${path}: article content ships at opacity:0`);
      if (!/"@type":"BlogPosting"/.test(page.html)) fail(`${path}: no BlogPosting JSON-LD`);
      if (!/property="og:image"/.test(page.html)) fail(`${path}: no og:image`);
      if (!/id="sources"/.test(page.html)) fail(`${path}: no sources list`);
      if (post.doc.sample && !/<meta name="robots" content="noindex">/.test(page.html)) fail(`${path}: a sample article must be noindex`);
      if (lang === 'he' && /\d\s*[–×]\s*\d/.test(body.replace(/<[^>]+>/g, ''))) {
        // Allowed only inside an LTR isolate.
        const bare = page.html.replace(/<span dir="ltr">[^<]*<\/span>/g, '').replace(/<bdi[\s\S]*?<\/bdi>/g, '').replace(/<(script|blockquote)[\s\S]*?<\/\1>/g, '');
        if (/\d\s*[–×]\s*\d/.test(text(bare))) fail(`${path}: a number range with – or × outside an LTR isolate`);
      }
    }
  }
  console.log(`  ${own.length} ${lang} article(s) checked`);
}

// ------------------------------------------------- robots.txt and sitemap --

async function loadFile(path) {
  if (!base) {
    const full = join(ROOT, 'docs', path);
    return existsSync(full) ? readFileSync(full, 'utf8') : null;
  }
  const res = await fetch(`${base}/${path}`, { redirect: 'manual' });
  return res.status === 200 ? res.text() : null;
}

const robots = await loadFile('robots.txt');
console.log(`robots.txt ${robots ? 'present' : 'MISSING'}`);
if (!robots) fail('robots.txt is missing');
else {
  if (!/^User-agent: \*$/m.test(robots) || !/^Allow: \/$/m.test(robots)) fail('robots.txt must allow all crawlers');
  if (!/^Sitemap: https:\/\/gymon\.app\/sitemap\.xml$/m.test(robots)) fail('robots.txt must name https://gymon.app/sitemap.xml');
  if (/^Disallow: \/\s*$/m.test(robots)) fail('robots.txt disallows the whole site');
}

const index = await loadFile('sitemap.xml');
const chunks = index ? [...index.matchAll(/<loc>https:\/\/gymon\.app\/([^<]+)<\/loc>/g)].map((m) => m[1]) : [];
console.log(`sitemap.xml ${index ? `→ ${chunks.join(', ')}` : 'MISSING'}`);
if (!index || !chunks.length) fail('sitemap.xml is missing or lists no sitemaps');

/** Built file (format 'preserve') for a public path: / → index.html, /blog/ → blog/index.html, /privacy → privacy.html. */
const fileFor = (p) => (p === '' || p.endsWith('/') ? `${p}index.html` : `${p}.html`);
const listed = new Set();
for (const chunk of chunks) {
  const xml = await loadFile(chunk);
  if (!xml) {
    fail(`${chunk} is missing`);
    continue;
  }
  const locs = [...xml.matchAll(/<loc>https:\/\/gymon\.app\/([^<]*)<\/loc>/g)].map((m) => decodeURIComponent(m[1]));
  const alts = [...xml.matchAll(/hreflang="[^"]+" href="https:\/\/gymon\.app\/([^"]*)"/g)].map((m) => decodeURIComponent(m[1]));
  for (const p of [...locs, ...alts]) {
    if (p.endsWith('.html')) fail(`sitemap URL has an extension: /${p}`);
    if (/(^|\/)404$/.test(p)) fail('the 404 page is in the sitemap');
    const html = await loadFile(fileFor(p));
    if (html === null) fail(`sitemap URL does not exist: /${p}`);
    else if (/<meta name="robots" content="noindex">/.test(html)) fail(`noindex page in the sitemap: /${p}`);
  }
  locs.forEach((p) => listed.add(p));
  if (!/hreflang="x-default"/.test(xml)) fail(`${chunk} has no x-default alternates`);
}
console.log(`  ${listed.size} URL(s) in the sitemap, none noindex`);

// Every indexable built page must be listed (local check only).
if (!base) {
  const walk = (dir, rel = '') =>
    readdirSync(dir).flatMap((n) => {
      const full = join(dir, n);
      if (statSync(full).isDirectory()) return n.startsWith('_') ? [] : walk(full, `${rel}${n}/`);
      return n.endsWith('.html') ? [`${rel}${n}`] : [];
    });
  for (const file of walk(join(ROOT, 'docs'))) {
    if (file === '404.html') continue;
    if (/<meta name="robots" content="noindex">/.test(readFileSync(join(ROOT, 'docs', file), 'utf8'))) continue;
    const p = file.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
    if (!listed.has(p)) fail(`indexable page missing from the sitemap: /${p}`);
  }
}

console.log(failed ? `\n${failed} problem(s)` : '\nAll pages OK');
process.exit(failed ? 1 : 0);
