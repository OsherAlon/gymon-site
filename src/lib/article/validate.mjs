/**
 * validateArticle(article, ctx) → { errors, warnings, stats }
 *
 * ONE validator for the site build and the n8n pipeline (UX doctrine §8b: "the same schema
 * as content.config.ts, one shared file"). Errors fail the build and block Approve in the
 * review page; warnings are flags for the human reviewer.
 *
 * ctx (all optional):
 *   mode            'build' | 'pipeline'
 *   researchText    the research pack the writer saw  → quotes and their numbers are checked
 *                   against it ("fabricated quote" / "number not in any source")
 *   gymonMaterial   the Gymon facts the writer was given → numbers in plan-logic /
 *                   teardown-finding blocks must come from it
 *   publishedSlugs  { en: [...], he: [...] } → internal links may only point there
 *   allowedUrls     the research pack's allowed URLs → every reference URL must be one
 *
 * 🔴 Plain JS (see schema.mjs header). build.py strips the import lines and `export`
 * keywords when it inlines schema.mjs + inline.mjs + this file into an n8n Code node.
 */
import {
  SCHEMA_VERSION, LANGS, PILLARS, INTENTS, YMYL_LEVELS, LENGTH_BANDS, EVIDENCE_LEVELS,
  REF_TIERS, REF_TYPES, CTA_SLOTS, GYMON_KINDS, CALCULATORS, LIMITS,
  COMMERCIAL_HOST, TRACKING_PARAM, tierOfUrl, YMYL_TOPIC, HE_GENDERED_WORDS, HE_TRANSLITERATIONS, TOP_LEVEL_KEYS,
} from './schema.mjs';
import { refsIn, linksIn, plainText, sentences, wordCount, INTERNAL_HREF } from './inline.mjs';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const REF_ID = /^r\d{1,2}$/;
const DOI = /^10\.\d{4,9}\/\S+$/;
const HE_LETTER = 'א-ת';

const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v, min = 1) => typeof v === 'string' && v.trim().length >= min;

/** Numbers as written in a text: "39.9", "17,5" → "17.5", "1,600" → "1600". */
export function numbersIn(text) {
  const out = [];
  // Digits glued to Latin letters ("1RM", "e1RM") are names, not quantities.
  String(text || '').replace(/(?<![A-Za-z])\d+(?:[.,]\d+)*(?![A-Za-z\d])/g, (m) => {
    let n = m;
    if (/^\d{1,3}(,\d{3})+$/.test(n)) n = n.replace(/,/g, '');
    else n = n.replace(',', '.');
    n = n.replace(/^0+(?=\d)/, '');
    out.push(n);
    return m;
  });
  return out;
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** Numbers a source spells out ("Fifty-five untrained young women" → 55). English, 0–99. Execution 1541. */
export function spelledNumbersIn(text) {
  const out = [];
  const t = String(text || '').toLowerCase();
  const re = new RegExp(`\\b(${TENS.filter(Boolean).join('|')})(?:[- ](${ONES.slice(1, 10).join('|')}))?\\b|\\b(${ONES.join('|')})\\b`, 'g');
  let m;
  while ((m = re.exec(t))) {
    if (m[1]) out.push(String(TENS.indexOf(m[1]) * 10 + (m[2] ? ONES.indexOf(m[2]) : 0)));
    else out.push(String(ONES.indexOf(m[3])));
  }
  return out;
}

/** Numbers a quote supports: written as digits or spelled out. */
export const quoteNumbers = (quote) => [...numbersIn(quote), ...spelledNumbersIn(quote)];

/** Normalises text for "is this quote really in the research pack" checks. */
export function normForMatch(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[‘’`´]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when every ≥20-char chunk of the quote (split at ellipses) occurs in the research text. */
export function quoteInResearch(quote, research) {
  const hay = normForMatch(research);
  const chunks = normForMatch(quote)
    .split(/\.\.\.|…|\[…\]|\[\.\.\.\]/)
    .map((c) => c.trim())
    .filter((c) => c.length >= 20);
  if (!chunks.length) return hay.includes(normForMatch(quote));
  return chunks.every((c) => hay.includes(c));
}

export const readTimeOf = (article) => {
  const words = collectUnits(article).reduce((n, u) => n + wordCount(u.text), 0);
  return Math.max(1, Math.round(words / (article && article.lang === 'he' ? 200 : 230)));
};

/** Every reader-facing text unit of a v3 article, with the refs its inline markers carry. */
export function collectUnits(a) {
  const units = [];
  const push = (path, text, kind = 'text') => {
    if (typeof text !== 'string') return;
    units.push({ path, text, refs: refsIn(text), kind });
  };
  if (!isObj(a)) return units;
  push('hook', a.hook);
  push('bottomLine', a.bottomLine);
  (Array.isArray(a.beats) ? a.beats : []).forEach((b, i) => {
    if (!isObj(b)) return;
    push(`beats[${i}].heading`, b.heading, 'heading');
    push(`beats[${i}].text`, b.text, 'beat');
  });
  if (isObj(a.pullQuote)) {
    push('pullQuote.lead', a.pullQuote.lead);
    push('pullQuote.text', a.pullQuote.text, 'quote');
  }
  if (isObj(a.tips)) {
    push('tips.heading', a.tips.heading, 'heading');
    (Array.isArray(a.tips.items) ? a.tips.items : []).forEach((t, i) => push(`tips.items[${i}]`, t, 'tip'));
  }
  const g = isObj(a.gymon) ? a.gymon : null;
  if (g) {
    const kind = g.kind === 'log-example' ? 'gymon-example' : 'gymon';
    if (g.heading) push('gymon.heading', g.heading, 'heading');
    push('gymon.text', g.text, kind);
    (Array.isArray(g.points) ? g.points : []).forEach((pt, pi) => push(`gymon.points[${pi}]`, pt, kind));
    if (g.caption) push('gymon.caption', g.caption, kind);
  }
  return units;
}

export function ymylGuard(fields) {
  const hits = [];
  for (const [k, v] of Object.entries(fields || {})) {
    const m = String(v || '').match(YMYL_TOPIC);
    if (m) hits.push(`${k}: "${m[0]}"`);
  }
  return hits;
}

const GENDERED = new RegExp(
  `(?:^|[^${HE_LETTER}])(?:ו|ש|כש)?(${HE_GENDERED_WORDS.join('|')})(?![${HE_LETTER}])`,
  'g',
);
const SLASH_FORM = new RegExp(`[${HE_LETTER}]+/(?:ה|ת|ית|י|ים|ות)(?![${HE_LETTER}])`, 'g');

export function hebrewLint(text) {
  const out = [];
  const t = String(text || '');
  let m;
  GENDERED.lastIndex = 0;
  while ((m = GENDERED.exec(t))) out.push(`gendered form "${m[1]}" (use plural, "יש ל-" or an impersonal form)`);
  for (const s of t.match(SLASH_FORM) || []) out.push(`slash form "${s}" (not allowed)`);
  for (const s of t.match(/\d+\s*[–—]\s*\d+/g) || []) out.push(`range "${s}" with a dash flips in RTL — write "X עד Y"`);
  for (const s of t.match(/\d+\s*[×xX]\s*\d+/g) || []) out.push(`"${s}" flips in RTL — write "N סטים של M"`);
  if (/כפיפות ברכיים/.test(t)) out.push('"כפיפות ברכיים" means the leg-curl machine in Israeli gym usage — use "סקוואט" for squat');
  for (const { re, use } of HE_TRANSLITERATIONS) {
    const m2 = t.match(new RegExp(re));
    if (m2) out.push(`"${m2[0]}" is English in Hebrew letters — write "${use}"`);
  }
  if (/(^|[^*])\*[^*\s][^*]*\*(?!\*)/.test(t) || /(^|\s)_[^_]+_(\s|$)/.test(t)) out.push('italic markup — Hebrew has no italic; use **bold** sparingly');
  return out;
}

const ARTIFACTS = /(as an ai\b|as a language model|in conclusion, it'?s important|\[placeholder|lorem ipsum|\bTODO\b|<PLACEHOLDER)/i;
const MEDICAL_EN = /\b(cures?|guarantee[sd]?|prevents? injur(y|ies)|treats?|heals?)\b/i;
const MEDICAL_HE = /(מרפא|מבטיח|מונע פציעות|מונעת פציעות|ריפוי)/;
const FABRICATED = /(our users|users (told|tell) us|in my experience|my clients|i've seen|המשתמשים שלנו|מניסיוני|הלקוחות שלי)/i;
const RAW_HTML = /<\/?[a-z][a-z0-9-]*(\s[^>]*)?>/i;
const EXT_MD_LINK = /\[[^\]]+\]\(\s*(https?:|www\.)/i;
const HEADING_MD = /(^|\n)\s{0,3}#{1,6}\s/;
const STUDY_DETAIL = /(\bp\s*[<=>]\s*0?\.\d|±|\bn\s*=\s*\d|\b95% ?CI\b)/i;

export function validateArticle(a, ctx = {}) {
  const errors = [];
  const warnings = [];
  const err = (path, message) => errors.push({ path, message });
  const warn = (path, message) => warnings.push({ path, message });
  const pipeline = ctx.mode === 'pipeline';

  if (!isObj(a)) {
    err('', 'article is not an object');
    return { errors, warnings, stats: {} };
  }

  // ---- closed top level ----
  for (const k of Object.keys(a)) if (!TOP_LEVEL_KEYS.includes(k)) err(k, 'unknown field (closed schema)');
  if (a.schemaVersion !== SCHEMA_VERSION) err('schemaVersion', `must be ${SCHEMA_VERSION}`);
  if (!LANGS.includes(a.lang)) err('lang', `must be one of ${LANGS.join(', ')}`);
  const lang = LANGS.includes(a.lang) ? a.lang : 'en';
  if (!isStr(a.slug) || !SLUG.test(a.slug)) err('slug', 'lowercase latin letters, digits and dashes');

  if (!isStr(a.title)) err('title', 'required');
  else {
    if (a.title.length > LIMITS.title.hardMax) err('title', `${a.title.length} characters (hard limit ${LIMITS.title.hardMax})`);
    else if (a.title.length > LIMITS.title.max) warn('title', `${a.title.length} characters — SEO doctrine caps titles at ${LIMITS.title.max}`);
    if (a.title.length < LIMITS.title.min) warn('title', 'very short');
    // User decision 2026-10-07: every title is a natural question. The "?" must be the LOGICAL last
    // character (Hebrew included) — a trailing bidi mark or space after it does not count.
    if (!a.title.endsWith('?')) err('title', 'must be a question ending in "?"');
  }
  if (!isStr(a.heroTitle)) err('heroTitle', 'required (2–4 words)');
  else {
    const n = a.heroTitle.trim().split(/\s+/).length;
    if (n > 6) err('heroTitle', `${n} words`);
    else if (n > LIMITS.heroTitleWords.max) warn('heroTitle', `${n} words (2–4 expected)`);
  }
  if (!isStr(a.description)) err('description', 'required');
  else {
    const [lo, hi] = LIMITS.description[lang];
    if (a.description.length < lo || a.description.length > hi) warn('description', `${a.description.length} characters (${lo}–${hi} expected)`);
  }
  if (!PILLARS.includes(a.pillar)) err('pillar', `must be one of ${PILLARS.join(', ')}`);
  if (!Array.isArray(a.tags) || a.tags.length < LIMITS.tags[0] || a.tags.length > LIMITS.tags[1] || !a.tags.every((t) => isStr(t) && SLUG.test(t)))
    err('tags', `${LIMITS.tags[0]}–${LIMITS.tags[1]} kebab-case tags`);
  if (!INTENTS.includes(a.intent)) err('intent', `must be one of ${INTENTS.join(', ')}`);
  if (!YMYL_LEVELS.includes(a.ymylLevel)) err('ymylLevel', 'only low-YMYL topics are published (no credentialed reviewer)');
  if (!LENGTH_BANDS.includes(a.lengthBand)) err('lengthBand', `must be one of ${LENGTH_BANDS.join(', ')}`);
  if (!isStr(a.primaryQuery)) err('primaryQuery', 'required');

  const ymyl = ymylGuard({ slug: a.slug, title: a.title, primaryQuery: a.primaryQuery, heroTitle: a.heroTitle });
  if (ymyl.length) err('topic', `YMYL topic guard: ${ymyl.join('; ')}`);

  if (!isStr(a.image) || !/^(\/|https:\/\/)/.test(a.image)) err('image', 'path under public/ or https URL');
  if (!isStr(a.imageAlt, 8)) err('imageAlt', 'required');
  if (typeof a.imageAiGenerated !== 'boolean') err('imageAiGenerated', 'boolean required');
  if (!isStr(a.createdAt) || !DATE.test(a.createdAt)) err('createdAt', 'YYYY-MM-DD');
  if (a.updatedAt != null && (!DATE.test(String(a.updatedAt)) || String(a.updatedAt) < String(a.createdAt)))
    err('updatedAt', 'YYYY-MM-DD, not before createdAt (set only on a substantive change)');
  if (a.reviewedAt != null && !DATE.test(String(a.reviewedAt))) err('reviewedAt', 'YYYY-MM-DD or null');
  if (a.editor !== 'osher-alon') err('editor', 'must be "osher-alon" (the named human editor)');
  if (a.aiAssisted !== true) err('aiAssisted', 'must be true (drives the disclosure line)');
  if (a.sample != null && typeof a.sample !== 'boolean') err('sample', 'boolean');
  if (!a.sample && a.reviewedAt == null && !pipeline) err('reviewedAt', 'a non-sample article must carry the date of its human review');

  // ---- references (v2: all study detail lives here, never in the body) ----
  const refs = new Map();
  if (!Array.isArray(a.references) || a.references.length < LIMITS.references[0] || a.references.length > LIMITS.references[1])
    err('references', `${LIMITS.references[0]}–${LIMITS.references[1]} references`);
  (Array.isArray(a.references) ? a.references : []).forEach((r, i) => {
    const p = `references[${i}]`;
    if (!isObj(r)) return err(p, 'object expected');
    const allowed = ['id', 'title', 'authors', 'year', 'venue', 'url', 'doi', 'pmid', 'tier', 'type', 'fullTextRead', 'quote', 'finding', 'certainty'];
    for (const k of Object.keys(r)) if (!allowed.includes(k)) err(`${p}.${k}`, 'unknown field');
    if (!isStr(r.id) || !REF_ID.test(r.id)) err(`${p}.id`, 'r1, r2, …');
    else if (refs.has(r.id)) err(`${p}.id`, `duplicate id ${r.id}`);
    else refs.set(r.id, r);
    if (!isStr(r.title)) err(`${p}.title`, 'required');
    if (!Array.isArray(r.authors) || !r.authors.every((x) => isStr(x))) err(`${p}.authors`, 'array of names');
    if (r.year != null && !(Number.isInteger(r.year) && r.year > 1900 && r.year < 2100)) err(`${p}.year`, 'year or null');
    if (r.venue != null && typeof r.venue !== 'string') err(`${p}.venue`, 'string');
    if (!isStr(r.url) || !/^https:\/\/[^\s]+$/.test(r.url)) err(`${p}.url`, 'https URL');
    else {
      if (COMMERCIAL_HOST.test(r.url)) err(`${p}.url`, 'commercial host — not a source');
      if (TRACKING_PARAM.test(r.url)) err(`${p}.url`, 'tracking parameters must be stripped');
      if (r.tier !== tierOfUrl(r.url)) err(`${p}.tier`, `is ${r.tier}, the URL's tier is ${tierOfUrl(r.url)}`);
      if (Array.isArray(ctx.allowedUrls) && !ctx.allowedUrls.includes(r.url)) err(`${p}.url`, 'not in the research pack (invented or off-list URL)');
    }
    if (r.doi != null && !(isStr(r.doi) && DOI.test(r.doi))) err(`${p}.doi`, '10.xxxx/… or omit');
    if (r.pmid != null && !(isStr(r.pmid) && /^\d{4,9}$/.test(r.pmid))) err(`${p}.pmid`, 'digits or omit');
    if (!REF_TIERS.includes(r.tier)) err(`${p}.tier`, REF_TIERS.join(' | '));
    if (!REF_TYPES.includes(r.type)) err(`${p}.type`, REF_TYPES.join(' | '));
    if (typeof r.fullTextRead !== 'boolean') err(`${p}.fullTextRead`, 'boolean');
    if (!EVIDENCE_LEVELS.includes(r.certainty)) err(`${p}.certainty`, EVIDENCE_LEVELS.join(' | '));
    else {
      if ((r.certainty === 'strong' || r.certainty === 'moderate') && !((r.tier === 'PRIMARY' || r.tier === 'AUTHORITY') && r.fullTextRead))
        err(`${p}.certainty`, `"${r.certainty}" needs a PRIMARY/AUTHORITY source whose full text was read`);
      if (r.tier === 'SECONDARY' && !['limited', 'mixed', 'insufficient'].includes(r.certainty))
        err(`${p}.certainty`, 'a SECONDARY source is capped at "limited"');
    }
    if (!isStr(r.finding, 10)) err(`${p}.finding`, 'required: what the source found, with its size and population when known');
    else {
      const fw = wordCount(r.finding);
      if (fw > LIMITS.findingWords) warn(`${p}.finding`, `${fw} words (≤${LIMITS.findingWords})`);
      if (lang === 'he') for (const m of hebrewLint(r.finding)) warn(`${p}.finding`, m);
      if (isStr(r.quote)) {
        const inQuote = new Set(quoteNumbers(r.quote));
        const years = String(r.year);
        for (const n of numbersIn(r.finding)) if (n !== years && !inQuote.has(n)) warn(`${p}.finding`, `number ${n} is not in this reference's quote`);
      }
    }
    if (!isStr(r.quote, 10)) err(`${p}.quote`, 'verbatim snippet from the source is required');
    else if (typeof ctx.researchText === 'string') {
      if (!quoteInResearch(r.quote, ctx.researchText)) warn(`${p}.quote`, 'not found verbatim in the research pack — check it against the source');
      const hay = normForMatch(ctx.researchText);
      for (const n of numbersIn(r.quote)) if (!hay.includes(n)) err(`${p}.quote`, `number ${n} appears in no source text (fabricated?)`);
    }
  });

  // ---- hook + bottom line (the first screen) ----
  if (!isStr(a.hook)) err('hook', 'required: a relatable question or situation, 1–2 short sentences');
  else {
    const n = sentences(a.hook).length;
    if (n > LIMITS.hookSentences) warn('hook', `${n} sentences (≤${LIMITS.hookSentences})`);
    if (wordCount(a.hook) > LIMITS.hookWords) warn('hook', `${wordCount(a.hook)} words (≤${LIMITS.hookWords})`);
  }
  if (!isStr(a.bottomLine)) err('bottomLine', 'required: one sentence that answers the title');
  else {
    const n = sentences(a.bottomLine).length;
    if (n > 2) err('bottomLine', `${n} sentences — the takeaway is ONE sentence`);
    else if (n > 1) warn('bottomLine', `${n} sentences — the takeaway is one sentence`);
    if (wordCount(a.bottomLine) > LIMITS.bottomLineWords) warn('bottomLine', `${wordCount(a.bottomLine)} words (≤${LIMITS.bottomLineWords})`);
  }

  // ---- beats: one idea per screen; the headline IS the point ----
  if (!Array.isArray(a.beats) || a.beats.length < LIMITS.beats[0] || a.beats.length > LIMITS.beats[1])
    err('beats', `${LIMITS.beats[0]}–${LIMITS.beats[1]} beats`);
  (Array.isArray(a.beats) ? a.beats : []).forEach((b, i) => {
    const p = `beats[${i}]`;
    if (!isObj(b)) return err(p, '{ heading, text }');
    for (const k of Object.keys(b)) if (!['heading', 'text'].includes(k)) err(`${p}.${k}`, 'unknown field');
    if (!isStr(b.heading)) err(`${p}.heading`, 'required: a plain statement of the point');
    else {
      if (wordCount(b.heading) > LIMITS.beatHeadingWords) warn(`${p}.heading`, `${wordCount(b.heading)} words (≤${LIMITS.beatHeadingWords})`);
      if (refsIn(b.heading).length) err(`${p}.heading`, 'no citation markers in a headline');
    }
    if (!isStr(b.text)) err(`${p}.text`, 'required: 1–3 short sentences');
    else {
      const n = sentences(b.text).length;
      if (n > LIMITS.beatSentences + 1) err(`${p}.text`, `${n} sentences — a beat is one idea in 1–3 short sentences`);
      else if (n > LIMITS.beatSentences) warn(`${p}.text`, `${n} sentences (≤${LIMITS.beatSentences})`);
      const w = wordCount(b.text);
      if (w > LIMITS.beatWords) warn(`${p}.text`, `${w} words (≤${LIMITS.beatWords}) — keep it a glance`);
      const nums = new Set(numbersIn(plainText(b.text)));
      if (nums.size > LIMITS.beatNumbers) warn(`${p}.text`, `${nums.size} numbers — at most one key number per beat (study detail belongs in the sources)`);
    }
  });

  // ---- pull quote: verbatim from a cited source (English), attributed ----
  if (a.pullQuote != null) {
    const q = a.pullQuote;
    if (!isObj(q)) err('pullQuote', '{ ref, text, attribution, lead? }');
    else {
      for (const k of Object.keys(q)) if (!['ref', 'text', 'attribution', 'lead'].includes(k)) err(`pullQuote.${k}`, 'unknown field');
      if (!isStr(q.text)) err('pullQuote.text', 'required');
      else if (wordCount(q.text) > LIMITS.pullQuoteWords) warn('pullQuote.text', `${wordCount(q.text)} words (≤${LIMITS.pullQuoteWords})`);
      if (!isStr(q.attribution)) err('pullQuote.attribution', 'required: who said or wrote it');
      if (!isStr(q.ref) || !refs.has(q.ref)) err('pullQuote.ref', 'must be the id of a reference');
      else if (lang === 'en' && isStr(q.text) && !normForMatch(refs.get(q.ref).quote).includes(normForMatch(q.text).replace(/^["“]|["”]$/g, '')))
        err('pullQuote.text', `not found in the quote of ${q.ref} — a pull quote is verbatim`);
    }
  }

  // ---- try it ----
  const tp = a.tips;
  if (!isObj(tp)) err('tips', 'required: { heading, items: 3–5 }');
  else {
    for (const k of Object.keys(tp)) if (!['heading', 'items'].includes(k)) err(`tips.${k}`, 'unknown field');
    if (!isStr(tp.heading)) err('tips.heading', 'required');
    if (!Array.isArray(tp.items) || tp.items.length < LIMITS.tips[0] || tp.items.length > LIMITS.tips[1] || !tp.items.every((x) => isStr(x)))
      err('tips.items', `${LIMITS.tips[0]}–${LIMITS.tips[1]} short lines`);
    else tp.items.forEach((t, i) => { if (wordCount(t) > LIMITS.tipWords) warn(`tips.items[${i}]`, `${wordCount(t)} words (≤${LIMITS.tipWords})`); });
  }

  // ---- quiet extras ----
  if (a.calculator != null) {
    const cp = 'calculator';
    const c = a.calculator;
    if (!isObj(c)) err(cp, '{ calculator, defaults? }');
    else {
      for (const k of Object.keys(c)) if (!['calculator', 'defaults'].includes(k)) err(`${cp}.${k}`, 'unknown field');
      const reg = CALCULATORS[c.calculator];
      if (!reg) err(`${cp}.calculator`, `not in the registry (${Object.keys(CALCULATORS).join(', ')})`);
      else if (c.defaults != null) {
        if (!isObj(c.defaults)) err(`${cp}.defaults`, 'object');
        else
          for (const [k, v] of Object.entries(c.defaults)) {
            const range = reg[k];
            if (!range) err(`${cp}.defaults.${k}`, 'unknown parameter');
            else if (typeof v !== 'number' || v < range.min || v > range.max) err(`${cp}.defaults.${k}`, `${range.min}–${range.max}`);
          }
      }
    }
  }
  const g = a.gymon;
  if (g != null) {
    const gp = 'gymon';
    const only = (keys) => {
      for (const k of Object.keys(g)) if (!['kind', ...keys].includes(k)) err(`${gp}.${k}`, `unknown field for "${g.kind}"`);
    };
    if (!isObj(g) || !GYMON_KINDS.includes(g.kind)) err(`${gp}.kind`, GYMON_KINDS.join(' | '));
    else if (g.kind === 'log-example') {
      only(['caption', 'exercise', 'sessions', 'text']);
      if (!isStr(g.exercise)) err(`${gp}.exercise`, 'required');
      if (!isStr(g.caption)) err(`${gp}.caption`, 'required');
      if (!Array.isArray(g.sessions) || g.sessions.length < 1 || g.sessions.length > 3) err(`${gp}.sessions`, '1–3 sessions');
      (Array.isArray(g.sessions) ? g.sessions : []).forEach((ses, i) => {
        if (!isObj(ses) || !isStr(ses.label) || !Array.isArray(ses.sets) || ses.sets.length < 1 || ses.sets.length > 6)
          return err(`${gp}.sessions[${i}]`, '{ label, sets: 1–6 }');
        ses.sets.forEach((st, j) => {
          const num = (v) => typeof v === 'number' && v >= 0 && v <= 1000;
          if (!isObj(st) || !num(st.kg) || !num(st.reps) || (st.previous != null && !(isObj(st.previous) && num(st.previous.kg) && num(st.previous.reps))))
            err(`${gp}.sessions[${i}].sets[${j}]`, '{ kg, reps, previous: { kg, reps } | null }');
        });
      });
    } else {
      only(['heading', 'text', 'points']);
      if (!isStr(g.text)) err(`${gp}.text`, 'required');
      if (g.points != null && !(Array.isArray(g.points) && g.points.every((x) => isStr(x)))) err(`${gp}.points`, 'strings');
    }
  }
  if (!isObj(a.cta) || !CTA_SLOTS.includes(a.cta.slot) || Object.keys(a.cta).some((k) => k !== 'slot'))
    err('cta', `{ slot: ${CTA_SLOTS.join(' | ')} } — the writer never writes CTA copy`);

  // ---- per-unit content checks ----
  const units = collectUnits(a);
  const used = new Set();
  const internal = [];
  for (const u of units) {
    for (const id of u.refs) {
      used.add(id);
      if (!refs.has(id)) err(u.path, `cites unknown reference ${id}`);
    }
    for (const href of linksIn(u.text)) {
      internal.push(href);
      if (!INTERNAL_HREF.test(href)) err(u.path, `link "${href}" is not an internal blog link (external sources go in references)`);
      else if ((lang === 'he') !== href.startsWith('/he/')) err(u.path, `link "${href}" points to the other language`);
      else if (ctx.publishedSlugs) {
        const slug = href.replace(/^\/(he\/)?blog\//, '').replace(/\/$/, '');
        if (!(ctx.publishedSlugs[lang] || []).includes(slug)) err(u.path, `link "${href}" — no published article with that slug`);
      }
    }
    if (RAW_HTML.test(u.text)) err(u.path, 'raw HTML is not allowed');
    if (EXT_MD_LINK.test(u.text)) err(u.path, 'external links are not allowed in text — cite a reference with [[rN]]');
    if (HEADING_MD.test(u.text)) err(u.path, 'Markdown headings are not allowed inside text');
    if (ARTIFACTS.test(u.text)) err(u.path, 'model artifact / placeholder text');
    if (FABRICATED.test(plainText(u.text))) warn(u.path, 'reads like invented first-hand experience — the reviewer must confirm it is true');
    if (lang === 'en' && MEDICAL_EN.test(plainText(u.text))) warn(u.path, 'medical-promise wording (cure/guarantee/prevent/treat)');
    if (lang === 'he' && MEDICAL_HE.test(plainText(u.text))) warn(u.path, 'ניסוח של הבטחה רפואית');
    if (lang === 'he') for (const m of hebrewLint(u.text)) warn(u.path, m);
    if (u.kind !== 'heading') {
      for (const s of sentences(u.text)) {
        const w = s.split(/\s+/).length;
        if (w > LIMITS.sentenceWords) warn(u.path, `sentence of ${w} words (≤${LIMITS.sentenceWords})`);
      }
    }
    if (STUDY_DETAIL.test(plainText(u.text))) warn(u.path, 'study detail in the body (p-values, ±, "n =") — it belongs in the sources list');

    // Numbers must come from a cited, fully-read source quote.
    if (u.kind === 'gymon-example' || u.kind === 'heading' || u.kind === 'quote') continue;
    const nums = numbersIn(plainText(u.text));
    if (!nums.length) continue;
    if (u.kind === 'gymon') {
      if (typeof ctx.gymonMaterial === 'string') {
        const hay = normForMatch(ctx.gymonMaterial);
        const missing = nums.filter((n) => !hay.includes(n));
        if (missing.length) warn(u.path, `number(s) ${missing.join(', ')} are not in the supplied Gymon material`);
      }
      continue;
    }
    const cited = u.refs.map((id) => refs.get(id)).filter(Boolean);
    const years = new Set(cited.map((r) => String(r.year)));
    const check = nums.filter((n) => !years.has(n));
    if (!check.length) continue;
    if (!cited.length) {
      if (u.kind !== 'tip') warn(u.path, `number(s) ${check.join(', ')} without a citation`);
      continue;
    }
    const inRead = new Set(cited.filter((r) => r.fullTextRead).flatMap((r) => quoteNumbers(r.quote)));
    const inUnread = new Set(cited.filter((r) => !r.fullTextRead).flatMap((r) => quoteNumbers(r.quote)));
    for (const n of check) {
      if (inRead.has(n)) continue;
      if (inUnread.has(n) || (cited.length && cited.every((r) => !r.fullTextRead)))
        err(u.path, `number ${n} is attributed to a source whose full text was not read (fullTextRead: false)`);
      else warn(u.path, `number ${n} is not in the quote of any cited reference`);
    }
  }
  for (const id of refs.keys()) if (!used.has(id)) warn('references', `${id} is never cited`);
  if (ctx.publishedSlugs && (ctx.publishedSlugs[lang] || []).length >= LIMITS.internalLinks[0] && internal.length < LIMITS.internalLinks[0])
    warn('beats', `${internal.length} internal links (${LIMITS.internalLinks[0]}–${LIMITS.internalLinks[1]} expected)`);

  // Truncation (SEO §9.5: a hard failure) — the last tip must end a sentence.
  const tipItems = isObj(tp) && Array.isArray(tp.items) ? tp.items : [];
  const lastText = tipItems.length ? tipItems[tipItems.length - 1] : null;
  if (tipItems.length && (!isStr(lastText) || !/[.!?:)"”׳]\s*(\[\[[^\]]+\]\])?\s*$/.test(lastText.trim())))
    err('tips.items', 'the article ends mid-sentence (truncated?)');

  const words = units.reduce((n, u) => n + wordCount(u.text), 0);
  const [wlo, whi] = LIMITS.words[lang];
  if (words < wlo || words > whi) warn('length', `${words} words (${wlo}–${whi}: short enough to feel like scrolling)`);
  return { errors, warnings, stats: { words, readTime: Math.max(1, Math.round(words / (lang === 'he' ? 200 : 230))), refs: refs.size } };
}
