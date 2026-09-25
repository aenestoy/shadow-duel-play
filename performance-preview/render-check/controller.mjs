import { stages, warmupMs, sampleMs, summarize, measuredInterval, replaceMethod, restore } from './metrics.mjs';
const boot = window.__renderCheckBoot, N = window.ND, g = N?.game;
const $ = id => document.getElementById(id), cv = $('cv');
const panel = $('rc-panel'), start = $('rc-start'), status = $('rc-status'), strip = $('rc-strip');
const root = document.documentElement, nextFrame = () => new Promise(resolve => boot.raf(resolve));
if (!boot.ok || !g) throw Error('The isolated game could not start.');
// The game's initial scheduling call has been suppressed. Other UI/browser work may now use rAF normally.
window.requestAnimationFrame = boot.raf;
root.classList.add('rc-isolated');
$('app').inert = true;
await document.fonts.ready;
let running = false, interrupted = '', report = null, viewport = '';
const dimensions = () => [innerWidth, innerHeight, devicePixelRatio, cv.width, cv.height].join('/');
const stopIfRunning = message => { if (running) interrupted = message; };
document.addEventListener('visibilitychange', () => { if (document.hidden) stopIfRunning('The tab was hidden.'); });
window.addEventListener('resize', () => stopIfRunning('The screen size or orientation changed.'));
document.addEventListener('keydown', e => { if (running) { e.stopImmediatePropagation(); e.preventDefault(); if (e.code === 'Escape') interrupted = 'Test stopped.'; } }, true);
function assertActive() {
  if (interrupted) throw Error(interrupted + ' Keep the phone sideways and restart.');
  if (document.hidden) throw Error('Keep this tab visible and restart.');
  if (viewport && dimensions() !== viewport) throw Error('Render dimensions changed. Restart the test.');
  if (boot.errors.length) throw Error(boot.errors.join('; '));
}

// The workload is controlled rendering, not a live fight: no AI, rewards, saving or hit effects.
// Both fighters move through their own authored stance/guard poses. Rain uses the same seeded
// initial particles and wall-clock trajectory in every stage, without random lightning.
let rain = [];
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
    f.x = (f.id ? 170 : -170) + Math.sin(t * 2) * 18;
    f.dir = f.id ? -1 : 1;
    N.pose.lerp(f.P.stance || N.POSES.stance, f.P.guard || N.POSES.guard, u, f.pose);
    N.solve(f.pose, f.x, 0, f.dir, f.j, f.wpn);
    f.posture = Math.round(u * 45); // Exercise normal changing interface bars too.
  }
  g.timer = 60 - (t % 60); g.clock = t; N.simClock = t;
}
function isolate(kind, undo) {
  const off = () => {}, patch = (obj, name, fn = off) => replaceMethod(undo, obj, name, fn);
  if (kind === 'noPost') patch(g, 'post');
  if (kind === 'noFighters') {
    patch(g, 'drawLit'); patch(g, 'castShadows'); patch(N, 'eyeGlow');
    for (const f of g.F) for (const name of ['draw', 'drawShadow', 'drawGhosts']) patch(f, name);
  }
  if (kind === 'noBack') patch(N.scene, 'drawBack', ctx => {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#0c0d15'; ctx.fillRect(0, 0, cv.width, cv.height);
  });
  if (kind === 'noWeather') patch(N.scene, 'drawWeather');
  if (kind === 'noHud') { patch(g, 'hud'); root.classList.add('rc-no-hud'); undo.push(() => root.classList.remove('rc-no-hud')); }
}
async function measure(kind, label, index) {
  const undo = [], samples = [];
  strip.textContent = `${index + 1}/${stages.length} · ${label}`;
  boot.resetRandom();
  for (const f of g.F) for (const k of ['_t', '_px', '_vs']) delete f.j[k];
  poseScene(0); g.hud(); g.render(); // Same complete starting image, including for cadence-only stages.
  isolate(kind, undo);
  try {
    let began = null, previous = null, previousElapsed = -1, previousCpu = 0;
    for (;;) {
      const now = await nextFrame(); assertActive();
      if (began === null) began = now;
      const elapsed = now - began;
      if (previous !== null) {
        const s = measuredInterval(previousElapsed, now - previous, previousCpu);
        if (s) samples.push(s);
      }
      if (elapsed >= warmupMs + sampleMs) break;
      const before = performance.now();
      if (kind !== 'idle') { poseScene(elapsed); g.hud(); g.render(); }
      previousCpu = performance.now() - before; previous = now; previousElapsed = elapsed;
    }
    return { kind, label, ...summarize(samples) };
  } finally { restore(undo); }
}
start.disabled = false; status.textContent = 'Ready · High graphics · rain · Kuro / Yuki';
start.onclick = async () => {
  if (running) return;
  if (innerWidth < innerHeight) { status.textContent = 'Turn your phone sideways before starting.'; return; }
  running = true; interrupted = ''; viewport = ''; report = null; start.disabled = true;
  $('rc-copy').hidden = true; $('rc-report').hidden = true;
  status.textContent = 'Preparing the scene…';
  const undo = [];
  try {
    boot.resetRandom(); N.gfx.setQuality('high'); replaceMethod(undo, N.gfx, 'ladderFrame', () => {});
    N.audio.enabled = false; N.music.enabled = false;
    $('first').hidden = true; g.start('cpu', { c1: 2, c2: 3, arena: 'rain' }); g.ais = [];
    while (g.preparing) { await nextFrame(); assertActive(); g._frame(1000 / 60); }
    g.phase = 'fight'; g.pt = 0; g.bars = 0; g.dim = 0; g.paused = false;
    g.F.forEach(f => { f.locked = false; f.inv = 0; });
    Object.assign(N.cam, { x: 0, y: -118, z: 1.28, shx: 0, shy: 0 });
    N.scene.splashes.length = 0;
    rain = N.scene.parts.map(p => ({ ...p }));
    g.syncTouch(); $('pauseBtn').hidden = true;
    viewport = dimensions();
    report = {
      report: 'shadow-duel-render-check-v1', renderer: g.renderVersion, complete: false,
      note: 'Controlled rendering, not gameplay FPS or direct GPU timing. Omission stages change the image only for diagnosis. Compare adjacent Full High controls; differences are not additive. Cadence is rAF callbacks, not a measured display refresh rate.',
      quality: { preference: N.gfx.pref, tier: N.gfx.tier, fixedResolution: true },
      scene: { arena: 'rain', fighters: g.F.map(f => f.ch.id), poses: 'animated stance / guard', lightning: false, combat: false },
      device: { userAgent: navigator.userAgent, dpr: devicePixelRatio, cores: navigator.hardwareConcurrency || null, memoryGB: navigator.deviceMemory || null },
      canvas: { width: cv.width, height: cv.height, cssWidth: cv.clientWidth, cssHeight: cv.clientHeight },
      storage: 'isolated memory only', network: 'game services disabled; static assets only', warmupMs, sampleMs, stages: [],
    };
    panel.hidden = true; strip.hidden = false;
    for (let i = 0; i < stages.length; i++) report.stages.push(await measure(...stages[i], i));
    report.complete = true;
    status.textContent = 'Complete. Copy the report and send it back.';
  } catch (error) {
    status.textContent = error.message;
    if (report) report.error = error.message;
  } finally {
    restore(undo); root.classList.remove('rc-no-hud');
    // Display the complete High scene again. The regular game loop remains off on this diagnostic page.
    try { if (rain.length) { poseScene(0); g.hud(); g.render(); } } catch { /* preserve the original error */ }
    panel.hidden = false; strip.hidden = true; start.disabled = false; running = false;
    start.textContent = 'RUN AGAIN';
    if (report) {
      $('rc-report').value = JSON.stringify(report, null, 2); $('rc-report').hidden = false;
      $('rc-copy').hidden = false; $('rc-copy').textContent = 'COPY REPORT';
    }
  }
};
$('rc-copy').onclick = async () => {
  try { await navigator.clipboard.writeText($('rc-report').value); $('rc-copy').textContent = 'COPIED'; }
  catch { $('rc-report').focus(); $('rc-report').select(); status.textContent = 'Select and copy the report below.'; }
};
