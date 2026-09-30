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
      p: pose.copy(f.pose), prevT: pose.copy(f.pose), from: pose.copy(f.pose), pa: {}, pb: {}, lj: {},
      j: {}, cu: 0, cuDur: 0, gw: 1, prevState: f.state, prevSerial: f.serial, ok: false, stamp: -1, chain: null,
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
    const ta = Math.atan2(a.ay, a.ax), d = wrap(Math.atan2(b.ay, b.ax) - ta), ad = Math.abs(d);
    if (ad < 0.25 || ad > 2.8) return ARC; // (a near half turn: which way round is not known; keep the straight path)
    const w = ad > 2.3 ? (2.8 - ad) / 0.5 : 1;
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
    // 1 + 2: shape the in-between frames of a keyed move (attacks, parry deflections)
    const at = f.state === 'atk' ? f.atk : null;
    const act = !!at && !!(at.hits ? at.hits.some((h) => f.st >= h[0] - 0.02 && f.st <= h[1] + 0.02) : at.active && f.st >= at.active[0] - 0.02 && f.st <= at.active[1] + 0.02);
    const keys = f.state === 'atk' ? f.keys : f.state === 'parry' ? f.pk : null;
    const sg = keys ? segAt(keys, f.st) : null;
    if (sg) {
      // (while the blow can hit, the drawn hand stays within 12 px of the fight's own: what hits is what is seen)
      const fx = arcFix(sg.a, sg.b, sg.e, act ? 12 : 22);
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
      if (act) { // both shifts together stay within 12 px of the fight's hand
        const dx = D.ax - T.ax, dy = D.ay - T.ay, m = Math.hypot(dx, dy);
        if (m > 12) { D.ax = T.ax + (dx * 12) / m; D.ay = T.ay + (dy * 12) / m; }
      }
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
    // joints
    const sj = f.j, j = S.j, dir = f.dir * (f.vdir ?? 1);
    ND.solve(D, f.x, f.y, dir, j, f.wpn);
    // 5: the blade stays above the floor: a tip that would go into the ground turns up round the hand to lie on it
    // (not while the blow can hit: there the drawn blade is the fight's; it settles onto the floor after, ~0.06 s)
    if (!hold) S.gw = act ? 0 : Math.min(1, S.gw + dt / 0.06);
    if (!f.roll && j.tip.y > GROUND && S.gw > 0) {
      const len = f.wpn.blade || L.blade, s = (GROUND - j.haF.y) / len;
      if (s > -1 && s < 1) {
        // (a blade swept through straight down is left as it is round the vertical, where it would have to jump
        // from lying forward to lying back: the weight fades to 0 there, so it never flips)
        const c = Math.cos(D.sw), a0 = Math.asin(s), wv = clamp((Math.abs(c) - 0.25) / 0.3, 0, 1);
        let sw = c >= 0 ? a0 : Math.PI - a0;
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
