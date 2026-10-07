// Reference results — turns the HTTP answers (URL, Crossref, PubMed) into validation flags.
const b = $('Validate articles').first().json;
const checks = $('Reference checks').all().map((i) => i.json);
const answers = $input.all().map((i) => i.json || {});
const refs = new Map((b.article_en.references || []).map((r) => [r.id, r]));
const validation = JSON.parse(JSON.stringify(b.validation));
const err = (path, message) => validation.en.errors.push({ path, message });
const warn = (path, message) => validation.en.warnings.push({ path, message });

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const words = (s) => new Set(norm(s).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter((w) => w.length > 3));
const similar = (a, c) => {
  const A = words(a), B = words(c);
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n / Math.min(A.size, B.size);
};
const body = (j) => {
  const v = j.body !== undefined ? j.body : j.data;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch (e) { return v; } }
  return v;
};

const report = [];
checks.forEach((c, i) => {
  if (c.kind === 'none') return;
  const j = answers[i] || {};
  const status = Number(j.statusCode || (j.error ? 0 : 200));
  const r = refs.get(c.ref) || {};
  const p = `references.${c.ref}`;
  let result = 'ok';
  let detail = `HTTP ${status || 'error'}`;
  if (c.kind === 'url') {
    if (status === 404 || status === 410) { result = 'error'; err(`${p}.url`, `${detail}: the source URL does not resolve`); }
    else if (!status || status >= 400) { result = 'unverified'; warn(`${p}.url`, `${detail}: could not verify the URL automatically (bot block or outage) — open it by hand`); }
  } else if (c.kind === 'doi') {
    const d = body(j);
    const title = d && d.message && Array.isArray(d.message.title) ? d.message.title[0] : '';
    if (status === 404 || (status && status >= 400 && status !== 429)) { result = 'error'; err(`${p}.doi`, `DOI ${r.doi} does not resolve in Crossref (${detail})`); }
    else if (!title) { result = 'unverified'; warn(`${p}.doi`, `Crossref gave no title (${detail})`); }
    else {
      const s = similar(title, r.title);
      detail = `Crossref: "${String(title).slice(0, 140)}"`;
      if (s < 0.6) { result = 'mismatch'; err(`${p}.doi`, `DOI points to a different paper: ${detail}`); }
    }
  } else if (c.kind === 'pmid') {
    const d = body(j);
    const rec = d && d.result && d.result[r.pmid];
    if (!rec || rec.error) { result = 'error'; err(`${p}.pmid`, `PMID ${r.pmid} does not resolve in PubMed (${detail})`); }
    else {
      detail = `PubMed: "${String(rec.title || '').slice(0, 140)}"`;
      if (similar(rec.title || '', r.title) < 0.6) { result = 'mismatch'; err(`${p}.pmid`, `PMID points to a different paper: ${detail}`); }
    }
  }
  report.push({ ref: c.ref, kind: c.kind, url: c.kind === 'url' ? c.url : (c.kind === 'doi' ? `https://doi.org/${r.doi}` : `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`), status, result, detail });
});

const errors = validation.en.errors.length + validation.he.errors.length + validation.cross.length;
const warnings = validation.en.warnings.length + validation.he.warnings.length;
return [{ json: { ...b, validation, ref_report: report, counts: { errors, warnings } }, pairedItem: { item: 0 } }];
