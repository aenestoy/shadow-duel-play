// Shadow Duel — privacy notice and links (ND.privacy)
// The privacy policy and terms of use are a static page shipped with the game (public/privacy.html → dist/privacy.html
// and dist-artifact/privacy.html). It is opened with a RELATIVE url in a new tab (target _blank, rel noopener), so it
// stays on the portal's own domain. The page is English + Turkish: Turkish players land on the Turkish part (#tr).
//   link(kind)  → <a> to the page: 'policy' | 'terms' | 'both' ("Privacy Policy & Terms"); text and address follow the
//                 language. Used in Settings → Progress (#setLegal), under the nickname form (leaderboard.js nickForm)
//                 and in the notice below.
//   notice      the first time the game is connected to our leaderboard server (ND.leaderboard on Supabase, status
//               'online': from then on a nickname, scores or a CrazyGames account can reach it), a small non-blocking
//               card at the bottom: "Shadow Duel saves your nickname and scores for the online leaderboards.
//               Privacy Policy · Terms [OK]". Never over a live fight (hidden while one runs, back after). OK is kept in
//               the progress save (ND.save.p.privacy = NOTICE_V), so it follows the portal's cloud save too. Where the
//               game never goes online (Poki, Yandex, offline, ?net=0) there is nothing to tell and the card never shows.
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
  let el = null, timer = 0, done = false;
  function seen() { try { return !!(ND.save && ND.save.p && ND.save.p.privacy >= NOTICE_V); } catch (e) { return false; } }
  // our own server, reachable: only then can a nickname, a score or a CrazyGames account be saved there
  function online() { const LB = ND.leaderboard; return !!LB && LB.online && LB.status === 'online' && /^supabase/.test(String(LB.mode || '')); }
  // a live fight (not the menu's attract fight, not paused): the card waits
  function busy() {
    const G = ND.game, app = document.getElementById('app');
    if (app && app.classList.contains('t-editing')) return true;
    return !!G && G.mode !== 'attract' && !G.paused && ['intro', 'fight', 'ko', 'timeup', 'replay'].includes(G.phase);
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
  }
  function update() {
    if (done || seen()) { if (el) { el.remove(); el = null; } if (timer) { clearInterval(timer); timer = 0; } done = true; return; }
    if (!online()) { if (el) el.hidden = true; return; }
    const n = build();
    if (n) n.hidden = busy();
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
    update();
  }

  ND.privacy = {
    NOTICE_V, url, link, update,
    get allowed() { return allowed(); },
    get seen() { return seen(); },
    get showing() { return !!el && !el.hidden; },
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);
})(window.ND);
