// Prepare (new) — assembles the two full article objects in the site's closed schema, plus
// everything the shared validation chain needs. Code owns: lang, slug, pillar, tags, dates,
// image fields, editor, and the reference tier / fullTextRead (from the research pack).
/*__LIB_LITE__*/
/*__LLM_TEXT__*/
const plan = $('Topic plan').first().json;
const pack = $('Research pack').first().json;
const en = $('Parse article (EN)').first().json;
const he = writerFields(parseLooseJson(llmText($input.first().json, 'Hebrew version'), 'Hebrew version'));
const today = $now.setZone('Asia/Jerusalem').toFormat('yyyy-MM-dd');
const refs = codeReferences(en.references, pack.read_urls);
const article_en = canonical({ ...codeFields(plan, 'en', today), ...en.article, references: refs });
const article_he = canonical({ ...codeFields(plan, 'he', today), ...he, references: refs });
return [{ json: {
  mode: 'new',
  plan,
  article_en,
  article_he,
  research_text: pack.research,
  allowed_urls: pack.allowed_urls,
  read_urls: pack.read_urls,
  published: plan.published || [],
}, pairedItem: { item: 0 } }];
