export const CAMERA_PROBE_DURATION_MS = 10_000;

export function summarizeCameraProbe({ settings = {}, label = '', elapsedMs = 0, presentedFrames = 0, totalFrames = null, droppedFrames = null }) {
  const seconds = Math.max(0.001, elapsedMs / 1000);
  const fps = presentedFrames / seconds;
  const resolution = Number.isFinite(settings.width) && Number.isFinite(settings.height)
    ? `${settings.width} × ${settings.height}` : 'not reported';
  const reportedFps = Number.isFinite(settings.frameRate) ? `${settings.frameRate} fps requested` : 'frame rate not reported';
  const device = label || 'Camera label unavailable';
  const dropped = Number.isFinite(droppedFrames) ? String(droppedFrames) : 'not reported by browser';
  const total = Number.isFinite(totalFrames) ? String(totalFrames) : 'not reported by browser';
  return {
    fps,
    text: `10-second local camera probe\nDevice: ${device}\nResolution: ${resolution}\nTrack setting: ${reportedFps}\nObserved presentation rate: ${fps.toFixed(1)} fps (${presentedFrames} frames / ${seconds.toFixed(1)} s)\nDropped frames: ${dropped} (total video frames: ${total})`,
  };
}

export async function runCameraProbe(video, { signal, durationMs = CAMERA_PROBE_DURATION_MS } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera diagnostics are unavailable in this browser.');
  if (signal?.aborted) throw new DOMException('Camera probe cancelled.', 'AbortError');
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
  });
  const track = stream.getVideoTracks()[0];
  let callbackId = null, presentedFrames = 0, startedAt = performance.now();
  try {
    video.srcObject = stream;
    await video.play();
    startedAt = performance.now();
    const countFrame = () => {
      presentedFrames++;
      callbackId = video.requestVideoFrameCallback?.(countFrame) ?? null;
    };
    callbackId = video.requestVideoFrameCallback?.(countFrame) ?? null;
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, durationMs);
      signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Camera probe cancelled.', 'AbortError')); }, { once: true });
    });
    const quality = video.getVideoPlaybackQuality?.();
    const elapsedMs = performance.now() - startedAt;
    return summarizeCameraProbe({
      settings: track?.getSettings?.(), label: track?.label, elapsedMs, presentedFrames,
      totalFrames: quality?.totalVideoFrames, droppedFrames: quality?.droppedVideoFrames,
    });
  } finally {
    if (callbackId != null) video.cancelVideoFrameCallback?.(callbackId);
    stream.getTracks().forEach(candidate => candidate.stop());
    video.pause();
    video.srcObject = null;
  }
}
