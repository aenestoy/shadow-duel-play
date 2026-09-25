// Shadow Duel — graphics quality: Auto (default) / High / Medium / Low.
// The player's choice (pref) is saved in ND.save settings as `gfx` (game.js persists it). The tier actually drawn
// (active) equals the choice, except on Auto: there game.js starts from a guess for the device and steps down a
// ladder of tier + resolution rungs while fights run slow (see "auto quality" in game.js).
// What each tier draws (ND.gfx.f):
//   high    everything: bloom + film grain, lantern shadows, light rays, dust motes, reflections, full weather;
//           canvas up to 2× pixel ratio (phones 1.5×, weak phones 1.25×)
//   medium  light bloom (small buffer, no blur filter, no grain), rays, half the motes, reflections, full weather;
//           no lantern shadows; canvas up to 1.5× (phones 1.25×)
//   low     no bloom / grain / shadows / rays / motes / reflections, every other weather particle; canvas 1×
//           (the fighters look as on the other tiers: detailed and lit, placed from cached part pictures, bake.js)
// ND.settings.hq stays true only on High (older code and effects read it for their extra glows).
// UI: ND.gfx.levels lists the choices, ND.gfx.setQuality(level) / ND.gfx.getQuality(), ND.gfx.onChange(fn).
// Texts: ND.STR.gfx (i18n.js / i18n-en.js, block "GRAPHICS QUALITY").
window.ND = window.ND || {};
(function (ND) {
  'use strict';
  const T = ND.touch || {}, MOBILE = !!T.mobile, LOW_END = !!T.lowEnd;
  let mem = 8, cores = 8;
  try { mem = navigator.deviceMemory || 8; cores = navigator.hardwareConcurrency || 8; } catch (e) { /* unknown: assume capable */ }
  // clearly weak phone/tablet: little memory or few cores
  const WEAK = MOBILE && (mem <= 2 || cores <= 4);
  const LEVELS = ['auto', 'high', 'medium', 'low'];
  const TIERS = {
    high: { hq: true, rays: true, motes: 1, bloom: 2, grain: true, shadows: true, reflect: true, weather: 1, dpr: MOBILE ? (LOW_END ? 1.25 : 1.5) : 2 },
    medium: { hq: false, rays: true, motes: 0.5, bloom: 1, grain: false, shadows: false, reflect: true, weather: 1, dpr: MOBILE ? 1.25 : 1.5 },
    low: { hq: false, rays: false, motes: 0, bloom: 0, grain: false, shadows: false, reflect: false, weather: 2, dpr: 1 },
  };
  const fns = [];
  const G = ND.gfx = {
    levels: LEVELS,
    tiers: ['high', 'medium', 'low'],
    mobile: MOBILE,
    pref: 'auto',
    tier: 'high',
    f: TIERS.high,
    flags: (tier) => TIERS[tier] || TIERS.high,
    // Auto's starting tier: computers High, phones and tablets Medium, clearly weak phones Low
    guess() { return !MOBILE ? 'high' : WEAK ? 'low' : 'medium'; },
    getQuality() { return G.pref; },
    active() { return G.tier; },
    // Player's choice: 'auto' | 'high' | 'medium' | 'low'. Applies at once and is saved (game.js listens).
    setQuality(level) {
      if (!LEVELS.includes(level)) return false;
      G.pref = level;
      G._setTier(level === 'auto' ? G.guess() : level, 'user');
      return true;
    },
    // Active tier only (Auto's ladder calls this; `why` = 'user' | 'auto' | 'init')
    _setTier(tier, why) {
      if (!TIERS[tier]) tier = 'high';
      G.tier = tier; G.f = TIERS[tier];
      if (ND.settings) ND.settings.hq = G.f.hq;
      for (const fn of fns) { try { fn(G.pref, tier, why || 'user'); } catch (e) { console.warn('[ND.gfx] listener failed', e); } }
    },
    onChange(fn) { fns.push(fn); return () => { const i = fns.indexOf(fn); if (i >= 0) fns.splice(i, 1); }; },
    ladderFrame,
  };

  // ---------------------------------------------------------------- auto quality ladder: the decision part
  // (game.js owns the rungs, the canvas and the toast; kept here without DOM so scripts/auto-quality-check.mjs can
  // drive it with made-up frame times.)
  // aq: ladder state (game.js AQ0 + R = rungs [{ tier, s }]); gapMs: time since the previous frame; workMs: time the
  // frame's own code took; counting: false outside a running fight (the window starts again); act: { setRung(i), toast() }.
  // Frames are gathered in ~1-second windows and judged by their MEDIAN gap, so a single hitch (loading a sound, the
  // first draw of a cache) neither counts as slow nor, as before, throws away the whole window: a phone running at
  // 8 fps (125 ms per frame) now completes windows and steps down instead of never measuring anything.
  //   median > 20 ms (under ~50 fps)   slow: two slow windows in a row step one rung down
  //   median > 36 ms (under ~28 fps)   very slow: the first such window drops straight to the next tier
  //   median > 55 ms (under ~18 fps)   far too slow: the first such window drops straight to the lowest tier
  // Ranges are chosen so a phone that shows every page at 30 Hz (33 ms) is only "slow", never "very slow".
  // After a step one window is skipped (it holds the change itself), the next must be ≥ 8% faster or the step is
  // undone: a resolution step that did not help switches off the other resolution steps of that tier, a tier step
  // that did not help freezes the ladder. Ten fast windows (< 17.8 ms) try one rung up: within a tier always, into
  // the tier above only when the frame's own work is small (median < 6 ms, lots of room left); if the next windows
  // are slow again it goes back and stays.
  const LAD = { SLOW: 20, VSLOW: 36, SEVERE: 55, FAST: 17.8, WORK_UP: 6, WIN: 1000, MIN_N: 4 };
  function med(a, n) {
    const s = a.slice(0, n).sort((x, y) => x - y);
    return n & 1 ? s[n >> 1] : (s[(n >> 1) - 1] + s[n >> 1]) / 2;
  }
  function ladderFrame(aq, gapMs, workMs, counting, act) {
    if (!aq.gaps) { aq.gaps = []; aq.works = []; }
    if (!counting) { aq.t = aq.n = 0; return; }
    if (!(gapMs >= 0) || gapMs > 1000) return; // a stall (tab switch, ad, debugger): not a frame of the game
    aq.gaps[aq.n] = gapMs; aq.works[aq.n] = workMs; aq.n++;
    aq.t += Math.min(gapMs, 250);
    if (aq.t < LAD.WIN || aq.n < LAD.MIN_N) return;
    const n = aq.n, g = med(aq.gaps, n), w = med(aq.works, n), R = aq.R, cur = R[aq.i];
    aq.t = aq.n = 0;
    aq.stat = { gap: g, work: w, tier: cur.tier, scale: cur.s };
    if (aq.settle > 0) { aq.settle--; return; } // the first window after a change does not count
    if (aq.probe) { // did the step down help?
      if (g > aq.probe * 0.92) {
        if (aq.probeTier) aq.frozen = true; else aq.resOff[cur.tier] = true;
        act.setRung(aq.from); // back to the rung the step came from
      } else if (aq.probeTier) act.toast();
      aq.probe = 0; return;
    }
    if (aq.upT > 0) { aq.upT--; if (g > LAD.SLOW) { aq.noUp = true; aq.upT = 0; act.setRung(aq.i + 1); return; } } // going up made it slow: back, and stay
    if (g > LAD.SLOW) {
      aq.fast = 0;
      if (aq.frozen) return;
      const sev = g > LAD.SEVERE ? 2 : g > LAD.VSLOW ? 1 : 0;
      if (sev === 0 && ++aq.slow < 2) return;
      aq.slow = 0;
      let j = aq.i + 1;
      if (sev === 2) { const last = R[R.length - 1].tier; if (cur.tier !== last) while (j < R.length && R[j].tier !== last) j++; }
      else if (sev === 1 || aq.resOff[cur.tier]) { const k = j; while (j < R.length && R[j].tier === cur.tier) j++; if (j >= R.length && sev === 1 && !aq.resOff[cur.tier]) j = k; }
      // Severe stalls must also respect a failed resolution probe; repeating it keeps rebuilding the canvas.
      if (aq.resOff[cur.tier]) while (j < R.length && R[j].tier === cur.tier) j++;
      if (j < R.length) { aq.probe = g; aq.probeTier = R[j].tier !== cur.tier; aq.from = aq.i; act.setRung(j); }
    } else {
      aq.slow = 0;
      const up = aq.i > 0 && !aq.noUp && g < LAD.FAST && (R[aq.i - 1].tier === cur.tier || w < LAD.WORK_UP);
      if (!up) { aq.fast = 0; return; }
      if (++aq.fast >= 10) { aq.fast = 0; aq.upT = 3; act.setRung(aq.i - 1); }
    }
  }
  G.LAD = LAD;

  // ---------------------------------------------------------------- frame pacing (60 cap on high-refresh screens)
  // makePacer() → { due(now), reset(), stat() }. due(now) is asked on every requestAnimationFrame callback and says
  // whether this callback runs the game (simulation + drawing) or is skipped. A skipped callback does no work; the
  // game's clock adds up the real time between the callbacks it runs, so the fixed 1/120 s simulation keeps exact
  // speed and the auto quality ladder sees the real gap between drawn frames (a capped 16.7 ms frame is not slow).
  // The refresh period p is estimated from the callback gaps (low quartile of the last 24: skipped callbacks are one
  // refresh apart, slow drawn frames do not hide it). Every n-th refresh is drawn, n = (1/60 s) / p rounded down
  // unless it is within a quarter of the next whole number: 120 Hz → every 2nd (steady 60), 240 Hz → every 4th,
  // 144 Hz → every 2nd (72), 165 Hz → every 3rd (55); 60 Hz and 90 Hz → every refresh (90 Hz capped would either
  // alternate 22/11 ms gaps or halve to 45 fps). A callback runs once the time since the last run is within half a
  // refresh of n·p; the remainder carries over (phase lock), so drawn frames stay on a steady beat. When drawing is
  // slower than the target, every callback is already late and nothing is skipped: the cap only removes frames that
  // would come faster than ~60 per second.
  const PACE = { TARGET: 1000 / 60, WIN: 24 };
  function makePacer() {
    const gaps = new Float64Array(PACE.WIN), sorted = new Float64Array(PACE.WIN);
    let n = 0, k = 0, prev = -1, acc = 0, period = PACE.TARGET, div = 1, runs = 0, skips = 0;
    function estimate() {
      const m = Math.min(n, PACE.WIN);
      if (m < 6) return;
      sorted.set(gaps);
      const s = sorted.subarray(0, m).sort();
      period = s[m >> 2];
      div = Math.max(1, Math.floor(PACE.TARGET / period + 0.25));
    }
    return {
      due(now) {
        if (prev < 0) { prev = now; acc = 0; runs++; return true; }
        const gap = now - prev; prev = now;
        if (!(gap > 0) || gap > 250) { acc = 0; runs++; return true; } // stall, hidden tab, clock jump: start over
        gaps[k] = gap; k = (k + 1) % PACE.WIN; if (n < PACE.WIN) n++;
        estimate();
        if (div === 1) { acc = 0; runs++; return true; } // 60 Hz, 90 Hz or drawing slower than the cap: run all
        // (a carried negative remainder is bounded by the current refresh period, which may have just changed)
        acc = Math.max(acc, -period / 2) + gap;
        const target = div * period;
        if (acc < target - period / 2) { skips++; return false; }
        // keep the beat: carry a small remainder; a late (slow) frame is not paid back with an early one
        acc = Math.min(Math.max(acc - target, -period / 2), period / 4);
        runs++;
        return true;
      },
      reset() { prev = -1; acc = 0; },
      stat() { return { periodMs: +period.toFixed(2), every: div, runs, skips }; },
    };
  }
  G.makePacer = makePacer;
  G.PACE = PACE;
})(window.ND);
