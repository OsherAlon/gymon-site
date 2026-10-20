import { workflow, node, trigger, sticky, ifElse, languageModel, outputParser, expr } from '@n8n/workflow-sdk';

const T_ARTICLES = { __rl: true, mode: 'id', value: 't7r8sTFqvaGTXQZ9', cachedResultName: 'gymon_blog_articles' };
const T_VERSIONS = { __rl: true, mode: 'id', value: '6Q3AzxAZ066QgsoI', cachedResultName: 'gymon_blog_versions' };
const T_SOURCES = { __rl: true, mode: 'id', value: 'gE6f3TQh4YsTqHQk', cachedResultName: 'gymon_blog_sources' };

const CRED_OPENROUTER = { openRouterApi: { id: 'r7iH8Td6bDg9JsVf', name: 'osheralon5@gmail.com-Achordli' } };
const CRED_GEMINI = { googlePalmApi: { id: 'HOstAjpYB1HvLdVR', name: 'osheralon5@gmail.com' } };
const CRED_GMAIL = { gmailOAuth2: { id: '2MntuHdkPCPZn4Fb', name: 'osheralon5@gmail.com' } };
const CRED_TAVILY = { tavilyApi: { id: 'c35RkiJeUqxZ9eXO', name: 'osheralon5@gmail.com' } };
const CRED_CLOUDINARY = { cloudinaryApi: { id: '9N3ayVo3Ijc7tDs4', name: 'osheralon5@gmail.com_DEV AI' } };

// The writer, Hebrew and rewrite calls are HTTP nodes: their model, max_tokens and reasoning effort
// are written inside each jsonBody expression (Sonnet 5.5, effort low). Hidden reasoning is billed
// as completion: execution 1531 cut off at 6,000 and execution 1539 at 16,000 max tokens.
const MODEL_EDIT = 'anthropic/claude-sonnet-5.5';
const MODEL_FAST = 'anthropic/claude-haiku-4.5';
const IMAGE_MODEL = { __rl: true, mode: 'id', value: 'models/gemini-3-pro-image-preview' };
const REVIEW_EMAIL = 'gymon.official@gmail.com';

const GH_HEADERS = { parameters: [
  { name: 'Accept', value: 'application/vnd.github+json' },
  { name: 'X-GitHub-Api-Version', value: '2022-11-28' },
] };
const CRED_GITHUB = { githubApi: { id: '87ElEfiIizw4AWkh', name: 'GitHub gymon-site' } };

const IF_OPTS = { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 };



const scheduleTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Sunday 09:00 (weekly)',
    parameters: { rule: { interval: [{ field: 'weeks', weeksInterval: 1, triggerAtDay: [0], triggerAtHour: 9, triggerAtMinute: 0 }] } },
  },
  output: [{}],
});

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Run once (test)' },
  output: [{}],
});

const getUsedSources = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get used sources',
    executeOnce: true,
    alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: T_SOURCES, returnAll: true },
  },
  output: [{ id: 1, source_url: 'https://example.org/a', topic: 'Rest between sets', slug: 'rest-between-sets' }],
});

const getPublished = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get published articles',
    executeOnce: true,
    alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'get', dataTableId: T_ARTICLES, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'status', condition: 'eq', keyValue: 'committed' }] },
      returnAll: true,
    },
  },
  output: [{ slug: 'progressive-overload', title_en: 'Progressive overload', title_he: 'פרוגרסיב אוברלואד', pillar: 'progressive-overload', status: 'committed' }],
});

const feedList = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Feed list',
    executeOnce: true,
    parameters: { mode: 'raw', jsonOutput: "{\n  \"feeds\": [\n    {\n      \"name\": \"strongerbyscience.com\",\n      \"url\": \"https://www.strongerbyscience.com/feed/\"\n    },\n    {\n      \"name\": \"rpstrength.com\",\n      \"url\": \"https://rpstrength.com/blogs/articles.atom\"\n    },\n    {\n      \"name\": \"sciencedaily.com/fitness\",\n      \"url\": \"https://www.sciencedaily.com/rss/health_medicine/fitness.xml\"\n    },\n    {\n      \"name\": \"sciencedaily.com/sports_medicine\",\n      \"url\": \"https://www.sciencedaily.com/rss/health_medicine/sports_medicine.xml\"\n    },\n    {\n      \"name\": \"bjsm.bmj.com (online first)\",\n      \"url\": \"https://bjsm.bmj.com/rss/ahead.xml\"\n    },\n    {\n      \"name\": \"journals.physiology.org/jappl\",\n      \"url\": \"https://journals.physiology.org/action/showFeed?type=etoc&feed=rss&jc=jappl\"\n    },\n    {\n      \"name\": \"frontiersin.org/sports-and-active-living\",\n      \"url\": \"https://www.frontiersin.org/journals/sports-and-active-living/rss\"\n    },\n    {\n      \"name\": \"frontiersin.org/exercise-physiology\",\n      \"url\": \"https://www.frontiersin.org/journals/physiology/sections/exercise-physiology/rss\"\n    },\n    {\n      \"name\": \"tandfonline.com/JISSN\",\n      \"url\": \"https://www.tandfonline.com/feed/rss/rssn20\"\n    },\n    {\n      \"name\": \"acsm.org\",\n      \"url\": \"https://www.acsm.org/feed\"\n    },\n    {\n      \"name\": \"nsca.com\",\n      \"url\": \"https://www.nsca.com/rss\"\n    }\n  ]\n}" },
  },
  output: [{ feeds: [{ name: 'strongerbyscience.com', url: 'https://www.strongerbyscience.com/feed/' }] }],
});

const splitFeeds = node({
  type: 'n8n-nodes-base.splitOut',
  version: 1,
  config: { name: 'One item per feed', parameters: { fieldToSplitOut: 'feeds', options: {} } },
  output: [{ name: 'strongerbyscience.com', url: 'https://www.strongerbyscience.com/feed/' }],
});

const readFeed = node({
  type: 'n8n-nodes-base.rssFeedRead',
  version: 1.2,
  config: {
    name: 'Read feed',
    onError: 'continueRegularOutput',
    parameters: { url: expr('{{ $json.url }}'), options: {} },
  },
  output: [{ title: 'Rest intervals and hypertrophy', link: 'https://example.org/a', isoDate: '2026-09-30T10:00:00.000Z', contentSnippet: 'A meta-analysis…' }],
});

const shortlist = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Shortlist candidates', parameters: { mode: 'runOnceForAllItems', jsCode: "// Shortlist candidates — runs once for all RSS items.\n// Drops items already used (gymon_blog_sources), off-topic items, items older than MAX_AGE_DAYS,\n// and duplicates; then interleaves by site so one busy feed cannot fill the list.\n// Always returns ONE item with counters, so an empty shortlist is visible in the execution\n// (the next IF stops the run when candidates is empty).\n// No `new URL()` here: execution 1530 returned 0 items from 462 feed items while the same code\n// and data gave 88 candidates locally — the only silent drop was the URL parse in a try/catch.\nconst MAX_AGE_DAYS = 30;\nconst MAX_CANDIDATES = 30;\n\nconst usedRows = $('Get used sources').all().map(i => i.json).filter(r => r && r.source_url);\nconst used = new Set(usedRows.map(r => String(r.source_url).trim()));\nconst usedTopics = usedRows.map(r => r.topic).filter(Boolean).slice(-60);\n// Published articles (status committed): no-repeat list for the topic picker, link targets for the writer.\nconst published = $('Get published articles').all().map(i => i.json).filter(r => r && r.slug && r.status === 'committed')\n  .map(r => ({ slug: r.slug, title_en: r.title_en, title_he: r.title_he, pillar: r.pillar || '' }));\n\n// No supplement / nutrition / injury terms: those topics are never written (no credentialed reviewer).\nconst relevant = /(strength|resistance (training|exercise)|weight[- ]?(lifting|training)|lifting|hypertroph|muscle|squat|deadlift|bench press|\\bsets?\\b|\\breps?\\b|repetition|training volume|progressive overload|rest interval|inter-set|warm[- ]?up|exercise|workout|fitness|power training|1rm|one-repetition|deload|periodi[sz]|adherence|training frequency|split)/i;\nconst exclude = /\\b(mice|mouse|murine|rats?|zebrafish|in vitro|drosophila|cell line|supplement\\w*|creatine|caffeine|diet\\w*|weight loss|obes\\w*|injur\\w*|pain|rehab\\w*|pregnan\\w*|postpartum|menopaus\\w*|diabet\\w*|cancer|patients?|disease)\\b/i;\n\nconst cutoff = Date.now() - MAX_AGE_DAYS * 864e5;\nconst seen = new Set();\nconst all = [];\nconst count = { feed_items: 0, no_link: 0, already_used: 0, duplicate: 0, off_topic: 0, too_old: 0, kept: 0 };\nconst hostOf = u => (String(u).match(/^https?:\\/\\/([^\\/?#:]+)/i) || [, ''])[1].toLowerCase().replace(/^www\\./, '');\n\nfor (const item of $input.all()) {\n  count.feed_items++;\n  const j = item.json || {};\n  const link = String(j.link || j.guid || '').trim();\n  if (!/^https?:\\/\\//.test(link)) { count.no_link++; continue; }\n  if (used.has(link)) { count.already_used++; continue; }\n  if (seen.has(link)) { count.duplicate++; continue; }\n  const title = String(j.title || '').replace(/\\s+/g, ' ').trim();\n  const snippet = String(j.contentSnippet || j.content || j.summary || '')\n    .replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim().slice(0, 500);\n  const text = `${title} ${snippet}`;\n  if (!title || !relevant.test(text) || exclude.test(text)) { count.off_topic++; continue; }\n  const d = Date.parse(j.isoDate || j.pubDate || j.date || '');\n  if (!isNaN(d) && d < cutoff) { count.too_old++; continue; }\n  const host = hostOf(link) || 'unknown';\n  seen.add(link);\n  count.kept++;\n  all.push({ title, link, snippet, host, date: isNaN(d) ? '' : new Date(d).toISOString().slice(0, 10) });\n}\n\nall.sort((a, b) => (b.date || '').localeCompare(a.date || ''));\nconst byHost = {};\nfor (const c of all) (byHost[c.host] = byHost[c.host] || []).push(c);\nconst picked = [];\nlet added = true;\nwhile (picked.length < MAX_CANDIDATES && added) {\n  added = false;\n  for (const h of Object.keys(byHost)) {\n    const c = byHost[h].shift();\n    if (c) { picked.push(c); added = true; }\n    if (picked.length >= MAX_CANDIDATES) break;\n  }\n}\n\nreturn [{ json: { candidates: picked, used_topics: usedTopics, published, used_slugs: usedRows.map(r => r.slug).filter(Boolean), candidate_count: all.length, counts: count } }];\n" } },
  output: [{ candidates: [{ title: 'Rest intervals and hypertrophy', link: 'https://example.org/a', snippet: '…', host: 'example.org', date: '2026-09-30' }], used_topics: [], used_slugs: [], candidate_count: 1 }],
});

const anyCandidates = ifElse({
  version: 2.2,
  config: {
    name: 'Any candidates?',
    parameters: {
      conditions: {
        options: IF_OPTS,
        conditions: [{ leftValue: expr('{{ ($json.candidates || []).length > 0 }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const topicModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Sonnet — topic', parameters: { model: MODEL_EDIT, options: { temperature: 0.4 } }, credentials: CRED_OPENROUTER },
});

const topicParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: { name: 'Topic plan format', parameters: { schemaType: 'fromJson', jsonSchemaExample: "{\n  \"skip\": false,\n  \"candidate_index\": 0,\n  \"source_url\": \"https://example.org/article\",\n  \"source_title\": \"Source title\",\n  \"topic\": \"How many sets per muscle per week should I do?\",\n  \"angle\": \"What the dose-response evidence shows, and how a plan turns it into sets per session.\",\n  \"slug\": \"sets-per-muscle-per-week\",\n  \"pillar\": \"sets-reps-volume\",\n  \"intent\": \"know\",\n  \"ymyl_level\": \"low\",\n  \"length_band\": \"900-1400\",\n  \"tags\": [\n    \"training-volume\",\n    \"sets\"\n  ],\n  \"primary_query_en\": \"how many sets per muscle per week\",\n  \"primary_query_he\": \"כמה סטים לכל שריר בשבוע\",\n  \"paa_en\": [\n    \"Is 10 sets per muscle per week enough?\",\n    \"Do warm-up sets count?\"\n  ],\n  \"paa_he\": [\n    \"כמה סטים צריך לכל שריר?\",\n    \"האם סטים של חימום נחשבים?\"\n  ],\n  \"gymon_element\": {\n    \"kind\": \"plan-logic\",\n    \"use\": \"How the plan builder keeps sets per exercise between 2 and 4 and adds an exercise instead.\"\n  },\n  \"search_queries\": [\n    \"weekly set volume hypertrophy dose-response meta-analysis\",\n    \"resistance training volume position stand\"\n  ],\n  \"reason\": \"A new meta-analysis on a question with a thin Hebrew SERP.\"\n}" } },
});

const pickTopic = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Pick topic',
    parameters: {
      promptType: 'define',
      text: expr("Already published (do not repeat; these are also the internal-link targets):\n{{ ($json.published || []).map(p => p.slug + ' [' + (p.pillar || '?') + '] ' + p.title_en).join('\\n') || '(none yet)' }}\n\nAlready used topics (do not repeat):\n{{ ($json.used_topics || []).join('\\n') || '(none yet)' }}\n\nCandidates (index: site | date | title | snippet | link):\n{{ $json.candidates.map((c, i) => i + ': ' + c.host + ' | ' + (c.date || 'n/a') + ' | ' + c.title + ' | ' + c.snippet + ' | ' + c.link).join('\\n') }}"),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: "You are the editor of the Gymon blog. Gymon is a strength-training and workout-logging app: people log sets, reps and weights, see last session's numbers next to every set, and follow a plan built from their goal, experience, equipment and training days. The blog is published in English and Hebrew. It exists to answer real search questions better than the current results, with evidence, and with something only Gymon can add.\n\nTask: pick ONE candidate from the list and plan ONE evergreen article. The candidate is only the fresh, sourced reason to write; the article answers a question people actually search for. It is never a news report and never a summary of the candidate.\n\nPILLARS — the topic must belong to exactly one (otherwise skip):\n- progressive-overload: progressive overload, plateaus, logging and tracking progress, personal records, rep maxes\n- sets-reps-volume: sets per muscle per week, reps, RPE/RIR, proximity to failure, rest between sets, deloads, warm-up sets\n- plans-splits: full body, upper/lower, push/pull/legs, plans by training days and experience level\n- home-gym: strength training at home with dumbbells or no equipment, gym vs home\n- tools: calculators and how to use them (the site has a 1RM calculator)\n\nNEVER (return skip=true): supplements of any kind (creatine, protein powder, caffeine, vitamins), diets, weight loss or fat loss, calories or BMI, injuries, pain or rehab, pregnancy or postpartum, menopause or menstrual-cycle physiology, any medical condition or medication, eating behaviour. These are high-YMYL health topics and the blog has no credentialed medical reviewer. Also skip: city or location queries, equipment shopping, app comparisons that rank competitors, animal or cell studies, and anything in the \"already published / already used\" lists (propose nothing that overlaps their search intent).\n\nPrefer, in this order: a pillar that has no published article yet; the Hebrew gaps (a Hebrew progressive-overload + logging guide built around the SET | PREVIOUS | KG | REPS | ✓ table; a Hebrew weekly-sets guide; Hebrew splits tied to training days; 1RM explainers); candidates that rest on reviews, meta-analyses or position stands.\n\nFields:\n- skip: true if no candidate fits the rules above (then the other fields may be empty).\n- candidate_index, source_url, source_title: the chosen candidate.\n- topic: the reader's search question, in English.\n- angle: 1–2 sentences on what the article will say that the current search results do not.\n- slug: 3–6 lowercase English words with dashes, keyword first, no dates.\n- pillar: one of the five pillar ids.\n- intent: \"know\" (explain) or \"do\" (how-to).\n- ymyl_level: \"low\" for every allowed topic. Anything else means you should have skipped.\n- length_band: \"600-900\" for a narrow question, \"900-1400\" for a standard explainer, \"1400-1800\" for a pillar guide.\n- tags: 2–4 lowercase kebab-case tags.\n- primary_query_en: the English query, as typed.\n- primary_query_he: the Hebrew query in the form Israelis actually type (e.g. \"תוכנית אימון\", \"סקוואט\", \"פול בודי\", \"1RM\", \"פרוגרסיב אוברלואד\"). Never \"כפיפות ברכיים\" for squat (it means the leg-curl machine). Pair English acronyms with Hebrew.\n- paa_en / paa_he: 3–5 \"people also ask\" questions per language, phrased the way each audience asks (Hebrew: \"כמה…\", \"מה זה…\", \"איך…\") — not literal translations.\n- gymon_element: which part of the GYMON MATERIAL gives this article its unique block — \"log-example\", \"plan-logic\" or \"teardown-finding\" — and one sentence on how it will be used.\n- search_queries: 3–5 English queries for authoritative evidence (meta-analyses, systematic reviews, ACSM/NSCA position stands, peer-reviewed journals).\n- reason: one sentence on why this candidate and topic.\n\nReturn only the JSON.\n" }] },
    },
    subnodes: { model: topicModel, outputParser: topicParser },
  },
  output: [{ output: { skip: false, candidate_index: 0, source_url: 'https://example.org/a', source_title: 'Rest intervals', topic: 'How long to rest between sets', angle: '…', slug: 'rest-between-sets', primary_keyword_en: 'rest between sets', primary_keyword_he: 'מנוחה בין סטים', search_queries: ['rest interval meta-analysis'], reason: '…' } }],
});

const hasTopic = ifElse({
  version: 2.2,
  config: {
    name: 'Topic found?',
    parameters: {
      conditions: {
        options: IF_OPTS,
        conditions: [{ leftValue: expr('{{ !!$json.output && $json.output.skip !== true && !!$json.output.slug }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const topicPlan = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Topic plan', parameters: { mode: 'runOnceForAllItems', jsCode: "// Topic plan — the picked topic, a safe slug, and the YMYL / pillar guard.\n// The guard is the shared validator's (src/lib/article), so a topic that passes here also\n// passes the build. A topic that fails ends the run before any research is paid for.\n// ===== article constants (site src/lib/article/schema.mjs) + pipeline helpers — generated by build.py =====\n// ---- schema.mjs (generated from the site repo; edit there) ----\nconst SCHEMA_VERSION = 1;\nconst LANGS = ['en', 'he'];\nconst PILLARS = ['progressive-overload', 'sets-reps-volume', 'plans-splits', 'home-gym', 'tools'];\nconst INTENTS = ['know', 'do'];\nconst YMYL_LEVELS = ['low'];\nconst LENGTH_BANDS = ['600-900', '900-1400', '1400-1800'];\nconst EVIDENCE_LEVELS = ['strong', 'moderate', 'limited', 'mixed', 'insufficient'];\nconst CERTAINTY_WORDS = {\nen: {\nstrong: ['results in', 'reliably', 'consistently'],\nmoderate: ['probably', 'likely'],\nlimited: ['may', 'might', 'could'],\nmixed: ['mixed', 'unclear', 'uncertain', 'inconsistent'],\ninsufficient: ['uncertain', 'not enough', 'unknown', 'too little'],\n},\nhe: {\nstrong: ['מביא ל', 'מביאה ל', 'באופן עקבי', 'בעקביות'],\nmoderate: ['כנראה', 'ככל הנראה', 'סביר'],\nlimited: ['ייתכן', 'עשוי', 'עשויה', 'עשויים', 'אולי'],\nmixed: ['אינן חד-משמעיות', 'לא חד-משמעיות', 'סותרות', 'מעורבות'],\ninsufficient: ['אין מספיק', 'לא ידוע', 'לא ברור'],\n},\n};\nconst REF_TIERS = ['PRIMARY', 'AUTHORITY', 'SECONDARY'];\nconst REF_TYPES = [\n'meta-analysis',\n'systematic-review',\n'rct',\n'cohort',\n'cross-sectional',\n'review',\n'position-stand',\n'guideline',\n'other',\n];\nconst CALLOUT_KINDS = ['note', 'myth', 'safety'];\nconst CTA_SLOTS = ['log-sets', 'track-progress', 'plan-builder'];\nconst GYMON_KINDS = ['log-example', 'plan-logic', 'teardown-finding'];\nconst CALCULATORS = {\n'one-rep-max': {\nweightKg: { min: 1, max: 500, default: 80 },\nreps: { min: 1, max: 12, default: 5 },\n},\n};\nconst BLOCK_TYPES = ['p', 'list', 'takeaway', 'claim', 'callout', 'table', 'calculator', 'cta', 'gymon'];\nconst LIMITS = {\ntitle: { min: 20, max: 52, hardMax: 70 },\nheroTitleWords: { min: 1, max: 4 },\ndescription: { en: [120, 155], he: [100, 145] },\ntags: [2, 4],\nkeyTakeaways: [3, 5],\nsections: [4, 7],\nfaq: [0, 5],\nquiz: [0, 3],\nquizOptions: [2, 4],\ntables: 3,\nreferences: [1, 20],\ntldrSentences: 3,\nsentenceWords: 25,\ninternalLinks: [2, 4],\n};\nconst COMMERCIAL_HOST = /(amazon\\.|ebay\\.|walmart\\.|iherb\\.|bodybuilding\\.com|myprotein|gnc\\.com|kidneystronger\\.com|mtntactical\\.com|\\/\\/(shop|store)\\.)/i;\nconst TRACKING_PARAM = /[?&](utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|cmpid|icid|s_cid)=/i;\nconst PRIMARY_HOST = /(pubmed\\.ncbi\\.nlm\\.nih\\.gov|pmc\\.ncbi\\.nlm\\.nih\\.gov|ncbi\\.nlm\\.nih\\.gov\\/pmc|doi\\.org|bjsm\\.bmj\\.com|bmj\\.com|link\\.springer\\.com|springeropen\\.com|biomedcentral\\.com|frontiersin\\.org|journals\\.lww\\.com|journals\\.physiology\\.org|tandfonline\\.com|jissn|sciencedirect\\.com|onlinelibrary\\.wiley\\.com|mdpi\\.com|nature\\.com|cochranelibrary\\.com|journals\\.plos\\.org|jamanetwork\\.com|thelancet\\.com|academic\\.oup\\.com|journals\\.sagepub\\.com|humankinetics\\.com|biolsport\\.com|termedia\\.pl)/i;\nconst AUTHORITY_HOST = /(acsm\\.org|nsca\\.com|sportsnutritionsociety\\.org|\\.gov(\\/|$|\\.)|nih\\.gov|who\\.int|nhs\\.uk|\\.edu(\\/|$)|\\.ac\\.[a-z]{2}(\\/|$)|ausport\\.gov\\.au)/i;\nconst tierOfUrl = (u) => (PRIMARY_HOST.test(u) ? 'PRIMARY' : AUTHORITY_HOST.test(u) ? 'AUTHORITY' : 'SECONDARY');\nconst YMYL_TOPIC = new RegExp(\n[\n'supplement', 'creatine', 'protein powder', 'whey', 'caffeine', 'pre-?workout', 'vitamin', 'steroid',\n'weight[- ]?loss', 'fat[- ]?loss', 'lose weight', 'diet', 'calori', 'bmi\\\\b', 'keto', 'fasting',\n'injur', 'pain', 'rehab', 'physio', 'tendin', 'surgery',\n'pregnan', 'postpartum', 'menopaus', 'menstrua',\n'diabet', 'hypertens', 'blood pressure', 'cancer', 'osteopor', 'arthritis', 'disease', 'medical', 'medication', 'drug',\n'eating disorder',\n'תוסף', 'תוספי', 'קריאטין', 'אבקת חלבון', 'ירידה במשקל', 'הרזיה', 'דיאטה', 'קלורי', 'פציע', 'כאב', 'שיקום',\n'הריון', 'היריון', 'לידה', 'גיל המעבר', 'סוכרת', 'לחץ דם', 'מחלה', 'תרופ',\n].join('|'),\n'i',\n);\nconst HE_GENDERED_WORDS = [\n'אתה', 'תוכל', 'תוכלי', 'תרצה', 'תרצי', 'תצטרך', 'תצטרכי', 'תרגיש', 'תרגישי', 'תראה', 'תראי',\n'נסה', 'נסי', 'הזן', 'הזיני', 'קח', 'קחי', 'תן', 'תני', 'שים', 'שימי', 'זכור', 'זכרי',\n'בצע', 'בצעי', 'הקפד', 'הקפידי', 'הוסף', 'הוסיפי', 'רשום', 'רשמי', 'התחל', 'התחילי',\n'בחר', 'בחרי', 'הרם', 'הרימי', 'הורד', 'הורידי', 'המשך', 'המשיכי', 'עצור', 'עצרי',\n'המתאמן', 'המתאמנת',\n];\nconst CODE_FIELDS = [\n'schemaVersion', 'lang', 'slug', 'pillar', 'tags', 'intent', 'ymylLevel', 'lengthBand', 'image',\n'imageAiGenerated', 'createdAt', 'updatedAt', 'reviewedAt', 'editor', 'aiAssisted', 'sample',\n];\nconst TOP_LEVEL_KEYS = [\n...CODE_FIELDS,\n'title', 'heroTitle', 'description', 'primaryQuery', 'imageAlt',\n'tldr', 'keyTakeaways', 'sections', 'faq', 'quiz', 'references', 'cta',\n];\n\n// ---- pipeline helpers (n8n/blog-articles/src/code/pipeline_lib.js) ----\n\nconst cleanUrl = (u) => String(u || '').trim()\n  .replace(/([?&])(?:utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|ref|source|campaign|cmpid|icid|s_cid)=[^&#]*/gi, '$1')\n  .replace(/\\?&+/, '?').replace(/&{2,}/g, '&').replace(/[?&]+(#|$)/, '$1');\n\n/** The model's reply → object. Tolerates a code fence or prose around the JSON; throws a clear error otherwise. */\nfunction parseLooseJson(raw, label) {\n  if (raw && typeof raw === 'object') return raw;\n  const s = String(raw || '').replace(/^\\s*```(?:json)?\\s*/i, '').replace(/\\s*```\\s*$/, '');\n  const a = s.indexOf('{');\n  const b = s.lastIndexOf('}');\n  if (a < 0 || b <= a) throw new Error(`${label}: the model returned no JSON object (truncated at max tokens?). First 200 chars: ${s.slice(0, 200)}`);\n  try {\n    return JSON.parse(s.slice(a, b + 1));\n  } catch (e) {\n    throw new Error(`${label}: invalid JSON (${e.message}). The reply may have been cut off; check finish_reason in the execution.`);\n  }\n}\n\n/** Keys in the canonical order of the article contract; drops anything the writer must not set. */\nfunction canonical(a) {\n  const out = {};\n  for (const k of TOP_LEVEL_KEYS) if (a[k] !== undefined) out[k] = a[k];\n  return out;\n}\n\n/** Writer output minus every field the code owns. */\nfunction writerFields(a) {\n  const out = {};\n  for (const [k, v] of Object.entries(a || {})) if (!CODE_FIELDS.includes(k) && k !== 'references') out[k] = v;\n  return out;\n}\n\n/** The code-owned fields of a new draft. */\nfunction codeFields(plan, lang, today) {\n  return {\n    schemaVersion: SCHEMA_VERSION,\n    lang,\n    slug: plan.slug,\n    pillar: plan.pillar,\n    tags: plan.tags,\n    intent: plan.intent,\n    ymylLevel: 'low',\n    lengthBand: plan.length_band,\n    image: `/blog/${plan.slug}.jpg`,\n    imageAiGenerated: true,\n    createdAt: today,\n    reviewedAt: null,\n    editor: 'osher-alon',\n    aiAssisted: true,\n  };\n}\n\n/** References as the code owns them: cleaned URL, tier from the URL, fullTextRead from the research pack. */\nfunction codeReferences(refs, readUrls) {\n  return (Array.isArray(refs) ? refs : []).map((r) => {\n    const url = cleanUrl(r && r.url);\n    const out = {\n      id: r.id,\n      title: String(r.title || '').trim(),\n      authors: Array.isArray(r.authors) ? r.authors.filter((x) => typeof x === 'string' && x.trim()) : [],\n      year: Number.isInteger(r.year) ? r.year : null,\n      venue: typeof r.venue === 'string' ? r.venue : '',\n      url,\n      tier: tierOfUrl(url),\n      type: r.type,\n      fullTextRead: (readUrls || []).includes(url),\n      quote: String(r.quote || '').trim(),\n    };\n    if (r.doi) out.doi = String(r.doi).trim();\n    if (r.pmid) out.pmid = String(r.pmid).trim();\n    return out;\n  });\n}\n// ===== end of shared code =====\n\nconst o = $input.first().json.output || {};\nconst short = $('Shortlist candidates').first().json;\nconst cand = (short.candidates || [])[o.candidate_index] || {};\nlet slug = String(o.slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('article-' + $now.toFormat('yyMMddHHmm'));\nif ((short.used_slugs || []).includes(slug)) slug = slug + '-' + $now.toFormat('yyMMdd');\nconst tags = (Array.isArray(o.tags) ? o.tags : []).map((t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).filter(Boolean).slice(0, 4);\n\nconst reasons = [];\nif (!PILLARS.includes(o.pillar)) reasons.push(`pillar \"${o.pillar}\" is not one of ${PILLARS.join(', ')}`);\nif (o.ymyl_level !== 'low') reasons.push(`ymyl_level \"${o.ymyl_level}\" (only low is published)`);\n// Same rule as validate.mjs#ymylGuard (the build applies it again to title / slug / query).\nconst hits = Object.entries({ topic: o.topic, slug, primary_query_en: o.primary_query_en, primary_query_he: o.primary_query_he })\n  .map(([k, v]) => { const m = String(v || '').match(YMYL_TOPIC); return m ? `${k}: \"${m[0]}\"` : null; }).filter(Boolean);\nif (hits.length) reasons.push(`YMYL topic guard: ${hits.join('; ')}`);\nif (!GYMON_KINDS.includes(o.gymon_element && o.gymon_element.kind)) reasons.push('no valid Gymon-unique element chosen');\n\nreturn [{ json: {\n  topic: o.topic, angle: o.angle, slug, pillar: o.pillar, intent: INTENTS.includes(o.intent) ? o.intent : 'know',\n  ymyl_level: o.ymyl_level, length_band: LENGTH_BANDS.includes(o.length_band) ? o.length_band : '900-1400',\n  tags: (tags.length >= 2 ? tags : [...new Set([...tags, o.pillar, 'strength-training'].filter(Boolean))]).slice(0, 4),\n  source_url: cand.link || o.source_url, source_title: cand.title || o.source_title,\n  primary_keyword_en: o.primary_query_en, primary_keyword_he: o.primary_query_he,\n  paa_en: Array.isArray(o.paa_en) ? o.paa_en : [], paa_he: Array.isArray(o.paa_he) ? o.paa_he : [],\n  gymon_element: o.gymon_element || {}, search_queries: Array.isArray(o.search_queries) ? o.search_queries : [],\n  published: short.published || [],\n  guard_ok: reasons.length === 0, guard_reason: reasons.join(' | '),\n}, pairedItem: { item: 0 } }];\n" } },
  output: [{ topic: 'How many sets per muscle per week?', angle: '…', slug: 'sets-per-muscle-per-week', pillar: 'sets-reps-volume', intent: 'know', ymyl_level: 'low', length_band: '900-1400', tags: ['volume', 'sets'], source_url: 'https://example.org/a', source_title: 'Volume meta-analysis', primary_keyword_en: 'sets per muscle per week', primary_keyword_he: 'כמה סטים לכל שריר בשבוע', paa_en: [], paa_he: [], gymon_element: { kind: 'plan-logic', use: '…' }, search_queries: ['weekly set volume hypertrophy meta-analysis'], published: [], guard_ok: true, guard_reason: '' }],
});

const topicAllowed = ifElse({
  version: 2.2,
  config: {
    name: 'Topic allowed?',
    parameters: {
      conditions: {
        options: IF_OPTS,
        conditions: [{ leftValue: expr('{{ $json.guard_ok === true }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const topicRejected = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Stop: topic not allowed (YMYL / pillar guard)' },
  output: [{}],
});

const fetchSource = node({
  type: '@tavily/n8n-nodes-tavily.tavily',
  version: 1,
  config: {
    name: 'Fetch source article',
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'extract',
      operation: 'urls',
      urls: [expr('{{ $json.source_url }}')],
      options: { query: expr('{{ $json.topic }}'), chunks_per_source: 5, extract_depth: 'basic', format: 'markdown' },
    },
    credentials: CRED_TAVILY,
  },
  output: [{ results: [{ url: 'https://example.org/a', raw_content: '…' }] }],
});

const searchQueries = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Search queries (max 3)', parameters: { mode: 'runOnceForAllItems', jsCode: "// Search queries — exactly 3 items, one per Tavily search (hard cap: 3 searches per article).\n// The last query always looks for a position stand, so the writer can cite the stand itself.\nconst MAX_SEARCHES = 3;\nconst p = $('Topic plan').first().json;\nconst kw = String(p.primary_keyword_en || p.topic || '').trim();\nconst qs = (Array.isArray(p.search_queries) ? p.search_queries : [])\n  .map(q => String(q || '').trim()).filter(Boolean);\nconst fallback = [`${kw} systematic review meta-analysis`, `${p.topic} randomized controlled trial`];\nconst stand = qs.find(q => /position stand|consensus|guideline/i.test(q)) || `${kw} position stand ISSN OR ACSM OR NSCA`;\nconst out = [];\nfor (const q of qs.concat(fallback)) {\n  if (out.length >= MAX_SEARCHES - 1) break;\n  if (q !== stand && !out.includes(q)) out.push(q);\n}\nout.push(stand);\nreturn out.map(query => ({ json: { query }, pairedItem: { item: 0 } }));  // keep the link to Topic plan\n" } },
  output: [{ query: 'rest interval length strength meta-analysis' }],
});

const searchWeb = node({
  type: '@tavily/n8n-nodes-tavily.tavily',
  version: 1,
  config: {
    name: 'Search evidence',
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'search',
      operation: 'query',
      query: expr('{{ $json.query }}'),
      options: { search_depth: 'basic', max_results: 5, time_range: 'year' },
    },
    credentials: CRED_TAVILY,
  },
  output: [{ results: [{ url: 'https://example.org/b', title: 'Meta-analysis', content: '…', score: 0.8 }] }],
});

const pickPages = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Pick pages to read', parameters: { mode: 'runOnceForAllItems', jsCode: "// Pick pages to read — merges the 3 search results, drops commercial pages, ranks by source tier\n// (PRIMARY > AUTHORITY > SECONDARY), keeps a short digest and chooses the 2 pages to read in full\n// (hard cap: 2 extracted pages per article). All URLs are stripped of tracking parameters.\nconst MAX_PAGES = 2;\nconst MAX_DIGEST = 10;\nconst SNIPPET_CHARS = 450;\n\nconst cleanUrl = u => String(u || '').trim()\n  .replace(/([?&])(?:utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|ref|source|campaign|cmpid|icid|s_cid)=[^&#]*/gi, '$1')\n  .replace(/\\?&+/, '?').replace(/&{2,}/g, '&').replace(/[?&]+(#|$)/, '$1');\nconst hostOf = u => (String(u).match(/^https?:\\/\\/([^\\/?#:]+)/i) || [, ''])[1].toLowerCase().replace(/^www\\./, '');\n\nconst PRIMARY = /(pubmed\\.ncbi\\.nlm\\.nih\\.gov|pmc\\.ncbi\\.nlm\\.nih\\.gov|ncbi\\.nlm\\.nih\\.gov\\/pmc|doi\\.org|bjsm\\.bmj\\.com|bmj\\.com|link\\.springer\\.com|springeropen\\.com|biomedcentral\\.com|frontiersin\\.org|journals\\.lww\\.com|journals\\.physiology\\.org|tandfonline\\.com|jissn|sciencedirect\\.com|onlinelibrary\\.wiley\\.com|mdpi\\.com|nature\\.com|cochranelibrary\\.com|journals\\.plos\\.org|jamanetwork\\.com|thelancet\\.com|academic\\.oup\\.com|journals\\.sagepub\\.com|humankinetics\\.com)/i;\nconst AUTHORITY = /(acsm\\.org|nsca\\.com|sportsnutritionsociety\\.org|\\.gov(\\/|$|\\.)|nih\\.gov|who\\.int|nhs\\.uk|\\.edu(\\/|$)|\\.ac\\.[a-z]{2}(\\/|$)|ausport\\.gov\\.au|eatright\\.org)/i;\nconst COMMERCIAL = /(amazon\\.|ebay\\.|walmart\\.|iherb\\.|bodybuilding\\.com|myprotein|gnc\\.com|\\/\\/(shop|store)\\.|\\/(shop|store|products?|collections|cart)(\\/|$)|coupon|discount-code|\\bbest-[a-z-]*(supplements?|creatine|protein|pre-workout)|\\btop-\\d+-|(product|honest|buyers?)-reviews?|buyers?-guide|affiliate|sponsored)/i;  // only applied to SECONDARY pages\nconst tierOf = u => PRIMARY.test(u) ? 'PRIMARY' : AUTHORITY.test(u) ? 'AUTHORITY' : 'SECONDARY';\nconst RANK = { PRIMARY: 2, AUTHORITY: 1.5, SECONDARY: 0 };\n\nconst source = cleanUrl($('Topic plan').first().json.source_url);\nconst seen = new Set();\nconst results = [];\nlet dropped = 0;\nfor (const item of $input.all()) {\n  for (const r of (item.json.results || [])) {\n    const url = cleanUrl(r.url);\n    if (!/^https?:\\/\\//.test(url) || seen.has(url) || url === source) continue;\n    seen.add(url);\n    const title = String(r.title || '').replace(/\\s+/g, ' ').trim();\n    const tier = tierOf(url);\n    if (tier === 'SECONDARY' && (COMMERCIAL.test(url) || /\\b(best|top \\d+)\\b.*\\b(supplements?|creatine|protein powders?|brands?)\\b|\\bbuy\\b|\\bcoupon\\b/i.test(title))) { dropped++; continue; }\n    results.push({\n      url, title, tier, host: hostOf(url),\n      snippet: String(r.content || '').replace(/\\s+/g, ' ').trim().slice(0, SNIPPET_CHARS),\n      score: (Number(r.score) || 0) + RANK[tier],\n    });\n  }\n}\nresults.sort((a, b) => b.score - a.score);\nconst digest = results.slice(0, MAX_DIGEST);\nconst urls = digest.slice(0, MAX_PAGES).map(r => r.url);\nwhile (urls.length < MAX_PAGES) urls.push(urls[0] || source);  // the extract node needs 2 entries\nreturn [{ json: { urls, digest, dropped_commercial: dropped }, pairedItem: { item: 0 } }];\n" } },
  output: [{ urls: ['https://example.org/b', 'https://example.org/c'], digest: [{ url: 'https://example.org/b', title: 'Meta-analysis', snippet: '…', score: 1 }] }],
});

const readPages = node({
  type: '@tavily/n8n-nodes-tavily.tavily',
  version: 1,
  config: {
    name: 'Read top 2 pages',
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'extract',
      operation: 'urls',
      urls: [expr('{{ $json.urls[0] }}'), expr('{{ $json.urls[1] }}')],
      options: { query: expr("{{ $('Topic plan').first().json.topic }}"), chunks_per_source: 4, extract_depth: 'basic', format: 'markdown' },
    },
    credentials: CRED_TAVILY,
  },
  output: [{ results: [{ url: 'https://example.org/b', raw_content: '…' }] }],
});

const researchPack = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Research pack', parameters: { mode: 'runOnceForAllItems', jsCode: "// Research pack — the only research text the writer sees, size-capped:\n// source ≤ 5,000 chars, ≤ 10 search snippets of ≤ 450 chars, 2 pages ≤ 4,000 chars each.\n// Every URL carries its tier (PRIMARY / AUTHORITY / SECONDARY) and is stripped of tracking parameters.\nconst SOURCE_CHARS = 5000;\nconst PAGE_CHARS = 4000;\n\nconst cleanUrl = u => String(u || '').trim()\n  .replace(/([?&])(?:utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|ref|source|campaign|cmpid|icid|s_cid)=[^&#]*/gi, '$1')\n  .replace(/\\?&+/, '?').replace(/&{2,}/g, '&').replace(/[?&]+(#|$)/, '$1');\nconst PRIMARY = /(pubmed\\.ncbi\\.nlm\\.nih\\.gov|pmc\\.ncbi\\.nlm\\.nih\\.gov|ncbi\\.nlm\\.nih\\.gov\\/pmc|doi\\.org|bjsm\\.bmj\\.com|bmj\\.com|link\\.springer\\.com|springeropen\\.com|biomedcentral\\.com|frontiersin\\.org|journals\\.lww\\.com|journals\\.physiology\\.org|tandfonline\\.com|jissn|sciencedirect\\.com|onlinelibrary\\.wiley\\.com|mdpi\\.com|nature\\.com|cochranelibrary\\.com|journals\\.plos\\.org|jamanetwork\\.com|thelancet\\.com|academic\\.oup\\.com|journals\\.sagepub\\.com|humankinetics\\.com)/i;\nconst AUTHORITY = /(acsm\\.org|nsca\\.com|sportsnutritionsociety\\.org|\\.gov(\\/|$|\\.)|nih\\.gov|who\\.int|nhs\\.uk|\\.edu(\\/|$)|\\.ac\\.[a-z]{2}(\\/|$)|ausport\\.gov\\.au|eatright\\.org)/i;\nconst tierOf = u => PRIMARY.test(u) ? 'PRIMARY' : AUTHORITY.test(u) ? 'AUTHORITY' : 'SECONDARY';\n\nconst plan = $('Topic plan').first().json;\nconst src = $('Fetch source article').first().json;\nconst picked = $('Pick pages to read').first().json;\nconst pages = ($input.first().json.results || []);\n\nconst clip = (s, n) => {\n  const t = String(s || '').replace(/\\n{3,}/g, '\\n\\n').trim();\n  return t.length > n ? t.slice(0, n) + ' […]' : t;\n};\nconst sourceUrl = cleanUrl(plan.source_url);\nconst srcText = clip(src.results && src.results[0] && src.results[0].raw_content, SOURCE_CHARS);\n\nconst allowed = [sourceUrl];\nconst read = srcText ? [sourceUrl] : [];  // URLs whose own page text is in the pack (→ fullTextRead)\nconst blocks = [];\nblocks.push(`### Source article [${srcText ? 'EXTRACTED' : 'SNIPPET'}] [${tierOf(sourceUrl)}]\\n${plan.source_title}\\n${sourceUrl}\\n\\n${srcText || '(could not be fetched — rely on the search results)'}`);\nconst pageMap = {};\nfor (const p of pages) pageMap[cleanUrl(p.url)] = p.raw_content;\nconst readUrls = [...new Set(picked.urls.map(cleanUrl))];\nreadUrls.forEach((u, i) => {\n  if (!pageMap[u]) return;\n  allowed.push(u);\n  read.push(u);\n  blocks.push(`### Page ${i + 1} [EXTRACTED] [${tierOf(u)}]\\n${u}\\n\\n${clip(pageMap[u], PAGE_CHARS)}`);\n});\nconst digest = (picked.digest || []).map((r, i) => {\n  const u = cleanUrl(r.url);\n  allowed.push(u);\n  return `${i + 1}. [SNIPPET] [${tierOf(u)}] ${r.title}\\n   ${u}\\n   ${r.snippet}`;\n});\nblocks.push(`### Search results (snippets only)\\n${digest.join('\\n') || '(none)'}`);\n\nconst allowedUrls = [...new Set(allowed.filter(Boolean))];\nconst research = blocks.join('\\n\\n');\nconst extracted = [...new Set(read)];\nreturn [{ json: {\n  research,\n  allowed_urls: allowedUrls,\n  read_urls: extracted,\n  allowed_with_tier: allowedUrls.map(u => `[${tierOf(u)}] [${extracted.includes(u) ? 'EXTRACTED' : 'SNIPPET'}] ${u}`),\n  research_chars: research.length,\n}, pairedItem: { item: 0 } }];\n" } },
  output: [{ research: '### Source article…', allowed_urls: ['https://example.org/a'], read_urls: ['https://example.org/a'], allowed_with_tier: ['[PRIMARY] [EXTRACTED] https://example.org/a'], research_chars: 12000 }],
});

// The three long Sonnet calls go straight to the OpenRouter API (HTTP), not through a chain node:
// the chain node cannot set the reasoning effort, and in execution 1539 hidden reasoning used
// 15,200 of the 16,000 max tokens, so the article JSON was cut off. A Set node holds the prompts
// so the long system prompt never sits inside an expression.
const writerRequest = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Writer request',
    parameters: { mode: 'manual', assignments: { assignments: [
      { id: 'wrs', name: 'system', value: "You write ONE evidence-based English article for the Gymon blog, as JSON that follows the JSON Schema at the end of this message exactly. Gymon is a strength-training and workout-logging app. The article will be fact-checked and edited by a named human editor before publication; your job is a draft that makes that review fast and that adds something the sources do not.\n\nRESEARCH — already done; you have no tools\n- The message holds a research pack: the source article, up to two pages extracted from their sites, and search snippets. Each URL carries a tier — PRIMARY (studies, PubMed/PMC, DOIs), AUTHORITY (position stands, ACSM/NSCA, .gov/.edu) or SECONDARY (blogs, news) — and a marker: [EXTRACTED] (page text in the pack) or [SNIPPET] (search snippet only).\n- Write only what the pack supports. Never invent a URL, author, year, DOI, number, study or quote.\n- references[]: one entry per source you cite, ids r1, r2, … in order of first citation. url copied exactly from the Allowed URLs list. title/authors/year/venue/doi/pmid only as printed in the pack (use [] / null / \"\" when unknown; omit doi/pmid when not printed). quote = text copied VERBATIM from the pack for that URL (you may join two passages with \" … \"), and it must contain every number you attribute to that reference.\n- Numbers: every number in the text must appear in the quote of a reference cited in the same item. Never attribute a number to a [SNIPPET]-only source unless the number is in its snippet and you quote it. Prefer PRIMARY/AUTHORITY sources; name position stands in the text (\"the ACSM position stand…\"); describe a single study as \"one study found…\" with its size and population when the pack gives them.\n- Certainty words follow the evidence (claim blocks carry the level): strong → \"results in\"; moderate → \"probably\", \"likely\"; limited → \"may\"; mixed/insufficient → \"the evidence is mixed\", \"uncertain\". \"strong\" or \"moderate\" needs a PRIMARY/AUTHORITY source with [EXTRACTED] text. SECONDARY-only claims are at most \"limited\".\n- Rewrite in your own words; never copy sentences except inside `quote`.\n\nGYMON-UNIQUE BLOCK — mandatory, exactly one block of type \"gymon\"\n- Use the GYMON MATERIAL in the message and the kind chosen in the plan. log-example: a short, realistic, internally consistent example of the logging table (illustrative numbers, labelled as such by the page), with text that explains what it shows (recompute any derived value correctly, e.g. Epley = weight × (1 + reps ÷ 30)). plan-logic / teardown-finding: state only facts from the material, with their numbers exactly as written there.\n- Never write \"our users\", user counts, user quotes, personal anecdotes or invented experience.\n\nSTRUCTURE (the page renders the title, trust line, table of contents, sources list, CTA copy and disclaimer itself — never write them)\n- title ≤ 52 characters, contains the primary query, answers or poses the question. heroTitle 2–4 words. description 120–155 characters.\n- tldr: 1–3 sentences that answer the question directly, with a certainty verb. keyTakeaways: 3–5 one-sentence items; any item with a number has a [[rN]] marker.\n- sections: 4–7. Every heading is an informative statement or question whose first two words carry the gist (not \"Introduction\", not one-word labels). The first sentence of every paragraph states its point. Average about 15 words per sentence, never more than 25. Bold only a few key phrases.\n- Every section object has the boolean field \"apply\" next to \"heading\" and \"blocks\". Exactly one section has \"apply\": true and every other section has \"apply\": false; a heading that starts with \"Apply it\" does not replace the field. The apply section is the practical protocol (\"Apply it: …\"), including how to test it on oneself by logging. Put the single {\"type\":\"cta\"} block there (it renders a fixed sentence about Gymon; you never write CTA copy) and, only when the topic is about estimating maximal strength, a {\"type\":\"calculator\",\"calculator\":\"one-rep-max\"} block with realistic defaults.\n- Block types allowed: p, list, takeaway (≤1 per section), claim, callout (note | myth | safety), table (≤3, every number cited), calculator, cta, gymon. Nothing else.\n- faq: 3–5 questions taken from the provided \"people also ask\" list, answers of 40–60 words, each citing a reference where it states a fact. quiz: 0–3 multiple-choice questions whose answers are stated in the article.\n- Internal links: 2–4 [anchor](/blog/slug) links to articles in the PUBLISHED list only, one of them to the pillar's main article when it exists; descriptive, varied anchors. If the list is empty, add none.\n- Length: the plan's length band, counting all text. Never pad. If space runs short, shorten the plan — the article must end with a complete final section.\n- Medical boundary: no individual dosing, no \"cures / treats / prevents injury / guarantees\". Where pain, injury, pregnancy or a medical condition becomes relevant, a callout of kind \"safety\" says to consult a qualified professional.\n- Units: kg, with lb in parentheses when a load is given. No prices. Name competitor apps only with facts from the GYMON MATERIAL.\n- cta.slot: \"log-sets\" (logging / overload topics), \"track-progress\" (progress over time), or \"plan-builder\" (plans / splits).\n\nOUTPUT: one JSON object, no prose before or after, no code fence. It must validate against this JSON Schema:\n{\"$schema\":\"https://json-schema.org/draft/2020-12/schema\",\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"title\":{\"type\":\"string\",\"minLength\":1,\"maxLength\":52,\"description\":\"≤ 52 characters; states or answers the question; contains the primary query.\"},\"heroTitle\":{\"type\":\"string\",\"minLength\":1,\"description\":\"2–4 words, no colon, never a heading.\"},\"description\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Meta description: EN 120–155 characters, HE 100–145.\"},\"primaryQuery\":{\"type\":\"string\",\"minLength\":1,\"description\":\"The primary search query in this language, as people type it.\"},\"imageAlt\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Placeholder alt text; replaced after the image exists.\"},\"tldr\":{\"type\":\"string\",\"minLength\":1,\"description\":\"1–3 sentences that answer the title question, with a GRADE-style certainty verb. Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.\"},\"keyTakeaways\":{\"type\":\"array\",\"minItems\":3,\"maxItems\":5,\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"text\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.\"},\"refs\":{\"type\":\"array\",\"items\":{\"type\":\"string\",\"pattern\":\"^r\\\\d{1,2}$\"},\"description\":\"ids of references that support this item\"}},\"required\":[\"text\"]}},\"sections\":{\"type\":\"array\",\"minItems\":4,\"maxItems\":7,\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"heading\":{\"type\":\"string\",\"minLength\":1,\"description\":\"An informative statement or question; first two words carry the gist.\"},\"apply\":{\"type\":\"boolean\",\"description\":\"true on exactly one section (the practical protocol that holds the cta block), false on every other section.\"},\"blocks\":{\"type\":\"array\",\"minItems\":1,\"items\":{\"anyOf\":[{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"p\"},\"text\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.\"}},\"required\":[\"type\",\"text\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"list\"},\"ordered\":{\"type\":\"boolean\"},\"items\":{\"type\":\"array\",\"minItems\":2,\"maxItems\":8,\"items\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.\"}}},\"required\":[\"type\",\"items\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"takeaway\"},\"text\":{\"type\":\"string\",\"minLength\":1,\"description\":\"One-sentence bottom line of the section. At most one per section.\"}},\"required\":[\"type\",\"text\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"claim\"},\"evidence\":{\"enum\":[\"strong\",\"moderate\",\"limited\",\"mixed\",\"insufficient\"]},\"refs\":{\"type\":\"array\",\"items\":{\"type\":\"string\",\"pattern\":\"^r\\\\d{1,2}$\"},\"description\":\"ids of references that support this item\"},\"text\":{\"type\":\"string\",\"minLength\":1,\"description\":\"The claim, worded with the certainty verb of its evidence level.\"}},\"required\":[\"type\",\"evidence\",\"refs\",\"text\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"callout\"},\"kind\":{\"enum\":[\"note\",\"myth\",\"safety\"]},\"text\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.\"}},\"required\":[\"type\",\"kind\",\"text\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"table\"},\"caption\":{\"type\":\"string\",\"minLength\":1,\"description\":\"What the table shows.\"},\"columns\":{\"type\":\"array\",\"minItems\":2,\"maxItems\":5,\"items\":{\"type\":\"string\",\"minLength\":1}},\"rows\":{\"type\":\"array\",\"minItems\":1,\"maxItems\":10,\"items\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}},\"refs\":{\"type\":\"array\",\"items\":{\"type\":\"string\",\"pattern\":\"^r\\\\d{1,2}$\"},\"description\":\"ids of references that support this item\"}},\"required\":[\"type\",\"caption\",\"columns\",\"rows\",\"refs\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"calculator\"},\"calculator\":{\"enum\":[\"one-rep-max\"]},\"defaults\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"weightKg\":{\"type\":\"number\",\"minimum\":1,\"maximum\":500},\"reps\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":12}},\"required\":[]}},\"required\":[\"type\",\"calculator\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"cta\"}},\"required\":[\"type\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"gymon\"},\"kind\":{\"const\":\"log-example\"},\"exercise\":{\"type\":\"string\",\"minLength\":1},\"caption\":{\"type\":\"string\",\"minLength\":1,\"description\":\"One sentence on what the example shows.\"},\"sessions\":{\"type\":\"array\",\"minItems\":1,\"maxItems\":3,\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"label\":{\"type\":\"string\",\"minLength\":1,\"description\":\"e.g. \\\"Week 1\\\"\"},\"sets\":{\"type\":\"array\",\"minItems\":1,\"maxItems\":6,\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"previous\":{\"anyOf\":[{\"type\":\"null\"},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"kg\":{\"type\":\"number\"},\"reps\":{\"type\":\"integer\"}},\"required\":[\"kg\",\"reps\"]}]},\"kg\":{\"type\":\"number\"},\"reps\":{\"type\":\"integer\"}},\"required\":[\"previous\",\"kg\",\"reps\"]}}},\"required\":[\"label\",\"sets\"]}},\"text\":{\"type\":\"string\",\"minLength\":1,\"description\":\"What the example teaches, numbers recomputed correctly.\"}},\"required\":[\"type\",\"kind\",\"exercise\",\"caption\",\"sessions\",\"text\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"gymon\"},\"kind\":{\"enum\":[\"plan-logic\",\"teardown-finding\"]},\"heading\":{\"type\":\"string\",\"minLength\":1},\"text\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Built only from the GYMON MATERIAL.\"},\"points\":{\"type\":\"array\",\"maxItems\":5,\"items\":{\"type\":\"string\",\"minLength\":1}}},\"required\":[\"type\",\"kind\",\"text\"]}]}}},\"required\":[\"heading\",\"apply\",\"blocks\"]}},\"faq\":{\"type\":\"array\",\"minItems\":3,\"maxItems\":5,\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"q\":{\"type\":\"string\",\"minLength\":1},\"a\":{\"type\":\"string\",\"minLength\":1,\"description\":\"40–60 words. Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.\"},\"refs\":{\"type\":\"array\",\"items\":{\"type\":\"string\",\"pattern\":\"^r\\\\d{1,2}$\"},\"description\":\"ids of references that support this item\"}},\"required\":[\"q\",\"a\"]}},\"quiz\":{\"type\":\"array\",\"maxItems\":3,\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"question\":{\"type\":\"string\",\"minLength\":1},\"options\":{\"type\":\"array\",\"minItems\":3,\"maxItems\":4,\"items\":{\"type\":\"string\",\"minLength\":1}},\"correctIndex\":{\"type\":\"integer\",\"minimum\":0},\"explanation\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.\"},\"refs\":{\"type\":\"array\",\"items\":{\"type\":\"string\",\"pattern\":\"^r\\\\d{1,2}$\"},\"description\":\"ids of references that support this item\"}},\"required\":[\"question\",\"options\",\"correctIndex\",\"explanation\"]}},\"references\":{\"type\":\"array\",\"minItems\":2,\"maxItems\":12,\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"id\":{\"type\":\"string\",\"minLength\":1,\"pattern\":\"^r\\\\d{1,2}$\"},\"title\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Exact title as it appears in the research pack.\"},\"authors\":{\"type\":\"array\",\"items\":{\"type\":\"string\",\"minLength\":1},\"description\":\"Surname + initials, as in the pack; [] if unknown.\"},\"year\":{\"type\":[\"integer\",\"null\"]},\"venue\":{\"type\":\"string\",\"description\":\"Journal / organisation, or \\\"\\\" if unknown.\"},\"url\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Copied exactly from the Allowed URLs list.\"},\"doi\":{\"type\":\"string\",\"minLength\":1,\"pattern\":\"^10\\\\.\\\\d{4,9}/\\\\S+$\",\"description\":\"Only if it is printed in the research pack.\"},\"pmid\":{\"type\":\"string\",\"minLength\":1,\"pattern\":\"^\\\\d{4,9}$\",\"description\":\"Only if it is printed in the research pack.\"},\"type\":{\"enum\":[\"meta-analysis\",\"systematic-review\",\"rct\",\"cohort\",\"cross-sectional\",\"review\",\"position-stand\",\"guideline\",\"other\"]},\"quote\":{\"type\":\"string\",\"minLength\":1,\"description\":\"VERBATIM text copied from the research pack for this URL, containing every number the article attributes to this reference.\"}},\"required\":[\"id\",\"title\",\"authors\",\"year\",\"venue\",\"url\",\"type\",\"quote\"]}},\"cta\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"slot\":{\"enum\":[\"log-sets\",\"track-progress\",\"plan-builder\"]}},\"required\":[\"slot\"]}},\"required\":[\"title\",\"heroTitle\",\"description\",\"primaryQuery\",\"imageAlt\",\"tldr\",\"keyTakeaways\",\"sections\",\"faq\",\"quiz\",\"references\",\"cta\"]}\n\nGYMON MATERIAL — the only facts about Gymon an article may state. Every article carries exactly one \"gymon\" block built from ONE of the three parts below. Never invent app data, user numbers, user quotes or experiences. Sources are noted in brackets for the reviewer (files in the gymon app repo or research folder); do not put them in the article.\n\nA. THE LOGGING TABLE (kind \"log-example\") [app/src/lib/loggerData.ts, personalRecords.ts, repRange.ts]\n- Gymon's logger shows each set as one row: SET | PREVIOUS | KG | REPS | ✓.\n- PREVIOUS shows, in grey, the weight and reps of the same set in the last finished session of the SAME workout (not the exercise's last outing in some other workout).\n- Only working sets count: warm-up and cool-down sets are not used for PREVIOUS or for records.\n- A personal record in Gymon: the heaviest weight wins; on equal weight, more reps win; a tie is not a record; a first-ever session cannot set a record; timed exercises have no weight/reps record.\n- Rep targets are shown as a range (for example 8 to 12), not a single number.\n- A log-example uses ILLUSTRATIVE numbers that you choose for the example. The page labels them \"illustrative, not user data\". Keep them realistic and consistent: small weight steps (1 to 2.5 kg), reps that fall slightly as weight rises, PREVIOUS equal to the earlier session's numbers.\n\nB. THE PLAN BUILDER (kind \"plan-logic\") [app/src/lib/planBuilder.ts, programRotation.ts]\n- The plan is built in four steps: filter exercises by where the person trains, pick a split from the number of training days, choose exercises for each day, then set sets, reps and rest from the goal and experience level.\n- Split by days per week: 1 day full body; 2 days full body A and B; 3 days full body A, B and C; 4 days upper and lower twice; 5 days push, pull, legs, upper, lower; 6 days push, pull and legs twice. Legs appear in every split.\n- Main lifts by goal: strength 4 to 6 reps, 4 sets, 180 seconds rest; muscle 8 to 12 reps, 3 sets, 90 seconds rest. Accessory exercises: strength 8 to 12 reps; muscle 10 to 15 reps.\n- Sets per exercise stay between 2 and 4: main lifts 3 to 4, isolation exercises 2 to 3. When a muscle needs more work in a session, the plan adds an exercise rather than stacking sets on one.\n- Session length decides how many exercises fit: a 60-minute session holds about 20 to 23 working sets, a 45-minute session about 15 to 17.\n- Gender does not change the prescription: it is a decision, because nothing in the evidence used supports a different rule.\n- \"Toning\" gets the same resistance work as building muscle; it is not a light-weights, high-reps protocol.\n- When possible, a session holds only one exercise that loads the hip hinge (for example a deadlift), so the lower back is not loaded twice.\n- The program-refresh check estimates each session's best set with the Epley formula (weight × (1 + reps ÷ 30)). It asks about swapping an exercise only when that lift's best estimate has not improved by at least 1% across 4 sessions of it and the best is at least 3 weeks old, and never before 6 weeks on the plan. It only asks; it never swaps an exercise by itself.\n\nC. GYMON'S REVIEW OF WORKOUT APPS (kind \"teardown-finding\") [departments/research/competitor_analysis, 2026]\n- Gymon mapped the onboarding and logging screens of 8 workout apps, 402 screens in total.\n- Strong and Hevy, built separately, arrived at the same set table: SET | PREVIOUS | KG | REPS | ✓.\n- Of the 7 apps reviewed for language support, only one (FitBuddy, an Israeli app) offered Hebrew with a right-to-left layout.\n- Hevy labels set types (warm-up, failure, drop set) and tracks 4 kinds of record: heaviest weight, best 1RM, best set volume and best session volume.\n- In 281 negative app-store reviews of Strong, Fitbod and Hevy, the most common complaint (119 reviews, 42%) was about pricing and paywalls imposed after people had already invested time and data.\n- When naming competitor apps, state only these findings; no rankings, no prices, no \"better than\" claims.\n", type: 'string' },
      { id: 'wru', name: 'user', value: expr("PLAN\nTopic: {{ $('Topic plan').first().json.topic }}\nAngle: {{ $('Topic plan').first().json.angle }}\nPillar: {{ $('Topic plan').first().json.pillar }} · intent: {{ $('Topic plan').first().json.intent }} · length band: {{ $('Topic plan').first().json.length_band }} words\nPrimary query: {{ $('Topic plan').first().json.primary_keyword_en }}\nPeople also ask:\n{{ ($('Topic plan').first().json.paa_en || []).map(q => '- ' + q).join('\\n') }}\nGymon-unique block: {{ ($('Topic plan').first().json.gymon_element || {}).kind }} — {{ ($('Topic plan').first().json.gymon_element || {}).use }}\n\nPUBLISHED (the only internal-link targets: /blog/<slug>):\n{{ ($('Topic plan').first().json.published || []).map(p => p.slug + ' — ' + p.title_en).join('\\n') || '(none — add no internal links)' }}\n\nALLOWED URLS (cite only these; tier and whether page text is in the pack):\n{{ ($json.allowed_with_tier || $json.allowed_urls).join('\\n') }}\n\nRESEARCH PACK\n\n{{ $json.research }}"), type: 'string' },
    ] }, options: {} },
  },
  output: [{ system: '…', user: '…' }],
});

const writeArticle = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Write article (EN)',
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 5000,
    parameters: {
      method: 'POST',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openRouterApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ model: 'anthropic/claude-sonnet-5.5', max_tokens: 32000, temperature: 0.5, reasoning: { effort: 'low' }, messages: [{ role: 'system', content: $json.system }, { role: 'user', content: $json.user }] }) }}"),
      options: { timeout: 600000 },
    },
    credentials: CRED_OPENROUTER,
  },
  output: [{ choices: [{ finish_reason: 'stop', message: { content: '{"title":"…"}' } }], usage: { prompt_tokens: 14000, completion_tokens: 9000 } }],
});

const parseEn = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Parse article (EN)', parameters: { mode: 'runOnceForAllItems', jsCode: "// Parse article (EN) — the writer's JSON reply → the writer-owned fields + its references.\n// ===== article constants (site src/lib/article/schema.mjs) + pipeline helpers — generated by build.py =====\n// ---- schema.mjs (generated from the site repo; edit there) ----\nconst SCHEMA_VERSION = 1;\nconst LANGS = ['en', 'he'];\nconst PILLARS = ['progressive-overload', 'sets-reps-volume', 'plans-splits', 'home-gym', 'tools'];\nconst INTENTS = ['know', 'do'];\nconst YMYL_LEVELS = ['low'];\nconst LENGTH_BANDS = ['600-900', '900-1400', '1400-1800'];\nconst EVIDENCE_LEVELS = ['strong', 'moderate', 'limited', 'mixed', 'insufficient'];\nconst CERTAINTY_WORDS = {\nen: {\nstrong: ['results in', 'reliably', 'consistently'],\nmoderate: ['probably', 'likely'],\nlimited: ['may', 'might', 'could'],\nmixed: ['mixed', 'unclear', 'uncertain', 'inconsistent'],\ninsufficient: ['uncertain', 'not enough', 'unknown', 'too little'],\n},\nhe: {\nstrong: ['מביא ל', 'מביאה ל', 'באופן עקבי', 'בעקביות'],\nmoderate: ['כנראה', 'ככל הנראה', 'סביר'],\nlimited: ['ייתכן', 'עשוי', 'עשויה', 'עשויים', 'אולי'],\nmixed: ['אינן חד-משמעיות', 'לא חד-משמעיות', 'סותרות', 'מעורבות'],\ninsufficient: ['אין מספיק', 'לא ידוע', 'לא ברור'],\n},\n};\nconst REF_TIERS = ['PRIMARY', 'AUTHORITY', 'SECONDARY'];\nconst REF_TYPES = [\n'meta-analysis',\n'systematic-review',\n'rct',\n'cohort',\n'cross-sectional',\n'review',\n'position-stand',\n'guideline',\n'other',\n];\nconst CALLOUT_KINDS = ['note', 'myth', 'safety'];\nconst CTA_SLOTS = ['log-sets', 'track-progress', 'plan-builder'];\nconst GYMON_KINDS = ['log-example', 'plan-logic', 'teardown-finding'];\nconst CALCULATORS = {\n'one-rep-max': {\nweightKg: { min: 1, max: 500, default: 80 },\nreps: { min: 1, max: 12, default: 5 },\n},\n};\nconst BLOCK_TYPES = ['p', 'list', 'takeaway', 'claim', 'callout', 'table', 'calculator', 'cta', 'gymon'];\nconst LIMITS = {\ntitle: { min: 20, max: 52, hardMax: 70 },\nheroTitleWords: { min: 1, max: 4 },\ndescription: { en: [120, 155], he: [100, 145] },\ntags: [2, 4],\nkeyTakeaways: [3, 5],\nsections: [4, 7],\nfaq: [0, 5],\nquiz: [0, 3],\nquizOptions: [2, 4],\ntables: 3,\nreferences: [1, 20],\ntldrSentences: 3,\nsentenceWords: 25,\ninternalLinks: [2, 4],\n};\nconst COMMERCIAL_HOST = /(amazon\\.|ebay\\.|walmart\\.|iherb\\.|bodybuilding\\.com|myprotein|gnc\\.com|kidneystronger\\.com|mtntactical\\.com|\\/\\/(shop|store)\\.)/i;\nconst TRACKING_PARAM = /[?&](utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|cmpid|icid|s_cid)=/i;\nconst PRIMARY_HOST = /(pubmed\\.ncbi\\.nlm\\.nih\\.gov|pmc\\.ncbi\\.nlm\\.nih\\.gov|ncbi\\.nlm\\.nih\\.gov\\/pmc|doi\\.org|bjsm\\.bmj\\.com|bmj\\.com|link\\.springer\\.com|springeropen\\.com|biomedcentral\\.com|frontiersin\\.org|journals\\.lww\\.com|journals\\.physiology\\.org|tandfonline\\.com|jissn|sciencedirect\\.com|onlinelibrary\\.wiley\\.com|mdpi\\.com|nature\\.com|cochranelibrary\\.com|journals\\.plos\\.org|jamanetwork\\.com|thelancet\\.com|academic\\.oup\\.com|journals\\.sagepub\\.com|humankinetics\\.com|biolsport\\.com|termedia\\.pl)/i;\nconst AUTHORITY_HOST = /(acsm\\.org|nsca\\.com|sportsnutritionsociety\\.org|\\.gov(\\/|$|\\.)|nih\\.gov|who\\.int|nhs\\.uk|\\.edu(\\/|$)|\\.ac\\.[a-z]{2}(\\/|$)|ausport\\.gov\\.au)/i;\nconst tierOfUrl = (u) => (PRIMARY_HOST.test(u) ? 'PRIMARY' : AUTHORITY_HOST.test(u) ? 'AUTHORITY' : 'SECONDARY');\nconst YMYL_TOPIC = new RegExp(\n[\n'supplement', 'creatine', 'protein powder', 'whey', 'caffeine', 'pre-?workout', 'vitamin', 'steroid',\n'weight[- ]?loss', 'fat[- ]?loss', 'lose weight', 'diet', 'calori', 'bmi\\\\b', 'keto', 'fasting',\n'injur', 'pain', 'rehab', 'physio', 'tendin', 'surgery',\n'pregnan', 'postpartum', 'menopaus', 'menstrua',\n'diabet', 'hypertens', 'blood pressure', 'cancer', 'osteopor', 'arthritis', 'disease', 'medical', 'medication', 'drug',\n'eating disorder',\n'תוסף', 'תוספי', 'קריאטין', 'אבקת חלבון', 'ירידה במשקל', 'הרזיה', 'דיאטה', 'קלורי', 'פציע', 'כאב', 'שיקום',\n'הריון', 'היריון', 'לידה', 'גיל המעבר', 'סוכרת', 'לחץ דם', 'מחלה', 'תרופ',\n].join('|'),\n'i',\n);\nconst HE_GENDERED_WORDS = [\n'אתה', 'תוכל', 'תוכלי', 'תרצה', 'תרצי', 'תצטרך', 'תצטרכי', 'תרגיש', 'תרגישי', 'תראה', 'תראי',\n'נסה', 'נסי', 'הזן', 'הזיני', 'קח', 'קחי', 'תן', 'תני', 'שים', 'שימי', 'זכור', 'זכרי',\n'בצע', 'בצעי', 'הקפד', 'הקפידי', 'הוסף', 'הוסיפי', 'רשום', 'רשמי', 'התחל', 'התחילי',\n'בחר', 'בחרי', 'הרם', 'הרימי', 'הורד', 'הורידי', 'המשך', 'המשיכי', 'עצור', 'עצרי',\n'המתאמן', 'המתאמנת',\n];\nconst CODE_FIELDS = [\n'schemaVersion', 'lang', 'slug', 'pillar', 'tags', 'intent', 'ymylLevel', 'lengthBand', 'image',\n'imageAiGenerated', 'createdAt', 'updatedAt', 'reviewedAt', 'editor', 'aiAssisted', 'sample',\n];\nconst TOP_LEVEL_KEYS = [\n...CODE_FIELDS,\n'title', 'heroTitle', 'description', 'primaryQuery', 'imageAlt',\n'tldr', 'keyTakeaways', 'sections', 'faq', 'quiz', 'references', 'cta',\n];\n\n// ---- pipeline helpers (n8n/blog-articles/src/code/pipeline_lib.js) ----\n\nconst cleanUrl = (u) => String(u || '').trim()\n  .replace(/([?&])(?:utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|ref|source|campaign|cmpid|icid|s_cid)=[^&#]*/gi, '$1')\n  .replace(/\\?&+/, '?').replace(/&{2,}/g, '&').replace(/[?&]+(#|$)/, '$1');\n\n/** The model's reply → object. Tolerates a code fence or prose around the JSON; throws a clear error otherwise. */\nfunction parseLooseJson(raw, label) {\n  if (raw && typeof raw === 'object') return raw;\n  const s = String(raw || '').replace(/^\\s*```(?:json)?\\s*/i, '').replace(/\\s*```\\s*$/, '');\n  const a = s.indexOf('{');\n  const b = s.lastIndexOf('}');\n  if (a < 0 || b <= a) throw new Error(`${label}: the model returned no JSON object (truncated at max tokens?). First 200 chars: ${s.slice(0, 200)}`);\n  try {\n    return JSON.parse(s.slice(a, b + 1));\n  } catch (e) {\n    throw new Error(`${label}: invalid JSON (${e.message}). The reply may have been cut off; check finish_reason in the execution.`);\n  }\n}\n\n/** Keys in the canonical order of the article contract; drops anything the writer must not set. */\nfunction canonical(a) {\n  const out = {};\n  for (const k of TOP_LEVEL_KEYS) if (a[k] !== undefined) out[k] = a[k];\n  return out;\n}\n\n/** Writer output minus every field the code owns. */\nfunction writerFields(a) {\n  const out = {};\n  for (const [k, v] of Object.entries(a || {})) if (!CODE_FIELDS.includes(k) && k !== 'references') out[k] = v;\n  return out;\n}\n\n/** The code-owned fields of a new draft. */\nfunction codeFields(plan, lang, today) {\n  return {\n    schemaVersion: SCHEMA_VERSION,\n    lang,\n    slug: plan.slug,\n    pillar: plan.pillar,\n    tags: plan.tags,\n    intent: plan.intent,\n    ymylLevel: 'low',\n    lengthBand: plan.length_band,\n    image: `/blog/${plan.slug}.jpg`,\n    imageAiGenerated: true,\n    createdAt: today,\n    reviewedAt: null,\n    editor: 'osher-alon',\n    aiAssisted: true,\n  };\n}\n\n/** References as the code owns them: cleaned URL, tier from the URL, fullTextRead from the research pack. */\nfunction codeReferences(refs, readUrls) {\n  return (Array.isArray(refs) ? refs : []).map((r) => {\n    const url = cleanUrl(r && r.url);\n    const out = {\n      id: r.id,\n      title: String(r.title || '').trim(),\n      authors: Array.isArray(r.authors) ? r.authors.filter((x) => typeof x === 'string' && x.trim()) : [],\n      year: Number.isInteger(r.year) ? r.year : null,\n      venue: typeof r.venue === 'string' ? r.venue : '',\n      url,\n      tier: tierOfUrl(url),\n      type: r.type,\n      fullTextRead: (readUrls || []).includes(url),\n      quote: String(r.quote || '').trim(),\n    };\n    if (r.doi) out.doi = String(r.doi).trim();\n    if (r.pmid) out.pmid = String(r.pmid).trim();\n    return out;\n  });\n}\n// ===== end of shared code =====\n\n// ---- llmText + apply flags (n8n/blog-articles/src/code/llm_text.js): only the nodes that read a Sonnet reply ----\n\n/**\n * The text of an OpenRouter chat completion (HTTP node) or of a chain node ({ text }).\n * A reply cut off at max_tokens is an error here, with the token usage, because hidden\n * reasoning is billed as completion and can eat the whole budget (execution 1539).\n */\nfunction llmText(j, label) {\n  if (j && typeof j.text === 'string') return j.text;\n  const c = j && Array.isArray(j.choices) ? j.choices[0] : null;\n  if (!c) throw new Error(`${label}: no completion in the response: ${JSON.stringify(j || {}).slice(0, 300)}`);\n  if (c.finish_reason === 'length') {\n    throw new Error(`${label}: cut off at max_tokens (finish_reason: length, usage: ${JSON.stringify(j.usage || {})}). Raise max_tokens or lower the reasoning effort.`);\n  }\n  const m = c.message || {};\n  return typeof m.content === 'string' ? m.content : (Array.isArray(m.content) ? m.content.map((x) => x.text || '').join('') : '');\n}\n\n/**\n * The \"apply\" flag is structure, not language: Hebrew takes it from the English section at the\n * same index (the validator already requires the same sections in both). Execution 1541: the\n * writer put the protocol under an \"Apply it:\" heading but never set the field.\n */\nfunction syncApply(en, he) {\n  const es = (en && en.sections) || [];\n  ((he && he.sections) || []).forEach((s, i) => { if (es[i]) s.apply = es[i].apply === true; });\n  return he;\n}\n\n/** When the writer marked no section, the one section holding the cta block is the apply section. */\nfunction markApplyFromCta(a) {\n  const secs = (a && a.sections) || [];\n  if (secs.some((s) => s.apply === true)) return a;\n  const withCta = secs.filter((s) => (s.blocks || []).some((b) => b && b.type === 'cta'));\n  if (withCta.length === 1) secs.forEach((s) => { s.apply = s === withCta[0]; });\n  return a;\n}\n\nconst raw = llmText($input.first().json, 'Write article (EN)');\nconst a = markApplyFromCta(parseLooseJson(raw, 'Write article (EN)'));\nreturn [{ json: { article: writerFields(a), references: Array.isArray(a.references) ? a.references : [] }, pairedItem: { item: 0 } }];\n" } },
  output: [{ article: { title: '…' }, references: [] }],
});

const hebrewRequest = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Hebrew request',
    parameters: { mode: 'manual', assignments: { assignments: [
      { id: 'hrs', name: 'system', value: "You adapt a Gymon blog article from English JSON into Hebrew JSON for Israeli readers. Same facts, same structure (every section keeps its \"apply\" value exactly as in the English), same block order, same reference markers ([[r1]] etc.) and the same internal links rewritten to /he/blog/<slug> — but natural Israeli Hebrew, not a translation. Output one JSON object, no prose, no code fence, valid against the JSON Schema at the end (it has no \"references\": the code copies them from the English article).\n\nHard rules\n1. Gender-neutral Hebrew everywhere — no exceptions. Never a gendered second-person singular: not \"נסה/נסי\", \"הזן/הזיני\", \"אתה/את\", \"תוכל/תוכלי\", \"קח/קחי\", \"שים לב\" (singular), \"התחל/התחילי\"; no slash forms (\"מתאמן/ת\"); avoid the generic singular \"המתאמן\". Use impersonal forms (\"יש ל-\", \"כדאי\", \"מומלץ\", \"אפשר\"), infinitives, present plural (\"מתעדים\", \"בודקים\", \"מוסיפים\"), or plural imperative (\"נסו\", \"שימו לב\").\n2. Numbers in RTL: never an en dash between numbers — write ranges as \"8 עד 12\" (or \"8-12\" with a plain hyphen). Never \"3×10\" — write \"3 סטים של 10\". Keep every number and unit exactly as in the English. kg → ק\"ג.\n3. No italics, no letter-spacing tricks; emphasis only with **bold**, sparingly.\n4. Gym vocabulary as Israelis type it: \"סט\", \"חזרות\", \"סקוואט\" (never \"כפיפות ברכיים\" — that is the leg-curl machine), \"דדליפט\", \"לחיצת חזה\", \"פול בודי\", \"תוכנית אימון\", \"נפח אימון\", \"חימום\", \"התאוששות\". Progressive overload: \"פרוגרסיב אוברלואד (עומס פרוגרסיבי)\" on first use — never \"עומס מתקדם\". Keep English acronyms and pair them once with Hebrew: \"1RM (חזרה מקסימלית)\", \"RPE\", \"RIR\".\n5. Adapt, don't calque: restructure sentences the way an Israeli writer would; no long noun chains; \"a meta-analysis found\" → \"מטא-אנליזה מצאה\"; \"position stand\" → \"עמדה רשמית\" with the organisation's name; \"the evidence suggests\" → \"לפי המחקרים\".\n6. Headings stay informative statements or questions. The FAQ uses the Hebrew \"people also ask\" questions given in the message (adapt their wording, don't mirror the English questions). The gymon block keeps its kind and numbers; translate its labels (\"Week 1\" → \"שבוע 1\").\n7. title ≤ 52 characters, contains the Hebrew primary query; description 100–145 characters; heroTitle 2–4 Hebrew words, natural, no colon.\n8. Do not add facts. Do not drop citation markers. Do not add a disclaimer, a sources section or CTA copy.\n\nJSON Schema:\n{\"$schema\":\"https://json-schema.org/draft/2020-12/schema\",\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"title\":{\"type\":\"string\",\"minLength\":1,\"maxLength\":52,\"description\":\"≤ 52 characters; states or answers the question; contains the primary query.\"},\"heroTitle\":{\"type\":\"string\",\"minLength\":1,\"description\":\"2–4 words, no colon, never a heading.\"},\"description\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Meta description: EN 120–155 characters, HE 100–145.\"},\"primaryQuery\":{\"type\":\"string\",\"minLength\":1,\"description\":\"The primary search query in this language, as people type it.\"},\"imageAlt\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Placeholder alt text; replaced after the image exists.\"},\"tldr\":{\"type\":\"string\",\"minLength\":1,\"description\":\"1–3 sentences that answer the title question, with a GRADE-style certainty verb. Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.\"},\"keyTakeaways\":{\"type\":\"array\",\"minItems\":3,\"maxItems\":5,\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"text\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.\"},\"refs\":{\"type\":\"array\",\"items\":{\"type\":\"string\",\"pattern\":\"^r\\\\d{1,2}$\"},\"description\":\"ids of references that support this item\"}},\"required\":[\"text\"]}},\"sections\":{\"type\":\"array\",\"minItems\":4,\"maxItems\":7,\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"heading\":{\"type\":\"string\",\"minLength\":1,\"description\":\"An informative statement or question; first two words carry the gist.\"},\"apply\":{\"type\":\"boolean\",\"description\":\"true on exactly one section (the practical protocol that holds the cta block), false on every other section.\"},\"blocks\":{\"type\":\"array\",\"minItems\":1,\"items\":{\"anyOf\":[{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"p\"},\"text\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.\"}},\"required\":[\"type\",\"text\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"list\"},\"ordered\":{\"type\":\"boolean\"},\"items\":{\"type\":\"array\",\"minItems\":2,\"maxItems\":8,\"items\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.\"}}},\"required\":[\"type\",\"items\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"takeaway\"},\"text\":{\"type\":\"string\",\"minLength\":1,\"description\":\"One-sentence bottom line of the section. At most one per section.\"}},\"required\":[\"type\",\"text\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"claim\"},\"evidence\":{\"enum\":[\"strong\",\"moderate\",\"limited\",\"mixed\",\"insufficient\"]},\"refs\":{\"type\":\"array\",\"items\":{\"type\":\"string\",\"pattern\":\"^r\\\\d{1,2}$\"},\"description\":\"ids of references that support this item\"},\"text\":{\"type\":\"string\",\"minLength\":1,\"description\":\"The claim, worded with the certainty verb of its evidence level.\"}},\"required\":[\"type\",\"evidence\",\"refs\",\"text\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"callout\"},\"kind\":{\"enum\":[\"note\",\"myth\",\"safety\"]},\"text\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.\"}},\"required\":[\"type\",\"kind\",\"text\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"table\"},\"caption\":{\"type\":\"string\",\"minLength\":1,\"description\":\"What the table shows.\"},\"columns\":{\"type\":\"array\",\"minItems\":2,\"maxItems\":5,\"items\":{\"type\":\"string\",\"minLength\":1}},\"rows\":{\"type\":\"array\",\"minItems\":1,\"maxItems\":10,\"items\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}},\"refs\":{\"type\":\"array\",\"items\":{\"type\":\"string\",\"pattern\":\"^r\\\\d{1,2}$\"},\"description\":\"ids of references that support this item\"}},\"required\":[\"type\",\"caption\",\"columns\",\"rows\",\"refs\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"calculator\"},\"calculator\":{\"enum\":[\"one-rep-max\"]},\"defaults\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"weightKg\":{\"type\":\"number\",\"minimum\":1,\"maximum\":500},\"reps\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":12}},\"required\":[]}},\"required\":[\"type\",\"calculator\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"cta\"}},\"required\":[\"type\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"gymon\"},\"kind\":{\"const\":\"log-example\"},\"exercise\":{\"type\":\"string\",\"minLength\":1},\"caption\":{\"type\":\"string\",\"minLength\":1,\"description\":\"One sentence on what the example shows.\"},\"sessions\":{\"type\":\"array\",\"minItems\":1,\"maxItems\":3,\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"label\":{\"type\":\"string\",\"minLength\":1,\"description\":\"e.g. \\\"Week 1\\\"\"},\"sets\":{\"type\":\"array\",\"minItems\":1,\"maxItems\":6,\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"previous\":{\"anyOf\":[{\"type\":\"null\"},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"kg\":{\"type\":\"number\"},\"reps\":{\"type\":\"integer\"}},\"required\":[\"kg\",\"reps\"]}]},\"kg\":{\"type\":\"number\"},\"reps\":{\"type\":\"integer\"}},\"required\":[\"previous\",\"kg\",\"reps\"]}}},\"required\":[\"label\",\"sets\"]}},\"text\":{\"type\":\"string\",\"minLength\":1,\"description\":\"What the example teaches, numbers recomputed correctly.\"}},\"required\":[\"type\",\"kind\",\"exercise\",\"caption\",\"sessions\",\"text\"]},{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"type\":{\"const\":\"gymon\"},\"kind\":{\"enum\":[\"plan-logic\",\"teardown-finding\"]},\"heading\":{\"type\":\"string\",\"minLength\":1},\"text\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Built only from the GYMON MATERIAL.\"},\"points\":{\"type\":\"array\",\"maxItems\":5,\"items\":{\"type\":\"string\",\"minLength\":1}}},\"required\":[\"type\",\"kind\",\"text\"]}]}}},\"required\":[\"heading\",\"apply\",\"blocks\"]}},\"faq\":{\"type\":\"array\",\"minItems\":3,\"maxItems\":5,\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"q\":{\"type\":\"string\",\"minLength\":1},\"a\":{\"type\":\"string\",\"minLength\":1,\"description\":\"40–60 words. Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.\"},\"refs\":{\"type\":\"array\",\"items\":{\"type\":\"string\",\"pattern\":\"^r\\\\d{1,2}$\"},\"description\":\"ids of references that support this item\"}},\"required\":[\"q\",\"a\"]}},\"quiz\":{\"type\":\"array\",\"maxItems\":3,\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"question\":{\"type\":\"string\",\"minLength\":1},\"options\":{\"type\":\"array\",\"minItems\":3,\"maxItems\":4,\"items\":{\"type\":\"string\",\"minLength\":1}},\"correctIndex\":{\"type\":\"integer\",\"minimum\":0},\"explanation\":{\"type\":\"string\",\"minLength\":1,\"description\":\"Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.\"},\"refs\":{\"type\":\"array\",\"items\":{\"type\":\"string\",\"pattern\":\"^r\\\\d{1,2}$\"},\"description\":\"ids of references that support this item\"}},\"required\":[\"question\",\"options\",\"correctIndex\",\"explanation\"]}},\"cta\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"slot\":{\"enum\":[\"log-sets\",\"track-progress\",\"plan-builder\"]}},\"required\":[\"slot\"]}},\"required\":[\"title\",\"heroTitle\",\"description\",\"primaryQuery\",\"imageAlt\",\"tldr\",\"keyTakeaways\",\"sections\",\"faq\",\"quiz\",\"cta\"]}\n", type: 'string' },
      { id: 'hru', name: 'user', value: expr("Hebrew primary query: {{ $('Topic plan').first().json.primary_keyword_he }}\nHebrew \"people also ask\":\n{{ ($('Topic plan').first().json.paa_he || []).map(q => '- ' + q).join('\\n') }}\nPublished in Hebrew (link targets /he/blog/<slug>): {{ ($('Topic plan').first().json.published || []).map(p => p.slug).join(', ') || '(none)' }}\n\nENGLISH ARTICLE (JSON; its references are kept by the code):\n{{ JSON.stringify($json.article) }}\n\nReference ids and titles (for context only): {{ ($json.references || []).map(r => r.id + ': ' + r.title).join(' | ') }}"), type: 'string' },
    ] }, options: {} },
  },
  output: [{ system: '…', user: '…' }],
});

const hebrewVersion = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Hebrew version',
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 5000,
    parameters: {
      method: 'POST',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openRouterApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ model: 'anthropic/claude-sonnet-5.5', max_tokens: 40000, temperature: 0.4, reasoning: { effort: 'low' }, messages: [{ role: 'system', content: $json.system }, { role: 'user', content: $json.user }] }) }}"),
      options: { timeout: 600000 },
    },
    credentials: CRED_OPENROUTER,
  },
  output: [{ choices: [{ finish_reason: 'stop', message: { content: '{"title":"…"}' } }], usage: { prompt_tokens: 12000, completion_tokens: 14000 } }],
});

const prepareNew = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Prepare (new)', parameters: { mode: 'runOnceForAllItems', jsCode: "// Prepare (new) — assembles the two full article objects in the site's closed schema, plus\n// everything the shared validation chain needs. Code owns: lang, slug, pillar, tags, dates,\n// image fields, editor, and the reference tier / fullTextRead (from the research pack).\n// ===== article constants (site src/lib/article/schema.mjs) + pipeline helpers — generated by build.py =====\n// ---- schema.mjs (generated from the site repo; edit there) ----\nconst SCHEMA_VERSION = 1;\nconst LANGS = ['en', 'he'];\nconst PILLARS = ['progressive-overload', 'sets-reps-volume', 'plans-splits', 'home-gym', 'tools'];\nconst INTENTS = ['know', 'do'];\nconst YMYL_LEVELS = ['low'];\nconst LENGTH_BANDS = ['600-900', '900-1400', '1400-1800'];\nconst EVIDENCE_LEVELS = ['strong', 'moderate', 'limited', 'mixed', 'insufficient'];\nconst CERTAINTY_WORDS = {\nen: {\nstrong: ['results in', 'reliably', 'consistently'],\nmoderate: ['probably', 'likely'],\nlimited: ['may', 'might', 'could'],\nmixed: ['mixed', 'unclear', 'uncertain', 'inconsistent'],\ninsufficient: ['uncertain', 'not enough', 'unknown', 'too little'],\n},\nhe: {\nstrong: ['מביא ל', 'מביאה ל', 'באופן עקבי', 'בעקביות'],\nmoderate: ['כנראה', 'ככל הנראה', 'סביר'],\nlimited: ['ייתכן', 'עשוי', 'עשויה', 'עשויים', 'אולי'],\nmixed: ['אינן חד-משמעיות', 'לא חד-משמעיות', 'סותרות', 'מעורבות'],\ninsufficient: ['אין מספיק', 'לא ידוע', 'לא ברור'],\n},\n};\nconst REF_TIERS = ['PRIMARY', 'AUTHORITY', 'SECONDARY'];\nconst REF_TYPES = [\n'meta-analysis',\n'systematic-review',\n'rct',\n'cohort',\n'cross-sectional',\n'review',\n'position-stand',\n'guideline',\n'other',\n];\nconst CALLOUT_KINDS = ['note', 'myth', 'safety'];\nconst CTA_SLOTS = ['log-sets', 'track-progress', 'plan-builder'];\nconst GYMON_KINDS = ['log-example', 'plan-logic', 'teardown-finding'];\nconst CALCULATORS = {\n'one-rep-max': {\nweightKg: { min: 1, max: 500, default: 80 },\nreps: { min: 1, max: 12, default: 5 },\n},\n};\nconst BLOCK_TYPES = ['p', 'list', 'takeaway', 'claim', 'callout', 'table', 'calculator', 'cta', 'gymon'];\nconst LIMITS = {\ntitle: { min: 20, max: 52, hardMax: 70 },\nheroTitleWords: { min: 1, max: 4 },\ndescription: { en: [120, 155], he: [100, 145] },\ntags: [2, 4],\nkeyTakeaways: [3, 5],\nsections: [4, 7],\nfaq: [0, 5],\nquiz: [0, 3],\nquizOptions: [2, 4],\ntables: 3,\nreferences: [1, 20],\ntldrSentences: 3,\nsentenceWords: 25,\ninternalLinks: [2, 4],\n};\nconst COMMERCIAL_HOST = /(amazon\\.|ebay\\.|walmart\\.|iherb\\.|bodybuilding\\.com|myprotein|gnc\\.com|kidneystronger\\.com|mtntactical\\.com|\\/\\/(shop|store)\\.)/i;\nconst TRACKING_PARAM = /[?&](utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|cmpid|icid|s_cid)=/i;\nconst PRIMARY_HOST = /(pubmed\\.ncbi\\.nlm\\.nih\\.gov|pmc\\.ncbi\\.nlm\\.nih\\.gov|ncbi\\.nlm\\.nih\\.gov\\/pmc|doi\\.org|bjsm\\.bmj\\.com|bmj\\.com|link\\.springer\\.com|springeropen\\.com|biomedcentral\\.com|frontiersin\\.org|journals\\.lww\\.com|journals\\.physiology\\.org|tandfonline\\.com|jissn|sciencedirect\\.com|onlinelibrary\\.wiley\\.com|mdpi\\.com|nature\\.com|cochranelibrary\\.com|journals\\.plos\\.org|jamanetwork\\.com|thelancet\\.com|academic\\.oup\\.com|journals\\.sagepub\\.com|humankinetics\\.com|biolsport\\.com|termedia\\.pl)/i;\nconst AUTHORITY_HOST = /(acsm\\.org|nsca\\.com|sportsnutritionsociety\\.org|\\.gov(\\/|$|\\.)|nih\\.gov|who\\.int|nhs\\.uk|\\.edu(\\/|$)|\\.ac\\.[a-z]{2}(\\/|$)|ausport\\.gov\\.au)/i;\nconst tierOfUrl = (u) => (PRIMARY_HOST.test(u) ? 'PRIMARY' : AUTHORITY_HOST.test(u) ? 'AUTHORITY' : 'SECONDARY');\nconst YMYL_TOPIC = new RegExp(\n[\n'supplement', 'creatine', 'protein powder', 'whey', 'caffeine', 'pre-?workout', 'vitamin', 'steroid',\n'weight[- ]?loss', 'fat[- ]?loss', 'lose weight', 'diet', 'calori', 'bmi\\\\b', 'keto', 'fasting',\n'injur', 'pain', 'rehab', 'physio', 'tendin', 'surgery',\n'pregnan', 'postpartum', 'menopaus', 'menstrua',\n'diabet', 'hypertens', 'blood pressure', 'cancer', 'osteopor', 'arthritis', 'disease', 'medical', 'medication', 'drug',\n'eating disorder',\n'תוסף', 'תוספי', 'קריאטין', 'אבקת חלבון', 'ירידה במשקל', 'הרזיה', 'דיאטה', 'קלורי', 'פציע', 'כאב', 'שיקום',\n'הריון', 'היריון', 'לידה', 'גיל המעבר', 'סוכרת', 'לחץ דם', 'מחלה', 'תרופ',\n].join('|'),\n'i',\n);\nconst HE_GENDERED_WORDS = [\n'אתה', 'תוכל', 'תוכלי', 'תרצה', 'תרצי', 'תצטרך', 'תצטרכי', 'תרגיש', 'תרגישי', 'תראה', 'תראי',\n'נסה', 'נסי', 'הזן', 'הזיני', 'קח', 'קחי', 'תן', 'תני', 'שים', 'שימי', 'זכור', 'זכרי',\n'בצע', 'בצעי', 'הקפד', 'הקפידי', 'הוסף', 'הוסיפי', 'רשום', 'רשמי', 'התחל', 'התחילי',\n'בחר', 'בחרי', 'הרם', 'הרימי', 'הורד', 'הורידי', 'המשך', 'המשיכי', 'עצור', 'עצרי',\n'המתאמן', 'המתאמנת',\n];\nconst CODE_FIELDS = [\n'schemaVersion', 'lang', 'slug', 'pillar', 'tags', 'intent', 'ymylLevel', 'lengthBand', 'image',\n'imageAiGenerated', 'createdAt', 'updatedAt', 'reviewedAt', 'editor', 'aiAssisted', 'sample',\n];\nconst TOP_LEVEL_KEYS = [\n...CODE_FIELDS,\n'title', 'heroTitle', 'description', 'primaryQuery', 'imageAlt',\n'tldr', 'keyTakeaways', 'sections', 'faq', 'quiz', 'references', 'cta',\n];\n\n// ---- pipeline helpers (n8n/blog-articles/src/code/pipeline_lib.js) ----\n\nconst cleanUrl = (u) => String(u || '').trim()\n  .replace(/([?&])(?:utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|ref|source|campaign|cmpid|icid|s_cid)=[^&#]*/gi, '$1')\n  .replace(/\\?&+/, '?').replace(/&{2,}/g, '&').replace(/[?&]+(#|$)/, '$1');\n\n/** The model's reply → object. Tolerates a code fence or prose around the JSON; throws a clear error otherwise. */\nfunction parseLooseJson(raw, label) {\n  if (raw && typeof raw === 'object') return raw;\n  const s = String(raw || '').replace(/^\\s*```(?:json)?\\s*/i, '').replace(/\\s*```\\s*$/, '');\n  const a = s.indexOf('{');\n  const b = s.lastIndexOf('}');\n  if (a < 0 || b <= a) throw new Error(`${label}: the model returned no JSON object (truncated at max tokens?). First 200 chars: ${s.slice(0, 200)}`);\n  try {\n    return JSON.parse(s.slice(a, b + 1));\n  } catch (e) {\n    throw new Error(`${label}: invalid JSON (${e.message}). The reply may have been cut off; check finish_reason in the execution.`);\n  }\n}\n\n/** Keys in the canonical order of the article contract; drops anything the writer must not set. */\nfunction canonical(a) {\n  const out = {};\n  for (const k of TOP_LEVEL_KEYS) if (a[k] !== undefined) out[k] = a[k];\n  return out;\n}\n\n/** Writer output minus every field the code owns. */\nfunction writerFields(a) {\n  const out = {};\n  for (const [k, v] of Object.entries(a || {})) if (!CODE_FIELDS.includes(k) && k !== 'references') out[k] = v;\n  return out;\n}\n\n/** The code-owned fields of a new draft. */\nfunction codeFields(plan, lang, today) {\n  return {\n    schemaVersion: SCHEMA_VERSION,\n    lang,\n    slug: plan.slug,\n    pillar: plan.pillar,\n    tags: plan.tags,\n    intent: plan.intent,\n    ymylLevel: 'low',\n    lengthBand: plan.length_band,\n    image: `/blog/${plan.slug}.jpg`,\n    imageAiGenerated: true,\n    createdAt: today,\n    reviewedAt: null,\n    editor: 'osher-alon',\n    aiAssisted: true,\n  };\n}\n\n/** References as the code owns them: cleaned URL, tier from the URL, fullTextRead from the research pack. */\nfunction codeReferences(refs, readUrls) {\n  return (Array.isArray(refs) ? refs : []).map((r) => {\n    const url = cleanUrl(r && r.url);\n    const out = {\n      id: r.id,\n      title: String(r.title || '').trim(),\n      authors: Array.isArray(r.authors) ? r.authors.filter((x) => typeof x === 'string' && x.trim()) : [],\n      year: Number.isInteger(r.year) ? r.year : null,\n      venue: typeof r.venue === 'string' ? r.venue : '',\n      url,\n      tier: tierOfUrl(url),\n      type: r.type,\n      fullTextRead: (readUrls || []).includes(url),\n      quote: String(r.quote || '').trim(),\n    };\n    if (r.doi) out.doi = String(r.doi).trim();\n    if (r.pmid) out.pmid = String(r.pmid).trim();\n    return out;\n  });\n}\n// ===== end of shared code =====\n\n// ---- llmText + apply flags (n8n/blog-articles/src/code/llm_text.js): only the nodes that read a Sonnet reply ----\n\n/**\n * The text of an OpenRouter chat completion (HTTP node) or of a chain node ({ text }).\n * A reply cut off at max_tokens is an error here, with the token usage, because hidden\n * reasoning is billed as completion and can eat the whole budget (execution 1539).\n */\nfunction llmText(j, label) {\n  if (j && typeof j.text === 'string') return j.text;\n  const c = j && Array.isArray(j.choices) ? j.choices[0] : null;\n  if (!c) throw new Error(`${label}: no completion in the response: ${JSON.stringify(j || {}).slice(0, 300)}`);\n  if (c.finish_reason === 'length') {\n    throw new Error(`${label}: cut off at max_tokens (finish_reason: length, usage: ${JSON.stringify(j.usage || {})}). Raise max_tokens or lower the reasoning effort.`);\n  }\n  const m = c.message || {};\n  return typeof m.content === 'string' ? m.content : (Array.isArray(m.content) ? m.content.map((x) => x.text || '').join('') : '');\n}\n\n/**\n * The \"apply\" flag is structure, not language: Hebrew takes it from the English section at the\n * same index (the validator already requires the same sections in both). Execution 1541: the\n * writer put the protocol under an \"Apply it:\" heading but never set the field.\n */\nfunction syncApply(en, he) {\n  const es = (en && en.sections) || [];\n  ((he && he.sections) || []).forEach((s, i) => { if (es[i]) s.apply = es[i].apply === true; });\n  return he;\n}\n\n/** When the writer marked no section, the one section holding the cta block is the apply section. */\nfunction markApplyFromCta(a) {\n  const secs = (a && a.sections) || [];\n  if (secs.some((s) => s.apply === true)) return a;\n  const withCta = secs.filter((s) => (s.blocks || []).some((b) => b && b.type === 'cta'));\n  if (withCta.length === 1) secs.forEach((s) => { s.apply = s === withCta[0]; });\n  return a;\n}\n\nconst plan = $('Topic plan').first().json;\nconst pack = $('Research pack').first().json;\nconst en = $('Parse article (EN)').first().json;\nconst he = writerFields(parseLooseJson(llmText($input.first().json, 'Hebrew version'), 'Hebrew version'));\nconst today = $now.setZone('Asia/Jerusalem').toFormat('yyyy-MM-dd');\nconst refs = codeReferences(en.references, pack.read_urls);\nconst article_en = canonical({ ...codeFields(plan, 'en', today), ...en.article, references: refs });\nsyncApply(en.article, he);\nconst article_he = canonical({ ...codeFields(plan, 'he', today), ...he, references: refs });\nreturn [{ json: {\n  mode: 'new',\n  plan,\n  article_en,\n  article_he,\n  research_text: pack.research,\n  allowed_urls: pack.allowed_urls,\n  read_urls: pack.read_urls,\n  published: plan.published || [],\n}, pairedItem: { item: 0 } }];\n" } },
  output: [{ mode: 'new', article_en: {}, article_he: {}, research_text: '…', allowed_urls: [], read_urls: [], published: [] }],
});

const validateArticles = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Validate articles', parameters: { mode: 'runOnceForAllItems', jsCode: "// Validate articles — the site's own validator (src/lib/article/validate.mjs, inlined below)\n// on both languages, with the pipeline context: the research pack (quotes and their numbers\n// must be in it), the Gymon material, the allowed URLs and the published slugs. Errors block\n// Approve on the review page; warnings are shown to the reviewer.\n// ===== shared article contract (site src/lib/article) + pipeline helpers — generated by build.py =====\n// ---- schema.mjs (generated from the site repo; edit there) ----\nconst SCHEMA_VERSION = 1;\nconst LANGS = ['en', 'he'];\nconst PILLARS = ['progressive-overload', 'sets-reps-volume', 'plans-splits', 'home-gym', 'tools'];\nconst INTENTS = ['know', 'do'];\nconst YMYL_LEVELS = ['low'];\nconst LENGTH_BANDS = ['600-900', '900-1400', '1400-1800'];\nconst EVIDENCE_LEVELS = ['strong', 'moderate', 'limited', 'mixed', 'insufficient'];\nconst CERTAINTY_WORDS = {\nen: {\nstrong: ['results in', 'reliably', 'consistently'],\nmoderate: ['probably', 'likely'],\nlimited: ['may', 'might', 'could'],\nmixed: ['mixed', 'unclear', 'uncertain', 'inconsistent'],\ninsufficient: ['uncertain', 'not enough', 'unknown', 'too little'],\n},\nhe: {\nstrong: ['מביא ל', 'מביאה ל', 'באופן עקבי', 'בעקביות'],\nmoderate: ['כנראה', 'ככל הנראה', 'סביר'],\nlimited: ['ייתכן', 'עשוי', 'עשויה', 'עשויים', 'אולי'],\nmixed: ['אינן חד-משמעיות', 'לא חד-משמעיות', 'סותרות', 'מעורבות'],\ninsufficient: ['אין מספיק', 'לא ידוע', 'לא ברור'],\n},\n};\nconst REF_TIERS = ['PRIMARY', 'AUTHORITY', 'SECONDARY'];\nconst REF_TYPES = [\n'meta-analysis',\n'systematic-review',\n'rct',\n'cohort',\n'cross-sectional',\n'review',\n'position-stand',\n'guideline',\n'other',\n];\nconst CALLOUT_KINDS = ['note', 'myth', 'safety'];\nconst CTA_SLOTS = ['log-sets', 'track-progress', 'plan-builder'];\nconst GYMON_KINDS = ['log-example', 'plan-logic', 'teardown-finding'];\nconst CALCULATORS = {\n'one-rep-max': {\nweightKg: { min: 1, max: 500, default: 80 },\nreps: { min: 1, max: 12, default: 5 },\n},\n};\nconst BLOCK_TYPES = ['p', 'list', 'takeaway', 'claim', 'callout', 'table', 'calculator', 'cta', 'gymon'];\nconst LIMITS = {\ntitle: { min: 20, max: 52, hardMax: 70 },\nheroTitleWords: { min: 1, max: 4 },\ndescription: { en: [120, 155], he: [100, 145] },\ntags: [2, 4],\nkeyTakeaways: [3, 5],\nsections: [4, 7],\nfaq: [0, 5],\nquiz: [0, 3],\nquizOptions: [2, 4],\ntables: 3,\nreferences: [1, 20],\ntldrSentences: 3,\nsentenceWords: 25,\ninternalLinks: [2, 4],\n};\nconst COMMERCIAL_HOST = /(amazon\\.|ebay\\.|walmart\\.|iherb\\.|bodybuilding\\.com|myprotein|gnc\\.com|kidneystronger\\.com|mtntactical\\.com|\\/\\/(shop|store)\\.)/i;\nconst TRACKING_PARAM = /[?&](utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|cmpid|icid|s_cid)=/i;\nconst PRIMARY_HOST = /(pubmed\\.ncbi\\.nlm\\.nih\\.gov|pmc\\.ncbi\\.nlm\\.nih\\.gov|ncbi\\.nlm\\.nih\\.gov\\/pmc|doi\\.org|bjsm\\.bmj\\.com|bmj\\.com|link\\.springer\\.com|springeropen\\.com|biomedcentral\\.com|frontiersin\\.org|journals\\.lww\\.com|journals\\.physiology\\.org|tandfonline\\.com|jissn|sciencedirect\\.com|onlinelibrary\\.wiley\\.com|mdpi\\.com|nature\\.com|cochranelibrary\\.com|journals\\.plos\\.org|jamanetwork\\.com|thelancet\\.com|academic\\.oup\\.com|journals\\.sagepub\\.com|humankinetics\\.com|biolsport\\.com|termedia\\.pl)/i;\nconst AUTHORITY_HOST = /(acsm\\.org|nsca\\.com|sportsnutritionsociety\\.org|\\.gov(\\/|$|\\.)|nih\\.gov|who\\.int|nhs\\.uk|\\.edu(\\/|$)|\\.ac\\.[a-z]{2}(\\/|$)|ausport\\.gov\\.au)/i;\nconst tierOfUrl = (u) => (PRIMARY_HOST.test(u) ? 'PRIMARY' : AUTHORITY_HOST.test(u) ? 'AUTHORITY' : 'SECONDARY');\nconst YMYL_TOPIC = new RegExp(\n[\n'supplement', 'creatine', 'protein powder', 'whey', 'caffeine', 'pre-?workout', 'vitamin', 'steroid',\n'weight[- ]?loss', 'fat[- ]?loss', 'lose weight', 'diet', 'calori', 'bmi\\\\b', 'keto', 'fasting',\n'injur', 'pain', 'rehab', 'physio', 'tendin', 'surgery',\n'pregnan', 'postpartum', 'menopaus', 'menstrua',\n'diabet', 'hypertens', 'blood pressure', 'cancer', 'osteopor', 'arthritis', 'disease', 'medical', 'medication', 'drug',\n'eating disorder',\n'תוסף', 'תוספי', 'קריאטין', 'אבקת חלבון', 'ירידה במשקל', 'הרזיה', 'דיאטה', 'קלורי', 'פציע', 'כאב', 'שיקום',\n'הריון', 'היריון', 'לידה', 'גיל המעבר', 'סוכרת', 'לחץ דם', 'מחלה', 'תרופ',\n].join('|'),\n'i',\n);\nconst HE_GENDERED_WORDS = [\n'אתה', 'תוכל', 'תוכלי', 'תרצה', 'תרצי', 'תצטרך', 'תצטרכי', 'תרגיש', 'תרגישי', 'תראה', 'תראי',\n'נסה', 'נסי', 'הזן', 'הזיני', 'קח', 'קחי', 'תן', 'תני', 'שים', 'שימי', 'זכור', 'זכרי',\n'בצע', 'בצעי', 'הקפד', 'הקפידי', 'הוסף', 'הוסיפי', 'רשום', 'רשמי', 'התחל', 'התחילי',\n'בחר', 'בחרי', 'הרם', 'הרימי', 'הורד', 'הורידי', 'המשך', 'המשיכי', 'עצור', 'עצרי',\n'המתאמן', 'המתאמנת',\n];\nconst CODE_FIELDS = [\n'schemaVersion', 'lang', 'slug', 'pillar', 'tags', 'intent', 'ymylLevel', 'lengthBand', 'image',\n'imageAiGenerated', 'createdAt', 'updatedAt', 'reviewedAt', 'editor', 'aiAssisted', 'sample',\n];\nconst TOP_LEVEL_KEYS = [\n...CODE_FIELDS,\n'title', 'heroTitle', 'description', 'primaryQuery', 'imageAlt',\n'tldr', 'keyTakeaways', 'sections', 'faq', 'quiz', 'references', 'cta',\n];\n// ---- inline.mjs (generated from the site repo; edit there) ----\nconst INLINE_TOKEN = /\\*\\*([^*]+?)\\*\\*|\\[\\[([^\\]]+)\\]\\]|\\[([^\\]]+)\\]\\((\\/[^)\\s]*)\\)/g;\nconst INTERNAL_HREF = /^\\/(he\\/)?blog\\/[a-z0-9]+(?:-[a-z0-9]+)*\\/?$/;\nconst escHtml = (s) =>\nString(s == null ? '' : s)\n.replace(/&/g, '&amp;')\n.replace(/</g, '&lt;')\n.replace(/>/g, '&gt;')\n.replace(/\"/g, '&quot;');\nconst markerIds = (inner) =>\nString(inner)\n.split(/[,\\s]+/)\n.map((s) => s.trim())\n.filter(Boolean);\nfunction refsIn(text) {\nconst out = [];\nString(text || '').replace(INLINE_TOKEN, (m, _bold, refs) => {\nif (refs) for (const id of markerIds(refs)) if (!out.includes(id)) out.push(id);\nreturn m;\n});\nreturn out;\n}\nfunction linksIn(text) {\nconst out = [];\nString(text || '').replace(INLINE_TOKEN, (m, _bold, _refs, _anchor, href) => {\nif (href) out.push(href);\nreturn m;\n});\nreturn out;\n}\nfunction plainText(text) {\nreturn String(text || '')\n.replace(INLINE_TOKEN, (_m, bold, refs, anchor) => (bold != null ? bold : refs != null ? '' : anchor))\n.replace(/\\s+([.,;:!?])/g, '$1')\n.replace(/\\s{2,}/g, ' ')\n.trim();\n}\nfunction bidiWrap(escaped) {\nreturn escaped.replace(\n/(\\d+(?:[.,]\\d+)?)(\\s*[–—×x]\\s*)(\\d+(?:[.,]\\d+)?)/g,\n(m) => `<span dir=\"ltr\">${m}</span>`,\n);\n}\nfunction renderInline(text, opts = {}) {\nconst lang = opts.lang || 'en';\nconst plain = (s) => (lang === 'he' ? bidiWrap(escHtml(s)) : escHtml(s));\nconst cite = (ids) => {\nconst parts = ids.map((id) => {\nconst n = opts.refNumber ? opts.refNumber(id) : undefined;\nconst label = n == null ? '?' : String(n);\nconst pop = opts.refPopoverId ? opts.refPopoverId(id) : null;\nreturn pop\n? `<button type=\"button\" class=\"cite-btn\" popovertarget=\"${escHtml(pop)}\" aria-label=\"${escHtml(\n(opts.sourceLabel || 'Source') + ' ' + label,\n)}\">${label}</button>`\n: `<a class=\"cite-btn\" href=\"#ref-${escHtml(id)}\">${label}</a>`;\n});\nreturn `<sup class=\"cite\" dir=\"ltr\">[${parts.join(', ')}]</sup>`;\n};\nlet out = '';\nlet last = 0;\nconst src = String(text == null ? '' : text);\nsrc.replace(INLINE_TOKEN, (m, bold, refs, anchor, href, offset) => {\nout += plain(src.slice(last, offset));\nif (bold != null) out += `<strong>${plain(bold)}</strong>`;\nelse if (refs != null) out = out.replace(/\\s+$/, '') + cite(markerIds(refs)); // keep the marker on its word\nelse if (INTERNAL_HREF.test(href)) out += `<a href=\"${escHtml(href)}\">${plain(anchor)}</a>`;\nelse out += plain(anchor);\nlast = offset + m.length;\nreturn m;\n});\nout += plain(src.slice(last));\nreturn out;\n}\nfunction sentences(text) {\nreturn plainText(text)\n.split(/(?<=[.!?])\\s+(?=\\S)/)\n.map((s) => s.trim())\n.filter(Boolean);\n}\nconst wordCount = (text) => plainText(text).split(/\\s+/).filter(Boolean).length;\n// ---- validate.mjs (generated from the site repo; edit there) ----\nconst SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;\nconst DATE = /^\\d{4}-\\d{2}-\\d{2}$/;\nconst REF_ID = /^r\\d{1,2}$/;\nconst DOI = /^10\\.\\d{4,9}\\/\\S+$/;\nconst HE_LETTER = 'א-ת';\nconst isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);\nconst isStr = (v, min = 1) => typeof v === 'string' && v.trim().length >= min;\nfunction numbersIn(text) {\nconst out = [];\nString(text || '').replace(/(?<![A-Za-z])\\d+(?:[.,]\\d+)*(?![A-Za-z\\d])/g, (m) => {\nlet n = m;\nif (/^\\d{1,3}(,\\d{3})+$/.test(n)) n = n.replace(/,/g, '');\nelse n = n.replace(',', '.');\nn = n.replace(/^0+(?=\\d)/, '');\nout.push(n);\nreturn m;\n});\nreturn out;\n}\nfunction normForMatch(s) {\nreturn String(s || '')\n.toLowerCase()\n.replace(/[‘’`´]/g, \"'\")\n.replace(/[“”„]/g, '\"')\n.replace(/[–—−]/g, '-')\n.replace(/&lt;/g, '<')\n.replace(/&gt;/g, '>')\n.replace(/&amp;/g, '&')\n.replace(/\\s+/g, ' ')\n.trim();\n}\nfunction quoteInResearch(quote, research) {\nconst hay = normForMatch(research);\nconst chunks = normForMatch(quote)\n.split(/\\.\\.\\.|…|\\[…\\]|\\[\\.\\.\\.\\]/)\n.map((c) => c.trim())\n.filter((c) => c.length >= 20);\nif (!chunks.length) return hay.includes(normForMatch(quote));\nreturn chunks.every((c) => hay.includes(c));\n}\nconst readTimeOf = (article) => {\nconst words = collectUnits(article).reduce((n, u) => n + wordCount(u.text), 0);\nreturn Math.max(1, Math.round(words / (article && article.lang === 'he' ? 200 : 230)));\n};\nfunction collectUnits(a) {\nconst units = [];\nconst push = (path, text, refs = [], kind = 'text') => {\nif (typeof text !== 'string') return;\nunits.push({ path, text, refs: [...new Set([...(refs || []), ...refsIn(text)])], kind });\n};\nif (!isObj(a)) return units;\npush('tldr', a.tldr);\n(Array.isArray(a.keyTakeaways) ? a.keyTakeaways : []).forEach((t, i) => isObj(t) && push(`keyTakeaways[${i}]`, t.text, t.refs));\n(Array.isArray(a.sections) ? a.sections : []).forEach((s, si) => {\nif (!isObj(s)) return;\npush(`sections[${si}].heading`, s.heading, [], 'heading');\n(Array.isArray(s.blocks) ? s.blocks : []).forEach((b, bi) => {\nif (!isObj(b)) return;\nconst p = `sections[${si}].blocks[${bi}]`;\nif (b.type === 'p' || b.type === 'takeaway' || b.type === 'callout') push(p, b.text);\nelse if (b.type === 'claim') push(p, b.text, b.refs);\nelse if (b.type === 'list') (Array.isArray(b.items) ? b.items : []).forEach((it, ii) => push(`${p}.items[${ii}]`, it));\nelse if (b.type === 'table') {\npush(`${p}.caption`, b.caption, b.refs);\n(Array.isArray(b.rows) ? b.rows : []).forEach((r, ri) =>\n(Array.isArray(r) ? r : []).forEach((c, ci) => push(`${p}.rows[${ri}][${ci}]`, String(c), b.refs)),\n);\n} else if (b.type === 'gymon') {\nconst kind = b.kind === 'log-example' ? 'gymon-example' : 'gymon';\npush(`${p}.text`, b.text, [], kind);\n(Array.isArray(b.points) ? b.points : []).forEach((pt, pi) => push(`${p}.points[${pi}]`, pt, [], kind));\nif (b.caption) push(`${p}.caption`, b.caption, [], kind);\n}\n});\n});\n(Array.isArray(a.faq) ? a.faq : []).forEach((f, i) => {\nif (!isObj(f)) return;\npush(`faq[${i}].q`, f.q, [], 'heading');\npush(`faq[${i}].a`, f.a, f.refs);\n});\n(Array.isArray(a.quiz) ? a.quiz : []).forEach((q, i) => {\nif (!isObj(q)) return;\npush(`quiz[${i}].question`, q.question, [], 'quiz');\n(Array.isArray(q.options) ? q.options : []).forEach((o, oi) => push(`quiz[${i}].options[${oi}]`, o, [], 'quiz'));\npush(`quiz[${i}].explanation`, q.explanation, q.refs);\n});\nreturn units;\n}\nfunction ymylGuard(fields) {\nconst hits = [];\nfor (const [k, v] of Object.entries(fields || {})) {\nconst m = String(v || '').match(YMYL_TOPIC);\nif (m) hits.push(`${k}: \"${m[0]}\"`);\n}\nreturn hits;\n}\nconst GENDERED = new RegExp(\n`(?:^|[^${HE_LETTER}])(?:ו|ש|כש)?(${HE_GENDERED_WORDS.join('|')})(?![${HE_LETTER}])`,\n'g',\n);\nconst SLASH_FORM = new RegExp(`[${HE_LETTER}]+/(?:ה|ת|ית|י|ים|ות)(?![${HE_LETTER}])`, 'g');\nfunction hebrewLint(text) {\nconst out = [];\nconst t = String(text || '');\nlet m;\nGENDERED.lastIndex = 0;\nwhile ((m = GENDERED.exec(t))) out.push(`gendered form \"${m[1]}\" (use plural, \"יש ל-\" or an impersonal form)`);\nfor (const s of t.match(SLASH_FORM) || []) out.push(`slash form \"${s}\" (not allowed)`);\nfor (const s of t.match(/\\d+\\s*[–—]\\s*\\d+/g) || []) out.push(`range \"${s}\" with a dash flips in RTL — write \"X עד Y\"`);\nfor (const s of t.match(/\\d+\\s*[×xX]\\s*\\d+/g) || []) out.push(`\"${s}\" flips in RTL — write \"N סטים של M\"`);\nif (/כפיפות ברכיים/.test(t)) out.push('\"כפיפות ברכיים\" means the leg-curl machine in Israeli gym usage — use \"סקוואט\" for squat');\nif (/עומס מתקדם/.test(t)) out.push('\"עומס מתקדם\" is a calque nobody searches — use \"פרוגרסיב אוברלואד (עומס פרוגרסיבי)\"');\nif (/(^|[^*])\\*[^*\\s][^*]*\\*(?!\\*)/.test(t) || /(^|\\s)_[^_]+_(\\s|$)/.test(t)) out.push('italic markup — Hebrew has no italic; use **bold** sparingly');\nreturn out;\n}\nconst ARTIFACTS = /(as an ai\\b|as a language model|in conclusion, it'?s important|\\[placeholder|lorem ipsum|\\bTODO\\b|<PLACEHOLDER)/i;\nconst MEDICAL_EN = /\\b(cures?|guarantee[sd]?|prevents? injur(y|ies)|treats?|heals?)\\b/i;\nconst MEDICAL_HE = /(מרפא|מבטיח|מונע פציעות|מונעת פציעות|ריפוי)/;\nconst FABRICATED = /(our users|users (told|tell) us|in my experience|my clients|i've seen|המשתמשים שלנו|מניסיוני|הלקוחות שלי)/i;\nconst RAW_HTML = /<\\/?[a-z][a-z0-9-]*(\\s[^>]*)?>/i;\nconst EXT_MD_LINK = /\\[[^\\]]+\\]\\(\\s*(https?:|www\\.)/i;\nconst HEADING_MD = /(^|\\n)\\s{0,3}#{1,6}\\s/;\nfunction validateArticle(a, ctx = {}) {\nconst errors = [];\nconst warnings = [];\nconst err = (path, message) => errors.push({ path, message });\nconst warn = (path, message) => warnings.push({ path, message });\nconst pipeline = ctx.mode === 'pipeline';\nif (!isObj(a)) {\nerr('', 'article is not an object');\nreturn { errors, warnings, stats: {} };\n}\nfor (const k of Object.keys(a)) if (!TOP_LEVEL_KEYS.includes(k)) err(k, 'unknown field (closed schema)');\nif (a.schemaVersion !== SCHEMA_VERSION) err('schemaVersion', `must be ${SCHEMA_VERSION}`);\nif (!LANGS.includes(a.lang)) err('lang', `must be one of ${LANGS.join(', ')}`);\nconst lang = LANGS.includes(a.lang) ? a.lang : 'en';\nif (!isStr(a.slug) || !SLUG.test(a.slug)) err('slug', 'lowercase latin letters, digits and dashes');\nif (!isStr(a.title)) err('title', 'required');\nelse {\nif (a.title.length > LIMITS.title.hardMax) err('title', `${a.title.length} characters (hard limit ${LIMITS.title.hardMax})`);\nelse if (a.title.length > LIMITS.title.max) warn('title', `${a.title.length} characters — SEO doctrine caps titles at ${LIMITS.title.max}`);\nif (a.title.length < LIMITS.title.min) warn('title', 'very short');\n}\nif (!isStr(a.heroTitle)) err('heroTitle', 'required (2–4 words)');\nelse {\nconst n = a.heroTitle.trim().split(/\\s+/).length;\nif (n > 6) err('heroTitle', `${n} words`);\nelse if (n > LIMITS.heroTitleWords.max) warn('heroTitle', `${n} words (2–4 expected)`);\n}\nif (!isStr(a.description)) err('description', 'required');\nelse {\nconst [lo, hi] = LIMITS.description[lang];\nif (a.description.length < lo || a.description.length > hi) warn('description', `${a.description.length} characters (${lo}–${hi} expected)`);\n}\nif (!PILLARS.includes(a.pillar)) err('pillar', `must be one of ${PILLARS.join(', ')}`);\nif (!Array.isArray(a.tags) || a.tags.length < LIMITS.tags[0] || a.tags.length > LIMITS.tags[1] || !a.tags.every((t) => isStr(t) && SLUG.test(t)))\nerr('tags', `${LIMITS.tags[0]}–${LIMITS.tags[1]} kebab-case tags`);\nif (!INTENTS.includes(a.intent)) err('intent', `must be one of ${INTENTS.join(', ')}`);\nif (!YMYL_LEVELS.includes(a.ymylLevel)) err('ymylLevel', 'only low-YMYL topics are published (no credentialed reviewer)');\nif (!LENGTH_BANDS.includes(a.lengthBand)) err('lengthBand', `must be one of ${LENGTH_BANDS.join(', ')}`);\nif (!isStr(a.primaryQuery)) err('primaryQuery', 'required');\nconst ymyl = ymylGuard({ slug: a.slug, title: a.title, primaryQuery: a.primaryQuery, heroTitle: a.heroTitle });\nif (ymyl.length) err('topic', `YMYL topic guard: ${ymyl.join('; ')}`);\nif (!isStr(a.image) || !/^(\\/|https:\\/\\/)/.test(a.image)) err('image', 'path under public/ or https URL');\nif (!isStr(a.imageAlt, 8)) err('imageAlt', 'required');\nif (typeof a.imageAiGenerated !== 'boolean') err('imageAiGenerated', 'boolean required');\nif (!isStr(a.createdAt) || !DATE.test(a.createdAt)) err('createdAt', 'YYYY-MM-DD');\nif (a.updatedAt != null && (!DATE.test(String(a.updatedAt)) || String(a.updatedAt) < String(a.createdAt)))\nerr('updatedAt', 'YYYY-MM-DD, not before createdAt (set only on a substantive change)');\nif (a.reviewedAt != null && !DATE.test(String(a.reviewedAt))) err('reviewedAt', 'YYYY-MM-DD or null');\nif (a.editor !== 'osher-alon') err('editor', 'must be \"osher-alon\" (the named human editor)');\nif (a.aiAssisted !== true) err('aiAssisted', 'must be true (drives the disclosure line)');\nif (a.sample != null && typeof a.sample !== 'boolean') err('sample', 'boolean');\nif (!a.sample && a.reviewedAt == null && !pipeline) err('reviewedAt', 'a non-sample article must carry the date of its human review');\nconst refs = new Map();\nif (!Array.isArray(a.references) || a.references.length < LIMITS.references[0] || a.references.length > LIMITS.references[1])\nerr('references', `${LIMITS.references[0]}–${LIMITS.references[1]} references`);\n(Array.isArray(a.references) ? a.references : []).forEach((r, i) => {\nconst p = `references[${i}]`;\nif (!isObj(r)) return err(p, 'object expected');\nconst allowed = ['id', 'title', 'authors', 'year', 'venue', 'url', 'doi', 'pmid', 'tier', 'type', 'fullTextRead', 'quote'];\nfor (const k of Object.keys(r)) if (!allowed.includes(k)) err(`${p}.${k}`, 'unknown field');\nif (!isStr(r.id) || !REF_ID.test(r.id)) err(`${p}.id`, 'r1, r2, …');\nelse if (refs.has(r.id)) err(`${p}.id`, `duplicate id ${r.id}`);\nelse refs.set(r.id, r);\nif (!isStr(r.title)) err(`${p}.title`, 'required');\nif (!Array.isArray(r.authors) || !r.authors.every((x) => isStr(x))) err(`${p}.authors`, 'array of names');\nif (r.year != null && !(Number.isInteger(r.year) && r.year > 1900 && r.year < 2100)) err(`${p}.year`, 'year or null');\nif (r.venue != null && typeof r.venue !== 'string') err(`${p}.venue`, 'string');\nif (!isStr(r.url) || !/^https:\\/\\/[^\\s]+$/.test(r.url)) err(`${p}.url`, 'https URL');\nelse {\nif (COMMERCIAL_HOST.test(r.url)) err(`${p}.url`, 'commercial host — not a source');\nif (TRACKING_PARAM.test(r.url)) err(`${p}.url`, 'tracking parameters must be stripped');\nif (r.tier !== tierOfUrl(r.url)) err(`${p}.tier`, `is ${r.tier}, the URL's tier is ${tierOfUrl(r.url)}`);\nif (Array.isArray(ctx.allowedUrls) && !ctx.allowedUrls.includes(r.url)) err(`${p}.url`, 'not in the research pack (invented or off-list URL)');\n}\nif (r.doi != null && !(isStr(r.doi) && DOI.test(r.doi))) err(`${p}.doi`, '10.xxxx/… or omit');\nif (r.pmid != null && !(isStr(r.pmid) && /^\\d{4,9}$/.test(r.pmid))) err(`${p}.pmid`, 'digits or omit');\nif (!REF_TIERS.includes(r.tier)) err(`${p}.tier`, REF_TIERS.join(' | '));\nif (!REF_TYPES.includes(r.type)) err(`${p}.type`, REF_TYPES.join(' | '));\nif (typeof r.fullTextRead !== 'boolean') err(`${p}.fullTextRead`, 'boolean');\nif (!isStr(r.quote, 10)) err(`${p}.quote`, 'verbatim snippet from the source is required');\nelse if (typeof ctx.researchText === 'string') {\nif (!quoteInResearch(r.quote, ctx.researchText)) warn(`${p}.quote`, 'not found verbatim in the research pack — check it against the source');\nconst hay = normForMatch(ctx.researchText);\nfor (const n of numbersIn(r.quote)) if (!hay.includes(n)) err(`${p}.quote`, `number ${n} appears in no source text (fabricated?)`);\n}\n});\nif (!isStr(a.tldr)) err('tldr', 'required: 1–3 sentences answering the title question');\nelse if (sentences(a.tldr).length > LIMITS.tldrSentences) warn('tldr', `${sentences(a.tldr).length} sentences (≤${LIMITS.tldrSentences})`);\nif (!Array.isArray(a.keyTakeaways) || a.keyTakeaways.length < LIMITS.keyTakeaways[0] || a.keyTakeaways.length > LIMITS.keyTakeaways[1])\nerr('keyTakeaways', `${LIMITS.keyTakeaways[0]}–${LIMITS.keyTakeaways[1]} items`);\n(Array.isArray(a.keyTakeaways) ? a.keyTakeaways : []).forEach((t, i) => {\nif (!isObj(t) || !isStr(t.text)) return err(`keyTakeaways[${i}]`, '{ text, refs? }');\nfor (const k of Object.keys(t)) if (!['text', 'refs'].includes(k)) err(`keyTakeaways[${i}].${k}`, 'unknown field');\nif (t.refs != null && !(Array.isArray(t.refs) && t.refs.every((x) => isStr(x)))) err(`keyTakeaways[${i}].refs`, 'array of reference ids');\n});\nlet calculators = 0;\nlet ctas = 0;\nlet tables = 0;\nlet gymon = 0;\nlet applySections = 0;\nif (!Array.isArray(a.sections) || a.sections.length < LIMITS.sections[0] || a.sections.length > LIMITS.sections[1])\nerr('sections', `${LIMITS.sections[0]}–${LIMITS.sections[1]} sections`);\n(Array.isArray(a.sections) ? a.sections : []).forEach((s, si) => {\nconst sp = `sections[${si}]`;\nif (!isObj(s)) return err(sp, 'object expected');\nfor (const k of Object.keys(s)) if (!['heading', 'apply', 'blocks'].includes(k)) err(`${sp}.${k}`, 'unknown field');\nif (!isStr(s.heading)) err(`${sp}.heading`, 'required (a claim or question)');\nif (s.apply != null && typeof s.apply !== 'boolean') err(`${sp}.apply`, 'boolean');\nif (s.apply) applySections++;\nif (!Array.isArray(s.blocks) || s.blocks.length === 0) return err(`${sp}.blocks`, 'at least one block');\nlet takeaways = 0;\ns.blocks.forEach((b, bi) => {\nconst p = `${sp}.blocks[${bi}]`;\nif (!isObj(b)) return err(p, 'object expected');\nif (!BLOCK_TYPES.includes(b.type)) return err(`${p}.type`, `unknown block \"${b.type}\" (closed vocabulary: ${BLOCK_TYPES.join(', ')})`);\nconst only = (keys) => {\nfor (const k of Object.keys(b)) if (!['type', ...keys].includes(k)) err(`${p}.${k}`, `unknown field for \"${b.type}\"`);\n};\nconst refList = (v, path) => {\nif (v != null && !(Array.isArray(v) && v.every((x) => isStr(x)))) err(path, 'array of reference ids');\n};\nswitch (b.type) {\ncase 'p':\nonly(['text']);\nif (!isStr(b.text)) err(`${p}.text`, 'required');\nbreak;\ncase 'list':\nonly(['ordered', 'items']);\nif (b.ordered != null && typeof b.ordered !== 'boolean') err(`${p}.ordered`, 'boolean');\nif (!Array.isArray(b.items) || b.items.length < 2 || !b.items.every((x) => isStr(x))) err(`${p}.items`, '2+ strings');\nbreak;\ncase 'takeaway':\nonly(['text']);\nif (++takeaways > 1) err(p, 'at most one takeaway per section');\nif (!isStr(b.text)) err(`${p}.text`, 'required');\nbreak;\ncase 'claim': {\nonly(['evidence', 'refs', 'text']);\nif (!EVIDENCE_LEVELS.includes(b.evidence)) err(`${p}.evidence`, EVIDENCE_LEVELS.join(' | '));\nrefList(b.refs, `${p}.refs`);\nif (!isStr(b.text)) err(`${p}.text`, 'required');\nbreak;\n}\ncase 'callout':\nonly(['kind', 'text']);\nif (!CALLOUT_KINDS.includes(b.kind)) err(`${p}.kind`, CALLOUT_KINDS.join(' | '));\nif (!isStr(b.text)) err(`${p}.text`, 'required');\nbreak;\ncase 'table':\nonly(['caption', 'columns', 'rows', 'refs']);\nif (++tables > LIMITS.tables) err(p, `at most ${LIMITS.tables} tables`);\nif (!isStr(b.caption)) err(`${p}.caption`, 'required');\nif (!Array.isArray(b.columns) || b.columns.length < 2 || b.columns.length > 5 || !b.columns.every((x) => isStr(x))) err(`${p}.columns`, '2–5 strings');\nif (!Array.isArray(b.rows) || !b.rows.length || !b.rows.every((r) => Array.isArray(r) && r.length === (b.columns || []).length))\nerr(`${p}.rows`, 'rows with one cell per column');\nrefList(b.refs, `${p}.refs`);\nbreak;\ncase 'calculator': {\nonly(['calculator', 'defaults']);\nif (++calculators > 1) err(p, 'at most one calculator per article');\nif (!s.apply) err(p, 'the calculator belongs in the \"apply\" section');\nconst reg = CALCULATORS[b.calculator];\nif (!reg) err(`${p}.calculator`, `not in the registry (${Object.keys(CALCULATORS).join(', ')})`);\nelse if (b.defaults != null) {\nif (!isObj(b.defaults)) err(`${p}.defaults`, 'object');\nelse\nfor (const [k, v] of Object.entries(b.defaults)) {\nconst range = reg[k];\nif (!range) err(`${p}.defaults.${k}`, 'unknown parameter');\nelse if (typeof v !== 'number' || v < range.min || v > range.max) err(`${p}.defaults.${k}`, `${range.min}–${range.max}`);\n}\n}\nbreak;\n}\ncase 'cta':\nonly([]);\nif (++ctas > 1) err(p, 'at most one contextual CTA');\nif (!s.apply) err(p, 'the contextual CTA belongs in the \"apply\" section');\nbreak;\ncase 'gymon': {\ngymon++;\nif (!GYMON_KINDS.includes(b.kind)) {\nerr(`${p}.kind`, GYMON_KINDS.join(' | '));\nbreak;\n}\nif (b.kind === 'log-example') {\nonly(['kind', 'caption', 'exercise', 'sessions', 'text']);\nif (!isStr(b.exercise)) err(`${p}.exercise`, 'required');\nif (!isStr(b.caption)) err(`${p}.caption`, 'required');\nif (!Array.isArray(b.sessions) || b.sessions.length < 1 || b.sessions.length > 3) err(`${p}.sessions`, '1–3 sessions');\n(Array.isArray(b.sessions) ? b.sessions : []).forEach((ses, i) => {\nif (!isObj(ses) || !isStr(ses.label) || !Array.isArray(ses.sets) || ses.sets.length < 1 || ses.sets.length > 6)\nreturn err(`${p}.sessions[${i}]`, '{ label, sets: 1–6 }');\nses.sets.forEach((st, j) => {\nconst num = (v) => typeof v === 'number' && v >= 0 && v <= 1000;\nif (!isObj(st) || !num(st.kg) || !num(st.reps) || (st.previous != null && !(isObj(st.previous) && num(st.previous.kg) && num(st.previous.reps))))\nerr(`${p}.sessions[${i}].sets[${j}]`, '{ kg, reps, previous: { kg, reps } | null }');\n});\n});\n} else {\nonly(['kind', 'heading', 'text', 'points']);\nif (!isStr(b.text)) err(`${p}.text`, 'required');\nif (b.points != null && !(Array.isArray(b.points) && b.points.every((x) => isStr(x)))) err(`${p}.points`, 'strings');\n}\nbreak;\n}\n}\n});\n});\nif (gymon !== 1) err('sections', `exactly one Gymon-unique block (\"gymon\") is required, found ${gymon}`);\nif (applySections !== 1) warn('sections', `expected exactly one \"apply\" section, found ${applySections}`);\n(Array.isArray(a.faq) ? a.faq : []).forEach((f, i) => {\nif (!isObj(f) || !isStr(f.q) || !isStr(f.a)) return err(`faq[${i}]`, '{ q, a, refs? }');\nfor (const k of Object.keys(f)) if (!['q', 'a', 'refs'].includes(k)) err(`faq[${i}].${k}`, 'unknown field');\nconst w = wordCount(f.a);\nif (w > 80) warn(`faq[${i}].a`, `${w} words (40–60 expected)`);\n});\nif (a.faq != null && (!Array.isArray(a.faq) || a.faq.length > LIMITS.faq[1])) err('faq', `0–${LIMITS.faq[1]} items`);\nif (a.quiz != null && (!Array.isArray(a.quiz) || a.quiz.length > LIMITS.quiz[1])) err('quiz', `0–${LIMITS.quiz[1]} items`);\n(Array.isArray(a.quiz) ? a.quiz : []).forEach((q, i) => {\nconst p = `quiz[${i}]`;\nif (!isObj(q)) return err(p, 'object');\nfor (const k of Object.keys(q)) if (!['question', 'options', 'correctIndex', 'explanation', 'refs'].includes(k)) err(`${p}.${k}`, 'unknown field');\nif (!isStr(q.question) || !isStr(q.explanation)) err(p, 'question and explanation required');\nif (!Array.isArray(q.options) || q.options.length < LIMITS.quizOptions[0] || q.options.length > LIMITS.quizOptions[1]) err(`${p}.options`, '2–4 options');\nelse if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) err(`${p}.correctIndex`, 'index of the correct option');\n});\nif (!isObj(a.cta) || !CTA_SLOTS.includes(a.cta.slot) || Object.keys(a.cta).some((k) => k !== 'slot'))\nerr('cta', `{ slot: ${CTA_SLOTS.join(' | ')} } — the writer never writes CTA copy`);\nconst units = collectUnits(a);\nconst used = new Set();\nconst internal = [];\nfor (const u of units) {\nfor (const id of u.refs) {\nused.add(id);\nif (!refs.has(id)) err(u.path, `cites unknown reference ${id}`);\n}\nfor (const href of linksIn(u.text)) {\ninternal.push(href);\nif (!INTERNAL_HREF.test(href)) err(u.path, `link \"${href}\" is not an internal blog link (external sources go in references)`);\nelse if ((lang === 'he') !== href.startsWith('/he/')) err(u.path, `link \"${href}\" points to the other language`);\nelse if (ctx.publishedSlugs) {\nconst slug = href.replace(/^\\/(he\\/)?blog\\//, '').replace(/\\/$/, '');\nif (!(ctx.publishedSlugs[lang] || []).includes(slug)) err(u.path, `link \"${href}\" — no published article with that slug`);\n}\n}\nif (RAW_HTML.test(u.text)) err(u.path, 'raw HTML is not allowed');\nif (EXT_MD_LINK.test(u.text)) err(u.path, 'external links are not allowed in text — cite a reference with [[rN]]');\nif (HEADING_MD.test(u.text)) err(u.path, 'Markdown headings are not allowed inside text');\nif (ARTIFACTS.test(u.text)) err(u.path, 'model artifact / placeholder text');\nif (FABRICATED.test(plainText(u.text))) warn(u.path, 'reads like invented first-hand experience — the reviewer must confirm it is true');\nif (lang === 'en' && MEDICAL_EN.test(plainText(u.text))) warn(u.path, 'medical-promise wording (cure/guarantee/prevent/treat)');\nif (lang === 'he' && MEDICAL_HE.test(plainText(u.text))) warn(u.path, 'ניסוח של הבטחה רפואית');\nif (lang === 'he') for (const m of hebrewLint(u.text)) warn(u.path, m);\nif (u.kind === 'text') {\nfor (const s of sentences(u.text)) {\nconst w = s.split(/\\s+/).length;\nif (w > LIMITS.sentenceWords) warn(u.path, `sentence of ${w} words (≤${LIMITS.sentenceWords})`);\n}\n}\nif (u.kind === 'gymon-example' || u.kind === 'heading' || u.kind === 'quiz') continue;\nconst nums = numbersIn(plainText(u.text));\nif (!nums.length) continue;\nif (u.kind === 'gymon') {\nif (typeof ctx.gymonMaterial === 'string') {\nconst hay = normForMatch(ctx.gymonMaterial);\nconst missing = nums.filter((n) => !hay.includes(n));\nif (missing.length) warn(u.path, `number(s) ${missing.join(', ')} are not in the supplied Gymon material`);\n}\ncontinue;\n}\nconst cited = u.refs.map((id) => refs.get(id)).filter(Boolean);\nconst years = new Set(cited.map((r) => String(r.year)));\nconst check = nums.filter((n) => !years.has(n));\nif (!check.length) continue;\nif (!cited.length) {\nwarn(u.path, `number(s) ${check.join(', ')} without a citation`);\ncontinue;\n}\nconst inRead = new Set(cited.filter((r) => r.fullTextRead).flatMap((r) => numbersIn(r.quote)));\nconst inUnread = new Set(cited.filter((r) => !r.fullTextRead).flatMap((r) => numbersIn(r.quote)));\nfor (const n of check) {\nif (inRead.has(n)) continue;\nif (inUnread.has(n) || (cited.length && cited.every((r) => !r.fullTextRead)))\nerr(u.path, `number ${n} is attributed to a source whose full text was not read (fullTextRead: false)`);\nelse warn(u.path, `number ${n} is not in the quote of any cited reference`);\n}\n}\nfor (const id of refs.keys()) if (!used.has(id)) warn('references', `${id} is never cited`);\nif (ctx.publishedSlugs && (ctx.publishedSlugs[lang] || []).length >= LIMITS.internalLinks[0] && internal.length < LIMITS.internalLinks[0])\nwarn('sections', `${internal.length} internal links (${LIMITS.internalLinks[0]}–${LIMITS.internalLinks[1]} expected)`);\n(Array.isArray(a.sections) ? a.sections : []).forEach((s, si) =>\n(isObj(s) && Array.isArray(s.blocks) ? s.blocks : []).forEach((b, bi) => {\nif (!isObj(b) || b.type !== 'claim' || !EVIDENCE_LEVELS.includes(b.evidence)) return;\nconst p = `sections[${si}].blocks[${bi}]`;\nconst cited = [...new Set([...(b.refs || []), ...refsIn(b.text)])].map((id) => refs.get(id)).filter(Boolean);\nif (!cited.length) err(p, 'a claim must cite at least one reference');\nconst strongSource = cited.some((r) => (r.tier === 'PRIMARY' || r.tier === 'AUTHORITY') && r.fullTextRead);\nif ((b.evidence === 'strong' || b.evidence === 'moderate') && !strongSource)\nerr(p, `\"${b.evidence}\" needs a PRIMARY/AUTHORITY reference whose full text was read`);\nif (cited.length && cited.every((r) => r.tier === 'SECONDARY') && !['limited', 'mixed', 'insufficient'].includes(b.evidence))\nerr(p, 'claims resting only on SECONDARY sources are capped at \"limited\"');\nconst words = (CERTAINTY_WORDS[lang] || {})[b.evidence] || [];\nconst t = plainText(b.text).toLowerCase();\nif (words.length && !words.some((w) => t.includes(w.toLowerCase())))\nwarn(p, `\"${b.evidence}\" evidence should be worded with: ${words.join(' / ')}`);\n}),\n);\nconst lastSection = Array.isArray(a.sections) && a.sections.length ? a.sections[a.sections.length - 1] : null;\nconst lastText = lastSection && Array.isArray(lastSection.blocks)\n? [...lastSection.blocks].reverse().map((b) => (isObj(b) ? b.text || (Array.isArray(b.items) ? b.items[b.items.length - 1] : '') : '')).find((t) => isStr(t))\n: null;\nif (lastSection && (!lastText || !/[.!?:)\"”׳]\\s*(\\[\\[[^\\]]+\\]\\])?\\s*$/.test(lastText.trim())))\nerr('sections', 'the article ends mid-sentence (truncated?)');\nconst words = units.reduce((n, u) => n + wordCount(u.text), 0);\nreturn { errors, warnings, stats: { words, readTime: Math.max(1, Math.round(words / (lang === 'he' ? 200 : 230))), refs: refs.size } };\n}\n\n// ---- pipeline helpers (n8n/blog-articles/src/code/pipeline_lib.js) ----\n\nconst cleanUrl = (u) => String(u || '').trim()\n  .replace(/([?&])(?:utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|ref|source|campaign|cmpid|icid|s_cid)=[^&#]*/gi, '$1')\n  .replace(/\\?&+/, '?').replace(/&{2,}/g, '&').replace(/[?&]+(#|$)/, '$1');\n\n/** The model's reply → object. Tolerates a code fence or prose around the JSON; throws a clear error otherwise. */\nfunction parseLooseJson(raw, label) {\n  if (raw && typeof raw === 'object') return raw;\n  const s = String(raw || '').replace(/^\\s*```(?:json)?\\s*/i, '').replace(/\\s*```\\s*$/, '');\n  const a = s.indexOf('{');\n  const b = s.lastIndexOf('}');\n  if (a < 0 || b <= a) throw new Error(`${label}: the model returned no JSON object (truncated at max tokens?). First 200 chars: ${s.slice(0, 200)}`);\n  try {\n    return JSON.parse(s.slice(a, b + 1));\n  } catch (e) {\n    throw new Error(`${label}: invalid JSON (${e.message}). The reply may have been cut off; check finish_reason in the execution.`);\n  }\n}\n\n/** Keys in the canonical order of the article contract; drops anything the writer must not set. */\nfunction canonical(a) {\n  const out = {};\n  for (const k of TOP_LEVEL_KEYS) if (a[k] !== undefined) out[k] = a[k];\n  return out;\n}\n\n/** Writer output minus every field the code owns. */\nfunction writerFields(a) {\n  const out = {};\n  for (const [k, v] of Object.entries(a || {})) if (!CODE_FIELDS.includes(k) && k !== 'references') out[k] = v;\n  return out;\n}\n\n/** The code-owned fields of a new draft. */\nfunction codeFields(plan, lang, today) {\n  return {\n    schemaVersion: SCHEMA_VERSION,\n    lang,\n    slug: plan.slug,\n    pillar: plan.pillar,\n    tags: plan.tags,\n    intent: plan.intent,\n    ymylLevel: 'low',\n    lengthBand: plan.length_band,\n    image: `/blog/${plan.slug}.jpg`,\n    imageAiGenerated: true,\n    createdAt: today,\n    reviewedAt: null,\n    editor: 'osher-alon',\n    aiAssisted: true,\n  };\n}\n\n/** References as the code owns them: cleaned URL, tier from the URL, fullTextRead from the research pack. */\nfunction codeReferences(refs, readUrls) {\n  return (Array.isArray(refs) ? refs : []).map((r) => {\n    const url = cleanUrl(r && r.url);\n    const out = {\n      id: r.id,\n      title: String(r.title || '').trim(),\n      authors: Array.isArray(r.authors) ? r.authors.filter((x) => typeof x === 'string' && x.trim()) : [],\n      year: Number.isInteger(r.year) ? r.year : null,\n      venue: typeof r.venue === 'string' ? r.venue : '',\n      url,\n      tier: tierOfUrl(url),\n      type: r.type,\n      fullTextRead: (readUrls || []).includes(url),\n      quote: String(r.quote || '').trim(),\n    };\n    if (r.doi) out.doi = String(r.doi).trim();\n    if (r.pmid) out.pmid = String(r.pmid).trim();\n    return out;\n  });\n}\n// ===== end of shared code =====\n\nconst GYMON_MATERIAL = \"GYMON MATERIAL — the only facts about Gymon an article may state. Every article carries exactly one \\\"gymon\\\" block built from ONE of the three parts below. Never invent app data, user numbers, user quotes or experiences. Sources are noted in brackets for the reviewer (files in the gymon app repo or research folder); do not put them in the article.\\n\\nA. THE LOGGING TABLE (kind \\\"log-example\\\") [app/src/lib/loggerData.ts, personalRecords.ts, repRange.ts]\\n- Gymon's logger shows each set as one row: SET | PREVIOUS | KG | REPS | ✓.\\n- PREVIOUS shows, in grey, the weight and reps of the same set in the last finished session of the SAME workout (not the exercise's last outing in some other workout).\\n- Only working sets count: warm-up and cool-down sets are not used for PREVIOUS or for records.\\n- A personal record in Gymon: the heaviest weight wins; on equal weight, more reps win; a tie is not a record; a first-ever session cannot set a record; timed exercises have no weight/reps record.\\n- Rep targets are shown as a range (for example 8 to 12), not a single number.\\n- A log-example uses ILLUSTRATIVE numbers that you choose for the example. The page labels them \\\"illustrative, not user data\\\". Keep them realistic and consistent: small weight steps (1 to 2.5 kg), reps that fall slightly as weight rises, PREVIOUS equal to the earlier session's numbers.\\n\\nB. THE PLAN BUILDER (kind \\\"plan-logic\\\") [app/src/lib/planBuilder.ts, programRotation.ts]\\n- The plan is built in four steps: filter exercises by where the person trains, pick a split from the number of training days, choose exercises for each day, then set sets, reps and rest from the goal and experience level.\\n- Split by days per week: 1 day full body; 2 days full body A and B; 3 days full body A, B and C; 4 days upper and lower twice; 5 days push, pull, legs, upper, lower; 6 days push, pull and legs twice. Legs appear in every split.\\n- Main lifts by goal: strength 4 to 6 reps, 4 sets, 180 seconds rest; muscle 8 to 12 reps, 3 sets, 90 seconds rest. Accessory exercises: strength 8 to 12 reps; muscle 10 to 15 reps.\\n- Sets per exercise stay between 2 and 4: main lifts 3 to 4, isolation exercises 2 to 3. When a muscle needs more work in a session, the plan adds an exercise rather than stacking sets on one.\\n- Session length decides how many exercises fit: a 60-minute session holds about 20 to 23 working sets, a 45-minute session about 15 to 17.\\n- Gender does not change the prescription: it is a decision, because nothing in the evidence used supports a different rule.\\n- \\\"Toning\\\" gets the same resistance work as building muscle; it is not a light-weights, high-reps protocol.\\n- When possible, a session holds only one exercise that loads the hip hinge (for example a deadlift), so the lower back is not loaded twice.\\n- The program-refresh check estimates each session's best set with the Epley formula (weight × (1 + reps ÷ 30)). It asks about swapping an exercise only when that lift's best estimate has not improved by at least 1% across 4 sessions of it and the best is at least 3 weeks old, and never before 6 weeks on the plan. It only asks; it never swaps an exercise by itself.\\n\\nC. GYMON'S REVIEW OF WORKOUT APPS (kind \\\"teardown-finding\\\") [departments/research/competitor_analysis, 2026]\\n- Gymon mapped the onboarding and logging screens of 8 workout apps, 402 screens in total.\\n- Strong and Hevy, built separately, arrived at the same set table: SET | PREVIOUS | KG | REPS | ✓.\\n- Of the 7 apps reviewed for language support, only one (FitBuddy, an Israeli app) offered Hebrew with a right-to-left layout.\\n- Hevy labels set types (warm-up, failure, drop set) and tracks 4 kinds of record: heaviest weight, best 1RM, best set volume and best session volume.\\n- In 281 negative app-store reviews of Strong, Fitbod and Hevy, the most common complaint (119 reviews, 42%) was about pricing and paywalls imposed after people had already invested time and data.\\n- When naming competitor apps, state only these findings; no rankings, no prices, no \\\"better than\\\" claims.\\n\";\nconst b = $input.first().json;\nconst publishedSlugs = {\n  en: (b.published || []).map((p) => p.slug),\n  he: (b.published || []).filter((p) => p.has_he !== false).map((p) => p.slug),\n};\nconst ctx = {\n  mode: 'pipeline',\n  researchText: String(b.research_text || ''),\n  gymonMaterial: GYMON_MATERIAL,\n  allowedUrls: (b.allowed_urls || []).map(cleanUrl),\n  publishedSlugs,\n};\nconst en = validateArticle(b.article_en, ctx);\nconst he = validateArticle(b.article_he, ctx);\n\n// Cross-language consistency: the Hebrew is an adaptation of the same article.\nconst cross = [];\nconst blocksOf = (a) => (a.sections || []).map((s) => (s.blocks || []).map((x) => x.type).join(','));\nif ((b.article_en.sections || []).length !== (b.article_he.sections || []).length) cross.push({ path: 'sections', message: 'EN and HE have a different number of sections' });\nelse blocksOf(b.article_en).forEach((t, i) => { if (t !== blocksOf(b.article_he)[i]) cross.push({ path: `sections[${i}]`, message: 'EN and HE blocks differ' }); });\nconst refsUsed = (a) => [...new Set(collectUnits(a).flatMap((u) => u.refs))].sort().join(',');\nif (refsUsed(b.article_en) !== refsUsed(b.article_he)) he.warnings.push({ path: 'references', message: 'EN and HE cite different references' });\nconst numsOf = (a) => collectUnits(a).filter((u) => u.kind === 'text').flatMap((u) => numbersIn(plainText(u.text))).sort().join(',');\nif (numsOf(b.article_en) !== numsOf(b.article_he)) he.warnings.push({ path: 'numbers', message: 'EN and HE do not carry the same numbers — check the Hebrew' });\n\n// A DOI or PMID must be printed in the research pack — otherwise the writer produced it.\nconst hay = normForMatch(b.research_text || '');\nfor (const r of b.article_en.references || []) {\n  if (r.doi && !hay.includes(normForMatch(r.doi))) en.warnings.push({ path: `references.${r.id}.doi`, message: 'DOI not printed in the research pack — check it is the right paper' });\n  if (r.pmid && !hay.includes(r.pmid)) en.warnings.push({ path: `references.${r.id}.pmid`, message: 'PMID not printed in the research pack' });\n}\n\n// Fact-check input for Haiku: each English unit that cites something, with the cited quotes.\nconst refs = new Map((b.article_en.references || []).map((r) => [r.id, r]));\nconst units = collectUnits(b.article_en).filter((u) => u.refs.length && u.kind !== 'heading');\nconst lines = units.map((u, n) => {\n  const quotes = u.refs.map((id) => refs.get(id)).filter(Boolean).map((r) => `   [${r.id}${r.fullTextRead ? '' : ', snippet only'}] \"${r.quote}\"`).join('\\n');\n  return `U${n + 1} (${u.path}): ${plainText(u.text)}\\n${quotes}`;\n});\nconst hebrew = collectUnits(b.article_he).map((u) => plainText(u.text)).join('\\n');\nconst factcheck_input = `ENGLISH UNITS WITH THEIR CITED QUOTES\\n\\n${lines.join('\\n\\n') || '(no cited units)'}\\n\\nHEBREW ARTICLE (plain text)\\n\\n${hebrew}`;\n\n\nreturn [{ json: { ...b, validation: { en, he, cross }, factcheck_input }, pairedItem: { item: 0 } }];\n" } },
  output: [{ mode: 'new', validation: { en: { errors: [], warnings: [] }, he: { errors: [], warnings: [] }, cross: [] } }],
});

const referenceChecks = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Reference checks', parameters: { mode: 'runOnceForAllItems', jsCode: "// Reference checks — one HTTP request per check, so every source is resolved before the\n// review email: each reference URL, each DOI through Crossref, each PMID through NCBI.\nconst b = $('Validate articles').first().json;\nconst MAILTO = 'gymon.official@gmail.com';\nconst out = [];\nfor (const r of b.article_en.references || []) {\n  out.push({ kind: 'url', ref: r.id, url: r.url });\n  if (r.doi) out.push({ kind: 'doi', ref: r.id, url: `https://api.crossref.org/works/${encodeURIComponent(r.doi)}?mailto=${MAILTO}` });\n  if (r.pmid) out.push({ kind: 'pmid', ref: r.id, url: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${r.pmid}` });\n}\n// Never zero items: the HTTP node would not run and the chain would stop.\nif (!out.length) out.push({ kind: 'none', ref: '', url: 'https://api.crossref.org/works?rows=0' });\nreturn out.map((json) => ({ json, pairedItem: { item: 0 } }));\n" } },
  output: [{ kind: 'doi', ref: 'r1', url: 'https://api.crossref.org/works/10.1000%2Fx?mailto=gymon.official@gmail.com' }],
});

const resolveReferences = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Resolve references',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'GET',
      url: expr('{{ $json.url }}'),
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'User-Agent', value: 'GymonBlogReferenceCheck/1.0 (mailto:gymon.official@gmail.com)' },
        { name: 'Accept', value: 'application/json, text/html;q=0.9, */*;q=0.8' },
      ] },
      options: {
        batching: { batch: { batchSize: 2, batchInterval: 1100 } },
        timeout: 15000,
        redirect: { redirect: { followRedirects: true, maxRedirects: 10 } },
        response: { response: { fullResponse: true, neverError: true, responseFormat: 'text' } },
      },
    },
  },
  output: [{ statusCode: 200, body: '{}' }],
});

const referenceResults = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Reference results', parameters: { mode: 'runOnceForAllItems', jsCode: "// Reference results — turns the HTTP answers (URL, Crossref, PubMed) into validation flags.\nconst b = $('Validate articles').first().json;\nconst checks = $('Reference checks').all().map((i) => i.json);\nconst answers = $input.all().map((i) => i.json || {});\nconst refs = new Map((b.article_en.references || []).map((r) => [r.id, r]));\nconst validation = JSON.parse(JSON.stringify(b.validation));\nconst err = (path, message) => validation.en.errors.push({ path, message });\nconst warn = (path, message) => validation.en.warnings.push({ path, message });\n\nconst norm = (s) => String(s || '').toLowerCase().replace(/\\s+/g, ' ').trim();\nconst words = (s) => new Set(norm(s).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter((w) => w.length > 3));\nconst similar = (a, c) => {\n  const A = words(a), B = words(c);\n  if (!A.size || !B.size) return 0;\n  let n = 0;\n  for (const w of A) if (B.has(w)) n++;\n  return n / Math.min(A.size, B.size);\n};\nconst body = (j) => {\n  const v = j.body !== undefined ? j.body : j.data;\n  if (typeof v === 'string') { try { return JSON.parse(v); } catch (e) { return v; } }\n  return v;\n};\n\nconst report = [];\nchecks.forEach((c, i) => {\n  if (c.kind === 'none') return;\n  const j = answers[i] || {};\n  const status = Number(j.statusCode || (j.error ? 0 : 200));\n  const r = refs.get(c.ref) || {};\n  const p = `references.${c.ref}`;\n  let result = 'ok';\n  let detail = `HTTP ${status || 'error'}`;\n  if (c.kind === 'url') {\n    if (status === 404 || status === 410) { result = 'error'; err(`${p}.url`, `${detail}: the source URL does not resolve`); }\n    else if (!status || status >= 400) { result = 'unverified'; warn(`${p}.url`, `${detail}: could not verify the URL automatically (bot block or outage) — open it by hand`); }\n  } else if (c.kind === 'doi') {\n    const d = body(j);\n    const title = d && d.message && Array.isArray(d.message.title) ? d.message.title[0] : '';\n    if (status === 404 || (status && status >= 400 && status !== 429)) { result = 'error'; err(`${p}.doi`, `DOI ${r.doi} does not resolve in Crossref (${detail})`); }\n    else if (!title) { result = 'unverified'; warn(`${p}.doi`, `Crossref gave no title (${detail})`); }\n    else {\n      const s = similar(title, r.title);\n      detail = `Crossref: \"${String(title).slice(0, 140)}\"`;\n      if (s < 0.6) { result = 'mismatch'; err(`${p}.doi`, `DOI points to a different paper: ${detail}`); }\n    }\n  } else if (c.kind === 'pmid') {\n    const d = body(j);\n    const rec = d && d.result && d.result[r.pmid];\n    if (!rec || rec.error) { result = 'error'; err(`${p}.pmid`, `PMID ${r.pmid} does not resolve in PubMed (${detail})`); }\n    else {\n      detail = `PubMed: \"${String(rec.title || '').slice(0, 140)}\"`;\n      if (similar(rec.title || '', r.title) < 0.6) { result = 'mismatch'; err(`${p}.pmid`, `PMID points to a different paper: ${detail}`); }\n    }\n  }\n  report.push({ ref: c.ref, kind: c.kind, url: c.kind === 'url' ? c.url : (c.kind === 'doi' ? `https://doi.org/${r.doi}` : `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`), status, result, detail });\n});\n\nconst errors = validation.en.errors.length + validation.he.errors.length + validation.cross.length;\nconst warnings = validation.en.warnings.length + validation.he.warnings.length;\nreturn [{ json: { ...b, validation, ref_report: report, counts: { errors, warnings } }, pairedItem: { item: 0 } }];\n" } },
  output: [{ mode: 'new', factcheck_input: '…', counts: { errors: 0, warnings: 0 }, ref_report: [] }],
});

const checkModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Haiku — fact check', parameters: { model: MODEL_FAST, options: { temperature: 0, maxTokens: 4000 } }, credentials: CRED_OPENROUTER },
});

const checkParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: { name: 'Fact-check format', parameters: { schemaType: 'fromJson', jsonSchemaExample: "{\n  \"entailment\": [\n    \"U3 — says \\\"trained lifters\\\", the quote studied untrained adults\"\n  ],\n  \"medical_promises\": [],\n  \"gendered_hebrew\": [\n    \"\\\"נסה להוסיף\\\" — masculine singular imperative\"\n  ],\n  \"fabricated_experience\": [],\n  \"literal_translation\": [\n    \"\\\"עושה תחושה\\\" — calque of \\\"makes sense\\\"\"\n  ],\n  \"other\": [],\n  \"verdict\": \"needs_attention\"\n}" } },
});

const factCheck = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Fact check',
    parameters: {
      promptType: 'define',
      text: expr('{{ $json.factcheck_input }}'),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: "You are the fact-checker for a bilingual (English + Hebrew) fitness blog. You receive (1) numbered text units from the English article, each with the verbatim quotes of the references it cites, and (2) the Hebrew article as plain text. Report REAL problems only, as short items (\"unit id or quoted phrase — 3 to 10 word reason\"). When unsure, do not report. Do not rewrite anything.\n\nentailment — a unit says something its cited quotes do not support: a number that differs, a population or condition the quote does not mention (e.g. \"trained lifters\" when the study was in untrained adults), a causal claim from a correlational quote, or a certainty stronger than the quote allows. A unit that only paraphrases its quote is fine.\nmedical_promises — cure, prevention or guarantee language, individual dosing, or advice to diagnose or treat a condition, in either language.\ngendered_hebrew — Hebrew forms that address one reader with a gender (\"נסה\", \"נסי\", \"אתה\", \"תוכלי\", \"הזן\", \"המתאמן צריך\") or slash forms (\"מתאמן/ת\"). NOT problems: plural imperative (\"נסו\"), present plural (\"מתעדים\"), infinitives, \"יש ל-\", \"כדאי\", \"אפשר\", third person about studies or muscles.\nfabricated_experience — invented first-hand experience, user anecdotes, \"our users\", or app data not given as Gymon material.\nliteral_translation — Hebrew that reads as a calque of English (English idioms, word order, imperial units, US-only references).\nother — anything else a careful editor must see before publishing.\n\nverdict: \"ok\" when every list is empty, otherwise \"needs_attention\". JSON only.\n" }] },
    },
    subnodes: { model: checkModel, outputParser: checkParser },
  },
  output: [{ output: { entailment: [], medical_promises: [], gendered_hebrew: [], fabricated_experience: [], literal_translation: [], other: [], verdict: 'ok' } }],
});

const checkedArticle = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Checked article', parameters: { mode: 'runOnceForAllItems', jsCode: "// Checked article — attaches the Haiku fact-check to the validated bundle. Its findings are\n// flags for the reviewer, shown first on the review page. Only the deterministic errors\n// (validator, cross-language structure, DOI/PMID/URL resolution) block Approve: a model's\n// judgement must not be able to lock an article.\nconst b = $('Reference results').first().json;\nconst notes = $input.first().json.output || {};\nconst blocking = b.counts.errors;\nreturn [{ json: { ...b, check_notes: notes, blocking }, pairedItem: { item: 0 } }];\n" } },
  output: [{ mode: 'new', blocking: 0 }],
});

const isNew = ifElse({
  version: 2.2,
  config: {
    name: 'New article?',
    parameters: {
      conditions: {
        options: IF_OPTS,
        conditions: [{ leftValue: expr("{{ $json.mode === 'new' }}"), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const imagePromptModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Sonnet — image prompt', parameters: { model: MODEL_EDIT, options: { temperature: 0.8 } }, credentials: CRED_OPENROUTER },
});

const imagePrompt = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Image prompt',
    parameters: {
      promptType: 'define',
      text: expr("Article title: {{ $('Checked article').first().json.article_en.title }}\nBottom line: {{ $('Checked article').first().json.article_en.tldr }}\nSections: {{ ($('Checked article').first().json.article_en.sections || []).map(s => s.heading).join(' | ') }}"),
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: "You write ONE prompt for a photographic hero image for a strength-training blog article. The site and the app share a cool palette (pale blue-grey, white, near-black, steel and teal accents), so the image must match it. Output only the prompt: 70–120 words, English, no preamble.\n\nStyle (mandatory): bright-to-mid natural daylight with a cool colour temperature — soft cool blue-grey light, never warm or golden. Cool palette only: pale concrete, white walls, steel, chrome, brushed aluminium, matte black equipment, rubber flooring in grey, at most a subtle teal or steel-blue accent. Clean, uncluttered backgrounds. Editorial photography, sharp subject, gently soft background, realistic textures. Wide 16:9 landscape with some calm empty space.\n\nSubject: a concrete scene that fits the article — e.g. a barbell with matte black plates in a concrete gym, chrome dumbbells on a steel rack, a training notebook or phone next to a steel water bottle on a grey bench, or a rest moment between sets. If a person appears they are anonymous: back view, cropped at the shoulders, hands only, or out of focus. Never a recognisable face, never a celebrity or any real person.\n\nNever: text, letters, numbers, logos, brand names, watermarks, signage, readable labels on equipment or packaging, phone or screen UI; no warm wood, beige, cream, orange or golden light, no sunset tones, no dark moody low-key lighting; no bodybuilder posing or six-packs, no before/after, no scales, no medical imagery.\n" }] },
    },
    subnodes: { model: imagePromptModel },
  },
  output: [{ text: 'Low-key photograph of chalked hands gripping a barbell…' }],
});

const generateImage = node({
  type: '@n8n/n8n-nodes-langchain.googleGemini',
  version: 1.1,
  config: {
    name: 'Generate hero image',
    parameters: { resource: 'image', operation: 'generate', modelId: IMAGE_MODEL, prompt: expr("{{ $json.text }}\n\nAbsolutely no text, letters, numbers, logos or watermarks anywhere in the image. Wide 16:9 landscape composition, cool daylight, cool blue-grey and steel palette, clean background, no warm wood, no warm or golden tones, no recognisable faces."), options: {} },
    credentials: CRED_GEMINI,
  },
  output: [{ mimeType: 'image/png' }],
});

const uploadImage = node({
  type: 'n8n-nodes-cloudinary.cloudinary',
  version: 2,
  config: {
    name: 'Upload image',
    parameters: {
      resource: 'upload',
      operation: 'uploadFile',
      file: 'data',
      resource_type_file: 'image',
      additionalFieldsFile: {
        folder: 'gymon-blog/drafts',
        public_id: expr("{{ $('Topic plan').first().json.slug }}-r1-{{ $now.toFormat('yyMMddHHmmss') }}"),
        tags: 'gymon-blog,draft',
      },
    },
    credentials: CRED_CLOUDINARY,
  },
  output: [{ public_id: 'gymon-blog/drafts/rest-between-sets-r1', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/gymon-blog/drafts/rest-between-sets-r1.png' }],
});

const altModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Haiku — image alt', parameters: { model: MODEL_FAST, options: { temperature: 0.2 } }, credentials: CRED_OPENROUTER },
});

const altParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: { name: 'Image alt format', parameters: { schemaType: 'fromJson', jsonSchemaExample: '{"image_alt_en": "A barbell with matte black plates on a grey rubber floor", "image_alt_he": "מוט עם משקולות שחורות על רצפת גומי אפורה"}' } },
});

// Alt text from the FINAL image (SEO doctrine §4, Images), not from the prompt.
const imageAlt = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Image alt',
    parameters: {
      promptType: 'define',
      text: expr("Article title: {{ $('Checked article').first().json.article_en.title }}"),
      hasOutputParser: true,
      messages: { messageValues: [
        { type: 'SystemMessagePromptTemplate', message: "You write alt text for a blog header image, from the IMAGE ITSELF (attached), for an article whose title you are given. Return JSON:\n- image_alt_en: one plain English sentence, 8–16 words, describing what is actually visible and relevant to the article. No \"image of\", no style words.\n- image_alt_he: the same in natural Hebrew, one sentence, gender-neutral (describe objects and scenes; a person, if any, neutrally: \"אדם מרים מוט\").\nJSON only.\n" },
        { type: 'HumanMessagePromptTemplate', messageType: 'imageUrl', imageUrl: expr("{{ String($json.secure_url || '').replace('/upload/', '/upload/c_fill,g_auto,ar_16:9,w_1024,q_auto,f_jpg/') }}"), imageDetail: 'low' },
      ] },
    },
    subnodes: { model: altModel, outputParser: altParser },
  },
  output: [{ output: { image_alt_en: 'A barbell with matte black plates on a grey rubber floor', image_alt_he: 'מוט עם משקולות שחורות על רצפת גומי אפורה' } }],
});

const articleRecord = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Article record', parameters: { mode: 'runOnceForAllItems', jsCode: "// Article record — one row for gymon_blog_articles. The two article JSON files travel as\n// strings (article_en / article_he); the flat columns are kept for the list view and email.\nconst b = $('Checked article').first().json;\nconst plan = b.plan || {};\nconst up = $('Upload image').first().json;\nconst alt = ($('Image alt').first().json || {}).output || {};\nconst IMG16 = '/upload/c_fill,g_auto,ar_16:9,w_1600,q_auto:good,f_jpg/';\nconst en = { ...b.article_en, imageAlt: alt.image_alt_en || b.article_en.imageAlt };\nconst he = { ...b.article_he, imageAlt: alt.image_alt_he || b.article_he.imageAlt };\nreturn [{ json: {\n  article_id: `${$now.toFormat('yyMMddHHmmss')}-${plan.slug}`,\n  slug: plan.slug,\n  status: 'pending_review',\n  round: 1,\n  review_token: $now.toMillis().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),\n  topic: plan.topic,\n  angle: plan.angle,\n  source_url: plan.source_url,\n  source_title: plan.source_title,\n  pillar: plan.pillar,\n  ymyl_level: plan.ymyl_level,\n  title_en: en.title, title_he: he.title,\n  hero_title_en: en.heroTitle, hero_title_he: he.heroTitle,\n  description_en: en.description, description_he: he.description,\n  image_alt_en: en.imageAlt, image_alt_he: he.imageAlt,\n  read_time_en: b.validation.en.stats.readTime, read_time_he: b.validation.he.stats.readTime,\n  article_en: JSON.stringify(en),\n  article_he: JSON.stringify(he),\n  validation: JSON.stringify({ ...b.validation, refs: b.ref_report, blocking: b.blocking }),\n  check_notes: JSON.stringify(b.check_notes || {}),\n  research_pack: String(b.research_text || ''),\n  context_json: JSON.stringify({ allowed_urls: b.allowed_urls, read_urls: b.read_urls, published: b.published, plan }),\n  sources_json: JSON.stringify((en.references || []).map((r) => ({ title: r.title, url: r.url }))),\n  image_prompt: $('Image prompt').first().json.text,\n  image_url: String(up.secure_url || '').replace('/upload/', IMG16),\n  image_public_id: up.public_id,\n}, pairedItem: { item: 0 } }];\n" } },
  output: [{ article_id: '261004090000-rest-between-sets', slug: 'rest-between-sets', status: 'pending_review', round: 1, review_token: 'abc' }],
});

const insertArticle = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Insert article',
    parameters: { resource: 'row', operation: 'insert', dataTableId: T_ARTICLES, columns: { mappingMode: 'autoMapInputData', value: {}, matchingColumns: [], schema: [] }, options: {} },
  },
  output: [{ id: 1, slug: 'rest-between-sets', status: 'pending_review' }],
});

const logSource = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Log used source',
    parameters: {
      resource: 'row',
      operation: 'insert',
      dataTableId: T_SOURCES,
      columns: {
        mappingMode: 'defineBelow',
        value: {
          source_url: expr("{{ $('Topic plan').first().json.source_url }}"),
          source_title: expr("{{ $('Topic plan').first().json.source_title }}"),
          topic: expr("{{ $('Topic plan').first().json.topic }}"),
          slug: expr("{{ $('Topic plan').first().json.slug }}"),
          article_id: expr("{{ $('Article record').first().json.article_id }}"),
        },
        matchingColumns: [],
        schema: [
          { id: 'source_url', displayName: 'source_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'source_title', displayName: 'source_title', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'topic', displayName: 'topic', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'slug', displayName: 'slug', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'article_id', displayName: 'article_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
        ],
      },
      options: {},
    },
  },
  output: [{ id: 1 }],
});

const emailNew = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Email: new article',
    parameters: { mode: 'manual', assignments: { assignments: [{ id: 'en1', name: 'article_id', value: expr("{{ $('Article record').first().json.article_id }}"), type: 'string' }] }, options: {} },
  },
  output: [{ article_id: 1 }],
});

const loadForEmail = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Load article for email',
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: T_ARTICLES,
      matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'article_id', condition: 'eq', keyValue: expr('{{ $json.article_id }}') }] },
      limit: 1,
    },
  },
  output: [{ id: 1, slug: 'rest-between-sets', round: 1, review_token: 'abc', title_en: '…', title_he: '…' }],
});

const buildEmail = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Build review email', parameters: { mode: 'runOnceForAllItems', jsCode: "// Build review email — one article row in, one {subject, html} out. The full article, the\n// flags and the reference checks are on the review page; the email is the summary.\nconst BASE = 'https://osher.app.n8n.cloud/webhook';\n\nconst a = $input.first().json;\nconst esc = (s) => String(s ?? '').replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]));\nconst plain = (t) => String(t || '').replace(/\\[\\[[^\\]]+\\]\\]/g, '').replace(/\\*\\*/g, '').replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g, '$1').replace(/\\s+([.,;:])/g, '$1').trim();\nconst parse = (s, d) => { try { return JSON.parse(s || ''); } catch (e) { return d; } };\n\nconst en = parse(a.article_en, {});\nconst he = parse(a.article_he, {});\nconst v = parse(a.validation, { en: { errors: [], warnings: [] }, he: { errors: [], warnings: [] }, cross: [] });\nconst notes = parse(a.check_notes, {});\nconst errors = [...(v.en?.errors || []).map((e) => ['EN', e]), ...(v.he?.errors || []).map((e) => ['HE', e]), ...(v.cross || []).map((e) => ['EN/HE', e])];\nconst warnCount = (v.en?.warnings || []).length + (v.he?.warnings || []).length;\nconst noteLists = [\n  ['Citation does not support the sentence', notes.entailment],\n  ['Medical promises', notes.medical_promises],\n  ['Gendered Hebrew', notes.gendered_hebrew],\n  ['Invented experience', notes.fabricated_experience],\n  ['Hebrew reads translated', notes.literal_translation],\n  ['Other', notes.other],\n].filter(([, l]) => Array.isArray(l) && l.length);\n\nconst reviewUrl = `${BASE}/gymon-blog/review?id=${encodeURIComponent(a.article_id)}&t=${encodeURIComponent(a.review_token)}`;\nconst round = Number(a.round) || 1;\nconst subject = `${errors.length ? '[blocked] ' : ''}[Gymon blog] ${round > 1 ? `Revised, round ${round}` : 'New article for review'}: ${a.title_en}`;\n\nconst box = (bg, border, title, inner) => `<div style=\"background:${bg};border:1px solid ${border};border-radius:10px;padding:14px 16px;margin:0 0 16px\"><div style=\"font-size:12px;font-weight:700;letter-spacing:.06em;margin-bottom:6px\">${title}</div>${inner}</div>`;\nconst list = (items) => `<ul style=\"margin:4px 0 0;padding-left:18px;font-size:13px\">${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;\n\nconst errHtml = errors.length\n  ? box('#2a0f0f', '#b91c1c', `<span style=\"color:#fca5a5\">BLOCKING — ${errors.length} error(s). Approve is disabled until a fix round clears them.</span>`, `<div style=\"color:#fecaca\">${list(errors.slice(0, 12).map(([l, e]) => `${l} · <code>${esc(e.path)}</code> — ${esc(e.message)}`))}</div>`)\n  : `<div style=\"font-size:12px;color:#86efac;margin:0 0 12px\">Automatic validation: no blocking errors.</div>`;\nconst flagHtml = noteLists.length\n  ? box('#2a1d0a', '#a16207', '<span style=\"color:#facc15\">FACT-CHECK FLAGS (Haiku) — read before approving</span>', `<div style=\"color:#fde68a\">${noteLists.map(([k, l]) => `<div style=\"margin-top:6px\"><b>${esc(k)}</b>${list(l.map(esc))}</div>`).join('')}</div>`)\n  : '';\n\nconst lang = (x, rtl, label) => `<div ${rtl ? 'dir=\"rtl\" ' : ''}style=\"background:#18181b;border-radius:12px;padding:16px 18px 8px;margin:0 0 14px;${rtl ? 'direction:rtl;text-align:right;' : ''}\">\n  <div style=\"font-size:11px;color:#71717a;font-weight:700;letter-spacing:.08em;margin-bottom:6px\">${label}</div>\n  <div style=\"font-size:20px;font-weight:800;color:#fafafa;margin:0 0 4px\">${esc(x.heroTitle)}</div>\n  <h2 style=\"margin:0 0 6px;font-size:17px;color:#fafafa\">${esc(x.title)}</h2>\n  <p style=\"margin:0 0 10px;font-size:15px;line-height:1.65;color:#e4e4e7\"><b>${rtl ? 'השורה התחתונה: ' : 'Bottom line: '}</b>${esc(plain(x.tldr))}</p>\n  ${list((x.keyTakeaways || []).map((k) => `<span style=\"color:#d4d4d8\">${esc(plain(k.text))}</span>`))}\n</div>`;\n\nconst html = `<!doctype html><html><body style=\"margin:0;background:#0b0b0f\">\n<div style=\"max-width:640px;margin:0 auto;padding:24px 16px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#e4e4e7\">\n  <div style=\"font-size:12px;letter-spacing:.18em;color:#a78bfa;font-weight:700;margin-bottom:6px\">GYMON BLOG</div>\n  <h1 style=\"margin:0 0 4px;font-size:20px;color:#fafafa\">${round > 1 ? `Revised article — round ${round}` : 'New article ready for review'}</h1>\n  <div style=\"font-size:13px;color:#a1a1aa;margin-bottom:14px\">slug <code>${esc(a.slug)}</code> · pillar ${esc(a.pillar || en.pillar)} · ${esc(a.read_time_en)} min EN · ${esc(a.read_time_he)} min HE · ${(en.references || []).length} sources · ${warnCount} warning(s)</div>\n  ${round > 1 && a.last_feedback ? `<div style=\"font-size:13px;color:#a1a1aa;margin:0 0 14px\">Your last note: <i>${esc(a.last_feedback)}</i></div>` : ''}\n  ${a.image_url ? `<img src=\"${esc(a.image_url)}\" alt=\"${esc(a.image_alt_en)}\" width=\"608\" style=\"width:100%;height:auto;border-radius:12px;display:block;margin:0 0 16px\">` : ''}\n  ${errHtml}${flagHtml}\n  ${lang(en, false, 'ENGLISH')}${lang(he, true, 'עברית')}\n  <a href=\"${reviewUrl}\" style=\"display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:700;font-size:15px\">Open the review page — read, check, approve or request fixes</a>\n  <div style=\"font-size:12px;color:#71717a;margin-top:14px;line-height:1.6\">The review page shows both articles in full, every flag, the reference checks (URL, DOI, PMID) and the review checklist. Approving commits two JSON files and the image to <code>OsherAlon/gymon-site</code>, branch <code>blog/incoming</code>. Nothing goes live automatically.</div>\n</div></body></html>`;\n\nreturn [{ json: { subject, html, article_id: a.article_id } }];\n" } },
  output: [{ subject: '[Gymon blog] New article for review: …', html: '<html>…</html>', article_id: 1 }],
});

const sendReviewEmail = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Send review email',
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: REVIEW_EMAIL,
      subject: expr('{{ $json.subject }}'),
      emailType: 'html',
      message: expr('{{ $json.html }}'),
      options: { appendAttribution: false, senderName: 'Gymon Blog' },
    },
    credentials: CRED_GMAIL,
  },
  output: [{ id: 'msg-1' }],
});

const reviewRequest = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: { name: 'Review page request', parameters: { httpMethod: 'GET', path: 'gymon-blog/review', responseMode: 'responseNode', options: {} } },
  output: [{ query: { id: '1', t: 'abc' } }],
});

const getArticleReview = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get article (review)',
    alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'get', dataTableId: T_ARTICLES, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'article_id', condition: 'eq', keyValue: expr("{{ String($json.query.id || '') }}") }] },
      limit: 1,
    },
  },
  output: [{ id: 1, review_token: 'abc', status: 'pending_review' }],
});

const getVersionsReview = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get versions (review)',
    alwaysOutputData: true,
    executeOnce: true,
    parameters: {
      resource: 'row', operation: 'get', dataTableId: T_VERSIONS, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'article_id', condition: 'eq', keyValue: expr("{{ String($('Review page request').first().json.query.id || '') }}") }] },
      returnAll: true,
    },
  },
  output: [{ article_id: 1, round: 1, feedback: '…' }],
});

const renderPage = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Render review page', parameters: { mode: 'runOnceForAllItems', jsCode: "// Render review page — validates the token, then returns {html, status_code}.\n// The page renders the article JSON with the SITE's inline renderer (src/lib/article/inline.mjs,\n// inlined by build.py), shows every automatic flag and reference check, and records the review\n// checklist (SEO doctrine §9.7 — the evidence of a substantive human review). Approve stays\n// disabled while there are blocking errors or an unticked checklist item; the approve webhook\n// checks both again on the server.\nconst INLINE_LIB = \"// ---- inline.mjs (generated from the site repo; edit there) ----\\nconst INLINE_TOKEN = /\\\\*\\\\*([^*]+?)\\\\*\\\\*|\\\\[\\\\[([^\\\\]]+)\\\\]\\\\]|\\\\[([^\\\\]]+)\\\\]\\\\((\\\\/[^)\\\\s]*)\\\\)/g;\\nconst INTERNAL_HREF = /^\\\\/(he\\\\/)?blog\\\\/[a-z0-9]+(?:-[a-z0-9]+)*\\\\/?$/;\\nconst escHtml = (s) =>\\nString(s == null ? '' : s)\\n.replace(/&/g, '&amp;')\\n.replace(/</g, '&lt;')\\n.replace(/>/g, '&gt;')\\n.replace(/\\\"/g, '&quot;');\\nconst markerIds = (inner) =>\\nString(inner)\\n.split(/[,\\\\s]+/)\\n.map((s) => s.trim())\\n.filter(Boolean);\\nfunction refsIn(text) {\\nconst out = [];\\nString(text || '').replace(INLINE_TOKEN, (m, _bold, refs) => {\\nif (refs) for (const id of markerIds(refs)) if (!out.includes(id)) out.push(id);\\nreturn m;\\n});\\nreturn out;\\n}\\nfunction linksIn(text) {\\nconst out = [];\\nString(text || '').replace(INLINE_TOKEN, (m, _bold, _refs, _anchor, href) => {\\nif (href) out.push(href);\\nreturn m;\\n});\\nreturn out;\\n}\\nfunction plainText(text) {\\nreturn String(text || '')\\n.replace(INLINE_TOKEN, (_m, bold, refs, anchor) => (bold != null ? bold : refs != null ? '' : anchor))\\n.replace(/\\\\s+([.,;:!?])/g, '$1')\\n.replace(/\\\\s{2,}/g, ' ')\\n.trim();\\n}\\nfunction bidiWrap(escaped) {\\nreturn escaped.replace(\\n/(\\\\d+(?:[.,]\\\\d+)?)(\\\\s*[–—×x]\\\\s*)(\\\\d+(?:[.,]\\\\d+)?)/g,\\n(m) => `<span dir=\\\"ltr\\\">${m}</span>`,\\n);\\n}\\nfunction renderInline(text, opts = {}) {\\nconst lang = opts.lang || 'en';\\nconst plain = (s) => (lang === 'he' ? bidiWrap(escHtml(s)) : escHtml(s));\\nconst cite = (ids) => {\\nconst parts = ids.map((id) => {\\nconst n = opts.refNumber ? opts.refNumber(id) : undefined;\\nconst label = n == null ? '?' : String(n);\\nconst pop = opts.refPopoverId ? opts.refPopoverId(id) : null;\\nreturn pop\\n? `<button type=\\\"button\\\" class=\\\"cite-btn\\\" popovertarget=\\\"${escHtml(pop)}\\\" aria-label=\\\"${escHtml(\\n(opts.sourceLabel || 'Source') + ' ' + label,\\n)}\\\">${label}</button>`\\n: `<a class=\\\"cite-btn\\\" href=\\\"#ref-${escHtml(id)}\\\">${label}</a>`;\\n});\\nreturn `<sup class=\\\"cite\\\" dir=\\\"ltr\\\">[${parts.join(', ')}]</sup>`;\\n};\\nlet out = '';\\nlet last = 0;\\nconst src = String(text == null ? '' : text);\\nsrc.replace(INLINE_TOKEN, (m, bold, refs, anchor, href, offset) => {\\nout += plain(src.slice(last, offset));\\nif (bold != null) out += `<strong>${plain(bold)}</strong>`;\\nelse if (refs != null) out = out.replace(/\\\\s+$/, '') + cite(markerIds(refs)); // keep the marker on its word\\nelse if (INTERNAL_HREF.test(href)) out += `<a href=\\\"${escHtml(href)}\\\">${plain(anchor)}</a>`;\\nelse out += plain(anchor);\\nlast = offset + m.length;\\nreturn m;\\n});\\nout += plain(src.slice(last));\\nreturn out;\\n}\\nfunction sentences(text) {\\nreturn plainText(text)\\n.split(/(?<=[.!?])\\\\s+(?=\\\\S)/)\\n.map((s) => s.trim())\\n.filter(Boolean);\\n}\\nconst wordCount = (text) => plainText(text).split(/\\\\s+/).filter(Boolean).length;\\n\";\nconst CHECKLIST = [\n  'I opened every source behind a core claim, and the sentence says what the source says.',\n  'The Gymon block is true: the facts match the Gymon material, the example numbers add up.',\n  'The topic is not high-YMYL, and nothing gives medical, dosing or injury advice.',\n  'I read the Hebrew version in full: gender-neutral, natural, numbers correct.',\n  'Title, description, image and alt text are right.',\n];\n\nconst q = ($('Review page request').first().json.query) || {};\nconst a = $('Get article (review)').first().json || {};\nconst versions = $('Get versions (review)').all().map((i) => i.json).filter((v) => v && v.article_id);\n\nconst shell = (title, body) => `<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"robots\" content=\"noindex,nofollow\">\n<title>${title}</title>\n<style>\n:root{--bg:#0b0b0f;--card:#16161b;--line:#2a2a33;--text:#e4e4e7;--muted:#a1a1aa;--accent:#8b5cf6;--ok:#22c55e;--warn:#facc15;--bad:#f87171}\n*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 -apple-system,Segoe UI,Roboto,Arial,sans-serif}\n.wrap{max-width:900px;margin:0 auto;padding:24px 16px 80px}\n.kicker{font-size:12px;letter-spacing:.18em;color:var(--accent);font-weight:700}\nh1{font-size:22px;margin:4px 0 2px}.meta{color:var(--muted);font-size:13px}\n.hero{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:14px;margin:18px 0;background:#000}\n.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin:14px 0}\n.bad{border-color:#b91c1c;background:#1f0b0b}.bad h3{color:var(--bad)}.flag{border-color:#a16207;background:#1f1708}.flag h3{color:var(--warn)}\nh3{font-size:13px;letter-spacing:.06em;margin:0 0 6px}\nul.l{margin:4px 0 10px;padding-inline-start:20px;font-size:14px}\ncode{font-size:12px;color:#c4b5fd}\n.tabs{display:flex;gap:8px;margin:18px 0 0;flex-wrap:wrap}.tab{background:transparent;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:6px 14px;font:inherit;font-size:14px;cursor:pointer}\n.tab.on{background:var(--accent);border-color:var(--accent);color:#fff}\n.art .heroT{font-size:28px;font-weight:800;line-height:1.15}.art h2.t{font-size:24px;line-height:1.25;margin:6px 0}.art .d{color:var(--muted)}\n.art h2{font-size:20px;margin:24px 0 6px}.art h3{font-size:16px;letter-spacing:0;margin:16px 0 4px}\n.art a{color:#c4b5fd}.box{border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:12px 0}\n.bl{border-inline-start:4px solid var(--accent)}.gy{border-color:#2f5865;background:#0f1a1d}.badge{display:inline-block;font-size:12px;border:1px solid var(--line);border-radius:999px;padding:1px 9px;color:var(--muted);margin-inline-end:6px}\n.art[dir=rtl]{text-align:right}.art[lang=he]{font-size:18px;line-height:1.75}\ntable{border-collapse:collapse;width:100%;font-size:14px}td,th{border-top:1px solid var(--line);padding:6px 8px;text-align:start;vertical-align:top}\nsup.cite{font-size:.7em}.cite-btn{color:#c4b5fd}\n.refs td:first-child{white-space:nowrap}\n.res-ok{color:var(--ok)}.res-error,.res-mismatch{color:var(--bad)}.res-unverified{color:var(--warn)}\ntextarea{width:100%;min-height:120px;background:#0f0f14;color:var(--text);border:1px solid var(--line);border-radius:10px;padding:12px;font:inherit}\n.row{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}\nbutton.b{border:0;border-radius:10px;padding:12px 20px;font:inherit;font-weight:700;cursor:pointer}\n.approve{background:var(--ok);color:#052e16}.fix{background:var(--accent);color:#fff}.ghost{background:transparent;color:var(--muted);border:1px solid var(--line)!important}\nbutton:disabled{opacity:.45;cursor:not-allowed}\n.check label{display:flex;gap:10px;align-items:flex-start;padding:6px 0;font-size:15px}.check input{width:20px;height:20px;margin-top:3px}\n.status{font-size:14px;margin-top:10px;min-height:1.4em}\ndetails{border-top:1px solid var(--line);padding:8px 0}summary{cursor:pointer;color:var(--muted);font-size:14px}\n.pill{display:inline-block;font-size:12px;border:1px solid var(--line);border-radius:999px;padding:2px 10px;color:var(--muted)}\n</style></head><body><div class=\"wrap\">${body}</div></body></html>`;\n\nif (!a.article_id || !q.t || q.t !== a.review_token) {\n  return [{ json: { status_code: 404, html: shell('Not found', '<div class=\"kicker\">GYMON BLOG</div><h1>Review link not found</h1><p class=\"meta\">The link is wrong or no longer valid. Open the most recent email for this article.</p>') } }];\n}\nconst parse = (s, d) => { try { return JSON.parse(s || ''); } catch (e) { return d; } };\nconst data = {\n  id: a.article_id, t: q.t, status: a.status, round: Number(a.round) || 1, slug: a.slug,\n  image_url: a.image_url, commit_url: a.commit_url, last_feedback: a.last_feedback,\n  en: parse(a.article_en, null), he: parse(a.article_he, null),\n  validation: parse(a.validation, null), notes: parse(a.check_notes, {}),\n  source_url: a.source_url, source_title: a.source_title, topic: a.topic,\n  checklist: CHECKLIST,\n  versions: versions.sort((x, y) => (Number(y.round) || 0) - (Number(x.round) || 0)).map((v) => ({ round: v.round, feedback: v.feedback, route: v.route, title_en: v.title_en, title_he: v.title_he, image_url: v.image_url })),\n};\n// No backslash-u escapes in this source: the n8n MCP update path decodes them into raw characters.\nconst LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029), BS = String.fromCharCode(92);\nconst safe = (s) => s.split('<').join(BS + 'u003c').split(LS).join(BS + 'u2028').split(PS).join(BS + 'u2029');\nconst json = safe(JSON.stringify(data));\n\nconst body = `\n<div class=\"kicker\">GYMON BLOG · REVIEW</div>\n<h1 id=\"h\"></h1>\n<div class=\"meta\" id=\"m\"></div>\n<img class=\"hero\" id=\"img\" alt=\"\">\n<div id=\"flags\"></div>\n<div class=\"card\"><b>Reference checks</b><div class=\"meta\">Every URL fetched, every DOI resolved in Crossref, every PMID in PubMed — before this page was sent.</div><div style=\"overflow-x:auto\"><table class=\"refs\" id=\"refs\"></table></div><div class=\"meta\" id=\"orig\"></div></div>\n<div class=\"tabs\"><button class=\"tab on\" data-l=\"en\">English</button><button class=\"tab\" data-l=\"he\">עברית</button><button class=\"tab\" data-l=\"both\">Side by side</button></div>\n<div id=\"langs\"></div>\n<div class=\"card\" id=\"actions\">\n  <b>Review checklist</b>\n  <p class=\"meta\">Recorded with the approval (reviewer, date, checklist) — the evidence that a human reviewed the article before publication.</p>\n  <div class=\"check\" id=\"cl\"></div>\n  <div class=\"row\"><button class=\"b approve\" id=\"ap\">Approve</button></div>\n  <p class=\"meta\" style=\"margin-top:18px\">Or describe what to fix (Hebrew or English). The text, the image, or both will be redone, re-checked, and a new email will arrive.</p>\n  <textarea id=\"fb\" placeholder=\"What should change?\"></textarea>\n  <div class=\"row\"><button class=\"b fix\" id=\"fx\">Send for fixes</button><button class=\"b ghost\" id=\"addflags\" type=\"button\">Add the automatic flags to the note</button></div>\n  <div class=\"status\" id=\"st\"></div>\n</div>\n<div class=\"card\" id=\"vers\" hidden><b>Earlier versions</b><div id=\"vl\"></div></div>\n<script type=\"application/json\" id=\"data\">${json}</script>\n<script>${INLINE_LIB}</script>\n<script>\nconst D = JSON.parse(document.getElementById('data').textContent);\nconst esc = (s) => String(s == null ? '' : s).replace(/[&<>\"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));\nconst V = D.validation || { en: { errors: [], warnings: [] }, he: { errors: [], warnings: [] }, cross: [], refs: [], blocking: 0 };\nconst blocking = (V.en.errors || []).length + (V.he.errors || []).length + (V.cross || []).length;\ndocument.title = 'Review: ' + ((D.en && D.en.title) || D.slug);\ndocument.getElementById('h').textContent = (D.en && D.en.title) || D.slug;\nconst statusText = { pending_review: 'waiting for your decision', revising: 'revising — a new email will arrive', approved: 'approved — committing to GitHub', committed: 'approved and committed' }[D.status] || D.status;\ndocument.getElementById('m').innerHTML = 'slug <code>' + esc(D.slug) + '</code> · round ' + D.round + ' · <span class=\"pill\">' + esc(statusText) + '</span>' + (D.commit_url ? ' · <a style=\"color:#c4b5fd\" href=\"' + esc(D.commit_url) + '\">commit</a>' : '');\nconst img = document.getElementById('img'); if (D.image_url) { img.src = D.image_url; img.alt = (D.en && D.en.imageAlt) || ''; } else img.remove();\n\n// ---- flags ----\nconst li = (arr, f) => '<ul class=\"l\">' + arr.map((x) => '<li>' + f(x) + '</li>').join('') + '</ul>';\nconst issue = (lang) => (e) => '<b>' + lang + '</b> <code>' + esc(e.path) + '</code> — ' + esc(e.message);\nlet flags = '';\nconst errs = [].concat((V.en.errors || []).map(issue('EN')), (V.he.errors || []).map(issue('HE')), (V.cross || []).map(issue('EN/HE')));\nif (errs.length) flags += '<div class=\"card bad\"><h3>BLOCKING — ' + errs.length + ' ERROR(S). APPROVE IS DISABLED.</h3><ul class=\"l\">' + errs.map((x) => '<li>' + x + '</li>').join('') + '</ul></div>';\nconst N = D.notes || {};\nconst nl = [['Citation does not support the sentence', N.entailment], ['Medical promises', N.medical_promises], ['Gendered Hebrew', N.gendered_hebrew], ['Invented experience', N.fabricated_experience], ['Hebrew reads translated', N.literal_translation], ['Other', N.other]].filter((x) => Array.isArray(x[1]) && x[1].length);\nif (nl.length) flags += '<div class=\"card flag\"><h3>FACT-CHECK FLAGS (HAIKU) — NOT BLOCKING, READ THEM</h3>' + nl.map((x) => '<b>' + esc(x[0]) + '</b>' + li(x[1], esc)).join('') + '</div>';\nconst warns = [].concat((V.en.warnings || []).map(issue('EN')), (V.he.warnings || []).map(issue('HE')));\nif (warns.length) flags += '<div class=\"card\"><details><summary>' + warns.length + ' warning(s) from the validator (style, length, numbers to double-check)</summary><ul class=\"l\">' + warns.map((x) => '<li>' + x + '</li>').join('') + '</ul></details></div>';\nif (!flags) flags = '<div class=\"meta\" style=\"color:#86efac\">No blocking errors, no fact-check flags, no warnings.</div>';\ndocument.getElementById('flags').innerHTML = flags;\n\n// ---- reference checks ----\nconst refsList = (D.en && D.en.references) || [];\nconst checks = V.refs || [];\ndocument.getElementById('refs').innerHTML = '<tr><th>Ref</th><th>Source</th><th>Checks</th></tr>' + refsList.map((r) => {\n  const cs = checks.filter((c) => c.ref === r.id).map((c) => '<div class=\"res-' + esc(c.result) + '\">' + esc(c.kind.toUpperCase()) + ': ' + esc(c.result) + ' · ' + esc(c.detail) + '</div>').join('');\n  return '<tr><td>' + esc(r.id) + '</td><td><a href=\"' + esc(r.url) + '\" target=\"_blank\" rel=\"noopener\">' + esc(r.title) + '</a><div class=\"meta\">' + esc((r.authors || []).join(', ')) + (r.year ? ' · ' + r.year : '') + ' · ' + esc(r.tier) + ' · ' + esc(r.type) + ' · ' + (r.fullTextRead ? 'page text extracted' : 'snippet only') + '</div><details><summary>quote</summary><div class=\"meta\">“' + esc(r.quote) + '”</div></details></td><td>' + (cs || '—') + '</td></tr>';\n}).join('');\ndocument.getElementById('orig').innerHTML = 'Picked from the feed item: <a style=\"color:#c4b5fd\" href=\"' + esc(D.source_url) + '\" target=\"_blank\" rel=\"noopener\">' + esc(D.source_title || D.source_url) + '</a>';\n\n// ---- article render (same inline renderer as the site) ----\nconst article = (x, lang) => {\n  if (!x) return '<div class=\"card\">(no article JSON on this row)</div>';\n  const no = new Map((x.references || []).map((r, i) => [r.id, i + 1]));\n  const inl = (t) => renderInline(t, { lang, refNumber: (id) => no.get(id) });\n  const cites = (ids) => (ids && ids.length ? inl('[[' + ids.join(',') + ']]') : '');\n  const blk = (b) => {\n    switch (b.type) {\n      case 'p': return '<p>' + inl(b.text) + '</p>';\n      case 'list': return (b.ordered ? '<ol>' : '<ul>') + b.items.map((i) => '<li>' + inl(i) + '</li>').join('') + (b.ordered ? '</ol>' : '</ul>');\n      case 'takeaway': return '<div class=\"box bl\"><b>' + inl(b.text) + '</b></div>';\n      case 'claim': return '<div class=\"box\"><span class=\"badge\">evidence: ' + esc(b.evidence) + '</span>' + inl(b.text) + cites(b.refs) + '</div>';\n      case 'callout': return '<div class=\"box bl\"><span class=\"badge\">' + esc(b.kind) + '</span>' + inl(b.text) + '</div>';\n      case 'table': return '<div class=\"box\"><b>' + inl(b.caption) + '</b>' + cites(b.refs) + '<table><tr>' + b.columns.map((c) => '<th>' + inl(c) + '</th>').join('') + '</tr>' + b.rows.map((r) => '<tr>' + r.map((c) => '<td>' + inl(String(c)) + '</td>').join('') + '</tr>').join('') + '</table></div>';\n      case 'calculator': return '<div class=\"box gy\"><span class=\"badge\">calculator</span>' + esc(b.calculator) + ' · defaults ' + esc(JSON.stringify(b.defaults || {})) + '</div>';\n      case 'cta': return '<div class=\"box gy\"><span class=\"badge\">CTA slot</span>' + esc(x.cta && x.cta.slot) + ' (fixed copy from the site)</div>';\n      case 'gymon':\n        if (b.kind === 'log-example') return '<div class=\"box gy\"><span class=\"badge\">GYMON · log-example (illustrative)</span><b>' + inl(b.caption) + '</b>' + b.sessions.map((s) => '<div class=\"meta\" style=\"margin-top:6px\">' + esc(b.exercise) + ' · ' + esc(s.label) + '</div><table><tr><th>SET</th><th>PREVIOUS</th><th>KG</th><th>REPS</th></tr>' + s.sets.map((st, i) => '<tr><td>' + (i + 1) + '</td><td dir=\"ltr\">' + (st.previous ? st.previous.kg + ' × ' + st.previous.reps : '—') + '</td><td>' + st.kg + '</td><td>' + st.reps + '</td></tr>').join('') + '</table>').join('') + '<p>' + inl(b.text || '') + '</p></div>';\n        return '<div class=\"box gy\"><span class=\"badge\">GYMON · ' + esc(b.kind) + '</span>' + (b.heading ? '<b>' + inl(b.heading) + '</b>' : '') + '<p>' + inl(b.text) + '</p>' + (b.points ? '<ul>' + b.points.map((p) => '<li>' + inl(p) + '</li>').join('') + '</ul>' : '') + '</div>';\n      default: return '<div class=\"box bad\">unknown block ' + esc(b.type) + '</div>';\n    }\n  };\n  const rtl = lang === 'he';\n  return '<div class=\"card art\"' + (rtl ? ' dir=\"rtl\" lang=\"he\"' : ' lang=\"en\"') + '>'\n    + '<div class=\"meta\">' + esc(lang.toUpperCase()) + ' · alt: ' + esc(x.imageAlt) + ' · primary query: ' + esc(x.primaryQuery) + ' · ' + esc((x.title || '').length) + ' chars title · ' + esc((x.description || '').length) + ' chars description</div>'\n    + '<div class=\"heroT\">' + esc(x.heroTitle) + '</div><h2 class=\"t\">' + esc(x.title) + '</h2><p class=\"d\">' + esc(x.description) + '</p>'\n    + '<div class=\"box bl\"><b>' + (rtl ? 'השורה התחתונה' : 'Bottom line') + '</b><p>' + inl(x.tldr) + '</p><ul>' + (x.keyTakeaways || []).map((k) => '<li>' + inl(k.text) + cites(k.refs) + '</li>').join('') + '</ul></div>'\n    + (x.sections || []).map((s) => '<h2>' + inl(s.heading) + (s.apply ? ' <span class=\"badge\">apply</span>' : '') + '</h2>' + (s.blocks || []).map(blk).join('')).join('')\n    + ((x.quiz || []).length ? '<h2>' + (rtl ? 'בדיקה עצמית' : 'Check yourself') + '</h2>' + x.quiz.map((qq) => '<p><b>' + inl(qq.question) + '</b></p><ul>' + qq.options.map((o, i) => '<li>' + (i === qq.correctIndex ? '✓ ' : '') + inl(o) + '</li>').join('') + '</ul><p class=\"meta\">' + inl(qq.explanation) + cites(qq.refs) + '</p>').join('') : '')\n    + ((x.faq || []).length ? '<h2>' + (rtl ? 'שאלות נפוצות' : 'Common questions') + '</h2>' + x.faq.map((f) => '<h3>' + inl(f.q) + '</h3><p>' + inl(f.a) + cites(f.refs) + '</p>').join('') : '')\n    + '<h2>' + (rtl ? 'מקורות' : 'Sources') + '</h2><ol>' + (x.references || []).map((r) => '<li id=\"ref-' + esc(r.id) + '\" dir=\"ltr\"><a href=\"' + esc(r.url) + '\" target=\"_blank\" rel=\"noopener\">' + esc(r.title) + '</a></li>').join('') + '</ol></div>';\n};\nconst show = (l) => { document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.l === l)); document.getElementById('langs').innerHTML = l === 'both' ? article(D.en, 'en') + article(D.he, 'he') : article(D[l], l); };\ndocument.querySelectorAll('.tab').forEach((b) => (b.onclick = () => show(b.dataset.l))); show('en');\n\nif (D.versions.length) { const v = document.getElementById('vers'); v.hidden = false; document.getElementById('vl').innerHTML = D.versions.map((x) => '<details><summary>Round ' + esc(x.round) + ' — note: ' + esc(x.feedback) + ' (' + esc(x.route) + ')</summary>' + (x.image_url ? '<img style=\"width:220px;border-radius:8px\" src=\"' + esc(x.image_url) + '\">' : '') + '<p>' + esc(x.title_en) + '</p><p dir=\"rtl\">' + esc(x.title_he) + '</p></details>').join(''); }\n\n// ---- checklist + actions ----\nconst cl = document.getElementById('cl');\ncl.innerHTML = D.checklist.map((c, i) => '<label><input type=\"checkbox\" data-i=\"' + i + '\"><span>' + esc(c) + '</span></label>').join('');\nconst st = document.getElementById('st'), ap = document.getElementById('ap'), fx = document.getElementById('fx'), fb = document.getElementById('fb');\nconst ticks = () => [...cl.querySelectorAll('input')].map((x) => x.checked);\nconst refresh = () => { ap.disabled = D.status !== 'pending_review' || blocking > 0 || !ticks().every(Boolean); };\ncl.addEventListener('change', refresh); refresh();\nif (blocking > 0) st.textContent = 'Approve is disabled: ' + blocking + ' blocking error(s). Send for fixes.';\nconst lock = (on) => { ap.disabled = fx.disabled = fb.disabled = on; if (!on) refresh(); };\nif (D.status !== 'pending_review') { lock(true); st.textContent = 'No action available — this article is ' + statusText + '.'; }\ndocument.getElementById('addflags').onclick = () => {\n  const lines = [].concat((V.en.errors || []).map((e) => 'EN ' + e.path + ': ' + e.message), (V.he.errors || []).map((e) => 'HE ' + e.path + ': ' + e.message), (V.cross || []).map((e) => e.path + ': ' + e.message), nl.flatMap((x) => x[1].map((i) => x[0] + ': ' + i)));\n  fb.value = (fb.value ? fb.value + '\\\\n\\\\n' : '') + 'Fix these automatic flags:\\\\n- ' + lines.join('\\\\n- ');\n};\nconst post = async (path, body) => { const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); let j = {}; try { j = await r.json(); } catch (e) {} if (!r.ok || !j.ok) throw new Error(j.error || ('HTTP ' + r.status)); return j; };\nap.onclick = async () => { if (!confirm('Approve and commit to blog/incoming? The checklist is recorded with your approval.')) return; lock(true); st.textContent = 'Sending…'; try { const j = await post('approve', { id: D.id, t: D.t, checklist: ticks() }); st.textContent = j.message || 'Approved.'; } catch (e) { st.textContent = 'Failed: ' + e.message; lock(false); } };\nfx.onclick = async () => { const f = fb.value.trim(); if (f.length < 3) { st.textContent = 'Write what should change first.'; return; } lock(true); st.textContent = 'Sending…'; try { const j = await post('fix', { id: D.id, t: D.t, feedback: f }); st.textContent = j.message || 'Received.'; } catch (e) { st.textContent = 'Failed: ' + e.message; lock(false); } };\n</script>`;\n\nreturn [{ json: { status_code: 200, html: shell('Review: ' + String(a.title_en || a.slug).replace(/[<>&\"]/g, ''), body) } }];\n" } },
  output: [{ status_code: 200, html: '<html>…</html>' }],
});

const respondPage = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Serve review page',
    parameters: {
      respondWith: 'text',
      responseBody: expr('{{ $json.html }}'),
      options: {
        responseCode: expr('{{ $json.status_code }}'),
        responseHeaders: { entries: [
          { name: 'Content-Type', value: 'text/html; charset=utf-8' },
          { name: 'Cache-Control', value: 'no-store' },
          { name: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ] },
      },
    },
  },
});

const approveRequest = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: { name: 'Approve request', parameters: { httpMethod: 'POST', path: 'gymon-blog/approve', responseMode: 'responseNode', options: {} } },
  output: [{ body: { id: 1, t: 'abc' } }],
});

const getArticleApprove = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get article (approve)',
    alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'get', dataTableId: T_ARTICLES, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'article_id', condition: 'eq', keyValue: expr("{{ String($json.body?.id || '') }}") }] },
      limit: 1,
    },
  },
  output: [{ article_id: '261004090000-rest-between-sets', review_token: 'abc', status: 'pending_review', round: 1, slug: 'rest-between-sets', title_en: '…', title_he: '…', image_url: 'https://res.cloudinary.com/…' }],
});

const canApprove = ifElse({
  version: 2.2,
  config: {
    name: 'Valid approval?',
    parameters: {
      conditions: {
        options: IF_OPTS,
        conditions: [{ leftValue: expr("{{ (() => { const a = $json; const b = $('Approve request').item.json.body || {}; let v; try { v = JSON.parse(a.validation || 'null'); } catch (e) { return false; } if (!v) return false; const errs = ((v.en || {}).errors || []).length + ((v.he || {}).errors || []).length + (v.cross || []).length; const cl = Array.isArray(b.checklist) ? b.checklist : []; return !!a.article_id && !!a.review_token && a.review_token === b.t && a.status === 'pending_review' && !!a.article_en && errs === 0 && cl.length === 5 && cl.every(x => x === true); })() }}"), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const rejectApprove = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Reject approval',
    parameters: { respondWith: 'json', responseBody: expr("{{ JSON.stringify({ ok: false, error: !$json.article_id ? 'Article not found.' : ($json.status !== 'pending_review' ? 'This article is ' + $json.status + ' — no action available.' : 'Not accepted: invalid or expired link, an empty note, blocking errors still open, or an incomplete review checklist.') }) }}"), options: { responseCode: 409 } },
  },
});

const markApproved = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Mark approved',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: T_ARTICLES, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'article_id', condition: 'eq', keyValue: expr('{{ $json.article_id }}') }] },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          status: 'approved',
          published_date: expr("{{ $now.setZone('Asia/Jerusalem').toFormat('yyyy-MM-dd') }}"),
          reviewed_at: expr("{{ $now.setZone('Asia/Jerusalem').toISO() }}"),
          review_checklist: expr("{{ JSON.stringify({ reviewer: 'Osher Alon', at: $now.setZone('Asia/Jerusalem').toISO(), items: ($('Approve request').item.json.body || {}).checklist || [] }) }}"),
        },
        matchingColumns: [],
        schema: [
          { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'published_date', displayName: 'published_date', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'reviewed_at', displayName: 'reviewed_at', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'review_checklist', displayName: 'review_checklist', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
        ],
      },
      options: {},
    },
  },
  output: [{ id: 1, status: 'approved' }],
});

const respondApproved = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Confirm approval',
    parameters: { respondWith: 'json', responseBody: expr("{{ JSON.stringify({ ok: true, status: 'approved', message: 'Approved. Committing to GitHub (blog/incoming) now — a confirmation email will follow.' }) }}"), options: {} },
  },
});

const buildFiles = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Build commit files', parameters: { mode: 'runOnceForAllItems', jsCode: "// Build commit files — the two article JSON files exactly as the site's content collection\n// expects them (src/content/articles/<lang>/<slug>.json, validated by the SAME validator the\n// build runs; a file that would fail the build is never committed), plus the GitHub target.\n// ===== shared article contract (site src/lib/article) + pipeline helpers — generated by build.py =====\n// ---- schema.mjs (generated from the site repo; edit there) ----\nconst SCHEMA_VERSION = 1;\nconst LANGS = ['en', 'he'];\nconst PILLARS = ['progressive-overload', 'sets-reps-volume', 'plans-splits', 'home-gym', 'tools'];\nconst INTENTS = ['know', 'do'];\nconst YMYL_LEVELS = ['low'];\nconst LENGTH_BANDS = ['600-900', '900-1400', '1400-1800'];\nconst EVIDENCE_LEVELS = ['strong', 'moderate', 'limited', 'mixed', 'insufficient'];\nconst CERTAINTY_WORDS = {\nen: {\nstrong: ['results in', 'reliably', 'consistently'],\nmoderate: ['probably', 'likely'],\nlimited: ['may', 'might', 'could'],\nmixed: ['mixed', 'unclear', 'uncertain', 'inconsistent'],\ninsufficient: ['uncertain', 'not enough', 'unknown', 'too little'],\n},\nhe: {\nstrong: ['מביא ל', 'מביאה ל', 'באופן עקבי', 'בעקביות'],\nmoderate: ['כנראה', 'ככל הנראה', 'סביר'],\nlimited: ['ייתכן', 'עשוי', 'עשויה', 'עשויים', 'אולי'],\nmixed: ['אינן חד-משמעיות', 'לא חד-משמעיות', 'סותרות', 'מעורבות'],\ninsufficient: ['אין מספיק', 'לא ידוע', 'לא ברור'],\n},\n};\nconst REF_TIERS = ['PRIMARY', 'AUTHORITY', 'SECONDARY'];\nconst REF_TYPES = [\n'meta-analysis',\n'systematic-review',\n'rct',\n'cohort',\n'cross-sectional',\n'review',\n'position-stand',\n'guideline',\n'other',\n];\nconst CALLOUT_KINDS = ['note', 'myth', 'safety'];\nconst CTA_SLOTS = ['log-sets', 'track-progress', 'plan-builder'];\nconst GYMON_KINDS = ['log-example', 'plan-logic', 'teardown-finding'];\nconst CALCULATORS = {\n'one-rep-max': {\nweightKg: { min: 1, max: 500, default: 80 },\nreps: { min: 1, max: 12, default: 5 },\n},\n};\nconst BLOCK_TYPES = ['p', 'list', 'takeaway', 'claim', 'callout', 'table', 'calculator', 'cta', 'gymon'];\nconst LIMITS = {\ntitle: { min: 20, max: 52, hardMax: 70 },\nheroTitleWords: { min: 1, max: 4 },\ndescription: { en: [120, 155], he: [100, 145] },\ntags: [2, 4],\nkeyTakeaways: [3, 5],\nsections: [4, 7],\nfaq: [0, 5],\nquiz: [0, 3],\nquizOptions: [2, 4],\ntables: 3,\nreferences: [1, 20],\ntldrSentences: 3,\nsentenceWords: 25,\ninternalLinks: [2, 4],\n};\nconst COMMERCIAL_HOST = /(amazon\\.|ebay\\.|walmart\\.|iherb\\.|bodybuilding\\.com|myprotein|gnc\\.com|kidneystronger\\.com|mtntactical\\.com|\\/\\/(shop|store)\\.)/i;\nconst TRACKING_PARAM = /[?&](utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|cmpid|icid|s_cid)=/i;\nconst PRIMARY_HOST = /(pubmed\\.ncbi\\.nlm\\.nih\\.gov|pmc\\.ncbi\\.nlm\\.nih\\.gov|ncbi\\.nlm\\.nih\\.gov\\/pmc|doi\\.org|bjsm\\.bmj\\.com|bmj\\.com|link\\.springer\\.com|springeropen\\.com|biomedcentral\\.com|frontiersin\\.org|journals\\.lww\\.com|journals\\.physiology\\.org|tandfonline\\.com|jissn|sciencedirect\\.com|onlinelibrary\\.wiley\\.com|mdpi\\.com|nature\\.com|cochranelibrary\\.com|journals\\.plos\\.org|jamanetwork\\.com|thelancet\\.com|academic\\.oup\\.com|journals\\.sagepub\\.com|humankinetics\\.com|biolsport\\.com|termedia\\.pl)/i;\nconst AUTHORITY_HOST = /(acsm\\.org|nsca\\.com|sportsnutritionsociety\\.org|\\.gov(\\/|$|\\.)|nih\\.gov|who\\.int|nhs\\.uk|\\.edu(\\/|$)|\\.ac\\.[a-z]{2}(\\/|$)|ausport\\.gov\\.au)/i;\nconst tierOfUrl = (u) => (PRIMARY_HOST.test(u) ? 'PRIMARY' : AUTHORITY_HOST.test(u) ? 'AUTHORITY' : 'SECONDARY');\nconst YMYL_TOPIC = new RegExp(\n[\n'supplement', 'creatine', 'protein powder', 'whey', 'caffeine', 'pre-?workout', 'vitamin', 'steroid',\n'weight[- ]?loss', 'fat[- ]?loss', 'lose weight', 'diet', 'calori', 'bmi\\\\b', 'keto', 'fasting',\n'injur', 'pain', 'rehab', 'physio', 'tendin', 'surgery',\n'pregnan', 'postpartum', 'menopaus', 'menstrua',\n'diabet', 'hypertens', 'blood pressure', 'cancer', 'osteopor', 'arthritis', 'disease', 'medical', 'medication', 'drug',\n'eating disorder',\n'תוסף', 'תוספי', 'קריאטין', 'אבקת חלבון', 'ירידה במשקל', 'הרזיה', 'דיאטה', 'קלורי', 'פציע', 'כאב', 'שיקום',\n'הריון', 'היריון', 'לידה', 'גיל המעבר', 'סוכרת', 'לחץ דם', 'מחלה', 'תרופ',\n].join('|'),\n'i',\n);\nconst HE_GENDERED_WORDS = [\n'אתה', 'תוכל', 'תוכלי', 'תרצה', 'תרצי', 'תצטרך', 'תצטרכי', 'תרגיש', 'תרגישי', 'תראה', 'תראי',\n'נסה', 'נסי', 'הזן', 'הזיני', 'קח', 'קחי', 'תן', 'תני', 'שים', 'שימי', 'זכור', 'זכרי',\n'בצע', 'בצעי', 'הקפד', 'הקפידי', 'הוסף', 'הוסיפי', 'רשום', 'רשמי', 'התחל', 'התחילי',\n'בחר', 'בחרי', 'הרם', 'הרימי', 'הורד', 'הורידי', 'המשך', 'המשיכי', 'עצור', 'עצרי',\n'המתאמן', 'המתאמנת',\n];\nconst CODE_FIELDS = [\n'schemaVersion', 'lang', 'slug', 'pillar', 'tags', 'intent', 'ymylLevel', 'lengthBand', 'image',\n'imageAiGenerated', 'createdAt', 'updatedAt', 'reviewedAt', 'editor', 'aiAssisted', 'sample',\n];\nconst TOP_LEVEL_KEYS = [\n...CODE_FIELDS,\n'title', 'heroTitle', 'description', 'primaryQuery', 'imageAlt',\n'tldr', 'keyTakeaways', 'sections', 'faq', 'quiz', 'references', 'cta',\n];\n// ---- inline.mjs (generated from the site repo; edit there) ----\nconst INLINE_TOKEN = /\\*\\*([^*]+?)\\*\\*|\\[\\[([^\\]]+)\\]\\]|\\[([^\\]]+)\\]\\((\\/[^)\\s]*)\\)/g;\nconst INTERNAL_HREF = /^\\/(he\\/)?blog\\/[a-z0-9]+(?:-[a-z0-9]+)*\\/?$/;\nconst escHtml = (s) =>\nString(s == null ? '' : s)\n.replace(/&/g, '&amp;')\n.replace(/</g, '&lt;')\n.replace(/>/g, '&gt;')\n.replace(/\"/g, '&quot;');\nconst markerIds = (inner) =>\nString(inner)\n.split(/[,\\s]+/)\n.map((s) => s.trim())\n.filter(Boolean);\nfunction refsIn(text) {\nconst out = [];\nString(text || '').replace(INLINE_TOKEN, (m, _bold, refs) => {\nif (refs) for (const id of markerIds(refs)) if (!out.includes(id)) out.push(id);\nreturn m;\n});\nreturn out;\n}\nfunction linksIn(text) {\nconst out = [];\nString(text || '').replace(INLINE_TOKEN, (m, _bold, _refs, _anchor, href) => {\nif (href) out.push(href);\nreturn m;\n});\nreturn out;\n}\nfunction plainText(text) {\nreturn String(text || '')\n.replace(INLINE_TOKEN, (_m, bold, refs, anchor) => (bold != null ? bold : refs != null ? '' : anchor))\n.replace(/\\s+([.,;:!?])/g, '$1')\n.replace(/\\s{2,}/g, ' ')\n.trim();\n}\nfunction bidiWrap(escaped) {\nreturn escaped.replace(\n/(\\d+(?:[.,]\\d+)?)(\\s*[–—×x]\\s*)(\\d+(?:[.,]\\d+)?)/g,\n(m) => `<span dir=\"ltr\">${m}</span>`,\n);\n}\nfunction renderInline(text, opts = {}) {\nconst lang = opts.lang || 'en';\nconst plain = (s) => (lang === 'he' ? bidiWrap(escHtml(s)) : escHtml(s));\nconst cite = (ids) => {\nconst parts = ids.map((id) => {\nconst n = opts.refNumber ? opts.refNumber(id) : undefined;\nconst label = n == null ? '?' : String(n);\nconst pop = opts.refPopoverId ? opts.refPopoverId(id) : null;\nreturn pop\n? `<button type=\"button\" class=\"cite-btn\" popovertarget=\"${escHtml(pop)}\" aria-label=\"${escHtml(\n(opts.sourceLabel || 'Source') + ' ' + label,\n)}\">${label}</button>`\n: `<a class=\"cite-btn\" href=\"#ref-${escHtml(id)}\">${label}</a>`;\n});\nreturn `<sup class=\"cite\" dir=\"ltr\">[${parts.join(', ')}]</sup>`;\n};\nlet out = '';\nlet last = 0;\nconst src = String(text == null ? '' : text);\nsrc.replace(INLINE_TOKEN, (m, bold, refs, anchor, href, offset) => {\nout += plain(src.slice(last, offset));\nif (bold != null) out += `<strong>${plain(bold)}</strong>`;\nelse if (refs != null) out = out.replace(/\\s+$/, '') + cite(markerIds(refs)); // keep the marker on its word\nelse if (INTERNAL_HREF.test(href)) out += `<a href=\"${escHtml(href)}\">${plain(anchor)}</a>`;\nelse out += plain(anchor);\nlast = offset + m.length;\nreturn m;\n});\nout += plain(src.slice(last));\nreturn out;\n}\nfunction sentences(text) {\nreturn plainText(text)\n.split(/(?<=[.!?])\\s+(?=\\S)/)\n.map((s) => s.trim())\n.filter(Boolean);\n}\nconst wordCount = (text) => plainText(text).split(/\\s+/).filter(Boolean).length;\n// ---- validate.mjs (generated from the site repo; edit there) ----\nconst SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;\nconst DATE = /^\\d{4}-\\d{2}-\\d{2}$/;\nconst REF_ID = /^r\\d{1,2}$/;\nconst DOI = /^10\\.\\d{4,9}\\/\\S+$/;\nconst HE_LETTER = 'א-ת';\nconst isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);\nconst isStr = (v, min = 1) => typeof v === 'string' && v.trim().length >= min;\nfunction numbersIn(text) {\nconst out = [];\nString(text || '').replace(/(?<![A-Za-z])\\d+(?:[.,]\\d+)*(?![A-Za-z\\d])/g, (m) => {\nlet n = m;\nif (/^\\d{1,3}(,\\d{3})+$/.test(n)) n = n.replace(/,/g, '');\nelse n = n.replace(',', '.');\nn = n.replace(/^0+(?=\\d)/, '');\nout.push(n);\nreturn m;\n});\nreturn out;\n}\nfunction normForMatch(s) {\nreturn String(s || '')\n.toLowerCase()\n.replace(/[‘’`´]/g, \"'\")\n.replace(/[“”„]/g, '\"')\n.replace(/[–—−]/g, '-')\n.replace(/&lt;/g, '<')\n.replace(/&gt;/g, '>')\n.replace(/&amp;/g, '&')\n.replace(/\\s+/g, ' ')\n.trim();\n}\nfunction quoteInResearch(quote, research) {\nconst hay = normForMatch(research);\nconst chunks = normForMatch(quote)\n.split(/\\.\\.\\.|…|\\[…\\]|\\[\\.\\.\\.\\]/)\n.map((c) => c.trim())\n.filter((c) => c.length >= 20);\nif (!chunks.length) return hay.includes(normForMatch(quote));\nreturn chunks.every((c) => hay.includes(c));\n}\nconst readTimeOf = (article) => {\nconst words = collectUnits(article).reduce((n, u) => n + wordCount(u.text), 0);\nreturn Math.max(1, Math.round(words / (article && article.lang === 'he' ? 200 : 230)));\n};\nfunction collectUnits(a) {\nconst units = [];\nconst push = (path, text, refs = [], kind = 'text') => {\nif (typeof text !== 'string') return;\nunits.push({ path, text, refs: [...new Set([...(refs || []), ...refsIn(text)])], kind });\n};\nif (!isObj(a)) return units;\npush('tldr', a.tldr);\n(Array.isArray(a.keyTakeaways) ? a.keyTakeaways : []).forEach((t, i) => isObj(t) && push(`keyTakeaways[${i}]`, t.text, t.refs));\n(Array.isArray(a.sections) ? a.sections : []).forEach((s, si) => {\nif (!isObj(s)) return;\npush(`sections[${si}].heading`, s.heading, [], 'heading');\n(Array.isArray(s.blocks) ? s.blocks : []).forEach((b, bi) => {\nif (!isObj(b)) return;\nconst p = `sections[${si}].blocks[${bi}]`;\nif (b.type === 'p' || b.type === 'takeaway' || b.type === 'callout') push(p, b.text);\nelse if (b.type === 'claim') push(p, b.text, b.refs);\nelse if (b.type === 'list') (Array.isArray(b.items) ? b.items : []).forEach((it, ii) => push(`${p}.items[${ii}]`, it));\nelse if (b.type === 'table') {\npush(`${p}.caption`, b.caption, b.refs);\n(Array.isArray(b.rows) ? b.rows : []).forEach((r, ri) =>\n(Array.isArray(r) ? r : []).forEach((c, ci) => push(`${p}.rows[${ri}][${ci}]`, String(c), b.refs)),\n);\n} else if (b.type === 'gymon') {\nconst kind = b.kind === 'log-example' ? 'gymon-example' : 'gymon';\npush(`${p}.text`, b.text, [], kind);\n(Array.isArray(b.points) ? b.points : []).forEach((pt, pi) => push(`${p}.points[${pi}]`, pt, [], kind));\nif (b.caption) push(`${p}.caption`, b.caption, [], kind);\n}\n});\n});\n(Array.isArray(a.faq) ? a.faq : []).forEach((f, i) => {\nif (!isObj(f)) return;\npush(`faq[${i}].q`, f.q, [], 'heading');\npush(`faq[${i}].a`, f.a, f.refs);\n});\n(Array.isArray(a.quiz) ? a.quiz : []).forEach((q, i) => {\nif (!isObj(q)) return;\npush(`quiz[${i}].question`, q.question, [], 'quiz');\n(Array.isArray(q.options) ? q.options : []).forEach((o, oi) => push(`quiz[${i}].options[${oi}]`, o, [], 'quiz'));\npush(`quiz[${i}].explanation`, q.explanation, q.refs);\n});\nreturn units;\n}\nfunction ymylGuard(fields) {\nconst hits = [];\nfor (const [k, v] of Object.entries(fields || {})) {\nconst m = String(v || '').match(YMYL_TOPIC);\nif (m) hits.push(`${k}: \"${m[0]}\"`);\n}\nreturn hits;\n}\nconst GENDERED = new RegExp(\n`(?:^|[^${HE_LETTER}])(?:ו|ש|כש)?(${HE_GENDERED_WORDS.join('|')})(?![${HE_LETTER}])`,\n'g',\n);\nconst SLASH_FORM = new RegExp(`[${HE_LETTER}]+/(?:ה|ת|ית|י|ים|ות)(?![${HE_LETTER}])`, 'g');\nfunction hebrewLint(text) {\nconst out = [];\nconst t = String(text || '');\nlet m;\nGENDERED.lastIndex = 0;\nwhile ((m = GENDERED.exec(t))) out.push(`gendered form \"${m[1]}\" (use plural, \"יש ל-\" or an impersonal form)`);\nfor (const s of t.match(SLASH_FORM) || []) out.push(`slash form \"${s}\" (not allowed)`);\nfor (const s of t.match(/\\d+\\s*[–—]\\s*\\d+/g) || []) out.push(`range \"${s}\" with a dash flips in RTL — write \"X עד Y\"`);\nfor (const s of t.match(/\\d+\\s*[×xX]\\s*\\d+/g) || []) out.push(`\"${s}\" flips in RTL — write \"N סטים של M\"`);\nif (/כפיפות ברכיים/.test(t)) out.push('\"כפיפות ברכיים\" means the leg-curl machine in Israeli gym usage — use \"סקוואט\" for squat');\nif (/עומס מתקדם/.test(t)) out.push('\"עומס מתקדם\" is a calque nobody searches — use \"פרוגרסיב אוברלואד (עומס פרוגרסיבי)\"');\nif (/(^|[^*])\\*[^*\\s][^*]*\\*(?!\\*)/.test(t) || /(^|\\s)_[^_]+_(\\s|$)/.test(t)) out.push('italic markup — Hebrew has no italic; use **bold** sparingly');\nreturn out;\n}\nconst ARTIFACTS = /(as an ai\\b|as a language model|in conclusion, it'?s important|\\[placeholder|lorem ipsum|\\bTODO\\b|<PLACEHOLDER)/i;\nconst MEDICAL_EN = /\\b(cures?|guarantee[sd]?|prevents? injur(y|ies)|treats?|heals?)\\b/i;\nconst MEDICAL_HE = /(מרפא|מבטיח|מונע פציעות|מונעת פציעות|ריפוי)/;\nconst FABRICATED = /(our users|users (told|tell) us|in my experience|my clients|i've seen|המשתמשים שלנו|מניסיוני|הלקוחות שלי)/i;\nconst RAW_HTML = /<\\/?[a-z][a-z0-9-]*(\\s[^>]*)?>/i;\nconst EXT_MD_LINK = /\\[[^\\]]+\\]\\(\\s*(https?:|www\\.)/i;\nconst HEADING_MD = /(^|\\n)\\s{0,3}#{1,6}\\s/;\nfunction validateArticle(a, ctx = {}) {\nconst errors = [];\nconst warnings = [];\nconst err = (path, message) => errors.push({ path, message });\nconst warn = (path, message) => warnings.push({ path, message });\nconst pipeline = ctx.mode === 'pipeline';\nif (!isObj(a)) {\nerr('', 'article is not an object');\nreturn { errors, warnings, stats: {} };\n}\nfor (const k of Object.keys(a)) if (!TOP_LEVEL_KEYS.includes(k)) err(k, 'unknown field (closed schema)');\nif (a.schemaVersion !== SCHEMA_VERSION) err('schemaVersion', `must be ${SCHEMA_VERSION}`);\nif (!LANGS.includes(a.lang)) err('lang', `must be one of ${LANGS.join(', ')}`);\nconst lang = LANGS.includes(a.lang) ? a.lang : 'en';\nif (!isStr(a.slug) || !SLUG.test(a.slug)) err('slug', 'lowercase latin letters, digits and dashes');\nif (!isStr(a.title)) err('title', 'required');\nelse {\nif (a.title.length > LIMITS.title.hardMax) err('title', `${a.title.length} characters (hard limit ${LIMITS.title.hardMax})`);\nelse if (a.title.length > LIMITS.title.max) warn('title', `${a.title.length} characters — SEO doctrine caps titles at ${LIMITS.title.max}`);\nif (a.title.length < LIMITS.title.min) warn('title', 'very short');\n}\nif (!isStr(a.heroTitle)) err('heroTitle', 'required (2–4 words)');\nelse {\nconst n = a.heroTitle.trim().split(/\\s+/).length;\nif (n > 6) err('heroTitle', `${n} words`);\nelse if (n > LIMITS.heroTitleWords.max) warn('heroTitle', `${n} words (2–4 expected)`);\n}\nif (!isStr(a.description)) err('description', 'required');\nelse {\nconst [lo, hi] = LIMITS.description[lang];\nif (a.description.length < lo || a.description.length > hi) warn('description', `${a.description.length} characters (${lo}–${hi} expected)`);\n}\nif (!PILLARS.includes(a.pillar)) err('pillar', `must be one of ${PILLARS.join(', ')}`);\nif (!Array.isArray(a.tags) || a.tags.length < LIMITS.tags[0] || a.tags.length > LIMITS.tags[1] || !a.tags.every((t) => isStr(t) && SLUG.test(t)))\nerr('tags', `${LIMITS.tags[0]}–${LIMITS.tags[1]} kebab-case tags`);\nif (!INTENTS.includes(a.intent)) err('intent', `must be one of ${INTENTS.join(', ')}`);\nif (!YMYL_LEVELS.includes(a.ymylLevel)) err('ymylLevel', 'only low-YMYL topics are published (no credentialed reviewer)');\nif (!LENGTH_BANDS.includes(a.lengthBand)) err('lengthBand', `must be one of ${LENGTH_BANDS.join(', ')}`);\nif (!isStr(a.primaryQuery)) err('primaryQuery', 'required');\nconst ymyl = ymylGuard({ slug: a.slug, title: a.title, primaryQuery: a.primaryQuery, heroTitle: a.heroTitle });\nif (ymyl.length) err('topic', `YMYL topic guard: ${ymyl.join('; ')}`);\nif (!isStr(a.image) || !/^(\\/|https:\\/\\/)/.test(a.image)) err('image', 'path under public/ or https URL');\nif (!isStr(a.imageAlt, 8)) err('imageAlt', 'required');\nif (typeof a.imageAiGenerated !== 'boolean') err('imageAiGenerated', 'boolean required');\nif (!isStr(a.createdAt) || !DATE.test(a.createdAt)) err('createdAt', 'YYYY-MM-DD');\nif (a.updatedAt != null && (!DATE.test(String(a.updatedAt)) || String(a.updatedAt) < String(a.createdAt)))\nerr('updatedAt', 'YYYY-MM-DD, not before createdAt (set only on a substantive change)');\nif (a.reviewedAt != null && !DATE.test(String(a.reviewedAt))) err('reviewedAt', 'YYYY-MM-DD or null');\nif (a.editor !== 'osher-alon') err('editor', 'must be \"osher-alon\" (the named human editor)');\nif (a.aiAssisted !== true) err('aiAssisted', 'must be true (drives the disclosure line)');\nif (a.sample != null && typeof a.sample !== 'boolean') err('sample', 'boolean');\nif (!a.sample && a.reviewedAt == null && !pipeline) err('reviewedAt', 'a non-sample article must carry the date of its human review');\nconst refs = new Map();\nif (!Array.isArray(a.references) || a.references.length < LIMITS.references[0] || a.references.length > LIMITS.references[1])\nerr('references', `${LIMITS.references[0]}–${LIMITS.references[1]} references`);\n(Array.isArray(a.references) ? a.references : []).forEach((r, i) => {\nconst p = `references[${i}]`;\nif (!isObj(r)) return err(p, 'object expected');\nconst allowed = ['id', 'title', 'authors', 'year', 'venue', 'url', 'doi', 'pmid', 'tier', 'type', 'fullTextRead', 'quote'];\nfor (const k of Object.keys(r)) if (!allowed.includes(k)) err(`${p}.${k}`, 'unknown field');\nif (!isStr(r.id) || !REF_ID.test(r.id)) err(`${p}.id`, 'r1, r2, …');\nelse if (refs.has(r.id)) err(`${p}.id`, `duplicate id ${r.id}`);\nelse refs.set(r.id, r);\nif (!isStr(r.title)) err(`${p}.title`, 'required');\nif (!Array.isArray(r.authors) || !r.authors.every((x) => isStr(x))) err(`${p}.authors`, 'array of names');\nif (r.year != null && !(Number.isInteger(r.year) && r.year > 1900 && r.year < 2100)) err(`${p}.year`, 'year or null');\nif (r.venue != null && typeof r.venue !== 'string') err(`${p}.venue`, 'string');\nif (!isStr(r.url) || !/^https:\\/\\/[^\\s]+$/.test(r.url)) err(`${p}.url`, 'https URL');\nelse {\nif (COMMERCIAL_HOST.test(r.url)) err(`${p}.url`, 'commercial host — not a source');\nif (TRACKING_PARAM.test(r.url)) err(`${p}.url`, 'tracking parameters must be stripped');\nif (r.tier !== tierOfUrl(r.url)) err(`${p}.tier`, `is ${r.tier}, the URL's tier is ${tierOfUrl(r.url)}`);\nif (Array.isArray(ctx.allowedUrls) && !ctx.allowedUrls.includes(r.url)) err(`${p}.url`, 'not in the research pack (invented or off-list URL)');\n}\nif (r.doi != null && !(isStr(r.doi) && DOI.test(r.doi))) err(`${p}.doi`, '10.xxxx/… or omit');\nif (r.pmid != null && !(isStr(r.pmid) && /^\\d{4,9}$/.test(r.pmid))) err(`${p}.pmid`, 'digits or omit');\nif (!REF_TIERS.includes(r.tier)) err(`${p}.tier`, REF_TIERS.join(' | '));\nif (!REF_TYPES.includes(r.type)) err(`${p}.type`, REF_TYPES.join(' | '));\nif (typeof r.fullTextRead !== 'boolean') err(`${p}.fullTextRead`, 'boolean');\nif (!isStr(r.quote, 10)) err(`${p}.quote`, 'verbatim snippet from the source is required');\nelse if (typeof ctx.researchText === 'string') {\nif (!quoteInResearch(r.quote, ctx.researchText)) warn(`${p}.quote`, 'not found verbatim in the research pack — check it against the source');\nconst hay = normForMatch(ctx.researchText);\nfor (const n of numbersIn(r.quote)) if (!hay.includes(n)) err(`${p}.quote`, `number ${n} appears in no source text (fabricated?)`);\n}\n});\nif (!isStr(a.tldr)) err('tldr', 'required: 1–3 sentences answering the title question');\nelse if (sentences(a.tldr).length > LIMITS.tldrSentences) warn('tldr', `${sentences(a.tldr).length} sentences (≤${LIMITS.tldrSentences})`);\nif (!Array.isArray(a.keyTakeaways) || a.keyTakeaways.length < LIMITS.keyTakeaways[0] || a.keyTakeaways.length > LIMITS.keyTakeaways[1])\nerr('keyTakeaways', `${LIMITS.keyTakeaways[0]}–${LIMITS.keyTakeaways[1]} items`);\n(Array.isArray(a.keyTakeaways) ? a.keyTakeaways : []).forEach((t, i) => {\nif (!isObj(t) || !isStr(t.text)) return err(`keyTakeaways[${i}]`, '{ text, refs? }');\nfor (const k of Object.keys(t)) if (!['text', 'refs'].includes(k)) err(`keyTakeaways[${i}].${k}`, 'unknown field');\nif (t.refs != null && !(Array.isArray(t.refs) && t.refs.every((x) => isStr(x)))) err(`keyTakeaways[${i}].refs`, 'array of reference ids');\n});\nlet calculators = 0;\nlet ctas = 0;\nlet tables = 0;\nlet gymon = 0;\nlet applySections = 0;\nif (!Array.isArray(a.sections) || a.sections.length < LIMITS.sections[0] || a.sections.length > LIMITS.sections[1])\nerr('sections', `${LIMITS.sections[0]}–${LIMITS.sections[1]} sections`);\n(Array.isArray(a.sections) ? a.sections : []).forEach((s, si) => {\nconst sp = `sections[${si}]`;\nif (!isObj(s)) return err(sp, 'object expected');\nfor (const k of Object.keys(s)) if (!['heading', 'apply', 'blocks'].includes(k)) err(`${sp}.${k}`, 'unknown field');\nif (!isStr(s.heading)) err(`${sp}.heading`, 'required (a claim or question)');\nif (s.apply != null && typeof s.apply !== 'boolean') err(`${sp}.apply`, 'boolean');\nif (s.apply) applySections++;\nif (!Array.isArray(s.blocks) || s.blocks.length === 0) return err(`${sp}.blocks`, 'at least one block');\nlet takeaways = 0;\ns.blocks.forEach((b, bi) => {\nconst p = `${sp}.blocks[${bi}]`;\nif (!isObj(b)) return err(p, 'object expected');\nif (!BLOCK_TYPES.includes(b.type)) return err(`${p}.type`, `unknown block \"${b.type}\" (closed vocabulary: ${BLOCK_TYPES.join(', ')})`);\nconst only = (keys) => {\nfor (const k of Object.keys(b)) if (!['type', ...keys].includes(k)) err(`${p}.${k}`, `unknown field for \"${b.type}\"`);\n};\nconst refList = (v, path) => {\nif (v != null && !(Array.isArray(v) && v.every((x) => isStr(x)))) err(path, 'array of reference ids');\n};\nswitch (b.type) {\ncase 'p':\nonly(['text']);\nif (!isStr(b.text)) err(`${p}.text`, 'required');\nbreak;\ncase 'list':\nonly(['ordered', 'items']);\nif (b.ordered != null && typeof b.ordered !== 'boolean') err(`${p}.ordered`, 'boolean');\nif (!Array.isArray(b.items) || b.items.length < 2 || !b.items.every((x) => isStr(x))) err(`${p}.items`, '2+ strings');\nbreak;\ncase 'takeaway':\nonly(['text']);\nif (++takeaways > 1) err(p, 'at most one takeaway per section');\nif (!isStr(b.text)) err(`${p}.text`, 'required');\nbreak;\ncase 'claim': {\nonly(['evidence', 'refs', 'text']);\nif (!EVIDENCE_LEVELS.includes(b.evidence)) err(`${p}.evidence`, EVIDENCE_LEVELS.join(' | '));\nrefList(b.refs, `${p}.refs`);\nif (!isStr(b.text)) err(`${p}.text`, 'required');\nbreak;\n}\ncase 'callout':\nonly(['kind', 'text']);\nif (!CALLOUT_KINDS.includes(b.kind)) err(`${p}.kind`, CALLOUT_KINDS.join(' | '));\nif (!isStr(b.text)) err(`${p}.text`, 'required');\nbreak;\ncase 'table':\nonly(['caption', 'columns', 'rows', 'refs']);\nif (++tables > LIMITS.tables) err(p, `at most ${LIMITS.tables} tables`);\nif (!isStr(b.caption)) err(`${p}.caption`, 'required');\nif (!Array.isArray(b.columns) || b.columns.length < 2 || b.columns.length > 5 || !b.columns.every((x) => isStr(x))) err(`${p}.columns`, '2–5 strings');\nif (!Array.isArray(b.rows) || !b.rows.length || !b.rows.every((r) => Array.isArray(r) && r.length === (b.columns || []).length))\nerr(`${p}.rows`, 'rows with one cell per column');\nrefList(b.refs, `${p}.refs`);\nbreak;\ncase 'calculator': {\nonly(['calculator', 'defaults']);\nif (++calculators > 1) err(p, 'at most one calculator per article');\nif (!s.apply) err(p, 'the calculator belongs in the \"apply\" section');\nconst reg = CALCULATORS[b.calculator];\nif (!reg) err(`${p}.calculator`, `not in the registry (${Object.keys(CALCULATORS).join(', ')})`);\nelse if (b.defaults != null) {\nif (!isObj(b.defaults)) err(`${p}.defaults`, 'object');\nelse\nfor (const [k, v] of Object.entries(b.defaults)) {\nconst range = reg[k];\nif (!range) err(`${p}.defaults.${k}`, 'unknown parameter');\nelse if (typeof v !== 'number' || v < range.min || v > range.max) err(`${p}.defaults.${k}`, `${range.min}–${range.max}`);\n}\n}\nbreak;\n}\ncase 'cta':\nonly([]);\nif (++ctas > 1) err(p, 'at most one contextual CTA');\nif (!s.apply) err(p, 'the contextual CTA belongs in the \"apply\" section');\nbreak;\ncase 'gymon': {\ngymon++;\nif (!GYMON_KINDS.includes(b.kind)) {\nerr(`${p}.kind`, GYMON_KINDS.join(' | '));\nbreak;\n}\nif (b.kind === 'log-example') {\nonly(['kind', 'caption', 'exercise', 'sessions', 'text']);\nif (!isStr(b.exercise)) err(`${p}.exercise`, 'required');\nif (!isStr(b.caption)) err(`${p}.caption`, 'required');\nif (!Array.isArray(b.sessions) || b.sessions.length < 1 || b.sessions.length > 3) err(`${p}.sessions`, '1–3 sessions');\n(Array.isArray(b.sessions) ? b.sessions : []).forEach((ses, i) => {\nif (!isObj(ses) || !isStr(ses.label) || !Array.isArray(ses.sets) || ses.sets.length < 1 || ses.sets.length > 6)\nreturn err(`${p}.sessions[${i}]`, '{ label, sets: 1–6 }');\nses.sets.forEach((st, j) => {\nconst num = (v) => typeof v === 'number' && v >= 0 && v <= 1000;\nif (!isObj(st) || !num(st.kg) || !num(st.reps) || (st.previous != null && !(isObj(st.previous) && num(st.previous.kg) && num(st.previous.reps))))\nerr(`${p}.sessions[${i}].sets[${j}]`, '{ kg, reps, previous: { kg, reps } | null }');\n});\n});\n} else {\nonly(['kind', 'heading', 'text', 'points']);\nif (!isStr(b.text)) err(`${p}.text`, 'required');\nif (b.points != null && !(Array.isArray(b.points) && b.points.every((x) => isStr(x)))) err(`${p}.points`, 'strings');\n}\nbreak;\n}\n}\n});\n});\nif (gymon !== 1) err('sections', `exactly one Gymon-unique block (\"gymon\") is required, found ${gymon}`);\nif (applySections !== 1) warn('sections', `expected exactly one \"apply\" section, found ${applySections}`);\n(Array.isArray(a.faq) ? a.faq : []).forEach((f, i) => {\nif (!isObj(f) || !isStr(f.q) || !isStr(f.a)) return err(`faq[${i}]`, '{ q, a, refs? }');\nfor (const k of Object.keys(f)) if (!['q', 'a', 'refs'].includes(k)) err(`faq[${i}].${k}`, 'unknown field');\nconst w = wordCount(f.a);\nif (w > 80) warn(`faq[${i}].a`, `${w} words (40–60 expected)`);\n});\nif (a.faq != null && (!Array.isArray(a.faq) || a.faq.length > LIMITS.faq[1])) err('faq', `0–${LIMITS.faq[1]} items`);\nif (a.quiz != null && (!Array.isArray(a.quiz) || a.quiz.length > LIMITS.quiz[1])) err('quiz', `0–${LIMITS.quiz[1]} items`);\n(Array.isArray(a.quiz) ? a.quiz : []).forEach((q, i) => {\nconst p = `quiz[${i}]`;\nif (!isObj(q)) return err(p, 'object');\nfor (const k of Object.keys(q)) if (!['question', 'options', 'correctIndex', 'explanation', 'refs'].includes(k)) err(`${p}.${k}`, 'unknown field');\nif (!isStr(q.question) || !isStr(q.explanation)) err(p, 'question and explanation required');\nif (!Array.isArray(q.options) || q.options.length < LIMITS.quizOptions[0] || q.options.length > LIMITS.quizOptions[1]) err(`${p}.options`, '2–4 options');\nelse if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) err(`${p}.correctIndex`, 'index of the correct option');\n});\nif (!isObj(a.cta) || !CTA_SLOTS.includes(a.cta.slot) || Object.keys(a.cta).some((k) => k !== 'slot'))\nerr('cta', `{ slot: ${CTA_SLOTS.join(' | ')} } — the writer never writes CTA copy`);\nconst units = collectUnits(a);\nconst used = new Set();\nconst internal = [];\nfor (const u of units) {\nfor (const id of u.refs) {\nused.add(id);\nif (!refs.has(id)) err(u.path, `cites unknown reference ${id}`);\n}\nfor (const href of linksIn(u.text)) {\ninternal.push(href);\nif (!INTERNAL_HREF.test(href)) err(u.path, `link \"${href}\" is not an internal blog link (external sources go in references)`);\nelse if ((lang === 'he') !== href.startsWith('/he/')) err(u.path, `link \"${href}\" points to the other language`);\nelse if (ctx.publishedSlugs) {\nconst slug = href.replace(/^\\/(he\\/)?blog\\//, '').replace(/\\/$/, '');\nif (!(ctx.publishedSlugs[lang] || []).includes(slug)) err(u.path, `link \"${href}\" — no published article with that slug`);\n}\n}\nif (RAW_HTML.test(u.text)) err(u.path, 'raw HTML is not allowed');\nif (EXT_MD_LINK.test(u.text)) err(u.path, 'external links are not allowed in text — cite a reference with [[rN]]');\nif (HEADING_MD.test(u.text)) err(u.path, 'Markdown headings are not allowed inside text');\nif (ARTIFACTS.test(u.text)) err(u.path, 'model artifact / placeholder text');\nif (FABRICATED.test(plainText(u.text))) warn(u.path, 'reads like invented first-hand experience — the reviewer must confirm it is true');\nif (lang === 'en' && MEDICAL_EN.test(plainText(u.text))) warn(u.path, 'medical-promise wording (cure/guarantee/prevent/treat)');\nif (lang === 'he' && MEDICAL_HE.test(plainText(u.text))) warn(u.path, 'ניסוח של הבטחה רפואית');\nif (lang === 'he') for (const m of hebrewLint(u.text)) warn(u.path, m);\nif (u.kind === 'text') {\nfor (const s of sentences(u.text)) {\nconst w = s.split(/\\s+/).length;\nif (w > LIMITS.sentenceWords) warn(u.path, `sentence of ${w} words (≤${LIMITS.sentenceWords})`);\n}\n}\nif (u.kind === 'gymon-example' || u.kind === 'heading' || u.kind === 'quiz') continue;\nconst nums = numbersIn(plainText(u.text));\nif (!nums.length) continue;\nif (u.kind === 'gymon') {\nif (typeof ctx.gymonMaterial === 'string') {\nconst hay = normForMatch(ctx.gymonMaterial);\nconst missing = nums.filter((n) => !hay.includes(n));\nif (missing.length) warn(u.path, `number(s) ${missing.join(', ')} are not in the supplied Gymon material`);\n}\ncontinue;\n}\nconst cited = u.refs.map((id) => refs.get(id)).filter(Boolean);\nconst years = new Set(cited.map((r) => String(r.year)));\nconst check = nums.filter((n) => !years.has(n));\nif (!check.length) continue;\nif (!cited.length) {\nwarn(u.path, `number(s) ${check.join(', ')} without a citation`);\ncontinue;\n}\nconst inRead = new Set(cited.filter((r) => r.fullTextRead).flatMap((r) => numbersIn(r.quote)));\nconst inUnread = new Set(cited.filter((r) => !r.fullTextRead).flatMap((r) => numbersIn(r.quote)));\nfor (const n of check) {\nif (inRead.has(n)) continue;\nif (inUnread.has(n) || (cited.length && cited.every((r) => !r.fullTextRead)))\nerr(u.path, `number ${n} is attributed to a source whose full text was not read (fullTextRead: false)`);\nelse warn(u.path, `number ${n} is not in the quote of any cited reference`);\n}\n}\nfor (const id of refs.keys()) if (!used.has(id)) warn('references', `${id} is never cited`);\nif (ctx.publishedSlugs && (ctx.publishedSlugs[lang] || []).length >= LIMITS.internalLinks[0] && internal.length < LIMITS.internalLinks[0])\nwarn('sections', `${internal.length} internal links (${LIMITS.internalLinks[0]}–${LIMITS.internalLinks[1]} expected)`);\n(Array.isArray(a.sections) ? a.sections : []).forEach((s, si) =>\n(isObj(s) && Array.isArray(s.blocks) ? s.blocks : []).forEach((b, bi) => {\nif (!isObj(b) || b.type !== 'claim' || !EVIDENCE_LEVELS.includes(b.evidence)) return;\nconst p = `sections[${si}].blocks[${bi}]`;\nconst cited = [...new Set([...(b.refs || []), ...refsIn(b.text)])].map((id) => refs.get(id)).filter(Boolean);\nif (!cited.length) err(p, 'a claim must cite at least one reference');\nconst strongSource = cited.some((r) => (r.tier === 'PRIMARY' || r.tier === 'AUTHORITY') && r.fullTextRead);\nif ((b.evidence === 'strong' || b.evidence === 'moderate') && !strongSource)\nerr(p, `\"${b.evidence}\" needs a PRIMARY/AUTHORITY reference whose full text was read`);\nif (cited.length && cited.every((r) => r.tier === 'SECONDARY') && !['limited', 'mixed', 'insufficient'].includes(b.evidence))\nerr(p, 'claims resting only on SECONDARY sources are capped at \"limited\"');\nconst words = (CERTAINTY_WORDS[lang] || {})[b.evidence] || [];\nconst t = plainText(b.text).toLowerCase();\nif (words.length && !words.some((w) => t.includes(w.toLowerCase())))\nwarn(p, `\"${b.evidence}\" evidence should be worded with: ${words.join(' / ')}`);\n}),\n);\nconst lastSection = Array.isArray(a.sections) && a.sections.length ? a.sections[a.sections.length - 1] : null;\nconst lastText = lastSection && Array.isArray(lastSection.blocks)\n? [...lastSection.blocks].reverse().map((b) => (isObj(b) ? b.text || (Array.isArray(b.items) ? b.items[b.items.length - 1] : '') : '')).find((t) => isStr(t))\n: null;\nif (lastSection && (!lastText || !/[.!?:)\"”׳]\\s*(\\[\\[[^\\]]+\\]\\])?\\s*$/.test(lastText.trim())))\nerr('sections', 'the article ends mid-sentence (truncated?)');\nconst words = units.reduce((n, u) => n + wordCount(u.text), 0);\nreturn { errors, warnings, stats: { words, readTime: Math.max(1, Math.round(words / (lang === 'he' ? 200 : 230))), refs: refs.size } };\n}\n\n// ---- pipeline helpers (n8n/blog-articles/src/code/pipeline_lib.js) ----\n\nconst cleanUrl = (u) => String(u || '').trim()\n  .replace(/([?&])(?:utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|ref|source|campaign|cmpid|icid|s_cid)=[^&#]*/gi, '$1')\n  .replace(/\\?&+/, '?').replace(/&{2,}/g, '&').replace(/[?&]+(#|$)/, '$1');\n\n/** The model's reply → object. Tolerates a code fence or prose around the JSON; throws a clear error otherwise. */\nfunction parseLooseJson(raw, label) {\n  if (raw && typeof raw === 'object') return raw;\n  const s = String(raw || '').replace(/^\\s*```(?:json)?\\s*/i, '').replace(/\\s*```\\s*$/, '');\n  const a = s.indexOf('{');\n  const b = s.lastIndexOf('}');\n  if (a < 0 || b <= a) throw new Error(`${label}: the model returned no JSON object (truncated at max tokens?). First 200 chars: ${s.slice(0, 200)}`);\n  try {\n    return JSON.parse(s.slice(a, b + 1));\n  } catch (e) {\n    throw new Error(`${label}: invalid JSON (${e.message}). The reply may have been cut off; check finish_reason in the execution.`);\n  }\n}\n\n/** Keys in the canonical order of the article contract; drops anything the writer must not set. */\nfunction canonical(a) {\n  const out = {};\n  for (const k of TOP_LEVEL_KEYS) if (a[k] !== undefined) out[k] = a[k];\n  return out;\n}\n\n/** Writer output minus every field the code owns. */\nfunction writerFields(a) {\n  const out = {};\n  for (const [k, v] of Object.entries(a || {})) if (!CODE_FIELDS.includes(k) && k !== 'references') out[k] = v;\n  return out;\n}\n\n/** The code-owned fields of a new draft. */\nfunction codeFields(plan, lang, today) {\n  return {\n    schemaVersion: SCHEMA_VERSION,\n    lang,\n    slug: plan.slug,\n    pillar: plan.pillar,\n    tags: plan.tags,\n    intent: plan.intent,\n    ymylLevel: 'low',\n    lengthBand: plan.length_band,\n    image: `/blog/${plan.slug}.jpg`,\n    imageAiGenerated: true,\n    createdAt: today,\n    reviewedAt: null,\n    editor: 'osher-alon',\n    aiAssisted: true,\n  };\n}\n\n/** References as the code owns them: cleaned URL, tier from the URL, fullTextRead from the research pack. */\nfunction codeReferences(refs, readUrls) {\n  return (Array.isArray(refs) ? refs : []).map((r) => {\n    const url = cleanUrl(r && r.url);\n    const out = {\n      id: r.id,\n      title: String(r.title || '').trim(),\n      authors: Array.isArray(r.authors) ? r.authors.filter((x) => typeof x === 'string' && x.trim()) : [],\n      year: Number.isInteger(r.year) ? r.year : null,\n      venue: typeof r.venue === 'string' ? r.venue : '',\n      url,\n      tier: tierOfUrl(url),\n      type: r.type,\n      fullTextRead: (readUrls || []).includes(url),\n      quote: String(r.quote || '').trim(),\n    };\n    if (r.doi) out.doi = String(r.doi).trim();\n    if (r.pmid) out.pmid = String(r.pmid).trim();\n    return out;\n  });\n}\n// ===== end of shared code =====\n\nconst OWNER = 'OsherAlon';\nconst REPO = 'gymon-site';\nconst BRANCH = 'blog/incoming';\nconst BASE_BRANCH = 'main'; // only used if blog/incoming does not exist yet\n\nconst a = $('Get article (approve)').first().json;\nconst date = $now.setZone('Asia/Jerusalem').toFormat('yyyy-MM-dd');\nconst slug = String(a.slug || '').toLowerCase();\nif (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid slug: ${a.slug}`);\n\nconst file = (lang) => {\n  const art = JSON.parse(a['article_' + lang] || 'null');\n  if (!art) throw new Error(`Article ${lang} missing on row ${a.article_id} (rows from before the doctrine rebuild cannot be approved)`);\n  const out = canonical({\n    ...art,\n    schemaVersion: SCHEMA_VERSION,\n    lang,\n    slug,\n    image: `/blog/${slug}.jpg`,\n    imageAlt: a['image_alt_' + lang] || art.imageAlt,\n    imageAiGenerated: true,\n    createdAt: date,          // the approval date (Asia/Jerusalem)\n    reviewedAt: date,         // the human review recorded on Approve\n    editor: 'osher-alon',\n    aiAssisted: true,\n  });\n  delete out.updatedAt;       // set only on a substantive post-publication change, never here\n  delete out.sample;\n  const { errors } = validateArticle(out, { mode: 'build' });\n  if (errors.length) throw new Error(`${lang} would fail the site build:\\n` + errors.map((e) => `${e.path}: ${e.message}`).join('\\n'));\n  return JSON.stringify(out, null, 2) + '\\n';\n};\n\nreturn [{ json: {\n  article_id: a.article_id,\n  slug,\n  owner: OWNER,\n  repo: REPO,\n  branch: BRANCH,\n  base_branch: BASE_BRANCH,\n  api: `https://api.github.com/repos/${OWNER}/${REPO}`,\n  image_url: a.image_url,\n  path_en: `src/content/articles/en/${slug}.json`,\n  path_he: `src/content/articles/he/${slug}.json`,\n  path_image: `public/blog/${slug}.jpg`,\n  md_en: file('en'),\n  md_he: file('he'),\n  published_date: date,\n  commit_message: `blog: add \"${String(a.title_en || slug).replace(/\"/g, \"'\")}\" (${slug}, en+he)\\n\\nApproved in the Gymon Blog review page (n8n), round ${a.round}; reviewed by Osher Alon on ${date}.\\nReview checklist (all confirmed): ${JSON.stringify(($('Approve request').first().json.body || {}).checklist || [])}`,\n} }];\n" } },
  output: [{ article_id: 1, slug: 'rest-between-sets', api: 'https://api.github.com/repos/OsherAlon/gymon-site', branch: 'blog/incoming', base_branch: 'main', image_url: 'https://res.cloudinary.com/…', path_en: 'src/content/blog/en/rest-between-sets.md', path_he: 'src/content/blog/he/rest-between-sets.md', path_image: 'public/blog/rest-between-sets.jpg', md_en: '---', md_he: '---', commit_message: 'blog: add …' }],
});

const downloadImage = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Download 16:9 JPEG',
    parameters: { method: 'GET', url: expr('{{ $json.image_url }}'), options: { response: { response: { responseFormat: 'file' } } } },
  },
  output: [{}],
});

const imageToBase64 = node({
  type: 'n8n-nodes-base.extractFromFile',
  version: 1.1,
  config: { name: 'Image to base64', parameters: { operation: 'binaryToPropery', destinationKey: 'image_b64' } },
  output: [{ image_b64: 'iVBORw0…' }],
});

const getBranch = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Get branch ref',
    parameters: {
      method: 'GET',
      url: expr("{{ $('Build commit files').item.json.api }}/git/ref/heads/{{ $('Build commit files').item.json.branch }}"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'githubApi',
      sendHeaders: true,
      headerParameters: GH_HEADERS,
      options: { response: { response: { neverError: true } } },
    },
    credentials: CRED_GITHUB,
  },
  output: [{ ref: 'refs/heads/blog/incoming', object: { sha: 'abc123' } }],
});

const branchExists = ifElse({
  version: 2.2,
  config: {
    name: 'Branch exists?',
    parameters: {
      conditions: {
        options: IF_OPTS,
        conditions: [{ leftValue: expr('{{ !!($json.object && $json.object.sha) }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const getBaseRef = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Get base branch ref',
    parameters: {
      method: 'GET',
      url: expr("{{ $('Build commit files').item.json.api }}/git/ref/heads/{{ $('Build commit files').item.json.base_branch }}"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'githubApi',
      sendHeaders: true,
      headerParameters: GH_HEADERS,
      options: {},
    },
    credentials: CRED_GITHUB,
  },
  output: [{ ref: 'refs/heads/main', object: { sha: 'abc123' } }],
});

const createBranch = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Create branch',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Build commit files').item.json.api }}/git/refs"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'githubApi',
      sendHeaders: true,
      headerParameters: GH_HEADERS,
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ ref: 'refs/heads/' + $('Build commit files').item.json.branch, sha: $json.object.sha }) }}"),
      options: {},
    },
    credentials: CRED_GITHUB,
  },
  output: [{ ref: 'refs/heads/blog/incoming', object: { sha: 'abc123' } }],
});

const parentCommit = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Parent commit',
    parameters: { mode: 'manual', assignments: { assignments: [{ id: 'pc1', name: 'parent_sha', value: expr('{{ $json.object.sha }}'), type: 'string' }] }, options: {} },
  },
  output: [{ parent_sha: 'abc123' }],
});

const getParentCommit = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Get parent commit',
    parameters: {
      method: 'GET',
      url: expr("{{ $('Build commit files').item.json.api }}/git/commits/{{ $json.parent_sha }}"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'githubApi',
      sendHeaders: true,
      headerParameters: GH_HEADERS,
      options: {},
    },
    credentials: CRED_GITHUB,
  },
  output: [{ sha: 'abc123', tree: { sha: 'tree123' } }],
});

const createImageBlob = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Create image blob',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Build commit files').item.json.api }}/git/blobs"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'githubApi',
      sendHeaders: true,
      headerParameters: GH_HEADERS,
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ content: $('Image to base64').item.json.image_b64, encoding: 'base64' }) }}"),
      options: {},
    },
    credentials: CRED_GITHUB,
  },
  output: [{ sha: 'blob123' }],
});

const createTree = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Create tree',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Build commit files').item.json.api }}/git/trees"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'githubApi',
      sendHeaders: true,
      headerParameters: GH_HEADERS,
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ base_tree: $('Get parent commit').item.json.tree.sha, tree: [{ path: $('Build commit files').item.json.path_en, mode: '100644', type: 'blob', content: $('Build commit files').item.json.md_en }, { path: $('Build commit files').item.json.path_he, mode: '100644', type: 'blob', content: $('Build commit files').item.json.md_he }, { path: $('Build commit files').item.json.path_image, mode: '100644', type: 'blob', sha: $json.sha } ] }) }}"),
      options: {},
    },
    credentials: CRED_GITHUB,
  },
  output: [{ sha: 'tree456' }],
});

const createCommit = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Create commit',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Build commit files').item.json.api }}/git/commits"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'githubApi',
      sendHeaders: true,
      headerParameters: GH_HEADERS,
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ message: $('Build commit files').item.json.commit_message, tree: $json.sha, parents: [$('Parent commit').item.json.parent_sha] }) }}"),
      options: {},
    },
    credentials: CRED_GITHUB,
  },
  output: [{ sha: 'commit789', html_url: 'https://github.com/OsherAlon/gymon-site/commit/commit789' }],
});

const updateBranch = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Move branch to commit',
    parameters: {
      method: 'PATCH',
      url: expr("{{ $('Build commit files').item.json.api }}/git/refs/heads/{{ $('Build commit files').item.json.branch }}"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'githubApi',
      sendHeaders: true,
      headerParameters: GH_HEADERS,
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ sha: $json.sha, force: false }) }}'),
      options: {},
    },
    credentials: CRED_GITHUB,
  },
  output: [{ ref: 'refs/heads/blog/incoming', object: { sha: 'commit789' } }],
});

const markCommitted = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Mark committed',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: T_ARTICLES, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'article_id', condition: 'eq', keyValue: expr("{{ $('Build commit files').item.json.article_id }}") }] },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          status: 'committed',
          commit_sha: expr("{{ $('Create commit').item.json.sha }}"),
          commit_url: expr("{{ $('Create commit').item.json.html_url }}"),
        },
        matchingColumns: [],
        schema: [
          { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'commit_sha', displayName: 'commit_sha', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'commit_url', displayName: 'commit_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
        ],
      },
      options: {},
    },
  },
  output: [{ id: 1, status: 'committed' }],
});

const committedEmail = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Send committed email',
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: REVIEW_EMAIL,
      subject: expr("[Gymon blog] Committed to blog/incoming: {{ $('Get article (approve)').item.json.title_en }}"),
      emailType: 'html',
      message: expr("<div style=\"font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px\"><h2 style=\"margin:0 0 8px\">Committed to <code>blog/incoming</code></h2><p><b>{{ $('Get article (approve)').item.json.title_en }}</b><br>{{ $('Get article (approve)').item.json.title_he }}</p><p>Commit: <a href=\"{{ $('Create commit').item.json.html_url }}\">{{ $('Create commit').item.json.sha }}</a></p><ul><li><code>{{ $('Build commit files').item.json.path_en }}</code></li><li><code>{{ $('Build commit files').item.json.path_he }}</code></li><li><code>{{ $('Build commit files').item.json.path_image }}</code></li></ul><p style=\"color:#555\">Nothing is live yet. To publish: merge <code>blog/incoming</code> into the site's main branch, then <code>npm run build</code> (the build validates both files again) and push as usual.</p></div>"),
      options: { appendAttribution: false, senderName: 'Gymon Blog' },
    },
    credentials: CRED_GMAIL,
  },
  output: [{ id: 'msg-2' }],
});

const fixRequest = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: { name: 'Fix request', parameters: { httpMethod: 'POST', path: 'gymon-blog/fix', responseMode: 'responseNode', options: {} } },
  output: [{ body: { id: 1, t: 'abc', feedback: 'Shorter intro' } }],
});

const getArticleFix = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get article (fix)',
    alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'get', dataTableId: T_ARTICLES, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'article_id', condition: 'eq', keyValue: expr("{{ String($json.body?.id || '') }}") }] },
      limit: 1,
    },
  },
  output: [{ article_id: '261004090000-rest-between-sets', review_token: 'abc', status: 'pending_review', round: 1, slug: 'rest-between-sets' }],
});

const canFix = ifElse({
  version: 2.2,
  config: {
    name: 'Valid fix request?',
    parameters: {
      conditions: {
        options: IF_OPTS,
        conditions: [{ leftValue: expr("{{ !!$json.article_id && !!$json.review_token && $json.review_token === $('Fix request').item.json.body?.t && $json.status === 'pending_review' && String($('Fix request').item.json.body?.feedback || '').trim().length >= 3 }}"), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const rejectFix = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Reject fix request',
    parameters: { respondWith: 'json', responseBody: expr("{{ JSON.stringify({ ok: false, error: !$json.article_id ? 'Article not found.' : ($json.status !== 'pending_review' ? 'This article is ' + $json.status + ' — no action available.' : 'Not accepted: invalid or expired link, an empty note, blocking errors still open, or an incomplete review checklist.') }) }}"), options: { responseCode: 409 } },
  },
});

const respondFix = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Confirm fix request',
    parameters: { respondWith: 'json', responseBody: expr("{{ JSON.stringify({ ok: true, status: 'revising', message: 'Received. Revising now — a new email will arrive in a few minutes.' }) }}"), options: {} },
  },
});

const routerModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Haiku — router', parameters: { model: MODEL_FAST, options: { temperature: 0 } }, credentials: CRED_OPENROUTER },
});

const routeFix = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Route: what to redo',
    parameters: {
      promptType: 'define',
      text: expr("Note:\n{{ $('Fix request').item.json.body.feedback }}"),
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: "You route a reviewer's correction note on a bilingual (English + Hebrew) blog article that has a hero image.\n\nReply with exactly one lowercase word and nothing else:\ntext — the note is about wording, content, facts, structure, length, tone, the title, the description, or either language.\nimage — the note is only about the picture.\nboth — the note changes the subject or angle so the picture must change too, or it explicitly asks for changes to both.\n\nExamples:\n\"the intro is too long\" -> text\n\"הכותרת בעברית נשמעת מתורגמת\" -> text\n\"add a section about beginners\" -> text\n\"replace the image, it's too bright\" -> image\n\"התמונה לא קשורה לנושא\" -> image\n\"make it about deload weeks instead, and change the photo\" -> both\n" }] },
    },
    subnodes: { model: routerModel },
  },
  output: [{ text: 'text' }],
});

const routeSet = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Route',
    parameters: { mode: 'manual', assignments: { assignments: [{ id: 'r1', name: 'route', value: expr("{{ (String($json.text || '').toLowerCase().match(/both|image|text/) || ['text'])[0] }}"), type: 'string' }] }, options: {} },
  },
  output: [{ route: 'text' }],
});

const saveVersion = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Save previous version',
    parameters: {
      resource: 'row',
      operation: 'insert',
      dataTableId: T_VERSIONS,
      columns: {
        mappingMode: 'defineBelow',
        value: { article_id: expr("{{ $('Get article (fix)').first().json.article_id }}"), slug: expr("{{ $('Get article (fix)').first().json.slug }}"), round: expr("{{ $('Get article (fix)').first().json.round }}"), feedback: expr("{{ $('Fix request').first().json.body.feedback }}"), route: expr("{{ $('Route').first().json.route }}"), title_en: expr("{{ $('Get article (fix)').first().json.title_en }}"), description_en: expr("{{ $('Get article (fix)').first().json.description_en }}"), body_en: expr("{{ $('Get article (fix)').first().json.body_en || '' }}"), title_he: expr("{{ $('Get article (fix)').first().json.title_he }}"), description_he: expr("{{ $('Get article (fix)').first().json.description_he }}"), body_he: expr("{{ $('Get article (fix)').first().json.body_he || '' }}"), image_url: expr("{{ $('Get article (fix)').first().json.image_url }}"), article_en: expr("{{ $('Get article (fix)').first().json.article_en }}"), article_he: expr("{{ $('Get article (fix)').first().json.article_he }}") },
        matchingColumns: [],
        schema: [{ id: "article_id", displayName: "article_id", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "slug", displayName: "slug", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "round", displayName: "round", required: false, defaultMatch: false, display: true, type: "number", canBeUsedToMatch: true }, { id: "feedback", displayName: "feedback", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "route", displayName: "route", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "title_en", displayName: "title_en", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "description_en", displayName: "description_en", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "body_en", displayName: "body_en", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "title_he", displayName: "title_he", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "description_he", displayName: "description_he", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "body_he", displayName: "body_he", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "image_url", displayName: "image_url", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "article_en", displayName: "article_en", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "article_he", displayName: "article_he", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }],
      },
      options: {},
    },
  },
  output: [{ id: 1 }],
});

const markRevising = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Mark revising',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: T_ARTICLES, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'article_id', condition: 'eq', keyValue: expr("{{ $('Get article (fix)').first().json.article_id }}") }] },
      columns: {
        mappingMode: 'defineBelow',
        value: { status: 'revising', last_feedback: expr("{{ $('Fix request').first().json.body.feedback }}") },
        matchingColumns: [],
        schema: [
          { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'last_feedback', displayName: 'last_feedback', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
        ],
      },
      options: {},
    },
  },
  output: [{ id: 1, status: 'revising' }],
});

const needsRewrite = ifElse({
  version: 2.2,
  config: {
    name: 'Rewrite text?',
    parameters: {
      conditions: {
        options: IF_OPTS,
        conditions: [{ leftValue: expr("{{ $('Route').first().json.route !== 'image' }}"), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const rewriteRequest = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Rewrite request',
    parameters: { mode: 'manual', assignments: { assignments: [
      { id: 'rrs', name: 'system', value: "You revise a bilingual Gymon blog article (English + Hebrew JSON) according to the reviewer's note and the automatic flags you are given. Return one JSON object {\"article_en\": {...}, \"article_he\": {...}}, no prose, no code fence. Each article keeps exactly the shape of the JSON you receive (same field names, same block types: p, list, takeaway, claim, callout, table, calculator, cta, gymon) and has NO \"references\" field: the reference registry is fixed and shown to you; cite it only with the existing [[rN]] ids.\n\nRules\n- Change what the note asks for, fix the listed errors, and keep everything else as it is. Keep the two languages consistent (same facts, numbers, markers and block order).\n- Never invent a source, number, study, quote or experience. If the note asks for a claim the registry does not support, leave it out. Every number must appear in the quote of a reference cited in the same item (log-example numbers are illustrative and exempt).\n- Keep exactly one \"gymon\" block. Every section object keeps the boolean field \"apply\": exactly one section has \"apply\": true and holds the single {\"type\":\"cta\"} (and the calculator, if any); all others have \"apply\": false.\n- Hebrew: gender-neutral throughout (impersonal, infinitive, plural forms — never gendered singular, never slash forms); ranges \"8 עד 12\", never an en dash; \"3 סטים של 10\", never \"3×10\"; natural Israeli Hebrew, not a calque; \"סקוואט\" never \"כפיפות ברכיים\".\n- Titles ≤ 52 characters; descriptions EN 120–155 / HE 100–145 characters; heroTitle 2–4 words.\n- The note may be in Hebrew or English; it applies to both languages unless it names one.\n\nGYMON MATERIAL (the only facts about Gymon the gymon block may state):\n\n\nGYMON MATERIAL — the only facts about Gymon an article may state. Every article carries exactly one \"gymon\" block built from ONE of the three parts below. Never invent app data, user numbers, user quotes or experiences. Sources are noted in brackets for the reviewer (files in the gymon app repo or research folder); do not put them in the article.\n\nA. THE LOGGING TABLE (kind \"log-example\") [app/src/lib/loggerData.ts, personalRecords.ts, repRange.ts]\n- Gymon's logger shows each set as one row: SET | PREVIOUS | KG | REPS | ✓.\n- PREVIOUS shows, in grey, the weight and reps of the same set in the last finished session of the SAME workout (not the exercise's last outing in some other workout).\n- Only working sets count: warm-up and cool-down sets are not used for PREVIOUS or for records.\n- A personal record in Gymon: the heaviest weight wins; on equal weight, more reps win; a tie is not a record; a first-ever session cannot set a record; timed exercises have no weight/reps record.\n- Rep targets are shown as a range (for example 8 to 12), not a single number.\n- A log-example uses ILLUSTRATIVE numbers that you choose for the example. The page labels them \"illustrative, not user data\". Keep them realistic and consistent: small weight steps (1 to 2.5 kg), reps that fall slightly as weight rises, PREVIOUS equal to the earlier session's numbers.\n\nB. THE PLAN BUILDER (kind \"plan-logic\") [app/src/lib/planBuilder.ts, programRotation.ts]\n- The plan is built in four steps: filter exercises by where the person trains, pick a split from the number of training days, choose exercises for each day, then set sets, reps and rest from the goal and experience level.\n- Split by days per week: 1 day full body; 2 days full body A and B; 3 days full body A, B and C; 4 days upper and lower twice; 5 days push, pull, legs, upper, lower; 6 days push, pull and legs twice. Legs appear in every split.\n- Main lifts by goal: strength 4 to 6 reps, 4 sets, 180 seconds rest; muscle 8 to 12 reps, 3 sets, 90 seconds rest. Accessory exercises: strength 8 to 12 reps; muscle 10 to 15 reps.\n- Sets per exercise stay between 2 and 4: main lifts 3 to 4, isolation exercises 2 to 3. When a muscle needs more work in a session, the plan adds an exercise rather than stacking sets on one.\n- Session length decides how many exercises fit: a 60-minute session holds about 20 to 23 working sets, a 45-minute session about 15 to 17.\n- Gender does not change the prescription: it is a decision, because nothing in the evidence used supports a different rule.\n- \"Toning\" gets the same resistance work as building muscle; it is not a light-weights, high-reps protocol.\n- When possible, a session holds only one exercise that loads the hip hinge (for example a deadlift), so the lower back is not loaded twice.\n- The program-refresh check estimates each session's best set with the Epley formula (weight × (1 + reps ÷ 30)). It asks about swapping an exercise only when that lift's best estimate has not improved by at least 1% across 4 sessions of it and the best is at least 3 weeks old, and never before 6 weeks on the plan. It only asks; it never swaps an exercise by itself.\n\nC. GYMON'S REVIEW OF WORKOUT APPS (kind \"teardown-finding\") [departments/research/competitor_analysis, 2026]\n- Gymon mapped the onboarding and logging screens of 8 workout apps, 402 screens in total.\n- Strong and Hevy, built separately, arrived at the same set table: SET | PREVIOUS | KG | REPS | ✓.\n- Of the 7 apps reviewed for language support, only one (FitBuddy, an Israeli app) offered Hebrew with a right-to-left layout.\n- Hevy labels set types (warm-up, failure, drop set) and tracks 4 kinds of record: heaviest weight, best 1RM, best set volume and best session volume.\n- In 281 negative app-store reviews of Strong, Fitbod and Hevy, the most common complaint (119 reviews, 42%) was about pricing and paywalls imposed after people had already invested time and data.\n- When naming competitor apps, state only these findings; no rankings, no prices, no \"better than\" claims.\n", type: 'string' },
      { id: 'rru', name: 'user', value: expr("Reviewer note:\n{{ $('Fix request').first().json.body.feedback }}\n\nAutomatic errors still open (fix them too):\n{{ (() => { try { const v = JSON.parse($('Get article (fix)').first().json.validation || '{}'); return [].concat(((v.en || {}).errors || []).map(e => 'EN ' + e.path + ': ' + e.message), ((v.he || {}).errors || []).map(e => 'HE ' + e.path + ': ' + e.message), (v.cross || []).map(e => e.path + ': ' + e.message)).join('\\n') || '(none)'; } catch (e) { return '(none)'; } })() }}\n\nREFERENCE REGISTRY (fixed; cite with these ids only):\n{{ (JSON.parse($('Get article (fix)').first().json.article_en || '{}').references || []).map(r => r.id + ' [' + r.tier + (r.fullTextRead ? '' : ', snippet only') + '] ' + r.title + ' — quote: \"' + r.quote + '\"').join('\\n') }}\n\nCURRENT article_en (JSON, references omitted):\n{{ JSON.stringify(Object.assign({}, JSON.parse($('Get article (fix)').first().json.article_en || '{}'), { references: undefined })) }}\n\nCURRENT article_he (JSON, references omitted):\n{{ JSON.stringify(Object.assign({}, JSON.parse($('Get article (fix)').first().json.article_he || '{}'), { references: undefined })) }}"), type: 'string' },
    ] }, options: {} },
  },
  output: [{ system: '…', user: '…' }],
});

const rewriteArticle = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Rewrite article',
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 5000,
    parameters: {
      method: 'POST',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openRouterApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ model: 'anthropic/claude-sonnet-5.5', max_tokens: 48000, temperature: 0.4, reasoning: { effort: 'low' }, messages: [{ role: 'system', content: $json.system }, { role: 'user', content: $json.user }] }) }}"),
      options: { timeout: 600000 },
    },
    credentials: CRED_OPENROUTER,
  },
  output: [{ choices: [{ finish_reason: 'stop', message: { content: '{"article_en":{},"article_he":{}}' } }], usage: { prompt_tokens: 20000, completion_tokens: 20000 } }],
});

const prepareFix = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Prepare (fix)', parameters: { mode: 'runOnceForAllItems', jsCode: "// Prepare (fix) — the stored or rewritten article pair, re-attached to the FIXED reference\n// registry and code fields, for the same validation chain a new article goes through.\n// ===== article constants (site src/lib/article/schema.mjs) + pipeline helpers — generated by build.py =====\n// ---- schema.mjs (generated from the site repo; edit there) ----\nconst SCHEMA_VERSION = 1;\nconst LANGS = ['en', 'he'];\nconst PILLARS = ['progressive-overload', 'sets-reps-volume', 'plans-splits', 'home-gym', 'tools'];\nconst INTENTS = ['know', 'do'];\nconst YMYL_LEVELS = ['low'];\nconst LENGTH_BANDS = ['600-900', '900-1400', '1400-1800'];\nconst EVIDENCE_LEVELS = ['strong', 'moderate', 'limited', 'mixed', 'insufficient'];\nconst CERTAINTY_WORDS = {\nen: {\nstrong: ['results in', 'reliably', 'consistently'],\nmoderate: ['probably', 'likely'],\nlimited: ['may', 'might', 'could'],\nmixed: ['mixed', 'unclear', 'uncertain', 'inconsistent'],\ninsufficient: ['uncertain', 'not enough', 'unknown', 'too little'],\n},\nhe: {\nstrong: ['מביא ל', 'מביאה ל', 'באופן עקבי', 'בעקביות'],\nmoderate: ['כנראה', 'ככל הנראה', 'סביר'],\nlimited: ['ייתכן', 'עשוי', 'עשויה', 'עשויים', 'אולי'],\nmixed: ['אינן חד-משמעיות', 'לא חד-משמעיות', 'סותרות', 'מעורבות'],\ninsufficient: ['אין מספיק', 'לא ידוע', 'לא ברור'],\n},\n};\nconst REF_TIERS = ['PRIMARY', 'AUTHORITY', 'SECONDARY'];\nconst REF_TYPES = [\n'meta-analysis',\n'systematic-review',\n'rct',\n'cohort',\n'cross-sectional',\n'review',\n'position-stand',\n'guideline',\n'other',\n];\nconst CALLOUT_KINDS = ['note', 'myth', 'safety'];\nconst CTA_SLOTS = ['log-sets', 'track-progress', 'plan-builder'];\nconst GYMON_KINDS = ['log-example', 'plan-logic', 'teardown-finding'];\nconst CALCULATORS = {\n'one-rep-max': {\nweightKg: { min: 1, max: 500, default: 80 },\nreps: { min: 1, max: 12, default: 5 },\n},\n};\nconst BLOCK_TYPES = ['p', 'list', 'takeaway', 'claim', 'callout', 'table', 'calculator', 'cta', 'gymon'];\nconst LIMITS = {\ntitle: { min: 20, max: 52, hardMax: 70 },\nheroTitleWords: { min: 1, max: 4 },\ndescription: { en: [120, 155], he: [100, 145] },\ntags: [2, 4],\nkeyTakeaways: [3, 5],\nsections: [4, 7],\nfaq: [0, 5],\nquiz: [0, 3],\nquizOptions: [2, 4],\ntables: 3,\nreferences: [1, 20],\ntldrSentences: 3,\nsentenceWords: 25,\ninternalLinks: [2, 4],\n};\nconst COMMERCIAL_HOST = /(amazon\\.|ebay\\.|walmart\\.|iherb\\.|bodybuilding\\.com|myprotein|gnc\\.com|kidneystronger\\.com|mtntactical\\.com|\\/\\/(shop|store)\\.)/i;\nconst TRACKING_PARAM = /[?&](utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|cmpid|icid|s_cid)=/i;\nconst PRIMARY_HOST = /(pubmed\\.ncbi\\.nlm\\.nih\\.gov|pmc\\.ncbi\\.nlm\\.nih\\.gov|ncbi\\.nlm\\.nih\\.gov\\/pmc|doi\\.org|bjsm\\.bmj\\.com|bmj\\.com|link\\.springer\\.com|springeropen\\.com|biomedcentral\\.com|frontiersin\\.org|journals\\.lww\\.com|journals\\.physiology\\.org|tandfonline\\.com|jissn|sciencedirect\\.com|onlinelibrary\\.wiley\\.com|mdpi\\.com|nature\\.com|cochranelibrary\\.com|journals\\.plos\\.org|jamanetwork\\.com|thelancet\\.com|academic\\.oup\\.com|journals\\.sagepub\\.com|humankinetics\\.com|biolsport\\.com|termedia\\.pl)/i;\nconst AUTHORITY_HOST = /(acsm\\.org|nsca\\.com|sportsnutritionsociety\\.org|\\.gov(\\/|$|\\.)|nih\\.gov|who\\.int|nhs\\.uk|\\.edu(\\/|$)|\\.ac\\.[a-z]{2}(\\/|$)|ausport\\.gov\\.au)/i;\nconst tierOfUrl = (u) => (PRIMARY_HOST.test(u) ? 'PRIMARY' : AUTHORITY_HOST.test(u) ? 'AUTHORITY' : 'SECONDARY');\nconst YMYL_TOPIC = new RegExp(\n[\n'supplement', 'creatine', 'protein powder', 'whey', 'caffeine', 'pre-?workout', 'vitamin', 'steroid',\n'weight[- ]?loss', 'fat[- ]?loss', 'lose weight', 'diet', 'calori', 'bmi\\\\b', 'keto', 'fasting',\n'injur', 'pain', 'rehab', 'physio', 'tendin', 'surgery',\n'pregnan', 'postpartum', 'menopaus', 'menstrua',\n'diabet', 'hypertens', 'blood pressure', 'cancer', 'osteopor', 'arthritis', 'disease', 'medical', 'medication', 'drug',\n'eating disorder',\n'תוסף', 'תוספי', 'קריאטין', 'אבקת חלבון', 'ירידה במשקל', 'הרזיה', 'דיאטה', 'קלורי', 'פציע', 'כאב', 'שיקום',\n'הריון', 'היריון', 'לידה', 'גיל המעבר', 'סוכרת', 'לחץ דם', 'מחלה', 'תרופ',\n].join('|'),\n'i',\n);\nconst HE_GENDERED_WORDS = [\n'אתה', 'תוכל', 'תוכלי', 'תרצה', 'תרצי', 'תצטרך', 'תצטרכי', 'תרגיש', 'תרגישי', 'תראה', 'תראי',\n'נסה', 'נסי', 'הזן', 'הזיני', 'קח', 'קחי', 'תן', 'תני', 'שים', 'שימי', 'זכור', 'זכרי',\n'בצע', 'בצעי', 'הקפד', 'הקפידי', 'הוסף', 'הוסיפי', 'רשום', 'רשמי', 'התחל', 'התחילי',\n'בחר', 'בחרי', 'הרם', 'הרימי', 'הורד', 'הורידי', 'המשך', 'המשיכי', 'עצור', 'עצרי',\n'המתאמן', 'המתאמנת',\n];\nconst CODE_FIELDS = [\n'schemaVersion', 'lang', 'slug', 'pillar', 'tags', 'intent', 'ymylLevel', 'lengthBand', 'image',\n'imageAiGenerated', 'createdAt', 'updatedAt', 'reviewedAt', 'editor', 'aiAssisted', 'sample',\n];\nconst TOP_LEVEL_KEYS = [\n...CODE_FIELDS,\n'title', 'heroTitle', 'description', 'primaryQuery', 'imageAlt',\n'tldr', 'keyTakeaways', 'sections', 'faq', 'quiz', 'references', 'cta',\n];\n\n// ---- pipeline helpers (n8n/blog-articles/src/code/pipeline_lib.js) ----\n\nconst cleanUrl = (u) => String(u || '').trim()\n  .replace(/([?&])(?:utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|ref|source|campaign|cmpid|icid|s_cid)=[^&#]*/gi, '$1')\n  .replace(/\\?&+/, '?').replace(/&{2,}/g, '&').replace(/[?&]+(#|$)/, '$1');\n\n/** The model's reply → object. Tolerates a code fence or prose around the JSON; throws a clear error otherwise. */\nfunction parseLooseJson(raw, label) {\n  if (raw && typeof raw === 'object') return raw;\n  const s = String(raw || '').replace(/^\\s*```(?:json)?\\s*/i, '').replace(/\\s*```\\s*$/, '');\n  const a = s.indexOf('{');\n  const b = s.lastIndexOf('}');\n  if (a < 0 || b <= a) throw new Error(`${label}: the model returned no JSON object (truncated at max tokens?). First 200 chars: ${s.slice(0, 200)}`);\n  try {\n    return JSON.parse(s.slice(a, b + 1));\n  } catch (e) {\n    throw new Error(`${label}: invalid JSON (${e.message}). The reply may have been cut off; check finish_reason in the execution.`);\n  }\n}\n\n/** Keys in the canonical order of the article contract; drops anything the writer must not set. */\nfunction canonical(a) {\n  const out = {};\n  for (const k of TOP_LEVEL_KEYS) if (a[k] !== undefined) out[k] = a[k];\n  return out;\n}\n\n/** Writer output minus every field the code owns. */\nfunction writerFields(a) {\n  const out = {};\n  for (const [k, v] of Object.entries(a || {})) if (!CODE_FIELDS.includes(k) && k !== 'references') out[k] = v;\n  return out;\n}\n\n/** The code-owned fields of a new draft. */\nfunction codeFields(plan, lang, today) {\n  return {\n    schemaVersion: SCHEMA_VERSION,\n    lang,\n    slug: plan.slug,\n    pillar: plan.pillar,\n    tags: plan.tags,\n    intent: plan.intent,\n    ymylLevel: 'low',\n    lengthBand: plan.length_band,\n    image: `/blog/${plan.slug}.jpg`,\n    imageAiGenerated: true,\n    createdAt: today,\n    reviewedAt: null,\n    editor: 'osher-alon',\n    aiAssisted: true,\n  };\n}\n\n/** References as the code owns them: cleaned URL, tier from the URL, fullTextRead from the research pack. */\nfunction codeReferences(refs, readUrls) {\n  return (Array.isArray(refs) ? refs : []).map((r) => {\n    const url = cleanUrl(r && r.url);\n    const out = {\n      id: r.id,\n      title: String(r.title || '').trim(),\n      authors: Array.isArray(r.authors) ? r.authors.filter((x) => typeof x === 'string' && x.trim()) : [],\n      year: Number.isInteger(r.year) ? r.year : null,\n      venue: typeof r.venue === 'string' ? r.venue : '',\n      url,\n      tier: tierOfUrl(url),\n      type: r.type,\n      fullTextRead: (readUrls || []).includes(url),\n      quote: String(r.quote || '').trim(),\n    };\n    if (r.doi) out.doi = String(r.doi).trim();\n    if (r.pmid) out.pmid = String(r.pmid).trim();\n    return out;\n  });\n}\n// ===== end of shared code =====\n\n// ---- llmText + apply flags (n8n/blog-articles/src/code/llm_text.js): only the nodes that read a Sonnet reply ----\n\n/**\n * The text of an OpenRouter chat completion (HTTP node) or of a chain node ({ text }).\n * A reply cut off at max_tokens is an error here, with the token usage, because hidden\n * reasoning is billed as completion and can eat the whole budget (execution 1539).\n */\nfunction llmText(j, label) {\n  if (j && typeof j.text === 'string') return j.text;\n  const c = j && Array.isArray(j.choices) ? j.choices[0] : null;\n  if (!c) throw new Error(`${label}: no completion in the response: ${JSON.stringify(j || {}).slice(0, 300)}`);\n  if (c.finish_reason === 'length') {\n    throw new Error(`${label}: cut off at max_tokens (finish_reason: length, usage: ${JSON.stringify(j.usage || {})}). Raise max_tokens or lower the reasoning effort.`);\n  }\n  const m = c.message || {};\n  return typeof m.content === 'string' ? m.content : (Array.isArray(m.content) ? m.content.map((x) => x.text || '').join('') : '');\n}\n\n/**\n * The \"apply\" flag is structure, not language: Hebrew takes it from the English section at the\n * same index (the validator already requires the same sections in both). Execution 1541: the\n * writer put the protocol under an \"Apply it:\" heading but never set the field.\n */\nfunction syncApply(en, he) {\n  const es = (en && en.sections) || [];\n  ((he && he.sections) || []).forEach((s, i) => { if (es[i]) s.apply = es[i].apply === true; });\n  return he;\n}\n\n/** When the writer marked no section, the one section holding the cta block is the apply section. */\nfunction markApplyFromCta(a) {\n  const secs = (a && a.sections) || [];\n  if (secs.some((s) => s.apply === true)) return a;\n  const withCta = secs.filter((s) => (s.blocks || []).some((b) => b && b.type === 'cta'));\n  if (withCta.length === 1) secs.forEach((s) => { s.apply = s === withCta[0]; });\n  return a;\n}\n\nconst row = $('Get article (fix)').first().json;\nconst stored_en = JSON.parse(row.article_en || '{}');\nconst stored_he = JSON.parse(row.article_he || '{}');\nlet en = writerFields(stored_en);\nlet he = writerFields(stored_he);\nif ($('Rewrite article').isExecuted) {\n  const r = parseLooseJson(llmText($('Rewrite article').first().json, 'Rewrite article'), 'Rewrite article');\n  if (r.article_en) en = writerFields(r.article_en);\n  if (r.article_he) he = writerFields(r.article_he);\n}\nmarkApplyFromCta(en);\nsyncApply(en, he);\nconst keep = (stored) => {\n  const out = {};\n  for (const k of CODE_FIELDS) if (stored[k] !== undefined) out[k] = stored[k];\n  return out;\n};\nlet ctx = {};\ntry { ctx = JSON.parse(row.context_json || '{}'); } catch (e) { ctx = {}; }\nreturn [{ json: {\n  mode: 'fix',\n  route: $('Route').first().json.route,\n  article_id: row.article_id,\n  article_en: canonical({ ...keep(stored_en), ...en, imageAlt: stored_en.imageAlt, references: stored_en.references }),\n  article_he: canonical({ ...keep(stored_he), ...he, imageAlt: stored_he.imageAlt, references: stored_en.references }),\n  research_text: row.research_pack || '',\n  allowed_urls: ctx.allowed_urls || [],\n  read_urls: ctx.read_urls || [],\n  published: ctx.published || [],\n  plan: ctx.plan || {},\n}, pairedItem: { item: 0 } }];\n" } },
  output: [{ mode: 'fix', route: 'text', article_en: {}, article_he: {} }],
});

const needsImage = ifElse({
  version: 2.2,
  config: {
    name: 'New image?',
    parameters: {
      conditions: {
        options: IF_OPTS,
        conditions: [{ leftValue: expr("{{ $('Route').first().json.route !== 'text' }}"), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const fixImageModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Sonnet — image prompt (fix)', parameters: { model: MODEL_EDIT, options: { temperature: 0.8 } }, credentials: CRED_OPENROUTER },
});

const fixImagePrompt = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Image prompt (fix)',
    parameters: {
      promptType: 'define',
      text: expr("Article title: {{ $('Checked article').first().json.article_en.title }}\nBottom line: {{ $('Checked article').first().json.article_en.tldr }}\n\nReviewer note (follow it within the style rules): {{ $('Fix request').first().json.body.feedback }}\n\nPrevious image prompt — make a clearly different image where the note asks: {{ $('Get article (fix)').first().json.image_prompt }}"),
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: "You write ONE prompt for a photographic hero image for a strength-training blog article. The site and the app share a cool palette (pale blue-grey, white, near-black, steel and teal accents), so the image must match it. Output only the prompt: 70–120 words, English, no preamble.\n\nStyle (mandatory): bright-to-mid natural daylight with a cool colour temperature — soft cool blue-grey light, never warm or golden. Cool palette only: pale concrete, white walls, steel, chrome, brushed aluminium, matte black equipment, rubber flooring in grey, at most a subtle teal or steel-blue accent. Clean, uncluttered backgrounds. Editorial photography, sharp subject, gently soft background, realistic textures. Wide 16:9 landscape with some calm empty space.\n\nSubject: a concrete scene that fits the article — e.g. a barbell with matte black plates in a concrete gym, chrome dumbbells on a steel rack, a training notebook or phone next to a steel water bottle on a grey bench, or a rest moment between sets. If a person appears they are anonymous: back view, cropped at the shoulders, hands only, or out of focus. Never a recognisable face, never a celebrity or any real person.\n\nNever: text, letters, numbers, logos, brand names, watermarks, signage, readable labels on equipment or packaging, phone or screen UI; no warm wood, beige, cream, orange or golden light, no sunset tones, no dark moody low-key lighting; no bodybuilder posing or six-packs, no before/after, no scales, no medical imagery.\n" }] },
    },
    subnodes: { model: fixImageModel },
  },
  output: [{ text: 'Low-key photograph…' }],
});

const generateImageFix = node({
  type: '@n8n/n8n-nodes-langchain.googleGemini',
  version: 1.1,
  config: {
    name: 'Generate hero image (fix)',
    parameters: { resource: 'image', operation: 'generate', modelId: IMAGE_MODEL, prompt: expr("{{ $json.text }}\n\nAbsolutely no text, letters, numbers, logos or watermarks anywhere in the image. Wide 16:9 landscape composition, cool daylight, cool blue-grey and steel palette, clean background, no warm wood, no warm or golden tones, no recognisable faces."), options: {} },
    credentials: CRED_GEMINI,
  },
  output: [{ mimeType: 'image/png' }],
});

const uploadImageFix = node({
  type: 'n8n-nodes-cloudinary.cloudinary',
  version: 2,
  config: {
    name: 'Upload image (fix)',
    parameters: {
      resource: 'upload',
      operation: 'uploadFile',
      file: 'data',
      resource_type_file: 'image',
      additionalFieldsFile: {
        folder: 'gymon-blog/drafts',
        public_id: expr("{{ $('Get article (fix)').first().json.slug }}-r{{ (Number($('Get article (fix)').first().json.round) || 1) + 1 }}-{{ $now.toFormat('yyMMddHHmmss') }}"),
        tags: 'gymon-blog,draft',
      },
    },
    credentials: CRED_CLOUDINARY,
  },
  output: [{ public_id: 'gymon-blog/drafts/rest-between-sets-r2', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/gymon-blog/drafts/rest-between-sets-r2.png' }],
});

const altModelFix = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Haiku — image alt (fix)', parameters: { model: MODEL_FAST, options: { temperature: 0.2 } }, credentials: CRED_OPENROUTER },
});

const altParserFix = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: { name: 'Image alt format (fix)', parameters: { schemaType: 'fromJson', jsonSchemaExample: '{"image_alt_en": "A barbell with matte black plates on a grey rubber floor", "image_alt_he": "מוט עם משקולות שחורות על רצפת גומי אפורה"}' } },
});

const imageAltFix = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Image alt (fix)',
    parameters: {
      promptType: 'define',
      text: expr("Article title: {{ $('Checked article').first().json.article_en.title }}"),
      hasOutputParser: true,
      messages: { messageValues: [
        { type: 'SystemMessagePromptTemplate', message: "You write alt text for a blog header image, from the IMAGE ITSELF (attached), for an article whose title you are given. Return JSON:\n- image_alt_en: one plain English sentence, 8–16 words, describing what is actually visible and relevant to the article. No \"image of\", no style words.\n- image_alt_he: the same in natural Hebrew, one sentence, gender-neutral (describe objects and scenes; a person, if any, neutrally: \"אדם מרים מוט\").\nJSON only.\n" },
        { type: 'HumanMessagePromptTemplate', messageType: 'imageUrl', imageUrl: expr("{{ String($json.secure_url || '').replace('/upload/', '/upload/c_fill,g_auto,ar_16:9,w_1024,q_auto,f_jpg/') }}"), imageDetail: 'low' },
      ] },
    },
    subnodes: { model: altModelFix, outputParser: altParserFix },
  },
  output: [{ output: { image_alt_en: '…', image_alt_he: '…' } }],
});

const revisedRecord = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Revised record', parameters: { mode: 'runOnceForAllItems', jsCode: "// Revised record — the fix round's row update: the re-validated article pair, a new image\n// (and alt text from the new image) when the route asked for one.\nconst b = $('Checked article').first().json;\nconst row = $('Get article (fix)').first().json;\nconst IMG16 = '/upload/c_fill,g_auto,ar_16:9,w_1600,q_auto:good,f_jpg/';\nconst newImage = $('Upload image (fix)').isExecuted;\nconst alt = newImage ? (($('Image alt (fix)').first().json || {}).output || {}) : {};\nconst en = { ...b.article_en, imageAlt: alt.image_alt_en || b.article_en.imageAlt };\nconst he = { ...b.article_he, imageAlt: alt.image_alt_he || b.article_he.imageAlt };\nreturn [{ json: {\n  status: 'pending_review',\n  round: (Number(row.round) || 1) + 1,\n  last_feedback: $('Fix request').first().json.body.feedback,\n  title_en: en.title, title_he: he.title,\n  hero_title_en: en.heroTitle, hero_title_he: he.heroTitle,\n  description_en: en.description, description_he: he.description,\n  image_alt_en: en.imageAlt, image_alt_he: he.imageAlt,\n  read_time_en: b.validation.en.stats.readTime, read_time_he: b.validation.he.stats.readTime,\n  article_en: JSON.stringify(en),\n  article_he: JSON.stringify(he),\n  validation: JSON.stringify({ ...b.validation, refs: b.ref_report, blocking: b.blocking }),\n  check_notes: JSON.stringify(b.check_notes || {}),\n  sources_json: JSON.stringify((en.references || []).map((r) => ({ title: r.title, url: r.url }))),\n  image_url: newImage ? String($('Upload image (fix)').first().json.secure_url || '').replace('/upload/', IMG16) : row.image_url,\n  image_public_id: newImage ? $('Upload image (fix)').first().json.public_id : row.image_public_id,\n  image_prompt: $('Image prompt (fix)').isExecuted ? $('Image prompt (fix)').first().json.text : row.image_prompt,\n}, pairedItem: { item: 0 } }];\n" } },
  output: [{ status: 'pending_review', round: 2 }],
});

const updateArticle = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Save revised article',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: T_ARTICLES, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'article_id', condition: 'eq', keyValue: expr("{{ $('Get article (fix)').first().json.article_id }}") }] },
      columns: { mappingMode: 'autoMapInputData', value: {}, matchingColumns: [], schema: [] },
      options: {},
    },
  },
  output: [{ id: 1, status: 'pending_review' }],
});

const emailRevised = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Email: revised article',
    executeOnce: true,
    parameters: { mode: 'manual', assignments: { assignments: [{ id: 'er1', name: 'article_id', value: expr("{{ $('Get article (fix)').first().json.article_id }}"), type: 'string' }] }, options: {} },
  },
  output: [{ article_id: 1 }],
});


const label1 = sticky('## 1 · Collect sources\n11 English RSS feeds → drop used / older than 30 days / off-topic or YMYL → up to 30 candidates. Published articles are read too (no repeats, link targets).', [getUsedSources, getPublished, feedList, splitFeeds, readFeed, shortlist, anyCandidates], { color: 7 });
const label2 = sticky('## 2 · Pick topic + guard\nSonnet plans an evergreen topic inside the 5 pillars. The code guard (the site validator) stops YMYL / off-pillar topics before any research is paid for.', [pickTopic, hasTopic, topicPlan, topicAllowed, topicRejected], { color: 7 });
const label3 = sticky('## 3 · Research + write (JSON)\nTavily: source + 3 searches + 2 pages → Sonnet writes the EN article as closed-schema JSON with a Gymon-unique block → Sonnet adapts HE → code assembles both files.', [fetchSource, searchQueries, searchWeb, pickPages, readPages, researchPack, writerRequest, writeArticle, parseEn, hebrewRequest, hebrewVersion, prepareNew], { color: 7 });
const label4 = sticky('## 4 · Automatic checks (before any email)\nThe SITE validator on both languages · every URL fetched · every DOI in Crossref · every PMID in PubMed · Haiku entailment + Hebrew check. Shared by new articles and fix rounds.', [validateArticles, referenceChecks, resolveReferences, referenceResults, factCheck, checkedArticle, isNew], { color: 7 });
const label5 = sticky('## 5 · Image + save + email\nSonnet prompt → Gemini → Cloudinary → alt text from the final image (Haiku vision) → row in gymon_blog_articles → review email.', [imagePrompt, generateImage, uploadImage, imageAlt, articleRecord, insertArticle, logSource, emailNew, loadForEmail, buildEmail, sendReviewEmail], { color: 7 });
const label7 = sticky('## 6 · Review page (GET /webhook/gymon-blog/review)\nBoth articles rendered with the site renderer, every flag, reference checks, review checklist. Approve is disabled while errors remain.', [getArticleReview, getVersionsReview, renderPage, respondPage], { color: 7 });
const label8 = sticky('## 7 · Approve → GitHub (POST /webhook/gymon-blog/approve)\nServer re-checks token, errors and checklist → two JSON files (validated again) + jpg committed to blog/incoming. ⚠️ needs a GitHub credential.', [getArticleApprove, canApprove, markApproved, buildFiles, getBranch, createCommit, markCommitted], { color: 7 });
const label9 = sticky('## 8 · Fix request → redo (POST /webhook/gymon-blog/fix)\nHaiku routes text / image / both → previous version saved → Sonnet rewrites the JSON → the same checks as a new article → new email.', [getArticleFix, canFix, routeFix, saveVersion, rewriteRequest, rewriteArticle, prepareFix, revisedRecord, updateArticle], { color: 7 });

const noteOverview = sticky("## Gymon Blog — Articles (doctrine rebuild 2026-10-07)\n**Generate (Sunday 09:00 weekly, or Run once):** 11 English RSS feeds → shortlist (no reused sources, no YMYL terms) → Sonnet picks a topic inside 5 pillars → code guard (no supplements / weight loss / injury / pregnancy / medical) → Tavily: source + 3 searches + 2 pages → Sonnet writes the EN article as closed-schema JSON with a Gymon-unique block → Sonnet adapts gender-neutral HE → **checks before any email:** the site validator on both languages, URL / DOI (Crossref) / PMID (PubMed) resolution, Haiku entailment + Hebrew → Gemini image → alt text from the final image → `gymon_blog_articles` → review email.\n\n**Review page** `GET /webhook/gymon-blog/review?id=&t=` — both articles, all flags, reference checks, 5-item review checklist.\n**Approve** `POST /webhook/gymon-blog/approve` — server re-checks errors + checklist → one commit (two JSON files + jpg) to `blog/incoming`.\n**Fix** `POST /webhook/gymon-blog/fix` → Haiku routes text / image / both → Sonnet rewrites the JSON → the same checks → new email.\n\nSource of truth: gymon-site `n8n/blog-articles/` (+ `src/lib/article/` for the contract). ⚠️ The GitHub nodes need a GitHub credential.", [], { color: 7, width: 560, height: 520 });

export default workflow('gymon-blog-articles', 'Gymon Blog — Articles')
  .add(scheduleTrigger)
  .to(getUsedSources)
  .add(manualTrigger)
  .to(getUsedSources)
  .add(getUsedSources)
  .to(getPublished)
  .to(feedList)
  .to(splitFeeds)
  .to(readFeed)
  .to(shortlist)
  .to(anyCandidates.onTrue(pickTopic))
  .add(pickTopic)
  .to(hasTopic.onTrue(topicPlan))
  .add(topicPlan)
  .to(topicAllowed
    .onTrue(fetchSource
      .to(searchQueries)
      .to(searchWeb)
      .to(pickPages)
      .to(readPages)
      .to(researchPack)
      .to(writerRequest)
      .to(writeArticle)
      .to(parseEn)
      .to(hebrewRequest)
      .to(hebrewVersion)
      .to(prepareNew)
      .to(validateArticles))
    .onFalse(topicRejected))

  .add(validateArticles)
  .to(referenceChecks)
  .to(resolveReferences)
  .to(referenceResults)
  .to(factCheck)
  .to(checkedArticle)
  .to(isNew
    .onTrue(imagePrompt.to(generateImage).to(uploadImage).to(imageAlt).to(articleRecord).to(insertArticle).to(logSource).to(emailNew).to(loadForEmail))
    .onFalse(needsImage))
  .add(needsImage
    .onTrue(fixImagePrompt.to(generateImageFix).to(uploadImageFix).to(imageAltFix).to(revisedRecord))
    .onFalse(revisedRecord))
  .add(revisedRecord)
  .to(updateArticle)
  .to(emailRevised)
  .to(loadForEmail)

  .add(loadForEmail)
  .to(buildEmail)
  .to(sendReviewEmail)

  .add(reviewRequest)
  .to(getArticleReview)
  .to(getVersionsReview)
  .to(renderPage)
  .to(respondPage)

  .add(approveRequest)
  .to(getArticleApprove)
  .to(canApprove
    .onTrue(markApproved.to(respondApproved).to(buildFiles).to(downloadImage).to(imageToBase64).to(getBranch))
    .onFalse(rejectApprove))
  .add(getBranch)
  .to(branchExists
    .onTrue(parentCommit)
    .onFalse(getBaseRef.to(createBranch).to(parentCommit)))
  .add(parentCommit)
  .to(getParentCommit)
  .to(createImageBlob)
  .to(createTree)
  .to(createCommit)
  .to(updateBranch)
  .to(markCommitted)
  .to(committedEmail)

  .add(fixRequest)
  .to(getArticleFix)
  .to(canFix
    .onTrue(respondFix.to(routeFix).to(routeSet).to(saveVersion).to(markRevising).to(needsRewrite
      .onTrue(rewriteRequest.to(rewriteArticle.to(prepareFix)))
      .onFalse(prepareFix)))
    .onFalse(rejectFix))
  .add(prepareFix)
  .to(validateArticles)
  .add(noteOverview)
  .add(label1)
  .add(label2)
  .add(label3)
  .add(label4)
  .add(label5)
  .add(label7)
  .add(label8)
  .add(label9);
