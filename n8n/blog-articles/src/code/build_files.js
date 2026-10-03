// Build commit files — the two Markdown files in the exact format of gymon-site/README.md
// ("Blog articles — the file format"), plus the GitHub target.
const OWNER = 'OsherAlon';
const REPO = 'gymon-site';
const BRANCH = 'blog/incoming';
const BASE_BRANCH = 'main'; // only used if blog/incoming does not exist yet
const AUTHOR = { en: 'Gymon Team', he: 'צוות Gymon' };

const a = $('Get article (approve)').first().json;
const date = $now.setZone('Asia/Jerusalem').toFormat('yyyy-MM-dd');
const slug = String(a.slug || '').toLowerCase();
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid slug: ${a.slug}`);

// YAML double-quoted scalars accept JSON string syntax.
const q = s => JSON.stringify(String(s ?? '').replace(/\s+/g, ' ').trim());
const cleanBody = b => String(b || '')
  .replace(/^\uFEFF/, '')
  .replace(/^\s*#\s[^\n]*\n+/, '')   // the page renders the title itself
  .trim() + '\n';

const file = lang => [
  '---',
  `title: ${q(a['title_' + lang])}`,
  `description: ${q(a['description_' + lang])}`,
  `image: /blog/${slug}.jpg`,
  `imageAlt: ${q(a['image_alt_' + lang])}`,
  `createdAt: ${date}`,
  `author: ${q(AUTHOR[lang])}`,
  `readTime: ${Math.max(1, Math.round(Number(a['read_time_' + lang]) || 1))}`,
  `lang: ${lang}`,
  `slug: ${slug}`,
  'draft: false',
  '---',
  '',
  cleanBody(a['body_' + lang]),
].join('\n');

return [{ json: {
  article_id: a.article_id,
  slug,
  owner: OWNER,
  repo: REPO,
  branch: BRANCH,
  base_branch: BASE_BRANCH,
  api: `https://api.github.com/repos/${OWNER}/${REPO}`,
  image_url: a.image_url,
  path_en: `src/content/blog/en/${slug}.md`,
  path_he: `src/content/blog/he/${slug}.md`,
  path_image: `public/blog/${slug}.jpg`,
  md_en: file('en'),
  md_he: file('he'),
  published_date: date,
  commit_message: `blog: add "${String(a.title_en || slug).replace(/"/g, "'")}" (${slug}, en+he)\n\nApproved in the Gymon Blog review page (n8n), round ${a.round}.`,
} }];
