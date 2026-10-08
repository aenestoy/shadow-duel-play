(function(ND) {
	"use strict";
	const K = ND._costumeKit;
	if (!K || !ND.COSTUMES) return;
	const { R, TAU, LINE, torso, poly, headFrame, sway, lames, sodePlate } = K;
	const grad = (ctx, x0, y0, x1, y1, stops) => {
		const g = ctx.createLinearGradient(x0, y0, x1, y1);
		stops.forEach(([t, c]) => g.addColorStop(t, c));
		return g;
	};
	const fillStroke = (ctx, fill, lw = 1.2) => {
		ctx.fillStyle = fill;
		ctx.fill();
		ctx.strokeStyle = LINE;
		ctx.lineWidth = lw;
		ctx.stroke();
	};
	function crest(ctx, x, y, r, col, bg, fn) {
		ctx.save();
		ctx.translate(x, y);
		ctx.beginPath();
		ctx.arc(0, 0, r, 0, TAU);
		ctx.fillStyle = bg;
		ctx.fill();
		ctx.strokeStyle = col;
		ctx.lineWidth = r * .14;
		ctx.stroke();
		ctx.fillStyle = col;
		ctx.strokeStyle = col;
		fn(ctx, r * .72);
		ctx.restore();
	}
	const AK = {
		vest: "#a3141b",
		vestHi: "#d02a2f",
		vestDk: "#5f070c",
		gold: "#e2b547",
		goldDk: "#8d6417"
	};
	const akaneCrest = (ctx, r) => {
		for (let i = 0; i < 5; i++) {
			ctx.rotate(TAU / 5);
			ctx.beginPath();
			ctx.ellipse(0, -r * .5, r * .28, r * .46, 0, 0, TAU);
			ctx.fill();
		}
	};
	const akane = {
		ownHead: true,
		pal: {
			cloth: "#f2ede3",
			clothHi: "#fffdf8",
			clothDark: "#b9b0a2",
			hakama: "#8f0e16",
			hakamaDark: "#55070c",
			accent: AK.gold,
			accentDark: AK.goldDk
		},
		back(ctx, j) {
			const F = torso(j);
			poly(ctx, F, [
				[50, -4],
				[56, -31],
				[60, -31],
				[55, -4]
			]);
			fillStroke(ctx, AK.vestDk, 1.1);
		},
		body(ctx, j) {
			const F = torso(j);
			poly(ctx, F, [
				[55, -12],
				[55, 12],
				[40, 14],
				[12, 11],
				[12, -11],
				[40, -13]
			]);
			fillStroke(ctx, grad(ctx, F.x(54, 12), F.y(54, 12), F.x(12, -11), F.y(12, -11), [
				[0, AK.vestHi],
				[.5, AK.vest],
				[1, AK.vestDk]
			]), 1.3);
			ctx.strokeStyle = "rgba(0,0,0,.28)";
			ctx.lineWidth = 1;
			ctx.beginPath();
			for (const n of [
				-6,
				0,
				6
			]) {
				ctx.moveTo(F.x(50, n), F.y(50, n));
				ctx.lineTo(F.x(14, n * 1.05), F.y(14, n * 1.05));
			}
			ctx.stroke();
			crest(ctx, F.x(42, 5), F.y(42, 5), 4.4, AK.gold, AK.vestDk, akaneCrest);
			ctx.strokeStyle = AK.gold;
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			ctx.moveTo(F.x(54, -11), F.y(54, -11));
			ctx.lineTo(F.x(22, 11), F.y(22, 11));
			ctx.stroke();
		},
		front(ctx, j) {
			const F = torso(j);
			poly(ctx, F, [
				[50, 4],
				[56, 31],
				[60, 31],
				[55, 4]
			]);
			fillStroke(ctx, grad(ctx, F.x(56, 4), F.y(56, 4), F.x(58, 31), F.y(58, 31), [[0, AK.vest], [1, AK.vestHi]]), 1.1);
			ctx.strokeStyle = AK.gold;
			ctx.lineWidth = 1.3;
			ctx.beginPath();
			ctx.moveTo(F.x(59.4, 6), F.y(59.4, 6));
			ctx.lineTo(F.x(59.4, 30.5), F.y(59.4, 30.5));
			ctx.stroke();
		},
		head(ctx, j) {
			ctx.save();
			headFrame(ctx, j);
			ctx.strokeStyle = LINE;
			ctx.lineWidth = 3.2;
			ctx.beginPath();
			ctx.moveTo(-R * 1.25, -R * .55);
			ctx.lineTo(-R * .05, -R * 1.05);
			ctx.stroke();
			ctx.strokeStyle = AK.gold;
			ctx.lineWidth = 1.8;
			ctx.stroke();
			crest(ctx, -R * .2, -R * 1, 2.8, AK.gold, AK.vest, akaneCrest);
			ctx.fillStyle = AK.gold;
			for (let i = 0; i < 4; i++) {
				ctx.beginPath();
				ctx.arc(-R * 1.15 - i * .4, -R * .4 + i * 3, .95, 0, TAU);
				ctx.fill();
			}
			ctx.fillStyle = AK.vestHi;
			ctx.beginPath();
			ctx.arc(-R * 1.15 - 1.6, -R * .4 + 12, 1.4, 0, TAU);
			ctx.fill();
			ctx.restore();
		},
		hem(ctx, j) {
			const F = torso(j);
			ctx.fillStyle = AK.gold;
			ctx.strokeStyle = LINE;
			ctx.lineWidth = .9;
			ctx.beginPath();
			ctx.ellipse(F.x(9, 11), F.y(9, 11), 3, 2, 0, 0, TAU);
			ctx.fill();
			ctx.stroke();
			ctx.strokeStyle = AK.gold;
			ctx.lineWidth = 1.4;
			ctx.beginPath();
			ctx.moveTo(F.x(9, 11), F.y(9, 11));
			ctx.lineTo(F.x(-6, 15 + sway(2, 1)), F.y(-6, 15 + sway(2, 1)));
			ctx.moveTo(F.x(9, 11), F.y(9, 11));
			ctx.lineTo(F.x(-3, 18 + sway(2.3, 1)), F.y(-3, 18 + sway(2.3, 1)));
			ctx.stroke();
		}
	};
	const KU = {
		lac: "#16161b",
		lacHi: "#3a3a46",
		lacDk: "#08080a",
		gold: "#d2a441",
		fur: "#2d2219",
		furHi: "#5a4633",
		furDk: "#140e09",
		snow: "#eef2f8"
	};
	const KUA = {
		hi: "#34343e",
		base: "#1a1a20",
		dark: "#0b0b0e",
		lace: "#8b6fd6",
		metal: "#d2a441",
		shine: "rgba(200,190,255,.25)",
		rivet: "#d2a441"
	};
	function fur(ctx, pts, fill) {
		ctx.beginPath();
		for (let i = 0; i < pts.length; i++) {
			const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
			if (!i) ctx.moveTo(x0, y0);
			const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 5));
			for (let k = 1; k <= n; k++) {
				const t = k / n, mx = x0 + (x1 - x0) * (t - .5 / n), my = y0 + (y1 - y0) * (t - .5 / n), nx = -(y1 - y0) / Math.hypot(x1 - x0, y1 - y0) * 2.6, ny = (x1 - x0) / Math.hypot(x1 - x0, y1 - y0) * 2.6;
				ctx.quadraticCurveTo(mx + nx, my + ny, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
			}
		}
		ctx.closePath();
		fillStroke(ctx, fill, 1.1);
	}
	const kuro = {
		pal: {
			accent: "#9d7cf0",
			accentDark: "#4a3585"
		},
		back(ctx, j) {
			const F = torso(j), s = sway(1.4, 1.5);
			const pts = [
				[58, -4],
				[57, -16],
				[40, -22 + s],
				[22, -20 + s],
				[18, -12],
				[36, -9],
				[50, -6]
			].map(([u, n]) => [F.x(u, n), F.y(u, n)]);
			fur(ctx, pts, grad(ctx, F.x(56, -10), F.y(56, -10), F.x(20, -20), F.y(20, -20), [
				[0, KU.furHi],
				[.5, KU.fur],
				[1, KU.furDk]
			]));
		},
		backArm(ctx, j) {
			sodePlate(ctx, {
				x: j.sh.x - 3,
				y: j.sh.y + 1
			}, j.elB, KUA, 5, 28, 11, 13.5, true);
		},
		body(ctx, j) {
			const F = torso(j);
			poly(ctx, F, [
				[10, -12.5],
				[10, 15],
				[46, 16.5],
				[52, 7],
				[52, -10],
				[44, -14]
			]);
			fillStroke(ctx, grad(ctx, F.x(50, 14), F.y(50, 14), F.x(10, -12), F.y(10, -12), [
				[0, KUA.hi],
				[.5, KUA.base],
				[1, KUA.dark]
			]), 1.4);
			ctx.strokeStyle = KUA.lace;
			ctx.lineWidth = 1.4;
			ctx.beginPath();
			for (const u of [
				16,
				23,
				30,
				37
			]) {
				ctx.moveTo(F.x(u, -11.5), F.y(u, -11.5));
				ctx.lineTo(F.x(u, 15.8), F.y(u, 15.8));
			}
			ctx.stroke();
			poly(ctx, F, [
				[42, -12],
				[42, 16],
				[47, 16],
				[52, 7],
				[52, -10],
				[46, -13]
			]);
			fillStroke(ctx, KUA.metal, 1);
			const pts = [
				[60, -6],
				[60, 10],
				[52, 16],
				[46, 10],
				[50, 2],
				[50, -8]
			].map(([u, n]) => [F.x(u, n), F.y(u, n)]);
			fur(ctx, pts, grad(ctx, F.x(60, 10), F.y(60, 10), F.x(48, -6), F.y(48, -6), [[0, KU.furHi], [1, KU.fur]]));
		},
		hem(ctx, j) {
			const F = torso(j);
			lames(ctx, F, 10, -26, -14, 3, 4, KUA, 3);
			lames(ctx, F, 9, -24, 1, 18, 4, KUA, 4);
		},
		front(ctx, j) {
			sodePlate(ctx, j.sh, j.elF, KUA, 5, 29, 11.5, 14, false);
		},
		head(ctx, j) {
			ctx.save();
			headFrame(ctx, j);
			ctx.strokeStyle = KUA.lace;
			ctx.lineWidth = 1.4;
			ctx.beginPath();
			ctx.moveTo(-R * .4, -R * .2);
			ctx.quadraticCurveTo(R * .2, R * .9, R * .8, R * .75);
			ctx.stroke();
			const hy = -R * .55;
			ctx.beginPath();
			ctx.moveTo(-R * 2.15, hy + 3);
			ctx.quadraticCurveTo(-R * .4, hy - R * 1.05, R * .1, hy - R * 1.2);
			ctx.quadraticCurveTo(R * .6, hy - R * 1.05, R * 2.15, hy + 3);
			ctx.quadraticCurveTo(0, hy - 1, -R * 2.15, hy + 3);
			ctx.closePath();
			fillStroke(ctx, grad(ctx, R, hy - R * 1.2, -R, hy + 3, [
				[0, KU.lacHi],
				[.5, KU.lac],
				[1, KU.lacDk]
			]), 1.4);
			ctx.strokeStyle = KU.gold;
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			ctx.moveTo(-R * 2.05, hy + 2.2);
			ctx.quadraticCurveTo(0, hy - 1.8, R * 2.05, hy + 2.2);
			ctx.stroke();
			ctx.strokeStyle = "rgba(255,255,255,.1)";
			ctx.lineWidth = .7;
			ctx.beginPath();
			for (let i = -3; i <= 3; i++) {
				ctx.moveTo(R * .1, hy - R * 1.15);
				ctx.lineTo(i * R * .6, hy + 1);
			}
			ctx.stroke();
			ctx.save();
			ctx.translate(R * .85, hy - R * .45);
			ctx.beginPath();
			ctx.arc(0, 0, 5.2, 0, TAU);
			fillStroke(ctx, KU.gold, 1);
			ctx.beginPath();
			ctx.moveTo(-4, 2.6);
			ctx.lineTo(-.6, -3.4);
			ctx.lineTo(1.2, -1);
			ctx.lineTo(2.2, -2.4);
			ctx.lineTo(4, 2.6);
			ctx.closePath();
			ctx.fillStyle = KU.lac;
			ctx.fill();
			ctx.beginPath();
			ctx.moveTo(-1.8, -1.3);
			ctx.lineTo(-.6, -3.4);
			ctx.lineTo(.5, -1.8);
			ctx.closePath();
			ctx.fillStyle = KU.snow;
			ctx.fill();
			ctx.restore();
			ctx.restore();
		}
	};
	const TE = {
		gold: "#cfa134",
		goldHi: "#f3d67a",
		goldDk: "#7a5a14",
		red: "#b3201a",
		redHi: "#d9423a",
		redDk: "#650e0b"
	};
	const TEA = {
		hi: TE.goldHi,
		base: TE.gold,
		dark: TE.goldDk,
		lace: TE.red,
		metal: "#fff1c2",
		shine: "rgba(255,250,220,.4)",
		rivet: TE.redDk
	};
	const tetsu = {
		ownHead: true,
		pal: {
			armor: "#b8902e",
			accent: TE.red,
			accentDark: TE.redDk
		},
		back(ctx, j) {
			const F = torso(j), s = sway(1.9, 2);
			const pole = [[20, -14], [128, -14]];
			ctx.strokeStyle = LINE;
			ctx.lineWidth = 3.6;
			ctx.beginPath();
			ctx.moveTo(F.x(...pole[0]), F.y(...pole[0]));
			ctx.lineTo(F.x(...pole[1]), F.y(...pole[1]));
			ctx.stroke();
			ctx.strokeStyle = "#2a2016";
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(F.x(126, -14), F.y(126, -14));
			ctx.lineTo(F.x(126, -38 + s), F.y(126, -38 + s));
			ctx.lineWidth = 2;
			ctx.strokeStyle = "#2a2016";
			ctx.stroke();
			poly(ctx, F, [
				[125, -15],
				[125, -37 + s],
				[76, -37 + s * .6],
				[76, -15]
			]);
			fillStroke(ctx, grad(ctx, F.x(120, -16), F.y(120, -16), F.x(80, -36), F.y(80, -36), [
				[0, TE.redHi],
				[.6, TE.red],
				[1, TE.redDk]
			]), 1.3);
			ctx.strokeStyle = TE.gold;
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			ctx.moveTo(F.x(122, -17), F.y(122, -17));
			ctx.lineTo(F.x(122, -35 + s), F.y(122, -35 + s));
			ctx.lineTo(F.x(79, -35 + s * .6), F.y(79, -35 + s * .6));
			ctx.lineTo(F.x(79, -17), F.y(79, -17));
			ctx.closePath();
			ctx.stroke();
			ctx.save();
			ctx.translate(F.x(101, -26 + s * .8), F.y(101, -26 + s * .8));
			ctx.fillStyle = TE.goldHi;
			ctx.font = "700 14px \"Noto Serif JP\", \"Yu Mincho\", serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText("鉄", 0, 0);
			ctx.restore();
			ctx.fillStyle = TE.gold;
			ctx.beginPath();
			ctx.arc(F.x(129, -14), F.y(129, -14), 2.2, 0, TAU);
			ctx.fill();
			ctx.strokeStyle = LINE;
			ctx.lineWidth = .8;
			ctx.stroke();
		},
		backArm(ctx, j) {
			sodePlate(ctx, {
				x: j.sh.x - 3,
				y: j.sh.y + 1
			}, j.elB, TEA, 5, 27, 10.5, 12.5, true);
		},
		body(ctx, j) {
			const F = torso(j);
			poly(ctx, F, [
				[11, -12],
				[11, 14.5],
				[30, 16.5],
				[47, 15],
				[52, 7],
				[52, -9],
				[46, -13.5],
				[26, -13]
			]);
			fillStroke(ctx, grad(ctx, F.x(50, 14), F.y(50, 14), F.x(10, -12), F.y(10, -12), [
				[0, TE.goldHi],
				[.45, TE.gold],
				[1, TE.goldDk]
			]), 1.4);
			ctx.strokeStyle = TE.red;
			ctx.lineWidth = 1.4;
			ctx.beginPath();
			for (const u of [
				17,
				23,
				29,
				35
			]) for (let n = -10; n <= 14; n += 4) {
				ctx.moveTo(F.x(u - 2, n), F.y(u - 2, n));
				ctx.lineTo(F.x(u + 2, n), F.y(u + 2, n));
			}
			ctx.stroke();
			poly(ctx, F, [
				[40, -11],
				[40, 15.5],
				[47, 15],
				[52, 7],
				[52, -9],
				[46, -12.5]
			]);
			fillStroke(ctx, TE.red, 1.1);
			ctx.fillStyle = TE.goldHi;
			ctx.beginPath();
			ctx.arc(F.x(45, 6), F.y(45, 6), 2.6, 0, TAU);
			ctx.fill();
		},
		front(ctx, j) {
			sodePlate(ctx, j.sh, j.elF, TEA, 5, 28, 11, 13, false);
		},
		head(ctx, j) {
			ctx.save();
			headFrame(ctx, j);
			const blade = (dx, a) => {
				ctx.beginPath();
				ctx.moveTo(R * .55 + dx, -R * .9);
				ctx.bezierCurveTo(R * (.2 + a) + dx, -R * 1.8, R * (.1 + a) + dx, -R * 2.6, R * (.6 + a * 1.4) + dx, -R * 3.4);
				ctx.bezierCurveTo(R * (.5 + a) + dx, -R * 2.5, R * (.55 + a) + dx, -R * 1.7, R * .85 + dx, -R * .95);
				ctx.closePath();
				fillStroke(ctx, grad(ctx, 0, -R * .9, 0, -R * 3.4, [
					[0, TE.goldDk],
					[.5, TE.gold],
					[1, TE.goldHi]
				]), 1.1);
			};
			blade(-R * .35, -.35);
			blade(0, .25);
			ctx.fillStyle = TE.red;
			ctx.beginPath();
			ctx.arc(R * .72, -R * .95, 2.4, 0, TAU);
			ctx.fill();
			ctx.strokeStyle = LINE;
			ctx.lineWidth = .8;
			ctx.stroke();
			ctx.restore();
		}
	};
	const RE = {
		cape: "#a8151a",
		capeHi: "#d6322e",
		capeDk: "#56070a",
		iron: "#3a3a40",
		ironHi: "#6a6a74",
		ironDk: "#1a1a1e",
		bone: "#efe6d2",
		boneDk: "#b9ad92",
		rope: "#c9a86a",
		ropeDk: "#8a6c35",
		bead: "#5a2c14",
		gold: "#e2b547"
	};
	function pauldron(ctx, sh, el, dim) {
		const dx = el.x - sh.x, dy = el.y - sh.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
		const X = (u, n) => sh.x + ux * u + nx * n, Y = (u, n) => sh.y + uy * u + ny * n;
		for (const n of [
			-7,
			0,
			7
		]) {
			ctx.beginPath();
			ctx.moveTo(X(-2, n - 2.6), Y(-2, n - 2.6));
			ctx.lineTo(X(-9, n * 1.4), Y(-9, n * 1.4));
			ctx.lineTo(X(-2, n + 2.6), Y(-2, n + 2.6));
			ctx.closePath();
			fillStroke(ctx, dim ? RE.ironDk : RE.boneDk, .9);
		}
		ctx.beginPath();
		ctx.moveTo(X(-3, -11), Y(-3, -11));
		ctx.quadraticCurveTo(X(-6, 0), Y(-6, 0), X(-3, 11), Y(-3, 11));
		ctx.lineTo(X(15, 12), Y(15, 12));
		ctx.quadraticCurveTo(X(19, 0), Y(19, 0), X(15, -12), Y(15, -12));
		ctx.closePath();
		fillStroke(ctx, dim ? RE.ironDk : grad(ctx, X(-3, 0), Y(-3, 0), X(16, 0), Y(16, 0), [[0, RE.ironHi], [1, RE.ironDk]]), 1.2);
		if (dim) return;
		ctx.fillStyle = RE.gold;
		for (const n of [
			-7,
			0,
			7
		]) {
			ctx.beginPath();
			ctx.arc(X(9, n), Y(9, n), 1, 0, TAU);
			ctx.fill();
		}
		ctx.strokeStyle = RE.cape;
		ctx.lineWidth = 1.4;
		ctx.beginPath();
		ctx.moveTo(X(15, -12), Y(15, -12));
		ctx.quadraticCurveTo(X(19, 0), Y(19, 0), X(15, 12), Y(15, 12));
		ctx.stroke();
	}
	const ren = {
		ownHead: true,
		pal: {
			cloth: "#151013",
			clothHi: "#2a2025",
			clothDark: "#0d090b",
			accent: "#e0392c",
			accentDark: "#74140f",
			mask: "#c01a14"
		},
		back(ctx, j) {
			const F = torso(j), s = sway(2.2, 3);
			const hem = [];
			for (let i = 0; i <= 7; i++) {
				const n = -14 - i * 3.6, u = i % 2 ? -44 + s : -34 + s * .6;
				hem.push([u - i * .8, n]);
			}
			poly(ctx, F, [
				[56, -6],
				[54, -13],
				...hem,
				[-20, -44 + s],
				[14, -18]
			]);
			fillStroke(ctx, grad(ctx, F.x(54, -10), F.y(54, -10), F.x(-40, -30), F.y(-40, -30), [
				[0, RE.capeHi],
				[.5, RE.cape],
				[1, RE.capeDk]
			]), 1.3);
			ctx.strokeStyle = "rgba(0,0,0,.28)";
			ctx.lineWidth = 1;
			ctx.beginPath();
			for (const n of [
				-18,
				-26,
				-34
			]) {
				ctx.moveTo(F.x(48, -12), F.y(48, -12));
				ctx.lineTo(F.x(-32, n + s * .5), F.y(-32, n + s * .5));
			}
			ctx.stroke();
		},
		backArm(ctx, j) {
			pauldron(ctx, {
				x: j.sh.x - 3,
				y: j.sh.y + 1
			}, j.elB, true);
		},
		body(ctx, j) {
			const F = torso(j);
			for (let i = 0; i <= 10; i++) {
				const t = i / 10, u = 54 - t * 42, n = -10 + t * 24, big = i === 5;
				ctx.beginPath();
				ctx.arc(F.x(u, n), F.y(u, n), big ? 3.2 : 2.4, 0, TAU);
				fillStroke(ctx, big ? RE.gold : RE.bead, .8);
			}
		},
		hem(ctx, j) {
			const F = torso(j), s = sway(2.4, 1.2);
			poly(ctx, F, [
				[14, -14],
				[14, 17],
				[7, 17.5],
				[7, -14.5]
			]);
			fillStroke(ctx, grad(ctx, F.x(14, 0), F.y(14, 0), F.x(7, 0), F.y(7, 0), [[0, RE.rope], [1, RE.ropeDk]]), 1.2);
			ctx.strokeStyle = RE.ropeDk;
			ctx.lineWidth = 1;
			ctx.beginPath();
			for (let n = -12; n <= 16; n += 3.5) {
				ctx.moveTo(F.x(14, n), F.y(14, n));
				ctx.lineTo(F.x(7, n + 2.6), F.y(7, n + 2.6));
			}
			ctx.stroke();
			for (const n of [
				-6,
				5,
				14
			]) {
				ctx.beginPath();
				const z = [
					[7, n],
					[1, n + 2.4],
					[-2, n - .4],
					[-8, n + 2.2],
					[-11, n - .4],
					[-17, n + 2 + s],
					[-17, n + 4.6 + s],
					[-11, n + 2.4],
					[-8, n + 4.8],
					[-2, n + 2.2],
					[1, n + 4.8],
					[7, n + 3]
				];
				z.forEach(([u, v], i) => i ? ctx.lineTo(F.x(u, v), F.y(u, v)) : ctx.moveTo(F.x(u, v), F.y(u, v)));
				ctx.closePath();
				fillStroke(ctx, "#f7f4ec", .8);
			}
		},
		front(ctx, j) {
			pauldron(ctx, j.sh, j.elF, false);
		},
		head(ctx, j) {
			ctx.save();
			headFrame(ctx, j);
			const horn = (ox, sc) => {
				ctx.save();
				ctx.translate(ox, -R * .75);
				ctx.scale(sc, sc);
				ctx.beginPath();
				ctx.moveTo(-3.6, 1);
				ctx.bezierCurveTo(-6, -R * 1.1, -R * 1.4, -R * 1.9, -R * 2.3, -R * 2.2);
				ctx.bezierCurveTo(-R * 1.1, -R * 1.5, 1, -R * .9, 3.6, .5);
				ctx.closePath();
				fillStroke(ctx, grad(ctx, 0, 0, -R * 2, -R * 2, [
					[0, RE.cape],
					[.25, RE.boneDk],
					[1, RE.bone]
				]), 1.2);
				ctx.strokeStyle = "rgba(80,60,40,.35)";
				ctx.lineWidth = .7;
				ctx.beginPath();
				for (let k = 1; k < 5; k++) {
					const t = k / 5;
					ctx.moveTo(-3.6 - t * R * 1.2, -t * R * 1.4);
					ctx.lineTo(3 - t * R * 1, -t * R * 1.1);
				}
				ctx.stroke();
				ctx.restore();
			};
			horn(-R * .1, 1.15);
			horn(R * .45, 1.35);
			ctx.beginPath();
			ctx.ellipse(R * .75, -R * .5, 1.6, 2.4, .3, 0, TAU);
			fillStroke(ctx, RE.gold, .8);
			ctx.restore();
		}
	};
	const AO = {
		white: "#eef3f8",
		whiteDk: "#aebdd0",
		blue: "#1f5aa0",
		blueHi: "#4a8fd6",
		silver: "#d6dde8",
		silverDk: "#7d8898"
	};
	function swirl(ctx, x, y, r, col) {
		ctx.strokeStyle = col;
		ctx.lineWidth = Math.max(.8, r * .22);
		ctx.beginPath();
		for (let a = 0; a < 3.4 * Math.PI; a += .25) {
			const q = r * (1 - a / (3.6 * Math.PI));
			const px = x + Math.cos(a) * q, py = y + Math.sin(a) * q;
			if (!a) ctx.moveTo(px, py);
			else ctx.lineTo(px, py);
		}
		ctx.stroke();
	}
	const aoi = {
		ownHead: true,
		pal: {
			cloth: "#e8eef5",
			clothHi: "#ffffff",
			clothDark: "#a9b8cc",
			haori: AO.blue,
			accent: "#7fc4ff",
			accentDark: "#2c6aa8"
		},
		back(ctx, j) {
			const F = torso(j), s = sway(1.7, 3);
			const path = (w) => {
				ctx.beginPath();
				ctx.moveTo(F.x(50, -12), F.y(50, -12));
				ctx.bezierCurveTo(F.x(92, -46 + s), F.y(92, -46 + s), F.x(112, 14 + s), F.y(112, 14 + s), F.x(70, 30 + s * .5), F.y(70, 30 + s * .5));
				ctx.lineTo(F.x(70 - w * .3, 30 + w + s * .5), F.y(70 - w * .3, 30 + w + s * .5));
				ctx.bezierCurveTo(F.x(104, 18 + w + s), F.y(104, 18 + w + s), F.x(86, -40 + w + s), F.y(86, -40 + w + s), F.x(46, -12 + w * .4), F.y(46, -12 + w * .4));
				ctx.closePath();
			};
			path(7);
			fillStroke(ctx, grad(ctx, F.x(100, -20), F.y(100, -20), F.x(60, 20), F.y(60, 20), [
				[0, "#ffffff"],
				[.6, AO.white],
				[1, AO.whiteDk]
			]), 1.3);
			swirl(ctx, F.x(98, -18 + s), F.y(98, -18 + s), 4, AO.blueHi);
			swirl(ctx, F.x(96, 12 + s), F.y(96, 12 + s), 3.4, AO.blueHi);
			ctx.strokeStyle = AO.blue;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(F.x(68, 32 + s * .5), F.y(68, 32 + s * .5));
			ctx.quadraticCurveTo(F.x(60, 44 + s), F.y(60, 44 + s), F.x(54, 40 + s * 1.4), F.y(54, 40 + s * 1.4));
			ctx.stroke();
		},
		body(ctx, j) {
			const F = torso(j);
			poly(ctx, F, [
				[26, -12],
				[26, 13],
				[46, 15],
				[52, 7],
				[52, -9],
				[45, -13]
			]);
			fillStroke(ctx, grad(ctx, F.x(50, 13), F.y(50, 13), F.x(26, -12), F.y(26, -12), [
				[0, "#ffffff"],
				[.5, AO.silver],
				[1, AO.silverDk]
			]), 1.3);
			ctx.strokeStyle = AO.blueHi;
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			for (const u of [31, 37]) {
				ctx.moveTo(F.x(u, -11), F.y(u, -11));
				ctx.lineTo(F.x(u, 14), F.y(u, 14));
			}
			ctx.stroke();
			swirl(ctx, F.x(44, 3), F.y(44, 3), 3.6, AO.blue);
			poly(ctx, F, [
				[14, -13],
				[14, 15],
				[8, 15.5],
				[8, -13.5]
			]);
			fillStroke(ctx, AO.blue, 1.1);
		},
		head(ctx, j) {
			ctx.save();
			headFrame(ctx, j);
			ctx.strokeStyle = LINE;
			ctx.lineWidth = 3.4;
			ctx.beginPath();
			ctx.ellipse(-1, -4.8, R * 1.04, R * .5, -.1, Math.PI * 1.02, Math.PI * 1.98);
			ctx.stroke();
			ctx.strokeStyle = AO.silver;
			ctx.lineWidth = 1.9;
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(R * .72, -R * .78, 3.4, 0, TAU);
			fillStroke(ctx, AO.silver, .9);
			swirl(ctx, R * .72, -R * .78, 2.4, AO.blue);
			ctx.fillStyle = AO.silver;
			ctx.fillRect(-R * .62, -R * 1.5, R * .52, 2.2);
			ctx.restore();
		}
	};
	const YU = {
		white: "#f3f6fa",
		whiteDk: "#b9c4d2",
		ice: "#8fd3ff",
		red: "#d6283a",
		fur: "#ffffff",
		furDk: "#c9d3df"
	};
	const yuki = {
		ownHead: true,
		pal: {
			cloth: "#e7ecf3",
			clothHi: "#ffffff",
			clothDark: "#9ba8ba",
			wrap: "#c8d2df",
			wrapDark: "#8e9aab",
			accent: "#bfe6ff",
			accentDark: "#5a8fb8",
			ui: "#bfe6ff"
		},
		back(ctx, j) {
			const F = torso(j);
			for (let i = 0; i < 3; i++) {
				const s = sway(1.6 + i * .35, 3), a = -1 + i;
				ctx.beginPath();
				ctx.moveTo(F.x(8, -10), F.y(8, -10));
				ctx.bezierCurveTo(F.x(-4 + a * 6, -26 + s), F.y(-4 + a * 6, -26 + s), F.x(10 + a * 16, -44 + s), F.y(10 + a * 16, -44 + s), F.x(24 + a * 18, -40 + s * 1.3), F.y(24 + a * 18, -40 + s * 1.3));
				ctx.bezierCurveTo(F.x(12 + a * 10, -34 + s), F.y(12 + a * 10, -34 + s), F.x(10, -20), F.y(10, -20), F.x(14, -10), F.y(14, -10));
				ctx.closePath();
				fillStroke(ctx, grad(ctx, F.x(10, -10), F.y(10, -10), F.x(20 + a * 16, -42), F.y(20 + a * 16, -42), [
					[0, YU.furDk],
					[.6, YU.fur],
					[1, "#ffffff"]
				]), 1.2);
				ctx.beginPath();
				ctx.arc(F.x(22 + a * 17, -40 + s * 1.3), F.y(22 + a * 17, -40 + s * 1.3), 2.6, 0, TAU);
				ctx.fillStyle = YU.ice;
				ctx.fill();
			}
		},
		body(ctx, j) {
			const F = torso(j);
			ctx.save();
			ctx.translate(F.x(42, 5), F.y(42, 5));
			ctx.strokeStyle = YU.ice;
			ctx.lineWidth = 1.1;
			ctx.beginPath();
			for (let i = 0; i < 6; i++) {
				const a = i / 6 * TAU;
				ctx.moveTo(0, 0);
				ctx.lineTo(Math.cos(a) * 4, Math.sin(a) * 4);
				ctx.moveTo(Math.cos(a) * 2.4, Math.sin(a) * 2.4);
				ctx.lineTo(Math.cos(a + .5) * 3.2, Math.sin(a + .5) * 3.2);
			}
			ctx.stroke();
			ctx.restore();
			poly(ctx, F, [
				[13, -13],
				[13, 15.5],
				[8, 16],
				[8, -13.5]
			]);
			fillStroke(ctx, "#5a8fb8", 1.1);
			ctx.beginPath();
			ctx.arc(F.x(10.5, 12), F.y(10.5, 12), 2, 0, TAU);
			fillStroke(ctx, "#e6edf6", .8);
		},
		head(ctx, j) {
			ctx.save();
			headFrame(ctx, j);
			const ear = (x, sc) => {
				ctx.beginPath();
				ctx.moveTo(x - 3 * sc, -R * .82);
				ctx.lineTo(x - 1 * sc, -R * 1.72);
				ctx.lineTo(x + 4 * sc, -R * .9);
				ctx.closePath();
				fillStroke(ctx, YU.white, 1.1);
				ctx.beginPath();
				ctx.moveTo(x - 1.4 * sc, -R * .95);
				ctx.lineTo(x - .6 * sc, -R * 1.5);
				ctx.lineTo(x + 2.2 * sc, -R * .98);
				ctx.closePath();
				ctx.fillStyle = "#f2a9b6";
				ctx.fill();
			};
			ear(-R * .55, .85);
			ear(R * .15, 1);
			ctx.beginPath();
			ctx.moveTo(R * .05, -R * .62);
			ctx.quadraticCurveTo(R * .85, -R * .62, R * 1.02, -2.4);
			ctx.lineTo(R * 1.65, 2.2);
			ctx.quadraticCurveTo(R * 1.35, 4.6, R * .9, 4.2);
			ctx.quadraticCurveTo(R * .6, R * .62, R * .05, R * .5);
			ctx.closePath();
			fillStroke(ctx, grad(ctx, R * 1.2, -R * .5, 0, R * .5, [[0, "#ffffff"], [1, YU.whiteDk]]), 1.2);
			ctx.strokeStyle = YU.red;
			ctx.lineWidth = 1.3;
			ctx.lineCap = "round";
			ctx.beginPath();
			ctx.moveTo(R * .45, -R * .45);
			ctx.quadraticCurveTo(R * .7, -R * .2, R * .95, -R * .35);
			ctx.moveTo(R * .55, 1);
			ctx.lineTo(R * 1.05, .2);
			ctx.moveTo(R * .55, 3);
			ctx.lineTo(R * 1, 2.8);
			ctx.stroke();
			ctx.fillStyle = "#101216";
			ctx.beginPath();
			ctx.ellipse(R * .8, -2.2, 1.8, .7, -.3, 0, TAU);
			ctx.fill();
			ctx.fillStyle = YU.red;
			ctx.beginPath();
			ctx.arc(R * 1.6, 2.2, 1, 0, TAU);
			ctx.fill();
			ctx.restore();
		}
	};
	const HA = {
		pink: "#f7d7e4",
		pinkHi: "#fff1f6",
		pinkDk: "#c4819e",
		petal: "#ff8fbf",
		petalDk: "#d45a8f",
		gold: "#e8b94e",
		goldDk: "#9a7022",
		plum: "#3a1830"
	};
	function blossom(ctx, x, y, r, col, core) {
		ctx.fillStyle = col;
		for (let i = 0; i < 5; i++) {
			const a = i / 5 * TAU - Math.PI / 2;
			ctx.beginPath();
			ctx.ellipse(x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, r * .5, r * .34, a, 0, TAU);
			ctx.fill();
		}
		ctx.fillStyle = core;
		ctx.beginPath();
		ctx.arc(x, y, r * .22, 0, TAU);
		ctx.fill();
	}
	const hana = {
		ownHead: true,
		pal: {
			cloth: "#f4d3e1",
			clothHi: "#fff0f6",
			clothDark: "#b97a95",
			hakama: "#2e1427",
			hakamaDark: "#1b0b17",
			accent: "#ff7fb6",
			accentDark: "#b53a74",
			ui: "#ff8fbf",
			hood: {
				cloth: "#2e1427",
				clothHi: "#4c2542",
				clothDark: "#1b0b17"
			}
		},
		back(ctx, j) {
			const F = torso(j), s = sway(2, 1.5);
			for (const [du, dn] of [[10, -12], [-8, -14]]) {
				ctx.beginPath();
				ctx.moveTo(F.x(14, -12), F.y(14, -12));
				ctx.bezierCurveTo(F.x(14 + du * 1.6, -12 + dn), F.y(14 + du * 1.6, -12 + dn), F.x(14 + du * 2.4, -12 + dn * 2.4 + s), F.y(14 + du * 2.4, -12 + dn * 2.4 + s), F.x(14 + du * .6, -14 + dn * 1.8 + s), F.y(14 + du * .6, -14 + dn * 1.8 + s));
				ctx.closePath();
				fillStroke(ctx, grad(ctx, F.x(14, -12), F.y(14, -12), F.x(14 + du * 2, -12 + dn * 2), F.y(14 + du * 2, -12 + dn * 2), [
					[0, HA.goldDk],
					[.5, HA.gold],
					[1, "#fff0c2"]
				]), 1.2);
			}
			for (const dn of [-4, 2]) {
				poly(ctx, F, [
					[12, -13 + dn],
					[-18, -15 + dn + s],
					[-20, -9 + dn + s],
					[10, -9 + dn]
				]);
				fillStroke(ctx, HA.petalDk, 1);
			}
			ctx.beginPath();
			ctx.arc(F.x(14, -13), F.y(14, -13), 3, 0, TAU);
			fillStroke(ctx, HA.petal, .9);
		},
		body(ctx, j) {
			const F = torso(j);
			for (const [u, n, r] of [
				[
					44,
					6,
					3.2
				],
				[
					36,
					-5,
					2.6
				],
				[
					28,
					8,
					2.8
				],
				[
					48,
					-6,
					2.2
				],
				[
					22,
					-2,
					2.4
				]
			]) blossom(ctx, F.x(u, n), F.y(u, n), r, HA.petal, HA.gold);
			poly(ctx, F, [
				[18, -13.5],
				[18, 16],
				[8, 16.5],
				[8, -14]
			]);
			fillStroke(ctx, grad(ctx, F.x(18, 0), F.y(18, 0), F.x(8, 0), F.y(8, 0), [
				[0, "#fff0c2"],
				[.5, HA.gold],
				[1, HA.goldDk]
			]), 1.2);
			ctx.strokeStyle = HA.petalDk;
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			ctx.moveTo(F.x(13, -13.5), F.y(13, -13.5));
			ctx.lineTo(F.x(13, 16.2), F.y(13, 16.2));
			ctx.stroke();
			ctx.strokeStyle = HA.petal;
			ctx.lineWidth = 2.2;
			ctx.beginPath();
			ctx.moveTo(F.x(55, 2), F.y(55, 2));
			ctx.lineTo(F.x(36, 12), F.y(36, 12));
			ctx.stroke();
		},
		hem(ctx, j) {
			const F = torso(j), s = sway(2.3, 1.5);
			poly(ctx, F, [
				[9, -14],
				[9, 16.5],
				[-12, 23 + s],
				[-17, 5 + s],
				[-14, -20 + s]
			]);
			fillStroke(ctx, grad(ctx, F.x(8, 0), F.y(8, 0), F.x(-15, 0), F.y(-15, 0), [
				[0, HA.pinkHi],
				[.5, HA.pink],
				[1, HA.pinkDk]
			]), 1.2);
			ctx.strokeStyle = HA.petalDk;
			ctx.lineWidth = 2.2;
			ctx.beginPath();
			ctx.moveTo(F.x(-14, -20 + s), F.y(-14, -20 + s));
			ctx.lineTo(F.x(-17, 5 + s), F.y(-17, 5 + s));
			ctx.lineTo(F.x(-12, 23 + s), F.y(-12, 23 + s));
			ctx.stroke();
			for (const [u, n] of [
				[-6, 10],
				[-2, -6],
				[-10, 3]
			]) blossom(ctx, F.x(u, n + s * .5), F.y(u, n + s * .5), 2.4, HA.petal, HA.gold);
		},
		head(ctx, j) {
			ctx.save();
			headFrame(ctx, j);
			for (const [x, y, r] of [
				[
					-R * .55,
					-R * 1.02,
					3.4
				],
				[
					-R * .1,
					-R * 1.12,
					2.8
				],
				[
					-R * .9,
					-R * .7,
					2.6
				]
			]) blossom(ctx, x, y, r, HA.petal, HA.gold);
			ctx.strokeStyle = HA.gold;
			ctx.lineWidth = .9;
			ctx.beginPath();
			ctx.moveTo(-R * .9, -R * .6);
			ctx.lineTo(-R * 1, R * .1);
			ctx.moveTo(-R * .7, -R * .62);
			ctx.lineTo(-R * .76, R * .25);
			ctx.stroke();
			for (const [x, y] of [[-R * 1, R * .12], [-R * .76, R * .27]]) {
				ctx.fillStyle = HA.petal;
				ctx.beginPath();
				ctx.ellipse(x, y + 1.4, 1.2, 2, 0, 0, TAU);
				ctx.fill();
			}
			ctx.restore();
		}
	};
	const KA = {
		cloak: "#0b0c0f",
		cloakHi: "#23262e",
		cloakDk: "#040405",
		fire: "#7be08f",
		fireDk: "#2a6b38",
		silver: "#c9cfd8"
	};
	function ghostEdge(ctx, pts) {
		ctx.save();
		ctx.globalCompositeOperation = "lighter";
		ctx.strokeStyle = "rgba(123,224,143,.55)";
		ctx.lineWidth = 3;
		ctx.beginPath();
		pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
		ctx.stroke();
		ctx.strokeStyle = "rgba(210,255,220,.8)";
		ctx.lineWidth = 1;
		ctx.stroke();
		ctx.restore();
	}
	const kage = {
		ownHead: true,
		pal: {
			accent: "#8dff9f",
			accentDark: "#2f7f40"
		},
		back(ctx, j) {
			const F = torso(j), s = sway(1.8, 3);
			const hem = [];
			for (let i = 0; i <= 8; i++) {
				const n = -2 - i * 5;
				hem.push([(i % 2 ? -78 : -66) + s * (.5 + i * .1), n + s * .4]);
			}
			const pts = [
				[58, -4],
				[56, -18],
				[24, -34 + s * .5],
				...hem.reverse(),
				[-60, 2],
				[10, -8]
			];
			poly(ctx, F, pts);
			fillStroke(ctx, grad(ctx, F.x(56, -10), F.y(56, -10), F.x(-60, -20), F.y(-60, -20), [
				[0, KA.cloakHi],
				[.4, KA.cloak],
				[1, KA.cloakDk]
			]), 1.3);
			ghostEdge(ctx, hem.map(([u, n]) => [F.x(u, n), F.y(u, n)]));
		},
		body(ctx, j) {
			const F = torso(j);
			poly(ctx, F, [
				[66, -12],
				[68, 4],
				[58, 10],
				[54, -2],
				[56, -12]
			]);
			fillStroke(ctx, grad(ctx, F.x(66, 0), F.y(66, 0), F.x(54, 0), F.y(54, 0), [[0, KA.cloakHi], [1, KA.cloakDk]]), 1.2);
			ghostEdge(ctx, [
				[F.x(66, -12), F.y(66, -12)],
				[F.x(68, 4), F.y(68, 4)],
				[F.x(58, 10), F.y(58, 10)]
			]);
			ctx.strokeStyle = KA.silver;
			ctx.lineWidth = 1.3;
			ctx.beginPath();
			ctx.moveTo(F.x(54, -6), F.y(54, -6));
			ctx.quadraticCurveTo(F.x(49, 3), F.y(49, 3), F.x(54, 9), F.y(54, 9));
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(F.x(51, 2), F.y(51, 2), 2.2, 0, TAU);
			fillStroke(ctx, KA.silver, .8);
		},
		front(ctx, j) {
			const F = torso(j), s = sway(1.8, 1.5);
			poly(ctx, F, [
				[58, -2],
				[58, 14],
				[38, 18 + s],
				[34, 8 + s],
				[46, 0]
			]);
			fillStroke(ctx, grad(ctx, F.x(58, 6), F.y(58, 6), F.x(36, 14), F.y(36, 14), [[0, KA.cloakHi], [1, KA.cloak]]), 1.2);
			ghostEdge(ctx, [
				[F.x(58, 14), F.y(58, 14)],
				[F.x(38, 18 + s), F.y(38, 18 + s)],
				[F.x(34, 8 + s), F.y(34, 8 + s)]
			]);
		},
		head(ctx, j) {
			ctx.save();
			headFrame(ctx, j);
			ctx.beginPath();
			ctx.moveTo(R * 1.35, -4);
			ctx.quadraticCurveTo(R * .8, -R * 1.9, -R * .6, -R * 1.95);
			ctx.quadraticCurveTo(-R * 2.3, -R * 1.5, -R * 1.9, R * .9);
			ctx.quadraticCurveTo(-R * 1.1, 0, -R * .6, -R * 1.2);
			ctx.quadraticCurveTo(R * .3, -R * 1.3, R * 1.1, -5.8);
			ctx.closePath();
			fillStroke(ctx, grad(ctx, R, -R * 1.8, -R * 1.5, R * .5, [
				[0, KA.cloakHi],
				[.5, KA.cloak],
				[1, KA.cloakDk]
			]), 1.4);
			ghostEdge(ctx, [
				[R * 1.35, -4],
				[R * .8, -R * 1.72],
				[-R * .6, -R * 1.9]
			]);
			ctx.save();
			ctx.translate(R * .55, -R * 1.45);
			ctx.rotate(-.3);
			ctx.beginPath();
			ctx.moveTo(0, -3.4);
			ctx.lineTo(2.4, 0);
			ctx.lineTo(0, 3.4);
			ctx.lineTo(-2.4, 0);
			ctx.closePath();
			fillStroke(ctx, KA.silver, .8);
			ctx.restore();
			ctx.restore();
		}
	};
	const TO = {
		fur: "#e08a1e",
		furHi: "#f7b54a",
		furDk: "#9c5409",
		stripe: "#1a100a",
		belly: "#f6ead2",
		claw: "#f3ecd8",
		gold: "#f6cf1d"
	};
	function stripes(ctx, pts, w) {
		ctx.strokeStyle = TO.stripe;
		ctx.lineWidth = w;
		ctx.lineCap = "round";
		for (const seg of pts) {
			ctx.beginPath();
			seg.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
			ctx.stroke();
		}
	}
	const tora = {
		pal: {
			accent: "#f6cf1d",
			accentDark: "#8a5a10"
		},
		back(ctx, j) {
			const F = torso(j), s = sway(1.9, 2.5);
			poly(ctx, F, [
				[60, -4],
				[58, -16],
				[30, -22 + s * .4],
				[-12, -22 + s],
				[-16, -12 + s],
				[0, -8],
				[30, -8]
			]);
			fillStroke(ctx, grad(ctx, F.x(58, -12), F.y(58, -12), F.x(-12, -20), F.y(-12, -20), [
				[0, TO.furHi],
				[.5, TO.fur],
				[1, TO.furDk]
			]), 1.3);
			stripes(ctx, [
				[
					45,
					30,
					15,
					0
				].map((u) => [F.x(u, -9), F.y(u, -9)]).slice(0, 1).concat([[F.x(44, -19), F.y(44, -19)]]),
				[[F.x(34, -9), F.y(34, -9)], [F.x(30, -20 + s * .3), F.y(30, -20 + s * .3)]],
				[[F.x(18, -9), F.y(18, -9)], [F.x(14, -21 + s * .6), F.y(14, -21 + s * .6)]],
				[[F.x(2, -10), F.y(2, -10)], [F.x(-2, -20 + s * .8), F.y(-2, -20 + s * .8)]]
			], 2.2);
			ctx.strokeStyle = LINE;
			ctx.lineWidth = 5;
			ctx.lineCap = "round";
			const tail = () => {
				ctx.beginPath();
				ctx.moveTo(F.x(-14, -16 + s), F.y(-14, -16 + s));
				ctx.bezierCurveTo(F.x(-30, -24 + s * 1.4), F.y(-30, -24 + s * 1.4), F.x(-44, -10 + s * 1.6), F.y(-44, -10 + s * 1.6), F.x(-36, -2 + s * 1.8), F.y(-36, -2 + s * 1.8));
			};
			tail();
			ctx.stroke();
			tail();
			ctx.strokeStyle = TO.fur;
			ctx.lineWidth = 3.2;
			ctx.stroke();
			ctx.setLineDash([2.5, 3.5]);
			tail();
			ctx.strokeStyle = TO.stripe;
			ctx.lineWidth = 3.2;
			ctx.stroke();
			ctx.setLineDash([]);
		},
		body(ctx, j) {
			const F = torso(j);
			poly(ctx, F, [
				[60, -12],
				[57, -4],
				[22, -7],
				[16, -15],
				[40, -16]
			]);
			fillStroke(ctx, grad(ctx, F.x(58, -8), F.y(58, -8), F.x(18, -12), F.y(18, -12), [[0, TO.furHi], [1, TO.fur]]), 1.1);
			stripes(ctx, [
				[[F.x(50, -15), F.y(50, -15)], [F.x(48, -6), F.y(48, -6)]],
				[[F.x(40, -16), F.y(40, -16)], [F.x(38, -6.5), F.y(38, -6.5)]],
				[[F.x(30, -15.5), F.y(30, -15.5)], [F.x(29, -7), F.y(29, -7)]]
			], 1.8);
			poly(ctx, F, [
				[60, -2],
				[58, 12],
				[48, 14],
				[50, 4],
				[54, -4]
			]);
			fillStroke(ctx, grad(ctx, F.x(60, 8), F.y(60, 8), F.x(48, 8), F.y(48, 8), [[0, TO.furHi], [1, TO.fur]]), 1.1);
			stripes(ctx, [[[F.x(56, 2), F.y(56, 2)], [F.x(54, 11), F.y(54, 11)]]], 1.8);
			for (let i = 0; i < 7; i++) {
				const t = i / 6, u = 50 - Math.sin(t * Math.PI) * 10, n = -8 + t * 20;
				ctx.save();
				ctx.translate(F.x(u, n), F.y(u, n));
				ctx.rotate(Math.atan2(F.uy, F.ux) + Math.PI);
				ctx.beginPath();
				ctx.moveTo(-1.4, 0);
				ctx.quadraticCurveTo(0, 5, 1.8, 6.2);
				ctx.quadraticCurveTo(.6, 3, 1.4, 0);
				ctx.closePath();
				fillStroke(ctx, TO.claw, .7);
				ctx.restore();
			}
		},
		head(ctx, j) {
			ctx.save();
			headFrame(ctx, j);
			ctx.beginPath();
			ctx.moveTo(-R * .2, -R * 1.1);
			ctx.quadraticCurveTo(-R * 1.7, -R * .7, -R * 1.5, R * 1.1);
			ctx.lineTo(-R * .6, R * .6);
			ctx.quadraticCurveTo(-R * .7, -R * .2, -R * .2, -R * .5);
			ctx.closePath();
			fillStroke(ctx, grad(ctx, 0, -R, -R * 1.4, R, [[0, TO.fur], [1, TO.furDk]]), 1.1);
			ctx.beginPath();
			ctx.moveTo(-R * 1.05, -1);
			ctx.bezierCurveTo(-R * 1.15, -R * 1.5, R * 1.2, -R * 1.55, R * 1.45, -R * .35);
			ctx.quadraticCurveTo(R * .8, -R * .55, R * .1, -R * .35);
			ctx.quadraticCurveTo(-R * .5, -R * .3, -R * 1.05, -1);
			ctx.closePath();
			fillStroke(ctx, grad(ctx, R * .5, -R * 1.4, -R * .5, 0, [
				[0, TO.furHi],
				[.5, TO.fur],
				[1, TO.furDk]
			]), 1.3);
			for (const x of [-R * .55, R * .1]) {
				ctx.beginPath();
				ctx.arc(x, -R * 1.2, 3.4, Math.PI, TAU);
				ctx.closePath();
				fillStroke(ctx, TO.fur, 1);
				ctx.fillStyle = TO.belly;
				ctx.beginPath();
				ctx.arc(x, -R * 1.18, 1.7, Math.PI, TAU);
				ctx.fill();
			}
			stripes(ctx, [
				[[R * .1, -R * 1.3], [R * .05, -R * .75]],
				[[-R * .35, -R * 1.3], [-R * .45, -R * .7]],
				[[R * .55, -R * 1.1], [R * .4, -R * .7]]
			], 1.6);
			ctx.fillStyle = TO.belly;
			ctx.beginPath();
			ctx.ellipse(R * 1.15, -R * .42, 4.2, 2.6, .1, 0, TAU);
			ctx.fill();
			ctx.fillStyle = "#1a100a";
			ctx.beginPath();
			ctx.arc(R * 1.55, -R * .42, 1.3, 0, TAU);
			ctx.fill();
			ctx.fillStyle = TO.gold;
			ctx.beginPath();
			ctx.ellipse(R * .6, -R * .82, 1.8, 1.1, -.3, 0, TAU);
			ctx.fill();
			ctx.fillStyle = "#1a100a";
			ctx.beginPath();
			ctx.ellipse(R * .62, -R * .82, .5, 1, -.3, 0, TAU);
			ctx.fill();
			for (const x of [R * 1, R * 1.3]) {
				ctx.beginPath();
				ctx.moveTo(x - 1, -R * .3);
				ctx.lineTo(x, -R * .3 + 4.4);
				ctx.lineTo(x + 1, -R * .3);
				ctx.closePath();
				fillStroke(ctx, TO.claw, .6);
			}
			ctx.restore();
		}
	};
	const JI = {
		purple: "#3f1f5e",
		purpleHi: "#62388c",
		purpleDk: "#24103a",
		gold: "#dcae42",
		goldHi: "#f7da8a",
		goldDk: "#8e6516",
		red: "#9c2f2a",
		jade: "#3fae7d",
		crystal: "#e6f0ff"
	};
	const jin = {
		ownHead: true,
		pal: {
			cloth: "#46236a",
			clothHi: "#6a3f95",
			clothDark: "#27113d",
			accent: "#dcae42",
			accentDark: "#8e6516",
			ui: "#f0c860"
		},
		back(ctx, j) {
			const F = torso(j);
			poly(ctx, F, [
				[56, -10],
				[54, -16],
				[14, -16],
				[12, -8]
			]);
			fillStroke(ctx, grad(ctx, F.x(54, -14), F.y(54, -14), F.x(14, -14), F.y(14, -14), [
				[0, JI.goldHi],
				[.5, JI.gold],
				[1, JI.goldDk]
			]), 1.1);
		},
		body(ctx, j) {
			const F = torso(j);
			poly(ctx, F, [
				[58, -12],
				[50, -14],
				[12, 4],
				[10, 16],
				[22, 16],
				[58, -2]
			]);
			fillStroke(ctx, grad(ctx, F.x(56, -8), F.y(56, -8), F.x(14, 14), F.y(14, 14), [
				[0, JI.goldHi],
				[.45, JI.gold],
				[1, JI.goldDk]
			]), 1.3);
			ctx.strokeStyle = JI.red;
			ctx.lineWidth = 1;
			ctx.beginPath();
			for (const t of [
				.2,
				.4,
				.6,
				.8
			]) {
				const u0 = 58 - t * 46, n0 = -12 + t * 16;
				ctx.moveTo(F.x(u0, n0 - 2), F.y(u0, n0 - 2));
				ctx.lineTo(F.x(u0 + 2, n0 + 11), F.y(u0 + 2, n0 + 11));
			}
			ctx.moveTo(F.x(54, -6), F.y(54, -6));
			ctx.lineTo(F.x(16, 10), F.y(16, 10));
			ctx.stroke();
			ctx.strokeStyle = LINE;
			ctx.lineWidth = 3.4;
			ctx.beginPath();
			ctx.arc(F.x(46, 2), F.y(46, 2), 3, 0, TAU);
			ctx.stroke();
			ctx.strokeStyle = JI.jade;
			ctx.lineWidth = 2;
			ctx.stroke();
			for (let i = 0; i <= 14; i++) {
				const t = i / 14, a = t * Math.PI, u = 56 - Math.sin(a) * 22, n = -6 + t * 16;
				ctx.beginPath();
				ctx.arc(F.x(u, n), F.y(u, n), i === 7 ? 2.6 : 1.7, 0, TAU);
				fillStroke(ctx, i === 7 ? JI.jade : JI.crystal, .7);
			}
		},
		hem(ctx, j) {
			const F = torso(j), s = sway(1.6, 1.5);
			poly(ctx, F, [
				[8, -14],
				[8, 16],
				[-66, 26 + s],
				[-70, 4 + s],
				[-66, -22 + s]
			]);
			fillStroke(ctx, grad(ctx, F.x(8, 0), F.y(8, 0), F.x(-66, 0), F.y(-66, 0), [
				[0, JI.purpleHi],
				[.5, JI.purple],
				[1, JI.purpleDk]
			]), 1.3);
			ctx.strokeStyle = JI.gold;
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(F.x(-65, -21 + s), F.y(-65, -21 + s));
			ctx.lineTo(F.x(-69, 4 + s), F.y(-69, 4 + s));
			ctx.lineTo(F.x(-65, 25 + s), F.y(-65, 25 + s));
			ctx.stroke();
			ctx.strokeStyle = "rgba(0,0,0,.3)";
			ctx.lineWidth = 1.1;
			ctx.beginPath();
			for (const n of [
				-12,
				-2,
				8
			]) {
				ctx.moveTo(F.x(4, n), F.y(4, n));
				ctx.lineTo(F.x(-62, n * 1.5 + s), F.y(-62, n * 1.5 + s));
			}
			ctx.stroke();
		},
		head(ctx, j) {
			ctx.save();
			headFrame(ctx, j);
			ctx.beginPath();
			ctx.arc(R * .72, -R * .62, 1.7, 0, TAU);
			fillStroke(ctx, JI.goldHi, .7);
			ctx.restore();
		}
	};
	const MA = {
		robe: "#8e1e7e",
		robeHi: "#c248b0",
		robeDk: "#4e0c45",
		layers: [
			"#f7e6b8",
			"#2f8f6a",
			"#ffffff",
			"#e04fd8"
		],
		gold: "#e6b94a",
		goldHi: "#fff0b0",
		red: "#c81e3a",
		white: "#fbf5ee"
	};
	function sleeve(ctx, el, ha, dim) {
		const mx = (el.x + ha.x) / 2, my = (el.y + ha.y) / 2, s = sway(2.2, 2);
		ctx.beginPath();
		ctx.moveTo(el.x, el.y);
		ctx.quadraticCurveTo(mx - 6 + s, my + 22, mx - 2 + s, my + 34);
		ctx.lineTo(mx + 9 + s, my + 30);
		ctx.quadraticCurveTo(ha.x + 4, ha.y + 12, ha.x, ha.y);
		ctx.closePath();
		fillStroke(ctx, dim ? MA.robeDk : grad(ctx, el.x, el.y, mx, my + 34, [
			[0, MA.robeHi],
			[.6, MA.robe],
			[1, MA.robeDk]
		]), 1.1);
		if (dim) return;
		ctx.strokeStyle = MA.layers[0];
		ctx.lineWidth = 1.6;
		ctx.beginPath();
		ctx.moveTo(mx - 2 + s, my + 34);
		ctx.lineTo(mx + 9 + s, my + 30);
		ctx.stroke();
	}
	const mai = {
		ownHead: true,
		pal: {
			cloth: "#9a2488",
			clothHi: "#cc55b8",
			clothDark: "#521048",
			accent: "#e6b94a",
			accentDark: "#8f6a1c",
			ui: "#ec63e4",
			hood: {
				cloth: "#2a0f28",
				clothHi: "#4a1f46",
				clothDark: "#170816"
			}
		},
		back(ctx, j) {
			const F = torso(j), s = sway(1.4, 2);
			poly(ctx, F, [
				[16, -10],
				[10, -16],
				[-50, -34 + s],
				[-86, -48 + s * 1.3],
				[-84, -30 + s],
				[-60, -12],
				[-20, -6]
			]);
			fillStroke(ctx, grad(ctx, F.x(12, -12), F.y(12, -12), F.x(-84, -40), F.y(-84, -40), [
				[0, MA.robeHi],
				[.5, MA.robe],
				[1, MA.robeDk]
			]), 1.2);
			ctx.strokeStyle = MA.gold;
			ctx.lineWidth = 1.4;
			ctx.beginPath();
			ctx.moveTo(F.x(-86, -48 + s * 1.3), F.y(-86, -48 + s * 1.3));
			ctx.lineTo(F.x(-84, -30 + s), F.y(-84, -30 + s));
			ctx.stroke();
		},
		backArm(ctx, j) {
			sleeve(ctx, j.elB, j.haB, true);
		},
		body(ctx, j) {
			const F = torso(j);
			MA.layers.forEach((col, i) => {
				ctx.strokeStyle = col;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(F.x(56 - i * .5, -2 + i * 2.2), F.y(56 - i * .5, -2 + i * 2.2));
				ctx.lineTo(F.x(30 - i, 13 + i * .4), F.y(30 - i, 13 + i * .4));
				ctx.stroke();
			});
			poly(ctx, F, [
				[20, -13.5],
				[20, 16],
				[9, 16.5],
				[9, -14]
			]);
			fillStroke(ctx, grad(ctx, F.x(20, 0), F.y(20, 0), F.x(9, 0), F.y(9, 0), [
				[0, MA.goldHi],
				[.5, MA.gold],
				[1, "#8f6a1c"]
			]), 1.2);
			ctx.strokeStyle = MA.red;
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			ctx.moveTo(F.x(14.5, -13.5), F.y(14.5, -13.5));
			ctx.lineTo(F.x(14.5, 16.2), F.y(14.5, 16.2));
			ctx.stroke();
		},
		front(ctx, j) {
			sleeve(ctx, j.elF, j.haF, false);
		},
		head(ctx, j) {
			ctx.save();
			headFrame(ctx, j);
			ctx.strokeStyle = LINE;
			ctx.lineWidth = 3.4;
			ctx.beginPath();
			ctx.ellipse(-1, -5.5, R * 1.02, R * .46, -.1, Math.PI * 1.03, Math.PI * 1.97);
			ctx.stroke();
			ctx.strokeStyle = MA.gold;
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(R * .25, -R * .95);
			ctx.lineTo(R * .1, -R * 2);
			ctx.quadraticCurveTo(R * .5, -R * 1.85, R * .75, -R * 2.3);
			ctx.quadraticCurveTo(R * .8, -R * 1.5, R * .85, -R * .85);
			ctx.closePath();
			fillStroke(ctx, grad(ctx, 0, -R * 2.2, 0, -R * .8, [[0, MA.goldHi], [1, MA.gold]]), 1);
			ctx.fillStyle = MA.red;
			ctx.beginPath();
			ctx.arc(R * .5, -R * 1.4, 1.6, 0, TAU);
			ctx.fill();
			ctx.strokeStyle = MA.gold;
			ctx.lineWidth = .8;
			ctx.beginPath();
			for (const x of [
				-R * .6,
				-R * .2,
				R * .2
			]) {
				ctx.moveTo(x, -R * .95);
				ctx.lineTo(x - 1, -R * .35);
			}
			ctx.stroke();
			ctx.fillStyle = MA.goldHi;
			for (const x of [
				-R * .6,
				-R * .2,
				R * .2
			]) {
				ctx.beginPath();
				ctx.arc(x - 1, -R * .3, 1.1, 0, TAU);
				ctx.fill();
			}
			const s = sway(2.4, 2);
			ctx.strokeStyle = MA.red;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(-R * .9, -R * .7);
			ctx.quadraticCurveTo(-R * 1.6 + s, R * .2, -R * 1.3 + s, R * 1.3);
			ctx.stroke();
			ctx.restore();
		}
	};
	const TS = {
		hat: "#b98a4a",
		hatHi: "#e7c07a",
		hatDk: "#6e4a1c",
		indigo: "#1f3350",
		indigoHi: "#3b5a86",
		indigoDk: "#0f1a2a",
		red: "#c42a2a",
		deer: "#b8763a",
		deerHi: "#dca064",
		deerDk: "#6b3e16",
		white: "#f4f1ea"
	};
	const tsubame = {
		pal: {
			cloth: "#243a5c",
			clothHi: "#3e5f8e",
			clothDark: "#121f33",
			accent: "#45dcef",
			accentDark: "#1a7a88"
		},
		body(ctx, j) {
			const F = torso(j);
			ctx.strokeStyle = TS.white;
			ctx.lineWidth = 2.4;
			ctx.beginPath();
			ctx.moveTo(F.x(56, 0), F.y(56, 0));
			ctx.lineTo(F.x(32, 13), F.y(32, 13));
			ctx.stroke();
			ctx.save();
			ctx.translate(F.x(42, -4), F.y(42, -4));
			ctx.scale(F.d, 1);
			ctx.beginPath();
			ctx.moveTo(-4.5, -1.5);
			ctx.quadraticCurveTo(-1, 0, 0, 2.6);
			ctx.quadraticCurveTo(1, 0, 4.5, -1.5);
			ctx.quadraticCurveTo(1.4, .6, .6, 4.6);
			ctx.lineTo(-.6, 4.6);
			ctx.quadraticCurveTo(-1.4, .6, -4.5, -1.5);
			ctx.closePath();
			ctx.fillStyle = TS.white;
			ctx.fill();
			ctx.restore();
			ctx.strokeStyle = TS.red;
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			ctx.moveTo(F.x(40, 12), F.y(40, 12));
			ctx.lineTo(F.x(34, 17), F.y(34, 17));
			ctx.moveTo(F.x(40, 12), F.y(40, 12));
			ctx.lineTo(F.x(36, 18.5), F.y(36, 18.5));
			ctx.stroke();
			poly(ctx, F, [
				[14, -13.5],
				[14, 15.5],
				[8, 16],
				[8, -14]
			]);
			fillStroke(ctx, TS.white, 1);
		},
		hem(ctx, j) {
			const F = torso(j), s = sway(2, 1.2);
			poly(ctx, F, [
				[8, -2],
				[8, 17],
				[-40, 22 + s],
				[-44, 8 + s],
				[-40, -4 + s]
			]);
			fillStroke(ctx, grad(ctx, F.x(8, 8), F.y(8, 8), F.x(-42, 8), F.y(-42, 8), [
				[0, TS.deerHi],
				[.5, TS.deer],
				[1, TS.deerDk]
			]), 1.2);
			ctx.fillStyle = "#f3e3c6";
			for (const [u, n] of [
				[-6, 4],
				[-14, 12],
				[-20, 2],
				[-28, 9],
				[-34, 16],
				[-8, 14],
				[-24, 18],
				[-36, 3]
			]) {
				ctx.beginPath();
				ctx.ellipse(F.x(u, n + s * .4), F.y(u, n + s * .4), 1.5, 1, 0, 0, TAU);
				ctx.fill();
			}
			ctx.strokeStyle = TS.deerDk;
			ctx.lineWidth = 1.8;
			ctx.beginPath();
			ctx.moveTo(F.x(-40, -4 + s), F.y(-40, -4 + s));
			ctx.lineTo(F.x(-44, 8 + s), F.y(-44, 8 + s));
			ctx.lineTo(F.x(-40, 22 + s), F.y(-40, 22 + s));
			ctx.stroke();
		},
		front(ctx, j) {
			const e = j.elF, h = j.haF, mx = e.x + (h.x - e.x) * .72, my = e.y + (h.y - e.y) * .72;
			ctx.strokeStyle = TS.red;
			ctx.lineWidth = 1.8;
			ctx.beginPath();
			ctx.arc(mx, my, 4.2, 0, TAU);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(mx, my + 4);
			ctx.lineTo(mx - 2, my + 10 + sway(2.5, 1.5));
			ctx.stroke();
		},
		head(ctx, j) {
			ctx.save();
			headFrame(ctx, j);
			ctx.strokeStyle = TS.red;
			ctx.lineWidth = 1.4;
			ctx.beginPath();
			ctx.moveTo(-R * .35, -R * .4);
			ctx.quadraticCurveTo(R * .2, R * .9, R * .8, R * .72);
			ctx.stroke();
			ctx.save();
			ctx.rotate(.12);
			const hy = -R * .7;
			ctx.beginPath();
			ctx.ellipse(0, hy, R * 1.9, R * .42, 0, 0, TAU);
			fillStroke(ctx, grad(ctx, R, hy - 4, -R, hy + 4, [
				[0, TS.hatHi],
				[.5, TS.hat],
				[1, TS.hatDk]
			]), 1.3);
			ctx.strokeStyle = "rgba(80,50,20,.5)";
			ctx.lineWidth = .7;
			ctx.beginPath();
			for (const r of [
				.45,
				.9,
				1.4
			]) ctx.ellipse(0, hy, R * r, R * r * .22, 0, 0, TAU);
			ctx.stroke();
			ctx.beginPath();
			ctx.ellipse(0, hy - 2.4, R * .55, R * .42, 0, Math.PI, TAU);
			ctx.closePath();
			fillStroke(ctx, "#2a1a10", 1.1);
			ctx.strokeStyle = TS.red;
			ctx.lineWidth = 1.4;
			ctx.beginPath();
			ctx.ellipse(0, hy - .4, R * .56, R * .14, 0, 0, Math.PI);
			ctx.stroke();
			ctx.restore();
			ctx.restore();
		}
	};
	Object.assign(ND.COSTUMES, {
		champion_akane: akane,
		champion_kuro: kuro,
		champion_tetsu: tetsu,
		champion_ren: ren,
		champion_aoi: aoi,
		champion_yuki: yuki,
		champion_hana: hana,
		champion_kage: kage,
		champion_tora: tora,
		champion_jin: jin,
		champion_mai: mai,
		champion_tsubame: tsubame
	});
})(window.ND);
