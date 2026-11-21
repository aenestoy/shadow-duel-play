(function () {
'use strict';




























const { MOVES, ORDER, chAt, blendCh, poseFromCh, layLeg, layArm, durOf, gaitFeet, walkFeetLive, strideOf, V, LEN, followCh, flipFollow, strikeAt, blendU, turnU, flatDrawn, fromScr, drawnR, BP_W, govStep, scrP, rotToScr, footAt } = globalThis.ND_KILIC.moves;
const { installCombos } = globalThis.ND_KILIC;
const { add, sub, mul, madd, dot, norm, lerp } = V;

const KF = 0.595;

const MAP = {
  ak_dKesa: 'kesaS', d_kesaR: 'kesaS', d_kesaL: 'gyakuS', d_shomen: 'menS', d_kote: 'menS', ak_dNuki: 'yokoL', d_doL: 'yokoL',
  d_tsukiL3: 'tsukiS', d_tsuki: 'tsukiS', d_tobikomi: 'tsukiS', d_wallL: 'tsukiS', d_men: 'overhead',
};



const PLAY = {
  d_kakato: 'kakato', dk_sweep: 'sweep', d_ashibarai: 'sweep', dk_spin: 'spinKick', dk_wrist: 'snapKick', d_hiza: 'knee',
  ak_nidan: 'nidan', d_kiriUp: 'kiriR', ak_dKiri: 'kiriL', d_antiL: 'kiriL', d_suneR: 'sune', d_dashR: 'horizontal',
  d_kesaH: 'gyakuS', d_nagare: 'gyakuS',

  ak_maki: 'kiriR', kr_uchi: 'menS', kr_iwa: 'overhead',


  ak_tsubame: 'tsubame', ak_s1: 'renga', ak_s2: 'higan', sp_akane: 'issen', sp_kuro: 'yama', chase: 'airCut', chaseEnd: 'airSpike',
  finisher: 'sandan', riposte: 'menS', riposte2: 'kiriL', riposte3: 'tsukiS', riposte4: 'horizontal', ak_rip: 'yokoL',
  nd_riposte: 'menS', nd_riposte2: 'kiriL', nd_riposte3: 'tsukiS', nd_riposte4: 'horizontal',
  sweep: 'sune', sweep2: 'sune', kaeshiHeavy: 'thrust', kaeshiHeavy2: 'overhead', mawari: 'mawari', mawari2: 'mawari', kr_kuruma: 'kuruma',

  kz_age: 'kzAge', kz_tengu: 'kzTengu', kz_iai: 'kzIai', kz_kasumi: 'kasumi',

  kr_arashi: 'krArashi', kr_kawara: 'krKawara', kr_toya: 'krToya',


  ak_kage: 'kage', ak_ryusei: 'ryusei', str1: 'oroshi', fk_s1: 'oroshi',
};
const WHO = { akane: 1, kuro: 1 };
const FADE = 0.15, CHX = 0.09;

const gripOf = (w) => Math.max(19, ((w && w.handle) || 24) - 5);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (u) => u * u * (3 - 2 * u);



const ready = () => { const N = window.ND; return !!(N && N.game && N.duel && N.duel.mocap && N.duel.mocap.rigOf && N.mocap && N.mocap.Rig && N.anim && N.anim.Pop && N.ATK); };
if (ready()) install();
else if (!/[?&]duel=0(&|$)/.test(location.search)) { const iv = setInterval(() => { let ok = false; try { ok = ready(); } catch (e) { ok = false; } if (ok) { clearInterval(iv); install(); } }, 30); }
function install() {
const ND = window.ND, D = ND.duel, Mo = ND.mocap, g = ND.game, ATK = ND.ATK, MD = D.mocap;
const K = (window.__kilic = { on: false, errors: 0, moves: 0, frames: 0, MAP });

installCombos({ ND, D, K, ATK });

const ATKID = new Map(); for (const n in ATK) ATKID.set(ATK[n], n);
K.atkId = (a) => ATKID.get(a) || '';


const TF = ['active', 'chain', 'glint', 'sheath', 'spin'];
const ORIG = {}, NEW = {};
function retimed(a, id) {
  const ph = MOVES[id].phases, k = KF / 1000;
  const X = [0, a.active[0], a.active[1], a.dur], Y = [0, ph.active[0] * k, ph.active[1] * k, durOf(id) * k];
  const m = (t) => { if (t <= 0) return t; for (let i = 1; i < 4; i++) if (t <= X[i]) return Y[i - 1] + ((t - X[i - 1]) * (Y[i] - Y[i - 1])) / Math.max(1e-6, X[i] - X[i - 1]); return Y[3] + (t - X[3]) * (Y[3] / X[3]); };
  const o = { dur: Y[3], keys: a.keys.map((q) => [m(q[0]), ...q.slice(1)]) };
  for (const f of TF) o[f] = Array.isArray(a[f]) ? [m(a[f][0]), m(a[f][1]), ...a[f].slice(2)] : a[f];

  for (const f of ['lunge', 'lunge2']) { const L = a[f]; if (Array.isArray(L)) { const t0 = m(L[0]), t1 = m(L[1]); o[f] = [t0, t1, L[2] * (L[1] - L[0]) / Math.max(1e-4, t1 - t0), ...L.slice(3)]; } else o[f] = L; }
  o.hits = a.hits ? a.hits.map((h) => [m(h[0]), m(h[1])]) : a.hits;
  o.sw = typeof a.sw === 'number' ? m(a.sw) : a.sw;
  o.tw = Array.isArray(a.tw) ? a.tw.map(m) : a.tw;
  o.z3 = Array.isArray(a.z3) ? a.z3.map((r) => [m(r[0]), ...r.slice(1)]) : a.z3;
  return o;
}
for (const n in MAP) {
  const a = ATK[n]; if (!a || !MOVES[MAP[n]]) continue;
  ORIG[n] = {}; for (const f of ['dur', 'keys', 'hits', 'sw', 'tw', 'z3', 'lunge', 'lunge2', ...TF]) ORIG[n][f] = a[f];
  NEW[n] = retimed(a, MAP[n]);
}


function apply(on) {
  if (K.on === on) return;
  K.on = on;
  for (const n in NEW) Object.assign(ATK[n], on ? NEW[n] : ORIG[n]);
  if (K.kzSet) K.kzSet(on);
}
K.apply = apply;

const WARP = new Map();
function playT(n, t) {
  let W = WARP.get(n);
  if (!W) {
    const a = ATK[n], id = PLAY[n], ph = MOVES[id].phases, ks = a.keys || [];
    const end = a.dur || (ks.length ? ks[ks.length - 1][0] : (a.active ? a.active[1] * 2 : 0.5));
    const A = a.active || [end * 0.3, end * 0.5];
    W = { X: [0, A[0], A[1], end], Y: [0, ph.active[0], ph.active[1], durOf(id)] };

    if (ph.hits && a.hits && a.hits.length === ph.hits.length) { W.X = [0]; W.Y = [0]; a.hits.forEach((h, i) => { W.X.push(h[0], h[1]); W.Y.push(ph.hits[i][0], ph.hits[i][1]); }); W.X.push(end); W.Y.push(durOf(id)); }
    WARP.set(n, W);
  }
  const { X, Y } = W, L = X.length;
  for (let i = 1; i < L; i++) if (t <= X[i]) return Y[i - 1] + ((t - X[i - 1]) * (Y[i] - Y[i - 1])) / Math.max(1e-6, X[i] - X[i - 1]);
  return Y[L - 1];
}
K.PLAY = PLAY; K.playT = playT;
K.why = (f) => { const k = KS.get(f); return k ? k.why || '' : ''; };
K.timing = () => Object.fromEntries(Object.keys(NEW).map((n) => [n, { was: [ORIG[n].active.map((v) => +(v / KF * 1000).toFixed(0)), +(ORIG[n].dur / KF * 1000).toFixed(0)], now: [NEW[n].active.map((v) => +(v / KF * 1000).toFixed(0)), +(NEW[n].dur / KF * 1000).toFixed(0)] }]));
apply(true);


const Pop0 = ND.anim.Pop, R3 = [0, 0, 0];
ND.anim.Pop = function () {
  const st = Pop0.apply(this, arguments), s0 = st.step;
  st.step = function (keys, get, dt, detect) { if (detect && get('kilic', R3)) detect = false; return s0.call(st, keys, get, dt, detect); };
  return st;
};

for (const f of g.F || []) for (const fn of ND.onLook || []) { try { fn(f); } catch (e) {                       } }


const KS = new WeakMap();
const ks = (f) => { let k = KS.get(f); if (!k) KS.set(f, (k = { w: 0, cur: null, lastCh: null, bl: null, prevP: null, feet: null, lastSt: '', stAtk: null, stT: 0, idleT: 0, entryOut: false, gh: 'Mid', hh: 'Body', shT: 0, g: { id: null, u: 0, S: 0, x: null, dir: 0 } })); return k; };

function gaitAt(k, rg, id, sp) {
  const G = k.g, Sw = strideOf(id, sp);
  if (G.x == null || G.dir !== rg.dir || (G.id && ((G.id === 'walkB') !== (id === 'walkB') || (G.id === 'run') !== (id === 'run')))) { G.u = 0; G.S = Sw; G.x = rg.x; G.live = {}; }
  if (!G.S) G.S = Sw;
  G.id = id; G.dir = rg.dir;
  const d = Math.abs(rg.x - G.x); G.x = rg.x;
  const u0 = G.u; G.u = (G.u + Math.min(0.2, d / Math.abs(G.S))) % 1;

  if ((u0 < 0.5 && G.u >= 0.5) || G.u < u0) G.S = Sw;
  if (id === 'run' && G.S < 0) G.S = Sw;
  if (MOVES[id].gait.kind !== 'walk') return { id, t: G.u * durOf(id), feet: gaitFeet(id, G.u, G.S) };

  const at = (s) => (k.feet && k.feet[s] ? [k.feet[s].x, k.feet[s].z] : [rg.x + MOVES.idle.feet[s][0] * rg.dir, MOVES.idle.feet[s][1]]);
  return { id, t: G.u * durOf(id), feet: walkFeetLive(G.live || (G.live = {}), G.u, G.S, rg.x, rg.dir, at) };
}


const ENV = { stuck: 'stuck', dodgePost: 'dodgePost' };
function airMove(f) {
  if (f.state === 'atk') { const id = PLAY[ATKID.get(f.atk)]; return !!(id && MOVES[id] && MOVES[id].air); }
  if (f.state === 'denv') { const c = f.dz && f.dz.env, id = c && ENV[c.a]; return !!(id && MOVES[id].air); }
  return false;
}




function turnT(f, id, t) {
  const M = MOVES[id];
  if (M.turnAt != null) { if (!f.turned) return Math.min(t, M.turnAt - 1); if (!f.mem || !f.mem.flip) return null; return Math.max(t, M.turnAt + 1); }
  if (M.turnFrom != null) { const o = f.opp; if (!o || (o.x >= f.x ? 1 : -1) === f.dir) return Math.min(t, M.turnFrom); }
  return t;
}
function guardH(f) {
  const o = f.opp;
  const kz = K.kzGuard && K.kzGuard(f); if (kz) return kz;
  if (o && o.state === 'atk' && D.threat) { const th = D.threat(o); if (th && th.h === 'high') return 'Hi'; if (th && th.h === 'low') return 'Low'; }
  return 'Mid';
}
function choose(f, k, gP, dt, rg) {
  if (!K.on || !f.ch || !WHO[f.ch.id]) return null;
  const st = f.state, out = !!(gP && gP.armed && !gP.inside);


  const sh = !!(f.wpn && f.wpn.iai && f.sheathed && f.sheathed());
  k.shT = sh ? k.shT + dt : 0;
  const shOK = sh && k.shT > 0.6;
  if (st !== k.lastSt || (st === 'atk' && f.atk !== k.stAtk)) {
    k.lastSt = st; k.stAtk = st === 'atk' ? f.atk : null; k.stT = 0; k.entryOut = out || (k.w > 0.5 && !!k.cur); k.startSh = sh || !!(k.lastSh && k.w > 0.5);
    if (st === 'block' || st === 'hurt') { const h = guardH(f); k.gh = h; k.hh = h === 'Hi' ? 'Hi' : 'Body'; }
    if (st === 'block' && k.cur && /^guard/.test(k.cur.id)) k.gh = k.cur.id.slice(5);
  } else {
    k.stT += dt;

    if ((st === 'block' || st === 'hurt') && f.st + 1e-6 < (k.pst || 0) && f.opp && K.kzId && K.kzId(f.opp.atk) === 'kz_kasumi') { const h = guardH(f); k.gh = h; k.hh = h === 'Hi' ? 'Hi' : 'Body'; }
  }
  k.pst = f.st;
  const fall = st === 'launch' || st === 'down' || st === 'getup';
  if (st !== 'move') k.g.x = null;
  k.why = '';


  const airOK = airMove(f);
  if (f.dead || f.hidden || (!fall && !airOK && (!f.onGround || f.y < -2)) || f.roll || !f.dz || f.dz.armed === false) { k.why = f.roll ? 'roll' : !f.onGround || f.y < -2 ? 'air' : f.dz && f.dz.armed === false ? 'unarmed' : 'x'; return null; }




  if (st === 'dbind' && out) {
    const c = f.dz.cine;
    if (c && !c.done && (c.def === f || c.att === f)) {
      const isDef = c.def === f;
      if (c.ph === 'bind') return { id: isDef ? 'bindDef' : 'bindAtt', t: c.t * 1000 };
      if (c.ph === 'strike') return { id: isDef ? 'makiDef' : 'flungAtt', t: c.t2 * 1000 };
    }
  }
  const zan = (st === 'zanshin' || st === 'dfinp') && out && !(f.dz.cine && !f.dz.cine.done && f.dz.cine.A && f.dz.cine.A !== f);



  if (!zan && (st === 'dseq' || (D.passing && (D.passing(f) || (f.opp && D.passing(f.opp)))))) { k.why = st === 'dseq' ? 'dseq' : 'pass'; return null; }
  const thr = st === 'atk' && ATKID.get(f.atk) === 'throw';




  const react = st === 'hurt' || st === 'stagger' || st === 'gbreak' || st === 'win';
  const shG = !!(f.wpn && f.wpn.iai && gP && gP.armed && gP.inside && (gP.bladeVis == null || gP.bladeVis < 10));
  const shR = (fall || react) && !out && !!(f.wpn && f.wpn.iai) && (sh || shG || (k.lastSh && k.w > 0.5));
  const free = ((fall || st === 'move' || thr) && (out || shOK || (thr && sh))) || shR || (st === 'win' && out);


  if (sh && k.shT <= 0.6 && (st === 'move' || st === 'land' || st === 'zanshin' || st === 'dfinp')) return { id: 'noto', t: k.shT * 1000 };

  if (st === 'dfinp' && sh) return { id: 'idle', t: k.stT * 1000, sh: true };


  if (st === 'atk' && PLAY[ATKID.get(f.atk)] && MOVES[PLAY[ATKID.get(f.atk)]].saya) { const n = ATKID.get(f.atk), t = turnT(f, PLAY[n], playT(n, f.st)); return t == null ? null : { id: PLAY[n], t }; }

  if (st === 'atk' && k.startSh && ATKID.get(f.atk) === 'ak_dNuki' && f.wpn && f.wpn.iai) return { id: 'nuki', t: (f.st * 1000) / KF };
  if (!k.entryOut && !zan && !free) { k.why = 'entry'; return null; }
  const fr = (T) => clamp(f.st / Math.max(0.05, T), 0, 1), shd = !out && (shOK || shR || (thr && sh));
  switch (st) {
    case 'atk': {
      if (thr) { if (!free && !sh) return null; const a = f.atk, T = a.dur || (a.keys && a.keys.length ? a.keys[a.keys.length - 1][0] : 0.44); return { id: 'throwL', t: fr(T) * durOf('throwL'), sh: shd }; }
      const n = ATKID.get(f.atk), id = MAP[n]; if (id) return { id, t: (f.st * 1000) / KF };

      if (k.startSh && f.atk.sheath) { k.why = 'saya'; return null; }
      if (!PLAY[n] || !MOVES[PLAY[n]]) return null;
      const t = turnT(f, PLAY[n], playT(n, f.st));
      if (t == null) { k.why = 'noturn'; return null; }
      return { id: PLAY[n], t };
    }




    case 'launch': return free ? (f._kzR === 'launchUp' || f._kzR === 'airHit' ? { id: f._kzR, t: f.st * 1000, sh: shd } : { id: 'fall', t: k.stT * 1000, sh: shd }) : null;
    case 'down': return free ? { id: 'downRise', t: f.st * 1000, sh: shd } : null;
    case 'getup': return free ? { id: 'downRise', t: (0.75 + f.st) * 1000, sh: shd } : null;
    case 'guard': { const id = 'guard' + guardH(f), M = MOVES[id]; return { id, t: Math.min(k.stT * 1000, M.keys[M.hold].t) }; }
    case 'block': return { id: 'block' + k.gh, t: fr(f.dur || 0.3) * durOf('blockMid') };

    case 'dodge': return { id: f.back ? 'dodgeB' : 'dodgeF', t: fr(0.36) * durOf('dodgeB') };

    case 'parry': { const d = f.pv && f.pv.dir, id = d === 'up' ? 'parryUp' : d === 'down' ? 'parryDown' : 'parrySide'; return { id, t: fr(0.2) * durOf(id) }; }
    case 'hurt': return { id: f._kzR === 'hurtLow' ? 'hurtLow' : 'hurt' + k.hh, t: fr(f.dur || 0.4) * durOf('hurtHi'), sh: shd };
    case 'stagger': return { id: 'stagger', t: fr(0.74) * durOf('stagger'), sh: shd };

    case 'gbreak': { const s = f.st, u = s < 0.15 ? (s / 0.15) * 0.1 : s < 1 ? 0.1 + ((s - 0.15) / 0.85) * 0.45 : 0.55 + Math.min(1, (s - 1) / 0.2) * 0.19; return { id: 'stagger', t: (u / 0.74) * durOf('stagger'), sh: shd }; }

    case 'win': return out ? { id: 'zanshin', t: k.stT * 1000 } : shd ? { id: 'idle', t: k.stT * 1000, sh: true } : null;
    case 'recoil': return { id: 'recoil', t: fr(f.rkEnd || 0.32) * durOf('recoil') };


    case 'lock': return { id: f.lockWin ? 'lockPush' : 'lock', t: k.stT * 1000 };
    case 'shove': return { id: 'shove', t: fr(0.3) * durOf('shove') };
    case 'clash': return { id: 'clash', t: fr(0.34) * durOf('clash') };

    case 'move': {
      if (!(out || shOK)) return null;
      const sp = f.vx * (f.dir < 0 ? -1 : 1);
      if (Math.abs(sp) < 40 || !rg) { k.g.x = null; k.idleT += dt; return { id: 'idle', t: k.idleT * 1000, sh: shd }; }
      return Object.assign(gaitAt(k, rg, sp > 260 ? 'run' : sp > 0 ? 'walkF' : 'walkB', sp), { sh: shd });
    }
    case 'zanshin': case 'dfinp': return zan ? { id: 'zanshin', t: k.stT * 1000 } : null;

    case 'land': return out ? { id: 'idle', t: k.stT * 1000 } : null;
    case 'denv': { const c = f.dz.env, id = c && ENV[c.a]; return id && out ? { id, t: c.t * 1000 } : null; }
    default: return null;
  }
}


function planFeet(k, rg, P, dt, gP) {
  const dir = rg.dir, gait = !!(k.cur && MOVES[k.cur.id] && MOVES[k.cur.id].gait);
  if (!k.feet) { k.feet = {}; for (const s of ['R', 'L']) { const p = (gP && gP['ft' + s]) || P['ft' + s]; k.feet[s] = { x: rg.x + p[0] * dir, y: 0, z: p[2], st: null }; } }
  const want = { R: P.ftR, L: P.ftL };
  const errOf = (s) => want[s][0] - (k.feet[s].x - rg.x) * dir;

  for (const s of ['R', 'L']) { const F = k.feet[s], d = want[s]; if (d[1] < -0.5 || P.ownFeet) { F.x = rg.x + d[0] * dir; F.y = d[1]; F.z = d[2]; F.st = null; F.own = true; } else if (F.own) { F.own = false; F.y = 0; } }
  const stepping = k.feet.R.st || k.feet.L.st;
  const reach = (s) => { const F = k.feet[s], h = P['hip' + s], q = [(F.x - rg.x) * dir, 0, F.z]; return Math.hypot(q[0] - h[0], q[1] - h[1], q[2] - h[2]) / 92; };

  const vx = k.px != null && dt > 0 ? (rg.x - k.px) / dt : 0; k.px = rg.x;
  const ahead = Math.abs(vx) * dt * 2 / 92;

  const quick = Math.abs(rg.vx || 0) > 150 ? 0.7 : 1;
  const go = (s) => { const F = k.feet[s], e = Math.abs(errOf(s)); F.st = { t: 0, T: clamp(0.1 + e / 500, 0.12, 0.22) * quick, x0: F.x, z0: F.z, h: Math.min(7, 2 + e * 0.12) }; };
  if (!stepping) {
    let best = null, be = 0;
    for (const s of ['R', 'L']) { const F = k.feet[s]; if (F.own) continue; const e = Math.abs(errOf(s)) + (reach(s) > (gait ? 0.99 : 0.97) ? 50 : 0); if (e > 7 && e > be) { best = s; be = e; } }
    if (best) go(best);
  }




  for (const s of ['R', 'L']) { const F = k.feet[s]; if (!F.st && !F.own && reach(s) + (gait ? 0 : ahead) > (gait ? 0.995 : 0.985)) go(s); }
  for (const s of ['R', 'L']) {
    const F = k.feet[s], d = want[s];
    if (F.st) {
      F.st.t += dt; const u = Math.min(1, F.st.t / F.st.T), w = smooth(u);

      if (u > 0.6 && F.st.tx == null) F.st.tx = rg.x + d[0] * dir;
      F.x = F.st.x0 + ((F.st.tx != null ? F.st.tx : rg.x + d[0] * dir) - F.st.x0) * w; F.z = F.st.z0 + (d[2] - F.st.z0) * w; F.y = -Math.sin(Math.PI * u) * F.st.h;
      if (u >= 1) { F.st = null; F.y = 0; }
    }
    layLeg(P, s, [(F.x - rg.x) * dir, F.y, F.z]);
  }
}

const JS = ['hip', 'hipR', 'hipL', 'knR', 'ftR', 'knL', 'ftL', 'chest', 'neck', 'head', 'shR', 'shL', 'elR', 'wrR', 'haR', 'elL', 'wrL', 'haL'];

function moveHands(P, d) {
  const wo = sub(P.wrR, P.haR);
  layArm(P, 'R', add(P.haR, d), sub(P.elR, lerp(P.shR, P.haR, 0.5)));
  P.wrR = add(P.haR, wo); P.blade = { h: P.haR, u: P.blade.u, e: P.blade.e };
}
function setBlade(P, u) { let e = sub(P.blade.e, mul(u, dot(P.blade.e, u))); e = V.len(e) > 1e-4 ? norm(e) : P.blade.e; P.blade = { h: P.haR, u, e }; }


function onHandle(P, grip) {
  const MX = LEN.uArm + LEN.fArm - 0.6;
  let T = madd(P.haR, P.blade.u, -grip);
  const dv = sub(T, P.shL), dl = V.len(dv);
  if (dl > MX) { moveHands(P, mul(dv, -(dl - MX) / dl)); T = madd(P.haR, P.blade.u, -grip); }
  const wo = sub(P.wrL, P.haL);
  layArm(P, 'L', T, sub(P.elL, lerp(P.shL, P.haL, 0.5)));
  P.wrL = add(P.haL, wo);
}




const MEET = { guardMid: 1, guardHi: 1, guardLow: 1, blockMid: 1, blockHi: 1, blockLow: 1, idle: 1, recoil: 1, stagger: 1, hurtHi: 1, hurtBody: 1, hurtLow: 1, zanshin: 1, walkF: 1, walkB: 1, run: 1, throwL: 1, parryUp: 1, parryDown: 1, parrySide: 1, dodgeB: 1, dodgeF: 1 };



const ZONE = { head: 28, neck: 30, chest: 26, shR: 24, shL: 24, hip: 26, knR: 14, knL: 14 }, ZONE_K = Object.keys(ZONE), FRONT_J = ['head', 'neck', 'chest', 'shR', 'shL', 'hip'];
function frontOf(f, rg) {
  const o = f.opp, ro = o && MD.rigOf(o), Q = ro && ro.P;
  if (!Q || o.dead || o.hidden) return null;
  let m = Infinity, z = Infinity;

  for (let i = 0; i < FRONT_J.length; i++) { const j = FRONT_J[i]; if (Q[j]) m = Math.min(m, (ro.x + Q[j][0] * ro.dir - rg.x) * rg.dir); }
  for (let i = 0; i < ZONE_K.length; i++) { const j = ZONE_K[i]; if (Q[j]) z = Math.min(z, (ro.x + Q[j][0] * ro.dir - rg.x) * rg.dir - ZONE[j]); }
  return { d: (ro.x - rg.x) * rg.dir, front: m, zone: z };
}
function meet(f, rg, P, BL, w) {
  if (!(w > 0.001) || !P.armed) return;
  const F = frontOf(f, rg);
  if (!F || !(F.d > 20 && F.d < BL + 160)) return;
  const u = P.blade.u;
  if (u[0] <= 0.02 || u[1] > 0.25) return;
  const maxRx = Math.min(F.d / 2 - 10, F.front - 30);
  if (P.haR[0] > maxRx) moveHands(P, [(maxRx - P.haR[0]) * w, 0, 0]);
  const lim = (F.zone - P.haR[0]) / BL;
  if (u[0] > lim) {
    const kk = Math.max(0, lim) / u[0], nx = u[0] * kk, nz = u[2] * kk, ny = -Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz));
    setBlade(P, norm(lerp(u, [nx, ny, nz], w)));
  }
}




const HMAX = 10, AMAX = 0.14;


function strikeNow(f, k) {
  if (f.state === 'atk' && f.atk) { const W = f.atk.hits || (f.atk.active ? [f.atk.active] : []); if (W.some((w) => f.st >= w[0] - 0.02 && f.st <= w[1] + 0.02)) return true; }
  return !!(k && k.cur && k.w >= 0.5 && MOVES[k.cur.id] && strikeAt(MOVES[k.cur.id], k.cur.t));
}
function settle(k, f, rg, o, dt, grip) {
  const q = k.so, u = o.blade && o.blade.u;
  k.sr = q && q.u && u && o.armed ? (f.state !== 'atk' ? 1 : 0) + (q.dir === rg.dir ? 2 : 0) : -1;


  const inAtk = f.state === 'atk';
  if (q && q.u && u && o.armed && (!inAtk || !strikeNow(f, k)) && q.dir === rg.dir && dt > 0 && dt < 0.05) {
    const sc = dt * 60, dh = sub(sub(o.haR, o.hip), q.h), dl = V.len(dh);


    const BL = (f.wpn && f.wpn.blade) || LEN.blade, F0 = frontOf(f, rg), tipX = () => o.haR[0] + o.blade.u[0] * BL, t0 = tipX();
    const keep = {}; for (const j of ['elR', 'wrR', 'haR', 'elL', 'wrL', 'haL']) keep[j] = o[j]; keep.blade = o.blade;
    let ch = false;
    if (!inAtk && dl > HMAX * sc) { moveHands(o, mul(dh, -(dl - HMAX * sc) / dl)); ch = true; }

    if (!K.gov1) { k.sc = ch ? 1 : 0; if (ch && o.gripL >= 0.999) onHandle(o, grip); k.so = { h: sub(o.haR, o.hip), u: o.blade.u, dir: rg.dir }; return; }


    const am = (inAtk ? BP_W : AMAX) * sc, a = Math.abs(Math.atan2(Math.sin(Math.atan2(o.blade.u[1], o.blade.u[0]) - Math.atan2(q.u[1], q.u[0])), Math.cos(Math.atan2(o.blade.u[1], o.blade.u[0]) - Math.atan2(q.u[1], q.u[0]))));
    if (a > am) { setBlade(o, turnU(q.u, o.blade.u, am)); ch = true; }
    k.sc = ch ? (!inAtk && dl > HMAX * sc ? 1 : 0) + (a > am ? 2 : 0) : 0;
    if (ch && o.gripL >= 0.999) onHandle(o, grip);
    if (ch && F0 && F0.d < BL + 160 && tipX() > F0.front - 10 && tipX() > t0 + 0.5) {



      const he = o.haR, ue = o.blade.u, lim0 = Math.max(F0.front - 10, t0), cands = [];
      for (let s = 0.1; s < 1.001; s += 0.1) { const hs = lerp(he, keep.haR, s), us = norm(lerp(ue, keep.blade.u, s)); if (hs[0] + us[0] * BL <= lim0 || s > 0.95) { cands.push({ h: hs, u: us }); break; } }
      const lim = (lim0 - he[0]) / BL;
      if (ue[0] > 0 && lim > -0.95) { const kk = Math.min(1, Math.max(0, lim) / ue[0]), nx = ue[0] * kk, nz = ue[2] * kk, ny = (ue[1] >= 0 ? 1 : -1) * Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz)); cands.push({ h: he, u: norm([nx, ny, nz]) }); }



      const ua = Math.atan2(ue[1], ue[0]), ka = Math.atan2(keep.blade.u[1], keep.blade.u[0]);
      if (Math.sign(Math.sin(ua)) !== Math.sign(Math.sin(ka)) && Math.abs(Math.sin(ka)) > 0.2) {
        const qa = Math.atan2(q.u[1], q.u[0]), dS = Math.atan2(Math.sin(ka - qa), Math.cos(ka - qa)), lu = flatDrawn(he, fromScr(qa - Math.sign(dS) * am, ue[2]), BL);
        if (he[0] + lu[0] * BL <= lim0) { setBlade(o, lu); if (o.gripL >= 0.999) onHandle(o, grip); k.so = { h: sub(o.haR, o.hip), u: o.blade.u, dir: rg.dir }; return; }
      }
      const pt = add(q.h, mul(q.u, BL)), cost = (c) => V.len(sub(add(sub(c.h, o.hip), mul(c.u, BL)), pt));
      let best = cands[0]; for (const c of cands) if (cost(c) < cost(best)) best = c;
      Object.assign(o, keep);
      moveHands(o, sub(best.h, o.haR)); setBlade(o, best.u); if (o.gripL >= 0.999) onHandle(o, grip);
    }
  }
  k.so = o.blade ? { h: sub(o.haR, o.hip), u: o.blade.u, dir: rg.dir } : null;
}


function clear(f, rg, P, BL, w) {
  if (!P.armed) return;
  const F = frontOf(f, rg);
  if (!F || !(F.d > 10 && F.d < BL + 160)) return;




  const kr = f.state === 'atk' && ks(f).cur && KRX.has(ks(f).cur.id);
  if (kr) { w *= smooth(clamp((0.62 - P.blade.u[1]) / 0.27, 0, 1)); if (!(w > 0)) return; }
  if (P.haR[0] > F.front - 12) moveHands(P, [(F.front - 12 - P.haR[0]) * w, 0, 0]);
  if (kr) { const ex = P.blade.u[0] - (Math.min(F.front - 6, F.zone + 6) - P.haR[0]) / BL; if (ex > 0) moveHands(P, [-Math.min(30, ex * BL) * w, 0, 0]); }
  const u = P.blade.u, lim = (Math.min(F.front - 6, F.zone + 6) - P.haR[0]) / BL;
  if (u[0] > 0 && u[0] > lim) {




    const k = ks(f), l = clamp(lim, -1, 1), sq = Math.sqrt(Math.max(0, 1 - l * l)), aUp = Math.atan2(-sq, l);
    if (!(k.clrW > 0) || k.clrA == null) k.clrA = Math.atan2((u[1] > 0 ? 1 : -1) * sq, l);
    k.clrW = 2;
    let a = k.clrA;

    if (Math.sin(a) > 0 && a < Math.PI / 2 && l >= 0.57) a = a + clamp(Math.atan2(sq, l) - a, -BP_W, BP_W);
    else if (Math.sin(a) > 0 || Math.cos(a) < 0 && Math.sin(a) >= 0) a = Math.min(a + BP_W, aUp + 2 * Math.PI);
    else a = a + clamp(wrapA(aUp - a), -BP_W, BP_W);
    a = wrapA(a);

    k.clrA = a;
    const t = flatDrawn(P.haR, fromScr(a, u[2]), BL);
    setBlade(P, w < 0.999 ? blendU(u, t, w) : t);
  }
}

function wrapA(d) { return Math.atan2(Math.sin(d), Math.cos(d)); }




const NOAIM = { kzAge: 1, kzTengu: 1, kzIai: 1, kasumi: 1, kage: 1, krArashi: 1, krKawara: 1, krToya: 1 };
function aimOn(rg, P) {
  const O = rg.ovr;
  if (!O || !(O.w > 0) || !P.armed) return;
  const wo = sub(P.wrR, P.haR);
  layArm(P, 'R', lerp(P.haR, O.h, O.w), sub(P.elR, lerp(P.shR, P.haR, 0.5)));
  P.wrR = add(P.haR, wo);
  const u = O.u ? blendU(P.blade.u, O.u, O.w) : P.blade.u;
  let e = O.e ? norm(lerp(P.blade.e, O.e, O.w)) : P.blade.e; e = norm(sub(e, mul(u, dot(e, u))));
  P.blade = { h: P.haR, u, e };
}
function mix(gP, P, w, grip) {
  if (w >= 0.999 || !gP || !gP.blade) return P;
  const o = { ...P };
  for (const j of JS) if (gP[j] && P[j]) o[j] = lerp(gP[j], P[j], w);
  for (const s of ['R', 'L']) {
    layLeg(o, s, o['ft' + s]);
    const wo = sub(o['wr' + s], o['ha' + s]);
    layArm(o, s, o['ha' + s], sub(o['el' + s], lerp(o['sh' + s], o['ha' + s], 0.5)));
    o['wr' + s] = add(o['ha' + s], wo);
  }

  const u = blendU(gP.blade.u, P.blade.u, w); let e = lerp(gP.blade.e, P.blade.e, w); e = norm(sub(e, mul(u, dot(e, u))));
  o.blade = { h: o.haR, u, e };
  if (w > 0.5 ? P.gripL >= 0.999 : gP.gripL >= 0.5) onHandle(o, grip);
  if (w <= 0.5) { o.armed = gP.armed; o.inside = gP.inside; o.bladeVis = gP.bladeVis; o.saya = gP.saya; o.gripL = gP.gripL; }
  return o;
}
function sayaFor(f, P, gP) {
  if (f.wpn && f.wpn.iai) return P.saya;
  if (!gP || !gP.saya) return P.saya;
  const d = sub(P.chest, gP.chest);
  return { ...gP.saya, a: add(gP.saya.a, d) };
}
const FLIPX = ['hx', 'hz', 'nx', 'nz', 'prx', 'prz', 'plx', 'plz', 'lx', 'lz', 'frx', 'frz', 'flx', 'flz'];
function flipCh(c) {
  const o = { ...c };
  o.py += 180; o.cy += 180; o.by += 180; o.raz += Math.PI; o.pt = -(o.pt || 0);
  if (o.bp != null) { o.bp = Math.PI - o.bp; o.bz = -(o.bz || 0); }
  for (const n of FLIPX) o[n] = -o[n];
  return o;
}

















const SB = { overhead: 1, kesaS: 1, gyakuS: 1, menS: 1 };
const SB_MAX = 30, SB_SINK = 0.3, SB_GROW = 4, HOLD_NEAR = 70, HOLD_MAX = 60, HOLD_V = 7;

const lowBackA = (q) => { const w = wrapA(q); return w > Math.PI / 2 + 0.1 || w < -Math.PI + 0.35; };
const s5 = (u) => { const v = clamp(u, 0, 1); return v * v * v * (v * (v * 6 - 15) + 10); };
function sbProf(M, t) {
  const W = M.phases.active[0], tb = Math.min(0.25 * W, 100), td = 0.7 * W;
  const H = t <= 0 ? 0 : t < tb ? s5(t / tb) : t < td ? 1 : t < W ? 1 - s5((t - td) / (W - td)) : 0;

  const Dr = t < td ? 1 : t < W ? 1 - s5((t - td) / (W - td)) : 0;
  return { H, Dr, L: t >= 0.03 * W && t < 0.9 * W, grow: t < td, pre: t < td };
}







function sbNeed(f, k, rg, BL, off = 0) {
  const P = k.prevP, g = k.g2, o = f.opp, ro = o && MD.rigOf(o), Q = ro && ro.P;
  if (!P || !P.haR || !g || g.a == null || !Q || !Q.head || !Q.neck || !Q.hip || o.dead || o.hidden) return { s: 0, a0: null };
  const a0 = wrapA(g.a);

  if (!(a0 > -1.25 && a0 < 2.9)) return { s: 0, a0 };

  const from = Math.min(a0, 1.2);
  const hd = Mo.project(ro, Q.head), nk = Mo.project(ro, Q.neck), hp = Mo.project(ro, Q.hip), h = [P.haR[0] + off, P.haR[1], P.haR[2]];
  const blocked = (s) => {
    for (let a = from; a >= -Math.PI / 2 - 1e-6; a -= 0.1) {
      const c = Math.cos(a), sn = Math.sin(a);
      for (let i = 2; i <= 10; i++) {
        const kk = 4 + (BL - 4) * i / 10, q = Mo.project(rg, [h[0] - s + c * kk, h[1] + sn * kk, h[2]]);
        if (Math.hypot(q.x - hd.x, q.y - hd.y) < 15 || (kk > 24 && segD2(q, hp, nk) < 17)) return true;
      }
    }
    return false;
  };
  if (!blocked(0)) return { s: 0, a0 };
  for (let s = 2; s <= SB_MAX; s += 2) if (!blocked(s)) return { s, a0 };
  return { s: SB_MAX, a0 };
}
function stepBack(f, k, rg, want, ch, BL) {
  const M = MOVES[want.id];
  if (!(f.state === 'atk' && SB[want.id] && M.phases && !K.sbOff)) { k.sb = null; return; }

  const fresh = !k.sb || k.sb.atk !== f.atk || k.sb.id !== want.id || f.st < k.sb.st - 1e-6;
  if (fresh) { const F0 = frontOf(f, rg); k.sb = { atk: f.atk, id: want.id, s: 0, st: f.st, g0: F0 ? F0.d : null, near: !!F0 && F0.d < BL + HOLD_NEAR, hold: 0, Xp: 0, lb: !!(k.g2 && k.g2.a != null && (lowBackA(k.g2.a) || wrapA(k.g2.a) > Math.PI / 2 - 0.2)) }; }
  const sb = k.sb, pr = sbProf(M, want.t);
  sb.st = f.st;

  if (sb.near && pr.pre && !K.holdOff) { const F = frontOf(f, rg); if (F) sb.hold = clamp(sb.g0 - F.d, sb.hold, Math.min(HOLD_MAX, sb.hold + HOLD_V)); }
  const hold = sb.hold * pr.Dr;
  if (pr.grow) {
    const nd = sbNeed(f, k, rg, BL, sb.Xp - hold);


    sb.s = Math.min(sb.s + SB_GROW, Math.max(sb.s, nd.a0 != null && nd.a0 >= 1.65 ? 0 : nd.s));
  }
  const st = sb.s > 0.5 ? sb.s * pr.H : 0;
  sb.Xp = hold + st;
  if (!(sb.Xp > 0.05)) return;
  ch.hx -= hold + st; ch.hy += SB_SINK * st;
  const fL = footAt(M, 'L', want.t), fR = footAt(M, 'R', want.t);
  want.feet = { R: [fR[0] - hold, fR[1], fR[2]], L: [fL[0] - hold - (pr.L ? sb.s * (sb.s > 0.5 ? 1 : 0) : 0), fL[1], fL[2]] };
  K.sbN = (K.sbN || 0) + 1;
}







const SPA = new Set(['overhead', 'horizontal', 'diagonal', 'thrust', 'kesaS', 'gyakuS', 'menS', 'yokoL', 'tsukiS', 'nuki', 'kiriR', 'kiriL', 'sune',
  'tsubame', 'renga', 'oroshi', 'sandan', 'kasumi', 'kuruma', 'kzIai',
  'krArashi', 'krKawara', 'krToya']);
const SPR = new Set(['hurt', 'stagger', 'block', 'guard', 'recoil', 'parry']);







const REACT = new Set(['hurt', 'stagger', 'block', 'down', 'getup']);
const SP_PAD = 36, SP_MAX = 80, SP_V = 6, SP_VH = 7;



const KRX = new Set(['krArashi', 'krKawara', 'krToya']), KR_PAD = 30;



const inCut = (id, t) => { const ph = MOVES[id] && MOVES[id].phases; return !!ph && t >= ((ph.hits && ph.hits[0]) || ph.active)[0] - 40; };
function spacing(f, k, rg, want, ch, BL) {
  const o = f.opp, ro = o && MD.rigOf(o), ko = o && ks(o), M = MOVES[want.id];
  k.hxRaw = ch.hx;
  let tgt = 0;
  const krA = f.state === 'atk' && KRX.has(want.id);
  if (o && ro && !o.dead && !o.hidden && !rg.y && (!ro.y || krA) && !M.ownFeet && !K.spOff) {
    const meAtk = f.state === 'atk' && SPA.has(want.id) && inCut(want.id, want.t), heAtk = o.state === 'atk' && ko && ko.cur && SPA.has(ko.cur.id) && inCut(ko.cur.id, ko.cur.t);
    const kr = meAtk && KRX.has(want.id);
    const meOk = meAtk || SPR.has(f.state), heOk = heAtk || SPR.has(o.state) || kr;
    const cut = (meAtk || heAtk) && meOk && heOk, meR = REACT.has(f.state), heR = REACT.has(o.state);
    if (cut || meR || heR) {
      const oBL = (o.wpn && o.wpn.blade) || LEN.blade;

      const BLa = cut ? (meAtk ? BL : oBL) : Math.max(BL, oBL), D = (ro.x - rg.x) * rg.dir;
      const need = clamp(SP_PAD + (kr ? KR_PAD : 0) + BLa - (D - (ch.hx || 0) - ((ko && ko.hxRaw) || 0)), 0, SP_MAX);

      const oM = ko && ko.cur && ko.w >= 0.5 && MOVES[ko.cur.id], oCan = !!oM && !oM.ownFeet;
      const share = !oCan || (kr && !heAtk && !SPR.has(o.state)) ? 1 : cut ? (meAtk && heAtk ? 0.5 : meAtk ? (SPR.has(o.state) ? 0.3 : 0.5) : (SPR.has(f.state) ? 0.7 : 0.5)) : meR && heR ? 0.5 : meR ? 0.7 : 0.3;
      tgt = need * share;
      k.spT = +need.toFixed(0);
    } else k.spT = 0;
  }
  const v = (SPR.has(f.state) && tgt > (k.sp || 0) ? SP_VH : SP_V) * Math.min(3, 60 * (K.dt || 1 / 60)) * (f.state === 'atk' && KRX.has(want.id) ? 2 : 1);
  k.sp = (k.sp || 0) + clamp(tgt - (k.sp || 0), -v, v);
  if (!(k.sp > 0.05)) { k.sp = 0; return; }
  ch.hx -= k.sp;
  if (M.ownFeet) return;
  const fe = want.feet || { R: footAt(M, 'R', want.t), L: footAt(M, 'L', want.t) };
  want.feet = { R: [fe.R[0] - k.sp, fe.R[1], fe.R[2]], L: [fe.L[0] - k.sp, fe.L[1], fe.L[2]] };
}
function ours(f, rg, gP, dt) {
  const k = ks(f);
  K.dt = dt;
  const want = choose(f, k, gP, dt, rg);



  if (want && !k.calls) k.w = 1;
  k.calls = (k.calls || 0) + 1;
  k.w = clamp(k.w + ((want ? 1 : -1) * dt) / FADE, 0, 1);
  if (!want && (k.w <= 0 || !k.cur)) { k.cur = null; k.feet = null; k.prevP = null; k.w = 0; k.so = null; k.px = null; k.dirW = null; k.fol = null; return null; }


  if (k.dirW != null && rg.dir !== k.dirW && k.lastCh) { k.lastCh = flipCh(k.lastCh); k.bl = { from: k.lastCh, t: 0 }; k.prevP = null; if (k.fol) flipFollow(k.fol); }
  k.dirW = rg.dir;
  let ch;
  if (want) {
    const c = chAt(want.id, want.t, (f.wpn && f.wpn.blade) || LEN.blade);
    if (k.cur && k.cur.id !== want.id && k.lastCh) { k.bl = { from: k.lastCh, t: 0 }; K.moves++; }
    if (k.bl) { k.bl.t += dt; const u = clamp(k.bl.t / CHX, 0, 1); ch = u >= 1 ? c : blendCh(k.bl.from, c, smooth(u)); if (u >= 1) k.bl = null; } else ch = c;


    if (ch !== c) ch.bp = c.bp;
    if (!k.fol) { k.fol = {}; if (k.lastCh && k.lastCh.bp != null) { k.fol.e = k.lastCh.bp - (k.lastCh.pt || 0) * Math.PI / 180; k.fol.lock = true; } }
    if (ch === c) ch = { ...c };
    stepBack(f, k, rg, want, ch, (f.wpn && f.wpn.blade) || LEN.blade);
    spacing(f, k, rg, want, ch, (f.wpn && f.wpn.blade) || LEN.blade);
    followCh(k.fol, ch, dt, strikeAt(MOVES[want.id], want.t));
    k.cur = want; k.lastCh = ch;
  } else ch = k.lastCh;
  const grip = gripOf(f.wpn), BL = (f.wpn && f.wpn.blade) || LEN.blade;
  if (want) { k.lastFeet = want.feet || null; k.lastSh = !!want.sh; }
  const P = poseFromCh(k.cur.id, ch, k.cur.t, k.prevP, { grip, feet: k.lastFeet || undefined, sheathed: k.lastSh });
  k.dbg = ''; dbgA(k, 'b', P);
  planFeet(k, rg, P, dt, gP);
  P.saya = k.lastSh ? P.saya : sayaFor(f, P, gP);


  if (rg.y) {
    for (const j of JS) P[j] = [P[j][0], P[j][1] + rg.y, P[j][2]];
    if (P.blade && P.blade.h) P.blade = { ...P.blade, h: [P.blade.h[0], P.blade.h[1] + rg.y, P.blade.h[2]] };
    if (P.saya && P.saya.a) P.saya = { ...P.saya, a: [P.saya.a[0], P.saya.a[1] + rg.y, P.saya.a[2]] };
  }
  k.mw = clamp((k.mw || 0) + ((want ? MEET[want.id] : MEET[k.cur.id]) ? 1 : -1) * dt / 0.1, 0, 1);
  meet(f, rg, P, BL, smooth(k.mw)); dbgA(k, 'm', P);







  const wind = f.state === 'atk' && (k.cur.id === 'kesaS' || k.cur.id === 'gyakuS' || (k.cur.id === 'menS' && !K.menAim)) && !inCut(k.cur.id, k.cur.t);
  if (!wind && !(NOAIM[k.cur.id] && !(f.opp && (f.opp.state === 'block' || f.opp.state === 'guard')))) aimOn(rg, P);
  dbgA(k, 'a', P);
  k.clrW = Math.max(0, (k.clrW || 0) - 1);
  if (f.state === 'atk' && f.atk && f.atk.active) { const w2 = clamp((f.st - f.atk.active[1]) / 0.03, 0, 1); if (w2 > 0) clear(f, rg, P, BL, smooth(w2)); dbgA(k, 'c', P); }
  if (P.gripL >= 0.999) onHandle(P, grip);
  k.prevP = P;
  const out = mix(gP, P, smooth(k.w), grip); dbgA(k, 'x', out);


  if (k.w >= 0.5) out.kilic = [1, 0, 0]; else delete out.kilic;
  out.kilicW = k.w;


  k.pre = { o: out, blade: out.blade, elR: out.elR, haR: out.haR, wrR: out.wrR };
  K.frames++;
  return out;
}


function dbgA(k, s, P) { if (K.trace && k && P && P.blade && P.blade.u) k.dbg += s + Math.atan2(P.blade.u[1], P.blade.u[0]).toFixed(2) + ' '; }
const build1 = Mo.Rig.prototype.build;







const OWNF = ['kilic', 'kilicW', 'kneeUp', 'fP', 'draw', 'reachR', 'reachL', 'gripErr', 'legReachR', 'legReachL'];
Mo.Rig.prototype.build = function (F, dt) {
  if (this.P && (this.P.kilic || this.P.kilicW != null)) { const q = { ...this.P }; for (let i = 0; i < OWNF.length; i++) if (q[OWNF[i]] !== undefined) q[OWNF[i]] = undefined; this.P = q; }
  const gP = build1.call(this, F, dt), f = this.look;
  if (!K.on || !this.driven || !f || !f.dz) return gP;
  try { return ours(f, this, gP, dt || 0) || gP; } catch (e) { K.errors++; if (K.errors < 4) console.error('kilic', e); return gP; }
};









const rotZ = (u, a) => { const c = Math.cos(a), sn = Math.sin(a); return norm([u[0] * c - u[1] * sn, u[0] * sn + u[1] * c, u[2]]); };
function segD2(p, a, b) { const abx = b.x - a.x, aby = b.y - a.y, t = clamp(((p.x - a.x) * abx + (p.y - a.y) * aby) / Math.max(1e-9, abx * abx + aby * aby), 0, 1); return Math.hypot(p.x - a.x - abx * t, p.y - a.y - aby * t); }






function xSeg(a, b, c, d) {
  const r1 = b.x - a.x, r2 = b.y - a.y, s1 = d.x - c.x, s2 = d.y - c.y, den = r1 * s2 - r2 * s1;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * s2 - (c.y - a.y) * s1) / den, v = ((c.x - a.x) * r2 - (c.y - a.y) * r1) / den;
  return t >= 0 && t <= 1 && v >= 0 && v <= 1 ? { x: a.x + r1 * t, y: a.y + r2 * t } : null;
}
function ownCross(P, h, u, BL, iai) {
  if (!P.hip || !P.neck) return null;
  const fr = Mo.bladeFront(P, h, u, BL);
  if (!fr.T && !fr.R && !fr.L) return null;
  const cam = Mo.cam, pr = (p) => { const s = cam / (cam - p[2]); return { x: p[0] * s, y: p[1] * s }; };
  const a = pr(madd(h, u, 14)), b = pr(madd(h, u, BL));
  const sy = iai && P.saya && P.saya.a ? [pr(P.saya.a), pr(madd(P.saya.a, P.saya.u, P.saya.L || 80))] : null;
  const ok = (q) => q && !(sy && segD2(q, sy[0], sy[1]) < 8);
  if (fr.T && ok(xSeg(a, b, pr(P.hip), pr(P.neck)))) return 'torso';
  if (fr.R && ok(xSeg(a, b, pr(P.hipR), pr(P.knR)))) return 'thighR';
  if (fr.L && ok(xSeg(a, b, pr(P.hipL), pr(P.knL)))) return 'thighL';
  return null;
}
const ownPen = (P, h, u, BL, f) => (ownCross(P, h, u, BL, !!(f && f.wpn && f.wpn.iai)) ? 1 : -1);
K.ownCross = ownCross;
function faceGuard(f, rg, P, kd) {
  const o = f.opp, ro = o && MD.rigOf(o), Q = ro && ro.P, g0 = kd.ga || 0;
  kd.ga = 0; kd.gaD = -g0;
  if (!Q || !Q.head || o.dead || o.hidden || !P.armed || P.inside || !P.blade || !P.blade.h || kd.gdir !== rg.dir) { kd.gdir = rg.dir; return; }
  const BL = (f.wpn && f.wpn.blade) || LEN.blade, h = P.blade.h;
  const hd = Mo.project(ro, Q.head), nk = Mo.project(ro, Q.neck), hp = Mo.project(ro, Q.hip), own = Mo.project(rg, P.head);

  const near = Math.abs(hd.x - Mo.project(rg, h).x) <= BL * 1.6 + 40;
  const cut = f.state === 'atk' && f.atk && f.atk.active && f.st >= f.atk.active[0] - 0.02 && f.st <= f.atk.active[1] + 0.02;

  const self = !cut && !K.ownOff;



  const stopZ = near && kd.stopMem > 0;
  const LGZ = stopZ ? [['hipR', 'knR', 9], ['hipL', 'knL', 9], ['knR', 'ftR', 7], ['knL', 'ftL', 7]].filter(([a, b]) => Q[a] && Q[b]).map(([a, b, r]) => [Mo.project(ro, Q[a]), Mo.project(ro, Q[b]), r]) : null;


  const a0 = Math.atan2(P.blade.u[1], P.blade.u[0]), down0 = Math.abs(wrapA(a0 - Math.PI / 2)) < 0.55;
  const bad = (u) => {
    let m = -1e9;
    for (let i = 1; i <= 12; i++) {
      const k = 4 + (BL - 4) * i / 12, q = Mo.project(rg, [h[0] + u[0] * k, h[1] + u[1] * k, h[2] + u[2] * k]);
      m = Math.max(m, 14 - Math.hypot(q.x - own.x, q.y - own.y));
      if (near) m = Math.max(m, (stopZ ? 20 : 15) - Math.hypot(q.x - hd.x, q.y - hd.y));
      if (near && !cut && k > (stopZ ? 20 : 24)) m = Math.max(m, (stopZ ? 25 : 17) - segD2(q, hp, nk));
      if (stopZ) { m = Math.max(m, 14 - segD2(q, nk, hd), q.y + 2); for (const [a, b, r] of LGZ) m = Math.max(m, r - segD2(q, a, b)); }
    }
    if (self) m = Math.max(m, ownPen(P, h, u, BL, f));
    if (!down0 && Math.abs(wrapA(Math.atan2(u[1], u[0]) - Math.PI / 2)) < 0.55) m = Math.max(m, 0.25);
    return m;
  };
  if (!near && !self) return;
  const u0 = P.blade.u;
  let a = Math.sign(g0) * Math.max(0, Math.abs(g0) - 0.06);
  if (bad(rotZ(u0, a)) > 0) {

    const s0 = Math.sign(g0) || 1;
    let got = null, least = null, lv = Infinity;
    for (let i = 1; i <= 36 && got == null; i++) for (const sg of g0 ? [s0, -s0] : [1, -1]) {
      const c = (g0 ? Math.abs(g0) * s0 : 0) + sg * i * 0.04;
      if (Math.abs(c) > 1.45) continue;
      const v = bad(rotZ(u0, c));
      if (v <= 0) { got = c; break; }

      if (stopZ && v < lv) { lv = v; least = c; }
    }
    if (got == null) a = least != null && lv < bad(rotZ(u0, g0)) ? least : g0; else a = got;


    a = clamp(a, g0 - 0.15, g0 + 0.15);
  }
  kd.ga = a; kd.gaD = a - g0;
  if (a) { setBlade(P, rotZ(u0, a)); K.guarded = (K.guarded || 0) + 1; }
}





function unStop(f, k, P) {
  const q = k.pre;
  k.stopMem = Math.max(0, (k.stopMem || 0) - 1);
  if (!q || q.o !== P || !P.blade || !q.blade || P.blade === q.blade || !P.armed || P.inside) return;
  if (strikeS(f, k, P)) return;
  setBlade(P, q.blade.u);
  k.stopMem = 8; K.unstop = (K.unstop || 0) + 1;
}




function krKeep(f, k, P) {
  if (!(k && k.cur && KRX.has(k.cur.id) && f.state === 'atk' && f.atk && f.opp && (f.opp.state === 'hurt' || f.opp.state === 'launch'))) return;
  const W = f.atk.hits || (f.atk.active ? [f.atk.active] : []);
  if (!(W.length > 0 && f.st >= W[W.length - 1][0])) return;
  const q = k.pre;
  if (!q || q.o !== P || !P.blade || !q.blade || P.blade === q.blade || !P.armed || P.inside) return;
  setBlade(P, q.blade.u);
}


function strikeS(f, k, P) {
  if (f.state === 'atk' && f.atk) { const W = f.atk.hits || (f.atk.active ? [f.atk.active] : []); if (W.some((w) => f.st >= w[0] - 0.02 && f.st <= w[1] + 0.02)) return true; }
  return !!(P && P.kilic && P.kilicW >= 0.999 && k && k.cur && MOVES[k.cur.id] && strikeAt(MOVES[k.cur.id], k.cur.t));
}







const GOV_W = 0.26;
function govBad(f, rg, P, u) {
  const o = f.opp, ro = o && MD.rigOf(o), Q = ro && ro.P, BL = (f.wpn && f.wpn.blade) || LEN.blade, h = P.blade.h;
  const own = P.head ? Mo.project(rg, P.head) : null;
  const cut = f.state === 'atk' && f.atk && f.atk.active && f.st >= f.atk.active[0] - 0.02 && f.st <= f.atk.active[1] + 0.02;
  const far = noOpp || !Q || !Q.head || o.dead || o.hidden;
  const hd = far ? null : Mo.project(ro, Q.head), nk = far ? null : Mo.project(ro, Q.neck), hp = far ? null : Mo.project(ro, Q.hip);
  let m = -1e9;
  for (let i = 1; i <= 10; i++) {
    const k = 4 + (BL - 4) * i / 10, q = Mo.project(rg, [h[0] + u[0] * k, h[1] + u[1] * k, h[2] + u[2] * k]);
    if (own) m = Math.max(m, 14 - Math.hypot(q.x - own.x, q.y - own.y));
    if (hd) { m = Math.max(m, 15 - Math.hypot(q.x - hd.x, q.y - hd.y)); if (!cut && k > 24) m = Math.max(m, 17 - segD2(q, hp, nk)); }
  }

  const ow = !cut && !K.ownOff && ownPen(P, h, u, BL, f) > 0 ? 1 : 0;
  return m > 0 ? 2 + m : ow;
}




const DOWN_W = 0.55, DOWN_V = 0.15;
function govern(f, k, rg, P) {
  if (!P || !P.blade || !P.blade.u || !P.armed || P.inside || f.dead || f.hidden) { k.gv = null; return; }
  const u = P.blade.u, a = Math.atan2(u[1], u[0]);
  let g = k.gv;
  k.gvD = 0;


  if (!g || strikeS(f, k, P) || g.dir !== rg.dir) { k.gv = { a, dir: rg.dir }; return; }
  const d = wrapA(a - g.a);
  const nw = P.kilic && k.cur && MOVES[k.cur.id];
  const own = nw && k.pre && k.pre.o === P && k.pre.blade && k.pre.blade.u ? Math.atan2(k.pre.blade.u[1], k.pre.blade.u[0]) : null;
  const okDown = nw && ((MOVES[k.cur.id].rest || []).some(([t0, t1]) => k.cur.t >= t0 && k.cur.t <= t1) || (own != null && Math.abs(wrapA(own - Math.PI / 2)) < DOWN_W));



  const inB = (c) => Math.abs(wrapA(c - Math.PI / 2)) < DOWN_W, tIn = !okDown && inB(a), v0 = g.v || 0;
  const dpen = (c) => {
    if (okDown || !inB(c)) return 0;
    const st = wrapA(c - g.a);
    if (!tIn && Math.abs(st) >= DOWN_V && !(inB(g.a) && Math.abs(v0) >= DOWN_V && Math.sign(st) !== Math.sign(v0))) return 0;
    return 1 + 20 * (DOWN_W - Math.abs(wrapA(c - Math.PI / 2)));
  };
  if (Math.abs(d) <= GOV_W && !dpen(a)) { g.v = d; g.a = a; return; }


  const sg = Math.sign(d) || 1;
  let best = null, bs = Infinity;
  for (let j = 0; j <= 12; j++) {
    const c = g.a + sg * GOV_W - sg * (2 * GOV_W) * j / 12, uc = rotZ(u, wrapA(c - a)), b = govBad(f, rg, P, uc);
    const sc = (b > 0 ? 100 * b : 0) + 10 * dpen(c) + Math.abs(wrapA(c - a));
    if (sc < bs) { bs = sc; best = c; }
  }
  const dd = wrapA(best - a);
  g.v = wrapA(best - g.a); g.a = best; k.gvD = dd;
  setBlade(P, rotZ(u, dd)); if (P.gripL >= 0.999) onHandle(P, gripOf(f.wpn)); K.gov = (K.gov || 0) + 1;
}










const PQ = { x: 0, y: 0, s: 1 };
function pjAt(rg, h, u, k) {
  const cam = Mo.cam, cx = rg.x, s = cam / (cam - (h[2] + u[2] * k)), wx = rg.x + (h[0] + u[0] * k) * rg.dir;
  PQ.x = cx + (wx - cx) * s; PQ.y = 0 + ((h[1] + u[1] * k) - 0) * s; PQ.s = s;
  return PQ;
}
function badPre(f, rg, P) {
  const o = f.opp, ro = o && MD.rigOf(o), Q = ro && ro.P;
  const far = !Q || !Q.head || o.dead || o.hidden;
  return { own: P.head ? Mo.project(rg, P.head) : null, cut: f.state === 'atk' && f.atk && f.atk.active && f.st >= f.atk.active[0] - 0.02 && f.st <= f.atk.active[1] + 0.02,
    hd: far ? null : Mo.project(ro, Q.head), nk: far ? null : Mo.project(ro, Q.neck), hp: far ? null : Mo.project(ro, Q.hip) };
}
function badAt(f, rg, P, BL, c, noOpp, pre) {
  const h = P.blade.h, u = rotToScr(h, P.blade.u, BL, c), B = pre || badPre(f, rg, P);
  const own = B.own, cut = B.cut, hd = B.hd, nk = B.nk, hp = B.hp;
  let m = -1e9;

  m = Math.max(m, (h[1] + u[1] * BL + 3) / 2);
  for (let i = 1; i <= 10; i++) {
    const k = 4 + (BL - 4) * i / 10, q = pjAt(rg, h, u, k);
    if (own) m = Math.max(m, 14 - Math.hypot(q.x - own.x, q.y - own.y));
    if (hd) { m = Math.max(m, 15 - Math.hypot(q.x - hd.x, q.y - hd.y)); if (!cut && k > 24) m = Math.max(m, 17 - segD2(q, hp, nk)); }
  }
  if (m > 0) return 1 + m / 10;
  return !cut && !K.ownOff && ownPen(P, h, u, BL, f) > 0 ? 0.3 : 0;
}


function inOppAt(f, rg, P, BL, c) {
  const o = f.opp, ro = o && MD.rigOf(o), Q = ro && ro.P;
  if (!Q || !Q.head || !Q.neck || !Q.hip || o.dead || o.hidden) return false;
  if (f.state === 'atk' && f.atk && f.atk.active && f.st >= f.atk.active[0] - 0.02 && f.st <= f.atk.active[1] + 0.02) return false;
  const h = P.blade.h, u = rotToScr(h, P.blade.u, BL, c), hd = Mo.project(ro, Q.head), nk = Mo.project(ro, Q.neck), hp = Mo.project(ro, Q.hip);
  for (let i = 1; i <= 10; i++) {
    const k = 4 + (BL - 4) * i / 10, q = pjAt(rg, h, u, k);
    if (Math.hypot(q.x - hd.x, q.y - hd.y) < 15 || (k > 24 && segD2(q, hp, nk) < 17)) return true;
  }
  return false;
}
function govern2(f, k, rg, P) {
  if (!P || !P.blade || !P.blade.u || !P.blade.h || !P.armed || P.inside || f.dead || f.hidden) { k.g2 = null; return; }
  const BL = (f.wpn && f.wpn.blade) || LEN.blade, h = P.blade.h, a = scrP(h, P.blade.u, BL);
  let g = k.g2;


  if (g && g.dir0 !== rg.dir) { if (g.a != null) g.a = Math.PI - g.a; g.dir = -(g.dir || 0); g.v = -(g.v || 0); if (g.lastP != null) g.lastP = Math.PI - g.lastP; if (g.lt != null) g.lt = Math.PI - g.lt; g.legS = -(g.legS || 0); g.buL = 0; }
  if (!g) g = k.g2 = {};
  g.dir0 = rg.dir;
  const rest = !!(P.kilic && P.kilicW >= 0.999 && k.cur && MOVES[k.cur.id] && (MOVES[k.cur.id].rest || []).some(([t0, t1]) => k.cur.t >= t0 && k.cur.t <= t1));
  const dPass = !!(P.kilic && P.kilicW >= 0.999 && k.cur && MOVES[k.cur.id] && (MOVES[k.cur.id].downPass || []).some(([t0, t1]) => k.cur.t >= t0 && k.cur.t <= t1));

  const raw = P.kilic && P.kilicW >= 0.999 && k.pre && k.pre.o === P && k.pre.blade && k.pre.blade.u ? scrP(h, k.pre.blade.u, BL) : null;


  const J = P.kilic && P.kilicW >= 0.999 && k.cur && MOVES[k.cur.id] && MOVES[k.cur.id].jump;
  const jumpNow = !!(J && J.some(([t0, t1]) => k.cur.t >= t0 && k.cur.t <= t1 + 18));





  const backUp = !K.backOff && !!(P.kilic && P.kilicW >= 0.999 && k.cur && SB[k.cur.id] && k.sb && k.sb.lb && k.sb.id === k.cur.id && f.state === 'atk' && k.cur.t < MOVES[k.cur.id].phases.active[0]);

  const BP = badPre(f, rg, P);
  const c = govStep(g, a, { strike: strikeS(f, k, P) || jumpNow, okDown: rest, downPass: dPass, backUp, raw: K.rawOff ? null : raw, inOpp: K.oppOff ? null : (q) => inOppAt(f, rg, P, BL, q), bad: (q) => { const b = badAt(f, rg, P, BL, q, false, BP); return backUp && b < 0.5 ? 0 : b; },


    pass: (q) => badAt(f, rg, P, BL, q, true, BP) === 0 });
  k.gvD = wrapA(c - a);
  if (Math.abs(k.gvD) > 1e-4) { setBlade(P, rotToScr(h, P.blade.u, BL, c)); if (P.gripL >= 0.999) onHandle(P, gripOf(f.wpn)); K.gov = (K.gov || 0) + 1; }
}

function govMem(f, k, rg, P) { const g = k.g2; if (!g || !P || !P.blade || !P.blade.h || !P.armed || P.inside) return; g.a = scrP(P.blade.h, P.blade.u, (f.wpn && f.wpn.blade) || LEN.blade); }






function zoneOwn(P, h, u, BL) {
  const cam = Mo.cam, pr = (p) => { const s = cam / (cam - p[2]); return { x: p[0] * s, y: p[1] * s }; };
  const hp = pr(P.hip), nk = pr(P.neck), hR = pr(P.hipR), kR = pr(P.knR), hL = pr(P.hipL), kL = pr(P.knL);
  for (let i = 0; i <= 10; i++) { const q = pr(madd(h, u, 14 + ((BL - 14) * i) / 10)); if (segD2(q, hp, nk) < 18 || segD2(q, hR, kR) < 9 || segD2(q, hL, kL) < 9) return true; }
  return false;
}
function behind(f, rg, P, kd) {
  const was = kd.beh; kd.beh = false;
  if (K.ownOff || !P.armed || P.inside || !P.blade || !P.blade.h) return;
  const cut = f.state === 'atk' && f.atk && f.atk.active && f.st >= f.atk.active[0] - 0.02 && f.st <= f.atk.active[1] + 0.02;
  if (cut) return;
  const BL = (f.wpn && f.wpn.blade) || LEN.blade, h = P.blade.h, u = P.blade.u, iai = !!(f.wpn && f.wpn.iai);
  if (!(ownCross(P, h, u, BL, iai) || (was && zoneOwn(P, h, u, BL)))) return;
  const fr0 = Mo.bladeFront(P, h, u, BL);
  if (!fr0.T && !fr0.R && !fr0.L) { kd.beh = true; return; }


  if (!K.behNew) {
    const cam = Mo.cam, t0 = madd(h, u, BL), s0 = cam / (cam - t0[2]), X = t0[0] * s0, Y = t0[1] * s0;
    for (let i = 1; i <= 24; i++) for (const sg of [-1, 1]) {
      const z = t0[2] + sg * i * 8, s1 = cam / (cam - z), p = [X / s1, Y / s1, z], d = sub(p, h), dl = V.len(d);
      if (dl < 1e-3) continue;
      const u1 = mul(d, 1 / dl), fr = Mo.bladeFront(P, h, u1, BL);
      if (!fr.T && !fr.R && !fr.L) { setBlade(P, u1); kd.beh = true; K.behind = (K.behind || 0) + 1; return; }
    }
    return;
  }
  const a = Math.atan2(u[1], u[0]);
  for (let i = 1; i <= 24; i++) for (const sg of [-1, 1]) {
    const z = u[2] + sg * i * 0.04;
    if (Math.abs(z) > 0.95) continue;
    const u1 = fromScr(a, z);
    if (drawnR(h, u1, BL) < 0.8) continue;
    const fr = Mo.bladeFront(P, h, u1, BL);
    if (!fr.T && !fr.R && !fr.L) { setBlade(P, u1); kd.beh = true; K.behind = (K.behind || 0) + 1; return; }
  }
}




const FG = []; for (let x = -9; x <= 9; x += 2) for (let y = -9; y <= 9; y += 2) if (x * x + y * y <= 81) FG.push([x, y]);


function coverOf(P) {
  if (!P.head || !P.shR || !P.elR || !P.haR) return 0;
  const c = [P.head[0] + 4 * (P.hf ? Math.sign(P.hf[0]) || 1 : 1), P.head[1] + 1], hz = P.head[2], sg = [], arms = !!(K.oldClear || K.headOff);
  for (const s of ['R', 'L']) { const sh = P['sh' + s], el = P['el' + s], ha = P['ha' + s]; if (!sh || !el || !ha) continue; if (arms && (sh[2] + el[2]) / 2 > hz + 2) sg.push([sh, el, 8]); if (arms && (el[2] + ha[2]) / 2 > hz + 2) sg.push([el, ha, 6.5]); if (!arms || ha[2] > hz + 2) sg.push([ha, ha, 5.5]); }
  if (!sg.length) return 0;

  let n = 0;
  for (let g = 0; g < FG.length; g++) {
    const q0 = c[0] + FG[g][0], q1 = c[1] + FG[g][1];
    for (let j = 0; j < sg.length; j++) {
      const a = sg[j][0], e = sg[j][1], abx = e[0] - a[0], aby = e[1] - a[1];
      const t = clamp(((q0 - a[0]) * abx + (q1 - a[1]) * aby) / Math.max(1e-9, abx * abx + aby * aby), 0, 1);
      if (Math.hypot(q0 - a[0] - abx * t, q1 - a[1] - aby * t) < sg[j][2]) { n++; break; }
    }
  }
  return n / FG.length;
}
const FC_DIRS = [[0, 1, 0], [0.6, 0.8, 0], [1, 0, 0], [0.8, 0.6, 0], [-0.3, 0.95, 0]];
function faceClear(k, P, grip) {
  const o0 = k.fo || [0, 0, 0];
  if (!P.armed || P.inside || !P.blade || !P.blade.u) { k.fo = [0, 0, 0]; return; }
  const J = ['elR', 'wrR', 'haR', 'elL', 'wrL', 'haL', 'reachR', 'reachL'], base = {}; for (const j of J) base[j] = P[j]; base.blade = P.blade;
  const two = P.gripL >= 0.999;
  const at = (d) => { Object.assign(P, base); if (d[0] || d[1] || d[2]) { moveHands(P, d); if (two) onHandle(P, grip); } return coverOf(P); };
  const L0 = V.len(o0), rel = L0 > 4 ? mul(o0, (L0 - 4) / L0) : [0, 0, 0];
  let d = rel;
  if (at(rel) > 0.3) {
    if (at(o0) > 0.3) {

      let best = null, bl = Infinity, low = { d: o0, c: at(o0) };
      for (let s = 2; s <= 28; s += 2) for (const u of FC_DIRS) for (const from of [o0, [0, 0, 0]]) {
        const cd = madd(from, u, s), l = V.len(sub(cd, o0)); if (l >= bl) continue;
        const c = at(cd); if (c <= 0.3) { best = cd; bl = l; } else if (c < low.c) low = { d: cd, c };
      }
      const tgt = best || low.d, dv = sub(tgt, o0), dl = V.len(dv);
      d = dl > 6 ? madd(o0, dv, 6 / dl) : tgt;
    } else d = o0;
  }
  at(d); k.fo = d;
  if (d[0] || d[1] || d[2]) K.faceMoved = (K.faceMoved || 0) + 1;
}
K.dbg = (f) => { const k = KS.get(f); if (!k) return null; const r = { ga: +(k.ga || 0).toFixed(2), gaD: +(k.gaD || 0).toFixed(2), sc: k.sc || 0, sr: k.sr, nd: k.nd || 0, dd: +(k.dd || 0).toFixed(2), tail: k.tail || 0, cur: k.cur ? k.cur.id : null, t: k.cur ? +k.cur.t.toFixed(0) : null, w: +(k.w || 0).toFixed(2), beh: !!k.beh, mw: +(k.mw || 0).toFixed(2), gv: +(k.gvD || 0).toFixed(2), stp: k.stopMem || 0, sp: +(k.sp || 0).toFixed(1), sb: k.sb ? +(k.sb.Xp || 0).toFixed(1) : 0, spT: k.spT || 0, s: k.dbg || '' }; return r; };




K.swordSample = (f) => {
  const rg = MD.rigOf(f), P = rg && rg.P;
  if (!P || !P.blade || !P.blade.h || !P.armed || P.inside || f.dead || f.hidden) return { x: 1 };
  const BL = (f.wpn && f.wpn.blade) || LEN.blade, h = P.blade.h, u = P.blade.u;
  const ph = Mo.project(rg, h), pt = Mo.project(rg, [h[0] + u[0] * BL, h[1] + u[1] * BL, h[2] + u[2] * BL]);
  const k = KS.get(f), nw = !!(P.kilic && P.kilicW >= 0.999 && k && k.cur);
  let s = false;
  if (f.state === 'atk' && f.atk) { const W = f.atk.hits || (f.atk.active ? [f.atk.active] : []); s = W.some((w) => f.st >= w[0] - 0.02 && f.st <= w[1] + 0.02); }
  if (nw) { const M = MOVES[k.cur.id], t = k.cur.t, ph2 = M && M.phases, W = ph2 ? ph2.hits || (ph2.active ? [ph2.active] : []) : []; if (W.some((w) => t >= w[0] - 35 && t <= w[1] + 35) || (M && M.beat && t >= M.beat[0] && t <= M.beat[1])) s = true; }
  const hr = nw && MOVES[k.cur.id] && (MOVES[k.cur.id].rest || []).some(([a, b]) => k.cur.t >= a && k.cur.t <= b) ? 1 : 0;
  const Fo = frontOf(f, rg);
  return { h: hr, d: k && k.dbg && (k.dbg + (Fo ? 'D' + Fo.d.toFixed(0) + ' F' + Fo.front.toFixed(0) : '') + (k.sb && k.sb.s > 0.5 ? ' S' + k.sb.s.toFixed(0) : '') + (k.sb && k.sb.Xp > 0.5 ? ' X' + k.sb.Xp.toFixed(0) : '')), r:Math.hypot(pt.x - ph.x, pt.y - ph.y) / (BL * (ph.s || 1)), a: Math.atan2(pt.y - ph.y, pt.x - ph.x), s: s ? 1 : 0, x: 0, tag: nw ? k.cur.id : 'old:' + (f.state === 'atk' ? ATKID.get(f.atk) || f.atkName : f.state) };
};
K.dbgReset = (f) => { const k = KS.get(f); if (k) k.nd = 0; };
const draw1 = Mo.draw;







const DR = ND._draw, head0 = DR.drawHead, cl0 = ND.costumeLayer;
let HELD = null;

DR.drawHead = function () { if (HELD) { HELD.push([head0, this, arguments]); return; } return head0.apply(this, arguments); };
if (cl0) ND.costumeLayer = function (id, layer) { if (HELD && layer === 'head') { HELD.push([cl0, this, arguments]); return; } return cl0.apply(this, arguments); };
function drawPic(ctx, rg, opt) {
  const f = rg && rg.look;
  if (!K.on || K.headOff || !f || !f.ch || !WHO[f.ch.id] || !rg.P || !ctx) return draw1.call(Mo, ctx, rg, opt);
  const held = (HELD = []);
  let r;
  try { r = draw1.call(Mo, ctx, rg, opt); } finally { HELD = null; }
  if (held.length) { ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; try { for (const [fn, th, a] of held) fn.apply(th, a); } finally { ctx.restore(); } }
  return r;
}

K.drawPic = drawPic;
Mo.draw = function (ctx, rg, opt) {
  const P = rg && rg.P;
  const kd = rg && rg.look && KS.get(rg.look);






  const flat = (rmin = 0.82) => { if (P && P.blade && P.blade.u && P.blade.h && P.armed && !P.inside && rg.look && rg.look.ch && WHO[rg.look.ch.id]) {
    try { const BLf = (rg.look.wpn && rg.look.wpn.blade) || LEN.blade, u0 = P.blade.u; let u1 = flatDrawn(P.blade.h, u0, BLf, rmin, 0);

      if (u1 !== u0 && !K.gov1) u1 = rotToScr(P.blade.h, u1, BLf, scrP(P.blade.h, u0, BLf));
      if (u1 !== P.blade.u) { let e = sub(P.blade.e, mul(u1, dot(P.blade.e, u1))); e = V.len(e) > 1e-4 ? norm(e) : P.blade.e; P.blade = { h: P.blade.h, u: u1, e }; } } catch (e) { K.errors++; }
  } };
  if (kd && P && P.kilicW > 0) { try { krKeep(rg.look, kd, P); } catch (e) { K.errors++; } }
  flat();
  if (kd) { if (!(P && P.kilicW > 0)) kd.dbg = 'old '; dbgA(kd, 'f', P); }


  const relay = () => { if (P && P.kilic && P.kilicW >= 0.999 && rg.look) {
    try {
      const k = kd;
      if (k && k.feet) for (const s of ['R', 'L']) { const F = k.feet[s]; layLeg(P, s, [(F.x - rg.x) * rg.dir, F.y + (rg.y || 0), F.z]); }
      if (P.armed && P.gripL >= 0.999) onHandle(P, gripOf(rg.look.wpn));
    } catch (e) { K.errors++; }
  } };
  if (!K.gov1) relay();
  if (kd && P) {
    const fresh = P.kilicW > 0;
    if (fresh) kd.tail = 9; else if (kd.tail > 0) kd.tail--;
    try { if (fresh && K.unstopOn) unStop(rg.look, kd, P); else kd.stopMem = 0; } catch (e) { K.errors++; }
    try { if (fresh || kd.tail > 0) settle(kd, rg.look, rg, P, 1 / 60, gripOf(rg.look.wpn)); else kd.so = P.blade ? { h: sub(P.haR, P.hip), u: P.blade.u, dir: rg.dir } : null; } catch (e) { K.errors++; }


    dbgA(kd, 's', P);
    try { if (fresh) faceClear(kd, P, gripOf(rg.look.wpn)); else kd.fo = null; } catch (e) { K.errors++; }
    if (K.gov1) {
      try { if (fresh) faceGuard(rg.look, rg, P, kd); else kd.ga = 0; } catch (e) { K.errors++; }
      try { if (!K.govOff) govern(rg.look, kd, rg, P); else kd.gv = null; } catch (e) { K.errors++; }
    } else { kd.ga = 0; try { govern2(rg.look, kd, rg, P); } catch (e) { K.errors++; if (K.errors < 4) console.error('kilic gov', e); } }
    flat();
    dbgA(kd, 'v', P);
    try { if (fresh) behind(rg.look, rg, P, kd); else kd.beh = false; } catch (e) { K.errors++; }


    if (kd.beh) flat(0.72);
    dbgA(kd, 'g', P);
  }
  relay();
  if (kd && P && !K.gov1) govMem(rg.look, kd, rg, P);
  const u0 = P && P.blade && P.blade.u;
  if (kd) kd.saya2 = null;
  DRAWING = kd || null;
  let r;
  try { r = drawPic(ctx, rg, opt); } finally { DRAWING = null; }
  if (kd) { kd.nd = (kd.nd || 0) + 1; const u1 = rg.P && rg.P.blade && rg.P.blade.u; kd.dd = u0 && u1 ? Math.acos(clamp(dot(u0, u1), -1, 1)) : 0; }
  return r;
};









K.boxM = 32; K.boxMt = 12;



let DRAWING = null;
{
  const DR2 = ND._draw, sy0 = DR2 && DR2.saya;
  if (sy0) DR2.saya = function (ctx, j, c, D1, wpn) {
    const k = DRAWING, TF = DR2.TF;
    if (k && j && j.sh && j.hip && TF && wpn) {
      const bx = -TF.nx, by = -TF.ny, ux = TF.ux, uy = TF.uy, sl = (wpn.blade + wpn.handle) / 120;
      const x0 = j.sh.x + bx * 2 + ux * 16 * sl, y0 = j.sh.y + by * 2 + uy * 16 * sl;
      let x1 = j.hip.x + bx * 40 - ux * 36 * sl, y1 = j.hip.y + by * 40 - uy * 36 * sl;
      const FL = -3;
      if (sy0.duelClamp && y1 > FL && y0 < FL) { const Lh = Math.hypot(x1 - x0, y1 - y0), dy = FL - y0; x1 = x0 + (Math.sign(x1 - x0) || 1) * Math.sqrt(Math.max(0, Lh * Lh - dy * dy)); y1 = FL; }
      (k.saya2 || (k.saya2 = [])).push(x0, y0, x1, y1);
    }
    return sy0.apply(this, arguments);
  };
  if (sy0 && sy0.duelClamp) DR2.saya.duelClamp = true;
}
{
  const THIN = { hilt: 1, tip: 1, pom: 1, pomm: 1, saya: 1, sayaEnd: 1 };
  const BB = {}, BKD = ['hip', 'neck', 'head', 'sh', 'shB', 'elF', 'haF', 'elB', 'haB', 'knF', 'ftF', 'knB', 'ftB', 'hipF', 'hipB', 'hilt', 'tip', 'pom', 'pomm', 'saya', 'sayaEnd'], BX = [0, 0, 0, 0];
  ND.Fighter.prototype.drawnBox = function () {
    if (!K.on || D.lite || !this.ch || !WHO[this.ch.id] || !this.dz || this.dead || this.hidden || this.looseSword || !ND.depth25 || !ND.depth25.snap) return null;

    if (this.state === 'denv' || this.dz.env || (ND.props && ND.props.live && ND.props.held && ND.props.held(this))) return null;
    const sn = ND.depth25.snap(this, BB);
    if (!sn || !sn.mocap) return null;
    const m = K.boxM, b = BX;
    b[0] = 1e9; b[1] = 1e9; b[2] = -1e9; b[3] = -1e9;
    const add = (x, y, r) => { if (!(x === x) || !(y === y)) return; if (x - r < b[0]) b[0] = x - r; if (x + r > b[2]) b[2] = x + r; if (y - r < b[1]) b[1] = y - r; if (y + r > b[3]) b[3] = y + r; };

    const mt = K.boxMt;
    for (const k of BKD) { const q = sn[k]; if (q) add(q.x, q.y, THIN[k] ? mt : m); }
    const rg = MD.rigOf(this), pp = rg && rg.puppet;
    if (pp) { for (const t of pp.tails || []) for (const p of t.p) add(p.x, p.y, m); if (pp.sash) for (const p of pp.sash.p) add(p.x, p.y, m); }

    if (rg && rg.trail) for (const q of rg.trail) { add(q.tx, q.ty, 8); add(q.bx, q.by, 8); }
    const kd = KS.get(this), S2 = kd && kd.saya2;
    if (S2) for (let i = 0; i < S2.length; i += 2) add(S2[i], S2[i + 1], 10);
    for (const t of this.tails) for (const p of t.p) add(p.x, p.y, m);
    for (const p of this.sash.p) add(p.x, p.y, m);
    for (const T of this.trail) add(T[2], T[3], 40);
    return b[2] > b[0] ? b : null;
  };
}

try { for (const id of ORDER) { chAt(id, 0); chAt(id, 0, 126); } } catch (e) { K.errors++; }
K.ready = true;
}
})();
