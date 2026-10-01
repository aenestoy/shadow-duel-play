// Shadow Duel — new-player funnel (ND.funnel): where a new player stops in the first minutes.
//
// What it records: the first time a new player reaches each step below, with the seconds since that player's first
// page load (visible time, the tab in front). Nothing else: no id, no name, no device data, no score. It is kept on this
// device only (localStorage 'golge-duellosu-funnel', not in the progress save, never sent to our server) and, where
// the portal SDK takes anonymous game events, each first-time step is also handed to the portal (ND.portal.track →
// src/portal-bridge.ts → the adapter's trackEvent; adapters without such an API ignore it). No new outside request.
//
// Steps, in the order a new player meets them (STEPS):
//   boot        the game's scripts are running (first page load)
//   menu        the first screen / menu is up (the portal's loading phase ended)
//   play        PLAY on the first screen (or the menu's Journey card)   · modes: "All modes" on the first screen instead
//   direct      PLAY went straight into journey fight 1 (a new save: no select, no VS; game.js playJourney)
//   select      the character select opened                              · vs: the VS screen of a journey fight
//               (on the direct path both come after the first fight: the next journey fight / the next PLAY)
//   fight1      the first fight started                                  · tut: the rally tutorial started in it
//   warm        the tutorial's warm-up is done (the first blows landed on the CPU)
//   tut1 tut2 tut3   tutorial pass 1 (frozen), 2 (slow motion), 3 (full speed) done (tut3 = MASTERED!)
//   round1      the first round ended                                    · fight1_win / fight1_loss: the first fight ended
//   fight2      a second fight started (next journey stage, a retry, any mode)
//   m3 m5 m10   3, 5 and 10 minutes of visible play time (all sessions together)
// A player who already had a save before this file existed is not "new": only the session list is kept for them.
// Sessions: the last 12 page loads, each { d: day (UTC days since 1970), n: new player?, s: furthest step, v: visible s }.
// Reading it (testing, a playtester's device): ND.funnel.report() in the console, or ?funnel=1 prints it at each step.
(function (ND) {
  'use strict';
  const KEY = 'golge-duellosu-funnel', V = 1;
  const STEPS = ['boot', 'menu', 'modes', 'play', 'direct', 'select', 'vs', 'fight1', 'tut', 'warm', 'tut1', 'tut2', 'tut3', 'round1', 'fight1_win', 'fight1_loss', 'fight2', 'm3', 'm5', 'm10'];
  const TIMES = [[180, 'm3'], [300, 'm5'], [600, 'm10']];
  const SESS_MAX = 12, SAVE_EVERY = 10;
  const ls = (() => { try { const s = window.localStorage, k = '__nd_fn'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e) { return null; } })();
  const loud = (() => { try { return /[?&]funnel=1(&|$)/.test(location.search || ''); } catch (e) { return false; } })();
  const num = (v, hi) => (typeof v === 'number' && isFinite(v) && v >= 0 ? Math.min(hi, Math.round(v)) : null);
  const day = () => Math.floor(Date.now() / 864e5);

  function read() {
    let o = null;
    try { o = ls ? JSON.parse(ls.getItem(KEY) || 'null') : null; } catch (e) { o = null; }
    if (!o || typeof o !== 'object' || o.v !== V) return null;
    const first = {};
    if (o.first && typeof o.first === 'object') for (const k of STEPS) { const s = num(o.first[k], 1e7); if (s != null) first[k] = s; }
    const sess = Array.isArray(o.sess) ? o.sess.filter((x) => x && typeof x === 'object').slice(-SESS_MAX).map((x) => ({
      d: num(x.d, 1e6) || 0, n: !!x.n, s: STEPS.includes(x.s) ? x.s : 'boot', v: num(x.v, 1e6) || 0,
    })) : [];
    return { v: V, isNew: !!o.isNew, play: num(o.play, 1e8) || 0, first, sess };
  }

  // A new player: no funnel record yet and no progress save that says the first screen was already passed
  // (ND.save is loaded before this file: js/arcade.js).
  const saved = read();
  const newPlayer = saved ? saved.isNew : !(ND.save && ND.save.p && ND.save.p.firstDone);
  const rec = saved || { v: V, isNew: newPlayer, play: 0, first: {}, sess: [] };
  const sess = { d: day(), n: rec.isNew, s: 'boot', v: 0 };
  rec.sess.push(sess);
  while (rec.sess.length > SESS_MAX) rec.sess.shift();
  let dirty = true, sinceSave = 0, visible = true;

  function write() {
    if (!ls || !dirty) return;
    dirty = false;
    try { ls.setItem(KEY, JSON.stringify(rec)); } catch (e) { /* quota / private mode: the log just stops */ }
  }

  const F = ND.funnel = {
    STEPS,
    get isNew() { return rec.isNew; },
    // total visible play seconds (all sessions) and this session's
    get playSec() { return rec.play; },
    get sessionSec() { return sess.v; },
    // step(id, extra): record `id` once (the first time); later calls are ignored. Returns true the first time.
    step(id) {
      if (!STEPS.includes(id)) return false;
      if (STEPS.indexOf(id) > STEPS.indexOf(sess.s)) { sess.s = id; dirty = true; }
      if (!rec.isNew || rec.first[id] != null) return false;
      rec.first[id] = rec.play;
      dirty = true; write();
      if (loud) console.info('[funnel]', id, 'at', rec.play + 's', F.report());
      // studio play statistics (src/studio-stats.ts; absent in the Yandex / Playgama builds): a few steps are funnel events there
      try { if (ND.studioStats) ND.studioStats.funnel(id); } catch (e) { /* statistics never break the game */ }
      try { if (ND.portal && ND.portal.track) ND.portal.track('funnel_' + id); } catch (e) { /* the portal ignored it */ }
      return true;
    },
    // a fight started (any single-player or local mode): the first → fight1, the next → fight2
    fightStarted() { if (rec.first.fight1 == null) F.step('fight1'); else F.step('fight2'); },
    // a fight ended: won = the player (left side) won
    fightEnded(won) { if (rec.first.fight1_win == null && rec.first.fight1_loss == null) F.step(won ? 'fight1_win' : 'fight1_loss'); },
    // what the log holds, for the console: { isNew, play, first: [[step, s]…], sessions }
    report() {
      const first = STEPS.filter((k) => rec.first[k] != null).map((k) => [k, rec.first[k]]);
      return { isNew: rec.isNew, play: rec.play, first, sessions: rec.sess.map((x) => Object.assign({}, x)) };
    },
    // forget everything (tests)
    reset() { rec.first = {}; rec.play = 0; rec.sess = [sess]; sess.s = 'boot'; sess.v = 0; rec.isNew = true; dirty = true; write(); },
    // one second of wall time passed (called by the timer below; tests call it directly)
    _tick(sec) {
      if (!visible) return;
      rec.play += sec; sess.v += sec; dirty = true;
      for (const [s, id] of TIMES) if (rec.play >= s) F.step(id);
      if ((sinceSave += sec) >= SAVE_EVERY) { sinceSave = 0; write(); }
    },
  };

  try { visible = !document.hidden; } catch (e) { visible = true; }
  try {
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (!visible) write(); });
    window.addEventListener('pagehide', write);
  } catch (e) { /* no DOM (tests) */ }
  setInterval(() => F._tick(1), 1000);
  F.step('boot');
  write();
})(window.ND = window.ND || {});
