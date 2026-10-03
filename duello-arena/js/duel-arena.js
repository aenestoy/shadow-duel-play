














(function (ND) {
  'use strict';
  const FLAG = (() => { try { return !/[?&]duel=0(&|$)/.test(location.search || ''); } catch (e) { return true; } })();
  if (!FLAG || !ND.duel || !ND.props || !ND.duel.envACT) return;
  const Math = ND.DM || globalThis.Math;
  const NM = globalThis.Math;
  const D = ND.duel, P = ND.props, G = ND.game, PO = ND.POSES, pose = ND.pose, fx = ND.fx, au = ND.audio, cam = ND.cam, E = ND.M.ease;
  const ACT = D.envACT, S = P.S, FP = ND.Fighter.prototype;
  const OFF = /[?&]arena=0(&|$)/.test(location.search || '') || /[?&]ground=0(&|$)/.test(location.search || '');
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const pk = (n) => PO[n] || PO.stance;
  const mod = (n, o) => Object.assign(pose.copy(pk(n)), o);
  const isCpu = (f) => !!(G.ais && G.ais.some((a) => a && a.me === f));
  const aiOf = (f) => (G.ais ? G.ais.find((a) => a && a.me === f) : null);
  const label = (f, s) => { if (D.envLabel) D.envLabel(f, s); };
  const pres = () => !G.simOnly;
  const inEx = () => !!(D.envExchange && D.envExchange());
  const A = () => ND.ARENA;

  const DZ0 = { arKick: 0, arPoolT: 0, arPlan: -1, arPlanN: -1, arBlind: 0 };
  {
    const rs0 = FP.reset;
    FP.reset = function () { const r = rs0.apply(this, arguments); if (this.dz) Object.assign(this.dz, DZ0); return r; };
  }


  const SCRIPTED = { denv: 1, dseq: 1, dbind: 1, lock: 1, dpick: 1, win: 1 };
  const LYING = { down: 1, getup: 1 };
  const movable = (f) => f && f.dz && !f.dead && !SCRIPTED[f.state] && !f.dz.cine;





  const DEFS = {};
  const arenaId = () => (P.live && S.arena) || null;
  const def = () => { const id = arenaId(); return id && !OFF ? DEFS[id] || null : null; };
  function ars() {
    const Fl = G.flags;
    if (!Fl) return null;
    let s = Fl.ar;
    if (!s || s.id !== S.arena) {
      const d = DEFS[S.arena];
      s = Fl.ar = { id: S.arena, t: 0, ev: null, next: 0, n: 0 };
      s.next = d && d.firstAt ? d.firstAt[0] + rn(s) * (d.firstAt[1] - d.firstAt[0]) : 1e9;
    }
    return s;
  }

  const rn = () => ND.rng.next();
  D.arenaState = ars;


  const SPRAY = [];
  function spray(x, y, dir, n, power) {
    if (!pres()) return;
    for (let i = 0; i < n; i++) {
      const a = -0.3 - NM.random() * 0.95, sp = (300 + NM.random() * 520) * power;
      SPRAY.push({ x: x + (NM.random() - 0.5) * 16, y: y - NM.random() * 10, vx: Math.cos(a) * sp * dir, vy: Math.sin(a) * sp, life: 0.45 + NM.random() * 0.35, max: 0.8, r: 2.4 + NM.random() * 3.8 });
    }
    if (SPRAY.length > 160) SPRAY.splice(0, SPRAY.length - 160);
  }

  const SHEETS = [];
  function drawSheets(ctx) {
    for (let i = SHEETS.length - 1; i >= 0; i--) {
      const q = SHEETS[i], k = q.t / 0.3;
      if (k >= 1) { SHEETS.splice(i, 1); continue; }
      const L = 70 + 230 * E.outCubic(k), a = 0.8 * (1 - k * k);
      ctx.save(); ctx.translate(q.x, -6); ctx.scale(q.dir, 1);
      const g = ctx.createLinearGradient(0, 0, L, 0); g.addColorStop(0, `rgba(230,248,252,${a})`); g.addColorStop(1, 'rgba(230,248,252,0)');
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
    ctx.save(); ctx.fillStyle = 'rgba(225,245,250,.85)'; ctx.beginPath();
    for (const p of SPRAY) { const r = p.r * Math.min(1, p.life / 0.25); ctx.moveTo(p.x + r, p.y); ctx.ellipse(p.x, p.y, r, r * 0.8, 0, 0, 6.283); }
    ctx.fill(); ctx.restore();
  }

  const BANNER = { s: '', t: 0, x: 0, y: -330 };
  const banner = (s, x, y) => { if (!pres()) return; BANNER.s = D.tr ? D.tr(s) : s; BANNER.t = 1.6; BANNER.x = x; BANNER.y = y; };
  function drawBanner(ctx) {
    if (!(BANNER.t > 0) || !BANNER.s) return;
    const a = Math.min(1, BANNER.t / 0.3, (1.6 - BANNER.t) / 0.15 + 0.2);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const u = Math.min(cam.W / 960, cam.H / 540);
    ctx.font = `800 ${Math.round(22 * u)}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const hw = Math.min(cam.W / 2 - 8, ctx.measureText(BANNER.s).width / 2 + 10 * u), x = clamp(cam.sx(BANNER.x), hw, cam.W - hw), y = clamp(cam.sy(BANNER.y), 70 * u, cam.H * 0.4);
    ctx.globalAlpha = a;
    ctx.lineWidth = 5 * u; ctx.strokeStyle = 'rgba(8,14,18,.85)'; ctx.strokeText(BANNER.s, x, y);
    ctx.fillStyle = '#dff6ff'; ctx.fillText(BANNER.s, x, y);
    ctx.restore();
  }




  const WF = {
    x0: -250,
    cur: 46, curLying: 120,
    edge: () => A() - 6,
    poolDmg: 5, poolPost: 30,
    surge: { warn: 1.7, speed: 640, push: 150, brace: 44 },
    firstAt: [14, 20], gap: [22, 32],
    kickCd: 2.6,
  };
  const inWater = (x) => x > WF.x0;

  ACT.pool = {
    dur: 1.55, out: true, hold: true, inv: [0, 1.38],
    setup(f, c) {
      const a = A(), d = 1;
      c.X = [[0, f.x], [0.22, a + 56], [0.95, a + 70], [1.2, a + 18], [1.4, a - 40], [1.55, a - 70]];
      c.Y = [[0, Math.min(0, f.y)], [0.12, -30], [0.3, 64], [0.9, 60], [1.15, 26], [1.3, -40], [1.45, 0], [1.55, 0]];
      c.keys = [[0, f.entry], [0.16, pk('launch'), E.outCubic], [0.32, mod('launch', { lean: -0.9 }), E.inOut], [0.9, mod('kneel', { lean: 0.5 }), E.inOut],
        [1.2, mod('jump', { lean: 0.4 }), E.outCubic], [1.42, pk('land'), E.outCubic], [1.55, f.P.stance, E.inOut]];
      c.dirs = [[0, d], [0.95, -d]];
      c.ev = [[0.28, (f) => {
        if (pres()) { spray(f.x, 30, -1, 26, 1.1); spray(f.x, 30, 1, 14, 0.8); au.thud(1.1, f.pan); if (P.snd) P.snd({ k: 'bucket', x: f.x }, 'splash', 1.3); cam.punch(6); }
        const dmg = Math.min(WF.poolDmg, f.hp - 1);
        if (dmg > 0) { f.hp -= dmg; f.damageTaken = (f.damageTaken || 0) + dmg; }
        f.posture = Math.min(99, (f.posture || 0) + WF.poolPost);
      }], [1.2, (f) => { if (pres()) { spray(f.x, 0, -1, 10, 0.6); au.swoosh(0.5, f.pan); } }]];
      f.dz.arPoolT = c.dur + 1.6;
      label(f, 'Into the pool!');
    },
  };

  ACT.swept = {
    dur: 0.78,
    setup(f, c) {
      const x1 = f.x + WF.surge.push;
      c.X = [[0, f.x], [0.5, x1], [0.78, x1 + 8]];
      c.keys = [[0, f.entry], [0.12, mod('stagger', { lean: -0.5 }), E.outCubic], [0.42, mod('kneel', { lean: 0.35 }), E.inOut], [0.78, f.P.stance, E.inOut]];
      c.face = null;
      c.ev = [[0.02, (f) => { if (pres()) { spray(f.x, 0, 1, 18, 0.9); au.swoosh(0.8, f.pan); } }]];
      f.posture = Math.min(99, (f.posture || 0) + 18);
      label(f, 'Swept by the surge!');
    },
  };

  ACT.splash = {
    dur: 0.46,
    setup(f, c) {
      f.dir = f.opp.x >= f.x ? 1 : -1;
      c.X = [[0, f.x], [0.56, f.x]];
      c.keys = [[0, f.entry], [0.1, mod('ua_frontA', { lean: 0.15 }), E.outCubic], [0.22, mod('ua_frontB', { f1x: 70, f1y: 12, lean: -0.25 }), E.outQuart], [0.32, mod('ua_frontB', { f1x: 60, f1y: 6, lean: -0.2 })], [0.46, f.P.stance, E.inOut]];
      c.ev = [[0.2, (f) => {
        const o = f.opp;
        if (pres()) { spray(f.x + f.dir * 40, 0, f.dir, 46, 1.25); spray(f.x + f.dir * 60, -10, f.dir, 24, 0.8); SHEETS.push({ x: f.x + f.dir * 36, dir: f.dir, t: 0 }); if (P.snd) P.snd({ k: 'bucket', x: f.x }, 'splash', 0.9); }
        if (!o || o.dead || (o.isInv && o.isInv()) || Math.abs(o.x - f.x) > 320 || (o.x - f.x) * f.dir < 0 || !o.onGround) return;
        if ((o.state === 'guard' || o.state === 'block') && (f.x - o.x) * o.dir > 0) { o.posture = Math.min(99, (o.posture || 0) + 8); return; }
        if (SCRIPTED[o.state] || o.dz && o.dz.cine) return;
        o.takeHit(2, { dmg: 2, stun: 0.72, kb: 40, post: 8, kind: 'kick', hurt: 'stagger' }, f, o.x, o.y - 150, 'head', f.dir);
        if (o.dz && !o.dead) o.dz.arBlind = 0.66;
      }]];
      f.dz.arKick = WF.kickCd;
      label(f, 'Water in the face!');
    },
  };
  D.arenaActs = { pool: 1, swept: 1, splash: 1 };
  DEFS.waterfall = {
    firstAt: WF.firstAt,

    step(s, h, F) {
      const ex = inEx(), live = G.phase === 'fight';
      for (const f of F) {
        const z = f.dz;
        if (!z) continue;
        if (z.arKick > 0) z.arKick -= h;
        if (!live || !movable(f) || !inWater(f.x) || f.y < -2) continue;

        if (LYING[f.state]) f.x = Math.min(A(), f.x + WF.curLying * h);
        else if (!ex && f.onGround) f.x = Math.min(A(), f.x + WF.cur * h);
      }

      const e = s.ev;
      if (!e) {
        if (G.phase === 'fight' && s.t >= s.next && !ex) {
          s.ev = { k: 'surge', ph: 0, t: 0, x: WF.x0, hit: 0 };
          if (pres()) { banner('The falls surge! Jump it or guard!', -20, -300); au.thud(0.6, 0); }
        }
        return;
      }
      e.t += h;
      if (e.ph === 0) { if (e.t >= WF.surge.warn) { e.ph = 1; e.t = 0; if (pres()) au.swoosh(1.0, 0); } return; }
      const x0 = e.x, x1 = e.x + WF.surge.speed * h;
      e.x = x1;
      for (let i = 0; i < F.length; i++) {
        const f = F[i];
        if (e.hit & (1 << i) || !f.dz || f.dead || f.x <= x0 - 30 || f.x > x1) continue;
        e.hit |= 1 << i;
        if (!inWater(f.x)) continue;
        surgeHits(f, ex);
      }
      if (e.x > A() + 120) { s.ev = null; s.n++; s.next = s.t + WF.gap[0] + rn(s) * (WF.gap[1] - WF.gap[0]); }
    },

    ctx(f, hold, add) {
      const o = f.opp, d = Math.abs(o.x - f.x);
      if (inWater(f.x) && !(f.dz.arKick > 0) && d > 70 && d < 280 && o.onGround) add('splash', null, 60, 'water');
    },

    decide(ai, f, dist, fwd) {
      const o = f.opp, lv = ai.lv || {}, s = G.flags && G.flags.ar, z = f.dz;
      if (!s) return false;
      const e = s.ev;

      if (e && inWater(f.x)) {
        if (z.arPlan == null || z.arPlan < 0 || z.arPlanN !== s.n) { z.arPlanN = s.n; const r = ND.rng.next(); z.arPlan = r < 0.2 + 0.55 * (lv.smart || 0) ? 1 : r < 0.35 + 0.6 * (lv.smart || 0) ? 2 : 0; }
        const ahead = e.ph === 1 ? f.x - e.x : f.x - WF.x0 + WF.surge.speed * (WF.surge.warn - e.t);
        if (z.arPlan === 1 && ahead > 0 && ahead < 150) { ai.tap('up'); return true; }
        if (z.arPlan === 2 && ahead > 0 && ahead < 260) { ai.setHeld('left', false); ai.setHeld('right', false); ai.move = 0; ai.setHeld('guard', true); ai.guardUntil = ai.t + 0.4; return true; }
      }

      const back = f.x > A() - 230 && o.x < f.x;
      if (back && !inEx() && ND.rng.next() < 0.18 + 0.5 * (lv.smart || 0)) {
        if (dist < 150 && o.state !== 'atk' && D.PASS && ND.rng.next() < 0.5) { ai.moveDir(-1); ai.tap('dodge'); return true; }
        if (dist > 120) { ai.go(-1, 0.25); return true; }
      }

      if (inWater(f.x) && !(z.arKick > 0) && dist > 110 && dist < 250 && o.state !== 'atk' && !inEx() && ND.rng.next() < 0.05 + 0.12 * (lv.str || 0)) {
        if (D.envStart(f, 'splash', null)) return true;
      }
      return false;
    },

    edge(f, pre) {
      if (f.dz.arPoolT > 0) { f.dz.arPoolT -= pre.dt; return; }
      if (f.x < WF.edge() || f.dead || pre.vx < 90) return;
      if (!(f.state === 'launch' || f.state === 'hurt' || f.state === 'stagger' || f.state === 'down' || f.state === 'gbreak')) return;
      D.envStart(f, 'pool', null);
    },
    noWall: 1,
    wet: (x) => inWater(x) && x < A(),
    drawFloor: drawFallsBack, drawFront: drawFallsFront,
  };
  function surgeHits(f, ex) {
    if (SCRIPTED[f.state] || f.dz.cine) return;
    if (LYING[f.state]) { f.x = Math.min(A(), f.x + 80); return; }

    if (!f.onGround || f.y < -24) { if (f.state !== 'launch') label(f, 'Over the wave!'); return; }

    const guard = f.state === 'guard' || f.state === 'block' || f.state === 'parry';
    if (ex || guard) { f.vx = Math.max(f.vx, 300); f.posture = Math.min(99, (f.posture || 0) + (guard ? 8 : 0)); if (guard) label(f, 'Braced against the surge'); return; }
    D.envStart(f, 'swept', null);
  }


  function drawFallsBack(ctx, s) {
    const t = ND.scene.t, a = A(), lite = !!D.lite, x0 = WF.x0, x1 = a + 2;

    ctx.save();
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
        ctx.beginPath(); for (let i = 0; i < 7; i++) { const xx = x0 - 20 + i * 26, r = 14 + 16 * k + 5 * Math.sin(t * 9 + i); ctx.moveTo(xx + r, -40); ctx.ellipse(xx, -40 - r * 0.3, r, r * 0.6, 0, 0, 6.283); } ctx.fill();
      } else {

        const x = e.x, bw = lite ? 120 : 200, xa = Math.max(x0 - 30, x - bw);
        const wg = ctx.createLinearGradient(x - bw, 0, x + 6, 0);
        wg.addColorStop(0, 'rgba(235,250,252,0)'); wg.addColorStop(0.6, 'rgba(235,250,252,.5)'); wg.addColorStop(0.92, 'rgba(250,255,255,.92)'); wg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = wg; ctx.fillRect(xa, -54, x + 8 - xa, 580);
        ctx.fillStyle = 'rgba(255,255,255,.95)';
        ctx.beginPath();
        for (let y = -50; y < 520; y += lite ? 30 : 18) { const r = 11 + 6 * Math.sin(t * 13 + y * 0.9), hx = x - 6 + 5 * Math.sin(t * 9 + y); ctx.moveTo(hx + r, y - 14); ctx.ellipse(hx, y - 14, r, r * 1.25, 0, 0, 6.283); }
        ctx.fill();
        ctx.strokeStyle = 'rgba(120,170,180,.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); for (let y = -40; y < 520; y += 36) { ctx.moveTo(x - 22, y); ctx.quadraticCurveTo(x - 6, y - 16, x + 4, y - 4); } ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawFallsFront(ctx) {
    const a = A(), F = G.F || [];
    if (!F.some((f) => f && f.state === 'denv' && f.dz && f.dz.env && f.dz.env.a === 'pool')) return;
    ctx.save();
    const g = ctx.createLinearGradient(0, -2, 0, 260);
    g.addColorStop(0, 'rgba(70,130,140,.9)'); g.addColorStop(1, 'rgba(16,48,60,.98)');
    ctx.fillStyle = g; ctx.fillRect(a + 6, -2, 1400, 600);
    ctx.strokeStyle = 'rgba(240,252,250,.8)'; ctx.lineWidth = 3;
    const t = ND.scene.t; ctx.beginPath(); ctx.moveTo(a + 6, -2); for (let x = a + 6; x < a + 400; x += 20) ctx.lineTo(x + 10, -2 + 2.5 * Math.sin(t * 6 + x * 0.08)); ctx.stroke();
    ctx.restore();
  }


  P.ARENA_SETS.waterfall = [['jar', -560, -8], ['jar', -500, -2], ['bucket', -430, 0], ['stool', -340, -6], ['crate', 520, -16], ['stool', 640, -6]];



  D.arenaStep = function (h, F) {
    const d = def();
    if (!d) return;
    const s = ars();
    if (!s) return;
    if (G.phase === 'fight') s.t += h;
    if (d.step) d.step(s, h, F);
  };

  D.arenaCtx = function (f, hold, add) { const d = def(); if (d && d.ctx && f.opp) d.ctx(f, hold, add); };
  D.arenaNoWall = (side) => { const d = def(); return !!(d && d.noWall && side > 0); };

  const upd0 = FP.update;
  FP.update = function (dt) {
    const d = this.dz && P.live ? def() : null;
    if (!d) return upd0.call(this, dt);
    const pre = { x: this.x, vx: this.vx, state: this.state, dt };
    if (d.noWall && this.x > A() - 160 && this.state === 'launch') this.wallBounced = true;
    const r = upd0.call(this, dt);
    if (d.edge && this.state !== 'denv') d.edge(this, pre);
    return r;
  };

  const AP = ND.AI && ND.AI.prototype;
  if (AP && AP.decide) {
    const dec0 = AP.decide;
    AP.decide = function (dist, fwd) {
      const me = this.me, d = me && me.dz && P.live ? def() : null;
      if (d && d.decide && (me.state === 'move' || me.state === 'land' || me.state === 'guard') && !P.held(me) && d.decide(this, me, dist, fwd)) return;
      return dec0.call(this, dist, fwd);
    };
  }

  const duelFight = () => !!(P.live && G.F && G.F[0] && G.F[0].dz);
  D.arenaDraw = function (ctx, layer) {
    const d = def();
    if (!d) return;
    const st = G.flags && G.flags.ar;
    if (layer === 'back') { if (d.drawBack) d.drawBack(ctx, st); }
    else { if (d.drawFront) d.drawFront(ctx, st); drawSheets(ctx); drawSpray(ctx); drawBanner(ctx); }
  };


  D.arenaFloor = function (ctx) {
    const d = duelFight() ? def() : null;
    if (d && !sinkHooked) hookSink();
    if (!d || !d.drawFloor) return;
    ctx.save(); try { d.drawFloor(ctx, G.flags && G.flags.ar); } finally { ctx.restore(); }
  };

  const sinkOf = (f) => (f.state === 'denv' && f.dz && f.dz.env && f.dz.env.sink > 0 ? f.dz.env.sink : 0);


  let sinkHooked = false;
  function hookSink() {
    if (sinkHooked) return;
    sinkHooked = true;
    const dr0 = FP.draw, sh0 = FP.drawShadow;
    FP.draw = function (ctx, reflect, layer) {
      const k = this.dz ? sinkOf(this) : 0;
      if (!k) return dr0.apply(this, arguments);
      if (reflect) return;
      ctx.save(); ctx.translate(0, k);
      try { return dr0.apply(this, arguments); } finally { ctx.restore(); }
    };
    if (sh0) FP.drawShadow = function () { if (this.dz && sinkOf(this)) return; return sh0.apply(this, arguments); };
  }

  {
    const fu0 = fx.update;
    fx.update = function (dt) {
      const r = fu0.apply(this, arguments);
      if (SPRAY.length || SHEETS.length) sprayTick(dt);
      if (BANNER.t > 0) BANNER.t -= dt;
      const sv = duelFight() && G.flags && G.flags.ar && G.flags.ar.ev;
      if (sv && sv.k === 'surge' && !G.paused && dt > 0) {
        if (sv.ph === 1 && sv.x < A()) for (let i = 0; i < 2; i++) if (NM.random() < dt * 30) spray(sv.x, -40 + NM.random() * 80, 1, 2, 0.9);
        if (sv.ph === 0 && NM.random() < dt * 8) { spray(WF.x0 + NM.random() * 160, -44, NM.random() < 0.5 ? 1 : -1, 2, 0.7); if (NM.random() < dt * 6) cam.punch(1.5); }
      }

      const d = duelFight() && !G.paused ? def() : null;
      if (d && d.wet && dt > 0) for (const f of G.F) if (f && !f.dead && f.onGround && f.y > -4 && d.wet(f.x) && Math.abs(f.vx) > 160 && NM.random() < dt * 14) spray(f.x - Math.sign(f.vx) * 6, 0, Math.sign(f.vx) || 1, 3, 0.35);
      return r;
    };
  }

  if (D.envUi && D.envUi.icons) D.envUi.icons.water = '<svg viewBox="0 0 24 24" width="62%" height="62%" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0M6 12l3-6M12 11l1-7M17 12l3-5"/></svg>';


  if (D.TR) Object.assign(D.TR, {
    'Into the pool!': ['Havuza düştü!', '¡Al estanque!', 'Para o lago!', 'В омут!', 'Ins Becken!', 'Dans le bassin !', 'Nella pozza!', 'Do wody!', 'Ke kolam!', 'Rơi xuống hồ!', 'ตกน้ำ!', 'कुंड में!', 'إلى البركة!', '掉进水潭！', '掉進水潭！', '滝つぼへ！', '물웅덩이로!'],
    'Swept by the surge!': ['Dalga sürükledi!', '¡Arrastrado por la ola!', 'Arrastado pela onda!', 'Сбит волной!', 'Von der Welle erfasst!', 'Emporté par la vague !', "Travolto dall'onda!", 'Porwany przez falę!', 'Terseret gelombang!', 'Bị sóng cuốn!', 'โดนคลื่นซัด!', 'लहर बहा ले गई!', 'جرفته الموجة!', '被浪卷走！', '被浪捲走！', '波にさらわれた！', '파도에 휩쓸림!'],
    'Water in the face!': ['Yüzüne su!', '¡Agua a la cara!', 'Água na cara!', 'Вода в лицо!', 'Wasser ins Gesicht!', "De l'eau en plein visage !", "Acqua in faccia!", 'Woda w twarz!', 'Air ke wajah!', 'Tạt nước vào mặt!', 'สาดน้ำใส่หน้า!', 'मुँह पर पानी!', 'ماء في الوجه!', '泼水！', '潑水！', '顔に水しぶき！', '얼굴에 물!'],
    'Over the wave!': ['Dalganın üstünden!', '¡Sobre la ola!', 'Por cima da onda!', 'Над волной!', 'Über die Welle!', 'Par-dessus la vague !', "Sopra l'onda!", 'Nad falą!', 'Melompati ombak!', 'Nhảy qua sóng!', 'กระโดดข้ามคลื่น!', 'लहर के ऊपर से!', 'فوق الموجة!', '跃过浪头！', '躍過浪頭！', '波を飛び越えた！', '파도를 넘었다!'],
    'Braced against the surge': ['Dalgaya karşı direndi', 'Aguanta la ola', 'Resiste à onda', 'Устоял против волны', 'Hält der Welle stand', 'Tient bon face à la vague', "Resiste all'onda", 'Opiera się fali', 'Menahan gelombang', 'Trụ vững trước sóng', 'ยืนต้านคลื่น', 'लहर के आगे डटा', 'صمد أمام الموجة', '顶住浪头', '頂住浪頭', '波に耐えた', '파도를 버텼다'],
    'The falls surge! Jump it or guard!': ['Şelale coşuyor! Atla ya da savun!', '¡La cascada crece! ¡Salta o defiende!', 'A cascata transborda! Pule ou defenda!', 'Водопад бурлит! Прыгай или блокируй!', 'Der Wasserfall schwillt! Spring oder blocke!', 'La cascade déferle ! Saute ou garde !', 'La cascata si gonfia! Salta o para!', 'Wodospad wzbiera! Skacz lub blokuj!', 'Air terjun meluap! Lompat atau tangkis!', 'Thác nước dâng! Nhảy hoặc đỡ!', 'น้ำตกทะลัก! กระโดดหรือป้องกัน!', 'झरना उफना! कूदो या बचाव करो!', 'الشلال يفيض! اقفز أو احمِ نفسك!', '瀑布涌来！跳起或格挡！', '瀑布湧來！跳起或格擋！', '滝があふれる！跳ぶかガード！', '폭포가 넘친다! 뛰거나 막아라!'],
  });
})(window.ND);
