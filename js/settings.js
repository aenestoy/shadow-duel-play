// Shadow Duel — the Settings screen (ND.settingsUI).
// Every setting of the game in one panel (#setOv in index.html), one tab per group:
//   Audio     Sound and Music switches (game.js, data-tog) + the volume sliders (volume.js, #setVol)
//   Controls  key hints switch (game.js #tHints); touch: layout / size / hand / movement / assist / vibration /
//             Customize controls / fullscreen (touch.js, #setTset, shown on touch screens); keyboard: the key list
//             and the gamepad line (copied here from the menu's Controls card, shown when not on touch)
//   Graphics  quality Auto / High / Medium / Low (game.js [data-gq]) + blood effect where the portal allows it (#tBlood)
//   Language  the seven languages (ND.i18n.setLang(lang, { save: true }), same as the globe's list in lang-ui.js)
// Every control is the same one the rest of the game uses, so a change applies at once and is saved in ND.save
// settings by its owner file. Opened by any [data-set-open] button: first screen and main menu (top bar, the menu's
// options line on low landscape phones) and the pause dialog — during a fight Settings is reached only from pause,
// so the fight is always paused behind it; if the pause closes (gamepad Start), the panel closes too.
// Keys while open: Tab / Shift+Tab stay inside the panel, arrows move between tabs, Escape (where allowed) or
// Backspace closes and gives focus back to the button that opened it; nothing reaches the game behind.
// Texts: ND.STR.set (Turkish source in i18n.js, other languages block "SETTINGS SCREEN" in js/i18n-*.js).
(function (ND) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const I = () => ND.i18n;
  const TABS = ['audio', 'controls', 'gfx', 'lang'];
  let ov = null, back = null, tab = 'audio', fromPause = false;

  const ui = () => { try { if (ND.audio && ND.audio.ready) ND.audio.ui(); } catch (e) { /* no audio */ } };
  const visible = (el) => !!el && !el.hidden && !el.closest('[hidden]') && el.getClientRects().length > 0;

  // ---------------------------------------------------------------- contents built here
  function fillLangs() {
    const box = $('setLangs'), i = I();
    if (!box || !i) return;
    const cur = i.lang, f = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.setLang : null;
    box.innerHTML = i.supported.map((l) => `<button type="button" data-set-lang="${l}" lang="${l}" aria-pressed="${l === cur}"><span>${esc(i.names[l] || l)}</span><small>${l.toUpperCase()}</small></button>`).join('');
    box.querySelectorAll('[data-set-lang]').forEach((b) => {
      b.onclick = (e) => { e.stopPropagation(); i.setLang(b.dataset.setLang, { save: true }); ui(); };
    });
    if (f) { const b = box.querySelector(`[data-set-lang="${f}"]`); if (b) b.focus(); }
  }
  // the key list and the gamepad line: copies of the menu's Controls card (already translated and relabelled for the
  // keyboard layout there); taken again on every open and language change
  function fillKeys() {
    const keys = document.querySelector('#menu aside .keys'), pad = document.querySelector('#menu aside .kbnote');
    const k = $('setKeys'), p = $('setPad');
    if (k) { k.textContent = ''; if (keys) k.appendChild(keys.cloneNode(true)); }
    if (p) { p.textContent = ''; if (pad) { const c = pad.cloneNode(true); c.className = ''; p.appendChild(c); } }
  }

  // ---------------------------------------------------------------- tabs
  function select(name, focus) {
    if (!TABS.includes(name)) name = 'audio';
    tab = name;
    if (!ov) return;
    ov.querySelectorAll('[role="tab"]').forEach((b) => {
      const on = b.dataset.tab === name;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    ov.querySelectorAll('[role="tabpanel"]').forEach((p) => { p.hidden = p.id !== 'setPane-' + name; });
    const panes = ov.querySelector('.set-panes');
    if (panes) panes.scrollTop = 0;
  }

  // ---------------------------------------------------------------- open / close
  function open(name) {
    ov = ov || $('setOv');
    if (!ov) return;
    const G = ND.game;
    // a running fight is paused first (the buttons only offer Settings in pause, this is for any other caller)
    if (G && G.phase === 'fight' && G.mode !== 'attract' && !G.paused && ND.input && ND.input.onPause) ND.input.onPause(null);
    const pz = $('pause');
    fromPause = !!(pz && !pz.hidden);
    if (ov.hidden) back = document.activeElement;
    fillLangs(); fillKeys();
    try { if (ND.touchUI) ND.touchUI.refresh(); if (ND.volumeUI) ND.volumeUI.refresh(); } catch (e) { /* yok */ }
    ov.hidden = false;
    select(typeof name === 'string' ? name : tab, false);
    setTimeout(() => { if (!ov.hidden) { const t = ov.querySelector('[role="tab"][aria-selected="true"]'); if (t) t.focus(); } }, 0);
    ui();
  }
  function close(restore) {
    if (!ov || ov.hidden) return;
    ov.hidden = true;
    const el = back;
    back = null;
    fromPause = false;
    if (restore !== false && el && el.isConnected && typeof el.focus === 'function') setTimeout(() => { if (el.isConnected && visible(el)) el.focus({ preventScroll: true }); }, 0);
  }

  // ---------------------------------------------------------------- keys
  function focusables() {
    return [...ov.querySelectorAll('button, input, select, [tabindex="0"]')].filter((el) => !el.disabled && el.tabIndex >= 0 && visible(el));
  }
  function onKey(e) {
    // the touch layout editor opened from here handles its own keys
    const app = $('app');
    if (app && app.classList.contains('t-editing')) return false;
    if (e.ctrlKey || e.metaKey || e.altKey) return true; // browser shortcuts keep their native action
    const inp = ND.input || {};
    if (e.code === 'Escape' && inp.escAllowed === false) return true; // CrazyGames' fullscreen key
    const a = document.activeElement;
    if ((e.code === 'Escape' || (e.code === 'Backspace' && !(inp.isEditable && inp.isEditable(a)))) && !e.repeat) { e.preventDefault(); close(true); return true; }
    if (e.code === 'Tab') {
      const list = focusables();
      if (!list.length) return true;
      const i = list.indexOf(a);
      const n = i < 0 ? (e.shiftKey ? list.length - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + list.length) % list.length;
      list[n].focus();
      e.preventDefault();
      return true;
    }
    // arrows on the tab list: previous / next tab (selects it)
    if (a && a.getAttribute && a.getAttribute('role') === 'tab') {
      const i = TABS.indexOf(a.dataset.tab);
      const d = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[e.code];
      if (d) { select(TABS[(i + d + TABS.length) % TABS.length], true); e.preventDefault(); return true; }
      if (e.code === 'Home' || e.code === 'End') { select(TABS[e.code === 'Home' ? 0 : TABS.length - 1], true); e.preventDefault(); return true; }
    }
    return true; // Enter / Space / arrows on sliders keep their native action; the game never sees them
  }

  // ---------------------------------------------------------------- start
  function start() {
    ov = $('setOv');
    if (!ov) return;
    document.querySelectorAll('[data-set-open]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); open(); }; });
    const c = $('setClose');
    if (c) c.onclick = (e) => { e.stopPropagation(); close(true); ui(); };
    ov.addEventListener('click', (e) => { if (e.target === ov) close(true); });
    ov.querySelectorAll('[role="tab"]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); select(b.dataset.tab, true); ui(); }; });
    window.addEventListener('keydown', (e) => { if (ov && !ov.hidden && onKey(e)) e.stopPropagation(); }, true);
    // a pause that ends (Resume by gamepad Start, Main menu) takes the panel opened from it along
    const pz = $('pause');
    if (pz && typeof MutationObserver !== 'undefined') new MutationObserver(() => { if (pz.hidden && fromPause && ov && !ov.hidden) close(false); }).observe(pz, { attributes: true, attributeFilter: ['hidden'] });
    if (I() && I().onChange) I().onChange(() => { if (ov && !ov.hidden) { fillLangs(); fillKeys(); } });
    select(tab, false);
  }

  ND.settingsUI = {
    open, close: () => close(true), select,
    get isOpen() { return !!ov && !ov.hidden; },
    get tab() { return tab; },
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);
})(window.ND);
