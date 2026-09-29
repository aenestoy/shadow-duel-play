// Shadow Duel — reward catalog: costumes, titles and badges that come from the server, not from a game update
// (docs/SHADOW-DUEL-ONLINE.md "Ödül kataloğu"; supabase/ranked.sql nd_rewards, nd_reward_catalog, nd_reward_owned).
//
// What the server sends (RPC nd_reward_catalog, every active entry):
//   { id, kind: 'costume' | 'title' | 'badge', names: { en, tr, es, pt, ru, de, fr }, data }
//   costume data: { v: 1, base?: 'col' | 'alt' | 'champ', pal?: { cloth: '#rrggbb', … }, ninjas?: ['akane', …],
//                   atlas?: { url, w?, h?, parts: { head: { x, y, w, h, bone: ['neck', 'head'], ox, oy, s, rot }, … } },
//                   builtin?: 'shogun_a', placeholder?: true }
//     builtin: a costume drawn by the game itself (js/costumes.js: new shapes, a helmet, armour, a coat…); its drawing
//            ships with a game update, so only the ids this build knows are kept (ND.COSTUME_IDS, the allow-list)
//     pal: a recolour of the fighter's palette (the same keys as js/characters.js; any key left out keeps the base's)
//     atlas: new part art: one picture (PNG / WebP), only from our own Supabase project's public storage
//            (<SUPABASE_URL>/storage/v1/object/public/…); each part is a rectangle of it drawn along a bone of the
//            skeleton (from joint → to joint), offset (ox, oy) in the bone's frame, scale s, extra turn rot. Loaded
//            when first needed and cut into one small picture per part (baked); until then, or if it fails, the
//            fighter is drawn with the palette alone.
//   title / badge data: { v: 1, color?: '#rrggbb', icon?: one or two characters }
// Rules: every entry is checked and clamped; a broken one (wrong kind, no name, bad colour, a picture from elsewhere…)
// is left out, never an error. The last good catalog is kept on this device and used at once on the next launch; the
// server is read at boot without waiting (the game never waits for it) and again when the Hall or the ranked screen
// opens. Automated browsers read it too (tests use the mock server).
// Who owns what comes with the ranked profile (nd_rank_me: owned) and is cached per player on this device.
// Not in the offline portal builds (index.html data-online; vite.config.ts leaves this file out).
(function (ND) {
  'use strict';
  const LS = 'golge-duellosu-rewards', LS_OWN = 'golge-duellosu-rewards-own';
  const LANGS = ['en', 'tr', 'es', 'pt', 'ru', 'de', 'fr'];
  const KINDS = ['costume', 'title', 'badge'];
  const HEX = /^#[0-9a-f]{6}$/i, RGBA = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d{1,3})\s*\)$/i;
  // palette keys a costume may set (js/characters.js pal / champPal) → colour kind
  const PAL = { cloth: HEX, clothHi: HEX, clothDark: HEX, wrap: HEX, wrapDark: HEX, accent: HEX, accentDark: HEX, ui: HEX, skin: HEX,
    hakama: HEX, hakamaDark: HEX, haori: HEX, armor: HEX, mask: HEX, glove: HEX, tabi: HEX, rim: RGBA, rimDim: RGBA };
  const JOINTS = ['hip', 'neck', 'sh', 'head', 'elF', 'haF', 'elB', 'haB', 'knF', 'ftF', 'knB', 'ftB'];
  const MAX_ENTRIES = 200, MAX_PARTS = 24, MAX_ATLAS = 2048;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const num = (v, lo, hi, d) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
  const C = ND.CONFIG || {};
  const base = typeof C.SUPABASE_URL === 'string' ? C.SUPABASE_URL.trim().replace(/\/+$/, '') : '';
  const storagePrefix = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base) ? base + '/storage/v1/object/public/' : '';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
  };

  // ---------------------------------------------------------------- checking one entry
  function cleanNames(n) {
    if (!isObj(n)) return null;
    const out = {};
    for (const l of LANGS) {
      const v = n[l];
      if (typeof v === 'string') { const t = v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 40); if (t) out[l] = t; }
    }
    return out.en || out.tr ? out : null;
  }
  function cleanPal(p) {
    if (!isObj(p)) return null;
    const out = {};
    for (const k of Object.keys(PAL)) if (typeof p[k] === 'string' && PAL[k].test(p[k].trim())) out[k] = p[k].trim();
    if (isObj(p.hood)) {
      const h = {};
      for (const k of ['cloth', 'clothHi', 'clothDark']) if (typeof p.hood[k] === 'string' && HEX.test(p.hood[k])) h[k] = p.hood[k];
      if (Object.keys(h).length === 3) out.hood = h;
    }
    return Object.keys(out).length ? out : null;
  }
  // an atlas picture only from our own project's public storage; parts only along known bones
  function cleanAtlas(a) {
    if (!isObj(a) || typeof a.url !== 'string' || !storagePrefix) return null;
    const url = a.url.trim();
    if (url.length > 400 || !url.startsWith(storagePrefix) || /[\s"'<>\\]|\.\.|[?#]/.test(url.slice(storagePrefix.length)) || !/\.(png|webp)$/i.test(url)) return null;
    if (!isObj(a.parts)) return null;
    const parts = {};
    let n = 0;
    for (const k of Object.keys(a.parts)) {
      if (n >= MAX_PARTS || !/^[a-z][a-zA-Z0-9]{0,15}$/.test(k)) continue;
      const q = a.parts[k];
      if (!isObj(q) || !Array.isArray(q.bone) || q.bone.length !== 2 || !JOINTS.includes(q.bone[0]) || !JOINTS.includes(q.bone[1]) || q.bone[0] === q.bone[1]) continue;
      const x = num(q.x, 0, MAX_ATLAS, -1), y = num(q.y, 0, MAX_ATLAS, -1), w = num(q.w, 1, 512, 0), h = num(q.h, 1, 512, 0);
      if (x < 0 || y < 0 || !w || !h || x + w > MAX_ATLAS || y + h > MAX_ATLAS) continue;
      parts[k] = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), bone: [q.bone[0], q.bone[1]],
        ox: num(q.ox, -200, 200, 0), oy: num(q.oy, -200, 200, 0), s: num(q.s, 0.05, 4, 1), rot: num(q.rot, -Math.PI * 2, Math.PI * 2, 0), front: q.front !== false };
      n++;
    }
    return n ? { url, parts } : null;
  }
  function clean(e) {
    if (!isObj(e) || typeof e.id !== 'string' || !/^[a-z0-9_]{3,40}$/.test(e.id) || !KINDS.includes(e.kind)) return null;
    const names = cleanNames(e.names);
    if (!names) return null;
    const d = isObj(e.data) ? e.data : {};
    if (own(d, 'v') && d.v !== 1) return null; // a later format this build does not know
    const out = { id: e.id, kind: e.kind, names };
    if (e.kind === 'costume') {
      const pal = cleanPal(d.pal), atlas = cleanAtlas(d.atlas);
      const ids = Array.isArray(ND.COSTUME_IDS) ? ND.COSTUME_IDS : [];  // (a family id such as 'champion' too)
      const builtin = typeof d.builtin === 'string' && ids.includes(d.builtin) ? d.builtin : null;
      if (!pal && !atlas && !builtin) return null;
      out.base = d.base === 'alt' || d.base === 'champ' ? d.base : 'col';
      out.pal = pal; out.atlas = atlas; out.builtin = builtin; out.placeholder = d.placeholder === true;
      const chars = ND.CHARS ? ND.CHARS.map((c) => c.id) : [];
      out.ninjas = Array.isArray(d.ninjas) ? d.ninjas.filter((x) => chars.includes(x)).slice(0, 20) : null;
      if (out.ninjas && !out.ninjas.length) return null;
    } else {
      out.color = typeof d.color === 'string' && HEX.test(d.color) ? d.color : null;
      out.icon = typeof d.icon === 'string' && [...d.icon].length <= 2 && !/[\s<>&"']/.test(d.icon) ? d.icon : '';
    }
    return out;
  }
  function cleanList(list) {
    if (!Array.isArray(list)) return null;
    const out = [], seen = new Set();
    for (const e of list.slice(0, MAX_ENTRIES)) {
      let c = null;
      try { c = clean(e); } catch (err) { c = null; }
      if (c && !seen.has(c.id)) { seen.add(c.id); out.push(c); }
    }
    return out;
  }

  // ---------------------------------------------------------------- state
  let list = [], byId = new Map(), src = 'none', loadedAt = 0, fetching = null;
  let owned = { pid: null, ids: [] };
  const fns = new Set();
  const emit = () => fns.forEach((f) => { try { f(); } catch (e) { /* a listener */ } });
  function setList(l, from) {
    list = l; byId = new Map(l.map((e) => [e.id, e])); src = from;
    palCache.clear();
    emit();
  }
  // the copy kept on this device
  (function boot() {
    let c = null;
    try { c = JSON.parse(store.get(LS) || 'null'); } catch (e) { c = null; }
    const l = c && cleanList(c.list);
    if (l) setList(l, 'device');
    try { const o = JSON.parse(store.get(LS_OWN) || 'null'); if (o && Array.isArray(o.ids)) owned = { pid: o.pid ?? null, ids: o.ids.filter((x) => typeof x === 'string').slice(0, 200) }; } catch (e) { /* none */ }
  })();

  const LB = () => ND.leaderboard;
  const adapter = () => { const L = LB(); const a = L && L.adapter; return a && a.name === 'supabase' && typeof a.rpc === 'function' ? a : null; };
  // read the server's catalog (never throws; the game never waits for it)
  function refresh() {
    if (fetching) return fetching;
    fetching = (async () => {
      try {
        const L = LB();
        if (!L || !(ND.platform || {}).allowNetwork) return false;
        await L.whenSettled(8000);
        const a = adapter();
        if (!a || (Array.isArray(a.features) && a.features.length && !a.features.includes('rewards'))) return false;
        const raw = await a.rpc('nd_reward_catalog', {}, 6000);
        const l = cleanList(raw);
        if (!l) return false;
        setList(l, 'server'); loadedAt = Date.now();
        store.set(LS, JSON.stringify({ t: Date.now(), list: Array.isArray(raw) ? raw.slice(0, MAX_ENTRIES) : [] }));
        return true;
      } catch (e) { return false; } finally { setTimeout(() => { fetching = null; }, 0); }
    })();
    return fetching;
  }

  // ---------------------------------------------------------------- names in the chosen language
  const lang = () => (ND.i18n && typeof ND.i18n.lang === 'string' ? ND.i18n.lang : 'tr');
  function nameOf(e) {
    if (typeof e === 'string') e = byId.get(e);
    if (!e) return '';
    const n = e.names, l = lang();
    return n[l] || n.en || n.tr || e.id;
  }

  // ---------------------------------------------------------------- costumes: palette + atlas
  const palCache = new Map();
  function palette(ch, id) {
    const e = byId.get(id);
    if (!ch || !e || e.kind !== 'costume' || (e.ninjas && !e.ninjas.includes(ch.id))) return null;
    const k = ch.id + '|' + id;
    let p = palCache.get(k);
    if (p) return p;
    // a drawn costume for this fighter (a family such as 'champion' draws each fighter's own; none yet: nothing)
    const key = e.builtin && ND.costumeKey ? ND.costumeKey(e.builtin, ch.id) : null;
    if (e.builtin && !key && !e.pal && !e.atlas) return null;
    const basePal = ND.palOf ? ND.palOf(ch, e.base === 'champ' ? 'champ' : e.base === 'alt') : ch.col;
    const K = key && ND.COSTUMES ? ND.COSTUMES[key] : null;
    p = Object.assign({}, basePal, (K && K.pal) || {}, e.pal || {});
    if (e.pal && e.pal.hood && basePal.hood) p.hood = Object.assign({}, e.pal.hood);
    else if (K && K.pal && K.pal.hood) p.hood = Object.assign({}, K.pal.hood);
    else if (basePal.hood && !(e.pal && e.pal.hood)) p.hood = basePal.hood;
    if (e.atlas) Object.defineProperty(p, 'atlas', { value: atlasFor(e), enumerable: false });
    // a drawn costume (js/costumes.js): skeleton.js draws its parts over the fighter
    if (key) Object.defineProperty(p, 'costume', { value: key, enumerable: false });
    palCache.set(k, p);
    return p;
  }
  // the atlas picture: loaded once, then each part cut into its own canvas (baked); state 'wait' | 'ok' | 'fail'
  const atlases = new Map();
  function atlasFor(e) {
    let A = atlases.get(e.id);
    if (A) return A;
    A = { state: 'idle', parts: e.atlas.parts, pics: {}, url: e.atlas.url };
    atlases.set(e.id, A);
    return A;
  }
  function loadAtlas(A) {
    if (A.state !== 'idle') return;
    A.state = 'wait';
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous'; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
      const to = setTimeout(() => { if (A.state === 'wait') A.state = 'fail'; }, 15000);
      img.onload = () => {
        clearTimeout(to);
        try {
          if (img.naturalWidth > MAX_ATLAS || img.naturalHeight > MAX_ATLAS) { A.state = 'fail'; return; }
          for (const k of Object.keys(A.parts)) {
            const q = A.parts[k];
            if (q.x + q.w > img.naturalWidth || q.y + q.h > img.naturalHeight) continue;
            const c = document.createElement('canvas'); c.width = q.w; c.height = q.h;
            c.getContext('2d').drawImage(img, q.x, q.y, q.w, q.h, 0, 0, q.w, q.h);
            A.pics[k] = c;
          }
          A.state = Object.keys(A.pics).length ? 'ok' : 'fail';
        } catch (err) { A.state = 'fail'; }
      };
      img.onerror = () => { clearTimeout(to); A.state = 'fail'; };
      img.src = A.url;
    } catch (e) { A.state = 'fail'; }
  }
  // drawn after the fighter (js/fighter.js draw): each baked part along its bone. Never throws.
  ND.skinOverlay = function (ctx, j, col) {
    const A = col && col.atlas;
    if (!A) return;
    if (A.state === 'idle') loadAtlas(A);
    if (A.state !== 'ok' || !j || !j.hip) return;
    try {
      for (const k of Object.keys(A.pics)) {
        const q = A.parts[k], a = j[q.bone[0]], b = j[q.bone[1]], pic = A.pics[k];
        if (!a || !b) continue;
        const ang = Math.atan2(b.y - a.y, b.x - a.x), d = j.dir < 0 ? -1 : 1;
        ctx.save();
        ctx.translate(a.x, a.y); ctx.rotate(ang + q.rot * d); ctx.scale(q.s, q.s * d);
        ctx.drawImage(pic, q.ox, q.oy - q.h / 2);
        ctx.restore();
      }
    } catch (e) { A.state = 'fail'; }
  };

  // ---------------------------------------------------------------- ownership
  function setOwned(pid, ids) {
    const clean = Array.isArray(ids) ? ids.filter((x) => typeof x === 'string' && /^[a-z0-9_]{3,40}$/.test(x)).slice(0, 200) : [];
    owned = { pid: pid ?? null, ids: clean };
    store.set(LS_OWN, JSON.stringify(owned));
    palCache.clear();
    emit();
  }
  const myPid = () => { const L = LB(); const a = L && L.adapter; return a && a.pid ? a.pid : null; };
  const owns = (id) => owned.ids.includes(id) && (owned.pid == null || owned.pid === myPid());

  const R = ND.rewards = {
    clean, cleanList,
    refresh, onChange(fn) { fns.add(fn); return () => fns.delete(fn); },
    catalog: () => list.slice(),
    get: (id) => byId.get(id) || null,
    name: nameOf,
    palette,
    owns,
    setOwned,
    owned: () => owned.ids.filter((id) => byId.has(id) && owns(id)),
    // costumes this player owns that fit this ninja (the select screen's appearance slots)
    costumesFor(ninja) {
      const ch = ND.CHARS ? ND.CHARS.find((c) => c.id === ninja) : null;
      return list.filter((e) => e.kind === 'costume' && owns(e.id) && (!e.ninjas || e.ninjas.includes(ninja)) && (!ch || !!palette(ch, e.id)));
    },
    // a title / badge to show: { name, color, icon } | null
    title(id) { const e = byId.get(id); return e && e.kind !== 'costume' ? { id: e.id, name: nameOf(e), color: e.color, icon: e.icon } : null; },
    state: () => ({ src, entries: list.length, loadedAt, owned: owned.ids.slice(), atlases: [...atlases.values()].map((a) => a.state) }),
  };
  // the appearance value of a catalog costume ('rw:<id>', js/characters.js ND.palOf; js/arcade.js looks)
  R.LOOK = 'rw:';

  if (!(ND.platform || {}).allowNetwork) return;
  // boot: read the server without waiting (after the leaderboard knows its server)
  setTimeout(() => { refresh(); }, 0);
  if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(() => emit());
})(window.ND);
