
























(function (ND) {
  'use strict';
  const L = ND.AI_LEVELS, K = ND.AI_KNOBS, J = ND.JOURNEY;
  if (!L || !K || !J || !J.ladder) return;
  const LS = 'golge-duellosu-ai-tune', FLAG = 'ai_tune', MAX_LEN = 4000, TIMEOUT_MS = 2000, READY_MS = 10000;
  const P = [0, 1];

  const FIELDS = { react: [0.05, 1.5], parry: P, guard: P, dodge: P, aggr: P, combo: P, smart: P, mash: [1, 20], counter: P, rally: P,
    cmd: P, str: P, jug: P, kc: P, read: P };
  const TICK = [0.02, 2];
  const LEVEL_KEYS = ['0', '1', '2', '3'], AI_KEYS = [0, 0.25, 0.5, 1, 2, 3], N = 8;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const clamp = (v, r) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(r[1], Math.max(r[0], v)) : undefined);



  const KLV = [-1, 1.5];
  const BIND_LV = ['0', '0.5', '1', '2', '3'];
  const NIN = ['akane', 'aoi', 'kuro', 'yuki', 'ren', 'kage', 'shura', 'tetsu', 'jin', 'tsubame', 'hana', 'mai', 'tora'];
  const DEF = { levels: {}, apprenticePlusK: K.apprenticePlusK, kiWait: K.kiWait, duelK: K.duelK, duelSoft: K.duelSoft,
    duelSpeed: K.duelSpeed ?? 1, duelGhostK: K.duelGhostK ?? 1, finDmg: K.finDmg ?? 0.7,
    duelKch: Object.assign({}, K.duelKch), duelK0ch: Object.assign({}, K.duelK0ch), duelKAch: Object.assign({}, K.duelKAch), duelKUch: Object.assign({}, K.duelKUch),
    duelDmg: Object.assign({}, K.duelDmg), duelChDmg: Object.assign({}, K.duelChDmg),
    duelBindPlay: Object.assign({}, K.duelBindPlay), duelBindPlayCh: Object.assign({}, K.duelBindPlayCh),
    journey: { levels: J.ladder.levels.slice(), ai: J.ladder.ai.slice(), hp: J.ladder.hp.slice() } };
  for (const l of LEVEL_KEYS) {
    const d = DEF.levels[l] = {};
    for (const f of Object.keys(FIELDS)) d[f] = L[l][f];
    d.tick = L[l].tick.slice();
  }



  function clean(raw) {
    let o = raw;
    if (typeof o === 'string') {
      if (!o.trim() || o.length > MAX_LEN) return null;
      try { o = JSON.parse(o); } catch (e) { return null; }
    }
    if (!isObj(o)) return null;
    if (own(o, 'v') && o.v !== 1) return null;
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
    const sp = clamp(o.duelSpeed, [0.7, 1]);
    if (sp !== undefined) t.duelSpeed = sp;
    const ds = clamp(o.duelSoft, [0, 1]);
    if (ds !== undefined) t.duelSoft = ds;
    const gk = clamp(o.duelGhostK, [0, 1]);
    if (gk !== undefined) t.duelGhostK = gk;
    const fd = clamp(o.finDmg, [0.3, 1.5]);
    if (fd !== undefined) t.finDmg = fd;

    if (isObj(o.duelKch)) { const m = {}; for (const [id, v] of Object.entries(o.duelKch)) { const c = NIN.includes(id) ? clamp(v, [0, 1]) : undefined; if (c !== undefined) m[id] = c; } if (Object.keys(m).length) t.duelKch = m; }


    if (isObj(o.duelK0ch)) { const m = {}; for (const [id, v] of Object.entries(o.duelK0ch)) { const c = NIN.includes(id) ? clamp(v, KLV) : undefined; if (c !== undefined) m[id] = c; } if (Object.keys(m).length) t.duelK0ch = m; }



    if (isObj(o.duelBindPlay)) { const m = {}; for (const [l, v] of Object.entries(o.duelBindPlay)) { const c = BIND_LV.includes(l) ? clamp(v, [0, 1]) : undefined; if (c !== undefined) m[l] = c; } if (Object.keys(m).length) t.duelBindPlay = m; }
    if (isObj(o.duelBindPlayCh)) { const m = {}; for (const [id, v] of Object.entries(o.duelBindPlayCh)) { const c = NIN.includes(id) ? clamp(v, [0, 1]) : undefined; if (c !== undefined) m[id] = c; } if (Object.keys(m).length) t.duelBindPlayCh = m; }
    for (const key of ['duelKAch', 'duelKUch']) if (isObj(o[key])) { const m = {}; for (const [id, v] of Object.entries(o[key])) { const c = NIN.includes(id) ? clamp(v, KLV) : undefined; if (c !== undefined) m[id] = c; } if (Object.keys(m).length) t[key] = m; }

    if (isObj(o.duelChDmg)) { const m = {}; for (const [id, v] of Object.entries(o.duelChDmg)) { const c = NIN.includes(id) ? clamp(v, [0.5, 2]) : undefined; if (c !== undefined) m[id] = c; } if (Object.keys(m).length) t.duelChDmg = m; }

    if (isObj(o.duelDmg)) { const m = {}; for (const [id, v] of Object.entries(o.duelDmg)) { const c = NIN.includes(id) ? clamp(v, [0.5, 2]) : undefined; if (c !== undefined) m[id] = c; } if (Object.keys(m).length) t.duelDmg = m; }
    if (isObj(o.journey)) {

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


  function effective(t) {
    t = t || {};
    const E = { levels: {}, apprenticePlusK: t.apprenticePlusK ?? DEF.apprenticePlusK, kiWait: t.kiWait ?? DEF.kiWait, duelK: t.duelK ?? DEF.duelK, duelSoft: t.duelSoft ?? DEF.duelSoft, duelSpeed: t.duelSpeed ?? null, duelGhostK: t.duelGhostK ?? null, finDmg: t.finDmg ?? null, duelKch: t.duelKch || null, duelK0ch: t.duelK0ch || null, duelKAch: t.duelKAch || null, duelKUch: t.duelKUch || null, duelBindPlay: t.duelBindPlay || null, duelBindPlayCh: t.duelBindPlayCh || null, duelDmg: t.duelDmg || null, duelChDmg: t.duelChDmg || null, journey: {} };
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


  let KCH0 = null, KDM0 = null, KK00 = null, KCD0 = null, KKA0 = null, KKU0 = null, GK0 = null, KBP0 = null, KBC0 = null;
  function applyLevels(E) {
    for (const l of LEVEL_KEYS) {
      const lv = L[l], e = E.levels[l];
      for (const f of Object.keys(FIELDS)) lv[f] = e[f];
      lv.tick[0] = e.tick[0]; lv.tick[1] = e.tick[1];
    }
    K.apprenticePlusK = E.apprenticePlusK; K.kiWait = E.kiWait; K.duelK = E.duelK; K.duelSoft = E.duelSoft; if (!GK0) GK0 = { v: K.duelGhostK, f: K.finDmg, s: K.duelSpeed }; if (E.duelSpeed != null) K.duelSpeed = E.duelSpeed; else if (GK0.s != null) K.duelSpeed = GK0.s; else delete K.duelSpeed; if (!GK0) GK0 = { v: K.duelGhostK, f: K.finDmg }; if (E.finDmg != null) K.finDmg = E.finDmg; else if (GK0.f != null) K.finDmg = GK0.f; else delete K.finDmg; if (E.duelGhostK != null) K.duelGhostK = E.duelGhostK; else if (GK0.v != null) K.duelGhostK = GK0.v; else delete K.duelGhostK; if (!KCH0) KCH0 = Object.assign({}, K.duelKch || {}); K.duelKch = Object.assign({}, KCH0, E.duelKch || {});
    if (!KDM0) KDM0 = Object.assign({}, K.duelDmg || {}); K.duelDmg = Object.assign({}, KDM0, E.duelDmg || {});
    if (!KCD0) KCD0 = Object.assign({}, K.duelChDmg || {}); K.duelChDmg = Object.assign({}, KCD0, E.duelChDmg || {});
    if (!KK00) KK00 = Object.assign({}, K.duelK0ch || {}); K.duelK0ch = Object.assign({}, KK00, E.duelK0ch || {});
    if (!KKA0) KKA0 = Object.assign({}, K.duelKAch || {}); K.duelKAch = Object.assign({}, KKA0, E.duelKAch || {});
    if (!KKU0) KKU0 = Object.assign({}, K.duelKUch || {}); K.duelKUch = Object.assign({}, KKU0, E.duelKUch || {});
    if (!KBP0) KBP0 = Object.assign({}, K.duelBindPlay || {}); K.duelBindPlay = Object.assign({}, KBP0, E.duelBindPlay || {});
    if (!KBC0) KBC0 = Object.assign({}, K.duelBindPlayCh || {}); K.duelBindPlayCh = Object.assign({}, KBC0, E.duelBindPlayCh || {});
    if (ND.aiDerive) ND.aiDerive();
  }
  function applyLadder(E) {
    for (const key of ['levels', 'ai', 'hp']) for (let i = 0; i < N; i++) J.ladder[key][i] = E.journey[key][i];
  }


  let active = null, activeSrc = 'default', activeText = '';
  let pending, pendingSrc = '', pendingText = '';
  let locked = false;
  let lastFetch = 'waiting';
  const qs = (() => { try { return new URLSearchParams(location.search || ''); } catch (e) { return new URLSearchParams(''); } })();
  const q = qs.get('tune');
  const show = q === 'show';
  const bot = (() => { try { return navigator.webdriver === true; } catch (e) { return false; } })();
  const log = (why) => { if (show) try { console.info('[tune] ' + why + ': ' + JSON.stringify(T.state())); } catch (e) {                  } };
  const store = {
    get() { try { return localStorage.getItem(LS); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(LS, v); } catch (e) {                       } },
    drop() { try { localStorage.removeItem(LS); } catch (e) {                       } },
  };

  const T = ND.tune = {
    DEFAULTS: DEF, FLAG, clean, effective,


    commit() {
      if (pending === undefined) return false;
      const E = effective(pending);
      applyLevels(E); applyLadder(E);
      active = pending; activeSrc = pendingSrc; activeText = pendingText;
      pending = undefined; pendingSrc = pendingText = '';
      log('in place');
      return true;
    },

    offer(t, src, text = '') {
      if (text === (pending !== undefined ? pendingText : activeText) && src !== 'url') return false;
      pending = t; pendingSrc = src; pendingText = text;
      applyLadder(effective(t));
      log('received from ' + src);
      return true;
    },

    state() {
      const out = { source: activeSrc, tune: active, inForce: effective(active), lastFetch };
      if (pending !== undefined) { out.waiting = pending; out.waitingSource = pendingSrc; }
      return JSON.parse(JSON.stringify(out));
    },

    source() {
      if (ND.portalName === 'yandex' || ND.portalName === 'playgama') return 'portal';
      return ND.platform && ND.platform.allowNetwork && serverCfg() ? 'server' : null;
    },


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


  function serverCfg() {
    const C = ND.CONFIG || {};
    const url = typeof C.SUPABASE_URL === 'string' ? C.SUPABASE_URL.trim().replace(/\/+$/, '') : '';
    const key = typeof C.SUPABASE_ANON_KEY === 'string' ? C.SUPABASE_ANON_KEY.trim() : '';
    if (!/^https:\/\/[^\s/?#]+$/i.test(url) || key.length < 20 || /^sb_secret_|service_role/.test(key)) return null;
    return { url, key };
  }

  async function fromServer(opts) {
    const cfg = opts.url ? { url: String(opts.url).replace(/\/+$/, ''), key: String(opts.key || '') } : serverCfg();
    if (!cfg) throw new Error('no server');
    const ff = opts.fetch || ((u, o) => window.fetch(u, o));
    let ctl = null; try { ctl = typeof AbortController === 'function' ? new AbortController() : null; } catch (e) { ctl = null; }
    let timer;
    const late = new Promise((_, rej) => { timer = setTimeout(() => { try { if (ctl) ctl.abort(); } catch (e) {            } rej(new Error('timeout')); }, opts.ms || TIMEOUT_MS); });
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


  if (q && !['show', 'off', 'remote'].includes(q)) {
    locked = true;
    const t = clean(q);
    if (t) { T.offer(t, 'url', q); T.commit(); } else console.warn('[tune] ?tune= is not a valid tune: built-in defaults');
  } else if (q === 'off') locked = true;
  else if (!bot || q === 'remote') {
    const raw = store.get(), t = raw ? clean(raw) : null;
    if (t) { T.offer(t, 'stored', raw); T.commit(); } else if (raw) store.drop();
  } else locked = true;
  if (show) log('at start');

  const go = () => { T.refresh().catch(() => {}); };
  if (locked) lastFetch = 'off';
  else {
    try {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go, { once: true });
      else setTimeout(go, 0);
    } catch (e) {                                     }
  }
})(window.ND);
