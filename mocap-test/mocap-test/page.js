// Motion-capture test page (branch claude/sd-mocap only). One fight runs in a hidden copy of the game (iframe, ?duel=1
// &mocap=1, its own loop stopped); this page steps it at 120 steps a second and draws the same action two ways:
//   NOW:   the duel prototype's hand-keyed move (the fight itself, drawn through depth25 as in the duel)
//   MOCAP: recorded human motion (mocap/*.json, js/mocap.js) on the same drawn fighter, its own little scene
// Query: ?clip=<scene>, ?who=kuro, ?slow=1, ?only=0|1 (one panel), ?sticks=1 (the 3D skeleton over the picture),
// ?capture=1 (tools/mocap/shots.mjs, video.mjs drive it through window.__mc).
const Q = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const GAME = /mocap-test\.html$/.test(location.pathname) ? 'index.html' : 'game.html';
const CAPTURE = Q.get('capture') === '1';
const STEP = 1 / 120;
const ZOOM = +(Q.get("zoom") || 1), VIEW_W = 470 / ZOOM, VIEW_H = 270 / ZOOM, FLOOR = 0.86;

// ------------------------------------------------------------------ the scenes
// mocap(R): the rigs' script: R.S (the fighter) and R.O (the opponent, when the scene has one); at(t, fn) runs fn at
// play time t. now: the duel's version: setup(a, b, ctx) once, then at(t, fn) the same way (a = the fighter, b = the
// opponent). len: seconds shown (then a short hold and a replay).
const SCENES = [
  { id: 'draw', label: 'Sword draw', len: 2.7, gap: 260,
    mocap(R, at) {
      // Akane: from the saya at her hip; Kuro: his nodachi from his back ("Drawing A Great Sword")
      if (R.S.look.wpn.iai) { R.S.play('drawFwd'); at(1.2, () => R.S.play('idle', { fade: 0.35 })); }
      else { R.S.play('drawBack'); at(1.25, () => R.S.play('idle', { fade: 0.35 })); }
    },
    now: { setup() {}, at: [[0.35, (a) => a.startAtk(a.ch.id === 'akane' ? 'ak_dNuki' : 'd_kesaR')]] },
    note: 'MOCAP: Mixamo "Withdrawing A Sword" (hip draw) into the two-handed guard. The saya stays at the left hip, the left hand holds its mouth.' },
  { id: 'overhead', label: 'Overhead cut', len: 2.4, gap: 190,
    mocap(R, at) { R.S.play('idle'); at(0.3, () => R.S.play('overhead', { fade: 0.12 })); at(1.55, () => R.S.play('idle', { fade: 0.3 })); },
    now: { at: [[0.3, (a) => a.startAtk('d_men')]] },
    note: 'MOCAP: "Great Sword Downward Slash", both hands on the handle (katana grip: right under the guard, left at the end).' },
  { id: 'combo', label: 'Combo slash', len: 4.2, gap: 260, follow: true,
    mocap(R, at) { R.S.play('idle'); at(0.25, () => R.S.play('comboSlash', { fade: 0.12 })); at(3.7, () => R.S.play('idle', { fade: 0.3 })); },
    now: { at: [[0.25, (a) => a.startAtk(a.ch.id === 'akane' ? 'ak_dNuki' : 'd_kesaR')], [0.75, (a) => a.startAtk(a.ch.id === 'akane' ? 'ak_dKesa' : 'd_kesaL')], [1.25, (a) => a.startAtk(a.ch.id === 'akane' ? 'd_tsukiL3' : 'd_shomen')]] },
    note: 'MOCAP: "Great Sword Combo Slash" (one take, with its own footwork and travel).' },
  { id: 'blockHigh', label: 'High block + impact', len: 2.6, gap: 150, opp: true,
    mocap(R, at) {
      R.S.play('blockIdle'); R.O.play('idle');
      at(0.2, () => R.O.play('overhead', { fade: 0.1 }));
      // the opponent's blade lands at its clip's 0.57 s: the impact reaction starts there (timing fit)
      at(0.2 + 0.57 - 0.03, () => { R.S.play('blockedImpact', { fade: 0.06 }); spark('blades'); });
      at(1.6, () => { R.S.play('blockToStand', { fade: 0.2 }); R.O.play('idle', { fade: 0.3 }); });
      at(2.1, () => R.S.play('idle', { fade: 0.25 }));
    },
    now: { setup(a, b) { a.locked = false; a.ctrl.press('guard', 'bot'); a.setState('guard'); }, at: [[0.2, (a, b) => b.startAtk('d_men')]] },
    note: 'MOCAP: "Great Sword Blocking Idle" → "Blocked Impact" at the moment the opponent\'s "Downward Slash" lands.' },
  { id: 'blockLow', label: 'Low block', len: 2.6, gap: 165, opp: true,
    mocap(R, at) {
      R.S.play('idle'); R.O.play('idle');
      at(0.15, () => R.S.play('crouchBlockIdle', { fade: 0.2 }));
      at(0.25, () => R.O.play('lowSlash', { fade: 0.1 }));
      // the low slash lands at its clip's 0.83 s
      at(0.25 + 0.8, () => { R.S.play('crouchBlockedImpact', { fade: 0.05 }); spark('blades'); });
      at(1.75, () => R.S.play('crouchToStand', { fade: 0.15 }));
      at(2.05, () => { R.S.play('idle', { fade: 0.3 }); R.O.play('idle', { fade: 0.3 }); });
    },
    now: { setup(a, b) { a.locked = false; a.ctrl.press('guard', 'bot'); a.setState('guard'); }, at: [[0.25, (a, b) => b.startAtk('d_suneR')]] },
    note: 'MOCAP: "Great Sword Crouching Block" → "Crouching Blocked Impact" when the opponent’s "Low Slash" lands, then "Crouch To Stand".' },
  { id: 'hitHead', label: 'Hit to the head', len: 2.3, gap: 128, opp: true,
    mocap(R, at) {
      R.S.play('idle'); R.O.play('idle');
      at(0.2, () => R.O.play('hiltStrike', { fade: 0.1 }));
      at(0.2 + 0.36, () => { R.S.play('hitHead', { fade: 0.05 }); spark('head'); });
      at(1.5, () => R.O.play('idle', { fade: 0.3 }));
    },
    now: { at: [[0.2, (a, b) => b.startAtk('d_kesaR')]] },
    note: 'MOCAP: "Great Sword Head Impact" when the opponent\'s pommel strike ("Hilt Melee") lands.' },
  { id: 'knockdown', label: 'Knocked down + get up', len: 6.4, gap: 92, opp: true, unarmed: true,
    mocap(R, at) {
      R.S.play('punches', { rate: 0, from: 0.05 }); R.O.play('punches', { rate: 0, from: 0.05 });
      at(0.2, () => R.O.play('elbow', { fade: 0.12 }));
      at(0.2 + 0.6, () => { R.S.play('knockdown', { fade: 0.05 }); spark('head'); });
      at(1.6, () => R.O.play('punches', { rate: 0, from: 0.05, fade: 0.4 }));
      at(0.8 + 2.05, () => R.S.play('getUp', { fade: 0.25 }));
    },
    now: { setup(a, b, c) { c.disarm(a, b); }, at: [[0.2, (a, b) => b.startAtk('heavy')]] },
    note: 'MOCAP: "Knocked Down From A Punch" (the opponent’s elbow) then "Getting Up" — unarmed, the katana stays in its saya.' },
  { id: 'kick', label: 'Kick', len: 2.4, gap: 185, opp: true,
    mocap(R, at) {
      R.S.play('idle'); R.O.play('idle');
      at(0.2, () => R.S.play('sideKickArmed', { fade: 0.12 }));
      at(0.2 + 0.68, () => { R.O.play('hitBody', { fade: 0.05 }); spark('opp'); });
      at(2.0, () => R.S.play('idle', { fade: 0.3 }));
    },
    now: { at: [[0.2, (a) => a.startAtk('d_kakato')]] },
    note: 'MOCAP: "Great Sword Side Kick" (the sword kept in both hands while kicking).' },
  { id: 'punches', label: 'Punch combo', len: 2.6, gap: 150, opp: true, unarmed: true,
    mocap(R, at) { R.S.play('punches', { from: 0.1 }); R.O.play('punches', { rate: 0, from: 0.05 }); at(1.45, () => { R.O.play('hitBody', { fade: 0.05 }); spark('opp'); }); at(2.4, () => R.O.play('punches', { rate: 0, from: 0.05, fade: 0.3 })); },
    now: { setup(a, b, c) { c.disarm(a, b); }, at: [[0.2, (a) => a.startAtk('ua_jab')], [0.5, (a) => a.startAtk('ua_cross')], [0.85, (a) => a.startAtk('ua_elbow')], [1.25, (a) => a.startAtk('ua_upper')]] },
    note: 'MOCAP: "Four Punch Combo" (unarmed).' },
  { id: 'pickThrow', label: 'Pick up + throw', len: 5.2, gap: 400, unarmed: true, prop: 'jar',
    mocap(R, at) { R.S.play('pickThrow', { fade: 0 }); },
    now: { setup(a, b, c) { c.disarm(a, b, 'near'); }, at: [[0.3, (a) => { a.locked = false; a.ctrl.press('throw', 'bot'); }]] },
    note: 'MOCAP: "Picking Up Object And Throwing" (a jar here). NOW: the duel\'s pick-up of a dropped sword.' },
  { id: 'vault', label: 'Vault over box', len: 3.8, gap: 400, unarmed: true, prop: 'box', follow: true, followK: 0.12,
    mocap(R, at) { R.S.play('vault', { fade: 0 }); },
    now: { showpiece: 4.85, at: [] },
    note: 'MOCAP: "Vault Over Box And Hide". NOW: the table vault of the market showpiece.' },
];
// MOCAP impact sparks: where the blades meet ('blades'), the fighter's head ('head'), the opponent's body ('opp')
function spark(kind) {
  const S = R.S, O = R.O, pj = ND.mocap.project;
  let p = null;
  if (kind === 'blades' && O && S.P && O.P) {
    const seg = (r) => { const b = r.P.blade, L = r.look.wpn.blade; return [pj(r, b.h), pj(r, [b.h[0] + b.u[0] * L, b.h[1] + b.u[1] * L, b.h[2] + b.u[2] * L])]; };
    const [a0, a1] = seg(S), [b0, b1] = seg(O);
    let best = null;
    for (let i = 0; i <= 20; i++) for (let k = 0; k <= 20; k++) {
      const pa = { x: a0.x + (a1.x - a0.x) * i / 20, y: a0.y + (a1.y - a0.y) * i / 20 }, pb = { x: b0.x + (b1.x - b0.x) * k / 20, y: b0.y + (b1.y - b0.y) * k / 20 };
      const d = Math.hypot(pa.x - pb.x, pa.y - pb.y);
      if (!best || d < best.d) best = { d, x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
    }
    p = best;
  } else if (kind === 'head' && S.P) p = pj(S, S.P.head);
  else if (kind === 'opp' && O && O.P) p = pj(O, [(O.P.hip[0] + O.P.neck[0]) / 2, (O.P.hip[1] + O.P.neck[1]) / 2, 0]);
  if (p) st.fx.push({ x: p.x, y: p.y, i: st.i, kind });
}
function drawSparks(ctx) {
  for (const e of st.fx) {
    const age = (st.i - e.i) * STEP;
    if (age < 0 || age > 0.28) continue;
    const k = 1 - age / 0.28, metal = e.kind === 'blades';
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const r = (metal ? 14 : 20) + 26 * (1 - k);
    const gr = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
    gr.addColorStop(0, `rgba(255,255,240,${0.95 * k})`); gr.addColorStop(0.4, metal ? `rgba(255,214,140,${0.6 * k})` : `rgba(255,190,170,${0.45 * k})`); gr.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = metal ? `rgba(255,236,190,${k})` : `rgba(255,255,255,${0.8 * k})`; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let q = 0; q < 10; q++) { const a = q * 2.4 + e.i, r0 = 6 + 30 * (1 - k), r1 = r0 + 10 + (q % 3) * 6; ctx.moveTo(e.x + Math.cos(a) * r0, e.y + Math.sin(a) * r0); ctx.lineTo(e.x + Math.cos(a) * r1, e.y + Math.sin(a) * r1); }
    ctx.stroke(); ctx.restore();
  }
}
// a clip played alone (a hidden rig): where its right hand and hip go, for placing the scene's props
function preRun(id, x0) {
  const r = new ND.mocap.Rig(g.F[0], x0, 1); r.play(id, { fade: 0 });
  const C = ND.mocap.clips[id], out = [];
  for (let i = 0; i <= Math.ceil(C.dur / STEP); i++) {
    r.update(i ? STEP : 0);
    const pj = ND.mocap.project, h = pj(r, r.P.haR), hp = pj(r, r.P.hip), lh = pj(r, r.P.haL);
    out.push({ t: i * STEP, hx: h.x, hy: h.y, lx: lh.x, ly: lh.y, px: hp.x, py: hp.y });
  }
  return out;
}
const SC = Object.fromEntries(SCENES.map((s) => [s.id, s]));
const CLIP_IDS = ['crouchBlockIdle', 'crouchBlockedImpact', 'crouchToStand', 'idle', 'drawHip', 'drawFwd', 'drawBack', 'overhead', 'comboSlash', 'blockIdle', 'blockedImpact', 'blockToStand', 'lowSlash', 'lowBlockR', 'hiltStrike', 'hitHead', 'elbow', 'knockdown', 'getUp', 'sideKickArmed', 'hitBody', 'punches', 'pickThrow', 'vault'];

const until = (fn, ms = 60000) => new Promise((res, rej) => {
  const t0 = performance.now();
  (function poll() { let v = null; try { v = fn(); } catch (e) { /* not yet */ } if (v) return res(v); if (performance.now() - t0 > ms) return rej(new Error('timeout')); setTimeout(poll, 50); })();
});

const st = { scene: SC[Q.get('clip')] ? Q.get('clip') : 'draw', who: Q.get('who') === 'kuro' ? 'kuro' : 'akane', speed: Q.get('slow') === '1' ? 0.25 : 1, i: 0, acc: 0, hold: 0, S0: null, ready: false, only: Q.has('only') ? +Q.get('only') : -1, sticks: Q.get('sticks') === '1', ev: [], evNow: [], camX: [null, null], fx: [], pre: {} };
let W, ND, g, Mo;
const R = { S: null, O: null };
const cv = [$('c0'), $('c1')], ctx2 = cv.map((c) => c.getContext('2d'));

// ------------------------------------------------------------------ the game copy
async function boot() {
  const fr = $('game');
  fr.src = GAME + '?duel=1&mocap=1&mduel=0&auto=0&mute=1&st=0&lang=en&voice=off&renderer=canvas&vib=0&cap=1' + (Q.get('read') === '0' ? '&read=0' : '') + '#notouch';
  await new Promise((r) => fr.addEventListener('load', r, { once: true }));
  W = fr.contentWindow;
  await until(() => W.ND && W.ND.game && W.ND.game.F && W.ND.duel && W.ND.duel.LIST && W.ND.mocap && W.ND.depth25 && W.ND._draw && W.ND.game.saveState);
  W.requestAnimationFrame = () => 0; // the game's own loop stops after its next frame: this page steps the fight
  ND = W.ND; g = ND.game; Mo = ND.mocap;
  try { ND.gfx._setTier('high', 'init'); } catch (e) { /* older build */ }
  await Mo.loadAll(CLIP_IDS);
  st.ready = true;
  setScene(st.scene);
  const m = $('msg'); if (m) m.remove();
}
const charIdx = (id) => ND.CHARS.findIndex((c) => c.id === id);
function setup() {
  const S = SC[st.scene], me = st.who, op = me === 'akane' ? 'kuro' : 'akane';
  const D = ND.duel;
  if (S.now.showpiece) {
    if (ND.props && !ND.props.live) D.propsOn(true);
    g.newMatch('cpu', { c1: charIdx(me), c2: charIdx(op), arena: 'market', seed: 5 });
    g.cancelPreparation();
    g.ais = [new ND.AI(g.F[0], 2), new ND.AI(g.F[1], 2)];
    for (let i = 0; i < 400 && g.phase !== 'fight'; i++) g.tick(true);
    D.seqSure = true; D.wantSeq = true;
    // run the showpiece up to the moment shown
    for (let i = 0; i < 120 * 12; i++) { g.tick(true); const z = g.F[0].dz; if (z && z.seq && z.seq.t >= S.now.showpiece) break; }
  } else {
    if (ND.props && ND.props.live) D.propsOn(false);
    g.newMatch('2p', { c1: charIdx(me), c2: charIdx(op), arena: 'temple', seed: 7 });
    g.cancelPreparation();
    for (let i = 0; i < 3000 && g.phase !== 'fight'; i++) g.tick(true);
    const [a, b] = g.F;
    a.ctrl.clear(); b.ctrl.clear();
    a.x = -S.gap / 2; b.x = S.gap / 2; a.dir = 1; b.dir = -1; a.vx = b.vx = 0;
    a.setState('move'); b.setState('move');
    for (let i = 0; i < 30; i++) g.tick(true);
    a.locked = true; b.locked = true;
    const c = {
      disarm(f, o, where) {
        D.disarm(f, o, where === 'near' ? f.dir : -f.dir, 'break');
        ND.fx.clear(); g.slowT = 0; g.slow = 1; g.cineT = 0;
        // let the sword land
        for (let i = 0; i < 160; i++) g.tick(true);
        f.x = where === 'near' ? (D.swordOf(f) ? D.swordOf(f).x - 26 * f.dir : f.x) : -S.gap / 2; f.setState('move');
        ND.fx.clear();
      },
    };
    if (S.now.setup) S.now.setup(a, b, c);
    if (!S.opp && !S.now.showpiece) b.x = 900; // (alone on the stage)
    g.timer = 999;
  }
  st.S0 = g.saveState();
  restart();
}
function restart() {
  if (!g || !st.S0) return;
  g.loadState(st.S0); g.timer = 999; st.i = 0; st.acc = 0; st.hold = 0;
  st.nowStart = g.F[0].x; st.camX = [null, null];
  const S = SC[st.scene];
  st.evNow = (S.now.at || []).map(([t, fn]) => [Math.round(t / STEP), fn]);
  // MOCAP scene
  const me = g.F[0], op = g.F[1];
  R.S = new Mo.Rig(me, -S.gap / 2, 1);
  R.O = S.opp ? new Mo.Rig(op, S.gap / 2, -1) : null;
  st.ev = []; st.fx = [];
  const at = (t, fn) => st.ev.push([Math.round(t / STEP), fn]);
  S.mocap(R, at);
  st.ev.sort((a, b) => a[0] - b[0]);
  if (st.scene === 'vault') {
    R.S.x = -170;
    // the box goes where the hands land on it: the lowest the hands get while the hips are high (after the run-up)
    const T = st.pre.vault || (st.pre.vault = preRun('vault', -170));
    let best = null;
    for (const q of T) { if (q.t < 0.3 || q.t > 1.6) continue; const hy = Math.max(q.hy, q.ly), sc = q.py < -95 ? hy : -1e9; if (!best || sc > best.sc) best = { sc, x: (q.hx + q.lx) / 2, y: hy, t: q.t }; }
    st.box = { x: best.x, top: Math.min(-40, best.y) };
  }
  if (st.scene === 'pickThrow') {
    R.S.x = -60;
    // the jar: on the floor where the right hand reaches lowest; in the hand until the throw's fastest moment
    const T = st.pre.pick || (st.pre.pick = preRun('pickThrow', -60));
    let lo = null, rel = null;
    for (const q of T) if (q.t < 3 && (!lo || q.hy > lo.hy)) lo = q;
    for (let i = 1; i < T.length; i++) { const q = T[i], p = T[i - 1]; if (q.t <= lo.t + 0.3) continue; const v = Math.hypot(q.hx - p.hx, q.hy - p.hy) / STEP; if (!rel || v > rel.v) rel = { t: q.t, v, vx: (q.hx - p.hx) / STEP, vy: (q.hy - p.hy) / STEP, x: q.hx, y: q.hy }; }
    st.jar = { x: lo.hx, y: -9, tp: lo.t, tr: rel.t, rel };
  }
  step0();
}
function step0() { for (const r of [R.S, R.O]) if (r) r.update(0); }
function step() {
  for (const [k, fn] of st.evNow) if (k === st.i) fn(g.F[0], g.F[1]);
  g.tick(true);
  for (const [k, fn] of st.ev) if (k === st.i) fn(R);
  for (const r of [R.S, R.O]) if (r) r.update(STEP);
  camStep(false);
  st.i++;
}
const lenSteps = () => Math.round(SC[st.scene].len / STEP);

// ------------------------------------------------------------------ drawing
function fit(c) {
  const r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return [w, h];
}
// the camera: the middle of the pair, or following the fighter; smoothed per fight step (the same picture whether
// the page plays or seeks)
function camTarget(k) {
  const S = SC[st.scene];
  // (the fighter's middle: half way from the hip to the head, so a body lying down stays in the picture)
  const mid = (r) => (r.P ? r.x + ((r.P.hip[0] + r.P.head[0]) / 2) * r.dir : r.x);
  const xs = k === 0 ? (S.opp || S.now.showpiece ? [g.F[0].x, g.F[1].x] : [g.F[0].x]) : (R.O ? [mid(R.S), R.O.x] : [mid(R.S)]);
  if (S.follow) return xs[0] + (S.opp ? 70 : k === 1 ? 40 : 60);
  return xs.length > 1 ? (xs[0] + xs[1]) / 2 : xs[0] + 40;
}
function camStep(snap) { for (let k = 0; k < 2; k++) { const t = camTarget(k); st.camX[k] = snap || st.camX[k] == null ? t : st.camX[k] + (t - st.camX[k]) * (SC[st.scene].followK || 0.04); } }
function view(k, w, h) {
  const s = Math.min(w / VIEW_W, h / VIEW_H);
  if (st.camX[k] == null) camStep(true);
  return { s, cx: st.camX[k], fy: Math.min(h * FLOOR, h / 2 + (ZOOM > 1 ? 92 : 108) * s), w, h };
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
const worldTf = (ctx, v) => ctx.setTransform(v.s, 0, 0, v.s, v.w / 2 - v.cx * v.s, v.fy);
function drawNow() {
  const c = cv[0], ctx = ctx2[0], [w, h] = fit(c);
  const [a, b] = g.F, S = SC[st.scene];
  const v = view(0, w, h);
  stage(ctx, v); worldTf(ctx, v);
  const cw0 = ND.cam.world; ND.cam.world = (c) => worldTf(c, v); // (the props and effects passes put the game's camera on)
  try { drawNow2(ctx, v, a, b); } finally { ND.cam.world = cw0; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function drawNow2(ctx, v, a, b) {
  if (ND.props && ND.props.live && ND.props.draw) { try { ND.props.draw(ctx, 'back'); } catch (e) { /* none */ } }
  worldTf(ctx, v);
  b.drawShadow(ctx); a.drawShadow(ctx);
  b.draw(ctx, false, false); a.draw(ctx, false, false);
  worldTf(ctx, v);
  for (const p of g.projs || []) { try { p.draw(ctx); } catch (e) { /* none */ } }
  if (ND.props && ND.props.live && ND.props.draw) { try { ND.props.draw(ctx, 'front'); } catch (e) { /* none */ } }
  worldTf(ctx, v);
  if (ND.fx && ND.fx.draw) { try { ND.fx.draw(ctx); } catch (e) { /* none */ } }
}
// MOCAP props: a crate to vault, a jar to pick up and throw (drawn in world units)
function drawProp(ctx) {
  const S = SC[st.scene];
  if (S.prop === 'box' && st.box) {
    const x = st.box.x, w = 64, hgt = -st.box.top;
    ctx.fillStyle = '#5a3f28'; ctx.strokeStyle = '#140d08'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.rect(x - w / 2, -hgt, w, hgt); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#3a281a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 4, -hgt + 4); ctx.lineTo(x + w / 2 - 4, -4); ctx.moveTo(x + w / 2 - 4, -hgt + 4); ctx.lineTo(x - w / 2 + 4, -4); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,170,.25)'; ctx.lineWidth = 1.2; ctx.strokeRect(x - w / 2 + 2, -hgt + 2, w - 4, hgt - 4);
  }
  if (S.prop === 'jar' && st.jar) {
    const r = R.S, P = r.P; if (!P) return;
    const J = st.jar, t = r.current ? r.current.ct : 0;
    let x, y;
    if (t < J.tp) { x = J.x; y = J.y; }
    else if (t < J.tr) { const q = ND.mocap.project(r, P.haR); x = q.x; y = q.y; }
    else { const dt = t - J.tr; x = J.rel.x + J.rel.vx * 0.8 * dt; y = Math.min(-9, J.rel.y + J.rel.vy * 0.8 * dt + 450 * dt * dt); }
    ctx.fillStyle = '#a0603a'; ctx.strokeStyle = '#1a0e08'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, 8, 9.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a4428'; ctx.fillRect(x - 3.5, y - 13, 7, 4.5);
  }
}
function drawMocap() {
  const c = cv[1], ctx = ctx2[1], [w, h] = fit(c);
  const v = view(1, w, h);
  stage(ctx, v); worldTf(ctx, v);
  if (SC[st.scene].prop === 'box') drawProp(ctx);
  for (const r of [R.O, R.S]) if (r) ND.mocap.drawShadow(ctx, r);
  if (R.O) ND.mocap.draw(ctx, R.O, { dt: STEP });
  ND.mocap.draw(ctx, R.S, { dt: STEP });
  if (SC[st.scene].prop === 'jar') drawProp(ctx);
  drawSparks(ctx);
  if (st.sticks) { ctx.globalAlpha = 0.85; for (const r of [R.S, R.O]) if (r) ND.mocap.drawSticks(ctx, r); ctx.globalAlpha = 1; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function render() {
  if (st.only < 0 || st.only === 0) drawNow();
  if (st.only < 0 || st.only === 1) drawMocap();
}

// ------------------------------------------------------------------ loop
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!st.ready || CAPTURE) return;
  if (st.i >= lenSteps()) { st.hold += dt; if (st.hold > 0.8) restart(); }
  else { st.acc += dt * st.speed; while (st.acc >= STEP && st.i < lenSteps()) { st.acc -= STEP; step(); } }
  render();
}

// ------------------------------------------------------------------ UI
const clipBar = $('clips');
for (const S of SCENES) {
  const b = document.createElement('button'); b.id = 'b_' + S.id; b.textContent = S.label;
  b.onclick = () => setScene(S.id); clipBar.appendChild(b);
}
function setScene(id) {
  st.scene = id;
  for (const S of SCENES) $('b_' + S.id).classList.toggle('on', S.id === id);
  $('n1').textContent = SC[id].note || '';
  $('n0').textContent = SC[id].now.showpiece ? 'NOW: the market showpiece at the table vault.' : '';
  if (st.ready) setup();
}
function setWho(w) { st.who = w; $('who').textContent = w === 'akane' ? 'Akane' : 'Kuro'; $('title').textContent = (w === 'akane' ? 'Akane' : 'Kuro') + ' · mocap test'; if (st.ready) setup(); }
$('who').onclick = () => setWho(st.who === 'akane' ? 'kuro' : 'akane');
$('replay').onclick = () => restart();
$('slow').onclick = () => { st.speed = st.speed === 1 ? 0.25 : 1; $('slow').classList.toggle('on', st.speed !== 1); $('slow').textContent = st.speed === 1 ? 'Slow-mo' : 'Slow-mo ¼'; };
if (st.speed !== 1) { $('slow').classList.add('on'); $('slow').textContent = 'Slow-mo ¼'; }
$('side').onclick = () => {
  const G = $('grid'), on = !G.classList.contains('solo');
  document.querySelectorAll('figure').forEach((f) => f.classList.remove('big'));
  if (on) { $('f1').classList.add('big'); G.classList.add('solo'); } else G.classList.remove('solo');
  $('side').classList.toggle('on', !on);
};
['f0', 'f1'].forEach((id) => {
  $(id).onclick = () => {
    const G = $('grid'), solo = G.classList.contains('solo') && $(id).classList.contains('big');
    document.querySelectorAll('figure').forEach((f) => f.classList.remove('big'));
    if (solo) G.classList.remove('solo'); else { $(id).classList.add('big'); G.classList.add('solo'); }
    $('side').classList.toggle('on', !G.classList.contains('solo'));
  };
});
if (st.only >= 0) { $('f' + st.only).classList.add('big'); $('grid').classList.add('solo'); $('side').classList.remove('on'); }
setWho(st.who);
for (const S of SCENES) $('b_' + S.id).classList.toggle('on', S.id === st.scene);
$('n1').textContent = SC[st.scene].note || '';

// ------------------------------------------------------------------ test hooks (tools/mocap/*.mjs)
window.__mc = {
  get ready() { return st.ready && !!st.S0; },
  scenes: SCENES.map((s) => s.id),
  setScene(id) { setScene(id); },
  setWho(w) { setWho(w); },
  restart() { restart(); },
  seek(n) { if (n < st.i) restart(); while (st.i < n) step(); render(); return st.i; },
  len() { return lenSteps(); },
  render,
  set sticks(v) { st.sticks = !!v; },
  set only(k) { st.only = k; },
  composite(w, h, panels = [0, 1]) {
    const out = document.createElement('canvas'); out.width = w; out.height = h; const o = out.getContext('2d');
    o.fillStyle = '#0b0c10'; o.fillRect(0, 0, w, h);
    const n = panels.length, pw = Math.floor((w - 4 * (n + 1)) / n);
    panels.forEach((k, i) => { const c = cv[k]; const ph = Math.round(pw * c.height / c.width); o.drawImage(c, 4 + i * (pw + 4), Math.max(0, (h - ph) / 2), pw, ph); });
    return out.toDataURL('image/jpeg', 0.92);
  },
  // frame-time bench: n frames of the scene drawn into panel k (ms per frame: mean, p50, p95), the step included
  bench(k, n) {
    // k = 0: the fight's two steps + the NOW picture; k = 1: the rigs' two steps (pose, grip, feet, cloth) + the MOCAP
    // picture (each side's other half runs untimed)
    const T = [], Td = [];
    restart();
    const rigs = () => [R.S, R.O].filter(Boolean);
    for (let f = 0; f < n; f++) {
      if (st.i >= lenSteps()) restart();
      for (let q = 0; q < 2; q++) {
        for (const [kk, fn] of st.evNow) if (kk === st.i) fn(g.F[0], g.F[1]);
        for (const [kk, fn] of st.ev) if (kk === st.i) fn(R);
        const t0 = performance.now();
        if (k === 0) g.tick(true); else for (const r of rigs()) r.update(STEP);
        const t1 = performance.now();
        if (k === 0) for (const r of rigs()) r.update(STEP); else g.tick(true);
        camStep(false); st.i++;
        T[f] = (T[f] || 0) + (t1 - t0);
      }
      const t2 = performance.now();
      if (k === 0) drawNow(); else drawMocap();
      Td[f] = performance.now() - t2;
    }
    const q = (A, p) => { const B = A.slice().sort((x, y) => x - y); return B[Math.floor(B.length * p)]; };
    const sum = T.map((x, i) => x + Td[i]);
    return { mean: sum.reduce((s, x) => s + x, 0) / n, p50: q(sum, 0.5), p95: q(sum, 0.95), step50: q(T, 0.5), draw50: q(Td, 0.5) };
  },
  get W() { return W; },
  get R() { return R; },
  get st() { return st; },
};
requestAnimationFrame(frame);
boot().catch((e) => { document.body.insertAdjacentHTML('beforeend', `<p style="padding:12px">Could not start: ${e.message}</p>`); console.error(e); });
