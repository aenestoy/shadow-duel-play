// Step 1 phone comparison (render-check.html?check=step1): the previous High path against each new change on its
// own and all of them together, in one run on the same scene. Pure data + helpers; the page is step1-controller.mjs.
import { summarize } from './metrics.mjs?v=prepared1';

export const STEP1 = { report: 'shadow-duel-step1-check-v1', build: 'phone-perf-step1-v1', warmupMs: 1000, sampleMs: 3000, simpleMs: 2000 };

// glowMode 'filter' = ctx.filter blur(5px) (old) | 'blur' = downsample + separable blur (new)
// sceneMode 'direct' = scene drawn on the visible canvas and read back for the bloom (old) | 'layer' = offscreen (new)
// grainMode 'off' removes the film grain: a diagnosis of its cost only, it changes the picture
// post 'present' = opt-in WebGL candidate shown directly (?post=present), never the default
// cap = 60 fps frame pacing (default on phones in the new build)
export const VARIANTS = {
  old: { label: 'Old High (filter blur, on-screen scene, no cap)', glowMode: 'filter', sceneMode: 'direct', grainMode: 'on', post: 'canvas', cap: false },
  glow: { label: 'New glow blur only', glowMode: 'blur', sceneMode: 'direct', grainMode: 'on', post: 'canvas', cap: false },
  layer: { label: 'Offscreen scene layer only', glowMode: 'filter', sceneMode: 'layer', grainMode: 'on', post: 'canvas', cap: false },
  cap: { label: '60 fps cap only', glowMode: 'filter', sceneMode: 'direct', grainMode: 'on', post: 'canvas', cap: true },
  new: { label: 'All new (default build)', glowMode: 'blur', sceneMode: 'layer', grainMode: 'on', post: 'canvas', cap: true },
  noGrain: { label: 'All new without grain (diagnosis only)', glowMode: 'blur', sceneMode: 'layer', grainMode: 'off', post: 'canvas', cap: true },
  present: { label: 'All new + WebGL shown directly (opt-in)', glowMode: 'blur', sceneMode: 'layer', grainMode: 'on', post: 'present', cap: true },
};

// Mirrored order (A B C … C B A): a slow drift in phone speed (heat, power mode) affects every variant alike.
const HALF = ['old', 'new', 'glow', 'layer', 'cap', 'noGrain', 'present'];
export const step1Stages = ['simple', ...HALF, ...HALF.slice().reverse(), 'simple'];

// frames: { gap, cpu }[] of drawn frames; callbacks/skips: rAF callbacks seen / skipped by the cap
export function stageSummary(kind, frames, callbacks, skips, extra = {}) {
  const s = summarize(frames);
  return { kind, ...s, callbacks, skips, ...extra };
}

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const r3 = (v) => Math.round(v * 1000) / 1000;
// Per variant: mean fps of its runs, spread between them, and the ratio to the old path's mean.
export function compare(stages) {
  const by = {};
  for (const s of stages) if (s.kind !== 'simple' && s.available !== false) (by[s.kind] = by[s.kind] || []).push(s);
  const old = by.old ? mean(by.old.map((s) => s.fps)) : null, out = {};
  for (const [kind, list] of Object.entries(by)) {
    const fps = list.map((s) => s.fps), m = mean(fps);
    out[kind] = { runs: list.length, fps: r3(m), spread: r3(Math.max(...fps) - Math.min(...fps)),
      p95Ms: r3(mean(list.map((s) => s.frameMs.p95))), vsOld: old ? r3(m / old) : null };
  }
  return out;
}

export function warnings(stages) {
  const w = [], simple = stages.filter((s) => s.kind === 'simple'), old = stages.filter((s) => s.kind === 'old');
  if (simple.length === 2 && Math.max(...simple.map((s) => s.fps)) > 1.25 * Math.min(...simple.map((s) => s.fps))) w.push('Simple-canvas cadence changed between start and end (refresh rate or power mode changed).');
  if (old.length === 2 && Math.max(...old.map((s) => s.fps)) > 1.2 * Math.min(...old.map((s) => s.fps))) w.push('The two old-High runs differ by more than 20%; treat small differences as noise.');
  if (stages.some((s) => s.kind === 'present' && s.available === false)) w.push('WebGL candidate unavailable: its stages were skipped (open the link with &post=present).');
  if (stages.some((s) => s.frames < 30)) w.push('A stage recorded fewer than 30 frames.');
  return w;
}
