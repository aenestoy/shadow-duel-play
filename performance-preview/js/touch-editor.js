// Shadow Duel — touch layout editor ("Customize controls"), opened from the touch settings in the pause dialog and
// on the main menu's controls card. Shows every control of the pad over the fight screen; the player drags them
// anywhere (inside the notch-safe area), sets each one's size and opacity, hides the ones they don't use, picks the
// movement control and a preset, then saves or cancels.
// Works on a draft in pixels; saving turns it into fractions of the play area (touch.js toLayout) stored for the
// current screen shape only (phone landscape / tablet / portrait), so a layout made on a phone never lands on a tablet.
// Geometry (defaults, presets, clamping, overlap search) lives in touch.js (ND.touchUI). Texts: ND.STR.tedit plus the
// button names in ND.STR.touch.btn (Turkish in i18n.js, English in i18n-en.js).
// Cheap by design: DOM built once per opening, items moved with transform (translate) only.
(function (ND) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const TU = () => ND.touchUI;
  const X = () => (ND.STR && ND.STR.tedit) || {};
  const BTN = () => (ND.STR && ND.STR.touch && ND.STR.touch.btn) || {};
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ui = () => { try { if (ND.audio && ND.audio.ready) ND.audio.ui(); } catch (e) { /* no audio */ } };

  let root = null, st = null, drag = null, msgT = 0, keyH = null, opener = null;

  // ---------------------------------------------------------------- names and faces
  const DIRS = { dl: '◀', dr: '▶', du: '▲', dd: '▼' };
  function label(id) {
    const B = BTN(), D = X().dirs || {};
    if (id === 'stick') return B.stick || '';
    if (DIRS[id]) return D[id] || DIRS[id];
    if (id === 'throw') return X().throwName || B.throw || '';
    return B[id] || '';
  }
  function face(id) {
    const B = BTN();
    if (id === 'stick') return '<b class="te-knob"></b>';
    if (id === 'throw') return `<i class="shu"></i><small>${esc(B.throw || '')}</small>`;
    if (id === 'dd') return `▼<small>${esc(B.down || '')}</small>`;
    if (DIRS[id]) return DIRS[id];
    return `<span>${esc(B[id] || '')}</span>`;
  }
  const kind = (id) => (id === 'stick' ? 'stick' : DIRS[id] ? 'dir' : 'act');
  const cur = () => (st ? st.items[st.sel] : null);
  const live = () => TU().liveIds(st.move);
  const others = (id) => live().filter((k) => k !== id && !st.items[k].h).map((k) => st.items[k]);
  const overlaps = (id) => { const q = st.items[id]; return !q.h && others(id).some((o) => TU().hits(q, o)); };
  // SIMPLE / FULL follows what is on screen: KICK or SHURIKEN shown → full
  const layoutOf = (items) => (!items.kick.h || !items.throw.h ? 'full' : 'simple');
  const sizeName = (r) => { const Z = X().sizes || {}; return r < 0.85 ? Z.s : r < 1.1 ? Z.m : r < 1.3 ? Z.l : Z.xl; };
  const pctTxt = (p) => { const f = ND.STR && ND.STR.vol && ND.STR.vol.pct; try { return typeof f === 'function' ? f(p) : p + '%'; } catch (e) { return p + '%'; } };

  // ---------------------------------------------------------------- building
  function build() {
    const E = X(), M = E.moves || {};
    const seg = (k, v, t) => `<button type="button" class="seg" data-k="${k}" data-v="${v}">${esc(t)}</button>`;
    const tog = (k, t) => `<button type="button" class="tog" data-k="${k}"><i></i><span>${esc(t)}</span></button>`;
    const range = (k, min, max, step) => `<input type="range" class="te-range" data-r="${k}" min="${min}" max="${max}" step="${step}">`;
    if (!root) {
      root = document.createElement('div');
      root.id = 'tEdit';
      root.className = 'te';
      root.hidden = true;
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.tabIndex = -1;
      ($('app') || document.body).appendChild(root);
      wire();
    }
    root.setAttribute('aria-label', E.title || '');
    const items = TU().IDS.map((id) => `<div class="te-it te-${kind(id)} te-${id}" data-id="${id}" role="button" aria-label="${esc(label(id))}"><div class="te-face">${face(id)}</div><em class="te-off">${esc(E.hidden || '')}</em></div>`).join('');
    root.innerHTML =
      '<div class="te-stage" data-stage><div class="te-zone" data-zone></div>' + items + '</div>' +
      '<div class="te-bar">' +
        `<button type="button" class="mini" data-do="cancel">${esc(E.cancel)}</button>` +
        `<p class="te-hint"><b data-shape></b> <span data-hint></span></p>` +
        `<button type="button" class="mini" data-do="opts" aria-haspopup="dialog">${esc(E.options)}</button>` +
        `<button type="button" class="mini primary" data-do="save">${esc(E.save)}</button>` +
      '</div>' +
      '<div class="te-insp" data-insp hidden>' +
        '<b class="te-name" data-name></b>' +
        `<label class="te-row"><span>${esc(E.size)}</span>${range('size', 70, 150, 5)}<output data-out="size"></output></label>` +
        `<label class="te-row"><span>${esc(E.opacity)}</span>${range('o', 20, 100, 5)}<output data-out="o"></output></label>` +
        `<button type="button" class="tog" data-k="hide"><i></i><span>${esc(E.hide)}</span></button>` +
        `<button type="button" class="mini te-x" data-do="desel" aria-label="${esc(E.close)}">✕</button>` +
      '</div>' +
      '<div class="te-sheet" data-sheet hidden><div class="te-card card">' +
        `<h3>${esc(E.options)}</h3>` +
        `<div class="ts-row"><span>${esc(E.move)}</span>${seg('move', 'float', M.float)}${seg('move', 'fixed', M.fixed)}${seg('move', 'dpad', M.dpad)}</div>` +
        '<p class="te-note" data-mnote></p>' +
        `<div class="ts-togs">${tog('dtap', E.dtap)}${tog('snap', E.snap)}</div>` +
        `<label class="te-row"><span>${esc(E.opacityAll)}</span>${range('op', 20, 100, 5)}<output data-out="op"></output></label>` +
        `<div class="ts-row te-pre"><span>${esc(E.presets)}</span><button type="button" class="seg" data-pre="right">${esc(E.pRight)}</button>` +
          `<button type="button" class="seg" data-pre="left">${esc(E.pLeft)}</button><button type="button" class="seg" data-pre="split">${esc(E.pSplit)}</button></div>` +
        `<p class="te-note">${esc(E.screenNote)}</p>` +
        `<div class="te-foot"><button type="button" class="mini" data-do="reset">${esc(E.reset)}</button>` +
        `<button type="button" class="mini primary" data-do="closeOpts">${esc(E.done)}</button></div>` +
      '</div></div>' +
      '<div class="te-msg" data-msg role="status" aria-live="polite"></div>';
    root.querySelectorAll('.te-range').forEach((r) => { r.addEventListener('input', onRange); r.addEventListener('change', onRangeEnd); });
  }

  // ---------------------------------------------------------------- drawing (transform only while dragging)
  function placeEl(el, q) {
    el.style.width = el.style.height = q.d.toFixed(1) + 'px';
    el.style.translate = `${(q.cx - q.d / 2).toFixed(1)}px ${(q.cy - q.d / 2).toFixed(1)}px`;
    el.style.setProperty('--r', (q.d / st.tb).toFixed(3));
  }
  const itemEl = (id) => root.querySelector(`.te-it[data-id="${id}"]`);
  function drawItem(id) {
    const el = itemEl(id), q = st.items[id];
    if (!el || !q) return;
    placeEl(el, q);
    el.style.setProperty('--fo', Math.max(0.3, st.op * q.o).toFixed(2));
    el.classList.toggle('off', !!q.h);
    el.classList.toggle('sel', st.sel === id);
    el.classList.toggle('bad', overlaps(id));
  }
  function drawZone() {
    const z = root.querySelector('[data-zone]');
    if (!z) return;
    const on = st.move !== 'dpad';
    z.hidden = !on;
    if (!on) return;
    const r = TU().stickZone(st.move, st.items.stick, st.S);
    z.style.translate = `${r.x.toFixed(1)}px ${r.y.toFixed(1)}px`;
    z.style.width = r.w.toFixed(1) + 'px'; z.style.height = r.h.toFixed(1) + 'px';
    z.classList.toggle('fixed', st.move === 'fixed');
  }
  function draw() {
    const L = live();
    for (const id of TU().IDS) {
      const el = itemEl(id);
      if (!el) continue;
      el.hidden = !L.includes(id);
      if (!el.hidden) drawItem(id);
    }
    drawZone();
    root.classList.toggle('snap', !!st.snap);
    root.style.setProperty('--g', grid() + 'px');
    root.style.setProperty('--tb', st.tb + 'px');
    const E = X(), Sh = E.shapes || {};
    root.querySelector('[data-shape]').textContent = Sh[st.S.shape] || '';
    const tall = st.S.shape === 'portrait';
    root.classList.toggle('tall', tall);
    root.querySelector('[data-hint]').textContent = tall ? E.rotate || '' : E.hint || '';
    if (tall) { st.sel = null; root.querySelector('[data-sheet]').hidden = true; }
    drawInsp(); drawSheet();
  }
  function drawInsp() {
    const box = root.querySelector('[data-insp]'), q = cur();
    box.hidden = !q || !!drag;
    if (!q) return;
    const id = st.sel, E = X(), r = q.d / (TU().BASE[id] * st.tb);
    root.querySelector('[data-name]').textContent = label(id);
    setRange('size', Math.round(r * 100), sizeName(r));
    setRange('o', Math.round(q.o * 100), pctTxt(Math.round(q.o * 100)));
    const h = box.querySelector('[data-k="hide"]');
    h.hidden = id === 'stick';
    h.setAttribute('aria-pressed', String(!!q.h));
    h.querySelector('span').textContent = q.h ? E.show || '' : E.hide || '';
    // out of the way of the selected control: at the top, or at the bottom when the control sits high
    box.classList.toggle('low', q.cy < st.S.H * 0.5);
  }
  function drawSheet() {
    const sh = root.querySelector('[data-sheet]');
    if (sh.hidden) return;
    const M = X().mnote || {};
    sh.querySelectorAll('[data-k]').forEach((b) => {
      const k = b.dataset.k;
      const on = k === 'move' ? st.move === b.dataset.v : !!st[k];
      b.setAttribute('aria-pressed', String(on));
      if (k === 'dtap') b.hidden = st.move !== 'dpad';
    });
    sh.querySelectorAll('[data-pre]').forEach((b) => b.setAttribute('aria-pressed', String(st.preset === b.dataset.pre)));
    sh.querySelector('[data-mnote]').textContent = (st.move === 'dpad' && st.dtap ? M.dtap : M[st.move]) || '';
    setRange('op', Math.round(st.op * 100), pctTxt(Math.round(st.op * 100)));
  }
  function setRange(k, v, txt) {
    const r = root.querySelector(`[data-r="${k}"]`), o = root.querySelector(`[data-out="${k}"]`);
    if (r) {
      if (document.activeElement !== r || +r.value !== v) r.value = String(v);
      r.style.setProperty('--p', ((v - r.min) / (r.max - r.min)) * 100 + '%');
      r.setAttribute('aria-valuetext', txt || '');
    }
    if (o) o.textContent = txt || '';
  }
  function msg(t) {
    const m = root.querySelector('[data-msg]');
    if (!m || !t) return;
    m.textContent = t; m.classList.add('on');
    clearTimeout(msgT); msgT = setTimeout(() => m.classList.remove('on'), 2200);
  }

  // ---------------------------------------------------------------- editing
  const grid = () => Math.max(6, Math.round(st.tb / 4));
  const snapV = (v) => (st.snap ? Math.round(v / grid()) * grid() : v);
  // a control that ended up on another one moves to the nearest free spot (or back where it came from)
  function unstack(id, backTo) {
    const q = st.items[id];
    if (q.h || !overlaps(id)) return;
    const f = TU().freeSpot(q, others(id), st.S, st.tb);
    if (f) { q.cx = f.cx; q.cy = f.cy; msg(X().overlap); } else if (backTo) { q.cx = backTo.cx; q.cy = backTo.cy; msg(X().noRoom); } else msg(X().noRoom);
  }
  function onRange(e) {
    const r = e.target, k = r.dataset.r, v = +r.value;
    if (k === 'op') { st.op = v / 100; st.preset = null; draw(); return; }
    const q = cur();
    if (!q) return;
    st.dirty = true;
    if (k === 'size') { q.d = TU().BASE[st.sel] * st.tb * (v / 100); TU().keepIn(q, st.S); }
    if (k === 'o') q.o = v / 100;
    drawItem(st.sel); if (st.sel === 'stick') drawZone(); drawInsp();
  }
  function onRangeEnd(e) {
    if (e.target.dataset.r !== 'size' || !cur()) return;
    unstack(st.sel); draw();
  }
  // hidden controls (KICK / SHURIKEN in the simple layout) wait on a free spot, not on top of a shown one
  function parkHidden() {
    const L = live(), T = TU();
    const busy = L.filter((k) => !st.items[k].h).map((k) => st.items[k]);
    for (const id of L) {
      const q = st.items[id];
      if (!q.h || !busy.some((o) => T.hits(q, o))) { if (q.h) busy.push(q); continue; }
      const f = T.freeSpot(q, busy, st.S, st.tb);
      if (f) { q.cx = f.cx; q.cy = f.cy; }
      busy.push(q);
    }
  }
  function preset(name) {
    const P = TU().presetPx(name, layoutOf(st.items), false, st.S, st.tb);
    for (const id in P) { P[id].h = TU().DPAD.includes(id) ? false : P[id].h; TU().keepIn(P[id], st.S); }
    st.items = P; st.left = name === 'left'; st.preset = name; st.dirty = true;
    parkHidden();
    draw();
  }

  // ---------------------------------------------------------------- pointer + buttons (one listener set on the root)
  function wire() {
    root.addEventListener('pointerdown', (e) => {
      const it = e.target.closest('.te-it');
      if (!it || drag) {
        if (!drag && e.target.closest('[data-stage]') && !e.target.closest('.te-it')) { st.sel = null; draw(); }
        return;
      }
      e.preventDefault();
      const id = it.dataset.id, q = st.items[id];
      const r = root.getBoundingClientRect();
      drag = { id, pid: e.pointerId, ox: q.cx - (e.clientX - r.left), oy: q.cy - (e.clientY - r.top), from: { cx: q.cx, cy: q.cy }, moved: false, x0: e.clientX, y0: e.clientY, r };
      try { it.setPointerCapture(e.pointerId); } catch (_) { /* yok */ }
      st.sel = id; st.preset = null;
      root.classList.add('dragging');
      for (const k of live()) { const el = itemEl(k); if (el) el.classList.toggle('sel', k === id); }
    });
    root.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 5) return;
      drag.moved = true; st.dirty = true;
      const q = st.items[drag.id];
      q.cx = snapV(e.clientX - drag.r.left + drag.ox);
      q.cy = snapV(e.clientY - drag.r.top + drag.oy);
      TU().keepIn(q, st.S);
      drawItem(drag.id);
      if (drag.id === 'stick') drawZone();
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag;
      drag = null;
      root.classList.remove('dragging');
      if (d.moved) unstack(d.id, d.from); else ui();
      draw();
    };
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);
    root.addEventListener('lostpointercapture', end);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !root.contains(b)) return;
      e.stopPropagation();
      const k = b.dataset.k, v = b.dataset.v, act = b.dataset.do, pre = b.dataset.pre;
      if (pre) { preset(pre); ui(); return; }
      if (k === 'move') {
        st.move = v;
        // the movement control coming in makes room if a button was put where it sits
        for (const id of (v === 'dpad' ? TU().DPAD : ['stick'])) {
          const q = st.items[id];
          if (!q.h && overlaps(id)) { const f = TU().freeSpot(q, others(id), st.S, st.tb); if (f) { q.cx = f.cx; q.cy = f.cy; } }
        }
      }
      else if (k === 'dtap' || k === 'snap') st[k] = !st[k];
      else if (k === 'hide') { const q = cur(); if (q && st.sel !== 'stick') { q.h = !q.h; st.dirty = true; if (!q.h) unstack(st.sel); } }
      else if (act === 'save') return save();
      else if (act === 'cancel') return close();
      else if (act === 'opts') { root.querySelector('[data-sheet]').hidden = false; st.sel = null; }
      else if (act === 'closeOpts') root.querySelector('[data-sheet]').hidden = true;
      else if (act === 'desel') st.sel = null;
      else if (act === 'reset') { st.op = 1; preset('right'); st.preset = null; msg(X().resetDone); }
      else return;
      ui();
      if (k === 'move' && st.sel && !live().includes(st.sel)) st.sel = null;
      draw();
      if (act === 'opts') { const f = root.querySelector('[data-sheet] .seg'); if (f) f.focus(); }
    });
    // tapping the dimmed backdrop around the options card closes it
    root.addEventListener('pointerdown', (e) => { if (e.target.matches && e.target.matches('[data-sheet]')) { root.querySelector('[data-sheet]').hidden = true; draw(); } });
  }

  // ---------------------------------------------------------------- open / save / close
  // One draft per screen shape: turning the phone (landscape ↔ portrait) or resizing to another shape keeps what was
  // already moved on the other one; Save stores every shape that was edited.
  function draftFor(S) {
    const P = TU().prefs, G = TU().resolve(P, S), L = P.lay[S.shape];
    const items = {};
    for (const id in G.items) items[id] = Object.assign({}, G.items[id]);
    return { S: G.S, tb: G.tb, items, left: L ? !!L.m : !!P.left, dirty: false };
  }
  const DRAFT = ['S', 'tb', 'items', 'left', 'dirty'];
  const takeDraft = () => { const d = {}; for (const k of DRAFT) d[k] = st[k]; return d; };
  // same controls, new screen size: same place relative to the screen
  function rescale(d, S) {
    const tb = TU().tbPx(TU().prefs.size, S.vh), kx = S.W / d.S.W, ky = S.H / d.S.H, kd = tb / d.tb;
    for (const id in d.items) { const q = d.items[id]; q.cx *= kx; q.cy *= ky; q.d *= kd; TU().keepIn(q, S); }
    d.S = S; d.tb = tb;
    return d;
  }
  function open() {
    const T = TU();
    if (!T || (root && !root.hidden)) return;
    const P = T.prefs;
    st = Object.assign({ move: P.move, dtap: !!P.dtap, op: P.op, snap: P.snap !== false, sel: null, preset: null, stash: {} }, draftFor(T.measure()));
    parkHidden();
    opener = document.activeElement;
    try { if (ND.input && ND.input.touchReset) ND.input.touchReset(); } catch (e) { /* yok */ }
    build();
    root.hidden = false;
    const app = $('app'); if (app) app.classList.add('t-editing');
    draw();
    keyH = (e) => {
      const inp = ND.input;
      // the editor owns the keyboard while open: nothing reaches the game or the menus behind it
      e.stopPropagation();
      if (e.type !== 'keydown') return;
      if (inp && inp.isBack && inp.isBack(e) && !(inp.isEditable && inp.isEditable(e.target))) {
        e.preventDefault();
        const sh = root.querySelector('[data-sheet]');
        if (!sh.hidden) { sh.hidden = true; draw(); } else close();
      }
    };
    window.addEventListener('keydown', keyH, true);
    window.addEventListener('keyup', keyH, true);
    try { root.focus({ preventScroll: true }); } catch (e) { /* yok */ }
  }
  function close() {
    if (!root || root.hidden) return;
    root.hidden = true;
    root.querySelector('[data-sheet]').hidden = true;
    drag = null; st = null;
    const app = $('app'); if (app) app.classList.remove('t-editing');
    if (keyH) { window.removeEventListener('keydown', keyH, true); window.removeEventListener('keyup', keyH, true); keyH = null; }
    ui();
    try { TU().refresh(); if (opener && opener.focus && document.contains(opener)) opener.focus({ preventScroll: true }); } catch (e) { /* yok */ }
    opener = null;
  }
  function save() {
    const T = TU(), P = T.prefs;
    if (st.S.shape === 'portrait') return;
    // a last check: nothing left on top of another control
    for (const id of live()) if (overlaps(id)) unstack(id);
    P.move = st.move; P.dtap = st.dtap; P.op = Math.round(st.op * 100) / 100; P.snap = st.snap;
    P.left = st.left;
    P.layout = layoutOf(st.items);
    for (const k in st.stash) { const d = st.stash[k]; if (d.dirty && k !== 'portrait') P.lay[k] = T.toLayout(d.items, d.S, d.tb, d.left); }
    P.lay[st.S.shape] = T.toLayout(st.items, st.S, st.tb, st.left);
    T.save();
    close();
    T.apply();
    try { if (ND.toast) ND.toast(X().saved || '', '忍'); } catch (e) { /* yok */ }
  }
  // screen resized / turned while editing
  function onResize() {
    if (!st || !root || root.hidden) return;
    const S = TU().measure();
    if (S.shape !== st.S.shape) {
      st.stash[st.S.shape] = takeDraft();
      const d = st.stash[S.shape];
      delete st.stash[S.shape];
      Object.assign(st, d ? rescale(d, S) : draftFor(S));
      st.sel = null; st.preset = null; drag = null; root.classList.remove('dragging');
      parkHidden();
    } else rescale(st, S);
    draw();
  }

  ND.touchEditor = { open, close, onResize, get isOpen() { return !!(root && !root.hidden); } };
  // texts change with the language: rebuild if open
  const start = () => { if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(() => { if (root && !root.hidden) { build(); draw(); } }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);
})(window.ND);
