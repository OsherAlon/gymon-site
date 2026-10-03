// Shortlist candidates — runs once for all RSS items.
// Drops items already used (gymon_blog_sources), off-topic items, items older than MAX_AGE_DAYS,
// and duplicates; then interleaves by site so one busy feed cannot fill the list.
const MAX_AGE_DAYS = 30;
const MAX_CANDIDATES = 30;

const usedRows = $('Get used sources').all().map(i => i.json).filter(r => r && r.source_url);
const used = new Set(usedRows.map(r => String(r.source_url).trim()));
const usedTopics = usedRows.map(r => r.topic).filter(Boolean).slice(-60);

const relevant = /(strength|resistance (training|exercise)|weight[- ]?(lifting|training)|lifting|hypertroph|muscle|squat|deadlift|bench press|\bsets?\b|\breps?\b|repetition|training volume|progressive overload|rest interval|inter-set|recovery|warm[- ]?up|stretching|mobility|sleep|protein|creatine|exercise|workout|fitness|athlet|sarcopenia|power training|1rm|one-repetition|tendon|deload|periodi[sz]|adherence|physical activity)/i;
const exclude = /\b(mice|mouse|murine|rats?|zebrafish|in vitro|drosophila|cell line)\b/i;

const cutoff = Date.now() - MAX_AGE_DAYS * 864e5;
const seen = new Set();
const all = [];

for (const item of $input.all()) {
  const j = item.json || {};
  const link = String(j.link || j.guid || '').trim();
  if (!/^https?:\/\//.test(link)) continue;
  if (used.has(link) || seen.has(link)) continue;
  const title = String(j.title || '').replace(/\s+/g, ' ').trim();
  const snippet = String(j.contentSnippet || j.content || j.summary || '')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
  const text = `${title} ${snippet}`;
  if (!title || !relevant.test(text) || exclude.test(text)) continue;
  const d = Date.parse(j.isoDate || j.pubDate || j.date || '');
  if (!isNaN(d) && d < cutoff) continue;
  let host = '';
  try { host = new URL(link).hostname.replace(/^www\./, ''); } catch (e) { continue; }
  seen.add(link);
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

if (!picked.length) return [];
return [{ json: { candidates: picked, used_topics: usedTopics, used_slugs: usedRows.map(r => r.slug).filter(Boolean), candidate_count: all.length } }];
