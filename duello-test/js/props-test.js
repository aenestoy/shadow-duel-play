// Shadow Duel — the props test page (?esya=1; published as shadow-duel-play/esya-test/). Never part of a shipped build.
// Akane vs Kuro in the real game (both renderers, every quality tier): buttons stage each interaction, "Free play" lets
// the two CPUs fight near the arena's props (they use them now and then), Slow-mo plays everything at a third.
// The fight never ends here (timer and health are topped up); everything else is the game itself.
(function (ND) {
  'use strict';
  const P = ND.props, G = ND.game;
  if (!P || !G) return;
  const q = (() => { try { return location.search + location.hash; } catch (e) { return ''; } })();
  if (!/[?&]esya=1(&|#|$)/.test(q) && !/#.*esya/.test(q)) return;
  const QS = new URLSearchParams(location.search);
  const $ = (id) => document.getElementById(id);
  const C1 = ND.CHARS.findIndex((c) => c.id === 'akane'), C2 = ND.CHARS.findIndex((c) => c.id === 'kuro');
  const T = ND.propTest = { slow: 1, mode: 'free', arena: QS.get('arena') || 'market', seed: +QS.get('seed') || 7, q: [], caption: null, log: [] };
  const A = () => G.F[0], K = () => G.F[1];

  // ------------------------------------------------------------------------------------------ the fight never ends
  const adv = G.advance.bind(G);
  let clock0 = 0;
  G.advance = function (rdt) {
    const r = adv(rdt * T.slow);
    if (G.mode === 'watch' && G.F) {
      G.timer = 60;
      for (const f of G.F) if (!f.dead && f.hp < f.maxHp * 0.3) { f.hp = f.maxHp; f.ghost = f.hp; }
    }
    const dt = Math.max(0, (ND.simClock || 0) - clock0); clock0 = ND.simClock || 0;
    direct(dt);
    if (T.caption) { T.caption.t -= rdt; if (T.caption.t <= 0) { T.caption = null; showCaption(''); } }
    return r;
  };
  // a KO in free play: back to a fresh round after the ragdoll has fallen (the props are set again)
  setInterval(() => { if (G.mode === 'watch' && G.F && G.F.some((f) => f.dead) && G.phase === 'ko' && G.pt > 2.2) { G.round = 1; G.wins = [0, 0]; G.startRound(); afterRound(); } }, 250);

  // ------------------------------------------------------------------------------------------ start
  function start(arena) {
    T.arena = arena || T.arena;
    try { ND.audio.init(); ND.audio.setEnabled(true); } catch (e) { /* no sound yet: the first tap */ }
    G.newMatch('watch', { c1: C1, c2: C2, arena: T.arena, seed: T.seed });
    T.ais = G.ais.slice(); // the two level-2 CPUs of the watch match, put back after each staged scene
    for (const id of ['menu', 'first', 'hud', 'pauseBtn']) { const el = $(id); if (el) el.hidden = true; }
    afterRound();
    setMode('free');
  }
  function afterRound() {
    for (const id of ['hud', 'pauseBtn']) { const el = $(id); if (el) el.hidden = true; }
  }
  T.start = start;

  // ------------------------------------------------------------------------------------------ the director
  // T.q: steps { start(), done(t) → true when finished (t = game seconds since the step started) } run in order,
  // driven by the simulation clock (slow motion slows them too).
  function direct(dt) {
    const s = T.q[0];
    if (!s) return;
    if (!s.on) { s.on = true; s.t = 0; if (s.start) s.start(); }
    s.t += dt;
    if (s.done ? s.done(s.t) : s.t >= (s.wait || 0)) T.q.shift();
  }
  T.direct = direct; // (scripts/props-check.mjs steps the demos without the page loop)
  const step = (start, done) => ({ start, done });
  const wait = (w) => ({ wait: w });
  // both fighters still, CPUs off, at these places, facing each other
  function stage(ax, kx, layout) {
    // the CPUs stay (they are part of the fight's state) but wait while a scene is staged (f.propHold)
    if (!G.ais.length && T.ais) G.ais = T.ais.slice();
    P.setCpu(false);
    for (const f of G.F) { f.locked = true; f.propHold = true; if (f.ctrl.clear) f.ctrl.clear(); }
    if (G.phase !== 'fight') { G.phase = 'fight'; G.pt = 9; G.focus = null; }
    for (const f of G.F) { if (f.dead) { f.reset(f.x); } f.setState('move'); f.vx = f.vy = 0; f.y = 0; f.onGround = true; f.hp = f.maxHp; f.posture = 0; f.counterUntil = 0; f.atkLock = 0; f.looseSword = null; if (f.wpn) f.wpn.none = false; }
    A().x = ax; K().x = kx;
    G.projs = []; G.lock = null; // (no shuriken left flying from the fight before)
    A().dir = kx >= ax ? 1 : -1; K().dir = -A().dir;
    P.reset(T.arena, { layout, seed: 99 });
    ND.fx.clear(); P.fxp.length = 0;
    G.slowT = 0; G.slow = 1; G.cineT = 0; G.hitstopT = 0;
  }
  function freeAgain(after = 1.2) {
    T.q.push(wait(after), step(() => { if (T.mode === 'demo') { setMode(T.loop ? 'demo' : 'free', true); if (T.loop) T.loop(); } }));
  }
  function caption(text, dur = 2.6) { T.caption = { t: dur }; showCaption(text); }
  const near = (p, f, d) => p && Math.abs(p.x - f.x) < d;
  // a cinematic camera / slow motion for the big moment (the game's own close-up)
  function cine(x, z = 1.5, dur = 0.9, slow = 0.4, slowT = 0.6) { G.cineT = dur; G.cineX = x; G.cineZ = z; G.slowT = slowT; G.slowV = slow; }

  const DEMOS = {
    cup: {
      label: 'Cup smash', run() {
        stage(-260, 20, [['table', -180, -6], ['cup', -200, 0, { on: 0 }], ['bottle', -168, 0, { on: 0 }], ['cup', -146, 0, { on: 0 }]]);
        caption('Grab the cup, smash it on his head');
        const cup = P.items[1];
        T.q.push(wait(0.4), step(() => P.playCine({ type: 'smash', prop: cup, user: A(), target: K() }), () => !P.S.tasks[0]));
        T.q.push(step(() => cine(K().x, 1.45, 1.0, 0.45, 0.5), (t) => t > 1.4));
        freeAgain();
      },
    },
    throwStool: {
      label: 'Chair throw', run() {
        stage(-230, 240, [['stool', -160, -4], ['lantern', 420, -10]]);
        caption('Pick up the chair and throw it');
        const st = P.items[0];
        T.q.push(wait(0.3), step(() => P.playCine({ type: 'throw', prop: st, user: A(), target: K() }), () => !P.S.tasks[0]));
        T.q.push(step(() => cine(K().x - 60, 1.35, 0.9, 0.5, 0.45), (t) => t > 1.6));
        freeAgain();
      },
    },
    fallStool: {
      label: 'Fall on chair', run() {
        stage(-60, 40, [['stool', 175, -2], ['bucket', 240, 0]]);
        caption('Knocked flying, he lands on the chair');
        let armed = true;
        T.q.push(wait(0.35), step(() => { A().locked = false; A().startAtk('heavy'); A().locked = true; }, () => {
          // the heavy cut knocks him into the air: steer the fall onto the chair
          if (armed && K().state === 'launch') { armed = false; P.slam(K(), P.items[0], { from: A() }); cine(140, 1.45, 1.2, 0.35, 0.7); }
          return !armed || A().state !== 'atk';
        }));
        T.q.push(step(null, (t) => t > 2));
        freeAgain();
      },
    },
    barrel: {
      label: 'Barrel kick', run() {
        stage(-260, 230, [['barrel', -170, -2], ['crate', 430, -12]]);
        caption('Kick the barrel into him');
        T.q.push(wait(0.3), step(() => P.go(A(), P.items[0], 'kick'), () => !P.S.tasks[0]));
        T.q.push(step(() => cine(80, 1.3, 1.0, 0.5, 0.5), (t) => t > 1.8));
        freeAgain();
      },
    },
    table: {
      label: 'Table slam', run() {
        stage(-20, 70, [['table', 225, -4], ['cup', 205, 0, { on: 0 }], ['bottle', 236, 0, { on: 0 }], ['cup', 262, 0, { on: 0 }], ['lantern', 360, -12]]);
        caption('Kicked through the table');
        T.q.push(wait(0.35), step(() => P.playCine({ type: 'slam', prop: P.items[0], user: A(), target: K() }), () => !P.S.tasks[0]));
        T.q.push(step(() => cine(200, 1.45, 1.2, 0.35, 0.6), (t) => t > 2));
        freeAgain();
      },
    },
    jar: {
      label: 'Cut the jar', run() {
        stage(-240, 230, [['jar', -175, -2]]);
        caption('Thrown jar, cut in the air');
        let swung = false;
        T.q.push(wait(0.3), step(() => P.playCine({ type: 'throw', prop: P.items[0], user: A(), target: K() }), () => {
          const j = P.items[0];
          // Kuro cuts when the jar is close (his light cut's active window meets it)
          if (!swung && j && j.st === 1 && j.owner === 0 && (Math.abs(j.x - K().x) - 70) / Math.max(200, Math.abs(j.vx)) <= 0.21 / (K().ch.spd || 1)) { swung = true; K().locked = false; K().startAtk('light1'); K().locked = true; cine(K().x - 70, 1.55, 1.0, 0.3, 0.55); }
          return swung && !P.S.tasks[0];
        }));
        T.q.push(step(null, (t) => t > 1.8));
        freeAgain();
      },
    },
    rack: {
      label: 'Re-arm at rack', run() {
        stage(-40, 70, [['rack', 330, -16], ['bale', -330, -8]]);
        caption('Disarmed: he takes a spare sword');
        const k = K();
        T.q.push(wait(0.3), step(() => { A().locked = false; A().startAtk('light2'); A().locked = true; }, (t) => t > 0.16));
        T.q.push(step(() => disarm(k), (t) => t > 0.75));
        T.q.push(step(() => P.go(k, P.items[0], 'rearm'), () => !P.S.tasks[1]));
        T.q.push(step(() => cine(k.x, 1.35, 0.6, 0.6, 0.3), (t) => t > 1));
        freeAgain(1.4);
      },
    },
    chain: {
      label: 'Parry → cup → table', run() {
        stage(-110, 10, [['table', -220, -6], ['cup', -236, 0, { on: 0 }], ['bottle', -206, 0, { on: 0 }], ['table', 250, -4], ['cup', 232, 0, { on: 3 }], ['cup', 266, 0, { on: 3 }], ['lantern', 390, -12]]);
        caption('Perfect parry → cup on the head → through the table', 4.2);
        const a = A(), k = K();
        // Kuro attacks; Akane parries at the last moment (guard pressed just before his blade arrives)
        T.q.push(wait(0.4), step(() => { k.locked = false; k.startAtk('heavy'); k.locked = true; a.locked = false; }, () => {
          if (k.state === 'atk' && k.atk && k.atk.active && k.st > k.atk.active[0] - 0.09 && !a.ctrl.held('guard')) a.ctrl.press('guard', 'dir');
          return a.state === 'parry' || (k.state !== 'atk' && k.st > 0.2);
        }));
        T.q.push(step(() => { a.ctrl.release('guard', 'dir'); a.locked = true; }, (t) => t > 0.35));
        // the defence chain: the cup from the table onto his head, then a kick through the other table
        T.q.push(step(() => {
          const C = P.cineCandidates(k, a), c = C.find((x) => x.type === 'smash');
          P.playCine(c, { then: () => P.cineCandidates(k, a).find((x) => x.type === 'slam') });
        }, () => !P.S.tasks[0]));
        T.q.push(step(() => cine(220, 1.45, 1.2, 0.35, 0.7), (t) => t > 2.2));
        freeAgain(1.4);
      },
    },
  };
  T.DEMOS = DEMOS;
  // a CPU waits while its fighter is held for a staged scene (the test page only)
  const aiUpd = ND.AI.prototype.update;
  ND.AI.prototype.update = function (dt) { if (this.me.propHold) { this.releaseAll(); return; } return aiUpd.call(this, dt); };
  // the opponent's sword flies out of his hand (the duel mode's disarm stands in here)
  function disarm(f) {
    const j = f.j;
    f.setState('stagger'); f.vx = -f.dir * 160;
    if (f.wpn) f.wpn.none = true;
    f.looseSword = new ND.LooseSword(j.haF.x, j.haF.y, j.tip.x, j.tip.y, -f.dir * 260, -760, f.dir * 520, f.wpn);
    if (ND.audio) ND.audio.clang(1.1, ND.cam.pan(f.x), 1.2);
    ND.fx.spark(j.haF.x, j.haF.y, -Math.PI / 2, 18, 1);
    ND.cam.punch(6); G.hitstop(0.08);
  }
  // loose swords of disarmed fighters fall (the game steps them only for a KO'd fighter)
  setInterval(() => { if (!G.F) return; for (const f of G.F) if (f.looseSword && !f.dead && !f.looseSword.stuck) f.looseSword.step(1 / 60 * T.slow); }, 16);

  function setMode(m, quiet) {
    T.mode = m;
    T.q.length = 0;
    if (m === 'free') {
      // two CPUs at level 2, the props' own CPU use on
      if (G.ais.length !== 2) G.ais = T.ais && T.ais.length === 2 ? T.ais.slice() : [new ND.AI(G.F[0], 2), new ND.AI(G.F[1], 2)];
      for (const f of G.F) { f.locked = false; f.propHold = false; if (f.wpn) f.wpn.none = false; f.looseSword = f.dead ? f.looseSword : null; }
      P.setCpu(true);
      if (!quiet) { P.reset(T.arena, { seed: T.seed }); caption('Free play: the CPUs fight near the props'); }
    }
    syncButtons();
  }
  T.setMode = setMode;
  T.play = function (name) { const d = DEMOS[name]; if (!d) return; T.q.length = 0; T.mode = 'demo'; T.cur = name; syncButtons(); d.run(); };
  // free play: props come back once most of them are broken
  setInterval(() => {
    if (T.mode !== 'free' || !P.items.length) return;
    const left = P.items.filter((p) => p.st !== 3).length;
    if (left <= P.items.length * 0.35 && !P.items.some((p) => p.st === 1 || p.st === 2)) { P.reset(T.arena, { seed: T.seed + ((ND.simClock * 10) | 0) }); }
  }, 1500);

  // ------------------------------------------------------------------------------------------ the panel
  const css = `
  #esya{position:fixed;left:0;right:0;top:0;z-index:900;display:flex;gap:6px;align-items:center;padding:6px 8px;padding-top:max(6px,env(safe-area-inset-top));
    padding-left:max(8px,env(safe-area-inset-left));padding-right:max(8px,env(safe-area-inset-right));background:linear-gradient(#090a12ee,#090a1200);
    overflow-x:auto;scrollbar-width:none;font:600 13px/1.1 system-ui,'Segoe UI',Roboto,Arial,sans-serif;color:#ebe6da;-webkit-tap-highlight-color:transparent}
  #esya::-webkit-scrollbar{display:none}
  #esya b{font:700 13px Oswald,system-ui,sans-serif;letter-spacing:.06em;color:#d9b36c;white-space:nowrap;margin-right:2px}
  #esya button,#esya select{font:inherit;color:#ebe6da;background:#1b1f2bdd;border:1px solid #3a4154;border-radius:8px;padding:6px 10px;min-height:32px;white-space:nowrap;cursor:pointer;touch-action:manipulation}
  #esya button.on{background:#c7402f;border-color:#e0584a;color:#fff}
  #esya .sep{width:1px;align-self:stretch;background:#3a4154;flex:none}
  #esyaCap{position:fixed;left:50%;bottom:9%;transform:translateX(-50%);z-index:899;font:700 clamp(15px,2.6vw,26px) Oswald,system-ui,sans-serif;letter-spacing:.05em;
    color:#f1e6cc;text-shadow:0 2px 0 #05060a,0 0 12px #05060a;pointer-events:none;text-align:center;white-space:nowrap;transition:opacity .25s}
  #esya.hide{display:none}
  #hud,#pauseBtn,#banner,#rally,#lockHint{display:none!important}`;
  function panel() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const bar = document.createElement('div'); bar.id = 'esya';
    if (QS.get('panel') === '0') bar.classList.add('hide');
    const btn = (label, fn, id) => { const b = document.createElement('button'); b.textContent = label; if (id) b.dataset.id = id; b.onclick = (e) => { e.stopPropagation(); try { ND.audio.init(); } catch (x) { /* */ } fn(); b.blur(); }; bar.appendChild(b); return b; };
    const sep = () => { const s = document.createElement('span'); s.className = 'sep'; bar.appendChild(s); };
    const t = document.createElement('b'); t.textContent = 'PROPS'; bar.appendChild(t);
    btn('Free play', () => setMode('free'), 'free');
    sep();
    for (const k in DEMOS) btn(DEMOS[k].label, () => T.play(k), k);
    sep();
    btn('Slow-mo', () => { T.slow = T.slow === 1 ? 0.33 : 1; syncButtons(); }, 'slow');
    btn('Reset', () => { if (T.mode === 'demo') T.play(T.cur); else { P.reset(T.arena, { seed: T.seed }); } });
    const sel = document.createElement('select');
    for (const a of ND.ARENAS) { const o = document.createElement('option'); o.value = a.id; o.textContent = a.id[0].toUpperCase() + a.id.slice(1); sel.appendChild(o); }
    sel.value = T.arena;
    sel.onchange = () => { T.arena = sel.value; ND.scene.setTheme(T.arena); if (T.mode === 'demo') T.play(T.cur); else P.reset(T.arena, { seed: T.seed }); sel.blur(); };
    bar.appendChild(sel);
    // renderer / quality: the page again with the choice in its address
    const ren = document.createElement('select');
    const cur = QS.get('renderer') === 'canvas' ? (QS.get('gfx') === 'low' ? 'canvas-low' : 'canvas') : QS.get('gfx') === 'low' ? 'gl-low' : 'gl';
    for (const [v, l] of [['gl', 'WebGL'], ['gl-low', 'WebGL · Low'], ['canvas', 'Canvas 2D'], ['canvas-low', 'Canvas · Low']]) { const o = document.createElement('option'); o.value = v; o.textContent = l; ren.appendChild(o); }
    ren.value = cur;
    ren.onchange = () => {
      const u = new URL(location.href), v = ren.value;
      u.searchParams.delete('renderer'); u.searchParams.delete('gfx');
      if (v.startsWith('canvas')) u.searchParams.set('renderer', 'canvas');
      if (v.endsWith('low')) u.searchParams.set('gfx', 'low');
      u.searchParams.set('arena', T.arena);
      location.href = u.toString();
    };
    bar.appendChild(ren);
    document.body.appendChild(bar);
    const cap = document.createElement('div'); cap.id = 'esyaCap'; document.body.appendChild(cap);
    T.bar = bar;
  }
  function syncButtons() {
    if (!T.bar) return;
    for (const b of T.bar.querySelectorAll('button')) {
      const id = b.dataset.id;
      b.classList.toggle('on', (id === 'free' && T.mode === 'free') || (id && id === T.cur && T.mode === 'demo') || (id === 'slow' && T.slow !== 1));
    }
  }
  function showCaption(s) { const el = $('esyaCap'); if (el) { el.textContent = s; el.style.opacity = s ? '1' : '0'; } }
  T.caption = null;
  T.captionText = showCaption;
  T.sayCaption = caption;

  // ------------------------------------------------------------------------------------------ boot: straight into the fight
  function boot() {
    if (!document.documentElement.classList.contains('nd-ready')) { setTimeout(boot, 120); return; }
    panel();
    start(T.arena);
    // a tap anywhere starts the sound (browsers need a gesture)
    const unlock = () => { try { ND.audio.init(); ND.audio.setEnabled(true); if (ND.music) ND.music.init && ND.music.init(); } catch (e) { /* */ } };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', (e) => {
      if (e.key === 's' || e.key === 'S') { T.slow = T.slow === 1 ? 0.33 : 1; syncButtons(); }
      if (e.key === 'h' || e.key === 'H') T.bar.classList.toggle('hide');
      const n = +e.key; if (n >= 1 && n <= 8) T.play(Object.keys(DEMOS)[n - 1]);
      if (e.key === '0') setMode('free');
    });
  }
  if (QS.get('esyaboot') !== '0') boot();
})(window.ND);
