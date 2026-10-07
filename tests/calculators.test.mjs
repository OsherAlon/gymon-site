import { test } from 'node:test';
import assert from 'node:assert/strict';
import { epley, brzycki, oneRepMax, roundHalf } from '../src/lib/calculators.mjs';

test('Epley and Brzycki match their published forms', () => {
  assert.equal(epley(100, 10), 100 * (1 + 10 / 30));
  assert.equal(brzycki(100, 10), (100 * 36) / 27);
  // A single rep is the 1RM itself under both.
  assert.equal(epley(80, 1), 80);
  assert.equal(brzycki(80, 1), 80);
  // Brzycki is the algebraic form of w / (1.0278 − 0.0278 r).
  assert.ok(Math.abs(brzycki(100, 5) - 100 / (1.0278 - 0.0278 * 5)) < 0.1);
});

test('oneRepMax rounds to 0.5 kg and orders the range', () => {
  const r = oneRepMax(80, 5);
  assert.deepEqual(r, { ok: true, epley: 93.5, brzycki: 90, low: 90, high: 93.5, epleyLb: 206 });
  const s = oneRepMax(60, 8);
  assert.equal(s.epley, 76); // the sample article's log-example states 76 kg
  assert.equal(oneRepMax(62.5, 7).epley, 77); // …and 77 kg
  assert.equal(roundHalf(77.08), 77);
});

test('oneRepMax rejects values outside the registry ranges', () => {
  assert.deepEqual(oneRepMax(0, 5), { ok: false, reason: 'weight' });
  assert.deepEqual(oneRepMax(600, 5), { ok: false, reason: 'weight' });
  assert.deepEqual(oneRepMax(80, 13), { ok: false, reason: 'reps' });
  assert.deepEqual(oneRepMax(80, 2.5), { ok: false, reason: 'reps' });
  assert.deepEqual(oneRepMax(NaN, 5), { ok: false, reason: 'weight' });
});
