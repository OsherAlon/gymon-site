// ---- pipeline helpers (n8n/blog-articles/src/code/pipeline_lib.js) ----

const cleanUrl = (u) => String(u || '').trim()
  .replace(/([?&])(?:utm_[a-z_]+|conv_[a-z_]+|af|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|ref_src|ref|source|campaign|cmpid|icid|s_cid)=[^&#]*/gi, '$1')
  .replace(/\?&+/, '?').replace(/&{2,}/g, '&').replace(/[?&]+(#|$)/, '$1');

/** The model's reply → object. Tolerates a code fence or prose around the JSON; throws a clear error otherwise. */
function parseLooseJson(raw, label) {
  if (raw && typeof raw === 'object') return raw;
  const s = String(raw || '').replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error(`${label}: the model returned no JSON object (truncated at max tokens?). First 200 chars: ${s.slice(0, 200)}`);
  try {
    return JSON.parse(s.slice(a, b + 1));
  } catch (e) {
    throw new Error(`${label}: invalid JSON (${e.message}). The reply may have been cut off; check finish_reason in the execution.`);
  }
}

/** Keys in the canonical order of the article contract; drops anything the writer must not set. */
function canonical(a) {
  const out = {};
  for (const k of TOP_LEVEL_KEYS) if (a[k] !== undefined) out[k] = a[k];
  return out;
}

/** Writer output minus every field the code owns. */
function writerFields(a) {
  const out = {};
  for (const [k, v] of Object.entries(a || {})) if (!CODE_FIELDS.includes(k) && k !== 'references') out[k] = v;
  return out;
}

/** The code-owned fields of a new draft. */
function codeFields(plan, lang, today) {
  return {
    schemaVersion: SCHEMA_VERSION,
    lang,
    slug: plan.slug,
    pillar: plan.pillar,
    tags: plan.tags,
    intent: plan.intent,
    ymylLevel: 'low',
    lengthBand: plan.length_band,
    image: `/blog/${plan.slug}.jpg`,
    imageAiGenerated: true,
    createdAt: today,
    reviewedAt: null,
    editor: 'osher-alon',
    aiAssisted: true,
  };
}

/** References as the code owns them: cleaned URL, tier from the URL, fullTextRead from the research pack. */
function codeReferences(refs, readUrls) {
  return (Array.isArray(refs) ? refs : []).map((r) => {
    const url = cleanUrl(r && r.url);
    const out = {
      id: r.id,
      title: String(r.title || '').trim(),
      authors: Array.isArray(r.authors) ? r.authors.filter((x) => typeof x === 'string' && x.trim()) : [],
      year: Number.isInteger(r.year) ? r.year : null,
      venue: typeof r.venue === 'string' ? r.venue : '',
      url,
      tier: tierOfUrl(url),
      type: r.type,
      fullTextRead: (readUrls || []).includes(url),
      quote: String(r.quote || '').trim(),
    };
    if (r.doi) out.doi = String(r.doi).trim();
    if (r.pmid) out.pmid = String(r.pmid).trim();
    return out;
  });
}
