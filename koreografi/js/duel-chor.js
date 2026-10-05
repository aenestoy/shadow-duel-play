


















(function (ND) {
  'use strict';
  const Q = (() => { try { return location.search || ''; } catch (e) { return ''; } })();
  const M = /[?&]cinedemo=([a-z,]+)/.exec(Q);
  const OFF = /[?&]chor=0(&|$)/.test(Q);
  const D = ND.duel, G = ND.game, cam = ND.cam, fx = ND.fx;
  if (!D || !D.FIN || !G || !G.saveState || !G.loadState || !ND.Fighter) return;


  const WHO = M ? M[1].split(',').filter(Boolean) : null;
  const FP = ND.Fighter.prototype, ATK = ND.ATK, FIN = D.FIN;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u, 0, 1));
  const CH = (D.chor = { on: !OFF, who: WHO, cur: null, log: [], beats: [], seen: new Set(), scripts: {} });











  const x = (att, m, def, o) => Object.assign({ k: 'x', att, m, def, spd: 0.55, gap: 0.12 }, o || {});
  const c = (mA, mV, o) => Object.assign({ k: 'c', mA, mV, spd: 0.55, gap: 0.16 }, o || {});
  const step = (who, d, dur) => ({ k: 'step', who, d, dur: dur || 0.35 });
  const stagger = (kb, dur) => ({ k: 'stagger', kb: kb || 230, dur: dur || 0.42 });
  const st1 = () => stagger(200, 0.3), T1 = { fin: 0.62, home: 0.22 };

  const def = (id, t1, t2, t3) => { CH.scripts[id + ':1'] = Object.assign({ beats: [t1[0].att === 'A' ? stagger(200, 0.5) : st1()].concat(t1) }, T1); CH.scripts[id + ':2'] = { beats: [t2[0].att === 'A' ? stagger(230, 0.62) : stagger()].concat(t2) }; CH.scripts[id + ':3'] = { beats: [t3[0].att === 'A' ? stagger(230, 0.62) : stagger()].concat(t3) }; };
  const L = (o) => Object.assign({ spd: 0.62, gap: 0.05 }, o || {});
  const E8 = { gap: 0.08 };



  def('akane', [x('V', 'L1', 'parry', L())],
    [x('V', 'L1', 'parry'), x('A', 'ak_dNuki', 'block'), x('V', 'FL', 'back'), x('A', 'd_kiriUp', 'parry', { spd: 0.5, gap: 0.08 })],
    [x('V', 'L1', 'parry'), x('A', 'ak_dNuki', 'block'), x('V', 'L2', 'parry'), x('A', 'd_kiriUp', 'block', { spd: 0.5 }), x('V', 'FL', 'back'), x('A', 'd_hiza', 'hit', { spd: 0.6, gap: 0.1 })]);

  def('aoi', [x('V', 'L1', 'back', L())],
    [x('V', 'L2', 'parry'), x('A', 'FL', 'block'), x('V', 'L1', 'back'), x('A', 'L2', 'parry', E8)],
    [x('V', 'L1', 'parry'), x('A', 'L1', 'block'), c('L2', 'L2'), x('V', 'FL', 'back'), x('A', 'S2', 'block'), x('A', 'L3', 'hit', E8)]);

  def('kuro', [x('V', 'L2', 'block', L())],
    [x('V', 'L1', 'block'), x('A', 'L3', 'parry'), x('V', 'FL', 'block'), x('A', 'BH', 'back', { spd: 0.6, gap: 0.08 })],
    [x('V', 'L1', 'block'), x('A', 'L1', 'block'), x('V', 'L2', 'parry'), c('L3', 'L1'), x('A', 'H', 'back', { spd: 0.62 }), x('A', 'kick', 'hit', { spd: 0.6, gap: 0.08 })]);

  def('yuki', [x('A', 'FL', 'block', L())],
    [x('V', 'L1', 'back'), x('A', 'FL', 'parry'), x('V', 'L2', 'block'), x('A', 'L2', 'hit', E8)],
    [x('A', 'FL', 'block'), x('V', 'L1', 'back'), x('A', 'L1', 'parry'), x('V', 'L3', 'back'), c('L2', 'L2'), x('A', 'kick', 'hit', { spd: 0.6, gap: 0.08 })]);

  def('ren', [x('A', 'L2', 'block', L())],
    [x('V', 'L1', 'block'), x('A', 'L2', 'block'), x('V', 'FL', 'back'), x('A', 'L3', 'hit', E8)],
    [x('V', 'L1', 'parry'), x('A', 'FL', 'block'), x('V', 'L2', 'block'), c('L1', 'L1'), x('A', 'L1', 'block'), x('V', 'L3', 'back'), x('A', 'L3', 'hit', E8)]);

  def('kage', [x('A', 'BL', 'block', L())],
    [x('V', 'L1', 'back'), x('A', 'BL', 'block'), x('V', 'L2', 'parry'), x('A', 'L2', 'hit', E8)],
    [x('V', 'L1', 'parry'), x('A', 'BL', 'block'), x('V', 'L2', 'back'), x('A', 'L1', 'block'), c('L3', 'L1'), x('A', 'FL', 'hit', E8)]);

  def('shura', [c('L1', 'L1', { gap: 0.08 })],
    [x('V', 'L1', 'block'), x('A', 'L1', 'block'), x('V', 'FL', 'parry'), x('A', 'FL', 'hit', E8)],
    [x('V', 'L2', 'block'), x('A', 'L2', 'block'), c('L3', 'L1'), x('V', 'L1', 'back'), x('A', 'S1', 'block'), x('A', 'FL', 'hit', E8)]);

  def('tetsu', [x('A', 'FL', 'back', L())],
    [x('V', 'L1', 'block'), x('A', 'L2', 'block'), x('V', 'L2', 'parry'), x('A', 'FL', 'back', E8)],
    [x('A', 'FL', 'back'), x('V', 'L1', 'block'), x('A', 'L1', 'parry'), x('V', 'FL', 'block'), x('A', 'S1', 'block'), x('A', 'kick', 'hit', { spd: 0.6, gap: 0.08 })]);

  def('jin', [x('A', 'L1', 'block', L())],
    [x('V', 'L1', 'parry'), x('A', 'L2', 'block'), x('V', 'FL', 'back'), x('A', 'L1', 'parry', E8)],
    [x('V', 'L1', 'block'), x('A', 'L1', 'parry'), x('V', 'L2', 'back'), c('L2', 'L1'), x('A', 'S1', 'block'), x('A', 'L2', 'hit', E8)]);

  def('tsubame', [x('A', 'H', 'block', L({ spd: 0.7 }))],
    [x('V', 'L1', 'back'), x('A', 'H', 'block', { spd: 0.7 }), x('V', 'FL', 'parry'), x('A', 'L2', 'block', E8)],
    [x('V', 'L2', 'back'), x('A', 'L1', 'block'), x('V', 'L1', 'parry'), x('A', 'H', 'block', { spd: 0.7 }), x('V', 'FL', 'back'), x('A', 'kick', 'hit', { spd: 0.6, gap: 0.08 })]);

  def('hana', [x('A', 'L2', 'parry', L())],
    [x('V', 'L1', 'back'), x('A', 'FL', 'block'), x('V', 'L2', 'parry'), x('A', 'L1', 'hit', E8)],
    [x('A', 'FL', 'block'), x('V', 'L1', 'parry'), x('A', 'L2', 'block'), x('V', 'L3', 'back'), x('A', 'S1', 'block'), x('A', 'L1', 'hit', E8)]);

  def('mai', [x('V', 'L2', 'parry', L())],
    [x('V', 'L1', 'parry'), x('A', 'L1', 'block'), x('V', 'FL', 'back'), x('A', 'L3', 'block', E8)],
    [x('V', 'L1', 'back'), x('A', 'L1', 'block'), x('V', 'L2', 'parry'), x('A', 'L3', 'block'), x('V', 'FL', 'back'), x('A', 'L2', 'hit', E8)]);

  def('tora', [x('A', 'tr_l1', 'back', L())],
    [x('V', 'L1', 'block'), x('A', 'tr_l1', 'block'), x('V', 'L2', 'parry'), x('A', 'tr_s2', 'hit', E8)],
    [x('A', 'tr_l1', 'back'), x('V', 'L1', 'block'), x('A', 'tr_s1', 'block'), x('V', 'FL', 'parry'), x('A', 'tr_l3', 'block'), x('A', 'kick', 'hit', { spd: 0.6, gap: 0.08 })]);



  const knobOff = () => !!(ND.AI_KNOBS && ND.AI_KNOBS.finChor === 0);
  const eligible = (c) => !!(c && !c.done && !c.un && !c.crown && CH.on && !knobOff() && CH.scripts[c.key] && (!WHO || WHO.includes(c.A.ch.id)) &&
    c.V.dz && c.V.dz.armed !== false && c.A.dz && c.A.dz.armed !== false &&
    G.mode !== 'online' && G.mode !== 'shadow' && G.mode !== 'attract' && G.mode !== 'train' && !(ND.net && ND.net.active) && !(ND.tutor && ND.tutor.on));
  const keyOf = (c) => c.key + '@' + c.t0;
  CH.handled = (c) => !!(c && CH.seen.has(keyOf(c)));


  const kOf = (f, spd) => (f.ch.spd || 1) * spd;


  const LOG = { L1: 'light1', L2: 'light2', L3: 'light3', H: 'heavy', FL: 'fLight', BL: 'bLight', FH: 'fHeavy', BH: 'bHeavy', S1: 'str1', S2: 'str2' };
  const LOGICAL = /^(light[123]|heavy|fLight|bLight|fHeavy|bHeavy|str[12]|kick|dashHeavy)$/;
  function moveOf(f, m) {
    const n = LOG[m] || m;
    if (ATK[n] && !LOGICAL.test(n)) return n;
    const c0 = f.chainN; f.chainN = 1;
    let r = null;
    try { r = (ND.MOVES && ND.MOVES[f.ch.id] && ND.MOVES[f.ch.id](f, n)) || n; } catch (e) { r = n; } finally { f.chainN = c0; }
    if (n === 'kick' && !(ATK[r] && ATK[r].kind === 'kick' && r !== 'kick')) r = ATK.d_hiza ? 'd_hiza' : 'kick';
    const a = ATK[r];
    if (!a || a.special || !/^(blade|kick|whip|shoot|gust|feint)$/.test(a.kind || 'blade')) return 'light1';
    return r;
  }
  CH.moveOf = moveOf;
  const hitOf = (a) => (a.hits && a.hits.length ? a.hits : a.active ? [a.active] : [[0.1, 0.2]]);
  function plan(c, SC0, fin) {
    const S = SC0.beats, A = c.A, V = c.V, acts = [];
    let t = 0;
    const who = (w) => (w === 'A' ? A : V);
    for (const b of S) {
      if (b.k === 'stagger') { acts.push({ t, k: 'stagger', kb: b.kb }); t += b.dur; continue; }
      if (b.k === 'step') { acts.push({ t, k: 'step', f: who(b.who), d: b.d, dur: b.dur }); t += b.dur; continue; }
      if (b.k === 'c') {

        const mA = moveOf(A, b.mA), mV = moveOf(V, b.mV), aA = ATK[mA], aV = ATK[mV];
        if (!aA || !aV) continue;
        acts.push({ t, k: 'close', f: A, want: 150, dur: 0.17 });
        t += 0.18;
        const hA = hitOf(aA)[0][0] / kOf(A, b.spd), hV = hitOf(aV)[0][0] / kOf(V, b.spd), h = Math.max(hA, hV), hit = t + h;
        acts.push({ t: t + h - hA, k: 'atk', f: A, m: mA, spd: b.spd }, { t: t + h - hV, k: 'atk', f: V, m: mV, spd: b.spd });
        acts.push({ t: hit - 0.004, k: 'clash' }, { t: hit - 0.01, k: 'slow', v: 0.32, d: 0.3 });
        acts.push({ t: hit - 0.03, k: 'watch', f: V, att: A }, { t: hit + 0.2, k: 'check', f: V, att: A, want: 'clash', m: mA });
        const end = hit + 0.42;
        acts.push({ t: end, k: 'settle', f: A }, { t: end, k: 'settle', f: V });
        t = end + b.gap;
        continue;
      }
      const att = who(b.att), def = att === A ? V : A, m = moveOf(att, b.m), a = ATK[m];
      if (!a) continue;

      const want = b.want || (a.kind === 'kick' ? 104 : a.kind === 'shoot' ? 300 : a.kind === 'whip' ? 150 : 162);
      acts.push({ t, k: 'close', f: att, want, dur: 0.17 });
      t += 0.18;
      const W = hitOf(a);
      const hit = t + W[W.length - 1][0] / kOf(att, b.spd), end = Math.min(t + (a.dur || 0.5) / kOf(att, b.spd), hit + (b.rec || (a.kind === 'shoot' ? 0.6 : a.kind === 'whip' ? 0.5 : 0.34)));

      acts.push({ t: end, k: 'settle', f: att }, { t: end, k: 'settle', f: def });
      if (b.def !== 'hit') acts.push({ t: Math.max(0, t - 0.25), k: 'guardOn', f: def, def: b.def });
      acts.push({ t, k: 'atk', f: att, m, spd: b.spd, hold: b.def === 'back' });
      if (b.def === 'parry') acts.push({ t: hit - 0.05, k: 'tap', f: def });
      if (b.def === 'back') acts.push({ t: hit - 0.2, k: 'back', f: def, until: Math.max(hit + (a.kind === 'whip' ? 0.5 : 0.2), t + W[W.length - 1][1] / kOf(att, b.spd) + 0.12) });
      acts.push({ t: hit - 0.01, k: 'slow', v: b.def === 'hit' ? 0.4 : 0.35, d: 0.24 });
      acts.push({ t: Math.max(hit + 0.12, end - 0.12), k: 'guardOff', f: def });
      acts.push({ t: hit - 0.03, k: 'watch', f: def, att }, { t: end - 0.005, k: 'check', f: def, att, want: b.def, m });
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


  function homeWay(c, S) { let d = 0; for (const b of S) if (b.k === 'x' && b.def === 'back') d += 64; else if (b.k === 'x' && b.def === 'hit') d += 50; else if (b.k === 'c') d += 60; return d; }


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

    const sc = ND.score;
    SB.score = sc ? JSON.parse(JSON.stringify({ total: sc.total, cat: sc.cat, combo: sc.combo, comboT: sc.comboT, ring: sc.ring, style: sc.style, armed: sc.armed, t: sc.t, last: sc.last })) : null;
    SB.modHits = ND.mods ? ND.mods.hits : null;
    SB.runner = G.runner && G.runner.tick ? G.runner : null;
    if (SB.runner) { SB.runTick = SB.runner.tick; SB.runner.tick = () => {}; }

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
      case 'clash': {


        if (A.state === 'atk' && V.state === 'atk') { const P = cross(A.j, V.j) || { x: (A.x + V.x) / 2, y: Math.min(A.y, V.y) - 120 }; A.hitDone = V.hitDone = true; A.clash(P.x, P.y); }
        return;
      }
      case 'watch': SB.seen = new Set(); SB.seenA = new Set(); SB.watch = o; return;
      case 'check': {
        const d = o.f, W = SB.seen || new Set([d.state]), has = (k) => W.has(k), s0 = [...W].join('/'), ok = o.want === 'parry' ? has('parry') || (has('block') && ATK[o.m] && ATK[o.m].kind === 'kick')
          : o.want === 'block' ? (has('block') || has('parry') || (ATK[o.m] && ATK[o.m].kind === 'feint')) && !has('hurt')
            : o.want === 'back' ? !has('hurt') && !has('stagger') && !has('launch') && !has('down')
              : o.want === 'hit' ? has('hurt') || has('stagger') : o.want === 'clash' ? has('clash') && SB.seenA.has('clash') : true;
        SB.watch = null;
        CH.beats.push({ key: SB.c.key, att: o.att.ch.id, m: o.m, want: o.want, got: s0, ok });
        return;
      }
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
    if (S.watch) { S.seen.add(S.watch.f.state); S.seenA.add(S.watch.att.state); }

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
    if (S.score && ND.score) { Object.assign(ND.score, S.score); ND.score.pops.length = 0; }
    if (ND.mods && S.modHits != null) ND.mods.hits = S.modHits;
    if (S.runner) S.runner.tick = S.runTick;
    const h1 = g.hashState();
    CH.log.push({ key: S.c.key, ok: h1 === S.h0, fightSecs: +S.dur.toFixed(3), realSecs: +S.rt.toFixed(3) });
    if (h1 !== S.h0) console.warn('[chor] the fight state did not come back the same', S.c.key);
  }


  function cross(a, b) {
    if (!a || !b || !a.haF || !a.tip || !b.haF || !b.tip) return null;
    const x1 = a.haF.x, y1 = a.haF.y, x2 = a.tip.x, y2 = a.tip.y, x3 = b.haF.x, y3 = b.haF.y, x4 = b.tip.x, y4 = b.tip.y;
    const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(d) < 1e-6) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d, u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / d;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) } : null;
  }

  const flash0 = fx.flash;
  fx.flash = function (x, y, a, size, col) { if (SB) return flash0.call(this, x, y, a, (size == null ? 60 : size) * 0.35, col); return flash0.apply(this, arguments); };

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
    if (present !== false && !this.simOnly && CH.seen.size && this.F) {

      for (const k of CH.seen) if (!this.F.some((f) => { const c = D.finOf(f); return c && keyOf(c) === k; })) CH.seen.delete(k);
    }
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
