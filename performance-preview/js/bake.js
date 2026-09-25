// Shadow Duel — fighter part cache ("baking"). Low is unchanged; High is an opt-in prototype.
// Drawing a fighter from paths is about 130 path fills and strokes per frame (~6 ms each on a weak phone). Here each
// body part (thigh, shin, foot, knee bag, sleeve, forearm, sleeve mouth, hand, torso, head + neck, weapon,
// scabbard...) is drawn once with the same path code (skeleton.js drawing steps) into a small picture, and every
// frame the pictures are only placed: moved and rotated onto the part's bone (about 25 image draws per fighter).
// What can change a part's picture is in its cache key:
//   - light: parts shaded by the scene's key light (shading bands, rim light, gradients) are kept per 1/16 turn of
//     their world angle and per side the shading falls on, so the light stays on the correct side
//   - facing, front / back limb, the sleeve's sag (animated flutter, 1.5-unit steps), the fan's opening, the arrows
//     left in the quiver, the head's small animated ornaments (0.5-unit steps)
//   - drawing scale: pictures are made at scale levels 2^(n/4); a level is kept while the camera zoom stays within
//     about -30% / +3% of it
// Shapes made of two parts (thigh + knee bag, sleeve + forearm) are split so that outlines and fills overlap as in
// the path renderer. Live every frame (cheap): cloth ropes, knee creases, the chin / front-arm shadow on the torso
// (clipped to it on a scratch canvas), sword trail, blade light and tip glint, fan tassel, chain, the drawn bow.
// A half-turned fighter (fractional facing during spins) is drawn with paths.
// At most BUDGET pictures are made per fighter per frame; past that a neighbouring picture (next light step, sag
// step or scale level) stands in until it is made. Memory: each fighter's cache keeps at most CAP bytes and drops the
// least recently used pictures first (a fight on a phone uses about 1-2 MB per fighter).
window.ND = window.ND || {};
(function (ND) {
  'use strict';
  const K = ND._draw;
  if (!K) return;
  const { LT, TF, FF, HD, AG, SW, TB } = K;
  const TAU = Math.PI * 2, NB = 16, CAP = 12 * 1024 * 1024;

  // ---------------------------------------------------------------- cache
  // m: key → { cv, x0, y0, w, h (local frame, world units), len (bone length when drawn), last (use), bytes }
  function Cache(high = false) { return { high, m: new Map(), bytes: 0, frame: 0, lv: -1, bakes: 0, hits: 0, live: 0, col: null, acc: null, wpn: null, ltx: null }; }
  ND.bakeCache = Cache;
  ND.bakeStats = (F) => ({ parts: F.m.size, kb: Math.round(F.bytes / 1024), bakes: F.bakes, hits: F.hits, live: F.live, level: F.lv });
  // Match preparation may leave missing parts blank behind its opaque loading screen. Live drawing never does.
  let preparing = false, pending = 0;
  ND.prepareBaked = function (draw) {
    preparing = true; pending = 0;
    try { draw(); return pending === 0; } finally { preparing = false; }
  };
  const release = (e) => { if (typeof e.cv.close === 'function') e.cv.close(); };
  function clear(Fc) { for (const e of Fc.m.values()) release(e); Fc.m.clear(); Fc.bytes = 0; }
  ND.clearBakeCache = clear;
  function sameWeapon(a, b) {
    return a === b || !!a && !!b && a.type === b.type && a.blade === b.blade && a.handle === b.handle &&
      a.twin === b.twin && a.dual === b.dual && a.iai === b.iai;
  }

  // state of the fighter being drawn (set by drawNinjaBaked, read by the part functions below)
  let F = null, J = null, C = null, D = null, WPN = null, ACC = '', SD = 1, LV = 0, S = 1;
  let BM = null; // the target context's transform at the start (DOMMatrix)
  const lvScale = (lv) => Math.pow(2, lv / 4 - 3);
  const lb = (a) => { const n = F?.high ? 128 : NB; let b = Math.floor((a / TAU) * n) % n; if (b < 0) b += n; return b; };
  // shade() in skeleton.js puts the highlight on the side whose normal faces the light: 1 when it flips
  const sflip = (dx, dy) => (-dy * LT.x + dx * LT.y < 0 ? 1 : 0);
  // High needs wider angle/fan fields (a <= 256, b < 32). Numeric keys avoid per-part string allocation.
  const key = (pid, a, b, c) => F?.high ? pid + 64 * (LV + 32 * (a + 512 * (b + 32 * (c + 1024)))) : pid + 64 * (LV + 32 * (a + 64 * (b + 256 * c)));

  // local bounding box (world units) of the part being baked, and its frame
  const BB = [0, 0, 0, 0];
  const bbSet = (x0, y0, x1, y1) => { BB[0] = x0; BB[1] = y0; BB[2] = x1; BB[3] = y1; };
  let FO = { x: 0, y: 0, a: 0, m: 1 };
  // add a world point (with padding r) to BB, in the frame FO
  function bbW(x, y, r) {
    const ca = Math.cos(FO.a), sa = Math.sin(FO.a), dx = x - FO.x, dy = y - FO.y;
    const lx = (ca * dx + sa * dy) * FO.m, ly = -sa * dx + ca * dy;
    if (lx - r < BB[0]) BB[0] = lx - r; if (ly - r < BB[1]) BB[1] = ly - r;
    if (lx + r > BB[2]) BB[2] = lx + r; if (ly + r > BB[3]) BB[3] = ly + r;
  }
  const bbReset = () => { BB[0] = BB[1] = 1e9; BB[2] = BB[3] = -1e9; };

  function newCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  // One offscreen canvas is reused for every bake (resized, drawn, then handed over as an ImageBitmap: no new canvas
  // per picture). Browsers without a 2D OffscreenCanvas give each picture its own canvas.
  let OC = null, OX = null;
  try { if (typeof OffscreenCanvas === 'function') { OC = new OffscreenCanvas(1, 1); OX = OC.getContext('2d'); if (!OX || !OC.transferToImageBitmap) OC = OX = null; } } catch (e) { OC = OX = null; }
  const USE_BM = !!OX;
  function newSprite(w, h) {
    if (!USE_BM) return newCanvas(w, h);
    // transferToImageBitmap leaves a fresh transparent backing store. Only resize dimensions that changed:
    // assigning both on every part needlessly reallocates/clears the intermediate backing store twice.
    const resized = OC.width !== w || OC.height !== h;
    if (OC.width !== w) OC.width = w;
    if (OC.height !== h) OC.height = h;
    // A resize also resets drawing state. Equal-sized successive parts still need that reset, so filters,
    // line styles and clipping from one part can never affect another (including older browser fallbacks).
    if (!resized) { if (typeof OX.reset === 'function') OX.reset(); else OC.width = w; }
    return OC;
  }

  // Draws part `pid` (cache key a, b, c) whose local frame is: origin (ox, oy), x axis at world angle `ang`, mirrored
  // along x when m = -1, stretched along x to `len` (the bone's current length; 0 = no stretch). On a miss `box()`
  // sets BB (local bounds, world units) and `draw(ctx)` paints the part in world coordinates, exactly as the path
  // renderer does.
  function part(ctx, pid, a, b, c, ox, oy, ang, m, len, box, draw) {
    const k = key(pid, a, b, c);
    let e = F.m.get(k);
    if (e) F.hits++;
    if (!e && preparing && F.fb >= BUDGET) { pending++; return; }
    // High never substitutes a neighbouring pose, light angle or scale. Keep the original path drawing on
    // a cache miss once this frame's preparation budget is used, instead of blocking or lowering detail.
    if (!e && F.high && !preparing && F.fb >= BUDGET) { F.live++; restore(ctx); draw(ctx); return; }
    // over this frame's bake budget: a neighbour picture (next light step, sag step, scale level) stands in for now
    if (!e && !F.high && !preparing && F.fb >= BUDGET) e = near(pid, a, b, c);
    if (!e) {
      F.fb++;
      FO.x = ox; FO.y = oy; FO.a = ang; FO.m = m;
      box();
      const x0 = BB[0], y0 = BB[1], pw = Math.max(1, Math.ceil((BB[2] - x0) * S) + 2), ph = Math.max(1, Math.ceil((BB[3] - y0) * S) + 2);
      const cv = newSprite(pw, ph), x = USE_BM ? OX : cv.getContext('2d');
      const ca = Math.cos(ang), sa = Math.sin(ang);
      // device = S·(local − (x0, y0)) + 1, local = (m·R(−ang)(w − o)).x, (R(−ang)(w − o)).y
      x.setTransform(S * ca * m, -S * sa, S * sa * m, S * ca, S * (-(ca * ox + sa * oy) * m - x0) + 1, S * (sa * ox - ca * oy - y0) + 1);
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.lineJoin = 'round'; x.lineCap = 'round';
      draw(x);
      e = { cv: USE_BM ? cv.transferToImageBitmap() : cv, x0: x0 - 1 / S, y0: y0 - 1 / S, w: pw / S, h: ph / S, len, last: 0, bytes: pw * ph * 4 };
      F.m.set(k, e); F.bytes += e.bytes; F.bakes++;
    }
    e.last = F.frame;
    const kx = m * (len > 0 && e.len > 0 ? len / e.len : 1), ca = Math.cos(ang), sa = Math.sin(ang);
    // transform = BM · translate(o) · rotate(ang) · scale(kx, 1)
    ctx.setTransform((BM.a * ca + BM.c * sa) * kx, (BM.b * ca + BM.d * sa) * kx, -BM.a * sa + BM.c * ca, -BM.b * sa + BM.d * ca,
      BM.a * ox + BM.c * oy + BM.e, BM.b * ox + BM.d * oy + BM.f);
    ctx.drawImage(e.cv, e.x0, e.y0, e.w, e.h);
  }
  const BUDGET = 3; // bakes per fighter per frame before neighbours are used (a bake costs about as much as a part drawn with paths)
  const NEAR_LEVELS = [0, -1, 1, -2, 2], NEAR_VALUES = [1, -1, 2, -2], NEAR_ANGLES = [1, NB - 1];
  function near(pid, a, b, c) {
    const lv = LV;
    let e = null;
    for (const dl of NEAR_LEVELS) {
      LV = lv + dl;
      if (LV < 0 || LV > 31) continue;
      if (dl && (e = F.m.get(key(pid, a, b, c)))) break;
      if (CQ.has(pid)) { for (const dc of NEAR_VALUES) if (c + dc >= 0 && (e = F.m.get(key(pid, a, b, c + dc)))) break; if (e) break; }
      if (LBA.has(pid)) { for (const da of NEAR_ANGLES) if ((e = F.m.get(key(pid, (a + da) % NB, b, c)))) break; if (e) break; }
    }
    LV = lv;
    return e;
  }
  const restore = (ctx) => ctx.setTransform(BM.a, BM.b, BM.c, BM.d, BM.e, BM.f);

  function trim(Fc) {
    if (Fc.bytes <= CAP) return;
    const all = [...Fc.m.entries()].sort((p, q) => p[1].last - q[1].last);
    for (const [k, e] of all) { if (Fc.bytes <= CAP * 0.75) break; Fc.m.delete(k); Fc.bytes -= e.bytes; release(e); }
  }

  // ---------------------------------------------------------------- parts
  const P = { SAYA: 1, SAYAHIP: 2, QUIVER: 3, TANTO: 4, SHIN: 5, FOOT: 6, TOUT: 7, TFILL: 8, KTOP: 9, FOUT: 10, SLEEVE: 11,
    FORE: 12, MOUTH: 13, FIST: 14, OPEN: 15, BODY: 16, NECK: 18, SCARF: 19, JUZU: 20, HEAD: 21, KUSA: 22, WPN: 23, WPN2: 24, HEADN: 25 };
  // parts whose key `a` is a light step and whose `c` is a quantized continuous value (sag, ornament swing, fist side)
  const LBA = new Set([P.SHIN, P.TFILL, P.KTOP, P.SLEEVE, P.FORE, P.BODY, P.SCARF, P.JUZU, P.HEAD, P.HEADN]);
  const CQ = new Set([P.SLEEVE, P.MOUTH, P.FIST, P.HEAD, P.HEADN]);
  const torsoAng = () => Math.atan2(TF.uy, TF.ux);
  const sdBit = () => (SD < 0 ? 1 : 0);

  // scabbards (torso frame)
  let sx0 = 0, sy0 = 0, sx1 = 0, sy1 = 0;
  const bbSeg = () => { bbReset(); bbW(sx0, sy0, 6); bbW(sx1, sy1, 6); };
  const bbSegCord = () => { bbReset(); bbW(sx0, sy0, 9); bbW(sx1, sy1, 7); bbW((sx0 * 3 + sx1) / 4, (sy0 * 3 + sy1) / 4, 10); };
  const drSaya = (x) => K.saya(x, J, C, D, WPN), drSayaHip = (x) => K.sayaHip(x, J, C, D, WPN), drQuiver = (x) => K.quiverBack(x, J, C, D);
  function sheath(ctx) {
    const wt = WPN.type;
    const bx = -TF.nx, by = -TF.ny, ux = TF.ux, uy = TF.uy;
    if (wt === 'yumi') {
      const x0 = J.sh.x + bx * 11 + ux * 12, y0 = J.sh.y + by * 11 + uy * 12, x1 = J.hip.x + bx * 20 + ux * 4, y1 = J.hip.y + by * 20 + uy * 4;
      const n = Math.max(0, Math.min(5, J.wAmmo == null ? 5 : J.wAmmo)), bow = J.wBow > 0.5 ? 1 : 0;
      sx0 = x0; sy0 = y0; sx1 = x1; sy1 = y1;
      part(ctx, P.QUIVER, sdBit() + 2 * sflip(x0 - x1, y0 - y1), n + 8 * bow, 0, x1, y1, Math.atan2(y0 - y1, x0 - x1), 1, 0, bbQuiver, drQuiver);
    } else if (WPN.iai) {
      if (J.wSheath && J.tip) {
        const a = Math.atan2(J.tip.y - J.haF.y, J.tip.x - J.haF.x), L0 = WPN.blade + 6, tx = Math.cos(a), ty = Math.sin(a);
        sx0 = J.haF.x; sy0 = J.haF.y; sx1 = sx0 + tx * (L0 + 2); sy1 = sy0 + ty * (L0 + 2);
        part(ctx, P.SAYAHIP, 1 + 2 * sflip(tx, ty), 0, 0, J.haF.x, J.haF.y, a, 1, 0, bbSegCord, drSayaHip);
      } else {
        let tx = -0.955 * J.dir, ty = 0.296; const tl = Math.hypot(tx, ty); tx /= tl; ty /= tl;
        sx0 = TF.hx + TF.ux * 5 + TF.nx * 13; sy0 = TF.hy + TF.uy * 5 + TF.ny * 13; sx1 = sx0 + tx * (WPN.blade + 6); sy1 = sy0 + ty * (WPN.blade + 6);
        // resting: the scabbard keeps its world direction, its mouth follows the belt
        part(ctx, P.SAYAHIP, 2 * sflip(tx, ty) + 4 * sdBit(), 0, 0, sx0, sy0, Math.atan2(ty, tx), 1, 0, bbSegCord, drSayaHip);
      }
    } else if (wt !== 'naginata' && wt !== 'bo' && wt !== 'tessen' && wt !== 'kusarigama') {
      const sl = (WPN.blade + WPN.handle) / 120;
      sx0 = J.sh.x + bx * 2 + ux * 16 * sl; sy0 = J.sh.y + by * 2 + uy * 16 * sl;
      sx1 = J.hip.x + bx * 40 - ux * 36 * sl; sy1 = J.hip.y + by * 40 - uy * 36 * sl;
      part(ctx, P.SAYA, sdBit() + 2 * sflip(sx1 - sx0, sy1 - sy0), 0, 0, sx0, sy0, Math.atan2(sy1 - sy0, sx1 - sx0), 1, 0, bbSeg, drSaya);
    }
  }
  function bbQuiver() {
    bbReset(); bbW(sx0, sy0, 26); bbW(sx1, sy1, 12);
    if (!(J.wBow > 0.5)) {
      const bx = -TF.nx, by = -TF.ny, ux = TF.ux, uy = TF.uy;
      bbW(J.sh.x + ux * 38 + bx * 4, J.sh.y + uy * 38 + by * 4, 5); bbW(J.hip.x - ux * 44 + bx * 10, J.hip.y - uy * 44 + by * 10, 5);
      bbW(J.hip.x + ux * 18 + bx * 22, J.hip.y + uy * 18 + by * 22, 6);
    }
  }

  // legs
  let LEN = 0;
  const bbThigh = () => bbSet(-12.5, -12.5, LEN + 12.5, 12.5);
  const bbShin = () => bbSet(-12.5, -12.5, LEN + 8.5, 12.5);
  const bbKTop = () => bbSet(-12.5, -12.5, LEN * 0.36 + 11, 12.5);
  const bbFoot = () => bbSet(-8, -9, 16, 9);
  // Thigh + knee bag are one shape in the path renderer (one outline, one fill, then both shadings). Here: thigh
  // outline; shin with the knee bag's outline and fill over it; foot; thigh fill with its shading and pull line
  // (covers the knee bag's outline inside the thigh); knee bag shading and hem on top.
  const drTOut = (x) => K.legUpper(x, D, true, false, true, false);
  const drShin = (x) => { K.legShin(x, D); K.legUpper(x, D, false, true, true, true); };
  const drFoot = (x) => K.legFoot(x, J, D);
  const drThigh = (x) => { K.legUpper(x, D, true, false, false, true); K.legShade(x, D, true, false); K.legLines(x, J, false, true, false); };
  const drKnee = (x) => { K.legShade(x, D, false, true); K.legLines(x, J, true, false, false); };
  // Steps in drawing order; `rev` runs them backwards (the back limbs are drawn behind the torso with
  // 'destination-over', see drawNinjaBaked). The thigh outline (one stroke) and the knee creases (they follow the
  // bend) are drawn live: a single path is cheaper than placing a picture.
  const FWD6 = [0, 1, 2, 3, 4, 5], REV6 = [5, 4, 3, 2, 1, 0];
  function leg(ctx, front, rev) {
    const G = K.legGeom(J, front, C), hip = G.hip, kn = G.kn, ft = G.ft, fb = front ? 1 : 0;
    const ta = Math.atan2(kn.y - hip.y, kn.x - hip.x), tl = Math.hypot(kn.x - hip.x, kn.y - hip.y);
    const sa = Math.atan2(ft.y - kn.y, ft.x - kn.x), sl = Math.hypot(ft.x - kn.x, ft.y - kn.y);
    const sf = sflip(ft.x - kn.x, ft.y - kn.y);
    for (const i of rev ? REV6 : FWD6) {
      if (i === 0) { restore(ctx); drTOut(ctx); }
      else if (i === 1) { LEN = sl; part(ctx, P.SHIN, lb(sa), fb + 2 * sf, 0, kn.x, kn.y, sa, 1, sl, bbShin, drShin); }
      else if (i === 2) { K.footFrame(ft, kn, J.dir, G.s); part(ctx, P.FOOT, fb, sdBit(), 0, ft.x, ft.y, Math.atan2(FF.fy, FF.fx), 1, 0, bbFoot, drFoot); }
      else if (i === 3) { LEN = tl; part(ctx, P.TFILL, lb(ta), fb + 2 * sflip(kn.x - hip.x, kn.y - hip.y) + 4 * sdBit(), 0, hip.x, hip.y, ta, 1, tl, bbThigh, drThigh); }
      else if (i === 4) { LEN = sl; part(ctx, P.KTOP, lb(sa), fb + 2 * sf, 0, kn.x, kn.y, sa, 1, sl, bbKTop, drKnee); }
      else { restore(ctx); K.legLines(ctx, J, false, false, true); }
    }
    restore(ctx);
  }

  // arms
  let SAGQ = 0;
  const SAG_STEP = 1.5; // sleeve sag steps (world units, about a pixel on a phone; the flutter swings about ±2)
  function bbSleeve() {
    const { sag, nx, ny, s } = AG;
    const up = 9.4 * s + sag + 3, dn = 8.2 * s + 3, flip = nx * -Math.sin(FO.a) + ny * Math.cos(FO.a) < 0;
    bbSet(-9, flip ? -up : -dn, LEN + 8, flip ? dn : up);
    if (ACC === 'kabuto') { BB[0] = Math.min(BB[0], -2); BB[2] = Math.max(BB[2], 27); BB[1] = Math.min(BB[1], -13); BB[3] = Math.max(BB[3], 13); }
  }
  function bbMouth() {
    const { sag, nx, ny, s } = AG;
    const up = 9.4 * s + sag + 3, dn = 8.4 * s + 3, flip = nx * -Math.sin(FO.a) + ny * Math.cos(FO.a) < 0;
    bbSet(-5, flip ? -up : -dn, 9, flip ? dn : up);
  }
  const bbFore = () => bbSet(-7.5, -7.5, LEN + 7.5, 7.5);
  const bbFist = () => bbSet(-9.5, -9.5, 10, 9.5);
  const bbOpen = () => bbSet(-6, -9, 11, 9);
  // Sleeve and forearm share one outline in the path renderer: the forearm's outline goes first (the sleeve covers
  // it), then the sleeve (outline, fill, shading, folds), the forearm (wrap, cuff), the sleeve mouth over the elbow
  const drFOut = (x) => K.armOutline(x, D, false, true);
  const drSleeve = (x) => { K.armOutline(x, D, true, false); K.armSleeve(x, C, D, ACC); };
  const drFore = (x) => K.armFore(x, D);
  const drMouth = (x) => K.armMouth(x, D);
  const drHand = (x) => K.armHand(x, J, D);
  function arm(ctx, front, rev) {
    const G = K.armGeom(J, front, C), sh = G.sh, el = G.el, ha = G.ha, fb = front ? 1 : 0;
    const ua = Math.atan2(el.y - sh.y, el.x - sh.x), ul = Math.hypot(el.x - sh.x, el.y - sh.y);
    const fa = Math.atan2(ha.y - el.y, ha.x - el.x), fl = Math.hypot(ha.x - el.x, ha.y - el.y);
    // n (the side the sleeve hangs to) is the upper arm's normal turned downwards: 1 when it is R(-90°) of the bone
    const nf = (G.nx * -Math.sin(ua) + G.ny * Math.cos(ua)) < 0 ? 1 : 0;
    SAGQ = F.high ? Math.round(G.sag * 8) : Math.max(0, Math.min(40, Math.round(G.sag / SAG_STEP) + 8));
    K.handInfo(J, WPN);
    for (const i of rev ? REV6 : FWD6) {
      if (i === 0) { restore(ctx); drFOut(ctx); } // forearm outline: one stroke, live
      else if (i === 1) { LEN = ul; part(ctx, P.SLEEVE, lb(ua), fb + 2 * nf + 4 * sflip(el.x - sh.x, el.y - sh.y), SAGQ, sh.x, sh.y, ua, 1, ul, bbSleeve, drSleeve); }
      else if (i === 2) { LEN = fl; part(ctx, P.FORE, lb(fa), fb + 2 * sflip(ha.x - el.x, ha.y - el.y), 0, el.x, el.y, fa, 1, fl, bbFore, drFore); }
      else if (i === 3) part(ctx, P.MOUTH, 0, fb + 2 * nf, SAGQ, el.x, el.y, ua, 1, 0, bbMouth, drMouth);
      else if (i === 4) { if (HD.w) { restore(ctx); weapon(ctx, ha.x, ha.y, HD.a2, HD.w === 'tessen' ? 2 : 1, rev); } }
      else if (HD.k === 'fist') {
        const a = Math.atan2(HD.hy, HD.hx), fa2 = Math.atan2(G.fy, G.fx);
        let rel = Math.round(((fa2 - a) / TAU) * 8) % 8; if (rel < 0) rel += 8; // forearm side of the fist, 1/8 turn
        part(ctx, P.FIST, lb(a) >> 1, fb, rel, ha.x, ha.y, a, 1, 0, bbFist, drHand);
      } else {
        const tf = -G.fy * SD - G.fx < 0 ? 1 : 0; // openHand's thumb side
        part(ctx, P.OPEN, 0, fb + 2 * tf + 4 * sdBit(), 0, ha.x, ha.y, Math.atan2(G.fy, G.fx), 1, 0, bbOpen, drHand);
      }
    }
    restore(ctx);
  }

  // weapons: which = 0 the main weapon (front hand), 1 the second tantō, 2 the second fan (back hand)
  let WA = 0, WHX = 0, WHY = 0, WHICH = 0;
  function bbWpn() {
    const t = WPN.type, BL = WHICH === 2 ? WPN.blade * 0.94 : WPN.blade, HL = WPN.handle;
    if (t === 'tessen') { bbSet(-9, -(BL + 4), BL + 4, BL + 4); return; }
    if (t === 'kusarigama') { const TOP = BL - 16; bbSet(-HL - 6, SD > 0 ? -6 : -34, TOP + 11, SD > 0 ? 34 : 6); return; }
    if (t === 'bo') { bbSet(-HL - 4, -6, BL + 4, 6); return; }
    bbSet(-HL - 5, -9, BL + 4, 9);
  }
  const drWpn = (x) => {
    SW.m = 1;
    try {
      if (WHICH === 2) K.drawTessen(x, WHX, WHY, WA, C, J.wFanB || 0, WPN.blade * 0.94, J.dir, 0);
      else K.drawSword(x, WHX, WHY, WA, C, 0, WPN, 'high', WHICH === 1 ? null : J);
    } finally { SW.m = 0; }
  };
  // tessen opening in 1/16 steps (the fan's paper and ribs are redrawn per step)
  const fanQ = (o) => { const n = F.high ? 256 : 16; return Math.max(0, Math.min(n, Math.round(o * n))); };
  // rev: drawn behind what is already there ('destination-over'): steps backwards, without the additive blade light
  function weapon(ctx, hx, hy, ang, which, rev) {
    const t = WPN.type;
    WA = ang; WHX = hx; WHY = hy; WHICH = which;
    if (which === 0 && t === 'yumi' && J.wBow > 0.5 && J.haB) { // the drawn bow bends with the pull: live
      K.drawSword(ctx, hx, hy, ang, C, glint, WPN, 'high', J);
      return;
    }
    const tessen = t === 'tessen';
    if (tessen && !rev) tassel(ctx, hx, hy, ang, which);
    let a = 0, b = which;
    if (tessen) { a = fanQ(which === 2 ? J.wFanB || 0 : J.wFan || 0); b += 4 * sdBit(); }
    else if (t === 'kusarigama') b += 4 * sdBit();
    else if (t === 'bo') { const cs = Math.cos(ang), sn = Math.sin(ang); b += 4 * (-sn * LT.x + cs * LT.y < 0 ? 1 : 0); }
    else if (which === 0 && J.wSheath) b += 8;
    part(ctx, which ? P.WPN2 : P.WPN, a, b, 0, hx, hy, ang, 1, 0, bbWpn, drWpn);
    restore(ctx);
    if (rev) { if (tessen) tassel(ctx, hx, hy, ang, which); return; }
    if (which !== 2) { SW.m = 3; try { K.drawSword(ctx, hx, hy, ang, C, which ? 0 : glint, WPN, 'high', which === 1 ? null : J); } finally { SW.m = 0; } }
  }
  function tassel(ctx, hx, hy, ang, which) {
    SW.m = 2;
    try { if (which === 2) K.drawTessen(ctx, hx, hy, ang, C, J.wFanB || 0, WPN.blade * 0.94, J.dir, 0); else K.drawSword(ctx, hx, hy, ang, C, glint, WPN, 'high', J); } finally { SW.m = 0; }
  }
  let glint = 0;

  // torso (with the live shadows on a scratch canvas, clipped to the torso by 'source-atop')
  const bbRim = () => { const bk = ACC === 'mai' ? 33 : 24; bbSet(-TF.ln * 0.24 - 3.5, SD > 0 ? -bk : -21, TF.ln * 1.1 + 3.5, SD > 0 ? 21 : bk); };
  const drBody = (x) => K.drawTorso(x, J, C, D, ACC, F.high ? TB.BODY : TB.BODY | TB.RIM | TB.KNOT);
  let scr = null, scx = null;
  function torso(ctx) {
    const ta = torsoAng(), a = lb(ta), b = sdBit(), ln = TF.ln;
    if (F.high) {
      part(ctx, P.BODY, a, b, 0, TF.hx, TF.hy, ta, 1, ln, bbRim, drBody);
      restore(ctx);
      // Preserve the original vector clip, then AO, rim and knot ordering. No raster alpha-mask approximation.
      K.drawTorso(ctx, J, C, D, ACC, TB.AO | TB.RIM | TB.KNOT);
      return;
    }
    // device bounds of the torso pictures (+ knot / bow) via the torso's corners
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const ca = Math.cos(ta), sa = Math.sin(ta);
    for (let i = 0; i < 4; i++) {
      const lx = i & 1 ? ln * 1.1 + 4 : -ln * 0.24 - 4, ly = i & 2 ? 34 : -34;
      const wx = TF.hx + ca * lx - sa * ly, wy = TF.hy + sa * lx + ca * ly;
      const dx = BM.a * wx + BM.c * wy + BM.e, dy = BM.b * wx + BM.d * wy + BM.f;
      if (dx < x0) x0 = dx; if (dx > x1) x1 = dx; if (dy < y0) y0 = dy; if (dy > y1) y1 = dy;
    }
    x0 = Math.floor(x0); y0 = Math.floor(y0); x1 = Math.ceil(x1); y1 = Math.ceil(y1);
    const w = x1 - x0, h = y1 - y0;
    if (w <= 0 || h <= 0 || w > 4096 || h > 4096) return;
    if (!scr) { scr = newCanvas(w, h); scx = scr.getContext('2d'); }
    if (scr.width < w || scr.height < h) { scr.width = Math.max(scr.width, w); scr.height = Math.max(scr.height, h); scx = scr.getContext('2d'); }
    scx.setTransform(1, 0, 0, 1, 0, 0); scx.globalCompositeOperation = 'source-over'; scx.globalAlpha = 1;
    scx.clearRect(0, 0, w, h);
    const M0 = BM;
    BM = SCR_M; SCR_M.a = M0.a; SCR_M.b = M0.b; SCR_M.c = M0.c; SCR_M.d = M0.d; SCR_M.e = M0.e - x0; SCR_M.f = M0.f - y0;
    try {
      part(scx, P.BODY, a, b, 0, TF.hx, TF.hy, ta, 1, ln, bbRim, drBody);
      restore(scx);
      scx.lineJoin = 'round'; scx.lineCap = 'round';
      scx.globalCompositeOperation = 'source-atop'; K.torsoAO(scx, J); scx.globalCompositeOperation = 'source-over';
    } finally { BM = M0; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(scr, 0, 0, w, h, x0, y0, w, h);
    restore(ctx);
  }
  const SCR_M = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  // on an empty layer the torso goes first, so its shadows can be clipped to it with 'source-atop' directly
  function torsoLayer(ctx) {
    const ta = torsoAng();
    part(ctx, P.BODY, lb(ta), sdBit(), 0, TF.hx, TF.hy, ta, 1, TF.ln, bbRim, drBody);
    restore(ctx);
    ctx.globalCompositeOperation = 'source-atop'; K.torsoAO(ctx, J); ctx.globalCompositeOperation = 'source-over';
  }

  // neck / scarf, prayer beads, tantō sheath, head, armour skirt
  let NA = 0;
  const bbNeck = () => bbSet(-8.5, -8.5, LEN + 8.5, 8.5);
  const bbScarf = () => bbSet(TF.ln - 18, -15, TF.ln + 12, 15);
  const bbJuzu = () => bbSet(TF.ln * 0.5, -16, TF.ln + 6, 16);
  const bbTanto = () => { bbReset(); bbW(TF.hx + TF.ux * 9 + TF.nx * 14, TF.hy + TF.uy * 9 + TF.ny * 14, 5); bbW(TF.hx - TF.ux + TF.nx * -24, TF.hy - TF.uy + TF.ny * -24, 5); };
  const bbKusa = () => bbSet(-24, -22, 5, 22);
  const drNeck = (x) => K.neckPart(x, J, C, D, ACC);
  const drJuzu = (x) => K.juzu(x, J, C, D);
  const drTanto = (x) => K.tantoSheath(x, C, D);
  const drKusa = (x) => K.kusazuri(x, C, D);
  const drHead = (x) => K.drawHead(x, J, C, D, ACC);
  // head with its neck (the neck's small bend against the torso is taken from the pose it was baked in)
  const drHeadN = (x) => { K.neckPart(x, J, C, D, ACC); K.drawHead(x, J, C, D, ACC); };
  const bbHeadN = () => { bbHead(); BB[3] = Math.max(BB[3], 27); BB[0] = Math.min(BB[0], -9); BB[2] = Math.max(BB[2], 9); };
  // head bounds in its own frame (x forward, y down; R = 12.5)
  const HEADBB = { kasa: [-31, -22, 31, 18], oni: [-27, -27, 22, 18], kabuto: [-22, -32, 25, 20], aoi: [-24, -32, 21, 18], tsubame: [-32, -27, 21, 18],
    mai: [-23, -25, 21, 18], hood: [-24, -24, 21, 18], tora: [-24, -25, 21, 18], scarf: [-26, -21, 21, 18], def: [-21, -21, 21, 18] };
  const bbHead = () => { const h = HEADBB[ACC] || HEADBB.def; bbSet(h[0], h[1], h[2], h[3]); };
  // the head's small animated ornaments, in 0.5-unit steps (see headMai, headAoi, headBand)
  function headAnim() {
    const t = ND.scene ? ND.scene.t : 0;
    const sw = ACC === 'mai' ? Math.sin(t * 3.1) * 1.2 : ACC === 'aoi' ? Math.sin(t * 2.4) * 0.8 : ACC === 'scarf' ? Math.sin(t * 2.6) * 0.9 : 0;
    return F.high ? Math.round(sw * 16) : Math.round(sw / 0.5) + 8;
  }
  function neckAndHead(ctx) {
    const ta = torsoAng();
    const neckInHead = !F.high && ACC !== 'scarf' && ACC !== 'monk';
    if (ACC === 'scarf') part(ctx, P.SCARF, lb(ta), sdBit(), 0, TF.hx, TF.hy, ta, 1, TF.ln, bbScarf, drNeck);
    else if (!neckInHead) {
      const ax = J.neck.x - TF.ux * 2, ay = J.neck.y - TF.uy * 2, bx = J.neck.x + (J.head.x - J.neck.x) * 0.55, by = J.neck.y + (J.head.y - J.neck.y) * 0.55;
      LEN = Math.hypot(bx - ax, by - ay); NA = Math.atan2(by - ay, bx - ax);
      if (F.high) { restore(ctx); drNeck(ctx); }
      else part(ctx, P.NECK, 0, 0, 0, ax, ay, NA, 1, LEN, bbNeck, drNeck);
    }
    if (ACC === 'monk') part(ctx, P.JUZU, lb(ta), sdBit(), 0, TF.hx, TF.hy, ta, 1, TF.ln, bbJuzu, drJuzu);
    if (WPN.type === 'yumi' && J.wBow > 0.5 && J.hasSword) part(ctx, P.TANTO, 0, sdBit(), 0, TF.hx, TF.hy, ta, 1, 0, bbTanto, drTanto);
    const ha = J.hang + Math.PI / 2;
    if (neckInHead) part(ctx, P.HEADN, lb(ha), sdBit(), headAnim(), J.head.x, J.head.y, ha, SD, 0, bbHeadN, drHeadN);
    else part(ctx, P.HEAD, lb(ha), sdBit(), headAnim(), J.head.x, J.head.y, ha, SD, 0, bbHead, drHead);
    restore(ctx);
  }

  const ROPE_HI = 'rgba(255,255,255,.07)';

  // ---------------------------------------------------------------- the fighter
  // Same order as ND.drawNinja. Returns false when it cannot draw (the caller then uses paths).
  ND.drawNinjaBaked = function (ctx, j, c, X, wpn, acc) {
    const Fc = X.bake;
    const M = ctx.getTransform();
    const s = Math.hypot(M.a, M.b);
    if (!(s > 0.01) || Math.abs(M.a * M.d - M.b * M.c - s * s) > s * s * 0.01) return false; // needs a plain scale + rotation
    // scale level: the smallest 2^(n/4) at or just under the current scale; kept while the scale stays within
    // about -30% / +3% of it (camera zoom changes do not rebake everything at once)
    let lv = Math.max(0, Math.min(31, Math.ceil((Math.log2(s) + 3) * 4 - 0.15)));
    if (Fc.lv >= 0 && s <= lvScale(Fc.lv) * 1.03 && s >= lvScale(Fc.lv) * 0.7) lv = Fc.lv;
    // Supersampled High pictures are never magnified, including during camera zooms.
    if (Fc.high) {
      lv = Math.max(0, Math.min(31, Math.ceil((Math.log2(s * 2) + 3) * 4)));
      if (Fc.lv >= 0 && s * 2 <= lvScale(Fc.lv) && s * 2 >= lvScale(Fc.lv) * 0.7) lv = Fc.lv;
      if (lvScale(lv) < s * 2) return false;
    }
    K.updLight();
    // another look, weapon or light side: start over
    if (Fc.col !== c || Fc.acc !== acc || !sameWeapon(Fc.wpn, wpn) || Fc.ltx !== (LT.x > 0)) {
      clear(Fc);
      Fc.col = c; Fc.acc = acc; Fc.wpn = wpn; Fc.ltx = LT.x > 0;
    }
    Fc.wpn = wpn;
    Fc.lv = lv; Fc.frame++; Fc.fb = 0;
    F = Fc; J = j; C = c; WPN = wpn; ACC = acc; SD = j.dir < 0 ? -1 : 1; LV = lv; S = lvScale(lv); BM = M;
    D = K.pal(c);
    glint = X.glint || 0;
    const t = ND.scene ? ND.scene.t : 0;
    if (j._t !== t) { const v = j._px === undefined ? 0 : j.hip.x - j._px; j._vs = (j._vs || 0) * 0.6 + Math.max(-12, Math.min(12, v)) * 0.4; j._px = j.hip.x; j._t = t; }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    try {
      K.torsoFrame(j);
      if (X.layer && !Fc.high) {
        // X.layer: ctx is an empty layer of its own (game.drawLit). The torso is drawn first and what lies behind
        // it (back arm, cloth ropes, back leg, scabbard) is then slid under it with 'destination-over', in reverse
        // order: the same picture as back-to-front, without a scratch canvas for the torso's shadows.
        torsoLayer(ctx);
        ctx.globalCompositeOperation = 'destination-over';
        arm(ctx, false, true);
        const R = X.ropes;
        if (R) for (let i = R.length - 1; i >= 0; i--) { R[i].rope.draw(ctx, R[i].col, R[i].w, ROPE_HI, 2); R[i].rope.draw(ctx, R[i].col, R[i].w, ROPE_HI, 1); }
        leg(ctx, false, true);
        sheath(ctx); restore(ctx);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        sheath(ctx); restore(ctx);
        leg(ctx, false);
        if (X.ropes) for (const r of X.ropes) r.rope.draw(ctx, r.col, r.w, ROPE_HI);
        arm(ctx, false);
        K.torsoFrame(j);
        torso(ctx);
      }
      neckAndHead(ctx);
      leg(ctx, true);
      if (acc === 'kabuto') { K.torsoFrame(j); part(ctx, P.KUSA, 0, sdBit(), 0, TF.hx, TF.hy, torsoAng(), 1, 0, bbKusa, drKusa); restore(ctx); }
      if (X.trail) X.trail(ctx);
      if (j.hasSword && j.tip) weapon(ctx, j.haF.x, j.haF.y, Math.atan2(j.tip.y - j.haF.y, j.tip.x - j.haF.x), 0);
      if (j.chain && j.hasSword) ND.Chain.prototype.draw.call(j.chain, ctx, c.accent);
      arm(ctx, true);
    } finally {
      restore(ctx); ctx.globalCompositeOperation = 'source-over';
      F = null; J = null; BM = null;
    }
    trim(Fc);
    return true;
  };
})(window.ND);
