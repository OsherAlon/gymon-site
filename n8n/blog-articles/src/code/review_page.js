// Render review page — validates the token, then returns {html, status_code}.
// The page renders the article JSON with the SITE's inline renderer (src/lib/article/inline.mjs,
// inlined by build.py), shows every automatic flag and reference check, and records the review
// checklist (SEO doctrine §9.7 — the evidence of a substantive human review). Approve stays
// disabled while there are blocking errors or an unticked checklist item; the approve webhook
// checks both again on the server.
const INLINE_LIB = __INLINE_LIB_JSON__;
const CHECKLIST = [
  'I opened every source behind a core claim, and the sentence says what the source says.',
  'The Gymon block is true: the facts match the Gymon material, the example numbers add up.',
  'The topic is not high-YMYL, and nothing gives medical, dosing or injury advice.',
  'I read the Hebrew version in full: gender-neutral, natural, numbers correct.',
  'Title, description, image and alt text are right.',
];

const q = ($('Review page request').first().json.query) || {};
const a = $('Get article (review)').first().json || {};
const versions = $('Get versions (review)').all().map((i) => i.json).filter((v) => v && v.article_id);

const shell = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${title}</title>
<style>
:root{--bg:#0b0b0f;--card:#16161b;--line:#2a2a33;--text:#e4e4e7;--muted:#a1a1aa;--accent:#8b5cf6;--ok:#22c55e;--warn:#facc15;--bad:#f87171}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 -apple-system,Segoe UI,Roboto,Arial,sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:24px 16px 80px}
.kicker{font-size:12px;letter-spacing:.18em;color:var(--accent);font-weight:700}
h1{font-size:22px;margin:4px 0 2px}.meta{color:var(--muted);font-size:13px}
.hero{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:14px;margin:18px 0;background:#000}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin:14px 0}
.bad{border-color:#b91c1c;background:#1f0b0b}.bad h3{color:var(--bad)}.flag{border-color:#a16207;background:#1f1708}.flag h3{color:var(--warn)}
h3{font-size:13px;letter-spacing:.06em;margin:0 0 6px}
ul.l{margin:4px 0 10px;padding-inline-start:20px;font-size:14px}
code{font-size:12px;color:#c4b5fd}
.tabs{display:flex;gap:8px;margin:18px 0 0;flex-wrap:wrap}.tab{background:transparent;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:6px 14px;font:inherit;font-size:14px;cursor:pointer}
.tab.on{background:var(--accent);border-color:var(--accent);color:#fff}
.art .heroT{font-size:28px;font-weight:800;line-height:1.15}.art h2.t{font-size:24px;line-height:1.25;margin:6px 0}.art .d{color:var(--muted)}
.art h2{font-size:20px;margin:24px 0 6px}.art h3{font-size:16px;letter-spacing:0;margin:16px 0 4px}
.art a{color:#c4b5fd}.box{border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:12px 0}
.bl{border-inline-start:4px solid var(--accent)}.gy{border-color:#2f5865;background:#0f1a1d}.badge{display:inline-block;font-size:12px;border:1px solid var(--line);border-radius:999px;padding:1px 9px;color:var(--muted);margin-inline-end:6px}
.art[dir=rtl]{text-align:right}.art[lang=he]{font-size:18px;line-height:1.75}
table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-top:1px solid var(--line);padding:6px 8px;text-align:start;vertical-align:top}
sup.cite{font-size:.7em}.cite-btn{color:#c4b5fd}
.refs td:first-child{white-space:nowrap}
.res-ok{color:var(--ok)}.res-error,.res-mismatch{color:var(--bad)}.res-unverified{color:var(--warn)}
textarea{width:100%;min-height:120px;background:#0f0f14;color:var(--text);border:1px solid var(--line);border-radius:10px;padding:12px;font:inherit}
.row{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
button.b{border:0;border-radius:10px;padding:12px 20px;font:inherit;font-weight:700;cursor:pointer}
.approve{background:var(--ok);color:#052e16}.fix{background:var(--accent);color:#fff}.ghost{background:transparent;color:var(--muted);border:1px solid var(--line)!important}
button:disabled{opacity:.45;cursor:not-allowed}
.check label{display:flex;gap:10px;align-items:flex-start;padding:6px 0;font-size:15px}.check input{width:20px;height:20px;margin-top:3px}
.status{font-size:14px;margin-top:10px;min-height:1.4em}
details{border-top:1px solid var(--line);padding:8px 0}summary{cursor:pointer;color:var(--muted);font-size:14px}
.pill{display:inline-block;font-size:12px;border:1px solid var(--line);border-radius:999px;padding:2px 10px;color:var(--muted)}
</style></head><body><div class="wrap">${body}</div></body></html>`;

if (!a.article_id || !q.t || q.t !== a.review_token) {
  return [{ json: { status_code: 404, html: shell('Not found', '<div class="kicker">GYMON BLOG</div><h1>Review link not found</h1><p class="meta">The link is wrong or no longer valid. Open the most recent email for this article.</p>') } }];
}
const parse = (s, d) => { try { return JSON.parse(s || ''); } catch (e) { return d; } };
const data = {
  id: a.article_id, t: q.t, status: a.status, round: Number(a.round) || 1, slug: a.slug,
  image_url: a.image_url, commit_url: a.commit_url, last_feedback: a.last_feedback,
  en: parse(a.article_en, null), he: parse(a.article_he, null),
  validation: parse(a.validation, null), notes: parse(a.check_notes, {}),
  source_url: a.source_url, source_title: a.source_title, topic: a.topic,
  checklist: CHECKLIST,
  versions: versions.sort((x, y) => (Number(y.round) || 0) - (Number(x.round) || 0)).map((v) => ({ round: v.round, feedback: v.feedback, route: v.route, title_en: v.title_en, title_he: v.title_he, image_url: v.image_url })),
};
// No backslash-u escapes in this source: the n8n MCP update path decodes them into raw characters.
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029), BS = String.fromCharCode(92);
const safe = (s) => s.split('<').join(BS + 'u003c').split(LS).join(BS + 'u2028').split(PS).join(BS + 'u2029');
const json = safe(JSON.stringify(data));

const body = `
<div class="kicker">GYMON BLOG · REVIEW</div>
<h1 id="h"></h1>
<div class="meta" id="m"></div>
<img class="hero" id="img" alt="">
<div id="flags"></div>
<div class="card"><b>Reference checks</b><div class="meta">Every URL fetched, every DOI resolved in Crossref, every PMID in PubMed — before this page was sent.</div><div style="overflow-x:auto"><table class="refs" id="refs"></table></div><div class="meta" id="orig"></div></div>
<div class="tabs"><button class="tab on" data-l="en">English</button><button class="tab" data-l="he">עברית</button><button class="tab" data-l="both">Side by side</button></div>
<div id="langs"></div>
<div class="card" id="actions">
  <b>Review checklist</b>
  <p class="meta">Recorded with the approval (reviewer, date, checklist) — the evidence that a human reviewed the article before publication.</p>
  <div class="check" id="cl"></div>
  <div class="row"><button class="b approve" id="ap">Approve</button></div>
  <p class="meta" style="margin-top:18px">Or describe what to fix (Hebrew or English). The text, the image, or both will be redone, re-checked, and a new email will arrive.</p>
  <textarea id="fb" placeholder="What should change?"></textarea>
  <div class="row"><button class="b fix" id="fx">Send for fixes</button><button class="b ghost" id="addflags" type="button">Add the automatic flags to the note</button></div>
  <div class="status" id="st"></div>
</div>
<div class="card" id="vers" hidden><b>Earlier versions</b><div id="vl"></div></div>
<script type="application/json" id="data">${json}</script>
<script>${INLINE_LIB}</script>
<script>
const D = JSON.parse(document.getElementById('data').textContent);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const V = D.validation || { en: { errors: [], warnings: [] }, he: { errors: [], warnings: [] }, cross: [], refs: [], blocking: 0 };
const blocking = (V.en.errors || []).length + (V.he.errors || []).length + (V.cross || []).length;
document.title = 'Review: ' + ((D.en && D.en.title) || D.slug);
document.getElementById('h').textContent = (D.en && D.en.title) || D.slug;
const statusText = { pending_review: 'waiting for your decision', revising: 'revising — a new email will arrive', approved: 'approved — committing to GitHub', committed: 'approved and committed' }[D.status] || D.status;
document.getElementById('m').innerHTML = 'slug <code>' + esc(D.slug) + '</code> · round ' + D.round + ' · <span class="pill">' + esc(statusText) + '</span>' + (D.commit_url ? ' · <a style="color:#c4b5fd" href="' + esc(D.commit_url) + '">commit</a>' : '');
const img = document.getElementById('img'); if (D.image_url) { img.src = D.image_url; img.alt = (D.en && D.en.imageAlt) || ''; } else img.remove();

// ---- flags ----
const li = (arr, f) => '<ul class="l">' + arr.map((x) => '<li>' + f(x) + '</li>').join('') + '</ul>';
const issue = (lang) => (e) => '<b>' + lang + '</b> <code>' + esc(e.path) + '</code> — ' + esc(e.message);
let flags = '';
const errs = [].concat((V.en.errors || []).map(issue('EN')), (V.he.errors || []).map(issue('HE')), (V.cross || []).map(issue('EN/HE')));
if (errs.length) flags += '<div class="card bad"><h3>BLOCKING — ' + errs.length + ' ERROR(S). APPROVE IS DISABLED.</h3><ul class="l">' + errs.map((x) => '<li>' + x + '</li>').join('') + '</ul></div>';
const N = D.notes || {};
const nl = [['Citation does not support the sentence', N.entailment], ['Medical promises', N.medical_promises], ['Gendered Hebrew', N.gendered_hebrew], ['Invented experience', N.fabricated_experience], ['Hebrew reads translated', N.literal_translation], ['Other', N.other]].filter((x) => Array.isArray(x[1]) && x[1].length);
if (nl.length) flags += '<div class="card flag"><h3>FACT-CHECK FLAGS (HAIKU) — NOT BLOCKING, READ THEM</h3>' + nl.map((x) => '<b>' + esc(x[0]) + '</b>' + li(x[1], esc)).join('') + '</div>';
const warns = [].concat((V.en.warnings || []).map(issue('EN')), (V.he.warnings || []).map(issue('HE')));
if (warns.length) flags += '<div class="card"><details><summary>' + warns.length + ' warning(s) from the validator (style, length, numbers to double-check)</summary><ul class="l">' + warns.map((x) => '<li>' + x + '</li>').join('') + '</ul></details></div>';
if (!flags) flags = '<div class="meta" style="color:#86efac">No blocking errors, no fact-check flags, no warnings.</div>';
document.getElementById('flags').innerHTML = flags;

// ---- reference checks ----
const refsList = (D.en && D.en.references) || [];
const checks = V.refs || [];
document.getElementById('refs').innerHTML = '<tr><th>Ref</th><th>Source</th><th>Checks</th></tr>' + refsList.map((r) => {
  const cs = checks.filter((c) => c.ref === r.id).map((c) => '<div class="res-' + esc(c.result) + '">' + esc(c.kind.toUpperCase()) + ': ' + esc(c.result) + ' · ' + esc(c.detail) + '</div>').join('');
  return '<tr><td>' + esc(r.id) + '</td><td><a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.title) + '</a><div class="meta">' + esc((r.authors || []).join(', ')) + (r.year ? ' · ' + r.year : '') + ' · ' + esc(r.tier) + ' · ' + esc(r.type) + ' · ' + (r.fullTextRead ? 'page text extracted' : 'snippet only') + '</div><details><summary>quote</summary><div class="meta">“' + esc(r.quote) + '”</div></details></td><td>' + (cs || '—') + '</td></tr>';
}).join('');
document.getElementById('orig').innerHTML = 'Picked from the feed item: <a style="color:#c4b5fd" href="' + esc(D.source_url) + '" target="_blank" rel="noopener">' + esc(D.source_title || D.source_url) + '</a>';

// ---- article render (same inline renderer as the site) ----
const article = (x, lang) => {
  if (!x) return '<div class="card">(no article JSON on this row)</div>';
  const no = new Map((x.references || []).map((r, i) => [r.id, i + 1]));
  const inl = (t) => renderInline(t, { lang, refNumber: (id) => no.get(id) });
  const cites = (ids) => (ids && ids.length ? inl('[[' + ids.join(',') + ']]') : '');
  const blk = (b) => {
    switch (b.type) {
      case 'p': return '<p>' + inl(b.text) + '</p>';
      case 'list': return (b.ordered ? '<ol>' : '<ul>') + b.items.map((i) => '<li>' + inl(i) + '</li>').join('') + (b.ordered ? '</ol>' : '</ul>');
      case 'takeaway': return '<div class="box bl"><b>' + inl(b.text) + '</b></div>';
      case 'claim': return '<div class="box"><span class="badge">evidence: ' + esc(b.evidence) + '</span>' + inl(b.text) + cites(b.refs) + '</div>';
      case 'callout': return '<div class="box bl"><span class="badge">' + esc(b.kind) + '</span>' + inl(b.text) + '</div>';
      case 'table': return '<div class="box"><b>' + inl(b.caption) + '</b>' + cites(b.refs) + '<table><tr>' + b.columns.map((c) => '<th>' + inl(c) + '</th>').join('') + '</tr>' + b.rows.map((r) => '<tr>' + r.map((c) => '<td>' + inl(String(c)) + '</td>').join('') + '</tr>').join('') + '</table></div>';
      case 'calculator': return '<div class="box gy"><span class="badge">calculator</span>' + esc(b.calculator) + ' · defaults ' + esc(JSON.stringify(b.defaults || {})) + '</div>';
      case 'cta': return '<div class="box gy"><span class="badge">CTA slot</span>' + esc(x.cta && x.cta.slot) + ' (fixed copy from the site)</div>';
      case 'gymon':
        if (b.kind === 'log-example') return '<div class="box gy"><span class="badge">GYMON · log-example (illustrative)</span><b>' + inl(b.caption) + '</b>' + b.sessions.map((s) => '<div class="meta" style="margin-top:6px">' + esc(b.exercise) + ' · ' + esc(s.label) + '</div><table><tr><th>SET</th><th>PREVIOUS</th><th>KG</th><th>REPS</th></tr>' + s.sets.map((st, i) => '<tr><td>' + (i + 1) + '</td><td dir="ltr">' + (st.previous ? st.previous.kg + ' × ' + st.previous.reps : '—') + '</td><td>' + st.kg + '</td><td>' + st.reps + '</td></tr>').join('') + '</table>').join('') + '<p>' + inl(b.text || '') + '</p></div>';
        return '<div class="box gy"><span class="badge">GYMON · ' + esc(b.kind) + '</span>' + (b.heading ? '<b>' + inl(b.heading) + '</b>' : '') + '<p>' + inl(b.text) + '</p>' + (b.points ? '<ul>' + b.points.map((p) => '<li>' + inl(p) + '</li>').join('') + '</ul>' : '') + '</div>';
      default: return '<div class="box bad">unknown block ' + esc(b.type) + '</div>';
    }
  };
  const rtl = lang === 'he';
  return '<div class="card art"' + (rtl ? ' dir="rtl" lang="he"' : ' lang="en"') + '>'
    + '<div class="meta">' + esc(lang.toUpperCase()) + ' · alt: ' + esc(x.imageAlt) + ' · primary query: ' + esc(x.primaryQuery) + ' · ' + esc((x.title || '').length) + ' chars title · ' + esc((x.description || '').length) + ' chars description</div>'
    + '<div class="heroT">' + esc(x.heroTitle) + '</div><h2 class="t">' + esc(x.title) + '</h2><p class="d">' + esc(x.description) + '</p>'
    + '<div class="box bl"><b>' + (rtl ? 'השורה התחתונה' : 'Bottom line') + '</b><p>' + inl(x.tldr) + '</p><ul>' + (x.keyTakeaways || []).map((k) => '<li>' + inl(k.text) + cites(k.refs) + '</li>').join('') + '</ul></div>'
    + (x.sections || []).map((s) => '<h2>' + inl(s.heading) + (s.apply ? ' <span class="badge">apply</span>' : '') + '</h2>' + (s.blocks || []).map(blk).join('')).join('')
    + ((x.quiz || []).length ? '<h2>' + (rtl ? 'בדיקה עצמית' : 'Check yourself') + '</h2>' + x.quiz.map((qq) => '<p><b>' + inl(qq.question) + '</b></p><ul>' + qq.options.map((o, i) => '<li>' + (i === qq.correctIndex ? '✓ ' : '') + inl(o) + '</li>').join('') + '</ul><p class="meta">' + inl(qq.explanation) + cites(qq.refs) + '</p>').join('') : '')
    + ((x.faq || []).length ? '<h2>' + (rtl ? 'שאלות נפוצות' : 'Common questions') + '</h2>' + x.faq.map((f) => '<h3>' + inl(f.q) + '</h3><p>' + inl(f.a) + cites(f.refs) + '</p>').join('') : '')
    + '<h2>' + (rtl ? 'מקורות' : 'Sources') + '</h2><ol>' + (x.references || []).map((r) => '<li id="ref-' + esc(r.id) + '" dir="ltr"><a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.title) + '</a></li>').join('') + '</ol></div>';
};
const show = (l) => { document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.l === l)); document.getElementById('langs').innerHTML = l === 'both' ? article(D.en, 'en') + article(D.he, 'he') : article(D[l], l); };
document.querySelectorAll('.tab').forEach((b) => (b.onclick = () => show(b.dataset.l))); show('en');

if (D.versions.length) { const v = document.getElementById('vers'); v.hidden = false; document.getElementById('vl').innerHTML = D.versions.map((x) => '<details><summary>Round ' + esc(x.round) + ' — note: ' + esc(x.feedback) + ' (' + esc(x.route) + ')</summary>' + (x.image_url ? '<img style="width:220px;border-radius:8px" src="' + esc(x.image_url) + '">' : '') + '<p>' + esc(x.title_en) + '</p><p dir="rtl">' + esc(x.title_he) + '</p></details>').join(''); }

// ---- checklist + actions ----
const cl = document.getElementById('cl');
cl.innerHTML = D.checklist.map((c, i) => '<label><input type="checkbox" data-i="' + i + '"><span>' + esc(c) + '</span></label>').join('');
const st = document.getElementById('st'), ap = document.getElementById('ap'), fx = document.getElementById('fx'), fb = document.getElementById('fb');
const ticks = () => [...cl.querySelectorAll('input')].map((x) => x.checked);
const refresh = () => { ap.disabled = D.status !== 'pending_review' || blocking > 0 || !ticks().every(Boolean); };
cl.addEventListener('change', refresh); refresh();
if (blocking > 0) st.textContent = 'Approve is disabled: ' + blocking + ' blocking error(s). Send for fixes.';
const lock = (on) => { ap.disabled = fx.disabled = fb.disabled = on; if (!on) refresh(); };
if (D.status !== 'pending_review') { lock(true); st.textContent = 'No action available — this article is ' + statusText + '.'; }
document.getElementById('addflags').onclick = () => {
  const lines = [].concat((V.en.errors || []).map((e) => 'EN ' + e.path + ': ' + e.message), (V.he.errors || []).map((e) => 'HE ' + e.path + ': ' + e.message), (V.cross || []).map((e) => e.path + ': ' + e.message), nl.flatMap((x) => x[1].map((i) => x[0] + ': ' + i)));
  fb.value = (fb.value ? fb.value + '\\n\\n' : '') + 'Fix these automatic flags:\\n- ' + lines.join('\\n- ');
};
const post = async (path, body) => { const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); let j = {}; try { j = await r.json(); } catch (e) {} if (!r.ok || !j.ok) throw new Error(j.error || ('HTTP ' + r.status)); return j; };
ap.onclick = async () => { if (!confirm('Approve and commit to blog/incoming? The checklist is recorded with your approval.')) return; lock(true); st.textContent = 'Sending…'; try { const j = await post('approve', { id: D.id, t: D.t, checklist: ticks() }); st.textContent = j.message || 'Approved.'; } catch (e) { st.textContent = 'Failed: ' + e.message; lock(false); } };
fx.onclick = async () => { const f = fb.value.trim(); if (f.length < 3) { st.textContent = 'Write what should change first.'; return; } lock(true); st.textContent = 'Sending…'; try { const j = await post('fix', { id: D.id, t: D.t, feedback: f }); st.textContent = j.message || 'Received.'; } catch (e) { st.textContent = 'Failed: ' + e.message; lock(false); } };
</script>`;

return [{ json: { status_code: 200, html: shell('Review: ' + String(a.title_en || a.slug).replace(/[<>&"]/g, ''), body) } }];
