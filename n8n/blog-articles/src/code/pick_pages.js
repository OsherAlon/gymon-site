// Pick pages to read — merges the 3 search results, drops commercial pages, ranks by source tier
// (PRIMARY > AUTHORITY > SECONDARY), keeps a short digest and chooses the 2 pages to read in full
// (hard cap: 2 extracted pages per article). All URLs are stripped of tracking parameters.
const MAX_PAGES = 2;
const MAX_DIGEST = 10;
const SNIPPET_CHARS = 450;

const cleanUrl = u => String(u || '').trim()
  .replace(/([?&])(?:utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|ref|source|campaign|cmpid|icid|s_cid)=[^&#]*/gi, '$1')
  .replace(/\?&+/, '?').replace(/&{2,}/g, '&').replace(/[?&]+(#|$)/, '$1');
const hostOf = u => (String(u).match(/^https?:\/\/([^\/?#:]+)/i) || [, ''])[1].toLowerCase().replace(/^www\./, '');

const PRIMARY = /(pubmed\.ncbi\.nlm\.nih\.gov|pmc\.ncbi\.nlm\.nih\.gov|ncbi\.nlm\.nih\.gov\/pmc|doi\.org|bjsm\.bmj\.com|bmj\.com|link\.springer\.com|springeropen\.com|biomedcentral\.com|frontiersin\.org|journals\.lww\.com|journals\.physiology\.org|tandfonline\.com|jissn|sciencedirect\.com|onlinelibrary\.wiley\.com|mdpi\.com|nature\.com|cochranelibrary\.com|journals\.plos\.org|jamanetwork\.com|thelancet\.com|academic\.oup\.com|journals\.sagepub\.com|humankinetics\.com)/i;
const AUTHORITY = /(acsm\.org|nsca\.com|sportsnutritionsociety\.org|\.gov(\/|$|\.)|nih\.gov|who\.int|nhs\.uk|\.edu(\/|$)|\.ac\.[a-z]{2}(\/|$)|ausport\.gov\.au|eatright\.org)/i;
const COMMERCIAL = /(amazon\.|ebay\.|walmart\.|iherb\.|bodybuilding\.com|myprotein|gnc\.com|\/\/(shop|store)\.|\/(shop|store|products?|collections|cart)(\/|$)|coupon|discount-code|\bbest-[a-z-]*(supplements?|creatine|protein|pre-workout)|\btop-\d+-|(product|honest|buyers?)-reviews?|buyers?-guide|affiliate|sponsored)/i;  // only applied to SECONDARY pages
const tierOf = u => PRIMARY.test(u) ? 'PRIMARY' : AUTHORITY.test(u) ? 'AUTHORITY' : 'SECONDARY';
const RANK = { PRIMARY: 2, AUTHORITY: 1.5, SECONDARY: 0 };

const source = cleanUrl($('Topic plan').first().json.source_url);
const seen = new Set();
const results = [];
let dropped = 0;
for (const item of $input.all()) {
  for (const r of (item.json.results || [])) {
    const url = cleanUrl(r.url);
    if (!/^https?:\/\//.test(url) || seen.has(url) || url === source) continue;
    seen.add(url);
    const title = String(r.title || '').replace(/\s+/g, ' ').trim();
    const tier = tierOf(url);
    if (tier === 'SECONDARY' && (COMMERCIAL.test(url) || /\b(best|top \d+)\b.*\b(supplements?|creatine|protein powders?|brands?)\b|\bbuy\b|\bcoupon\b/i.test(title))) { dropped++; continue; }
    results.push({
      url, title, tier, host: hostOf(url),
      snippet: String(r.content || '').replace(/\s+/g, ' ').trim().slice(0, SNIPPET_CHARS),
      score: (Number(r.score) || 0) + RANK[tier],
    });
  }
}
results.sort((a, b) => b.score - a.score);
const digest = results.slice(0, MAX_DIGEST);
const urls = digest.slice(0, MAX_PAGES).map(r => r.url);
while (urls.length < MAX_PAGES) urls.push(urls[0] || source);  // the extract node needs 2 entries
return [{ json: { urls, digest, dropped_commercial: dropped }, pairedItem: { item: 0 } }];
