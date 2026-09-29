#!/usr/bin/env node
/**
 * Checks that the served pages carry the app's legal text, complete and in
 * order, and that every URL answers 200.
 *
 *   node verify.mjs                  # the local docs/ folder
 *   node verify.mjs https://gymon.app
 *
 * The expected text is read from the same commit the pages were built from
 * (their `source-commit` meta), so a stale deploy shows up as a mismatch.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { privacyPolicy, termsOfService } from './src/documents.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(process.env.GYMON_REPO ?? join(ROOT, '..', 'gymon'));
const base = process.argv[2];

async function load(path) {
  if (!base) {
    const file = path === '/' ? 'index.html' : path.endsWith('/') ? `${path}index.html` : `${path}.html`;
    return { status: 200, html: readFileSync(join(ROOT, 'docs', file), 'utf8') };
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

console.log(failed ? `\n${failed} problem(s)` : '\nAll pages OK');
process.exit(failed ? 1 : 0);
