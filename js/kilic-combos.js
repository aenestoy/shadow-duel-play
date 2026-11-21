

(function () {
'use strict';
















function installCombos({ ND, D, K, ATK }) {
  const FP = ND.Fighter.prototype, g = ND.game;
  const rnd = () => ND.rng.next();
  const S = 0.613;
  const at = (ms) => +(ms / 1000 * S).toFixed(4);
  const mapRows = (rows, f) => rows && rows.map((r) => [f(r[0]), ...r.slice(1)]);



  {
    const W = ATK.dk_wrist, s = 1.25, end = at(1000);
    const tm = (t) => (t >= W.dur - 1e-6 ? end : t * s);
    ATK.kz_age = Object.assign({}, W, {
      keys: mapRows(W.keys, tm), z3: mapRows(W.z3, tm), dur: end,
      active: [W.active[0] * s, W.active[1] * s], lunge: [0.06, 0.15, 200], chain: [0.2, end],
      dmg: 8, post: 22, kb: 100, stun: 0.5, launch: true, disarmKick: undefined, punish: true, limbR: 15,
    });
  }

  ATK.kz_tengu = Object.assign({}, ATK.chase, { dmg: 17, post: 14, kb: 160, stun: 0.45, knock: true, chain: null, pw: 1.3 });


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


      ev: [[0.004, (f, a, o) => { if (o && o.state === 'hurt') { const r = f.ch.spd * (f.aspd || 1); o.dur = Math.max(o.dur, o.st + (a.active[0] - f.st) / r + 0.05); } }]],
    });
  }


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




  K.kzRate = { str: 0.3, age: 0.5, iai: 0.45, kasumi: 0.08 };



  K.lvMul = (ai) => { const s = ai && ai.lv && ai.lv.str; return s == null ? 1 : Math.min(1.15, 0.2 + 0.8 * s / 0.76); };
  K.kzN = { str: 0, str2: 0, kasumi: 0, age: 0, iai: 0 };
  const isAk = (f) => !!(K.on && f && f.ch && f.ch.id === 'akane' && f.dz && f.dz.armed);



  const R_L2 = Object.assign({}, ND.ROUTES_BASE.light2, { kick: 'kz_age', bHeavy: 'kz_iai' }), R_AGE = { hit: true, light: 'kz_tengu', heavy: 'kz_tengu' };
  const rf0 = ND.routesFor;
  ND.routesFor = (f, name) => {
    if (isAk(f)) { if (name === 'light2') return R_L2; if (name === 'kz_age') return R_AGE; }
    return rf0(f, name);
  };

  const pk0 = D.pick.akane;
  D.pick.akane = function (f, n) {
    if (isAk(f) && n === 'light1' && (f.chainN | 0) === 0 && f.ctrl && f.ctrl.held('guard')) return 'kz_kasumi';
    return pk0.call(this, f, n);
  };



  const th0 = D.threat;
  D.threat = function (f) {
    const r = th0.apply(this, arguments), o = f && f.opp;
    if (r && r.ok && K.on && o && o.state === 'atk' && o.atk === ATK.kz_kasumi) r.h = o.st <= o.atk.hits[0][1] + 0.01 ? 'low' : 'high';
    return r;
  };



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


    const xl = id === 'kz_iai' ? 0.2 : id === 'kz_kasumi' && hi === 1 ? 0.12 : 0;
    if (xl && o.state === 'block' && g.clock != null) this.atkLock = Math.max(this.atkLock || 0, g.clock + ND.ATK_LOCK.block + xl);


    if (id === 'kz_age' && o.state === 'block' && this.state === 'atk') {
      this.setState('recoil'); this.vx = -this.dir * 160;
      o.dur = Math.min(o.dur, 0.2); o.openCounter(0.36, 'block', { from: this, serial, counter: false });
    }
    return r;
  };

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


  const AP = ND.AI.prototype;
  const cp0 = AP.chainPick;
  AP.chainPick = function (me, o, fwd) {
    if (!K.kzOff && isAk(me)) {
      const hit = me.mem.landed != null, lv = this.lv || {}, c = lv.combo || 0.6, R = K.kzRate;
      if (me.atkName === 'kz_age') { if (hit && o.state === 'launch' && rnd() < 0.55 + 0.45 * (lv.jug || 0.5)) this.dirTap('light', 0); return; }
      const str = this._kzStr != null && this.t - this._kzStr < 1;

      if (me.atkName === 'light1' && str) { if (hit) { this._kzStr = null; this._kzStr2 = true; K.kzN.str2++; return this.dirTap('light', 0); } this._kzStr = null; }
      if (me.atkName === 'light2') {
        const og = o.state === 'block' || o.state === 'guard', r = rnd(), m = (this._kzStr2 ? 1 : 1 / 3) * K.lvMul(this);
        this._kzStr2 = false;
        if (hit && !og) { if (r < R.age * m) { K.kzN.age++; return this.dirTap('kick', 0); } if (r < (R.age + R.iai) * m) { K.kzN.iai++; return this.dirTap('heavy', -fwd); } }
        else if (og && r < 0.1 * c * K.lvMul(this)) return this.dirTap('heavy', -fwd);
      }
    }
    return cp0.call(this, me, o, fwd);
  };
  const dc0 = AP.decide;
  AP.decide = function (dist, fwd) {
    const me = this.me, o = me && me.opp;
    if (!K.kzOff && isAk(me) && (me.state === 'move' || me.state === 'land') && o && o.onGround && !o.dead && o.state !== 'down' && o.state !== 'getup' &&
      dist > 80 && dist < 215 && rnd() < K.kzRate.kasumi * K.lvMul(this)) {
      this.releaseAll(); K.kzN.kasumi++;
      const q = this.dq || (this.dq = []), t = this.t;
      q.push([t, 'guard', 'hold'], [t + 0.05, 'light', 'tap'], [t + 0.14, 'guard', 'rel']);
      return;
    }

    if (!K.kzOff && isAk(me) && (me.state === 'move' || me.state === 'land') && o && o.onGround && !o.dead && o.state !== 'down' && o.state !== 'getup' && o.state !== 'atk' &&
      dist < 175 && rnd() < K.kzRate.str * K.lvMul(this)) {
      this.releaseAll(); this._kzStr2 = false;
      this.dirTap('light', 0); this._kzStr = this.t; K.kzN.str++;
      return;
    }
    return dc0.apply(this, arguments);
  };





  const row = (name, input, keys, desc, tags) => ({ name, nameTr: name, input, keys, desc, descTr: desc, tags, kz: true });
  const ROWS = [
    row('TENGU OTOSHI', 'F, F, R, F', [['light'], ['light'], ['kick'], ['light']], 'İki kesik, havaya kaldıran tekme ve havada kesik; yere serer, tekme bloklanırsa seri durur.', ['string', 'launcher', 'juggle', 'knockdown']),
    row('SAYA-GAESHI', 'F, F, ← + G', [['light'], ['light'], ['back', 'heavy']], 'İki kesik, kına dönüş ve hızlı çekiş kesiği; yere serer, bloklanırsa açıkta kalır.', ['string', 'knockdown']),
    row('KASUMI-GAESHI', 'S + F', [['guard', 'light']], 'Gard tutarken alçak, sonra yüksek kesik; yere serer, alçak bloktan sonra yeniden gard tutan karşılar.', ['command', 'knockdown']),
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

















function installKuro({ ND, D, K, ATK, rnd, mapRows, row }) {
  const FP = ND.Fighter.prototype, g = ND.game;
  const SK = 0.476;
  const at = (ms) => +(ms / 1000 * SK).toFixed(4);

  const warp = (A, Y) => {
    const X = [0, A.active[0], A.active[1], A.dur];
    return (t) => { if (t <= 0) return t; for (let i = 1; i < 4; i++) if (t <= X[i] + 1e-9) return Y[i - 1] + ((t - X[i - 1]) * (Y[i] - Y[i - 1])) / Math.max(1e-6, X[i] - X[i - 1]); return Y[3]; };
  };
  const cut = (A, Y, o) => {
    const m = warp(A, Y), kz = (A.keys || []).map((q) => [m(q[0]), ...q.slice(1)]);
    return Object.assign({}, A, { keys: kz, z3: mapRows(A.z3, m), dur: Y[3], active: [Y[1], Y[2]], tw: undefined, sheath: undefined, chain: null, hits: undefined }, o);
  };

  ATK.kr_arashi = cut(ATK.d_dashR, [0, at(430), at(505), at(1100)], {
    dmg: 32, post: 34, kb: 430, stun: 0.6, knock: true, heavyClass: true, sc: true, pw: 1.5,
    lunge: [at(330), at(450), 40], glint: [at(190), at(350)], sw: at(395),
  });


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

  ATK.kr_toya = cut(ATK.d_tobikomi, [0, at(390), at(470), at(1050)], {
    dmg: 29, post: 30, kb: 560, stun: 0.55, reach: 300, pw: 1.4,
    lunge: [at(335), at(430), 60], glint: [at(170), at(335)], sw: at(370),
  });




  const hold = (f, a, o) => { if (o && o.state === 'hurt') { const r = f.ch.spd * (f.aspd || 1); o.dur = Math.max(o.dur, o.st + (a.active[0] - f.st) / r + 0.05); } };
  ATK.kr_arashi.ev = [[0.004, hold]]; ATK.kr_toya.ev = [[0.004, hold]];
  const KRM = new Map([[ATK.kr_arashi, 'kr_arashi'], [ATK.kr_kawara, 'kr_kawara'], [ATK.kr_toya, 'kr_toya']]);
  const kz0 = K.kzId; K.kzId = (a) => kz0(a) || KRM.get(a) || '';
  const isKu = (f) => !!(K.on && f && f.ch && f.ch.id === 'kuro' && f.dz && f.dz.armed);




  const R0 = ND.ROUTES_BASE, R_L1 = Object.assign({}, R0.light1, { fLight: 'kr_arashi', bHeavy: 'kr_kawara' }), R_FL = Object.assign({}, R0.fLight, { fLight: 'kr_toya' });
  const rf0 = ND.routesFor;
  ND.routesFor = (f, name) => {
    if (!K.krOff && isKu(f)) { if (name === 'light1') return R_L1; if (name === 'fLight') return R_FL; }
    return rf0(f, name);
  };




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









  K.krRate = { str: 0.22, tsuki: 0.14, arashi: 0.45, kawara: 0.45, toya: 0.6, guard: 0.45 };
  K.krCap = 0.45;


  K.krFloor = 0.8;
  K.krN = { str: 0, tsuki: 0, arashi: 0, kawara: 0, toya: 0 };
  const AP = ND.AI.prototype;
  const cp0 = AP.chainPick;
  AP.chainPick = function (me, o, fwd) {
    if (!K.krOff && isKu(me)) {
      const hit = me.mem.landed != null, R = K.krRate, og = o.state === 'block' || o.state === 'guard';
      if (me.atkName === 'light1') {
        const lm = K.lvMul(this), m = this._krStr ? Math.max(K.krFloor, lm) : lm / 3; this._krStr = false;
        if (hit && !og) { const r = rnd(); if (r < R.arashi * m) { K.krN.arashi++; return this.dirTap('light', fwd); } if (r < (R.arashi + R.kawara) * m) { K.krN.kawara++; return this.dirTap('heavy', -fwd); } }
        else if (og && rnd() < R.guard * m) { K.krN.kawara++; return this.dirTap('heavy', -fwd); }
      } else if (me.atkName === 'fLight') {
        const lm = K.lvMul(this), m = this._krTsu ? Math.max(K.krFloor, lm) : lm / 3; this._krTsu = false;
        if (hit && !og && rnd() < R.toya * m) { K.krN.toya++; return this.dirTap('light', fwd); }
      }
    }
    return cp0.call(this, me, o, fwd);
  };
  const dc0 = AP.decide;
  AP.decide = function (dist, fwd) {
    const me = this.me, o = me && me.opp;
    if (!K.krOff && isKu(me) && (me.state === 'move' || me.state === 'land') && o && o.onGround && !o.dead && o.state !== 'down' && o.state !== 'getup' && o.state !== 'atk') {



      const sm = Math.min(K.krCap, K.lvMul(this));
      if (dist < 200 && rnd() < K.krRate.str * sm) { this.releaseAll(); this._krStr = true; K.krN.str++; this.dirTap('light', 0); return; }
      if (dist >= 170 && dist < 270 && rnd() < K.krRate.tsuki * sm) { this.releaseAll(); this._krTsu = true; K.krN.tsuki++; this.dirTap('light', fwd); return; }
    }
    return dc0.apply(this, arguments);
  };


  const ROWS = [
    row('ARASHI-BARAI', 'F, → + F', [['light'], ['fwd', 'light']], 'Kesa’dan sonra bel hizasında geniş fırtına süpürmesi; yere serer, kesa bloklanırsa seri durur.', ['string', 'knockdown']),
    row('KAWARA-WARI', 'F, ← + G', [['light'], ['back', 'heavy']], 'Kesa’dan sonra baş kesiği ve tepeden inen gard ezen darbe; yere serer, ilk kesiği savuşturan durdurur.', ['string', 'guardCrush', 'knockdown']),
    row('TOYA-ZUKI', '→ + F, → + F', [['fwd', 'light'], ['fwd', 'light']], 'Dürtüşten sonra uzun atılımlı ok dürtüşü; rakibi uzağa iter, hızlı bir kesik hazırlığını yener.', ['string']),
  ];
  return { ROWS, CN: ND.COMBO_NAMES && ND.COMBO_NAMES.kuro, NAMES: { kr_arashi: 'ARASHI-BARAI', kr_kawara: 'KAWARA-WARI', kr_toya: 'TOYA-ZUKI' } };
}

(globalThis.ND_KILIC || (globalThis.ND_KILIC = {})).installCombos = installCombos;
})();
