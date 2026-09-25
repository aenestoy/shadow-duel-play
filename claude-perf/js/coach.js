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
    on: false, i: 0, t: 0, done: false, guardT: 0, sawAtk: 0, parries0: 0,
    start() { this.on = true; this.i = 0; this.t = 0; this.guardT = 0; this.sawAtk = 0; this.parries0 = 0; this.shown = null; },
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
      const f1 = G.F[0], step = STEPS[this.i];
      if (!step) { this.stop(); return; }
      if (this.shown !== step + (ND.touch && ND.touch.active ? 't' : 'k')) {
        this.shown = step + (ND.touch && ND.touch.active ? 't' : 'k');
        el.innerHTML = `<b>${this.i + 1}/${STEPS.length}</b><span>${this.text(step)}</span>`;
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
        if (this.i >= STEPS.length) this.stop();
      }
    },
  };
})(window.ND);
