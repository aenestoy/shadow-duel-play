// Shadow Duel — touch controls: player preferences, where every control sits, their settings panel, fullscreen and
// the portrait hint. The pad itself (stick, d-pad, buttons, multi-touch) lives in input.js; the layout editor in
// touch-editor.js. This file decides how the pad looks and behaves:
//   layout  'simple' (default: ATTACK, HEAVY, GUARD, KI, DASH) | 'full' (+ KICK, SHURIKEN)
//   size    's' | 'm' | 'l'  global scale of every control (--tb, the base button diameter)
//   left    left-handed: the default positions mirrored (movement on the right, buttons on the left)
//   move    'float' stick appears where the thumb lands | 'fixed' stick stays where it was put | 'dpad' ◀ ▶ ▲ ▼ buttons
//   dtap    d-pad only: a quick tap on ◀ / ▶ is one short step (double tap still dashes)
//   assist  input conveniences only (hold ATTACK to keep chaining, steadier stick): same rules, fair scores
//   haptic  short vibration on press where the browser supports it
//   op      opacity of every control (each control also has its own, multiplied)
//   snap    layout editor: snap to grid
//   lay     custom layouts made in the editor, one per screen shape ('phone' wide landscape, 'tablet', 'portrait'):
//           { v: 1, it: { id: { x, y, s, o, h } } }  x / y = centre as a fraction of the play area, s = diameter in
//           --tb units, o = own opacity, h = hidden. No saved layout for a shape → the default for that shape.
// Saved with the other settings (ND.save, key "touch"). Texts: ND.STR.touch.opt and ND.STR.tedit
// (Turkish in i18n.js, English in i18n-en.js).
(function (ND) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const num = (v) => typeof v === 'number' && isFinite(v);

  // ---------------------------------------------------------------- controls
  const ACTS = ['light', 'heavy', 'dodge', 'guard', 'kick', 'throw', 'special'];
  const DPAD = ['dl', 'dr', 'du', 'dd'];
  const IDS = ACTS.concat(['stick'], DPAD);
  // reference diameter (--tb units) of each control: its size slider reads 100 % ("M") there
  const BASE = { light: 1.3, heavy: 1, dodge: 0.85, guard: 1, kick: 1, throw: 0.85, special: 0.95, stick: 2.3, dl: 0.95, dr: 0.95, du: 0.95, dd: 0.95 };
  const RMIN = 0.7, RMAX = 1.5, OMIN = 0.2;

  // Default and preset positions, right-handed, in --tb units: [side, x, y, diameter]. side 'R': x from the right
  // edge, 'L': x from the left edge; y from the bottom. Low arc on the right, the top of the screen stays free.
  const MOVE_L = {
    stick: ['L', 1.42, 1.35, 2.3],
    dl: ['L', 0.63, 1.5, 0.95], dr: ['L', 2.47, 1.5, 0.95], du: ['L', 1.55, 2.42, 0.95], dd: ['L', 1.55, 0.58, 0.95],
  };
  const PRESETS = {
    right: {
      full: { light: ['R', 0.95, 0.9, 1.3], heavy: ['R', 2.4, 0.62, 1], dodge: ['R', 3.65, 0.52, 0.85], guard: ['R', 0.8, 2.25, 1],
        kick: ['R', 2.05, 1.85, 1], throw: ['R', 3.25, 1.6, 0.85], special: ['R', 4.45, 1.25, 0.95] },
      simple: { light: ['R', 0.98, 0.95, 1.45], heavy: ['R', 2.47, 0.68, 1.05], guard: ['R', 0.88, 2.52, 1.15], special: ['R', 2.25, 1.98, 1.02],
        dodge: ['R', 3.72, 0.58, 0.9], kick: ['R', 2.05, 1.85, 1], throw: ['R', 3.25, 1.6, 0.85] },
    },
    // GUARD under the left thumb, next to the movement control; the attacks keep the right thumb
    split: {
      full: { light: ['R', 0.95, 0.9, 1.3], heavy: ['R', 2.4, 0.62, 1], dodge: ['R', 3.65, 0.52, 0.85], special: ['R', 0.8, 2.25, 1],
        kick: ['R', 2.05, 1.85, 1], throw: ['R', 3.25, 1.6, 0.85], guard: ['L', 3.75, 0.8, 1.1] },
      simple: { light: ['R', 0.98, 0.95, 1.45], heavy: ['R', 2.3, 1.75, 1.1], special: ['R', 0.95, 2.55, 1.05], dodge: ['R', 2.55, 0.55, 0.95],
        guard: ['L', 3.75, 0.8, 1.15], kick: ['R', 3.3, 1.2, 1], throw: ['R', 3.4, 2.45, 0.85] },
    },
  };

  // ---------------------------------------------------------------- preferences
  const DEF = { layout: 'simple', size: 'm', left: false, assist: true, haptic: true, move: 'float', dtap: false, op: 1, snap: true, lay: {} };
  const OK = { layout: ['simple', 'full'], size: ['s', 'm', 'l'], move: ['float', 'fixed', 'dpad'] };
  const BOOLS = ['left', 'assist', 'haptic', 'dtap', 'snap'];
  const SHAPES = ['phone', 'tablet', 'portrait'];
  const T = () => (ND.STR && ND.STR.touch && ND.STR.touch.opt) || {};
  const E = () => (ND.STR && ND.STR.tedit) || {};

  // A saved layout, checked: unknown ids dropped, numbers kept in range. Positions are clamped into the screen
  // again every time they are used (resolve), so a layout made on another screen still fits.
  function cleanLayout(L) {
    if (!L || typeof L !== 'object' || !L.it || typeof L.it !== 'object') return null;
    const it = {};
    let n = 0;
    for (const id of IDS) {
      const q = L.it[id];
      if (!q || typeof q !== 'object' || !num(q.x) || !num(q.y)) continue;
      it[id] = {
        x: clamp(q.x, 0, 1), y: clamp(q.y, 0, 1),
        s: num(q.s) ? clamp(q.s, BASE[id] * RMIN, BASE[id] * RMAX) : BASE[id],
        o: num(q.o) ? clamp(q.o, OMIN, 1) : 1,
        h: q.h === true && id !== 'stick',
      };
      n++;
    }
    return n ? { v: 1, m: L.m === true, it } : null;
  }
  function read() {
    let s = null;
    try { s = ND.save ? ND.save.settings().touch : null; } catch (e) { /* storage blocked */ }
    const p = Object.assign({}, DEF, { lay: {} });
    if (s && typeof s === 'object') {
      for (const k in OK) if (OK[k].includes(s[k])) p[k] = s[k];
      for (const k of BOOLS) if (typeof s[k] === 'boolean') p[k] = s[k];
      if (num(s.op)) p.op = clamp(s.op, OMIN, 1);
      if (s.lay && typeof s.lay === 'object') for (const k of SHAPES) { const L = cleanLayout(s.lay[k]); if (L) p.lay[k] = L; }
    }
    return p;
  }
  const prefs = ND.touchPrefs = read();
  function save() {
    try {
      if (!ND.save) return;
      const s = ND.save.settings();
      s.touch = JSON.parse(JSON.stringify(prefs));
      ND.save.saveSettings(s);
    } catch (e) { /* storage blocked: the choice lasts this session */ }
  }

  // ---------------------------------------------------------------- screen measures
  // --tb follows the screen height like the CSS used to (clamp(56px, 16vh, 76px) for M); it is set in px on #app so the
  // stylesheet and this file always agree.
  const TB = { s: [48, 0.135, 64], m: [56, 0.16, 76], l: [62, 0.185, 88] };
  const tbPx = (size, vh) => { const t = TB[size] || TB.m; return Math.round(clamp(vh * t[1], t[0], t[2])); };
  let probe = null;
  function insets() {
    // notch / rounded-corner margins (env(safe-area-inset-*)) read through a hidden probe
    try {
      if (!probe) {
        probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;left:0;top:0;width:0;height:0;padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)';
        document.body.appendChild(probe);
      }
      const cs = getComputedStyle(probe);
      return { l: parseFloat(cs.paddingLeft) || 0, r: parseFloat(cs.paddingRight) || 0 };
    } catch (e) { return { l: 0, r: 0 }; }
  }
  // The play area (#app, already inside the top/bottom safe areas) and what depends on it
  function measure() {
    const app = $('app');
    const W = (app && app.clientWidth) || window.innerWidth || 800, H = (app && app.clientHeight) || window.innerHeight || 450;
    const a = W / H, ins = insets();
    return { W, H, sl: ins.l, sr: ins.r, vh: window.innerHeight || H, shape: a >= 1.55 ? 'phone' : a >= 1 ? 'tablet' : 'portrait' };
  }

  // ---------------------------------------------------------------- geometry
  // Every control as pixels in the play area: { id: { cx, cy, d, o, h } }
  function presetPx(name, layout, left, S, tb) {
    const P = PRESETS[name === 'left' ? 'right' : name] || PRESETS.right;
    const src = Object.assign({}, MOVE_L, P[layout] || P.simple);
    const out = {};
    for (const id of IDS) {
      const q = src[id];
      // mirrored (left hand): the same distances from the other edge, each edge with its own notch margin
      const side = (left || name === 'left') === (q[0] === 'R') ? 'L' : 'R';
      const cx = side === 'R' ? S.W - S.sr - 6 - q[1] * tb : S.sl + 6 + q[1] * tb;
      const cy = S.H - 6 - q[2] * tb;
      out[id] = { cx, cy, d: q[3] * tb, o: 1, h: layout === 'simple' && (id === 'kick' || id === 'throw') };
    }
    return out;
  }
  const box = (q, S) => {
    const r = q.d / 2, m = 3;
    return { x0: S.sl + r + m, x1: S.W - S.sr - r - m, y0: r + m, y1: S.H - r - m };
  };
  function keepIn(q, S) {
    const b = box(q, S);
    q.cx = b.x1 < b.x0 ? S.W / 2 : clamp(q.cx, b.x0, b.x1);
    q.cy = b.y1 < b.y0 ? S.H / 2 : clamp(q.cy, b.y0, b.y1);
    return q;
  }
  // which controls are on screen together: the buttons plus the stick or the d-pad
  const liveIds = (move) => ACTS.concat(move === 'dpad' ? DPAD : ['stick']);
  const hits = (a, b, pad = 2) => Math.hypot(a.cx - b.cx, a.cy - b.cy) < (a.d + b.d) / 2 + pad;
  // Nearest spot for q where it overlaps none of `others` and stays on screen (spiral search); null if there is none
  function freeSpot(q, others, S, tb) {
    const b = box(q, S), ok = (x, y) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1 && !others.some((o) => hits({ cx: x, cy: y, d: q.d }, o));
    if (ok(q.cx, q.cy)) return { cx: q.cx, cy: q.cy };
    const step = Math.max(4, tb * 0.12);
    for (let r = step; r <= tb * 5; r += step) {
      const n = Math.max(12, Math.round((2 * Math.PI * r) / step));
      let best = null, bd = Infinity;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, x = q.cx + Math.cos(a) * r, y = q.cy + Math.sin(a) * r;
        // prefer spots lower on the screen (thumbs rest low) when two are as close
        if (ok(x, y)) { const d = -y * 0.001; if (d < bd) { bd = d; best = { cx: x, cy: y }; } }
      }
      if (best) return best;
    }
    return null;
  }
  // Pixel layout for a set of preferences on screen S. Custom layout for this screen shape when there is one, the
  // default otherwise; every control clamped into the safe area, overlaps (after a size change or a smaller screen)
  // pushed to the nearest free spot.
  function resolve(P, S) {
    P = P || prefs; S = S || measure();
    const tb = tbPx(P.size, S.vh);
    const def = presetPx(P.left ? 'left' : 'right', P.layout, false, S, tb);
    const L = P.lay && P.lay[S.shape];
    const items = {};
    for (const id of IDS) {
      const q = L && L.it[id];
      items[id] = q ? { cx: q.x * S.W, cy: q.y * S.H, d: q.s * tb, o: q.o, h: q.h } : Object.assign({}, def[id]);
      keepIn(items[id], S);
    }
    settle(items, liveIds(P.move), S, tb);
    return { S, tb, items };
  }
  function settle(items, ids, S, tb) {
    const placed = [];
    for (const id of ids) {
      const q = items[id];
      if (q.h) continue;
      if (placed.some((o) => hits(q, o, 0))) { const f = freeSpot(q, placed, S, tb); if (f) { q.cx = f.cx; q.cy = f.cy; } }
      placed.push(q);
    }
  }
  // pixels → a layout to save (fractions of the play area)
  function toLayout(items, S, tb, mirrored) {
    const it = {}, r4 = (v) => Math.round(v * 1e4) / 1e4;
    for (const id of IDS) { const q = items[id]; if (q) it[id] = { x: r4(q.cx / S.W), y: r4(q.cy / S.H), s: r4(q.d / tb), o: r4(q.o), h: !!q.h && id !== 'stick' }; }
    return { v: 1, m: !!mirrored, it };
  }

  // ---------------------------------------------------------------- look of the pad
  // DOM writes only here (preference change, resize, rotation): the pad never moves per frame.
  let geo = null;
  function place(el, q, tb) {
    if (!el) return;
    el.style.width = el.style.height = q.d.toFixed(1) + 'px';
    el.style.translate = `${(q.cx - q.d / 2).toFixed(1)}px ${(q.cy - q.d / 2).toFixed(1)}px`;
    el.style.setProperty('--r', (q.d / tb).toFixed(3));
  }
  // Where the stick listens: 'fixed' → a square around the base; 'float' → the base's side of the screen, from a
  // little above it down to the bottom (buttons placed inside it sit on top and win their touches)
  function stickZone(move, st, S) {
    let x, y, w, h;
    if (move === 'fixed') {
      const e = st.d * 0.8;
      x = Math.max(0, st.cx - e); y = Math.max(0, st.cy - e); w = Math.min(S.W, st.cx + e) - x; h = Math.min(S.H, st.cy + e) - y;
    } else {
      w = clamp(Math.max(S.W * 0.44, (st.cx < S.W / 2 ? st.cx : S.W - st.cx) + st.d * 0.7), 0, S.W * 0.6);
      x = st.cx < S.W / 2 ? 0 : S.W - w;
      y = clamp(Math.min(S.H * 0.24, st.cy - st.d * 0.75), 0, S.H * 0.5); h = S.H - y;
    }
    return { x, y, w, h };
  }
  function layoutPad() {
    const pad = $('touch'), app = $('app');
    if (!pad || !app) return;
    const G = geo = resolve();
    const { S, tb, items } = G;
    app.style.setProperty('--tb', tb + 'px');
    pad.style.setProperty('--op', prefs.op);
    pad.dataset.move = prefs.move;
    for (const b of pad.querySelectorAll('[data-act]')) {
      const q = items[b.dataset.act === 'special' ? 'special' : b.dataset.act];
      if (!q) continue;
      b.style.display = q.h ? 'none' : '';
      b.style.setProperty('--o', q.o);
      place(b, q, tb);
    }
    const dmap = { left: 'dl', right: 'dr', up: 'du', guard: 'dd' };
    for (const b of pad.querySelectorAll('[data-dir]')) {
      const q = items[dmap[b.dataset.dir]];
      b.style.display = q.h ? 'none' : '';
      b.style.setProperty('--o', q.o);
      place(b, q, tb);
    }
    // stick: 'float' → a zone on its side of the screen (the base rests at its spot, jumps to the thumb);
    // 'fixed' → a zone around the base, which never moves
    const zone = $('tStick'), base = $('tBase'), st = items.stick;
    if (zone && base) {
      const { x, y, w, h } = stickZone(prefs.move, st, S);
      zone.style.left = x.toFixed(1) + 'px'; zone.style.top = y.toFixed(1) + 'px';
      zone.style.width = w.toFixed(1) + 'px'; zone.style.height = h.toFixed(1) + 'px';
      zone._nd = { fixed: prefs.move === 'fixed', rx: st.cx - x, ry: st.cy - y, d: st.d };
      base.style.width = base.style.height = st.d.toFixed(1) + 'px';
      base.style.setProperty('--o', st.o);
      base.style.setProperty('--r', (st.d / tb).toFixed(3));
    }
  }
  function apply(keepFingers) {
    const pad = $('touch'), app = $('app');
    if (pad) { pad.classList.toggle('simple', prefs.layout === 'simple'); pad.classList.toggle('full', prefs.layout === 'full'); }
    if (app) { app.dataset.tsize = prefs.size; app.classList.toggle('t-left', isLeft()); }
    layoutPad();
    // fingers still down belong to the old layout: let them go (the button boxes are measured again). A plain resize
    // (browser bars sliding in and out) keeps them: the next touch measures the new boxes.
    try {
      if (ND.input) { if (!keepFingers && ND.input.touchReset) ND.input.touchReset(); else if (ND.input.touchRelayout) ND.input.touchRelayout(); }
    } catch (e) { /* yok */ }
    refresh();
  }
  let rsz = 0;
  const onResize = () => { if (rsz) return; rsz = requestAnimationFrame(() => { rsz = 0; apply(true); if (ND.touchEditor && ND.touchEditor.onResize) ND.touchEditor.onResize(); }); };
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });

  // ---------------------------------------------------------------- keeping options and saved layouts coherent
  function eachLayout(fn) { for (const k of SHAPES) if (prefs.lay[k]) fn(prefs.lay[k]); }
  // Simple / Full on a custom layout: shows or hides KICK and SHURIKEN (resolve moves them if they land on a button)
  function setLayout(v) {
    prefs.layout = v;
    eachLayout((L) => ['kick', 'throw'].forEach((id) => { if (L.it[id]) L.it[id].h = v === 'simple'; }));
  }
  // Left-handed: the mirror image of whatever layout is in use. Each saved layout remembers whether it is mirrored
  // (m), so switching hands flips only the layouts that are the other way round; the defaults mirror themselves.
  function setLeft(v) {
    v = !!v;
    prefs.left = v;
    eachLayout((L) => { if (!!L.m === v) return; L.m = v; for (const id in L.it) L.it[id].x = Math.round((1 - L.it[id].x) * 1e4) / 1e4; });
  }
  // the hand shown in the settings: the current screen's saved layout, else the preference
  function isLeft() { const L = prefs.lay[measure().shape]; return L ? !!L.m : !!prefs.left; }

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
    const O = T(), S = O.sizes || {}, X = E(), M = X.moves || {};
    const seg = (k, v, label) => `<button type="button" class="seg" data-tp="${k}" data-v="${v}">${esc(label)}</button>`;
    const tog = (k, label, extra) => `<button type="button" class="tog" data-tp="${k}"${extra || ''}><i></i><span>${esc(label)}</span></button>`;
    box.innerHTML =
      `<h3>${esc(O.title)}</h3>` +
      `<div class="ts-row"><span>${esc(X.move)}</span>${seg('move', 'float', M.float)}${seg('move', 'fixed', M.fixed)}${seg('move', 'dpad', M.dpad)}</div>` +
      `<div class="ts-row"><span>${esc(O.layout)}</span>${seg('layout', 'simple', O.simple)}${seg('layout', 'full', O.full)}</div>` +
      `<div class="ts-row"><span>${esc(O.size)}</span>${seg('size', 's', S.s)}${seg('size', 'm', S.m)}${seg('size', 'l', S.l)}</div>` +
      `<div class="ts-row"><span>${esc(O.hand)}</span>${seg('left', '0', O.right)}${seg('left', '1', O.left)}</div>` +
      `<div class="ts-togs">${tog('dtap', X.dtap, ' data-dp')}${tog('assist', O.assist)}${canVibrate() ? tog('haptic', O.haptic) : ''}</div>` +
      `<div class="ts-acts"><button type="button" class="mini ts-edit" data-tedit>${esc(X.edit)}</button>` +
      `<button type="button" class="mini ts-fs" data-fs hidden></button></div>` +
      (withNote && O.note ? `<p class="ts-note">${esc(O.note)}</p>` : '');
    box.querySelectorAll('[data-tp]').forEach((b) => (b.onclick = (e) => {
      e.stopPropagation();
      const k = b.dataset.tp;
      if (k === 'assist' || k === 'haptic' || k === 'dtap') prefs[k] = !prefs[k];
      else if (k === 'left') setLeft(b.dataset.v === '1');
      else if (k === 'layout') setLayout(b.dataset.v);
      else prefs[k] = b.dataset.v;
      save(); apply();
      try { if (ND.audio && ND.audio.ready) ND.audio.ui(); } catch (err) { /* yok */ }
    }));
    const fs = box.querySelector('[data-fs]');
    if (fs) fs.onclick = (e) => { e.stopPropagation(); toggleFullscreen(); };
    const ed = box.querySelector('[data-tedit]');
    if (ed) ed.onclick = (e) => { e.stopPropagation(); if (ND.touchEditor) ND.touchEditor.open(); };
  }
  // pressed states + fullscreen label on every panel
  function refresh() {
    const O = T(), left = isLeft();
    document.querySelectorAll('.tset').forEach((box) => {
      box.querySelectorAll('[data-tp]').forEach((b) => {
        const k = b.dataset.tp;
        const on = k === 'assist' || k === 'haptic' || k === 'dtap' ? !!prefs[k] : k === 'left' ? String(+left) === b.dataset.v : prefs[k] === b.dataset.v;
        b.setAttribute('aria-pressed', String(on));
      });
      const dp = box.querySelector('[data-dp]');
      if (dp) dp.hidden = prefs.move !== 'dpad';
      const fs = box.querySelector('[data-fs]');
      if (fs) { fs.hidden = !fsAllowed(); fs.textContent = fsElement() ? O.exitFullscreen || '' : O.fullscreen || ''; }
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
  ND.touchUI = {
    prefs, apply, refresh, rebuild: buildAll, toggleFullscreen, fsAllowed, save,
    // for the layout editor (touch-editor.js)
    IDS, ACTS, DPAD, BASE, RMIN, RMAX, OMIN, measure, tbPx, resolve, presetPx, keepIn, freeSpot, hits, liveIds, toLayout, setLeft, stickZone,
    geo: () => geo,
  };
  apply();
  // texts come from ND.STR, which i18n translates after this file runs: build once everything has loaded
  const start = () => {
    buildAll(); hookMoves();
    if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(buildAll);
    // portrait hint during a fight: a way out without turning the phone
    const rm = $('rotMenu'), bm = $('bMenu');
    if (rm && bm) rm.onclick = () => bm.click();
    // the first layout ran before the fonts / final size: measure again once everything is in place
    apply(true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);
})(window.ND);
