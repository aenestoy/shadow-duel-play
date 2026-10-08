(function(ND) {
	"use strict";
	const FLAG = (() => {
		try {
			return !/[?&]duel=0(&|$)/.test(location.search || "");
		} catch (e) {
			return true;
		}
	})();
	if (!FLAG || !ND.duel) return;
	const Math = ND.DM || globalThis.Math;
	const D = ND.duel, G = ND.game, PO = ND.POSES, pose = ND.pose, fx = ND.fx, au = ND.audio, cam = ND.cam, E = ND.M.ease;
	const { clamp } = ND.M;
	const TAU = Math.PI * 2;
	const P = () => ND.props;
	const WIN = .16;
	const SPEED = .95;
	if (ND.PROP_SETS) {
		ND.PROP_SETS.market = [
			[
				"shopfront",
				-800,
				-16
			],
			[
				"veranda",
				-500,
				-12
			],
			[
				"post",
				-220,
				-6
			],
			[
				"stool",
				10,
				-4
			],
			[
				"table",
				140,
				-8
			],
			[
				"cup",
				122,
				0,
				{ on: 4 }
			],
			[
				"cup",
				146,
				0,
				{ on: 4 }
			],
			[
				"bottle",
				188,
				0,
				{ on: 4 }
			],
			[
				"stool",
				270,
				-2,
				{ fx: -1 }
			],
			[
				"lantern",
				520,
				-14
			],
			[
				"barrel",
				640,
				-10
			],
			[
				"bucket",
				760,
				-4
			]
		];
	}
	const BEATS = [
		{
			t: .55,
			word: "BLOCK",
			at: 0
		},
		{
			t: 1.05,
			word: "BLOCK",
			at: 0
		},
		{
			t: 1.55,
			word: "BLOCK",
			at: 0
		},
		{
			t: 2.35,
			word: "STOOL!",
			at: 0
		},
		{
			t: 2.95,
			word: "TWIST!",
			at: 0
		},
		{
			t: 4.25,
			word: "DUCK!",
			at: 0
		},
		{
			t: 5.35,
			word: "VAULT!",
			at: 0
		},
		{
			t: 5.75,
			word: "KICK!",
			at: 0
		},
		{
			t: 7.6,
			word: "DRAW!",
			at: 1
		},
		{
			t: 8.25,
			word: "PULL!",
			at: 1
		},
		{
			t: 9.5,
			word: "DUCK!",
			at: 2
		},
		{
			t: 10,
			word: "SWEEP!",
			at: 2
		},
		{
			t: 11.6,
			word: "KICK!",
			at: 3
		}
	];
	const STATIONS = [
		"STALL",
		"POST",
		"VERANDA",
		"SHOP FRONT"
	];
	const NOTO = [1.8, 1.94];
	const END = 12.9;
	D.SEQ = {
		BEATS,
		WIN,
		END,
		STATIONS
	};
	function findProps() {
		const PR = P();
		if (!PR || !PR.live) return null;
		const one = (k, f) => PR.items.find((p) => p.k === k && p.st !== 3 && (!f || f(p))) || null;
		const table = one("table", (p) => p.st === 0);
		if (!table) return null;
		const bottle = one("bottle", (p) => p.st === 0 && p.sup === table.id);
		const s1 = one("stool", (p) => p.st === 0 && p.x > table.x), s2 = one("stool", (p) => p.st === 0 && p.x < table.x);
		const post = one("post"), ver = one("veranda"), shop = one("shopfront");
		if (!bottle || !s1 || !s2 || !post || !ver || !shop) return null;
		return {
			table,
			bottle,
			s1,
			s2,
			post,
			ver,
			shop
		};
	}
	D.seqPossible = (def, att) => {
		const S = findProps();
		if (!S || G.phase !== "fight" || def.dead || att.dead || !def.onGround || !att.onGround) return false;
		return Math.abs(def.x - S.table.x) < 520 && Math.abs(att.x - S.table.x) < 600 && !!(def.dz && att.dz && att.dz.armed);
	};
	function startSeq(def, att) {
		const S = findProps();
		if (!S) return false;
		const c = {
			t: 0,
			def,
			att,
			ids: {},
			next: 0,
			hits: 0,
			broke: false,
			done: false,
			fl: {},
			word: null,
			wordT: 0,
			pb: [
				def.ctrl.buf.light,
				def.ctrl.buf.heavy,
				def.ctrl.buf.guard,
				def.ctrl.buf.kick
			]
		};
		for (const k in S) c.ids[k] = S[k].id;
		const floorOf = (p) => p.y - ND.PROP_KINDS[p.k]._com[1];
		c.X = {
			table: S.table.x,
			s1: S.s1.x,
			s2: S.s2.x,
			post: S.post.x,
			postFloor: floorOf(S.post),
			ver: S.ver.x,
			shop: S.shop.x
		};
		for (const f of [def, att]) {
			f.setState("dseq");
			f.vx = f.vy = 0;
			f.counterUntil = 0;
			f.dz.seq = c;
			f.dz.cine = null;
		}
		def.dz.chain = 0;
		build(c);
		c.dX = [
			[0, def.x],
			[.35, c.dX[0][1]],
			...c.dX.slice(1)
		];
		c.aX = [
			[0, att.x],
			[.35, c.aX[0][1]],
			...c.aX.slice(1)
		];
		fx.flash((def.x + att.x) / 2, -130, 0, 160, "255,244,220");
		au.clang(1.2, 0, .8);
		if (au.kShing) au.kShing(0);
		if (ND.cine) {
			ND.cine.rings.length = 0;
			ND.cine.slashes.length = 0;
			ND.cine.banner = null;
		}
		fx.texts.length = 0;
		if (D.stats) D.stats.seqStarts = (D.stats.seqStarts || 0) + 1;
		return true;
	}
	D.startSeq = startSeq;
	const pk = (n) => PO[n] || PO.stance;
	const mod = (n, o) => Object.assign(pose.copy(pk(n)), o);
	function build(c) {
		const d = c.def, a = c.att, X = c.X, B = BEATS;
		const T = X.table, S1 = X.s1, S2 = X.s2, PS = X.post, V = X.ver, SH = X.shop;
		c.dX = [
			[0, S1 + 110],
			[B[0].t, S1 + 90],
			[B[1].t, S1 + 70],
			[B[2].t, S1 + 50],
			[2.1, S1 + 40],
			[2.95, S1 + 40],
			[3.4, S1 + 55],
			[3.8, S1 + 72],
			[4.25, S1 + 72],
			[4.9, S1 + 80],
			[B[6].t, S1 + 55],
			[5.55, T + 30],
			[B[7].t, T - 40],
			[6.2, T - 70],
			[6.6, T - 80],
			[7.2, PS + 160],
			[B[8].t, PS + 112],
			[8, PS + 110],
			[B[9].t, PS + 118],
			[8.7, PS + 70],
			[9.3, V + 140],
			[B[10].t, V + 130],
			[B[11].t, V + 112],
			[10.4, V + 100],
			[10.6, V + 75],
			[10.85, V + 30],
			[11.25, V - 80],
			[B[12].t, SH + 130],
			[12.05, SH + 110],
			[END, SH + 110]
		];
		c.dY = [
			[0, 0],
			[B[6].t, 0],
			[5.48, -150],
			[B[7].t, -120],
			[6.05, 0],
			[10.4, 0],
			[10.6, -24],
			[10.85, -48],
			[11.25, -48],
			[11.45, -112],
			[B[12].t, -96],
			[12.05, 0],
			[END, 0]
		];
		c.aX = [
			[0, S1 + 260],
			[B[0].t, S1 + 222],
			[B[1].t, S1 + 196],
			[B[2].t, S1 + 172],
			[2.35, S1 + 156],
			[2.95, S1 + 156],
			[3.3, S1 + 170],
			[3.35, S1 + 170],
			[3.75, T + 14],
			[4.25, T + 10],
			[4.7, T - 84],
			[5.2, T - 86],
			[B[7].t, T - 86],
			[6.2, S2 - 20],
			[6.7, S2 - 60],
			[7.2, PS + 46],
			[B[8].t - .1, PS + 40],
			[B[8].t + .05, PS - 84],
			[8, PS - 84],
			[B[9].t, PS - 6],
			[8.6, PS - 30],
			[9, V + 60],
			[9.2, V + 40],
			[B[10].t, V + 40],
			[B[11].t, V + 30],
			[10.6, V - 110],
			[11, SH + 120],
			[B[12].t, SH + 66],
			[11.85, SH + 4],
			[12.2, SH - 30],
			[END, SH - 34]
		];
		c.aY = [
			[0, 0],
			[3.36, 0],
			[3.46, -150],
			[3.58, -130],
			[3.7, 0],
			[7.58, 0],
			[7.67, -12],
			[7.76, 0],
			[8.6, 0],
			[8.8, -24],
			[9, -48],
			[B[11].t, -48],
			[10.25, -110],
			[10.6, 0],
			[B[12].t, 0],
			[11.75, -40],
			[12.2, 0],
			[END, 0]
		];
		c.dK = [[0, d.entry]];
		c.aK = [[0, a.entry]];
		const blocks = [
			"d_kesaR",
			"d_kesaL",
			"d_kesaR"
		];
		for (let i = 0; i < 3; i++) {
			const bt = B[i].t, mv = blocks[i], dx = trackAt(c.dX, bt), ax = trackAt(c.aX, bt), sd = ax > dx ? 1 : -1;
			const cx = dx + sd * 46, cy = -150 + i * 4, dp = {}, ap = {};
			withAt(d, dx, sd, () => D.aimPose(d, dp, d.P.guard, cx, cy, Math.atan2(Math.sin(D.GSW.high), Math.cos(D.GSW.high) * sd), .36));
			dp.hy -= 2;
			withAt(a, ax, -sd, () => D.aimPose(a, ap, pk("dz_" + mv + "S"), cx, cy, -sd > 0 ? .6 : Math.PI - .6, .62));
			c.aK.push([
				bt - .2,
				pk("dz_" + mv + "W"),
				E.inOutSine
			], [bt - .08, pk("dz_" + mv + "W")], [
				bt,
				ap,
				E.outQuart
			], [bt + .12, ap]);
			c.dK.push([
				bt - .12,
				dp,
				E.outCubic
			], [bt + .1, dp]);
		}
		const reach = mod("ua_pickLow", {
			ax: -10,
			ay: 40,
			gx: -14,
			gy: 36,
			lean: .5,
			hx: -8
		});
		const up = mod("ua_guard", {
			ax: 12,
			ay: -50,
			sw: -1.5,
			gx: 8,
			gy: -48,
			grip: 0,
			hy: -74,
			lean: .02
		});
		const twist = Object.assign(pose.copy(up), {
			ax: 34,
			ay: -30,
			gx: 22,
			gy: -44,
			lean: .22,
			hx: 6
		});
		c.dK.push([
			NOTO[0],
			d.P.stance,
			E.inOutSine
		], [NOTO[1], d.P.stance], [
			2.05,
			reach,
			E.outCubic
		], [2.12, reach], [
			2.27,
			up,
			E.outQuart
		], [B[4].t - .06, up], [
			B[4].t + .08,
			twist,
			E.outQuart
		], [3.15, twist]);
		c.aK.push([
			2,
			pk("dz_d_menW"),
			E.inOutSine
		], [2.2, pk("dz_d_menW")]);
		c.stuckP = {};
		c.aK.push([
			B[3].t,
			c.stuckP,
			E.inQuad
		], [B[4].t, c.stuckP], [
			B[4].t + .1,
			pk("dz_flung"),
			E.outQuart
		], [3.3, pk("dz_flung")]);
		c.aK.push([
			3.4,
			pk("ua_roll"),
			E.outCubic
		], [3.7, pk("ua_roll")], [
			3.85,
			pk("ua_pickHigh"),
			E.outCubic
		], [
			4.05,
			pk("ua_crossA"),
			E.inOutSine
		], [
			B[5].t - .02,
			pk("ua_crossB"),
			E.outQuart
		], [4.5, pk("ua_stance")], [4.7, pk("ua_stance")], [
			4.95,
			pk("ua_pickLow"),
			E.outCubic
		], [
			5.1,
			pk("ua_upperB"),
			E.outQuart
		], [5.3, pk("ua_stance")], [B[7].t, pk("ua_guard")], [
			B[7].t + .06,
			pk("launch"),
			E.outCubic
		], [
			6.2,
			pk("down"),
			E.outCubic
		], [6.5, pk("down")], [
			6.8,
			pk("ua_roll"),
			E.inOut
		], [
			7.1,
			pk("ua_stance"),
			E.outCubic
		], [B[8].t - .08, pk("ua_guard")], [
			B[8].t + .05,
			mod("ua_sweepA", {
				ax: 20,
				ay: 10
			}),
			E.outCubic
		], [8.05, mod("ua_sweepA", {
			ax: 20,
			ay: 10
		})], [
			B[9].t - .1,
			pk("ua_frontA"),
			E.inOutSine
		], [
			B[9].t,
			pk("ua_frontB"),
			E.outQuart
		], [8.45, pk("ua_stance")], [
			8.8,
			pk("jump"),
			E.outCubic
		], [
			9.05,
			pk("ua_stance"),
			E.outCubic
		], [
			B[10].t - .12,
			pk("ua_frontA"),
			E.inOutSine
		], [
			B[10].t,
			pk("ua_frontB"),
			E.outQuart
		], [B[10].t + .2, pk("ua_stance")], [
			B[11].t + .02,
			pk("launch"),
			E.outCubic
		], [10.55, pk("launch")], [
			10.65,
			pk("down"),
			E.outCubic
		], [10.8, pk("down")], [
			11.05,
			pk("kneel"),
			E.outCubic
		], [
			11.3,
			pk("stagger"),
			E.outCubic
		], [B[12].t, pk("stagger")], [
			B[12].t + .05,
			pk("launch"),
			E.outCubic
		], [
			12.2,
			pk("down"),
			E.outCubic
		], [END, pk("down")]);
		const duck = mod("ua_sweepA", {
			ax: 20,
			ay: 30,
			sw: 1,
			hy: -44,
			lean: .7
		});
		const kick = mod("ua_airB", {
			f1x: 92,
			f1y: -30,
			lean: -.3
		});
		c.dK.push([
			3.3,
			d.P.stance,
			E.inOut
		], [
			3.4,
			duck,
			E.outCubic
		], [3.62, duck], [
			3.82,
			d.P.stance,
			E.inOut
		], [4.05, d.P.stance], [
			B[5].t - .04,
			duck,
			E.outCubic
		], [B[5].t + .18, duck], [
			4.7,
			d.P.stance,
			E.inOut
		], [
			5.05,
			pk("dz_d_dashRW"),
			E.inOutSine
		], [
			B[6].t,
			pk("jump"),
			E.outCubic
		], [
			5.5,
			pk("ua_roll"),
			E.outCubic
		], [
			B[7].t - .04,
			pk("ua_airA"),
			E.outCubic
		], [
			B[7].t + .06,
			kick,
			E.outQuart
		], [5.95, kick], [
			6.05,
			pk("land"),
			E.outCubic
		], [
			6.4,
			d.P.stance,
			E.inOut
		], [7.1, d.P.stance]);
		const bp = {
			x: PS + 112,
			top: X.postFloor - 104
		};
		c.biteP = {};
		c.pullP = {};
		withAt(d, bp.x, -1, () => {
			D.aimPose(d, c.biteP, pk("dz_ak_dNukiS"), PS + 6, bp.top, Math.PI + .1, .8);
			D.aimPose(d, c.pullP, mod("dz_ak_dNukiS", {
				hx: 10,
				lean: -.12
			}), PS + 50, bp.top - 30, Math.PI - .5, .55);
		});
		c.dK.push([
			B[8].t - .12,
			pk("dz_ak_dNukiW"),
			E.inOutSine
		], [
			B[8].t,
			pk("dz_ak_dNukiS"),
			E.outQuart
		], [
			B[8].t + .06,
			c.biteP,
			E.outCubic
		], [B[9].t - .05, c.biteP], [
			B[9].t + .08,
			c.pullP,
			E.outQuart
		], [
			8.6,
			d.P.guard,
			E.inOut
		], [9.2, d.P.guard], [
			B[10].t - .05,
			duck,
			E.outCubic
		], [B[10].t + .15, duck], [
			B[11].t - .1,
			pk("dz_d_suneRW"),
			E.inOutSine
		], [
			B[11].t,
			pk("dz_d_suneRS"),
			E.outQuart
		], [
			10.3,
			pk("dz_d_suneRF"),
			E.outCubic
		], [
			10.55,
			pk("jump"),
			E.outCubic
		], [
			10.85,
			pk("dz_d_dashRW"),
			E.inOutSine
		], [11.25, pk("dz_d_dashRW")], [
			11.45,
			pk("ua_airA"),
			E.outCubic
		], [
			B[12].t,
			kick,
			E.outQuart
		], [11.9, kick], [
			12.05,
			pk("land"),
			E.outCubic
		], [
			12.5,
			d.P.stance,
			E.inOut
		], [END, d.P.stance]);
		c.dR = [
			[0, 0],
			[5.42, 0],
			[5.66, -TAU],
			[11.25, -TAU],
			[11.55, -2 * TAU]
		];
		c.aR = [
			[0, 0],
			[3.4, 0],
			[3.72, TAU],
			[6.5, TAU],
			[6.85, 2 * TAU],
			[B[11].t, 2 * TAU],
			[10.6, 3 * TAU]
		];
	}
	function withAt(f, x, dir, fn) {
		const x0 = f.x, d0 = f.dir;
		f.x = x;
		f.dir = dir;
		try {
			fn();
		} finally {
			f.x = x0;
			f.dir = d0;
		}
	}
	function trackAt(K, t) {
		if (t <= K[0][0]) return K[0][1];
		for (let i = 1; i < K.length; i++) if (t <= K[i][0]) {
			const a = K[i - 1], b = K[i], u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
			return a[1] + (b[1] - a[1]) * E.inOutSine(u);
		}
		return K[K.length - 1][1];
	}
	function poseAt(K, t, out) {
		return pose.seq(K, t, out);
	}
	function step(c, dt) {
		if (c.done) return;
		c.t += dt * SPEED;
		const t = c.t, d = c.def, a = c.att, PR = P(), F = c.fl;
		const it = (k) => PR && PR.get(c.ids[k]);
		const lo = Math.min(d.x, a.x) - 110, hi = Math.max(d.x, a.x) + 110;
		G.cineT = Math.max(G.cineT || 0, .25);
		G.cineX = (lo + hi) / 2;
		G.cineZ = clamp(cam.W / (cam.s * (hi - lo + 120 + (cam.padX || 0))), 1.15, 1.6);
		press(c);
		if (c.broke || c.done) return;
		const st = it("s1"), bt = it("bottle"), tb = it("table"), s2 = it("s2"), post = it("post"), shop = it("shop");
		if (!F.grab && t >= 2.08 && st) {
			F.grab = true;
			c.g0 = [
				st.x,
				st.y,
				st.a,
				t
			];
		}
		if (F.grab && !F.stoolGone && st && st.st !== 3) {
			holdStool(c, st, t);
			pickGlide(st, c.g0, t);
		}
		if (!F.flung && t >= BEATS[4].t + .02) {
			F.flung = true;
			D.disarm(a, d, 1, "bind");
			say("DISARMED!", 100);
		}
		if (F.flung && !F.stoolGone && t >= 3.15 && st) {
			F.stoolGone = true;
			st.st = 1;
			st.vx = 60;
			st.vy = -120;
			st.w = -3;
			st.owner = -1;
			st.tt = 9;
		}
		if (!F.bottle && t >= 3.85 && bt && bt.st !== 3) {
			F.bottle = true;
			bt.sup = -1;
			c.b0 = [
				bt.x,
				bt.y,
				bt.a,
				t
			];
		}
		if (F.bottle && !F.thrown && bt && bt.st !== 3) {
			holdGrip(bt, a.j.haF.x, a.j.haF.y, .2 * a.dir);
			pickGlide(bt, c.b0, t);
		}
		if (!F.thrown && t >= BEATS[5].t - .02 && bt && bt.st !== 3) {
			F.thrown = true;
			bt.st = 1;
			bt.owner = a.id;
			bt.tt = 0;
			bt.hitF = -1;
			bt.vx = a.dir * 760;
			bt.vy = -330;
			bt.w = a.dir * 16;
			bt.y = Math.min(bt.y, -150);
			au.swoosh(.9, a.pan);
		}
		if (!F.flip && t >= 5.12 && tb && tb.st === 0) {
			F.flip = true;
			tb.st = 1;
			tb.sl = 0;
			tb.vy = -560;
			tb.vx = 230;
			tb.w = 11;
			tb.owner = a.id;
			tb.tt = .6;
			tb.hitF = d.id;
			tb.hitT = 1e9;
			au.thud(1.1, a.pan);
			fx.dust(tb.x, 0, 10, 1.2);
			cam.punch(6);
			say("TABLE FLIP!", 80);
		}
		if (!F.kick1 && t >= BEATS[7].t + .03) {
			F.kick1 = true;
			blow(a, d, 12, "kick", -1);
			if (s2 && s2.st !== 3) PR.breakProp(s2, "crush", {
				x: s2.x + 6,
				y: s2.y - 10,
				dx: -1,
				dy: .3,
				by: d
			});
			cam.punch(9);
			say("THROUGH THE STALL!", 90);
		}
		if (!F.bite && t >= BEATS[8].t + .05 && post) {
			F.bite = true;
			const y = c.X.postFloor - 104;
			fx.spark(post.x + 8, y, 0, 10, .7, "230,200,150");
			fx.dust(post.x + 8, y, 6, .6);
			au.thud(1.1, d.pan);
			au.clang(.35, d.pan, .55);
			cam.punch(7);
			G.hitstop(.12);
			if (PR.hurt) PR.hurt(post, 4, "shatter", post.x + 8, y, -1, 0, d);
			say("STUCK IN THE POST!", 85);
		}
		if (!F.pull && t >= BEATS[9].t + .04 && post) {
			F.pull = true;
			const y = c.X.postFloor - 104;
			fx.spark(post.x + 10, y, .4, 8, .6, "230,200,150");
			fx.dust(post.x + 10, y, 4, .5);
			au.swoosh(.7, d.pan);
			if (PR.hurt) PR.hurt(post, 2, "shatter", post.x + 10, y, 1, 0, d);
		}
		if (!F.sweep && t >= BEATS[11].t + .02) {
			F.sweep = true;
			blow(a, d, 8, "blade", -1, true);
			cam.punch(8);
			say("OFF THE VERANDA!", 85);
		}
		if (!F.kick2 && t >= BEATS[12].t + .03) {
			F.kick2 = true;
			blow(a, d, 20, "kick", -1);
			G.slowT = Math.max(G.slowT || 0, 1.1);
			G.slowV = .28;
			cam.punch(12);
			au.taiko(1.3);
			fx.ring(a.x, -120, "255,236,190", 140);
			if (D.stats) D.stats.seqWins = (D.stats.seqWins || 0) + 1;
		}
		if (!F.tear && t >= 11.84 && shop && shop.st !== 3) {
			F.tear = true;
			PR.breakProp(shop, "crush", {
				x: shop.x + 30,
				y: shop.y - 40,
				dx: -1,
				dy: .1,
				by: d
			});
			au.thud(1.3, a.pan);
			cam.punch(10);
			G.hitstop(.08);
			say("THROUGH THE SHOP FRONT!", 95);
		}
		if (t >= END) endSeq(c, true);
	}
	function blow(a, d, raw, kind, kdir, low) {
		const dmg = Math.max(1, Math.round(raw * .65));
		a.hp = Math.max(1, a.hp - dmg);
		a.damageTaken = (a.damageTaken || 0) + dmg;
		a.flash = 1;
		const x = (a.x + d.x) / 2, y = low ? a.y - 30 : a.y - 110;
		if (kind === "blade") {
			fx.blood(x, y, kdir, -.3, 18, 1);
			au.cut(1, a.pan);
		} else {
			au.thud(1.2, a.pan);
			fx.dust(x, y, 6, .6);
		}
		fx.flash(x, y, 0, 70, "255,240,220");
		G.hitstop(.08);
	}
	function holdStool(c, p, t) {
		const d = c.def, j = d.j, K = ND.PROP_KINDS.stool;
		const hx = (j.haF.x + j.haB.x) / 2, hy = Math.min(j.haF.y, j.haB.y);
		let ang = 0;
		if (t >= BEATS[4].t - .06) ang = clamp((t - (BEATS[4].t - .06)) / .14, 0, 1) * 1.35 * d.dir;
		holdAt(p, hx, hy + 2, ang, K);
	}
	function holdAt(p, x, y, a, K) {
		K = K || ND.PROP_KINDS[p.k];
		p.st = 0;
		p.sup = -1;
		p.vx = p.vy = p.w = 0;
		p.a = a;
		p.hold = -1;
		const c = Math.cos(a), s = Math.sin(a), cx = -K._com[0], cy = -K._com[1];
		p.x = x + c * cx - s * cy;
		p.y = y + s * cx + c * cy;
	}
	const PICK = .12;
	function pickGlide(p, g0, t) {
		const u = (t - g0[3]) / PICK;
		if (!(u < 1)) return;
		const k = u * u * (3 - 2 * u);
		p.x = g0[0] + (p.x - g0[0]) * k;
		p.y = g0[1] + (p.y - g0[1]) * k;
		p.a = g0[2] + (p.a - g0[2]) * k;
	}
	function holdGrip(p, x, y, a) {
		const K = ND.PROP_KINDS[p.k], g = K.grip || [0, 0];
		p.st = 0;
		p.sup = -1;
		p.vx = p.vy = p.w = 0;
		p.a = a;
		p.hold = -1;
		const c = Math.cos(a), s = Math.sin(a), gx = (g[0] - K._com[0]) * p.fx, gy = g[1] - K._com[1];
		p.x = x - (c * gx - s * gy);
		p.y = y - (s * gx + c * gy);
	}
	function stuckAim(c) {
		const PR = P(), st = PR && PR.get(c.ids.s1), a = c.att;
		if (!st || st.st === 3) return;
		const K = ND.PROP_KINDS.stool, top = st.y + K._com[1] - K.top * Math.cos(st.a) + 6;
		D.aimPose(a, c.stuckP, pk("dz_d_menS"), st.x, top, a.dir > 0 ? .9 : Math.PI - .9, .86);
	}
	function press(c) {
		const b = c.def.ctrl.buf, keys = [
			"light",
			"heavy",
			"guard",
			"kick"
		];
		let fresh = false;
		for (let i = 0; i < 4; i++) {
			const v = b[keys[i]];
			if (v != null && v !== c.pb[i]) {
				fresh = true;
				c.pb[i] = v;
			}
		}
		const B = BEATS[c.next];
		if (!B) return;
		if (fresh) {
			const dt = c.t - B.t;
			if (Math.abs(dt) <= WIN) {
				hitBeat(c, B);
				return;
			}
			if (dt < -WIN && dt > -.45) {
				breakSeq(c, "early");
				return;
			}
		}
		if (c.t > B.t + WIN) breakSeq(c, "late");
	}
	function hitBeat(c, B) {
		c.next++;
		c.hits++;
		const d = c.def, a = c.att, w = B.word;
		c.word = w;
		c.wordT = 0;
		if (w === "BLOCK") {
			const x = (d.x + a.x) / 2, y = -150;
			fx.spark(x, y, -Math.PI / 2, 16, 1);
			fx.flash(x, y, -.6, 60, "255,236,190");
			au.clang(.9 + c.next * .1, cam.pan(x), 1 + c.next * .08);
			cam.punch(5);
			G.hitstop(.05);
		} else if (w === "STOOL!") {
			const st = P() && P().get(c.ids.s1);
			if (st) {
				fx.spark(st.x, st.y - 30, -Math.PI / 2, 10, .6, "240,220,180");
				fx.dust(st.x, st.y - 30, 6, .6);
			}
			au.thud(1.2, d.pan);
			au.clang(.5, d.pan, .6);
			cam.punch(8);
			G.hitstop(.12);
			G.slowT = Math.max(G.slowT || 0, .5);
			G.slowV = .45;
		} else if (w === "TWIST!") {
			au.whoosh(1.2);
			cam.punch(6);
		} else if (w === "VAULT!") {
			au.step(d.pan, 3);
			fx.dust(d.x, 0, 8, 1);
		} else if (w === "DRAW!") {
			if (au.kShing) au.kShing(d.pan);
			else au.swoosh(1, d.pan);
		} else au.swoosh(.6, d.pan);
		if (D.stats) D.stats.seqBeats = (D.stats.seqBeats || 0) + 1;
	}
	function say(w, pri) {
		if (D.headline) D.headline(w, pri);
	}
	function breakSeq(c, why) {
		c.broke = true;
		say(why === "early" ? "TOO EARLY · BROKEN" : "MISSED · BROKEN", 90);
		au.clang(.7, 0, 1.2);
		if (D.stats) D.stats.seqBreaks = (D.stats.seqBreaks || 0) + 1;
		endSeq(c, false);
	}
	function endSeq(c, ok) {
		if (c.done) return;
		c.done = true;
		const d = c.def, a = c.att, PR = P(), F = c.fl;
		const st = PR && PR.get(c.ids.s1), bt = PR && PR.get(c.ids.bottle);
		if (st && st.st === 0 && F.grab && !F.stoolGone) {
			st.st = 1;
			st.vy = -60;
			st.owner = -1;
			st.tt = 9;
		}
		if (bt && bt.st === 0 && F.bottle && !F.thrown) {
			bt.st = 1;
			bt.vy = -60;
			bt.owner = -1;
			bt.tt = 9;
		}
		for (const f of [d, a]) {
			if (f.dz) f.dz.seq = null;
			f.roll = 0;
			if (f.dead) continue;
			if (f.state === "dseq") {
				if (ok && f === a) {
					f.setState("down");
				} else if (!ok && f === d) {
					f.setState("stagger");
					f.vx = -f.dir * 260;
				} else f.setState("move");
			}
			if (f.y < -1) {
				f.onGround = false;
				f.vy = 0;
			}
			const b = f.ctrl.buf;
			for (const k of [
				"light",
				"heavy",
				"kick"
			]) b[k] = null;
		}
		G.cineT = Math.min(G.cineT || 0, .3);
	}
	const FP = ND.Fighter.prototype, upd0 = FP.update;
	FP.update = function(dt) {
		const c = this.dz && this.state === "dseq" ? this.dz.seq : null;
		if (!c) return upd0.call(this, dt);
		upd0.call(this, dt);
		if (this.dead || this.state !== "dseq") return;
		if (c.def === this) step(c, dt);
		if (c.done) return;
		const t = c.t, isD = c.def === this;
		if (!isD && c.stuckP) stuckAim(c);
		poseAt(isD ? c.dK : c.aK, t, this.pose);
		this.x = trackAt(isD ? c.dX : c.aX, t);
		const y = trackAt(isD ? c.dY : c.aY, t);
		this.y = y;
		this.vx = 0;
		this.vy = 0;
		this.onGround = y > -1;
		this.roll = trackAt(isD ? c.dR : c.aR, t) * (isD ? 1 : this.dir) % TAU;
		this.dir = (isD ? c.att.x : c.def.x) >= this.x ? 1 : -1;
		if (!isD && t > 3.35 && t < 3.85) this.dir = -1;
		if (isD && t > 5.2 && t < 6.1) this.dir = -1;
	};
	const isInv0 = FP.isInv;
	FP.isInv = function() {
		return this.dz && this.state === "dseq" || isInv0.call(this);
	};
	const passing0 = FP.passing;
	FP.passing = function() {
		return this.dz && this.state === "dseq" || passing0.call(this);
	};
	const sheathed0 = FP.sheathed;
	FP.sheathed = function() {
		const c = this.dz && this.state === "dseq" ? this.dz.seq : null;
		if (c && c.def === this && c.t > NOTO[0] + .02 && c.t < BEATS[8].t - .12) return 1;
		return sheathed0.call(this);
	};
	D.seqHand = (f) => {
		const c = f.dz && f.state === "dseq" ? f.dz.seq : null;
		if (!c) return null;
		if (c.def === f && c.fl.grab && !c.fl.stoolGone) return "B";
		return null;
	};
	function heldShift(c, out) {
		const PR = P(), A3 = ND.depth25, F = c.fl;
		out.length = 0;
		if (!PR || !A3 || !A3.snap) return out;
		if (F.grab && !F.stoolGone) {
			const st = PR.get(c.ids.s1), s = A3.snap(c.def, SN0), j = c.def.j;
			const k = c.g0 ? Math.min(1, Math.max(0, (c.t - c.g0[3]) / PICK)) : 1;
			if (st && s) out.push([
				st,
				((s.haF.x + s.haB.x) / 2 - (j.haF.x + j.haB.x) / 2) * k,
				(Math.min(s.haF.y, s.haB.y) - Math.min(j.haF.y, j.haB.y)) * k
			]);
		}
		if (F.bottle && !F.thrown) {
			const bt = PR.get(c.ids.bottle), s = A3.snap(c.att, SN1), j = c.att.j;
			const k = c.b0 ? Math.min(1, Math.max(0, (c.t - c.b0[3]) / PICK)) : 1;
			if (bt && s) out.push([
				bt,
				(s.haF.x - j.haF.x) * k,
				(s.haF.y - j.haF.y) * k
			]);
		}
		return out;
	}
	const SN0 = {}, SN1 = {}, HS = [];
	const seqOf = () => {
		const f = G.F && G.F.find((x) => x.dz && x.state === "dseq" && x.dz.seq && x.dz.seq.def === x);
		return f ? f.dz.seq : null;
	};
	if (ND.props) {
		const draw0 = ND.props.draw;
		ND.props.draw = function(ctx, layer) {
			const c = seqOf();
			if (!c) return draw0.call(this, ctx, layer);
			heldShift(c, HS);
			for (const h of HS) {
				h[3] = h[0].x;
				h[4] = h[0].y;
				h[0].x += h[1];
				h[0].y += h[2];
			}
			try {
				return draw0.call(this, ctx, layer);
			} finally {
				for (const h of HS) {
					h[0].x = h[3];
					h[0].y = h[4];
				}
			}
		};
		ND.props.drawPos = (q) => {
			const c = seqOf();
			if (c) {
				for (const h of heldShift(c, [])) if (h[0] === q) return {
					x: q.x + h[1],
					y: q.y + h[2]
				};
			}
			return {
				x: q.x,
				y: q.y
			};
		};
	}
	if (ND.AI) {
		const AP = ND.AI.prototype, up0 = AP.update;
		AP.update = function(dt) {
			const me = this.me, c = me.dz && me.state === "dseq" ? me.dz.seq : null;
			if (!c) return up0.call(this, dt);
			this.t += dt;
			for (const k of this.taps) if (!this.held[k]) this.c.release(k, "ai");
			this.taps.length = 0;
			if (c.def !== me || c.done) {
				this.releaseAll();
				return;
			}
			const B = BEATS[c.next];
			if (!B) return;
			if (c.aiFor !== c.next) {
				c.aiFor = c.next;
				const ok = D.seqSure || ND.rng.next() < .6 + .38 * (this.lv.smart || .5);
				c.aiAt = ok ? B.t + ND.rng.range(-.07, .07) : B.t + ND.rng.range(.2, .3);
			}
			if (c.t >= c.aiAt && c.aiTok !== c.next) {
				c.aiTok = c.next;
				this.tap("light");
			}
		};
	}
})(window.ND);
