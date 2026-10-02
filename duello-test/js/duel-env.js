// Shadow Duel — DUEL PROTOTYPE environment (?duel=1 only; js/props.js): the arena as a film set the normal duel uses
// all the time. The moonlit temple / bamboo arena is a row of STATIONS, each with its own attack, defence and movement:
//   shrine steps (raised deck)   leap from the steps: a downward cut onto the opponent below
//   barrel, straw bale, stools   vault over them (a flying kick when the opponent is just beyond); kick them at him
//   wooden posts (torii pillars) swing round the post into a kick · the attacker's blade bites the post (STUCK) while the
//                                defender slips behind it and kicks back
//   stone lantern (paper)        cut it down onto the opponent
//   tea table (cups, sake)       flip it up into the opponent · kick him through it (it breaks) · cups / bottle smashed
//                                or thrown (props module)
//   weapon rack                  a spare sword after a disarm (props module)
//   the arena's edges (bamboo / fence)   wall kick: off the wall, flying kick back in
// The same buttons as ever (no new controls): near a station, jump / attack / heavy / guard / kick / throw do its
// version (contextual). The CPU reaches for the set every 1.5–3 s, preferring what it has not just done.
// Everything is the fight's deterministic state (fighter fields, f.dz.env, the props module's items, G.flags.envSlots
// for the set's refills), the fight's RNG; sounds, sparks, labels and the drawing are presentation. The normal game
// never loads this file.
(function (ND) {
  'use strict';
  const FLAG = (() => { try { return /[?&]duel=\d/.test(location.search || ''); } catch (e) { return false; } })();
  if (!FLAG || !ND.duel || !ND.props) return;
  const Math = ND.DM || globalThis.Math;
  const D = ND.duel, P = ND.props, G = ND.game, PO = ND.POSES, pose = ND.pose, fx = ND.fx, au = ND.audio, cam = ND.cam, E = ND.M.ease;
  const KINDS = P.KINDS, S = P.S;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const pk = (n) => PO[n] || PO.stance;
  const mod = (n, o) => Object.assign(pose.copy(pk(n)), o);

  // ------------------------------------------------------------------ the set (left to right)
  // [kind, x, floor depth, extra]; on: index of the prop it stands on
  const TEMPLE = [['burner', -860, -18], ['veranda', -650, -12], ['barrel', -470, -10], ['post', -400, -6], ['stool', -290, -4],
    ['crate', -175, -12], ['lantern', -60, -10], ['jar', 50, -6], ['stool', 140, -2], ['table', 250, -8], ['cup', 232, 0, { on: 9 }],
    ['cup', 256, 0, { on: 9 }], ['bottle', 282, 0, { on: 9 }], ['post', 400, -6], ['bale', 510, -6], ['lantern', 610, -12], ['bucket', 690, -4],
    ['rack', 790, -20]];
  P.ARENA_SETS.temple = TEMPLE;
  // (the CPU's use of the set is this file's: the props module's own CPU timer walked it off to a prop every few
  // seconds whatever the fight was doing, and a fighter on a walk cannot guard)
  const enable0 = P.enable;
  P.enable = function () { const r = enable0.apply(this, arguments); if (P.setCpu) P.setCpu(false); return r; };
  if (P.live && P.setCpu) P.setCpu(false);
  // the table is a weapon when it flies (flipped into the opponent)
  if (KINDS.table && !KINDS.table.weapon) KINDS.table.weapon = { dmg: 16, stun: 0.6, kb: 360, knock: 1, post: 40 };

  // ------------------------------------------------------------------ the set refills (always something at hand)
  // a prop of the set that is broken (or gone) comes back at its place 5 s later, when nobody stands on the spot
  const REFILL = 3.5;
  function slotsFor(arena) { return arena === 'temple' ? TEMPLE : null; }
  // (the slots live in G.flags, which the round start empties right after the set is put back: they are taken at the
  // round's first step, while the set still stands as placed, each slot the prop of the same index and kind)
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
      if (on && (!sup || sup.st !== 0)) continue; // (a cup waits for its table)
      const q = P.spawn(e[0], e[1], { gz: e[2], on: sup ? sup.id : null, fx: x.fx });
      if (q) { s[1] = q.id; s[2] = 0; }
    }
  }

  // ------------------------------------------------------------------ helpers
  const isCpu = (f) => !!(G.ais && G.ais.some((a) => a && a.me === f));
  const human = (f) => !!(G.isHuman && G.isHuman(f));
  const rnd = () => ND.rng.next();
  const free = (f) => !f.dead && f.onGround && f.y > -1 && (f.state === 'move' || f.state === 'guard' || f.state === 'land' || f.state === 'zanshin');
  const armed = (f) => !!(f.dz && f.dz.armed !== false && !(f.wpn && (f.wpn.fist || f.wpn.none)));
  const topOf = (p) => { const K = KINDS[p.k]; return K.top || K.h * 0.85; };
  // the nearest standing prop that passes test, within maxD
  function near(f, test, maxD) {
    let best = null, bd = maxD;
    for (const p of S.items) { if (p.st !== 0 || !test(p)) continue; const d = Math.abs(p.x - f.x); if (d <= bd) { bd = d; best = p; } }
    return best;
  }
  const ahead = (f, p) => (p.x - f.x) * f.dir > 0;
  const VAULT = { table: 1, stool: 1, barrel: 1, bale: 1, crate: 1, bucket: 1, jar: 1 };
  const STATION = { table: 1, stool: 1, barrel: 1, bale: 1, post: 1, lantern: 1, veranda: 1, bucket: 1, jar: 1, rack: 0 };
  // a blow of the environment: blocked by a guard facing it, else the fight's own hit
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

  // ------------------------------------------------------------------ the actions ('denv': a short scripted move)
  // each: dur, setup(f, c, prop) → c.X / c.Y (tracks [t, value]), c.keys (pose keyframes), c.ev ([t, fn] events),
  // facing (c.face 'opp' / 'post' or c.dirs [t, dir]); air: [t0, t1] the airborne part (not hittable)
  const ACT = {};
  function track(K, t) {
    if (t <= K[0][0]) return K[0][1];
    for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const a = K[i - 1], b = K[i], u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]); return a[1] + (b[1] - a[1]) * E.inOutSine(u); }
    return K[K.length - 1][1];
  }
  // vault over a prop (table, stool, barrel, bale …): a flying kick when the opponent is just beyond the landing
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
  // flip the table up into the opponent (it flies: the props module's flying prop hits him)
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
        for (const q of S.items) if (q.sup === t.id && q.st === 0) { q.sup = -1; q.st = 1; q.vy = -260; q.vx = f.dir * 120; } // (what was on it flies too)
        t.st = 1; t.sl = 0; t.vy = -540; t.vx = f.dir * 330; t.w = f.dir * 11; t.owner = f.id; t.tt = 0; t.hitF = -1;
        au.thud(1.1, f.pan); fx.dust(t.x, 0, 10, 1.2); cam.punch(6);
      }]];
      label(f, 'Table flip');
    },
  };
  // swing round a post into a kick
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
  // cut the lantern down onto the opponent
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
  // off the wall: a flying kick back in
  ACT.wall = {
    dur: 0.82, air: [0.12, 0.72], kickWin: [0.42, 0.74],
    setup(f, c) {
      const w = Math.sign(f.x) || 1, o = f.opp, A = ND.ARENA;
      const x1 = clamp(o.x + w * 70, -A + 20, A - 20);
      c.X = [[0, f.x], [0.24, w * (A - 14)], [0.3, w * (A - 18)], [0.6, o.x + w * 80], [0.82, x1]];
      c.Y = [[0, 0], [0.24, -120], [0.3, -118], [0.46, -96], [0.72, 0], [0.82, 0]];
      c.keys = [[0, f.entry], [0.16, pk('jump'), E.inOutSine], [0.28, mod('ua_airA', { lean: -0.5 }), E.inOut], [0.48, mod('ua_airB', { f1x: 96, f1y: -36, lean: -0.3 }), E.outQuart],
        [0.72, pk('land'), E.outCubic], [0.82, f.P.stance, E.inOut]];
      c.dirs = [[0, w], [0.3, -w]]; // (faces the wall on the way up, the opponent on the way back)
      c.ev = [[0.27, (f) => { fx.dust(f.x + Math.sign(f.x) * 10, f.y - 60, 6, 0.8); au.thud(0.7, f.pan); }],
        [0.5, (f) => { if (Math.abs(f.opp.x - f.x) < 150) strike(f, f.opp, { dmg: 16, post: 28, kb: 420, stun: 0.6, kind: 'kick', knock: true }, (f.x + f.opp.x) / 2, f.y - 90); }]];
      label(f, 'Off the wall');
    },
  };
  // from the shrine steps: up onto the deck, then a leaping downward cut
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
  // the blade bites the post: the defender slips behind it (defender's action) …
  ACT.dodgePost = {
    dur: 1.0, kickWin: [0.6, 0.86],
    setup(f, c, p) {
      const s = Math.sign(p.x - f.opp.x) || -f.dir; // (the far side of the post from the attacker)
      c.X = [[0, f.x], [0.18, p.x + s * 30], [0.6, p.x + s * 30], [0.75, p.x + s * 24], [1.0, p.x + s * 30]];
      c.keys = [[0, f.entry], [0.16, mod('ua_sweepA', { hy: -44, lean: 0.55 }), E.outCubic], [0.5, mod('ua_sweepA', { hy: -44, lean: 0.55 })],
        [0.62, pk('ua_frontA'), E.inOutSine], [0.72, mod('ua_frontB', { f1x: 90, f1y: -40 }), E.outQuart], [1.0, f.P.stance, E.inOut]];
      c.face = 'opp';
      c.ev = [[0.72, (f) => { if (Math.abs(f.opp.x - f.x) < 155) strike(f, f.opp, { dmg: 14, post: 24, kb: 320, stun: 0.6, kind: 'kick', knock: true }, (f.x + f.opp.x) / 2, f.y - 100); }]];
      label(f, 'Blade stuck in the post!');
    },
  };
  // … and the attacker's cut is caught in the wood: tugging at the hilt
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
  // spilled sake / water underfoot: the feet go, down on the back (then the fight's own down and get-up)
  ACT.slip = {
    dur: 0.5, kickWin: [0, 0.5], // (the feet go up: not into him)
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

  // ------------------------------------------------------------------ the 'denv' state
  const FP = ND.Fighter.prototype, upd0 = FP.update, inv0 = FP.isInv, pass0 = FP.passing;
  FP.update = function (dt) {
    // the player's buttons near a station: read before the fighter's own update would start the ordinary move
    // (the CPU's own presses too: when its eye for the set is ready, a press by a station does that station's move)
    if (this.dz && P.live && this.state !== 'denv' && (human(this) || (isCpu(this) && !(this.dz.envCd > 0)))) contextual(this);
    if (this.dz && this.dz.envRep > 0) this.dz.envRep -= dt; // (the player: the same station move not straight again)
    const c = this.dz && this.state === 'denv' ? this.dz.env : null;
    if (!c) return upd0.call(this, dt);
    upd0.call(this, dt);
    if (this.dead || this.state !== 'denv') { if (this.dz) this.dz.env = null; return; }
    const A = ACT[c.a];
    c.t += dt;
    const t = c.t, o = this.opp;
    while (c.evi < c.ev.length && t >= c.ev[c.evi][0]) { const e = c.ev[c.evi++]; e[1](this, c); }
    if (this.state !== 'denv') return; // (an event ended it)
    if (c.keys) pose.seq(c.keys, Math.min(t, A.dur), this.pose);
    const x0 = this.x;
    if (c.X) this.x = clamp(track(c.X, t), -ND.ARENA, ND.ARENA);
    // (a kick lands from a leg's length off: the foot meets the body, it does not go into it)
    if (A.kickWin && t > A.kickWin[0] && t < A.kickWin[1] && o && !o.dead && Math.abs(o.x - this.x) < KICK_SEP && (c.a !== 'vault' || c.kick)) {
      const sd = Math.sign(this.x - o.x) || -this.dir || -1;
      this.x = clamp(o.x + sd * KICK_SEP, -ND.ARENA, ND.ARENA);
    }
    const y = c.Y ? track(c.Y, t) : 0;
    // (vx: the track's own speed - the spacing lets the one who moves give way; physics adds nothing: x is set here)
    this.y = y; this.vx = dt > 0 ? (this.x - x0) / dt : 0; this.vy = 0; this.onGround = y > -1 && !(A.air && t > A.air[0] && t < A.air[1]);
    if (c.dirs) { for (const d of c.dirs) if (t >= d[0]) this.dir = d[1]; }
    else if (c.face === 'opp' && o) this.dir = o.x >= this.x ? 1 : -1;
    else if (c.face === 'post') { const q = P.get(c.pid); if (q) this.dir = q.x >= this.x ? 1 : -1; }
    if (t >= A.dur) { this.dz.env = null; this.dz.envRep = 1.5; this.y = 0; this.vx = 0; this.onGround = true; this.setState('move'); }
  };
  FP.isInv = function () {
    const c = this.dz && this.state === 'denv' ? this.dz.env : null;
    // (untouchable only at the top of the air part: the take-off and the landing can be caught)
    if (c) { const A = ACT[c.a]; if (A.air) { const m = (A.air[1] - A.air[0]) / 3; if (c.t > A.air[0] + m && c.t < A.air[1] - m) return true; } }
    return inv0.call(this);
  };
  FP.passing = function () { const c = this.dz && this.state === 'denv' ? this.dz.env : null; return !!(c && (c.a === 'vault' || c.a === 'wall' || c.a === 'steps')) || pass0.call(this); };

  // ------------------------------------------------------------------ what a fighter can do here, now
  // [name, prop, weight]
  function options(f) {
    const o = f.opp, out = [], A = ND.ARENA;
    if (!o || o.dead) return out;
    const dist = Math.abs(o.x - f.x), toward = Math.sign(o.x - f.x) || f.dir;
    // vault: a vaultable prop between me and him, close ahead
    const v = near(f, (p) => VAULT[p.k] && (p.x - f.x) * toward > 20, 190);
    if (v && dist > 90) out.push(['vault', v, 2]);
    // flip the table: the table right ahead, him beyond it
    // (him clear of it: the table must be seen flying, not flipped up under his feet)
    const tb = near(f, (p) => p.k === 'table' && (p.x - f.x) * toward > 20 && (o.x - p.x) * toward > KINDS.table.w / 2 + 40, 230);
    if (tb && dist < 440) out.push(['flip', tb, 4]);
    // round the post into a kick
    const ps = near(f, (p) => p.k === 'post', 130);
    if (ps && dist < 300 && dist > 60) out.push(['swing', ps, 2]);
    // the lantern over his head
    const ln = near(f, (p) => p.k === 'lantern' && Math.abs(o.x - p.x) < 150, 200);
    if (ln && armed(f)) out.push(['lantern', ln, 6]);
    // off the wall: my back to it, him in front
    if (Math.abs(f.x) > A - 200 && (o.x - f.x) * Math.sign(f.x) < 0 && dist < 340 && dist > 70) out.push(['wall', null, 2.5]);
    // from the steps
    const st = near(f, (p) => p.k === 'veranda', 220);
    if (st && dist < 360 && dist > 120 && Math.abs(o.x - st.x) > KINDS.veranda.w / 2 - 10) out.push(['steps', st, 2.5]);
    return out;
  }
  // the props module's own uses (kick a prop at him, pick up / use, the front kick onto the table, the rack)
  function propOptions(f) {
    const o = f.opp, out = [];
    if (!o || o.dead) return out;
    const dist = Math.abs(o.x - f.x);
    if (f.wpn && f.wpn.none) { const r = P.nearest(f, 'rack', 700); if (r) out.push(['p:rearm', r.p, 4]); }
    const away = Math.sign(o.x - f.x) || f.dir;
    if (dist < 118) {
      // (the table first: onto it, through it)
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
    if (kk) out.push(['p:kick', kk.p, 3]); // (from range: a prop kicked at him costs no opening)
    const cc = P.nearest(f, (p) => KINDS[p.k].carry && p.st === 0, 260);
    if (cc && !P.held(f)) out.push(['p:grab', cc.p, dist > 170 ? 2.5 : 1]);
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

  // ------------------------------------------------------------------ the CPU's eye for the set
  const ENV = D.env2 = { gap: [0.8, 1.8], st: {} }; // (st: station moves started / landed, by name, for the audits)
  function pairBite(d, a, p) {
    if (!start(d, 'dodgePost', p)) return false;
    start(a, 'stuck', p);
    return true;
  }
  function think(f, h) {
    const z = f.dz;
    if (!z || f.dead || !isCpu(f) || G.phase !== 'fight') return;
    z.envCd = (z.envCd == null ? 1.2 : z.envCd) - h;
    // the post's trick is a reaction: his cut is coming and I stand by a post
    const o = f.opp;
    if (o && !o.dead && o.state === 'atk' && o.atk && o.atk.kind === 'blade' && o.atk.active && o.st < o.atk.active[0] - 0.05 && armed(o) && free(f) && !S.tasks[f.id]) {
      const ps = near(f, (p) => p.k === 'post', 100);
      if (ps && Math.abs(o.x - f.x) < 180 && rnd() < h * 14) { pairBite(f, o, ps); return; }
    }
    // a prop in hand: use it (the props module's own CPU walks off to props on a timer - a time sink: off, see enable)
    const held = P.held(f);
    if (held && free(f) && !S.tasks[f.id]) {
      const K = KINDS[held.k], dist = Math.abs(o.x - f.x);
      z.envHeld = (z.envHeld || 0) + h;
      if (dist < 130 && o.state !== 'atk' && rnd() < h * 4) { if (P.act(f, K.swing ? 'swing' : 'smash')) z.envHeld = 0; }
      else if (K.throw && ((dist > 200 && dist < 560 && rnd() < h * 1.2) || z.envHeld > 4)) { if (P.act(f, 'throw')) z.envHeld = 0; }
      return;
    }
    if (z.envCd > 0) return;
    const db = ENV.dbg; if (db) { db.look++; if (S.tasks[f.id]) db.task++; else if (!free(f)) { db.busy++; db.st[f.state] = (db.st[f.state] || 0) + 1; } else if (P.held(f)) db.held++; }
    // (an attack it has only just begun counts as free: the station's move takes its place)
    // (from a free stance, or a plain blow only just begun: given up for a station move only when that pays - choose
    // keeps what good() allows: an opening, or room)
    const starting = f.state === 'atk' && f.st < 0.08 && f.onGround && f.atk && !f.atk.special && !f.atk.prop && !/^pr_/.test(f.atkName || '');
    if (S.tasks[f.id] || !(free(f) || starting) || P.held(f) || z.cine) return;
    if (choose(f)) return;
    z.envCd = 0.25; // (nothing at hand: look again soon)
    {
      // nothing in reach: now and then walk over to the nearest station (the set is there to be used)
      if (Math.abs(o.x - f.x) > 300 && rnd() < 0.35) {
        const recent = (z.envR || '') + ',' + (z.envGoK || '');
        // (the table above all: him beyond it, I go to it and it comes over at him)
        const toward = Math.sign(o.x - f.x) || f.dir;
        const tb = recent.indexOf('flip') < 0 && near(f, (p) => p.k === 'table' && (p.x - f.x) * toward > 60 && (o.x - p.x) * toward > -30 && Math.abs(o.x - p.x) < 300, 460);
        if (tb && rnd() < 0.7 && P.go(f, tb, 'none')) { z.envGoK = 'table'; z.envCd = 0.2; return; }
        // (a station near him: when I get there, it is in play)
        // (only one on the way to him: walking off from him to a station is the time the set must not cost)
        const way = (p) => STATION[p.k] && (p.x - f.x) * toward > 90 && Math.abs(p.x - o.x) < 260;
        const st = Math.abs(o.x - f.x) > 420 ? null : near(f, (p) => way(p) && recent.indexOf(p.k) < 0, 480) || near(f, way, 480);
        if (st) z.envGoK = st.k;
        if (st && P.go(f, st, 'none')) z.envCd = 0.2;
      }
      return;
    }
  }
  // the CPU's pick among what is at hand: never the same trick twice in a row, seldom the one before, what it has done
  // lately counts little (the set is used all over, not one trick again and again). true if it started one
  // the CPU takes a station only when it pays: its blow will reach him from where the move ends (he stays where he is)
  // and his own blow is not about to land on me while I set it up (a station move is a real attack, not a pause)
  function good(f, e) {
    const o = f.opp, name = e[0], p = e[1], dist = Math.abs(o.x - f.x);
    if (o.state === 'atk' && o.atk && o.atk.active && o.st < o.atk.active[1] && dist < 190) return false;
    if (name === 'p:grab' || name === 'p:rearm') return name === 'p:rearm' || (dist > 160 && dist < 420); // (picking up: while he is down is the time)
    if (name === 'p:kick') return Math.abs(o.x - p.x) < 280 && (o.x - p.x) * (p.x - f.x) > 0 && dist > 90; // (a quick kick from behind the prop)
    // (nothing to hit: him on the floor, getting up, rolling, dodging or untouchable - the blow would land on nothing)
    if (o.dead || o.state === 'down' || o.state === 'getup' || o.state === 'launch' || o.state === 'droll' || o.state === 'dodge' || (o.isInv && o.isInv())) return false;
    // (close in, never: a set piece started under his nose gets cut - in 60-match tests every close-range use cost the
    // CPU more than it won; the set is used from room: kicked props, the wall, the steps, the post when he swings)
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
    z.envCd = ENV.gap[0] + rnd() * (ENV.gap[1] - ENV.gap[0]);
    return true;
  }

  // ------------------------------------------------------------------ the player: the same buttons, near a station
  const KEYS = ['up', 'light', 'heavy', 'guard', 'kick', 'throw'];
  function contextual(f) {
    const z = f.dz, b = f.ctrl && f.ctrl.buf;
    if (!z || !b || f.dead || G.phase !== 'fight') return;
    const seen = z.envPb || (z.envPb = {});
    const fresh = {};
    for (const k of KEYS) { const v = b[k]; if (v != null && v !== seen[k]) fresh[k] = true; seen[k] = v == null ? null : v; }
    if (ENV.dbg && !human(f) && (fresh.light || fresh.heavy || fresh.kick)) { ENV.dbg.cpuFresh = (ENV.dbg.cpuFresh || 0) + 1; if (!free(f)) { ENV.dbg.cpuFreshBusy = (ENV.dbg.cpuFreshBusy || 0) + 1; ENV.dbg.fs = ENV.dbg.fs || {}; ENV.dbg.fs[f.state] = (ENV.dbg.fs[f.state] || 0) + 1; } }
    if (!free(f) || S.tasks[f.id] || z.cine) return;
    const o = f.opp, held = P.held(f);
    if (!o || o.dead) return;
    // the CPU: an attack it was about to make, by a station, becomes that station's move (its own pick, as in think)
    if (!human(f)) {
      if (held || !(fresh.light || fresh.heavy || fresh.kick)) return;
      if (ENV.dbg) ENV.dbg.cpuPress = (ENV.dbg.cpuPress || 0) + 1;
      if (choose(f)) { for (const k of ['light', 'heavy', 'kick']) { b[k] = null; seen[k] = null; } }
      return;
    }
    const use = (k) => { b[k] = null; seen[k] = null; if (!human(f)) z.envCd = ENV.gap[0] + rnd() * (ENV.gap[1] - ENV.gap[0]); };
    if (held) {
      if (fresh.throw && KINDS[held.k].throw) { if (P.act(f, 'throw')) use('throw'); return; }
      if (fresh.light && Math.abs(o.x - f.x) < 140) { if (P.act(f, KINDS[held.k].swing ? 'swing' : 'smash')) use('light'); }
      return;
    }
    if (fresh.guard && o.state === 'atk' && o.atk && o.atk.kind === 'blade' && o.atk.active && o.st < o.atk.active[0] && armed(o)) {
      const ps = near(f, (p) => p.k === 'post', 90);
      if (ps && Math.abs(o.x - f.x) < 180) { if (pairBite(f, o, ps)) use('guard'); return; }
    }
    // (the player's reach is tighter than the CPU's look-around: a press means the station right here)
    const again = (n) => z.envRep > 0 && z.envLast === n; // (mashing one button by a post: one turn round it, then the ordinary move)
    const L = options(f).filter((e) => !again(e[0])).filter((e) => !e[1] || Math.abs(e[1].x - f.x) <= (e[0] === 'steps' ? 150 : e[0] === 'vault' ? 120 : 90)), has = (n) => L.find((e) => e[0] === n);
    let e = null, k = null;
    if (fresh.up) { e = has('vault') || has('wall') || has('steps'); k = 'up'; }
    if (!e && fresh.heavy) { e = has('flip') || has('lantern'); k = 'heavy'; }
    if (!e && fresh.light) { e = has('swing') || has('lantern'); k = 'light'; }
    if (e) { if (start(f, e[0], e[1])) use(k); return; }
    if (fresh.kick) {
      const kk = near(f, (p) => KINDS[p.k].kick && !KINDS[p.k].fixed && ahead(f, p), 85);
      if (kk && P.act(f, 'kick', kk)) { use('kick'); return; }
      const ps = near(f, (p) => p.k === 'post', 70);
      if (ps && !again('swing') && Math.abs(o.x - f.x) < 230 && start(f, 'swing', ps)) { use('kick'); return; }
      const sh = propOptions(f).find((q) => q[0] === 'p:shove');
      if (sh && P.act(f, 'shove', sh[1])) { use('kick'); return; }
    }
    if (fresh.throw) {
      const cc = near(f, (p) => KINDS[p.k].carry, 75);
      if (cc && P.act(f, 'grab', cc)) use('throw');
    }
  }

  // ------------------------------------------------------------------ spilled sake / water: a slip
  // A broken bottle, cup, jar, barrel or bucket leaves a puddle (G.flags.envSpill: [x, life,
  // liquid]) for 6 s; the first player who runs across it slips (once per puddle, once a round; the CPU steps round).
  // (found in the step itself, not through the props module's events: those only fire on drawn steps)
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
      if (sp[1] > 5.6 || sp[3] || G.phase !== 'fight') continue; // (it spreads first; one slip a pool - it stays to be seen)
      for (const f of F) {
        const z = f.dz;
        if (!z || f.dead || f.state !== 'move' || !f.onGround || Math.abs(f.vx) < 170 || Math.abs(f.x - sp[0]) > 22 || z.envSlipT > 0 || z.envSlips || isCpu(f)) continue; // (the CPU sees the pool and steps round it)
        z.envLiq = sp[2]; z.envSlipT = 4; z.envSlips = 1; // (once a round: a gag, not a trap)
        if (start(f, 'slip', null)) { sp[3] = 1; break; }
      }
    }
    for (const f of F) if (f.dz && f.dz.envSlipT > 0) f.dz.envSlipT -= h;
  }

  // ------------------------------------------------------------------ spacing: two bodies never in one place
  // The duel's own push-box (game.separate in duel mode; the normal game keeps its own). Outside a bind, a clinch, the
  // showpiece or a cinematic the fight never has the two closer than SEP: a dash, dodge, roll, riposte that would carry
  // one through the other stops short on its own side. Sides change only by going over (one clear over the other's
  // head) or by a special made to cut through (its cross; never within THRU). A body knocked down lies DOWN_SEP off the
  // other (it slides on, the other stays); a launched body is kept LAUNCH_SEP off, a body in the air ABOVE_SEP off when
  // it is above the other, AIR_SEP otherwise; a kick lands from KICK_SEP (the foot meets the body, it does not go in).
  // Each fighter's side is fight state (f.dz.side).
  const KICK_SEP = 78, FOOT_SEP = 56; // (a station kick / a roll: a leg's length; a fight kick: close enough to land)
  const SEP = 40, DOWN_SEP = 50, LAUNCH_SEP = 60, AIR_SEP = 72, OVER = 175, ABOVE = 40, ABOVE_SEP = 100;
  const held = (f) => f.state === 'lock' || f.state === 'dbind' || f.state === 'dseq' || !!(f.dz && f.dz.cine);
  const lying = (f) => f.state === 'down' || f.state === 'getup' || (f.state === 'launch' && f.onGround);
  const placeApart = (a, b, s, gap, wa) => {
    const A = ND.ARENA, d = b.x - a.x, push = gap - d * s;
    if (push <= 0) return;
    a.x -= s * push * wa; b.x += s * push * (1 - wa);
    if (Math.abs(a.x) > A) { const o = Math.abs(a.x) - A; a.x = Math.sign(a.x) * A; b.x += s * o; }
    if (Math.abs(b.x) > A) { const o = Math.abs(b.x) - A; b.x = Math.sign(b.x) * A; a.x -= s * o; }
  };
  // (a special made to go through - its cross - goes through, but never stands in the other: |dx| >= THRU)
  const THRU = 36;
  const through = (f) => f.passing && f.passing() && f.state === 'atk' && f.atk && f.atk.cross;
  function spacing(g, a, b) {
    const za = a.dz, d = b.x - a.x;
    const side = za.side || Math.sign(d) || a.dir || 1;
    if (g.lock || held(a) || held(b) || (a.dead && b.dead)) { if (d) za.side = Math.sign(d); return; }
    // (the one cut down falls where he stands: the other is not drawn inside him - it stops short, or a special that
    // cuts through goes on past)
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
    const after = () => { if (b.x !== a.x) za.side = Math.sign(b.x - a.x); };
    // a body on the floor: never under the other's feet, whoever is in the air over it (the lying one slides on)
    // (and a body coming down over it - thrown, jumping, off the steps - gives way itself: it does not land on him)
    if (la !== lb) {
      const up = la ? b : a, inAir = !up.onGround && up.y < -20;
      const gap = inAir ? Math.max(DOWN_SEP, up.state === 'launch' ? LAUNCH_SEP : AIR_SEP) : DOWN_SEP;
      placeApart(a, b, over ? Math.sign(d) || side : side, gap, inAir ? (up === a ? 1 : 0) : la ? 1 : 0);
      return after();
    }
    if (over) {
      // (round the other, over: the side may change; a launched body is still not stacked on the other's x)
      const L = a.state === 'launch' && !a.onGround ? a : b.state === 'launch' && !b.onGround ? b : null;
      if (L && Math.abs(d) < LAUNCH_SEP) placeApart(a, b, Math.sign(d) || side, LAUNCH_SEP, L === a ? 1 : 0);
      return after();
    }
    const ta = through(a), tb = through(b), Lx = (a.state === 'launch' && !a.onGround) || (b.state === 'launch' && !b.onGround);
    if ((ta || tb) && !Lx) {
      if (Math.abs(d) < THRU) {
        // (the one going through is past the other at once, on the side it is heading to)
        // (no room past him - he is against the wall: it stops short instead)
        const m = ta ? a : b, o = m === a ? b : a, h = Math.sign(m.vx) || m.dir || 1, A = ND.ARENA, past = o.x + h * THRU;
        m.x = Math.abs(past) <= A ? past : Math.max(-A, Math.min(A, o.x - h * THRU));
      }
      return after();
    }
    // on the same ground: kept apart on the sides they had (a crossing is undone: it stops short)
    // (a body in the air above the other - thrown up, or coming down - keeps its flailing legs off the head under it)
    const hi = a.y < b.y - ABOVE && !a.onGround ? a : b.y < a.y - ABOVE && !b.onGround ? b : null;
    if (hi) { placeApart(a, b, side, ABOVE_SEP, hi === a ? 1 : 0); za.side = side; return; }
    // (a kick lands from a leg's length: the kicker stops there, the foot meets the body)
    const kicking = (f) => f.state === 'atk' && f.atk && f.atk.kind === 'kick' && f.atk.active && f.st > f.atk.active[0] - 0.08 && f.st < f.atk.active[1] + 0.08;
    // (and a roll tumbles a body's length: it stops a leg's length off him too)
    const kk = kicking(a) || a.state === 'droll' ? a : kicking(b) || b.state === 'droll' ? b : null;
    if (kk) { placeApart(a, b, side, kk.state === 'droll' ? KICK_SEP : FOOT_SEP, kk === a ? 1 : 0); za.side = side; return; }
    const Lg = a.state === 'launch' ? a : b.state === 'launch' ? b : null;
    // (a body in the air - a jump, an air attack, a station move over a prop or off the wall - keeps its legs off him)
    const airEnv = (f) => !f.onGround && f.y < -20 && f.state !== 'launch';
    const gap = la && lb ? DOWN_SEP : Lg ? LAUNCH_SEP : airEnv(a) || airEnv(b) ? AIR_SEP : SEP;
    // (who gives way: a launched body flies on; else the one moving - the dash that ran in stops short, the one standing
    // there is not shoved)
    const va = Math.abs(a.vx || 0), vb = Math.abs(b.vx || 0);
    placeApart(a, b, side, gap, Lg ? (Lg === a ? 1 : 0) : va + vb > 1 ? va / (va + vb) : 0.5);
    za.side = side;
  }
  const sep0 = G.separate, SEP_OFF = /[?&]dsep=0(&|$)/.test(location.search || ''); // (?dsep=0: the old push-box, to compare)
  if (sep0 && !SEP_OFF) {
    G.separate = function () {
      const F = this.F || G.F;
      if (!F || !F[0] || !F[1] || !F[0].dz || !F[1].dz) return sep0.call(this);
      spacing(this, F[0], F[1]);
    };
    // (and once more at the end of the whole step: what moves a body after the push - a special's own placing, the
    // props, the hits - does not leave the two inside each other either)
    const up0 = G.update;
    G.update = function () {
      const r = up0.apply(this, arguments);
      const F = this.F || G.F;
      if (F && F[0] && F[1] && F[0].dz && F[1].dz && (this.phase === 'fight' || this.phase === 'ko')) spacing(this, F[0], F[1]);
      return r;
    };
  }

  // ------------------------------------------------------------------ every step (the props module's step)
  // kicked through the table: a body that comes down on it breaks it (and does not only bounce)
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
    }
    return step0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ drawing: the shrine steps (temple)
  // The temple's raised deck is the station "From the steps": the market's low veranda picture read as a dark bench, so
  // here it is drawn as a shrine platform - the deck at its true height (48, where the fighter stands), stone steps up to
  // it at both ends, posts, a red railing behind, lit edges. Drawing only: the prop and its hull are the veranda's.
  function drawShrine(ctx, p) {
    const K = KINDS[p.k], bx = p.x - K._com[0] * (p.fx || 1), by = p.y - K._com[1], hw = K.w / 2, top = K.top;
    const box = (x, y, w, h, fill, line) => { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fillStyle = fill; ctx.fill(); if (line) { ctx.strokeStyle = line; ctx.lineWidth = 1.4; ctx.stroke(); } };
    const ln = (pts, col, w) => { ctx.beginPath(); for (const q of pts) { ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); } ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
    ctx.save();
    ctx.translate(bx, by); ctx.lineJoin = 'round';
    // the red railing behind the deck (the fighters stand in front of it)
    for (let x = -hw + 6; x <= hw - 5; x += 37) box(x - 3.5, -top - 40, 7, 40, '#7d2219', '#2a0d09');
    box(-hw + 2, -top - 44, K.w - 4, 7, '#a8342a', '#2a0d09');
    box(-hw + 2, -top - 22, K.w - 4, 3.5, '#8a281f', '#2a0d09');
    ln([[-hw + 3, -top - 43.2, hw - 3, -top - 43.2]], 'rgba(255,190,150,.55)', 1.2);
    // dark under the deck, the posts down to the ground
    box(-hw, -top + 9, K.w, top - 9, 'rgba(12,8,6,.94)');
    for (const x of [-hw + 5, -hw / 2, 0, hw / 2, hw - 5]) box(x - 4.5, -top + 8, 9, top - 8, '#3a2415', '#160b05');
    // the deck: front beam, boards, a lit lip
    box(-hw - 3, -top, K.w + 6, 10, '#7a5232', '#1e1008');
    ln([[-hw - 2, -top + 0.8, hw + 2, -top + 0.8]], 'rgba(255,214,160,.7)', 1.6);
    ln([[-hw / 2, -top + 2, -hw / 2, -top + 9], [0, -top + 2, 0, -top + 9], [hw / 2, -top + 2, hw / 2, -top + 9]], 'rgba(30,16,8,.55)', 0.9);
    // stone steps at both ends: two steps up to the deck
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
  // a puddle: a thin glossy pool on the floor, sake amber or water grey-blue, gone over its last 1.5 s
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
      if (layer !== 'back' || !G.F || !G.F[0] || !G.F[0].dz) return pdraw0.call(this, ctx, layer);
      const v = S.arena === 'temple' ? S.items.filter((p) => p.k === 'veranda' && p.st === 0) : [];
      cam.world(ctx);
      for (const p of v) drawShrine(ctx, p);
      // (the market's veranda picture is left out for this one call: the deck above stands in its place)
      for (const p of v) p.st = 2;
      try { pdraw0.call(this, ctx, layer); } finally { for (const p of v) p.st = 0; }
      cam.world(ctx);
      drawSpills(ctx); // (over the broken pieces: the pool is what the slip is about)
    };
  }

  // ------------------------------------------------------------------ drawing: recorded motion in the stations
  // The mocap agent's arena clips (ND.duel.mocap.act, drawing only) play inside the station moves: each clip's action
  // part time-scaled onto the move's own window (the move's timing, position and height stay the fight's truth). The
  // clip's own rise is taken off while the fight already lifts the body (the hip follows the fight's height: the jump is
  // not counted twice). No clip yet (still loading): the hand-keyed poses.
  //   [clip, clip from, clip to, move t0, move t1, legs]
  const MCL = {
    vault: ['fRunJumpOver', 0.32, 1.26, 0, 0.7, 'air'],
    wall: ['fBackflip', 0, 0.66, 0, 0.47, 'air'],
    steps: ['fStepstoolJump', 0.3, 0.78, 0.36, 0.6, 'air'], // (then the hand-keyed overhead cut on the way down)
    vaultKick: ['fRunJumpOver', 0.32, 0.95, 0, 0.46, 'air'], // (the jump; the kick itself hand-keyed)
    slip: ['fSlipSake', 0.05, 1.25, 0, 1.25, 'down'],
  };
  const MCG = ['fStoolPick', 0.05, 0.75, 0, 0.42, null]; // (the stool picked up: the props module's pr_grab)
  const MCS = new WeakMap(), HIPS = {};
  // the clip's hip height at clip time t (sampled once, 60 a second)
  function hipAt(id, t) {
    const Mo = ND.mocap, C = Mo && Mo.clips && Mo.clips[id];
    if (!C) return null;
    let H = HIPS[id];
    if (!H) { H = HIPS[id] = []; const fr = Mo.newFrame(); for (let i = 0; i <= Math.ceil(C.dur * 60); i++) { Mo.sample(C, i / 60, fr); H.push(fr.hip[1]); } }
    const x = clamp(t * 60, 0, H.length - 1), i = Math.floor(x), u = x - i;
    return H[i] + (H[Math.min(H.length - 1, i + 1)] - H[i]) * u;
  }
  // which clip plays for f now, and where in it: { m, ct } or null
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
  // start the clip at the matching point when the move reaches its window (once per move); the lift to take off
  function mcLift(f) {
    const MD = D.mocap;
    if (!MD || !MD.ready || !MD.act) return 0;
    const n = mcNow(f), st = MCS.get(f);
    if (!n) {
      // (a move cut short - hit out of it: the clip stops with it; one that ran its window plays out and fades. The
      // slip's clip carries on through the fight's own down that follows it)
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
  // (wrapped outside the recorded-motion drawing, which loads after this file: the first prop drawing hooks it)
  let hooked = false;
  function hookMocap() {
    if (hooked || !D.mocap || !D.mocap.act) return;
    hooked = true;
    const draw1 = FP.draw;
    FP.draw = function (ctx, reflect, layer) {
      const l = reflect ? 0 : mcLift(this);
      if (!l) return draw1.call(this, ctx, reflect, layer);
      const y0 = this.y; this.y = y0 + l;
      try { return draw1.call(this, ctx, reflect, layer); } finally { this.y = y0; }
    };
    const A3 = ND.depth25;
    if (A3 && A3.snap) {
      const snap1 = A3.snap;
      A3.snap = function (f, o) {
        const l = f ? mcLift(f) : 0;
        if (!l) return snap1.call(this, f, o);
        const y0 = f.y; f.y = y0 + l;
        try { return snap1.call(this, f, o); } finally { f.y = y0; }
      };
    }
  }

  // ------------------------------------------------------------------ drawing: the set never hides the fight
  const duelOn = () => !!(G.F && G.F[0] && G.F[0].dz && (G.phase === 'fight' || G.phase === 'ko' || G.phase === 'intro'));
  // foreground poles / posts / foliage: faded to 15 % over the fighters and the space between them
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
    // (the visibility check's clean frame: the front without its foreground layer at all)
    SC.drawFrontNoFg = function (ctx) {
      const th = this.theme;
      this.drawMotes(ctx); this.drawWeather(ctx, true);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (!this.lowTier()) { this.drawFrontStill(ctx, true); return; }
      if (th.weather === 'rain' && this.flashL > 0) { ctx.fillStyle = `rgba(210,225,255,${this.flashL * 0.18})`; ctx.fillRect(0, 0, cam.W, cam.H); }
    };
  }
  // the camera keeps the fight in the middle: it follows the fighters past the arena's edge (the scenery goes on)
  // instead of stopping there with the fight pressed against the frame's side
  {
    const fol0 = cam.follow;
    cam.follow = function (dt, fa, fb, focus) {
      if (focus || !duelOn() || !fa || !fb) return fol0.apply(this, arguments);
      const keep = ND.ARENA;
      ND.ARENA = keep + 2000; // (the follow's own edge stop, out of the way)
      try { return fol0.apply(this, arguments); } finally { ND.ARENA = keep; }
    };
  }
})(window.ND);
