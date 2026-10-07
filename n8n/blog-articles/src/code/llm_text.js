// ---- llmText + apply flags (n8n/blog-articles/src/code/llm_text.js): only the nodes that read a Sonnet reply ----

/**
 * The text of an OpenRouter chat completion (HTTP node) or of a chain node ({ text }).
 * A reply cut off at max_tokens is an error here, with the token usage, because hidden
 * reasoning is billed as completion and can eat the whole budget (execution 1539).
 */
function llmText(j, label) {
  if (j && typeof j.text === 'string') return j.text;
  const c = j && Array.isArray(j.choices) ? j.choices[0] : null;
  if (!c) throw new Error(`${label}: no completion in the response: ${JSON.stringify(j || {}).slice(0, 300)}`);
  if (c.finish_reason === 'length') {
    throw new Error(`${label}: cut off at max_tokens (finish_reason: length, usage: ${JSON.stringify(j.usage || {})}). Raise max_tokens or lower the reasoning effort.`);
  }
  const m = c.message || {};
  return typeof m.content === 'string' ? m.content : (Array.isArray(m.content) ? m.content.map((x) => x.text || '').join('') : '');
}

/**
 * The "apply" flag is structure, not language: Hebrew takes it from the English section at the
 * same index (the validator already requires the same sections in both). Execution 1541: the
 * writer put the protocol under an "Apply it:" heading but never set the field.
 */
function syncApply(en, he) {
  const es = (en && en.sections) || [];
  ((he && he.sections) || []).forEach((s, i) => { if (es[i]) s.apply = es[i].apply === true; });
  return he;
}

/** When the writer marked no section, the one section holding the cta block is the apply section. */
function markApplyFromCta(a) {
  const secs = (a && a.sections) || [];
  if (secs.some((s) => s.apply === true)) return a;
  const withCta = secs.filter((s) => (s.blocks || []).some((b) => b && b.type === 'cta'));
  if (withCta.length === 1) secs.forEach((s) => { s.apply = s === withCta[0]; });
  return a;
}
