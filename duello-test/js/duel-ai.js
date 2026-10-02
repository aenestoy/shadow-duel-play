// Shadow Duel — DUEL PROTOTYPE CPU (?duel=1 only; js/duel.js). The CPU plays the same new systems as a player:
// the situation moves come from the same buttons by themselves; here it also learns the rest:
//   - the BIND prompt: presses inside the window by its level (a Master hits it most of the time), early or late else;
//   - disarmed: walks (or rolls past the opponent) to its sword and picks it up when the coast is clear, fights with
//     fists and kicks when the opponent stands over it, takes risky pickups less often at higher levels;
//   - against a disarmed opponent: stands between it and its sword, kicks the sword away when close, punishes a pickup;
//   - input combos (← → / → ← + button) now and then, the disarming technique against a guard when it has the ki.
// Every choice draws from the fight's random stream (ND.rng): deterministic like the rest of the CPU (js/ai.js).
(function (ND) {
  'use strict';
  const FLAG = (() => { try { return /[?&]duel=\d/.test(location.search || ''); } catch (e) { return false; } })();
  if (!FLAG || !ND.duel || !ND.AI) return;
  const Math = ND.DM || globalThis.Math;
  const D = ND.duel, T = D.T, AP = ND.AI.prototype;
  const rnd = () => ND.rng.next(), rand = (a, b) => ND.rng.range(a, b);
  const G = ND.game;
  const PT = { x: 0, y: 0 };

  const up0 = AP.update;
  AP.update = function (dt) {
    const me = this.me;
    if (!me.dz) return up0.call(this, dt);
    // queued presses (input combos): [time, action, 'tap' | 'hold' | 'rel']
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

  // the bind prompt (only as the defender; the attacker waits)
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

  // queue a direction combo: back / forward relative to the opponent, then the button
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
    // ---- disarmed: get the sword back
    if (!me.dz.armed) {
      this.ideal = 62 + rand(-8, 8);
      const s = D.swordOf(me);
      if (s && s.resting()) {
        s.grip(PT);
        const ds = PT.x - me.x, toward = Math.sign(ds) || fwd;
        const oppBetween = (o.x - me.x) * ds > 0 && Math.abs(o.x - me.x) < Math.abs(ds);
        const busy = { recoil: 1, hurt: 1, down: 1, getup: 1, launch: 1, stagger: 1, gbreak: 1, clash: 1 }[o.state];
        if (D.canPick(me)) {
          // pick it up when the opponent cannot punish it (or, at lower levels, sometimes anyway); standing on it with the
          // opponent close, it fights for room instead of waiting
          if (dist > 170 || busy || (dist > 110 && o.state !== 'atk' && rnd() < 0.4) || rnd() < 0.25 * (1 - lv.smart)) { this.tap('throw'); return; }
          return decide0.call(this, dist, fwd);
        }
        // the opponent in reach: keep the guard up for his cut (an evade) or trade blows (fists are fast) rather than
        // turn away from it
        if (dist < 190 && o.dz && o.dz.armed && rnd() < 0.45) { this.setHeld('left', false); this.setHeld('right', false); this.move = 0; this.setHeld('guard', true); this.guardUntil = this.t + rand(0.35, 0.6); return; }
        if (dist < 150 && rnd() < 0.6) return decide0.call(this, dist, fwd);
        if (!oppBetween) { this.go(toward, rand(0.2, 0.35)); return; }
        // the opponent stands between: roll past it (the roll goes through), or fight to make room
        // (the longer it has been without its sword, the more it dares)
        const long = Math.min(1, (ND.simClock - (me.dz.disarmT || 0)) / 12);
        if (dist < 200 && rnd() < 0.25 + 0.25 * lv.smart + 0.4 * long && !(o.state === 'atk')) { this.moveDir(toward); this.tap('dodge'); return; }
        if (long > 0.6 && rnd() < 0.3) { this.go(toward, 0.25); return; }
        if (rnd() < 0.15 && me.ki >= 100) { this.tap('special'); return; }
      }
      return decide0.call(this, dist, fwd);
    }
    // ---- the opponent is disarmed and its sword lies here: stand over it, kick it away, punish the pickup
    const os = D.swordOf(o);
    if (os && os.resting()) {
      os.grip(PT);
      const dsw = PT.x - me.x, between = (PT.x - o.x) * (me.x - o.x) > 0 && Math.abs(me.x - o.x) < Math.abs(PT.x - o.x);
      if (o.state === 'dpick' && dist < 230) { this.dirTap(rnd() < 0.5 ? 'light' : 'heavy', 0); return; }
      // kick it away when its owner comes for it (not as a pastime)
      if (Math.abs(dsw) < 75 && dist < 260 && ND.simClock - (os.kt || -9) > T.kickCool && rnd() < 0.35 * lv.smart + 0.1) { this.dirTap('kick', 0); return; }
      if (!between && Math.abs(dsw) > 40 && rnd() < 0.25 * lv.smart) { this.go(Math.sign(dsw) || fwd, rand(0.2, 0.32)); return; }
      // the sword has the reach: it presses the empty-handed one (cuts it must duck, sway or catch) rather than waiting
      // over the blade (CPU against CPU, a disarm used to stall the fight: ~2 blade contacts a minute, 2026-10-03)
      if (o.state !== 'atk' && rnd() < 0.55) {
        if (dist < 175) { this.dirTap(rnd() < 0.7 ? 'light' : 'heavy', 0); return; }
        if (dist < 320) { this.go(fwd, rand(0.15, 0.25)); return; }
      }
    }
    // ---- input combos now and then (the disarming technique against a guard)
    const C = D.COMBO && D.COMBO[me.ch.id];
    if (C && dist < 260) {
      const oppGuard = o.state === 'guard' || o.state === 'block';
      if (oppGuard && o.dz && o.dz.armed && me.ki >= T.disarmKi && rnd() < 0.18 * lv.smart) { this.comboQ('bf', 'heavy'); return; }
      if (rnd() < 0.025 + 0.035 * lv.smart) { const r = rnd(); this.comboQ(r < 0.5 ? 'bf' : 'fb', r < 0.35 || r > 0.8 ? 'light' : 'heavy'); return; }
    }
    return decide0.call(this, dist, fwd);
  };

  // every tick after the normal CPU: a disarmed CPU's shorter range, guarding against the roll-through
  AP.duelExtra = function () {
    const me = this.me;
    if (me.dz.armed && this.ideal < 80) this.ideal = this.idealFor();
  };
})(window.ND);
