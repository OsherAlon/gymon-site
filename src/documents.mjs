/**
 * The order of every legal document, section by section.
 *
 * 🔴 This MIRRORS `app/src/screens/PrivacyPolicyPage.tsx` and
 * `TermsOfServicePage.tsx` in the gymon repo, and it is written out by hand for
 * the same reason those screens are: the copy points forwards and backwards
 * ("as detailed above" / "as set out below"), so the order is part of the
 * legal text. A loop over JSON key order would make it depend on formatting.
 *
 * ⇒ When legal adds a key, it has to be added here too. `build.mjs` refuses to
 * build if any key in the JSON is not rendered, or if a key named here is
 * missing — the silent-omission trap the app screens only warn about in
 * comments fails loudly here.
 *
 * Block types:
 *   p      — a paragraph            (key)
 *   strong — an emphasised paragraph (key)
 *   list   — a bullet list          (keys)
 *   sub    — a titled sub-section   (base: `${base}.title` + `${base}.body`)
 */

export const privacyPolicy = [
  { section: 'intro', blocks: [{ p: 'body' }] },
  { section: 'controller', blocks: [{ p: 'body' }] },
  {
    section: 'dataCollected',
    blocks: [
      { p: 'intro' },
      // Same order as the app's accordions, and load-bearing for the same
      // reasons: `appleRelay` qualifies `registration`, and `notCollected`
      // points back at `profile` and `healthKit`.
      { sub: 'registration' },
      { sub: 'appleRelay' },
      { sub: 'usage' },
      { sub: 'profile' },
      { sub: 'healthKit' },
      { sub: 'notCollected' },
    ],
  },
  { section: 'purposes', blocks: [{ list: ['registration', 'usage', 'profile'] }] },
  { section: 'legalBasis', blocks: [{ p: 'body' }] },
  {
    section: 'thirdParties',
    blocks: [{ p: 'body' }, { p: 'identityProviders' }, { p: 'note' }],
  },
  // After `thirdParties`: its `note` points forward at this section.
  { section: 'payments', blocks: [{ p: 'body' }] },
  { section: 'futureAi', blocks: [{ p: 'body' }, { p: 'note' }] },
  { section: 'retention', blocks: [{ p: 'body' }] },
  {
    section: 'rights',
    blocks: [
      { p: 'intro' },
      {
        list: ['access', 'rectification', 'erasure', 'portability', 'objection', 'withdraw', 'complaint'],
      },
      { strong: 'howToday' },
    ],
  },
  { section: 'security', blocks: [{ p: 'body' }] },
  { section: 'changes', blocks: [{ p: 'body' }] },
  { section: 'contact', blocks: [{ p: 'body' }] },
];

export const termsOfService = [
  { section: 'intro', blocks: [{ p: 'body1' }, { p: 'body2' }] },
  { section: 'nature', blocks: [{ p: 'body1' }, { p: 'body2' }] },
  { section: 'account', blocks: [{ p: 'body1' }, { p: 'body2' }] },
  {
    section: 'fairUse',
    blocks: [{ p: 'intro' }, { list: ['item1', 'item2', 'item3', 'item4'] }, { p: 'outro' }],
  },
  { section: 'ip', blocks: [{ p: 'body' }] },
  { section: 'userContent', blocks: [{ p: 'body' }, { p: 'note' }] },
  { section: 'payments', blocks: [{ p: 'body1' }, { p: 'body2' }] },
  { section: 'termination', blocks: [{ p: 'body1' }, { p: 'body2' }] },
  { section: 'liability', blocks: [{ p: 'body1' }, { p: 'body2' }] },
  { section: 'contact', blocks: [{ p: 'body' }] },
  { section: 'governingLaw', blocks: [{ p: 'body' }] },
];
