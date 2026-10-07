# n8n — Gymon Blog — Articles

Source of the n8n workflow **Gymon Blog — Articles** (`QOKEzTeFDivxSwtU`, folder *Gymon*, tag *Gymon*).
Once a week it writes one bilingual (en + he) article as **closed-schema JSON** (the format in the site
README, "Blog articles — the JSON format"), checks it, sends it for review by email, and on approval
commits the two JSON files and the hero image to branch `blog/incoming`.

Doctrines: `ARTICLE_UX_DOCTRINE` §8a/§8b and `SEO_DOCTRINE` §2–§4 (gymon repo, `departments/research/`).

```
workflow.sdk.ts            the workflow as n8n Workflow SDK code (generated: do not edit by hand)
src/workflow.template.ts   graph + node config, with __PLACEHOLDERS__
src/code/*.js              Code-node sources
src/prompts/*.md           system prompts (topic, writer, Hebrew, fact check, image, alt, router, rewrite)
src/prompts/gymon_material.md  verified facts about the app (the only source of the Gymon-unique block)
src/emit.mjs               reads the SITE contract (src/lib/article/*.mjs) and emits it for build.py
src/build.py               assembles workflow.sdk.ts; also holds the feed list and Set-node field maps
tests/                     node --test: runs the shipped Code nodes against mocked n8n inputs
```

### One contract, two runtimes

`src/lib/article/{schema,inline,validate}.mjs` in the site are the **only** definition of the article
format. The site build validates every article file with them, and `build.py` (through `emit.mjs`)
inlines the same code into the Code nodes. `/*__LIB__*/` is the full contract (schema + inline renderer
+ validator, used by *Validate articles*, *Build commit files* and the review page); `/*__LIB_LITE__*/`
is the schema plus `code/pipeline_lib.js` (parsing, slugs, URL helpers). Change the schema in the site,
then rebuild here, or the workflow and the build disagree.

Rebuild and test after editing:

```
python3 src/build.py            # needs node; writes workflow.sdk.ts (must stay < 300,000 chars)
node --test tests/*.test.mjs    # 11 tests; run from n8n/blog-articles
```

Then push to n8n with `validate_workflow` → `update_workflow`. The SDK is a restricted TypeScript
subset, so long sources live in their own files and are inserted as JSON string literals. Comments,
indentation, imports and exports are stripped from the inlined code to stay under the 300K limit.

## Flow

1. **Collect sources**: Sunday 09:00 Asia/Jerusalem, weekly (or *Run once*). 11 English training
   feeds (nutrition/diet feeds removed) → drop items already used (`gymon_blog_sources`), older than
   30 days, off-topic, animal/cell studies or YMYL terms (supplements, weight loss, injury, pregnancy,
   medical) → up to 30 candidates, interleaved by site. `Any candidates?` stops the run when nothing is
   left. Do not use `new URL()` in Code nodes (see `shortlist.js`).
2. **Pick topic**: Sonnet plans one evergreen topic: pillar (`progressive-overload`, `sets-reps-volume`,
   `plans-splits`, `home-gym`, `tools`; pillar 5 is excluded), intent, length band, keywords and
   "people also ask" in both languages, and which **Gymon-unique element** to use. *Topic plan*
   (Code) re-checks it deterministically: pillar in the list, `ymylLevel` = `low`, no YMYL term in the
   topic, slug not already published. `Topic allowed?` → otherwise **Stop: topic not allowed**.
3. **Research**: hard-capped, no agent loop. Tavily extracts the source, runs exactly **3 basic
   searches** (the last one for a position stand), then extracts the **2 best pages**. *Research pack*
   tags every URL PRIMARY / AUTHORITY / SECONDARY and `[EXTRACTED]` (page text is in the pack) or
   `[SNIPPET]`; commercial pages are dropped and tracking parameters stripped.
4. **Write**: **one Sonnet call** writes the English article as JSON (answer first: `tldr` + key
   takeaways; claims carry a reference marker `[[r1]]` and a verbatim quote from the pack; exactly one
   Gymon block taken from `gymon_material.md`; one end CTA slot). *Parse article (EN)* parses it and
   fills the code-owned fields. Sonnet then writes the Hebrew version (gender-neutral, numbers and
   units in LTR isolates, no italics); references stay shared. No output parsers on purpose: a schema slip
   becomes a flag for the reviewer instead of a crashed run.
5. **Automated checks** before any email:
   - *Validate articles*: the site validator on both languages (schema, limits, every `[[rN]]`
     resolves, internal links only to published slugs), numbers in each claim must appear in its
     quoted source text (the source registry), YMYL guard on the text, Hebrew lint (gendered forms,
     dash/× outside LTR isolates, italics), en↔he parity (same sections, claims, references).
   - *Reference checks* → *Resolve references* (HTTP, batched 2/1.1 s): every reference URL must
     answer, every DOI through Crossref, every PMID through NCBI esummary, with titles compared.
   - *Fact check* (Haiku): entailment of claim vs quote, medical promises, gendered Hebrew, invented
     first-person experience, literal translation. **Non-blocking**: it only adds flags.
   - *Checked article*: `blocking` = any deterministic error. The review page disables *Approve*
     while it is set.
6. **Hero image**: Sonnet writes the prompt (bright, cool daylight, steel/chrome/white, no warm wood,
   no text/logos/faces) → Gemini → Cloudinary `gymon-blog/drafts/`. Then **Image alt** (Haiku with
   vision) describes the actual image in both languages.
7. **Save** (*Article record* → `Insert article`, `Log used source`) → **Review email** to
   gymon.official@gmail.com with the flag count and a link to the review page.
8. **Review page** `GET /webhook/gymon-blog/review?id=<article_id>&t=<token>`: both languages rendered
   with the site's inline renderer, every flag, the reference-check table, earlier versions, and a
   **5-item checklist** (sources opened and claims match, Gymon block true, not high-YMYL / no medical
   advice, Hebrew read in full, title/description/image/alt right). *Approve* posts the ticked list.
9. **Approve** `POST /webhook/gymon-blog/approve`: accepted only with zero errors and all 5 items;
   stores `reviewed_at` and `review_checklist`. *Build commit files* re-validates both files in
   `build` mode and throws on any error, then one commit (Git Data API) with
   `src/content/articles/{en,he}/<slug>.json` + `public/blog/<slug>.jpg` on `blog/incoming`
   (created from `main` if missing). No build, no deploy, no merge.
10. **Fix** `POST /webhook/gymon-blog/fix`: Haiku routes the note to `text` / `image` / `both`; the
    previous version is saved; Sonnet rewrites the JSON and/or a new image (+ alt) is made; *Prepare
    (fix)* sends it through the same checks (steps 5) and a new email goes out.

The footer disclaimer, the trust line ("Drafted with AI assistance from the sources listed below") and
the "How this article was made" note naming Osher Alon come from the site template (`src/copy.mjs`), so the prompts forbid adding them in the body.

## Cost per run (prices from https://openrouter.ai/api/v1/models, 2026-10-03)

Sonnet 5.5 $2/$10 per M tokens · Haiku 4.5 $1/$5 · Gemini 3 Pro Image $120 per M image-output tokens
(~1,120 per image) · Tavily: basic search 1 credit, basic extract 1 credit per 5 URLs, $0.008/credit pay-as-you-go
(1,000 free credits/month).

Measured in execution 1531: Pick topic 7,234 in / 563 out = $0.020; the writer 7,359 in / 6,000 out (cut off).
Sonnet 5.5 on OpenRouter spends hidden reasoning tokens that are billed as completion — about 3,400 of
those 6,000 — so writer and Hebrew maxTokens are 16,000 (rewrite 24,000). Expected per new article:
topic $0.02 + writer ~$0.08 + Hebrew ~$0.08 + check ~$0.01 + image prompt ~$0.01 + image $0.14
+ 5 Tavily credits ≈ $0.35–0.40 before the doctrine rebuild.

**After the rebuild (estimate, not yet measured): ≈ $0.40–0.45.** Added: the closed schema and the
Gymon material in the writer/Hebrew prompts (~6k more input tokens each, ≈ $0.02–0.03), the Haiku
fact check (~10k in / 1.5k out ≈ $0.02) and the vision alt text (≈ $0.005). Crossref/NCBI/URL checks
are free. Measure it on the first paid run. Models are the `MODEL_*` constants in the template.

## Gotcha: unicode escapes in Code nodes

When a Code node is updated through the n8n MCP (`setNodeParameter`), `\uXXXX` escapes in the source
arrive as raw characters (a raw U+2028 inside a regex is a syntax error). Use `String.fromCharCode(...)`
instead — `src/code/*.js` has no `\u` escapes for this reason.

## Gotcha: no quote characters in template comments

The SDK pre-parser does not skip comments, so an apostrophe or quote inside a `//` comment in
`workflow.template.ts` breaks parsing far from the real cause. `build.py` refuses to build when it
finds one.

## Storage (n8n Data Tables, keyed by our own `article_id`, never the row id)

| Table | Holds |
|---|---|
| `gymon_blog_articles` | one row per article: status, round, review token, both languages, sources, check notes, image; added 2026-10: `article_en`, `article_he` (JSON), `validation`, `research_pack`, `context_json`, `pillar`, `ymyl_level`, `review_checklist`, `reviewed_at` |
| `gymon_blog_versions` | the article as it was before each fix round, with the note and the route (+ `article_en`, `article_he`) |
| `gymon_blog_sources`  | every feed item used + topic + slug — the no-repeat list |

Every read/write is its own named Data table node, so a later move to a database only swaps those nodes.

## Before the first run

- ✅ GitHub credential **GitHub gymon-site** (`87ElEfiIizw4AWkh`, fine-grained token on
  `OsherAlon/gymon-site`, *Contents: read and write*) is set on the 8 GitHub HTTP nodes
  (`CRED_GITHUB` in the template). An id is not a secret; the token stays in n8n.
- Confirm the Cloudinary credential (`osheralon5@gmail.com_DEV AI`) is the account the blog images
  should live in.
- The site must already contain the JSON article template (`src/content/articles/`, branch
  `feat/blog-doctrine`); `blog/incoming` should be branched from it, not from an older `main`.
- The workflow is inactive. The review page and the approve/fix endpoints only work once it is active.
