import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSample, isDecodedMetrics, isUsablePulse, comparePeriods } from '../src/measurements.mjs';

test('preserves absent SDK data as null', () => {
  const sample = normalizeSample({});
  assert.equal(sample.pulse, null);
  assert.equal(sample.pulseConfidence, null);
  assert.equal(sample.pulseStable, null);
  assert.equal(sample.breath, null);
});

test('decodes only object-shaped metric messages', () => {
  assert.equal(isDecodedMetrics({ cardio: {} }), true);
  assert.equal(isDecodedMetrics(null), false);
  assert.equal(isDecodedMetrics(new Uint8Array([1, 2])), false);
});

test('uses actual payload and rejects early or unstable output', () => {
  const sample = normalizeSample({ cardio: { pulseRate: [{ value: 72, confidence: 84, stable: true }] } }, 100);
  assert.deepEqual(sample, { receivedAt: 100, pulse: 72, pulseConfidence: 84, pulseStable: true, breath: null, breathConfidence: null, breathStable: null });
  assert.equal(isUsablePulse(sample, 11, true), false);
  assert.equal(isUsablePulse(sample, 13, true), true);
  assert.equal(isUsablePulse({ ...sample, pulseStable: false }, 13, true), false);
  assert.equal(isUsablePulse(sample, 13, false), false);
});

test('keeps missing fields missing instead of coercing them to zero', () => {
  const sample = normalizeSample({ cardio: { pulseRate: [{ value: 0, confidence: 0, stable: false }] } });
  assert.equal(sample.pulse, 0);
  assert.equal(sample.pulseConfidence, 0);
  assert.equal(sample.breath, null);
});

test('compares pre and post disruption without invented values', () => {
  const result = comparePeriods([
    { receivedAt: 1, pulseConfidence: 90, pulseStable: true },
    { receivedAt: 3, pulseConfidence: 30, pulseStable: false, validationWarning: true },
  ], 2);
  assert.equal(result.before.meanPulseConfidence, 90);
  assert.equal(result.after.warningCount, 1);
  assert.equal(result.before.samples, 1);
});
