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
  SCHEMA_VERSION, LANGS, PILLARS, INTENTS, YMYL_LEVELS, LENGTH_BANDS, EVIDENCE_LEVELS, CERTAINTY_WORDS,
  REF_TIERS, REF_TYPES, CALLOUT_KINDS, CTA_SLOTS, GYMON_KINDS, CALCULATORS, BLOCK_TYPES, LIMITS,
  COMMERCIAL_HOST, TRACKING_PARAM, tierOfUrl, YMYL_TOPIC, HE_GENDERED_WORDS, TOP_LEVEL_KEYS,
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

/** Every reader-facing text unit, with the refs it carries (inline markers + `refs` field). */
export function collectUnits(a) {
  const units = [];
  const push = (path, text, refs = [], kind = 'text') => {
    if (typeof text !== 'string') return;
    units.push({ path, text, refs: [...new Set([...(refs || []), ...refsIn(text)])], kind });
  };
  if (!isObj(a)) return units;
  push('tldr', a.tldr);
  (Array.isArray(a.keyTakeaways) ? a.keyTakeaways : []).forEach((t, i) => isObj(t) && push(`keyTakeaways[${i}]`, t.text, t.refs));
  (Array.isArray(a.sections) ? a.sections : []).forEach((s, si) => {
    if (!isObj(s)) return;
    push(`sections[${si}].heading`, s.heading, [], 'heading');
    (Array.isArray(s.blocks) ? s.blocks : []).forEach((b, bi) => {
      if (!isObj(b)) return;
      const p = `sections[${si}].blocks[${bi}]`;
      if (b.type === 'p' || b.type === 'takeaway' || b.type === 'callout') push(p, b.text);
      else if (b.type === 'claim') push(p, b.text, b.refs);
      else if (b.type === 'list') (Array.isArray(b.items) ? b.items : []).forEach((it, ii) => push(`${p}.items[${ii}]`, it));
      else if (b.type === 'table') {
        push(`${p}.caption`, b.caption, b.refs);
        (Array.isArray(b.rows) ? b.rows : []).forEach((r, ri) =>
          (Array.isArray(r) ? r : []).forEach((c, ci) => push(`${p}.rows[${ri}][${ci}]`, String(c), b.refs)),
        );
      } else if (b.type === 'gymon') {
        const kind = b.kind === 'log-example' ? 'gymon-example' : 'gymon';
        push(`${p}.text`, b.text, [], kind);
        (Array.isArray(b.points) ? b.points : []).forEach((pt, pi) => push(`${p}.points[${pi}]`, pt, [], kind));
        if (b.caption) push(`${p}.caption`, b.caption, [], kind);
      }
    });
  });
  (Array.isArray(a.faq) ? a.faq : []).forEach((f, i) => {
    if (!isObj(f)) return;
    push(`faq[${i}].q`, f.q, [], 'heading');
    push(`faq[${i}].a`, f.a, f.refs);
  });
  (Array.isArray(a.quiz) ? a.quiz : []).forEach((q, i) => {
    if (!isObj(q)) return;
    push(`quiz[${i}].question`, q.question, [], 'quiz');
    (Array.isArray(q.options) ? q.options : []).forEach((o, oi) => push(`quiz[${i}].options[${oi}]`, o, [], 'quiz'));
    push(`quiz[${i}].explanation`, q.explanation, q.refs);
  });
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
  if (/עומס מתקדם/.test(t)) out.push('"עומס מתקדם" is a calque nobody searches — use "פרוגרסיב אוברלואד (עומס פרוגרסיבי)"');
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

  // ---- references ----
  const refs = new Map();
  if (!Array.isArray(a.references) || a.references.length < LIMITS.references[0] || a.references.length > LIMITS.references[1])
    err('references', `${LIMITS.references[0]}–${LIMITS.references[1]} references`);
  (Array.isArray(a.references) ? a.references : []).forEach((r, i) => {
    const p = `references[${i}]`;
    if (!isObj(r)) return err(p, 'object expected');
    const allowed = ['id', 'title', 'authors', 'year', 'venue', 'url', 'doi', 'pmid', 'tier', 'type', 'fullTextRead', 'quote'];
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
    if (!isStr(r.quote, 10)) err(`${p}.quote`, 'verbatim snippet from the source is required');
    else if (typeof ctx.researchText === 'string') {
      if (!quoteInResearch(r.quote, ctx.researchText)) warn(`${p}.quote`, 'not found verbatim in the research pack — check it against the source');
      const hay = normForMatch(ctx.researchText);
      for (const n of numbersIn(r.quote)) if (!hay.includes(n)) err(`${p}.quote`, `number ${n} appears in no source text (fabricated?)`);
    }
  });

  // ---- summary ----
  if (!isStr(a.tldr)) err('tldr', 'required: 1–3 sentences answering the title question');
  else if (sentences(a.tldr).length > LIMITS.tldrSentences) warn('tldr', `${sentences(a.tldr).length} sentences (≤${LIMITS.tldrSentences})`);
  if (!Array.isArray(a.keyTakeaways) || a.keyTakeaways.length < LIMITS.keyTakeaways[0] || a.keyTakeaways.length > LIMITS.keyTakeaways[1])
    err('keyTakeaways', `${LIMITS.keyTakeaways[0]}–${LIMITS.keyTakeaways[1]} items`);
  (Array.isArray(a.keyTakeaways) ? a.keyTakeaways : []).forEach((t, i) => {
    if (!isObj(t) || !isStr(t.text)) return err(`keyTakeaways[${i}]`, '{ text, refs? }');
    for (const k of Object.keys(t)) if (!['text', 'refs'].includes(k)) err(`keyTakeaways[${i}].${k}`, 'unknown field');
    if (t.refs != null && !(Array.isArray(t.refs) && t.refs.every((x) => isStr(x)))) err(`keyTakeaways[${i}].refs`, 'array of reference ids');
  });

  // ---- sections & blocks ----
  let calculators = 0;
  let ctas = 0;
  let tables = 0;
  let gymon = 0;
  let applySections = 0;
  if (!Array.isArray(a.sections) || a.sections.length < LIMITS.sections[0] || a.sections.length > LIMITS.sections[1])
    err('sections', `${LIMITS.sections[0]}–${LIMITS.sections[1]} sections`);
  (Array.isArray(a.sections) ? a.sections : []).forEach((s, si) => {
    const sp = `sections[${si}]`;
    if (!isObj(s)) return err(sp, 'object expected');
    for (const k of Object.keys(s)) if (!['heading', 'apply', 'blocks'].includes(k)) err(`${sp}.${k}`, 'unknown field');
    if (!isStr(s.heading)) err(`${sp}.heading`, 'required (a claim or question)');
    if (s.apply != null && typeof s.apply !== 'boolean') err(`${sp}.apply`, 'boolean');
    if (s.apply) applySections++;
    if (!Array.isArray(s.blocks) || s.blocks.length === 0) return err(`${sp}.blocks`, 'at least one block');
    let takeaways = 0;
    s.blocks.forEach((b, bi) => {
      const p = `${sp}.blocks[${bi}]`;
      if (!isObj(b)) return err(p, 'object expected');
      if (!BLOCK_TYPES.includes(b.type)) return err(`${p}.type`, `unknown block "${b.type}" (closed vocabulary: ${BLOCK_TYPES.join(', ')})`);
      const only = (keys) => {
        for (const k of Object.keys(b)) if (!['type', ...keys].includes(k)) err(`${p}.${k}`, `unknown field for "${b.type}"`);
      };
      const refList = (v, path) => {
        if (v != null && !(Array.isArray(v) && v.every((x) => isStr(x)))) err(path, 'array of reference ids');
      };
      switch (b.type) {
        case 'p':
          only(['text']);
          if (!isStr(b.text)) err(`${p}.text`, 'required');
          break;
        case 'list':
          only(['ordered', 'items']);
          if (b.ordered != null && typeof b.ordered !== 'boolean') err(`${p}.ordered`, 'boolean');
          if (!Array.isArray(b.items) || b.items.length < 2 || !b.items.every((x) => isStr(x))) err(`${p}.items`, '2+ strings');
          break;
        case 'takeaway':
          only(['text']);
          if (++takeaways > 1) err(p, 'at most one takeaway per section');
          if (!isStr(b.text)) err(`${p}.text`, 'required');
          break;
        case 'claim': {
          only(['evidence', 'refs', 'text']);
          if (!EVIDENCE_LEVELS.includes(b.evidence)) err(`${p}.evidence`, EVIDENCE_LEVELS.join(' | '));
          refList(b.refs, `${p}.refs`);
          if (!isStr(b.text)) err(`${p}.text`, 'required');
          break;
        }
        case 'callout':
          only(['kind', 'text']);
          if (!CALLOUT_KINDS.includes(b.kind)) err(`${p}.kind`, CALLOUT_KINDS.join(' | '));
          if (!isStr(b.text)) err(`${p}.text`, 'required');
          break;
        case 'table':
          only(['caption', 'columns', 'rows', 'refs']);
          if (++tables > LIMITS.tables) err(p, `at most ${LIMITS.tables} tables`);
          if (!isStr(b.caption)) err(`${p}.caption`, 'required');
          if (!Array.isArray(b.columns) || b.columns.length < 2 || b.columns.length > 5 || !b.columns.every((x) => isStr(x))) err(`${p}.columns`, '2–5 strings');
          if (!Array.isArray(b.rows) || !b.rows.length || !b.rows.every((r) => Array.isArray(r) && r.length === (b.columns || []).length))
            err(`${p}.rows`, 'rows with one cell per column');
          refList(b.refs, `${p}.refs`);
          break;
        case 'calculator': {
          only(['calculator', 'defaults']);
          if (++calculators > 1) err(p, 'at most one calculator per article');
          if (!s.apply) err(p, 'the calculator belongs in the "apply" section');
          const reg = CALCULATORS[b.calculator];
          if (!reg) err(`${p}.calculator`, `not in the registry (${Object.keys(CALCULATORS).join(', ')})`);
          else if (b.defaults != null) {
            if (!isObj(b.defaults)) err(`${p}.defaults`, 'object');
            else
              for (const [k, v] of Object.entries(b.defaults)) {
                const range = reg[k];
                if (!range) err(`${p}.defaults.${k}`, 'unknown parameter');
                else if (typeof v !== 'number' || v < range.min || v > range.max) err(`${p}.defaults.${k}`, `${range.min}–${range.max}`);
              }
          }
          break;
        }
        case 'cta':
          only([]);
          if (++ctas > 1) err(p, 'at most one contextual CTA');
          if (!s.apply) err(p, 'the contextual CTA belongs in the "apply" section');
          break;
        case 'gymon': {
          gymon++;
          if (!GYMON_KINDS.includes(b.kind)) {
            err(`${p}.kind`, GYMON_KINDS.join(' | '));
            break;
          }
          if (b.kind === 'log-example') {
            only(['kind', 'caption', 'exercise', 'sessions', 'text']);
            if (!isStr(b.exercise)) err(`${p}.exercise`, 'required');
            if (!isStr(b.caption)) err(`${p}.caption`, 'required');
            if (!Array.isArray(b.sessions) || b.sessions.length < 1 || b.sessions.length > 3) err(`${p}.sessions`, '1–3 sessions');
            (Array.isArray(b.sessions) ? b.sessions : []).forEach((ses, i) => {
              if (!isObj(ses) || !isStr(ses.label) || !Array.isArray(ses.sets) || ses.sets.length < 1 || ses.sets.length > 6)
                return err(`${p}.sessions[${i}]`, '{ label, sets: 1–6 }');
              ses.sets.forEach((st, j) => {
                const num = (v) => typeof v === 'number' && v >= 0 && v <= 1000;
                if (!isObj(st) || !num(st.kg) || !num(st.reps) || (st.previous != null && !(isObj(st.previous) && num(st.previous.kg) && num(st.previous.reps))))
                  err(`${p}.sessions[${i}].sets[${j}]`, '{ kg, reps, previous: { kg, reps } | null }');
              });
            });
          } else {
            only(['kind', 'heading', 'text', 'points']);
            if (!isStr(b.text)) err(`${p}.text`, 'required');
            if (b.points != null && !(Array.isArray(b.points) && b.points.every((x) => isStr(x)))) err(`${p}.points`, 'strings');
          }
          break;
        }
      }
    });
  });
  if (gymon !== 1) err('sections', `exactly one Gymon-unique block ("gymon") is required, found ${gymon}`);
  if (applySections !== 1) warn('sections', `expected exactly one "apply" section, found ${applySections}`);

  (Array.isArray(a.faq) ? a.faq : []).forEach((f, i) => {
    if (!isObj(f) || !isStr(f.q) || !isStr(f.a)) return err(`faq[${i}]`, '{ q, a, refs? }');
    for (const k of Object.keys(f)) if (!['q', 'a', 'refs'].includes(k)) err(`faq[${i}].${k}`, 'unknown field');
    const w = wordCount(f.a);
    if (w > 80) warn(`faq[${i}].a`, `${w} words (40–60 expected)`);
  });
  if (a.faq != null && (!Array.isArray(a.faq) || a.faq.length > LIMITS.faq[1])) err('faq', `0–${LIMITS.faq[1]} items`);
  if (a.quiz != null && (!Array.isArray(a.quiz) || a.quiz.length > LIMITS.quiz[1])) err('quiz', `0–${LIMITS.quiz[1]} items`);
  (Array.isArray(a.quiz) ? a.quiz : []).forEach((q, i) => {
    const p = `quiz[${i}]`;
    if (!isObj(q)) return err(p, 'object');
    for (const k of Object.keys(q)) if (!['question', 'options', 'correctIndex', 'explanation', 'refs'].includes(k)) err(`${p}.${k}`, 'unknown field');
    if (!isStr(q.question) || !isStr(q.explanation)) err(p, 'question and explanation required');
    if (!Array.isArray(q.options) || q.options.length < LIMITS.quizOptions[0] || q.options.length > LIMITS.quizOptions[1]) err(`${p}.options`, '2–4 options');
    else if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) err(`${p}.correctIndex`, 'index of the correct option');
  });
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
    if (u.kind === 'text') {
      for (const s of sentences(u.text)) {
        const w = s.split(/\s+/).length;
        if (w > LIMITS.sentenceWords) warn(u.path, `sentence of ${w} words (≤${LIMITS.sentenceWords})`);
      }
    }

    // Numbers must come from a cited, fully-read source quote.
    if (u.kind === 'gymon-example' || u.kind === 'heading' || u.kind === 'quiz') continue;
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
      warn(u.path, `number(s) ${check.join(', ')} without a citation`);
      continue;
    }
    const inRead = new Set(cited.filter((r) => r.fullTextRead).flatMap((r) => numbersIn(r.quote)));
    const inUnread = new Set(cited.filter((r) => !r.fullTextRead).flatMap((r) => numbersIn(r.quote)));
    for (const n of check) {
      if (inRead.has(n)) continue;
      if (inUnread.has(n) || (cited.length && cited.every((r) => !r.fullTextRead)))
        err(u.path, `number ${n} is attributed to a source whose full text was not read (fullTextRead: false)`);
      else warn(u.path, `number ${n} is not in the quote of any cited reference`);
    }
  }
  for (const id of refs.keys()) if (!used.has(id)) warn('references', `${id} is never cited`);
  if (ctx.publishedSlugs && (ctx.publishedSlugs[lang] || []).length >= LIMITS.internalLinks[0] && internal.length < LIMITS.internalLinks[0])
    warn('sections', `${internal.length} internal links (${LIMITS.internalLinks[0]}–${LIMITS.internalLinks[1]} expected)`);

  // Claims: evidence level vs sources, and GRADE-style wording.
  (Array.isArray(a.sections) ? a.sections : []).forEach((s, si) =>
    (isObj(s) && Array.isArray(s.blocks) ? s.blocks : []).forEach((b, bi) => {
      if (!isObj(b) || b.type !== 'claim' || !EVIDENCE_LEVELS.includes(b.evidence)) return;
      const p = `sections[${si}].blocks[${bi}]`;
      const cited = [...new Set([...(b.refs || []), ...refsIn(b.text)])].map((id) => refs.get(id)).filter(Boolean);
      if (!cited.length) err(p, 'a claim must cite at least one reference');
      const strongSource = cited.some((r) => (r.tier === 'PRIMARY' || r.tier === 'AUTHORITY') && r.fullTextRead);
      if ((b.evidence === 'strong' || b.evidence === 'moderate') && !strongSource)
        err(p, `"${b.evidence}" needs a PRIMARY/AUTHORITY reference whose full text was read`);
      if (cited.length && cited.every((r) => r.tier === 'SECONDARY') && !['limited', 'mixed', 'insufficient'].includes(b.evidence))
        err(p, 'claims resting only on SECONDARY sources are capped at "limited"');
      const words = (CERTAINTY_WORDS[lang] || {})[b.evidence] || [];
      const t = plainText(b.text).toLowerCase();
      if (words.length && !words.some((w) => t.includes(w.toLowerCase())))
        warn(p, `"${b.evidence}" evidence should be worded with: ${words.join(' / ')}`);
    }),
  );

  // Truncation (SEO §9.5: a hard failure) — the last text of the last section must end a sentence.
  const lastSection = Array.isArray(a.sections) && a.sections.length ? a.sections[a.sections.length - 1] : null;
  const lastText = lastSection && Array.isArray(lastSection.blocks)
    ? [...lastSection.blocks].reverse().map((b) => (isObj(b) ? b.text || (Array.isArray(b.items) ? b.items[b.items.length - 1] : '') : '')).find((t) => isStr(t))
    : null;
  if (lastSection && (!lastText || !/[.!?:)"”׳]\s*(\[\[[^\]]+\]\])?\s*$/.test(lastText.trim())))
    err('sections', 'the article ends mid-sentence (truncated?)');

  const words = units.reduce((n, u) => n + wordCount(u.text), 0);
  return { errors, warnings, stats: { words, readTime: Math.max(1, Math.round(words / (lang === 'he' ? 200 : 230))), refs: refs.size } };
}
