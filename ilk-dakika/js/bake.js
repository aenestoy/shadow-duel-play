






















window.ND = window.ND || {};
(function (ND) {
  'use strict';
  const K = ND._draw;
  if (!K) return;
  const { LT, TF, FF, HD, AG, SW, TB } = K;
  const TAU = Math.PI * 2, NB = 16, CAP = 12 * 1024 * 1024;



  let frameId = 0;
  ND.beginBakeFrame = () => ++frameId;

  function Cache() { return { m: new Map(), g: new Map(), bytes: 0, gbytes: 0, frame: -1, fb: 0, lv: -1, glv: -1, bakes: 0, hits: 0, live: 0, evictions: 0, bornPixels: 0, readOnly: false, col: null, acc: null, wpn: null, ltx: null }; }
  ND.bakeCache = Cache;
  ND.bakeStats = (F) => ({ parts: F.m.size + F.g.size, sprites: F.g.size, kb: Math.round((F.bytes + F.gbytes) / 1024), bakes: F.bakes, hits: F.hits, live: F.live, evictions: F.evictions, bornPixels: F.bornPixels, level: F.glv >= 0 ? F.glv : F.lv });

  let preparing = false, pending = 0;
  ND.prepareBaked = function (draw) {
    ND.beginBakeFrame();
    preparing = true; pending = 0;
    try { draw(); return pending === 0; } finally { preparing = false; }
  };
  const release = (e) => { if (typeof e.cv.close === 'function') e.cv.close(); };

  function clear(Fc) { Fc.warmSigs = null; if (Fc.gRel && Fc.g.size) Fc.gRel(Fc); Fc.evictions += Fc.m.size + Fc.g.size; for (const e of Fc.m.values()) release(e); Fc.m.clear(); Fc.bytes = 0; Fc.g.clear(); Fc.gbytes = 0; }
  ND.clearBakeCache = clear;
  function sameWeapon(a, b) {
    return a === b || !!a && !!b && a.type === b.type && a.blade === b.blade && a.handle === b.handle &&
      a.twin === b.twin && a.dual === b.dual && a.iai === b.iai;
  }


  let F = null, J = null, C = null, D = null, WPN = null, ACC = '', SD = 1, LV = 0, S = 1, GLX = false, warming = false;
  let BM = null;
  const lvScale = (lv) => Math.pow(2, lv / 4 - 3);

  const levelOf = (s) => Math.max(0, Math.min(31, Math.ceil((Math.log2(s) + 3) * 4 - 0.15)));

  const ZMAX = 1.4;
  const lb = (a) => { let b = Math.floor((a / TAU) * NB) % NB; if (b < 0) b += NB; return b; };

  const sflip = (dx, dy) => (-dy * LT.x + dx * LT.y < 0 ? 1 : 0);



  let LTB = 0;
  const key = (pid, a, b, c) => pid + 64 * (LV + 32 * (LTB + 2 * (a + 64 * (b + 256 * c))));


  const BB = [0, 0, 0, 0];
  const bbSet = (x0, y0, x1, y1) => { BB[0] = x0; BB[1] = y0; BB[2] = x1; BB[3] = y1; };
  let FO = { x: 0, y: 0, a: 0, m: 1 };

  function bbW(x, y, r) {
    const ca = Math.cos(FO.a), sa = Math.sin(FO.a), dx = x - FO.x, dy = y - FO.y;
    const lx = (ca * dx + sa * dy) * FO.m, ly = -sa * dx + ca * dy;
    if (lx - r < BB[0]) BB[0] = lx - r; if (ly - r < BB[1]) BB[1] = ly - r;
    if (lx + r > BB[2]) BB[2] = lx + r; if (ly + r > BB[3]) BB[3] = ly + r;
  }
  const bbReset = () => { BB[0] = BB[1] = 1e9; BB[2] = BB[3] = -1e9; };

  function newCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }


  let OC = null, OX = null;
  try { if (typeof OffscreenCanvas === 'function') { OC = new OffscreenCanvas(1, 1); OX = OC.getContext('2d'); if (!OX || !OC.transferToImageBitmap) OC = OX = null; } } catch (e) { OC = OX = null; }
  const USE_BM = !!OX;
  function newSprite(w, h) {
    if (!USE_BM) return newCanvas(w, h);


    const resized = OC.width !== w || OC.height !== h;
    if (OC.width !== w) OC.width = w;
    if (OC.height !== h) OC.height = h;


    if (!resized) { if (typeof OX.reset === 'function') OX.reset(); else OC.width = w; }
    return OC;
  }





  function part(ctx, pid, a, b, c, ox, oy, ang, m, len, box, draw) {
    const k = key(pid, a, b, c), gl = GLX;
    const M = gl ? F.g : F.m;
    let e = M.get(k);

    if (e && gl && !ctx.spriteOk(e.sp)) { M.delete(k); F.gbytes -= e.bytes; F.evictions++; e = null; }
    if (e) F.hits++;
    if (!e && F.readOnly) throw Error('Prepared character cache missed a required part');
    if (!e && !warming && preparing && F.fb >= BUDGET) { pending++; return; }

    if (!e && !warming && !preparing && F.fb >= BUDGET) { F.live++; restore(ctx); draw(ctx); return; }
    if (!e) {
      F.fb++;
      FO.x = ox; FO.y = oy; FO.a = ang; FO.m = m;
      box();
      const x0 = BB[0], y0 = BB[1], pw = Math.max(1, Math.ceil((BB[2] - x0) * S) + 2), ph = Math.max(1, Math.ceil((BB[3] - y0) * S) + 2);


      const cv = gl ? null : newSprite(pw, ph), x = gl ? ctx.spriteBegin(pw, ph) : USE_BM ? OX : cv.getContext('2d'), o = gl ? 3 : 1;
      const ca = Math.cos(ang), sa = Math.sin(ang);

      x.setTransform(S * ca * m, -S * sa, S * sa * m, S * ca, S * (-(ca * ox + sa * oy) * m - x0) + o, S * (sa * ox - ca * oy - y0) + o);
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.lineJoin = 'round'; x.lineCap = 'round';
      draw(x);
      e = { cv: null, sp: null, x0: x0 - 1 / S, y0: y0 - 1 / S, w: pw / S, h: ph / S, len, last: 0, bytes: pw * ph * 4 };
      if (gl) {
        e.sp = ctx.spriteEnd();
        if (!e.sp) { F.live++; restore(ctx); draw(ctx); return; }
        F.g.set(k, e); F.gbytes += e.bytes;
      } else { e.cv = USE_BM ? cv.transferToImageBitmap() : cv; F.m.set(k, e); F.bytes += e.bytes; }
      F.bakes++; F.bornPixels += pw * ph;
    }
    e.last = F.frame;
    const kx = m * (len > 0 && e.len > 0 ? len / e.len : 1), ca = Math.cos(ang), sa = Math.sin(ang);

    ctx.setTransform((BM.a * ca + BM.c * sa) * kx, (BM.b * ca + BM.d * sa) * kx, -BM.a * sa + BM.c * ca, -BM.b * sa + BM.d * ca,
      BM.a * ox + BM.c * oy + BM.e, BM.b * ox + BM.d * oy + BM.f);
    if (gl) ctx.drawSprite(e.sp, e.x0, e.y0, e.w, e.h); else ctx.drawImage(e.cv, e.x0, e.y0, e.w, e.h);
  }
  const BUDGET = 3;
  const restore = (ctx) => ctx.setTransform(BM.a, BM.b, BM.c, BM.d, BM.e, BM.f);

  function trim(Fc) {
    if (Fc.bytes <= CAP) return;
    const all = [...Fc.m.entries()].sort((p, q) => p[1].last - q[1].last);
    for (const [k, e] of all) { if (Fc.bytes <= CAP * 0.75) break; Fc.m.delete(k); Fc.bytes -= e.bytes; Fc.evictions++; release(e); }
  }


  const P = { SAYA: 1, SAYAHIP: 2, QUIVER: 3, TANTO: 4, SHIN: 5, FOOT: 6, TOUT: 7, TFILL: 8, KTOP: 9, FOUT: 10, SLEEVE: 11,
    FORE: 12, MOUTH: 13, FIST: 14, OPEN: 15, BODY: 16, NECK: 18, SCARF: 19, JUZU: 20, HEAD: 21, KUSA: 22, WPN: 23, WPN2: 24, HEADN: 25 };
  const torsoAng = () => Math.atan2(TF.uy, TF.ux);
  const sdBit = () => (SD < 0 ? 1 : 0);


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


  let LEN = 0;
  const bbThigh = () => bbSet(-12.5, -12.5, LEN + 12.5, 12.5);
  const bbShin = () => bbSet(-12.5, -12.5, LEN + 8.5, 12.5);
  const bbKTop = () => bbSet(-12.5, -12.5, LEN * 0.36 + 11, 12.5);
  const bbFoot = () => bbSet(-8, -9, 16, 9);



  const drTOut = (x) => K.legUpper(x, D, true, false, true, false);
  const drShin = (x) => { K.legShin(x, D); K.legUpper(x, D, false, true, true, true); };
  const drFoot = (x) => K.legFoot(x, J, D);
  const drThigh = (x) => { K.legUpper(x, D, true, false, false, true); K.legShade(x, D, true, false); K.legLines(x, J, false, true, false); };
  const drKnee = (x) => { K.legShade(x, D, false, true); K.legLines(x, J, true, false, false); };



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


  let SAGQ = 0;
  const SAG_STEP = 1.5;
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


  const drFOut = (x) => K.armOutline(x, D, false, true);
  const drSleeve = (x) => { K.armOutline(x, D, true, false); K.armSleeve(x, C, D, ACC); };
  const drFore = (x) => K.armFore(x, D);
  const drMouth = (x) => K.armMouth(x, D);
  const drHand = (x) => K.armHand(x, J, D);
  function arm(ctx, front, rev) {
    const G = K.armGeom(J, front, C), sh = G.sh, el = G.el, ha = G.ha, fb = front ? 1 : 0;
    const ua = Math.atan2(el.y - sh.y, el.x - sh.x), ul = Math.hypot(el.x - sh.x, el.y - sh.y);
    const fa = Math.atan2(ha.y - el.y, ha.x - el.x), fl = Math.hypot(ha.x - el.x, ha.y - el.y);

    const nf = (G.nx * -Math.sin(ua) + G.ny * Math.cos(ua)) < 0 ? 1 : 0;
    SAGQ = Math.max(0, Math.min(40, Math.round(G.sag / SAG_STEP) + 8));
    K.handInfo(J, WPN);
    for (const i of rev ? REV6 : FWD6) {
      if (i === 0) { restore(ctx); drFOut(ctx); }
      else if (i === 1) { LEN = ul; part(ctx, P.SLEEVE, lb(ua), fb + 2 * nf + 4 * sflip(el.x - sh.x, el.y - sh.y), SAGQ, sh.x, sh.y, ua, 1, ul, bbSleeve, drSleeve); }
      else if (i === 2) { LEN = fl; part(ctx, P.FORE, lb(fa), fb + 2 * sflip(ha.x - el.x, ha.y - el.y), 0, el.x, el.y, fa, 1, fl, bbFore, drFore); }
      else if (i === 3) part(ctx, P.MOUTH, 0, fb + 2 * nf, SAGQ, el.x, el.y, ua, 1, 0, bbMouth, drMouth);
      else if (i === 4) { if (HD.w) { restore(ctx); weapon(ctx, ha.x, ha.y, HD.a2, HD.w === 'tessen' ? 2 : 1, rev); } }
      else if (HD.k === 'fist') {
        const a = Math.atan2(HD.hy, HD.hx), fa2 = Math.atan2(G.fy, G.fx);
        let rel = Math.round(((fa2 - a) / TAU) * 8) % 8; if (rel < 0) rel += 8;
        part(ctx, P.FIST, lb(a) >> 1, fb, rel, ha.x, ha.y, a, 1, 0, bbFist, drHand);
      } else {
        const tf = -G.fy * SD - G.fx < 0 ? 1 : 0;
        part(ctx, P.OPEN, 0, fb + 2 * tf + 4 * sdBit(), 0, ha.x, ha.y, Math.atan2(G.fy, G.fx), 1, 0, bbOpen, drHand);
      }
    }
    restore(ctx);
  }


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

  const fanQ = (o) => Math.max(0, Math.min(16, Math.round(o * 16)));

  function weapon(ctx, hx, hy, ang, which, rev) {
    const t = WPN.type;
    WA = ang; WHX = hx; WHY = hy; WHICH = which;
    if (which === 0 && t === 'yumi' && J.wBow > 0.5 && J.haB) {
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


  const bbRim = () => { const bk = ACC === 'mai' ? 33 : 24; bbSet(-TF.ln * 0.24 - 3.5, SD > 0 ? -bk : -21, TF.ln * 1.1 + 3.5, SD > 0 ? 21 : bk); };
  const drBody = (x) => K.drawTorso(x, J, C, D, ACC, TB.BODY | TB.RIM | TB.KNOT);
  let scr = null, scx = null;
  function torso(ctx) {
    const ta = torsoAng(), a = lb(ta), b = sdBit(), ln = TF.ln;

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



    if (ctx.isGL) {
      part(ctx, P.BODY, a, b, 0, TF.hx, TF.hy, ta, 1, ln, bbRim, drBody);
      restore(ctx);
      ctx.save();
      ctx.beginPath(); K.torsoPath(ctx); ctx.clip();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      K.torsoAO(ctx, J);
      ctx.restore();
      restore(ctx);
      return;
    }

    if (!scr) { scr = newCanvas(w, h); scx = scr.getContext('2d', ND.glHooked ? { willReadFrequently: true } : undefined); }
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

  const drHeadN = (x) => { K.neckPart(x, J, C, D, ACC); K.drawHead(x, J, C, D, ACC); };
  const bbHeadN = () => { bbHead(); BB[3] = Math.max(BB[3], 27); BB[0] = Math.min(BB[0], -9); BB[2] = Math.max(BB[2], 9); };

  const HEADBB = { kasa: [-31, -22, 31, 18], oni: [-27, -27, 22, 18], kabuto: [-22, -32, 25, 20], aoi: [-24, -32, 21, 18], tsubame: [-32, -27, 21, 18],
    mai: [-23, -25, 21, 18], hood: [-24, -24, 21, 18], tora: [-24, -25, 21, 18], scarf: [-26, -21, 21, 18], def: [-21, -21, 21, 18] };
  const bbHead = () => { const h = HEADBB[ACC] || HEADBB.def; bbSet(h[0], h[1], h[2], h[3]); };

  function headAnim() {
    const t = ND.scene ? ND.scene.t : 0;
    const sw = ACC === 'mai' ? Math.sin(t * 3.1) * 1.2 : ACC === 'aoi' ? Math.sin(t * 2.4) * 0.8 : ACC === 'scarf' ? Math.sin(t * 2.6) * 0.9 : 0;
    return Math.round(sw / 0.5) + 8;
  }
  function neckAndHead(ctx) {
    const ta = torsoAng();
    const neckInHead = ACC !== 'scarf' && ACC !== 'monk';
    if (ACC === 'scarf') part(ctx, P.SCARF, lb(ta), sdBit(), 0, TF.hx, TF.hy, ta, 1, TF.ln, bbScarf, drNeck);
    else if (!neckInHead) {
      const ax = J.neck.x - TF.ux * 2, ay = J.neck.y - TF.uy * 2, bx = J.neck.x + (J.head.x - J.neck.x) * 0.55, by = J.neck.y + (J.head.y - J.neck.y) * 0.55;
      LEN = Math.hypot(bx - ax, by - ay); NA = Math.atan2(by - ay, bx - ax);
      part(ctx, P.NECK, 0, 0, 0, ax, ay, NA, 1, LEN, bbNeck, drNeck);
    }
    if (ACC === 'monk') part(ctx, P.JUZU, lb(ta), sdBit(), 0, TF.hx, TF.hy, ta, 1, TF.ln, bbJuzu, drJuzu);
    if (WPN.type === 'yumi' && J.wBow > 0.5 && J.hasSword) part(ctx, P.TANTO, 0, sdBit(), 0, TF.hx, TF.hy, ta, 1, 0, bbTanto, drTanto);
    const ha = J.hang + Math.PI / 2;
    if (neckInHead) part(ctx, P.HEADN, lb(ha), sdBit(), headAnim(), J.head.x, J.head.y, ha, SD, 0, bbHeadN, drHeadN);
    else part(ctx, P.HEAD, lb(ha), sdBit(), headAnim(), J.head.x, J.head.y, ha, SD, 0, bbHead, drHead);
    restore(ctx);
  }

  const ROPE_HI = 'rgba(255,255,255,.07)';



  ND.drawNinjaBaked = function (ctx, j, c, X, wpn, acc) {
    const Fc = X.bake;
    const M = ctx.getTransform();
    const s = Math.hypot(M.a, M.b);
    if (!(s > 0.01) || Math.abs(M.a * M.d - M.b * M.c - s * s) > s * s * 0.01) return false;


    const gl = ctx.isGL === true && typeof ctx.spriteEnd === 'function';
    let lv;
    if (gl) {


      lv = levelOf((ND.cam && ND.cam.s > 0 ? ND.cam.s : s) * ZMAX);
      Fc.glv = lv;
    } else {
      lv = levelOf(s);
      if (Fc.lv >= 0 && s <= lvScale(Fc.lv) * 1.03 && s >= lvScale(Fc.lv) * 0.7) lv = Fc.lv;
      Fc.lv = lv;
    }
    K.updLight();
    if (FORCE_LX) LT.x = FORCE_LX;

    LTB = LT.x > 0 ? 1 : 0;
    if (Fc.col !== c || Fc.acc !== acc || !sameWeapon(Fc.wpn, wpn)) {
      if (Fc.readOnly) throw Error('Prepared character cache invalidated');
      clear(Fc);
      Fc.col = c; Fc.acc = acc; Fc.wpn = wpn; Fc.ltx = LT.x > 0;
    }
    Fc.wpn = wpn;
    if (Fc.frame !== frameId) { Fc.frame = frameId; Fc.fb = 0; }
    if (gl && typeof ctx.spriteOwner === 'function') { ctx.spriteOwner(Fc); Fc.gRel = (o) => ctx.spriteRelease(o); }
    F = Fc; J = j; C = c; WPN = wpn; ACC = acc; SD = j.dir < 0 ? -1 : 1; LV = lv; S = lvScale(lv); BM = M; GLX = gl;
    D = K.pal(c);
    glint = X.glint || 0;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    try {
      K.torsoFrame(j);

      sheath(ctx); restore(ctx);
      leg(ctx, false);
      if (X.ropes) for (const r of X.ropes) r.rope.draw(ctx, r.col, r.w, ROPE_HI);
      arm(ctx, false);
      K.torsoFrame(j);
      torso(ctx);

      const swBack = !!(K.bladeBehindHead && K.bladeBehindHead(j, wpn, acc));
      if (swBack) weapon(ctx, j.haF.x, j.haF.y, Math.atan2(j.tip.y - j.haF.y, j.tip.x - j.haF.x), 0);
      neckAndHead(ctx);
      leg(ctx, true);
      if (acc === 'kabuto') { K.torsoFrame(j); part(ctx, P.KUSA, 0, sdBit(), 0, TF.hx, TF.hy, torsoAng(), 1, 0, bbKusa, drKusa); restore(ctx); }
      if (X.trail) X.trail(ctx);
      if (j.hasSword && j.tip && !swBack) weapon(ctx, j.haF.x, j.haF.y, Math.atan2(j.tip.y - j.haF.y, j.tip.x - j.haF.x), 0);
      if (j.chain && j.hasSword) ND.Chain.prototype.draw.call(j.chain, ctx, c.accent);
      arm(ctx, true);
    } finally {
      restore(ctx); ctx.globalCompositeOperation = 'source-over';
      F = null; J = null; BM = null;
    }
    trim(Fc);
    return true;
  };










  const JOINTS = ['hip', 'neck', 'sh', 'head', 'elF', 'haF', 'tip', 'pom', 'elB', 'haB', 'knF', 'ftF', 'knB', 'ftB'];
  const PKEYS = (ND.pose && ND.pose.KEYS) || [];
  const isPose = (o) => { for (const k of PKEYS) if (!Number.isFinite(o[k])) return false; return PKEYS.length > 0; };


  const POSE_MAX = 28;
  function posesOf(id) {
    const out = [], seen = new Set(), shapes = new Set();
    const scan = (o, d) => {
      if (!o || typeof o !== 'object' || seen.has(o) || d > 7 || out.length >= POSE_MAX) return;
      seen.add(o);
      if (isPose(o)) {
        const sh = PKEYS.map((k) => Math.round(o[k] / (k === 'lean' || k === 'hd' || k === 'sw' || k === 'grip' ? 0.15 : 8))).join(',');
        if (!shapes.has(sh)) { shapes.add(sh); out.push(o); }
        return;
      }
      for (const k in o) { const v = o[k]; if (v && typeof v === 'object') scan(v, d + 1); }
    };
    const P0 = ND.POSES || {};
    if (P0.stance) scan(P0.stance, 0);
    if (P0.guard) scan(P0.guard, 0);
    for (const t of [ND.MOVES, ND.SPECIALS, ND.KITS]) if (t && id != null && t[id]) scan(t[id], 0);
    scan(P0, 0);
    for (const t of [ND.ATK, ND.KAESHI, ND.DEFL, ND.RALLY]) scan(t, 0);
    return out;
  }
  const GRAD = { addColorStop() {} };
  function nullCtx(R, s) {
    const M = { a: s, b: 0, c: 0, d: s, e: 0, f: 0 };
    const base = {
      isGL: true, canvas: { width: 1, height: 1 },
      getTransform: () => M, createLinearGradient: () => GRAD, createRadialGradient: () => GRAD, createPattern: () => null,
      measureText: () => ({ width: 0 }), getLineDash: () => [],
      spriteBegin: (w, h) => R.spriteBegin(w, h), spriteEnd: () => R.spriteEnd(), spriteOk: (sp) => R.spriteOk(sp),
      spriteOwner: (o) => R.spriteOwner && R.spriteOwner(o), spriteRelease: (o) => R.spriteRelease && R.spriteRelease(o),
    };
    const noop = () => {};
    return new Proxy(base, { get: (o, k) => (k in o ? o[k] : noop), set: () => true });
  }
  let FORCE_LX = 0;


  ND.warmBaked = function (R, f, side) {
    const X = { bake: f.bakeCache(), ropes: null, trail: null, glint: 0 }, wpn = f.wpn, acc = f.ch && f.ch.acc, col = f.col;
    const stance = ND.POSES && ND.POSES.stance, poses = posesOf(f.ch && f.ch.id), jj = {}, half = {};
    const ctx = nullCtx(R, (ND.cam && ND.cam.k) || 1);
    const n = poses.length * 2 * 2 * 16;
    let i = 0;

    const sig = () => { K.updLight(); const lx = side ? side * Math.abs(LT.x) : LT.x; return levelOf(((ND.cam && ND.cam.s > 0 ? ND.cam.s : 1)) * ZMAX) + '|' + (lx > 0 ? 1 : 0); };
    if (X.bake.warmSigs && X.bake.warmSigs.has(sig()) && X.bake.col === col && X.bake.acc === acc && sameWeapon(X.bake.wpn, wpn) && X.bake.g.size) i = n;
    return {
      total: n,
      get done() { return i >= n; },
      step(ms) {
        if (!R || !R.spriteEnd || !stance) return true;
        if (i >= n) return true;
        const t0 = performance.now(), sc = ND.scene, st = sc ? sc.t : 0;
        warming = true;
        if (side) { K.updLight(); FORCE_LX = side * Math.abs(LT.x); }
        try {
          while (i < n && performance.now() - t0 < ms) {

            const r = i & 15, dir = (i >> 4) & 1 ? -1 : 1, mid = (i >> 5) & 1, p = poses[i >> 6];
            const pose = mid ? ND.pose.lerp(stance, p, 0.5, half) : p;
            ND.solve(pose, 0, 0, dir, jj, wpn);
            const th = (r / 16) * Math.PI * 2 + (i % 7) * 0.05, cx = 0, cy = -72, c = Math.cos(th), sn = Math.sin(th);
            if (r) for (const k of JOINTS) { const q = jj[k]; if (!q) continue; const dx = q.x - cx, dy = q.y - cy; q.x = cx + dx * c - dy * sn; q.y = cy + dx * sn + dy * c; }
            jj.hang += r ? th : 0;
            jj.hasSword = true; jj.chain = null;
            jj._vs = i & 2 ? 12 : 0;
            jj.wSheath = wpn && wpn.iai ? (i >> 1) & 1 : 0;
            jj.wFan = (i % 17) / 16; jj.wFanB = ((i * 5) % 17) / 16;
            jj.wBow = wpn && wpn.type === 'yumi' ? (i >> 2) & 1 : 0; jj.wAmmo = i % 6;
            if (sc) sc.t = i * 0.0617;
            ND.beginBakeFrame();
            ND.drawNinjaBaked(ctx, jj, col, X, wpn, acc);
            i++;
          }
        } finally { warming = false; if (FORCE_LX) { FORCE_LX = 0; K.updLight(); } if (sc) sc.t = st; }
        if (i >= n) (X.bake.warmSigs || (X.bake.warmSigs = new Set())).add(sig());
        return i >= n;
      },
    };
  };
})(window.ND);
