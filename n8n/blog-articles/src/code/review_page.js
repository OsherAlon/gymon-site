// Render review page — validates the token, then returns {html, status_code}.
// The page posts to ./approve and ./fix (same /webhook/gymon-blog/ prefix, so no absolute URL).
const q = ($('Review page request').first().json.query) || {};
const a = $('Get article (review)').first().json || {};
const versions = $('Get versions (review)').all().map(i => i.json).filter(v => v && v.article_id);

const shell = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${title}</title>
<style>
:root{--bg:#0b0b0f;--card:#16161b;--line:#2a2a33;--text:#e4e4e7;--muted:#a1a1aa;--accent:#8b5cf6;--ok:#22c55e;--warn:#facc15;--bad:#f87171}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 -apple-system,Segoe UI,Roboto,Arial,sans-serif}
.wrap{max-width:860px;margin:0 auto;padding:24px 16px 80px}
.kicker{font-size:12px;letter-spacing:.18em;color:var(--accent);font-weight:700}
h1{font-size:22px;margin:4px 0 2px}.meta{color:var(--muted);font-size:13px}
.hero{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:14px;margin:18px 0;background:#000}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin:14px 0}
.tabs{display:flex;gap:8px;margin:18px 0 0}.tab{background:transparent;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:6px 14px;font:inherit;font-size:14px;cursor:pointer}
.tab.on{background:var(--accent);border-color:var(--accent);color:#fff}
.lang .hero-t{font-size:30px;font-weight:800;line-height:1.15;margin:0 0 6px}.lang h2.t{font-size:26px;line-height:1.25;margin:0 0 6px}.lang .d{color:var(--muted);margin:0 0 6px}.lang .fm{font-size:12px;color:#71717a;margin-bottom:12px}
.body a{color:#c4b5fd}.body h2{font-size:20px;margin:26px 0 8px}.body h3{font-size:17px;margin:20px 0 6px}
.body blockquote{border-inline-start:3px solid var(--accent);margin:12px 0;padding:4px 14px;color:#d4d4d8}
[dir=rtl]{text-align:right}
.notes{border-color:#a16207;background:#1f1708}.notes h3{color:var(--warn);font-size:13px;letter-spacing:.06em;margin:0 0 6px}
.notes ul{margin:4px 0 10px;padding-inline-start:20px;font-size:14px;color:#fde68a}
.src li{font-size:14px;margin:4px 0;word-break:break-word}.src a{color:#c4b5fd}
textarea{width:100%;min-height:120px;background:#0f0f14;color:var(--text);border:1px solid var(--line);border-radius:10px;padding:12px;font:inherit}
.row{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
button.b{border:0;border-radius:10px;padding:12px 20px;font:inherit;font-weight:700;cursor:pointer}
.approve{background:var(--ok);color:#052e16}.fix{background:var(--accent);color:#fff}button:disabled{opacity:.45;cursor:not-allowed}
.status{font-size:14px;margin-top:10px;min-height:1.4em}
details{border-top:1px solid var(--line);padding:10px 0}summary{cursor:pointer;color:var(--muted);font-size:14px}
.v img{width:220px;border-radius:8px;margin:8px 0}
.pill{display:inline-block;font-size:12px;border:1px solid var(--line);border-radius:999px;padding:2px 10px;color:var(--muted)}
</style></head><body><div class="wrap">${body}</div></body></html>`;

if (!a.article_id || !q.t || q.t !== a.review_token) {
  return [{ json: { status_code: 404, html: shell('Not found', '<div class="kicker">GYMON BLOG</div><h1>Review link not found</h1><p class="meta">The link is wrong or no longer valid. Open the most recent email for this article.</p>') } }];
}

const data = {
  id: a.article_id, t: q.t, status: a.status, round: Number(a.round) || 1, slug: a.slug,
  image_url: a.image_url, published_date: a.published_date, commit_url: a.commit_url, last_feedback: a.last_feedback,
  en: { hero: a.hero_title_en, title: a.title_en, description: a.description_en, image_alt: a.image_alt_en, body: a.body_en, read: a.read_time_en },
  he: { hero: a.hero_title_he, title: a.title_he, description: a.description_he, image_alt: a.image_alt_he, body: a.body_he, read: a.read_time_he },
  sources: (() => { try { return JSON.parse(a.sources_json || '[]'); } catch (e) { return []; } })(),
  notes: (() => { try { return JSON.parse(a.check_notes || '{}'); } catch (e) { return { other: [String(a.check_notes || '')] }; } })(),
  source_url: a.source_url, source_title: a.source_title, topic: a.topic,
  versions: versions.sort((x, y) => (Number(y.round) || 0) - (Number(x.round) || 0)).map(v => ({
    round: v.round, feedback: v.feedback, route: v.route, title_en: v.title_en, title_he: v.title_he,
    body_en: v.body_en, body_he: v.body_he, image_url: v.image_url,
  })),
};
// No backslash-u escapes in this source: the n8n MCP update path decodes them into raw characters.
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029), BS = String.fromCharCode(92);
const json = JSON.stringify(data).split('<').join(BS + 'u003c').split(LS).join(BS + 'u2028').split(PS).join(BS + 'u2029');

const body = `
<div class="kicker">GYMON BLOG · REVIEW</div>
<h1 id="h"></h1>
<div class="meta" id="m"></div>
<img class="hero" id="img" alt="">
<div class="card notes" id="notes" hidden></div>
<div class="tabs"><button class="tab on" data-l="en">English</button><button class="tab" data-l="he">עברית</button><button class="tab" data-l="both">Side by side</button></div>
<div id="langs"></div>
<div class="card src"><b>Sources linked in the article</b><ul id="src"></ul><div class="meta" id="orig"></div></div>
<div class="card" id="actions">
  <b>Decision</b>
  <p class="meta">Approve commits <code>src/content/blog/{en,he}/<span class="s"></span>.md</code> and <code>public/blog/<span class="s"></span>.jpg</code> to branch <code>blog/incoming</code> of <code>OsherAlon/gymon-site</code>. Building and deploying the site stays manual.</p>
  <div class="row"><button class="b approve" id="ap">Approve</button></div>
  <p class="meta" style="margin-top:18px">Or describe what to fix (Hebrew or English). The text, the image, or both will be redone and a new email will arrive.</p>
  <textarea id="fb" placeholder="What should change?"></textarea>
  <div class="row"><button class="b fix" id="fx">Send for fixes</button></div>
  <div class="status" id="st"></div>
</div>
<div class="card" id="vers" hidden><b>Earlier versions</b><div id="vl"></div></div>
<script type="application/json" id="data">${json}</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js"></script>
<script>
const D = JSON.parse(document.getElementById('data').textContent);
const md = s => { try { return DOMPurify.sanitize(marked.parse(String(s || ''))); } catch (e) { const p = document.createElement('pre'); p.textContent = s || ''; return p.outerHTML; } };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
document.title = 'Review: ' + (D.en.title || D.slug);
document.getElementById('h').textContent = D.en.title || D.slug;
document.querySelectorAll('.s').forEach(e => e.textContent = D.slug);
const statusText = {pending_review:'waiting for your decision', revising:'revising — a new email will arrive', approved:'approved — committing to GitHub', committed:'approved and committed'}[D.status] || D.status;
document.getElementById('m').innerHTML = 'slug <code>' + esc(D.slug) + '</code> · round ' + D.round + ' · <span class="pill">' + esc(statusText) + '</span>' + (D.commit_url ? ' · <a style="color:#c4b5fd" href="' + esc(D.commit_url) + '">commit</a>' : '');
const img = document.getElementById('img'); if (D.image_url) { img.src = D.image_url; img.alt = D.en.image_alt || ''; } else img.remove();
const lists = [['Gendered Hebrew', D.notes.gendered_hebrew], ['Medical promises', D.notes.medical_promises], ['Claims without a link', D.notes.unsupported_claims], ['Other', D.notes.other]].filter(x => Array.isArray(x[1]) && x[1].length);
if (lists.length) { const n = document.getElementById('notes'); n.hidden = false; n.innerHTML = '<h3>AUTOMATIC CHECK — NEEDS ATTENTION</h3>' + lists.map(x => '<b>' + esc(x[0]) + '</b><ul>' + x[1].map(i => '<li>' + esc(i) + '</li>').join('') + '</ul>').join(''); }
const block = (l) => { const x = D[l]; const rtl = l === 'he'; return '<div class="card lang"' + (rtl ? ' dir="rtl" lang="he"' : ' lang="en"') + '><div class="fm">' + esc(l.toUpperCase()) + ' · ' + esc(x.read) + (rtl ? ' דקות קריאה' : ' min read') + ' · alt: ' + esc(x.image_alt) + '</div>' + (x.hero ? '<div class="hero-t">' + esc(x.hero) + '</div>' : '') + '<h2 class="t">' + esc(x.title) + '</h2><p class="d">' + esc(x.description) + '</p><div class="body">' + md(x.body) + '</div></div>'; };
const show = (l) => { document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.l === l)); document.getElementById('langs').innerHTML = l === 'both' ? block('en') + block('he') : block(l); };
document.querySelectorAll('.tab').forEach(b => b.onclick = () => show(b.dataset.l)); show('en');
document.getElementById('src').innerHTML = (D.sources || []).map(s => '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title || s.url) + '</a></li>').join('') || '<li>(none listed)</li>';
document.getElementById('orig').innerHTML = 'Picked from the feed item: <a style="color:#c4b5fd" href="' + esc(D.source_url) + '" target="_blank" rel="noopener">' + esc(D.source_title || D.source_url) + '</a>';
if (D.versions.length) { const v = document.getElementById('vers'); v.hidden = false; document.getElementById('vl').innerHTML = D.versions.map(x => '<details class="v"><summary>Round ' + esc(x.round) + ' — note: ' + esc(x.feedback) + ' (' + esc(x.route) + ')</summary>' + (x.image_url ? '<img src="' + esc(x.image_url) + '">' : '') + '<h3>' + esc(x.title_en) + '</h3><div class="body">' + md(x.body_en) + '</div><div dir="rtl"><h3>' + esc(x.title_he) + '</h3><div class="body">' + md(x.body_he) + '</div></div></details>').join(''); }
const st = document.getElementById('st'), ap = document.getElementById('ap'), fx = document.getElementById('fx'), fb = document.getElementById('fb');
const lock = (on) => { ap.disabled = fx.disabled = fb.disabled = on; };
if (D.status !== 'pending_review') { lock(true); st.textContent = 'No action available — this article is ' + statusText + '.'; }
const post = async (path, body) => { const r = await fetch(path, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)}); let j = {}; try { j = await r.json(); } catch (e) {} if (!r.ok || !j.ok) throw new Error(j.error || ('HTTP ' + r.status)); return j; };
ap.onclick = async () => { if (!confirm('Approve and commit to blog/incoming?')) return; lock(true); st.textContent = 'Sending…'; try { const j = await post('approve', {id: D.id, t: D.t}); st.textContent = j.message || 'Approved.'; } catch (e) { st.textContent = 'Failed: ' + e.message; lock(false); } };
fx.onclick = async () => { const f = fb.value.trim(); if (f.length < 3) { st.textContent = 'Write what should change first.'; return; } lock(true); st.textContent = 'Sending…'; try { const j = await post('fix', {id: D.id, t: D.t, feedback: f}); st.textContent = j.message || 'Received.'; } catch (e) { st.textContent = 'Failed: ' + e.message; lock(false); } };
</script>`;

return [{ json: { status_code: 200, html: shell('Review: ' + String(a.title_en || a.slug).replace(/[<>&"]/g, ''), body) } }];
