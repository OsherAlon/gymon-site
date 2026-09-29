#!/usr/bin/env node
/**
 * Builds the static site into `docs/` (what GitHub Pages serves).
 *
 * 🔴 The legal text is READ FROM THE APP, never copied: the four JSON files
 * are taken with `git show <ref>:app/src/locales/...` from the gymon repo, so
 * what is published is exactly what a given commit ships. Default ref: `main`.
 *
 *   node build.mjs                          # ../gymon, ref main
 *   GYMON_REPO=/path/to/gymon GYMON_REF=abc123 node build.mjs
 *
 * Every text is in the HTML itself — no JS renders content — because App Store
 * reviewers and crawlers read the served HTML.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { copy, SUPPORT_EMAIL, APPLE_SUBSCRIPTIONS_URL } from './src/copy.mjs';
import { privacyPolicy, termsOfService } from './src/documents.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'docs');
const REPO = resolve(process.env.GYMON_REPO ?? join(ROOT, '..', 'gymon'));
const REF = process.env.GYMON_REF ?? 'main';
const DOMAIN = 'gymon.app';
const LANGS = ['en', 'he'];

// ---------------------------------------------------------------- source ---

const git = (...args) => execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8' });
const COMMIT = git('rev-parse', '--short', `${REF}^{commit}`).trim();
const readJson = (lang, ns) => JSON.parse(git('show', `${COMMIT}:app/src/locales/${lang}/${ns}.json`));

const source = Object.fromEntries(
  LANGS.map((lang) => [
    lang,
    {
      privacyPolicy: readJson(lang, 'privacyPolicy'),
      termsOfService: readJson(lang, 'termsOfService'),
      home: readJson(lang, 'home'),
    },
  ]),
);

function get(obj, path) {
  const value = path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  if (value === undefined) throw new Error(`Missing key: ${path}`);
  return value;
}

function leafPaths(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? leafPaths(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

// ---------------------------------------------------------------- html -----

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Escapes, then turns bare emails and https URLs into links. Text unchanged. */
function rich(s) {
  return esc(s)
    .replace(/https:\/\/[^\s<]+[^\s<.,;:)"]/g, (u) => `<a href="${u}">${u}</a>`)
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+[a-z]/gi, (m) => `<a href="mailto:${m}">${m}</a>`);
}

/** A source string may hold `\n` — one paragraph per line, as the app shows it. */
const paragraphs = (s, cls = '') =>
  String(s)
    .split(/\n+/)
    .map((line) => `<p${cls ? ` class="${cls}"` : ''}>${rich(line)}</p>`)
    .join('\n');

/** Renders a document spec, and returns the key paths it used. */
function renderDocument(json, spec) {
  const used = new Set(['pageTitle', 'lastUpdated']);
  const take = (path) => {
    used.add(path);
    return get(json, path);
  };

  const html = spec
    .map(({ section, blocks }) => {
      const base = `sections.${section}`;
      const body = blocks
        .map((b) => {
          if (b.p) return paragraphs(take(`${base}.${b.p}`));
          if (b.strong) return paragraphs(take(`${base}.${b.strong}`), 'emph');
          if (b.list)
            return `<ul>\n${b.list.map((k) => `<li>${rich(take(`${base}.${k}`))}</li>`).join('\n')}\n</ul>`;
          if (b.sub)
            return `<div class="sub">\n<h3>${esc(take(`${base}.${b.sub}.title`))}</h3>\n${paragraphs(
              take(`${base}.${b.sub}.body`),
            )}\n</div>`;
          throw new Error(`Unknown block in ${section}: ${JSON.stringify(b)}`);
        })
        .join('\n');
      return `<section id="${section}">\n<h2>${esc(take(`${base}.title`))}</h2>\n${body}\n</section>`;
    })
    .join('\n\n');

  return { html, used };
}

/** Fails the build on any key rendered-but-absent or present-but-unrendered. */
function assertCoverage(name, lang, json, used) {
  const all = leafPaths(json);
  const unrendered = all.filter((p) => !used.has(p));
  const missing = [...used].filter((p) => !all.includes(p));
  if (unrendered.length || missing.length) {
    throw new Error(
      `${name} (${lang}) is out of sync with src/documents.mjs.\n` +
        (unrendered.length ? `  In the JSON but not rendered: ${unrendered.join(', ')}\n` : '') +
        (missing.length ? `  Rendered but not in the JSON: ${missing.join(', ')}\n` : '') +
        '  Mirror the change made to the app screen, in the same order.',
    );
  }
}

const urlFor = (lang, page) => (lang === 'en' ? '' : '/he') + (page === 'index' ? '/' : `/${page}`);

/**
 * English sits at the fixed URLs (/privacy, /terms, /support) and Hebrew under
 * /he/. A visitor whose device is Hebrew is sent to /he/ unless they chose a
 * language here before — so the one URL the app and App Store Connect hold
 * serves both languages, while the HTML at every URL stays complete.
 */
function layout({ lang, page, title, main }) {
  const t = copy[lang];
  const other = lang === 'en' ? 'he' : 'en';
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const navPages = ['privacy', 'terms', 'support'];
  const redirect =
    lang === 'en'
      ? `<script>try{var s=localStorage.getItem('lang');if(s==='he'||(!s&&/^(he|iw)\\b/i.test(navigator.language||'')))location.replace('/he'+location.pathname.replace(/\\/$/,'')+location.hash)}catch(e){}</script>\n`
      : '';

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="source-commit" content="${COMMIT}">
<meta name="color-scheme" content="dark">
<link rel="icon" href="data:,">
<link rel="canonical" href="https://${DOMAIN}${urlFor(lang, page)}">
${LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="https://${DOMAIN}${urlFor(l, page)}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="https://${DOMAIN}${urlFor('en', page)}">
${redirect}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&family=Epilogue:wght@400;600;700&display=swap">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header class="top">
<a class="brand" href="${urlFor(lang, 'index')}">Gymon</a>
<a class="lang" href="${urlFor(other, page)}" hreflang="${other}" lang="${other}" onclick="try{localStorage.setItem('lang','${other}')}catch(e){}">${esc(t.switchTo)}</a>
</header>
<main>
${main}
</main>
<footer>
<nav>${navPages.map((p) => `<a href="${urlFor(lang, p)}"${p === page ? ' aria-current="page"' : ''}>${esc(t.nav[p])}</a>`).join('\n')}</nav>
<p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
</footer>
</body>
</html>
`;
}

// ---------------------------------------------------------------- pages ----

function legalPage(lang, page, ns, spec) {
  const json = source[lang][ns];
  const { html, used } = renderDocument(json, spec);
  assertCoverage(ns, lang, json, used);
  const main = `<h1>${esc(json.pageTitle)}</h1>\n<p class="updated">${esc(json.lastUpdated)}</p>\n${html}`;
  return layout({ lang, page, title: `${json.pageTitle} · Gymon`, main });
}

function homePage(lang) {
  const t = copy[lang];
  const main = `<div class="home">
<h1>${esc(t.home.title)}</h1>
<p class="tagline">${esc(t.home.tagline)}</p>
<ul class="links">
${['privacy', 'terms', 'support'].map((p) => `<li><a href="${urlFor(lang, p)}">${esc(t.nav[p])}</a></li>`).join('\n')}
</ul>
</div>`;
  return layout({ lang, page: 'index', title: 'Gymon', main });
}

function supportPage(lang) {
  const t = copy[lang].support;
  const home = source[lang].home;
  const q = lang === 'he' ? ['"', '"'] : ['“', '”'];
  // The app's own labels, so the steps say exactly what the screen shows.
  const labels = {
    profile: get(home, 'nav.profile'),
    settings: get(home, 'profile.settings'),
    deleteRow: get(home, 'settings.deleteAccount'),
    cta: get(home, 'deleteAccountScreen.cta'),
    confirm: get(home, 'deleteAccountScreen.confirm'),
  };
  const fill = (s) =>
    esc(s).replace(/\{(\w+)\}/g, (_, k) => `<b>${q[0]}${esc(get(labels, k))}${q[1]}</b>`);
  const del = (k) => get(home, `deleteAccountScreen.${k}`);
  const ns = { privacy: source[lang].privacyPolicy.pageTitle, terms: source[lang].termsOfService.pageTitle };

  const main = `<h1>${esc(t.title)}</h1>

<section id="contact">
<h2>${esc(t.contactTitle)}</h2>
<p>${esc(t.contactBody)}</p>
<p class="email"><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
</section>

<section id="subscription">
<h2>${esc(t.subscriptionTitle)}</h2>
<p>${esc(t.subscriptionBody)}</p>
<ul>
${t.subscriptionSteps.map((s) => `<li>${esc(s)}</li>`).join('\n')}
</ul>
<p><a href="${APPLE_SUBSCRIPTIONS_URL}">${esc(t.subscriptionLink)}</a></p>
</section>

<section id="delete-account">
<h2>${esc(t.deleteTitle)}</h2>
<p>${esc(t.deleteLead)}</p>
<ol>
${t.deleteSteps.map((s) => `<li>${fill(s)}</li>`).join('\n')}
</ol>
<p>${esc(del('intro'))}</p>
<div class="sub">
<h3>${esc(del('deletedTitle'))}</h3>
<ul>
${del('deleted').map((s) => `<li>${esc(s)}</li>`).join('\n')}
</ul>
</div>
<div class="sub">
<h3>${esc(del('keptTitle'))}</h3>
<ul>
${del('kept').map((s) => `<li>${esc(s)}</li>`).join('\n')}
</ul>
</div>
<p>${esc(del('appleNote'))}</p>
</section>

<section id="documents">
<h2>${esc(t.documentsTitle)}</h2>
<ul>
<li><a href="${urlFor(lang, 'privacy')}">${esc(ns.privacy)}</a></li>
<li><a href="${urlFor(lang, 'terms')}">${esc(ns.terms)}</a></li>
</ul>
</section>`;
  return layout({ lang, page: 'support', title: `${t.title} · Gymon`, main });
}

function notFoundPage() {
  const t = copy.en.notFound;
  const main = `<div class="home">
<h1>${esc(t.title)}</h1>
<p class="tagline">${esc(t.body)}</p>
<ul class="links"><li><a href="/">Gymon</a></li></ul>
</div>`;
  // No redirect script and no canonical: GitHub Pages serves this for any path.
  return layout({ lang: 'en', page: 'index', title: `${t.title} · Gymon`, main })
    .replace(/<link rel="(canonical|alternate)"[^>]*>\n/g, '')
    .replace(/<script>.*<\/script>\n/, '');
}

// ---------------------------------------------------------------- write ----

rmSync(OUT, { recursive: true, force: true });
const write = (path, content) => {
  const full = join(OUT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
};

for (const lang of LANGS) {
  const prefix = lang === 'en' ? '' : 'he/';
  write(`${prefix}index.html`, homePage(lang));
  write(`${prefix}privacy.html`, legalPage(lang, 'privacy', 'privacyPolicy', privacyPolicy));
  write(`${prefix}terms.html`, legalPage(lang, 'terms', 'termsOfService', termsOfService));
  write(`${prefix}support.html`, supportPage(lang));
}
write('404.html', notFoundPage());
write('CNAME', `${DOMAIN}\n`);
write('.nojekyll', '');
copyFileSync(join(ROOT, 'src', 'style.css'), join(OUT, 'style.css'));

console.log(`Built docs/ from ${REPO} @ ${COMMIT} (${REF})`);
