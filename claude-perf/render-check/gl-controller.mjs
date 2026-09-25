// render-check.html?check=gl — Canvas High against the WebGL2 fight renderer (see gl-check.mjs for the stages).
// Posed scene: the same controlled scene as the step-1 check (High, rain, Kuro / Yuki, fixed camera, seeded rain).
// Live fight: the same match (seeded, AI against AI, full ki every 2.5 s so specials fire) restarted for every stage
// and advanced by exactly 1/60 s per drawn frame, so both renderers draw the same frames. Audio suspended, isolated
// storage, game services off, 60 fps cap as on phones. The report holds summaries only (a few KB).
import { MeasurementWindow } from './measurement-window.mjs?v=prepared2';
import { GLCHECK, VARIANTS, glStages, stageSummary, compare, warnings } from './gl-check.mjs?v=gl-1';
const boot = window.__renderCheckBoot, N = window.ND, g = N?.game;
const $ = (id) => document.getElementById(id), cv = $('cv'), panel = $('rc-panel'), strip = $('rc-strip'), start = $('rc-start');
if (!boot.ok || !g) throw Error('The isolated game could not start.');
window.requestAnimationFrame = boot.raf;
document.documentElement.classList.add('rc-isolated'); $('app').inert = true;
await document.fonts.ready;
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
function quiet() {
  N.gfx.setQuality('high'); N.gfx.ladderFrame = () => {};
  N.audio.paramMuted = true; N.audio.init(); N.music.init(); N.audio.setEnabled(false); N.music.setEnabled(false);
  clearInterval(N.music.timer); N.music.timer = null;
}
async function startMatch() {
  // every stage starts from the same state: clocks, camera and effects left by the previous stage are reset
  N.simClock = 0; N.scene.t = 0; Object.assign(N.cam, { x: 0, y: -118, z: 1, shk: 0, shx: 0, shy: 0 });
  N.fx.clear(); N.specialFx?.clear?.(); N.cine?.clear?.(); g.acc = 0; g.clock = 0;
  boot.resetRandom(); quiet(); await N.audio.ctx?.suspend();
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
function liveFrame() {
  if (liveN % 150 === 0) for (const f of g.F) f.ki = 100; // specials
  for (const f of g.F) if (f.hp < f.maxHp * 0.3) f.hp = f.maxHp; // keep the round going (same for both renderers)
  liveN++;
  g.advance(1 / 60); g.hud(); g.render();
}
function apply(v) {
  g.glowMode = 'blur'; g.sceneMode = 'layer'; g.grainMode = 'on'; g.postMode = 'canvas';
  g.rendererMode = v.renderer === 'gl' ? 'gl' : 'canvas';
  if (v.renderer === 'gl') g.glRenderer().setSamples(v.msaa);
}
async function measure(kind, index) {
  const simple = kind === 'simple', v = VARIANTS[kind];
  const label = simple ? 'Simple animated canvas' : v.label;
  if (!simple && v.renderer === 'gl' && !glReady()) return { kind, label, available: false };
  strip.textContent = `${index + 1}/${glStages.length} · ${label} · warming up`;
  if (!simple) {
    apply(v);
    if (v.scene === 'live') { await startLive(); liveN = 0; boot.resetRandom(23); }
    else { if (g.ais.length || g.phase !== 'fight') await prepareScene(); boot.resetRandom(); poseScene(0); g.hud(); g.render(); }
  }
  const st0 = g.glStatus();
  const clock = new MeasurementWindow(GLCHECK.warmupMs, simple ? GLCHECK.simpleMs : GLCHECK.sampleMs);
  const pacer = !simple ? N.gfx.makePacer() : null, frames = [];
  let previousCpu = 0, callbacks = 0, skips = 0, sampling = false, gl0 = null;
  try {
    for (;;) {
      const now = await nextFrame(); active();
      if (sampling) callbacks++;
      if (pacer && !pacer.due(now)) { if (sampling) skips++; continue; } // the game skips this callback too
      clock.advance(now);
      if (clock.recordPrevious) frames.push({ gap: clock.intervalMs, cpu: previousCpu });
      if (clock.done) break;
      if (clock.startsSample) { sampling = true; callbacks = 0; skips = 0; gl0 = g.glStatus(); strip.textContent = `${index + 1}/${glStages.length} · ${label} · measuring`; }
      const before = performance.now();
      if (simple) {
        const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
        x.fillStyle = '#0c0d15'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = '#d8b36b'; x.fillRect((clock.elapsedMs * 0.3) % cv.width, cv.height * 0.45, 40, 40);
      } else if (v.scene === 'live') liveFrame();
      else { poseScene(clock.elapsedMs); g.hud(); g.render(); }
      previousCpu = performance.now() - before;
    }
    const s1 = g.glStatus(), extra = { label, pace: pacer ? pacer.stat() : null, timing: clock.snapshot() };
    if (!simple) {
      extra.renderer = g.renderVersion;
      if (v.renderer === 'gl') {
        const a = gl0 || st0, glr = g.glRenderer();
        extra.glFrames = s1.frames - a.frames; extra.glFallbacks = s1.fallbacks - a.fallbacks; extra.samples = s1.samples;
        if (s1.lastReason) extra.glLastReason = s1.lastReason;
        const L = glr.last;
        if (L) extra.glFrame = { draws: L.draws, stencilFills: L.stencilFills, clips: L.clips, vertices: L.vertices, passes: L.passes + 2, uploads: L.uploads };
      }
      if (v.scene === 'live') extra.liveFrames = liveN;
    }
    return stageSummary(kind, frames, callbacks, skips, extra);
  } catch (error) {
    report.failedStage = { kind, label, timing: clock.snapshot(), frames: frames.length };
    throw error;
  }
}
$('rc-card').querySelector('h1').textContent = 'Shadow Duel · WebGL2 speed test';
$('rc-help').textContent = 'Automatic test of about 55 seconds. Hold the phone sideways and keep this tab visible. No fighting required.';
$('rc-detail').textContent = 'The current High drawing and the new WebGL2 drawing take turns: first on a still scene, then on a computer-played fight. The picture should look the same in every stage. Your game settings and progress are not changed.';
$('rc-back').href = './?renderer=gl'; $('rc-back').textContent = 'PLAY WITH WEBGL2';
$('rc-copy').textContent = 'COPY REPORT';
$('rc-status').textContent = `Ready · WebGL2 check v1 · High · rain · Kuro / Yuki${glReady() ? '' : ' · WebGL2 not available on this browser (Canvas stages only)'}`;
start.disabled = false;
start.onclick = async () => {
  if (running) return;
  if (innerWidth < innerHeight) { $('rc-status').textContent = 'Turn your phone sideways before starting.'; return; }
  running = true; interrupted = ''; viewport = ''; start.disabled = true; $('rc-copy').hidden = true; $('rc-report').hidden = true;
  report = { report: GLCHECK.report, build: GLCHECK.build, complete: false,
    note: 'Drawn frames per second after the 60 fps cap (rAF cadence), not GPU time. Posed = still scene, live = AI fight advanced 1/60 s per drawn frame (same frames for both renderers).',
    device: { userAgent: navigator.userAgent, dpr: devicePixelRatio, cores: navigator.hardwareConcurrency || null, memoryGB: navigator.deviceMemory || null },
    warmupMs: GLCHECK.warmupMs, sampleMs: GLCHECK.sampleMs, stages: [] };
  $('rc-status').textContent = 'Preparing the scene…';
  try {
    await prepareScene();
    report.canvas = { width: cv.width, height: cv.height, cssWidth: cv.clientWidth, cssHeight: cv.clientHeight };
    report.quality = { tier: N.gfx.tier, fixedResolution: true };
    report.scene = { arena: 'rain', fighters: g.F.map((f) => f.ch.id) };
    report.gl = g.glInfo();
    panel.hidden = true; strip.hidden = false;
    for (let i = 0; i < glStages.length; i++) report.stages.push(await measure(glStages[i], i));
    report.gl = g.glInfo() || report.gl;
    report.glStatus = g.glStatus();
    report.compare = compare(report.stages);
    report.warnings = warnings(report.stages);
    report.complete = true;
    $('rc-status').textContent = 'Complete. Copy the report and send it back.';
  } catch (error) { report.error = error.message; $('rc-status').textContent = `Test stopped: ${error.message}. Copy the report.`; }
  finally {
    try { g.ais = []; apply(VARIANTS.canvas); if (rain.length) { await prepareScene(); poseScene(0); g.hud(); g.render(); } } catch { /* keep the original error */ }
    panel.hidden = false; strip.hidden = true; start.disabled = false; running = false; start.textContent = 'RUN AGAIN';
    $('rc-report').value = JSON.stringify(report); $('rc-report').hidden = false; $('rc-copy').hidden = false;
  }
};
$('rc-copy').onclick = async () => {
  try { await navigator.clipboard.writeText($('rc-report').value); $('rc-copy').textContent = 'COPIED'; }
  catch { $('rc-report').focus(); $('rc-report').select(); $('rc-status').textContent = 'Select and copy the report below.'; }
};
// Local audit hook (never used by the game page)
window.__glCheck = { apply, poseScene, prepareScene, startLive, liveFrame, VARIANTS };
