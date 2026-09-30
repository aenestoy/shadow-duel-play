// Shadow Duel — privacy notice and links (ND.privacy)
// The privacy policy and terms of use are a static page shipped with the game (public/privacy.html → dist/privacy.html
// and dist-artifact/privacy.html). It is opened with a RELATIVE url in a new tab (target _blank, rel noopener), so it
// stays on the portal's own domain. The page is English + Turkish: Turkish players land on the Turkish part (#tr).
//   link(kind)  → <a> to the page: 'policy' | 'terms' | 'both' ("Privacy Policy & Terms"); text and address follow the
//                 language. Used in Settings → Progress (#setLegal), under the nickname form (leaderboard.js nickForm)
//                 and in the notice below.
//   notice      the first time the game is connected to our leaderboard server (ND.leaderboard on Supabase, status
//               'online': from then on a nickname, scores or a CrazyGames account can reach it), a small non-blocking
//               card in a corner: "Shadow Duel saves your nickname and scores for the online leaderboards.
//               Privacy Policy · Terms [OK]". It never covers a button: it takes the first corner (bottom left, bottom
//               right, top left, top right) where it overlaps no button or link of the screen under it, and waits
//               while there is none. Never over a live fight (hidden while one runs, back after). A new player's first
//               fight comes first: the card waits until a fight has been played to its end (ND.save.p.fought).
//               Guarantee: before anything is sent to the server (a score, a Dan rank, a nickname, a CrazyGames account
//               link: js/leaderboard.js calls beforeSend()), the card is on screen, whatever the screen or the wait.
//               OK is kept in the progress save (ND.save.p.privacy = NOTICE_V), so it follows the portal's cloud save
//               too. Where the game never goes online (Poki, Yandex, offline, ?net=0) there is nothing to tell and the
//               card never shows.
//   Yandex Games forbids links out of the game (rule 8.4), so do Playgama and most of its partner sites: there neither the
//   links nor the card exist (ND.linksAllowed).
// Texts: ND.STR.priv (Turkish source in i18n.js, other languages block "PRIVACY" in js/i18n-*.js).
(function (ND) {
  'use strict';
  const PAGE = 'privacy.html';
  const NOTICE_V = 1; // raise when the notice must be shown again (the data the game sends changes)
  const S = () => (ND.STR && ND.STR.priv) || {};
  const isTr = () => !!ND.i18n && ND.i18n.lang === 'tr';

  function url(kind) {
    if (isTr()) return PAGE + (kind === 'terms' ? '#tr-terms' : '#tr');
    return PAGE + (kind === 'terms' ? '#terms' : '');
  }
  const label = (kind) => { const T = S(); return (kind === 'terms' ? T.terms : kind === 'policy' ? T.policy : T.both) || ''; };
  const stop = (e) => e.stopPropagation(); // the game behind never reacts to a press on a link
  function link(kind) {
    kind = kind === 'policy' || kind === 'terms' ? kind : 'both';
    const a = document.createElement('a');
    a.className = 'priv-link';
    a.dataset.priv = kind;
    a.href = url(kind);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = label(kind);
    a.setAttribute('data-i18n-skip', '');
    a.addEventListener('click', stop);
    a.addEventListener('pointerdown', stop);
    a.addEventListener('keydown', stop);
    return a;
  }
  // after a language change: every link on screen gets the new text and address
  function relabel() {
    document.querySelectorAll('a[data-priv]').forEach((a) => { a.href = url(a.dataset.priv); a.textContent = label(a.dataset.priv); });
    if (el) { const t = el.querySelector('.pn-text'), ok = el.querySelector('.pn-ok'); if (t) t.textContent = S().notice || ''; if (ok) ok.textContent = S().ok || 'OK'; el.setAttribute('aria-label', S().label || ''); }
  }

  // ---------------------------------------------------------------- notice
  let el = null, timer = 0, done = false, forced = false, shown = false, watch = null, raf = 0;
  function seen() { try { return !!(ND.save && ND.save.p && ND.save.p.privacy >= NOTICE_V); } catch (e) { return false; } }
  // our own server, reachable: only then can a nickname, a score or a CrazyGames account be saved there
  function online() { const LB = ND.leaderboard; return !!LB && LB.online && LB.status === 'online' && /^supabase/.test(String(LB.mode || '')); }
  // a live fight (not the menu's attract fight, not paused): the card waits
  function busy() {
    const G = ND.game, app = document.getElementById('app');
    if (app && app.classList.contains('t-editing')) return true;
    return !!G && G.mode !== 'attract' && !G.paused && ['intro', 'fight', 'ko', 'timeup', 'replay'].includes(G.phase);
  }
  // the new player's first fight is not interrupted: until a fight has been played to its end the card waits
  function deferred() { try { const p = ND.save && ND.save.p; return !!p && p.fought === false; } catch (e) { return false; } }
  // Corners, in order; the card takes the first one where it covers no button, link or field of the screen under it.
  const SPOTS = ['bl', 'br', 'tl', 'tr'];
  function covers(n) {
    const r = n.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    for (const b of document.querySelectorAll('button, a[href], [role="button"], input, select, textarea')) {
      if (n.contains(b)) continue;
      const q = b.getBoundingClientRect();
      if (q.width < 1 || q.height < 1) continue;
      if (q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top) return true;
    }
    return false;
  }
  function place(n, force) {
    for (const s of SPOTS) { n.dataset.spot = s; if (!covers(n)) return true; }
    n.dataset.spot = SPOTS[0];
    return !!force; // before data goes online it shows even so (bottom left)
  }
  function build() {
    if (el) return el;
    const app = document.getElementById('app');
    if (!app) return null;
    el = document.createElement('div');
    el.id = 'privNote'; el.className = 'priv-note'; el.hidden = true;
    el.setAttribute('role', 'region'); el.setAttribute('aria-label', S().label || ''); el.setAttribute('data-i18n-skip', '');
    const p = document.createElement('p'); p.className = 'pn-text'; p.setAttribute('role', 'status'); p.textContent = S().notice || '';
    const row = document.createElement('div'); row.className = 'pn-row';
    const dot = document.createElement('span'); dot.className = 'pn-dot'; dot.textContent = '·'; dot.setAttribute('aria-hidden', 'true');
    const ok = document.createElement('button'); ok.type = 'button'; ok.className = 'mini pn-ok'; ok.textContent = S().ok || 'OK';
    ok.onclick = (e) => { e.stopPropagation(); try { if (ND.audio && ND.audio.ready) ND.audio.ui(); } catch (er) { /* no audio */ } dismiss(); };
    row.append(link('policy'), dot, link('terms'), ok);
    el.append(p, row);
    ['click', 'pointerdown', 'pointerup', 'touchstart', 'keydown'].forEach((t) => el.addEventListener(t, stop));
    app.appendChild(el);
    return el;
  }
  function dismiss() {
    try { if (ND.save && ND.save.p) { ND.save.p.privacy = NOTICE_V; ND.save.commit(); } } catch (e) { /* storage blocked: gone for this session */ }
    done = true;
    if (el) { el.remove(); el = null; }
    if (timer) { clearInterval(timer); timer = 0; }
    unwatch();
  }
  function update() {
    if (done || seen()) { if (el) { el.remove(); el = null; } if (timer) { clearInterval(timer); timer = 0; } unwatch(); done = true; return; }
    if (!forced && (!online() || deferred() || busy())) { if (el && !el.hidden) el.hidden = true; return; }
    const n = build();
    if (!n) return;
    n.hidden = false;
    if (!place(n, forced)) { n.hidden = true; return; }
    shown = true;
  }
  // a screen appearing or going (an overlay's, the HUD's or a button's hidden attribute) places the card again at
  // once, in the next frame, so it never sits over the new screen's buttons until the next 1-second check
  function watchScreens() {
    if (watch || typeof MutationObserver === 'undefined') return;
    const root = document.getElementById('app') || document.body;
    if (!root) return;
    watch = new MutationObserver((recs) => {
      if (raf || !recs.some((r) => !el || (r.target !== el && !el.contains(r.target)))) return;
      raf = requestAnimationFrame(() => { raf = 0; update(); });
    });
    watch.observe(root, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  }
  function unwatch() { if (watch) { watch.disconnect(); watch = null; } if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  // js/leaderboard.js, right before something is sent to our server: the notice must have been on screen. Shows it
  // now if it has not been seen (and keeps it up until OK), then lets the send go on.
  function beforeSend() {
    if (done || seen() || !allowed()) return true;
    forced = true;
    update();
    if (!timer) timer = setInterval(update, 1000);
    watchScreens();
    return true;
  }

  // Portals that forbid links out of the game (Yandex, see ND.linksAllowed in core.js) get neither links nor the notice
  const allowed = () => !ND.linksAllowed || ND.linksAllowed();
  function start() {
    if (!allowed()) { done = true; return; }
    const box = document.getElementById('setLegal');
    if (box && !box.querySelector('a[data-priv]')) box.appendChild(link('both'));
    if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(relabel);
    if (seen()) { done = true; return; }
    if (ND.leaderboard && ND.leaderboard.onChange) ND.leaderboard.onChange(update);
    timer = setInterval(update, 1000); // follows fights starting and ending; stops once the notice is dismissed
    watchScreens();
    update();
  }

  ND.privacy = {
    NOTICE_V, url, link, update, beforeSend,
    get shownOnce() { return shown; },
    get allowed() { return allowed(); },
    get seen() { return seen(); },
    get showing() { return !!el && !el.hidden; },
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);
})(window.ND);
