window.ND = window.ND || {};
(function() {
	let on = false;
	try {
		on = /[?&]newplayer=1(&|$)/.test(location.search || "");
	} catch (e) {
		on = false;
	}
	if (!on) return;
	const mem = new Map();
	const store = {
		getItem: (k) => mem.has(String(k)) ? mem.get(String(k)) : null,
		setItem: (k, v) => {
			mem.set(String(k), String(v));
		},
		removeItem: (k) => {
			mem.delete(String(k));
		},
		clear: () => {
			mem.clear();
		},
		key: (i) => {
			const k = [...mem.keys()][i];
			return k === undefined ? null : k;
		},
		get length() {
			return mem.size;
		}
	};
	try {
		Object.defineProperty(window, "localStorage", {
			configurable: true,
			enumerable: true,
			get: () => store
		});
	} catch (e) {}
	window.ND.NEWPLAYER = (() => {
		try {
			return window.localStorage === store;
		} catch (e) {
			return false;
		}
	})();
})();
(function(ND) {
	"use strict";
	const N = Math, DM = {};
	for (const k of Object.getOwnPropertyNames(N)) DM[k] = N[k];
	DM.random = function random() {
		return N.random();
	};
	if (ND.DM_NATIVE) {
		ND.DM = DM;
		return;
	}
	const F = new Float64Array(1), U = new Uint32Array(F.buffer);
	const LE = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1, IH = LE ? 1 : 0, IL = LE ? 0 : 1;
	const hi = (x) => {
		F[0] = x;
		return U[IH] | 0;
	};
	const lo = (x) => {
		F[0] = x;
		return U[IL];
	};
	const mk = (h, l) => {
		U[IH] = h;
		U[IL] = l;
		return F[0];
	};
	const withHi = (x, h) => {
		F[0] = x;
		U[IH] = h;
		return F[0];
	};
	const zeroLo = (x) => {
		F[0] = x;
		U[IL] = 0;
		return F[0];
	};
	const S1 = -.16666666666666632, S2 = .00833333333332249, S3 = -.0001984126982985795, S4 = 27557313707070068e-22, S5 = -2.5050760253406863e-8, S6 = 158969099521155e-24;
	function kSin(x, y, iy) {
		const ix = hi(x) & 2147483647;
		if (ix < 1044381696 && (x | 0) === 0) return x;
		const z = x * x, v = z * x, r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)));
		if (iy === 0) return x + v * (S1 + z * r);
		return x - (z * (.5 * y - v * r) - y - v * S1);
	}
	const C1 = .0416666666666666, C2 = -.001388888888887411, C3 = 2480158728947673e-20, C4 = -2.7557314351390663e-7, C5 = 2.087572321298175e-9, C6 = -11359647557788195e-27;
	function kCos(x, y) {
		const ix = hi(x) & 2147483647;
		if (ix < 1044381696 && (x | 0) === 0) return 1;
		const z = x * x, r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
		if (ix < 1070805811) return 1 - (.5 * z - (z * r - x * y));
		const qx = ix > 1072234496 ? .28125 : mk(ix - 2097152, 0);
		const hz = .5 * z - qx, a = 1 - qx;
		return a - (hz - (z * r - x * y));
	}
	const NPIO2 = [
		1073291771,
		1074340347,
		1074977148,
		1075388923,
		1075800698,
		1076025724,
		1076231611,
		1076437499,
		1076643386,
		1076849274,
		1076971356,
		1077074300,
		1077177244,
		1077280187,
		1077383131,
		1077486075,
		1077589019,
		1077691962,
		1077794906,
		1077897850,
		1077968460,
		1078019932,
		1078071404,
		1078122876,
		1078174348,
		1078225820,
		1078277292,
		1078328763,
		1078380235,
		1078431707,
		1078483179,
		1078534651
	];
	const INVPIO2 = .6366197723675814, PIO2_1 = 1.5707963267341256, PIO2_1T = 6077100506506192e-26, PIO2_2 = 6077100506303966e-26, PIO2_2T = 20222662487959506e-37, PIO2_3 = 20222662487111665e-37, PIO2_3T = 84784276603689e-45;
	const Y = [0, 0];
	function remPio2(x) {
		const hx = hi(x), ix = hx & 2147483647;
		if (ix < 1073928572) {
			let z;
			if (hx > 0) {
				z = x - PIO2_1;
				if (ix !== 1073291771) {
					Y[0] = z - PIO2_1T;
					Y[1] = z - Y[0] - PIO2_1T;
				} else {
					z -= PIO2_2;
					Y[0] = z - PIO2_2T;
					Y[1] = z - Y[0] - PIO2_2T;
				}
				return 1;
			}
			z = x + PIO2_1;
			if (ix !== 1073291771) {
				Y[0] = z + PIO2_1T;
				Y[1] = z - Y[0] + PIO2_1T;
			} else {
				z += PIO2_2;
				Y[0] = z + PIO2_2T;
				Y[1] = z - Y[0] + PIO2_2T;
			}
			return -1;
		}
		let t = N.abs(x);
		const q = t * INVPIO2 + .5, big = q >= 2147483648, n = big ? N.trunc(q) : q | 0, fn = n;
		let r = t - fn * PIO2_1, w = fn * PIO2_1T;
		if (n < 32 && ix !== NPIO2[n - 1]) Y[0] = r - w;
		else {
			const j = ix >> 20;
			Y[0] = r - w;
			let i = j - (hi(Y[0]) >> 20 & 2047);
			if (i > 16) {
				t = r;
				w = fn * PIO2_2;
				r = t - w;
				w = fn * PIO2_2T - (t - r - w);
				Y[0] = r - w;
				i = j - (hi(Y[0]) >> 20 & 2047);
				if (i > 49) {
					t = r;
					w = fn * PIO2_3;
					r = t - w;
					w = fn * PIO2_3T - (t - r - w);
					Y[0] = r - w;
				}
			}
		}
		Y[1] = r - Y[0] - w;
		const m = big ? n % 4 : n;
		if (hx < 0) {
			Y[0] = -Y[0];
			Y[1] = -Y[1];
			return -m;
		}
		return m;
	}
	DM.sin = function sin(x) {
		x = +x;
		const ix = hi(x) & 2147483647;
		if (ix <= 1072243195) return kSin(x, 0, 0);
		if (ix >= 2146435072) return x - x;
		switch (remPio2(x) & 3) {
			case 0: return kSin(Y[0], Y[1], 1);
			case 1: return kCos(Y[0], Y[1]);
			case 2: return -kSin(Y[0], Y[1], 1);
			default: return -kCos(Y[0], Y[1]);
		}
	};
	DM.cos = function cos(x) {
		x = +x;
		const ix = hi(x) & 2147483647;
		if (ix <= 1072243195) return kCos(x, 0);
		if (ix >= 2146435072) return x - x;
		switch (remPio2(x) & 3) {
			case 0: return kCos(Y[0], Y[1]);
			case 1: return -kSin(Y[0], Y[1], 1);
			case 2: return -kCos(Y[0], Y[1]);
			default: return kSin(Y[0], Y[1], 1);
		}
	};
	DM.tan = function tan(x) {
		x = +x;
		return DM.sin(x) / DM.cos(x);
	};
	const ATHI = [
		.4636476090008061,
		.7853981633974483,
		.982793723247329,
		1.5707963267948966
	];
	const ATLO = [
		22698777452961687e-33,
		3061616997868383e-32,
		13903311031230998e-33,
		6123233995736766e-32
	];
	const AT = [
		.3333333333333293,
		-.19999999999876483,
		.14285714272503466,
		-.11111110405462356,
		.09090887133436507,
		-.0769187620504483,
		.06661073137387531,
		-.058335701337905735,
		.049768779946159324,
		-.036531572744216916,
		.016285820115365782
	];
	DM.atan = function atan(x) {
		x = +x;
		const hx = hi(x), ix = hx & 2147483647;
		let id;
		if (ix >= 1141899264) {
			if (x !== x) return x + x;
			return hx > 0 ? ATHI[3] + ATLO[3] : -ATHI[3] - ATLO[3];
		}
		if (ix < 1071382528) {
			if (ix < 1042284544) return x;
			id = -1;
		} else {
			x = N.abs(x);
			if (ix < 1072889856) {
				if (ix < 1072037888) {
					id = 0;
					x = (2 * x - 1) / (2 + x);
				} else {
					id = 1;
					x = (x - 1) / (x + 1);
				}
			} else if (ix < 1073971200) {
				id = 2;
				x = (x - 1.5) / (1 + 1.5 * x);
			} else {
				id = 3;
				x = -1 / x;
			}
		}
		const z = x * x, w = z * z;
		const s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))));
		const s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))));
		if (id < 0) return x - x * (s1 + s2);
		const r = ATHI[id] - (x * (s1 + s2) - ATLO[id] - x);
		return hx < 0 ? -r : r;
	};
	const PI = 3.141592653589793, PI_LO = 12246467991473532e-32, PI_2 = 1.5707963267948966, PI_4 = .7853981633974483;
	DM.atan2 = function atan2(y, x) {
		y = +y;
		x = +x;
		if (x !== x || y !== y) return x + y;
		const hx = hi(x), ix = hx & 2147483647, lx = lo(x), hy = hi(y), iy = hy & 2147483647, ly = lo(y);
		if (hx === 1072693248 && lx === 0) return DM.atan(y);
		const m = hy >> 31 & 1 | hx >> 30 & 2;
		if ((iy | ly) === 0) {
			if (m < 2) return y;
			return m === 2 ? PI : -PI;
		}
		if ((ix | lx) === 0) return hy < 0 ? -PI_2 : PI_2;
		if (ix === 2146435072) {
			if (iy === 2146435072) return m === 0 ? PI_4 : m === 1 ? -PI_4 : m === 2 ? 3 * PI_4 : -3 * PI_4;
			return m === 0 ? 0 : m === 1 ? -0 : m === 2 ? PI : -PI;
		}
		if (iy === 2146435072) return hy < 0 ? -PI_2 : PI_2;
		const k = iy - ix >> 20;
		let z;
		if (k > 60) z = PI_2 + .5 * PI_LO;
		else if (hx < 0 && k < -60) z = 0;
		else z = DM.atan(N.abs(y / x));
		switch (m) {
			case 0: return z;
			case 1: return -z;
			case 2: return PI - (z - PI_LO);
			default: return z - PI_LO - PI;
		}
	};
	const pS0 = .16666666666666666, pS1 = -.3255658186224009, pS2 = .20121253213486293, pS3 = -.04005553450067941, pS4 = .0007915349942898145, pS5 = 3479331075960212e-20, qS1 = -2.403394911734414, qS2 = 2.0209457602335057, qS3 = -.6882839716054533, qS4 = .07703815055590194;
	const PIO2_HI = 1.5707963267948966, PIO2_LO = 6123233995736766e-32, PIO4_HI = .7853981633974483;
	const aP = (z) => z * (pS0 + z * (pS1 + z * (pS2 + z * (pS3 + z * (pS4 + z * pS5)))));
	const aQ = (z) => 1 + z * (qS1 + z * (qS2 + z * (qS3 + z * qS4)));
	DM.asin = function asin(x) {
		x = +x;
		const hx = hi(x), ix = hx & 2147483647;
		if (ix >= 1072693248) {
			if ((ix - 1072693248 | lo(x)) === 0) return x * PIO2_HI + x * PIO2_LO;
			return NaN;
		}
		if (ix < 1071644672) {
			if (ix < 1044381696) return x;
			const t = x * x;
			return x + x * (aP(t) / aQ(t));
		}
		const t0 = (1 - N.abs(x)) * .5, p = aP(t0), q = aQ(t0), s = N.sqrt(t0);
		let t;
		if (ix >= 1072640819) t = PIO2_HI - (2 * (s + s * (p / q)) - PIO2_LO);
		else {
			const w = zeroLo(s), c = (t0 - w * w) / (s + w), r = p / q;
			t = PIO4_HI - (2 * s * r - (PIO2_LO - 2 * c) - (PIO4_HI - 2 * w));
		}
		return hx > 0 ? t : -t;
	};
	DM.acos = function acos(x) {
		x = +x;
		const hx = hi(x), ix = hx & 2147483647;
		if (ix >= 1072693248) {
			if ((ix - 1072693248 | lo(x)) === 0) return hx > 0 ? 0 : PI + 2 * PIO2_LO;
			return NaN;
		}
		if (ix < 1071644672) {
			if (ix <= 1012924416) return PIO2_HI + PIO2_LO;
			const z = x * x;
			return PIO2_HI - (x - (PIO2_LO - x * (aP(z) / aQ(z))));
		}
		if (hx < 0) {
			const z = (1 + x) * .5, s = N.sqrt(z), w = aP(z) / aQ(z) * s - PIO2_LO;
			return PI - 2 * (s + w);
		}
		const z = (1 - x) * .5, s = N.sqrt(z), df = zeroLo(s), c = (z - df * df) / (s + df), w = aP(z) / aQ(z) * s + c;
		return 2 * (df + w);
	};
	const LN2_HI = .6931471803691238, LN2_LO = 19082149292705877e-26;
	const P1 = .16666666666666602, P2 = -.0027777777777015593, P3 = 6613756321437934e-20, P4 = -16533902205465252e-22, P5 = 4.1381367970572385e-8, TWOM1000 = 9332636185032189e-317;
	DM.exp = function exp(x) {
		x = +x;
		let hx = hi(x);
		const xsb = hx >>> 31 & 1;
		hx &= 2147483647;
		let k = 0, hv = 0, lv = 0;
		if (hx >= 1082535490) {
			if (hx >= 2146435072) {
				if (x !== x) return x + x;
				return xsb === 0 ? x : 0;
			}
			if (x > 709.782712893384) return Infinity;
			if (x < -745.1332191019411) return 0;
		}
		if (hx > 1071001154) {
			if (hx < 1072734898) {
				hv = x - (xsb ? -LN2_HI : LN2_HI);
				lv = xsb ? -LN2_LO : LN2_LO;
				k = 1 - xsb - xsb;
			} else {
				k = 1.4426950408889634 * x + (xsb ? -.5 : .5) | 0;
				hv = x - k * LN2_HI;
				lv = k * LN2_LO;
			}
			x = hv - lv;
		} else if (hx < 1043333120) return 1 + x;
		const t = x * x, c = x - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
		if (k === 0) return 1 - (x * c / (c - 2) - x);
		const y = 1 - (lv - x * c / (2 - c) - hv);
		if (k >= -1021) return withHi(y, hi(y) + (k << 20));
		return withHi(y, hi(y) + (k + 1e3 << 20)) * TWOM1000;
	};
	const Lg1 = .6666666666666735, Lg2 = .3999999999940942, Lg3 = .2857142874366239, Lg4 = .22222198432149784, Lg5 = .1818357216161805, Lg6 = .15313837699209373, Lg7 = .14798198605116586;
	DM.log = function log(x) {
		x = +x;
		let hx = hi(x), k = 0;
		if (hx < 1048576) {
			if ((hx & 2147483647 | lo(x)) === 0) return -Infinity;
			if (hx < 0) return NaN;
			k -= 54;
			x *= 0x40000000000000;
			hx = hi(x);
		}
		if (hx >= 2146435072) return x + x;
		k += (hx >> 20) - 1023;
		hx &= 1048575;
		let i = hx + 614244 & 1048576;
		x = withHi(x, hx | i ^ 1072693248);
		k += i >> 20;
		const f = x - 1, dk = k;
		if ((1048575 & 2 + hx) < 3) {
			if (f === 0) return k === 0 ? 0 : dk * LN2_HI + dk * LN2_LO;
			const R = f * f * (.5 - .3333333333333333 * f);
			return k === 0 ? f - R : dk * LN2_HI - (R - dk * LN2_LO - f);
		}
		const s = f / (2 + f), z = s * s, w = z * z;
		i = hx - 398458;
		const j = 440401 - hx;
		const R = z * (Lg1 + w * (Lg3 + w * (Lg5 + w * Lg7))) + w * (Lg2 + w * (Lg4 + w * Lg6));
		i |= j;
		if (i > 0) {
			const hfsq = .5 * f * f;
			return k === 0 ? f - (hfsq - s * (hfsq + R)) : dk * LN2_HI - (hfsq - (s * (hfsq + R) + dk * LN2_LO) - f);
		}
		return k === 0 ? f - s * (f - R) : dk * LN2_HI - (s * (f - R) - dk * LN2_LO - f);
	};
	const BP = [1, 1.5], DP_H = [0, .5849624872207642], DP_L = [0, 1.350039202129749e-8];
	const L1 = .5999999999999946, L2 = .4285714285785502, L3 = .33333332981837743, L4 = .272728123808534, L5 = .23066074577556175, L6 = .20697501780033842;
	const LG2 = .6931471805599453, LG2_H = .6931471824645996, LG2_L = -1.904654299957768e-9, OVT = 8008566259537294e-32, CP = .9617966939259756, CP_H = .9617967009544373, CP_L = -7.028461650952758e-9, IVLN2 = 1.4426950408889634, IVLN2_H = 1.4426950216293335, IVLN2_L = 1.9259629911266175e-8, HUGE = 1e300, TINY = 1e-300;
	const scalbn = (z, n) => {
		while (n < -1022) {
			z *= 22250738585072014e-324;
			n += 1022;
		}
		return z * mk(n + 1023 << 20, 0);
	};
	DM.pow = function pow(x, y) {
		x = +x;
		y = +y;
		const hx = hi(x), lx = lo(x), hy = hi(y), ly = lo(y), ix0 = hx & 2147483647, iy = hy & 2147483647;
		let ix = ix0;
		if ((iy | ly) === 0) return 1;
		if (ix > 2146435072 || ix === 2146435072 && lx !== 0 || iy > 2146435072 || iy === 2146435072 && ly !== 0) return x + y;
		let yisint = 0, k, j;
		if (hx < 0) {
			if (iy >= 1128267776) yisint = 2;
			else if (iy >= 1072693248) {
				k = (iy >> 20) - 1023;
				if (k > 20) {
					j = ly >>> 52 - k;
					if (j << 52 - k >>> 0 === ly) yisint = 2 - (j & 1);
				} else if (ly === 0) {
					j = iy >> 20 - k;
					if (j << 20 - k === iy) yisint = 2 - (j & 1);
				}
			}
		}
		if (ly === 0) {
			if (iy === 2146435072) {
				if ((ix - 1072693248 | lx) === 0) return y - y;
				if (ix >= 1072693248) return hy >= 0 ? y : 0;
				return hy < 0 ? -y : 0;
			}
			if (iy === 1072693248) return hy < 0 ? 1 / x : x;
			if (hy === 1073741824) return x * x;
			if (hy === 1071644672 && hx >= 0) return N.sqrt(x);
		}
		let ax = N.abs(x);
		if (lx === 0 && (ix === 2146435072 || ix === 0 || ix === 1072693248)) {
			let z = ax;
			if (hy < 0) z = 1 / z;
			if (hx < 0) {
				if ((ix - 1072693248 | yisint) === 0) z = NaN;
				else if (yisint === 1) z = -z;
			}
			return z;
		}
		let n = (hx >> 31) + 1;
		if ((n | yisint) === 0) return NaN;
		let s = 1;
		if ((n | yisint - 1) === 0) s = -1;
		let t1, t2, t, u, v, w;
		if (iy > 1105199104) {
			if (iy > 1139802112) {
				if (ix <= 1072693247) return hy < 0 ? HUGE * HUGE : TINY * TINY;
				if (ix >= 1072693248) return hy > 0 ? HUGE * HUGE : TINY * TINY;
			}
			if (ix < 1072693247) return hy < 0 ? s * HUGE * HUGE : s * TINY * TINY;
			if (ix > 1072693248) return hy > 0 ? s * HUGE * HUGE : s * TINY * TINY;
			t = ax - 1;
			w = t * t * (.5 - t * (.3333333333333333 - t * .25));
			u = IVLN2_H * t;
			v = t * IVLN2_L - w * IVLN2;
			t1 = zeroLo(u + v);
			t2 = v - (t1 - u);
		} else {
			n = 0;
			if (ix < 1048576) {
				ax *= 9007199254740992;
				n -= 53;
				ix = hi(ax);
			}
			n += (ix >> 20) - 1023;
			j = ix & 1048575;
			ix = j | 1072693248;
			if (j <= 235662) k = 0;
			else if (j < 767610) k = 1;
			else {
				k = 0;
				n += 1;
				ix -= 1048576;
			}
			ax = withHi(ax, ix);
			u = ax - BP[k];
			v = 1 / (ax + BP[k]);
			const ss = u * v, sh = zeroLo(ss);
			let th = mk((ix >> 1 | 536870912) + 524288 + (k << 18), 0);
			let tl = ax - (th - BP[k]);
			const sl = v * (u - sh * th - sh * tl);
			let s2 = ss * ss;
			let r = s2 * s2 * (L1 + s2 * (L2 + s2 * (L3 + s2 * (L4 + s2 * (L5 + s2 * L6)))));
			r += sl * (sh + ss);
			s2 = sh * sh;
			th = zeroLo(3 + s2 + r);
			tl = r - (th - 3 - s2);
			u = sh * th;
			v = sl * th + tl * ss;
			const ph = zeroLo(u + v), pl = v - (ph - u);
			const zh = CP_H * ph, zl = CP_L * ph + pl * CP + DP_L[k];
			t = n;
			t1 = zeroLo(zh + zl + DP_H[k] + t);
			t2 = zl - (t1 - t - DP_H[k] - zh);
		}
		const y1 = zeroLo(y);
		const pl = (y - y1) * t1 + y * t2;
		let ph = y1 * t1;
		let z = pl + ph;
		j = hi(z);
		let i = lo(z);
		if (j >= 1083179008) {
			if ((j - 1083179008 | i) !== 0) return s * HUGE * HUGE;
			if (pl + OVT > z - ph) return s * HUGE * HUGE;
		} else if ((j & 2147483647) >= 1083231232) {
			if ((j - 3230714880 | i) !== 0) return s * TINY * TINY;
			if (pl <= z - ph) return s * TINY * TINY;
		}
		i = j & 2147483647;
		k = (i >> 20) - 1023;
		n = 0;
		if (i > 1071644672) {
			n = j + (1048576 >> k + 1) | 0;
			k = ((n & 2147483647) >> 20) - 1023;
			t = mk(n & ~(1048575 >> k), 0);
			n = (n & 1048575 | 1048576) >> 20 - k;
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
		const r = z * t1 / (t1 - 2) - (w + z * w);
		z = 1 - (r - z);
		j = hi(z) + (n << 20) | 0;
		if (j >> 20 <= 0) z = scalbn(z, n);
		else z = withHi(z, j);
		return s * z;
	};
	DM.hypot = function hypot() {
		const n = arguments.length;
		let m = 0, nan = false;
		for (let i = 0; i < n; i++) {
			const v = N.abs(+arguments[i]);
			if (v === Infinity) return Infinity;
			if (v !== v) nan = true;
			else if (v > m) m = v;
		}
		if (nan) return NaN;
		if (m === 0) return 0;
		let s = 0;
		for (let i = 0; i < n; i++) {
			const r = N.abs(+arguments[i]) / m;
			s += r * r;
		}
		return m * N.sqrt(s);
	};
	DM.sinh = function sinh(x) {
		x = +x;
		const e = DM.exp(x);
		return (e - 1 / e) / 2;
	};
	DM.cosh = function cosh(x) {
		x = +x;
		const e = DM.exp(x);
		return (e + 1 / e) / 2;
	};
	DM.tanh = function tanh(x) {
		x = +x;
		if (x > 20) return 1;
		if (x < -20) return -1;
		const e = DM.exp(2 * x);
		return (e - 1) / (e + 1);
	};
	DM.log2 = function log2(x) {
		return DM.log(+x) / N.LN2;
	};
	DM.log10 = function log10(x) {
		return DM.log(+x) / N.LN10;
	};
	DM.cbrt = function cbrt(x) {
		x = +x;
		if (x === 0 || !Number.isFinite(x)) return x;
		const r = DM.exp(DM.log(N.abs(x)) / 3);
		return x < 0 ? -r : r;
	};
	DM.expm1 = function expm1(x) {
		x = +x;
		return N.abs(x) < 1e-5 ? x + x * x / 2 + x * x * x / 6 : DM.exp(x) - 1;
	};
	DM.log1p = function log1p(x) {
		x = +x;
		return N.abs(x) < 1e-5 ? x - x * x / 2 + x * x * x / 3 : DM.log(1 + x);
	};
	ND.DM = DM;
})(window.ND);
(function(ND) {
	"use strict";
	ND.rng = {
		s: 0,
		seed(n) {
			this.s = n | 0;
			return this;
		},
		next() {
			let t = this.s = this.s + 1831565813 | 0;
			t = Math.imul(t ^ t >>> 15, 1 | t);
			t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
			return ((t ^ t >>> 14) >>> 0) / 4294967296;
		},
		range(a, b) {
			return a + this.next() * (b - a);
		}
	};
	ND.rng.seed(Math.random() * 4294967296 >>> 0);
})(window.ND);
(function(ND) {
	"use strict";
	const Math = ND.DM || globalThis.Math;
	const NM = globalThis.Math;
	const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
	ND.profBuiltin = true;
	ND.pm = function(name) {
		const p = ND.prof;
		if (p && p.on) p.m(name);
	};
	const M = ND.M = {
		TAU: Math.PI * 2,
		clamp,
		lerp: (a, b, t) => a + (b - a) * t,
		rand: (a, b) => a + Math.random() * (b - a),
		pick: (arr) => arr[Math.random() * arr.length | 0],
		sign: (v) => v < 0 ? -1 : 1,
		approach: (v, target, rate, dt) => target + (v - target) * Math.exp(-rate * dt),
		ease: {
			linear: (t) => t,
			inQuad: (t) => t * t,
			inCubic: (t) => t * t * t,
			outCubic: (t) => 1 - Math.pow(1 - t, 3),
			outQuart: (t) => 1 - Math.pow(1 - t, 4),
			outBack: (t) => {
				const c = 1.6;
				return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
			},
			inOut: (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
			inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2
		},
		segSeg(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y) {
			const d1x = q1x - p1x, d1y = q1y - p1y, d2x = q2x - p2x, d2y = q2y - p2y;
			const rx = p1x - p2x, ry = p1y - p2y;
			const a = d1x * d1x + d1y * d1y, e = d2x * d2x + d2y * d2y, f = d2x * rx + d2y * ry;
			let s, t;
			if (a <= 1e-9 && e <= 1e-9) {
				s = t = 0;
			} else if (a <= 1e-9) {
				s = 0;
				t = clamp(f / e, 0, 1);
			} else {
				const c = d1x * rx + d1y * ry;
				if (e <= 1e-9) {
					t = 0;
					s = clamp(-c / a, 0, 1);
				} else {
					const b = d1x * d2x + d1y * d2y, den = a * e - b * b;
					s = den !== 0 ? clamp((b * f - c * e) / den, 0, 1) : 0;
					t = (b * s + f) / e;
					if (t < 0) {
						t = 0;
						s = clamp(-c / a, 0, 1);
					} else if (t > 1) {
						t = 1;
						s = clamp((b - c) / a, 0, 1);
					}
				}
			}
			const cx1 = p1x + d1x * s, cy1 = p1y + d1y * s, cx2 = p2x + d2x * t, cy2 = p2y + d2y * t;
			return {
				d: Math.hypot(cx1 - cx2, cy1 - cy2),
				x: (cx1 + cx2) / 2,
				y: (cy1 + cy2) / 2,
				s
			};
		}
	};
	const qs = (() => {
		try {
			return new URLSearchParams(location.search);
		} catch (e) {
			return new URLSearchParams("");
		}
	})();
	ND.qs = qs;
	ND.portalName = (() => {
		const known = (v) => v === "xportalc" || v === "xportalp" || v === "xportalx" || v === "playgama" || v === "local";
		const f = qs.get("portal");
		if (known(f)) return f;
		let b = null;
		try {
			const m = document.querySelector("meta[name=\"nd-portal\"]");
			b = m && m.getAttribute("content");
		} catch (e) {}
		if (known(b)) return b;
		let ref = "";
		try {
			ref = document.referrer ? new URL(document.referrer).hostname : "";
		} catch (e) {}
		const hosts = (location.hostname || "") + " " + ref;
		if (/(?!)/.test(hosts)) return "xportalc";
		if (/(?!)/.test(hosts)) return "xportalp";
		if (/(?!)/.test(hosts)) return "xportalx";
		return "local";
	})();
	let onlineMeta = null;
	try {
		const m = document.querySelector("meta[name=\"nd-online\"]");
		onlineMeta = m && m.getAttribute("content");
	} catch (e) {}
	if (ND.portalName === "playgama" && onlineMeta === "ranked") {
		ND.platform = Object.assign({
			name: "playgama",
			allowNetwork: true,
			onlineScope: "ranked",
			netGate: {
				platforms: [
					"playgama",
					"playgama_sandbox",
					"qa_tool"
				],
				open: /[?&]net=1(&|$)/.test(location.search || "")
			}
		}, ND.platform || {});
	} else if (ND.portalName === "xportalp" || ND.portalName === "xportalx" || ND.portalName === "playgama") ND.platform = Object.assign({
		name: ND.portalName,
		allowNetwork: false
	}, ND.platform || {});
	else if (ND.portalName !== "local") ND.platform = Object.assign({ name: ND.portalName }, ND.platform || {});
	ND.NO_LINK_PORTALS = {
		xportalx: true,
		playgama: true
	};
	ND.linksAllowed = () => !ND.NO_LINK_PORTALS[ND.portalName];
	ND.BLOOD_PORTALS = {
		local: true,
		xportalc: false,
		xportalp: false,
		xportalx: false,
		playgama: false
	};
	ND.bloodAllowed = () => !!ND.BLOOD_PORTALS[ND.portalName];
	ND.isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname || "") || location.protocol === "file:";
	const PD = window.__ndPortalD || (window.__ndPortalD = (() => {
		let r;
		const p = new Promise((x) => r = x);
		return {
			p,
			r
		};
	})());
	const api = () => window.NDPortal || null;
	const adFns = new Set(), muteFns = new Set();
	const want = {
		loaded: false,
		play: false
	};
	let firstPlay = false;
	let loadHidden = document.visibilityState === "hidden";
	document.addEventListener("visibilitychange", () => {
		if (!want.loaded && document.visibilityState === "hidden") loadHidden = true;
	});
	const mark = (n) => {
		try {
			performance.mark(n);
		} catch (e) {}
	};
	const P = ND.portal = {
		name: ND.portalName,
		ready: PD.p,
		inAd: false,
		muted: false,
		get sdk() {
			const a = api();
			return !!(a && a.sdk);
		},
		get loadHidden() {
			return loadHidden;
		},
		loadingFinished() {
			if (!want.loaded) mark("nd-loading-finished");
			want.loaded = true;
			const a = api();
			if (a) a.loadingFinished();
		},
		gameplayStart() {
			if (!firstPlay) {
				firstPlay = true;
				mark("nd-first-gameplay");
			}
			want.play = true;
			const a = api();
			if (a) a.gameplayStart();
		},
		gameplayStop() {
			want.play = false;
			const a = api();
			if (a) a.gameplayStop();
		},
		happyTime() {
			const a = api();
			if (a) a.happyTime();
		},
		interstitial() {
			const a = api();
			return a ? a.interstitial() : Promise.resolve();
		},
		rewarded() {
			const a = api();
			return a ? a.rewarded() : Promise.resolve(true);
		},
		rewardedAvailable() {
			const a = api();
			try {
				return a ? a.rewardedAvailable ? a.rewardedAvailable() !== false : true : true;
			} catch (e) {
				return false;
			}
		},
		lastAdError() {
			const a = api();
			try {
				return a && a.lastAdError ? a.lastAdError() : null;
			} catch (e) {
				return null;
			}
		},
		save(k, v) {
			const a = api();
			return a ? a.save(k, v) : Promise.resolve();
		},
		load(k) {
			const a = api();
			return a ? a.load(k) : Promise.resolve(undefined);
		},
		language() {
			const a = api();
			try {
				return a ? a.language() : (navigator.language || "en").slice(0, 2).toLowerCase();
			} catch (e) {
				return "en";
			}
		},
		requiredLanguage() {
			const a = api();
			try {
				return a && a.requiredLanguage ? a.requiredLanguage() : null;
			} catch (e) {
				return null;
			}
		},
		onAd(fn) {
			adFns.add(fn);
			return () => adFns.delete(fn);
		},
		onMute(fn) {
			muteFns.add(fn);
			if (P.muted) fn(true);
			return () => muteFns.delete(fn);
		},
		track(ev) {
			const a = api();
			if (a && ready) a.track(ev);
			else if (trackQ.length < 30) trackQ.push(ev);
		},
		get boards() {
			const a = api();
			return a && a.boards ? a.boards : null;
		}
	};
	const trackQ = [];
	let ready = false;
	const emit = (set, v) => set.forEach((fn) => {
		try {
			fn(v);
		} catch (e) {
			console.warn("[ND.portal] listener failed", e);
		}
	});
	PD.p.then((a) => {
		if (!a) return;
		ready = true;
		if (a.track) trackQ.splice(0).forEach((ev) => a.track(ev));
		if (want.loaded) a.loadingFinished();
		if (want.play) a.gameplayStart();
		a.onAd((ph) => {
			P.inAd = ph === "start";
			emit(adFns, ph);
		});
		a.onMute((m) => {
			P.muted = m;
			emit(muteFns, m);
		});
	});
	const A = ND.audio = {
		ctx: null,
		enabled: true,
		ready: false,
		portalMuted: false,
		adMuted: false,
		paramMuted: qs.get("mute") === "1",
		away: false,
		audible() {
			return this.enabled && !this.portalMuted && !this.adMuted && !this.paramMuted && !this.away;
		},
		VOL_DEFAULT: {
			master: .8,
			music: .6,
			sfx: .9
		},
		vol: {
			master: .8,
			music: .6,
			sfx: .9
		},
		curve(v) {
			v = clamp(+v || 0, 0, 1);
			return v * v;
		},
		masterLevel() {
			return this.audible() ? .85 * this.curve(this.vol.master) : 0;
		},
		ramp(param, v, tc = .04) {
			if (!param || !this.ctx) return;
			const t = this.ctx.currentTime;
			try {
				if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(t);
				else {
					param.cancelScheduledValues(t);
					param.setValueAtTime(param.value, t);
				}
				param.setTargetAtTime(v, t, tc);
			} catch (e) {
				param.value = v;
			}
		},
		applyGain(tc = .05) {
			if (!this.master || !this.ctx) return;
			this.ramp(this.master.gain, this.masterLevel(), tc);
			this.syncRev();
		},
		syncRev() {
			this.syncRun();
			if (!this.rev || !this.revIn) return;
			const on = this.masterLevel() > 0;
			clearTimeout(this.revTimer);
			if (on === this.revOn) return;
			const apply = () => {
				this.revOn = on;
				try {
					if (on) this.revIn.connect(this.rev);
					else this.revIn.disconnect(this.rev);
				} catch (e) {}
			};
			if (on) apply();
			else this.revTimer = setTimeout(apply, 400);
		},
		playerSilent() {
			return !this.enabled || this.paramMuted || !(this.vol.master > 0);
		},
		syncRun() {
			const c = this.ctx;
			if (!c || c.state === "closed") return;
			clearTimeout(this.runTimer);
			const silent = this.playerSilent();
			if (!silent) {
				if (c.state === "suspended" && this.selfSuspended) {
					this.selfSuspended = false;
					try {
						const p = c.resume();
						if (p && p.catch) p.catch(() => {});
					} catch (e) {}
				}
				return;
			}
			this.runTimer = setTimeout(() => {
				if (!this.playerSilent() || c.state !== "running") return;
				this.selfSuspended = true;
				try {
					const p = c.suspend();
					if (p && p.catch) p.catch(() => {});
				} catch (e) {}
			}, 600);
		},
		setLite(v) {
			v = !!v;
			if (v === !!this.lite) return;
			this.lite = v;
			if (this.rev) this.revMode(v);
		},
		revMode(lite) {
			const r = this.rev;
			try {
				r.channelCount = lite ? 1 : 2;
				r.channelCountMode = lite ? "explicit" : "clamped-max";
			} catch (e) {}
			r.buffer = this.makeIR(lite ? 1.1 : 2.6, lite ? 1 : 2);
		},
		setVolume(kind, v) {
			if (!(kind in this.vol)) return;
			this.vol[kind] = clamp(+v || 0, 0, 1);
			if (kind === "master") this.applyGain(.04);
			else if (kind === "sfx") {
				const g = this.curve(this.vol.sfx);
				this.ramp(this.dry && this.dry.gain, g);
				this.ramp(this.revIn && this.revIn.gain, g);
			} else if (ND.music && ND.music.applyVolume) ND.music.applyVolume();
		},
		previewFx() {
			if (!this.ready) return;
			const q = this.quiet;
			this.quiet = false;
			try {
				this.tick(0);
			} finally {
				this.quiet = q;
			}
		},
		setPortalMute(v) {
			this.portalMuted = !!v;
			this.applyGain();
		},
		suspendForAd() {
			this.adMuted = true;
			this.applyGain(.01);
		},
		resumeAfterAd() {
			this.adMuted = false;
			this.applyGain(.1);
		},
		updateAway() {
			let away = false;
			try {
				away = document.hidden || ND.isLocalHost && !document.hasFocus();
			} catch (e) {}
			if (away !== this.away) {
				this.away = away;
				this.applyGain(away ? .02 : .15);
			}
		},
		init() {
			if (this.ctx) {
				if (this.ctx.state !== "running" && this.ctx.state !== "closed" && !(this.selfSuspended && this.playerSilent())) {
					this.selfSuspended = false;
					try {
						const p = this.ctx.resume();
						if (p && p.catch) p.catch(() => {});
					} catch (e) {}
				}
				return;
			}
			let c;
			const AC = window.AudioContext || window.webkitAudioContext, mob = !!(ND.touch && ND.touch.mobile);
			try {
				c = mob ? new AC({ latencyHint: "balanced" }) : new AC();
			} catch (e) {
				try {
					c = new AC();
				} catch (e2) {
					return;
				}
			}
			this.ctx = c;
			this.updateAway();
			Object.assign(this, this.buildBus(c));
			this.revOn = true;
			const len = c.sampleRate * 2;
			this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
			const d = this.noiseBuf.getChannelData(0);
			for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
			this.ready = true;
			this.syncRev();
			this.ambience();
		},
		buildBus(c) {
			const master = c.createGain();
			master.gain.value = this.masterLevel();
			const glue = c.createDynamicsCompressor();
			glue.threshold.value = -18;
			glue.knee.value = 12;
			glue.ratio.value = 2;
			glue.attack.value = .01;
			glue.release.value = .25;
			const make = c.createGain();
			make.gain.value = 1;
			const lim = c.createDynamicsCompressor();
			lim.threshold.value = -2.5;
			lim.knee.value = 0;
			lim.ratio.value = 20;
			lim.attack.value = .001;
			lim.release.value = .12;
			master.connect(glue);
			glue.connect(make);
			make.connect(lim);
			lim.connect(c.destination);
			const fx = this.curve(this.vol.sfx);
			const dry = c.createGain();
			dry.gain.value = fx;
			dry.connect(master);
			const rev = c.createConvolver();
			const revIn = c.createGain();
			revIn.gain.value = fx;
			revIn.connect(rev);
			const rg = c.createGain();
			rg.gain.value = .32;
			rev.connect(rg);
			rg.connect(master);
			const was = this.rev;
			this.rev = rev;
			this.revMode(this.lite);
			this.rev = was || rev;
			return {
				master,
				dry,
				rev,
				revIn
			};
		},
		duck(db, sec) {
			const M = ND.music;
			if (M && M.duck && !this.quiet) M.duck(db, sec);
		},
		vr(a) {
			return 1 + (Math.random() * 2 - 1) * a;
		},
		gs: 1,
		scaled(k, fn) {
			const g0 = this.gs;
			this.gs = g0 * k;
			try {
				return fn();
			} finally {
				this.gs = g0;
			}
		},
		menu(fn) {
			const q = this.quiet, G = ND.game;
			if (q && G && G.mode === "attract" && !G.simOnly) this.quiet = false;
			try {
				return fn.call(this);
			} finally {
				this.quiet = q;
			}
		},
		setEnabled(v) {
			this.enabled = !!v;
			this.applyGain();
		},
		makeIR(sec, chans = 2) {
			const k = sec + "/" + chans, M = this.irs || (this.irs = {});
			if (M[k]) return M[k];
			const c = this.ctx, len = c.sampleRate * sec | 0, b = M[k] = c.createBuffer(chans, len, c.sampleRate);
			for (let ch = 0; ch < chans; ch++) {
				const data = b.getChannelData(ch);
				for (let i = 0; i < len; i++) data[i] = (NM.random() * 2 - 1) * NM.pow(1 - i / len, 3.4);
			}
			return b;
		},
		out(send, pan) {
			const c = this.ctx, g = c.createGain();
			let head = g;
			if (pan && c.createStereoPanner) {
				const p = c.createStereoPanner();
				p.pan.value = clamp(pan, -1, 1);
				g.connect(p);
				head = p;
			}
			head.connect(this.dry);
			if (send > 0) {
				const s = c.createGain();
				s.gain.value = send;
				head.connect(s);
				s.connect(this.revIn);
			}
			return g;
		},
		oneShot(t, dur, gain) {
			const L = this.ends || (this.ends = []), now = this.ctx.currentTime;
			let n = 0;
			for (let i = 0; i < L.length; i++) if (L[i] > now) L[n++] = L[i];
			L.length = n;
			const cap = this.lite || ND.touch && ND.touch.mobile ? 22 : 40;
			if (n >= cap * 1.5 || n >= cap && gain < .25) return false;
			L.push(t + dur);
			this.nPlayed = (this.nPlayed | 0) + 1;
			return true;
		},
		noise(o) {
			if (!this.ready || this.quiet) return;
			const c = this.ctx, t = c.currentTime + (o.delay || 0);
			if (!this.oneShot(t, o.dur, o.gain ?? .5)) return;
			const src = c.createBufferSource();
			src.buffer = this.noiseBuf;
			src.playbackRate.value = o.rate || 1;
			const f = c.createBiquadFilter();
			f.type = o.type || "bandpass";
			f.Q.value = o.q || 1;
			f.frequency.setValueAtTime(o.f0 || 1e3, t);
			if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
			const g = this.out(o.send ?? .2, o.pan);
			const gain = (o.gain ?? .5) * this.gs, at = o.attack ?? .004;
			g.gain.setValueAtTime(1e-4, t);
			g.gain.exponentialRampToValueAtTime(gain, t + at);
			g.gain.exponentialRampToValueAtTime(1e-4, t + o.dur);
			src.connect(f);
			f.connect(g);
			src.start(t, Math.random() * 1.5);
			src.stop(t + o.dur + .05);
		},
		tone(o) {
			if (!this.ready || this.quiet) return;
			const c = this.ctx, t = c.currentTime + (o.delay || 0);
			if (!this.oneShot(t, o.dur, o.gain ?? .3)) return;
			const osc = c.createOscillator();
			osc.type = o.type || "sine";
			osc.frequency.setValueAtTime(o.freq, t);
			if (o.freq1) osc.frequency.exponentialRampToValueAtTime(o.freq1, t + (o.glide || o.dur));
			const g = this.out(o.send ?? .25, o.pan);
			const gain = (o.gain ?? .3) * this.gs, at = o.attack ?? .003;
			g.gain.setValueAtTime(1e-4, t);
			g.gain.exponentialRampToValueAtTime(gain, t + at);
			g.gain.exponentialRampToValueAtTime(1e-4, t + o.dur);
			osc.connect(g);
			osc.start(t);
			osc.stop(t + o.dur + .05);
		},
		MIX: {
			swing: 1.5,
			clang: 1.5,
			cut: 4.6,
			thud: 3.3,
			step: .8,
			whistle: 4.5,
			tick: 7,
			whoosh: 1.8,
			ui: 1,
			grind: 1.8,
			amb: .8,
			punch: 3,
			smack: 26
		},
		swoosh(power = 1, pan = 0) {
			const k = this.vr(.12), d = (.16 + .12 * power) * this.vr(.1), m = this.MIX.swing * this.vr(.12);
			this.noise({
				type: "bandpass",
				f0: (500 + 300 * power) * k,
				f1: (2600 + 900 * power) * k,
				q: 1.4,
				dur: d,
				gain: (.22 + .2 * power) * m,
				attack: d * .55,
				send: .12,
				pan
			});
			this.noise({
				type: "highpass",
				f0: 3e3 * k,
				dur: d * .8,
				gain: .05 * power * m,
				attack: d * .5,
				send: .05,
				pan
			});
		},
		clang(power = 1, pan = 0, pitch = 1) {
			const base = (560 + Math.random() * 90) * pitch, m = this.MIX.clang * this.vr(.1), pw = Math.pow(power, .75);
			[
				1,
				2.76,
				5.4,
				8.93,
				13.3
			].forEach((r, i) => {
				if (this.lite && i > 2) return;
				this.tone({
					freq: base * r * this.vr(.004),
					type: i ? "sine" : "triangle",
					dur: (1.3 - i * .18) * (.6 + power * .5),
					gain: .2 / (i + 1) * pw * m,
					send: .5,
					pan
				});
			});
			this.noise({
				type: "highpass",
				f0: 2500 * this.vr(.15),
				dur: .06,
				gain: .5 * pw * m,
				send: .3,
				pan
			});
			if (power >= 1.25) this.duck(4, .35);
		},
		parry(pan = 0) {
			this.clang(1.3, pan, 1.45 * this.vr(.03));
			this.tone({
				freq: 2400 * this.vr(.03),
				freq1: 1800,
				dur: 1.6,
				gain: .08,
				send: .7,
				pan
			});
		},
		cut(power = 1, pan = 0) {
			const k = this.vr(.12), m = this.MIX.cut * this.vr(.1);
			this.noise({
				type: "bandpass",
				f0: 5200 * k,
				f1: 2200 * k,
				q: 1.2,
				dur: .05,
				gain: .3 * power * m,
				attack: .002,
				send: .12,
				pan
			});
			this.noise({
				type: "highpass",
				f0: 1800 * k,
				f1: 700,
				dur: .12 * this.vr(.15),
				gain: .35 * power * m,
				send: .1,
				pan
			});
			this.tone({
				freq: 140 * this.vr(.1),
				freq1: 45,
				dur: .22,
				gain: .55 * power * m,
				send: .08,
				pan
			});
			this.noise({
				type: "lowpass",
				f0: 900 * k,
				dur: .18,
				gain: .3 * power * m,
				send: .05,
				pan,
				delay: .01
			});
			if (power >= 1.3) this.duck(3, .3);
		},
		thud(power = 1, pan = 0) {
			const m = this.MIX.thud * this.vr(.1);
			this.tone({
				freq: 110 * this.vr(.1),
				freq1: 38,
				dur: .28,
				gain: .6 * power * m,
				send: .1,
				pan
			});
			this.noise({
				type: "lowpass",
				f0: 500 * this.vr(.2),
				dur: .14,
				gain: .35 * power * m,
				send: .05,
				pan
			});
		},
		punch(raw = 8, pan = 0, heavy = false) {
			if (this.punchLog && !this.quiet) this.punchLog.push({
				k: heavy ? "punch-heavy" : "punch",
				t: ND.simClock || 0
			});
			if (!this.ready || this.quiet) return;
			const m = this.MIX.punch, p = clamp(.8 + raw / 30, .85, 1.45) * (heavy ? 1.35 : 1), k = this.vr(.08) * (heavy ? .86 : 1);
			const dt = .002 + Math.random() * .004;
			this.noise({
				type: "bandpass",
				f0: 2600 * k,
				q: .8,
				dur: .02,
				gain: .85 * p * m,
				attack: 5e-4,
				send: .04,
				pan
			});
			this.noise({
				type: "bandpass",
				f0: 950 * k,
				q: 1.1,
				dur: .06,
				gain: 1.1 * p * m,
				attack: 8e-4,
				send: .06,
				pan
			});
			this.tone({
				freq: 170 * k,
				freq1: 72 * k,
				glide: .06,
				dur: heavy ? .17 : .11,
				gain: .75 * p * m,
				attack: .0015,
				send: .05,
				pan,
				delay: dt
			});
			const V = ND.voice, body = V && V.buffer ? V.buffer("bo-b", Math.random() < .5 ? "body1" : "body2") : null;
			if (body) this.sample(body, {
				gain: .55 * p * m * this.vr(.1),
				rate: this.vr(.07) * (heavy ? .9 : 1),
				pan,
				send: .06,
				delay: dt * .5
			});
			if (heavy) {
				this.noise({
					type: "lowpass",
					f0: 170,
					dur: .2,
					gain: .7 * p * m,
					attack: .004,
					send: .08,
					pan,
					delay: dt
				});
				this.duck(3, .25);
			}
		},
		smack(p = 1, pan = 0, parry = false) {
			if (this.punchLog && !this.quiet) this.punchLog.push({
				k: parry ? "smack-parry" : "smack",
				t: ND.simClock || 0
			});
			if (!this.ready || this.quiet) return;
			const m = this.MIX.smack, k = this.vr(.1);
			this.noise({
				type: "highpass",
				f0: (parry ? 3400 : 2600) * k,
				dur: .012,
				gain: .035 * p * m,
				attack: 5e-4,
				send: .1,
				pan
			});
			this.noise({
				type: "bandpass",
				f0: (parry ? 2e3 : 1500) * k,
				q: 1.6,
				dur: parry ? .04 : .055,
				gain: 1 * p * m,
				attack: 8e-4,
				send: .12,
				pan
			});
			this.noise({
				type: "bandpass",
				f0: 620 * k,
				q: 1.2,
				dur: .03,
				gain: .3 * p * m,
				attack: .001,
				send: .05,
				pan
			});
		},
		step(pan = 0, g = 1) {
			if (g <= 1.2) return;
			const m = this.MIX.step * this.vr(.25), w = Math.pow(g, .7), k = this.vr(.15);
			this.noise({
				type: "lowpass",
				f0: (240 + Math.random() * 160) * k,
				q: .7,
				dur: .11 + .03 * w,
				gain: .3 * w * m,
				attack: .02,
				send: .02,
				pan
			});
			this.noise({
				type: "lowpass",
				f0: 140 * k,
				q: .7,
				dur: .14,
				gain: .35 * w * m,
				attack: .01,
				send: .02,
				pan
			});
		},
		whistle(pan = 0) {
			const k = this.vr(.06), m = this.MIX.whistle;
			this.tone({
				freq: 2600 * k,
				freq1: 1500 * k,
				dur: .35,
				gain: .05 * m,
				send: .2,
				pan,
				type: "sine"
			});
			this.noise({
				type: "bandpass",
				f0: 3500 * k,
				f1: 2e3 * k,
				q: 6,
				dur: .3,
				gain: .12 * m,
				send: .15,
				pan
			});
		},
		tick(pan = 0) {
			const k = this.vr(.05), m = this.MIX.tick;
			this.tone({
				freq: 3200 * k,
				freq1: 2400 * k,
				dur: .12,
				gain: .08 * m,
				send: .3,
				pan,
				type: "triangle"
			});
			this.noise({
				type: "highpass",
				f0: 4e3,
				dur: .04,
				gain: .2 * m,
				send: .2,
				pan
			});
		},
		gong() {
			const k = this.vr(.015);
			[
				1,
				1.49,
				2.03,
				2.74,
				3.4
			].forEach((r, i) => this.tone({
				freq: 92 * r * k,
				dur: 3.5 - i * .4,
				gain: .26 / (i + 1),
				attack: .01,
				send: .6
			}));
			this.noise({
				type: "lowpass",
				f0: 300,
				dur: .3,
				gain: .25,
				send: .4
			});
		},
		taiko(power = 1, delay = 0) {
			const k = this.vr(.06);
			this.tone({
				freq: 150 * k,
				freq1: 52 * k,
				glide: .25,
				dur: .6,
				gain: .8 * power * this.vr(.06),
				send: .35,
				delay
			});
			this.noise({
				type: "lowpass",
				f0: 700 * k,
				dur: .12,
				gain: .35 * power,
				send: .3,
				delay
			});
		},
		ko() {
			this.taiko(1.2);
			this.taiko(1, .32);
			this.tone({
				freq: 55,
				dur: 2.5,
				gain: .4,
				send: .7,
				delay: .05
			});
			this.tone({
				freq: 880,
				freq1: 660,
				dur: 2.8,
				gain: .05,
				send: .9,
				delay: .1
			});
			this.duck(8, 1.4);
		},
		uiOn() {
			return !(ND.settings && ND.settings.uiSfx === false);
		},
		ui() {
			if (!this.uiOn()) return;
			if (this._pressGate && this._press !== "confirm" && this._press !== "back") return;
			this.menu(() => {
				const k = this.vr(.04), m = this.MIX.ui;
				this.tone({
					freq: 520 * k,
					freq1: 430 * k,
					dur: .055,
					gain: .16 * m,
					attack: .006,
					send: .1,
					type: "triangle"
				});
				this.noise({
					type: "lowpass",
					f0: 1300 * k,
					dur: .02,
					gain: .35 * m,
					attack: .004,
					send: .08
				});
			});
		},
		grind(pan = 0) {
			const m = this.MIX.grind, t = this.ctx ? this.ctx.currentTime : 0;
			if (!(t - (this._grT || -9) < .25)) this._grN = 0;
			this._grT = t;
			this._grN = (this._grN || 0) + 1;
			const fade = Math.min(1, this._grN / 7), f = 185 * (1 + .006 * Math.sin(this._grN * .9)), g = .1 * fade * m;
			this.tone({
				freq: f,
				dur: .2,
				gain: g,
				attack: .07,
				send: .35,
				pan
			});
			this.tone({
				freq: f * 2.76,
				dur: .16,
				gain: g * .3,
				attack: .07,
				send: .4,
				pan
			});
			if (Math.random() < .35) this.noise({
				type: "bandpass",
				f0: 1700 + Math.random() * 900,
				q: 7,
				dur: .07,
				gain: .05 * fade * m,
				attack: .02,
				send: .3,
				pan
			});
		},
		sample(buf, o) {
			if (!this.ready || this.quiet || !buf) return false;
			const c = this.ctx, t = c.currentTime + (o.delay || 0), rate = o.rate || 1, gain = (o.gain ?? .5) * this.gs;
			if (!this.oneShot(t, buf.duration / rate, gain)) return false;
			const src = c.createBufferSource();
			src.buffer = buf;
			src.playbackRate.value = rate;
			const g = this.out(o.send ?? .15, o.pan);
			g.gain.value = gain;
			src.connect(g);
			src.start(t);
			src.onended = () => {
				try {
					g.disconnect();
				} catch (e) {}
			};
			return true;
		},
		ambience() {
			const c = this.ctx;
			const layer = (type, freq, q, level, lfoRate, lfoDepth, fRate, fDepth, buf) => {
				const src = c.createBufferSource();
				src.buffer = buf || this.noiseBuf;
				src.loop = true;
				src.playbackRate.value = .9 + Math.random() * .2;
				const f = c.createBiquadFilter();
				f.type = type;
				f.frequency.value = freq;
				f.Q.value = q;
				const g = c.createGain();
				g.gain.value = 0;
				const bus = c.createGain();
				bus.gain.value = 1;
				const run = [src];
				if (lfoRate) {
					const l = c.createOscillator();
					l.frequency.value = lfoRate;
					const lg = c.createGain();
					lg.gain.value = lfoDepth;
					l.connect(lg);
					lg.connect(bus.gain);
					l.start();
					run.push(l);
				}
				if (fRate) {
					const l = c.createOscillator();
					l.frequency.value = fRate;
					const lg = c.createGain();
					lg.gain.value = fDepth;
					l.connect(lg);
					lg.connect(f.frequency);
					l.start();
					run.push(l);
				}
				src.connect(f);
				f.connect(bus);
				bus.connect(g);
				g.connect(this.dry);
				src.start(0, Math.random() * 1.5);
				g._level = level * this.MIX.amb;
				g._run = run;
				return g;
			};
			const crackle = () => {
				if (this.crackBuf) return this.crackBuf;
				const len = c.sampleRate * 3, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
				for (let n = 0; n < 55; n++) {
					const at = Math.random() * (len - 4e3) | 0, l = 40 + Math.random() * (Math.random() < .15 ? 2500 : 500) | 0, a = .25 + Math.random() * .75;
					for (let i = 0; i < l; i++) d[at + i] += (NM.random() * 2 - 1) * a * NM.exp(-4 * i / l);
				}
				return this.crackBuf = b;
			};
			const crickets = () => {
				if (this.cricketBuf) return this.cricketBuf;
				const sr = c.sampleRate, len = sr * 6, b = c.createBuffer(1, len, sr), d = b.getChannelData(0);
				[[4400, .9], [3900, 1.7]].forEach(([f, gap]) => {
					for (let at = Math.random() * gap; at < 5.6; at += gap * (.7 + Math.random() * .6)) {
						const n = 3 + (Math.random() * 3 | 0), a = .4 + Math.random() * .5;
						for (let p = 0; p < n; p++) {
							const s0 = (at + p * .045) * sr | 0, l = .028 * sr | 0;
							for (let i = 0; i < l && s0 + i < len; i++) d[s0 + i] += NM.sin(2 * Math.PI * f * i / sr) * a * NM.sin(Math.PI * i / l);
						}
					}
				});
				return this.cricketBuf = b;
			};
			this.ambDefs = {
				wind: () => [layer("lowpass", 380, .7, .06, .09, .6, .05, 180), layer("bandpass", 4200, 2, .032, .05, .5, 0, 0, crickets())],
				rain: () => [
					layer("bandpass", 2600, .5, .022, .3, .15, 0, 0),
					layer("lowpass", 240, .6, .02, .07, .4, 0, 0),
					layer("highpass", 6e3, .4, .007, 0, 0, 0, 0)
				],
				blizzard: () => [layer("lowpass", 650, .8, .08, .13, .7, .07, 300), layer("bandpass", 1300, 4, .025, .21, .8, .11, 500)],
				fire: () => [
					layer("highpass", 900, .7, .13, 0, 0, 0, 0, crackle()),
					layer("lowpass", 150, .8, .09, .19, .5, 0, 0),
					layer("bandpass", 420, .8, .022, .37, .7, .13, 160)
				],
				water: () => [
					layer("lowpass", 1200, .5, .036, .05, .1, 0, 0),
					layer("bandpass", 420, .7, .028, .11, .2, .07, 90),
					layer("highpass", 3800, .5, .011, .23, .25, 0, 0)
				],
				market: () => [
					layer("bandpass", 480, 1.6, .045, 3.1, .55, .7, 140),
					layer("bandpass", 950, 2.4, .022, 4.3, .6, 1.1, 250),
					layer("lowpass", 200, .6, .035, .09, .3, 0, 0),
					layer("highpass", 1800, .7, .05, 0, 0, 0, 0, crackle()),
					layer("highpass", 6e3, .5, .01, .3, .8, 0, 0)
				],
				gale: () => [
					layer("lowpass", 520, .8, .1, .11, .8, .06, 320),
					layer("bandpass", 820, 7, .04, .17, .9, .09, 380),
					layer("bandpass", 1650, 9, .014, .23, .9, .13, 650)
				]
			};
			this.amb = {};
			this.setAmbience(this.ambKind || "wind");
		},
		setAmbience(kind) {
			this.ambKind = kind;
			if (!this.amb) return;
			if (kind && !this.amb[kind] && this.ambDefs[kind]) this.amb[kind] = this.ambDefs[kind]();
			const t = this.ctx.currentTime;
			for (const k in this.amb) for (const g of this.amb[k]) g.gain.setTargetAtTime(k === kind ? g._level : 0, t, .9);
			clearTimeout(this.ambTimer);
			this.ambTimer = setTimeout(() => {
				for (const k in this.amb) {
					if (k === this.ambKind) continue;
					for (const g of this.amb[k]) {
						for (const n of g._run || []) {
							try {
								n.stop();
							} catch (e) {}
						}
						try {
							g.disconnect();
						} catch (e) {}
					}
					delete this.amb[k];
				}
			}, 5e3);
		},
		thunder(delay = .5) {
			this.noise({
				type: "lowpass",
				f0: 220 * this.vr(.1),
				f1: 60,
				dur: 3.4 * this.vr(.15),
				gain: .54,
				attack: .08,
				send: .6,
				delay
			});
			this.noise({
				type: "lowpass",
				f0: 1200 * this.vr(.15),
				f1: 300,
				dur: .5,
				gain: .24,
				attack: .01,
				send: .4,
				delay
			});
			this.tone({
				freq: 48 * this.vr(.08),
				freq1: 30,
				dur: 2.6,
				gain: .3,
				attack: .1,
				send: .4,
				delay: delay + .05
			});
		},
		whoosh(power = 1) {
			const k = this.vr(.1);
			this.noise({
				type: "bandpass",
				f0: 300 * k,
				f1: 3e3 * k,
				q: .8,
				dur: .5,
				gain: .3 * power * this.MIX.whoosh,
				attack: .35,
				send: .4
			});
			if (power >= 1.2) this.duck(4, .6);
		}
	};
	const BO_DEFAULT = "b";
	const BO_FILES = { "bo-b": {
		crack: [
			"crack1",
			"crack2",
			"crack3"
		],
		body: ["body1", "body2"]
	} };
	const BO_MIX = { "bo-b": {
		crack: 1.75,
		body: .87
	} };
	const rnd = (a, b) => a + Math.random() * (b - a);
	const BO = A.bo = {
		FILES: BO_FILES,
		mode: (() => {
			const m = (qs.get("bohit") || "").toLowerCase();
			return [
				"a",
				"b",
				"old"
			].includes(m) ? m : BO_DEFAULT;
		})(),
		last: {},
		set() {
			return this.mode === "b" ? "bo-b" : null;
		},
		pick(kind) {
			const set = this.set(), V = ND.voice, L = set && BO_FILES[set][kind];
			if (!L || !V || !V.buffer) return null;
			let i = Math.random() * L.length | 0;
			if (L.length > 1 && i === this.last[set + kind]) i = (i + 1) % L.length;
			this.last[set + kind] = i;
			return V.buffer(set, L[i]) || V.buffer(set, L[0]);
		},
		hit(raw, pan, heavy) {
			if (this.mode === "old") {
				A.thud(.8 + raw / 22, pan);
				A.tone({
					freq: 150 + raw * 2,
					freq1: 60,
					dur: .18,
					gain: .12 + raw * .006,
					send: .2,
					pan
				});
				return;
			}
			const p = clamp(.72 + raw / 32, .75, 1.6) * (heavy ? 1.1 : 1);
			const crack = this.pick("crack"), body = crack && this.pick("body");
			if (crack && body) {
				const dt = rnd(.002, .009), M = BO_MIX[this.set()];
				A.sample(crack, {
					gain: M.crack * p * rnd(.85, 1.1),
					rate: rnd(.93, 1.08) * (heavy ? .95 : 1),
					pan,
					send: .14
				});
				A.sample(body, {
					gain: M.body * p * rnd(.85, 1.05),
					rate: rnd(.9, 1.06) * (heavy ? .92 : 1),
					pan,
					send: .08,
					delay: dt
				});
				if (heavy && !A.lite) A.noise({
					type: "lowpass",
					f0: 180,
					dur: .16,
					gain: .45 * p,
					attack: .006,
					send: .1,
					pan,
					delay: dt
				});
				return;
			}
			this.synthHit(p, pan, heavy);
		},
		synthHit(p, pan, heavy) {
			const k = rnd(.92, 1.09), dt = rnd(.002, .008), lite = A.lite;
			A.noise({
				type: "highpass",
				f0: 2600 * k,
				dur: .014,
				gain: 1.2 * p,
				attack: 6e-4,
				send: .08,
				pan
			});
			A.noise({
				type: "bandpass",
				f0: 1150 * k,
				q: 5,
				dur: rnd(.05, .07),
				gain: 8 * p,
				attack: 8e-4,
				send: .12,
				pan
			});
			if (!lite) A.noise({
				type: "bandpass",
				f0: 2350 * k * rnd(.97, 1.03),
				q: 6,
				dur: rnd(.03, .045),
				gain: 6 * p,
				attack: 8e-4,
				send: .1,
				pan
			});
			A.tone({
				freq: 640 * k,
				dur: .045,
				gain: .4 * p,
				type: "sine",
				attack: 8e-4,
				send: .1,
				pan
			});
			A.tone({
				freq: 118 * k,
				freq1: 62,
				glide: .05,
				dur: heavy ? .16 : .11,
				gain: .75 * p,
				attack: .002,
				send: .06,
				pan,
				delay: dt
			});
			A.noise({
				type: "lowpass",
				f0: 1500,
				f1: 420,
				dur: .075,
				gain: 1 * p,
				attack: .002,
				send: .06,
				pan,
				delay: dt
			});
			if (heavy && !lite) A.noise({
				type: "lowpass",
				f0: 180,
				dur: .16,
				gain: .45 * p,
				attack: .006,
				send: .1,
				pan,
				delay: dt
			});
		},
		block(p, pan, steel, pitch = 1) {
			if (this.mode === "old") return false;
			const crack = this.pick("crack");
			if (crack) A.sample(crack, {
				gain: BO_MIX[this.set()].crack * p * rnd(.9, 1.1),
				rate: rnd(1.02, 1.12) * pitch,
				pan,
				send: .2
			});
			else {
				const k = rnd(.94, 1.07) * pitch;
				A.noise({
					type: "highpass",
					f0: 3e3 * k,
					dur: .012,
					gain: .9 * p,
					attack: 6e-4,
					send: .12,
					pan
				});
				A.noise({
					type: "bandpass",
					f0: 1350 * k,
					q: 5,
					dur: rnd(.06, .08),
					gain: 7 * p,
					attack: 8e-4,
					send: .2,
					pan
				});
				if (!A.lite) A.noise({
					type: "bandpass",
					f0: 2700 * k,
					q: 6,
					dur: .04,
					gain: 4.5 * p,
					attack: 8e-4,
					send: .15,
					pan
				});
				A.tone({
					freq: 760 * k,
					dur: .05,
					gain: .3 * p,
					attack: 8e-4,
					send: .15,
					pan
				});
			}
			if (steel) A.clang(.22 * p, pan, 1.5 * pitch);
			return true;
		},
		swing(pan, p = 1) {
			if (this.mode === "old") return false;
			const k = rnd(.88, 1.12), d = (.2 + .07 * p) * rnd(.92, 1.08);
			p *= 2.7;
			A.noise({
				type: "bandpass",
				f0: 230 * k,
				f1: 1050 * k,
				q: 1.1,
				dur: d,
				gain: .3 * p * rnd(.85, 1.1),
				attack: d * .5,
				send: .18,
				pan
			});
			A.noise({
				type: "lowpass",
				f0: 480 * k,
				f1: 260,
				dur: d * .9,
				gain: .16 * p,
				attack: d * .55,
				send: .12,
				pan
			});
			if (!A.lite) A.noise({
				type: "highpass",
				f0: 2800 * k,
				dur: d * .7,
				gain: .03 * p,
				attack: d * .45,
				send: .1,
				pan
			});
			return true;
		}
	};
	const away = () => A.updateAway();
	document.addEventListener("visibilitychange", away);
	window.addEventListener("focus", away);
	window.addEventListener("blur", away);
	window.addEventListener("pageshow", away);
	P.onMute((m) => A.setPortalMute(m));
	P.onAd((ph) => ph === "start" ? A.suspendForAd() : A.resumeAfterAd());
})(window.ND);
