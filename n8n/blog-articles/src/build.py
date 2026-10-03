#!/usr/bin/env python3
"""Assemble ../workflow.sdk.ts from workflow.template.ts + code/*.js + prompts/*.md.

The n8n Workflow SDK is a restricted TypeScript subset (no functions, no template-literal
escaping help), so long Code-node sources and prompts live in their own files and are
inserted here as JSON string literals. Run:  python3 src/build.py
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
OUT = HERE.parent / 'workflow.sdk.ts'


def lit(s):
    return json.dumps(s, ensure_ascii=False)


def read(rel):
    return (HERE / rel).read_text(encoding='utf-8').strip() + '\n'


def expr_obj(pairs):
    """{ key: expr("...") , ... } as builder code."""
    return '{ ' + ', '.join(f'{k}: expr({lit(v)})' for k, v in pairs) + ' }'


def assignments(rows):
    out = []
    for i, (name, value, typ) in enumerate(rows):
        val = f'expr({lit(value)})' if '{{' in str(value) else (lit(value) if isinstance(value, str) else str(value))
        out.append(f"{{ id: {lit('a%d' % i)}, name: {lit(name)}, value: {val}, type: {lit(typ)} }}")
    return '[\n        ' + ',\n        '.join(out) + '\n      ]'


def schema(cols):
    return '[' + ', '.join(
        f"{{ id: {lit(c)}, displayName: {lit(c)}, required: false, defaultMatch: false, display: true, type: {lit(t)}, canBeUsedToMatch: true }}"
        for c, t in cols) + ']'


FEEDS = [
    # name = real host/path of the URL (the RSS workflow's node names did not match their URLs)
    ('strongerbyscience.com', 'https://www.strongerbyscience.com/feed/'),
    ('rpstrength.com', 'https://rpstrength.com/blogs/articles.atom'),
    ('sciencedaily.com/fitness', 'https://www.sciencedaily.com/rss/health_medicine/fitness.xml'),
    ('sciencedaily.com/sports_medicine', 'https://www.sciencedaily.com/rss/health_medicine/sports_medicine.xml'),
    ('sciencedaily.com/nutrition', 'https://www.sciencedaily.com/rss/health_medicine/nutrition.xml'),
    ('sciencedaily.com/diet_and_weight_loss', 'https://www.sciencedaily.com/rss/health_medicine/diet_and_weight_loss.xml'),
    ('bjsm.bmj.com (online first)', 'https://bjsm.bmj.com/rss/ahead.xml'),
    ('journals.physiology.org/jappl', 'https://journals.physiology.org/action/showFeed?type=etoc&feed=rss&jc=jappl'),
    ('frontiersin.org/sports-and-active-living', 'https://www.frontiersin.org/journals/sports-and-active-living/rss'),
    ('frontiersin.org/exercise-physiology', 'https://www.frontiersin.org/journals/physiology/sections/exercise-physiology/rss'),
    ('tandfonline.com/JISSN', 'https://www.tandfonline.com/feed/rss/rssn20'),
    ('acsm.org', 'https://www.acsm.org/feed'),
    ('nsca.com', 'https://www.nsca.com/rss'),
]

W = "$('Write article (EN)').item.json.output"
H = "$('Hebrew version').item.json.output"
C = "$('Compliance check').item.json.output"
P = "$('Topic plan').item.json"
A = "$('Get article (fix)').first().json"
R = "$('Rewrite article')"
IMG16 = "'/upload/c_fill,g_auto,ar_16:9,w_1600,q_auto:good,f_jpg/'"


CLEAN_URLS = '.replace(/([?&])(?:utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|ref|source|campaign|cmpid|icid|s_cid)=[^&#)\\s"\'\\]]*/gi, \'$1\').replace(/\\?&+/g, \'?\').replace(/&{2,}/g, \'&\').replace(/[?&]+(?=[)#\\s"\'\\]]|$)/g, \'\')'

def cleaned(js):
    return '{{ String(' + js + " || ''" + ')' + CLEAN_URLS + ' }}'

def words(expr_text, wpm):
    return f"{{{{ Math.max(1, Math.round(String({expr_text} || '').split(/\\s+/).filter(Boolean).length / {wpm})) }}}}"


record = [
    ('article_id', f"{{{{ $now.toFormat('yyMMddHHmmss') }}}}-{{{{ {P}.slug }}}}", 'string'),
    ('slug', f'{{{{ {P}.slug }}}}', 'string'),
    ('status', 'pending_review', 'string'),
    ('round', 1, 'number'),
    ('review_token', "{{ $now.toMillis().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) }}", 'string'),
    ('topic', f'{{{{ {P}.topic }}}}', 'string'),
    ('angle', f'{{{{ {P}.angle }}}}', 'string'),
    ('source_url', f'{{{{ {P}.source_url }}}}', 'string'),
    ('source_title', f'{{{{ {P}.source_title }}}}', 'string'),
    ('sources_json', cleaned(f'JSON.stringify({W}.sources || [])'), 'string'),
    ('title_en', f'{{{{ {W}.title }}}}', 'string'),
    ('description_en', f'{{{{ {W}.description }}}}', 'string'),
    ('image_alt_en', f'{{{{ {W}.image_alt }}}}', 'string'),
    ('body_en', cleaned(f'{W}.body_md'), 'string'),
    ('read_time_en', words(f'{W}.body_md', 230), 'number'),
    ('title_he', f'{{{{ {H}.title }}}}', 'string'),
    ('description_he', f'{{{{ {H}.description }}}}', 'string'),
    ('image_alt_he', f'{{{{ {H}.image_alt }}}}', 'string'),
    ('body_he', cleaned(f'{H}.body_md'), 'string'),
    ('read_time_he', words(f'{H}.body_md', 200), 'number'),
    ('check_notes', f'{{{{ JSON.stringify({C} || {{}}) }}}}', 'string'),
    ('image_prompt', "{{ $('Image prompt').item.json.text }}", 'string'),
    ('image_url', f"{{{{ String($json.secure_url || '').replace('/upload/', {IMG16}) }}}}", 'string'),
    ('image_public_id', '{{ $json.public_id }}', 'string'),
]


def pick(field_new, field_old):
    return f"{{{{ {R}.isExecuted ? {R}.first().json.output.{field_new} : {A}.{field_old} }}}}"


revised = [
    ('status', 'pending_review', 'string'),
    ('round', f'{{{{ (Number({A}.round) || 1) + 1 }}}}', 'number'),
    ('last_feedback', "{{ $('Fix request').first().json.body.feedback }}", 'string'),
]
for f in ['title_en', 'description_en', 'image_alt_en', 'body_en', 'title_he', 'description_he', 'image_alt_he', 'body_he']:
    if f.startswith('body_'):
        revised.append((f, cleaned(f"({R}.isExecuted ? {R}.first().json.output.{f} : {A}.{f})"), 'string'))
    else:
        revised.append((f, pick(f, f), 'string'))
revised += [
    ('read_time_en', words(f"({R}.isExecuted ? {R}.first().json.output.body_en : {A}.body_en)", 230), 'number'),
    ('read_time_he', words(f"({R}.isExecuted ? {R}.first().json.output.body_he : {A}.body_he)", 200), 'number'),
    ('image_url', f"{{{{ $('Upload image (fix)').isExecuted ? String($('Upload image (fix)').first().json.secure_url || '').replace('/upload/', {IMG16}) : {A}.image_url }}}}", 'string'),
    ('image_public_id', f"{{{{ $('Upload image (fix)').isExecuted ? $('Upload image (fix)').first().json.public_id : {A}.image_public_id }}}}", 'string'),
    ('image_prompt', f"{{{{ $('Image prompt (fix)').isExecuted ? $('Image prompt (fix)').first().json.text : {A}.image_prompt }}}}", 'string'),
]

version_cols = [('article_id', 'string'), ('slug', 'string'), ('round', 'number'), ('feedback', 'string'), ('route', 'string'),
                ('title_en', 'string'), ('description_en', 'string'), ('body_en', 'string'),
                ('title_he', 'string'), ('description_he', 'string'), ('body_he', 'string'), ('image_url', 'string')]
version_vals = []
for c, _ in version_cols:
    if c == 'feedback':
        version_vals.append((c, "{{ $('Fix request').first().json.body.feedback }}"))
    elif c == 'route':
        version_vals.append((c, "{{ $('Route').first().json.route }}"))
    else:
        version_vals.append((c, f'{{{{ {A}.{c} }}}}'))

rep = {
    '__FEEDS_JSON__': lit(json.dumps({'feeds': [{'name': n, 'url': u} for n, u in FEEDS]}, indent=2)),
    '__CODE_SHORTLIST__': lit(read('code/shortlist.js')),
    '__CODE_EMAIL__': lit(read('code/build_email.js')),
    '__CODE_PAGE__': lit(read('code/review_page.js')),
    '__CODE_FILES__': lit(read('code/build_files.js')),
    '__CODE_QUERIES__': lit(read('code/search_queries.js')),
    '__CODE_PICK__': lit(read('code/pick_pages.js')),
    '__CODE_PACK__': lit(read('code/research_pack.js')),
    '__TOPIC_SYSTEM__': lit(read('prompts/topic_system.md')),
    '__WRITER_SYSTEM__': lit(read('prompts/writer_system.md')),
    '__HEBREW_SYSTEM__': lit(read('prompts/hebrew_system.md')),
    '__CHECK_SYSTEM__': lit(read('prompts/check_system.md')),
    '__IMAGE_SYSTEM__': lit(read('prompts/image_system.md')),
    '__ROUTER_SYSTEM__': lit(read('prompts/router_system.md')),
    '__REWRITE_SYSTEM__': lit(read('prompts/rewrite_system.md')),
    '__TOPIC_USER__': lit(
        "Already used topics (do not repeat):\n{{ ($json.used_topics || []).join('\\n') || '(none yet)' }}\n\n"
        "Candidates (index: site | date | title | snippet | link):\n"
        "{{ $json.candidates.map((c, i) => i + ': ' + c.host + ' | ' + (c.date || 'n/a') + ' | ' + c.title + ' | ' + c.snippet + ' | ' + c.link).join('\\n') }}"),
    '__TOPIC_EXAMPLE__': lit(json.dumps({
        'skip': False, 'candidate_index': 0, 'source_url': 'https://example.org/article', 'source_title': 'Source title',
        'topic': 'How long should you rest between sets for strength?', 'angle': 'What the evidence says and how to apply it',
        'slug': 'rest-between-sets-for-strength', 'primary_keyword_en': 'rest between sets', 'primary_keyword_he': 'מנוחה בין סטים',
        'search_queries': ['rest interval length strength meta-analysis', 'inter-set rest hypertrophy systematic review'],
        'reason': 'Recent meta-analysis on a common question'}, ensure_ascii=False, indent=2)),
    '__SLUG_EXPR__': lit(
        "{{ (() => { const s = String($json.output.slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('article-' + $now.toFormat('yyMMddHHmm')); "
        "return ($('Shortlist candidates').first().json.used_slugs || []).includes(s) ? s + '-' + $now.toFormat('yyMMdd') : s; })() }}"),
    '__WRITER_USER__': lit(
        f"Plan\nTopic: {{{{ {P}.topic }}}}\nAngle: {{{{ {P}.angle }}}}\nPrimary keyword: {{{{ {P}.primary_keyword_en }}}}\n\n"
        "Allowed URLs (link only to these; the tier is in brackets):\n{{ ($json.allowed_with_tier || $json.allowed_urls).join('\\n') }}\n\n"
        "RESEARCH PACK\n\n{{ $json.research }}"),
    '__WRITER_EXAMPLE__': lit(json.dumps({
        'title': 'How Long to Rest Between Sets for Strength', 'description': 'One or two sentences for the card and meta description.',
        'image_alt': 'A loaded barbell on a rack in a sunlit gym', 'body_md': 'Opening paragraph…\n\n## Section\n\nText with a [linked claim](https://example.org).',
        'sources': [{'title': 'Source title', 'url': 'https://example.org'}]}, indent=2)),
    '__HEBREW_USER__': lit(
        f"Hebrew primary keyword: {{{{ {P}.primary_keyword_he }}}}\n\nEnglish article\nTitle: {{{{ $json.output.title }}}}\n"
        "Description: {{ $json.output.description }}\nImage alt: {{ $json.output.image_alt }}\n\n{{ $json.output.body_md }}"),
    '__HEBREW_EXAMPLE__': lit(json.dumps({'title': 'כמה זמן לנוח בין סטים באימוני כוח', 'description': 'משפט או שניים לכרטיס ולתיאור המטא.',
                                         'image_alt': 'מוט עמוס על מתקן בחדר כושר מואר', 'body_md': 'פסקת פתיחה…\n\n## כותרת\n\nטקסט עם [טענה מקושרת](https://example.org).'},
                                        ensure_ascii=False, indent=2)),
    '__CHECK_USER__': lit(
        "Today's date: {{ $now.setZone('Asia/Jerusalem').toFormat('yyyy-MM-dd') }}\n\n"
        f"ENGLISH\nTitle: {{{{ {W}.title }}}}\nDescription: {{{{ {W}.description }}}}\n\n{{{{ {W}.body_md }}}}\n\n"
        "HEBREW\nTitle: {{ $json.output.title }}\nDescription: {{ $json.output.description }}\n\n{{ $json.output.body_md }}\n\n"
        "Allowed URLs (for links in BOTH the English and the Hebrew body):\n{{ $('Research pack').item.json.allowed_urls.join('\\n') }}"),
    '__RECHECK_USER__': lit(
        "Today's date: {{ $now.setZone('Asia/Jerusalem').toFormat('yyyy-MM-dd') }}\n\n"
        "ENGLISH\nTitle: {{ $json.title_en }}\nDescription: {{ $json.description_en }}\n\n{{ $json.body_en }}\n\n"
        "HEBREW\nTitle: {{ $json.title_he }}\nDescription: {{ $json.description_he }}\n\n{{ $json.body_he }}\n\n"
        f"Allowed URLs (for links in BOTH the English and the Hebrew body):\n{{{{ {A}.source_url }}}}\n{{{{ (JSON.parse({A}.sources_json || '[]')).map(s => s.url).join('\\n') }}}}"),
    '__CHECK_EXAMPLE__': lit(json.dumps({'gendered_hebrew': ['"נסה להוסיף" — masculine singular imperative'], 'medical_promises': ['"prevents injuries" — prevention promise'],
                                        'unsupported_claims': ['"increases strength by 20%" — no link'], 'other': ['mentions a competitor app'], 'verdict': 'needs_attention'},
                                       ensure_ascii=False, indent=2)),
    '__IMAGE_USER__': lit(f"Article title: {{{{ {W}.title }}}}\nDescription: {{{{ {W}.description }}}}\nOpening: {{{{ String({W}.body_md || '').slice(0, 900) }}}}"),
    '__FIX_IMAGE_USER__': lit(
        f"Article title: {{{{ {R}.isExecuted ? {R}.first().json.output.title_en : {A}.title_en }}}}\n"
        f"Description: {{{{ {R}.isExecuted ? {R}.first().json.output.description_en : {A}.description_en }}}}\n\n"
        "Reviewer note (follow it within the style rules): {{ $('Fix request').first().json.body.feedback }}\n\n"
        f"Previous image prompt — make a clearly different image where the note asks: {{{{ {A}.image_prompt }}}}"),
    '__GEMINI_PROMPT__': lit("{{ $json.text }}\n\nAbsolutely no text, letters, numbers, logos or watermarks anywhere in the image. Wide 16:9 landscape composition, bright natural daylight, light clean background."),
    '__RECORD_ASSIGNMENTS__': assignments(record),
    '__REVISED_ASSIGNMENTS__': assignments(revised),
    '__VERSION_VALUES__': expr_obj(version_vals),
    '__VERSION_SCHEMA__': schema(version_cols),
    '__REJECT_BODY__': lit("{{ JSON.stringify({ ok: false, error: !$json.article_id ? 'Article not found.' : ($json.status !== 'pending_review' ? 'This article is ' + $json.status + ' — no action available.' : 'Invalid or expired link, or an empty note.') }) }}"),
    '__REWRITE_USER__': lit(
        "Reviewer note:\n{{ $('Fix request').first().json.body.feedback }}\n\n"
        f"Sources list (the only allowed links):\n{{{{ {A}.sources_json }}}}\n\n"
        f"CURRENT ARTICLE\n\ntitle_en: {{{{ {A}.title_en }}}}\ndescription_en: {{{{ {A}.description_en }}}}\nimage_alt_en: {{{{ {A}.image_alt_en }}}}\nbody_en:\n{{{{ {A}.body_en }}}}\n\n"
        f"title_he: {{{{ {A}.title_he }}}}\ndescription_he: {{{{ {A}.description_he }}}}\nimage_alt_he: {{{{ {A}.image_alt_he }}}}\nbody_he:\n{{{{ {A}.body_he }}}}"),
    '__REWRITE_EXAMPLE__': lit(json.dumps({'title_en': '…', 'description_en': '…', 'image_alt_en': '…', 'body_en': '…',
                                          'title_he': '…', 'description_he': '…', 'image_alt_he': '…', 'body_he': '…'}, ensure_ascii=False, indent=2)),
    '__TREE_BODY__': lit(
        "{{ JSON.stringify({ base_tree: $('Get parent commit').item.json.tree.sha, tree: ["
        "{ path: $('Build commit files').item.json.path_en, mode: '100644', type: 'blob', content: $('Build commit files').item.json.md_en }, "
        "{ path: $('Build commit files').item.json.path_he, mode: '100644', type: 'blob', content: $('Build commit files').item.json.md_he }, "
        "{ path: $('Build commit files').item.json.path_image, mode: '100644', type: 'blob', sha: $json.sha } ] }) }}"),
    '__COMMITTED_HTML__': lit(
        "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px\">"
        "<h2 style=\"margin:0 0 8px\">Committed to <code>blog/incoming</code></h2>"
        "<p><b>{{ $('Get article (approve)').item.json.title_en }}</b><br>{{ $('Get article (approve)').item.json.title_he }}</p>"
        "<p>Commit: <a href=\"{{ $('Create commit').item.json.html_url }}\">{{ $('Create commit').item.json.sha }}</a></p>"
        "<ul><li><code>{{ $('Build commit files').item.json.path_en }}</code></li><li><code>{{ $('Build commit files').item.json.path_he }}</code></li>"
        "<li><code>{{ $('Build commit files').item.json.path_image }}</code></li></ul>"
        "<p style=\"color:#555\">Nothing is live yet. To publish: merge <code>blog/incoming</code> into the site's main branch, then <code>npm run build</code> and push as usual.</p></div>"),
    '__NOTE_OVERVIEW__': lit(
        "## Gymon Blog — Articles\n"
        "**Generate (Sun + Wed 09:00, or Run once):** 13 English RSS feeds → shortlist (no reused sources) → Sonnet picks a topic → "
        "Tavily: source + 3 searches + 2 pages (capped) → Sonnet writes EN → Sonnet adapts to gender-neutral HE → Haiku flags issues → Gemini hero image → Cloudinary (16:9 JPEG) → "
        "Data table `gymon_blog_articles` → review email to gymon.official@gmail.com.\n\n"
        "**Review page** `GET /webhook/gymon-blog/review?id=&t=` (token per article).\n"
        "**Approve** `POST /webhook/gymon-blog/approve` → one commit (en.md + he.md + jpg) to `OsherAlon/gymon-site` branch `blog/incoming`.\n"
        "**Fix** `POST /webhook/gymon-blog/fix` → Haiku routes text / image / both → previous version saved to `gymon_blog_versions` → redo → new email.\n\n"
        "⚠️ The GitHub nodes need a GitHub credential (fine-grained token, Contents: read & write on gymon-site)."),
}

src = (HERE / 'workflow.template.ts').read_text(encoding='utf-8')
for k, v in rep.items():
    if k not in src:
        raise SystemExit(f'placeholder not used: {k}')
    src = src.replace(k, v)
left = [m for m in set(__import__('re').findall(r'__[A-Z_]+__', src))]
if left:
    raise SystemExit(f'unreplaced placeholders: {left}')
OUT.write_text(src, encoding='utf-8')
print(f'wrote {OUT} ({len(src)} chars)')
