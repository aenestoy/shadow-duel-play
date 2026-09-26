// Gölge Düellosu — çekirdek: matematik yardımcıları + sentez ses motoru
window.ND = window.ND || {};

// ---------------------------------------------------------------- DETERMINISTIC MATH (ND.DM)
// Online play (rollback netcode) needs every device to compute the fight bit for bit the same. + - * / and sqrt are
// exact IEEE-754 operations in every JavaScript engine, but Math.sin, cos, atan2, exp, pow... are not specified to the
// last bit: V8 (Chrome, Android), SpiderMonkey (Firefox) and JavaScriptCore (Safari, iPhone: the system libm) may round
// differently, and one different bit grows into a different fight within seconds. ND.DM is a copy of Math whose
// transcendental functions are computed here with plain arithmetic (the fdlibm algorithms, error < 1 ulp), so they give
// the same bits everywhere. The simulation files shadow Math with it (`const Math = ND.DM || globalThis.Math;` at the
// top of their scope); Math.random and every exact function (floor, abs, min, sqrt...) stay the engine's own.
// window.ND = { DM_NATIVE: true } before this file (tests only) keeps the engine's functions, to measure the difference.
(function (ND) {
  'use strict';
  const N = Math, DM = {};
  for (const k of Object.getOwnPropertyNames(N)) DM[k] = N[k];
  DM.random = function random() { return N.random(); }; // stays live: tools may swap Math.random after load
  if (ND.DM_NATIVE) { ND.DM = DM; return; }
  const F = new Float64Array(1), U = new Uint32Array(F.buffer);
  const LE = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1, IH = LE ? 1 : 0, IL = LE ? 0 : 1;
  const hi = (x) => { F[0] = x; return U[IH] | 0; };
  const lo = (x) => { F[0] = x; return U[IL]; };
  const mk = (h, l) => { U[IH] = h; U[IL] = l; return F[0]; };
  const withHi = (x, h) => { F[0] = x; U[IH] = h; return F[0]; };
  const zeroLo = (x) => { F[0] = x; U[IL] = 0; return F[0]; };

  // --- sin / cos (k_sin.c, k_cos.c, e_rem_pio2.c; huge arguments use the medium reduction too: less accurate there,
  // still plain arithmetic, so still the same everywhere)
  const S1 = -1.66666666666666324348e-01, S2 = 8.33333333332248946124e-03, S3 = -1.98412698298579493134e-04,
    S4 = 2.75573137070700676789e-06, S5 = -2.50507602534068634195e-08, S6 = 1.58969099521155010221e-10;
  function kSin(x, y, iy) {
    const ix = hi(x) & 0x7fffffff;
    if (ix < 0x3e400000 && (x | 0) === 0) return x;
    const z = x * x, v = z * x, r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)));
    if (iy === 0) return x + v * (S1 + z * r);
    return x - ((z * (0.5 * y - v * r) - y) - v * S1);
  }
  const C1 = 4.16666666666666019037e-02, C2 = -1.38888888888741095749e-03, C3 = 2.48015872894767294178e-05,
    C4 = -2.75573143513906633035e-07, C5 = 2.08757232129817482790e-09, C6 = -1.13596475577881948265e-11;
  function kCos(x, y) {
    const ix = hi(x) & 0x7fffffff;
    if (ix < 0x3e400000 && (x | 0) === 0) return 1;
    const z = x * x, r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
    if (ix < 0x3fd33333) return 1 - (0.5 * z - (z * r - x * y));
    const qx = ix > 0x3fe90000 ? 0.28125 : mk(ix - 0x00200000, 0);
    const hz = 0.5 * z - qx, a = 1 - qx;
    return a - (hz - (z * r - x * y));
  }
  const NPIO2 = [0x3FF921FB, 0x400921FB, 0x4012D97C, 0x401921FB, 0x401F6A7A, 0x4022D97C, 0x4025FDBB, 0x402921FB,
    0x402C463A, 0x402F6A7A, 0x4031475C, 0x4032D97C, 0x40346B9C, 0x4035FDBB, 0x40378FDB, 0x403921FB, 0x403AB41B,
    0x403C463A, 0x403DD85A, 0x403F6A7A, 0x40407E4C, 0x4041475C, 0x4042106C, 0x4042D97C, 0x4043A28C, 0x40446B9C,
    0x404534AC, 0x4045FDBB, 0x4046C6CB, 0x40478FDB, 0x404858EB, 0x404921FB];
  const INVPIO2 = 6.36619772367581382433e-01, PIO2_1 = 1.57079632673412561417e+00, PIO2_1T = 6.07710050650619224932e-11,
    PIO2_2 = 6.07710050630396597660e-11, PIO2_2T = 2.02226624879595063154e-21, PIO2_3 = 2.02226624871116645580e-21,
    PIO2_3T = 8.47842766036889956997e-32;
  const Y = [0, 0];
  // x = n·π/2 + (Y[0] + Y[1]); returns n (only n mod 4 is used)
  function remPio2(x) {
    const hx = hi(x), ix = hx & 0x7fffffff;
    if (ix < 0x4002d97c) { // |x| < 3π/4
      let z;
      if (hx > 0) {
        z = x - PIO2_1;
        if (ix !== 0x3ff921fb) { Y[0] = z - PIO2_1T; Y[1] = (z - Y[0]) - PIO2_1T; } else { z -= PIO2_2; Y[0] = z - PIO2_2T; Y[1] = (z - Y[0]) - PIO2_2T; }
        return 1;
      }
      z = x + PIO2_1;
      if (ix !== 0x3ff921fb) { Y[0] = z + PIO2_1T; Y[1] = (z - Y[0]) + PIO2_1T; } else { z += PIO2_2; Y[0] = z + PIO2_2T; Y[1] = (z - Y[0]) + PIO2_2T; }
      return -1;
    }
    let t = N.abs(x);
    const q = t * INVPIO2 + 0.5, big = q >= 2147483648, n = big ? N.trunc(q) : q | 0, fn = n;
    let r = t - fn * PIO2_1, w = fn * PIO2_1T;
    if (n < 32 && ix !== NPIO2[n - 1]) Y[0] = r - w;
    else {
      const j = ix >> 20;
      Y[0] = r - w;
      let i = j - ((hi(Y[0]) >> 20) & 0x7ff);
      if (i > 16) {
        t = r; w = fn * PIO2_2; r = t - w; w = fn * PIO2_2T - ((t - r) - w); Y[0] = r - w;
        i = j - ((hi(Y[0]) >> 20) & 0x7ff);
        if (i > 49) { t = r; w = fn * PIO2_3; r = t - w; w = fn * PIO2_3T - ((t - r) - w); Y[0] = r - w; }
      }
    }
    Y[1] = (r - Y[0]) - w;
    const m = big ? n % 4 : n;
    if (hx < 0) { Y[0] = -Y[0]; Y[1] = -Y[1]; return -m; }
    return m;
  }
  DM.sin = function sin(x) {
    x = +x;
    const ix = hi(x) & 0x7fffffff;
    if (ix <= 0x3fe921fb) return kSin(x, 0, 0);
    if (ix >= 0x7ff00000) return x - x;
    switch (remPio2(x) & 3) {
      case 0: return kSin(Y[0], Y[1], 1);
      case 1: return kCos(Y[0], Y[1]);
      case 2: return -kSin(Y[0], Y[1], 1);
      default: return -kCos(Y[0], Y[1]);
    }
  };
  DM.cos = function cos(x) {
    x = +x;
    const ix = hi(x) & 0x7fffffff;
    if (ix <= 0x3fe921fb) return kCos(x, 0);
    if (ix >= 0x7ff00000) return x - x;
    switch (remPio2(x) & 3) {
      case 0: return kCos(Y[0], Y[1]);
      case 1: return -kSin(Y[0], Y[1], 1);
      case 2: return -kCos(Y[0], Y[1]);
      default: return kSin(Y[0], Y[1], 1);
    }
  };
  DM.tan = function tan(x) { x = +x; return DM.sin(x) / DM.cos(x); };

  // --- atan / atan2 (s_atan.c, e_atan2.c)
  const ATHI = [4.63647609000806093515e-01, 7.85398163397448278999e-01, 9.82793723247329054082e-01, 1.57079632679489655800e+00];
  const ATLO = [2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17];
  const AT = [3.33333333333329318027e-01, -1.99999999998764832476e-01, 1.42857142725034663711e-01, -1.11111104054623557880e-01,
    9.09088713343650656196e-02, -7.69187620504482999495e-02, 6.66107313738753120669e-02, -5.83357013379057348645e-02,
    4.97687799461593236017e-02, -3.65315727442169155270e-02, 1.62858201153657823623e-02];
  DM.atan = function atan(x) {
    x = +x;
    const hx = hi(x), ix = hx & 0x7fffffff;
    let id;
    if (ix >= 0x44100000) { // |x| >= 2^66
      if (x !== x) return x + x;
      return hx > 0 ? ATHI[3] + ATLO[3] : -ATHI[3] - ATLO[3];
    }
    if (ix < 0x3fdc0000) { // |x| < 0.4375
      if (ix < 0x3e200000) return x;
      id = -1;
    } else {
      x = N.abs(x);
      if (ix < 0x3ff30000) {
        if (ix < 0x3fe60000) { id = 0; x = (2 * x - 1) / (2 + x); } else { id = 1; x = (x - 1) / (x + 1); }
      } else if (ix < 0x40038000) { id = 2; x = (x - 1.5) / (1 + 1.5 * x); } else { id = 3; x = -1 / x; }
    }
    const z = x * x, w = z * z;
    const s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))));
    const s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))));
    if (id < 0) return x - x * (s1 + s2);
    const r = ATHI[id] - ((x * (s1 + s2) - ATLO[id]) - x);
    return hx < 0 ? -r : r;
  };
  const PI = 3.1415926535897931160e+00, PI_LO = 1.2246467991473531772e-16, PI_2 = 1.5707963267948965580e+00, PI_4 = 7.8539816339744827900e-01;
  DM.atan2 = function atan2(y, x) {
    y = +y; x = +x;
    if (x !== x || y !== y) return x + y;
    const hx = hi(x), ix = hx & 0x7fffffff, lx = lo(x), hy = hi(y), iy = hy & 0x7fffffff, ly = lo(y);
    if (hx === 0x3ff00000 && lx === 0) return DM.atan(y); // x = 1
    const m = ((hy >> 31) & 1) | ((hx >> 30) & 2);
    if ((iy | ly) === 0) { // y = ±0
      if (m < 2) return y;
      return m === 2 ? PI : -PI;
    }
    if ((ix | lx) === 0) return hy < 0 ? -PI_2 : PI_2; // x = ±0
    if (ix === 0x7ff00000) { // x = ±∞
      if (iy === 0x7ff00000) return m === 0 ? PI_4 : m === 1 ? -PI_4 : m === 2 ? 3 * PI_4 : -3 * PI_4;
      return m === 0 ? 0 : m === 1 ? -0 : m === 2 ? PI : -PI;
    }
    if (iy === 0x7ff00000) return hy < 0 ? -PI_2 : PI_2;
    const k = (iy - ix) >> 20;
    let z;
    if (k > 60) z = PI_2 + 0.5 * PI_LO;
    else if (hx < 0 && k < -60) z = 0;
    else z = DM.atan(N.abs(y / x));
    switch (m) {
      case 0: return z;
      case 1: return -z;
      case 2: return PI - (z - PI_LO);
      default: return (z - PI_LO) - PI;
    }
  };

  // --- asin / acos (e_asin.c, e_acos.c)
  const pS0 = 1.66666666666666657415e-01, pS1 = -3.25565818622400915405e-01, pS2 = 2.01212532134862925881e-01,
    pS3 = -4.00555345006794114027e-02, pS4 = 7.91534994289814532176e-04, pS5 = 3.47933107596021167570e-05,
    qS1 = -2.40339491173441421878e+00, qS2 = 2.02094576023350569471e+00, qS3 = -6.88283971605453293030e-01, qS4 = 7.70381505559019352791e-02;
  const PIO2_HI = 1.57079632679489655800e+00, PIO2_LO = 6.12323399573676603587e-17, PIO4_HI = 7.85398163397448278999e-01;
  const aP = (z) => z * (pS0 + z * (pS1 + z * (pS2 + z * (pS3 + z * (pS4 + z * pS5)))));
  const aQ = (z) => 1 + z * (qS1 + z * (qS2 + z * (qS3 + z * qS4)));
  DM.asin = function asin(x) {
    x = +x;
    const hx = hi(x), ix = hx & 0x7fffffff;
    if (ix >= 0x3ff00000) {
      if (((ix - 0x3ff00000) | lo(x)) === 0) return x * PIO2_HI + x * PIO2_LO;
      return NaN;
    }
    if (ix < 0x3fe00000) {
      if (ix < 0x3e400000) return x;
      const t = x * x;
      return x + x * (aP(t) / aQ(t));
    }
    const t0 = (1 - N.abs(x)) * 0.5, p = aP(t0), q = aQ(t0), s = N.sqrt(t0);
    let t;
    if (ix >= 0x3fef3333) t = PIO2_HI - (2 * (s + s * (p / q)) - PIO2_LO);
    else {
      const w = zeroLo(s), c = (t0 - w * w) / (s + w), r = p / q;
      t = PIO4_HI - ((2 * s * r - (PIO2_LO - 2 * c)) - (PIO4_HI - 2 * w));
    }
    return hx > 0 ? t : -t;
  };
  DM.acos = function acos(x) {
    x = +x;
    const hx = hi(x), ix = hx & 0x7fffffff;
    if (ix >= 0x3ff00000) {
      if (((ix - 0x3ff00000) | lo(x)) === 0) return hx > 0 ? 0 : PI + 2 * PIO2_LO;
      return NaN;
    }
    if (ix < 0x3fe00000) {
      if (ix <= 0x3c600000) return PIO2_HI + PIO2_LO;
      const z = x * x;
      return PIO2_HI - (x - (PIO2_LO - x * (aP(z) / aQ(z))));
    }
    if (hx < 0) {
      const z = (1 + x) * 0.5, s = N.sqrt(z), w = (aP(z) / aQ(z)) * s - PIO2_LO;
      return PI - 2 * (s + w);
    }
    const z = (1 - x) * 0.5, s = N.sqrt(z), df = zeroLo(s), c = (z - df * df) / (s + df), w = (aP(z) / aQ(z)) * s + c;
    return 2 * (df + w);
  };

  // --- exp / log (e_exp.c, e_log.c)
  const LN2_HI = 6.93147180369123816490e-01, LN2_LO = 1.90821492927058770002e-10;
  const P1 = 1.66666666666666019037e-01, P2 = -2.77777777770155933842e-03, P3 = 6.61375632143793436117e-05,
    P4 = -1.65339022054652515390e-06, P5 = 4.13813679705723846039e-08, TWOM1000 = 9.33263618503218878990e-302;
  DM.exp = function exp(x) {
    x = +x;
    let hx = hi(x);
    const xsb = (hx >>> 31) & 1;
    hx &= 0x7fffffff;
    let k = 0, hv = 0, lv = 0;
    if (hx >= 0x40862e42) { // |x| >= 709.78
      if (hx >= 0x7ff00000) { if (x !== x) return x + x; return xsb === 0 ? x : 0; }
      if (x > 7.09782712893383973096e+02) return Infinity;
      if (x < -7.45133219101941108420e+02) return 0;
    }
    if (hx > 0x3fd62e42) { // |x| > 0.5 ln2
      if (hx < 0x3ff0a2b2) { hv = x - (xsb ? -LN2_HI : LN2_HI); lv = xsb ? -LN2_LO : LN2_LO; k = 1 - xsb - xsb; }
      else { k = (1.44269504088896338700e+00 * x + (xsb ? -0.5 : 0.5)) | 0; hv = x - k * LN2_HI; lv = k * LN2_LO; }
      x = hv - lv;
    } else if (hx < 0x3e300000) return 1 + x;
    const t = x * x, c = x - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
    if (k === 0) return 1 - ((x * c) / (c - 2) - x);
    const y = 1 - ((lv - (x * c) / (2 - c)) - hv);
    if (k >= -1021) return withHi(y, hi(y) + (k << 20));
    return withHi(y, hi(y) + ((k + 1000) << 20)) * TWOM1000;
  };
  const Lg1 = 6.666666666666735130e-01, Lg2 = 3.999999999940941908e-01, Lg3 = 2.857142874366239149e-01, Lg4 = 2.222219843214978396e-01,
    Lg5 = 1.818357216161805012e-01, Lg6 = 1.531383769920937332e-01, Lg7 = 1.479819860511658591e-01;
  DM.log = function log(x) {
    x = +x;
    let hx = hi(x), k = 0;
    if (hx < 0x00100000) { // x < 2^-1022
      if (((hx & 0x7fffffff) | lo(x)) === 0) return -Infinity;
      if (hx < 0) return NaN;
      k -= 54; x *= 1.80143985094819840000e+16; hx = hi(x);
    }
    if (hx >= 0x7ff00000) return x + x;
    k += (hx >> 20) - 1023;
    hx &= 0x000fffff;
    let i = (hx + 0x95f64) & 0x100000;
    x = withHi(x, hx | (i ^ 0x3ff00000)); // x or x/2 in [√2/2, √2)
    k += i >> 20;
    const f = x - 1, dk = k;
    if ((0x000fffff & (2 + hx)) < 3) { // |f| < 2^-20
      if (f === 0) return k === 0 ? 0 : dk * LN2_HI + dk * LN2_LO;
      const R = f * f * (0.5 - 0.33333333333333333 * f);
      return k === 0 ? f - R : dk * LN2_HI - ((R - dk * LN2_LO) - f);
    }
    const s = f / (2 + f), z = s * s, w = z * z;
    i = hx - 0x6147a;
    const j = 0x6b851 - hx;
    const R = z * (Lg1 + w * (Lg3 + w * (Lg5 + w * Lg7))) + w * (Lg2 + w * (Lg4 + w * Lg6));
    i |= j;
    if (i > 0) {
      const hfsq = 0.5 * f * f;
      return k === 0 ? f - (hfsq - s * (hfsq + R)) : dk * LN2_HI - ((hfsq - (s * (hfsq + R) + dk * LN2_LO)) - f);
    }
    return k === 0 ? f - s * (f - R) : dk * LN2_HI - ((s * (f - R) - dk * LN2_LO) - f);
  };
  // pow (e_pow.c)
  const BP = [1, 1.5], DP_H = [0, 5.84962487220764160156e-01], DP_L = [0, 1.35003920212974897128e-08];
  const L1 = 5.99999999999994648725e-01, L2 = 4.28571428578550184252e-01, L3 = 3.33333329818377432918e-01,
    L4 = 2.72728123808534006489e-01, L5 = 2.30660745775561754067e-01, L6 = 2.06975017800338417784e-01;
  const LG2 = 6.93147180559945286227e-01, LG2_H = 6.93147182464599609375e-01, LG2_L = -1.90465429995776804525e-09,
    OVT = 8.0085662595372944372e-17, CP = 9.61796693925975554329e-01, CP_H = 9.61796700954437255859e-01,
    CP_L = -7.02846165095275826516e-09, IVLN2 = 1.44269504088896338700e+00, IVLN2_H = 1.44269502162933349609e+00,
    IVLN2_L = 1.92596299112661746887e-08, HUGE = 1.0e300, TINY = 1.0e-300;
  const scalbn = (z, n) => { // z·2^n in exact power-of-two steps (only reached for a subnormal result)
    while (n < -1022) { z *= 2.2250738585072014e-308; n += 1022; }
    return z * mk((n + 0x3ff) << 20, 0);
  };
  DM.pow = function pow(x, y) {
    x = +x; y = +y;
    const hx = hi(x), lx = lo(x), hy = hi(y), ly = lo(y), ix0 = hx & 0x7fffffff, iy = hy & 0x7fffffff;
    let ix = ix0;
    if ((iy | ly) === 0) return 1;
    if (ix > 0x7ff00000 || (ix === 0x7ff00000 && lx !== 0) || iy > 0x7ff00000 || (iy === 0x7ff00000 && ly !== 0)) return x + y;
    // yisint: 0 = not an integer, 1 = odd, 2 = even (only needed when x < 0)
    let yisint = 0, k, j;
    if (hx < 0) {
      if (iy >= 0x43400000) yisint = 2;
      else if (iy >= 0x3ff00000) {
        k = (iy >> 20) - 0x3ff;
        if (k > 20) { j = ly >>> (52 - k); if (((j << (52 - k)) >>> 0) === ly) yisint = 2 - (j & 1); }
        else if (ly === 0) { j = iy >> (20 - k); if ((j << (20 - k)) === iy) yisint = 2 - (j & 1); }
      }
    }
    if (ly === 0) {
      if (iy === 0x7ff00000) { // y = ±∞
        if (((ix - 0x3ff00000) | lx) === 0) return y - y;
        if (ix >= 0x3ff00000) return hy >= 0 ? y : 0;
        return hy < 0 ? -y : 0;
      }
      if (iy === 0x3ff00000) return hy < 0 ? 1 / x : x;
      if (hy === 0x40000000) return x * x;
      if (hy === 0x3fe00000 && hx >= 0) return N.sqrt(x);
    }
    let ax = N.abs(x);
    if (lx === 0 && (ix === 0x7ff00000 || ix === 0 || ix === 0x3ff00000)) { // x = ±0, ±∞, ±1
      let z = ax;
      if (hy < 0) z = 1 / z;
      if (hx < 0) {
        if (((ix - 0x3ff00000) | yisint) === 0) z = NaN;
        else if (yisint === 1) z = -z;
      }
      return z;
    }
    let n = (hx >> 31) + 1;
    if ((n | yisint) === 0) return NaN; // (x < 0) ** non-integer
    let s = 1;
    if ((n | (yisint - 1)) === 0) s = -1;
    let t1, t2, t, u, v, w;
    if (iy > 0x41e00000) { // |y| > 2^31
      if (iy > 0x43f00000) {
        if (ix <= 0x3fefffff) return hy < 0 ? HUGE * HUGE : TINY * TINY;
        if (ix >= 0x3ff00000) return hy > 0 ? HUGE * HUGE : TINY * TINY;
      }
      if (ix < 0x3fefffff) return hy < 0 ? s * HUGE * HUGE : s * TINY * TINY;
      if (ix > 0x3ff00000) return hy > 0 ? s * HUGE * HUGE : s * TINY * TINY;
      t = ax - 1;
      w = (t * t) * (0.5 - t * (0.3333333333333333333333 - t * 0.25));
      u = IVLN2_H * t;
      v = t * IVLN2_L - w * IVLN2;
      t1 = zeroLo(u + v);
      t2 = v - (t1 - u);
    } else {
      n = 0;
      if (ix < 0x00100000) { ax *= 9007199254740992; n -= 53; ix = hi(ax); }
      n += (ix >> 20) - 0x3ff;
      j = ix & 0x000fffff;
      ix = j | 0x3ff00000;
      if (j <= 0x3988e) k = 0;
      else if (j < 0xbb67a) k = 1;
      else { k = 0; n += 1; ix -= 0x00100000; }
      ax = withHi(ax, ix);
      u = ax - BP[k];
      v = 1 / (ax + BP[k]);
      const ss = u * v, sh = zeroLo(ss);
      let th = mk(((ix >> 1) | 0x20000000) + 0x00080000 + (k << 18), 0);
      let tl = ax - (th - BP[k]);
      const sl = v * ((u - sh * th) - sh * tl);
      let s2 = ss * ss;
      let r = s2 * s2 * (L1 + s2 * (L2 + s2 * (L3 + s2 * (L4 + s2 * (L5 + s2 * L6)))));
      r += sl * (sh + ss);
      s2 = sh * sh;
      th = zeroLo(3 + s2 + r);
      tl = r - ((th - 3) - s2);
      u = sh * th;
      v = sl * th + tl * ss;
      const ph = zeroLo(u + v), pl = v - (ph - u);
      const zh = CP_H * ph, zl = CP_L * ph + pl * CP + DP_L[k];
      t = n;
      t1 = zeroLo(((zh + zl) + DP_H[k]) + t);
      t2 = zl - (((t1 - t) - DP_H[k]) - zh);
    }
    // (y1 + y2)·(t1 + t2)
    const y1 = zeroLo(y);
    const pl = (y - y1) * t1 + y * t2;
    let ph = y1 * t1;
    let z = pl + ph;
    j = hi(z);
    let i = lo(z);
    if (j >= 0x40900000) { // z >= 1024
      if (((j - 0x40900000) | i) !== 0) return s * HUGE * HUGE;
      if (pl + OVT > z - ph) return s * HUGE * HUGE;
    } else if ((j & 0x7fffffff) >= 0x4090cc00) { // z <= -1075
      if (((j - 0xc090cc00) | i) !== 0) return s * TINY * TINY;
      if (pl <= z - ph) return s * TINY * TINY;
    }
    // 2 ** (ph + pl)
    i = j & 0x7fffffff;
    k = (i >> 20) - 0x3ff;
    n = 0;
    if (i > 0x3fe00000) {
      n = (j + (0x00100000 >> (k + 1))) | 0;
      k = ((n & 0x7fffffff) >> 20) - 0x3ff;
      t = mk(n & ~(0x000fffff >> k), 0);
      n = ((n & 0x000fffff) | 0x00100000) >> (20 - k);
      if (j < 0) n = -n;
      ph -= t;
    }
    t = zeroLo(pl + ph);
    u = t * LG2_H;
    v = (pl - (t - ph)) * LG2 + t * LG2_L;
    z = u + v;
    w = v - (z - u);
    t = z * z;
    t1 = z - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
    const r = (z * t1) / (t1 - 2) - (w + z * w);
    z = 1 - (r - z);
    j = (hi(z) + (n << 20)) | 0;
    if ((j >> 20) <= 0) z = scalbn(z, n);
    else z = withHi(z, j);
    return s * z;
  };
  DM.hypot = function hypot() {
    const n = arguments.length;
    let m = 0, nan = false;
    for (let i = 0; i < n; i++) {
      const v = N.abs(+arguments[i]);
      if (v === Infinity) return Infinity;
      if (v !== v) nan = true; else if (v > m) m = v;
    }
    if (nan) return NaN;
    if (m === 0) return 0;
    let s = 0;
    for (let i = 0; i < n; i++) { const r = N.abs(+arguments[i]) / m; s += r * r; }
    return m * N.sqrt(s);
  };
  // not used by the simulation today; built on the functions above so they stay engine-independent too
  DM.sinh = function sinh(x) { x = +x; const e = DM.exp(x); return (e - 1 / e) / 2; };
  DM.cosh = function cosh(x) { x = +x; const e = DM.exp(x); return (e + 1 / e) / 2; };
  DM.tanh = function tanh(x) { x = +x; if (x > 20) return 1; if (x < -20) return -1; const e = DM.exp(2 * x); return (e - 1) / (e + 1); };
  DM.log2 = function log2(x) { return DM.log(+x) / N.LN2; };
  DM.log10 = function log10(x) { return DM.log(+x) / N.LN10; };
  DM.cbrt = function cbrt(x) { x = +x; if (x === 0 || !Number.isFinite(x)) return x; const r = DM.exp(DM.log(N.abs(x)) / 3); return x < 0 ? -r : r; };
  DM.expm1 = function expm1(x) { x = +x; return N.abs(x) < 1e-5 ? x + x * x / 2 + x * x * x / 6 : DM.exp(x) - 1; };
  DM.log1p = function log1p(x) { x = +x; return N.abs(x) < 1e-5 ? x - x * x / 2 + x * x * x / 3 : DM.log(1 + x); };
  ND.DM = DM;
})(window.ND);

// ---------------------------------------------------------------- SIMULATION RANDOM STREAM (ND.rng)
// Everything that decides the fight (AI choices, sword-lock chance, ragdoll push, arrow volley spread...) draws from
// ND.rng and only from it: one 32-bit state (mulberry32), saved with the fight (game.saveState) and seeded the same on
// both devices online. Math.random stays for the picture and the sound (sparks, weather, voice picks, camera shake),
// whose timing depends on the display and the wall clock and so must never move the fight.
(function (ND) {
  'use strict';
  ND.rng = {
    s: 0,
    seed(n) { this.s = n | 0; return this; },
    next() {
      let t = (this.s = (this.s + 0x6d2b79f5) | 0);
      t = Math.imul(t ^ (t >>> 15), 1 | t);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    range(a, b) { return a + this.next() * (b - a); },
  };
  ND.rng.seed((Math.random() * 4294967296) >>> 0); // offline: a different fight every session
})(window.ND);

(function (ND) {
  'use strict';
  const Math = ND.DM || globalThis.Math; // the helpers below (approach, ease, segSeg) are simulation math

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  // Geliştirici profili: ND.prof (test düzeneği) tanımlı ve açıkken çizim aşamalarını işaretler; normalde tek okuma
  ND.profBuiltin = true;
  ND.pm = function (name) { const p = ND.prof; if (p && p.on) p.m(name); };

  const M = ND.M = {
    TAU: Math.PI * 2,
    clamp,
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a, b) => a + Math.random() * (b - a),
    pick: (arr) => arr[(Math.random() * arr.length) | 0],
    sign: (v) => (v < 0 ? -1 : 1),
    approach: (v, target, rate, dt) => target + (v - target) * Math.exp(-rate * dt),
    ease: {
      linear: (t) => t,
      inQuad: (t) => t * t,
      inCubic: (t) => t * t * t,
      outCubic: (t) => 1 - Math.pow(1 - t, 3),
      outQuart: (t) => 1 - Math.pow(1 - t, 4),
      outBack: (t) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
      inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
      inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    },
    // İki doğru parçası arasındaki en kısa mesafe (Ericson, RTCD)
    segSeg(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y) {
      const d1x = q1x - p1x, d1y = q1y - p1y, d2x = q2x - p2x, d2y = q2y - p2y;
      const rx = p1x - p2x, ry = p1y - p2y;
      const a = d1x * d1x + d1y * d1y, e = d2x * d2x + d2y * d2y, f = d2x * rx + d2y * ry;
      let s, t;
      if (a <= 1e-9 && e <= 1e-9) { s = t = 0; }
      else if (a <= 1e-9) { s = 0; t = clamp(f / e, 0, 1); }
      else {
        const c = d1x * rx + d1y * ry;
        if (e <= 1e-9) { t = 0; s = clamp(-c / a, 0, 1); }
        else {
          const b = d1x * d2x + d1y * d2y, den = a * e - b * b;
          s = den !== 0 ? clamp((b * f - c * e) / den, 0, 1) : 0;
          t = (b * s + f) / e;
          if (t < 0) { t = 0; s = clamp(-c / a, 0, 1); }
          else if (t > 1) { t = 1; s = clamp((b - c) / a, 0, 1); }
        }
      }
      const cx1 = p1x + d1x * s, cy1 = p1y + d1y * s, cx2 = p2x + d2x * t, cy2 = p2y + d2y * t;
      return { d: Math.hypot(cx1 - cx2, cy1 - cy2), x: (cx1 + cx2) / 2, y: (cy1 + cy2) / 2, s };
    },
  };

  // ---------------------------------------------------------------- PORTAL
  // Which portal we run on, guessed synchronously (same rules as @studio/portal detectPortal) so classic
  // scripts can decide things at load time (blood allowed? Escape allowed?). The real SDK wrapper is the
  // module src/portal-bridge.ts: it arrives later as window.NDPortal and resolves ND.portal.ready.
  const qs = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(''); } })();
  ND.qs = qs;
  ND.portalName = (() => {
    const known = (v) => v === 'crazygames' || v === 'poki' || v === 'yandex' || v === 'playgama' || v === 'local';
    const f = qs.get('portal');
    if (known(f)) return f;
    // Portal-only build (npm run build:yandex / build:playgama): <meta name="nd-portal"> fixes the portal whatever the host is
    let b = null;
    try { const m = document.querySelector('meta[name="nd-portal"]'); b = m && m.getAttribute('content'); } catch (e) { /* no DOM */ }
    if (known(b)) return b;
    let ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) { /* bad referrer */ }
    const hosts = (location.hostname || '') + ' ' + ref;
    if (/crazygames\.com|1001juegos\.com|crazygames\.[a-z.]+/.test(hosts)) return 'crazygames';
    if (/poki\.com|poki-gdn\.com/.test(hosts)) return 'poki';
    if (/yandex\.(ru|net|com)/.test(hosts)) return 'yandex';
    return 'local';
  })();
  // Online leaderboard (leaderboard.js) reads ND.platform: Poki forbids external requests; the portal guess wins
  // over its own host sniffing so ?portal=poki behaves like the real thing.
  // Yandex Games too: sign-in only with a Yandex ID (rule 1.2), no links out (8.4) and every outside host must be
  // approved in the console; there the leaderboards stay on the device and the progress rides Yandex player data.
  // Playgama too: one build goes to many partner sites, several of them (YouTube Playables, GameDistribution…) forbid
  // outside requests; there the progress rides Bridge storage.
  if (ND.portalName === 'poki' || ND.portalName === 'yandex' || ND.portalName === 'playgama') ND.platform = Object.assign({ name: ND.portalName, allowNetwork: false }, ND.platform || {});
  else if (ND.portalName !== 'local') ND.platform = Object.assign({ name: ND.portalName }, ND.platform || {});
  // Portals that forbid links out of the game (Yandex 8.4): no Privacy Policy & Terms links. The game sends no personal
  // data there (no network above), so there is no policy to point at.
  // Playgama: neither Playgama itself nor most partner sites allow links out (Bridge platform.isExternalLinksAllowed).
  ND.NO_LINK_PORTALS = { yandex: true, playgama: true };
  ND.linksAllowed = () => !ND.NO_LINK_PORTALS[ND.portalName];
  // Blood is opt-in and only where the portal's age rating allows it (PEGI 12 forbids blood on human
  // characters; Poki forbids body fluids). Everywhere else hits use the ink & shadow style (scene.js).
  ND.BLOOD_PORTALS = { local: true, crazygames: false, poki: false, yandex: false, playgama: false };
  ND.bloodAllowed = () => !!ND.BLOOD_PORTALS[ND.portalName];
  ND.isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname || '') || location.protocol === 'file:';

  // Shared deferred with the bridge module (whichever loads first creates it)
  const PD = window.__ndPortalD || (window.__ndPortalD = (() => { let r; const p = new Promise((x) => (r = x)); return { p, r }; })());
  const api = () => window.NDPortal || null;
  const adFns = new Set(), muteFns = new Set();
  const want = { loaded: false, play: false };
  let firstPlay = false;
  const mark = (n) => { try { performance.mark(n); } catch (e) { /* no User Timing */ } };
  const P = ND.portal = {
    name: ND.portalName,
    ready: PD.p,
    inAd: false,
    muted: false,
    get sdk() { const a = api(); return !!(a && a.sdk); },
    // Game became playable (menu shown, first frame drawn)
    // (performance marks nd-loading-finished / nd-first-gameplay: load-time checks read them, they cost nothing)
    loadingFinished() { if (!want.loaded) mark('nd-loading-finished'); want.loaded = true; const a = api(); if (a) a.loadingFinished(); },
    // Player is actually fighting (not menus, not paused, not end screens). Idempotent.
    gameplayStart() { if (!firstPlay) { firstPlay = true; mark('nd-first-gameplay'); } want.play = true; const a = api(); if (a) a.gameplayStart(); },
    gameplayStop() { want.play = false; const a = api(); if (a) a.gameplayStop(); },
    happyTime() { const a = api(); if (a) a.happyTime(); },
    // Forced ad at a natural break; resolves when the game may continue (also without a bridge)
    interstitial() { const a = api(); return a ? a.interstitial() : Promise.resolve(); },
    // Rewarded ad; true only when the reward must be granted. Without a bridge (plain file serve) it grants.
    rewarded() { const a = api(); return a ? a.rewarded() : Promise.resolve(true); },
    save(k, v) { const a = api(); return a ? a.save(k, v) : Promise.resolve(); },
    load(k) { const a = api(); return a ? a.load(k) : Promise.resolve(undefined); },
    language() { const a = api(); try { return a ? a.language() : (navigator.language || 'en').slice(0, 2).toLowerCase(); } catch (e) { return 'en'; } },
    // Language the portal makes the game use (Yandex: SDK environment.i18n.lang), or null (the game picks: English).
    // Only meaningful after `ready` (js/i18n.js waits for it).
    requiredLanguage() {
      const a = api();
      try { return a && a.requiredLanguage ? a.requiredLanguage() : null; } catch (e) { return null; }
    },
    // fn('start' | 'end'); returns unsubscribe
    onAd(fn) { adFns.add(fn); return () => adFns.delete(fn); },
    // fn(muted) — the portal's own audio switch
    onMute(fn) { muteFns.add(fn); if (P.muted) fn(true); return () => muteFns.delete(fn); },
  };
  const emit = (set, v) => set.forEach((fn) => { try { fn(v); } catch (e) { console.warn('[ND.portal] listener failed', e); } });
  PD.p.then((a) => {
    if (!a) return;
    if (want.loaded) a.loadingFinished();
    if (want.play) a.gameplayStart();
    a.onAd((ph) => { P.inAd = ph === 'start'; emit(adFns, ph); });
    a.onMute((m) => { P.muted = m; emit(muteFns, m); });
  });

  // ---------------------------------------------------------------- SES
  const A = ND.audio = {
    ctx: null, enabled: true, ready: false,
    // Silence sources on top of the player's own switch (enabled): portal switch, running ad,
    // ?mute=1 (tools), and "away" (tab hidden; on localhost also window unfocused).
    portalMuted: false, adMuted: false, paramMuted: qs.get('mute') === '1', away: false,
    audible() { return this.enabled && !this.portalMuted && !this.adMuted && !this.paramMuted && !this.away; },
    // Player volume sliders, 0..1 (js/volume.js shows them and saves them as whole percents in settings.vol).
    // Routing: every effect (hits, voices, UI, ambience) → dry/revIn ("sfx" level) → master; music has its own
    // bus (music.js, "music" level) → master. Master = mute gate × "master" level → compressor → speakers.
    VOL_DEFAULT: { master: 0.8, music: 0.6, sfx: 0.9 },
    vol: { master: 0.8, music: 0.6, sfx: 0.9 },
    // Slider position → gain: squared, so the travel feels even to the ear (about a 40 dB range) and 0 is silence
    curve(v) { v = clamp(+v || 0, 0, 1); return v * v; },
    masterLevel() { return this.audible() ? 0.85 * this.curve(this.vol.master) : 0; },
    // Click-free change: hold the value where it is right now, then glide to the new one
    ramp(param, v, tc = 0.04) {
      if (!param || !this.ctx) return;
      const t = this.ctx.currentTime;
      try {
        if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(t);
        else { param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); }
        param.setTargetAtTime(v, t, tc);
      } catch (e) { param.value = v; }
    },
    applyGain(tc = 0.05) {
      if (!this.master || !this.ctx) return;
      this.ramp(this.master.gain, this.masterLevel(), tc);
      this.syncRev();
    },
    // The reverb (a 2.6 s convolution, the costliest part of the sound) only runs while something can be heard: when
    // the game is muted its input is unplugged (after the fade-out), so the browser stops computing it.
    syncRev() {
      if (!this.rev || !this.revIn) return;
      const on = this.masterLevel() > 0;
      clearTimeout(this.revTimer);
      if (on === this.revOn) return;
      const apply = () => {
        this.revOn = on;
        try { if (on) this.revIn.connect(this.rev); else this.revIn.disconnect(this.rev); } catch (e) { /* already (dis)connected */ }
      };
      if (on) apply(); else this.revTimer = setTimeout(apply, 400);
    },
    // Low graphics (weak devices): a shorter reverb tail, about half the convolution work (game.js calls this)
    setLite(v) {
      v = !!v;
      if (v === !!this.lite) return;
      this.lite = v;
      if (this.rev) this.rev.buffer = this.makeIR(v ? 1.2 : 2.6);
    },
    // kind: 'master' | 'music' | 'sfx'; v 0..1. Applies at once (short glide); saving is the caller's job.
    setVolume(kind, v) {
      if (!(kind in this.vol)) return;
      this.vol[kind] = clamp(+v || 0, 0, 1);
      if (kind === 'master') this.applyGain(0.04);
      else if (kind === 'sfx') { const g = this.curve(this.vol.sfx); this.ramp(this.dry && this.dry.gain, g); this.ramp(this.revIn && this.revIn.gain, g); }
      else if (ND.music && ND.music.applyVolume) ND.music.applyVolume();
    },
    // Short sample at the current effects level (slider preview). Plays even on the menu, where the demo fight is quiet.
    previewFx() {
      if (!this.ready) return;
      const q = this.quiet; this.quiet = false;
      try { this.tick(0); } finally { this.quiet = q; }
    },
    // Portal's own audio switch (CrazyGames settings): the in-game toggle cannot lift it
    setPortalMute(v) { this.portalMuted = !!v; this.applyGain(); },
    // Ads run silent; the player's own sound setting is left untouched
    suspendForAd() { this.adMuted = true; this.applyGain(0.01); },
    resumeAfterAd() { this.adMuted = false; this.applyGain(0.1); },
    // Dev rule (CLAUDE.md): on localhost the game is silent while the window is not focused; live only a hidden tab silences
    updateAway() {
      let away = false;
      try { away = document.hidden || (ND.isLocalHost && !document.hasFocus()); } catch (e) { /* no document */ }
      if (away !== this.away) { this.away = away; this.applyGain(away ? 0.02 : 0.15); }
    },

    init() {
      // iOS arka plandan dönünce 'interrupted' kalabilir; jest dışında reddedilen resume sessizce yutulur
      if (this.ctx) { if (this.ctx.state !== 'running' && this.ctx.state !== 'closed') { try { const p = this.ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* yok */ } } return; }
      let c;
      try { c = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      this.ctx = c;
      this.master = c.createGain();
      this.updateAway();
      this.master.gain.value = this.masterLevel();
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
      this.master.connect(comp); comp.connect(c.destination);
      // effects level: dry path and reverb send share it (the reverb itself is shared with the music bus, whose
      // send is taken after the music level, so each slider scales its own reverb tail too)
      const fx = this.curve(this.vol.sfx);
      this.dry = c.createGain(); this.dry.gain.value = fx; this.dry.connect(this.master);
      this.rev = c.createConvolver(); this.rev.buffer = this.makeIR(this.lite ? 1.2 : 2.6);
      this.revIn = c.createGain(); this.revIn.gain.value = fx; this.revIn.connect(this.rev); this.revOn = true;
      const rg = c.createGain(); rg.gain.value = 0.32; this.rev.connect(rg); rg.connect(this.master);
      const len = c.sampleRate * 2;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.ready = true;
      this.syncRev();
      this.ambience();
    },

    setEnabled(v) {
      this.enabled = !!v;
      this.applyGain();
    },

    makeIR(sec) {
      const c = this.ctx, len = (c.sampleRate * sec) | 0, b = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = b.getChannelData(ch);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4);
      }
      return b;
    },

    out(send, pan) {
      const c = this.ctx, g = c.createGain();
      let head = g;
      if (pan && c.createStereoPanner) {
        const p = c.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
        g.connect(p); head = p;
      }
      head.connect(this.dry);
      if (send > 0) { const s = c.createGain(); s.gain.value = send; head.connect(s); s.connect(this.revIn); }
      return g;
    },

    noise(o) {
      if (!this.ready || this.quiet) return;
      const c = this.ctx, t = c.currentTime + (o.delay || 0);
      const src = c.createBufferSource(); src.buffer = this.noiseBuf;
      src.playbackRate.value = o.rate || 1;
      const f = c.createBiquadFilter(); f.type = o.type || 'bandpass'; f.Q.value = o.q || 1;
      f.frequency.setValueAtTime(o.f0 || 1000, t);
      if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
      const g = this.out(o.send ?? 0.2, o.pan);
      const gain = o.gain ?? 0.5, at = o.attack ?? 0.004;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + at);
      g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
      src.connect(f); f.connect(g);
      src.start(t, Math.random() * 1.5); src.stop(t + o.dur + 0.05);
    },

    tone(o) {
      if (!this.ready || this.quiet) return;
      const c = this.ctx, t = c.currentTime + (o.delay || 0);
      const osc = c.createOscillator(); osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(o.freq, t);
      if (o.freq1) osc.frequency.exponentialRampToValueAtTime(o.freq1, t + (o.glide || o.dur));
      const g = this.out(o.send ?? 0.25, o.pan);
      const gain = o.gain ?? 0.3, at = o.attack ?? 0.003;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + at);
      g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
      osc.connect(g); osc.start(t); osc.stop(t + o.dur + 0.05);
    },

    // --- oyun sesleri
    swoosh(power = 1, pan = 0) {
      const d = 0.16 + 0.12 * power;
      this.noise({ type: 'bandpass', f0: 500 + 300 * power, f1: 2600 + 900 * power, q: 1.4, dur: d, gain: 0.22 + 0.2 * power, attack: d * 0.55, send: 0.12, pan });
      this.noise({ type: 'highpass', f0: 3000, dur: d * 0.8, gain: 0.05 * power, attack: d * 0.5, send: 0.05, pan });
    },
    clang(power = 1, pan = 0, pitch = 1) {
      const base = (560 + Math.random() * 90) * pitch;
      [1, 2.76, 5.4, 8.93, 13.3].forEach((r, i) => {
        this.tone({ freq: base * r, type: i ? 'sine' : 'triangle', dur: (1.3 - i * 0.18) * (0.6 + power * 0.5), gain: (0.2 / (i + 1)) * power, send: 0.5, pan });
      });
      this.noise({ type: 'highpass', f0: 2500, dur: 0.06, gain: 0.5 * power, send: 0.3, pan });
    },
    parry(pan = 0) {
      this.clang(1.3, pan, 1.45);
      this.tone({ freq: 2400, freq1: 1800, dur: 1.6, gain: 0.08, send: 0.7, pan });
    },
    cut(power = 1, pan = 0) {
      this.noise({ type: 'highpass', f0: 1800, f1: 700, dur: 0.12, gain: 0.35 * power, send: 0.1, pan });
      this.tone({ freq: 140, freq1: 45, dur: 0.22, gain: 0.55 * power, send: 0.08, pan });
      this.noise({ type: 'lowpass', f0: 900, dur: 0.18, gain: 0.3 * power, send: 0.05, pan, delay: 0.01 });
    },
    thud(power = 1, pan = 0) {
      this.tone({ freq: 110, freq1: 38, dur: 0.28, gain: 0.6 * power, send: 0.1, pan });
      this.noise({ type: 'lowpass', f0: 500, dur: 0.14, gain: 0.35 * power, send: 0.05, pan });
    },
    step(pan = 0, g = 1) {
      this.noise({ type: 'lowpass', f0: 380 + Math.random() * 200, dur: 0.07, gain: 0.07 * g, send: 0.02, pan });
    },
    whistle(pan = 0) {
      this.tone({ freq: 2600, freq1: 1500, dur: 0.35, gain: 0.05, send: 0.2, pan, type: 'sine' });
      this.noise({ type: 'bandpass', f0: 3500, f1: 2000, q: 6, dur: 0.3, gain: 0.12, send: 0.15, pan });
    },
    tick(pan = 0) {
      this.tone({ freq: 3200, freq1: 2400, dur: 0.12, gain: 0.08, send: 0.3, pan, type: 'triangle' });
      this.noise({ type: 'highpass', f0: 4000, dur: 0.04, gain: 0.2, send: 0.2, pan });
    },
    gong() {
      [1, 1.49, 2.03, 2.74, 3.4].forEach((r, i) => this.tone({ freq: 92 * r, dur: 3.5 - i * 0.4, gain: 0.26 / (i + 1), attack: 0.01, send: 0.6 }));
      this.noise({ type: 'lowpass', f0: 300, dur: 0.3, gain: 0.25, send: 0.4 });
    },
    taiko(power = 1, delay = 0) {
      this.tone({ freq: 150, freq1: 52, glide: 0.25, dur: 0.6, gain: 0.8 * power, send: 0.35, delay });
      this.noise({ type: 'lowpass', f0: 700, dur: 0.12, gain: 0.35 * power, send: 0.3, delay });
    },
    ko() {
      this.taiko(1.2); this.taiko(1, 0.32);
      this.tone({ freq: 55, dur: 2.5, gain: 0.4, send: 0.7, delay: 0.05 });
      this.tone({ freq: 880, freq1: 660, dur: 2.8, gain: 0.05, send: 0.9, delay: 0.1 });
    },
    ui() { this.tone({ freq: 1200, freq1: 900, dur: 0.09, gain: 0.07, send: 0.2, type: 'triangle' }); },

    // Ortam sesi katmanları: rüzgâr, yağmur, tipi, ateş, su, çarşı, fırtına — arenaya göre yumuşak geçiş
    // (katmanlar ilk kullanıldıklarında kurulur; kullanılmayan arena ses işlemcisi harcamaz)
    ambience() {
      const c = this.ctx;
      const layer = (type, freq, q, level, lfoRate, lfoDepth, fRate, fDepth, buf) => {
        const src = c.createBufferSource(); src.buffer = buf || this.noiseBuf; src.loop = true; src.playbackRate.value = 0.9 + Math.random() * 0.2;
        const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
        const g = c.createGain(); g.gain.value = 0;
        const bus = c.createGain(); bus.gain.value = 1;
        if (lfoRate) { const l = c.createOscillator(); l.frequency.value = lfoRate; const lg = c.createGain(); lg.gain.value = lfoDepth; l.connect(lg); lg.connect(bus.gain); l.start(); }
        if (fRate) { const l = c.createOscillator(); l.frequency.value = fRate; const lg = c.createGain(); lg.gain.value = fDepth; l.connect(lg); lg.connect(f.frequency); l.start(); }
        src.connect(f); f.connect(bus); bus.connect(g); g.connect(this.dry); // ambience counts as an effect
        src.start(0, Math.random() * 1.5);
        g._level = level;
        return g;
      };
      // çıtırtı tamponu: seyrek, hızla sönen kıvılcım patlamaları (ateş / ızgara)
      const crackle = () => {
        if (this.crackBuf) return this.crackBuf;
        const len = c.sampleRate * 3, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
        for (let n = 0; n < 55; n++) {
          const at = (Math.random() * (len - 4000)) | 0, l = (40 + Math.random() * (Math.random() < 0.15 ? 2500 : 500)) | 0, a = 0.25 + Math.random() * 0.75;
          for (let i = 0; i < l; i++) d[at + i] += (Math.random() * 2 - 1) * a * Math.exp((-4 * i) / l);
        }
        return (this.crackBuf = b);
      };
      this.ambDefs = {
        wind: () => [layer('lowpass', 380, 0.7, 0.05, 0.09, 0.6, 0.05, 180)],
        rain: () => [layer('bandpass', 2600, 0.5, 0.11, 0.3, 0.15, 0, 0), layer('lowpass', 240, 0.6, 0.08, 0.07, 0.4, 0, 0), layer('highpass', 6000, 0.4, 0.03, 0, 0, 0, 0)],
        blizzard: () => [layer('lowpass', 650, 0.8, 0.08, 0.13, 0.7, 0.07, 300), layer('bandpass', 1300, 4, 0.025, 0.21, 0.8, 0.11, 500)],
        // yangın: çıtırtı + alçak uğultu + nefes alan alev hışırtısı
        fire: () => [layer('highpass', 900, 0.7, 0.2, 0, 0, 0, 0, crackle()), layer('lowpass', 150, 0.8, 0.14, 0.19, 0.5, 0, 0), layer('bandpass', 420, 0.8, 0.035, 0.37, 0.7, 0.13, 160)],
        // şelale: sürekli gürleyen akış
        water: () => [layer('lowpass', 1200, 0.5, 0.12, 0.05, 0.1, 0, 0), layer('bandpass', 420, 0.7, 0.09, 0.11, 0.2, 0.07, 90), layer('highpass', 3800, 0.5, 0.035, 0.23, 0.25, 0, 0)],
        // çarşı: uzak kalabalık mırıltısı + ızgara cızırtısı
        market: () => [layer('bandpass', 480, 1.6, 0.045, 3.1, 0.55, 0.7, 140), layer('bandpass', 950, 2.4, 0.022, 4.3, 0.6, 1.1, 250), layer('lowpass', 200, 0.6, 0.035, 0.09, 0.3, 0, 0),
          layer('highpass', 1800, 0.7, 0.05, 0, 0, 0, 0, crackle()), layer('highpass', 6000, 0.5, 0.01, 0.3, 0.8, 0, 0)],
        // kale çatısı: sert, uluyan rüzgâr
        gale: () => [layer('lowpass', 520, 0.8, 0.1, 0.11, 0.8, 0.06, 320), layer('bandpass', 820, 7, 0.04, 0.17, 0.9, 0.09, 380), layer('bandpass', 1650, 9, 0.014, 0.23, 0.9, 0.13, 650)],
      };
      this.amb = {};
      this.setAmbience(this.ambKind || 'wind');
    },
    setAmbience(kind) {
      this.ambKind = kind;
      if (!this.amb) return;
      if (kind && !this.amb[kind] && this.ambDefs[kind]) this.amb[kind] = this.ambDefs[kind]();
      const t = this.ctx.currentTime;
      for (const k in this.amb) for (const g of this.amb[k]) g.gain.setTargetAtTime(k === kind ? g._level : 0, t, 0.9);
    },
    thunder(delay = 0.5) {
      this.noise({ type: 'lowpass', f0: 220, f1: 60, dur: 3.4, gain: 0.8, attack: 0.08, send: 0.6, delay });
      this.noise({ type: 'lowpass', f0: 1200, f1: 300, dur: 0.5, gain: 0.35, attack: 0.01, send: 0.4, delay });
      this.tone({ freq: 48, freq1: 30, dur: 2.6, gain: 0.45, attack: 0.1, send: 0.4, delay: delay + 0.05 });
    },
    whoosh(power = 1) { this.noise({ type: 'bandpass', f0: 300, f1: 3000, q: 0.8, dur: 0.5, gain: 0.3 * power, attack: 0.35, send: 0.4 }); },
  };

  // Silence follows focus/visibility, the portal switch and ads (ND.portal hooks)
  const away = () => A.updateAway();
  document.addEventListener('visibilitychange', away);
  window.addEventListener('focus', away);
  window.addEventListener('blur', away);
  window.addEventListener('pageshow', away);
  P.onMute((m) => A.setPortalMute(m));
  P.onAd((ph) => (ph === 'start' ? A.suspendForAd() : A.resumeAfterAd()));
})(window.ND);
