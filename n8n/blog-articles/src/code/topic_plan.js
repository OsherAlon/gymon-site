// Topic plan — the picked topic, a safe slug, and the YMYL / pillar guard.
// The guard is the shared validator's (src/lib/article), so a topic that passes here also
// passes the build. A topic that fails ends the run before any research is paid for.
/*__LIB_LITE__*/
const o = $input.first().json.output || {};
const short = $('Shortlist candidates').first().json;
const cand = (short.candidates || [])[o.candidate_index] || {};
let slug = String(o.slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('article-' + $now.toFormat('yyMMddHHmm'));
if ((short.used_slugs || []).includes(slug)) slug = slug + '-' + $now.toFormat('yyMMdd');
const tags = (Array.isArray(o.tags) ? o.tags : []).map((t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).filter(Boolean).slice(0, 4);

const reasons = [];
if (!PILLARS.includes(o.pillar)) reasons.push(`pillar "${o.pillar}" is not one of ${PILLARS.join(', ')}`);
if (o.ymyl_level !== 'low') reasons.push(`ymyl_level "${o.ymyl_level}" (only low is published)`);
// Same rule as validate.mjs#ymylGuard (the build applies it again to title / slug / query).
const hits = Object.entries({ topic: o.topic, slug, primary_query_en: o.primary_query_en, primary_query_he: o.primary_query_he })
  .map(([k, v]) => { const m = String(v || '').match(YMYL_TOPIC); return m ? `${k}: "${m[0]}"` : null; }).filter(Boolean);
if (hits.length) reasons.push(`YMYL topic guard: ${hits.join('; ')}`);
if (!GYMON_KINDS.includes(o.gymon_element && o.gymon_element.kind)) reasons.push('no valid Gymon-unique element chosen');

return [{ json: {
  topic: o.topic, angle: o.angle, slug, pillar: o.pillar, intent: INTENTS.includes(o.intent) ? o.intent : 'know',
  ymyl_level: o.ymyl_level, length_band: LENGTH_BANDS.includes(o.length_band) ? o.length_band : '900-1400',
  tags: (tags.length >= 2 ? tags : [...new Set([...tags, o.pillar, 'strength-training'].filter(Boolean))]).slice(0, 4),
  source_url: cand.link || o.source_url, source_title: cand.title || o.source_title,
  primary_keyword_en: o.primary_query_en, primary_keyword_he: o.primary_query_he,
  paa_en: Array.isArray(o.paa_en) ? o.paa_en : [], paa_he: Array.isArray(o.paa_he) ? o.paa_he : [],
  gymon_element: o.gymon_element || {}, search_queries: Array.isArray(o.search_queries) ? o.search_queries : [],
  published: short.published || [],
  guard_ok: reasons.length === 0, guard_reason: reasons.join(' | '),
}, pairedItem: { item: 0 } }];
