












(function (ND) {
  'use strict';
  const D = (ND.depth25 = {
    on: typeof location !== 'undefined' && /[?&]depth=1(&|$)/.test(location.search || ''),
    cam: 320,
    stats: { draws: 0 },
  });
  const DEG = Math.PI / 180, TAU = Math.PI * 2;
  const W = 11;
  const HILT0 = 4;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (u) => u * u * (3 - 2 * u);






  const SPEC = {
    ak_heavy: {
      end: 0.92, inT: 0.1, out: [0.8, 0.92],
      psi: [[0, 0], [0.14, -58], [0.34, -62], [0.36, -20], [0.4, 6], [0.44, 22], [0.52, 42], [0.56, 46], [0.66, 40], [0.8, 12], [0.92, 0]],
      hz: [[0, 11], [0.14, -10], [0.34, -12], [0.36, -4], [0.4, 4], [0.44, 12], [0.48, 24], [0.52, 34], [0.56, 36], [0.66, 34], [0.8, 18], [0.92, 11]],
      dx: [[0, 0], [0.34, 0], [0.44, 0], [0.52, -8], [0.56, -10], [0.66, -10], [0.92, 0]],
      yaw: [[0, 195], [0.355, 198], [0.36, 334], [0.37, 352], [0.4, 362], [0.44, 380], [0.48, 425], [0.52, 452], [0.56, 466], [0.66, 462], [0.8, 510], [0.92, 555]],
      el: [[0, -17], [0.355, -14], [0.36, -22], [0.37, -16], [0.4, -4], [0.44, 2], [0.48, 8], [0.52, 20], [0.56, 42], [0.66, 42], [0.8, 8], [0.92, -17]],
      roll: [[0, 90], [0.355, 90], [0.36, 14], [0.4, 0], [0.56, -18], [0.66, -18], [0.8, 50], [0.92, 90]],
      draw: 0.36,
      shake: [0.4, 0.47], push: [0.36, 0.42, 0.62],
    },
    ak_l1: {
      end: 0.42, inT: 0.05, out: [0.34, 0.42],
      psi: [[0, 0], [0.055, -40], [0.08, -6], [0.11, 10], [0.15, 28], [0.2, 38], [0.3, 16], [0.42, 0]],
      hz: [[0, 11], [0.055, -8], [0.08, 0], [0.11, 6], [0.15, 20], [0.2, 30], [0.3, 18], [0.42, 11]],
      dx: [[0, 0], [0.11, 0], [0.2, -8], [0.42, 0]],
      yaw: [[0, 195], [0.058, 198], [0.062, 320], [0.08, 352], [0.11, 366], [0.15, 418], [0.2, 448], [0.3, 490], [0.42, 555]],
      el: [[0, -17], [0.058, -14], [0.062, -6], [0.08, -2], [0.11, 1], [0.15, 10], [0.2, 30], [0.3, 12], [0.42, -17]],
      roll: [[0, 90], [0.058, 90], [0.064, 10], [0.11, 0], [0.2, -14], [0.3, 40], [0.42, 90]],
      draw: 0.06,
      shake: [0.1, 0.15], push: [0.07, 0.11, 0.24],
    },
  };
  let MOVES = null;
  function moves() {
    if (MOVES) return MOVES;
    const A = ND.ATK;
    if (!A || !A.ak_heavy) return null;
    MOVES = new Map();
    for (const k in SPEC) if (A[k]) MOVES.set(A[k], SPEC[k]);
    return MOVES;
  }
  function track(K, t) {
    if (t <= K[0][0]) return K[0][1];
    for (let i = 1; i < K.length; i++) {
      if (t <= K[i][0]) {
        const a = K[i - 1], b = K[i], u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * sstep(u);
      }
    }
    return K[K.length - 1][1];
  }
  function specOf(f) {
    if (!f || f.dead || f.state !== 'atk' || !f.atk) return null;
    const M = moves();
    return (M && M.get(f.atk)) || null;
  }



  D.provider = null;
  const extOf = (f) => (D.provider && f && !f.dead ? D.provider(f) : null);
  D.active = (f) => !!specOf(f) || !!extOf(f);


  const v3 = (x, y, z) => ({ x, y, z });
  const sub = (a, b) => v3(a.x - b.x, a.y - b.y, a.z - b.z);
  const add = (a, b) => v3(a.x + b.x, a.y + b.y, a.z + b.z);
  const mul = (a, k) => v3(a.x * k, a.y * k, a.z * k);
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const cross = (a, b) => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  const len = (a) => Math.hypot(a.x, a.y, a.z);
  const norm = (a) => { const l = len(a) || 1; return v3(a.x / l, a.y / l, a.z / l); };
  const lerp3 = (a, b, t) => v3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);

  function ik3(s, h, l1, l2, pole) {
    let d = sub(h, s), dist = len(d);
    const max = l1 + l2 - 0.01;
    if (dist > max) { h = add(s, mul(d, max / dist)); d = sub(h, s); dist = max; }
    dist = Math.max(dist, 1e-3);
    const u = mul(d, 1 / dist);
    const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    let p = sub(pole, mul(u, dot(pole, u)));
    p = norm(p);
    return { e: add(add(s, mul(u, a)), mul(p, hh)), h };
  }


  const FAR = { x: 0, y: -0.25, z: -0.97 };
  function slerp3(a, b, t, mid) {
    const c = clamp(dot(a, b), -1, 1);
    if (c < -0.6 && mid) return t < 0.5 ? slerp3(a, norm(mid), t * 2) : slerp3(norm(mid), b, t * 2 - 1);
    const th = Math.acos(c);
    if (th < 1e-4) return norm(lerp3(a, b, t));
    const s0 = Math.sin((1 - t) * th) / Math.sin(th), s1 = Math.sin(t * th) / Math.sin(th);
    return norm(add(mul(a, s0), mul(b, s1)));
  }


  function obiAt(P, psi, nx, ny) {
    const ps = psi * 0.55;
    let ux = P.neck.x - P.hip.x, uy = P.neck.y - P.hip.y; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    const rx = ux * 5 + nx * 13, ry = uy * 5 + ny * 13, rz = -6;
    return v3(P.hip.x + rx * Math.cos(ps) - rz * Math.sin(ps), P.hip.y + ry, rx * Math.sin(ps) + rz * Math.cos(ps));
  }

  function restDirAt(psi) {
    const ps = psi * 0.55, r0 = norm(v3(-0.955, 0.296, -0.12));
    return norm(v3(r0.x * Math.cos(ps) - r0.z * Math.sin(ps), r0.y, r0.x * Math.sin(ps) + r0.z * Math.cos(ps)));
  }


  const SHS = new WeakMap(), NOTO_T = 0.16, DRAW_T = 0.05, PULL = 12, PULL_T = [0.07, 0.3];
  function sheath(f, home) {
    const clk = ND.simClock || 0;
    let st = SHS.get(f);
    if (!st || clk < st.clk || clk - st.clk > 0.5) { st = { s: home ? 1 : 0, clk, drawT: 9, pull: 0 }; SHS.set(f, st); }
    const dt = clk - st.clk;
    if (dt > 0) {
      const was = st.s;
      st.s = home ? Math.min(1, st.s + dt / NOTO_T) : Math.max(0, st.s - dt / DRAW_T);
      if (!home && was >= 0.999) st.drawT = 0; else st.drawT += dt;
      st.clk = clk;
    }
    const t = st.drawT;
    st.pull = home || t >= PULL_T[0] + PULL_T[1] ? 0 : PULL * (t < PULL_T[0] ? sstep(t / PULL_T[0]) : 1 - sstep((t - PULL_T[0]) / PULL_T[1]));
    return st;
  }



  const ZN = { hip: 0, neck: 0, sh: 0, head: 0, elF: W + 1, haF: W, tip: W, pom: W, elB: -W - 1, haB: -W, knF: 7, ftF: 7, knB: -7, ftB: -7 };
  const KEYS = Object.keys(ZN);
  const POSE = new WeakMap(), TRAIL = new WeakMap();
  (ND.onLook || (ND.onLook = [])).push((f) => { SHS.delete(f); POSE.delete(f); TRAIL.delete(f); });

  function loc(f, p, z) { return v3((p.x - f.x) * (f.dir < 0 ? -1 : 1), p.y, z); }



  D.pose3d = function (f, force) {
    const j = f.viewJ && f.viewJ();
    if (!j || !j.hip) return null;
    const sp = specOf(f), ex = sp ? null : extOf(f);
    if (!sp && !ex && !force) return null;
    const t = sp ? f.st : 0;
    let w = 0;
    if (sp) w = Math.min(sstep(clamp(t / sp.inT, 0, 1)), 1 - sstep(clamp((t - sp.out[0]) / (sp.out[1] - sp.out[0]), 0, 1)));
    else if (ex) w = ex.w;
    const psi = sp ? track(sp.psi, t) * DEG * w : ex ? ex.psi * w : 0;
    const P = {};
    for (const k of KEYS) if (j[k]) P[k] = loc(f, j[k], ZN[k]);

    let ux = P.neck.x - P.hip.x, uy = P.neck.y - P.hip.y; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    const nx = -uy, ny = ux;
    const sn = Math.sin(psi), cs = Math.cos(psi);
    const shF = v3(P.sh.x - nx * W * sn, P.sh.y - ny * W * sn, W * cs);
    const shB = v3(P.sh.x + nx * W * sn, P.sh.y + ny * W * sn, -W * cs);

    const tip2 = P.tip || P.haF, hand2 = P.haF;
    let b2 = norm(v3(tip2.x - hand2.x, tip2.y - hand2.y, 0));
    if (!(Math.abs(b2.x) + Math.abs(b2.y) > 0)) b2 = v3(1, 0, 0);
    let u3 = b2, hand3 = v3(hand2.x, hand2.y, W), e3;

    const e2 = norm(v3(b2.y, -b2.x, 0));
    if (sp) {
      const yaw = track(sp.yaw, t) * DEG, el = track(sp.el, t) * DEG, roll = track(sp.roll, t) * DEG;
      const d3 = v3(Math.cos(el) * Math.cos(yaw), -Math.sin(el), Math.cos(el) * Math.sin(yaw));
      u3 = norm(lerp3(b2, d3, w));

      const eh = norm(v3(-Math.sin(yaw), 0, Math.cos(yaw)));
      let ev = cross(eh, u3); if (ev.y > 0) ev = mul(ev, -1);
      const e3a = norm(add(mul(eh, Math.cos(roll)), mul(ev, Math.sin(roll))));
      e3 = norm(lerp3(e2, e3a, w));
      hand3 = v3(hand2.x + track(sp.dx, t) * w, hand2.y, W + (track(sp.hz, t) - W) * w);
    } else if (ex) {
      if (ex.u3) u3 = norm(lerp3(b2, ex.u3, w));

      const fv0 = norm(cross(u3, e2));
      e3 = ex.roll ? norm(add(mul(e2, Math.cos(ex.roll * w)), mul(fv0, Math.sin(ex.roll * w)))) : e2;
      hand3 = v3(hand2.x + (ex.dx || 0) * w, hand2.y, W + ((ex.hz ?? W) - W) * w);
    } else e3 = e2;

    e3 = norm(sub(e3, mul(u3, dot(e3, u3))));



    const SH = sheath(f, !!j.wSheath && j.hasSword !== false && !!(f.wpn && f.wpn.iai));
    const obi = obiAt(P, psi, nx, ny), us = restDirAt(psi);
    const mouth = SH.pull > 0 ? add(obi, mul(us, SH.pull)) : obi, Hs = add(mouth, mul(us, -1.5));
    if (SH.s > 0) {
      const grip3 = add(Hs, mul(us, -HILT0)), dh = len(sub(hand3, grip3));
      hand3 = lerp3(hand3, grip3, SH.s * (1 - sstep(clamp((dh - 14) / 22, 0, 1))));
    }

    const BG = D.bindHand ? D.bindHand(f) : null;
    if (BG && BG.w > 0) {
      const k = BG.w;
      hand3 = lerp3(hand3, v3(BG.h[0], BG.h[1], BG.h[2]), k); u3 = norm(lerp3(u3, v3(BG.u[0], BG.u[1], BG.u[2]), k));
      e3 = norm(lerp3(e3, v3(BG.e[0], BG.e[1], BG.e[2]), k)); e3 = norm(sub(e3, mul(u3, dot(e3, u3)))); w = Math.max(w, k);
    }

    const armF = ik3(shF, hand3, ND.LEN.uArm, ND.LEN.fArm, v3(-0.3, 1, 0.22));
    const elF3 = lerp3(P.elF, armF.e, w), haF3 = lerp3(P.haF, armF.h, w);




    const wpn = f.wpn || ND.LEN;

    const ta = clamp((P.haB.x - hand2.x) * -b2.x + (P.haB.y - hand2.y) * -b2.y, 6, wpn.handle);
    const off = Math.hypot(P.haB.x - (hand2.x - b2.x * ta), P.haB.y - (hand2.y - b2.y * ta));
    const g = j.hasSword === false || j.wSheath ? 0 : 1 - sstep(clamp((off - 3) / 11, 0, 1));
    const haB0 = P.haB, haBf = v3(haB0.x, haB0.y, -W * cs + 2);
    const haBt = g > 0 ? lerp3(haBf, add(haF3, mul(u3, -clamp(ta, 9, wpn.handle - HILT0 - 4.5))), g) : haBf;
    const armB = ik3(shB, haBt, ND.LEN.uArm, ND.LEN.fArm, v3(-0.35, 1, -0.55));
    const wb = Math.max(w, g);
    const elB3 = lerp3(P.elB, armB.e, wb), haB3 = lerp3(P.haB, armB.h, wb);
    P.elF = elF3; P.haF = haF3; P.elB = elB3; P.haB = haB3;
    P.tip = add(haF3, mul(u3, wpn.blade)); P.pom = add(haF3, mul(u3, -wpn.handle));
    let out = POSE.get(f); if (!out) POSE.set(f, (out = {}));
    out.t = t; out.w = w; out.psi = psi; out.P = P; out.shF = shF; out.shB = shB; out.spec = sp || ex;
    out.armed = j.hasSword !== false;

    let bh = add(haF3, mul(u3, HILT0)), bu = u3, be = e3;
    if (SH.s > 0) {

      let es = sub(v3(0, -1, 0), mul(us, -us.y)); es = norm(es);
      bh = lerp3(bh, Hs, SH.s); bu = slerp3(u3, us, SH.s, FAR);

      if (dot(e3, es) >= 0) be = norm(lerp3(e3, es, SH.s));
      else { const fv = norm(cross(bu, e3)), a = Math.PI * SH.s; be = norm(lerp3(norm(add(mul(e3, Math.cos(a)), mul(fv, Math.sin(a)))), es, SH.s * SH.s)); }
      be = norm(sub(be, mul(bu, dot(be, bu))));
    }
    out.blade = { h: bh, u: bu, e: be }; out.sheathed = SH.s >= 0.999; out.sheathS = SH.s; out.grip = g; out.dir = f.dir < 0 ? -1 : 1; out.x = f.x;
    out.saya = { a: mouth, u: us };
    out.nx = nx; out.ny = ny;
    return out;
  };



  function projector(f, cam) {
    const dir = f.dir < 0 ? -1 : 1, cx = f.x, cy = -80;
    const pr = (p, zN = 0) => {
      const s = cam / (cam - (p.z - zN));
      const wx = f.x + p.x * dir;
      return { x: cx + (wx - cx) * s, y: cy + (p.y - cy) * s, s };
    };
    return pr;
  }


  const DJ = {};
  function jointsFor(f, S, pr) {
    const j0 = f.viewJ();
    for (const k in j0) DJ[k] = j0[k];
    const P = S.P;

    for (const k of ['elF', 'haF', 'elB', 'haB', 'tip', 'pom']) { const q = pr(P[k], k === 'haB' && S.grip ? -W + 2 * W * S.grip : ZN[k]); DJ[k] = { x: q.x, y: q.y }; }
    return DJ;
  }

  function trailState(f) { let s = TRAIL.get(f); if (!s) TRAIL.set(f, (s = { T: [], lastSt: -1, lastAtk: null })); return s; }
  function sampleTrail(f, S) {
    const st = trailState(f), sp = S.spec;
    if (st.lastAtk !== f.atk) { st.T.length = 0; st.lastAtk = f.atk; st.wasSheathed = false; }
    if (f.st === st.lastSt) return st;
    st.lastSt = f.st;
    const A = f.atk, on = !S.sheathed && A && A.active && f.st > A.active[0] - 0.05 && f.st < A.active[1] + 0.12;
    const L = (f.wpn || ND.LEN).blade;
    if (on && st.wasSheathed && sp && sp.draw != null) {


      const u1 = S.blade.u, y1 = Math.atan2(u1.z, u1.x), e1 = Math.asin(clamp(-u1.y, -1, 1));
      let y0 = 198 * DEG; const e0 = -14 * DEG;
      let yy = y1; while (yy < y0) yy += TAU;
      const h0 = st.h0 || S.blade.h, N = 7;
      for (let i = 0; i < N; i++) {
        const q = i / N, yw = y0 + (yy - y0) * (0.35 + 0.65 * q), el = e0 + (e1 - e0) * q;
        const u = v3(Math.cos(el) * Math.cos(yw), -Math.sin(el), Math.cos(el) * Math.sin(yw)), h = lerp3(h0, S.blade.h, q);
        st.T.push({ t: f.st - 0.03 * (1 - q), b: add(h, mul(u, L * 0.22)), m: add(h, mul(u, L * 0.62)), p: add(h, mul(u, L)) });
      }
    }
    st.wasSheathed = S.sheathed; if (S.sheathed) st.h0 = S.blade.h;
    if (on) {
      const b = S.blade;
      st.T.push({ t: f.st, b: add(b.h, mul(b.u, L * 0.22)), m: add(b.h, mul(b.u, L * 0.62)), p: add(b.h, mul(b.u, L)) });
    }
    while (st.T.length && (f.st - st.T[0].t > (sp && sp.end > 0.6 ? 0.075 : 0.05) || st.T.length > 24)) st.T.shift();
    return st;
  }
  D.sampleTrail = sampleTrail;
  D.trail = (f) => trailState(f).T;
  function drawTrail(ctx, f, S, pr, front) {
    const T = trailState(f).T;
    if (T.length < 2) return;
    const n = T.length, ka = D.trailAlpha ? D.trailAlpha(f) : 1;
    if (ka <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i < n; i++) {
      const a = T[i - 1], b = T[i];
      const zm = (a.p.z + b.p.z) * 0.5;
      if ((zm >= 0) !== front) continue;
      const k = i / n;
      const pa = pr(a.b, W), pb = pr(b.b, W), ta = pr(a.p, W), tb = pr(b.p, W);
      const s = (ta.s + tb.s) * 0.5, near = clamp((s - 1) * 6, -0.6, 1);
      ctx.fillStyle = `rgba(${D.trailCol ? D.trailCol(f) : '200,222,255'},${(ka * k * (0.34 + 0.22 * near)).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(ta.x, ta.y); ctx.lineTo(tb.x, tb.y); ctx.lineTo(pb.x, pb.y); ctx.closePath(); ctx.fill();

      ctx.strokeStyle = `rgba(245,250,255,${(ka * k * 0.85).toFixed(3)})`;
      ctx.lineWidth = Math.max(0.6, (1.2 + 3.4 * Math.max(0, near)) * k);
      ctx.beginPath(); ctx.moveTo(ta.x, ta.y); ctx.lineTo(tb.x, tb.y); ctx.stroke();
    }
    ctx.restore();
  }




  const KATANA_T = { katana: 1, nodachi: 1, kodachi: 1, ninjato: 1 };
  const isKatana = (w) => !w || !w.type || (KATANA_T[w.type] && !w.twin);
  D.isKatana = isKatana;
  function drawWeapon2d(ctx, f, S, pr, c, glint, j) {
    const b = S.blade, wpn = f.wpn, K = ND._draw;
    const h0 = pr(b.h, W), t0 = pr(add(b.h, mul(b.u, wpn.blade)), W), dx = t0.x - h0.x, dy = t0.y - h0.y, dl = Math.hypot(dx, dy) || 1;

    const ang = Math.atan2(dy, dx), sk = h0.s || 1, fs = clamp(dl / (wpn.blade * sk), 0.2, 1);
    const bow = wpn.type === 'yumi' && (j.wBow || 0) > 0.5;
    const jw = { dir: f.dir < 0 ? -1 : 1, wFs: 0, wFan: j.wFan || 0, wFanB: j.wFanB || 0, wBow: j.wBow || 0, wDraw: j.wDraw || 0, wArrow: j.wArrow || 0, wCharge: j.wCharge || 0, wAmmo: j.wAmmo,
      haF: { x: h0.x, y: h0.y }, haB: { x: j.haB.x, y: j.haB.y }, tip: { x: h0.x + (dx / dl) * 30 * sk, y: h0.y + (dy / dl) * 30 * sk }, hasSword: true };
    ctx.save(); ctx.translate(h0.x, h0.y); ctx.scale(sk, sk); if (fs < 0.995 && !bow) { ctx.rotate(ang); ctx.scale(fs, 1); ctx.rotate(-ang); } ctx.translate(-h0.x, -h0.y);
    if (bow) { jw.haB = { x: h0.x + (j.haB.x - h0.x) / sk, y: h0.y + (j.haB.y - h0.y) / sk }; jw.tip = { x: h0.x + (dx / dl) * 30, y: h0.y + (dy / dl) * 30 }; }
    K.drawSword(ctx, h0.x, h0.y, ang, c, glint, wpn, undefined, jw);
    ctx.restore();

    if (wpn.type === 'kusarigama' && j.chain && ND.Chain) ND.Chain.prototype.draw.call(j.chain, ctx, c.accent);
  }
  D.drawWeapon2d = drawWeapon2d;

  const STEEL0 = '#9aa3b2', STEEL1 = '#d7dde6', STEEL2 = '#f5f8fc';
  function drawKatana3(ctx, f, S, pr, c, glint) {
    const b = S.blade, wpn = f.wpn || ND.LEN, u = b.u, e = b.e, fv = cross(u, e);
    const H = b.h, ph = pr(H, W);
    const pom = pr(add(H, mul(u, -wpn.handle)), W);

    ctx.lineCap = 'round';
    ctx.strokeStyle = '#141116'; ctx.lineWidth = 5.2 * ph.s;
    ctx.beginPath(); ctx.moveTo(pom.x, pom.y); ctx.lineTo(ph.x, ph.y); ctx.stroke();
    ctx.strokeStyle = c.accentDark; ctx.lineWidth = 1.2 * ph.s;
    ctx.beginPath();
    for (let i = 4; i < wpn.handle - 2; i += 4.5) {
      const q0 = pr(add(add(H, mul(u, -i - 1.8)), mul(e, 2.4)), W), q1 = pr(add(add(H, mul(u, -i + 1.8)), mul(e, -2.4)), W);
      const q2 = pr(add(add(H, mul(u, -i - 1.8)), mul(e, -2.4)), W), q3 = pr(add(add(H, mul(u, -i + 1.8)), mul(e, 2.4)), W);
      ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.moveTo(q2.x, q2.y); ctx.lineTo(q3.x, q3.y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#3b3530'; ctx.lineWidth = 5.8 * pom.s;
    const pk = pr(add(H, mul(u, -wpn.handle + 1.6)), W);
    ctx.beginPath(); ctx.moveTo(pom.x, pom.y); ctx.lineTo(pk.x, pk.y); ctx.stroke();

    const C = add(H, mul(u, 1.5));
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * TAU, q = pr(add(C, add(mul(e, Math.cos(a) * 7.2), mul(fv, Math.sin(a) * 6.4))), W);
      i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
    }
    ctx.closePath();
    ctx.fillStyle = '#3b3530'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,236,200,.35)'; ctx.lineWidth = 0.9 * ph.s; ctx.stroke();

    const outL = sayaPose(f, S).out;
    if (outL <= 0) return;

    const BL = Math.min(wpn.blade, outL + 4), sori = 3.2 * wpn.blade / 96 * (BL / wpn.blade), N = 10;
    const L1 = [], L2 = [], E = [];


    const mf = S.minFlat || 0; let nd = null;
    if (mf) {
      const a0 = pr(add(H, mul(u, 3)), W), a1 = pr(add(H, mul(u, BL)), W), dx = a1.x - a0.x, dy = a1.y - a0.y, dl = Math.hypot(dx, dy);
      if (dl > 1) {
        nd = { x: -dy / dl, y: dx / dl };
        const q0 = pr(H, W), q1 = pr(add(H, e), W);
        if ((q1.x - q0.x) * nd.x + (q1.y - q0.y) * nd.y < 0) { nd.x = -nd.x; nd.y = -nd.y; }
      }
    }
    for (let i = 0; i <= N; i++) {
      const q = i / N, along = 3 + (BL - 3) * q, wq = 2.05 * (1 - Math.pow(q, 5) * 0.92);
      const ctr = add(add(H, mul(u, along)), mul(e, -sori * 4 * q * (1 - q)));
      const pe = pr(add(ctr, mul(e, wq)), W), ps = pr(add(ctr, mul(e, -wq * 0.95)), W), pm = pr(add(ctr, mul(e, wq * 0.62)), W);
      if (nd) {
        const pc = pr(ctr, W), want = mf * wq * pc.s;
        const c1 = (pe.x - pc.x) * nd.x + (pe.y - pc.y) * nd.y, c2 = -((ps.x - pc.x) * nd.x + (ps.y - pc.y) * nd.y), c3 = (pm.x - pc.x) * nd.x + (pm.y - pc.y) * nd.y;
        if (c1 < want) { pe.x += nd.x * (want - c1); pe.y += nd.y * (want - c1); }
        if (c2 < want * 0.95) { ps.x -= nd.x * (want * 0.95 - c2); ps.y -= nd.y * (want * 0.95 - c2); }
        if (c3 < want * 0.62) { pm.x += nd.x * (want * 0.62 - c3); pm.y += nd.y * (want * 0.62 - c3); }
      }
      L1.push(pe); L2.push(ps); E.push(pm);
    }
    const p0 = pr(add(H, mul(u, 3)), W), p1 = pr(add(H, mul(u, BL)), W);
    const g = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
    g.addColorStop(0, STEEL0); g.addColorStop(0.6, STEEL1); g.addColorStop(1, STEEL2);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(L1[0].x, L1[0].y);
    for (let i = 1; i <= N; i++) ctx.lineTo(L1[i].x, L1[i].y);
    for (let i = N; i >= 0; i--) ctx.lineTo(L2[i].x, L2[i].y);
    ctx.closePath(); ctx.fill();

    ctx.strokeStyle = 'rgba(40,46,60,.55)'; ctx.lineWidth = 0.7 * ph.s; ctx.stroke();

    const flat = Math.abs(fv.z);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (flat > 0.25) {
      ctx.globalAlpha = Math.pow((flat - 0.25) / 0.75, 2) * 0.55;
      const mid = Math.round(N * (0.35 + 0.3 * (0.5 + 0.5 * Math.sin((f.st || 0) * 9))));
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      const a0 = Math.max(0, mid - 2), a1 = Math.min(N, mid + 2);
      ctx.moveTo(L1[a0].x, L1[a0].y); for (let i = a0 + 1; i <= a1; i++) ctx.lineTo(L1[i].x, L1[i].y);
      for (let i = a1; i >= a0; i--) ctx.lineTo(L2[i].x, L2[i].y);
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = (0.8 + (1 - flat) * 0.6) * ph.s;
    ctx.beginPath(); ctx.moveTo(E[0].x, E[0].y); for (let i = 1; i <= N; i++) ctx.lineTo(E[i].x, E[i].y); ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 0.6 * ph.s;
    ctx.beginPath();
    for (let i = 1; i < N; i++) { const a = L1[i], z = L2[i], k = 0.3 + Math.sin(i * 2.1) * 0.06; const x = a.x + (z.x - a.x) * k, y = a.y + (z.y - a.y) * k; i > 1 ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();

    const hb = pr(add(H, mul(u, 2.5)), W);
    ctx.fillStyle = '#c8b27a'; ctx.beginPath(); ctx.arc(hb.x, hb.y, 1.9 * hb.s, 0, TAU); ctx.fill();
    if (glint > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = glint * 0.75;
      const r = (13 * glint + 4) * p1.s, gg = ctx.createRadialGradient(p1.x, p1.y, 0, p1.x, p1.y, r);
      gg.addColorStop(0, 'rgba(255,255,255,1)'); gg.addColorStop(0.25, 'rgba(255,220,160,.6)'); gg.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p1.x, p1.y, r, 0, TAU); ctx.fill(); ctx.restore();
    }
  }

  function sayaPose(f, S) {
    const wpn = f.wpn || ND.LEN;
    return { a: S.saya.a, u: S.saya.u, L: wpn.blade + 6, out: wpn.blade * (1 - (S.sheathS || 0)) };
  }
  D.sayaPose = sayaPose;

  function drawSaya3(ctx, f, S, pr, c, D0) {
    const { a, u, L: L0 } = sayaPose(f, S);
    const b = add(a, mul(u, L0)), pa = pr(a, W), pb = pr(b, W);
    ctx.lineCap = 'round';
    ctx.strokeStyle = D0.line; ctx.lineWidth = 7 * pa.s;
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    const g = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
    g.addColorStop(0, '#2a1416'); g.addColorStop(1, '#120a0b');
    ctx.strokeStyle = g; ctx.lineWidth = 4.8 * ((pa.s + pb.s) / 2);
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,120,110,.25)'; ctx.lineWidth = 0.9;
    const dx = pb.x - pa.x, dy = pb.y - pa.y, dl = Math.hypot(dx, dy) || 1, nx = -dy / dl * 1.4, ny = dx / dl * 1.4;
    ctx.beginPath(); ctx.moveTo(pa.x + nx + dx * 0.05, pa.y + ny + dy * 0.05); ctx.lineTo(pb.x + nx - dx * 0.05, pb.y + ny - dy * 0.05); ctx.stroke();
    ctx.strokeStyle = '#3b3530'; ctx.lineWidth = 5 * pb.s;
    ctx.beginPath(); ctx.moveTo(pb.x - dx * 0.05, pb.y - dy * 0.05); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    ctx.strokeStyle = c.accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pa.x + dx * 0.1, pa.y + dy * 0.1); ctx.quadraticCurveTo(pa.x + dx * 0.16 + nx * 5, pa.y + dy * 0.16 + ny * 5, pa.x + dx * 0.25 + nx * 2, pa.y + dy * 0.25 + ny * 2); ctx.stroke();
  }


  const JA = {};
  function drawArmScaled(ctx, K, j, front, c, D0, X, wpn, acc, k) {
    for (const key in j) JA[key] = j[key];
    const sh = j.sh, inv = (p) => ({ x: sh.x + (p.x - sh.x) / k, y: sh.y + (p.y - sh.y) / k });
    if (front) { JA.elF = inv(j.elF); JA.haF = inv(j.haF); JA.tip = inv(j.tip); } else { JA.elB = inv(j.elB); JA.haB = inv(j.haB); }
    ctx.save(); ctx.translate(sh.x, sh.y); ctx.scale(k, k); ctx.translate(-sh.x, -sh.y);
    K.drawArm(ctx, JA, front, c, D0, X, wpn, acc);
    ctx.restore();
  }


  D.drawKatana3 = drawKatana3; D.drawSaya3 = drawSaya3; D.drawArmScaled = drawArmScaled;



  D.draw = function (ctx, f, opt) {
    const S = D.pose3d(f);
    if (!S || f.hidden) { f.draw(ctx, false, false); return; }
    D.stats.draws++;
    const K = ND._draw, c = f.col, wpn = f.wpn, acc = f.ch.acc, pr = projector(f, D.cam);
    if (K.setArt) K.setArt(acc);
    sampleTrail(f, S);
    const j = jointsFor(f, S, pr);
    const shF2 = pr(S.shF, W), shB2 = pr(S.shB, -W);

    const jF = Object.assign({}, j, { sh: { x: shF2.x, y: shF2.y } }), jB = Object.assign({}, j, { sh: { x: shB2.x, y: shB2.y } });
    K.updLight();
    const D0 = K.pal(c);
    const X = { ropes: f.ropeList(), wpn, acc, glint: 0 };
    const glint = opt && opt.glintOff ? 0 : f.glint();
    const skip = opt && opt.skipArm;
    const behind = S.P.haF.z < -4;

    const kF = clamp(1 + (pr(S.P.haF, W).s * 0.6 + pr(S.P.elF, W).s * 0.4 - 1) * 1.6, 0.75, 1.5);
    const kB = clamp(1 + (pr(S.P.haB, -W).s - 1) * 1.6, 0.75, 1.4);
    ctx.save();
    if (f.jit > 0) ctx.translate((Math.random() - 0.5) * 5, 0);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    const CO = c.costume && ND.costumeLayer && ND.COSTUMES && ND.COSTUMES[c.costume] ? c.costume : null;
    const swordArm = () => {
      if (S.armed) { if (isKatana(wpn)) drawKatana3(ctx, f, S, pr, c, glint); else drawWeapon2d(ctx, f, S, pr, c, glint, j); }
      if (skip !== 'F') {
        drawArmScaled(ctx, K, jF, true, c, D0, X, wpn, acc, kF);
        if (CO) ND.costumeLayer(CO, 'front', ctx, jF);
      }


      if (skip !== 'B' && farFist()) {
        ctx.save(); ctx.beginPath(); ctx.arc(jB.haB.x, jB.haB.y, 6.2 * kB, 0, TAU); ctx.clip();
        ctx.fillStyle = rimOf(c); ctx.beginPath(); ctx.arc(jB.haB.x, jB.haB.y, 6.2 * kB, 0, TAU); ctx.fill();
        drawArmScaled(ctx, K, jB, false, c, D0, X, wpn, acc, kB);
        ctx.restore();
      }
    };
    const farFist = () => {
      if (S.armed && !S.sheathed && S.grip > 0.5) return true;
      if (!S.armed) return farInFront(j, jB);
      if (!wpn.iai || !S.saya) return false;
      const m = pr(S.saya.a, W);
      return Math.hypot(jB.haB.x - m.x, jB.haB.y - m.y) < 16;
    };

    K.torsoFrame(j);

    if (wpn.iai) drawSaya3(ctx, f, S, pr, c, D0); else if (K.saya && wpn.type !== 'naginata' && wpn.type !== 'bo' && wpn.type !== 'tessen' && wpn.type !== 'kusarigama') K.saya(ctx, j, c, D0, wpn);
    if (CO) ND.costumeLayer(CO, 'back', ctx, j);
    K.drawLeg(ctx, j, false, c, D0);
    if (X.ropes && !(K.kes && K.kes())) for (const r of X.ropes) r.rope.draw(ctx, r.col, r.w, 'rgba(255,255,255,.07)');
    if (skip !== 'B') {
      drawArmScaled(ctx, K, jB, false, c, D0, X, wpn, acc, kB);
      if (CO) ND.costumeLayer(CO, 'backArm', ctx, jB);
    }
    drawTrail(ctx, f, S, pr, false);
    if (behind) swordArm();

    K.torsoFrame(j);
    const TF = K.TF, sp = Math.sin(S.psi), wide = 1 + 0.3 * Math.abs(sp);
    TF.nx *= wide; TF.ny *= wide;
    K.drawTorso(ctx, j, c, D0, acc, behind ? (K.TB.BODY | K.TB.RIM | K.TB.KNOT) : 15);
    if (Math.abs(sp) > 0.02) {
      ctx.save(); ctx.beginPath(); K.torsoPath(ctx); ctx.clip();
      const cxm = (j.hip.x + j.neck.x) * 0.5, cym = (j.hip.y + j.neck.y) * 0.5;
      const ax = cxm + TF.nx * 20, ay = cym + TF.ny * 20, bx = cxm - TF.nx * 20, by = cym - TF.ny * 20;
      const g = ctx.createLinearGradient(ax, ay, bx, by);
      if (sp < 0) {
        const kb = D.backShade || 0.5;
        g.addColorStop(0, `rgba(0,0,0,${(kb * -sp).toFixed(3)})`); g.addColorStop(0.55, `rgba(0,0,0,${(kb * 0.3 * -sp).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      } else {
        g.addColorStop(0, `rgba(255,236,214,${(0.22 * sp).toFixed(3)})`); g.addColorStop(0.6, 'rgba(255,236,214,0)'); g.addColorStop(1, `rgba(0,0,0,${(0.3 * sp).toFixed(3)})`);
      }
      ctx.fillStyle = g; ctx.fillRect(Math.min(ax, bx) - 40, Math.min(ay, by) - 60, Math.abs(ax - bx) + 80, Math.abs(ay - by) + 120);
      ctx.restore();
    }
    if (CO) ND.costumeLayer(CO, 'body', ctx, j);
    K.torsoFrame(j);
    K.neckPart(ctx, j, c, D0, acc);
    K.drawHead(ctx, j, c, D0, CO && ND.COSTUMES[CO].head && !ND.COSTUMES[CO].ownHead ? 'none' : acc);
    if (CO) ND.costumeLayer(CO, 'head', ctx, j);
    K.drawLeg(ctx, j, true, c, D0);
    if (CO) ND.costumeLayer(CO, 'hem', ctx, j);



    if (skip !== 'B' && farInFront(j, jB)) {
      const e = jB.elB, h = jB.haB, ex = e.x + (h.x - e.x) * 0.3, ey = e.y + (h.y - e.y) * 0.3;
      const dx = h.x - ex, dy = h.y - ey, dl = Math.hypot(dx, dy) || 1, r = 9 * kB, nx = (-dy / dl) * r, ny = (dx / dl) * r;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ex + nx, ey + ny); ctx.lineTo(h.x + nx + (dx / dl) * r, h.y + ny + (dy / dl) * r);
      ctx.lineTo(h.x - nx + (dx / dl) * r, h.y - ny + (dy / dl) * r); ctx.lineTo(ex - nx, ey - ny); ctx.closePath();
      ctx.arc(h.x, h.y, r * 1.15, 0, TAU);
      ctx.clip();

      ctx.strokeStyle = rimOf(c); ctx.lineWidth = 12.5 * kB; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(h.x, h.y); ctx.stroke();
      drawArmScaled(ctx, K, jB, false, c, D0, X, wpn, acc, kB);
      if (CO) ND.costumeLayer(CO, 'backArm', ctx, jB);
      ctx.restore();
    }
    if (!behind) swordArm();
    drawTrail(ctx, f, S, pr, true);
    ctx.restore();
  };

  const RIM = new Map();
  function rimOf(c) {
    const k = c.cloth || '#808080';
    let v = RIM.get(k);
    if (!v) {
      const n = parseInt(k.slice(1, 7), 16), l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
      v = l < 0.3 ? 'rgba(176,186,220,.6)' : 'rgba(24,18,26,.5)';
      RIM.set(k, v);
    }
    return v;
  }

  function farInFront(j, jB) {
    let ux = j.neck.x - j.hip.x, uy = j.neck.y - j.hip.y; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    const d = j.dir < 0 ? -1 : 1, nx = -uy * d, ny = ux * d;
    const h = jB.haB, ax = h.x - j.hip.x, ay = h.y - j.hip.y, along = ax * ux + ay * uy;

    return ax * nx + ay * ny > -15 && along > -24 && along < ul + 40;
  }


  D.snap = function (f, o) {
    const S = D.pose3d(f, true);
    if (!S || f.hidden) return null;
    const pr = projector(f, D.cam), j = jointsFor(f, S, pr), wpn = f.wpn || ND.LEN;
    o = o || {};
    for (const k of KEYS) if (j[k]) { const q = o[k] || (o[k] = { x: 0, y: 0 }); q.x = j[k].x; q.y = j[k].y; }
    const H = S.blade.h, u = S.blade.u, e = S.blade.e;
    const h2 = pr(H, W), p2 = pr(add(H, mul(u, -wpn.handle)), W);
    o.hilt = { x: h2.x, y: h2.y }; o.pomm = { x: p2.x, y: p2.y };
    const sy = sayaPose(f, S), sa = pr(sy.a, W), sb = pr(add(sy.a, mul(sy.u, sy.L)), W);
    o.saya = { x: sa.x, y: sa.y }; o.sayaEnd = { x: sb.x, y: sb.y };
    const ob = obiAt(S.P, S.psi, S.nx, S.ny), oq = pr(ob, W); o.obi = { x: oq.x, y: oq.y };
    o.u = { x: u.x, y: u.y, z: u.z }; o.e = { x: e.x, y: e.y, z: e.z };
    o.armed = S.armed; o.sheathed = S.sheathed; o.grip = S.grip || 0; o.dir = S.dir;
    return o;
  };

  D.cameraKick = function (f) {
    const sp = specOf(f);
    if (!sp) return { zoom: 1, sx: 0, sy: 0 };
    const t = f.st, [p0, p1, p2] = sp.push;
    let z = 0;
    if (t > p0 && t < p2) z = t < p1 ? sstep((t - p0) / (p1 - p0)) : 1 - sstep((t - p1) / (p2 - p1));
    let sx = 0, sy = 0;
    if (t > sp.shake[0] && t < sp.shake[1]) { const k = 1 - (t - sp.shake[0]) / (sp.shake[1] - sp.shake[0]); sx = Math.sin(t * 190) * 3.2 * k; sy = Math.cos(t * 230) * 2.2 * k; }
    return { zoom: 1 + 0.07 * z, sx, sy };
  };


  if (D.on && ND.Fighter) {
    const base = ND.Fighter.prototype.draw;
    ND.Fighter.prototype.draw = function (ctx, reflect, layer) {
      if (!reflect && D.active(this)) { D.draw(ctx, this); return; }
      return base.call(this, ctx, reflect, layer);
    };
  }
})(window.ND);
