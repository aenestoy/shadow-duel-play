(function(ND) {
	"use strict";
	const au = ND.audio, fx = ND.fx, cam = ND.cam;
	const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
	const outCubic = (t) => 1 - Math.pow(1 - t, 3);
	const TY = {
		riposte: {
			id: "suriage",
			col: "255,204,96",
			cuts: [-.62]
		},
		sweep: {
			id: "harai",
			col: "96,212,255",
			cuts: [.05],
			low: true
		},
		mawari: {
			id: "nuki",
			col: "196,146,255",
			cuts: [-.72, .72]
		},
		kaeshiHeavy: {
			id: "uchiotoshi",
			col: "255,104,76",
			cuts: [1.45],
			ground: true
		},
		finisher: {
			id: "sandan",
			col: "255,240,206",
			cuts: [
				-.5,
				.35,
				1.5
			]
		}
	};
	const S = () => ND.STR && ND.STR.kaeshi || {};
	const tt = (s) => ND.i18n ? ND.i18n.t(s) : s;
	const G = () => ND.game;
	const hq = () => !!(ND.settings && ND.settings.hq);
	const shown = () => {
		const g = G();
		return !!g && g.mode !== "attract";
	};
	const left = (f, g) => f.counterLeft ? f.counterLeft() : f.counterUntil - g.clock;
	const tcol = (f, t) => ND.flair ? ND.flair.slashCol(f, t) : t.col;
	if (au && !au.kShing) {
		Object.assign(au, {
			kShing(pan = 0) {
				this.tone({
					freq: 2900,
					freq1: 3400,
					glide: .12,
					dur: 1.1,
					gain: .07,
					send: .7,
					pan
				});
				this.tone({
					freq: 4650,
					freq1: 5200,
					glide: .1,
					dur: .8,
					gain: .04,
					send: .6,
					pan,
					type: "triangle"
				});
				this.tone({
					freq: 6900,
					dur: .5,
					gain: .02,
					send: .5,
					pan
				});
				this.noise({
					type: "bandpass",
					f0: 4200,
					f1: 9500,
					q: 4,
					dur: .28,
					gain: .16,
					attack: .01,
					send: .4,
					pan
				});
			},
			kDraw(id, pan = 0) {
				if (id === "suriage") {
					this.noise({
						type: "bandpass",
						f0: 700,
						f1: 5200,
						q: 2,
						dur: .3,
						gain: .3,
						attack: .12,
						send: .3,
						pan
					});
					this.tone({
						freq: 520,
						freq1: 1900,
						dur: .32,
						gain: .07,
						send: .4,
						pan,
						type: "triangle"
					});
				} else if (id === "harai") {
					this.noise({
						type: "lowpass",
						f0: 1800,
						f1: 300,
						dur: .34,
						gain: .34,
						attack: .08,
						send: .2,
						pan
					});
					this.tone({
						freq: 240,
						freq1: 130,
						dur: .3,
						gain: .18,
						send: .2,
						pan
					});
				} else if (id === "nuki") {
					this.noise({
						type: "bandpass",
						f0: 2600,
						f1: 900,
						q: 1.5,
						dur: .22,
						gain: .26,
						attack: .1,
						send: .35,
						pan
					});
					this.noise({
						type: "bandpass",
						f0: 900,
						f1: 3400,
						q: 1.5,
						dur: .24,
						gain: .26,
						attack: .1,
						send: .35,
						pan,
						delay: .15
					});
				} else if (id === "uchiotoshi") {
					this.tone({
						freq: 95,
						freq1: 45,
						dur: .45,
						gain: .5,
						send: .3,
						pan
					});
					this.noise({
						type: "bandpass",
						f0: 1500,
						f1: 4200,
						q: 3,
						dur: .22,
						gain: .2,
						attack: .02,
						send: .3,
						pan,
						delay: .06
					});
				} else {
					[
						0,
						.1,
						.2
					].forEach((d, i) => this.noise({
						type: "bandpass",
						f0: 600 + i * 300,
						f1: 3200 + i * 600,
						q: 1.4,
						dur: .18,
						gain: .24,
						attack: .08,
						send: .3,
						pan,
						delay: d
					}));
				}
			},
			kHit(id, pan = 0) {
				if (id === "suriage") {
					this.tone({
						freq: 1760,
						dur: .9,
						gain: .07,
						send: .7,
						pan
					});
					this.tone({
						freq: 2640,
						dur: .7,
						gain: .04,
						send: .7,
						pan
					});
					this.tone({
						freq: 120,
						freq1: 50,
						dur: .3,
						gain: .45,
						send: .2,
						pan
					});
				} else if (id === "harai") {
					this.tone({
						freq: 90,
						freq1: 40,
						dur: .4,
						gain: .55,
						send: .2,
						pan
					});
					this.noise({
						type: "lowpass",
						f0: 1200,
						f1: 200,
						dur: .4,
						gain: .35,
						send: .25,
						pan
					});
				} else if (id === "nuki") {
					this.tone({
						freq: 3100,
						freq1: 2400,
						dur: .6,
						gain: .05,
						send: .8,
						pan
					});
					this.noise({
						type: "highpass",
						f0: 2500,
						f1: 800,
						dur: .25,
						gain: .3,
						send: .3,
						pan
					});
					this.tone({
						freq: 130,
						freq1: 55,
						dur: .3,
						gain: .4,
						send: .2,
						pan
					});
				} else if (id === "uchiotoshi") {
					this.taiko(1.1);
					this.tone({
						freq: 62,
						dur: 1.1,
						gain: .28,
						send: .6,
						pan
					});
					this.clang(.7, pan, .6);
				} else {
					this.taiko(1.2);
					this.tone({
						freq: 1320,
						freq1: 990,
						dur: 1.2,
						gain: .06,
						send: .8,
						pan
					});
				}
			}
		});
	}
	const cine = ND.cine = {
		TY,
		slashes: [],
		nums: [],
		rings: [],
		banner: null,
		combos: [null, null],
		pops: [null, null],
		seen: {
			nums: new Map(),
			combos: new Map()
		},
		clear() {
			this.slashes.length = 0;
			this.nums.length = 0;
			this.rings.length = 0;
			this.banner = null;
			this.combos[0] = this.combos[1] = null;
			this.pops[0] = this.pops[1] = null;
		},
		type(f) {
			return f && f.state === "atk" && f.atk && f.atk.counter ? TY[f.atkName] || TY.riposte : null;
		},
		rgb(f) {
			const t = this.type(f);
			return t ? tcol(f, t) : null;
		},
		ghostCol(f) {
			const t = this.type(f);
			return t ? `rgb(${tcol(f, t)})` : null;
		},
		human(f) {
			const g = G();
			return !!(g && g.isHuman && g.isHuman(f));
		},
		onParry(def, att, x, y) {
			const g = G();
			if (!g) return;
			if (shown()) {
				g.slowT = Math.max(g.slowT || 0, .35);
				g.slowV = .3;
				g.cineT = Math.max(g.cineT || 0, .5);
				g.cineX = (def.x + att.x) / 2;
				g.cineZ = 1.22;
			}
			this.rings.push({
				f: def,
				t: 0,
				max: .55
			});
			fx.ring(def.x, def.y - 105, "255,244,214", 130);
			cam.z = Math.min(2.2, cam.z * 1.05);
			if (au.kShing) au.kShing(def.pan);
			if (this.human(def)) this.pops[def.id] = { t: 0 };
		},
		counterStart(f, name) {
			const t = TY[name] || TY.riposte, g = G();
			const stage = Math.max(1, f.counterStage || 1), beat = Math.min(stage, 3);
			this.rings.length = 0;
			for (let i = fx.parts.length - 1; i >= 0; i--) if (fx.parts[i].k === "r" || fx.parts[i].k === "f") fx.parts.splice(i, 1);
			for (let i = fx.texts.length - 1; i >= 0; i--) if (fx.texts[i].str === tt("SAVUŞTURMA!")) fx.texts.splice(i, 1);
			f.ghosts.length = 0;
			if (f.opp) f.opp.ghosts.length = 0;
			if (au.kDraw) au.kDraw(t.id, f.pan);
			fx.flash(f.j.haF ? f.j.haF.x : f.x, f.j.haF ? f.j.haF.y : f.y - 100, 0, 40, tcol(f, t));
			if (!shown()) return;
			g.slowT = Math.min(g.slowT || 0, .06);
			g.dim = Math.max(g.dim || 0, [
				0,
				.35,
				.5,
				.65
			][beat]);
			g.cineT = .35 + beat * .1;
			g.cineX = (f.x + f.opp.x) / 2;
			g.cineZ = Math.min([
				0,
				1.22,
				1.36,
				1.5
			][beat], cam.W / (cam.s * (Math.abs(f.x - f.opp.x) + 360 + cam.padX)));
			const L = S();
			this.banner = {
				f,
				t,
				col: tcol(f, t),
				stage,
				age: 0,
				life: 1.05,
				name: L.names && L.names[t.id] || t.id.toUpperCase(),
				label: L.labels && L.labels[t.id] || ""
			};
		},
		counterHit(f, o, a, x, y, dmg, last) {
			const t = this.type(f) || TY.riposte, g = G(), dir = f.dir, col = tcol(f, t), sty = ND.flair ? ND.flair.slashSty(f) : null;
			const cuts = t.id === "sandan" ? [t.cuts[Math.min(t.cuts.length - 1, Math.max(0, f.hitIdx))]] : t.cuts;
			cuts.forEach((ang, i) => this.slashes.push({
				x,
				y: t.low ? Math.max(y, -60) : y,
				a: ang * dir,
				col,
				sty,
				seed: sty ? Math.random() : 0,
				age: -i * .06,
				life: .55
			}));
			if (dmg > 0) {
				this.nums.push({
					x: x + dir * 60,
					y: y - 85,
					v: dmg,
					col,
					age: 0,
					life: 1.1
				});
				if (this.seen.nums.size < 200) this.seen.nums.set(dmg + "|" + col, [dmg, col]);
			}
			fx.blood(x, y, dir, -.3, 30, 1.4);
			if (t.ground) {
				fx.ring(o.x, -4, `${col}`, 150);
				fx.dust(o.x, 0, 14, 1.6);
			}
			fx.spark(x, y, Math.atan2(-.4, dir), 18, 1.2, col);
			if (au.kHit) au.kHit(t.id, f.pan);
			if (shown() && last && g.phase === "fight") {
				g.cineT = Math.max(g.cineT || 0, .6);
				g.cineX = x;
				g.cineZ = 1.35 + .05 * Math.min(f.counterStage || 1, 3);
				g.slowT = Math.max(g.slowT || 0, (g.hitstopT || 0) + .2);
				g.slowV = .45;
			}
			cam.punch(9);
		},
		combo(from, to, hits, name) {
			if (!shown()) return false;
			const c = this.combos[from.id];
			const cb = this.combos[from.id] = {
				n: hits,
				name: name || (c && c.to === to && c.age < 1.2 ? c.name : null),
				age: 0,
				life: 1.5,
				col: from.col.ui,
				to,
				named: !!name && !(c && c.name === name)
			};
			if (this.seen.combos.size < 200) this.seen.combos.set(from.id + "|" + hits + "|" + cb.name + "|" + cb.named + "|" + cb.col, [
				from.id,
				hits,
				cb.name,
				cb.named,
				cb.col
			]);
			return true;
		},
		update(dt) {
			for (const L of [this.slashes, this.nums]) for (let i = L.length - 1; i >= 0; i--) {
				L[i].age += dt;
				if (L[i].age >= L[i].life) L.splice(i, 1);
			}
			for (let i = this.rings.length - 1; i >= 0; i--) {
				const r = this.rings[i];
				r.t += dt;
				if (r.t >= r.max) this.rings.splice(i, 1);
			}
			if (this.banner) {
				this.banner.age += dt;
				if (this.banner.age >= this.banner.life) this.banner = null;
			}
			for (let i = 0; i < 2; i++) {
				const c = this.combos[i];
				if (c) {
					c.age += dt;
					if (c.age >= c.life) this.combos[i] = null;
				}
				const p = this.pops[i];
				if (p) p.t += dt;
			}
			const g = G(), f = g && g.F && g.F[0];
			const want = !!(f && ND.touch && ND.touch.active && !(ND.coach && ND.coach.on) && !(ND.tutor && ND.tutor.on) && this.human(f) && f.cwKind === "parry" && left(f, g) > 0 && g.phase === "fight");
			if (want !== !!this.pulsing) {
				this.pulsing = want;
				const pad = document.getElementById("touch");
				if (pad) {
					if (want) pad.dataset.coach = "light";
					else if (pad.dataset.coach === "light") delete pad.dataset.coach;
				}
			}
		},
		draw(ctx) {
			const g = G();
			if (!g) return;
			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			const s = cam.s;
			for (const r of this.rings) this.drawRing(ctx, r, s);
			for (const sl of this.slashes) this.drawSlash(ctx, sl, s);
			for (const n of this.nums) this.drawNum(ctx, n, s);
			if (shown()) {
				if (g.phase === "fight") for (const f of g.F) this.drawPrompt(ctx, f, s);
				const u = cam.ui || s;
				if (this.banner) this.drawBanner(ctx, this.banner, u);
				for (let i = 0; i < 2; i++) if (this.combos[i]) this.drawCombo(ctx, this.combos[i], i, u);
			}
			ctx.restore();
		},
		drawRing(ctx, r, s) {
			const f = r.f, u = r.t / r.max, x = cam.sx(f.x), y = cam.sy(f.y - 100), k = cam.k;
			ctx.globalCompositeOperation = "lighter";
			ctx.globalAlpha = 1 - u;
			ctx.strokeStyle = "rgb(255,236,190)";
			ctx.lineWidth = (8 - 6 * u) * s;
			ctx.beginPath();
			ctx.arc(x, y, (60 + 90 * outCubic(u)) * k, 0, 6.283);
			ctx.stroke();
			ctx.globalAlpha = (1 - u) * .6;
			ctx.lineWidth = 2 * s;
			ctx.beginPath();
			ctx.arc(x, y, (40 + 150 * outCubic(u)) * k, 0, 6.283);
			ctx.stroke();
			ctx.globalCompositeOperation = "source-over";
			ctx.globalAlpha = 1;
		},
		drawSlash(ctx, sl, s) {
			if (sl.age < 0) return;
			const u = sl.age / sl.life, grow = outCubic(Math.min(1, sl.age / .09)), fade = u < .35 ? 1 : 1 - (u - .35) / .65;
			const x = cam.sx(sl.x), y = cam.sy(sl.y), L = Math.hypot(cam.W, cam.H) * .62 * grow, c = Math.cos(sl.a), sn = Math.sin(sl.a);
			const band = (w, style, alpha, comp) => {
				const nx = -sn * w, ny = c * w;
				ctx.globalCompositeOperation = comp;
				ctx.globalAlpha = alpha;
				ctx.fillStyle = style;
				ctx.beginPath();
				ctx.moveTo(x - c * L, y - sn * L);
				ctx.lineTo(x + nx, y + ny);
				ctx.lineTo(x + c * L, y + sn * L);
				ctx.lineTo(x - nx, y - ny);
				ctx.closePath();
				ctx.fill();
			};
			const w = (10 + 8 * (1 - u)) * s, St = sl.sty && ND.flair ? ND.flair.slashEdge(sl.sty) : null;
			band(w * (St && St.edgeW || 1.7), St ? St.edge : "rgb(6,7,12)", .55 * fade, "source-over");
			if (hq()) band(w * 1.25, `rgb(${sl.col})`, .45 * fade, "lighter");
			band(w * .75, `rgb(${sl.col})`, .9 * fade, "lighter");
			band(w * .28, St ? St.core : "rgb(255,255,255)", fade, "lighter");
			if (St) ND.flair.slashExtra(ctx, sl, x, y, L, c, sn, w, fade, s);
			ctx.globalCompositeOperation = "source-over";
			ctx.globalAlpha = 1;
		},
		drawNum(ctx, n, s) {
			const u = n.age / n.life, pop = 1 + Math.max(0, .18 - n.age) * 4;
			const x = cam.sx(n.x), y = cam.sy(n.y) - 40 * s * outCubic(Math.min(1, u * 1.6));
			ctx.globalAlpha = u < .7 ? 1 : 1 - (u - .7) / .3;
			ctx.font = `700 ${Math.round(40 * s * pop)}px Oswald, sans-serif`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.lineWidth = 7 * s;
			ctx.strokeStyle = "rgba(5,6,12,.9)";
			ctx.strokeText("-" + n.v, x, y);
			ctx.fillStyle = `rgb(${n.col})`;
			ctx.fillText("-" + n.v, x, y);
			ctx.globalAlpha = 1;
			ctx.textBaseline = "alphabetic";
		},
		drawPrompt(ctx, f, s) {
			const g = G();
			if (!this.human(f) || f.dead || ND.tutor && ND.tutor.on) return;
			const cw = left(f, g);
			if (!(cw > 0) || ![
				"block",
				"parry",
				"guard",
				"move",
				"recoil"
			].includes(f.state)) return;
			const big = f.cwKind === "parry";
			if (!big && !(ND.settings && ND.settings.hints)) return;
			const PL = this.promptLook(f, big, s), k = PL.k;
			const frac = clamp(cw / (f.counterWin || .5), 0, 1), p = this.pops[f.id], pt = p ? p.t : 1;
			const pop = big ? 1 + Math.max(0, .16 - pt) * 3 : 1, pulse = 1 + .06 * Math.sin(g.pt * 22);
			let x = cam.sx(f.x), y = cam.sy(f.y - 205) - 88 * k;
			if (y < cam.H * .2 + 20 * k) {
				const away = f.opp && f.opp.x > f.x ? -1 : 1;
				x = clamp(x + away * 105 * k, 60 * k, cam.W - 60 * k);
				y = Math.max(cam.H * .2 + 20 * k, cam.sy(f.y - 150));
			}
			this.drawPromptAt(ctx, x, y, k, pop, pulse, frac, PL.key, PL.word);
		},
		promptLook(f, big, s) {
			const g = G(), L = S(), tch = f === g.F[0] && !!(ND.touch && ND.touch.active), P = this._pl || (this._pl = {
				key: "",
				k: 1,
				word: ""
			});
			const TB = ND.STR && ND.STR.touch && ND.STR.touch.btn || {};
			P.key = tch ? tt(TB.light || "SALDIR") : f === g.F[0] ? ND.input.keyLabel ? ND.input.keyLabel("KeyF") : "F" : ND.input.keyLabel ? ND.input.keyLabel("KeyK") : "K";
			let k = s * (big ? 1 : .72);
			if (tch) k = Math.max(k, (g.pxr || 1) * (big ? 1.05 : .8));
			P.k = k;
			P.word = tt(L.strike || "VUR!");
			return P;
		},
		drawPromptAt(ctx, x, y, k, pop, pulse, frac, key, word) {
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.font = `700 ${Math.round(30 * k * pop * pulse)}px Oswald, sans-serif`;
			ctx.lineWidth = 6 * k;
			ctx.strokeStyle = "rgba(5,6,12,.92)";
			ctx.strokeText(word, x, y);
			ctx.fillStyle = "#ffd27a";
			ctx.fillText(word, x, y);
			ctx.font = `700 ${Math.round(15 * k)}px Oswald, sans-serif`;
			const kw = Math.max(26 * k, ctx.measureText(key).width + 14 * k), kh = 22 * k, ky = y + 27 * k;
			ctx.fillStyle = "rgba(8,9,16,.9)";
			ctx.strokeStyle = "#ffd27a";
			ctx.lineWidth = 2 * k;
			this.rr(ctx, x - kw / 2, ky - kh / 2, kw, kh, 5 * k);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = "#ffd27a";
			ctx.fillText(key, x, ky + k);
			const bw = 96 * k, bh = 6 * k, by = ky + kh / 2 + 8 * k;
			ctx.fillStyle = "rgba(8,9,16,.85)";
			ctx.fillRect(x - bw / 2 - 2 * k, by - 2 * k, bw + 4 * k, bh + 4 * k);
			ctx.fillStyle = frac > .3 ? "#ffd27a" : "#ff8a6a";
			ctx.fillRect(x - bw / 2, by, bw * frac, bh);
			ctx.textBaseline = "alphabetic";
		},
		drawBanner(ctx, b, s) {
			const u = b.age / b.life, inT = outCubic(Math.min(1, b.age / .14)), a = u < .75 ? 1 : 1 - (u - .75) / .25;
			const side = b.f.id === 0 ? -1 : 1, W = cam.W, tch = !!(ND.touch && ND.touch.active), pr = G().pxr || 1;
			const k = tch ? Math.max(s, pr * .8) : Math.max(s, .55);
			const cx = W / 2 + side * (1 - inT) * W * .25, cy = tch ? cam.H - 56 * k : cam.H * .27;
			ctx.globalAlpha = a;
			const bw = Math.min(W * (tch ? .46 : .92), 560 * k), bh = 86 * k;
			ctx.fillStyle = "rgba(6,7,12,.72)";
			ctx.beginPath();
			ctx.moveTo(cx - bw / 2, cy - bh / 2 + 6 * k);
			ctx.lineTo(cx + bw / 2, cy - bh / 2);
			ctx.lineTo(cx + bw / 2 - 18 * k, cy + bh / 2);
			ctx.lineTo(cx - bw / 2 + 14 * k, cy + bh / 2 - 4 * k);
			ctx.closePath();
			ctx.fill();
			const bc = b.col || b.t.col;
			ctx.fillStyle = `rgb(${bc})`;
			ctx.fillRect(cx - bw / 2 + 10 * k, cy + bh / 2 - 7 * k, (bw - 30 * k) * inT, 3 * k);
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.font = `600 ${Math.round(13 * k)}px Oswald, "Noto Serif JP", sans-serif`;
			ctx.fillStyle = "rgba(236,230,214,.9)";
			ctx.fillText(b.f.ch.name + " · " + b.stage + "× · " + tt(S().head || "KAESHI-WAZA"), cx, cy - 28 * k, bw - 30 * k);
			ctx.font = `700 ${Math.round(38 * k * (1 + Math.max(0, .12 - b.age) * 2))}px Oswald, sans-serif`;
			ctx.lineWidth = 6 * k;
			ctx.strokeStyle = "rgba(5,6,12,.95)";
			ctx.strokeText(b.name, cx, cy + 3 * k, bw - 30 * k);
			ctx.fillStyle = `rgb(${bc})`;
			ctx.fillText(b.name, cx, cy + 3 * k, bw - 30 * k);
			if (b.label) {
				ctx.font = `500 ${Math.round(14 * k)}px "Source Sans 3", sans-serif`;
				ctx.fillStyle = "rgba(236,230,214,.95)";
				ctx.fillText(tt(b.label), cx, cy + 31 * k, bw - 30 * k);
			}
			ctx.globalAlpha = 1;
			ctx.textBaseline = "alphabetic";
		},
		drawCombo(ctx, c, side, s) {
			const u = c.age / c.life, a = u < .7 ? 1 : 1 - (u - .7) / .3, pop = 1 + Math.max(0, .12 - c.age) * 3, k = Math.max(s, .55);
			const x = side === 0 ? cam.W * .16 : cam.W * .84, y = cam.H * .42;
			ctx.globalAlpha = a;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.font = `700 ${Math.round(48 * k * pop)}px Oswald, sans-serif`;
			ctx.lineWidth = 7 * k;
			ctx.strokeStyle = "rgba(5,6,12,.9)";
			ctx.strokeText(String(c.n), x, y);
			ctx.fillStyle = c.col;
			ctx.fillText(String(c.n), x, y);
			ctx.font = `600 ${Math.round(14 * k)}px Oswald, sans-serif`;
			ctx.lineWidth = 4 * k;
			const hw = tt(S().hits || "VURUŞ");
			ctx.strokeText(hw, x, y + 32 * k);
			ctx.fillStyle = "#ece6d6";
			ctx.fillText(hw, x, y + 32 * k);
			if (c.name) {
				const np = c.named ? 1 + Math.max(0, .15 - c.age) * 3 : 1;
				ctx.font = `700 ${Math.round(20 * k * np)}px Oswald, sans-serif`;
				ctx.lineWidth = 5 * k;
				ctx.strokeText(c.name, x, y + 58 * k);
				ctx.fillStyle = "#ffd27a";
				ctx.fillText(c.name, x, y + 58 * k);
			}
			ctx.globalAlpha = 1;
			ctx.textBaseline = "alphabetic";
		},
		warmTexts(ctx, W) {
			const g = G();
			if (!g || !g.F) return [];
			const J = [], s = cam.s, u = cam.ui || s;
			const job = (fn) => J.push(() => {
				ctx.save();
				ctx.setTransform(1, 0, 0, 1, 0, 0);
				try {
					fn();
				} finally {
					W(0);
					ctx.restore();
				}
			});
			for (const f of g.F) {
				if (!this.human(f)) continue;
				for (const big of [true, false]) {
					if (!big && !(ND.settings && ND.settings.hints)) continue;
					job(() => {
						const P = this.promptLook(f, big, s), k = P.k, key = P.key, word = P.word;
						W(2);
						this.drawPromptAt(ctx, 0, 0, k, 1, 1, 1, key, word);
						for (let pt = 0; pt <= .161; pt += big ? .004 : 1) {
							const pop = big ? 1 + Math.max(0, .16 - pt) * 3 : 1;
							for (let i = 0; i <= 24; i++) {
								W(1);
								this.drawPromptAt(ctx, 0, 0, k, pop, 1 + .06 * Math.sin(i / 24 * 2 * Math.PI), 1, key, word);
							}
						}
					});
				}
			}
			const Ls = S();
			for (const id in TY) {
				const t = TY[id], name = Ls.names && Ls.names[t.id] || t.id.toUpperCase(), label = Ls.labels && Ls.labels[t.id] || "";
				for (const f of g.F) job(() => {
					const b = {
						f,
						t,
						col: tcol(f, t),
						stage: 1,
						age: 0,
						life: 1.05,
						name,
						label
					};
					for (let st = 3; st >= 1; st--) {
						b.stage = st;
						b.age = .5;
						W(2);
						this.drawBanner(ctx, b, u);
					}
					for (b.age = 0; b.age < .122; b.age += .004) {
						W(1);
						this.drawBanner(ctx, b, u);
					}
					b.age = .5;
					W(2);
					this.drawBanner(ctx, b, u);
				});
			}
			const combo = (side, n, name, named, col) => job(() => {
				const c = {
					n,
					name,
					age: .5,
					life: 1.5,
					col,
					to: null,
					named
				};
				W(2);
				this.drawCombo(ctx, c, side, u);
				for (c.age = 0; c.age < .152; c.age += .004) {
					W(1);
					this.drawCombo(ctx, c, side, u);
				}
				c.age = .5;
				W(2);
				this.drawCombo(ctx, c, side, u);
			});
			for (const f of g.F) for (let n = 2; n <= 6; n++) combo(f.id, n, null, false, f.col.ui);
			for (const [side, n, name, named, col] of this.seen.combos.values()) combo(side, n, name, named, col);
			for (const [v, col] of this.seen.nums.values()) job(() => {
				const n = {
					x: 0,
					y: -200,
					v,
					col,
					age: .5,
					life: 1.1
				};
				W(2);
				this.drawNum(ctx, n, s);
				for (n.age = 0; n.age < .182; n.age += .004) {
					W(1);
					this.drawNum(ctx, n, s);
				}
				n.age = .5;
				W(2);
				this.drawNum(ctx, n, s);
			});
			return J;
		},
		rr(ctx, x, y, w, h, r) {
			ctx.beginPath();
			ctx.moveTo(x + r, y);
			ctx.lineTo(x + w - r, y);
			ctx.quadraticCurveTo(x + w, y, x + w, y + r);
			ctx.lineTo(x + w, y + h - r);
			ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
			ctx.lineTo(x + r, y + h);
			ctx.quadraticCurveTo(x, y + h, x, y + h - r);
			ctx.lineTo(x, y + r);
			ctx.quadraticCurveTo(x, y, x + r, y);
			ctx.closePath();
		}
	};
})(window.ND);
