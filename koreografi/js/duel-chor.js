
















(function (ND) {
  'use strict';
  const Q = (() => { try { return location.search || ''; } catch (e) { return ''; } })();
  const M = /[?&]cinedemo=([a-z,]+)/.exec(Q);
  const D = ND.duel, G = ND.game, cam = ND.cam, fx = ND.fx;
  if (!M || !D || !D.FIN || !G || !G.saveState || !G.loadState || !ND.Fighter) return;
  const WHO = M[1].split(',').filter(Boolean);
  const FP = ND.Fighter.prototype, ATK = ND.ATK, FIN = D.FIN;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u, 0, 1));
  const CH = (D.chor = { on: true, who: WHO, cur: null, log: [], seen: new Set(), scripts: {} });









  const x = (att, m, def, o) => Object.assign({ k: 'x', att, m, def, spd: 0.55, gap: 0.12 }, o || {});
  const step = (who, d, dur) => ({ k: 'step', who, d, dur: dur || 0.35 });
  const stagger = (kb, dur) => ({ k: 'stagger', kb: kb || 230, dur: dur || 0.42 });


  CH.scripts['akane:1'] = { beats: [stagger(200, 0.3), x('V', 'd_kesaR', 'parry', { spd: 0.62, gap: 0.05 })], fin: 0.62, home: 0.22 };

  CH.scripts['akane:2'] = { beats: [stagger(), x('V', 'd_kesaR', 'parry'), x('A', 'ak_dNuki', 'block'), x('V', 'd_tsuki', 'back'),
    x('A', 'd_kiriUp', 'parry', { spd: 0.5, gap: 0.08 })] };


  CH.scripts['akane:3'] = { beats: [stagger(), x('V', 'd_kesaR', 'parry'), x('A', 'ak_dNuki', 'block'), x('V', 'd_kesaL', 'parry'),
    x('A', 'd_kiriUp', 'block', { spd: 0.5 }), x('V', 'd_tsuki', 'back'), x('A', 'd_hiza', 'hit', { spd: 0.6, gap: 0.1 })] };


  const eligible = (c) => !!(c && !c.done && !c.un && !c.crown && CH.scripts[c.key] && WHO.includes(c.A.ch.id) &&
    c.V.dz && c.V.dz.armed !== false && G.mode !== 'online' && G.mode !== 'shadow' && !(ND.net && ND.net.active));
  const keyOf = (c) => c.key + '@' + c.t0;
  CH.handled = (c) => !!(c && CH.seen.has(keyOf(c)));


  const kOf = (f, spd) => (f.ch.spd || 1) * spd;
  function plan(c, SC0, fin) {
    const S = SC0.beats, A = c.A, V = c.V, acts = [];
    let t = 0;
    const who = (w) => (w === 'A' ? A : V);
    for (const b of S) {
      if (b.k === 'stagger') { acts.push({ t, k: 'stagger', kb: b.kb }); t += b.dur; continue; }
      if (b.k === 'step') { acts.push({ t, k: 'step', f: who(b.who), d: b.d, dur: b.dur }); t += b.dur; continue; }
      const a = ATK[b.m];
      if (!a) continue;
      const att = who(b.att), def = att === A ? V : A;

      acts.push({ t, k: 'close', f: att, want: a.kind === 'kick' ? 104 : 162, dur: 0.17 });
      t += 0.18;
      const W = a.hits && a.hits.length ? a.hits : a.active ? [a.active] : [[0.1, 0.2]];
      const hit = t + W[W.length - 1][0] / kOf(att, b.spd), end = Math.min(t + (a.dur || 0.5) / kOf(att, b.spd), hit + (b.rec || 0.34));

      acts.push({ t: end, k: 'settle', f: att }, { t: end, k: 'settle', f: def });
      if (b.def !== 'hit') acts.push({ t: Math.max(0, t - 0.25), k: 'guardOn', f: def, def: b.def });
      acts.push({ t, k: 'atk', f: att, m: b.m, spd: b.spd, hold: b.def === 'back' });
      if (b.def === 'parry') acts.push({ t: hit - 0.05, k: 'tap', f: def });
      if (b.def === 'back') acts.push({ t: hit - 0.2, k: 'back', f: def, until: hit + 0.2 });
      acts.push({ t: hit - 0.01, k: 'slow', v: b.def === 'hit' ? 0.4 : 0.35, d: 0.24 });
      acts.push({ t: Math.max(hit + 0.12, end - 0.12), k: 'guardOff', f: def });
      t = end + b.gap;
    }

    const fs = SC0.fin || 0.5, hd = Math.max(SC0.home || 0.34, homeWay(c, S, fin) / 230), kf = kOf(A, fs), lead = fin.st / kf;
    acts.push({ t, k: 'home', dur: hd });
    t += hd + 0.02;
    acts.push({ t, k: 'final', spd: fs });
    const dur = t + lead;
    acts.sort((p, q) => p.t - q.t);
    return { acts, dur };
  }


  function homeWay(c, S) { let d = 0; for (const b of S) if (b.k === 'x' && b.def === 'back') d += 64; else if (b.k === 'x' && b.def === 'hit') d += 50; return d; }


  const ACTS = (ND.input && ND.input.Ctrl && ND.input.Ctrl.ACTS) || ['left', 'right', 'up', 'guard', 'light', 'heavy', 'kick', 'throw', 'dodge', 'special'];
  const MASK = {}; for (const a of ACTS) MASK[a] = true; MASK.ctx = true;
  const press = (f, a) => { f.ctrl.press(a, 'tut'); };
  const release = (f, a) => { f.ctrl.release(a, 'tut'); };
  let SB = null;
  const rngNext0 = ND.rng && ND.rng.next;

  function begin(c) {
    const S0 = CH.scripts[c.key], A = c.A, V = c.V;
    CH.seen.add(keyOf(c));
    const snap = G.saveState(), h0 = G.hashState();
    const fin = { atk: A.atk, atkName: A.atkName, keys: A.keys, aspd: A.aspd, st: A.st, x: A.x, vx: V.x, dir: A.dir, vdir: V.dir };
    const P = plan(c, S0, fin);
    SB = { c, A, V, snap, h0, fin, acts: P.acts, dur: P.dur, i: 0, c0: G.clock, timer: G.timer, ais: G.ais, masks: [A.ctrl.mask, V.ctrl.mask],
      FON: FIN.on, rt: 0, glides: [], walk: null, hpA: A.hp, hpV: V.hp };
    CH.cur = SB;

    A.dz.cine = V.dz.cine = null; A.locked = V.locked = false;
    A.dz.chain = V.dz.chain = 0; A.dz.finArm = V.dz.finArm = null;
    G.focus = null; G.cineT = 0; G.slowT = 0; G.slow = 1; G.hitstopT = 0;
    G.ais = [];
    FIN.on = false;
    for (const f of [A, V]) { f.ctrl.mask = MASK; for (const a of ACTS) release(f, a); f.posture = 0; }
    if (ND.rng) ND.rng.next = () => 0.95;

    for (const f of [A, V]) { if (f.trail) f.trail.length = 0; if (f.ghosts) f.ghosts.length = 0; }
    for (const f of [A, V]) { f.setState('move'); f.vx = f.vy = 0; f.y = 0; f.onGround = true; }
    A.dir = V.x >= A.x ? 1 : -1; V.dir = -A.dir;
  }

  function act(o) {
    const A = SB.A, V = SB.V;
    switch (o.k) {
      case 'stagger': V.setState('stagger'); V.vx = -V.dir * o.kb; return;
      case 'step': SB.glides.push({ f: o.f, x0: o.f.x, x1: o.f.x + o.f.dir * o.d, t0: SB.t, d: o.dur }); return;
      case 'close': { const f = o.f, d = Math.abs(f.opp.x - f.x); if (d > o.want + 12) SB.glides.push({ f, x0: f.x, x1: f.x + f.dir * (d - o.want), t0: SB.t, d: o.dur }); return; }
      case 'guardOn': press(o.f, 'guard'); return;
      case 'guardOff': release(o.f, 'guard'); return;
      case 'tap': release(o.f, 'guard'); press(o.f, 'guard'); return;
      case 'back': { const f = o.f; release(f, 'guard'); f.setState('dodge', { ddir: -f.dir, back: true }); SB.inv = { f, until: o.until }; SB.cap = { f, x0: f.x, serial: f.serial, max: 64 }; return; }
      case 'atk': {
        const f = o.f, a = ATK[o.m];
        f.dir = f.opp.x >= f.x ? 1 : -1;
        f.setState('atk', { atk: a, atkName: o.m, keys: [[0, f.entry]].concat(a.keys), aspd: o.spd });

        SB.pin = o.hold ? { f, x0: f.x, serial: f.serial } : null;
        return;
      }
      case 'slow': G.slowT = o.d; G.slowV = o.v; return;
      case 'settle': { const f = o.f; if (f.state === 'atk' || f.state === 'dodge') { f.setState('move'); f.vx = 0; } return; }
      case 'home': {
        const F = SB.fin;

        for (const f of [A, V]) { release(f, 'guard'); if (f.state !== 'move') f.setState('move'); }
        SB.glides.push({ f: A, x0: A.x, x1: F.x, t0: SB.t, d: o.dur, face: 1 }, { f: V, x0: V.x, x1: F.vx, t0: SB.t, d: o.dur, face: 1 });
        return;
      }
      case 'final': {
        const F = SB.fin;
        A.x = F.x; V.x = F.vx; A.dir = F.dir; V.dir = F.vdir; A.vx = V.vx = 0;
        A.setState('atk', { atk: F.atk, atkName: F.atkName, keys: [[0, A.entry]].concat(F.atk.keys), aspd: o.spd });
        SB.final = true;
        return;
      }
    }
  }

  function sandboxStep(g, tick0) {
    const S = SB, A = S.A, V = S.V;
    S.t = g.clock - S.c0;
    while (S.i < S.acts.length && S.acts[S.i].t <= S.t + 1e-9) act(S.acts[S.i++]);

    for (let i = S.glides.length - 1; i >= 0; i--) {
      const gl = S.glides[i], u = clamp((S.t - gl.t0) / Math.max(0.01, gl.d), 0, 1);
      if (gl.f.state !== 'move' && gl.f.state !== 'stagger') { S.glides.splice(i, 1); continue; }
      const nx = gl.x0 + (gl.x1 - gl.x0) * ease(u);
      gl.f.vx = (nx - gl.f.x) / Math.max(1e-4, g.STEP);
      gl.f.x = nx;
      if (gl.face) gl.f.dir = gl.f.opp.x >= gl.f.x ? 1 : -1;
      if (u >= 1) { gl.f.vx = 0; S.glides.splice(i, 1); }
    }
    g.timer = S.timer;
    for (const f of [A, V]) { f.posture = 0; f.dz.chain = 0; f.dz.finArm = null; }
    tick0.call(g, true);

    if (ND.cine) { ND.cine.rings.length = 0; ND.cine.slashes.length = 0; ND.cine.banner = null; }
    { const P = fx.parts; if (P) for (let i = P.length - 1; i >= 0; i--) if (P[i].k === 'r') P.splice(i, 1); }
    const pn = S.pin;
    if (pn) { if (pn.f.serial !== pn.serial) S.pin = null; else { const d = (pn.f.x - pn.x0) * pn.f.dir; if (d > 28) pn.f.x = pn.x0 + pn.f.dir * 28; } }
    const cp = S.cap;
    if (cp) { if (cp.f.serial !== cp.serial) S.cap = null; else { const d = (cp.x0 - cp.f.x) * cp.f.dir; if (d > cp.max) { cp.f.x = cp.x0 - cp.f.dir * cp.max; cp.f.vx = 0; } } }
    S.rt += g.STEP;
    if (g.clock - S.c0 >= S.dur || g.phase !== 'fight' || S.rt > 30) finish(g);
  }

  function finish(g) {
    const S = SB;
    SB = null; CH.cur = null;
    if (ND.rng && rngNext0) ND.rng.next = rngNext0;
    FIN.on = S.FON;
    g.ais = S.ais;
    S.A.ctrl.mask = S.masks[0]; S.V.ctrl.mask = S.masks[1];
    g.loadState(S.snap);
    const h1 = g.hashState();
    CH.log.push({ key: S.c.key, ok: h1 === S.h0, fightSecs: +S.dur.toFixed(3), realSecs: +S.rt.toFixed(3) });
    if (h1 !== S.h0) console.warn('[chor] the fight state did not come back the same', S.c.key);
  }


  const takeHit0 = FP.takeHit;
  FP.takeHit = function () {
    if (!SB) return takeHit0.apply(this, arguments);
    const hp = this.hp, gh = this.ghost, dt = this.damageTaken;
    this.hp = this.maxHp * 50;
    try { return takeHit0.apply(this, arguments); } finally { this.hp = hp; this.ghost = gh; this.damageTaken = dt; }
  };

  const isInv0 = FP.isInv;
  FP.isInv = function () { if (SB && SB.inv && SB.inv.f === this && SB.t <= SB.inv.until) return true; return isInv0.apply(this, arguments); };

  const ring0 = fx.ring;
  fx.ring = function () { if (SB) return; return ring0.apply(this, arguments); };
  const text0 = fx.text;
  fx.text = function () { if (SB) return; return text0.apply(this, arguments); };
  if (G.startLock) { const sl0 = G.startLock; G.startLock = function () { if (SB) return; return sl0.apply(this, arguments); }; }



  if (ND.props && ND.props.step) { const ps0 = ND.props.step; ND.props.step = function () { if (SB) return; return ps0.apply(this, arguments); }; }


  const tick0 = G.tick;
  G.tick = function (present = true) {
    if (SB) {
      if (present !== false && !this.simOnly) { sandboxStep(this, tick0); return; }
      finish(this);
    }
    const r = tick0.call(this, present);
    if (present !== false && !this.simOnly && CH.on && this.phase === 'fight' && this.F) {
      for (const f of this.F) {
        const c = D.finOf(f);
        if (c && c.A === f && !CH.seen.has(keyOf(c)) && eligible(c)) { begin(c); break; }
      }
    }
    return r;
  };





  function twoShot(A, V) {
    const lo = Math.min(A.x, V.x) - 112, hi = Math.max(A.x, V.x) + 112;
    const z = clamp(cam.W / (cam.s * (hi - lo)), 1.3, 2.4);
    return { x: (A.x + V.x) / 2, y: -100, z };
  }
  const follow0 = cam.follow;
  cam.follow = function (dt, fa, fb, focus) {
    const F = G.F;
    if (SB) focus = twoShot(SB.A, SB.V);
    else if (focus && F) {
      let c = null; for (const f of F) { const k = D.finOf(f); if (k && (CH.handled(k) || eligible(k))) c = k; }
      if (c) {
        focus = twoShot(c.A, c.V);
      }
    }
    return follow0.call(this, dt, fa, fb, focus);
  };
  const finFx0 = D.finFx;

  if (finFx0) D.finFx = function (k, c, o) { if ((k === 'cut' || k === 'ink') && (CH.handled(c) || eligible(c))) return false; return finFx0.call(this, k, c, o); };
})(window.ND);
