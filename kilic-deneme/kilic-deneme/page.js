// New sword moves trial page (kilic-deneme.html; branch claude/sd-kilic-yeni). One copy of the game runs hidden in an
// iframe (?duel=1, its own loop stopped); this page steps it at 120 steps a second and draws Akane twice:
//   NOW: the current game's move — the duel itself (Akane's fighter, drawn by the game exactly as in a fight)
//   NEW: the hand-keyed move (./moves.js) on a rig that wears Akane's look, drawn with the game's own parts and the 3D
//        katana (ND.mocap.draw). Nothing of the game is changed: the new move only writes the rig's joints.
// Query: ?move=<id>, ?speed=0.5, ?capture=1 (tools/kilic-video.mjs drives it through window.__kd).
import { MOVES, ORDER, poseAt, durOf } from './moves.js';

const Q = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const GAME = /kilic-deneme\.html$/.test(location.pathname) ? 'index.html' : 'game.html';
const CAPTURE = Q.get('capture') === '1';
const STEP = 1 / 120;
// the fight with the new moves (vs the computer; ?kilic=1 loads kilic-deneme/duel-hook.js in the game)
{ const a = $('fight'); if (a) a.href = GAME + '?duel=1&kilic=1'; }
const VIEW_W = 360, VIEW_H = 400, FLOOR = 0.88, CAM_X = 62;
// the current game's move shown next to each new one (Akane's own: HEAVY, LIGHT 1 (her horizontal), LIGHT 2, → LIGHT)
const OLD = {
  idle: { label: 'standing (no input)' },
  overhead: { atk: 'd_men', label: 'Men (HEAVY)' },
  horizontal: { atk: 'ak_dNuki', label: 'Nukitsuke (LIGHT 1)' },
  diagonal: { atk: 'ak_dKesa', label: 'Kesa-giri (LIGHT 2)' },
  thrust: { atk: 'd_tsuki', label: 'Tsuki (→ LIGHT)' },
  block: { guard: true, label: 'guard vs Kuro\'s kesa' },
  kesaS: { atk: 'ak_dKesa', label: 'Kesa-giri (LIGHT 2)' },
  gyakuS: { atk: 'd_kesaL', label: 'Gyaku-kesa (LIGHT 3)' },
  menS: { atk: 'd_shomen', label: 'Shomen (Kuro\'s LIGHT 3)' },
  yokoL: { atk: 'ak_dNuki', label: 'Nukitsuke (LIGHT 1)' },
  tsukiS: { atk: 'd_tsukiL3', label: 'Tsuki (LIGHT 4)' },
  guardMid: { guard: true, by: 'd_kesaR', label: 'guard vs Kuro\'s kesa' },
  guardHi: { guard: true, by: 'd_shomen', label: 'guard vs Kuro\'s shomen' },
  guardLow: { guard: true, by: 'd_suneR', label: 'guard vs Kuro\'s low cut' },
  blockMid: { guard: true, by: 'd_kesaR', label: 'block: Kuro\'s kesa' },
  blockHi: { guard: true, by: 'd_shomen', label: 'block: Kuro\'s shomen' },
  blockLow: { guard: true, by: 'd_suneR', label: 'block: Kuro\'s low cut' },
  hurtHi: { state: 'hurt', dur: 0.34, head: true, label: 'hit reaction (head)' },
  hurtBody: { state: 'hurt', dur: 0.34, label: 'hit reaction (body)' },
  stagger: { state: 'stagger', label: 'stagger' },
  recoil: { state: 'recoil', label: 'recoil (blow stopped)' },
};
const LEAD = 0.15, TAIL = 0.45; // seconds before the move starts in each loop, and the still moment after it

const st = { move: MOVES[Q.get('move')] ? Q.get('move') : 'overhead', speed: +(Q.get('speed') || 1), i: 0, acc: 0, ready: false, S0: null, T: 2, oldLen: {}, rg: null, prevP: null };
let W, ND, g, Mo;
const cv = [$('c0'), $('c1')], ctx2 = cv.map((c) => c.getContext('2d'));
const until = (f, ms = 30000) => new Promise((res, rej) => { const t0 = Date.now(); const iv = setInterval(() => { let ok = false; try { ok = f(); } catch (e) { ok = false; } if (ok) { clearInterval(iv); res(); } else if (Date.now() - t0 > ms) { clearInterval(iv); rej(new Error('timeout')); } }, 100); });

// ------------------------------------------------------------------ the game copy
async function boot() {
  const fr = $('game');
  fr.src = GAME + '?duel=1&auto=0&mute=1&st=0&lang=en&voice=off&renderer=canvas&vib=0&gfx=high#notouch';
  await new Promise((r) => fr.addEventListener('load', r, { once: true }));
  W = fr.contentWindow;
  await until(() => W.ND && W.ND.game && W.ND.game.F && W.ND.duel && W.ND.duel.LIST && W.ND.mocap && W.ND.depth25 && W.ND._draw && W.ND.game.saveState);
  W.requestAnimationFrame = () => 0; // the game's own loop stops after its next frame: this page steps the fight
  ND = W.ND; g = ND.game; Mo = ND.mocap;
  try { ND.gfx._setTier('high', 'init'); } catch (e) { /* older build */ }
  setupFight();
  // the duel's recorded-motion drawing loads its clips with the first duel fight: the NOW panel waits for it
  await until(() => !ND.duel.mocap || ND.duel.mocap.ready || ND.duel.mocap.error, 30000).catch(() => {});
  setupFight();
  measureOld();
  st.ready = true;
  setMove(st.move);
  const m = $('msg'); if (m) m.remove();
}
const charIdx = (id) => ND.CHARS.findIndex((c) => c.id === id);
function setupFight() {
  if (ND.props && ND.props.live) ND.duel.propsOn(false);
  g.newMatch('2p', { c1: charIdx('akane'), c2: charIdx('kuro'), arena: 'temple', seed: 7 });
  g.cancelPreparation();
  for (let i = 0; i < 3000 && g.phase !== 'fight'; i++) g.tick(true);
  const [a, b] = g.F;
  a.ctrl.clear(); b.ctrl.clear();
  a.x = 0; b.x = 900; a.dir = 1; b.dir = -1; a.vx = b.vx = 0;
  a.setState('move'); b.setState('move');
  for (let i = 0; i < 60; i++) g.tick(true);
  a.locked = true; b.locked = true; g.timer = 999;
  st.S0 = g.saveState();
}
// how long each current move takes in this copy (steps from its start until Akane stands again)
function measureOld() {
  for (const id of ORDER) {
    const O = OLD[id];
    if (!O.atk && !O.state) { st.oldLen[id] = O.guard ? 1.25 : 0; continue; }
    g.loadState(st.S0); g.timer = 999;
    try {
      const a = g.F[0], s0 = O.atk ? 'atk' : O.state; startOld(a, O);
      let n = 0; for (; n < 600; n++) { g.tick(true); if (a.state !== s0) break; }
      st.oldLen[id] = n * STEP + 0.12;
    } catch (e) { console.error('measure ' + id, e); st.oldLen[id] = 0.6; }
  }
  g.loadState(st.S0);
}

function startOld(a, O) {
  if (O.atk) a.startAtk(O.atk);
  else if (O.state) a.setState(O.state, O.state === 'hurt' ? { dur: O.dur || 0.34, hurtPose: ND.POSES && (O.head ? ND.POSES.hurt : ND.POSES.hurt2) } : O.dur ? { dur: O.dur } : undefined);
}
// ------------------------------------------------------------------ one loop of a move: both sides on one clock
function loopLen(id) { return id === 'idle' ? durOf('idle') / 1000 : LEAD + Math.max(st.oldLen[id] || 0, durOf(id) / 1000) + TAIL; }
function restart() {
  if (!st.ready) return;
  g.loadState(st.S0); g.timer = 999; st.i = 0; st.acc = 0; st.prevP = null;
  const a = g.F[0], b = g.F[1], O = OLD[st.move];
  if (O.guard) { a.locked = false; a.ctrl.clear(); a.ctrl.press('guard', 'bot'); a.setState('guard'); b.x = a.x + 140; b.dir = -1; b.locked = true; }
  if (!st.rg) st.rg = new Mo.Rig(a, 0, 1);
  st.rg.x = 0; st.rg.dir = 1; st.rg.trail.length = 0; st.rg.t = 0;
  newPose(0);
}
// the clock: one fight step (1/120 s) for both sides
function step() {
  const t = st.i * STEP, O = OLD[st.move], a = g.F[0], b = g.F[1];
  if ((O.atk || O.state) && Math.abs(t - LEAD) < STEP / 2) startOld(a, O);
  if (O.guard && Math.abs(t - (LEAD + 0.05)) < STEP / 2) { try { b.startAtk(O.by || 'd_kesaR'); } catch (e) { /* none */ } }
  g.tick(true);
  for (const f of g.F) f.hp = f.maxHp;
  st.i++;
  newPose(STEP);
  if (st.i * STEP >= st.T) restart();
}
function moveTime() { const t = st.i * STEP; return st.move === 'idle' ? t * 1000 : (t - LEAD) * 1000; }
function newPose(dt) {
  const rg = st.rg, t = moveTime();
  const P = poseAt(st.move, st.move === 'idle' ? t : Math.max(0, t), st.prevP);
  st.prevP = P; rg.P = P; rg.t += dt;
  if (dt > 0) Mo.cloth(rg, dt);
}
function setMove(id) {
  st.move = id;
  for (const k of ORDER) { const b = $('b_' + k); if (b) b.classList.toggle('on', k === id); }
  if (!st.ready) return;
  st.T = loopLen(id);
  restart();
  const O = OLD[id], M = MOVES[id];
  $('hint').textContent = `NOW: ${O.label}  ·  NEW: ${M.name}` + (M.phases ? `  (wind-up ${M.phases.windup[1] - M.phases.windup[0]} ms, cut ${M.phases.active[1] - M.phases.active[0]} ms, recovery ${M.phases.recovery[1] - M.phases.recovery[0]} ms)` : '');
}

// ------------------------------------------------------------------ drawing
function fit(c) {
  const r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return [w, h];
}
const view = (w, h) => { const s = Math.min(w / VIEW_W, h / VIEW_H); return { s, cx: CAM_X, fy: h * FLOOR, w, h }; };
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
const worldTf = (ctx, v) => ctx.setTransform(v.s, 0, 0, v.s, v.w / 2 - v.cx * v.s, v.fy);
function drawNow(c, ctx, w, h) {
  const v = view(w, h), a = g.F[0];
  stage(ctx, v); worldTf(ctx, v);
  const cw0 = ND.cam.world; ND.cam.world = (q) => worldTf(q, v);
  try { a.drawShadow(ctx); a.draw(ctx, false, false); } finally { ND.cam.world = cw0; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function drawNew(c, ctx, w, h) {
  const v = view(w, h);
  stage(ctx, v); worldTf(ctx, v);
  Mo.drawShadow(ctx, st.rg);
  Mo.draw(ctx, st.rg, {});
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function render() {
  for (let k = 0; k < 2; k++) { const [w, h] = fit(cv[k]); (k ? drawNew : drawNow)(cv[k], ctx2[k], w, h); }
}

// ------------------------------------------------------------------ loop (the page on a phone)
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!st.ready || CAPTURE) return;
  st.acc += dt * st.speed;
  while (st.acc >= STEP) { st.acc -= STEP; step(); }
  render();
}
requestAnimationFrame(frame);

// ------------------------------------------------------------------ UI
const bar = $('moves');
for (const id of ORDER) { const b = document.createElement('button'); b.id = 'b_' + id; b.textContent = MOVES[id].name.replace(/ \(.*\)$/, ''); b.onclick = () => setMove(id); bar.appendChild(b); }
const setSpeed = (s) => { st.speed = s; $('sp1').classList.toggle('on', s === 1); $('sp2').classList.toggle('on', s === 0.5); $('sp4').classList.toggle('on', s === 0.25); };
$('sp1').onclick = () => setSpeed(1); $('sp2').onclick = () => setSpeed(0.5); $('sp4').onclick = () => setSpeed(0.25);
$('replay').onclick = () => restart();
setSpeed(st.speed);
setMove(st.move);

// ------------------------------------------------------------------ capture hooks (tools/kilic-video.mjs)
window.__kd = {
  get ready() { return st.ready; },
  moves: ORDER,
  names: Object.fromEntries(ORDER.map((id) => [id, MOVES[id].name])),
  old: OLD,
  setMove(id) { setMove(id); return st.T; },
  loopLen: (id) => loopLen(id),
  restart() { restart(); },
  step(n) { for (let k = 0; k < n; k++) step(); },
  // both panels side by side (pw × ph each) into one w × h picture with the captions; JPEG data URL
  composite(w, h, cap = {}) {
    const out = document.createElement('canvas'); out.width = w; out.height = h; const o = out.getContext('2d');
    const pw = Math.floor(w / 2), ph = h;
    for (let k = 0; k < 2; k++) { cv[k].width = pw; cv[k].height = ph; (k ? drawNew : drawNow)(cv[k], ctx2[k], pw, ph); o.drawImage(cv[k], k * pw, 0); }
    o.fillStyle = '#0b0c10'; o.fillRect(pw - 1, 0, 2, h);
    o.textBaseline = 'top';
    const tag = (x, t1, t2) => { o.font = '700 22px system-ui, sans-serif'; o.fillStyle = '#fff'; o.fillText(t1, x + 16, 14); o.font = '500 16px system-ui, sans-serif'; o.fillStyle = '#b8c0d0'; o.fillText(t2, x + 16, 42); };
    tag(0, 'NOW · the game today', OLD[st.move].label);
    tag(pw, 'NEW · hand-keyed', MOVES[st.move].name);
    if (cap.title) { o.font = '700 30px system-ui, sans-serif'; o.textAlign = 'center'; o.fillStyle = 'rgba(0,0,0,.55)'; o.fillRect(w / 2 - 260, h - 62, 520, 48); o.fillStyle = '#ffd27a'; o.fillText(cap.title, w / 2, h - 54); o.textAlign = 'left'; }
    if (cap.speed) { o.font = '700 20px system-ui, sans-serif'; o.textAlign = 'right'; o.fillStyle = cap.speed === '1×' ? '#9fd0ff' : '#ff9b7a'; o.fillText(cap.speed === '1×' ? 'NORMAL SPEED' : 'HALF SPEED', w - 16, 16); o.textAlign = 'left'; }
    return out.toDataURL('image/jpeg', 0.9);
  },
};
boot().catch((e) => { const m = $('msg'); if (m) m.textContent = 'Could not start: ' + e.message; console.error(e); });
