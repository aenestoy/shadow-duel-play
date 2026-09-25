// render-check.html?check=step1&post=present — Step 1 phone comparison page (see step1.mjs for the variants).
// Same controlled scene as the earlier render checks: High, rain, Kuro / Yuki in animated stance/guard poses, fixed
// camera, seeded rain, no combat, audio suspended, isolated storage, game services off.
import { MeasurementWindow } from './measurement-window.mjs?v=prepared2';
import { STEP1, VARIANTS, step1Stages, stageSummary, compare, warnings } from './step1.mjs?v=step1-1';
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
const presentReady = () => g.postGpuStatus().available && g.postMode !== 'webgl' && !!document.querySelector('#cv + canvas');
async function prepareScene() {
  boot.resetRandom(); N.gfx.setQuality('high'); N.gfx.ladderFrame = () => {};
  N.audio.paramMuted = true; N.audio.init(); N.music.init(); N.audio.setEnabled(false); N.music.setEnabled(false);
  clearInterval(N.music.timer); N.music.timer = null; await N.audio.ctx?.suspend();
  $('first').hidden = true; g.start('cpu', { c1: 2, c2: 3, arena: 'rain' }); g.ais = [];
  while (g.preparing) { await nextFrame(); active(); g._frame(1000 / 60); }
  g.phase = 'fight'; g.pt = 0; g.bars = 0; g.dim = 0; g.paused = false;
  g.F.forEach((f) => { f.locked = false; f.inv = 0; });
  Object.assign(N.cam, { x: 0, y: -118, z: 1.28, shx: 0, shy: 0 });
  N.scene.splashes.length = 0;
  rain = N.scene.parts.map((p) => ({ ...p }));
  g.syncTouch(); $('pauseBtn').hidden = true; viewport = dimensions();
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
function apply(v) {
  g.glowMode = v.glowMode; g.sceneMode = v.sceneMode; g.grainMode = v.grainMode;
  g.postMode = v.post === 'present' ? 'present' : 'canvas';
}
async function measure(kind, index) {
  const simple = kind === 'simple', v = VARIANTS[kind];
  const label = simple ? 'Simple animated canvas' : v.label;
  if (!simple && v.post === 'present' && !presentReady()) return { kind, label, available: false };
  strip.textContent = `${index + 1}/${step1Stages.length} · ${label} · warming up`;
  if (!simple) { apply(v); boot.resetRandom(); poseScene(0); g.hud(); g.render(); }
  const clock = new MeasurementWindow(STEP1.warmupMs, simple ? STEP1.simpleMs : STEP1.sampleMs);
  const pacer = !simple && v.cap ? N.gfx.makePacer() : null, frames = [];
  let previousCpu = 0, callbacks = 0, skips = 0, sampling = false;
  try {
    for (;;) {
      const now = await nextFrame(); active();
      if (sampling) callbacks++;
      if (pacer && !pacer.due(now)) { if (sampling) skips++; continue; } // the game skips this callback too
      clock.advance(now);
      if (clock.recordPrevious) frames.push({ gap: clock.intervalMs, cpu: previousCpu });
      if (clock.done) break;
      if (clock.startsSample) { sampling = true; callbacks = 0; skips = 0; strip.textContent = `${index + 1}/${step1Stages.length} · ${label} · measuring`; }
      const before = performance.now();
      if (simple) {
        const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
        x.fillStyle = '#0c0d15'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = '#d8b36b'; x.fillRect((clock.elapsedMs * 0.3) % cv.width, cv.height * 0.45, 40, 40);
      } else { poseScene(clock.elapsedMs); g.hud(); g.render(); }
      previousCpu = performance.now() - before;
    }
    return stageSummary(kind, frames, callbacks, skips, { label, ...(simple ? {} : { renderer: g.renderVersion, pace: pacer ? pacer.stat() : null }), timing: clock.snapshot() });
  } catch (error) {
    report.failedStage = { kind, label, timing: clock.snapshot(), frames: frames.length };
    throw error;
  }
}
$('rc-card').querySelector('h1').textContent = 'Shadow Duel · Step 1 speed test';
$('rc-help').textContent = `Automatic test of about 65 seconds. Hold the phone sideways and keep this tab visible. No fighting required.`;
$('rc-detail').textContent = 'Old and new High drawing take turns on the same scene. The picture looks the same in every stage except one short stage without film grain. Your game settings and progress are not changed.';
$('rc-back').href = './?perf=1&compact=1&flush=0&v=phone-perf-1'; $('rc-back').textContent = 'BACK TO GAME';
$('rc-copy').textContent = 'COPY REPORT';
$('rc-status').textContent = `Ready · step 1 v1 · High · rain · Kuro / Yuki${presentReady() ? '' : ' · WebGL stage off (add &post=present)'}`;
start.disabled = false;
start.onclick = async () => {
  if (running) return;
  if (innerWidth < innerHeight) { $('rc-status').textContent = 'Turn your phone sideways before starting.'; return; }
  running = true; interrupted = ''; viewport = ''; start.disabled = true; $('rc-copy').hidden = true; $('rc-report').hidden = true;
  report = { report: STEP1.report, build: STEP1.build, complete: false,
    note: 'Drawn frames per second (rAF cadence after the 60 fps cap), not physical presented frames or GPU time. Mirrored order; compare variants with the two old runs. noGrain changes the picture (diagnosis only).',
    device: { userAgent: navigator.userAgent, dpr: devicePixelRatio, cores: navigator.hardwareConcurrency || null, memoryGB: navigator.deviceMemory || null },
    warmupMs: STEP1.warmupMs, sampleMs: STEP1.sampleMs, stages: [] };
  $('rc-status').textContent = 'Preparing the scene…';
  try {
    await prepareScene();
    report.canvas = { width: cv.width, height: cv.height, cssWidth: cv.clientWidth, cssHeight: cv.clientHeight };
    report.quality = { tier: N.gfx.tier, fixedResolution: true };
    report.scene = { arena: 'rain', fighters: g.F.map((f) => f.ch.id), poses: 'animated stance / guard', combat: 'not simulated' };
    report.gpu = g.postGpuStatus();
    panel.hidden = true; strip.hidden = false;
    for (let i = 0; i < step1Stages.length; i++) report.stages.push(await measure(step1Stages[i], i));
    report.compare = compare(report.stages);
    report.warnings = warnings(report.stages);
    report.complete = true;
    $('rc-status').textContent = 'Complete. Copy the report and send it back.';
  } catch (error) { report.error = error.message; $('rc-status').textContent = `Test stopped: ${error.message}. Copy the report.`; }
  finally {
    apply(VARIANTS.new); try { if (rain.length) { poseScene(0); g.hud(); g.render(); } } catch { /* keep the original error */ }
    panel.hidden = false; strip.hidden = true; start.disabled = false; running = false; start.textContent = 'RUN AGAIN';
    $('rc-report').value = JSON.stringify(report); $('rc-report').hidden = false; $('rc-copy').hidden = false;
  }
};
$('rc-copy').onclick = async () => {
  try { await navigator.clipboard.writeText($('rc-report').value); $('rc-copy').textContent = 'COPIED'; }
  catch { $('rc-report').focus(); $('rc-report').select(); $('rc-status').textContent = 'Select and copy the report below.'; }
};
// Local audit hook (never used by the game page)
window.__step1Check = { apply, poseScene, VARIANTS };
