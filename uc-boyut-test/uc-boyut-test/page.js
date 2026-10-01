// 3D strike test page (branch claude/sd-3d only). One fight runs in a hidden copy of the game (iframe, its own loop
// stopped); this page steps it at 120 steps a second and draws the same moment three ways:
//   NOW: the fighter's own drawing (the game today, motion round 1)
//   A:   js/depth25.js, the drawn art with a depth axis (2.5D), plus a small camera push / shake at the impact
//   B:   uc-boyut-test/model3d-hd.js, detailed 3D models (tools/fighter3d) on the same 3D skeleton (three.js);
//        'B (simple)' (uc-boyut-test/model3d.js, the first low-poly try) stays one tap away
// Query: ?move=light, ?slow=1, ?only=0|1|2 (one panel), ?b=simple, ?capture=1 (for tools/uc-boyut-video.mjs).
const Q = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const GAME = /uc-boyut-test\.html$/.test(location.pathname) ? 'index.html' : 'game.html';
const CAPTURE = Q.get('capture') === '1';
const STEP = 1 / 120;
// placement: Akane (0) at AX facing Kuro (2) at BX, close enough for both strikes to land
let AX = -130, BX = 90; const VIEW_W = 430, VIEW_H = 255, FLOOR = 0.87;
const CLIPS = {
  heavy: { cmd: 'heavy', start: 14, len: 205 },
  light: { cmd: 'light1', start: 14, len: 150 },
};

const until = (fn, ms = 60000) => new Promise((res, rej) => {
  const t0 = performance.now();
  (function poll() { let v = null; try { v = fn(); } catch (e) { /* not yet */ } if (v) return res(v); if (performance.now() - t0 > ms) return rej(new Error('timeout')); setTimeout(poll, 50); })();
});

const st = { move: Q.get('move') === 'light' ? 'light' : 'heavy', speed: Q.get('slow') === '1' ? 0.25 : 1, i: 0, acc: 0, hold: 0, S0: null, ready: false, only: Q.has('only') ? +Q.get('only') : -1 };
let W, ND, g, model = null, modelHD = null, modelLo = null, loLoading = false;
let useHD = Q.get('b') !== 'simple';
const cv = [$('c0'), $('c1'), $('c2')];
const cvLo = $('c2s');
const bCanvas = () => (useHD ? cv[2] : cvLo);
// the canvases of each panel, bottom to top (B: the 3D picture and the 2D effects over it)
const panels = () => [[cv[0]], [cv[1]], [bCanvas(), $('c2fx')]];
const ctx2 = [cv[0].getContext('2d'), cv[1].getContext('2d')];

// ------------------------------------------------------------ the game copy
async function boot() {
  const fr = $('game');
  fr.src = GAME + '?mute=1&st=0&lang=en&voice=off&renderer=canvas&vib=0&cap=1#notouch';
  await new Promise((r) => fr.addEventListener('load', r, { once: true }));
  W = fr.contentWindow;
  await until(() => W.ND && W.ND.game && W.ND.game.F && W.ND.gfx && W.ND.depth25 && W.ND._draw && W.ND.game.newMatch && W.ND.game.saveState);
  W.requestAnimationFrame = () => 0; // the game's own loop stops after its next frame: this page steps the fight
  ND = W.ND; g = ND.game;
  try { ND.gfx._setTier('high', 'init'); } catch (e) { /* older build */ }
  setup();
  st.ready = true;
}
function setup() {
  g.newMatch('2p', { c1: 0, c2: 2, arena: 'temple', seed: 7 });
  if (g.cancelPreparation) g.cancelPreparation();
  for (let i = 0; i < 3000 && g.phase !== 'fight'; i++) g.tick(true);
  g.timer = 999;
  const [a, b] = g.F;
  a.ctrl.clear(); b.ctrl.clear();
  a.x = AX; b.x = BX; a.dir = 1; b.dir = -1; a.vx = b.vx = 0;
  a.setState('move'); b.setState('move');
  for (let i = 0; i < 40; i++) g.tick(true);
  st.S0 = g.saveState();
  restart();
}
function restart() { if (!g || !st.S0) return; g.loadState(st.S0); g.timer = 999; st.i = 0; st.acc = 0; st.hold = 0; if (modelHD) { modelHD.reset(); modelHD.tick(g.F); } }
function step() {
  const C = CLIPS[st.move], [a] = g.F;
  if (st.i === C.start) a.startOpener(C.cmd);
  g.tick(true);
  if (modelHD) modelHD.tick(g.F);
  st.i++;
}

// ------------------------------------------------------------ drawing
function fit(c) {
  const r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return [w, h];
}
function view(w, h) {
  // the camera follows Akane a little and keeps her target in view (a knocked-down opponent may fly out)
  const [a, b] = g.F, s = Math.min(w / VIEW_W, h / VIEW_H), mid = (AX + BX) / 2 - 12;
  const cx = Math.max(mid, Math.min(a.x + 120, (a.x + Math.min(b.x, a.x + 230)) / 2 - 12));
  // floor low in a wide picture, the fighters' middle near the centre in a tall one
  return { s, cx, fy: Math.min(h * FLOOR, h / 2 + 105 * s), w, h };
}
function stage(ctx, v) {
  const { w, h, s, cx, fy } = v;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a2f3b'); gr.addColorStop(1, '#1a1d24');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#12141a'; ctx.fillRect(0, fy, w, h - fy);
  ctx.strokeStyle = '#6a7284'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(w, fy); ctx.stroke();
  ctx.strokeStyle = '#4a5162'; ctx.lineWidth = 1.2;
  for (let x = Math.floor((cx - w / s / 2) / 30) * 30; x < cx + w / s / 2; x += 30) { const X = w / 2 + (x - cx) * s; ctx.beginPath(); ctx.moveTo(X, fy); ctx.lineTo(X, fy + 7 * s); ctx.stroke(); }
}
function worldTf(ctx, v, kick) {
  const { w, s, cx, fy } = v;
  ctx.setTransform(s, 0, 0, s, w / 2 - cx * s, fy);
  if (kick && kick.zoom !== 1) {
    // push in round Akane's chest, shake in screen space
    const [a] = g.F, px = a.x + 30, py = -80;
    ctx.translate(px, py); ctx.scale(kick.zoom, kick.zoom); ctx.translate(-px, -py);
  }
  if (kick) ctx.translate(kick.sx / s * 1.2, kick.sy / s * 1.2);
}
function draw2d(k) {
  const c = cv[k], ctx = ctx2[k];
  const [w, h] = fit(c), v = view(w, h);
  stage(ctx, v);
  const [a, b] = g.F;
  const kick = k === 1 ? ND.depth25.cameraKick(a) : null;
  worldTf(ctx, v, kick);
  b.drawShadow(ctx); a.drawShadow(ctx);
  b.draw(ctx, false, false);
  if (k === 1) ND.depth25.draw(ctx, a); else a.draw(ctx, false, false);
  if (ND.fx && ND.fx.draw) { try { ND.fx.draw(ctx); } catch (e) { /* none */ } }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function draw3d() {
  const m = useHD ? modelHD : modelLo;
  if (!m) return;
  const c = bCanvas(), [w, h] = fit(c), v = view(w, h);
  const [a] = g.F;
  const kick = ND.depth25.cameraKick(a);
  m.render(g.F, v, kick, stage);
  // the fight's 2D effects (hit flash, sparks) over the 3D picture, placed like panel A's
  const fc = $('c2fx'), [fw, fh] = fit(fc), fctx = fc.getContext('2d');
  fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.clearRect(0, 0, fw, fh);
  if (ND.fx && ND.fx.draw) { worldTf(fctx, view(fw, fh), kick); try { ND.fx.draw(fctx); } catch (e) { /* none */ } fctx.setTransform(1, 0, 0, 1, 0, 0); }
}
function render() {
  if (st.only < 0 || st.only === 0) draw2d(0);
  if (st.only < 0 || st.only === 1) draw2d(1);
  if (st.only < 0 || st.only === 2) draw3d();
}

// ------------------------------------------------------------ loop
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!st.ready || CAPTURE) return;
  const C = CLIPS[st.move];
  if (st.i >= C.len) { st.hold += dt; if (st.hold > 0.9) restart(); }
  else { st.acc += dt * st.speed; while (st.acc >= STEP && st.i < C.len) { st.acc -= STEP; step(); } }
  render();
}

// ------------------------------------------------------------ UI
function setMove(m) { st.move = m; $('mHeavy').classList.toggle('on', m === 'heavy'); $('mLight').classList.toggle('on', m === 'light'); restart(); }
$('mHeavy').onclick = () => setMove('heavy');
$('mLight').onclick = () => setMove('light');
$('replay').onclick = () => restart();
$('slow').onclick = () => { st.speed = st.speed === 1 ? 0.25 : 1; $('slow').classList.toggle('on', st.speed !== 1); $('slow').textContent = st.speed === 1 ? 'Slow-mo' : 'Slow-mo ¼'; };
if (st.speed !== 1) { $('slow').classList.add('on'); $('slow').textContent = 'Slow-mo ¼'; }
setMove(st.move === 'light' ? 'light' : 'heavy');
['f0', 'f1', 'f2'].forEach((id) => {
  $(id).onclick = () => {
    const G = $('grid'), solo = G.classList.contains('solo') && $(id).classList.contains('big');
    document.querySelectorAll('figure').forEach((f) => f.classList.remove('big'));
    if (solo) G.classList.remove('solo'); else { $(id).classList.add('big'); G.classList.add('solo'); }
  };
});
if (st.only >= 0) { $('f' + st.only).classList.add('big'); $('grid').classList.add('solo'); }

// ------------------------------------------------------------ test hooks (tools/uc-boyut-*.mjs)
window.__uc = {
  get ready() { return st.ready && (!!(useHD ? modelHD : modelLo) || modelFailed); },
  get model() { return useHD ? modelHD : modelLo; },
  panels() { return panels(); },
  get bLabel() { return useHD ? 'real 3D, detailed' : 'real 3D, simple (first try)'; },
  setB(hd) { return setB(hd); },
  setMove(m) { setMove(m); },
  restart() { restart(); },
  // step the clip to step n (from the start) and draw
  seek(n) { if (n < st.i) restart(); while (st.i < n) step(); render(); return st.i; },
  len() { return CLIPS[st.move].len; },
  place(ax, bx) { AX = ax; BX = bx; setup(); },
  render,
  // one composite picture of the three panels (capture)
  composite(w, h) {
    const out = document.createElement('canvas'); out.width = w; out.height = h; const o = out.getContext('2d');
    o.fillStyle = '#0b0c10'; o.fillRect(0, 0, w, h);
    const pw = Math.floor((w - 16) / 3);
    panels().forEach((L, k) => L.forEach((c) => o.drawImage(c, 4 + k * (pw + 4), 0, pw, Math.round(pw * c.height / c.width))));
    return out.toDataURL('image/jpeg', 0.92);
  },
  // frame-time bench: n frames of the clip drawn into panel k only (ms per frame: mean, p95)
  bench(k, n, sync = true) {
    const T = [];
    restart();
    for (let f = 0; f < n; f++) {
      if (st.i >= CLIPS[st.move].len) restart();
      step(); step();
      const t0 = performance.now();
      if (k === 2) { draw3d(); if (sync) (useHD ? modelHD : modelLo).sync(); } else draw2d(k);
      T.push(performance.now() - t0);
    }
    T.sort((x, y) => x - y);
    return { mean: T.reduce((s, x) => s + x, 0) / T.length, p50: T[Math.floor(T.length / 2)], p95: T[Math.floor(T.length * 0.95)] };
  },
  get W() { return W; },
};

let modelFailed = false;
// B: detailed (default) or the first simple model; each has its own canvas (one WebGL context each)
async function loadLo() {
  if (modelLo || loLoading) return;
  loLoading = true;
  const M = await import('./model3d.js');
  modelLo = new M.Model3D(cvLo, ND, { preserve: CAPTURE });
}
function bLabel() {
  $('bName').textContent = useHD ? 'detailed 3D model' : 'simple 3D model (first try)';
  $('bToggle').textContent = useHD ? 'B: detailed' : 'B: simple';
  $('bToggle').classList.toggle('on', !useHD);
  cv[2].style.display = useHD ? '' : 'none'; cvLo.style.display = useHD ? 'none' : '';
}
async function setB(hd) {
  useHD = hd; bLabel();
  if (!hd) { try { await loadLo(); } catch (e) { $('msg').textContent = '3D could not start here: ' + e.message; } }
  if (st.ready) render();
}
$('bToggle').onclick = (ev) => { ev.stopPropagation(); setB(!useHD); };
bLabel();
requestAnimationFrame(frame);
boot().then(async () => {
  try {
    const t0 = performance.now();
    const M = await import('./model3d-hd.js');
    modelHD = await M.Model3DHD.create(cv[2], ND, { preserve: CAPTURE });
    modelHD.tick(g.F);
    modelHD.setupMs = performance.now() - t0;
    if (!useHD) await loadLo();
    const m = $('msg'); if (m) m.remove();
  } catch (e) {
    modelFailed = true;
    $('msg').textContent = '3D could not start here: ' + (e && e.message ? e.message : e);
    console.error(e);
  }
}).catch((e) => { document.body.insertAdjacentHTML('beforeend', `<p style="padding:12px">Could not start: ${e.message}</p>`); });
