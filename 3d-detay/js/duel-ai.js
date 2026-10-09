







(function (ND) {
  'use strict';
  const FLAG = (() => { try { return !/[?&]duel=0(&|$)/.test(location.search || ''); } catch (e) { return true; } })();
  if (!FLAG || !ND.duel || !ND.AI) return;
  const Math = ND.DM || globalThis.Math;
  const D = ND.duel, T = D.T, AP = ND.AI.prototype;
  const rnd = () => ND.rng.next(), rand = (a, b) => ND.rng.range(a, b);
  const G = ND.game;
  const PT = { x: 0, y: 0 };










  const LV = ND.AI_LEVELS, KN = ND.AI_KNOBS, DUEL_LV = new Map();
  const KQ = (/[?&]duelk=(-?[\d.]+)/.exec(location.search || '') || [])[1];
  const kOf = (id) => (KQ != null ? +KQ : KN.duelKch && KN.duelKch[id] != null ? KN.duelKch[id] : KN.duelK ?? 0.6);


  const K0Q = (/[?&]duelk0=(-?[\d.]+)/.exec(location.search || '') || [])[1];


  const LVK = { 0.5: 'duelKAch', 1: 'duelKUch' };
  const kAt = (id, key) => {
    if (key === '0') return K0Q != null ? +K0Q : KN.duelK0ch && KN.duelK0ch[id] != null ? KN.duelK0ch[id] : kOf(id);
    const M = LVK[key] && KN[LVK[key]];
    return KQ == null && M && M[id] != null ? M[id] : kOf(id);
  };
  const SOFT = {};
  const BELOW = { 0: () => SOFT, 0.5: () => LV[0], 1: () => LV[0.5], 2: () => LV[1], 3: () => LV[2] };
  const soften = () => {
    const a = LV[0], b = LV[1], e = KN.duelSoft ?? 0.5, P = (f) => f !== 'react' && f !== 'mash' && f !== 'tick';
    for (const f of Object.keys(a)) {
      if (f === 'name') continue;
      if (Array.isArray(a[f])) { const t = SOFT[f] || (SOFT[f] = []); a[f].forEach((v, i) => { t[i] = Math.max(0, v - (b[f][i] - v) * e); }); }
      else if (typeof a[f] === 'number') { const v = a[f] - (b[f] - a[f]) * e; SOFT[f] = Math.max(0, P(f) ? Math.min(1, v) : v); }
    }
  };



  const FLOOR = { react: 0.05, mash: 1 };
  const keep = (f, v, a, b) => {
    if (FLOOR[f] != null) return Math.max(FLOOR[f], v);
    return a <= 1 && b <= 1 ? Math.min(1, Math.max(0, v)) : Math.max(0, v);
  };
  const derive1 = (b, k, o, key) => {
    const a = (BELOW[key] || (() => LV[0]))();
    for (const f of Object.keys(b)) {
      if (f === 'name') continue;
      if (Array.isArray(b[f]) && Array.isArray(a[f])) { const t = o[f] || (o[f] = []); b[f].forEach((v, i) => { t[i] = Math.max(0.02, a[f][i] + (v - a[f][i]) * k); }); }
      else if (typeof b[f] === 'number' && typeof a[f] === 'number') o[f] = keep(f, a[f] + (b[f] - a[f]) * k, a[f], b[f]);
      else o[f] = b[f];
    }
    return o;
  };
  const duelDerive = () => { soften(); for (const o of DUEL_LV.values()) derive1(o.__b, o.__k, o, o.__key); };
  { const d0 = ND.aiDerive; ND.aiDerive = function () { const r = d0 && d0.apply(this, arguments); for (const o of DUEL_LV.values()) o.__k = kAt(o.__id, o.__key); duelDerive(); return r; }; }
  soften();
  const CACHE = new Map();




  const GCACHE = new WeakMap();
  const GKQ = (/[?&]ghostk=([\d.]+)/.exec(location.search || '') || [])[1];
  const mixLv = (A, B, u) => { const o = {}; for (const f of Object.keys(B)) { const x = A[f], y = B[f]; if (Array.isArray(y) && Array.isArray(x)) o[f] = y.map((v, i) => x[i] + (v - x[i]) * u); else if (typeof y === 'number' && typeof x === 'number') o[f] = x + (y - x) * u; } return o; };
  function ghostLevel(lv, id) {
    let o = GCACHE.get(lv);
    if (o) return o;
    const t = typeof lv.__t === 'number' ? lv.__t : 0;
    const a = t <= 1 ? mixLv(SOFT, LV[0.5], Math.max(0, t)) : mixLv(LV[0.5], LV[1], Math.min(1, t - 1));
    const k = (t < 0.5 ? kAt(id, '0') : kOf(id)) * (GKQ != null ? +GKQ : KN.duelGhostK ?? 1);
    o = { name: lv.name };
    for (const f of Object.keys(lv)) {
      if (f === 'name') continue;
      if (Array.isArray(lv[f]) && Array.isArray(a[f])) o[f] = lv[f].map((v, i) => a[f][i] + (v - a[f][i]) * k);
      else if (typeof lv[f] === 'number' && typeof a[f] === 'number') o[f] = a[f] + (lv[f] - a[f]) * k;
      else o[f] = lv[f];
    }
    GCACHE.set(lv, o);
    return o;
  }
  D.duelLevel = (lv, id) => {
    if (!lv || typeof lv !== 'object') return lv;
    const key = Object.keys(LV).find((k) => LV[k] === lv), ck = (id || '') + '|' + key;
    if (key == null) return ghostLevel(lv, id);
    let o = CACHE.get(ck);
    if (!o) {
      o = { name: lv.name };
      Object.defineProperty(o, '__b', { value: lv }); Object.defineProperty(o, '__key', { value: key });
      Object.defineProperty(o, '__id', { value: id, writable: true }); Object.defineProperty(o, '__k', { value: kAt(id, key), writable: true });
      CACHE.set(ck, o); DUEL_LV.set(ck, o); derive1(lv, o.__k, o, key);
    }
    return o;
  };

  const up0 = AP.update;
  AP.update = function (dt) {
    const me = this.me;
    if (!me.dz) return up0.call(this, dt);
    if (!this.duelLv) { this.duelLv = true; this.lv = D.duelLevel(this.lv, me.ch && me.ch.id); }

    if (this.dq && this.dq.length) {
      for (const a of this.taps) if (!this.held[a]) this.c.release(a, 'ai');
      this.taps.length = 0;
      this.t += dt;
      while (this.dq.length && this.t >= this.dq[0][0]) {
        const [, a, k] = this.dq.shift();
        if (k === 'tap') this.tap(a); else this.setHeld(a, k === 'hold');
      }
      if (me.locked || me.dead) { this.dq.length = 0; this.releaseAll(); }
      return;
    }
    if (me.state === 'dbind') return this.bindAI(dt);
    up0.call(this, dt);
    this.duelExtra(dt);
    this.kickAI(dt);
  };


  AP.bindAI = function (dt) {
    const me = this.me, c = me.dz.cine;
    this.t += dt;
    for (const a of this.taps) if (!this.held[a]) this.c.release(a, 'ai');
    this.taps.length = 0;
    if (!c || c.def !== me || c.ph !== 'bind') { this.releaseAll(); return; }
    if (c.aiPlan == null) {
      const p = 0.32 + 0.6 * (this.lv.smart || 0.5), W = T.bindWin;
      c.aiPlan = rnd() < p ? rand(W[0] + 0.03, W[1] - 0.04) : rnd() < 0.5 ? rand(W[0] - 0.12, W[0] - 0.02) : -1;
    }
    if (c.aiPlan >= 0 && c.t >= c.aiPlan && c.press < 0 && !this.bTok) { this.bTok = true; this.tap('light'); }
    if (c.press >= 0) this.bTok = false;
  };


  AP.comboQ = function (seq, btn) {
    const me = this.me, fwd = me.opp.x >= me.x ? 'right' : 'left', back = fwd === 'right' ? 'left' : 'right';
    const k = (s) => (s === 'b' ? back : fwd);
    let t = this.t;
    this.releaseAll();
    const q = this.dq || (this.dq = []);
    q.push([t + 0.0, k(seq[0]), 'hold'], [t + 0.06, k(seq[0]), 'rel'], [t + 0.09, k(seq[1]), 'hold'], [t + 0.14, btn, 'tap'], [t + 0.2, k(seq[1]), 'rel']);
  };

  const decide0 = AP.decide;
  AP.decide = function (dist, fwd) {
    const me = this.me, o = me.opp, lv = this.lv;
    if (!me.dz) return decide0.call(this, dist, fwd);
    const free = me.state === 'move' || me.state === 'land';
    if (!free) return;

    if (!me.dz.armed) {
      this.ideal = 62 + rand(-8, 8);
      const s = D.swordOf(me);
      if (s && s.resting()) {
        s.grip(PT);
        const ds = PT.x - me.x, toward = Math.sign(ds) || fwd;
        const oppBetween = (o.x - me.x) * ds > 0 && Math.abs(o.x - me.x) < Math.abs(ds);
        const busy = { recoil: 1, hurt: 1, down: 1, getup: 1, launch: 1, stagger: 1, gbreak: 1, clash: 1 }[o.state];
        if (D.canPick(me)) {


          if (dist > 170 || busy || (dist > 110 && o.state !== 'atk' && rnd() < 0.4) || rnd() < 0.25 * (1 - lv.smart)) { this.tap(D.kicksOn && D.kicksOn(me) && rnd() < 0.5 * (lv.smart || 0) ? 'kick' : 'throw'); return; }
          return decide0.call(this, dist, fwd);
        }


        if (dist < 190 && o.dz && o.dz.armed && rnd() < 0.5 * (lv.guard || 0)) { this.setHeld('left', false); this.setHeld('right', false); this.move = 0; this.setHeld('guard', true); this.guardUntil = this.t + rand(0.35, 0.6); return; }
        if (dist < 150 && rnd() < 0.6) return decide0.call(this, dist, fwd);
        if (!oppBetween) { this.go(toward, rand(0.2, 0.35)); return; }


        const long = Math.min(1, (ND.simClock - (me.dz.disarmT || 0)) / 12);
        if (dist < 200 && rnd() < 0.25 + 0.25 * lv.smart + 0.4 * long && !(o.state === 'atk')) { this.moveDir(toward); this.tap('dodge'); return; }
        if (long > 0.6 && rnd() < 0.3) { this.go(toward, 0.25); return; }
        if (rnd() < 0.15 && me.ki >= 100) { this.tap('special'); return; }
      }
      return decide0.call(this, dist, fwd);
    }

    const os = D.swordOf(o);
    if (os && os.resting()) {
      os.grip(PT);
      const dsw = PT.x - me.x, between = (PT.x - o.x) * (me.x - o.x) > 0 && Math.abs(me.x - o.x) < Math.abs(PT.x - o.x);
      if (o.state === 'dpick' && dist < 230) { this.dirTap(rnd() < 0.5 ? 'light' : 'heavy', 0); return; }

      if (Math.abs(dsw) < 75 && dist < 260 && ND.simClock - (os.kt || -9) > T.kickCool && rnd() < 0.35 * lv.smart + 0.1) { this.dirTap('kick', 0); return; }
      if (!between && Math.abs(dsw) > 40 && rnd() < 0.25 * lv.smart) { this.go(Math.sign(dsw) || fwd, rand(0.2, 0.32)); return; }


      if (o.state !== 'atk' && rnd() < 0.3 + 0.38 * (lv.aggr || 0)) {
        if (dist < 175) { this.dirTap(rnd() < 0.7 ? 'light' : 'heavy', 0); return; }
        if (dist < 320) { this.go(fwd, rand(0.15, 0.25)); return; }
      }
    }


    if (o.state === 'droll' && o.dz && o.dz.pass && o.st > 0.24 && dist < 220 && rnd() < 0.3 + 0.5 * (lv.smart || 0)) { this.dirTap(rnd() < 0.6 ? 'light' : 'heavy', 0); return; }
    if (me.dz.armed && dist < (D.PASS ? D.PASS.near - 15 : 160) && o.state === 'atk' && o.atk && o.atk.active && o.st < o.atk.active[0] - 0.05 && !o.atk.special && rnd() < 0.35 * (lv.dodge || 0)) {
      const fwd2 = o.x >= me.x ? 'right' : 'left';
      if (Math.abs(o.x + Math.sign(o.x - me.x) * (D.PASS ? D.PASS.beyond : 70)) < ND.ARENA - 30) { this.moveDir(fwd2 === 'right' ? 1 : -1); this.tap('dodge'); return; }
    }



    if (D.kicksOn && D.kicksOn(me) && me.dz.armed && dist < 260 && !(D.envExchange && D.envExchange()) && this.t - (this.kLast ?? -9) > 4 / KRATE) {
      const r = rnd(), oppGuard = o.state === 'guard' || o.state === 'block', sm = lv.smart || 0;
      if (dist < 150 && r < (0.008 + 0.022 * sm) * KRATE) {
        const r2 = rnd();
        this.kickQ(oppGuard && r2 < 0.45 ? 'spin' : r2 < 0.5 ? 'sweep' : r2 < 0.75 && D.KICK_SIG[me.ch.id] ? 'sig' : 'spin');
        this.kLast = this.t;
        return;
      }
      if (dist > 170 && o.onGround && r < (0.004 + 0.01 * sm) * KRATE) { this.kickQ('air'); this.kLast = this.t; return; }
    }

    const C = D.COMBO && D.COMBO[me.ch.id];
    if (C && dist < 260) {
      const oppGuard = o.state === 'guard' || o.state === 'block';
      if (oppGuard && o.dz && o.dz.armed && me.ki >= T.disarmKi && rnd() < 0.18 * lv.smart) { this.comboQ('bf', 'heavy'); return; }
      if (rnd() < 0.025 + 0.035 * lv.smart) { const r = rnd(); this.comboQ(r < 0.5 ? 'bf' : 'fb', r < 0.35 || r > 0.8 ? 'light' : 'heavy'); return; }
    }
    return decide0.call(this, dist, fwd);
  };


  const KRATE = +((/[?&]kickrate=([\d.]+)/.exec(location.search || '') || [])[1] || 1);


  AP.kickQ = function (kind) {
    const me = this.me, fwd = me.opp.x >= me.x ? 1 : -1;
    if (kind === 'spin') return this.dirTap('kick', -fwd);
    if (kind === 'wrist') return this.dirTap('kick', fwd);
    if (kind === 'sig') return this.comboQ('bf', 'kick');
    this.releaseAll();
    const q = this.dq || (this.dq = []), t = this.t;
    if (kind === 'sweep') q.push([t, 'guard', 'hold'], [t + 0.04, 'kick', 'tap'], [t + 0.12, 'guard', 'rel']);
    else if (kind === 'air') q.push([t, fwd > 0 ? 'right' : 'left', 'hold'], [t + 0.02, 'up', 'tap'], [t + 0.2, 'kick', 'tap'], [t + 0.24, fwd > 0 ? 'right' : 'left', 'rel']);
  };


  AP.kickAI = function () {
    const me = this.me, o = me.opp, lv = this.lv, sm = lv.smart || 0;
    if (!o || o.dead || me.locked || G.phase !== 'fight') return;
    const dist = Math.abs(o.x - me.x), fwd = o.x >= me.x ? 1 : -1;
    if (o.state === 'atk' && o.atk && o.keys !== this.kSeen) {
      this.kSeen = o.keys;
      const a = o.atk, k = o.ch.spd * o.aspd, t0 = this.t - o.st / k;
      if (a.low && a.kind === 'kick' && a.active && dist < 240) {
        if (rnd() < 0.2 + 0.55 * sm) this.kq = { act: 'jump', at: Math.max(this.t + lv.react, t0 + a.active[0] / k - 0.14), until: t0 + a.active[1] / k };
      } else if (D.kicksOn && D.kicksOn(me) && me.dz.armed && a.kind === 'blade' && a.active && !a.special && !a.counter && dist < 170 && (a.heavyClass || a.active[0] >= 0.3)) {

        const kw = ND.ATK.dk_wrist.active[0] / (me.ch.spd * D.akFor(me)), due = t0 + a.active[0] / k - kw - 0.02;
        if (due - this.t > lv.react && rnd() < 0.15 * sm) this.kq = { act: 'wrist', at: Math.max(this.t + lv.react, due - 0.05), until: due };
      }
    }
    if (o.state === 'atk' && o.atk && o.atk.punish && !o.hitDone && o.atk.active && o.st > o.atk.active[1] && dist < 210 && this.kPun !== o.keys) {
      this.kPun = o.keys;
      if (rnd() < 0.3 + 0.6 * sm) this.kq = { act: 'punish', at: this.t + lv.react * 0.6, until: this.t + 0.5 };
    }
    const q = this.kq;
    if (q && this.t >= q.at) {
      this.kq = null;
      const free = me.state === 'move' || me.state === 'guard' || me.state === 'land' || me.state === 'block';
      if (!free || this.t > q.until + 0.05 || !me.onGround || (this.dq && this.dq.length)) return;
      this.pending = null; this.setHeld('guard', false);
      if (q.act === 'jump') this.tap('up');
      else if (q.act === 'wrist') this.dirTap('kick', fwd);
      else if (q.act === 'punish') this.dirTap(rnd() < 0.55 ? 'light' : 'heavy', 0);
    }
  };


  AP.duelExtra = function () {
    const me = this.me;
    if (me.dz.armed && this.ideal < 80) this.ideal = this.idealFor();
  };
})(window.ND);
