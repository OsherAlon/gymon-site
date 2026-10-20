/**
 * Inline text in article JSON — the ONLY markup a writer may use inside a text field:
 *
 *   **bold phrase**            emphasis (weight, never italics — Hebrew has no true italic)
 *   [[r1]]  [[r1,r2]]          citation markers → numbered references
 *   [anchor](/blog/slug)       internal link to another Gymon article (also /he/blog/slug)
 *
 * Everything else is literal text and is HTML-escaped, so a writer cannot inject markup
 * (UX doctrine rule 10: no MDX, no raw HTML).
 *
 * Shared by the site (server render), the n8n validator and the n8n review page.
 * 🔴 Plain JS, no imports, no `\u` escapes, no `new URL()` (see schema.mjs header).
 */

export const INLINE_TOKEN = /\*\*([^*]+?)\*\*|\[\[([^\]]+)\]\]|\[([^\]]+)\]\((\/[^)\s]*)\)/g;
export const INTERNAL_HREF = /^\/(he\/)?blog\/[a-z0-9]+(?:-[a-z0-9]+)*\/?$/;

export const escHtml = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Ids inside one `[[...]]` marker. */
export const markerIds = (inner) =>
  String(inner)
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

/** All citation ids a text cites, in order, de-duplicated. */
export function refsIn(text) {
  const out = [];
  String(text || '').replace(INLINE_TOKEN, (m, _bold, refs) => {
    if (refs) for (const id of markerIds(refs)) if (!out.includes(id)) out.push(id);
    return m;
  });
  return out;
}

/** All internal-link hrefs in a text. */
export function linksIn(text) {
  const out = [];
  String(text || '').replace(INLINE_TOKEN, (m, _bold, _refs, _anchor, href) => {
    if (href) out.push(href);
    return m;
  });
  return out;
}

/** The reader-visible text: markers dropped, bold and link markup unwrapped. */
export function plainText(text) {
  return String(text || '')
    
    .replace(INLINE_TOKEN, (_m, bold, refs, anchor) => (bold != null ? bold : refs != null ? '' : anchor))
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Bidi safety net for Hebrew (UX doctrine §5): an en/em dash or × between two numbers is a
 * neutral and flips in an RTL paragraph ("8–12" shows as "12–8"). Wrap such runs in an LTR
 * span. Runs on already-escaped text.
 */
export function bidiWrap(escaped) {
  return escaped.replace(
    /(\d+(?:[.,]\d+)?)(\s*[–—×x]\s*)(\d+(?:[.,]\d+)?)/g,
    (m) => `<span dir="ltr">${m}</span>`,
  );
}

/**
 * Renders inline text to safe HTML.
 * opts.lang          'en' | 'he' (Hebrew gets the bidi wrap)
 * opts.refNumber     (id) => number | undefined   — numbering of the reference list
 * opts.refPopoverId  (id) => string               — id of the reference's preview popover
 * opts.linkPrefix    '' | '/he'                   — internal links are kept as written
 */
export function renderInline(text, opts = {}) {
  const lang = opts.lang || 'en';
  const plain = (s) => (lang === 'he' ? bidiWrap(escHtml(s)) : escHtml(s));
  const cite = (ids) => {
    const parts = ids.map((id) => {
      const n = opts.refNumber ? opts.refNumber(id) : undefined;
      const label = n == null ? '?' : String(n);
      const pop = opts.refPopoverId ? opts.refPopoverId(id) : null;
      return pop
        ? `<button type="button" class="cite-btn" popovertarget="${escHtml(pop)}" aria-label="${escHtml(
            (opts.sourceLabel || 'Source') + ' ' + label,
          )}">${label}</button>`
        : `<a class="cite-btn" href="#ref-${escHtml(id)}">${label}</a>`;
    });
    // v3: a small superscript number, no brackets — research stays out of the reader's way.
    return `<sup class="cite" dir="ltr">${parts.join(',')}</sup>`;
  };
  let out = '';
  let last = 0;
  const src = String(text == null ? '' : text);
  src.replace(INLINE_TOKEN, (m, bold, refs, anchor, href, offset) => {
    out += plain(src.slice(last, offset));
    if (bold != null) out += `<strong>${plain(bold)}</strong>`;
    else if (refs != null) out = out.replace(/\s+$/, '') + cite(markerIds(refs)); // keep the marker on its word
    else if (INTERNAL_HREF.test(href)) out += `<a href="${escHtml(href)}">${plain(anchor)}</a>`;
    else out += plain(anchor);
    last = offset + m.length;
    return m;
  });
  out += plain(src.slice(last));
  return out;
}

/** Splits a text into sentences (rough; used for length lint and tl;dr sentence count). */
export function sentences(text) {
  return plainText(text)
    .split(/(?<=[.!?])\s+(?=\S)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const wordCount = (text) => plainText(text).split(/\s+/).filter(Boolean).length;
