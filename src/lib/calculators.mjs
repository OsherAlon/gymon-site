/**
 * Calculator formulas — hand-built and unit-tested (tests/calculators.test.mjs), never written
 * by the AI (UX doctrine §3: "derived values are recomputed in code"). The article JSON only
 * picks a calculator from the registry in src/lib/article/schema.mjs and sets its defaults.
 *
 * One-rep max from a set taken to (near) failure:
 *   Epley (1985 poundage chart):   1RM = w × (1 + r / 30)
 *   Brzycki (1993, JOPERD 64(1)):  1RM = w × 36 / (37 − r)
 * Both return w itself for r = 1. Gymon's app uses Epley for its stall check
 * (app/src/lib/programRotation.ts#e1rm), so Epley is the headline number here.
 * Reps are capped at 12 by the registry: rep-max relationships differ between people
 * (Richens & Cleather 2014), and prediction from high-rep sets is the least reliable.
 */
import { CALCULATORS } from './article/schema.mjs';

const RANGE = CALCULATORS['one-rep-max'];
export const KG_TO_LB = 2.20462;

export const epley = (w, r) => (r <= 1 ? w : w * (1 + r / 30));
export const brzycki = (w, r) => (r <= 1 ? w : (w * 36) / (37 - r));

/** Rounded to the nearest 0.5 kg, the smallest common plate jump. */
export const roundHalf = (x) => Math.round(x * 2) / 2;

/**
 * @param {number} weightKg
 * @param {number} reps
 * @returns {{ ok: true, epley: number, brzycki: number, low: number, high: number, epleyLb: number }
 *          | { ok: false, reason: 'weight' | 'reps' }}
 */
export function oneRepMax(weightKg, reps) {
  const w = Number(weightKg);
  const r = Number(reps);
  if (!Number.isFinite(w) || w < RANGE.weightKg.min || w > RANGE.weightKg.max) return { ok: false, reason: 'weight' };
  if (!Number.isInteger(r) || r < RANGE.reps.min || r > RANGE.reps.max) return { ok: false, reason: 'reps' };
  const e = roundHalf(epley(w, r));
  const b = roundHalf(brzycki(w, r));
  return { ok: true, epley: e, brzycki: b, low: Math.min(e, b), high: Math.max(e, b), epleyLb: Math.round(e * KG_TO_LB) };
}
