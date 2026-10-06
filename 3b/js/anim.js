





















(function (ND) {
  'use strict';
  const pose = ND.pose, KEYS = pose.KEYS, L = ND.LEN;
  const TAU = Math.PI * 2;
  const wrap = (a) => a - TAU * Math.round(a / TAU);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const inOutSine = ND.M.ease.inOutSine;
  const WKEYS = ['wFan', 'wFanB', 'wBow', 'wDraw', 'wArrow', 'wCharge', 'wAmmo', 'wSheath', '_vs', '_px'];
  const RKEYS = ['hip', 'neck', 'sh', 'head', 'elF', 'haF', 'tip', 'pom', 'elB', 'haB', 'knF', 'ftF', 'knB', 'ftB'];

  const HEAD_R = { kasa: 21, kabuto: 17, oni: 16, hood: 15.5, tora: 15.5 };

  const NO_CLEAR = { tessen: 1, yumi: 1 };
  const GROUND = -2;

  const off = typeof location !== 'undefined' && /[?&]anim=0(&|$)/.test(location.search || '');
  const A = ND.anim = { on: !off };

















  A.m = { feet: true, idle: true, overlap: true, walk: true, chain: true, edge: true, settle: true, trail: true, grip: true, iai: true, clash: true, meet: true };
  {
    const q = typeof location !== 'undefined' && /[?&]motion=([^&#]*)/.exec(location.search || '');
    if (q) { const on = decodeURIComponent(q[1]).split(','); for (const k in A.m) A.m[k] = on.includes(k); }
  }

  function mk(f) {
    return {
      p: pose.copy(f.pose), prevT: pose.copy(f.pose), from: pose.copy(f.pose), pa: {}, pb: {}, lj: {}, lt: {},
      j: {}, rox: 0, roy: 0, rpx: NaN, rpy: NaN, sk: null, sl4: null, ed: 1, cb: 0, cbv: 0, cbs: f.state, cbn: f.serial, pw: 0, psw: NaN, tx: NaN, ty: NaN, tvx: 0, tvy: 0, shw: 1, sht: 0, cok: false, mw: 0, mt: null, iw: 0, ov: [0, 0, 0, 0], ovi: false, ovs: f.state, ovn: f.serial, ow: 0, wb: 0, ft: null, fpx: NaN, cu: 0, cuDur: 0, gw: 1, gp: NaN, gv: 0, gs: 1, gsb: 1, wc: null, wch: null, sy: [0, 0, 0], sv: [0, 0, 0], sx: [0, 0, 0], sinit: false, ws: 0, sl: [0, 0], slv: [0, 0], sla: [NaN, NaN], prevState: f.state, prevSerial: f.serial, ok: false, stamp: -1, chain: null,
    };
  }



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

  const ARC = { x: 0, y: 0 };
  function arcFix(a, b, e, cap) {
    ARC.x = 0; ARC.y = 0;
    const ra = Math.hypot(a.ax, a.ay), rb = Math.hypot(b.ax, b.ay);
    if (ra < 14 || rb < 14) return ARC;


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

  const PEN = { d: 0, nx: 0, ny: 0 };
  function headPen(p, wpn, R, lj) {
    PEN.d = 0;
    ND.solve(p, 0, 0, 1, lj, wpn);
    const hx = lj.head.x, hy = lj.head.y, ax = lj.haF.x, ay = lj.haF.y;
    if (Math.hypot(ax - hx, ay - hy) < R + 2) return PEN;
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
      if (cap) {
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







  const WEIGHT = {
    heavy: { f: 4.4, z: 0.32, zs: 0.62, rec: 1.55, sw: 0.6, px: 16, ck: 1.2 },
    mid: { f: 8.5, z: 0.5, zs: 0.7, rec: 1, sw: 0.3, px: 9, ck: 1 },
    light: { f: 15, z: 0.72, zs: 0.8, rec: 0.55, sw: 0.14, px: 5, ck: 0.8 },
  };
  function weightOf(f) {
    const w = f.wpn, t = w.type;
    if (t === 'naginata' || t === 'bo' || (w.blade || 0) >= 120) return WEIGHT.heavy;
    if (w.twin || t === 'kusarigama' || (w.blade || 96) <= 72) return WEIGHT.light;
    return WEIGHT.mid;
  }
  const SPK = ['sw', 'ax', 'ay'];
  const CONTACT = { parry: 1, block: 1, lock: 1, clash: 1, shove: 1 };



  const GRIP_OFF = { tessen: 1, kusarigama: 1, yumi: 1 };


  function gripSlide(D, wpn, lj, end) {
    ND.solve(D, 0, 0, 1, lj, wpn);
    const sx = lj.sh.x - 3, sy = lj.sh.y + 1, ux = Math.cos(D.sw), uy = Math.sin(D.sw), hx = lj.haF.x, hy = lj.haF.y;
    const r = L.uArm + L.fArm - 1.5, t0 = end ? Math.max(wpn.handle * 0.55, wpn.handle - 5.5) : wpn.handle * 0.55;
    if (Math.hypot(hx - ux * t0 - sx, hy - uy * t0 - sy) <= r) {
      if (end) { D.gx = hx - ux * t0 - lj.sh.x; D.gy = hy - uy * t0 - lj.sh.y; D.grip = 0; }
      return;
    }
    const wx = hx - sx, wy = hy - sy, wu = wx * ux + wy * uy, disc = wu * wu - (wx * wx + wy * wy) + r * r;
    if (disc < 0) return;
    const q = Math.sqrt(disc), lo = 8, hi = Math.max(lo, wpn.handle);
    let best = null;
    for (const t of [wu - q, wu + q]) if (t >= lo && t <= hi && (best === null || Math.abs(t - t0) < Math.abs(best - t0))) best = t;
    if (best === null) return;
    D.gx = hx - ux * best - lj.sh.x; D.gy = hy - uy * best - lj.sh.y; D.grip = 0;
  }





  function idleBody(S, f, D, dt, hold) {
    if (!hold) {
      const still = f.state === 'move' && f.onGround && Math.abs(f.vx) < 25 && (f.walkBlend || 0) < 0.15 && !f.roll && !(f.lockW && f.lockW() > 0);
      S.iw = still ? Math.min(1, S.iw + dt / 0.6) : Math.max(0, S.iw - dt / 0.1);
    }
    const w = S.iw * S.iw * (3 - 2 * S.iw);
    if (!(w > 0)) return;
    const t = ((ND.scene && ND.scene.t) || 0) + (f.id || 0), hv = S.wc === WEIGHT.heavy ? 1.25 : 1;

    const b = Math.sin(t * 2.3), bh = Math.sin(t * 2.3 + 0.6), s = Math.sin(t * 0.9 + 1.1);
    D.hy += (b * 1.9 + Math.abs(s) * 1.6) * w * hv;
    D.hx += s * 3.4 * w;
    D.lean += b * 0.03 * w;
    D.hd -= b * 0.02 * w;
    D.ay += bh * 1.6 * w; D.sw += bh * 0.03 * w;
  }





  const OVL = { f: 4.2, z: 0.4, cap: 0.1 }, OVH = { f: 3.0, z: 0.32, cap: 0.24 };
  const OV_KICK = { hurt: 1, stagger: 1.3, gbreak: 1.1, block: 0.45, recoil: 0.7, clash: 0.5 };
  function overlap(S, f, D, dt, hold, contact) {
    const Y = S.ov, x0 = D.lean, x1 = D.lean + D.hd;
    if (!S.ovi || f.roll) { Y[0] = x0; Y[1] = 0; Y[2] = x1; Y[3] = 0; S.ovi = true; S.ow = 0; }
    if (!hold) {


      if (f.state !== S.ovs || f.serial !== S.ovn) {
        const k = OV_KICK[f.state] || 0;
        if (k) { Y[1] -= 2.6 * k; Y[3] -= 5.5 * k; }
        S.ovs = f.state; S.ovn = f.serial;
      }
      const h = Math.min(dt, 1 / 60);
      for (const [i, x, P] of [[0, x0, OVL], [2, x1, OVH]]) {
        const om = TAU * P.f;
        Y[i + 1] += (om * om * (x - Y[i]) - 2 * P.z * om * Y[i + 1]) * h; Y[i] += Y[i + 1] * h;

        const cap = P.cap * 1.6;
        if (Y[i] - x > cap) { Y[i] = x + cap; Y[i + 1] = Math.min(Y[i + 1], 0); } else if (x - Y[i] > cap) { Y[i] = x - cap; Y[i + 1] = Math.max(Y[i + 1], 0); }
      }
      const tw = contact ? 0 : 1;
      S.ow = tw < S.ow ? Math.max(tw, S.ow - dt / 0.03) : Math.min(tw, S.ow + dt / 0.08);
    }
    const o0 = clamp(Y[0] - x0, -OVL.cap, OVL.cap) * S.ow, o1 = clamp(Y[2] - x1, -OVH.cap, OVH.cap);
    D.lean += o0; D.hd += o1 - o0;
  }





  function walkBody(S, f, D, dt, hold) {
    const wb = clamp(f.state === 'move' && f.onGround && !f.roll ? (f.walkBlend || 0) : 0, 0, 1);
    if (!hold) S.wb += (wb - S.wb) * Math.min(1, dt / 0.06);
    const w = S.wb;
    if (!(w > 0.01)) return;
    const ph = (f.gait || 0) * TAU, sp = clamp(Math.abs(f.vx) / 255, 0, 1.3), fw = f.vx * f.dir >= 0 ? 1 : -0.6;
    const c2 = Math.cos(2 * ph);
    D.hy += (c2 * 3.2 - 0.5) * w * sp;
    D.lean += (0.05 * fw + 0.02 * c2) * w * sp;
    D.hd += -0.035 * c2 * w * sp - 0.03 * fw * w * sp;
    D.ay += Math.sin(2 * ph) * 2.2 * w * sp; D.sw += Math.sin(2 * ph + 0.6) * 0.03 * w * sp;
  }





  const FT_TH = 11, FT_REACH = L.thigh + L.shin - 4;
  const mkFoot = () => ({ m: 0, x: 0, y: 0, ox: 0, oy: 0, sx: 0, u: 0, dur: 0.1, lift: 4, tv: 0, ptx: NaN });
  function feet(S, f, D, dt, hold) {
    const dir = f.dir * (f.vdir ?? 1);
    const ok = Math.abs(dir) > 0.97 && !f.roll;
    const ft = S.ft || (S.ft = [mkFoot(), mkFoot()]);
    const hx = f.x + D.hx * dir, hy = f.y + D.hy;

    if (!hold) {
      if (S.fpx === S.fpx && Math.abs(f.x - S.fpx) > 50) for (const F of ft) { F.m = 0; F.ox = F.oy = 0; F.tv = 0; F.ptx = NaN; }
      S.fpx = f.x;
    }
    for (let k = 0; k < 2; k++) {
      const kx = k ? 'f2x' : 'f1x', ky = k ? 'f2y' : 'f1y', F = ft[k], O = ft[1 - k];
      const tx = f.x + D[kx] * dir, ty = f.y + D[ky];
      if (!hold) {
        if (F.ptx === F.ptx) F.tv += ((tx - F.ptx) / Math.max(dt, 1e-4) - F.tv) * Math.min(1, dt / 0.05);
        F.ptx = tx;
      }
      let x, y;
      if (!ok || !(ty > -1.5)) {
        if (F.m !== 0) { F.ox = F.x - tx; F.oy = F.y - ty; F.m = 0; }
        if (!hold) { const q = Math.exp(-dt * (f.y < -1 ? 40 : 26)); F.ox *= q; F.oy *= q; }
        x = tx + F.ox; y = ty + F.oy;

        const lx = x - hx, ly = y - hy, ld = Math.hypot(lx, ly);
        const rr = Math.max(FT_REACH, Math.hypot(tx - hx, ty - hy));
        if (ld > rr && ok) { const q2 = rr / ld; x = hx + lx * q2; y = hy + ly * q2; F.ox = x - tx; F.oy = y - ty; }
      } else {
        if (F.m === 0) { F.m = 1; F.x = Math.abs(F.ox) < 40 ? tx + F.ox : tx; F.ox = F.oy = 0; }
        if (F.m === 1) {
          const err = tx - F.x, far = Math.hypot(F.x - hx, hy) > Math.max(FT_REACH, Math.hypot(tx - hx, hy) + 3);
          if (Math.abs(err) > 160) F.x = tx;
          else if (!hold && (Math.abs(err) > FT_TH || far) && (O.m !== 2 || O.u > 0.5 || Math.abs(err) > 2.4 * FT_TH || far)) {
            F.m = 2; F.u = 0; F.dur = clamp(0.065 + Math.abs(err) / 1500, 0.065, 0.12); F.lift = clamp(Math.abs(err) * 0.25, 3, 9);
          }
        }
        if (F.m === 2) {


          const gx = tx + clamp(F.tv * F.dur * 0.5, -24, 24);
          if (!hold) { F.u += dt / F.dur; F.x += (gx - F.x) * Math.min(1, dt / ((1 - Math.min(1, F.u)) * F.dur + 0.025)); }
          const gap = Math.abs(gx - F.x), near = gap < 2, u = near ? Math.min(1, F.u) : Math.min(0.6, F.u);
          if (!hold) F.lift = Math.max(F.lift, Math.min(10, gap * 0.25));
          y = Math.min(ty, -Math.sin(Math.PI * u) * F.lift);
          if (F.u >= 1 && near) { F.m = 1; F.x = gx; }
        }
        x = F.x;
        if (F.m === 1) y = Math.min(ty, 0);
      }
      F.y = y; if (F.m === 0) F.x = x;

      if (ok) D[kx] = (x - f.x) / dir; else D[kx] += F.ox * (dir < 0 ? -1 : 1);
      D[ky] = y - f.y;
    }
  }


  const NONE = [];
  const sstep = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));


  function strikes(S, at, keys) {
    if (S.sk === keys) return S.sl4;
    S.sk = keys;
    const out = (S.sl4 = []);
    if (!at || at.kind !== 'blade' || !keys || keys.length < 2) return out;
    const W = at.hits || (at.active ? [at.active] : []);
    for (const h of W) {
      let m = 1;
      while (m < keys.length && keys[m][0] <= h[0] + 0.005) m++;
      for (let k = m; k < Math.min(m + 2, keys.length); k++) {
        const a = keys[k - 1], b = keys[k];
        if (!a[1] || !b[1]) continue;
        const d = b[1].sw - a[1].sw;
        if (Math.abs(d) >= 0.6 && b[0] - a[0] <= 0.2) {

          out.push({ t0: a[0], t1: b[0], d, s: d > 0 ? 1 : -1, A: a[1], B: b[1], e: b[2] || inOutSine, h0: h[0], sh: !!(at.sheath && at.sheath[1] >= a[0] - 0.01), sn: 0.08 });
          break;
        }
      }
    }

    const CB = ND.POSES && ND.POSES.chiburi;
    for (let k = 1; CB && k < keys.length; k++) {
      const a = keys[k - 1], b = keys[k];
      if (b[1] !== CB || !a[1] || a[1] === CB) continue;
      const d = b[1].sw - a[1].sw;
      if (Math.abs(d) >= 0.3) out.push({ t0: a[0], t1: b[0], d, s: d > 0 ? 1 : -1, A: a[1], B: b[1], e: b[2] || inOutSine, h0: 1e9, sh: true, sn: 0.15 });
    }
    out.sort((p, q) => p.t0 - q.t0);
    return out;
  }




  function chainCut(list, t, D, W, blade) {
    for (const k of list) {
      const c = Math.min(0.045 + 0.02 * W.ck, k.t0), ta = k.t0 - c;
      if (t < ta || t > k.t1 + 0.08) continue;
      if (t > k.t1) {
        const v = (t - k.t1) / 0.08;
        D.sw += k.s * k.sn * Math.sin(Math.PI * v) * (1 - v);
        return;
      }
      if (k.sh) return;
      const Lm = Math.min(0.26 * W.ck * Math.min(1, Math.abs(k.d) / 1.5), 24 / blade), p0 = 0.16;
      let q, e = 0;
      if (t < k.t0) q = sstep((t - ta) / c);
      else { const u = (t - k.t0) / Math.max(1e-4, k.t1 - k.t0); q = 1 - sstep(u); e = k.e(u); }
      D.sw -= k.s * Lm * q;
      const g = p0 * q * (1 - e);
      D.hx += (k.B.hx - k.A.hx) * g; D.hy += (k.B.hy - k.A.hy) * g; D.lean += (k.B.lean - k.A.lean) * g;
      return;
    }
  }



  const NO_EDGE = { bo: 1, kusarigama: 1, tessen: 1 };
  function edgeTarget(list, t) { for (const k of list) if (t < k.t1 + 0.06) return k.s; return 1; }
  const edgeQ = (e) => { const m = Math.abs(e); return (e < 0 ? -1 : 1) * (m > 0.8 ? 1 : m > 0.45 ? 0.62 : 0.3); };



  const CLASH = { recoil: 1, block: 0.8, clash: 1, parry: 0.6, lock: 1 };
  function clash(S, f, D, dt, hold) {
    if (!hold) {
      if (f.state !== S.cbs || f.serial !== S.cbn) {
        const k = CLASH[f.state];
        if (k) {
          let sg = 0;

          if (f.state === 'recoil' || Math.abs(S.pw) > 3) sg = -Math.sign(S.pw);
          else {
            const F = ND.game && ND.game.F, o = F ? (F[0] === f ? F[1] : F[0]) : null, O = o && o._anim, j = S.j;
            if (O && O.ok && j.tip && j.haF) { const rx = j.tip.x - j.haF.x, ry = j.tip.y - j.haF.y; sg = Math.sign(rx * O.tvy - ry * O.tvx) * (f.dir < 0 ? -1 : 1); }
          }
          if (sg) S.cbv += sg * k * 12;
        }
        S.cbs = f.state; S.cbn = f.serial;
      }
      const h = Math.min(dt, 1 / 60), om = TAU * 6;
      S.cbv += (-om * om * S.cb - 2 * 0.5 * om * S.cbv) * h; S.cb = clamp(S.cb + S.cbv * h, -0.3, 0.3);
    }
  }



  const IAI = { fs: 1 };
  function iaiDraw(at, list, t, D) {
    IAI.fs = 1;
    if (!at || !at.sheath || !list.length) return IAI;
    const k = list[0], ts = at.sheath[1], ta = k.h0;
    if (!k.sh || k.h0 > 1e8 || !(ta - ts > 0.005) || t <= ts || t >= ta) return IAI;
    const a = k.A.sw, b = k.A.sw + k.d * k.e(clamp((ta - k.t0) / Math.max(1e-4, k.t1 - k.t0), 0, 1));
    const ph = Math.PI * clamp((t - ts) / (ta - ts), 0, 1), w0 = (1 + Math.cos(ph)) / 2, w1 = 1 - w0;
    const xa = Math.cos(a), ya = Math.sin(a), xb = Math.cos(b), yb = Math.sin(b);
    const x = xa * w0 + xb * w1, y = ya * w0 + yb * w1, z = Math.sin(ph) * (Math.abs(xa) + Math.abs(xb)) / 2;
    const r = Math.hypot(x, y);
    D.sw = Math.atan2(y, x) + TAU * Math.round((D.sw - Math.atan2(y, x)) / TAU);
    IAI.fs = clamp(r / Math.hypot(r, z), 0.2, 1);
    return IAI;
  }




  const SAYA_DRAW = 0.07, SAYA_SET = 0.3, NOTO = 0.17, PULL = 12, PRE = 24;
  function sayaRest(j, o) {
    let ux = j.neck.x - j.hip.x, uy = j.neck.y - j.hip.y; const ln = Math.hypot(ux, uy) || 1; ux /= ln; uy /= ln;
    const nx = j.dir * -uy, ny = j.dir * ux;
    let tx = -0.955 * j.dir, ty = 0.296; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    o[0] = j.hip.x + ux * 5 + nx * 13; o[1] = j.hip.y + uy * 5 + ny * 13; o[2] = tx; o[3] = ty;
    return o;
  }
  function sayaSheathed(j, o) {
    const dx = j.tip.x - j.haF.x, dy = j.tip.y - j.haF.y, dl = Math.hypot(dx, dy) || 1;
    o[0] = j.haF.x + (dx / dl) * 2; o[1] = j.haF.y + (dy / dl) * 2; o[2] = dx / dl; o[3] = dy / dl;
    return o;
  }
  const SR = [0, 0, 0, 0], SH = [0, 0, 0, 0], JK = ['hip', 'neck', 'haF', 'tip'];


  function saya(S, j, dt, hold, pre) {
    const P = S.prevJ || (S.prevJ = { hip: { x: 0, y: 0 }, neck: { x: 0, y: 0 }, haF: { x: 0, y: 0 }, tip: { x: 0, y: 0 }, dir: 1, ok: false });
    const sh = j.wSheath ? 1 : 0, cur = S.saya || (S.saya = [0, 0, 0, 0]), from = S.sayaF || (S.sayaF = [0, 0, 0, 0]);
    j.wSaya = null; j.wNoto = 0;
    if (!hold) {
      if (sh !== S.shw) {

        if (S.cok) for (let i = 0; i < 4; i++) from[i] = cur[i];
        else if (P.ok) (S.shw ? sayaSheathed : sayaRest)(P, from);
        S.sht = S.cok || P.ok ? 1e-4 : 0; S.shw = sh;
      } else if (S.sht > 0) S.sht += dt;
      for (const k of JK) { P[k].x = j[k].x; P[k].y = j[k].y; }
      P.dir = j.dir; P.ok = true;
    }
    const T = S.sht;
    let placed = false;
    if (T > 0 && T < (sh ? NOTO : SAYA_DRAW + SAYA_SET)) {
      const to = sh ? sayaSheathed(j, SH) : sayaRest(j, SR);
      let k, back = 0;
      if (sh) k = outCubic(T / NOTO);
      else { k = outCubic(Math.min(1, T / SAYA_DRAW)); back = PULL * (T < SAYA_DRAW ? k : 1 - sstep((T - SAYA_DRAW) / SAYA_SET)); }
      let tx = from[2] + (to[2] - from[2]) * k, ty = from[3] + (to[3] - from[3]) * k; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      cur[0] = from[0] + (to[0] - from[0]) * k + tx * back; cur[1] = from[1] + (to[1] - from[1]) * k + ty * back; cur[2] = tx; cur[3] = ty;
      placed = true;
    } else {
      if (T > 0 && !hold) S.sht = 0;
      if (!sh && pre > 0.3) { sayaRest(j, cur); cur[0] += cur[2] * pre; cur[1] += cur[3] * pre; placed = true; }
    }
    S.cok = placed;
    if (!placed) return;
    j.wSaya = cur;
    if (sh) {
      const dx = j.tip.x - j.haF.x, dy = j.tip.y - j.haF.y, dl = Math.hypot(dx, dy) || 1;
      const x = ((cur[0] - j.haF.x) * dx + (cur[1] - j.haF.y) * dy) / dl;
      j.wNoto = x > 2.5 ? Math.min(x, dl) : 0;
    }
  }








  const MP = {}, MJ = {}, MT = { ok: false, sw: 0, ax: 0, ay: 0, x: 0, y: 0 };
  const segSeg = ND.M.segSeg;
  function lungeAt(o, a, t0, t1) {
    const L = a.lunge;
    if (!L || !o.onGround) return 0;
    const ov = Math.max(0, Math.min(t1, L[1]) - Math.max(t0, L[0]));
    return (ov * L[2]) / Math.max(0.2, o.ch.spd * (o.aspd || 1));
  }
  function contactAhead(f, o) {
    const a = o.atk, W = a.hits ? a.hits[Math.max(0, o.hitIdx)] || a.hits[0] : a.active;
    if (!W || o.st > W[1]) return null;
    const t0 = Math.max(o.st, W[0] - 0.01), keys = o.keys, j = f.j;
    if (!keys || !j.haF || !j.tip) return null;
    const hb = ND.hurtboxes(j);
    for (let k = 0; k <= 8; k++) {
      const t = t0 + ((W[1] - t0) * k) / 8;
      pose.seq(keys, t, MP);
      const gap = Math.abs(f.x - o.x) < 70 ? 0.2 : 1;
      ND.solve(MP, o.x + o.dir * lungeAt(o, a, o.st, t) * gap, o.y, o.dir, MJ, o.wpn);
      let r = segSeg(MJ.haF.x, MJ.haF.y, MJ.tip.x, MJ.tip.y, j.haF.x, j.haF.y, j.tip.x, j.tip.y);
      if (r.d >= 12) { r = null; for (const h of hb) { const q = segSeg(MJ.haF.x, MJ.haF.y, MJ.tip.x, MJ.tip.y, h[0], h[1], h[2], h[3]); if (q.d < h[4] + 2) { r = q; break; } } }
      if (r) return { x: r.x, y: r.y, ang: Math.atan2(MJ.tip.y - MJ.haF.y, MJ.tip.x - MJ.haF.x), thrust: !!a.thrust };
    }
    return null;
  }

  function meetTarget(f, C, D, lj) {
    const dir = f.dir < 0 ? -1 : 1, BL = f.wpn.blade || L.blade;
    const cx = (C.x - f.x) * dir, cy = C.y - f.y;
    ND.solve(D, 0, 0, 1, lj, f.wpn);
    const h = cy - lj.sh.y;
    const ta = Math.atan2(Math.sin(C.ang), Math.cos(C.ang) * dir);
    const near = (want, lo, hi) => {
      let best = 0, bd = 1e9;
      for (const s of [ta + Math.PI / 2, ta - Math.PI / 2]) { const v = want + wrap(s - want), d = Math.abs(v - want); if (d < bd) { bd = d; best = v; } }
      return clamp(best, lo, hi);
    };
    const level = Math.abs(Math.sin(ta)) < 0.4;
    const sw = h < -25 ? near(-0.75, -0.95, -0.6)
      : h < (C.thrust ? 15 : 35) ? (C.thrust || level ? -1.05 : near(-1.4, -1.9, -0.95))
      : C.thrust ? 1.3 : near(1.55, 1.1, 2.0);
    const ux = Math.cos(sw), uy = Math.sin(sw), wx = cx - lj.sh.x, wy = cy - lj.sh.y, R = L.uArm + L.fArm - 2;

    const wu = (wx * ux + wy * uy) / BL, disc = wu * wu - (wx * wx + wy * wy - R * R) / (BL * BL);
    let kc = clamp(wu, 0.2, 0.85);
    if (disc >= 0) { const q = Math.sqrt(disc); kc = clamp(0.5, Math.max(0.2, wu - q), Math.min(0.85, wu + q)); }

    const fx0 = (wx - 10) / BL;
    if (ux > 0.05) kc = Math.max(0.15, Math.min(kc, fx0 / ux)); else if (ux < -0.05) kc = Math.min(0.9, Math.max(kc, fx0 / ux));
    MT.sw = sw; MT.ax = cx - ux * BL * kc - lj.sh.x; MT.ay = cy - uy * BL * kc - lj.sh.y; MT.x = C.x; MT.y = C.y; MT.ok = true;
    return MT;
  }
  function meet(S, f, D, dt, hold) {
    const F = ND.game && ND.game.F, o = F ? (F[0] === f ? F[1] : F[0]) : null;
    const g = f.state === 'guard' || f.state === 'block';
    const T = S.mt || (S.mt = { sw: 0, ax: 0, ay: 0, ok: false });
    if (!hold) {
      let tw = 0;
      if (g && o && !o.dead && f.guardingFrom(o)) {
        if (o.state === 'atk' && o.atk && o.atk.kind === 'blade' && f.state === 'guard') {
          const W = o.atk.hits ? o.atk.hits[Math.max(0, o.hitIdx)] || o.atk.hits[0] : o.atk.active;
          if (W && o.st > W[0] - 0.2 && o.st <= W[1]) {
            const C = contactAhead(f, o);
            if (C) { const M = meetTarget(f, C, D, S.lj); T.sw = M.sw; T.ax = M.ax; T.ay = M.ay; T.ok = true; tw = sstep((o.st - (W[0] - 0.16)) / 0.13); }
          }
        } else if (f.state === 'block' && T.ok) tw = 1;
      }
      if (!tw && S.mw < 0.01) T.ok = false;

      const out = g ? 0.16 : 0.05;
      S.mw = tw > S.mw ? Math.min(tw, S.mw + dt / 0.05) : Math.max(tw, S.mw - dt / out);
    }
    const w = S.mw;
    if (!(w > 0) || !T.ok) return;
    const k = w * w * (3 - 2 * w);
    D.sw += (T.sw + TAU * Math.round((D.sw - T.sw) / TAU) - D.sw) * k;
    D.ax += (T.ax - D.ax) * k; D.ay += (T.ay - D.ay) * k;
    if (D.grip < 0.9 && !f.wpn.twin) D.grip += (1 - D.grip) * k;
  }


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















  const SWING = { on: !(typeof location !== 'undefined' && /[?&]swing=0(&|$)/.test(location.search || '')), lead: 6, min: 3, share: 0.6 };
  A.SWING = SWING;
  const ARMK = ['sw', 'ax', 'ay'];
  const SP = {}, SJ = {}, SJ0 = {}, STO = {};

  function stepMt(f) {
    const G = ND.game;
    return (G ? G.STEP * (G.tz || 1) * (G.slow || 1) : 1 / 120) * (f.ch.spd || 1) * (f.aspd || 1);
  }



  const LAND = { t: 0, tx: 0 };
  function landAt(f, k, mt) {
    const o = f.opp, a = f.atk, keys = f.keys;
    if (!o || o.dead || o.hidden || !keys || !a || !(mt > 0) || (o.isInv && o.isInv())) return null;
    const W = a.hits ? a.hits[0] : a.active;
    if (!W) return null;
    const hb = ND.hurtboxes(o.j), og = o.wpn && o.wpn.dual && o.j.pom ? o.j.pom : o.j.haF;
    const guard = o.state === 'guard' || o.state === 'block' || o.state === 'parry';
    const gap = Math.abs(o.x - f.x) < 70 ? 0.2 : 1;


    let t = Math.max(f.st - mt, W[0] - 2 * mt), have = false, px = 0, py = 0, qx = 0, qy = 0;
    for (let i = 0; i < 90 && t + mt <= W[1] + 1e-6; i++, t += mt) {
      pose.seq(keys, t, SP);
      ND.solve(SP, f.x + f.dir * lungeAt(f, a, f.st, t) * gap, f.y, f.dir, SJ, f.wpn);
      const hx = SJ.haF.x, hy = SJ.haF.y, tx = SJ.tip.x, ty = SJ.tip.y;
      if (have && t + mt >= W[0] - 1e-6) {
        for (let s = 1; s <= 4; s++) {
          const u = s / 4, ax = px + (hx - px) * u, ay = py + (hy - py) * u, bx = qx + (tx - qx) * u, by = qy + (ty - qy) * u;
          let hit = guard && o.j.tip && segSeg(ax, ay, bx, by, og.x, og.y, o.j.tip.x, o.j.tip.y).d < 10;
          if (!hit) for (const h of hb) if (segSeg(ax, ay, bx, by, h[0], h[1], h[2], h[3]).d < h[4]) { hit = true; break; }
          if (hit) { LAND.t = t + mt; LAND.tx = t - mt + mt * u; return LAND; }
        }
      }
      px = hx; py = hy; qx = tx; qy = ty; have = true;
    }
    return null;
  }

  function nextCut(list, t) { for (const k of list) if (k.h0 < 1e8 && t <= k.t1 + 0.02) return k; return null; }

  function swing(S, f, D, T, list, hold) {
    const at = f.state === 'atk' ? f.atk : null;


    const fin = ND.duel && ND.duel.finOf && ND.duel.finOf(f);
    const k = SWING.on && at && at.kind === 'blade' && !f.wpn.twin && !at.zone && !fin ? nextCut(list, f.st) : null;
    let P = S.swg;
    S.swgT = null;
    if (!k) { S.swg = null; return false; }
    if (!P || P.ser !== f.serial || P.k !== k) {
      if (hold) return false;
      P = S.swg = { ser: f.serial, k, st: 'wait', ts: 0, tc: 0, n: 0, from: {}, to: {}, d: 0 };
    }
    const mt = stepMt(f), fr = 2 * mt;
    if (P.st === 'wait') {
      if (!hold) {

        const tl = landAt(f, k, mt);
        P.tc = tl ? tl.t : k.t1; P.tx = tl ? tl.tx : k.t1;

        const CC = ND.duel && ND.duel.chor && ND.duel.chor.cur;
        if (CC && CC.final && CC.A === f && CC.fin && CC.fin.st > 0 && CC.fin.st < P.tc) { P.tc = P.tx = CC.fin.st; }


        pose.seq(f.keys, P.tc, STO);

        const tw2 = A.swingTurns ? A.swingTurns(f) : null;
        const back = tw2 ? tw2[0] : Math.abs(k.A.sw - f.keys[0][1].sw), fwd = (tw2 ? tw2[1] : Math.abs(STO.sw - k.A.sw)) + 0.3;
        const n = Math.max(SWING.min, Math.min(SWING.lead, Math.round((P.tc / fr) * (fwd / (fwd + back)))));
        P.n = n; P.ts = Math.min(k.t0, P.tc - n * fr);
      }
      if (f.st + mt * 0.5 < P.ts) {


        if (P.ts < k.t0 && P.ts > 0) {

          let tw = k.t0;
          for (let i = 1; i < f.keys.length; i++) if (f.keys[i][0] === k.t0 && f.keys[i - 1][1] === f.keys[i][1]) tw = f.keys[i - 1][0];
          S.swgT = Math.min(tw, (f.st * tw) / P.ts);
          pose.seq(f.keys, S.swgT, STO);
          for (const q of ARMK) D[q] += STO[q] - T[q];


        }
        return false;
      }
      if (hold) return false;

      P.st = 'go'; P.ts = f.st;
      for (const q of ARMK) P.from[q] = S.lastD ? S.lastD[q] : D[q];
      pose.seq(f.keys, P.tx, STO);
      for (const q of ARMK) P.to[q] = STO[q];


      ND.solve(STO, 0, 0, 1, SJ0, f.wpn);
      P.toJ = { sh: [SJ0.sh.x, SJ0.sh.y], ha: [SJ0.haF.x, SJ0.haF.y], tip: [SJ0.tip.x, SJ0.tip.y] };


      const ref = P.ref = P.to.sw - k.A.sw;
      let d = P.to.sw - P.from.sw;
      d += TAU * Math.round((ref - d) / TAU);
      P.d = d;
    }
    if (P.st !== 'go' && P.st !== 'land') return false;

    if (!hold && f.st >= P.tc + mt * 0.5) { P.st = 'done'; return false; }

    const G = ND.game;
    if (!hold && G && G.hitstopT > 0 && f.st < P.tc - mt * 0.5) { P.st = 'done'; S.swgCatch = true; return false; }
    if (f.st >= P.tc - mt * 0.5) P.st = 'land';
    const u = clamp((f.st - P.ts) / Math.max(1e-4, P.tc - P.ts), 0, 1), e = u * (0.7 + 0.3 * u);
    S.swgT = k.t0 + (P.tc - k.t0) * e;
    D.sw = P.from.sw + P.d * e;

    const ra = Math.hypot(P.from.ax, P.from.ay), rb = Math.hypot(P.to.ax, P.to.ay);
    if (ra > 8 && rb > 8) {
      const ta = Math.atan2(P.from.ay, P.from.ax), dt0 = wrap(Math.atan2(P.to.ay, P.to.ax) - ta);
      const r = ra + (rb - ra) * e, th = ta + dt0 * e;
      D.ax = Math.cos(th) * r; D.ay = Math.sin(th) * r;
    } else { D.ax = P.from.ax + (P.to.ax - P.from.ax) * e; D.ay = P.from.ay + (P.to.ay - P.from.ay) * e; }
    return true;
  }
  A.landAt = landAt;




  A.present = function (f, dt, hold, rj) {
    const S = f._anim || (f._anim = mk(f));
    S.stamp = ND.simClock;

    if (!hold && S.ok && S.j.hip) { copyJ(S.j, S.jp || (S.jp = {})); S.jpClk = S.jClk; }
    if (!hold) S.jClk = ND.simClock;
    if (f.dead || !A.on) { S.ok = false; if (!hold) f.cloth(rj || f.j, dt); return; }
    const T = f.pose, D = S.p, G = ND.game;
    if (!hold) {

      const changed = f.state !== S.prevState || f.serial !== S.prevSerial;
      const jump = poseJump(T, S.prevT);
      if (S.ok && jump > 0.75 && (changed || (G && G.hitstopT > 0))) {
        pose.copy(D, S.from);
        S.from.sw += TAU * Math.round((T.sw - S.from.sw) / TAU);
        S.cu = 0; S.cuDur = G && G.hitstopT > 0 ? Math.min(0.04, G.hitstopT * 0.6) : 0.05;
      }
      S.prevState = f.state; S.prevSerial = f.serial;
      pose.copy(T, S.prevT);

      if (S.ok) S.lastD = pose.copy(D, S.lastD || {});
    }
    pose.copy(T, D);
    if (f.state === 'win' && ND.flair) ND.flair.winPose(f, D);
    const M = A.m;

    const at = f.state === 'atk' ? f.atk : null;
    const act = !!at && !!(at.hits ? at.hits.some((h) => f.st >= h[0] - 0.02 && f.st <= h[1] + 0.02) : at.active && f.st >= at.active[0] - 0.02 && f.st <= at.active[1] + 0.02);
    const keys = f.state === 'atk' ? f.keys : f.state === 'parry' ? f.pk : null;
    let sg = keys ? segAt(keys, f.st) : null;
    if (S.wch !== f.ch) { S.wch = f.ch; S.wc = weightOf(f); }
    const W = S.wc;

    const fl = f.state === 'atk' ? flowAt(keys, f.st, act, f.wpn.blade || L.blade) : null;
    if (fl) {
      for (const q of KEYS) D[q] += lerpP(fl.A, fl.B, fl.C, fl.pd, q) - lerpP(fl.A, fl.B, fl.C, fl.ps, q);
      SEG.a = fl.a; SEG.b = fl.b; SEG.e = fl.e; sg = SEG;
    } else if (sg && at && keys.length > 2 && sg.b === keys[keys.length - 1][1] && W.rec !== 1) {

      const ae = at.hits ? at.hits[at.hits.length - 1][1] : at.active ? at.active[1] : 0;
      if (f.st > ae + 0.02) {
        const ed = W.rec > 1 ? Math.pow(sg.e, W.rec) : 1 - Math.pow(1 - sg.e, 1 / W.rec);
        for (const q of KEYS) D[q] += (sg.b[q] - sg.a[q]) * (ed - sg.e);
        sg.e = ed;
      }
    }
    if (sg) {

      const fx = arcFix(sg.a, sg.b, sg.e, act ? ACT_PX : 34);
      D.ax += fx.x; D.ay += fx.y;
      const R = HEAD_R[f.ch.acc] || 15;
      if (!NO_CLEAR[f.wpn.type] && !f.wpn.twin) {
        const pd = headPen(D, f.wpn, R, S.lj);
        if (pd.d > 0) {
          const nx = pd.nx, ny = pd.ny, d0 = pd.d;
          const pa = headPen(sg.a, f.wpn, R, S.lj).d, pb = headPen(sg.b, f.wpn, R, S.lj).d;
          const ex = d0 - (pa + (pb - pa) * sg.e);
          if (ex > 0) { const m = Math.min(ex + 1.5, 16); D.ax += nx * m; D.ay += ny * m; }
        }
      }
      if (act) {
        const bx = fl ? T.ax + lerpP(fl.A, fl.B, fl.C, fl.pd, 'ax') - lerpP(fl.A, fl.B, fl.C, fl.ps, 'ax') : T.ax;
        const by = fl ? T.ay + lerpP(fl.A, fl.B, fl.C, fl.pd, 'ay') - lerpP(fl.A, fl.B, fl.C, fl.ps, 'ay') : T.ay;
        const dx = D.ax - bx, dy = D.ay - by, m = Math.hypot(dx, dy);
        if (m > ACT_PX) { D.ax = bx + (dx * ACT_PX) / m; D.ay = by + (dy * ACT_PX) / m; }
      }
    }

    const list = at ? strikes(S, at, f.keys) : NONE;
    if (M.chain && list.length) chainCut(list, f.st, D, W, f.wpn.blade || L.blade);
    if (M.clash) clash(S, f, D, dt, hold); else S.cb = S.cbv = 0;

    if (act) {
      ND.solve(T, 0, 0, 1, S.lt, f.wpn); ND.solve(D, 0, 0, 1, S.lj, f.wpn);
      const e = Math.max(Math.hypot(S.lj.tip.x - S.lt.tip.x, S.lj.tip.y - S.lt.tip.y), Math.hypot(S.lj.haF.x - S.lt.haF.x, S.lj.haF.y - S.lt.haF.y));
      if (e > ACT_MAX) { const k = ACT_MAX / e; for (const q of KEYS) D[q] = T[q] + (D[q] - T[q]) * k; }
    }

    const swg = swing(S, f, D, T, list, hold);
    if (S.swgCatch) {
      S.swgCatch = false;
      if (S.lastD) { pose.copy(S.lastD, S.from); S.cu = 0; S.cuDur = G && G.hitstopT > 0 ? Math.min(0.04, G.hitstopT * 0.6) : 0.05; }
    }

    if (S.cuDur > 0) {
      S.cu += dt;
      const u = S.cu / S.cuDur;
      if (u >= 1) S.cuDur = 0;
      else {
        const k = outCubic(u), F = S.from;
        for (const q of KEYS) D[q] = F[q] + (D[q] - F[q]) * k;
      }
    }

    const fs = M.iai && f.wpn.iai ? iaiDraw(at, list, f.st, D).fs : 1;

    const contact = act || swg || !!CONTACT[f.state] || S.cuDur > 0 || !!f.roll;
    const soon = !!(at && at.active && f.st < at.active[0] - 0.02 && f.st > at.active[0] - 0.08);
    if (!hold) {
      const h = Math.max(dt, 1e-4), om = TAU * W.f, z = M.settle ? W.zs : W.z, X = S.sx, Y = S.sy, V = S.sv;
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

    if (M.idle) idleBody(S, f, D, dt, hold); else S.iw = 0;
    if (M.walk) walkBody(S, f, D, dt, hold); else S.wb = 0;
    if (M.overlap) overlap(S, f, D, dt, hold, act || !!CONTACT[f.state]); else S.ovi = false;
    if (M.feet) feet(S, f, D, dt, hold); else S.ft = null;

    if (M.meet) meet(S, f, D, dt, hold); else S.mw = 0;
    D.sw += S.cb;


    S.swgOn = swg;
    if (A.preSolve) A.preSolve(f, D, S, dt, hold, act);

    const g0 = D.grip, gx0 = D.gx, gy0 = D.gy, gEnd = M.grip && f.wpn.type !== 'bo' && f.wpn.type !== 'naginata';
    const grip = !f.wpn.twin && !GRIP_OFF[f.wpn.type] && g0 >= 0.9;
    if (grip) gripSlide(D, f.wpn, S.lj, gEnd);

    const sj = f.j, j = S.j, dir = f.dir * (f.vdir ?? 1);
    ND.solve(D, f.x, f.y, dir, j, f.wpn);


    if (!hold) {
      S.gw = act ? 0 : Math.min(1, S.gw + dt / 0.06);


      const sv = S.gp === S.gp ? Math.abs(wrap(D.sw - S.gp)) / Math.max(dt, 1e-4) : 0;
      S.gp = D.sw; S.gv += (sv - S.gv) * Math.min(1, dt / 0.05);
      const c = Math.cos(D.sw);
      if (Math.abs(c) > 0.25) S.gs = c >= 0 ? 1 : -1;


      if (M.settle && S.gv > 3) S.gsb = S.gs; else S.gsb += clamp(S.gs - S.gsb, -dt / 0.12, dt / 0.12);
    }
    if (!f.roll && j.tip.y > GROUND && S.gw > 0) {
      const len = f.wpn.blade || L.blade, s = (GROUND - j.haF.y) / len;
      if (s > -1 && s < 1) {
        const c = Math.cos(D.sw), a0 = Math.asin(s);
        const wv = Math.max(clamp((Math.abs(c) - 0.25) / 0.3, 0, 1), clamp(1 - (S.gv - 2) / 4, 0, 1));

        let sw = a0 + (Math.PI - 2 * a0) * (1 - (S.gsb + 1) / 2);
        sw += TAU * Math.round((D.sw - sw) / TAU);
        D.sw += (sw - D.sw) * S.gw * wv * wv * (3 - 2 * wv);
        if (grip && M.grip) { D.grip = g0; D.gx = gx0; D.gy = gy0; gripSlide(D, f.wpn, S.lj, gEnd); }
        ND.solve(D, f.x, f.y, dir, j, f.wpn);
      }
    }

    j.wFs = fs;
    if (fs < 1) for (const k of ['tip', 'pom']) { j[k].x = j.haF.x + (j[k].x - j.haF.x) * fs; j[k].y = j.haF.y + (j[k].y - j.haF.y) * fs; }
    if (f.roll) {
      const cx = f.x, cy = f.y - 72, c = Math.cos(f.roll), s = Math.sin(f.roll);
      for (const k of RKEYS) { const p = j[k]; if (!p) continue; const dx = p.x - cx, dy = p.y - cy; p.x = cx + dx * c - dy * s; p.y = cy + dx * s + dy * c; }
      j.hang += f.roll;
    }
    j.hasSword = sj.hasSword;
    for (const k of WKEYS) j[k] = sj[k];
    j.chain = sj.chain ? dispChain(S, f, j, sj) : null;

    if (!hold) S.ed += clamp((f.state === 'atk' ? edgeTarget(list, f.st) : 1) - S.ed, -dt / 0.045, dt / 0.045);
    j.wEdge = M.edge && !NO_EDGE[f.wpn.type] ? edgeQ(S.ed) * (dir < 0 ? -1 : 1) : 0;

    if (M.iai && f.wpn.iai) {

      const st = f.P && f.P.stance;
      let pre = 0;
      if (st && !j.wSheath && !f.roll && (f.state === 'atk' || f.state === 'move' || f.state === 'land' || f.state === 'zanshin')) {
        const da = Math.abs(wrap(T.sw - st.sw)), dh = Math.abs(T.ax - st.ax) + Math.abs(T.ay - st.ay);
        pre = PRE * sstep((1.0 - da) / 0.68) * sstep((64 - dh) / 48);
      }
      saya(S, j, dt, hold, pre);
    } else { j.wSaya = null; j.wNoto = 0; S.sht = 0; S.cok = false; }

    if (!hold) {
      const h = Math.max(dt, 1e-4);
      if (S.psw === S.psw) S.pw += ((D.sw - S.psw) / h - S.pw) * Math.min(1, dt / 0.03);
      S.psw = D.sw;
      if (S.tx === S.tx) { S.tvx += ((j.tip.x - S.tx) / h - S.tvx) * Math.min(1, dt / 0.03); S.tvy += ((j.tip.y - S.ty) / h - S.tvy) * Math.min(1, dt / 0.03); }
      S.tx = j.tip.x; S.ty = j.tip.y;
    }

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



    if (!hold) {
      const G2 = ND.game, o = f.opp;
      if (S.rpx === S.rpx && G2 && G2.phase === 'fight') {
        const jx = f.x - S.rpx - (f.vx || 0) * dt, jy = f.y - S.rpy - (f.vy || 0) * dt;
        const crossed = o && Math.sign(S.rpx - o.x) !== Math.sign(f.x - o.x);
        if (!crossed && Math.abs(jx) < 400 && Math.abs(jy) < 300 && (Math.abs(jx) > 24 || Math.abs(jy) > 24)) { S.rox -= jx; S.roy -= jy; }
      } else { S.rox = 0; S.roy = 0; }
      S.rpx = f.x; S.rpy = f.y;
      const q = Math.exp(-Math.max(0, dt) / 0.12); S.rox *= q; S.roy *= q;
      if (Math.abs(S.rox) < 0.2) S.rox = 0;
      if (Math.abs(S.roy) < 0.2) S.roy = 0;
    }

    if ((S.rox || S.roy) && f.dz) for (const k of RKEYS) { const p = j[k]; if (p) { p.x += S.rox; p.y += S.roy; } }
    S.ok = true;
    if (!hold) f.cloth(j, dt);
  };



  const PKEYS = ['hip', 'neck', 'sh', 'head', 'elF', 'haF', 'tip', 'pom', 'elB', 'haB', 'knF', 'ftF', 'knB', 'ftB', 'shB', 'hipF', 'hipB', 'chest', 'wrF', 'wrB'];
  function copyJ(a, b) {
    for (const k of PKEYS) { const p = a[k]; if (!p) { b[k] = null; continue; } const q = b[k] || (b[k] = { x: 0, y: 0 }); q.x = p.x; q.y = p.y; }
    b.hang = a.hang;
    return b;
  }
  A.interpJ = function (f, S) {
    const I = ND.interp, J = S.j, P = S.jp;
    if (!P || !P.hip || !J.hip || !(S.jClk > S.jpClk)) return J;
    if (S.jiN === I.n && S.ji) return S.ji;
    const w = clamp((I.tr - S.jpClk) / (S.jClk - S.jpClk), 0, 1);
    if (w >= 1 || Math.hypot(J.hip.x - P.hip.x, J.hip.y - P.hip.y) > 120) return J;
    const O = S.ji || (S.ji = {});
    for (const k in J) O[k] = J[k];
    for (const k of PKEYS) {
      const a = P[k], b = J[k];
      if (!a || !b) continue;
      const q = S.jiP ? S.jiP[k] || (S.jiP[k] = { x: 0, y: 0 }) : null;
      if (!q) { S.jiP = {}; return A.interpJ(f, S); }
      q.x = a.x + (b.x - a.x) * w; q.y = a.y + (b.y - a.y) * w; O[k] = q;
    }
    if (P.hang != null && J.hang != null) O.hang = P.hang + wrap(J.hang - P.hang) * w;
    S.jiN = I.n;
    return O;
  };

  A.hold = function (f, dt) {
    const S = f._anim;
    if (!S || S.stamp === ND.simClock || !S.ok || f.dead) return;
    if (S.cuDur > 0) A.present(f, dt, true);
    S.stamp = ND.simClock;
  };





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



  A.trailBands = function (ctx, T, col) {
    const n = T.length;
    let fi = -1, cO = '', cI = '', a = 0;
    return A.trailSlices(T, (i, u0, u1, q) => {
      if (i !== fi) {
        fi = i;
        const P = T[i - 1], R = T[i], v = clamp((Math.hypot(R[2] - P[2], R[3] - P[3]) - 4) / 22, 0, 1);
        a = (i / n) * v * v * (3 - 2 * v);
        if (a >= 0.02) { cO = col(i, a); cI = col(i, a * 0.3); }
      }
      if (a < 0.02) return;
      const m = 0.66, ax = q[0] + (q[2] - q[0]) * m, ay = q[1] + (q[3] - q[1]) * m, bx = q[4] + (q[6] - q[4]) * m, by = q[5] + (q[7] - q[5]) * m;
      ctx.fillStyle = cO; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(q[2], q[3]); ctx.lineTo(q[6], q[7]); ctx.lineTo(bx, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = cI; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(q[4], q[5]); ctx.closePath(); ctx.fill();
    });
  };
})(window.ND);
