(function(ND) {
	"use strict";
	const G = ND.game;
	if (!G) return;
	const hasOwn = Object.prototype.hasOwnProperty;
	const GAME_KEYS = [
		"mode",
		"matchLevel",
		"winsNeed",
		"phase",
		"pt",
		"round",
		"wins",
		"timer",
		"clock",
		"projs",
		"lock",
		"rally",
		"hitstopT",
		"slow",
		"slowT",
		"slowV",
		"cineT",
		"cineX",
		"cineZ",
		"dim",
		"focus",
		"flags",
		"doubleKO",
		"winner",
		"loser",
		"stats",
		"recording",
		"recOdd",
		"recN",
		"recShift",
		"koIndex",
		"replay",
		"tz"
	];
	const DIP_KEYS = ["dipT", "dipV"];
	const dipOn = () => {
		const v = G.hsVariant ? G.hsVariant() : null;
		return v === "b" || v === "d";
	};
	const SKIP = {
		_bake: 1,
		_dopt: 1,
		_litFn: 1,
		_trailFn: 1,
		_bb: 1,
		_ropes: 1,
		_ropesCol: 1,
		_ropesTails: 1,
		_ropesSash: 1,
		_pd: 1,
		comboTxt: 1,
		tails: 1,
		sash: 1,
		trail: 1,
		ghosts: 1,
		_anim: 1
	};
	const NOHASH = {
		decals: 1,
		lastSrc: 1,
		srcs: 1,
		edges: 1,
		onPress: 1
	};
	const ST = Symbol("static");
	const STATIC = {
		has: (o) => o[ST] === true,
		add: (o) => {
			try {
				Object.defineProperty(o, ST, { value: true });
			} catch (e) {}
		}
	};
	const host = (o) => typeof o.nodeType === "number" || typeof o.getContext === "function" || typeof o.addColorStop === "function" || typeof o.connect === "function";
	function reg(o) {
		if (o === null || typeof o !== "object" || STATIC.has(o) || host(o)) return;
		STATIC.add(o);
		for (const k of Object.keys(o)) reg(o[k]);
	}
	let atkN = -1;
	function statics() {
		const n = ND.ATK ? Object.keys(ND.ATK).length : 0;
		if (n !== atkN) {
			atkN = n;
			for (const t of [
				ND.POSES,
				ND.ATK,
				ND.CHARS,
				ND.AI_LEVELS,
				ND.DEFL,
				ND.KAESHI,
				ND.SPECIALS,
				ND.KITS,
				ND.COMBO,
				ND.LEN,
				ND.cine && ND.cine.TY
			]) reg(t);
			for (const k of Object.keys(ND.ATK || {})) reg(ND.ATK[k]);
		}
		for (const f of G.F) {
			reg(f.ch);
			reg(f.col);
			reg(f.wpn);
			if (f.P !== ND.POSES) reg(f.P);
		}
	}
	function copy(v, memo) {
		if (v === null || typeof v !== "object") return v;
		let c = memo.get(v);
		if (c !== undefined) return c;
		if (STATIC.has(v)) return v;
		if (Array.isArray(v)) {
			c = [];
			memo.set(v, c);
			for (let i = 0; i < v.length; i++) c.push(copy(v[i], memo));
			return c;
		}
		const proto = Object.getPrototypeOf(v);
		if (proto === Object.prototype) c = {};
		else {
			if (ArrayBuffer.isView(v)) {
				c = v.slice();
				memo.set(v, c);
				return c;
			}
			if (v instanceof Set) {
				c = new Set();
				memo.set(v, c);
				for (const x of v) c.add(copy(x, memo));
				return c;
			}
			if (v instanceof Map) {
				c = new Map();
				memo.set(v, c);
				for (const [k, x] of v) c.set(copy(k, memo), copy(x, memo));
				return c;
			}
			if (host(v)) return v;
			c = Object.create(proto);
		}
		memo.set(v, c);
		for (const k in v) if (hasOwn.call(v, k)) c[k] = copy(v[k], memo);
		return c;
	}
	function roots() {
		const F = G.F, R = [
			F[0],
			F[1],
			F[0].ctrl,
			F[1].ctrl
		];
		for (const a of G.ais) R.push(a);
		return R;
	}
	const rootMemo = (R) => {
		const m = new Map();
		for (const o of R) m.set(o, o);
		return m;
	};
	function saveObj(o, memo) {
		const s = {};
		for (const k in o) if (hasOwn.call(o, k) && !SKIP[k] && o[k] !== undefined) s[k] = copy(o[k], memo);
		return s;
	}
	function loadObj(o, s, memo) {
		for (const k of Object.keys(o)) if (!SKIP[k] && !hasOwn.call(s, k) && o[k] !== undefined) o[k] = undefined;
		for (const k in s) o[k] = copy(s[k], memo);
	}
	G.saveState = function() {
		statics();
		const R = roots(), memo = rootMemo(R), g = {};
		for (const k of GAME_KEYS) g[k] = copy(G[k], memo);
		for (const k of DIP_KEYS) g[k] = G[k];
		return {
			v: 1,
			nAi: G.ais.length,
			objs: R.map((o) => saveObj(o, memo)),
			g,
			simClock: ND.simClock,
			rng: ND.rng.s,
			sceneT: ND.scene.t,
			wind: ND.scene.wind,
			props: ND.props && ND.props.live ? ND.props.save() : null
		};
	};
	G.loadState = function(S) {
		if (!S || S.v !== 1 || S.nAi !== G.ais.length) throw new Error("loadState: not a state of this fight");
		const R = roots(), memo = rootMemo(R);
		R.forEach((o, i) => loadObj(o, S.objs[i], memo));
		for (const k of GAME_KEYS) G[k] = copy(S.g[k], memo);
		for (const k of DIP_KEYS) G[k] = S.g[k];
		ND.simClock = S.simClock;
		ND.rng.s = S.rng;
		ND.scene.t = S.sceneT;
		ND.scene.wind = S.wind;
		if (S.props && ND.props) ND.props.load(S.props);
	};
	const F64 = new Float64Array(1), U32 = new Uint32Array(F64.buffer);
	function hasher(pre) {
		const H = new Int32Array(2);
		H[0] = 2166136261;
		H[1] = 2654435769;
		const w = (x) => {
			H[0] = Math.imul(H[0] ^ (x | 0), 16777619);
			H[1] = Math.imul(H[1] ^ (x | 0), 2246822519) ^ H[1] >>> 15;
		};
		const seen = new Map();
		if (pre) for (const o of pre) seen.set(o, -1 - seen.size);
		const val = (v) => {
			switch (typeof v) {
				case "number":
					if (v !== v) {
						w(5136718);
						return;
					}
					F64[0] = v;
					w(1);
					w(U32[0]);
					w(U32[1]);
					return;
				case "string":
					w(2);
					w(v.length);
					for (let i = 0; i < v.length; i++) w(v.charCodeAt(i));
					return;
				case "boolean":
					w(v ? 3 : 4);
					return;
				case "undefined":
					w(5);
					return;
				case "function":
					w(6);
					return;
				default:
			}
			if (v === null) {
				w(7);
				return;
			}
			if (STATIC.has(v)) {
				w(15);
				return;
			}
			const id = seen.get(v);
			if (id !== undefined) {
				w(8);
				w(id);
				return;
			}
			seen.set(v, seen.size);
			if (host(v)) {
				w(9);
				return;
			}
			if (v instanceof ND.Ctrl) {
				ctrl(v);
				return;
			}
			if (Array.isArray(v) || ArrayBuffer.isView(v)) {
				w(10);
				w(v.length);
				for (let i = 0; i < v.length; i++) val(v[i]);
				return;
			}
			if (v instanceof Set) {
				w(11);
				w(v.size);
				for (const x of v) val(x);
				return;
			}
			if (v instanceof Map) {
				w(12);
				w(v.size);
				for (const [k, x] of v) {
					val(k);
					val(x);
				}
				return;
			}
			w(13);
			const keys = Object.keys(v);
			let n = 0;
			for (let i = 0; i < keys.length; i++) {
				const k = keys[i];
				if (!SKIP[k] && !NOHASH[k] && v[k] !== undefined) keys[n++] = k;
			}
			keys.length = n;
			keys.sort();
			w(n);
			for (let i = 0; i < n; i++) {
				val(keys[i]);
				val(v[keys[i]]);
			}
		};
		const ctrl = (c) => {
			w(14);
			let m = 0;
			for (let i = 0; i < ND.Ctrl.ACTS.length; i++) if (c.held(ND.Ctrl.ACTS[i])) m |= 1 << i;
			w(m);
			val(c.buf);
			val(c.lastTap);
			val(c.tapDir);
			val(!!c.noTap);
			val(c.mask || null);
		};
		return {
			val,
			hex: () => (H[0] >>> 0).toString(16).padStart(8, "0") + (H[1] >>> 0).toString(16).padStart(8, "0")
		};
	}
	G.hashParts = function() {
		const out = {}, R = roots();
		const part = (name, fn) => {
			const h = hasher(R);
			fn(h.val);
			out[name] = h.hex();
		};
		const inner = (o) => (v) => {
			for (const k of Object.keys(o).filter((k) => !SKIP[k] && !NOHASH[k] && o[k] !== undefined).sort()) {
				v(k);
				v(o[k]);
			}
		};
		part("f1", inner(R[0]));
		part("f2", inner(R[1]));
		part("ctrl", (v) => {
			for (const c of [R[2], R[3]]) {
				const h = hasher();
				h.val(c);
				v(h.hex());
			}
		});
		part("ai", (v) => {
			for (let i = 4; i < R.length; i++) inner(R[i])(v);
		});
		part("game", (v) => {
			for (const k of GAME_KEYS) {
				v(k);
				v(G[k]);
			}
			if (dipOn()) for (const k of DIP_KEYS) {
				v(k);
				v(G[k]);
			}
		});
		part("clock", (v) => {
			v(ND.simClock);
			v(ND.rng.s);
			v(ND.scene.t);
			v(ND.scene.wind);
		});
		return out;
	};
	const newMatch = G.newMatch;
	G.newMatch = function() {
		const r = newMatch.apply(this, arguments);
		statics();
		return r;
	};
	G.hashState = function() {
		const h = hasher(), R = roots();
		for (const o of R) h.val(o);
		for (const k of GAME_KEYS) {
			h.val(k);
			h.val(G[k]);
		}
		if (dipOn()) for (const k of DIP_KEYS) {
			h.val(k);
			h.val(G[k]);
		}
		h.val(ND.simClock);
		h.val(ND.rng.s);
		h.val(ND.scene.t);
		h.val(ND.scene.wind);
		if (ND.props && ND.props.live) h.val(ND.props.hash());
		return h.hex();
	};
	G.resim = function(n, before, after) {
		const fx = ND.fx, S = ND.specialFx, C = ND.cine, cam = ND.cam, au = ND.audio;
		const keep = {
			p: fx.parts,
			d: fx.decals,
			t: fx.texts,
			s: S && S.list,
			q: au.quiet,
			c: C && [
				C.slashes,
				C.nums,
				C.rings,
				C.banner,
				C.combos,
				C.pops
			],
			cam: [
				cam.x,
				cam.y,
				cam.z,
				cam.shk,
				cam.shx,
				cam.shy
			]
		};
		fx.parts = [];
		fx.decals = [];
		fx.texts = [];
		if (S) S.list = [];
		if (C) {
			C.slashes = [];
			C.nums = [];
			C.rings = [];
			C.combos = [null, null];
			C.pops = [null, null];
		}
		au.quiet = true;
		try {
			for (let i = 0; i < n; i++) {
				if (before) before(i);
				G.tick(false);
				if (after) after(i);
			}
		} finally {
			fx.parts = keep.p;
			fx.decals = keep.d;
			fx.texts = keep.t;
			if (S) S.list = keep.s;
			if (C) [C.slashes, C.nums, C.rings, C.banner, C.combos, C.pops] = keep.c;
			au.quiet = keep.q;
			[cam.x, cam.y, cam.z, cam.shk, cam.shx, cam.shy] = keep.cam;
		}
	};
})(window.ND);
