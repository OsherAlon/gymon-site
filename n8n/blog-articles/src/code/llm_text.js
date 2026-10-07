// ---- llmText (n8n/blog-articles/src/code/llm_text.js): only the nodes that read a Sonnet reply ----

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
