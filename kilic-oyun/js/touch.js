





























(function (ND) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const num = (v) => typeof v === 'number' && isFinite(v);


  const ACTS = ['light', 'heavy', 'dodge', 'kick', 'throw', 'special'];
  const DPAD = ['dl', 'dr', 'du', 'dd'];
  const IDS = ACTS.concat(DPAD, ['pause', 'ctx']);

  const BASE = { light: 1.3, heavy: 1, dodge: 0.85, kick: 1, throw: 0.85, special: 0.95, dl: 0.95, dr: 0.95, du: 0.95, dd: 0.95, pause: 0.56, ctx: 0.8 };

  const KEEP = { dl: 1, dr: 1, du: 1, dd: 1, pause: 1 };

  const ARM = 0.92;

  const flag = (k, ok, def) => { try { const v = ND.qs && ND.qs.get(k); return ok.includes(v) ? v : def; } catch (e) { return def; } };
  const DLOOK = flag('dpad', ['a', 'b'], 'b');
  const PPOS = flag('pausepos', ['corner', 'top'], 'corner');
  const RMIN = 0.7, RMAX = 1.5, OMIN = 0.2;



  const MOVE_L = {
    dl: ['L', 0.63, 1.5, 0.95], dr: ['L', 2.47, 1.5, 0.95], du: ['L', 1.55, 2.42, 0.95], dd: ['L', 1.55, 0.58, 0.95],
  };


  const PRESETS = {
    right: {
      full: { light: ['R', 0.95, 0.9, 1.3], heavy: ['R', 2.4, 0.62, 1], dodge: ['R', 3.65, 0.52, 0.85], special: ['R', 0.8, 2.25, 1],
        kick: ['R', 2.05, 1.85, 1], throw: ['R', 3.25, 1.6, 0.85], ctx: ['R', 1.66, 2.8, 0.8] },
      simple: { light: ['R', 0.98, 0.95, 1.45], heavy: ['R', 2.3, 1.75, 1.1], special: ['R', 0.95, 2.55, 1.05], dodge: ['R', 2.55, 0.55, 0.95],
        kick: ['R', 3.3, 1.2, 1], throw: ['R', 3.4, 2.45, 0.85], ctx: ['R', 1.95, 3.05, 0.8] },
    },
  };


  const DEF = { layout: 'full', lpick: false, size: 'm', left: false, assist: true, haptic: true, move: 'dpad', dtap: false, op: 1, snap: true, lay: {} };
  const OK = { layout: ['simple', 'full'], size: ['s', 'm', 'l'] };
  const BOOLS = ['left', 'assist', 'haptic', 'dtap', 'snap', 'lpick'];
  const SHAPES = ['phone', 'tablet', 'portrait'];
  const T = () => (ND.STR && ND.STR.touch && ND.STR.touch.opt) || {};
  const E = () => (ND.STR && ND.STR.tedit) || {};





  function cleanLayout(L, fromStick) {
    if (!L || typeof L !== 'object' || !L.it || typeof L.it !== 'object') return null;
    const it = {};
    let n = 0, dc = null;
    const sq = L.it.stick, dq = L.dc;
    if (fromStick && sq && typeof sq === 'object' && num(sq.x) && num(sq.y)) dc = { x: clamp(sq.x, 0, 1), y: clamp(sq.y, 0, 1) };
    else if (dq && typeof dq === 'object' && num(dq.x) && num(dq.y)) dc = { x: clamp(dq.x, 0, 1), y: clamp(dq.y, 0, 1) };
    for (const id of IDS) {
      const q = L.it[id];
      if (!q || typeof q !== 'object' || !num(q.x) || !num(q.y)) continue;
      if (dc && DPAD.includes(id)) continue;
      it[id] = {
        x: clamp(q.x, 0, 1), y: clamp(q.y, 0, 1),
        s: num(q.s) ? clamp(q.s, BASE[id] * RMIN, BASE[id] * RMAX) : BASE[id],
        o: num(q.o) ? clamp(q.o, OMIN, 1) : 1,
        h: q.h === true && !KEEP[id],
      };
      n++;
    }
    if (!n) return null;

    if (it.dl && it.dr && it.dl.x > it.dr.x) { const a = it.dl, b = it.dr, t = { x: a.x, y: a.y }; a.x = b.x; a.y = b.y; b.x = t.x; b.y = t.y; }
    const out = { v: 1, m: L.m === true, it };
    if (dc) out.dc = dc;
    return out;
  }


  const NEW_DEF = { dtap: true };
  function newPlayer() {
    try { const p = ND.save && ND.save.p; return !!p && !p.fought; } catch (e) { return false; }
  }

  function showAll(p) { for (const k of SHAPES) { const L = p.lay[k]; if (L) for (const id of ['kick', 'throw']) if (L.it[id]) L.it[id].h = false; } }
  function read() {
    let s = null;
    try { s = ND.save ? ND.save.settings().touch : null; } catch (e) {                       }
    const p = Object.assign({}, DEF, { lay: {} });
    if (!(s && typeof s === 'object') && newPlayer()) { Object.assign(p, NEW_DEF); p.fresh = true; }
    if (s && typeof s === 'object') {
      for (const k in OK) if (OK[k].includes(s[k])) p[k] = s[k];
      for (const k of BOOLS) if (typeof s[k] === 'boolean') p[k] = s[k];
      if (num(s.op)) p.op = clamp(s.op, OMIN, 1);

      const stick = s.move === 'float' || s.move === 'fixed';
      if (s.lay && typeof s.lay === 'object') for (const k of SHAPES) { const L = cleanLayout(s.lay[k], stick); if (L) p.lay[k] = L; }
      if (stick) p.fresh = true;

      if (p.layout === 'simple' && !p.lpick) { p.layout = 'full'; showAll(p); p.fresh = true; }
    }
    return p;
  }
  const prefs = ND.touchPrefs = read();
  function save() {
    try {
      if (!ND.save) return;
      const s = ND.save.settings();
      s.touch = JSON.parse(JSON.stringify(prefs));
      delete s.touch.fresh;
      ND.save.saveSettings(s);
    } catch (e) {                                                      }
  }

  if (prefs.fresh) { delete prefs.fresh; save(); }




  const TB = { s: [48, 0.135, 64], m: [56, 0.16, 76], l: [62, 0.185, 88] };
  const tbPx = (size, vh) => { const t = TB[size] || TB.m; return Math.round(clamp(vh * t[1], t[0], t[2])); };
  let probe = null;
  function insets() {

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

  function measure() {
    const app = $('app');
    const W = (app && app.clientWidth) || window.innerWidth || 800, H = (app && app.clientHeight) || window.innerHeight || 450;
    const a = W / H, ins = insets();
    return { W, H, sl: ins.l, sr: ins.r, vh: window.innerHeight || H, shape: a >= 1.55 ? 'phone' : a >= 1 ? 'tablet' : 'portrait' };
  }



  function presetPx(name, layout, left, S, tb) {
    const P = PRESETS[name === 'left' ? 'right' : name] || PRESETS.right;
    const src = Object.assign({}, MOVE_L, P[layout] || P.simple);
    const out = { pause: pauseDefault(S, tb) };
    const mir = left || name === 'left';
    for (const id of IDS) {

      const q = src[mir && id === 'dl' ? 'dr' : mir && id === 'dr' ? 'dl' : id];
      if (!q) continue;

      const side = mir === (q[0] === 'R') ? 'L' : 'R';
      const cx = side === 'R' ? S.W - S.sr - 6 - q[1] * tb : S.sl + 6 + q[1] * tb;
      const cy = S.H - 6 - q[2] * tb;
      out[id] = { cx, cy, d: q[3] * tb, o: 1, h: layout === 'simple' && (id === 'kick' || id === 'throw') };
    }
    return out;
  }




  function pauseDefault(S, tb) {
    const d = BASE.pause * tb, short = S.vh <= 500, W = S.W;
    if (PPOS === 'top') {
      const clockB = short ? 40 : 44 + clamp(W * 0.036, 26, 40);
      return { cx: W / 2, cy: clockB + 4 + d / 2, d, o: 1, h: false };
    }
    const hudB = short ? 60 : 58 + clamp(W * 0.019, 14, 20) + clamp(W * 0.018, 12, 18);
    return { cx: W - S.sr - 14 - d / 2, cy: hudB + 8 + d / 2, d, o: 1, h: false };
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



  const liveIds = () => DPAD.concat(ACTS, ['pause', 'ctx']);

  function dpadAround(cx, cy, S, tb) {
    const d = BASE.dl * tb, e = ARM * tb + d / 2 + 3;
    cx = clamp(cx, S.sl + e, Math.max(S.sl + e, S.W - S.sr - e)); cy = clamp(cy, e, Math.max(e, S.H - e));
    const o = (x, y) => ({ cx: cx + x * ARM * tb, cy: cy + y * ARM * tb, d, o: 1, h: false });
    return { dl: o(-1, 0), dr: o(1, 0), du: o(0, -1), dd: o(0, 1) };
  }
  const hits = (a, b, pad = 2) => Math.hypot(a.cx - b.cx, a.cy - b.cy) < (a.d + b.d) / 2 + pad;

  function freeSpot(q, others, S, tb) {
    const b = box(q, S), ok = (x, y) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1 && !others.some((o) => hits({ cx: x, cy: y, d: q.d }, o));
    if (ok(q.cx, q.cy)) return { cx: q.cx, cy: q.cy };
    const step = Math.max(4, tb * 0.12);
    for (let r = step; r <= tb * 5; r += step) {
      const n = Math.max(12, Math.round((2 * Math.PI * r) / step));
      let best = null, bd = Infinity;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, x = q.cx + Math.cos(a) * r, y = q.cy + Math.sin(a) * r;

        if (ok(x, y)) { const d = -y * 0.001; if (d < bd) { bd = d; best = { cx: x, cy: y }; } }
      }
      if (best) return best;
    }
    return null;
  }



  function resolve(P, S) {
    P = P || prefs; S = S || measure();
    const tb = tbPx(P.size, S.vh);
    const def = presetPx(P.left ? 'left' : 'right', P.layout, false, S, tb);
    const L = P.lay && P.lay[S.shape];
    const items = {};
    const dc = L && L.dc ? dpadAround(L.dc.x * S.W, L.dc.y * S.H, S, tb) : null;
    for (const id of IDS) {
      const q = L && L.it[id];
      items[id] = q ? { cx: q.x * S.W, cy: q.y * S.H, d: q.s * tb, o: q.o, h: q.h && !KEEP[id] } : Object.assign({}, (dc && dc[id]) || def[id]);
      keepIn(items[id], S);
    }
    settle(items, liveIds(), S, tb);
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

  function toLayout(items, S, tb, mirrored) {
    const it = {}, r4 = (v) => Math.round(v * 1e4) / 1e4;
    for (const id of IDS) { const q = items[id]; if (q) it[id] = { x: r4(q.cx / S.W), y: r4(q.cy / S.H), s: r4(q.d / tb), o: r4(q.o), h: !!q.h && !KEEP[id] }; }
    return { v: 1, m: !!mirrored, it };
  }



  let geo = null;
  function place(el, q, tb) {
    if (!el) return;
    el.style.width = el.style.height = q.d.toFixed(1) + 'px';
    el.style.translate = `${(q.cx - q.d / 2).toFixed(1)}px ${(q.cy - q.d / 2).toFixed(1)}px`;
    el.style.setProperty('--r', (q.d / tb).toFixed(3));
  }




  function swipeZone(st, S, pz) {
    const w = clamp(Math.max(S.W * 0.44, (st.cx < S.W / 2 ? st.cx : S.W - st.cx) + st.d * 0.7), 0, S.W * 0.6);
    const x = st.cx < S.W / 2 ? 0 : S.W - w;
    let y = clamp(Math.min(S.H * 0.24, st.cy - st.d * 0.75), 0, S.H * 0.5), h = S.H - y;
    if (pz && !pz.h) {
      const r = pz.d / 2, pb = pz.cy + r + 6;
      if (pz.cx + r > x && pz.cx - r < x + w && pz.cy - r < y + h && pb > y && pb < st.cy - st.d * 0.5) { h -= pb - y; y = pb; }
    }
    return { x, y, w, h };
  }


  function dpadRing(items, tb) {
    const q = {};
    let n = 0;
    for (const id of DPAD) if (items[id] && !items[id].h) { q[id] = items[id]; n++; }
    if (n < 3) return null;
    const vis = Object.values(q), avg = (k) => vis.reduce((a, v) => a + v[k], 0) / n;
    const cx = q.dl && q.dr ? (q.dl.cx + q.dr.cx) / 2 : avg('cx');
    const cy = q.du && q.dd ? (q.du.cy + q.dd.cy) / 2 : avg('cy');
    let rMin = Infinity, rMax = 0, ext = 0;
    for (const id in q) {
      const b = q[id], dx = b.cx - cx, dy = b.cy - cy, r = Math.hypot(dx, dy);

      const along = id === 'dl' ? -dx : id === 'dr' ? dx : id === 'du' ? -dy : dy;
      const across = id === 'dl' || id === 'dr' ? Math.abs(dy) : Math.abs(dx);
      if (along < b.d * 0.3 || across > along * 0.45) return null;
      rMin = Math.min(rMin, r); rMax = Math.max(rMax, r); ext = Math.max(ext, r + b.d / 2);
    }
    const aw = avg('d');

    if (rMax > rMin * 1.5 || rMax - aw / 2 > tb * 1.1) return null;
    return { cx, cy, d: ext * 2 + 4, aw, o: avg('o') };
  }
  function layoutPad() {
    const pad = $('touch'), app = $('app');
    if (!pad || !app) return;
    const G = geo = resolve();
    const { S, tb, items } = G;
    app.style.setProperty('--tb', tb + 'px');
    app.dataset.ppos = PPOS;
    pad.style.setProperty('--op', prefs.op);
    pad.dataset.move = prefs.move;
    pad.dataset.dlook = DLOOK;

    const pb = $('pauseBtn');
    if (pb) {
      const pz = items.pause, pd = pauseDefault(S, tb), px = (v) => v.toFixed(1) + 'px';
      pb.style.setProperty('--pd', px(pd.d)); pb.style.setProperty('--pdx', px(pd.cx - pd.d / 2)); pb.style.setProperty('--pdy', px(pd.cy - pd.d / 2));
      pb.style.setProperty('--pp', px(pz.d)); pb.style.setProperty('--ppx', px(pz.cx - pz.d / 2)); pb.style.setProperty('--ppy', px(pz.cy - pz.d / 2));
      pb.style.setProperty('--o', pz.o);
    }

    const ring = $('tDring'), R = dpadRing(items, tb);
    if (ring) {
      ring.hidden = !R;
      if (R) {
        ring.style.width = ring.style.height = R.d.toFixed(1) + 'px';
        ring.style.translate = `${(R.cx - R.d / 2).toFixed(1)}px ${(R.cy - R.d / 2).toFixed(1)}px`;
        ring.style.setProperty('--aw', ((R.aw / R.d) * 50).toFixed(2) + '%');
        ring.style.setProperty('--o', R.o.toFixed(2));
      }
    }
    pad.classList.toggle('d-one', !!R);
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


    const sz = $('tSwipe');
    if (sz) {
      const avg = (k) => DPAD.reduce((a, id) => a + items[id][k], 0) / DPAD.length;
      const c = R ? { cx: R.cx, cy: R.cy, d: 2.3 * tb } : { cx: avg('cx'), cy: avg('cy'), d: 2.3 * tb };
      const { x, y, w, h } = swipeZone(c, S, items.pause);
      sz.style.left = x.toFixed(1) + 'px'; sz.style.top = y.toFixed(1) + 'px';
      sz.style.width = w.toFixed(1) + 'px'; sz.style.height = h.toFixed(1) + 'px';
    }
  }
  function apply(keepFingers) {
    const pad = $('touch'), app = $('app');
    if (pad) { pad.classList.toggle('simple', prefs.layout === 'simple'); pad.classList.toggle('full', prefs.layout === 'full'); }
    if (app) { app.dataset.tsize = prefs.size; app.classList.toggle('t-left', isLeft()); }
    layoutPad();


    try {
      if (ND.input) { if (!keepFingers && ND.input.touchReset) ND.input.touchReset(); else if (ND.input.touchRelayout) ND.input.touchRelayout(); }
    } catch (e) {           }
    refresh();
  }
  let rsz = 0;
  const onResize = () => { if (rsz) return; rsz = requestAnimationFrame(() => { rsz = 0; apply(true); if (ND.touchEditor && ND.touchEditor.onResize) ND.touchEditor.onResize(); }); };
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });


  function eachLayout(fn) { for (const k of SHAPES) if (prefs.lay[k]) fn(prefs.lay[k]); }

  function setLayout(v) {
    prefs.layout = v;
    eachLayout((L) => ['kick', 'throw'].forEach((id) => { if (L.it[id]) L.it[id].h = v === 'simple'; }));
  }


  function setLeft(v) {
    v = !!v;
    prefs.left = v;
    eachLayout((L) => {
      if (!!L.m === v) return;
      L.m = v;
      for (const id in L.it) if (id !== 'pause') L.it[id].x = Math.round((1 - L.it[id].x) * 1e4) / 1e4;
      if (L.dc) L.dc.x = Math.round((1 - L.dc.x) * 1e4) / 1e4;

      const a = L.it.dl, b = L.it.dr;
      if (a && b) { const t = { x: a.x, y: a.y }; a.x = b.x; a.y = b.y; b.x = t.x; b.y = t.y; }
    });
  }

  function isLeft() { const L = prefs.lay[measure().shape]; return L ? !!L.m : !!prefs.left; }




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

      const lock = () => { try { const o = screen.orientation; if (o && o.lock && ND.touch && ND.touch.active) o.lock('landscape').catch(() => {}); } catch (e) {           } };
      if (p && p.then) p.then(lock).catch(() => {}); else lock();
    } catch (e) {                              }
  }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => doc.addEventListener(ev, () => refresh()));


  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const canVibrate = () => typeof navigator.vibrate === 'function';
  function build(box, withNote) {
    if (!box) return;
    const O = T(), S = O.sizes || {}, X = E();
    const seg = (k, v, label) => `<button type="button" class="seg" data-tp="${k}" data-v="${v}">${esc(label)}</button>`;
    const tog = (k, label, extra) => `<button type="button" class="tog" data-tp="${k}"${extra || ''}><i></i><span>${esc(label)}</span></button>`;
    box.innerHTML =
      `<h3>${esc(O.title)}</h3>` +
      `<div class="ts-row"><span>${esc(O.layout)}</span>${seg('layout', 'simple', O.simple)}${seg('layout', 'full', O.full)}</div>` +
      `<div class="ts-row"><span>${esc(O.size)}</span>${seg('size', 's', S.s)}${seg('size', 'm', S.m)}${seg('size', 'l', S.l)}</div>` +
      `<div class="ts-row"><span>${esc(O.hand)}</span>${seg('left', '0', O.right)}${seg('left', '1', O.left)}</div>` +
      `<div class="ts-togs">${tog('dtap', X.dtap)}${tog('assist', O.assist)}${canVibrate() ? tog('haptic', O.haptic) : ''}</div>` +
      `<div class="ts-acts"><button type="button" class="mini ts-edit" data-tedit>${esc(X.edit)}</button>` +
      `<button type="button" class="mini ts-fs" data-fs hidden></button></div>` +
      (withNote && O.note ? `<p class="ts-note">${esc(O.note)}</p>` : '');
    box.querySelectorAll('[data-tp]').forEach((b) => (b.onclick = (e) => {
      e.stopPropagation();
      const k = b.dataset.tp;
      if (k === 'assist' || k === 'haptic' || k === 'dtap') prefs[k] = !prefs[k];
      else if (k === 'left') setLeft(b.dataset.v === '1');
      else if (k === 'layout') { setLayout(b.dataset.v); prefs.lpick = true; }
      else if (OK[k] && OK[k].includes(b.dataset.v)) prefs[k] = b.dataset.v;
      save(); apply();
      try { if (ND.audio && ND.audio.ready) ND.audio.ui(); } catch (err) {           }
    }));
    const fs = box.querySelector('[data-fs]');
    if (fs) fs.onclick = (e) => { e.stopPropagation(); toggleFullscreen(); };
    const ed = box.querySelector('[data-tedit]');
    if (ed) ed.onclick = (e) => { e.stopPropagation(); if (ND.touchEditor) ND.touchEditor.open(); };
  }

  function refresh() {
    const O = T(), left = isLeft();
    document.querySelectorAll('.tset').forEach((box) => {
      box.querySelectorAll('[data-tp]').forEach((b) => {
        const k = b.dataset.tp;
        const on = k === 'assist' || k === 'haptic' || k === 'dtap' ? !!prefs[k] : k === 'left' ? String(+left) === b.dataset.v : prefs[k] === b.dataset.v;
        b.setAttribute('aria-pressed', String(on));
      });
      const fs = box.querySelector('[data-fs]');
      if (fs) { fs.hidden = !fsAllowed(); fs.textContent = fsElement() ? O.exitFullscreen || '' : O.fullscreen || ''; }
    });
    menuFs(O);
  }




  const FS_IN = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>';
  const FS_OUT = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/></svg>';
  function menuFs(O) {
    const row = $('menuTop');
    if (!row) return;
    let b = $('menuFs');

    const iphone = /iPhone|iPod/.test(navigator.userAgent || '');
    if (!fsAllowed() || iphone) { if (b) b.hidden = true; return; }
    if (!b) {
      b = document.createElement('button');
      b.type = 'button'; b.id = 'menuFs'; b.className = 'fs-btn';
      b.onclick = (e) => { e.stopPropagation(); toggleFullscreen(); };
    }
    if (row.lastElementChild !== b) row.appendChild(b);
    const on = !!fsElement(), t = on ? O.exitFullscreen || 'Exit fullscreen' : O.fullscreen || 'Fullscreen';
    b.hidden = false;
    if (b._on !== on) { b.innerHTML = on ? FS_OUT : FS_IN; b._on = on; }
    b.setAttribute('aria-label', t); b.title = t; b.setAttribute('aria-pressed', String(on));
  }
  function buildAll() { build($('setTset'), true); refresh(); }



  function hookMoves() {
    const tr = ND.training;
    if (!tr || typeof tr.movesHtml !== 'function' || tr.movesHtml._touch) return;
    const orig = tr.movesHtml;
    const wrapped = function (...args) {
      let html = orig.apply(this, args);
      if (!(ND.touch && ND.touch.active)) return html;

      const TB = (ND.STR && ND.STR.touch && ND.STR.touch.btn) || {};
      if (TB.light) html = html.replace(/(^|[^A-Za-zÇĞİÖŞÜçğıöşü])(LIGHT|HAFİF)(?![A-Za-zÇĞİÖŞÜçğıöşü])/g, (m, a) => a + TB.light);
      const note = T().fullNote;
      if (prefs.layout === 'simple' && note) html += `<dt></dt><dd class="nt"><small>${esc(note)}</small></dd>`;
      return html;
    };
    wrapped._touch = true;
    tr.movesHtml = wrapped;
  }


  ND.touchUI = {
    prefs, apply, refresh, rebuild: buildAll, toggleFullscreen, fsAllowed, save,

    IDS, ACTS, DPAD, BASE, KEEP, RMIN, RMAX, OMIN, DLOOK, PPOS, measure, tbPx, resolve, presetPx, keepIn, freeSpot, hits, liveIds, toLayout, setLeft, swipeZone, dpadRing, dpadAround,
    geo: () => geo,

    saved: () => !!(geo && prefs.lay && prefs.lay[geo.S.shape]),
  };
  apply();

  const start = () => {
    buildAll(); hookMoves();
    if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(buildAll);

    const rm = $('rotMenu'), bm = $('bMenu');
    if (rm && bm) rm.onclick = () => bm.click();

    apply(true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);
})(window.ND);
