


























window.ND = window.ND || {};
(function (ND) {
  'use strict';
  const T = ND.touch || {}, MOBILE = !!T.mobile, LOW_END = !!T.lowEnd;
  let mem = 8, cores = 8;
  try { mem = navigator.deviceMemory || 8; cores = navigator.hardwareConcurrency || 8; } catch (e) {                               }

  const WEAK = MOBILE && (mem <= 2 || cores <= 4);
  const LEVELS = ['auto', 'high', 'medium', 'low'];
  const KNOBS = { scale: [1, 0.85, 0.7, 0.5], msaa: [4, 2, 0], bloom: [2, 1, 0], shadows: [2, 1, 0], effects: [2, 1, 0] };
  const PRESET = {
    high: { scale: 1, msaa: 4, bloom: 2, shadows: 2, effects: 2 },
    medium: { scale: 1, msaa: 4, bloom: 1, shadows: 1, effects: 1 },
    low: { scale: 1, msaa: 2, bloom: 0, shadows: 0, effects: 0 },
  };

  function knobFlags(k) {
    return {
      scale: k.scale, msaa: k.msaa, bloom: k.bloom, grain: k.bloom === 2, hq: k.bloom === 2,
      shadows: k.shadows === 2, reflect: k.shadows >= 1, reflectMin: k.shadows === 1 ? 0.08 : 0,
      rays: k.effects >= 1, motes: [0, 0.5, 1][k.effects], weather: k.effects ? 1 : 2,
    };
  }

  function cleanKnobs(o, base) {
    const d = PRESET[base] || PRESET.high, out = { base: PRESET[base] ? base : 'high' };
    for (const k in KNOBS) out[k] = o && KNOBS[k].includes(o[k]) ? o[k] : d[k];
    return out;
  }









  const TIERS = {
    high: { scale: 1, msaa: 4, hq: true, rays: true, motes: 1, bloom: 2, grain: true, shadows: true, reflect: true, weather: 1, tol: 0.2, snap: false, still: false, ltol: 0.015, lband: 1.2, dpr: MOBILE ? (LOW_END ? 1.25 : 1.5) : 2 },
    medium: { scale: 1, msaa: 4, hq: false, rays: true, motes: 0.5, bloom: 1, grain: false, shadows: false, reflect: true, reflectMin: 0.08, weather: 1, tol: 0.4, snap: true, still: true, ltol: 0.06, lband: 1.35, dpr: MOBILE ? 1.25 : 1.5 },
    low: { scale: 1, msaa: 2, hq: false, rays: false, motes: 0, bloom: 0, grain: false, shadows: false, reflect: false, weather: 2, tol: 0.5, snap: true, still: true, ltol: 0.06, lband: 1.35, dpr: 1 },
  };



  const R3D_PHONE = MOBILE && (() => { try { return /[?&](r3d=1|ucb=toon|ucb=detay)(&|$)/.test(location.search || ''); } catch (e) { return false; } })();
  if (R3D_PHONE) { for (const t in TIERS) TIERS[t].msaa = 0; for (const t in PRESET) PRESET[t].msaa = 0; }
  const fns = [];
  const G = ND.gfx = {
    r3dPhone: R3D_PHONE,
    levels: LEVELS,
    tiers: ['high', 'medium', 'low'],
    mobile: MOBILE,
    pref: 'auto',
    tier: 'high',
    f: TIERS.high,
    flags: (tier) => TIERS[tier] || TIERS.high,

    guess() { return !MOBILE ? 'high' : WEAK ? 'low' : 'medium'; },
    getQuality() { return G.pref; },
    knobList: KNOBS,
    preset: (tier) => Object.assign({}, PRESET[tier] || PRESET.high),
    custom: null,

    knobs() { return G.pref === 'custom' && G.custom ? Object.assign({}, G.custom) : Object.assign({ base: G.tier }, PRESET[G.tier] || PRESET.high); },

    setKnob(name, value) {
      if (!KNOBS[name] || !KNOBS[name].includes(value)) return false;
      const k = G.knobs();
      k[name] = value;
      return G.setCustom(k, 'user');
    },

    setCustom(k, why) {
      const c = cleanKnobs(k, k && k.base);
      G.pref = 'custom'; G.custom = c;
      G._setTier(c.base, why || 'user');
      return true;
    },
    active() { return G.tier; },

    setQuality(level) {
      if (!LEVELS.includes(level)) return false;
      G.pref = level; G.custom = null;
      G._setTier(level === 'auto' ? G.guess() : level, 'user');
      return true;
    },

    _setTier(tier, why) {
      if (!TIERS[tier]) tier = 'high';
      G.tier = tier;
      G.f = G.pref === 'custom' && G.custom ? Object.assign({}, TIERS[tier], knobFlags(G.custom)) : TIERS[tier];
      if (ND.settings) ND.settings.hq = G.f.hq;
      for (const fn of fns) { try { fn(G.pref, tier, why || 'user'); } catch (e) { console.warn('[ND.gfx] listener failed', e); } }
    },
    onChange(fn) { fns.push(fn); return () => { const i = fns.indexOf(fn); if (i >= 0) fns.splice(i, 1); }; },
    ladderFrame,
  };




















  const LAD = { SLOW: 20, VSLOW: 36, SEVERE: 55, FAST: 17.8, WORK_UP: 6, WIN: 1000, MIN_N: 4, TARGET: 1000 / 60 };
  function med(a, n) {
    const s = a.slice(0, n).sort((x, y) => x - y);
    return n & 1 ? s[n >> 1] : (s[(n >> 1) - 1] + s[n >> 1]) / 2;
  }
  function ladderFrame(aq, gapMs, workMs, counting, act) {
    if (!aq.gaps) { aq.gaps = []; aq.works = []; }
    if (!counting) { aq.t = aq.n = 0; return; }
    if (!(gapMs >= 0) || gapMs > 1000) return;
    aq.gaps[aq.n] = gapMs; aq.works[aq.n] = workMs; aq.n++;
    aq.t += Math.min(gapMs, 250);
    if (aq.t < LAD.WIN || aq.n < LAD.MIN_N) return;
    const n = aq.n, g = med(aq.gaps, n), w = med(aq.works, n), R = aq.R, cur = R[aq.i];
    const k = aq.targetMs > 0 ? Math.min(1, aq.targetMs / LAD.TARGET) : 1;
    const SLOW = LAD.SLOW * k, VSLOW = LAD.VSLOW * k, SEVERE = LAD.SEVERE * k, FAST = LAD.FAST * k, WORK_UP = LAD.WORK_UP * k;
    aq.t = aq.n = 0;
    aq.stat = { gap: g, work: w, tier: cur.tier, scale: cur.s };
    if (aq.settle > 0) { aq.settle--; return; }
    if (aq.probe) {
      if (g > aq.probe * 0.92) {
        if (aq.probeTier) aq.frozen = true; else aq.resOff[cur.tier] = true;
        act.setRung(aq.from);
      } else if (aq.probeTier) act.toast();
      aq.probe = 0; return;
    }
    if (aq.upT > 0) { aq.upT--; if (g > SLOW) { aq.noUp = true; aq.upT = 0; act.setRung(aq.i + 1); return; } }
    if (g > SLOW) {
      aq.fast = 0;
      if (aq.frozen) return;
      const sev = g > SEVERE ? 2 : g > VSLOW ? 1 : 0;
      if (sev === 0 && ++aq.slow < 2) return;
      aq.slow = 0;
      let j = aq.i + 1;
      if (sev === 2) { const last = R[R.length - 1].tier; if (cur.tier !== last) while (j < R.length && R[j].tier !== last) j++; }
      else if (sev === 1 || aq.resOff[cur.tier]) { const k = j; while (j < R.length && R[j].tier === cur.tier) j++; if (j >= R.length && sev === 1 && !aq.resOff[cur.tier]) j = k; }

      if (aq.resOff[cur.tier]) while (j < R.length && R[j].tier === cur.tier) j++;
      if (j < R.length) { aq.probe = g; aq.probeTier = R[j].tier !== cur.tier; aq.from = aq.i; act.setRung(j); }
    } else {
      aq.slow = 0;
      const up = aq.i > 0 && !aq.noUp && g < FAST && (R[aq.i - 1].tier === cur.tier || w < WORK_UP);
      if (!up) { aq.fast = 0; return; }
      if (++aq.fast >= 10) { aq.fast = 0; aq.upT = 3; act.setRung(aq.i - 1); }
    }
  }
  G.LAD = LAD;


















  const PACE = { TARGET: 1000 / 60, WIN: 24 };
  function makePacer(fps = 60) {
    const gaps = new Float64Array(PACE.WIN), sorted = new Float64Array(PACE.WIN);
    let n = 0, k = 0, prev = -1, acc = 0, period = PACE.TARGET, div = 1, even = true, runs = 0, skips = 0;
    let T = fps > 0 ? 1000 / fps : 0;
    function estimate() {
      const m = Math.min(n, PACE.WIN);
      if (m < 6) return;
      sorted.set(gaps);
      const s = sorted.subarray(0, m).sort();
      period = s[m >> 2];
      if (!T) { div = 1; even = true; return; }
      const r = T / period;
      div = Math.max(1, Math.floor(r + 0.25));

      even = T >= PACE.TARGET - 0.01 || r < 1 || Math.abs(r - Math.round(r)) <= 0.25;
    }
    return {
      due(now) {
        if (prev < 0) { prev = now; acc = 0; runs++; return true; }
        const gap = now - prev; prev = now;
        if (!(gap > 0) || gap > 250) { acc = 0; runs++; return true; }
        gaps[k] = gap; k = (k + 1) % PACE.WIN; if (n < PACE.WIN) n++;
        estimate();
        if (!T) { runs++; return true; }
        if (!even) {

          acc = Math.max(acc, -period / 2) + gap;
          if (acc < T - period / 2) { skips++; return false; }
          acc = Math.min(Math.max(acc - T, -period / 2), period / 2);
          runs++;
          return true;
        }
        if (div === 1) { acc = 0; runs++; return true; }

        acc = Math.max(acc, -period / 2) + gap;
        const target = div * period;
        if (acc < target - period / 2) { skips++; return false; }

        acc = Math.min(Math.max(acc - target, -period / 2), period / 4);
        runs++;
        return true;
      },
      reset() { prev = -1; acc = 0; },

      setTarget(f) { T = f > 0 ? 1000 / f : 0; acc = 0; estimate(); },
      get target() { return T ? Math.round(1000 / T) : 0; },
      get period() { return period; },
      stat() { return { periodMs: +period.toFixed(2), every: div, even, target: T ? Math.round(1000 / T) : 0, runs, skips }; },
    };
  }
  G.makePacer = makePacer;
  G.PACE = PACE;


  G.FPS = ['60', '90', '120', 'max'];
  G.fpsDefault = () => (MOBILE ? '60' : 'max');
  G.fpsOf = (v) => (v === 'max' ? 0 : +v || 60);
})(window.ND);
