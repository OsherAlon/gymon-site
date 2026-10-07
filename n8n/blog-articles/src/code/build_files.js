// Build commit files — the two article JSON files exactly as the site's content collection
// expects them (src/content/articles/<lang>/<slug>.json, validated by the SAME validator the
// build runs; a file that would fail the build is never committed), plus the GitHub target.
/*__LIB__*/
const OWNER = 'OsherAlon';
const REPO = 'gymon-site';
const BRANCH = 'blog/incoming';
const BASE_BRANCH = 'main'; // only used if blog/incoming does not exist yet

const a = $('Get article (approve)').first().json;
const date = $now.setZone('Asia/Jerusalem').toFormat('yyyy-MM-dd');
const slug = String(a.slug || '').toLowerCase();
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid slug: ${a.slug}`);

const file = (lang) => {
  const art = JSON.parse(a['article_' + lang] || 'null');
  if (!art) throw new Error(`Article ${lang} missing on row ${a.article_id} (rows from before the doctrine rebuild cannot be approved)`);
  const out = canonical({
    ...art,
    schemaVersion: SCHEMA_VERSION,
    lang,
    slug,
    image: `/blog/${slug}.jpg`,
    imageAlt: a['image_alt_' + lang] || art.imageAlt,
    imageAiGenerated: true,
    createdAt: date,          // the approval date (Asia/Jerusalem)
    reviewedAt: date,         // the human review recorded on Approve
    editor: 'osher-alon',
    aiAssisted: true,
  });
  delete out.updatedAt;       // set only on a substantive post-publication change, never here
  delete out.sample;
  const { errors } = validateArticle(out, { mode: 'build' });
  if (errors.length) throw new Error(`${lang} would fail the site build:\n` + errors.map((e) => `${e.path}: ${e.message}`).join('\n'));
  return JSON.stringify(out, null, 2) + '\n';
};

return [{ json: {
  article_id: a.article_id,
  slug,
  owner: OWNER,
  repo: REPO,
  branch: BRANCH,
  base_branch: BASE_BRANCH,
  api: `https://api.github.com/repos/${OWNER}/${REPO}`,
  image_url: a.image_url,
  path_en: `src/content/articles/en/${slug}.json`,
  path_he: `src/content/articles/he/${slug}.json`,
  path_image: `public/blog/${slug}.jpg`,
  md_en: file('en'),
  md_he: file('he'),
  published_date: date,
  commit_message: `blog: add "${String(a.title_en || slug).replace(/"/g, "'")}" (${slug}, en+he)\n\nApproved in the Gymon Blog review page (n8n), round ${a.round}; reviewed by Osher Alon on ${date}.\nReview checklist (all confirmed): ${JSON.stringify(($('Approve request').first().json.body || {}).checklist || [])}`,
} }];
