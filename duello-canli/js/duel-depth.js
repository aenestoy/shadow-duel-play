// Shadow Duel — DUEL PROTOTYPE body turn (?duel=1 only; js/duel.js). Drawing only: the fight never reads any of it.
//
// The fighters are drawn side-on, sword hand (the right) towards the camera. A real body turns: a cut loads on one
// shoulder and unwinds through the other, a guard against a blow from the far side shows its back. Here the drawn
// joints (js/anim.js display joints, f._anim.j) get a turn from three numbers the moves carry (a.z3 in
// js/duel-moves.js; guards from the side the defender covers, js/duel.js f.dz.gs):
//   tw  shoulder twist (rad): + chest towards the camera (the near shoulder back, the far one forward),
//       − back towards the camera (near shoulder forward: the right-back side shows)
//   hp  hip twist: the same for the pelvis (it leads the shoulders in the moves)
//   bz  blade depth: + in front of the body, − behind it (skeleton.js / bake.js draw it, and its streak, behind
//       the torso: j.bz)
//   bf  blade length factor: < 1 while the blade points towards / away from the camera (wind-ups, a horizontal cut
//       passing the camera); always 1 while it can hit, so the drawn blade is the fight's blade there
// What moves: the two shoulders split along the body's forward direction (j.sh near, j.shB far) and the arms are
// solved again from them to the SAME hands; the hips split the same way (j.hipF / j.hipB) with the knees solved to
// the SAME feet. Hands, feet, blade line and hit points stay exactly where the fight has them, so blades still meet
// where the sparks are. Ordinary Math: presentation, not saved, not fingerprinted (f._anim is skipped by sim-state.js).
(function (ND) {
  'use strict';
  const FLAG = (() => { try { return !/[?&]duel=0(&|$)/.test(location.search || ''); } catch (e) { return true; } })(); // (the duel is the fight; ?duel=0: the old fight everywhere)
  if (!FLAG || !ND.duel || !ND.anim) return;
  const D = ND.duel, L = ND.LEN, G = ND.game;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const SHW = 21, HPW = 13; // half shoulder / hip width seen from the front
  const OUT = [0, 0, 1, 1];
  const off = /[?&]depth=0(&|$)/.test(location.search || '');
  D.depthOn = !off;
  // Milestone 2: prototype A (js/depth25.js) draws every duel fighter in 2.5D — the torso turns (chest / back), the
  // sword arm is solved and foreshortened in 3D, the blade is a 3D object (edge-on / flat), near and far parts swap
  // draw order — driven by the same turn data below. ?a=0 keeps milestone 1's flat turn (shoulder / hip split only).
  const A3 = ND.depth25;
  // The duel moves the FIGHT's guard onto the coming blade (js/duel.js guardTarget), so the drawing-only guess of the
  // motion round (js/anim.js "meet") is not needed here and would aim the drawn blade elsewhere: off on the duel page.
  if (ND.anim.m && ND.anim.m.meet) ND.anim.m.meet = false;
  D.useA = !!A3 && !/[?&]a=0(&|$)/.test(location.search || '');

  // [tw, hp, bz, bf] of fighter f now
  function target(f, out) {
    const s = f.state, z = f.dz;
    out[0] = 0; out[1] = 0; out[2] = 1; out[3] = 1;
    if (s === 'atk' && f.atk && f.atk.z3) {
      const Z = f.atk.z3, t = f.st;
      if (t <= Z[0][0]) { for (let i = 0; i < 4; i++) out[i] = Z[0][i + 1]; return out; }
      for (let k = 1; k < Z.length; k++) {
        if (t <= Z[k][0]) {
          const a = Z[k - 1], b = Z[k], u = (t - a[0]) / Math.max(1e-4, b[0] - a[0]), e = u * u * (3 - 2 * u);
          for (let i = 0; i < 4; i++) out[i] = a[i + 1] + (b[i + 1] - a[i + 1]) * e;
          // the blade changes sides of the body at once (no half-depth): it is either in front or behind
          out[2] = (u < 0.5 ? a[3] : b[3]) >= 0 ? Math.max(0.01, out[2]) : Math.min(-0.01, out[2]);
          return out;
        }
      }
      const l = Z[Z.length - 1]; for (let i = 0; i < 4; i++) out[i] = l[i + 1];
      return out;
    }
    if (s === 'guard' || s === 'block' || s === 'parry') {
      // the guard on the far side turns the back to the camera (the right-back shows), the near side opens the chest
      const g = z ? z.gs : 0;
      out[0] = g * 0.8; out[1] = g * 0.4; out[2] = g < -0.15 ? -1 : 1;
      if (s === 'block' && f.st < 0.08) { out[0] *= 1.2; out[1] *= 1.2; } // the hit drives the turn a little further
      return out;
    }
    if (s === 'dbind' && z && z.cine) {
      const c = z.cine, isDef = c.def === f;
      if (c.ph === 'strike' && isDef) { const t = c.t2; out[0] = t < 0.19 ? 0.5 * (t / 0.19) : 0.5 - 1.2 * Math.min(1, (t - 0.19) / 0.15); out[1] = out[0] * 0.5; out[2] = t < 0.19 ? 1 : -1; }
      else { out[0] = isDef ? 0.2 : -0.25; out[1] = out[0] * 0.5; }
      return out;
    }
    if (s === 'droll') { out[0] = 0; out[1] = 0; return out; }
    if (s === 'recoil' || s === 'stagger') { out[0] = -0.35; out[1] = -0.2; return out; }
    if (s === 'hurt') { out[0] = 0.4; out[1] = 0.15; return out; }
    if (s === 'dodge') { out[0] = f.back ? 0.3 : -0.4; out[1] = out[0] * 0.5; return out; }
    // stance: a half-turned kamae (hips a little open), walking keeps it
    out[0] = z && !z.armed ? 0.18 : 0.08; out[1] = 0.12;
    return out;
  }

  // two-bone IK with the skeleton's own elbow / knee preference (local x forward, y down)
  function ik(ax, ay, bx, by, l1, l2, dir, knee, o) {
    let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
    const max = l1 + l2 - 0.01;
    if (d > max) { bx = ax + (dx / d) * max; by = ay + (dy / d) * max; dx = bx - ax; dy = by - ay; d = max; }
    d = Math.max(d, 1e-3);
    const base = Math.atan2(dy, dx), A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const e1x = ax + Math.cos(base + A) * l1, e1y = ay + Math.sin(base + A) * l1, e2x = ax + Math.cos(base - A) * l1, e2y = ay + Math.sin(base - A) * l1;
    const s = dir < 0 ? -1 : 1;
    const sc = (x, y) => (knee ? (x - ax) * s - 0.5 * (y - ay) : (y - ay) + 0.3 * (x - ax) * s);
    const p = sc(e1x, e1y) >= sc(e2x, e2y);
    o.x = p ? e1x : e2x; o.y = p ? e1y : e2y;
    return o;
  }
  function pt(j, k) { return j[k] || (j[k] = { x: 0, y: 0 }); }
  // the largest shift (≤ want) along (fx, fy) that keeps the hand within reach of the moved shoulder
  function reachShift(sx, sy, fx, fy, hx, hy, want, reach) {
    let w = want;
    for (let i = 0; i < 5; i++) {
      const x = sx + fx * w, y = sy + fy * w;
      if (Math.hypot(hx - x, hy - y) <= reach) return w;
      w *= 0.6;
    }
    return 0;
  }

  function apply(f, dt, hold) {
    const S = f._anim, j = S && S.j;
    if (!j || !j.hip || !j.sh || f.dead || !D.depthOn) return;
    const tg = target(f, OUT);
    // smooth the turn (the blade's side switches at once)
    const C = S.d3 || (S.d3 = [tg[0], tg[1], tg[2], tg[3]]);
    if (!hold) { const k = 1 - Math.exp(-22 * Math.max(dt, 0)); C[0] += (tg[0] - C[0]) * k; C[1] += (tg[1] - C[1]) * k; C[3] += (tg[3] - C[3]) * k; }
    C[2] = tg[2];
    const tw = D.useA ? 0 : C[0], hp = C[1], dir = j.dir < 0 ? -1 : 1;
    // the body's forward direction (perpendicular to the spine, towards the facing side)
    let ux = j.neck.x - j.hip.x, uy = j.neck.y - j.hip.y; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    const fx = dir * -uy, fy = dir * ux;
    const reach = L.uArm + L.fArm - 0.5;
    // shoulders: near one back by sin(tw), far one forward (each limited so its hand stays reachable)
    const st = Math.sin(tw) * SHW;
    const sx = j.sh.x, sy = j.sh.y;
    const sg = st < 0 ? -1 : 1, bsx = sx - 3 * dir, bsy = sy + 1;
    const wn = -sg * reachShift(sx, sy, -fx * sg, -fy * sg, j.haF.x, j.haF.y, Math.abs(st), reach);
    const wf = sg * reachShift(bsx, bsy, fx * sg, fy * sg, j.haB.x, j.haB.y, Math.abs(st), reach);
    j.sh.x = sx + fx * wn; j.sh.y = sy + fy * wn;
    const B = pt(j, 'shB'); B.x = bsx + fx * wf; B.y = bsy + fy * wf;
    // a far shoulder brought forward (back to the camera) rises a little over the near one, and the reverse
    B.y -= Math.sin(tw) * 2;
    ik(j.sh.x, j.sh.y, j.haF.x, j.haF.y, L.uArm, L.fArm, dir, false, j.elF);
    ik(B.x, B.y, j.haB.x, j.haB.y, L.uArm, L.fArm, dir, false, j.elB);
    // hips (the legs keep their feet)
    const hs = Math.sin(hp) * HPW;
    const HF = pt(j, 'hipF'), HB = pt(j, 'hipB');
    HF.x = j.hip.x - fx * hs; HF.y = j.hip.y - fy * hs;
    HB.x = j.hip.x - 2 * dir + fx * hs; HB.y = j.hip.y + fy * hs;
    ik(HF.x, HF.y, j.ftF.x, j.ftF.y, L.thigh, L.shin, dir, true, j.knF);
    ik(HB.x, HB.y, j.ftB.x, j.ftB.y, L.thigh, L.shin, dir, true, j.knB);
    // the head looks a touch along with the shoulders
    j.head.x += fx * Math.sin(tw) * -4; j.neck.x += fx * Math.sin(tw) * -2;
    // the blade: in front or behind the body, shortened while it points at / away from the camera
    j.bz = C[2];
    if (D.useA) return; // (A projects the blade from its 3D direction itself)
    if (j.tip && j.haF && C[3] < 0.995 && j.hasSword) {
      const k = clamp(C[3], 0.25, 1);
      j.tip.x = j.haF.x + (j.tip.x - j.haF.x) * k; j.tip.y = j.haF.y + (j.tip.y - j.haF.y) * k;
      if (j.pom) { j.pom.x = j.haF.x + (j.pom.x - j.haF.x) * (0.4 + 0.6 * k); j.pom.y = j.haF.y + (j.pom.y - j.haF.y) * (0.4 + 0.6 * k); }
    }
  }
  // the blade streak says which side the cut came from: warm gold from the right (near side), cold blue from the left
  // (far side, drawn behind the body), white down / up the centre and for thrusts
  const FP = ND.Fighter.prototype, trail0 = FP.drawTrail;
  const SCOL = { 1: '255,214,140', '-1': '120,180,255', 0: '236,242,255' };
  FP.drawTrail = function (ctx) {
    if (this.dz && D.lite) return; // (the light look: no streaks - the normal game's coloured counter arcs crossed bodies)
    const a = this.state === 'atk' ? this.atk : null;
    if (!this.dz || !a || !a.dz3 || a.special || a.counter || !ND.anim || !ND.anim.on) return trail0.call(this, ctx);
    const Tr = this.trail;
    if (Tr.length < 2) return;
    const sd = a.sides && a.sides[this.hitIdx] != null ? a.sides[this.hitIdx] : a.dz3.side, col = SCOL[sd] || SCOL[0], n = Tr.length;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // (the motion round's band streak when it is on: the same shape as every other streak, only the colour says the side)
    if (ND.anim.trailBands && ND.anim.m && ND.anim.m.trail) { ND.anim.trailBands(ctx, Tr, (i, al) => `rgba(${col},${al * 0.62})`); ctx.restore(); return; }
    let fi = -1;
    ND.anim.trailSlices(Tr, (i, u0, u1, q) => {
      if (i !== fi) { fi = i; ctx.fillStyle = `rgba(${col},${(i / n) * 0.55})`; }
      ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.lineTo(q[6], q[7]); ctx.lineTo(q[4], q[5]); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  };
  // ------------------------------------------------------------------ prototype A driven by the turn data
  if (D.useA) {
    const EXT = new WeakMap(), W3 = 11;
    A3.provider = (f) => {
      if (!f.dz || f.dead || D.lite) return null;
      const S = f._anim, C = S && S.d3, j = S && S.j;
      if (!C || !j || !j.haF || !j.tip) return null;
      let o = EXT.get(f); if (!o) EXT.set(f, (o = { w: 1, psi: 0, hz: W3, dx: 0, u3: { x: 1, y: 0, z: 0 }, roll: 0 }));
      const dir = f.dir < 0 ? -1 : 1, bz = C[2], bf = clamp(C[3], 0.2, 1);
      o.psi = C[0] * 1.25; // (radians; + the chest opens to the camera, − the back turns to it)
      // the sword hand on the far side: the whole arm is drawn behind the torso (the depth eases over, never jumps)
      const hzT = bz >= 0 ? W3 : -9, clk = ND.simClock || 0;
      if (o.clk == null || clk < o.clk || clk - o.clk > 0.5) o.hzS = hzT;
      else if (clk !== o.clk) o.hzS += (hzT - o.hzS) * (1 - Math.exp(-(clk - o.clk) / 0.03));
      const dtc = o.clk == null || clk < o.clk ? 1 : clk - o.clk;
      o.clk = clk; o.hz = o.hzS;
      let bx = (j.tip.x - j.haF.x) * dir, by = j.tip.y - j.haF.y; const bl = Math.hypot(bx, by) || 1; bx /= bl; by /= bl;
      // (the blade's depth side follows the hand's eased depth: it turns through the picture's plane, never jumps it)
      const side = clamp(((o.hzS + 9) / (W3 + 9)) * 2 - 1, -1, 1);
      const zz = Math.sqrt(Math.max(0, 1 - bf * bf)) * side, ul = Math.hypot(bx * bf, by * bf, zz) || 1;
      o.u3.x = bx * bf / ul; o.u3.y = by * bf / ul; o.u3.z = zz / ul;
      const a = f.state === 'atk' ? f.atk : null;
      // a level cut leads with its edge (the blade turns flat to the camera as it sweeps); a vertical one shows its flat
      const rT = a && a.dz3 && a.dz3.v === 'level' && a.active && f.st > a.active[0] - 0.08 && f.st < a.active[1] + 0.08 ? 1.25 * (a.dz3.side || 1) : 0;
      o.rollS = o.rollS == null || dtc > 0.5 ? rT : o.rollS + (rT - o.rollS) * (1 - Math.exp(-dtc / 0.025));
      o.roll = o.rollS;
      return o;
    };
    A3.backShade = 0.72;
    const SC = { 1: '255,214,140', '-1': '120,180,255', 0: '226,236,255' };
    A3.trailCol = (f) => { const a = f.state === 'atk' ? f.atk : null; if (!a || !a.dz3 || a.counter || a.special) return '200,222,255'; const sd = a.sides && a.sides[f.hitIdx] != null ? a.sides[f.hitIdx] : a.dz3.side; return SC[sd] || SC[0]; };
    const FP2 = ND.Fighter.prototype, draw0 = FP2.draw;
    let inA = false;
    FP2.draw = function (ctx, reflect, layer) {
      if (reflect || inA || !this.dz || this.dead || this.hidden || D.lite) return draw0.call(this, ctx, reflect, layer); // (D.lite: a slow device, below)
      inA = true;
      try { A3.draw(ctx, this); } finally { inA = false; }
    };
  }
  // A slow device (2026-10-03, phones): the duel's 2.5D and recorded-motion drawing cost about twice the normal game's
  // frame; when the game's own frames take long (median over 4 s of fight > LITE_MS) the duel is drawn the light way -
  // the normal game's baked bodies with the duel's poses, blades, binds and set (drawing only: the fight is the same).
  // Remembered on the device; ?lite=1 forces it, ?lite=0 never.
  const LQ = (/[?&]lite=([01])(&|$)/.exec(location.search || '') || [])[1];
  const LITE_MS = 22, LK = 'nd_duel_lite';
  D.lite = LQ === '1' || (LQ !== '0' && (() => { try { return localStorage.getItem(LK) === '1'; } catch (e) { return false; } })());
  D.liteAuto = { samples: [], on: LQ !== '0' && LQ !== '1', ms: LITE_MS };
  // (the game's own frame work, measured for its quality ladder: js/gfx.js ladderFrame - real play and tests alike)
  if (ND.gfx && ND.gfx.ladderFrame) {
    const lf0 = ND.gfx.ladderFrame;
    ND.gfx.ladderFrame = function (aq, gapMs, workMs) {
      const A = D.liteAuto;
      const G = ND.game;
      if (A.on && !D.lite && G && G.phase === 'fight' && !G.paused && G.F && G.F[0] && G.F[0].dz && !document.hidden) {
        A.samples.push(workMs);
        if (A.samples.length >= 240) {
          const S = A.samples.slice().sort((x, y) => x - y), med = S[S.length >> 1];
          A.samples.length = 0; A.last = med;
          if (med > A.ms) { D.lite = true; A.switched = med; try { localStorage.setItem(LK, '1'); } catch (e) { /* private window */ } }
        }
      }
      return lf0.apply(this, arguments);
    };
  }
  // ------------------------------------------------------------------ the light look's own keep-apart and blade-stop
  // The light look draws the normal game's baked bodies from the display joints (f.viewJ()); the recorded-motion rig's
  // keep-apart and blade-stop do not run for it, and the fight puts the pair 40-70 apart in a counter: the baked bodies
  // were drawn one inside the other (2026-10-03, the slow-phone clip). The same rules on the drawn joints: the bodies
  // drawn apart by the least shift (the torso as baked ~24 round the spine, head 15, thighs 11, forearms / shins 6-7
  // against torso and head only; most of it taken by one on the floor), eased back when there is room; a blade that
  // would cross the other's head, neck or torso deeper than 6 turns round the hand by the least angle (it may rest on
  // the chest in its own hit window). Drawing only: the joints are display joints.
  const LT = { clk: -1, sig: '', ox: [0, 0], at: [0, 0], ra: [0, 0], raClk: [-1, -1] }, LMOVE = { down: 1, getup: 1, launch: 1 }, LOX = 90;
  const lsd = (p, q, x, y) => { if (!q) return Math.hypot(x - p.x, y - p.y); const vx = q.x - p.x, vy = q.y - p.y, l2 = vx * vx + vy * vy || 1, t = clamp(((x - p.x) * vx + (y - p.y) * vy) / l2, 0, 1); return Math.hypot(x - p.x - vx * t, y - p.y - vy * t); };
  const lseg = (p, q, r, t) => {
    if (q && t) { const cr = (A, B, C) => (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x); const d1 = cr(p, q, r), d2 = cr(p, q, t), d3 = cr(r, t, p), d4 = cr(r, t, q); if ((d1 > 0) !== (d2 > 0) && (d3 > 0) !== (d4 > 0)) return 0; }
    const ps = (P, A, B) => lsd(A, B, P.x, P.y);
    return Math.min(ps(p, r, t), q ? ps(q, r, t) : 1e9, ps(r, p, q), t ? ps(t, p, q) : 1e9);
  };
  // (the same shapes the body audit measures: torso 24 (+1), head 15, a straw kasa's brim 54 wide, thighs from each hip)
  const lshapes = (j, dx, kasa) => { const m = (q) => (q ? { x: q.x + dx, y: q.y } : null); const L = [[m(j.hip), m(j.neck), 25], [m(j.head), null, 15.5], [m(j.hipF || j.hip), m(j.knF), 11], [m(j.hipB || j.hip), m(j.knB), 11], [m(j.elF), m(j.haF), 6, 1], [m(j.elB), m(j.haB), 6, 1], [m(j.knF), m(j.ftF), 7, 1], [m(j.knB), m(j.ftB), 7, 1]];
    if (kasa && j.head) L.push([{ x: j.head.x + dx - 27, y: j.head.y - 8 }, { x: j.head.x + dx + 27, y: j.head.y - 8 }, 6]);
    return L.filter((q) => q[0] && (q[1] || !q[3])); };
  const isKasa = (f) => !!(f && f.ch && f.ch.acc === 'kasa');
  const lpen = (A, B) => { let p = 0; for (const [a, b, r1, l1] of A) for (const [c, d, r2, l2] of B) { if (l1 && l2) continue; p = Math.max(p, r1 + r2 - lseg(a, b, c, d)); } return p; };
  function litePair() {
    const GG = ND.game, F = GG && GG.F, clk = ND.simClock || 0;
    if (!D.lite || !F || !F[0] || !F[1]) return;
    const [a, b] = F, ja = a.viewJ && a.viewJ(), jb = b.viewJ && b.viewJ();
    if (!ja || !jb || !ja.hip || !jb.hip) return;
    // (once per drawn pose: keyed by the clock AND the joints - a snap asked for in the middle of a fight step (a hit's
    // contact spark) came before the step's own pose, and the pair kept that stale answer for the frame, 2026-10-03)
    const sig = clk + ':' + [ja.hip, jb.hip, ja.head, jb.head, ja.haF, jb.haF, ja.knF, jb.knF].map((q) => (q ? q.x.toFixed(1) + ',' + q.y.toFixed(1) : '-')).join(';');
    if (LT.sig === sig) return;
    const dt = LT.clk < 0 || clk < LT.clk ? 0 : Math.min(0.1, clk - LT.clk);
    LT.clk = clk; LT.sig = sig;
    for (let i = 0; i < 2; i++) LT.ox[i] *= Math.exp(-dt / 0.22);
    if (a.dead || b.dead || a.hidden || b.hidden || !a.dz || !b.dz) return;
    const bind = a.state === 'dbind' || b.state === 'dbind' || (a.dz.cine && !a.dz.cine.done) || (b.dz.cine && !b.dz.cine.done);
    if (bind) { LT.ox[0] = LT.ox[1] = 0; }
    else if (Math.abs(a.x - b.x) >= 20) {
      const ka = isKasa(a), kb = isKasa(b), B = lshapes(jb, LT.ox[1], kb);
      // (and each one's blade - hand to point, as the pose has it - off the other's head and neck: a blade turned off them
      // round the hand cannot clear a hand that is already there)
      const bladeHN = (j, dxj, q, dxq) => {
        if (!j.hasSword || !j.haF || !j.tip || !q.head || !q.neck) return 0;
        let m = 0; const H = { x: q.head.x + dxq, y: q.head.y }, N = { x: q.neck.x + dxq, y: q.neck.y };
        for (let k = 0; k <= 12; k++) { const x = j.haF.x + dxj + (j.tip.x - j.haF.x) * k / 12, y = j.haF.y + (j.tip.y - j.haF.y) * k / 12; m = Math.max(m, 16 - Math.hypot(x - H.x, y - H.y), 10 - lsd(N, H, x, y)); }
        return m;
      };
      const pair = (oxA) => Math.max(lpen(lshapes(ja, oxA, ka), B), bladeHN(ja, oxA, jb, LT.ox[1]), bladeHN(jb, LT.ox[1], ja, oxA));
      if (pair(LT.ox[0]) > 0) {
        const away = a.x < b.x ? -1 : 1;
        let lo = 0, hi = LOX * 2;
        if (pair(LT.ox[0] + away * hi) > 0) lo = hi; else for (let k = 0; k < 10; k++) { const m = (lo + hi) / 2; if (pair(LT.ox[0] + away * m) > 0) lo = m; else hi = m; }
        const need = hi + 0.5, mf = LMOVE[a.state] && !LMOVE[b.state] ? 0.8 : LMOVE[b.state] && !LMOVE[a.state] ? 0.2 : 0.5;
        LT.ox[0] = clamp(LT.ox[0] + away * need * mf, -LOX, LOX); LT.ox[1] = clamp(LT.ox[1] - away * need * (1 - mf), -LOX, LOX);
      }
    }
    // the blades: never through the other's head / neck / torso (as drawn, with the offsets)
    for (let i = 0; i < 2; i++) {
      const f = F[i], o = F[1 - i], j = i ? jb : ja, q = i ? ja : jb;
      if (!j.hasSword || !j.tip || !j.haF || f.state === 'dbind' || (f.dz.cine && !f.dz.cine.done) || !q.head || !q.neck) continue;
      const dx = LT.ox[1 - i] - LT.ox[i], hx = j.haF.x, hy = j.haF.y, L = Math.hypot(j.tip.x - hx, j.tip.y - hy) || 1, a0 = Math.atan2(j.tip.y - hy, j.tip.x - hx);
      const a = f.state === 'atk' ? f.atk : null, hit = a && a.active && f.st >= a.active[0] - 0.02 && f.st <= a.active[1] + 0.04, give = hit ? 8 : 6;
      // (drawn over the other - js/game.js draws an attacker last - a cut in its hit frames may cross in front of the
      // torso and legs; otherwise never inside them)
      const sw = F[0].dead ? false : F[1].dead ? true : F[0].state === 'atk' && F[1].state !== 'atk', front = hit && f === (sw ? F[0] : F[1]);
      const H = { x: q.head.x + dx, y: q.head.y }, N = { x: q.neck.x + dx, y: q.neck.y }, P = { x: q.hip.x + dx, y: q.hip.y };
      const mv = (p) => (p ? { x: p.x + dx, y: p.y } : null);
      const LEGS = [[mv(q.hipF || q.hip), mv(q.knF), 6], [mv(q.hipB || q.hip), mv(q.knB), 6], [mv(q.knF), mv(q.ftF), 3.5], [mv(q.knB), mv(q.ftB), 3.5]].filter((l) => l[0] && l[1]);
      // (deep into the head / neck / torso, or lying ALONG them - more than 8 of the blade within the body as drawn, the
      // audit's bladeOver - and never into the floor)
      const pen = (ang) => { let m = -1e9, over = 0; const c = Math.cos(ang), sn = Math.sin(ang); for (let k = 0; k <= 16; k++) { const x = hx + c * L * k / 16, y = hy + sn * L * k / 16, dh = Math.hypot(x - H.x, y - H.y), dn = lsd(N, H, x, y), dt = lsd(P, N, x, y); if (k >= 2 || dh < 16 || dn < 9) { m = Math.max(m, 16 - dh, 9 - dn); if (!front) { m = Math.max(m, 25 - dt); for (const [la, lb, lr] of LEGS) m = Math.max(m, lr - lsd(la, lb, x, y)); } } if (k >= 2 && (dh < 15 || dn < 9 || dt < 25)) over += L / 16; } m = Math.max(m, front ? -1e9 : over - 8, hy + sn * L - 2); return m; };
      // (eased like the recorded-motion blade-stop: the turn moves toward the needed one over ~0.05 s, in and out, but
      // never through a pose that is in the other's head, neck or body)
      const raPrev = LT.raClk[i] >= clk - 0.05 ? LT.ra[i] : 0, p0 = pen(a0);
      let tgt = 0;
      if (p0 > 0) {
        let best = null, least = p0, lA = 0;
        for (let k = 1; k <= 30 && best == null; k++) for (const sg of [1, -1]) { const d = sg * k * 0.06, pn = pen(a0 + d); if (pn <= 0) { best = d; break; } if (pn < least) { least = pn; lA = d; } }
        tgt = best == null ? lA : best; // (nothing clears it: the least deep)
      }
      if (!tgt && Math.abs(raPrev) < 0.01) { LT.ra[i] = 0; LT.raClk[i] = clk; continue; }
      let d = tgt;
      const kE = 1 - Math.exp(-Math.max(0, dt) / 0.02);
      for (const k of [kE, 0.5, 0.75]) { const e = raPrev + (tgt - raPrev) * k; if (pen(a0 + e) <= 0) { d = e; break; } }
      LT.ra[i] = d; LT.raClk[i] = clk;
      if (d) j.tip = { x: hx + Math.cos(a0 + d) * L, y: hy + Math.sin(a0 + d) * L };
    }
  }
  D.liteOffset = (f) => { litePair(); const GG = ND.game; return D.lite && GG && GG.F ? (GG.F[0] === f ? LT.ox[0] : GG.F[1] === f ? LT.ox[1] : 0) : 0; };
  D.litePair = litePair;
  // what the light look draws, for the audits and the props held in a hand (ND.depth25.snap): the display joints at
  // the offset, the blade from the hand to its (stopped) point
  if (ND.depth25 && ND.depth25.snap) {
    const sn0 = ND.depth25.snap, LKEYS2 = ['hip', 'hipF', 'hipB', 'neck', 'head', 'sh', 'shB', 'elF', 'haF', 'elB', 'haB', 'knF', 'ftF', 'knB', 'ftB', 'tip'];
    ND.depth25.snap = function (f, o) {
      if (!D.lite || !f || !f.dz || f.dead) return sn0.apply(this, arguments);
      const ox = D.liteOffset(f), j = f.viewJ && f.viewJ();
      if (!j || !j.hip || f.hidden) return null;
      o = o || {};
      for (const k of LKEYS2) if (j[k]) { const q = o[k] || (o[k] = { x: 0, y: 0 }); q.x = j[k].x + ox; q.y = j[k].y; }
      if (j.haF && j.tip) { o.hilt = { x: j.haF.x + ox, y: j.haF.y }; const d = Math.hypot(j.tip.x - j.haF.x, j.tip.y - j.haF.y) || 1, h = (f.wpn && f.wpn.handle) || 24; o.pomm = { x: o.hilt.x - (j.tip.x - j.haF.x) / d * h, y: o.hilt.y - (j.tip.y - j.haF.y) / d * h }; }
      o.armed = !!j.hasSword; o.sheathed = !!j.wSheath; o.dir = f.dir < 0 ? -1 : 1; o.lite = true;
      return o;
    };
  }
  { // the drawn body (and its ghosts: none in the light look) at its offset
    const FPd = ND.Fighter.prototype, dr0 = FPd.draw, gh0 = FPd.drawGhosts;
    FPd.draw = function (ctx) {
      if (!D.lite || !this.dz) return dr0.apply(this, arguments);
      const ox = D.liteOffset(this);
      if (!ox) return dr0.apply(this, arguments);
      ctx.save(); ctx.translate(ox, 0);
      try { return dr0.apply(this, arguments); } finally { ctx.restore(); }
    };
    if (gh0) FPd.drawGhosts = function () { if (D.lite && this.dz) return; return gh0.apply(this, arguments); };
  }
  // A scabbard worn on the back (Kuro's nodachi: js/skeleton.js saya, drawn by the recorded-motion and 2.5D bodies) never
  // through the floor: lying down, it turns round its mouth until its end rests on the floor (drawing only)
  if (ND._draw && ND._draw.saya && !ND._draw.saya.duelClamp) {
    const K = ND._draw, saya0 = K.saya;
    K.saya = function (ctx, j, c, D1, wpn) {
      const TF = K.TF;
      if (!j || !j.sh || !j.hip || !TF || !wpn) return saya0.apply(this, arguments);
      const bx = -TF.nx, by = -TF.ny, ux = TF.ux, uy = TF.uy, sl = (wpn.blade + wpn.handle) / 120;
      const x0 = j.sh.x + bx * 2 + ux * 16 * sl, y0 = j.sh.y + by * 2 + uy * 16 * sl, x1 = j.hip.x + bx * 40 - ux * 36 * sl, y1 = j.hip.y + by * 40 - uy * 36 * sl;
      const FL = -3;
      if (!(y1 > FL) || !(y0 < FL)) return saya0.apply(this, arguments);
      const Lh = Math.hypot(x1 - x0, y1 - y0), dy = FL - y0, dx = (Math.sign(x1 - x0) || 1) * Math.sqrt(Math.max(0, Lh * Lh - dy * dy));
      const rot = Math.atan2(dy, dx) - Math.atan2(y1 - y0, x1 - x0);
      ctx.save(); ctx.translate(x0, y0); ctx.rotate(rot); ctx.translate(-x0, -y0);
      try { return saya0.apply(this, arguments); } finally { ctx.restore(); }
    };
    K.saya.duelClamp = true;
  }
  const present0 = ND.anim.present;
  ND.anim.present = function (f, dt, hold, sj) {
    present0.call(this, f, dt, hold, sj);
    if (f.dz && !f.dead) apply(f, dt, hold);
  };
  // ------------------------------------------------------------------ how the sword is held, and weight (drawing only)
  // js/anim.js asks this just before it solves the drawn joints (ND.anim.preSolve), on the display pose D:
  //  1. the grip of a swordsman: the drawn sword is held in BOTH hands (sword hand just behind the guard, the off hand at
  //     the end of the handle: anim.js gripSlide places it) wherever the off hand can reach the handle; one hand only
  //     when it is meant: the iai draw (the off hand holds the scabbard's mouth and pulls it back: saya-biki, then rests
  //     there while the blade is home), a hand busy in the showpiece (a stool, a bottle), a roll, a fall.
  //  2. weight: no part of the drawn pose moves further in one step than a body can (LIM, per 1/120 s): a pose that
  //     would snap (a new state, a key a move reaches at once) is carried there over a few frames instead.
  const LIM = { hx: 6, hy: 6, lean: 0.09, hd: 0.12, ax: 8, ay: 8, sw: 0.26, gx: 9, gy: 9, grip: 0.18, f1x: 9, f1y: 9, f2x: 9, f2y: 9 };
  const LKEYS = Object.keys(LIM);
  const FREE = { launch: 1, down: 1, getup: 1, droll: 1, dpick: 1, win: 1, dead: 1 };
  const PS = new WeakMap();
  const SAYA_PULL = 12, SAYA_T = [0.07, 0.3];
  // the off hand at the scabbard's mouth (pose space: x forward, y down; relative to the sword shoulder as solve reads gx/gy)
  function handOnSaya(D0, back) {
    const ux = Math.sin(D0.lean), uy = -Math.cos(D0.lean), nx = -uy, ny = ux;
    const shx = D0.hx + ux * L.torso * 0.86, shy = D0.hy + uy * L.torso * 0.86;
    let ox = D0.hx + ux * 5 + nx * 13, oy = D0.hy + uy * 5 + ny * 13;
    ox += -0.955 * (back + 7); oy += 0.296 * (back + 7); // (round the scabbard just behind its mouth, behind the sword hand)
    D0.gx = ox - shx; D0.gy = oy - shy; D0.grip = 0;
  }
  const SJ = {};
  function canReach(D0, wpn) {
    ND.solve(D0, 0, 0, 1, SJ, wpn);
    const ux = Math.cos(D0.sw), uy = Math.sin(D0.sw), t = Math.max(wpn.handle * 0.55, wpn.handle - 5.5);
    return Math.hypot(SJ.haF.x - ux * t - (SJ.sh.x - 3), SJ.haF.y - uy * t - (SJ.sh.y + 1)) <= L.uArm + L.fArm - 1.5;
  }
  // (?weight=0: no limit on the drawn pose's speed, to compare)
  const WEIGHT = !/[?&]weight=0(&|$)/.test(location.search || '');
  const HJ = {};
  function clearHead(D0, wpn) {
    for (let it = 0; it < 3; it++) {
      ND.solve(D0, 0, 0, 1, HJ, wpn);
      // (the head's radius, a fist's, a little air)
      const hx = HJ.head.x, hy = HJ.head.y, R = 27;
      let pen = 0, nx = 0, ny = 0;
      const test = (x, y) => {
        const dx = x - hx, dy = y - hy, d = Math.hypot(dx, dy);
        if (d < R && R - d > pen) { pen = R - d; let ex = dx / (d || 1) + 0.7, ey = dy / (d || 1) - 0.2; const el = Math.hypot(ex, ey) || 1; nx = ex / el; ny = ey / el; }
      };
      const ux = Math.cos(D0.sw), uy = Math.sin(D0.sw);
      for (let q = -0.1; q <= 1.0001; q += 0.25) test(HJ.haF.x - ux * wpn.handle * q, HJ.haF.y - uy * wpn.handle * q);
      if (pen <= 0.5) return;
      D0.ax += nx * (pen + 1); D0.ay += ny * (pen + 1);
    }
  }
  const SLD = {};
  ND.anim.preSolve = function (f, D0, S, dt, hold, act) {
    if (!f.dz || f.dead) return;
    let P = PS.get(f);
    if (!P) PS.set(f, (P = { p: null, x: f.x, sh: 0, drawT: 9, atkSh: false, serial: -1 }));
    const wpn = f.wpn, armed = f.dz.armed !== false && !wpn.fist && !wpn.none;
    const st = f.state, free = FREE[st] || !!f.roll;
    // --- 1. the grip
    if (armed && !free) {
      const busy = D.seqHand ? D.seqHand(f) : null; // the showpiece: 'B' the off hand holds something, 'F' the sword hand
      const sh = wpn.iai ? (f.sheathed() ? 1 : 0) : 0;
      if (!hold) {
        if (sh !== P.sh) { if (!sh) P.drawT = 0; P.sh = sh; } else P.drawT += dt;
        if (f.serial !== P.serial) { P.serial = f.serial; P.atkSh = st === 'atk' && !!sh; }
      }
      if (busy === 'B' || busy === 'F') { /* the showpiece's own pose */ }
      else if (wpn.iai && (sh || busy === 'saya' || (st === 'atk' && (P.atkSh || P.drawT < SAYA_T[0] + SAYA_T[1])))) {
        // iai: the off hand on the scabbard: pulled back with it on the draw, resting there while the blade is home
        const t = P.drawT, back = sh ? 0 : SAYA_PULL * (t < SAYA_T[0] ? (t / SAYA_T[0]) : Math.max(0, 1 - (t - SAYA_T[0]) / SAYA_T[1]));
        handOnSaya(D0, back);
      } else if (D0.grip < 0.9 && canReach(D0, wpn)) D0.grip = 1;
    }
    // --- contact: the guard gives a little along the blow (hands driven back and down, the body rocks back), the
    // attacker's blade is knocked up and away from the guard (drawing only: the fight's guard and recoil are its own)
    if (armed && (st === 'block' || st === 'parry') && f.st < 0.16) {
      const g = Math.sin(Math.PI * f.st / 0.16) * (st === 'parry' ? 0.6 : 1);
      D0.ax -= 7 * g; D0.ay += 3 * g; D0.lean -= 0.05 * g; D0.hx -= 3 * g;
    } else if (armed && st === 'recoil' && f.st < 0.22) {
      const g = Math.sin(Math.PI * f.st / 0.22);
      D0.sw -= 0.35 * g; D0.ax -= 6 * g; D0.ay -= 4 * g; D0.lean -= 0.04 * g;
    }
    // --- 1b. a parried cut is still out in front when his deflecting counter (suriage and its kin, a.slide) comes: the
    // blade waits at the crossing for his to ride up it, and is knocked away at the deflection (the fight's own rk pose);
    // swept back behind her it left the counter nothing to slide on (2026-10-03, the owner's suriage screenshot)
    {
      const o = f.opp, A = o && o.state === 'atk' ? o.atk : null;
      if (armed && st === 'recoil' && A && A.counter && A.slide && D.aimPose && !o.dead) {
        // (until his deflection only: from his cut's hit frames on she reacts as the fight has her)
        const t = o.st, end = Math.min(Math.max(A.slide[1], A.defl || 0) + 0.03, (A.active ? A.active[0] : 1) - 0.06);
        const w = t <= end ? 1 : Math.max(0, 1 - (t - end) / 0.04);
        if (w > 0) {
          const cx = f.x + (o.x - f.x) * 0.45, cy = f.y - 124, ang = Math.atan2(-0.32, Math.sign(o.x - f.x) || f.dir);
          D.aimPose(f, SLD, D0, cx, cy, ang, 0.6);
          D0.ax += (SLD.ax - D0.ax) * w; D0.ay += (SLD.ay - D0.ay) * w;
          D0.sw += Math.atan2(Math.sin(SLD.sw - D0.sw), Math.cos(SLD.sw - D0.sw)) * w;
        }
      }
    }
    // --- 2. the handle and the fists never pass through the head: carried out in front of the face
    if (armed && !free && !(wpn.iai && f.sheathed())) clearHead(D0, wpn);
    // --- 3. weight
    if (!WEIGHT) { P.p = null; return; }
    const k = Math.max(dt, 1e-4) * 120 * (act ? 1.6 : 1);
    if (P.p && Math.abs(f.x - P.x) < 80 && !(S && S.ok === false)) {
      for (const q of LKEYS) {
        const lim = LIM[q] * k, d = D0[q] - P.p[q];
        if (d > lim) D0[q] = P.p[q] + lim; else if (d < -lim) D0[q] = P.p[q] - lim;
      }
    }
    P.p = ND.pose.copy(D0, P.p || {}); P.x = f.x;
  };
  D.depthTarget = target;
})(window.ND);
