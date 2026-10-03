// Shadow Duel — MOTION-CAPTURE RETARGET prototype (branch claude/sd-mocap; ?mocap=1 and the mocap-test page only).
//
// Recorded human motion (Mixamo clips, processed by tools/mocap/bake.mjs into mocap/<clip>.json: OUR skeleton's
// bone directions, the hip, the katana, the saya, grip and foot-contact flags) drives the drawn fighter. The pose is
// a real 3D skeleton in depth25's local axes (X forward, Y down, Z towards the camera = the figure's right side), so
// the body really turns, the near / far limbs swap and the blade turns in 3D; it is drawn with the game's own parts
// (js/skeleton.js ND._draw) and depth25's 3D katana and scabbard, projected with the same perspective camera.
//
// What the player adds at run time:
//   - blending: clips cross-fade (bone directions blended), root travel integrated from each clip's motion
//   - timing: a clip plays at a rate, or through a time warp [[clip s, play s], ...] (to fit a fight's hit windows)
//   - katana grip: the left hand is put on the handle (19 below the right hand, under the tsuba) by 3D IK while the
//     recorded hands hold the hilt together; on draws it holds the saya mouth (saya-biki)
//   - feet: a foot in contact stays where it landed (3D leg IK), released with a short blend
//   - facing: dir ±1 mirrors the picture; a body that turns its back is drawn from the other side
// Drawing only: nothing here is read by the fight. Off unless ?mocap=1 (the loader in index.html) — the game is unchanged.
(function (ND) {
  'use strict';
  const FLAG = (() => { try { return /[?&]mocap=1(&|$)/.test(location.search || ''); } catch (e) { return false; } })();
  const Mo = (ND.mocap = { on: FLAG, base: 'mocap/', clips: {}, stats: { draws: 0, poses: 0 } });
  const L = ND.LEN;
  const SHC = 0.86 * L.torso, SHW = 11, HPW = 7.5, HEAD = 15, GRIP2 = 19, HILT0 = 4;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const TAU = Math.PI * 2;

  // ------------------------------------------------------------ small 3D helpers (arrays [x, y, z])
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const madd = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const nlerp = (a, b, t) => norm(lerp(a, b, t));
  // two-bone IK in 3D: the middle joint from root s, end h, bone lengths, pole direction
  function ik3(s, h, l1, l2, pole) {
    let d = sub(h, s), dist = len(d);
    const max = l1 + l2 - 0.01;
    if (dist > max) { h = add(s, mul(d, max / dist)); d = sub(h, s); dist = max; }
    dist = Math.max(dist, 1e-3);
    const u = mul(d, 1 / dist);
    const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    let p = sub(pole, mul(u, dot(pole, u)));
    if (len(p) < 1e-4) p = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    p = norm(p);
    return { m: add(add(s, mul(u, a)), mul(p, hh)), e: h };
  }

  // ------------------------------------------------------------ clip data
  function unocta(a, b) {
    let x = (a / 4095) * 2 - 1, y = (b / 4095) * 2 - 1;
    const z = 1 - Math.abs(x) - Math.abs(y);
    if (z < 0) { const ox = x; x = (1 - Math.abs(y)) * (ox >= 0 ? 1 : -1); y = (1 - Math.abs(ox)) * (y >= 0 ? 1 : -1); }
    return norm([x, y, z]);
  }
  function b64(s) {
    const bin = atob(s), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // JSON (tools/mocap/bake.mjs) → { id, n, fps, dur, F: [frame], peaks, travel, loop, sword }
  Mo.decode = function (J) {
    const B = b64(J.data), dv = new DataView(B.buffer), FB = J.fb, F = [];
    for (let k = 0; k < J.n; k++) {
      let p = k * FB;
      const fr = { hip: [dv.getInt16(p, true) / 10, dv.getInt16(p + 2, true) / 10, dv.getInt16(p + 4, true) / 10], d: {} };
      p += 6;
      for (const key of J.dirs) { fr.d[key] = unocta((B[p] << 4) | (B[p + 1] >> 4), ((B[p + 1] & 15) << 8) | B[p + 2]); p += 3; }
      fill20(fr.d);
      fr.A = [dv.getInt8(p) / 2, dv.getInt8(p + 1) / 2, dv.getInt8(p + 2) / 2]; p += 3;
      fr.tw = B[p] / 255; fr.sw = B[p + 1] / 255;
      const fl = B[p + 2];
      fr.cR = fl & 1 ? 1 : 0; fr.cL = fl & 2 ? 1 : 0; fr.inside = fl & 4 ? 1 : 0; fr.armed = fl & 8 ? 1 : 0; fr.fistR = fl & 16 ? 1 : 0; fr.fistL = fl & 32 ? 1 : 0;
      F.push(fr);
    }
    return { id: J.id, src: J.src, n: J.n, fps: J.fps, dur: (J.n - 1) / J.fps, F, peaks: J.peaks || [], travel: J.travel, loop: !!J.loop, sword: J.sword, bytes: J.data.length };
  };
  Mo.load = function (id) {
    if (Mo.clips[id]) return Promise.resolve(Mo.clips[id]);
    return fetch(Mo.base + id + '.json').then((r) => { if (!r.ok) throw new Error('mocap clip ' + id + ': ' + r.status); return r.json(); })
      .then((J) => (Mo.clips[id] = Mo.decode(J)));
  };
  Mo.loadAll = (ids) => Promise.all(ids.map(Mo.load));

  // a frame of the clip at time t (seconds), interpolated; out is a reusable frame
  // (?read=0: the side-view readability rules off, to compare)
  Mo.readable = !(() => { try { return /[?&]read=0(&|$)/.test(location.search || ''); } catch (e) { return false; } })();
  const DK = ['pl', 'thR', 'snR', 'thL', 'snL', 'sp', 'sc', 'sl', 'hd', 'uaR', 'faR', 'uaL', 'faL', 'bu', 'be', 'ss', 'hf', 'cf',
    'ch', 'nk', 'cR', 'cL', 'fwR', 'hdR', 'fwL', 'hdL', 'toR', 'toL'];
  // the 20-joint body (?j20=0: the 14-joint one, to compare): pelvis → chest → neck, the shoulders hung from the chest
  // (clavicles: shrugs, a shoulder thrown forward), wrists (the hand bends off the forearm), the feet's own direction
  Mo.j20 = !(() => { try { return /[?&]j20=0(&|$)/.test(location.search || ''); } catch (e) { return false; } })();
  const L20 = { ch: 38.4, nk: 17.6, sh: 18.1, fw: 23.5, hd: 5.5, toe: 13 };
  Mo.L20 = L20;
  // a frame without the 20-joint directions (an older clip, a hand-keyed pose): derived from the 14-joint ones
  function fill20(d, force) {
    if (force) d.ch = d.nk = d.cR = d.cL = d.fwR = d.hdR = d.fwL = d.hdL = d.toR = d.toL = null;
    if (!d.ch) d.ch = d.sp.slice();
    if (!d.nk) d.nk = d.sp.slice();
    if (!d.cR || !d.cL) {
      // the shoulder points of the 14-joint body (0.86 up the spine, ±11 across) seen from the chest point
      const sc = mul(d.sc, SHC), ch = mul(d.ch, L20.ch);
      d.cR = norm(sub(add(sc, mul(d.sl, SHW)), ch)); d.cL = norm(sub(add(sc, mul(d.sl, -SHW)), ch));
    }
    if (!d.fwR) d.fwR = d.faR.slice();
    if (!d.hdR) d.hdR = d.faR.slice();
    if (!d.fwL) d.fwL = d.faL.slice();
    if (!d.hdL) d.hdL = d.faL.slice();
    if (!d.toR) d.toR = [1, 0, 0];
    if (!d.toL) d.toL = [1, 0, 0];
    return d;
  }
  Mo.fill20 = fill20;
  function newFrame() { const d = {}; for (const k of DK) d[k] = [1, 0, 0]; return { hip: [0, 0, 0], d, A: [0, 0, 0], tw: 0, sw: 0, cR: 0, cL: 0, inside: 0, armed: 0, fistR: 0, fistL: 0, vis: null }; }
  function sample(C, t, out) {
    const x = clamp(t * C.fps, 0, C.n - 1), i = Math.floor(x), u = x - i, a = C.F[i], b = C.F[Math.min(C.n - 1, i + 1)];
    out.hip = lerp(a.hip, b.hip, u); out.A = lerp(a.A, b.A, u);
    for (const k of DK) out.d[k] = nlerp(a.d[k], b.d[k], u);
    out.tw = a.tw + (b.tw - a.tw) * u; out.sw = a.sw + (b.sw - a.sw) * u;
    const n = u < 0.5 ? a : b;
    out.cR = a.cR + (b.cR - a.cR) * u; out.cL = a.cL + (b.cL - a.cL) * u;
    out.inside = n.inside; out.armed = a.armed && b.armed ? 1 : n.armed; out.fistR = n.fistR; out.fistL = n.fistL; out.vis = null;
    return out;
  }
  // the edge turns ROUND the blade from a towards b (never through nothing: an edge that flips over would show)
  function turnAbout(a, b, u, w) {
    const pa = norm(sub(a, mul(u, dot(a, u)))), pb = norm(sub(b, mul(u, dot(b, u)))), q = cross(u, pa);
    const th = Math.atan2(dot(q, pb), dot(pa, pb)) * w;
    return norm(add(mul(pa, Math.cos(th)), mul(q, Math.sin(th))));
  }
  // a body's speed: no bone turns faster than a person can (rad / s); a cross-fade or a squeezed wind-up that would
  // snap is carried over a few frames instead (the duel; the test page's clips play as recorded)
  function limitTurn(prev, cur, dt, maxT) {
    for (const k of DK) {
      const a = prev.d[k], b = cur.d[k], c = clamp(dot(a, b), -1, 1), ang = Math.acos(c), lim = (k === 'bu' || k === 'be' ? maxT * 1.4 : maxT) * dt;
      if (ang > lim && ang > 1e-4) {
        // slerp a → b by lim / ang (a nearly opposite pair turns round any perpendicular)
        let q = sub(b, mul(a, c)); if (len(q) < 1e-5) q = Math.abs(a[1]) < 0.9 ? cross(a, [0, 1, 0]) : cross(a, [1, 0, 0]);
        q = norm(q); const t = lim;
        cur.d[k] = norm(add(mul(a, Math.cos(t)), mul(q, Math.sin(t))));
      }
    }
    const dy = cur.hip[1] - prev.hip[1], ly = 500 * dt; // (a body drops or rises at most ~5 m/s)
    if (Math.abs(dy) > ly) cur.hip[1] = prev.hip[1] + Math.sign(dy) * ly;
  }
  // blend frame b into a by weight w (a ← a·(1−w) + b·w); the root (hip x, z) is handled by the rig
  function blendInto(a, b, w) {
    a.hip[1] += (b.hip[1] - a.hip[1]) * w;
    a.A = lerp(a.A, b.A, w);
    for (const k of DK) a.d[k] = k === 'be' ? turnAbout(a.d.be, b.d.be, a.d.bu, w) : nlerp(a.d[k], b.d[k], w);
    a.tw += (b.tw - a.tw) * w; a.sw += (b.sw - a.sw) * w; a.cR += (b.cR - a.cR) * w; a.cL += (b.cL - a.cL) * w;
    a.hip[0] += (b.hip[0] - a.hip[0]) * w; a.hip[2] += (b.hip[2] - a.hip[2]) * w;
    if (w >= 0.5) { a.inside = b.inside; a.armed = b.armed; a.fistR = b.fistR; a.fistL = b.fistL; a.vis = b.vis; }
    else if (b.armed && !a.armed && b.inside) { /* (keep a's state until the cross-fade is half way) */ }
  }

  // clip time for play time p of a layer (rate, or a warp table [[clip s, play s], ...], piecewise linear)
  function clipTime(Ly, p) {
    const W = Ly.warp;
    if (W && W.length > 1) {
      if (p <= W[0][1]) return W[0][0] + (p - W[0][1]) * Ly.rate;
      for (let i = 1; i < W.length; i++) {
        if (p <= W[i][1]) { const a = W[i - 1], b = W[i], u = (p - a[1]) / Math.max(1e-6, b[1] - a[1]); return a[0] + (b[0] - a[0]) * u; }
      }
      const l = W[W.length - 1]; return l[0] + (p - l[1]) * Ly.rate;
    }
    return (Ly.from || 0) + p * Ly.rate;
  }

  // ------------------------------------------------------------ the rig: one figure playing clips
  class Rig {
    // look: the fighter whose costume, palette and katana it wears (a game Fighter: ch, col, wpn)
    constructor(look, x = 0, dir = 1) {
      this.look = look; this.x = x; this.z = 0; this.dir = dir;
      this.layers = []; this.fr = newFrame(); this.tmp = newFrame();
      this.P = null; this.lock = { R: null, L: null, wR: 0, wL: 0 };
      this.trail = []; this.flip = 1; this.t = 0;
      this.puppet = makePuppet(look);
      this.footLock = true; this.gripFix = true; this.showSaya = true; this.travel = 1;
      this.zTravel = 0; // (travel towards / away from the camera is dropped: the fight is a line)
      this.driven = false; this.y = 0; this.ovr = null; // (the duel: js/mocap-duel.js)
      this.j20 = Mo.j20;
    }
    // play a clip: { fade (s), rate, from (clip s), to (clip s, stop there), warp, loop, hold (keep last frame) }
    play(id, o = {}) {
      const C = Mo.clips[id];
      if (!C) throw new Error('mocap clip not loaded: ' + id);
      const fade = o.fade ?? 0.15;
      const Ly = { C, p: 0, rate: o.rate ?? 1, from: o.from ?? 0, to: o.to ?? C.dur, warp: o.warp || null, loop: o.loop ?? C.loop, w: this.layers.length ? 0 : 1, fade, prevRoot: null, done: false, onEnd: o.onEnd || null, mirror: !!o.mirror };
      for (const l of this.layers) l.out = true;
      this.layers.push(Ly);
      return Ly;
    }
    // driven playback (the duel, js/mocap-duel.js): the caller names what plays now; a new key cross-fades in.
    // src: { clip: C, t: () => clip s } (a clip at a time the caller computes) or { frame: (out) => out } (a pose made
    // elsewhere, e.g. the hand-keyed drawing). A layer that fades out keeps running on its own clock.
    drive(key, src, fade = 0.12) {
      const top = this.layers[this.layers.length - 1];
      if (top && top.key === key) { top.src = src; return top; }
      for (const l of this.layers) { l.out = true; l.fade2 = fade; if (l.src) l.src = Object.assign({}, l.src, { t: null }); }
      const Ly = { key, src, C: src.clip || null, p: 0, rate: 1, from: 0, to: 1e9, w: this.layers.length ? 0 : 1, fade, done: false, f: newFrame(), ct: 0 };
      this.layers.push(Ly);
      return Ly;
    }
    // the clip time of the newest layer
    get clipT() { const l = this.layers[this.layers.length - 1]; return l ? clipTime(l, l.p) : 0; }
    get current() { const l = this.layers[this.layers.length - 1]; return l || null; }
    reset(x, dir) { this.x = x; this.z = 0; if (dir) this.dir = dir; this.layers.length = 0; this.lock.R = this.lock.L = null; this.lock.wR = this.lock.wL = 0; this.trail.length = 0; this.P = null; }
    update(dt) {
      this.t += dt;
      if (!this.layers.length) return;
      let rx = 0, rz = 0;
      for (const Ly of this.layers) {
        // fade weights
        if (Ly.out) Ly.w = Math.max(0, Ly.w - dt / Math.max(1e-3, Ly.fade2 || this.layers[this.layers.length - 1].fade));
        else Ly.w = Math.min(1, Ly.w + dt / Math.max(1e-3, Ly.fade));
        if (Ly.src) {
          // driven: the caller's clock while current, its own afterwards (a fading clip runs on, a pose holds)
          if (Ly.src.clip) {
            Ly.ct = Ly.src.t && !Ly.out ? Ly.src.t() : Math.min(Ly.C.dur, Ly.ct + dt * (Ly.src.rate || 1));
            sample(Ly.C, Ly.ct, Ly.f);
            // (the caller places the body: a clip's own travel is dropped, its hip stays over the root)
            Ly.f.hip[0] = 0; Ly.f.hip[2] = 0;
            if (Ly.src.post) Ly.src.post(Ly.f);
          } else if (Ly.src.frame && (!Ly.out || !Ly.held)) { Ly.src.frame(Ly.f); if (Ly.out) Ly.held = true; }
          continue;
        }
        // time
        Ly.p += dt;
        let ct = clipTime(Ly, Ly.p);
        if (ct >= Ly.to) {
          if (Ly.loop) { const span = Ly.to - Ly.from; Ly.p -= span / Ly.rate; ct = clipTime(Ly, Ly.p); Ly.prevRoot = null; }
          else { ct = Ly.to; if (!Ly.done) { Ly.done = true; if (Ly.onEnd) Ly.onEnd(this, Ly); } }
        }
        Ly.ct = ct;
        sample(Ly.C, ct, Ly.f || (Ly.f = newFrame()));
        // root motion: this layer's own travel since the last step
        const r = [Ly.f.hip[0], Ly.f.hip[2]];
        if (Ly.prevRoot) { rx += (r[0] - Ly.prevRoot[0]) * Ly.w; rz += (r[1] - Ly.prevRoot[1]) * Ly.w; }
        Ly.prevRoot = r;
      }
      // drop faded-out layers; normalise the root step by the total weight
      const tot = this.layers.reduce((s, l) => s + l.w, 0) || 1;
      this.x += (rx / tot) * this.dir * this.travel; this.z += (rz / tot) * this.zTravel;
      this.layers = this.layers.filter((l) => !(l.out && l.w <= 0));
      // blend: oldest first, each newer layer over the result by its weight
      const F = this.fr;
      let first = true;
      for (const Ly of this.layers) {
        if (first) { copyFrame(Ly.f, F); first = false; continue; }
        blendInto(F, Ly.f, Ly.w);
      }
      if (this.maxTurn && dt > 0 && this.prevF) limitTurn(this.prevF, F, dt, this.maxTurn);
      if (this.maxTurn) this.prevF = copyFrame(F, this.prevF || newFrame());
      this.P = this.build(F, dt);
      // (a joint that is not a number never reaches the picture: the last good pose stays)
      const P = this.P;
      if (!(isFinite(P.hip[1]) && isFinite(P.haR[0]) && isFinite(P.ftR[1]) && isFinite(P.ftL[1]) && isFinite(P.head[0]))) {
        Mo.stats.nan = (Mo.stats.nan || 0) + 1;
        if (this.goodP) this.P = this.goodP;
      } else this.goodP = JSON.parse(JSON.stringify(P));
      Mo.stats.poses++;
      // cloth (hair, ribbon, sash) moves every step on the drawn joints
      if (this.puppet && dt > 0) { const j = joints2d(this, this.P, projector(this)); this.puppet.vx = this.vx || 0; this.puppet.cloth(j, Math.min(0.05, dt)); }
    }
    // the 3D joints (local, round the root: x forward, y down, z to the camera) from a blended frame
    build(F, dt) {
      const d = F.d, P = this.P || {};
      const hip = this.driven ? [F.hip[0], F.hip[1] + this.y, F.hip[2]] : [0, F.hip[1], 0];
      P.hip = hip;
      P.hipR = madd(hip, d.pl, HPW); P.hipL = madd(hip, d.pl, -HPW);
      P.knR = madd(P.hipR, d.thR, L.thigh); P.ftR = madd(P.knR, d.snR, L.shin);
      P.knL = madd(P.hipL, d.thL, L.thigh); P.ftL = madd(P.knL, d.snL, L.shin);
      if (this.j20) {
        // pelvis → chest → neck; the shoulders from the chest point; elbow → wrist → the fist's centre; the feet's own way
        P.chest = madd(hip, d.ch, L20.ch); P.neck = madd(P.chest, d.nk, L20.nk);
        P.shR = madd(P.chest, d.cR, L20.sh); P.shL = madd(P.chest, d.cL, L20.sh);
        P.elR = madd(P.shR, d.uaR, L.uArm); P.wrR = madd(P.elR, d.fwR, L20.fw); P.haR = madd(P.wrR, d.hdR, L20.hd);
        P.elL = madd(P.shL, d.uaL, L.uArm); P.wrL = madd(P.elL, d.fwL, L20.fw); P.haL = madd(P.wrL, d.hdL, L20.hd);
        P.toR = d.toR; P.toL = d.toL;
      } else {
        P.chest = null; P.wrR = P.wrL = null; P.toR = P.toL = null;
        P.neck = madd(hip, d.sp, L.torso);
        const shC = madd(hip, d.sc, SHC);
        P.shR = madd(shC, d.sl, SHW); P.shL = madd(shC, d.sl, -SHW);
        P.elR = madd(P.shR, d.uaR, L.uArm); P.haR = madd(P.elR, d.faR, L.fArm);
        P.elL = madd(P.shL, d.uaL, L.uArm); P.haL = madd(P.elL, d.faL, L.fArm);
      }
      P.head = madd(P.neck, d.hd, HEAD);
      P.cf = d.cf; P.hf = d.hf; P.pl = d.pl;
      // the upper body leans by this.lean (rad, + back, − in) round the hip: the duel keeps the fronts of two bodies
      // pressing in a bind apart this way (js/mocap-duel.js); arms and blade are solved again after it
      if (this.lean) {
        const th = this.lean, cs = Math.cos(th), sn = Math.sin(th), h0 = P.hip;
        for (const k of UPPER) { const q = P[k]; if (!q) continue; const dx = q[0] - h0[0], dy = q[1] - h0[1]; P[k] = [h0[0] + dx * cs + dy * sn, h0[1] - dx * sn + dy * cs, q[2]]; }
      }
      // a body that reads from the side (every frame): the head ON the neck, above the shoulders, never sunk in the chest
      // (20 joints: the torso never folds more than 30° at the chest — a knockdown's 50-60° fold turned the straps into
      // stripes; the upper body is turned back round the chest point, arms and blade solved after it)
      if (P.chest && Mo.readable) {
        const a = norm(sub(P.chest, P.hip)), b = norm(sub(P.neck, P.chest)), c = clamp(dot(a, b), -1, 1), ang = Math.acos(c), MAXF = (30 * Math.PI) / 180;
        if (ang > MAXF) { const ax = cross(b, a), sa = len(ax); if (sa > 1e-5) rotAbout(P, P.chest, mul(ax, 1 / sa), ang - MAXF, ['neck', 'head', 'shR', 'shL', 'elR', 'elL', 'wrR', 'wrL', 'haR', 'haL']); }
      }
      if (this.readable !== false && Mo.readable) readableTorso(P);
      // a body with its back to the camera is drawn as if turned TO it (Mo.draw: the depth order of the upper body
      // mirrored, arms and blade in front of the body instead of vanishing behind it; the joints are not moved, the
      // picture's outline is the same). Hysteresis: back when the shoulder line points forward > 0.45, again < 0.25
      if (this.readable !== false && Mo.readable) {
        const bk = norm(sub(P.shR, P.shL))[0];
        this.mirZ = this.mirZ ? bk > 0.25 : bk > 0.45;
      } else this.mirZ = false;
      P.mir = !!this.mirZ;
      // katana: in the right hand (armed), else resting in the saya at the hip
      const A = add(hip, F.A);
      let s = d.ss;
      // the scabbard never goes through the floor (a fighter lying down): its end comes to rest on it
      { const Ls = (this.look.wpn || L).blade + 6, ey = A[1] + s[1] * Ls;
        if (ey > -1.5 && A[1] < -1.5) { const sy = clamp((-1.5 - A[1]) / Ls, -1, 1), h = Math.hypot(s[0], s[2]) || 1, k = Math.sqrt(1 - sy * sy) / h; s = [s[0] * k, sy, s[2] * k]; } }
      P.saya = { a: A, u: s, L: (this.look.wpn || L).blade + 6 };
      // (a weapon worn on the back, Kuro's nodachi: no hip saya, the blade is simply in the hand)
      const iai = !!(this.look.wpn && this.look.wpn.iai);
      P.armed = !!F.armed; P.inside = !!F.inside && iai;
      if (F.armed) {
        let u = d.bu;
        const e0 = d.be;
        P.blade = { h: P.haR, u, e: norm(sub(e0, mul(u, dot(e0, u)))) };
        P.bladeVis = P.inside ? Math.max(0, len(sub(A, P.haR)) - 2) : null;
        if (F.vis != null && iai) { P.inside = F.vis < (this.look.wpn || L).blade - 1; P.bladeVis = P.inside ? F.vis : null; }
        if (!iai && this.readable !== false && Mo.readable) this.backSheath(P, dt); else this.bk = null;
        this.armedPrev = true;
      } else {
        this.armedPrev = false; this.bk = null;
        const h = madd(A, s, -2);
        // edge up in the saya (the katana is worn edge up)
        let e = sub([0, -1, 0], mul(s, -s[1])); e = norm(e);
        P.blade = { h, u: s, e };
        P.bladeVis = null;
      }
      // legs that read from the side, and a body on the ground (the duel: js/mocap-duel.js sets this.legs each frame)
      if (this.legs) this.sideLegs(P, this.legs, dt);
      // a hand and blade the caller wants somewhere else (the duel: blades that meet where the fight says; a flatter
      // draw): the sword arm reaches there by 3D IK, the blade turns to the given direction, by weight w
      const O = this.ovr;
      if (O && O.w > 0 && P.armed) {
        const T = lerp(P.haR, O.h, O.w), pole = sub(P.elR, lerp(P.shR, P.haR, 0.5));
        const r = ik3(P.shR, T, L.uArm, L.fArm, pole);
        P.elR = r.m; P.haR = r.e;
        const u = O.u ? nlerp(P.blade.u, O.u, O.w) : P.blade.u, e0 = O.e ? nlerp(P.blade.e, O.e, O.w) : P.blade.e;
        P.blade = { h: P.haR, u, e: norm(sub(e0, mul(u, dot(e0, u)))) };
      }
      if (P.armed && !P.inside && this.readable !== false && Mo.readable) readableBlade(P.blade, (this.look.wpn || L).blade, P, this);
      // left hand: on the handle (katana grip) or holding the saya mouth
      if (this.gripFix) {
        // (handle and saya mouth both weighted, so the hand travels from one to the other as the clips cross-fade)
        let tgt = null, w = 0;
        const wT = F.armed && F.tw > 0.02 && !P.inside && twoHanded(this.look.wpn || L) ? F.tw : 0, wS = F.sw > 0.02 ? F.sw : 0;
        if (wT > 0 || wS > 0) {
          const tT = madd(P.blade.h, P.blade.u, -gripGap(this.look.wpn || L)), tS = madd(A, s, 3);
          tgt = wS <= 0 ? tT : wT <= 0 ? tS : lerp(tT, tS, wS / (wT + wS)); w = Math.min(1, Math.max(wT, wS));
        }
        if (tgt) {
          const T = lerp(P.haL, tgt, w), pole = sub(P.elL, lerp(P.shL, P.haL, 0.5));
          const r = ik3(P.shL, T, L.uArm, L.fArm, pole);
          P.elL = r.m; P.haL = r.e;
          P.gripL = wT;
        } else P.gripL = 0;
      }
      P.fistR = !!F.fistR || P.armed; P.fistL = !!F.fistL;
      // (after the arm IK above: the wrist sits behind the fist along the hand's own direction)
      if (this.j20) { P.wrR = madd(P.haR, d.hdR, -L20.hd); P.wrL = madd(P.haL, d.hdL, -L20.hd); }
      // feet planted where they landed (world x, z kept; leg IK from the hip joint)
      if (this.footLock) for (const side of ['R', 'L']) this.lockFoot(P, side, side === 'R' ? F.cR : F.cL, dt);
      // last word on a standing leg (after the planted feet and their steps): its line at least 35° under the horizontal
      if (this.legs && !this.legs.kick && !this.legs.down) {
        for (const k of ['R', 'L']) {
          const hp = P['hip' + k], ft = P['ft' + k], dy = ft[1] - hp[1], dx = ft[0] - hp[0], lim = Math.max(0, dy) * LEGW;
          if (Math.abs(dx) > lim + 0.5 || dy < 0.4 * (L.thigh + L.shin)) {
            const ny = Math.max(dy, 0.4 * (L.thigh + L.shin)), nx = clamp(dx, -ny * LEGW, ny * LEGW);
            const T = [hp[0] + nx, hp[1] + ny, ft[2]], r = ik3(hp, T, L.thigh, L.shin, [1, -0.5, 0]);
            P['kn' + k] = r.m; P['ft' + k] = r.e;
            const K = this.lock; if (K[k]) K[k].x = this.x + (hp[0] + nx) * this.dir; K[k + 'rel'] = null;
          }
        }
      }
      // standing (the duel): after everything, the lower foot is ON the floor — a planted foot the leg could not
      // reach any more, a hand-keyed pose that lifts both feet, never leave the body hanging in the air
      // lying or getting up (on the floor in the fight): the lowest part of the body rests on the floor, no float;
      // in the air the last correction fades out (a body leaving the floor never jumps by it)
      if (this.legs) {
        let fix = null;
        if (this.legs.grounded) fix = -Math.max(P.ftR[1], P.ftL[1]);
        else if (this.legs.down && this.legs.onFloor) { let low = -1e9; for (const [k, r] of FLOOR_R2) { const q = P[k]; if (q && q[1] + r > low) low = q[1] + r; } fix = -low; }
        // (eased over a few hundredths of a second: a foot planted / lifted, a step, a new clip never make the body hop;
        // the feet are kept on the floor below by the legs themselves)
        // (lying or getting up: exactly on the floor — the body rests on it, a hand pushes on it)
        if (fix != null) { if (this.gfix == null || (!this.legs.grounded && !this.legs.lying)) this.gfix = fix; else if (dt > 0) this.gfix += (fix - this.gfix) * Math.min(1, dt / (this.legs.grounded ? 0.04 : 0.07)); } // (lying still: eased too — the part that touches the floor changing never moves the body in one frame; nothing goes through the floor: the lift below)
        else if (this.gfix) { this.gfix *= Math.exp(-Math.max(dt, 0) / 0.12); if (Math.abs(this.gfix) < 0.05) this.gfix = 0; }
        const f2 = this.gfix || 0;
        if (Math.abs(f2) > 0.05) {
          for (const k of ALLJ) if (P[k]) P[k] = [P[k][0], P[k][1] + f2, P[k][2]];
          P.blade.h = [P.blade.h[0], P.blade.h[1] + f2, P.blade.h[2]]; P.saya.a = [P.saya.a[0], P.saya.a[1] + f2, P.saya.a[2]];
        }
        if (this.legs.grounded) {
          const k = P.ftR[1] >= P.ftL[1] ? 'R' : 'L', ft = P['ft' + k], hp = P['hip' + k];
          if (Math.abs(ft[1]) > 0.3) { const r = ik3(hp, [ft[0], 0, ft[2]], L.thigh, L.shin, sub(P['kn' + k], lerp(hp, ft, 0.5))); P['kn' + k] = r.m; P['ft' + k] = r.e; }
          // a kneel (the armed kneeling counters: the sweep, the finisher, the turning cut): a knee down at the floor rests
          // ON it (7 over it: the drawn knee's round) — the thigh turns round the hip to put it there, and the shin lies
          // from it along the floor to the foot, on the floor — instead of the whole body being lifted by the knee's round
          // with both feet in the air in a grounded state
          for (const s2 of ['R', 'L']) {
            const kn = P['kn' + s2], hp2 = P['hip' + s2], f3 = P['ft' + s2];
            if (kn[1] <= -12 || f3[1] < -8) continue;
            const dy = -7 - hp2[1]; if (dy < 0 || dy > L.thigh) continue;
            const hx = kn[0] - hp2[0], hz = kn[2] - hp2[2], hl = Math.hypot(hx, hz) || 1, h = Math.sqrt(L.thigh * L.thigh - dy * dy);
            const nk = [hp2[0] + (hx / hl) * h, -7, hp2[2] + (hz / hl) * h];
            const fx = f3[0] - nk[0], fz = f3[2] - nk[2], fl = Math.hypot(fx, fz), h2 = Math.sqrt(Math.max(0, L.shin * L.shin - 49));
            const dx2 = fl > 1e-3 ? fx / fl : -1, dz2 = fl > 1e-3 ? fz / fl : 0;
            // (eased in as the knee comes down from 12 to 7 over the floor: never a jump when a knee touches down)
            let w = clamp((kn[1] + 12) / 5, 0, 1) * clamp((f3[1] + 8) / 6, 0, 1); w = w * w * (3 - 2 * w); // (and as the foot comes down to the floor)
            P['kn' + s2] = lerp(kn, nk, w); P['ft' + s2] = lerp(f3, [nk[0] + dx2 * h2, 0, nk[2] + dz2 * h2], w);
          }
        }
      }
      // (last of all) the drawn body is thicker than the recorded one: lying down, nothing may go through the floor
      { let lift = 0;
        for (const [k, r] of FLOOR_R) { const q = P[k]; if (q && q[1] + r > lift) lift = q[1] + r; }
        // (off its feet — launched, lying, rolling — the feet too: an ankle is never drawn under the floor)
        if (this.legs && !this.legs.grounded) for (const k of ['ftR', 'ftL']) { const q = P[k]; if (q && q[1] + 1 > lift) lift = q[1] + 1; }
        // (it rises at once — nothing ever goes through the floor — but lets go over ~0.06 s: a roll's head or knee
        // leaving the floor in one frame never drops the whole body by it)
        if (dt > 0 && this.liftS > lift && !(this.legs && this.legs.grounded)) lift = Math.max(lift, this.liftS * Math.exp(-dt / 0.06));
        this.liftS = lift;
        if (lift > 0) for (const k of ALLJ) if (P[k]) P[k] = [P[k][0], P[k][1] - lift, P[k][2]];
        if (lift > 0) { P.blade.h = [P.blade.h[0], P.blade.h[1] - lift, P.blade.h[2]]; P.saya.a = [P.saya.a[0], P.saya.a[1] - lift, P.saya.a[2]]; } }
      // the body's height over the fight's own never jumps: a source change, a landing, a fall onto the floor, the floor
      // rule lifting a body — the hip moves at most 11 a frame (60 a second) towards where it belongs. Standing, the
      // feet stay where they are and the legs bend to it; off the feet the whole body moves
      if (this.driven && Mo.readable) {
        const rel = P.hip[1] - this.y, rp = this.relPrev, a = 11 * Math.max(0, dt) * 60;
        if (rp != null && dt > 0 && dt < 0.1 && Math.abs(rel - rp) > a) {
          const standing = this.legs && this.legs.grounded;
          let corr = clamp(rel, rp - a, rp + a) - rel;
          // (off the feet the body is never eased down through the floor: the feet stay over it)
          if (!standing && corr > 0) corr = Math.max(0, Math.min(corr, -Math.max(P.ftR[1], P.ftL[1])));
          const keys = standing ? ALLJ.filter((k) => !/^(kn|ft)/.test(k)) : ALLJ;
          for (const k of keys) if (P[k]) P[k] = [P[k][0], P[k][1] + corr, P[k][2]];
          P.blade.h = [P.blade.h[0], P.blade.h[1] + corr, P.blade.h[2]]; P.saya.a = [P.saya.a[0], P.saya.a[1] + corr, P.saya.a[2]];
          if (standing) for (const k of ['R', 'L']) { const r = ik3(P['hip' + k], P['ft' + k], L.thigh, L.shin, [1, -0.5, 0]); P['kn' + k] = r.m; P['ft' + k] = r.e; }
          this.relPrev = rel + corr;
        } else this.relPrev = rel;
      }
      if (P.chest && Mo.readable) {
        feetAndWrists(P);
        // (a foot turns at most 10 rad/s: a source change, a foot leaving the floor or a fast clip never swing it round in a frame)
        const T0 = this.toPrev || (this.toPrev = {});
        for (const sd of ['R', 'L']) {
          const to = P['to' + sd], p0 = T0[sd];
          if (p0 && dt > 0) {
            const c = clamp(dot(p0, to), -1, 1), ang = Math.acos(c), mx = 10 * dt;
            if (ang > mx) { let pp = sub(to, mul(p0, c)); const pl = len(pp); pp = pl > 1e-5 ? mul(pp, 1 / pl) : [0, -1, 0]; P['to' + sd] = norm(add(mul(p0, Math.cos(mx)), mul(pp, Math.sin(mx)))); }
          }
          T0[sd] = P['to' + sd].slice();
          // the drawn pitch (footTip): the recorded one, under the floor rule, turning at most 12 rad/s (a foot leaving
          // the floor lowers its toes over a few frames, never in one); the floor rule itself always holds
          const to2 = P['to' + sd], ft = P['ft' + sd], fl = Math.max(0, -ft[1]) / L20.toe;
          // (a foot coming down flattens ahead of its landing: the height two frames on, at its present speed)
          const PP = this.pitchP || (this.pitchP = {}), q0 = PP[sd], y0 = PP['y' + sd], yN = y0 != null && dt > 0 ? ft[1] + Math.max(0, ft[1] - y0) * 2.5 : ft[1];
          PP['y' + sd] = ft[1];
          const flN = Math.min(fl, Math.max(0, -yN) / L20.toe);
          const want = Math.min(Math.atan2(to2[1], Math.hypot(to2[0], to2[2])), Math.asin(clamp(flN, 0, 1)));
          let pt = want;
          if (q0 != null && dt > 0) pt = q0 + clamp(want - q0, -12 * dt, 12 * dt);
          pt = Math.min(pt, Math.asin(clamp(fl, 0, 1)));
          PP[sd] = pt; P['pitch' + sd] = pt;
        }
      }
      return P;
    }
    // LEGS FROM THE SIDE (the game is seen side-on): a recorded leg that points at / away from the camera, a wide
    // stance or a back leg thrown out reads as a fat tube from here. Each leg is laid into its own side plane
    // (hip ±7.5 across, the foot where the recording puts it forward / up), solved again with the knee bent FORWARD,
    // lengths kept (46 + 46). Outside a kick or an air move a thigh may not rise towards the horizontal (the foot stays
    // well under the hip) and the feet stand a stride apart (never one pillar); grounded, the body sits low enough
    // for the knees to bend, and the lower foot stands on the floor (the fight's own height is the truth).
    // L: { grounded, kick (a kick / air move: no limits), down (lying / getting up: no stride), snap (no easing) }
    // A blade worn on the back (Kuro's nodachi) taken by a hand reaching behind the head is still IN its scabbard:
    // only the steel between the guard and the scabbard's mouth shows, running from the hand into the scabbard (as
    // drawn on the back, js/skeleton.js saya: mouth over the shoulders, end low behind the hip) — never a hilt alone
    // standing up out of the head. It leaves the scabbard when the recorded blade swings up or forward (at most 0.9 s),
    // turning to the blade's own line and growing to full length over 0.15 s.
    backSheath(P, dt) {
      const W = this.look.wpn || L, BL = W.blade || 96;
      if (!this.armedPrev) {
        // (taken just now: from behind the head only; a keyed pose that arms with the hand in front does not start this)
        this.bk = P.haR[0] < P.neck[0] + 6 ? { t: 0, rel: -1, u: null, vis: 0 } : null;
      }
      const B = this.bk;
      if (!B) return;
      B.t += Math.max(0, dt || 0);
      const up = norm(sub(P.neck, P.hip)), bk = norm(sub([-1, 0, 0], mul(up, -up[0]))), sl = (BL + (W.handle || 24)) / 120;
      const shM = lerp(P.shR, P.shL, 0.5);
      const M = add(add(shM, mul(bk, 2)), mul(up, 16 * sl));
      // (the hand that holds it: behind the head at the mouth's line, so the handle stands up and BACK behind the
      // head, never straight up out of it; it comes back to the recorded hand as the blade leaves)
      // (the handle up and back at 50°, over the shoulder; only a finger of steel out of the mouth)
      const Hs = add(add(M, mul(bk, 9)), mul(up, 2)), uIn = norm(add(mul(up, -0.64), mul(bk, -0.77))), visIn = 3;
      if (B.rel < 0 && (P.haR[0] > P.neck[0] + 20 || (P.blade.u[1] < -0.3 && P.blade.u[0] > -0.2) || B.t > 0.9)) { B.rel = 0; if (!B.u) { B.u = uIn; B.vis = visIn; B.wH = 0; } } // (out when the recorded hand comes forward or its blade swings up)
      let u, vis, wH;
      if (B.rel < 0) { u = uIn; vis = visIn; wH = Math.min(1, B.t / 0.08); B.u = u; B.vis = vis; B.wH = wH; }
      else {
        B.rel = Math.min(1, B.rel + Math.max(0, dt || 0) / 0.15);
        const k = B.rel * B.rel * (3 - 2 * B.rel);
        // (the blade swings out FORWARD, in the picture's plane: from down-forward over the front to the recorded line)
        const cu = { u: P.blade.u, e: P.blade.e }; readableBlade(cu);
        const a0 = Math.atan2(B.u[1], B.u[0]); let a1 = Math.atan2(cu.u[1], cu.u[0]); if (a1 > a0) a1 -= TAU;
        const a = a0 + (a1 - a0) * k, z = B.u[2] + (cu.u[2] - B.u[2]) * k, h = Math.sqrt(Math.max(0, 1 - z * z));
        u = [Math.cos(a) * h, Math.sin(a) * h, z]; vis = B.vis + (BL - B.vis) * k; wH = B.wH * (1 - k);
        if (B.rel >= 1) { this.bk = null; return; }
      }
      if (wH > 0) {
        const T2 = lerp(P.haR, Hs, wH), pole = sub(P.elR, lerp(P.shR, P.haR, 0.5));
        const r = ik3(P.shR, T2, L.uArm, L.fArm, pole);
        P.elR = r.m; P.haR = r.e;
      }
      const e0 = P.blade.e; let e = sub(e0, mul(u, dot(e0, u)));
      if (len(e) < 0.2) e = cross(u, [0, 0, 1]);
      P.blade = { h: P.haR, u, e: norm(e) };
      if (B.rel >= 0) readableBlade(P.blade);
      P.inside = true; P.bladeVis = Math.min(BL, vis);
    }
    sideLegs(P, Lg, dt) {
      const fs = 1; // (knees bend the way the fighter faces in the fight: forward, always)
      const LL = L.thigh + L.shin, hip = P.hip;
      const side = (k) => (P['hip' + k][2] - hip[2] >= 0 ? 1 : -1);
      const feet = {};
      for (const k of ['R', 'L']) {
        const ft = P['ft' + k], z = side(k) * HPW;
        let x = ft[0], y = ft[1];
        if (!Lg.kick && !Lg.down) {
          // the thigh stays below ~35° from the horizontal: the foot at least 0.55 of the leg under the hip, at most
          // 0.8 of it ahead / behind
          // (the leg's line at least 35° under the horizontal: the foot no further out than 1.43 × its depth under the
          // hip, and at least 0.4 of the leg under it)
          const dx = x - hip[0], dy = y - hip[1];
          const ny = Math.max(dy, 0.4 * LL), lim = Math.min(0.8 * LL, ny * LEGW), nx = clamp(dx, -lim, lim);
          x = hip[0] + nx; y = hip[1] + ny;
        }
        feet[k] = [x, y, z];
      }
      // a stride: grounded feet at least 24 apart forward / back (the front foot the one further forward)
      if (Lg.grounded && !Lg.kick && !Lg.down) {
        const a = feet.R, b = feet.L, gap = Math.abs(a[0] - b[0]);
        if (gap < 24) { const m = (a[0] + b[0]) / 2, frontR = a[0] * fs >= b[0] * fs; const h = 12 * fs; a[0] = m + (frontR ? h : -h); b[0] = m + (frontR ? -h : h); }
      }
      // grounded: the body low enough that a standing leg bends (no stiff pillars), the lower foot on the floor
      let dy = 0;
      if (Lg.grounded) {
        const low = Math.max(feet.R[1], feet.L[1]);
        dy = -low; // (the lower foot to the floor)
        // the hip so high that a planted leg would be straight: lower the body (a bent, athletic stance)
        for (const k of ['R', 'L']) {
          const f = feet[k]; if (f[1] < low - 6) continue; // (a lifted foot does not hold the body up)
          const reach = 0.93 * LL, dx = f[0] - hip[0], need = Math.sqrt(Math.max(0, reach * reach - dx * dx));
          const hy = hip[1] + dy, fy = f[1] + dy; // (after the shift: foot at 0)
          if (fy - hy > need) dy += fy - hy - need;
        }
        // the body moves to that height smoothly (a hip that jumps reads as a hop)
        const k = Math.min(1, dt / 0.05);
        // (a second look in the same instant, dt 0, changes nothing: the eased value stays)
        if (this.gdy == null) this.gdy = dy; else if (dt > 0) this.gdy += (dy - this.gdy) * k;
        dy = this.gdy;
        // the lower foot always on the floor (the eased height may leave it a little off: the feet follow the floor)
        const lowAfter = low + dy;
        if (Math.abs(lowAfter) > 0.01) { feet.R[1] -= lowAfter; feet.L[1] -= lowAfter; }
      } else this.gdy = null;
      if (dy) {
        for (const k of ALLJ) if (P[k] && k !== 'ftR' && k !== 'ftL') P[k] = [P[k][0], P[k][1] + dy, P[k][2]];
        P.blade.h = [P.blade.h[0], P.blade.h[1] + dy, P.blade.h[2]]; P.saya.a = [P.saya.a[0], P.saya.a[1] + dy, P.saya.a[2]];
      }
      // each leg in its side plane, the knee forward (the one of the two solutions further the way the body faces)
      let it20 = 0;
      const KS = ['R', 'L'];
      for (let ki = 0; ki < 2; ki++) {
        const k = KS[ki];
        const hp = [P.hip[0], P.hip[1], side(k) * HPW], ft = feet[k];
        P['hip' + k] = hp;
        let tx = ft[0] - hp[0], ty = ft[1] - hp[1], d = Math.hypot(tx, ty);
        const max = LL - 0.5;
        if (d > max) { tx *= max / d; ty *= max / d; d = max; }
        d = Math.max(d, 1e-3);
        const a = (L.thigh * L.thigh - L.shin * L.shin + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L.thigh * L.thigh - a * a));
        const ux = tx / d, uy = ty / d, px = -uy, py = ux;
        const k1 = [hp[0] + ux * a + px * h, hp[1] + uy * a + py * h], k2 = [hp[0] + ux * a - px * h, hp[1] + uy * a - py * h];
        const sc = (q) => (q[0] - hp[0]) * fs - 0.5 * (q[1] - hp[1]);
        let kn = sc(k1) >= sc(k2) ? k1 : k2;
        // (outside a kick: a thigh never above 35° under the horizontal — the foot comes in under the body)
        if (!Lg.kick && !Lg.down && Math.atan2(kn[1] - hp[1], Math.abs(kn[0] - hp[0])) < 0.61 && it20 < 8) { ft[0] = hp[0] + (ft[0] - hp[0]) * 0.8; ft[1] = Math.max(ft[1], hp[1] + 0.75 * LL); it20++; ki--; continue; }
        it20 = 0;
        P['kn' + k] = [kn[0], kn[1], hp[2]]; P['ft' + k] = [hp[0] + tx, hp[1] + ty, hp[2]];
      }
    }
    lockFoot(P, side, c, dt) {
      const K = this.lock, ft = P['ft' + side], hp = P['hip' + side], kn = P['kn' + side];
      // world position of this foot (x along the fight line, whichever way the rig faces)
      const wx = this.x + ft[0] * this.dir, wz = this.z + ft[2];
      // (standing in the duel: a foot on the floor is planted whatever the recording's own contact says)
      const on = (c > 0.5 || (this.legs && this.legs.grounded && ft[1] > -2)) && ft[1] > -14;
      // a STEP: a planted foot left too far behind / ahead by the body (the fight moves it) is picked up and set
      // down where the leg now wants it (0.14 s, a small lift), one foot at a time: the feet never slide
      const other = side === 'R' ? 'L' : 'R', ST = K[side + 'st'];
      // (the body carried far in a moment — a knockback, a new round: the old spot is forgotten, no long drag)
      const far = (q) => q && Math.abs((q.x - this.x) * this.dir - ft[0]) > 60;
      if (far(K[side]) || (ST && Math.abs((ST.a - this.x) * this.dir - ft[0]) > 90)) { K[side] = null; K[side + 'st'] = null; K[side + 'rel'] = null; }
      if (K[side + 'st']) {
        const ST = K[side + 'st'];
        ST.t += dt; ST.b = wx; // (it lands where the leg wants it now)
        const u = clamp(ST.t / 0.14, 0, 1), e = u * u * (3 - 2 * u), x = ST.a + (ST.b - ST.a) * e;
        const T = [(x - this.x) * this.dir, Math.min(ft[1], -Math.sin(Math.PI * u) * 7), ft[2]];
        const r = ik3(hp, T, L.thigh, L.shin, sub(kn, lerp(hp, ft, 0.5)));
        P['kn' + side] = r.m; P['ft' + side] = r.e;
        if (u >= 1) { K[side + 'st'] = null; K[side] = on ? { x: ST.b, z: wz } : null; K[tw0(side)] = on ? 1 : 0; }
        return;
      }
      if (on && K[side] && this.legs && this.legs.grounded) {
        // the planted spot is no good any more: too far from where the leg wants the foot, out of reach, or the thigh
        // would rise towards the horizontal → a step (or, while the other foot is in the air, the foot goes along)
        const lx = (K[side].x - this.x) * this.dir, dxh = lx - hp[0], dyh = 0 - hp[1], reach = Math.hypot(dxh, dyh);
        const bad = Math.abs(lx - ft[0]) > 22 || reach > 0.95 * (L.thigh + L.shin) || (!this.legs.kick && Math.abs(dxh) > 0.62 * (L.thigh + L.shin));
        if (bad) {
          if (!K[other + 'st']) { K[side + 'st'] = { a: K[side].x, b: wx, t: 0 }; K[side] = null; return this.lockFoot(P, side, c, 0); }
          K[side] = { x: wx, z: wz };
        }
      }
      if (on && !K[side]) K[side] = { x: wx, z: wz };
      if (!on && K[side]) { K[side + 'rel'] = K[side]; K[side] = null; }
      const tw = 'w' + side;
      K[tw] = clamp(K[tw] + ((on ? 1 : -1) * dt) / 0.08, 0, 1);
      const lk = K[side] || K[side + 'rel'];
      if (!lk || K[tw] <= 0) { K[side + 'rel'] = null; return; }
      // planted: on the floor at the landing spot; lifting off: from that spot back to the recorded foot
      let lx = (lk.x - this.x) * this.dir;
      if (on && this.legs && !this.legs.kick && !this.legs.down) {
        // (a planted foot obeys the standing-leg rule too: too far out, it slides in under the body and is planted there)
        const dyh = 0 - hp[1], lim = Math.max(0, dyh) * LEGW, dxh = lx - hp[0];
        if (Math.abs(dxh) > lim) { lx = hp[0] + Math.sign(dxh) * lim; if (K[side]) K[side].x = this.x + lx * this.dir; }
      }
      const T = lerp(ft, [lx, on ? 0 : ft[1], lk.z - this.z], K[tw]);
      const r = ik3(hp, T, L.thigh, L.shin, sub(kn, lerp(hp, ft, 0.5)));
      P['kn' + side] = r.m; P['ft' + side] = r.e;
    }
  }
  const tw0 = (side) => 'w' + side;
  const UPPER = ['chest', 'neck', 'head', 'shR', 'shL', 'elR', 'elL', 'wrR', 'wrL', 'haR', 'haL'];
  // HEAD AND SPINE READ FROM THE SIDE. A turn recorded in 3D may point the spine at / away from the camera: drawn
  // side-on, the torso keeps its full height in the art while the projected spine is short, and the head sinks into
  // the chest. Here, before anything is hung on the body:
  //  1. the spine (hip → neck) keeps at least 80 % of its length across the picture: the upper body is turned (one
  //     rotation round the hip, arms and all) until its depth share is at most 0.6
  //  2. the shoulders stay below the neck point (never up round the chin); an arm whose shoulder moves keeps its hand
  //  3. the head stays out on its neck: its centre at least 0.9 of its radius beyond the higher shoulder along the
  //     spine (above them upright, in front of them bent forward), the neck at least 40 % of its length across the picture
  const HEADR = 12.5;
  function rotAbout(P, h, ax, ang, keys) {
    const c = Math.cos(ang), sn = Math.sin(ang);
    for (const k of keys) {
      const q = P[k]; if (!q) continue;
      const v = sub(q, h), cr = cross(ax, v), d = dot(ax, v);
      P[k] = add(h, add(add(mul(v, c), mul(cr, sn)), mul(ax, d * (1 - c))));
    }
  }
  // a drawn blade that reads (the turning cut, a high block): turned away from pointing into or out of the picture
  // (its depth share squeezed to 0.55: a blade pointing at the camera is a sliver) and from showing only its edge (the
  // edge's angle θ round the blade, from the camera, pushed toward the flat: θ' = 90°·(θ/90°)^0.4 each side, so 2° → 20°,
  // 5° → 29°, 20° → 49°: an edge-on blade opens, a flat one stays; Mo.draw also gives the drawn blade a least width). Both are smooth maps: the edge never jumps over.
  // (and never drawn shorter than 4/5 of itself: the part of the blade in the picture's plane is at least 0.8 -
  // r' = sqrt(0.64 + 0.36 r²), smooth, 1 stays 1 - then, with the drawing's perspective (Mo.cam), turned on toward the
  // plane until the drawn length is 0.8 of the true one: a katana pointing at or away from the camera read as a stub)
  // (the share of a blade's true length the picture shows, with the drawing's perspective: hand h, direction u, length BL)
  Mo.bladeDrawn = (h, u, BL) => { const cam = Mo.cam, sh = cam / (cam - h[2]), t = madd(h, u, BL), st = cam / (cam - t[2]); return Math.hypot(t[0] * st - h[0] * sh, t[1] * st - h[1] * sh) / (BL * sh); };
  // (a fighter's own blade over its own head, neck, torso as drawn or legs, in the picture: how deep at most - the hand
  // and the first 10 of the blade by it left out, the hands hold it in front of the body; same measure as the audit's
  // bladeSelf: head 14, neck 8, the torso's 24 with 6 of give, thighs 11 and shins 8.5 with 6)
  const segP2 = (p, q, x, y) => { const vx = q[0] - p[0], vy = q[1] - p[1], l2 = vx * vx + vy * vy || 1, t = clamp(((x - p[0]) * vx + (y - p[1]) * vy) / l2, 0, 1); return Math.hypot(x - p[0] - vx * t, y - p[1] - vy * t); };
  // (which of its own body parts a blade is drawn IN FRONT of - Mo.draw's own layering: the katana's depth at 0.35 of it
  // against the torso's middle and each leg's; a blade behind them is drawn under them and reads as behind, not over)
  Mo.bladeFront = (P, h, u, BL) => {
    const zz = zDraw(P), zk = zz(madd(h, u, BL * 0.35)), zT = (P.hip[2] + zz(P.neck)) * 0.5, zLeg = (s) => (P['kn' + s][2] + P['ft' + s][2]) * 0.5;
    return { T: zk >= zT, R: zk >= zLeg('R'), L: zk >= zLeg('L') };
  };
  Mo.selfPen = (P, h, u, BL) => {
    const cam = Mo.cam, pr = (p) => { const s = cam / (cam - p[2]); return [p[0] * s, p[1] * s]; };
    const fr = Mo.bladeFront(P, h, u, BL);
    if (!fr.T && !fr.R && !fr.L) return -1e9;
    const hd = pr(P.head), nk = pr(P.neck), hp = pr(P.hip), LG = [fr.R && [pr(P.hipR), pr(P.knR), 5], fr.L && [pr(P.hipL), pr(P.knL), 5], fr.R && [pr(P.knR), pr(P.ftR), 2.5], fr.L && [pr(P.knL), pr(P.ftL), 2.5]].filter(Boolean);
    let m = -1e9;
    for (let k = 0; k <= 20; k++) {
      const w = pr(madd(h, u, 10 + ((BL - 10) * k) / 20)), x = w[0], y = w[1];
      if (fr.T) m = Math.max(m, 14 - Math.hypot(x - hd[0], y - hd[1]), 8 - segP2(nk, hd, x, y), 18 - segP2(hp, nk, x, y));
      for (const [a, c, r] of LG) m = Math.max(m, r - segP2(a, c, x, y));
    }
    return m;
  };
  function readableBlade(b, BL, P, rg) {
    let u = norm([b.u[0], b.u[1], b.u[2] * 0.55]);
    {
      const r = Math.hypot(u[0], u[1]), sg = u[2] < 0 ? -1 : 1, dx = r > 1e-4 ? u[0] / r : 0.7071, dy = r > 1e-4 ? u[1] / r : -0.7071;
      const fit = (q, a = 0) => { const c = Math.cos(a), sn = Math.sin(a); return [(dx * c - dy * sn) * q, (dx * sn + dy * c) * q, sg * Math.sqrt(Math.max(0, 1 - q * q))]; };
      let q = Math.sqrt(0.64 + 0.36 * r * r);
      if (BL && b.h) {
        const h = b.h, drawn = (v) => Mo.bladeDrawn(h, v, BL);
        if (drawn(fit(q)) < 0.8) { let lo = q, hi = 1; for (let i = 0; i < 10; i++) { const m = (lo + hi) / 2; if (drawn(fit(m)) < 0.8) lo = m; else hi = m; } q = hi; }
      }
      q = Math.max(q, r);
      u = fit(q);
      // never turned INTO its own body: a blade read longer that would lie over the wielder's own body is turned the least
      // round the hand in the picture that keeps it off (near last frame's turn), or drawn shorter - 0.6 of it at least;
      // if nothing in reach is clear, the least deep of them (js/mocap-duel.js's audit: bladeSelf)
      let a0 = 0;
      // (a blade the duel places - a bind, a cut aimed at its target: rg.ovr - is left where it is put)
      if (P && BL && b.h && !(rg && rg.ovr && rg.ovr.w > 0.01) && Mo.selfPen(P, b.h, u, BL) > 0) {
        const pa = rg && rg.rbA != null ? rg.rbA : 0, qs = [];
        for (let qq = q; qq >= Math.min(q, 0.6) - 1e-6; qq -= 0.05) qs.push(qq);
        let best = null, least = null;
        for (const qq of qs) for (let i = 0; i <= 24; i++) for (const sgn of i ? [1, -1] : [1]) {
          const a = sgn * i * 0.05, cost = Math.abs(a) + (q - qq) * 2 + Math.abs(a - pa) * 0.5;
          if (best && cost >= best.cost) continue;
          const v = fit(qq, a);
          if (Mo.bladeDrawn(b.h, v, BL) < 0.62) continue; // (never drawn under 0.6 of its length)
          const pn = Mo.selfPen(P, b.h, v, BL);
          if (pn <= 0) best = { cost, v, a }; else if (!least || pn < least.pn) least = { pn, v, a };
        }
        const ch = best || (least && least.pn < Mo.selfPen(P, b.h, u, BL) - 2 ? least : null);
        if (ch) { u = ch.v; a0 = ch.a; }
      }
      if (rg) rg.rbA = a0;
    }
    let e = sub(b.e, mul(u, dot(b.e, u)));
    e = len(e) > 1e-4 ? norm(e) : norm(cross(u, [0, 0, 1]));
    const zc = sub([0, 0, 1], mul(u, u[2])), lz = len(zc);
    if (lz > 0.05) {
      const ax = mul(zc, 1 / lz), bx = cross(u, ax), th = Math.atan2(dot(e, bx), dot(e, ax));
      const H = Math.PI / 2, g = (x) => H * Math.pow(x / H, 0.4), a = Math.abs(th), sg = th < 0 ? -1 : 1;
      const t2 = sg * (a <= H ? g(a) : Math.PI - g(Math.PI - a));
      e = norm(add(mul(ax, Math.cos(t2)), mul(bx, Math.sin(t2))));
    }
    b.u = u; b.e = e;
  }
  // 20 joints, last of all: a foot's toe and heel never below the floor (a planted foot kept the clip's tiptoe and was
  // drawn stabbed into the floor: the foot is turned onto the floor, or onto its toes above it), and a hand never folded
  // more than 55° off its forearm (the wrist moves, the hand and the blade stay)
  const TOE = 13, HEEL = 4.5;
  function feetAndWrists(P) {
    for (const s of ['R', 'L']) {
      const ft = P['ft' + s], to = P['to' + s];
      if (ft && to) {
        const lo = Math.min(0, ft[1] / HEEL), hi = Math.max(0, -ft[1] / TOE), ty = clamp(to[1], lo, hi);
        if (ty !== to[1]) { const h = Math.hypot(to[0], to[2]) || 1, k = Math.sqrt(Math.max(0, 1 - ty * ty)) / h; P['to' + s] = h > 1e-4 ? [to[0] * k, ty, to[2] * k] : [Math.sqrt(1 - ty * ty), ty, 0]; }
      }
      const el = P['el' + s], wr = P['wr' + s], ha = P['ha' + s];
      if (el && wr && ha) {
        const fw = norm(sub(wr, el)), hd = norm(sub(ha, wr)), c = clamp(dot(fw, hd), -1, 1), MAXW = (55 * Math.PI) / 180;
        if (Math.acos(c) > MAXW) {
          // the hand direction turned toward the forearm to 60°: the wrist moves behind the fist along it
          let perp = sub(hd, mul(fw, c)); const pl = len(perp); perp = pl > 1e-5 ? mul(perp, 1 / pl) : [0, 1, 0];
          const h2 = add(mul(fw, Math.cos(MAXW)), mul(perp, Math.sin(MAXW)));
          P['wr' + s] = madd(ha, h2, -len(sub(ha, wr)));
        }
      }
    }
  }
  // the drawn toe point of a 20-joint foot (world 2D). Seen from the side a foot reads by its pitch (heel-toe roll, a
  // push-off, toes hanging in a step): the drawn foot keeps the recorded pitch and always points the way the body faces
  // — a recorded foot that turns through the camera's line swung the drawn one from back to front in a frame, and one
  // pointing into the picture was drawn full length along a sliver. The toe is never drawn under the floor.
  function footTip(rg, P, pr, s) {
    const ft = P['ft' + s], to = P['to' + s], a = pr(ft), full = L20.toe * a.s, face = (rg.dir || 1) * (rg.flip || 1);
    let pitch = P['pitch' + s] != null ? P['pitch' + s] : Math.atan2(to[1], Math.hypot(to[0], to[2]));
    const fl = Math.max(a.y, 0) - a.y; if (Math.sin(pitch) * full > fl) pitch = Math.asin(clamp(fl / full, -1, 1));
    return { x: a.x + face * Math.cos(pitch) * full, y: a.y + Math.sin(pitch) * full, r: 1 };
  }
  Mo.footTip = (rg, s) => { const P = rg.P; if (!P || !P.chest) return null; return footTip(rg, P, projector(rg), s); };
  function readableTorso(P) {
    const h = P.hip, v = sub(P.neck, h), Lv = len(v) || 1, xy = Math.hypot(v[0], v[1]);
    if (xy < 0.8 * Lv) {
      // the target: the same direction across the picture (or straight up when there is none), depth 0.6
      let dx = v[0], dy = v[1]; if (Math.hypot(dx, dy) < 1e-3) { dx = 0; dy = -1; }
      const m = Math.hypot(dx, dy); dx /= m; dy /= m;
      const t = norm([dx * 0.8, dy * 0.8, Math.sign(v[2] || 1) * 0.6]), a = norm(v);
      const ax = cross(a, t), sa = len(ax);
      if (sa > 1e-5) rotAbout(P, h, mul(ax, 1 / sa), Math.atan2(sa, dot(a, t)), UPPER);
    }
    // shoulders below the neck point along the spine (never up round the chin); the arm keeps its hand
    let sx = P.neck[0] - h[0], sy = P.neck[1] - h[1]; const sl2 = Math.hypot(sx, sy) || 1; sx /= sl2; sy /= sl2;
    for (const s of ['R', 'L']) {
      const sh = P['sh' + s], over = (sh[0] - P.neck[0]) * sx + (sh[1] - P.neck[1]) * sy + 2; // (+: past the neck point along the spine)
      if (over > 0) {
        P['sh' + s] = [sh[0] - sx * over, sh[1] - sy * over, sh[2]];
        const r = ik3(P['sh' + s], P['ha' + s], L.uArm, L.fArm, sub(P['el' + s], lerp(P['sh' + s], P['ha' + s], 0.5)));
        P['el' + s] = r.m; P['ha' + s] = r.e;
      }
    }
    // the head out on its neck, above the shoulders
    let hd = sub(P.head, P.neck);
    if (Math.hypot(hd[0], hd[1]) < 0.4 * HEAD) { hd = [hd[0], -Math.sqrt(Math.max(0, HEAD * HEAD - hd[0] * hd[0] - hd[2] * hd[2] * 0.25)), hd[2] * 0.5]; P.head = add(P.neck, hd); }
    // (out along the spine: above the shoulders when upright, in front of them when bent forward; measured as DRAWN —
    // the perspective lifts a near shoulder — and clear of the chest's core, hip to 10 under the neck, by 21)
    const pj = (q) => { const k = Mo.cam / (Mo.cam - q[2]); return [q[0] * k, q[1] * k]; };
    const H2 = pj(P.hip), N2 = pj(P.neck);
    let ax = N2[0] - H2[0], ay = N2[1] - H2[1]; const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
    const along = (q) => q[0] * ax + q[1] * ay;
    const kh = Mo.cam / (Mo.cam - P.head[2]);
    for (let it = 0; it < 4; it++) {
      const hd2 = pj(P.head);
      let need = Math.max(along(pj(P.shR)), along(pj(P.shL))) + 0.9 * HEADR + 1 - along(hd2);
      const ex = N2[0] - ax * 10, ey = N2[1] - ay * 10, vx = ex - H2[0], vy = ey - H2[1], l2 = vx * vx + vy * vy || 1;
      const t = clamp(((hd2[0] - H2[0]) * vx + (hd2[1] - H2[1]) * vy) / l2, 0, 1), dc = Math.hypot(hd2[0] - H2[0] - vx * t, hd2[1] - H2[1] - vy * t);
      need = Math.max(need, 21 - dc);
      if (need <= 0.05) break;
      P.head = [P.head[0] + (ax * need) / kh, P.head[1] + (ay * need) / kh, P.head[2]];
    }
  }
  const LEGW = 1.43; // (tan 55°: a standing leg's foot is at most this far out per unit under the hip)
  // (what touches the floor when the body lies on it: feet, knees, the hip, the back, the head, hands)
  const FLOOR_R2 = [['ftR', 0], ['ftL', 0], ['knR', 6], ['knL', 6], ['hip', 12], ['neck', 10], ['head', 13], ['shR', 7], ['shL', 7], ['elR', 5], ['elL', 5], ['haR', 4], ['haL', 4]];
  // how far each drawn part reaches round its joint (the floor check above); feet: none (they stand on it)
  const FLOOR_R = [['head', 13], ['neck', 10], ['hip', 12], ['shR', 7], ['shL', 7], ['elR', 5], ['elL', 5], ['haR', 4], ['haL', 4], ['knR', 7], ['knL', 7]];
  const ALLJ = ['hip', 'hipR', 'hipL', 'knR', 'ftR', 'knL', 'ftL', 'neck', 'head', 'shR', 'shL', 'elR', 'haR', 'elL', 'haL', 'chest', 'wrR', 'wrL'];
  function copyFrame(a, o) {
    o.hip = a.hip.slice(); o.A = a.A.slice();
    for (const k of DK) o.d[k] = a.d[k].slice();
    o.tw = a.tw; o.sw = a.sw; o.cR = a.cR; o.cL = a.cL; o.inside = a.inside; o.armed = a.armed; o.fistR = a.fistR; o.fistL = a.fistL; o.vis = a.vis;
    return o;
  }
  Mo.Rig = Rig;
  Mo.newFrame = newFrame; Mo.sample = sample; Mo.ik3 = ik3; Mo.L = L;
  Mo.v = { add, sub, mul, madd, dot, cross, len, norm, lerp, nlerp };

  // the rig's cloth (hair, ribbon, sash) moves like the fighter's own: a puppet with the fighter's ropes
  function makePuppet(look) {
    const FP = ND.Fighter && ND.Fighter.prototype;
    if (!FP || !look) return null;
    const p = Object.create(FP);
    p.ch = look.ch; p.col = look.col; p.wpn = look.wpn; p.trail = []; p.state = 'move'; p.atk = null; p.st = 0; p.dead = false; p.vx = 0;
    const A = look.ch.acc, R = ND.Rope;
    p.tails = A === 'akane' ? [new R(9, 7.5), new R(6, 6.5)] : A === 'ponytail' ? [new R(9, 6.5)] : A === 'scarf' ? [new R(12, 7.5), new R(9, 7)] : A === 'kasa' ? [new R(4, 6)] : A === 'monk' || A === 'kabuto' ? [new R(5, 6)] : [new R(7, 7), new R(6, 7.5)];
    p.sash = new R(5, 7);
    p.bladeActive = () => false;
    return p;
  }

  // ------------------------------------------------------------ drawing
  Mo.cam = 320;
  // local 3D → world 2D, perspective round the rig (cy: the height the camera looks at)
  function projector(rg) {
    // (the vertical perspective pivots on the floor: a foot on the floor stays on it at any depth — the floor is one line)
    const dir = rg.dir, cx = rg.x, cy = 0, cam = Mo.cam;
    return (p) => {
      const s = cam / (cam - p[2]);
      const wx = rg.x + p[0] * dir;
      return { x: cx + (wx - cx) * s, y: cy + (p[1] - cy) * s, s };
    };
  }
  // a local 3D point of the rig → world 2D (as drawn)
  Mo.project = (rg, p) => projector(rg)(p);
  Mo.projectorOf = projector; // (one projector for many points: the duel's blade search, js/mocap-duel.js)
  // depth25's helpers take {x, y, z} points and a projector pr(p, zN)
  const o3 = (a) => ({ x: a[0], y: a[1], z: a[2] });
  const J2 = (q) => ({ x: q.x, y: q.y });
  // ------------------------------------------------------------ the champions' own weapons (js/characters.js type)
  // A katana (and the nodachi, kodachi, ninjatō) is the 3D katana (js/depth25.js). Every other weapon is drawn with the
  // normal game's own art (js/skeleton.js drawSword: the naginata, the bō, the kusarigama, the tessen, the yumi and its
  // tantō, the twin tantō), laid along the recorded blade's direction as the picture shows it, at the hand's depth
  // scale. The left hand: on the pole for the naginata and the bō (two hands along it), on the handle for a sword; free
  // for the twin weapons (the second tantō / fan in it), the kusarigama (the chain) and the bow (the string).
  // the second weapon in the left hand, as drawn: the twin tanto in reverse grip back along the forearm, the second fan
  // beyond the hand - turned by rg.secA and drawn rg.secQ of its length (the duel keeps it off the bodies, js/mocap-duel.js
  // secondStop); { h: the hand (picture), ang, L: its drawn length, q }
  Mo.secondLine = (rg, wpn) => {
    const P = rg.P, pr = projector(rg), e = pr(P.elL), h = pr(P.haL), sgn = rg.dir < 0 ? -1 : 1, q = rg.secQ || 1;
    const ang = (wpn.type === 'tessen' ? Math.atan2(h.y - e.y, h.x - e.x) - sgn * 0.3 : Math.atan2(e.y - h.y, e.x - h.x) + sgn * 0.25) + (rg.secA || 0);
    return { h, ang, q, L: (wpn.type === 'tessen' ? wpn.blade * 0.94 : wpn.blade) * (h.s || 1) * q, spread: Mo.fanSpread(rg, wpn, 'B') };
  };
  // an open fan's half angle either side of its line (js/skeleton.js drawTessen: (0.14 + open * 2.35) / 2): 'F' the fan in
  // the sword hand (look.j.wFan), 'B' the second one (wFanB); 0 for any other weapon
  Mo.fanSpread = (rg, wpn, w) => { if (!wpn || wpn.type !== 'tessen') return 0; const j = (rg.look && rg.look.j) || {}, o = (w === 'B' ? j.wFanB : j.wFan) || 0; return o < 0.06 ? 0 : (0.14 + o * 2.35) / 2; };
  const KATANA_T = { katana: 1, nodachi: 1, kodachi: 1, ninjato: 1 };
  const isKatana = (w) => !w || !w.type || (KATANA_T[w.type] && !w.twin);
  Mo.isKatana = isKatana;
  const POLE_T = { naginata: 1, bo: 1 };
  Mo.isPole = (w) => !!(w && POLE_T[w.type]);
  function twoHanded(w) { return isKatana(w) || !!(w && POLE_T[w.type]); }
  // (the two hands on a pole: shoulder width apart along it)
  function gripGap(w) { return w && w.type === 'bo' ? 30 : w && w.type === 'naginata' ? 34 : Math.max(GRIP2, ((w && w.handle) || 24) - 5); }

  // 2D joints for the drawn parts: which arm / leg is the near one is decided by depth
  function joints2d(rg, P, pr) {
    const j = rg.j2 || (rg.j2 = {});
    // facing: the chest's forward direction; turned past side-on → drawn from the other side (hysteresis)
    const fx = P.cf[0];
    if (rg.flip > 0 && fx < -0.25) rg.flip = -1; else if (rg.flip < 0 && fx > 0.25) rg.flip = 1;
    j.dir = rg.dir * rg.flip;
    const put = (k, p) => { const q = pr(p); const o = j[k] || (j[k] = { x: 0, y: 0 }); o.x = q.x; o.y = q.y; return q; };
    put('hip', P.hip); put('neck', P.neck); put('head', P.head);
    // near arm (bigger z) in the F slots
    const zz = zDraw(P), rNear = zz(P.elR) + zz(P.haR) >= zz(P.elL) + zz(P.haL);
    const aN = rNear ? 'R' : 'L', aF = rNear ? 'L' : 'R';
    put('sh', P['sh' + aN]); put('shB', P['sh' + aF]); put('elF', P['el' + aN]); put('haF', P['ha' + aN]); put('elB', P['el' + aF]); put('haB', P['ha' + aF]);
    const lNear = P.knR[2] + P.ftR[2] >= P.knL[2] + P.ftL[2];
    const gN = lNear ? 'R' : 'L', gF = lNear ? 'L' : 'R';
    put('hipF', P['hip' + gN]); put('hipB', P['hip' + gF]); put('knF', P['kn' + gN]); put('ftF', P['ft' + gN]); put('knB', P['kn' + gF]); put('ftB', P['ft' + gF]);
    j.hang = Math.atan2(j.head.y - j.neck.y, j.head.x - j.neck.x);
    j.armNear = aN; j.legNear = gN;
    // the 20-joint body: the chest point (the drawn torso bends there, js/skeleton.js torsoFrame), the wrists (the
    // hand bends off the forearm: armGeom), the feet's own direction (heel-toe: footFrame reads ft.tx / ft.ty)
    if (P.chest) {
      put('chest', P.chest); put('wrF', P['wr' + aN]); put('wrB', P['wr' + aF]);
      for (const [k, s] of [['ftF', gN], ['ftB', gF]]) { const t = footTip(rg, P, pr, s); j[k].tx = t.x; j[k].ty = t.y; j[k].tr = t.r; }
      // each half of the torso turns by itself: the chest with the shoulders, the pelvis with the hips
      const pf = [P.pl[2], 0, -P.pl[0]];
      j.psiC = Math.atan2(P.cf[2] * (P.mir ? -1 : 1), Math.abs(P.cf[0])); j.psiP = Math.atan2(pf[2], Math.abs(pf[0]) + 1e-6);
    } else { j.chest = null; j.wrF = j.wrB = null; j.ftF.tx = j.ftB.tx = undefined; j.ftF.tr = j.ftB.tr = undefined; j.psiC = j.psiP = null; }
    return j;
  }
  // the depth a part is DRAWN at: a body with its back to the camera (P.mir, see build) has its upper body's depth
  // mirrored round the hip, so the arms and the blade are drawn in front of it
  function zDraw(P) { const z0 = P.hip[2]; return P.mir ? (q) => 2 * z0 - q[2] : (q) => q[2]; }
  // the arm parts read the hand from j: a fist round the handle (towards the tip), a fist, or an open hand
  function armJoints(j, front, side, P, pr, rg) {
    const JA = Object.assign({}, j);
    if (!front) JA.sh = j.shB; // (the far arm turns round its own shoulder)
    const haK = front ? 'haF' : 'haB';
    const holding = side === 'R' ? P.armed : P.gripL > 0.5 && P.armed;
    const fist = side === 'R' ? P.fistR : P.fistL;
    if (holding) {
      const tp = pr(madd(P.blade.h, P.blade.u, 30));
      JA.hasSword = true; JA.fist = false; JA.tip = J2(tp);
      if (!front) { // the back hand counts as on the handle when it is within 6 of the handle line
        JA.haF = j[haK]; // (handInfo measures from haF to the tip)
      }
    } else if (side === 'L' && P.armed && rg && rg.look && rg.look.wpn && (rg.look.wpn.twin || rg.look.wpn.type === 'kusarigama' || rg.look.wpn.type === 'yumi')) {
      // (the left hand holds the second tantō / fan, the chain or the bow's string: a fist along the forearm)
      const el = j[front ? 'elF' : 'elB'], ha = j[haK];
      JA.hasSword = false; JA.fist = true; JA.tip = { x: ha.x + (ha.x - el.x) * 2, y: ha.y + (ha.y - el.y) * 2 };
    } else if (fist || (side === 'L' && P.gripL > 0.5)) {
      // a fist pointing along the forearm
      const el = j[front ? 'elF' : 'elB'], ha = j[haK];
      JA.hasSword = false; JA.fist = true; JA.tip = { x: ha.x + (ha.x - el.x) * 2, y: ha.y + (ha.y - el.y) * 2 };
    } else { const el = j[front ? 'elF' : 'elB'], ha = j[haK]; JA.hasSword = false; JA.fist = false; JA.tip = { x: ha.x + (ha.x - el.x), y: ha.y + (ha.y - el.y) }; }
    return JA;
  }

  // a rim tone against the fighter's own coat: light on a dark coat, dark on a light one (as depth25)
  const RIM = new Map();
  function rimOf(c) {
    const k = c.cloth || '#808080';
    let v = RIM.get(k);
    if (!v) { const n = parseInt(k.slice(1, 7), 16), l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; v = l < 0.3 ? 'rgba(176,186,220,.6)' : 'rgba(24,18,26,.5)'; RIM.set(k, v); }
    return v;
  }
  // the far hand not behind the back (towards where the body faces, or inside its outline)
  function farInFront(j, jB) {
    let ux = j.neck.x - j.hip.x, uy = j.neck.y - j.hip.y; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    const d = j.dir < 0 ? -1 : 1, nx = -uy * d, ny = ux * d, h = jB.haB, ax = h.x - j.hip.x, ay = h.y - j.hip.y, along = ax * ux + ay * uy;
    return ax * nx + ay * ny > -15 && along > -24 && along < ul + 40;
  }
  // the blade streak: base and tip of the blade (world 2D) while it moves fast
  function sampleTrail(rg, S, pr) {
    const T = rg.trail, b = S.blade, BL = (rg.look.wpn || L).blade;
    const tip = madd(b.h, b.u, BL), base = madd(b.h, b.u, BL * 0.25);
    const now = rg.t;
    const wt = [rg.x + tip[0] * rg.dir, tip[1]];
    const last = T.length ? T[T.length - 1] : null;
    const v = last && now > last.t ? Math.hypot(wt[0] - last.wx, wt[1] - last.wy) / (now - last.t) : 0;
    if (S.armed && !S.inside && (v > 700 || (T.length && v > 300))) {
      const pt = pr(tip), pb = pr(base);
      T.push({ t: now, wx: wt[0], wy: wt[1], tx: pt.x, ty: pt.y, bx: pb.x, by: pb.y, z: zDraw(S)(tip) });
    } else if (last) last.wx = wt[0], last.wy = wt[1], last.t = now;
    while (T.length && (now - T[0].t > 0.09 || T.length > 14)) T.shift();
    if (!S.armed || S.inside) T.length = 0;
  }
  function drawTrail(ctx, rg, front) {
    const T = rg.trail;
    if (T.length < 2) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i < T.length; i++) {
      const a = T[i - 1], b = T[i];
      if ((a.z + b.z >= 0) !== front) continue;
      const k = i / T.length;
      ctx.fillStyle = `rgba(${rg.trailCol || '220,232,255'},${(k * 0.45).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(a.bx, a.by); ctx.lineTo(a.tx, a.ty); ctx.lineTo(b.tx, b.ty); ctx.lineTo(b.bx, b.by); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(250,252,255,${(k * 0.8).toFixed(3)})`; ctx.lineWidth = 1 + 2.2 * k;
      ctx.beginPath(); ctx.moveTo(a.tx, a.ty); ctx.lineTo(b.tx, b.ty); ctx.stroke();
    }
    ctx.restore();
  }

  Mo.drawShadow = function (ctx, rg) {
    if (!rg.P) return;
    const P = rg.P, h = Math.max(0, -Math.min(P.ftR[1], P.ftL[1]));
    const x = rg.x + ((P.ftR[0] + P.ftL[0]) * 0.5 * 0.6 + P.hip[0] * 0.4) * rg.dir;
    const w = 46 * Math.max(0.4, 1 - h / 300), a = 0.5 * Math.max(0.3, 1 - h / 260);
    ctx.save(); ctx.translate(x, 2); ctx.scale(w / 50, 0.2);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
    g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.6, `rgba(0,0,0,${a * 0.55})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 50, 0, TAU); ctx.fill(); ctx.restore();
  };

  // Draw the rig with the game's parts, back to front by depth.
  Mo.draw = function (ctx, rg, opt = {}) {
    const P = rg.P;
    if (!P) return;
    Mo.stats.draws++;
    const K = ND._draw, A3 = ND.depth25, look = rg.look, c = look.col, wpn = look.wpn || L, acc = look.ch.acc;
    const pr = projector(rg), prA = (p) => pr([p.x, p.y, p.z]);
    const j = joints2d(rg, P, pr);
    // cloth (hair, ribbon, sash) on the drawn joints
    const pup = rg.puppet;
    const sheathS = !P.armed ? 1 : P.bladeVis != null ? clamp(1 - P.bladeVis / wpn.blade, 0, 1) : 0; // (how much of the blade is still in the saya)
    const bh = P.armed && !P.inside ? madd(P.blade.h, P.blade.u, HILT0) : P.blade.h; // (the guard just ahead of the fist, as depth25)
    const S = { blade: { h: o3(bh), u: o3(P.blade.u), e: o3(P.blade.e) }, sheathed: !P.armed, sheathS, saya: { a: o3(P.saya.a), u: o3(P.saya.u), L: P.saya.L } };
    if (rg.readable !== false && Mo.readable) S.minFlat = 0.75; // (a blade seen on its edge is drawn at least 0.75 of its width)
    sampleTrail(rg, P, pr);
    K.updLight();
    const D0 = K.pal(c);
    const X = { ropes: pup ? pup.ropeList() : null, wpn, acc, glint: 0 };
    const CO = c.costume && ND.costumeLayer && ND.COSTUMES && ND.COSTUMES[c.costume] ? c.costume : null;
    const fo = { wpn, st: rg.t };
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // depth of the body's middle and of each part
    const zz = zDraw(P), zT = (P.hip[2] + zz(P.neck)) * 0.5;
    const zArm = (s) => (zz(P['el' + s]) + zz(P['ha' + s])) * 0.5, zLeg = (s) => (P['kn' + s][2] + P['ft' + s][2]) * 0.5;
    const bladeMid = madd(P.blade.h, P.blade.u, wpn.blade * 0.35);
    const items = [];
    // (an arm / leg is in front of the body when its middle is nearer the camera than the body's middle)
    const scaleK = (p) => clamp(1 + (pr(p).s - 1) * 1.1, 0.8, 1.3);
    const AJ = {};
    const armItem = (s) => {
      const front = s === j.armNear;
      const jj = armJoints(j, front, s, P, pr, rg);
      const k = scaleK(P['ha' + s]) * 0.6 + scaleK(P['el' + s]) * 0.4;
      AJ[s] = { jj, k, front };
      // (opt.skipArm 'F' | 'B': leave the near / far arm out — the continuity audit measures how much of each shows)
      if (opt.skipArm === (front ? 'F' : 'B')) return () => {};
      return () => { A3.drawArmScaled(ctx, K, jj, front, c, D0, X, wpn, acc, k); if (CO) ND.costumeLayer(CO, front ? 'front' : 'backArm', ctx, jj); };
    };
    const legItem = (s) => { const front = s === j.legNear; return () => { K.torsoFrame(j); K.drawLeg(ctx, j, front, c, D0); if (front && CO) ND.costumeLayer(CO, 'hem', ctx, j); }; };
    items.push({ z: zLeg('R') - (j.legNear === 'R' ? 0 : 0.01), f: legItem('R') });
    items.push({ z: zLeg('L'), f: legItem('L') });
    items.push({ z: zArm('R') + 0.02, f: armItem('R'), arm: 'R' });
    items.push({ z: zArm('L'), f: armItem('L'), arm: 'L' });
    // the katana is drawn just under the hand that holds it, unless the blade is on the other side of the body
    const zk = P.armed ? zz(bladeMid) : P.saya.a[2];
    const fj = (look && look.j) || {}, sgn = rg.dir < 0 ? -1 : 1;
    // the champion's own weapon in the sword hand (not a katana): the normal game's art along the drawn blade
    const weapon2d = () => {
      if (Mo.noWeapon && Mo.noWeapon(rg)) return;
      const hS = madd(P.blade.h, P.blade.u, -(rg.poleSlide || 0)); // (a pole slid back through the hands: rg.poleSlide, js/mocap-duel.js)
      const h0 = pr(hS), t0 = pr(madd(hS, P.blade.u, wpn.blade)), dx = t0.x - h0.x, dy = t0.y - h0.y, dl = Math.hypot(dx, dy) || 1;
      // (fs: the share of its length the picture shows - the drawing is squeezed along the weapon by it, as the 3D katana is)
      const ang = Math.atan2(dy, dx), fs = clamp(dl / (wpn.blade * h0.s), 0.2, 1), sk = h0.s;
      const hL = pr(P.haL), tp = { x: h0.x + (dx / dl) * 30 * sk, y: h0.y + (dy / dl) * 30 * sk };
      const jw = { dir: sgn, wFs: 0, wFan: fj.wFan || 0, wFanB: fj.wFanB || 0, wBow: fj.wBow || 0, wDraw: fj.wDraw || 0, wArrow: fj.wArrow || 0, wCharge: fj.wCharge || 0, wAmmo: fj.wAmmo,
        haF: { x: h0.x, y: h0.y }, haB: { x: hL.x, y: hL.y }, tip: tp, hasSword: true };
      ctx.save(); ctx.translate(h0.x, h0.y); ctx.scale(sk, sk); if (fs < 0.995 && !(wpn.type === 'yumi' && jw.wBow > 0.5)) { ctx.rotate(ang); ctx.scale(fs, 1); ctx.rotate(-ang); } ctx.translate(-h0.x, -h0.y);
      if (wpn.type === 'yumi' && jw.wBow > 0.5) { jw.haB = { x: h0.x + (hL.x - h0.x) / sk, y: h0.y + (hL.y - h0.y) / sk }; jw.tip = { x: h0.x + (dx / dl) * 30, y: h0.y + (dy / dl) * 30 }; }
      K.drawSword(ctx, h0.x, h0.y, ang, c, 0, wpn, undefined, jw);
      ctx.restore();
    };
    // the second weapon in the left hand (twin tantō: reverse grip along the forearm; tessen: the second fan beyond it)
    const second = () => {
      if (!P.armed || P.inside || !(wpn.twin) || (Mo.noWeapon && Mo.noWeapon(rg))) return;
      const S2 = Mo.secondLine(rg, wpn), h = S2.h, sk = h.s;
      ctx.save(); ctx.translate(h.x, h.y); ctx.scale(sk, sk); ctx.translate(-h.x, -h.y);
      if (wpn.type === 'tessen') K.drawTessen(ctx, h.x, h.y, S2.ang, c, fj.wFanB || 0, wpn.blade * 0.94 * S2.q, sgn, 0);
      else { if (S2.q < 0.995) { ctx.translate(h.x, h.y); ctx.rotate(S2.ang); ctx.scale(S2.q, 1); ctx.rotate(-S2.ang); ctx.translate(-h.x, -h.y); } K.drawSword(ctx, h.x, h.y, S2.ang, c, 0, wpn); }
      ctx.restore();
    };
    // the kusarigama's chain: from the sickle's butt to the weight (rg.chain, js/mocap-duel.js)
    const chain = () => { if (wpn.type === 'kusarigama' && rg.chain && rg.chain.init && P.armed && !(Mo.noWeapon && Mo.noWeapon(rg))) ND.Chain.prototype.draw.call(rg.chain, ctx, c.accent); };
    const katana = isKatana(wpn) ? () => { A3.drawKatana3(ctx, fo, S, prA, c, 0); } : () => { weapon2d(); chain(); };
    if (wpn.twin) { const armL = items.find((i) => i.arm === 'L'); const fL = armL.f; armL.f = () => { second(); fL(); }; }
    const armR = items.find((i) => i.arm === 'R');
    const kSide = (zk >= zT) === (armR.z >= zT);
    if (P.armed && kSide) { const f0 = armR.f; armR.f = () => { drawTrail(ctx, rg, armR.z >= zT); katana(); f0(); }; }
    else if (P.armed) items.push({ z: zk, f: () => { drawTrail(ctx, rg, zk >= zT); katana(); } });
    // the torso (with the head on it); the scabbard at the far hip
    // the torso's turn shading: chest open to the camera → lit, back to it → in shadow (one band of the torso)
    const shadeBand = (TF, sp, cx0, cy0, nx, ny, clipHalf) => {
      if (Math.abs(sp) <= 0.02) return;
      ctx.save(); ctx.beginPath(); K.torsoPath(ctx); ctx.clip();
      if (clipHalf) { ctx.beginPath(); clipHalf(); ctx.clip(); }
      const ax = cx0 + nx * 20, ay = cy0 + ny * 20, bx = cx0 - nx * 20, by = cy0 - ny * 20;
      const g = ctx.createLinearGradient(ax, ay, bx, by);
      if (sp < 0) { g.addColorStop(0, `rgba(0,0,0,${(0.62 * -sp).toFixed(3)})`); g.addColorStop(0.55, `rgba(0,0,0,${(0.2 * -sp).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); }
      else { g.addColorStop(0, `rgba(255,236,214,${(0.22 * sp).toFixed(3)})`); g.addColorStop(0.6, 'rgba(255,236,214,0)'); g.addColorStop(1, `rgba(0,0,0,${(0.3 * sp).toFixed(3)})`); }
      ctx.fillStyle = g; ctx.fillRect(Math.min(ax, bx) - 60, Math.min(ay, by) - 80, Math.abs(ax - bx) + 120, Math.abs(ay - by) + 160);
      ctx.restore();
    };
    const torso = () => {
      // (20-joint body: the chest and the pelvis each widen and shade by their own turn)
      const sC = Math.sin(j.psiC != null ? j.psiC : Math.atan2(P.cf[2] * (P.mir ? -1 : 1), Math.abs(P.cf[0]))), sP = Math.sin(j.psiP != null ? j.psiP : 0);
      if (j.chest) { j.wideC = 1 + 0.3 * Math.abs(sC); j.wideP = 1 + 0.3 * Math.abs(sP); }
      K.torsoFrame(j);
      // (a long blade worn on the back keeps the drawing's own scabbard, as depth25 does)
      if (wpn.type === 'yumi' && K.quiverBack) { j.wAmmo = fj.wAmmo; K.quiverBack(ctx, j, c, D0); } // (the archer's quiver on the back, as the normal fight)
      else if (!wpn.iai && K.saya && wpn.type !== 'naginata' && wpn.type !== 'bo' && wpn.type !== 'tessen' && wpn.type !== 'kusarigama') K.saya(ctx, j, c, D0, wpn);
      if (X.ropes) for (const r of X.ropes) r.rope.draw(ctx, r.col, r.w, 'rgba(255,255,255,.07)');
      if (CO) ND.costumeLayer(CO, 'back', ctx, j);
      const TF = K.TF;
      if (!j.chest) { const wide = 1 + 0.3 * Math.abs(sC); TF.nx *= wide; TF.ny *= wide; }
      K.drawTorso(ctx, j, c, D0, acc, 15);
      if (!j.chest) shadeBand(TF, sC, (j.hip.x + j.neck.x) * 0.5, (j.hip.y + j.neck.y) * 0.5, TF.nx, TF.ny, null);
      else {
        // the line across the torso at the chest point splits it: the pelvis half below, the chest half above
        const cx0 = j.chest.x, cy0 = j.chest.y, ux = TF.ux, uy = TF.uy, R = 400;
        const half = (up) => () => { const s0 = up ? 1 : -1; ctx.moveTo(cx0 - uy * R, cy0 + ux * R); ctx.lineTo(cx0 + uy * R, cy0 - ux * R); ctx.lineTo(cx0 + uy * R + ux * R * s0, cy0 - ux * R + uy * R * s0); ctx.lineTo(cx0 - uy * R + ux * R * s0, cy0 + ux * R + uy * R * s0); ctx.closePath(); };
        shadeBand(TF, sP, (j.hip.x + cx0) * 0.5, (j.hip.y + cy0) * 0.5, TF.n1x, TF.n1y, half(false));
        shadeBand(TF, sC, (cx0 + j.neck.x) * 0.5, (cy0 + j.neck.y) * 0.5, TF.n2x, TF.n2y, half(true));
      }
      if (CO) ND.costumeLayer(CO, 'body', ctx, j);
      K.torsoFrame(j);
      K.neckPart(ctx, j, c, D0, acc);
      K.drawHead(ctx, j, c, D0, CO && ND.COSTUMES[CO].head && !ND.COSTUMES[CO].ownHead ? 'none' : acc);
      if (CO) ND.costumeLayer(CO, 'head', ctx, j);
    };
    items.push({ z: zT, f: torso });
    if (rg.showSaya && wpn.iai) {
      const sayaZ = P.saya.a[2];
      items.push({ z: Math.min(sayaZ, zT - 0.5) - 1, f: () => { A3.drawSaya3(ctx, fo, S, prA, c, D0); if (!P.armed) katana(); } });
    }
    items.sort((a, b) => a.z - b.z);
    for (const it of items) it.f();
    // the far arm never vanishes (as the duel's 2.5D drawing, js/depth25.js): drawn behind the body, its forearm and
    // hand are drawn again in front of the torso when the hand is not behind the back; a far fist on the hilt or at
    // the scabbard's mouth is drawn last, over the handle and the near arm, with a rim in the coat's opposite tone
    const fs = j.armNear === 'R' ? 'L' : 'R', far = AJ[fs];
    const farBehind = zArm(fs) < zT;
    if (far && opt.skipArm !== 'B' && farBehind && farInFront(j, far.jj)) {
      // (the whole forearm from the elbow, with a light rim 2.5 wide round it: a dark coat's arm over its own dark coat)
      const jB = far.jj, kB = far.k, e = jB.elB, h = jB.haB, ex = e.x + (h.x - e.x) * 0.05, ey = e.y + (h.y - e.y) * 0.05;
      const dx = h.x - ex, dy = h.y - ey, dl = Math.hypot(dx, dy) || 1, r = 10.5 * kB, nx = (-dy / dl) * r, ny = (dx / dl) * r;
      ctx.save(); ctx.beginPath();
      ctx.moveTo(ex + nx, ey + ny); ctx.lineTo(h.x + nx + (dx / dl) * r, h.y + ny + (dy / dl) * r);
      ctx.lineTo(h.x - nx + (dx / dl) * r, h.y - ny + (dy / dl) * r); ctx.lineTo(ex - nx, ey - ny); ctx.closePath();
      ctx.arc(h.x, h.y, r * 1.15, 0, TAU); ctx.clip();
      ctx.strokeStyle = rimOf(c); ctx.lineWidth = 15.5 * kB; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(h.x, h.y); ctx.stroke();
      A3.drawArmScaled(ctx, K, jB, false, c, D0, X, wpn, acc, kB);
      ctx.restore();
    }
    const onHilt = fs === 'L' && P.armed && !P.inside && P.gripL > 0.5, onSaya = fs === 'L' && wpn.iai && Math.hypot(...sub(P.haL, P.saya.a)) < 16;
    if (far && opt.skipArm !== 'B' && (onHilt || onSaya) && !far.front) {
      const jB = far.jj, kB = far.k, h = jB.haB;
      ctx.save(); ctx.beginPath(); ctx.arc(h.x, h.y, 6.2 * kB, 0, TAU); ctx.clip();
      ctx.fillStyle = rimOf(c); ctx.beginPath(); ctx.arc(h.x, h.y, 6.2 * kB, 0, TAU); ctx.fill();
      A3.drawArmScaled(ctx, K, jB, false, c, D0, X, wpn, acc, kB);
      ctx.restore();
    }
    ctx.restore();
  };

  // ------------------------------------------------------------ debug: the 3D skeleton as sticks (tools/mocap)
  Mo.drawSticks = function (ctx, rg, view = 'side') {
    const P = rg.P; if (!P) return;
    const pr = view === 'top' ? (p) => ({ x: rg.x + p[0] * rg.dir, y: -60 - p[2] }) : projector(rg);
    const seg = (a, b, col, w = 3) => { const p = pr(a), q = pr(b); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); };
    const R = '#ff7a5c', Lc = '#5cb8ff', C = '#ddd';
    seg(P.hipR, P.knR, R); seg(P.knR, P.ftR, R); seg(P.hipL, P.knL, Lc); seg(P.knL, P.ftL, Lc);
    seg(P.hipL, P.hipR, C); seg(P.hip, P.neck, C); seg(P.shL, P.shR, C); seg(P.neck, P.head, C);
    seg(P.shR, P.elR, R); seg(P.elR, P.haR, R); seg(P.shL, P.elL, Lc); seg(P.elL, P.haL, Lc);
    const b = P.blade, BL = (rg.look && rg.look.wpn || L).blade;
    seg(b.h, madd(b.h, b.u, P.armed ? BL : 30), '#fff', 1.5); seg(b.h, madd(b.h, b.u, -24), '#a85', 3);
    seg(P.saya.a, madd(P.saya.a, P.saya.u, P.saya.L), '#c33', 2);
    const hp = pr(P.head); ctx.strokeStyle = C; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hp.x, hp.y, 12, 0, TAU); ctx.stroke();
    for (const s of ['R', 'L']) if (rg.lock[s]) { const q = pr(P['ft' + s]); ctx.fillStyle = '#ff0'; ctx.fillRect(q.x - 3, q.y - 3, 6, 6); }
  };
})(window.ND);
