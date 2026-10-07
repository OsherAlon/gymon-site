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
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Topic plan', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_TOPIC_PLAN__ } },
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
      { id: 'wrs', name: 'system', value: __WRITER_SYSTEM__, type: 'string' },
      { id: 'wru', name: 'user', value: expr(__WRITER_USER__), type: 'string' },
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
  config: { name: 'Parse article (EN)', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_PARSE_EN__ } },
  output: [{ article: { title: '…' }, references: [] }],
});

const hebrewRequest = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Hebrew request',
    parameters: { mode: 'manual', assignments: { assignments: [
      { id: 'hrs', name: 'system', value: __HEBREW_SYSTEM__, type: 'string' },
      { id: 'hru', name: 'user', value: expr(__HEBREW_USER__), type: 'string' },
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
  config: { name: 'Prepare (new)', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_PREPARE_NEW__ } },
  output: [{ mode: 'new', article_en: {}, article_he: {}, research_text: '…', allowed_urls: [], read_urls: [], published: [] }],
});

const validateArticles = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Validate articles', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_VALIDATE__ } },
  output: [{ mode: 'new', validation: { en: { errors: [], warnings: [] }, he: { errors: [], warnings: [] }, cross: [] } }],
});

const referenceChecks = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Reference checks', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_REF_CHECKS__ } },
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
  config: { name: 'Reference results', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_REF_RESULTS__ } },
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
  config: { name: 'Fact-check format', parameters: { schemaType: 'fromJson', jsonSchemaExample: __CHECK_EXAMPLE__ } },
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
      messages: { messageValues: [{ type: 'SystemMessagePromptTemplate', message: __CHECK_SYSTEM__ }] },
    },
    subnodes: { model: checkModel, outputParser: checkParser },
  },
  output: [{ output: { entailment: [], medical_promises: [], gendered_hebrew: [], fabricated_experience: [], literal_translation: [], other: [], verdict: 'ok' } }],
});

const checkedArticle = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Checked article', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_CHECKED__ } },
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
        { type: 'SystemMessagePromptTemplate', message: __ALT_SYSTEM__ },
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
  config: { name: 'Article record', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_ARTICLE_RECORD__ } },
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
        conditions: [{ leftValue: expr(__APPROVE_CONDITION__), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
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
        value: {
          status: 'approved',
          published_date: expr("{{ $now.setZone('Asia/Jerusalem').toFormat('yyyy-MM-dd') }}"),
          reviewed_at: expr("{{ $now.setZone('Asia/Jerusalem').toISO() }}"),
          review_checklist: expr(__CHECKLIST_RECORD__),
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

const rewriteRequest = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Rewrite request',
    parameters: { mode: 'manual', assignments: { assignments: [
      { id: 'rrs', name: 'system', value: __REWRITE_SYSTEM__, type: 'string' },
      { id: 'rru', name: 'user', value: expr(__REWRITE_USER__), type: 'string' },
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
  config: { name: 'Prepare (fix)', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_PREPARE_FIX__ } },
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
        { type: 'SystemMessagePromptTemplate', message: __ALT_SYSTEM__ },
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
  config: { name: 'Revised record', parameters: { mode: 'runOnceForAllItems', jsCode: __CODE_REVISED_RECORD__ } },
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

const noteOverview = sticky(__NOTE_OVERVIEW__, [], { color: 7, width: 560, height: 520 });

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
