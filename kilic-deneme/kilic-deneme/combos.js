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
  const KR = installKuro({ ND, D, K, ATK, rnd, mapRows, row });
  K.kzSet = (on) => {
    for (const [id, rows, cn, names] of [['akane', ROWS, CN, NAMES], ['kuro', KR.ROWS, KR.CN, KR.NAMES]]) {
      const L = ND.MOVELIST && ND.MOVELIST[id];
      if (L) {
        for (let i = L.length - 1; i >= 0; i--) if (L[i] && L[i].kz) L.splice(i, 1);
        if (on) { let i = L.findIndex((m) => m && m.input === 'F, F, G'); i = i < 0 ? L.length : i + 1; L.splice(i, 0, ...rows); }
      }
      if (cn) for (const k in names) { if (on) cn[k] = names[k]; else delete cn[k]; }
    }
  };
}

// ==================================================================== Kuro's three combos (2026-11-21, ?kilic=1 only)
// The nodachi's strings: short (two presses) and heavy - a long, readable wind-up, a big step in, a long recovery.
//   ARASHI-BARAI  F, → + F     the kesa, then the storm sweep from the right: low round under the line and level through
//                              him at the waist, the long blade's reach; knocks down (kr_arashi)
//   KAWARA-WARI   F, ← + G     the kesa, then two blows down the centre: a short men, the blade straight back up into the
//                              full raise (held: the tell), then down through the guard - the second crushes it, knocks
//                              down (kr_kawara)
//   TOYA-ZUKI     → + F, → + F the thrust, then the far-arrow thrust: the coil back (held), a long lunge, the nodachi's point
//                              at full length; drives him far back (kr_toya)
// The hit geometry rides on the game's own poses of cuts it has (the running yoko, the light men + the big men, the
// leaping thrust), retimed onto the keyed moves' windows (moves.js krArashi, krKawara, krToya; duel-hook.js PLAY).
// Blocked, each leaves him open: his attacks stay locked past a plain cut's 0.45 s (ATK_LOCK) - the defender's punish.
// Counterplay (named in the move list): each string needs its opener to land - block or parry the kesa / the thrust and it
// stops there. Arashi - the sweep alone (a held wind-up, then the step in) is blocked and punished, or stepped back out of;
// Kawara - parry the first men (the whole thing stops), or step back during the held raise: blocking both lets the second
// eat the guard; Toya - the coil is long: a fast cut into it beats it, or block and punish.
function installKuro({ ND, D, K, ATK, rnd, mapRows, row }) {
  const FP = ND.Fighter.prototype, g = ND.game;
  const SK = 0.476; // attack-clock seconds per real second for Kuro (KF 0.595 × his speed 0.8): the moves' ms ↔ the ATKs
  const at = (ms) => +(ms / 1000 * SK).toFixed(4);
  // a cut's own times laid piecewise onto new ones: [0, active start, active end, end] → Y (the keys, z3, lunge ...)
  const warp = (A, Y) => {
    const X = [0, A.active[0], A.active[1], A.dur];
    return (t) => { if (t <= 0) return t; for (let i = 1; i < 4; i++) if (t <= X[i] + 1e-9) return Y[i - 1] + ((t - X[i - 1]) * (Y[i] - Y[i - 1])) / Math.max(1e-6, X[i] - X[i - 1]); return Y[3]; };
  };
  const cut = (A, Y, o) => {
    const m = warp(A, Y), kz = (A.keys || []).map((q) => [m(q[0]), ...q.slice(1)]);
    return Object.assign({}, A, { keys: kz, z3: mapRows(A.z3, m), dur: Y[3], active: [Y[1], Y[2]], tw: undefined, sheath: undefined, chain: null, hits: undefined }, o);
  };
  // the storm sweep: the running yoko's poses (from the right, level), slower, a big step in; knocks down
  ATK.kr_arashi = cut(ATK.d_dashR, [0, at(430), at(505), at(1100)], {
    dmg: 32, post: 34, kb: 430, stun: 0.6, knock: true, heavyClass: true, sc: true, pw: 1.5,
    lunge: [at(330), at(450), 40], glint: [at(190), at(350)], sw: at(395),
  });
  // the tile split: the light men's poses for the first blow, the big men's for the second, one move of two blows (no
  // scaling between them); the first keeps him in reach and reeling, the second crushes a guard and knocks down
  {
    const L = ATK.d_shomen, H = ATK.d_men, h1 = [at(330), at(400)], h2 = [at(800), at(870)], end = at(1400);
    const mL = warp(L, [0, h1[0], h1[1], at(470)]), mH = warp(H, [at(470), h2[0], h2[1], end]);
    const kl = L.keys.slice(0, -1).map((q) => [mL(q[0]), ...q.slice(1)]), kh = H.keys.map((q) => [mH(q[0]), ...q.slice(1)]);
    const zl = (L.z3 || []).slice(0, -1).map((r) => [mL(r[0]), ...r.slice(1)]), zh = (H.z3 || []).slice(1).map((r) => [mH(r[0]), ...r.slice(1)]);
    ATK.kr_kawara = {
      keys: kl.concat(kh), z3: zl.length && zh.length ? zl.concat(zh) : undefined, dur: end,
      active: h1.slice(), hits: [h1, h2], sides: [0, 0],
      dmg: 5, post: 14, kb: 60, stun: 0.55, knockLast: true, lastHit: { dmg: 18, kb: 420, post: 44, stun: 0.6, gcrush: 1.6 },
      lunge: [at(280), at(345), 60], lunge2: [at(720), at(820), 60], glint: [at(560), at(700)], sw: at(300), pw: 1.5,
      kind: 'blade', sc: true, chain: null, heavyClass: true, dz3: { side: 0, v: 'down', dir: 'shomen' },
    };
  }
  // the far-arrow thrust: the leaping thrust's poses, the coil held, a long lunge; drives him far back
  ATK.kr_toya = cut(ATK.d_tobikomi, [0, at(390), at(470), at(1050)], {
    dmg: 29, post: 30, kb: 560, stun: 0.55, reach: 300, pw: 1.4,
    lunge: [at(335), at(430), 60], glint: [at(170), at(335)], sw: at(370),
  });
  // (after a landed opener he stays reeling until the blow reaches him - as Saya-gaeshi's draw: the held wind-up is his to
  // take on a hit, not a gap; blocked, the opener stops the string and the finisher alone is the punishable part. It also
  // keeps the struck one in a state the picture's spacing holds at blade range, so the long blade is drawn through him at
  // its length, not across a body pressed against him - duel-hook.js spacing)
  const hold = (f, a, o) => { if (o && o.state === 'hurt') { const r = f.ch.spd * (f.aspd || 1); o.dur = Math.max(o.dur, o.st + (a.active[0] - f.st) / r + 0.05); } };
  ATK.kr_arashi.ev = [[0.004, hold]]; ATK.kr_toya.ev = [[0.004, hold]];
  const KRM = new Map([[ATK.kr_arashi, 'kr_arashi'], [ATK.kr_kawara, 'kr_kawara'], [ATK.kr_toya, 'kr_toya']]);
  const kz0 = K.kzId; K.kzId = (a) => kz0(a) || KRM.get(a) || '';
  const isKu = (f) => !!(K.on && f && f.ch && f.ch.id === 'kuro' && f.dz && f.dz.armed);

  // ------------------------------------------------------------------ the buttons
  // from the kesa (light1): → + F the sweep, ← + G the tile split; from the thrust (fLight): → + F the far-arrow thrust
  // (direction-held routes: the plain F and G after them stay as they were)
  const R0 = ND.ROUTES_BASE, R_L1 = Object.assign({}, R0.light1, { fLight: 'kr_arashi', bHeavy: 'kr_kawara' }), R_FL = Object.assign({}, R0.fLight, { fLight: 'kr_toya' });
  const rf0 = ND.routesFor;
  ND.routesFor = (f, name) => {
    if (!K.krOff && isKu(f)) { if (name === 'light1') return R_L1; if (name === 'fLight') return R_FL; }
    return rf0(f, name);
  };

  // ------------------------------------------------------------------ blocked: he is left open
  // (his attacks stay locked longer than after a plain cut - js/fighter.js ATK_LOCK.block 0.45 s - the defender's punish;
  // the tile split's first blow blocked: nothing extra, the second still comes)
  const XL = { kr_arashi: 0.22, kr_toya: 0.14 };
  const bl0 = FP.blocked;
  FP.blocked = function (a, x, y, isKick, fromX) {
    const o = this.opp, id = K.on && this.state === 'atk' ? KRM.get(this.atk) : null, hi = this.hitIdx;
    const r = bl0.call(this, a, x, y, isKick, fromX);
    if (!id || !o) return r;
    K.kzLog && K.kzLog.push({ t: +ND.simClock.toFixed(3), ev: 'blocked', id, hit: hi, ost: o.state });
    const xl = id === 'kr_kawara' ? (hi === 1 ? 0.28 : 0) : XL[id];
    if (xl && o.state === 'block' && g.clock != null) this.atkLock = Math.max(this.atkLock || 0, g.clock + ND.ATK_LOCK.block + xl);
    return r;
  };
  const tk0 = FP.takeHit;
  FP.takeHit = function (raw, a, from) {
    const id = K.on && from && from.state === 'atk' ? KRM.get(from.atk) : null, hi = from ? from.hitIdx : -1, hp0 = this.hp;
    const r = tk0.apply(this, arguments);
    if (id && K.kzLog) K.kzLog.push({ t: +ND.simClock.toFixed(3), ev: 'hit', id, hit: hi, dmg: +(hp0 - this.hp).toFixed(1), st: this.state });
    return r;
  };

  // ------------------------------------------------------------------ the computer's Kuro uses them (now and then)
  // str: a decision that opens with the kesa meant to end in the sweep or the tile split; tsuki: one that opens with the
  // thrust meant to end in the far-arrow thrust; arashi / kawara / toya: the share at the chain window (after a landed
  // opener; in a string opened for them - a third of it otherwise; the tile split also into a guard, now and then).
  // K.krOff (tools: kilic-fight --kflags krOff): none of this runs and nothing draws from the fight's random numbers - the
  // fight as it was before these three.
  K.krRate = { str: 0.22, tsuki: 0.14, arashi: 0.45, kawara: 0.45, toya: 0.6, guard: 0.15 };
  K.krN = { str: 0, tsuki: 0, arashi: 0, kawara: 0, toya: 0 };
  const AP = ND.AI.prototype;
  const cp0 = AP.chainPick;
  AP.chainPick = function (me, o, fwd) {
    if (!K.krOff && isKu(me)) {
      const hit = me.mem.landed != null, R = K.krRate, og = o.state === 'block' || o.state === 'guard';
      if (me.atkName === 'light1') {
        const m = this._krStr ? 1 : 1 / 3; this._krStr = false;
        if (hit && !og) { const r = rnd(); if (r < R.arashi * m) { K.krN.arashi++; return this.dirTap('light', fwd); } if (r < (R.arashi + R.kawara) * m) { K.krN.kawara++; return this.dirTap('heavy', -fwd); } }
        else if (og && rnd() < R.guard * m) { K.krN.kawara++; return this.dirTap('heavy', -fwd); }
      } else if (me.atkName === 'fLight') {
        const m = this._krTsu ? 1 : 1 / 3; this._krTsu = false;
        if (hit && !og && rnd() < R.toya * m) { K.krN.toya++; return this.dirTap('light', fwd); }
      }
    }
    return cp0.call(this, me, o, fwd);
  };
  const dc0 = AP.decide;
  AP.decide = function (dist, fwd) {
    const me = this.me, o = me && me.opp;
    if (!K.krOff && isKu(me) && (me.state === 'move' || me.state === 'land') && o && o.onGround && !o.dead && o.state !== 'down' && o.state !== 'getup' && o.state !== 'atk') {
      const sm = 0.5 + 0.5 * ((this.lv && this.lv.smart) || 0.5);
      if (dist < 200 && rnd() < K.krRate.str * sm) { this.releaseAll(); this._krStr = true; K.krN.str++; this.dirTap('light', 0); return; }
      if (dist >= 170 && dist < 270 && rnd() < K.krRate.tsuki * sm) { this.releaseAll(); this._krTsu = true; K.krN.tsuki++; this.dirTap('light', fwd); return; }
    }
    return dc0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ the move list and the combo names
  const ROWS = [
    row('Arashi-barai', 'F, → + F', [['light'], ['fwd', 'light']], 'The kesa, then a storm sweep from the right: low round under his guard line and level through him at the waist, with the nodachi\'s full reach; it knocks down. Counter: block the kesa and the string stops; the sweep alone is slow - block it and punish, or step back.', ['string', 'knockdown']),
    row('Kawara-wari', 'F, ← + G', [['light'], ['back', 'heavy']], 'The kesa, then two blows down the centre: a short cut to the head, the blade straight back up (the tell), then down through the guard - the second crushes it and knocks down. Counter: parry the first cut, or step back during the raise; blocking both wears the guard.', ['string', 'guard crush', 'knockdown']),
    row('Toya-zuki', '→ + F, → + F', [['fwd', 'light'], ['fwd', 'light']], 'The thrust, then the far-arrow thrust: the coil back, a long lunge and the point at full length; it drives him far back. Counter: block the first thrust and the string stops; the coil is long - a fast cut beats it.', ['string', 'long reach']),
  ];
  return { ROWS, CN: ND.COMBO_NAMES && ND.COMBO_NAMES.kuro, NAMES: { kr_arashi: 'ARASHI-BARAI', kr_kawara: 'KAWARA-WARI', kr_toya: 'TOYA-ZUKI' } };
}
