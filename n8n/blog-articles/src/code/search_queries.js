// Search queries — exactly 3 items, one per Tavily search (hard cap: 3 searches per article).
const MAX_SEARCHES = 3;
const p = $('Topic plan').first().json;
const qs = (Array.isArray(p.search_queries) ? p.search_queries : [])
  .map(q => String(q || '').trim()).filter(Boolean);
const fallback = [`${p.topic} systematic review`, `${p.primary_keyword_en} meta-analysis`, `${p.primary_keyword_en} position stand`];
const out = [];
for (const q of qs.concat(fallback)) {
  if (out.length >= MAX_SEARCHES) break;
  if (!out.includes(q)) out.push(q);
}
return out.map(query => ({ json: { query }, pairedItem: { item: 0 } }));  // keep the link to Topic plan
