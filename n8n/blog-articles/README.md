# n8n — Gymon Blog — Articles

Source of the n8n workflow **Gymon Blog — Articles** (`QOKEzTeFDivxSwtU`, folder *Gymon*, tag *Gymon*).
It writes one bilingual (en + he) blog article, sends it for review by email, and on approval commits
the files in the format of the site README ("Blog articles — the file format") to branch `blog/incoming`.

```
workflow.sdk.ts          the workflow as n8n Workflow SDK code (generated — do not edit by hand)
src/workflow.template.ts graph + node config, with __PLACEHOLDERS__
src/code/*.js            Code-node sources (shortlist, review email, review page, commit files)
src/prompts/*.md         system prompts (topic, writer, Hebrew, check, image, router, rewrite)
src/build.py             assembles workflow.sdk.ts; also holds the feed list and the Set-node field maps
```

Rebuild after editing: `python3 src/build.py`, then push the code to n8n (`validate_workflow` →
`update_workflow`/re-create). The SDK is a restricted TypeScript subset, so long sources live in their
own files and are inserted as JSON string literals.

## Flow

1. **Collect sources** — Sun + Wed 09:00 Asia/Jerusalem (or *Run once*). 13 English feeds → drop items
   already used (`gymon_blog_sources`), older than 30 days, off-topic or animal/cell studies → up to 30
   candidates, interleaved by site.
2. **Pick topic** — Sonnet picks one candidate and plans an evergreen SEO topic (slug, keywords en/he,
   search queries), avoiding used topics; `skip` ends the run.
3. **Research + write** — Tavily extracts the source; Opus (agent with `tavily_search` + `tavily_extract`)
   writes the English article with an inline link on every claim; Opus adapts it to gender-neutral Hebrew;
   Haiku reports gendered Hebrew / medical promises / unlinked claims (shown in the email and page).
4. **Hero image** — Sonnet writes the prompt (dark, near-monochrome, no text/logos/real people) → Gemini
   → Cloudinary `gymon-blog/drafts/`; served as `c_fill,ar_16:9,w_1600,f_jpg`.
5. **Save draft** → **Review email** to gymon.official@gmail.com with a link to the review page.
6. **Review page** `GET /webhook/gymon-blog/review?id=<article_id>&t=<token>` — both languages, sources,
   check notes, earlier versions; *Approve* and *Send for fixes* post to the two endpoints below.
7. **Approve** `POST /webhook/gymon-blog/approve` — one commit (Git Data API) with
   `src/content/blog/{en,he}/<slug>.md` + `public/blog/<slug>.jpg` on `blog/incoming` (created from `main`
   if missing). No build, no deploy, no merge.
8. **Fix** `POST /webhook/gymon-blog/fix` — Haiku routes the note to `text` / `image` / `both`; the
   previous version is saved; Opus rewrites and/or a new image is made; Haiku re-checks; a new email goes out.

The page footer disclaimer ("general information, not medical advice") comes from the site template,
so the prompts forbid adding one in the body.

## Storage (n8n Data Tables, keyed by our own `article_id`, never the row id)

| Table | Holds |
|---|---|
| `gymon_blog_articles` | one row per article: status, round, review token, both languages, sources, check notes, image |
| `gymon_blog_versions` | the article as it was before each fix round, with the note and the route |
| `gymon_blog_sources`  | every feed item used + topic + slug — the no-repeat list |

Every read/write is its own named Data table node, so a later move to a database only swaps those nodes.

## Before the first run

- Add a **GitHub** credential (type *GitHub API*, fine-grained token on `OsherAlon/gymon-site` with
  *Contents: read and write*) and select it on the 8 GitHub HTTP nodes in group *8 · Approve → GitHub*.
- Confirm the Cloudinary credential (`osheralon5@gmail.com_DEV AI`) is the account the blog images
  should live in.
- If `feat/astro-blog` is pushed before the first approval, create `blog/incoming` from it so the
  content lands next to the Astro code (otherwise it is branched from `main`).
- The workflow is inactive. The review page and the approve/fix endpoints only work once it is active.
