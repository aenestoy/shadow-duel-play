// Shadow Duel — Training: combo trial (ND.comboTrial)
//
// For the selected fighter, 4–5 combos step by step, easiest first. Every step shows its inputs as key caps
// (keyboard: the real keys, the direction key toward the dummy is the live one — D or A) or as the touch buttons
// (stick ▶, ATTACK / HEAVY / KICK). A step lights up when its move lands; a broken attempt says why:
// too early (the press expired before the chain window opened), too late (after the move ended), wrong button,
// missing direction, or a whiff. A clear is celebrated and the next combo comes up.
// Open: the "Combo trial" button in the training panel, or C. The dummy stands still while it is open.
// Moves are checked by their logical names (light1, str1, fHeavy…), so every fighter's kit works the same.
// Texts: ND.STR.trial (Turkish source in i18n.js, English in i18n-en.js). Cleared trials: ND.save.p.trials (see load).
(function (ND) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const STR = () => (ND.STR && ND.STR.trial) || {};
  const LS = 'nd.trials';

  // combo definitions (logical moves); kick: needs the KICK button (touch: Full layout only)
  const TRIALS = [
    { id: 'chain', steps: ['light1', 'light2', 'light3'] },
    { id: 's1', steps: ['light1', 'light2', 'str1'] },
    { id: 's2', steps: ['light1', 'kick', 'str2'], kick: true },
    { id: 'launch', steps: ['fHeavy', 'chase', 'chaseEnd'] },
    { id: 's3', steps: ['light1', 'light2', 'fHeavy', 'chase', 'chaseEnd'] },
  ];
  // logical move → [direction (1 toward, -1 away, 0 none), button]
  const INP = {
    light1: [0, 'light'], light2: [0, 'light'], light3: [0, 'light'], str1: [0, 'heavy'], str2: [0, 'heavy'], kick: [0, 'kick'],
    fHeavy: [1, 'heavy'], bHeavy: [-1, 'heavy'], fLight: [1, 'light'], bLight: [-1, 'light'], heavy: [0, 'heavy'], chase: [0, 'light'], chaseEnd: [0, 'heavy'],
    dash: [0, 'light'], dashHeavy: [0, 'heavy'],
  };
  const CODE = { light: 'KeyF', heavy: 'KeyG', kick: 'KeyR' };
  const TCLS = { light: 'tb-light', heavy: '', kick: '' };

  const trial = ND.comboTrial = {
    open: false, list: [], i: 0, step: 0, lit: [], ser: -1, stepSer: -1, status: 'go', msg: null, msgKind: '', t: 0,
    endT: 0, clearT: 0, presses: [], done: {}, el: null,

    G() { return ND.game; },
    f() { return ND.game.F[0]; },
    touch() { return !!(ND.touch && ND.touch.active); },
    // trials this fighter / control scheme can do (simple touch layout has no KICK button)
    build() {
      const simple = this.touch() && (!ND.touchPrefs || ND.touchPrefs.layout !== 'full');
      this.list = TRIALS.filter((t) => !(t.kick && simple));
    },
    // Cleared trials live in the progress save (ND.save.p.trials), so they follow a CrazyGames / Yandex account through
    // the portal's data module like journeys and honor do. Older builds kept them in localStorage nd.trials: merged
    // in once (nothing cleared is lost), then that key is removed.
    load() {
      const S = ND.save, p = S && S.p;
      let old = null;
      try { old = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { old = null; }
      if (!p) { this.done = old && typeof old === 'object' ? old : {}; return; }
      if (!p.trials || typeof p.trials !== 'object') p.trials = {};
      if (old && typeof old === 'object') {
        for (const id of Object.keys(old)) {
          if (!Array.isArray(old[id]) || !ND.CHARS.some((c) => c.id === id)) continue;
          const c = p.trials[id] || (p.trials[id] = []);
          for (const t of old[id]) if (typeof t === 'string' && /^[a-z0-9_]{1,16}$/.test(t) && !c.includes(t)) c.push(t);
        }
        S.commit();
        try { localStorage.removeItem(LS); } catch (e) { /* storage blocked */ }
      }
      this.done = p.trials;
    },
    save() {
      const S = ND.save;
      if (S && S.p) { S.p.trials = this.done; S.commit(); return; }
      try { localStorage.setItem(LS, JSON.stringify(this.done)); } catch (e) { /* storage blocked */ }
    },
    cleared(id) { const c = this.done[this.f().ch.id]; return !!(c && c.includes(id)); },

    // ---------------------------------------------------------------- input chips
    btnChip(b) {
      if (this.touch()) { const TB = (ND.STR && ND.STR.touch && ND.STR.touch.btn) || {}; return `<i class="tb ${TCLS[b] || ''}">${esc(TB[b] || b)}</i>`; }
      return `<kbd>${esc(ND.input.keyLabel ? ND.input.keyLabel(CODE[b]) : CODE[b].slice(3))}</kbd>`;
    },
    dirChip(d) {
      const f = this.f(), right = d * f.dir > 0;
      if (this.touch()) return `<i class="tb">${right ? '▶' : '◀'}</i>`;
      return `<kbd>${esc(ND.input.keyLabel ? ND.input.keyLabel(right ? 'KeyD' : 'KeyA') : right ? 'D' : 'A')}</kbd>`;
    },
    chips(move) { const p = INP[move] || [0, 'light']; return (p[0] ? this.dirChip(p[0]) + '<b class="ct-plus">+</b>' : '') + this.btnChip(p[1]); },
    fill(s) { return String(s || '').replace(/\{([LHKD])\}/g, (m, k) => (k === 'D' ? this.dirChip(1) : this.btnChip({ L: 'light', H: 'heavy', K: 'kick' }[k]))); },
    trialName(T) {
      const f = this.f(), S = STR();
      const nm = ND.comboName ? ND.comboName(f, T.steps[T.steps.length - 1]) : null;
      return nm || (S.names && S.names[T.id]) || T.id;
    },

    // ---------------------------------------------------------------- open / close / move between trials
    toggle() { if (this.open) this.close(); else this.start(0); },
    canOpen() { const G = this.G(), tr = ND.training; return G && G.mode === 'train' && !(tr && tr.tut && !tr.finished); },
    start(i) {
      if (!this.canOpen()) return;
      this.load(); this.build();
      if (!this.open) { const f = this.f(), c = this.done[f.ch.id] || []; const k = this.list.findIndex((t) => !c.includes(t.id)); i = i || (k < 0 ? 0 : k); }
      this.open = true; this.i = Math.max(0, Math.min(this.list.length - 1, i));
      const tr = ND.training;
      if (tr) { tr.opts.infHp = true; if (tr.dummy && tr.dummy.beh !== 'idle') tr.setBeh('idle'); else tr.refresh(); }
      ND.input.p1.onPress = (a, t) => this.onPress(a, t);
      this.reposition();
      this.reset(); this.say(null); this.render();
    },
    close() {
      this.open = false; if (ND.input.p1.onPress) ND.input.p1.onPress = null;
      if (this.el) this.el.hidden = true;
      const b = $('trCombo'); if (b) b.setAttribute('aria-pressed', 'false');
    },
    go(d) { if (!this.open) return; this.i = (this.i + d + this.list.length) % this.list.length; this.reposition(); this.reset(); this.say(null); this.render(); },
    reset() { this.step = 0; this.lit = []; this.stepSer = -1; this.status = 'go'; this.endT = 0; this.presses.length = 0; },
    // both fighters back to the middle, close enough for the first step
    reposition() {
      const G = this.G(), [a, b] = G.F;
      if (G.mode !== 'train') return;
      G.startRound(); if (ND.training.dummy) ND.training.setDummy('idle');
      a.x = -58; b.x = 58; a.dir = 1; b.dir = -1; // in reach of every fighter's first hit (Ren's is the shortest)
    },
    say(txt, kind) { this.msg = txt; this.msgKind = kind || ''; this.msgT = 0; this.render(); },

    // ---------------------------------------------------------------- tracking
    onPress(a, t) {
      if (a !== 'light' && a !== 'heavy' && a !== 'kick') return;
      const f = this.f();
      const atk = f.state === 'atk' ? f.atk : null;
      this.presses.push({ a, t, ser: f.serial, atk: !!atk, st: f.st, chain: atk && atk.chain, spd: f.ch.spd * f.aspd, hs: this.G().hitstopT || 0 });
      if (this.presses.length > 24) this.presses.shift();
    },
    // why did the chain not continue from the move with serial ser into `want`?
    breakReason(ser, want) {
      const p = INP[want] || [0, 'light'], mine = this.presses.filter((q) => q.ser === ser);
      const buf = ND.COMBO ? ND.COMBO.buf : 0.3;
      if (mine.some((q) => q.a === p[1] && q.atk && q.chain && (q.chain[0] - q.st) / q.spd + q.hs > buf)) return ['early'];
      const other = mine.filter((q) => q.a !== p[1]).pop();
      if (other) return ['wrong', other.a, p[1]];
      return ['late'];
    },
    fail(reason, want) {
      const S = STR(), p = INP[want] || [0, 'light'];
      let txt;
      if (reason[0] === 'early') txt = S.early;
      else if (reason[0] === 'wrong') txt = typeof S.wrong === 'function' ? S.wrong(this.btnChip(reason[1]), this.chips(want)) : '';
      else if (reason[0] === 'dir') txt = typeof S.dir === 'function' ? S.dir(this.chips(want)) : '';
      else if (reason[0] === 'miss') txt = S.miss;
      else txt = S.late;
      void p;
      this.reset(); this.status = 'go';
      this.say(txt, 'bad');
      if (ND.audio && ND.audio.ready) ND.audio.tone({ freq: 220, freq1: 150, dur: 0.18, gain: 0.08, send: 0.1, type: 'triangle' });
    },
    onStart(f) {
      const T = this.list[this.i], name = f.atkName, want = T.steps[this.step];
      if (this.status === 'clear') return;
      const chained = f.chainN > 0;
      if (this.step > 0 && chained) {
        // the previous step must have landed
        if (!this.lit[this.step - 1]) return this.fail(['miss'], want);
        if (name === want) { this.step++; this.stepSer = f.serial; return; }
        const w = INP[want], g = INP[name];
        if (w && g && w[1] === g[1] && w[0] !== g[0]) return this.fail(['dir'], want);
        return this.fail(['wrong', g ? g[1] : 'light', w ? w[1] : 'light'], want);
      }
      if (this.step > 0 && !chained) {
        // a fresh opener: the string broke before this press
        const r = this.breakReason(this.stepSer, want);
        this.fail(r, want);
      }
      if (name === T.steps[0]) {
        this.step = 1; this.lit = []; this.stepSer = f.serial; this.endT = 0;
        if (this.msgKind === 'hint') this.say(null); // e.g. G then → a moment later: the opener became → + G after all
        return;
      }
      const w0 = INP[T.steps[0]], g0 = INP[name];
      const S = STR();
      if (w0 && g0 && w0[1] === g0[1] && w0[0] !== g0[0]) this.say(typeof S.dir === 'function' ? S.dir(this.chips(T.steps[0])) : '', 'hint');
      else if (typeof S.startWith === 'function') this.say(S.startWith(this.chips(T.steps[0])), 'hint');
    },
    clear() {
      const T = this.list[this.i], f = this.f(), id = f.ch.id, S = STR();
      this.status = 'clear'; this.clearT = 0;
      const c = this.done[id] || (this.done[id] = []);
      if (!c.includes(T.id)) { c.push(T.id); this.save(); }
      const all = this.list.every((t) => c.includes(t.id));
      this.say(all && this.i === this.list.length - 1 ? S.all : S.clear, 'good');
      const au = ND.audio;
      if (au && au.ready) { au.taiko(0.9); au.tone({ freq: 880, freq1: 1320, dur: 0.5, gain: 0.07, send: 0.6, type: 'triangle' }); au.tone({ freq: 1320, dur: 0.7, gain: 0.05, send: 0.7, delay: 0.12 }); }
      ND.fx.ring(f.x, -110, '255,214,122', 160); ND.fx.spark(f.x, -150, -Math.PI / 2, 26, 1.2, '255,214,122');
      ND.fx.text(f.x, -250, S.clearPop || 'KOMBO TAMAM!', '#ffd27a');
      if (this.el) { this.el.classList.remove('win'); void this.el.offsetWidth; this.el.classList.add('win'); }
    },
    tick(rdt) {
      if (!this.open) return;
      const G = this.G();
      if (G.mode !== 'train' || !this.canOpen()) { this.close(); return; }
      if (G.phase !== 'fight') return;
      const f = this.f(), T = this.list[this.i];
      if (this.msg) { this.msgT = (this.msgT || 0) + rdt; if (this.msgT > 3.2 && this.status === 'go') { this.msg = null; this.render(); } }
      if (this.status === 'clear') {
        this.clearT += rdt;
        if (this.clearT > 1.7) { if (this.i < this.list.length - 1) this.go(1); else { this.reset(); this.render(); } }
        return;
      }
      if (f.state === 'atk' && f.serial !== this.ser) { this.ser = f.serial; this.onStart(f); this.render(); }
      // the current step lands → it lights up
      if (this.step > 0 && f.state === 'atk' && f.serial === this.stepSer && f.mem.landed != null && !this.lit[this.step - 1]) {
        this.lit[this.step - 1] = true;
        if (this.step === T.steps.length) { this.clear(); return; }
        if (ND.audio && ND.audio.ready) ND.audio.tick(0);
        this.render();
      }
      // the move ended and nothing followed
      if (this.step > 0 && f.state !== 'atk') {
        this.endT += rdt;
        const lim = (ND.LENIENT ? ND.LENIENT.late : 0.2) + 0.2;
        if (this.endT > lim) {
          const want = T.steps[this.step];
          this.fail(this.lit[this.step - 1] ? this.breakReason(this.stepSer, want) : ['miss'], want);
        }
      } else this.endT = 0;
      // keep the direction chips true to the side the dummy is on
      if (this.dirSeen !== f.dir) { this.dirSeen = f.dir; this.render(); }
    },

    // ---------------------------------------------------------------- panel
    ensureEl() {
      if (this.el) return this.el;
      if (!$('ctrialCss')) {
        const st = document.createElement('style'); st.id = 'ctrialCss';
        st.textContent = [
          '#ctrial{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 104px);transform:translateX(-50%);width:min(480px,calc(100% - 24px));box-sizing:border-box;padding:8px 12px 9px;display:grid;gap:5px;text-align:center;background:rgba(8,9,16,.86);border:1px solid var(--gold);z-index:3;font-size:13px;animation:lnIn .3s ease-out}',
          '#ctrial .ct-head{display:flex;align-items:center;gap:8px;font:600 11px/1 var(--display);letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}',
          '#ctrial .ct-head b{flex:1;text-align:left;font:700 16px/1.1 var(--display);letter-spacing:.06em;color:var(--gold-hi)}',
          '#ctrial .ct-head button{pointer-events:auto;min-width:30px;height:28px;padding:0 6px;font:600 14px/1 var(--display);color:var(--text);background:rgba(20,22,34,.9);border:1px solid var(--line);border-radius:4px;cursor:pointer}',
          '#ctrial .ct-steps{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px 6px}',
          '#ctrial .ct-step{display:inline-flex;align-items:center;gap:2px;padding:4px 7px;border:1px solid rgba(255,255,255,.14);border-radius:6px;background:rgba(255,255,255,.04);transition:background .15s,border-color .15s}',
          '#ctrial .ct-step.cur{border-color:var(--gold);box-shadow:0 0 0 2px rgba(217,179,108,.25)}',
          '#ctrial .ct-step.ok{background:rgba(217,179,108,.3);border-color:var(--gold-hi)}',
          '#ctrial .ct-step.ok kbd,#ctrial .ct-step.ok .tb{border-color:var(--gold-hi);color:#fff}',
          '#ctrial .ct-plus{font:600 11px/1 var(--display);color:var(--muted)}',
          '#ctrial .ct-arr{color:var(--muted);font-weight:400}',
          '#ctrial .ct-desc{font-size:12.5px;line-height:1.3;color:var(--text)}',
          '#ctrial .ct-msg{min-height:1.3em;font:600 13px/1.3 var(--display);letter-spacing:.04em}',
          '#ctrial .ct-msg.bad,#ctrial .ct-msg.hint{color:#ff9b7a}#ctrial .ct-msg.good{color:#ffd27a;font-size:16px}',
          '#ctrial .ct-dots{display:flex;justify-content:center;gap:5px}#ctrial .ct-dots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.18)}#ctrial .ct-dots i.ok{background:var(--gold)}#ctrial .ct-dots i.cur{outline:1px solid var(--gold-hi);outline-offset:1px}',
          '#ctrial kbd{font-size:11px;padding:2px 6px;min-width:14px;border-bottom-width:2px}#ctrial .tb{font-size:11px;padding:2px 7px}',
          '#ctrial.win{animation:ctWin .6s ease-out}@keyframes ctWin{0%{box-shadow:0 0 0 0 rgba(255,210,122,.9)}100%{box-shadow:0 0 0 18px rgba(255,210,122,0)}}',
          '#trCombo[aria-pressed="true"]{border-color:var(--gold-hi);color:var(--gold-hi)}',
          '@media (max-height:500px){#ctrial{top:calc(env(safe-area-inset-top,0px) + 92px);padding:5px 10px 6px;gap:3px;width:min(440px,calc(100% - 330px))}#ctrial .ct-desc{display:none}#ctrial .ct-head b{font-size:14px}}',
          '@media (max-height:500px) and (max-width:700px){#ctrial{width:calc(100% - 24px)}}',
          // phones: over the floor between the stick and the buttons (like the lesson tip), clear of the pause button and the fighters
          '#app.touch #touch:not([hidden]) ~ #ctrial{top:auto;bottom:max(6px,env(safe-area-inset-bottom,0px));left:calc(var(--sl,0px) + var(--tb,56px) * 2.7);right:calc(var(--sr,0px) + var(--tb,56px) * 4.4);width:auto;max-width:520px;margin:0 auto;transform:none}',
          '#app.touch #ctrial .ct-head span{display:none}',
        ].join('\n');
        document.head.appendChild(st);
      }
      const el = this.el = document.createElement('div');
      el.id = 'ctrial'; el.hidden = true; el.setAttribute('aria-live', 'polite');
      const host = $('trTip') ? $('trTip').parentNode : document.getElementById('app') || document.body;
      host.appendChild(el);
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ct]'); if (!b) return;
        e.stopPropagation(); b.blur();
        const a = b.dataset.ct;
        if (a === 'prev') this.go(-1); else if (a === 'next') this.go(1); else if (a === 'retry') { this.reposition(); this.reset(); this.say(null); } else if (a === 'close') this.close();
        if (ND.audio && ND.audio.ready) ND.audio.ui();
      });
      return el;
    },
    render() {
      if (!this.open) return;
      const el = this.ensureEl(), T = this.list[this.i], S = STR(), f = this.f();
      if (!T) return;
      const c = this.done[f.ch.id] || [];
      const steps = T.steps.map((m, k) => `<span class="ct-step${this.lit[k] ? ' ok' : ''}${k === this.step && this.status === 'go' && !this.lit[k] ? ' cur' : ''}">${this.chips(m)}</span>`).join('<b class="ct-arr">›</b>');
      const dots = this.list.map((t, k) => `<i class="${c.includes(t.id) ? 'ok' : ''}${k === this.i ? ' cur' : ''}"></i>`).join('');
      const L = S.btn || {};
      const desc = S.desc && S.desc[T.id] ? this.fill(S.desc[T.id]) : '';
      const msg = this.msg != null ? this.msg : this.step === 0 && typeof S.ready === 'function' ? S.ready(this.chips(T.steps[0])) : '';
      el.innerHTML =
        `<div class="ct-head"><span>${esc(S.title || 'Kombo denemesi')} ${this.i + 1}/${this.list.length}</span><b>${esc(this.trialName(T))}</b>` +
        `<button type="button" data-ct="prev" aria-label="${esc(L.prev || '')}">◀</button><button type="button" data-ct="retry" aria-label="${esc(L.retry || '')}">↺</button>` +
        `<button type="button" data-ct="next" aria-label="${esc(L.next || '')}">▶</button><button type="button" data-ct="close" aria-label="${esc(L.close || '')}">✕</button></div>` +
        `<div class="ct-steps">${steps}</div>` +
        (desc ? `<div class="ct-desc">${desc}</div>` : '') +
        `<div class="ct-msg ${this.msgKind}">${msg}</div><div class="ct-dots">${dots}</div>`;
      el.hidden = false;
      const b = $('trCombo'); if (b) b.setAttribute('aria-pressed', 'true');
    },

    // ---------------------------------------------------------------- hooks into the training screen (arcade.js)
    init() {
      const tr = ND.training;
      if (!tr || tr._ct) return;
      tr._ct = true;
      const wrap = (name, fn) => { const o = tr[name]; if (typeof o !== 'function') return; tr[name] = function (...a) { const r = o.apply(this, a); try { fn(r, a); } catch (e) { console.warn('[trial]', e); } return r; }; };
      // panel button
      wrap('onStart', () => { this.button(); if (this.open && !this.canOpen()) this.close(); });
      wrap('hide', () => { if (this.open) this.close(); });
      wrap('retext', () => { this.button(); if (this.open) { this.build(); this.i = Math.min(this.i, this.list.length - 1); this.render(); } });
      // C opens/closes the trial
      const ok = tr.onKey;
      tr.onKey = function (e) {
        const G = ND.game;
        if (G && G.mode === 'train' && !G.paused && !e.repeat && e.code === 'KeyC') { trial.toggle(); return true; }
        return ok.call(this, e);
      };
      // the dummy must stay still while a trial is open
      wrap('setBeh', () => { if (this.open && tr.dummy && tr.dummy.beh !== 'idle') this.close(); });
      if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(() => { this.button(); this.render(); });
    },
    button() {
      const box = $('train'); if (!box) return;
      let b = $('trCombo');
      if (!b) {
        b = document.createElement('button'); b.className = 'btn'; b.id = 'trCombo'; b.type = 'button';
        const head = box.querySelector('.tp-head');
        if (head && head.nextSibling) box.insertBefore(b, head.nextSibling); else box.appendChild(b);
        b.onclick = (e) => { this.toggle(); e.currentTarget.blur(); };
      }
      const tr = ND.training;
      b.hidden = !!(tr && tr.tut && !tr.finished);
      b.innerHTML = `${esc(STR().title || 'Kombo denemesi')} <kbd>C</kbd>`;
      b.setAttribute('aria-pressed', String(this.open));
    },
  };

  // training.init runs from game.js after every script has loaded
  const boot = () => { if (ND.training && ND.training.G) trial.init(); else setTimeout(boot, 50); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
})(window.ND);
