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
  const FLAG = (() => { try { return /[?&]duel=\d/.test(location.search || ''); } catch (e) { return false; } })();
  if (!FLAG || !ND.duel || !ND.anim) return;
  const D = ND.duel, L = ND.LEN;
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
      if (!f.dz || f.dead) return null;
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
      if (reflect || inA || !this.dz || this.dead || this.hidden) return draw0.call(this, ctx, reflect, layer);
      inA = true;
      try { A3.draw(ctx, this); } finally { inA = false; }
    };
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
