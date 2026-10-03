


































(function (ND) {
  'use strict';
  const $ = (id) => (typeof document !== 'undefined' && document.getElementById ? document.getElementById(id) : null);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const ALL = ['left', 'right', 'up', 'guard', 'light', 'heavy', 'kick', 'throw', 'dodge', 'special'];


  const PASSES = [
    { id: 'freeze', tz: 1, spd: 0.7, tell: 0.25, cnt: 0.16 },
    { id: 'slow', tz: 0.3, spd: 0.8, tell: 0.3, cnt: 0.2 },
    { id: 'real', tz: 1, spd: 0.85, tell: 0.45, cnt: 0.26 },
  ];
  const GAP = 105;
  const LEAD = 0.03;




  const RING = 0.4;
  const RING_MARGIN = 1 / 60;
  const CARD = 1.4;
  const CARD0 = 0.6;
  const WARM = 3;
  const REACH = 85;
  const NUDGE = 3.5;

  const NUDGE_SHORT = 1.4;
  const HELP_AFTER = 2;

  const STEPS = ['attack', 'guard', 'counter', 'timing'];
  const STEP_ACT = { attack: 'light', guard: 'guard', counter: 'light', timing: 'guard' };
  const OK_SHOW = 0.8;
  const HOLD = 0.24;

  const STR = () => (ND.STR && ND.STR.tutor) || {};
  const tt = (s) => (ND.i18n && ND.i18n.t ? ND.i18n.t(s) : s);
  const now = () => (typeof ND.simClock === 'number' ? ND.simClock : 0);
  const FORCED = (() => { try { return /[?&]tutorial=1(&|$)/.test(location.search || ''); } catch (e) { return false; } })();

  const tutor = ND.tutor = {
    on: false, G: null, opts: {}, forced: FORCED, forcedUsed: false,
    pass: 0, beat: 0, from: 0, ph: 'off', phT: 0, card: 0, cardNeed: 0, frozen: null, prompt: null, contactAt: 0, fails: 0, done: 0,
    assist: null, taps: [], msg: null, msgT: 0, shownKey: '', anim: 0, mask: null, tzNow: 1, log: null, boxB: 0, boxT: 0,
    warm: false, warmHits: 0, quick: false, waitT: 0, nudge: false, btnXY: null,
    short: false, stepN: 0, passFails: 0, skipped: false, skipOn: false,



    start(G, opts) {
      if (!G || !G.F) return;
      this.stop();
      this.G = G; this.on = true; this.opts = opts || {};
      this.pass = 0; this.beat = 0; this.from = 0; this.fails = 0; this.done = 0; this.passFails = 0; this.skipped = false; this.okT = 0;
      this.frozen = null; this.prompt = null; this.assist = null; this.taps.length = 0; this.msg = null; this.shownKey = '';

      this.short = this.warm = this.quick = !!(this.opts.first || this.opts.forced);
      this.stepN = this.short ? 1 : 0;
      this.warmHits = 0; this.waitT = 0; this.nudge = false; this.btnXY = null;
      this.set('wait');
      if (this.opts.first && ND.funnel) ND.funnel.step('tut');
      this.lv0 = G.matchLevel; G.matchLevel = 0;
      const sc = ND.score;
      this.score0 = sc ? { on: !!sc.on, level: sc.level } : null;
      if (sc && sc.on) sc.off();
      const [f1, f2] = G.F;



      f1.ctrl.noTap0 = !!f1.ctrl.noTap; f2.ctrl.noTap0 = !!f2.ctrl.noTap;
      f1.ctrl.noTap = true; f2.ctrl.noTap = true;
      for (const ai of G.ais || []) if (ai && ai.releaseAll) ai.releaseAll();
      this.setMask(null);
    },

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
        G.F[0].ctrl.mask = null; G.F[0].ctrl.maskAlias = null;
        if (G.matchLevel === 0 && this.lv0 != null) G.matchLevel = this.lv0;
      }
      this.mask = null; this.frozen = null; this.prompt = null; this.assist = null; this.taps.length = 0; this.nudge = false; this.waitT = 0; this.quick = false;
      this.showBox(null);
      this.touchMark(null);
      this.showSkip(false);
    },

    skip() {
      if (!this.on || !this.short || this.ph === 'mastered') return;
      this.skipped = true;
      this.note('skip');
      if (this.opts.first) { if (ND.funnel) ND.funnel.step('tut_skip'); this.stat('tutorial_skip'); }
      if (ND.audio && ND.audio.ready && ND.audio.ui) ND.audio.ui();
      this.finish();
    },

    stepDone(n) {
      if (!this.short || n !== this.stepN) return;
      const id = STEPS[n - 1], S = STR();
      this.stepN = n + 1;

      this.okWord = (S.ok && S.ok[id]) || ''; this.okT = this.okWord ? OK_SHOW : 0; this.okN = n;
      this.ok();
      this.note('step:' + n);
      if (this.opts.first) {
        if (ND.funnel) ND.funnel.step(['warm', 'tut1', 'tut2', 'tut3'][n - 1]);
        this.stat('tutorial_step_' + n);
      }
    },

    stat(name) { try { if (ND.studioStats && ND.studioStats.event) ND.studioStats.event(name); } catch (e) {                             } },

    helped() { return this.pass === 0 || (this.short && this.passFails >= HELP_AFTER); },

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

      if ((opts.first || opts.forced) && ND.coach) ND.coach.start(this.skipped ? null : ['attack', 'combo']);
    },

    autoStart(G, mode, opts) {
      if (opts && opts.drill) return this.start(G, { drill: true });
      if (this.forced && !this.forcedUsed && { cpu: 1, arcade: 1, tourney: 1, dan: 1, rival: 1 }[mode]) {
        this.forcedUsed = true;
        this.start(G, { forced: true });
      }
    },


    set(ph) { this.ph = ph; this.phT = 0; },

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

    tta(f) {
      if (f.state !== 'atk') return 9;
      const w = f.curWin(false);
      if (!w) return 9;
      return f.st >= w[0] ? 0 : (w[0] - f.st) / (f.ch.spd * (f.aspd || 1));
    },


    ring(G, f) {
      const win = ND.parryWin ? ND.parryWin(f) : 0.2, u = this.contactAt - G.clock;
      return { frac: clamp((u - win / 2) / RING, 0, 1), lit: u <= win - RING_MARGIN && u >= 0, win, u };
    },
    mine() { return this.beat >= this.from; },
    note(ev) {
      if (this.log) this.log.push(ev);

    },
    device() {
      if (ND.touch && ND.touch.active) return 'touch';
      const c = this.G && this.G.F[0].ctrl;
      return c && c.lastSrc && c.lastSrc[0] === 'g' ? 'pad' : 'key';
    },

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
      for (const f of this.G.F) { f.hp = f.maxHp; f.ghost = f.maxHp; f.posture = 0; f.damageTaken = 0; f.ki = 0; }
      this.hp1 = this.G.F[0].hp; this.hp2 = this.G.F[1].hp;
    },
    releaseAll() { for (const f of this.G.F) for (const a of ALL) f.ctrl.release(a, 'tut'); this.assist = null; this.holdUntil = 0; },
    fail(why) {
      this.fails++; this.passFails++;
      this.note('fail:' + why + ':' + this.pass + ':' + this.beat);
      this.from = this.beat;
      this.releaseAll(); this.setMask(null);
      this.frozen = null; this.prompt = null;
      this.msg = why; this.msgT = 0;
      const f1 = this.G.F[0];
      if (ND.fx && ND.fx.text) ND.fx.text(f1.x, -240, STR().again || 'AGAIN!', '#ff9b7a');
      this.set('fail');
    },
    ok() { if (ND.audio && ND.audio.ready && ND.audio.tick) ND.audio.tick(0); },



    pre(G, rdt) {
      if (!this.on || G !== this.G) return 1;
      for (let i = 0; i < this.taps.length; i += 2) this.taps[i].ctrl.release(this.taps[i + 1], 'tut');
      this.taps.length = 0;
      if (G.phase !== 'fight') {
        if (G.phase !== 'intro' && this.ph !== 'wait') this.stop();
        return 1;
      }
      if (G.lock && G.endLock) { G.endLock(null); if (this.ph === 'def') { this.fail('early'); } }

      for (const f of G.F) if (f.hp < f.maxHp * 0.4 && !f.dead) { f.hp = f.maxHp; f.ghost = f.maxHp; }
      this.phT += rdt;
      const tz = this.step(G, rdt);
      this.tzNow = tz;
      return tz;
    },

    step(G, rdt) {
      const [f1, f2] = G.F, P = PASSES[this.pass], slow = this.mine() ? P.tz : 1;

      const waiting = !!this.frozen || (this.ph === 'warm' && this.warmHits < WARM);
      this.waitT = waiting ? this.waitT + rdt : 0;
      this.nudge = waiting && this.waitT >= (this.short ? NUDGE_SHORT : NUDGE);
      f1.ctrl.maskAlias = this.nudge && this.device() === 'touch' ? this.frozen || 'light' : null;
      switch (this.ph) {
        case 'wait':
          this.refill();
          if (this.warm && this.warmHits < WARM) {
            this.set('warm'); this.hp2 = f2.hp; this.lightBuf = f1.ctrl.buf.light; this.prompt = 'light'; this.waitT = 0;
            this.setMask(['light']);
            return 1;
          }
          this.set('arrange'); this.card = 0; this.cardNeed = CARD;
          return 1;



        case 'warm': {

          const more = this.warmHits < WARM;
          this.setMask(more ? ['light'] : null);
          this.prompt = more ? 'light' : null;
          const c = f1.ctrl;
          if (c.buf.light != null && c.buf.light !== this.lightBuf) { this.lightBuf = c.buf.light; this.waitT = 0; this.nudge = false; }
          if (f2.hp < this.hp2) { this.warmHits++; this.note('warm:hit'); this.ok(); }
          this.hp2 = f2.hp;
          const side = f2.x >= f1.x ? 1 : -1, A = ND.ARENA || 880;
          if (f2.state === 'move' && f2.onGround) this.walk(f2, clamp(f1.x + side * REACH, -A + 30, A - 30));
          else { this.hold(f2, 'left', false); this.hold(f2, 'right', false); }
          if (this.warmHits >= WARM && f1.state !== 'atk') {
            for (const a of ['left', 'right']) this.hold(f2, a, false);
            this.prompt = null; this.nudge = false; this.waitT = 0;
            this.setMask(null);
            this.note('warm:done');
            this.stepDone(1);
            this.set('arrange'); this.card = 0; this.cardNeed = CARD0;
          }
          return 1;
        }


        case 'arrange': {
          this.setMask(null);
          this.card += rdt;
          const side = f2.x >= f1.x ? 1 : -1, A = ND.ARENA || 880;
          const gap = this.gap || GAP, c = clamp((f1.x + f2.x) / 2, -A + gap, A - gap);


          const tol = Math.abs(Math.abs(f2.x - f1.x) - gap) > 12 ? 6 : 18;
          const done1 = this.walk(f1, c - side * gap / 2, tol), done2 = this.walk(f2, c + side * gap / 2, tol);
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


        case 'tell':

          this.setMask((this.pass > 0 || this.short) && this.mine() ? ['guard'] : null);
          if (G.clock >= this.contactAt - this.opening(f2) / P.spd && f2.state === 'move') {
            f2.dir = f1.x >= f2.x ? 1 : -1; f2.chainN = 0;
            f2.startAtk('light1', P.spd);
            this.atkSerial = f2.serial; this.hp1 = f1.hp; this.guardSeen = -9; this.wasAtk = false;
            this.beat = 0; this.set('def');
          }
          return slow;


        case 'def': return this.def(G, f1, f2, P, slow);


        case 'cnt': return this.cnt(G, f1, f2, P, slow);


        case 'cpuPar': {
          this.setMask(null);
          if (f1.state === 'atk' && f1.atk.counter && !f1.hitDone && this.tta(f1) <= 0.07) this.hold(f2, 'guard', true);
          if (f2.state === 'parry') {
            this.hold(f2, 'guard', false);
            f1.ctrl.buf.light = null;
            this.note('cpuParry');
            this.beat = 2; this.set('cpuCnt');
            this.contactAt = G.clock + P.cnt + 0.09;
            this.prompt = this.pass > 0 && this.mine() ? 'guard' : null;
            return slow;
          }
          if (f2.hp < this.hp2 || (f1.state !== 'atk' && this.phT > 0.1) || this.phT > 3) { this.beat = 2; this.fail('miss'); }
          return this.mine() ? P.tz : 1;
        }


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


        case 'land': {
          this.setMask(null);
          if (f2.hp < this.hp2 || f2.state === 'hurt' || f2.state === 'launch') {
            this.note('landed');
            this.done++;
            this.ok();
            if (this.short) this.stepDone(this.pass === 0 ? 3 : 4);
            this.set('won');
            return 1;
          }
          if (f1.state !== 'atk' || !f1.atk.counter || this.phT > 2) this.fail('miss');
          return slow;
        }


        case 'won':
          this.setMask(null); this.prompt = null;
          if (this.phT > (this.short ? 0.9 : this.pass < 2 ? 1.5 : 0.6)) {
            this.from = 0; this.beat = 0;
            if (this.pass >= (this.short ? 1 : 2)) {
              this.set('mastered');
              const S = STR();

              if (G.banner) G.banner(this.short ? S.ready || 'READY!' : S.mastered || 'MASTERED!', '極', this.short ? S.readySub || '' : S.masteredSub || '', this.short ? 1.6 : 2.2);
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
          if (this.phT > (this.short ? 1.6 : 2.3)) this.finish();
          return 1;


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


    opening(f) {
      const M = ND.MOVES && ND.MOVES[f.ch.id], ATK = ND.ATK || {};
      const nm = M ? (typeof M === 'function' ? M(f, 'light1') : M.light1) || 'light1' : 'light1';
      const a = ATK[nm] || ATK.light1, w = a && (a.hits ? a.hits[0] : a.active);
      return (w ? w[0] : 0.13) / (f.ch.spd || 1);
    },

    walk(f, tx, tol = 18) {
      const dx = tx - f.x, far = Math.abs(dx);
      const hl = f.ctrl.srcs.left && f.ctrl.srcs.left.has('tut'), hr = f.ctrl.srcs.right && f.ctrl.srcs.right.has('tut');
      if (far <= 5 || (!hl && !hr && far < tol)) { if (hl) this.hold(f, 'left', false); if (hr) this.hold(f, 'right', false); return true; }
      const want = dx > 0 ? 'right' : 'left', other = dx > 0 ? 'left' : 'right';
      if (f.ctrl.srcs[other] && f.ctrl.srcs[other].has('tut')) this.hold(f, other, false);
      if (!(f.ctrl.srcs[want] && f.ctrl.srcs[want].has('tut'))) this.hold(f, want, true);
      return false;
    },


    def(G, f1, f2, P, slow) {
      const mine = this.mine(), freezePass = this.helped(), c = f1.ctrl;



      if (c.buf.guard != null && c.buf.guard !== this.guardBuf) {
        this.guardBuf = c.buf.guard; this.guardSeen = G.clock;
        if (mine && !freezePass) this.holdUntil = G.clock + HOLD;
      }
      if (this.holdUntil) { if (G.clock < this.holdUntil) this.hold(f1, 'guard', true); else { this.hold(f1, 'guard', false); this.holdUntil = 0; } }

      if (f1.state === 'parry') {
        this.hold(f1, 'guard', false); this.assist = null; this.frozen = null; this.holdUntil = 0;
        this.note('parry:' + this.beat);
        if (mine) this.ok();
        if (mine && this.pass === 0 && this.beat === 0) this.stepDone(2);
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

      if (!mine) {
        this.setMask(null);
        if (left <= 0.06) { this.hold(f1, 'guard', true); c.buf.guard = now(); }
        return 1;
      }
      if (freezePass) {
        if (this.frozen === 'guard') {
          if (c.buf.guard != null) {
            this.frozen = null; this.assist = 'guard'; this.prompt = null; this.nudge = false; this.waitT = 0; c.maskAlias = null;
            this.note('press:guard');
            this.ok();
          } else return 0;
        }

        if (this.short && !this.assist && c.buf.guard != null && left > LEAD) { this.assist = 'guard'; this.prompt = null; this.note('press:guard'); this.ok(); }
        if (this.assist === 'guard') { this.hold(f1, 'guard', true); c.buf.guard = now(); this.setMask(['guard']); return 1; }
        this.setMask(this.short ? ['guard'] : null);
        if (left <= LEAD) { this.freeze('guard'); return 0; }
        return 1;
      }

      this.setMask(['guard']);
      return slow;
    },


    cnt(G, f1, f2, P, slow) {
      const mine = this.mine(), c = f1.ctrl;
      if (f1.state === 'atk' && f1.atk.counter) {
        this.assist = null; this.frozen = null; this.prompt = null;
        this.note('counter:' + this.beat);
        if (mine) this.ok();
        this.hp2 = f2.hp;

        if (this.beat === 1 && !this.short) { this.set('cpuPar'); } else {

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
      if (this.helped()) {
        if (this.frozen === 'light') {
          if (c.buf.light != null) { this.frozen = null; this.assist = 'light'; this.nudge = false; this.waitT = 0; c.maskAlias = null; this.note('press:light'); this.ok(); }
          else return 0;
        }
        if (this.assist === 'light') { c.buf.light = now(); this.setMask(['light']); return 1; }
        this.setMask(this.short ? ['light'] : null);
        const ready = (f1.state === 'parry' && f1.st >= 0.12) || f1.state !== 'parry';
        if (ready && f1.counterUntil - G.clock > 0.08) { this.freeze('light'); return 0; }
        return 1;
      }
      this.setMask(['guard', 'light']);
      return slow;
    },

    freeze(act) {
      const G = this.G, c = G.F[0].ctrl;
      this.frozen = act; this.prompt = act; this.waitT = 0; this.nudge = false;
      this.setMask([act]);
      c.buf[act] = null;
      G.dim = Math.max(G.dim || 0, 0.5);
      this.note('freeze:' + act);
      if (ND.audio && ND.audio.ready && ND.audio.whoosh) ND.audio.whoosh(0.6);
    },


    tick(rdt) {
      if (!this.on) return;
      this.anim += rdt;
      const G = this.G;

      this.showSkip(!!G && this.short && (G.phase === 'fight' || G.phase === 'intro') && this.ph !== 'mastered' && !G.paused);
      if (!G || G.phase !== 'fight') { this.showBox(null); this.touchMark(null); return; }
      if (this.msg) this.msgT += rdt;
      const S = STR(), dev = this.device();
      let key = '', html = '';
      if (this.ph === 'mastered') key = '';
      else if (this.short) {

        const n = this.stepN, id = STEPS[n - 1], f = id && S.steps && S.steps[id];

        if (this.okT > 0 && this.frozen) this.okT = 0;
        if (this.okT > 0) { this.okT -= rdt; key = 'ok:' + this.okN; html = `<b>✓</b><span>${this.okWord}</span>`; }
        else if (this.ph === 'fail' && this.msg) { key = 'f:' + this.msg + dev; html = `<b>${n}/4</b><span>${(S.fail && S.fail[this.msg]) || ''}</span>`; }
        else if (id) {
          key = 's:' + n + (this.ph === 'warm' ? ':' + this.warmHits : '') + dev;
          html = `<b>${n}/4</b><span>${typeof f === 'function' ? f(this.chip(STEP_ACT[id]), this.chip('light')) : ''}</span>` +
            (this.ph === 'warm' ? `<em>${Math.min(this.warmHits, WARM)}/${WARM}</em>` : '');
        }
      } else if (this.ph === 'warm') {
        key = 'w:' + this.warmHits + dev;
        html = `<b>${Math.min(this.warmHits, WARM)}/${WARM}</b><span>${typeof S.warm === 'function' ? S.warm(this.chip('light')) : ''}</span>`;
      } else if (this.ph === 'fail' && this.msg) {
        key = 'f:' + this.msg + dev;
        html = `<b>${this.pass + 1}/3</b><span>${(S.fail && S.fail[this.msg]) || ''}</span>`;
      } else {
        const tip = S.pass && S.pass[PASSES[this.pass].id];
        key = 'p:' + this.pass + dev;
        html = `<b>${this.pass + 1}/3</b><span>${typeof tip === 'function' ? tip(this.chip('light'), this.chip('guard')) : tip || ''}</span>`;
      }
      if (key !== this.shownKey) { this.shownKey = key; this.showBox(key ? html : null, key[0] === 'f', key.startsWith('ok:')); this.boxT = 0; }
      if ((this.boxT -= rdt) <= 0) { this.boxT = 1; this.measureSkip(); this.measureBox(); }
      if (this.nudge && dev === 'touch' && (this.frozen || this.prompt) && (!this.btnXY || this.btnXY.act !== (this.frozen || this.prompt) || (this.btnT -= rdt) <= 0)) this.measureBtn(this.frozen || this.prompt);

      const st = this.short && this.ph !== 'fail' && this.ph !== 'won' ? STEPS[this.stepN - 1] : null;
      const want = this.frozen || this.prompt || (st ? STEP_ACT[st] : null);
      this.touchMark(dev === 'touch' ? want : null);
    },


    measureSkip() {
      const b = $('tutSkip'), app = $('app');
      if (!b || b.hidden || !app || !b.getBoundingClientRect || !app.style) return;
      const r = b.getBoundingClientRect(), a = app.getBoundingClientRect ? app.getBoundingClientRect() : { left: 0 };
      if (r.width > 2) app.style.setProperty('--tsk', Math.round(r.right - a.left + 10) + 'px');
    },

    showSkip(on) {
      if (on === this.skipOn) return;
      const b = $('tutSkip');
      this.skipOn = on;
      if (b) {
        if (on) {
          const t = STR().skip || 'SKIP';
          if (b.textContent !== t) b.textContent = t;
          b.onclick = (e) => { if (e && e.stopPropagation) e.stopPropagation(); this.skip(); };
        }
        b.hidden = !on;
      }

      const app = $('app');
      if (app && app.classList) app.classList.toggle('tutor-on', on);
    },

    measureBtn(act) {
      this.btnT = 1; this.btnXY = null;
      const t = $('touch'), cv = $('cv'), G = this.G;
      if (!t || t.hidden || !cv || !t.querySelector) return;
      const b = t.querySelector(act === 'guard' ? '.ta-guard, .td-d' : '.ta-light');
      if (!b || !b.getBoundingClientRect) return;
      const r = b.getBoundingClientRect(), c = cv.getBoundingClientRect(), k = (G && G.pxr) || 1;
      if (r.width < 2) return;
      this.btnXY = { act, x: (r.left + r.width / 2 - c.left) * k, y: (r.top + r.height / 2 - c.top) * k };
    },

    measureBox() {
      const el = $('coach'), cv = $('cv'), G = this.G;
      this.boxB = 0;
      if (!el || el.hidden || !cv || !el.getBoundingClientRect) return;
      const r = el.getBoundingClientRect(), c = cv.getBoundingClientRect();
      if (r.top - c.top < c.height / 2) this.boxB = (r.bottom - c.top) * ((G && G.pxr) || 1);
    },
    showBox(html, warn, good) {
      const el = $('coach');
      if (!el) return;
      if (!html) { if (!el.hidden && el.dataset.tutor) { el.hidden = true; el.classList.remove('in', 'warn', 'good'); delete el.dataset.tutor; } return; }
      el.innerHTML = html; el.dataset.tutor = '1';
      el.hidden = false; el.classList.toggle('warn', !!warn); el.classList.toggle('good', !!good); el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
    },


    touchMark(act) {
      const t = $('touch');
      if (!t) return;
      const v = act ? act + (this.frozen ? ' stop' : '') + (this.nudge ? ' nudge' : '') : '';
      if ((t.dataset.tutor || '') === v) return;
      if (v) t.dataset.tutor = v; else delete t.dataset.tutor;
    },






    draw(ctx) {
      const G = this.G, act = this.frozen || this.prompt;
      if (!this.on || !act || !G || G.phase !== 'fight' || G.paused) return;
      const cam = ND.cam, f = G.F[0];
      if (!cam || !f || f.dead) return;
      const S = STR(), guard = act === 'guard', col = guard ? '150,210,255' : '255,210,122';
      const steady = !!this.frozen || this.ph === 'warm', nudge = this.nudge && steady;
      let frac = 1, lit = false;
      if (!steady) {
        if (guard) { const r = this.ring(G, f); frac = r.frac; lit = r.lit; }
        else frac = clamp((f.counterUntil - G.clock) / (f.counterWin || 0.5), 0, 1);
      }
      const tch = this.device() === 'touch';
      let k = Math.max(cam.s, 0.7) * (this.pass === 2 && !steady ? 0.95 : 1.3);
      if (tch) k = Math.max(k, (G.pxr || 1) * (this.pass === 2 && !steady ? 0.85 : 1.1));
      if (nudge) k *= 1.2;
      const pulse = steady ? 1 + (nudge ? 0.16 : 0.09) * Math.sin(this.anim * (nudge ? 7 : 9)) : 1;

      const top = Math.max(cam.H * 0.2, this.boxB || 0) + 30 * k;
      let x = cam.sx(f.x), y = cam.sy(f.y - 205) - 70 * k;
      if (y < top) {
        const away = f.opp && f.opp.x > f.x ? -1 : 1;
        x = clamp(x + away * 110 * k, 70 * k, cam.W - 70 * k); y = Math.max(top, cam.sy(f.y - 150));
      }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const key = this.label(act), ky = y + 30 * k;

      const R0 = 17 * k;

      if (lit) {
        ctx.fillStyle = 'rgba(232,246,255,.95)';
        ctx.beginPath(); ctx.arc(x, ky, R0 + 9 * k, 0, 6.283); ctx.fill();
      }
      ctx.lineWidth = (lit ? 4 : 3) * k;
      ctx.strokeStyle = lit ? '#ffffff' : `rgba(${col},${steady ? 0.55 + 0.35 * Math.sin(this.anim * 9) : 0.35 + 0.65 * (1 - frac)})`;
      ctx.beginPath(); ctx.arc(x, ky, steady ? R0 * 1.9 * pulse : R0 + 44 * k * frac + (lit ? 9 * k : 0), 0, 6.283); ctx.stroke();

      ctx.font = `700 ${Math.round(16 * k * pulse)}px Oswald, sans-serif`;
      const kw = Math.max(30 * k, ctx.measureText(key).width + 16 * k), kh = 26 * k;
      ctx.fillStyle = 'rgba(8,9,16,.92)'; ctx.strokeStyle = lit ? '#ffffff' : `rgb(${col})`; ctx.lineWidth = 2 * k;
      rr(ctx, x - kw / 2 * pulse, ky - kh / 2 * pulse, kw * pulse, kh * pulse, 6 * k); ctx.fill(); ctx.stroke();
      ctx.fillStyle = lit ? '#ffffff' : `rgb(${col})`; ctx.fillText(key, x, ky + k);

      if (this.pass < 2 || steady) {
        const word = guard ? S.defend || 'DEFEND!' : S.attack || 'ATTACK!';
        ctx.font = `700 ${Math.round(32 * k * pulse)}px Oswald, sans-serif`;
        ctx.lineWidth = 6 * k; ctx.strokeStyle = 'rgba(5,6,12,.92)';
        ctx.strokeText(word, x, y - 6 * k); ctx.fillStyle = `rgb(${col})`; ctx.fillText(word, x, y - 6 * k);
      }
      if (nudge) {

        const say = tch ? S.nudgeT : S.nudge, line = typeof say === 'function' ? say(key) : '';
        if (line) {
          ctx.font = `600 ${Math.round(14 * k)}px Oswald, sans-serif`;
          ctx.lineWidth = 4 * k; ctx.strokeStyle = 'rgba(5,6,12,.92)';
          ctx.strokeText(line, x, ky + 30 * k); ctx.fillStyle = '#f1d69c'; ctx.fillText(line, x, ky + 30 * k);
        }

        const B = tch && this.btnXY && this.btnXY.act === act ? this.btnXY : null;
        let dx = 1, dy = 0, ax = x - (kw / 2 + 46 * k), ay = ky;
        if (B) {
          const d = Math.hypot(B.x - x, B.y - ky) || 1;
          dx = (B.x - x) / d; dy = (B.y - ky) / d;
          const run = Math.min(d * 0.55, 160 * k);
          ax = x + dx * (run - 30 * k); ay = ky + dy * (run - 30 * k);
        }
        const bob = Math.sin(this.anim * 8) * 7 * k;
        arrow(ctx, ax + dx * bob, ay + dy * bob, dx, dy, 30 * k, `rgb(${col})`);
      }
      ctx.restore();
    },
  };

  function arrow(ctx, x, y, dx, dy, len, col) {
    const nx = -dy, ny = dx, h = len / 2, w = len * 0.28;
    const tx = x + dx * h, ty = y + dy * h, bx = x - dx * h, by = y - dy * h, hx = tx - dx * len * 0.45, hy = ty - dy * len * 0.45;
    ctx.beginPath();
    ctx.moveTo(tx, ty); ctx.lineTo(hx + nx * w * 1.7, hy + ny * w * 1.7); ctx.lineTo(hx + nx * w * 0.55, hy + ny * w * 0.55);
    ctx.lineTo(bx + nx * w * 0.55, by + ny * w * 0.55); ctx.lineTo(bx - nx * w * 0.55, by - ny * w * 0.55);
    ctx.lineTo(hx - nx * w * 0.55, hy - ny * w * 0.55); ctx.lineTo(hx - nx * w * 1.7, hy - ny * w * 1.7); ctx.closePath();
    ctx.lineWidth = Math.max(2, len * 0.12); ctx.strokeStyle = 'rgba(5,6,12,.92)'; ctx.stroke();
    ctx.fillStyle = col; ctx.fill();
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
})(window.ND);
