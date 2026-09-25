import { summarize, assessControls } from './metrics.mjs?v=prepared1';
import { makeSequence, sequenceHz, sequenceFrames, cacheCounts, cacheDelta, assertPrepared } from './sequence.mjs?v=prepared1';
import { MeasurementWindow } from './measurement-window.mjs?v=prepared2';
const boot = window.__renderCheckBoot, N = window.ND, g = N?.game;
const $ = id => document.getElementById(id), cv = $('cv'), panel = $('rc-panel'), strip = $('rc-strip'), start = $('rc-start');
if (!boot.ok || !g) throw Error('The isolated game could not start.');
window.requestAnimationFrame = boot.raf;
document.documentElement.classList.add('rc-isolated'); $('app').inert = true;
await document.fonts.ready;
const nextFrame = () => new Promise(resolve => boot.raf(resolve));
const dimensions = () => [innerWidth, innerHeight, devicePixelRatio, cv.width, cv.height].join('/');
let running = false, interrupted = '', viewport = '', sequence, report;
document.addEventListener('visibilitychange', () => { if (running && document.hidden) interrupted = 'The tab was hidden'; });
window.addEventListener('resize', () => { if (running) interrupted = 'The viewport changed'; });
document.addEventListener('keydown', event => {
  if (!running) return;
  event.preventDefault(); event.stopImmediatePropagation();
  if (event.code === 'Escape') interrupted = 'Test stopped';
}, true);
function active() {
  if (interrupted || document.hidden) throw Error(interrupted || 'The tab is hidden');
  if (viewport && viewport !== dimensions()) throw Error('The drawing resolution changed');
  if (boot.errors.length) throw Error(boot.errors.join('; '));
}
function render(index, mode) {
  sequence.apply(index); boot.resetRandom(17 + index); g.fighterMode = mode;
  g.hud(); g.render();
}
function freeze(value) { for (const f of g.F) f.highBakeCache().readOnly = value; }
// Read-only diagnostic page hooks for local visual and state audits; never imported by the game page.
window.__preparedCheck = { render, sequence: () => sequence, freeze };
async function prepare() {
  boot.resetRandom(); N.gfx.setQuality('high'); N.gfx.ladderFrame = () => {};
  N.audio.paramMuted = true; N.audio.init(); N.music.init(); N.audio.setEnabled(false); N.music.setEnabled(false);
  clearInterval(N.music.timer); N.music.timer = null; await N.audio.ctx?.suspend();
  $('first').hidden = true; g.start('cpu', { c1: 2, c2: 3, arena: 'rain' }); g.ais = [];
  while (g.preparing) { await nextFrame(); active(); g._frame(1000 / 60); }
  g.phase = 'fight'; g.pt = 0; g.bars = 0; g.dim = 0; g.paused = false;
  for (const f of g.F) { f.locked = false; f.inv = 0; f.highBakeCache().readOnly = false; N.clearBakeCache(f.highBakeCache()); }
  Object.assign(N.cam, { x: 0, y: -118, z: 1.28, shx: 0, shy: 0 });
  g.syncTouch(); $('pauseBtn').hidden = true; viewport = dimensions();
  sequence = makeSequence(N, g); g.postMode = 'webgl';
  report.sequence = { hz: sequenceHz, frames: sequenceFrames, seconds: sequenceFrames / sequenceHz, movingCloth: true };
  const initial = cacheCounts(N, g); let workFrames = 0;
  for (let i = 0; i < sequence.frames.length; i++) {
    let done = false;
    while (!done) {
      await nextFrame(); active();
      if (++workFrames > sequenceFrames * 24) throw Error('Preparation could not converge within its bounded work limit');
      sequence.apply(i); boot.resetRandom(); g.fighterMode = 'parts';
      done = N.prepareBaked(() => { for (const f of g.F) g.drawLit(f, ctx => f.draw(ctx, false, true)); });
      if (cacheDelta(initial, cacheCounts(N, g)).some(s => s.evictions)) throw Error('Moving sequence exceeds the existing cache capacity');
      $('rc-status').textContent = `Preparing moving characters · ${i + 1}/${sequenceFrames}`;
    }
  }
  freeze(true);
  const ready = cacheCounts(N, g), snapshotText = JSON.stringify(sequence.frames);
  // Draw every prepared state through the complete High pipeline once, including first-use uploads.
  for (let i = 0; i < sequence.frames.length; i++) {
    await nextFrame(); active(); render(i, 'parts');
    $('rc-status').textContent = `Verifying prepared movement · ${i + 1}/${sequenceFrames}`;
  }
  assertPrepared(cacheDelta(ready, cacheCounts(N, g)));
  if (snapshotText !== JSON.stringify(sequence.frames)) throw Error('Drawing mutated the prepared state sequence');
  if (!g.postGpuStatus().ready || !g.renderVersion.endsWith('+webgl-post-probe')) throw Error('GPU post-processing is unavailable; comparison stopped');
  report.preparation = { displayFrames: workFrames, stateIntegrity: true, caches: cacheCounts(N, g), verification: cacheDelta(ready, cacheCounts(N, g)) };
}
async function measure(kind, label) {
  const simple = kind === 'simple', mode = kind === 'parts' ? 'parts' : 'paths';
  const warmup = 1000, sample = simple ? 3000 : 10000, counters = cacheCounts(N, g);
  const caches = g.F.map(f => f.highBakeCache()), fields = ['bakes', 'hits', 'live', 'evictions', 'bornPixels'];
  // Avoid per-frame telemetry objects/arrays. Expand into JSON only after the measured window ends.
  const stride = 13, records = new Float64Array(8192 * stride), beforeValues = new Float64Array(10), previousDelta = new Float64Array(10);
  const clock = new MeasurementWindow(warmup, sample);
  let count = 0, previousCpu = 0, previousIndex = -1;
  let sampleStart = null;
  strip.textContent = `${label} · warming up`;
  try {
    for (;;) {
      const now = await nextFrame(); active(); clock.advance(now);
      const elapsed = clock.elapsedMs;
      if (clock.recordPrevious) {
        if (count >= 8192) throw Error('Frame telemetry capacity exceeded');
        const offset = count++ * stride;
        records[offset] = clock.intervalMs; records[offset + 1] = previousCpu; records[offset + 2] = previousIndex;
        records.set(previousDelta, offset + 3);
      }
      if (clock.done) break;
      if (clock.startsSample) {
        sampleStart = cacheCounts(N, g);
        strip.textContent = `${label} · measuring`;
      }
      for (let i = 0; i < 2; i++) for (let k = 0; k < fields.length; k++) beforeValues[i * 5 + k] = caches[i][fields[k]];
      const index = Math.floor(elapsed * sequenceHz / 1000) % sequenceFrames;
      const before = performance.now();
      if (simple) {
        const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
        x.fillStyle = '#0c0d15'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = '#d8b36b'; x.fillRect((elapsed * .3) % cv.width, cv.height * .45, 40, 40);
      } else render(index, mode);
      previousCpu = performance.now() - before;
      for (let i = 0; i < 2; i++) for (let k = 0; k < fields.length; k++) {
        const delta = caches[i][fields[k]] - beforeValues[i * 5 + k]; previousDelta[i * 5 + k] = delta;
        if (kind === 'parts' && k !== 1 && delta !== 0) throw Error('Prepared frame changed character resources');
      }
      previousIndex = index;
    }
    const sampleEnd = cacheCounts(N, g), samples = [];
    for (let n = 0; n < count; n++) {
      const offset = n * stride;
      samples.push({ gap: records[offset], cpu: records[offset + 1], snapshot: records[offset + 2],
        resources: [0, 1].map(i => Object.fromEntries(fields.map((k, j) => [k, records[offset + 3 + i * 5 + j]]))) });
    }
    const result = { kind, label, ...summarize(samples), timing: clock.snapshot(), renderer: g.renderVersion, gpu: g.postGpuStatus(),
      counterWindows: { stageStart: counters, sampleStart, sampleEnd }, measuredResources: cacheDelta(sampleStart, sampleEnd),
      caches: cacheCounts(N, g), samples };
    if (kind === 'parts') {
      assertPrepared(result.measuredResources);
      if (!result.measuredResources.every(s => s.hits > 0)) throw Error('Prepared cache was not used');
    }
    return result;
  } catch (error) {
    report.failedStage = { kind, label, timing: clock.snapshot(), recordedIntervals: count };
    throw error;
  }
}
document.querySelector('#rc-card h1').textContent = 'Shadow Duel · Prepared character test';
$('rc-help').textContent = 'Moving High-quality comparison. Keep the phone sideways and this tab visible. Preparation is followed by about 52 seconds of automatic testing; long pauses can extend this.';
$('rc-detail').textContent = 'The same recorded movement, cloth and High effects are used in both versions. Character pictures are fully prepared before measurement. Your saves are isolated.';
$('rc-back').href = './?post=webgl&v=7'; $('rc-back').textContent = 'BACK TO GAME';
$('rc-status').textContent = 'Ready · prepared-cache comparison v2 · High'; start.disabled = false;
start.onclick = async () => {
  if (running) return;
  if (innerWidth < innerHeight) { $('rc-status').textContent = 'Turn your phone sideways before starting.'; return; }
  running = true; interrupted = ''; viewport = ''; start.disabled = true; $('rc-copy').hidden = true; $('rc-report').hidden = true;
  report = { report: 'shadow-duel-prepared-check-v2', build: 'prepared-independent-measurement-v2', complete: false,
    note: 'rAF cadence, not physical presented FPS or GPU timing. Both paths render one finite moving 120 Hz sequence. Prepared stages forbid new parts, evictions and miss fallbacks. Short ABBA comparison, not sustained combat.',
    device: { userAgent: navigator.userAgent, dpr: devicePixelRatio, cores: navigator.hardwareConcurrency || null, memoryGB: navigator.deviceMemory || null },
    quality: { preference: 'high', fixedResolution: true }, stages: [], storage: 'isolated memory only', network: 'game services disabled', audio: 'suspended',
    gpuTiming: 'unavailable', physicalPresentedFrames: 'unavailable' };
  try {
    await prepare(); report.canvas = { width: cv.width, height: cv.height, cssWidth: cv.clientWidth, cssHeight: cv.clientHeight };
    report.contextAttributes = cv.getContext('2d').getContextAttributes?.() || null;
    report.scene = { arena: 'rain', fighters: g.F.map(f => f.ch.id), combat: 'not simulated', post: 'webgl', fixedCamera: true };
    panel.hidden = true; strip.hidden = false;
    for (const stage of [['simple', 'Simple canvas · start'], ['full', 'Original High · A1'], ['parts', 'Prepared High · B1'], ['parts', 'Prepared High · B2'], ['full', 'Original High · A2'], ['simple', 'Simple canvas · end']]) report.stages.push(await measure(...stage));
    report.controls = assessControls(report.stages);
    if (report.stages.some(s => s.frames < 30)) {
      report.controls.warnings.push('At least one stage recorded fewer than 30 intervals; the comparison has too few samples.');
      report.controls.stableControls = false;
    }
    report.complete = true;
    $('rc-status').textContent = 'Complete. Copy the report and send it back.';
  } catch (error) { report.error = error.message; $('rc-status').textContent = `Test stopped: ${error.message}. Copy the report.`; }
  finally {
    freeze(false); panel.hidden = false; strip.hidden = true; start.disabled = false; running = false; start.textContent = 'RUN AGAIN';
    $('rc-report').value = JSON.stringify(report); $('rc-report').hidden = false; $('rc-copy').hidden = false;
  }
};
$('rc-copy').onclick = async () => {
  try { await navigator.clipboard.writeText($('rc-report').value); $('rc-copy').textContent = 'COPIED'; }
  catch { $('rc-report').focus(); $('rc-report').select(); $('rc-status').textContent = 'Select and copy the report below.'; }
};
