// Revised record — the fix round's row update: the re-validated article pair, a new image
// (and alt text from the new image) when the route asked for one.
const b = $('Checked article').first().json;
const row = $('Get article (fix)').first().json;
const IMG16 = '/upload/c_fill,g_auto,ar_16:9,w_1600,q_auto:good,f_jpg/';
const newImage = $('Upload image (fix)').isExecuted;
const alt = newImage ? (($('Image alt (fix)').first().json || {}).output || {}) : {};
const en = { ...b.article_en, imageAlt: alt.image_alt_en || b.article_en.imageAlt };
const he = { ...b.article_he, imageAlt: alt.image_alt_he || b.article_he.imageAlt };
return [{ json: {
  status: 'pending_review',
  round: (Number(row.round) || 1) + 1,
  last_feedback: $('Fix request').first().json.body.feedback,
  title_en: en.title, title_he: he.title,
  hero_title_en: en.heroTitle, hero_title_he: he.heroTitle,
  description_en: en.description, description_he: he.description,
  image_alt_en: en.imageAlt, image_alt_he: he.imageAlt,
  read_time_en: b.validation.en.stats.readTime, read_time_he: b.validation.he.stats.readTime,
  article_en: JSON.stringify(en),
  article_he: JSON.stringify(he),
  validation: JSON.stringify({ ...b.validation, refs: b.ref_report, blocking: b.blocking }),
  check_notes: JSON.stringify(b.check_notes || {}),
  sources_json: JSON.stringify((en.references || []).map((r) => ({ title: r.title, url: r.url }))),
  image_url: newImage ? String($('Upload image (fix)').first().json.secure_url || '').replace('/upload/', IMG16) : row.image_url,
  image_public_id: newImage ? $('Upload image (fix)').first().json.public_id : row.image_public_id,
  image_prompt: $('Image prompt (fix)').isExecuted ? $('Image prompt (fix)').first().json.text : row.image_prompt,
}, pairedItem: { item: 0 } }];
