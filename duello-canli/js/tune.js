// Gölge Düellosu — remote difficulty tuning (docs/SHADOW-DUEL-UZAK-AYAR.md)
//
// The CPU level numbers (ND.AI_LEVELS 0–3, ai.js), Apprentice+'s place between Apprentice and Usta (k), the CPU's KI
// wait and the journey ladder (ND.JOURNEY.ladder, journey.js) can be changed without a new build: a small JSON of
// overrides, every part optional, e.g.
//   {"v":1,"levels":{"1":{"parry":0.35}},"apprenticePlusK":0.4,"kiWait":6,"duelK":0.5,"duelSoft":0.5,
//    "journey":{"levels":[0,0,0,1,1,2,2,3],"ai":[null,0.5,0.5,null,null,null,null,null],"hp":[0,0,0,0,0,0,1.15,0]}}
// Where it comes from:
//   - the plain build (CrazyGames, our own site): our server, RPC nd_tune (supabase/ai-tune.sql);
//   - the Yandex and Playgama builds (no outside requests there): the portal's own remote config (src/portal-bridge.ts
//     remoteConfig): the flag "ai_tune"; a value longer than the portal allows (a Yandex flag holds 100 characters)
//     continues in "ai_tune_2" … "ai_tune_20", joined in order.
// Rules:
//   - read at boot without waiting (one short request, ≤ 2 s); the first fight never waits for it;
//   - the last good tune is kept on this device and used at once on the next launch; no answer → that copy, else the
//     built-in defaults; the server says "none" → back to the defaults (and the copy is dropped);
//   - the CPU numbers change only between fights: a new tune waits until the next match's CPU is made (ND.tune.commit,
//     ai.js) and stays fixed for that whole fight (the simulation stays deterministic). The ladder is read only when a
//     journey route is built, so it changes at once (in-progress runs take it on their next load);
//   - every number is clamped to a safe range; unknown keys and wrong types are ignored; a tune that does not parse
//     counts as none. Nothing here can stop the game: any failure leaves the defaults.
//   - automated browsers (tests) always run on the defaults: no stored copy, no request (navigator.webdriver).
// Debug (address): ?tune=show logs the active tune; ?tune=<url-encoded JSON> uses that tune for this page load (not
// stored, no request); ?tune=off the defaults only; ?tune=remote reads the server / portal even in an automated browser.
// Console: ND.tune.state().
(function (ND) {
  'use strict';
  const L = ND.AI_LEVELS, K = ND.AI_KNOBS, J = ND.JOURNEY;
  if (!L || !K || !J || !J.ladder) return;
  const LS = 'golge-duellosu-ai-tune', FLAG = 'ai_tune', MAX_LEN = 4000, TIMEOUT_MS = 2000, READY_MS = 10000;
  const P = [0, 1];
  // field → [min, max]. react = reaction time (s), mash = presses per second in a sword lock, the rest are chances 0–1.
  const FIELDS = { react: [0.05, 1.5], parry: P, guard: P, dodge: P, aggr: P, combo: P, smart: P, mash: [1, 20], counter: P, rally: P,
    cmd: P, str: P, jug: P, kc: P, read: P };
  const TICK = [0.02, 2]; // seconds between two decisions (from, to)
  const LEVEL_KEYS = ['0', '1', '2', '3'], AI_KEYS = [0, 0.5, 1, 2, 3], N = 8;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const clamp = (v, r) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(r[1], Math.max(r[0], v)) : undefined);

  // ---------------------------------------------------------------- built-in defaults (read before any tune)
  const DEF = { levels: {}, apprenticePlusK: K.apprenticePlusK, kiWait: K.kiWait, duelK: K.duelK, duelSoft: K.duelSoft,
    journey: { levels: J.ladder.levels.slice(), ai: J.ladder.ai.slice(), hp: J.ladder.hp.slice() } };
  for (const l of LEVEL_KEYS) {
    const d = DEF.levels[l] = {};
    for (const f of Object.keys(FIELDS)) d[f] = L[l][f];
    d.tick = L[l].tick.slice();
  }

  // ---------------------------------------------------------------- validation
  // raw (JSON text or object) → a clean tune (only valid, clamped overrides) or null (not a tune: ignored)
  function clean(raw) {
    let o = raw;
    if (typeof o === 'string') {
      if (!o.trim() || o.length > MAX_LEN) return null;
      try { o = JSON.parse(o); } catch (e) { return null; }
    }
    if (!isObj(o)) return null;
    if (own(o, 'v') && o.v !== 1) return null; // a later format this build does not know
    const t = {};
    if (isObj(o.levels)) {
      for (const l of LEVEL_KEYS) {
        const s = o.levels[l];
        if (!isObj(s)) continue;
        const d = {};
        for (const f of Object.keys(FIELDS)) { const v = clamp(s[f], FIELDS[f]); if (v !== undefined) d[f] = v; }
        if (Array.isArray(s.tick) && s.tick.length === 2) {
          const a = clamp(s.tick[0], TICK), b = clamp(s.tick[1], TICK);
          if (a !== undefined && b !== undefined) d.tick = [Math.min(a, b), Math.max(a, b)];
        }
        if (Object.keys(d).length) (t.levels || (t.levels = {}))[l] = d;
      }
    }
    const k = clamp(o.apprenticePlusK, [0, 1]);
    if (k !== undefined) t.apprenticePlusK = k;
    const w = clamp(o.kiWait, [1, 120]);
    if (w !== undefined) t.kiWait = w;
    const dk = clamp(o.duelK, [0, 1]);
    if (dk !== undefined) t.duelK = dk;
    const ds = clamp(o.duelSoft, [0, 1]);
    if (ds !== undefined) t.duelSoft = ds;
    // (per ninja: {"duelKch": {"kage": 1, "yuki": 0.8}})
    if (isObj(o.duelKch)) { const m = {}; for (const [id, v] of Object.entries(o.duelKch)) { const c = /^[a-z]{2,12}$/.test(id) ? clamp(v, [0, 1]) : undefined; if (c !== undefined) m[id] = c; } if (Object.keys(m).length) t.duelKch = m; }
    // (per ninja, Apprentice's own: {"duelK0ch": {"akane": 0.5}})
    if (isObj(o.duelK0ch)) { const m = {}; for (const [id, v] of Object.entries(o.duelK0ch)) { const c = /^[a-z]{2,12}$/.test(id) ? clamp(v, [0, 1]) : undefined; if (c !== undefined) m[id] = c; } if (Object.keys(m).length) t.duelK0ch = m; }
    // (per ninja, the duel CPU's damage: {"duelDmg": {"kage": 1.5}})
    if (isObj(o.duelDmg)) { const m = {}; for (const [id, v] of Object.entries(o.duelDmg)) { const c = /^[a-z]{2,12}$/.test(id) ? clamp(v, [0.5, 2]) : undefined; if (c !== undefined) m[id] = c; } if (Object.keys(m).length) t.duelDmg = m; }
    if (isObj(o.journey)) {
      // per fight; an entry that is missing or of the wrong type keeps the default (undefined)
      const per = (a, fn) => (Array.isArray(a) ? Array.from({ length: N }, (_, i) => (i < a.length ? fn(a[i]) : undefined)) : null);
      const lv = per(o.journey.levels, (v) => { const c = clamp(v, [0, 3]); return c === undefined ? undefined : Math.round(c); });
      const ai = per(o.journey.ai, (v) => (v === null ? null : AI_KEYS.includes(v) ? v : undefined));
      const hp = per(o.journey.hp, (v) => { const c = clamp(v, [0, 2]); return c === undefined ? undefined : c <= 0 ? 0 : Math.max(0.5, c); });
      const j = {};
      if (lv && lv.some((v) => v !== undefined)) j.levels = lv;
      if (ai && ai.some((v) => v !== undefined)) j.ai = ai;
      if (hp && hp.some((v) => v !== undefined)) j.hp = hp;
      if (Object.keys(j).length) t.journey = j;
    }
    return t;
  }

  // a clean tune (or null) → every number in force (defaults where the tune says nothing)
  function effective(t) {
    t = t || {};
    const E = { levels: {}, apprenticePlusK: t.apprenticePlusK ?? DEF.apprenticePlusK, kiWait: t.kiWait ?? DEF.kiWait, duelK: t.duelK ?? DEF.duelK, duelSoft: t.duelSoft ?? DEF.duelSoft, duelKch: t.duelKch || null, duelK0ch: t.duelK0ch || null, duelDmg: t.duelDmg || null, journey: {} };
    for (const l of LEVEL_KEYS) {
      const o = (t.levels && t.levels[l]) || {};
      E.levels[l] = Object.assign({}, DEF.levels[l], o, { tick: (o.tick || DEF.levels[l].tick).slice() });
    }
    for (const key of ['levels', 'ai', 'hp']) {
      const o = (t.journey && t.journey[key]) || [];
      E.journey[key] = DEF.journey[key].map((d, i) => (o[i] !== undefined ? o[i] : d));
    }
    return E;
  }

  // ---------------------------------------------------------------- putting numbers in place (in place: same objects)
  let KCH0 = null, KDM0 = null, KK00 = null; // (the built-in per-ninja duel factors, kept from before the first tune)
  function applyLevels(E) {
    for (const l of LEVEL_KEYS) {
      const lv = L[l], e = E.levels[l];
      for (const f of Object.keys(FIELDS)) lv[f] = e[f];
      lv.tick[0] = e.tick[0]; lv.tick[1] = e.tick[1];
    }
    K.apprenticePlusK = E.apprenticePlusK; K.kiWait = E.kiWait; K.duelK = E.duelK; K.duelSoft = E.duelSoft; if (!KCH0) KCH0 = Object.assign({}, K.duelKch || {}); K.duelKch = Object.assign({}, KCH0, E.duelKch || {});
    if (!KDM0) KDM0 = Object.assign({}, K.duelDmg || {}); K.duelDmg = Object.assign({}, KDM0, E.duelDmg || {});
    if (!KK00) KK00 = Object.assign({}, K.duelK0ch || {}); K.duelK0ch = Object.assign({}, KK00, E.duelK0ch || {});
    if (ND.aiDerive) ND.aiDerive();
  }
  function applyLadder(E) {
    for (const key of ['levels', 'ai', 'hp']) for (let i = 0; i < N; i++) J.ladder[key][i] = E.journey[key][i];
  }

  // ---------------------------------------------------------------- state
  let active = null, activeSrc = 'default', activeText = ''; // CPU numbers in force (null = defaults)
  let pending, pendingSrc = '', pendingText = ''; // waiting for the next match (undefined = nothing waiting)
  let locked = false; // ?tune=<json> / ?tune=off: this page load keeps what it was given
  let lastFetch = 'waiting'; // the boot read: 'waiting' → 'set' | 'none' | 'failed' | 'off' (see refresh)
  const qs = (() => { try { return new URLSearchParams(location.search || ''); } catch (e) { return new URLSearchParams(''); } })();
  const q = qs.get('tune');
  const show = q === 'show';
  const bot = (() => { try { return navigator.webdriver === true; } catch (e) { return false; } })();
  const log = (why) => { if (show) try { console.info('[tune] ' + why + ': ' + JSON.stringify(T.state())); } catch (e) { /* no console */ } };
  const store = {
    get() { try { return localStorage.getItem(LS); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(LS, v); } catch (e) { /* storage blocked */ } },
    drop() { try { localStorage.removeItem(LS); } catch (e) { /* storage blocked */ } },
  };

  const T = ND.tune = {
    DEFAULTS: DEF, FLAG, clean, effective,
    // A tune that arrived since the last match goes in place now. Called by ai.js when a match's CPU is made (and
    // at boot for the stored copy); never while a fight runs. true when something changed.
    commit() {
      if (pending === undefined) return false;
      const E = effective(pending);
      applyLevels(E); applyLadder(E);
      active = pending; activeSrc = pendingSrc; activeText = pendingText;
      pending = undefined; pendingSrc = pendingText = '';
      log('in place');
      return true;
    },
    // A new tune (clean or null = defaults) from `src`: the ladder at once, the CPU numbers at the next commit
    offer(t, src, text = '') {
      if (text === (pending !== undefined ? pendingText : activeText) && src !== 'url') return false; // nothing new
      pending = t; pendingSrc = src; pendingText = text;
      applyLadder(effective(t));
      log('received from ' + src);
      return true;
    },
    // What is in force (and waiting), for the console and tests
    state() {
      const out = { source: activeSrc, tune: active, inForce: effective(active), lastFetch };
      if (pending !== undefined) { out.waiting = pending; out.waitingSource = pendingSrc; }
      return JSON.parse(JSON.stringify(out));
    },
    // Where this build reads tunes from: 'portal' (Yandex / Playgama), 'server' (our server) or null (nowhere)
    source() {
      if (ND.portalName === 'yandex' || ND.portalName === 'playgama') return 'portal';
      return ND.platform && ND.platform.allowNetwork && serverCfg() ? 'server' : null;
    },
    // Read the tune once (boot; tests may call it again). opts (tests): { source, url, key, fetch }.
    // Resolves 'set' | 'none' (no tune there: defaults) | 'failed' (no answer: stored copy / defaults) | 'off'.
    async refresh(opts = {}) {
      if (locked && !opts.force) return (lastFetch = 'off');
      const src = opts.source || T.source();
      if (!src) return (lastFetch = 'off');
      let raw;
      try { raw = src === 'portal' ? await fromPortal() : await fromServer(opts); } catch (e) { log('no answer (' + ((e && e.message) || e) + ')'); return (lastFetch = 'failed'); }
      if (typeof raw !== 'string' && isObj(raw)) raw = JSON.stringify(raw);
      const t = typeof raw === 'string' ? clean(raw) : null;
      if (!t) {
        if (typeof raw === 'string' && raw.trim()) console.warn('[tune] the ' + src + ' tune is not valid: built-in defaults');
        store.drop();
        T.offer(null, src, '');
        return (lastFetch = 'none');
      }
      store.set(raw);
      T.offer(t, src, raw);
      return (lastFetch = 'set');
    },
  };

  // ---------------------------------------------------------------- sources
  function serverCfg() {
    const C = ND.CONFIG || {};
    const url = typeof C.SUPABASE_URL === 'string' ? C.SUPABASE_URL.trim().replace(/\/+$/, '') : '';
    const key = typeof C.SUPABASE_ANON_KEY === 'string' ? C.SUPABASE_ANON_KEY.trim() : '';
    if (!/^https:\/\/[^\s/?#]+$/i.test(url) || key.length < 20 || /^sb_secret_|service_role/.test(key)) return null;
    return { url, key };
  }
  // our server: RPC nd_tune → the tune text, or null when none is set
  async function fromServer(opts) {
    const cfg = opts.url ? { url: String(opts.url).replace(/\/+$/, ''), key: String(opts.key || '') } : serverCfg();
    if (!cfg) throw new Error('no server');
    const ff = opts.fetch || ((u, o) => window.fetch(u, o));
    let ctl = null; try { ctl = typeof AbortController === 'function' ? new AbortController() : null; } catch (e) { ctl = null; }
    let timer;
    const late = new Promise((_, rej) => { timer = setTimeout(() => { try { if (ctl) ctl.abort(); } catch (e) { /* none */ } rej(new Error('timeout')); }, opts.ms || TIMEOUT_MS); });
    const headers = { apikey: cfg.key, 'Content-Type': 'application/json', Accept: 'application/json' };
    if (/^eyJ/.test(cfg.key)) headers.Authorization = 'Bearer ' + cfg.key;
    try {
      return await Promise.race([late, (async () => {
        const res = await ff(cfg.url + '/rest/v1/rpc/nd_tune', { method: 'POST', headers, body: '{}', signal: ctl ? ctl.signal : undefined,
          cache: 'no-store', credentials: 'omit', mode: 'cors', referrerPolicy: 'no-referrer' });
        if (!res.ok) throw new Error('http ' + res.status);
        const body = await res.json();
        return body == null || typeof body === 'string' || isObj(body) ? body : null;
      })()]);
    } finally { clearTimeout(timer); }
  }
  // the portal's remote config: ai_tune (+ ai_tune_2 … ai_tune_20 joined in order, up to the first missing one), or
  // null when the flag is not set
  async function fromPortal() {
    const wait = (p, ms) => { let t; return Promise.race([p, new Promise((r) => { t = setTimeout(() => r(null), ms); })]).finally(() => clearTimeout(t)); };
    await wait(ND.portal && ND.portal.ready ? ND.portal.ready : Promise.resolve(null), READY_MS);
    const api = window.NDPortal;
    if (!api || typeof api.remoteConfig !== 'function') throw new Error('no remote config');
    const flags = await api.remoteConfig(TIMEOUT_MS);
    if (!flags || typeof flags !== 'object') throw new Error('no remote config');
    let text = typeof flags[FLAG] === 'string' ? flags[FLAG] : '';
    if (!text.trim()) return null;
    for (let i = 2; i <= 20; i++) {
      const part = flags[FLAG + '_' + i];
      if (typeof part !== 'string' || !part) break;
      text += part;
    }
    return text;
  }

  // ---------------------------------------------------------------- boot
  if (q && !['show', 'off', 'remote'].includes(q)) {
    locked = true;
    const t = clean(q);
    if (t) { T.offer(t, 'url', q); T.commit(); } else console.warn('[tune] ?tune= is not a valid tune: built-in defaults');
  } else if (q === 'off') locked = true;
  else if (!bot || q === 'remote') {
    const raw = store.get(), t = raw ? clean(raw) : null;
    if (t) { T.offer(t, 'stored', raw); T.commit(); } else if (raw) store.drop();
  } else locked = true; // automated browser: defaults only
  if (show) log('at start');
  // after every classic script ran (ND.CONFIG, ND.platform, ND.portal exist), never in the way of the first frame
  const go = () => { T.refresh().catch(() => {}); };
  if (locked) lastFetch = 'off';
  else {
    try {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go, { once: true });
      else setTimeout(go, 0);
    } catch (e) { /* no document: nothing to fetch */ }
  }
})(window.ND);
