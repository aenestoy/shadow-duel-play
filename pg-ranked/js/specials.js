(function(ND) {
	"use strict";
	const Math = ND.DM || globalThis.Math;
	const { clamp, rand, ease, segSeg } = ND.M;
	const srand = (a, b) => ND.rng.range(a, b);
	const PO = ND.POSES, ATK = ND.ATK, fx = ND.fx, au = ND.audio, cam = ND.cam;
	const TAU = Math.PI * 2, PARRY_WIN = .17;
	const game = () => ND.game || {};
	const hitstop = (t) => game().hitstop && game().hitstop(t);
	const rgbOf = (hex, def = "255,255,255") => {
		if (!hex || hex[0] !== "#") return def;
		const n = parseInt(hex.length === 4 ? hex.slice(1).split("").map((c) => c + c).join("") : hex.slice(1, 7), 16);
		return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`;
	};
	const SFX = ND.specialFx = {
		list: [],
		hooked: false,
		drawHooked: false,
		add(o) {
			o.t = 0;
			this.list.push(o);
			if (this.list.length > 500) this.list.shift();
			return o;
		},
		update(dt) {
			this.hooked = true;
			this.step(dt);
		},
		step(dt) {
			const L = this.list;
			for (let i = L.length - 1; i >= 0; i--) {
				const o = L[i];
				o.t += dt;
				if (o.update && o.update(dt) === false || o.life != null && o.t >= o.life) L.splice(i, 1);
			}
		},
		draw(ctx) {
			this.drawHooked = true;
			this.render(ctx);
		},
		render(ctx) {
			for (const o of this.list) {
				ctx.save();
				o.draw(ctx);
				ctx.restore();
			}
		},
		clear() {
			this.list.length = 0;
		}
	};
	const GRADS = new Map();
	function cgrad(ctx, kind, col, make) {
		let m = GRADS.get(kind);
		if (!m) GRADS.set(kind, m = new Map());
		let g = m.get(col);
		if (!g) m.set(col, g = make(ctx, col));
		return g;
	}
	function stops(g, a) {
		for (let i = 0; i < a.length; i += 2) g.addColorStop(a[i], a[i + 1]);
		return g;
	}
	const mkGlow = (ctx, col) => stops(ctx.createRadialGradient(0, 0, 0, 0, 0, 1), [
		0,
		`rgba(${col},1)`,
		.4,
		`rgba(${col},.35)`,
		1,
		`rgba(${col},0)`
	]);
	const mkWind = (ctx, col) => stops(ctx.createRadialGradient(0, 0, 0, 0, 0, 80), [
		0,
		`rgba(${col},0.35)`,
		1,
		`rgba(${col},0)`
	]);
	const mkShock = (ctx, col) => stops(ctx.createRadialGradient(0, 0, 0, 0, 0, 60), [
		0,
		`rgba(${col},.9)`,
		.5,
		`rgba(${col},.25)`,
		1,
		`rgba(${col},0)`
	]);
	const mkTornado = (ctx, col) => stops(ctx.createRadialGradient(0, -110, 10, 0, -110, 140), [
		0,
		`rgba(${col},0.22)`,
		1,
		`rgba(${col},0)`
	]);
	const mkTetsu = (ctx) => stops(ctx.createRadialGradient(0, 0, 10, 0, 0, 110), [
		0,
		"rgba(255,205,110,.9)",
		.5,
		"rgba(255,170,60,.25)",
		1,
		"rgba(255,150,40,0)"
	]);
	const mkRen = (ctx) => stops(ctx.createRadialGradient(0, 0, 8, 0, 0, 105), [
		0,
		"rgba(255,120,40,.9)",
		.5,
		"rgba(220,60,20,.25)",
		1,
		"rgba(200,40,10,0)"
	]);
	const mkJin = (ctx) => stops(ctx.createRadialGradient(0, 0, 10, 0, 0, 120), [
		0,
		"rgba(255,220,130,.9)",
		.5,
		"rgba(255,190,80,.22)",
		1,
		"rgba(255,170,60,0)"
	]);
	function partUpd(dt) {
		this.vy += this.g * dt;
		if (this.drag) {
			const k = Math.exp(-this.drag * dt);
			this.vx *= k;
			this.vy *= k;
		}
		if (this.flut) this.vx += Math.sin(this.t * this.flut + this.ph) * 220 * dt;
		this.x += this.vx * dt;
		this.y += this.vy * dt;
		this.rot += this.vr * dt;
		if (this.floor && this.y > -1) {
			this.y = -1;
			this.vy *= -.3;
			this.vx *= .55;
			this.vr *= .5;
		}
	}
	function partDraw(ctx) {
		const u = this.t / this.life;
		const a = this.a * (this.fadeIn && u < .2 ? u / .2 : 1) * (1 - u * u);
		if (a <= .01) return;
		ctx.globalAlpha = Math.min(1, a);
		if (this.add) ctx.globalCompositeOperation = "lighter";
		const s = this.sz * (1 + u * this.grow);
		if (this.k === "streak") {
			ctx.strokeStyle = `rgb(${this.c})`;
			ctx.lineWidth = s;
			ctx.lineCap = "round";
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			ctx.lineTo(this.x - this.vx * .045, this.y - this.vy * .045);
			ctx.stroke();
			return;
		}
		ctx.translate(this.x, this.y);
		ctx.rotate(this.rot);
		ctx.fillStyle = `rgb(${this.c})`;
		switch (this.k) {
			case "petal":
				ctx.scale(1, .55 + .45 * Math.sin(this.t * 9 + this.ph));
				ctx.beginPath();
				ctx.moveTo(-s, 0);
				ctx.quadraticCurveTo(0, -s * .9, s, 0);
				ctx.quadraticCurveTo(0, s * .9, -s, 0);
				ctx.fill();
				break;
			case "leaf":
				ctx.beginPath();
				ctx.ellipse(0, 0, s, s * .32, 0, 0, TAU);
				ctx.fill();
				break;
			case "ember": {
				ctx.globalCompositeOperation = "lighter";
				ctx.beginPath();
				ctx.arc(0, 0, s, 0, TAU);
				ctx.fill();
				ctx.globalAlpha *= .35;
				ctx.beginPath();
				ctx.arc(0, 0, s * 2.6, 0, TAU);
				ctx.fill();
				break;
			}
			case "flake":
				ctx.strokeStyle = `rgb(${this.c})`;
				ctx.lineWidth = Math.max(.8, s * .28);
				ctx.lineCap = "round";
				ctx.beginPath();
				for (let i = 0; i < 3; i++) {
					const q = i * Math.PI / 3;
					ctx.moveTo(-Math.cos(q) * s, -Math.sin(q) * s);
					ctx.lineTo(Math.cos(q) * s, Math.sin(q) * s);
				}
				ctx.stroke();
				break;
			case "rock":
				ctx.beginPath();
				ctx.moveTo(-s, -s * .4);
				ctx.lineTo(-s * .2, -s);
				ctx.lineTo(s, -s * .3);
				ctx.lineTo(s * .6, s * .8);
				ctx.lineTo(-s * .7, s * .6);
				ctx.closePath();
				ctx.fill();
				ctx.fillStyle = "rgba(200,205,230,.18)";
				ctx.fillRect(-s * .2, -s * .9, s * .8, s * .35);
				break;
			case "smoke":
				ctx.beginPath();
				ctx.arc(0, 0, s, 0, TAU);
				ctx.fill();
				break;
			default:
				ctx.beginPath();
				ctx.arc(0, 0, s, 0, TAU);
				ctx.fill();
		}
	}
	function part(p) {
		const o = Object.assign({
			vx: 0,
			vy: 0,
			g: 0,
			drag: 0,
			life: .6,
			sz: 3,
			grow: 0,
			a: 1,
			c: "255,255,255",
			rot: rand(0, TAU),
			vr: rand(-6, 6),
			ph: rand(0, TAU)
		}, p);
		o.update = partUpd;
		o.draw = partDraw;
		return SFX.add(o);
	}
	const burst = (n, fn) => {
		for (let i = 0; i < n; i++) part(fn(i));
	};
	function crescent(ctx, r, mid, span, w) {
		const N = 20;
		ctx.beginPath();
		for (let i = 0; i <= N; i++) {
			const th = mid - span + 2 * span * i / N;
			ctx.lineTo(Math.cos(th) * r, Math.sin(th) * r);
		}
		for (let i = N; i >= 0; i--) {
			const th = mid - span + 2 * span * i / N, rr = r - w * Math.sin(Math.PI * i / N);
			ctx.lineTo(Math.cos(th) * rr, Math.sin(th) * rr);
		}
		ctx.closePath();
	}
	function slashArc(o) {
		return SFX.add(Object.assign({
			life: .45,
			r: 90,
			mid: 0,
			span: 1.1,
			w: 22,
			sx: 1,
			sy: 1,
			rotA: 0,
			col: "255,255,255",
			core: "255,255,255",
			grow: .15,
			draw(ctx) {
				const u = this.t / this.life, a = 1 - u * u;
				ctx.globalCompositeOperation = "lighter";
				ctx.translate(this.x, this.y);
				ctx.rotate(this.rotA);
				ctx.scale(this.sx * (1 + u * this.grow), this.sy * (1 + u * this.grow));
				ctx.globalAlpha = a * .55;
				ctx.fillStyle = `rgb(${this.col})`;
				crescent(ctx, this.r * 1.04, this.mid, this.span, this.w * 1.6);
				ctx.fill();
				ctx.globalAlpha = a;
				crescent(ctx, this.r, this.mid, this.span * .97, this.w);
				ctx.fill();
				ctx.globalAlpha = a * .9;
				ctx.fillStyle = `rgb(${this.core})`;
				crescent(ctx, this.r, this.mid, this.span * .9, this.w * .3);
				ctx.fill();
			}
		}, o));
	}
	function glow(x, y, r, col, life = .3, a0 = .8) {
		return SFX.add({
			x,
			y,
			r,
			col,
			life,
			draw(ctx) {
				const u = this.t / this.life, a = a0 * (1 - u);
				ctx.globalCompositeOperation = "lighter";
				ctx.globalAlpha = a;
				const R = this.r * (.6 + u * .6);
				if (!(R > 0)) return;
				ctx.translate(this.x, this.y);
				ctx.scale(R, R);
				ctx.fillStyle = cgrad(ctx, "glow", this.col, mkGlow);
				ctx.beginPath();
				ctx.arc(0, 0, 1, 0, TAU);
				ctx.fill();
			}
		});
	}
	function attach(f, o) {
		const serial = f.serial, atk = f.atk;
		return SFX.add(Object.assign({
			f,
			fade: 0,
			life: 4,
			alive() {
				return f.state === "atk" && f.serial === serial && f.atk === atk && (this.until == null || f.st < this.until);
			},
			update(dt) {
				if (!this.alive()) {
					this.fade += dt;
					if (this.fade > (this.out || .25)) return false;
				}
				if (this.step) this.step(dt);
			},
			k() {
				return 1 - Math.min(1, this.fade / (this.out || .25));
			}
		}, o));
	}
	const bladeTip = (f) => f.j.tip || {
		x: f.x + f.dir * 80,
		y: f.y - 100
	};
	const snd = {
		ring(freq, pan, g = .06, dur = 1.2, delay = 0) {
			[
				1,
				2.71,
				5.2
			].forEach((r, i) => au.tone({
				freq: freq * r,
				dur: dur * (1 - i * .25),
				gain: g / (i + 1),
				send: .6,
				pan,
				delay,
				type: i ? "sine" : "triangle"
			}));
		},
		akaneDraw(pan) {
			au.tone({
				freq: 1500,
				freq1: 2600,
				dur: .55,
				gain: .05,
				send: .6,
				pan,
				type: "triangle",
				attack: .2
			});
			au.noise({
				type: "highpass",
				f0: 4200,
				dur: .3,
				gain: .08,
				attack: .18,
				send: .4,
				pan
			});
		},
		akaneDash(pan) {
			au.noise({
				type: "bandpass",
				f0: 600,
				f1: 5200,
				q: 1.2,
				dur: .32,
				gain: .5,
				attack: .1,
				send: .3,
				pan
			});
			au.tone({
				freq: 3200,
				freq1: 1400,
				dur: .5,
				gain: .05,
				send: .7,
				pan
			});
			au.taiko(.7);
		},
		akaneHit(pan) {
			snd.ring(740, pan, .07, 1.6);
			au.tone({
				freq: 90,
				freq1: 40,
				dur: .6,
				gain: .5,
				send: .3,
				pan
			});
		},
		windCharge(pan) {
			au.noise({
				type: "bandpass",
				f0: 300,
				f1: 1400,
				q: 3,
				dur: .5,
				gain: .22,
				attack: .35,
				send: .4,
				pan
			});
		},
		windRelease(pan) {
			au.noise({
				type: "bandpass",
				f0: 2400,
				f1: 500,
				q: 2.2,
				dur: .8,
				gain: .45,
				attack: .02,
				send: .5,
				pan
			});
			au.noise({
				type: "bandpass",
				f0: 1800,
				f1: 900,
				q: 14,
				dur: .9,
				gain: .14,
				attack: .05,
				send: .6,
				pan
			});
			au.tone({
				freq: 880,
				freq1: 520,
				dur: .7,
				gain: .04,
				send: .7,
				pan
			});
		},
		windHit(pan) {
			au.noise({
				type: "highpass",
				f0: 2500,
				f1: 800,
				dur: .35,
				gain: .35,
				send: .3,
				pan
			});
		},
		kuroCrouch(pan) {
			au.tone({
				freq: 70,
				freq1: 50,
				dur: .5,
				gain: .25,
				type: "sawtooth",
				send: .2,
				pan,
				attack: .1
			});
		},
		kuroLeap(pan) {
			au.swoosh(1.2, pan);
			au.noise({
				type: "lowpass",
				f0: 600,
				dur: .2,
				gain: .25,
				send: .1,
				pan
			});
		},
		kuroImpact(pan) {
			au.taiko(1.5);
			au.thud(1.6, pan);
			au.noise({
				type: "lowpass",
				f0: 260,
				f1: 60,
				dur: 1.4,
				gain: .7,
				attack: .01,
				send: .5,
				pan
			});
			au.noise({
				type: "bandpass",
				f0: 1400,
				f1: 300,
				q: .8,
				dur: .5,
				gain: .3,
				send: .3,
				pan
			});
			for (let i = 0; i < 5; i++) au.noise({
				type: "bandpass",
				f0: rand(1500, 3500),
				q: 5,
				dur: .05,
				gain: .08,
				send: .2,
				pan,
				delay: .1 + i * rand(.04, .09)
			});
		},
		snowGather(pan) {
			au.noise({
				type: "highpass",
				f0: 5e3,
				dur: .35,
				gain: .08,
				attack: .25,
				send: .5,
				pan
			});
			au.tone({
				freq: 2093,
				freq1: 3136,
				dur: .3,
				gain: .03,
				send: .7,
				pan,
				attack: .2
			});
		},
		snowHit(i, pan) {
			au.tone({
				freq: 2600 + i * 260,
				freq1: 2e3 + i * 200,
				dur: .22,
				gain: .05,
				send: .5,
				pan,
				type: "triangle"
			});
			au.noise({
				type: "highpass",
				f0: 6e3,
				dur: .07,
				gain: .12,
				send: .3,
				pan
			});
		},
		snowFinal(pan) {
			[
				1568,
				2093,
				2637,
				3136
			].forEach((f, i) => au.tone({
				freq: f,
				dur: 1.4,
				gain: .035,
				send: .8,
				pan,
				delay: i * .03
			}));
		},
		hanaStart(pan) {
			[
				1319,
				1760,
				2637
			].forEach((f, i) => au.tone({
				freq: f,
				dur: .9,
				gain: .03,
				send: .8,
				pan,
				delay: i * .05,
				type: "triangle"
			}));
		},
		hanaSpin(pan) {
			au.noise({
				type: "bandpass",
				f0: 900,
				f1: 2800,
				q: 1.4,
				dur: .12,
				gain: .18,
				attack: .05,
				send: .15,
				pan
			});
		},
		hanaEnd(pan) {
			[
				2637,
				3136,
				3951
			].forEach((f, i) => au.tone({
				freq: f,
				dur: 1.1,
				gain: .025,
				send: .8,
				pan,
				delay: i * .04
			}));
		},
		tetsuStart(pan) {
			au.clang(.7, pan, .5);
			au.tone({
				freq: 55,
				dur: .8,
				gain: .3,
				send: .4,
				pan,
				attack: .05
			});
		},
		tetsuSpin(pan) {
			au.noise({
				type: "bandpass",
				f0: 180,
				f1: 900,
				q: 1.1,
				dur: .24,
				gain: .4,
				attack: .1,
				send: .2,
				pan
			});
			au.tone({
				freq: 220,
				freq1: 160,
				dur: .25,
				gain: .05,
				send: .3,
				pan,
				type: "triangle"
			});
		},
		armor(pan) {
			au.clang(.7, pan, .55);
		},
		renGrowl(pan) {
			au.tone({
				freq: 85,
				freq1: 55,
				dur: .55,
				gain: .3,
				type: "sawtooth",
				send: .3,
				pan,
				attack: .05
			});
			au.noise({
				type: "lowpass",
				f0: 400,
				dur: .5,
				gain: .25,
				attack: .1,
				send: .2,
				pan
			});
		},
		renRush(pan) {
			au.noise({
				type: "bandpass",
				f0: 200,
				f1: 900,
				q: .8,
				dur: .45,
				gain: .35,
				attack: .08,
				send: .2,
				pan
			});
		},
		renImpact(pan) {
			au.thud(1.6, pan);
			au.taiko(1.2);
			au.noise({
				type: "lowpass",
				f0: 900,
				f1: 200,
				dur: .3,
				gain: .4,
				send: .2,
				pan
			});
		},
		renRise(pan) {
			au.swoosh(1.6, pan);
			au.noise({
				type: "bandpass",
				f0: 300,
				f1: 2200,
				q: 1,
				dur: .45,
				gain: .35,
				attack: .05,
				send: .3,
				pan
			});
			au.tone({
				freq: 160,
				freq1: 640,
				dur: .35,
				gain: .08,
				type: "sawtooth",
				send: .3,
				pan
			});
		},
		poof(pan) {
			au.noise({
				type: "lowpass",
				f0: 1400,
				f1: 200,
				dur: .4,
				gain: .45,
				attack: .01,
				send: .4,
				pan
			});
			au.tone({
				freq: 520,
				freq1: 160,
				dur: .3,
				gain: .06,
				send: .5,
				pan
			});
		},
		appear(pan) {
			au.noise({
				type: "lowpass",
				f0: 300,
				f1: 1600,
				dur: .25,
				gain: .35,
				attack: .03,
				send: .4,
				pan
			});
			au.tone({
				freq: 1800,
				freq1: 2600,
				dur: .18,
				gain: .04,
				send: .6,
				pan,
				type: "triangle"
			});
		}
	};
	function chase(f, o, want, maxV) {
		const gap = (o.x - f.x) * f.dir;
		f.vx = f.dir * clamp((gap - want) * 9, -120, maxV);
		f.drive = true;
	}
	function guardHit(t, post, pdir, x, y) {
		const pan = cam.pan(x);
		t.posture += post;
		t.sinceHit = 0;
		t.gainKi(3);
		fx.spark(x, y, pdir > 0 ? Math.PI : 0, 18, 1.1);
		au.clang(.9, pan, .85);
		t.vx = pdir * 260;
		cam.punch(5);
		hitstop(.08);
		if (t.posture >= 100) {
			t.posture = 100;
			t.setState("gbreak");
			t.vx = pdir * 260;
			t.counterUntil = 0;
			fx.text(t.x, -205, "DENGE KIRILDI!", "#ff9b7a");
			au.clang(1.3, pan, .7);
			cam.punch(9);
			hitstop(.13);
		} else t.setState("block", { dur: .36 });
	}
	const perfectGuard = (t) => t.ctrl.since("guard") <= (ND.parryWin ? ND.parryWin(t) : PARRY_WIN);
	function drawWind(ctx, p) {
		const s = Math.sign(p.vx) || 1, ph = p.rot % 1e3, col = p.col || "150,210,255", A = p.alpha ?? 1;
		ctx.save();
		ctx.translate(p.x, p.y);
		ctx.scale(s, 1 + Math.sin(ph * 2) * .04);
		ctx.globalCompositeOperation = "lighter";
		const A0 = ctx.globalAlpha;
		ctx.globalAlpha = A0 * A;
		ctx.fillStyle = cgrad(ctx, "wind", col, mkWind);
		ctx.beginPath();
		ctx.ellipse(-10, 0, 80, 70, 0, 0, TAU);
		ctx.fill();
		ctx.globalAlpha = A0;
		for (let k = 3; k >= 1; k--) {
			ctx.globalAlpha = A * .18 * (4 - k) / 3;
			ctx.fillStyle = `rgb(${col})`;
			ctx.save();
			ctx.translate(-50 - k * 22, 0);
			crescent(ctx, 70, 0, 1.08, 20);
			ctx.fill();
			ctx.restore();
		}
		ctx.translate(-50, 0);
		ctx.globalAlpha = A * .8;
		ctx.fillStyle = `rgb(${col})`;
		crescent(ctx, 70, 0, 1.12, 24);
		ctx.fill();
		ctx.globalAlpha = A;
		ctx.fillStyle = "#f2fbff";
		crescent(ctx, 70, 0, 1.02, 8);
		ctx.fill();
		ctx.strokeStyle = `rgba(${col},${.5 * A})`;
		ctx.lineWidth = 1.6;
		ctx.lineCap = "round";
		for (let i = 0; i < 4; i++) {
			const yy = -45 + i * 30 + Math.sin(ph * 3 + i) * 4, len = 40 + (i * 37 + ph * 60) % 50;
			ctx.beginPath();
			ctx.moveTo(62, yy);
			ctx.lineTo(62 - len, yy);
			ctx.stroke();
		}
		ctx.restore();
	}
	function drawShock(ctx, p) {
		const s = Math.sign(p.vx) || 1, ph = p.rot % 1e3, col = p.col || "185,160,255", A = p.alpha ?? 1;
		ctx.save();
		ctx.translate(p.x, 0);
		ctx.scale(s, 1);
		ctx.globalCompositeOperation = "lighter";
		ctx.globalAlpha = A * .7;
		ctx.fillStyle = cgrad(ctx, "shock", col, mkShock);
		ctx.beginPath();
		ctx.ellipse(0, 0, 60, 46, 0, Math.PI, TAU);
		ctx.fill();
		ctx.globalCompositeOperation = "source-over";
		ctx.globalAlpha = A;
		for (let i = 0; i < 3; i++) {
			const h = 26 + 14 * Math.abs(Math.sin(ph * 2 + i * 1.7)) - i * 5, x0 = -i * 16 + 6;
			ctx.fillStyle = "#26232d";
			ctx.beginPath();
			ctx.moveTo(x0 - 8, 1);
			ctx.lineTo(x0 + 2, -h);
			ctx.lineTo(x0 + 9, 1);
			ctx.closePath();
			ctx.fill();
			ctx.fillStyle = `rgba(${col},.55)`;
			ctx.beginPath();
			ctx.moveTo(x0 + 2, -h);
			ctx.lineTo(x0 + 9, 1);
			ctx.lineTo(x0 + 5, 1);
			ctx.closePath();
			ctx.fill();
		}
		ctx.restore();
	}
	ND.projSkins = {
		1: drawWind,
		2: drawShock
	};
	const A_WIND = {
		dmg: 21,
		post: 30,
		kb: 420,
		stun: .5,
		kind: "blade",
		knock: true,
		special: true
	};
	class WindBlade {
		constructor(owner, x, y, dir) {
			this.owner = owner;
			this.x = x;
			this.y = y;
			this.vx = dir * 900;
			this.vy = 0;
			this.t = 0;
			this.rot = 1e3;
			this.dead = false;
			this.stuck = false;
			this.falling = false;
			this.fade = 0;
			this.alpha = 1;
			this.col = rgbOf(owner.col.accent, "150,210,255");
		}
		dissipate() {
			if (this.fade > 0) return;
			this.fade = .18;
			burst(10, () => ({
				k: "leaf",
				x: this.x,
				y: this.y + rand(-40, 40),
				vx: rand(-200, 200) + this.vx * .2,
				vy: rand(-160, 60),
				g: 300,
				drag: 2,
				life: rand(.5, .9),
				sz: rand(3, 6),
				c: this.col,
				a: .8
			}));
		}
		update(dt) {
			this.t += dt;
			this.x += this.vx * dt;
			this.rot = 1e3 + this.t * 9 % 6.28;
			if (this.fade > 0) {
				this.fade -= dt;
				this.alpha = Math.max(0, this.fade / .18);
				this.vx *= Math.exp(-8 * dt);
				if (this.fade <= 0) this.dead = true;
				return;
			}
			const s = Math.sign(this.vx);
			if (Math.random() < dt * 45) part({
				k: "streak",
				x: this.x - s * rand(10, 60),
				y: this.y + rand(-50, 50),
				vx: this.vx * .35,
				life: .22,
				sz: 1.4,
				c: "215,238,255",
				add: true,
				rot: 0,
				vr: 0
			});
			if (Math.random() < dt * 14) part({
				k: "leaf",
				x: this.x - s * 20,
				y: this.y + rand(-45, 45),
				vx: this.vx * .4,
				vy: rand(-60, 60),
				drag: 3,
				g: 120,
				flut: 8,
				life: rand(.4, .7),
				sz: rand(3, 5),
				c: this.col,
				a: .9
			});
			if (this.t > 1.05 || Math.abs(this.x) > ND.ARENA + 80) return this.dissipate();
			const t = this.owner.opp;
			if (!t || t.dead || t.isInv()) return;
			const pan = cam.pan(this.x);
			if (t.bladeActive() && t.j.tip) {
				const r = segSeg(this.x, this.y - 58, this.x, this.y + 58, t.j.haF.x, t.j.haF.y, t.j.tip.x, t.j.tip.y);
				if (r.d < 10) {
					fx.spark(r.x, r.y, s > 0 ? Math.PI : 0, 20, 1.1, "200,230,255");
					au.clang(.9, pan, 1.3);
					fx.text(t.x, -200, "KESİLDİ!", "#cfe8ff");
					t.gainKi(10);
					hitstop(.06);
					return this.dissipate();
				}
			}
			for (const h of ND.hurtboxes(t.j)) {
				const r = segSeg(this.x, this.y - 56, this.x, this.y + 56, h[0], h[1], h[2], h[3]);
				if (r.d > h[4] + 6) continue;
				if (t.guardingFrom(this.owner, this.x - s * 60)) {
					if (perfectGuard(t) || t.ch.reflect) {
						this.owner = t;
						this.vx = -this.vx * 1.05;
						this.t = Math.min(this.t, .35);
						this.col = rgbOf(t.col.accent, this.col);
						fx.ring(this.x, this.y, "220,240,255", 110);
						fx.spark(this.x, this.y, this.vx > 0 ? 0 : Math.PI, 16);
						fx.text(t.x, -200, "YANSITMA!", "#ffe3a1");
						au.parry(pan);
						hitstop(.1);
						t.gainKi(14);
						t.setState("parry");
						t.parries = (t.parries || 0) + 1;
					} else {
						guardHit(t, 46, s, r.x, r.y);
						this.dissipate();
					}
					return;
				}
				const own = this.owner, dmg = Math.round(A_WIND.dmg * (own.ch.dmg || 1));
				own.gainKi((ND.scaleDmg ? ND.scaleDmg(dmg, A_WIND) : dmg) * 1.6);
				fx.text(r.x, r.y - 34, "風の刃", "#ffd27a");
				glow(r.x, r.y, 80, this.col, .3);
				burst(14, () => ({
					k: "leaf",
					x: r.x,
					y: r.y,
					vx: s * rand(100, 520),
					vy: rand(-340, 80),
					g: 500,
					drag: 1.5,
					flut: 7,
					life: rand(.6, 1.1),
					sz: rand(3, 6),
					c: this.col
				}));
				snd.windHit(pan);
				t.takeHit(dmg, A_WIND, own, r.x, r.y, "body", s);
				this.dissipate();
				return;
			}
		}
		draw(ctx) {
			drawWind(ctx, this);
		}
	}
	const A_SHOCK = {
		dmg: 10,
		post: 40,
		kb: 280,
		stun: .5,
		kind: "kick",
		knock: true,
		special: true
	};
	function spike(x, h, col, s) {
		return SFX.add({
			x,
			h,
			col,
			s,
			life: .6,
			lean: rand(-.35, .35),
			draw(ctx) {
				const u = this.t / this.life, k = u < .12 ? ease.outBack(u / .12) : 1 - ease.inCubic((u - .12) / .88);
				const H = this.h * Math.max(0, k);
				if (H < 1) return;
				ctx.translate(this.x, 2);
				ctx.rotate(this.lean * this.s);
				ctx.fillStyle = "#231f28";
				ctx.beginPath();
				ctx.moveTo(-9, 0);
				ctx.lineTo(-2, -H);
				ctx.lineTo(3, -H * .8);
				ctx.lineTo(10, 0);
				ctx.closePath();
				ctx.fill();
				ctx.fillStyle = `rgba(${this.col},${.45 * (1 - u)})`;
				ctx.beginPath();
				ctx.moveTo(-2, -H);
				ctx.lineTo(3, -H * .8);
				ctx.lineTo(10, 0);
				ctx.lineTo(5, 0);
				ctx.closePath();
				ctx.fill();
			}
		});
	}
	class Shockwave {
		constructor(owner, x, dir) {
			this.owner = owner;
			this.x = x;
			this.y = -4;
			this.vx = dir * 760;
			this.vy = 0;
			this.t = 0;
			this.life = .62;
			this.rot = 2e3;
			this.dead = false;
			this.stuck = false;
			this.falling = false;
			this.hitDone = false;
			this.emitX = x;
			this.alpha = 1;
			this.col = rgbOf(owner.col.accent, "185,160,255");
		}
		update(dt) {
			this.t += dt;
			this.x += this.vx * dt;
			this.rot = 2e3 + this.t * 10 % 6.28;
			this.alpha = Math.min(1, (this.life - this.t) / .15);
			const s = Math.sign(this.vx);
			while (Math.abs(this.x - this.emitX) > 26) {
				this.emitX += s * 26;
				spike(this.emitX, rand(20, 44) * (1 - this.t / this.life * .5), this.col, s);
				if (Math.random() < .5) part({
					k: "rock",
					x: this.emitX,
					y: -4,
					vx: rand(-80, 80) + s * 60,
					vy: rand(-420, -200),
					g: 1500,
					floor: true,
					life: rand(.5, .9),
					sz: rand(2, 4.5),
					c: "58,54,66",
					vr: rand(-12, 12)
				});
				if (ND.fx.decals && Math.random() < .7) {
					fx.decals.push({
						x: this.emitX + rand(-6, 6),
						y: rand(2, 12),
						rx: rand(8, 16),
						ry: rand(1.5, 3),
						a: .55,
						c: "#07070b"
					});
					if (fx.decals.length > 420) fx.decals.shift();
				}
			}
			if (Math.random() < dt * 30) fx.dust(this.x, 0, 1, .6);
			if (this.t > this.life || Math.abs(this.x) > ND.ARENA + 20) {
				this.dead = true;
				return;
			}
			if (this.hitDone) return;
			const o = this.owner.opp;
			if (!o || o.dead || o.isInv() || !o.onGround || o.y < -45 || Math.abs(o.x - this.x) > 36) return;
			this.hitDone = true;
			const pan = cam.pan(this.x);
			if (o.guardingFrom(this.owner, this.x - s * 40)) {
				if (perfectGuard(o)) {
					fx.ring(o.x, -30, "255,236,190", 90);
					fx.spark(o.x, -20, -Math.PI / 2, 16);
					fx.text(o.x, -205, "SAVUŞTURMA!", "#ffe3a1");
					au.parry(pan);
					hitstop(.1);
					o.setState("parry");
					o.gainKi(14);
					o.parries = (o.parries || 0) + 1;
					this.dead = true;
					return;
				}
				guardHit(o, 58, s, o.x - s * 10, -40);
				return;
			}
			const dmg = Math.round(A_SHOCK.dmg * (this.owner.ch.dmg || 1));
			this.owner.gainKi((ND.scaleDmg ? ND.scaleDmg(dmg, A_SHOCK) : dmg) * 1.6);
			fx.text(o.x, -150, "山砕き", "#ffd27a");
			o.takeHit(dmg, A_SHOCK, this.owner, o.x - s * 8, -50, "leg", s);
			fx.dust(o.x, 0, 12, 1.3);
		}
		draw(ctx) {
			drawShock(ctx, this);
		}
	}
	ND.WindBlade = WindBlade;
	ND.Shockwave = Shockwave;
	const E = ease;
	const DEF = {};
	DEF.sp_akane = {
		keys: [
			[
				.26,
				"iai1",
				E.inOutSine
			],
			[.3, "iai1"],
			[
				.42,
				"iai2",
				E.outQuart
			],
			[.64, "iai2"],
			[
				.8,
				"sp_akEnd",
				E.outCubic
			],
			[
				1,
				"stance",
				E.inOut
			]
		],
		active: [.3, .45],
		dmg: 27,
		post: 65,
		kb: 380,
		stun: .6,
		lunge: [
			.3,
			.43,
			1950
		],
		sw: .3,
		pw: 1.7,
		kind: "blade",
		knock: true,
		special: true,
		cross: true,
		pass: [.28, .5],
		glint: [.08, .3],
		trail: "255,70,55",
		kanji: "紅一閃",
		ev: [
			[.01, (f) => {
				snd.akaneDraw(f.pan);
				burst(16, () => {
					const a = rand(0, TAU), r = rand(50, 90);
					return {
						k: "ember",
						x: f.x + Math.cos(a) * r,
						y: f.y - 70 + Math.sin(a) * r * .7,
						vx: -Math.cos(a) * r * 3,
						vy: -Math.sin(a) * r * 2.1,
						drag: 3,
						life: .3,
						sz: rand(1.2, 2.2),
						c: "255,90,60",
						fadeIn: true
					};
				});
			}],
			[.3, (f) => {
				f.mem.x0 = f.x;
				snd.akaneDash(f.pan);
				glow(f.x, f.y - 80, 70, "255,80,60", .25);
			}],
			[.45, (f) => {
				const x0 = f.mem.x0 ?? f.x, x1 = f.x, d = Math.abs(x1 - x0);
				if (d < 80) return;
				const mx = (x0 + x1) / 2, s = Math.sign(x1 - x0);
				slashArc({
					x: mx,
					y: f.y - 150,
					r: d / 2 + 30,
					mid: Math.PI / 2,
					span: 1.25,
					w: 34,
					sx: 1,
					sy: .42,
					rotA: -.06 * s,
					col: "255,60,45",
					core: "255,235,220",
					life: .75,
					grow: .06
				});
				slashArc({
					x: mx,
					y: f.y - 150,
					r: d / 2 + 30,
					mid: Math.PI / 2,
					span: 1.1,
					w: 10,
					sx: 1,
					sy: .42,
					rotA: -.06 * s,
					col: "255,180,120",
					core: "255,255,255",
					life: .35,
					grow: .12
				});
				for (let i = 0; i < 26; i++) {
					const u = rand(-1, 1), x = mx + u * d / 2, y = f.y - 150 + (1 - u * u) * (d / 2 + 30) * .42 * .98;
					part({
						k: i % 3 ? "ember" : "petal",
						x,
						y,
						vx: rand(-40, 40),
						vy: rand(-60, 30),
						g: i % 3 ? -60 : 90,
						drag: 1.2,
						flut: i % 3 ? 0 : 6,
						life: rand(.7, 1.3),
						sz: i % 3 ? rand(1.2, 2.4) : rand(4, 6),
						c: i % 3 ? "255,110,60" : "255,176,196",
						fadeIn: true,
						delay: 0
					});
				}
			}]
		],
		tick(f, dt, t) {
			if (t > .3 && t < .46 && Math.random() < dt * 90) {
				const tp = bladeTip(f);
				part({
					k: "ember",
					x: tp.x + rand(-10, 10),
					y: tp.y + rand(-10, 10),
					vx: -f.dir * rand(40, 200),
					vy: rand(-120, 20),
					g: -40,
					drag: 2,
					life: rand(.4, .8),
					sz: rand(1.2, 2.4),
					c: "255,100,60"
				});
			}
		},
		onHit(f, o, x, y) {
			snd.akaneHit(f.pan);
			glow(x, y, 120, "255,60,45", .35);
			fx.ring(x, y, "255,90,70", 120);
			burst(22, () => ({
				k: "petal",
				x,
				y,
				vx: f.dir * rand(60, 460),
				vy: rand(-380, 60),
				g: 260,
				drag: 1.4,
				flut: 6,
				life: rand(.8, 1.5),
				sz: rand(4, 7),
				c: Math.random() < .5 ? "255,176,196" : "250,206,218"
			}));
			burst(20, () => ({
				k: "ember",
				x,
				y,
				vx: f.dir * rand(100, 600),
				vy: rand(-300, 100),
				g: -80,
				drag: 2,
				life: rand(.5, 1),
				sz: rand(1.2, 2.6),
				c: "255,140,80"
			}));
		}
	};
	DEF.sp_aoi = {
		keys: [
			[
				.2,
				"sp_kzA",
				E.inOutSine
			],
			[.27, "sp_kzA"],
			[
				.35,
				"sp_kzB",
				E.outQuart
			],
			[
				.45,
				"sp_kzC",
				E.outCubic
			],
			[.62, "sp_kzC"],
			[
				.86,
				"stance",
				E.inOut
			]
		],
		active: [.31, .37],
		hits: [],
		dmg: A_WIND.dmg,
		post: 44,
		kb: 420,
		stun: .5,
		sw: .29,
		pw: 1.5,
		kind: "blade",
		knock: true,
		special: true,
		glint: [.06, .26],
		trail: "140,210,255",
		kanji: "風の刃",
		ev: [[.01, (f) => {
			snd.windCharge(f.pan);
			burst(18, () => {
				const a = rand(0, TAU), r = rand(60, 120);
				return {
					k: "streak",
					x: f.x + Math.cos(a) * r,
					y: f.y - 90 + Math.sin(a) * r * .6,
					vx: -Math.cos(a) * r * 3.2,
					vy: -Math.sin(a) * r * 2,
					life: .28,
					sz: 1.3,
					c: "200,230,255",
					add: true,
					rot: 0,
					vr: 0
				};
			});
		}], [.33, (f) => {
			const g = game();
			if (g.projs) g.projs.push(new WindBlade(f, f.x + f.dir * 70, f.y - 104, f.dir));
			snd.windRelease(f.pan);
			cam.punch(4);
			slashArc({
				x: f.x + f.dir * 30,
				y: f.y - 100,
				r: 80,
				mid: f.dir > 0 ? 0 : Math.PI,
				span: 1.2,
				w: 20,
				col: rgbOf(f.col.accent),
				core: "240,250,255",
				life: .3
			});
			fx.dust(f.x, 0, 8, 1.2);
		}]]
	};
	DEF.sp_kuro = {
		keys: [
			[
				.2,
				"sp_ykA",
				E.inOutSine
			],
			[.25, "sp_ykA"],
			[
				.38,
				"sp_ykB",
				E.outCubic
			],
			[.44, "sp_ykB"],
			[
				.52,
				"sp_ykC",
				E.inCubic
			],
			[.78, "sp_ykC"],
			[
				1.04,
				"stance",
				E.inOut
			]
		],
		active: [.45, .56],
		dmg: 16,
		post: 50,
		kb: 360,
		stun: .6,
		sw: .44,
		pw: 1.8,
		kind: "blade",
		knock: true,
		special: true,
		arc: true,
		glint: [.04, .24],
		trail: "190,165,255",
		kanji: "山砕き",
		ev: [
			[.01, (f) => {
				snd.kuroCrouch(f.pan);
				fx.dust(f.x, 0, 6, .8);
			}],
			[.25, (f) => {
				snd.kuroLeap(f.pan);
				fx.dust(f.x, 0, 12, 1.4);
				glow(f.x, -20, 70, rgbOf(f.col.accent), .25, .5);
			}],
			[.52, (f) => {
				f.y = 0;
				const x = f.x + f.dir * 125, col = rgbOf(f.col.accent, "185,160,255"), g = game();
				if (g.projs) g.projs.push(new Shockwave(f, x, f.dir));
				snd.kuroImpact(f.pan);
				cam.punch(14);
				hitstop(.05);
				fx.dust(x, 0, 22, 2.2);
				fx.ring(x, -6, "210,200,255", 140);
				fx.flash(x, -10, 0, 120, col);
				glow(x, -10, 140, col, .4);
				burst(22, () => ({
					k: "rock",
					x: x + rand(-30, 30),
					y: -4,
					vx: rand(-320, 320),
					vy: rand(-720, -260),
					g: 1700,
					floor: true,
					life: rand(.7, 1.2),
					sz: rand(2.5, 6),
					c: Math.random() < .5 ? "58,54,66" : "84,80,94",
					vr: rand(-14, 14)
				}));
				for (let i = -2; i <= 2; i++) spike(x + i * 16, 50 - Math.abs(i) * 9, col, f.dir);
				if (fx.decals) {
					fx.decals.push({
						x,
						y: 8,
						rx: 46,
						ry: 7,
						a: .7,
						c: "#060609"
					});
					fx.decals.push({
						x: x + f.dir * 10,
						y: 6,
						rx: 70,
						ry: 3,
						a: .4,
						c: "#07070b"
					});
				}
			}]
		],
		tick(f, dt, t, o) {
			const m = f.mem, t0 = .25, t1 = .52;
			if (t >= t0 && t < t1) {
				if (m.lx == null) {
					m.lx = f.x;
					const d = clamp((o.x - f.dir * 150 - f.x) * f.dir, 0, 430);
					m.tx = clamp(f.x + f.dir * d, -ND.ARENA, ND.ARENA);
				}
				const u = (t - t0) / (t1 - t0);
				f.x = m.lx + (m.tx - m.lx) * u;
				f.y = -150 * Math.sin(Math.PI * u);
				f.vx = 0;
				f.drive = true;
				if (Math.random() < dt * 30) part({
					k: "streak",
					x: f.x + rand(-20, 20),
					y: f.y - rand(20, 140),
					vx: -f.dir * 200,
					vy: 80,
					life: .2,
					sz: 1.2,
					c: rgbOf(f.col.accent),
					add: true,
					rot: 0,
					vr: 0
				});
			} else if (t >= t1 && f.y < 0) f.y = 0;
		}
	};
	const yukiHitT = [
		.18,
		.26,
		.34,
		.42,
		.54
	];
	DEF.sp_yuki = {
		keys: [
			[
				.12,
				"sp_fbA",
				E.inOutSine
			],
			[
				.18,
				"sp_fb1",
				E.outQuart
			],
			[
				.26,
				"sp_fb2",
				E.outQuart
			],
			[
				.34,
				"sp_fb3",
				E.outQuart
			],
			[
				.42,
				"sp_fb4",
				E.outQuart
			],
			[
				.47,
				"sp_fbA",
				E.inOutSine
			],
			[
				.54,
				"sp_fb5",
				E.outQuart
			],
			[.72, "sp_fb5"],
			[
				.92,
				"stance",
				E.inOut
			]
		],
		active: [.15, .2],
		hits: [
			[.15, .2],
			[.23, .28],
			[.31, .36],
			[.39, .44],
			[.51, .57]
		],
		zone: [
			124,
			12,
			110
		],
		dmg: 5.5,
		post: 15,
		kb: 50,
		stun: .42,
		knockLast: true,
		lastHit: {
			dmg: 9,
			kb: 380,
			post: 26
		},
		sw: .14,
		pw: 1.2,
		kind: "blade",
		special: true,
		glint: [.02, .12],
		trail: "215,240,255",
		kanji: "吹雪",
		ev: [[.01, (f) => {
			snd.snowGather(f.pan);
			burst(26, () => {
				const a = rand(0, TAU), r = rand(60, 130);
				return {
					k: "flake",
					x: f.x + Math.cos(a) * r,
					y: f.y - 80 + Math.sin(a) * r * .7,
					vx: -Math.cos(a) * r * 2.8,
					vy: -Math.sin(a) * r * 2,
					drag: 2,
					life: .32,
					sz: rand(2, 3.5),
					c: "235,245,255",
					fadeIn: true,
					vr: 8
				};
			});
		}]].concat(yukiHitT.map((ht, i) => [ht, (f) => {
			const tp = bladeTip(f), last = i === yukiHitT.length - 1;
			snd.snowHit(i, f.pan);
			slashArc({
				x: f.x + f.dir * 55,
				y: f.y - 95,
				r: last ? 95 : 70,
				mid: (f.dir > 0 ? 0 : Math.PI) + [
					.5,
					-.6,
					0,
					.3,
					-.9
				][i] * f.dir,
				span: last ? 1.3 : .95,
				w: last ? 22 : 14,
				col: "170,215,255",
				core: "255,255,255",
				life: last ? .4 : .22
			});
			burst(last ? 34 : 10, () => ({
				k: "flake",
				x: tp.x + rand(-12, 12),
				y: tp.y + rand(-12, 12),
				vx: f.dir * rand(40, last ? 520 : 300),
				vy: rand(-260, 120),
				g: 90,
				drag: 2.4,
				flut: 5,
				life: rand(.5, last ? 1.3 : .9),
				sz: rand(2, 4),
				c: "235,245,255",
				vr: rand(-6, 6)
			}));
			if (last) {
				snd.snowFinal(f.pan);
				glow(tp.x, tp.y, 110, "190,225,255", .35);
				cam.punch(5);
			}
		}])),
		tick(f, dt, t, o) {
			if (t > .03 && t < .56) chase(f, o, 68, t < .16 ? 1500 : 560);
			if (Math.random() < dt * 40) part({
				k: "flake",
				x: f.x + rand(-60, 60),
				y: f.y - rand(20, 170),
				vx: -f.dir * rand(60, 200),
				vy: rand(-30, 60),
				drag: 1,
				flut: 4,
				life: rand(.5, .9),
				sz: rand(1.5, 3),
				c: "225,238,255",
				vr: 4
			});
		},
		onHit(f, o, x, y) {
			glow(x, y, 60, "200,230,255", .2);
			burst(8, () => ({
				k: "flake",
				x,
				y,
				vx: f.dir * rand(60, 300),
				vy: rand(-200, 100),
				drag: 2,
				life: rand(.4, .8),
				sz: rand(2, 3.5),
				c: "240,248,255"
			}));
		}
	};
	const hanaT0 = .2, hanaHalf = .07, hanaN = 8, hanaT1 = hanaT0 + hanaN * hanaHalf;
	const hanaKeys = [[
		.16,
		"sp_hfW",
		E.inOutSine
	]];
	for (let i = 0; i <= hanaN; i++) hanaKeys.push([
		hanaT0 + i * hanaHalf,
		i % 2 ? "sp_hfA2" : "sp_hfA",
		E.inOutSine
	]);
	hanaKeys.push([
		.84,
		"sp_hfEnd",
		E.outQuart
	], [.98, "sp_hfEnd"], [
		1.16,
		"stance",
		E.inOut
	]);
	DEF.sp_hana = {
		keys: hanaKeys,
		active: [.19, .25],
		hits: [
			[.19, .25],
			[.33, .39],
			[.47, .53],
			[.61, .67],
			[.8, .87]
		],
		zone: [
			100,
			100,
			115
		],
		dmg: 5,
		post: 14,
		kb: 40,
		stun: .46,
		knockLast: true,
		lastHit: {
			dmg: 8,
			kb: 360,
			post: 24
		},
		sw: .18,
		pw: 1.1,
		kind: "blade",
		special: true,
		glint: [.04, .16],
		trail: "255,140,190",
		kanji: "花吹雪",
		ev: [
			[.01, (f) => {
				snd.hanaStart(f.pan);
				burst(14, () => ({
					k: "petal",
					x: f.x + rand(-40, 40),
					y: f.y - rand(40, 150),
					vx: rand(-60, 60),
					vy: rand(-60, 0),
					drag: 1,
					flut: 6,
					life: .6,
					sz: rand(3.5, 5.5),
					c: "255,160,200",
					fadeIn: true
				}));
			}],
			[hanaT0, (f) => {
				hanaWhirl(f);
			}],
			[.82, (f) => {
				snd.hanaEnd(f.pan);
				glow(f.x, f.y - 90, 140, "255,130,190", .4);
				burst(40, () => {
					const a = rand(0, TAU), sp = rand(150, 520);
					return {
						k: "petal",
						x: f.x + Math.cos(a) * 30,
						y: f.y - 90 + Math.sin(a) * 20,
						vx: Math.cos(a) * sp,
						vy: Math.sin(a) * sp * .6 - 120,
						g: 220,
						drag: 1.6,
						flut: 7,
						life: rand(.9, 1.6),
						sz: rand(4, 7),
						c: Math.random() < .6 ? "255,150,195" : "255,210,228"
					};
				});
			}]
		].concat([
			0,
			1,
			2,
			3,
			4,
			5,
			6,
			7
		].map((i) => [hanaT0 + i * hanaHalf, (f) => snd.hanaSpin(f.pan)])).sort((a, b) => a[0] - b[0]),
		tick(f, dt, t, o) {
			if (t >= hanaT0 && t < hanaT1) {
				const c = Math.cos((t - hanaT0) / (2 * hanaHalf) * TAU);
				f.vdir = (c < 0 ? -1 : 1) * Math.max(.16, Math.abs(c));
				chase(f, o, 46, 420);
				if (Math.random() < dt * 60) part({
					k: "petal",
					x: f.x + rand(-90, 90),
					y: f.y - rand(30, 160),
					vx: rand(-200, 200),
					vy: rand(-120, 40),
					g: 120,
					drag: 1.5,
					flut: 7,
					life: rand(.6, 1.1),
					sz: rand(3.5, 6),
					c: Math.random() < .6 ? "255,150,195" : "255,210,228"
				});
			} else {
				f.vdir = 1;
				if (t > .04 && t < hanaT0) chase(f, o, 60, 1100);
				else if (t < .86 && t >= hanaT1) chase(f, o, 50, 200);
			}
		},
		onHit(f, o, x, y) {
			burst(8, () => ({
				k: "petal",
				x,
				y,
				vx: rand(-280, 280),
				vy: rand(-260, 40),
				g: 200,
				drag: 1.5,
				flut: 6,
				life: rand(.6, 1),
				sz: rand(4, 6),
				c: "255,170,205"
			}));
		}
	};
	function hanaWhirl(f) {
		attach(f, {
			out: .3,
			draw(ctx) {
				const k = this.k(), f = this.f, cx = f.x, cy = f.y - 92, ph = this.t * 16;
				ctx.globalCompositeOperation = "lighter";
				for (let b = 0; b < 3; b++) {
					const rx = 88 + b * 16, ry = 22 + b * 6, yy = cy - 50 + b * 50;
					ctx.strokeStyle = `rgba(255,${150 + b * 30},${200 + b * 10},${.4 * k})`;
					ctx.lineWidth = 4 - b;
					ctx.beginPath();
					ctx.ellipse(cx, yy, rx, ry, 0, ph + b * 2, ph + b * 2 + 2.4);
					ctx.stroke();
					ctx.beginPath();
					ctx.ellipse(cx, yy, rx, ry, 0, ph + b * 2 + Math.PI, ph + b * 2 + Math.PI + 1.6);
					ctx.stroke();
				}
				ctx.globalCompositeOperation = "source-over";
				for (let i = 0; i < 16; i++) {
					const a = ph * .8 + i * TAU / 16, rx = 70 + i % 4 * 14, yy = cy - 70 + i % 5 * 32 + Math.sin(ph + i) * 6;
					const x = cx + Math.cos(a) * rx, y = yy + Math.sin(a) * 18;
					ctx.globalAlpha = k * (.55 + .45 * Math.sin(a));
					ctx.fillStyle = i % 3 ? "#ff9cc6" : "#ffd6e6";
					ctx.save();
					ctx.translate(x, y);
					ctx.rotate(a * 2 + i);
					ctx.scale(1, .55);
					ctx.beginPath();
					ctx.moveTo(-5, 0);
					ctx.quadraticCurveTo(0, -4.5, 5, 0);
					ctx.quadraticCurveTo(0, 4.5, -5, 0);
					ctx.fill();
					ctx.restore();
				}
			}
		});
	}
	const tzT0 = .32, tzT1 = .8;
	DEF.sp_tetsu = {
		keys: [
			[
				.26,
				"sp_tzW",
				E.inOutSine
			],
			[
				tzT0,
				"sp_tzA",
				E.outQuart
			],
			[tzT1, "sp_tzA"],
			[
				.9,
				"sp_tzEnd",
				E.outCubic
			],
			[1.08, "sp_tzEnd"],
			[
				1.3,
				"stance",
				E.inOut
			]
		],
		active: [.3, .35],
		hits: [
			[.3, .35],
			[.42, .47],
			[.54, .59],
			[.66, .71],
			[.78, .84]
		],
		zone: [
			205,
			205,
			125
		],
		dmg: 4,
		post: 20,
		kb: 60,
		stun: .5,
		knockLast: true,
		lastHit: {
			dmg: 7,
			kb: 440,
			post: 30
		},
		armor: [.08, .86],
		armorMul: .5,
		sw: .3,
		pw: 1.5,
		kind: "blade",
		special: true,
		glint: [.04, .24],
		trail: "255,205,110",
		kanji: "鉄の渦",
		ev: [[.01, (f) => {
			snd.tetsuStart(f.pan);
			tetsuAura(f);
		}], [tzT0, (f) => tetsuWhirl(f)]].concat([
			0,
			1,
			2,
			3
		].map((i) => [tzT0 + i * .12, (f) => {
			snd.tetsuSpin(f.pan);
			fx.dust(f.x, 0, 5, 1.6);
		}])).sort((a, b) => a[0] - b[0]),
		tick(f, dt, t, o) {
			if (t >= tzT0 && t < tzT1) {
				const c = Math.cos((t - tzT0) / (tzT1 - tzT0) * 2 * TAU);
				f.vdir = (c < 0 ? -1 : 1) * Math.max(.12, Math.abs(c));
				chase(f, o, 110, 170);
			} else f.vdir = 1;
		},
		onArmor(f, from, x, y) {
			snd.armor(f.pan);
			fx.spark(x, y, -Math.PI / 2, 12, .9, "255,215,120");
			glow(f.x, f.y - 90, 90, "255,200,90", .2, .6);
			if (!f.mem.armTxt) {
				f.mem.armTxt = true;
				fx.text(f.x, -215, "ZIRH!", "#ffd27a");
			}
		}
	};
	function tetsuAura(f) {
		attach(f, {
			until: .86,
			out: .2,
			draw(ctx) {
				const k = this.k(), f = this.f, pul = .75 + .25 * Math.sin(this.t * 22);
				ctx.globalCompositeOperation = "lighter";
				ctx.globalAlpha = .38 * k * pul;
				ctx.translate(f.x, f.y - 90);
				ctx.fillStyle = cgrad(ctx, "tetsu", "", mkTetsu);
				ctx.beginPath();
				ctx.ellipse(0, 0, 80, 115, 0, 0, TAU);
				ctx.fill();
			}
		});
	}
	function tetsuWhirl(f) {
		attach(f, {
			until: tzT1 + .04,
			out: .28,
			draw(ctx) {
				const k = this.k(), f = this.f, ph = this.t * 26 * (f.dir > 0 ? 1 : -1), cx = f.x, cy = f.y - 78;
				ctx.globalCompositeOperation = "lighter";
				ctx.lineCap = "round";
				for (let i = 0; i < 3; i++) {
					const rx = 205 - i * 26, ry = 30 - i * 5, a0 = ph + i * 2.1;
					ctx.strokeStyle = `rgba(255,${210 - i * 30},${120 - i * 30},${(.5 - i * .12) * k})`;
					ctx.lineWidth = 7 - i * 2;
					ctx.beginPath();
					ctx.ellipse(cx, cy + i * 6, rx, ry, 0, a0, a0 + 2.2);
					ctx.stroke();
					ctx.globalAlpha = .5;
					ctx.beginPath();
					ctx.ellipse(cx, cy + i * 6, rx, ry, 0, a0 + Math.PI, a0 + Math.PI + 1.4);
					ctx.stroke();
					ctx.globalAlpha = 1;
				}
				ctx.strokeStyle = `rgba(200,190,170,${.18 * k})`;
				ctx.lineWidth = 10;
				ctx.beginPath();
				ctx.ellipse(cx, -2, 150 + Math.sin(this.t * 9) * 10, 12, 0, 0, TAU);
				ctx.stroke();
			}
		});
	}
	const RUSH = {
		dmg: 6,
		post: 30,
		kb: 90,
		stun: .8,
		kind: "kick",
		special: true,
		kanji: "鬼"
	};
	const renT0 = .22, renT1 = .62;
	DEF.sp_ren = {
		keys: [
			[
				.16,
				"sp_onA",
				E.inOutSine
			],
			[
				renT0,
				"sp_onRush",
				E.outCubic
			],
			[renT1, "sp_onRush"],
			[
				.68,
				"sp_onRise1",
				E.outQuart
			],
			[
				.78,
				"sp_onRise2",
				E.outQuart
			],
			[.96, "sp_onRise2"],
			[
				1.2,
				"stance",
				E.inOut
			]
		],
		active: [.7, .8],
		zone: [
			140,
			15,
			150
		],
		dmg: 14,
		post: 40,
		kb: 220,
		stun: .6,
		knock: true,
		lift: 1.55,
		sw: .7,
		pw: 1.6,
		kind: "blade",
		special: true,
		glint: [.02, .18],
		trail: "255,130,50",
		kanji: "鬼の怒り",
		ev: [
			[.01, (f) => {
				snd.renGrowl(f.pan);
				renAura(f);
			}],
			[renT0, (f) => {
				snd.renRush(f.pan);
				fx.dust(f.x, 0, 10, 1.3);
			}],
			[.7, (f) => {
				snd.renRise(f.pan);
				slashArc({
					x: f.x + f.dir * 40,
					y: f.y - 120,
					r: 95,
					mid: f.dir > 0 ? -.2 : Math.PI + .2,
					span: 1.3,
					w: 26,
					rotA: -.5 * f.dir,
					col: "255,110,40",
					core: "255,230,160",
					life: .45
				});
				burst(18, () => ({
					k: "ember",
					x: f.x + f.dir * rand(20, 90),
					y: f.y - rand(40, 200),
					vx: f.dir * rand(0, 120),
					vy: rand(-420, -120),
					g: -60,
					drag: 1.8,
					life: rand(.5, 1),
					sz: rand(1.5, 3),
					c: "255,140,60"
				}));
			}]
		],
		tick(f, dt, t, o) {
			const m = f.mem;
			if (t >= renT0 && t < renT1 && !m.hit) {
				f.vx = f.dir * 900;
				f.drive = true;
				f.gaitFeet(dt);
				if (Math.random() < dt * 70) part({
					k: "ember",
					x: f.x - f.dir * rand(0, 40),
					y: f.y - rand(30, 150),
					vx: -f.dir * rand(100, 300),
					vy: rand(-160, -20),
					g: -80,
					drag: 2,
					life: rand(.3, .6),
					sz: rand(1.5, 3),
					c: Math.random() < .5 ? "255,120,40" : "255,190,80"
				});
				if (Math.random() < dt * 30) f.addGhost(.25);
				const gap = (o.x - f.x) * f.dir;
				if (gap < 64 && gap > -24 && Math.abs(o.y - f.y) < 100 && !o.isInv()) renContact(f, o);
			}
		}
	};
	function renContact(f, o) {
		const m = f.mem, a = f.atk, pan = f.pan, x = (f.x + o.x) / 2, y = f.y - 100;
		m.hit = true;
		f.vx = f.dir * 60;
		fx.ring(x, y, "255,150,60", 120);
		glow(x, y, 110, "255,110,40", .3);
		burst(20, () => ({
			k: "ember",
			x,
			y,
			vx: f.dir * rand(0, 500),
			vy: rand(-400, 100),
			g: 400,
			drag: 1.5,
			life: rand(.4, .8),
			sz: rand(1.5, 3),
			c: "255,150,60"
		}));
		if (o.guardingFrom(f) && perfectGuard(o)) {
			f.blocked(Object.assign({}, a, RUSH), x, y, false);
			return;
		}
		snd.renImpact(pan);
		cam.punch(12);
		if (o.guardingFrom(f)) {
			o.posture = 100;
			o.setState("gbreak");
			o.vx = f.dir * 300;
			o.counterUntil = 0;
			o.sinceHit = 0;
			fx.spark(x, y, -Math.PI / 2, 26, 1.3);
			fx.text(o.x, -210, "GARD KIRILDI!", "#ff9b7a");
			au.clang(1.4, pan, .6);
			hitstop(.14);
			f.gainKi(6);
		} else {
			f.landHit(RUSH, "body", x, y);
			f.hitDone = false;
		}
		if (f.state === "atk" && f.atk === a) f.st = renT1;
	}
	function renAura(f) {
		attach(f, {
			out: .3,
			step(dt) {
				const f = this.f;
				if (this.fade === 0 && Math.random() < dt * 40) part({
					k: "ember",
					x: f.x + rand(-26, 26),
					y: f.y - rand(20, 150),
					vx: rand(-30, 30),
					vy: rand(-200, -60),
					g: -50,
					drag: 1,
					life: rand(.4, .8),
					sz: rand(1.2, 2.6),
					c: Math.random() < .5 ? "255,110,40" : "255,170,70"
				});
			},
			draw(ctx) {
				const k = this.k(), f = this.f, pul = .7 + .3 * Math.sin(this.t * 30);
				ctx.globalCompositeOperation = "lighter";
				ctx.globalAlpha = .32 * k * pul;
				ctx.save();
				ctx.translate(f.x, f.y - 95);
				ctx.fillStyle = cgrad(ctx, "ren", "", mkRen);
				ctx.beginPath();
				ctx.ellipse(0, 0, 75, 110, 0, 0, TAU);
				ctx.fill();
				ctx.restore();
				const h = f.j.head;
				if (h) {
					ctx.globalAlpha = k * pul;
					ctx.fillStyle = "#ffcf6a";
					ctx.beginPath();
					ctx.arc(h.x + f.dir * 6, h.y - 2, 2.2, 0, TAU);
					ctx.fill();
					ctx.globalAlpha = .4 * k;
					ctx.beginPath();
					ctx.arc(h.x + f.dir * 6, h.y - 2, 7, 0, TAU);
					ctx.fill();
				}
			}
		});
	}
	DEF.sp_kage = {
		keys: [
			[
				.16,
				"sp_kbSeal",
				E.inOutSine
			],
			[.3, "sp_kbSeal"],
			[
				.36,
				"sp_kbLow",
				E.outCubic
			],
			[.46, "sp_kbLow"],
			[
				.54,
				"sp_kbSlash",
				E.outQuart
			],
			[.7, "sp_kbSlash"],
			[
				.95,
				"stance",
				E.inOut
			]
		],
		active: [.5, .58],
		zone: [
			128,
			12,
			120
		],
		dmg: 25,
		post: 60,
		kb: 360,
		stun: .6,
		knock: true,
		inv: [.2, .44],
		sw: .49,
		pw: 1.5,
		kind: "blade",
		special: true,
		glint: [.36, .48],
		trail: "120,235,150",
		kanji: "影分身",
		ev: [
			[.01, (f) => {
				au.tone({
					freq: 440,
					freq1: 660,
					dur: .25,
					gain: .04,
					send: .6,
					pan: f.pan,
					type: "triangle"
				});
				burst(12, () => {
					const a = rand(0, TAU);
					return {
						k: "smoke",
						x: f.x + Math.cos(a) * 50,
						y: f.y - 90 + Math.sin(a) * 60,
						vx: -Math.cos(a) * 120,
						vy: -Math.sin(a) * 120,
						drag: 3,
						life: .35,
						sz: rand(5, 9),
						c: "40,70,52",
						a: .5,
						fadeIn: true
					};
				});
			}],
			[.22, (f) => {
				kageClone(f);
				kageSmoke(f.x, f.y, rgbOf(f.col.accent));
				snd.poof(f.pan);
				f.hidden = true;
				f.trail.length = 0;
				f.ghosts.length = 0;
			}],
			[.36, (f, a, o) => {
				const side = Math.sign(o.x - f.x) || f.dir, A = ND.ARENA - 12;
				let nx = o.x + side * 82;
				if (Math.abs(nx) > A) nx = clamp(nx, -A, A);
				f.x = nx;
				f.vx = 0;
				f.dir = o.x >= f.x ? 1 : -1;
				f.hidden = false;
				f.prevBlade = null;
				ND.solve(f.pose, f.x, f.y, f.dir, f.j, f.wpn);
				kageSmoke(f.x, f.y, rgbOf(f.col.accent));
				snd.appear(f.pan);
			}]
		],
		tick(f, dt, t, o) {
			if (t > .4 && t < .55) chase(f, o, 70, 300);
		},
		onHit(f, o, x, y) {
			if (o.dir !== (f.x > o.x ? 1 : -1)) fx.text(o.x, -180, "ARKADAN!", "#ffd27a");
			glow(x, y, 100, rgbOf(f.col.accent), .3);
			burst(14, () => ({
				k: "smoke",
				x,
				y,
				vx: f.dir * rand(40, 260),
				vy: rand(-160, 40),
				drag: 2.5,
				life: rand(.5, .9),
				sz: rand(6, 12),
				grow: 1.2,
				c: "22,26,30",
				a: .55
			}));
		}
	};
	function kageSmoke(x, y, col) {
		burst(22, () => {
			const a = rand(0, TAU), sp = rand(40, 260);
			return {
				k: "smoke",
				x: x + rand(-20, 20),
				y: y - rand(10, 170),
				vx: Math.cos(a) * sp,
				vy: Math.sin(a) * sp * .5 - 40,
				drag: 3,
				life: rand(.6, 1.1),
				sz: rand(10, 20),
				grow: 1.4,
				c: Math.random() < .7 ? "26,30,34" : "48,56,60",
				a: .75
			};
		});
		burst(10, () => ({
			k: "ember",
			x: x + rand(-30, 30),
			y: y - rand(20, 160),
			vx: rand(-80, 80),
			vy: rand(-120, -20),
			drag: 2,
			life: rand(.3, .6),
			sz: rand(1, 2),
			c: col
		}));
		fx.ring(x, y - 90, col, 80);
	}
	function kageClone(f) {
		const j = ND.cloneJ(f.j), col = f.col, wpn = f.wpn, acc = f.ch.acc, ac = rgbOf(col.accent);
		SFX.add({
			life: 1.1,
			puffed: false,
			update() {
				if (!this.puffed && this.t > .7) {
					this.puffed = true;
					burst(16, () => ({
						k: "smoke",
						x: j.hip.x + rand(-25, 25),
						y: j.hip.y - rand(-60, 70),
						vx: rand(-60, 60),
						vy: rand(-90, -10),
						drag: 2,
						life: rand(.5, .9),
						sz: rand(8, 15),
						grow: 1,
						c: "30,34,38",
						a: .6
					}));
				}
			},
			draw(ctx) {
				const u = this.t / this.life, a = u < .62 ? .9 : Math.max(0, .9 * (1 - (u - .62) / .2));
				if (a <= 0) return;
				ctx.globalAlpha = a;
				if (ND.drawNinja) ND.drawNinja(ctx, j, col, {
					wpn,
					acc
				});
				ctx.globalCompositeOperation = "lighter";
				ctx.globalAlpha = a * (.25 + .15 * Math.sin(this.t * 20));
				ctx.strokeStyle = `rgb(${ac})`;
				ctx.lineCap = "round";
				const seg = (p, q, w) => {
					ctx.lineWidth = w;
					ctx.beginPath();
					ctx.moveTo(p.x, p.y);
					ctx.lineTo(q.x, q.y);
					ctx.stroke();
				};
				seg(j.hip, j.neck, 24);
				seg(j.hip, j.knF, 13);
				seg(j.knF, j.ftF, 10);
				seg(j.hip, j.knB, 12);
				seg(j.knB, j.ftB, 9);
				seg(j.sh, j.elF, 8);
				seg(j.elF, j.haF, 7);
				ctx.beginPath();
				ctx.arc(j.head.x, j.head.y, 13, 0, TAU);
				ctx.fillStyle = `rgb(${ac})`;
				ctx.fill();
			}
		});
	}
	const SH_COL = "225,24,48", SH_HOT = "255,120,110";
	const shSmokeC = () => {
		const q = Math.random();
		return q < .5 ? "42,24,56" : q < .85 ? "18,10,24" : "86,58,118";
	};
	const mkShMark = (ctx) => stops(ctx.createRadialGradient(0, 0, 0, 0, 0, 70), [
		0,
		`rgba(${SH_COL},.9)`,
		1,
		`rgba(${SH_COL},0)`
	]);
	const mkShSpark = (ctx) => stops(ctx.createRadialGradient(0, 0, 0, 0, 0, 1), [
		0,
		`rgba(${SH_COL},.6)`,
		1,
		`rgba(${SH_COL},0)`
	]);
	const mkShAura = (ctx) => stops(ctx.createRadialGradient(0, 0, 8, 0, 0, 115), [
		0,
		`rgba(${SH_COL},.9)`,
		.5,
		"rgba(160,10,30,.25)",
		1,
		"rgba(120,0,20,0)"
	]);
	const shRoar = .3, shHide = .18, shWind = .05, shAct = [
		.08,
		.08,
		.1
	], shRec = .05;
	const shCuts = [];
	{
		let t = shRoar;
		for (let i = 0; i < 3; i++) {
			const V = t, A = V + shHide, H0 = A + shWind, H1 = H0 + shAct[i];
			shCuts.push({
				V,
				A,
				H: [H0, H1],
				side: i === 1 ? -1 : 1
			});
			t = H1 + shRec;
		}
	}
	const shLast = shCuts[2], shEndT = shLast.H[1];
	const shKeys = [
		[
			.08,
			"sp_shRoar",
			E.outCubic
		],
		[shRoar - .04, "sp_shRoar"],
		[
			shRoar,
			"sp_shVanish",
			E.outQuart
		]
	];
	[
		["sp_shCutA", "sp_shCutB"],
		["sp_shHorA", "sp_shHorB"],
		["sp_shRiseA", "sp_shRiseB"]
	].forEach(([w, s], i) => {
		const c = shCuts[i];
		shKeys.push([
			c.A,
			w,
			E.outQuart
		], [c.H[0], w], [
			c.H[1],
			s,
			E.outQuart
		]);
		if (i < 2) shKeys.push([
			c.H[1] + shRec,
			"sp_shVanish",
			E.inOutSine
		]);
	});
	shKeys.push([
		shEndT + .22,
		"sp_shEnd",
		E.outCubic
	], [shEndT + .3, "sp_shEnd"], [
		shEndT + .52,
		"stance",
		E.inOut
	]);
	const shAng = (f, a) => f.dir > 0 ? a : Math.PI - a;
	DEF.sp_shura = {
		keys: shKeys,
		active: shCuts[0].H.slice(),
		hits: shCuts.map((c) => c.H.slice()),
		zone: [
			158,
			24,
			120
		],
		dmg: 9,
		post: 24,
		kb: 70,
		stun: .62,
		knockLast: true,
		lastHit: {
			dmg: 12,
			kb: 420,
			post: 32,
			lift: 1.35
		},
		sw: shCuts[0].H[0] - .01,
		pw: 1.8,
		kind: "blade",
		special: true,
		glint: [.04, .26],
		trail: "235,30,55",
		kanji: "阿修羅",
		ev: [[.02, (f) => shuraRoar(f)]].concat(...shCuts.map((c, i) => [
			[c.V, (f, a, o) => shuraVanish(f, o, i)],
			[c.A, (f, a, o) => shuraAppear(f, o, i)],
			[c.H[0], (f) => shuraCut(f, i)]
		])),
		tick(f, dt, t, o) {
			const m = f.mem;
			if (o.dead && !m.over) {
				m.over = true;
				shuraShow(f);
				f.evI = f.atk.ev.length;
				if (f.st < shEndT) f.st = shEndT;
				return;
			}
			if (t < shRoar) {
				if (Math.random() < dt * 20) cam.punch(4 + 6 * (1 - t / shRoar));
				f.vx = 0;
				f.drive = true;
			}
			const cut = shCuts.find((c) => t >= c.V && t < c.H[1] + shRec);
			if (f.hidden) {
				if (!cut || t >= cut.A + .01) shuraShow(f);
				f.vx = 0;
				f.drive = true;
				return;
			}
			if (cut && t >= cut.A && t < cut.H[1]) {
				chase(f, o, 86, t < cut.H[0] ? 320 : 180);
				if (t >= cut.H[0]) f.addGhost(.32);
			}
		},
		onHit(f, o, x, y) {
			const i = f.hitIdx, last = i >= 2;
			au.thud(last ? 1.5 : 1.1, f.pan);
			snd.ring(last ? 220 : 330, f.pan, .05, .9);
			glow(x, y, last ? 150 : 100, SH_COL, last ? .45 : .3);
			fx.ring(x, y, SH_HOT, last ? 150 : 100);
			burst(last ? 26 : 14, () => ({
				k: "ember",
				x,
				y,
				vx: Math.sign(o.x - f.x) * rand(80, 520),
				vy: rand(-360, 80),
				g: -40,
				drag: 2,
				life: rand(.4, .9),
				sz: rand(1.3, 2.8),
				c: Math.random() < .6 ? "255,130,70" : "255,190,130"
			}));
			if (i === 1 && o.dir !== (f.x > o.x ? 1 : -1)) fx.text(o.x, -180, "ARKADAN!", "#ff8a8a");
			if (last) {
				au.taiko(1.4);
				cam.punch(12);
				fx.text(o.x, -240, "羅刹!", "#ff5a6a");
			}
		}
	};
	const shuraSnd = {
		roar(pan) {
			au.tone({
				freq: 72,
				freq1: 44,
				dur: 1,
				gain: .34,
				type: "sawtooth",
				send: .45,
				pan,
				attack: .04
			});
			au.tone({
				freq: 118,
				freq1: 62,
				dur: .8,
				gain: .14,
				type: "sawtooth",
				send: .4,
				pan,
				attack: .06
			});
			au.noise({
				type: "lowpass",
				f0: 700,
				f1: 180,
				dur: .9,
				gain: .4,
				attack: .08,
				send: .4,
				pan
			});
			au.noise({
				type: "bandpass",
				f0: 380,
				f1: 900,
				q: 1.4,
				dur: .6,
				gain: .18,
				attack: .1,
				send: .3,
				pan
			});
			au.taiko(1.6);
		},
		glint(pan) {
			au.tone({
				freq: 2400,
				freq1: 3400,
				dur: .22,
				gain: .045,
				send: .7,
				pan,
				type: "triangle",
				attack: .12
			});
			au.noise({
				type: "highpass",
				f0: 5200,
				dur: .16,
				gain: .05,
				attack: .1,
				send: .5,
				pan
			});
		},
		cut(i, pan) {
			au.noise({
				type: "bandpass",
				f0: 1800 - i * 300,
				f1: 300,
				q: 1,
				dur: .32,
				gain: .42,
				attack: .02,
				send: .35,
				pan
			});
			au.tone({
				freq: 140 - i * 20,
				freq1: 60,
				dur: .3,
				gain: .12,
				type: "sawtooth",
				send: .3,
				pan
			});
		}
	};
	function shuraShow(f) {
		if (!f.hidden) return;
		f.hidden = false;
		f.inv = 0;
		f.prevBlade = null;
	}
	function shuraRoar(f) {
		f.mem.side0 = Math.sign(f.x - f.opp.x) || -f.dir;
		shuraSnd.roar(f.pan);
		cam.punch(14);
		const h = f.j.head || {
			x: f.x,
			y: f.y - 160
		};
		fx.ring(h.x, h.y, SH_HOT, 170);
		fx.flash(h.x, h.y, 0, 110, SH_COL);
		glow(f.x, f.y - 100, 170, SH_COL, .5, .9);
		fx.dust(f.x, 0, 18, 2);
		burst(28, () => {
			const a = rand(-Math.PI, 0), sp = rand(200, 620);
			return {
				k: "streak",
				x: h.x,
				y: h.y,
				vx: Math.cos(a) * sp,
				vy: Math.sin(a) * sp * .7,
				life: rand(.22, .4),
				sz: rand(1.2, 2.2),
				c: SH_HOT,
				add: true,
				rot: 0,
				vr: 0
			};
		});
		shuraAura(f);
	}
	function shuraVanish(f, o, i) {
		const c = shCuts[i], A = ND.ARENA - 14, d = 96;
		let side = (f.mem.side0 || -f.dir) * c.side;
		if (Math.abs(o.x + side * d) > A) side = -side;
		const nx = clamp(o.x + side * d, -A, A);
		shuraEcho(f);
		shuraSmoke(f.x, f.y);
		snd.poof(f.pan);
		f.hidden = true;
		f.inv = (c.A - c.V) / Math.max(.5, f.ch.spd * f.aspd) + .05;
		f.trail.length = 0;
		f.ghosts.length = 0;
		f.x = nx;
		f.vx = 0;
		f.dir = o.x >= f.x ? 1 : -1;
		shuraMark(f, c, nx);
		shuraSnd.glint(cam.pan(nx));
	}
	function shuraAppear(f, o) {
		f.dir = o.x >= f.x ? 1 : -1;
		shuraShow(f);
		ND.solve(f.pose, f.x, f.y, f.dir, f.j, f.wpn);
		shuraSmoke(f.x, f.y, true);
		snd.appear(f.pan);
	}
	function shuraCut(f, i) {
		shuraSnd.cut(i, f.pan);
		const x = f.x + f.dir * 40, y = f.y - 104;
		if (i === 0) slashArc({
			x,
			y,
			r: 118,
			mid: shAng(f, .45),
			span: 1.25,
			w: 30,
			rotA: 0,
			col: SH_COL,
			core: "255,220,210",
			life: .5,
			grow: .08
		});
		else if (i === 1) slashArc({
			x,
			y: y + 6,
			r: 126,
			mid: shAng(f, 0),
			span: 1.3,
			w: 26,
			sy: .5,
			col: SH_COL,
			core: "255,220,210",
			life: .5,
			grow: .1
		});
		else {
			slashArc({
				x,
				y: y - 10,
				r: 132,
				mid: shAng(f, -.55),
				span: 1.35,
				w: 36,
				col: SH_COL,
				core: "255,235,225",
				life: .6,
				grow: .12
			});
			slashArc({
				x,
				y: y - 10,
				r: 132,
				mid: shAng(f, -.55),
				span: 1.2,
				w: 10,
				col: SH_HOT,
				core: "255,255,255",
				life: .3,
				grow: .16
			});
			fx.dust(f.x, 0, 14, 1.6);
		}
		shuraArms(f, i);
		burst(i === 2 ? 20 : 10, () => ({
			k: "ember",
			x: x + rand(-40, 60) * f.dir,
			y: y + rand(-60, 40),
			vx: f.dir * rand(60, 360),
			vy: rand(-300, 40),
			g: -30,
			drag: 2,
			life: rand(.4, .8),
			sz: rand(1.2, 2.4),
			c: "255,130,80"
		}));
	}
	function shuraSmoke(x, y, appear) {
		burst(appear ? 9 : 18, () => {
			const a = rand(0, TAU), sp = rand(60, appear ? 260 : 280);
			return {
				k: "smoke",
				x: x + rand(-20, 20),
				y: y - rand(10, 170),
				vx: Math.cos(a) * sp,
				vy: Math.sin(a) * sp * .5 - 40,
				drag: 3,
				life: appear ? rand(.3, .55) : rand(.45, .85),
				sz: rand(9, appear ? 15 : 19),
				grow: 1.3,
				c: shSmokeC(),
				a: appear ? .5 : .68
			};
		});
		burst(12, () => ({
			k: "ember",
			x: x + rand(-30, 30),
			y: y - rand(20, 160),
			vx: rand(-90, 90),
			vy: rand(-150, -20),
			drag: 2,
			life: rand(.3, .7),
			sz: rand(1, 2.2),
			c: "196,140,255"
		}));
		fx.ring(x, y - 90, SH_COL, appear ? 70 : 90);
	}
	function shuraEcho(f) {
		const j = ND.cloneJ(f.j);
		if (!j.hip || !j.neck || !j.head) return;
		SFX.add({
			life: .4,
			draw(ctx) {
				const u = this.t / this.life, a = .55 * (1 - u);
				ctx.globalCompositeOperation = "lighter";
				ctx.globalAlpha = a;
				ctx.lineCap = "round";
				ctx.strokeStyle = `rgb(${SH_COL})`;
				ctx.fillStyle = `rgb(${SH_COL})`;
				const seg = (p, q, w) => {
					if (!p || !q) return;
					ctx.lineWidth = w;
					ctx.beginPath();
					ctx.moveTo(p.x, p.y);
					ctx.lineTo(q.x, q.y);
					ctx.stroke();
				};
				ctx.translate(0, -u * 18);
				seg(j.hip, j.neck, 22);
				seg(j.hip, j.knF, 12);
				seg(j.knF, j.ftF, 9);
				seg(j.hip, j.knB, 11);
				seg(j.knB, j.ftB, 8);
				seg(j.sh, j.elF, 7);
				seg(j.elF, j.haF, 6);
				seg(j.sh, j.elB, 6);
				seg(j.elB, j.haB, 5);
				ctx.beginPath();
				ctx.arc(j.head.x, j.head.y, 12, 0, TAU);
				ctx.fill();
				if (j.tip) {
					ctx.strokeStyle = "rgb(255,190,180)";
					seg(j.haF, j.tip, 2.5);
				}
			}
		});
	}
	function shuraMark(f, c, x) {
		attach(f, {
			out: .12,
			x,
			until: c.H[0] + .02,
			draw(ctx) {
				const k = this.k(), T = c.H[0] - c.V, u = clamp((f.st - c.V) / T, 0, 1) * k || 0;
				const y = -112, pul = .8 + .2 * Math.sin(this.t * 40);
				ctx.globalCompositeOperation = "lighter";
				ctx.globalAlpha = .5 * u * k;
				ctx.save();
				ctx.translate(this.x, -2);
				ctx.fillStyle = cgrad(ctx, "shMark", "", mkShMark);
				ctx.beginPath();
				ctx.ellipse(0, 0, 70, 10, 0, 0, TAU);
				ctx.fill();
				ctx.restore();
				ctx.globalAlpha = .22 * u * k;
				ctx.fillStyle = `rgb(${SH_COL})`;
				ctx.fillRect(this.x - 1.5, -210, 3, 208);
				const s = (10 + 34 * u * u) * pul;
				ctx.globalAlpha = Math.min(1, .35 + .65 * u) * k;
				ctx.translate(this.x, y);
				ctx.rotate(this.t * 2 * (f.dir || 1));
				ctx.fillStyle = `rgb(${SH_HOT})`;
				ctx.beginPath();
				for (let q = 0; q < 8; q++) {
					const r = q % 2 ? s * .16 : s, a = q * Math.PI / 4;
					ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
				}
				ctx.closePath();
				ctx.fill();
				ctx.fillStyle = "#fff";
				ctx.globalAlpha *= .9;
				ctx.beginPath();
				ctx.arc(0, 0, 2 + 3 * u, 0, TAU);
				ctx.fill();
				ctx.rotate(-this.t * 2 * (f.dir || 1));
				const r0 = 18 + 40 * u;
				ctx.scale(r0, r0);
				ctx.globalAlpha = .8 * k;
				ctx.fillStyle = cgrad(ctx, "shSpark", "", mkShSpark);
				ctx.beginPath();
				ctx.arc(0, 0, 1, 0, TAU);
				ctx.fill();
			}
		});
	}
	function shuraArms(f, i) {
		const dir = f.dir, sh = f.j.sh ? {
			x: f.j.sh.x,
			y: f.j.sh.y
		} : {
			x: f.x,
			y: f.y - 140
		};
		const a0 = [
			-2.3,
			2.6,
			1.9
		][i], a1 = [
			1,
			-.1,
			-1.4
		][i], blade = (f.ch.blade || 110) + 10;
		SFX.add({
			life: .34,
			draw(ctx) {
				const u = this.t / this.life, e = E.outCubic(Math.min(1, u * 1.6)), a = (1 - u) * .7;
				ctx.globalCompositeOperation = "lighter";
				ctx.lineCap = "round";
				for (let k = -1; k <= 1; k++) {
					const th0 = a0 + (a1 - a0) * e + k * .62, th = dir > 0 ? th0 : Math.PI - th0;
					const hx = sh.x + Math.cos(th) * 52, hy = sh.y + Math.sin(th) * 52;
					const tx = hx + Math.cos(th) * blade, ty = hy + Math.sin(th) * blade;
					ctx.globalAlpha = a * (k === 0 ? 1 : .6);
					ctx.strokeStyle = `rgb(${SH_COL})`;
					ctx.lineWidth = 7;
					ctx.beginPath();
					ctx.moveTo(sh.x, sh.y);
					ctx.lineTo(hx, hy);
					ctx.stroke();
					ctx.strokeStyle = `rgb(${SH_HOT})`;
					ctx.lineWidth = 3.2;
					ctx.beginPath();
					ctx.moveTo(hx, hy);
					ctx.lineTo(tx, ty);
					ctx.stroke();
					ctx.strokeStyle = "#fff";
					ctx.lineWidth = 1.2;
					ctx.globalAlpha *= .8;
					ctx.beginPath();
					ctx.moveTo(hx + (tx - hx) * .3, hy + (ty - hy) * .3);
					ctx.lineTo(tx, ty);
					ctx.stroke();
				}
			}
		});
	}
	function shuraAura(f) {
		attach(f, {
			out: .35,
			until: shEndT + .2,
			step(dt) {
				const f = this.f;
				if (this.fade === 0 && !f.hidden && Math.random() < dt * 36) {
					const sm = Math.random() < .35;
					part({
						k: sm ? "smoke" : "ember",
						x: f.x + rand(-28, 28),
						y: f.y - rand(10, 150),
						vx: rand(-30, 30),
						vy: rand(-190, -50),
						g: -40,
						drag: 1,
						life: rand(.4, .8),
						sz: rand(1.3, 2.6),
						grow: .8,
						c: sm ? shSmokeC() : Math.random() < .6 ? "255,96,64" : "255,150,90",
						a: .8
					});
				}
			},
			draw(ctx) {
				const f = this.f;
				if (f.hidden) return;
				const k = this.k(), pul = .7 + .3 * Math.sin(this.t * 26);
				ctx.globalCompositeOperation = "lighter";
				ctx.globalAlpha = .34 * k * pul;
				ctx.save();
				ctx.translate(f.x, f.y - 95);
				ctx.fillStyle = cgrad(ctx, "shAura", "", mkShAura);
				ctx.beginPath();
				ctx.ellipse(0, 0, 80, 118, 0, 0, TAU);
				ctx.fill();
				ctx.restore();
				const h = f.j.head;
				if (h) {
					ctx.globalAlpha = k * pul;
					ctx.fillStyle = "#ff4a5a";
					ctx.beginPath();
					ctx.arc(h.x + f.dir * 6, h.y - 2, 2.4, 0, TAU);
					ctx.fill();
					ctx.globalAlpha = .45 * k;
					ctx.beginPath();
					ctx.arc(h.x + f.dir * 6, h.y - 2, 8, 0, TAU);
					ctx.fill();
				}
			}
		});
	}
	const TX = ND.TXT = Object.assign({
		gbreak: "DENGE KIRILDI!",
		cut: "KESİLDİ!",
		reflect: "YANSITMA!",
		parry: "SAVUŞTURMA!",
		caught: "YAKALANDI!",
		swallowHit: "燕!",
		vajraHit: "金剛!",
		whirlHit: "旋風の舞"
	}, ND.TXT || {});
	const R2 = {
		x: 0,
		y: 0,
		dx: 1,
		dy: 0
	}, WP = {
		x: 0,
		y: 0
	};
	const eo = E.outCubic, ei = E.inQuad;
	const snd2 = {
		chain(pan, g = 1) {
			for (let i = 0; i < 4; i++) au.noise({
				type: "bandpass",
				f0: rand(2600, 4400),
				q: 6,
				dur: .035,
				gain: .07 * g,
				send: .2,
				pan,
				delay: i * rand(.02, .045)
			});
		},
		chainThrow(pan) {
			au.noise({
				type: "bandpass",
				f0: 900,
				f1: 2600,
				q: 1.2,
				dur: .22,
				gain: .25,
				attack: .03,
				send: .2,
				pan
			});
			snd2.chain(pan, 1.2);
		},
		staff(pan, p = 1) {
			if (au.bo?.swing?.(pan, p)) return;
			au.noise({
				type: "bandpass",
				f0: 240,
				f1: 900,
				q: .9,
				dur: .24,
				gain: .3 * p,
				attack: .06,
				send: .2,
				pan
			});
		},
		fan(pan) {
			au.noise({
				type: "highpass",
				f0: 2400,
				dur: .06,
				gain: .1,
				send: .15,
				pan
			});
			au.noise({
				type: "bandpass",
				f0: 1200,
				f1: 3e3,
				q: 1.5,
				dur: .1,
				gain: .07,
				send: .2,
				pan,
				delay: .02
			});
		},
		gust(pan) {
			au.noise({
				type: "bandpass",
				f0: 500,
				f1: 2200,
				q: .8,
				dur: .45,
				gain: .4,
				attack: .04,
				send: .4,
				pan
			});
		},
		draw(pan) {
			au.tone({
				freq: 170,
				freq1: 260,
				dur: .3,
				gain: .04,
				type: "triangle",
				send: .2,
				pan,
				attack: .2
			});
			au.noise({
				type: "bandpass",
				f0: 1800,
				q: 4,
				dur: .25,
				gain: .04,
				attack: .2,
				send: .1,
				pan
			});
		},
		twang(pan, p = 1) {
			au.tone({
				freq: 330 * p,
				freq1: 180,
				dur: .35,
				gain: .12,
				type: "triangle",
				send: .4,
				pan
			});
			au.noise({
				type: "bandpass",
				f0: 3e3,
				f1: 1200,
				q: 2,
				dur: .12,
				gain: .18,
				send: .3,
				pan
			});
		},
		arrowHit(pan) {
			au.noise({
				type: "lowpass",
				f0: 1400,
				f1: 300,
				dur: .12,
				gain: .3,
				send: .2,
				pan
			});
			au.tone({
				freq: 220,
				freq1: 120,
				dur: .12,
				gain: .08,
				send: .2,
				pan
			});
		},
		stone(pan) {
			au.noise({
				type: "bandpass",
				f0: 700,
				f1: 1500,
				q: 1,
				dur: .14,
				gain: .18,
				send: .2,
				pan
			});
		},
		wind(pan) {
			au.noise({
				type: "bandpass",
				f0: 300,
				f1: 1200,
				q: 1.6,
				dur: 1.2,
				gain: .3,
				attack: .2,
				send: .6,
				pan
			});
		}
	};
	function pathLine(f, t, T, R, yy, out) {
		if (t < T[0] || t > T[3]) return null;
		const hb = f.j.haB, ex = f.x + f.dir * R, ey = f.y + yy;
		if (t < T[1]) {
			const u = eo((t - T[0]) / (T[1] - T[0]));
			out.x = hb.x + (ex - hb.x) * u;
			out.y = hb.y + (ey - hb.y) * u - Math.sin(Math.PI * u) * 26;
		} else if (t < T[2]) {
			out.x = ex;
			out.y = ey;
		} else {
			const u = ei((t - T[2]) / (T[3] - T[2]));
			out.x = ex + (hb.x - ex) * u;
			out.y = ey + (hb.y - ey) * u;
		}
		return out;
	}
	function pathArc(f, t, T, R, a0, a1, out) {
		if (t < T[0] || t > T[3]) return null;
		const sh = f.j.sh;
		if (t <= T[2]) {
			const k = Math.min(1, (t - T[0]) / (T[1] - T[0])), th = a0 + (a1 - a0) * eo(k), r = R * (.35 + .65 * Math.min(1, k * 1.6));
			out.x = sh.x + Math.cos(th) * r * f.dir;
			out.y = Math.min(-4, sh.y + Math.sin(th) * r);
		} else {
			const u = ei((t - T[2]) / (T[3] - T[2])), ex = sh.x + Math.cos(a1) * R * f.dir, ey = Math.min(-4, sh.y + Math.sin(a1) * R), hb = f.j.haB;
			out.x = ex + (hb.x - ex) * u;
			out.y = ey + (hb.y - ey) * u;
		}
		return out;
	}
	function pathCaught(f, t, t0, t1, out) {
		const o = f.mem.caught;
		if (!o || o.dead || t < t0 || t > t1 || !o.j.neck) return null;
		out.x = o.j.neck.x * .6 + o.j.hip.x * .4;
		out.y = o.j.neck.y * .6 + o.j.hip.y * .4;
		return out;
	}
	function pathTwirl(f, t, r, w, out) {
		const hb = f.j.haB;
		out.x = hb.x + Math.cos(t * w) * r * f.dir;
		out.y = hb.y - 10 + Math.sin(t * w) * r * .8;
		return out;
	}
	ND.wpnState = {
		kusarigama(f, j, dt) {
			const C = f.chain;
			if (!C || !j.pom || !j.haB) return;
			j.chain = C;
			const a = f.state === "atk" ? f.atk : null, p = a && a.wpath ? a.wpath(f, f.st, WP) : null;
			let tw = NaN;
			if (!p && (f.state === "move" || f.state === "win" || f.state === "land" || f.state === "zanshin")) {
				f.twA = ((f.twA || 0) + dt * 12 * (f.dir || 1)) % TAU;
				tw = f.twA;
			}
			C.update(dt, j.pom.x, j.pom.y, j.haB.x, j.haB.y, !!p, p ? p.x : 0, p ? p.y : 0, tw);
		},
		tessen(f, j, dt) {
			const st = f.state, a = st === "atk" ? f.atk : null, t = f.st;
			let o1 = 0, o2 = .6;
			if (a) {
				o1 = a.fan != null ? typeof a.fan === "function" ? a.fan(f, t) : a.fan : t > .03 ? 1 : .25;
				o2 = a.fanB != null ? typeof a.fanB === "function" ? a.fanB(f, t) : a.fanB : .9;
			} else if (st === "guard" || st === "block" || st === "parry" || st === "lock" || st === "zanshin") {
				o1 = 1;
				o2 = 1;
			} else if (st === "win") {
				o1 = t > .5 ? 1 : 0;
				o2 = 1;
			} else if (st === "hurt" || st === "launch" || st === "down" || st === "stagger" || st === "gbreak" || st === "getup") {
				o1 = 0;
				o2 = 0;
			}
			const p0 = j.wFan || 0;
			j.wFan = ND.M.approach(p0, o1, 24, dt);
			j.wFanB = ND.M.approach(j.wFanB || 0, o2, 16, dt);
			if (p0 < .5 && j.wFan >= .5 && !f.mem.fanS) {
				f.mem.fanS = true;
				snd2.fan(f.pan);
			}
		},
		yumi(f, j) {
			const a = f.state === "atk" ? f.atk : null, t = f.st;
			if (a && a.bow && t >= a.bow[0] && t <= a.bow[1]) {
				j.wBow = 1;
				j.wDraw = a.drawK ? a.drawK(f, t) : 0;
				const N = a.nock;
				let on = false;
				if (N) {
					if (typeof N[0] === "number") on = t >= N[0] && t < N[1] && !f.mem.shot;
					else for (const w of N) if (t >= w[0] && t < w[1]) on = true;
				}
				j.wArrow = on ? 1 : 0;
				j.wCharge = a.hold && f.mem.charge ? Math.min(1, f.mem.charge / a.hold.max) : 0;
			} else {
				j.wBow = 0;
				j.wDraw = 0;
				j.wArrow = 0;
				j.wCharge = 0;
			}
			j.wAmmo = f.ammo;
		}
	};
	function chip(t, post, pdir, x, y) {
		const pan = cam.pan(x);
		t.posture += post * (t.ch.guardMul || 1);
		t.sinceHit = 0;
		t.gainKi(2);
		fx.spark(x, y, pdir > 0 ? Math.PI : 0, 10, .8);
		au.clang(.45, pan, 1.6);
		if (t.posture >= 100) {
			t.posture = 100;
			t.setState("gbreak");
			t.vx = pdir * 220;
			t.counterUntil = 0;
			fx.text(t.x, -205, TX.gbreak, "#ff9b7a");
			au.clang(1.3, pan, .7);
			cam.punch(9);
			hitstop(.13);
		} else if (t.state === "guard" || t.state === "block") t.setState("block", { dur: .2 });
	}
	const isPerfect = (t) => perfectGuard(t) || !!t.ch.reflect;
	const A_ARROW = {
		dmg: 8,
		post: 10,
		kb: 160,
		stun: .34,
		kind: "arrow"
	};
	class Arrow {
		constructor(owner, x, y, dx, dy, spd, a, opt = {}) {
			this.owner = owner;
			this.x = x;
			this.y = y;
			this.vx = dx * spd;
			this.vy = dy * spd;
			this.a = a || A_ARROW;
			this.g = opt.g ?? 260;
			this.wait = opt.wait || 0;
			this.rain = !!opt.rain;
			this.ret = opt.ret || 0;
			this.noHit = !!opt.noHit;
			this.glow = opt.glow || 0;
			this.col = owner.col;
			this.dead = false;
			this.stuck = false;
			this.falling = false;
			this.t = 0;
			this.st = 0;
			this.ang = Math.atan2(this.vy, this.vx);
			this.spin = 0;
			this.alpha = 1;
			this.rot = 3e3 + this.ang + Math.PI;
		}
		deflect() {
			if (this.falling || this.stuck) return;
			this.falling = true;
			this.vx *= -.22;
			this.vy = -360;
			this.spin = (ND.rng.next() < .5 ? -1 : 1) * 14;
			this.glow = 0;
			this.ret = 0;
		}
		turn() {
			const o = this.owner.opp;
			this.ret = 0;
			this.vx = -this.vx * 1.04;
			if (o && o.j.neck) this.vy = clamp((o.y - 112 - this.y) * 2.2, -500, 500);
			fx.ring(this.x, this.y, "190,240,255", 70);
			au.swoosh(1.2, cam.pan(this.x));
			burst(10, () => ({
				k: "streak",
				x: this.x,
				y: this.y,
				vx: rand(-260, 260),
				vy: rand(-260, 260),
				life: .25,
				sz: 1.3,
				c: "200,240,255",
				add: true,
				rot: 0,
				vr: 0
			}));
		}
		update(dt) {
			if (this.wait > 0) {
				this.wait -= dt;
				return;
			}
			if (this.stuck) {
				this.st += dt;
				if (this.st > 5) this.dead = true;
				return;
			}
			this.t += dt;
			const px = this.x, py = this.y;
			this.vy += (this.falling ? 2500 : this.g) * dt;
			this.x += this.vx * dt;
			this.y += this.vy * dt;
			this.ang = this.falling ? this.ang + this.spin * dt : Math.atan2(this.vy, this.vx);
			this.rot = 3e3 + ((this.ang + Math.PI) % TAU + TAU) % TAU;
			if (this.glow > 0 && Math.random() < dt * 50) part({
				k: "streak",
				x: this.x,
				y: this.y,
				vx: -this.vx * .1,
				vy: -this.vy * .1,
				life: .2,
				sz: 1.4,
				c: "190,240,255",
				add: true,
				rot: 0,
				vr: 0
			});
			if (this.noHit) {
				if (this.y < -1e3 || this.t > 1.4) this.dead = true;
				return;
			}
			if (this.y > -1 && this.vy > 0) {
				this.y = srand(3, 7);
				this.stuck = true;
				this.st = 0;
				this.glow = 0;
				au.tick(cam.pan(this.x));
				fx.dust(this.x, 0, 2, .4);
				return;
			}
			const A = ND.ARENA + 30;
			if (Math.abs(this.x) > A) {
				if (this.ret > 0 && !this.falling) {
					this.x = Math.sign(this.x) * A;
					this.turn();
				} else {
					this.x = Math.sign(this.x) * A;
					this.stuck = true;
					this.st = 0;
					au.tick(cam.pan(this.x));
					return;
				}
			}
			if (this.falling) return;
			if (this.t > 2.6) {
				this.dead = true;
				return;
			}
			const t = this.owner.opp;
			if (!t || t.dead) return;
			const s = Math.sign(this.vx) || 1;
			if (this.ret > 0 && (this.x - t.x) * s > 170) this.turn();
			if (t.isInv()) return;
			const pan = cam.pan(this.x);
			if (t.bladeActive() && t.j.tip) {
				const r = segSeg(px, py, this.x, this.y, t.j.haF.x, t.j.haF.y, t.j.tip.x, t.j.tip.y);
				if (r.d < 9) {
					fx.spark(r.x, r.y, s > 0 ? Math.PI : 0, 12, .9, "220,235,255");
					au.clang(.5, pan, 1.7);
					fx.text(t.x, -200, TX.cut, "#cfe8ff");
					t.gainKi(6);
					hitstop(.04);
					this.deflect();
					return;
				}
			}
			for (const h of ND.hurtboxes(t.j)) {
				const r = segSeg(px, py, this.x, this.y, h[0], h[1], h[2], h[3]);
				if (r.d > h[4] + 3) continue;
				const g = t.state === "guard" || t.state === "block" || t.state === "parry";
				const guard = this.rain ? g : t.guardingFrom(this.owner, this.x - s * 60);
				if (guard) {
					if (isPerfect(t)) {
						const refl = !this.rain && t.ch.reflect;
						if (refl) {
							this.owner = t;
							this.col = t.col;
							this.vx = -this.vx * 1.05;
							this.vy = -this.vy * .4 - 30;
							this.ret = 0;
						} else this.deflect();
						fx.ring(this.x, this.y);
						fx.spark(this.x, this.y, this.vx > 0 ? 0 : Math.PI, 12);
						fx.text(t.x, -190, refl ? TX.reflect : TX.parry, "#ffe3a1");
						au.parry(pan);
						hitstop(.06);
						t.gainKi(refl ? 10 : 8);
						t.parries = (t.parries || 0) + 1;
					} else {
						this.deflect();
						chip(t, this.a.post || 8, s, r.x, r.y);
					}
					return;
				}
				this.dead = true;
				const own = this.owner, dmg = Math.round(this.a.dmg * (own.ch.dmg || 1));
				own.gainKi(ND.scaleDmg(dmg, this.a) * 1.6);
				snd2.arrowHit(pan);
				if (this.a.special && this.a.knock) {
					glow(r.x, r.y, 110, "170,235,255", .35);
					fx.text(r.x, r.y - 40, TX.swallowHit, "#bdf1ff");
					cam.punch(6);
				}
				t.takeHit(dmg, this.a, own, r.x, r.y, h[5], s);
				return;
			}
		}
		draw(ctx) {
			if (this.wait <= 0) drawArrowP(ctx, this);
		}
	}
	function drawArrowP(ctx, p) {
		const a = p.rot % 1e3 - Math.PI, ux = Math.cos(a), uy = Math.sin(a);
		if (ND.drawArrow) ND.drawArrow(ctx, p.x, p.y, ux, uy, p.col, 66, p.glow || 0);
	}
	function drawStone(ctx, p) {
		const a = p.rot % 1e3;
		ctx.save();
		ctx.translate(p.x, p.y);
		if (!p.stuck && !p.falling) {
			ctx.globalAlpha = .22;
			ctx.fillStyle = "#c9c2b6";
			ctx.beginPath();
			ctx.ellipse(-Math.sign(p.vx) * 12, 0, 13, 2.6, 0, 0, TAU);
			ctx.fill();
			ctx.globalAlpha = 1;
		}
		ctx.rotate(a);
		ctx.fillStyle = "#6f6a63";
		ctx.strokeStyle = "#1c1a17";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(-5, -1.5);
		ctx.lineTo(-2, -4.6);
		ctx.lineTo(3.6, -3.6);
		ctx.lineTo(5.2, 1);
		ctx.lineTo(1.5, 4.4);
		ctx.lineTo(-4, 3.2);
		ctx.closePath();
		ctx.stroke();
		ctx.fill();
		ctx.fillStyle = "rgba(235,228,215,.4)";
		ctx.fillRect(-1.5, -3.6, 3.6, 1.4);
		ctx.restore();
	}
	const A_GUST = {
		dmg: 6,
		post: 18,
		kb: 640,
		stun: .42,
		kind: "gust",
		blunt: true
	};
	class Gust {
		constructor(owner, x, y, dir) {
			this.owner = owner;
			this.x = x;
			this.y = y;
			this.vx = dir * 780;
			this.vy = 0;
			this.t = 0;
			this.life = .44;
			this.rot = 5e3;
			this.dead = false;
			this.stuck = false;
			this.falling = false;
			this.hit = false;
			this.alpha = 1;
			this.col = rgbOf(owner.col.accent, "220,200,255");
		}
		update(dt) {
			this.t += dt;
			this.x += this.vx * dt;
			this.vx *= Math.exp(-2.2 * dt);
			this.rot = 5e3 + this.t * 9 % 6.28;
			this.alpha = Math.max(0, Math.min(1, (this.life - this.t) / .12));
			if (this.t > this.life || Math.abs(this.x) > ND.ARENA + 60) {
				this.dead = true;
				return;
			}
			const s = Math.sign(this.vx) || 1;
			if (Math.random() < dt * 60) part({
				k: Math.random() < .3 ? "petal" : "streak",
				x: this.x - s * rand(0, 40),
				y: this.y + rand(-60, 60),
				vx: this.vx * .6,
				vy: rand(-40, 40),
				life: .25,
				sz: rand(1.2, 4),
				c: Math.random() < .5 ? this.col : "235,240,255",
				add: true,
				rot: 0,
				vr: 0,
				flut: 6
			});
			const G = game();
			if (G.projs) for (const p of G.projs) {
				if (p === this || p.owner === this.owner || p.falling || p.stuck || !p.deflect || p.wait > 0) continue;
				if (Math.abs(p.x - this.x) < 55 && Math.abs(p.y - this.y) < 90) {
					p.deflect();
					fx.spark(p.x, p.y, s > 0 ? 0 : Math.PI, 8, .7, "230,235,255");
				}
			}
			if (this.hit) return;
			const o = this.owner.opp;
			if (!o || o.dead || o.isInv() || Math.abs(o.x - this.x) > 46 || o.y < -150) return;
			this.hit = true;
			this.life = Math.min(this.life, this.t + .1);
			const pan = cam.pan(this.x);
			if (o.guardingFrom(this.owner, this.x - s * 40)) {
				if (isPerfect(o)) {
					fx.ring(o.x, -110, "230,235,255", 90);
					fx.text(o.x, -200, TX.parry, "#ffe3a1");
					au.parry(pan);
					o.setState("parry");
					o.gainKi(10);
					o.parries = (o.parries || 0) + 1;
					return;
				}
				o.vx = s * 430;
				chip(o, A_GUST.post, s, o.x - s * 12, o.y - 100);
				return;
			}
			const own = this.owner, dmg = Math.round(A_GUST.dmg * (own.ch.dmg || 1));
			own.gainKi(ND.scaleDmg(dmg, A_GUST) * 1.6);
			o.takeHit(dmg, A_GUST, own, o.x - s * 10, o.y - 100, "body", s);
			burst(10, () => ({
				k: "petal",
				x: o.x,
				y: o.y - rand(50, 150),
				vx: s * rand(200, 500),
				vy: rand(-200, 60),
				g: 150,
				drag: 1.5,
				flut: 7,
				life: rand(.5, .9),
				sz: rand(3, 5),
				c: this.col
			}));
		}
		draw(ctx) {
			drawGust(ctx, this);
		}
	}
	function drawGust(ctx, p) {
		const s = Math.sign(p.vx) || 1, ph = p.rot % 1e3, col = p.col || "220,200,255", A = p.alpha ?? 1;
		ctx.save();
		ctx.translate(p.x, p.y);
		ctx.scale(s * .7, .8);
		ctx.globalCompositeOperation = "lighter";
		for (let k = 2; k >= 0; k--) {
			ctx.globalAlpha = A * (.5 - k * .14);
			ctx.fillStyle = k ? `rgb(${col})` : "#f4f6ff";
			ctx.save();
			ctx.translate(-34 - k * 20, Math.sin(ph * 2 + k) * 4);
			crescent(ctx, 64, 0, .95, k ? 16 : 6);
			ctx.fill();
			ctx.restore();
		}
		ctx.strokeStyle = `rgba(235,240,255,${.45 * A})`;
		ctx.lineWidth = 1.5;
		ctx.lineCap = "round";
		for (let i = 0; i < 4; i++) {
			const yy = -48 + i * 32 + Math.sin(ph * 3 + i) * 5;
			ctx.beginPath();
			ctx.moveTo(30, yy);
			ctx.quadraticCurveTo(-10, yy - 10, -60 - i * 6, yy + 4);
			ctx.stroke();
		}
		ctx.restore();
	}
	const A_TORN = {
		dmg: 4,
		post: 10,
		kb: 0,
		stun: .46,
		kind: "blade",
		special: true
	};
	const A_TORN_LAST = {
		dmg: 9,
		post: 22,
		kb: 160,
		stun: .6,
		kind: "blade",
		special: true,
		knock: true,
		lift: 1.9
	};
	class Tornado {
		constructor(owner, x, dir) {
			this.owner = owner;
			this.x = x;
			this.y = 0;
			this.vx = dir * 290;
			this.vy = 0;
			this.t = 0;
			this.life = 1.4;
			this.rot = 6e3;
			this.dead = false;
			this.stuck = false;
			this.falling = false;
			this.hits = 0;
			this.next = .1;
			this.blocked = false;
			this.alpha = 0;
			this.col = rgbOf(owner.col.accent, "230,120,220");
		}
		update(dt) {
			this.t += dt;
			this.x += this.vx * dt;
			this.rot = 6e3 + this.t * 7 % 6.28;
			this.alpha = Math.max(0, Math.min(1, this.t / .14, (this.life - this.t) / .25));
			if (this.t > this.life || Math.abs(this.x) > ND.ARENA + 30) {
				this.dead = true;
				return;
			}
			if (Math.random() < dt * 34) part({
				k: Math.random() < .5 ? "petal" : "leaf",
				x: this.x + rand(-50, 50),
				y: -rand(10, 220),
				vx: rand(-200, 200) + this.vx,
				vy: rand(-220, -40),
				drag: 1.2,
				flut: 9,
				life: rand(.4, .8),
				sz: rand(3, 5),
				c: Math.random() < .6 ? this.col : "240,236,255"
			});
			if (Math.random() < dt * 20) fx.dust(this.x, 0, 1, .8);
			const G = game();
			if (G.projs) for (const p of G.projs) {
				if (p === this || p.owner === this.owner || p.falling || p.stuck || !p.deflect || p.wait > 0) continue;
				if (Math.abs(p.x - this.x) < 60 && p.y > -250) p.deflect();
			}
			const o = this.owner.opp;
			if (!o || o.dead || this.hits >= 5) return;
			const dx = this.x - o.x, s = Math.sign(this.vx) || 1;
			if (Math.abs(dx) < 170 && o.onGround && !o.isInv() && o.state !== "guard" && o.state !== "block" && o.state !== "parry") o.x += Math.sign(dx) * Math.min(Math.abs(dx), 130 * dt);
			if (this.t < this.next || Math.abs(dx) > 66 || o.isInv() || o.y < -110) return;
			this.next = this.t + .15;
			const pan = cam.pan(this.x), last = this.hits === 4;
			if (o.guardingFrom(this.owner, this.x - s * 40) || Math.abs(dx) < 24 && (o.state === "guard" || o.state === "block")) {
				if (!this.blocked && perfectGuard(o)) {
					this.hits = 5;
					this.life = this.t + .2;
					fx.ring(o.x, -110, "240,236,255", 110);
					fx.text(o.x, -205, TX.parry, "#ffe3a1");
					au.parry(pan);
					hitstop(.08);
					o.setState("parry");
					o.gainKi(14);
					o.parries = (o.parries || 0) + 1;
					return;
				}
				this.blocked = true;
				this.hits++;
				chip(o, 11, s, o.x - s * 10, o.y - 110);
				return;
			}
			this.hits++;
			const a = last ? A_TORN_LAST : A_TORN, own = this.owner, dmg = Math.round(a.dmg * (own.ch.dmg || 1));
			own.gainKi(ND.scaleDmg(dmg, a) * 1.6);
			if (this.hits === 1) fx.text(o.x, -175, TX.whirlHit, "#ffd27a");
			o.takeHit(dmg, a, own, o.x, o.y - 100, "body", s);
			if (!o.dead && o.state === "hurt") o.vx = (this.x - o.x) * 3 + this.vx * .9;
			if (last) {
				glow(o.x, -120, 130, this.col, .4);
				burst(24, () => ({
					k: "petal",
					x: o.x,
					y: -rand(40, 200),
					vx: rand(-320, 320),
					vy: rand(-500, -100),
					g: 260,
					drag: 1.4,
					flut: 7,
					life: rand(.8, 1.4),
					sz: rand(4, 6),
					c: Math.random() < .6 ? this.col : "255,240,250"
				}));
				cam.punch(7);
			}
		}
		draw(ctx) {
			drawTornado(ctx, this);
		}
	}
	function drawTornado(ctx, p) {
		const ph = p.rot % 1e3, col = p.col || "230,120,220", A = p.alpha ?? 1;
		if (A <= .01) return;
		ctx.save();
		ctx.translate(p.x, 0);
		ctx.globalCompositeOperation = "lighter";
		ctx.lineCap = "round";
		const A0 = ctx.globalAlpha;
		ctx.globalAlpha = A0 * A;
		ctx.fillStyle = cgrad(ctx, "tornado", col, mkTornado);
		ctx.beginPath();
		ctx.ellipse(0, -110, 90, 140, 0, 0, TAU);
		ctx.fill();
		ctx.globalAlpha = A0;
		for (let i = 0; i < 8; i++) {
			const u = i / 7, y = -8 - u * 225, rx = 16 + u * u * 70 + Math.sin(ph * 3 + i) * 4, ry = 4 + u * 9, off = Math.sin(ph * 2 + i * .9) * 10 * u, a0 = ph * 4 + i * 1.3;
			ctx.globalAlpha = A * (.55 - u * .2);
			ctx.strokeStyle = i % 2 ? `rgb(${col})` : "#f3eeff";
			ctx.lineWidth = 3.2 - u * 1.4;
			ctx.beginPath();
			ctx.ellipse(off, y, rx, ry, 0, a0, a0 + 3.6);
			ctx.stroke();
		}
		ctx.globalAlpha = A * .5;
		ctx.strokeStyle = "rgba(210,200,190,.8)";
		ctx.lineWidth = 6;
		ctx.beginPath();
		ctx.ellipse(0, -3, 46 + Math.sin(ph * 5) * 5, 7, 0, 0, TAU);
		ctx.stroke();
		ctx.restore();
	}
	ND.projSkins[3] = drawArrowP;
	ND.projSkins[4] = drawStone;
	ND.projSkins[5] = drawGust;
	ND.projSkins[6] = drawTornado;
	ND.Arrow = Arrow;
	ND.Gust = Gust;
	ND.Tornado = Tornado;
	const A_STONE = {
		dmg: 6,
		kb: 150,
		stun: .26,
		post: 10,
		kind: "shuriken",
		blunt: true
	};
	ND.PROJ = { stone(f) {
		snd2.stone(f.pan);
		return new ND.Shuriken(f, f.j.haB.x, f.j.haB.y, f.dir, {
			skin: 4,
			v: 980,
			a: A_STONE
		});
	} };
	DEF.tr_l1 = {
		keys: [
			[
				.1,
				"tr_w1a",
				E.inOutSine
			],
			[
				.2,
				"tr_w1b",
				E.outQuart
			],
			[.4, "tr_w1b"],
			[
				.56,
				"tr_stance",
				E.inOut
			]
		],
		active: [.13, .3],
		dmg: 8,
		post: 12,
		kb: 170,
		stun: .38,
		chain: [.3, .56],
		next: "light2",
		sw: .12,
		pw: .7,
		kind: "whip",
		reach: 300,
		wpath: (f, t, o) => pathLine(f, t, [
			.1,
			.22,
			.3,
			.46
		], 250, -112, o),
		ev: [[.11, (f) => snd2.chainThrow(f.pan)]]
	};
	DEF.tr_l2 = {
		keys: [
			[
				.1,
				"tr_w2a",
				E.inOutSine
			],
			[
				.24,
				"tr_w2b",
				E.outQuart
			],
			[.42, "tr_w2b"],
			[
				.6,
				"tr_stance",
				E.inOut
			]
		],
		active: [.15, .32],
		dmg: 9,
		post: 14,
		kb: 210,
		stun: .4,
		chain: [.32, .6],
		next: "light3",
		sw: .12,
		pw: .8,
		kind: "whip",
		reach: 280,
		sc: true,
		wpath: (f, t, o) => pathArc(f, t, [
			.12,
			.3,
			.34,
			.52
		], 215, -2.7, .35, o),
		ev: [[.1, (f) => snd2.chainThrow(f.pan)]]
	};
	DEF.tr_s1 = {
		keys: [
			[
				.08,
				"tr_s1a",
				E.inOutSine
			],
			[
				.16,
				"tr_s1b",
				E.outQuart
			],
			[.28, "tr_s1b"],
			[
				.46,
				"tr_stance",
				E.inOut
			]
		],
		active: [.1, .19],
		dmg: 8,
		post: 13,
		kb: 220,
		stun: .36,
		lunge: [
			.08,
			.17,
			240
		],
		chain: [.19, .46],
		next: "light2",
		sw: .08,
		pw: .9,
		kind: "blade"
	};
	DEF.tr_s2 = {
		keys: [
			[
				.08,
				"tr_s2a",
				E.inOutSine
			],
			[
				.16,
				"tr_s2b",
				E.outQuart
			],
			[.28, "tr_s2b"],
			[
				.46,
				"tr_stance",
				E.inOut
			]
		],
		active: [.1, .19],
		dmg: 9,
		post: 14,
		kb: 230,
		stun: .38,
		lunge: [
			.08,
			.17,
			240
		],
		chain: [.19, .46],
		next: "light3",
		sw: .08,
		pw: .9,
		kind: "blade",
		sc: true
	};
	DEF.tr_l3 = {
		keys: [
			[
				.1,
				"tr_s1a",
				E.inOutSine
			],
			[
				.19,
				"tr_s1b",
				E.outQuart
			],
			[.32, "tr_s1b"],
			[
				.58,
				"tr_stance",
				E.inOut
			]
		],
		active: [.12, .22],
		dmg: 13,
		post: 22,
		kb: 480,
		stun: .5,
		lunge: [
			.1,
			.2,
			520
		],
		sw: .11,
		pw: 1.1,
		kind: "blade",
		thrust: true,
		sc: true
	};
	DEF.tr_hook = {
		keys: [
			[
				.12,
				"tr_w1a",
				E.inOutSine
			],
			[
				.22,
				"tr_w1b",
				E.outQuart
			],
			[.34, "tr_w1b"],
			[
				.44,
				"tr_hC",
				E.outCubic
			],
			[
				.7,
				"tr_stance",
				E.inOut
			]
		],
		active: [.2, .32],
		dmg: 7,
		post: 12,
		kb: 60,
		stun: .45,
		pull: 85,
		pullStun: .5,
		kind: "whip",
		reach: 300,
		sw: .16,
		pw: .8,
		sc: true,
		wpath: (f, t, o) => pathCaught(f, t, .2, .52, o) || pathLine(f, t, [
			.12,
			.24,
			.32,
			.5
		], 260, -110, o),
		ev: [[.13, (f) => snd2.chainThrow(f.pan)]]
	};
	DEF.tr_heavy = {
		keys: [
			[
				.2,
				"tr_hA",
				E.inOutSine
			],
			[.32, "tr_hA"],
			[
				.4,
				"tr_hB",
				E.outQuart
			],
			[.56, "tr_hB"],
			[
				.66,
				"tr_hC",
				E.outCubic
			],
			[
				.96,
				"tr_stance",
				E.inOut
			]
		],
		active: [.37, .5],
		dmg: 12,
		post: 28,
		kb: 60,
		stun: .5,
		pull: 78,
		pullStun: .8,
		kind: "whip",
		reach: 360,
		sw: .35,
		pw: 1.2,
		glint: [.1, .3],
		sc: true,
		wpath: (f, t, o) => pathCaught(f, t, .37, .82, o) || (t < .34 ? t > .04 ? pathTwirl(f, t, 30, 22, o) : null : pathLine(f, t, [
			.34,
			.45,
			.52,
			.76
		], 320, -118, o)),
		ev: [
			[.08, (f) => snd2.chain(f.pan, .8)],
			[.2, (f) => snd2.chain(f.pan, .8)],
			[.35, (f) => snd2.chainThrow(f.pan)]
		],
		onHit(f, o) {
			fx.text(o.x, -200, TX.caught, "#ffd27a");
			snd2.chain(f.pan, 1.6);
		}
	};
	DEF.jn_l1 = {
		keys: [
			[
				.1,
				"jn_t1a",
				E.inOutSine
			],
			[
				.18,
				"jn_t1b",
				E.outQuart
			],
			[.3, "jn_t1b"],
			[
				.5,
				"jn_stance",
				E.inOut
			]
		],
		active: [.13, .22],
		dmg: 8,
		post: 14,
		kb: 260,
		stun: .36,
		lunge: [
			.1,
			.19,
			240
		],
		chain: [.21, .5],
		next: "light2",
		sw: .1,
		pw: .8,
		kind: "blade",
		thrust: true,
		reach: 270
	};
	DEF.jn_l2 = {
		keys: [
			[
				.08,
				"jn_t2a",
				E.inOutSine
			],
			[
				.19,
				"jn_t2b",
				E.outQuart
			],
			[.3, "jn_t2b"],
			[
				.5,
				"jn_stance",
				E.inOut
			]
		],
		active: [.1, .21],
		dmg: 9,
		post: 16,
		kb: 250,
		stun: .4,
		lunge: [
			.08,
			.18,
			260
		],
		chain: [.21, .5],
		next: "light3",
		sw: .08,
		pw: .9,
		kind: "blade",
		reach: 250,
		sc: true
	};
	DEF.jn_l3 = {
		keys: [
			[
				.14,
				"jn_t3a",
				E.inOutSine
			],
			[
				.24,
				"jn_t3b",
				E.outQuart
			],
			[.38, "jn_t3b"],
			[
				.66,
				"jn_stance",
				E.inOut
			]
		],
		active: [.17, .27],
		dmg: 12,
		post: 26,
		kb: 380,
		stun: .5,
		lunge: [
			.14,
			.25,
			460
		],
		sw: .15,
		pw: 1.2,
		kind: "blade",
		knock: true,
		reach: 290,
		sc: true,
		onHit(f, o, x) {
			fx.dust(x, 0, 8, 1.2);
			cam.punch(4);
		}
	};
	DEF.jn_heavy = {
		keys: [
			[
				.12,
				"jn_hA",
				E.inOutSine
			],
			[.3, "jn_hA"],
			[
				.4,
				"jn_hB",
				E.outQuart
			],
			[.55, "jn_hB"],
			[
				.88,
				"jn_stance",
				E.inOut
			]
		],
		active: [.33, .46],
		dmg: 17,
		post: 36,
		kb: 320,
		stun: .55,
		lunge: [
			.3,
			.42,
			380
		],
		sw: .32,
		pw: 1.4,
		kind: "blade",
		knock: true,
		glint: [.12, .3],
		reach: 300,
		sc: true,
		ev: [[.08, (f) => snd2.staff(f.pan, .7)]],
		tick(f, dt, t) {
			if (t > .06 && t < .3) {
				const c = Math.cos((t - .06) / .24 * TAU);
				f.vdir = (c < 0 ? -1 : 1) * Math.max(.14, Math.abs(c));
			} else f.vdir = 1;
		},
		onHit(f, o, x) {
			fx.dust(x, 0, 10, 1.4);
		}
	};
	DEF.jn_dash = {
		keys: [
			[
				.06,
				"jn_t1a",
				E.inOutSine
			],
			[
				.14,
				"jn_t1b",
				E.outQuart
			],
			[.26, "jn_t1b"],
			[
				.44,
				"jn_stance",
				E.inOut
			]
		],
		active: [.08, .18],
		dmg: 10,
		post: 16,
		kb: 320,
		stun: .42,
		lunge: [
			0,
			.14,
			560
		],
		sw: .05,
		pw: 1,
		kind: "blade",
		thrust: true
	};
	DEF.jn_throw = {
		keys: [
			[
				.12,
				"t1a",
				E.inOutSine
			],
			[
				.2,
				"t1b",
				E.outQuart
			],
			[.44, "jn_stance"]
		],
		release: .17,
		kind: "throw",
		proj: "stone"
	};
	DEF.mi_l1 = {
		keys: [
			[
				.07,
				"mi_l1a",
				E.inOutSine
			],
			[
				.15,
				"mi_l1b",
				E.outQuart
			],
			[.24, "mi_l1b"],
			[
				.4,
				"mi_stance",
				E.inOut
			]
		],
		active: [.09, .17],
		dmg: 7,
		post: 12,
		kb: 210,
		stun: .34,
		lunge: [
			.07,
			.16,
			320
		],
		chain: [.17, .4],
		next: "light2",
		sw: .07,
		pw: .7,
		kind: "blade"
	};
	DEF.mi_l2 = {
		keys: [
			[
				.07,
				"mi_l2a",
				E.inOutSine
			],
			[
				.15,
				"mi_l2b",
				E.outQuart
			],
			[.24, "mi_l2b"],
			[
				.4,
				"mi_stance",
				E.inOut
			]
		],
		active: [.09, .17],
		dmg: 8,
		post: 13,
		kb: 220,
		stun: .36,
		lunge: [
			.07,
			.16,
			300
		],
		chain: [.17, .4],
		next: "light3",
		sw: .07,
		pw: .75,
		kind: "blade",
		sc: true
	};
	DEF.mi_l3 = {
		keys: [
			[
				.08,
				"mi_l3a",
				E.inOutSine
			],
			[.3, "mi_l3a"],
			[
				.38,
				"mi_l3b",
				E.outQuart
			],
			[
				.6,
				"mi_stance",
				E.inOut
			]
		],
		active: [.1, .16],
		hits: [
			[.1, .16],
			[.2, .26],
			[.33, .4]
		],
		zone: [
			112,
			50,
			110
		],
		dmg: 5,
		post: 10,
		kb: 60,
		stun: .4,
		knockLast: true,
		lastHit: {
			dmg: 7,
			kb: 420,
			post: 18
		},
		sw: .08,
		pw: .9,
		kind: "blade",
		fanB: 1,
		reach: 150,
		sc: true,
		tick(f, dt, t, o) {
			if (t > .08 && t < .3) {
				const c = Math.cos((t - .08) / .22 * TAU);
				f.vdir = (c < 0 ? -1 : 1) * Math.max(.14, Math.abs(c));
				chase(f, o, 64, 260);
			} else f.vdir = 1;
			if (t > .08 && t < .4 && Math.random() < dt * 30) part({
				k: "petal",
				x: f.x + rand(-60, 60),
				y: f.y - rand(40, 150),
				vx: rand(-160, 160),
				vy: rand(-80, 20),
				g: 120,
				drag: 1.5,
				flut: 7,
				life: rand(.4, .8),
				sz: rand(3, 4.5),
				c: rgbOf(f.col.accent)
			});
		}
	};
	DEF.mi_heavy = {
		keys: [
			[
				.16,
				"mi_hA",
				E.inOutSine
			],
			[.24, "mi_hA"],
			[
				.32,
				"mi_hB",
				E.outQuart
			],
			[.5, "mi_hB"],
			[
				.74,
				"mi_stance",
				E.inOut
			]
		],
		active: [.28, .34],
		sw: .26,
		pw: 1.1,
		kind: "gust",
		reach: 300,
		glint: [.06, .2],
		ev: [[.28, (f) => {
			const g = game();
			if (g.projs) g.projs.push(new Gust(f, f.x + f.dir * 60, f.y - 104, f.dir));
			snd2.gust(f.pan);
			fx.dust(f.x + f.dir * 30, 0, 6, 1);
		}]]
	};
	function tsLoose(f) {
		if (f.ammo <= 0 || f.mem.shot) return;
		f.ammo--;
		f.mem.shot = true;
		const k = Math.min(1, (f.mem.charge || 0) / .8), A = ND.bowAim(f.j, R2), g = game();
		if (g.projs) g.projs.push(new Arrow(f, A.x + A.dx * 12, A.y + A.dy * 12, A.dx, A.dy, 1250 + 650 * k, {
			dmg: 11 + 8 * k,
			post: 12 + 18 * k,
			kb: 170 + 220 * k,
			stun: .36 + .14 * k,
			kind: "arrow",
			knock: k > .95
		}, {
			glow: k > .5 ? k * .8 : 0,
			g: 260 - 170 * k
		}));
		snd2.twang(f.pan, 1 + k * .3);
		if (k > .95) {
			cam.punch(3);
			fx.ring(A.x, A.y, "200,240,255", 50);
		}
	}
	function tsFlipShot(f) {
		if (f.ammo <= 0 || f.mem.shot) return;
		f.ammo--;
		f.mem.shot = true;
		const o = f.opp, A = ND.bowAim(f.j, R2);
		let dx = o.x - A.x, dy = o.y - 105 - A.y;
		const d = Math.hypot(dx, dy) || 1;
		dx /= d;
		dy /= d;
		if (dx * f.dir < .35) {
			dx = f.dir * .8;
			dy = .6;
		}
		const g = game();
		if (g.projs) g.projs.push(new Arrow(f, A.x + dx * 20, A.y + dy * 20, dx, dy, 1400, {
			dmg: 10,
			post: 14,
			kb: 200,
			stun: .4,
			kind: "arrow",
			air: true
		}, { g: 200 }));
		snd2.twang(f.pan, 1.15);
	}
	DEF.ts_shot = {
		keys: [
			[
				.1,
				"ts_nock",
				E.outCubic
			],
			[
				.26,
				"ts_aim",
				E.inOutSine
			],
			[.3, "ts_aim"],
			[
				.36,
				"ts_loose",
				E.outCubic
			],
			[
				.5,
				"ts_stance",
				E.inOut
			]
		],
		active: [.31, .35],
		kind: "shoot",
		bow: [.02, .5],
		nock: [.06, .31],
		hold: {
			key: "heavy",
			t: .28,
			max: .8
		},
		drawK: (f, t) => f.mem.shot ? 0 : t < .1 ? 0 : Math.min(1, (t - .1) / .16),
		ev: [[.12, (f) => snd2.draw(f.pan)], [.31, (f) => tsLoose(f)]]
	};
	DEF.ts_flip = {
		keys: [
			[
				.07,
				"land",
				E.outCubic
			],
			[
				.16,
				"ts_tuck",
				E.outCubic
			],
			[.48, "ts_tuck"],
			[
				.62,
				"ts_stance",
				E.inOut
			]
		],
		active: [.43, .47],
		kind: "shoot",
		arc: true,
		bow: [.1, .5],
		nock: [.12, .43],
		inv: [.07, .22],
		drawK: (f, t) => f.mem.shot ? 0 : clamp((t - .14) / .14, 0, 1),
		ev: [
			[.07, (f) => {
				f.mem.x0 = f.x;
				au.swoosh(.9, f.pan);
				fx.dust(f.x, 0, 8, 1);
			}],
			[.2, (f) => snd2.draw(f.pan)],
			[.43, (f) => tsFlipShot(f)]
		],
		tick(f, dt, t) {
			const t0 = .07, t1 = .52;
			if (t >= t0 && t < t1) {
				const u = (t - t0) / (t1 - t0), A = ND.ARENA - 10;
				f.y = -150 * Math.sin(Math.PI * u);
				f.x = clamp((f.mem.x0 ?? f.x) - f.dir * 210 * E.outCubic(u), -A, A);
				f.vx = 0;
				f.drive = true;
				f.roll = -f.dir * TAU * E.inOutSine(u);
			} else if (t >= t1) {
				if (f.y < 0) f.y = 0;
				f.roll = 0;
			}
		}
	};
	ND.MOVES = {
		tora(f, n) {
			const gap = Math.abs(f.opp.x - f.x);
			if (n === "light1") return gap < 125 ? "tr_s1" : "tr_l1";
			if (n === "light2") return gap < 125 ? "tr_s2" : "tr_l2";
			if (n === "light3") return gap < 125 ? "tr_l3" : "tr_hook";
			if (n === "heavy") return "tr_heavy";
			return null;
		},
		jin: {
			light1: "jn_l1",
			light2: "jn_l2",
			light3: "jn_l3",
			heavy: "jn_heavy",
			dash: "jn_dash",
			throw: "jn_throw"
		},
		mai: {
			light1: "mi_l1",
			light2: "mi_l2",
			light3: "mi_l3",
			heavy: "mi_heavy"
		},
		tsubame(f, n) {
			if (n === "heavy") return f.ammo > 0 ? "ts_shot" : null;
			if (n === "throw") return "ts_flip";
			return null;
		}
	};
	const trS0 = .14, trS1 = .82;
	DEF.sp_tora = {
		keys: [
			[
				trS0,
				"tr_spin",
				E.inOutSine
			],
			[
				.48,
				"tr_spin2",
				E.inOutSine
			],
			[
				trS1,
				"tr_spin",
				E.inOutSine
			],
			[
				.9,
				"tr_yank",
				E.outCubic
			],
			[.98, "tr_yank"],
			[
				1.06,
				"tr_rise",
				E.outQuart
			],
			[1.22, "tr_rise"],
			[
				1.46,
				"tr_stance",
				E.inOut
			]
		],
		active: [.3, .36],
		hits: [
			[.3, .36],
			[.44, .5],
			[.58, .64],
			[.72, .78],
			[1.02, 1.1]
		],
		zone: [
			245,
			245,
			150
		],
		dmg: 4,
		post: 14,
		kb: 30,
		stun: .55,
		knockLast: true,
		lastHit: {
			dmg: 12,
			kb: 300,
			post: 30,
			lift: 1.6,
			kind: "blade",
			zone: [
				135,
				20,
				160
			]
		},
		sw: .28,
		pw: 1.3,
		kind: "whip",
		special: true,
		glint: [.02, .14],
		trail: "255,200,80",
		kanji: "鎖竜巻",
		hitTxt: null,
		wpath(f, t, o) {
			if (t < trS0) return null;
			if (t < trS1 + .02) {
				const k = Math.min(1, (t - trS0) / .16), R = 40 + 200 * eo(k), th = (t - trS0) * 27.7 * f.dir;
				o.x = f.x + Math.cos(th) * R;
				o.y = f.y - 168 + Math.sin(th) * 26;
				return o;
			}
			return pathCaught(f, t, trS1, 1, o) || pathLine(f, t, [
				trS1 - .2,
				trS1 - .1,
				trS1,
				1
			], 120, -170, o);
		},
		ev: [
			[.01, (f) => {
				snd2.chain(f.pan, 1.2);
				glow(f.x, f.y - 120, 80, rgbOf(f.col.accent), .3, .5);
			}],
			[trS0, (f) => toraWhirl(f)],
			[.86, (f, a, o) => toraYank(f, o)],
			[1.03, (f) => {
				au.swoosh(1.6, f.pan);
				slashArc({
					x: f.x + f.dir * 40,
					y: f.y - 130,
					r: 100,
					mid: f.dir > 0 ? -.4 : Math.PI + .4,
					span: 1.2,
					w: 24,
					rotA: -.5 * f.dir,
					col: rgbOf(f.col.accent),
					core: "255,245,220",
					life: .4
				});
			}]
		].concat([
			0,
			1,
			2,
			3,
			4
		].map((i) => [trS0 + .04 + i * .13, (f) => {
			snd2.chain(f.pan, 1);
			au.swoosh(.8, f.pan);
		}])).sort((a, b) => a[0] - b[0]),
		tick(f, dt, t, o) {
			if (t >= trS0 && t < trS1) {
				chase(f, o, 170, 150);
				if (Math.random() < dt * 24) fx.dust(f.x + rand(-200, 200), 0, 1, .8);
			}
			if (t > .3 && t < .8 && (o.state === "hurt" || o.state === "launch")) f.mem.caught = o;
		},
		onHit(f, o, x, y) {
			if (f.hitIdx >= 4) {
				glow(x, y, 120, rgbOf(f.col.accent), .35);
				au.taiko(1.1);
				cam.punch(8);
			}
		}
	};
	function toraYank(f, o) {
		const c = f.mem.caught;
		if (!c || c.dead || c.isInv() || !(c.state === "hurt" || c.state === "launch")) {
			f.mem.caught = null;
			return;
		}
		const gap = (c.x - f.x) * f.dir;
		if (gap > 90 && gap < 330) {
			c.vx = -f.dir * (gap - 80) * 6.4;
			if (c.state === "hurt") c.dur = Math.max(c.dur, c.st + .4);
			fx.text(c.x, -200, TX.caught, "#ffd27a");
			snd2.chainThrow(f.pan);
			cam.punch(5);
		}
	}
	function toraWhirl(f) {
		attach(f, {
			until: trS1 + .04,
			out: .25,
			draw(ctx) {
				const k = this.k(), f = this.f, ph = this.t * 27.7 * (f.dir || 1), cx = f.x, cy = f.y - 168, col = rgbOf(f.col.accent);
				ctx.globalCompositeOperation = "lighter";
				ctx.lineCap = "round";
				const R = 40 + 200 * eo(Math.min(1, this.t / .16));
				for (let i = 0; i < 3; i++) {
					ctx.strokeStyle = `rgba(${i ? "220,225,240" : col},${(.34 - i * .09) * k})`;
					ctx.lineWidth = 5 - i * 1.4;
					ctx.beginPath();
					ctx.ellipse(cx, cy, R - i * 8, 26 - i * 3, 0, ph - 2.4 - i * .5, ph - .1);
					ctx.stroke();
				}
				ctx.strokeStyle = `rgba(200,190,170,${.16 * k})`;
				ctx.lineWidth = 9;
				ctx.beginPath();
				ctx.ellipse(cx, -3, R * .8 + Math.sin(this.t * 9) * 8, 11, 0, 0, TAU);
				ctx.stroke();
			}
		});
	}
	const jnT0 = .14, jnT1 = .68;
	const jnKeys = [[
		jnT0,
		"jn_spA",
		E.inOutSine
	]];
	for (let i = 1; i <= 6; i++) jnKeys.push([
		jnT0 + i * .09,
		i % 2 ? "jn_spB" : "jn_spA",
		E.linear
	]);
	jnKeys.push([
		.8,
		"jn_t1a",
		E.outCubic
	], [
		.9,
		"jn_rise",
		E.outQuart
	], [1.1, "jn_rise"], [
		1.34,
		"jn_stance",
		E.inOut
	]);
	DEF.sp_jin = {
		keys: jnKeys,
		active: [.2, .26],
		hits: [
			[.2, .26],
			[.32, .38],
			[.44, .5],
			[.56, .62],
			[.86, .95]
		],
		zone: [
			178,
			178,
			140
		],
		dmg: 5,
		post: 16,
		kb: 40,
		stun: .5,
		knockLast: true,
		lastHit: {
			dmg: 11,
			kb: 240,
			post: 30,
			lift: 1.75
		},
		sw: .16,
		pw: 1.3,
		kind: "blade",
		special: true,
		glint: [.02, .14],
		trail: "255,215,120",
		kanji: "金剛輪舞",
		ev: [
			[.01, (f) => {
				snd.ring(392, f.pan, .06, 1.8);
				jinAura(f);
			}],
			[jnT0, (f) => jinWheel(f)],
			[.86, (f) => {
				snd2.staff(f.pan, 1.6);
				au.taiko(1);
				glow(f.x + f.dir * 40, f.y - 120, 120, "255,215,120", .35);
				fx.dust(f.x, 0, 12, 1.5);
			}]
		].concat([
			0,
			1,
			2,
			3,
			4,
			5
		].map((i) => [jnT0 + i * .09, (f) => snd2.staff(f.pan, .9)])).sort((a, b) => a[0] - b[0]),
		tick(f, dt, t, o) {
			if (t >= jnT0 && t < jnT1) {
				const c = Math.cos((t - jnT0) / (jnT1 - jnT0) * 3 * TAU);
				f.vdir = (c < 0 ? -1 : 1) * Math.max(.12, Math.abs(c));
				chase(f, o, 90, 380);
				if (Math.random() < dt * 30) part({
					k: "spark",
					x: f.x + rand(-120, 120),
					y: f.y - rand(80, 170),
					vx: rand(-60, 60),
					vy: rand(-80, 0),
					life: rand(.25, .5),
					sz: rand(1, 2),
					c: "255,225,140",
					add: true
				});
			} else {
				f.vdir = 1;
				if (t >= jnT1 && t < .9) chase(f, o, 70, 260);
			}
		},
		onHit(f, o, x, y) {
			const last = f.hitIdx >= 4;
			glow(x, y, last ? 130 : 70, "255,215,120", last ? .4 : .22);
			burst(last ? 16 : 6, () => ({
				k: "spark",
				x,
				y,
				vx: rand(-300, 300),
				vy: rand(-340, 60),
				g: 400,
				drag: 1.2,
				life: rand(.3, .6),
				sz: rand(1.2, 2.2),
				c: "255,230,160",
				add: true
			}));
			if (last) {
				fx.text(o.x, -240, TX.vajraHit, "#ffd27a");
				cam.punch(10);
			}
		}
	};
	function jinAura(f) {
		attach(f, {
			out: .3,
			until: 1,
			draw(ctx) {
				const k = this.k(), f = this.f, pul = .75 + .25 * Math.sin(this.t * 18);
				ctx.globalCompositeOperation = "lighter";
				ctx.globalAlpha = .3 * k * pul;
				ctx.translate(f.x, f.y - 100);
				ctx.fillStyle = cgrad(ctx, "jin", "", mkJin);
				ctx.beginPath();
				ctx.ellipse(0, 0, 90, 120, 0, 0, TAU);
				ctx.fill();
			}
		});
	}
	function jinWheel(f) {
		attach(f, {
			until: jnT1 + .02,
			out: .2,
			draw(ctx) {
				const k = this.k(), f = this.f, ph = this.t * 30, cx = f.x, cy = f.y - 150;
				ctx.globalCompositeOperation = "lighter";
				ctx.lineCap = "round";
				for (let i = 0; i < 2; i++) {
					const rx = 170 - i * 30, a0 = ph + i * Math.PI;
					ctx.strokeStyle = `rgba(255,${215 - i * 30},${130 - i * 40},${(.42 - i * .12) * k})`;
					ctx.lineWidth = 6 - i * 2;
					ctx.beginPath();
					ctx.ellipse(cx, cy, rx, 20, 0, a0, a0 + 2.4);
					ctx.stroke();
				}
				ctx.fillStyle = `rgba(255,240,200,${.8 * k})`;
				for (let i = 0; i < 4; i++) {
					const a = ph * .7 + i * TAU / 4, x = cx + Math.cos(a) * 150, y = cy + Math.sin(a) * 18, s = 5 + 2 * Math.sin(ph + i);
					ctx.beginPath();
					ctx.moveTo(x, y - s);
					ctx.lineTo(x + s * .45, y);
					ctx.lineTo(x, y + s);
					ctx.lineTo(x - s * .45, y);
					ctx.closePath();
					ctx.fill();
				}
			}
		});
	}
	const miT0 = .12, miT1 = .5;
	const miKeys = [[
		miT0,
		"mi_spA",
		E.inOutSine
	]];
	for (let i = 1; i <= 4; i++) miKeys.push([
		miT0 + i * .095,
		i % 2 ? "mi_spB" : "mi_spA",
		E.inOutSine
	]);
	miKeys.push([
		.58,
		"mi_hB",
		E.outQuart
	], [
		.72,
		"mi_spEnd",
		E.outCubic
	], [.8, "mi_spEnd"], [
		.98,
		"mi_stance",
		E.inOut
	]);
	DEF.sp_mai = {
		keys: miKeys,
		active: [.54, .6],
		kind: "gust",
		special: true,
		glint: [.02, .12],
		trail: "240,150,230",
		kanji: "旋風の舞",
		fanB: 1,
		fan: 1,
		ev: [[.01, (f) => {
			snd2.wind(f.pan);
			burst(20, () => {
				const a = rand(0, TAU), r = rand(60, 120);
				return {
					k: "petal",
					x: f.x + Math.cos(a) * r,
					y: f.y - 90 + Math.sin(a) * r * .6,
					vx: -Math.cos(a) * r * 2.5,
					vy: -Math.sin(a) * r * 1.6,
					drag: 2,
					flut: 6,
					life: .4,
					sz: rand(3, 5),
					c: rgbOf(f.col.accent),
					fadeIn: true
				};
			});
		}], [.54, (f) => {
			const g = game();
			if (g.projs) g.projs.push(new Tornado(f, clamp(f.x + f.dir * 70, -ND.ARENA + 20, ND.ARENA - 20), f.dir));
			snd2.gust(f.pan);
			cam.punch(5);
			fx.dust(f.x + f.dir * 60, 0, 12, 1.5);
		}]].concat([
			0,
			1,
			2,
			3
		].map((i) => [miT0 + i * .095, (f) => snd2.fan(f.pan)])).sort((a, b) => a[0] - b[0]),
		tick(f, dt, t) {
			if (t >= miT0 && t < miT1) {
				const c = Math.cos((t - miT0) / (miT1 - miT0) * 2 * TAU);
				f.vdir = (c < 0 ? -1 : 1) * Math.max(.14, Math.abs(c));
				if (Math.random() < dt * 50) part({
					k: "petal",
					x: f.x + rand(-80, 80),
					y: f.y - rand(30, 170),
					vx: rand(-220, 220),
					vy: rand(-140, 30),
					g: 120,
					drag: 1.5,
					flut: 7,
					life: rand(.5, .9),
					sz: rand(3.5, 5.5),
					c: Math.random() < .6 ? rgbOf(f.col.accent) : "255,236,250"
				});
			} else f.vdir = 1;
		}
	};
	const tsH0 = .08, tsH1 = .46;
	DEF.sp_tsubame = {
		keys: [
			[
				.08,
				"ts_nock",
				E.outCubic
			],
			[
				.18,
				"ts_aimUp",
				E.outCubic
			],
			[.24, "ts_aimUp"],
			[
				.3,
				"ts_aimUpL",
				E.outCubic
			],
			[
				.46,
				"land",
				E.inOutSine
			],
			[
				.54,
				"ts_nock",
				E.outCubic
			],
			[
				.68,
				"ts_aim",
				E.inOutSine
			],
			[.74, "ts_aim"],
			[
				.8,
				"ts_loose",
				E.outCubic
			],
			[
				1.02,
				"ts_stance",
				E.inOut
			]
		],
		active: [.74, .8],
		kind: "shoot",
		special: true,
		arc: true,
		bow: [.04, .92],
		nock: [[.1, .24], [.55, .74]],
		glint: [.6, .74],
		kanji: "燕返し",
		drawK: (f, t) => t < .24 ? clamp((t - .1) / .1, 0, 1) : t < .54 ? 0 : t < .74 ? clamp((t - .56) / .12, 0, 1) : 0,
		ev: [
			[.01, (f) => {
				snd2.draw(f.pan);
				glow(f.x, f.y - 110, 90, "170,235,255", .3, .5);
			}],
			[tsH0, (f) => {
				f.mem.x0 = f.x;
				au.swoosh(1, f.pan);
				fx.dust(f.x, 0, 10, 1.2);
			}],
			[.24, (f, a, o) => tsVolley(f, o)],
			[.74, (f, a, o) => tsSwallow(f, o)]
		],
		tick(f, dt, t) {
			if (t >= tsH0 && t < tsH1) {
				const u = (t - tsH0) / (tsH1 - tsH0), A = ND.ARENA - 10;
				f.y = -175 * Math.sin(Math.PI * u);
				f.x = clamp((f.mem.x0 ?? f.x) - f.dir * 140 * E.outCubic(u), -A, A);
				f.vx = 0;
				f.drive = true;
			} else if (t >= tsH1 && f.y < 0) f.y = 0;
		}
	};
	function tsVolley(f, o) {
		const g = game();
		if (!g.projs) return;
		const A = ND.bowAim(f.j, R2), ARN = ND.ARENA - 30;
		for (let i = 0; i < 5; i++) {
			const sp = (i - 2) * .06, ca = Math.cos(sp), sa = Math.sin(sp);
			g.projs.push(new Arrow(f, A.x, A.y, A.dx * ca - A.dy * sa, A.dx * sa + A.dy * ca, 1900, null, {
				noHit: true,
				g: 0
			}));
		}
		const lead = clamp(o.vx * .3, -90, 90);
		for (let i = 0; i < 5; i++) {
			const tx = clamp(o.x + lead + (i - 2) * 38 + srand(-8, 8), -ARN, ARN), wait = .12 + i * .04 + srand(0, .03);
			g.projs.push(new Arrow(f, tx - f.dir * 30, -600, f.dir * .05, 1, 1900, {
				dmg: 4,
				post: 8,
				kb: 30,
				stun: .34,
				kind: "arrow",
				special: true
			}, {
				wait,
				rain: true,
				g: 0
			}));
			tsMark(tx, wait + .26, rgbOf(f.col.accent, "170,235,255"));
		}
		snd2.twang(f.pan, 1.3);
		snd2.twang(f.pan, .9);
		burst(12, () => ({
			k: "streak",
			x: A.x,
			y: A.y,
			vx: A.dx * rand(300, 700) + rand(-100, 100),
			vy: A.dy * rand(300, 700),
			life: .25,
			sz: 1.3,
			c: "200,240,255",
			add: true,
			rot: 0,
			vr: 0
		}));
	}
	function tsMark(x, life, col) {
		SFX.add({
			x,
			life,
			draw(ctx) {
				const u = this.t / this.life, a = u < .8 ? .2 + u : (1 - u) * 5;
				ctx.globalCompositeOperation = "lighter";
				ctx.globalAlpha = Math.min(1, a) * .7;
				ctx.strokeStyle = `rgb(${col})`;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.ellipse(this.x, -2, 26 - u * 12, 5 - u * 2, 0, 0, TAU);
				ctx.stroke();
				ctx.globalAlpha *= .4;
				ctx.fillStyle = `rgb(${col})`;
				ctx.fillRect(this.x - 1, -220 * u, 2, 220 * u);
			}
		});
	}
	function tsSwallow(f, o) {
		const g = game();
		if (!g.projs || f.mem.sw) return;
		f.mem.sw = true;
		const A = ND.bowAim(f.j, R2);
		let dx = A.dx, dy = A.dy;
		if (o && o.j.neck) {
			const tx = o.x - A.x, ty = o.y - 112 - A.y, d = Math.hypot(tx, ty) || 1;
			if (tx * f.dir > 0) {
				dx = tx / d;
				dy = clamp(ty / d, -.35, .35);
			}
		}
		g.projs.push(new Arrow(f, A.x + dx * 20, A.y + dy * 20, dx, dy, 1500, {
			dmg: 12,
			post: 34,
			kb: 380,
			stun: .6,
			kind: "arrow",
			special: true,
			knock: true,
			lift: 1.2
		}, {
			g: 0,
			glow: 1,
			ret: 1
		}));
		snd2.twang(f.pan, 1.5);
		cam.punch(4);
		slashArc({
			x: A.x + f.dir * 40,
			y: A.y,
			r: 60,
			mid: f.dir > 0 ? 0 : Math.PI,
			span: 1,
			w: 12,
			col: "170,235,255",
			core: "255,255,255",
			life: .25
		});
	}
	for (const k in DEF) {
		const a = DEF[k];
		a.keys = a.keys.map(([t, p, e]) => [
			t,
			PO[p] || PO.stance,
			e
		]);
		a.dur = a.keys[a.keys.length - 1][0];
		ATK[k] = a;
	}
	const KA = ND.KAESHI, kv = ND.kaeshiVariant;
	if (KA && kv) {
		const KD = {};
		const kAcc = (f) => rgbOf(f.col.accent, "255,236,200");
		const kArc = (k, big) => (f) => {
			const d = f.dir, sh = f.j.sh || {
				x: f.x,
				y: f.y - 125
			}, R = Math.min(190, (f.wpn.blade || 96) + 55) * (big ? 1.12 : 1);
			const o = {
				x: sh.x,
				y: sh.y,
				r: R,
				span: 1.05,
				w: big ? 24 : 18,
				col: kAcc(f),
				core: "255,248,230",
				life: big ? .38 : .3,
				sx: d,
				sy: 1,
				rotA: 0,
				mid: .25,
				grow: .08
			};
			if (k === "h") {
				o.sy = .4;
				o.mid = 0;
				o.span = 1.3;
				o.y += 10;
			} else if (k === "u") {
				o.mid = -.1;
				o.span = .95;
			} else if (k === "v") {
				o.mid = .15;
				o.span = 1.3;
				o.y -= 10;
			}
			slashArc(o);
		};
		const kShock = (f) => {
			const x = clamp(f.j.tip.x, -ND.ARENA, ND.ARENA);
			fx.dust(x, 0, 12, 1.5);
			fx.ring(x, -4, "255,236,190", 110);
			fx.spark(x, -3, -Math.PI / 2, 22, 1.2);
			au.thud(1.1, f.pan);
			cam.punch(6);
		};
		const petals = (f, n) => burst(n, () => ({
			k: "petal",
			x: f.x + rand(-50, 60) * f.dir,
			y: f.y - rand(60, 150),
			vx: rand(-160, 160),
			vy: rand(-120, 20),
			g: 120,
			drag: 1.5,
			flut: 7,
			life: rand(.4, .8),
			sz: rand(3, 4.5),
			c: kAcc(f)
		}));
		const finEv = (arcs, extra) => [
			[.08, kArc(arcs[0])],
			[.2, kArc(arcs[1])],
			[.33, kArc(arcs[2], true)]
		].concat(extra || []).sort((a, b) => a[0] - b[0]);
		function pathWrap(f, t, T, out) {
			if (t < T[0] || t > T[3]) return null;
			const o = f.opp, hb = f.j.haB, oj = o && o.j;
			const tx = oj && oj.tip ? oj.haF.x + (oj.tip.x - oj.haF.x) * .55 : f.x + f.dir * 150, ty = oj && oj.tip ? oj.haF.y + (oj.tip.y - oj.haF.y) * .55 : f.y - 120;
			if (t < T[1]) {
				const u = eo((t - T[0]) / (T[1] - T[0]));
				out.x = hb.x + (tx - hb.x) * u;
				out.y = hb.y + (ty - hb.y) * u - Math.sin(Math.PI * u) * 24;
			} else if (t < T[2]) {
				const a = t * 70;
				out.x = tx + Math.cos(a) * 7;
				out.y = ty + Math.sin(a) * 7;
			} else {
				const u = ei((t - T[2]) / (T[3] - T[2]));
				out.x = tx + (hb.x - tx) * u;
				out.y = ty + (hb.y - ty) * u;
			}
			return out;
		}
		function pathAnkle(f, t, T, out) {
			if (t < T[0] || t > T[3]) return null;
			const o = f.opp, hb = f.j.haB, tx = (o ? o.x : f.x + f.dir * 120) - f.dir * 8, ty = -10;
			if (t < T[1]) {
				const u = eo((t - T[0]) / (T[1] - T[0]));
				out.x = hb.x + (tx - hb.x) * u;
				out.y = hb.y + (ty - hb.y) * u + Math.sin(Math.PI * u) * 10;
			} else if (t < T[2]) {
				const a = t * 60;
				out.x = tx + Math.cos(a) * 12;
				out.y = ty + Math.sin(a) * 4;
			} else {
				const u = ei((t - T[2]) / (T[3] - T[2]));
				out.x = tx + (hb.x - tx) * u;
				out.y = ty + (hb.y - ty) * u;
			}
			return out;
		}
		function pathSmash(f, t, out) {
			if (t > .2) return null;
			const o = f.opp, hb = f.j.haB;
			if (t < .045) return pathTwirl(f, t, 34, 26, out);
			const gx = (o ? o.x : f.x + f.dir * 120) - f.dir * 34;
			if (t < .075) {
				const u = (t - .045) / .03;
				out.x = hb.x + (gx - hb.x) * u;
				out.y = hb.y - 70 + (70 - hb.y - 6) * u * u;
				return out;
			}
			if (t < .12) {
				out.x = gx;
				out.y = -6;
				return out;
			}
			const u = ei((t - .12) / .08);
			out.x = gx + (hb.x - gx) * u;
			out.y = -6 + (hb.y + 6) * u;
			return out;
		}
		const twirl = (t0, t1, r, w) => (f, t, out) => t >= t0 && t <= t1 ? pathTwirl(f, t, r, w, out) : null;
		KD.jc_rip1 = kv("riposte", {
			keys: [
				[
					.05,
					"jc_defl",
					E.outCubic
				],
				[
					.13,
					"jc_tip",
					E.inOutSine
				],
				[
					.22,
					"jc_tipF",
					E.outCubic
				],
				[
					.4,
					"jn_stance",
					E.inOut
				]
			],
			defl: .04,
			slide: [
				0,
				.05,
				.4,
				.9,
				"P"
			],
			react: "rx_high",
			hurt: "rx_high",
			zan: [
				.24,
				"jc_zan",
				.16
			],
			ev: [[.06, (f) => snd2.staff(f.pan, 1)]]
		});
		KD.jc_rip2 = kv("riposte", {
			keys: [
				[
					.05,
					"jc_low",
					E.outCubic
				],
				[
					.14,
					"jc_smash",
					E.inOutSine
				],
				[
					.22,
					"jc_smashF",
					E.outCubic
				],
				[
					.4,
					"jn_stance",
					E.inOut
				]
			],
			defl: .045,
			slide: [
				0,
				.05,
				.45,
				.95
			],
			react: "rx_low",
			zan: [
				.24,
				"jc_zanP",
				.16
			],
			ev: [[.05, (f) => snd2.staff(f.pan, .8)]]
		});
		KD.jc_harai = kv("sweep", {
			keys: [
				[
					.04,
					"jc_hBeat",
					E.outCubic
				],
				[
					.1,
					"jc_hMid",
					E.inOutSine
				],
				[
					.17,
					"jc_hSweep",
					E.outCubic
				],
				[.28, "jc_hSweep"],
				[
					.48,
					"jn_stance",
					E.inOut
				]
			],
			defl: .035,
			slide: [
				0,
				.035,
				.5,
				.9
			],
			react: "rx_off",
			zan: [
				.3,
				"jc_zanLow",
				.16
			],
			ev: [[.08, (f) => snd2.staff(f.pan, .9)]]
		});
		KD.jc_nuki = kv("mawari", {
			keys: [
				[
					.07,
					"jc_nDuck",
					E.outCubic
				],
				[.19, "jc_nDuck"],
				[
					.25,
					"jc_nCh",
					E.inOutSine
				],
				[
					.33,
					"jc_nThr",
					E.inOutSine
				],
				[.42, "jc_nThr"],
				[
					.58,
					"jn_stance",
					E.inOut
				]
			],
			defl: .07,
			whiff: true,
			spin: [
				.21,
				.29,
				.5,
				Math.PI
			],
			react: "rx_over",
			hurt: "rx_over",
			zan: [
				.42,
				"jc_zan",
				.16
			],
			thrust: true
		});
		KD.jc_otoshi = kv("kaeshiHeavy", {
			keys: [
				[
					.035,
					"jc_oRaise",
					E.outCubic
				],
				[
					.075,
					"jc_oDrop",
					E.inQuad
				],
				[.1, "jc_oDrop"],
				[
					.17,
					"jc_oThr",
					E.outCubic
				],
				[.3, "jc_oThr"],
				[
					.55,
					"jn_stance",
					E.inOut
				]
			],
			defl: .07,
			ground: true,
			react: "rx_low",
			zan: [
				.32,
				"jc_zan",
				.18
			]
		});
		KD.jc_fin = kv("finisher", {
			keys: [
				[
					.05,
					"jc_f1a",
					E.outCubic
				],
				[
					.12,
					"jc_f1b",
					E.outCubic
				],
				[
					.24,
					"jc_f2",
					E.inOutSine
				],
				[
					.3,
					"jc_f3a",
					E.outCubic
				],
				[
					.38,
					"jc_f3b",
					E.inQuad
				],
				[.52, "jc_f3b"],
				[
					.76,
					"jn_stance",
					E.inOut
				]
			],
			zan: [
				.54,
				"jc_zan",
				.22
			],
			ev: finEv([
				"h",
				"u",
				"v"
			], [
				[.38, kShock],
				[.13, (f) => snd2.staff(f.pan, 1)],
				[.27, (f) => snd2.staff(f.pan, 1.2)]
			])
		});
		KD.mc_rip1 = kv("riposte", {
			keys: [
				[
					.05,
					"mc_rDefl",
					E.outCubic
				],
				[
					.13,
					"mc_rCut",
					E.inOutSine
				],
				[
					.22,
					"mc_rFol",
					E.outCubic
				],
				[
					.4,
					"mi_stance",
					E.inOut
				]
			],
			fan: (f, t) => t < .06 ? 0 : 1,
			fanB: 1,
			defl: .04,
			slide: [
				0,
				.05,
				.3,
				.95,
				"BF"
			],
			react: "rx_high",
			hurt: "rx_high",
			zan: [
				.24,
				"mc_zan",
				.16
			]
		});
		KD.mc_rip2 = kv("riposte", {
			keys: [
				[
					.05,
					"mc_r2Defl",
					E.outCubic
				],
				[
					.09,
					"mc_r2Up",
					E.outCubic
				],
				[
					.15,
					"mc_r2Str",
					E.inQuad
				],
				[.24, "mc_r2Str"],
				[
					.4,
					"mi_stance",
					E.inOut
				]
			],
			fan: (f, t) => t < .07 ? 1 : 0,
			fanB: .3,
			defl: .04,
			slide: [
				0,
				.05,
				.3,
				.9
			],
			react: "rx_low",
			zan: [
				.26,
				"mc_zan",
				.16
			]
		});
		KD.mc_harai = kv("sweep", {
			keys: [
				[
					.035,
					"mc_r2Defl",
					E.outCubic
				],
				[
					.09,
					"mc_hSpin",
					E.inOutSine
				],
				[
					.17,
					"mc_hCut",
					E.outCubic
				],
				[.28, "mc_hCut"],
				[
					.48,
					"mi_stance",
					E.inOut
				]
			],
			fan: 1,
			fanB: 1,
			spin: [
				.04,
				.13,
				1
			],
			defl: .03,
			react: "rx_off",
			zan: [
				.3,
				"mc_zan",
				.16
			],
			ev: [[.05, (f) => {
				snd2.fan(f.pan);
				petals(f, 6);
			}]]
		});
		KD.mc_nuki = kv("mawari", {
			keys: [
				[
					.07,
					"mc_nSpin",
					E.outCubic
				],
				[.19, "mc_nSpin"],
				[
					.25,
					"mc_nCh",
					E.inOutSine
				],
				[
					.33,
					"mc_nCut",
					E.inOutSine
				],
				[.42, "mc_nCut"],
				[
					.58,
					"mi_stance",
					E.inOut
				]
			],
			fan: 1,
			fanB: 1,
			spin: [
				.03,
				.21,
				.5
			],
			defl: .07,
			whiff: true,
			react: "rx_over",
			hurt: "rx_over",
			zan: [
				.42,
				"mc_zan",
				.16
			],
			ev: [[.08, (f) => petals(f, 8)]]
		});
		KD.mc_otoshi = kv("kaeshiHeavy", {
			keys: [
				[
					.035,
					"mc_oUp",
					E.outCubic
				],
				[
					.075,
					"mc_oDown",
					E.inQuad
				],
				[.1, "mc_oDown"],
				[
					.17,
					"mc_oRise",
					E.outCubic
				],
				[.3, "mc_oRise"],
				[
					.55,
					"mi_stance",
					E.inOut
				]
			],
			fan: 0,
			fanB: 0,
			defl: .07,
			ground: true,
			react: "rx_low",
			zan: [
				.32,
				"mc_zan",
				.18
			]
		});
		KD.mc_fin = kv("finisher", {
			keys: [
				[
					.05,
					"mc_f1a",
					E.outCubic
				],
				[
					.12,
					"mc_f1b",
					E.outCubic
				],
				[
					.24,
					"mc_f2",
					E.inOutSine
				],
				[
					.3,
					"mc_f3a",
					E.outCubic
				],
				[
					.38,
					"mc_f3b",
					E.inQuad
				],
				[.52, "mc_f3b"],
				[
					.76,
					"mi_stance",
					E.inOut
				]
			],
			fan: 1,
			fanB: 1,
			spin: [
				.13,
				.2,
				1
			],
			zan: [
				.54,
				"mc_zan",
				.22
			],
			ev: finEv([
				"h",
				"h",
				"v"
			], [[.14, (f) => petals(f, 10)], [.38, (f) => petals(f, 14)]])
		});
		KD.kc_rip1 = kv("riposte", {
			keys: [
				[
					.04,
					"kc_throw",
					E.outCubic
				],
				[
					.075,
					"kc_yank",
					E.outCubic
				],
				[
					.15,
					"kc_cut",
					E.inOutSine
				],
				[
					.24,
					"kc_fol",
					E.outCubic
				],
				[
					.4,
					"tr_stance",
					E.inOut
				]
			],
			wpath: (f, t, o) => pathWrap(f, t, [
				0,
				.035,
				.075,
				.13
			], o),
			defl: .035,
			wrap: true,
			react: "rx_over",
			zan: [
				.24,
				"kc_zan",
				.16
			],
			ev: [[.075, (f) => snd2.chain(f.pan, 1.3)]]
		});
		KD.kc_rip2 = kv("riposte", {
			keys: [
				[
					.05,
					"kc_hook",
					E.outCubic
				],
				[
					.085,
					"kc_pull",
					E.inQuad
				],
				[
					.15,
					"kc_rise",
					E.inOutSine
				],
				[.24, "kc_rise"],
				[
					.4,
					"tr_stance",
					E.inOut
				]
			],
			wpath: twirl(0, .3, 26, 24),
			defl: .045,
			slide: [
				0,
				.05,
				.4,
				1
			],
			react: "rx_low",
			zan: [
				.26,
				"kc_zan",
				.16
			]
		});
		KD.kc_harai = kv("sweep", {
			keys: [
				[
					.05,
					"kc_hThrow",
					E.outCubic
				],
				[
					.1,
					"kc_hPull",
					E.outCubic
				],
				[
					.17,
					"kc_hCut",
					E.outCubic
				],
				[.28, "kc_hCut"],
				[
					.48,
					"tr_stance",
					E.inOut
				]
			],
			wpath: (f, t, o) => pathAnkle(f, t, [
				0,
				.055,
				.11,
				.2
			], o),
			defl: .055,
			wrap: true,
			react: "rx_off",
			zan: [
				.3,
				"kc_zan",
				.16
			]
		});
		KD.kc_nuki = kv("mawari", {
			keys: [
				[
					.07,
					"kc_nDuck",
					E.outCubic
				],
				[.19, "kc_nDuck"],
				[
					.25,
					"kc_nCh",
					E.inOutSine
				],
				[
					.33,
					"kc_nCut",
					E.inOutSine
				],
				[.42, "kc_nCut"],
				[
					.58,
					"tr_stance",
					E.inOut
				]
			],
			wpath: twirl(.02, .34, 32, 26),
			spin: [
				.21,
				.29,
				.5,
				Math.PI
			],
			defl: .07,
			whiff: true,
			react: "rx_over",
			hurt: "rx_over",
			zan: [
				.42,
				"kc_zan",
				.16
			]
		});
		KD.kc_otoshi = kv("kaeshiHeavy", {
			keys: [
				[
					.035,
					"kc_oSw",
					E.outCubic
				],
				[
					.075,
					"kc_oDown",
					E.inQuad
				],
				[.1, "kc_oDown"],
				[
					.17,
					"kc_oRise",
					E.outCubic
				],
				[.3, "kc_oRise"],
				[
					.55,
					"tr_stance",
					E.inOut
				]
			],
			wpath: pathSmash,
			defl: .075,
			ground: true,
			react: "rx_low",
			zan: [
				.32,
				"kc_zan",
				.18
			],
			thrust: false
		});
		KD.kc_fin = kv("finisher", {
			keys: [
				[
					.05,
					"kc_f1a",
					E.outCubic
				],
				[
					.12,
					"kc_f1b",
					E.outCubic
				],
				[
					.24,
					"kc_f2",
					E.inOutSine
				],
				[
					.3,
					"kc_f3a",
					E.outCubic
				],
				[
					.38,
					"kc_f3b",
					E.inQuad
				],
				[.52, "kc_f3b"],
				[
					.76,
					"tr_stance",
					E.inOut
				]
			],
			wpath: (f, t, o) => pathWrap(f, t, [
				0,
				.04,
				.09,
				.15
			], o) || (t > .22 && t < .4 ? pathTwirl(f, t, 36, 28, o) : null),
			zan: [
				.54,
				"kc_zan",
				.22
			],
			ev: finEv([
				"h",
				"u",
				"v"
			], [[.04, (f) => snd2.chainThrow(f.pan)], [.24, (f) => snd2.chain(f.pan, 1.2)]])
		});
		KD.tc_rip1 = kv("riposte", {
			keys: [
				[
					.05,
					"tc_catch",
					E.outCubic
				],
				[
					.13,
					"tc_stab",
					E.outCubic
				],
				[
					.22,
					"tc_fol",
					E.outCubic
				],
				[
					.4,
					"stance",
					E.inOut
				]
			],
			thrust: true,
			defl: .045,
			slide: [
				0,
				.05,
				.2,
				.8,
				"B"
			],
			react: "rx_high",
			hurt: "rx_high",
			zan: [
				.24,
				"tc_zan",
				.16
			]
		});
		KD.tc_rip2 = kv("riposte", {
			keys: [
				[
					.05,
					"tc_up",
					E.outCubic
				],
				[
					.14,
					"tc_down",
					E.inOutSine
				],
				[.24, "tc_down"],
				[
					.4,
					"stance",
					E.inOut
				]
			],
			defl: .045,
			slide: [
				0,
				.05,
				.3,
				.9
			],
			react: "rx_high",
			zan: [
				.26,
				"tc_zan",
				.16
			]
		});
		KD.tc_harai = kv("sweep", {
			keys: [
				[
					.035,
					"tc_catch",
					E.outCubic
				],
				[
					.09,
					"tc_hSpin",
					E.inOutSine
				],
				[
					.17,
					"tc_hCut",
					E.outCubic
				],
				[.28, "tc_hCut"],
				[
					.48,
					"stance",
					E.inOut
				]
			],
			spin: [
				.04,
				.13,
				1
			],
			defl: .03,
			slide: [
				0,
				.035,
				.2,
				.8,
				"B"
			],
			react: "rx_off",
			zan: [
				.3,
				"tc_zan",
				.16
			]
		});
		KD.tc_nuki = kv("mawari", {
			keys: [
				[
					.05,
					"tc_tuck",
					E.outCubic
				],
				[.19, "tc_tuck"],
				[
					.25,
					"tc_zan",
					E.inOutSine
				],
				[
					.33,
					"tc_nStab",
					E.inOutSine
				],
				[.42, "tc_nStab"],
				[
					.58,
					"stance",
					E.inOut
				]
			],
			rollT: [.04, .19],
			spin: [
				.21,
				.29,
				.5,
				Math.PI
			],
			thrust: true,
			defl: .07,
			whiff: true,
			react: "rx_over",
			hurt: "rx_over",
			zan: [
				.42,
				"tc_zan",
				.16
			]
		});
		KD.tc_otoshi = kv("kaeshiHeavy", {
			keys: [
				[
					.035,
					"tc_up",
					E.outCubic
				],
				[
					.075,
					"tc_oX",
					E.inQuad
				],
				[.1, "tc_oX"],
				[
					.17,
					"tc_oRise",
					E.outCubic
				],
				[.3, "tc_oRise"],
				[
					.55,
					"stance",
					E.inOut
				]
			],
			defl: .07,
			ground: true,
			react: "rx_low",
			zan: [
				.32,
				"tc_zan",
				.18
			]
		});
		KD.tc_fin = kv("finisher", {
			keys: [
				[
					.05,
					"tc_up",
					E.outCubic
				],
				[
					.12,
					"tc_f1",
					E.inOutSine
				],
				[
					.21,
					"tc_f2",
					E.inOutSine
				],
				[
					.3,
					"tc_f3a",
					E.outCubic
				],
				[
					.39,
					"tc_f3b",
					E.inOutSine
				],
				[.52, "tc_f3b"],
				[
					.76,
					"stance",
					E.inOut
				]
			],
			spin: [
				.13,
				.2,
				1
			],
			zan: [
				.54,
				"tc_zan",
				.22
			],
			ev: finEv([
				"d",
				"u",
				"u"
			]),
			tick(f, dt, t, o) {
				if (t > .02 && t < .36) chase(f, o, 72, 520);
			}
		});
		KD.nc_rip1 = kv("riposte", {
			keys: [
				[
					.05,
					"nc_shaft",
					E.outCubic
				],
				[
					.14,
					"nc_sweep",
					E.inOutSine
				],
				[
					.23,
					"nc_fol",
					E.outCubic
				],
				[
					.4,
					"stance",
					E.inOut
				]
			],
			defl: .04,
			slide: [
				0,
				.05,
				.05,
				.35
			],
			react: "rx_high",
			hurt: "rx_high",
			zan: [
				.25,
				"nc_zan",
				.16
			]
		});
		KD.nc_rip2 = kv("riposte", {
			keys: [
				[
					.05,
					"nc_butt",
					E.outCubic
				],
				[
					.14,
					"nc_rise",
					E.inOutSine
				],
				[
					.23,
					"nc_rFol",
					E.outCubic
				],
				[
					.4,
					"stance",
					E.inOut
				]
			],
			defl: .045,
			slide: [
				0,
				.05,
				.3,
				1,
				"P"
			],
			react: "rx_off",
			zan: [
				.25,
				"nc_zan",
				.16
			]
		});
		KD.nc_harai = kv("sweep", {
			keys: [
				[
					.04,
					"nc_hBeat",
					E.outCubic
				],
				[
					.09,
					"nc_hCh",
					E.inOutSine
				],
				[
					.17,
					"nc_hCut",
					E.outCubic
				],
				[.28, "nc_hCut"],
				[
					.48,
					"stance",
					E.inOut
				]
			],
			defl: .035,
			slide: [
				0,
				.04,
				.08,
				.4
			],
			react: "rx_off",
			zan: [
				.3,
				"nc_zan",
				.16
			]
		});
		KD.nc_nuki = kv("mawari", {
			keys: [
				[
					.07,
					"nc_nSpin",
					E.outCubic
				],
				[.19, "nc_nSpin"],
				[
					.25,
					"nc_nCh",
					E.inOutSine
				],
				[
					.33,
					"nc_nCut",
					E.inOutSine
				],
				[.42, "nc_nCut"],
				[
					.58,
					"stance",
					E.inOut
				]
			],
			spin: [
				.03,
				.21,
				.5
			],
			defl: .07,
			whiff: true,
			react: "rx_over",
			hurt: "rx_over",
			zan: [
				.42,
				"nc_zan",
				.16
			]
		});
		KD.nc_otoshi = kv("kaeshiHeavy", {
			keys: [
				[
					.035,
					"nc_oUp",
					E.outCubic
				],
				[
					.075,
					"nc_oDown",
					E.inQuad
				],
				[.1, "nc_oDown"],
				[
					.17,
					"nc_oRise",
					E.outCubic
				],
				[.3, "nc_oRise"],
				[
					.55,
					"stance",
					E.inOut
				]
			],
			defl: .07,
			ground: true,
			react: "rx_low",
			zan: [
				.32,
				"nc_zan",
				.18
			],
			thrust: false
		});
		KD.nc_fin = kv("finisher", {
			keys: [
				[
					.05,
					"nc_f1a",
					E.outCubic
				],
				[
					.12,
					"nc_f1b",
					E.outCubic
				],
				[
					.24,
					"nc_f2",
					E.inOutSine
				],
				[
					.3,
					"nc_f3a",
					E.outCubic
				],
				[
					.38,
					"nc_f3b",
					E.inQuad
				],
				[.52, "nc_f3b"],
				[
					.76,
					"stance",
					E.inOut
				]
			],
			zan: [
				.54,
				"nc_zan",
				.22
			],
			ev: finEv([
				"h",
				"u",
				"v"
			], [[.38, kShock]])
		});
		for (const k of [
			"riposte",
			"riposte2",
			"riposte3",
			"riposte4"
		]) {
			const b = ATK[k], S = b.slide;
			KD["nd_" + k] = kv(k, {
				keys: b.keys,
				hurt: b.hurt,
				slide: S && [
					S[0],
					S[1] + .02,
					Math.max(.1, S[2] - .1),
					Math.min(1, S[3] + .15)
				],
				ev: [[b.active[0], kArc(k === "riposte2" ? "u" : k === "riposte3" || k === "riposte4" ? "h" : "d", true)]]
			});
		}
		const FAMG = {
			bo: {
				st: "jn_stance",
				o: { grip: 1 },
				zan: "jc_zan",
				snd: (f) => snd2.staff(f.pan, .9)
			},
			tessen: {
				st: "mi_stance",
				o: {
					grip: 0,
					gx: -26,
					gy: -26
				},
				zan: "mc_zan",
				x: {
					fan: 1,
					fanB: 1
				},
				snd: (f) => {
					snd2.fan(f.pan);
					petals(f, 6);
				}
			},
			kusarigama: {
				st: "tr_stance",
				o: {
					grip: 0,
					gx: -24,
					gy: 22
				},
				zan: "kc_zan",
				snd: (f) => snd2.chain(f.pan, 1)
			},
			twin: {
				st: "stance",
				o: {
					gx: -2,
					gy: 24
				},
				zan: "tc_zan"
			},
			naginata: {
				st: "stance",
				o: {},
				zan: "nc_zan"
			}
		};
		const FPC = new Map();
		const famPose = (p, fam) => {
			let m = FPC.get(p);
			if (!m) FPC.set(p, m = {});
			return m[fam] || (m[fam] = Object.assign({}, p, FAMG[fam].o));
		};
		const refit = (src, base, fam, fd, extra) => {
			const A = ATK[src], F = FAMG[fam], n = A.keys.length;
			const keys = A.keys.map(([t, p, e], i) => [
				t,
				i === n - 1 ? PO[F.st] : famPose(p, fam),
				e
			]);
			const ev = F.snd ? [[A.active[0] - .01, F.snd]] : null;
			return kv(base, Object.assign({
				keys,
				defl: A.defl,
				slide: A.slide,
				spin: A.spin,
				whiff: A.whiff,
				ground: A.ground,
				thrust: A.thrust,
				react: A.react,
				hurt: A.hurt,
				zan: [
					A.zan[0],
					F.zan,
					A.zan[2]
				],
				fd,
				ev
			}, F.x, extra));
		};
		for (const [fam, p] of [
			["bo", "jc"],
			["tessen", "mc"],
			["kusarigama", "kc"],
			["twin", "tc"],
			["naginata", "nc"]
		]) {
			const ch = fam === "kusarigama" ? { wpath: twirl(.02, .45, 26, 24) } : null;
			KD[p + "_harai2"] = refit("sweep2", "sweep", fam, "down", ch);
			KD[p + "_nuki2"] = refit("mawari2", "mawari", fam, "side", ch);
			KD[p + "_otoshi2"] = refit("kaeshiHeavy2", "kaeshiHeavy", fam, "up");
		}
		for (const [k, d] of [
			["jc_rip1", "up"],
			["jc_rip2", "down"],
			["jc_harai", "side"],
			["jc_nuki", "up"],
			["jc_otoshi", "down"],
			["mc_rip1", "up"],
			["mc_rip2", "down"],
			["mc_harai", "side"],
			["mc_nuki", "up"],
			["mc_otoshi", "down"],
			["kc_rip1", "side"],
			["kc_rip2", "down"],
			["kc_harai", "side"],
			["kc_nuki", "up"],
			["kc_otoshi", "down"],
			["tc_rip1", "side"],
			["tc_rip2", "up"],
			["tc_harai", "side"],
			["tc_nuki", "up"],
			["tc_otoshi", "down"],
			["nc_rip1", "up"],
			["nc_rip2", "down"],
			["nc_harai", "side"],
			["nc_nuki", "up"],
			["nc_otoshi", "down"]
		]) KD[k].fd = d;
		ATK.finisher.ev = finEv([
			"u",
			"d",
			"v"
		], [[.38, kShock]]);
		for (const k in KD) {
			const a = KD[k];
			a.keys = a.keys.map(([t, p, e]) => [
				t,
				typeof p === "string" ? PO[p] || PO.stance : p,
				e
			]);
			a.dur = a.keys[a.keys.length - 1][0];
			ATK[k] = a;
		}
		const fam2 = (p) => ({
			riposte: [p + "_rip1", p + "_rip2"],
			sweep: [p + "_harai", p + "_harai2"],
			mawari: [p + "_nuki", p + "_nuki2"],
			kaeshiHeavy: [p + "_otoshi", p + "_otoshi2"],
			finisher: [p + "_fin"]
		});
		Object.assign(KA.sets, {
			nodachi: { riposte: [
				"nd_riposte",
				"nd_riposte2",
				"nd_riposte3",
				"nd_riposte4"
			] },
			bo: fam2("jc"),
			tessen: fam2("mc"),
			kusarigama: fam2("kc"),
			twin: fam2("tc"),
			naginata: fam2("nc")
		});
		const DF = ND.DEFL;
		if (DF) {
			const dv = DF.mk, K = DF.K, as = (id, v) => Object.assign({}, v, { id });
			const kinds = (u, s, d) => ({
				high: [u, s],
				mid: [
					s,
					u,
					d
				],
				low: [d, s],
				thrust: [s, d],
				air: [u, s]
			});
			const set = (list, u, s, d) => {
				const v = {};
				for (const x of list) v[x.id] = x;
				return {
					v,
					kinds: kinds(u, s, d)
				};
			};
			Object.assign(DF.sets, {
				bo: set([
					dv("bo_age", "up", "P", .2, .9, {
						ax: -4,
						ay: 2,
						sw: .2
					}, {
						hx: 2,
						hy: -5,
						lean: -.08,
						hd: -.24,
						ax: -10,
						ay: -42,
						sw: -1.58,
						f1x: 2
					}, {
						hy: -4,
						lean: -.05,
						hd: -.16,
						ax: -8,
						ay: -34,
						sw: -1.42
					}),
					dv("bo_uchi", "side", "P", .2, .9, {
						ax: -6,
						ay: -4,
						sw: .22
					}, {
						hx: 6,
						hy: 2,
						lean: .16,
						hd: .06,
						ax: 12,
						ay: 4,
						sw: -1.2,
						f1x: 8
					}, {
						hx: 4,
						lean: .12,
						ax: 8,
						ay: 2,
						sw: -1.05
					}),
					as("bo_otoshi", K.otoshi)
				], "bo_age", "bo_uchi", "bo_otoshi"),
				tessen: set([
					dv("fan_age", "up", "BF", .1, .9, {
						gx: 4,
						gy: 2
					}, {
						hy: -4,
						lean: -.06,
						hd: -.2,
						ax: -10,
						ay: 16,
						sw: 1.7,
						gx: 16,
						gy: -58
					}, {
						hy: -3,
						lean: -.04,
						hd: -.14,
						ax: -8,
						ay: 14,
						sw: 1.6,
						gx: 12,
						gy: -50
					}),
					dv("fan_mai", "side", null, .2, .9, {
						ax: -4,
						sw: -.2,
						gx: 4
					}, {
						hx: 6,
						lean: .12,
						ax: 16,
						ay: 6,
						sw: 1.2,
						gx: -40,
						gy: -24
					}, {
						hx: 4,
						lean: .1,
						ax: 12,
						ay: 6,
						sw: 1.1,
						gx: -36,
						gy: -22
					}),
					dv("fan_otoshi", "down", null, .2, .9, {
						ay: -6,
						sw: -.2
					}, {
						hx: 4,
						hy: 8,
						lean: .26,
						hd: .1,
						ax: 14,
						ay: 30,
						sw: 1.9,
						gx: -10,
						gy: 6
					}, {
						hx: 3,
						hy: 6,
						lean: .22,
						ax: 12,
						ay: 30,
						sw: 2
					})
				], "fan_age", "fan_mai", "fan_otoshi"),
				kusarigama: set([
					dv("kc_taut", "up", "C", .3, .7, {
						gx: -6,
						gy: -4
					}, {
						hy: -5,
						lean: -.06,
						hd: -.22,
						ax: 6,
						ay: -40,
						sw: .35,
						gx: -36,
						gy: -46
					}, {
						hy: -4,
						lean: -.04,
						hd: -.16,
						ax: 6,
						ay: -34,
						sw: .3,
						gx: -32,
						gy: -40
					}),
					dv("kc_bat", "side", "C", .6, 1, {
						gx: -10,
						gy: 6
					}, {
						hx: 6,
						lean: .14,
						ax: -10,
						ay: 12,
						sw: -.2,
						gx: 42,
						gy: -26
					}, {
						hx: 4,
						lean: .1,
						ax: -8,
						ay: 10,
						sw: -.15,
						gx: 36,
						gy: -20
					}),
					dv("kc_hook", "down", null, .2, .9, {
						ay: -8,
						sw: .2
					}, {
						hx: 4,
						hy: 8,
						lean: .24,
						hd: .1,
						ax: 12,
						ay: 30,
						sw: 1.9,
						gx: -6
					}, {
						hx: 3,
						hy: 6,
						lean: .2,
						ax: 10,
						ay: 30,
						sw: 2
					})
				], "kc_taut", "kc_bat", "kc_hook"),
				twin: set([
					dv("tw_cross", "up", "B", .2, .9, {
						gx: 10,
						gy: -10
					}, {
						hy: -4,
						lean: -.08,
						hd: -.22,
						ax: -4,
						ay: -32,
						sw: .5,
						gx: 36,
						gy: -64
					}, {
						hy: -3,
						lean: -.05,
						hd: -.15,
						ax: -2,
						ay: -26,
						sw: .4,
						gx: 32,
						gy: -56
					}),
					dv("tw_flick", "side", null, .2, .8, {
						hx: -2,
						ax: -6,
						ay: 2,
						sw: -.24,
						gx: 8
					}, {
						hx: 8,
						hy: 1,
						lean: .14,
						hd: -.04,
						ax: 18,
						ay: -8,
						sw: 1.08,
						f1x: 8,
						f2x: 2,
						gx: 30,
						gy: -40
					}, {
						hx: 6,
						lean: .1,
						ax: 14,
						ay: -4,
						sw: 1.18,
						f1x: 6,
						gx: 26,
						gy: -34
					}),
					dv("tw_catch", "down", "B", .2, .9, {
						gx: 16,
						gy: -16
					}, {
						hx: 4,
						hy: 6,
						lean: .22,
						hd: .1,
						ax: -12,
						ay: 18,
						sw: 2.2,
						gx: 44,
						gy: -18
					}, {
						hx: 3,
						hy: 5,
						lean: .18,
						ax: -10,
						ay: 18,
						sw: 2.2,
						gx: 40,
						gy: -14
					})
				], "tw_cross", "tw_flick", "tw_catch"),
				naginata: set([
					dv("nc_age", "up", null, .05, .35, {
						ax: -2,
						ay: 4,
						sw: .15
					}, {
						hy: -5,
						lean: -.08,
						hd: -.22,
						ax: -6,
						ay: -36,
						sw: -.9,
						f1x: 2
					}, {
						hy: -4,
						lean: -.05,
						hd: -.15,
						ax: -4,
						ay: -28,
						sw: -.75
					}),
					dv("nc_ishi", "side", "P", .2, 1, {
						ax: -4,
						sw: .2
					}, {
						hx: 6,
						hy: 2,
						lean: .16,
						hd: .06,
						ax: 12,
						ay: 4,
						sw: -1.17,
						f1x: 8
					}, {
						hx: 4,
						lean: .12,
						ax: 8,
						ay: 2,
						sw: -1
					}),
					dv("nc_otoshi", "down", null, .1, .4, {
						hy: -3,
						ax: -6,
						ay: -8,
						sw: -.32
					}, {
						hx: 6,
						hy: 9,
						lean: .28,
						hd: .08,
						ax: 16,
						ay: 22,
						sw: 1.7,
						f1x: 8,
						f2x: -2
					}, {
						hx: 4,
						hy: 7,
						lean: .24,
						hd: .06,
						ax: 12,
						ay: 24,
						sw: 1.82
					})
				], "nc_age", "nc_ishi", "nc_otoshi")
			});
		}
		const K0 = KA.snd.katana;
		const tok = (pan, p = 1) => {
			au.tone({
				freq: 310,
				freq1: 170,
				dur: .1,
				gain: .3 * p,
				type: "triangle",
				send: .2,
				pan
			});
			au.noise({
				type: "bandpass",
				f0: 950,
				q: 2,
				dur: .06,
				gain: .26 * p,
				send: .15,
				pan
			});
		};
		const knock = (f, pan, p = 1) => au.bo?.block?.(p, pan, !!(f && f.opp && f.opp.ch && !f.opp.ch.blunt)) || tok(pan, p);
		Object.assign(KA.snd, {
			bo(f, k, pan) {
				if (k === "clang" || k === "wrap") {
					knock(f, pan);
					snd2.staff(pan, .5);
					return;
				}
				if (k === "ground") {
					au.bo?.block?.(1.3, pan, false, .85) || tok(pan, 1.3);
					au.thud(1, pan);
					return;
				}
				if (k === "whiff") {
					snd2.staff(pan, .9);
					return;
				}
				if (k === "zan") {
					snd2.staff(pan, .35);
					au.bo?.block?.(.35, pan, false) || tok(pan, .35);
					return;
				}
				K0(f, k, pan);
			},
			tessen(f, k, pan) {
				if (k === "clang" || k === "wrap") {
					snd2.fan(pan);
					au.clang(.4, pan, 1.9);
					return;
				}
				if (k === "ground") {
					au.clang(.9, pan, 1.1);
					au.thud(.6, pan);
					return;
				}
				if (k === "whiff" || k === "zan") {
					snd2.fan(pan);
					if (k === "whiff") au.swoosh(.6, pan);
					return;
				}
				K0(f, k, pan);
			},
			kusarigama(f, k, pan) {
				if (k === "wrap") {
					snd2.chainThrow(pan);
					snd2.chain(pan, 1.4);
					au.clang(.3, pan, 1.8);
					return;
				}
				if (k === "clang") {
					au.clang(.5, pan, 1.6);
					snd2.chain(pan, .8);
					return;
				}
				if (k === "ground") {
					au.clang(.9, pan, .8);
					au.thud(.9, pan);
					snd2.chain(pan, 1.2);
					return;
				}
				if (k === "whiff") {
					au.swoosh(.7, pan);
					snd2.chain(pan, .6);
					return;
				}
				if (k === "zan") {
					snd2.chain(pan, .6);
					return;
				}
				K0(f, k, pan);
			},
			twin(f, k, pan) {
				if (k === "clang" || k === "wrap") {
					au.clang(.42, pan, 2);
					au.tone({
						freq: 3500,
						freq1: 3300,
						dur: .3,
						gain: .05,
						type: "triangle",
						send: .4,
						pan,
						delay: .055
					});
					return;
				}
				K0(f, k, pan);
			},
			naginata(f, k, pan) {
				if (k === "clang" || k === "wrap") {
					tok(pan, .8);
					au.clang(.35, pan, 1.3);
					return;
				}
				if (k === "ground") {
					tok(pan, 1.1);
					au.thud(1, pan);
					au.clang(.7, pan, .9);
					return;
				}
				K0(f, k, pan);
			}
		});
	}
	ND.SPECIALS = {
		akane: {
			atk: "sp_akane",
			name: "Kurenai Issen",
			kanji: "紅一閃",
			desc: "Göz açıp kapayıncaya dek rakibin içinden geçen kızıl iai kesiği; havada alevli bir hilal bırakır.",
			tip: "Savuşturma ya da yana atılma",
			range: [90, 520]
		},
		aoi: {
			atk: "sp_aoi",
			name: "Kaze no Ha",
			kanji: "風の刃",
			desc: "Geniş bir savuruşla ileri uçan rüzgâr bıçağı fırlatır; tam zamanında gard onu geri yansıtır.",
			tip: "Zıpla, kılıçla kes ya da tam zamanında gard al",
			range: [170, 680]
		},
		kuro: {
			atk: "sp_kuro",
			name: "Yama Kudaki",
			kanji: "山砕き",
			desc: "Havaya sıçrayıp nodachi ile yeri yarar; zeminde ilerleyen şok dalgası gardı ezer ve yere serer.",
			tip: "Dalgayı zıplayarak atla, havadayken vur",
			range: [140, 440]
		},
		yuki: {
			atk: "sp_yuki",
			name: "Fubuki",
			kanji: "吹雪",
			desc: "Kar fırtınası gibi beş vuruşluk şimşek hızında seri; son vuruş yere serer.",
			tip: "Gard al, ilk vuruşu savuştur",
			range: [60, 250]
		},
		hana: {
			atk: "sp_hana",
			name: "Hanafubuki",
			kanji: "花吹雪",
			desc: "İkiz tantōlarla dönen bir kiraz kasırgasına dönüşüp ilerler; iki yanı da keser.",
			tip: "Gard al ya da geri atıl",
			range: [40, 230]
		},
		tetsu: {
			atk: "sp_tetsu",
			name: "Tetsu no Uzu",
			kanji: "鉄の渦",
			desc: "Naginatayı çevresinde döndürür; dönüş boyunca darbeler onu durduramaz (süper zırh).",
			tip: "Menzilden çık ya da savuştur",
			range: [0, 230]
		},
		ren: {
			atk: "sp_ren",
			name: "Oni no Ikari",
			kanji: "鬼の怒り",
			desc: "Omuz hücumuyla gardı parçalar, ardından yükselen kesikle rakibi havaya fırlatır.",
			tip: "Gard işe yaramaz: savuştur, zıpla ya da atıl",
			range: [80, 470]
		},
		kage: {
			atk: "sp_kage",
			name: "Kage Bunshin",
			kanji: "影分身",
			desc: "Dumanla kaybolur, geride gölge klonu bırakır ve rakibin arkasında belirip keser.",
			tip: "Belirdiği an gard al",
			range: [60, 620]
		},
		tora: {
			atk: "sp_tora",
			name: "Kusari Tatsumaki",
			kanji: "鎖竜巻",
			desc: "Zinciri başının üstünde döndürüp çevresini biçen bir kasırgaya çevirir; yakaladığı rakibi çekip orakla havaya savurur.",
			tip: "Menzilden çık ya da gard al: yakalanmazsan çekiş boşa gider",
			range: [0, 260]
		},
		jin: {
			atk: "sp_jin",
			name: "Kongō Rinbu",
			kanji: "金剛輪舞",
			desc: "Asayı elmas bir çark gibi döndürerek ilerler; dört darbenin ardından yükselen vuruşla rakibi havaya fırlatır.",
			tip: "Geri atıl ya da ilk darbeyi savuştur",
			range: [0, 230]
		},
		mai: {
			atk: "sp_mai",
			name: "Senpū no Mai",
			kanji: "旋風の舞",
			desc: "Dönerek bir kasırga doğurur; kasırga ilerlerken rakibi içine çeker, keser ve sonunda havaya savurur.",
			tip: "Kasırgaya tam zamanında gard al ya da geri çekil: yavaş ilerler",
			range: [60, 520]
		},
		tsubame: {
			atk: "sp_tsubame",
			name: "Tsubame Gaeshi",
			kanji: "燕返し",
			desc: "Geriye sıçrayıp göğe ok yağdırır, ardından ıskalarsa geri dönüp arkadan vuran kırlangıç okunu salar.",
			tip: "Yerdeki işaretlerden çekil; kırlangıç oku geri döner, arkanı kolla",
			range: [160, 760]
		},
		shura: {
			atk: "sp_shura",
			name: "Ashura Rasetsu",
			kanji: "阿修羅",
			desc: "Kükreyip kızıl dumana karışır; rakibin önünde ve arkasında belirerek üç ağır nodachi kesiği indirir, sonuncusu havaya fırlatır.",
			tip: "Kızıl parıltıyı izle: kesiği savuşturmak tekniği bitirir; gard dengeyi ezer",
			range: [50, 600]
		}
	};
	{
		const eo = E.outCubic, eq = E.outQuart, es = E.inOutSine, ei2 = E.inOut, eqd = E.inQuad;
		const reg = (name, d) => {
			d.keys = d.keys.map(([t, p, e]) => [
				t,
				typeof p === "string" ? PO[p] || PO.stance : p,
				e
			]);
			d.dur = d.keys[d.keys.length - 1][0];
			ATK[name] = d;
			return d;
		};
		const ghostTick = (t0, t1, life = .26) => (f, dt, t) => {
			if (t > t0 && t < t1 && (t * 60 | 0) % 2 === 0) f.addGhost(life);
		};
		const puff = (f, x, y, n = 12) => burst(n, () => {
			const a = rand(0, TAU), sp = rand(40, 200);
			return {
				k: "smoke",
				x: x + rand(-16, 16),
				y: y - rand(10, 150),
				vx: Math.cos(a) * sp,
				vy: Math.sin(a) * sp * .5 - 30,
				drag: 3,
				life: rand(.45, .8),
				sz: rand(9, 16),
				grow: 1.3,
				c: Math.random() < .7 ? "26,30,34" : "48,56,60",
				a: .7
			};
		});
		const windLine = (f, n = 8) => burst(n, () => ({
			k: "streak",
			x: f.x + f.dir * rand(0, 90),
			y: f.y - rand(50, 150),
			vx: f.dir * rand(300, 700),
			vy: rand(-40, 40),
			life: .22,
			sz: 1.2,
			c: "200,230,255",
			add: true,
			rot: 0,
			vr: 0
		}));
		const A_CHASE = reg("chase", {
			keys: [
				[
					.1,
					"jump",
					eo
				],
				[
					.17,
					"as1a",
					eo
				],
				[
					.24,
					"as1b",
					eq
				],
				[.46, "fall"]
			],
			active: [.17, .27],
			dmg: 8,
			post: 10,
			kb: 140,
			stun: .4,
			sw: .16,
			pw: 1,
			kind: "blade",
			air: true,
			chain: [.22, .46],
			tick(f, dt, t, o) {
				const m = f.mem;
				if (!m.cj) {
					m.cj = 1;
					f.onGround = false;
					f.vy = -700;
					fx.dust(f.x, 0, 6, .8);
					au.swoosh(.7, f.pan);
				}
				if (t < .2 && o) {
					const tx = o.x - f.dir * 62, ty = Math.min(-30, o.y + 34);
					f.vx = clamp((tx - f.x) * 9, -1100, 1100);
					f.vy = clamp((ty - f.y) * 9, -1500, 500);
				}
			}
		});
		reg("chaseEnd", {
			keys: [
				[
					.06,
					"as1a",
					eo
				],
				[
					.13,
					"plunge",
					eq
				],
				[.36, "fall"]
			],
			active: [.07, .17],
			dmg: 10,
			post: 12,
			kb: 60,
			stun: .4,
			sw: .06,
			pw: 1.3,
			kind: "blade",
			air: true,
			spike: true,
			tick(f, dt, t, o) {
				if (t < .12) {
					f.vy = Math.min(f.vy, 60);
					if (o) f.vx = clamp((o.x - f.dir * 58 - f.x) * 6, -500, 500);
				}
			},
			onHit(f, o, x, y) {
				cam.punch(6);
				fx.ring(x, y, "255,236,190", 70);
			}
		});
		void A_CHASE;
		const FAM = {
			katana: {
				fl: ["ks_makiA", "ks_tsuki"],
				bl: [
					"ks_h2Beat",
					"ks_h2Kneel",
					"ks_h2Cut"
				],
				up: [
					"ks_uraA",
					"ks_uraB",
					"ks_uraC"
				],
				bh: [
					"ks_o2Raise",
					"ks_o2Up",
					"ks_o2Men"
				],
				dh: ["ks_n2Spin", "ks_n2Cut"],
				s1: [
					"ks_f1a",
					"ks_f1b",
					"ks_f3a",
					"ks_f3b"
				],
				s2: [
					"ks_oRaise",
					"ks_oDrop",
					"ks_oThrust"
				]
			},
			kodachi: {
				fl: ["kd_in2", "kd_stab"],
				bl: [
					"ks_hBeat",
					"ks_hDip",
					"ks_hCut"
				],
				up: [
					"kd_in",
					"ks_uraB",
					"ks_uraC"
				],
				bh: [
					"ks_o2Raise",
					"ks_o2Up",
					"ks_o2Men"
				],
				dh: ["ks_nPivot", "ks_nCutF"],
				s1: [
					"kd_in",
					"kd_cut",
					"ks_f3a",
					"ks_f3b"
				],
				s2: [
					"ks_oRaise",
					"ks_oDrop",
					"kd_stab"
				]
			},
			twin: {
				fl: ["tc_catch", "tc_stab"],
				bl: [
					"tc_catch",
					"tc_hSpin",
					"tc_hCut"
				],
				up: [
					"tc_up",
					"tc_f1",
					"tc_oRise"
				],
				bh: [
					"tc_up",
					"tc_f3a",
					"tc_f3b"
				],
				dh: ["tc_hSpin", "tc_nStab"],
				s1: [
					"tc_f1",
					"tc_f2",
					"tc_f3a",
					"tc_f3b"
				],
				s2: [
					"tc_up",
					"tc_oX",
					"tc_oRise"
				]
			},
			naginata: {
				fl: ["nc_butt", "nc_rFol"],
				bl: [
					"nc_hBeat",
					"nc_hCh",
					"nc_hCut"
				],
				up: [
					"nc_oDown",
					"nc_rise",
					"nc_oRise"
				],
				bh: [
					"nc_f3a",
					"nc_f3a",
					"nc_f3b"
				],
				dh: ["nc_nSpin", "nc_nCut"],
				s1: [
					"nc_f1a",
					"nc_f1b",
					"nc_f3a",
					"nc_f3b"
				],
				s2: [
					"nc_oUp",
					"nc_oDown",
					"nc_oRise"
				]
			},
			bo: {
				fl: ["jc_tip", "jc_tipF"],
				bl: [
					"jc_hBeat",
					"jc_hMid",
					"jc_hSweep"
				],
				up: [
					"jc_low",
					"jc_f1a",
					"jc_f1b"
				],
				bh: [
					"jc_oRaise",
					"jc_f3a",
					"jc_f3b"
				],
				dh: ["jc_nCh", "jc_nThr"],
				s1: [
					"jc_f1a",
					"jc_f1b",
					"jc_f3a",
					"jc_f3b"
				],
				s2: [
					"jc_oRaise",
					"jc_oDrop",
					"jc_oThr"
				]
			},
			tessen: {
				fl: ["mc_r2Up", "mc_r2Str"],
				bl: [
					"mc_r2Defl",
					"mc_hSpin",
					"mc_hCut"
				],
				up: [
					"mc_oDown",
					"mc_oRise",
					"mc_f1b"
				],
				bh: [
					"mc_oUp",
					"mc_f3a",
					"mc_f3b"
				],
				dh: ["mc_nSpin", "mc_nCut"],
				s1: [
					"mc_f1a",
					"mc_f1b",
					"mc_f3a",
					"mc_f3b"
				],
				s2: [
					"mc_oUp",
					"mc_oDown",
					"mc_oRise"
				],
				fan: 1
			},
			kusarigama: {
				fl: ["kc_hook", "kc_cut"],
				bl: [
					"kc_hThrow",
					"kc_hPull",
					"kc_hCut"
				],
				up: [
					"kc_pull",
					"kc_rise",
					"kc_rise"
				],
				bh: [
					"kc_oSw",
					"kc_f3a",
					"kc_f3b"
				],
				dh: ["kc_nCh", "kc_nCut"],
				s1: [
					"kc_f1a",
					"kc_f1b",
					"kc_f3a",
					"kc_f3b"
				],
				s2: [
					"kc_oSw",
					"kc_oDown",
					"kc_oRise"
				]
			}
		};
		function famKit(p, F, st, x) {
			x = x || {};
			const fan = F.fan ? {
				fan: 1,
				fanB: 1
			} : null, blunt = x.blunt ? { blunt: true } : null;
			const mk = (o) => Object.assign(o, fan, blunt);
			reg(p + "_fl", mk({
				keys: [
					[
						.07,
						F.fl[0],
						eo
					],
					[
						.15,
						F.fl[1],
						eq
					],
					[.26, F.fl[1]],
					[
						.46,
						st,
						ei2
					]
				],
				active: [.1, .18],
				dmg: 9,
				post: 14,
				kb: 260,
				stun: .38,
				lunge: [
					.04,
					.16,
					560
				],
				chain: [.2, .46],
				sw: .08,
				pw: 1,
				kind: "blade",
				thrust: true,
				reach: 250
			}));
			reg(p + "_bl", mk({
				keys: [
					[
						.06,
						F.bl[0],
						eo
					],
					[
						.12,
						F.bl[1],
						es
					],
					[
						.2,
						F.bl[2],
						eo
					],
					[.3, F.bl[2]],
					[
						.54,
						st,
						ei2
					]
				],
				active: [.13, .22],
				dmg: 8,
				post: 16,
				kb: 220,
				stun: .4,
				knock: true,
				trip: true,
				lunge: [
					0,
					.08,
					-300
				],
				lunge2: [
					.1,
					.19,
					360
				],
				sw: .11,
				pw: .9,
				kind: "blade"
			}));
			reg(p + "_up", mk({
				keys: [
					[
						.1,
						F.up[0],
						es
					],
					[
						.2,
						F.up[1],
						eq
					],
					[.3, F.up[2]],
					[
						.62,
						st,
						ei2
					]
				],
				zone: x.upZone || undefined,
				active: [.13, .27],
				dmg: 10,
				post: 20,
				kb: 80,
				stun: .5,
				launch: true,
				lunge: [
					.1,
					.24,
					320
				],
				chain: [.28, .62],
				sw: .12,
				pw: 1.2,
				kind: "blade",
				sc: true
			}));
			reg(p + "_bh", mk({
				keys: [
					[
						.16,
						F.bh[0],
						es
					],
					[
						.3,
						F.bh[1],
						eo
					],
					[
						.38,
						F.bh[2],
						eqd
					],
					[.5, F.bh[2]],
					[
						.86,
						st,
						ei2
					]
				],
				active: [.34, .44],
				dmg: 17,
				post: 38,
				gcrush: 1.4,
				kb: 380,
				stun: .6,
				knock: true,
				lunge: [
					.24,
					.4,
					420
				],
				glint: [.1, .3],
				sw: .33,
				pw: 1.5,
				kind: "blade",
				sc: true
			}));
			reg(p + "_dh", mk({
				keys: [
					[
						.08,
						F.dh[0],
						eo
					],
					[.16, F.dh[0]],
					[
						.24,
						F.dh[1],
						eq
					],
					[.34, F.dh[1]],
					[
						.62,
						st,
						ei2
					]
				],
				active: [.2, .3],
				dmg: 13,
				post: 24,
				kb: 420,
				stun: .5,
				knock: true,
				lunge: [
					0,
					.22,
					520
				],
				spin: [
					.04,
					.18,
					1
				],
				sw: .19,
				pw: 1.3,
				kind: "blade"
			}));
			reg(p + "_s1", mk({
				keys: [
					[
						.07,
						F.s1[0],
						eo
					],
					[
						.14,
						F.s1[1],
						eq
					],
					[
						.24,
						F.s1[2],
						eo
					],
					[
						.34,
						F.s1[3],
						eqd
					],
					[.46, F.s1[3]],
					[
						.74,
						st,
						ei2
					]
				],
				active: [.1, .16],
				hits: [[.1, .16], [.3, .38]],
				dmg: 8,
				post: 14,
				kb: 180,
				stun: .42,
				knockLast: true,
				lastHit: {
					dmg: 11,
					kb: 430,
					post: 20
				},
				lunge: [
					.05,
					.34,
					260
				],
				sw: .08,
				pw: 1.2,
				kind: "blade",
				sc: true
			}));
			reg(p + "_s2", mk({
				keys: [
					[
						.06,
						F.s2[0],
						eo
					],
					[
						.14,
						F.s2[1],
						eqd
					],
					[.18, F.s2[1]],
					[
						.26,
						F.s2[2],
						eo
					],
					[.36, F.s2[2]],
					[
						.66,
						st,
						ei2
					]
				],
				active: [.2, .3],
				dmg: 14,
				post: 26,
				gcrush: 1.3,
				kb: 460,
				stun: .55,
				knock: true,
				lunge: [
					.16,
					.28,
					480
				],
				sw: .19,
				pw: 1.4,
				kind: "blade",
				thrust: true,
				sc: true,
				ev: [[.13, (f) => {
					fx.dust(f.x + f.dir * 70, 0, 6, .9);
					au.thud(.5, f.pan);
				}]]
			}));
		}
		famKit("fk", FAM.katana, "stance");
		famKit("fd", FAM.kodachi, "stance");
		famKit("fs", FAM.kodachi, "ts_stance");
		famKit("ft", FAM.twin, "stance");
		famKit("fn", FAM.naginata, "stance", { upZone: [
			160,
			10,
			150
		] });
		famKit("fb", FAM.bo, "jn_stance", {
			blunt: true,
			upZone: [
				150,
				10,
				150
			]
		});
		famKit("fm", FAM.tessen, "mi_stance", { upZone: [
			135,
			10,
			150
		] });
		famKit("fc", FAM.kusarigama, "tr_stance", { upZone: [
			135,
			10,
			150
		] });
		for (const k of [
			"fl",
			"bl",
			"up",
			"bh",
			"dh",
			"s1",
			"s2"
		]) ATK[{
			fl: "fLight",
			bl: "bLight",
			up: "fHeavy",
			bh: "bHeavy",
			dh: "dashHeavy",
			s1: "str1",
			s2: "str2"
		}[k]] = ATK["fk_" + k];
		reg("ak_l1", {
			keys: [
				[.06, "ak_stance"],
				[
					.11,
					"ak_l1b",
					eq
				],
				[
					.2,
					"ak_l1c",
					eo
				],
				[
					.42,
					"ak_stance",
					ei2
				]
			],
			sheath: [0, .06],
			active: [.08, .15],
			dmg: 9,
			post: 13,
			kb: 230,
			stun: .34,
			lunge: [
				.05,
				.13,
				300
			],
			chain: [.16, .42],
			sw: .06,
			pw: 1,
			kind: "blade"
		});
		reg("ak_l2", {
			keys: [
				[
					.08,
					"ak_l2a",
					es
				],
				[
					.17,
					"ak_l2b",
					eq
				],
				[.28, "ak_l2b"],
				[
					.5,
					"ak_stance",
					ei2
				]
			],
			active: [.1, .19],
			dmg: 10,
			post: 15,
			kb: 240,
			stun: .36,
			lunge: [
				.08,
				.17,
				240
			],
			chain: [.19, .48],
			sw: .08,
			pw: .95,
			kind: "blade",
			sc: true
		});
		reg("ak_l3", {
			keys: [
				[
					.1,
					"ak_l3a",
					es
				],
				[
					.19,
					"ak_l3b",
					eq
				],
				[.3, "ak_l3b"],
				[
					.36,
					"chiburi",
					eo
				],
				[
					.6,
					"ak_stance",
					ei2
				]
			],
			active: [.12, .21],
			dmg: 14,
			post: 22,
			kb: 500,
			stun: .5,
			lunge: [
				.1,
				.2,
				560
			],
			sw: .11,
			pw: 1.1,
			kind: "blade",
			sc: true
		});
		reg("ak_heavy", {
			keys: [
				[
					.14,
					"ak_hA",
					es
				],
				[.34, "ak_hA"],
				[
					.42,
					"ak_hB",
					eq
				],
				[
					.56,
					"ak_hC",
					eo
				],
				[.66, "ak_hC"],
				[
					.92,
					"ak_stance",
					ei2
				]
			],
			sheath: [0, .36],
			active: [.36, .46],
			dmg: 24,
			post: 44,
			kb: 430,
			stun: .6,
			lunge: [
				.34,
				.44,
				520
			],
			sw: .35,
			pw: 1.5,
			kind: "blade",
			knock: true,
			glint: [.14, .34],
			sc: true
		});
		reg("ak_fl", {
			keys: [
				[
					.05,
					"ak_hA",
					eo
				],
				[
					.12,
					"ak_l1b",
					eq
				],
				[
					.22,
					"ak_l1c",
					eo
				],
				[
					.46,
					"ak_stance",
					ei2
				]
			],
			sheath: [0, .07],
			active: [.09, .17],
			dmg: 10,
			post: 14,
			kb: 260,
			stun: .38,
			lunge: [
				.03,
				.15,
				700
			],
			chain: [.19, .46],
			sw: .07,
			pw: 1.1,
			kind: "blade",
			tick: ghostTick(.03, .15)
		});
		reg("ak_bl", {
			keys: [
				[
					.06,
					"ak_catch",
					eo
				],
				[
					.12,
					"ak_tsuka",
					eq
				],
				[.2, "ak_tsuka"],
				[
					.4,
					"ak_stance",
					ei2
				]
			],
			sheath: [0, .4],
			active: [.09, .15],
			dmg: 5,
			post: 16,
			kb: 200,
			stun: .5,
			lunge: [
				.07,
				.13,
				320
			],
			chain: [.15, .4],
			kind: "kick",
			limb: "pom",
			limbR: 12
		});
		reg("ak_up", {
			keys: [
				[
					.12,
					"ak_hA",
					es
				],
				[.2, "ak_hA"],
				[
					.28,
					"ak_upB",
					eq
				],
				[.4, "ak_upB"],
				[
					.66,
					"ak_stance",
					ei2
				]
			],
			sheath: [0, .21],
			active: [.22, .3],
			dmg: 10,
			post: 20,
			kb: 70,
			stun: .5,
			launch: true,
			lunge: [
				.18,
				.28,
				300
			],
			chain: [.3, .66],
			sw: .21,
			pw: 1.3,
			kind: "blade",
			sc: true
		});
		reg("ak_catch", {
			keys: [
				[
					.08,
					"ak_catch",
					eo
				],
				[.62, "ak_catch"],
				[
					.8,
					"ak_stance",
					ei2
				]
			],
			sheath: [0, .8],
			active: [.06, .58],
			kind: "stance",
			catch: [.06, .58],
			catchInto: "ak_catchCut",
			glint: [.08, .45],
			ev: [[.06, (f) => {
				au.tone({
					freq: 1800,
					freq1: 1700,
					dur: .5,
					gain: .02,
					send: .6,
					pan: f.pan
				});
				glow(f.x, f.y - 70, 60, rgbOf(f.col.accent), .4, .4);
			}]]
		});
		reg("ak_catchCut", {
			keys: [
				[
					.04,
					"ak_hB",
					eq
				],
				[
					.14,
					"ak_hC",
					eo
				],
				[.2, "ak_hC"],
				[
					.36,
					"chiburi",
					eo
				],
				[
					.62,
					"ak_stance",
					ei2
				]
			],
			active: [.03, .1],
			dmg: 16,
			post: 30,
			kb: 420,
			stun: .55,
			lunge: [
				0,
				.06,
				600
			],
			sw: .01,
			pw: 1.4,
			kind: "blade",
			trail: "255,70,55",
			ev: [[.035, (f, a, o) => {
				if (f.hitDone || !o || o.isInv() || Math.abs(o.x - f.x) > 280) return;
				const x = (f.x + o.x) / 2, y = o.y - 105;
				f.landHit(a, "body", x, y);
				slashArc({
					x: f.x + f.dir * 30,
					y: f.y - 100,
					r: 90,
					mid: f.dir > 0 ? 0 : Math.PI,
					span: 1.2,
					w: 22,
					col: "255,60,45",
					core: "255,235,220",
					life: .35
				});
			}]]
		});
		reg("ak_s1", {
			keys: [
				[
					.06,
					"ak_l2a",
					eo
				],
				[
					.13,
					"ak_s1a",
					eq
				],
				[
					.22,
					"ak_l3a",
					es
				],
				[
					.3,
					"ak_s1b",
					eq
				],
				[.4, "ak_s1b"],
				[
					.46,
					"chiburi",
					eo
				],
				[
					.72,
					"ak_stance",
					ei2
				]
			],
			active: [.09, .14],
			hits: [[.09, .14], [.26, .32]],
			dmg: 8,
			post: 14,
			kb: 160,
			stun: .42,
			knockLast: true,
			lastHit: {
				dmg: 12,
				kb: 440,
				post: 20
			},
			lunge: [
				.05,
				.3,
				240
			],
			sw: .08,
			pw: 1.2,
			kind: "blade",
			sc: true
		});
		reg("ak_s2", {
			keys: [
				[
					.08,
					"ak_hA",
					eo
				],
				[.16, "ak_hA"],
				[
					.2,
					"iai2",
					eq
				],
				[.4, "iai2"],
				[
					.5,
					"sp_akEnd",
					eo
				],
				[
					.72,
					"ak_stance",
					ei2
				]
			],
			sheath: [0, .17],
			active: [.17, .27],
			cross: true,
			pass: [.15, .3],
			dmg: 13,
			post: 24,
			kb: 300,
			stun: .5,
			knock: true,
			lunge: [
				.16,
				.27,
				1500
			],
			turnEnd: true,
			sw: .17,
			pw: 1.5,
			kind: "blade",
			glint: [.02, .16],
			ev: [[.17, (f) => {
				f.mem.x0 = f.x;
				glow(f.x, f.y - 80, 60, "255,80,60", .25);
			}], [.28, (f) => {
				const x0 = f.mem.x0 ?? f.x, d = Math.abs(f.x - x0);
				if (d > 60) slashArc({
					x: (x0 + f.x) / 2,
					y: f.y - 120,
					r: d / 2 + 20,
					mid: Math.PI / 2,
					span: 1.2,
					w: 22,
					sx: 1,
					sy: .4,
					col: "255,60,45",
					core: "255,235,220",
					life: .5,
					grow: .06
				});
			}]]
		});
		reg("ao_l1", {
			keys: [
				[
					.06,
					"ao_l1a",
					eo
				],
				[
					.13,
					"ao_l1b",
					eq
				],
				[.22, "ao_l1b"],
				[
					.42,
					"ao_stance",
					ei2
				]
			],
			active: [.09, .16],
			dmg: 8,
			post: 12,
			kb: 230,
			stun: .34,
			lunge: [
				.07,
				.15,
				320
			],
			chain: [.17, .42],
			sw: .07,
			pw: .9,
			kind: "blade",
			thrust: true,
			reach: 260
		});
		reg("ao_l2", {
			keys: [
				[
					.08,
					"ao_l2a",
					es
				],
				[
					.16,
					"ao_l2b",
					eq
				],
				[.26, "ao_l2b"],
				[
					.46,
					"ao_stance",
					ei2
				]
			],
			active: [.1, .18],
			dmg: 9,
			post: 14,
			kb: 240,
			stun: .36,
			lunge: [
				.08,
				.16,
				260
			],
			chain: [.18, .46],
			sw: .08,
			pw: .95,
			kind: "blade",
			sc: true
		});
		reg("ao_l3", {
			keys: [
				[
					.12,
					"ao_l3a",
					es
				],
				[
					.2,
					"ao_l3b",
					eq
				],
				[.34, "ao_l3b"],
				[
					.6,
					"ao_stance",
					ei2
				]
			],
			active: [.15, .24],
			dmg: 13,
			post: 20,
			kb: 520,
			stun: .5,
			lunge: [
				.13,
				.24,
				760
			],
			sw: .13,
			pw: 1.1,
			kind: "blade",
			thrust: true,
			sc: true,
			reach: 300,
			tick: ghostTick(.12, .24),
			ev: [[.14, (f) => windLine(f, 6)]]
		});
		reg("ao_heavy", {
			keys: [
				[
					.14,
					"ao_hA",
					es
				],
				[.3, "ao_hA"],
				[
					.4,
					"ao_hB",
					eq
				],
				[.54, "ao_hB"],
				[
					.86,
					"ao_stance",
					ei2
				]
			],
			active: [.34, .46],
			dmg: 22,
			post: 40,
			kb: 440,
			stun: .6,
			lunge: [
				.3,
				.44,
				480
			],
			knock: true,
			glint: [.1, .3],
			spin: [
				.06,
				.3,
				1
			],
			sw: .33,
			pw: 1.5,
			kind: "blade",
			sc: true,
			ev: [[.36, (f) => windLine(f, 10)]]
		});
		reg("ao_fl", {
			keys: [
				[
					.05,
					"ao_l1a",
					eo
				],
				[
					.14,
					"ao_l3b",
					eq
				],
				[.26, "ao_l3b"],
				[
					.48,
					"ao_stance",
					ei2
				]
			],
			active: [.1, .18],
			dmg: 9,
			post: 14,
			kb: 280,
			stun: .38,
			lunge: [
				.02,
				.16,
				900
			],
			chain: [.2, .48],
			sw: .08,
			pw: 1,
			kind: "blade",
			thrust: true,
			reach: 300,
			tick: ghostTick(.02, .16),
			ev: [[.03, (f) => {
				windLine(f, 8);
				fx.dust(f.x, 0, 6, 1);
			}]]
		});
		reg("ao_bl", {
			keys: [
				[
					.06,
					"ao_blA",
					eo
				],
				[
					.16,
					"ao_blB",
					eq
				],
				[.26, "ao_blB"],
				[
					.46,
					"ao_stance",
					ei2
				]
			],
			active: [.12, .2],
			dmg: 9,
			post: 14,
			kb: 260,
			stun: .4,
			lunge: [
				0,
				.14,
				-420
			],
			chain: [.2, .46],
			sw: .1,
			pw: 1,
			kind: "blade",
			reach: 260
		});
		reg("ao_up", {
			keys: [
				[
					.1,
					"ao_upA",
					es
				],
				[
					.2,
					"ao_upB",
					eq
				],
				[.32, "ao_upB"],
				[
					.62,
					"ao_stance",
					ei2
				]
			],
			active: [.12, .21],
			dmg: 9,
			post: 18,
			kb: 60,
			stun: .5,
			launch: true,
			lunge: [
				.08,
				.2,
				340
			],
			spin: [
				0,
				.1,
				1
			],
			chain: [.24, .62],
			sw: .11,
			pw: 1.2,
			kind: "blade",
			sc: true,
			ev: [[.18, (f) => burst(12, () => ({
				k: "streak",
				x: f.x + f.dir * rand(0, 60),
				y: f.y - rand(40, 170),
				vx: rand(-80, 80),
				vy: rand(-600, -300),
				life: .25,
				sz: 1.2,
				c: "200,230,255",
				add: true,
				rot: 0,
				vr: 0
			}))]]
		});
		reg("ao_bh", {
			keys: [
				[
					.1,
					"ao_bhA",
					eo
				],
				[.24, "ao_bhA"],
				[
					.32,
					"ao_l3b",
					eq
				],
				[.46, "ao_l3b"],
				[
					.76,
					"ao_stance",
					ei2
				]
			],
			active: [.27, .36],
			dmg: 16,
			post: 34,
			gcrush: 1.3,
			kb: 520,
			stun: .55,
			knock: true,
			lunge: [
				0,
				.12,
				-520
			],
			lunge2: [
				.25,
				.36,
				1150
			],
			thrust: true,
			reach: 360,
			glint: [.1, .26],
			sw: .26,
			pw: 1.4,
			kind: "blade",
			sc: true,
			tick: ghostTick(.25, .36),
			ev: [[.25, (f) => windLine(f, 10)]]
		});
		reg("ao_s1", {
			keys: [
				[
					.05,
					"ao_l1a",
					eo
				],
				[
					.1,
					"ao_l1b",
					eq
				],
				[
					.15,
					"ao_l1a",
					eo
				],
				[
					.2,
					"ao_l1b",
					eq
				],
				[
					.26,
					"ao_l3a",
					eo
				],
				[
					.34,
					"ao_l3b",
					eq
				],
				[.46, "ao_l3b"],
				[
					.72,
					"ao_stance",
					ei2
				]
			],
			active: [.07, .11],
			hits: [
				[.07, .11],
				[.17, .21],
				[.3, .36]
			],
			dmg: 6,
			post: 10,
			kb: 120,
			stun: .42,
			knockLast: true,
			lastHit: {
				dmg: 10,
				kb: 480,
				post: 18
			},
			lunge: [
				.04,
				.34,
				240
			],
			thrust: true,
			sw: .06,
			pw: 1,
			kind: "blade",
			sc: true,
			ev: [[.3, (f) => windLine(f, 10)]]
		});
		reg("ao_s2", {
			keys: [
				[
					.06,
					"ao_hA",
					eo
				],
				[
					.2,
					"ao_hB",
					es
				],
				[.3, "ao_hB"],
				[
					.56,
					"ao_stance",
					ei2
				]
			],
			active: [.1, .16],
			hits: [[.1, .16], [.18, .24]],
			zone: [
				150,
				60,
				120
			],
			dmg: 8,
			post: 18,
			gcrush: 1.2,
			kb: 300,
			stun: .45,
			knockLast: true,
			lastHit: {
				dmg: 10,
				kb: 440
			},
			spin: [
				.04,
				.22,
				2
			],
			lunge: [
				.04,
				.24,
				420
			],
			sw: .08,
			pw: 1.2,
			kind: "blade",
			sc: true,
			ev: [[.12, (f) => slashArc({
				x: f.x,
				y: f.y - 100,
				r: 110,
				mid: f.dir > 0 ? 0 : Math.PI,
				span: 2.6,
				w: 16,
				sy: .45,
				col: "170,215,255",
				core: "240,250,255",
				life: .3
			})]]
		});
		reg("rn_l1", {
			keys: [
				[
					.09,
					"rn_l1a",
					es
				],
				[
					.17,
					"rn_l1b",
					eq
				],
				[.28, "rn_l1b"],
				[
					.46,
					"rn_stance",
					ei2
				]
			],
			active: [.11, .2],
			dmg: 9,
			post: 15,
			kb: 240,
			stun: .36,
			lunge: [
				.09,
				.18,
				260
			],
			chain: [.2, .46],
			sw: .1,
			pw: .95,
			kind: "blade"
		});
		reg("rn_l2", {
			keys: [
				[
					.07,
					"rn_elbA",
					eo
				],
				[
					.13,
					"rn_elbB",
					eq
				],
				[.24, "rn_elbB"],
				[
					.44,
					"rn_stance",
					ei2
				]
			],
			active: [.09, .17],
			dmg: 6,
			post: 10,
			kb: 220,
			stun: .4,
			lunge: [
				.07,
				.15,
				300
			],
			chain: [.17, .44],
			kind: "kick",
			limb: "elF",
			limbR: 13,
			sc: true
		});
		reg("rn_l3", {
			keys: [
				[
					.08,
					"rn_kneeA",
					eo
				],
				[
					.16,
					"rn_kneeB",
					eq
				],
				[.28, "rn_kneeB"],
				[
					.5,
					"rn_stance",
					ei2
				]
			],
			active: [.12, .22],
			dmg: 9,
			post: 12,
			kb: 480,
			stun: .5,
			lunge: [
				.1,
				.22,
				480
			],
			kind: "kick",
			limb: "knF",
			limbR: 15,
			sc: true
		});
		reg("rn_heavy", {
			keys: [
				[
					.16,
					"rn_hA",
					es
				],
				[.34, "rn_hA"],
				[
					.42,
					"rn_hB",
					eq
				],
				[.6, "rn_hB"],
				[
					.92,
					"rn_stance",
					ei2
				]
			],
			active: [.37, .47],
			dmg: 24,
			post: 46,
			gcrush: 1.25,
			kb: 440,
			stun: .6,
			lunge: [
				.34,
				.44,
				420
			],
			knock: true,
			glint: [.16, .38],
			sw: .36,
			pw: 1.6,
			kind: "blade",
			sc: true,
			onHit(f, o, x) {
				fx.dust(x, 0, 10, 1.3);
				cam.punch(5);
			}
		});
		reg("rn_fl", {
			keys: [
				[
					.07,
					"rn_elbA",
					eo
				],
				[
					.14,
					"rn_sh",
					eq
				],
				[.26, "rn_sh"],
				[
					.48,
					"rn_stance",
					ei2
				]
			],
			active: [.1, .2],
			dmg: 5,
			post: 10,
			kb: 420,
			stun: .44,
			lunge: [
				.04,
				.18,
				640
			],
			chain: [.2, .48],
			kind: "kick",
			parry: true,
			limb: "sh",
			limbR: 17,
			tick: ghostTick(.04, .18, .2),
			ev: [[.05, (f) => fx.dust(f.x, 0, 8, 1.1)]]
		});
		reg("rn_bl", {
			keys: [
				[
					.08,
					"rn_headA",
					eo
				],
				[
					.15,
					"rn_headB",
					eq
				],
				[.24, "rn_headB"],
				[
					.44,
					"rn_stance",
					ei2
				]
			],
			active: [.11, .18],
			dmg: 5,
			post: 10,
			kb: 260,
			stun: .52,
			lunge: [
				.1,
				.17,
				260
			],
			chain: [.18, .44],
			kind: "kick",
			parry: true,
			limb: "head",
			limbR: 13
		});
		reg("rn_up", {
			keys: [
				[
					.12,
					"rn_upA",
					es
				],
				[
					.22,
					"rn_upB",
					eq
				],
				[.34, "rn_upB"],
				[
					.64,
					"rn_stance",
					ei2
				]
			],
			active: [.14, .25],
			dmg: 10,
			post: 20,
			kb: 60,
			stun: .5,
			launch: true,
			lunge: [
				.1,
				.22,
				340
			],
			chain: [.27, .64],
			sw: .13,
			pw: 1.3,
			kind: "blade",
			sc: true,
			ev: [[.2, (f) => burst(10, () => ({
				k: "ember",
				x: f.x + f.dir * rand(10, 70),
				y: f.y - rand(40, 180),
				vx: f.dir * rand(0, 100),
				vy: rand(-380, -120),
				g: -60,
				drag: 1.8,
				life: rand(.4, .8),
				sz: rand(1.5, 2.6),
				c: "255,140,60"
			}))]]
		});
		reg("rn_bh", {
			keys: [
				[
					.2,
					"rn_axeA",
					es
				],
				[.32, "rn_axeA"],
				[
					.4,
					"rn_axeB",
					eqd
				],
				[.56, "rn_axeB"],
				[
					.86,
					"rn_stance",
					ei2
				]
			],
			active: [.35, .44],
			dmg: 9,
			post: 18,
			kb: 300,
			stun: .6,
			knock: true,
			lunge: [
				.3,
				.42,
				300
			],
			kind: "kick",
			limb: "ftF",
			limbR: 15,
			sc: true,
			onHit(f, o, x) {
				fx.dust(x, 0, 12, 1.4);
				cam.punch(6);
				au.thud(1.1, f.pan);
			}
		});
		reg("rn_s1", {
			keys: [
				[
					.07,
					"rn_l1a",
					eo
				],
				[
					.14,
					"rn_l1b",
					eq
				],
				[
					.22,
					"rn_hA",
					eo
				],
				[
					.33,
					"rn_hB",
					eqd
				],
				[.44, "rn_hB"],
				[
					.72,
					"rn_stance",
					ei2
				]
			],
			active: [.1, .16],
			hits: [[.1, .16], [.3, .38]],
			dmg: 8,
			post: 14,
			gcrush: 1.2,
			kb: 180,
			stun: .42,
			knockLast: true,
			lastHit: {
				dmg: 13,
				kb: 460,
				post: 22
			},
			lunge: [
				.05,
				.32,
				240
			],
			sw: .08,
			pw: 1.3,
			kind: "blade",
			sc: true,
			onHit(f, o, x) {
				fx.dust(x, 0, 6, 1);
			}
		});
		reg("rn_s2", {
			keys: [
				[
					.08,
					"k1a",
					eo
				],
				[
					.2,
					"k1b",
					es
				],
				[.3, "k1b"],
				[
					.56,
					"rn_stance",
					ei2
				]
			],
			active: [.14, .26],
			dmg: 8,
			post: 16,
			gcrush: 1.2,
			kb: 520,
			stun: .5,
			knock: true,
			spin: [
				.02,
				.16,
				1
			],
			lunge: [
				.06,
				.2,
				320
			],
			kind: "kick",
			limb: "ftF",
			limbR: 14,
			sc: true
		});
		const kageSmoke = (f, x) => {
			puff(f, x, f.y, 14);
			fx.ring(x, f.y - 90, rgbOf(f.col.accent), 60);
			snd.poof && snd.poof(f.pan);
		};
		reg("kg_l1", {
			keys: [
				[
					.07,
					"kg_l1a",
					eo
				],
				[
					.14,
					"kg_l1b",
					eq
				],
				[.24, "kg_l1b"],
				[
					.42,
					"kg_stance",
					ei2
				]
			],
			active: [.09, .17],
			dmg: 8,
			post: 12,
			kb: 220,
			stun: .34,
			lunge: [
				.07,
				.16,
				300
			],
			chain: [.17, .42],
			sw: .07,
			pw: .9,
			kind: "blade"
		});
		reg("kg_l2", {
			keys: [
				[
					.06,
					"kg_l2a",
					eo
				],
				[
					.14,
					"kg_l2b",
					es
				],
				[.24, "kg_l2b"],
				[
					.42,
					"kg_stance",
					ei2
				]
			],
			active: [.09, .17],
			dmg: 9,
			post: 14,
			kb: 240,
			stun: .36,
			spin: [
				.02,
				.12,
				1
			],
			lunge: [
				.06,
				.15,
				280
			],
			chain: [.17, .42],
			sw: .08,
			pw: .95,
			kind: "blade",
			sc: true
		});
		reg("kg_l3", {
			keys: [
				[
					.07,
					"kg_l3a",
					eo
				],
				[.16, "kg_l3a"],
				[
					.22,
					"kg_l3b",
					eq
				],
				[.32, "kg_l3b"],
				[
					.54,
					"kg_stance",
					ei2
				]
			],
			active: [.17, .25],
			hide: [.07, .16],
			inv: [.06, .17],
			dmg: 12,
			post: 20,
			kb: 480,
			stun: .5,
			lunge: [
				.06,
				.18,
				820
			],
			thrust: true,
			sw: .16,
			pw: 1.1,
			kind: "blade",
			sc: true,
			ev: [[.07, (f) => kageSmoke(f, f.x)], [.16, (f) => {
				puff(f, f.x, f.y, 8);
				f.prevBlade = null;
			}]]
		});
		reg("kg_heavy", {
			keys: [
				[
					.12,
					"kg_hA",
					es
				],
				[.3, "kg_hA"],
				[
					.38,
					"kg_hB",
					eqd
				],
				[.54, "kg_hB"],
				[
					.86,
					"kg_stance",
					ei2
				]
			],
			active: [.33, .43],
			dmg: 22,
			post: 40,
			kb: 400,
			stun: .6,
			knock: true,
			lunge: [
				.24,
				.4,
				460
			],
			glint: [.1, .3],
			sw: .31,
			pw: 1.5,
			kind: "blade",
			thrust: true,
			sc: true
		});
		reg("kg_fl", {
			keys: [
				[
					.05,
					"kg_l3a",
					eo
				],
				[
					.12,
					"kg_l1b",
					eq
				],
				[.22, "kg_l1b"],
				[
					.44,
					"kg_stance",
					ei2
				]
			],
			active: [.08, .16],
			dmg: 9,
			post: 13,
			kb: 260,
			stun: .38,
			lunge: [
				.02,
				.14,
				860
			],
			chain: [.18, .44],
			sw: .07,
			pw: 1,
			kind: "blade",
			tick: ghostTick(.02, .14, .34)
		});
		reg("kg_bl", {
			keys: [
				[
					.07,
					"kg_fA",
					eo
				],
				[.13, "kg_fA"],
				[
					.2,
					"dodgeB",
					eo
				],
				[
					.3,
					"kg_stance",
					ei2
				]
			],
			active: [.09, .11],
			kind: "feint",
			glint: [.02, .12],
			hide: [.13, .19],
			inv: [.12, .2],
			chain: [.19, .34],
			sw: .08,
			pw: .6,
			ev: [[.13, (f) => {
				kageSmoke(f, f.x);
				const A = ND.ARENA - 12;
				f.x = clamp(f.x - f.dir * 90, -A, A);
				f.vx = 0;
				f.prevBlade = null;
			}], [.19, (f) => puff(f, f.x, f.y, 6)]]
		});
		reg("kg_up", {
			keys: [
				[
					.1,
					"kg_upA",
					es
				],
				[
					.2,
					"kg_upB",
					eq
				],
				[.32, "kg_upB"],
				[
					.6,
					"kg_stance",
					ei2
				]
			],
			zone: [
				110,
				10,
				150
			],
			active: [.12, .23],
			dmg: 9,
			post: 18,
			kb: 60,
			stun: .5,
			launch: true,
			lunge: [
				.09,
				.21,
				340
			],
			chain: [.25, .6],
			sw: .11,
			pw: 1.2,
			kind: "blade",
			sc: true
		});
		reg("kg_bh", {
			keys: [
				[
					.08,
					"kg_smA",
					eo
				],
				[.16, "kg_smA"],
				[
					.26,
					"dodgeB",
					eo
				],
				[.4, "dodgeB"],
				[
					.6,
					"kg_stance",
					ei2
				]
			],
			active: [.1, .2],
			zone: [
				120,
				20,
				120
			],
			dmg: 4,
			post: 22,
			kb: 120,
			stun: .7,
			inv: [.12, .34],
			lunge: [
				.16,
				.34,
				-560
			],
			kind: "kick",
			ev: [[.1, (f) => {
				kageSmoke(f, f.x + f.dir * 60);
				puff(f, f.x + f.dir * 90, f.y, 10);
			}]]
		});
		reg("kg_s1", {
			keys: [
				[
					.05,
					"kg_l1a",
					eo
				],
				[
					.1,
					"kg_l1b",
					eq
				],
				[
					.15,
					"kg_l2a",
					eo
				],
				[
					.22,
					"kg_l2b",
					es
				],
				[
					.3,
					"kg_hA",
					eo
				],
				[
					.38,
					"kg_hB",
					eqd
				],
				[.48, "kg_hB"],
				[
					.74,
					"kg_stance",
					ei2
				]
			],
			active: [.07, .11],
			hits: [
				[.07, .11],
				[.17, .22],
				[.34, .4]
			],
			spin: [
				.14,
				.22,
				1
			],
			dmg: 6,
			post: 10,
			kb: 120,
			stun: .42,
			knockLast: true,
			lastHit: {
				dmg: 10,
				kb: 420,
				post: 18
			},
			lunge: [
				.04,
				.36,
				260
			],
			sw: .06,
			pw: 1,
			kind: "blade",
			sc: true
		});
		reg("kg_s2", {
			keys: [
				[
					.06,
					"kg_l3a",
					eo
				],
				[.2, "kg_l3a"],
				[
					.26,
					"kg_l1b",
					eq
				],
				[.36, "kg_l1b"],
				[
					.6,
					"kg_stance",
					ei2
				]
			],
			active: [.22, .3],
			hide: [.08, .2],
			inv: [.06, .22],
			dmg: 12,
			post: 22,
			kb: 420,
			stun: .5,
			knock: true,
			sw: .21,
			pw: 1.2,
			kind: "blade",
			sc: true,
			ev: [[.08, (f) => kageSmoke(f, f.x)], [.19, (f, a, o) => {
				const side = Math.sign(o.x - f.x) || f.dir, A = ND.ARENA - 12;
				f.x = clamp(o.x + side * 76, -A, A);
				f.vx = 0;
				f.dir = o.x >= f.x ? 1 : -1;
				f.prevBlade = null;
				ND.solve(f.pose, f.x, f.y, f.dir, f.j, f.wpn);
				kageSmoke(f, f.x);
			}]]
		});
		const fam = (p) => ({
			fLight: p + "_fl",
			bLight: p + "_bl",
			fHeavy: p + "_up",
			bHeavy: p + "_bh",
			dashHeavy: p + "_dh",
			str1: p + "_s1",
			str2: p + "_s2"
		});
		const KITS = ND.KITS = {
			akane: {
				light1: "ak_l1",
				light2: "ak_l2",
				light3: "ak_l3",
				heavy: "ak_heavy",
				dash: "ak_fl",
				fLight: "ak_fl",
				bLight: "ak_bl",
				fHeavy: "ak_up",
				bHeavy: "ak_catch",
				dashHeavy: "ak_up",
				str1: "ak_s1",
				str2: "ak_s2"
			},
			aoi: {
				light1: "ao_l1",
				light2: "ao_l2",
				light3: "ao_l3",
				heavy: "ao_heavy",
				dash: "ao_fl",
				fLight: "ao_fl",
				bLight: "ao_bl",
				fHeavy: "ao_up",
				bHeavy: "ao_bh",
				dashHeavy: "ao_up",
				str1: "ao_s1",
				str2: "ao_s2"
			},
			ren: {
				light1: "rn_l1",
				light2: "rn_l2",
				light3: "rn_l3",
				heavy: "rn_heavy",
				dash: "rn_fl",
				fLight: "rn_fl",
				bLight: "rn_bl",
				fHeavy: "rn_up",
				bHeavy: "rn_bh",
				dashHeavy: "rn_up",
				str1: "rn_s1",
				str2: "rn_s2"
			},
			kage: {
				light1: "kg_l1",
				light2: "kg_l2",
				light3: "kg_l3",
				heavy: "kg_heavy",
				dash: "kg_fl",
				fLight: "kg_fl",
				bLight: "kg_bl",
				fHeavy: "kg_up",
				bHeavy: "kg_bh",
				dashHeavy: "kg_up",
				str1: "kg_s1",
				str2: "kg_s2"
			},
			kuro: fam("fk"),
			yuki: fam("fd"),
			hana: fam("ft"),
			tetsu: fam("fn"),
			tora: fam("fc"),
			jin: fam("fb"),
			mai: fam("fm"),
			tsubame: fam("fs"),
			shura: Object.assign(fam("fk"), {
				fLight: "rn_fl",
				bLight: "rn_bl",
				bHeavy: "rn_bh",
				str2: "rn_s2"
			})
		};
		const M0 = ND.MOVES || {};
		const OVR = { tsubame: (f, n) => n === "bHeavy" ? f.ammo > 0 ? "ts_shot" : "fs_bh" : null };
		ND.MOVES = {};
		for (const id of Object.keys(KITS).concat(Object.keys(M0))) {
			if (ND.MOVES[id]) continue;
			const K = KITS[id] || {}, old = M0[id], ov = OVR[id];
			ND.MOVES[id] = (f, n) => ov && ov(f, n) || K[n] || (typeof old === "function" ? old(f, n) : old && old[n]) || null;
		}
		const R0 = {
			light1: {
				light: "light2",
				heavy: "heavy",
				kick: "kick",
				fHeavy: "fHeavy"
			},
			light2: {
				light: "light3",
				heavy: "str1",
				kick: "kick",
				fHeavy: "fHeavy"
			},
			fLight: {
				light: "light2",
				heavy: "heavy",
				kick: "kick",
				fHeavy: "fHeavy"
			},
			bLight: {
				light: "light2",
				heavy: "heavy"
			},
			dash: {
				light: "light2",
				heavy: "heavy",
				fHeavy: "fHeavy"
			},
			kick: { heavy: "str2" },
			fHeavy: {
				hit: true,
				light: "chase",
				heavy: "chase"
			},
			chase: {
				light: "chaseEnd",
				heavy: "chaseEnd"
			}
		};
		const ROUTES = ND.ROUTES = {
			ren: {
				fLight: {
					hit: true,
					light: "light2",
					heavy: "heavy"
				},
				bLight: {
					hit: true,
					light: "light2",
					heavy: "heavy"
				}
			},
			shura: {
				fLight: {
					hit: true,
					light: "light2",
					heavy: "heavy"
				},
				bLight: {
					hit: true,
					light: "light2",
					heavy: "heavy"
				}
			},
			kage: { bLight: {
				light: "light3",
				heavy: "heavy",
				fHeavy: "fHeavy"
			} },
			akane: { bLight: {
				light: "light2",
				heavy: "str1"
			} }
		};
		ND.routesFor = (f, name) => {
			const O = ROUTES[f.ch.id];
			return O && O[name] || R0[name] || null;
		};
		ND.ROUTES_BASE = R0;
		const CN = ND.COMBO_NAMES = {
			akane: {
				str1: "KURENAI RENGA",
				str2: "HIGANBANA",
				chaseEnd: "AKANE OTOSHI"
			},
			aoi: {
				str1: "FUJIN RENZUKI",
				str2: "KAMAITACHI",
				chaseEnd: "TSUMUJI OTOSHI"
			},
			kuro: {
				str1: "YAMA OROSHI",
				str2: "IWA KUDAKI",
				chaseEnd: "KOKUU OTOSHI"
			},
			yuki: {
				str1: "YUKI TSUBAME",
				str2: "SHIMO BASHIRI",
				chaseEnd: "FUBUKI OTOSHI"
			},
			hana: {
				str1: "SAKURA RENBU",
				str2: "HANA ARASHI",
				chaseEnd: "SAKURA OTOSHI"
			},
			tetsu: {
				str1: "TETSU KABE",
				str2: "TESSEKI",
				chaseEnd: "KABUTO WARI"
			},
			ren: {
				str1: "ONI RENDA",
				str2: "ONI GURUMA",
				chaseEnd: "ONI OTOSHI"
			},
			kage: {
				str1: "KAGE NUI",
				str2: "USHIRO KAGE",
				chaseEnd: "YAMI OTOSHI"
			},
			tora: {
				str1: "TORA NO KIBA",
				str2: "KUSARI SHIBARI",
				chaseEnd: "TORA OTOSHI"
			},
			jin: {
				str1: "KONGO RENDA",
				str2: "SANDAN ZUKI",
				chaseEnd: "TENBIN OTOSHI"
			},
			mai: {
				str1: "MAI OGI",
				str2: "KOCHO RANBU",
				chaseEnd: "TENNYO OTOSHI"
			},
			tsubame: {
				str1: "KAESHI BANE",
				str2: "HAYABUSA",
				chaseEnd: "TSUBAME OTOSHI"
			},
			shura: {
				str1: "ASHURA RENGEKI",
				str2: "RASETSU GURUMA",
				chaseEnd: "JIGOKU OTOSHI"
			}
		};
		const L3 = {
			akane: "SANDAN IAI",
			aoi: "HAYATE SANREN",
			kuro: "SANDAN GIRI",
			yuki: "KITSUNE SANREN",
			hana: "HANA SANREN",
			tetsu: "SANDAN BARAI",
			ren: "TOBI HIZA",
			kage: "KAGE FUMI",
			tora: "KUSARI SANREN",
			jin: "ASA SANREN",
			mai: "OGI SANREN",
			tsubame: "TSUBAME SANREN",
			shura: "SHURA SANDAN"
		};
		for (const id in L3) if (CN[id]) CN[id].light3 = L3[id];
		ND.comboName = (f, name) => {
			const T = CN[f.ch.id];
			return T && T[name] || null;
		};
		Object.assign(ND.TXT, {
			kiCancel: "KI İPTALİ!",
			launch: "HAVAYA!",
			iaiCatch: "IAI GAESHI!"
		});
		const tr = (s) => ND.i18n && ND.i18n.t ? ND.i18n.t(s) : s;
		const ent = (name, input, keys, desc, tags) => ({
			get name() {
				return tr(name);
			},
			nameTr: name,
			input,
			keys,
			get desc() {
				return tr(desc);
			},
			descTr: desc,
			tags
		});
		const K = {
			L: ["light"],
			H: ["heavy"],
			K: ["kick"],
			T: ["throw"],
			FL: ["fwd", "light"],
			BL: ["back", "light"],
			FH: ["fwd", "heavy"],
			BH: ["back", "heavy"],
			U: ["up"]
		};
		const IN = {
			chain: "F, F, F",
			heavy: "G",
			kick: "R",
			throw: "T",
			fl: "→ + F",
			bl: "← + F",
			fh: "→ + G",
			bh: "← + G",
			dash: "→ → + F",
			dashH: "→ → + G",
			s1: "F, F, G",
			s2: "F, R, G",
			s3: "F, F, → + G, F, G",
			air: "W, F",
			plunge: "W, G",
			counter: "S › F",
			special: "E"
		};
		const KY = {
			chain: [
				K.L,
				K.L,
				K.L
			],
			s1: [
				K.L,
				K.L,
				K.H
			],
			s2: [
				K.L,
				K.K,
				K.H
			],
			s3: [
				K.L,
				K.L,
				K.FH,
				K.L,
				K.H
			],
			dash: [["fwd"], ["fwd", "light"]],
			dashH: [["fwd"], ["fwd", "heavy"]]
		};
		const D0 = {
			kick: "Tekme: dengeyi hızla doldurur, gardı kırmaya yarar. Ardından AĞIR ile seri bitirişine bağlanır.",
			throw: "Shuriken fırlatır; zamanla yeniden dolar.",
			air: "Havada hafif kesik. Havaya fırlatılmış rakibe de vurur.",
			plunge: "Havadan aşağı dalış kesiği; yere serer.",
			chase: "Fırlatıcı isabet edince HAFİF: rakibin peşinden sıçrayıp havada keser. Ardından AĞIR ile yere çakar. Havadaki rakip en çok üç vuruş alır.",
			counter: "Gard ya da savuşturmanın ardından ekranda VUR! çıkar: altındaki çubuk bitmeden HAFİF’e bas. Yalnız HAFİF: Suriage. İleri + HAFİF: Harai (yere serer). Geri + HAFİF: Nuki (arkaya geçer). AĞIR: Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.",
			special: "Ki barı doluyken karakterin ki tekniği. Ki doluyken seri bitirişleri ve fırlatıcı isabet ettiği an E ile tekniğe bağlanır."
		};
		const DT = {
			fl: "İleri atılarak dürter; hafif seriye devam eder.",
			bl: "Yarım adım geri çekilip bacaklara alçak süpürme; yere serer.",
			fh: "Fırlatıcı: yükselen kesik rakibi havaya kaldırır.",
			bh: "Sıçrayıp tepeden iner: yavaş ama gardı ezer, yere serer.",
			dashH: "Atılırken dönerek geniş kesik; yere serer.",
			s1: "İki kesiklik seri bitirişi; son kesik yere serer.",
			s2: "Rakibin kılıcını aşağı çarpıp dürter: gardı ezer."
		};
		const common = (id, lightName, heavyName) => [
			ent(lightName, IN.chain, KY.chain, "Üç vuruşluk hafif seri. İkinci ve üçüncü vuruş ki doluyken tekniğe bağlanır.", [
				"normal",
				"string",
				"kiCancel"
			]),
			ent(heavyName, IN.heavy, [K.H], "Ağır vuruş: yavaş ama yere serer.", [
				"normal",
				"knockdown",
				"kiCancel"
			]),
			ent("Tekme", IN.kick, [K.K], D0.kick, [
				"normal",
				"strike",
				"guardCrush"
			]),
			ent("Shuriken", IN.throw, [K.T], D0.throw, ["throw"])
		];
		const tail = (id) => {
			const S = () => ND.SPECIALS && ND.SPECIALS[id];
			return [
				ent("Hava kesiği", IN.air, [K.U, K.L], D0.air, ["air"]),
				ent("Dalış", IN.plunge, [K.U, K.H], D0.plunge, ["air", "knockdown"]),
				ent("Kaeshi-waza (karşılık)", IN.counter, [["guard"], K.L], D0.counter, ["counter"]),
				{
					get name() {
						const s = S();
						return s ? s.name : "Ki";
					},
					get nameTr() {
						const s = S();
						return s ? s.name : "Ki";
					},
					input: IN.special,
					keys: [["special"]],
					get desc() {
						const s = S();
						return s ? s.desc : "";
					},
					get descTr() {
						const s = S();
						return s ? ND.i18n && ND.i18n.src ? ND.i18n.src(s, "desc") : s.desc : "";
					},
					tags: ["special", "kiCancel"]
				}
			];
		};
		const fromTemplate = (id, names) => {
			const C = CN[id];
			return common(id, names[0], names[1]).concat([
				ent(names[2], IN.fl, [K.FL], DT.fl, ["command"]),
				ent(names[3], IN.bl, [K.BL], DT.bl, ["command", "knockdown"]),
				ent(names[4], IN.fh, [K.FH], DT.fh, [
					"command",
					"launcher",
					"kiCancel"
				]),
				ent(names[5], IN.bh, [K.BH], DT.bh, [
					"command",
					"guardCrush",
					"knockdown",
					"kiCancel"
				]),
				ent(names[6], IN.dashH, KY.dashH, DT.dashH, ["dash", "knockdown"]),
				ent(C.str1, IN.s1, KY.s1, DT.s1, [
					"string",
					"knockdown",
					"kiCancel"
				]),
				ent(C.str2, IN.s2, KY.s2, DT.s2, [
					"string",
					"guardCrush",
					"kiCancel"
				]),
				ent(C.chaseEnd, IN.s3, KY.s3, D0.chase, [
					"string",
					"launcher",
					"juggle"
				])
			]).concat(tail(id));
		};
		const custom = (id, rows) => {
			const C = CN[id];
			return rows.map((r) => ent(r[0], r[1], r[2], r[3], r[4])).concat([ent(C.chaseEnd, IN.s3, KY.s3, D0.chase, [
				"string",
				"launcher",
				"juggle"
			])]).concat(tail(id));
		};
		ND.MOVELIST = {
			akane: custom("akane", [
				[
					"Nukitsuke · Kesa · Kaeshi-iai",
					IN.chain,
					KY.chain,
					"Kından yatay çekiş kesiği, çapraz iniş, geri dönen kesik; kılıç her seferinde kınına döner.",
					[
						"normal",
						"string",
						"kiCancel"
					]
				],
				[
					"Yoko-ichimonji",
					IN.heavy,
					[K.H],
					"Derin çömelişten geniş yatay çekiş; yere serer.",
					[
						"normal",
						"knockdown",
						"kiCancel"
					]
				],
				[
					"Tekme",
					IN.kick,
					[K.K],
					D0.kick,
					[
						"normal",
						"strike",
						"guardCrush"
					]
				],
				[
					"Shuriken",
					IN.throw,
					[K.T],
					D0.throw,
					["throw"]
				],
				[
					"Shippū",
					IN.fl + " · " + IN.dash,
					[K.FL],
					"Atılarak kından çekiş: uzak mesafeyi bir anda kapatır, seriye devam eder.",
					["command", "dash"]
				],
				[
					"Tsuka-ate",
					IN.bl,
					[K.BL],
					"Kılıcı çekmeden kabzayla göğse vurur: hızlı, sersemletir. Ardından HAFİF ile Kesa ya da AĞIR ile Kurenai Renga.",
					["command", "strike"]
				],
				[
					"Kiriage",
					IN.fh + " · " + IN.dashH,
					[K.FH],
					"Fırlatıcı: kından yükselen çekiş rakibi havaya kaldırır.",
					[
						"command",
						"launcher",
						"kiCancel"
					]
				],
				[
					"Iai no kamae",
					IN.bh,
					[K.BH],
					"Çekiş duruşu: kısa bir an bekler; bu sırada gelen yakın dövüş darbesini yakalar ve kaçınılmaz bir iai kesiğiyle karşılık verir. Boşa giderse açık kalır.",
					[
						"command",
						"catch",
						"counter"
					]
				],
				[
					CN.akane.str1,
					IN.s1,
					KY.s1,
					"Kesa’dan sonra yükselen ve inen iki çekiş kesiği; son kesik yere serer.",
					[
						"string",
						"knockdown",
						"kiCancel"
					]
				],
				[
					CN.akane.str2,
					IN.s2,
					KY.s2,
					"Tekmeden sonra çömelip rakibin içinden geçen kızıl iai; arkasında belirir.",
					["string", "knockdown"]
				]
			]),
			aoi: custom("aoi", [
				[
					"Tsuki · Kaze-kiri · Hayate-zuki",
					IN.chain,
					KY.chain,
					"Tek elle uzun dürtüş, yukarı savrulan kesik ve rüzgâr adımıyla derin atılma dürtüşü.",
					[
						"normal",
						"string",
						"kiCancel"
					]
				],
				[
					"Tatsumaki-giri",
					IN.heavy,
					[K.H],
					"Dönerek geniş yatay kesik; yere serer.",
					[
						"normal",
						"knockdown",
						"kiCancel"
					]
				],
				[
					"Tekme",
					IN.kick,
					[K.K],
					D0.kick,
					[
						"normal",
						"strike",
						"guardCrush"
					]
				],
				[
					"Shuriken",
					IN.throw,
					[K.T],
					D0.throw,
					["throw"]
				],
				[
					"Kaze-ashi",
					IN.fl + " · " + IN.dash,
					[K.FL],
					"Rüzgâr adımı: çok uzaktan tek hamlede dürter, seriye devam eder.",
					["command", "dash"]
				],
				[
					"Hiki-giri",
					IN.bl,
					[K.BL],
					"Geri çekilirken uzun menzilli iniş kesiği: yaklaşanı cezalandırır.",
					["command"]
				],
				[
					"Tsumuji-kaze",
					IN.fh + " · " + IN.dashH,
					[K.FH],
					"Fırlatıcı: dönerek yükselen kesik rakibi havaya kaldırır.",
					[
						"command",
						"launcher",
						"kiCancel"
					]
				],
				[
					"Oikaze",
					IN.bh,
					[K.BH],
					"Geri sıçrar, ardından çok uzağa uzanan dürtüşle geri döner: gardı ezer, yere serer.",
					[
						"command",
						"guardCrush",
						"knockdown",
						"kiCancel"
					]
				],
				[
					CN.aoi.str1,
					IN.s1,
					KY.s1,
					"Üç hızlı dürtüş; sonuncusu rüzgârla rakibi savurur.",
					[
						"string",
						"knockdown",
						"kiCancel"
					]
				],
				[
					CN.aoi.str2,
					IN.s2,
					KY.s2,
					"İki kez dönerek çevresini biçen kesik; gardı ezer.",
					[
						"string",
						"guardCrush",
						"kiCancel"
					]
				]
			]),
			ren: custom("ren", [
				[
					"Kesik · Dirsek · Diz",
					IN.chain,
					KY.chain,
					"Tek elle kesik, dirsek darbesi ve uçan diz: kılıçla başlayıp bedenle biter.",
					[
						"normal",
						"string",
						"strike",
						"kiCancel"
					]
				],
				[
					"Oni-otoshi",
					IN.heavy,
					[K.H],
					"İki elle tepeden ezici iniş; gardı zorlar, yere serer.",
					[
						"normal",
						"guardCrush",
						"knockdown",
						"kiCancel"
					]
				],
				[
					"Tekme",
					IN.kick,
					[K.K],
					D0.kick,
					[
						"normal",
						"strike",
						"guardCrush"
					]
				],
				[
					"Shuriken",
					IN.throw,
					[K.T],
					D0.throw,
					["throw"]
				],
				[
					"Kata-ate",
					IN.fl + " · " + IN.dash,
					[K.FL],
					"Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.",
					[
						"command",
						"dash",
						"strike",
						"guardCrush"
					]
				],
				[
					"Zutsuki",
					IN.bl,
					[K.BL],
					"Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.",
					["command", "strike"]
				],
				[
					"Oni-age",
					IN.fh + " · " + IN.dashH,
					[K.FH],
					"Fırlatıcı: aşağıdan yukarı iki elle savrulan kesik.",
					[
						"command",
						"launcher",
						"kiCancel"
					]
				],
				[
					"Kakato-otoshi",
					IN.bh,
					[K.BH],
					"Topuğu havaya kaldırıp balta gibi indirir: yere serer.",
					[
						"command",
						"strike",
						"knockdown",
						"kiCancel"
					]
				],
				[
					CN.ren.str1,
					IN.s1,
					KY.s1,
					"Dirsekten sonra kesik ve tepeden ezici iniş; son vuruş yere serer.",
					[
						"string",
						"guardCrush",
						"knockdown",
						"kiCancel"
					]
				],
				[
					CN.ren.str2,
					IN.s2,
					KY.s2,
					"Tekmenin ardından dönen topuk tekmesi; yere serer.",
					[
						"string",
						"strike",
						"knockdown",
						"kiCancel"
					]
				]
			]),
			kage: custom("kage", [
				[
					"Gyaku-giri · Tsumuji · Kage-fumi",
					IN.chain,
					KY.chain,
					"Ters tutuşla kesik, dönen kesik ve gölge adımı: kaybolup öne geçer, dürterek belirir.",
					[
						"normal",
						"string",
						"kiCancel"
					]
				],
				[
					"Kage-nui",
					IN.heavy,
					[K.H],
					"Sıçrayıp ters tutuşla aşağı saplar; yere serer.",
					[
						"normal",
						"knockdown",
						"kiCancel"
					]
				],
				[
					"Tekme",
					IN.kick,
					[K.K],
					D0.kick,
					[
						"normal",
						"strike",
						"guardCrush"
					]
				],
				[
					"Shuriken",
					IN.throw,
					[K.T],
					D0.throw,
					["throw"]
				],
				[
					"Shunpo",
					IN.fl + " · " + IN.dash,
					[K.FL],
					"Gölge gibi uzun atılma kesiği; seriye devam eder.",
					["command", "dash"]
				],
				[
					"Itsuwari",
					IN.bl,
					[K.BL],
					"Aldatma: kesecekmiş gibi parlar, dumanla geri kaçar. Erken savuşturmayı boşa çıkarır; hemen HAFİF ile gölge adımına, AĞIR ile Kage-nui’ye bağlanır.",
					["command", "feint"]
				],
				[
					"Tsuki-age",
					IN.fh + " · " + IN.dashH,
					[K.FH],
					"Fırlatıcı: ters tutuşla yükselen kesik.",
					[
						"command",
						"launcher",
						"kiCancel"
					]
				],
				[
					"Enmaku",
					IN.bh,
					[K.BH],
					"Ayağının dibine sis bombası atar: yakındakini sersemletir, Kage dumanın içinde geri kaçar.",
					["command", "strike"]
				],
				[
					CN.kage.str1,
					IN.s1,
					KY.s1,
					"Üç hızlı ters kesik ve aşağı saplama; sonuncusu yere serer.",
					[
						"string",
						"knockdown",
						"kiCancel"
					]
				],
				[
					CN.kage.str2,
					IN.s2,
					KY.s2,
					"Tekmeden sonra dumanda kaybolur, rakibin arkasında belirip saplar.",
					[
						"string",
						"knockdown",
						"kiCancel"
					]
				]
			]),
			kuro: fromTemplate("kuro", [
				"Nodachi serisi",
				"Ağır nodachi",
				"Yama-zuki",
				"Ashi-barai",
				"Kiriage",
				"Men-otoshi",
				"Tatsu-maki"
			]),
			yuki: fromTemplate("yuki", [
				"Kodachi serisi",
				"Ağır kesik",
				"Kitsune-zuki",
				"Ashi-barai",
				"Kiriage",
				"Men-otoshi",
				"Kaze-guruma"
			]),
			hana: fromTemplate("hana", [
				"Tantō dansı",
				"Çift kesik",
				"Hana-zuki",
				"Ashi-barai",
				"Hanabira-age",
				"Rakka",
				"Sakura-guruma"
			]),
			tetsu: fromTemplate("tetsu", [
				"Naginata serisi",
				"Ağır savuruş",
				"Ishizuki",
				"Suso-harai",
				"Kachiage",
				"Kabuto-wari",
				"Uzu-giri"
			]),
			tora: fromTemplate("tora", [
				"Zincir ve orak",
				"Zincir çekişi",
				"Kama-zuki",
				"Ashi-dori",
				"Kama-age",
				"Tora-otoshi",
				"Kusari-guruma"
			]),
			jin: fromTemplate("jin", [
				"Asa serisi",
				"Ağır süpürme",
				"Tsuki",
				"Ashi-barai",
				"Kachiage",
				"Tenbin-uchi",
				"Rinbu"
			]),
			mai: fromTemplate("mai", [
				"Yelpaze serisi",
				"Rüzgâr dalgası",
				"Ōgi-zuki",
				"Suso-harai",
				"Maiage",
				"Rakka",
				"Senpū"
			]),
			tsubame: fromTemplate("tsubame", [
				"Tantō serisi",
				"Ok (basılı tut: güçlü)",
				"Kogarasu-zuki",
				"Ashi-barai",
				"Kiriage",
				"Hiki-ya",
				"Tsubame-guruma"
			]),
			shura: fromTemplate("shura", [
				"Nodachi serisi",
				"Ağır nodachi",
				"Kata-ate",
				"Zutsuki",
				"Kiriage",
				"Kakato-otoshi",
				"Tatsu-maki"
			])
		};
		{
			const L = ND.MOVELIST.tsubame, i = L.findIndex((r) => r.nameTr === "Hiki-ya");
			if (i >= 0) L[i] = ent("Hiki-ya", IN.bh, [K.BH], "Geri + AĞIR da ok atar (basılı tut: güçlü atış); ok kalmadıysa tantō ile tepeden iner.", ["command"]);
		}
		for (const [id, nm] of [["tsubame", "Ok (basılı tut: güçlü)"], ["mai", "Rüzgâr dalgası"]]) {
			const r = ND.MOVELIST[id].find((m) => m.nameTr === nm);
			if (r) r.tags = r.tags.filter((t) => t !== "kiCancel");
		}
		{
			const L = ND.MOVELIST.shura, d = {
				"Kata-ate": "Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.",
				"Zutsuki": "Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.",
				"Kakato-otoshi": "Topuğu havaya kaldırıp balta gibi indirir: yere serer."
			};
			for (let i = 0; i < L.length; i++) if (d[L[i].nameTr]) {
				const r = L[i];
				L[i] = ent(r.nameTr, r.input, r.keys, d[r.nameTr], r.tags.concat(["strike"]));
			}
			const s2 = L.findIndex((r) => r.nameTr === CN.shura.str2);
			if (s2 >= 0) L[s2] = ent(CN.shura.str2, IN.s2, KY.s2, "Tekmenin ardından dönen topuk tekmesi; yere serer.", [
				"string",
				"strike",
				"knockdown",
				"kiCancel"
			]);
		}
		{
			const LEG = {
				name: "Nasıl okunur",
				kb: "→ rakibe doğru, ← rakipten uzağa demek: o yön tuşunu (A / D ya da ok tuşları; rakip sağındaysa D) basılı tut ve saldırı tuşuna bas. Virgül: tuşlara sırayla bas. F hafif, G ağır, R tekme, S gard.",
				touch: "▶ rakibe doğru, ◀ rakipten uzağa: o yön tuşunu basılı tut ve düğmeye dokun. Virgül: düğmelere sırayla dokun. Antrenmandaki Kombo denemesi her seriyi adım adım gösterir."
			};
			const tOn = () => !!(ND.touch && ND.touch.active);
			const legend = {
				get name() {
					return tr(LEG.name);
				},
				nameTr: LEG.name,
				input: "→ ←",
				keys: [["fwd"], ["back"]],
				get desc() {
					return tr(tOn() ? LEG.touch : LEG.kb);
				},
				get descTr() {
					return tOn() ? LEG.touch : LEG.kb;
				},
				tags: [],
				legend: true
			};
			for (const id in ND.MOVELIST) ND.MOVELIST[id].unshift(legend);
		}
	}
})(window.ND);
