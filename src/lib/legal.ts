/**
 * The legal / support / home bodies, as HTML strings — ported 1:1 from the old
 * `build.mjs` so the served text stays identical. Pages inject them with
 * `set:html`; the page chrome lives in `src/layouts/LegacyLayout.astro`.
 */

import { copy, SUPPORT_EMAIL, APPLE_SUBSCRIPTIONS_URL } from '../copy.mjs';
import { privacyPolicy, termsOfService } from '../documents.mjs';
import { source, type Lang } from './source';

type Json = Record<string, any>;
type Spec = { section: string; blocks: Record<string, any>[] }[];

export type Page = 'index' | 'privacy' | 'terms' | 'support' | 'blog' | `blog/${string}`;

// The blog index is a directory (`blog/index.html`, next to `blog/<slug>.html`),
// so its URL carries the slash — `/blog` would be a 301 from GitHub Pages.
export const urlFor = (lang: Lang, page: Page) =>
  (lang === 'en' ? '' : '/he') + (page === 'index' ? '/' : page === 'blog' ? '/blog/' : `/${page}`);

function get(obj: Json, path: string): any {
  const value = path.split('.').reduce<any>((o, k) => (o == null ? undefined : o[k]), obj);
  if (value === undefined) throw new Error(`Missing key: ${path}`);
  return value;
}

function leafPaths(obj: Json, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? leafPaths(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

export const esc = (s: unknown) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Escapes, then turns bare emails and https URLs into links. Text unchanged. */
function rich(s: unknown) {
  return esc(s)
    .replace(/https:\/\/[^\s<]+[^\s<.,;:)"]/g, (u) => `<a href="${u}">${u}</a>`)
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+[a-z]/gi, (m) => `<a href="mailto:${m}">${m}</a>`);
}

/** A source string may hold `\n` — one paragraph per line, as the app shows it. */
const paragraphs = (s: unknown, cls = '') =>
  String(s)
    .split(/\n+/)
    .map((line) => `<p${cls ? ` class="${cls}"` : ''}>${rich(line)}</p>`)
    .join('\n');

/** Renders a document spec, and returns the key paths it used. */
function renderDocument(json: Json, spec: Spec) {
  const used = new Set(['pageTitle', 'lastUpdated']);
  const take = (path: string) => {
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
            return `<ul>\n${(b.list as string[]).map((k) => `<li>${rich(take(`${base}.${k}`))}</li>`).join('\n')}\n</ul>`;
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
function assertCoverage(name: string, lang: Lang, json: Json, used: Set<string>) {
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

// ---------------------------------------------------------------- pages ----

export function legalPage(lang: Lang, ns: 'privacyPolicy' | 'termsOfService') {
  const json = source[lang][ns];
  const spec = (ns === 'privacyPolicy' ? privacyPolicy : termsOfService) as Spec;
  const { html, used } = renderDocument(json, spec);
  assertCoverage(ns, lang, json, used);
  const main = `<h1>${esc(json.pageTitle)}</h1>\n<p class="updated">${esc(json.lastUpdated)}</p>\n${html}`;
  return { title: `${json.pageTitle} · Gymon`, main };
}

export function homePage(lang: Lang) {
  const t = (copy as any)[lang];
  // The blog is the only addition to the original home page: one more row in
  // the same list, after the three App Store pages.
  const main = `<div class="home">
<h1>${esc(t.home.title)}</h1>
<p class="tagline">${esc(t.home.tagline)}</p>
<ul class="links">
${(['privacy', 'terms', 'support', 'blog'] as const).map((p) => `<li><a href="${urlFor(lang, p)}">${esc(t.nav[p])}</a></li>`).join('\n')}
</ul>
</div>`;
  return { title: 'Gymon', main };
}

export function supportPage(lang: Lang) {
  const t = (copy as any)[lang].support;
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
  const fill = (s: string) =>
    esc(s).replace(/\{(\w+)\}/g, (_, k) => `<b>${q[0]}${esc(get(labels, k))}${q[1]}</b>`);
  const del = (k: string) => get(home, `deleteAccountScreen.${k}`);
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
${(t.subscriptionSteps as string[]).map((s) => `<li>${esc(s)}</li>`).join('\n')}
</ul>
<p><a href="${APPLE_SUBSCRIPTIONS_URL}">${esc(t.subscriptionLink)}</a></p>
</section>

<section id="delete-account">
<h2>${esc(t.deleteTitle)}</h2>
<p>${esc(t.deleteLead)}</p>
<ol>
${(t.deleteSteps as string[]).map((s) => `<li>${fill(s)}</li>`).join('\n')}
</ol>
<p>${esc(del('intro'))}</p>
<div class="sub">
<h3>${esc(del('deletedTitle'))}</h3>
<ul>
${(del('deleted') as string[]).map((s) => `<li>${esc(s)}</li>`).join('\n')}
</ul>
</div>
<div class="sub">
<h3>${esc(del('keptTitle'))}</h3>
<ul>
${(del('kept') as string[]).map((s) => `<li>${esc(s)}</li>`).join('\n')}
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
  return { title: `${t.title} · Gymon`, main };
}

export function notFoundPage() {
  const t = (copy as any).en.notFound;
  const main = `<div class="home">
<h1>${esc(t.title)}</h1>
<p class="tagline">${esc(t.body)}</p>
<ul class="links"><li><a href="/">Gymon</a></li></ul>
</div>`;
  return { title: `${t.title} · Gymon`, main };
}
