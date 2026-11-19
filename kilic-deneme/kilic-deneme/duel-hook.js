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
//  5. Also only while it is on (the owner, 2026-11-19, from the 30 s fight video): the fight's own contact / aim (rg.ovr:
//     a blocked cut onto the blade, a landed one onto the body) is laid on the new picture too; blades that are not
//     cutting meet between the two bodies (never through the other's head or body); the ink hit effect (big black
//     brush stroke, splash and drops) and the foreground bamboo / posts (a black bar at the frame's edge) are left out.
import { MOVES, chAt, blendCh, poseFromCh, layLeg, layArm, durOf, V, LEN } from './moves.js';
const { add, sub, mul, madd, dot, norm, lerp } = V;

const KF = 0.595; // fight seconds of a cut per real second at speed 1 (the duel's 0.85 time scale × its 0.7 cut speed)
// duel cut → hand-keyed move (the same kind of cut: side, height, thrust)
export const MAP = {
  ak_dKesa: 'kesaS', d_kesaR: 'kesaS', d_kesaL: 'gyakuS', d_shomen: 'menS', d_kote: 'menS', ak_dNuki: 'yokoL', d_doL: 'yokoL',
  d_tsukiL3: 'tsukiS', d_tsuki: 'tsukiS', d_tobikomi: 'tsukiS', d_wallL: 'tsukiS', d_men: 'overhead',
};
const WHO = { akane: 1, kuro: 1 };
const FADE = 0.15, CHX = 0.09;
// the back hand on the handle: as js/mocap.js gripGap (Kuro's nodachi has the longer handle)
const gripOf = (w) => Math.max(19, ((w && w.handle) || 24) - 5);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (u) => u * u * (3 - 2 * u);

const until = (f) => new Promise((res) => { const iv = setInterval(() => { let ok = false; try { ok = f(); } catch (e) { ok = false; } if (ok) { clearInterval(iv); res(); } }, 30); });
await until(() => { const N = window.ND; return N && N.game && N.duel && N.duel.mocap && N.duel.mocap.rigOf && N.mocap && N.mocap.Rig && N.anim && N.anim.Pop && N.ATK; });
const ND = window.ND, D = ND.duel, Mo = ND.mocap, g = ND.game, ATK = ND.ATK, MD = D.mocap;
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
  // (the near bamboo / posts drawn over the fight: js/duel-env.js D.fgHidden draws the front without that layer)
  D.fgHidden = on ? true : K.fgWas;
}
K.fgWas = !!D.fgHidden;
// the ink hit (js/scene.js fx.ink, the PEGI stand-in for blood): its brush stroke ('k', up to ~220 long and 14 wide), sumi
// splash ('x') and black drops ('i') read as huge black shards over the fight; while this is on only its sparks and cloth
// scraps are kept
{
  const FX = ND.fx, ink0 = FX && FX.ink;
  if (ink0) FX.ink = function () {
    const P = this.parts, n0 = P.length, r = ink0.apply(this, arguments);
    if (K.on) for (let i = P.length - 1; i >= n0; i--) { const k = P[i].k; if (k === 'k' || k === 'x' || k === 'i') P.splice(i, 1); }
    return r;
  };
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
  // (after a finishing cut - the fight's zanshin, a counter's held pose (js/duel-fin.js 'dfinp': chiburi, then a stance
  // with the blade out that hung to the floor) - the striker's blade, while it is out: the new zanshin, then the guard)
  const zan = (st === 'zanshin' || st === 'dfinp') && out && !(f.dz.cine && !f.dz.cine.done && f.dz.cine.A && f.dz.cine.A !== f);
  if (!zan && (st === 'dseq' || (f.dz.cine && !f.dz.cine.done) || (D.finOf && (D.finOf(f) || (f.opp && D.finOf(f.opp)))) || (D.passing && (D.passing(f) || (f.opp && D.passing(f.opp)))))) return null;
  if (!k.entryOut && !zan) return null;
  const fr = (T) => clamp(f.st / Math.max(0.05, T), 0, 1);
  switch (st) {
    case 'atk': { const id = MAP[ATKID.get(f.atk)]; return id ? { id, t: (f.st * 1000) / KF } : null; }
    case 'guard': { const id = 'guard' + guardH(f), M = MOVES[id]; return { id, t: Math.min(k.stT * 1000, M.keys[M.hold].t) }; }
    case 'block': return { id: 'block' + k.gh, t: fr(f.dur || 0.3) * durOf('blockMid') };
    case 'hurt': return { id: 'hurt' + k.hh, t: fr(f.dur || 0.4) * durOf('hurtHi') };
    case 'stagger': return { id: 'stagger', t: fr(0.74) * durOf('stagger') };
    case 'recoil': return { id: 'recoil', t: fr(f.rkEnd || 0.32) * durOf('recoil') };
    // (the recorded walk starts at 40 (js/mocap-duel.js direct); slower than that its idle played: the new one does)
    case 'move': if (Math.abs(f.vx) < 40 && out) { k.idleT += dt; return { id: 'idle', t: k.idleT * 1000 }; } return null;
    case 'zanshin': case 'dfinp': return zan ? { id: 'zanshin', t: k.stT * 1000 } : null;
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
  const reach = (s) => { const F = k.feet[s], h = P['hip' + s], q = [(F.x - rg.x) * dir, 0, F.z]; return Math.hypot(q[0] - h[0], q[1] - h[1], q[2] - h[2]) / 92; };
  // (the body's speed along the floor, from the last frame: a lunge moves it 10-15 a frame)
  const vx = k.px != null && dt > 0 ? (rg.x - k.px) / dt : 0; k.px = rg.x;
  const ahead = Math.abs(vx) * dt * 2 / 92;
  // (a quick body - a lunge, a push - steps quicker)
  const quick = Math.abs(rg.vx || 0) > 150 ? 0.7 : 1;
  const go = (s) => { const F = k.feet[s], e = Math.abs(errOf(s)); F.st = { t: 0, T: clamp(0.1 + e / 500, 0.12, 0.22) * quick, x0: F.x, z0: F.z, h: Math.min(7, 2 + e * 0.12) }; };
  if (!stepping) {
    let best = null, be = 0;
    for (const s of ['R', 'L']) { const F = k.feet[s]; if (F.own) continue; const e = Math.abs(errOf(s)) + (reach(s) > 0.97 ? 50 : 0); if (e > 7 && e > be) { best = s; be = e; } }
    if (best) go(best);
  }
  // (a planted foot the leg can no longer reach is never dragged along the floor: it steps at once, even while the
  // other foot is stepping)
  // (looked one frame ahead: a lunge would carry the body past the leg's reach before the next frame's check)
  for (const s of ['R', 'L']) { const F = k.feet[s]; if (!F.st && !F.own && reach(s) + ahead > 0.985) go(s); }
  for (const s of ['R', 'L']) {
    const F = k.feet[s], d = want[s];
    if (F.st) {
      F.st.t += dt; const u = Math.min(1, F.st.t / F.st.T), w = smooth(u);
      // (the landing spot is fixed for the last 40% of the step: a foot coming down never rides along with the body)
      if (u > 0.6 && F.st.tx == null) F.st.tx = rg.x + d[0] * dir;
      F.x = F.st.x0 + ((F.st.tx != null ? F.st.tx : rg.x + d[0] * dir) - F.st.x0) * w; F.z = F.st.z0 + (d[2] - F.st.z0) * w; F.y = -Math.sin(Math.PI * u) * F.st.h;
      if (u >= 1) { F.st = null; F.y = 0; }
    }
    layLeg(P, s, [(F.x - rg.x) * dir, F.y, F.z]);
  }
}
// ------------------------------------------------------------------ the game's picture ↔ the new one, joint by joint
const JS = ['hip', 'hipR', 'hipL', 'knR', 'ftR', 'knL', 'ftL', 'chest', 'neck', 'head', 'shR', 'shL', 'elR', 'wrR', 'haR', 'elL', 'wrL', 'haL'];
// both fists and the blade moved by d (the sword arm laid again with its own lengths)
function moveHands(P, d) {
  const wo = sub(P.wrR, P.haR);
  layArm(P, 'R', add(P.haR, d), sub(P.elR, lerp(P.shR, P.haR, 0.5)));
  P.wrR = add(P.haR, wo); P.blade = { h: P.haR, u: P.blade.u, e: P.blade.e };
}
function setBlade(P, u) { let e = sub(P.blade.e, mul(u, dot(P.blade.e, u))); e = V.len(e) > 1e-4 ? norm(e) : P.blade.e; P.blade = { h: P.haR, u, e }; }
// the back hand onto the handle; when the arm cannot reach that far (a blade drawn back by the blade-stop, an arm long out),
// both fists come toward the back shoulder by what is missing - the hand never hangs off the handle
function onHandle(P, grip) {
  const MX = LEN.uArm + LEN.fArm - 0.6;
  let T = madd(P.haR, P.blade.u, -grip);
  const dv = sub(T, P.shL), dl = V.len(dv);
  if (dl > MX) { moveHands(P, mul(dv, -(dl - MX) / dl)); T = madd(P.haR, P.blade.u, -grip); }
  const wo = sub(P.wrL, P.haL);
  layArm(P, 'L', T, sub(P.elL, lerp(P.shL, P.haL, 0.5)));
  P.wrL = add(P.haL, wo);
}
// Blades that are not cutting meet BETWEEN the bodies (the owner, 2026-11-19: two katanas crossed in an X through the
// faces): in a guard, a block, standing, a hit reaction, the recoil and the zanshin the sword hand stays on its own side
// of the middle (10 short of it) and the point stays 18 in front of the other's drawn head, neck and chest - the closer
// the two stand, the more upright the blade. Both doing it, the blades cross between them. w eases it in and out.
const MEET = { guardMid: 1, guardHi: 1, guardLow: 1, blockMid: 1, blockHi: 1, blockLow: 1, idle: 1, recoil: 1, stagger: 1, hurtHi: 1, hurtBody: 1, zanshin: 1 };
function frontOf(f, rg) {
  const o = f.opp, ro = o && MD.rigOf(o), Q = ro && ro.P;
  if (!Q || o.dead || o.hidden) return null;
  let m = Infinity;
  for (const j of ['head', 'neck', 'chest', 'shR', 'shL', 'hip']) if (Q[j]) m = Math.min(m, (ro.x + Q[j][0] * ro.dir - rg.x) * rg.dir);
  return { d: (ro.x - rg.x) * rg.dir, front: m };
}
function meet(f, rg, P, BL, w) {
  if (!(w > 0.001) || !P.armed) return;
  const F = frontOf(f, rg);
  if (!F || !(F.d > 20 && F.d < BL + 160)) return;
  const u = P.blade.u;
  if (u[0] <= 0.02 || u[1] > 0.25) return; // (only a blade that points forward and not down)
  const maxRx = Math.min(F.d / 2 - 10, F.front - 30);
  if (P.haR[0] > maxRx) moveHands(P, [(maxRx - P.haR[0]) * w, 0, 0]);
  const lim = (F.front - 18 - P.haR[0]) / BL;
  if (u[0] > lim) {
    const kk = Math.max(0, lim) / u[0], nx = u[0] * kk, nz = u[2] * kk, ny = -Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz));
    setBlade(P, norm(lerp(u, [nx, ny, nz], w)));
  }
}
// The game's one-frame-jump smoother (js/anim.js Pop) is off on frames drawn mostly new. Outside a cut, on the picture as
// it is drawn (after the fight's blade stop), a sword hand that would move more than 13 in one frame or a blade that would
// turn more than 0.2 rad (a gate of meet() opening, the blade stop pushing, a new move's first key) is eased there
// instead: no pop on any switch.
const HMAX = 13, AMAX = 0.2;
function settle(k, f, rg, o, dt, grip) {
  const q = k.so, u = o.blade && o.blade.u;
  if (q && q.u && u && o.armed && f.state !== 'atk' && q.dir === rg.dir && dt > 0 && dt < 0.05) {
    const sc = dt * 60, dh = sub(sub(o.haR, o.hip), q.h), dl = V.len(dh);
    // (never eased INTO the other's body: when the eased point would end up deeper in front of him than the drawn one, the
    // drawn one stays - the guard giving way to a lunge, the blade stop pushing it out)
    const BL = (f.wpn && f.wpn.blade) || LEN.blade, F0 = frontOf(f, rg), tipX = () => o.haR[0] + o.blade.u[0] * BL, t0 = tipX();
    const keep = {}; for (const j of ['elR', 'wrR', 'haR', 'elL', 'wrL', 'haL']) keep[j] = o[j]; keep.blade = o.blade;
    let ch = false;
    if (dl > HMAX * sc) { moveHands(o, mul(dh, -(dl - HMAX * sc) / dl)); ch = true; }
    const a = Math.acos(clamp(dot(o.blade.u, q.u), -1, 1));
    if (a > AMAX * sc && Math.sin(a) > 1e-3) {
      const t = (AMAX * sc) / a, sa = Math.sin(a);
      setBlade(o, norm(add(mul(q.u, Math.sin((1 - t) * a) / sa), mul(o.blade.u, Math.sin(t * a) / sa)))); ch = true;
    }
    if (ch && o.gripL >= 0.999) onHandle(o, grip);
    if (ch && F0 && F0.d < BL + 160 && tipX() > F0.front - 10 && tipX() > t0 + 0.5) {
      // (only as far toward the drawn picture as keeps the point out: the least step that does, or all of it)
      const he = o.haR, ue = o.blade.u;
      let sb = 1;
      for (const s of [0.25, 0.5, 0.75]) { const hx = he[0] + (keep.haR[0] - he[0]) * s, ux = norm(lerp(ue, keep.blade.u, s)); if (hx + ux[0] * BL <= Math.max(F0.front - 10, t0)) { sb = s; break; } }
      const hs = lerp(he, keep.haR, sb), us = norm(lerp(ue, keep.blade.u, sb));
      Object.assign(o, keep);
      if (sb < 1) { moveHands(o, sub(hs, o.haR)); setBlade(o, us); if (o.gripL >= 0.999) onHandle(o, grip); }
    }
  }
  k.so = o.blade ? { h: sub(o.haR, o.hip), u: o.blade.u, dir: rg.dir } : null;
}
// After the cut (past its active window) the follow-through does not go on through the other's body: the point stops 6
// in front of his drawn head, neck, chest and hips, the blade turning upright (or down) instead; the fists stay 12 short.
function clear(f, rg, P, BL, w) {
  if (!P.armed) return;
  const F = frontOf(f, rg);
  if (!F || !(F.d > 10 && F.d < BL + 160)) return;
  if (P.haR[0] > F.front - 12) moveHands(P, [(F.front - 12 - P.haR[0]) * w, 0, 0]);
  const u = P.blade.u, lim = (F.front - 6 - P.haR[0]) / BL;
  if (u[0] > 0 && u[0] > lim) {
    const kk = Math.max(0, lim) / u[0], nx = u[0] * kk, nz = u[2] * kk, ny = (u[1] >= 0 ? 1 : -1) * Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz));
    setBlade(P, norm(lerp(u, [nx, ny, nz], w)));
  }
}
// the fight's own contact / aim (js/mocap-duel.js override: rg.ovr, local, by weight): the blocked cut onto the other's
// blade, the landing one onto the body - js/mocap.js build does this for the game's picture; the new one takes it too
function aimOn(rg, P) {
  const O = rg.ovr;
  if (!O || !(O.w > 0) || !P.armed) return;
  const wo = sub(P.wrR, P.haR);
  layArm(P, 'R', lerp(P.haR, O.h, O.w), sub(P.elR, lerp(P.shR, P.haR, 0.5)));
  P.wrR = add(P.haR, wo);
  const u = O.u ? norm(lerp(P.blade.u, O.u, O.w)) : P.blade.u;
  let e = O.e ? norm(lerp(P.blade.e, O.e, O.w)) : P.blade.e; e = norm(sub(e, mul(u, dot(e, u))));
  P.blade = { h: P.haR, u, e };
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
  if (!want && (k.w <= 0 || !k.cur)) { k.cur = null; k.feet = null; k.prevP = null; k.w = 0; k.so = null; k.px = null; return null; }
  let ch;
  if (want) {
    const c = chAt(want.id, want.t);
    if (k.cur && k.cur.id !== want.id && k.lastCh) { k.bl = { from: k.lastCh, t: 0 }; K.moves++; }
    if (k.bl) { k.bl.t += dt; const u = clamp(k.bl.t / CHX, 0, 1); ch = u >= 1 ? c : blendCh(k.bl.from, c, smooth(u)); if (u >= 1) k.bl = null; } else ch = c;
    k.cur = want; k.lastCh = ch;
  } else ch = k.lastCh;
  const grip = gripOf(f.wpn), BL = (f.wpn && f.wpn.blade) || LEN.blade;
  const P = poseFromCh(k.cur.id, ch, k.cur.t, k.prevP, { grip });
  planFeet(k, rg, P, dt, gP);
  P.saya = sayaFor(f, P, gP);
  // (the fight's height: on the floor here, kept for a frame the fight lifts it)
  if (rg.y) for (const j of JS) P[j] = [P[j][0], P[j][1] + rg.y, P[j][2]];
  k.mw = clamp((k.mw || 0) + ((want ? MEET[want.id] : MEET[k.cur.id]) ? 1 : -1) * dt / 0.1, 0, 1);
  meet(f, rg, P, BL, smooth(k.mw));
  aimOn(rg, P);
  if (f.state === 'atk' && f.atk && f.atk.active) { const w2 = clamp((f.st - f.atk.active[1]) / 0.03, 0, 1); if (w2 > 0) clear(f, rg, P, BL, smooth(w2)); }
  if (P.gripL >= 0.999) onHandle(P, grip);
  k.prevP = P;
  const out = mix(gP, P, smooth(k.w), grip);
  // (the mark the Pop hook reads: only on a frame drawn mostly new - under that, the game's own picture jumping is smoothed
  // as in the game)
  if (k.w >= 0.5) out.kilic = [1, 0, 0]; else delete out.kilic;
  out.kilicW = k.w;
  K.frames++;
  return out;
}
const build1 = Mo.Rig.prototype.build;
// (js/mocap.js build fills the LAST pose object again (this.P || {}): after a frame drawn new, that is ours - its marks
// and own fields stayed on the game's picture (the Pop hook then took every later frame of the game's own moves for a new
// one and left their jumps unsmoothed). The game's build gets a clean copy.)
const OWNF = ['kilic', 'kilicW', 'fP', 'draw', 'reachR', 'reachL', 'gripErr', 'legReachR', 'legReachL'];
Mo.Rig.prototype.build = function (F, dt) {
  if (this.P && (this.P.kilic || this.P.kilicW != null)) { const q = Object.assign({}, this.P); for (const n of OWNF) delete q[n]; this.P = q; }
  const gP = build1.call(this, F, dt), f = this.look;
  if (!K.on || !this.driven || !f || !f.dz) return gP;
  try { return ours(f, this, gP, dt || 0) || gP; } catch (e) { K.errors++; if (K.errors < 4) console.error('kilic', e); return gP; }
};

// ------------------------------------------------------------------ 4. after the pair is settled
const draw1 = Mo.draw;
Mo.draw = function (ctx, rg) {
  const P = rg && rg.P;
  const kd = rg && rg.look && KS.get(rg.look);
  // (eased on the frames drawn new, and on the game's own frames for 0.15 s after them - the switch back has no pop
  // either; on the game's other frames only remembered, so the first frame of a switch to the new one is eased too)
  if (kd && P) {
    const fresh = P.kilicW > 0;
    if (fresh) kd.tail = 9; else if (kd.tail > 0) kd.tail--;
    try { if (fresh || kd.tail > 0) settle(kd, rg.look, rg, P, 1 / 60, gripOf(rg.look.wpn)); else kd.so = P.blade ? { h: sub(P.haR, P.hip), u: P.blade.u, dir: rg.dir } : null; } catch (e) { K.errors++; }
  }
  if (P && P.kilic && P.kilicW >= 0.999 && rg.look) {
    try {
      const k = kd;
      if (k && k.feet) for (const s of ['R', 'L']) { const F = k.feet[s]; layLeg(P, s, [(F.x - rg.x) * rg.dir, F.y + (rg.y || 0), F.z]); }
      if (P.armed && P.gripL >= 0.999) onHandle(P, gripOf(rg.look.wpn));
    } catch (e) { K.errors++; }
  }
  return draw1.apply(this, arguments);
};
K.ready = true;
