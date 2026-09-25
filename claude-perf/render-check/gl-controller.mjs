// render-check.html?check=gl — the WebGL2 fight renderer on the phone (see gl-check.mjs for the stages).
// First a 15-second WebGL2 live fight while the phone is cool, then each graphics tier uncapped (frames as fast as
// the display allows), then Canvas High against WebGL2 High on the posed scene and the live fight.
// Posed scene: the same controlled scene as the step-1 check (High, rain, Kuro / Yuki, fixed camera, seeded rain).
// Live fight: the same match (seeded, AI against AI, full ki every 2.5 s so specials fire) restarted for every stage
// and advanced by exactly 1/60 s per drawn frame, so both renderers draw the same frames. Audio suspended, isolated
// storage, game services off. WebGL2 stages record every frame's parts (simulation, drawing record, uploads, GPU
// time when the browser offers it) and explain each late frame (> 25 ms). The report holds summaries only (< 12 KB).
// &play=1: a 60-second WebGL2 live fight with a small fps / p95 line on top, for the eye (&tier=medium|low,
// &fps=max for no cap).
import { MeasurementWindow } from './measurement-window.mjs?v=prepared2';
import { GLCHECK, VARIANTS, glStages, stageSummary, compare, warnings, breakdown, spikes, playStats } from './gl-check.mjs?v=gl-2';
const boot = window.__renderCheckBoot, N = window.ND, g = N?.game;
const $ = (id) => document.getElementById(id), cv = $('cv'), panel = $('rc-panel'), strip = $('rc-strip'), start = $('rc-start');
if (!boot.ok || !g) throw Error('The isolated game could not start.');
window.requestAnimationFrame = boot.raf;
document.documentElement.classList.add('rc-isolated'); $('app').inert = true;
await document.fonts.ready;
const QS = new URLSearchParams(location.search);
const nextFrame = () => new Promise((resolve) => boot.raf(resolve));
const dimensions = () => [innerWidth, innerHeight, devicePixelRatio, cv.width, cv.height].join('/');
let running = false, interrupted = '', viewport = '', report = null, rain = [];
document.addEventListener('visibilitychange', () => { if (running && document.hidden) interrupted = 'The tab was hidden'; });
window.addEventListener('resize', () => { if (running) interrupted = 'The screen size or orientation changed'; });
document.addEventListener('keydown', (e) => { if (!running) return; e.preventDefault(); e.stopImmediatePropagation(); if (e.code === 'Escape') interrupted = 'Test stopped'; }, true);
function active() {
  if (interrupted || document.hidden) throw Error(interrupted || 'The tab is hidden');
  if (viewport && viewport !== dimensions()) throw Error('The drawing resolution changed');
  if (boot.errors.length) throw Error(boot.errors.join('; '));
}
const glReady = () => !!g.glRenderer?.() && g.glStatus().ready;
let stageTier = 'high';
function quiet() {
  if (N.gfx.tier !== stageTier || N.gfx.pref !== stageTier) N.gfx.setQuality(stageTier);
  N.gfx.ladderFrame = () => {};
  N.audio.paramMuted = true; N.audio.init(); N.music.init(); N.audio.setEnabled(false); N.music.setEnabled(false);
  clearInterval(N.music.timer); N.music.timer = null;
}
async function startMatch() {
  // every stage starts from the same state: clocks, camera and effects left by the previous stage are reset
  N.simClock = 0; N.scene.t = 0; Object.assign(N.cam, { x: 0, y: -118, z: 1, shk: 0, shx: 0, shy: 0 });
  N.fx.clear(); N.specialFx?.clear?.(); N.cine?.clear?.(); g.acc = 0; g.clock = 0;
  boot.resetRandom(); quiet(); await N.audio.ctx?.suspend();
  if (viewport) viewport = dimensions(); // a tier change resizes the canvas on purpose
  $('first').hidden = true; g.start('cpu', { c1: 2, c2: 3, arena: 'rain' });
  while (g.preparing) { await nextFrame(); active(); g._frame(1000 / 60); }
  g.phase = 'fight'; g.pt = 0; g.bars = 0; g.dim = 0; g.paused = false;
  g.F.forEach((f) => { f.locked = false; f.inv = 0; }); // the skipped round intro would have released them
  $('pauseBtn').hidden = true;
}
async function prepareScene() {
  await startMatch(); g.ais = [];
  g.F.forEach((f) => { f.locked = false; f.inv = 0; });
  Object.assign(N.cam, { x: 0, y: -118, z: 1.28, shx: 0, shy: 0 });
  N.scene.splashes.length = 0;
  rain = N.scene.parts.map((p) => ({ ...p }));
  g.syncTouch(); viewport = dimensions();
}
function poseScene(elapsed) {
  const t = elapsed / 1000;
  N.scene.t = t; N.scene.flashL = 0; N.scene.bolt = null;
  for (let i = 0; i < N.scene.parts.length; i++) {
    const p = N.scene.parts[i], initial = rain[i];
    p.y = -850 + ((initial.y + 850 + initial.vy * t) % 880 + 880) % 880;
    p.x = -1500 + ((initial.x + 1500 + initial.vx * t) % 3000 + 3000) % 3000;
  }
  for (const f of g.F) {
    const u = (1 - Math.cos(t * Math.PI * 2 + f.id * Math.PI)) / 2;
    f.x = (f.id ? 170 : -170) + Math.sin(t * 2) * 18; f.dir = f.id ? -1 : 1;
    N.pose.lerp(f.P.stance || N.POSES.stance, f.P.guard || N.POSES.guard, u, f.pose);
    N.solve(f.pose, f.x, 0, f.dir, f.j, f.wpn);
    f.posture = Math.round(u * 45);
  }
  g.timer = 60 - (t % 60); g.clock = t; N.simClock = t;
}
async function startLive() {
  await startMatch();
  g.ais = [new N.AI(g.F[0], 2), new N.AI(g.F[1], 2)];
  g.syncTouch();
}
let liveN = 0;
// one live frame; row (optional) receives the times of its parts
function liveFrame(row) {
  if (liveN % 150 === 0) for (const f of g.F) f.ki = 100; // specials
  for (const f of g.F) if (f.hp < f.maxHp * 0.3) f.hp = f.maxHp; // keep the round going (same for both renderers)
  liveN++;
  const t0 = performance.now();
  g.advance(1 / 60);
  const t1 = performance.now();
  g.hud(); g.render();
  if (row) { row.sim = t1 - t0; row.render = performance.now() - t1; }
}
function apply(v) {
  g.glowMode = 'blur'; g.sceneMode = 'layer'; g.grainMode = 'on'; g.postMode = 'canvas';
  g.rendererMode = v.renderer === 'gl' ? 'gl' : 'canvas';
  if (v.renderer === 'gl') g.glRenderer().setSamples(v.msaa);
}
// the WebGL2 frame just drawn → row (profiling data of gl2d / gl-render)
function glRow(row, glr) {
  const P = glr.prof;
  if (g.renderVersion !== 'gl-v1' || !P) { row.fb = 1; row.cpu = row.sim + row.render; return; }
  row.end = P.endMs; row.rec = row.render - P.endMs;
  row.texts = P.texts; row.textMs = P.textMs; row.imgs = P.imgUploads; row.imgMs = P.imgMs; row.ramps = P.ramps;
  if (P.imgWhy.length) row.why = P.imgWhy[0];
  if (P.tessCalls) row.tess = P.tessMs;
  row.id = P.frameId;
}
// long animation frames (main thread busy > 50 ms): [start, duration]; none where the browser lacks the API
function watchLongFrames() {
  const list = [];
  let po = null;
  for (const type of ['long-animation-frame', 'longtask']) {
    try { po = new PerformanceObserver((l) => { for (const e of l.getEntries()) list.push([e.startTime, e.duration]); }); po.observe({ type, buffered: false }); list.type = type; break; }
    catch { po = null; }
  }
  return { list, stop() { try { po?.takeRecords?.().forEach((e) => list.push([e.startTime, e.duration])); po?.disconnect(); } catch { /* none */ } } };
}
async function measure(kind, index) {
  const simple = kind === 'simple', v = VARIANTS[kind];
  const label = simple ? 'Simple animated canvas' : v.label;
  if (!simple && v.renderer === 'gl' && !glReady()) return { kind, label, available: false };
  strip.textContent = `${index + 1}/${glStages.length} · ${label} · warming up`;
  stageTier = (!simple && v.tier) || 'high';
  if (!simple) {
    apply(v);
    if (v.scene === 'live') { await startLive(); liveN = 0; boot.resetRandom(23); }
    else { if (g.ais.length || g.phase !== 'fight' || N.gfx.tier !== 'high') await prepareScene(); boot.resetRandom(); poseScene(0); g.hud(); g.render(); }
  }
  const glStage = !simple && v.renderer === 'gl', glr = g.glRenderer?.();
  if (glStage) glr.profile(true, { tess: !!v.profile });
  const st0 = g.glStatus();
  const clock = new MeasurementWindow(GLCHECK.warmupMs, simple ? GLCHECK.simpleMs : GLCHECK[v.ms || 'sampleMs']);
  const pacer = !simple ? N.gfx.makePacer(v.fps === 0 ? 0 : 60) : null, frames = [], rows = [], byId = new Map();
  let previousCpu = 0, callbacks = 0, skips = 0, sampling = false, gl0 = null, prevRow = null, prevT = 0, longFrames = null;
  try {
    for (;;) {
      const now = await nextFrame(); active();
      if (sampling) callbacks++;
      if (pacer && !pacer.due(now)) { if (sampling) skips++; continue; } // the game skips this callback too
      clock.advance(now);
      if (clock.recordPrevious) {
        frames.push({ gap: clock.intervalMs, cpu: previousCpu });
        if (prevRow) { prevRow.gap = clock.intervalMs; prevRow.t = prevT; rows.push(prevRow); }
      }
      if (clock.done) break;
      if (clock.startsSample) {
        sampling = true; callbacks = 0; skips = 0; gl0 = g.glStatus(); strip.textContent = `${index + 1}/${glStages.length} · ${label} · measuring`;
        if (glStage) { glr.gpuDrain(); longFrames = watchLongFrames(); }
      }
      const before = performance.now(), row = glStage && sampling ? {} : null;
      if (simple) {
        const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
        x.fillStyle = '#0c0d15'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = '#d8b36b'; x.fillRect((clock.elapsedMs * 0.3) % cv.width, cv.height * 0.45, 40, 40);
      } else if (v.scene === 'live') liveFrame(row);
      else { poseScene(clock.elapsedMs); g.hud(); g.render(); }
      previousCpu = performance.now() - before;
      if (row) {
        if (v.scene !== 'live') { row.sim = 0; row.render = previousCpu; }
        glRow(row, glr); row.cpu = previousCpu;
        if (row.id) byId.set(row.id, row);
        for (const d of glr.gpuDrain()) { const r = byId.get(d.id); if (r) { if (d.gpuMs !== undefined) r.gpuMs = d.gpuMs; if (d.lag !== undefined) r.lag = d.lag; } }
      }
      prevRow = row; prevT = now;
    }
    const s1 = g.glStatus(), extra = { warmupMaxGapMs: Math.round(clock.snapshot().warmupMaxGapMs * 10) / 10 };
    if (pacer) { const ps = pacer.stat(); extra.refreshMs = ps.periodMs; extra.cap = ps.target; }
    if (!simple) {
      if (!glStage) extra.renderer = g.renderVersion;
      if (v.tier) { extra.tier = stageTier; extra.canvas = [cv.width, cv.height]; }
      if (v.renderer === 'gl') {
        const a = gl0 || st0;
        extra.glFrames = s1.frames - a.frames; extra.glFallbacks = s1.fallbacks - a.fallbacks; extra.samples = s1.samples;
        if (s1.lastReason) extra.glLastReason = s1.lastReason;
        const L = glr.last;
        if (L && (kind === 'liveGlLong' || v.tier)) extra.glFrame = { draws: L.draws, stencilFills: L.stencilFills, clips: L.clips, vertices: L.vertices, passes: L.passes + 2 };
      }
      if (v.scene === 'live') extra.liveFrames = liveN;
    }
    if (glStage && rows.length) {
      await nextFrame(); for (const d of glr.gpuDrain()) { const r = byId.get(d.id); if (r) { if (d.gpuMs !== undefined) r.gpuMs = d.gpuMs; if (d.lag !== undefined) r.lag = d.lag; } }
      if (longFrames) {
        longFrames.stop();
        for (const r of rows) for (const [s, d] of longFrames.list) { const o = Math.min(r.t + r.gap, s + d) - Math.max(r.t, s); if (o > 0) r.loaf = (r.loaf || 0) + o; }
        extra.longFrames = longFrames.list.length;
        report.longFrameApi = longFrames.list.type || 'none';
      }
      extra.gpuTimer = glr.gpuTimer;
      extra.parts = breakdown(rows);
      extra.spikes = spikes(rows, kind === 'liveGlLong' ? 5 : 2);
    }
    return stageSummary(kind, frames, callbacks, skips, extra);
  } catch (error) {
    report.failedStage = { kind, label, timing: clock.snapshot(), frames: frames.length };
    throw error;
  } finally {
    if (glStage) glr.profile(false);
  }
}
const QUIET_BACK = () => { stageTier = 'high'; };
$('rc-card').querySelector('h1').textContent = 'Shadow Duel · WebGL2 speed test';
$('rc-help').textContent = 'Automatic test of about 90 seconds. Hold the phone sideways and keep this tab visible. No fighting required.';
$('rc-detail').textContent = 'First the new WebGL2 drawing runs alone: a 15-second computer-played fight, then High, Medium and Low as fast as your screen allows. Then the current High drawing and WebGL2 take turns. The picture should look the same in every stage. Your game settings and progress are not changed.';
$('rc-back').href = './?renderer=gl'; $('rc-back').textContent = 'PLAY WITH WEBGL2';
$('rc-copy').textContent = 'COPY REPORT';
// the 60-second eye test
const playA = document.createElement('a');
playA.id = 'rc-play'; playA.href = '?check=gl&play=1'; playA.textContent = '60 s PLAY TEST';
$('rc-back').after(playA);
$('rc-status').textContent = `Ready · WebGL2 check v2 · rain · Kuro / Yuki${glReady() ? '' : ' · WebGL2 not available on this browser (Canvas stages only)'}`;
start.disabled = false;
start.onclick = async () => {
  if (running) return;
  if (innerWidth < innerHeight) { $('rc-status').textContent = 'Turn your phone sideways before starting.'; return; }
  running = true; interrupted = ''; viewport = ''; start.disabled = true; $('rc-copy').hidden = true; $('rc-report').hidden = true;
  report = { report: GLCHECK.report, build: GLCHECK.build, complete: false,
    note: 'fps = drawn frames/s (60 cap; cap 0 = uncapped). parts: per-frame ms, sim / rec (drawing record) / end (uploads + GL + post). spikes: frames > 25 ms, likely cause.',
    device: { userAgent: navigator.userAgent, dpr: devicePixelRatio, cores: navigator.hardwareConcurrency || null, memoryGB: navigator.deviceMemory || null },
    warmupMs: GLCHECK.warmupMs, stages: [] };
  $('rc-status').textContent = 'Preparing the scene…';
  try {
    await prepareScene();
    report.canvas = { width: cv.width, height: cv.height, cssWidth: cv.clientWidth, cssHeight: cv.clientHeight };
    report.scene = { arena: 'rain', fighters: g.F.map((f) => f.ch.id) };
    const info = g.glInfo();
    if (info) report.gl = { renderer: info.renderer, version: info.version, samples: info.samples, maxSamples: info.maxSamples, layerAtlas: info.layerAtlas, textAtlas: info.textAtlas };
    panel.hidden = true; strip.hidden = false;
    for (let i = 0; i < glStages.length; i++) report.stages.push(await measure(glStages[i], i));
    report.glStatus = g.glStatus();
    report.compare = compare(report.stages);
    report.warnings = warnings(report.stages);
    report.complete = true;
    $('rc-status').textContent = 'Complete. Copy the report and send it back.';
  } catch (error) { report.error = error.message; $('rc-status').textContent = `Test stopped: ${error.message}. Copy the report.`; }
  finally {
    try { QUIET_BACK(); g.ais = []; apply(VARIANTS.canvas); if (rain.length) { viewport = ''; await prepareScene(); poseScene(0); g.hud(); g.render(); } } catch { /* keep the original error */ }
    panel.hidden = false; strip.hidden = true; start.disabled = false; running = false; start.textContent = 'RUN AGAIN';
    $('rc-report').value = JSON.stringify(report); $('rc-report').hidden = false; $('rc-copy').hidden = false;
  }
};
$('rc-copy').onclick = async () => {
  try { await navigator.clipboard.writeText($('rc-report').value); $('rc-copy').textContent = 'COPIED'; }
  catch { $('rc-report').focus(); $('rc-report').select(); $('rc-status').textContent = 'Select and copy the report below.'; }
};

// ---------------------------------------------------------------- 60-second play mode (&play=1)
async function play() {
  const tier = ['high', 'medium', 'low'].includes(QS.get('tier')) ? QS.get('tier') : 'high';
  const fps = QS.get('fps') === 'max' ? 0 : 60;
  if (!glReady()) { $('rc-status').textContent = 'WebGL2 is not available on this browser.'; return; }
  running = true; interrupted = ''; viewport = '';
  stageTier = tier; apply(VARIANTS.liveGl);
  panel.hidden = true; strip.hidden = false; strip.style.fontSize = '13px';
  strip.textContent = 'Preparing…';
  await startLive(); liveN = 0; boot.resetRandom(23); viewport = dimensions();
  const pacer = N.gfx.makePacer(fps), gaps = [];
  let t0 = 0, last = 0, shown = 0, result = '';
  try {
    for (;;) {
      const now = await nextFrame(); active();
      if (!pacer.due(now)) continue;
      if (!t0) t0 = now; else gaps.push(now - last);
      last = now;
      if (now - t0 >= GLCHECK.playMs) break;
      g.timer = 60; // the round clock never runs out
      liveFrame(null);
      if (now - shown > 500) {
        shown = now;
        const s = playStats(gaps, now - t0), st = g.glStatus();
        strip.textContent = `WebGL2 ${tier} · ${s.fps} fps · p95 ${s.p95} ms · >33 ms: ${s.over33} · ${s.seconds}/${GLCHECK.playMs / 1000} s${st.fallbacks ? ' · Canvas frames: ' + st.fallbacks : ''}`;
      }
    }
    const all = [...gaps].sort((a, b) => a - b), p = (q) => all[Math.min(all.length - 1, Math.ceil(q * all.length) - 1)];
    result = `Done · ${tier} · ${(gaps.length * 1000 / gaps.reduce((a, b) => a + b, 0)).toFixed(1)} fps · p50 ${p(0.5).toFixed(1)} ms · p95 ${p(0.95).toFixed(1)} ms · p99 ${p(0.99).toFixed(1)} ms · frames > 33 ms: ${gaps.filter((x) => x > 33.4).length} of ${gaps.length}`;
  } catch (error) { result = `Stopped: ${error.message}`; }
  finally {
    running = false; stageTier = 'high';
    strip.hidden = true; panel.hidden = false;
    $('rc-status').textContent = result;
    start.textContent = 'PLAY AGAIN'; start.disabled = false; start.onclick = () => location.reload();
  }
}
if (QS.get('play') === '1') {
  $('rc-card').querySelector('h1').textContent = 'Shadow Duel · WebGL2 play test';
  $('rc-help').textContent = 'A 60-second computer-played fight drawn with WebGL2. The line at the top shows frames per second and the slowest frames. Keep this tab visible.';
  $('rc-detail').textContent = 'Add &tier=medium or &tier=low to the address for the other graphics levels, &fps=max for no frame cap.';
  playA.href = '?check=gl'; playA.textContent = 'FULL SPEED TEST';
  play();
}
// Local audit hook (never used by the game page)
window.__glCheck = { apply, poseScene, prepareScene, startLive, liveFrame, VARIANTS, measure, setTier: (t) => { stageTier = t; } };
