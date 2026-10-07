// Validate articles — the site's own validator (src/lib/article/validate.mjs, inlined below)
// on both languages, with the pipeline context: the research pack (quotes and their numbers
// must be in it), the Gymon material, the allowed URLs and the published slugs. Errors block
// Approve on the review page; warnings are shown to the reviewer.
/*__LIB__*/
const GYMON_MATERIAL = __GYMON_MATERIAL_JSON__;
const b = $input.first().json;
const publishedSlugs = {
  en: (b.published || []).map((p) => p.slug),
  he: (b.published || []).filter((p) => p.has_he !== false).map((p) => p.slug),
};
const ctx = {
  mode: 'pipeline',
  researchText: String(b.research_text || ''),
  gymonMaterial: GYMON_MATERIAL,
  allowedUrls: (b.allowed_urls || []).map(cleanUrl),
  publishedSlugs,
};
const en = validateArticle(b.article_en, ctx);
const he = validateArticle(b.article_he, ctx);

// Cross-language consistency: the Hebrew is an adaptation of the same article.
const cross = [];
const blocksOf = (a) => (a.sections || []).map((s) => (s.blocks || []).map((x) => x.type).join(','));
if ((b.article_en.sections || []).length !== (b.article_he.sections || []).length) cross.push({ path: 'sections', message: 'EN and HE have a different number of sections' });
else blocksOf(b.article_en).forEach((t, i) => { if (t !== blocksOf(b.article_he)[i]) cross.push({ path: `sections[${i}]`, message: 'EN and HE blocks differ' }); });
const refsUsed = (a) => [...new Set(collectUnits(a).flatMap((u) => u.refs))].sort().join(',');
if (refsUsed(b.article_en) !== refsUsed(b.article_he)) he.warnings.push({ path: 'references', message: 'EN and HE cite different references' });
const numsOf = (a) => collectUnits(a).filter((u) => u.kind === 'text').flatMap((u) => numbersIn(plainText(u.text))).sort().join(',');
if (numsOf(b.article_en) !== numsOf(b.article_he)) he.warnings.push({ path: 'numbers', message: 'EN and HE do not carry the same numbers — check the Hebrew' });

// A DOI or PMID must be printed in the research pack — otherwise the writer produced it.
const hay = normForMatch(b.research_text || '');
for (const r of b.article_en.references || []) {
  if (r.doi && !hay.includes(normForMatch(r.doi))) en.warnings.push({ path: `references.${r.id}.doi`, message: 'DOI not printed in the research pack — check it is the right paper' });
  if (r.pmid && !hay.includes(r.pmid)) en.warnings.push({ path: `references.${r.id}.pmid`, message: 'PMID not printed in the research pack' });
}

// Fact-check input for Haiku: each English unit that cites something, with the cited quotes.
const refs = new Map((b.article_en.references || []).map((r) => [r.id, r]));
const units = collectUnits(b.article_en).filter((u) => u.refs.length && u.kind !== 'heading');
const lines = units.map((u, n) => {
  const quotes = u.refs.map((id) => refs.get(id)).filter(Boolean).map((r) => `   [${r.id}${r.fullTextRead ? '' : ', snippet only'}] "${r.quote}"`).join('\n');
  return `U${n + 1} (${u.path}): ${plainText(u.text)}\n${quotes}`;
});
const hebrew = collectUnits(b.article_he).map((u) => plainText(u.text)).join('\n');
const factcheck_input = `ENGLISH UNITS WITH THEIR CITED QUOTES\n\n${lines.join('\n\n') || '(no cited units)'}\n\nHEBREW ARTICLE (plain text)\n\n${hebrew}`;


return [{ json: { ...b, validation: { en, he, cross }, factcheck_input }, pairedItem: { item: 0 } }];
