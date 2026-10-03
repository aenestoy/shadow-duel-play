




















(function (ND) {
  'use strict';
  const FLAG = (() => { try { return !/[?&]duel=0(&|$)/.test(location.search || ''); } catch (e) { return true; } })();
  if (!FLAG || !ND.Fighter || !ND.game) return;
  const Math = ND.DM || globalThis.Math;
  const { clamp, segSeg } = ND.M;
  const E = ND.M.ease;
  const PO = ND.POSES, pose = ND.pose, ATK = ND.ATK, fx = ND.fx, au = ND.audio, cam = ND.cam, G = ND.game, LEN = ND.LEN;
  const FP = ND.Fighter.prototype;
  const TAU = Math.PI * 2;
  const rnd = () => ND.rng.next();









  const ROSTER_LIST = ND.DUEL_ROSTER = ['akane', 'aoi', 'kuro', 'yuki', 'ren', 'kage', 'shura', 'tetsu', 'jin', 'tsubame', 'hana', 'mai', 'tora'];
  const ROSTER = {};
  { const q = (/[?&]duelroster=([a-z,]+)/.exec(location.search || '') || [])[1]; for (const id of q ? q.split(',') : ROSTER_LIST) ROSTER[id] = 1; }


  const MODES = { cpu: 1, watch: 1, '2p': 1, attract: 1, train: 1, arcade: 1, tourney: 1, dan: 1, rival: 1 };





  const SPQ = (/[?&]speed=([\d.]+)/.exec(location.search || '') || [])[1];
  {
    ND.timeScale = (g) => {
      if (!g || !g.F || !g.F[0] || !g.F[0].dz) return 1;
      const v = SPQ != null ? +SPQ : ND.AI_KNOBS && ND.AI_KNOBS.duelSpeed != null ? ND.AI_KNOBS.duelSpeed : typeof window !== 'undefined' && window.__duelSpeedDefault ? +window.__duelSpeedDefault : 1;
      return v >= 0.7 && v <= 1 ? v : 1;
    };
  }
  const D = ND.duel = {
    on: true, ROSTER, MODES,

    T: {
      chainNeed: 7, parryPts: 2, blockPts: 1, chainIdle: 4.5,
      bindSlow: 0.36, bindWin: [0.15, 0.43], bindEnd: 0.5, strikeDur: 0.62, strikeSlow: 0.5, escapeDur: 0.3,
      sideRate: 9, offLine: 0.75, offPost: 0.6, armChip: 2,
      pickR: 60, pickDur: 0.44, pickGrab: 0.25, punish: 1.2, breakDisarm: 0.35, rollDur: 0.44, rollInv: [0.03, 0.3],
      disarmKi: 50, comboWin: 0.42, kickCool: 2.5, uaDmg: 1.5, uaWalk: 0.18, uaKi: 1.5, chDmg: { akane: 0.8, kuro: 1.2 },
    },
    stats: null,
    env: null,
  };
  const T = D.T;
  D.active = (f) => !!(f && f.dz);
  const canDuel = (f) => !!(MODES[G.mode] && f && f.ch && ROSTER[f.ch.id] && f.opp && f.opp.ch && ROSTER[f.opp.ch.id]);
  const stat = (k, v = 1) => { const S = D.stats; if (S) S[k] = (S[k] || 0) + v; };


  function dzNew() {
    return {
      armed: true, chain: 0, chainT: 9, gs: 0, gsT: 0, bk: null, cine: null, sword: null, realWpn: null, realP: null,
      roll: 0, rollGrab: false, lastMove: null, disarmT: 0, offLine: 0, pp: pose.copy(PO.stance), oneHand: null, pickTwo: false,
    };
  }





  const FISTW = new WeakMap();
  D.fistWpn = (w) => { let p = FISTW.get(w); if (!p) { p = Object.create(w); p.fist = true; FISTW.set(w, p); } return p; };
  const solve0 = ND.solve;
  ND.solve = function (p, rx, ry, dir, j, wpn) {
    const r = solve0(p, rx, ry, dir, j, wpn);
    if (wpn && wpn.fist === true) {
      const h = r.haF, t = r.tip, dx = t.x - h.x, dy = t.y - h.y, d = Math.hypot(dx, dy) || 1;
      t.x = h.x + (dx / d) * 13; t.y = h.y + (dy / d) * 13; r.pom.x = h.x; r.pom.y = h.y;
      r.hasSword = false; r.fist = true;
    } else if (r.fist) r.fist = false;
    return r;
  };

  const UAP = new WeakMap();
  const uaP = (P) => { let q = UAP.get(P); if (!q) { q = Object.create(P); q.stance = PO.ua_stance || P.stance; q.guard = PO.ua_guard || P.guard; UAP.set(P, q); } return q; };

  function rearm(f, quiet) {
    const z = f.dz;
    if (!z || z.armed) return;
    if (z.realWpn) f.wpn = z.realWpn;
    if (z.realP) f.P = z.realP;
    f._pd = null;
    z.armed = true; z.realWpn = null; z.realP = null; z.oneHand = null; z.pickTwo = false;
    if (z.sword) { z.sword.dead = true; z.sword = null; }
    if (!quiet) {
      const j = f.j; fx.spark(j.haF.x, j.haF.y, -Math.PI / 2, 12, 0.7, '230,236,255');
      au.clang(0.5, f.pan, 1.6); au.swoosh(0.6, f.pan);
      fx.text(f.x, -215, 'SWORD BACK!', f.col.ui);
      stat('pickups'); if (D.stats && z.disarmT) { stat('unarmedTime', ND.simClock - z.disarmT); }
    }
  }

  function disarm(f, by, kx, how) {
    const z = f.dz;
    if (!z || !z.armed || f.dead) return false;
    const j = f.j, h = j.haF, t = j.tip;
    const ang = Math.atan2(t.y - h.y, t.x - h.x);
    const side = how === 'bind' ? (rnd() < 0.55 ? -f.dir : f.dir) : kx || -f.dir;
    const sp = how === 'bind' ? ND.rng.range(170, 320) : how === 'tech' ? ND.rng.range(140, 280) : ND.rng.range(220, 380);
    const vy = how === 'bind' ? ND.rng.range(-860, -740) : ND.rng.range(-760, -600);
    const va = (rnd() < 0.5 ? -1 : 1) * ND.rng.range(13, 19);
    const s = new DuelSword(f, h.x, h.y, ang, side * sp, vy, va);
    G.projs.push(s);
    z.armed = false; z.sword = s; z.realWpn = f.wpn; z.realP = f.P; z.disarmT = ND.simClock;


    z.oneHand = z.realWpn && z.realWpn.twin ? 'R' : null;
    f.wpn = D.fistWpn(f.wpn); f.P = uaP(f.P); f._pd = null; f.counterUntil = 0;
    f.wpn.none = true;
    ND.solve(f.pose, f.x, f.y, f.dir, f.j, f.wpn);

    fx.spark(h.x, h.y, -Math.PI / 2, 26, 1.4, '255,236,190'); fx.ring(h.x, h.y, '255,240,210', 120); fx.flash(h.x, h.y, ang, 110, '255,240,210');
    au.clang(1.5, f.pan, 0.8); if (au.kShing) au.kShing(f.pan); au.taiko(1.2);
    fx.text(f.x, -232, 'DISARMED!', '#ff9b7a');
    cam.punch(10);
    G.slowT = Math.max(G.slowT || 0, 0.55); G.slowV = Math.min(G.slowV || 1, 0.42);
    G.cineT = Math.max(G.cineT || 0, 0.7); G.cineX = (f.x + (by ? by.x : f.x)) / 2; G.cineZ = Math.max(G.cineZ || 0, 1.4);
    stat('disarms'); stat('disarm_' + how);
    if (D.onDisarm) D.onDisarm(f, by, how);
    return true;
  }
  D.disarm = disarm; D.rearm = rearm;






  class DuelSword {
    constructor(owner, x, y, ang, vx, vy, va) {
      const W = owner.wpn && owner.wpn.fist ? Object.getPrototypeOf(owner.wpn) : owner.wpn;
      this.owner = owner; this.bl = W.blade; this.hl = W.handle || 24;
      this.x = x; this.y = y; this.ang = ang; this.vx = vx; this.vy = vy; this.va = va;
      this.mode = 'fly'; this.t = 0; this.stuck = false; this.falling = true; this.dead = false; this.wob = 0; this.bounces = 0;
      this.rot = 77000;
    }

    pt(u, o) { o.x = this.x + Math.cos(this.ang) * this.bl * u; o.y = this.y + Math.sin(this.ang) * this.bl * u; return o; }

    grip(o) { return this.pt(-0.12, o); }
    resting() { return this.mode !== 'fly'; }
    update(h) {
      this.t += h;
      const A = ND.ARENA - 24;
      if (this.mode === 'stuck') { this.wob *= Math.exp(-5 * h); this.rot = 77000 + this.norm(); return; }
      if (this.mode === 'rest') {
        if (this.vx !== 0) {
          this.vx *= Math.exp(-5.5 * h); this.x += this.vx * h;
          if (Math.abs(this.vx) < 6) this.vx = 0;
          this.wall(A);
        }
        this.rot = 77000 + this.norm();
        return;
      }
      this.vy += 1900 * h; this.x += this.vx * h; this.y += this.vy * h; this.ang += this.va * h;
      this.wall(A);

      const c = Math.cos(this.ang), s = Math.sin(this.ang);
      const ty = this.y + s * this.bl, py = this.y - s * this.hl;
      if (ty > 0 || py > 0) {
        const tipLow = ty >= py, vyEnd = this.vy + (tipLow ? c * this.bl : -c * this.hl) * this.va;
        if (tipLow && vyEnd > 380 && s > 0.62 && this.bounces === 0) {

          this.mode = 'stuck'; this.vx = this.vy = this.va = 0; this.wob = 1;
          this.y = 15 - s * this.bl;
          fx.spark(this.x + c * this.bl, -2, -Math.PI / 2, 8, 0.6, '230,220,200'); fx.dust(this.x + c * this.bl, 0, 6, 0.6);
          au.clang(0.7, cam.pan(this.x), 1.9); au.thud(0.5, cam.pan(this.x));
          stat('swordStuck');
          return;
        }

        const over = Math.max(ty, py);
        this.y -= over;
        this.vy = -Math.abs(this.vy) * 0.3; this.vx *= 0.62; this.va *= 0.45; this.bounces++;
        if (this.bounces < 4) { au.tick(cam.pan(this.x)); fx.dust(this.x, 0, 3, 0.4); }
        if (Math.abs(this.vy) < 140 || this.bounces > 3) {

          this.ang = c >= 0 ? 0 : Math.PI; this.y = -4; this.vy = 0; this.va = 0; this.mode = 'rest';
          au.clang(0.35, cam.pan(this.x), 2.2);
        }
      }
      this.rot = 77000 + this.norm();
    }
    norm() { let a = this.ang % TAU; if (a < 0) a += TAU; return a; }
    wall(A) {

      const c = Math.cos(this.ang);
      const lo = Math.min(this.x, this.x + c * this.bl, this.x - c * this.hl), hi = Math.max(this.x, this.x + c * this.bl, this.x - c * this.hl);
      if (lo < -A) { this.x += -A - lo; if (this.vx < 0) this.vx = -this.vx * 0.4; }
      if (hi > A) { this.x -= hi - A; if (this.vx > 0) this.vx = -this.vx * 0.4; }
    }

    kick(kx, power) {
      this.kt = ND.simClock;
      this.mode = 'fly'; this.bounces = 1; this.vx = kx * power; this.vy = -ND.rng.range(240, 360); this.va = kx * ND.rng.range(9, 14);
      if (this.y > -20) this.y = -20;
      fx.spark(this.x, this.y, -Math.PI / 2, 10, 0.7, '240,230,210'); au.clang(0.6, cam.pan(this.x), 1.7);
      fx.text(this.x, -150, 'KICKED AWAY!', '#d9dbe6');
      stat('swordKicks');
    }
    draw(ctx) { DuelSword.drawAt(ctx, this.x, this.y, this.rot, this.owner, this.mode === 'stuck' ? this.wob : 0, this.mode); }
  }
  DuelSword.prototype.k = 'duelSword';

  DuelSword.drawAt = function (ctx, x, y, rot, owner, wob, mode) {
    const ang = (rot - 77000) + Math.sin(ND.scene.t * 42) * (wob || 0) * 0.06;
    const W = owner ? (owner.dz && owner.dz.realWpn) || (owner.wpn && owner.wpn.fist ? Object.getPrototypeOf(owner.wpn) : owner.wpn) : LEN;
    const col = owner ? owner.col : null;
    if (D.drawSwordMark && mode !== 'fly') D.drawSwordMark(ctx, x, y, ang, owner);
    ND.drawSword(ctx, x, y, ang, col || { accent: '#888', accentDark: '#444' }, 0, W);
  };
  D.DuelSword = DuelSword;
  if (ND.projSkins) ND.projSkins[77] = (ctx, p) => DuelSword.drawAt(ctx, p.x, p.y, p.rot, null, 0, 'rest');
  const PT = { x: 0, y: 0 }, PT2 = { x: 0, y: 0 };
  D.swordOf = (f) => (f.dz && f.dz.sword && !f.dz.sword.dead ? f.dz.sword : null);

  D.canPick = (f) => {
    const s = D.swordOf(f);
    if (!s || !s.resting() || !f.onGround) return false;
    s.grip(PT);
    return Math.abs(PT.x - f.x) < T.pickR;
  };



  function shoulder(p, o) {
    const ux = Math.sin(p.lean), uy = -Math.cos(p.lean);
    o.x = p.hx + ux * LEN.torso * 0.86; o.y = p.hy + uy * LEN.torso * 0.86; return o;
  }
  const SHO = { x: 0, y: 0 };



  function aimPose(f, out, base, cx, cy, ang, u, wpnLen) {
    pose.copy(base, out);
    const dir = f.dir, bl = wpnLen || f.wpn.blade;
    const lx = (cx - f.x) * dir, ly = cy - f.y;
    let sw = Math.atan2(Math.sin(ang), Math.cos(ang) * dir);
    const sh = shoulder(out, SHO);
    let hx = lx - Math.cos(sw) * bl * u, hy = ly - Math.sin(sw) * bl * u;
    let vx = hx - sh.x, vy = hy - sh.y;
    const reach = (LEN.uArm + LEN.fArm) * 0.94, d = Math.hypot(vx, vy);
    let miss = 0;
    if (d > reach) { vx *= reach / d; vy *= reach / d; hx = sh.x + vx; hy = sh.y + vy; }
    if (vx < 4) { vx = 4; hx = sh.x + vx; }

    const ddx = lx - hx, ddy = ly - hy, dd = Math.hypot(ddx, ddy);
    if (dd > bl * 0.12) {
      const sw2 = Math.atan2(ddy, ddx);
      const keep = Math.abs(Math.atan2(Math.sin(sw2 - sw), Math.cos(sw2 - sw)));
      if (d > reach) { miss = keep; sw = sw2; }
    }
    out.ax = vx; out.ay = vy; out.sw = sw;
    return miss;
  }
  D.aimPose = aimPose;



  const TP = {}, TJ = {};
  const THR = { x: 0, y: 0, ang: 0, h: 'mid', side: 0, t: 0, ok: false };
  function threat(f) {
    THR.ok = false;
    const o = f.opp, a = o.state === 'atk' ? o.atk : null;
    if (!a || o.dead || !a.active || !o.keys) return THR;
    if (a.kind !== 'blade' && a.kind !== 'kick') return THR;
    const W = a.hits && a.hits.length ? a.hits : [a.active], end = W[W.length - 1][1];
    if (o.st > end + 0.02) return THR;
    let w = W[0];
    for (const x of W) if (o.st <= x[1]) { w = x; break; }
    const t = Math.max(o.st + 0.01, w[0] + (w[1] - w[0]) * 0.3);
    pose.seq(o.keys, t, TP);

    let dx = 0;
    if (a.lunge) { const l0 = Math.max(a.lunge[0], o.st), l1 = Math.min(a.lunge[1], t); if (l1 > l0) dx += a.lunge[2] * (l1 - l0) / (o.ch.spd * o.aspd) * 0.85; }
    const ox = clamp(o.x + o.dir * dx, -ND.ARENA, ND.ARENA);
    const J = ND.solve(TP, ox, o.y, o.dir, TJ, o.wpn);

    const gx = f.x + f.dir * (a.thrust ? 50 : 44);
    let px, py, ang;
    if (a.kind === 'kick') {
      const L = J[a.limb || 'ftF'] || J.ftF; px = L.x; py = L.y; ang = Math.atan2(0, -f.dir);
    } else {
      const hx = J.haF.x, hy = J.haF.y, tx = J.tip.x, ty = J.tip.y;
      ang = Math.atan2(ty - hy, tx - hx);
      const den = tx - hx;
      let u = Math.abs(den) > 1e-3 ? (gx - hx) / den : 1;
      u = clamp(u, 0.35, 1);
      px = hx + (tx - hx) * u; py = hy + (ty - hy) * u;
    }


    const v = a.dz3 ? a.dz3.v : null;
    if (v === 'down') py = f.y - (a.dz3.dir === 'shomen' ? 166 : 156);
    else if (v === 'up') py = f.y - 86;
    py = clamp(py, f.y - 200, f.y - 28);
    THR.x = px; THR.y = py; THR.ang = ang; THR.t = t; THR.ok = true;
    const rel = f.y - py;
    THR.h = v === 'down' ? 'high' : v === 'up' ? 'low' : a.thrust ? 'thrust' : rel > 150 ? 'high' : rel < 78 ? 'low' : 'mid';


    let sd = a.dz3 ? a.dz3.side : 0;
    if (a.sides) { const i = W.indexOf(w); if (i >= 0 && a.sides[i] != null) sd = a.sides[i]; }
    THR.side = -sd;
    return THR;
  }
  D.threat = threat;
  const GP = {}, GB = {};
  const GSW = { high: -0.42, mid: -1.38, low: 1.22, thrust: -1.5 };
  D.GSW = GSW;

  function guardTarget(f, out, th) {
    const z = f.dz, base = f.P.guard;
    th = th || threat(f);
    if (!th.ok) { z.gsT = 0; return pose.copy(base, out); }
    z.gsT = th.side;
    pose.copy(base, GB);
    if (th.h === 'high') { GB.hy -= 3; GB.lean -= 0.08; GB.hd -= 0.06; }
    else if (th.h === 'low') { GB.hy += 13; GB.lean += 0.14; GB.f1x += 6; GB.f2x -= 4; }
    else if (th.h === 'thrust') { GB.hx -= 6; GB.lean -= 0.04; }


    const sw = GSW[th.h] ?? GSW.mid, a = Math.atan2(Math.sin(sw), Math.cos(sw) * f.dir);
    if (!z.armed) {

      aimPose(f, out, GB, th.x - f.dir * 8, th.y, a, 0.5, 26);
    } else aimPose(f, out, GB, th.x, th.y, a, th.h === 'thrust' ? 0.22 : 0.36);


    out.ax += z.gs > 0 ? z.gs * 8 : z.gs * 11; out.ay += z.gs > 0 ? z.gs * 4 : z.gs * 8;
    return out;
  }
  D.guardTarget = guardTarget;


  const reset0 = FP.reset;
  FP.reset = function (x) {
    if (this.dz && !this.dz.armed) rearm(this, true);
    const r = reset0.call(this, x);
    this.dz = canDuel(this) ? dzNew() : undefined;
    return r;
  };
  const gainKi0 = FP.gainKi;
  FP.gainKi = function (v) { return gainKi0.call(this, this.dz && !this.dz.armed ? v * T.uaKi : v); };
  const sheathed0 = FP.sheathed;



  const lastHit = (a) => { const W = a.hits && a.hits.length ? a.hits : a.active ? [a.active] : null; return W ? W[W.length - 1][1] : 0; };
  const inHit = (a, t) => { const W = a.hits && a.hits.length ? a.hits : a.active ? [a.active] : []; for (const w of W) if (t >= w[0] - 0.04 && t <= w[1]) return true; return false; };
  FP.sheathed = function () {
    if (this.wpn && this.wpn.fist) return 0;

    if (this.dz && this.dz.drawn) return 0;
    const a = this.state === 'atk' && this.dz ? this.atk : null;
    if (a && a.kind === 'blade' && this.st <= lastHit(a)) {
      const S = a.sheath;
      return S && this.st >= S[0] && this.st <= S[1] && !inHit(a, this.st) ? 1 : 0;
    }
    return sheathed0.call(this);
  };

  const passing0 = FP.passing;
  FP.passing = function () { return (this.dz && this.state === 'droll' && this.st > 0.04 && this.st < 0.34) || passing0.call(this); };
  const isInv0 = FP.isInv;
  FP.isInv = function () {
    if (this.dz) {
      const s = this.state;
      if (s === 'dbind') return true;
      if (s === 'droll' && this.st > T.rollInv[0] && this.st < T.rollInv[1]) return true;
    }
    return isInv0.call(this);
  };
  const die0 = FP.die;
  FP.die = function (from, a, x, y, kdir) {
    const unarmed = this.dz && !this.dz.armed;
    const r = die0.call(this, from, a, x, y, kdir);
    if (unarmed) this.looseSword = NOSWORD;
    return r;
  };
  const NOSWORD = { a: { x: 0, y: 0 }, b: { x: 0, y: 0 }, step() {}, draw() {} };

  const upd0 = FP.update;
  FP.update = function (dt) {
    if (!this.dz || this.dead) return upd0.call(this, dt);
    pre(this, dt);
    upd0.call(this, dt);
    if (!this.dead) post(this, dt);
  };


  function pre(f, dt) {
    const z = f.dz, c = f.ctrl, s = f.state;
    if (D.wantSeq && f.id === 0 && G.phase === 'fight' && D.startSeq) { D.wantSeq = false; D.startSeq(f, f.opp); }
    z.chainT += dt;
    if (s === 'guard') pose.copy(f.pose, z.pp);
    if (z.chain > 0 && z.chainT > T.chainIdle) z.chain = 0;
    if (f.locked || G.phase !== 'fight') return;
    if (!z.armed) {
      const free = s === 'move' || s === 'guard' || s === 'land';
      if (free && f.onGround && c.has('throw', 0.2) && D.canPick(f)) { c.take('throw'); startPick(f); return; }
      if (s === 'air' && !f.airUsed && c.has('heavy', 0.2) && f.y < -50 && f.canAtk()) { c.take('heavy'); f.airUsed = true; f.startAtk('ua_stomp'); }
    }
  }






  const CALM_D = 250, CALM_T = 1.5, ON = { atk: 1, guard: 1, block: 1, parry: 1, clash: 1, dbind: 1, dcut: 1, hurt: 1, recoil: 1, stagger: 1, gbreak: 1, launch: 1, down: 1, lock: 1, dodge: 1 };
  function drawnStep(f, dt) {
    const z = f.dz, o = f.opp, iai = !!(f.wpn && f.wpn.iai);
    if (!iai || !o) { z.drawn = false; return; }
    const hot = ON[f.state] || (o.state === 'atk' && Math.abs(o.x - f.x) < 420);

    const oBusy = !!ON[o.state];
    if (hot) { z.drawn = true; z.calmT = 0; return; }
    if (!z.drawn) return;
    if (Math.abs(o.x - f.x) > CALM_D && !oBusy && (f.state === 'move' || f.state === 'land' || f.state === 'zanshin')) {
      z.calmT = (z.calmT || 0) + dt;
      if (z.calmT >= CALM_T) { z.drawn = false; z.calmT = 0; }
    } else z.calmT = 0;
  }
  function post(f, dt) {
    const z = f.dz, s = f.state;
    drawnStep(f, dt);

    if (!z.armed && f.wpn.fist && f.wpn.none === false) { f.wpn.none = true; rearm(f, false); stat('rackRearms'); }
    if (z.propT > 0) { z.propT -= dt; G.cineT = Math.max(G.cineT || 0, 0.2); G.cineX = z.propX; G.cineZ = Math.max(G.cineZ || 0, 1.35); }
    if (s === 'dbind') { if (z.cine && z.cine.def === f) cineStep(z.cine, dt); bindPose(f); return; }
    if (s === 'dcut') { cutPose(f, dt); return; }

    { const w = z.realWpn || f.wpn; z.pickTwo = s === 'dpick' && !!(w && (w.type === 'naginata' || w.type === 'bo')); }
    if (s === 'dpick') { pickStep(f, dt); return; }
    if (s === 'droll') { rollStep(f, dt); return; }

    if (s === 'dodge' && !z.armed && !f.back && f.st <= dt + 1e-9 && rollToSword(f)) { startRoll(f); return; }

    const guarding = s === 'guard' || s === 'block' || s === 'parry';
    if (guarding) {
      const th = threat(f);
      z.gsT = th.ok ? th.side : 0;
      if (s === 'guard') {
        let tgt = guardTarget(f, GP, th);

        const oa = f.opp && f.opp.state === 'atk' ? f.opp.atk : null;
        if (!z.armed && th.ok && oa && oa.kind === 'blade' && th.t - f.opp.st < 0.14) {
          const k = evKind(th.y - f.y);
          z.evPre = { k, serial: f.opp.serial };
          tgt = PO['ua_' + k] || tgt;
        }
        if (f.st > dt + 1e-9) pose.copy(z.pp, f.pose);
        pose.approach(f.pose, tgt, 24, dt);
      } else if (s === 'block' && z.bk && z.bk.serial === f.serial) blockPose(f, dt);
      else if (s === 'block' && !z.armed && z.ev && z.ev.serial === f.serial) evadePose(f);
      const d = z.gsT - z.gs, m = T.sideRate * dt;
      z.gs += clamp(d, -m, m);
    } else z.gs *= Math.exp(-3 * dt);

    if (!z.armed && s === 'move' && f.onGround) f.x = clamp(f.x + f.vx * dt * T.uaWalk, -ND.ARENA, ND.ARENA);
    if (s === 'atk' && f.atk && (f.atk.kind === 'kick' || f.atk.trip)) kickSwords(f);
  }


  const BK0 = {}, BK1 = {};
  const blocked0 = FP.blocked;
  FP.blocked = function (a, x, y, isKick, fromX) {
    const o = this.opp;
    if (!this.dz || !o.dz) return blocked0.call(this, a, x, y, isKick, fromX);
    const att = this, tipVx = att.j.tip.x - (att.prevBlade ? att.prevBlade[2] : att.j.tip.x), tipVy = att.j.tip.y - (att.prevBlade ? att.prevBlade[3] : att.j.tip.y);

    const sd = a.sides && a.sides[att.hitIdx] != null ? a.sides[att.hitIdx] : a.dz3 ? a.dz3.side : 0, gsT = -sd;
    const sideErr = Math.abs(o.dz.gs - gsT);
    let bodyHit = false;
    if (o.j.haF && o.j.tip && o.dz.armed && !isKick) {
      const r = segSeg(o.j.haF.x, o.j.haF.y, o.j.tip.x, o.j.tip.y, x, y, x, y);
      bodyHit = r.d > 18;
    }
    const post0 = o.posture;
    const r = blocked0.call(this, a, x, y, isKick, fromX);
    const z = o.dz;
    if (o.state === 'parry' && o.st === 0) {
      z.chain += T.parryPts; z.chainT = 0; stat('parries');
      if (!o.dz.armed) { fx.text(o.x, -232, 'CATCH!', '#ffe3a1'); stat('catches'); }

      if (z.chain >= T.chainNeed && bindOk(o, att)) { if (!(D.seqPossible && D.seqPossible(o, att) && D.startSeq(o, att))) startBind(o, att); }
    } else if (o.state === 'block' && o.st === 0) {
      const off = !isKick && (sideErr > T.offLine || bodyHit) && a.kind === 'blade';
      if (off) {
        o.posture = Math.min(99, o.posture + (o.posture - post0) * T.offPost + 4);
        z.offLine++; stat('offLine');
        fx.text(o.x, -200, 'OFF-LINE!', '#ff9b7a');
      } else { z.chain += T.blockPts; z.chainT = 0; stat('cleanBlocks'); }
      if (!z.armed && a.kind === 'blade' && !isKick) {



        z.ev = { k: z.evPre && z.evPre.serial === att.serial ? z.evPre.k : evKind(y - o.y), serial: o.serial };
        stat('evades'); stat('evade_' + z.ev.k);
        fx.text(o.x, -200, z.ev.k === 'duck' ? 'DUCK!' : z.ev.k === 'slip' ? 'SLIP!' : 'SWAY!', '#bfe3ff');
      }

      if (z.armed && !isKick) {
        const th = threat(o), hh = th.ok ? th.h : y < o.y - 150 ? 'high' : y > o.y - 78 ? 'low' : 'mid';
        const gsw = GSW[hh] ?? GSW.mid, ga = Math.atan2(Math.sin(gsw), Math.cos(gsw) * o.dir);
        aimPose(o, BK0, o.pose, x, y, ga, 0.38);
        const pl = Math.hypot(tipVx, tipVy) || 1, px = clamp(tipVx / pl, -1, 1), py = clamp(tipVy / pl, -1, 1);
        pose.copy(BK0, BK1);
        BK1.ax += px * o.dir * 13; BK1.ay += py * 13; BK1.sw += 0.22 * (py * o.dir - px * 0.3); BK1.hx += px * o.dir * 3; BK1.lean -= 0.05;
        z.bk = { serial: o.serial, p0: pose.copy(BK0), p1: pose.copy(BK1), dur: o.dur };
        pose.copy(BK0, o.pose); pose.copy(BK0, o.entry);
      }

      if (a.disarm && z.armed) disarm(o, att, att.dir, 'tech');
    } else if (o.state === 'gbreak') { z.chain = 0; stat('guardBreaks'); }
    return r;
  };
  const evKind = (hy) => (hy < -138 ? 'duck' : hy > -66 ? 'slip' : 'sway');

  const EVP = {};
  function evadePose(f) {
    const P = PO['ua_' + f.dz.ev.k] || PO.ua_guard, dur = Math.max(0.12, f.dur || 0.2), t = f.st;
    if (t < 0.07) pose.lerp(f.entry, P, E.outCubic(t / 0.07), f.pose);
    else if (t < dur * 0.62) pose.copy(P, f.pose);
    else { pose.lerp(P, f.P.guard || P, E.inOutSine(clamp((t - dur * 0.62) / (dur * 0.38), 0, 1)), EVP); pose.copy(EVP, f.pose); }
  }
  function blockPose(f, dt) {
    const B = f.dz.bk, t = f.st;
    if (t < 0.055) pose.lerp(B.p0, B.p1, E.outCubic(t / 0.055), f.pose);
    else {
      const tgt = guardTarget(f, GP), u = clamp((t - 0.055) / Math.max(0.05, (B.dur || 0.2) - 0.055), 0, 1);
      pose.lerp(B.p1, tgt, E.inOutSine(u), f.pose);
    }
  }


  const CHQ = {}; { const q = (/[?&]chdmg=([a-z0-9:.,]+)/.exec(location.search || '') || [])[1]; if (q) for (const kv of q.split(',')) { const [c, v] = kv.split(':'); CHQ[c] = +v; } }
  const CPQ = {}; { const q = (/[?&]cpudmg=([a-z0-9:.,]+)/.exec(location.search || '') || [])[1]; if (q) for (const kv of q.split(',')) { const [c, v] = kv.split(':'); CPQ[c] = +v; } }
  const takeHit0 = FP.takeHit;
  FP.takeHit = function (raw, a, from, x, y, part, kdir) {
    if (!this.dz) return takeHit0.call(this, raw, a, from, x, y, part, kdir);
    const was = this.state, hp0 = this.hp, atk0 = this.atk, st0 = this.st;

    if (from && from.dz && !from.dz.armed && a && !a.special) raw *= T.uaDmg;


    if (from && from.ch && T.chDmg[from.ch.id]) raw *= T.chDmg[from.ch.id];
    if (from && from.ch && CHQ[from.ch.id]) raw *= CHQ[from.ch.id];



    { const DM = ND.AI_KNOBS && ND.AI_KNOBS.duelDmg, cm = from && from.ch && (CPQ[from.ch.id] ?? (DM && DM[from.ch.id]));
      const g = ND.game; if (cm && g && g.ais && g.ais.some((q) => q && q.me === from)) raw *= cm; }
    if (was === 'dpick') { raw *= T.punish; fx.text(this.x, -222, 'PUNISHED!', '#ff9b7a'); stat('punishedPicks'); }
    D.hitRawScaled = raw;
    const r = takeHit0.call(this, raw, a, from, x, y, part, kdir);
    D.hitRawScaled = null;
    this.dz.chain = 0;
    if (!this.dead && this.dz.armed) {

      const heavy = a && (a.heavyClass || raw >= 20) && a.kind === 'blade';
      if (was === 'gbreak' && heavy && rnd() < T.breakDisarm) disarm(this, from, kdir, 'break');


      else if (was === 'atk' && from && from.dz && !from.dz.armed && a && a.kind === 'kick' && /^(ftF|knF)$/.test(a.limb || '') &&
        atk0 && atk0.kind === 'blade' && atk0.active && st0 < atk0.active[0] && disarm(this, from, kdir, 'break')) {
        stat('kickDisarms');
      }
    }
    if (from && from.dz && D.stats && from.dz.armed !== this.dz.armed) stat(from.dz.armed ? 'asymDmgArmed' : 'asymDmgUnarmed', hp0 - this.hp);
    return r;
  };


  function kickSwords(f) {
    const a = f.atk;
    if (!f.curWin(true)) return;
    const L = f.j[a.limb || 'ftF'] || f.j.ftF;
    for (const s of G.projs) {

      if (!(s instanceof DuelSword) || !s.resting() || s.dead || s.mem === f.serial || ND.simClock - (s.kt || -9) < T.kickCool) continue;
      s.pt(1, PT); s.pt(-s.hl / s.bl, PT2);
      const r = a.kind === 'kick' ? segSeg(PT2.x, PT2.y, PT.x, PT.y, L.x, L.y, L.x, L.y) : segSeg(PT2.x, PT2.y, PT.x, PT.y, f.j.haF.x, f.j.haF.y, f.j.tip.x, f.j.tip.y);

      if (r.d < 24) { s.mem = f.serial; s.kick(Math.sign(s.x - s.owner.x) || f.dir, a.kind === 'kick' ? 560 : 380); if (s.owner === f.opp) stat('kickedAwayFromOwner'); }
    }
  }


  const PK = {};
  function startPick(f) {
    const s = D.swordOf(f);
    f.setState('dpick'); f.vx = 0;
    s.grip(PT);

    f.dir = PT.x >= f.x ? 1 : -1;
    f.dz.pickX = PT.x; f.dz.pickY = PT.y; f.dz.pickA = s.ang;
    au.swoosh(0.4, f.pan);
  }
  function pickStep(f, dt) {
    const z = f.dz, s = D.swordOf(f), t = f.st;

    const low = z.pickY > -60;
    const P0 = pose.copy(low ? PO.ua_pickLow || PO.kneel : PO.ua_pickHigh || PO.kneel, PK);

    { const sh = shoulder(P0, SHO), lx = (z.pickX - f.x) * f.dir, ly = z.pickY - f.y; let vx = lx - sh.x, vy = ly - sh.y; const d = Math.hypot(vx, vy), R = (LEN.uArm + LEN.fArm) * 0.95; if (d > R) { vx *= R / d; vy *= R / d; } P0.ax = vx; P0.ay = vy; P0.sw = Math.atan2(Math.sin(z.pickA), Math.cos(z.pickA) * f.dir); }
    if (!z.armed && s && t >= T.pickGrab) {
      s.grip(PT);
      if (Math.abs(PT.x - f.x) < T.pickR + 12 && s.resting()) {

        const la = Math.atan2(Math.sin(s.ang), Math.cos(s.ang) * f.dir);
        rearm(f, false);
        f.pose.sw = la; pose.copy(f.pose, f.entry); f.mem.got = t;
      }
    }
    if (f.mem.got != null) {
      const u = clamp((t - f.mem.got) / (T.pickDur - f.mem.got + 0.12), 0, 1);
      pose.lerp(f.entry, f.P.stance, E.outCubic(u), f.pose);
    } else pose.seq([[0, f.entry], [0.16, P0, E.outCubic], [T.pickDur, P0]], t, f.pose);
    if (t >= T.pickDur + (f.mem.got != null ? 0.1 : 0)) f.setState('move');
  }
  function rollToSword(f) {
    const sw = D.swordOf(f), d = f.ddir || f.dir;
    if (!sw || !sw.resting || !sw.resting()) return false;
    sw.grip(PT);
    const dx = (PT.x - f.x) * d;
    return dx > 20 && dx < 300;
  }
  function startRoll(f) {
    const d = f.ddir || f.dir;
    f.setState('droll', { ddir: d });
    f.dz.rollGrab = false;
    stat('rolls');
  }
  function rollStep(f, dt) {
    const z = f.dz, t = f.st, R = T.rollDur;
    const k = t < 0.3 ? 1 : Math.max(0, 1 - (t - 0.3) * 6);
    f.vx = f.ddir * 600 * k;

    const u = clamp((t - 0.04) / 0.3, 0, 1);
    f.roll = u > 0 && u < 1 ? f.ddir * f.dir * TAU * E.inOutSine(u) : 0;
    pose.seq([[0, f.entry], [0.06, PO.ua_roll || PO.dodgeF, E.outCubic], [0.32, PO.ua_roll || PO.dodgeF], [R, f.P.stance, E.inOut]], t, f.pose);

    const s = D.swordOf(f);
    if (s && s.resting() && t > 0.1 && t < 0.36) { s.grip(PT); if (Math.abs(PT.x - f.x) < 34) z.rollGrab = true; }
    if (t >= R) {
      f.roll = 0;
      if (z.rollGrab && D.swordOf(f)) { rearm(f, false); stat('rollPickups'); }
      f.setState('move');
    }
  }


  function bindOk(def, att) {


    return G.phase === 'fight' && !def.dead && !att.dead && def.onGround && att.onGround && Math.abs(def.x - att.x) < 150 &&
      !(att.state === 'atk' && att.atk.special) && !(def.dz.cine || att.dz.cine) && !G.lock;
  }
  function startBind(def, att) {
    const mid = (def.x + att.x) / 2, gap = clamp(Math.abs(def.x - att.x), 110, 150), sd = att.x >= def.x ? 1 : -1;
    const c = {
      t: 0, ph: 'bind', t2: 0, def, att, press: -1, ok: false, done: false, x: mid, y: -128,
      outcome: att.dz.armed ? 'disarm' : 'counter', b0: def.ctrl.buf.light, b1: def.ctrl.buf.heavy, flung: false,
      prop: D.env && D.env.forBind ? D.env.forBind(def, att) : null,
    };
    def.dz.cine = att.dz.cine = c;
    def.dz.chain = 0;
    for (const f of [def, att]) { f.setState('dbind'); f.vx = 0; f.vy = 0; f.counterUntil = 0; f.dir = f.opp.x >= f.x ? 1 : -1; }

    const tdx = clamp(mid - sd * gap / 2, -ND.ARENA + 30, ND.ARENA - 30), tax = clamp(tdx + sd * gap, -ND.ARENA + 30, ND.ARENA - 30);
    c.gl = [def.x, att.x, tdx, tax];
    c.x = (tdx + tax) / 2;

    const bias = clamp((att.wpn.blade - def.wpn.blade) * 0.25, -14, 14);
    c.px = c.x - sd * bias; c.py = -132;
    const dx0 = def.x, ax0 = att.x;
    def.x = tdx; att.x = tax; c.pd = bindAim(def, c, true); c.pa = bindAim(att, c, false); def.x = dx0; att.x = ax0;
    pose.copy(def.pose, def.entry); pose.copy(att.pose, att.entry);
    fx.spark(c.px, c.py, -Math.PI / 2, 22, 1.1); fx.ring(c.px, c.py, '255,240,210', 110);
    au.clang(1.3, cam.pan(c.x), 0.75); if (au.kShing) au.kShing(cam.pan(c.x));

    if (ND.cine) { ND.cine.rings.length = 0; ND.cine.slashes.length = 0; ND.cine.banner = null; }
    def.ghosts.length = 0; att.ghosts.length = 0;
    for (let i = fx.parts.length - 1; i >= 0; i--) if (fx.parts[i].k === 'r' || fx.parts[i].k === 'f') fx.parts.splice(i, 1);
    fx.texts.length = 0;
    G.slowT = Math.max(G.slowT || 0, 0.2); G.slowV = T.bindSlow; G.dim = Math.max(G.dim || 0, 0.6);
    stat('binds');
  }
  D.startBind = startBind;

  function bindAim(f, c, isDef) {
    const out = {}, base = f.dz.armed ? PO.lock : PO.ua_guard || PO.lock;
    const a0 = isDef ? -1.2 : -0.5;
    const ang = f.dir > 0 ? a0 : Math.PI - a0;
    if (f.dz.armed) aimPose(f, out, base, c.px, c.py, ang, isDef ? 0.42 : 0.5);
    else aimPose(f, out, base, c.px - f.dir * 4, c.py + 6, ang, 0.5, 26);
    return out;
  }
  function bindPose(f) {
    const c = f.dz.cine;
    if (!c) { f.setState('move'); return; }
    const isDef = c.def === f, B = isDef ? c.pd : c.pa;
    if (c.ph === 'bind') {

      const k = E.outCubic(clamp(c.t / 0.08, 0, 1)), w = Math.sin(ND.scene.t * 47 + f.id * 2) * 1.2;
      if (c.gl) f.x = isDef ? c.gl[0] + (c.gl[2] - c.gl[0]) * k : c.gl[1] + (c.gl[3] - c.gl[1]) * k;
      pose.lerp(f.entry, B, k, f.pose);
      f.pose.ax += w; f.pose.ay -= w * 0.5; f.pose.lean += 0.05 * k;
      f.vx = 0;
      if (((c.t * 40) | 0) !== c.sp && isDef) { c.sp = (c.t * 40) | 0; fx.spark(c.px, c.py, -Math.PI / 2 - f.dir * 0.4, 2, 0.45, '255,236,190'); }
    }
  }
  function cineStep(c, dt) {
    c.t += dt;
    const def = c.def, att = c.att, ctl = def.ctrl;
    G.cineT = Math.max(G.cineT || 0, 0.25); G.cineX = c.x; G.cineZ = Math.min(1.75, cam.W / (cam.s * (Math.abs(def.x - att.x) + 330 + (cam.padX || 0))));
    if (c.ph === 'bind') {
      G.slowT = Math.max(G.slowT || 0, 0.12); G.slowV = T.bindSlow; G.dim = Math.max(G.dim || 0, 0.5);
      if (c.press < 0) {
        const lb = ctl.buf.light, hb = ctl.buf.heavy;
        if ((lb != null && lb !== c.b0) || (hb != null && hb !== c.b1)) { c.press = c.t; ctl.buf.light = null; ctl.buf.heavy = null; }
      }
      if (c.press >= 0 || c.t >= T.bindWin[1]) {
        c.ok = c.press >= T.bindWin[0] && c.press <= T.bindWin[1];
        c.ph = c.ok ? 'strike' : 'escape'; c.t2 = 0;
        c.why = c.ok ? null : c.press < 0 ? 'late' : 'early';
        for (const f of [def, att]) pose.copy(f.pose, f.entry);
        if (c.ok) { stat('bindWins'); fx.text(def.x, -255, c.outcome === 'disarm' ? 'MAKI-OTOSHI!' : 'KIRI-OTOSHI!', '#ffd27a'); au.whoosh(1.4); }
        else { stat('bindFails'); fx.text(att.x, -245, c.why === 'early' ? 'TOO EARLY · ESCAPED' : 'ESCAPED', '#d9dbe6'); }
      }
      return;
    }
    c.t2 += dt;
    if (c.ph === 'strike') {
      G.slowT = Math.max(G.slowT || 0, 0.1); G.slowV = T.strikeSlow;
      strikePose(def, c, true); strikePose(att, c, false);
      if (!c.flung && c.t2 >= 0.19) {
        c.flung = true;
        if (c.outcome === 'disarm') { disarm(att, def, 0, 'bind'); att.dz.cine = c; }
        else {
          const A = { dmg: 20, post: 30, kb: 430, stun: 0.6, kind: 'blade', knock: true, counter: true };
          att.state = 'dcut';
          att.takeHit(A.dmg * def.ch.dmg, A, def, (def.x + att.x) / 2, -118, 'body', def.dir);
          stat('bindCounters');
        }
      }
      if (c.t2 >= T.strikeDur) endCine(c);
    } else if (c.ph === 'escape') {
      if (!c.shoved) {
        c.shoved = true;
        for (const f of [def, att]) { const b = f.ctrl.buf; for (const k of ['light', 'heavy', 'kick']) b[k] = null; }
        for (const f of [def, att]) { f.setState('clash'); f.vx = -f.dir * 360; }
        def.dz.cine = att.dz.cine = null; c.done = true;
        G.slowT = 0; G.slow = 1;
        au.clang(0.9, cam.pan(c.x), 1.1); fx.spark(c.px, c.py, -Math.PI / 2, 12, 0.8);
      }
    }
  }
  const SK = [];
  function strikePose(f, c, isDef) {
    if (f.dead || (f.state !== 'dbind' && f.state !== 'dcut')) return;
    const t = c.t2, P = isDef ? (f.dz.armed ? STRIKE.def : STRIKE.defUa) : STRIKE.att;

    SK[0] = [0, f.entry]; for (let i = 0; i < P.keys.length; i++) SK[i + 1] = P.keys[i]; SK.length = P.keys.length + 1;
    pose.seq(SK, t, f.pose);
    f.vx = 0;
    if (isDef && t > 0.12 && t < 0.3 && ((t * 60) | 0) % 2 === 0) f.addGhost(0.3, 'rgb(255,210,120)');
  }

  const STRIKE = {
    get def() { return this._def || (this._def = { keys: keysOf([[0.09, 'dz_makiA', E.outCubic], [0.19, 'dz_makiB', E.outQuart], [0.34, 'dz_makiC', E.outCubic], [0.62, 'ks_zanTsuki', E.inOut]]) }); },
    get defUa() { return this._du || (this._du = { keys: keysOf([[0.09, 'ua_catchA', E.outCubic], [0.19, 'ua_catchB', E.outQuart], [0.34, 'ua_palmB', E.outCubic], [0.62, 'ua_stance', E.inOut]]) }); },
    get att() { return this._att || (this._att = { keys: keysOf([[0.12, 'dz_bindPress', E.inOutSine], [0.21, 'dz_flung', E.outQuart], [0.62, 'stagger', E.inOut]]) }); },
  };
  const keysOf = (L) => L.map(([t, p, e]) => [t, PO[p] || PO.stance, e]);
  function cutPose(f) { if (f.st > 0.5) f.setState('move'); }
  function endCine(c) {
    if (c.done) return;
    c.done = true;
    const def = c.def, att = c.att;
    def.dz.cine = null; if (att.dz) att.dz.cine = null;
    if (!def.dead && def.state === 'dbind') { def.setState('zanshin', { zp: PO.ks_zanTsuki || def.P.stance, dur: 0.22 }); }
    if (!att.dead && (att.state === 'dbind' || att.state === 'dcut')) { att.setState('stagger'); att.rk = null; att.vx = -att.dir * 160; }
    G.slowT = 0; G.slow = 1;
    for (const f of [def, att]) { const b = f.ctrl.buf; for (const k of ['light', 'heavy', 'kick']) b[k] = null; }
    propFinish(c);
  }



  function propFinish(c) {
    const PR = ND.props;
    if (!PR || !PR.live || !c.ok || c.def.dead || c.att.dead) return;
    const L = PR.cineCandidates(c.att, c.def) || [];
    const best = L.find((x) => x.dist < 320 && x.type !== 'rearm');
    if (!best) return;
    const def = c.def, att = c.att;
    const then = best.type === 'slam' ? null : () => (PR.cineCandidates(att, def) || []).find((x) => x.type === 'slam' && x.dist < 260) || null;
    PR.playCine(best, { then, speed: 1.4 });
    def.dz.propT = 1.8; def.dz.propX = best.focus ? best.focus.x : (def.x + att.x) / 2;
    stat('propFinishers');
  }






  D.pick = {};
  for (const id of Object.keys(ROSTER)) {
    const M0 = ND.MOVES && ND.MOVES[id];
    if (!ND.MOVES) ND.MOVES = {};
    ND.MOVES[id] = (f, n) => {
      if (f.dz) {
        const P = D.pick[id], nm = P ? P(f, n) : null;
        if (nm && ATK[nm]) { f.dz.lastMove = nm; stat('move:' + id + ':' + nm); return nm; }
      }
      const r = typeof M0 === 'function' ? M0(f, n) : M0 && M0[n];
      if (f.dz) { f.dz.lastMove = r || n; stat('move:' + id + ':' + (r || n)); }
      return r || null;
    };
  }

  const K = ND.KAESHI, kpick0 = K.pick;
  K.pick = function (f, name) {
    if (f.dz && !f.dz.armed && D.uaCounter) { const nm = D.uaCounter(f, name); if (nm && ATK[nm]) { stat('move:' + f.ch.id + ':' + nm); f.dz.lastMove = nm; return nm; } }
    const r = kpick0.call(this, f, name);
    if (f.dz) { stat('move:' + f.ch.id + ':' + r); f.dz.lastMove = r; }
    return r;
  };

  D.combo = (f) => {
    const c = f.ctrl, fwd = f.dir > 0 ? 'right' : 'left', back = f.dir > 0 ? 'left' : 'right', now = ND.simClock;
    const tb = c.buf[back], tf = c.buf[fwd];
    if (tb == null || tf == null) return null;
    if (tb < tf && now - tb < T.comboWin + 0.15 && tf - tb < T.comboWin) return 'bf';
    if (tf < tb && now - tf < T.comboWin + 0.15 && tb - tf < T.comboWin) return 'fb';
    return null;
  };

  D.sit = (f) => {
    const o = f.opp, dist = Math.abs(o.x - f.x), A = ND.ARENA;
    const os = o.state;
    return {
      dist, close: dist < 92, far: dist > 185,
      oAir: !o.onGround && o.y < -40 && os !== 'down',
      oGuard: os === 'guard' || os === 'block',
      oBroken: os === 'gbreak' || os === 'stagger',
      oDown: os === 'down' || os === 'getup',
      oUnarmed: !!(o.dz && !o.dz.armed),
      oWall: A - Math.abs(o.x) < 110 && Math.sign(o.x) === Math.sign(o.x - f.x),
      meWall: A - Math.abs(f.x) < 90 && Math.sign(f.x) === -Math.sign(o.x - f.x),
      armed: f.dz.armed,
    };
  };










  D.env = null;




  D.propsOn = (on) => { const PR = ND.props; if (!PR) return false; if (on) PR.enable({ cpu: true }); else if (PR.disable) PR.disable(); return !!PR.live; };
  if (!/[?&]props=0(&|$)/.test(location.search || '')) D.propsOn(true);


  D.resetStats = () => { D.stats = {}; return D.stats; };
})(window.ND);
