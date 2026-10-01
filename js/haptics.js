// Shadow Duel — event vibration on touch phones (ND.haptics). Android browsers only: iOS Safari has no
// navigator.vibrate, so nothing is tried there. Follows the Vibration switch of the touch settings (ND.touchPrefs.haptic,
// js/touch.js) and the browser's user-activation rule (no call before the page had a tap), like the button buzz in
// js/input.js. Only the local touch player's own fight moments, only while a fight is really running: never in
// menus, the pause, an ad, the KO replay, a demo / watch fight or a re-simulated step (rollback).
//   parry     the player parries (a blade, a special's catch)                        one short firm pulse
//   hit       the player takes a hit                                                  two pulses, longer with the damage
//   gbreak    the player's own guard breaks                                           one long pulse
//   counter   the player lands a counter (kaeshi-waza)                                three quick pulses
//   ko        the player knocks the opponent out                                      a rising drum roll
// Rate limit: an event pulse needs GAP ms since the one before and at most BURST of them in WINDOW ms, so a long rally
// of parries and counters does not buzz without a break (guard break and KO always come through, they are rare). While
// an event pattern plays, the short press buzz of the buttons waits (it would cut the pattern off).
// defer (set by game.js): the pattern is handed to the browser after the frame is drawn (flush, called by the frame
// loop), not in the middle of the simulation step of the hit that the same frame has to draw: on Android a vibration
// is a call into the system, and the owner's hitch reports kept showing it on the frames of parries and hits.
// off (game.js, ?vib=0 for comparison runs): no vibration at all, the saved setting is untouched.
(function (ND) {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const GAP = 380, WINDOW = 4000, BURST = 5;
  const ALWAYS = { gbreak: 1, ko: 1 };
  const pattern = (kind, dmg) => {
    if (kind === 'parry') return [32];
    if (kind === 'gbreak') return [150];
    if (kind === 'counter') return [18, 45, 18, 45, 34];
    if (kind === 'ko') return [30, 50, 40, 50, 60, 60, 110];
    // a hit: the harder, the longer (a light cut ~20 ms, a ki technique ~55 ms)
    const d = clamp(Math.round(10 + (dmg || 0) * 1.7), 18, 58);
    return [d, 35, Math.round(d * 0.55)];
  };
  const H = ND.haptics = {
    last: 0, busyUntil: 0, recent: [], log: null, defer: false, pending: null, off: false,
    // the local touch player (input.p1 drives F[0] when a human plays it)
    player() {
      const G = ND.game;
      if (!G || !G.F || !ND.touch || !ND.touch.active) return null;
      const me = G.local ? G.local() : G.F[0]; // (online guest: 2P)
      return G.isHuman && G.isHuman(me) ? me : null;
    },
    // a fight step that is really shown and played
    live() {
      const G = ND.game;
      if (!G || G.simOnly || G.paused || G.replay || G.mode === 'attract' || G.mode === 'watch') return false;
      if (G.phase !== 'fight' && G.phase !== 'ko') return false;
      return !(ND.input && ND.input.adLocked);
    },
    allowed() {
      const P = ND.touchPrefs;
      if (this.off || (P && P.haptic === false)) return false;
      try {
        if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
        const ua = navigator.userActivation;
        return !ua || !!ua.hasBeenActive;
      } catch (e) { return false; }
    },
    // is an event pattern still playing (the press buzz waits)
    busy(t) { return (t == null ? performance.now() : t) < this.busyUntil; },
    event(kind, dmg) {
      if (!this.live() || !this.allowed()) return false;
      const t = performance.now();
      if (!ALWAYS[kind]) {
        if (t - this.last < GAP) return false;
        while (this.recent.length && t - this.recent[0] > WINDOW) this.recent.shift();
        if (this.recent.length >= BURST) return false;
      }
      const p = pattern(kind, dmg);
      let ok = false;
      if (this.defer) { this.pending = p; ok = true; } // (a second pattern in the same frame replaces the first, as a second call would)
      else { try { ok = navigator.vibrate(p) !== false; } catch (e) { ok = false; } }
      if (!ok) return false;
      this.last = t; this.recent.push(t);
      this.busyUntil = t + p.reduce((a, b) => a + b, 0);
      if (this.log) this.log.push({ kind, p, t });
      return true;
    },
    // after the frame is drawn (game.js frame loop): the pattern of this frame's event, if any
    flush() {
      const p = this.pending;
      if (!p) return;
      this.pending = null;
      try { navigator.vibrate(p); } catch (e) { /* vibration must never break the fight */ }
    },
    // pause, ad, menu: stop whatever is playing
    stop() {
      this.pending = null;
      if (this.busyUntil <= performance.now()) return;
      this.busyUntil = 0;
      try { if (typeof navigator.vibrate === 'function') navigator.vibrate(0); } catch (e) { /* yok */ }
    },
    pattern,
  };

  // Fighter moments (the same two doors game.js's score uses: every loss of health goes through takeHit, parry and
  // guard break through setState). Wrapped here once; fighter.js is unchanged.
  const FP = ND.Fighter && ND.Fighter.prototype;
  if (FP && !FP._haptic) {
    const take = FP.takeHit, setSt = FP.setState;
    FP.takeHit = function (raw, a, from) {
      const hp0 = this.hp, r = take.apply(this, arguments);
      try {
        const me = H.player();
        if (me && this.hp < hp0) {
          if (this === me) H.event('hit', hp0 - this.hp);
          else if (from === me && this === me.opp && (this.hp <= 0 || (a && a.counter))) H.event(this.hp <= 0 ? 'ko' : 'counter');
        }
      } catch (e) { /* vibration must never break the fight */ }
      return r;
    };
    FP.setState = function (s) {
      const r = setSt.apply(this, arguments);
      if (s === 'parry' || s === 'gbreak') {
        try { const me = H.player(); if (me && this === me) H.event(s); } catch (e) { /* yok */ }
      }
      return r;
    };
    FP._haptic = true;
  }
})(window.ND);
