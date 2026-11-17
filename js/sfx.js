














(function (ND) {
  'use strict';
  const A = ND.audio;
  if (!A) return;
  const G = () => ND.game;
  const koto = () => (ND.music && ND.music.kotoBufs && ND.music.kotoBufs.length ? ND.music.kotoBufs : null);
  const vr = (a) => A.vr(a);

  const S = A.sfx = {

    pluck(i, gain = 0.5, delay = 0, pan = 0) {
      const K = koto();
      if (!K) { A.tone({ freq: 293.7 * Math.pow(2, i / 5), dur: 0.9, gain: gain * 0.25, send: 0.4, delay, pan, type: 'triangle' }); return; }
      A.sample(K[Math.max(0, Math.min(K.length - 1, i))], { gain: gain * vr(0.06), rate: vr(0.004), delay, pan, send: 0.35 });
    },

    bell(freq, gain, delay = 0, dur = 1.4, pan = 0) {
      A.tone({ freq, dur, gain, attack: 0.002, send: 0.7, delay, pan });
      A.tone({ freq: freq * 2.76, dur: dur * 0.5, gain: gain * 0.35, attack: 0.002, send: 0.7, delay, pan });
    },


    back() {
      if (!A.uiOn()) return;
      A.menu(() => {
        const k = vr(0.04);
        A.tone({ freq: 460 * k, freq1: 360 * k, dur: 0.08, gain: 0.16, attack: 0.008, send: 0.12, type: 'triangle' });
        A.noise({ type: 'lowpass', f0: 1000 * k, dur: 0.02, gain: 0.3, attack: 0.004, send: 0.08 });
      });
    },

    confirm() {
      if (!A.uiOn()) return;
      A.menu(() => {
        A.ui();
        A.tone({ freq: 150 * vr(0.05), freq1: 85, glide: 0.1, dur: 0.16, gain: 0.05, attack: 0.008, send: 0.15 });
      });
    },
    toast() { if (!A.uiOn()) return; A.menu(() => { S.bell(1568 * vr(0.01), 0.03, 0, 0.9); S.bell(2093, 0.02, 0.07, 0.8); }); },
    coin(n = 1) {
      if (!A.uiOn()) return;
      A.menu(() => {
        for (let i = 0; i < Math.min(4, n); i++) { const k = vr(0.02); A.tone({ freq: 2637 * k, dur: 0.22, gain: 0.05, attack: 0.001, send: 0.35, delay: i * 0.075 }); A.tone({ freq: 3951 * k, dur: 0.16, gain: 0.03, attack: 0.001, send: 0.35, delay: i * 0.075 + 0.03 }); }
      });
    },
    vs() {
      A.menu(() => {
        A.swoosh(1.3, 0);
        A.taiko(1.1, 0.12);
        A.clang(0.35, 0, 0.8);
      });
    },

    guardUp(pan = 0) {
      A.noise({ type: 'bandpass', f0: 1300 * vr(0.15), q: 1.2, dur: 0.09, gain: 0.3, attack: 0.02, send: 0.05, pan });
      A.noise({ type: 'highpass', f0: 5200 * vr(0.1), dur: 0.02, gain: 0.12, attack: 0.001, send: 0.15, pan });
      A.tone({ freq: 3100 * vr(0.04), dur: 0.18, gain: 0.012, attack: 0.001, send: 0.4, pan });
    },
    jump(pan = 0) {
      const d = 0.18 * vr(0.1);
      A.noise({ type: 'bandpass', f0: 380 * vr(0.1), f1: 1500 * vr(0.1), q: 1, dur: d, gain: 0.3, attack: d * 0.4, send: 0.08, pan });
      A.noise({ type: 'bandpass', f0: 2200, q: 2, dur: 0.06, gain: 0.12, attack: 0.01, send: 0.05, pan, delay: 0.02 });
    },
    dash(pan = 0) { A.noise({ type: 'bandpass', f0: 650 * vr(0.15), f1: 280, q: 1.2, dur: 0.16, gain: 0.35, attack: 0.01, send: 0.05, pan }); },
    land(pan = 0, p = 1) { A.step(pan, 2.5 * p); },

    kiReady(pan = 0) {
      [0, 1, 2, 3].forEach((i) => A.tone({ freq: [660, 990, 1320, 1980][i] * vr(0.005), dur: 0.9 - i * 0.12, gain: 0.05, attack: 0.01, send: 0.6, delay: i * 0.045, pan, type: 'triangle' }));
      A.noise({ type: 'highpass', f0: 2000, f1: 8000, dur: 0.45, gain: 0.12, attack: 0.2, send: 0.5, pan });
      A.tone({ freq: 110, freq1: 165, dur: 0.6, gain: 0.18, attack: 0.15, send: 0.3, pan });
    },
    perfect() {
      A.taiko(1.1);
      [1046.5, 1568, 2093].forEach((f, i) => S.bell(f, 0.06, 0.08 + i * 0.11, 1.8));
      A.duck(5, 1.2);
    },

    timeUp() {
      [0, 0.2].forEach((d) => {
        A.noise({ type: 'bandpass', f0: 2300 * vr(0.03), q: 6, dur: 0.03, gain: 3, attack: 0.001, send: 0.35, delay: d });
        A.tone({ freq: 1850 * vr(0.02), dur: 0.05, gain: 0.25, attack: 0.001, send: 0.35, delay: d });
      });
    },

    win() {
      A.menu(() => {
        A.taiko(1.1); A.taiko(0.9, 0.14);
        [5, 7, 8, 10, 12].forEach((n, i) => S.pluck(n, 0.75, 0.12 + i * 0.085));
        S.bell(1174.7, 0.035, 0.6, 2);
        A.duck(6, 1.6);
      });
    },
    lose() {
      A.menu(() => {
        A.taiko(0.7);
        [8, 7, 5, 3, 1].forEach((n, i) => S.pluck(n, 0.6, 0.1 + i * 0.16));
        A.tone({ freq: 73.4, dur: 2.2, gain: 0.22, attack: 0.05, send: 0.6, delay: 0.1 });
        A.duck(5, 1.6);
      });
    },
    unlock() {
      A.menu(() => {
        A.noise({ type: 'highpass', f0: 2500, f1: 9000, dur: 0.7, gain: 0.12, attack: 0.3, send: 0.6 });
        [7, 10, 12].forEach((n, i) => S.pluck(n, 0.7, 0.15 + i * 0.09));
        S.bell(1760, 0.04, 0.45, 2);
      });
    },

    queueStart() { if (!A.uiOn()) return; A.menu(() => { A.taiko(0.6); S.pluck(7, 0.5, 0.08); S.pluck(10, 0.45, 0.2); }); },

    queuePulse() {
      if (!A.uiOn()) return;
      A.menu(() => {
        A.tone({ freq: 72, freq1: 50, dur: 0.16, gain: 0.3, attack: 0.004, send: 0.2 });
        A.tone({ freq: 72, freq1: 50, dur: 0.14, gain: 0.2, attack: 0.004, send: 0.2, delay: 0.24 });
        if (Math.random() < 0.5) S.pluck([3, 5, 7, 8][(Math.random() * 4) | 0], 0.22, 0.5);
      });
    },
    matchFound() {
      A.menu(() => {
        A.taiko(1.2); A.taiko(1, 0.13);
        A.gong();
        [5, 7, 10, 12].forEach((n, i) => S.pluck(n, 0.8, 0.28 + i * 0.06));
        A.tone({ freq: 2900, freq1: 3400, glide: 0.12, dur: 1, gain: 0.05, send: 0.7, delay: 0.3 });
        A.duck(6, 1.5);
      });
    },
    rankUp() {
      A.menu(() => {
        [0, 0.1, 0.2, 0.3].forEach((d, i) => A.taiko(0.6 + i * 0.18, d));
        A.gong();
        [3, 5, 7, 8, 10, 12].forEach((n, i) => S.pluck(n, 0.8, 0.45 + i * 0.07));
        S.bell(1174.7, 0.05, 0.95, 2.4); S.bell(1760, 0.035, 1.05, 2.2);
        A.duck(8, 2.4);
      });
    },
    rankDown() {
      A.menu(() => {
        [10, 8, 7, 5].forEach((n, i) => S.pluck(n, 0.55, i * 0.18));
        A.tone({ freq: 65, dur: 2.4, gain: 0.25, attack: 0.08, send: 0.7, delay: 0.1 });
        A.duck(5, 1.8);
      });
    },
    joined() { A.menu(() => { S.pluck(7, 0.6); S.pluck(12, 0.6, 0.1); S.bell(1760, 0.03, 0.15, 1.2); }); },
  };







  const LV = { back: 0.8, guardUp: 3.5, dash: 5.4, jump: 2.4, kiReady: 0.6, timeUp: 1.4, win: 0.35, lose: 0.42,
    queueStart: 0.38, queuePulse: 0.39, matchFound: 0.33, rankUp: 0.32, rankDown: 0.67, unlock: 0.65, coin: 0.75, vs: 0.42, toast: 0.95, joined: 0.5 };
  for (const k of Object.keys(LV)) { const fn = S[k]; S[k] = function () { const a = arguments; return A.scaled(LV[k], () => fn.apply(S, a)); }; }


  const now = () => performance.now();
  const BTN = 'button, [role="button"], .mode, .seg, [data-gfx], input[type="checkbox"], input[type="range"], select, summary, a.btn';
  const isBack = (el) => {
    const s = ((el.id || '') + ' ' + (el.className && el.className.baseVal == null ? el.className : '') + ' ' + (el.getAttribute('aria-label') || '')).toLowerCase();
    const t = (el.textContent || '').trim();
    return /(^|[^a-z])(back|close|cancel|quit|leave)|menu$|mvclose|setclose|lbclose|bback|bmenu|bendmenu|edmenu|vsquit|rkcancel|onlcancel/.test(s) || /^[×✕✖←◀‹]/.test(t);
  };
  const isPrimary = (el) => /\bprimary\b/.test(typeof el.className === 'string' ? el.className : '') || /^(bFight|vsGo|bRematch|fPlay|mplay|bzGo|rkAgain|edAgain)$/.test(el.id || '');




  const kindOf = (el) => (!el || el.id === 'rkFind' ? 'minor' : isBack(el) ? 'back' : isPrimary(el) || (el.classList && el.classList.contains('mode') && el.closest('#menu')) ? 'confirm' : 'minor');
  const mark = (k) => { A._press = k; setTimeout(() => { if (A._press === k) A._press = null; }, 0); };
  A._pressGate = true;
  document.addEventListener('click', (e) => { mark(kindOf(e.target && e.target.closest ? e.target.closest(BTN) : null)); }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Backspace') mark('back');
    else if (e.key === 'Enter' || e.key === ' ') mark(kindOf(document.activeElement && document.activeElement.closest ? document.activeElement.closest(BTN) : null));
  }, true);



  document.addEventListener('click', (e) => {
    const el = e.target && e.target.closest ? e.target.closest(BTN) : null;
    if (!el || el.disabled || !A.ready || !A.uiOn()) return;

    if (el.closest('#touch')) return;
    const k = kindOf(el), back = k === 'back', prim = k === 'confirm';
    if (!back && !prim) return;
    const n0 = A.nPlayed | 0;
    setTimeout(() => { if ((A.nPlayed | 0) !== n0) return; if (back) S.back(); else S.confirm(); }, 0);
  }, true);

  const openSig = () => ['menu', 'select', 'vs', 'pause', 'setOv', 'end', 'lb', 'hall', 'honorOv', 'reveal', 'bzLobby', 'bzRes', 'rk', 'movesOv', 'journeyPanel', 'singlePick']
    .map((id) => { const x = document.getElementById(id); return x && !x.hidden ? 1 : 0; }).join('');
  let lastKey = 0;
  document.addEventListener('keydown', (e) => {
    lastKey = now();
    if (e.key !== 'Escape' && e.key !== 'Backspace') return;
    if (!A.ready || (G() && G().phase === 'fight' && !G().paused)) return;
    const n0 = A.nPlayed | 0, s0 = openSig();
    setTimeout(() => { if ((A.nPlayed | 0) === n0 && openSig() !== s0) S.back(); }, 0);
  }, true);



  let lastWinner = null;
  const watch = (id, fn) => {
    const el = document.getElementById(id);
    if (!el || typeof MutationObserver !== 'function') return;
    let was = !el.hidden;
    new MutationObserver(() => { const on = !el.hidden; if (on && !was) { try { fn(el); } catch (err) {                } } was = on; }).observe(el, { attributes: true, attributeFilter: ['hidden'] });
  };
  const SOLO = { cpu: 1, arcade: 1, tourney: 1, dan: 1, rival: 1, train: 1, tutorial: 1 };
  function resultSting() {
    const g = G(); if (!g || !A.ready) return;
    const w = lastWinner, me = g.F && g.F[0];
    if (SOLO[g.mode] && me && w && w !== me) S.lose(); else S.win();

    setTimeout(() => { const h = document.getElementById('endHonor'); if (h && !h.hidden && (h.textContent || '').trim()) S.coin(3); }, 650);
  }

  function hook() {
    const g = G(), FP = ND.Fighter && ND.Fighter.prototype;
    if (!g || !FP || g._sfx) return;
    g._sfx = true;
    const live = () => g.mode !== 'attract' && !g.replay && (!g.simOnly || !!ND.presGate) && !A.quiet;
    const safe = (fn) => { try { fn(); } catch (e) {                                      } };
    const last = new WeakMap();
    const gap = (f, k, ms) => { const m = last.get(f) || {}; const t = now(); if (m[k] && t - m[k] < ms) return false; m[k] = t; last.set(f, m); return true; };
    const GROUND = { move: 1, idle: 1, land: 1, block: 1, guard: 1, recoil: 1 };
    const setSt = FP.setState;
    FP.setState = function (s) {
      const was = this.state, r = setSt.apply(this, arguments);
      if (was !== s && g.phase === 'fight') safe(() => {
        if (!live()) return;
        if (s === 'guard' && was !== 'block' && gap(this, 'guard', 350)) S.guardUp(this.pan || 0);
        else if (s === 'air' && GROUND[was] && gap(this, 'jump', 150)) S.jump(this.pan || 0);
        else if (s === 'dodge') S.dash(this.pan || 0);
      });
      return r;
    };
    const gainKi = FP.gainKi;
    if (gainKi) FP.gainKi = function () {
      const k0 = this.ki, r = gainKi.apply(this, arguments);
      if (k0 < 100 && this.ki >= 100 && g.phase === 'fight') safe(() => { if (live()) S.kiReady(this.pan || 0); });
      return r;
    };
    const banner = g.banner;
    g.banner = function () {
      const r = banner.apply(this, arguments);
      safe(() => {
        if (this.mode === 'attract' || (this.simOnly && !ND.presGate)) return;
        const run = (fn) => (ND.presGate ? ND.presGate(fn) : fn());
        if (this.phase === 'ko') { const perfect = this.winner && this.winner.damageTaken === 0 && !this.doubleKO; if (perfect) run(() => setTimeout(() => S.perfect(), 1100)); }
        else if (this.phase === 'timeup') run(() => S.timeUp());
      });
      return r;
    };
    const matchEnd = g.matchEnd;
    g.matchEnd = function (w) { lastWinner = w || null; return matchEnd.apply(this, arguments); };
    watch('end', () => { if (g.mode !== 'online') resultSting(); });
    watch('ending', () => S.win());
    ['vs', 'journeyVs'].forEach((id) => watch(id, () => S.vs()));
    if (typeof ND.reveal === 'function') { const rv = ND.reveal; ND.reveal = function () { const r = rv.apply(this, arguments); safe(() => S.unlock()); return r; }; ND.reveal.close = rv.close; }
    if (typeof ND.toast === 'function') { const tt = ND.toast; ND.toast = function () { const n0 = A.nPlayed | 0; const r = tt.apply(this, arguments); safe(() => { if ((A.nPlayed | 0) === n0) S.toast(); }); return r; }; }

    let rk = null, rkRes = null, pulseT = 0, olConn = false;
    setInterval(() => safe(() => {
      if (!A.ready) return;
      const R = ND.ranked, st = R && R.state ? R.state() : null, scr = st ? st.screen : null;
      if (scr === 'queue' && rk !== 'queue') { S.queueStart(); pulseT = now() + 3000; }
      else if (scr === 'queue' && now() > pulseT && !(g.mode === 'cpu' && g.phase === 'fight')) { S.queuePulse(); pulseT = now() + 3000; }
      if (scr === 'vs' && rk !== 'vs') S.vs();
      const res = st && st.match && st.match.result;
      if (res && res !== rkRes && scr === 'result') {

        const side = st.match.side, w = res.winner, my = res.r && res.r[side];
        if (!(my && my.placement === 0 && my.tier !== my.tier_before)) { if (w === side) S.win(); else if (w === 1 - side) S.lose(); }
      }
      rkRes = res || null; rk = scr;
      const O = ND.online, os = O && O.state ? O.state() : null, conn = !!(os && os.connected);
      if (conn && !olConn && os.screen === 'room') S.joined();
      olConn = conn;
    }), 400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(hook, 0)); else setTimeout(hook, 0);
})(window.ND);
