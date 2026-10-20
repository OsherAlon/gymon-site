#!/usr/bin/env node
/**
 * Emits, as one JSON object on stdout, everything build.py needs from the SITE's article
 * contract — so the n8n workflow and the site build can never drift apart:
 *
 *   lib           schema.mjs + inline.mjs + validate.mjs, imports/exports stripped, for
 *                 inlining into n8n Code nodes (one shared validator, UX doctrine §8b)
 *   inline        inline.mjs alone (stripped), for the review page's browser script
 *   writerSchema  the JSON Schema the English writer must follow (code-owned fields omitted)
 *   hebrewSchema  the same without `references` (code copies them from the English article)
 *
 * Run by build.py; standalone: node src/emit.mjs > /dev/null
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as S from '../../../src/lib/article/schema.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIB = join(HERE, '..', '..', '..', 'src', 'lib', 'article');

function strip(file) {
  const src = readFileSync(join(LIB, file), 'utf8');
  const out = src
    .replace(/^import[\s\S]*?from\s+'[^']+';\s*$/gm, '')
    .replace(/^export\s+(?=(const|function|let|class)\b)/gm, '')
    // Comments stay in the site source; the n8n copy drops them to keep the workflow small.
    .replace(/^[ \t]*\/\*[\s\S]*?\*\/[ \t]*\n/gm, '')
    .replace(/^[ \t]*\/\/.*\n/gm, '')
    .replace(/^[ \t]+/gm, '')   // indentation is not significant in these files (no multi-line template literals)
    .replace(/\n{2,}/g, '\n');
  const code = out.split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join('\n');
  if (/\\u[0-9a-fA-F]{4}/.test(code)) throw new Error(`${file} contains a \\u escape (breaks in the n8n MCP path)`);
  if (/new URL\(/.test(code)) throw new Error(`${file} uses new URL() (silently fails in n8n Code nodes)`);
  return `// ---- ${file} (generated from the site repo; edit there) ----\n${out.trim()}\n`;
}

const str = (extra = {}) => ({ type: 'string', minLength: 1, ...extra });
const text = (description) => str({ description });
const refIds = { type: 'array', items: { type: 'string', pattern: '^r\\d{1,2}$' }, description: 'ids of references that support this item' };
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, required });

const INLINE =
  'Inline text. Allowed markup only: **bold** (sparingly), [[r1]] or [[r1,r2]] citation markers at the end of the supported sentence, and [anchor](/blog/slug) links to published Gymon articles (Hebrew: /he/blog/slug). No other Markdown, no HTML, no external links.';

const block = {
  anyOf: [
    obj({ type: { const: 'p' }, text: text(INLINE) }),
    obj({ type: { const: 'list' }, ordered: { type: 'boolean' }, items: { type: 'array', minItems: 2, maxItems: 8, items: text(INLINE) } }, ['type', 'items']),
    obj({ type: { const: 'takeaway' }, text: text('One-sentence bottom line of the section. At most one per section.') }),
    obj(
      { type: { const: 'claim' }, evidence: { enum: S.EVIDENCE_LEVELS }, refs: refIds, text: text('The claim, worded with the certainty verb of its evidence level.') },
      ['type', 'evidence', 'refs', 'text'],
    ),
    obj({ type: { const: 'callout' }, kind: { enum: S.CALLOUT_KINDS }, text: text(INLINE) }),
    obj(
      {
        type: { const: 'table' },
        caption: text('What the table shows.'),
        columns: { type: 'array', minItems: 2, maxItems: 5, items: str() },
        rows: { type: 'array', minItems: 1, maxItems: 10, items: { type: 'array', items: { type: 'string' } } },
        refs: refIds,
      },
      ['type', 'caption', 'columns', 'rows', 'refs'],
    ),
    obj(
      {
        type: { const: 'calculator' },
        calculator: { enum: Object.keys(S.CALCULATORS) },
        defaults: obj(
          {
            weightKg: { type: 'number', minimum: S.CALCULATORS['one-rep-max'].weightKg.min, maximum: S.CALCULATORS['one-rep-max'].weightKg.max },
            reps: { type: 'integer', minimum: S.CALCULATORS['one-rep-max'].reps.min, maximum: S.CALCULATORS['one-rep-max'].reps.max },
          },
          [],
        ),
      },
      ['type', 'calculator'],
    ),
    obj({ type: { const: 'cta' } }),
    obj(
      {
        type: { const: 'gymon' },
        kind: { const: 'log-example' },
        exercise: str(),
        caption: text('One sentence on what the example shows.'),
        sessions: {
          type: 'array',
          minItems: 1,
          maxItems: 3,
          items: obj({
            label: str({ description: 'e.g. "Week 1"' }),
            sets: {
              type: 'array',
              minItems: 1,
              maxItems: 6,
              items: obj({ previous: { anyOf: [{ type: 'null' }, obj({ kg: { type: 'number' }, reps: { type: 'integer' } })] }, kg: { type: 'number' }, reps: { type: 'integer' } }),
            },
          }),
        },
        text: text('What the example teaches, numbers recomputed correctly.'),
      },
      ['type', 'kind', 'exercise', 'caption', 'sessions', 'text'],
    ),
    obj(
      {
        type: { const: 'gymon' },
        kind: { enum: ['plan-logic', 'teardown-finding'] },
        heading: str(),
        text: text('Built only from the GYMON MATERIAL.'),
        points: { type: 'array', maxItems: 5, items: str() },
      },
      ['type', 'kind', 'text'],
    ),
  ],
};

const reference = obj(
  {
    id: str({ pattern: '^r\\d{1,2}$' }),
    title: str({ description: 'Exact title as it appears in the research pack.' }),
    authors: { type: 'array', items: str(), description: 'Surname + initials, as in the pack; [] if unknown.' },
    year: { type: ['integer', 'null'] },
    venue: { type: 'string', description: 'Journal / organisation, or "" if unknown.' },
    url: str({ description: 'Copied exactly from the Allowed URLs list.' }),
    doi: str({ pattern: '^10\\.\\d{4,9}/\\S+$', description: 'Only if it is printed in the research pack.' }),
    pmid: str({ pattern: '^\\d{4,9}$', description: 'Only if it is printed in the research pack.' }),
    type: { enum: S.REF_TYPES },
    quote: str({ description: 'VERBATIM text copied from the research pack for this URL, containing every number the article attributes to this reference.' }),
  },
  ['id', 'title', 'authors', 'year', 'venue', 'url', 'type', 'quote'],
);

function articleSchema({ withReferences }) {
  const props = {
    title: str({ maxLength: S.LIMITS.title.max, description: `≤ ${S.LIMITS.title.max} characters; states or answers the question; contains the primary query.` }),
    heroTitle: str({ description: '2–4 words, no colon, never a heading.' }),
    description: str({ description: 'Meta description: EN 120–155 characters, HE 100–145.' }),
    primaryQuery: str({ description: 'The primary search query in this language, as people type it.' }),
    imageAlt: str({ description: 'Placeholder alt text; replaced after the image exists.' }),
    tldr: text('1–3 sentences that answer the title question, with a GRADE-style certainty verb. ' + INLINE),
    keyTakeaways: { type: 'array', minItems: S.LIMITS.keyTakeaways[0], maxItems: S.LIMITS.keyTakeaways[1], items: obj({ text: text(INLINE), refs: refIds }, ['text']) },
    sections: {
      type: 'array',
      minItems: S.LIMITS.sections[0],
      maxItems: S.LIMITS.sections[1],
      items: obj({ heading: text('An informative statement or question; first two words carry the gist.'), apply: { type: 'boolean', description: 'true on exactly one section (the practical protocol that holds the cta block), false on every other section.' }, blocks: { type: 'array', minItems: 1, items: block } }, ['heading', 'apply', 'blocks']),
    },
    faq: { type: 'array', minItems: 3, maxItems: S.LIMITS.faq[1], items: obj({ q: str(), a: text('40–60 words. ' + INLINE), refs: refIds }, ['q', 'a']) },
    quiz: {
      type: 'array',
      maxItems: S.LIMITS.quiz[1],
      items: obj({ question: str(), options: { type: 'array', minItems: 3, maxItems: 4, items: str() }, correctIndex: { type: 'integer', minimum: 0 }, explanation: text(INLINE), refs: refIds }, ['question', 'options', 'correctIndex', 'explanation']),
    },
    references: { type: 'array', minItems: 2, maxItems: 12, items: reference },
    cta: obj({ slot: { enum: S.CTA_SLOTS } }),
  };
  if (!withReferences) delete props.references;
  return { $schema: 'https://json-schema.org/draft/2020-12/schema', ...obj(props) };
}

process.stdout.write(
  JSON.stringify({
    lib: strip('schema.mjs') + strip('inline.mjs') + strip('validate.mjs'),
    schemaOnly: strip('schema.mjs'),
    inline: strip('inline.mjs'),
    writerSchema: articleSchema({ withReferences: true }),
    hebrewSchema: articleSchema({ withReferences: false }),
    codeFields: S.CODE_FIELDS,
  }),
);
