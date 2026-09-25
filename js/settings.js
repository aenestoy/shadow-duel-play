// Shadow Duel — the Settings screen (ND.settingsUI).
// Every setting of the game in one panel (#setOv in index.html), one tab per group:
//   Audio     Sound and Music switches (game.js, data-tog) + the volume sliders (volume.js, #setVol)
//   Controls  key hints switch (game.js #tHints); touch: layout / size / hand / movement / assist / vibration /
//             Customize controls / fullscreen (touch.js, #setTset, shown on touch screens); keyboard: the key list
//             and the gamepad line (copied here from the menu's Controls card, shown when not on touch)
//   Graphics  quality Auto / High / Medium / Low (game.js [data-gq]), frame rate (game.js [data-fq]), Show FPS (#tFps,
//             game.js fpsMeter) + blood effect where the portal allows it (#tBlood)
//   Language  the seven languages (ND.i18n.setLang(lang, { save: true }), same as the globe's list in lang-ui.js)
//   Progress  keeping titles / Champion colors / Dan / scores: the CrazyGames account state, "Save your progress to your
//             CrazyGames account" (ND.cgAccount.prompt, js/portal-user.js) for CrazyGames guests, and the guest recovery
//             code (show / new code / enter a code on a new device: ND.leaderboard.recoveryCode / recover) (#setSave)
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
  const TABS = ['audio', 'controls', 'gfx', 'lang', 'save'];
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

  // ---------------------------------------------------------------- Progress tab (account + recovery code)
  // Redrawn on open, on a leaderboard change (account verified, server back…) and after each action. The recovery code
  // is only fetched when asked for (Show code): opening Settings never creates one. A code being typed survives redraws.
  const rc = { code: null, msg: '', ok: null, busy: false, pid: null };
  function fillSave() {
    const box = $('setSave'), LB = ND.leaderboard;
    if (!box || !LB) return;
    const A = (ND.STR && ND.STR.acct) || {}, E = A.err || {}, CG = ND.cgAccount || {};
    const inp0 = box.querySelector('input'), typed = inp0 ? inp0.value : '', focused = !!inp0 && document.activeElement === inp0;
    const pid = LB.adapter && LB.adapter.pid;
    if (rc.pid !== pid) { rc.code = null; rc.pid = pid; } // another identity: its code is not this one
    box.textContent = '';
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const btn = (text, fn, cls) => {
      const b = el('button', 'btn' + (cls ? ' ' + cls : ''), text); b.type = 'button'; b.disabled = rc.busy;
      b.onclick = (e) => { e.stopPropagation(); ui(); fn(); };
      return b;
    };
    const run = async (job) => { rc.busy = true; fillSave(); try { await job(); } finally { rc.busy = false; fillSave(); } };
    const errText = (c) => E[c] || E.error || '';
    box.appendChild(el('h3', null, A.title || ''));
    if (LB.nameLocked) { // signed in to CrazyGames: the account keeps everything (once our server verified it)
      const a = LB.account(), f = a.on ? A.cgOn : a.state === 'pending' ? A.cgWait : A.cgFail;
      box.appendChild(el('p', 'acc-note', typeof f === 'function' ? f(a.name) : ''));
      return;
    }
    if (CG.available) {
      box.appendChild(btn(A.cgSave || '', () => { if (CG.prompt) CG.prompt().then(() => fillSave()); }, 'primary'));
      box.appendChild(el('p', 'acc-note', A.cgSaveNote || ''));
    }
    if (!LB.canRecover()) { box.appendChild(el('p', 'acc-note', LB.status === 'offline' ? A.offline : A.local)); return; }
    // the code of this device's identity
    box.appendChild(el('h3', null, A.rcTitle || ''));
    box.appendChild(el('p', 'acc-note', A.rcNote || ''));
    const row = el('div', 'set-rc');
    if (!LB.hasServerId()) row.appendChild(el('p', 'acc-note', A.rcNeedName || ''));
    else if (!rc.code) row.appendChild(btn(A.rcShow || '', () => run(async () => {
      const r = await LB.recoveryCode(false);
      if (r.ok) { rc.code = r.code; rc.msg = ''; rc.ok = null; } else { rc.msg = errText(r.code); rc.ok = 0; }
    })));
    else {
      row.appendChild(el('code', 'set-code', rc.code));
      row.appendChild(btn(A.rcNew || '', () => run(async () => {
        const r = await LB.recoveryCode(true);
        if (r.ok) { rc.code = r.code; rc.msg = A.rcNewDone || ''; rc.ok = 1; } else { rc.msg = errText(r.code); rc.ok = 0; }
      }), 'mini'));
    }
    box.appendChild(row);
    // a code from another device
    box.appendChild(el('h3', null, A.rcEnter || ''));
    const form = el('form', 'set-rcform');
    const inp = el('input');
    inp.type = 'text'; inp.maxLength = 20; inp.placeholder = 'KAGE-XXXX-XXXX'; inp.autocomplete = 'off'; inp.spellcheck = false;
    inp.setAttribute('autocapitalize', 'characters'); inp.setAttribute('aria-label', A.rcEnter || ''); inp.setAttribute('enterkeyhint', 'go');
    inp.value = typed; inp.disabled = rc.busy;
    // game keys (A/D/F…) must not reach the fight behind while typing
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') inp.blur(); });
    inp.addEventListener('keyup', (e) => e.stopPropagation());
    const go = btn(A.rcGo || '', () => form.requestSubmit ? form.requestSubmit() : form.onsubmit(new Event('submit')));
    go.type = 'submit'; go.onclick = (e) => e.stopPropagation();
    form.onsubmit = (e) => {
      e.preventDefault();
      if (rc.busy) return;
      ui();
      const text = inp.value;
      run(async () => {
        const r = await LB.recover(text);
        if (r.ok) { rc.code = r.code || null; rc.pid = LB.adapter && LB.adapter.pid; rc.msg = A.rcDone ? A.rcDone(r.name || LB.getName(), r.code || '') : ''; rc.ok = 1; inp.value = ''; }
        else { rc.msg = errText(r.code); rc.ok = 0; }
      });
    };
    form.append(inp, go);
    box.appendChild(form);
    if (rc.msg) { const m = el('p', 'set-rcmsg', rc.msg); m.dataset.ok = String(rc.ok); m.setAttribute('role', 'status'); box.appendChild(m); }
    if (focused && !rc.busy) setTimeout(() => { const i = box.querySelector('input'); if (i) i.focus(); }, 0);
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
    if (name === 'save') fillSave();
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
    fillLangs(); fillKeys(); rc.msg = '';
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
    if (I() && I().onChange) I().onChange(() => { if (ov && !ov.hidden) { fillLangs(); fillKeys(); if (tab === 'save') fillSave(); } });
    // account verified / server back / identity restored: the Progress tab follows (not while a request is running)
    if (ND.leaderboard && ND.leaderboard.onChange) ND.leaderboard.onChange(() => { if (ov && !ov.hidden && tab === 'save' && !rc.busy) fillSave(); });
    select(tab, false);
  }

  ND.settingsUI = {
    open, close: () => close(true), select,
    get isOpen() { return !!ov && !ov.hidden; },
    get tab() { return tab; },
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);
})(window.ND);
