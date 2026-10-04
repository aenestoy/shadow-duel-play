

















(function (ND) {
  'use strict';

  const FIELDS = { parry: [0, 1], counter: [0, 1], aggr: [0, 1], guard: [0, 1], dash: [0, 1], kick: [0, 1], heavy: [0, 1], throw: [0, 1], jump: [0, 1], ki: [0, 1], range: [40, 600] };
  const num = (v) => typeof v === 'number' && isFinite(v);
  const r3 = (v) => Math.round(v * 1000) / 1000;
  function clamp(o) {
    const out = {};
    if (!o || typeof o !== 'object' || Array.isArray(o)) return out;
    for (const k of Object.keys(FIELDS)) {
      const v = o[k];
      if (!num(v)) continue;
      const [lo, hi] = FIELDS[k];
      out[k] = r3(Math.min(hi, Math.max(lo, v)));
    }
    return out;
  }



  const ACTS = ['left', 'right', 'up', 'guard', 'light', 'heavy', 'kick', 'throw', 'dodge', 'special'];
  const STEP_S = 1 / 120;
  const MIN_PRESSES = 10;
  function presses(frames, n) {
    const c = {};
    for (const a of ACTS) c[a] = 0;
    if (!frames) return c;
    for (let t = 0; t < n; t++) {
      const v = frames[t] | 0;
      if (!(v >> 10)) continue;
      for (let i = 0; i < ACTS.length; i++) if (v & (1 << (10 + i))) c[ACTS[i]]++;
    }
    return c;
  }


  function sample(o) {
    if (!o || !(o.n > 0)) return null;
    const secs = o.n * STEP_S;
    const m = presses(o.mine, o.n), p = presses(o.opp, o.n), st = o.stats || {};
    const atk = m.light + m.heavy + m.kick + m.throw;
    const total = atk + m.guard + m.dodge + m.up + m.special;
    if (secs < G.minSecs || total < MIN_PRESSES) return null;
    const oppAtk = p.light + p.heavy + p.kick + p.throw + p.special;
    const parries = st.parries | 0, counters = st.counters | 0, specials = st.specials | 0;
    const s = {
      parry: parries / Math.max(4, oppAtk),
      counter: counters / Math.max(2, parries + m.guard),
      aggr: atk / secs / 2.5,
      guard: m.guard / total,
      dash: m.dodge / total,
      kick: m.kick / Math.max(1, atk),
      heavy: m.heavy / Math.max(1, atk),
      throw: m.throw / Math.max(1, atk),
      jump: m.up / total,
      ki: specials / Math.max(1, secs / 30),
    };
    if (o.dist && o.dist[1] >= 8) s.range = o.dist[0] / o.dist[1];
    return clamp(s);
  }



  const CAP = 1.6;

  const BOUNDS = {
    parry: [0.03, 0.5], counter: [0.15, 0.82], aggr: [0.25, 0.8], guard: [0.4, 0.82], dodge: [0.06, 0.4],
    heavy: [0.05, 0.45], kick: [0.1, 0.6], kickNear: [0.2, 0.65], throwFar: [0.03, 0.4], jump: [0.02, 0.25], ki: [0.03, 0.4],
  };
  const REACT_MIN = 0.16, TICK_MIN = [0.1, 0.2];
  const W = 0.6;
  const lerp = (a, b, t) => a + (b - a) * t;
  const bound = (k, v) => r3(Math.min(BOUNDS[k][1], Math.max(BOUNDS[k][0], v)));
  function skillAt(t) {
    const L = ND.AI_LEVELS, a = t <= 1 ? L[0] : L[1], b = t <= 1 ? L[1] : L[2], k = t <= 1 ? t : t - 1;
    const o = {};
    for (const key of Object.keys(L[1])) {
      if (key === 'name') continue;
      const x = a[key], y = b[key];
      if (Array.isArray(x)) o[key] = x.map((v, i) => r3(lerp(v, y[i], k)));
      else if (num(x) && num(y)) o[key] = r3(lerp(x, y, k));
    }
    return o;
  }
  const skillT = (rating) => Math.max(0, Math.min(CAP, ((num(rating) ? rating : 1500) - 1150) / 350));
  function level(style, rating, ninja) {
    const s = clamp(style), lv = skillAt(skillT(rating));
    const lean = (k, base, target) => bound(k, base + (target - base) * W);
    if (s.parry != null) lv.parry = lean('parry', lv.parry, 0.04 + s.parry * 0.9);
    if (s.counter != null) lv.counter = lean('counter', lv.counter, 0.2 + s.counter * 0.7);
    if (s.aggr != null) lv.aggr = lean('aggr', lv.aggr, 0.3 + s.aggr * 0.55);
    if (s.guard != null) lv.guard = lean('guard', lv.guard, 0.45 + s.guard);
    if (s.dash != null) lv.dodge = lean('dodge', lv.dodge, 0.08 + s.dash);
    if (s.heavy != null) lv.heavy = lean('heavy', 0.2, 0.06 + s.heavy * 0.6);
    if (s.kick != null) { lv.kick = lean('kick', 0.35, 0.15 + s.kick * 0.9); lv.kickNear = lean('kickNear', 0.45, 0.25 + s.kick * 0.6); }
    if (s.throw != null) lv.throwFar = lean('throwFar', 0.22, 0.05 + s.throw * 0.8);
    if (s.jump != null) lv.jump = lean('jump', 0.1, 0.03 + s.jump * 0.5);
    if (s.ki != null) lv.ki = lean('ki', r3(lv.smart * 0.25), 0.05 + s.ki * 0.35);
    for (const k of Object.keys(BOUNDS)) if (num(lv[k])) lv[k] = bound(k, lv[k]);

    const lo = skillAt(0), hi = skillAt(CAP);
    for (const k of Object.keys(hi)) {
      if (BOUNDS[k] || k === 'react' || k === 'tick' || !num(lv[k])) continue;
      lv[k] = r3(Math.min(Math.max(lo[k], hi[k]), Math.max(Math.min(lo[k], hi[k]), lv[k])));
    }
    lv.read = r3(lv.read * 0.8);
    lv.react = r3(Math.max(REACT_MIN, lv.react));
    lv.tick = [r3(Math.max(TICK_MIN[0], lv.tick[0])), r3(Math.max(TICK_MIN[1], lv.tick[1]))];

    const ch = ND.CHARS && ND.CHARS.find((c) => c.id === ninja);
    if (s.range != null && ch && !(ch.ai && ch.ai.ideal)) {
      const def = 88 + ch.blade * 0.72;
      lv.range = Math.round(Math.min(def + 90, Math.max(def - 40, s.range)));
    }
    lv.name = 'Shadow';
    Object.defineProperty(lv, '__t', { value: skillT(rating) });
    return lv;
  }


  const G = ND.ghost = { FIELDS, BOUNDS, CAP, REACT_MIN, TICK_MIN, minSecs: 20, clamp, sample, presses, level, skillAt, skillT };
})(window.ND);
