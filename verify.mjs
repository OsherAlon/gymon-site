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

const posts = articles();
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
  }
  console.log(`  ${own.length} ${lang} article(s) checked`);
}

console.log(failed ? `\n${failed} problem(s)` : '\nAll pages OK');
process.exit(failed ? 1 : 0);
