import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSample, isUsablePulse, comparePeriods } from '../src/measurements.mjs';
test('preserves absent SDK data as null', () => {
  assert.equal(normalizeSample({}).pulse, null);
  assert.equal(normalizeSample({}).pulseConfidence, null);
});
test('uses actual payload and rejects early or unstable output', () => {
  const s=normalizeSample({cardio:{pulseRate:[{value:72,confidence:84,stable:true}]}},100);
  assert.equal(s.pulse,72);
  assert.equal(isUsablePulse(s,11,true),false);
  assert.equal(isUsablePulse(s,13,true),true);
  assert.equal(isUsablePulse({...s,pulseStable:false},13,true),false);
});
test('compares pre and post disruption without invented values', () => {
  const result=comparePeriods([{receivedAt:1,pulseConfidence:90,pulseStable:true},{receivedAt:3,pulseConfidence:30,pulseStable:false,validationWarning:true}],2);
  assert.equal(result.before.meanPulseConfidence,90);
  assert.equal(result.after.warningCount,1);
});
