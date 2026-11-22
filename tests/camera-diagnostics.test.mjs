import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeCameraProbe } from '../src/camera-diagnostics.mjs';

test('summarizes only observed camera probe values', () => {
  const result = summarizeCameraProbe({ settings: { width: 1280, height: 720, frameRate: 30 }, label: 'Integrated Camera', elapsedMs: 10_000, presentedFrames: 287, totalFrames: 300, droppedFrames: 13 });
  assert.equal(result.fps, 28.7);
  assert.match(result.text, /Integrated Camera/);
  assert.match(result.text, /1280 × 720/);
  assert.match(result.text, /28\.7 fps/);
  assert.match(result.text, /Dropped frames: 13/);
});
