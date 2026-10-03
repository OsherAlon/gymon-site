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
language on the site before (the inline script in `src/components/SiteHead.astro`). These pages keep
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

🔴 **`APP_STORE_URL` in `src/copy.mjs` is `null` until the app is live.** While it's null, the badge
is shown but leads nowhere (no `href`, `aria-disabled="true"`, default cursor). **Once the app is
live, set it to the listing URL and rebuild.** The badge then becomes a normal link. Never point it
at a listing that doesn't exist.

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

## Blog articles — the file format (for the n8n agent)

One Markdown file **per article per language**:

```
src/content/blog/en/<slug>.md
src/content/blog/he/<slug>.md
```

The English and Hebrew versions of one article share the same `slug` — it is both the URL and the
translation key. An article may exist in one language only; the language switch then goes to the
other language's blog index.

```markdown
---
title: "Progressive overload, explained without the jargon"
description: "One or two sentences. Shown on the card and as the meta description."
image: /blog/progressive-overload.jpg
imageAlt: "What the image shows"
createdAt: 2026-09-28
author: "Gymon Team"
readTime: 5
lang: en
slug: progressive-overload
draft: false
---

Body in Markdown. Start with a paragraph, use `##` for sections (the page already has the `#` title).
Lists, **bold**, links and > quotes are styled.
```

| Field | Required | Rules |
|---|---|---|
| `title` | yes | Plain text. Quote it if it holds `:` |
| `description` | yes | Plain text, ~1–2 sentences |
| `image` | yes | Path under `public/` (e.g. `/blog/<slug>.jpg`, file at `public/blog/<slug>.jpg`) or an `https://` URL. 16:9 |
| `imageAlt` | no | Alt text for the article hero image |
| `createdAt` | yes | `YYYY-MM-DD`. Newest first on the index |
| `author` | yes | Shown as "by …" / "מאת …" |
| `readTime` | yes | Whole minutes (number). Rendered as "5 min read" / "5 דקות קריאה" |
| `lang` | yes | `en` or `he` — must match the folder |
| `slug` | yes | `lowercase-latin-and-dashes`, same in both languages |
| `draft` | no | `true` keeps it out of the build |
| `mock` | no | `true` marks placeholder content (adds `noindex`) |

The build validates every file against `src/content.config.ts` and fails on a bad field.
Hebrew articles: gender-neutral language (no second-person singular — "יש ל-", plural or impersonal
forms), and no medical promises. Every article page ends with a "general information, not medical
advice" note from `src/copy.mjs`.

### Article page

Each article opens with the ScrollExpandMedia hero (`src/components/ui/scroll-expansion-hero.tsx`):
the article's `image` grows from a 300×400 box to full width as the page is scrolled (or with
PageDown / Space / Arrow keys), over **one site-wide background image**. To change that background,
replace `public/blog/hero-bg.jpg` — or put the new file in `public/blog/` and point
`BLOG_HERO_BG` in `src/lib/blog.ts` at it. The whole article text is in the server HTML; without
JS, or with reduced motion, the content is shown directly.

### Preview article

`src/content/blog/preview/{en,he}/creatine-and-resistance-training-guide.md` and
`public/blog/creatine-and-resistance-training-guide.jpg` are the first real n8n article (data table
row 1, still `pending_review`). The files are built exactly as the workflow's Approve step builds them,
with `mock: true` added so the pages get `noindex`. To remove it, delete `src/content/blog/preview/`
and that image.

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
