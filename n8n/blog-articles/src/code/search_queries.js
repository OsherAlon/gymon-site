// Search queries — exactly 3 items, one per Tavily search (hard cap: 3 searches per article).
// The last query always looks for a position stand, so the writer can cite the stand itself.
const MAX_SEARCHES = 3;
const p = $('Topic plan').first().json;
const kw = String(p.primary_keyword_en || p.topic || '').trim();
const qs = (Array.isArray(p.search_queries) ? p.search_queries : [])
  .map(q => String(q || '').trim()).filter(Boolean);
const fallback = [`${kw} systematic review meta-analysis`, `${p.topic} randomized controlled trial`];
const stand = qs.find(q => /position stand|consensus|guideline/i.test(q)) || `${kw} position stand ISSN OR ACSM OR NSCA`;
const out = [];
for (const q of qs.concat(fallback)) {
  if (out.length >= MAX_SEARCHES - 1) break;
  if (q !== stand && !out.includes(q)) out.push(q);
}
out.push(stand);
return out.map(query => ({ json: { query }, pairedItem: { item: 0 } }));  // keep the link to Topic plan
