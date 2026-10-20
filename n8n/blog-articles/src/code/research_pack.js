// Research pack — the only research text the writer sees, size-capped:
// source ≤ 5,000 chars, ≤ 10 search snippets of ≤ 450 chars, 2 pages ≤ 4,000 chars each.
// Every URL carries its tier (PRIMARY / AUTHORITY / SECONDARY) and is stripped of tracking parameters.
const SOURCE_CHARS = 5000;
const PAGE_CHARS = 4000;

const cleanUrl = u => String(u || '').trim()
  .replace(/([?&])(?:utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|ref|source|campaign|cmpid|icid|s_cid)=[^&#]*/gi, '$1')
  .replace(/\?&+/, '?').replace(/&{2,}/g, '&').replace(/[?&]+(#|$)/, '$1');
const PRIMARY = /(pubmed\.ncbi\.nlm\.nih\.gov|pmc\.ncbi\.nlm\.nih\.gov|ncbi\.nlm\.nih\.gov\/pmc|doi\.org|bjsm\.bmj\.com|bmj\.com|link\.springer\.com|springeropen\.com|biomedcentral\.com|frontiersin\.org|journals\.lww\.com|journals\.physiology\.org|tandfonline\.com|jissn|sciencedirect\.com|onlinelibrary\.wiley\.com|mdpi\.com|nature\.com|cochranelibrary\.com|journals\.plos\.org|jamanetwork\.com|thelancet\.com|academic\.oup\.com|journals\.sagepub\.com|humankinetics\.com)/i;
const AUTHORITY = /(acsm\.org|nsca\.com|sportsnutritionsociety\.org|\.gov(\/|$|\.)|nih\.gov|who\.int|nhs\.uk|\.edu(\/|$)|\.ac\.[a-z]{2}(\/|$)|ausport\.gov\.au|eatright\.org)/i;
const tierOf = u => PRIMARY.test(u) ? 'PRIMARY' : AUTHORITY.test(u) ? 'AUTHORITY' : 'SECONDARY';

const plan = $('Topic plan').first().json;
const src = $('Fetch source article').first().json;
const picked = $('Pick pages to read').first().json;
const pages = ($input.first().json.results || []);

const clip = (s, n) => {
  const t = String(s || '').replace(/\n{3,}/g, '\n\n').trim();
  return t.length > n ? t.slice(0, n) + ' […]' : t;
};
const sourceUrl = cleanUrl(plan.source_url);
const srcText = clip(src.results && src.results[0] && src.results[0].raw_content, SOURCE_CHARS);

const allowed = [sourceUrl];
const read = srcText ? [sourceUrl] : [];  // URLs whose own page text is in the pack (→ fullTextRead)
const blocks = [];
blocks.push(`### Source article [${srcText ? 'EXTRACTED' : 'SNIPPET'}] [${tierOf(sourceUrl)}]\n${plan.source_title}\n${sourceUrl}\n\n${srcText || '(could not be fetched — rely on the search results)'}`);
const pageMap = {};
for (const p of pages) pageMap[cleanUrl(p.url)] = p.raw_content;
const readUrls = [...new Set(picked.urls.map(cleanUrl))];
readUrls.forEach((u, i) => {
  if (!pageMap[u]) return;
  allowed.push(u);
  read.push(u);
  blocks.push(`### Page ${i + 1} [EXTRACTED] [${tierOf(u)}]\n${u}\n\n${clip(pageMap[u], PAGE_CHARS)}`);
});
const digest = (picked.digest || []).map((r, i) => {
  const u = cleanUrl(r.url);
  allowed.push(u);
  return `${i + 1}. [SNIPPET] [${tierOf(u)}] ${r.title}\n   ${u}\n   ${r.snippet}`;
});
blocks.push(`### Search results (snippets only)\n${digest.join('\n') || '(none)'}`);

const allowedUrls = [...new Set(allowed.filter(Boolean))];
const research = blocks.join('\n\n');
const extracted = [...new Set(read)];
return [{ json: {
  research,
  allowed_urls: allowedUrls,
  read_urls: extracted,
  allowed_with_tier: allowedUrls.map(u => `[${tierOf(u)}] [${extracted.includes(u) ? 'EXTRACTED' : 'SNIPPET'}] ${u}`),
  research_chars: research.length,
}, pairedItem: { item: 0 } }];
