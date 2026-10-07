// Build review email — one article row in, one {subject, html} out.
const BASE = 'https://osher.app.n8n.cloud/webhook';

const a = $input.first().json;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plain = md => String(md || '')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/^>\s?/gm, '')
  .replace(/[*_`#]/g, '')
  .trim();
const firstParas = (md, n) => String(md || '')
  .split(/\n\s*\n/)
  .map(p => p.trim())
  .filter(p => p && !p.startsWith('#') && !p.startsWith('-') && !/^\d+\./.test(p))
  .slice(0, n)
  .map(plain);

let notes = {};
try { notes = JSON.parse(a.check_notes || '{}'); } catch (e) { notes = { other: [String(a.check_notes || '')] }; }
const noteLists = [
  ['Gendered Hebrew', notes.gendered_hebrew],
  ['Medical promises', notes.medical_promises],
  ['Claims without a link', notes.unsupported_claims],
  ['Other', notes.other],
].filter(([, l]) => Array.isArray(l) && l.length);

let sources = [];
try { sources = JSON.parse(a.sources_json || '[]'); } catch (e) {}

const reviewUrl = `${BASE}/gymon-blog/review?id=${encodeURIComponent(a.article_id)}&t=${encodeURIComponent(a.review_token)}`;
const round = Number(a.round) || 1;
const subject = round > 1
  ? `[Gymon blog] Revised, round ${round}: ${a.title_en}`
  : `[Gymon blog] New article for review: ${a.title_en}`;

const para = (t, rtl) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#d4d4d8;${rtl ? 'direction:rtl;text-align:right;' : ''}">${esc(t)}</p>`;

const checkHtml = noteLists.length
  ? `<div style="background:#2a1d0a;border:1px solid #a16207;border-radius:10px;padding:14px 16px;margin:0 0 20px">
      <div style="font-size:12px;font-weight:700;color:#facc15;letter-spacing:.06em;margin-bottom:6px">AUTOMATIC CHECK — NEEDS ATTENTION</div>
      ${noteLists.map(([k, l]) => `<div style="font-size:13px;color:#fde68a;margin:6px 0 2px"><b>${esc(k)}</b></div><ul style="margin:0;padding-left:18px;color:#fde68a;font-size:13px">${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`).join('')}
    </div>`
  : `<div style="font-size:12px;color:#86efac;margin:0 0 20px">Automatic check: no issues flagged (gendered Hebrew, medical promises, unlinked claims).</div>`;

const feedbackHtml = round > 1 && a.last_feedback
  ? `<div style="font-size:13px;color:#a1a1aa;margin:0 0 16px">Your last note: <i>${esc(a.last_feedback)}</i></div>`
  : '';

const html = `<!doctype html><html><body style="margin:0;background:#0b0b0f">
<div style="max-width:640px;margin:0 auto;padding:24px 16px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#e4e4e7">
  <div style="font-size:12px;letter-spacing:.18em;color:#a78bfa;font-weight:700;margin-bottom:6px">GYMON BLOG</div>
  <h1 style="margin:0 0 4px;font-size:20px;color:#fafafa">${round > 1 ? `Revised article — round ${round}` : 'New article ready for review'}</h1>
  <div style="font-size:13px;color:#a1a1aa;margin-bottom:18px">slug: <code style="color:#d4d4d8">${esc(a.slug)}</code> · ${esc(a.read_time_en)} min (EN) · ${esc(a.read_time_he)} min (HE) · ${sources.length} linked sources</div>
  ${feedbackHtml}
  ${a.image_url ? `<img src="${esc(a.image_url)}" alt="${esc(a.image_alt_en)}" width="608" style="width:100%;height:auto;border-radius:12px;display:block;margin:0 0 20px">` : ''}
  ${checkHtml}
  <div style="background:#18181b;border-radius:12px;padding:18px 18px 8px;margin:0 0 14px">
    <div style="font-size:11px;color:#71717a;font-weight:700;letter-spacing:.08em;margin-bottom:6px">ENGLISH</div>
    ${a.hero_title_en ? `<div style="font-size:22px;font-weight:800;color:#fafafa;margin:0 0 4px">${esc(a.hero_title_en)}</div>` : ''}
    <h2 style="margin:0 0 6px;font-size:18px;color:#fafafa">${esc(a.title_en)}</h2>
    <div style="font-size:13px;color:#a1a1aa;margin:0 0 12px">${esc(a.description_en)}</div>
    ${firstParas(a.body_en, 2).map(p => para(p, false)).join('')}
  </div>
  <div dir="rtl" style="background:#18181b;border-radius:12px;padding:18px 18px 8px;margin:0 0 22px;direction:rtl;text-align:right">
    <div style="font-size:11px;color:#71717a;font-weight:700;letter-spacing:.08em;margin-bottom:6px">עברית</div>
    ${a.hero_title_he ? `<div style="font-size:22px;font-weight:800;color:#fafafa;margin:0 0 4px">${esc(a.hero_title_he)}</div>` : ''}
    <h2 style="margin:0 0 6px;font-size:18px;color:#fafafa">${esc(a.title_he)}</h2>
    <div style="font-size:13px;color:#a1a1aa;margin:0 0 12px">${esc(a.description_he)}</div>
    ${firstParas(a.body_he, 2).map(p => para(p, true)).join('')}
  </div>
  <a href="${reviewUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:700;font-size:15px">Open the review page — approve or request fixes</a>
  <div style="font-size:12px;color:#71717a;margin-top:14px;line-height:1.6">The full article in both languages, the sources and the earlier versions are on the review page. Approving commits the two Markdown files and the image to <code>OsherAlon/gymon-site</code>, branch <code>blog/incoming</code>. Nothing is published to the live site automatically.</div>
</div></body></html>`;

return [{ json: { subject, html, article_id: a.article_id } }];
