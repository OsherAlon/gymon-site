# gymon-site

The public site at **https://gymon.app** — privacy policy, terms of use and support, for the App Store listing.

| URL | Page |
|---|---|
| `/` · `/he/` | Home |
| `/privacy` · `/he/privacy` | Privacy policy |
| `/terms` · `/he/terms` | Terms of use |
| `/support` · `/he/support` | Support |

English is at the fixed URLs (the ones in the app and App Store Connect). A device set to Hebrew is sent to `/he/…` unless the visitor picked a language on the site before. Every page holds its full text in the HTML — nothing is rendered by JavaScript.

## Where the text comes from

The legal text is **not edited here**. `build.mjs` reads it from the app, at a given commit of the private `gymon` repo:

- `app/src/locales/{en,he}/privacyPolicy.json`
- `app/src/locales/{en,he}/termsOfService.json`
- `app/src/locales/{en,he}/home.json` — only the in-app labels and the "what is / is not deleted" lists on the support page

Only the home page, the support page glue and the page chrome are written here, in `src/copy.mjs`.

⚠️ Section order lives in `src/documents.mjs` and mirrors `PrivacyPolicyPage.tsx` / `TermsOfServicePage.tsx`. When legal adds a key, the build fails until it is added there too, in the same place as on the app screen.

## Updating after a policy change

```sh
node build.mjs                    # reads ../gymon at main
node verify.mjs                   # local check
git add -A && git commit -m "rebuild from gymon <sha>" && git push
node verify.mjs https://gymon.app # after Pages deploys
```

`GYMON_REPO` and `GYMON_REF` override the source repo path and ref. Each page records the commit it was built from in `<meta name="source-commit">`.

## Hosting

GitHub Pages, from `docs/` on `main`. `docs/CNAME` holds the custom domain.
