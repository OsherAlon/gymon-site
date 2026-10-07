// Prepare (fix) — the stored or rewritten article pair, re-attached to the FIXED reference
// registry and code fields, for the same validation chain a new article goes through.
/*__LIB_LITE__*/
const row = $('Get article (fix)').first().json;
const stored_en = JSON.parse(row.article_en || '{}');
const stored_he = JSON.parse(row.article_he || '{}');
let en = writerFields(stored_en);
let he = writerFields(stored_he);
if ($('Rewrite article').isExecuted) {
  const r = parseLooseJson($('Rewrite article').first().json.text, 'Rewrite article');
  if (r.article_en) en = writerFields(r.article_en);
  if (r.article_he) he = writerFields(r.article_he);
}
const keep = (stored) => {
  const out = {};
  for (const k of CODE_FIELDS) if (stored[k] !== undefined) out[k] = stored[k];
  return out;
};
let ctx = {};
try { ctx = JSON.parse(row.context_json || '{}'); } catch (e) { ctx = {}; }
return [{ json: {
  mode: 'fix',
  route: $('Route').first().json.route,
  article_id: row.article_id,
  article_en: canonical({ ...keep(stored_en), ...en, imageAlt: stored_en.imageAlt, references: stored_en.references }),
  article_he: canonical({ ...keep(stored_he), ...he, imageAlt: stored_he.imageAlt, references: stored_en.references }),
  research_text: row.research_pack || '',
  allowed_urls: ctx.allowed_urls || [],
  read_urls: ctx.read_urls || [],
  published: ctx.published || [],
  plan: ctx.plan || {},
}, pairedItem: { item: 0 } }];
