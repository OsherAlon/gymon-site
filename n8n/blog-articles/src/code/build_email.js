// Build review email — one article row in, one {subject, html} out. The full article, the
// flags and the reference checks are on the review page; the email is the summary.
const BASE = 'https://osher.app.n8n.cloud/webhook';

const a = $input.first().json;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plain = (t) => String(t || '').replace(/\[\[[^\]]+\]\]/g, '').replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+([.,;:])/g, '$1').trim();
const parse = (s, d) => { try { return JSON.parse(s || ''); } catch (e) { return d; } };

const en = parse(a.article_en, {});
const he = parse(a.article_he, {});
const v = parse(a.validation, { en: { errors: [], warnings: [] }, he: { errors: [], warnings: [] }, cross: [] });
const notes = parse(a.check_notes, {});
const errors = [...(v.en?.errors || []).map((e) => ['EN', e]), ...(v.he?.errors || []).map((e) => ['HE', e]), ...(v.cross || []).map((e) => ['EN/HE', e])];
const warnCount = (v.en?.warnings || []).length + (v.he?.warnings || []).length;
const noteLists = [
  ['Citation does not support the sentence', notes.entailment],
  ['Medical promises', notes.medical_promises],
  ['Gendered Hebrew', notes.gendered_hebrew],
  ['Invented experience', notes.fabricated_experience],
  ['Hebrew reads translated', notes.literal_translation],
  ['Other', notes.other],
].filter(([, l]) => Array.isArray(l) && l.length);

const reviewUrl = `${BASE}/gymon-blog/review?id=${encodeURIComponent(a.article_id)}&t=${encodeURIComponent(a.review_token)}`;
const round = Number(a.round) || 1;
const subject = `${errors.length ? '[blocked] ' : ''}[Gymon blog] ${round > 1 ? `Revised, round ${round}` : 'New article for review'}: ${a.title_en}`;

const box = (bg, border, title, inner) => `<div style="background:${bg};border:1px solid ${border};border-radius:10px;padding:14px 16px;margin:0 0 16px"><div style="font-size:12px;font-weight:700;letter-spacing:.06em;margin-bottom:6px">${title}</div>${inner}</div>`;
const list = (items) => `<ul style="margin:4px 0 0;padding-left:18px;font-size:13px">${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;

const errHtml = errors.length
  ? box('#2a0f0f', '#b91c1c', `<span style="color:#fca5a5">BLOCKING — ${errors.length} error(s). Approve is disabled until a fix round clears them.</span>`, `<div style="color:#fecaca">${list(errors.slice(0, 12).map(([l, e]) => `${l} · <code>${esc(e.path)}</code> — ${esc(e.message)}`))}</div>`)
  : `<div style="font-size:12px;color:#86efac;margin:0 0 12px">Automatic validation: no blocking errors.</div>`;
const flagHtml = noteLists.length
  ? box('#2a1d0a', '#a16207', '<span style="color:#facc15">FACT-CHECK FLAGS (Haiku) — read before approving</span>', `<div style="color:#fde68a">${noteLists.map(([k, l]) => `<div style="margin-top:6px"><b>${esc(k)}</b>${list(l.map(esc))}</div>`).join('')}</div>`)
  : '';

const lang = (x, rtl, label) => `<div ${rtl ? 'dir="rtl" ' : ''}style="background:#18181b;border-radius:12px;padding:16px 18px 8px;margin:0 0 14px;${rtl ? 'direction:rtl;text-align:right;' : ''}">
  <div style="font-size:11px;color:#71717a;font-weight:700;letter-spacing:.08em;margin-bottom:6px">${label}</div>
  <div style="font-size:20px;font-weight:800;color:#fafafa;margin:0 0 4px">${esc(x.heroTitle)}</div>
  <h2 style="margin:0 0 6px;font-size:17px;color:#fafafa">${esc(x.title)}</h2>
  <p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:#e4e4e7"><b>${rtl ? 'השורה התחתונה: ' : 'Bottom line: '}</b>${esc(plain(x.tldr))}</p>
  ${list((x.keyTakeaways || []).map((k) => `<span style="color:#d4d4d8">${esc(plain(k.text))}</span>`))}
</div>`;

const html = `<!doctype html><html><body style="margin:0;background:#0b0b0f">
<div style="max-width:640px;margin:0 auto;padding:24px 16px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#e4e4e7">
  <div style="font-size:12px;letter-spacing:.18em;color:#a78bfa;font-weight:700;margin-bottom:6px">GYMON BLOG</div>
  <h1 style="margin:0 0 4px;font-size:20px;color:#fafafa">${round > 1 ? `Revised article — round ${round}` : 'New article ready for review'}</h1>
  <div style="font-size:13px;color:#a1a1aa;margin-bottom:14px">slug <code>${esc(a.slug)}</code> · pillar ${esc(a.pillar || en.pillar)} · ${esc(a.read_time_en)} min EN · ${esc(a.read_time_he)} min HE · ${(en.references || []).length} sources · ${warnCount} warning(s)</div>
  ${round > 1 && a.last_feedback ? `<div style="font-size:13px;color:#a1a1aa;margin:0 0 14px">Your last note: <i>${esc(a.last_feedback)}</i></div>` : ''}
  ${a.image_url ? `<img src="${esc(a.image_url)}" alt="${esc(a.image_alt_en)}" width="608" style="width:100%;height:auto;border-radius:12px;display:block;margin:0 0 16px">` : ''}
  ${errHtml}${flagHtml}
  ${lang(en, false, 'ENGLISH')}${lang(he, true, 'עברית')}
  <a href="${reviewUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:700;font-size:15px">Open the review page — read, check, approve or request fixes</a>
  <div style="font-size:12px;color:#71717a;margin-top:14px;line-height:1.6">The review page shows both articles in full, every flag, the reference checks (URL, DOI, PMID) and the review checklist. Approving commits two JSON files and the image to <code>OsherAlon/gymon-site</code>, branch <code>blog/incoming</code>. Nothing goes live automatically.</div>
</div></body></html>`;

return [{ json: { subject, html, article_id: a.article_id } }];
