// Shadow Duel — DUEL PROTOTYPE: the bind (blade lock) as it is DRAWN (?duel=1 only; js/duel.js startBind / bindPose).
//
// Drawing only: the fight's bind (its positions, timing, outcome) is untouched; this file reads it and says where each
// fighter's hands and blade must be so that the two blades really touch:
//   - ONE contact point between the fighters at chest-to-face height (the fight's own c.px, c.py), sliding a few units
//     towards the defender while the attacker presses down
//   - each blade passes through it at 0.38 of its length from the guard (the middle-to-lower third), the defender's
//     rising steeply, the attacker's pressing flatter over it: a clear X; the attacker's blade the nearer one
//   - the hands are solved to it by the drawings (js/depth25.js pose3d hook for the hand-keyed picture, js/mocap-duel.js
//     for the recorded one), the curve of the blade (sori) allowed for so the drawn ribbon itself crosses the point
//   - entering: the blades meet at once (the hands go to the point) while the bodies close in (the fight's own step);
//     leaving (the strike, the shove apart): the blades part from that same point over 0.12 s — never a jump
// D.bindGeom(f) → { h: hand (local 3D: x forward, y down, z to the camera), u: blade direction, e: its edge (the blade
// bows towards −e: the drawings take this edge so the ribbon crosses the point), w, C: {x, y}
// world } or null. D.bindPoint(f) → the contact point now (world) or null: the spark / contact flash goes there.
(function (ND) {
  'use strict';
  const FLAG = (() => { try { return !/[?&]duel=0(&|$)/.test(location.search || ''); } catch (e) { return true; } })(); // (the duel is the fight; ?duel=0: the old fight everywhere)
  if (!FLAG || !ND.duel) return;
  const D = ND.duel;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const HILT0 = 4, Q = 0.38; // (the guard ahead of the fist; the share of the blade from the guard to the contact)
  const ANG = { def: 62, att: 30 }; // degrees above the horizontal, towards the opponent
  const LAST = new WeakMap();

  // the contact point of bind c at its time (world)
  function point(c) {
    const sd = Math.sign(c.def.x - c.att.x) || 1, s = sstep(c.t / 0.6);
    return { x: c.px + sd * 4 * s, y: c.py };
  }
  function geomFor(f, c, C) {
    const isDef = c.def === f, dir = f.dir < 0 ? -1 : 1, wpn = f.wpn || ND.LEN;
    const a = (ANG[isDef ? 'def' : 'att'] * Math.PI) / 180, ux = Math.cos(a), uy = -Math.sin(a);
    const d = Q * wpn.blade + HILT0;
    // (the blade bows towards its back by ~3.2 × 4q(1 − q) at q: the hand moves the other way so the ribbon crosses C)
    const sori = (3.2 * wpn.blade) / 96 * 4 * Q * (1 - Q);
    // the edge faces down / forward in a bind (the blade pushes with its edge side): e ⟂ u, rotated towards +y
    const ex = -uy, ey = ux; // (perpendicular, pointing down-forward when the blade points up-forward)
    const hx = (C.x - f.x) * dir - ux * d + ex * sori, hy = C.y - uy * d + ey * sori;
    return { h: [hx, hy, isDef ? 6 : 10], u: [ux, uy, 0], e: [ex, ey, 0], C };
  }
  D.bindGeom = function (f) {
    if (!f || !f.dz || f.dead) return null;
    const clk = ND.simClock || 0, c = f.dz.cine;
    if (c && f.state === 'dbind' && !c.done && (f.dz.armed !== false) && c.def && c.att) {
      const C = point(c);
      const g = geomFor(f, c, C);
      // in: at once (the blades meet first); the strike: the defender's blade leaves the point over 0.06 s
      g.w = c.ph === 'bind' ? 1 : c.ph === 'strike' ? 1 - sstep(c.t2 / 0.06) : 1;
      LAST.set(f, { g, clk, x: f.x });
      return g.w > 0 ? g : null;
    }
    // leaving: the last bind geometry fades out (the shove apart, the clash after it) from where the blades were
    const L = LAST.get(f);
    if (L && clk >= L.clk && clk - L.clk < 0.12) {
      const dir = f.dir < 0 ? -1 : 1, g = Object.assign({}, L.g);
      g.h = [g.h[0] - (f.x - L.x) * dir, g.h[1], g.h[2]]; // (the hand stays where it was in the world)
      g.w = (L.g.w || 1) * (1 - sstep((clk - L.clk) / 0.12));
      return g.w > 0.01 ? g : null;
    }
    return null;
  };
  D.bindPoint = function (f) { const c = f && f.dz && f.dz.cine; return c && c.ph === 'bind' && !c.done ? point(c) : null; };
  // the line the two bodies keep behind: the bind's contact point, through the strike that ends it too
  D.gapPoint = function (f) { const c = f && f.dz && f.dz.cine; return c && !c.done && (f.state === 'dbind' || f.state === 'dcut') && c.def && c.att ? point(c) : null; };
  // the hand-keyed drawing (js/depth25.js pose3d): the sword hand and blade to the bind geometry
  if (ND.depth25) ND.depth25.bindHand = D.bindGeom;
  // ... and its bodies keep a gap: the drawn pose (js/anim.js display pose, after duel-depth's grip and weight rules)
  // leans back from the hip, and the hip steps back a little, until the front of the head / chest stays 6 behind the
  // contact point's line (the fight's own positions are untouched)
  const L = ND.LEN;
  // the front of the drawn upper body (local x forward): the chest's outline, the head with its hat (Kuro's kasa is wide)
  function frontOf(P, f) {
    const ux = Math.sin(P.lean), ha = P.lean + P.hd, hr = HEADR[f.ch.acc] || 15;
    const chest = P.hx + ux * L.torso * 0.75 + 19, head = P.hx + ux * L.torso + Math.sin(ha) * 15 + hr;
    return Math.max(chest, head);
  }
  const HEADR = { kasa: 33, kabuto: 19, hood: 17, oni: 17 }; // (measured on the drawn heads: Kuro's straw hat is ~66 wide)
  D.headR = (f) => HEADR[f.ch.acc] || 15;
  if (ND.anim && ND.anim.preSolve) {
    const ps0 = ND.anim.preSolve;
    ND.anim.preSolve = function (f, D0, S, dt, hold, act) {
      ps0.apply(this, arguments);
      if (!f.dz || f.dead || !D0) return;
      const C = D.gapPoint(f);
      if (!C) return;
      const dir = f.dir < 0 ? -1 : 1, room = (C.x - f.x) * dir - 12; // (a hat brim tilts forward with the head: room to spare)
      for (let i = 0; i < 24 && frontOf(D0, f) > room; i++) {
        if (D0.hx > -10) D0.hx -= 1.5; else D0.lean -= 0.04;
      }
    };
  }
})(window.ND);
