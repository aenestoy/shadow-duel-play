














window.ND = window.ND || {};
(function (ND) {
  'use strict';


  const mq = typeof location !== 'undefined' && /[?&]cizim=(kesit|elde)(?:&|$)/.exec(location.search || '');
  const on = !!mq, BASE = mq && mq[1] === 'elde' ? 'kesit/akane-elde' : 'kesit/akane';
  const KS = (ND.kesit = { on, ok: false, err: null, stats: { parts: 0 }, base: BASE });
  if (!on) return;
  const LV = [];
  let META = null, PARTS = null;
  KS.ready = (async () => {
    const meta = await (await fetch(BASE + '.json')).json();
    for (const [f, k] of [[BASE + '.webp', 1], [BASE + '-2.webp', 0.5]]) {
      const im = new Image(); im.src = f; await im.decode();
      const img = typeof createImageBitmap === 'function' ? await createImageBitmap(im) : im;
      LV.push({ img, px: meta.px * k, k });
    }
    META = meta; PARTS = meta.parts; KS.meta = meta; KS.ok = true;
  })().catch((e) => { KS.err = String((e && e.message) || e); });


  let lv = null;
  function pickLevel(ctx) {
    const T = ctx.getTransform ? ctx.getTransform() : null, sc = T ? Math.hypot(T.a, T.b) : 1;
    lv = LV[0];
    for (const L of LV) if (L.px >= sc * 0.95) lv = L;
  }


  const XF = [0, 0, 0, 0, 0, 0];
  function xform(p, A, B, m, stretch) {
    let ex = p.b[0] - p.a[0], ey = p.b[1] - p.a[1]; const pl = Math.hypot(ex, ey) || 1; ex /= pl; ey /= pl;
    let fx = B.x - A.x, fy = B.y - A.y; const wl = Math.hypot(fx, fy); if (!(wl > 1e-6)) return null; fx /= wl; fy /= wl;
    const s = 1 / META.px, st = stretch ? wl / (pl * s) : 1;

    const a11 = s * (st * fx * ex + m * fy * ey), a12 = s * (st * fx * ey - m * fy * ex);
    const a21 = s * (st * fy * ex - m * fx * ey), a22 = s * (st * fy * ey + m * fx * ex);
    XF[0] = a11; XF[1] = a21; XF[2] = a12; XF[3] = a22; XF[4] = A.x - (a11 * p.a[0] + a12 * p.a[1]); XF[5] = A.y - (a21 * p.a[0] + a22 * p.a[1]);
    return XF;
  }
  const apply = (X, q, out) => { out.x = X[0] * q[0] + X[2] * q[1] + X[4]; out.y = X[1] * q[0] + X[3] * q[1] + X[5]; return out; };
  function drawWith(ctx, p, X) {
    const k = lv.k;
    ctx.save();
    ctx.transform(X[0] / k, X[1] / k, X[2] / k, X[3] / k, X[4], X[5]);
    ctx.drawImage(lv.img, p.x * k, p.y * k, p.w * k, p.h * k, 0, 0, p.w * k, p.h * k);
    ctx.restore();
    KS.stats.parts++;
  }
  function place(ctx, id, A, B, m, stretch) {
    const p = PARTS[id];
    if (!p || !A || !B) return;
    const X = xform(p, A, B, m, stretch);
    if (X) drawWith(ctx, p, X);
  }
  const mOf = (j) => (j.dir < 0 ? -1 : 1);


  const TP = { neck: { x: 0, y: 0 }, shR: { x: 0, y: 0 }, shL: { x: 0, y: 0 } };
  function torsoPoints(j) {
    const p = PARTS.torso, X = xform(p, j.hip, j.neck, mOf(j), false);
    if (!X) return null;
    apply(X, p.neck || p.b, TP.neck); apply(X, p.shR || p.b, TP.shR); apply(X, p.shL || p.shR || p.b, TP.shL);
    return X;
  }


  const F0 = { x: 1, y: 0 }, U0 = { x: 0, y: -1 };
  KS.leg = function (ctx, j, front, K) {
    pickLevel(ctx);
    const s = front ? 'R' : 'L', m = mOf(j);
    const hip = (front ? j.hipF : j.hipB) || j.hip, kn = front ? j.knF : j.knB, ft = front ? j.ftF : j.ftB;
    place(ctx, 'thigh' + s, hip, kn, m, true);
    K.footFrame(ft, kn, j.dir, 1);
    const FF = K.FF, fl = Math.hypot(FF.fx, FF.fy) || 1, ul = Math.hypot(FF.ux, FF.uy) || 1;
    F0.x = FF.fx / fl; F0.y = FF.fy / fl; U0.x = FF.ux / ul; U0.y = FF.uy / ul;

    const p = PARTS['foot' + s];
    if (p) {
      const s1 = 1 / META.px, a11 = s1 * F0.x, a21 = s1 * F0.y, a12 = -s1 * U0.x, a22 = -s1 * U0.y;
      XF[0] = a11; XF[1] = a21; XF[2] = a12; XF[3] = a22; XF[4] = ft.x - (a11 * p.a[0] + a12 * p.a[1]); XF[5] = ft.y - (a21 * p.a[0] + a22 * p.a[1]);
      drawWith(ctx, p, XF);
    }
    place(ctx, 'shin' + s, kn, ft, m, true);
  };


  const SH = { x: 0, y: 0 }, WR = { x: 0, y: 0 };
  function shoulderOf(j, front) {
    if (!torsoPoints(j)) return front ? j.sh : j.shB || j.sh;
    if (front) return TP.shR;

    const b = j.shB || j.sh; SH.x = TP.shL.x + (b.x - j.sh.x); SH.y = TP.shL.y + (b.y - j.sh.y); return SH;
  }
  function wristOf(j, front, el, ha) {
    const wr = front ? j.wrF : j.wrB;
    if (wr) return wr;
    const dx = ha.x - el.x, dy = ha.y - el.y, d = Math.hypot(dx, dy) || 1, f = Math.max(0.5, 1 - 4.5 / d);
    WR.x = el.x + dx * f; WR.y = el.y + dy * f; return WR;
  }
  function sleeveOf(s, sh, el, m) {
    const angs = META.variants && META.variants['uarm' + s];
    if (!angs || !angs.length) return 'uarm' + s;

    const a = (Math.atan2((el.x - sh.x) * m, el.y - sh.y) * 180) / Math.PI;
    let best = angs[0], bd = 1e9;
    for (const v of angs) { const d = Math.abs(((a - v + 540) % 360) - 180); if (d < bd) { bd = d; best = v; } }
    return 'uarm' + s + '@' + best;
  }
  KS.arm = function (ctx, j, front) {
    pickLevel(ctx);
    const s = front ? 'R' : 'L', m = mOf(j);
    const el = front ? j.elF : j.elB, ha = front ? j.haF : j.haB, sh = shoulderOf(j, front);
    place(ctx, sleeveOf(s, sh, el, m), sh, el, m, true);
    place(ctx, 'farm' + s, el, wristOf(j, front, el, ha), m, true);
  };

  KS.hand = function (ctx, j, front, k) {
    pickLevel(ctx);
    const s = front ? 'R' : 'L', m = mOf(j);
    const el = front ? j.elF : j.elB, ha = front ? j.haF : j.haB, wr = wristOf(j, front, el, ha);
    const kind = k === 'open' ? 'open' : j.hasSword ? 'grip' : 'fist';

    const B = Math.hypot(ha.x - wr.x, ha.y - wr.y) > 0.5 ? ha : { x: wr.x + (wr.x - el.x), y: wr.y + (wr.y - el.y) };
    place(ctx, 'hand' + s + '-' + kind, wr, B, m, false);
  };
  KS.torso = function (ctx, j) {
    pickLevel(ctx);
    const X = torsoPoints(j);
    if (X) drawWith(ctx, PARTS.torso, X);
  };
  KS.head = function (ctx, j) {
    pickLevel(ctx);
    const nk = torsoPoints(j) ? TP.neck : j.neck;

    const B = { x: nk.x + (j.head.x - j.neck.x), y: nk.y + (j.head.y - j.neck.y) };
    place(ctx, 'head', nk, B, mOf(j), false);
  };
})(window.ND);
