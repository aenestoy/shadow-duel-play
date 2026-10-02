// Gölge Düellosu — display pose: how the fighter is DRAWN, shaped from the pose the fight uses.
//
// The fight (hit tests, reach, projectiles, AI) reads only f.pose and the joints solved from it (f.j). This file
// makes a second set of joints for drawing only (f._anim.j) and never writes anything the fight reads. It keeps the
// look of every move and changes only how the body travels between the move's key poses:
//   1. cuts swing in arcs: the sword hand travels round the shoulder (distance and angle blended) instead of on the
//      straight line between two keys, which folded the arm in the middle of a swing and flattened the blade's path;
//   2. the blade clears the head: a wind-up whose in-between frames would pass the blade through the head (neither
//      key pose does) lifts the hand just enough to go round it; poses designed with the blade by the head (Ren's
//      shoulder rest, Kage's reverse grip) are left as they are;
//   3. no teleports: a pose that jumps in one step (the parry's first frame, some state changes) is reached with a
//      very quick move instead; a jump made just before a hit-stop plays during the freeze, so the frozen frame is
//      still exactly the one the fight shows;
//   4. the blade streak (Fighter.drawTrail) follows the arc the tip really travelled, not straight chords.
// Everything here is presentation: it runs on the ordinary Math (not ND.DM), is not saved, restored or fingerprinted
// (sim-state.js SKIP: _anim), and a rollback simply carries on from the picture the player saw.
(function (ND) {
  'use strict';
  const pose = ND.pose, KEYS = pose.KEYS, L = ND.LEN;
  const TAU = Math.PI * 2;
  const wrap = (a) => a - TAU * Math.round(a / TAU);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const inOutSine = ND.M.ease.inOutSine;
  const WKEYS = ['wFan', 'wFanB', 'wBow', 'wDraw', 'wArrow', 'wCharge', 'wAmmo', 'wSheath', '_vs', '_px'];
  const RKEYS = ['hip', 'neck', 'sh', 'head', 'elF', 'haF', 'tip', 'pom', 'elB', 'haB', 'knF', 'ftF', 'knB', 'ftB'];
  // clearance radius round the head centre per headgear (the straw kasa and the kabuto are wide)
  const HEAD_R = { kasa: 21, kabuto: 17, oni: 16, hood: 15.5, tora: 15.5 };
  // weapons whose front part is drawn as a blade / shaft from the hand (the fans and the bow are drawn otherwise)
  const NO_CLEAR = { tessen: 1, yumi: 1 };
  const GROUND = -2; // world y of the floor line a blade tip may touch (y grows downward, the floor is 0)
  // ?anim=0 draws the fight's own joints (the look before this file), to compare
  const off = typeof location !== 'undefined' && /[?&]anim=0(&|$)/.test(location.search || '');
  const A = ND.anim = { on: !off };

  function mk(f) {
    return {
      p: pose.copy(f.pose), prevT: pose.copy(f.pose), from: pose.copy(f.pose), pa: {}, pb: {}, lj: {}, lt: {},
      j: {}, cu: 0, cuDur: 0, gw: 1, gp: NaN, gv: 0, gs: 1, gsb: 1, wc: null, wch: null, sy: [0, 0, 0], sv: [0, 0, 0], sx: [0, 0, 0], sinit: false, ws: 0, sl: [0, 0], slv: [0, 0], sla: [NaN, NaN], prevState: f.state, prevSerial: f.serial, ok: false, stamp: -1, chain: null,
    };
  }

  // ------------------------------------------------------------ helpers
  // the current segment of a key list at time t: out.a, out.b (poses), out.e (eased progress); null at the ends
  const SEG = { a: null, b: null, e: 0 };
  function segAt(keys, t) {
    if (!keys || keys.length < 2 || !(t > keys[0][0])) return null;
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const a = keys[i - 1], b = keys[i];
        if (!a[1] || !b[1]) return null;
        const u = (t - a[0]) / Math.max(1e-4, b[0] - a[0]);
        SEG.a = a[1]; SEG.b = b[1]; SEG.e = (b[2] || inOutSine)(u);
        return SEG;
      }
    }
    return null;
  }
  // 1. arc correction for the sword hand: polar blend round the shoulder minus the straight blend (0 at both keys)
  const ARC = { x: 0, y: 0 };
  function arcFix(a, b, e, cap) {
    ARC.x = 0; ARC.y = 0;
    const ra = Math.hypot(a.ax, a.ay), rb = Math.hypot(b.ax, b.ay);
    if (ra < 14 || rb < 14) return ARC;
    // (the hand never swings round behind the head: angles are taken in (-π, π] from "forward", and the plain
    // difference goes the way that does not cross "straight back"; only an all-but-full turn keeps the straight path)
    const ta = Math.atan2(a.ay, a.ax), d = Math.atan2(b.ay, b.ax) - ta, ad = Math.abs(d);
    if (ad < 0.25 || ad > 3.1) return ARC;
    const w = ad > 2.9 ? (3.1 - ad) / 0.2 : 1;
    const r = ra + (rb - ra) * e, th = ta + d * e;
    const px = Math.cos(th) * r, py = Math.sin(th) * r;
    const lx = a.ax + (b.ax - a.ax) * e, ly = a.ay + (b.ay - a.ay) * e;
    let dx = (px - lx) * w, dy = (py - ly) * w;
    const m = Math.hypot(dx, dy);
    if (m > cap) { dx *= cap / m; dy *= cap / m; }
    ARC.x = dx; ARC.y = dy;
    return ARC;
  }
  // 2. how deep the weapon's front part (and a long shaft's rear) cuts into the head circle, local pose space
  const PEN = { d: 0, nx: 0, ny: 0 };
  function headPen(p, wpn, R, lj) {
    PEN.d = 0;
    ND.solve(p, 0, 0, 1, lj, wpn);
    const hx = lj.head.x, hy = lj.head.y, ax = lj.haF.x, ay = lj.haF.y;
    if (Math.hypot(ax - hx, ay - hy) < R + 2) return PEN; // hand at the head: nothing sensible to push
    const long = wpn.type === 'bo' || wpn.type === 'naginata';
    const sx = long ? lj.pom.x : ax + (lj.tip.x - ax) * 0.06, sy = long ? lj.pom.y : ay + (lj.tip.y - ay) * 0.06;
    const dx = lj.tip.x - sx, dy = lj.tip.y - sy, LL = dx * dx + dy * dy || 1;
    const t = clamp(((hx - sx) * dx + (hy - sy) * dy) / LL, 0, 1);
    const cx = sx + dx * t - hx, cy = sy + dy * t - hy, d = Math.hypot(cx, cy);
    if (d >= R) return PEN;
    PEN.d = R - d;
    if (d > 0.5) { PEN.nx = cx / d; PEN.ny = cy / d; }
    else { const l = Math.sqrt(LL); PEN.nx = -dy / l; PEN.ny = dx / l; if (PEN.nx < 0) { PEN.nx = -PEN.nx; PEN.ny = -PEN.ny; } }
    return PEN;
  }
  function poseJump(a, b) {
    return Math.max(Math.abs(wrap(a.sw - b.sw)), Math.abs(a.ax - b.ax) / 26, Math.abs(a.ay - b.ay) / 26,
      Math.abs(a.lean - b.lean) * 1.4, Math.abs(a.hx - b.hx) / 26, Math.abs(a.hy - b.hy) / 26);
  }
  const outCubic = (u) => 1 - (1 - u) * (1 - u) * (1 - u);


  // ------------------------------------------------------------ round 2: flow, weight, grip, sleeves
  // 6. no dead stop at the contact key: where a cut eases to a stop on a key and the next segment carries on the same
  //    way at full speed (outQuart into outCubic), the timing round that key is replaced by a smooth curve (monotone
  //    cubic in the move's progress): the blade keeps its designed path but flows through the key.
  // How far the drawn blade may run ahead of / behind the fight's while a blow can hit: the flow through the contact
  // key needs some room (a cut moves 50-150 px per 1/60 s frame there, so ~26 px is not seen as a mismatch); the
  // other shaping (arcs, head clearance) keeps to ACT_PX on its own and everything together to ACT_MAX.
  const FLOW_PX = 26, ACT_PX = 12, ACT_MAX = 30;
  const FLOW = { a: null, b: null, e: 0, ps: 0, pd: 0, A: null, B: null, C: null };
  function pAt(keys, m, t) {
    const k0 = keys[m - 1], k1 = keys[m], k2 = keys[m + 1];
    if (t <= k1[0]) return (k1[2] || inOutSine)(clamp((t - k0[0]) / Math.max(1e-4, k1[0] - k0[0]), 0, 1));
    return 1 + (k2[2] || inOutSine)(clamp((t - k1[0]) / Math.max(1e-4, k2[0] - k1[0]), 0, 1));
  }
  function hitch(keys, m) {
    if (m < 1 || m + 1 >= keys.length) return false;
    const k0 = keys[m - 1], k1 = keys[m], k2 = keys[m + 1], A = k0[1], B = k1[1], C = k2[1];
    if (!A || !B || !C) return false;
    const d1 = k1[0] - k0[0], d2 = k2[0] - k1[0];
    if (d1 < 0.02 || d2 < 0.02) return false;
    const e1 = k1[2] || inOutSine, e2 = k2[2] || inOutSine, h = 0.03;
    const vin = (1 - e1(1 - h)) / (h * d1), vout = e2(h) / (h * d2);
    if (!(vin < 0.4 * vout)) return false;
    const x1 = B.sw - A.sw, y1 = (B.ax - A.ax) / 40, z1 = (B.ay - A.ay) / 40, x2 = C.sw - B.sw, y2 = (C.ax - B.ax) / 40, z2 = (C.ay - B.ay) / 40;
    const n1 = Math.hypot(x1, y1, z1), n2 = Math.hypot(x2, y2, z2);
    return n1 > 0.08 && n2 > 0.08 && (x1 * x2 + y1 * y2 + z1 * z2) / (n1 * n2) > 0.25;
  }
  function flowAt(keys, t, cap, blade) {
    if (!keys || keys.length < 3) return null;
    let i = 1;
    while (i < keys.length && t > keys[i][0]) i++;
    if (i >= keys.length) return null;
    for (const m of [i, i - 1]) {
      if (!hitch(keys, m)) continue;
      const tm = keys[m][0], d1 = tm - keys[m - 1][0], d2 = keys[m + 1][0] - tm;
      const ta = tm - 0.5 * d1, tb = tm + 0.45 * d2;
      if (!(t > ta && t < tb)) continue;
      const ep = 0.002, pa = pAt(keys, m, ta), pb = pAt(keys, m, tb), hh = tb - ta;
      let ma = (pAt(keys, m, ta + ep) - pAt(keys, m, ta - ep)) / (2 * ep), mb = (pAt(keys, m, tb + ep) - pAt(keys, m, tb - ep)) / (2 * ep);
      const dl = (pb - pa) / hh;
      if (dl <= 0) return null;
      const al = ma / dl, be = mb / dl, r = al * al + be * be;
      if (r > 9) { const tau = 3 / Math.sqrt(r); ma *= tau; mb *= tau; }
      const u = (t - ta) / hh, u2 = u * u, u3 = u2 * u;
      let pd = (2 * u3 - 3 * u2 + 1) * pa + (u3 - 2 * u2 + u) * hh * ma + (-2 * u3 + 3 * u2) * pb + (u3 - u2) * hh * mb;
      const ps = pAt(keys, m, t);
      const A = keys[m - 1][1], B = keys[m][1], C = keys[m + 1][1];
      if (cap) { // while the blow can hit: the drawn tip stays within ~FLOW_PX of the fight's
        const P = ps < 1 ? A : B, Q = ps < 1 ? B : C, Lp = Math.abs(Q.sw - P.sw) * blade + Math.hypot(Q.ax - P.ax, Q.ay - P.ay);
        const mx = FLOW_PX / Math.max(1, Lp);
        pd = clamp(pd, ps - mx, ps + mx);
      }
      FLOW.ps = ps; FLOW.pd = pd; FLOW.A = A; FLOW.B = B; FLOW.C = C;
      FLOW.a = pd < 1 ? A : B; FLOW.b = pd < 1 ? B : C; FLOW.e = pd < 1 ? pd : pd - 1;
      return FLOW;
    }
    return null;
  }
  const lerpP = (A, B, C, p, k) => (p < 1 ? A[k] + (B[k] - A[k]) * p : B[k] + (C[k] - B[k]) * (p - 1));

  // 7. weight: how the weapon carries on and settles. A spring on the sword angle and hand drags behind a slow move
  //    and carries past a stop (the follow-through, the settle after a wind-up); heavy weapons (nodachi, naginata,
  //    bō) swing on a soft spring and settle late, light ones (tantō, kodachi, tessen, kusarigama) on a stiff one and
  //    snap back to guard early. It is held to the fight's pose while a blow can hit and in blade contact.
  const WEIGHT = {
    heavy: { f: 4.4, z: 0.32, rec: 1.55, sw: 0.6, px: 16 },
    mid: { f: 8.5, z: 0.5, rec: 1, sw: 0.3, px: 9 },
    light: { f: 15, z: 0.72, rec: 0.55, sw: 0.14, px: 5 },
  };
  function weightOf(f) {
    const w = f.wpn, t = w.type;
    if (t === 'naginata' || t === 'bo' || (w.blade || 0) >= 120) return WEIGHT.heavy;
    if (w.twin || t === 'kusarigama' || (w.blade || 96) <= 72) return WEIGHT.light;
    return WEIGHT.mid;
  }
  const SPK = ['sw', 'ax', 'ay'];
  const CONTACT = { parry: 1, block: 1, lock: 1, clash: 1, shove: 1 };

  // 8. a two-handed grip holds: when the rear hand cannot reach its place on the hilt / shaft, it slides along the
  //    grip to the nearest place it can reach instead of floating off the weapon (Jin's bō most of all).
  const GRIP_OFF = { tessen: 1, kusarigama: 1, yumi: 1 };
  function gripSlide(D, wpn, lj) {
    ND.solve(D, 0, 0, 1, lj, wpn);
    const sx = lj.sh.x - 3, sy = lj.sh.y + 1, ux = Math.cos(D.sw), uy = Math.sin(D.sw), hx = lj.haF.x, hy = lj.haF.y;
    const r = L.uArm + L.fArm - 1.5, t0 = wpn.handle * 0.55;
    if (Math.hypot(hx - ux * t0 - sx, hy - uy * t0 - sy) <= r) return;
    const wx = hx - sx, wy = hy - sy, wu = wx * ux + wy * uy, disc = wu * wu - (wx * wx + wy * wy) + r * r;
    if (disc < 0) return;
    const q = Math.sqrt(disc), lo = 8, hi = Math.max(lo, wpn.handle);
    let best = null;
    for (const t of [wu - q, wu + q]) if (t >= lo && t <= hi && (best === null || Math.abs(t - t0) < Math.abs(best - t0))) best = t;
    if (best === null) return;
    D.gx = hx - ux * best - lj.sh.x; D.gy = hy - uy * best - lj.sh.y; D.grip = 0;
  }

  // the display chain (kusarigama): the fight's chain with its two held ends moved onto the display hands
  function dispChain(S, f, j, sj) {
    const C = f.chain;
    if (!C || !sj.chain) return null;
    const dpx = j.pom.x - sj.pom.x, dpy = j.pom.y - sj.pom.y, dhx = j.haB.x - sj.haB.x, dhy = j.haB.y - sj.haB.y;
    if (Math.abs(dpx) + Math.abs(dpy) + Math.abs(dhx) + Math.abs(dhy) < 0.5) return C;
    const n = C.n, D = S.chain || (S.chain = { n, x: new Float32Array(n), y: new Float32Array(n), tx: C.tx, ty: C.ty, ti: 0, spd: 0 });
    for (let i = 0; i < n; i++) {
      const w0 = Math.max(0, 1 - i / 5), wh = Math.max(0, 1 - Math.abs(i - 7) / 4) * (1 - w0);
      D.x[i] = C.x[i] + dpx * w0 + dhx * wh; D.y[i] = C.y[i] + dpy * w0 + dhy * wh;
    }
    D.ti = C.ti; D.spd = C.spd; D.tx = C.tx; D.ty = C.ty;
    return D;
  }

  // ------------------------------------------------------------ the display pose for this step
  // hold: a step the fight did not advance (hit-stop): only a catch-up in progress moves on
  // rj: the joints the fight solved this step (the ragdoll's once the fighter is down)
  A.present = function (f, dt, hold, rj) {
    const S = f._anim || (f._anim = mk(f));
    S.stamp = ND.simClock;
    if (f.dead || !A.on) { S.ok = false; if (!hold) f.cloth(rj || f.j, dt); return; }
    const T = f.pose, D = S.p, G = ND.game;
    if (!hold) {
      // a jump in one step: at a state change, or right before a hit-stop (the parry's meeting frame)
      const changed = f.state !== S.prevState || f.serial !== S.prevSerial;
      const jump = poseJump(T, S.prevT);
      if (S.ok && jump > 0.75 && (changed || (G && G.hitstopT > 0))) {
        pose.copy(D, S.from);
        S.from.sw += TAU * Math.round((T.sw - S.from.sw) / TAU); // the short way round (a bō's wrapped angle)
        S.cu = 0; S.cuDur = G && G.hitstopT > 0 ? Math.min(0.04, G.hitstopT * 0.6) : 0.05;
      }
      S.prevState = f.state; S.prevSerial = f.serial;
      pose.copy(T, S.prevT);
    }
    pose.copy(T, D);
    if (f.state === 'win' && ND.flair) ND.flair.winPose(f, D); // a worn victory pose (js/flair.js): drawing only
    // 1 + 2: shape the in-between frames of a keyed move (attacks, parry deflections)
    const at = f.state === 'atk' ? f.atk : null;
    const act = !!at && !!(at.hits ? at.hits.some((h) => f.st >= h[0] - 0.02 && f.st <= h[1] + 0.02) : at.active && f.st >= at.active[0] - 0.02 && f.st <= at.active[1] + 0.02);
    const keys = f.state === 'atk' ? f.keys : f.state === 'parry' ? f.pk : null;
    let sg = keys ? segAt(keys, f.st) : null;
    if (S.wch !== f.ch) { S.wch = f.ch; S.wc = weightOf(f); }
    const W = S.wc;
    // 6: flow through a contact key (same designed path, smoother timing)
    const fl = f.state === 'atk' ? flowAt(keys, f.st, act, f.wpn.blade || L.blade) : null;
    if (fl) {
      for (const q of KEYS) D[q] += lerpP(fl.A, fl.B, fl.C, fl.pd, q) - lerpP(fl.A, fl.B, fl.C, fl.ps, q);
      SEG.a = fl.a; SEG.b = fl.b; SEG.e = fl.e; sg = SEG;
    } else if (sg && at && keys.length > 2 && sg.b === keys[keys.length - 1][1] && W.rec !== 1) {
      // 7b: the last segment back to guard: heavy weapons linger in the follow-through, light ones snap back
      const ae = at.hits ? at.hits[at.hits.length - 1][1] : at.active ? at.active[1] : 0;
      if (f.st > ae + 0.02) {
        const ed = W.rec > 1 ? Math.pow(sg.e, W.rec) : 1 - Math.pow(1 - sg.e, 1 / W.rec);
        for (const q of KEYS) D[q] += (sg.b[q] - sg.a[q]) * (ed - sg.e);
        sg.e = ed;
      }
    }
    if (sg) {
      // (while the blow can hit, the drawn hand stays within 12 px of the fight's own: what hits is what is seen)
      const fx = arcFix(sg.a, sg.b, sg.e, act ? ACT_PX : 34);
      D.ax += fx.x; D.ay += fx.y;
      const R = HEAD_R[f.ch.acc] || 15;
      if (!NO_CLEAR[f.wpn.type] && !f.wpn.twin) {
        const pd = headPen(D, f.wpn, R, S.lj);
        if (pd.d > 0) {
          const nx = pd.nx, ny = pd.ny, d0 = pd.d;
          const pa = headPen(sg.a, f.wpn, R, S.lj).d, pb = headPen(sg.b, f.wpn, R, S.lj).d;
          const ex = d0 - (pa + (pb - pa) * sg.e); // only what the in-between adds
          if (ex > 0) { const m = Math.min(ex + 1.5, 16); D.ax += nx * m; D.ay += ny * m; }
        }
      }
      if (act) { // arcs and head clearance together stay within ACT_PX of where the hand would be without them
        const bx = fl ? T.ax + lerpP(fl.A, fl.B, fl.C, fl.pd, 'ax') - lerpP(fl.A, fl.B, fl.C, fl.ps, 'ax') : T.ax;
        const by = fl ? T.ay + lerpP(fl.A, fl.B, fl.C, fl.pd, 'ay') - lerpP(fl.A, fl.B, fl.C, fl.ps, 'ay') : T.ay;
        const dx = D.ax - bx, dy = D.ay - by, m = Math.hypot(dx, dy);
        if (m > ACT_PX) { D.ax = bx + (dx * ACT_PX) / m; D.ay = by + (dy * ACT_PX) / m; }
      }
    }
    // while a blow can hit, everything above together keeps the drawn blade within ACT_MAX px of the fight's
    if (act) {
      ND.solve(T, 0, 0, 1, S.lt, f.wpn); ND.solve(D, 0, 0, 1, S.lj, f.wpn);
      const e = Math.max(Math.hypot(S.lj.tip.x - S.lt.tip.x, S.lj.tip.y - S.lt.tip.y), Math.hypot(S.lj.haF.x - S.lt.haF.x, S.lj.haF.y - S.lt.haF.y));
      if (e > ACT_MAX) { const k = ACT_MAX / e; for (const q of KEYS) D[q] = T[q] + (D[q] - T[q]) * k; }
    }
    // 3: catch-up after a jump
    if (S.cuDur > 0) {
      S.cu += dt;
      const u = S.cu / S.cuDur;
      if (u >= 1) S.cuDur = 0;
      else {
        const k = outCubic(u), F = S.from;
        for (const q of KEYS) D[q] = F[q] + (D[q] - F[q]) * k;
      }
    }
    // 7: weight spring (not while a blow can hit, in blade contact, in a catch-up or a roll)
    const contact = act || !!CONTACT[f.state] || S.cuDur > 0 || !!f.roll;
    const soon = !!(at && at.active && f.st < at.active[0] - 0.02 && f.st > at.active[0] - 0.08); // fade out just before the blow
    if (!hold) {
      const h = Math.max(dt, 1e-4), om = TAU * W.f, z = W.z, X = S.sx, Y = S.sy, V = S.sv;
      for (let c = 0; c < 3; c++) {
        let x = D[SPK[c]];
        if (c === 0 && S.sinit) x += TAU * Math.round((X[0] - x) / TAU);
        if (!S.sinit || contact) { V[c] = S.sinit ? (x - X[c]) / h : 0; Y[c] = x; }
        else { V[c] += (om * om * (x - Y[c]) - 2 * z * om * V[c]) * h; Y[c] += V[c] * h; }
        X[c] = x;
      }
      S.sinit = true;
      const tw = contact || soon ? 0 : 1;
      S.ws = tw < S.ws ? Math.max(tw, S.ws - h / 0.03) : Math.min(tw, S.ws + h / 0.06);
    }
    if (S.ws > 0) {
      const o0 = clamp(S.sy[0] - S.sx[0], -W.sw, W.sw);
      let ox = S.sy[1] - S.sx[1], oy = S.sy[2] - S.sx[2]; const om2 = Math.hypot(ox, oy);
      if (om2 > W.px) { ox *= W.px / om2; oy *= W.px / om2; }
      D.sw += o0 * S.ws; D.ax += ox * S.ws; D.ay += oy * S.ws;
    }
    // 8: the rear hand stays on a two-handed grip
    if (!f.wpn.twin && !GRIP_OFF[f.wpn.type] && D.grip >= 0.9) gripSlide(D, f.wpn, S.lj);
    // joints
    const sj = f.j, j = S.j, dir = f.dir * (f.vdir ?? 1);
    ND.solve(D, f.x, f.y, dir, j, f.wpn);
    // 5: the blade stays above the floor: a tip that would go into the ground turns up round the hand to lie on it
    // (not while the blow can hit: there the drawn blade is the fight's; it settles onto the floor after, ~0.06 s)
    if (!hold) {
      S.gw = act ? 0 : Math.min(1, S.gw + dt / 0.06);
      // how fast the blade is turning (smoothed): a quick sweep through "straight down" is let through the floor for
      // the instant it takes; a slow or held downward blade is laid on the floor
      const sv = S.gp === S.gp ? Math.abs(wrap(D.sw - S.gp)) / Math.max(dt, 1e-4) : 0;
      S.gp = D.sw; S.gv += (sv - S.gv) * Math.min(1, dt / 0.05);
      const c = Math.cos(D.sw);
      if (Math.abs(c) > 0.25) S.gs = c >= 0 ? 1 : -1; // the side it lies to, kept while it points straight down
      S.gsb += clamp(S.gs - S.gsb, -dt / 0.12, dt / 0.12);
    }
    if (!f.roll && j.tip.y > GROUND && S.gw > 0) {
      const len = f.wpn.blade || L.blade, s = (GROUND - j.haF.y) / len;
      if (s > -1 && s < 1) {
        const c = Math.cos(D.sw), a0 = Math.asin(s);
        const wv = Math.max(clamp((Math.abs(c) - 0.25) / 0.3, 0, 1), clamp(1 - (S.gv - 2) / 4, 0, 1));
        // (lying forward: a0; lying back: π − a0; a change of side turns through the vertical in ~0.12 s)
        let sw = a0 + (Math.PI - 2 * a0) * (1 - (S.gsb + 1) / 2);
        sw += TAU * Math.round((D.sw - sw) / TAU);
        D.sw += (sw - D.sw) * S.gw * wv * wv * (3 - 2 * wv);
        ND.solve(D, f.x, f.y, dir, j, f.wpn);
      }
    }
    if (f.roll) {
      const cx = f.x, cy = f.y - 72, c = Math.cos(f.roll), s = Math.sin(f.roll);
      for (const k of RKEYS) { const p = j[k]; if (!p) continue; const dx = p.x - cx, dy = p.y - cy; p.x = cx + dx * c - dy * s; p.y = cy + dx * s + dy * c; }
      j.hang += f.roll;
    }
    j.hasSword = sj.hasSword;
    for (const k of WKEYS) j[k] = sj[k];
    j.chain = sj.chain ? dispChain(S, f, j, sj) : null;
    // 9: sleeves billow with the arm's swing and settle with a little wobble (skeleton.js armGeom reads _slF / _slB)
    if (!hold) {
      const h = Math.max(dt, 1e-4), om = TAU * 6.5;
      for (let k = 0; k < 2; k++) {
        const el = k ? j.elB : j.elF, a = Math.atan2(el.y - j.sh.y, el.x - j.sh.x), pa = S.sla[k];
        const w = pa === pa ? Math.abs(wrap(a - pa)) / h : 0, tgt = Math.min(7, w * 0.45);
        S.slv[k] += (om * om * (tgt - S.sl[k]) - 2 * 0.28 * om * S.slv[k]) * h; S.sl[k] += S.slv[k] * h;
        S.sl[k] = clamp(S.sl[k], -2, 9); S.sla[k] = a;
      }
    }
    j._slF = S.sl[0]; j._slB = S.sl[1];
    S.ok = true;
    if (!hold) f.cloth(j, dt);
  };
  // a presented step the fight did not advance (hit-stop, pause of the fight clock): keeps a catch-up going
  A.hold = function (f, dt) {
    const S = f._anim;
    if (!S || S.stamp === ND.simClock || !S.ok || f.dead) return;
    if (S.cuDur > 0) A.present(f, dt, true);
    S.stamp = ND.simClock;
  };

  // ------------------------------------------------------------ blade streak along the real arc
  // Trail entries: [baseX, baseY, tipX, tipY, handX, handY] (world). Between two samples the blade turned round the
  // hand: the streak is cut into slices along that turn (angle and length blended), so its edge is the tip's arc.
  // fill(i, a0, a1, b0, b1): draws one slice; returns the number of slices.
  const Q = [0, 0, 0, 0, 0, 0, 0, 0];
  A.trailSlices = function (T, emit) {
    let n = 0;
    for (let i = 1; i < T.length; i++) {
      const a = T[i - 1], b = T[i];
      if (a.length < 6 || b.length < 6) { Q[0] = a[0]; Q[1] = a[1]; Q[2] = a[2]; Q[3] = a[3]; Q[4] = b[0]; Q[5] = b[1]; Q[6] = b[2]; Q[7] = b[3]; emit(i, 0, 1, Q); n++; continue; }
      const aa = Math.atan2(a[3] - a[5], a[2] - a[4]), ba = Math.atan2(b[3] - b[5], b[2] - b[4]), d = wrap(ba - aa);
      const la = Math.hypot(a[2] - a[4], a[3] - a[5]), lb = Math.hypot(b[2] - b[4], b[3] - b[5]);
      const ka = Math.hypot(a[0] - a[4], a[1] - a[5]), kb = Math.hypot(b[0] - b[4], b[1] - b[5]);
      const m = Math.max(1, Math.min(10, Math.ceil(Math.abs(d) / 0.13)));
      let px0 = a[0], py0 = a[1], tx0 = a[2], ty0 = a[3];
      for (let s = 1; s <= m; s++) {
        const u = s / m, th = aa + d * u, c = Math.cos(th), sn = Math.sin(th);
        const hx = a[4] + (b[4] - a[4]) * u, hy = a[5] + (b[5] - a[5]) * u, l = la + (lb - la) * u, k = ka + (kb - ka) * u;
        const px1 = s === m ? b[0] : hx + c * k, py1 = s === m ? b[1] : hy + sn * k, tx1 = s === m ? b[2] : hx + c * l, ty1 = s === m ? b[3] : hy + sn * l;
        Q[0] = px0; Q[1] = py0; Q[2] = tx0; Q[3] = ty0; Q[4] = px1; Q[5] = py1; Q[6] = tx1; Q[7] = ty1;
        emit(i, (s - 1) / m, u, Q); n++;
        px0 = px1; py0 = py1; tx0 = tx1; ty0 = ty1;
      }
    }
    return n;
  };
})(window.ND);
