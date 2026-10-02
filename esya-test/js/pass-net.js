// Shadow Duel — the level and the Shadow Pass with the server (ND.passNet; supabase/pass.sql). Online build only:
// index.html data-online, left out of the Yandex / Playgama packages (they keep the local calendar and save).
//
// - The season: its number, end and content (tiers, rewards, XP multipliers) come from the server (nd_pass_sync), so a
//   new season needs no game update. Kept on this device (until it ends) and used at once on the next launch; until
//   the server answers, or when it never does, js/pass.js runs on its local calendar.
// - A player with an online identity (CrazyGames account, or our site's nickname) has the level, the pass progress,
//   the journey clears and what they wear kept on the server: sent after changes (at most once a minute, plus at once
//   after claiming a catalog reward, opening the pass screen, and leaving the page), merged back (another device may
//   be ahead). The server limits how fast XP may grow and grants the catalog rewards ('rw:<id>') of claimed tiers.
// - Name plates on the ranked screens: another player's level and what they wear (nd_pass_plates), cached a while.
// A server without pass.sql (404) is not asked again for 6 hours. Never throws; the game never waits for it.
(function (ND) {
  'use strict';
  const P = ND.pass, LV = ND.LEVEL;
  if (!P || !LV || !(ND.platform || {}).allowNetwork) return;
  const LS = 'golge-duellosu-pass-season', LS_OFF = 'golge-duellosu-pass-off';
  const MIN_GAP = 60000, PLATE_TTL = 10 * 60000;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
  };
  const LB = () => ND.leaderboard;
  const adapter = () => { const L = LB(); const a = L && L.adapter; return a && a.name === 'supabase' && typeof a.rpc === 'function' ? a : null; };
  async function call(fn, args, ms) {
    const a = adapter();
    if (!a) throw Object.assign(new Error('network'), { code: 'network' });
    if (a.authed) return a.authed(fn, (k) => Object.assign({ p_secret: k }, args || {}), ms || 9000);
    return a.rpc(fn, Object.assign({ p_secret: a.key() }, args || {}), ms || 9000);
  }
  const num = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : null);

  // ---------------------------------------------------------------- the season from the server
  let season = null, guest = true, enabled = true;
  function apply(s, content) {
    const id = num(s && s.id, 1, 100000), start = num(s && s.start, 0, 1e14), end = num(s && s.end, 0, 1e14);
    if (!id || start == null || !end || end <= start) return false;
    const C = (content && LV.cleanSeason(content)) || P.defaultSeason;
    season = { key: 'S' + id, n: id, start, end, C, server: true };
    P.setRemote(season);
    return true;
  }
  (function boot() {
    let c = null;
    try { c = JSON.parse(store.get(LS) || 'null'); } catch (e) { c = null; }
    if (c && c.season && c.season.end > Date.now()) apply(c.season, c.content);
  })();

  // ---------------------------------------------------------------- sync
  let busy = null, lastAt = 0, timer = 0, offUntil = +(store.get(LS_OFF) || 0) || 0;
  async function sync() {
    if (busy) return busy;
    if (Date.now() < offUntil) return null;
    busy = (async () => {
      try {
        const L = LB();
        if (!L) return null;
        await L.whenSettled(8000);
        if (!adapter()) return null;
        const st = P.syncState();
        const r = await call('nd_pass_sync', { p_state: Object.assign({}, st, { season: season ? season.n : null }) }, 9000);
        lastAt = Date.now();
        if (!r || r.ok !== true) return null;
        enabled = r.enabled !== false;
        guest = r.guest !== false;
        if (r.season) {
          const fresh = !season || season.n !== r.season.id;
          if (apply(r.season, r.content)) store.set(LS, JSON.stringify({ season: r.season, content: r.content || null, t: Date.now() }));
          if (fresh && !guest) { setTimeout(() => sync(), 6000); } // (the first answer told us the season: send its progress)
        }
        if (r.me && season) {
          P.mergeServer(r.me, season.key);
          // catalog rewards the server granted: the costume / title list of js/rewards.js
          const a = adapter();
          if (Array.isArray(r.me.owned) && ND.rewards && ND.rewards.setOwned && a && a.pid) ND.rewards.setOwned(a.pid, r.me.owned);
        }
        return r;
      } catch (e) {
        lastAt = Date.now();
        if (e && e.code === 'not_setup') { offUntil = Date.now() + 6 * 3600e3; store.set(LS_OFF, String(offUntil)); }
        return null;
      } finally { setTimeout(() => { busy = null; }, 0); }
    })();
    return busy;
  }
  // after a change: soon, at most once a minute
  function soon() {
    if (timer) return;
    const wait = Math.max(3000, MIN_GAP - (Date.now() - lastAt));
    timer = setTimeout(() => { timer = 0; sync(); }, wait);
  }
  function now() { clearTimeout(timer); timer = 0; return Date.now() - lastAt < 6000 ? new Promise((r) => setTimeout(() => r(sync()), 6000 - (Date.now() - lastAt))) : sync(); }

  // ---------------------------------------------------------------- name plates
  const plates = new Map();
  let plateQ = null;
  function plate(pid) {
    pid = Math.round(+pid);
    if (!(pid > 0)) return Promise.resolve(null);
    const c = plates.get(pid);
    if (c && Date.now() - c.t < PLATE_TTL) return c.p;
    const p = (async () => {
      const a = adapter();
      if (!a) return null;
      // (the opponents of one screen in one request)
      if (!plateQ) {
        plateQ = { ids: new Set(), p: null };
        plateQ.p = new Promise((res) => setTimeout(async () => {
          const ids = [...plateQ.ids].slice(0, 4); plateQ = null;
          try { res(await a.rpc('nd_pass_plates', { p_ids: ids }, 8000)); } catch (e) { res(null); }
        }, 50));
      }
      plateQ.ids.add(pid);
      const list = await plateQ.p;
      const row = Array.isArray(list) ? list.find((x) => x && x.player_id === pid) : null;
      return row ? { lv: num(row.lv, 1, 100) || 1, eq: row.eq && typeof row.eq === 'object' ? row.eq : {}, jc: row.jc && typeof row.jc === 'object' ? row.jc : {} } : null;
    })();
    plates.set(pid, { t: Date.now(), p });
    return p;
  }

  ND.passNet = {
    sync, soon, now, plate,
    // a catalog reward can be claimed: the server's season is in use and this player has an online identity
    canGrant: () => !!season && !guest && enabled && !!adapter(),
    state: () => ({ season: season && { key: season.key, end: season.end }, guest, enabled, lastAt, off: Date.now() < offUntil }),
  };
  // boot: after the leaderboard knows its server, without waiting; the pass screen opening asks again
  setTimeout(() => { sync(); }, 0);
  const oOpen = P.open;
  P.open = function () { const r = oOpen.apply(this, arguments); if (Date.now() - lastAt > 15000) now(); return r; };
  try {
    window.addEventListener('pagehide', () => { if (timer) { clearTimeout(timer); timer = 0; sync(); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden && timer) { clearTimeout(timer); timer = 0; sync(); } });
  } catch (e) { /* no DOM */ }
})(window.ND);
