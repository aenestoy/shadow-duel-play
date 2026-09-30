// Shadow Duel — language picker (ND.langUI).
// Where it shows: a small globe button with the current language code beside the ⚙ Settings button, top-right on the
// first screen (#firstTop) and on the main menu (#menuTop, next to the title). The Settings panel's Language tab
// (js/settings.js) lists the same languages and calls the same ND.i18n.setLang(lang, { save: true }).
// Every globe opens the same list (#langOv): the seven languages, each written in its own language. Choosing one
// calls ND.i18n.setLang(lang, { save: true }): the whole game switches at once (tables, DOM, canvas texts; listeners
// registered with ND.i18n.onChange re-render their screens) and the choice is kept in ND.save settings (`lang`).
// Texts: ND.STR.lang (Turkish source in i18n.js, the other languages in js/i18n-*.js, block "LANGUAGE PICKER").
// Loaded after i18n.js; builds itself once the page has loaded.
(function (ND) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const I = () => ND.i18n;
  const T = () => (ND.STR && ND.STR.lang) || {};
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const name = (l) => (I() && I().names[l]) || String(l).toUpperCase();
  const GLOBE = '<svg class="lg-ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/>' +
    '<path d="M3.5 9h17M3.5 15h17M12 3c-2.7 2.6-4 5.6-4 9s1.3 6.4 4 9M12 3c2.7 2.6 4 5.6 4 9s-1.3 6.4-4 9"/></svg>';

  const CSS = `
  .lang-globe { position: absolute; z-index: 3; display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px 0 8px;
    background: rgba(8,9,16,.55); border: 1px solid var(--line); border-radius: 16px; cursor: pointer; color: var(--muted);
    font: 600 12px/1 var(--display); letter-spacing: .12em; transition: color .15s, border-color .15s, background-color .15s; }
  .lang-globe:hover, .lang-globe:focus-visible { color: var(--gold-hi, #f1d69c); border-color: var(--gold); background: rgba(8,9,16,.8); }
  .lang-globe:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
  .lang-globe b { font-weight: 600; }
  .lg-ic { width: 16px; height: 16px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; }
  /* outside a .topbtns row (index.html) the globe sits in the corner of its parent */
  #first > .lang-globe { top: calc(env(safe-area-inset-top, 0px) + 12px); right: calc(env(safe-area-inset-right, 0px) + 14px); }
  #menu .brand > .lang-globe { top: 2px; right: 0; }
  #app.touch .lang-globe { height: 36px; padding: 0 12px 0 10px; }
  #langOv { z-index: 65; display: flex; align-items: center; justify-content: center; background: rgba(5,6,12,.86); }
  #langOv[hidden] { display: none; }
  #langOv .lang-card { width: min(460px, 100%); box-sizing: border-box; margin: auto; padding: 18px; }
  #langOv h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 14px; font: 600 13px/1 var(--display); letter-spacing: .24em; text-transform: uppercase; color: var(--gold); }
  #langOv h2 .lg-ic { width: 18px; height: 18px; }
  #langOv .lang-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(128px, 1fr)); gap: 8px; }
  #langOv .lang-opt { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; padding: 8px 12px; background: rgba(255,255,255,.04);
    border: 1px solid var(--line); cursor: pointer; color: var(--text); font: 500 16px/1.1 var(--display); letter-spacing: .03em; text-align: left; }
  #langOv .lang-opt small { font: 600 10.5px/1 var(--display); letter-spacing: .14em; color: var(--muted); }
  #langOv .lang-opt:hover, #langOv .lang-opt:focus-visible { border-color: var(--gold); }
  #langOv .lang-opt:focus-visible { outline: 2px solid var(--gold); outline-offset: 1px; }
  #langOv .lang-opt[aria-current="true"] { border-color: var(--gold); background: rgba(217,179,108,.16); color: var(--gold-hi, #f1d69c); }
  #langOv .lang-close { display: block; margin: 14px auto 0; }
  @media (max-height: 420px) {
    #langOv { padding-block: 10px; }
    #langOv .lang-card { padding: 12px 14px; }
    #langOv h2 { margin-bottom: 10px; }
    #langOv .lang-list { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px; }
    #langOv .lang-opt { min-height: 40px; padding: 6px 10px; font-size: 15px; }
    #langOv .lang-close { margin-top: 10px; padding-block: 9px; }
  }`;

  let ov = null, back = null;

  // ---------------------------------------------------------------- the list
  function buildOverlay() {
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'langOv';
    ov.className = 'overlay';
    ov.hidden = true;
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-labelledby', 'langOvT');
    ov.setAttribute('data-i18n-skip', '');
    ov.addEventListener('click', (e) => { if (e.target === ov) close(true); });
    ($('app') || document.body).appendChild(ov);
    return ov;
  }
  function fillOverlay() {
    if (!ov || !I()) return;
    const cur = I().lang, O = T();
    ov.innerHTML = `<div class="lang-card card"><h2 id="langOvT">${GLOBE}<span>${esc(O.title || 'Language')}</span></h2>` +
      '<div class="lang-list">' +
      I().supported.map((l) => `<button type="button" class="lang-opt" data-lang="${l}" lang="${l}" aria-current="${l === cur}"><span>${esc(name(l))}</span><small>${l.toUpperCase()}</small></button>`).join('') +
      `</div><button type="button" class="btn lang-close">${esc(O.close || 'Close')}</button></div>`;
    ov.querySelectorAll('[data-lang]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); choose(b.dataset.lang); }; });
    ov.querySelector('.lang-close').onclick = (e) => { e.stopPropagation(); close(true); };
  }
  function open() {
    buildOverlay();
    back = document.activeElement;
    fillOverlay();
    ov.hidden = false;
    const cur = ov.querySelector('[aria-current="true"]') || ov.querySelector('[data-lang]');
    setTimeout(() => { if (!ov.hidden && cur && cur.isConnected) cur.focus(); }, 0);
    try { if (ND.audio && ND.audio.ready) ND.audio.ui(); } catch (e) { /* no audio */ }
  }
  function close(restore) {
    if (!ov || ov.hidden) return;
    ov.hidden = true;
    const el = back;
    back = null;
    if (restore && el && el.isConnected && typeof el.focus === 'function') setTimeout(() => { if (el.isConnected) el.focus(); }, 0);
  }
  function choose(lang) {
    const i = I();
    if (!i) return;
    i.setLang(lang, { save: true });
    try { if (ND.audio && ND.audio.ready) ND.audio.ui(); } catch (e) { /* no audio */ }
    close(true);
  }

  // Keys while the list is open: arrows move, Enter/Space pick (the buttons' own click), Escape/⌫ close.
  // Nothing reaches the game behind it (capture phase, before input.js).
  function onKey(e) {
    if (!ov || ov.hidden) return;
    // Browser shortcuts and CrazyGames' fullscreen key keep their native action.
    if (e.ctrlKey || e.metaKey || e.altKey || (e.code === 'Escape' && ND.input && ND.input.escAllowed === false)) return;
    const opts = [...ov.querySelectorAll('[data-lang]')];
    const i = opts.indexOf(document.activeElement);
    const cols = Math.max(1, getComputedStyle(ov.querySelector('.lang-list')).gridTemplateColumns.split(' ').filter(Boolean).length);
    const go = (n) => { const b = opts[(n + opts.length) % opts.length]; if (b) b.focus(); };
    switch (e.code) {
      case 'ArrowRight': case 'KeyD': go(i < 0 ? 0 : i + 1); break;
      case 'ArrowLeft': case 'KeyA': go(i < 0 ? 0 : i - 1); break;
      case 'ArrowDown': case 'KeyS': go(i < 0 ? 0 : Math.min(opts.length - 1, i + cols)); break;
      case 'ArrowUp': case 'KeyW': go(i < 0 ? 0 : Math.max(0, i - cols)); break;
      case 'Escape': case 'Backspace': if (!e.repeat) close(true); break;
      case 'KeyF': if (!e.repeat && i >= 0) opts[i].click(); break;
      case 'Tab': {
        const buttons = [...opts, ov.querySelector('.lang-close')].filter(Boolean);
        const current = buttons.indexOf(document.activeElement);
        const next = current < 0 ? (e.shiftKey ? buttons.length - 1 : 0) : (current + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
        if (buttons[next]) buttons[next].focus();
        e.preventDefault();
        return;
      }
      case 'Enter': case 'Space': return; // native button activation, hidden from the game below
      default: break;
    }
    if (e.code !== 'Enter' && e.code !== 'Space' && e.code !== 'Tab') e.preventDefault();
  }

  // ---------------------------------------------------------------- triggers
  function globe(parent, id) {
    if (!parent || $(id)) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.id = id;
    b.className = 'lang-globe';
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('data-i18n-skip', '');
    b.onclick = (e) => { e.stopPropagation(); open(); };
    parent.appendChild(b);
  }
  function mount() {
    globe($('firstTop') || $('first'), 'langFirst');
    globe($('menuTop') || document.querySelector('#menu .brand'), 'langMenu');
  }
  function refresh() {
    const i = I();
    if (!i) return;
    const O = T(), l = i.lang, label = `${O.change || 'Language'}: ${name(l)}`;
    document.querySelectorAll('.lang-globe').forEach((b) => {
      b.innerHTML = `${GLOBE}<b>${l.toUpperCase()}</b>`;
      b.setAttribute('aria-label', label);
      b.title = label;
    });
    if (ov && !ov.hidden) { const f = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.lang : null; fillOverlay(); const b = f && ov.querySelector(`[data-lang="${f}"]`); if (b) b.focus(); }
  }

  ND.langUI = {
    open, close: () => close(true), refresh, mount,
    get isOpen() { return !!ov && !ov.hidden; },
  };

  const start = () => {
    if (!$('langUiCss')) { const st = document.createElement('style'); st.id = 'langUiCss'; st.textContent = CSS; document.head.appendChild(st); }
    mount();
    refresh();
    if (I() && I().onChange) I().onChange(refresh);
    window.addEventListener('keydown', (e) => { if (ov && !ov.hidden) { onKey(e); e.stopPropagation(); } }, true);
    // the pause dialog closing (resume, menu) also closes the list
    const pz = $('pause');
    if (pz && typeof MutationObserver !== 'undefined') new MutationObserver(() => { if (pz.hidden && ov && !ov.hidden && back && pz.contains(back)) close(false); }).observe(pz, { attributes: true, attributeFilter: ['hidden'] });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);
})(window.ND);
