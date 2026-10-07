import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateArticle, hebrewLint, numbersIn, quoteInResearch, ymylGuard, spelledNumbersIn } from '../src/lib/article/validate.mjs';

const load = (lang) => JSON.parse(readFileSync(new URL(`../src/content/articles/sample/${lang}/estimate-one-rep-max.json`, import.meta.url), 'utf8'));
const clone = (o) => JSON.parse(JSON.stringify(o));
const codes = (r) => r.errors.map((e) => `${e.path}: ${e.message}`);

test('the sample pair passes with no errors', () => {
  for (const lang of ['en', 'he']) {
    const r = validateArticle(load(lang), { mode: 'build' });
    assert.deepEqual(codes(r), [], lang);
  }
});

test('closed schema: unknown fields fail, v1 shapes are rejected', () => {
  const a = clone(load('en'));
  a.mdx = '<Thing/>';
  a.sections = [];
  a.beats[0].badge = 'Limited evidence';
  const r = codes(validateArticle(a));
  assert.ok(r.some((e) => e.startsWith('mdx: unknown field')));
  assert.ok(r.some((e) => e.startsWith('sections: unknown field')));
  assert.ok(r.some((e) => e.startsWith('beats[0].badge: unknown field')));
});

test('YMYL topic guard rejects supplements, weight loss, injury, pregnancy', () => {
  for (const title of ['How much creatine to take', 'Weight loss with lifting', 'Squats with knee pain', 'Training during pregnancy', 'קריאטין ושריר', 'ירידה במשקל']) {
    assert.ok(ymylGuard({ title }).length, title);
  }
  assert.deepEqual(ymylGuard({ title: 'How many sets per muscle per week' }), []);
  const a = clone(load('en'));
  a.title = 'Creatine and your one-rep max';
  assert.ok(codes(validateArticle(a)).some((e) => e.startsWith('topic: YMYL')));
  a.title = load('en').title;
  a.ymylLevel = 'high';
  assert.ok(codes(validateArticle(a)).some((e) => e.startsWith('ymylLevel')));
});

test('references: unknown id, commercial host, tracking params, tier mismatch', () => {
  const a = clone(load('en'));
  a.beats[0].text += ' [[r9]]';
  a.references[0].url = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4042664/?utm_source=x';
  a.references[1].tier = 'AUTHORITY';
  const r = codes(validateArticle(a));
  assert.ok(r.some((e) => /unknown reference r9/.test(e)));
  assert.ok(r.some((e) => /tracking parameters/.test(e)));
  assert.ok(r.some((e) => /references\[1\]\.tier/.test(e)));
});

test('numbers: an unread full text cannot carry a number; a wrong number is flagged; spelled-out numbers count', () => {
  const a = clone(load('en'));
  a.beats[0].text = 'Brzycki found 25 reps at a heavy load. That is a lot [[r2]].';
  let r = validateArticle(a);
  assert.ok(codes(r).some((e) => /attributed to a source whose full text was not read/.test(e)));
  const b = clone(load('en'));
  b.beats[1].text = 'In one small study, runners did 41.2 reps. That is a lot [[r1]].';
  r = validateArticle(b);
  assert.ok(r.warnings.some((w) => /number 41.2 is not in the quote/.test(w.message)));
  const c = clone(load('en'));
  c.beats[3].text = 'Most people gain 12% a month. That is the claim.';
  assert.ok(validateArticle(c).warnings.some((w) => /without a citation/.test(w.message)));
  // Execution 1541: the quote said "Fifty-five untrained young women".
  assert.deepEqual(spelledNumbersIn('Fifty-five untrained young women; eight runners'), ['55', '8']);
  const d = clone(load('en'));
  d.beats[1].text = 'Eight runners took part. In all, 8 of them finished [[r1]].';
  assert.ok(!validateArticle(d).warnings.some((w) => /number 8 is not in the quote/.test(w.message)));
});

test('v3 readability: hook and one-sentence takeaway, one number per beat, no study detail, no refs in headlines', () => {
  const a = clone(load('en'));
  a.bottomLine = 'One. Two. Three.';
  delete a.hook;
  a.beats[1].text = 'Runners did 39.9 reps at 70% versus 17.9 for lifters [[r1]]. That is p < 0.05.';
  a.beats[2].heading += ' [[r1]]';
  const r = validateArticle(a);
  const e = codes(r);
  assert.ok(e.some((x) => /bottomLine: 3 sentences/.test(x)));
  assert.ok(e.some((x) => /^hook: required/.test(x)));
  assert.ok(e.some((x) => /beats\[2\]\.heading: no citation markers/.test(x)));
  assert.ok(r.warnings.some((w) => /at most one key number per beat/.test(w.message)));
  assert.ok(r.warnings.some((w) => /study detail in the body/.test(w.message)));
});

test('pull quote: verbatim from the cited reference (English)', () => {
  const a = clone(load('en'));
  a.pullQuote.text = 'A chart invented on a napkin.';
  assert.ok(codes(validateArticle(a)).some((e) => /pullQuote\.text: not found in the quote of r1/.test(e)));
  a.pullQuote.ref = 'r7';
  assert.ok(codes(validateArticle(a)).some((e) => /pullQuote\.ref/.test(e)));
});

test('certainty lives on the reference: "strong" needs a fully read primary/authority source', () => {
  const a = clone(load('en'));
  a.references[1].certainty = 'strong';
  assert.ok(codes(validateArticle(a)).some((e) => /references\[1\]\.certainty: "strong" needs a PRIMARY\/AUTHORITY source/.test(e)));
  delete a.references[0].finding;
  assert.ok(codes(validateArticle(a)).some((e) => /references\[0\]\.finding: required/.test(e)));
});

test('tips: 3–5 lines, calculator defaults in range, extras optional, truncation is a hard failure', () => {
  const a = clone(load('en'));
  a.tips.items = a.tips.items.slice(0, 2);
  a.calculator.defaults.reps = 30;
  const r = codes(validateArticle(a));
  assert.ok(r.some((e) => /tips\.items: 3–5/.test(e)));
  assert.ok(r.some((e) => /calculator\.defaults\.reps: 1–12/.test(e)));
  const b = clone(load('en'));
  delete b.calculator;
  delete b.pullQuote;
  assert.deepEqual(codes(validateArticle(b)), []);
  b.tips.items[b.tips.items.length - 1] = 'Repeat in a few weeks with the same';
  assert.ok(codes(validateArticle(b)).some((e) => /ends mid-sentence/.test(e)));
});

test('titles are questions: the logical last character is "?" (Hebrew too)', () => {
  for (const lang of ['en', 'he']) {
    const a = clone(load(lang));
    assert.ok(a.title.endsWith('?'), `${lang} sample title`);
    a.title = a.title.slice(0, -1);
    assert.ok(codes(validateArticle(a)).some((e) => /title: must be a question/.test(e)), lang);
    a.title += '?\u200F'; // a trailing RLM after the "?" is not accepted
    assert.ok(codes(validateArticle(a)).some((e) => /title: must be a question/.test(e)), `${lang} + RLM`);
  }
});

test('a non-sample article must carry its review date (build mode)', () => {
  const a = clone(load('en'));
  a.sample = false;
  assert.ok(codes(validateArticle(a, { mode: 'build' })).some((e) => e.startsWith('reviewedAt')));
  assert.deepEqual(codes(validateArticle(a, { mode: 'pipeline' })).filter((e) => e.startsWith('reviewedAt')), []);
});

test('pipeline context: off-list URLs, fabricated quote numbers, unpublished internal links', () => {
  const a = clone(load('en'));
  a.beats[0].text += ' See [rest](/blog/rest-between-sets).';
  const r = validateArticle(a, {
    mode: 'pipeline',
    allowedUrls: [a.references[0].url],
    researchText: 'Eight weightlifters and eight endurance runners … 90, 80 and 70% … 39.9 ± 17.6 versus 17.9 ± 2.8 0.05 19.8 6.4 11.8 2.7 10.8 3.9 7.0 2.1 8',
    publishedSlugs: { en: [], he: [] },
  });
  const e = codes(r);
  assert.ok(e.some((x) => /references\[1\]\.url: not in the research pack/.test(x)));
  assert.ok(e.some((x) => /no published article with that slug/.test(x)));
  assert.ok(r.warnings.some((w) => /not found verbatim in the research pack/.test(w.message)));
});

test('Hebrew lint: gendered forms, slash forms, en-dash ranges, × sets, false friends, transliterations', () => {
  const t = 'נסה להוסיף משקל. מתאמן/ת יכול לבצע 8–12 חזרות או 3×10, כמו כפיפות ברכיים, עם פרוגרסיב אוברלואד.';
  const out = hebrewLint(t).join('\n');
  assert.match(out, /gendered form "נסה"/);
  assert.match(out, /slash form/);
  assert.match(out, /8–12/);
  assert.match(out, /3×10/);
  assert.match(out, /כפיפות ברכיים/);
  assert.match(out, /"פרוגרסיב" is English in Hebrew letters — write "עומס הדרגתי"/);
  // The required neutral forms are not flagged.
  assert.deepEqual(hebrewLint('נסו להוסיף משקל. יש לבצע 8 עד 12 חזרות, 3 סטים של 10. מתאמנים רושמים כל סט.'), []);
});

test('numbersIn and quoteInResearch', () => {
  assert.deepEqual(numbersIn('39.9 reps at 70% of 1RM, 1,600 words, 17,5 kg'), ['39.9', '70', '1600', '17.5']);
  assert.ok(quoteInResearch('runners completed  significantly more … at 70%', 'The endurance runners completed significantly more repetitions at 70%'));
  assert.ok(!quoteInResearch('a sentence that was never written by anyone', 'something else entirely, quite long'));
});
