// Gölge Düellosu — fight state for online play (rollback netcode, phase 0): save, restore, hash, quiet re-simulation
//
// game.saveState()  → everything the fight needs to go on bit for bit: both fighters (pose, joints, state machine,
//                     cloth, ragdoll, chain, loose sword...), their controllers (held keys, press times), the CPU minds
//                     if any, projectiles, sword lock, rally, round / match flow, slow motion and hit-stop timers, the
//                     simulation clocks, the scene clock and the fight's random stream (ND.rng).
// game.loadState(s) → puts it back in place (the same fighter / controller / AI objects, so every reference to them
//                     stays valid). The saved object is not consumed: it can be loaded again.
// game.hashState()  → a short fingerprint of that state (two peers compare it to catch a desync; tests compare runs).
// game.resim(n, before, after) → n simulation steps with nothing presented (no sound, no new particles, camera
//                     untouched): a rollback replays the steps after the corrected input this way; before(i) feeds step
//                     i's inputs, after(i) may save the state it reached.
// Not in the state: pictures and sound (particles, decals, special-effect layers, camera, HUD, KO replay pictures).
// They are re-derived from the fight or simply carry on from what the player saw.
(function (ND) {
  'use strict';
  const G = ND.game;
  if (!G) return;
  const hasOwn = Object.prototype.hasOwnProperty;

  // ------------------------------------------------------------ what belongs to the fight
  // Game fields that are fight state (the rest of ND.game is menus, screens, HUD and renderer bookkeeping).
  const GAME_KEYS = ['mode', 'matchLevel', 'winsNeed', 'phase', 'pt', 'round', 'wins', 'timer', 'clock', 'projs', 'lock', 'rally',
    'hitstopT', 'slow', 'slowT', 'slowV', 'cineT', 'cineX', 'cineZ', 'dim', 'focus', 'flags', 'doubleKO', 'winner', 'loser',
    'stats', 'recording', 'recOdd', 'recN', 'koIndex', 'replay', 'tz'];
  // Fighter fields never saved, restored or fingerprinted: drawing caches and presentation links, and the purely visual
  // state the fight never reads (hair / scarf / sash cloth, blade streak, afterimages). After a rollback those simply
  // carry on from the picture the player saw.
  const SKIP = { _bake: 1, _dopt: 1, _litFn: 1, _trailFn: 1, _bb: 1, _ropes: 1, _ropesCol: 1, _ropesTails: 1, _ropesSash: 1, _pd: 1, comboTxt: 1,
    tails: 1, sash: 1, trail: 1, ghosts: 1 };
  // Saved (so a restore looks right) but left out of the fingerprint: they may differ between two devices without the
  // fight differing (afterimage count follows the graphics setting; decal count; the last input device).
  const NOHASH = { decals: 1, lastSrc: 1, srcs: 1, edges: 1, onPress: 1 };

  // Shared tables the fight points into but never changes (moves, poses, characters, CPU levels...): kept by reference.
  // (marked with a symbol property: a plain property check, cheaper than a WeakSet lookup on every copied object)
  const ST = Symbol('static');
  const STATIC = { has: (o) => o[ST] === true, add: (o) => { try { Object.defineProperty(o, ST, { value: true }); } catch (e) { /* frozen */ } } };
  const host = (o) => typeof o.nodeType === 'number' || typeof o.getContext === 'function' || typeof o.addColorStop === 'function' || typeof o.connect === 'function';
  function reg(o) {
    if (o === null || typeof o !== 'object' || STATIC.has(o) || host(o)) return;
    STATIC.add(o);
    for (const k of Object.keys(o)) reg(o[k]);
  }
  let atkN = -1;
  function statics() {
    const n = ND.ATK ? Object.keys(ND.ATK).length : 0;
    if (n !== atkN) { // moves are added lazily (KAESHI finisher variants): walk again, known ones stop at once
      atkN = n;
      for (const t of [ND.POSES, ND.ATK, ND.CHARS, ND.AI_LEVELS, ND.DEFL, ND.KAESHI, ND.SPECIALS, ND.KITS, ND.COMBO, ND.LEN, ND.cine && ND.cine.TY]) reg(t);
      for (const k of Object.keys(ND.ATK || {})) reg(ND.ATK[k]); // (the table itself is marked already: its new entries)
    }
    for (const f of G.F) { reg(f.ch); reg(f.col); reg(f.wpn); if (f.P !== ND.POSES) reg(f.P); }
  }

  // ------------------------------------------------------------ deep copy (identity kept: shared → shared, cycles ok)
  function copy(v, memo) {
    if (v === null || typeof v !== 'object') return v; // numbers, strings, functions (kept as they are)
    let c = memo.get(v);
    if (c !== undefined) return c;
    if (STATIC.has(v)) return v;
    if (Array.isArray(v)) {
      c = []; memo.set(v, c); // (pushed, not preallocated: a packed array like the original)
      for (let i = 0; i < v.length; i++) c.push(copy(v[i], memo));
      return c;
    }
    const proto = Object.getPrototypeOf(v);
    if (proto === Object.prototype) c = {};
    else {
      if (ArrayBuffer.isView(v)) { c = v.slice(); memo.set(v, c); return c; }
      if (v instanceof Set) { c = new Set(); memo.set(v, c); for (const x of v) c.add(copy(x, memo)); return c; }
      if (v instanceof Map) { c = new Map(); memo.set(v, c); for (const [k, x] of v) c.set(copy(k, memo), copy(x, memo)); return c; }
      if (host(v)) return v;
      c = Object.create(proto);
    }
    memo.set(v, c);
    for (const k in v) if (hasOwn.call(v, k)) c[k] = copy(v[k], memo);
    return c;
  }
  // the objects restored in place: fighters, their controllers, CPU minds
  function roots() {
    const F = G.F, R = [F[0], F[1], F[0].ctrl, F[1].ctrl];
    for (const a of G.ais) R.push(a);
    return R;
  }
  const rootMemo = (R) => { const m = new Map(); for (const o of R) m.set(o, o); return m; };
  function saveObj(o, memo) {
    const s = {};
    for (const k in o) if (hasOwn.call(o, k) && !SKIP[k] && o[k] !== undefined) s[k] = copy(o[k], memo);
    return s;
  }
  function loadObj(o, s, memo) {
    // a field added after the save becomes undefined (never deleted: that would put the object in V8's slow dictionary
    // mode; the fight reads undefined and absent alike)
    for (const k of Object.keys(o)) if (!SKIP[k] && !hasOwn.call(s, k) && o[k] !== undefined) o[k] = undefined;
    for (const k in s) o[k] = copy(s[k], memo);
  }

  G.saveState = function () {
    statics();
    const R = roots(), memo = rootMemo(R), g = {};
    for (const k of GAME_KEYS) g[k] = copy(G[k], memo);
    return {
      v: 1, nAi: G.ais.length, objs: R.map((o) => saveObj(o, memo)), g,
      simClock: ND.simClock, rng: ND.rng.s, sceneT: ND.scene.t, wind: ND.scene.wind,
    };
  };
  G.loadState = function (S) {
    if (!S || S.v !== 1 || S.nAi !== G.ais.length) throw new Error('loadState: not a state of this fight');
    const R = roots(), memo = rootMemo(R);
    R.forEach((o, i) => loadObj(o, S.objs[i], memo));
    for (const k of GAME_KEYS) G[k] = copy(S.g[k], memo);
    ND.simClock = S.simClock; ND.rng.s = S.rng; ND.scene.t = S.sceneT; ND.scene.wind = S.wind;
  };

  // ------------------------------------------------------------ fingerprint
  // FNV-1a over 32-bit words, two lanes; numbers by their exact IEEE bits, object keys in sorted order.
  const F64 = new Float64Array(1), U32 = new Uint32Array(F64.buffer);
  function hasher(pre) {
    let a = 0x811c9dc5, b = 0x9e3779b9;
    const w = (x) => { a = Math.imul(a ^ (x | 0), 16777619); b = Math.imul(b ^ (x | 0), 2246822519) ^ (b >>> 15); };
    const seen = new Map();
    if (pre) for (const o of pre) seen.set(o, -1 - seen.size); // other parts: referenced, not repeated
    const val = (v) => {
      switch (typeof v) {
        case 'number':
          if (v !== v) { w(0x4e614e); return; }
          F64[0] = v; w(1); w(U32[0]); w(U32[1]); return;
        case 'string': w(2); w(v.length); for (let i = 0; i < v.length; i++) w(v.charCodeAt(i)); return;
        case 'boolean': w(v ? 3 : 4); return;
        case 'undefined': w(5); return;
        case 'function': w(6); return;
        default:
      }
      if (v === null) { w(7); return; }
      const id = seen.get(v);
      if (id !== undefined) { w(8); w(id); return; }
      seen.set(v, seen.size);
      if (host(v)) { w(9); return; }
      if (v instanceof ND.Ctrl) { ctrl(v); return; }
      if (Array.isArray(v) || ArrayBuffer.isView(v)) { w(10); w(v.length); for (let i = 0; i < v.length; i++) val(v[i]); return; }
      if (v instanceof Set) { w(11); w(v.size); for (const x of v) val(x); return; }
      if (v instanceof Map) { w(12); w(v.size); for (const [k, x] of v) { val(k); val(x); } return; }
      w(13);
      const keys = Object.keys(v).filter((k) => !SKIP[k] && !NOHASH[k] && v[k] !== undefined).sort(); // undefined = absent
      w(keys.length);
      for (const k of keys) { val(k); val(v[k]); }
    };
    // a controller as the fight sees it: which actions are held, the press buffer, the double-tap memory
    const ctrl = (c) => {
      w(14);
      let m = 0;
      for (let i = 0; i < ND.Ctrl.ACTS.length; i++) if (c.held(ND.Ctrl.ACTS[i])) m |= 1 << i;
      w(m); val(c.buf); val(c.lastTap); val(c.tapDir); val(!!c.noTap); val(c.mask || null);
    };
    return { val, hex: () => (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0') };
  }
  // one fingerprint per part (easier to see what diverged first) and a combined one
  G.hashParts = function () {
    const out = {}, R = roots();
    const part = (name, fn) => { const h = hasher(R); fn(h.val); out[name] = h.hex(); };
    const inner = (o) => (v) => { for (const k of Object.keys(o).filter((k) => !SKIP[k] && !NOHASH[k] && o[k] !== undefined).sort()) { v(k); v(o[k]); } };
    part('f1', inner(R[0])); part('f2', inner(R[1]));
    part('ctrl', (v) => { for (const c of [R[2], R[3]]) { const h = hasher(); h.val(c); v(h.hex()); } });
    part('ai', (v) => { for (let i = 4; i < R.length; i++) inner(R[i])(v); });
    part('game', (v) => { for (const k of GAME_KEYS) { v(k); v(G[k]); } });
    part('clock', (v) => { v(ND.simClock); v(ND.rng.s); v(ND.scene.t); v(ND.scene.wind); });
    return out;
  };
  // the shared tables are marked when a match starts (not at its first save, in the middle of the fight)
  const newMatch = G.newMatch;
  G.newMatch = function () { const r = newMatch.apply(this, arguments); statics(); return r; };
  G.hashState = function () {
    const h = hasher(), R = roots();
    for (const o of R) h.val(o);
    for (const k of GAME_KEYS) { h.val(k); h.val(G[k]); }
    h.val(ND.simClock); h.val(ND.rng.s); h.val(ND.scene.t); h.val(ND.scene.wind);
    return h.hex();
  };

  // ------------------------------------------------------------ quiet re-simulation
  // n steps (game.tick simOnly) without sound, new particles, decals, special-effect layers or cinematic overlays,
  // and with the camera as it was: the picture carries on from what the player already saw.
  G.resim = function (n, before, after) {
    const fx = ND.fx, S = ND.specialFx, C = ND.cine, cam = ND.cam, au = ND.audio;
    const keep = { p: fx.parts, d: fx.decals, t: fx.texts, s: S && S.list, q: au.quiet,
      c: C && [C.slashes, C.nums, C.rings, C.banner, C.combos, C.pops],
      cam: [cam.x, cam.y, cam.z, cam.shk, cam.shx, cam.shy] };
    fx.parts = []; fx.decals = []; fx.texts = [];
    if (S) S.list = [];
    if (C) { C.slashes = []; C.nums = []; C.rings = []; C.combos = [null, null]; C.pops = [null, null]; }
    au.quiet = true;
    try {
      for (let i = 0; i < n; i++) { if (before) before(i); G.tick(false); if (after) after(i); }
    } finally {
      fx.parts = keep.p; fx.decals = keep.d; fx.texts = keep.t;
      if (S) S.list = keep.s;
      if (C) [C.slashes, C.nums, C.rings, C.banner, C.combos, C.pops] = keep.c;
      au.quiet = keep.q;
      [cam.x, cam.y, cam.z, cam.shk, cam.shx, cam.shy] = keep.cam;
    }
  };
})(window.ND);
