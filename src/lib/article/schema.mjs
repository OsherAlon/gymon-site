/**
 * The article contract — ONE closed vocabulary shared by:
 *   - the site build (`src/content.config.ts` validates every article file with it), and
 *   - the n8n pipeline (`n8n/blog-articles/src/build.py` inlines this file and validate.mjs
 *     into the "Validate articles" Code node, and emits the writer's JSON Schema from it).
 *
 * Doctrine: ARTICLE_UX_DOCTRINE §8a/§8b, SEO_DOCTRINE §2–§4, §9.1 — overridden where they conflict by
 * the user's v3 decision (2026-10-07, reference: Headspace articles): "it should feel like scrolling,
 * not reading". An article is a short relatable hook, a one-sentence takeaway, 3–6 "beats" (a plain
 * headline that IS the point + 1–3 short sentences), an optional pull quote, a short "try it" list,
 * and quiet extras (calculator, Gymon block, sources) at the bottom. Headlines alone tell the story.
 *
 * 🔴 Dependency-free and plain JS on purpose: an n8n Code node cannot import packages.
 * 🔴 No `\u` escapes and no `new URL()` anywhere in this file or validate.mjs — the n8n MCP
 *    update path turns `\uXXXX` into raw characters, and `new URL()` silently failed in an
 *    n8n Code node before (see n8n/blog-articles/README.md).
 */

export const SCHEMA_VERSION = 3;

export const LANGS = ['en', 'he'];

/**
 * Topic pillars (SEO_DOCTRINE §3). Pillar 5 ("strength training for women and 40+/50+,
 * incl. menopause") is deliberately ABSENT: the doctrine rates it medium–high YMYL and the
 * user decided there is no credentialed reviewer. Supplements/nutrition were never a pillar.
 */
export const PILLARS = ['progressive-overload', 'sets-reps-volume', 'plans-splits', 'home-gym', 'tools'];

export const INTENTS = ['know', 'do'];

/** User decision 2026-10-03: no high-YMYL topics. Only `low` passes the guard. */
export const YMYL_LEVELS = ['low'];

/** v3: short. Whatever keeps it effortless — no padding to a word count (user decision 2026-10-07). */
export const LENGTH_BANDS = ['short'];

/**
 * Evidence scale (§8b). ⚠ Open owner decision #4: GRADE's four levels vs this five-level scale.
 * v2+: the level is shown ONLY in the sources list (reference.certainty), never as a badge in the
 * body. The body says it in plain words ("research suggests"). CERTAINTY_WORDS is kept for the
 * n8n v1 pipeline until it is migrated.
 */
export const EVIDENCE_LEVELS = ['strong', 'moderate', 'limited', 'mixed', 'insufficient'];

/** GRADE-style plain-language verbs per level (lint, warnings only). */
export const CERTAINTY_WORDS = {
  en: {
    strong: ['results in', 'reliably', 'consistently'],
    moderate: ['probably', 'likely'],
    limited: ['may', 'might', 'could'],
    mixed: ['mixed', 'unclear', 'uncertain', 'inconsistent'],
    insufficient: ['uncertain', 'not enough', 'unknown', 'too little'],
  },
  he: {
    strong: ['מביא ל', 'מביאה ל', 'באופן עקבי', 'בעקביות'],
    moderate: ['כנראה', 'ככל הנראה', 'סביר'],
    limited: ['ייתכן', 'עשוי', 'עשויה', 'עשויים', 'אולי'],
    mixed: ['אינן חד-משמעיות', 'לא חד-משמעיות', 'סותרות', 'מעורבות'],
    insufficient: ['אין מספיק', 'לא ידוע', 'לא ברור'],
  },
};

export const REF_TIERS = ['PRIMARY', 'AUTHORITY', 'SECONDARY'];
export const REF_TYPES = [
  'meta-analysis',
  'systematic-review',
  'rct',
  'cohort',
  'cross-sectional',
  'review',
  'position-stand',
  'guideline',
  'other',
];

export const CALLOUT_KINDS = ['note', 'myth', 'safety'];

/** CTA copy lives in src/copy.mjs (`blog.ctaSlots`) — the writer only picks the slot. */
export const CTA_SLOTS = ['log-sets', 'track-progress', 'plan-builder'];

/**
 * The Gymon-unique element ("information gain", SEO_DOCTRINE rule 2). v2+: optional, at most one,
 * placed low and quiet, and only when it fits the topic (user decision 2026-10-07).
 *   log-example      — an ILLUSTRATIVE logging table (SET | PREVIOUS | KG | REPS | ✓). Its numbers
 *                      are an example, labelled as such, and exempt from the source-number check.
 *   plan-logic       — how Gymon's plan builder decides (from the supplied Gymon material).
 *   teardown-finding — a finding from Gymon's review of competitor apps (supplied material).
 */
export const GYMON_KINDS = ['log-example', 'plan-logic', 'teardown-finding'];

/** Interactive registry (§3, §8b rule 11). Defaults must sit inside these ranges. */
export const CALCULATORS = {
  'one-rep-max': {
    weightKg: { min: 1, max: 500, default: 80 },
    reps: { min: 1, max: 12, default: 5 },
  },
};

/** v1 block vocabulary — kept only for the n8n v1 pipeline until it is migrated. v2+ has no blocks. */
export const BLOCK_TYPES = ['p', 'list', 'takeaway', 'claim', 'callout', 'table', 'calculator', 'cta', 'gymon'];

export const LIMITS = {
  title: { min: 20, max: 52, hardMax: 70 },
  heroTitleWords: { min: 1, max: 4 },
  description: { en: [120, 155], he: [100, 145] },
  tags: [2, 4],
  hookSentences: 2,
  hookWords: 35,
  bottomLineWords: 25,
  beats: [3, 6],
  beatHeadingWords: 9,
  beatSentences: 3,
  beatWords: 45,
  beatNumbers: 1,
  tips: [3, 5],
  tipWords: 20,
  pullQuoteWords: 30,
  references: [1, 12],
  findingWords: 45,
  sentenceWords: 20,
  // A ceiling, not a target: past it the article stops feeling like a scroll. Hebrew runs ~20–25%
  // fewer words than English for the same text.
  words: { en: [150, 450], he: [110, 360] },
  internalLinks: [1, 3],
};

/** Hosts that never count as a source (§8b rule 8, SEO §2). */
export const COMMERCIAL_HOST = /(amazon\.|ebay\.|walmart\.|iherb\.|bodybuilding\.com|myprotein|gnc\.com|kidneystronger\.com|mtntactical\.com|\/\/(shop|store)\.)/i;

/** Tracking parameters that must not survive in a reference URL. */
export const TRACKING_PARAM = /[?&](utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|cmpid|icid|s_cid)=/i;

/** The same tiering the research pack uses (pick_pages.js / research_pack.js). */
export const PRIMARY_HOST = /(pubmed\.ncbi\.nlm\.nih\.gov|pmc\.ncbi\.nlm\.nih\.gov|ncbi\.nlm\.nih\.gov\/pmc|doi\.org|bjsm\.bmj\.com|bmj\.com|link\.springer\.com|springeropen\.com|biomedcentral\.com|frontiersin\.org|journals\.lww\.com|journals\.physiology\.org|tandfonline\.com|jissn|sciencedirect\.com|onlinelibrary\.wiley\.com|mdpi\.com|nature\.com|cochranelibrary\.com|journals\.plos\.org|jamanetwork\.com|thelancet\.com|academic\.oup\.com|journals\.sagepub\.com|humankinetics\.com|biolsport\.com|termedia\.pl)/i;
export const AUTHORITY_HOST = /(acsm\.org|nsca\.com|sportsnutritionsociety\.org|\.gov(\/|$|\.)|nih\.gov|who\.int|nhs\.uk|\.edu(\/|$)|\.ac\.[a-z]{2}(\/|$)|ausport\.gov\.au)/i;
export const tierOfUrl = (u) => (PRIMARY_HOST.test(u) ? 'PRIMARY' : AUTHORITY_HOST.test(u) ? 'AUTHORITY' : 'SECONDARY');

/**
 * YMYL topic guard (user decision: no supplements, weight loss, injuries, pregnancy, medical).
 * Matched against slug/topic/title/primary query — a hit means the topic is rejected.
 * Hebrew stems are raw letters (no \u escapes, see the header).
 */
export const YMYL_TOPIC = new RegExp(
  [
    'supplement', 'creatine', 'protein powder', 'whey', 'caffeine', 'pre-?workout', 'vitamin', 'steroid',
    'weight[- ]?loss', 'fat[- ]?loss', 'lose weight', 'diet', 'calori', 'bmi\\b', 'keto', 'fasting',
    'injur', 'pain', 'rehab', 'physio', 'tendin', 'surgery',
    'pregnan', 'postpartum', 'menopaus', 'menstrua',
    'diabet', 'hypertens', 'blood pressure', 'cancer', 'osteopor', 'arthritis', 'disease', 'medical', 'medication', 'drug',
    'eating disorder',
    'תוסף', 'תוספי', 'קריאטין', 'אבקת חלבון', 'ירידה במשקל', 'הרזיה', 'דיאטה', 'קלורי', 'פציע', 'כאב', 'שיקום',
    'הריון', 'היריון', 'לידה', 'גיל המעבר', 'סוכרת', 'לחץ דם', 'מחלה', 'תרופ',
  ].join('|'),
  'i',
);

/** Gendered Hebrew forms that address ONE reader (project rule: gender-neutral Hebrew). */
export const HE_GENDERED_WORDS = [
  'אתה', 'תוכל', 'תוכלי', 'תרצה', 'תרצי', 'תצטרך', 'תצטרכי', 'תרגיש', 'תרגישי', 'תראה', 'תראי',
  'נסה', 'נסי', 'הזן', 'הזיני', 'קח', 'קחי', 'תן', 'תני', 'שים', 'שימי', 'זכור', 'זכרי',
  'בצע', 'בצעי', 'הקפד', 'הקפידי', 'הוסף', 'הוסיפי', 'רשום', 'רשמי', 'התחל', 'התחילי',
  'בחר', 'בחרי', 'הרם', 'הרימי', 'הורד', 'הורידי', 'המשך', 'המשיכי', 'עצור', 'עצרי',
  'המתאמן', 'המתאמנת',
];

/** Fields the pipeline (code), not the writer, owns. The writer's JSON Schema omits them. */
export const CODE_FIELDS = [
  'schemaVersion', 'lang', 'slug', 'pillar', 'tags', 'intent', 'ymylLevel', 'lengthBand', 'image',
  'imageAiGenerated', 'createdAt', 'updatedAt', 'reviewedAt', 'editor', 'aiAssisted', 'sample',
];

export const TOP_LEVEL_KEYS = [
  ...CODE_FIELDS,
  'title', 'heroTitle', 'description', 'primaryQuery', 'imageAlt',
  'hook', 'bottomLine', 'beats', 'pullQuote', 'tips', 'calculator', 'gymon', 'references', 'cta',
];

/** Gym words written in Hebrew letters but not Hebrew (user decision: "עומס הדרגתי", not a transliteration). */
export const HE_TRANSLITERATIONS = [
  { re: 'פרוגרסיב|אוברלואד|פרוגרסיבי', use: 'עומס הדרגתי' },
  { re: 'ריפטים|ריפים', use: 'חזרות' },
  { re: 'וורקאאוט|וורקאוט', use: 'אימון' },
];
