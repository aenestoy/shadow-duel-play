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
    const tw = C[0], hp = C[1], dir = j.dir < 0 ? -1 : 1;
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
  const present0 = ND.anim.present;
  ND.anim.present = function (f, dt, hold, sj) {
    present0.call(this, f, dt, hold, sj);
    if (f.dz && !f.dead) apply(f, dt, hold);
  };
  D.depthTarget = target;
})(window.ND);
