// Akane's three new combos (phase 7, branch claude/sd-kilic-yeni, never shipped). Installed by duel-hook.js; everything
// here acts only while K.on (an address with ?kilic=1 and a match against the computer) - online, ranked, training and the
// game without the flag keep their moves, routes, AI and move list.
//   TENGU OTOSHI  F, F, R, F     light, light, a rising kick that launches (kz_age), then on a hit the air rising cut
//                                (kz_tengu: the fight's air chase - it jumps her at him), he lands knocked down
//   SAYA-GAESHI   F, F, ← + G    light, light, then the sword goes home, a held pause and the draw-cut (kz_iai, heavy
//                                class: knocks down); after a landed second cut he stays reeling until the draw
//   KASUMI-GAESHI S + F          from the guard: a low shin cut, then a high cut from the left (kz_kasumi, two blows);
//                                the high blow is blocked only by a guard pressed again after the low one was blocked
// The hit geometry rides on the game's own poses of cuts it already has (the shin cut, gyaku-kesa, the nukitsuke, the
// wrist kick, the air chase), retimed; the picture is the hand-keyed moves (moves.js kzAge, kzTengu, kzIai, kasumi and
// Kuro's hurtLow, launchUp, airHit; duel-hook.js PLAY / choose).
// Damage (raw, before the duel's Akane ×0.8 and the combo scaling ×0.9 per further move): the 3-hit light string is
// 9 + 9 + 13; Tengu 8 + 17 and Saya-gaeshi 27 after the two lights, Kasumi 11 + 20 (one move: no scaling between its blows)
// - each about the string's damage + 30 % as measured in the page (tools/kilic-combo.mjs: F, F, F 18 on Kuro).
export function installCombos({ ND, D, K, ATK }) {
  const FP = ND.Fighter.prototype, g = ND.game;
  const rnd = () => ND.rng.next();
  const S = 0.613; // attack-clock seconds per real second for Akane (KF 0.595 × her speed 1.03): the moves' ms ↔ the ATKs
  const at = (ms) => +(ms / 1000 * S).toFixed(4);
  const mapRows = (rows, f) => rows && rows.map((r) => [f(r[0]), ...r.slice(1)]);

  // ------------------------------------------------------------------ the ATKs
  // the rising kick: the wrist kick's poses (the foot up at the chest), slower and with a long recovery; it launches
  {
    const W = ATK.dk_wrist, s = 1.25, end = at(1000);
    const tm = (t) => (t >= W.dur - 1e-6 ? end : t * s);
    ATK.kz_age = Object.assign({}, W, {
      keys: mapRows(W.keys, tm), z3: mapRows(W.z3, tm), dur: end,
      active: [W.active[0] * s, W.active[1] * s], lunge: [0.06, 0.15, 200], chain: [0.2, end],
      dmg: 8, post: 22, kb: 100, stun: 0.5, launch: true, disarmKick: undefined, punish: true, limbR: 15,
    });
  }
  // the air rising cut: the air chase itself (it jumps her at him and steers her under him), knocking down, no follow-up
  ATK.kz_tengu = Object.assign({}, ATK.chase, { dmg: 17, post: 14, kb: 160, stun: 0.45, knock: true, chain: null, pw: 1.3 });
  // the draw finisher: the nukitsuke's poses moved to 0.555 (real 0.91 s), its hit window from 0.569 (moves.js kzIai 928-995), after
  // the stance held through the sheathe and the pause; the heavy cut's glint shows before the draw
  {
    const N = ATK.ak_dNuki, end = at(1700), A0 = at(910), sh = A0 - N.active[0], K0 = N.keys, last = K0[K0.length - 1], ST = last[1];
    const keys = [[0.16, ST, K0[0][2]], [A0 - 0.07, ST]]
      .concat(K0.slice(0, -1).map((q) => [q[0] + sh, ...q.slice(1)]), [[end, ST, last[2]]]);
    const z = N.z3 ? N.z3.map((r, i, A) => (i === 0 ? r : i === A.length - 1 ? [end, ...r.slice(1)] : [r[0] + sh, ...r.slice(1)])) : null;
    if (z) z.splice(1, 0, [A0 - 0.07, ...z[0].slice(1)]);
    ATK.kz_iai = Object.assign({}, N, {
      keys, z3: z, dur: end, sheath: undefined, chain: null, tw: undefined,
      active: [at(928), at(1010)], dmg: 27, post: 40, kb: 430, stun: 0.6, knock: true, heavyClass: true, sc: true,
      lunge: [A0 - 0.035, A0 + 0.025, 430], glint: [at(560), A0], sw: A0 - 0.02, pw: 1.5,
      // (after a landed second cut he stays reeling until the draw reaches him: the pause is hers to take, not a gap -
      // blocked, nothing holds him and the draw can be blocked and punished)
      ev: [[0.004, (f, a, o) => { if (o && o.state === 'hurt') { const r = f.ch.spd * (f.aspd || 1); o.dur = Math.max(o.dur, o.st + (a.active[0] - f.st) / r + 0.05); } }]],
    });
  }
  // the low-high: the shin cut's poses, then the gyaku-kesa's, as one move of two blows (hits): the low one at
  // 0.13-0.17 (real 212-275 ms), the high one at 0.328-0.37 (real 535-600); the last knocks down
  {
    const L = ATK.d_suneR, H = ATK.d_kesaL, h1 = 0.005, h2 = at(535) - H.active[0];
    const kl = L.keys.slice(0, -1).map((q, i, A) => [(i === A.length - 1 ? 0.2 : q[0]) + h1, ...q.slice(1)]);
    const kh = H.keys.map((q, i, A) => [i === A.length - 1 ? at(1020) : q[0] + h2, ...q.slice(1)]);
    const zl = (L.z3 || []).slice(0, -1).map((r, i) => [i ? Math.min(r[0] + h1, 0.205) : 0, ...r.slice(1)]), zh = (H.z3 || []).slice(1).map((r, i, A) => [i === A.length - 1 ? at(1020) : r[0] + h2, ...r.slice(1)]);
    ATK.kz_kasumi = {
      keys: kl.concat(kh), z3: zl.length && zh.length ? zl.concat(zh) : undefined, dur: at(1020),
      active: [at(212), at(275)], hits: [[at(212), at(275)], [at(535), at(600)]], sides: [L.dz3.side, H.dz3.side],
      dmg: 11, post: 16, kb: 70, stun: 0.5, knockLast: true, lastHit: { dmg: 20, kb: 380, post: 30, stun: 0.6 },
      lunge: [0.07, 0.14, 260], lunge2: [at(460), at(540), 300], sw: at(190), pw: 1.1, kind: 'blade', sc: true, chain: null,
      dz3: { side: L.dz3.side, v: 'level', dir: L.dz3.dir },
    };
  }
  const KZ = new Map([[ATK.kz_age, 'kz_age'], [ATK.kz_tengu, 'kz_tengu'], [ATK.kz_iai, 'kz_iai'], [ATK.kz_kasumi, 'kz_kasumi']]);
  K.kzId = (a) => KZ.get(a) || '';
  // how often the computer's Akane reaches for them (tools may raise it for a video)
  // (str: a decision that opens a string meant to end in one of the two finishers; age / iai: at the second cut that
  // landed, the share of the rising kick / the draw-cut - in a string opened for them, and a third of that otherwise)
  K.kzRate = { str: 0.3, age: 0.5, iai: 0.45, kasumi: 0.12 };
  K.kzN = { str: 0, str2: 0, kasumi: 0, age: 0, iai: 0 }; // (how often the computer reached for them: tools)
  const isAk = (f) => !!(K.on && f && f.ch && f.ch.id === 'akane' && f.dz && f.dz.armed);

  // ------------------------------------------------------------------ the buttons
  // the strings: from the second light cut, R → the rising kick, ← + G → the draw finisher; the kick's hit → F / G the air cut
  const R_L2 = Object.assign({}, ND.ROUTES_BASE.light2, { kick: 'kz_age', bHeavy: 'kz_iai' }), R_AGE = { hit: true, light: 'kz_tengu', heavy: 'kz_tengu' };
  const rf0 = ND.routesFor;
  ND.routesFor = (f, name) => {
    if (isAk(f)) { if (name === 'light2') return R_L2; if (name === 'kz_age') return R_AGE; }
    return rf0(f, name);
  };
  // S + F (guard held, the light opener with no direction): the low-high - as S + R is the sweep
  const pk0 = D.pick.akane;
  D.pick.akane = function (f, n) {
    if (isAk(f) && n === 'light1' && (f.chainN | 0) === 0 && f.ctrl && f.ctrl.held('guard')) return 'kz_kasumi';
    return pk0.call(this, f, n);
  };

  // ------------------------------------------------------------------ the low-high's guard rule
  // the height of each blow for the guard's picture and the computer's read (js/duel.js threat: the first blow low)
  const th0 = D.threat;
  D.threat = function (f) {
    const r = th0.apply(this, arguments), o = f && f.opp;
    if (r && r.ok && K.on && o && o.state === 'atk' && o.atk === ATK.kz_kasumi) r.h = o.st <= o.atk.hits[0][1] + 0.01 ? 'low' : 'high';
    return r;
  };
  // the guard after the low blow was blocked stays low; the high blow is blocked only by a guard pressed again since
  // (a human: a new press of S; the computer: its read, by level)
  // (z.hiAt: when the computer's guard goes up again - its read, a beat after the low block; null: it stays low)
  const hiOf = (f, o) => { const z = f._kz; if (!z || !o || z.serial !== o.serial) return true; return (z.hiAt != null && ND.simClock >= z.hiAt) || !!(f.ctrl && f.ctrl.since('guard') < ND.simClock - z.t - 1e-6); };
  K.kzGuard = (f) => {
    const o = f.opp; if (!K.on || !o || o.state !== 'atk' || o.atk !== ATK.kz_kasumi) return null;
    if (o.st <= o.atk.hits[0][1] + 0.01) return 'Low';
    const z = f._kz; if (!z || z.serial !== o.serial) return null;
    return hiOf(f, o) ? 'Hi' : 'Low';
  };
  const gf0 = FP.guardingFrom;
  FP.guardingFrom = function (att, fromX) {
    const r = gf0.call(this, att, fromX);
    if (!r || !K.on || !att || att.state !== 'atk' || att.atk !== ATK.kz_kasumi || att.hitIdx < 1) return r;
    return hiOf(this, att);
  };
  const bl0 = FP.blocked;
  FP.blocked = function (a, x, y, isKick, fromX) {
    const o = this.opp, id = K.on && this.state === 'atk' ? KZ.get(this.atk) : null, hi = this.hitIdx, serial = this.serial;
    const r = bl0.call(this, a, x, y, isKick, fromX);
    if (!id || !o) return r;
    K.kzLog && K.kzLog.push({ t: +ND.simClock.toFixed(3), ev: 'blocked', id, hit: hi, ost: o.state });
    if (id === 'kz_kasumi' && hi === 0 && o.state === 'block') {
      const z = (o._kz = { serial, t: ND.simClock, hiAt: null });
      const ai = g.ais && g.ais.find((q) => q && q.me === o);
      if (ai) { if (rnd() < 0.3 + 0.5 * ((ai.lv && ai.lv.smart) || 0.5)) z.hiAt = ND.simClock + ND.rng.range(0.05, 0.17); ai.setHeld('guard', true); ai.guardUntil = Math.max(ai.guardUntil || 0, ai.t + 0.6); ai.move = 0; }
    }
    // the two big finishers blocked (the draw-cut, the high blow): her attacks stay locked a beat longer than after a
    // plain cut (0.45 s, js/fighter.js ATK_LOCK) - his counter window is the punish
    const xl = id === 'kz_iai' ? 0.2 : id === 'kz_kasumi' && hi === 1 ? 0.12 : 0;
    if (xl && o.state === 'block' && g.clock != null) this.atkLock = Math.max(this.atkLock || 0, g.clock + ND.ATK_LOCK.block + xl);
    // the rising kick blocked: the foot is knocked aside - she reels (recoil) and he has the counter window, as after a
    // blocked cut (the game's kicks give none)
    if (id === 'kz_age' && o.state === 'block' && this.state === 'atk') {
      this.setState('recoil'); this.vx = -this.dir * 160;
      o.dur = Math.min(o.dur, 0.2); o.openCounter(0.36, 'block', { from: this, serial, counter: false });
    }
    return r;
  };
  // the reactions drawn new for the struck one (duel-hook.js choose): kicked up, cut in the air, the shin cut
  const tk0 = FP.takeHit;
  FP.takeHit = function (raw, a, from, x, y, part, kdir) {
    const id = K.on && from && from.state === 'atk' ? KZ.get(from.atk) : null, hi = from ? from.hitIdx : -1, hp0 = this.hp;
    const r = tk0.apply(this, arguments);
    this._kzR = null;
    if (id && !this.dead) {
      if (id === 'kz_age' && this.state === 'launch') this._kzR = 'launchUp';
      else if (id === 'kz_tengu' && this.state === 'launch') this._kzR = 'airHit';
      else if (id === 'kz_kasumi' && hi === 0 && this.state === 'hurt') this._kzR = 'hurtLow';
    }
    if (id && K.kzLog) K.kzLog.push({ t: +ND.simClock.toFixed(3), ev: 'hit', id, hit: hi, dmg: +(hp0 - this.hp).toFixed(1), st: this.state });
    return r;
  };

  // ------------------------------------------------------------------ the computer's Akane uses them
  const AP = ND.AI.prototype;
  const cp0 = AP.chainPick;
  AP.chainPick = function (me, o, fwd) {
    if (isAk(me)) {
      const hit = me.mem.landed != null, lv = this.lv || {}, c = lv.combo || 0.6, R = K.kzRate;
      if (me.atkName === 'kz_age') { if (hit && o.state === 'launch' && rnd() < 0.55 + 0.45 * (lv.jug || 0.5)) this.dirTap('light', 0); return; }
      const str = this._kzStr != null && this.t - this._kzStr < 1;
      // (in a string opened for a finisher the second cut always follows a first that landed)
      if (me.atkName === 'light1' && str) { if (hit) { this._kzStr = null; this._kzStr2 = true; K.kzN.str2++; return this.dirTap('light', 0); } this._kzStr = null; }
      if (me.atkName === 'light2') {
        const og = o.state === 'block' || o.state === 'guard', r = rnd(), m = this._kzStr2 ? 1 : 1 / 3;
        this._kzStr2 = false;
        if (hit && !og) { if (r < R.age * m) { K.kzN.age++; return this.dirTap('kick', 0); } if (r < (R.age + R.iai) * m) { K.kzN.iai++; return this.dirTap('heavy', -fwd); } }
        else if (og && r < 0.1 * c) return this.dirTap('heavy', -fwd);
      }
    }
    return cp0.call(this, me, o, fwd);
  };
  const dc0 = AP.decide;
  AP.decide = function (dist, fwd) {
    const me = this.me, o = me && me.opp;
    if (isAk(me) && (me.state === 'move' || me.state === 'land') && o && o.onGround && !o.dead && o.state !== 'down' && o.state !== 'getup' &&
      dist > 80 && dist < 215 && rnd() < K.kzRate.kasumi * (0.5 + 0.5 * ((this.lv && this.lv.smart) || 0.5))) {
      this.releaseAll(); K.kzN.kasumi++;
      const q = this.dq || (this.dq = []), t = this.t;
      q.push([t, 'guard', 'hold'], [t + 0.05, 'light', 'tap'], [t + 0.14, 'guard', 'rel']);
      return;
    }
    // a string for a finisher: the light opener in reach (its chain picks follow in chainPick)
    if (isAk(me) && (me.state === 'move' || me.state === 'land') && o && o.onGround && !o.dead && o.state !== 'down' && o.state !== 'getup' && o.state !== 'atk' &&
      dist < 175 && rnd() < K.kzRate.str * (0.5 + 0.5 * ((this.lv && this.lv.smart) || 0.5))) {
      this.releaseAll(); this._kzStr2 = false;
      this.dirTap('light', 0); this._kzStr = this.t; K.kzN.str++;
      return;
    }
    return dc0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ the move list and the combo names
  const row = (name, input, keys, desc, tags) => ({ name, nameTr: name, input, keys, desc, descTr: desc, tags, kz: true });
  const ROWS = [
    row('Tengu Otoshi', 'F, F, R, F', [['light'], ['light'], ['kick'], ['light']], 'Two cuts, a rising kick that lifts him off his feet, then she leaps after him and cuts upward in the air: he lands knocked down. The last press needs the kick to hit.', ['string', 'launcher', 'juggle', 'knockdown']),
    row('Saya-gaeshi', 'F, F, ← + G', [['light'], ['light'], ['back', 'heavy']], 'Two cuts, the sword slides home, a held pause, then a fast draw-cut that knocks down. Blocked, it leaves her open.', ['string', 'knockdown']),
    row('Kasumi-gaeshi', 'S + F', [['guard', 'light']], 'From the guard: a low cut at the shins, then a high cut from the left. To block the high cut, press S again after blocking the low one.', ['command', 'knockdown']),
  ];
  const CN = ND.COMBO_NAMES && ND.COMBO_NAMES.akane, NAMES = { kz_tengu: 'TENGU OTOSHI', kz_iai: 'SAYA-GAESHI', kz_kasumi: 'KASUMI-GAESHI' };
  K.kzSet = (on) => {
    const L = ND.MOVELIST && ND.MOVELIST.akane;
    if (L) {
      for (let i = L.length - 1; i >= 0; i--) if (L[i] && L[i].kz) L.splice(i, 1);
      if (on) { let i = L.findIndex((m) => m && m.input === 'F, F, G'); i = i < 0 ? L.length : i + 1; L.splice(i, 0, ...ROWS); }
    }
    if (CN) for (const k in NAMES) { if (on) CN[k] = NAMES[k]; else delete CN[k]; }
  };
}
