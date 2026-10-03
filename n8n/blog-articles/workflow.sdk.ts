import { workflow, node, trigger, sticky, newCredential, ifElse, languageModel, outputParser, expr } from '@n8n/workflow-sdk';

const T_ARTICLES = { __rl: true, mode: 'id', value: 't7r8sTFqvaGTXQZ9', cachedResultName: 'gymon_blog_articles' };
const T_VERSIONS = { __rl: true, mode: 'id', value: '6Q3AzxAZ066QgsoI', cachedResultName: 'gymon_blog_versions' };
const T_SOURCES = { __rl: true, mode: 'id', value: 'gE6f3TQh4YsTqHQk', cachedResultName: 'gymon_blog_sources' };

const CRED_OPENROUTER = { openRouterApi: { id: 'r7iH8Td6bDg9JsVf', name: 'osheralon5@gmail.com-Achordli' } };
const CRED_GEMINI = { googlePalmApi: { id: 'HOstAjpYB1HvLdVR', name: 'osheralon5@gmail.com' } };
const CRED_GMAIL = { gmailOAuth2: { id: '2MntuHdkPCPZn4Fb', name: 'osheralon5@gmail.com' } };
const CRED_TAVILY = { tavilyApi: { id: 'c35RkiJeUqxZ9eXO', name: 'osheralon5@gmail.com' } };
const CRED_CLOUDINARY = { cloudinaryApi: { id: '9N3ayVo3Ijc7tDs4', name: 'osheralon5@gmail.com_DEV AI' } };

const MODEL_WRITE = 'anthropic/claude-sonnet-5.5';
const MODEL_REWRITE = 'anthropic/claude-sonnet-5.5';
const MODEL_EDIT = 'anthropic/claude-sonnet-5.5';
const MODEL_FAST = 'anthropic/claude-haiku-4.5';
const IMAGE_MODEL = { __rl: true, mode: 'id', value: 'models/gemini-3-pro-image-preview' };
const REVIEW_EMAIL = 'gymon.official@gmail.com';

const GH_HEADERS = { parameters: [
  { name: 'Accept', value: 'application/vnd.github+json' },
  { name: 'X-GitHub-Api-Version', value: '2022-11-28' },
] };
const CRED_GITHUB = { githubApi: newCredential('GitHub — gymon-site') };

const IF_OPTS = { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 };


const scheduleTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Sun + Wed 09:00',
    parameters: { rule: { interval: [{ field: 'weeks', weeksInterval: 1, triggerAtDay: [0, 3], triggerAtHour: 9, triggerAtMinute: 0 }] } },
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

const feedList = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Feed list',
    executeOnce: true,
    parameters: { mode: 'raw', jsonOutput: "{\n  \"feeds\": [\n    {\n      \"name\": \"strongerbyscience.com\",\n      \"url\": \"https://www.strongerbyscience.com/feed/\"\n    },\n    {\n      \"name\": \"rpstrength.com\",\n      \"url\": \"https://rpstrength.com/blogs/articles.atom\"\n    },\n    {\n      \"name\": \"sciencedaily.com/fitness\",\n      \"url\": \"https://www.sciencedaily.com/rss/health_medicine/fitness.xml\"\n    },\n    {\n      \"name\": \"sciencedaily.com/sports_medicine\",\n      \"url\": \"https://www.sciencedaily.com/rss/health_medicine/sports_medicine.xml\"\n    },\n    {\n      \"name\": \"sciencedaily.com/nutrition\",\n      \"url\": \"https://www.sciencedaily.com/rss/health_medicine/nutrition.xml\"\n    },\n    {\n      \"name\": \"sciencedaily.com/diet_and_weight_loss\",\n      \"url\": \"https://www.sciencedaily.com/rss/health_medicine/diet_and_weight_loss.xml\"\n    },\n    {\n      \"name\": \"bjsm.bmj.com (online first)\",\n      \"url\": \"https://bjsm.bmj.com/rss/ahead.xml\"\n    },\n    {\n      \"name\": \"journals.physiology.org/jappl\",\n      \"url\": \"https://journals.physiology.org/action/showFeed?type=etoc&feed=rss&jc=jappl\"\n    },\n    {\n      \"name\": \"frontiersin.org/sports-and-active-living\",\n      \"url\": \"https://www.frontiersin.org/journals/sports-and-active-living/rss\"\n    },\n    {\n      \"name\": \"frontiersin.org/exercise-physiology\",\n      \"url\": \"https://www.frontiersin.org/journals/physiology/sections/exercise-physiology/rss\"\n    },\n    {\n      \"name\": \"tandfonline.com/JISSN\",\n      \"url\": \"https://www.tandfonline.com/feed/rss/rssn20\"\n    },\n    {\n      \"name\": \"acsm.org\",\n      \"url\": \"https://www.acsm.org/feed\"\n    },\n    {\n      \"name\": \"nsca.com\",\n      \"url\": \"https://www.nsca.com/rss\"\n    }\n  ]\n}" },
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
  config: { name: 'Shortlist candidates', parameters: { mode: 'runOnceForAllItems', jsCode: "// Shortlist candidates — runs once for all RSS items.\n// Drops items already used (gymon_blog_sources), off-topic items, items older than MAX_AGE_DAYS,\n// and duplicates; then interleaves by site so one busy feed cannot fill the list.\n// Always returns ONE item with counters, so an empty shortlist is visible in the execution\n// (the next IF stops the run when candidates is empty).\n// No `new URL()` here: execution 1530 returned 0 items from 462 feed items while the same code\n// and data gave 88 candidates locally — the only silent drop was the URL parse in a try/catch.\nconst MAX_AGE_DAYS = 30;\nconst MAX_CANDIDATES = 30;\n\nconst usedRows = $('Get used sources').all().map(i => i.json).filter(r => r && r.source_url);\nconst used = new Set(usedRows.map(r => String(r.source_url).trim()));\nconst usedTopics = usedRows.map(r => r.topic).filter(Boolean).slice(-60);\n\nconst relevant = /(strength|resistance (training|exercise)|weight[- ]?(lifting|training)|lifting|hypertroph|muscle|squat|deadlift|bench press|\\bsets?\\b|\\breps?\\b|repetition|training volume|progressive overload|rest interval|inter-set|recovery|warm[- ]?up|stretching|mobility|sleep|protein|creatine|exercise|workout|fitness|athlet|sarcopenia|power training|1rm|one-repetition|tendon|deload|periodi[sz]|adherence|physical activity)/i;\nconst exclude = /\\b(mice|mouse|murine|rats?|zebrafish|in vitro|drosophila|cell line)\\b/i;\n\nconst cutoff = Date.now() - MAX_AGE_DAYS * 864e5;\nconst seen = new Set();\nconst all = [];\nconst count = { feed_items: 0, no_link: 0, already_used: 0, duplicate: 0, off_topic: 0, too_old: 0, kept: 0 };\nconst hostOf = u => (String(u).match(/^https?:\\/\\/([^\\/?#:]+)/i) || [, ''])[1].toLowerCase().replace(/^www\\./, '');\n\nfor (const item of $input.all()) {\n  count.feed_items++;\n  const j = item.json || {};\n  const link = String(j.link || j.guid || '').trim();\n  if (!/^https?:\\/\\//.test(link)) { count.no_link++; continue; }\n  if (used.has(link)) { count.already_used++; continue; }\n  if (seen.has(link)) { count.duplicate++; continue; }\n  const title = String(j.title || '').replace(/\\s+/g, ' ').trim();\n  const snippet = String(j.contentSnippet || j.content || j.summary || '')\n    .replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim().slice(0, 500);\n  const text = `${title} ${snippet}`;\n  if (!title || !relevant.test(text) || exclude.test(text)) { count.off_topic++; continue; }\n  const d = Date.parse(j.isoDate || j.pubDate || j.date || '');\n  if (!isNaN(d) && d < cutoff) { count.too_old++; continue; }\n  const host = hostOf(link) || 'unknown';\n  seen.add(link);\n  count.kept++;\n  all.push({ title, link, snippet, host, date: isNaN(d) ? '' : new Date(d).toISOString().slice(0, 10) });\n}\n\nall.sort((a, b) => (b.date || '').localeCompare(a.date || ''));\nconst byHost = {};\nfor (const c of all) (byHost[c.host] = byHost[c.host] || []).push(c);\nconst picked = [];\nlet added = true;\nwhile (picked.length < MAX_CANDIDATES && added) {\n  added = false;\n  for (const h of Object.keys(byHost)) {\n    const c = byHost[h].shift();\n    if (c) { picked.push(c); added = true; }\n    if (picked.length >= MAX_CANDIDATES) break;\n  }\n}\n\nreturn [{ json: { candidates: picked, used_topics: usedTopics, used_slugs: usedRows.map(r => r.slug).filter(Boolean), candidate_count: all.length, counts: count } }];\n" } },
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
  config: { name: 'Topic plan format', parameters: { schemaType: 'fromJson', jsonSchemaExample: "{\n  \"skip\": false,\n  \"candidate_index\": 0,\n  \"source_url\": \"https://example.org/article\",\n  \"source_title\": \"Source title\",\n  \"topic\": \"How long should you rest between sets for strength?\",\n  \"angle\": \"What the evidence says and how to apply it\",\n  \"slug\": \"rest-between-sets-for-strength\",\n  \"primary_keyword_en\": \"rest between sets\",\n  \"primary_keyword_he\": \"מנוחה בין סטים\",\n  \"search_queries\": [\n    \"rest interval length strength meta-analysis\",\n    \"inter-set rest hypertrophy systematic review\"\n  ],\n  \"reason\": \"Recent meta-analysis on a common question\"\n}" } },
});

const pickTopic = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Pick topic',
    parameters: {
      promptType: 'define',
      text: expr("Already used topics (do not repeat):\n{{ ($json.used_topics || []).join('\\n') || '(none yet)' }}\n\nCandidates (index: site | date | title | snippet | link):\n{{ $json.candidates.map((c, i) => i + ': ' + c.host + ' | ' + (c.date || 'n/a') + ' | ' + c.title + ' | ' + c.snippet + ' | ' + c.link).join('\\n') }}"),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: "You are the editor of the Gymon blog. Gymon is a strength-training and workout-logging app: people log sets, reps and weights, use a rest timer and follow their progress over time. The blog is published in English and Hebrew and exists to earn search traffic with genuinely useful, evidence-based articles for people who lift or want to start.\n\nTask: pick ONE candidate from the list that would make the best article for this blog, and plan it.\n\nPrefer topics about: resistance training, progressive overload, sets/reps/training volume, rest between sets, recovery and sleep as they affect training, warm-up, consistency and habits, tracking progress, and training-related nutrition basics (protein, creatine, hydration around training).\nPrefer candidates that rest on strong evidence: systematic reviews, meta-analyses, position stands, controlled human studies, or evidence-based coaching pieces.\nAvoid: animal or cell studies, tiny pilot studies, disease treatment, drugs, fringe supplements, weight-loss diets, anything that would need a medical promise, and pure news with no practical takeaway.\n\nThe article is NOT a news report about the candidate. It is an evergreen guide that answers a question people actually search for; the candidate is the fresh, sourced reason to write it.\n\nDo not repeat or closely paraphrase any topic in the \"already used\" list. If no candidate fits, return skip=true and leave the other fields empty.\n\nFields:\n- candidate_index: the index of the chosen candidate.\n- source_url / source_title: copied from that candidate.\n- topic: the search question the article answers, in English.\n- angle: 1–2 sentences on what the article will say that is useful and specific.\n- slug: lowercase latin letters, digits and dashes, 3–6 words, keyword first, no dates (e.g. \"rest-between-sets-for-strength\").\n- primary_keyword_en / primary_keyword_he: the main search phrase in each language (Hebrew as Israelis would type it).\n- search_queries: 3–5 English queries for finding authoritative supporting evidence (reviews, meta-analyses, ACSM/NSCA/ISSN position stands, peer-reviewed journals).\n- reason: one sentence on why this candidate was chosen.\n\nReturn only the JSON.\n" }] },
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
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Topic plan',
    parameters: {
      mode: 'manual',
      assignments: { assignments: [
        { id: 'tp1', name: 'topic', value: expr('{{ $json.output.topic }}'), type: 'string' },
        { id: 'tp2', name: 'angle', value: expr('{{ $json.output.angle }}'), type: 'string' },
        { id: 'tp3', name: 'slug', value: expr("{{ (() => { const s = String($json.output.slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('article-' + $now.toFormat('yyMMddHHmm')); return ($('Shortlist candidates').first().json.used_slugs || []).includes(s) ? s + '-' + $now.toFormat('yyMMdd') : s; })() }}"), type: 'string' },
        { id: 'tp4', name: 'source_url', value: expr("{{ ($('Shortlist candidates').first().json.candidates[$json.output.candidate_index] || {}).link || $json.output.source_url }}"), type: 'string' },
        { id: 'tp5', name: 'source_title', value: expr("{{ ($('Shortlist candidates').first().json.candidates[$json.output.candidate_index] || {}).title || $json.output.source_title }}"), type: 'string' },
        { id: 'tp6', name: 'primary_keyword_en', value: expr('{{ $json.output.primary_keyword_en }}'), type: 'string' },
        { id: 'tp7', name: 'primary_keyword_he', value: expr('{{ $json.output.primary_keyword_he }}'), type: 'string' },
        { id: 'tp8', name: 'search_queries', value: expr('{{ $json.output.search_queries || [] }}'), type: 'array' },
      ] },
      options: {},
    },
  },
  output: [{ topic: 'How long to rest between sets', angle: '…', slug: 'rest-between-sets', source_url: 'https://example.org/a', source_title: 'Rest intervals', primary_keyword_en: 'rest between sets', primary_keyword_he: 'מנוחה בין סטים', search_queries: ['rest interval meta-analysis'] }],
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
  config: { name: 'Search queries (max 3)', parameters: { mode: 'runOnceForAllItems', jsCode: "// Search queries — exactly 3 items, one per Tavily search (hard cap: 3 searches per article).\nconst MAX_SEARCHES = 3;\nconst p = $('Topic plan').first().json;\nconst qs = (Array.isArray(p.search_queries) ? p.search_queries : [])\n  .map(q => String(q || '').trim()).filter(Boolean);\nconst fallback = [`${p.topic} systematic review`, `${p.primary_keyword_en} meta-analysis`, `${p.primary_keyword_en} position stand`];\nconst out = [];\nfor (const q of qs.concat(fallback)) {\n  if (out.length >= MAX_SEARCHES) break;\n  if (!out.includes(q)) out.push(q);\n}\nreturn out.map(query => ({ json: { query }, pairedItem: { item: 0 } }));  // keep the link to Topic plan\n" } },
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
  config: { name: 'Pick pages to read', parameters: { mode: 'runOnceForAllItems', jsCode: "// Pick pages to read — merges the 3 search results, keeps a short digest of the best results and\n// chooses the 2 pages to read in full (hard cap: 2 extracted pages per article).\nconst MAX_PAGES = 2;\nconst MAX_DIGEST = 10;\nconst SNIPPET_CHARS = 450;\nconst TRUSTED = /(pubmed|ncbi\\.nlm\\.nih\\.gov|nih\\.gov|bjsm\\.bmj|bmj\\.com|springer|link\\.springer|frontiersin|journals\\.lww|physiology\\.org|tandfonline|jissn|acsm\\.org|nsca\\.com|sciencedirect|wiley|mdpi|nature\\.com|cochrane|who\\.int|\\.edu\\b|strongerbyscience|examine\\.com)/i;\nconst source = $('Topic plan').first().json.source_url;\n\nconst seen = new Set();\nconst results = [];\nfor (const item of $input.all()) {\n  for (const r of (item.json.results || [])) {\n    const url = String(r.url || '').trim();\n    if (!/^https?:\\/\\//.test(url) || seen.has(url) || url === source) continue;\n    seen.add(url);\n    const boost = TRUSTED.test(url) ? 0.25 : 0;\n    results.push({\n      url,\n      title: String(r.title || '').replace(/\\s+/g, ' ').trim(),\n      snippet: String(r.content || '').replace(/\\s+/g, ' ').trim().slice(0, SNIPPET_CHARS),\n      score: (Number(r.score) || 0) + boost,\n    });\n  }\n}\nresults.sort((a, b) => b.score - a.score);\nconst digest = results.slice(0, MAX_DIGEST);\nconst urls = digest.slice(0, MAX_PAGES).map(r => r.url);\nwhile (urls.length < MAX_PAGES) urls.push(urls[0] || source);  // the extract node needs 2 entries\nreturn [{ json: { urls, digest }, pairedItem: { item: 0 } }];\n" } },
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
  config: { name: 'Research pack', parameters: { mode: 'runOnceForAllItems', jsCode: "// Research pack — the only research text the writer sees, size-capped:\n// source ≤ 5,000 chars, ≤ 10 search snippets of ≤ 450 chars, 2 pages ≤ 4,000 chars each.\nconst SOURCE_CHARS = 5000;\nconst PAGE_CHARS = 4000;\n\nconst plan = $('Topic plan').first().json;\nconst src = $('Fetch source article').first().json;\nconst picked = $('Pick pages to read').first().json;\nconst pages = ($input.first().json.results || []);\n\nconst clip = (s, n) => {\n  const t = String(s || '').replace(/\\n{3,}/g, '\\n\\n').trim();\n  return t.length > n ? t.slice(0, n) + ' […]' : t;\n};\nconst srcText = clip(src.results && src.results[0] && src.results[0].raw_content, SOURCE_CHARS);\n\nconst allowed = [plan.source_url];\nconst blocks = [];\nblocks.push(`### Source article\\n${plan.source_title}\\n${plan.source_url}\\n\\n${srcText || '(could not be fetched — rely on the search results)'}`);\nconst pageMap = {};\nfor (const p of pages) pageMap[p.url] = p.raw_content;\nconst readUrls = [...new Set(picked.urls)];\nreadUrls.forEach((u, i) => {\n  if (!pageMap[u]) return;\n  allowed.push(u);\n  blocks.push(`### Page ${i + 1} (read in full)\\n${u}\\n\\n${clip(pageMap[u], PAGE_CHARS)}`);\n});\nconst digest = (picked.digest || []).map((r, i) => {\n  allowed.push(r.url);\n  return `${i + 1}. ${r.title}\\n   ${r.url}\\n   ${r.snippet}`;\n});\nblocks.push(`### Search results (snippets only)\\n${digest.join('\\n') || '(none)'}`);\n\nconst allowedUrls = [...new Set(allowed.filter(Boolean))];\nreturn [{ json: { research: blocks.join('\\n\\n'), allowed_urls: allowedUrls, research_chars: blocks.join('\\n\\n').length }, pairedItem: { item: 0 } }];\n" } },
  output: [{ research: '### Source article…', allowed_urls: ['https://example.org/a'], research_chars: 12000 }],
});

const writerModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Sonnet — writer', parameters: { model: MODEL_WRITE, options: { temperature: 0.6, maxTokens: 6000 } }, credentials: CRED_OPENROUTER },
});

const writerParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: { name: 'Article format (EN)', parameters: { schemaType: 'fromJson', jsonSchemaExample: "{\n  \"title\": \"How Long to Rest Between Sets for Strength\",\n  \"description\": \"One or two sentences for the card and meta description.\",\n  \"image_alt\": \"A loaded barbell on a rack in a dark gym\",\n  \"body_md\": \"Opening paragraph\\u2026\\n\\n## Section\\n\\nText with a [linked claim](https://example.org).\",\n  \"sources\": [\n    {\n      \"title\": \"Source title\",\n      \"url\": \"https://example.org\"\n    }\n  ]\n}" } },
});

const writeArticle = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Write article (EN)',
    parameters: {
      promptType: 'define',
      text: expr("Plan\nTopic: {{ $('Topic plan').item.json.topic }}\nAngle: {{ $('Topic plan').item.json.angle }}\nPrimary keyword: {{ $('Topic plan').item.json.primary_keyword_en }}\n\nAllowed URLs (link only to these):\n{{ $json.allowed_urls.join('\\n') }}\n\nRESEARCH PACK\n\n{{ $json.research }}"),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: "You are a senior evidence-based strength-and-conditioning writer for the Gymon blog. Gymon is a strength-training and workout-logging app. Write ONE original English article for the plan and research pack you receive.\n\n## Research — already done for you\nThe message contains a research pack: the source article, up to two pages read in full, and search-result snippets. It was collected before this call; you have no tools.\n1. Write only what the research pack supports. Every factual or numeric claim carries an inline Markdown link to the specific page that supports it, e.g. \"… around 1.6 g of protein per kg per day ([Morton et al., 2018](https://…))\".\n2. Link only to URLs listed under \"Allowed URLs\". Never invent a URL, author, year, number or study. A claim that appears only in a search snippet may be used if the snippet states it plainly; otherwise leave it out. If the evidence is mixed or weak, say so plainly.\n3. Rewrite in your own words. Never copy sentences from a source; a short quote (under 15 words) only when essential, in quotation marks, with its link.\n\n## Article rules\n- Audience: people who train or want to start. Practical, calm, respectful. No hype, no shaming, no body-image talk.\n- Length 900–1400 words. Open with a 2–3 sentence paragraph (no heading) that answers the search question directly. Then 4–7 sections with \"## \" headings (\"### \" allowed). Short paragraphs, lists where they help, **bold** sparingly, an optional \"> \" takeaway.\n- Do NOT put the \"# \" title in the body. Do NOT add a disclaimer or \"not medical advice\" note — the site adds one to every article. Do NOT add a \"Sources\"/\"References\" section — the inline links are the citations; you return the list separately.\n- SEO: use the primary keyword naturally in the title, in the first paragraph and in one \"##\" heading. No keyword stuffing.\n- No medical promises or diagnoses: never \"cures\", \"guarantees\", \"prevents injury\", \"treats\". Where pain, injury, pregnancy or a medical condition is relevant, say to consult a qualified professional.\n- No prices, no competitor apps or brands. Optional: one soft, natural sentence near the end connecting the advice to logging sets, weights or rest times (e.g. that a workout log makes progressive overload visible). Never push a download.\n- Weights in kg, with lb in parentheses.\n\n## Output — JSON only\n- title: 45–65 characters, plain text, contains the primary keyword.\n- description: 140–160 characters, plain text (blog card + meta description).\n- image_alt: one plain sentence describing the hero image in general terms (it will be a dark, dramatic gym photograph related to the topic).\n- body_md: the article body as described.\n- sources: every URL you linked, as {\"title\", \"url\"}.\n" }] },
    },
    subnodes: { model: writerModel, outputParser: writerParser },
  },
  output: [{ output: { title: 'How long to rest between sets for strength', description: '…', image_alt: '…', body_md: 'Intro…\n\n## Section', sources: [{ title: 'Meta-analysis', url: 'https://example.org/a' }] } }],
});

const hebrewModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Sonnet — Hebrew', parameters: { model: MODEL_WRITE, options: { temperature: 0.4, maxTokens: 8000 } }, credentials: CRED_OPENROUTER },
});

const hebrewParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: { name: 'Article format (HE)', parameters: { schemaType: 'fromJson', jsonSchemaExample: "{\n  \"title\": \"כמה זמן לנוח בין סטים באימוני כוח\",\n  \"description\": \"משפט או שניים לכרטיס ולתיאור המטא.\",\n  \"image_alt\": \"מוט עמוס על מתקן בחדר כושר חשוך\",\n  \"body_md\": \"פסקת פתיחה…\\n\\n## כותרת\\n\\nטקסט עם [טענה מקושרת](https://example.org).\"\n}" } },
});

const hebrewVersion = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Hebrew version',
    parameters: {
      promptType: 'define',
      text: expr("Hebrew primary keyword: {{ $('Topic plan').item.json.primary_keyword_he }}\n\nEnglish article\nTitle: {{ $json.output.title }}\nDescription: {{ $json.output.description }}\nImage alt: {{ $json.output.image_alt }}\n\n{{ $json.output.body_md }}"),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: "You adapt Gymon blog articles from English into natural, fluent Hebrew for Israeli readers. This is an adaptation, not a word-for-word translation: idiomatic Hebrew, the same facts, the same structure.\n\nHard rules:\n1. Gender-neutral Hebrew everywhere — mandatory, no exceptions. Never use gendered second-person singular: not \"נסה\"/\"נסי\", not \"הזן\"/\"הזיני\", not \"אתה\"/\"את\", not \"תוכל\"/\"תוכלי\", not \"שלך\" addressed to one person in a gendered sentence. Use plural imperative (\"נסו\", \"שימו לב\", \"התחילו\"), impersonal forms (\"יש ל-\", \"כדאי\", \"מומלץ\", \"אפשר\"), infinitives, or third-person plural (\"אנשים שמתאמנים\"). Slash forms (\"מתאמן/ת\") are not allowed either.\n2. Keep every inline Markdown link with exactly the same URL; translate only the link text. Keep every number and unit exactly. Add no fact or claim that is not in the English.\n3. Keep the Markdown structure: opening paragraph, \"## \" headings, lists, bold, quotes. No \"# \" title in the body, no disclaimer, no sources section.\n4. Gym terms as Israeli lifters say them: \"סט\", \"חזרות\", \"סקוואט\", \"דדליפט\", \"לחיצת חזה\", \"עומס מתקדם (progressive overload)\" on first use, \"חימום\", \"התאוששות\", \"נפח אימון\".\n5. title: 40–60 characters, contains the Hebrew primary keyword. description: 110–150 characters. image_alt: one plain Hebrew sentence.\n\nReturn JSON only.\n" }] },
    },
    subnodes: { model: hebrewModel, outputParser: hebrewParser },
  },
  output: [{ output: { title: 'כמה לנוח בין סטים', description: '…', image_alt: '…', body_md: 'פתיחה…' } }],
});

const checkModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Haiku — check', parameters: { model: MODEL_FAST, options: { temperature: 0 } }, credentials: CRED_OPENROUTER },
});

const checkParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: { name: 'Check format', parameters: { schemaType: 'fromJson', jsonSchemaExample: "{\n  \"gendered_hebrew\": [\n    \"\\\"נסה להוסיף\\\" — masculine singular imperative\"\n  ],\n  \"medical_promises\": [\n    \"\\\"prevents injuries\\\" — prevention promise\"\n  ],\n  \"unsupported_claims\": [\n    \"\\\"increases strength by 20%\\\" — no link\"\n  ],\n  \"other\": [\n    \"mentions a competitor app\"\n  ],\n  \"verdict\": \"needs_attention\"\n}" } },
});

const complianceCheck = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Compliance check',
    parameters: {
      promptType: 'define',
      text: expr("ENGLISH\nTitle: {{ $('Write article (EN)').item.json.output.title }}\nDescription: {{ $('Write article (EN)').item.json.output.description }}\n\n{{ $('Write article (EN)').item.json.output.body_md }}\n\nHEBREW\nTitle: {{ $json.output.title }}\nDescription: {{ $json.output.description }}\n\n{{ $json.output.body_md }}\n\nAllowed URLs:\n{{ $('Research pack').item.json.allowed_urls.join('\\n') }}"),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: "You are a strict reviewer for a bilingual fitness blog. Check the English and Hebrew article below and REPORT problems only — do not rewrite.\n\nReport as lists of short items (\"quoted phrase — 3 to 8 word reason\"):\n- gendered_hebrew: Hebrew phrases that use gendered second-person singular (e.g. נסה/נסי, הזן/הזיני, אתה/את, תרגיש/תרגישי, slash forms like מתאמן/ת) or that address one gender only.\n- medical_promises: phrases that promise cures, prevention or guaranteed results, or give diagnosis/treatment advice.\n- unsupported_claims: specific numbers or factual claims in the English text that have no inline link.\n- other: links whose URL is not in the \"Allowed URLs\" list, competitor app or brand names, prices, a disclaimer or sources section inside the body, anything off-brand.\n\nEmpty lists when clean. verdict: \"ok\" when all lists are empty, otherwise \"needs_attention\". JSON only.\n" }] },
    },
    subnodes: { model: checkModel, outputParser: checkParser },
  },
  output: [{ output: { gendered_hebrew: [], medical_promises: [], unsupported_claims: [], other: [], verdict: 'ok' } }],
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
      text: expr("Article title: {{ $('Write article (EN)').item.json.output.title }}\nDescription: {{ $('Write article (EN)').item.json.output.description }}\nOpening: {{ String($('Write article (EN)').item.json.output.body_md || '').slice(0, 900) }}"),
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: "You write ONE prompt for a photographic hero image for a strength-training blog article. Output only the prompt: 70–120 words, English, no preamble.\n\nStyle (mandatory): dark, dramatic, near-monochrome — black, charcoal and silver, at most a faint cool tint. Low-key lighting from one hard light source, deep shadows, visible texture and fine film grain. Cinematic editorial gym photography. Wide 16:9 landscape with generous negative space.\n\nSubject: a concrete gym or strength scene that fits the article — e.g. hands chalking up over a barbell, plates on a rack, a loaded bar in shadow, a quiet rest moment on a bench, a silhouette mid-lift. If a person appears they are anonymous: silhouette, back view, cropped, or face in shadow. Never a recognisable face, never a celebrity or any real person.\n\nNever: text, letters, numbers, logos, brand names, watermarks, signage, phone or screen UI, readable labels on equipment; no bodybuilder posing or six-packs, no before/after, no scales, no medical imagery.\n" }] },
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
    parameters: { resource: 'image', operation: 'generate', modelId: IMAGE_MODEL, prompt: expr("{{ $json.text }}\n\nAbsolutely no text, letters, numbers, logos or watermarks anywhere in the image. Wide 16:9 landscape composition, dark and near-monochrome."), options: {} },
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
        public_id: expr("{{ $('Topic plan').item.json.slug }}-r1-{{ $now.toFormat('yyMMddHHmmss') }}"),
        tags: 'gymon-blog,draft',
      },
    },
    credentials: CRED_CLOUDINARY,
  },
  output: [{ public_id: 'gymon-blog/drafts/rest-between-sets-r1', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/gymon-blog/drafts/rest-between-sets-r1.png' }],
});


const articleRecord = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Article record',
    parameters: {
      mode: 'manual',
      assignments: { assignments: [
        { id: "a0", name: "article_id", value: expr("{{ $now.toFormat('yyMMddHHmmss') }}-{{ $('Topic plan').item.json.slug }}"), type: "string" },
        { id: "a1", name: "slug", value: expr("{{ $('Topic plan').item.json.slug }}"), type: "string" },
        { id: "a2", name: "status", value: "pending_review", type: "string" },
        { id: "a3", name: "round", value: 1, type: "number" },
        { id: "a4", name: "review_token", value: expr("{{ $now.toMillis().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) }}"), type: "string" },
        { id: "a5", name: "topic", value: expr("{{ $('Topic plan').item.json.topic }}"), type: "string" },
        { id: "a6", name: "angle", value: expr("{{ $('Topic plan').item.json.angle }}"), type: "string" },
        { id: "a7", name: "source_url", value: expr("{{ $('Topic plan').item.json.source_url }}"), type: "string" },
        { id: "a8", name: "source_title", value: expr("{{ $('Topic plan').item.json.source_title }}"), type: "string" },
        { id: "a9", name: "sources_json", value: expr("{{ JSON.stringify($('Write article (EN)').item.json.output.sources || []) }}"), type: "string" },
        { id: "a10", name: "title_en", value: expr("{{ $('Write article (EN)').item.json.output.title }}"), type: "string" },
        { id: "a11", name: "description_en", value: expr("{{ $('Write article (EN)').item.json.output.description }}"), type: "string" },
        { id: "a12", name: "image_alt_en", value: expr("{{ $('Write article (EN)').item.json.output.image_alt }}"), type: "string" },
        { id: "a13", name: "body_en", value: expr("{{ $('Write article (EN)').item.json.output.body_md }}"), type: "string" },
        { id: "a14", name: "read_time_en", value: expr("{{ Math.max(1, Math.round(String($('Write article (EN)').item.json.output.body_md || '').split(/\\s+/).filter(Boolean).length / 230)) }}"), type: "number" },
        { id: "a15", name: "title_he", value: expr("{{ $('Hebrew version').item.json.output.title }}"), type: "string" },
        { id: "a16", name: "description_he", value: expr("{{ $('Hebrew version').item.json.output.description }}"), type: "string" },
        { id: "a17", name: "image_alt_he", value: expr("{{ $('Hebrew version').item.json.output.image_alt }}"), type: "string" },
        { id: "a18", name: "body_he", value: expr("{{ $('Hebrew version').item.json.output.body_md }}"), type: "string" },
        { id: "a19", name: "read_time_he", value: expr("{{ Math.max(1, Math.round(String($('Hebrew version').item.json.output.body_md || '').split(/\\s+/).filter(Boolean).length / 200)) }}"), type: "number" },
        { id: "a20", name: "check_notes", value: expr("{{ JSON.stringify($('Compliance check').item.json.output || {}) }}"), type: "string" },
        { id: "a21", name: "image_prompt", value: expr("{{ $('Image prompt').item.json.text }}"), type: "string" },
        { id: "a22", name: "image_url", value: expr("{{ String($json.secure_url || '').replace('/upload/', '/upload/c_fill,g_auto,ar_16:9,w_1600,q_auto:good,f_jpg/') }}"), type: "string" },
        { id: "a23", name: "image_public_id", value: expr("{{ $json.public_id }}"), type: "string" }
      ] },
      options: {},
    },
  },
  output: [{ article_id: '261004090000-rest-between-sets', slug: 'rest-between-sets', status: 'pending_review', round: 1, review_token: 'abc', title_en: '…', title_he: '…', image_url: 'https://res.cloudinary.com/…' }],
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
          source_url: expr("{{ $('Topic plan').item.json.source_url }}"),
          source_title: expr("{{ $('Topic plan').item.json.source_title }}"),
          topic: expr("{{ $('Topic plan').item.json.topic }}"),
          slug: expr("{{ $('Topic plan').item.json.slug }}"),
          article_id: expr("{{ $('Article record').item.json.article_id }}"),
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
    parameters: { mode: 'manual', assignments: { assignments: [{ id: 'en1', name: 'article_id', value: expr("{{ $('Article record').item.json.article_id }}"), type: 'string' }] }, options: {} },
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
  config: { name: 'Build review email', parameters: { mode: 'runOnceForAllItems', jsCode: "// Build review email — one article row in, one {subject, html} out.\nconst BASE = 'https://osher.app.n8n.cloud/webhook';\n\nconst a = $input.first().json;\nconst esc = s => String(s ?? '').replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]));\nconst plain = md => String(md || '')\n  .replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g, '$1')\n  .replace(/^>\\s?/gm, '')\n  .replace(/[*_`#]/g, '')\n  .trim();\nconst firstParas = (md, n) => String(md || '')\n  .split(/\\n\\s*\\n/)\n  .map(p => p.trim())\n  .filter(p => p && !p.startsWith('#') && !p.startsWith('-') && !/^\\d+\\./.test(p))\n  .slice(0, n)\n  .map(plain);\n\nlet notes = {};\ntry { notes = JSON.parse(a.check_notes || '{}'); } catch (e) { notes = { other: [String(a.check_notes || '')] }; }\nconst noteLists = [\n  ['Gendered Hebrew', notes.gendered_hebrew],\n  ['Medical promises', notes.medical_promises],\n  ['Claims without a link', notes.unsupported_claims],\n  ['Other', notes.other],\n].filter(([, l]) => Array.isArray(l) && l.length);\n\nlet sources = [];\ntry { sources = JSON.parse(a.sources_json || '[]'); } catch (e) {}\n\nconst reviewUrl = `${BASE}/gymon-blog/review?id=${encodeURIComponent(a.article_id)}&t=${encodeURIComponent(a.review_token)}`;\nconst round = Number(a.round) || 1;\nconst subject = round > 1\n  ? `[Gymon blog] Revised, round ${round}: ${a.title_en}`\n  : `[Gymon blog] New article for review: ${a.title_en}`;\n\nconst para = (t, rtl) => `<p style=\"margin:0 0 12px;font-size:15px;line-height:1.65;color:#d4d4d8;${rtl ? 'direction:rtl;text-align:right;' : ''}\">${esc(t)}</p>`;\n\nconst checkHtml = noteLists.length\n  ? `<div style=\"background:#2a1d0a;border:1px solid #a16207;border-radius:10px;padding:14px 16px;margin:0 0 20px\">\n      <div style=\"font-size:12px;font-weight:700;color:#facc15;letter-spacing:.06em;margin-bottom:6px\">AUTOMATIC CHECK — NEEDS ATTENTION</div>\n      ${noteLists.map(([k, l]) => `<div style=\"font-size:13px;color:#fde68a;margin:6px 0 2px\"><b>${esc(k)}</b></div><ul style=\"margin:0;padding-left:18px;color:#fde68a;font-size:13px\">${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`).join('')}\n    </div>`\n  : `<div style=\"font-size:12px;color:#86efac;margin:0 0 20px\">Automatic check: no issues flagged (gendered Hebrew, medical promises, unlinked claims).</div>`;\n\nconst feedbackHtml = round > 1 && a.last_feedback\n  ? `<div style=\"font-size:13px;color:#a1a1aa;margin:0 0 16px\">Your last note: <i>${esc(a.last_feedback)}</i></div>`\n  : '';\n\nconst html = `<!doctype html><html><body style=\"margin:0;background:#0b0b0f\">\n<div style=\"max-width:640px;margin:0 auto;padding:24px 16px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#e4e4e7\">\n  <div style=\"font-size:12px;letter-spacing:.18em;color:#a78bfa;font-weight:700;margin-bottom:6px\">GYMON BLOG</div>\n  <h1 style=\"margin:0 0 4px;font-size:20px;color:#fafafa\">${round > 1 ? `Revised article — round ${round}` : 'New article ready for review'}</h1>\n  <div style=\"font-size:13px;color:#a1a1aa;margin-bottom:18px\">slug: <code style=\"color:#d4d4d8\">${esc(a.slug)}</code> · ${esc(a.read_time_en)} min (EN) · ${esc(a.read_time_he)} min (HE) · ${sources.length} linked sources</div>\n  ${feedbackHtml}\n  ${a.image_url ? `<img src=\"${esc(a.image_url)}\" alt=\"${esc(a.image_alt_en)}\" width=\"608\" style=\"width:100%;height:auto;border-radius:12px;display:block;margin:0 0 20px\">` : ''}\n  ${checkHtml}\n  <div style=\"background:#18181b;border-radius:12px;padding:18px 18px 8px;margin:0 0 14px\">\n    <div style=\"font-size:11px;color:#71717a;font-weight:700;letter-spacing:.08em;margin-bottom:6px\">ENGLISH</div>\n    <h2 style=\"margin:0 0 6px;font-size:18px;color:#fafafa\">${esc(a.title_en)}</h2>\n    <div style=\"font-size:13px;color:#a1a1aa;margin:0 0 12px\">${esc(a.description_en)}</div>\n    ${firstParas(a.body_en, 2).map(p => para(p, false)).join('')}\n  </div>\n  <div dir=\"rtl\" style=\"background:#18181b;border-radius:12px;padding:18px 18px 8px;margin:0 0 22px;direction:rtl;text-align:right\">\n    <div style=\"font-size:11px;color:#71717a;font-weight:700;letter-spacing:.08em;margin-bottom:6px\">עברית</div>\n    <h2 style=\"margin:0 0 6px;font-size:18px;color:#fafafa\">${esc(a.title_he)}</h2>\n    <div style=\"font-size:13px;color:#a1a1aa;margin:0 0 12px\">${esc(a.description_he)}</div>\n    ${firstParas(a.body_he, 2).map(p => para(p, true)).join('')}\n  </div>\n  <a href=\"${reviewUrl}\" style=\"display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:700;font-size:15px\">Open the review page — approve or request fixes</a>\n  <div style=\"font-size:12px;color:#71717a;margin-top:14px;line-height:1.6\">The full article in both languages, the sources and the earlier versions are on the review page. Approving commits the two Markdown files and the image to <code>OsherAlon/gymon-site</code>, branch <code>blog/incoming</code>. Nothing is published to the live site automatically.</div>\n</div></body></html>`;\n\nreturn [{ json: { subject, html, article_id: a.article_id } }];\n" } },
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
  config: { name: 'Render review page', parameters: { mode: 'runOnceForAllItems', jsCode: "// Render review page — validates the token, then returns {html, status_code}.\n// The page posts to ./approve and ./fix (same /webhook/gymon-blog/ prefix, so no absolute URL).\nconst q = ($('Review page request').first().json.query) || {};\nconst a = $('Get article (review)').first().json || {};\nconst versions = $('Get versions (review)').all().map(i => i.json).filter(v => v && v.article_id);\n\nconst shell = (title, body) => `<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"robots\" content=\"noindex,nofollow\">\n<title>${title}</title>\n<style>\n:root{--bg:#0b0b0f;--card:#16161b;--line:#2a2a33;--text:#e4e4e7;--muted:#a1a1aa;--accent:#8b5cf6;--ok:#22c55e;--warn:#facc15;--bad:#f87171}\n*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 -apple-system,Segoe UI,Roboto,Arial,sans-serif}\n.wrap{max-width:860px;margin:0 auto;padding:24px 16px 80px}\n.kicker{font-size:12px;letter-spacing:.18em;color:var(--accent);font-weight:700}\nh1{font-size:22px;margin:4px 0 2px}.meta{color:var(--muted);font-size:13px}\n.hero{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:14px;margin:18px 0;background:#000}\n.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin:14px 0}\n.tabs{display:flex;gap:8px;margin:18px 0 0}.tab{background:transparent;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:6px 14px;font:inherit;font-size:14px;cursor:pointer}\n.tab.on{background:var(--accent);border-color:var(--accent);color:#fff}\n.lang h2.t{font-size:26px;line-height:1.25;margin:0 0 6px}.lang .d{color:var(--muted);margin:0 0 6px}.lang .fm{font-size:12px;color:#71717a;margin-bottom:12px}\n.body a{color:#c4b5fd}.body h2{font-size:20px;margin:26px 0 8px}.body h3{font-size:17px;margin:20px 0 6px}\n.body blockquote{border-inline-start:3px solid var(--accent);margin:12px 0;padding:4px 14px;color:#d4d4d8}\n[dir=rtl]{text-align:right}\n.notes{border-color:#a16207;background:#1f1708}.notes h3{color:var(--warn);font-size:13px;letter-spacing:.06em;margin:0 0 6px}\n.notes ul{margin:4px 0 10px;padding-inline-start:20px;font-size:14px;color:#fde68a}\n.src li{font-size:14px;margin:4px 0;word-break:break-word}.src a{color:#c4b5fd}\ntextarea{width:100%;min-height:120px;background:#0f0f14;color:var(--text);border:1px solid var(--line);border-radius:10px;padding:12px;font:inherit}\n.row{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}\nbutton.b{border:0;border-radius:10px;padding:12px 20px;font:inherit;font-weight:700;cursor:pointer}\n.approve{background:var(--ok);color:#052e16}.fix{background:var(--accent);color:#fff}button:disabled{opacity:.45;cursor:not-allowed}\n.status{font-size:14px;margin-top:10px;min-height:1.4em}\ndetails{border-top:1px solid var(--line);padding:10px 0}summary{cursor:pointer;color:var(--muted);font-size:14px}\n.v img{width:220px;border-radius:8px;margin:8px 0}\n.pill{display:inline-block;font-size:12px;border:1px solid var(--line);border-radius:999px;padding:2px 10px;color:var(--muted)}\n</style></head><body><div class=\"wrap\">${body}</div></body></html>`;\n\nif (!a.article_id || !q.t || q.t !== a.review_token) {\n  return [{ json: { status_code: 404, html: shell('Not found', '<div class=\"kicker\">GYMON BLOG</div><h1>Review link not found</h1><p class=\"meta\">The link is wrong or no longer valid. Open the most recent email for this article.</p>') } }];\n}\n\nconst data = {\n  id: a.article_id, t: q.t, status: a.status, round: Number(a.round) || 1, slug: a.slug,\n  image_url: a.image_url, published_date: a.published_date, commit_url: a.commit_url, last_feedback: a.last_feedback,\n  en: { title: a.title_en, description: a.description_en, image_alt: a.image_alt_en, body: a.body_en, read: a.read_time_en },\n  he: { title: a.title_he, description: a.description_he, image_alt: a.image_alt_he, body: a.body_he, read: a.read_time_he },\n  sources: (() => { try { return JSON.parse(a.sources_json || '[]'); } catch (e) { return []; } })(),\n  notes: (() => { try { return JSON.parse(a.check_notes || '{}'); } catch (e) { return { other: [String(a.check_notes || '')] }; } })(),\n  source_url: a.source_url, source_title: a.source_title, topic: a.topic,\n  versions: versions.sort((x, y) => (Number(y.round) || 0) - (Number(x.round) || 0)).map(v => ({\n    round: v.round, feedback: v.feedback, route: v.route, title_en: v.title_en, title_he: v.title_he,\n    body_en: v.body_en, body_he: v.body_he, image_url: v.image_url,\n  })),\n};\nconst json = JSON.stringify(data).replace(/</g, '\\\\u003c').replace(/\\u2028/g, '\\\\u2028').replace(/\\u2029/g, '\\\\u2029');\n\nconst body = `\n<div class=\"kicker\">GYMON BLOG · REVIEW</div>\n<h1 id=\"h\"></h1>\n<div class=\"meta\" id=\"m\"></div>\n<img class=\"hero\" id=\"img\" alt=\"\">\n<div class=\"card notes\" id=\"notes\" hidden></div>\n<div class=\"tabs\"><button class=\"tab on\" data-l=\"en\">English</button><button class=\"tab\" data-l=\"he\">עברית</button><button class=\"tab\" data-l=\"both\">Side by side</button></div>\n<div id=\"langs\"></div>\n<div class=\"card src\"><b>Sources linked in the article</b><ul id=\"src\"></ul><div class=\"meta\" id=\"orig\"></div></div>\n<div class=\"card\" id=\"actions\">\n  <b>Decision</b>\n  <p class=\"meta\">Approve commits <code>src/content/blog/{en,he}/<span class=\"s\"></span>.md</code> and <code>public/blog/<span class=\"s\"></span>.jpg</code> to branch <code>blog/incoming</code> of <code>OsherAlon/gymon-site</code>. Building and deploying the site stays manual.</p>\n  <div class=\"row\"><button class=\"b approve\" id=\"ap\">Approve</button></div>\n  <p class=\"meta\" style=\"margin-top:18px\">Or describe what to fix (Hebrew or English). The text, the image, or both will be redone and a new email will arrive.</p>\n  <textarea id=\"fb\" placeholder=\"What should change?\"></textarea>\n  <div class=\"row\"><button class=\"b fix\" id=\"fx\">Send for fixes</button></div>\n  <div class=\"status\" id=\"st\"></div>\n</div>\n<div class=\"card\" id=\"vers\" hidden><b>Earlier versions</b><div id=\"vl\"></div></div>\n<script type=\"application/json\" id=\"data\">${json}</script>\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js\"></script>\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js\"></script>\n<script>\nconst D = JSON.parse(document.getElementById('data').textContent);\nconst md = s => { try { return DOMPurify.sanitize(marked.parse(String(s || ''))); } catch (e) { const p = document.createElement('pre'); p.textContent = s || ''; return p.outerHTML; } };\nconst esc = s => String(s == null ? '' : s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));\ndocument.title = 'Review: ' + (D.en.title || D.slug);\ndocument.getElementById('h').textContent = D.en.title || D.slug;\ndocument.querySelectorAll('.s').forEach(e => e.textContent = D.slug);\nconst statusText = {pending_review:'waiting for your decision', revising:'revising — a new email will arrive', approved:'approved — committing to GitHub', committed:'approved and committed'}[D.status] || D.status;\ndocument.getElementById('m').innerHTML = 'slug <code>' + esc(D.slug) + '</code> · round ' + D.round + ' · <span class=\"pill\">' + esc(statusText) + '</span>' + (D.commit_url ? ' · <a style=\"color:#c4b5fd\" href=\"' + esc(D.commit_url) + '\">commit</a>' : '');\nconst img = document.getElementById('img'); if (D.image_url) { img.src = D.image_url; img.alt = D.en.image_alt || ''; } else img.remove();\nconst lists = [['Gendered Hebrew', D.notes.gendered_hebrew], ['Medical promises', D.notes.medical_promises], ['Claims without a link', D.notes.unsupported_claims], ['Other', D.notes.other]].filter(x => Array.isArray(x[1]) && x[1].length);\nif (lists.length) { const n = document.getElementById('notes'); n.hidden = false; n.innerHTML = '<h3>AUTOMATIC CHECK — NEEDS ATTENTION</h3>' + lists.map(x => '<b>' + esc(x[0]) + '</b><ul>' + x[1].map(i => '<li>' + esc(i) + '</li>').join('') + '</ul>').join(''); }\nconst block = (l) => { const x = D[l]; const rtl = l === 'he'; return '<div class=\"card lang\"' + (rtl ? ' dir=\"rtl\" lang=\"he\"' : ' lang=\"en\"') + '><div class=\"fm\">' + esc(l.toUpperCase()) + ' · ' + esc(x.read) + (rtl ? ' דקות קריאה' : ' min read') + ' · alt: ' + esc(x.image_alt) + '</div><h2 class=\"t\">' + esc(x.title) + '</h2><p class=\"d\">' + esc(x.description) + '</p><div class=\"body\">' + md(x.body) + '</div></div>'; };\nconst show = (l) => { document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.l === l)); document.getElementById('langs').innerHTML = l === 'both' ? block('en') + block('he') : block(l); };\ndocument.querySelectorAll('.tab').forEach(b => b.onclick = () => show(b.dataset.l)); show('en');\ndocument.getElementById('src').innerHTML = (D.sources || []).map(s => '<li><a href=\"' + esc(s.url) + '\" target=\"_blank\" rel=\"noopener\">' + esc(s.title || s.url) + '</a></li>').join('') || '<li>(none listed)</li>';\ndocument.getElementById('orig').innerHTML = 'Picked from the feed item: <a style=\"color:#c4b5fd\" href=\"' + esc(D.source_url) + '\" target=\"_blank\" rel=\"noopener\">' + esc(D.source_title || D.source_url) + '</a>';\nif (D.versions.length) { const v = document.getElementById('vers'); v.hidden = false; document.getElementById('vl').innerHTML = D.versions.map(x => '<details class=\"v\"><summary>Round ' + esc(x.round) + ' — note: ' + esc(x.feedback) + ' (' + esc(x.route) + ')</summary>' + (x.image_url ? '<img src=\"' + esc(x.image_url) + '\">' : '') + '<h3>' + esc(x.title_en) + '</h3><div class=\"body\">' + md(x.body_en) + '</div><div dir=\"rtl\"><h3>' + esc(x.title_he) + '</h3><div class=\"body\">' + md(x.body_he) + '</div></div></details>').join(''); }\nconst st = document.getElementById('st'), ap = document.getElementById('ap'), fx = document.getElementById('fx'), fb = document.getElementById('fb');\nconst lock = (on) => { ap.disabled = fx.disabled = fb.disabled = on; };\nif (D.status !== 'pending_review') { lock(true); st.textContent = 'No action available — this article is ' + statusText + '.'; }\nconst post = async (path, body) => { const r = await fetch(path, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)}); let j = {}; try { j = await r.json(); } catch (e) {} if (!r.ok || !j.ok) throw new Error(j.error || ('HTTP ' + r.status)); return j; };\nap.onclick = async () => { if (!confirm('Approve and commit to blog/incoming?')) return; lock(true); st.textContent = 'Sending…'; try { const j = await post('approve', {id: D.id, t: D.t}); st.textContent = j.message || 'Approved.'; } catch (e) { st.textContent = 'Failed: ' + e.message; lock(false); } };\nfx.onclick = async () => { const f = fb.value.trim(); if (f.length < 3) { st.textContent = 'Write what should change first.'; return; } lock(true); st.textContent = 'Sending…'; try { const j = await post('fix', {id: D.id, t: D.t, feedback: f}); st.textContent = j.message || 'Received.'; } catch (e) { st.textContent = 'Failed: ' + e.message; lock(false); } };\n</script>`;\n\nreturn [{ json: { status_code: 200, html: shell('Review: ' + String(a.title_en || a.slug).replace(/[<>&\"]/g, ''), body) } }];\n" } },
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
        conditions: [{ leftValue: expr("{{ !!$json.article_id && !!$json.review_token && $json.review_token === $('Approve request').item.json.body?.t && $json.status === 'pending_review' }}"), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
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
    parameters: { respondWith: 'json', responseBody: expr("{{ JSON.stringify({ ok: false, error: !$json.article_id ? 'Article not found.' : ($json.status !== 'pending_review' ? 'This article is ' + $json.status + ' — no action available.' : 'Invalid or expired link, or an empty note.') }) }}"), options: { responseCode: 409 } },
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
        value: { status: 'approved', published_date: expr("{{ $now.setZone('Asia/Jerusalem').toFormat('yyyy-MM-dd') }}") },
        matchingColumns: [],
        schema: [
          { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'published_date', displayName: 'published_date', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
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
  config: { name: 'Build commit files', parameters: { mode: 'runOnceForAllItems', jsCode: "// Build commit files — the two Markdown files in the exact format of gymon-site/README.md\n// (\"Blog articles — the file format\"), plus the GitHub target.\nconst OWNER = 'OsherAlon';\nconst REPO = 'gymon-site';\nconst BRANCH = 'blog/incoming';\nconst BASE_BRANCH = 'main'; // only used if blog/incoming does not exist yet\nconst AUTHOR = { en: 'Gymon Team', he: 'צוות Gymon' };\n\nconst a = $('Get article (approve)').first().json;\nconst date = $now.setZone('Asia/Jerusalem').toFormat('yyyy-MM-dd');\nconst slug = String(a.slug || '').toLowerCase();\nif (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid slug: ${a.slug}`);\n\n// YAML double-quoted scalars accept JSON string syntax.\nconst q = s => JSON.stringify(String(s ?? '').replace(/\\s+/g, ' ').trim());\nconst cleanBody = b => String(b || '')\n  .replace(/^\\uFEFF/, '')\n  .replace(/^\\s*#\\s[^\\n]*\\n+/, '')   // the page renders the title itself\n  .trim() + '\\n';\n\nconst file = lang => [\n  '---',\n  `title: ${q(a['title_' + lang])}`,\n  `description: ${q(a['description_' + lang])}`,\n  `image: /blog/${slug}.jpg`,\n  `imageAlt: ${q(a['image_alt_' + lang])}`,\n  `createdAt: ${date}`,\n  `author: ${q(AUTHOR[lang])}`,\n  `readTime: ${Math.max(1, Math.round(Number(a['read_time_' + lang]) || 1))}`,\n  `lang: ${lang}`,\n  `slug: ${slug}`,\n  'draft: false',\n  '---',\n  '',\n  cleanBody(a['body_' + lang]),\n].join('\\n');\n\nreturn [{ json: {\n  article_id: a.article_id,\n  slug,\n  owner: OWNER,\n  repo: REPO,\n  branch: BRANCH,\n  base_branch: BASE_BRANCH,\n  api: `https://api.github.com/repos/${OWNER}/${REPO}`,\n  image_url: a.image_url,\n  path_en: `src/content/blog/en/${slug}.md`,\n  path_he: `src/content/blog/he/${slug}.md`,\n  path_image: `public/blog/${slug}.jpg`,\n  md_en: file('en'),\n  md_he: file('he'),\n  published_date: date,\n  commit_message: `blog: add \"${String(a.title_en || slug).replace(/\"/g, \"'\")}\" (${slug}, en+he)\\n\\nApproved in the Gymon Blog review page (n8n), round ${a.round}.`,\n} }];\n" } },
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
      message: expr("<div style=\"font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px\"><h2 style=\"margin:0 0 8px\">Committed to <code>blog/incoming</code></h2><p><b>{{ $('Get article (approve)').item.json.title_en }}</b><br>{{ $('Get article (approve)').item.json.title_he }}</p><p>Commit: <a href=\"{{ $('Create commit').item.json.html_url }}\">{{ $('Create commit').item.json.sha }}</a></p><ul><li><code>{{ $('Build commit files').item.json.path_en }}</code></li><li><code>{{ $('Build commit files').item.json.path_he }}</code></li><li><code>{{ $('Build commit files').item.json.path_image }}</code></li></ul><p style=\"color:#555\">Nothing is live yet. To publish: merge <code>blog/incoming</code> into the site's main branch, then <code>npm run build</code> and push as usual.</p></div>"),
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
    parameters: { respondWith: 'json', responseBody: expr("{{ JSON.stringify({ ok: false, error: !$json.article_id ? 'Article not found.' : ($json.status !== 'pending_review' ? 'This article is ' + $json.status + ' — no action available.' : 'Invalid or expired link, or an empty note.') }) }}"), options: { responseCode: 409 } },
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
        value: { article_id: expr("{{ $('Get article (fix)').first().json.article_id }}"), slug: expr("{{ $('Get article (fix)').first().json.slug }}"), round: expr("{{ $('Get article (fix)').first().json.round }}"), feedback: expr("{{ $('Fix request').first().json.body.feedback }}"), route: expr("{{ $('Route').first().json.route }}"), title_en: expr("{{ $('Get article (fix)').first().json.title_en }}"), description_en: expr("{{ $('Get article (fix)').first().json.description_en }}"), body_en: expr("{{ $('Get article (fix)').first().json.body_en }}"), title_he: expr("{{ $('Get article (fix)').first().json.title_he }}"), description_he: expr("{{ $('Get article (fix)').first().json.description_he }}"), body_he: expr("{{ $('Get article (fix)').first().json.body_he }}"), image_url: expr("{{ $('Get article (fix)').first().json.image_url }}") },
        matchingColumns: [],
        schema: [{ id: "article_id", displayName: "article_id", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "slug", displayName: "slug", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "round", displayName: "round", required: false, defaultMatch: false, display: true, type: "number", canBeUsedToMatch: true }, { id: "feedback", displayName: "feedback", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "route", displayName: "route", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "title_en", displayName: "title_en", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "description_en", displayName: "description_en", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "body_en", displayName: "body_en", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "title_he", displayName: "title_he", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "description_he", displayName: "description_he", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "body_he", displayName: "body_he", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }, { id: "image_url", displayName: "image_url", required: false, defaultMatch: false, display: true, type: "string", canBeUsedToMatch: true }],
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

const rewriteModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Sonnet — rewrite', parameters: { model: MODEL_REWRITE, options: { temperature: 0.4, maxTokens: 14000 } }, credentials: CRED_OPENROUTER },
});

const rewriteParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: { name: 'Revised article format', parameters: { schemaType: 'fromJson', jsonSchemaExample: "{\n  \"title_en\": \"…\",\n  \"description_en\": \"…\",\n  \"image_alt_en\": \"…\",\n  \"body_en\": \"…\",\n  \"title_he\": \"…\",\n  \"description_he\": \"…\",\n  \"image_alt_he\": \"…\",\n  \"body_he\": \"…\"\n}" } },
});

const rewriteArticle = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Rewrite article',
    parameters: {
      promptType: 'define',
      text: expr("Reviewer note:\n{{ $('Fix request').first().json.body.feedback }}\n\nSources list (the only allowed links):\n{{ $('Get article (fix)').first().json.sources_json }}\n\nCURRENT ARTICLE\n\ntitle_en: {{ $('Get article (fix)').first().json.title_en }}\ndescription_en: {{ $('Get article (fix)').first().json.description_en }}\nimage_alt_en: {{ $('Get article (fix)').first().json.image_alt_en }}\nbody_en:\n{{ $('Get article (fix)').first().json.body_en }}\n\ntitle_he: {{ $('Get article (fix)').first().json.title_he }}\ndescription_he: {{ $('Get article (fix)').first().json.description_he }}\nimage_alt_he: {{ $('Get article (fix)').first().json.image_alt_he }}\nbody_he:\n{{ $('Get article (fix)').first().json.body_he }}"),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: "You revise an existing bilingual (English + Hebrew) Gymon blog article according to a reviewer's note. Gymon is a strength-training and workout-logging app.\n\nRules:\n- Change only what the note asks for, plus whatever must change so the two languages stay consistent. Keep everything else as it is.\n- Sources: use only URLs that already appear in the article or in the sources list. Never invent a source, number or study. If the note asks for a claim the sources do not support, leave it out.\n- Keep the Markdown structure; no \"# \" title in the body; no disclaimer; no sources section; no prices or competitor names; no medical promises.\n- Hebrew stays gender-neutral: plural imperative, impersonal forms (\"יש ל-\", \"כדאי\", \"אפשר\") — never gendered second-person singular, never slash forms.\n- The note may be written in Hebrew or English; it applies to both languages unless it names one.\n- Lengths: title_en 45–65 characters, title_he 40–60; description_en 140–160, description_he 110–150.\n\nReturn JSON with all eight fields, including the ones you did not change.\n" }] },
    },
    subnodes: { model: rewriteModel, outputParser: rewriteParser },
  },
  output: [{ output: { title_en: '…', description_en: '…', image_alt_en: '…', body_en: '…', title_he: '…', description_he: '…', image_alt_he: '…', body_he: '…' } }],
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
      text: expr("Article title: {{ $('Rewrite article').isExecuted ? $('Rewrite article').first().json.output.title_en : $('Get article (fix)').first().json.title_en }}\nDescription: {{ $('Rewrite article').isExecuted ? $('Rewrite article').first().json.output.description_en : $('Get article (fix)').first().json.description_en }}\n\nReviewer note (follow it within the style rules): {{ $('Fix request').first().json.body.feedback }}\n\nPrevious image prompt — make a clearly different image where the note asks: {{ $('Get article (fix)').first().json.image_prompt }}"),
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: "You write ONE prompt for a photographic hero image for a strength-training blog article. Output only the prompt: 70–120 words, English, no preamble.\n\nStyle (mandatory): dark, dramatic, near-monochrome — black, charcoal and silver, at most a faint cool tint. Low-key lighting from one hard light source, deep shadows, visible texture and fine film grain. Cinematic editorial gym photography. Wide 16:9 landscape with generous negative space.\n\nSubject: a concrete gym or strength scene that fits the article — e.g. hands chalking up over a barbell, plates on a rack, a loaded bar in shadow, a quiet rest moment on a bench, a silhouette mid-lift. If a person appears they are anonymous: silhouette, back view, cropped, or face in shadow. Never a recognisable face, never a celebrity or any real person.\n\nNever: text, letters, numbers, logos, brand names, watermarks, signage, phone or screen UI, readable labels on equipment; no bodybuilder posing or six-packs, no before/after, no scales, no medical imagery.\n" }] },
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
    parameters: { resource: 'image', operation: 'generate', modelId: IMAGE_MODEL, prompt: expr("{{ $json.text }}\n\nAbsolutely no text, letters, numbers, logos or watermarks anywhere in the image. Wide 16:9 landscape composition, dark and near-monochrome."), options: {} },
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

const revisedArticle = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Revised article',
    parameters: { mode: 'manual', assignments: { assignments: [
        { id: "a0", name: "status", value: "pending_review", type: "string" },
        { id: "a1", name: "round", value: expr("{{ (Number($('Get article (fix)').first().json.round) || 1) + 1 }}"), type: "number" },
        { id: "a2", name: "last_feedback", value: expr("{{ $('Fix request').first().json.body.feedback }}"), type: "string" },
        { id: "a3", name: "title_en", value: expr("{{ $('Rewrite article').isExecuted ? $('Rewrite article').first().json.output.title_en : $('Get article (fix)').first().json.title_en }}"), type: "string" },
        { id: "a4", name: "description_en", value: expr("{{ $('Rewrite article').isExecuted ? $('Rewrite article').first().json.output.description_en : $('Get article (fix)').first().json.description_en }}"), type: "string" },
        { id: "a5", name: "image_alt_en", value: expr("{{ $('Rewrite article').isExecuted ? $('Rewrite article').first().json.output.image_alt_en : $('Get article (fix)').first().json.image_alt_en }}"), type: "string" },
        { id: "a6", name: "body_en", value: expr("{{ $('Rewrite article').isExecuted ? $('Rewrite article').first().json.output.body_en : $('Get article (fix)').first().json.body_en }}"), type: "string" },
        { id: "a7", name: "title_he", value: expr("{{ $('Rewrite article').isExecuted ? $('Rewrite article').first().json.output.title_he : $('Get article (fix)').first().json.title_he }}"), type: "string" },
        { id: "a8", name: "description_he", value: expr("{{ $('Rewrite article').isExecuted ? $('Rewrite article').first().json.output.description_he : $('Get article (fix)').first().json.description_he }}"), type: "string" },
        { id: "a9", name: "image_alt_he", value: expr("{{ $('Rewrite article').isExecuted ? $('Rewrite article').first().json.output.image_alt_he : $('Get article (fix)').first().json.image_alt_he }}"), type: "string" },
        { id: "a10", name: "body_he", value: expr("{{ $('Rewrite article').isExecuted ? $('Rewrite article').first().json.output.body_he : $('Get article (fix)').first().json.body_he }}"), type: "string" },
        { id: "a11", name: "read_time_en", value: expr("{{ Math.max(1, Math.round(String(($('Rewrite article').isExecuted ? $('Rewrite article').first().json.output.body_en : $('Get article (fix)').first().json.body_en) || '').split(/\\s+/).filter(Boolean).length / 230)) }}"), type: "number" },
        { id: "a12", name: "read_time_he", value: expr("{{ Math.max(1, Math.round(String(($('Rewrite article').isExecuted ? $('Rewrite article').first().json.output.body_he : $('Get article (fix)').first().json.body_he) || '').split(/\\s+/).filter(Boolean).length / 200)) }}"), type: "number" },
        { id: "a13", name: "image_url", value: expr("{{ $('Upload image (fix)').isExecuted ? String($('Upload image (fix)').first().json.secure_url || '').replace('/upload/', '/upload/c_fill,g_auto,ar_16:9,w_1600,q_auto:good,f_jpg/') : $('Get article (fix)').first().json.image_url }}"), type: "string" },
        { id: "a14", name: "image_public_id", value: expr("{{ $('Upload image (fix)').isExecuted ? $('Upload image (fix)').first().json.public_id : $('Get article (fix)').first().json.image_public_id }}"), type: "string" },
        { id: "a15", name: "image_prompt", value: expr("{{ $('Image prompt (fix)').isExecuted ? $('Image prompt (fix)').first().json.text : $('Get article (fix)').first().json.image_prompt }}"), type: "string" }
      ] }, options: {} },
  },
  output: [{ status: 'pending_review', round: 2, title_en: '…', body_en: '…', title_he: '…', body_he: '…', image_url: 'https://res.cloudinary.com/…' }],
});

const recheckModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Haiku — re-check', parameters: { model: MODEL_FAST, options: { temperature: 0 } }, credentials: CRED_OPENROUTER },
});

const recheckParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: { name: 'Re-check format', parameters: { schemaType: 'fromJson', jsonSchemaExample: "{\n  \"gendered_hebrew\": [\n    \"\\\"נסה להוסיף\\\" — masculine singular imperative\"\n  ],\n  \"medical_promises\": [\n    \"\\\"prevents injuries\\\" — prevention promise\"\n  ],\n  \"unsupported_claims\": [\n    \"\\\"increases strength by 20%\\\" — no link\"\n  ],\n  \"other\": [\n    \"mentions a competitor app\"\n  ],\n  \"verdict\": \"needs_attention\"\n}" } },
});

const recheck = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Compliance re-check',
    parameters: {
      promptType: 'define',
      text: expr("ENGLISH\nTitle: {{ $json.title_en }}\nDescription: {{ $json.description_en }}\n\n{{ $json.body_en }}\n\nHEBREW\nTitle: {{ $json.title_he }}\nDescription: {{ $json.description_he }}\n\n{{ $json.body_he }}\n\nAllowed URLs:\n{{ $('Get article (fix)').first().json.source_url }}\n{{ (JSON.parse($('Get article (fix)').first().json.sources_json || '[]')).map(s => s.url).join('\\n') }}"),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: "You are a strict reviewer for a bilingual fitness blog. Check the English and Hebrew article below and REPORT problems only — do not rewrite.\n\nReport as lists of short items (\"quoted phrase — 3 to 8 word reason\"):\n- gendered_hebrew: Hebrew phrases that use gendered second-person singular (e.g. נסה/נסי, הזן/הזיני, אתה/את, תרגיש/תרגישי, slash forms like מתאמן/ת) or that address one gender only.\n- medical_promises: phrases that promise cures, prevention or guaranteed results, or give diagnosis/treatment advice.\n- unsupported_claims: specific numbers or factual claims in the English text that have no inline link.\n- other: links whose URL is not in the \"Allowed URLs\" list, competitor app or brand names, prices, a disclaimer or sources section inside the body, anything off-brand.\n\nEmpty lists when clean. verdict: \"ok\" when all lists are empty, otherwise \"needs_attention\". JSON only.\n" }] },
    },
    subnodes: { model: recheckModel, outputParser: recheckParser },
  },
  output: [{ output: { gendered_hebrew: [], medical_promises: [], unsupported_claims: [], other: [], verdict: 'ok' } }],
});

const revisedRecord = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Revised record',
    parameters: { mode: 'raw', jsonOutput: expr("{{ JSON.stringify(Object.assign({}, $('Revised article').first().json, { check_notes: JSON.stringify($json.output || {}) })) }}"), options: {} },
  },
  output: [{ status: 'pending_review', round: 2, check_notes: '{}' }],
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



const label1 = sticky('## 1 · Collect sources\n13 English RSS feeds → drop used / older than 30 days / off-topic → up to 30 candidates. Output shows `counts`.', [getUsedSources, feedList, splitFeeds, readFeed, shortlist, anyCandidates], { color: 7 });
const label2 = sticky('## 2 · Pick topic\nSonnet picks one candidate and plans an evergreen SEO topic (slug, keywords). `skip` ends the run.', [pickTopic, hasTopic, topicPlan], { color: 7 });
const label3 = sticky('## 3 · Research + write\nTavily: source + 3 basic searches + 2 pages (capped) → one Sonnet call writes EN → Sonnet adapts HE → Haiku check.', [fetchSource, searchQueries, searchWeb, pickPages, readPages, researchPack, writeArticle, hebrewVersion, complianceCheck], { color: 7 });
const label4 = sticky('## 4 · Hero image\nSonnet prompt → Gemini → Cloudinary (served as 16:9 JPEG).', [imagePrompt, generateImage, uploadImage], { color: 7 });
const label5 = sticky('## 5 · Save draft + email\nRow in gymon_blog_articles, source in gymon_blog_sources, review email to gymon.official@gmail.com.', [articleRecord, insertArticle, logSource, emailNew, loadForEmail, buildEmail, sendReviewEmail], { color: 7 });
const label7 = sticky('## 6 · Review page (GET /webhook/gymon-blog/review)\nToken-checked page: both languages, sources, versions, Approve / Send for fixes.', [getArticleReview, getVersionsReview, renderPage, respondPage], { color: 7 });
const label8 = sticky('## 7 · Approve → GitHub (POST /webhook/gymon-blog/approve)\nOne commit (en.md, he.md, jpg) to gymon-site branch blog/incoming. ⚠️ needs a GitHub credential.', [getArticleApprove, canApprove, markApproved, buildFiles, getBranch, createCommit, markCommitted], { color: 7 });
const label9 = sticky('## 8 · Fix request → redo (POST /webhook/gymon-blog/fix)\nHaiku routes text / image / both → previous version saved → redo → re-check → new email.', [getArticleFix, canFix, routeFix, saveVersion, rewriteArticle, revisedArticle, updateArticle], { color: 7 });

const noteOverview = sticky("## Gymon Blog — Articles\n**Generate (Sun + Wed 09:00, or Run once):** 13 English RSS feeds → shortlist (no reused sources) → Sonnet picks a topic → Tavily: source + 3 searches + 2 pages (capped) → Sonnet writes EN → Sonnet adapts to gender-neutral HE → Haiku flags issues → Gemini hero image → Cloudinary (16:9 JPEG) → Data table `gymon_blog_articles` → review email to gymon.official@gmail.com.\n\n**Review page** `GET /webhook/gymon-blog/review?id=&t=` (token per article).\n**Approve** `POST /webhook/gymon-blog/approve` → one commit (en.md + he.md + jpg) to `OsherAlon/gymon-site` branch `blog/incoming`.\n**Fix** `POST /webhook/gymon-blog/fix` → Haiku routes text / image / both → previous version saved to `gymon_blog_versions` → redo → new email.\n\n⚠️ The GitHub nodes need a GitHub credential (fine-grained token, Contents: read & write on gymon-site).", [], { color: 7, width: 520, height: 460 });

export default workflow('gymon-blog-articles', 'Gymon Blog — Articles')
  .add(scheduleTrigger)
  .to(getUsedSources)
  .add(manualTrigger)
  .to(getUsedSources)
  .add(getUsedSources)
  .to(feedList)
  .to(splitFeeds)
  .to(readFeed)
  .to(shortlist)
  .to(anyCandidates.onTrue(pickTopic))
  .add(pickTopic)
  .to(hasTopic.onTrue(
    topicPlan
      .to(fetchSource)
      .to(searchQueries)
      .to(searchWeb)
      .to(pickPages)
      .to(readPages)
      .to(researchPack)
      .to(writeArticle)
      .to(hebrewVersion)
      .to(complianceCheck)
      .to(imagePrompt)
      .to(generateImage)
      .to(uploadImage)
      .to(articleRecord)
      .to(insertArticle)
      .to(logSource)
      .to(emailNew)
      .to(loadForEmail)
  ))
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
      .onTrue(rewriteArticle.to(needsImage))
      .onFalse(needsImage)))
    .onFalse(rejectFix))
  .add(needsImage
    .onTrue(fixImagePrompt.to(generateImageFix).to(uploadImageFix).to(revisedArticle))
    .onFalse(revisedArticle))
  .add(revisedArticle)
  .to(recheck)
  .to(revisedRecord)
  .to(updateArticle)
  .to(emailRevised)
  .to(loadForEmail)
  .add(noteOverview)
  .add(label1)
  .add(label2)
  .add(label3)
  .add(label4)
  .add(label5)
  .add(label7)
  .add(label8)
  .add(label9);
