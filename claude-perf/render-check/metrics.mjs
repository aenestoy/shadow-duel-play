export const warmupMs = 1000, sampleMs = 3000;
export const postStages = [
  ['simple', 'Simple animated canvas'], ['full', 'Canvas High'], ['gpu', 'GPU High candidate'],
  ['full', 'Canvas High'], ['gpu', 'GPU High candidate'], ['full', 'Canvas High'], ['simple', 'Simple animated canvas'],
];
export const fighterStages = [
  ['simple', 'Simple animated canvas'], ['full', 'High reference'], ['parts', 'High cached characters'],
  ['full', 'High reference'], ['parts', 'High cached characters'], ['full', 'High reference'], ['simple', 'Simple animated canvas'],
];
export const stages = [
  ['idle', 'Browser cadence'], ['simple', 'Simple animated canvas'], ['logic', 'Combat logic + replay recording'],
  ['full', 'Full High'], ['audio', 'Full High + generated music'], ['full', 'Full High'], ['noPost', 'Without bloom + grain'],
  ['full', 'Full High'], ['noFighters', 'Without fighters + their shadows'],
  ['full', 'Full High'], ['noBack', 'Without background'],
  ['full', 'Full High'], ['noWeather', 'Without rain'],
  ['full', 'Full High'], ['noHud', 'Without interface'],
  ['full', 'Full High'], ['idle', 'Browser cadence'],
];
const rounded = n => Math.round(n * 1000) / 1000;
export function summarize(samples) {
  if (!samples.length) throw Error('No measured frames');
  const gaps = samples.map(s => s.gap).sort((a, b) => a - b);
  const elapsedMs = samples.reduce((n, s) => n + s.gap, 0);
  const percentile = p => gaps[Math.max(0, Math.ceil(p * gaps.length) - 1)];
  return {
    frames: samples.length, elapsedMs: rounded(elapsedMs), fps: rounded(samples.length * 1000 / elapsedMs),
    frameMs: { p50: rounded(percentile(.5)), p95: rounded(percentile(.95)), p99: rounded(percentile(.99)), max: rounded(gaps.at(-1)) },
    synchronousMs: rounded(samples.reduce((n, s) => n + s.cpu, 0) / samples.length),
    over50ms: gaps.filter(g => g > 50).length,
  };
}
// Warm-up and stage transition work must not leak into measured intervals.
export function measuredInterval(previousElapsed, gap, previousCpu) {
  if (previousElapsed < warmupMs || !(gap > 0) || !Number.isFinite(gap) || !Number.isFinite(previousCpu)) return null;
  return { gap, cpu: previousCpu };
}
export function replaceMethod(undo, obj, name, replacement) {
  const own = Object.getOwnPropertyDescriptor(obj, name);
  obj[name] = replacement;
  undo.push(() => { if (own) Object.defineProperty(obj, name, own); else delete obj[name]; });
}
export function restore(undo) { while (undo.length) undo.pop()(); }

// Flag unstable controls; retain all raw results, including stalls. These are interpretation
// warnings, not proof of throttling or a diagnosis of a specific component.
export function assessControls(results) {
  const warnings = [], cadence = results.filter(s => s.kind === 'idle');
  if (cadence.length === 2 && Math.max(...cadence.map(s => s.fps)) > 1.25 * Math.min(...cadence.map(s => s.fps))) {
    warnings.push('Browser cadence changed substantially between the first and last control.');
  }
  if (results.some(s => s.frameMs.p50 >= 250)) warnings.push('At least one stage had sustained very long frame intervals.');
  const logic = results.find(s => s.kind === 'logic');
  if (logic && logic.simulationSeconds < (warmupMs + sampleMs) / 1000 * .8) {
    warnings.push('Combat simulation could not advance through the intended test duration.');
  }
  const full = results.filter(s => s.kind === 'full');
  if (full.length && Math.max(...full.map(s => s.fps)) > 1.35 * Math.min(...full.map(s => s.fps))) {
    warnings.push('Full High controls varied substantially; do not attribute all differences to omitted layers.');
  }
  const active = results.filter(s => s.kind === 'simple');
  if (active.length === 2 && Math.max(...active.map(s => s.fps)) > 1.25 * Math.min(...active.map(s => s.fps))) {
    warnings.push('Animated-canvas cadence changed substantially between the first and last control.');
  }
  if (results.some(s => s.kind === 'gpu' && (!s.gpu?.ready || s.renderer !== 'fighter-surfaces-v1+webgl-post-probe'))) {
    warnings.push('The requested GPU candidate was unavailable or fell back; do not treat this as a GPU comparison.');
  }
  if (results.some(s => s.kind === 'parts')) {
    const measured = results.filter(s => s.kind === 'full' || s.kind === 'parts');
    if (measured.some(s => !s.gpu?.ready || !s.renderer?.endsWith('+webgl-post-probe'))) warnings.push('Both character renderers must use the same active GPU post-processing; fallback invalidates this comparison.');
    if (measured.some(s => s.kind === 'parts' && (!s.renderer?.startsWith('fighter-parts-high-v1') || s.caches?.length !== 2 || !s.caches.every(c => c?.hits > 0)))) warnings.push('The High character cache was not active for both fighters.');
  }
  return { stableControls: warnings.length === 0, warnings };
}
