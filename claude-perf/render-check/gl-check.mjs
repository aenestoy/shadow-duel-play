// WebGL2 renderer phone comparison (render-check.html?check=gl): Canvas High against the WebGL2 fight renderer on
// the same High scene. Pure data + helpers (tested by phone-render-check-test.mjs); the page is gl-controller.mjs.
import { summarize } from './metrics.mjs?v=prepared1';

export const GLCHECK = { report: 'shadow-duel-gl-check-v1', build: 'phone-perf-gl-v1', warmupMs: 1000, sampleMs: 3000, simpleMs: 2000 };

// scene 'posed' = the step-1 scene (rain, Kuro / Yuki in animated stance / guard, fixed camera, no combat)
// scene 'live'  = the same match fought AI against AI with specials (fixed 1/60 s per drawn frame, so both
//                 renderers draw exactly the same frames of the same fight)
// renderer 'canvas' = current High Canvas 2D path | 'gl' = WebGL2 renderer (?renderer=gl), msaa = its multisampling
export const VARIANTS = {
  canvas: { label: 'Canvas High (current)', scene: 'posed', renderer: 'canvas' },
  gl: { label: 'WebGL2 High', scene: 'posed', renderer: 'gl', msaa: 4 },
  glNoMsaa: { label: 'WebGL2 High without multisampling (info only)', scene: 'posed', renderer: 'gl', msaa: 0 },
  liveCanvas: { label: 'Live fight · Canvas High', scene: 'live', renderer: 'canvas' },
  liveGl: { label: 'Live fight · WebGL2 High', scene: 'live', renderer: 'gl', msaa: 4 },
};

// Balanced: A B A B on the posed scene, B A B A on the live fight, simple canvas at both ends.
export const glStages = ['simple', 'canvas', 'gl', 'canvas', 'gl', 'glNoMsaa', 'liveGl', 'liveCanvas', 'liveGl', 'liveCanvas', 'simple'];

export function stageSummary(kind, frames, callbacks, skips, extra = {}) {
  const s = summarize(frames);
  const gaps = frames.map((f) => f.gap);
  return { kind, ...s, over20ms: gaps.filter((g) => g > 20).length, over33ms: gaps.filter((g) => g > 33.4).length, callbacks, skips, ...extra };
}

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const r3 = (v) => Math.round(v * 1000) / 1000;
// Per variant: mean fps of its runs, spread, p95, and the ratio to the Canvas runs of the same scene.
export function compare(stages) {
  const by = {};
  for (const s of stages) if (s.kind !== 'simple' && s.available !== false) (by[s.kind] = by[s.kind] || []).push(s);
  const base = { posed: by.canvas, live: by.liveCanvas }, out = {};
  for (const [kind, list] of Object.entries(by)) {
    const v = VARIANTS[kind], fps = list.map((s) => s.fps), m = mean(fps), ref = base[v?.scene];
    out[kind] = { runs: list.length, fps: r3(m), spread: r3(Math.max(...fps) - Math.min(...fps)),
      p50Ms: r3(mean(list.map((s) => s.frameMs.p50))), p95Ms: r3(mean(list.map((s) => s.frameMs.p95))), p99Ms: r3(mean(list.map((s) => s.frameMs.p99))),
      cpuMs: r3(mean(list.map((s) => s.synchronousMs))), over20ms: list.reduce((n, s) => n + s.over20ms, 0),
      vsCanvas: ref && ref.length ? r3(m / mean(ref.map((s) => s.fps))) : null };
  }
  return out;
}

export function warnings(stages) {
  const w = [], simple = stages.filter((s) => s.kind === 'simple');
  if (simple.length === 2 && Math.max(...simple.map((s) => s.fps)) > 1.25 * Math.min(...simple.map((s) => s.fps))) w.push('Simple-canvas cadence changed between start and end (refresh rate or power mode changed).');
  for (const k of ['canvas', 'liveCanvas']) {
    const l = stages.filter((s) => s.kind === k);
    if (l.length === 2 && Math.max(...l.map((s) => s.fps)) > 1.2 * Math.min(...l.map((s) => s.fps))) w.push(`The two ${k} runs differ by more than 20%; treat small differences as noise.`);
  }
  if (stages.some((s) => s.available === false)) w.push('WebGL2 renderer unavailable: its stages were skipped.');
  if (stages.some((s) => VARIANTS[s.kind]?.renderer === 'gl' && s.available !== false && !(s.glFrames > 0 && s.glFallbacks === 0))) w.push('A WebGL2 stage fell back to Canvas for some frames; that stage is not a clean WebGL2 measurement.');
  if (stages.some((s) => s.frames < 30)) w.push('A stage recorded fewer than 30 frames.');
  return w;
}
