// Shadow Duel — ranked "shadow opponents" (Gölge rakip; docs/SHADOW-DUEL-ONLINE.md "Gölge rakip", supabase/ranked-ghost.sql)
//
// When nobody is found in the ranked queue for a while, the server may offer a SHADOW: the CPU fighting in the style of a
// real ranked player, always labelled as such ("<nick>'s shadow", the 影 mark), never shown as a live player. This file
// is the style math only (no screens, no server calls; js/ranked.js does those):
//   sample(...)  one fight's style, measured on this device from a finished ranked match (the local player's own input
//                frames, the fight's own counters, the distance kept); uploaded after the match (nd_rank_style), where
//                the server checks it against the match, clamps it again and blends it into the player's profile
//   clamp(o)     a style object reduced to the known fields, each inside its range (the same ranges as the server's
//                nd_private.nd_rank_style_clean; scripts/ghost-check.mjs compares them)
//   level(style, rating, ninja)
//                the CPU profile (an ND.AI_LEVELS-shaped object, js/ai.js) a shadow fights with: the skill comes from the
//                shadow owner's rating, between Apprentice and 60 % of the way from Master to Legend (never more: a
//                shadow is never superhuman); the habits (how often it parries, counters, attacks, guards, dashes, kicks,
//                throws, jumps, spends KI, the distance it keeps) lean towards the real player's, inside fixed bounds.
//                Pure: the same input gives the same profile on every device, and the fight itself is seeded by the
//                server, so a shadow fight is as deterministic as any CPU fight.
// Online-only (index.html data-online): not in the Yandex / Playgama packages.
(function (ND) {
  'use strict';
  // the profile fields and their ranges (shares and rates 0..1; range = pixels between the fighters in neutral)
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

  // ---------------------------------------------------------------- one fight's style (this device's player)
  // Input frames (js/input.js): bits 0–9 = held, bits 10–19 = fresh presses (ACTS order below).
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
  /** o: { mine, opp (input frame arrays), n (confirmed steps), stats ({ parries, counters, specials } of the local
   *  fighter), dist ([sum, count] of the distance sampled in neutral) } → a clamped style, or null (too short a fight) */
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

  // ---------------------------------------------------------------- the CPU profile of a shadow
  // skill by rating: t = 0 Apprentice (≤ 1150), 1 Master (1500), CAP = 60 % from Master to Legend (≥ 1710)
  const CAP = 1.6;
  // habit knobs: [lowest, highest] whatever the style says (a habit, not more skill)
  const BOUNDS = {
    parry: [0.03, 0.5], counter: [0.15, 0.82], aggr: [0.25, 0.8], guard: [0.4, 0.82], dodge: [0.06, 0.4],
    heavy: [0.05, 0.45], kick: [0.1, 0.6], kickNear: [0.2, 0.65], throwFar: [0.03, 0.4], jump: [0.02, 0.25], ki: [0.03, 0.4],
  };
  const REACT_MIN = 0.16, TICK_MIN = [0.1, 0.2];
  const W = 0.6; // how far a habit leans from the rating's base towards the real player's
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
    for (const k of Object.keys(BOUNDS)) if (num(lv[k])) lv[k] = bound(k, lv[k]); // (also without a style number)
    // every skill number stays inside what Apprentice and the cap allow (react / tick: smaller is harder)
    const lo = skillAt(0), hi = skillAt(CAP);
    for (const k of Object.keys(hi)) {
      if (BOUNDS[k] || k === 'react' || k === 'tick' || !num(lv[k])) continue;
      lv[k] = r3(Math.min(Math.max(lo[k], hi[k]), Math.max(Math.min(lo[k], hi[k]), lv[k])));
    }
    lv.read = r3(lv.read * 0.8); // reading a repeated attack is the CPU's own trick, not a habit: a little less of it
    lv.react = r3(Math.max(REACT_MIN, lv.react));
    lv.tick = [r3(Math.max(TICK_MIN[0], lv.tick[0])), r3(Math.max(TICK_MIN[1], lv.tick[1]))];
    // the distance it keeps: near the real player's, never far from what its weapon reaches (a ranged fighter keeps its own)
    const ch = ND.CHARS && ND.CHARS.find((c) => c.id === ninja);
    if (s.range != null && ch && !(ch.ai && ch.ai.ideal)) {
      const def = 88 + ch.blade * 0.72;
      lv.range = Math.round(Math.min(def + 90, Math.max(def - 40, s.range)));
    }
    lv.name = 'Shadow';
    return lv;
  }

  // (minSecs: the shortest fight whose style counts; tests may lower it)
  const G = ND.ghost = { FIELDS, BOUNDS, CAP, REACT_MIN, TICK_MIN, minSecs: 20, clamp, sample, presses, level, skillAt, skillT };
})(window.ND);
