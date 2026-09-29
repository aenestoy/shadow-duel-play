// Shadow Duel — first-fight coach (ND.coach): five short tips in the very first fight — attack, an easy combo,
// guard, parry, and the counter after a defence (with the STRIKE! prompt that ND.cine draws over the fighter).
// Each tip stays until the player does it (or a few seconds pass), then the next one comes. Texts: ND.STR.coach.
(function (ND) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const STEPS = ['attack', 'combo', 'guard', 'parry', 'counter'];
  const MAX = { attack: 9, combo: 12, guard: 10, parry: 11, counter: 16 };
  // the touch button each tip talks about (it pulses on the pad)
  const MARK = { attack: 'light', combo: 'light', guard: 'guard', parry: 'guard', counter: 'light' };
  // While the combo tip is up the CPU lets its guard down, like an apprentice caught flat-footed: it neither guards,
  // parries nor dodges, does not brace for a return blow and swings a little less itself. Otherwise it blocks some
  // of the slashes, which ends the string, and the tip can time out before a newcomer lands three in a row.
  // Only this AI's level object is swapped (ai.js untouched); the original comes back when the tip goes.
  const OPEN = { guard: 0, parry: 0, dodge: 0, rally: 0, smart: 0, aggr: 0.12 };

  const coach = ND.coach = {
    on: false, i: 0, t: 0, done: false, guardT: 0, sawAtk: 0, parries0: 0, steps: STEPS,
    // steps: a subset of STEPS (after the rally tutorial, js/tutorial.js, only attack and combo are left)
    start(steps) { this.on = true; this.steps = Array.isArray(steps) && steps.length ? steps.filter((s) => STEPS.includes(s)) : STEPS; this.i = 0; this.t = 0; this.guardT = 0; this.sawAtk = 0; this.parries0 = 0; this.shown = null; },
    stop() { this.on = false; this.hide(); },
    hide() { const el = $('coach'); if (el) { el.hidden = true; el.classList.remove('in'); } this.shown = null; this.mark(null); this.guardUp(); },
    // the opponent's AI stops defending (combo tip) / defends again
    guardDown(G) {
      const f2 = G.F[1], ai = G.ais && G.ais.find((a) => a.me === f2);
      if (!ai || (this.open && this.open.ai === ai)) return;
      this.guardUp();
      const lv = Object.assign({}, ai.lv, OPEN);
      this.open = { ai, lv, was: ai.lv };
      ai.lv = lv;
      // let go of a guard it is holding right now and forget a planned block
      ai.pending = null; ai.guardUntil = 0; ai.anticipate = 0;
      if (ai.setHeld) ai.setHeld('guard', false);
    },
    guardUp() {
      const o = this.open;
      if (!o) return;
      if (o.ai.lv === o.lv) o.ai.lv = o.was;
      this.open = null;
    },
    // touch: the button the tip talks about pulses on the pad (#touch[data-coach] in index.html)
    mark(act) { const t = $('touch'); if (t) { if (act) t.dataset.coach = act; else delete t.dataset.coach; } },
    text(step) {
      const C = (ND.STR && ND.STR.coach) || {}, touch = !!(ND.touch && ND.touch.active);
      const TB = (ND.STR && ND.STR.touch && ND.STR.touch.btn) || {};
      const key = (code) => `<kbd>${ND.input && ND.input.keyLabel ? ND.input.keyLabel(code) : code.slice(3)}</kbd>`;
      // on touch the tip names the on-screen button, drawn like it (same colour ring) so the eye finds it
      const btn = (b, c) => `<i class="tb ${c}">${b}</i>`;
      const k = touch ? { light: btn(TB.light || 'SALDIR', 'tb-light'), guard: btn(TB.guard || 'GARD', 'tb-guard') } : { light: key('KeyF'), guard: key('KeyS') };
      const f = (touch && C[step + 'T']) || C[step];
      return typeof f === 'function' ? f(k.light, k.guard) : '';
    },
    // called by game.js every frame while the first fight is on
    tick(dt, G) {
      if (!this.on) return;
      const el = $('coach');
      if (!el || G.phase !== 'fight' || G.paused) { if (el && !el.hidden && G.phase !== 'fight') this.hide(); return; }
      const f1 = G.F[0], S = this.steps, step = S[this.i];
      if (!step) { this.stop(); return; }
      if (this.shown !== step + (ND.touch && ND.touch.active ? 't' : 'k')) {
        this.shown = step + (ND.touch && ND.touch.active ? 't' : 'k');
        el.innerHTML = `<b>${this.i + 1}/${S.length}</b><span>${this.text(step)}</span>`;
        el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
        this.mark(ND.touch && ND.touch.active ? MARK[step] : null);
        if (step === 'parry') this.parries0 = f1.parries || 0;
      }
      if (step === 'combo') this.guardDown(G); else if (this.open) this.guardUp();
      this.t += dt;
      let ok = false;
      if (step === 'attack') { if (f1.state === 'atk') this.sawAtk += dt; ok = this.sawAtk > 0.2 && this.t > 2.2; }
      // an easy combo: any chained third move that lands (LIGHT ×3 ends in the fighter's named finisher)
      else if (step === 'combo') ok = f1.state === 'atk' && f1.chainN >= 2 && f1.hitDone && this.t > 0.6;
      else if (step === 'guard') { const g = f1.state === 'guard' || f1.state === 'block' || f1.state === 'parry'; this.guardT = g ? this.guardT + dt : 0; ok = (this.guardT > 0.45 || f1.state === 'block' || f1.state === 'parry') && this.t > 1.5; }
      else if (step === 'parry') ok = (f1.parries || 0) > this.parries0 && this.t > 0.8;
      // counter after a guard or a parry (the STRIKE! prompt shows the moment)
      else if (step === 'counter') ok = f1.state === 'atk' && !!f1.atk.counter && this.t > 0.5;
      if (ok || this.t > MAX[step]) {
        this.i++; this.t = 0; this.shown = null;
        if (ok && ND.audio && ND.audio.ready) ND.audio.tick(0);
        if (this.i >= S.length) this.stop();
      }
    },
  };

  // ---------------------------------------------------------------- just-in-time tips (ND.coach.tips)
  // Small tips in the new player's first journey fights for what a player does not find alone, each at the moment it
  // matters. They never pause the fight, show in the coach's box (with the button on the touch pad pulsing) and go
  // when the thing is done, when the box is tapped / clicked, or after SHOW seconds.
  //   ki        the player's KI is full for the first time              → special (E · R3 · KI button)
  //   gbreak    the CPU keeps guarding for a while                       → kick / heavy slash break the guard
  //   posture   the player's own posture bar passes 70 %                 → back off or parry
  //   dash      the opponent stands far away                             → double tap forward
  //   shuriken  the opponent stands far away (a later time than dash)    → throw (not on the touch Simple layout)
  //   heavy     no heavy slash yet after a while in the fight            → heavy slash
  //   lessons   after the first journey win (a toast on the end screen)  → Training → Tutorial
  //   controls  after the first journey fight played to its end, touch screens only (a toast) → Settings → Controls
  // Rules: one tip at a time, GAP seconds between two, none in a round's first FIRST seconds, none during the rally
  // tutorial, the coach's own steps, a cinematic, a blade lock or a pause; journey fights only (not 2P, watch, VS CPU,
  // combo trials, the drill, tournaments…); each tip once ever: it is stored as seen in the progress save
  // (ND.save.p.tips.seen) the moment it shows; only in the first FIGHTS journey fights of the save (p.tips.n).
  // Saves from before the tips (a player past the first fight's coach) never get them (arcade.js normalize).
  // Texts: ND.STR.tips (Turkish source in i18n.js, block "just-in-time tips"; catalogs in i18n-*.js).
  const TIP_IDS = ['ki', 'gbreak', 'posture', 'dash', 'shuriken', 'heavy'];
  const FIGHTS = 8, GAP = 9, FIRST = 3, SHOW = 8, FAR = 430;
  // the touch button a tip talks about (#touch[data-coach] in index.html makes it pulse)
  const TIP_MARK = { ki: 'special', gbreak: 'heavy', posture: 'guard', dash: 'dodge', shuriken: 'throw', heavy: 'heavy' };
  // gamepad buttons (standard mapping, js/input.js pollPads) and keyboard keys (layout-aware names from ND.input)
  const PAD = { light: 'X', heavy: 'Y', kick: 'B', throw: 'RB', guard: 'LB', dodge: 'RT', special: 'R3' };
  const KEY = { light: 'KeyF', heavy: 'KeyG', kick: 'KeyR', throw: 'KeyT', guard: 'KeyS', dodge: 'ShiftLeft', special: 'KeyE' };
  const TCLS = { light: 'tb-light', guard: 'tb-guard' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tips = coach.tips = {
    on: false, cur: null, t: 0, cool: 0, fightT: 0, cpuGuard: 0, far: 0, heavyUsed: false, parries0: 0, G: null,
    // the progress save's record (arcade.js normalize: { n: journey fights with tips so far, seen: { id: 1 } })
    rec() { const p = ND.save && ND.save.p; return p && p.tips && typeof p.tips === 'object' ? p.tips : null; },
    seen(id) { const r = this.rec(); return !r || !!(r.seen && r.seen[id]); },
    live() { const r = this.rec(); return !!r && (r.n | 0) < FIGHTS && TIP_IDS.concat('lessons').some((id) => !this.seen(id)); },
    // a fight started (game.start): journey fights count toward FIGHTS; every fight resets the per-fight watchers
    fightStarted(mode) {
      this.hide(true);
      this.fightT = 0; this.cpuGuard = 0; this.far = 0; this.heavyUsed = false; this.cool = FIRST;
      this.on = mode === 'arcade' && this.live();
      if (this.on) { const r = this.rec(); r.n = (r.n | 0) + 1; if (ND.save.commit) ND.save.commit(); }
    },
    stop() { this.on = false; this.hide(true); },
    markSeen(id) { const r = this.rec(); if (!r) return; if (!r.seen || typeof r.seen !== 'object') r.seen = {}; r.seen[id] = 1; if (ND.save.commit) ND.save.commit(); },
    // key / button chips of the current device: keyboard (layout-aware key names), gamepad, or the touch pad's button
    device() {
      if (ND.touch && ND.touch.active) return 'touch';
      const c = this.G && this.G.F && this.G.F[0].ctrl;
      return c && c.lastSrc && c.lastSrc[0] === 'g' ? 'pad' : 'key';
    },
    chip(act, dev) {
      if (dev === 'touch') {
        const TB = (ND.STR && ND.STR.touch && ND.STR.touch.btn) || {};
        if (act === 'right' || act === 'left') return `<i class="tb">${act === 'left' ? '◀' : '▶'}</i>`;
        return `<i class="tb ${TCLS[act] || ''}">${esc(TB[act] || act)}</i>`;
      }
      if (dev === 'pad') return `<kbd>${act === 'right' ? '▶' : act === 'left' ? '◀' : PAD[act] || act}</kbd>`;
      const code = act === 'right' ? 'KeyD' : act === 'left' ? 'KeyA' : KEY[act];
      return `<kbd>${esc(ND.input && ND.input.keyLabel ? ND.input.keyLabel(code) : code.replace(/^Key/, ''))}</kbd>`;
    },
    // the Simple touch layout has no KICK and no SHURIKEN button (js/touch.js)
    touchHas(act) { const P = ND.touchPrefs; return !(P && P.layout !== 'full' && (act === 'kick' || act === 'throw')); },
    text(id, dev) {
      const T = (ND.STR && ND.STR.tips) || {}, f1 = this.G.F[0], ch = (a) => this.chip(a, dev);
      const fwd = f1.opp && f1.opp.x < f1.x ? 'left' : 'right';
      const f = (k, ...a) => (typeof T[k] === 'function' ? T[k](...a) : '');
      if (id === 'ki') return f('ki', ch('special'));
      if (id === 'gbreak') return dev === 'touch' && !this.touchHas('kick') ? f('gbreakH', ch('heavy')) : f('gbreak', ch('kick'), ch('heavy'));
      if (id === 'posture') return f('posture', ch('guard'));
      if (id === 'dash') return f('dash', ch(fwd));
      if (id === 'shuriken') return f('shuriken', ch('throw'));
      if (id === 'heavy') return f('heavy', ch('heavy'));
      return '';
    },
    show(id) {
      const el = $('coach'), dev = this.device(), html = this.text(id, dev);
      if (!el || !html) return false;
      const head = ((ND.STR && ND.STR.tips) || {}).head || '';
      el.innerHTML = `<b>${esc(head)}</b><span>${html}</span>`;
      el.dataset.tip = id; el.classList.add('tip');
      el.hidden = false; el.classList.remove('in', 'warn'); void el.offsetWidth; el.classList.add('in');
      // a tap / click on the box dismisses it
      el.onclick = (e) => { if (e && e.stopPropagation) e.stopPropagation(); if (this.cur) this.hide(); };
      coach.mark(dev === 'touch' ? TIP_MARK[id] : null);
      this.cur = id; this.t = 0;
      this.markSeen(id);
      return true;
    },
    hide(quiet) {
      const el = $('coach');
      if (el && el.dataset && el.dataset.tip) { el.hidden = true; el.classList.remove('in', 'tip'); delete el.dataset.tip; el.onclick = null; }
      if (this.cur) coach.mark(null);
      if (this.cur && !quiet) this.cool = GAP;
      this.cur = null;
    },
    // is it done? (the tip goes at once)
    done(id, f1, f2) {
      const atk = f1.state === 'atk' ? f1.atkName || '' : '';
      if (id === 'ki') return f1.ki < 100 || (!!atk && !!(f1.atk && f1.atk.special));
      if (id === 'gbreak') return f2.state === 'gbreak' || /^(heavy|kick)/.test(atk);
      if (id === 'posture') return f1.posture < 35 || (f1.parries || 0) > this.parries0;
      if (id === 'dash') return f1.state === 'dodge';
      if (id === 'shuriken') return atk === 'throw';
      if (id === 'heavy') return /^heavy/.test(atk);
      return false;
    },
    // the moment for a tip that is not seen yet (most urgent first)
    want(f1, f2, dev) {
      const ok = (id) => !this.seen(id);
      if (ok('posture') && f1.posture > 70) return 'posture';
      if (ok('ki') && f1.ki >= 100) return 'ki';
      if (ok('gbreak') && this.cpuGuard > 2.5) return 'gbreak';
      if (this.far > 0.8) {
        if (ok('dash')) return 'dash';
        if (ok('shuriken') && f1.ammo > 0 && (dev !== 'touch' || this.touchHas('throw'))) return 'shuriken';
      }
      if (ok('heavy') && !this.heavyUsed && this.fightT > 18) return 'heavy';
      return null;
    },
    // every frame (game.js portalTick)
    tick(dt, G) {
      if (!this.on || !G || !G.F) return;
      this.G = G;
      const f1 = G.F[0], f2 = G.F[1], T = ND.tutor;
      const quiet = G.mode !== 'arcade' || G.phase !== 'fight' || G.paused || (T && T.on) || coach.on || G.cineT > 0 || !!G.lock || !!G.replay || f1.dead || f2.dead;
      if (quiet) { if (this.cur && (G.phase !== 'fight' || G.mode !== 'arcade' || G.paused)) this.hide(true); return; }
      this.fightT += dt;
      if (f1.state === 'atk' && /^heavy/.test(f1.atkName || '')) this.heavyUsed = true;
      const dist = Math.abs(f2.x - f1.x);
      const guarding = (f2.state === 'guard' || f2.state === 'block' || f2.state === 'parry') && dist < 300;
      this.cpuGuard = guarding ? this.cpuGuard + dt : Math.max(0, this.cpuGuard - dt * 0.5);
      this.far = dist > FAR && f1.onGround && f2.onGround ? this.far + dt : 0;
      if (this.cur) {
        this.t += dt;
        if (this.done(this.cur, f1, f2)) { if (ND.audio && ND.audio.ready) ND.audio.tick(0); this.hide(); }
        else if (this.t > SHOW) this.hide();
        return;
      }
      if ((this.cool -= dt) > 0) return;
      const id = this.want(f1, f2, this.device());
      if (id) { this.parries0 = f1.parries || 0; this.show(id); }
    },
    // after a journey win: once, a toast pointing at the full lessons (Training → Tutorial)
    afterWin() {
      const r = this.rec();
      if (!r || this.seen('lessons') || (r.n | 0) > FIGHTS) return false;
      const T = (ND.STR && ND.STR.tips) || {}, M = (ND.STR && ND.STR.menu) || {};
      if (typeof T.lessons !== 'function' || !ND.toast) return false;
      this.markSeen('lessons');
      ND.toast(T.lessons(M.train || '', M.trainTut || ''), '道');
      return true;
    },
    // after a journey fight played to its end on a touch screen: once, a toast pointing at the layout editor
    // (Settings → Controls: move and resize the buttons). Same rules as the other tips: journey fights of a save that
    // gets tips (not a save from before them), once ever (stored as seen).
    afterFight(mode) {
      const r = this.rec();
      if (mode !== 'arcade' || !(ND.touch && ND.touch.active) || !r || this.seen('controls') || (r.n | 0) > FIGHTS) return false;
      const T = (ND.STR && ND.STR.tips) || {}, S = (ND.STR && ND.STR.set) || {};
      if (typeof T.controls !== 'function' || !ND.toast) return false;
      this.markSeen('controls');
      ND.toast(T.controls(S.title || '', (S.tabs && S.tabs.controls) || ''), '手');
      return true;
    },
  };
})(window.ND);
