(function(ND) {
	"use strict";
	if (!ND) return;
	const NAMES = [
		"Ashigaru",
		"Rōnin",
		"Samurai",
		"Hatamoto",
		"Daimyō",
		"Shōgun"
	];
	const KANJI = [
		"足軽",
		"浪人",
		"侍",
		"旗本",
		"大名",
		"将軍"
	];
	const TCOL = [
		"#9aa3ad",
		"#8fb3c9",
		"#d9b36c",
		"#e38b5c",
		"#c65bd0",
		"#ffd35a"
	];
	const DIV = [
		"",
		"I",
		"II",
		"III"
	];
	const INK = "#0a0b12";
	const GOLD = "#d9b36c", GOLD_HI = "#f6dfa6", GOLD_DK = "#7d5d24";
	const JP = "'Noto Serif JP','Yu Mincho','YuMincho','Hiragino Mincho ProN','Noto Serif CJK JP','Source Han Serif',serif";
	const n1 = (v) => Math.round(v * 10) / 10;
	function rgb(h) {
		if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
		const x = parseInt(h.slice(1), 16);
		return [
			x >> 16,
			x >> 8 & 255,
			x & 255
		];
	}
	function mix(a, b, t) {
		const A = rgb(a), B = rgb(b);
		return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
	}
	const poly = (pts) => "M" + pts.map((p) => n1(p[0]) + " " + n1(p[1])).join("L") + "Z";
	const circ = (cx, cy, r, a) => `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}" ${a || ""}/>`;
	const path = (d, a) => `<path d="${d}" ${a || ""}/>`;
	const lin = (id, stops, x2, y2) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2 == null ? 0 : x2}" y2="${y2 == null ? 1 : y2}">` + stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ""}/>`).join("") + "</linearGradient>";
	const rad = (id, stops, cx, cy, r) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">` + stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ""}/>`).join("") + "</radialGradient>";
	const metal = (id, c, k) => lin(id, [
		[0, mix(c, "#ffffff", .55 * (k || 1))],
		[.45, c],
		[1, mix(c, "#000000", .5)]
	], .35, 1);
	const goldG = (id) => lin(id, [
		[0, GOLD_HI],
		[.5, GOLD],
		[1, GOLD_DK]
	], .3, 1);
	function kanji(s, cx, cy, fs, fill, under) {
		const ch = [...s], step = fs * 1.02, y0 = cy - step * (ch.length - 1) / 2;
		const off = fs * .06;
		return ch.map((c, i) => {
			const y = n1(y0 + i * step), a = `x="${cx}" text-anchor="middle" dominant-baseline="central" font-family="${JP}" font-weight="700" font-size="${n1(fs)}"`;
			return `<text ${a} y="${n1(y + off)}" fill="${under}">${c}</text><text ${a} y="${y}" fill="${fill}">${c}</text>`;
		}).join("");
	}
	const kj = (x, t, cx, cy, fs2, fs1, fill, under) => x.one ? kanji(KANJI[t][0], cx, cy, fs1, fill, under) : kanji(KANJI[t], cx, cy, fs2, fill, under);
	const T = [];
	T[0] = (x) => {
		const g = x.id(), g2 = x.id(), cy = 46;
		let s = `<defs>${rad(g, [
			[0, mix(x.c, "#fff", .45)],
			[.55, x.c],
			[1, mix(x.c, "#000", .55)]
		], .38, .3, .8)}` + `${rad(g2, [[0, mix(x.c, "#000", .35)], [1, mix(x.c, "#fff", .15)]], .4, .3, .9)}</defs>`;
		s += circ(50, cy, 34, `fill="url(#${g})" stroke="${INK}" stroke-width="${x.ow}"`);
		if (x.L === 0) {
			s += circ(50, cy, 21, `fill="url(#${g2})" stroke="${mix(x.c, "#000", .6)}" stroke-width="4"`);
			s += circ(50, cy, 6.5, `fill="${mix(x.c, "#fff", .5)}" stroke="${INK}" stroke-width="3"`);
		} else {
			s += circ(50, cy, 26.5, `fill="url(#${g2})" stroke="${mix(x.c, "#000", .6)}" stroke-width="${x.L === 2 ? 1.6 : 2.2}"`);
			if (x.L === 2) {
				s += circ(50, cy, 32, `fill="none" stroke="${mix(x.c, "#fff", .5)}" stroke-width=".7" opacity=".7"`);
				for (let i = 0; i < 12; i++) {
					const a = i / 12 * Math.PI * 2 + Math.PI / 12;
					s += circ(50 + Math.cos(a) * 30.2, cy + Math.sin(a) * 30.2, 1.25, `fill="${mix(x.c, "#fff", .35)}" stroke="${mix(x.c, "#000", .6)}" stroke-width=".6"`);
				}
			}
			s += kj(x, 0, 50, cy, 18, 27, "#15181d", mix(x.c, "#fff", .55));
		}
		return {
			body: s,
			sil: circ(50, cy, 34)
		};
	};
	function mokko(R, k, cy, chip) {
		const pts = [];
		for (let i = 0; i < 144; i++) {
			const a = i / 144 * Math.PI * 2, c2 = Math.abs(Math.cos(2 * a));
			let r = R * (1 - k * Math.pow(1 - c2, 1.6));
			if (chip) {
				const d = Math.abs(a - 5.68);
				if (d < .16) r -= (.16 - d) / .16 * chip;
			}
			pts.push([50 + Math.cos(a) * r, cy + Math.sin(a) * r]);
		}
		return poly(pts);
	}
	T[1] = (x) => {
		const g = x.id(), cy = 46, out = mokko(38, .24, cy, x.L === 0 ? 5 : 6);
		let s = `<defs>${metal(g, x.c)}</defs>`;
		s += path(out, `fill="url(#${g})" stroke="${INK}" stroke-width="${x.ow}" stroke-linejoin="round"`);
		s += path(mokko(31.5, .24, cy, 0), `fill="none" stroke="${mix(x.c, "#000", .55)}" stroke-width="${x.L === 0 ? 3.2 : x.L === 2 ? 1.4 : 1.9}"`);
		if (x.L === 0) {
			s += path("M47.5 33 L52.5 33 L51.8 59 L48.2 59 Z", `fill="${INK}"`);
			s += path("M30 40 Q25 46 30 52 Q33 46 30 40Z", `fill="${INK}"`) + path("M70 40 Q75 46 70 52 Q67 46 70 40Z", `fill="${INK}"`);
		} else {
			s += path("M27.5 39 Q22.5 46 27.5 53 Q31 46 27.5 39Z", `fill="${INK}"`) + path("M72.5 39 Q77.5 46 72.5 53 Q69 46 72.5 39Z", `fill="${INK}"`);
			if (x.L === 2) {
				s += path("M80.5 25.5 L76 28.5 L77.5 31 L73 34 L74 36.5", `fill="none" stroke="${INK}" stroke-width=".9" stroke-linecap="round"`);
				s += path("M24 66 L33 60 M62 71 L69 66.5 M30 24 L36 21.5", `stroke="${mix(x.c, "#fff", .6)}" stroke-width=".6" opacity=".7"`);
			}
			s += kj(x, 1, 50, cy, 18, 27, "#11161c", mix(x.c, "#fff", .6));
		}
		return {
			body: s,
			sil: path(out)
		};
	};
	function katana(x, ang, gb) {
		const t = `transform="translate(50 46) rotate(${ang})"`, w = x.L === 0 ? 1.45 : 1;
		let s = `<g ${t}>`;
		s += path(`M${-3 * w} 14 L${-3 * w} -36 Q${-2.6 * w} -46 ${2 * w} -52.5 Q${3.2 * w} -44 ${3.2 * w} -36 L${3.2 * w} 14 Z`, `fill="url(#${gb})" stroke="${INK}" stroke-width="${x.ow}" stroke-linejoin="round"`);
		if (x.L === 2) s += path("M1.2 12 Q0.4 0 1.4 -12 Q0.6 -26 1.6 -42", `fill="none" stroke="#ffffff" stroke-width=".8" opacity=".75"`);
		s += `<rect x="${-3.7 * w}" y="17" width="${7.4 * w}" height="${x.L === 0 ? 24 : 22}" rx="1.8" fill="${x.L === 0 ? GOLD_DK : "#1d1820"}" stroke="${INK}" stroke-width="${x.ow}"/>`;
		if (x.L > 0) for (let i = 0; i < 4; i++) s += path(`M-2.6 ${20 + i * 5} L0 ${22.5 + i * 5} L2.6 ${20 + i * 5}`, `fill="none" stroke="${GOLD}" stroke-width="${x.L === 2 ? .8 : 1.1}"`);
		s += `<rect x="${-4.2 * w}" y="${x.L === 0 ? 39 : 37.5}" width="${8.4 * w}" height="4" rx="1.4" fill="${GOLD}" stroke="${INK}" stroke-width="${x.ow * .8}"/>`;
		return s + "</g>";
	}
	T[2] = (x) => {
		const gb = x.id(), gd = x.id(), gg = x.id(), r = x.L === 0 ? 24 : 26;
		let s = `<defs>${lin(gb, [
			[0, "#ffffff"],
			[.5, "#c9d3dd"],
			[1, "#7d8996"]
		], 1, 0)}${rad(gd, [[0, "#3a2c1c"], [1, "#0d0a07"]], .4, .3, .9)}${goldG(gg)}</defs>`;
		const back = katana(x, 42, gb) + katana(x, -42, gb);
		s += circ(50, 46, r + 1.6, `fill="${INK}"`);
		s += circ(50, 46, r, `fill="url(#${gd})" stroke="url(#${gg})" stroke-width="${x.L === 0 ? 6 : 3.6}"`);
		if (x.L === 0) s += circ(50, 46, 6.5, `fill="${GOLD}" stroke="${INK}" stroke-width="2"`);
		else {
			s += circ(50, 46, r - 4.6, `fill="none" stroke="${GOLD}" stroke-width="${x.L === 2 ? .8 : 1.1}" opacity=".8"`);
			if (x.L === 2) for (let i = 0; i < 16; i++) {
				const a = i / 16 * Math.PI * 2;
				s += circ(50 + Math.cos(a) * (r - 2.3), 46 + Math.sin(a) * (r - 2.3), .7, `fill="${GOLD_HI}"`);
			}
			s += kanji(KANJI[2], 50, 46.5, 29, `url(#${gg})`, "#000");
		}
		const sil = circ(50, 46, r + 1.6) + `<g transform="translate(50 46) rotate(42)"><rect x="-3.5" y="-52" width="7" height="94"/></g><g transform="translate(50 46) rotate(-42)"><rect x="-3.5" y="-52" width="7" height="94"/></g>`;
		return {
			back,
			body: s,
			sil
		};
	};
	T[3] = (x) => {
		const gc = x.id(), gg = x.id(), sm = x.L === 0;
		const L = sm ? 25 : 27, R = 100 - L, hem = sm ? 86 : 87, notch = sm ? 74 : 75;
		const cloth = `M${L} 13 H${R} V${hem} L50 ${notch} L${L} ${hem} Z`;
		let s = `<defs>${lin(gc, [
			[0, mix(x.c, "#fff", .25)],
			[.55, x.c],
			[1, mix(x.c, "#000", .45)]
		], .25, 1)}${goldG(gg)}</defs>`;
		let back = "";
		if (!sm) {
			back += path("M19 13 Q16 26 20 38", `fill="none" stroke="${INK}" stroke-width="${x.ow + 1.6}" stroke-linecap="round"`) + path("M81 13 Q84 26 80 38", `fill="none" stroke="${INK}" stroke-width="${x.ow + 1.6}" stroke-linecap="round"`) + path("M19 13 Q16 26 20 38", `fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round"`) + path("M81 13 Q84 26 80 38", `fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round"`) + path("M20 37 L23.2 46 L16.8 46 Z", `fill="url(#${gg})" stroke="${INK}" stroke-width="${x.ow * .8}" stroke-linejoin="round"`) + path("M80 37 L83.2 46 L76.8 46 Z", `fill="url(#${gg})" stroke="${INK}" stroke-width="${x.ow * .8}" stroke-linejoin="round"`);
		}
		s += path(cloth, `fill="url(#${gc})" stroke="${INK}" stroke-width="${x.ow}" stroke-linejoin="round"`);
		if (x.L === 2) for (let i = 1; i < 5; i++) s += path(`M${L + i * (R - L) / 5} 16 V${hem - 4 - (i === 2 || i === 3 ? 9 : 4)}`, `stroke="#000" stroke-width="3" opacity=".07"`);
		s += path(sm ? "M50 0.5 L56 8 L50 13 L44 8 Z" : "M50 0.5 L54.5 7.5 L50 12 L45.5 7.5 Z", `fill="url(#${gg})" stroke="${INK}" stroke-width="${x.ow}" stroke-linejoin="round"`);
		s += `<rect x="${sm ? 14 : 17}" y="${sm ? 8.5 : 9.5}" width="${sm ? 72 : 66}" height="${sm ? 7 : 5}" rx="2.5" fill="url(#${gg})" stroke="${INK}" stroke-width="${x.ow}"/>`;
		if (sm) {
			s += circ(50, 44, 9, `fill="none" stroke="${GOLD_HI}" stroke-width="4.5"`);
		} else {
			s += circ(19, 12, 3.4, `fill="url(#${gg})" stroke="${INK}" stroke-width="${x.ow * .8}"`) + circ(81, 12, 3.4, `fill="url(#${gg})" stroke="${INK}" stroke-width="${x.ow * .8}"`);
			s += path(`M${L + 3.5} 17 H${R - 3.5} V${hem - 5.5} L50 ${notch - 4.4} L${L + 3.5} ${hem - 5.5} Z`, `fill="none" stroke="${GOLD}" stroke-width="${x.L === 2 ? 1 : 1.3}"`);
			s += circ(50, 25.5, 5.2, `fill="none" stroke="${GOLD_HI}" stroke-width="1.3"`);
			if (x.L === 2) s += circ(47.6, 27, 1.3, `fill="${GOLD_HI}"`) + circ(52.4, 27, 1.3, `fill="${GOLD_HI}"`) + circ(50, 23, 1.3, `fill="${GOLD_HI}"`);
			else s += circ(50, 25.5, 2, `fill="${GOLD_HI}"`);
			s += kj(x, 3, 50, 50, 16.5, 23, "#fff1d0", mix(x.c, "#000", .6));
		}
		return {
			back,
			body: s,
			sil: path(cloth)
		};
	};
	function hexa(R, cx, cy) {
		const p = [];
		for (let i = 0; i < 6; i++) {
			const a = i / 6 * Math.PI * 2;
			p.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
		}
		return poly(p);
	}
	T[4] = (x) => {
		const gh = x.id(), gg = x.id(), sm = x.L === 0, cy = sm ? 52 : 53, R = sm ? 35 : 33.5;
		const lav = mix(x.c, "#fff", .42);
		let s = `<defs>${rad(gh, [
			[0, mix(x.c, "#fff", .15)],
			[.6, mix(x.c, "#000", .25)],
			[1, mix(x.c, "#000", .62)]
		], .42, .32, .85)}${goldG(gg)}</defs>`;
		let back = "";
		const beads = sm ? [
			[
				12,
				26,
				4.6
			],
			[
				11.5,
				35,
				3.9
			],
			[
				13,
				43,
				3.1
			]
		] : [
			[
				12.5,
				25,
				3.5
			],
			[
				11.6,
				31.4,
				3.2
			],
			[
				11.6,
				37.4,
				2.9
			],
			[
				12.4,
				42.8,
				2.5
			],
			[
				13.8,
				47.6,
				2.1
			],
			[
				15.4,
				51.6,
				1.7
			]
		];
		for (const side of [1, -1]) {
			const X = (v) => side > 0 ? v : 100 - v;
			if (!sm) back += path(`M${X(14)} 22 Q${X(10.5)} 31 ${X(15.5)} 52`, `fill="none" stroke="${INK}" stroke-width="1.2"`);
			for (const b of beads) back += circ(X(b[0]), b[1], b[2], `fill="${lav}" stroke="${INK}" stroke-width="${sm ? x.ow * .8 : x.ow * .7}"`);
			if (x.L === 2) for (const b of beads) back += circ(X(b[0]) - b[2] * .3, b[1] - b[2] * .35, b[2] * .35, `fill="#fff" opacity=".55"`);
			if (!sm) back += path(`M${X(15)} 22 Q${X(19)} 27 ${X(24)} 27.5 Q${X(21)} 22 ${X(15)} 22Z`, `fill="url(#${gg})" stroke="${INK}" stroke-width=".7"`);
		}
		const hx = hexa(R, 50, cy);
		s += path(hx, `fill="url(#${gh})" stroke="${INK}" stroke-width="${x.ow}" stroke-linejoin="round"`);
		s += path(hexa(R - (sm ? 4.5 : 4), 50, cy), `fill="none" stroke="${GOLD}" stroke-width="${sm ? 3.2 : x.L === 2 ? 1.6 : 2}" stroke-linejoin="round"`);
		if (x.L === 2) s += path(hexa(R - 7, 50, cy), `fill="none" stroke="${GOLD}" stroke-width=".6" opacity=".7" stroke-linejoin="round"`);
		const roof = sm ? "M10 21 Q22 23 30 20 L36 9 L64 9 L70 20 Q78 23 90 21 Q82 15 72 13 L66 5 L34 5 L28 13 Q18 15 10 21Z" : "M11 22.5 Q21 24.5 31 21.5 L69 21.5 Q79 24.5 89 22.5 Q81 17 70 15.5 L30 15.5 Q19 17 11 22.5Z";
		const roof2 = "M25 16 Q33 17 38.5 14 L61.5 14 Q67 17 75 16 Q68 11 61.5 9.5 L57.5 6 L42.5 6 L38.5 9.5 Q32 11 25 16Z";
		s += path(roof, `fill="url(#${gg})" stroke="${INK}" stroke-width="${x.ow}" stroke-linejoin="round"`);
		if (!sm) {
			s += path(roof2, `fill="url(#${gg})" stroke="${INK}" stroke-width="${x.ow}" stroke-linejoin="round"`);
			s += path("M42.5 6 Q39.5 3 41 0.8 Q43.5 2.6 44.5 6Z", `fill="url(#${gg})" stroke="${INK}" stroke-width=".8"`) + path("M57.5 6 Q60.5 3 59 0.8 Q56.5 2.6 55.5 6Z", `fill="url(#${gg})" stroke="${INK}" stroke-width=".8"`);
			s += path("M44 14 Q50 9.5 56 14", `fill="none" stroke="${GOLD_DK}" stroke-width="1.1"`);
			if (x.L === 2) s += path("M31 19 L69 19 M40 11.5 L60 11.5", `stroke="${GOLD_DK}" stroke-width=".6"`);
			s += kj(x, 4, 50, cy + 1, 17, 25, `url(#${gg})`, "#12051a");
		} else {
			s += path(`M50 ${cy - 11} L58 ${cy} L50 ${cy + 11} L42 ${cy} Z`, `fill="${GOLD}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"`);
		}
		return {
			back,
			body: s,
			sil: path(hx) + path(roof) + (sm ? "" : path(roof2))
		};
	};
	T[5] = (x) => {
		const gr = x.id(), gg = x.id(), gd = x.id(), gj = x.id(), sm = x.L === 0, cy = 56;
		const n = sm ? 12 : 16, pts = [];
		for (let i = 0; i < n * 2; i++) {
			const a = i / (n * 2) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? sm ? 30 : 27 : i % 4 === 0 ? 43 : sm ? 40 : 37;
			pts.push([50 + Math.cos(a) * r, cy + Math.sin(a) * r]);
		}
		const sun = poly(pts);
		let s = `<defs>${rad(gr, [
			[0, "#fff6cf"],
			[.5, x.c],
			[1, "#b8821e"]
		], .5, .5, .5)}${lin(gg, [
			[0, "#fff3c4"],
			[.45, x.c],
			[1, "#9a6a14"]
		], .3, 1)}` + `${rad(gd, [[0, "#5a1414"], [1, "#160505"]], .4, .3, .9)}${rad(gj, [
			[0, "#ff8a6a"],
			[.6, "#d8382a"],
			[1, "#7a120c"]
		], .35, .3, .8)}</defs>`;
		let back = s + path(sun, `fill="url(#${gr})" stroke="${INK}" stroke-width="${x.ow}" stroke-linejoin="round"`);
		if (x.L === 2) for (let i = 0; i < n * 2; i += 2) {
			const p = pts[i];
			back += path(`M${n1(50 + (p[0] - 50) * .66)} ${n1(cy + (p[1] - cy) * .66)} L${n1(50 + (p[0] - 50) * .94)} ${n1(cy + (p[1] - cy) * .94)}`, `stroke="#a8761a" stroke-width=".8"`);
		}
		const hornL = sm ? "M46 38 C33 31 21 18 11 0.5 C29 7 43 17 52 31Z" : "M46 38 C34 30 22 18 12.5 1.5 C29.5 9 43.5 18 52 31Z";
		const hornR = hornL.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, a, b) => n1(100 - +a) + " " + b);
		back += path(hornL, `fill="url(#${gg})" stroke="${INK}" stroke-width="${x.ow}" stroke-linejoin="round"`) + path(hornR, `fill="url(#${gg})" stroke="${INK}" stroke-width="${x.ow}" stroke-linejoin="round"`);
		if (x.L === 2) back += path("M44.5 33.5 C35 26 26 16 17 5", `fill="none" stroke="#fff6cf" stroke-width=".8" opacity=".8"`) + path("M55.5 33.5 C65 26 74 16 83 5", `fill="none" stroke="#fff6cf" stroke-width=".8" opacity=".8"`);
		const r = sm ? 22 : 24;
		let body = circ(50, cy, r + 1.6, `fill="${INK}"`) + circ(50, cy, r, `fill="url(#${gd})" stroke="url(#${gg})" stroke-width="${sm ? 5.5 : 3.4}"`);
		if (sm) body += circ(50, cy, 7, `fill="url(#${gj})" stroke="${INK}" stroke-width="2"`);
		else {
			body += circ(50, cy, r - 4.4, `fill="none" stroke="${x.c}" stroke-width="${x.L === 2 ? .8 : 1.1}" opacity=".85"`);
			if (x.L === 2) for (let i = 0; i < 20; i++) {
				const a = i / 20 * Math.PI * 2;
				body += circ(50 + Math.cos(a) * (r - 2.2), cy + Math.sin(a) * (r - 2.2), .7, `fill="#fff3c4"`);
			}
			body += kj(x, 5, 50, cy + .5, 15.5, 23, `url(#${gg})`, "#000");
		}
		body += circ(50, sm ? 30 : 29, sm ? 6.4 : 5, `fill="url(#${gj})" stroke="${INK}" stroke-width="${x.ow}"`);
		if (!sm) body += circ(50, 29, 6.6, `fill="none" stroke="${x.c}" stroke-width="1"`);
		return {
			back,
			body,
			sil: path(sun) + path(hornL) + path(hornR)
		};
	};
	function placement(x, o) {
		const c = "#c9b48a", r = 33, a0 = -1.05, a1 = a0 + Math.PI * 1.78;
		const P = (a, rr) => n1(50 + Math.cos(a) * (rr || r)) + " " + n1(50 + Math.sin(a) * (rr || r));
		let s = path(`M${P(a0)} A${r} ${r} 0 1 1 ${P(a1)}`, `fill="none" stroke="${INK}" stroke-width="${(x.L === 0 ? 9 : 7) + x.ow * 2}" stroke-linecap="round"`);
		s += path(`M${P(a0)} A${r} ${r} 0 1 1 ${P(a1)}`, `fill="none" stroke="${c}" stroke-width="${x.L === 0 ? 9 : 7}" stroke-linecap="round"`);
		if (x.L === 0) s += circ(50, 50, 7, `fill="${c}" stroke="${INK}" stroke-width="3"`);
		else {
			const of = x.one ? 0 : Math.max(0, Math.min(10, o.of | 0)), placed = Math.max(0, Math.min(of, o.placed | 0));
			s += kanji("試", 50, of ? 46 : 50, 28, c, "#000");
			for (let i = 0; i < of; i++) {
				const cx = 50 + (i - (of - 1) / 2) * 7.5;
				s += circ(cx, 66.5, 2.5, `fill="${i < placed ? c : "none"}" stroke="${i < placed ? INK : c}" stroke-width="${i < placed ? .9 : 1.2}"`);
			}
		}
		return s;
	}
	function locked(x) {
		const g = x.id(), gl = x.id(), lc = "#8e95a3";
		let s = `<defs>${rad(g, [[0, "#353a46"], [1, "#14171e"]], .4, .3, .9)}${lin(gl, [[0, "#b9bfcb"], [1, "#6c7381"]])}</defs>`;
		s += circ(50, 50, 34, `fill="url(#${g})" stroke="${INK}" stroke-width="${x.ow}"`);
		if (x.L > 0) s += circ(50, 50, 28.5, `fill="none" stroke="#4b5262" stroke-width="1.4" stroke-dasharray="3.2 3.2"`);
		const w = x.L === 0 ? 1.15 : 1;
		s += path(`M${50 - 9 * w} 50 V${50 - 8 * w} A${9 * w} ${9 * w} 0 0 1 ${50 + 9 * w} ${50 - 8 * w} V50`, `fill="none" stroke="${INK}" stroke-width="${(x.L === 0 ? 8 : 6) + x.ow}"`);
		s += path(`M${50 - 9 * w} 50 V${50 - 8 * w} A${9 * w} ${9 * w} 0 0 1 ${50 + 9 * w} ${50 - 8 * w} V50`, `fill="none" stroke="${lc}" stroke-width="${x.L === 0 ? 8 : 6}"`);
		s += `<rect x="${50 - 15 * w}" y="${47}" width="${30 * w}" height="${22 * w}" rx="3" fill="url(#${gl})" stroke="${INK}" stroke-width="${x.ow}"/>`;
		s += circ(50, 47 + 9 * w, 3 * w, `fill="${INK}"`) + path(`M${50 - 1.4 * w} ${47 + 10 * w} H${50 + 1.4 * w} L${50 + 2 * w} ${47 + 16 * w} H${50 - 2 * w} Z`, `fill="${INK}"`);
		return s;
	}
	function marks(x, d, c) {
		const k = 4 - d, w = x.L === 0 ? 20 : 12.5, h = x.L === 0 ? 24 : 16, gap = x.L === 0 ? -1 : 1.5, y = x.L === 0 ? 86 : 88.5;
		const fill = mix(c, "#ffffff", .55);
		let s = "";
		for (let i = 0; i < k; i++) {
			const cx = 50 + (i - (k - 1) / 2) * (w + gap);
			s += path(`M${n1(cx)} ${n1(y - h / 2)} L${n1(cx + w / 2)} ${y} L${n1(cx)} ${n1(y + h / 2)} L${n1(cx - w / 2)} ${y} Z`, `fill="${fill}" stroke="${INK}" stroke-width="${x.L === 0 ? 4 : Math.max(2, x.ow)}" stroke-linejoin="round" paint-order="stroke"`);
			if (x.L === 2) s += path(`M${n1(cx)} ${n1(y - h / 2 + 2.5)} L${n1(cx + w / 2 - 2.5)} ${y} L${n1(cx)} ${y}Z`, `fill="#fff" opacity=".6"`);
		}
		return s;
	}
	let seq = 0, cssDone = false;
	function css() {
		if (cssDone || typeof document === "undefined" || !document.head) return;
		cssDone = true;
		const st = document.createElement("style");
		st.id = "rke-css";
		st.textContent = ".rke{display:inline-block;vertical-align:middle;flex:none;overflow:visible}" + ".rke .rke-sh{animation:rke-sh 5.5s ease-in-out infinite}" + "@keyframes rke-sh{0%,58%{transform:translateX(0)}100%{transform:translateX(190px)}}" + ".rke .rke-pl{animation:rke-pl 2.4s ease-in-out infinite alternate}" + "@keyframes rke-pl{from{opacity:.4}to{opacity:1}}" + "@media (prefers-reduced-motion:reduce){.rke .rke-sh,.rke .rke-pl{animation:none}.rke .rke-sh{display:none}}";
		document.head.appendChild(st);
	}
	function name(tier) {
		if (tier === "placement") return "Placement";
		if (tier == null || tier === "locked" || isNaN(+tier)) return "Unranked";
		const i = Math.max(0, Math.min(15, tier | 0)), t = i === 15 ? 5 : Math.floor(i / 3), d = i === 15 ? 0 : 3 - i % 3;
		return NAMES[t] + (d ? " " + DIV[d] : "");
	}
	function rankEmblem(tier, opts) {
		const o = opts || {}, size = Math.max(8, +o.size || 48);
		const L = o.lod === "small" ? 0 : o.lod === "mid" ? 1 : o.lod === "large" ? 2 : size < 36 ? 0 : size < 96 ? 1 : 2;
		const uid = "rke" + (++seq).toString(36);
		let k = 0;
		const x = {
			L,
			ow: n1(L === 0 ? Math.max(4.2, 110 / size) : Math.max(1.5, 125 / size)),
			id: () => uid + "_" + k++,
			one: size < 72 && o.lod !== "large"
		};
		const glow = o.glow != null ? !!o.glow : size >= 40;
		const anim = o.anim !== false && L > 0;
		let inner = "", key;
		if (tier === "placement") {
			key = "placement";
			inner = placement(x, o);
		} else if (tier == null || tier === "locked" || isNaN(+tier)) {
			key = "locked";
			inner = locked(x);
		} else {
			const i = Math.max(0, Math.min(15, tier | 0)), t = i === 15 ? 5 : Math.floor(i / 3), d = i === 15 ? 0 : 3 - i % 3;
			key = String(i);
			x.c = TCOL[t];
			const p = T[t](x);
			if (glow) {
				const gh = x.id(), op = [
					.22,
					.26,
					.38,
					.42,
					.5,
					.75
				][t];
				inner += `<defs>${rad(gh, [
					[
						0,
						x.c,
						op
					],
					[
						.55,
						x.c,
						op * .45
					],
					[
						1,
						x.c,
						0
					]
				], .5, .5, .5)}</defs>` + `<circle cx="50" cy="${t === 5 ? 54 : 48}" r="50" fill="url(#${gh})"${anim && t === 5 ? " class=\"rke-pl\"" : ""}/>`;
			}
			inner += (p.back || "") + p.body;
			if (anim && t >= 2) {
				const m = x.id(), gs = x.id();
				inner += `<defs><mask id="${m}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><g fill="#fff">${p.sil}</g></mask>` + `${lin(gs, [
					[
						0,
						"#fff",
						0
					],
					[
						.5,
						"#fff",
						t === 5 ? .6 : .42
					],
					[
						1,
						"#fff",
						0
					]
				], 1, 0)}</defs>` + `<g mask="url(#${m})"><g class="rke-sh"><rect x="-75" y="-10" width="34" height="120" fill="url(#${gs})" transform="skewX(-20)"/></g></g>`;
			}
			if (d) inner += marks(x, d, x.c);
		}
		css();
		const label = String(o.title || name(tier)).replace(/[<>&"]/g, "");
		return `<svg class="rke${o.cls ? " " + o.cls : ""}" data-tier="${key}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${label}"><title>${label}</title>${inner}</svg>`;
	}
	rankEmblem.tierName = name;
	rankEmblem.el = function(tier, opts) {
		const t = document.createElement("template");
		t.innerHTML = rankEmblem(tier, opts).trim();
		return t.content.firstChild;
	};
	rankEmblem.demo = function(parent) {
		const box = document.createElement("div");
		box.style.cssText = "position:fixed;inset:0;z-index:99999;overflow:auto;background:#0a0c16;color:#ebe6da;padding:16px;font:13px/1.4 sans-serif;cursor:pointer";
		const all = [
			...Array(16).keys(),
			"placement",
			"locked"
		];
		const row = (sz) => "<div style=\"display:flex;flex-wrap:wrap;gap:" + (sz > 60 ? 18 : 10) + "px;align-items:center;margin:0 0 18px\">" + all.map((t) => `<span title="${name(t)}" style="display:inline-flex;flex-direction:column;align-items:center;gap:4px">${rankEmblem(t, {
			size: sz,
			placed: 2,
			of: 5
		})}${sz > 60 ? `<small>${name(t)}</small>` : ""}</span>`).join("") + "</div>";
		box.innerHTML = "<p>Rank emblems (click to close)</p>" + row(24) + row(48) + row(160);
		box.addEventListener("click", () => box.remove());
		(parent || document.body).appendChild(box);
		return box;
	};
	ND.rankEmblem = rankEmblem;
})(typeof window !== "undefined" ? window.ND = window.ND || {} : globalThis.ND = globalThis.ND || {});
