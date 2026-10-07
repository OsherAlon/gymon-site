import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { run, nodeCode } from './harness.mjs';

const SITE = (p) => fileURLToPath(new URL(`../../../${p}`, import.meta.url));
// The workflow still ships the v1 article contract (schemaVersion 1) until the n8n phase of the v2
// redesign; the site sample moved to v2 on 2026-10-07, so these tests use a frozen v1 copy.
const sample = (lang) => JSON.parse(readFileSync(fileURLToPath(new URL(`./fixtures/v1/${lang}/estimate-one-rep-max.json`, import.meta.url)), 'utf8'));
const clone = (o) => JSON.parse(JSON.stringify(o));
// The research text the sample's quotes come from (the real PMC abstract + Table 1 line).
const RESEARCH = `### Page 1 [EXTRACTED] [PRIMARY]
https://pmc.ncbi.nlm.nih.gov/articles/PMC4042664/
Eight weightlifters and eight endurance runners each completed a one repetition maximum test on the leg press and completed repetitions to fatigue at 90, 80 and 70% of their one repetition maximum. The endurance runners completed significantly more repetitions than the weightlifters at 70% (39.9 ± 17.6 versus 17.9 ± 2.8; p &lt; 0.05) and 80% (19.8 ± 6.4 versus 11.8 ± 2.7; p &lt; 0.05) of their one repetition maximum but not at 90% (10.8 ± 3.9 versus 7.0 ± 2.1; p &gt; 0.05) of one repetition maximum.
Epley [ 8 ] A poundage chart, not based on scientific research.
DOI 10.5604/20831862.1099047 PMID 24899782
### Search results (snippets only)
1. [SNIPPET] [PRIMARY] Strength Testing—Predicting a One-Rep Max from Reps-to-Fatigue
   https://doi.org/10.1080/07303084.1993.10606684 DOI 10.1080/07303084.1993.10606684`;

const asPipeline = (a) => {
  const x = clone(a);
  delete x.sample;
  return x;
};
const bundle = (over = {}) => ({
  mode: 'new',
  plan: { slug: 'estimate-one-rep-max' },
  article_en: asPipeline(sample('en')),
  article_he: asPipeline(sample('he')),
  research_text: RESEARCH,
  allowed_urls: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC4042664/', 'https://doi.org/10.1080/07303084.1993.10606684'],
  read_urls: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC4042664/'],
  published: [],
  ...over,
});

test.skip('the shipped Code nodes contain the site validator (SKIPPED: site is on article schema v2, the workflow on v1 until it is migrated)', () => {
  const code = nodeCode('Validate articles');
  const site = readFileSync(SITE('src/lib/article/validate.mjs'), 'utf8');
  // A distinctive line of the site validator must be present verbatim (minus indentation).
  const line = site.split('\n').find((l) => l.includes('exactly one Gymon-unique block')).trim();
  assert.ok(code.includes(line));
  assert.doesNotMatch(code, /\\u[0-9a-f]{4}/i, 'no \\u escapes (n8n MCP gotcha)');
  assert.doesNotMatch(code.replace(/^\s*\/\/.*$/gm, ''), /new URL\(/, 'no new URL() (n8n Code-node gotcha)');
});

test('Validate articles: the sample pair passes in pipeline mode and builds the fact-check input', () => {
  const [{ json }] = run('Validate articles', { input: [bundle()] });
  assert.deepEqual(json.validation.en.errors, []);
  assert.deepEqual(json.validation.he.errors, []);
  assert.deepEqual(json.validation.cross, []);
  assert.match(json.factcheck_input, /U1 \(tldr\)/);
  assert.match(json.factcheck_input, /\[r1\] "Eight weightlifters/);
  assert.match(json.factcheck_input, /HEBREW ARTICLE/);
});

test('Validate articles: an invented number in a quote, an off-list URL and a YMYL title are errors', () => {
  const b = bundle();
  b.article_en.references[0].quote += ' 55.5% more';
  b.article_en.title = 'Creatine and your 1RM';
  b.allowed_urls = [b.allowed_urls[0]];
  const [{ json }] = run('Validate articles', { input: [b] });
  const e = json.validation.en.errors.map((x) => `${x.path}: ${x.message}`).join('\n');
  assert.match(e, /number 55\.5 appears in no source text/);
  assert.match(e, /references\[1\]\.url: not in the research pack/);
  assert.match(e, /YMYL topic guard/);
});

test('Validate articles: Hebrew bidi/gender lint and EN/HE structure check', () => {
  const b = bundle();
  b.article_he.sections[0].blocks[0].text = 'נסה לבצע 8–12 חזרות, או 3×10.';
  b.article_he.sections.pop();
  const [{ json }] = run('Validate articles', { input: [b] });
  const w = json.validation.he.warnings.map((x) => x.message).join('\n');
  assert.match(w, /gendered form "נסה"/);
  assert.match(w, /8–12/);
  assert.match(w, /3×10/);
  assert.ok(json.validation.cross.some((c) => /different number of sections/.test(c.message)));
});

test('Reference checks → Reference results: 404 URL, wrong DOI and unresolved PMID become errors; 403 is a warning', () => {
  const validated = run('Validate articles', { input: [bundle()] })[0].json;
  const checks = run('Reference checks', { nodes: { 'Validate articles': [validated] } }).map((i) => i.json);
  assert.deepEqual(checks.map((c) => c.kind), ['url', 'doi', 'pmid', 'url', 'doi']);
  assert.match(checks[1].url, /^https:\/\/api\.crossref\.org\/works\/10\.5604%2F20831862\.1099047\?mailto=/);
  const answers = [
    { statusCode: 404, body: 'Not found' },
    { statusCode: 200, body: JSON.stringify({ message: { title: ['Cholesterol and the heart: a cohort'] } }) },
    { statusCode: 200, body: JSON.stringify({ result: { '24899782': { error: 'cannot get document summary' } } }) },
    { statusCode: 403, body: 'Forbidden' },
    { statusCode: 200, body: JSON.stringify({ message: { title: ['Strength Testing—Predicting a One-Rep Max from Reps-to-Fatigue'] } }) },
  ];
  const [{ json }] = run('Reference results', { input: answers, nodes: { 'Validate articles': [validated], 'Reference checks': checks } });
  const e = json.validation.en.errors.map((x) => x.message).join('\n');
  assert.match(e, /HTTP 404: the source URL does not resolve/);
  assert.match(e, /DOI points to a different paper/);
  assert.match(e, /PMID 24899782 does not resolve/);
  assert.ok(json.validation.en.warnings.some((w) => /HTTP 403: could not verify/.test(w.message)));
  assert.equal(json.ref_report.find((r) => r.kind === 'doi' && r.ref === 'r2').result, 'ok');
  assert.equal(json.counts.errors, 3);
});

test('Reference results: all sources resolving gives zero blocking errors', () => {
  const validated = run('Validate articles', { input: [bundle()] })[0].json;
  const checks = run('Reference checks', { nodes: { 'Validate articles': [validated] } }).map((i) => i.json);
  const answers = [
    { statusCode: 200, body: '<html></html>' },
    { statusCode: 200, body: JSON.stringify({ message: { title: ['The relationship between the number of repetitions performed at given intensities is different in endurance and strength trained athletes'] } }) },
    { statusCode: 200, body: JSON.stringify({ result: { '24899782': { title: 'The relationship between the number of repetitions performed at given intensities is different in endurance and strength trained athletes.' } } }) },
    { statusCode: 200, body: '<html></html>' },
    { statusCode: 200, body: JSON.stringify({ message: { title: ['Strength Testing—Predicting a One-Rep Max from Reps-to-Fatigue'] } }) },
  ];
  const [{ json }] = run('Reference results', { input: answers, nodes: { 'Validate articles': [validated], 'Reference checks': checks } });
  assert.equal(json.counts.errors, 0);
  const [{ json: checked }] = run('Checked article', { input: [{ output: { entailment: ['U2 — x'] } }], nodes: { 'Reference results': [json] } });
  assert.equal(checked.blocking, 0, 'a model flag never blocks Approve');
});

test('Topic plan: the guard stops YMYL and off-pillar topics before research', () => {
  const short = { candidates: [{ link: 'https://x.org/a', title: 'A' }], used_slugs: [], published: [] };
  const ok = run('Topic plan', {
    input: [{ output: { candidate_index: 0, topic: 'How many sets per muscle per week?', slug: 'sets-per-muscle-per-week', pillar: 'sets-reps-volume', ymyl_level: 'low', intent: 'know', length_band: '900-1400', tags: ['sets'], primary_query_en: 'sets per muscle per week', primary_query_he: 'כמה סטים לכל שריר בשבוע', gymon_element: { kind: 'plan-logic' } } }],
    nodes: { 'Shortlist candidates': [short] },
  })[0].json;
  assert.equal(ok.guard_ok, true);
  assert.ok(ok.tags.length >= 2 && ok.tags.length <= 4, 'a lone tag is padded to the 2–4 the schema needs');
  for (const bad of [
    { topic: 'How much creatine should lifters take?', pillar: 'sets-reps-volume', ymyl_level: 'low' },
    { topic: 'Training around knee pain', pillar: 'plans-splits', ymyl_level: 'low' },
    { topic: 'Rest between sets', pillar: 'nutrition', ymyl_level: 'low' },
    { topic: 'Rest between sets', pillar: 'sets-reps-volume', ymyl_level: 'medium' },
    { topic: 'Rest between sets', pillar: 'sets-reps-volume', ymyl_level: 'low', primary_query_he: 'אימון בהריון' },
  ]) {
    const r = run('Topic plan', { input: [{ output: { candidate_index: 0, slug: 'x-y', gymon_element: { kind: 'plan-logic' }, ...bad } }], nodes: { 'Shortlist candidates': [short] } })[0].json;
    assert.equal(r.guard_ok, false, JSON.stringify(bad));
  }
});

test('Parse + Prepare (new): code owns tier, fullTextRead, dates and the closed key order', () => {
  const en = sample('en');
  const reply = '```json\n' + JSON.stringify({ ...en, references: en.references.map(({ tier, fullTextRead, ...r }) => r), createdAt: '1999-01-01', sample: true }) + '\n```';
  const parsed = run('Parse article (EN)', { input: [{ text: reply }] })[0].json;
  assert.equal(parsed.article.createdAt, undefined, 'writer cannot set code-owned fields');
  const he = sample('he');
  const plan = { slug: 'estimate-one-rep-max', pillar: 'tools', tags: ['one-rep-max', 'strength'], intent: 'do', length_band: '600-900', published: [] };
  const pack = { research: RESEARCH, allowed_urls: bundle().allowed_urls, read_urls: bundle().read_urls };
  const [{ json }] = run('Prepare (new)', {
    input: [{ text: JSON.stringify(he) }],
    nodes: { 'Topic plan': [plan], 'Research pack': [pack], 'Parse article (EN)': [parsed] },
  });
  assert.equal(json.article_en.createdAt, '2026-10-07');
  assert.equal(json.article_en.reviewedAt, null);
  assert.equal(json.article_en.sample, undefined);
  assert.equal(json.article_en.references[0].tier, 'PRIMARY');
  assert.equal(json.article_en.references[0].fullTextRead, true);
  assert.equal(json.article_en.references[1].fullTextRead, false);
  assert.deepEqual(json.article_he.references, json.article_en.references, 'Hebrew gets the English registry');
  assert.deepEqual(Object.keys(json.article_en).slice(0, 3), ['schemaVersion', 'lang', 'slug']);
  // A truncated reply fails loudly instead of producing a half article.
  assert.throws(() => run('Parse article (EN)', { input: [{ text: '{"title": "How to' }] }), /invalid JSON|no JSON object/);
});

test('Parse article (EN): reads an OpenRouter completion, and names a max_tokens cut-off (execution 1539)', () => {
  const en = sample('en');
  const ok = { choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: JSON.stringify(en) } }], usage: { completion_tokens: 9000 } };
  const parsed = run('Parse article (EN)', { input: [ok] })[0].json;
  assert.equal(parsed.article.title, en.title);
  assert.equal(parsed.references.length, en.references.length);
  const cut = { choices: [{ finish_reason: 'length', message: { content: '{"title": "How to' } }], usage: { completion_tokens: 16000, completion_tokens_details: { reasoning_tokens: 15200 } } };
  assert.throws(() => run('Parse article (EN)', { input: [cut] }), /cut off at max_tokens.*reasoning_tokens/);
  assert.throws(() => run('Parse article (EN)', { input: [{ error: { message: 'x' } }] }), /no completion in the response/);
});

test('apply flag: set from the cta section when the writer omits it, and copied to Hebrew (execution 1541)', () => {
  const en = sample('en');
  const noFlag = { ...en, sections: en.sections.map(({ apply, ...s }) => s) };
  const parsed = run('Parse article (EN)', { input: [{ text: JSON.stringify(noFlag) }] })[0].json;
  const ctaIdx = en.sections.findIndex((s) => s.blocks.some((b) => b.type === 'cta'));
  assert.deepEqual(parsed.article.sections.map((s) => s.apply), en.sections.map((_, i) => i === ctaIdx));
  const he = sample('he');
  const heNoFlag = { ...he, sections: he.sections.map(({ apply, ...s }) => s) };
  const plan = { slug: 'estimate-one-rep-max', pillar: 'tools', tags: ['one-rep-max', 'strength'], intent: 'do', length_band: '600-900', published: [] };
  const pack = { research: RESEARCH, allowed_urls: bundle().allowed_urls, read_urls: bundle().read_urls };
  const [{ json }] = run('Prepare (new)', {
    input: [{ text: JSON.stringify(heNoFlag) }],
    nodes: { 'Topic plan': [plan], 'Research pack': [pack], 'Parse article (EN)': [parsed] },
  });
  assert.deepEqual(json.article_he.sections.map((s) => s.apply), json.article_en.sections.map((s) => s.apply));
  assert.equal(json.article_en.sections.filter((s) => s.apply).length, 1);
});

test('Build commit files: writes build-valid JSON with review date, and refuses a file the build would reject', () => {
  const row = {
    article_id: 'x', slug: 'estimate-one-rep-max', round: 1, title_en: 'T',
    article_en: JSON.stringify(asPipeline(sample('en'))), article_he: JSON.stringify(asPipeline(sample('he'))),
    image_alt_en: 'Alt text in English for the image', image_alt_he: 'טקסט חלופי לתמונה בעברית',
  };
  const nodes = { 'Get article (approve)': [row], 'Approve request': [{ body: { checklist: [true, true, true, true, true] } }] };
  const [{ json }] = run('Build commit files', { nodes });
  assert.equal(json.path_en, 'src/content/articles/en/estimate-one-rep-max.json');
  const en = JSON.parse(json.md_en);
  assert.equal(en.reviewedAt, '2026-10-07');
  assert.equal(en.image, '/blog/estimate-one-rep-max.jpg');
  assert.equal(en.imageAiGenerated, true);
  assert.match(json.commit_message, /\[true,true,true,true,true\]/);
  const bad = clone(row);
  const art = JSON.parse(bad.article_en);
  art.sections[0].blocks.push({ type: 'scrollytelling' });
  bad.article_en = JSON.stringify(art);
  assert.throws(() => run('Build commit files', { nodes: { ...nodes, 'Get article (approve)': [bad] } }), /would fail the site build/);
});

test('Every shipped Code node at least compiles (catches duplicate declarations and syntax slips)', async () => {
  const { readFileSync } = await import('node:fs');
  const sdk = readFileSync(new URL('../workflow.sdk.ts', import.meta.url), 'utf8');
  const names = [...sdk.matchAll(/name: '([^']+)', parameters: \{ mode: 'runOnceForAllItems', jsCode: /g)].map((m) => m[1]);
  assert.ok(names.length >= 17, `found ${names.length} Code nodes`);
  for (const n of names) assert.doesNotThrow(() => new Function('$', '$input', '$now', nodeCode(n)), n);
});

test('Research pack: marks extracted pages for fullTextRead and tiers every URL', () => {
  const [{ json }] = run('Research pack', {
    input: [{ results: [{ url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1/?utm_source=x', raw_content: 'Page text 39.9' }] }],
    nodes: {
      'Topic plan': [{ source_url: 'https://www.strongerbyscience.com/a/', source_title: 'S' }],
      'Fetch source article': [{ results: [{ raw_content: 'Source text' }] }],
      'Pick pages to read': [{ urls: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC1/', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1/'], digest: [{ url: 'https://acsm.org/x', title: 'ACSM', snippet: 's' }] }],
    },
  });
  assert.deepEqual(json.read_urls, ['https://www.strongerbyscience.com/a/', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1/']);
  assert.ok(json.allowed_with_tier.includes('[AUTHORITY] [SNIPPET] https://acsm.org/x'));
  assert.ok(json.allowed_with_tier.includes('[PRIMARY] [EXTRACTED] https://pmc.ncbi.nlm.nih.gov/articles/PMC1/'));
});
