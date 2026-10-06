





















(function (ND) {
  'use strict';
  const PAGE = 'privacy.html';
  const NOTICE_V = 1;
  const S = () => (ND.STR && ND.STR.priv) || {};
  const isTr = () => !!ND.i18n && ND.i18n.lang === 'tr';

  function url(kind) {
    if (isTr()) return PAGE + (kind === 'terms' ? '#tr-terms' : '#tr');
    return PAGE + (kind === 'terms' ? '#terms' : '');
  }
  const label = (kind) => { const T = S(); return (kind === 'terms' ? T.terms : kind === 'policy' ? T.policy : T.both) || ''; };
  const stop = (e) => e.stopPropagation();
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

  function relabel() {
    document.querySelectorAll('a[data-priv]').forEach((a) => { a.href = url(a.dataset.priv); a.textContent = label(a.dataset.priv); });
    if (el) { const t = el.querySelector('.pn-text'), ok = el.querySelector('.pn-ok'); if (t) t.textContent = S().notice || ''; if (ok) ok.textContent = S().ok || 'OK'; el.setAttribute('aria-label', S().label || ''); }
  }


  let el = null, timer = 0, done = false, forced = false, shown = false, watch = null, raf = 0;
  function seen() { try { return !!(ND.save && ND.save.p && ND.save.p.privacy >= NOTICE_V); } catch (e) { return false; } }

  function online() { const LB = ND.leaderboard; return !!LB && LB.online && LB.status === 'online' && /^supabase/.test(String(LB.mode || '')); }

  function busy() {
    const G = ND.game, app = document.getElementById('app');
    if (app && app.classList.contains('t-editing')) return true;
    return !!G && G.mode !== 'attract' && !G.paused && ['intro', 'fight', 'ko', 'timeup', 'replay'].includes(G.phase);
  }

  function deferred() { try { const p = ND.save && ND.save.p; return !!p && p.fought === false; } catch (e) { return false; } }

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
    return !!force;
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
    ok.onclick = (e) => { e.stopPropagation(); try { if (ND.audio && ND.audio.ready) ND.audio.ui(); } catch (er) {                } dismiss(); };
    row.append(link('policy'), dot, link('terms'), ok);
    el.append(p, row);
    ['click', 'pointerdown', 'pointerup', 'touchstart', 'keydown'].forEach((t) => el.addEventListener(t, stop));
    app.appendChild(el);
    return el;
  }
  function dismiss() {
    try { if (ND.save && ND.save.p) { ND.save.p.privacy = NOTICE_V; ND.save.commit(); } } catch (e) {                                              }
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


  function beforeSend() {
    if (done || seen() || !allowed()) return true;
    forced = true;
    update();
    if (!timer) timer = setInterval(update, 1000);
    watchScreens();
    return true;
  }


  const allowed = () => !ND.linksAllowed || ND.linksAllowed();
  function start() {
    if (!allowed()) { done = true; return; }
    const box = document.getElementById('setLegal');
    if (box && !box.querySelector('a[data-priv]')) box.appendChild(link('both'));
    if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(relabel);
    if (seen()) { done = true; return; }
    if (ND.leaderboard && ND.leaderboard.onChange) ND.leaderboard.onChange(update);
    timer = setInterval(update, 1000);
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
