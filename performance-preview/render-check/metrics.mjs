export const warmupMs = 1000, sampleMs = 3000;
export const stages = [
  ['idle', 'Browser cadence'], ['full', 'Full High'], ['noPost', 'Without bloom + grain'],
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
    frameMs: { p50: rounded(percentile(.5)), p95: rounded(percentile(.95)), max: rounded(gaps.at(-1)) },
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
