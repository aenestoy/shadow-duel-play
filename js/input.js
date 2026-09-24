// Gölge Düellosu — girdi: klavye, gamepad, dokunmatik → sanal kumanda
(function (ND) {
  'use strict';
  // Input buffers (press age, parry window, double tap) run on the game's simulation clock when it exists
  // (ND.simClock, advanced 1/120 s per fixed step in game.js), so they behave the same at every refresh rate;
  // before the game loop starts (or in tools without it) they fall back to real time.
  const now = () => (typeof ND.simClock === 'number' ? ND.simClock : performance.now() / 1000);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  class Ctrl {
    constructor() { this.clear(); }
    clear() {
      this.srcs = {}; this.buf = {};
      this.lastTap = { left: -9, right: -9 }; this.tapDir = 0;
    }
    press(a, src = 'k') {
      const s = this.srcs[a] || (this.srcs[a] = new Set());
      const was = s.size > 0;
      s.add(src);
      if (was) return;
      const t = now();
      this.buf[a] = t;
      if (!this.noTap && (a === 'left' || a === 'right')) {
        if (t - this.lastTap[a] < 0.24) { this.buf.dodge = t; this.tapDir = a === 'left' ? -1 : 1; }
        this.lastTap[a] = t;
      }
      if (a === 'dodge') this.tapDir = 0;
      if (this.onPress) { try { this.onPress(a, t); } catch (e) { /* listener (combo trial) must never break input */ } }
    }
    release(a, src = 'k') { const s = this.srcs[a]; if (s) s.delete(src); }
    held(a) { const s = this.srcs[a]; return !!(s && s.size); }
    axis() { return (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0); }
    has(a, win = 0.2) { const t = this.buf[a]; return t != null && now() - t <= win; }
    take(a, win = 0.2) { if (this.has(a, win)) { this.buf[a] = null; return true; } return false; }
    since(a) { const t = this.buf[a]; return t == null ? 99 : now() - t; }
  }

  const KEYMAP = {
    p1: {
      KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'guard',
      KeyF: 'light', KeyG: 'heavy', KeyR: 'kick', KeyT: 'throw', ShiftLeft: 'dodge', KeyE: 'special',
    },
    p2: {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'guard',
      // P is pause (Escape is reserved by CrazyGames for fullscreen), so player 2's shuriken sits on I, between U and O
      KeyK: 'light', KeyL: 'heavy', KeyO: 'kick', KeyI: 'throw', ShiftRight: 'dodge', KeyU: 'special', Numpad3: 'special',
      Numpad1: 'light', Numpad2: 'heavy', Numpad4: 'kick', Numpad5: 'throw', Numpad0: 'dodge',
    },
  };

  // ---------------------------------------------------------------- dokunmatik algılama
  // capable: cihaz dokunmayı destekliyor; active: dokunmatik arayüz (sanal kumanda, dokunmatik metinler) açık.
  // Dokunulunca açılır, klavye/gamepad kullanılınca kapanır. Test: adreste #touch / #notouch ya da ND.forceTouch.
  const mm = (q) => { try { return window.matchMedia(q).matches; } catch (e) { return false; } };
  const UA = navigator.userAgent || '';
  const touch = ND.touch = {
    capable: false, active: false, coarse: false, forced: null, kb: false, pad: false, mobile: false, fns: [],
    detect() {
      const h = (location.hash || '').toLowerCase();
      let forced = /\bnotouch\b/.test(h) ? false : /\btouch\b/.test(h) ? true : null;
      if (typeof ND.forceTouch === 'boolean') forced = ND.forceTouch;
      this.forced = forced;
      this.coarse = mm('(pointer: coarse)');
      this.capable = this.coarse || 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
      if (forced === true) this.capable = true;
      // Start with the touch UI only when the main pointer is a finger (phone, tablet). A laptop with a touch screen
      // but a mouse/trackpad as main pointer starts with the keyboard UI; its first real touch switches (init below).
      this.set(forced != null ? forced : this.coarse, true);
    },
    // ND.forceTouch = true/false konsoldan; null → otomatik
    force(v) { ND.forceTouch = v; this.detect(); },
    set(v, init) {
      v = !!v;
      if (!init && this.forced != null && v !== this.forced) return;
      if (v === this.active && !init) return;
      this.active = v;
      const app = document.getElementById('app');
      if (app) app.classList.toggle('touch', v);
      this.swapTexts();
      this.notify();
    },
    notify() { for (const fn of this.fns) { try { fn(this.active); } catch (e) { /* yok say */ } } },
    onChange(fn) { this.fns.push(fn); },
    // Klavye/gamepad var mı (iki oyunculu mod için)
    hasPad() {
      try { const l = navigator.getGamepads ? navigator.getGamepads() : []; for (const g of l) if (g && g.connected) return true; } catch (e) { /* yok */ }
      return false;
    },
    // İki oyunculu mod yalnızca dokunmatikteyken klavye/gamepad ister
    twoPlayerOk() { return !this.active || this.kb || this.pad || this.hasPad(); },
    // Klavye ↔ dokunmatik metin takası: data-t = dokunmatik metnin ND.STR yolu, data-tk = klavye metninin yolu
    // (yoksa öğenin özgün HTML'i). Değerler yalnızca metin tablosundan gelir.
    swapTexts() {
      const STR = ND.STR, get = (p) => (STR && p ? p.split('.').reduce((o, k) => (o ? o[k] : undefined), STR) : undefined);
      document.querySelectorAll('[data-t]').forEach((el) => {
        if (el.dataset.k == null) el.dataset.k = el.innerHTML;
        const t = get(el.dataset.t), k = get(el.dataset.tk);
        el.innerHTML = this.active && typeof t === 'string' ? t : typeof k === 'string' ? k : el.dataset.k;
      });
    },
  };

  // telefon/tablet (performans kararları için): birincil işaretçi kaba ya da mobil tarayıcı / iPadOS
  touch.mobile = mm('(pointer: coarse)') || /Android|iPhone|iPad|iPod|Mobile/i.test(UA) || (/Macintosh/.test(UA) && (navigator.maxTouchPoints || 0) > 1);
  // zayıf cihaz: az bellek ya da az çekirdek (tarayıcı bildirmiyorsa güçlü say)
  touch.lowEnd = touch.mobile && ((navigator.deviceMemory || 8) <= 4 || (navigator.hardwareConcurrency || 8) <= 4);

  // Typing into a field (nickname) must never drive a fighter or be swallowed
  const editable = (t) => !!(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || '')));
  // Browser/OS shortcuts (Ctrl+R, Ctrl+W, Cmd+Q, Alt+Tab...) are left alone: not game keys, no preventDefault
  const shortcut = (e) => e.ctrlKey || e.metaKey || e.altKey;

  // Some virtual keyboards and automation tools send key events with an empty e.code: rebuild it from e.key
  // (first listener, capture phase) so every handler in the game can rely on physical codes.
  const KEY2CODE = { ' ': 'Space', Spacebar: 'Space', Esc: 'Escape', Escape: 'Escape', Backspace: 'Backspace', Enter: 'Enter', Tab: 'Tab',
    ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', Left: 'ArrowLeft', Right: 'ArrowRight', Up: 'ArrowUp', Down: 'ArrowDown', Shift: 'ShiftLeft' };
  const fixCode = (e) => {
    if (e.code || typeof e.key !== 'string') return;
    let c = KEY2CODE[e.key];
    if (!c && /^[a-z]$/i.test(e.key)) c = 'Key' + e.key.toUpperCase();
    else if (!c && /^\d$/.test(e.key)) c = 'Digit' + e.key;
    if (c) { try { Object.defineProperty(e, 'code', { value: c }); } catch (err) { /* read-only in this browser */ } }
  };
  window.addEventListener('keydown', fixCode, true);
  window.addEventListener('keyup', fixCode, true);

  const input = ND.input = {
    p1: new Ctrl(), p2: new Ctrl(),
    solo: false,            // CPU modunda tüm tuşlar 1. oyuncuya gider
    enabled: true,
    onKey: null,            // oyun: menü/duraklat tuşları
    onPause: null,          // oyun: duraklat / devam (P, gamepad Start)
    pads: {},
    adLocked: false,        // reklam sürerken tüm girişler kilitli (ND.portal.onAd)
    KEYMAP,
    // Escape is CrazyGames' fullscreen key: never use it there. Elsewhere it stays as a silent alias.
    escAllowed: ND.portalName !== 'crazygames',
    // Pause toggle: P everywhere (Escape only where allowed). Not while typing.
    isPause(e) { return !!e && !e.repeat && !editable(e.target) && !shortcut(e) && (e.code === 'KeyP' || (input.escAllowed && e.code === 'Escape')); },
    // Back / quit on menus: Backspace (Escape only where allowed). Not while typing.
    isBack(e) { return !!e && !e.repeat && !editable(e.target) && !shortcut(e) && (e.code === 'Backspace' || (input.escAllowed && e.code === 'Escape')); },
    isEditable: editable,

    route(code) {
      if (KEYMAP.p1[code]) return [input.p1, KEYMAP.p1[code]];
      if (KEYMAP.p2[code]) return [input.solo ? input.p1 : input.p2, KEYMAP.p2[code]];
      return null;
    },

    init() {
      touch.detect();
      window.addEventListener('keydown', (e) => {
        // gerçek klavye kullanımı → dokunmatik arayüzü kapat (değiştirici tuşlar tek başına sayılmaz)
        if (e.isTrusted && !e.repeat && !/^(Shift|Control|Alt|Meta)/.test(e.key || '') && e.key !== 'Unidentified') {
          const first = !touch.kb;
          touch.kb = true;
          if (touch.active && touch.forced == null) touch.set(false); else if (first) touch.notify();
        }
        learnKey(e);
        if (input.adLocked) { if (!shortcut(e) && !editable(e.target)) e.preventDefault(); return; }
        if (input.onKey && input.onKey(e)) { e.preventDefault(); return; }
        if (editable(e.target) || shortcut(e)) return;
        // P / Start: pause toggle (the game decides when pausing makes sense)
        if (e.code === 'KeyP' && input.onPause) { e.preventDefault(); if (!e.repeat) input.onPause(e); return; }
        const r = input.route(e.code);
        if (!r) {
          // Space would scroll the portal page around the iframe; keep it for focused buttons
          if (e.code === 'Space' && (e.target === document.body || e.target === document.documentElement)) e.preventDefault();
          return;
        }
        e.preventDefault();
        if (!e.repeat && input.enabled) r[0].press(r[1], 'k' + e.code);
      });
      window.addEventListener('keyup', (e) => {
        const r = input.route(e.code);
        if (r) r[0].release(r[1], 'k' + e.code);
      });
      window.addEventListener('blur', () => { input.p1.clear(); input.p2.clear(); input.touchReset(); });
      // Ads: lock every input (keys, pads, touch) and drop whatever was held
      if (ND.portal) ND.portal.onAd((ph) => input.lockForAd(ph === 'start'));
      initLayout();
      // ilk dokunuşta dokunmatik arayüze geç
      const onTouch = () => { if (!touch.active) { touch.capable = true; touch.set(true); } };
      window.addEventListener('touchstart', onTouch, { passive: true, capture: true });
      window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') onTouch(); }, { passive: true, capture: true });
      window.addEventListener('gamepadconnected', () => { touch.pad = true; touch.notify(); });
      // iOS: çift dokunma yakınlaştırması / kıstırma / uzun basma menüsü oyunu bölmesin
      document.addEventListener('gesturestart', (e) => e.preventDefault());
      // uzun basınca tuvalde "resmi indir" vb. menü açılmasın (yalnız dokunmatik arayüzde)
      const app = document.getElementById('app');
      if (app) app.addEventListener('contextmenu', (e) => { if (touch.active) e.preventDefault(); });
      const tc = document.getElementById('touch');
      if (tc) {
        tc.addEventListener('contextmenu', (e) => e.preventDefault());
        tc.addEventListener('touchstart', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });
      }
      initStick();
      initActs();
      initDpad();
    },

    // Tüm dokunmatik basışları bırak (kumanda gizlenince / sekme arka plana geçince)
    touchReset() { if (stick) stick.reset(); if (acts) acts.reset(); if (dpad) dpad.reset(); },
    // Controls moved (resize, rotation) while fingers may be down: keep the presses, measure the boxes on the next touch
    touchRelayout() { if (acts) acts.relayout(); if (dpad) dpad.relayout(); if (stick) stick.relayout(); },

    lockForAd(on) {
      input.adLocked = !!on;
      input.p1.clear(); input.p2.clear(); input.touchReset();
      const app = document.getElementById('app');
      if (app) app.classList.toggle('ad-lock', !!on);
    },

    // ---- key labels for hints: physical code -> what the player's keyboard shows (AZERTY: KeyW -> 'Z')
    keyLabel(code) { return keyLabel(code); },
    onLayout(fn) { layoutFns.push(fn); },
    // Rewrite <kbd> letters inside root (they are written as QWERTY physical keys: <kbd>W</kbd> = KeyW)
    relabel(root) { relabel(root || document); },

    // Gamepad: 1. kol → 1. oyuncu, 2. kol → 2. oyuncu
    pollPads() {
      if (!navigator.getGamepads) return;
      let list;
      try { list = navigator.getGamepads(); } catch (e) { return; }
      let n = 0;
      for (const gp of list) {
        if (!gp || !gp.connected) continue;
        const ctrl = n === 0 || input.solo ? input.p1 : input.p2;
        n++;
        const b = (i) => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
        const ax = gp.axes[0] || 0;
        const st = {
          left: b(14) || ax < -0.45, right: b(15) || ax > 0.45, up: b(0) || b(12),
          guard: b(4) || b(6) || b(13), light: b(2), heavy: b(3), kick: b(1), throw: b(5), dodge: b(7), special: b(11) || b(10),
        };
        const prev = input.pads[gp.index] || {};
        const id = 'g' + gp.index;
        let any = false;
        // Start (9): pause toggle, handled apart from the fighter's actions
        const ps = input.padStart || (input.padStart = {}), start = b(9), prevStart = !!ps[gp.index];
        ps[gp.index] = start;
        if (input.adLocked) { input.pads[gp.index] = {}; continue; }
        if (start && !prevStart && input.onPause) { any = true; input.onPause(null); }
        for (const a in st) {
          if (st[a] && !prev[a]) { any = true; if (input.enabled) ctrl.press(a, id); }
          else if (!st[a] && prev[a]) ctrl.release(a, id);
        }
        input.pads[gp.index] = st;
        if (any) {
          const first = !touch.pad;
          touch.pad = true;
          if (touch.active && touch.forced == null) touch.set(false); else if (first) touch.notify();
        }
        if (input.onPad) input.onPad(st, prev);
      }
    },
  };

  // Touch preferences (js/touch.js keeps and saves them): assist = input conveniences, haptic = vibration on press
  const pref = (k, def) => { const P = ND.touchPrefs; return P && typeof P[k] === 'boolean' ? P[k] : def; };
  // kısa dokunsal geri bildirim (Android); çerçeve henüz etkileşim almadıysa (gömülü iframe vb.) hiç çağırma.
  // iOS Safari'de navigator.vibrate yok: hiç denenmez. Ayarlardan kapatılabilir.
  const buzz = () => {
    if (!pref('haptic', true)) return;
    try {
      const ua = navigator.userActivation;
      if (typeof navigator.vibrate === 'function' && (!ua || ua.hasBeenActive)) navigator.vibrate(7);
    } catch (e) { /* yok */ }
  };
  const wake = () => { try { ND.audio.init(); } catch (e) { /* yok */ } };

  // ---------------------------------------------------------------- TOUCH PAD (touch.js places every control, the editor moves them)
  // Movement: a stick ('float': the base jumps to where the thumb lands inside its zone; 'fixed': the base stays put)
  // or d-pad buttons ◀ ▶ ▲ ▼. Both press the same logical keys as the keyboard (left / right / up / guard), so every
  // direction-dependent move (forward/back + attack, forward + HEAVY launcher, double-tap dash, dash direction) works
  // the same in every mode. Buttons: each finger (pointerId) is tracked on its own → multi-touch (hold guard + attack).
  // Handlers only read what was measured at the first touch; nothing here lays the page out per move.
  const T_PREF = () => ND.touchPrefs || {};
  // Easy assist, tap to parry: a parry needs guard pressed shortly before the blow AND still held when it lands. A
  // keyboard player presses and holds; a thumb tap often lifts first. So a short GUARD tap is held for at least the
  // parry window (GUARD_MIN, real time). The window itself is not changed: same timing as holding the key.
  const GUARD_MIN = 180;
  // D-pad "tap to step": a quick tap on ◀ / ▶ walks for at least STEP_MS (one short step, same walk speed as holding)
  const STEP_MS = 170;

  // ---------------------------------------------------------------- sanal yön çubuğu
  // Yukarı = zıpla, aşağı = gard, yana hızlıca iki kez it = atılma (Ctrl'ün çift dokunma algısı). Yüzen çubukta parmak
  // çok uzaklaşırsa taban onu izler; sabit çubukta taban yerinde kalır.
  let stick = null;
  function initStick() {
    const zone = document.getElementById('tStick'), base = document.getElementById('tBase'), knob = document.getElementById('tKnob');
    if (!zone || !base || !knob) return;
    const S = stick = { id: null, cx: 0, cy: 0, r: null, fixed: false, dirs: { left: false, right: false, up: false, guard: false } };
    const setDir = (a, on) => {
      if (S.dirs[a] === on) return;
      S.dirs[a] = on;
      if (on && input.adLocked) return;
      if (on) { input.p1.press(a, 'ts'); if (a === 'up' || a === 'guard') buzz(); } else input.p1.release(a, 'ts');
      base.classList.toggle('d-' + a, on);
    };
    // zone-relative centre of the base; the rest spot comes from touch.js (zone._nd)
    // base diameter from touch.js (the pad may still be hidden, where offsetWidth reads 0)
    const bd = () => (zone._nd && zone._nd.d) || base.offsetWidth;
    const place = () => { const h = bd() / 2; base.style.translate = `${(S.cx - h).toFixed(1)}px ${(S.cy - h).toFixed(1)}px`; };
    const rest = () => { const g = zone._nd; if (g) { S.cx = g.rx; S.cy = g.ry; place(); } };
    const move = (e) => {
      const r = S.r, R = bd() * 0.4, far = R * 1.45;
      let dx = e.clientX - r.left - S.cx, dy = e.clientY - r.top - S.cy, d = Math.hypot(dx, dy);
      if (!S.fixed && d > far) { const k = (d - far) / d; S.cx += dx * k; S.cy += dy * k; dx -= dx * k; dy -= dy * k; d = far; place(); }
      const kd = d > R ? R / d : 1;
      knob.style.transform = `translate(${(dx * kd).toFixed(1)}px, ${(dy * kd).toFixed(1)}px)`;
      const vx = dx / R, vy = dy / R, ax = Math.abs(vx), ay = Math.abs(vy), D = S.dirs;
      // eşik + gecikme payı (histerezis); köşegenler 8 yönlü çalışır. Kolay yardım: zıplama ve gard için çubuk daha
      // belirgin itilmeli (yürürken başparmak biraz kayınca kazara zıplamasın / gard almasın). Yalnız girdi eşiği.
      const easy = pref('assist', true), vOn = easy ? 0.76 : 0.62, vk = easy ? 0.8 : 0.6;
      setDir('right', D.right ? vx > 0.25 : vx > 0.4 && ax > ay * 0.5);
      setDir('left', D.left ? vx < -0.25 : vx < -0.4 && ax > ay * 0.5);
      setDir('up', D.up ? vy < -0.4 : vy < -vOn && ay > ax * vk);
      setDir('guard', D.guard ? vy > 0.4 : vy > vOn && ay > ax * vk);
    };
    S.reset = () => {
      S.id = null;
      for (const a in S.dirs) setDir(a, false);
      knob.style.transform = '';
      base.classList.remove('live');
      rest();
    };
    S.relayout = () => { if (S.id == null) rest(); };
    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (S.id != null) return;
      S.id = e.pointerId;
      try { zone.setPointerCapture(e.pointerId); } catch (_) { /* yok */ }
      const r = S.r = zone.getBoundingClientRect(), h = bd() / 2, g = zone._nd || {};
      S.fixed = !!g.fixed;
      if (S.fixed) { S.cx = g.rx; S.cy = g.ry; } else {
        S.cx = clamp(e.clientX - r.left, h, Math.max(h, r.width - h));
        S.cy = clamp(e.clientY - r.top, h, Math.max(h, r.height - h));
      }
      place(); base.classList.add('live');
      move(e); wake();
    });
    zone.addEventListener('pointermove', (e) => { if (e.pointerId === S.id) move(e); });
    const up = (e) => { if (e.pointerId === S.id) S.reset(); };
    zone.addEventListener('pointerup', (e) => { up(e); wake(); });
    zone.addEventListener('pointercancel', up);
    zone.addEventListener('lostpointercapture', up);
    rest();
  }

  // ---------------------------------------------------------------- button groups (action buttons, d-pad)
  // Each button catches its own first touch (a hit margin around it makes it forgiving) and keeps the finger
  // (pointer capture); the group's handler then picks the nearest button of the group from boxes measured once per
  // gesture, so a finger can slide from one button to another (GUARD → ATTACK = counter; ▶ → ▲ = jump forward).
  function group(boxId, onDown, onMove, onUp) {
    const box = document.getElementById(boxId);
    if (!box) return null;
    const G = { box, ptr: new Map(), rects: null };
    // hidden buttons (display: none) have no box: they can't be picked
    G.measure = () => (G.rects = [...box.querySelectorAll('button')].map((b) => {
      const r = b.getBoundingClientRect();
      return { b, x: r.left + r.width / 2, y: r.top + r.height / 2, rad: r.width / 2 };
    }).filter((q) => q.rad > 1));
    G.relayout = () => { if (G.ptr.size === 0) G.rects = null; else G.stale = true; };
    box.addEventListener('pointerdown', (e) => {
      const b = e.target && e.target.closest && e.target.closest('button');
      if (!b || !box.contains(b)) return;
      e.preventDefault();
      if (G.ptr.size === 0 || !G.rects || G.stale) { G.stale = false; G.measure(); }
      wake();
      try { b.setPointerCapture(e.pointerId); } catch (_) { /* yok */ }
      onDown(e);
    });
    box.addEventListener('pointermove', (e) => { if (G.ptr.has(e.pointerId)) onMove(e); });
    const up = (e) => { if (G.ptr.has(e.pointerId)) onUp(e); };
    box.addEventListener('pointerup', (e) => { up(e); wake(); });
    box.addEventListener('pointercancel', up);
    box.addEventListener('lostpointercapture', up);
    return G;
  }

  // ---------------------------------------------------------------- aksiyon düğmeleri
  // İlk dokunuş en yakın düğmeye bağışlayıcı bir yarıçapla gider; parmak kaydırılınca başka düğmeye geçer.
  let acts = null;
  function initActs() {
    const A = acts = group('tActs', (e) => {
      const b = pick(e.clientX, e.clientY, true);
      if (!b) return;
      A.ptr.set(e.pointerId, b); on(b, e.pointerId);
    }, (e) => {
      const cur = A.ptr.get(e.pointerId);
      const nb = pick(e.clientX, e.clientY, false);
      if (nb && nb !== cur) { A.ptr.set(e.pointerId, nb); off(cur, e.pointerId); on(nb, e.pointerId); }
    }, (e) => { const b = A.ptr.get(e.pointerId); A.ptr.delete(e.pointerId); off(b, e.pointerId); });
    if (!A) return;
    A.rep = new Map();
    // Easy assist, hold to chain: while ATTACK stays held it is pressed again every 0.15 s (a quick human mash), after a
    // first 0.26 s so a normal tap never counts twice. The fighter's own chain windows decide what comes out, exactly
    // as when a keyboard player mashes F: nothing about the rules changes, only how often the thumb has to tap.
    const REP_FIRST = 260, REP_EVERY = 150;
    const stopRep = (id) => { const t = A.rep.get(id); if (t) { clearTimeout(t); A.rep.delete(id); } };
    const startRep = (b, id) => {
      stopRep(id);
      const step = (ms) => A.rep.set(id, setTimeout(() => {
        if (A.ptr.get(id) !== b || input.adLocked || !pref('assist', true)) { A.rep.delete(id); return; }
        input.p1.release('light', 't' + id); input.p1.press('light', 't' + id);
        step(REP_EVERY);
      }, ms));
      step(REP_FIRST);
    };
    const pick = (x, y, loose) => {
      let best = null, bd = Infinity;
      for (const q of A.rects || A.measure()) { const d = Math.hypot(x - q.x, y - q.y) / q.rad; if (d < bd) { bd = d; best = q.b; } }
      return bd <= (loose ? 1.4 : 0.98) ? best : null;
    };
    const held = (b) => { for (const v of A.ptr.values()) if (v === b) return true; return false; };
    const t0 = new Map();
    const on = (b, id) => {
      if (input.adLocked) return;
      b.classList.add('on'); input.p1.press(b.dataset.act, 't' + id); buzz();
      t0.set(id, performance.now());
      if (b.dataset.act === 'light' && pref('assist', true)) startRep(b, id);
    };
    const off = (b, id, now) => {
      stopRep(id);
      const act = b.dataset.act, src = 't' + id, left = GUARD_MIN - (performance.now() - (t0.get(id) || 0));
      t0.delete(id);
      if (act === 'guard' && !now && left > 0 && pref('assist', true)) {
        setTimeout(() => { input.p1.release(act, src); if (!held(b)) b.classList.remove('on'); }, left);
        return;
      }
      input.p1.release(act, src); if (!held(b)) b.classList.remove('on');
    };
    A.reset = () => {
      for (const [id, b] of [...A.ptr]) { A.ptr.delete(id); off(b, id, true); }
      for (const id of [...A.rep.keys()]) stopRep(id);
      A.box.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
      A.rects = null;
    };
  }

  // ---------------------------------------------------------------- d-pad ◀ ▶ ▲ ▼
  // Hold to walk / guard, ▲ jumps. A finger between two buttons presses both (▶ + ▲ = jump forward). Two quick taps
  // on ◀ or ▶ dash (the same double-tap rule as the keyboard). With "tap to step" a quick tap still walks one short
  // step (STEP_MS); with easy assist a quick ▼ tap lasts long enough to parry (GUARD_MIN).
  let dpad = null;
  function initDpad() {
    const P = dpad = group('tDpad', (e) => { P.ptr.set(e.pointerId, pickDirs(e.clientX, e.clientY, true)); sync(); },
      (e) => { const n = pickDirs(e.clientX, e.clientY, false); if (n !== P.ptr.get(e.pointerId)) { P.ptr.set(e.pointerId, n); sync(); } },
      (e) => { P.ptr.delete(e.pointerId); sync(); });
    if (!P) return;
    const DIRS = ['left', 'right', 'up', 'guard'];
    const st = {};
    for (const a of DIRS) st[a] = { on: false, t0: 0, timer: 0 };
    // the directions under one finger, as a sorted key ('right+up'): nearest button, plus a neighbour when the finger
    // sits between the two
    const pickDirs = (x, y, first) => {
      const list = [];
      for (const q of P.rects || P.measure()) list.push({ a: q.b.dataset.dir, d: Math.hypot(x - q.x, y - q.y) / q.rad });
      list.sort((m, n) => m.d - n.d);
      const a = list[0], b = list[1];
      if (!a) return '';
      const opp = b && ((a.a === 'left' && b.a === 'right') || (a.a === 'right' && b.a === 'left') || (a.a === 'up' && b.a === 'guard') || (a.a === 'guard' && b.a === 'up'));
      // between two neighbours (about as close to both): both
      if (b && !opp && a.d <= 1.65 && b.d <= 1.65 && b.d <= a.d * 1.3) return [a.a, b.a].sort().join('+');
      return a.d <= (first ? 1.4 : 1.25) ? a.a : '';
    };
    const btn = (a) => P.box.querySelector(`[data-dir="${a}"]`);
    const down = (a) => {
      const s = st[a];
      if (s.timer) { clearTimeout(s.timer); s.timer = 0; input.p1.release(a, 'td'); } // a new tap during a step: a new press
      if (input.adLocked) return;
      s.on = true; s.t0 = performance.now();
      input.p1.press(a, 'td'); buzz();
      const b = btn(a); if (b) b.classList.add('on');
    };
    const up = (a, now) => {
      const s = st[a];
      s.on = false;
      const min = now ? 0 : a === 'guard' ? (pref('assist', true) ? GUARD_MIN : 0) : (a === 'left' || a === 'right') && T_PREF().dtap ? STEP_MS : 0;
      const left = min - (performance.now() - s.t0);
      const done = () => { s.timer = 0; input.p1.release(a, 'td'); const b = btn(a); if (b) b.classList.remove('on'); };
      if (left > 0) s.timer = setTimeout(done, left); else done();
    };
    // union of every finger on the pad → press what was added, release what was lifted
    const sync = () => {
      const want = new Set();
      for (const k of P.ptr.values()) if (k) k.split('+').forEach((a) => want.add(a));
      for (const a of DIRS) {
        if (want.has(a) && !st[a].on) down(a);
        else if (!want.has(a) && st[a].on) up(a);
      }
    };
    P.reset = () => {
      P.ptr.clear();
      for (const a of DIRS) { const s = st[a]; if (s.timer) clearTimeout(s.timer); s.timer = 0; s.on = false; input.p1.release(a, 'td'); }
      P.box.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
      P.rects = null;
    };
  }

  // ---------------------------------------------------------------- klavye düzeni (AZERTY / QWERTZ etiketleri)
  // Bindings are physical (e.code), so they already work on any layout; only the labels in hints differ.
  // Sources, best first: keys the player actually pressed (e.code -> e.key), the Keyboard Map API
  // (Chromium; often blocked inside cross-origin iframes), then a guess from the browser language.
  const layout = {}, learned = {}, layoutFns = [];
  const GUESS = {
    azerty: { KeyQ: 'A', KeyA: 'Q', KeyW: 'Z', KeyZ: 'W', KeyM: ',', Semicolon: 'M' },
    qwertz: { KeyY: 'Z', KeyZ: 'Y' },
  };
  const SPECIAL = { ShiftLeft: 'Shift', ShiftRight: 'Shift', Space: 'Space', Enter: 'Enter', Backspace: '⌫', Escape: 'Esc', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' };
  const fireLayout = () => { for (const fn of layoutFns) { try { fn(); } catch (e) { /* yok say */ } } relabel(document); };
  function keyLabel(code) {
    if (!code) return '';
    if (learned[code]) return learned[code];
    if (layout[code]) return layout[code];
    if (SPECIAL[code]) return SPECIAL[code];
    let m = /^Key([A-Z])$/.exec(code); if (m) return m[1];
    m = /^Digit(\d)$/.exec(code); if (m) return m[1];
    m = /^Numpad(\d)$/.exec(code); if (m) return 'Num ' + m[1];
    return code;
  }
  function learnKey(e) {
    if (!e || !e.isTrusted || !e.code || !/^Key[A-Z]$/.test(e.code) || typeof e.key !== 'string' || e.key.length !== 1 || shortcut(e)) return;
    const k = e.key.toUpperCase();
    if (!/^\p{L}$/u.test(k) || learned[e.code] === k) return;
    learned[e.code] = k;
    // A letter that differs from its QWERTY name tells us the layout: apply the matching guess for the rest
    if (k !== e.code.slice(3)) {
      const az = (e.code === 'KeyQ' && k === 'A') || (e.code === 'KeyW' && k === 'Z') || (e.code === 'KeyA' && k === 'Q') || (e.code === 'KeyZ' && k === 'W');
      const qz = (e.code === 'KeyY' && k === 'Z') || (e.code === 'KeyZ' && k === 'Y');
      const g = az ? GUESS.azerty : qz ? GUESS.qwertz : null;
      if (g) for (const c in g) if (!learned[c]) layout[c] = g[c];
      fireLayout();
    }
  }
  function initLayout() {
    let first = '';
    try { first = String((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase(); } catch (e) { /* yok */ }
    // French (France/Belgium) keyboards are AZERTY, German-area ones QWERTZ; a real key press or the Keyboard Map overrides this
    if (/^fr(-(fr|be))?$/.test(first)) Object.assign(layout, GUESS.azerty);
    else if (/^(de|cs|hu|sk|sl|hr)(-|$)/.test(first)) Object.assign(layout, GUESS.qwertz);
    try {
      const kb = navigator.keyboard;
      if (kb && kb.getLayoutMap) kb.getLayoutMap().then((map) => {
        for (const c in layout) delete layout[c]; // the real map beats the language guess
        map.forEach((key, code) => { if (/^Key[A-Z]$/.test(code) && typeof key === 'string' && key.length === 1) { const v = key.toUpperCase(); if (v !== code.slice(3)) layout[code] = v; } });
        fireLayout();
      }).catch(() => { /* blocked in iframes without allow="keyboard-map" */ });
    } catch (e) { /* yok */ }
    if (Object.keys(layout).length) fireLayout();
  }
  // <kbd>W</kbd> -> <kbd>Z</kbd> on AZERTY. The QWERTY name is kept in data-code so relabelling is repeatable.
  function relabel(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('kbd').forEach((el) => {
      let code = el.dataset.code;
      if (!code) {
        const t = (el.textContent || '').trim();
        if (!/^[A-Z]$/.test(t)) return;
        code = el.dataset.code = 'Key' + t;
      }
      const lab = keyLabel(code);
      if (el.textContent !== lab) el.textContent = lab;
    });
  }

  ND.Ctrl = Ctrl;
})(window.ND);
