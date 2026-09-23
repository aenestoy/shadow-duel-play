// Shadow Duel — touch controls: player preferences, their settings panel, fullscreen and the portrait hint.
// The pad itself (stick, buttons, multi-touch) lives in input.js; this file decides how it looks and behaves:
//   layout  'simple' (default: ATTACK, HEAVY, GUARD, KI, DASH) | 'full' (+ KICK, SHURIKEN)
//   size    's' | 'm' | 'l'          left    buttons on the left, stick on the right (left-handed)
//   assist  input conveniences only (hold ATTACK to keep chaining, steadier stick): same rules, fair scores
//   haptic  short vibration on press where the browser supports it
// Saved with the other settings (ND.save, key "touch"). Texts: ND.STR.touch.opt (Turkish in i18n.js, English in i18n-en.js).
(function (ND) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const DEF = { layout: 'simple', size: 'm', left: false, assist: true, haptic: true };
  const OK = { layout: ['simple', 'full'], size: ['s', 'm', 'l'] };
  const T = () => (ND.STR && ND.STR.touch && ND.STR.touch.opt) || {};

  function read() {
    let s = null;
    try { s = ND.save ? ND.save.settings().touch : null; } catch (e) { /* storage blocked */ }
    const p = Object.assign({}, DEF);
    if (s && typeof s === 'object') {
      for (const k in OK) if (OK[k].includes(s[k])) p[k] = s[k];
      for (const k of ['left', 'assist', 'haptic']) if (typeof s[k] === 'boolean') p[k] = s[k];
    }
    return p;
  }
  const prefs = ND.touchPrefs = read();
  function save() {
    try {
      if (!ND.save) return;
      const s = ND.save.settings();
      s.touch = Object.assign({}, prefs);
      ND.save.saveSettings(s);
    } catch (e) { /* storage blocked: the choice lasts this session */ }
  }

  // ---------------------------------------------------------------- look of the pad
  function apply() {
    const pad = $('touch'), app = $('app');
    if (pad) { pad.classList.toggle('simple', prefs.layout === 'simple'); pad.classList.toggle('full', prefs.layout === 'full'); }
    if (app) { app.dataset.tsize = prefs.size; app.classList.toggle('t-left', !!prefs.left); }
    // fingers still down belong to the old layout: let them go (and the button boxes are measured again)
    try { if (ND.input && ND.input.touchReset) ND.input.touchReset(); } catch (e) { /* yok */ }
    refresh();
  }

  // ---------------------------------------------------------------- fullscreen
  // Only on our own pages: CrazyGames, Poki and Yandex run the game in their own frame and offer fullscreen
  // themselves (CrazyGames keeps Escape for it). iPhone Safari has no element fullscreen, so the button stays hidden.
  const doc = document, root = doc.documentElement;
  const fsEnabled = () => !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
  const fsElement = () => doc.fullscreenElement || doc.webkitFullscreenElement || null;
  const fsAllowed = () => ND.portalName === 'local' && fsEnabled();
  function toggleFullscreen() {
    try {
      if (fsElement()) { (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc); return; }
      const req = root.requestFullscreen || root.webkitRequestFullscreen;
      if (!req) return;
      const p = req.call(root, { navigationUI: 'hide' });
      // phones: once fullscreen, ask to stay in landscape (Android Chrome allows it only in fullscreen)
      const lock = () => { try { const o = screen.orientation; if (o && o.lock && ND.touch && ND.touch.active) o.lock('landscape').catch(() => {}); } catch (e) { /* yok */ } };
      if (p && p.then) p.then(lock).catch(() => {}); else lock();
    } catch (e) { /* refused: nothing to do */ }
  }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => doc.addEventListener(ev, () => refresh()));

  // ---------------------------------------------------------------- settings panel (pause dialog + menu card)
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const canVibrate = () => typeof navigator.vibrate === 'function';
  function build(box, withNote) {
    if (!box) return;
    const O = T(), S = O.sizes || {};
    const seg = (k, v, label) => `<button type="button" class="seg" data-tp="${k}" data-v="${v}">${esc(label)}</button>`;
    const tog = (k, label) => `<button type="button" class="tog" data-tp="${k}"><i></i><span>${esc(label)}</span></button>`;
    box.innerHTML =
      `<h3>${esc(O.title || 'Touch controls')}</h3>` +
      `<div class="ts-row"><span>${esc(O.layout || 'Layout')}</span>${seg('layout', 'simple', O.simple || 'Simple')}${seg('layout', 'full', O.full || 'Full')}</div>` +
      `<div class="ts-row"><span>${esc(O.size || 'Size')}</span>${seg('size', 's', S.s || 'S')}${seg('size', 'm', S.m || 'M')}${seg('size', 'l', S.l || 'L')}</div>` +
      `<div class="ts-row"><span>${esc(O.hand || 'Buttons')}</span>${seg('left', '0', O.right || 'Right')}${seg('left', '1', O.left || 'Left')}</div>` +
      `<div class="ts-togs">${tog('assist', O.assist || 'Easy assist')}${canVibrate() ? tog('haptic', O.haptic || 'Vibration') : ''}</div>` +
      `<button type="button" class="mini ts-fs" data-fs hidden></button>` +
      (withNote && O.note ? `<p class="ts-note">${esc(O.note)}</p>` : '');
    box.querySelectorAll('[data-tp]').forEach((b) => (b.onclick = (e) => {
      e.stopPropagation();
      const k = b.dataset.tp;
      if (k === 'assist' || k === 'haptic') prefs[k] = !prefs[k];
      else if (k === 'left') prefs.left = b.dataset.v === '1';
      else prefs[k] = b.dataset.v;
      save(); apply();
      try { if (ND.audio && ND.audio.ready) ND.audio.ui(); } catch (err) { /* yok */ }
    }));
    const fs = box.querySelector('[data-fs]');
    if (fs) fs.onclick = (e) => { e.stopPropagation(); toggleFullscreen(); };
  }
  // pressed states + fullscreen label on every panel
  function refresh() {
    const O = T();
    document.querySelectorAll('.tset').forEach((box) => {
      box.querySelectorAll('[data-tp]').forEach((b) => {
        const k = b.dataset.tp;
        const on = k === 'assist' || k === 'haptic' ? !!prefs[k] : k === 'left' ? String(+!!prefs.left) === b.dataset.v : prefs[k] === b.dataset.v;
        b.setAttribute('aria-pressed', String(on));
      });
      const fs = box.querySelector('[data-fs]');
      if (fs) { fs.hidden = !fsAllowed(); fs.textContent = fsElement() ? O.exitFullscreen || 'Exit fullscreen' : O.fullscreen || 'Fullscreen'; }
    });
  }
  function buildAll() { build($('pauseTset'), false); build($('menuTset'), true); refresh(); }

  // ---------------------------------------------------------------- move list: where kick / shuriken went
  // In the simple layout the move list still shows KICK and SHURIKEN moves; one line says where those buttons are.
  function hookMoves() {
    const tr = ND.training;
    if (!tr || typeof tr.movesHtml !== 'function' || tr.movesHtml._touch) return;
    const orig = tr.movesHtml;
    const wrapped = function (...args) {
      let html = orig.apply(this, args);
      if (!(ND.touch && ND.touch.active)) return html;
      // move descriptions name the keyboard's LIGHT / HAFİF button: on touch that button is ATTACK / SALDIR
      const TB = (ND.STR && ND.STR.touch && ND.STR.touch.btn) || {};
      if (TB.light) html = html.replace(/(^|[^A-Za-zÇĞİÖŞÜçğıöşü])(LIGHT|HAFİF)(?![A-Za-zÇĞİÖŞÜçğıöşü])/g, (m, a) => a + TB.light);
      const note = T().fullNote;
      if (prefs.layout === 'simple' && note) html += `<dt></dt><dd class="nt"><small>${esc(note)}</small></dd>`;
      return html;
    };
    wrapped._touch = true;
    tr.movesHtml = wrapped;
  }

  // ---------------------------------------------------------------- start (DOM is there: scripts sit at the end of <body>)
  ND.touchUI = { prefs, apply, refresh, rebuild: buildAll, toggleFullscreen, fsAllowed };
  apply();
  // texts come from ND.STR, which i18n translates after this file runs: build once everything has loaded
  const start = () => {
    buildAll(); hookMoves();
    if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(buildAll);
    // portrait hint during a fight: a way out without turning the phone
    const rm = $('rotMenu'), bm = $('bMenu');
    if (rm && bm) rm.onclick = () => bm.click();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);
})(window.ND);
