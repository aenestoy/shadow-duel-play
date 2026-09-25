// WebGL2 renderer phone check (render-check.html?check=gl): the WebGL2 fight renderer on its own first (a long live
// fight before anything heats the phone, then each graphics tier uncapped), then Canvas High against WebGL2 High on
// the same scenes. Pure data + helpers (tested by phone-render-check-test.mjs); the page is gl-controller.mjs.
import { summarize } from './metrics.mjs?v=prepared1';

export const GLCHECK = { report: 'shadow-duel-gl-check-v2', build: 'phone-perf-gl-v2', warmupMs: 1000, sampleMs: 3000, longMs: 15000, tierMs: 4000, simpleMs: 2000, playMs: 60000 };

// scene 'posed' = the step-1 scene (rain, Kuro / Yuki in animated stance / guard, fixed camera, no combat)
// scene 'live'  = the same match fought AI against AI with specials (fixed 1/60 s per drawn frame, so both
//                 renderers draw exactly the same frames of the same fight)
// renderer 'canvas' = current High Canvas 2D path | 'gl' = WebGL2 renderer (?renderer=gl), msaa = its multisampling
// tier = graphics tier (default high); fps = frame cap (60 as the game on phones, 0 = uncapped: up to the display
// rate); ms = sample length (GLCHECK key); profile = also time the tessellation of every path (a little overhead)
export const VARIANTS = {
  canvas: { label: 'Canvas High (current)', scene: 'posed', renderer: 'canvas' },
  gl: { label: 'WebGL2 High', scene: 'posed', renderer: 'gl', msaa: 4 },
  liveCanvas: { label: 'Live fight · Canvas High', scene: 'live', renderer: 'canvas' },
  liveGl: { label: 'Live fight · WebGL2 High', scene: 'live', renderer: 'gl', msaa: 4 },
  liveGlLong: { label: 'Live fight · WebGL2 High · 15 s, first', scene: 'live', renderer: 'gl', msaa: 4, ms: 'longMs' },
  liveGlHighMax: { label: 'Live fight · WebGL2 High · uncapped', scene: 'live', renderer: 'gl', msaa: 4, tier: 'high', fps: 0, ms: 'tierMs' },
  liveGlMediumMax: { label: 'Live fight · WebGL2 Medium · uncapped', scene: 'live', renderer: 'gl', msaa: 4, tier: 'medium', fps: 0, ms: 'tierMs' },
  liveGlLowMax: { label: 'Live fight · WebGL2 Low · uncapped', scene: 'live', renderer: 'gl', msaa: 4, tier: 'low', fps: 0, ms: 'tierMs' },
  liveGlProfile: { label: 'Live fight · WebGL2 High · path timing', scene: 'live', renderer: 'gl', msaa: 4, profile: true },
};

// WebGL2 alone first (the phone is still cool), then the A/B pairs (posed A B A B, live B A B A), simple canvas at
// both ends as the cadence control.
export const glStages = ['simple', 'liveGlLong', 'liveGlHighMax', 'liveGlMediumMax', 'liveGlLowMax', 'liveGlProfile',
  'canvas', 'gl', 'canvas', 'gl', 'liveGl', 'liveCanvas', 'liveGl', 'liveCanvas', 'simple'];

export function stageSummary(kind, frames, callbacks, skips, extra = {}) {
  const s = summarize(frames);
  const gaps = frames.map((f) => f.gap);
  const { elapsedMs, ...rest } = s; void elapsedMs; void callbacks;
  return { kind, ...rest, over20ms: gaps.filter((g) => g > 20).length, over33ms: gaps.filter((g) => g > 33.4).length, skips, ...extra };
}

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const r1 = (v) => Math.round(v * 10) / 10;
const r3 = (v) => Math.round(v * 1000) / 1000;
const pct = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1))]; };

// Per-frame breakdown of a WebGL2 stage. Each frame row (gl-controller.mjs): gap (ms to the next drawn frame), cpu
// (the frame's own work), sim (simulation + AI), rec (recording the drawing: game drawing code + tessellation), end
// (buffer / picture uploads + GL calls + post), tess (path tessellation, profile stage only), texts / textMs (new text
// pictures), imgs / imgMs (picture uploads), why (first upload cause), ramps (new gradient rows), gpuMs (GPU time of
// the frame, when the browser has timer queries), lag (frames until the GPU finished it), loaf (ms of long animation
// frames overlapping the gap), fb (Canvas fallback).
export function breakdown(rows) {
  const col = (k) => rows.map((r) => r[k]).filter((v) => typeof v === 'number' && v >= 0);
  const stat = (k) => { const a = col(k); return a.length ? { mean: r1(mean(a)), p95: r1(pct(a, 0.95)), max: r1(Math.max(...a)) } : null; };
  const sum = (k) => r1(col(k).reduce((x, y) => x + y, 0));
  const out = { sim: stat('sim'), rec: stat('rec'), end: stat('end') };
  const tess = stat('tess'); if (tess) out.tess = tess;
  out.texts = sum('texts'); out.textMs = sum('textMs'); out.imgs = sum('imgs'); out.imgMs = sum('imgMs'); out.ramps = sum('ramps');
  const gpu = col('gpuMs'); if (gpu.length) out.gpuMs = { p50: r1(pct(gpu, 0.5)), p95: r1(pct(gpu, 0.95)), max: r1(Math.max(...gpu)) };
  const lag = col('lag'); if (lag.length) out.gpuLagFrames = { p50: pct(lag, 0.5), p95: pct(lag, 0.95), max: Math.max(...lag) };
  const why = {};
  for (const r of rows) if (r.why) why[r.why] = (why[r.why] || 0) + 1;
  if (Object.keys(why).length) out.uploadCauses = Object.entries(why).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${n}× ${k}`.slice(0, 120));
  return out;
}

// Why a frame was late (gap > 25 ms): the frame's own work, or what happened around it.
export function spikeCause(r) {
  if (r.fb) return 'canvas fallback frame';
  if (r.cpu > 20) {
    const parts = { simulation: r.sim || 0, 'drawing record': (r.rec || 0) - (r.textMs || 0), 'text pictures': r.textMs || 0, 'picture upload': r.imgMs || 0, 'GL submit': (r.end || 0) - (r.imgMs || 0) };
    return 'cpu: ' + Object.entries(parts).sort((a, b) => b[1] - a[1])[0][0];
  }
  if (r.imgs > 0) return 'picture upload';
  if (r.texts > 0) return 'new text pictures';
  if (r.loaf > r.gap * 0.6) return 'main thread busy outside the frame (GC / style / other task)';
  if (r.gpuMs > 16) return 'GPU time over budget';
  if (r.lag >= 3) return 'GPU behind (fence lag)';
  return 'waiting for display / GPU (no CPU cause)';
}
export function spikes(rows, limit = 6) {
  const late = rows.filter((r) => r.gap > 25);
  const causes = {};
  for (const r of late) { const c = spikeCause(r); causes[c] = (causes[c] || 0) + 1; }
  // one line per slow frame: "gap · cpu (sim / rec / end) · extras · cause"
  const top = [...late].sort((a, b) => b.gap - a.gap).slice(0, limit).map((r) => {
    let t = `${r1(r.gap)} ms · cpu ${r1(r.cpu)} (${r1(r.sim || 0)}/${r1(r.rec || 0)}/${r1(r.end || 0)})`;
    if (r.texts) t += ` · texts ${r.texts}`;
    if (r.imgs) t += ` · uploads ${r.imgs} ${String(r.why || '').slice(0, 40)}`;
    if (r.gpuMs >= 0) t += ` · gpu ${r1(r.gpuMs)}`;
    if (r.lag >= 0) t += ` · lag ${r.lag}`;
    if (r.loaf) t += ` · busy ${r1(r.loaf)}`;
    return t + ' · ' + spikeCause(r);
  });
  return { over25ms: late.length, causes, top };
}

// Per variant: mean fps of its runs, spread, p95, and the ratio to the Canvas runs of the same scene.
export function compare(stages) {
  const by = {};
  for (const s of stages) if (s.kind !== 'simple' && s.available !== false) (by[s.kind] = by[s.kind] || []).push(s);
  const base = { posed: by.canvas, live: by.liveCanvas }, out = {};
  for (const [kind, list] of Object.entries(by)) {
    const v = VARIANTS[kind], fps = list.map((s) => s.fps), m = mean(fps), ref = v && !v.tier && v.fps !== 0 ? base[v.scene] : null;
    out[kind] = { runs: list.length, fps: r1(m), spread: r1(Math.max(...fps) - Math.min(...fps)), p95Ms: r1(mean(list.map((s) => s.frameMs.p95))),
      over33ms: list.reduce((n, s) => n + s.over33ms, 0), vsCanvas: ref && ref.length ? r3(m / mean(ref.map((s) => s.fps))) : null };
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

// Small on-screen summary for the 60-second play mode: fps over the last second, p95 over the last five seconds.
export function playStats(gaps, elapsedMs) {
  let t = 0, n1 = 0, t1 = 0;
  const last5 = [];
  for (let i = gaps.length - 1; i >= 0 && t < 5000; i--) {
    const g = gaps[i]; t += g; last5.push(g);
    if (t1 < 1000) { t1 += g; n1++; }
  }
  return { fps: t1 ? r1(n1 * 1000 / t1) : 0, p95: r1(pct(last5, 0.95)), over33: gaps.filter((g) => g > 33.4).length, seconds: Math.floor(elapsedMs / 1000) };
}
