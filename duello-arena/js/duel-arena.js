





























(function (ND) {
  'use strict';
  const FLAG = (() => { try { return !/[?&]duel=0(&|$)/.test(location.search || ''); } catch (e) { return true; } })();
  if (!FLAG || !ND.duel || !ND.props || !ND.duel.envACT) return;
  const Math = ND.DM || globalThis.Math;
  const NM = globalThis.Math;
  const D = ND.duel, P = ND.props, G = ND.game, PO = ND.POSES, pose = ND.pose, fx = ND.fx, au = ND.audio, cam = ND.cam, E = ND.M.ease;
  const ACT = D.envACT, S = P.S, FP = ND.Fighter.prototype;
  const OFF = /[?&]ground=0(&|$)/.test(location.search || '');
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const pk = (n) => PO[n] || PO.stance;
  const mod = (n, o) => Object.assign(pose.copy(pk(n)), o);
  const isCpu = (f) => !!(G.ais && G.ais.some((a) => a && a.me === f));
  const label = (f, s) => { if (D.envLabel) D.envLabel(f, s); };
  const pres = () => !G.simOnly;
  const inEx = () => !!(D.envExchange && D.envExchange());
  const A = () => ND.ARENA;
  const rn = () => ND.rng.next();
  const armed = (f) => !!(f.dz && f.dz.armed !== false && !(f.wpn && (f.wpn.fist || f.wpn.none)));

  const DZ0 = { arKick: 0, arPoolT: 0, arPlan: -1, arPlanN: -1, arBurnT: 0, arSplatT: 0, arCd: 0 };
  {
    const rs0 = FP.reset;
    FP.reset = function () { const r = rs0.apply(this, arguments); if (this.dz) Object.assign(this.dz, DZ0); return r; };
  }

  const SCRIPTED = { denv: 1, dseq: 1, dbind: 1, lock: 1, dpick: 1, win: 1 };
  const CONTACT = { block: 1, parry: 1, clash: 1, recoil: 1, dbind: 1, lock: 1 };
  const LYING = { down: 1, getup: 1 };
  const SLIDE = { dodge: 1, recoil: 1, hurt: 1, clash: 1, block: 1, stagger: 1, gbreak: 1 };
  const movable = (f) => f && f.dz && !f.dead && !SCRIPTED[f.state] && !f.dz.cine;
  const guarding = (f, fromX) => (f.state === 'guard' || f.state === 'block' || f.state === 'parry') && (fromX - f.x) * f.dir >= 0;
  const hurtBy = (f, raw, a, by, kd) => { if (!f.dead) f.takeHit(raw, Object.assign({ kind: 'kick', blunt: true }, a), by || f.opp, f.x, f.y - 140, 'body', kd || -f.dir); };
  const chip = (f, n) => { const d = Math.min(n, f.hp - 1); if (d > 0) { f.hp -= d; f.damageTaken = (f.damageTaken || 0) + d; } };







  const DEFS = {};
  const arenaId = () => (P.live && S.arena) || null;
  const def = () => { const id = arenaId(); return id && !OFF ? DEFS[id] || null : null; };
  function ars() {
    const Fl = G.flags;
    if (!Fl) return null;
    let s = Fl.ar;
    if (!s || s.id !== S.arena) {
      const d = DEFS[S.arena];
      s = Fl.ar = { id: S.arena, t: 0, ev: null, next: 1e9, n: 0, obs: [], falls: [], shots: [] };
      if (d && d.init) d.init(s);
      if (d && d.event) s.next = d.event.first[0] + rn() * (d.event.first[1] - d.event.first[0]);
    }
    return s;
  }
  D.arenaState = ars;
  const stNow = () => (G.flags && G.flags.ar) || null;

  const OBZ = { beam: 'fire', paper: 'fire', heap: 'drift' };
  function zoneAt(d, s, x, k) {
    if (d.zones) for (const z of d.zones) if (z.k === k && x >= z.x0 && x <= z.x1) return z;
    if (s && s.obs) for (const o of s.obs) if (OBZ[o.k] === k && Math.abs(x - o.x) < o.w / 2) return o;
    return null;
  }
  const ZK = { slow: { mud: 0.62, drift: 0.66 }, slick: { puddle: 1, ice: 1, tiles: 1 } };
  const slowAt = (d, s, x) => { for (const k in ZK.slow) if (zoneAt(d, s, x, k)) return ZK.slow[k]; return 0; };
  const slickAt = (d, s, x) => { for (const k in ZK.slick) { const z = zoneAt(d, s, x, k); if (z) return z; } return null; };


  const SPRAY = [];
  function spray(x, y, dir, n, power, col) {
    if (!pres()) return;
    for (let i = 0; i < n; i++) {
      const a = -0.3 - NM.random() * 0.95, sp = (300 + NM.random() * 520) * power;
      SPRAY.push({ x: x + (NM.random() - 0.5) * 16, y: y - NM.random() * 10, vx: Math.cos(a) * sp * dir, vy: Math.sin(a) * sp, life: 0.45 + NM.random() * 0.35, r: 2.4 + NM.random() * 3.8, c: col || '225,245,250' });
    }
    if (SPRAY.length > 180) SPRAY.splice(0, SPRAY.length - 180);
  }
  const SHEETS = [];
  function drawSheets(ctx) {
    for (let i = SHEETS.length - 1; i >= 0; i--) {
      const q = SHEETS[i], k = q.t / 0.3;
      if (k >= 1) { SHEETS.splice(i, 1); continue; }
      const L = 70 + 230 * E.outCubic(k), a = 0.8 * (1 - k * k);
      ctx.save(); ctx.translate(q.x, -6); ctx.scale(q.dir, 1);
      const g = ctx.createLinearGradient(0, 0, L, 0); g.addColorStop(0, `rgba(${q.c},${a})`); g.addColorStop(1, `rgba(${q.c},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -150 * (0.6 + k * 0.4), L, -120 - 40 * k); ctx.lineTo(L, -40); ctx.quadraticCurveTo(L * 0.5, -30, 0, 0); ctx.fill();
      ctx.restore();
    }
  }
  function sprayTick(dt) {
    for (const q of SHEETS) q.t += dt;
    for (let i = SPRAY.length - 1; i >= 0; i--) {
      const p = SPRAY[i];
      p.life -= dt; p.vy += 1500 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life <= 0 || (p.y > 4 && p.vy > 0)) SPRAY.splice(i, 1);
    }
  }
  function drawSpray(ctx) {
    if (!SPRAY.length) return;
    ctx.save();
    let c = null;
    for (const p of SPRAY) {
      if (p.c !== c) { if (c) ctx.fill(); c = p.c; ctx.fillStyle = `rgba(${c},.88)`; ctx.beginPath(); }
      const r = p.r * Math.min(1, p.life / 0.25); ctx.moveTo(p.x + r, p.y); ctx.ellipse(p.x, p.y, r, r * 0.8, 0, 0, 6.283);
    }
    if (c) ctx.fill();
    ctx.restore();
  }

  const BANNER = { s: '', t: 0, x: 0, y: -330 };
  const banner = (s, x, y) => { if (!pres()) return; BANNER.s = D.tr ? D.tr(s) : s; BANNER.t = 1.8; BANNER.x = x; BANNER.y = y == null ? -320 : y; };
  function drawBanner(ctx) {
    if (!(BANNER.t > 0) || !BANNER.s) return;
    const a = Math.min(1, BANNER.t / 0.3, (1.8 - BANNER.t) / 0.15 + 0.2);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const u = Math.min(cam.W / 960, cam.H / 540);

    ctx.font = `800 ${Math.round(18 * u)}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const hw = Math.min(cam.W / 2 - 8, ctx.measureText(BANNER.s).width / 2 + 10 * u), x = clamp(cam.sx(BANNER.x), hw, cam.W - hw), y = cam.H * 0.165;
    ctx.globalAlpha = a; ctx.lineWidth = 5 * u; ctx.strokeStyle = 'rgba(8,14,18,.85)'; ctx.strokeText(BANNER.s, x, y);
    ctx.fillStyle = '#dff6ff'; ctx.fillText(BANNER.s, x, y);
    ctx.restore();
  }
  const ellipse = (ctx, x, y, rx, ry) => { ctx.moveTo(x + rx, y); ctx.ellipse(x, y, rx, ry, 0, 0, 6.283); };




  function kickAct(name, o) {
    ACT[name] = {
      dur: 0.46,
      setup(f, c) {
        f.dir = f.opp.x >= f.x ? 1 : -1;
        c.X = [[0, f.x], [0.46, f.x]];
        c.keys = [[0, f.entry], [0.1, mod('ua_frontA', { lean: 0.15 }), E.outCubic], [0.22, mod('ua_frontB', { f1x: 70, f1y: 12, lean: -0.25 }), E.outQuart], [0.32, mod('ua_frontB', { f1x: 60, f1y: 6, lean: -0.2 })], [0.46, f.P.stance, E.inOut]];
        c.ev = [[0.2, (f) => {
          const op = f.opp;
          if (pres()) { spray(f.x + f.dir * 40, 0, f.dir, 46, 1.25, o.col); spray(f.x + f.dir * 60, -10, f.dir, 24, 0.8, o.col); SHEETS.push({ x: f.x + f.dir * 36, dir: f.dir, t: 0, c: o.col }); if (P.snd) P.snd({ k: 'bucket', x: f.x }, o.snd || 'splash', 0.9); }
          if (!op || op.dead || (op.isInv && op.isInv()) || Math.abs(op.x - f.x) > 320 || (op.x - f.x) * f.dir < 0 || !op.onGround) return;
          if (guarding(op, f.x)) { op.posture = Math.min(99, (op.posture || 0) + 8); return; }
          if (SCRIPTED[op.state] || (op.dz && op.dz.cine)) return;
          op.takeHit(o.dmg || 2, { dmg: o.dmg || 2, stun: 0.72, kb: 40, post: 8, kind: 'kick', hurt: 'stagger' }, f, op.x, op.y - 150, 'head', f.dir);
        }]];
        f.dz.arKick = 2.6;
        label(f, o.label);
      },
    };
  }
  kickAct('splash', { col: '225,245,250', label: 'Water in the face!' });
  kickAct('snowkick', { col: '250,252,255', label: 'Snow in the face!', snd: 'straw' });
  kickAct('mudkick', { col: '112,86,58', label: 'Mud in the face!' });
  kickAct('emberkick', { col: '255,168,70', label: 'Embers in the face!', snd: 'straw', dmg: 4 });

  ACT.splat = {
    dur: 0.62,
    setup(f, c) {
      const w = Math.sign(f.x) || 1, a = A(), y0 = Math.min(0, f.y);
      c.X = [[0, w * (a - 2)], [0.32, w * (a - 4)], [0.62, w * (a - 24)]];
      c.Y = [[0, y0], [0.3, y0 * 0.85], [0.52, 0], [0.62, 0]];
      c.keys = [[0, f.entry], [0.06, pk('wallHit'), E.outCubic], [0.32, mod('wallHit', { hy: -70 }), E.inOut], [0.52, pk('down'), E.inCubic || E.inOut]];
      c.dirs = [[0, -w]];
      c.ev = [[0.02, (f) => { if (pres()) { fx.dust(f.x + w * 10, f.y - 90, 10, 0.9); au.thud(1.3, f.pan); cam.punch(8); } chip(f, 4); const d = def(); if (d && d.splatBurn && d.splatBurn(f)) { chip(f, 3); if (pres()) spray(f.x, -60, -w, 20, 0.7, '255,168,70'); } }],
        [0.6, (f) => { f.dz.env = null; f.setState('down'); }]];
      f.dz.arSplatT = 2.6;
      label(f, (def() && def().splatBurn && def().splatBurn(f)) ? 'Splatted into the fire!' : 'Wall splat!');
    },
  };

  ACT.wallflip = {
    dur: 0.86, air: [0.12, 0.78], pass: true,
    setup(f, c) {
      const w = Math.sign(f.x) || 1, a = A(), o = f.opp, land = clamp(o.x - w * 92, -a + 30, a - 30), top = w * (a - 14);
      c.X = [[0, f.x], [0.14, top], [0.3, top], [0.62, (top + land) / 2], [0.8, land], [0.86, land]];
      c.Y = [[0, 0], [0.14, -50], [0.3, -175], [0.52, -215], [0.74, -40], [0.8, 0], [0.86, 0]];
      c.keys = [[0, f.entry], [0.14, pk('jump'), E.inOutSine], [0.3, mod('ua_airA', { lean: -0.6 }), E.inOut], [0.52, mod('ua_airA', { lean: -1.4 }), E.inOut], [0.76, pk('land'), E.outCubic], [0.86, f.P.stance, E.inOut]];
      c.dirs = [[0, w], [0.3, -w], [0.64, w]];
      c.ev = [[0.28, (f) => { if (pres()) { fx.dust(f.x + w * 10, f.y - 40, 6, 0.8); au.thud(0.7, f.pan); } }], [0.8, (f) => { if (pres()) { fx.dust(f.x, 0, 6, 0.8); au.thud(0.6, f.pan); } }]];
      label(f, 'Up the wall and over!');
    },
  };
  if (D.envMCL) D.envMCL.wallflip = ['fBackflip', 0, 0.66, 0.1, 0.62, 'air'];

  ACT.buried = {
    dur: 1.05,
    setup(f, c) {
      c.X = [[0, f.x], [1.05, f.x]];
      c.keys = [[0, f.entry], [0.12, mod('kneel', { lean: 0.2, hy: -30 }), E.outCubic], [0.5, mod('kneel', { lean: -0.2, hy: -40 }), E.inOut], [0.8, mod('kneel', { lean: 0.25, hy: -36 }), E.inOut], [1.05, f.P.stance, E.outCubic]];
      c.face = 'opp';
      c.ev = [[0.9, (f) => { if (pres()) { spray(f.x, -20, 1, 14, 0.6, '250,252,255'); spray(f.x, -20, -1, 14, 0.6, '250,252,255'); au.swoosh(0.5, f.pan); } }]];
      label(f, 'Buried in snow!');
    },
  };


  function ringAct(name, o) {
    ACT[name] = {
      dur: o.dur, out: true, hold: true, inv: [0, o.dur - 0.17],
      setup(f, c) {
        const sd = o.side, a = A();
        c.X = o.X.map((q) => [q[0], sd * (a + q[1])]);
        c.Y = [[0, Math.min(0, f.y)]].concat(o.Y);
        c.keys = [[0, f.entry]].concat(o.keys(f));
        c.dirs = [[0, sd], [o.turn, -sd]];
        c.dim = o.dim || null;
        c.ev = [[o.hitAt, (f) => { if (pres()) o.fx(f); chip(f, o.dmg); f.posture = Math.min(99, (f.posture || 0) + 30); if (o.onIn) o.onIn(f); }]];
        f.dz.arPoolT = o.dur + 1.6;
        label(f, o.label);
      },
    };
  }
  ringAct('pool', {
    side: 1, dur: 1.55, turn: 0.95, hitAt: 0.28, dmg: 5, label: 'Into the pool!',
    X: [[0.22, 56], [0.95, 70], [1.2, 18], [1.4, -40], [1.55, -70]],
    Y: [[0.12, -30], [0.3, 64], [0.9, 60], [1.15, 26], [1.3, -40], [1.45, 0], [1.55, 0]],
    keys: (f) => [[0.16, pk('launch'), E.outCubic], [0.32, mod('launch', { lean: -0.9 }), E.inOut], [0.9, mod('kneel', { lean: 0.5 }), E.inOut], [1.2, mod('jump', { lean: 0.4 }), E.outCubic], [1.42, pk('land'), E.outCubic], [1.55, f.P.stance, E.inOut]],
    fx: (f) => { spray(f.x, 30, -1, 26, 1.1); spray(f.x, 30, 1, 14, 0.8); au.thud(1.1, f.pan); if (P.snd) P.snd({ k: 'bucket', x: f.x }, 'splash', 1.3); cam.punch(6); },
  });
  ringAct('shop', {
    side: -1, dur: 1.4, turn: 0.8, hitAt: 0.12, dmg: 4, label: 'Through the shop front!', dim: [0.2, 1.05],
    X: [[0.2, 46], [0.85, 60], [1.15, -30], [1.4, -76]],
    Y: [[0.1, -20], [0.3, 0], [1.4, 0]],
    keys: (f) => [[0.12, pk('launch'), E.outCubic], [0.32, pk('down'), E.inOut], [0.8, mod('kneel', { lean: 0.3 }), E.inOut], [1.15, pk('land'), E.outCubic], [1.4, f.P.stance, E.inOut]],
    fx: (f) => { au.thud(1.0, f.pan); cam.punch(5); if (P.snd) P.snd({ k: 'shopfront', x: f.x }, 'paper', 1.2); fx.dust(f.x, -100, 10, 1); },
    onIn: (f) => { for (const p of S.items) if (p.k === 'shopfront' && p.st === 0) P.breakProp(p, 'crush', { x: p.x, y: -110, dx: -1, dy: 0, by: f.opp }); },
  });
  ringAct('eave', {
    side: 1, dur: 1.6, turn: 1.0, hitAt: 0.3, dmg: 5, label: 'Hanging from the eave!',
    X: [[0.2, 34], [0.95, 30], [1.2, 6], [1.4, -40], [1.6, -66]],
    Y: [[0.12, -24], [0.3, 150], [0.95, 140], [1.18, 40], [1.32, -46], [1.48, 0], [1.6, 0]],
    keys: (f) => [[0.16, pk('launch'), E.outCubic], [0.32, mod('ua_pickHigh', { lean: -0.2, hy: -90 }), E.inOut], [0.95, mod('ua_pickHigh', { lean: 0.15, hy: -96 }), E.inOut], [1.2, mod('jump', { lean: 0.5 }), E.outCubic], [1.45, pk('land'), E.outCubic], [1.6, f.P.stance, E.inOut]],
    fx: (f) => { au.thud(0.9, f.pan); cam.punch(5); fx.dust(f.x - 20, 0, 8, 0.8); },
  });

  D.arenaActs = { pool: 1, shop: 1, eave: 1, swept: 1, splash: 1, snowkick: 1, mudkick: 1, emberkick: 1, splat: 1, wallflip: 1, buried: 1, ramp: 1, lanternDrop: 1, stalkCut: 1, tilekick: 1 };




  function underIt(f, x, w) { return f.dz && !f.dead && Math.abs(f.x - x) < w / 2 && f.y > -70 && !(f.isInv && f.isInv()) && movable(f); }
  function fallsOn(F, x, w, a, ex, word) {
    for (const f of F) {
      if (!underIt(f, x, w)) continue;
      const kd = Math.sign(f.x - x) || -f.dir;
      if (CONTACT[f.state] || (ex && f.onGround)) { f.vx = kd * 260; continue; }
      if (!f.onGround) continue;
      if (f.state === 'guard' || f.state === 'block') { f.posture = Math.min(99, (f.posture || 0) + 22); f.vx = kd * 300; continue; }
      hurtBy(f, a.dmg, a, f.opp, kd);
      if (word) label(f, word);
    }
  }

  function dropEvent(o) {
    return {
      first: o.first, gap: o.gap,
      start(s, F) {
        const tgt = F[rn() < 0.5 ? 0 : 1], x0 = clamp(tgt.x + (rn() - 0.5) * 70, -A() + o.margin, A() - o.margin);
        const x = o.pick ? o.pick(s, x0) : x0;
        if (x == null) return false;
        s.ev = { k: o.k, ph: 0, t: 0, x, w: o.w };
        banner(o.banner, x);
        if (pres() && o.warnFx) o.warnFx(x);
        return true;
      },
      step(s, e, h, F, ex) {
        e.t += h;
        if (e.ph === 0) { if (e.t >= o.warn) { e.ph = 1; e.t = 0; o.land(s, e, F, ex); } return; }
        if (e.t >= 0.5) e.done = 1;
      },
      warn: o.warn,
    };
  }

  const BARRIER = { log: 1 };
  function obsStep(s, h, F) {
    for (let i = s.obs.length - 1; i >= 0; i--) { const o = s.obs[i]; o.life -= h; if (o.life <= 0) s.obs.splice(i, 1); }

    for (const f of F) {
      const a = f.atk;
      if (f.state !== 'atk' || !a || a.kind !== 'blade' || !a.active || f.st < a.active[0] || f.st > a.active[1]) continue;
      for (let i = s.obs.length - 1; i >= 0; i--) {
        const o = s.obs[i];
        if (!BARRIER[o.k] || Math.abs(f.x + f.dir * 95 - o.x) > 75) continue;
        s.obs.splice(i, 1);
        if (pres()) { spray(o.x, -20, f.dir, 18, 0.7, '170,190,120'); au.thud(0.7, f.pan); }
        label(f, 'Cut through!');
      }
    }
  }
  function barrierBlock(d, s, f, pre) {
    if (!s || !s.obs.length || f.y < -34 || f.state === 'denv' || SCRIPTED[f.state] || f.dead) return;
    for (const o of s.obs) {
      if (!BARRIER[o.k]) continue;
      const s0 = pre.x - o.x, s1 = f.x - o.x;
      if ((s0 === 0 || s0 * s1 > 0) && Math.abs(s1) >= 18) continue;
      const sd = Math.sign(s0) || Math.sign(s1) || -f.dir;
      f.x = o.x + sd * 18; if (f.vx * sd < 0) f.vx = 0;
    }
  }


  const WF = { x0: -250, cur: 46, curLying: 120, surge: { warn: 1.7, speed: 640, push: 150 } };
  const inWater = (x) => x > WF.x0;
  ACT.swept = {
    dur: 0.78,
    setup(f, c) {
      const sd = c.sd || 1, x1 = f.x + sd * WF.surge.push;
      c.X = [[0, f.x], [0.5, x1], [0.78, x1 + sd * 8]];
      c.keys = [[0, f.entry], [0.12, mod('stagger', { lean: -0.5 }), E.outCubic], [0.42, mod('kneel', { lean: 0.35 }), E.inOut], [0.78, f.P.stance, E.inOut]];
      c.ev = [[0.02, (f) => { if (pres()) { spray(f.x, 0, sd, 18, 0.9); au.swoosh(0.8, f.pan); } }]];
      f.posture = Math.min(99, (f.posture || 0) + 18);
      label(f, 'Swept by the surge!');
    },
  };

  function frontStep(s, e, h, F, ex, hit) {
    const x0 = e.x, x1 = e.x + e.dir * e.speed * h;
    e.x = x1;
    for (let i = 0; i < F.length; i++) {
      const f = F[i];
      if (e.hit & (1 << i) || !f.dz || f.dead) continue;
      if ((f.x - x0) * e.dir < -30 || (f.x - x1) * e.dir > 0) continue;
      e.hit |= 1 << i;
      hit(f, ex);
    }
  }
  DEFS.waterfall = {
    event: {
      first: [14, 20], gap: [22, 32],
      start(s) { s.ev = { k: 'surge', ph: 0, t: 0, x: WF.x0, dir: 1, speed: WF.surge.speed, hit: 0 }; banner('The falls surge! Jump it or guard!', -20, -300); if (pres()) au.thud(0.6, 0); return true; },
      step(s, e, h, F, ex) {
        e.t += h;
        if (e.ph === 0) { if (e.t >= WF.surge.warn) { e.ph = 1; e.t = 0; if (pres()) au.swoosh(1.0, 0); } return; }
        frontStep(s, e, h, F, ex, (f, ex) => { if (inWater(f.x)) surgeHits(f, ex); });
        if (e.x > A() + 120) e.done = 1;
      },
      front: true, warn: WF.surge.warn,
    },
    step(s, h, F, ex) {
      if (G.phase !== 'fight') return;
      for (const f of F) {
        if (!movable(f) || !inWater(f.x) || f.y < -2) continue;

        if (LYING[f.state]) f.x = Math.min(A(), f.x + WF.curLying * h);
        else if (!ex && f.onGround) f.x = Math.min(A(), f.x + WF.cur * h);
      }
    },
    ctx(f, add) { const o = f.opp, d = Math.abs(o.x - f.x); if (inWater(f.x) && f.x < A() && d > 70 && d < 280 && o.onGround) add('splash', null, 60, 'water'); },
    cpu(ai, f, dist, s, lv) {
      if (inWater(f.x) && dist > 110 && dist < 250 && f.opp.state !== 'atk' && rn() < 0.05 + 0.12 * (lv.str || 0)) return D.envStart(f, 'splash', null);
      return false;
    },
    ring: { side: 1, act: 'pool' },
    wet: (x) => inWater(x) && x < A(),
    drawFloor: drawFallsFloor, drawFront: drawFallsFront,
  };
  function surgeHits(f, ex) {
    if (SCRIPTED[f.state] || f.dz.cine) return;
    if (LYING[f.state]) { f.x = Math.min(A(), f.x + 80); return; }
    if (!f.onGround || f.y < -24) { if (f.state !== 'launch') label(f, 'Over the wave!'); return; }
    const g = f.state === 'guard' || f.state === 'block' || f.state === 'parry';
    if (ex || g || CONTACT[f.state]) { f.vx = Math.max(f.vx, 300); if (g) { f.posture = Math.min(99, (f.posture || 0) + 8); label(f, 'Braced against the surge'); } return; }
    D.envStart(f, 'swept', null);
  }
  function drawFallsFloor(ctx, s) {
    const t = ND.scene.t, a = A(), lite = !!D.lite, x0 = WF.x0, x1 = a + 2;
    const g = ctx.createLinearGradient(0, -46, 0, 260);
    g.addColorStop(0, 'rgba(130,196,204,.78)'); g.addColorStop(0.3, 'rgba(92,160,172,.6)'); g.addColorStop(1, 'rgba(48,104,118,.66)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x0 - 40, -46); ctx.lineTo(x1, -46); ctx.lineTo(x1, 520); ctx.lineTo(x0 + 30, 520);
    ctx.bezierCurveTo(x0 - 20, 300, x0 + 25, 120, x0 - 10, 30); ctx.bezierCurveTo(x0 - 30, -5, x0 - 50, -25, x0 - 40, -46); ctx.fill();
    ctx.strokeStyle = 'rgba(230,248,245,.55)'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(x0 - 40, -46); ctx.bezierCurveTo(x0 - 50, -25, x0 - 30, -5, x0 - 10, 30); ctx.bezierCurveTo(x0 + 25, 120, x0 - 20, 300, x0 + 30, 520); ctx.stroke();
    ctx.strokeStyle = 'rgba(235,252,250,.62)'; ctx.lineWidth = 2.4;
    const rows = lite ? [-30, 20, 90] : [-34, -14, 8, 34, 70, 120, 190];
    for (let i = 0; i < rows.length; i++) {
      ctx.setLineDash([22 + (i % 3) * 12, 40 + (i % 4) * 16]); ctx.lineDashOffset = -t * (90 + (i % 3) * 30);
      ctx.beginPath(); ctx.moveTo(x0 + 10, rows[i]); ctx.lineTo(x1, rows[i]); ctx.stroke();
    }
    ctx.setLineDash([]);
    const pg = ctx.createLinearGradient(0, -46, 0, 300);
    pg.addColorStop(0, 'rgba(40,92,104,.96)'); pg.addColorStop(1, 'rgba(14,44,56,.98)');
    ctx.fillStyle = pg; ctx.fillRect(a + 4, -48, 1400, 700);
    ctx.fillStyle = 'rgba(22,38,36,.9)'; ctx.fillRect(a - 2, -48, 10, 700);
    ctx.strokeStyle = 'rgba(240,252,250,.7)'; ctx.lineWidth = 3;
    ctx.beginPath(); for (let y = -44; y < 520; y += 26) { const w = 6 + 4 * Math.sin(t * 3 + y * 0.07); ctx.moveTo(a + 8, y); ctx.quadraticCurveTo(a + 8 + w, y + 13, a + 8, y + 26); } ctx.stroke();
    if (!lite) {
      ctx.strokeStyle = 'rgba(200,236,240,.25)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const yy = -20 + i * 46, ph = t * 0.8 + i; ctx.moveTo(a + 40 + 30 * Math.sin(ph), yy); ctx.lineTo(a + 160 + 30 * Math.sin(ph), yy); } ctx.stroke();
    }
    const e = s && s.ev;
    if (e && e.k === 'surge') {
      if (e.ph === 0) {
        const k = Math.min(1, e.t / WF.surge.warn), pulse = 0.5 + 0.5 * Math.sin(t * 18);
        ctx.fillStyle = `rgba(245,252,252,${0.35 + 0.35 * k * pulse})`;
        ctx.beginPath(); for (let i = 0; i < 7; i++) { const xx = x0 - 20 + i * 26, r = 14 + 16 * k + 5 * Math.sin(t * 9 + i); ellipse(ctx, xx, -40 - r * 0.3, r, r * 0.6); } ctx.fill();
      } else {
        const x = e.x, bw = lite ? 120 : 200, xa = Math.max(x0 - 30, x - bw);
        const wg = ctx.createLinearGradient(x - bw, 0, x + 6, 0);
        wg.addColorStop(0, 'rgba(235,250,252,0)'); wg.addColorStop(0.6, 'rgba(235,250,252,.5)'); wg.addColorStop(0.92, 'rgba(250,255,255,.92)'); wg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = wg; ctx.fillRect(xa, -54, x + 8 - xa, 580);
        ctx.fillStyle = 'rgba(255,255,255,.95)';
        ctx.beginPath(); for (let y = -50; y < 520; y += lite ? 30 : 18) { const r = 11 + 6 * Math.sin(t * 13 + y * 0.9), hx = x - 6 + 5 * Math.sin(t * 9 + y); ellipse(ctx, hx, y - 14, r, r * 1.25); } ctx.fill();
        ctx.strokeStyle = 'rgba(120,170,180,.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); for (let y = -40; y < 520; y += 36) { ctx.moveTo(x - 22, y); ctx.quadraticCurveTo(x - 6, y - 16, x + 4, y - 4); } ctx.stroke();
      }
    }
  }
  function drawFallsFront(ctx) {
    const a = A();
    if (!(G.F || []).some((f) => f && f.state === 'denv' && f.dz && f.dz.env && f.dz.env.a === 'pool')) return;
    const g = ctx.createLinearGradient(0, -2, 0, 260);
    g.addColorStop(0, 'rgba(70,130,140,.9)'); g.addColorStop(1, 'rgba(16,48,60,.98)');
    ctx.fillStyle = g; ctx.fillRect(a + 6, -2, 1400, 600);
    ctx.strokeStyle = 'rgba(240,252,250,.8)'; ctx.lineWidth = 3;
    const t = ND.scene.t; ctx.beginPath(); ctx.moveTo(a + 6, -2); for (let x = a + 6; x < a + 400; x += 20) ctx.lineTo(x + 10, -2 + 2.5 * Math.sin(t * 6 + x * 0.08)); ctx.stroke();
  }
  P.ARENA_SETS.waterfall = [['jar', -560, -8], ['jar', -500, -2], ['bucket', -430, 0], ['stool', -340, -6], ['crate', 520, -16], ['stool', 640, -6]];




  DEFS.temple = {
    event: {
      first: [16, 24], gap: [26, 36],
      start(s) { s.ev = { k: 'petals', ph: 0, t: 0 }; banner('A petal storm: hard to read his blade!', 0); return true; },
      step(s, e, h) { e.t += h; if (e.ph === 0 && e.t >= 1.0) { e.ph = 1; e.t = 0; } else if (e.ph === 1 && e.t >= 5.0) e.done = 1; },
      warn: 1.0,
    },
    walls: [-1, 1],
    drawFront: drawPetals,
  };
  const BLIND = new WeakMap();
  const blindLv = (lv) => { let b = BLIND.get(lv); if (!b) { b = Object.assign({}, lv, { react: (lv.react || 0.2) * 1.7 + 0.06, parry: (lv.parry || 0) * 0.55, read: (lv.read || 0) * 0.4, guard: (lv.guard || 0) * 0.8 }); BLIND.set(lv, b); } return b; };
  const PETALS = Array.from({ length: 140 }, (_, i) => ({ x: ((i * 397) % 1000) / 1000, y: ((i * 613) % 1000) / 1000, s: 0.6 + ((i * 131) % 100) / 100, p: i * 1.7 }));
  function drawPetals(ctx, s) {
    const e = s && s.ev;
    if (!e || e.k !== 'petals') return;
    const k = e.ph === 0 ? e.t / 1.0 : e.t > 4.4 ? Math.max(0, (5 - e.t) / 0.6) : 1, t = ND.scene.t, n = D.lite ? 60 : PETALS.length;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const W = cam.W, H = cam.H, u = Math.min(W / 960, H / 540);
    ctx.fillStyle = `rgba(255,200,215,${0.85 * k})`; ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const q = PETALS[i], x = ((q.x + t * (0.22 + 0.1 * q.s)) % 1) * (W + 60) - 30, y = ((q.y + t * 0.07 * q.s + 0.04 * Math.sin(t * 2 + q.p)) % 1) * H;
      const r = 4.5 * q.s * u; ctx.moveTo(x + r, y); ctx.ellipse(x, y, r, r * 0.5, t * 2 + q.p, 0, 6.283);
    }
    ctx.fill();
    ctx.fillStyle = `rgba(255,225,235,${0.1 * k})`; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }


  const RN = { stalks: [-650, -390, -110, 170, 430, 690], regrow: 14 };
  DEFS.rain = {
    zones: [{ k: 'puddle', x0: -560, x1: -440 }, { k: 'puddle', x0: 40, x1: 160 }, { k: 'puddle', x0: 470, x1: 590 }, { k: 'mud', x0: -310, x1: -160 }],
    init(s) { s.stalk = RN.stalks.map(() => 0); },
    event: dropEvent({
      k: 'bolt', first: [14, 22], gap: [22, 32], warn: 1.5, w: 120, margin: 120, banner: 'Lightning! A bamboo will fall!',
      pick(s, x0) { let best = -1, bd = 1e9; RN.stalks.forEach((x, i) => { if (!s.stalk[i] && Math.abs(x - x0) < bd) { bd = Math.abs(x - x0); best = i; } }); if (best < 0) return null; s.evStalk = best; return RN.stalks[best]; },
      land(s, e, F, ex) { s.stalk[s.evStalk] = RN.regrow; fallsOn(F, e.x, e.w, { dmg: 10, stun: 0.6, kb: 220, knock: true, post: 25 }, ex, 'Felled by the bamboo!'); s.obs.push({ k: 'log', x: e.x, w: 40, life: 9 }); if (pres()) { ND.scene.flashL = 1; au.thud(1.4, cam.pan(e.x)); cam.punch(8); spray(e.x, -10, 1, 14, 0.8, '170,190,120'); spray(e.x, -10, -1, 14, 0.8, '170,190,120'); } },
    }),
    step(s, h) { for (let i = 0; i < s.stalk.length; i++) if (s.stalk[i] > 0) s.stalk[i] = Math.max(0, s.stalk[i] - h); },
    ctx(f, add, s) {
      const o = f.opp, d = Math.abs(o.x - f.x);
      if (zoneAt(this, s, f.x, 'mud') && d > 70 && d < 280 && o.onGround) add('mudkick', null, 60, 'mud');
      const k = stalkFor(s, f);
      if (k >= 0) add('stalkCut', null, 20, 'bamboo');
    },
    cpu(ai, f, dist, s, lv) {
      if (stalkFor(s, f) >= 0 && rn() < 0.08 + 0.2 * (lv.str || 0)) return D.envStart(f, 'stalkCut', null);
      if (zoneAt(this, s, f.x, 'mud') && dist > 110 && dist < 250 && f.opp.state !== 'atk' && rn() < 0.04 + 0.1 * (lv.str || 0)) return D.envStart(f, 'mudkick', null);
      return false;
    },
    walls: [-1, 1], wet: (x) => !!zoneAt(DEFS.rain, null, x, 'puddle'),
    drawFloor: drawRainFloor, drawFront: drawRainFront,
  };

  function stalkFor(s, f) {
    if (!s || !s.stalk || !armed(f)) return -1;
    const o = f.opp;
    for (let i = 0; i < RN.stalks.length; i++) { const x = RN.stalks[i]; if (!s.stalk[i] && Math.abs(o.x - x) < 70 && Math.abs(f.x - x) < 240 && Math.abs(f.x - x) > 40 && o.onGround) return i; }
    return -1;
  }
  ACT.stalkCut = {
    dur: 0.62,
    setup(f, c) {
      const s = stNow(), k = stalkFor(s, f), x = k >= 0 ? RN.stalks[k] : f.x + f.dir * 120;
      f.dir = x >= f.x ? 1 : -1;
      c.X = [[0, f.x], [0.62, f.x]];
      c.keys = [[0, f.entry], [0.1, pk('dz_d_kesaRW'), E.inOutSine], [0.2, pk('dz_d_kesaRS'), E.outQuart], [0.62, f.P.stance, E.inOut]];
      c.k = k;
      c.ev = [[0.2, (f, c) => { const s = stNow(); if (s && c.k >= 0 && !s.stalk[c.k]) { s.stalk[c.k] = RN.regrow; s.falls.push({ k: 'stalk', x: RN.stalks[c.k], t: 0, by: f.id }); if (pres()) { fx.spark(RN.stalks[c.k], -110, 0, 8, 0.6, '210,230,170'); au.thud(0.8, f.pan); } } }]];
      label(f, 'Bamboo cut down!');
    },
  };
  function drawRainFloor(ctx, s) {
    const t = ND.scene.t, lite = !!D.lite;
    for (const z of this.zones) {
      const cx = (z.x0 + z.x1) / 2, rx = (z.x1 - z.x0) / 2;
      if (z.k === 'mud') {
        ctx.fillStyle = 'rgba(78,58,38,.78)'; ctx.beginPath(); ellipse(ctx, cx, 14, rx + 10, 34); ellipse(ctx, cx - rx * 0.4, 60, rx * 0.7, 26); ctx.fill();
        ctx.fillStyle = 'rgba(140,110,80,.35)'; ctx.beginPath(); for (let i = 0; i < 6; i++) ellipse(ctx, z.x0 + 14 + i * (rx / 3), 6 + (i % 3) * 18, 10, 3); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(150,175,195,.42)'; ctx.beginPath(); ellipse(ctx, cx, 10, rx + 6, 22); ctx.fill();
        ctx.strokeStyle = 'rgba(225,238,250,.5)'; ctx.lineWidth = 1.3; ctx.beginPath();
        for (let i = 0; i < (lite ? 2 : 5); i++) { const ph = (t * 1.3 + i * 0.37) % 1, xx = z.x0 + 10 + ((i * 53) % (z.x1 - z.x0 - 20)), r = 4 + ph * 18; ctx.moveTo(xx + r, 8 + (i % 3) * 7); ctx.ellipse(xx, 8 + (i % 3) * 7, r, r * 0.3, 0, 0, 6.283); }
        ctx.stroke();
      }
    }

    if (s && s.stalk) {
      ctx.lineCap = 'round';
      RN.stalks.forEach((x, i) => {
        if (s.stalk[i]) { ctx.fillStyle = '#4f5e33'; ctx.fillRect(x - 7, -64, 14, 18); ctx.fillStyle = '#c7d39a'; ctx.beginPath(); ellipse(ctx, x, -64, 7, 2.5); ctx.fill(); return; }
        const warn = s.ev && s.ev.k === 'bolt' && s.ev.ph === 0 && s.evStalk === i, glow = warn ? 0.5 + 0.5 * Math.sin(t * 22) : 0;
        ctx.strokeStyle = warn ? `rgb(${120 + 120 * glow},${150 + 100 * glow},${120 + 120 * glow})` : '#3f5a2c'; ctx.lineWidth = 13;
        ctx.beginPath(); ctx.moveTo(x, -48); ctx.lineTo(x + 6 * Math.sin(t * 0.7 + i), -600); ctx.stroke();
        ctx.strokeStyle = 'rgba(20,30,14,.6)'; ctx.lineWidth = 15; ctx.beginPath(); for (let y = -120; y > -600; y -= 110) { ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); } ctx.stroke();
      });
    }
    for (const o of (s && s.obs) || []) if (o.k === 'log') drawLog(ctx, o.x, 1);
  }

  function drawLog(ctx, x, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
    ctx.strokeStyle = '#6f7f3d'; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(x - 30, -44); ctx.lineTo(x + 40, 210); ctx.stroke();
    ctx.strokeStyle = '#9fb060'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 33, -44); ctx.lineTo(x + 37, 210); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,40,18,.7)'; ctx.lineWidth = 16; ctx.beginPath(); for (let k = 0.15; k < 1; k += 0.22) { const xx = x - 30 + 70 * k, yy = -44 + 254 * k; ctx.moveTo(xx - 7, yy - 2); ctx.lineTo(xx + 7, yy + 2); } ctx.stroke();
    ctx.restore();
  }

  function drawRainFront(ctx, s) {
    if (!s) return;
    const e = s.ev;
    if (e && e.k === 'bolt' && e.ph === 1 && e.t < 0.22) {
      ctx.strokeStyle = `rgba(235,240,255,${1 - e.t / 0.22})`; ctx.lineWidth = 5; ctx.beginPath(); let x = e.x + 60, y = -900; ctx.moveTo(x, y);
      for (let i = 0; i < 8; i++) { x = e.x + ((i * 37) % 70) - 35 + (i === 7 ? -x + e.x : 0); y += 108; ctx.lineTo(i === 7 ? e.x : x, y); } ctx.stroke();
    }
    for (const q of s.falls) if (q.k === 'stalk') drawFallingStalk(ctx, q.x, Math.min(1, q.t / 0.42));
    if (e && e.k === 'bolt' && e.ph === 1 && e.t < 0.3) drawFallingStalk(ctx, e.x, 1);
  }
  function drawFallingStalk(ctx, x, k) {
    const th = E.inCubic ? E.inCubic(k) * 1.45 : k * k * 1.45, L = 560;
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#4f6a33'; ctx.lineWidth = 13;
    ctx.beginPath(); ctx.moveTo(x, -48); ctx.lineTo(x + Math.sin(th) * 50, -48 - Math.cos(th) * L + Math.sin(th) * 260 * k); ctx.stroke(); ctx.restore();
  }
  P.ARENA_SETS.rain = [['barrel', -700, -14], ['bucket', -610, -4], ['stool', -330, -6], ['crate', 610, -12], ['crate', 616, 0, { on: 3 }], ['lantern', 760, -16]];


  DEFS.snow = {
    zones: [{ k: 'drift', x0: -2000, x1: -560 }, { k: 'drift', x0: 560, x1: 2000 }, { k: 'ice', x0: -230, x1: 40 }],
    event: dropEvent({
      k: 'snow', first: [15, 22], gap: [22, 32], warn: 1.5, w: 150, margin: 140, banner: 'Snow is sliding off the pines!',
      land(s, e, F, ex) {
        for (const f of F) {
          if (!underIt(f, e.x, e.w)) continue;
          if (CONTACT[f.state] || ex || !f.onGround) { f.vx = (Math.sign(f.x - e.x) || 1) * 240; continue; }
          D.envStart(f, 'buried', null);
        }
        s.obs.push({ k: 'heap', x: e.x, w: 180, life: 10 });
        if (pres()) { au.thud(1.2, cam.pan(e.x)); cam.punch(6); spray(e.x, -30, 1, 26, 0.9, '250,252,255'); spray(e.x, -30, -1, 26, 0.9, '250,252,255'); }
      },
    }),
    ctx(f, add, s) { const o = f.opp, d = Math.abs(o.x - f.x); if (zoneAt(this, s, f.x, 'drift') && d > 70 && d < 280 && o.onGround) add('snowkick', null, 60, 'snow'); },
    cpu(ai, f, dist, s, lv) { if (zoneAt(this, s, f.x, 'drift') && dist > 110 && dist < 250 && f.opp.state !== 'atk' && rn() < 0.05 + 0.12 * (lv.str || 0)) return D.envStart(f, 'snowkick', null); return false; },
    walls: [-1, 1], cushion: true,
    drawFloor: drawSnowFloor, drawFront: drawSnowFront,
  };
  function drawSnowFloor(ctx, s) {
    const t = ND.scene.t, a = A();

    const z = this.zones[2], cx = (z.x0 + z.x1) / 2, rx = (z.x1 - z.x0) / 2;
    ctx.fillStyle = 'rgba(178,212,236,.8)'; ctx.beginPath(); ellipse(ctx, cx, 30, rx + 16, 58); ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${0.45 + 0.1 * Math.sin(t)})`; ctx.beginPath(); ellipse(ctx, cx - rx * 0.3, 14, rx * 0.5, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(110,150,190,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx - 60, 10); ctx.lineTo(cx - 20, 34); ctx.lineTo(cx + 30, 26); ctx.moveTo(cx - 20, 34); ctx.lineTo(cx - 34, 70); ctx.moveTo(cx + 60, 40); ctx.lineTo(cx + 100, 18); ctx.stroke();

    ctx.fillStyle = 'rgba(246,248,255,.92)';
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 560, 120); ctx.quadraticCurveTo(sd * 600, -40, sd * 700, -36); ctx.lineTo(sd * (a + 300), -40); ctx.lineTo(sd * (a + 300), 300); ctx.lineTo(sd * 540, 300); ctx.fill(); }
    for (const o of (s && s.obs) || []) if (o.k === 'heap') { const k = Math.min(1, o.life / 1.5); ctx.fillStyle = `rgba(250,252,255,${0.95 * k})`; ctx.beginPath(); ellipse(ctx, o.x, 6, o.w / 2, 30); ellipse(ctx, o.x - 20, -6, o.w / 3, 22); ctx.fill(); }
    const e = s && s.ev;
    if (e && e.k === 'snow' && e.ph === 0) { const k = e.t / 1.5, p = 0.6 + 0.4 * Math.sin(t * 14); ctx.fillStyle = `rgba(80,90,130,${0.2 + 0.25 * k})`; ctx.beginPath(); ellipse(ctx, e.x, 8, (e.w / 2) * (0.6 + 0.4 * k), 18); ctx.fill(); ctx.strokeStyle = `rgba(60,70,120,${0.5 + 0.4 * p})`; ctx.lineWidth = 3; ctx.beginPath(); ellipse(ctx, e.x, 8, e.w / 2, 18); ctx.stroke(); }
  }

  function drawSnowFront(ctx, s) {
    const a = A(), t = ND.scene.t;
    ctx.fillStyle = 'rgba(246,248,255,.95)';
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 590, 30); for (let x = 590; x <= a + 300; x += 30) ctx.lineTo(sd * x, 8 + 4 * Math.sin(x * 0.07)); ctx.lineTo(sd * (a + 300), 40); ctx.lineTo(sd * 590, 40); ctx.fill(); }
    const e = s && s.ev;
    if (e && e.k === 'snow') {
      if (e.ph === 0) { ctx.fillStyle = 'rgba(250,252,255,.85)'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const y = -380 + ((t * 300 + i * 53) % 370); ellipse(ctx, e.x + ((i * 29) % 80) - 40, y, 3 + (i % 3), 3 + (i % 3)); } ctx.fill(); }
      else if (e.t < 0.25) { const k = e.t / 0.25; ctx.fillStyle = 'rgba(250,252,255,.9)'; ctx.beginPath(); for (let i = 0; i < 9; i++) { const y = -420 + 430 * Math.min(1, k * (1 + (i % 3) * 0.12)), r = 10 + (i % 4) * 5; ellipse(ctx, e.x + ((i * 37) % (e.w - 20)) - e.w / 2 + 10, y - (i % 3) * 30, r, r * 0.8); } ctx.fill(); }
    }
  }
  P.ARENA_SETS.snow = [['bale', -640, -10], ['bale', -586, -4], ['bucket', -380, -2], ['crate', 420, -14], ['jar', 520, -8], ['rack', 700, -22]];


  DEFS.village = {
    zones: [{ k: 'fire', x0: -2000, x1: -A() + 70 }, { k: 'fire', x0: A() - 70, x1: 2000 }],
    event: dropEvent({
      k: 'beam', first: [15, 22], gap: [22, 32], warn: 1.5, w: 130, margin: 170, banner: 'A burning beam is coming down!',
      land(s, e, F, ex) { fallsOn(F, e.x, e.w, { dmg: 11, stun: 0.6, kb: 240, knock: true, post: 25 }, ex, 'Hit by the beam!'); s.obs.push({ k: 'beam', x: e.x, w: 130, life: 7 }); if (pres()) { au.thud(1.4, cam.pan(e.x)); cam.punch(8); spray(e.x, -20, 1, 20, 0.9, '255,168,70'); spray(e.x, -20, -1, 20, 0.9, '255,168,70'); } },
    }),
    ctx(f, add, s) { const o = f.opp, d = Math.abs(o.x - f.x); if (nearFire(this, s, f.x) && !zoneAt(this, s, f.x, 'fire') && d > 70 && d < 280 && o.onGround) add('emberkick', null, 60, 'fire'); },
    cpu(ai, f, dist, s, lv) { if (nearFire(this, s, f.x) && !zoneAt(this, s, f.x, 'fire') && dist > 110 && dist < 250 && f.opp.state !== 'atk' && rn() < 0.05 + 0.12 * (lv.str || 0)) return D.envStart(f, 'emberkick', null); return false; },
    walls: [-1, 1], fire: true, splatBurn: (f) => Math.abs(f.x) > A() - 90,
    drawFloor: drawVillageFloor, drawFront: drawVillageFront,
  };
  const nearFire = (d, s, x) => { for (let k = -100; k <= 100; k += 50) if (zoneAt(d, s, x + k, 'fire')) return true; return false; };
  function flames(ctx, x0, x1, y, h, t, n) {
    const L = D.lite;
    ctx.fillStyle = 'rgba(255,120,30,.85)'; ctx.beginPath();
    for (let i = 0; i < n; i++) { const x = x0 + ((x1 - x0) * (i + 0.5)) / n, hh = h * (0.7 + 0.3 * Math.sin(t * 9 + i * 2.1)); ctx.moveTo(x - 14, y); ctx.quadraticCurveTo(x - 10, y - hh * 0.6, x + 3 * Math.sin(t * 7 + i), y - hh); ctx.quadraticCurveTo(x + 10, y - hh * 0.6, x + 14, y); }
    ctx.fill();
    if (!L) { ctx.fillStyle = 'rgba(255,215,120,.85)'; ctx.beginPath(); for (let i = 0; i < n; i++) { const x = x0 + ((x1 - x0) * (i + 0.5)) / n, hh = h * 0.45 * (0.7 + 0.3 * Math.sin(t * 11 + i)); ctx.moveTo(x - 7, y); ctx.quadraticCurveTo(x, y - hh, x + 7, y); } ctx.fill(); }
  }
  function drawVillageFloor(ctx, s) {
    const a = A(), t = ND.scene.t;
    for (const sd of [-1, 1]) {
      const x0 = sd < 0 ? -a - 120 : a - 70, x1 = sd < 0 ? -a + 70 : a + 120;
      ctx.fillStyle = 'rgba(30,14,8,.9)'; ctx.beginPath(); ellipse(ctx, (x0 + x1) / 2, 8, (x1 - x0) / 2 + 10, 30); ctx.fill();
      ctx.strokeStyle = '#2a140a'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x0 + 10, 4); ctx.lineTo(x1 - 20, -30); ctx.moveTo(x0 + 30, -26); ctx.lineTo(x1 - 6, 10); ctx.stroke();
      const g = ctx.createRadialGradient((x0 + x1) / 2, 0, 5, (x0 + x1) / 2, 0, 170); g.addColorStop(0, `rgba(255,120,40,${0.32 + 0.06 * Math.sin(t * 8)})`); g.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = g; ctx.fillRect(x0 - 160, -170, x1 - x0 + 320, 260);
    }
    flames(ctx, -a - 110, -a + 64, -30, 130, t, D.lite ? 3 : 6);
    flames(ctx, a - 64, a + 110, -30, 130, t + 1, D.lite ? 3 : 6);
    for (const o of (s && s.obs) || []) if (o.k === 'beam' || o.k === 'paper') {
      ctx.fillStyle = o.k === 'beam' ? '#2b1409' : 'rgba(60,30,20,.8)'; ctx.save(); ctx.translate(o.x, 10); ctx.rotate(0.2); ctx.fillRect(-o.w / 2, -9, o.w, 18); ctx.restore();
      flames(ctx, o.x - o.w / 2 + 8, o.x + o.w / 2 - 8, -4, (o.k === 'beam' ? 90 : 55) * Math.min(1, o.life / 1.2), t + o.x, o.k === 'beam' ? 4 : 2);
    }

    const e = s && s.ev;
    if (e && e.k === 'beam' && e.ph === 0) {
      const k = e.t / 1.5, p = 0.6 + 0.4 * Math.sin(t * 16);
      ctx.fillStyle = `rgba(255,110,40,${0.18 + 0.3 * k * p})`; ctx.beginPath(); ellipse(ctx, e.x, 8, (e.w / 2) * (0.6 + 0.4 * k), 22); ctx.fill();
      ctx.strokeStyle = `rgba(255,190,90,${0.5 + 0.4 * p})`; ctx.lineWidth = 3; ctx.beginPath(); ellipse(ctx, e.x, 8, e.w / 2, 22); ctx.stroke();
    }
  }
  function drawVillageFront(ctx, s) {
    const a = A(), t = ND.scene.t;

    ctx.globalAlpha = 0.8;
    flames(ctx, -a - 110, -a + 64, 14, 34, t + 2, D.lite ? 2 : 5);
    flames(ctx, a - 64, a + 110, 14, 34, t + 3, D.lite ? 2 : 5);
    for (const o of (s && s.obs) || []) if (o.k === 'beam' || o.k === 'paper') flames(ctx, o.x - o.w / 2 + 12, o.x + o.w / 2 - 12, 18, 26 * Math.min(1, o.life / 1.2), t + o.x + 1, 3);
    ctx.globalAlpha = 1;
    const e = s && s.ev;
    if (e && e.k === 'beam') {
      if (e.ph === 0) { ctx.fillStyle = 'rgba(255,170,60,.9)'; ctx.beginPath(); for (let i = 0; i < 8; i++) ellipse(ctx, e.x + ((i * 31) % 90) - 45, -340 + ((t * 260 + i * 61) % 330), 2.5, 2.5); ctx.fill(); ctx.save(); ctx.translate(e.x, -350 + 6 * Math.sin(t * 30)); ctx.rotate(0.15 * Math.sin(t * 6)); ctx.fillStyle = '#3a1a0b'; ctx.fillRect(-70, -10, 140, 20); ctx.restore(); }
      else if (e.t < 0.2) { const y = -350 + 360 * (e.t / 0.2) ** 2; ctx.save(); ctx.translate(e.x, y); ctx.rotate(0.2 * (e.t / 0.2)); ctx.fillStyle = '#3a1a0b'; ctx.fillRect(-70, -10, 140, 20); ctx.restore(); flames(ctx, e.x - 60, e.x + 60, y - 6, 60, t, 3); }
    }
  }
  P.ARENA_SETS.village = [['crate', -560, -14], ['barrel', -480, -6], ['bucket', -390, 0], ['stool', 340, -6], ['jar', 450, -10], ['bale', 590, -16], ['bottle', 380, -2]];


  const MK = { stall: 640, lan: [-340, 40, 330], lanY: -300, cart: { warn: 1.5, speed: 560 } };
  DEFS.market = {
    init(s) { s.lan = MK.lan.map(() => 0); s.stall = 0; },
    event: {
      first: [15, 22], gap: [24, 34],
      start(s) { const dir = rn() < 0.5 ? 1 : -1; s.ev = { k: 'cart', ph: 0, t: 0, dir, x: -dir * (A() + 260), speed: MK.cart.speed, hit: 0 }; banner('A cart is rolling down the street!', -dir * (A() - 200)); if (pres()) au.clang(0.4, -dir * 0.8, 1.4); return true; },
      step(s, e, h, F, ex) {
        e.t += h;
        if (e.ph === 0) { if (e.t >= MK.cart.warn) { e.ph = 1; e.t = 0; } return; }
        frontStep(s, e, h, F, ex, (f, ex) => cartHits(f, ex, e.dir));
        if (e.dir > 0 ? e.x > A() + 260 : e.x < -A() - 260) e.done = 1;

        if (!s.stall && Math.abs(e.x - MK.stall) < 40) { s.stall = 1; if (pres()) { au.thud(1.2, cam.pan(MK.stall)); spray(MK.stall, -60, e.dir, 16, 0.8, '150,110,70'); } }
      },
      front: true, warn: MK.cart.warn,
    },
    step(s, h, F) {
      for (let i = 0; i < s.lan.length; i++) if (s.lan[i] > 0) s.lan[i] = Math.max(0, s.lan[i] - h);

      if (!s.stall) for (const f of F) {
        if (f.dead || !(f.state === 'launch' || f.state === 'down' || f.state === 'hurt' || f.state === 'stagger') || (Math.abs(f.vx) < 60 && f.state !== 'launch') || Math.abs(f.x - MK.stall) > 75 || f.y < -160) continue;
        s.stall = 1; label(f, 'Through the stall!');
        if (pres()) { au.thud(1.3, f.pan); cam.punch(7); spray(MK.stall, -70, Math.sign(f.vx), 22, 0.9, '150,110,70'); }
      }
    },
    ctx(f, add, s) {
      if (lanFor(s, f) >= 0) add('lanternDrop', null, 30, 'lantern');
      if (s.stall && rampOk(f)) add('ramp', null, 10, 'steps');
    },
    cpu(ai, f, dist, s, lv) {
      if (lanFor(s, f) >= 0 && rn() < 0.06 + 0.18 * (lv.str || 0)) return D.envStart(f, 'lanternDrop', null);
      if (s.stall && rampOk(f) && rn() < 0.05 + 0.15 * (lv.str || 0)) return D.envStart(f, 'ramp', null);
      return false;
    },
    ring: { side: -1, act: 'shop' }, walls: [1],
    drawFloor: drawMarketFloor, drawFront: drawMarketFront,
  };
  function cartHits(f, ex, dir) {
    if (SCRIPTED[f.state] || f.dz.cine) return;
    if (LYING[f.state]) return;
    if (!f.onGround || f.y < -40) { if (f.state !== 'launch') label(f, 'Over the cart!'); return; }
    if (ex || CONTACT[f.state]) { f.vx = dir * 320; return; }
    if (guarding(f, f.x - dir * 50)) { f.vx = dir * 420; f.posture = Math.min(99, (f.posture || 0) + 20); label(f, 'Braced against the cart'); return; }
    hurtBy(f, 9, { dmg: 9, stun: 0.6, kb: 300, knock: true, post: 25 }, f.opp, dir);
    label(f, 'Run over by the cart!');
  }

  function lanFor(s, f) {
    if (!s || !s.lan || !armed(f)) return -1;
    const o = f.opp;
    for (let i = 0; i < MK.lan.length; i++) { const x = MK.lan[i]; if (!s.lan[i] && Math.abs(o.x - x) < 55 && Math.abs(f.x - x) < 260 && Math.abs(f.x - x) > 60 && o.onGround) return i; }
    return -1;
  }
  ACT.lanternDrop = {
    dur: 0.56,
    setup(f, c) {
      const s = stNow(), k = lanFor(s, f), x = k >= 0 ? MK.lan[k] : f.x;
      f.dir = x >= f.x ? 1 : -1;
      c.X = [[0, f.x], [0.56, f.x]];
      c.keys = [[0, f.entry], [0.1, mod('dz_d_kesaRW', { lean: -0.2 }), E.inOutSine], [0.2, mod('dz_d_kesaRS', { lean: -0.3 }), E.outQuart], [0.56, f.P.stance, E.inOut]];
      c.k = k;
      c.ev = [[0.18, (f, c) => { const s = stNow(); if (s && c.k >= 0 && !s.lan[c.k]) { s.lan[c.k] = 10; s.falls.push({ k: 'lantern', x: MK.lan[c.k], t: 0, by: f.id }); if (pres()) { fx.spark(MK.lan[c.k], MK.lanY + 10, 0, 8, 0.6, '255,200,120'); au.swoosh(0.6, f.pan); } } }]];
      label(f, 'Cut the lantern down!');
    },
  };

  const rampY = (x) => clamp((MK.stall + 80 - x) / 150, 0, 1) * 80;
  const rampOk = (f) => { const o = f.opp, d = o.x - f.x; return f.x > MK.stall - 50 && f.x < MK.stall + 120 && o.x < MK.stall - 90 && -d > 140 && -d < 440 && o.onGround; };
  ACT.ramp = {
    dur: 0.98, air: [0.36, 0.84], pass: true,
    setup(f, c) {
      const top = MK.stall - 70, o = f.opp, x2 = o.x + 72, cut = armed(f);
      f.dir = -1;
      c.X = [[0, f.x], [0.34, top], [0.78, x2], [0.98, x2]];
      c.Y = [[0, -rampY(f.x)], [0.34, -80], [0.55, -210], [0.8, 0], [0.98, 0]];
      c.keys = [[0, f.entry], [0.16, pk('dz_d_dashRW'), E.inOutSine], [0.34, mod('jump', { lean: 0.3 }), E.outCubic], [0.58, cut ? pk('dz_d_menW') : pk('ua_airA'), E.outCubic], [0.8, cut ? pk('dz_d_menS') : mod('ua_airB', { f1x: 90 }), E.outQuart], [0.98, f.P.stance, E.inOut]];
      c.face = 'opp';
      c.ev = [[0.8, (f) => { const o = f.opp; if (Math.abs(o.x - f.x) < 150 && !(o.isInv && o.isInv())) { if (guarding(o, f.x)) { o.posture = Math.min(99, (o.posture || 0) + 30); o.vx = -o.dir * 260; } else o.takeHit(cut ? 16 : 13, { dmg: cut ? 16 : 13, post: 30, kb: 320, stun: 0.6, kind: cut ? 'blade' : 'kick', knock: true }, f, (f.x + o.x) / 2, -120, 'body', f.dir); } }]];
      label(f, 'Off the ramp!');
    },
  };
  function drawMarketFloor(ctx, s) {
    const X = MK.stall, t = ND.scene.t;
    if (!s) return;

    if (!s.stall) {
      ctx.fillStyle = '#2a1a0e'; ctx.fillRect(X - 70, -214, 9, 200); ctx.fillRect(X + 62, -214, 9, 200);
      ctx.fillStyle = '#4a3020'; ctx.fillRect(X - 74, -88, 150, 74); ctx.fillStyle = 'rgba(255,214,160,.35)'; ctx.fillRect(X - 74, -88, 150, 3);
      ctx.fillStyle = '#5b3a22'; ctx.beginPath(); ctx.moveTo(X - 92, -202); ctx.lineTo(X + 92, -202); ctx.lineTo(X + 80, -228); ctx.lineTo(X - 80, -228); ctx.fill();
      ctx.fillStyle = '#7c1c1a'; for (let i = 0; i < 4; i++) ctx.fillRect(X - 80 + i * 41, -202, 36, 52 + 3 * Math.sin(t * 2 + i));
      return;
    }

    ctx.save(); ctx.lineCap = 'round';
    ctx.fillStyle = '#7a4e2c'; ctx.beginPath(); ctx.moveTo(X + 86, 4); ctx.lineTo(X - 76, -82); ctx.lineTo(X - 70, -60); ctx.lineTo(X + 96, 22); ctx.fill();
    ctx.strokeStyle = '#2a1a0e'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,214,160,.75)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X + 86, 4); ctx.lineTo(X - 76, -82); ctx.stroke();
    ctx.strokeStyle = 'rgba(42,26,14,.8)'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0.12; k < 1; k += 0.15) { const x = X + 86 - 162 * k, y = 4 - 86 * k; ctx.moveTo(x, y); ctx.lineTo(x + 6, y + 20); } ctx.stroke();
    ctx.strokeStyle = '#2a1a0e'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(X - 60, 0); ctx.lineTo(X - 58, -70); ctx.moveTo(X + 50, 4); ctx.lineTo(X + 74, -40); ctx.stroke();
    ctx.fillStyle = '#7c1c1a'; ctx.beginPath(); ellipse(ctx, X + 10, 14, 40, 10); ctx.fill();
    ctx.restore();
  }
  function drawMarketFront(ctx, s) {
    const a = A(), t = ND.scene.t, X = MK.stall;
    if (!s) return;

    ctx.strokeStyle = 'rgba(30,20,20,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-a - 40, MK.lanY - 40); ctx.quadraticCurveTo(0, MK.lanY + 10, a + 40, MK.lanY - 40); ctx.stroke();
    MK.lan.forEach((x, i) => { if (!s.lan[i]) drawChochin(ctx, x, MK.lanY + 30 + 2 * Math.sin(t * 1.5 + i), 1); });
    for (const q of s.falls) if (q.k === 'lantern') { const k = Math.min(1, q.t / 0.4); drawChochin(ctx, q.x, MK.lanY + 30 + (0 - MK.lanY - 50) * k * k, 1, k * 0.8); }

    const e = s.ev;
    if (e && e.k === 'cart') { const x = e.ph === 0 ? -e.dir * (a + 150 - 60 * Math.min(1, e.t / MK.cart.warn)) : e.x; drawCart(ctx, x, e.dir, t * (e.ph ? 9 : 2)); }
  }
  function drawChochin(ctx, x, y, a, rot) {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); if (rot) ctx.rotate(rot);
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 60); g.addColorStop(0, 'rgba(255,150,80,.35)'); g.addColorStop(1, 'rgba(255,150,80,0)'); ctx.fillStyle = g; ctx.fillRect(-60, -60, 120, 120);
    ctx.fillStyle = '#d23a22'; ctx.beginPath(); ellipse(ctx, 0, 0, 17, 22); ctx.fill();
    ctx.fillStyle = '#1b0f0b'; ctx.fillRect(-10, -25, 20, 5); ctx.fillRect(-10, 20, 20, 5);
    ctx.strokeStyle = 'rgba(255,220,160,.55)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = -12; k <= 12; k += 6) { ctx.moveTo(-16, k); ctx.lineTo(16, k); } ctx.stroke();
    ctx.restore();
  }
  function drawCart(ctx, x, dir, sp) {
    ctx.save(); ctx.translate(x, 0); ctx.scale(dir, 1);
    ctx.fillStyle = '#5b3a22'; ctx.fillRect(-80, -92, 150, 46); ctx.fillStyle = 'rgba(255,214,160,.35)'; ctx.fillRect(-80, -92, 150, 3);
    ctx.fillStyle = '#7c1c1a'; ctx.fillRect(-74, -128, 60, 36); ctx.fillStyle = '#26315c'; ctx.fillRect(-10, -120, 56, 28);
    ctx.strokeStyle = '#2a1a0e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(70, -70); ctx.lineTo(120, -60); ctx.stroke();
    for (const wx of [-50, 40]) { ctx.strokeStyle = '#1e140c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(wx, -30, 28, 0, 6.283); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k < 4; k++) { const an = sp + (k * Math.PI) / 4; ctx.moveTo(wx - Math.cos(an) * 26, -30 - Math.sin(an) * 26); ctx.lineTo(wx + Math.cos(an) * 26, -30 + Math.sin(an) * 26); } ctx.stroke(); }
    ctx.restore();
  }

  if (P.ARENA_SETS.market) P.ARENA_SETS.market = P.ARENA_SETS.market.filter((e) => !(e[1] > 560 && e[1] < 720 && e[0] !== 'cup' && e[0] !== 'bottle'));


  const CS = { gust: { warn: 1.3, blow: 1.7, push: 125 } };
  DEFS.castle = {
    zones: [{ k: 'tiles', x0: -150, x1: 130 }],
    event: {
      first: [14, 20], gap: [22, 32],
      start(s) { const dir = rn() < 0.7 ? 1 : -1; s.ev = { k: 'gust', ph: 0, t: 0, dir }; banner(dir > 0 ? 'A gale towards the edge! Guard!' : 'A gale! Guard!', 0); return true; },
      step(s, e, h, F, ex) {
        e.t += h;
        if (e.ph === 0) { if (e.t >= CS.gust.warn) { e.ph = 1; e.t = 0; if (pres()) au.swoosh(1.1, e.dir * 0.6); } return; }
        if (e.t >= CS.gust.blow) { e.done = 1; return; }
        for (const f of F) {
          if (!movable(f) || ex || LYING[f.state]) continue;
          const k = f.state === 'guard' || f.state === 'block' ? 0.22 : f.onGround ? 1 : 0.6;
          f.x = clamp(f.x + e.dir * CS.gust.push * k * h, -A(), A());
        }
      },
      warn: CS.gust.warn,
    },
    ctx(f, add, s) { const o = f.opp, d = Math.abs(o.x - f.x); if (zoneAt(this, s, f.x, 'tiles') && !(f.dz.arKick > 0) && d > 140 && d < 560) add('tilekick', null, 60, 'tile'); },
    cpu(ai, f, dist, s, lv) { if (zoneAt(this, s, f.x, 'tiles') && dist > 180 && dist < 520 && f.opp.state !== 'atk' && rn() < 0.04 + 0.12 * (lv.str || 0)) return D.envStart(f, 'tilekick', null); return false; },
    shots(s, h, F) {
      for (let i = s.shots.length - 1; i >= 0; i--) {
        const q = s.shots[i], x0 = q.x; q.x += q.dir * 900 * h; q.t += h;
        const o = F.find((f) => f.id !== q.by);
        if (o && !o.dead && (o.x - x0) * q.dir >= 0 && (o.x - q.x) * q.dir <= 0 && o.y > -120) {
          s.shots.splice(i, 1);
          if (o.isInv && o.isInv()) continue;
          if (guarding(o, x0)) { o.posture = Math.min(99, (o.posture || 0) + 10); if (pres()) { au.clang(0.5, o.pan, 1.2); spray(o.x - q.dir * 20, -120, -q.dir, 10, 0.5, '60,66,88'); } continue; }
          if (SCRIPTED[o.state] || (o.dz && o.dz.cine)) continue;
          hurtBy(o, 5, { dmg: 5, stun: 0.55, kb: 120, post: 10 }, F.find((f) => f.id === q.by), q.dir);
          if (pres()) spray(o.x, -130, q.dir, 12, 0.6, '60,66,88');
          continue;
        }
        if (Math.abs(q.x) > A() + 200 || q.t > 1.2) s.shots.splice(i, 1);
      }
    },
    ring: { side: 1, act: 'eave' }, walls: [-1],
    veranda: true,
    drawFloor: drawCastleFloor, drawFront: drawCastleFront,
  };
  ACT.tilekick = {
    dur: 0.5,
    setup(f, c) {
      f.dir = f.opp.x >= f.x ? 1 : -1;
      c.X = [[0, f.x], [0.5, f.x]];
      c.keys = [[0, f.entry], [0.1, mod('ua_frontA', { lean: 0.2 }), E.outCubic], [0.22, mod('ua_frontB', { f1x: 80, f1y: -10, lean: -0.3 }), E.outQuart], [0.5, f.P.stance, E.inOut]];
      c.ev = [[0.2, (f) => { const s = stNow(); if (s) s.shots.push({ x: f.x + f.dir * 40, dir: f.dir, t: 0, by: f.id }); if (pres()) au.swoosh(0.6, f.pan); }]];
      f.dz.arKick = 2.4;
      label(f, 'A roof tile at him!');
    },
  };
  function drawCastleFloor(ctx, s) {
    const a = A(), t = ND.scene.t;

    const z = this.zones[0];
    ctx.fillStyle = 'rgba(70,80,110,.9)'; ctx.strokeStyle = 'rgba(15,18,28,.9)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) { const x = z.x0 + 10 + ((i * 47) % (z.x1 - z.x0 - 20)), y = -30 + ((i * 29) % 90); ctx.save(); ctx.translate(x, y); ctx.rotate(((i * 13) % 7 - 3) * 0.08); ctx.fillRect(-16, -5, 32, 10); ctx.strokeRect(-16, -5, 32, 10); ctx.restore(); }

    ctx.fillStyle = '#05060c'; ctx.fillRect(a + 6, -48, 1400, 700);
    const g = ctx.createLinearGradient(a + 6, 0, a + 600, 0); g.addColorStop(0, 'rgba(60,70,110,.5)'); g.addColorStop(1, 'rgba(10,12,24,0)'); ctx.fillStyle = g; ctx.fillRect(a + 6, -48, 600, 700);
    ctx.fillStyle = '#262c40'; ctx.fillRect(a - 4, -48, 14, 700); ctx.fillStyle = 'rgba(200,212,255,.4)'; ctx.fillRect(a - 4, -48, 3, 700);
    const e = s && s.ev;
    if (e && e.k === 'gust') {
      const k = e.ph === 0 ? e.t / CS.gust.warn : 1;
      ctx.strokeStyle = `rgba(220,228,255,${0.18 + 0.35 * k})`; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < (D.lite ? 5 : 11); i++) { const y = -300 + i * 34, x = ((t * (e.ph ? 1400 : 500) + i * 241) % 2200) - 1100; ctx.moveTo(cam.x + e.dir * x, y); ctx.lineTo(cam.x + e.dir * (x + 120), y + 4); }
      ctx.stroke();
    }
  }
  function drawCastleFront(ctx, s) {
    if (!s) return;
    for (const q of s.shots) { ctx.save(); ctx.translate(q.x, -110); ctx.rotate(q.t * 22 * q.dir); ctx.fillStyle = '#3a4258'; ctx.fillRect(-14, -5, 28, 10); ctx.strokeStyle = '#0d0f18'; ctx.strokeRect(-14, -5, 28, 10); ctx.restore(); }
  }

  D.arenaVeranda = () => { const d = def(); return d && d.veranda ? drawTurret : null; };
  function drawTurret(ctx, p) {
    const K = P.KINDS[p.k], hw = K.w / 2, top = K.top, x = p.x;
    ctx.save();
    ctx.fillStyle = '#3d4256'; ctx.fillRect(x - hw, -top, K.w, top);
    ctx.strokeStyle = 'rgba(10,12,20,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let y = -top + 12; y < 0; y += 12) { ctx.moveTo(x - hw, y); ctx.lineTo(x + hw, y); } ctx.stroke();
    ctx.fillStyle = '#1c2132'; ctx.beginPath(); ctx.moveTo(x - hw - 12, -top); ctx.lineTo(x + hw + 12, -top); ctx.lineTo(x + hw, -top - 14); ctx.lineTo(x - hw, -top - 14); ctx.fill();
    ctx.fillStyle = 'rgba(200,212,255,.45)'; ctx.fillRect(x - hw - 12, -top - 1, K.w + 24, 2);
    for (const sd of [-1, 1]) { ctx.fillStyle = '#5a5f70'; const x0 = x + sd * (hw + 2); ctx.fillRect(sd > 0 ? x0 : x0 - 30, -top / 2, 30, top / 2); }
    ctx.restore();
  }
  P.ARENA_SETS.castle = [['veranda', -620, -12], ['rack', -820, -20], ['stool', -400, -6], ['barrel', 420, -12], ['crate', 540, -16]];



  D.arenaStep = function (h, F) {
    const d = def();
    if (!d) return;
    const s = ars();
    if (!s) return;
    const live = G.phase === 'fight', ex = inEx();
    if (live) s.t += h;
    for (const f of F) { const z = f.dz; if (!z) continue; if (z.arKick > 0) z.arKick -= h; if (z.arBurnT > 0) z.arBurnT -= h; if (z.arCd > 0) z.arCd -= h; }
    obsStep(s, h, F);
    if (d.step) d.step(s, h, F, ex);
    if (d.shots) d.shots(s, h, F);

    for (let i = s.falls.length - 1; i >= 0; i--) {
      const q = s.falls[i]; q.t += h;
      const T = q.k === 'stalk' ? 0.42 : 0.4;
      if (q.t < T) continue;
      s.falls.splice(i, 1);
      const by = F.find((f) => f.id === q.by);
      if (q.k === 'stalk') { fallsOn(F, q.x, 110, { dmg: 9, stun: 0.6, kb: 200, knock: true, post: 20 }, ex, 'Felled by the bamboo!'); s.obs.push({ k: 'log', x: q.x, w: 40, life: 9 }); if (pres()) { au.thud(1.2, cam.pan(q.x)); cam.punch(5); } }
      else { for (const f of F) if (f !== by && underIt(f, q.x, 100) && f.onGround) { if (guarding(f, q.x) || CONTACT[f.state]) { f.posture = Math.min(99, (f.posture || 0) + 14); continue; } hurtBy(f, 6, { dmg: 6, stun: 0.65, kb: 80, post: 12, hurt: 'stagger' }, by, Math.sign(f.x - q.x) || 1); label(f, 'A lantern on the head!'); }
        s.obs.push({ k: 'paper', x: q.x, w: 70, life: 2.6 }); if (pres()) { P.snd && P.snd({ k: 'lantern', x: q.x }, 'paper', 1); spray(q.x, -20, 1, 10, 0.6, '255,168,70'); } }
    }

    if (live) for (const f of F) {
      if (!movable(f) || f.y < -30 || f.dz.arBurnT > 0 || !zoneAt(d, s, f.x, 'fire') || (f.isInv && f.isInv())) continue;
      f.dz.arBurnT = 1.0;
      const z = zoneAt(d, s, f.x, 'fire'), cx = z.x != null ? z.x : (Math.max(z.x0, -A()) + Math.min(z.x1, A())) / 2, kd = Math.sign(f.x - cx) || -Math.sign(f.x) || 1;
      if (CONTACT[f.state] || ex) { chip(f, 2); continue; }
      hurtBy(f, 3, { dmg: 3, stun: 0.28, kb: 260, post: 6 }, f.opp, kd);
      label(f, 'Burned!');
    }

    if (d.cushion) for (const f of F) if (f.state === 'down' && f.st > 0.42 && !f.dead && zoneAt(d, s, f.x, 'drift')) f.setState('getup');

    if (d.event) {
      if (!s.ev) { if (live && s.t >= s.next && !ex && !F.some((f) => f.dead) && d.event.start(s, F) === false) s.next = s.t + 2; }
      else { d.event.step(s, s.ev, h, F, ex); if (s.ev && s.ev.done) { s.ev = null; s.evStalk = undefined; s.n++; s.next = s.t + d.event.gap[0] + rn() * (d.event.gap[1] - d.event.gap[0]); } }
    }
  };

  D.arenaCtx = function (f, hold, add) {
    const d = def(), s = stNow();
    if (!d || !f.opp || !s) return;
    if (d.ctx) d.ctx(f, add, s);
    if (wallBehind(d, f) && Math.abs(f.opp.x - f.x) < 160 && Math.abs(f.opp.x - f.x) > 50) add('wallflip', null, -1, 'wall');
  };
  D.arenaNoWall = (side) => { const d = def(); return !!(d && d.ring && d.ring.side === side); };

  const wallBehind = (d, f) => { const w = Math.sign(f.x) || 1; return Math.abs(f.x) > A() - 110 && (f.opp.x - f.x) * w < 0 && !!(d.walls && d.walls.indexOf(w) >= 0) && !(d.ring && d.ring.side === w); };

  const upd0 = FP.update;
  FP.update = function (dt) {
    const d = this.dz && P.live ? def() : null;
    if (!d) return upd0.call(this, dt);
    const z = this.dz, pre = { x: this.x, vx: this.vx, state: this.state, wb: this.wallBounced };
    if (z.arSplatT > 0) z.arSplatT -= dt;
    if (z.arPoolT > 0) z.arPoolT -= dt;

    if (this.state === 'launch' && Math.abs(this.x) > A() - 160 && ((d.ring && Math.sign(this.x) === d.ring.side) || z.arSplatT > 0)) this.wallBounced = true;
    const r = upd0.call(this, dt);
    const s = stNow();
    if (this.state !== 'denv' && !this.dead) {
      const sd = Math.sign(this.x);

      if (d.ring && sd === d.ring.side && Math.abs(this.x) >= A() - 6 && pre.vx * sd > 90 && !(z.arPoolT > 0) &&
        (this.state === 'launch' || this.state === 'hurt' || this.state === 'stagger' || this.state === 'down' || this.state === 'gbreak')) D.envStart(this, d.ring.act, null);

      else if (!pre.wb && this.wallBounced && this.state === 'launch' && this.st === 0 && d.walls && d.walls.indexOf(sd) >= 0) D.envStart(this, 'splat', null);
      else if (this.onGround && this.y > -2 && s) {

        const k = slowAt(d, s, this.x);
        if (k && (this.state === 'move' || this.state === 'dodge')) this.x = pre.x + (this.x - pre.x) * k;
        else if (SLIDE[this.state] && slickAt(d, s, this.x)) this.x = clamp(this.x + (this.x - pre.x) * 0.55, -A(), A());

        const e = s.ev;
        if (e && e.k === 'gust' && e.ph === 1 && this.state === 'dodge') { const dx = this.x - pre.x; this.x = clamp(pre.x + dx * (dx * e.dir > 0 ? 1.3 : 0.6), -A(), A()); }
      }
      barrierBlock(d, s, this, pre);
    }
    return r;
  };

  {
    const th0 = FP.takeHit;
    FP.takeHit = function (raw, a, from, x, y, part, kdir) {
      const r = th0.apply(this, arguments);
      const d = this.dz && P.live ? def() : null;
      if (d && !this.dead && this.state === 'hurt' && this.onGround && a && (a.heavyClass || raw >= 14) && slickAt(d, stNow(), this.x)) { this.setState('down'); this.vx = (kdir || -this.dir) * 160; label(this, 'Slipped!'); }
      return r;
    };
  }


  const AP = ND.AI && ND.AI.prototype;
  if (AP && AP.decide) {
    const dec0 = AP.decide;
    AP.decide = function (dist, fwd) {
      const me = this.me, d = me && me.dz && P.live ? def() : null;
      if (d && (me.state === 'move' || me.state === 'land' || me.state === 'guard') && !P.held(me) && cpuArena(this, me, dist, d)) return;
      return dec0.call(this, dist, fwd);
    };

    const up0 = AP.update;
    AP.update = function (dt) {
      const s = this.me && this.me.dz ? stNow() : null, e = s && s.ev;
      if (!(e && e.k === 'petals' && e.ph === 1) || !this.lv || typeof this.lv !== 'object') return up0.apply(this, arguments);
      const lv = this.lv; this.lv = blindLv(lv);
      try { return up0.apply(this, arguments); } finally { this.lv = lv; }
    };
  }
  function cpuArena(ai, f, dist, d) {
    const s = stNow(), o = f.opp, lv = ai.lv || {}, z = f.dz, sm = lv.smart || 0;
    if (!s || !o || o.dead) return false;
    const e = s.ev, ex = inEx();

    if (e && z.arPlanN !== s.n) { z.arPlanN = s.n; const r = rn(); z.arPlan = r < 0.2 + 0.55 * sm ? 1 : r < 0.35 + 0.6 * sm ? 2 : 0; }
    if (e && z.arPlan > 0) {

      if (d.event.front) {
        const sp = e.speed, ahead = e.ph === 1 ? (f.x - e.x) * e.dir : (f.x - e.x) * e.dir - sp * (d.event.warn - e.t);
        const hits = e.k !== 'surge' || inWater(f.x);
        if (hits && z.arPlan === 1 && ahead > 0 && ahead < 140) { ai.tap('up'); return true; }
        if (hits && z.arPlan === 2 && ahead > 0 && ahead < 260) { guardFor(ai, 0.4); return true; }
      }

      if (e.w && e.ph === 0 && Math.abs(f.x - e.x) < e.w / 2 + 40 && e.t > 0.2) { const away = Math.sign(f.x - e.x) || (Math.abs(f.x + 60) < A() ? 1 : -1); ai.go(away, 0.3); return true; }

      if (e.k === 'gust' && (e.ph === 1 || e.t > CS.gust.warn - 0.25) && !ex) { guardFor(ai, 0.3); return true; }
    }
    if (ex) return false;

    if (zoneAt(d, s, f.x, 'fire') && rn() < 0.4 + 0.5 * sm) { ai.go(-Math.sign(f.x) || 1, 0.25); return true; }

    if (d.ring && Math.sign(f.x) === d.ring.side && Math.abs(f.x) > A() - 230 && (o.x - f.x) * d.ring.side < 0 && rn() < 0.12 + 0.4 * sm) {
      if (dist < 150 && o.state !== 'atk' && D.PASS && rn() < 0.5) { ai.moveDir(-d.ring.side); ai.tap('dodge'); return true; }
      if (dist > 120) { ai.go(-d.ring.side, 0.25); return true; }
    }
    if (z.arCd > 0 || o.state === 'atk') return false;

    if (wallBehind(d, f) && dist < 150 && dist > 50 && rn() < 0.03 + 0.09 * sm) { if (D.envStart(f, 'wallflip', null)) { z.arCd = 3; return true; } }

    if (d.cpu && rn() < 0.35) { if (d.cpu(ai, f, dist, s, lv)) { z.arCd = 3 + rn() * 2; return true; } z.arCd = 0.3; }
    return false;
  }
  const guardFor = (ai, t) => { ai.setHeld('left', false); ai.setHeld('right', false); ai.move = 0; ai.setHeld('guard', true); ai.guardUntil = ai.t + t; };


  const duelFight = () => !!(P.live && G.F && G.F[0] && G.F[0].dz);


  D.arenaDraw = function (ctx, layer) {
    const d = def();
    if (!d) return;
    const st = stNow();
    if (layer === 'back') { if (d.drawBack) d.drawBack(ctx, st); return; }
    ctx.save();
    try { if (d.drawFront) d.drawFront.call(d, ctx, st); drawSheets(ctx); drawSpray(ctx); drawBanner(ctx); } finally { ctx.restore(); }
  };


  D.arenaFloor = function (ctx) {
    const d = duelFight() ? def() : null;
    if (d && !sinkHooked) hookSink();
    if (!d || !d.drawFloor) return;
    ctx.save(); try { d.drawFloor.call(d, ctx, stNow()); } finally { ctx.restore(); }
  };


  const outOf = (f) => (f.state === 'denv' && f.dz && f.dz.env && ACT[f.dz.env.a] && ACT[f.dz.env.a].out ? f.dz.env : null);
  let sinkHooked = false;
  function hookSink() {
    if (sinkHooked) return;
    sinkHooked = true;
    const dr0 = FP.draw, sh0 = FP.drawShadow;
    FP.draw = function (ctx, reflect) {
      const c = this.dz ? outOf(this) : null;
      if (!c) return dr0.apply(this, arguments);
      if (reflect) return;
      const dim = c.dim && c.t > c.dim[0] && c.t < c.dim[1];
      if (!(c.sink > 0) && !dim) return dr0.apply(this, arguments);
      ctx.save(); if (c.sink > 0) ctx.translate(0, c.sink); if (dim) ctx.globalAlpha *= 0.35;
      try { return dr0.apply(this, arguments); } finally { ctx.restore(); }
    };
    if (sh0) FP.drawShadow = function () { if (this.dz && outOf(this)) return; return sh0.apply(this, arguments); };
  }

  {
    const fu0 = fx.update;
    fx.update = function (dt) {
      const r = fu0.apply(this, arguments);
      if (SPRAY.length || SHEETS.length) sprayTick(dt);
      if (BANNER.t > 0) BANNER.t -= dt;
      const d = duelFight() && !G.paused && dt > 0 ? def() : null;
      const sv = d && G.flags && G.flags.ar && G.flags.ar.ev;
      if (sv && sv.k === 'surge') {
        if (sv.ph === 1 && sv.x < A()) for (let i = 0; i < 2; i++) if (NM.random() < dt * 30) spray(sv.x, -40 + NM.random() * 80, 1, 2, 0.9);
        if (sv.ph === 0 && NM.random() < dt * 8) { spray(WF.x0 + NM.random() * 160, -44, NM.random() < 0.5 ? 1 : -1, 2, 0.7); if (NM.random() < dt * 6) cam.punch(1.5); }
      }

      if (d && d.wet) for (const f of G.F) if (f && !f.dead && f.onGround && f.y > -4 && d.wet(f.x) && Math.abs(f.vx) > 160 && NM.random() < dt * 14) spray(f.x - Math.sign(f.vx) * 6, 0, Math.sign(f.vx) || 1, 3, 0.35);
      return r;
    };
  }

  if (D.envUi && D.envUi.icons) {
    const SVG = (b) => `<svg viewBox="0 0 24 24" width="62%" height="62%" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${b}</svg>`;
    Object.assign(D.envUi.icons, {
      water: SVG('<path d="M3 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0M6 12l3-6M12 11l1-7M17 12l3-5"/>'),
      snow: SVG('<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9M9 4l3 2 3-2M9 20l3-2 3 2"/>'),
      mud: SVG('<path d="M3 18c3-3 6-1 9-3s6-2 9 1M7 12l2-5M13 11l1-6M18 12l2-4"/>'),
      fire: SVG('<path d="M12 21c-4 0-6-3-6-6 0-4 4-6 4-10 2 2 3 4 3 6 1-1 2-2 2-4 2 2 3 5 3 8 0 3-2 6-6 6z"/>'),
      bamboo: SVG('<path d="M9 3v18M15 6v15M9 8h0M7 9h4M7 15h4M13 12h4M13 18h4M15 6l4-3"/>'),
      tile: SVG('<path d="M4 15l6-8 10 4-6 8z M4 15l10 4M10 7l4 12"/>'),
    });
  }


  if (D.TR) Object.assign(D.TR, {
    'Into the pool!': ['Havuza düştü!', '¡Al estanque!', 'Para o lago!', 'В омут!', 'Ins Becken!', 'Dans le bassin !', 'Nella pozza!', 'Do wody!', 'Ke kolam!', 'Rơi xuống hồ!', 'ตกน้ำ!', 'कुंड में!', 'إلى البركة!', '掉进水潭！', '掉進水潭！', '滝つぼへ！', '물웅덩이로!'],
    'Swept by the surge!': ['Dalga sürükledi!', '¡Arrastrado por la ola!', 'Arrastado pela onda!', 'Сбит волной!', 'Von der Welle erfasst!', 'Emporté par la vague !', "Travolto dall'onda!", 'Porwany przez falę!', 'Terseret gelombang!', 'Bị sóng cuốn!', 'โดนคลื่นซัด!', 'लहर बहा ले गई!', 'جرفته الموجة!', '被浪卷走！', '被浪捲走！', '波にさらわれた！', '파도에 휩쓸림!'],
    'Water in the face!': ['Yüzüne su!', '¡Agua a la cara!', 'Água na cara!', 'Вода в лицо!', 'Wasser ins Gesicht!', "De l'eau en plein visage !", 'Acqua in faccia!', 'Woda w twarz!', 'Air ke wajah!', 'Tạt nước vào mặt!', 'สาดน้ำใส่หน้า!', 'मुँह पर पानी!', 'ماء في الوجه!', '泼水！', '潑水！', '顔に水しぶき！', '얼굴에 물!'],
    'Over the wave!': ['Dalganın üstünden!', '¡Sobre la ola!', 'Por cima da onda!', 'Над волной!', 'Über die Welle!', 'Par-dessus la vague !', "Sopra l'onda!", 'Nad falą!', 'Melompati ombak!', 'Nhảy qua sóng!', 'กระโดดข้ามคลื่น!', 'लहर के ऊपर से!', 'فوق الموجة!', '跃过浪头！', '躍過浪頭！', '波を飛び越えた！', '파도를 넘었다!'],
    'Braced against the surge': ['Dalgaya karşı direndi', 'Aguanta la ola', 'Resiste à onda', 'Устоял против волны', 'Hält der Welle stand', 'Tient bon face à la vague', "Resiste all'onda", 'Opiera się fali', 'Menahan gelombang', 'Trụ vững trước sóng', 'ยืนต้านคลื่น', 'लहर के आगे डटा', 'صمد أمام الموجة', '顶住浪头', '頂住浪頭', '波に耐えた', '파도를 버텼다'],
    'The falls surge! Jump it or guard!': ['Şelale coşuyor! Atla ya da savun!', '¡La cascada crece! ¡Salta o defiende!', 'A cascata transborda! Pule ou defenda!', 'Водопад бурлит! Прыгай или блокируй!', 'Der Wasserfall schwillt! Spring oder blocke!', 'La cascade déferle ! Saute ou garde !', 'La cascata si gonfia! Salta o para!', 'Wodospad wzbiera! Skacz lub blokuj!', 'Air terjun meluap! Lompat atau tangkis!', 'Thác nước dâng! Nhảy hoặc đỡ!', 'น้ำตกทะลัก! กระโดดหรือป้องกัน!', 'झरना उफना! कूदो या बचाव करो!', 'الشلال يفيض! اقفز أو احمِ نفسك!', '瀑布涌来！跳起或格挡！', '瀑布湧來！跳起或格擋！', '滝があふれる！跳ぶかガード！', '폭포가 넘친다! 뛰거나 막아라!'],
    'Snow in the face!': ['Yüzüne kar!', '¡Nieve a la cara!', 'Neve na cara!', 'Снег в лицо!', 'Schnee ins Gesicht!', 'De la neige en plein visage !', 'Neve in faccia!', 'Śnieg w twarz!', 'Salju ke wajah!', 'Tuyết vào mặt!', 'สาดหิมะใส่หน้า!', 'मुँह पर बर्फ़!', 'ثلج في الوجه!', '雪扑面！', '雪撲面！', '顔に雪！', '얼굴에 눈!'],
    'Mud in the face!': ['Yüzüne çamur!', '¡Barro a la cara!', 'Lama na cara!', 'Грязь в лицо!', 'Schlamm ins Gesicht!', 'De la boue en plein visage !', 'Fango in faccia!', 'Błoto w twarz!', 'Lumpur ke wajah!', 'Bùn vào mặt!', 'สาดโคลนใส่หน้า!', 'मुँह पर कीचड़!', 'طين في الوجه!', '泥巴扑面！', '泥巴撲面！', '顔に泥！', '얼굴에 진흙!'],
    'Embers in the face!': ['Yüzüne kor!', '¡Brasas a la cara!', 'Brasas na cara!', 'Угли в лицо!', 'Glut ins Gesicht!', 'Des braises en plein visage !', 'Braci in faccia!', 'Żar w twarz!', 'Bara ke wajah!', 'Than hồng vào mặt!', 'เถ้าถ่านใส่หน้า!', 'मुँह पर अंगारे!', 'جمر في الوجه!', '火星扑面！', '火星撲面！', '顔に火の粉！', '얼굴에 불씨!'],
    'Wall splat!': ['Duvara yapıştı!', '¡Contra la pared!', 'Colado na parede!', 'Впечатан в стену!', 'An die Wand!', 'Écrasé contre le mur !', 'Spiaccicato al muro!', 'Na ścianę!', 'Menempel di dinding!', 'Dính tường!', 'กระแทกกำแพง!', 'दीवार से चिपका!', 'ارتطم بالجدار!', '撞墙！', '撞牆！', '壁に叩きつけ！', '벽에 처박힘!'],
    'Splatted into the fire!': ['Ateşe yapıştı!', '¡Contra el fuego!', 'Jogado no fogo!', 'Впечатан в огонь!', 'Ins Feuer geschleudert!', 'Projeté dans le feu !', 'Scaraventato nel fuoco!', 'W ogień!', 'Terlempar ke api!', 'Văng vào lửa!', 'กระแทกเข้ากองไฟ!', 'आग में जा गिरा!', 'ارتطم بالنار!', '撞进火里！', '撞進火裡！', '炎に叩きつけ！', '불길에 처박힘!'],
    'Up the wall and over!': ['Duvardan yukarı, üstünden aştı!', '¡Por la pared y por encima!', 'Pela parede e por cima!', 'По стене и через него!', 'Die Wand hoch und drüber!', 'Sur le mur et par-dessus !', 'Su per il muro e oltre!', 'Po ścianie i nad nim!', 'Naik dinding dan melompatinya!', 'Leo tường và lộn qua!', 'วิ่งขึ้นกำแพงแล้วตีลังกาข้าม!', 'दीवार पर चढ़कर ऊपर से!', 'على الجدار ومن فوقه!', '蹬墙翻越！', '蹬牆翻越！', '壁を駆け上がり飛び越えた！', '벽을 타고 넘었다!'],
    'Buried in snow!': ['Kara gömüldü!', '¡Enterrado en la nieve!', 'Soterrado na neve!', 'Засыпан снегом!', 'Im Schnee begraben!', 'Enseveli sous la neige !', 'Sepolto nella neve!', 'Zasypany śniegiem!', 'Terkubur salju!', 'Bị vùi trong tuyết!', 'จมกองหิมะ!', 'बर्फ़ में दबा!', 'دُفن في الثلج!', '被雪埋住！', '被雪埋住！', '雪に埋まった！', '눈에 파묻힘!'],
    'Through the shop front!': ['Dükkânın içinden!', '¡A través del escaparate!', 'Através da vitrine!', 'Сквозь лавку!', 'Durch den Laden!', 'À travers la boutique !', 'Attraverso la bottega!', 'Przez sklep!', 'Menembus toko!', 'Xuyên qua cửa hàng!', 'ทะลุหน้าร้าน!', 'दुकान के आर-पार!', 'عبر واجهة المتجر!', '撞穿店面！', '撞穿店面！', '店先を突き破った！', '가게를 뚫고!'],
    'Hanging from the eave!': ['Saçağa asıldı!', '¡Colgado del alero!', 'Pendurado no beiral!', 'Висит на карнизе!', 'Hängt an der Traufe!', "Suspendu à l'avant-toit !", "Appeso alla grondaia!", 'Wisi na okapie!', 'Bergantung di atap!', 'Treo trên mái hiên!', 'ห้อยชายคา!', 'छज्जे से लटका!', 'معلّق بالحافة!', '挂在屋檐上！', '掛在屋簷上！', '軒にぶら下がった！', '처마에 매달림!'],
    'Cut through!': ['Kesip geçti!', '¡Cortado!', 'Cortou!', 'Разрублено!', 'Durchgehauen!', 'Tranché net !', 'Tagliato!', 'Przecięte!', 'Terbelah!', 'Chém đứt!', 'ฟันขาด!', 'काट डाला!', 'قُطع!', '一刀两断！', '一刀兩斷！', '断ち切った！', '베어 넘겼다!'],
    'Felled by the bamboo!': ['Bambu devirdi!', '¡Derribado por el bambú!', 'Derrubado pelo bambu!', 'Сбит бамбуком!', 'Vom Bambus gefällt!', 'Abattu par le bambou !', 'Abbattuto dal bambù!', 'Powalony bambusem!', 'Tertimpa bambu!', 'Bị tre đè!', 'โดนไผ่ล้มทับ!', 'बाँस ने गिराया!', 'أسقطه الخيزران!', '被竹子砸倒！', '被竹子砸倒！', '竹に倒された！', '대나무에 깔림!'],
    'Bamboo cut down!': ['Bambu kesildi!', '¡Bambú talado!', 'Bambu cortado!', 'Бамбук срублен!', 'Bambus gefällt!', 'Bambou abattu !', 'Bambù abbattuto!', 'Bambus ścięty!', 'Bambu ditebang!', 'Chém đổ cây tre!', 'ฟันไผ่ล้ม!', 'बाँस काट गिराया!', 'قُطع الخيزران!', '砍倒竹子！', '砍倒竹子！', '竹を切り倒した！', '대나무를 베었다!'],
    'Lightning! A bamboo will fall!': ['Yıldırım! Bir bambu devrilecek!', '¡Un rayo! ¡Caerá un bambú!', 'Raio! Um bambu vai cair!', 'Молния! Бамбук падает!', 'Blitz! Ein Bambus fällt gleich!', 'La foudre ! Un bambou va tomber !', 'Fulmine! Cadrà un bambù!', 'Piorun! Bambus zaraz runie!', 'Petir! Bambu akan tumbang!', 'Sét đánh! Cây tre sắp đổ!', 'ฟ้าผ่า! ไผ่กำลังจะล้ม!', 'बिजली! बाँस गिरने वाला है!', 'برق! خيزرانة ستسقط!', '雷击！竹子要倒了！', '雷擊！竹子要倒了！', '落雷！竹が倒れる！', '번개! 대나무가 쓰러진다!'],
    'Snow is sliding off the pines!': ['Çamlardan kar kayıyor!', '¡La nieve cae de los pinos!', 'A neve desliza dos pinheiros!', 'С сосен сползает снег!', 'Schnee rutscht von den Kiefern!', 'La neige glisse des pins !', 'La neve scivola dai pini!', 'Śnieg zsuwa się z sosen!', 'Salju meluncur dari pinus!', 'Tuyết trượt khỏi rặng thông!', 'หิมะกำลังร่วงจากต้นสน!', 'चीड़ से बर्फ़ फिसल रही है!', 'الثلج ينزلق من الصنوبر!', '松树上的雪滑落了！', '松樹上的雪滑落了！', '松から雪が落ちてくる！', '소나무에서 눈이 쏟아진다!'],
    'A burning beam is coming down!': ['Yanan bir kiriş düşüyor!', '¡Cae una viga en llamas!', 'Uma viga em chamas vai cair!', 'Падает горящая балка!', 'Ein brennender Balken stürzt herab!', 'Une poutre en feu va tomber !', 'Sta cadendo una trave in fiamme!', 'Płonąca belka spada!', 'Balok terbakar akan jatuh!', 'Xà nhà đang cháy sắp rơi!', 'คานไฟไหม้กำลังร่วง!', 'जलती कड़ी गिर रही है!', 'عارضة مشتعلة تسقط!', '燃烧的横梁要掉下来了！', '燃燒的橫樑要掉下來了！', '燃える梁が落ちてくる！', '불타는 들보가 떨어진다!'],
    'Hit by the beam!': ['Kiriş çarptı!', '¡Golpeado por la viga!', 'Atingido pela viga!', 'Задет балкой!', 'Vom Balken getroffen!', 'Touché par la poutre !', 'Colpito dalla trave!', 'Trafiony belką!', 'Tertimpa balok!', 'Bị xà đè!', 'โดนคานทับ!', 'कड़ी से टकराया!', 'أصابته العارضة!', '被横梁砸中！', '被橫樑砸中！', '梁が直撃！', '들보에 맞음!'],
    'Burned!': ['Yandı!', '¡Quemado!', 'Queimado!', 'Обжёгся!', 'Verbrannt!', 'Brûlé !', 'Bruciato!', 'Poparzony!', 'Terbakar!', 'Bị bỏng!', 'โดนไฟลวก!', 'जल गया!', 'احترق!', '烧伤！', '燒傷！', '火傷！', '화상!'],
    'A cart is rolling down the street!': ['Sokaktan bir araba geliyor!', '¡Un carro baja por la calle!', 'Uma carroça desce a rua!', 'По улице катится тележка!', 'Ein Karren rollt die Straße herab!', 'Une charrette dévale la rue !', 'Un carretto scende per la strada!', 'Wózek toczy się ulicą!', 'Gerobak meluncur di jalan!', 'Một chiếc xe đẩy lao xuống phố!', 'รถเข็นกำลังไหลลงถนน!', 'गली में ठेला लुढ़क रहा है!', 'عربة تتدحرج في الشارع!', '推车冲过街道！', '推車衝過街道！', '屋台車が転がってくる！', '수레가 굴러온다!'],
    'Over the cart!': ['Arabanın üstünden!', '¡Sobre el carro!', 'Por cima da carroça!', 'Над тележкой!', 'Über den Karren!', 'Par-dessus la charrette !', 'Sopra il carretto!', 'Nad wózkiem!', 'Melompati gerobak!', 'Nhảy qua xe đẩy!', 'กระโดดข้ามรถเข็น!', 'ठेले के ऊपर से!', 'فوق العربة!', '跃过推车！', '躍過推車！', '車を飛び越えた！', '수레를 넘었다!'],
    'Braced against the cart': ['Arabaya karşı direndi', 'Aguanta el carro', 'Resiste à carroça', 'Устоял против тележки', 'Hält dem Karren stand', 'Tient bon face à la charrette', 'Resiste al carretto', 'Opiera się wózkowi', 'Menahan gerobak', 'Trụ vững trước xe đẩy', 'ยืนต้านรถเข็น', 'ठेले के आगे डटा', 'صمد أمام العربة', '顶住推车', '頂住推車', '車に耐えた', '수레를 버텼다'],
    'Run over by the cart!': ['Araba ezdi geçti!', '¡Arrollado por el carro!', 'Atropelado pela carroça!', 'Сбит тележкой!', 'Vom Karren überrollt!', 'Renversé par la charrette !', 'Travolto dal carretto!', 'Potrącony przez wózek!', 'Tertabrak gerobak!', 'Bị xe đẩy tông!', 'โดนรถเข็นชน!', 'ठेले ने कुचल दिया!', 'دهسته العربة!', '被推车撞倒！', '被推車撞倒！', '車にはねられた！', '수레에 치였다!'],
    'Cut the lantern down!': ['Feneri kesip düşürdü!', '¡Farol cortado!', 'Lanterna cortada!', 'Срубил фонарь!', 'Laterne abgeschnitten!', 'Lanterne tranchée !', 'Lanterna tagliata!', 'Latarnia ścięta!', 'Lentera dipotong jatuh!', 'Chém rơi đèn lồng!', 'ฟันโคมตก!', 'लालटेन काट गिराई!', 'قطع الفانوس!', '砍落灯笼！', '砍落燈籠！', '提灯を斬り落とした！', '등불을 베어 떨궜다!'],
    'A lantern on the head!': ['Kafasına fener!', '¡Un farol en la cabeza!', 'Lanterna na cabeça!', 'Фонарь на голову!', 'Laterne auf den Kopf!', 'Une lanterne sur la tête !', 'Una lanterna in testa!', 'Latarnia na głowę!', 'Lentera menimpa kepala!', 'Đèn lồng rơi trúng đầu!', 'โคมตกใส่หัว!', 'सिर पर लालटेन!', 'فانوس على الرأس!', '灯笼砸头！', '燈籠砸頭！', '提灯が頭に！', '머리에 등불!'],
    'Through the stall!': ['Tezgâhın içinden!', '¡A través del puesto!', 'Através da banca!', 'Сквозь прилавок!', 'Durch den Stand!', "À travers l'étal !", 'Attraverso la bancarella!', 'Przez stragan!', 'Menembus lapak!', 'Xuyên qua sạp!', 'ทะลุแผงลอย!', 'ठेले के आर-पार!', 'عبر الكشك!', '撞穿摊位！', '撞穿攤位！', '屋台を突き破った！', '노점을 뚫고!'],
    'Off the ramp!': ['Rampadan atladı!', '¡Desde la rampa!', 'Da rampa!', 'С трамплина!', 'Von der Rampe!', 'Depuis la rampe !', 'Dalla rampa!', 'Z rampy!', 'Dari lereng!', 'Bật khỏi dốc!', 'กระโดดจากทางลาด!', 'ढलान से छलाँग!', 'من المنحدر!', '借坡飞跃！', '借坡飛躍！', '坂から跳んだ！', '경사로에서 도약!'],
    'A gale towards the edge! Guard!': ['Kenara doğru fırtına! Savun!', '¡Un vendaval hacia el borde! ¡Defiende!', 'Ventania para a beira! Defenda!', 'Ветер к краю! Блокируй!', 'Sturm zur Kante! Blocken!', 'Une rafale vers le bord ! Garde !', 'Raffica verso il bordo! Para!', 'Wichura ku krawędzi! Blokuj!', 'Badai ke arah tepi! Tangkis!', 'Gió giật về phía mép! Đỡ!', 'ลมกระโชกไปทางขอบ! ป้องกัน!', 'किनारे की ओर आँधी! बचाव करो!', 'عاصفة نحو الحافة! احمِ نفسك!', '狂风吹向屋檐！格挡！', '狂風吹向屋簷！格擋！', '縁へ突風！ガード！', '가장자리로 돌풍! 막아라!'],
    'A gale! Guard!': ['Fırtına! Savun!', '¡Un vendaval! ¡Defiende!', 'Ventania! Defenda!', 'Ветер! Блокируй!', 'Sturm! Blocken!', 'Une rafale ! Garde !', 'Raffica! Para!', 'Wichura! Blokuj!', 'Badai! Tangkis!', 'Gió giật! Đỡ!', 'ลมกระโชก! ป้องกัน!', 'आँधी! बचाव करो!', 'عاصفة! احمِ نفسك!', '狂风！格挡！', '狂風！格擋！', '突風！ガード！', '돌풍! 막아라!'],
    'A roof tile at him!': ['Ona kiremit attı!', '¡Una teja hacia él!', 'Uma telha nele!', 'Черепицей в него!', 'Ein Dachziegel auf ihn!', 'Une tuile sur lui !', 'Una tegola contro di lui!', 'Dachówką w niego!', 'Genteng ke arahnya!', 'Đá ngói vào hắn!', 'เตะกระเบื้องใส่!', 'उस पर खपरैल!', 'قرميدة نحوه!', '踢瓦片砸他！', '踢瓦片砸他！', '瓦を蹴りつけた！', '기와를 날렸다!'],
    'Slipped!': ['Kaydı!', '¡Resbaló!', 'Escorregou!', 'Поскользнулся!', 'Ausgerutscht!', 'Glissade !', 'Scivolato!', 'Poślizg!', 'Terpeleset!', 'Trượt chân!', 'ลื่น!', 'फिसल गया!', 'انزلق!', '滑倒！', '滑倒！', '滑った！', '미끄러짐!'],
    'A petal storm: hard to read his blade!': ['Yaprak fırtınası: kılıcını okumak zor!', 'Tormenta de pétalos: ¡difícil leer su espada!', 'Tempestade de pétalas: difícil ler a lâmina!', 'Буря лепестков: клинок не разглядеть!', 'Blütensturm: seine Klinge ist schwer zu lesen!', 'Tempête de pétales : sa lame est dure à lire !', 'Tempesta di petali: difficile leggere la lama!', 'Burza płatków: trudno dostrzec ostrze!', 'Badai kelopak: sulit membaca pedangnya!', 'Bão cánh hoa: khó đọc đường kiếm!', 'พายุกลีบดอก: อ่านดาบยาก!', 'पंखुड़ियों का तूफ़ान: तलवार पढ़ना मुश्किल!', 'عاصفة بتلات: يصعب قراءة سيفه!', '花瓣风暴：难以看清刀路！', '花瓣風暴：難以看清刀路！', '花吹雪：太刀筋が読めない！', '꽃잎 폭풍: 칼끝이 안 보인다!'],
  });
})(window.ND);
