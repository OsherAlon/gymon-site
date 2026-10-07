/**
 * The article contract — ONE closed vocabulary shared by:
 *   - the site build (`src/content.config.ts` validates every article file with it), and
 *   - the n8n pipeline (`n8n/blog-articles/src/build.py` inlines this file and validate.mjs
 *     into the "Validate articles" Code node, and emits the writer's JSON Schema from it).
 *
 * Doctrine: ARTICLE_UX_DOCTRINE §8a/§8b, SEO_DOCTRINE §2–§4, §9.1.
 *
 * 🔴 Dependency-free and plain JS on purpose: an n8n Code node cannot import packages.
 * 🔴 No `\u` escapes and no `new URL()` anywhere in this file or validate.mjs — the n8n MCP
 *    update path turns `\uXXXX` into raw characters, and `new URL()` silently failed in an
 *    n8n Code node before (see n8n/blog-articles/README.md).
 */

export const SCHEMA_VERSION = 1;

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

export const LENGTH_BANDS = ['600-900', '900-1400', '1400-1800'];

/**
 * Evidence scale (§8b). ⚠ Open owner decision #4: GRADE's four levels vs this five-level
 * scale mapped to GRADE wording. The wording each level must use is in CERTAINTY_WORDS.
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
 * The Gymon-unique element ("information gain", SEO_DOCTRINE rule 2). Exactly one per article.
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

export const BLOCK_TYPES = ['p', 'list', 'takeaway', 'claim', 'callout', 'table', 'calculator', 'cta', 'gymon'];

export const LIMITS = {
  title: { min: 20, max: 52, hardMax: 70 },
  heroTitleWords: { min: 1, max: 4 },
  description: { en: [120, 155], he: [100, 145] },
  tags: [2, 4],
  keyTakeaways: [3, 5],
  sections: [4, 7],
  faq: [0, 5],
  quiz: [0, 3],
  quizOptions: [2, 4],
  tables: 3,
  references: [1, 20],
  tldrSentences: 3,
  sentenceWords: 25,
  internalLinks: [2, 4],
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
  'tldr', 'keyTakeaways', 'sections', 'faq', 'quiz', 'references', 'cta',
];
