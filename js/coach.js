// Shadow Duel — first-fight coach (ND.coach): three short tips in the very first fight — attack, guard, parry.
// Each tip stays until the player does it (or a few seconds pass), then the next one comes. Texts: ND.STR.coach.
(function (ND) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const STEPS = ['attack', 'guard', 'parry'];
  const MAX = { attack: 9, guard: 10, parry: 11 };

  const coach = ND.coach = {
    on: false, i: 0, t: 0, done: false, guardT: 0, sawAtk: 0, parries0: 0,
    start() { this.on = true; this.i = 0; this.t = 0; this.guardT = 0; this.sawAtk = 0; this.parries0 = 0; this.shown = null; },
    stop() { this.on = false; this.hide(); },
    hide() { const el = $('coach'); if (el) { el.hidden = true; el.classList.remove('in'); } this.shown = null; this.mark(null); },
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
      const f1 = G.F[0], step = STEPS[this.i];
      if (!step) { this.stop(); return; }
      if (this.shown !== step + (ND.touch && ND.touch.active ? 't' : 'k')) {
        this.shown = step + (ND.touch && ND.touch.active ? 't' : 'k');
        el.innerHTML = `<b>${this.i + 1}/3</b><span>${this.text(step)}</span>`;
        el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
        this.mark(ND.touch && ND.touch.active ? (step === 'attack' ? 'light' : 'guard') : null);
        if (step === 'parry') this.parries0 = f1.parries || 0;
      }
      this.t += dt;
      let ok = false;
      if (step === 'attack') { if (f1.state === 'atk') this.sawAtk += dt; ok = this.sawAtk > 0.2 && this.t > 2.2; }
      else if (step === 'guard') { const g = f1.state === 'guard' || f1.state === 'block'; this.guardT = g ? this.guardT + dt : 0; ok = (this.guardT > 0.45 || f1.state === 'block') && this.t > 1.5; }
      else if (step === 'parry') ok = (f1.parries || 0) > this.parries0 && this.t > 0.8;
      if (ok || this.t > MAX[step]) {
        this.i++; this.t = 0; this.shown = null;
        if (ok && ND.audio && ND.audio.ready) ND.audio.tick(0);
        if (this.i >= STEPS.length) this.stop();
      }
    },
  };
})(window.ND);
