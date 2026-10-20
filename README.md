# gymon-site

The public site at **https://gymon.app** — privacy policy, terms of use, support and the blog.

**Stack:** Astro (static output) + React + Tailwind CSS v4 + TypeScript, shadcn-style structure
(`src/components/ui/`, the `@/` alias → `src/`, `cn()` in `src/lib/utils.ts`).
Every page is pre-rendered to plain HTML at build time, so App Store reviewers and crawlers read the
full text in the served HTML — React only hydrates the blog index for the image fade-in.

## 🔴 URLs Apple depends on

App Store Connect points at these. They must keep resolving, with the legal text unchanged:

| URL | Page | File in `docs/` |
|---|---|---|
| `/` · `/he/` | Home | `index.html` · `he/index.html` |
| `/privacy` · `/he/privacy` | Privacy policy | `privacy.html` · `he/privacy.html` |
| `/terms` · `/he/terms` | Terms of use | `terms.html` · `he/terms.html` |
| `/support` · `/he/support` | Support | `support.html` · `he/support.html` |

GitHub Pages serves `privacy.html` at `/privacy` (no extension, no redirect). That is why
`astro.config.mjs` uses `build.format: 'preserve'` — `'directory'` would emit `privacy/index.html`
and turn `/privacy` into a 301.

English is at the fixed URLs. A device set to Hebrew is sent to `/he/…` unless the visitor picked a
language on the site before (the inline script in `src/components/SiteHead.astro`).

The blog never redirects. An English article that also exists in Hebrew shows Hebrew-language
devices a small dismissible bar, "המאמר קיים גם בעברית", that links to the Hebrew version. The
dismissal is remembered in `localStorage` (`heHintDismissed`). These pages keep
their original markup and `/style.css` (`public/style.css`) — no Tailwind on them, so they look
exactly as before.

| Blog URL | File |
|---|---|
| `/blog/` · `/he/blog/` | `blog/index.html` · `he/blog/index.html` (`/blog` → 301 → `/blog/`) |
| `/blog/<slug>` · `/he/blog/<slug>` | `blog/<slug>.html` · `he/blog/<slug>.html` |

## Header and the App Store badge

Every page has the same fixed top bar (`src/components/SiteChrome.astro`): logo · Blog · language
switch · App Store badge. The badge order flips in Hebrew. Its styles are in `public/style.css`, and a
copy of them is in `src/styles/global.css`.

The badge is Apple's **official artwork, unmodified**, at the 40px minimum height. Apple's marketing
guidelines allow only the official badges. The files are in `public/badges/`:

- `app-store-en-us.svg`, from `https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/en-us`
- `app-store-he-il.svg`, from the same URL ending in `/he-il`

🟢 **The app is live (2026-10-20). `APP_STORE_URL` in `src/copy.mjs` holds the listing URL**, so the
badge (header, home hero), the pricing CTA and the article end CTA are normal links, and articles carry
the Smart App Banner (`apple-itunes-app`). The storefront-neutral form
`https://apps.apple.com/app/id6817270194` returned 404 when checked, so the URL is the `/us/` listing
as given. If the listing is ever pulled, set it back to `null` and rebuild: the badge is then shown
but leads nowhere (no `href`, `aria-disabled="true"`, default cursor). Never point it at a listing
that doesn't exist.

**Google Play** shows as a neutral text pill, "Google Play · Coming soon" / "Google Play · בקרוב",
with no Google logo and no link. Google's official badges may only be used "to promote content on
Google Play" ("Get it on" to drive downloads, "Pre-register" to drive pre-registration), and there is
no Play listing yet. Once one exists, replace the pill with Google's localized badge, unmodified and
linked to the listing, at the same size as the App Store badge or larger. The pill is hidden below
470px wide, because the bar has no room for it on a phone.

## Commands

Run from the repo root. `.npmrc` holds `include=dev` because `NODE_ENV=production` can be set in this
environment, which would make `npm install` skip the dev dependencies.

```sh
npm install                       # check: node_modules/.bin/astro exists
npm run dev                       # http://localhost:4391 (reads ../gymon at main)
npm run build                     # → docs/
npm run verify                    # checks docs/ (legal text in order, blog, CNAME, .nojekyll)
npm run serve                     # serves docs/ like GitHub Pages on :4391
node verify.mjs http://localhost:4391
npm run check                     # TypeScript
```

## Where the legal text comes from

The legal text is **not edited here**. `src/lib/source.ts` reads it at build time from the app, at a
given commit of the private `gymon` repo (`git show <ref>:…`):

- `app/src/locales/{en,he}/privacyPolicy.json`
- `app/src/locales/{en,he}/termsOfService.json`
- `app/src/locales/{en,he}/home.json` — only the in-app labels and the "what is / is not deleted" lists on the support page

`GYMON_REPO` (default `../gymon`) and `GYMON_REF` (default `main`) override the source. Each page records
the commit it was built from in `<meta name="source-commit">`. Only the home page, the support page glue,
the page chrome and the blog labels are written here, in `src/copy.mjs`.

⚠️ Section order lives in `src/documents.mjs` and mirrors `PrivacyPolicyPage.tsx` / `TermsOfServicePage.tsx`.
When legal adds a key, the build fails until it is added there too, in the same place as on the app screen.
The rendering itself is `src/lib/legal.ts` (ported 1:1 from the old `build.mjs`).

### Updating after a policy change

```sh
GYMON_REPO=/path/to/gymon npm run build      # ref main
npm run verify
git add -A && git commit -m "rebuild from gymon <sha>" && git push
node verify.mjs https://gymon.app            # after Pages deploys
```

## Blog articles — the JSON format (for the n8n workflow)

Since the doctrine rebuild (2026-10) an article is **one closed-schema JSON file per language**:

```
src/content/articles/en/<slug>.json
src/content/articles/he/<slug>.json
```

The contract lives in `src/lib/article/` and is the single definition shared with the n8n workflow
(`n8n/blog-articles` inlines the same files):

| File | Holds |
|---|---|
| `schema.mjs` | the closed vocabulary: pillars, block types, evidence levels, CTA slots, limits, YMYL and Hebrew word lists |
| `inline.mjs` | the inline syntax and its renderer: `**bold**`, `[[r1]]` reference markers, `[text](/blog/<slug>)` internal links; numbers and units are wrapped in LTR isolates for Hebrew |
| `validate.mjs` | `validateArticle(article, ctx)`: errors fail the build, warnings are review flags |
| `types.ts` | TypeScript view of the same shape |

The build validates every file through the `articles` collection in `src/content.config.ts` and fails
on any error. Tests: `npm test` (`node --test tests/*.test.mjs`).

**Schema v3 (user decisions 2026-10-07; reference: Headspace articles)** — "it should feel like
scrolling, not reading". Headlines alone tell the story; the takeaway is on the first screen. Where
this conflicts with the UX/SEO doctrines, v3 wins.

Top-level keys (the pipeline owns the first group, the writer the second):

- **code-owned**: `schemaVersion` (3), `lang`, `slug`, `pillar`, `tags`, `intent`, `ymylLevel` (only
  `low`), `lengthBand` (`short`), `image`, `imageAiGenerated`, `createdAt`, `updatedAt`, `reviewedAt`,
  `editor` (`osher-alon`), `aiAssisted`, `sample`
- **writer-owned**: `title` (the page's only `<h1>`), `heroTitle`, `description`, `primaryQuery`,
  `imageAlt`, and:
  - `hook` — a relatable question or situation, 1–2 short sentences, friendly ("we"/"you" in English,
    plural or impersonal in Hebrew).
  - `bottomLine` — ONE sentence, shown as "In short" on the first screen.
  - `beats` — 3–6 × `{ heading, text }`: a plain headline that IS the point (no citation markers),
    then 1–3 short sentences, at most one key number. One idea per screen.
  - `pullQuote` (optional) — `{ ref, text, attribution, lead? }`, verbatim from that reference's quote
    in English (translated on the Hebrew page).
  - `tips` — `{ heading, items: 3–5 short lines }`.
  - `calculator`, `gymon` (optional) — quiet extras, placed low.
  - `references` — `url`, optional `doi`/`pmid`, `tier`, `type`, `fullTextRead`, verbatim `quote`, and
    `finding` + `certainty`. Study detail lives ONLY here; the list is collapsed by default.
  - `cta` — `{ slot }`; copy from `src/copy.mjs`.

Length is a ceiling, not a target (≤ 450 words EN / 360 HE); sentences ≤ 20 words. Page order
(`src/components/ArticleDoc.astro`): H1 → hook → "In short" → quiet trust line → image → beats →
pull quote → "try it" list → calculator → end CTA (text, no dark box) → sources (collapsed) → editor →
"how this article was made". There is no scroll-linked hero on these pages any more (the Markdown
mock articles keep it). Citations are small superscript numbers without brackets.

⚠ The n8n workflow still writes schema v1 (its tests use a frozen v1 copy in
`n8n/blog-articles/tests/fixtures/v1/`). It must be migrated before any article is approved, or the
committed files will fail this build.

Rules for the text: Hebrew is gender-neutral (no second-person singular: "יש ל-", plural or impersonal
forms) and real Hebrew, not English in Hebrew letters ("עומס הדרגתי", never "פרוגרסיב אוברלואד" — the
validator flags it); no high-YMYL topics (supplements, weight loss, injuries, pregnancy, medical); no
medical promises. The "general information, not medical advice" footer comes from `src/copy.mjs`.

### Sample article

`src/content/articles/sample/{en,he}/estimate-one-rep-max.json` is a sample pair (`sample: true` →
`noindex`, a visible "sample" label and its own "how this sample was made" note). Its two sources are
real (Richens & Cleather 2014; Brzycki 1993); no editor has reviewed it. It is in the v3 layout: EN 234 words,
HE 182 words. To remove it, delete
`src/content/articles/sample/`.

### Older Markdown articles

`src/content/blog/{en,he}/<slug>.md` (frontmatter `title`, `heroTitle`, `description`, `image`,
`imageAlt`, `createdAt`, `author`, `readTime`, `lang`, `slug`, `draft`, `mock`) still renders through
the old `ArticlePage`. Only the mock articles use it; new articles are JSON.

### Article page

Each article opens with a **scroll-linked** hero (`src/components/ArticleHero.astro`, styles under
"Article hero" in `src/styles/global.css`). The article's `image` opens from a 300×400 window to
near-full width over **one site-wide background image**, and the short `heroTitle` slides apart.
It is driven by the page's normal scroll through CSS scroll-driven animations, with no JavaScript,
and it never holds or blocks scrolling. Right after it come the full title (the page's only `<h1>`),
the description and the article, all always visible.

Browsers without scroll-driven animations (Firefox stable, Safari before 26) and readers with
reduced motion get the static end state: the expanded image, then the article.

To change the background, replace `public/blog/hero-bg.jpg`, or put the new file in `public/blog/`
and point `BLOG_HERO_BG` in `src/lib/blog.ts` at it.

### Mock articles

The six articles in `src/content/blog/mock/{en,he}/` are placeholders (`mock: true`, `noindex`).
To remove them: delete `src/content/blog/mock/` and `public/blog/mock/`, then rebuild.
While the index holds only mock articles, it is `noindex` too.

## Layout

```
astro.config.mjs        outDir ./docs, format 'preserve'
public/                 copied to docs/ as-is: style.css, CNAME, .nojekyll, blog images
src/copy.mjs            site-only copy (en/he)
src/documents.mjs       legal section order
src/lib/source.ts       reads the gymon repo
src/lib/legal.ts        renders the legal / support / home bodies
src/layouts/            LegacyLayout (original pages, /style.css) · BlogLayout (Tailwind)
src/components/ui/      blog-section.tsx, lazy-image.tsx
src/content/blog/       articles
src/styles/global.css   Tailwind + Gymon tokens (shadcn names: foreground, muted-foreground, accent…)
scripts/serve.mjs       local GitHub-Pages-like server
```

## Hosting

GitHub Pages, from `docs/` on `main`. `docs/CNAME` (from `public/CNAME`) holds the custom domain, and
`docs/.nojekyll` must stay — without it Pages runs Jekyll, which drops the `_astro/` folder.

## Crawlers and sitemap

- **`public/robots.txt`** allows every crawler, search engines and AI crawlers alike
  (`User-agent: *`, `Allow: /`), and names `https://gymon.app/sitemap.xml`.
- **`public/sitemap.xml`** is a sitemap index that points at `sitemap-0.xml`. `@astrojs/sitemap`
  writes that file at build time (it also writes `sitemap-index.xml`, same content).
- **What gets listed:** every built page except the 404 and any page with
  `<meta name="robots" content="noindex">`. That covers mock and preview articles, and the blog
  indexes while they list only those. The filter in `astro.config.mjs` decides from the built HTML
  itself.
- **URL form:** URLs are extensionless and match the canonicals (`/privacy`, `/he/`, `/blog/`).
  Each entry carries en/he alternates plus `x-default` pointing to English.
- **Check:** `npm run verify` confirms robots.txt and the sitemap exist, that no listed URL is
  noindex, missing or has a `.html` extension, and that every indexable page is listed.
