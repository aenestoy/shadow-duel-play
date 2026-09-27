// Shadow Duel — first-fight rally tutorial (ND.tutor): "defend → counter → defend → counter", three passes.
//
//   1. freeze: the CPU makes a slow, clear cut; just before it lands the game stops (the game's own time stop, not the
//      pause) and DEFEND! + the guard key / button pulses. Only a guard press lets time run again, and that press is
//      held for the player until the blade lands, so it always ends in a parry (the deflection plays). Then the game
//      stops again on the counter window: ATTACK! + the light key. The counter is parried by the CPU, which strikes
//      back: stop → DEFEND! → parry → stop → ATTACK! → the counter lands and the exchange is won.
//   2. slow motion: the same exchange at SLOW speed; a ring over the fighter closes at the right moment and the player
//      has to press it on time. A missed step (hit, blocked instead of parried, too slow to counter) is repeated: the
//      tutor plays the steps before it by itself and gives the player that step again.
//   3. full speed: the same once more with only the key chip and ring as a reminder; a missed step is repeated.
//   MASTERED! → the fight is set up again from round 1 (full health, clock, score, stats, journey goal), the CPU's own
//   AI takes over again and the coach gives its attack / combo tips.
// During the tutorial the CPU is not driven by its AI but by this file (ctrl presses with the source 'tut'); the
// player's controller is masked (ND.Ctrl mask, js/input.js) to the buttons of the current step. The round clock stops,
// ND.score is off, the player's defence timing uses the easiest (Apprentice) window, and health is refilled after
// every pass and every missed step.
// game.js calls: pre(G, STEP) before every fixed step (returns the time scale: 0 = frozen), tick(rdt) every display
// frame (DOM: tip box, touch button pulse), draw(ctx) after the counter cinematic. The input buffers run on the
// scaled clock while the tutorial is on (game.advance), so the slow pass really widens the timing windows.
// Who sees it: the first journey fight of a new save (ND.save.p.coached, arcade.js), Training → "Parry drill"
// (game.startDrill) and, for testing on a device that already has a save, ?tutorial=1 (the next single-player fight
// of that page load). Texts: ND.STR.tutor (Turkish source in i18n.js, catalogs in i18n-*.js).
(function (ND) {
  'use strict';
  const $ = (id) => (typeof document !== 'undefined' && document.getElementById ? document.getElementById(id) : null);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const ALL = ['left', 'right', 'up', 'guard', 'light', 'heavy', 'kick', 'throw', 'dodge', 'special'];
  // pass settings: tz = time scale while it is the player's turn, spd = the CPU's opening cut speed, tell = game
  // seconds the CPU stands ready (the prompt ring is already closing) before it cuts, cnt = its wait before its counter
  const PASSES = [
    { id: 'freeze', tz: 1, spd: 0.7, tell: 0.25, cnt: 0.16 },
    { id: 'slow', tz: 0.3, spd: 0.8, tell: 0.3, cnt: 0.2 },
    { id: 'real', tz: 1, spd: 0.85, tell: 0.45, cnt: 0.26 },
  ];
  const GAP = 105;     // distance between the fighters when the CPU cuts (the rally's recoils push them apart)
  const LEAD = 0.03;   // freeze this long (game s) before the CPU blade's active window
  const RING = 0.6;    // the DEFEND ring closes over this many game seconds
  const CARD = 2;      // real seconds the pass card is up before the first cut of a pass
  const HOLD = 0.24;   // a guard press is kept down this long (game s) in the slow and full-speed passes
  // beats: 0 = defend the CPU cut, 1 = counter, 2 = defend the CPU's counter, 3 = counter that lands
  const STR = () => (ND.STR && ND.STR.tutor) || {};
  const tt = (s) => (ND.i18n && ND.i18n.t ? ND.i18n.t(s) : s);
  const now = () => (typeof ND.simClock === 'number' ? ND.simClock : 0);
  const FORCED = (() => { try { return /[?&]tutorial=1(&|$)/.test(location.search || ''); } catch (e) { return false; } })();

  const tutor = ND.tutor = {
    on: false, G: null, opts: {}, forced: FORCED, forcedUsed: false,
    pass: 0, beat: 0, from: 0, ph: 'off', phT: 0, card: 0, cardNeed: 0, frozen: null, prompt: null, contactAt: 0, fails: 0, done: 0,
    assist: null, taps: [], msg: null, msgT: 0, shownKey: '', anim: 0, mask: null, tzNow: 1, log: null, boxB: 0, boxT: 0,

    // ---------------------------------------------------------------- lifecycle
    // opts: { first } new player's first journey fight · { drill } Training → Parry drill · { forced } ?tutorial=1
    start(G, opts) {
      if (!G || !G.F) return;
      this.stop();
      this.G = G; this.on = true; this.opts = opts || {};
      this.pass = 0; this.beat = 0; this.from = 0; this.fails = 0; this.done = 0;
      this.frozen = null; this.prompt = null; this.assist = null; this.taps.length = 0; this.msg = null; this.shownKey = '';
      this.set('wait');
      this.lv0 = G.matchLevel; G.matchLevel = 0;
      const sc = ND.score;
      this.score0 = sc ? { on: !!sc.on, level: sc.level } : null;
      if (sc && sc.on) sc.off();
      const [f1, f2] = G.F;
      f1.ctrl.noTap0 = f1.ctrl.noTap; f2.ctrl.noTap0 = f2.ctrl.noTap;
      f1.ctrl.noTap = true; f2.ctrl.noTap = true; // walking the fighters into place must never read as a double-tap dash
      for (const ai of G.ais || []) if (ai && ai.releaseAll) ai.releaseAll();
      this.setMask(null);
    },
    // aborted (a new match, the menu): only undo what this file changed; start() sets up everything else again
    stop() {
      if (!this.on) return;
      this.cleanup();
      this.on = false; this.ph = 'off';
    },
    cleanup() {
      const G = this.G;
      if (G && G.F) {
        for (const f of G.F) {
          const c = f.ctrl;
          for (const a of ALL) c.release(a, 'tut');
          if (c.noTap0 !== undefined) { c.noTap = c.noTap0; delete c.noTap0; }
        }
        G.F[0].ctrl.mask = null;
        if (G.matchLevel === 0 && this.lv0 != null) G.matchLevel = this.lv0;
      }
      this.mask = null; this.frozen = null; this.prompt = null; this.assist = null; this.taps.length = 0;
      this.showBox(null);
      this.touchMark(null);
    },
    // the whole tutorial is done: back to a normal fight from round 1 (or to the menu after the drill)
    finish() {
      const G = this.G, opts = this.opts, sc = this.score0;
      this.cleanup();
      this.on = false; this.ph = 'off';
      if (!G) return;
      if (opts.drill) { if (G.goMenu) G.goMenu(); return; }
      if (sc && sc.on && ND.score) ND.score.begin(sc.level);
      if (G.stats) G.stats = [0, 1].map(() => ({ dmg: 0, parries: 0, specials: 0, counters: 0, rallies: 0, perfect: 0 }));
      for (const f of G.F) { f.parries = 0; f.ki = 0; }
      for (const ai of G.ais || []) if (ai) { if (ai.releaseAll) ai.releaseAll(); ai.pending = null; ai.guardUntil = 0; ai.anticipate = 0; ai.cAt = 0; }
      if (G.runner && G.runner.mode === G.mode && G.runner.tutorReset) G.runner.tutorReset();
      G.round = 1; G.wins = [0, 0];
      if (G.startRound) G.startRound();
      if (opts.first && ND.save && ND.save.p) { ND.save.p.coached = true; if (ND.save.commit) ND.save.commit(); }
      if ((opts.first || opts.forced) && ND.coach) ND.coach.start(['attack', 'combo']);
    },
    // game.start(): Training's drill, or ?tutorial=1 on the first single-player fight of this page load
    autoStart(G, mode, opts) {
      if (opts && opts.drill) return this.start(G, { drill: true });
      if (this.forced && !this.forcedUsed && { cpu: 1, arcade: 1, tourney: 1, dan: 1, rival: 1 }[mode]) {
        this.forcedUsed = true;
        this.start(G, { forced: true });
      }
    },

    // ---------------------------------------------------------------- helpers
    set(ph) { this.ph = ph; this.phT = 0; },
    // allow: the player's buttons for this moment (null = none); the tutor's own presses always pass
    setMask(allow) {
      const key = allow ? allow.join(',') : '';
      if (this.mask === key) return;
      this.mask = key;
      const c = this.G.F[0].ctrl, m = {};
      for (const a of ALL) if (!allow || allow.indexOf(a) < 0) { m[a] = true; if (c.buf[a] != null) c.buf[a] = null; }
      c.mask = m;
    },
    hold(f, a, on) { if (on) f.ctrl.press(a, 'tut'); else f.ctrl.release(a, 'tut'); },
    tap(f, a) { f.ctrl.release(a, 'tut'); f.ctrl.press(a, 'tut'); this.taps.push(f, a); },
    // game seconds until the next active window of f's attack (0 inside it, 9 when not attacking)
    tta(f) {
      if (f.state !== 'atk') return 9;
      const w = f.curWin(false);
      if (!w) return 9;
      return f.st >= w[0] ? 0 : (w[0] - f.st) / (f.ch.spd * (f.aspd || 1));
    },
    mine() { return this.beat >= this.from; },             // the current beat is the player's to do (not replayed)
    note(ev) { if (this.log) this.log.push(ev); },
    device() {
      if (ND.touch && ND.touch.active) return 'touch';
      const c = this.G && this.G.F[0].ctrl;
      return c && c.lastSrc && c.lastSrc[0] === 'g' ? 'pad' : 'key';
    },
    // key / button name for a prompt: keyboard key (layout aware), gamepad button, or the touch button's own name
    label(act) {
      const d = this.device();
      if (d === 'pad') return act === 'guard' ? 'LB' : 'X';
      if (d === 'touch') { const TB = (ND.STR && ND.STR.touch && ND.STR.touch.btn) || {}; return tt(act === 'guard' ? TB.guard || 'GARD' : TB.light || 'SALDIR'); }
      const code = act === 'guard' ? 'KeyS' : 'KeyF';
      return ND.input && ND.input.keyLabel ? ND.input.keyLabel(code) : code.slice(3);
    },
    chip(act) {
      const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      return this.device() === 'touch' ? `<i class="tb ${act === 'guard' ? 'tb-guard' : 'tb-light'}">${esc(this.label(act))}</i>` : `<kbd>${esc(this.label(act))}</kbd>`;
    },
    refill() {
      for (const f of this.G.F) { f.hp = f.maxHp; f.ghost = f.maxHp; f.posture = 0; f.damageTaken = 0; }
      this.hp1 = this.G.F[0].hp; this.hp2 = this.G.F[1].hp;
    },
    releaseAll() { for (const f of this.G.F) for (const a of ALL) f.ctrl.release(a, 'tut'); this.assist = null; this.holdUntil = 0; },
    fail(why) {
      this.fails++;
      this.note('fail:' + why + ':' + this.pass + ':' + this.beat);
      this.from = this.beat; // the missed step comes again; the tutor plays the ones before it
      this.releaseAll(); this.setMask(null);
      this.frozen = null; this.prompt = null;
      this.msg = why; this.msgT = 0;
      const f1 = this.G.F[0];
      if (ND.fx && ND.fx.text) ND.fx.text(f1.x, -240, STR().again || 'AGAIN!', '#ff9b7a');
      this.set('fail');
    },
    ok() { if (ND.audio && ND.audio.ready && ND.audio.tick) ND.audio.tick(0); },

    // ---------------------------------------------------------------- the step (before every fixed simulation step)
    // returns the time scale of this step: 0 = frozen (nothing moves), SLOW, or 1
    pre(G, rdt) {
      if (!this.on || G !== this.G) return 1;
      for (let i = 0; i < this.taps.length; i += 2) this.taps[i].ctrl.release(this.taps[i + 1], 'tut');
      this.taps.length = 0;
      if (G.phase !== 'fight') {
        if (G.phase !== 'intro' && this.ph !== 'wait') this.stop(); // KO / time up / the menu: the tutorial is over
        return 1;
      }
      if (G.lock && G.endLock) { G.endLock(null); if (this.ph === 'def') { this.fail('early'); } }
      // safety net: nobody is ever knocked out during the tutorial (health is refilled after each pass / missed step)
      for (const f of G.F) if (f.hp < f.maxHp * 0.4 && !f.dead) { f.hp = f.maxHp; f.ghost = f.maxHp; }
      this.phT += rdt;
      const tz = this.step(G, rdt);
      this.tzNow = tz;
      return tz;
    },

    step(G, rdt) {
      const [f1, f2] = G.F, P = PASSES[this.pass], slow = this.mine() ? P.tz : 1;
      switch (this.ph) {
        case 'wait':
          this.refill();
          this.set('arrange'); this.card = 0; this.cardNeed = CARD;
          return 1;

        // both walk (the tutor's own presses) to GAP apart; the pass card is read meanwhile
        case 'arrange': {
          this.setMask(null);
          this.card += rdt;
          const side = f2.x >= f1.x ? 1 : -1, A = ND.ARENA || 880;
          const gap = this.gap || GAP, c = clamp((f1.x + f2.x) / 2, -A + gap, A - gap);
          const done1 = this.walk(f1, c - side * gap / 2), done2 = this.walk(f2, c + side * gap / 2);
          const idle = f1.state === 'move' && f2.state === 'move' && f1.onGround && f2.onGround;
          if (!idle) this.phT = 0;
          const ready = idle && ((done1 && done2 && Math.abs(f1.vx) < 30 && Math.abs(f2.vx) < 30) || this.phT > 3);
          if (ready && this.card >= this.cardNeed) {
            for (const a of ['left', 'right']) { this.hold(f1, a, false); this.hold(f2, a, false); }
            this.refill();
            this.beat = 0; this.msg = null;
            this.set('tell');
            this.contactAt = G.clock + P.tell + this.opening(f2) / P.spd;
            this.prompt = this.pass > 0 && this.mine() ? 'guard' : null;
          }
          return 1;
        }

        // the CPU stands ready (the ring is closing), then cuts
        case 'tell':
          this.setMask(this.pass > 0 && this.mine() ? ['guard'] : null);
          if (G.clock >= this.contactAt - this.opening(f2) / P.spd && f2.state === 'move') {
            f2.dir = f1.x >= f2.x ? 1 : -1; f2.chainN = 0;
            f2.startAtk('light1', P.spd);
            this.atkSerial = f2.serial; this.hp1 = f1.hp; this.guardSeen = -9; this.wasAtk = false;
            this.beat = 0; this.set('def');
          }
          return slow;

        // defend: the CPU's opening cut (beat 0) or its counter (beat 2)
        case 'def': return this.def(G, f1, f2, P, slow);

        // counter after the parry (beat 1: parried by the CPU, beat 3: lands)
        case 'cnt': return this.cnt(G, f1, f2, P, slow);

        // the player's first counter is running: the CPU guards just in time and parries it
        case 'cpuPar': {
          this.setMask(null);
          if (f1.state === 'atk' && f1.atk.counter && !f1.hitDone && this.tta(f1) <= 0.07) this.hold(f2, 'guard', true);
          if (f2.state === 'parry') {
            this.hold(f2, 'guard', false);
            f1.ctrl.buf.light = null; // a mashed second press must not fire as a plain cut into the CPU's counter
            this.note('cpuParry');
            this.beat = 2; this.set('cpuCnt');
            this.contactAt = G.clock + P.cnt + 0.09;
            this.prompt = this.pass > 0 && this.mine() ? 'guard' : null;
            return slow;
          }
          if (f2.hp < this.hp2 || (f1.state !== 'atk' && this.phT > 0.1) || this.phT > 3) { this.beat = 2; this.fail('miss'); }
          return this.mine() ? P.tz : 1;
        }

        // the CPU answers with its own counter after a short beat
        case 'cpuCnt': {
          this.setMask(this.pass > 0 && this.mine() ? ['guard'] : null);
          const inWin = f2.counterUntil > G.clock;
          if (inWin && (f2.state !== 'parry' || f2.st >= P.cnt)) {
            this.tap(f2, 'light');
            if (f2.tryCounter()) {
              this.atkSerial = f2.serial; this.hp1 = f1.hp; this.guardSeen = -9; this.wasAtk = false;
              const w = f2.curWin(false);
              this.contactAt = G.clock + (w ? w[0] / (f2.ch.spd * (f2.aspd || 1)) : 0.08);
              this.note('cpuCounter');
              this.set('def');
            }
          } else if (!inWin && this.phT > 0.05) { this.fail('miss'); }
          return slow;
        }

        // the last counter is on its way: wait for it to land
        case 'land': {
          this.setMask(null);
          if (f2.hp < this.hp2 || f2.state === 'hurt' || f2.state === 'launch') {
            this.note('landed');
            this.done++;
            this.ok();
            this.set('won');
            return 1;
          }
          if (f1.state !== 'atk' || !f1.atk.counter || this.phT > 2) this.fail('miss');
          return slow;
        }

        // pass won: a beat to breathe, then the next pass (or MASTERED!)
        case 'won':
          this.setMask(null); this.prompt = null;
          if (this.phT > (this.pass < 2 ? 1.5 : 0.6)) {
            this.from = 0; this.beat = 0;
            if (this.pass >= 2) {
              this.set('mastered');
              const S = STR();
              if (G.banner) G.banner(S.mastered || 'MASTERED!', '極', S.masteredSub || '', 2.2);
              if (ND.audio && ND.audio.ready) { if (ND.audio.taiko) ND.audio.taiko(1.3); if (ND.audio.gong) ND.audio.gong(); }
              if (ND.cam && ND.cam.punch) ND.cam.punch(8);
              this.note('mastered');
            } else {
              this.pass++; this.card = 0; this.cardNeed = CARD;
              this.refill();
              this.set('arrange');
              this.note('pass:' + this.pass);
            }
          }
          return 1;

        case 'mastered':
          this.setMask(null);
          if (this.phT > 2.3) this.finish();
          return 1;

        // a missed step: the message, a short wait, full health, then the same pass from the missed step
        case 'fail':
          this.setMask(null); this.prompt = null;
          if (this.phT > 1.2 && f1.state === 'move' && f1.onGround) {
            this.refill();
            this.card = 0; this.cardNeed = 0.4; this.beat = 0;
            this.set('arrange');
          }
          return 1;
      }
      return 1;
    },

    // game seconds from the start of the CPU's opening cut to its active window (character move tables differ)
    opening(f) {
      const M = ND.MOVES && ND.MOVES[f.ch.id], ATK = ND.ATK || {};
      const nm = M ? (typeof M === 'function' ? M(f, 'light1') : M.light1) || 'light1' : 'light1';
      const a = ATK[nm] || ATK.light1, w = a && (a.hits ? a.hits[0] : a.active);
      return (w ? w[0] : 0.13) / (f.ch.spd || 1);
    },

    walk(f, tx) {
      const dx = tx - f.x, far = Math.abs(dx);
      const hl = f.ctrl.srcs.left && f.ctrl.srcs.left.has('tut'), hr = f.ctrl.srcs.right && f.ctrl.srcs.right.has('tut');
      if (far <= 5 || (!hl && !hr && far < 18)) { if (hl) this.hold(f, 'left', false); if (hr) this.hold(f, 'right', false); return true; }
      const want = dx > 0 ? 'right' : 'left', other = dx > 0 ? 'left' : 'right';
      if (f.ctrl.srcs[other] && f.ctrl.srcs[other].has('tut')) this.hold(f, other, false);
      if (!(f.ctrl.srcs[want] && f.ctrl.srcs[want].has('tut'))) this.hold(f, want, true);
      return false;
    },

    // ---- defend beat: parry the CPU's cut
    def(G, f1, f2, P, slow) {
      const mine = this.mine(), freezePass = this.pass === 0, c = f1.ctrl;
      // A guard press in the slow / full-speed pass is held for HOLD game seconds (like the touch pad's tap-to-parry):
      // in slow motion a quick tap would otherwise be let go (in real time) before the slowed blade arrives. The
      // timing still decides: too early and the hold runs out or it is only a block.
      if (c.buf.guard != null && c.buf.guard !== this.guardBuf) {
        this.guardBuf = c.buf.guard; this.guardSeen = G.clock;
        if (mine && !freezePass) this.holdUntil = G.clock + HOLD;
      }
      if (this.holdUntil) { if (G.clock < this.holdUntil) this.hold(f1, 'guard', true); else { this.hold(f1, 'guard', false); this.holdUntil = 0; } }
      // outcome of the previous step
      if (f1.state === 'parry') {
        this.hold(f1, 'guard', false); this.assist = null; this.frozen = null; this.holdUntil = 0;
        this.note('parry:' + this.beat);
        if (mine) this.ok();
        this.beat++;
        this.set('cnt');
        this.prompt = this.pass > 0 && this.mine() ? 'light' : null;
        return this.mine() ? P.tz : 1;
      }
      if (f1.hp < this.hp1 || f1.state === 'hurt' || f1.state === 'launch' || f1.state === 'down') {
        const early = this.guardSeen > G.clock - 0.9 && this.guardSeen > -9;
        this.fail(f1.state === 'atk' || this.wasAtk ? 'atk' : early ? 'early' : 'late');
        return 1;
      }
      this.wasAtk = f1.state === 'atk' && !f1.atk.counter;
      if (f1.state === 'block' || f1.state === 'gbreak') { this.fail('early'); return 1; }
      if (f2.state !== 'atk' || f2.serial !== this.atkSerial) { this.fail('miss'); return 1; }
      const left = this.tta(f2);
      // the player's own press, the tutor's replay, or the frozen moment
      if (!mine) {
        this.setMask(null);
        if (left <= 0.06) { this.hold(f1, 'guard', true); c.buf.guard = now(); }
        return 1;
      }
      if (freezePass) {
        if (this.frozen === 'guard') {
          if (c.buf.guard != null) { // pressed: time runs again and the guard is held until the blade lands
            this.frozen = null; this.assist = 'guard'; this.prompt = null;
            this.note('press:guard');
            this.ok();
          } else return 0;
        }
        if (this.assist === 'guard') { this.hold(f1, 'guard', true); c.buf.guard = now(); this.setMask(['guard']); return 1; }
        this.setMask(null);
        if (left <= LEAD) { this.freeze('guard'); return 0; }
        return 1;
      }
      // only GUARD is live while a blow comes (an attack button would just cut into the waiting CPU)
      this.setMask(['guard']);
      return slow;
    },

    // ---- counter beat: strike back inside the counter window
    cnt(G, f1, f2, P, slow) {
      const mine = this.mine(), c = f1.ctrl;
      if (f1.state === 'atk' && f1.atk.counter) {
        this.assist = null; this.frozen = null; this.prompt = null;
        this.note('counter:' + this.beat);
        if (mine) this.ok();
        this.hp2 = f2.hp;
        if (this.beat === 1) { this.set('cpuPar'); } else {
          // the winning blow must reach: the CPU stops sliding away from the recoil (a whiff would read as a failure)
          this.releaseAll(); f2.vx = 0; this.set('land');
        }
        return this.mine() ? P.tz : 1;
      }
      if (f1.hp < this.hp1) { this.fail('late'); return 1; }
      const open = f1.counterUntil > G.clock && ['parry', 'guard', 'move', 'block', 'recoil'].includes(f1.state);
      if (!open) { this.fail('slow'); return 1; }
      if (f1.state === 'parry' && f1.st > 0.03) this.hold(f1, 'guard', false);
      if (!mine) {
        this.setMask(null);
        if (f1.state !== 'parry' || f1.st >= 0.1) this.tap(f1, 'light');
        return 1;
      }
      if (this.pass === 0) {
        if (this.frozen === 'light') {
          if (c.buf.light != null) { this.frozen = null; this.assist = 'light'; this.note('press:light'); this.ok(); }
          else return 0;
        }
        if (this.assist === 'light') { c.buf.light = now(); this.setMask(['light']); return 1; }
        this.setMask(null);
        const ready = (f1.state === 'parry' && f1.st >= 0.12) || f1.state !== 'parry';
        if (ready && f1.counterUntil - G.clock > 0.08) { this.freeze('light'); return 0; }
        return 1;
      }
      this.setMask(['guard', 'light']);
      return slow;
    },

    freeze(act) {
      const G = this.G, c = G.F[0].ctrl;
      this.frozen = act; this.prompt = act;
      this.setMask([act]);
      c.buf[act] = null;      // only a press made now counts
      G.dim = Math.max(G.dim || 0, 0.5);
      this.note('freeze:' + act);
      if (ND.audio && ND.audio.ready && ND.audio.whoosh) ND.audio.whoosh(0.6);
    },

    // ---------------------------------------------------------------- every display frame: tip box, touch pulse
    tick(rdt) {
      if (!this.on) return;
      this.anim += rdt;
      const G = this.G;
      if (!G || G.phase !== 'fight') { this.showBox(null); this.touchMark(null); return; }
      if (this.msg) this.msgT += rdt;
      const S = STR(), dev = this.device();
      let key = '', html = '';
      if (this.ph === 'mastered') key = '';
      else if (this.ph === 'fail' && this.msg) {
        key = 'f:' + this.msg + dev;
        html = `<b>${this.pass + 1}/3</b><span>${(S.fail && S.fail[this.msg]) || ''}</span>`;
      } else {
        const tip = S.pass && S.pass[PASSES[this.pass].id];
        key = 'p:' + this.pass + dev;
        html = `<b>${this.pass + 1}/3</b><span>${typeof tip === 'function' ? tip(this.chip('light'), this.chip('guard')) : tip || ''}</span>`;
      }
      if (key !== this.shownKey) { this.shownKey = key; this.showBox(key ? html : null, key[0] === 'f'); this.boxT = 0; }
      if ((this.boxT -= rdt) <= 0) { this.boxT = 1; this.measureBox(); }
      this.touchMark(dev === 'touch' && (this.frozen || this.prompt) ? this.frozen || this.prompt : null);
    },
    // bottom of the tip box in canvas pixels when it is in the upper half (touch), so the prompt keeps below it
    measureBox() {
      const el = $('coach'), cv = $('cv'), G = this.G;
      this.boxB = 0;
      if (!el || el.hidden || !cv || !el.getBoundingClientRect) return;
      const r = el.getBoundingClientRect(), c = cv.getBoundingClientRect();
      if (r.top - c.top < c.height / 2) this.boxB = (r.bottom - c.top) * ((G && G.pxr) || 1);
    },
    showBox(html, warn) {
      const el = $('coach');
      if (!el) return;
      if (!html) { if (!el.hidden && el.dataset.tutor) { el.hidden = true; el.classList.remove('in', 'warn'); delete el.dataset.tutor; } return; }
      el.innerHTML = html; el.dataset.tutor = '1';
      el.hidden = false; el.classList.toggle('warn', !!warn); el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
    },
    // touch: the button to press glows and grows (#touch[data-tutor] in index.html); bigger while time is stopped
    touchMark(act) {
      const t = $('touch');
      if (!t) return;
      const v = act ? act + (this.frozen ? ' stop' : '') : '';
      if ((t.dataset.tutor || '') === v) return;
      if (v) t.dataset.tutor = v; else delete t.dataset.tutor;
    },

    // ---------------------------------------------------------------- canvas prompt over the player's fighter
    // DEFEND! / ATTACK! with the key chip; while time is stopped it pulses, in the slow and full-speed passes a ring
    // closes on the moment to press (full speed: chip and ring only, a small reminder)
    draw(ctx) {
      const G = this.G, act = this.frozen || this.prompt;
      if (!this.on || !act || !G || G.phase !== 'fight' || G.paused) return;
      const cam = ND.cam, f = G.F[0];
      if (!cam || !f || f.dead) return;
      const S = STR(), guard = act === 'guard', col = guard ? '150,210,255' : '255,210,122';
      let frac = 1;
      if (!this.frozen) {
        if (guard) frac = clamp((this.contactAt - G.clock) / RING, 0, 1);
        else frac = clamp((f.counterUntil - G.clock) / (f.counterWin || 0.5), 0, 1);
      }
      const tch = this.device() === 'touch';
      let k = Math.max(cam.s, 0.7) * (this.pass === 2 && !this.frozen ? 0.95 : 1.3);
      if (tch) k = Math.max(k, (G.pxr || 1) * (this.pass === 2 ? 0.85 : 1.1));
      const pulse = this.frozen ? 1 + 0.09 * Math.sin(this.anim * 9) : 1;
      // over the head; when that runs into the HUD or the tip box, beside the fighter (away from the opponent)
      const top = Math.max(cam.H * 0.2, this.boxB || 0) + 30 * k;
      let x = cam.sx(f.x), y = cam.sy(f.y - 205) - 70 * k;
      if (y < top) {
        const away = f.opp && f.opp.x > f.x ? -1 : 1;
        x = clamp(x + away * 110 * k, 70 * k, cam.W - 70 * k); y = Math.max(top, cam.sy(f.y - 150));
      }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const key = this.label(act), ky = y + 30 * k;
      // ring: closes on the moment (or a steady halo while frozen)
      const R0 = 17 * k;
      ctx.lineWidth = 3 * k;
      ctx.strokeStyle = `rgba(${col},${this.frozen ? 0.55 + 0.35 * Math.sin(this.anim * 9) : 0.35 + 0.65 * (1 - frac)})`;
      ctx.beginPath(); ctx.arc(x, ky, this.frozen ? R0 * 1.9 * pulse : R0 + 44 * k * frac, 0, 6.283); ctx.stroke();
      // key chip
      ctx.font = `700 ${Math.round(16 * k * pulse)}px Oswald, sans-serif`;
      const kw = Math.max(30 * k, ctx.measureText(key).width + 16 * k), kh = 26 * k;
      ctx.fillStyle = 'rgba(8,9,16,.92)'; ctx.strokeStyle = `rgb(${col})`; ctx.lineWidth = 2 * k;
      rr(ctx, x - kw / 2 * pulse, ky - kh / 2 * pulse, kw * pulse, kh * pulse, 6 * k); ctx.fill(); ctx.stroke();
      ctx.fillStyle = `rgb(${col})`; ctx.fillText(key, x, ky + k);
      // the word (not in the full-speed pass unless time is stopped)
      if (this.pass < 2 || this.frozen) {
        const word = guard ? S.defend || 'DEFEND!' : S.attack || 'ATTACK!';
        ctx.font = `700 ${Math.round(32 * k * pulse)}px Oswald, sans-serif`;
        ctx.lineWidth = 6 * k; ctx.strokeStyle = 'rgba(5,6,12,.92)';
        ctx.strokeText(word, x, y - 6 * k); ctx.fillStyle = `rgb(${col})`; ctx.fillText(word, x, y - 6 * k);
      }
      ctx.restore();
    },
  };
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
})(window.ND);
