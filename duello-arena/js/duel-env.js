















(function (ND) {
  'use strict';
  const FLAG = (() => { try { return !/[?&]duel=0(&|$)/.test(location.search || ''); } catch (e) { return true; } })();
  if (!FLAG || !ND.duel || !ND.props) return;
  const Math = ND.DM || globalThis.Math;
  const D = ND.duel, P = ND.props, G = ND.game, PO = ND.POSES, pose = ND.pose, fx = ND.fx, au = ND.audio, cam = ND.cam, E = ND.M.ease;
  const KINDS = P.KINDS, S = P.S;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const pk = (n) => PO[n] || PO.stance;
  const mod = (n, o) => Object.assign(pose.copy(pk(n)), o);





  const TEMPLE = [['burner', -860, -18], ['veranda', -650, -12], ['barrel', -470, -10], ['post', -400, -6], ['stool', -290, -4],
    ['lantern', -150, -10], ['stool', 140, -2], ['table', 250, -8], ['cup', 232, 0, { on: 7 }],
    ['cup', 256, 0, { on: 7 }], ['bottle', 282, 0, { on: 7 }], ['post', 400, -6], ['bale', 510, -6], ['lantern', 610, -12], ['bucket', 690, -4],
    ['rack', 790, -20]];
  P.ARENA_SETS.temple = TEMPLE;



  if (P.cineCandidates) {
    const cc0 = P.cineCandidates;
    P.cineCandidates = function (att, def) {
      if (def && def.dz && isCpu(def) && !(G.F && G.F.some((f) => f.state === 'dseq'))) return [];
      return cc0.apply(this, arguments);
    };
  }



  (function preKaeshi() {
    const K = ND.KAESHI, ATK = ND.ATK;
    if (!K || !K.sets || !ATK) return;
    for (const S of Object.values(K.sets)) {
      const L = S && S.finisher; if (!L || !L[0] || !ATK[L[0]]) continue;
      const base = L[0], alt = base + '_return';
      if (ATK[alt]) continue;
      const replies = S.riposte || K.sets.katana.riposte, one = ATK[replies[1] || replies[0]], two = ATK[replies[0]], a = ATK[base];
      if (!one || !two || !a || !a.keys) continue;
      const keys = a.keys.map((k) => k.slice());
      for (const k of keys) {
        if (k[0] <= 0.05) k[1] = one.keys[0][1];
        else if (k[0] <= 0.13) k[1] = one.keys[1][1];
        else if (k[0] < 0.2) k[1] = two.keys[0][1];
        else if (k[0] <= 0.25) k[1] = two.keys[1][1];
      }
      ATK[alt] = Object.assign({}, a, { keys });
    }
  })();


  const enable0 = P.enable;
  P.enable = function () { const r = enable0.apply(this, arguments); if (P.setCpu) P.setCpu(false); return r; };
  if (P.live && P.setCpu) P.setCpu(false);

  if (KINDS.table && !KINDS.table.weapon) KINDS.table.weapon = { dmg: 16, stun: 0.6, kb: 360, knock: 1, post: 40 };



  const REFILL = 3.5;
  function slotsFor(arena) { return arena === 'temple' ? TEMPLE : null; }


  function slotsNow(L) {
    if (S.items.length < L.length) return false;
    for (let i = 0; i < L.length; i++) if (S.items[i].k !== L[i][0]) return false;
    return L.map((e, i) => [i, S.items[i].id, 0]);
  }
  function refill(h, F) {
    const L = slotsFor(S.arena);
    if (!L || !G.flags) return;
    if (G.flags.envSlots == null) G.flags.envSlots = slotsNow(L);
    const sl = G.flags.envSlots;
    if (!sl) return;
    for (const s of sl) {
      const e = L[s[0]], p = P.get(s[1]);
      if (p && p.st !== 3) { s[2] = 0; continue; }
      s[2] += h;
      if (s[2] < REFILL || F.some((f) => Math.abs(f.x - e[1]) < 70)) continue;
      const x = e[3] || {}, on = x.on != null ? sl.find((q) => q[0] === x.on) : null, sup = on ? P.get(on[1]) : null;
      if (on && (!sup || sup.st !== 0)) continue;
      const q = P.spawn(e[0], e[1], { gz: e[2], on: sup ? sup.id : null, fx: x.fx });
      if (q) { s[1] = q.id; s[2] = 0; }
    }
  }


  const isCpu = (f) => !!(G.ais && G.ais.some((a) => a && a.me === f));
  const human = (f) => !!(G.isHuman && G.isHuman(f));
  const rnd = () => ND.rng.next();
  const free = (f) => !f.dead && f.onGround && f.y > -1 && (f.state === 'move' || f.state === 'guard' || f.state === 'land' || f.state === 'zanshin');
  const armed = (f) => !!(f.dz && f.dz.armed !== false && !(f.wpn && (f.wpn.fist || f.wpn.none)));





  const KAT = { katana: 1, nodachi: 1, kodachi: 1, ninjato: 1 };
  const handsBusy = (f) => armed(f) && !!(f.wpn && f.wpn.type && !(KAT[f.wpn.type] && !f.wpn.twin));
  D.handsBusy = handsBusy;
  { const cu0 = P.canUse; P.canUse = function (f, p, act) { if (act === 'grab' && f && f.dz && handsBusy(f)) return false; return cu0.apply(this, arguments); }; }
  const topOf = (p) => { const K = KINDS[p.k]; return K.top || K.h * 0.85; };

  function near(f, test, maxD) {
    let best = null, bd = maxD;
    for (const p of S.items) { if (p.st !== 0 || !test(p)) continue; const d = Math.abs(p.x - f.x); if (d <= bd) { bd = d; best = p; } }
    return best;
  }
  const ahead = (f, p) => (p.x - f.x) * f.dir > 0;
  const VAULT = { table: 1, stool: 1, barrel: 1, bale: 1, crate: 1, bucket: 1, jar: 1 };
  const STATION = { table: 1, stool: 1, barrel: 1, bale: 1, post: 1, lantern: 1, veranda: 1, bucket: 1, jar: 1, rack: 0 };

  function strike(f, o, A, x, y) {
    if (!o || o.dead || (o.isInv && o.isInv())) return false;
    if (o.state === 'guard' && (f.x - o.x) * o.dir > 0) {
      o.vx = -o.dir * 240; o.posture = Math.min(100, (o.posture || 0) + (A.post || 20));
      fx.spark(x, y, -Math.PI / 2, 10, 0.8); au.clang(0.9, cam.pan(x));
      return 'block';
    }
    o.takeHit(A.dmg * (f.ch.dmg || 1), A, f, x, y, 'body', f.dir);
    if (ENV.st && f.dz && f.dz.env) { const k = (isCpu(f) ? 'C:' : 'P:') + f.dz.env.a, e = ENV.st[k] || (ENV.st[k] = [0, 0]); e[1]++; }
    return true;
  }
  const label = (f, s) => { if (D.envLabel) D.envLabel(f, s); };




  const ACT = {};
  D.envACT = ACT;
  function track(K, t) {
    if (t <= K[0][0]) return K[0][1];
    for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const a = K[i - 1], b = K[i], u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]); return a[1] + (b[1] - a[1]) * E.inOutSine(u); }
    return K[K.length - 1][1];
  }

  ACT.vault = {
    dur: 0.72, air: [0.2, 0.62], kickWin: [0.44, 0.66],
    setup(f, c, p) {
      const K = KINDS[p.k], d = Math.sign(p.x - f.x) || f.dir, x1 = p.x + d * (K.w / 2 + 48), top = topOf(p), o = f.opp;
      f.dir = d;
      c.X = [[0, f.x], [0.18, p.x - d * (K.w / 2 + 6)], [0.45, p.x + d * 8], [0.72, x1]];
      c.Y = [[0, 0], [0.18, 0], [0.38, -(top + 58)], [0.6, -8], [0.66, 0], [0.72, 0]];
      c.kick = !!o && (o.x - x1) * d > -20 && Math.abs(o.x - x1) < 150;
      c.keys = [[0, f.entry], [0.14, pk('dz_d_dashRW'), E.inOutSine], [0.27, pk('jump'), E.inOutSine], [0.42, mod('jump', { lean: 0.35 }), E.inOut],
        c.kick ? [0.52, mod('ua_airB', { f1x: 90, f1y: -30, lean: -0.3 }), E.outQuart] : [0.52, pk('ua_airA'), E.inOut], [0.64, pk('land'), E.outCubic], [0.72, f.P.stance, E.inOut]];
      c.ev = [[0.52, (f, c) => { if (c.kick && Math.abs(f.opp.x - f.x) < 150) strike(f, f.opp, { dmg: 13, post: 24, kb: 320, stun: 0.55, kind: 'kick', knock: true }, (f.x + f.opp.x) / 2, f.y - 90); }]];
      label(f, c.kick ? 'Vault and kick' : 'Over the ' + p.k);
    },
  };

  ACT.flip = {
    dur: 0.6,
    setup(f, c, p) {
      const d = Math.sign(p.x - f.x) || f.dir;
      f.dir = d;
      c.X = [[0, f.x], [0.12, p.x - d * (KINDS[p.k].w / 2 + 18)], [0.6, p.x - d * (KINDS[p.k].w / 2 + 18)]];
      c.keys = [[0, f.entry], [0.14, mod('ua_pickLow', { lean: 0.55, hy: -60 }), E.outCubic], [0.3, mod('ua_upperB', { lean: -0.1 }), E.outQuart], [0.6, f.P.stance, E.inOut]];
      c.ev = [[0.28, (f, c) => {
        const t = P.get(c.pid);
        if (!t || t.st !== 0) return;
        for (const q of S.items) if (q.sup === t.id && q.st === 0) { q.sup = -1; q.st = 1; q.vy = -260; q.vx = f.dir * 120; }
        t.st = 1; t.sl = 0; t.vy = -540; t.vx = f.dir * 330; t.w = f.dir * 11; t.owner = f.id; t.tt = 0; t.hitF = -1;
        au.thud(1.1, f.pan); fx.dust(t.x, 0, 10, 1.2); cam.punch(6);
      }]];
      label(f, 'Table flip');
    },
  };

  ACT.swing = {
    dur: 0.78, air: [0.22, 0.5], kickWin: [0.4, 0.64],
    setup(f, c, p) {
      const s = Math.sign(p.x - f.x) || f.dir;
      c.X = [[0, f.x], [0.2, p.x - s * 16], [0.42, p.x + s * 26], [0.78, p.x + s * 40]];
      c.Y = [[0, 0], [0.2, -6], [0.34, -34], [0.5, -10], [0.6, 0], [0.78, 0]];
      c.keys = [[0, f.entry], [0.18, mod('ua_pickHigh', { lean: 0.2 }), E.outCubic], [0.34, mod('ua_airA', { lean: -0.45 }), E.inOut],
        [0.48, mod('ua_frontB', { f1x: 92, f1y: -44 }), E.outQuart], [0.62, pk('land'), E.outCubic], [0.78, f.P.stance, E.inOut]];
      c.face = 'opp';
      c.ev = [[0.48, (f) => { if (Math.abs(f.opp.x - f.x) < 155) strike(f, f.opp, { dmg: 14, post: 26, kb: 380, stun: 0.55, kind: 'kick', knock: true }, (f.x + f.opp.x) / 2, f.y - 100); }]];
      label(f, 'Round the post');
    },
  };

  ACT.lantern = {
    dur: 0.52,
    setup(f, c, p) {
      f.dir = p.x >= f.x ? 1 : -1;
      const xs = Math.abs(p.x - f.x) > 70 ? p.x - f.dir * 64 : f.x;
      c.X = [[0, f.x], [0.1, xs], [0.52, xs]];
      c.keys = [[0, f.entry], [0.1, pk('dz_d_kesaRW'), E.inOutSine], [0.2, pk('dz_d_kesaRS'), E.outQuart], [0.52, f.P.stance, E.inOut]];
      c.ev = [[0.2, (f, c) => {
        const L = P.get(c.pid);
        if (!L || L.st === 3) return;
        P.breakProp(L, 'cut', { x: L.x, y: L.y - 40, dx: f.dir, dy: 0.6, by: f });
        if (Math.abs(f.opp.x - L.x) < 150) strike(f, f.opp, { dmg: 12, post: 14, kb: 160, stun: 0.6, kind: 'blade', knock: true }, f.opp.x, f.opp.y - 150);
      }]];
      label(f, 'Lantern cut down');
    },
  };

  ACT.wall = {
    dur: 0.82, air: [0.12, 0.72], kickWin: [0.42, 0.74],
    setup(f, c) {
      const w = Math.sign(f.x) || 1, o = f.opp, A = ND.ARENA;
      const x1 = clamp(o.x + w * 70, -A + 20, A - 20);
      c.X = [[0, f.x], [0.24, w * (A - 14)], [0.3, w * (A - 18)], [0.6, o.x + w * 80], [0.82, x1]];
      c.Y = [[0, 0], [0.24, -120], [0.3, -118], [0.46, -96], [0.72, 0], [0.82, 0]];
      c.keys = [[0, f.entry], [0.16, pk('jump'), E.inOutSine], [0.28, mod('ua_airA', { lean: -0.5 }), E.inOut], [0.48, mod('ua_airB', { f1x: 96, f1y: -36, lean: -0.3 }), E.outQuart],
        [0.72, pk('land'), E.outCubic], [0.82, f.P.stance, E.inOut]];
      c.dirs = [[0, w], [0.3, -w]];
      c.ev = [[0.27, (f) => { fx.dust(f.x + Math.sign(f.x) * 10, f.y - 60, 6, 0.8); au.thud(0.7, f.pan); }],
        [0.5, (f) => { if (Math.abs(f.opp.x - f.x) < 150) strike(f, f.opp, { dmg: 16, post: 28, kb: 420, stun: 0.6, kind: 'kick', knock: true }, (f.x + f.opp.x) / 2, f.y - 90); }]];
      label(f, 'Off the wall');
    },
  };

  ACT.steps = {
    dur: 1.0, air: [0.12, 0.9],
    setup(f, c, p) {
      const K = KINDS[p.k], s = Math.sign(f.opp.x - p.x) || f.dir, edge = p.x + s * (K.w / 2 - 22), o = f.opp;
      const x2 = o.x - s * 70;
      c.X = [[0, f.x], [0.28, edge], [0.45, edge], [0.78, x2], [1.0, x2]];
      c.Y = [[0, 0], [0.18, -70], [0.28, -48], [0.45, -48], [0.62, -150], [0.82, 0], [1.0, 0]];
      const cut = armed(f);
      c.keys = [[0, f.entry], [0.18, pk('jump'), E.outCubic], [0.3, pk('land'), E.outCubic], [0.44, mod('land', { hy: -60 }), E.inOut],
        [0.62, cut ? pk('dz_d_menW') : pk('ua_airA'), E.outCubic], [0.8, cut ? pk('dz_d_menS') : mod('ua_airB', { f1x: 90 }), E.outQuart], [1.0, f.P.stance, E.inOut]];
      c.face = 'opp';
      c.ev = [[0.8, (f) => { if (Math.abs(f.opp.x - f.x) < 150) strike(f, f.opp, { dmg: cut ? 17 : 14, post: 30, kb: 340, stun: 0.6, kind: cut ? 'blade' : 'kick', knock: true }, (f.x + f.opp.x) / 2, -120); }]];
      label(f, 'From the steps');
    },
  };

  ACT.dodgePost = {
    dur: 1.0, kickWin: [0.6, 0.86], air: [0.06, 0.84],
    setup(f, c, p) {
      const s = Math.sign(p.x - f.opp.x) || -f.dir;
      c.X = [[0, f.x], [0.18, p.x + s * 30], [0.6, p.x + s * 30], [0.75, p.x + s * 24], [1.0, p.x + s * 30]];
      c.keys = [[0, f.entry], [0.16, mod('ua_sweepA', { hy: -44, lean: 0.55 }), E.outCubic], [0.5, mod('ua_sweepA', { hy: -44, lean: 0.55 })],
        [0.62, pk('ua_frontA'), E.inOutSine], [0.72, mod('ua_frontB', { f1x: 90, f1y: -40 }), E.outQuart], [1.0, f.P.stance, E.inOut]];
      c.face = 'opp';
      c.ev = [[0.72, (f) => { if (Math.abs(f.opp.x - f.x) < 155) strike(f, f.opp, { dmg: 14, post: 24, kb: 320, stun: 0.6, kind: 'kick', knock: true }, (f.x + f.opp.x) / 2, f.y - 100); }]];
      label(f, 'Blade stuck in the post!');
    },
  };

  ACT.stuck = {
    dur: 0.9,
    setup(f, c, p) {
      const bite = {}, tug = {}, d0 = f.dir;
      f.dir = p.x >= f.x ? 1 : -1;
      D.aimPose(f, bite, pk('dz_d_kesaRS'), p.x, -112, f.dir > 0 ? 0.5 : Math.PI - 0.5, 0.75);
      D.aimPose(f, tug, mod('dz_d_kesaRS', { hx: -14, lean: -0.25 }), p.x, -108, f.dir > 0 ? 0.3 : Math.PI - 0.3, 0.7);
      f.dir = d0;
      c.keys = [[0, f.entry], [0.08, bite, E.outQuart], [0.4, bite], [0.5, tug, E.inOutSine], [0.62, bite, E.inOut], [0.72, tug, E.inOutSine], [0.9, f.P.guard || f.P.stance, E.outCubic]];
      c.face = 'post';
      c.ev = [[0.08, (f, c) => { const q = P.get(c.pid); if (q) { fx.spark(q.x + (f.x < q.x ? -10 : 10), -112, 0, 10, 0.7, '230,200,150'); fx.dust(q.x, -112, 6, 0.6); if (P.hurt) P.hurt(q, 3, 'shatter', q.x, -112, -f.dir, 0, f); } au.thud(1.1, f.pan); au.clang(0.35, f.pan, 0.55); cam.punch(6); G.hitstop(0.08); }],
        [0.86, (f) => { au.swoosh(0.7, f.pan); }]];
    },
  };

  ACT.slip = {
    dur: 0.5, kickWin: [0, 0.5],
    setup(f, c) {
      const d = f.vx ? Math.sign(f.vx) : f.dir;
      c.X = [[0, f.x], [0.3, f.x + d * 26], [0.5, f.x + d * 34]];
      c.keys = [[0, f.entry], [0.16, mod('launch', { lean: -0.7 }), E.outCubic], [0.42, pk('down'), E.inCubic || E.inOut]];
      c.ev = [[0.08, (f) => { au.thud(0.6, f.pan); }], [0.46, (f) => { fx.dust(f.x, 0, 8, 0.9); au.thud(1.0, f.pan); cam.punch(4); }],
        [0.5, (f) => { f.dz.env = null; f.setState('down'); }]];
      label(f, 'Slipped on the ' + (f.dz.envLiq || 'sake') + '!');
    },
  };

  function start(f, name, p) {
    const A = ACT[name];
    if (!A || !f.dz) return false;
    f.setState('denv'); f.vx = f.vy = 0; f.counterUntil = 0;
    const c = { a: name, t: 0, pid: p ? p.id : -1, X: null, Y: null, keys: null, ev: [], evi: 0, kick: false, face: null, dirs: null };
    f.dz.env = c;
    A.setup(f, c, p);
    if (D.stats) D.stats.envActs = (D.stats.envActs || 0) + 1;
    if (ENV.st) { const k = (isCpu(f) ? 'C:' : 'P:') + name, e = ENV.st[k] || (ENV.st[k] = [0, 0]); e[0]++; }
    remember(f, name);
    return true;
  }
  D.envStart = start;
  function remember(f, name) {
    const z = f.dz;
    z.envLast = name; z.envN = (z.envN || 0) + 1;
    z.envR = [name].concat((z.envR || '').split(',').filter((x) => x && x !== name)).slice(0, 3).join(',');
  }







  const CONTACT = { block: 1, parry: 1, clash: 1, recoil: 1, dbind: 1, lock: 1 };
  const EX_HOLD = 1.0, REACH = 150;
  const inExchange = () => !!(G.flags && G.flags.envEx > 0) || !!(G.F && G.F.some((f) => f && CONTACT[f.state]));
  function exchangeStep(h, F) {
    const Fl = G.flags;
    if (!Fl) return;
    if (F.some((f) => CONTACT[f.state])) Fl.envEx = EX_HOLD;
    else if (Fl.envEx > 0) Fl.envEx = Math.max(0, Fl.envEx - h);
  }
  D.envExchange = inExchange;

  const FP = ND.Fighter.prototype, upd0 = FP.update, inv0 = FP.isInv, pass0 = FP.passing;



  const ARM = 76;


  const THRUST_MIN = 172, CUT_MIN = 68;
  for (const id of ['kuro']) {
    const M = ND.MOVES && ND.MOVES[id];
    if (typeof M !== 'function') continue;
    ND.MOVES[id] = (f, n) => {
      const r = M(f, n);
      if (r === 'd_tsuki' && f.dz && f.opp && Math.abs(f.opp.x - f.x) < THRUST_MIN && ND.ATK.d_kesaR) { f.dz.lastMove = 'd_kesaR'; return 'd_kesaR'; }
      return r;
    };
  }


  const SP_MIN = 96;
  function reachIn(f, dt) {
    const o = f.opp, a = f.atk;
    if (f.state === 'atk' && a && a.special && o && !o.dead && o.state !== 'down' && o.state !== 'getup' && Math.abs(o.x - f.x) < SP_MIN) {
      const s1 = Math.sign(o.x - f.x) || f.dir; f.x = Math.max(-ND.ARENA, Math.min(ND.ARENA, o.x - s1 * SP_MIN));
    }
    if (f.state !== 'atk' || !a || a.kind !== 'blade' || a.special || a.prop || !a.active || !o || o.dead || !f.onGround || !o.onGround || o.state === 'down' || o.state === 'getup' || o.state === 'launch') return;
    const d0 = Math.abs(o.x - f.x), s0 = Math.sign(o.x - f.x) || f.dir;


    if (d0 < CUT_MIN && !a.cross && f.st < a.active[1] + 0.1) { f.x = Math.max(-ND.ARENA, Math.min(ND.ARENA, o.x - s0 * CUT_MIN)); f.vx = 0; }
    if (f.st < a.active[0] - 0.18 || f.st > a.active[1]) return;
    const reach = ARM + ((f.wpn && f.wpn.blade) || 96) - 8, d = Math.abs(o.x - f.x), s = Math.sign(o.x - f.x) || f.dir;

    if (f.ch.id === 'kuro' && f.dz && f.dz.lastMove === 'd_tsuki' && d < THRUST_MIN) { f.x = Math.max(-ND.ARENA, Math.min(ND.ARENA, o.x - s * THRUST_MIN)); return; }
    if (d <= reach || d > reach + 90) return;
    const step = Math.min(d - reach, 1500 * dt);
    f.x = Math.max(-ND.ARENA, Math.min(ND.ARENA, f.x + s * step));
  }
  FP.update = function (dt) {


    if (this.dz && P.live) { heldButtons(this, dt); if (human(this) && this.state !== 'denv') contextual(this); }
    if (this.dz && this.dz.envRep > 0) this.dz.envRep -= dt;
    const c = this.dz && this.state === 'denv' ? this.dz.env : null;
    if (!c) { const r = upd0.call(this, dt); if (this.dz) reachIn(this, dt); return r; }
    upd0.call(this, dt);
    if (this.dead || this.state !== 'denv') { if (this.dz) this.dz.env = null; return; }
    const A = ACT[c.a];
    c.t += dt;
    const t = c.t, o = this.opp;
    while (c.evi < c.ev.length && t >= c.ev[c.evi][0]) { const e = c.ev[c.evi++]; e[1](this, c); }
    if (this.state !== 'denv') return;
    if (c.keys) pose.seq(c.keys, Math.min(t, A.dur), this.pose);
    const x0 = this.x;
    if (c.X) this.x = A.out ? track(c.X, t) : clamp(track(c.X, t), -ND.ARENA, ND.ARENA);

    if (A.kickWin && t > A.kickWin[0] && t < A.kickWin[1] && o && !o.dead && Math.abs(o.x - this.x) < KICK_SEP && (c.a !== 'vault' || c.kick)) {
      const sd = Math.sign(this.x - o.x) || -this.dir || -1;
      this.x = clamp(o.x + sd * KICK_SEP, -ND.ARENA, ND.ARENA);
    }
    let y = c.Y ? track(c.Y, t) : 0;

    c.sink = A.out && y > 0 ? y : 0; if (c.sink) y = 0;

    this.y = y; this.vx = dt > 0 ? (this.x - x0) / dt : 0; this.vy = 0; this.onGround = y > -1 && !(A.air && t > A.air[0] && t < A.air[1]);
    if (c.dirs) { for (const d of c.dirs) if (t >= d[0]) this.dir = d[1]; }
    else if (c.face === 'opp' && o) this.dir = o.x >= this.x ? 1 : -1;
    else if (c.face === 'post') { const q = P.get(c.pid); if (q) this.dir = q.x >= this.x ? 1 : -1; }
    if (t >= A.dur) { this.dz.env = null; this.dz.envRep = 1.5; this.y = 0; this.vx = 0; this.onGround = true; this.setState('move'); }
  };
  FP.isInv = function () {
    const c = this.dz && this.state === 'denv' ? this.dz.env : null;

    if (c) { const A = ACT[c.a]; if (A.inv && c.t > A.inv[0] && c.t < A.inv[1]) return true; if (A.air) { const m = (A.air[1] - A.air[0]) / 3; if (c.t > A.air[0] + m && c.t < A.air[1] - m) return true; } }
    return inv0.call(this);
  };
  FP.passing = function () { const c = this.dz && this.state === 'denv' ? this.dz.env : null; return !!(c && (c.a === 'vault' || c.a === 'wall' || c.a === 'steps' || ACT[c.a].pass)) || pass0.call(this); };



  function options(f) {
    const o = f.opp, out = [], A = ND.ARENA;
    if (!o || o.dead) return out;
    const dist = Math.abs(o.x - f.x), toward = Math.sign(o.x - f.x) || f.dir;

    const v = near(f, (p) => VAULT[p.k] && (p.x - f.x) * toward > 20, 190);
    if (v && dist > 90) out.push(['vault', v, 2]);


    const tb = near(f, (p) => p.k === 'table' && (p.x - f.x) * toward > 20 && (o.x - p.x) * toward > KINDS.table.w / 2 + 40, 230);
    if (tb && dist < 440) out.push(['flip', tb, 4]);

    const ps = near(f, (p) => p.k === 'post', 130);
    if (ps && dist < 300 && dist > 60) out.push(['swing', ps, 2]);

    const ln = near(f, (p) => p.k === 'lantern' && Math.abs(o.x - p.x) < 150, 200);
    if (ln && armed(f)) out.push(['lantern', ln, 6]);

    if (Math.abs(f.x) > A - 200 && (o.x - f.x) * Math.sign(f.x) < 0 && dist < 340 && dist > 70 && !(D.arenaNoWall && D.arenaNoWall(Math.sign(f.x)))) out.push(['wall', null, 2.5]);

    const st = near(f, (p) => p.k === 'veranda', 220);
    if (st && dist < 360 && dist > 120 && Math.abs(o.x - st.x) > KINDS.veranda.w / 2 - 10) out.push(['steps', st, 2.5]);
    return out;
  }

  function propOptions(f) {
    const o = f.opp, out = [];
    if (!o || o.dead) return out;
    const dist = Math.abs(o.x - f.x);
    if (f.wpn && f.wpn.none) { const r = P.nearest(f, 'rack', 700); if (r) out.push(['p:rearm', r.p, 4]); }
    const away = Math.sign(o.x - f.x) || f.dir;
    if (dist < 118) {

      let best = null;
      for (const p of S.items) {
        const K = KINDS[p.k];
        if (p.st !== 0 || !K.top || K.hp === Infinity || K.fixed) continue;
        const beyond = (p.x - o.x) * away;
        if (beyond > 20 && beyond < 260 && (!best || (p.k === 'table' && best.k !== 'table'))) best = p;
      }
      if (best) out.push(['p:shove', best, best.k === 'table' ? 4 : 2.5]);
    }
    const kk = P.nearest(f, (p) => KINDS[p.k].kick && !KINDS[p.k].fixed && p.st === 0 && Math.abs(o.x - p.x) < 520 && Math.abs(o.x - p.x) > 90, 230);
    if (kk) out.push(['p:kick', kk.p, 3]);
    const cc = P.nearest(f, (p) => KINDS[p.k].carry && p.st === 0, 260);
    if (cc && !P.held(f) && !handsBusy(f)) out.push(['p:grab', cc.p, dist > 170 ? 2.5 : 1]);
    return out;
  }
  function doOption(f, e) {
    const name = e[0], p = e[1];
    if (name.startsWith('p:')) {
      const act = name.slice(2);
      const ok = act === 'shove' ? P.act(f, 'shove', p) : P.go(f, p, act);
      if (ok) remember(f, name);
      return ok;
    }
    return start(f, name, p);
  }


  const ENV = D.env2 = { gap: [3.0, 5.0], st: {}, cpuOff: /[?&]envcpu=0(&|$)/.test(location.search || '') };
  function pairBite(d, a, p) {
    if (!start(d, 'dodgePost', p)) return false;
    start(a, 'stuck', p);
    return true;
  }
  const CPU_FAR = 320;



  const cpuLv = (f) => { const a = G.ais && G.ais.find((q) => q && q.me === f); return a && a.lv ? a.lv : null; };
  const LV2 = () => (ND.AI_LEVELS && ND.AI_LEVELS[2]) || { smart: 0.95, str: 0.76 };
  function think(f, h) {
    const z = f.dz;
    if (!z || f.dead || !isCpu(f) || G.phase !== 'fight') return;
    const L0 = cpuLv(f), kS = L0 ? Math.max(0.1, (L0.smart || 0) / (LV2().smart || 1)) : 1;
    z.envCd = (z.envCd == null ? 1.2 : z.envCd) - h;
    if (z.envBiteT > 0) z.envBiteT -= h;
    if (inExchange() || ENV.cpuOff) return;

    const o = f.opp;
    if (o && !o.dead && o.state === 'atk' && o.atk && o.atk.kind === 'blade' && o.atk.active && o.st < o.atk.active[0] - 0.05 && armed(o) && free(f) && !S.tasks[f.id]) {
      const ps = near(f, (p) => p.k === 'post', 100);
      if (ps && Math.abs(o.x - f.x) < 180 && !(z.envBiteT > 0) && rnd() < h * 14 * kS) { pairBite(f, o, ps); z.envBiteT = 6; return; }
    }

    const held = P.held(f);
    if (held && free(f) && !S.tasks[f.id]) {
      const K = KINDS[held.k], dist = Math.abs(o.x - f.x);
      z.envHeld = (z.envHeld || 0) + h;
      if (dist < 130 && o.state !== 'atk' && rnd() < h * 4 * kS) { if (P.act(f, K.swing ? 'swing' : 'smash')) z.envHeld = 0; }
      else if (K.throw && ((dist > 200 && dist < 560 && rnd() < h * 1.2 * kS) || z.envHeld > 4 / kS)) { if (P.act(f, 'throw')) z.envHeld = 0; }
      return;
    }
    if (z.envCd > 0) return;


    if (S.tasks[f.id] || !free(f) || P.held(f) || z.cine) return;
    if (Math.abs(o.x - f.x) < CPU_FAR) { z.envCd = 0.25; return; }
    if (choose(f)) return;
    z.envCd = 0.25;
  }




  function good(f, e) {
    const o = f.opp, name = e[0], p = e[1], dist = Math.abs(o.x - f.x);
    if (o.state === 'atk' && o.atk && o.atk.active && o.st < o.atk.active[1] && dist < 190) return false;
    if (name === 'p:grab' || name === 'p:rearm') return name === 'p:rearm' || (dist > 160 && dist < 420);
    if (name === 'p:kick') return Math.abs(o.x - p.x) < 280 && (o.x - p.x) * (p.x - f.x) > 0 && dist > 90;

    if (o.dead || o.state === 'down' || o.state === 'getup' || o.state === 'launch' || o.state === 'droll' || o.state === 'dodge' || (o.isInv && o.isInv())) return false;


    if (dist < 150 && name !== 'p:shove') return false;
    switch (name) {
      case 'vault': { const K = KINDS[p.k], d = Math.sign(p.x - f.x) || f.dir, x1 = p.x + d * (K.w / 2 + 48); return (o.x - x1) * d > -20 && Math.abs(o.x - x1) < 110; }
      case 'swing': { const s = Math.sign(p.x - f.x) || f.dir; return Math.abs(o.x - (p.x + s * 34)) < 100 && (o.x - p.x) * s > 0; }
      case 'lantern': return Math.abs(o.x - p.x) < 105;
      case 'wall': return dist > 110 && dist < 300;
      case 'steps': return dist > 130 && dist < 300;
      case 'flip': return (o.x - p.x) * Math.sign(p.x - f.x) < 300;
      case 'p:kick': return Math.abs(o.x - p.x) < 280 && (o.x - p.x) * (p.x - f.x) > 0;
      case 'p:grab': return dist > 160 && dist < 420;
      default: return true;
    }
  }
  function choose(f) {
    const z = f.dz, R0 = (z.envR || '').split(',');
    const L = options(f).concat(propOptions(f)).filter((e) => e[0] !== R0[0] && !(e[0] === R0[1] && rnd() < 0.6) && good(f, e));
    if (ENV.dbg) { ENV.dbg.free++; if (!L.length) ENV.dbg.none++; }
    if (!L.length) return false;
    let tot = 0;
    for (const e of L) { const k = R0.indexOf(e[0]); if (k >= 0) e[2] *= k === 0 ? 0.12 : k === 1 ? 0.3 : 0.6; tot += e[2]; }
    let r = rnd() * tot, pick = L[0];
    for (const e of L) { r -= e[2]; if (r <= 0) { pick = e; break; } }
    if (!doOption(f, pick)) return false;
    const L0 = cpuLv(f), kT = L0 ? Math.max(0.25, (L0.str || 0) / (LV2().str || 1)) : 1;
    z.envCd = (ENV.gap[0] + rnd() * (ENV.gap[1] - ENV.gap[0])) / Math.min(1.25, kT);
    return true;
  }







  const CARRY = { stool: 1, bottle: 1, jar: 1, bucket: 1, cup: 1 };
  const ICON = { table: 'table', stool: 'stool', bottle: 'jar', jar: 'jar', bucket: 'jar', cup: 'jar', barrel: 'barrel', bale: 'barrel', crate: 'barrel', post: 'post', lantern: 'lantern', veranda: 'steps', rack: 'rack' };
  function ctxPick(f, hold) {
    const o = f.opp, A = ND.ARENA;
    if (!o || f.dead || !f.dz) return null;
    const held = P.held(f);
    if (held) return KINDS[held.k].throw ? { a: 'p:throw', p: held, icon: 'throw' } : null;
    const toward = Math.sign(o.x - f.x) || f.dir, dist = Math.abs(o.x - f.x), C = [];
    const add = (a, p, d, icon) => C.push({ a, p, d, icon });

    if (Math.abs(f.x) > A - 90 && (o.x - f.x) * Math.sign(f.x) < 0 && !(D.arenaNoWall && D.arenaNoWall(Math.sign(f.x)))) add('wall', null, A - Math.abs(f.x), 'wall');
    for (const p of S.items) {
      if (p.st !== 0) continue;
      const K = KINDS[p.k], dx = p.x - f.x, ad = Math.abs(dx), ahead = dx * toward > 0;
      if (p.k === 'veranda') { if (ad < K.w / 2 + 40 && dist > 90) add('steps', p, Math.max(0, ad - K.w / 2), 'steps'); continue; }
      if (p.k === 'post') { if (ad < 90) add(o.state === 'atk' && o.atk && o.atk.kind === 'blade' && o.atk.active && o.st < o.atk.active[0] && armed(o) && dist < 180 ? 'dodgePost' : 'swing', p, ad, 'post'); continue; }
      if (p.k === 'lantern') { if (ad < 120 && armed(f)) add('lantern', p, ad, 'lantern'); continue; }
      if (p.k === 'rack') { if (ad < 110 && f.wpn && f.wpn.none) add('p:rearm', p, ad, 'rack'); continue; }
      if (p.k === 'table') {
        if (ad > 120) continue;
        const beyond = (o.x - p.x) * toward > K.w / 2 + 30;
        if (hold < 0 && ahead) add('flip', p, ad, 'table');
        else if (hold > 0 && ahead) add('vault', p, ad, 'table');
        else if (ahead) add(beyond ? 'flip' : 'vault', p, ad, 'table');
        continue;
      }
      if (CARRY[p.k] && K.carry && !handsBusy(f)) { if (ad < 80 && !(p.sup >= 0)) add('p:grab', p, ad, ICON[p.k]); else if (p.k === 'stool' && ahead && ad < 90 && hold > 0) add('vault', p, ad, 'stool'); continue; }
      if (VAULT[p.k] && ad < 95 && ahead) { add(hold > 0 || !K.kick ? 'vault' : 'p:kick', p, ad, ICON[p.k] || 'barrel'); continue; }
      if (K.kick && !K.fixed && ad < 90) add('p:kick', p, ad, ICON[p.k] || 'barrel');
    }
    if (D.arenaCtx) D.arenaCtx(f, hold, add);
    if (!C.length) return null;
    C.sort((x, y) => x.d - y.d);
    return C[0];
  }
  D.envCtxPick = ctxPick;
  function doCtx(f, e) {
    if (!e) return false;
    if (e.a === 'p:throw') return P.act(f, 'throw');
    if (e.a === 'p:grab') return P.act(f, 'grab', e.p);
    if (e.a === 'p:kick') return P.act(f, 'kick', e.p);
    if (e.a === 'p:rearm') return P.go(f, e.p, 'rearm');
    if (e.a === 'dodgePost') return pairBite(f, f.opp, e.p);
    return start(f, e.a, e.p);
  }



  const CTX = D.envCtx = { pending: 0, key: 'KeyQ' };
  const ctxPress = () => { const c = ND.input && ND.input.p1; if (!c) { CTX.pending = 1; return; } c.press('ctx', 'ctxbtn'); c.release('ctx', 'ctxbtn'); };
  D.envCtxPress = ctxPress;
  function contextual(f) {
    const z = f.dz;
    if (!z || f.dead || G.phase !== 'fight') { CTX.pending = 0; return; }
    const mine = f.ctrl && f.ctrl.take ? f.ctrl.take('ctx', 0.3) : false;
    if (mine || (CTX.pending && f.ctrl === (ND.input && ND.input.p1))) { CTX.pending = 0; z.envQ = 0.3; CTX.pressT = 0.2; }
    if (!(z.envQ > 0)) return;
    if (!free(f) || S.tasks[f.id] || z.cine) return;
    const hold = (f.ctrl && f.ctrl.axis ? f.ctrl.axis() : 0) * (Math.sign(f.opp.x - f.x) || f.dir);
    const e = ctxPick(f, hold > 0 ? 1 : hold < 0 ? -1 : 0);
    if (doCtx(f, e)) { z.envQ = 0; remember(f, e.a); }
  }


  function heldButtons(f, dt) {
    const p = P.held(f), z = f.dz, b = f.ctrl && f.ctrl.buf;
    if (z && z.envQ > 0) z.envQ -= dt;
    if (!p || !b || !z) { if (z) { z.envHQ = 0; z.envHP = -1; } return; }

    if (z.envHP !== p.id) { z.envHP = p.id; z.envHQ = 0; b.light = null; b.heavy = null; }
    if (b.light != null || b.heavy != null) z.envHQ = 0.6;
    b.light = null; b.heavy = null; b.special = null;
    if (z.envHQ > 0) {
      z.envHQ -= dt;
      if (P.free(f) && !S.tasks[f.id] && P.act(f, KINDS[p.k].swing ? 'swing' : 'smash')) z.envHQ = 0;
    }
    z.chain = 0;
  }


  const lock0 = G.startLock;
  if (lock0) {
    G.startLock = function (a, b, x, y) {
      if (!(P.live && ((a && P.held(a)) || (b && P.held(b))))) return lock0.apply(this, arguments);
      const atk = a.state === 'atk' && b.state !== 'atk' ? a : b.state === 'atk' && a.state !== 'atk' ? b : null;
      if (atk) { const d = atk.opp; atk.setState('recoil'); atk.vx = -atk.dir * 120; d.setState('block', { dur: 0.2 }); d.vx = atk.dir * 90; }
      else { a.setState('clash'); b.setState('clash'); a.vx = -a.dir * 330; b.vx = -b.dir * 330; }
    };
  }


  const blk0 = FP.blocked;
  FP.blocked = function (a, x, y, isKick, fromX) {
    const o = this.opp, p = o && o.dz && P.live ? P.held(o) : null;
    if (!p) return blk0.apply(this, arguments);
    const dis = a && a.disarm;
    if (dis) a.disarm = false;
    o.dz.chain = -1e3;

    const sd = a && a.sides && a.sides[this.hitIdx] != null ? a.sides[this.hitIdx] : a && a.dz3 ? a.dz3.side : 0;
    o.dz.gs = -sd;
    let r;
    try { r = blk0.apply(this, arguments); } finally { if (dis) a.disarm = dis; o.dz.chain = 0; }
    if ((o.state === 'block' || o.state === 'parry') && o.st === 0 && !isKick && p.st === 2) {
      const K = KINDS[p.k], dmg = 2.6 + (a && a.dmg ? a.dmg : 10) * 0.07;
      fx.spark(x, y, Math.atan2(-0.5, -this.dir), 8, 0.6, K.mat === 'wood' ? '230,200,150' : '240,240,240'); au.thud(0.8, o.pan);
      if (!P.hurt(p, dmg, 'cut', x, y, this.dir, 0.3, this)) { if (!o.dz.envBlk) label(o, 'Blocks with the ' + p.k); }
      o.dz.envBlk = (o.dz.envBlk || 0) + 1;
    }
    return r;
  };





  function newSpills() {
    const Fl = G.flags;
    if (!Fl) return;
    const seen = Fl.envSeen || (Fl.envSeen = []);
    for (const p of S.items) {
      if (p.st !== 3 || seen.indexOf(p.id) >= 0) continue;
      seen.push(p.id);
      const K = KINDS[p.k];
      if (!K || !K.liquid) continue;
      const L = Fl.envSpill || (Fl.envSpill = []);
      if (L.filter((q) => !q[3]).length < 4) L.push([p.x, 6, K.liquid, 0]);
    }
  }
  function spills(h, F) {
    newSpills();
    const L = G.flags && G.flags.envSpill;
    if (!L || !L.length) return;
    for (let i = L.length - 1; i >= 0; i--) {
      const sp = L[i];
      sp[1] -= h;
      if (sp[1] <= 0) { L.splice(i, 1); continue; }
      if (sp[1] > 5.6 || sp[3] || G.phase !== 'fight') continue;
      for (const f of F) {
        const z = f.dz;
        if (!z || f.dead || f.state !== 'move' || !f.onGround || Math.abs(f.vx) < 170 || Math.abs(f.x - sp[0]) > 22 || z.envSlipT > 0 || z.envSlips || isCpu(f)) continue;
        z.envLiq = sp[2]; z.envSlipT = 4; z.envSlips = 1;
        if (start(f, 'slip', null)) { sp[3] = 1; break; }
      }
    }
    for (const f of F) if (f.dz && f.dz.envSlipT > 0) f.dz.envSlipT -= h;
  }









  const KICK_SEP = 78, FOOT_SEP = 56;


  const SEP_EX = 40;
  const SEP = 40, DOWN_SEP = 50, LAUNCH_SEP = 60, AIR_SEP = 72, OVER = 175, ABOVE = 40, ABOVE_SEP = 100;
  const held = (f) => f.state === 'lock' || f.state === 'dbind' || f.state === 'dseq' || !!(f.dz && f.dz.cine) || (f.state === 'denv' && !!(f.dz && f.dz.env && ACT[f.dz.env.a] && ACT[f.dz.env.a].hold));
  const lying = (f) => f.state === 'down' || f.state === 'getup' || (f.state === 'launch' && f.onGround);
  const placeApart = (a, b, s, gap, wa) => {
    const A = ND.ARENA, d = b.x - a.x, push = gap - d * s;
    if (push <= 0) return;
    a.x -= s * push * wa; b.x += s * push * (1 - wa);
    if (Math.abs(a.x) > A) { const o = Math.abs(a.x) - A; a.x = Math.sign(a.x) * A; b.x += s * o; }
    if (Math.abs(b.x) > A) { const o = Math.abs(b.x) - A; b.x = Math.sign(b.x) * A; a.x -= s * o; }
  };

  const THRU = 36;
  const through = (f) => (f.passing && f.passing() && f.state === 'atk' && f.atk && f.atk.cross) || !!(D.passing && D.passing(f));
  const kicking = (f) => f.state === 'atk' && f.atk && f.atk.kind === 'kick' && f.atk.active && f.st > f.atk.active[0] - 0.08 && f.st < f.atk.active[1] + 0.08;
  function spacing(g, a, b) {
    const za = a.dz, d = b.x - a.x;



    const jump = (f) => f.dz && f.dz.lx != null && Math.abs(f.x - f.dz.lx) > 48;
    if ((jump(a) || jump(b)) && d) za.side = Math.sign(d);
    a.dz.lx = a.x; b.dz.lx = b.x;
    const side = za.side || Math.sign(d) || a.dir || 1;
    if (g.lock || held(a) || held(b) || (a.dead && b.dead)) { if (d) za.side = Math.sign(d); return; }


    if (a.dead || b.dead) {
      const live = a.dead ? b : a, dead = a.dead ? a : b;
      if (through(live)) {
        if (Math.abs(d) < THRU) { const h = Math.sign(live.vx) || live.dir || 1, A = ND.ARENA, past = dead.x + h * THRU; live.x = Math.abs(past) <= A ? past : Math.max(-A, Math.min(A, dead.x - h * THRU)); }
      }
      else placeApart(a, b, side, SEP, live === a ? 1 : 0);
      if (b.x !== a.x) za.side = Math.sign(b.x - a.x);
      return;
    }
    const over = Math.abs(a.y - b.y) > OVER, la = lying(a), lb = lying(b);

    if (inExchange() && !la && !lb && !over && !through(a) && !through(b) && a.onGround && b.onGround) {
      const va = Math.abs(a.vx || 0), vb = Math.abs(b.vx || 0);
      placeApart(a, b, side, SEP_EX, va + vb > 1 ? va / (va + vb) : 0.5);
      za.side = side;
      return;
    }
    const after = () => { if (b.x !== a.x) za.side = Math.sign(b.x - a.x); };


    if (la !== lb) {
      const up = la ? b : a, inAir = !up.onGround && up.y < -20;
      const gap = inAir ? Math.max(DOWN_SEP, up.state === 'launch' ? LAUNCH_SEP : AIR_SEP) : kicking(up) ? Math.max(DOWN_SEP, FOOT_SEP + 10) : up.state === 'droll' ? KICK_SEP : DOWN_SEP;
      placeApart(a, b, over ? Math.sign(d) || side : side, gap, inAir ? (up === a ? 1 : 0) : la ? 1 : 0);
      return after();
    }
    if (over) {

      const L = a.state === 'launch' && !a.onGround ? a : b.state === 'launch' && !b.onGround ? b : null;
      if (L && Math.abs(d) < LAUNCH_SEP) placeApart(a, b, Math.sign(d) || side, LAUNCH_SEP, L === a ? 1 : 0);
      return after();
    }
    const ta = through(a), tb = through(b), Lx = (a.state === 'launch' && !a.onGround) || (b.state === 'launch' && !b.onGround);
    if ((ta || tb) && !Lx) {
      if (Math.abs(d) < THRU) {


        const m = ta ? a : b, o = m === a ? b : a, h = Math.sign(m.vx) || m.dir || 1, A = ND.ARENA, past = o.x + h * THRU;

        if (!(D.passing && D.passing(m))) m.x = Math.abs(past) <= A ? past : Math.max(-A, Math.min(A, o.x - h * THRU));
      }
      return after();
    }


    const hi = a.y < b.y - ABOVE && !a.onGround ? a : b.y < a.y - ABOVE && !b.onGround ? b : null;
    if (hi) { placeApart(a, b, side, ABOVE_SEP, hi === a ? 1 : 0); za.side = side; return; }


    const kk = kicking(a) || (a.state === 'droll' && !through(a)) ? a : kicking(b) || (b.state === 'droll' && !through(b)) ? b : null;
    if (kk) { placeApart(a, b, side, kk.state === 'droll' ? KICK_SEP : FOOT_SEP, kk === a ? 1 : 0); za.side = side; return; }
    const Lg = a.state === 'launch' ? a : b.state === 'launch' ? b : null;

    const airEnv = (f) => !f.onGround && f.y < -20 && f.state !== 'launch';
    const gap = la && lb ? DOWN_SEP : Lg ? LAUNCH_SEP : airEnv(a) || airEnv(b) ? AIR_SEP : SEP;


    const va = Math.abs(a.vx || 0), vb = Math.abs(b.vx || 0);
    placeApart(a, b, side, gap, Lg ? (Lg === a ? 1 : 0) : va + vb > 1 ? va / (va + vb) : 0.5);
    za.side = side;
  }


  const EXOLD = /[?&]exold=1(&|$)/.test(location.search || '');
  const sep0 = G.separate, SEP_OFF = /[?&]dsep=0(&|$)/.test(location.search || '');
  if (sep0 && !SEP_OFF) {
    G.separate = function () {
      const F = this.F || G.F;
      if (!F || !F[0] || !F[1] || !F[0].dz || !F[1].dz) return sep0.call(this);

      if (inExchange() && EXOLD) { const r = sep0.call(this); const d = F[1].x - F[0].x; if (d) F[0].dz.side = Math.sign(d); return r; }
      spacing(this, F[0], F[1]);
    };


    const up0 = G.update;
    G.update = function (rdt) {
      const r = up0.apply(this, arguments);

      if (this.F && this.F[0] && this.F[0].dz && this.phase === 'fight' && this.hitstopT <= 0) exchangeStep((rdt || 0) * (this.slow || 1), this.F);
      const F = this.F || G.F;
      if (F && F[0] && F[1] && F[0].dz && F[1].dz && (this.phase === 'fight' || this.phase === 'ko') && !(EXOLD && inExchange())) spacing(this, F[0], F[1]);
      return r;
    };
  }



  function throughTable(F) {
    for (const f of F) {
      if (f.dead || !(f.state === 'down' || f.state === 'launch') || f.st > 0.25 || f.y < -60) continue;
      for (const p of S.items) {
        const K = KINDS[p.k];
        if (p.st !== 0 || !K.top || K.hp === Infinity || K.fixed || K.m < 1.5) continue;
        if (Math.abs(f.x - p.x) > K.w / 2 + 20 || f.y < -(K.top + 30)) continue;
        if (f.state === 'launch' && f.vy < 60) continue;
        P.breakProp(p, 'crush', { x: f.x, y: -K.top, dx: f.dir, dy: 1, by: f.opp });
        break;
      }
    }
  }
  const step0 = P.step;
  P.step = function (h, F) {
    if (P.live && F) {
      for (const f of F) if (!human(f)) think(f, h);
      throughTable(F);
      spills(h, F);
      refill(h, F);
      if (D.arenaStep) D.arenaStep(h, F);
    }



    const keep = F && P.live && SET_CRASH_OFF ? F.map((f) => (!f.dead && (f.state === 'launch' || f.state === 'down' || f.state === 'plunge') ? [f.x, f.y, f.vx, f.vy, f.hp, f.damageTaken, f.state, f.serial] : null)) : null;



    if (P.live && F && SET_CRASH_OFF) for (const f of F) {
      if (f.dead || f.state !== 'atk' || !f.atk || f.atk.kind !== 'kick' || /^pr_/.test(f.atkName || '')) continue;
      for (const p of S.items) if (p.st !== 3 && p.st !== 2 && Math.abs(p.x - f.x) < 140) { p.hitF = f.id; p.hitT = S.t; }
    }



    const any = P.live && SET_CRASH_OFF, hs0 = G.hitstop, hsT = G.hitstopT;
    if (any) G.hitstop = function () {};
    let r;
    try { r = step0.apply(this, arguments); } finally { if (any) { G.hitstop = hs0; G.hitstopT = hsT; } }
    if (keep) F.forEach((f, i) => { const k = keep[i]; if (!k || f.dead || f.state !== k[6] || f.serial !== k[7]) return; f.y = k[1]; f.vy = k[3]; f.vx = k[2]; if (f.hp < k[4]) { f.hp = k[4]; f.damageTaken = k[5]; } });
    return r;
  };
  const SET_CRASH_OFF = !/[?&]setcrash=1(&|$)/.test(location.search || '');





  function drawShrine(ctx, p) {
    const K = KINDS[p.k], bx = p.x - K._com[0] * (p.fx || 1), by = p.y - K._com[1], hw = K.w / 2, top = K.top;
    const box = (x, y, w, h, fill, line) => { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fillStyle = fill; ctx.fill(); if (line) { ctx.strokeStyle = line; ctx.lineWidth = 1.4; ctx.stroke(); } };
    const ln = (pts, col, w) => { ctx.beginPath(); for (const q of pts) { ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); } ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
    ctx.save();
    ctx.translate(bx, by); ctx.lineJoin = 'round';

    for (let x = -hw + 6; x <= hw - 5; x += 37) box(x - 3.5, -top - 40, 7, 40, '#7d2219', '#2a0d09');
    box(-hw + 2, -top - 44, K.w - 4, 7, '#a8342a', '#2a0d09');
    box(-hw + 2, -top - 22, K.w - 4, 3.5, '#8a281f', '#2a0d09');
    ln([[-hw + 3, -top - 43.2, hw - 3, -top - 43.2]], 'rgba(255,190,150,.55)', 1.2);

    box(-hw, -top + 9, K.w, top - 9, 'rgba(12,8,6,.94)');
    for (const x of [-hw + 5, -hw / 2, 0, hw / 2, hw - 5]) box(x - 4.5, -top + 8, 9, top - 8, '#3a2415', '#160b05');

    box(-hw - 3, -top, K.w + 6, 10, '#7a5232', '#1e1008');
    ln([[-hw - 2, -top + 0.8, hw + 2, -top + 0.8]], 'rgba(255,214,160,.7)', 1.6);
    ln([[-hw / 2, -top + 2, -hw / 2, -top + 9], [0, -top + 2, 0, -top + 9], [hw / 2, -top + 2, hw / 2, -top + 9]], 'rgba(30,16,8,.55)', 0.9);

    for (const s of [-1, 1]) {
      const x0 = s * (hw + 3);
      for (const [h, d] of [[top / 3, 42], [(2 * top) / 3, 26]]) {
        const xa = s > 0 ? x0 : x0 - d;
        box(xa, -h, d, h, '#77726b', '#1f1d1b');
        box(xa, -h, d, 4, '#9a948a');
        ln([[xa + 1, -h + 0.8, xa + d - 1, -h + 0.8]], 'rgba(250,240,215,.85)', 1.5);
      }
    }
    ctx.restore();
  }

  function drawSpills(ctx) {
    const L = G.flags && G.flags.envSpill;
    if (!L || !L.length) return;
    ctx.save();
    for (const sp of L) {
      const grow = Math.min(1, (6 - sp[1]) / 0.4), a = Math.min(1, sp[1] / 1.5), w = 30 + 16 * grow;
      const col = sp[2] === 'water' ? '120,150,175' : '205,170,105';
      ctx.globalAlpha = 0.85 * a;
      ctx.beginPath(); ctx.ellipse(sp[0], 1, w, 6, 0, 0, Math.PI * 2); ctx.fillStyle = `rgba(${col},.8)`; ctx.fill();
      ctx.beginPath(); ctx.ellipse(sp[0] + w * 0.4, 2, w * 0.4, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.9 * a;
      ctx.beginPath(); ctx.ellipse(sp[0] - w * 0.25, -0.5, w * 0.4, 1.6, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,248,230,.9)'; ctx.fill();
    }
    ctx.restore();
  }
  if (P.draw) {
    const pdraw0 = P.draw;
    P.draw = function (ctx, layer) {
      hookMocap();
      if (layer === 'back') { try { uiUpdate(); } catch (e) {                                           } }
      if (layer !== 'back' || !G.F || !G.F[0] || !G.F[0].dz) { const r = pdraw0.call(this, ctx, layer); if (layer !== 'back' && G.F && G.F[0] && G.F[0].dz && D.arenaDraw) { cam.world(ctx); D.arenaDraw(ctx, 'front'); } return r; }
      const own = S.arena !== 'temple' && D.arenaVeranda && D.arenaVeranda();
      const v = S.arena === 'temple' || own ? S.items.filter((p) => p.k === 'veranda' && p.st === 0) : [];
      cam.world(ctx);
      if (D.arenaDraw) { ctx.save(); D.arenaDraw(ctx, 'back'); ctx.restore(); }
      for (const p of v) (own ? own : drawShrine)(ctx, p);

      for (const p of v) p.st = 2;
      try { pdraw0.call(this, ctx, layer); } finally { for (const p of v) p.st = 0; }
      cam.world(ctx);
      drawSpills(ctx);
    };
  }







  const MCL = {
    vault: ['fRunJumpOver', 0.32, 1.26, 0, 0.7, 'air'],
    wall: ['fBackflip', 0, 0.66, 0, 0.47, 'air'],
    steps: ['fStepstoolJump', 0.3, 0.78, 0.36, 0.6, 'air'],
    vaultKick: ['fRunJumpOver', 0.32, 0.95, 0, 0.46, 'air'],
    slip: ['fSlipSake', 0.05, 1.25, 0, 1.25, 'down'],
  };
  D.envMCL = MCL;
  const MCG = ['fStoolPick', 0.05, 0.75, 0, 0.42, null];
  const MCS = new WeakMap(), HIPS = {};

  function hipAt(id, t) {
    const Mo = ND.mocap, C = Mo && Mo.clips && Mo.clips[id];
    if (!C) return null;
    let H = HIPS[id];
    if (!H) { H = HIPS[id] = []; const fr = Mo.newFrame(); for (let i = 0; i <= Math.ceil(C.dur * 60); i++) { Mo.sample(C, i / 60, fr); H.push(fr.hip[1]); } }
    const x = clamp(t * 60, 0, H.length - 1), i = Math.floor(x), u = x - i;
    return H[i] + (H[Math.min(H.length - 1, i + 1)] - H[i]) * u;
  }

  function mcNow(f) {
    if (!f.dz || f.dead) return null;
    const c = f.state === 'denv' ? f.dz.env : null;
    if (c && MCL[c.a]) { const m = c.a === 'vault' && c.kick ? MCL.vaultKick : MCL[c.a]; if (c.t < m[3] || c.t > m[4]) return null; return { m, t: c.t, key: f.serial + ':' + c.a }; }
    if (f.state === 'atk' && f.atkName === 'pr_grab' && f.mem && f.mem.pid != null) {
      const q = P.get(f.mem.pid);
      if (q && q.k === 'stool' && f.st <= MCG[4]) return { m: MCG, t: f.st, key: f.serial + ':grab' };
    }
    return null;
  }

  function mcLift(f) {
    const MD = D.mocap;
    if (!MD || !MD.ready || !MD.act) return 0;
    const n = mcNow(f), st = MCS.get(f);
    if (!n) {


      if (st && st.on) {
        const c = f.state === 'denv' && f.dz && f.dz.env ? f.serial + ':' + f.dz.env.a : f.state === 'atk' && f.atkName === 'pr_grab' ? f.serial + ':grab' : null;
        if (c !== st.key && st.id !== 'fSlipSake' && MD.actOf(f) === st.id) MD.actStop(f);
        st.on = false;
      }
      return 0;
    }
    const m = n.m, span = m[4] - m[3], ct = m[1] + (m[2] - m[1]) * clamp((n.t - m[3]) / span, 0, 1);
    if (!st || st.key !== n.key) {
      if (!MD.act(f, m[0], { from: ct, to: m[2], dur: Math.max(0.05, m[4] - n.t), legs: m[5] || undefined, keepSword: true, fade: 0.1 })) return 0;
      MCS.set(f, { key: n.key, id: m[0], on: true });
    }
    if (m[5] !== 'air') return 0;
    const h0 = hipAt(m[0], m[1]), h = hipAt(m[0], ct);
    return h0 == null || h == null ? 0 : Math.max(0, h0 - h);
  }
  D.envClip = mcNow;

  let hooked = false;
  function hookMocap() {
    if (hooked || !D.mocap || !D.mocap.act) return;
    hooked = true;

    const MD = D.mocap, Rig = ND.mocap && ND.mocap.Rig;
    const markHold = () => { for (const f of G.F || []) { const rg = f && MD.rigOf ? MD.rigOf(f) : null; if (rg) rg.__hold = P.live && !f.dead && !!P.held(f); } };
    if (Rig && Rig.prototype.build) {
      const build0 = Rig.prototype.build;
      Rig.prototype.build = function (F, dt) { if (this.__hold) { F.armed = 0; F.inside = 0; F.tw = 0; } return build0.call(this, F, dt); };
    }
    const draw1 = FP.draw;
    FP.draw = function (ctx, reflect, layer) {
      markHold();
      const l = reflect ? 0 : mcLift(this);
      if (!l) return draw1.call(this, ctx, reflect, layer);
      const y0 = this.y; this.y = y0 + l;
      try { return draw1.call(this, ctx, reflect, layer); } finally { this.y = y0; }
    };
    const A3 = ND.depth25;
    if (A3 && A3.snap) {
      const snap1 = A3.snap;
      A3.snap = function (f, o) {
        markHold();
        const l = f ? mcLift(f) : 0;
        if (!l) return snap1.call(this, f, o);
        const y0 = f.y; f.y = y0 + l;
        try { return snap1.call(this, f, o); } finally { f.y = y0; }
      };
    }
  }





  const SVG = (b) => `<svg viewBox="0 0 24 24" width="62%" height="62%" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${b}</svg>`;
  const ICONS = {
    stool: SVG('<path d="M5 8h14M7 8l-2 11M17 8l2 11M8 14h8"/>'),
    table: SVG('<path d="M3 9h18M5 9v9M19 9v9M3 9l2-2h14l2 2"/>'),
    post: SVG('<path d="M9 3h6v18H9zM7 3h10M7 21h10"/>'),
    lantern: SVG('<path d="M12 2v3M8 5h8l1 3v8l-1 3H8l-1-3V8z M7 12h10"/>'),
    wall: SVG('<path d="M4 3v18M8 3v18M4 8h4M4 14h4M4 19h4M14 15l4-6m0 0l2 4m-2-4l-3 1"/>'),
    steps: SVG('<path d="M3 20h5v-5h5v-5h5V5h3"/>'),
    barrel: SVG('<path d="M7 4h10q2 8 0 16H7q-2-8 0-16zM6 9h12M6 15h12"/>'),
    jar: SVG('<path d="M9 3h6M10 3v3q-5 2-4 9 1 5 6 6 5-1 6-6 1-7-4-9V3"/>'),
    rack: SVG('<path d="M4 20V6M20 20V6M3 9h18M3 14h18M6 9l12 0"/>'),
    throw: SVG('<path d="M4 18c4-8 9-11 16-12M14 4l6 2-2 6"/>'),
  };
  const UI = { el: null, ic: '', on: false, hint: null, placedFor: '' };
  const KEYNAME = 'Q';
  function uiBuild() {
    if (UI.el || typeof document === 'undefined' || !document.getElementById('app')) return;
    const st = document.createElement('style');
    st.textContent = `#tCtx{position:absolute;left:0;top:0;z-index:31;width:var(--ctxd,64px);height:var(--ctxd,64px);border-radius:50%;border:0;padding:0;display:grid;place-items:center;
      color:#ffe3a1;background:radial-gradient(circle at 50% 45%,rgba(255,214,140,.28),rgba(20,16,12,.62) 70%);box-shadow:0 0 0 2px rgba(255,214,140,.75),0 0 14px rgba(255,190,90,.35);
      opacity:0;transform:scale(.8);transition:opacity .22s ease,transform .22s ease;pointer-events:none;touch-action:none;-webkit-tap-highlight-color:transparent}
      #tCtx.show{opacity:.95;transform:scale(1);pointer-events:auto}
      #tCtx.on{transform:scale(.92)}
      #tCtx b{position:absolute;right:-2px;bottom:-2px;font:700 12px/1 system-ui,sans-serif;color:#1b140c;background:#ffe3a1;border-radius:6px;padding:2px 4px}
      #tCtxHint{position:absolute;z-index:31;max-width:220px;font:600 13px/1.25 system-ui,sans-serif;color:#fff;background:rgba(20,16,12,.85);border:1px solid rgba(255,214,140,.6);
      border-radius:8px;padding:6px 9px;opacity:0;transition:opacity .3s;pointer-events:none}
      #tCtxHint.show{opacity:1}`;
    document.head.appendChild(st);
    const b = document.createElement('button');
    b.id = 'tCtx'; b.type = 'button'; b.tabIndex = -1; b.setAttribute('aria-label', D.tr ? D.tr('Use it') : 'Use it');
    const press = (e) => { e.preventDefault(); e.stopPropagation(); ctxPress(); CTX.taps = (CTX.taps || 0) + 1; b.classList.add('on'); };
    const up = (e) => { e.stopPropagation(); b.classList.remove('on'); };
    b.addEventListener('pointerdown', press); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
    b.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    document.getElementById('app').appendChild(b);
    const h = document.createElement('div'); h.id = 'tCtxHint'; document.getElementById('app').appendChild(h);
    UI.el = b; UI.hint = h;
    window.addEventListener('keydown', (e) => { if (e.code === CTX.key && !e.repeat && duelOn()) { ctxPress(); b.classList.add('on'); } });
    window.addEventListener('keyup', (e) => { if (e.code === CTX.key) b.classList.remove('on'); });
    window.addEventListener('resize', () => { UI.placedFor = ''; });
  }
  const touchOn = () => !!(ND.touch && ND.touch.active) && !!document.getElementById('touch') && !document.getElementById('touch').hidden;

  function uiPlace() {
    const b = UI.el, app = document.getElementById('app'), W = app.clientWidth, H = app.clientHeight;


    let lay = ''; try { lay = ND.touchUI && ND.touchUI.prefs ? JSON.stringify(ND.touchUI.prefs) : ''; } catch (e) { lay = ''; }
    const key = W + 'x' + H + (touchOn() ? 't' : 'k') + lay;
    if (UI.placedFor === key) return;
    UI.placedFor = key;
    const R = app.getBoundingClientRect();
    if (!touchOn()) { const d = 58; b.style.setProperty('--ctxd', d + 'px'); b.style.translate = `${W - d - 28}px ${H - d - 96}px`; UI.x = W - d / 2 - 28; UI.y = H - d / 2 - 96; UI.r = d / 2; return; }
    const ctl = [...document.querySelectorAll('#touch button, #touch .t-base, #pauseBtn')].filter((e) => e.offsetParent !== null && getComputedStyle(e).display !== 'none')
      .map((e) => { const r = e.getBoundingClientRect(); return { x: r.left - R.left + r.width / 2, y: r.top - R.top + r.height / 2, r: Math.max(r.width, r.height) / 2, act: e.dataset ? e.dataset.act : null }; }).filter((c) => c.r > 4);
    const acts = ctl.filter((c) => c.act);
    const tb = acts.length ? Math.min(...acts.map((c) => c.r)) * 2 : 64, d = Math.round(tb * 0.92), r = d / 2;

    const pr = document.createElement('div');
    pr.style.cssText = 'position:absolute;visibility:hidden;padding:var(--sa-t,env(safe-area-inset-top,0px)) var(--sa-r,env(safe-area-inset-right,0px)) var(--sa-b,env(safe-area-inset-bottom,0px)) var(--sa-l,env(safe-area-inset-left,0px))';
    app.appendChild(pr); const cs = getComputedStyle(pr), SA = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map((v) => parseFloat(v) || 0); pr.remove();
    const ok = (x, y) => x - r >= SA[3] + 6 && y - r >= SA[0] + 6 && x + r <= W - SA[1] - 6 && y + r <= H - SA[2] - 6 && ctl.every((c) => Math.hypot(c.x - x, c.y - y) >= c.r + r + 6);
    const light = acts.find((c) => c.act === 'light') || acts[0];
    let best = null;
    for (const c of acts) for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2, x = c.x + Math.cos(a) * (c.r + r + 8), y = c.y + Math.sin(a) * (c.r + r + 8);
      if (!ok(x, y)) continue;

      const score = (light ? Math.hypot(light.x - x, light.y - y) : 0) + (light && light.x < W / 2 ? Math.max(0, x - W * 0.45) : Math.max(0, W * 0.55 - x)) * 2;
      if (!best || score < best.s) best = { x, y, s: score };
    }
    if (!best) best = { x: W - r - 10, y: r + 60 };
    b.style.setProperty('--ctxd', d + 'px');
    b.style.translate = `${(best.x - r).toFixed(1)}px ${(best.y - r).toFixed(1)}px`;
    UI.x = best.x; UI.y = best.y; UI.r = r;
  }
  function uiHint() {
    let seen = false;
    try { seen = localStorage.getItem('sd.duel.ctxHint') === '1'; localStorage.setItem('sd.duel.ctxHint', '1'); } catch (e) { seen = UI.hinted; }
    if (seen || UI.hinted) return;
    UI.hinted = true;
    const h = UI.hint, app = document.getElementById('app');
    h.textContent = touchOn() || !D.tr || (ND.i18n && ND.i18n.lang !== 'en') ? (D.tr ? D.tr('Something to use is in reach: tap this button.') : 'Something to use is in reach: tap this button.') + (touchOn() ? '' : ` (${KEYNAME})`) : `Something to use is in reach: press ${KEYNAME}.`;
    h.style.left = Math.max(8, Math.min(app.clientWidth - 230, (UI.x || 0) - 200)) + 'px';
    h.style.top = Math.max(8, (UI.y || 0) - (UI.r || 30) - 46) + 'px';
    h.classList.add('show');
    setTimeout(() => h.classList.remove('show'), 3800);
  }

  function uiUpdate() {
    if (!UI.el) uiBuild();
    if (!UI.el) return;
    const f = (G.F || []).find((q) => q && q.dz && human(q));
    let e = null;
    if (f && P.live && G.phase === 'fight' && !G.paused && !f.dead && (free(f) || P.held(f))) {
      const hold = (f.ctrl && f.ctrl.axis ? f.ctrl.axis() : 0) * (Math.sign(f.opp.x - f.x) || f.dir);
      e = ctxPick(f, hold > 0 ? 1 : hold < 0 ? -1 : 0);
    }
    if (!e && CTX.force) e = { icon: CTX.force === true ? 'stool' : CTX.force };
    const on = !!e;
    if (on) { uiPlace(); if (UI.ic !== e.icon) { UI.ic = e.icon; UI.el.innerHTML = (ICONS[e.icon] || ICONS.barrel) + (touchOn() ? '' : `<b>${KEYNAME}</b>`); } }
    if (on !== UI.on) { UI.on = on; UI.el.classList.toggle('show', on); if (on && !CTX.force) uiHint(); }
  }
  D.envUi = { icons: ICONS, update: () => uiUpdate(), place: () => { UI.placedFor = ''; uiPlace(); }, state: () => ({ on: UI.on, x: UI.x, y: UI.y, r: UI.r, ic: UI.ic, t: CTX.shownT || 0 }) };


  const duelOn = () => !!(G.F && G.F[0] && G.F[0].dz && (G.phase === 'fight' || G.phase === 'ko' || G.phase === 'intro'));

  const SC = ND.scene;
  if (SC && SC.drawFront) {
    const df0 = SC.drawFront;
    const fgLayer = (sc, ctx) => {
      const th = sc.theme;
      cam.layer(ctx, 1.45);
      if (th.fg) { ctx.save(); sc['fg_' + th.fg](ctx); ctx.restore(); return; }
      for (const b of sc.fgBamboo) {
        const sway = Math.sin(sc.t * 0.5 + b.p) * 6;
        ctx.strokeStyle = th.fgC; ctx.lineWidth = b.w;
        ctx.beginPath(); ctx.moveTo(b.x, 400); ctx.lineTo(b.x + sway, -900); ctx.stroke();
        ctx.fillStyle = th.fgC;
        for (let y = -40; y > -900; y -= 110) ctx.fillRect(b.x + sway * (-y / 900) - b.w * 0.7, y, b.w * 1.4, 5);
      }
    };
    SC.drawFront = function (ctx) {
      if (!duelOn() || D.fgHidden) return D.fgHidden ? this.drawFrontNoFg(ctx) : df0.call(this, ctx);
      const th = this.theme, F = G.F;
      this.drawMotes(ctx);
      this.drawWeather(ctx, true);
      let a = Infinity, b = -Infinity;
      for (const f of F) { const x = cam.sx(f.x); a = Math.min(a, x); b = Math.max(b, x); }
      const m = 90 * cam.k;
      a -= m; b += m;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath(); ctx.rect(0, 0, Math.max(0, a), cam.H); ctx.rect(b, 0, Math.max(0, cam.W - b), cam.H); ctx.clip();
      fgLayer(this, ctx);
      ctx.restore();
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath(); ctx.rect(a, 0, Math.max(0, b - a), cam.H); ctx.clip();
      ctx.globalAlpha = 0.15;
      fgLayer(this, ctx);
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (!this.lowTier()) { this.drawFrontStill(ctx, true); return; }
      if (th.weather === 'rain' && this.flashL > 0) { ctx.fillStyle = `rgba(210,225,255,${this.flashL * 0.18})`; ctx.fillRect(0, 0, cam.W, cam.H); }
    };

    SC.drawFrontNoFg = function (ctx) {
      const th = this.theme;
      this.drawMotes(ctx); this.drawWeather(ctx, true);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (!this.lowTier()) { this.drawFrontStill(ctx, true); return; }
      if (th.weather === 'rain' && this.flashL > 0) { ctx.fillStyle = `rgba(210,225,255,${this.flashL * 0.18})`; ctx.fillRect(0, 0, cam.W, cam.H); }
    };
  }


  {
    const fol0 = cam.follow;
    cam.follow = function (dt, fa, fb, focus) {
      if (focus || !duelOn() || !fa || !fb) return fol0.apply(this, arguments);
      const keep = ND.ARENA;
      ND.ARENA = keep + 2000;
      try { return fol0.apply(this, arguments); } finally { ND.ARENA = keep; }
    };
  }
})(window.ND);
