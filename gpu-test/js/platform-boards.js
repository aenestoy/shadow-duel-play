// Shadow Duel — the platforms' own leaderboards (ND.leaderboard.plat), in the portal-only builds (Yandex, Playgama).
//
// Those builds never reach our own leaderboard server (ND.platform.allowNetwork is false there), so their tables stay
// on the device. Where the platform has leaderboards of its own, two of our boards are mirrored onto them
// (platform-boards.json; the ids come through src/portal-bridge.ts NDPortal.boards):
//   'tourney'  each player's best Monthly Tournament run of all time → Hall of Champions "All Time" tab and the menu's
//              Hall of Champions card (the platforms have no monthly reset, so "This Month" stays on the device)
//   'arcade'   each player's best completed Arcade journey → the classic leaderboard's Arcade tab (all ninjas)
// Scores are posted at the moments the online build posts them (ND.leaderboard.submit, from the Arcade ending and the
// tournament result); the local board is always written first, as before. The platform keeps each player's best.
// Yandex: only a signed-in player can post. A guest's best is kept here (save: lb.plat.pend) and posted after they sign
// in, and the sign-in dialog opens only from the "Sign in…" button (the result panel, the Hall's footer): never by
// itself. Playgama's cloud boards take guests' scores too.
// Fallback: whenever the platform cannot answer (no SDK, boards not set up, rate limit with nothing cached, offline,
// sandbox without the boards), the screens show the local board exactly as before, labelled as local. After a failure
// the platform is left alone for a minute.
// Names on the platform boards are the platform's public names: shown as text only, through the nickname filter.
(function (ND) {
  'use strict';
  const LB = ND.leaderboard;
  if (!LB) return;
  const API = () => (ND.portal && ND.portal.boards) || null;
  const HALL = { alltime: 'tourney' }; // Hall of Champions tab → board key
  const CLASSIC = { arcade: 'arcade' }; // classic leaderboard tab (all ninjas) → board key
  const TOP = 20, DOWN_MS = 60000, KEEP_MS = 60000;
  const isChar = (c) => typeof c === 'string' && ND.CHARS.some((x) => x.id === c);
  const num = (v) => (typeof v === 'number' && isFinite(v) && v >= 0 ? Math.floor(v) : null);
  const down = {}; // key → time until which the platform is not asked again (after a failure)
  let answered = false; // the platform answered a board read in this session (a sign-in is only offered then)
  const pages = {}; // key → { t, v: { rows, me, plat: true } | null, busy: Promise | null, err }

  const store = () => {
    let L = null;
    try { L = ND.save && ND.save.lb; } catch (e) { L = null; }
    if (!L) L = store.mem || (store.mem = {});
    if (!L.plat || typeof L.plat !== 'object') L.plat = {};
    if (!L.plat.pend || typeof L.plat.pend !== 'object') L.plat.pend = {};
    return L.plat;
  };
  const commit = () => { try { if (ND.save && ND.save.commit) ND.save.commit(); } catch (e) { /* storage blocked */ } };

  // a platform page → Hall of Champions rows + my standing (same shapes as the local adapter's hall())
  function toHall(page) {
    const rows = (page && Array.isArray(page.entries) ? page.entries : []).map((e) => ({
      key: 'p' + e.rank, uid: null, name: LB.shownName(e.name) || null, dan: 0, score: e.score,
      char: isChar(e.extra) ? e.extra : null, time: null, date: null, me: !!e.me, rank: e.rank,
    }));
    const m = page && page.mine, tenth = rows[9] ? rows[9].score : null;
    const me = m ? { place: m.rank, score: m.score, total: 0, tenth, gap: m.rank <= 10 || tenth == null ? 0 : Math.max(0, tenth - m.score + 1) } : null;
    return { rows, me, mine: m ? { key: 'me', uid: null, name: LB.shownName(m.name) || null, dan: 0, score: m.score, char: isChar(m.extra) ? m.extra : null, time: null, date: null, me: true, rank: m.rank } : null, plat: true };
  }

  const P = LB.plat = {
    // board key of a leaderboard board id ('arcade', 'weekly@2026-10' …), or null
    keyOf(board) {
      if (board === 'arcade') return 'arcade';
      const p = LB.parseBoard(board);
      return p && p.base === 'weekly' ? 'tourney' : null;
    },
    live(key) {
      const A = API();
      return !!key && !!A && A.available(key) && Date.now() >= (down[key] || 0);
    },
    // the platform board behind a Hall tab / a classic tab, when it can be shown now
    hallKey(kind) { const k = HALL[kind]; return k && P.live(k) ? k : null; },
    classicKey(board, char) { const k = !char && CLASSIC[board]; return k && P.live(k) ? k : null; },
    any() { const A = API(); return !!A && A.keys().some((k) => P.live(k)); },
    canSignIn() { const A = API(); return !!A && answered && P.any() && A.canSignIn(); },
    // best scores waiting for a sign-in: { key: score }
    pending() { const p = store().pend, out = {}; for (const k of Object.keys(p)) { const s = num(p[k]); if (s != null && s > 0) out[k] = s; } return out; },

    // read a board (cached a minute here; the adapter caches and rate-limits too). Rejects → caller falls back.
    read(key, fresh) {
      const c = pages[key] || (pages[key] = { t: 0, v: null, busy: null, err: null });
      if (c.busy) return c.busy;
      if (!fresh && c.v && Date.now() - c.t < KEEP_MS) return Promise.resolve(c.v);
      const A = API();
      if (!A || !P.live(key)) return Promise.reject(new Error('unavailable'));
      c.busy = A.top(key, TOP).then((page) => {
        c.v = toHall(page); c.t = Date.now(); c.err = null; c.busy = null; answered = true;
        return c.v;
      }, (e) => {
        c.busy = null; c.err = e || new Error('error');
        // over the rate limit with nothing cached: just this read; anything else: leave the platform alone a minute
        if (!/rate/.test(String(c.err && c.err.message))) down[key] = Date.now() + DOWN_MS;
        throw c.err;
      });
      return c.busy;
    },
    // Hall of Champions: { rows, me, plat: true }
    hall(kind) { const k = HALL[kind]; return k ? P.read(k) : Promise.reject(new Error('unavailable')); },

    // classic leaderboard (render reads synchronously): { rows, loading, error, plat } or null = show the local board
    peek(board) {
      const k = CLASSIC[board], c = k && pages[k];
      if (c && c.v) return { rows: c.v.rows, loading: false, error: null, plat: true };
      if (c && c.err && !c.busy) return null;
      return { rows: [], loading: true, error: null, plat: true };
    },
    watch(board) {
      const k = CLASSIC[board];
      if (!k) return Promise.resolve([]);
      return P.read(k).then((v) => { LB._touch(); return v.rows; }, () => { LB._touch(); return []; });
    },
    mine(board) { const k = CLASSIC[board], c = k && pages[k]; return c && c.v ? c.v.mine : null; },

    // post a score (after the local board has it). → { ok, key, rank? } | { ok: false, key, reason: 'signin' | … } | null
    async submit(board, e) {
      const key = P.keyOf(board), A = API();
      if (!key || !A || !A.available(key)) return null;
      const s = num(e && e.score);
      if (!s) return null;
      if (!A.canSubmit(key)) {
        // a guest (Yandex): keep the best until they sign in
        const pend = store().pend;
        if (!(num(pend[key]) >= s)) { pend[key] = s; commit(); }
        return { ok: false, key, reason: A.canSignIn() ? 'signin' : 'unavailable' };
      }
      const r = await A.submit(key, s, isChar(e.char) ? e.char : '');
      if (!r || !r.ok) return { ok: false, key, reason: (r && r.reason) || 'error' };
      const pend = store().pend;
      if (num(pend[key]) != null && pend[key] <= s) { delete pend[key]; commit(); }
      let rank = null;
      try { const v = await P.read(key, true); rank = v.me ? v.me.place : null; } catch (er) { rank = null; }
      LB.hallClear(); LB._touch();
      return { ok: true, key, rank };
    },
    // post the bests kept for a guest (after a sign-in)
    async flush() {
      const A = API(), pend = P.pending();
      if (!A) return;
      for (const key of Object.keys(pend)) {
        if (!A.canSubmit(key)) continue;
        const r = await A.submit(key, pend[key], '');
        if (r && r.ok) { const p = store().pend; if (num(p[key]) != null && p[key] <= pend[key]) delete p[key]; commit(); }
      }
      for (const k of Object.keys(pages)) pages[k].t = 0;
      LB.hallClear(); LB._touch();
    },
    // the "Sign in…" button: the platform's own dialog (only from this button), then the waiting bests go up
    async signIn() {
      const A = API();
      if (!A || !A.canSignIn()) return false;
      const ok = await A.signIn();
      if (ok) {
        await P.flush();
        // a signed-in player has their own cloud save: take it if it is newer (js/arcade.js syncPortal)
        try { if (ND.save && ND.save.syncPortal) ND.save.syncPortal(); } catch (e) { /* local save stays */ }
      }
      LB._touch();
      return ok;
    },
    // a small "Sign in…" button (result panel, Hall footer); null when there is nothing to sign in for
    signInButton(after) {
      if (!P.canSignIn()) return null;
      const T = (ND.STR && ND.STR.lb) || {};
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mini plat-signin'; b.textContent = T.platSignIn || '';
      b.onclick = (ev) => {
        if (ev) ev.stopPropagation();
        if (ND.audio && ND.audio.ui) { try { ND.audio.ui(); } catch (er) { /* no audio */ } }
        b.disabled = true;
        P.signIn().then((ok) => { b.disabled = false; if (ok) b.remove(); if (after) after(ok); });
      };
      return b;
    },
    _reset() { for (const k of Object.keys(pages)) delete pages[k]; for (const k of Object.keys(down)) delete down[k]; answered = false; },
  };
  // the menu card and the Hall were drawn before the SDK answered: once it has, draw them again from the platform
  if (ND.portal && ND.portal.ready) ND.portal.ready.then(() => { if (P.any()) { LB.hallClear(); LB._touch(); } }, () => {});
})(window.ND);
