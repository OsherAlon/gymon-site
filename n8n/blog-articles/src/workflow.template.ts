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
// maxTokens on Sonnet 5.5 must cover hidden reasoning + the visible JSON: execution 1531 billed 6,000
// completion tokens for ~2,600 tokens of visible text and was cut off (finish_reason: length).
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
    parameters: { mode: 'raw', jsonOutput: __FEEDS_JSON__ },
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
  config: { name: 'Shortlist candidates', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_SHORTLIST__ } },
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
  config: { name: 'Topic plan format', parameters: { schemaType: 'fromJson', jsonSchemaExample: __TOPIC_EXAMPLE__ } },
});

const pickTopic = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Pick topic',
    parameters: {
      promptType: 'define',
      text: expr(__TOPIC_USER__),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: __TOPIC_SYSTEM__ }] },
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
        { id: 'tp3', name: 'slug', value: expr(__SLUG_EXPR__), type: 'string' },
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
  config: { name: 'Search queries (max 3)', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_QUERIES__ } },
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
  config: { name: 'Pick pages to read', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_PICK__ } },
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
  config: { name: 'Research pack', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_PACK__ } },
  output: [{ research: '### Source article…', allowed_urls: ['https://example.org/a'], research_chars: 12000 }],
});

const writerModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Sonnet — writer', parameters: { model: MODEL_WRITE, options: { temperature: 0.6, maxTokens: 16000 } }, credentials: CRED_OPENROUTER },
});

const writerParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: { name: 'Article format (EN)', parameters: { schemaType: 'fromJson', jsonSchemaExample: __WRITER_EXAMPLE__ } },
});

const writeArticle = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Write article (EN)',
    parameters: {
      promptType: 'define',
      text: expr(__WRITER_USER__),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: __WRITER_SYSTEM__ }] },
    },
    subnodes: { model: writerModel, outputParser: writerParser },
  },
  output: [{ output: { title: 'How long to rest between sets for strength', description: '…', image_alt: '…', body_md: 'Intro…\n\n## Section', sources: [{ title: 'Meta-analysis', url: 'https://example.org/a' }] } }],
});

const hebrewModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Sonnet — Hebrew', parameters: { model: MODEL_WRITE, options: { temperature: 0.4, maxTokens: 16000 } }, credentials: CRED_OPENROUTER },
});

const hebrewParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: { name: 'Article format (HE)', parameters: { schemaType: 'fromJson', jsonSchemaExample: __HEBREW_EXAMPLE__ } },
});

const hebrewVersion = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Hebrew version',
    parameters: {
      promptType: 'define',
      text: expr(__HEBREW_USER__),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: __HEBREW_SYSTEM__ }] },
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
  config: { name: 'Check format', parameters: { schemaType: 'fromJson', jsonSchemaExample: __CHECK_EXAMPLE__ } },
});

const complianceCheck = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Compliance check',
    parameters: {
      promptType: 'define',
      text: expr(__CHECK_USER__),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: __CHECK_SYSTEM__ }] },
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
      text: expr(__IMAGE_USER__),
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: __IMAGE_SYSTEM__ }] },
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
    parameters: { resource: 'image', operation: 'generate', modelId: IMAGE_MODEL, prompt: expr(__GEMINI_PROMPT__), options: {} },
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
      assignments: { assignments: __RECORD_ASSIGNMENTS__ },
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
  config: { name: 'Build review email', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_EMAIL__ } },
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
  config: { name: 'Render review page', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_PAGE__ } },
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
    parameters: { respondWith: 'json', responseBody: expr(__REJECT_BODY__), options: { responseCode: 409 } },
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
  config: { name: 'Build commit files', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_FILES__ } },
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
      jsonBody: expr(__TREE_BODY__),
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
      message: expr(__COMMITTED_HTML__),
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
    parameters: { respondWith: 'json', responseBody: expr(__REJECT_BODY__), options: { responseCode: 409 } },
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
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: __ROUTER_SYSTEM__ }] },
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
        value: __VERSION_VALUES__,
        matchingColumns: [],
        schema: __VERSION_SCHEMA__,
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
  config: { name: 'Sonnet — rewrite', parameters: { model: MODEL_REWRITE, options: { temperature: 0.4, maxTokens: 24000 } }, credentials: CRED_OPENROUTER },
});

const rewriteParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: { name: 'Revised article format', parameters: { schemaType: 'fromJson', jsonSchemaExample: __REWRITE_EXAMPLE__ } },
});

const rewriteArticle = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Rewrite article',
    parameters: {
      promptType: 'define',
      text: expr(__REWRITE_USER__),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: __REWRITE_SYSTEM__ }] },
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
      text: expr(__FIX_IMAGE_USER__),
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: __IMAGE_SYSTEM__ }] },
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
    parameters: { resource: 'image', operation: 'generate', modelId: IMAGE_MODEL, prompt: expr(__GEMINI_PROMPT__), options: {} },
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

const altModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
  version: 1,
  config: { name: 'Haiku — image alt', parameters: { model: MODEL_FAST, options: { temperature: 0.2 } }, credentials: CRED_OPENROUTER },
});

const altParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: { name: 'Image alt format', parameters: { schemaType: 'fromJson', jsonSchemaExample: '{"image_alt_en": "A barbell with matte black plates in a concrete gym", "image_alt_he": "מוט עם משקולות שחורות בחדר כושר מבטון"}' } },
});

const imageAltFix = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Image alt (fix)',
    parameters: {
      promptType: 'define',
      text: expr("Image prompt:\n{{ $('Image prompt (fix)').first().json.text }}"),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: __ALT_SYSTEM__ }] },
    },
    subnodes: { model: altModel, outputParser: altParser },
  },
  output: [{ output: { image_alt_en: 'A barbell with matte black plates in a concrete gym', image_alt_he: 'מוט עם משקולות שחורות בחדר כושר מבטון' } }],
});

const revisedArticle = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Revised article',
    parameters: { mode: 'manual', assignments: { assignments: __REVISED_ASSIGNMENTS__ }, options: {} },
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
  config: { name: 'Re-check format', parameters: { schemaType: 'fromJson', jsonSchemaExample: __CHECK_EXAMPLE__ } },
});

const recheck = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.7,
  config: {
    name: 'Compliance re-check',
    parameters: {
      promptType: 'define',
      text: expr(__RECHECK_USER__),
      hasOutputParser: true,
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: __CHECK_SYSTEM__ }] },
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

const noteOverview = sticky(__NOTE_OVERVIEW__, [], { color: 7, width: 520, height: 460 });

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
    .onTrue(fixImagePrompt.to(generateImageFix).to(uploadImageFix).to(imageAltFix).to(revisedArticle))
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
