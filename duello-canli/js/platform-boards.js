
















(function (ND) {
  'use strict';
  const LB = ND.leaderboard;
  if (!LB) return;
  const API = () => (ND.portal && ND.portal.boards) || null;
  const HALL = { alltime: 'tourney' };
  const CLASSIC = { arcade: 'arcade' };
  const TOP = 20, DOWN_MS = 60000, KEEP_MS = 60000;
  const isChar = (c) => typeof c === 'string' && ND.CHARS.some((x) => x.id === c);
  const num = (v) => (typeof v === 'number' && isFinite(v) && v >= 0 ? Math.floor(v) : null);
  const down = {};
  let answered = false;
  const pages = {};

  const store = () => {
    let L = null;
    try { L = ND.save && ND.save.lb; } catch (e) { L = null; }
    if (!L) L = store.mem || (store.mem = {});
    if (!L.plat || typeof L.plat !== 'object') L.plat = {};
    if (!L.plat.pend || typeof L.plat.pend !== 'object') L.plat.pend = {};
    return L.plat;
  };
  const commit = () => { try { if (ND.save && ND.save.commit) ND.save.commit(); } catch (e) {                       } };


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

    keyOf(board) {
      if (board === 'arcade') return 'arcade';
      const p = LB.parseBoard(board);
      return p && p.base === 'weekly' ? 'tourney' : null;
    },
    live(key) {
      const A = API();
      return !!key && !!A && A.available(key) && Date.now() >= (down[key] || 0);
    },

    hallKey(kind) { const k = HALL[kind]; return k && P.live(k) ? k : null; },
    classicKey(board, char) { const k = !char && CLASSIC[board]; return k && P.live(k) ? k : null; },
    any() { const A = API(); return !!A && A.keys().some((k) => P.live(k)); },
    canSignIn() { const A = API(); return !!A && answered && P.any() && A.canSignIn(); },

    pending() { const p = store().pend, out = {}; for (const k of Object.keys(p)) { const s = num(p[k]); if (s != null && s > 0) out[k] = s; } return out; },


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

        if (!/rate/.test(String(c.err && c.err.message))) down[key] = Date.now() + DOWN_MS;
        throw c.err;
      });
      return c.busy;
    },

    hall(kind) { const k = HALL[kind]; return k ? P.read(k) : Promise.reject(new Error('unavailable')); },


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


    async submit(board, e) {
      const key = P.keyOf(board), A = API();
      if (!key || !A || !A.available(key)) return null;
      const s = num(e && e.score);
      if (!s) return null;
      if (!A.canSubmit(key)) {

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

    async signIn() {
      const A = API();
      if (!A || !A.canSignIn()) return false;
      const ok = await A.signIn();
      if (ok) {
        await P.flush();

        try { if (ND.save && ND.save.syncPortal) ND.save.syncPortal(); } catch (e) {                        }
      }
      LB._touch();
      return ok;
    },

    signInButton(after) {
      if (!P.canSignIn()) return null;
      const T = (ND.STR && ND.STR.lb) || {};
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mini plat-signin'; b.textContent = T.platSignIn || '';
      b.onclick = (ev) => {
        if (ev) ev.stopPropagation();
        if (ND.audio && ND.audio.ui) { try { ND.audio.ui(); } catch (er) {                } }
        b.disabled = true;
        P.signIn().then((ok) => { b.disabled = false; if (ok) b.remove(); if (after) after(ok); });
      };
      return b;
    },
    _reset() { for (const k of Object.keys(pages)) delete pages[k]; for (const k of Object.keys(down)) delete down[k]; answered = false; },
  };

  if (ND.portal && ND.portal.ready) ND.portal.ready.then(() => { if (P.any()) { LB.hallClear(); LB._touch(); } }, () => {});
})(window.ND);
