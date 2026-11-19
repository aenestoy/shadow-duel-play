// New sword moves in a real fight (branch claude/sd-kilic-yeni, never shipped). Loaded only by an address with ?kilic=1
// (index.html's loader); without it this file is never fetched and the game is exactly as before.
// Only a match against the computer (mode 'cpu') uses it: any other mode (online, ranked, 2P, training ...) runs the
// game's own moves and timings, as today.
//  1. Timing: each duel cut that has a hand-keyed counterpart (MAP) is retimed so that its hit window is the new move's
//     cut (moves.js phases.active) and it ends when the new move ends. Every time in the cut (its pose keys - the fight's
//     own hit geometry rides on them -, hit window, lunge, chain window, swing sound ...) goes through one piecewise
//     linear map, so the blade that hits is where the picture's blade is. The lunge keeps its distance.
//  2. Picture: while Akane or Kuro stands on the floor with the sword out and is in a cut of MAP, a guard, a block, a hit
//     reaction, a stagger, a recoil or standing still, the drawn body is the hand-keyed pose (moves.js) instead of the
//     game's. Its clock is the fight's own (the cut's f.st, a state's share of its length). One hand-keyed move into the
//     next cross-fades its channels (0.09 s); the game's picture into the new one and back fades joint by joint
//     (0.1 s, limbs laid again with their own lengths). The feet stay where they are on the floor: a body that the fight
//     moves (a lunge, a push, the keep-apart) takes real steps (a foot lifts, travels and is set down).
//  3. js/anim.js Pop (the one-frame-jump smoother) is off for a body drawn from the new moves: nothing smooths them.
//  4. After the pair of bodies is settled (js/mocap-duel.js blade / kick stops, keep-apart), the back hand is put back on
//     the handle and the legs on their planted feet.
import { MOVES, chAt, blendCh, poseFromCh, layLeg, layArm, durOf, V } from './moves.js';
const { add, sub, mul, madd, dot, norm, lerp } = V;

const KF = 0.595; // fight seconds of a cut per real second at speed 1 (the duel's 0.85 time scale × its 0.7 cut speed)
// duel cut → hand-keyed move (the same kind of cut: side, height, thrust)
export const MAP = {
  ak_dKesa: 'kesaS', d_kesaR: 'kesaS', d_kesaL: 'gyakuS', d_shomen: 'menS', d_kote: 'menS', ak_dNuki: 'yokoL', d_doL: 'yokoL',
  d_tsukiL3: 'tsukiS', d_tsuki: 'tsukiS', d_tobikomi: 'tsukiS', d_wallL: 'tsukiS', d_men: 'overhead',
};
const WHO = { akane: 1, kuro: 1 };
const FADE = 0.1, CHX = 0.09, GRIP = 19;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (u) => u * u * (3 - 2 * u);

const until = (f) => new Promise((res) => { const iv = setInterval(() => { let ok = false; try { ok = f(); } catch (e) { ok = false; } if (ok) { clearInterval(iv); res(); } }, 30); });
await until(() => { const N = window.ND; return N && N.game && N.duel && N.duel.mocap && N.duel.mocap.rigOf && N.mocap && N.mocap.Rig && N.anim && N.anim.Pop && N.ATK; });
const ND = window.ND, D = ND.duel, Mo = ND.mocap, g = ND.game, ATK = ND.ATK;
const K = (window.__kilic = { on: false, errors: 0, moves: 0, frames: 0, MAP });
// (the fight keeps the logical name - light1, heavy ... - in f.atkName; the cut itself is the ATK object)
const ATKID = new Map(); for (const n in ATK) ATKID.set(ATK[n], n);
K.atkId = (a) => ATKID.get(a) || '';

// ------------------------------------------------------------------ 1. timing
const TF = ['active', 'chain', 'glint', 'sheath', 'spin'];
const ORIG = {}, NEW = {};
function retimed(a, id) {
  const ph = MOVES[id].phases, k = KF / 1000;
  const X = [0, a.active[0], a.active[1], a.dur], Y = [0, ph.active[0] * k, ph.active[1] * k, durOf(id) * k];
  const m = (t) => { if (t <= 0) return t; for (let i = 1; i < 4; i++) if (t <= X[i]) return Y[i - 1] + ((t - X[i - 1]) * (Y[i] - Y[i - 1])) / Math.max(1e-6, X[i] - X[i - 1]); return Y[3] + (t - X[3]) * (Y[3] / X[3]); };
  const o = { dur: Y[3], keys: a.keys.map((q) => [m(q[0]), ...q.slice(1)]) };
  for (const f of TF) o[f] = Array.isArray(a[f]) ? [m(a[f][0]), m(a[f][1]), ...a[f].slice(2)] : a[f];
  // (a lunge keeps its distance: the speed by how much its window shrank or grew)
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
}
K.timing = () => Object.fromEntries(Object.keys(NEW).map((n) => [n, { was: [ORIG[n].active.map((v) => +(v / KF * 1000).toFixed(0)), +(ORIG[n].dur / KF * 1000).toFixed(0)], now: [NEW[n].active.map((v) => +(v / KF * 1000).toFixed(0)), +(NEW[n].dur / KF * 1000).toFixed(0)] }]));
const nm0 = g.newMatch;
g.newMatch = function (mode) { apply(mode === 'cpu'); return nm0.apply(this, arguments); };
apply(g.mode === 'cpu');

// ------------------------------------------------------------------ 3. no Pop on the new moves
const Pop0 = ND.anim.Pop, R3 = [0, 0, 0];
ND.anim.Pop = function () {
  const st = Pop0.apply(this, arguments), s0 = st.step;
  st.step = function (keys, get, dt, detect) { if (detect && get('kilic', R3)) detect = false; return s0.call(st, keys, get, dt, detect); };
  return st;
};
// (the bodies made before this file ran are made again, with the hooks: a new ninja in the slot does the same)
for (const f of g.F || []) for (const fn of ND.onLook || []) { try { fn(f); } catch (e) { /* a drawing cache */ } }

// ------------------------------------------------------------------ 2. what the new picture plays now
const KS = new WeakMap();
const ks = (f) => { let k = KS.get(f); if (!k) KS.set(f, (k = { w: 0, cur: null, lastCh: null, bl: null, prevP: null, feet: null, lastSt: '', stAtk: null, stT: 0, idleT: 0, entryOut: false, gh: 'Mid', hh: 'Body' })); return k; };
function guardH(f) {
  const o = f.opp;
  if (o && o.state === 'atk' && D.threat) { const th = D.threat(o); if (th && th.h === 'high') return 'Hi'; if (th && th.h === 'low') return 'Low'; }
  return 'Mid';
}
function choose(f, k, gP, dt) {
  if (!K.on || !f.ch || !WHO[f.ch.id]) return null;
  const st = f.state, out = !!(gP && gP.armed && !gP.inside);
  if (st !== k.lastSt || (st === 'atk' && f.atk !== k.stAtk)) {
    k.lastSt = st; k.stAtk = st === 'atk' ? f.atk : null; k.stT = 0; k.entryOut = out || (k.w > 0.5 && !!k.cur);
    if (st === 'block' || st === 'hurt') { const h = guardH(f); k.gh = h; k.hh = h === 'Hi' ? 'Hi' : 'Body'; }
    if (st === 'block' && k.cur && /^guard/.test(k.cur.id)) k.gh = k.cur.id.slice(5);
  } else k.stT += dt;
  if (f.dead || f.hidden || !f.onGround || f.y < -2 || f.roll || !f.dz || f.dz.armed === false) return null;
  if (st === 'dseq' || (f.dz.cine && !f.dz.cine.done) || (D.finOf && (D.finOf(f) || (f.opp && D.finOf(f.opp)))) || (D.passing && (D.passing(f) || (f.opp && D.passing(f.opp))))) return null;
  if (!k.entryOut) return null;
  const fr = (T) => clamp(f.st / Math.max(0.05, T), 0, 1);
  switch (st) {
    case 'atk': { const id = MAP[ATKID.get(f.atk)]; return id ? { id, t: (f.st * 1000) / KF } : null; }
    case 'guard': { const id = 'guard' + guardH(f), M = MOVES[id]; return { id, t: Math.min(k.stT * 1000, M.keys[M.hold].t) }; }
    case 'block': return { id: 'block' + k.gh, t: fr(f.dur || 0.3) * durOf('blockMid') };
    case 'hurt': return { id: 'hurt' + k.hh, t: fr(f.dur || 0.4) * durOf('hurtHi') };
    case 'stagger': return { id: 'stagger', t: fr(0.74) * durOf('stagger') };
    case 'recoil': return { id: 'recoil', t: fr(f.rkEnd || 0.32) * durOf('recoil') };
    case 'move': if (Math.abs(f.vx) < 12 && out) { k.idleT += dt; return { id: 'idle', t: k.idleT * 1000 }; } return null;
    default: return null;
  }
}

// ------------------------------------------------------------------ the feet: planted on the floor, real steps
function planFeet(k, rg, P, dt, gP) {
  const dir = rg.dir;
  if (!k.feet) { k.feet = {}; for (const s of ['R', 'L']) { const p = (gP && gP['ft' + s]) || P['ft' + s]; k.feet[s] = { x: rg.x + p[0] * dir, y: 0, z: p[2], st: null }; } }
  const want = { R: P.ftR, L: P.ftL };
  const errOf = (s) => want[s][0] - (k.feet[s].x - rg.x) * dir;
  // (a foot that the move itself lifts follows the move)
  for (const s of ['R', 'L']) { const F = k.feet[s], d = want[s]; if (d[1] < -0.5) { F.x = rg.x + d[0] * dir; F.y = d[1]; F.z = d[2]; F.st = null; F.own = true; } else if (F.own) { F.own = false; F.y = 0; } }
  const stepping = k.feet.R.st || k.feet.L.st;
  if (!stepping) {
    const reach = (s) => { const F = k.feet[s], h = P['hip' + s], q = [(F.x - rg.x) * dir, 0, F.z]; return Math.hypot(q[0] - h[0], q[1] - h[1], q[2] - h[2]) / 92; };
    let best = null, be = 0;
    for (const s of ['R', 'L']) { const F = k.feet[s]; if (F.own) continue; const e = Math.abs(errOf(s)) + (reach(s) > 0.97 ? 50 : 0); if (e > 7 && e > be) { best = s; be = e; } }
    if (best) { const F = k.feet[best], e = Math.abs(errOf(best)); F.st = { t: 0, T: clamp(0.1 + e / 500, 0.12, 0.22), x0: F.x, z0: F.z, h: Math.min(7, 2 + e * 0.12) }; }
  }
  for (const s of ['R', 'L']) {
    const F = k.feet[s], d = want[s];
    if (F.st) {
      F.st.t += dt; const u = Math.min(1, F.st.t / F.st.T), w = smooth(u);
      F.x = F.st.x0 + (rg.x + d[0] * dir - F.st.x0) * w; F.z = F.st.z0 + (d[2] - F.st.z0) * w; F.y = -Math.sin(Math.PI * u) * F.st.h;
      if (u >= 1) { F.st = null; F.y = 0; }
    }
    layLeg(P, s, [(F.x - rg.x) * dir, F.y, F.z]);
  }
}
// ------------------------------------------------------------------ the game's picture ↔ the new one, joint by joint
const JS = ['hip', 'hipR', 'hipL', 'knR', 'ftR', 'knL', 'ftL', 'chest', 'neck', 'head', 'shR', 'shL', 'elR', 'wrR', 'haR', 'elL', 'wrL', 'haL'];
function onHandle(P, grip) {
  const u = P.blade.u, wo = sub(P.wrL, P.haL);
  layArm(P, 'L', madd(P.haR, u, -grip), sub(P.elL, lerp(P.shL, P.haL, 0.5)));
  P.wrL = add(P.haL, wo);
}
function mix(gP, P, w, grip) {
  if (w >= 0.999 || !gP || !gP.blade) return P;
  const o = Object.assign({}, P);
  for (const j of JS) if (gP[j] && P[j]) o[j] = lerp(gP[j], P[j], w);
  for (const s of ['R', 'L']) {
    layLeg(o, s, o['ft' + s]);
    const wo = sub(o['wr' + s], o['ha' + s]);
    layArm(o, s, o['ha' + s], sub(o['el' + s], lerp(o['sh' + s], o['ha' + s], 0.5)));
    o['wr' + s] = add(o['ha' + s], wo);
  }
  const u = norm(lerp(gP.blade.u, P.blade.u, w)); let e = lerp(gP.blade.e, P.blade.e, w); e = norm(sub(e, mul(u, dot(e, u))));
  o.blade = { h: o.haR, u, e };
  if (w > 0.5 ? P.gripL >= 0.999 : gP.gripL >= 0.5) onHandle(o, grip);
  if (w <= 0.5) { o.armed = gP.armed; o.inside = gP.inside; o.bladeVis = gP.bladeVis; o.saya = gP.saya; o.gripL = gP.gripL; }
  return o;
}
function sayaFor(f, P, gP) {
  if (f.wpn && f.wpn.iai) return P.saya;
  if (!gP || !gP.saya) return P.saya;
  const d = sub(P.chest, gP.chest);
  return Object.assign({}, gP.saya, { a: add(gP.saya.a, d) });
}
function ours(f, rg, gP, dt) {
  const k = ks(f);
  const want = choose(f, k, gP, dt);
  k.w = clamp(k.w + ((want ? 1 : -1) * dt) / FADE, 0, 1);
  if (!want && (k.w <= 0 || !k.cur)) { k.cur = null; k.feet = null; k.prevP = null; k.w = 0; return null; }
  let ch;
  if (want) {
    const c = chAt(want.id, want.t);
    if (k.cur && k.cur.id !== want.id && k.lastCh) { k.bl = { from: k.lastCh, t: 0 }; K.moves++; }
    if (k.bl) { k.bl.t += dt; const u = clamp(k.bl.t / CHX, 0, 1); ch = u >= 1 ? c : blendCh(k.bl.from, c, smooth(u)); if (u >= 1) k.bl = null; } else ch = c;
    k.cur = want; k.lastCh = ch;
  } else ch = k.lastCh;
  const grip = GRIP;
  const P = poseFromCh(k.cur.id, ch, k.cur.t, k.prevP, { grip });
  planFeet(k, rg, P, dt, gP);
  P.saya = sayaFor(f, P, gP);
  // (the fight's height: on the floor here, kept for a frame the fight lifts it)
  if (rg.y) for (const j of JS) P[j] = [P[j][0], P[j][1] + rg.y, P[j][2]];
  k.prevP = P;
  const out = mix(gP, P, smooth(k.w), grip);
  out.kilic = [1, 0, 0]; // (read by the Pop hook above and the drawing hook below)
  out.kilicW = k.w;
  K.frames++;
  return out;
}
const build1 = Mo.Rig.prototype.build;
Mo.Rig.prototype.build = function (F, dt) {
  const gP = build1.call(this, F, dt), f = this.look;
  if (!K.on || !this.driven || !f || !f.dz) return gP;
  try { return ours(f, this, gP, dt || 0) || gP; } catch (e) { K.errors++; if (K.errors < 4) console.error('kilic', e); return gP; }
};

// ------------------------------------------------------------------ 4. after the pair is settled
const draw1 = Mo.draw;
Mo.draw = function (ctx, rg) {
  const P = rg && rg.P;
  if (P && P.kilic && P.kilicW >= 0.999 && rg.look) {
    try {
      const k = KS.get(rg.look);
      if (k && k.feet) for (const s of ['R', 'L']) { const F = k.feet[s]; layLeg(P, s, [(F.x - rg.x) * rg.dir, F.y + (rg.y || 0), F.z]); }
      if (P.armed && P.gripL >= 0.999) onHandle(P, GRIP);
    } catch (e) { K.errors++; }
  }
  return draw1.apply(this, arguments);
};
K.ready = true;
