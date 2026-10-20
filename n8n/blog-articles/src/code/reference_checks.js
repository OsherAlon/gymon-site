// Reference checks — one HTTP request per check, so every source is resolved before the
// review email: each reference URL, each DOI through Crossref, each PMID through NCBI.
const b = $('Validate articles').first().json;
const MAILTO = 'gymon.official@gmail.com';
const out = [];
for (const r of b.article_en.references || []) {
  out.push({ kind: 'url', ref: r.id, url: r.url });
  if (r.doi) out.push({ kind: 'doi', ref: r.id, url: `https://api.crossref.org/works/${encodeURIComponent(r.doi)}?mailto=${MAILTO}` });
  if (r.pmid) out.push({ kind: 'pmid', ref: r.id, url: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${r.pmid}` });
}
// Never zero items: the HTTP node would not run and the chain would stop.
if (!out.length) out.push({ kind: 'none', ref: '', url: 'https://api.crossref.org/works?rows=0' });
return out.map((json) => ({ json, pairedItem: { item: 0 } }));
