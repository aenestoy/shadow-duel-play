// Shadow Duel — owner's showcase mode ("vitrin"), claude/sd-vitrin only: never merged, never shipped to a portal.
// Opening the game with #vitrin (or from a /vitrin/ folder) on the local portal (our own preview site, localhost) makes
// everything available on that device so every 1.3.1 feature can be tried at once:
//   - every fighter and arena; level ~40; the Shadow Pass at its last tier with every reward claimed (one track);
//   - every costume (each ninja's own), blade trail, title, badge and frame of the pass owned; every ninja's journey cleared 3 times
//     (Menkyo + Kaiden costumes and titles, the 一 二 三 seals); Legacy and Champion colours on every ninja;
//   - the ranked Season Champion costume (reward catalog 'costume_champion_s1', builtin 'champion') seeded locally.
// Safety: the showcase never talks to our servers about the player. Its saves live under their own storage keys
// ('vitrin:' prefix: the real save on the same site is neither read nor written), ND.platform.allowNetwork is false
// (no leaderboard, pass sync, reward catalog, online or ranked requests) and studio statistics / error reports are not
// started (src/studio-stats.ts checks ND.vitrin.on). A small "VİTRİN · SHOWCASE" mark stays on screen.
// Loaded right after js/core.js (it needs ND.portalName, and must swap storage before js/arcade.js reads it); the
// grant itself runs from js/game.js boot, once the save, the level rules and the pass exist (ND.vitrin.grant).
(function (ND) {
  'use strict';
  let on = false;
  try {
    on = ND.portalName === 'local' && (/^#vitrin$/i.test(location.hash || '') || /\/vitrin\//i.test(location.pathname || ''));
  } catch (e) { on = false; }
  ND.vitrin = { on, grant() {} };
  if (!on) return;

  // ---------------------------------------------------------------- storage of its own
  const PFX = 'vitrin:';
  const real = (() => { try { const s = window.localStorage, k = '__nd_vt'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e) { return null; } })();
  const mem = new Map();
  const keys = () => {
    if (!real) return [...mem.keys()];
    const out = [];
    try { for (let i = 0; i < real.length; i++) { const k = real.key(i); if (k && k.startsWith(PFX)) out.push(k); } } catch (e) { /* storage blocked */ }
    return out;
  };
  const store = {
    getItem(k) { k = PFX + k; if (real) { try { return real.getItem(k); } catch (e) { /* fall back */ } } return mem.has(k) ? mem.get(k) : null; },
    setItem(k, v) { k = PFX + k; v = String(v); mem.set(k, v); if (real) { try { real.setItem(k, v); } catch (e) { /* quota */ } } },
    removeItem(k) { k = PFX + k; mem.delete(k); if (real) { try { real.removeItem(k); } catch (e) { /* storage blocked */ } } },
    clear() { for (const k of keys()) { mem.delete(k); if (real) { try { real.removeItem(k); } catch (e) { /* storage blocked */ } } } },
    key(i) { const k = keys()[i]; return k === undefined ? null : k.slice(PFX.length); },
    get length() { return keys().length; },
  };
  try { Object.defineProperty(window, 'localStorage', { configurable: true, enumerable: true, get: () => store }); } catch (e) { /* refused */ }
  // (if the browser refused the swap the grant would land in the owner's real save: then no showcase at all)
  const swapped = (() => { try { return window.localStorage === store; } catch (e) { return false; } })();
  if (!swapped) { ND.vitrin.on = false; return; }

  // ---------------------------------------------------------------- no servers
  // js/leaderboard.js: Object.assign(detectPlatform(), ND.platform) → this wins; every network feature reads it
  ND.platform = Object.assign({}, ND.platform || {}, { allowNetwork: false });

  // ---------------------------------------------------------------- the ranked reward catalog, on this device
  // js/rewards.js reads its last good catalog and the owned list from storage at load (the server is never asked
  // here). The same entries as supabase/ranked.sql seeds.
  const N = (en, tr, es, pt, ru, de, fr) => ({ en, tr, es, pt, ru, de, fr });
  const CAT = [
    { id: 'costume_champion_s1', kind: 'costume', names: N('Season Champion Costume', 'Sezon Şampiyonu Kostümü', 'Traje de campeón de temporada', 'Traje de campeão da temporada', 'Костюм чемпиона сезона', 'Saisonchampion-Kostüm', 'Costume de champion de saison'), data: { v: 1, base: 'col', builtin: 'champion' } },
    { id: 'title_season_champion', kind: 'title', names: N('Season Champion', 'Sezon Şampiyonu', 'Campeón de temporada', 'Campeão da temporada', 'Чемпион сезона', 'Saisonchampion', 'Champion de saison'), data: { v: 1, color: '#ffd35a', icon: '将' } },
  ];
  try {
    store.setItem('golge-duellosu-rewards', JSON.stringify({ t: Date.now(), list: CAT }));
    store.setItem('golge-duellosu-rewards-own', JSON.stringify({ pid: null, ids: CAT.map((e) => e.id) }));
  } catch (e) { /* storage blocked */ }

  // ---------------------------------------------------------------- the mark
  function mark() {
    try {
      if (document.getElementById('vitrinMark')) return;
      const el = document.createElement('div');
      el.id = 'vitrinMark';
      el.setAttribute('aria-hidden', 'true');
      el.textContent = 'VİTRİN · SHOWCASE';
      // (a narrow upright tab on the left edge, in the screens' side margin: it covers no button or text; taps pass through)
      el.style.cssText = 'position:fixed;left:env(safe-area-inset-left,0px);top:50%;transform:translateY(-50%) rotate(180deg);writing-mode:vertical-rl;z-index:2147483000;' +
        'pointer-events:none;padding:8px 1px;background:rgba(150,20,30,.85);border:1px solid #ff8a6a;border-right:0;color:#fff3e2;' +
        'font:700 9px/1.2 Oswald,system-ui,sans-serif;letter-spacing:.16em;white-space:nowrap;box-shadow:0 0 8px rgba(0,0,0,.6)';
      (document.getElementById('app') || document.body).appendChild(el);
    } catch (e) { /* no DOM */ }
  }
  if (document.body) mark(); else document.addEventListener('DOMContentLoaded', mark);
  window.addEventListener('load', mark);
  try { document.title = 'VİTRİN · ' + document.title; } catch (e) { /* no title */ }

  // ---------------------------------------------------------------- everything, on every load (idempotent)
  const FIRST = 'golge-duellosu-vitrin';
  const DEFAULT_EQ = { title: 'title_nightblade', badge: 'badge_kage', frame: 'frame_gold', trail: 'trail_violet' };
  ND.vitrin.grant = function () {
    try {
      const S = ND.save, LV = ND.LEVEL, P = ND.pass, CH = ND.CHARS || [];
      if (!S || !S.p) return;
      const ids = CH.map((c) => c.id), first = !store.getItem(FIRST);
      S.transaction(() => {
        const p = S.p;
        S.unlockAll();
        // straight to the menu (no first screen, no new-player path, no tips)
        p.firstDone = true; p.fought = true; p.coached = true; p.selIntro = true; p.tutorial = true;
        p.tips = { n: 999, seen: { ki: 1, gbreak: 1, posture: 1, dash: 1, shuriken: 1, heavy: 1, lessons: 1, controls: 1 } };
        // every journey cleared and mastered (Legacy colours), Champion colours (monthly tournament) on every ninja
        const J = p.journey;
        for (const id of ids) { J.cleared[id] = true; J.stars[id] = 255; J.mastered[id] = true; }
        p.lb.champ = ids.slice(); p.lb.champSeen = ids.slice();
        if (!p.lb.title) { p.lb.title = { place: 1, wins: 1, podiums: 1 }; p.lb.titleSeen = 1; }
        if (!LV || !P || !P.state) return;
        const st = P.state();
        // level ~40 (a third of the way to 41)
        const xp40 = LV.BASE[40] + Math.round(LV.need(40) / 3);
        if (st.xp < xp40) st.xp = xp40;
        st.seen = Math.max(st.seen | 0, LV.levelOf(st.xp).lv);
        // this season: the last tier, every reward claimed (one track: one reward per tier)
        const se = P.season(), C = se.C, ps = st.ps[se.key] || (st.ps[se.key] = { x: 0, f: [], b: [], a: 0, w: 0 });
        ps.x = Math.max(ps.x, LV.tierXp(C, C.tiers.length));
        ps.f = C.tiers.map((t, i) => (t.r ? i + 1 : 0)).filter(Boolean);
        ps.b = [];
        // every costume, trail, title, badge and frame; each ninja's Menkyo and Kaiden costume and title
        const all = Object.keys(LV.ITEMS).filter((k) => ['cos', 'trail', 'title', 'badge', 'frame'].includes(LV.ITEMS[k].kind));
        for (const id of ids) all.push('jc2_' + id, 'jc3_' + id, 'jt2_' + id, 'jt3_' + id);
        for (const k of all) if (LV.item(k) && !st.own.includes(k)) st.own.push(k);
        for (const id of ids) st.jc[id] = Math.max(st.jc[id] | 0, 3);
        st.mig = 1;
        if (first) st.eq = Object.assign({}, DEFAULT_EQ);
      });
      S.commit();
      if (first) store.setItem(FIRST, '1');
    } catch (e) { console.warn('[vitrin]', e); }
  };
})(window.ND);
