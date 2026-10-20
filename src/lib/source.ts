/**
 * 🔴 The legal text is READ FROM THE APP, never copied: the JSON files are taken
 * with `git show <ref>:app/src/locales/...` from the gymon repo, so what is
 * published is exactly what a given commit ships. Default ref: `main`.
 *
 *   npm run build                                   # ../gymon, ref main
 *   GYMON_REPO=/path/to/gymon GYMON_REF=abc123 npm run build
 *
 * Runs at build time only (Node) — nothing here reaches the browser.
 */

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export const DOMAIN = 'gymon.app';
export const LANGS = ['en', 'he'] as const;
export type Lang = (typeof LANGS)[number];

// `process.cwd()` is the project root under `astro build` / `astro dev`.
const REPO = resolve(process.env.GYMON_REPO ?? resolve(process.cwd(), '..', 'gymon'));
const REF = process.env.GYMON_REF ?? 'main';

const git = (...args: string[]) => execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8' });

export const COMMIT = git('rev-parse', '--short', `${REF}^{commit}`).trim();
export const SOURCE_INFO = `${REPO} @ ${COMMIT} (${REF})`;

type Json = Record<string, any>;
const readJson = (lang: Lang, ns: string): Json =>
  JSON.parse(git('show', `${COMMIT}:app/src/locales/${lang}/${ns}.json`));

export const source: Record<Lang, { privacyPolicy: Json; termsOfService: Json; home: Json }> = {
  en: { privacyPolicy: readJson('en', 'privacyPolicy'), termsOfService: readJson('en', 'termsOfService'), home: readJson('en', 'home') },
  he: { privacyPolicy: readJson('he', 'privacyPolicy'), termsOfService: readJson('he', 'termsOfService'), home: readJson('he', 'home') },
};

console.log(`[gymon-site] legal text from ${SOURCE_INFO}`);
