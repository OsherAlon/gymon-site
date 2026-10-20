// Shortlist candidates — runs once for all RSS items.
// Drops items already used (gymon_blog_sources), off-topic items, items older than MAX_AGE_DAYS,
// and duplicates; then interleaves by site so one busy feed cannot fill the list.
// Always returns ONE item with counters, so an empty shortlist is visible in the execution
// (the next IF stops the run when candidates is empty).
// No `new URL()` here: execution 1530 returned 0 items from 462 feed items while the same code
// and data gave 88 candidates locally — the only silent drop was the URL parse in a try/catch.
const MAX_AGE_DAYS = 30;
const MAX_CANDIDATES = 30;

const usedRows = $('Get used sources').all().map(i => i.json).filter(r => r && r.source_url);
const used = new Set(usedRows.map(r => String(r.source_url).trim()));
const usedTopics = usedRows.map(r => r.topic).filter(Boolean).slice(-60);
// Published articles (status committed): no-repeat list for the topic picker, link targets for the writer.
const published = $('Get published articles').all().map(i => i.json).filter(r => r && r.slug && r.status === 'committed')
  .map(r => ({ slug: r.slug, title_en: r.title_en, title_he: r.title_he, pillar: r.pillar || '' }));

// No supplement / nutrition / injury terms: those topics are never written (no credentialed reviewer).
const relevant = /(strength|resistance (training|exercise)|weight[- ]?(lifting|training)|lifting|hypertroph|muscle|squat|deadlift|bench press|\bsets?\b|\breps?\b|repetition|training volume|progressive overload|rest interval|inter-set|warm[- ]?up|exercise|workout|fitness|power training|1rm|one-repetition|deload|periodi[sz]|adherence|training frequency|split)/i;
const exclude = /\b(mice|mouse|murine|rats?|zebrafish|in vitro|drosophila|cell line|supplement\w*|creatine|caffeine|diet\w*|weight loss|obes\w*|injur\w*|pain|rehab\w*|pregnan\w*|postpartum|menopaus\w*|diabet\w*|cancer|patients?|disease)\b/i;

const cutoff = Date.now() - MAX_AGE_DAYS * 864e5;
const seen = new Set();
const all = [];
const count = { feed_items: 0, no_link: 0, already_used: 0, duplicate: 0, off_topic: 0, too_old: 0, kept: 0 };
const hostOf = u => (String(u).match(/^https?:\/\/([^\/?#:]+)/i) || [, ''])[1].toLowerCase().replace(/^www\./, '');

for (const item of $input.all()) {
  count.feed_items++;
  const j = item.json || {};
  const link = String(j.link || j.guid || '').trim();
  if (!/^https?:\/\//.test(link)) { count.no_link++; continue; }
  if (used.has(link)) { count.already_used++; continue; }
  if (seen.has(link)) { count.duplicate++; continue; }
  const title = String(j.title || '').replace(/\s+/g, ' ').trim();
  const snippet = String(j.contentSnippet || j.content || j.summary || '')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
  const text = `${title} ${snippet}`;
  if (!title || !relevant.test(text) || exclude.test(text)) { count.off_topic++; continue; }
  const d = Date.parse(j.isoDate || j.pubDate || j.date || '');
  if (!isNaN(d) && d < cutoff) { count.too_old++; continue; }
  const host = hostOf(link) || 'unknown';
  seen.add(link);
  count.kept++;
  all.push({ title, link, snippet, host, date: isNaN(d) ? '' : new Date(d).toISOString().slice(0, 10) });
}

all.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
const byHost = {};
for (const c of all) (byHost[c.host] = byHost[c.host] || []).push(c);
const picked = [];
let added = true;
while (picked.length < MAX_CANDIDATES && added) {
  added = false;
  for (const h of Object.keys(byHost)) {
    const c = byHost[h].shift();
    if (c) { picked.push(c); added = true; }
    if (picked.length >= MAX_CANDIDATES) break;
  }
}

return [{ json: { candidates: picked, used_topics: usedTopics, published, used_slugs: usedRows.map(r => r.slug).filter(Boolean), candidate_count: all.length, counts: count } }];
