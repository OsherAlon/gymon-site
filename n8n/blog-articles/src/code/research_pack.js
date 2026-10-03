// Research pack — the only research text the writer sees, size-capped:
// source ≤ 5,000 chars, ≤ 10 search snippets of ≤ 450 chars, 2 pages ≤ 4,000 chars each.
const SOURCE_CHARS = 5000;
const PAGE_CHARS = 4000;

const plan = $('Topic plan').first().json;
const src = $('Fetch source article').first().json;
const picked = $('Pick pages to read').first().json;
const pages = ($input.first().json.results || []);

const clip = (s, n) => {
  const t = String(s || '').replace(/\n{3,}/g, '\n\n').trim();
  return t.length > n ? t.slice(0, n) + ' […]' : t;
};
const srcText = clip(src.results && src.results[0] && src.results[0].raw_content, SOURCE_CHARS);

const allowed = [plan.source_url];
const blocks = [];
blocks.push(`### Source article\n${plan.source_title}\n${plan.source_url}\n\n${srcText || '(could not be fetched — rely on the search results)'}`);
const pageMap = {};
for (const p of pages) pageMap[p.url] = p.raw_content;
const readUrls = [...new Set(picked.urls)];
readUrls.forEach((u, i) => {
  if (!pageMap[u]) return;
  allowed.push(u);
  blocks.push(`### Page ${i + 1} (read in full)\n${u}\n\n${clip(pageMap[u], PAGE_CHARS)}`);
});
const digest = (picked.digest || []).map((r, i) => {
  allowed.push(r.url);
  return `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`;
});
blocks.push(`### Search results (snippets only)\n${digest.join('\n') || '(none)'}`);

const allowedUrls = [...new Set(allowed.filter(Boolean))];
return [{ json: { research: blocks.join('\n\n'), allowed_urls: allowedUrls, research_chars: blocks.join('\n\n').length }, pairedItem: { item: 0 } }];
