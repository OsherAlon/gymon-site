// Pick pages to read — merges the 3 search results, keeps a short digest of the best results and
// chooses the 2 pages to read in full (hard cap: 2 extracted pages per article).
const MAX_PAGES = 2;
const MAX_DIGEST = 10;
const SNIPPET_CHARS = 450;
const TRUSTED = /(pubmed|ncbi\.nlm\.nih\.gov|nih\.gov|bjsm\.bmj|bmj\.com|springer|link\.springer|frontiersin|journals\.lww|physiology\.org|tandfonline|jissn|acsm\.org|nsca\.com|sciencedirect|wiley|mdpi|nature\.com|cochrane|who\.int|\.edu\b|strongerbyscience|examine\.com)/i;
const source = $('Topic plan').first().json.source_url;

const seen = new Set();
const results = [];
for (const item of $input.all()) {
  for (const r of (item.json.results || [])) {
    const url = String(r.url || '').trim();
    if (!/^https?:\/\//.test(url) || seen.has(url) || url === source) continue;
    seen.add(url);
    const boost = TRUSTED.test(url) ? 0.25 : 0;
    results.push({
      url,
      title: String(r.title || '').replace(/\s+/g, ' ').trim(),
      snippet: String(r.content || '').replace(/\s+/g, ' ').trim().slice(0, SNIPPET_CHARS),
      score: (Number(r.score) || 0) + boost,
    });
  }
}
results.sort((a, b) => b.score - a.score);
const digest = results.slice(0, MAX_DIGEST);
const urls = digest.slice(0, MAX_PAGES).map(r => r.url);
while (urls.length < MAX_PAGES) urls.push(urls[0] || source);  // the extract node needs 2 entries
return [{ json: { urls, digest }, pairedItem: { item: 0 } }];
