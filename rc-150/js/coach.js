


(function (ND) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const STEPS = ['attack', 'combo', 'guard', 'parry', 'counter'];
  const MAX = { attack: 9, combo: 12, guard: 10, parry: 11, counter: 16 };

  const MARK = { attack: 'light', combo: 'light', guard: 'guard', parry: 'guard', counter: 'light' };




  const OPEN = { guard: 0, parry: 0, dodge: 0, rally: 0, smart: 0, aggr: 0.12 };





  const hints = ND.hints = {
    FADE: 250, hidT: -1e9, obs: null,
    watch() {
      if (this.obs) return;
      const b = $('banner');
      if (!b || typeof MutationObserver === 'undefined') return;
      let up = b.classList.contains('show');
      this.obs = new MutationObserver(() => { const now = b.classList.contains('show'); if (up && !now) this.hidT = performance.now(); up = now; });
      this.obs.observe(b, { attributes: true, attributeFilter: ['class'] });
    },


    bannerUp() {
      this.watch();
      const b = $('banner'), now = performance.now();
      if (b && b.classList.contains('show')) { this.hidT = now; return true; }
      return now - this.hidT < this.FADE;
    },
    coachUp() { const c = $('coach'); return !!(c && !c.hidden); },
    ctxUp() { const h = $('tCtxHint'); return !!(h && h.classList.contains('show')); },

    wait(who) { return this.bannerUp() || (who === 'coach' ? this.ctxUp() : this.coachUp()); },
  };

  const coach = ND.coach = {
    on: false, i: 0, t: 0, done: false, guardT: 0, sawAtk: 0, parries0: 0, steps: STEPS,

    start(steps) { this.on = true; this.steps = Array.isArray(steps) && steps.length ? steps.filter((s) => STEPS.includes(s)) : STEPS; this.i = 0; this.t = 0; this.guardT = 0; this.sawAtk = 0; this.parries0 = 0; this.shown = null; },
    stop() { this.on = false; this.hide(); },
    hide() { const el = $('coach'); if (el) { el.hidden = true; el.classList.remove('in'); } this.shown = null; this.mark(null); this.guardUp(); },

    guardDown(G) {
      const f2 = G.F[1], ai = G.ais && G.ais.find((a) => a.me === f2);
      if (!ai || (this.open && this.open.ai === ai)) return;
      this.guardUp();
      const lv = Object.assign({}, ai.lv, OPEN);
      this.open = { ai, lv, was: ai.lv };
      ai.lv = lv;

      ai.pending = null; ai.guardUntil = 0; ai.anticipate = 0;
      if (ai.setHeld) ai.setHeld('guard', false);
    },
    guardUp() {
      const o = this.open;
      if (!o) return;
      if (o.ai.lv === o.lv) o.ai.lv = o.was;
      this.open = null;
    },

    mark(act) { const t = $('touch'); if (t) { if (act) t.dataset.coach = act; else delete t.dataset.coach; } },
    text(step) {
      const C = (ND.STR && ND.STR.coach) || {}, touch = !!(ND.touch && ND.touch.active);
      const TB = (ND.STR && ND.STR.touch && ND.STR.touch.btn) || {};
      const key = (code) => `<kbd>${ND.input && ND.input.keyLabel ? ND.input.keyLabel(code) : code.slice(3)}</kbd>`;

      const btn = (b, c) => `<i class="tb ${c}">${b}</i>`;
      const k = touch ? { light: btn(TB.light || 'SALDIR', 'tb-light'), guard: btn(TB.guard || 'GARD', 'tb-guard') } : { light: key('KeyF'), guard: key('KeyS') };
      const f = (touch && C[step + 'T']) || C[step];
      return typeof f === 'function' ? f(k.light, k.guard) : '';
    },

    tick(dt, G) {
      if (!this.on) return;
      const el = $('coach');
      if (!el || G.phase !== 'fight' || G.paused) { if (el && !el.hidden && G.phase !== 'fight') this.hide(); return; }
      const f1 = G.F[0], S = this.steps, step = S[this.i];
      if (!step) { this.stop(); return; }
      if (this.shown !== step + (ND.touch && ND.touch.active ? 't' : 'k')) {

        if ((!this.shown || el.hidden) && hints.wait('coach')) return;
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

      else if (step === 'combo') ok = f1.state === 'atk' && f1.chainN >= 2 && f1.hitDone && this.t > 0.6;
      else if (step === 'guard') { const g = f1.state === 'guard' || f1.state === 'block' || f1.state === 'parry'; this.guardT = g ? this.guardT + dt : 0; ok = (this.guardT > 0.45 || f1.state === 'block' || f1.state === 'parry') && this.t > 1.5; }
      else if (step === 'parry') ok = (f1.parries || 0) > this.parries0 && this.t > 0.8;

      else if (step === 'counter') ok = f1.state === 'atk' && !!f1.atk.counter && this.t > 0.5;
      if (ok || this.t > MAX[step]) {
        this.i++; this.t = 0; this.shown = null;
        if (ok && ND.audio && ND.audio.ready) ND.audio.tick(0);
        if (this.i >= S.length) this.stop();
      }
    },
  };



















  const TIP_IDS = ['ki', 'gbreak', 'posture', 'dash', 'shuriken', 'heavy'];
  const FIGHTS = 8, GAP = 9, FIRST = 3, SHOW = 8, FAR = 430;

  const TIP_MARK = { ki: 'special', gbreak: 'heavy', posture: 'guard', dash: 'dodge', shuriken: 'throw', heavy: 'heavy' };

  const PAD = { light: 'X', heavy: 'Y', kick: 'B', throw: 'RB', guard: 'LB', dodge: 'RT', special: 'R3' };
  const KEY = { light: 'KeyF', heavy: 'KeyG', kick: 'KeyR', throw: 'KeyT', guard: 'KeyS', dodge: 'ShiftLeft', special: 'KeyE' };
  const TCLS = { light: 'tb-light', guard: 'tb-guard' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tips = coach.tips = {
    on: false, cur: null, t: 0, cool: 0, fightT: 0, cpuGuard: 0, far: 0, heavyUsed: false, parries0: 0, G: null,

    rec() { const p = ND.save && ND.save.p; return p && p.tips && typeof p.tips === 'object' ? p.tips : null; },
    seen(id) { const r = this.rec(); return !r || !!(r.seen && r.seen[id]); },
    live() { const r = this.rec(); return !!r && (r.n | 0) < FIGHTS && TIP_IDS.concat('lessons').some((id) => !this.seen(id)); },

    fightStarted(mode) {
      this.hide(true);
      this.fightT = 0; this.cpuGuard = 0; this.far = 0; this.heavyUsed = false; this.cool = FIRST;
      this.on = mode === 'arcade' && this.live();
      if (this.on) { const r = this.rec(); r.n = (r.n | 0) + 1; if (ND.save.commit) ND.save.commit(); }
    },
    stop() { this.on = false; this.hide(true); },
    markSeen(id) { const r = this.rec(); if (!r) return; if (!r.seen || typeof r.seen !== 'object') r.seen = {}; r.seen[id] = 1; if (ND.save.commit) ND.save.commit(); },

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
      if (hints.wait('coach')) return;
      const id = this.want(f1, f2, this.device());
      if (id) { this.parries0 = f1.parries || 0; this.show(id); }
    },

    afterWin() {
      const r = this.rec();
      if (!r || this.seen('lessons') || (r.n | 0) > FIGHTS) return false;
      const T = (ND.STR && ND.STR.tips) || {}, M = (ND.STR && ND.STR.menu) || {};
      if (typeof T.lessons !== 'function' || !ND.toast) return false;
      this.markSeen('lessons');
      ND.toast(T.lessons(M.train || '', M.trainTut || ''), '道');
      return true;
    },



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
