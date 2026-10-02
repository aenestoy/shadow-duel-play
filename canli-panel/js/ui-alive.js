





















(function (ND) {
  'use strict';
  const doc = document, $ = (id) => doc.getElementById(id);
  const G = () => ND.game;
  const safe = (f) => { try { return f(); } catch (e) { return undefined; } };
  const TAU = Math.PI * 2;
  const QS = new URLSearchParams(location.search);
  if (QS.get('alive') === '0') return;
  const RM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const level = () => (QS.get('motion') === 'off' || RM.matches ? 'off' : QS.get('motion') === 'low' || (ND.gfx && ND.gfx.tier === 'low') ? 'low' : 'full');
  const now = () => performance.now();

  const PLAY = { intro: 1, fight: 1, ko: 1, timeup: 1, replay: 1 };
  const fighting = () => { const g = G(); return !!g && g.mode !== 'attract' && !!PLAY[g.phase]; };


  const BRUSH = (c) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 20' preserveAspectRatio='none'><path fill='${c}' d='M1 12C18 5 52 6 84 7s70-4 96-2c9 1 18 3 19 6-8 4-30 5-58 5-30 0-66 3-98 2C26 17 6 16 1 12z'/><path fill='${c}' opacity='.5' d='M30 4c40-3 90-4 140-1-48 0-92 1-140 3zM40 17c30 1 70 0 110-2-40 3-80 4-110 4z'/></svg>`)}")`;
  const EDGE = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 400' preserveAspectRatio='none'><path fill='#07080f' d='M0 0h34c-6 22 10 40 2 62s14 36 4 58 12 40 2 64 16 34 4 60 10 42 0 66 8 22 2 30H0z'/><path fill='#07080f' opacity='.55' d='M34 20c8 6 18 4 24 10-8 2-16 0-22 4zM40 150c8 2 14 8 20 6-6 6-14 6-20 2zM38 290c6 4 14 2 18 8-6 2-12 0-18-2z'/><path fill='none' stroke='#d9b36c' stroke-width='1.6' opacity='.7' d='M34 0c-6 22 10 40 2 62s14 36 4 58 12 40 2 64 16 34 4 60 10 42 0 66 8 22 2 30'/></svg>")}")`;
  const CSS = `
  .nd-it { animation: ndIt .38s cubic-bezier(.2,.85,.25,1) backwards; animation-delay: calc(var(--ndi, 0) * 42ms + 40ms); }
  @keyframes ndIt { from { opacity: 0; translate: var(--ndx, 0px) var(--ndy, 12px); } }
  .nd-pop { animation: ndPop .34s cubic-bezier(.2,1.25,.4,1) backwards; }
  @keyframes ndPop { from { opacity: 0; scale: .94; } }
  .nd-stamp { animation: ndStamp .55s cubic-bezier(.25,1.6,.45,1) backwards; animation-delay: .12s; }
  @keyframes ndStamp { 0% { opacity: 0; scale: 2.3; rotate: -8deg; } 55% { opacity: 1; } }
  html.nd-still .nd-it, html.nd-still .nd-pop, html.nd-still .nd-stamp { animation: ndFade .2s ease-out backwards; }
  @keyframes ndFade { from { opacity: 0; } }
  /* bars fill as their screen comes in; select stats pips pop in turn */
  .nd-in .hbar::after, .nd-in .ps-xbar:not(#endXp .ps-xbar)::after { animation: ndBar .9s cubic-bezier(.3,.7,.3,1) .3s backwards; }
  @keyframes ndBar { from { width: 0; } }
  html:not(.nd-still) .sel-grid .bars i.on { animation: ndPip .26s cubic-bezier(.2,1.5,.4,1) backwards; }
  .sel-grid .bars dd i:nth-child(2) { animation-delay: .04s; } .sel-grid .bars dd i:nth-child(3) { animation-delay: .08s; }
  .sel-grid .bars dd i:nth-child(4) { animation-delay: .12s; } .sel-grid .bars dd i:nth-child(5) { animation-delay: .16s; }
  @keyframes ndPip { from { scale: 1 .1; opacity: .2; } }
  /* the press: a short dip (individual 'scale', so the buttons' own transforms and transitions stay theirs) */
  .nd-press { animation: ndPress .22s cubic-bezier(.3,1.4,.5,1); }
  @keyframes ndPress { 35% { scale: .955; } }
  /* the effects layer (over every screen, never takes a tap) */
  #ndFx { position: fixed; inset: 0; z-index: 75; pointer-events: none; overflow: hidden; contain: strict; }
  #ndFx .nd-brush { position: absolute; height: 6px; background: ${BRUSH('#d9b36c')} center / 100% 100% no-repeat; transform-origin: left center; opacity: .85; animation: ndBrush .26s cubic-bezier(.3,.8,.3,1) both; }
  #ndFx .nd-brush.out { animation: ndBrushOut .2s ease-in forwards; }
  @keyframes ndBrush { from { transform: scaleX(0); } }
  @keyframes ndBrushOut { to { opacity: 0; transform: translateX(8px); } }
  #ndFx .nd-dot { position: absolute; overflow: hidden; }
  #ndFx .nd-dot i { position: absolute; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%; background: radial-gradient(circle, rgba(241,214,156,.42), rgba(217,179,108,.16) 45%, rgba(217,179,108,0) 70%); animation: ndDot .42s cubic-bezier(.2,.7,.3,1) forwards; }
  @keyframes ndDot { from { transform: scale(.15); opacity: 1; } to { transform: scale(1.5); opacity: 0; } }
  #ndFx .nd-wipe { position: absolute; top: -2%; bottom: -2%; left: 0; width: 135%; display: flex; animation: ndWipe .48s cubic-bezier(.55,.05,.6,1) forwards; will-change: transform; }
  #ndFx .nd-wipe b { flex: 1; background: #07080f; opacity: .96; }
  #ndFx .nd-wipe i { width: 18%; background: ${EDGE} 0 0 / 100% 100% no-repeat; }
  /* (the brush edge leads the way the ink is pulled: on the left going right, on the right going back) */
  #ndFx .nd-wipe { flex-direction: row-reverse; }
  #ndFx .nd-wipe i { transform: scaleX(-1); }
  #ndFx .nd-wipe.back { flex-direction: row; left: auto; right: 0; animation-name: ndWipeB; }
  #ndFx .nd-wipe.back i { transform: none; }
  @keyframes ndWipe { from { transform: translateX(0); } to { transform: translateX(100%); } }
  @keyframes ndWipeB { from { transform: translateX(0); } to { transform: translateX(-100%); } }
  #ndFx .nd-slash { position: absolute; left: -10%; top: 50%; width: 120%; height: 3px; margin-top: -1.5px; background: linear-gradient(90deg, rgba(255,255,255,0), #fff 30%, #f1d69c 70%, rgba(255,255,255,0)); box-shadow: 0 0 18px 3px rgba(241,214,156,.7); transform: rotate(-14deg) scaleX(0); transform-origin: left center; animation: ndSlash .42s cubic-bezier(.2,.9,.3,1) forwards; }
  #ndFx .nd-flash { position: absolute; inset: 0; background: rgba(255,246,226,.18); animation: ndFlash .32s ease-out forwards; }
  @keyframes ndSlash { 0% { transform: rotate(-14deg) scaleX(0); opacity: 1; } 30% { transform: rotate(-14deg) scaleX(1); opacity: 1; } 100% { transform: rotate(-14deg) scaleX(1) translateY(2px); opacity: 0; } }
  @keyframes ndFlash { to { opacity: 0; } }
  /* a celebration */
  #ndFx .ndc { position: absolute; left: 50%; top: 46%; display: grid; justify-items: center; gap: 6px; transform: translate(-50%, -50%); min-width: 200px; text-align: center; animation: ndcOut .3s ease-in forwards; animation-delay: var(--life, 1.9s); }
  #ndFx .ndc.skip { animation: ndcOut .16s ease-in forwards; }
  #ndFx .ndc-ink { position: absolute; left: 50%; top: 42%; width: 280px; height: 230px; margin: -115px 0 0 -140px; z-index: -1; animation: ndcInk .4s cubic-bezier(.2,.9,.3,1) backwards; }
  #ndFx .ndc-it { position: relative; display: grid; place-items: center; min-width: 92px; min-height: 92px; padding: 10px; box-sizing: border-box; border: 2px solid var(--cc, #d9b36c); background: radial-gradient(circle at 35% 30%, rgba(60,44,22,.95), rgba(12,9,6,.95) 70%); box-shadow: 0 0 34px -6px var(--cc, #d9b36c); font: 700 46px/1 var(--jp, serif); color: var(--cc, #f1d69c); animation: ndcIt .5s cubic-bezier(.2,1.5,.4,1) .08s backwards; }
  #ndFx .ndc-it .ps-ic, #ndFx .ndc-it svg, #ndFx .ndc-it canvas { width: 64px; height: 64px; font-size: 40px; }
  #ndFx .ndc-seal { position: absolute; right: -22px; bottom: -16px; display: grid; place-items: center; width: 44px; height: 44px; border: 2px solid #f0d7c8; border-radius: 6px; background: #b8231b; color: #fff4ea; font: 700 26px/1 var(--jp, serif); box-shadow: 0 4px 12px rgba(0,0,0,.5); transform: rotate(-9deg); animation: ndcSeal .42s cubic-bezier(.3,1.7,.5,1) .42s backwards; }
  #ndFx .ndc strong { font: 700 clamp(20px, 4.2vh, 30px)/1.1 var(--display, sans-serif); letter-spacing: .1em; text-transform: uppercase; color: #f4ecdc; text-shadow: 0 2px 10px rgba(0,0,0,.8); max-width: min(80vw, 520px); animation: ndIt .35s ease-out .5s backwards; }
  #ndFx .ndc small { font: 600 12px/1 var(--display, sans-serif); letter-spacing: .32em; text-transform: uppercase; color: var(--cc, #d9b36c); text-shadow: 0 1px 6px rgba(0,0,0,.9); animation: ndIt .35s ease-out .58s backwards; }
  @keyframes ndcInk { from { transform: scale(.2) rotate(-20deg); opacity: 0; } }
  @keyframes ndcIt { 0% { scale: .2; opacity: 0; } 70% { scale: 1.08; opacity: 1; } }
  @keyframes ndcSeal { 0% { scale: 2.6; opacity: 0; } 60% { opacity: 1; } }
  @keyframes ndcOut { to { opacity: 0; transform: translate(-50%, -50%) scale(.94); } }
  /* a stamp and splash added to the game's own reward cards (level up, new ninja, ranked promotion) */
  .nd-splash { position: absolute; z-index: -1; pointer-events: none; animation: ndcInk .45s cubic-bezier(.2,.9,.3,1) backwards; }
  .nd-sealed { position: relative; }
  #lvUp .lu.out ~ .nd-splash { opacity: 0; transition: opacity .3s; }
  .nd-sealed > .nd-seal2 { position: absolute; right: -14px; top: -12px; display: grid; place-items: center; width: 34px; height: 34px; border: 2px solid #f0d7c8; border-radius: 5px; background: #b8231b; color: #fff4ea; font: 700 20px/1 var(--jp, serif); transform: rotate(8deg); box-shadow: 0 3px 10px rgba(0,0,0,.5); animation: ndcSeal .42s cubic-bezier(.3,1.7,.5,1) .35s backwards; pointer-events: none; }
  html.nd-still #ndFx .ndc *, html.nd-still .nd-splash, html.nd-still .nd-seal2 { animation-duration: .01s !important; }
  /* menu ninjas */
  /* (the glow in the ninja's colour is the canvas's own background: drawn once by the browser, not every frame) */
  .nd-fig { position: absolute; z-index: 1; display: block; cursor: pointer; -webkit-tap-highlight-color: transparent; background: radial-gradient(closest-side at var(--gx, 50%) 60%, var(--gc, transparent), transparent); }
  .nd-fig[hidden] { display: none; }
  .nd-fig { animation: ndFigIn .5s ease-out .6s backwards; }
  @keyframes ndFigIn { from { opacity: 0; translate: 0 8px; } }
  html.nd-still .nd-fig { animation: none; }
  /* ambient: drifting petals / snow / embers / leaves (compositor-only animations) */
  #ndAmb { position: absolute; inset: 0; z-index: 6; pointer-events: none; overflow: hidden; contain: strict; }
  #ndAmb[hidden] { display: none; }
  /* (fixed key frames, no var() inside them, and nothing else animated: the compositor moves them without the page
     recomputing styles each frame; a particle starts and ends off screen, so no fading either) */
  #ndAmb i { position: absolute; top: 0; will-change: transform; }
  @keyframes ndF0 { 0% { transform: translate3d(0, -6vh, 0) rotate(0deg); } 50% { transform: translate3d(5vw, 50vh, 0) rotate(200deg); } 100% { transform: translate3d(-3vw, 106vh, 0) rotate(400deg); } }
  @keyframes ndF1 { 0% { transform: translate3d(0, -6vh, 0) rotate(0deg); } 50% { transform: translate3d(-6vw, 50vh, 0) rotate(-160deg); } 100% { transform: translate3d(4vw, 106vh, 0) rotate(-320deg); } }
  @keyframes ndF2 { 0% { transform: translate3d(0, -6vh, 0) rotate(0deg); } 50% { transform: translate3d(8vw, 50vh, 0) rotate(120deg); } 100% { transform: translate3d(13vw, 106vh, 0) rotate(260deg); } }
  @keyframes ndR0 { 0% { transform: translate3d(0, 104vh, 0); } 50% { transform: translate3d(4vw, 50vh, 0); } 100% { transform: translate3d(-2vw, -6vh, 0); } }
  @keyframes ndR1 { 0% { transform: translate3d(0, 104vh, 0); } 50% { transform: translate3d(-5vw, 50vh, 0); } 100% { transform: translate3d(3vw, -6vh, 0); } }
  @keyframes ndR2 { 0% { transform: translate3d(0, 104vh, 0); } 50% { transform: translate3d(6vw, 50vh, 0); } 100% { transform: translate3d(10vw, -6vh, 0); } }
  #ndAmb.petal i { border-radius: 70% 0 70% 0; background: linear-gradient(135deg, #ffd3e2, #f08bb0); }
  #ndAmb.leaf i { border-radius: 80% 0 80% 0; background: linear-gradient(135deg, #8fb27a, #4d7445); }
  #ndAmb.snow i { border-radius: 50%; background: radial-gradient(circle, #fff 30%, rgba(255,255,255,0) 72%); }
  #ndAmb.ember i { border-radius: 50%; background: radial-gradient(circle, #ffe2a8 15%, #ff8a3c 40%, rgba(255,90,30,0) 72%); }
  #ndAmb.mote i { border-radius: 50%; background: radial-gradient(circle, rgba(255,236,190,.9) 15%, rgba(255,210,140,0) 70%); }
  `;



  const PARTS = {
    menu: '.brand, .modes > *, .opts, .menu-wrap > aside',
    first: '.first-wrap > *',
    select: '.sel-title, .sel-grid > *, .journey-panel, .look-row, .arena-row, .sel-actions > *',
    vs: '.vs-top, .ladder, .vs-mods, .journey-note, .vs-grid > *, .vs-talk, .sel-actions > *',
    end: '.dialog > :not(.btns), .btns > *',
    pause: '.dialog > :not(.btns), .btns > *',
    ending: '.ed-wrap > canvas, .ed-body > *',
  };

  const FROM = [['.vs-side.l, .sel-grid > .slot:first-child', '-48px', '0px'], ['.vs-side.r, .sel-grid > .slot:last-child', '48px', '0px']];
  const STAMP = '#endK, #pause .bigk, .ed-k';
  const POP = '.vs-mid, .sel-grid > .vs';

  const SCREENS = ['first', 'menu', 'select', 'vs', 'ending', 'end', 'rk', 'onl', 'passOv', 'profOv', 'lb', 'hall', 'bzLobby', 'bzRes', 'onlEnd'];
  const DEEPER = { first: 0, menu: 1 };
  const shown = (el) => !!el && !el.hidden && el.isConnected && el.getClientRects().length > 0;
  const visibleKids = (el) => [...el.children].filter((c) => !c.hidden && c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE' && c.getClientRects().length > 0);

  function partsOf(ov) {
    const sel = PARTS[ov.id];
    if (sel) return { card: null, items: [...ov.querySelectorAll(sel)].filter((e) => !e.hidden && e.getClientRects().length > 0) };

    let root = ov, depth = 0;
    while (depth < 3) { const k = visibleKids(root); if (k.length !== 1) break; root = k[0]; depth++; }
    const items = visibleKids(root);
    return { card: root !== ov ? root : null, items: items.length > 18 ? items.slice(0, 18) : items };
  }
  const timers = new WeakMap();
  let lastEnter = 0;
  function enter(ov) {
    lastEnter = now();
    const L = level();
    const { card, items } = partsOf(ov);
    const all = [];
    const tag = (e, cls) => { if (safe(() => getComputedStyle(e).animationName) !== 'none' && !e.classList.contains(cls)) return; e.classList.remove(cls); void e.offsetWidth; e.classList.add(cls); all.push([e, cls]); };
    if (card) tag(card, 'nd-pop');
    items.forEach((e, i) => {
      if (e.matches(STAMP)) return;
      e.style.setProperty('--ndi', String(Math.min(i, 12)));
      for (const [s, x, y] of FROM) if (e.matches(s)) { e.style.setProperty('--ndx', x); e.style.setProperty('--ndy', y); }
      tag(e, e.matches(POP) ? 'nd-pop' : 'nd-it');
    });
    ov.querySelectorAll(STAMP).forEach((e) => { if (shown(e)) tag(e, 'nd-stamp'); });
    ov.classList.add('nd-in');
    if (L !== 'off') countIn(ov);
    clearTimeout(timers.get(ov));
    timers.set(ov, setTimeout(() => {
      ov.classList.remove('nd-in');
      for (const [e, cls] of all) { e.classList.remove(cls); e.style.removeProperty('--ndi'); e.style.removeProperty('--ndx'); e.style.removeProperty('--ndy'); }
    }, 1400 + items.length * 42));
  }


  let lastTop = null, prevSet = new Set(), queued = false, rkTitle = '';
  function check() {
    queued = false;
    const app = $('app'); if (!app) return;
    const set = new Set();
    for (const el of app.children) if (el.classList.contains('overlay') && !el.hidden) set.add(el.id);
    const opened = [...set].filter((id) => !prevSet.has(id));
    let top = SCREENS.filter((id) => set.has(id)).pop() || null;
    const hud = $('hud');
    if (!top && hud && !hud.hidden) top = 'fight';
    if (top && top !== lastTop) { transition(lastTop, top); unbrush(); }
    for (const id of opened) { const el = $(id); if (el && shown(el)) enter(el); }
    if (top) lastTop = top;
    prevSet = set;
    ambientSync(); figSync(); watchRewards();
  }
  const queue = () => { if (!queued) { queued = true; Promise.resolve().then(check); } };
  function transition(from, to) {
    const L = level();
    if (L !== 'full' || !from) return;
    if (to === 'vs' || (to === 'fight' && (from === 'vs' || from === 'select'))) { slash(); return; }
    if (to === 'fight' || from === 'fight' || to === 'end') return;
    if (to === 'onlEnd') return;

    wipe(DEEPER[to] != null && (DEEPER[from] == null || DEEPER[to] < DEEPER[from]));
  }

  function rkChanged() {
    const rk = $('rk'); if (!rk || rk.hidden) return;
    const t = rk.querySelector('.rk-title'), s = t ? t.textContent : '';
    if (s === rkTitle) return;
    rkTitle = s;
    if (prevSet.has('rk')) enter(rk);
  }


  let fx = null;
  const fxLayer = () => { if (!fx || !fx.isConnected) { fx = doc.createElement('div'); fx.id = 'ndFx'; fx.setAttribute('aria-hidden', 'true'); doc.body.appendChild(fx); } return fx; };
  const put = (html, life) => { const L = fxLayer(), w = doc.createElement('div'); w.innerHTML = html; const e = w.firstChild; L.appendChild(e); if (life) setTimeout(() => e.remove(), life); return e; };
  function wipe(back) { put(`<div class="nd-wipe${back ? ' back' : ''}"><b></b><i></i></div>`, 560); }
  function slash() { put('<div class="nd-flash"></div>', 360); put('<div class="nd-slash"></div>', 480); }


  const BTN = '.btn, .mode, .seg, .sp-btn, .tog, .set-open, .ps-half, .first-menu, .chips > *, .roster > *, .nav > button, .lb-tabs > *, .lb-chips > *, .set-tabs > *, .pf-tile, .ps-tile, .rk-card button, .honor-strip, .bz-card button, #onl button, .sel-actions > *';
  const btnOf = (t) => (t && t.closest ? t.closest(BTN) : null);
  let brushEl = null, brushFor = null, keys = false;
  function brush(b, flash) {
    if (level() === 'off') return;
    const r = b.getBoundingClientRect();
    if (r.width < 24 || r.height < 14 || r.bottom < 0 || r.top > innerHeight) return;
    unbrush();
    const w = Math.min(r.width - 16, 260), e = put(`<div class="nd-brush" style="left:${(r.left + (r.width - w) / 2).toFixed(1)}px;top:${(r.bottom - 9).toFixed(1)}px;width:${w.toFixed(1)}px"></div>`);
    brushEl = e; brushFor = b;
    if (flash) setTimeout(() => { if (brushEl === e) unbrush(); }, 260);
  }
  function unbrush() { const e = brushEl; brushEl = null; brushFor = null; if (e) { e.classList.add('out'); setTimeout(() => e.remove(), 220); } }
  function press(e) {
    const b = btnOf(e.target);
    if (!b || b.disabled || b.getAttribute('aria-disabled') === 'true') return;
    if (fighting() && b.closest('#touch')) return;
    if (level() === 'off') return;
    if (safe(() => getComputedStyle(b).animationName) === 'none' || b.classList.contains('nd-press')) { b.classList.remove('nd-press'); void b.offsetWidth; b.classList.add('nd-press'); setTimeout(() => b.classList.remove('nd-press'), 260); }
    const r = b.getBoundingClientRect();
    if (r.width > 8 && e.clientX != null) put(`<div class="nd-dot" style="left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px"><i style="left:${e.clientX - r.left}px;top:${e.clientY - r.top}px"></i></div>`, 460);
    if (e.pointerType !== 'mouse') brush(b, true);
  }


  const SEAL = { claim: '賞', level: '昇', rank: '昇', ninja: '勝' };

  function blot(color, seed) {
    let s = (seed * 9301 + 49297) % 233280; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const n = 22, pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU, r = 62 + rnd() * 26 + (rnd() < 0.2 ? 30 : 0); pts.push([140 + Math.cos(a) * r * 1.15, 115 + Math.sin(a) * r * 0.9]); }
    let d = `M${pts[0][0].toFixed(0)} ${pts[0][1].toFixed(0)}`;
    for (let i = 1; i <= n; i++) { const p = pts[i % n], q = pts[(i - 1) % n]; d += `Q${((p[0] + q[0]) / 2 + (rnd() - 0.5) * 18).toFixed(0)} ${((p[1] + q[1]) / 2 + (rnd() - 0.5) * 18).toFixed(0)} ${p[0].toFixed(0)} ${p[1].toFixed(0)}`; }
    let drops = '';
    for (let i = 0; i < 9; i++) { const a = rnd() * TAU, r = 100 + rnd() * 34; drops += `<circle cx="${(140 + Math.cos(a) * r * 1.2).toFixed(0)}" cy="${(115 + Math.sin(a) * r * 0.85).toFixed(0)}" r="${(2 + rnd() * 6).toFixed(1)}"/>`; }
    return `<svg viewBox="0 0 280 230" aria-hidden="true"><g fill="${color}" opacity=".9">${drops}<path d="${d}Z"/></g><path d="${d}Z" fill="none" stroke="#d9b36c" stroke-opacity=".35" stroke-width="2"/></svg>`;
  }
  let celQ = [], celOn = null, celN = 0;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function celebrate(o) {
    if (!o || !doc.body) return false;
    celQ.push(o); if (celQ.length > 3) celQ.shift();
    if (!celOn) nextCel();
    return true;
  }
  function nextCel() {
    const o = celQ.shift(); if (!o) { celOn = null; return; }
    const life = level() === 'off' ? 1500 : 1900;
    const it = o.icon ? o.icon : esc(o.k || '賞');
    const e = put(`<div class="ndc" role="status" style="--life:${life}ms${o.color ? ';--cc:' + esc(o.color) : ''}"><div class="ndc-ink">${blot('#07080f', ++celN)}</div>` +
      `<div class="ndc-it">${it}<b class="ndc-seal" aria-hidden="true">${SEAL[o.kind] || '賞'}</b></div>` +
      (o.sub ? `<small>${esc(o.sub)}</small>` : '') + (o.title ? `<strong>${esc(o.title)}</strong>` : '') + '</div>');
    celOn = e;
    sound();
    const done = () => { if (celOn !== e) return; e.remove(); celOn = null; setTimeout(nextCel, 120); };
    e.addEventListener('animationend', (ev) => { if (ev.target === e && /ndcOut/.test(ev.animationName)) done(); });
    setTimeout(done, life + 600);
    e._skip = () => { if (e.classList.contains('skip')) return; e.classList.add('skip'); setTimeout(done, 180); };
  }
  function skipCel() { if (celOn && celOn._skip) celOn._skip(); }


  function sound() {
    const A = ND.audio;
    if (!A || !A.ready || (A.uiOn && !A.uiOn())) return;
    safe(() => {
      const go = () => {
        A.tone({ freq: 120, freq1: 62, glide: 0.09, dur: 0.2, gain: 0.07, attack: 0.004, send: 0.2, delay: 0.42 });
        A.noise({ type: 'lowpass', f0: 700, dur: 0.05, gain: 0.18, attack: 0.002, send: 0.1, delay: 0.42 });
      };
      if (A.menu) A.menu(go); else go();
    });
  }




  function decorate(box, kind, color, seal, delay, host) {
    if (!box || box.__nd) return;
    box.__nd = true;
    if (!host) { host = box; if (getComputedStyle(box).position === 'static') box.style.position = 'relative'; box.style.isolation = 'isolate'; }
    const r = box.getBoundingClientRect(), w = Math.max(220, r.width * 1.25), h = Math.max(180, r.height * 1.25);
    const sp = doc.createElement('div'); sp.className = 'nd-splash'; sp.setAttribute('aria-hidden', 'true');
    sp.style.cssText = `left:50%;top:50%;width:${w}px;height:${h}px;margin:${-h / 2}px 0 0 ${-w / 2}px`;
    sp.innerHTML = blot(color || '#07080f', ++celN).replace('<svg ', '<svg preserveAspectRatio="none" width="100%" height="100%" ');
    if (delay) sp.style.animationDelay = delay + 's';
    if (host === box) host.insertBefore(sp, host.firstChild); else host.appendChild(sp);
    const t = seal || box.querySelector('.lu-n, .k');
    if (t) { t.classList.add('nd-sealed'); const s = doc.createElement('b'); s.className = 'nd-seal2'; s.setAttribute('aria-hidden', 'true'); s.textContent = SEAL[kind] || '賞'; if (delay) s.style.animationDelay = (delay + 0.25) + 's'; t.appendChild(s); }
  }
  function watchRewards() {
    const lv = $('lvUp'), lu = lv && lv.querySelector(':scope > .lu'); if (lu && !lv.hidden) decorate(lu, 'level', '#120c1c', null, 0, lv);
    const rv = $('reveal'); if (rv && !rv.hidden) { const b = rv.querySelector('.rv-in'); if (b) decorate(b, 'ninja', '#07080f', null, 0, rv); }
    const up = doc.querySelector('#rk .rk-rankup.up'); if (up) decorate(up, 'rank', '#07080f', up, 1.2);
  }


  const COUNT = '#endScore b, #endHonor .hn-head strong, #endHonor .hn-rows b, .rk-delta, .bz-res .num, #edStats b';
  const easeOut = (u) => 1 - Math.pow(1 - u, 3);
  function countIn(ov) {
    ov.querySelectorAll(COUNT).forEach((el) => { if (shown(el)) countUp(el); });
  }
  function countUp(el) {
    if (el.children.length || el.__ndc) return;
    const text = el.textContent, toks = [];
    const re = /\d(?:[\d.,   ]*\d)?/g; let m;
    while ((m = re.exec(text))) {
      const t = m[0], sep = (t.match(/[^\d]/) || [''])[0];
      if (sep && !t.split(sep).slice(1).every((g) => g.length === 3)) return;
      toks.push({ i: m.index, s: t, sep, v: +t.replace(/[^\d]/g, '') });
    }
    if (!toks.length || toks.every((t) => t.v < 2)) return;

    const arrow = text.indexOf('→');
    if (arrow > 0) toks.forEach((t) => { if (t.i > arrow && toks[0].i < arrow) t.from = Math.max(0, t.v - toks[0].v * (/[−-]/.test(text.slice(0, toks[0].i)) ? -1 : 1)); });
    const fmt = (n, sep) => (sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(n));
    const live = el.closest('[aria-live]');
    el.__ndc = true;
    if (live) live.setAttribute('aria-busy', 'true');
    const t0 = now() + 220, dur = 780;
    const step = () => {
      if (!el.isConnected || el.textContent !== cur) return end();
      const u = Math.max(0, Math.min(1, (now() - t0) / dur)), k = easeOut(u);
      if (u >= 1) return end();
      let out = '', at = 0;
      for (const t of toks) { const f = t.from || 0; out += text.slice(at, t.i) + fmt(Math.round(f + (t.v - f) * k), t.sep); at = t.i + t.s.length; }
      out += text.slice(at);
      el.textContent = cur = out;
      requestAnimationFrame(step);
    };
    let cur = text;
    const end = () => { if (el.isConnected && el.textContent === cur) el.textContent = text; el.__ndc = false; if (live) live.removeAttribute('aria-busy'); };
    step();
  }


  let amb = null, ambKind = '';
  const WEATHER = { petal: 'petal', rain: 'leaf', snow: 'snow', embers: 'ember' };
  function ambientSync() {
    const L = level(), on = L !== 'off' && !fighting() && !doc.hidden && QS.get('amb') !== 'off';
    if (!amb) {
      if (!on) return;
      const app = $('app'); if (!app) return;
      amb = doc.createElement('div'); amb.id = 'ndAmb'; amb.setAttribute('aria-hidden', 'true');
      app.appendChild(amb);
    }
    if (amb.hidden !== !on) amb.hidden = !on;
    if (!on) return;
    const sc = ND.scene, w = sc && sc.theme && sc.theme.weather, kind = WEATHER[w] || 'mote', n = L === 'low' ? 6 : 11;
    if (kind + n === ambKind) return;
    ambKind = kind + n; amb.className = kind;
    let h = '';
    for (let i = 0; i < n; i++) {
      const r = (k) => { const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
      const snow = kind === 'snow', s = (snow ? 3 + r(1) * 4 : kind === 'ember' || kind === 'mote' ? 3 + r(1) * 3 : 6 + r(1) * 6).toFixed(1);
      const d = (snow ? 12 + r(2) * 10 : kind === 'ember' ? 7 + r(2) * 6 : kind === 'mote' ? 14 + r(2) * 10 : 10 + r(2) * 8).toFixed(1);
      const rise = kind === 'ember' || kind === 'mote', hh = kind === 'leaf' ? (s * 0.55).toFixed(1) : s;
      h += `<i style="left:${(r(3) * 100).toFixed(1)}%;width:${s}px;height:${hh}px;opacity:${(0.35 + r(7) * 0.35).toFixed(2)};animation:nd${rise ? 'R' : 'F'}${i % 3} ${d}s linear ${(-r(4) * d).toFixed(1)}s infinite"></i>`;
    }
    amb.innerHTML = h;
  }


  const E = (ND.M && ND.M.ease) || {};
  const ease = { out: E.outCubic || ((u) => 1 - Math.pow(1 - u, 3)), back: E.outBack || ((u) => 1 + 2.7 * Math.pow(u - 1, 3) + 1.7 * Math.pow(u - 1, 2)), io: E.inOut || ((u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2)) };
  const crouch = { d: { hy: 9, lean: 0.14, hd: 0.1, ax: -6, ay: 6 } };
  const LOOSE = { grip: 0, gx: -14, gy: 34 };
  const G8 = {

    pick: [[0.13, crouch, ease.out], [0.4, { p: 'guard' }, ease.back], [0.9, { p: 'guard' }], [1.3, {}, ease.io]],

    ready: [[0.1, { d: { hy: 11, lean: 0.2, ax: -10, ay: 10 } }, ease.out], [0.3, { p: 'guard', d: { hy: -3 } }, ease.back], [0.5, { p: 'guard' }]],
    twirl: [[0.18, { d: { ax: 6, ay: -6 }, a: LOOSE }, ease.out], [0.62, { d: { sw: TAU, ax: 6, ay: -6 }, a: LOOSE }, ease.io], [0.95, { d: { sw: TAU } }, ease.io]],

    fumble: [[0.16, { d: { ax: 6, ay: -6 }, a: LOOSE }, ease.out], [0.52, { d: { sw: TAU, ax: 6, ay: -6 }, a: LOOSE }, ease.io], [0.64, { d: { sw: TAU + 0.7, hd: 0.25 }, a: LOOSE }],
      [0.76, { d: { sw: TAU - 0.55, hd: 0.3, hy: 2 }, a: LOOSE }], [0.88, { d: { sw: TAU + 0.35, hd: 0.3 }, a: LOOSE }], [1.02, { d: { sw: TAU, hd: 0.34 } }, ease.out],
      [1.4, { d: { sw: TAU, hd: -0.12, lean: -0.06 } }, ease.io], [1.8, { d: { sw: TAU } }, ease.io]],
    chiburi: [[0.2, { p: 'chiburi' }, ease.out], [0.55, { p: 'chiburi' }], [1.0, {}, ease.io]],
    bow: [[0.35, { d: { lean: 0.36, hd: 0.32, hy: 3 } }, ease.io], [0.85, { d: { lean: 0.36, hd: 0.32, hy: 3 } }], [1.25, {}, ease.io]],
    taunt: [[0.25, { d: { lean: -0.12, hd: -0.22, hy: -3 } }, ease.out], [0.4, { d: { lean: -0.1, hd: 0.06 } }], [0.55, { d: { lean: -0.12, hd: -0.2 } }], [0.7, { d: { lean: -0.1, hd: 0.06 } }], [1.05, {}, ease.io]],
    shift: [[0.5, { d: { hx: -5, lean: -0.05, f1x: -3, f2x: -5, hy: 2 } }, ease.io], [1.4, { d: { hx: -5, lean: -0.05, f1x: -3, f2x: -5, hy: 2 } }], [1.9, {}, ease.io]],
    glance: [[0.3, { d: { hd: 0.34 } }, ease.io], [0.9, { d: { hd: 0.34 } }], [1.1, { d: { hd: -0.08 } }, ease.io], [1.5, {}, ease.io]],
    bounce: [[0.12, { d: { hy: -5, f1y: -6, f2y: -6 } }, ease.out], [0.24, { d: { hy: 3 } }], [0.36, { d: { hy: -5, f1y: -6, f2y: -6 } }, ease.out], [0.48, { d: { hy: 3 } }], [0.6, { d: { hy: -5, f1y: -6, f2y: -6 } }, ease.out], [0.78, {}, ease.io]],
  };
  const NOBLADE = { yumi: 1, tessen: 1, kusarigama: 1, bo: 1, naginata: 1 };
  function flourishOf(f) {
    const t = f.ch && f.ch.type, list = ['shift', 'glance', 'taunt', 'bounce', 'bow'];
    if (t !== 'yumi') list.push('twirl', 'twirl', 'fumble');
    if (!NOBLADE[t]) list.push('chiburi', 'chiburi');
    return list[Math.floor(Math.random() * list.length)];
  }
  const KEYS = (ND.pose && ND.pose.KEYS) || [];
  function play(f, name, opt) {
    if (!f || !G8[name] || !ND.pose) return false;
    if (level() === 'off' && name !== 'pick' && name !== 'ready') return false;
    unwind(f);
    f._ndG = { name, u: 0, from: ND.pose.copy(f.pose, {}), hold: !!(opt && opt.hold), keys: null, out: {} };
    f._ndNext = 0;
    return true;
  }

  function unwind(f) { const b = f.P && f.P.stance ? f.P.stance.sw : 0, d = f.pose.sw - b; if (isFinite(d) && Math.abs(d) > Math.PI) f.pose.sw -= Math.round(d / TAU) * TAU; }
  function stop(f) { if (f && f._ndG) { f._ndG = null; unwind(f); } }


  function gesture(f, tp, dt) {
    const g = f._ndG;
    if (!g) { idle(f); return 0; }
    if (f.pvPose) { stop(f); return 0; }
    const K = G8[g.name], P = f.P || ND.POSES, end = K[K.length - 1][0];
    g.u += dt;
    if (g.u >= end && !g.hold) {
      f._ndG = null; f._ndNext = 0; unwind(f);
      return 14;
    }
    if (!g.keys) g.keys = [[0, g.from]].concat(K.map(() => [0, {}, null]));
    const tmp = g.out;
    for (let i = 0; i < K.length; i++) {
      const [t, spec, e] = K[i], dst = g.keys[i + 1];
      dst[0] = t; dst[2] = e;
      const pose = dst[1];
      const src = spec.p ? (P[spec.p] || ND.POSES[spec.p] || tp) : tp;
      for (const k of KEYS) pose[k] = src[k];
      if (spec.p && src !== tp) { pose.hy += tp.hy - (P.stance ? P.stance.hy : tp.hy); pose.sw += tp.sw - (P.stance ? P.stance.sw : tp.sw); }
      if (spec.d) for (const k in spec.d) pose[k] += spec.d[k];
      if (spec.a) for (const k in spec.a) pose[k] = spec.a[k];
    }
    ND.pose.seq(g.keys, Math.min(g.u, end), tmp);
    for (const k of KEYS) tp[k] = tmp[k];
    return 16;
  }

  function idle(f) {
    if (f.pvPose || f._ndNoIdle || level() === 'off') return;
    const t = now();
    if (!f._ndNext) { f._ndNext = t + 2500 + Math.random() * 4000; return; }
    if (t < f._ndNext) return;
    f._ndNext = 0;
    const name = flourishOf(f);
    play(f, name);

    const o = f._ndPal;
    if (o && Math.random() < 0.6) {
      const ot = o.ch && o.ch.type, copy = Math.random() < 0.6 && (name !== 'chiburi' || !NOBLADE[ot]) && ((name !== 'twirl' && name !== 'fumble') || ot !== 'yumi');
      const reply = name === 'fumble' ? 'taunt' : copy ? name : 'bow';
      o._ndNext = t + 99999;
      setTimeout(() => { o._ndNext = 0; if (!o._ndG && !o.pvPose) play(o, reply); }, G8[name][G8[name].length - 1][0] * 1000 + 250 + Math.random() * 400);
    }
  }


  function hookGame(g) {
    const wrap = (name, after) => {
      const f = g[name]; if (typeof f !== 'function') return;
      g[name] = function () { const r = f.apply(this, arguments); safe(() => after.apply(this, arguments)); return r; };
    };

    wrap('refreshSelect', function () {
      const pv = this.pv; if (!pv || this.phase !== 'select') return;
      for (let i = 0; i < 2; i++) {
        const f = pv[i]; if (!f || !f.ch) continue;
        const key = f.ch.id + '|' + (f.col && f.col.ui);
        const rdy = !!(this.sel && this.sel.ready && this.sel.ready[i]);

        if (f._ndKey !== key) { const opening = !prevSet.has('select'); f._ndKey = key; if (!opening) play(f, 'pick'); }
        if (!rdy && f._ndG && f._ndG.hold) stop(f);
      }
    });

    wrap('openSelect', function () { const pv = this.pv; if (!pv) return; pv.forEach((f, i) => { if (f) { stop(f); setTimeout(() => { if (this.phase === 'select' && !f._ndG) play(f, 'pick'); }, 260 + i * 280); } }); });
    wrap('confirm', function (i) { const f = this.pv && this.pv[i]; if (f && this.sel && this.sel.ready[i]) play(f, 'ready', { hold: true }); });
    wrap('showStage', function (phase) {
      const pv = this.pv; if (!pv) return;
      pv.forEach(stop);
      if (phase === 'vs') { setTimeout(() => { if (this.phase === 'vs') play(pv[0], 'ready'); }, 300); setTimeout(() => { if (this.phase === 'vs') play(pv[1], 'taunt'); }, 850); }
    });
  }


  let figs = null, figRaf = 0;
  const COVER = ['setOv', 'lb', 'hall', 'bzLobby', 'bzRes', 'honorOv', 'movesOv', 'rk', 'onl', 'passOv', 'profOv'];

  function makeFig(id, ci, dir, host) {
    const o = { id, f: null, ci, look: false, c: null, host, dir, ox: 0.5 };
    const c = o.c = doc.createElement('canvas'); c.className = 'nd-fig'; c.hidden = true; c.setAttribute('aria-hidden', 'true');
    c.addEventListener('click', () => { if (o.f && !o.f._ndG) play(o.f, flourishOf(o.f)); });
    host.insertBefore(c, host.firstChild);
    return o;
  }
  function figBorn(o) {
    if (o.f) return;
    const f = o.f = new ND.Fighter(o.id, new ND.Ctrl());
    f.fullDetail = true;
    o.key = null; setFigChar(o, o.ci, o.look);
    o.born = now();
    if (figs) { const { L, R } = figs; if (L.f && R.f) { L.f._ndPal = R.f; R.f._ndPal = L.f; } }
  }
  function setFigChar(o, ci, look) {
    const ch = ND.CHARS[ci]; if (!ch) return;
    o.ci = ci; o.look = look;
    if (!o.f) return;
    const key = ch.id + '|' + look;
    if (o.key === key) return;
    o.key = key; o.f.setChar(ch, look); o.f.reset(0); o.f.dir = o.dir; o.f._ndG = null;
  }
  function ensureFigs() {
    if (figs || !ND.Fighter || !ND.CHARS || !G()) return figs;
    const first = $('first'), brand = doc.querySelector('#menu .brand');
    if (!first || !brand) return null;
    const ak = Math.max(0, ND.CHARS.findIndex((c) => c.id === 'akane')), ao = Math.max(0, ND.CHARS.findIndex((c) => c.id === 'aoi'));
    const L = makeFig(2, ak, 1, first), R = makeFig(3, ao, -1, first), M = makeFig(4, 0, -1, brand);
    figs = { L, R, M };
    const ro = window.ResizeObserver ? new ResizeObserver(() => figLayout()) : null;
    if (ro) { ro.observe(first); ro.observe(brand); }
    return figs;
  }

  const textRect = (el) => { if (!el || !shown(el)) return null; const r = doc.createRange(); r.selectNodeContents(el); const b = r.getBoundingClientRect(); return b.width ? b : null; };
  function place(o, x, y, w, h) {
    const c = o.c, hr = o.host.getBoundingClientRect();
    c.style.left = (x - hr.left + o.host.scrollLeft).toFixed(1) + 'px'; c.style.top = (y - hr.top + o.host.scrollTop).toFixed(1) + 'px';
    c.style.width = w.toFixed(1) + 'px'; c.style.height = h.toFixed(1) + 'px';
    figBorn(o);
    c.hidden = false; o.on = true;
  }
  function figLayout() {
    if (!figs) return;
    const { L, R, M } = figs;
    L.on = R.on = M.on = false;
    const lv = level();

    const first = $('first');
    if (shown(first)) {
      const wrap = first.querySelector('.first-wrap'), fr = first.getBoundingClientRect();
      let lo = Infinity, hi = -Infinity;
      if (wrap) for (const k of visibleKids(wrap)) { const r = k.matches('h1, p, .vk') ? textRect(k) || k.getBoundingClientRect() : k.getBoundingClientRect(); if (r.width) { lo = Math.min(lo, r.left); hi = Math.max(hi, r.right); } }
      const side = Math.min(lo - fr.left, fr.right - hi) - 12;
      let h = Math.min(fr.height * 0.62, 300);
      if (side < h * 0.62) h = side / 0.62;
      if (h >= 96 && isFinite(side)) {
        const w = h * 0.86, y = fr.top + fr.height * 0.94 - h;
        place(L, Math.max(fr.left + 4, lo - 12 - w), y, w, h); place(R, Math.min(fr.right - 4 - w, hi + 12), y, w, h);
        L.ox = 0.42; R.ox = 0.58;
      }
    }

    const menu = $('menu'), brand = menu && menu.querySelector('.brand');
    if (shown(menu) && brand) {
      const B = brand.getBoundingClientRect(), tb = brand.querySelector('.topbtns'), T = tb && shown(tb) ? tb.getBoundingClientRect() : null;
      const h1 = textRect(brand.querySelector('h1')), p = textRect($('brandText'));
      let left = Math.max(h1 ? h1.right : B.left, p ? p.right : 0) + 6;
      const top = T && T.left < B.right && T.bottom > B.top ? T.bottom + 2 : B.top, right = B.right, bottom = B.bottom + 6;
      const room = right - left, hh = bottom - top;
      if (hh >= 54 && room >= 44) {
        const h = Math.min(hh, 170), w = Math.min(room, h * 0.95);
        place(M, right - w, bottom - h, w, h);
        M.ox = 0.62;
        const g = G(), S = g && g.sel, ci = S && S.c ? S.c[0] : 0, ch = ND.CHARS[ci];
        setFigChar(M, ci != null && ch ? ci : 0, ch && ND.save && ND.save.look ? safe(() => ND.save.look(ch.id)) || false : false);
      }
    }
    for (const o of [L, R, M]) if (!o.on) o.c.hidden = true;
    figRun();
  }
  function figSync() {
    if (QS.get('fig') === '0') return;
    const g = G();
    if (!g || !(shown($('first')) || shown($('menu')))) { if (figs) { figs.L.c.hidden = figs.R.c.hidden = figs.M.c.hidden = true; figs.L.on = figs.R.on = figs.M.on = false; } return; }
    if (!ensureFigs()) return;
    figLayout();
  }
  function figRun() { if (!figRaf && figs && (figs.L.on || figs.R.on || figs.M.on)) { figRaf = requestAnimationFrame(figFrame); } }
  function figFrame(t) {
    figRaf = 0;
    if (!figs || !(figs.L.on || figs.R.on || figs.M.on) || fighting()) return;
    if (doc.hidden) { setTimeout(figRun, 500); return; }


    const low = level() === 'low', g = G();

    const covered = COVER.some((id) => { const e = $(id); return e && !e.hidden; });
    for (const o of [figs.L, figs.R, figs.M]) {
      if (!o.on) continue;
      if (covered || !o.last || now() - o.born < 600) { o.last = t; continue; }
      if (t - o.last < (o.f._ndG ? (low ? 48 : 38) : 120)) continue;
      const dt = Math.min(0.1, (t - o.last) / 1000); o.last = t; o.t = (o.t || 0) + dt;
      g.stepPv(o.f, dt, o.t + o.f.id * 1.3);
      draw(o);
    }
    figRaf = requestAnimationFrame(figFrame);
  }


  function draw(o) {
    const c = o.c, f = o.f, r = c.getBoundingClientRect(), g = G(), dpr = Math.min((g && g.dprCap) || 2, window.devicePixelRatio || 1, level() === 'low' ? 1 : 1.25);
    if (r.width < 2) return;
    const pc = c.__pv2d || (c.__pv2d = c.getContext('2d', { willReadFrequently: true }));
    const W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    pc.setTransform(1, 0, 0, 1, 0, 0); pc.clearRect(0, 0, W, H);
    if (c.__gc !== f.col.ui) { c.__gc = f.col.ui; c.style.setProperty('--gc', f.col.ui + '40'); c.style.setProperty('--gx', (o.ox * 100).toFixed(0) + '%'); }
    const k = H / 225;
    pc.setTransform(k, 0, 0, k, W * o.ox, H * 0.93);
    pc.fillStyle = 'rgba(0,0,0,.45)'; pc.beginPath(); pc.ellipse(0, 3, 46, 6, 0, 0, TAU); pc.fill();
    f.draw(pc, false);
    if (ND.eyeGlow) ND.eyeGlow(pc, f.j, f.col, f.ch.acc);
  }


  function init() {
    const st = doc.createElement('style'); st.id = 'ndAliveCss'; st.textContent = CSS; doc.head.appendChild(st);
    const sync = () => { const L = level(); doc.documentElement.classList.toggle('nd-still', L === 'off'); };
    sync();
    if (RM.addEventListener) RM.addEventListener('change', () => { sync(); ambKind = ''; ambientSync(); });
    const app = $('app');
    if (app) {


      const seenIn = new WeakSet(), seenKid = new WeakSet(), inner = new MutationObserver((list) => {
        for (const m of list) { if (m.target.id === 'rk') rkChanged(); }
        watchRewards();
      });
      const watchInner = () => { for (const id of ['rk', 'lvUp', 'reveal']) { const e = $(id); if (e && !seenIn.has(e)) { seenIn.add(e); inner.observe(e, { childList: true }); } } };

      const kids = new MutationObserver((list) => { queue(); for (const m of list) if (m.target.id === 'lvUp' || m.target.id === 'reveal' || m.target.id === 'rk') watchRewards(); });
      const watchKids = () => { for (const el of app.children) if (!seenKid.has(el) && el.id !== 'ndAmb') { seenKid.add(el); kids.observe(el, { attributes: true, attributeFilter: ['hidden'] }); } };
      new MutationObserver(() => { watchKids(); watchInner(); queue(); }).observe(app, { childList: true });
      watchKids(); watchInner();
    }
    doc.addEventListener('pointerdown', (e) => { keys = false; skipCel(); safe(() => press(e)); }, true);
    doc.addEventListener('keydown', (e) => { if (/^(Tab|Arrow|Enter| )/.test(e.key)) keys = true; skipCel(); }, true);
    addEventListener('gamepadconnected', () => (keys = true));

    if (window.matchMedia && matchMedia('(hover: hover)').matches) {
      doc.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse') return; const b = btnOf(e.target); if (b && b !== brushFor && !b.disabled && !fighting()) brush(b); else if (!b && brushFor) unbrush(); }, true);
    }

    doc.addEventListener('focusin', (e) => { const b = btnOf(e.target); if (b && keys && !fighting()) setTimeout(() => { if (doc.activeElement && btnOf(doc.activeElement) === b) brush(b); }, Math.max(60, lastEnter + 650 - now())); }, true);
    doc.addEventListener('focusout', () => { if (brushFor && !brushFor.matches(':hover')) unbrush(); }, true);
    addEventListener('scroll', () => unbrush(), true);
    addEventListener('resize', () => { unbrush(); figLayout(); });
    doc.addEventListener('visibilitychange', () => { ambientSync(); if (!doc.hidden) figRun(); });
    const g = G(); if (g) hookGame(g);

    setInterval(() => { if (!fighting()) { ambientSync(); sync(); } }, 2000);
    queue();
  }

  ND.alive = { level, celebrate, gesture, play, enter, countUp, wipe, slash, _figs: () => figs };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})(window.ND);
