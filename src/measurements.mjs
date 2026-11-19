// SDK records are source-of-truth. Missing values stay missing (never synthesized).
export const PULSE_WINDOW_SECONDS = 12;
export const BREATH_WINDOW_SECONDS = 30;

export function latest(series) {
  return Array.isArray(series) && series.length ? series[series.length - 1] : null;
}
export function normalizeSample(metrics, receivedAt = Date.now()) {
  const pulse = latest(metrics?.cardio?.pulseRate);
  const breath = latest(metrics?.breathing?.rate);
  return {
    receivedAt,
    pulse: Number.isFinite(pulse?.value) ? pulse.value : null,
    pulseConfidence: Number.isFinite(pulse?.confidence) ? pulse.confidence : null,
    pulseStable: typeof pulse?.stable === 'boolean' ? pulse.stable : null,
    breath: Number.isFinite(breath?.value) ? breath.value : null,
    breathConfidence: Number.isFinite(breath?.confidence) ? breath.confidence : null,
    breathStable: typeof breath?.stable === 'boolean' ? breath.stable : null,
  };
}
export function isUsablePulse(sample, elapsedSeconds, validationOk) {
  return elapsedSeconds >= PULSE_WINDOW_SECONDS && validationOk &&
    sample?.pulse !== null && Number.isFinite(sample?.pulse) &&
    sample?.pulseStable === true && Number.isFinite(sample?.pulseConfidence) &&
    sample.pulseConfidence > 0;
}
export function comparePeriods(samples, splitAt) {
  const before = samples.filter(x => x.receivedAt < splitAt);
  const after = samples.filter(x => x.receivedAt >= splitAt);
  const summarize = arr => {
    const values = arr.filter(x => Number.isFinite(x.pulseConfidence));
    const stable = arr.filter(x => x.pulseStable !== null);
    return {
      samples: arr.length,
      meanPulseConfidence: values.length ? values.reduce((s,x) => s+x.pulseConfidence,0)/values.length : null,
      stableRatio: stable.length ? stable.filter(x=>x.pulseStable).length/stable.length : null,
      warningCount: arr.filter(x=>x.validationWarning).length,
    };
  };
  return { before: summarize(before), after: summarize(after) };
}
