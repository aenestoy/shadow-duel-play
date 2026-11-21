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
//  6. Phase 3 (owner 2026-11-19 "Evet, başla"): walking, back-steps and the run (gaits: their clock is the ground the
//     body covers, the feet planted on the floor), the fall (the fight's 'launch', in the air), the floor and the rise
//     ('down' + 'getup', one move on the fight's own clock), the throw; Akane with the sword in the saya stands, walks and
//     falls in the same moves with her hand on the hilt. A blade never rests in the other's head or body as drawn (the
//     last pass before drawing), and blades that are not cutting keep out of the fight's blade-stop zones (no push).
import { MOVES, ORDER, chAt, blendCh, poseFromCh, layLeg, layArm, durOf, gaitFeet, walkFeetLive, strideOf, V, LEN, followCh, flipFollow, strikeAt, blendU, turnU, flatDrawn, fromScr, drawnR, BP_W, govStep, scrP, rotToScr, footAt } from './moves.js';
import { installCombos } from './combos.js';
const { add, sub, mul, madd, dot, norm, lerp } = V;

const KF = 0.595; // fight seconds of a cut per real second at speed 1 (the duel's 0.85 time scale × its 0.7 cut speed)
// duel cut → hand-keyed move (the same kind of cut: side, height, thrust)
export const MAP = {
  ak_dKesa: 'kesaS', d_kesaR: 'kesaS', d_kesaL: 'gyakuS', d_shomen: 'menS', d_kote: 'menS', ak_dNuki: 'yokoL', d_doL: 'yokoL',
  d_tsukiL3: 'tsukiS', d_tsuki: 'tsukiS', d_tobikomi: 'tsukiS', d_wallL: 'tsukiS', d_men: 'overhead',
};
// (3b) duel moves played on the fight's own clock - not retimed, the game's timing untouched: the fight's hit window is
// laid onto the move's phases.active, the wind-up and the recovery stretched to fit (the kicks with the sword in hand,
// kiri-age, the shin cut, the running cut and the heavy back-hand cuts)
export const PLAY = {
  d_kakato: 'kakato', dk_sweep: 'sweep', d_ashibarai: 'sweep', dk_spin: 'spinKick', dk_wrist: 'snapKick', d_hiza: 'knee',
  ak_nidan: 'nidan', d_kiriUp: 'kiriR', ak_dKiri: 'kiriL', d_antiL: 'kiriL', d_suneR: 'sune', d_dashR: 'horizontal',
  d_kesaH: 'gyakuS', d_nagare: 'gyakuS',
  // (the disarms and the rock splitter: maki-otoshi rises from the right, uchi-otoshi and iwa-kudaki come down from above)
  ak_maki: 'kiriR', kr_uchi: 'menS', kr_iwa: 'overhead',
  // (phase 4) the strings and specials (several blows: phases.hits on the fight's own a.hits), the air chase, and the
  // counters out of a deflection (js/fighter.js kaeshi: riposte..., sweep, mawari, kaeshiHeavy, finisher)
  ak_tsubame: 'tsubame', ak_s1: 'renga', ak_s2: 'higan', sp_akane: 'issen', sp_kuro: 'yama', chase: 'airCut', chaseEnd: 'airSpike',
  finisher: 'sandan', riposte: 'menS', riposte2: 'kiriL', riposte3: 'tsukiS', riposte4: 'horizontal', ak_rip: 'yokoL',
  nd_riposte: 'menS', nd_riposte2: 'kiriL', nd_riposte3: 'tsukiS', nd_riposte4: 'horizontal',
  sweep: 'sune', sweep2: 'sune', kaeshiHeavy: 'thrust', kaeshiHeavy2: 'overhead', mawari: 'mawari', mawari2: 'mawari', kr_kuruma: 'kuruma',
  // (phase 7) Akane's three new combos (combos.js): the rising kick, the air rising cut, the draw finisher, the low-high
  kz_age: 'kzAge', kz_tengu: 'kzTengu', kz_iai: 'kzIai', kz_kasumi: 'kasumi',
  // (fix 2, 2026-11-20) the last cuts the fight drew the old way: Akane's two combos from the saya, and Kuro's str1
  // (Yama-oroshi: the katana family's string ender js/specials.js fk_s1 - ATK.str1 is that object; two blows, as renga)
  ak_kage: 'kage', ak_ryusei: 'ryusei', str1: 'oroshi', fk_s1: 'oroshi',
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
// (phase 7: the new combos' moves, routes, guard rule, AI and move list - before the ATK names are read just below)
installCombos({ ND, D, K, ATK });
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
  if (K.kzSet) K.kzSet(on);
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
// The letterbox (3b, the reviewer: "a dark band at the bottom when the camera zooms in"): js/duel-fin-ui.js draws a thin
// bar at the top and the bottom of the screen through a counter cinematic / a choreographed exchange (rgba(4,4,8,.85),
// 5.5 % of the height), js/game.js a black one through a lock and the KO (8.5 %). With the camera close the fighters stand
// low on the screen and the bottom bar reads as the empty floor under them. Today's game draws them too; while this is
// on they are left out of the fight (the KO replay keeps its own).
{
  const cine = ND.cine, cd0 = cine && cine.draw;
  if (cd0) cine.draw = function (ctx) {
    if (!K.on || !ctx) return cd0.apply(this, arguments);
    const fr = ctx.fillRect, C = ND.cam;
    ctx.fillRect = function (x, y, w, h) { if (x === 0 && w === C.W && h < C.H * 0.06 && (y === 0 || Math.abs(y + h - C.H) < 1) && /^rgba\(4, ?4, ?8/.test(String(this.fillStyle))) return; return fr.call(this, x, y, w, h); };
    try { return cd0.apply(this, arguments); } finally { ctx.fillRect = fr; }
  };
  const ov0 = g.overlays;
  if (ov0) g.overlays = function () {
    if (!K.on || (this.phase !== 'fight' && this.phase !== 'ko')) return ov0.apply(this, arguments);
    const b = this.bars; this.bars = 0;
    try { return ov0.apply(this, arguments); } finally { this.bars = b; }
  };
}
// fight time (the cut's own seconds, f.st) → the move's ms: 0, the hit window, the end
const WARP = new Map();
function playT(n, t) {
  let W = WARP.get(n);
  if (!W) {
    const a = ATK[n], id = PLAY[n], ph = MOVES[id].phases, ks = a.keys || [];
    const end = a.dur || (ks.length ? ks[ks.length - 1][0] : (a.active ? a.active[1] * 2 : 0.5));
    const A = a.active || [end * 0.3, end * 0.5];
    W = { X: [0, A[0], A[1], end], Y: [0, ph.active[0], ph.active[1], durOf(id)] };
    // (phase 4: a move of several blows - its phases.hits against the fight's own a.hits, window by window)
    if (ph.hits && a.hits && a.hits.length === ph.hits.length) { W.X = [0]; W.Y = [0]; a.hits.forEach((h, i) => { W.X.push(h[0], h[1]); W.Y.push(ph.hits[i][0], ph.hits[i][1]); }); W.X.push(end); W.Y.push(durOf(id)); }
    WARP.set(n, W);
  }
  const { X, Y } = W, L = X.length;
  for (let i = 1; i < L; i++) if (t <= X[i]) return Y[i - 1] + ((t - X[i - 1]) * (Y[i] - Y[i - 1])) / Math.max(1e-6, X[i] - X[i - 1]);
  return Y[L - 1];
}
K.PLAY = PLAY; K.playT = playT;
K.why = (f) => { const k = KS.get(f); return k ? k.why || '' : ''; }; // (tools: why a frame kept the game's picture)
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
const ks = (f) => { let k = KS.get(f); if (!k) KS.set(f, (k = { w: 0, cur: null, lastCh: null, bl: null, prevP: null, feet: null, lastSt: '', stAtk: null, stT: 0, idleT: 0, entryOut: false, gh: 'Mid', hh: 'Body', shT: 0, g: { id: null, u: 0, S: 0, x: null, dir: 0 } })); return k; };
// the gait clock: the ground the drawn body covered since the last frame (the fight's x, the keep-apart's offset in it)
function gaitAt(k, rg, id, sp) {
  const G = k.g, Sw = strideOf(id, sp);
  if (G.x == null || G.dir !== rg.dir || (G.id && ((G.id === 'walkB') !== (id === 'walkB') || (G.id === 'run') !== (id === 'run')))) { G.u = 0; G.S = Sw; G.x = rg.x; G.live = {}; }
  if (!G.S) G.S = Sw;
  G.id = id; G.dir = rg.dir;
  const d = Math.abs(rg.x - G.x); G.x = rg.x;
  const u0 = G.u; G.u = (G.u + Math.min(0.2, d / Math.abs(G.S))) % 1;
  // (the stride changes only when both feet are on the floor: a planted foot never moves under a new stride)
  if ((u0 < 0.5 && G.u >= 0.5) || G.u < u0) G.S = Sw;
  if (id === 'run' && G.S < 0) G.S = Sw;
  if (MOVES[id].gait.kind !== 'walk') return { id, t: G.u * durOf(id), feet: gaitFeet(id, G.u, G.S) };
  // (the walk: each swing leaves from where the foot really is - moves.js walkFeetLive)
  const at = (s) => (k.feet && k.feet[s] ? [k.feet[s].x, k.feet[s].z] : [rg.x + MOVES.idle.feet[s][0] * rg.dir, MOVES.idle.feet[s][1]]);
  return { id, t: G.u * durOf(id), feet: walkFeetLive(G.live || (G.live = {}), G.u, G.S, rg.x, rg.dir, at) };
}
// (phase 4) the arena moments drawn new (js/duel-env.js ACT: f.dz.env.a, its own clock c.t): the blade bitten by the
// post and tugged free, the defender's hop round the post into a kick
const ENV = { stuck: 'stuck', dodgePost: 'dodgePost' };
function airMove(f) {
  if (f.state === 'atk') { const id = PLAY[ATKID.get(f.atk)]; return !!(id && MOVES[id] && MOVES[id].air); }
  if (f.state === 'denv') { const c = f.dz && f.dz.env, id = c && ENV[c.a]; return !!(id && MOVES[id].air); }
  return false;
}
// (phase 4) the moves that turn round with the fight's own facing flip: mawari (turnAt - a.turn: its keys after the flip
// are turned 180 more, so nothing moves in the picture; drawn on the right side of it by the flip itself, never between),
// and the specials that end facing him (turnFrom: they turn round from there, only when he is behind - the fight then
// flips the facing as the move ends; when he is not, the move waits at the start of the turn)
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
  // (Akane's sword home in the saya: once the game's own sheathe has played, 0.55 s, the new moves stand, walk and fall
  // with her hand on the hilt)
  const sh = !!(f.wpn && f.wpn.iai && f.sheathed && f.sheathed());
  k.shT = sh ? k.shT + dt : 0;
  const shOK = sh && k.shT > 0.6;
  if (st !== k.lastSt || (st === 'atk' && f.atk !== k.stAtk)) {
    k.lastSt = st; k.stAtk = st === 'atk' ? f.atk : null; k.stT = 0; k.entryOut = out || (k.w > 0.5 && !!k.cur); k.startSh = sh || !!(k.lastSh && k.w > 0.5);
    if (st === 'block' || st === 'hurt') { const h = guardH(f); k.gh = h; k.hh = h === 'Hi' ? 'Hi' : 'Body'; }
    if (st === 'block' && k.cur && /^guard/.test(k.cur.id)) k.gh = k.cur.id.slice(5);
  } else {
    k.stT += dt;
    // (phase 7: the low-high's second blow blocked or landing restarts the state - its own height)
    if ((st === 'block' || st === 'hurt') && f.st + 1e-6 < (k.pst || 0) && f.opp && K.kzId && K.kzId(f.opp.atk) === 'kz_kasumi') { const h = guardH(f); k.gh = h; k.hh = h === 'Hi' ? 'Hi' : 'Body'; }
  }
  k.pst = f.st;
  if (st !== 'launch' && st !== 'hurt') f._kzR = null;
  const fall = st === 'launch' || st === 'down' || st === 'getup';
  if (st !== 'move') k.g.x = null;
  k.why = '';
  // (phase 4: a move of its own in the air - a jumping special, the air chase, the hop round the post: the fight's height
  // carries the body, the move's own legs tuck)
  const airOK = airMove(f);
  if (f.dead || f.hidden || (!fall && !airOK && (!f.onGround || f.y < -2)) || f.roll || !f.dz || f.dz.armed === false) { k.why = f.roll ? 'roll' : !f.onGround || f.y < -2 ? 'air' : f.dz && f.dz.armed === false ? 'unarmed' : 'x'; return null; }
  // (after a finishing cut - the fight's zanshin, a counter's held pose (js/duel-fin.js 'dfinp': chiburi, then a stance
  // with the blade out that hung to the floor) - the striker's blade, while it is out: the new zanshin, then the guard)
  // (phase 4: the bind - js/duel.js startBind, both in 'dbind' with the bind as their cinematic: its own clocks, the
  // bind c.t then the strike c.t2; the hands and blade go to the fight's crossing through rg.ovr, aimOn below)
  if (st === 'dbind' && out) {
    const c = f.dz.cine;
    if (c && !c.done && (c.def === f || c.att === f)) {
      const isDef = c.def === f;
      if (c.ph === 'bind') return { id: isDef ? 'bindDef' : 'bindAtt', t: c.t * 1000 };
      if (c.ph === 'strike') return { id: isDef ? 'makiDef' : 'flungAtt', t: c.t2 * 1000 };
    }
  }
  const zan = (st === 'zanshin' || st === 'dfinp') && out && !(f.dz.cine && !f.dz.cine.done && f.dz.cine.A && f.dz.cine.A !== f);
  // (phase 4: the counter cinematics - js/duel-fin.js - play the fight's own states and moves on fixed clocks: the
  // reactions, falls and cuts in them draw the new way too; only the market showpiece (dseq, props) and the dash past
  // (a vault over him) keep the game's picture)
  if (!zan && (st === 'dseq' || (D.passing && (D.passing(f) || (f.opp && D.passing(f.opp)))))) { k.why = st === 'dseq' ? 'dseq' : 'pass'; return null; }
  const thr = st === 'atk' && ATKID.get(f.atk) === 'throw';
  // (a fall, a walk and the throw draw the new way from any picture: the sword out, or home in the saya)
  // (knocked down, hit, staggered or the round won with the sword home in the saya: the game's picture shows it inside
  // (js/mocap.js: inside, nothing of the blade out), or the new one was already drawing it sheathed - the same moves with
  // the hand on the hilt)
  const react = st === 'hurt' || st === 'stagger' || st === 'gbreak' || st === 'win';
  const shG = !!(f.wpn && f.wpn.iai && gP && gP.armed && gP.inside && (gP.bladeVis == null || gP.bladeVis < 10));
  const shR = (fall || react) && !out && !!(f.wpn && f.wpn.iai) && (sh || shG || (k.lastSh && k.w > 0.5));
  const free = ((fall || st === 'move' || thr) && (out || shOK || (thr && sh))) || shR || (st === 'win' && out);
  // (the sword going home - the game's sheathe, 0.55 s from the moment f.sheathed() turns true: the new noto, then the
  // sheathed stance)
  if (sh && k.shT <= 0.6 && (st === 'move' || st === 'land' || st === 'zanshin' || st === 'dfinp')) return { id: 'noto', t: k.shT * 1000 };
  // (a cinematic's held pose with the sword home: her iai stance)
  if (st === 'dfinp' && sh) return { id: 'idle', t: k.stT * 1000, sh: true };
  // (a move that starts from the saya - phase 4's specials: their keys draw the blade themselves)
  // (drawn all through - in the saya, the draw and out - whatever drew the frame before)
  if (st === 'atk' && PLAY[ATKID.get(f.atk)] && MOVES[PLAY[ATKID.get(f.atk)]].saya) { const n = ATKID.get(f.atk), t = turnT(f, PLAY[n], playT(n, f.st)); return t == null ? null : { id: PLAY[n], t }; }
  // (Akane's nukitsuke from the saya: the new one-handed draw-cut on the same clock as the retimed ak_dNuki)
  if (st === 'atk' && k.startSh && ATKID.get(f.atk) === 'ak_dNuki' && f.wpn && f.wpn.iai) return { id: 'nuki', t: (f.st * 1000) / KF };
  if (!k.entryOut && !zan && !free) { k.why = 'entry'; return null; }
  const fr = (T) => clamp(f.st / Math.max(0.05, T), 0, 1), shd = !out && (shOK || shR || (thr && sh));
  switch (st) {
    case 'atk': {
      if (thr) { if (!free && !sh) return null; const a = f.atk, T = a.dur || (a.keys && a.keys.length ? a.keys[a.keys.length - 1][0] : 0.44); return { id: 'throwL', t: fr(T) * durOf('throwL'), sh: shd }; }
      const n = ATKID.get(f.atk), id = MAP[n]; if (id) return { id, t: (f.st * 1000) / KF };
      // (one that starts from the saya - a.sheath - with the sword home keeps the game's draw: these moves start drawn)
      if (k.startSh && f.atk.sheath) { k.why = 'saya'; return null; }
      if (!PLAY[n] || !MOVES[PLAY[n]]) return null;
      const t = turnT(f, PLAY[n], playT(n, f.st));
      if (t == null) { k.why = 'noturn'; return null; }
      return { id: PLAY[n], t };
    }
    // knocked off the feet: in the air (the fight's own height carries the body), then on the floor and up, one move on
    // the fight's clock ('down' 0.75 s, then 'getup' 0.46 s)
    // (phase 7: kicked up by the rising kick, cut in the air by the air rising cut - their own reactions, on the state's
    // clock from the blow: both end in the fall's held pose)
    case 'launch': return free ? (f._kzR === 'launchUp' || f._kzR === 'airHit' ? { id: f._kzR, t: f.st * 1000, sh: shd } : { id: 'fall', t: k.stT * 1000, sh: shd }) : null;
    case 'down': return free ? { id: 'downRise', t: f.st * 1000, sh: shd } : null;
    case 'getup': return free ? { id: 'downRise', t: (0.75 + f.st) * 1000, sh: shd } : null;
    case 'guard': { const id = 'guard' + guardH(f), M = MOVES[id]; return { id, t: Math.min(k.stT * 1000, M.keys[M.hold].t) }; }
    case 'block': return { id: 'block' + k.gh, t: fr(f.dur || 0.3) * durOf('blockMid') };
    // the dodge (0.36 s): the body swayed back or dashing in, the feet stepping under the fight's own travel
    case 'dodge': return { id: f.back ? 'dodgeB' : 'dodgeF', t: fr(0.36) * durOf('dodgeB') };
    // the parry (0.2 s): one hard beat that sends his cut the way the fight's deflection does (f.pv.dir), back to guard
    case 'parry': { const d = f.pv && f.pv.dir, id = d === 'up' ? 'parryUp' : d === 'down' ? 'parryDown' : 'parrySide'; return { id, t: fr(0.2) * durOf(id) }; }
    case 'hurt': return { id: f._kzR === 'hurtLow' ? 'hurtLow' : 'hurt' + k.hh, t: fr(f.dur || 0.4) * durOf('hurtHi'), sh: shd };
    case 'stagger': return { id: 'stagger', t: fr(0.74) * durOf('stagger'), sh: shd };
    // the guard broken (1.2 s: knocked open by 0.15, held to 1.0, back by 1.2): the stagger with its held part stretched
    case 'gbreak': { const s = f.st, u = s < 0.15 ? (s / 0.15) * 0.1 : s < 1 ? 0.1 + ((s - 0.15) / 0.85) * 0.45 : 0.55 + Math.min(1, (s - 1) / 0.2) * 0.19; return { id: 'stagger', t: (u / 0.74) * durOf('stagger'), sh: shd }; }
    // the round won: the zanshin (flick, the point on him, back to guard) with the blade out; sheathed, her iai stance
    case 'win': return out ? { id: 'zanshin', t: k.stT * 1000 } : shd ? { id: 'idle', t: k.stT * 1000, sh: true } : null;
    case 'recoil': return { id: 'recoil', t: fr(f.rkEnd || 0.32) * durOf('recoil') };
    // (phase 4) the lock (js/game.js: up to 2.8 s, the mash winner presses in), the shove that wins it (0.3 s), the clash
    // (0.34 s: two cuts met, or the bind escaped)
    case 'lock': return { id: f.lockWin ? 'lockPush' : 'lock', t: k.stT * 1000 };
    case 'shove': return { id: 'shove', t: fr(0.3) * durOf('shove') };
    case 'clash': return { id: 'clash', t: fr(0.34) * durOf('clash') };
    // (the recorded walk starts at 40 (js/mocap-duel.js direct); slower than that its idle played: the new one does)
    case 'move': {
      if (!(out || shOK)) return null;
      const sp = f.vx * (f.dir < 0 ? -1 : 1);
      if (Math.abs(sp) < 40 || !rg) { k.g.x = null; k.idleT += dt; return { id: 'idle', t: k.idleT * 1000, sh: shd }; }
      return Object.assign(gaitAt(k, rg, sp > 260 ? 'run' : sp > 0 ? 'walkF' : 'walkB', sp), { sh: shd });
    }
    case 'zanshin': case 'dfinp': return zan ? { id: 'zanshin', t: k.stT * 1000 } : null;
    // (phase 4) back on the floor after the air (js/fighter.js 'land', ~0.1 s): the guard stance
    case 'land': return out ? { id: 'idle', t: k.stT * 1000 } : null;
    case 'denv': { const c = f.dz.env, id = c && ENV[c.a]; return id && out ? { id, t: c.t * 1000 } : null; }
    default: return null;
  }
}

// ------------------------------------------------------------------ the feet: planted on the floor, real steps
function planFeet(k, rg, P, dt, gP) {
  const dir = rg.dir, gait = !!(k.cur && MOVES[k.cur.id] && MOVES[k.cur.id].gait);
  if (!k.feet) { k.feet = {}; for (const s of ['R', 'L']) { const p = (gP && gP['ft' + s]) || P['ft' + s]; k.feet[s] = { x: rg.x + p[0] * dir, y: 0, z: p[2], st: null }; } }
  const want = { R: P.ftR, L: P.ftL };
  const errOf = (s) => want[s][0] - (k.feet[s].x - rg.x) * dir;
  // (a foot that the move itself lifts follows the move)
  for (const s of ['R', 'L']) { const F = k.feet[s], d = want[s]; if (d[1] < -0.5 || P.ownFeet) { F.x = rg.x + d[0] * dir; F.y = d[1]; F.z = d[2]; F.st = null; F.own = true; } else if (F.own) { F.own = false; F.y = 0; } }
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
    for (const s of ['R', 'L']) { const F = k.feet[s]; if (F.own) continue; const e = Math.abs(errOf(s)) + (reach(s) > (gait ? 0.99 : 0.97) ? 50 : 0); if (e > 7 && e > be) { best = s; be = e; } }
    if (best) go(best);
  }
  // (a planted foot the leg can no longer reach is never dragged along the floor: it steps at once, even while the
  // other foot is stepping)
  // (looked one frame ahead: a lunge would carry the body past the leg's reach before the next frame's check)
  // (a walk's own swing comes in time: its planted foot only steps early when the leg truly cannot reach)
  for (const s of ['R', 'L']) { const F = k.feet[s]; if (!F.st && !F.own && reach(s) + (gait ? 0 : ahead) > (gait ? 0.995 : 0.985)) go(s); }
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
const MEET = { guardMid: 1, guardHi: 1, guardLow: 1, blockMid: 1, blockHi: 1, blockLow: 1, idle: 1, recoil: 1, stagger: 1, hurtHi: 1, hurtBody: 1, hurtLow: 1, zanshin: 1, walkF: 1, walkB: 1, run: 1, throwL: 1, parryUp: 1, parryDown: 1, parrySide: 1, dodgeB: 1, dodgeF: 1 };
// (front: the nearest joint centre of the other; zone: how far in front of the other's head, neck, chest, shoulders and
// hips the fight's own blade-stop (js/mocap-duel.js bladeStop: head 22, neck point 26, torso 21 round the spine) starts to
// push a blade - a point kept that far out is never pushed, so never jumps)
const ZONE = { head: 28, neck: 30, chest: 26, shR: 24, shL: 24, hip: 26, knR: 14, knL: 14 };
function frontOf(f, rg) {
  const o = f.opp, ro = o && MD.rigOf(o), Q = ro && ro.P;
  if (!Q || o.dead || o.hidden) return null;
  let m = Infinity, z = Infinity;
  for (const j of ['head', 'neck', 'chest', 'shR', 'shL', 'hip']) if (Q[j]) m = Math.min(m, (ro.x + Q[j][0] * ro.dir - rg.x) * rg.dir);
  for (const j in ZONE) if (Q[j]) z = Math.min(z, (ro.x + Q[j][0] * ro.dir - rg.x) * rg.dir - ZONE[j]);
  return { d: (ro.x - rg.x) * rg.dir, front: m, zone: z };
}
function meet(f, rg, P, BL, w) {
  if (!(w > 0.001) || !P.armed) return;
  const F = frontOf(f, rg);
  if (!F || !(F.d > 20 && F.d < BL + 160)) return;
  const u = P.blade.u;
  if (u[0] <= 0.02 || u[1] > 0.25) return; // (only a blade that points forward and not down)
  const maxRx = Math.min(F.d / 2 - 10, F.front - 30);
  if (P.haR[0] > maxRx) moveHands(P, [(maxRx - P.haR[0]) * w, 0, 0]);
  const lim = (F.zone - P.haR[0]) / BL;
  if (u[0] > lim) {
    const kk = Math.max(0, lim) / u[0], nx = u[0] * kk, nz = u[2] * kk, ny = -Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz));
    setBlade(P, norm(lerp(u, [nx, ny, nz], w)));
  }
}
// The game's one-frame-jump smoother (js/anim.js Pop) is off on frames drawn mostly new. Outside a cut, on the picture as
// it is drawn (after the fight's blade stop), a sword hand that would move more than 13 in one frame or a blade that would
// turn more than 0.2 rad (a gate of meet() opening, the blade stop pushing, a new move's first key) is eased there
// instead: no pop on any switch.
const HMAX = 10, AMAX = 0.14;
// (2026-11-20) in a strike window: the fight's hit window (+-0.02 s of the cut's clock) or the drawn new move's own
// (moves.js strikeAt: phases.active / hits / beat +-35 ms)
function strikeNow(f, k) {
  if (f.state === 'atk' && f.atk) { const W = f.atk.hits || (f.atk.active ? [f.atk.active] : []); if (W.some((w) => f.st >= w[0] - 0.02 && f.st <= w[1] + 0.02)) return true; }
  return !!(k && k.cur && k.w >= 0.5 && MOVES[k.cur.id] && strikeAt(MOVES[k.cur.id], k.cur.t));
}
function settle(k, f, rg, o, dt, grip) {
  const q = k.so, u = o.blade && o.blade.u;
  k.sr = q && q.u && u && o.armed ? (f.state !== 'atk' ? 1 : 0) + (q.dir === rg.dir ? 2 : 0) : -1;
  // (2026-11-20: the blade's turn is also held in a cut outside its strike window - the windup, the follow-through, the
  // stop after it - at the moves' own limit BP_W a frame; the fist only outside a cut, as before)
  const inAtk = f.state === 'atk';
  if (q && q.u && u && o.armed && (!inAtk || !strikeNow(f, k)) && q.dir === rg.dir && dt > 0 && dt < 0.05) {
    const sc = dt * 60, dh = sub(sub(o.haR, o.hip), q.h), dl = V.len(dh);
    // (never eased INTO the other's body: when the eased point would end up deeper in front of him than the drawn one, the
    // drawn one stays - the guard giving way to a lunge, the blade stop pushing it out)
    const BL = (f.wpn && f.wpn.blade) || LEN.blade, F0 = frontOf(f, rg), tipX = () => o.haR[0] + o.blade.u[0] * BL, t0 = tipX();
    const keep = {}; for (const j of ['elR', 'wrR', 'haR', 'elL', 'wrL', 'haL']) keep[j] = o[j]; keep.blade = o.blade;
    let ch = false;
    if (!inAtk && dl > HMAX * sc) { moveHands(o, mul(dh, -(dl - HMAX * sc) / dl)); ch = true; }
    // (fix 3: the blade's turn is the last-word governor's alone - govern2, one memory: the fist only here)
    if (!K.gov1) { k.sc = ch ? 1 : 0; if (ch && o.gripL >= 0.999) onHandle(o, grip); k.so = { h: sub(o.haR, o.hip), u: o.blade.u, dir: rg.dir }; return; }
    // (the turn on the SCREEN, never through pointing at the camera: moves.js turnU; a 3D slerp between two blades held
    // flat could pass the camera line)
    const am = (inAtk ? BP_W : AMAX) * sc, a = Math.abs(Math.atan2(Math.sin(Math.atan2(o.blade.u[1], o.blade.u[0]) - Math.atan2(q.u[1], q.u[0])), Math.cos(Math.atan2(o.blade.u[1], o.blade.u[0]) - Math.atan2(q.u[1], q.u[0]))));
    if (a > am) { setBlade(o, turnU(q.u, o.blade.u, am)); ch = true; }
    k.sc = ch ? (!inAtk && dl > HMAX * sc ? 1 : 0) + (a > am ? 2 : 0) : 0;
    if (ch && o.gripL >= 0.999) onHandle(o, grip);
    if (ch && F0 && F0.d < BL + 160 && tipX() > F0.front - 10 && tipX() > t0 + 0.5) {
      // (the point kept out of his body with the least jump: either only as far toward the drawn picture as keeps it
      // out (the least of ten steps that does), or the eased fist kept and the eased blade stood up (or down) just enough
      // - whichever moves the point least from where it was drawn last frame)
      const he = o.haR, ue = o.blade.u, lim0 = Math.max(F0.front - 10, t0), cands = [];
      for (let s = 0.1; s < 1.001; s += 0.1) { const hs = lerp(he, keep.haR, s), us = norm(lerp(ue, keep.blade.u, s)); if (hs[0] + us[0] * BL <= lim0 || s > 0.95) { cands.push({ h: hs, u: us }); break; } }
      const lim = (lim0 - he[0]) / BL;
      if (ue[0] > 0 && lim > -0.95) { const kk = Math.min(1, Math.max(0, lim) / ue[0]), nx = ue[0] * kk, nz = ue[2] * kk, ny = (ue[1] >= 0 ? 1 : -1) * Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz)); cands.push({ h: he, u: norm([nx, ny, nz]) }); }
      // (2026-11-20, the sword's motion: the drawn blade on the other side of level than the eased one - the short way round
      // runs through him - turns the long way, round the back, at the same limit: stood down every frame instead, it hung
      // straight down from the hands for the whole follow-through)
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
// After the cut (past its active window) the follow-through does not go on through the other's body: the point stops 6
// in front of his drawn head, neck, chest and hips, the blade turning upright (or down) instead; the fists stay 12 short.
function clear(f, rg, P, BL, w) {
  if (!P.armed) return;
  const F = frontOf(f, rg);
  if (!F || !(F.d > 10 && F.d < BL + 160)) return;
  if (P.haR[0] > F.front - 12) moveHands(P, [(F.front - 12 - P.haR[0]) * w, 0, 0]);
  const u = P.blade.u, lim = (Math.min(F.front - 6, F.zone + 6) - P.haR[0]) / BL;
  if (u[0] > 0 && u[0] > lim) {
    // (2026-11-20, the sword's motion: never left hanging straight down from the hands like a limp stick after the high
    // cuts. Its x is held to lim; from the low side it does not stop at straight down but goes on round the back, at the
    // screen-angle limit BP_W a frame, to the up side (held up, x at lim) - never forward through him, never resting
    // down; from the high side straight to it. The side the turn started on is remembered while it is held.)
    const k = ks(f), l = clamp(lim, -1, 1), sq = Math.sqrt(Math.max(0, 1 - l * l)), aUp = Math.atan2(-sq, l);
    if (!(k.clrW > 0) || k.clrA == null) k.clrA = Math.atan2((u[1] > 0 ? 1 : -1) * sq, l);
    k.clrW = 2;
    let a = k.clrA;
    // (low but not near straight down - x at lim still 35 deg or more off it: held there, low, as before)
    if (Math.sin(a) > 0 && a < Math.PI / 2 && l >= 0.57) a = a + clamp(Math.atan2(sq, l) - a, -BP_W, BP_W);
    else if (Math.sin(a) > 0 || Math.cos(a) < 0 && Math.sin(a) >= 0) a = Math.min(a + BP_W, aUp + 2 * Math.PI);
    else a = a + clamp(wrapA(aUp - a), -BP_W, BP_W);
    a = wrapA(a);
    // (on the way round the back the x stays under lim by itself; held, the up side's x is lim)
    k.clrA = a;
    const t = flatDrawn(P.haR, fromScr(a, u[2]), BL);
    setBlade(P, w < 0.999 ? blendU(u, t, w) : t);
  }
}
// (the screen angle wrapped to -pi..pi)
function wrapA(d) { return Math.atan2(Math.sin(d), Math.cos(d)); }
// the fight's own contact / aim (js/mocap-duel.js override: rg.ovr, local, by weight): the blocked cut onto the other's
// blade, the landing one onto the body - js/mocap.js build does this for the game's picture; the new one takes it too
// (fix 3: Kage-iai too - the fight's aim swung the drawn blade up and down across her front after the cut, the owner's
// "vertical sweep"; the keyed level cut already runs through him)
const NOAIM = { kzAge: 1, kzTengu: 1, kzIai: 1, kasumi: 1, kage: 1 };
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
  const o = Object.assign({}, P);
  for (const j of JS) if (gP[j] && P[j]) o[j] = lerp(gP[j], P[j], w);
  for (const s of ['R', 'L']) {
    layLeg(o, s, o['ft' + s]);
    const wo = sub(o['wr' + s], o['ha' + s]);
    layArm(o, s, o['ha' + s], sub(o['el' + s], lerp(o['sh' + s], o['ha' + s], 0.5)));
    o['wr' + s] = add(o['ha' + s], wo);
  }
  // (the blade's screen angle the short way round, never through pointing at the camera: moves.js blendU)
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
  return Object.assign({}, gP.saya, { a: add(gP.saya.a, d) });
}
const FLIPX = ['hx', 'hz', 'nx', 'nz', 'prx', 'prz', 'plx', 'plz', 'lx', 'lz', 'frx', 'frz', 'flx', 'flz'];
function flipCh(c) {
  const o = Object.assign({}, c);
  o.py += 180; o.cy += 180; o.by += 180; o.raz += Math.PI; o.pt = -(o.pt || 0);
  if (o.bp != null) { o.bp = Math.PI - o.bp; o.bz = -(o.bz || 0); }
  for (const n of FLIPX) o[n] = -o[n];
  return o;
}
// (fix 5, the owner 2026-11-20 "Önce küçük geri adım") A high or diagonal cut that starts too close: the blade rising
// from the guard to over the head crossed his body or her own face, and the fight's blade stop held it low and forward.
// The attacker takes a small half step back in the wind-up - the hips go back (and sink a little, so the front leg is
// never stretched to its reach), the back foot steps back (the feet planner's own step: lifted and set down) - which
// opens room for the blade to rise; the hips drive forward again into the strike and are on the move's own pose at its
// first strike frame, and the back foot steps up after it. The cut's timing, its hit window and the drawn strike are the
// move's own. How far: as far as the blade's turn up needs (sbNeed), at most SB_MAX - looked at again while the step is
// being taken (he may still be coming in), never shrinking.
// (fix 6, 2026-11-20) The gap kept open: the fight closes it in the wind-up (the attacker's own lunge still sliding on -
// js/fighter.js 'atk' friction 9 a second -, the other walking in, the keep-apart push): seed 1's close overhead went
// 146 -> 105 while the blade rose. A close one (the gap at its start under the blade + HOLD_NEAR) holds the drawn body
// where it stood: the whole drawn body (hips, hands, blade, both feet) is kept back by however much the fight has closed
// since the cut began (both feet stay planted on the floor: nothing slides), up to HOLD_MAX; the drive gives it back.
// The step back is on top of it, now as large as the blade's rise needs (SB_MAX, about half a body). Both go to nothing
// over the last 30 % of the wind-up - the drive into the cut, the feet stepping in with it - so the move's own pose, the
// fight's position and its hit are the same at the first strike frame. Only the picture: the fight's x, its timing and
// its hits are its own.
const SB = { overhead: 1, kesaS: 1, gyakuS: 1, menS: 1 };
const SB_MAX = 30, SB_SINK = 0.3, SB_GROW = 4, HOLD_NEAR = 70, HOLD_MAX = 60, HOLD_V = 7;
// (the screen angle past straight down toward the back, or level behind the hand: as moves.js govStep's lowBack)
const lowBackA = (q) => { const w = wrapA(q); return w > Math.PI / 2 + 0.1 || w < -Math.PI + 0.35; };
const s5 = (u) => { const v = clamp(u, 0, 1); return v * v * v * (v * (v * 6 - 15) + 10); };
function sbProf(M, t) {
  const W = M.phases.active[0], tb = Math.min(0.25 * W, 100), td = 0.7 * W;
  const H = t <= 0 ? 0 : t < tb ? s5(t / tb) : t < td ? 1 : t < W ? 1 - s5((t - td) / (W - td)) : 0;
  // (the hold: whole until the drive, then given back on the same curve)
  const Dr = t < td ? 1 : t < W ? 1 - s5((t - td) / (W - td)) : 0;
  return { H, Dr, L: t >= 0.03 * W && t < 0.9 * W, grow: t < td, pre: t < td };
}
// How far back the rise needs: the blade as drawn now (the last-word governor's angle, the last drawn sword hand) turning
// up from where it is to straight up, round the hand on the screen - does it pass through the other's head (15) or along
// his body (17 round the spine, past 24 of the blade), as the governor's own rule? The least shift back, in steps of 2,
// that clears the whole turn; none when the blade is already up or back (nothing to rise through) or nothing is in the
// way; SB_MAX when even that does not clear it (as much as a small step gives).
// (fix 6: off - the last drawn hand put back where the move has it, with this frame's hold: the shift drawn last frame
// added back, the hold taken off)
function sbNeed(f, k, rg, BL, off = 0) {
  const P = k.prevP, g = k.g2, o = f.opp, ro = o && MD.rigOf(o), Q = ro && ro.P;
  if (!P || !P.haR || !g || g.a == null || !Q || !Q.head || !Q.neck || !Q.hip || o.dead || o.hidden) return { s: 0, a0: null };
  const a0 = wrapA(g.a);
  // (up already, or held back over the shoulder: nothing to rise through)
  if (!(a0 > -1.25 && a0 < 2.9)) return { s: 0, a0 };
  // (from low behind - a follow-through ending down and back - the way up in front starts from forward-down)
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
  // (a new cut - another one, or the same cut started again)
  const fresh = !k.sb || k.sb.atk !== f.atk || k.sb.id !== want.id || f.st < k.sb.st - 1e-6;
  if (fresh) { const F0 = frontOf(f, rg); k.sb = { atk: f.atk, id: want.id, s: 0, st: f.st, g0: F0 ? F0.d : null, near: !!F0 && F0.d < BL + HOLD_NEAR, hold: 0, Xp: 0, lb: !!(k.g2 && k.g2.a != null && (lowBackA(k.g2.a) || wrapA(k.g2.a) > Math.PI / 2 - 0.2)) }; }
  const sb = k.sb, pr = sbProf(M, want.t);
  sb.st = f.st;
  // (fix 6) the gap held: how much the fight has closed it since the cut began (frozen from the drive on)
  if (sb.near && pr.pre && !K.holdOff) { const F = frontOf(f, rg); if (F) sb.hold = clamp(sb.g0 - F.d, sb.hold, Math.min(HOLD_MAX, sb.hold + HOLD_V)); }
  const hold = sb.hold * pr.Dr;
  if (pr.grow) {
    const nd = sbNeed(f, k, rg, BL, sb.Xp - hold);
    // (a blade starting low behind - a follow-through ending down and back - rises round the back, never through the
    // front: a step back opens nothing for it, so none)
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
// (2026-11-21, the owner: "kılıç saldırıları hala çok kötü önce onları düzelt") Spacing: a cut lands at blade range, not
// pressed body to body. The new cuts drive the hips forward through the contact and the follow-through (moves.js); when
// the fight has the two close, the drawn pair is kept at least the attacker's blade + 36 apart, hip to hip, counting both
// drawn drives: the one cut (or hurt, or blocking) gives way - most of it, 0.7 - and the attacker draws back the rest, so
// the hit knocks him back instead of the two freezing glued together. The whole drawn body moves (hips, hands, blade); the
// feet's places with it, so planFeet steps them (nothing slides). Eased in and out at SP_V a frame. Only the picture: the
// fight's x, its timing and its hits are its own.
const SPA = new Set(['overhead', 'horizontal', 'diagonal', 'thrust', 'kesaS', 'gyakuS', 'menS', 'yokoL', 'tsukiS', 'nuki', 'kiriR', 'kiriL', 'sune',
  'tsubame', 'renga', 'oroshi', 'sandan', 'kasumi', 'kuruma', 'kzIai']);
const SPR = new Set(['hurt', 'stagger', 'block', 'guard', 'recoil', 'parry']);
// (2026-11-21, coordinator review of the seed 9 fight: after a counter hit the two stood glued for a second - the attacker
// in her next move's wind-up, the struck one in hitstun, its blade held straight up by the governor because every lower
// angle ran into her body) After any hit or block the pair is held at blade range for as long as one of them is struck,
// blocking, rocked back, down or rising - whatever the other is doing (a wind-up, a recovery, a walk): REACT. The one
// in it gives way 0.7, the other 0.3; one that cannot move (down, rising: its own feet) gives none and the other all.
// (the parry and its recoil keep the fight's own distance: held apart there too, the blades and bodies measured worse -
// 2026-11-21, six variants over the four seeds)
const REACT = new Set(['hurt', 'stagger', 'block', 'down', 'getup']);
const SP_PAD = 36, SP_MAX = 80, SP_V = 6, SP_VH = 7;
// (from the cut on: the drive's start, 40 ms before the first strike window - the wind-up is the round-6 step back's)
const inCut = (id, t) => { const ph = MOVES[id] && MOVES[id].phases; return !!ph && t >= ((ph.hits && ph.hits[0]) || ph.active)[0] - 40; };
function spacing(f, k, rg, want, ch, BL) {
  const o = f.opp, ro = o && MD.rigOf(o), ko = o && ks(o), M = MOVES[want.id];
  k.hxRaw = ch.hx;
  let tgt = 0;
  if (o && ro && !o.dead && !o.hidden && !rg.y && !ro.y && !M.ownFeet && !K.spOff) {
    const meAtk = f.state === 'atk' && SPA.has(want.id) && inCut(want.id, want.t), heAtk = o.state === 'atk' && ko && ko.cur && SPA.has(ko.cur.id) && inCut(ko.cur.id, ko.cur.t);
    const meOk = meAtk || SPR.has(f.state), heOk = heAtk || SPR.has(o.state);
    const cut = (meAtk || heAtk) && meOk && heOk, meR = REACT.has(f.state), heR = REACT.has(o.state);
    if (cut || meR || heR) {
      const oBL = (o.wpn && o.wpn.blade) || LEN.blade;
      // (held after a hit: the longer of the two blades - the struck one's point, lowered, must clear the other too)
      const BLa = cut ? (meAtk ? BL : oBL) : Math.max(BL, oBL), D = (ro.x - rg.x) * rg.dir;
      const need = clamp(SP_PAD + BLa - (D - (ch.hx || 0) - ((ko && ko.hxRaw) || 0)), 0, SP_MAX);
      // (the other gives his share only when he is drawn new, on the floor and on the fight's feet)
      const oM = ko && ko.cur && ko.w >= 0.5 && MOVES[ko.cur.id], oCan = !!oM && !oM.ownFeet;
      const share = !oCan ? 1 : cut ? (meAtk && heAtk ? 0.5 : meAtk ? (SPR.has(o.state) ? 0.3 : 0.5) : (SPR.has(f.state) ? 0.7 : 0.5)) : meR && heR ? 0.5 : meR ? 0.7 : 0.3;
      tgt = need * share;
      k.spT = +need.toFixed(0);
    } else k.spT = 0;
  }
  const v = (SPR.has(f.state) && tgt > (k.sp || 0) ? SP_VH : SP_V) * Math.min(3, 60 * (K.dt || 1 / 60));
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
  // (2026-11-20, fix 2: a fighter's very first frame in the match - nothing drawn new before, no game frame to come from
  // that the eye has seen move - starts fully new: faded in from the game's opening pose, the blade passed through
  // hanging straight down for the first 0.15 s)
  if (want && !k.calls) k.w = 1;
  k.calls = (k.calls || 0) + 1;
  k.w = clamp(k.w + ((want ? 1 : -1) * dt) / FADE, 0, 1);
  if (!want && (k.w <= 0 || !k.cur)) { k.cur = null; k.feet = null; k.prevP = null; k.w = 0; k.so = null; k.px = null; k.dirW = null; k.fol = null; return null; }
  // (phase 4: the facing flipped - mawari's turn, a special's end, the fight turning him round: the last drawn channels
  // are turned 180 into the new facing - in the picture the same pose - and eased from there)
  if (k.dirW != null && rg.dir !== k.dirW && k.lastCh) { k.lastCh = flipCh(k.lastCh); k.bl = { from: k.lastCh, t: 0 }; k.prevP = null; if (k.fol) flipFollow(k.fol); }
  k.dirW = rg.dir;
  let ch;
  if (want) {
    const c = chAt(want.id, want.t, (f.wpn && f.wpn.blade) || LEN.blade);
    if (k.cur && k.cur.id !== want.id && k.lastCh) { k.bl = { from: k.lastCh, t: 0 }; K.moves++; }
    if (k.bl) { k.bl.t += dt; const u = clamp(k.bl.t / CHX, 0, 1); ch = u >= 1 ? c : blendCh(k.bl.from, c, smooth(u)); if (u >= 1) k.bl = null; } else ch = c;
    // (2026-11-20, the sword's motion: the blade's screen angle is never cross-faded - it swings from where it is drawn onto
    // the new move's own, at most moves.js BP_W a frame, braking, outside a strike window; moves.js followCh)
    if (ch !== c) ch.bp = c.bp;
    if (!k.fol) { k.fol = {}; if (k.lastCh && k.lastCh.bp != null) { k.fol.e = k.lastCh.bp - (k.lastCh.pt || 0) * Math.PI / 180; k.fol.lock = true; } }
    if (ch === c) ch = Object.assign({}, c);
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
  // (the fight's height: on the floor here, kept for a frame the fight lifts it; in the air for a fall - the blade, the
  // saya and the cloth's anchors go up with the body)
  if (rg.y) {
    for (const j of JS) P[j] = [P[j][0], P[j][1] + rg.y, P[j][2]];
    if (P.blade && P.blade.h) P.blade = Object.assign({}, P.blade, { h: [P.blade.h[0], P.blade.h[1] + rg.y, P.blade.h[2]] });
    if (P.saya && P.saya.a) P.saya = Object.assign({}, P.saya, { a: [P.saya.a[0], P.saya.a[1] + rg.y, P.saya.a[2]] });
  }
  k.mw = clamp((k.mw || 0) + ((want ? MEET[want.id] : MEET[k.cur.id]) ? 1 : -1) * dt / 0.1, 0, 1);
  meet(f, rg, P, BL, smooth(k.mw)); dbgA(k, 'm', P);
  // (phase 7: the new strings' cuts are keyed onto him - the fight's aim, built from the game's own poses, would pull the
  // hand there over the whole windup: the draw-cut's hand rose overhead through the pause; a blocked one keeps the contact)
  // (2026-11-21: nor in the wind-up of kesa / gyaku-kesa - the aim dragged the fists from over the crown down to the
  // shoulder while the blade was already back over it, so it lay across her own chest; from the drive on it aims. The
  // other cuts keep it: their wind-ups measured worse without)
  // (and the men's: from a parry, the aim held the blade out where the parry left it, so the fight's stop pushed it down and
  // the raise then swung it straight back up - a reversal; seed 2, frame 1785)
  const wind = f.state === 'atk' && (k.cur.id === 'kesaS' || k.cur.id === 'gyakuS' || (k.cur.id === 'menS' && !K.menAim)) && !inCut(k.cur.id, k.cur.t);
  if (!wind && !(NOAIM[k.cur.id] && !(f.opp && (f.opp.state === 'block' || f.opp.state === 'guard')))) aimOn(rg, P);
  dbgA(k, 'a', P);
  k.clrW = Math.max(0, (k.clrW || 0) - 1);
  if (f.state === 'atk' && f.atk && f.atk.active) { const w2 = clamp((f.st - f.atk.active[1]) / 0.03, 0, 1); if (w2 > 0) clear(f, rg, P, BL, smooth(w2)); dbgA(k, 'c', P); }
  if (P.gripL >= 0.999) onHandle(P, grip);
  k.prevP = P;
  const out = mix(gP, P, smooth(k.w), grip); dbgA(k, 'x', out);
  // (the mark the Pop hook reads: only on a frame drawn mostly new - under that, the game's own picture jumping is smoothed
  // as in the game)
  if (k.w >= 0.5) out.kilic = [1, 0, 0]; else delete out.kilic;
  out.kilicW = k.w;
  // (fix 2: the picture as the new drawing left it, before the fight's own blade stop - js/mocap-duel.js bladeStop, run
  // between this build and the drawing - turns it: Mo.draw below puts our blade back outside a strike window)
  k.pre = { o: out, blade: out.blade, elR: out.elR, haR: out.haR, wrR: out.wrR };
  K.frames++;
  return out;
}
// (tools: the blade's local screen angle after each step of the drawing, for a frame the sword checker flags - K.swordSample d)
function dbgA(k, s, P) { if (k && P && P.blade && P.blade.u) k.dbg += s + Math.atan2(P.blade.u[1], P.blade.u[0]).toFixed(2) + ' '; }
const build1 = Mo.Rig.prototype.build;
// (js/mocap.js build fills the LAST pose object again (this.P || {}): after a frame drawn new, that is ours - its marks
// and own fields stayed on the game's picture (the Pop hook then took every later frame of the game's own moves for a new
// one and left their jumps unsmoothed). The game's build gets a clean copy.)
const OWNF = ['kilic', 'kilicW', 'kneeUp', 'fP', 'draw', 'reachR', 'reachL', 'gripErr', 'legReachR', 'legReachL'];
Mo.Rig.prototype.build = function (F, dt) {
  if (this.P && (this.P.kilic || this.P.kilicW != null)) { const q = Object.assign({}, this.P); for (const n of OWNF) delete q[n]; this.P = q; }
  const gP = build1.call(this, F, dt), f = this.look;
  if (!K.on || !this.driven || !f || !f.dz) return gP;
  try { return ours(f, this, gP, dt || 0) || gP; } catch (e) { K.errors++; if (K.errors < 4) console.error('kilic', e); return gP; }
};

// ------------------------------------------------------------------ 4. after the pair is settled
// The last word before drawing (owner, phase 2's leftover: blades still across a face a few frames in 30 s): a blade drawn
// new never lies in the other's head - the point and the whole blade 15 off its centre in the picture, a landing cut too
// (it lands ON the head, not through it) -, nor along the other's body outside its own hit window (17 off the spine), nor
// across its own face: turned round the sword hand in the picture's plane by the least angle that clears it. The turn
// has a memory (no pop): it starts from last frame's turn, let go by 0.06 rad a frame only while the blade stays clear,
// and grows from there on the same side by the least step that clears (at most 0.25 rad a frame) - never flipping sides,
// never snapping back.
const rotZ = (u, a) => { const c = Math.cos(a), sn = Math.sin(a); return norm([u[0] * c - u[1] * sn, u[0] * sn + u[1] * c, u[2]]); };
function segD2(p, a, b) { const abx = b.x - a.x, aby = b.y - a.y, t = clamp(((p.x - a.x) * abx + (p.y - a.y) * aby) / Math.max(1e-9, abx * abx + aby * aby), 0, 1); return Math.hypot(p.x - a.x - abx * t, p.y - a.y - aby * t); }
// (5b) the fighter's own blade THROUGH its own body as drawn, outside a cut: the blade (from 14 past the hand - the hands
// hold it in front of the body) crossing the torso's middle line (hip to neck) or a thigh (hip to knee) in the picture,
// over a part it is drawn IN FRONT of (Mo.bladeFront: a blade behind the body is drawn under it and reads as behind).
// A blade held in front of the body, raised over a body on the floor or pointing away never crosses those lines; one laid
// across the chest or the hips does. The crossing at Akane's saya (the blade going home along it, noto) is left out.
// 1 = through, -1 = clear. tools/kilic-fight.mjs ownBody measures the same.
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
  // (the other far away: only the fighter's own head and body count)
  const near = Math.abs(hd.x - Mo.project(rg, h).x) <= BL * 1.6 + 40;
  const cut = f.state === 'atk' && f.atk && f.atk.active && f.st >= f.atk.active[0] - 0.02 && f.st <= f.atk.active[1] + 0.02;
  // (5b: outside a cut the blade never lies across its own torso, hips or thighs as drawn - ownPen below)
  const self = !cut && !K.ownOff;
  // (fix 2: where the fight's own blade stop had to turn this blade - unStop put it back - the stop's zones are kept
  // here instead: the other's head 20, throat 14, torso 25 round the spine, thighs 9, shins 7, the floor; for a few
  // frames after, so the zones never flicker)
  const stopZ = near && kd.stopMem > 0;
  const LGZ = stopZ ? [['hipR', 'knR', 9], ['hipL', 'knL', 9], ['knR', 'ftR', 7], ['knL', 'ftL', 7]].filter(([a, b]) => Q[a] && Q[b]).map(([a, b, r]) => [Mo.project(ro, Q[a]), Mo.project(ro, Q[b]), r]) : null;
  // (and a blade held off a body is never turned into hanging straight down from the hands - the limp stick the owner
  // saw: within 0.55 rad of straight down, unless it was there already)
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
    // (from last frame's turn, the least step that clears: its own side first; a fresh guard takes either side)
    const s0 = Math.sign(g0) || 1;
    let got = null, least = null, lv = Infinity;
    for (let i = 1; i <= 36 && got == null; i++) for (const sg of g0 ? [s0, -s0] : [1, -1]) {
      const c = (g0 ? Math.abs(g0) * s0 : 0) + sg * i * 0.04;
      if (Math.abs(c) > 1.45) continue;
      const v = bad(rotZ(u0, c));
      if (v <= 0) { got = c; break; }
      // (nothing clears: the least deep, never into the down band)
      if (stopZ && v < lv) { lv = v; least = c; }
    }
    if (got == null) a = least != null && lv < bad(rotZ(u0, g0)) ? least : g0; else a = got;
    // (it grows at most 0.15 rad a frame - with the ease's own turn it stays under a visible jump: a blade swung fast at a
    // face may graze it for a frame, it never jumps)
    a = clamp(a, g0 - 0.15, g0 + 0.15);
  }
  kd.ga = a; kd.gaD = a - g0;
  if (a) { setBlade(P, rotZ(u0, a)); K.guarded = (K.guarded || 0) + 1; }
}
// (fix 2, 2026-11-20) The fight's own blade stop (js/mocap-duel.js bladeStop: the game's code, untouched) turns an
// attacker's blade off the other's head and body by the least turn round the hand - often straight down, where it then
// hung from the hands for a dozen frames (the limp stick), or a full turn in one frame. On a frame drawn new, outside a
// strike window, its turn is put back (the hand it drew back is kept): faceGuard turns the blade off the same zones
// instead, never into the down band, with its memory, and govern() eases what is left.
function unStop(f, k, P) {
  const q = k.pre;
  k.stopMem = Math.max(0, (k.stopMem || 0) - 1);
  if (!q || q.o !== P || !P.blade || !q.blade || P.blade === q.blade || !P.armed || P.inside) return;
  if (strikeS(f, k, P)) return;
  setBlade(P, q.blade.u);
  k.stopMem = 8; K.unstop = (K.unstop || 0) + 1;
}
// (the strike window as the sword measure sees it - K.swordSample s: the fight's hit window +-0.02 s of the cut's clock,
// or the drawn new move's own phases.active / hits / beat +-35 ms)
function strikeS(f, k, P) {
  if (f.state === 'atk' && f.atk) { const W = f.atk.hits || (f.atk.active ? [f.atk.active] : []); if (W.some((w) => f.st >= w[0] - 0.02 && f.st <= w[1] + 0.02)) return true; }
  return !!(P && P.kilic && P.kilicW >= 0.999 && k && k.cur && MOVES[k.cur.id] && strikeAt(MOVES[k.cur.id], k.cur.t));
}
// (fix 2) The last word on the blade's turn, on EVERY frame of Akane and Kuro while this is on - the new picture and the
// game's own (its old cuts, the air, the grab, the stop, the eases and guards added up): outside a strike window the
// drawn screen angle turns at most GOV_W a frame from the last drawn one. Where what the drawing made is further than
// that, the angle within that reach is taken that is nearest to it and clear - not in the other's head or along his
// body, not across its own face, and (less weight) not across its own body: the guards' clearance is kept wherever it
// can be within the reach. Turned round the sword hand, the back hand kept on the handle. In a strike it is what the
// drawing made.
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
  // (its own body: behind() may still take the blade behind it, so it weighs less)
  const ow = !cut && !K.ownOff && ownPen(P, h, u, BL, f) > 0 ? 1 : 0;
  return m > 0 ? 2 + m : ow;
}
// (and the limp stick the owner saw - the blade hanging straight down from the hands, held: outside a strike it is kept
// out of DOWN_W round straight down unless the new move itself draws it there (its own pose, or its declared sheath pose);
// a blade that ends a cut down there leaves it at the reach's speed. The game's own stop, its old cuts and the guards no
// longer leave it hanging.)
const DOWN_W = 0.55, DOWN_V = 0.15;
function govern(f, k, rg, P) {
  if (!P || !P.blade || !P.blade.u || !P.armed || P.inside || f.dead || f.hidden) { k.gv = null; return; }
  const u = P.blade.u, a = Math.atan2(u[1], u[0]);
  let g = k.gv;
  k.gvD = 0;
  // (a facing flip starts it afresh on what is drawn: the turning moves draw the same picture across it, the game's own
  // mirror is a whole-body flip anyway - carried over mirrored, it held a turned blade across its own body for 9 frames)
  if (!g || strikeS(f, k, P) || g.dir !== rg.dir) { k.gv = { a, dir: rg.dir }; return; }
  const d = wrapA(a - g.a);
  const nw = P.kilic && k.cur && MOVES[k.cur.id];
  const own = nw && k.pre && k.pre.o === P && k.pre.blade && k.pre.blade.u ? Math.atan2(k.pre.blade.u[1], k.pre.blade.u[0]) : null;
  const okDown = nw && ((MOVES[k.cur.id].rest || []).some(([t0, t1]) => k.cur.t >= t0 && k.cur.t <= t1) || (own != null && Math.abs(wrapA(own - Math.PI / 2)) < DOWN_W));
  // (held in the band is the fault, not passing through it: where what the drawing made lies outside the band, the blade
  // may cross the band at speed - at least DOWN_V a frame and never turning back inside it; where it lies inside, the blade
  // waits at the band's edge)
  const inB = (c) => Math.abs(wrapA(c - Math.PI / 2)) < DOWN_W, tIn = !okDown && inB(a), v0 = g.v || 0;
  const dpen = (c) => {
    if (okDown || !inB(c)) return 0;
    const st = wrapA(c - g.a);
    if (!tIn && Math.abs(st) >= DOWN_V && !(inB(g.a) && Math.abs(v0) >= DOWN_V && Math.sign(st) !== Math.sign(v0))) return 0;
    return 1 + 20 * (DOWN_W - Math.abs(wrapA(c - Math.PI / 2)));
  };
  if (Math.abs(d) <= GOV_W && !dpen(a)) { g.v = d; g.a = a; return; }
  // (the reach sampled from the side toward the target: the nearest clear angle wins, a clash the least deep; out of the
  // down band before nearness)
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
// (fix 3, 2026-11-20) The last word, one memory (moves.js govStep): on every frame of Akane and Kuro while this is on, the
// angle the fight's projector draws (the one the sword measure reads) turns at most GOV_W a frame outside a strike window,
// never waits by straight down (only a move's declared sheath pose may), takes the way round whose path is clear of the
// other's head and body, its own face and the floor (its own body weighing less), and is remembered as finally drawn -
// the fist ease, the face guard and the old governor no longer turn the blade on memories of their own.
function badAt(f, rg, P, BL, c, noOpp) {
  const o = f.opp, ro = o && MD.rigOf(o), Q = ro && ro.P, h = P.blade.h, u = rotToScr(h, P.blade.u, BL, c);
  const own = P.head ? Mo.project(rg, P.head) : null;
  const cut = f.state === 'atk' && f.atk && f.atk.active && f.st >= f.atk.active[0] - 0.02 && f.st <= f.atk.active[1] + 0.02;
  const far = !Q || !Q.head || o.dead || o.hidden;
  const hd = far ? null : Mo.project(ro, Q.head), nk = far ? null : Mo.project(ro, Q.neck), hp = far ? null : Mo.project(ro, Q.hip);
  let m = -1e9;
  // (the floor: the point kept 3 over it - the body's own height in the air included in P)
  m = Math.max(m, (h[1] + u[1] * BL + 3) / 2);
  for (let i = 1; i <= 10; i++) {
    const k = 4 + (BL - 4) * i / 10, q = Mo.project(rg, [h[0] + u[0] * k, h[1] + u[1] * k, h[2] + u[2] * k]);
    if (own) m = Math.max(m, 14 - Math.hypot(q.x - own.x, q.y - own.y));
    if (hd) { m = Math.max(m, 15 - Math.hypot(q.x - hd.x, q.y - hd.y)); if (!cut && k > 24) m = Math.max(m, 17 - segD2(q, hp, nk)); }
  }
  if (m > 0) return 1 + m / 10;
  return !cut && !K.ownOff && ownPen(P, h, u, BL, f) > 0 ? 0.3 : 0;
}
// (2026-11-21) the blade at screen angle c in the other's head (15) or along his body (17 round the spine, past 24 of the
// blade), outside its cut - badAt's rule for the other alone
function inOppAt(f, rg, P, BL, c) {
  const o = f.opp, ro = o && MD.rigOf(o), Q = ro && ro.P;
  if (!Q || !Q.head || !Q.neck || !Q.hip || o.dead || o.hidden) return false;
  if (f.state === 'atk' && f.atk && f.atk.active && f.st >= f.atk.active[0] - 0.02 && f.st <= f.atk.active[1] + 0.02) return false;
  const h = P.blade.h, u = rotToScr(h, P.blade.u, BL, c), hd = Mo.project(ro, Q.head), nk = Mo.project(ro, Q.neck), hp = Mo.project(ro, Q.hip);
  for (let i = 1; i <= 10; i++) {
    const k = 4 + (BL - 4) * i / 10, q = Mo.project(rg, [h[0] + u[0] * k, h[1] + u[1] * k, h[2] + u[2] * k]);
    if (Math.hypot(q.x - hd.x, q.y - hd.y) < 15 || (k > 24 && segD2(q, hp, nk) < 17)) return true;
  }
  return false;
}
function govern2(f, k, rg, P) {
  if (!P || !P.blade || !P.blade.u || !P.blade.h || !P.armed || P.inside || f.dead || f.hidden) { k.g2 = null; return; }
  const BL = (f.wpn && f.wpn.blade) || LEN.blade, h = P.blade.h, a = scrP(h, P.blade.u, BL);
  let g = k.g2;
  // (a facing flip: the same picture seen mirrored - the memory turned with it, so the drawn blade stays where it was)
  // (the swing's legs with it: the picture turns on the same way - the sword measure reads the picture, not the facing)
  if (g && g.dir0 !== rg.dir) { if (g.a != null) g.a = Math.PI - g.a; g.dir = -(g.dir || 0); g.v = -(g.v || 0); if (g.lastP != null) g.lastP = Math.PI - g.lastP; if (g.lt != null) g.lt = Math.PI - g.lt; g.legS = -(g.legS || 0); g.buL = 0; }
  if (!g) g = k.g2 = {};
  g.dir0 = rg.dir;
  const rest = !!(P.kilic && P.kilicW >= 0.999 && k.cur && MOVES[k.cur.id] && (MOVES[k.cur.id].rest || []).some(([t0, t1]) => k.cur.t >= t0 && k.cur.t <= t1));
  const dPass = !!(P.kilic && P.kilicW >= 0.999 && k.cur && MOVES[k.cur.id] && (MOVES[k.cur.id].downPass || []).some(([t0, t1]) => k.cur.t >= t0 && k.cur.t <= t1));
  // (2026-11-21) the move's own drawing before the fight's blade stop turned it - govStep's o.raw
  const raw = P.kilic && P.kilicW >= 0.999 && k.pre && k.pre.o === P && k.pre.blade && k.pre.blade.u ? scrP(h, k.pre.blade.u, BL) : null;
  // (fix 3: a move's own one-frame jump - the blade out of the saya already turned forward, M.jump - is drawn as keyed on
  // the first frame after it: the governor had swung it round from the saya's line, back across her body)
  const J = P.kilic && P.kilicW >= 0.999 && k.cur && MOVES[k.cur.id] && MOVES[k.cur.id].jump;
  const jumpNow = !!(J && J.some(([t0, t1]) => k.cur.t >= t0 && k.cur.t <= t1 + 18));
  // (fix 6) the wind-up of a high or diagonal cut that starts with the blade low behind (the last cut's follow-through
  // ended down and back): it rises on round the back to over the shoulder or the head - its top - never back down
  // through the front and up past him (the low-forward blade of a close kesa). Only a blade that was low behind at the
  // cut's first frame (k.sb.lb: at straight down or past it): one that starts in front rises in front, never down round
  // the back.
  const backUp = !K.backOff && !!(P.kilic && P.kilicW >= 0.999 && k.cur && SB[k.cur.id] && k.sb && k.sb.lb && k.sb.id === k.cur.id && f.state === 'atk' && k.cur.t < MOVES[k.cur.id].phases.active[0]);
  // (on that way round the blade passes its own body - behind() then draws it behind the torso: not a block there)
  const c = govStep(g, a, { strike: strikeS(f, k, P) || jumpNow, okDown: rest, downPass: dPass, backUp, raw: K.rawOff ? null : raw, inOpp: K.oppOff ? null : (q) => inOppAt(f, rg, P, BL, q), bad: (q) => { const b = badAt(f, rg, P, BL, q); return backUp && b < 0.5 ? 0 : b; },
    // (fix 3: the other fighter's head and body are crossed, never parked in: a raise to the overhead goes up past a close
    // opponent instead of waiting below him, the blade low through the whole windup)
    pass: (q) => badAt(f, rg, P, BL, q, true) === 0 });
  k.gvD = wrapA(c - a);
  if (Math.abs(k.gvD) > 1e-4) { setBlade(P, rotToScr(h, P.blade.u, BL, c)); if (P.gripL >= 0.999) onHandle(P, gripOf(f.wpn)); K.gov = (K.gov || 0) + 1; }
}
// (after the last turns - flat, behind, the back hand: the memory is what is finally drawn)
function govMem(f, k, rg, P) { const g = k.g2; if (!g || !P || !P.blade || !P.blade.h || !P.armed || P.inside) return; g.a = scrP(P.blade.h, P.blade.u, (f.wpn && f.wpn.blade) || LEN.blade); }
// (5b) A blade that would still cross its own body outside a cut - a windup swinging back past the chest or the hips
// (kiri-age, the backhand cuts, the turns), where no turn round the hand clears it - goes BEHIND the body, as 2D
// animation draws a sword passing on the far side: its point is moved in depth to behind the torso and the legs along the
// same line of sight, so the drawn blade stays on the same line in the picture (only its drawn length changes a little) and
// js/mocap.js layers it under the body. Held while the blade still overlaps the torso (18 round the spine) or a thigh,
// so the layer never flips while it is over the body; let go once it is clear of both.
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
  // (along the same line of sight: the point moved in depth until it is behind the torso and both legs; K.behNew - tried in
  // fix 2, not kept: the depth alone changed, the screen angle kept - it left more blade across the other's body)
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
// The face is never hidden by its own arms (owner's rule; the guard, block and recoil meet the other's blade, the
// hitstop holds a windup): on a frame drawn new, the face (the front half of the head, a disc of 9 - tools/kilic-check.mjs
// faceCover) more than 30% under an arm nearer the camera, both fists move down / forward by the least offset that clears
// it. The offset has a memory (no pop): it grows by at most 6 a frame, shrinks by 4 and lets go only while the face stays clear.
const FG = []; for (let x = -9; x <= 9; x += 2) for (let y = -9; y <= 9; y += 2) if (x * x + y * y <= 81) FG.push([x, y]);
// (5b: with the head drawn over the arms - drawPic below - only the fists count: they are kept off the face so that they
// do not hide behind the head; K.oldClear: the arms too, as before)
function coverOf(P) {
  if (!P.head || !P.shR || !P.elR || !P.haR) return 0;
  const c = [P.head[0] + 4 * (P.hf ? Math.sign(P.hf[0]) || 1 : 1), P.head[1] + 1], hz = P.head[2], sg = [], arms = !!(K.oldClear || K.headOff);
  for (const s of ['R', 'L']) { const sh = P['sh' + s], el = P['el' + s], ha = P['ha' + s]; if (!sh || !el || !ha) continue; if (arms && (sh[2] + el[2]) / 2 > hz + 2) sg.push([sh, el, 8]); if (arms && (el[2] + ha[2]) / 2 > hz + 2) sg.push([el, ha, 6.5]); if (!arms || ha[2] > hz + 2) sg.push([ha, ha, 5.5]); }
  if (!sg.length) return 0;
  const d2 = (q, a, e) => { const abx = e[0] - a[0], aby = e[1] - a[1], t = clamp(((q[0] - a[0]) * abx + (q[1] - a[1]) * aby) / Math.max(1e-9, abx * abx + aby * aby), 0, 1); return Math.hypot(q[0] - a[0] - abx * t, q[1] - a[1] - aby * t); };
  let n = 0; for (const [x, y] of FG) { const q = [c[0] + x, c[1] + y]; if (sg.some(([a, e, r]) => d2(q, a, e) < r)) n++; }
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
      // (the least offset that clears, from where it was last frame; reached at 3 a frame)
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
K.dbg = (f) => { const k = KS.get(f); if (!k) return null; const r = { ga: +(k.ga || 0).toFixed(2), gaD: +(k.gaD || 0).toFixed(2), sc: k.sc || 0, sr: k.sr, nd: k.nd || 0, dd: +(k.dd || 0).toFixed(2), tail: k.tail || 0, cur: k.cur ? k.cur.id : null, t: k.cur ? +k.cur.t.toFixed(0) : null, w: +(k.w || 0).toFixed(2), beh: !!k.beh, mw: +(k.mw || 0).toFixed(2), gv: +(k.gvD || 0).toFixed(2), stp: k.stopMem || 0, sp: +(k.sp || 0).toFixed(1), sb: k.sb ? +(k.sb.Xp || 0).toFixed(1) : 0, spT: k.spT || 0 }; return r; };
// (tools/kilic-fight.mjs, kilic-combo.mjs: the sword as DRAWN this frame, one sample for tools/kilic-sword-lib.mjs: its
// drawn length share r, its screen angle a (the picture's own: x right, y down), s in a strike window (the fight's hit
// window +-0.02 s of the cut's clock, or the drawn new move's phases.active / hits / beat +-35 ms), x nothing to measure
// (the blade not out), tag what drew it)
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
// 5b. The head over the arms (the owner, 2026-11-20, from faz4b-dovus.mp4: the face hidden behind the near arm in high
// blocks and windups). In profile the camera-side arm is always nearer than the head, so js/mocap.js drew it over the
// face; re-keying the poses only moved the arm around. As 2D animation does, the head (with its hair, hat, band and the
// costume's head layer) is drawn AFTER the rest of the body, the arms, fists, hilt and blade included: wherever an arm
// passes the head, the face stays on top. It is held back on every frame of Akane and Kuro while this is on, never
// decided frame by frame - where nothing passes the head the order changes nothing, so the layer order never flickers.
// (the fists are kept off the face by faceClear; the blade by faceGuard's own-head clearance - neither hides behind it)
const DR = ND._draw, head0 = DR.drawHead, cl0 = ND.costumeLayer;
let HELD = null;
DR.drawHead = function () { if (HELD) { HELD.push([head0, this, [...arguments]]); return; } return head0.apply(this, arguments); };
if (cl0) ND.costumeLayer = function (id, layer) { if (HELD && layer === 'head') { HELD.push([cl0, this, [...arguments]]); return; } return cl0.apply(this, arguments); };
function drawPic(ctx, rg, opt) {
  const f = rg && rg.look;
  if (!K.on || K.headOff || !f || !f.ch || !WHO[f.ch.id] || !rg.P || !ctx) return draw1.call(Mo, ctx, rg, opt);
  const held = (HELD = []);
  let r;
  try { r = draw1.call(Mo, ctx, rg, opt); } finally { HELD = null; }
  if (held.length) { ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; try { for (const [fn, th, a] of held) fn.apply(th, a); } finally { ctx.restore(); } }
  return r;
}
// (tools/kilic-fight.mjs: the picture of one fighter drawn again as it is, for the face measure - no eases, no memory)
K.drawPic = drawPic;
Mo.draw = function (ctx, rg, opt) {
  const P = rg && rg.P;
  const kd = rg && rg.look && KS.get(rg.look);
  // (eased on the frames drawn new, and on the game's own frames for 0.15 s after them - the switch back has no pop
  // either; on the game's other frames only remembered, so the first frame of a switch to the new one is eased too)
  // (2026-11-20, the sword's motion: every frame of Akane and Kuro while this is on - the new picture and the game's own -
  // draws the blade at least 0.82 of its length, its screen angle kept: moves.js flatDrawn; fix 2: measured with the
  // fight's own projector - its vertical perspective pivots on the floor, so a low blade pointing at the camera was drawn
  // a stub the measure round y -80 called long - and again after the turns below)
  const flat = (rmin = 0.82) => { if (P && P.blade && P.blade.u && P.blade.h && P.armed && !P.inside && rg.look && rg.look.ch && WHO[rg.look.ch.id]) {
    try { const BLf = (rg.look.wpn && rg.look.wpn.blade) || LEN.blade, u0 = P.blade.u; let u1 = flatDrawn(P.blade.h, u0, BLf, rmin, 0);
      // (fix 3: the depth cut keeps the angle the fight's projector draws, not only the local one - the governor's memory)
      if (u1 !== u0 && !K.gov1) u1 = rotToScr(P.blade.h, u1, BLf, scrP(P.blade.h, u0, BLf));
      if (u1 !== P.blade.u) { let e = sub(P.blade.e, mul(u1, dot(P.blade.e, u1))); e = V.len(e) > 1e-4 ? norm(e) : P.blade.e; P.blade = { h: P.blade.h, u: u1, e }; } } catch (e) { K.errors++; }
  } };
  flat();
  if (kd) { if (!(P && P.kilicW > 0)) kd.dbg = 'old '; dbgA(kd, 'f', P); }
  // (fix 3: the legs back on their planted feet and the back hand on the handle BEFORE the last turns - they were laid
  // after them, so the governor and the behind-the-body pass judged a body that then moved)
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
    // (the ease remembers the blade before the guard's turn: the turn is its own, eased on its own memory - the two never
    // add up frame after frame)
    dbgA(kd, 's', P);
    try { if (fresh) faceClear(kd, P, gripOf(rg.look.wpn)); else kd.fo = null; } catch (e) { K.errors++; }
    if (K.gov1) {
      try { if (fresh) faceGuard(rg.look, rg, P, kd); else kd.ga = 0; } catch (e) { K.errors++; }
      try { if (!K.govOff) govern(rg.look, kd, rg, P); else kd.gv = null; } catch (e) { K.errors++; }
    } else { kd.ga = 0; try { govern2(rg.look, kd, rg, P); } catch (e) { K.errors++; if (K.errors < 4) console.error('kilic gov', e); } }
    flat();
    dbgA(kd, 'v', P);
    try { if (fresh) behind(rg.look, rg, P, kd); else kd.beh = false; } catch (e) { K.errors++; }
    // (put behind the body, the blade may come out drawn short: not under 0.72 of its length, even if it shows in front -
    // 0.7 is the measure's limit)
    if (kd.beh) flat(0.72);
    dbgA(kd, 'g', P);
  }
  relay();
  if (kd && P && !K.gov1) govMem(rg.look, kd, rg, P);
  const u0 = P && P.blade && P.blade.u;
  const r = drawPic(ctx, rg, opt);
  if (kd) { kd.nd = (kd.nd || 0) + 1; const u1 = rg.P && rg.P.blade && rg.P.blade.u; kd.dd = u0 && u1 ? Math.acos(clamp(dot(u0, u1), -1, 1)) : 0; }
  return r;
};
// (every move's channels and its blade's screen-angle table made once now, not on a move's first frame in the fight)
try { for (const id of ORDER) { chAt(id, 0); chAt(id, 0, 126); } } catch (e) { K.errors++; }
K.ready = true;
