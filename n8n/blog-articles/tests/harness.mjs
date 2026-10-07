/**
 * Runs the Code-node sources EXACTLY as they ship in workflow.sdk.ts (the generated file),
 * with a mocked n8n runtime: $('Node'), $input, $now. No network, no n8n, no money.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SDK = readFileSync(fileURLToPath(new URL('../workflow.sdk.ts', import.meta.url)), 'utf8');

/** The jsCode of the Code node with this name, decoded from its JSON string literal. */
export function nodeCode(name) {
  const at = SDK.indexOf(`name: '${name}', parameters: { mode: 'runOnceForAllItems', jsCode: `);
  if (at < 0) throw new Error(`Code node not found: ${name}`);
  const start = SDK.indexOf('jsCode: ', at) + 'jsCode: '.length;
  // The literal is a JSON string: scan to its closing quote.
  let i = start + 1;
  for (; i < SDK.length; i++) {
    if (SDK[i] === '\\') { i++; continue; }
    if (SDK[i] === '"') break;
  }
  return JSON.parse(SDK.slice(start, i + 1));
}

export const now = (iso = '2026-10-07T09:00:00+03:00') => {
  const d = new Date(iso);
  const fmt = (f) => {
    const p = (n, l = 2) => String(n).padStart(l, '0');
    const parts = { yyyy: d.getUTCFullYear(), yy: p(d.getUTCFullYear() % 100), MM: p(d.getUTCMonth() + 1), dd: p(d.getUTCDate()), HH: p(d.getUTCHours()), mm: p(d.getUTCMinutes()), ss: p(d.getUTCSeconds()) };
    return f.replace(/yyyy|yy|MM|dd|HH|mm|ss/g, (k) => parts[k]);
  };
  const api = { toFormat: fmt, toMillis: () => d.getTime(), toISO: () => d.toISOString(), setZone: () => api };
  return api;
};

/** Runs one Code node. `nodes` maps node name → array of item jsons (or { executed: false }). */
export function run(name, { input = [{}], nodes = {}, $now = now() } = {}) {
  const $ = (n) => {
    const v = nodes[n];
    const items = Array.isArray(v) ? v : [];
    return {
      isExecuted: Array.isArray(v),
      first: () => {
        if (!items.length) throw new Error(`mock: node "${n}" has no data`);
        return { json: items[0] };
      },
      all: () => items.map((json) => ({ json })),
      get item() { return { json: items[0] }; },
    };
  };
  const $input = { first: () => ({ json: input[0] }), all: () => input.map((json) => ({ json })) };
  const fn = new Function('$', '$input', '$now', nodeCode(name));
  return fn($, $input, $now);
}
