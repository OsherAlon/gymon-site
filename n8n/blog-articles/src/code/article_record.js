// Article record — one row for gymon_blog_articles. The two article JSON files travel as
// strings (article_en / article_he); the flat columns are kept for the list view and email.
const b = $('Checked article').first().json;
const plan = b.plan || {};
const up = $('Upload image').first().json;
const alt = ($('Image alt').first().json || {}).output || {};
const IMG16 = '/upload/c_fill,g_auto,ar_16:9,w_1600,q_auto:good,f_jpg/';
const en = { ...b.article_en, imageAlt: alt.image_alt_en || b.article_en.imageAlt };
const he = { ...b.article_he, imageAlt: alt.image_alt_he || b.article_he.imageAlt };
return [{ json: {
  article_id: `${$now.toFormat('yyMMddHHmmss')}-${plan.slug}`,
  slug: plan.slug,
  status: 'pending_review',
  round: 1,
  review_token: $now.toMillis().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
  topic: plan.topic,
  angle: plan.angle,
  source_url: plan.source_url,
  source_title: plan.source_title,
  pillar: plan.pillar,
  ymyl_level: plan.ymyl_level,
  title_en: en.title, title_he: he.title,
  hero_title_en: en.heroTitle, hero_title_he: he.heroTitle,
  description_en: en.description, description_he: he.description,
  image_alt_en: en.imageAlt, image_alt_he: he.imageAlt,
  read_time_en: b.validation.en.stats.readTime, read_time_he: b.validation.he.stats.readTime,
  article_en: JSON.stringify(en),
  article_he: JSON.stringify(he),
  validation: JSON.stringify({ ...b.validation, refs: b.ref_report, blocking: b.blocking }),
  check_notes: JSON.stringify(b.check_notes || {}),
  research_pack: String(b.research_text || ''),
  context_json: JSON.stringify({ allowed_urls: b.allowed_urls, read_urls: b.read_urls, published: b.published, plan }),
  sources_json: JSON.stringify((en.references || []).map((r) => ({ title: r.title, url: r.url }))),
  image_prompt: $('Image prompt').first().json.text,
  image_url: String(up.secure_url || '').replace('/upload/', IMG16),
  image_public_id: up.public_id,
}, pairedItem: { item: 0 } }];
