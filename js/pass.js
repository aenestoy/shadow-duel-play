// Shadow Duel — player level and the Shadow Pass, game side (ND.pass). The rules and numbers are js/level.js
// (ND.LEVEL), the texts js/i18n-pass.js (ND.STR.pass); docs/SHADOW-DUEL-PASS.md explains the whole thing in Turkish.
//
// What lives here:
// - the saved state: ND.save.p.lv (inside the progress save, so it follows the player wherever that save goes:
//   localStorage, and the CrazyGames / Yandex / Playgama cloud copy), checked with LEVEL.cleanState on every read of a
//   new save object; an older save is migrated once (LEVEL.migrate: XP from honor, journey clears from the journey)
// - XP after every fight (game.matchEnd, wrapped below), combo trials, the tutorial, journey clears; the level-up
//   moment; the end-screen XP bar; the menu strip; the pass screen (tiers, free and Shadow rows, claiming) and the
//   profile (titles, badges, frames, blade trails, costumes, journey seals)
// - the looks: pass costumes ('ps:<item>') join the appearance choices of the select screen (ND.save.look /
//   lookOptions / setLook and ND.palOf are wrapped), the equipped blade trail colours your own fighter's streak
//   (ND.passTrail, read by js/fighter.js drawTrail; drawing only, never the fight itself)
// - journey seals: each ninja's journey clear count (一 二 三) on the select roster, the journey panel, the VS screen
//   and the ending; the 2nd and 3rd clear give that ninja's Menkyo and Kaiden costume and title
// Everything is wrapped in try/catch where it meets the rest of the game: the pass never breaks a fight or a menu.
// Not online-only: it runs in every build (the offline portal packages too). Online and ranked fights award XP through
// ND.pass.onlineEnd (called by js/online.js / js/ranked.js where they exist).
(function (ND) {
  'use strict';
  const LV = ND.LEVEL;
  if (!LV || !ND.save) return;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = () => (ND.STR && ND.STR.pass) || {};
  const num = (n) => (ND.i18n && ND.i18n.num ? ND.i18n.num(n) : String(Math.round(n)));
  const nice = (s) => (s ? s[0] + s.slice(1).toLowerCase() : '');
  const tz = () => { try { return new Date().getTimezoneOffset(); } catch (e) { return 0; } };
  const charIds = () => (ND.CHARS || []).map((c) => c.id);
  const chOf = (id) => (ND.CHARS || []).find((c) => c.id === id) || null;
  const au = () => (ND.audio && ND.audio.ready ? ND.audio : null);
  const safe = (fn) => { try { return fn(); } catch (e) { console.warn('[pass]', e); return undefined; } };

  // ---------------------------------------------------------------- state (ND.save.p.lv)
  let cache = { p: null, s: null };
  function S() {
    const p = ND.save.p;
    if (cache.p !== p || p.lv !== cache.s) {
      // (not written back here: a save just adopted from the portal keeps its own time stamp; the level is saved with
      // the next real change, and until then the migration gives the same result on every load)
      const st = LV.cleanState(p.lv, charIds());
      if (!st.mig) LV.migrate(st, p);
      p.lv = st; cache = { p, s: st };
    }
    return cache.s;
  }
  const commit = () => ND.save.commit();

  // ---------------------------------------------------------------- the season
  // The local 28-day calendar (LEVEL.seasonAt) and the built-in content; a season from the server replaces both
  // (setRemote, drop 2: js/pass-net.js on the online build).
  const DEF = LV.cleanSeason(LV.DEFAULT_SEASON);
  let remote = null; // { key, n, start, end, C }
  function season() {
    const t = P.now();
    if (remote && t >= remote.start && t < remote.end) return remote;
    const c = LV.seasonAt(t);
    return { key: c.key, n: c.n, start: c.start, end: c.end, C: DEF };
  }
  function sp(st, se) { return st.ps[se.key] || (st.ps[se.key] = { x: 0, f: [], b: [], a: 0, w: 0 }); }
  // something to tell the server (js/pass-net.js, the online build): a sync soon
  const changed = () => { try { if (ND.passNet && ND.passNet.soon) ND.passNet.soon(); } catch (e) { /* the pass never breaks */ } };
  const once = (name) => { try { if (ND.studioStats && ND.studioStats.event) ND.studioStats.event(name); } catch (e) { /* never breaks the game */ } };
  // a reward from the server's catalog ('rw:<id>', js/rewards.js): claimable only with a server that grants it
  const rwOk = () => !!(ND.passNet && ND.passNet.canGrant && ND.passNet.canGrant());
  const rwEntry = (it) => (it && it.kind === 'rw' && ND.rewards ? ND.rewards.get(it.ref) : null);
  const daysLeft = (se) => Math.max(0, Math.ceil((se.end - P.now()) / 864e5));
  const adsOk = () => !!(ND.ads && ND.ads.rewardedAvailable && ND.ads.rewardedAvailable());

  // ---------------------------------------------------------------- items: names, palettes, icons
  function itemName(id) {
    const it = LV.item(id), t = T();
    if (!it) return '';
    if (it.journey) {
      const ch = chOf(it.ninja), n = ch ? nice(ch.name) : it.ninja;
      return it.kind === 'cos' ? (it.journey === 2 ? t.cos2(n) : t.cos3(n)) : n + ' · ' + ((t.rank || {})[it.journey] || '');
    }
    if (it.kind === 'cos' && it.theme) { const ch = chOf(it.ninja); return ((t.themes || {})[it.theme] || it.theme) + ' · ' + (ch ? nice(ch.name) : it.ninja); }
    if (it.kind === 'boost') return t.boostName ? t.boostName(it.n) : id;
    if (it.kind === 'honor') return t.honorName ? t.honorName(it.n) : id;
    if (it.kind === 'rw') return (ND.rewards && ND.rewards.name(it.ref)) || it.ref;
    return (t.items && t.items[id]) || id;
  }
  // colour helpers (#rrggbb ↔ h s l)
  const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function hsl2hex(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
    return '#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  function hueOf(hex) {
    const [r, g, b] = hex2rgb(hex).map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return 220;
    const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  }
  const rgba = (hex, a) => `rgba(${hex2rgb(hex).join(',')},${a})`;
  // a theme (LEVEL.ITEMS cos pal) worn by one fighter: its own shapes and skin, the theme's cloth; the extra parts
  // some fighters have (haori, hood, armour, mask, gloves, tabi) follow the theme like the Champion colours do
  function themePal(c, X) {
    const o = Object.assign({}, c, X);
    o.skin = c.skin;
    if (!X.rim) { o.rim = c.rim; o.rimDim = c.rimDim; }
    if (c.haori) o.haori = X.cloth;
    if (c.hood) o.hood = { cloth: X.hakama || X.wrapDark, clothHi: X.wrap, clothDark: X.hakamaDark || X.wrapDark };
    if (c.armor) o.armor = X.clothDark;
    if (c.mask) o.mask = X.accent;
    if (c.glove) o.glove = X.wrap;
    if (c.tabi) o.tabi = X.hakamaDark || X.wrapDark;
    return o;
  }
  // journey costumes made from the ninja's own colour: 2 = Menkyo (robe dyed deep in the ninja's colour, ivory sash
  // and trim), 3 = Kaiden (near-black, bone-white trim, sash and rim light in the ninja's colour: the shadow)
  function journeyX(c, n) {
    const h = hueOf(c.ui);
    if (n === 2) return { cloth: hsl2hex(h, 42, 27), clothHi: hsl2hex(h, 38, 38), clothDark: hsl2hex(h, 46, 16), wrap: '#ece4d2', wrapDark: '#a59c88',
      accent: '#f6efe0', accentDark: '#9c917a', ui: c.ui, hakama: hsl2hex(h, 30, 12), hakamaDark: hsl2hex(h, 30, 7), rim: 'rgba(255,240,215,.62)', rimDim: 'rgba(200,185,160,.32)' };
    // (bone-white trim, the sash in the ninja's colour: different from the original even for the ninjas already in black)
    return { cloth: '#0e0e13', clothHi: '#24242e', clothDark: '#07070a', wrap: hsl2hex(h, 58, 34), wrapDark: hsl2hex(h, 58, 18),
      accent: '#f4efe6', accentDark: '#8f897d', ui: c.ui, hakama: '#0a0a0e', hakamaDark: '#050507', rim: rgba(c.ui, 0.95), rimDim: rgba(c.ui, 0.5) };
  }
  const palCache = new Map();
  function itemPal(ch, id) {
    const it = LV.item(id);
    if (!ch || !it || it.kind !== 'cos' || (it.ninja && it.ninja !== ch.id)) return null;
    const k = ch.id + '|' + id;
    let p = palCache.get(k);
    if (!p) { p = themePal(ch.col, it.journey ? journeyX(ch.col, it.journey) : it.pal); palCache.set(k, p); }
    return p;
  }
  // the colours an icon of this item uses (a costume: the theme, or the ninja's journey colours)
  function iconPal(it) {
    if (it.journey) { const ch = chOf(it.ninja); return ch ? themePal(ch.col, journeyX(ch.col, it.journey)) : null; }
    return it.pal || null;
  }
  // the reward's picture (inline SVG / text, no image files)
  function icon(id) {
    let it = LV.item(id);
    if (!it) return '';
    if (it.kind === 'rw') {
      // a catalog reward: drawn like its kind (a costume with its own palette when it has one)
      const e = rwEntry(it);
      if (!e) return `<b class="ps-ttl" style="--tc:#c79bff">賞</b>`;
      if (e.kind === 'costume') it = { kind: 'cos', pal: Object.assign({ cloth: '#3a3550', clothHi: '#5a547a', wrap: '#c79bff', accent: '#f1d69c', hakama: '#1b1826' }, e.pal || {}) };
      else if (e.kind === 'badge') it = { kind: 'badge', icon: e.icon || '賞', color: e.color || '#c79bff' };
      else it = { kind: 'title', color: e.color || '#c79bff' };
    }
    if (it.kind === 'cos') {
      const p = iconPal(it) || {}, rim = p.rim || 'rgba(255,255,255,.3)';
      const ch = it.ninja ? chOf(it.ninja) : null;
      // (a soft disc behind it and a light outline: the dark robes read on the dark card too)
      return `<svg class="ps-svg" viewBox="0 0 48 48" aria-hidden="true" style="filter:drop-shadow(0 0 3px ${rim})">` +
        `<circle cx="24" cy="26" r="21" fill="rgba(255,255,255,.07)"/>` +
        `<path d="M9 15 17 9.5 24 14 31 9.5 39 15 44 26 37.5 28 36 43 12 43 10.5 28 4 26Z" fill="${p.cloth}" stroke="${p.rim || 'rgba(255,255,255,.4)'}" stroke-width="1.3" stroke-linejoin="round"/>` +
        `<path d="M17 9.5 24 23 31 9.5" fill="none" stroke="${p.clothHi}" stroke-width="2.6" stroke-linejoin="round"/>` +
        `<path d="M12 34 36 34 36 43 12 43Z" fill="${p.hakama || p.clothDark}"/>` +
        `<rect x="11.2" y="26" width="25.6" height="6.4" fill="${p.wrap}"/><rect x="11.2" y="28.3" width="25.6" height="1.8" fill="${p.accent}"/>` +
        (ch ? `<text x="24" y="21.5" text-anchor="middle" font-size="9" font-family="serif" fill="${p.accent}">${esc(ch.kanji)}</text>` : '') + '</svg>';
    }
    if (it.kind === 'trail') {
      const g = 'psg_' + id;
      return `<svg class="ps-svg" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="rgb(${it.rgb})" stop-opacity="0"/><stop offset="1" stop-color="rgb(${it.rgb})" stop-opacity="1"/></linearGradient></defs>` +
        `<path d="M6 40 Q14 10 42 7 Q20 18 6 40Z" fill="url(#${g})"/><path d="M8 38 Q18 14 42 7" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.3" stroke-linecap="round"/></svg>`;
    }
    if (it.kind === 'badge') return `<b class="ps-bdg" style="--bc:${it.color}">${esc(it.icon)}</b>`;
    if (it.kind === 'frame') return `<b class="ps-frm" style="--fc:${it.color}">名</b>`;
    if (it.kind === 'title') return `<b class="ps-ttl" style="--tc:${it.color}">${it.journey ? (it.journey === 3 ? '皆伝' : '免許') : '称'}</b>`;
    if (it.kind === 'boost') return `<b class="ps-bst"><small>XP</small>×1.5<i>${it.n}</i></b>`;
    if (it.kind === 'honor') return `<b class="ps-hon">誉<small>+${it.n}</small></b>`;
    return '';
  }

  // ---------------------------------------------------------------- looks: pass costumes on the select screen
  const owns = (id) => S().own.includes(id);
  function costumesFor(ninja) {
    return S().own.filter((id) => { const it = LV.item(id); return it && it.kind === 'cos' && (!it.ninja || it.ninja === ninja); });
  }
  function wearing(ninja) { const st = S(), w = st.wear[ninja]; return w && st.own.includes(w) ? w : null; }
  // (ND.palOf: characters.js; a 'ps:<item>' look is a pass costume, the original colours when not available)
  const basePalOf = ND.palOf;
  if (basePalOf) ND.palOf = (ch, look) => (typeof look === 'string' && look.startsWith('ps:') ? itemPal(ch, look.slice(3)) || ch.col : basePalOf(ch, look));
  (function wrapLooks(sv) {
    const oLook = sv.look, oOpts = sv.lookOptions, oSet = sv.setLook;
    if (!oLook || !oOpts || !oSet) return;
    sv.look = function (id) { const w = safe(() => wearing(id)); return w ? 'ps:' + w : oLook.call(this, id); };
    sv.lookOptions = function (id) { const a = oOpts.call(this, id); safe(() => { for (const e of costumesFor(id)) a.push('ps:' + e); }); return a; };
    sv.setLook = function (id, v) {
      const st = S();
      if (typeof v === 'string' && v.startsWith('ps:')) {
        const it = v.slice(3);
        if (!costumesFor(id).includes(it)) return;
        st.wear[id] = it; commit(); return;
      }
      delete st.wear[id];
      return oSet.call(this, id, v);
    };
  })(ND.save);
  // the equipped blade trail: your own fighter in the modes where your save's look is used (not online, 2P, watch)
  const TRAIL_OFF = { online: 1, '2p': 1, watch: 1, attract: 1 };
  function setTrail(mode) {
    const id = S().eq.trail, it = id && LV.item(id);
    ND.passTrail = it && !TRAIL_OFF[mode] ? it.rgb : null;
  }

  // ---------------------------------------------------------------- earning
  const NO_XP = { online: 1, '2p': 1, watch: 1, attract: 1, train: 1, tutorial: 1 };
  let matchNo = 0, awardedNo = -1, playSec0 = 0, last = null; // last: the latest fight's XP (end screen)
  let pend = null; // a journey clear paid just before its final fight's XP (the two go on one end screen)
  // Add XP (any source) to the level and the season: → { from, to, ups, n }; the level-up moment follows
  function gain(n) {
    const st = S(), se = season(), t0 = tierOf(se, sp(st, se)).tier;
    const r = LV.add(st, n, se.key, se.C.mul, se.C.lvMul);
    commit();
    // studio statistics (once per install): levels 2 / 5 / 10 / 20, pass tiers 5 / 10 / 30
    for (const L of r.ups) if ([2, 5, 10, 20].includes(L)) once('level_' + L);
    const t1 = tierOf(se, sp(st, se)).tier;
    for (const k of [5, 10, 30]) if (t0 < k && t1 >= k) once('pass_tier_' + k);
    refreshStrip(); changed();
    return r;
  }
  // one finished single-player fight (game.matchEnd, wrapped in hookGame)
  function fightDone(G, w) {
    if (awardedNo === matchNo) return null;
    awardedNo = matchNo;
    const mode = G.mode;
    if (NO_XP[mode]) { last = null; return null; }
    const f1 = G.F && G.F[0], s = (G.stats && G.stats[0]) || {}, sc = ND.score && ND.score.on ? ND.score.last : null;
    const sec = sc && typeof sc.time === 'number' ? sc.time : (ND.ads ? ND.ads.playSec - playSec0 : 60);
    const c = { mode, won: !!w && w === f1, level: sc ? sc.level : 1, roundsWon: (G.wins && G.wins[0]) | 0, parries: s.parries | 0, counters: s.counters | 0, rallies: s.rallies | 0, perfects: s.perfect | 0, sec };
    return award(c);
  }
  function award(c) {
    const st = S(), cl = pend && Date.now() - pend.t < 5000 ? pend : null;
    pend = null;
    const lvBefore = cl ? cl.before : LV.levelOf(st.xp);
    const x = LV.fight(st, c, P.now(), tz());
    if (x.rows.some((q) => q[0] === 'daily')) { const p = sp(st, season()); p.w = Math.min(60, (p.w | 0) + 1); }
    const r = gain(x.total);
    if (cl) { x.rows.push(['clear', cl.xp, cl.n]); x.total += cl.xp; }
    last = { x, r, before: lvBefore, t: Date.now() };
    return last;
  }
  // Online fights (js/online.js friend rooms, js/ranked.js): o = { kind: 'friend' | 'ranked', won, sec, rounds }
  function onlineEnd(o) {
    return safe(() => {
      if (!o || (o.sec != null && o.sec < LV.XP.minSec)) return null;
      const r = award({ mode: o.kind === 'ranked' ? 'ranked' : 'friend', won: !!o.won, level: 1, roundsWon: o.rounds | 0, sec: o.sec, parries: o.parries | 0 });
      if (r && r.r.ups.length) setTimeout(() => levelUp(r.r.to.lv), 1500);
      return r;
    });
  }
  // an online match's result as js/net.js reports it ({ reason, winner, side, wins, frame }): a finished fight
  // (KO), or one the other side left / lost the connection to after a real fight; a broken one (desync) pays nothing
  function onlineResult(kind, res) {
    return safe(() => {
      if (!res || res.reason === 'desync' || typeof res.side !== 'number') return null;
      const sec = (res.frame | 0) * ((ND.game && ND.game.STEP) || 1 / 120);
      if (res.reason !== 'ko' && sec < LV.XP.shortSec) return null;
      const st = ND.game && ND.game.stats && ND.game.stats[res.side];
      return onlineEnd({ kind, won: res.winner === res.side, sec, rounds: res.wins ? res.wins[res.side] : 0, parries: st && st.parries });
    });
  }
  // fixed amounts (combo trials, tutorial, lessons) → toast "+n XP"
  function bonus(key, n) {
    if (!(n > 0)) return;
    const r = gain(n);
    if (ND.toast) ND.toast(T().plus(num(n)) + ' · ' + ((T().rows || {})[key] || key), T().k);
    if (r.ups.length) setTimeout(() => levelUp(r.to.lv), 600);
  }
  // a journey finished (js/arcade.js complete, wrapped): count, XP, the 2nd / 3rd clear rewards
  function journeyCleared(ninja) {
    const st = S(), before = LV.levelOf(st.xp), j = LV.journeyClear(st, ninja);
    commit();
    const r = gain(j.xp);
    // (the final fight's XP comes right after, game.matchEnd: award() puts this clear on the same end screen)
    pend = { xp: j.xp, n: j.n, before, t: Date.now() };
    last = { x: { total: j.xp, rows: [['clear', j.xp, j.n]] }, r, before, t: Date.now() };
    for (const g of j.items) setTimeout(() => gotToast(g), 900);
    return j;
  }

  // ---------------------------------------------------------------- claiming
  function payHonor(g) {
    if (g && g.kind === 'honor' && ND.save.addHonor) { const ev = ND.save.addHonor(g.n); if (ND.toastEvents) ND.toastEvents(ev); }
  }
  function gotToast(g) {
    if (!g || !ND.toast) return;
    const t = T(), it = LV.item(g.id);
    if (g.dup) { ND.toast(t.gotDup(g.n), t.k); return; }
    ND.toast(t.got + ': ' + itemName(g.id), it && it.icon ? it.icon : t.k, it && it.color);
  }
  // a tier whose reward is a catalog reward can be claimed only where the server grants it
  const rwBlocked = (se, t) => { const T0 = se.C.tiers[t - 1], it = T0 && LV.item(T0.r); return !!it && it.kind === 'rw' && !rwOk(); };
  // Claim tier t's reward: with one rewarded ad where ads work ('ad': granted only after a finished ad, never on an
  // error), else for free once the player is waitTiers tiers further ('wait'). → Promise of the grant, or null
  function claim(tier) {
    const st = S(), se = season(), p = sp(st, se), ok = adsOk(), way = LV.claimWay(se.C, p, tier, ok);
    if (!way) return Promise.resolve(null);
    if (rwBlocked(se, tier)) { if (ND.toast) ND.toast(T().online, T().k); return Promise.resolve(null); }
    const done = () => {
      const first = !Object.values(S().ps).some((q) => q.f && q.f.length);
      const g = LV.claim(se.C, S(), se.key, tier, way, ok);
      if (g) { payHonor(g); commit(); gotToast(g); fx('claim'); changed(); if (first) once('first_bonus_claim'); if (g.kind === 'rw' && ND.passNet) ND.passNet.now(); }
      return g;
    };
    if (way !== 'ad') return Promise.resolve(done());
    if (ND.ads.busy) return Promise.resolve(null);
    return ND.ads.rewarded().then((ok2) => {
      if (!ok2) { if (ND.toast) ND.toast(((ND.STR.ads || {}).fail) || '', '忍'); return null; }
      return done();
    });
  }
  // every reward that is open without an ad (no ads here, waited long enough): at once
  function claimAllWaiting() {
    const se = season(), p = sp(S(), se);
    let n = 0;
    for (let t = 1; t <= se.C.tiers.length; t++) if (LV.claimWay(se.C, p, t, false) === 'wait' && !adsOk() && !rwBlocked(se, t)) { claim(t); n++; }
    return n;
  }
  // rewards waiting for the player (reached, not claimed, claimable now)
  function readyCount() {
    const se = season(), p = sp(S(), se), ok = adsOk();
    let n = 0;
    for (let t = 1; t <= se.C.tiers.length; t++) if (LV.claimWay(se.C, p, t, ok)) n++;
    return n;
  }
  const tierOf = (se, p) => LV.tierOf(se.C, p.x);

  // ---------------------------------------------------------------- equip (titles, badges, frames, trails)
  function equip(kind, id) {
    const st = S();
    if (id == null) delete st.eq[kind];
    else { const it = LV.item(id); if (!it || it.kind !== kind || !st.own.includes(id)) return false; st.eq[kind] = id; }
    commit(); refreshStrip(); changed();
    return true;
  }

  // ---------------------------------------------------------------- sounds
  function fx(kind) {
    const a = au(); if (!a) return;
    try {
      if (kind === 'claim') { a.tone({ freq: 660, dur: 0.5, gain: 0.07, send: 0.5, type: 'triangle' }); a.tone({ freq: 990, dur: 0.7, gain: 0.06, send: 0.6, delay: 0.08, type: 'sine' }); }
      else if (kind === 'up') { if (a.gong) a.gong(); if (a.taiko) a.taiko(1); a.tone({ freq: 1320, dur: 1.2, gain: 0.05, send: 0.8, delay: 0.25, type: 'sine' }); }
      else if (kind === 'tick') a.tone({ freq: 1500, dur: 0.06, gain: 0.025, send: 0.1, type: 'sine' });
    } catch (e) { /* no sound */ }
  }

  // ================================================================ UI
  const CSS = `
  .pass-strip { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; width: 100%; box-sizing: border-box; padding: 7px 12px 7px 8px; text-align: left; background: linear-gradient(90deg, rgba(120,90,200,.12), rgba(217,179,108,.06)); border: 1px solid rgba(190,160,255,.38); color: var(--text); cursor: pointer; transition: background .15s, border-color .15s; }
  .pass-strip.aside { flex: 1 1 100%; margin-top: 6px; }
  .pass-strip:hover, .pass-strip:focus-visible { background: linear-gradient(90deg, rgba(120,90,200,.22), rgba(217,179,108,.1)); border-color: #c79bff; }
  .ps-lvb { position: relative; display: grid; place-items: center; width: 42px; height: 42px; box-sizing: border-box; border: 2px solid var(--fc, var(--gold)); background: radial-gradient(circle at 35% 30%, #3a2a14, #140f08 70%); color: var(--gold-hi); font: 700 19px/1 var(--display); font-variant-numeric: tabular-nums; box-shadow: 0 0 0 1px rgba(0,0,0,.6), 0 0 14px -4px var(--fc, var(--gold)); }
  .ps-lvb small { position: absolute; top: -7px; left: 50%; transform: translateX(-50%); padding: 0 4px; background: #17130a; color: var(--gold); font: 600 9px/1.3 var(--display); letter-spacing: .14em; }
  .ps-lvb .ps-bdg { position: absolute; right: -9px; bottom: -8px; width: 19px; height: 19px; font-size: 11px; }
  .pass-strip .ps-mid { display: grid; gap: 4px; min-width: 0; }
  .pass-strip .ps-mid small { font: 500 10.5px/1 var(--display); letter-spacing: .14em; text-transform: uppercase; color: var(--gold); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pass-strip .ps-mid small em { font-style: normal; color: var(--tc, var(--muted)); }
  .pass-strip .ps-mid span { font: 600 13px/1.1 var(--display); letter-spacing: .05em; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ps-xbar { position: relative; display: block; height: 6px; background: rgba(255,255,255,.1); overflow: hidden; }
  .ps-xbar::after { content: ''; position: absolute; inset: 0 auto 0 0; width: var(--p, 0%); background: linear-gradient(90deg, #8f6bff, #c79bff 60%, #f1d69c); transition: width var(--d, 0s) cubic-bezier(.3,.7,.3,1); }
  .pass-strip .ps-pss { display: grid; justify-items: end; gap: 3px; padding-left: 12px; border-left: 1px solid rgba(190,160,255,.25); }
  .pass-strip .ps-pss b { font: 700 13px/1 var(--display); letter-spacing: .12em; text-transform: uppercase; color: #d9c2ff; white-space: nowrap; }
  .pass-strip .ps-pss b::before { content: '影'; font-family: var(--jp); margin-right: 6px; color: #c79bff; }
  .pass-strip .ps-pss small { font: 500 10.5px/1 var(--display); letter-spacing: .1em; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
  /* the ready count sits on the strip's corner, never over the title */
  .ps-dot { position: absolute; top: -8px; right: -6px; z-index: 1; min-width: 16px; height: 16px; padding: 0 4px; box-sizing: border-box; border-radius: 8px; background: #e04a3c; color: #fff; font: 700 10px/16px var(--display); text-align: center; box-shadow: 0 0 10px rgba(224,74,60,.8); animation: psPulse 1.1s ease-in-out infinite alternate; }
  @keyframes psPulse { from { transform: scale(1); } to { transform: scale(1.15); } }
  @media (max-width: 560px) { .pass-strip .ps-pss small { display: none; } }

  #passOv { z-index: 24; display: flex; flex-direction: column; align-items: center; }
  #passOv .ps-card { box-sizing: border-box; width: min(1000px, 100%); margin: auto 0; padding: 14px 16px; display: grid; gap: 10px; background: rgba(10,12,22,.94); backdrop-filter: none; -webkit-backdrop-filter: none; }
  .ps-head { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: 14px; }
  .ps-head .ps-lvb { width: 50px; height: 50px; font-size: 22px; }
  .ps-who { display: grid; gap: 5px; min-width: 0; }
  .ps-who strong { font: 600 18px/1 var(--display); letter-spacing: .08em; text-transform: uppercase; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ps-who strong em { font-style: normal; font-size: 13px; letter-spacing: .06em; margin-left: 8px; color: var(--tc, var(--muted)); }
  .ps-who small { font: 500 11px/1 var(--display); letter-spacing: .1em; color: var(--muted); text-transform: uppercase; }
  .ps-sea { display: grid; justify-items: end; gap: 3px; }
  .ps-sea b { font: 700 16px/1 var(--display); letter-spacing: .12em; text-transform: uppercase; color: #d9c2ff; white-space: nowrap; }
  .ps-sea b::before { content: '影'; font-family: var(--jp); margin-right: 6px; color: #c79bff; }
  .ps-sea small { font: 500 11px/1 var(--display); letter-spacing: .1em; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
  .ps-tabs { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .ps-tabs [role="tab"] { padding: 7px 14px; background: rgba(255,255,255,.04); border: 1px solid var(--line); color: var(--muted); font: 600 13px/1 var(--display); letter-spacing: .12em; text-transform: uppercase; cursor: pointer; }
  .ps-tabs [role="tab"][aria-selected="true"] { color: #17130a; background: var(--gold); border-color: var(--gold); }
  .ps-tabs .ps-sp { flex: 1; }
  .ps-tabs .ps-note { font: 500 11.5px/1.2 var(--display); letter-spacing: .06em; color: var(--muted); }
  .ps-tabs .ps-note.on { color: var(--gold-hi); }
  .ps-tabs .btn { padding: 7px 12px; font-size: 13px; }
  .ps-wrap { display: grid; grid-template-columns: 74px minmax(0, 1fr); gap: 6px; }
  .ps-lab { display: grid; grid-template-rows: 30px 28px 1fr; gap: 6px; }
  .ps-lab span { display: grid; align-content: center; justify-items: center; gap: 3px; padding: 4px; text-align: center; border: 1px solid rgba(217,179,108,.3); background: rgba(217,179,108,.06); font: 700 12px/1.1 var(--display); letter-spacing: .1em; text-transform: uppercase; color: var(--gold); }
  .ps-lab span:first-child, .ps-lab span:empty { border: 0; background: none; }
  .ps-lab .ps-lb { border-color: rgba(190,160,255,.45); background: rgba(120,90,200,.12); color: #d9c2ff; }
  .ps-lab span small { font: 500 9.5px/1.2 var(--body); letter-spacing: 0; text-transform: none; color: var(--muted); }
  .ps-lab b { font: 700 18px/1 var(--jp); }
  .ps-track { overflow-x: auto; overflow-y: hidden; touch-action: pan-x pan-y; overscroll-behavior-x: contain; scroll-behavior: smooth; padding-bottom: 2px; }
  .ps-grid { position: relative; display: grid; grid-auto-flow: column; grid-template-rows: 30px 28px auto; grid-auto-columns: 96px; gap: 6px; width: max-content; }
  .ps-prog { position: relative; align-self: center; height: 4px; background: rgba(255,255,255,.08); }
  .ps-tn.soon { opacity: .45; border-style: dashed; }
  .ps-rw.soon { opacity: .5; border-style: dashed; border-color: rgba(190,160,255,.25); background: rgba(120,90,200,.04); min-height: 0; }
  .ps-q { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; border: 1px dashed rgba(199,155,255,.5); color: #c79bff; font: 700 20px/1 var(--display); }
  .ps-soon { position: sticky; left: 0; display: grid; align-content: center; gap: 1px; padding: 0 8px; border-left: 2px solid #c79bff; min-width: 0; overflow: hidden; white-space: nowrap; }
  .ps-soon b { font: 700 12px/1.1 var(--display); letter-spacing: .1em; text-transform: uppercase; color: #d9c2ff; overflow: hidden; text-overflow: ellipsis; }
  .ps-soon small { font: 500 10.5px/1.1 var(--body); color: var(--muted); overflow: hidden; text-overflow: ellipsis; }
  .ps-prog i { position: absolute; inset: 0 auto 0 0; width: var(--p, 0%); background: linear-gradient(90deg, #8f6bff, #f1d69c); box-shadow: 0 0 8px rgba(199,155,255,.6); }
  .ps-tn { position: relative; z-index: 1; justify-self: center; display: grid; place-items: center; width: 26px; height: 26px; box-sizing: border-box; border-radius: 50%; border: 1px solid rgba(255,255,255,.2); background: #121420; font: 700 12px/1 var(--display); color: var(--muted); font-variant-numeric: tabular-nums; }
  .ps-tn.on { background: var(--gold); border-color: var(--gold-hi); color: #17130a; }
  .ps-tn.cur { box-shadow: 0 0 0 3px rgba(199,155,255,.45); }
  .ps-rw { position: relative; display: grid; grid-template-rows: auto auto 1fr auto; justify-items: center; gap: 3px; min-height: 118px; box-sizing: border-box; padding: 7px 5px 6px; text-align: center; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.03); }
  .ps-rw.b { border-color: rgba(190,160,255,.2); background: rgba(120,90,200,.07); }
  .ps-rw.empty { background: none; border-style: dashed; border-color: rgba(255,255,255,.06); }
  .ps-rw.got { opacity: .55; }
  .ps-rw.got::after { content: '✓'; position: absolute; top: 3px; right: 6px; color: #7be08f; font: 700 15px/1 var(--display); }
  .ps-rw.rdy { border-color: var(--gold); box-shadow: 0 0 14px -4px var(--gold); }
  .ps-rw.b.rdy { border-color: #c79bff; box-shadow: 0 0 14px -4px #c79bff; }
  .ps-rw.lock .ps-ic { filter: grayscale(.6) brightness(.7); }
  .ps-rw small { font: 500 10.5px/1.15 var(--body); color: var(--text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
  .ps-rw em { font: 500 9px/1 var(--display); font-style: normal; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
  .ps-rw button { width: 100%; padding: 6px 2px; border: 1px solid var(--gold); background: var(--gold); color: #17130a; font: 700 11px/1 var(--display); letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
  .ps-rw.b button { background: #b38cff; border-color: #d9c2ff; }
  .ps-rw button.ad::before { content: '▶ '; }
  .ps-rw .ps-st { font: 500 10px/1.1 var(--display); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
  /* every icon stays inside its 46 × 46 box (no part sticks out over the label); smaller screens zoom the box */
  .ps-ic { display: grid; place-items: center; width: 46px; height: 46px; flex: none; }
  .ps-svg { width: 46px; height: 46px; }
  .ps-bdg { display: grid; place-items: center; width: 38px; height: 38px; box-sizing: border-box; border-radius: 50%; border: 2px solid var(--bc); background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.12), rgba(0,0,0,.4)); color: var(--bc); font: 700 20px/1 var(--jp); box-shadow: 0 0 10px -3px var(--bc); }
  .ps-frm { display: grid; place-items: center; width: 40px; height: 32px; box-sizing: border-box; border: 3px double var(--fc); background: rgba(0,0,0,.35); color: var(--fc); font: 700 16px/1 var(--jp); box-shadow: 0 0 10px -3px var(--fc); }
  .ps-ttl { display: grid; place-items: center; min-width: 38px; height: 30px; padding: 0 4px; box-sizing: border-box; white-space: nowrap; border-top: 2px solid var(--tc); border-bottom: 2px solid var(--tc); background: rgba(0,0,0,.3); color: var(--tc); font: 700 15px/1 var(--jp); }
  .ps-bst { position: relative; display: grid; place-items: center; width: 36px; height: 30px; box-sizing: border-box; border: 1px solid #c79bff; background: linear-gradient(180deg, rgba(199,155,255,.25), rgba(0,0,0,.3)); color: #e9dcff; font: 700 14px/1 var(--display); }
  .ps-bst small { position: absolute; top: -7px; left: 3px; padding: 0 2px; background: #17130a; font-size: 8.5px; color: #c79bff; }
  .ps-bst i { position: absolute; right: -5px; bottom: -7px; width: 15px; height: 15px; line-height: 15px !important; border-radius: 50%; background: #c79bff; color: #17130a; font: 700 10px/16px var(--display); font-style: normal; }
  .ps-hon { display: grid; place-items: center; gap: 2px; color: var(--gold); font: 700 22px/1 var(--jp); }
  .ps-hon small { font: 700 11px/1 var(--display); color: var(--gold-hi); }
  .ps-prof { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px 16px; max-height: min(60vh, 520px); overflow-y: auto; }
  .ps-prof section { display: grid; gap: 6px; align-content: start; }
  .ps-prof h3 { margin: 0; font: 600 13px/1 var(--display); letter-spacing: .14em; text-transform: uppercase; color: var(--gold); }
  .ps-chips { display: flex; flex-wrap: wrap; gap: 5px; }
  .ps-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px 4px 5px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.035); color: var(--text); font: 500 12px/1.2 var(--body); cursor: pointer; }
  .ps-chip[aria-pressed="true"] { border-color: var(--gold); background: rgba(217,179,108,.16); }
  .ps-chip .ps-ic, .ps-chip .ps-svg { width: 24px; height: 24px; }
  .ps-chip .ps-bdg { width: 22px; height: 22px; font-size: 12px; border-width: 1px; }
  .ps-chip .ps-frm { width: 24px; height: 20px; font-size: 10px; border-width: 2px; }
  .ps-chip .ps-ttl { min-width: 24px; height: 20px; padding: 0 2px; font-size: 9.5px; }
  #journeyLook .ps-look::before { content: '影'; font-family: var(--jp); margin-right: 5px; color: #c79bff; }
  #journeyLook .ps-look.ps-lj::before { content: '道'; color: #ff8a6a; }
  .ps-chip.none { color: var(--muted); }
  .ps-prof p { margin: 0; font-size: 12.5px; color: var(--muted); }
  .ps-seals { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 5px; }
  .ps-seals span { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border: 1px solid rgba(255,255,255,.08); font: 600 12px/1 var(--display); letter-spacing: .06em; color: var(--muted); }
  .ps-seals span.on { color: var(--text); }
  .ps-seals .k { font: 700 16px/1 var(--jp); }
  .ps-seal { display: inline-grid; place-items: center; width: 17px; height: 17px; box-sizing: border-box; border-radius: 3px; font: 700 10.5px/1 var(--jp); font-style: normal; vertical-align: middle; }
  .ps-seal.s0 { border: 1px dashed rgba(255,255,255,.2); color: transparent; }
  .ps-seal.s1 { background: var(--gold); color: #17130a; }
  .ps-seal.s2 { background: linear-gradient(135deg, #f4f6fa, #aab0bf); color: #1b1d24; box-shadow: 0 0 6px rgba(220,225,240,.5); }
  .ps-seal.s3 { background: #c8322a; color: #fff3e2; box-shadow: 0 0 8px rgba(230,70,50,.75); outline: 1px solid #ff8a6a; outline-offset: 1px; }
  .roster .rdyb.ps-seal { top: -8px; padding: 0; width: 18px; height: 18px; font-size: 12px; }
  .vs-side .ps-seal, #vs .ps-seal { margin-left: 8px; width: 22px; height: 22px; font-size: 13px; }
  .ps-jl { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  .ps-plate { display: inline-flex; align-items: center; gap: 5px; }
  .ps-plate b { padding: 0 4px; border: 1px solid var(--fc, var(--gold)); color: var(--gold-hi); font: 700 11px/1.4 var(--display); letter-spacing: .08em; }
  .ps-plate i { font: 700 13px/1 var(--jp); font-style: normal; }
  .ps-plate em { font-style: normal; }
  .xpb { margin: -6px 0 12px; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 4px 10px; text-align: left; padding: 6px 10px; border: 1px solid rgba(190,160,255,.4); background: rgba(120,90,200,.09); }
  .xpb .ps-lvb { grid-row: span 2; width: 36px; height: 36px; font-size: 16px; }
  .xpb .ps-xbar { height: 8px; }
  .xpb strong { font: 700 18px/1 var(--display); color: #e9dcff; font-variant-numeric: tabular-nums; }
  .xpb .xr { grid-column: 2 / -1; display: flex; flex-wrap: wrap; gap: 3px 10px; font: 500 10.5px/1.2 var(--display); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
  .xpb .xr b { color: #d9c2ff; font-weight: 600; }
  .xpb.up { animation: xpUp .8s ease-out; }
  @keyframes xpUp { 0% { box-shadow: 0 0 18px 2px rgba(241,214,156,.75); border-color: #f1d69c; } 100% { box-shadow: 0 0 22px 4px rgba(241,214,156,0); } }
  .ed-stats + .xpb, #edXp { margin: 10px 0 0; }

  #lvUp { position: absolute; inset: 0; z-index: 60; display: grid; place-items: center; pointer-events: none; }
  /* (never in the way: the buttons under it keep working; it goes by itself) */
  #lvUp .lu { display: grid; justify-items: center; gap: 8px; padding: 18px 30px 16px; background: radial-gradient(ellipse at center, rgba(20,14,30,.94), rgba(10,8,16,.86)); border: 1px solid #c79bff; box-shadow: 0 20px 60px rgba(0,0,0,.6), 0 0 40px -8px #c79bff; animation: luIn .55s cubic-bezier(.2,1.4,.4,1); }
  #lvUp .lu.out { animation: luOut .35s ease-in forwards; }
  #lvUp small { font: 600 13px/1 var(--display); letter-spacing: .3em; text-transform: uppercase; color: #d9c2ff; }
  #lvUp .lu-n { display: grid; place-items: center; width: 92px; height: 92px; box-sizing: border-box; border: 3px solid var(--gold); background: radial-gradient(circle at 35% 30%, #4a3416, #120c05 70%); color: var(--gold-hi); font: 700 46px/1 var(--display); box-shadow: 0 0 30px -4px var(--gold); transform: rotate(-4deg); }
  #lvUp em { font: 500 12px/1.3 var(--body); font-style: normal; color: var(--muted); }
  @keyframes luIn { from { opacity: 0; transform: scale(1.6); } to { opacity: 1; transform: scale(1); } }
  @keyframes luOut { to { opacity: 0; transform: scale(.9); } }
  @media (max-width: 640px) {
    .ps-head { grid-template-columns: auto minmax(0, 1fr) auto; gap: 8px 10px; }
    .ps-sea { grid-column: 1 / -1; grid-row: 2; justify-items: start; }
    .ps-wrap { grid-template-columns: 56px minmax(0, 1fr); }
    .ps-lab span small { display: none; }
  }
  @media (max-height: 400px) {
    #passOv .ps-head .ps-xbar { height: 4px; }
    #passOv .ps-rw { gap: 2px; }
    #passOv .ps-rw .ps-ic { zoom: .72; }
    #passOv .ps-rw em { display: none; }
    #passOv .ps-rw { grid-template-rows: auto 1fr auto; min-height: 86px; }
    #passOv .ps-rw button { padding: 5px 2px; }
    #passOv .ps-lab { grid-template-rows: 26px 24px 1fr; }
    #passOv .ps-grid { grid-template-rows: 26px 24px auto; }
    #passOv .ps-tn { width: 22px; height: 22px; }
  }
  @media (max-height: 520px) {
    #passOv.overlay { padding-block: 6px; }
    #passOv .ps-card { padding: 8px 12px; gap: 6px; }
    .ps-head .ps-lvb { width: 40px; height: 40px; font-size: 18px; }
    .ps-who strong { font-size: 15px; }
    .ps-tabs [role="tab"], .ps-tabs .btn { padding: 6px 10px; font-size: 12px; }
    .ps-rw { min-height: 104px; padding: 5px 4px; }
    .ps-rw .ps-ic { zoom: .82; }
    .ps-grid { grid-auto-columns: 88px; gap: 5px; }
    .ps-prof { max-height: calc(100vh - 150px); }
    .xpb { margin: -4px 0 8px; padding: 4px 8px; }
    .xpb .ps-lvb { width: 30px; height: 30px; font-size: 14px; }
  }
  `;
  function injectCss() {
    if ($('passCss')) return;
    const st = document.createElement('style'); st.id = 'passCss'; st.textContent = CSS; document.head.appendChild(st);
  }

  // the level square (frame colour = equipped frame, badge = equipped badge)
  function lvBadge(lv, small) {
    const st = S(), fr = st.eq.frame && LV.item(st.eq.frame), bd = st.eq.badge && LV.item(st.eq.badge);
    return `<span class="ps-lvb" style="${fr ? '--fc:' + fr.color : ''}"><small>${esc(T().lv)}</small>${lv}${!small && bd ? `<b class="ps-bdg" style="--bc:${bd.color}">${esc(bd.icon)}</b>` : ''}</span>`;
  }
  function titleHtml() {
    const st = S(), id = st.eq.title, it = id && LV.item(id);
    return it ? `<em style="--tc:${it.color}">${esc(itemName(id))}</em>` : '';
  }
  const seal = (n) => `<i class="ps-seal s${Math.min(3, n | 0)}" aria-hidden="true">${['', '一', '二', '三'][Math.min(3, n | 0)] || ''}</i>`;

  // ---------------------------------------------------------------- menu strip (#mpass, after the honor strip)
  // Where the strip goes: on a tall screen under the honor strip (with the game modes); on a short or narrow one
  // (phones, CrazyGames' 821×462) under the options line instead, so PLAY, SINGLE MATCH, PLAY WITH A FRIEND and
  // RANKED stay on screen without scrolling (scripts/ranked-layout-check.mjs, cg-sizes-check.mjs)
  function placeStrip(el) {
    const hon = $('mhonor'), opts = document.querySelector('#menu .opts');
    // (the short-landscape menu of index.html: brand and options on the left, modes on the right; or a narrow screen)
    let short = (window.innerWidth || 1280) <= 600;
    try { short = short || window.matchMedia('(max-height: 540px) and (min-width: 560px)').matches; } catch (e) { /* no matchMedia */ }
    if (short && opts) { if (el.parentNode !== opts) opts.appendChild(el); el.classList.add('aside'); return; } // (its own line in the options row)
    const modes = hon ? hon.parentNode : document.querySelector('#menu .modes');
    if (!modes) return;
    el.classList.remove('aside');
    if (hon) { if (hon.nextSibling !== el) modes.insertBefore(el, hon.nextSibling); } else if (el.parentNode !== modes) modes.appendChild(el);
  }
  function ensureStrip() {
    let el = $('mpass');
    if (el) { placeStrip(el); return el; }
    if (!$('mhonor') && !document.querySelector('#menu .modes')) return null;
    el = document.createElement('button');
    el.type = 'button'; el.id = 'mpass'; el.className = 'pass-strip';
    el.onclick = () => { if (ND.audio && ND.audio.ui) ND.audio.ui(); open('pass'); };
    placeStrip(el);
    try { window.addEventListener('resize', () => placeStrip(el)); } catch (e) { /* no window */ }
    return el;
  }
  function refreshStrip() {
    safe(() => {
      const el = ensureStrip(); if (!el) return;
      const st = S(), L = LV.levelOf(st.xp), t = T(), se = season(), p = sp(st, se), R = tierOf(se, p), rd = readyCount();
      const ti = st.eq.title && LV.item(st.eq.title);
      el.innerHTML = lvBadge(L.lv) +
        `<span class="ps-mid"><small>${esc(t.level(L.lv))}${ti ? ` · <em style="--tc:${ti.color}">${esc(itemName(st.eq.title))}</em>` : ''}</small>` +
        `<i class="ps-xbar" style="--p:${(L.pct * 100).toFixed(1)}%"></i><span>${esc(L.lv >= LV.MAX ? t.xpMax(num(st.xp)) : t.xp(num(L.into), num(L.need)))}${st.bo ? ' · ' + esc(t.boostLeft(st.bo)) : ''}</span></span>` +
        `<span class="ps-pss"><b>${esc(t.name)}</b><small>${esc(t.tier(R.tier, R.max))} · ${esc(daysLeft(se) <= 1 ? t.lastDay : t.left(daysLeft(se)))}</small>${rd ? `<i class="ps-dot">${rd}</i>` : ''}</span>`;
      el.setAttribute('aria-label', t.level(L.lv) + ' · ' + t.name + ' · ' + t.tier(R.tier, R.max) + (rd ? ' · ' + t.ready(rd) : ''));
    });
  }

  // ---------------------------------------------------------------- the pass screen (#passOv)
  let tab = 'pass', ov = null, backTo = null;
  function ensureOv() {
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'passOv'; ov.className = 'overlay'; ov.hidden = true;
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = '<div class="card ps-card" id="passIn"></div>';
    ($('app') || document.body).appendChild(ov);
    ov.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'Backspace' || (ND.input && ND.input.isBack && ND.input.isBack(e))) { e.preventDefault(); e.stopPropagation(); close(); }
    });
    return ov;
  }
  let offerCounted = false;
  function open(which) {
    safe(() => {
      injectCss(); ensureOv();
      tab = which || tab; offerCounted = false;
      backTo = $('menu') && !$('menu').hidden ? 'menu' : null;
      if (backTo) $('menu').hidden = true;
      ov.hidden = false;
      render(true);
      setTimeout(() => { const f = ov.querySelector('.ps-rw button') || ov.querySelector('[role="tab"][aria-selected="true"]'); if (f) f.focus({ preventScroll: true }); }, 0);
    });
  }
  function close() {
    if (!ov || ov.hidden) return;
    ov.hidden = true;
    if (backTo === 'menu' && ND.game && ND.game.mode === 'attract') { $('menu').hidden = false; setTimeout(() => { const m = $('mpass'); if (m) m.focus(); }, 0); }
    refreshStrip();
  }
  // One tier's reward card: claimed / "Watch ad" (ads work here) / "Claim" (no ads here, waited long enough) / locked
  function rewardCard(se, p, t, ok) {
    const Tt = se.C.tiers[t - 1], id = Tt && Tt.r, tx = T();
    if (!id) return `<div class="ps-rw b empty" aria-hidden="true"></div>`;
    const it = LV.item(id), reached = tierOf(se, p).tier >= t, got = p.f.includes(t);
    let act = '', cls = '';
    if (got) { cls = 'got'; act = `<span class="ps-st">${esc(tx.owned)}</span>`; }
    else {
      const w = LV.claimWay(se.C, p, t, ok);
      if (w === 'ad') { cls = 'rdy'; act = `<button type="button" class="ad" data-claim="${t}">${esc(tx.watch)}</button>`; }
      else if (w === 'wait') { cls = 'rdy'; act = `<button type="button" data-claim="${t}">${esc(tx.claim)}</button>`; }
      // (locked: with ads it opens at its own tier, without ads waitTiers tiers later)
      else { cls = 'lock'; act = `<span class="ps-st">🔒 ${esc(tx.opensAt(ok ? t : LV.waitTier(se.C, t)))}</span>`; }
    }
    // a catalog reward where no server grants it (offline, no online identity): not claimable here
    if (!got && it.kind === 'rw' && !rwOk() && cls === 'rdy') { cls = 'lock'; act = `<span class="ps-st">🔒 ${esc(tx.online)}</span>`; }
    const kind = it.kind === 'rw' ? ((rwEntry(it) || {}).kind === 'costume' ? 'cos' : (rwEntry(it) || {}).kind || 'title') : it.kind;
    return `<div class="ps-rw b ${cls}" data-item="${esc(id)}" title="${esc((tx.kinds || {})[kind] || '')}: ${esc(itemName(id))}"><span class="ps-ic">${icon(id)}</span><em>${esc((tx.kinds || {})[kind] || '')}</em><small>${esc(itemName(id))}</small>${act}</div>`;
  }
  function render(scroll) {
    if (!ov || ov.hidden) return;
    const st = S(), t = T(), se = season(), p = sp(st, se), R = tierOf(se, p), L = LV.levelOf(st.xp), ok = adsOk(), N = se.C.tiers.length;
    const left = daysLeft(se), waitN = ok ? 0 : (() => { let n = 0; for (let k = 1; k <= N; k++) if (LV.claimWay(se.C, p, k, false) === 'wait') n++; return n; })();
    // (the scroll positions stay when the screen is drawn again: equipping in the profile, claiming on the track)
    const keep = { ov: ov.scrollTop, prof: ((ov.querySelector('.ps-prof') || {}).scrollTop) || 0, track: (($('psTrack') || {}).scrollLeft) || 0 };
    const ti = st.eq.title && LV.item(st.eq.title);
    const daily = st.d.w === LV.dayOf(P.now(), tz());
    let body;
    if (tab === 'pass') {
      const cols = [], M = Math.max(N, se.C.soon | 0);
      for (let k = 1; k <= N; k++) {
        cols.push(`<span class="ps-tn ${R.tier >= k ? 'on' : ''} ${R.tier + 1 === k ? 'cur' : ''}" style="grid-column:${k};grid-row:2">${k}</span>`);
        cols.push(rewardCard(se, p, k, ok).replace('<div ', `<div style="grid-column:${k};grid-row:3" `));
      }
      // the announced tiers after the real ones (season data `soon`): locked mystery slots; the season XP keeps counting
      if (M > N) {
        cols.push(`<span class="ps-soon" style="grid-column:${N + 1}/${M + 1};grid-row:1"><b>${esc(t.soon)}</b><small>${esc(t.soonXp)}</small></span>`);
        for (let k = N + 1; k <= M; k++) {
          cols.push(`<span class="ps-tn soon" style="grid-column:${k};grid-row:2">${k}</span>`);
          cols.push(`<div class="ps-rw soon" style="grid-column:${k};grid-row:3" aria-hidden="true"><span class="ps-ic"><b class="ps-q">?</b></span><span class="ps-st">🔒</span></div>`);
        }
      }
      const prog = ((R.tier + (R.tier < N ? R.pct : 0)) / N) * 100;
      body = `<div class="ps-wrap"><div class="ps-lab"><span></span><span></span><span class="ps-lb"><b>影</b>${esc(t.bonus)}<small>${esc(ok ? t.bonusAds : t.bonusWait(se.C.waitTiers))}</small></span></div>` +
        `<div class="ps-track" id="psTrack"><div class="ps-grid" style="grid-template-columns:repeat(${M},var(--cw,96px))"><span class="ps-prog" style="grid-column:1/${N + 1};grid-row:2"><i style="--p:${prog.toFixed(2)}%"></i></span>${cols.join('')}</div></div></div>`;
    } else body = profileHtml(st, t);
    $('passIn').innerHTML =
      `<div class="ps-head">${lvBadge(L.lv)}<div class="ps-who"><strong>${esc(t.level(L.lv))}${ti ? ` <em style="--tc:${ti.color}">${esc(itemName(st.eq.title))}</em>` : ''}</strong>` +
      `<i class="ps-xbar" style="--p:${(L.pct * 100).toFixed(1)}%"></i><small>${esc(L.lv >= LV.MAX ? t.xpMax(num(st.xp)) : t.xp(num(L.into), num(L.need)))}${st.bo ? ' · ' + esc(t.boostLeft(st.bo)) : ''}</small></div>` +
      `<div class="ps-sea"><b>${esc(t.name)}</b><small>${esc(t.season(se.n))} · ${esc(left <= 1 ? t.lastDay : t.left(left))}</small><small>${esc(t.tier(R.tier, N))}${R.tier < N ? ' · ' + esc(t.xp(num(R.into), num(R.need))) : ''}</small></div>` +
      `<button class="btn" type="button" id="passClose">${esc(t.close)}</button></div>` +
      `<div class="ps-tabs" role="tablist"><button type="button" role="tab" data-tab="pass" aria-selected="${tab === 'pass'}">${esc(t.tabs.pass)}</button><button type="button" role="tab" data-tab="profile" aria-selected="${tab === 'profile'}">${esc(t.tabs.profile)}</button>` +
      `<span class="ps-sp"></span><span class="ps-note ${daily ? '' : 'on'}">${esc(daily ? t.dailyDone : t.daily)}</span>` +
      (tab === 'pass' && waitN > 1 ? `<button class="btn primary" type="button" id="passAll">${esc(t.claimAll(waitN))}</button>` : '') + '</div>' + body;
    $('passClose').onclick = () => close();
    // a rewarded offer on screen (the Shadow row's "Watch ad"): counted once per opening, through the ads module's own
    // counter when it has one (studio statistics: ad_rew_offer; the clicks and results are counted in ND.ads.rewarded)
    if (!offerCounted && ov.querySelector('button.ad') && ND.ads && typeof ND.ads.showOffer === 'function') {
      offerCounted = true;
      safe(() => { const x = document.createElement('i'); x.hidden = true; ND.ads.showOffer(x); });
    }
    ov.querySelectorAll('[role="tab"]').forEach((b) => (b.onclick = () => { tab = b.dataset.tab; render(true); }));
    const all = $('passAll'); if (all) all.onclick = () => { claimAllWaiting(); render(false); };
    ov.querySelectorAll('[data-claim]').forEach((b) => (b.onclick = () => {
      b.disabled = true;
      claim(+b.dataset.claim).then(() => render(false), () => render(false));
    }));
    ov.querySelectorAll('[data-eq]').forEach((b) => (b.onclick = () => { const [k, id] = b.dataset.eq.split(':'); equip(k, id || null); render(false); }));
    const tr = $('psTrack');
    if (!scroll) {
      ov.scrollTop = keep.ov;
      const pf = ov.querySelector('.ps-prof'); if (pf) pf.scrollTop = keep.prof;
      if (tr) { tr.style.scrollBehavior = 'auto'; tr.scrollLeft = keep.track; tr.style.scrollBehavior = ''; }
    }
    if (tr && scroll) {
      // the first tier with something to claim, else the current one, a column in from the left edge
      let k = 1;
      while (k <= N && !LV.claimWay(se.C, p, k, ok)) k++;
      if (k > N) k = Math.min(N, R.tier + 1);
      tr.style.scrollBehavior = 'auto';
      tr.scrollLeft = Math.max(0, (k - 2) * (tr.scrollWidth / N));
      tr.style.scrollBehavior = '';
    }
  }
  function profileHtml(st, t) {
    const kinds = [['title', t.heads.titles], ['badge', t.heads.badges], ['frame', t.heads.frames], ['trail', t.heads.trails]];
    const sec = kinds.map(([k, head]) => {
      const own = st.own.filter((id) => { const it = LV.item(id); return it && it.kind === k; });
      const chips = own.length ? `<button type="button" class="ps-chip none" data-eq="${k}:" aria-pressed="${!st.eq[k]}">—</button>` + own.map((id) =>
        `<button type="button" class="ps-chip" data-eq="${k}:${esc(id)}" aria-pressed="${st.eq[k] === id}"><span class="ps-ic">${icon(id)}</span>${esc(itemName(id))}</button>`).join('') : `<p>${esc(t.none)}</p>`;
      return `<section><h3>${esc(head)}</h3><div class="ps-chips">${chips}</div></section>`;
    });
    const cos = st.own.filter((id) => { const it = LV.item(id); return it && it.kind === 'cos'; });
    sec.push(`<section><h3>${esc(t.heads.costumes)}</h3><div class="ps-chips">${cos.length ? cos.map((id) => `<span class="ps-chip"><span class="ps-ic">${icon(id)}</span>${esc(itemName(id))}</span>`).join('') : `<p>${esc(t.none)}</p>`}</div><p>${esc(t.wearHint)}</p></section>`);
    const seals = (ND.CHARS || []).filter((c) => !c.hidden || st.jc[c.id]).map((c) => { const n = st.jc[c.id] | 0;
      return `<span class="${n ? 'on' : ''}" title="${esc(n ? t.clears(n) : '')}"><b class="k" style="color:${n ? c.col.ui : 'inherit'}">${esc(c.kanji)}</b>${esc(nice(c.name))}${n ? seal(n) : seal(0)}</span>`; }).join('');
    sec.push(`<section><h3>${esc(t.heads.seals)}</h3><div class="ps-seals">${seals}</div><p>${esc(t.total(num(st.xp)))}${st.d.s > 1 ? ' · ' + esc(t.streak(st.d.s)) : ''}</p></section>`);
    return `<div class="ps-prof">${sec.join('')}</div>`;
  }

  // ---------------------------------------------------------------- end screen XP bar (#endXp) and level-up
  function xpBlock(id, after, res) {
    let el = $(id);
    if (!res) { if (el) el.hidden = true; return null; }
    if (!el) {
      el = document.createElement('div'); el.id = id; el.className = 'xpb'; el.setAttribute('aria-live', 'polite');
      if (after && after.parentNode) after.parentNode.insertBefore(el, after.nextSibling); else return null;
    }
    const t = T(), x = res.x, from = res.before, to = res.r.to;
    const rows = x.rows.filter((r) => ['daily', 'streak', 'boost', 'short', 'clear'].includes(r[0]))
      .map(([k, v, n]) => `<span>${esc((t.rows || {})[k] || k)}${k === 'streak' ? ' · ' + esc(t.streakN(n)) : k === 'clear' ? ' ' + seal(n) : ''} <b>${v < 0 ? '−' + num(-v) : '+' + num(v)}</b></span>`).join('');
    el.hidden = false; el.classList.remove('up');
    const why = !x.total && x.short ? `<span>${esc((t.rows || {}).short || '')}</span>` : '';
    el.innerHTML = lvBadge(from.lv, true) + `<i class="ps-xbar" style="--p:${(from.pct * 100).toFixed(1)}%"></i><strong>${esc(t.plus(num(x.total)))}</strong>` + (rows || why ? `<div class="xr">${rows}${why}</div>` : '');
    // fill the bar: to the end of each level passed (the level-up moment there), then to where it is now
    const bar = el.querySelector('.ps-xbar'), box = el.querySelector('.ps-lvb');
    const steps = [];
    for (let L = from.lv; L < to.lv; L++) steps.push([1, L + 1]);
    steps.push([to.pct, null]);
    let i = 0;
    const next = () => {
      if (i >= steps.length || el.hidden) return;
      const [pct, up] = steps[i++];
      bar.style.setProperty('--d', '.7s'); bar.style.setProperty('--p', (pct * 100).toFixed(1) + '%');
      setTimeout(() => {
        if (up) {
          bar.style.setProperty('--d', '0s'); bar.style.setProperty('--p', '0%');
          if (box) box.lastChild.textContent = String(up);
          el.classList.remove('up'); void el.offsetWidth; el.classList.add('up');
          if (i === steps.length - 1) levelUp(to.lv);
          setTimeout(next, 60);
        } else next();
      }, 720);
    };
    setTimeout(next, 650);
    return el;
  }
  function levelUp(lv) {
    const st = S();
    if (lv <= st.seen) return;
    st.seen = lv; commit();
    let el = $('lvUp');
    if (!el) { el = document.createElement('div'); el.id = 'lvUp'; ($('app') || document.body).appendChild(el); }
    const t = T(), se = season(), p = sp(st, se), R = tierOf(se, p);
    el.hidden = false;
    el.innerHTML = `<div class="lu" role="status"><small>${esc(t.up)}</small><b class="lu-n">${lv}</b><em>${esc(t.name)} · ${esc(t.tier(R.tier, R.max))}</em></div>`;
    fx('up');
    const box = el.firstChild;
    const shut = () => { if (!box.isConnected || box.classList.contains('out')) return; box.classList.add('out'); setTimeout(() => { if (el.firstChild === box) { el.hidden = true; el.textContent = ''; } }, 360); };
    setTimeout(shut, 2600);
    refreshStrip();
  }

  // ---------------------------------------------------------------- hooks into the game (installed by arcade.init)
  function hookGame(G) {
    injectCss();
    const wrap = (obj, name, after, before) => {
      const f = obj && obj[name];
      if (typeof f !== 'function') return;
      obj[name] = function (...args) {
        if (before) safe(() => before.call(this, args));
        const r = f.apply(this, args);
        safe(() => after.call(this, args, r));
        return r;
      };
    };
    // a match starts: its number (one award per match), the fight-time mark, the blade trail of this mode
    wrap(G, 'start', function () { matchNo++; playSec0 = ND.ads ? ND.ads.playSec : 0; setTrail(G.mode); });
    // a match ends: XP, then the bar on the end screen (the runner may have filled the end screen already)
    wrap(G, 'matchEnd', function (args) {
      if (G.mode === 'online') return;
      // a ranked shadow fight (js/ghost.js): XP like a ranked fight; its result screen is the ranked one, so no XP bar
      // here, the level-up moment on its own
      if (G.mode === 'shadow') { const r = fightDone(G, args[0]); if (r && r.r.ups.length) setTimeout(() => levelUp(r.r.to.lv), 1500); return; }
      const res = fightDone(G, args[0]);
      const after = $('endHonor') || $('endScore');
      if (res && G.phase === 'end') xpBlock('endXp', after, res); else xpBlock('endXp', after, null);
    });
    const A = ND.arcade;
    wrap(A, 'refreshMenu', () => {
      refreshStrip();
      // a level reached where no end screen showed it (a tournament or Dan screen): the moment, back in the menu
      const st = S(), L = LV.levelOf(st.xp).lv;
      if (L > st.seen) setTimeout(() => { if (ND.game && ND.game.mode === 'attract' && !$('menu').hidden) levelUp(L); }, 500);
    });
    // journey clear count: once per run, when the run becomes done (not when a finished run's ending is reopened)
    wrap(A, 'complete', function () {
      const R = this.run;
      if (R && R.done && !this._psWasDone) journeyCleared(ND.CHARS[R.me].id);
    }, function () { this._psWasDone = !!(this.run && this.run.done); });
    wrap(A, 'showEnding', function () {
      const R = this.run; if (!R) return;
      const id = ND.CHARS[R.me].id, n = S().jc[id] | 0;
      xpBlock('edXp', $('edStats'), last && Date.now() - last.t < 60000 ? last : null);
      const mr = $('journeyReward');
      if (mr && n) {
        const t = T(), nx = n === 1 ? t.next2 : n === 2 ? t.next3 : '';
        mr.insertAdjacentHTML('beforeend', `<span class="ps-jl">${seal(n)} ${esc(t.seal[Math.min(3, n)])}${nx ? ' · ' + esc(nx) : ''}</span>`);
      }
    });
    wrap(A, 'refreshSelect', function () { selectSeals(); });
    wrap(A, 'openVs', function () {
      const R = this.run; if (!R) return;
      const n = S().jc[ND.CHARS[R.me].id] | 0, el = $('vsn1');
      if (el && n) el.insertAdjacentHTML('beforeend', ' ' + seal(n));
    });
    // fixed XP: combo trials, the tutorial, lessons
    const CT = ND.comboTrial;
    if (CT) wrap(CT, 'clear', null, function () {
      const T0 = this.list && this.list[this.i], first = T0 && !this.cleared(T0.id), st = S();
      LV.touchDay(st, P.now(), tz());
      if (first) setTimeout(() => bonus('trial', LV.XP.trial), 0);
      else if ((st.d.t | 0) < LV.XP.trialAgainMax) { st.d.t = (st.d.t | 0) + 1; setTimeout(() => bonus('trial', LV.XP.trialAgain), 0); }
    });
    const sv = ND.save;
    wrap(sv, 'tutorialDone', null, function () { if (!this.p.tutorial) setTimeout(() => bonus('tutorial', LV.XP.tutorial), 0); });
    wrap(sv, 'lessonDone', null, function (args) { if (!this.p.lessons.includes(args[0])) setTimeout(() => bonus('trial', LV.XP.lesson), 0); });
    // keys and gamepad while the pass screen is open: back closes it, the rest is the page's own (focus, Enter)
    const I = ND.input;
    if (I && typeof I.onKey === 'function') {
      const oKey = I.onKey;
      I.onKey = function (e) { if (P.isOpen) { if (I.isBack && I.isBack(e) && !e.repeat) { close(); return true; } return false; } return oKey.apply(this, arguments); };
    }
    if (I && typeof I.onPad === 'function') {
      const oPad = I.onPad;
      I.onPad = function (st, prev) {
        if (!P.isOpen) return oPad.apply(this, arguments);
        if (st.kick && !prev.kick) close();
        else if ((st.light && !prev.light) || (st.up && !prev.up)) { const b = ov.querySelector('.ps-rw button'); if (b) b.click(); }
      };
    }
    if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(() => { refreshStrip(); render(false); });
    refreshStrip();
  }
  // the select screen: each roster card's journey seal shows the clear count; the journey panel says the next reward
  function selectSeals() {
    const st = S(), t = T();
    for (const n of [1, 2]) {
      const ro = $('ro' + n);
      if (ro) for (const b of ro.children) {
        const c = ND.CHARS[+b.dataset.k], badge = b.querySelector('[data-journey-badge]');
        if (!c || !badge) continue;
        const k = Math.max(1, Math.min(3, st.jc[c.id] | 0));
        badge.className = 'rdyb ps-seal s' + k; badge.textContent = ['', '一', '二', '三'][k];
        b.title = t.seal[k] || b.title;
      }
    }
    const panel = $('journeyPanel'), G = ND.game;
    if (panel && !panel.hidden && G && G.sel) {
      const ch = ND.CHARS[G.selShown ? G.selShown(0) : G.sel.c[0]], n = ch ? st.jc[ch.id] | 0 : 0;
      if (ch && n) {
        const nx = n <= 1 ? t.next2 : n === 2 ? t.next3 : '';
        panel.insertAdjacentHTML('beforeend', `<p class="ps-jl">${seal(n)} ${esc(n ? t.clears(n) : '')}${n && nx ? ' · ' : ''}${esc(n >= 1 ? nx : '')}</p>`);
      }
    }
    // the pass costumes in the Colors row (save.lookOptions has them; arcade.js draws only its own kinds)
    const look = $('journeyLook'), sel = G && G.sel && ND.CHARS[G.selShown ? G.selShown(0) : G.sel.c[0]];
    if (look && !look.hidden && sel && !(G.selShown && G.selShown(0) !== G.sel.c[0])) {
      const now = ND.save.look(sel.id);
      for (const id of costumesFor(sel.id)) {
        const v = 'ps:' + id, b = document.createElement('button');
        b.type = 'button'; b.className = 'look-slot ps-look' + (LV.item(id).journey ? ' ps-lj' : ''); b.textContent = itemName(id);
        b.setAttribute('aria-pressed', String(now === v));
        b.onclick = () => { ND.save.setLook(sel.id, v); if (G.refreshSelect) G.refreshSelect(); };
        look.appendChild(b);
      }
    }
  }

  // ---------------------------------------------------------------- public
  const P = ND.pass = {
    now: () => Date.now(),
    state: S, season, itemName, itemPal, icon, owns, costumesFor, wearing,
    get last() { return last; },
    award, onlineEnd, onlineResult, bonus, journeyCleared, claim, claimAllWaiting, readyCount, equip,
    open, close, get isOpen() { return !!ov && !ov.hidden; }, refreshStrip, levelUp,
    level: () => LV.levelOf(S().xp),
    defaultSeason: DEF,
    // A season from the server (js/pass-net.js): { key: 'S<id>', n, start, end, C } or null. The first time it comes,
    // the XP this season already earned on the local calendar carries over (the claims do not: the server's tiers may
    // hold other rewards).
    setRemote(r) {
      if (r && r.key) {
        const st = S(), loc = LV.seasonAt(P.now()).key;
        if (!st.ps[r.key] && st.ps[loc] && st.ps[loc].x > 0) { st.ps[r.key] = { x: st.ps[loc].x, f: [], b: [], a: 0, w: st.ps[loc].w | 0 }; commit(); }
      }
      remote = r; refreshStrip(); render(false);
    },
    // what the server is told (pass-net.js sync): this season's progress, the lifetime XP, journey clears, what is worn
    syncState() {
      const st = S(), se = season(), p = sp(st, se);
      // (r: the claimed tiers; f carries the same list for a server from before the one-track pass)
      return { season: se.n, server: !!(remote && se === remote), xp: st.xp, x: p.x, r: p.f.slice(), f: p.f.slice(), b: [], a: p.a | 0, w: p.w | 0,
        jc: Object.assign({}, st.jc), eq: { title: st.eq.title || null, badge: st.eq.badge || null, frame: st.eq.frame || null } };
    },
    // The server's answer (another device may be ahead): the larger of each number, claims joined; the items of tiers
    // claimed elsewhere are owned here too (their boosters and honor were paid on that device)
    mergeServer(me, key) {
      if (!me || typeof me !== 'object') return;
      const st = S(), num0 = (v, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
      const from = LV.levelOf(st.xp);
      st.xp = Math.max(st.xp, num0(me.xp, LV.BASE[LV.MAX] * 4));
      if (me.jc && typeof me.jc === 'object') for (const k of Object.keys(me.jc)) if (chOf(k)) st.jc[k] = Math.max(st.jc[k] | 0, num0(me.jc[k], 9999));
      const se = season();
      if (key && key === se.key) {
        const p = sp(st, se), C = se.C;
        p.x = Math.max(p.x, num0(me.x, 1e7)); p.a = Math.max(p.a | 0, num0(me.a, 999)); p.w = Math.max(p.w | 0, num0(me.w, 60));
        // (the claimed tiers: r; a server from before the one-track pass answers f and b)
        const list = [...(Array.isArray(me.r) ? me.r : []), ...(Array.isArray(me.f) ? me.f : []), ...(Array.isArray(me.b) ? me.b : [])];
        for (const t of list) {
          if (!Number.isInteger(t) || t < 1 || t > C.tiers.length || p.f.includes(t)) continue;
          p.f.push(t);
          const id = C.tiers[t - 1].r, it = LV.item(id);
          if (it && !['boost', 'honor', 'rw'].includes(it.kind) && !st.own.includes(id)) st.own.push(id);
        }
        p.f.sort((q, r) => q - r);
      }
      if (LV.levelOf(st.xp).lv > from.lv) st.seen = Math.max(st.seen, LV.levelOf(st.xp).lv); // (reached on another device)
      commit(); refreshStrip(); render(false);
    },
    // A name plate for the ranked screens (js/ranked.js titlesOf): this player's own (no player_id), or another one's
    // from the server (pass-net.js plates, filled in when it answers). → an element, or null
    plate(o) {
      return safe(() => {
        if (!o || o.guest) return null;
        const el = document.createElement('span');
        el.className = 'rk-tt ps-plate';
        // level, badge, title, and the best journey seal (一 二 三: the most clears of any one ninja)
        const fill = (lv, eq, jc) => {
          const ti = eq && eq.title && LV.item(eq.title), bd = eq && eq.badge && LV.item(eq.badge), fr = eq && eq.frame && LV.item(eq.frame);
          const best = jc && typeof jc === 'object' ? Math.min(3, Math.max(0, ...Object.values(jc).map((v) => v | 0))) : 0;
          el.innerHTML = `<b style="${fr ? '--fc:' + fr.color : ''}">${esc(T().lv)} ${lv | 0}</b>${best ? seal(best) : ''}${bd ? `<i style="color:${bd.color}">${esc(bd.icon)}</i>` : ''}${ti ? `<em style="color:${ti.color}">${esc(itemName(eq.title))}</em>` : ''}`;
        };
        if (o.player_id == null) { const st = S(); fill(LV.levelOf(st.xp).lv, st.eq, st.jc); return el; }
        if (!ND.passNet || !ND.passNet.plate) return null;
        el.hidden = true;
        ND.passNet.plate(o.player_id).then((q) => { if (q) { fill(q.lv, q.eq, q.jc); el.hidden = false; } }, () => {});
        return el;
      }) || null;
    },
    _hookGame: hookGame,
  };
  // arcade.init(G) is where the game hands itself over (game.js boot): install the hooks there
  if (ND.arcade && typeof ND.arcade.init === 'function') {
    const oInit = ND.arcade.init;
    ND.arcade.init = function (G) { const r = oInit.apply(this, arguments); safe(() => hookGame(G)); return r; };
  }
})(window.ND);
