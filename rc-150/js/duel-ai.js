







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
  const KQ = (/[?&]duelk=([\d.]+)/.exec(location.search || '') || [])[1];
  const kOf = (id) => (KQ != null ? +KQ : KN.duelKch && KN.duelKch[id] != null ? KN.duelKch[id] : KN.duelK ?? 0.6);


  const K0Q = (/[?&]duelk0=([\d.]+)/.exec(location.search || '') || [])[1];
  const kAt = (id, key) => (key !== '0' ? kOf(id) : K0Q != null ? +K0Q : KN.duelK0ch && KN.duelK0ch[id] != null ? KN.duelK0ch[id] : kOf(id));
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
  const derive1 = (b, k, o, key) => {
    const a = (BELOW[key] || (() => LV[0]))();
    for (const f of Object.keys(b)) {
      if (f === 'name') continue;
      if (Array.isArray(b[f]) && Array.isArray(a[f])) { const t = o[f] || (o[f] = []); b[f].forEach((v, i) => { t[i] = a[f][i] + (v - a[f][i]) * k; }); }
      else if (typeof b[f] === 'number' && typeof a[f] === 'number') o[f] = a[f] + (b[f] - a[f]) * k;
      else o[f] = b[f];
    }
    return o;
  };
  const duelDerive = () => { soften(); for (const o of DUEL_LV.values()) derive1(o.__b, o.__k, o, o.__key); };
  { const d0 = ND.aiDerive; ND.aiDerive = function () { const r = d0 && d0.apply(this, arguments); for (const o of DUEL_LV.values()) o.__k = kAt(o.__id, o.__key); duelDerive(); return r; }; }
  soften();
  const CACHE = new Map();
  D.duelLevel = (lv, id) => {
    if (!lv || typeof lv !== 'object') return lv;
    const key = Object.keys(LV).find((k) => LV[k] === lv), ck = (id || '') + '|' + key;
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


          if (dist > 170 || busy || (dist > 110 && o.state !== 'atk' && rnd() < 0.4) || rnd() < 0.25 * (1 - lv.smart)) { this.tap('throw'); return; }
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

    const C = D.COMBO && D.COMBO[me.ch.id];
    if (C && dist < 260) {
      const oppGuard = o.state === 'guard' || o.state === 'block';
      if (oppGuard && o.dz && o.dz.armed && me.ki >= T.disarmKi && rnd() < 0.18 * lv.smart) { this.comboQ('bf', 'heavy'); return; }
      if (rnd() < 0.025 + 0.035 * lv.smart) { const r = rnd(); this.comboQ(r < 0.5 ? 'bf' : 'fb', r < 0.35 || r > 0.8 ? 'light' : 'heavy'); return; }
    }
    return decide0.call(this, dist, fwd);
  };


  AP.duelExtra = function () {
    const me = this.me;
    if (me.dz.armed && this.ideal < 80) this.ideal = this.idealFor();
  };
})(window.ND);
