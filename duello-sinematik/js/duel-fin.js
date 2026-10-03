















(function (ND) {
  'use strict';
  const FLAG = (() => { try { return !/[?&]duel=0(&|$)/.test(location.search || ''); } catch (e) { return true; } })();
  if (!FLAG || !ND.duel || !ND.Fighter || !ND.game) return;
  const Math = ND.DM || globalThis.Math;
  const D = ND.duel, G = ND.game, FP = ND.Fighter.prototype, ATK = ND.ATK, PO = ND.POSES, pose = ND.pose, fx = ND.fx, au = ND.audio, cam = ND.cam, E = ND.M.ease;
  const { clamp } = ND.M;
  const Q = (() => { try { return location.search || ''; } catch (e) { return ''; } })();
  const OFF = /[?&]fin=0(&|$)/.test(Q);

  const FIN = D.FIN = {
    on: !OFF,
    win: 1.0,
    tierOf: (pts) => (pts <= 0 ? 0 : pts <= 2 ? 1 : pts <= 4 ? 2 : 3),
    stats: null,
  };
  const stat = (k, v = 1) => { const S = FIN.stats; if (S) S[k] = (S[k] || 0) + v; if (D.stats) D.stats['fin_' + k] = (D.stats['fin_' + k] || 0) + v; };
  const isFin = (c) => !!(c && c.fin && !c.done);
  D.finOf = (f) => (f && f.dz && isFin(f.dz.cine) ? f.dz.cine : null);















  const SC = D.FIN_SCRIPTS = {};
  const def = (id, s) => { SC[id] = s; s.ops.sort((a, b) => a.t - b.t); return s; };


  def('akane:1', {
    dur: 1.15, trig: { knock: 1, kb: 300, mul: 1.15, lift: 0.9 }, card: { k: '早抜', n: 'HAYANUKI' },
    ops: [
      { t: 0, op: 'slow', v: 0.3, d: 0.3 }, { t: 0, op: 'cam', on: 'V', z: 2.26, y: -112, cut: 1 }, { t: 0, op: 'fx', k: 'ink', a: -0.15, len: 0.23 },
      { t: 0.42, op: 'cam', on: 'A', z: 2.12, y: -118, cut: 1 },
      { t: 0.46, op: 'pose', who: 'A', keys: [[0.16, 'chiburi', 'outQuart'], [0.3, 'chiburi'], [0.6, 'ak_stance', 'inOut']] },
      { t: 0.8, op: 'sheathe' }, { t: 0.98, op: 'fx', k: 'click' },
    ] });
  def('akane:2', {
    dur: 1.9, trig: { stun: 1.6, kb: 300 }, card: { k: '燕返し', n: 'TSUBAME-GAESHI' },
    ops: [
      { t: 0, op: 'slow', v: 0.4, d: 0.22 }, { t: 0, op: 'cam', on: 'mid', z: 2.08, y: -118, cut: 1 }, { t: 0, op: 'fx', k: 'ink', a: 0.6, len: 0.16 },
      { t: 0.3, op: 'mv', m: 'ak_tsubame', spd: 0.85, hits: [{ dmg: 4, stun: 1.6, kb: 260 }, { dmg: 5, knock: 1, kb: 420, lift: 1.0 }] },
      { t: 0.36, op: 'cam', on: 'mid', z: 2.33, y: -122 }, { t: 0.36, op: 'dim', v: 0.35 },
      { t: 0.62, op: 'slow', v: 0.35, d: 0.4 }, { t: 0.62, op: 'fx', k: 'ink', a: -1.1, len: 0.20 }, { t: 0.66, op: 'fx', k: 'card' },
      { t: 0.95, op: 'cam', on: 'A', z: 2.16, y: -118, cut: 1 },
      { t: 1.05, op: 'pose', who: 'A', keys: [[0.16, 'chiburi', 'outQuart'], [0.32, 'chiburi'], [0.62, 'ak_stance', 'inOut']] },
      { t: 1.42, op: 'sheathe' }, { t: 1.62, op: 'fx', k: 'click' },
    ] });
  def('akane:3', {

    dur: 3.0, trig: { stun: 2.6, kb: 30 }, card: { k: '紅一閃', n: 'KURENAI ISSEN' },
    ops: [
      { t: 0, op: 'slow', v: 0.4, d: 0.2 }, { t: 0, op: 'cam', on: 'mid', z: 2.06, y: -118, cut: 1 },
      { t: 0.22, op: 'mv', m: 'ak_dKesa', spd: 1, hits: [{ dmg: 4, stun: 2.4, kb: 120 }] },
      { t: 0.62, op: 'glide', gap: 230, d: 0.34 }, { t: 0.62, op: 'pose', who: 'A', keys: [[0.3, 'ak_stance', 'inOutSine'], [0.6, 'ak_stance']] },
      { t: 0.66, op: 'sheathe' },
      { t: 0.72, op: 'cam', on: 'A', z: 2.59, y: -112, cut: 1 }, { t: 0.72, op: 'dim', v: 0.55 }, { t: 0.8, op: 'fx', k: 'gather' },
      { t: 1.22, op: 'mv', m: 'sp_akane', spd: 1, hits: [{ dmg: 9, stun: 1.6, kb: 0 }] },
      { t: 1.5, op: 'slow', v: 0.28, d: 0.65 }, { t: 1.5, op: 'cam', on: 'mid', z: 1.89, y: -120, cut: 1 }, { t: 1.52, op: 'fx', k: 'ink', a: -0.04, len: 0.32, w: 1.25 },
      { t: 1.62, op: 'fx', k: 'card' },
      { t: 2.05, op: 'sheathe' }, { t: 2.2, op: 'fx', k: 'click' },
      { t: 2.24, op: 'hit', h: { dmg: 3, fall: 1, kb: 110, lift: 0.45, back: 1 } },
      { t: 2.3, op: 'cam', on: 'V', z: 2.06, y: -100 },
    ] });
  def('akane:u', {
    dur: 1.6, trig: { stun: 1.5, kb: 620 }, card: { k: '掌打', n: 'SHOTEI RENDA' },
    ops: [
      { t: 0, op: 'slow', v: 0.45, d: 0.18 }, { t: 0, op: 'cam', on: 'mid', z: 2.22, y: -120, cut: 1 },
      { t: 0.2, op: 'mv', m: 'ua_palm', spd: 1.45, hits: [{ dmg: 2, stun: 1.5, kb: 480, part: 'body' }] },
      { t: 0.46, op: 'mv', m: 'ua_jab', spd: 1.3, hits: [{ dmg: 2, stun: 1.5, kb: 480, part: 'head' }] },
      { t: 0.66, op: 'mv', m: 'ua_palm', spd: 1.45, hits: [{ dmg: 2, stun: 1.5, kb: 480, part: 'head' }] },
      { t: 0.92, op: 'mv', m: 'ua_ram', spd: 1, hits: [{ dmg: 4, knock: 1, kb: 330, lift: 0.9 }] },
      { t: 1.12, op: 'slow', v: 0.35, d: 0.32 }, { t: 1.12, op: 'cam', on: 'V', z: 2.33, y: -110 }, { t: 1.14, op: 'fx', k: 'card' },
    ] });


  def('_:any', { dur: 0.9, trig: { knock: 1, kb: 300, mul: 1.1 }, ops: [{ t: 0, op: 'slow', v: 0.35, d: 0.28 }, { t: 0, op: 'cam', on: 'V', z: 2.19, y: -112, cut: 1 }, { t: 0, op: 'fx', k: 'ink', a: -0.2, len: 0.18 }] });
  const scriptKey = (f, tier) => {
    const id = f.ch.id, un = !(f.dz && f.dz.armed);
    const k = un ? id + ':u' : id + ':' + tier;
    if (SC[k]) return k;
    for (let t = tier - 1; !un && t >= 1; t--) if (SC[id + ':' + t]) return id + ':' + t;
    return '_:any';
  };
  D.finKey = scriptKey;



  const setState0 = FP.setState;
  FP.setState = function (s, extra) {
    const z = this.dz;
    if (z && FIN.on && !D._finScript) {
      const arm = z.finArm;

      if (arm && this.state === 'atk' && this.serial === arm.serial && !arm.hit) { z.finArm = null; z.chain = 0; stat('whiff'); }
    }
    const r = setState0.call(this, s, extra);
    if (z && FIN.on && s === 'atk' && !D._finScript && !isFin(z.cine)) {
      if (z.chain > 0 && !z.cine) {

        if (z.chainT <= FIN.win) { z.finArm = { serial: this.serial, pts: z.chain, hit: false }; stat('armed'); }
        else { z.finArm = null; stat('late'); }
      } else z.finArm = null;
    }
    return r;
  };

  const blocked0 = FP.blocked;
  FP.blocked = function (a, x, y, isKick, fromX) {
    const z = this.dz, arm = z && z.finArm;
    const r = blocked0.call(this, a, x, y, isKick, fromX);
    if (arm && z.finArm === arm && this.state !== 'atk') { z.finArm = null; }
    if (arm && z.finArm === arm) { z.finArm = null; z.chain = 0; stat('blocked'); }
    return r;
  };


  const takeHit0 = FP.takeHit;
  FP.takeHit = function (raw, a, from, x, y, part, kdir) {
    const V = this, z = V.dz;
    if (!z || D._finHit) return takeHit0.call(this, raw, a, from, x, y, part, kdir);

    if (isFin(z.cine)) return;
    if (z.finArm) z.finArm = null;
    const A = from, arm = A && A.dz && A.dz.finArm;
    if (arm && A.state === 'atk' && A.serial === arm.serial && canFin(A, V)) {
      arm.hit = true; A.dz.finArm = null;
      const pts = arm.pts; A.dz.chain = 0;
      return startFin(A, V, FIN.tierOf(pts), raw, a, x, y, part, kdir);
    }
    if (arm) { A.dz.finArm = null; }
    return takeHit0.call(this, raw, a, from, x, y, part, kdir);
  };

  const landHit0 = FP.landHit;
  FP.landHit = function (a, part, x, y, kdir) {
    if (this.dz && isFin(this.dz.cine)) { this.hitDone = true; return; }
    return landHit0.call(this, a, part, x, y, kdir);
  };
  function canFin(A, V) {
    return FIN.on && G.phase === 'fight' && !A.dead && !V.dead && A.dz && V.dz && !A.dz.cine && !V.dz.cine && !G.lock &&
      V.state !== 'dbind' && V.state !== 'dseq' && A.state === 'atk' && !(A.atk && A.atk.special);
  }

  function blow(c, h, trig) {
    const A = c.A, V = c.V;
    if (V.dead || A.dead) return;
    const dir = A.x <= V.x ? 1 : -1, kdir = h.back ? -dir : dir;
    const part = h.part || 'body', y = V.y - (part === 'head' ? 150 : 108), x = V.x - dir * 18;
    const kind = trig && trig.kind ? trig.kind : A.state === 'atk' && A.atk ? A.atk.kind || 'blade' : A.dz.armed ? 'blade' : 'kick';
    const a2 = { dmg: 0, post: 0, kb: h.kb || 0, stun: h.stun || 0.5, kind, knock: !!h.knock, lift: h.lift || 1, fin: true, blunt: trig ? trig.blunt : A.state === 'atk' && A.atk ? A.atk.blunt : undefined };
    const target = h.raw != null ? null : Math.max(1, Math.round((h.dmg || 0) / 100 * V.maxHp));
    const hp0 = V.hp;
    if (h.fall) {

      const t2 = Math.max(0, Math.round((h.dmg || 0) / 100 * V.maxHp));
      V.hp = Math.max(0, V.hp - t2); V.damageTaken += hp0 - V.hp; V.sinceHit = 0;
      if (V.hp <= 0) { V.die(A, a2, x, y, kdir); return; }
      V.setState('launch', { wallBounced: false }); V.onGround = false;
      V.vy = -300 * (h.lift || 1); V.vx = kdir * (h.kb || 0) * 0.75;
      fx.blood(x, y, kdir, -0.3, 14, 0.9);
      stat('knockdowns');
      return;
    }

    const raw = h.raw != null ? h.raw : Math.max(2, target / ND.dmgScale(a2) / 1.4);
    D._finHit = true;
    try { V.takeHit(raw, a2, A, x, y, part, kdir); } finally { D._finHit = false; }
    if (target != null && !V.dead) {
      const want = Math.max(0, hp0 - target);
      if (V.hp !== want) { V.damageTaken += V.hp - want; V.hp = want; V.ghost = Math.max(V.ghost, hp0); }
      if (V.hp <= 0) V.die(A, a2, x, y, kdir);
    }
    if (h.knock) stat('knockdowns');
  }


  function startFin(A, V, tier, raw, a, x, y, part, kdir) {
    const key = scriptKey(A, tier), S = SC[key];
    const c = { fin: true, tier, key, un: !A.dz.armed, t: 0, i: 0, q: [], A, V, def: A, att: V, done: false, gl: null, cam: null, mvS: -1, skip: false };
    A.dz.cine = V.dz.cine = c;
    A.locked = V.locked = true;

    c.canSkip = G.mode !== 'online' && !!(D.finCanSkip && D.finCanSkip(c)); c.t0 = ND.simClock || 0;
    stat('starts'); stat('tier' + (c.un ? 'U' : tier));

    if (ND.cine) { ND.cine.rings.length = 0; ND.cine.slashes.length = 0; ND.cine.banner = null; }
    V.ghosts.length = 0;
    for (let i = fx.texts.length - 1; i >= 0; i--) fx.texts.splice(i, 1);

    const T = S.trig || {};
    const a1 = Object.assign({}, a, { knock: !!T.knock, launch: false, spike: false, kb: T.kb != null ? T.kb : a.kb, stun: T.stun != null ? T.stun : a.stun, lift: T.lift || a.lift, onHit: undefined });
    D._finHit = true;
    try { V.takeHit(raw * (T.mul || 1), a1, A, x, y, part, kdir); } finally { D._finHit = false; }
    if (V.dead) { endFin(c); return; }
    if (D.finFx) D.finFx('start', c, { x, y });
    step(c, 0);
  }
  D.startFin = startFin;

  const easeOf = (n) => (n && E[n]) || undefined;
  const PK = [];
  function poseKeys(f, keys) {
    PK.length = 0; PK.push([0, f.entry]);
    for (const [t, p, e] of keys) PK.push([t, PO[p] || f.P[p] || PO.stance, easeOf(e)]);
    return PK;
  }

  function run(c, o) {
    const A = c.A, V = c.V;
    switch (o.op) {
      case 'mv': {
        const a = ATK[o.m];
        if (!a || A.dead) return;
        A.dir = V.x >= A.x ? 1 : -1;
        D._finScript = true;
        try { A.setState('atk', { atk: a, atkName: o.m, keys: [[0, A.entry]].concat(a.keys), aspd: o.spd || 1 }); } finally { D._finScript = false; }
        c.mvS = A.serial;

        const W = a.hits && a.hits.length ? a.hits : a.active ? [a.active] : [];
        const k = (A.ch.spd || 1) * (o.spd || 1);
        (o.hits || []).forEach((h, i) => { if (W[i]) c.q.push({ t: c.t + W[i][0] / k, h }); });
        c.q.sort((p, q) => p.t - q.t);
        return;
      }
      case 'hit': c.q.push({ t: c.t, h: o.h }); c.q.sort((p, q) => p.t - q.t); return;
      case 'pose': {
        const f = o.who === 'V' ? V : A;
        if (f.dead) return;
        D._finScript = true;
        try { f.setState(o.st || 'dfinp', { zp: PO[o.keys[o.keys.length - 1][1]] || f.P.stance, dur: 9 }); } finally { D._finScript = false; }
        f.dz.finKeys = o.keys;
        return;
      }
      case 'glide': {

        const side = A.x <= V.x ? -1 : 1, d0 = Math.abs(V.x - A.x), need = Math.max(0, o.gap - d0), L = ND.ARENA - 30;
        let ax = A.x + side * need / 2, vx = V.x - side * need / 2;
        if (Math.abs(ax) > L) { vx -= side * (Math.abs(ax) - L); ax = Math.sign(ax) * L; }
        if (Math.abs(vx) > L) { ax += side * (Math.abs(vx) - L); vx = Math.sign(vx) * L; }
        c.gl = { a0: A.x, v0: V.x, a1: ax, v1: vx, t0: c.t, d: o.d };
        return;
      }
      case 'slow': if (!c.skip) { G.slowT = o.d; G.slowV = o.v; } return;
      case 'cam':
        c.cam = { on: o.on, z: o.z, y: o.y };

        if (o.cut && !G.simOnly && !c.skip) { const x = clamp(camX(c, o.on), -ND.ARENA + 260, ND.ARENA - 260); cam.x = x; cam.y = o.y || -112; cam.z = o.z || 1.35; }
        return;
      case 'dim': if (!c.skip) G.dim = Math.max(G.dim || 0, o.v); return;
      case 'sheathe': if (A.wpn && A.wpn.iai) A.dz.drawn = false; return;
      case 'draw': A.dz.drawn = true; return;
      case 'fx': if (!c.skip && D.finFx) D.finFx(o.k, c, o); return;
    }
  }
  const camX = (c, on) => { const A = c.A, V = c.V; return on === 'A' ? A.x * 0.75 + V.x * 0.25 : on === 'V' ? V.x * 0.75 + A.x * 0.25 : (A.x + V.x) / 2; };

  function step(c, dt) {
    if (c.done) return;
    const A = c.A, V = c.V;
    if (G.phase !== 'fight' || A.dead || V.dead) { endFin(c); return; }
    c.t += dt;
    if (c.canSkip && !c.skip && c.t > 0.3 && pressedSince(c)) { skipFin(c); return; }
    const S = SC[c.key];
    while (c.i < S.ops.length && S.ops[c.i].t <= c.t + 1e-9) run(c, S.ops[c.i++]);
    while (c.q.length && c.q[0].t <= c.t + 1e-9) { const b = c.q.shift(); blow(c, b.h); if (V.dead) { endFin(c); return; } }

    for (const f of [A, V]) if (f.dz.finKeys && (f.state === 'zanshin' || f.state === 'dfinp')) { pose.seq(poseKeys(f, f.dz.finKeys), f.st, f.pose); f.vx = 0; }
    if (c.gl) {
      const g = c.gl, u = E.inOutSine(clamp((c.t - g.t0) / Math.max(0.01, g.d), 0, 1));
      A.x = g.a0 + (g.a1 - g.a0) * u; V.x = g.v0 + (g.v1 - g.v0) * u; A.vx = 0; V.vx = 0;
      if (u >= 1) c.gl = null;
    }

    if (c.cam && !c.skip) {
      const C = c.cam, x = camX(c, C.on);

      G.focus = { x: clamp(x, -ND.ARENA + 260, ND.ARENA - 260), y: C.y || -112, z: C.z || 1.35 };
    }
    if (c.t >= S.dur) endFin(c);
  }

  function pressedSince(c) {
    for (const f of [c.A, c.V]) {
      if (!(G.isHuman && G.isHuman(f)) || !f.ctrl || !f.ctrl.buf) continue;
      const b = f.ctrl.buf;
      for (const k of ['light', 'heavy', 'guard', 'kick']) if (b[k] != null && b[k] > c.t0 + 0.05) return true;
    }
    return false;
  }

  function skipFin(c) {
    if (c.done || c.skip) return;
    c.skip = true;
    const S = SC[c.key];
    while (c.i < S.ops.length) { const o = S.ops[c.i++]; if (o.op === 'mv') { const a = ATK[o.m]; const W = a && (a.hits && a.hits.length ? a.hits : a.active ? [a.active] : []); (o.hits || []).forEach((h, i) => { if (W && W[i]) c.q.push({ t: c.t, h }); }); } else if (o.op === 'hit') c.q.push({ t: c.t, h: o.h }); else if (o.op === 'sheathe' || o.op === 'draw') run(c, o); }
    let knocked = false;
    while (c.q.length) { const b = c.q.shift(); if (b.h.knock) knocked = true; blow(c, b.h); if (c.V.dead) break; }
    if (!knocked && !c.V.dead && c.V.state !== 'launch' && c.V.state !== 'down') blow(c, { dmg: 0, raw: 2, knock: 1, kb: 160, lift: 0.6 });
    G.slowT = 0; G.slow = 1; G.dim = 0;
    stat('skips');
    endFin(c);
  }
  D.skipFin = skipFin;
  function endFin(c) {
    if (c.done) return;
    c.done = true;
    const A = c.A, V = c.V;
    if (A.dz && A.dz.cine === c) A.dz.cine = null;
    if (V.dz && V.dz.cine === c) V.dz.cine = null;
    for (const f of [A, V]) {
      if (f.dz) f.dz.finKeys = null;
      if (G.phase === 'fight') f.locked = false;
      const b = f.ctrl && f.ctrl.buf; if (b) for (const k of ['light', 'heavy', 'kick', 'special', 'throw', 'dodge']) if (k in b) b[k] = null;
      if (!f.dead && (f.state === 'zanshin' || f.state === 'dfinp')) f.setState('move');
    }

    if (A.state === 'atk') A.hitDone = true;

    if (G.projs) for (const p of G.projs) if (p.owner === A && !(D.DuelSword && p instanceof D.DuelSword)) p.dead = true;
    if (G.phase === 'fight') { G.focus = null; G.cineT = 0; }
    if (D.finFx) D.finFx('end', c, null);
  }
  D.endFin = endFin;


  const upd0 = FP.update;
  FP.update = function (dt) {
    const r = upd0.call(this, dt);
    const c = this.dz && this.dz.cine;
    if (isFin(c) && c.A === this) step(c, dt);
    return r;
  };

  const passing0 = FP.passing;
  FP.passing = function () { return (this.dz && isFin(this.dz.cine)) || passing0.call(this); };

  const sheathed0 = FP.sheathed;
  FP.sheathed = function () {
    if (this.state === 'dfinp' && this.dz && this.dz.drawn === false && this.wpn && this.wpn.iai) {
      const p = this.pose, q = this.P.stance;
      return Math.abs(p.sw - q.sw) < 0.32 && Math.abs(p.ax - q.ax) + Math.abs(p.ay - q.ay) < 16 ? 1 : 0;
    }
    return sheathed0.call(this);
  };

  const isInv0 = FP.isInv;
  FP.isInv = function () { return (this.dz && isFin(this.dz.cine) && !D._finHit) || isInv0.call(this); };



  D.finDemo = (tier, who) => {
    const g = G; if (!g.F || g.phase !== 'fight') return false;
    const A = g.F.find((f) => f.ch.id === who) || g.F[0], V = A.opp;
    for (const f of g.F) { if (f.dz && f.dz.cine) { f.dz.cine = null; } f.setState('move'); f.vx = f.vy = 0; f.y = 0; f.onGround = true; f.hp = f.maxHp; }
    if (tier === 'u') { if (A.dz.armed) D.disarm(A, V, -A.dir, 'break'); }
    else if (!A.dz.armed) D.rearm(A, true);
    A.x = -60; V.x = 60; A.dir = 1; V.dir = -1;
    { const sw = D.swordOf && D.swordOf(A); if (sw && sw.resting() && Math.abs(sw.x - A.x) < 260) { sw.x = A.x - 320; sw.vx = 0; } }
    const m = A.dz.armed ? (A.wpn.iai ? 'ak_dKesa' : 'd_kesaR') : 'ua_jab';
    const a = ATK[m] || ATK.light1;
    A.setState('atk', { atk: a, atkName: m, keys: [[0, A.entry]].concat(a.keys) });
    const W = a.hits && a.hits.length ? a.hits[0] : a.active || [0.1, 0.2];
    A.st = W[0];
    A.dz.chain = 0; A.dz.finArm = null;
    startFin(A, V, tier === 'u' ? 1 : +tier, a.dmg * A.ch.dmg, a, V.x - 20, V.y - 110, 'body', 1);
    return true;
  };
})(window.ND);
