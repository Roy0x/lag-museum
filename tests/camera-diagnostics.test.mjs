import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeCameraProbe, summarizeSmartSpectraCapture } from '../src/camera-diagnostics.mjs';

test('summarizes only observed camera probe values', () => {
  const result = summarizeCameraProbe({ settings: { width: 1280, height: 720, frameRate: 30 }, label: 'Integrated Camera', elapsedMs: 10_000, presentedFrames: 287, totalFrames: 300, droppedFrames: 13 });
  assert.equal(result.fps, 28.7);
  assert.match(result.text, /Integrated Camera/);
  assert.match(result.text, /1280 × 720/);
  assert.match(result.text, /28\.7 fps/);
  assert.match(result.text, /Dropped frames: 13/);
});

test('reports the actual SmartSpectra capture mode without claiming the requested mode was granted', () => {
  const text = summarizeSmartSpectraCapture({ settings: { width: 960, height: 540, frameRate: 29.97 }, label: 'Integrated Camera' });
  assert.match(text, /SDK target: 1280 × 720 at 30 fps/);
  assert.match(text, /Active track: 960 × 540 at 29\.97 fps/);
});
