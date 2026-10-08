(function(ND) {
	"use strict";
	const Math = ND.DM || globalThis.Math;
	const rnd = () => ND.rng.next(), rand = (a, b) => ND.rng.range(a, b);
	const KNOBS = ND.AI_KNOBS = {
		kiWait: 6,
		apprenticePlusK: .4,
		duelK: .6,
		duelSoft: 1,
		duelKch: {
			yuki: .5,
			shura: 1,
			kage: 1,
			aoi: .4,
			ren: .8,
			akane: 1,
			kuro: .4,
			mai: .2,
			tsubame: 1
		},
		duelK0ch: {
			akane: .8,
			aoi: .25,
			kuro: .1,
			shura: 1.3,
			tetsu: .55,
			jin: .65,
			tsubame: .2,
			hana: .3,
			ren: .6
		},
		duelDmg: {
			akane: .92,
			aoi: 1.19,
			kuro: 1.32,
			yuki: 1.15,
			ren: 1.06,
			kage: .86,
			shura: .72,
			tetsu: 1.05,
			jin: .97,
			tsubame: 1.08,
			hana: 1.05,
			mai: 1.08,
			tora: .9
		},
		duelChDmg: { kage: .85 },
		duelKAch: {
			aoi: 0,
			kuro: -.8,
			yuki: .1,
			tsubame: -.5,
			hana: -.2,
			mai: -.6,
			shura: 2,
			ren: .65,
			kage: 1.5
		},
		duelKUch: {
			kuro: -.2,
			tsubame: .3,
			yuki: .25,
			shura: 1.2,
			kage: 1.4,
			mai: .1,
			hana: .45,
			tetsu: 1,
			jin: 1
		},
		duelBindPlay: {
			0: 0,
			.5: .15,
			1: .55,
			2: .9,
			3: .95
		},
		duelBindPlayCh: {},
		duelSpeed: .85
	};
	ND.AI_KNOBS0 = { duelChDmg: Object.freeze(Object.assign({}, KNOBS.duelChDmg)) };
	const LEVELS = ND.AI_LEVELS = {
		0: {
			name: "Çırak",
			react: .3,
			parry: .12,
			guard: .55,
			dodge: .14,
			aggr: .46,
			combo: .5,
			tick: [.22, .42],
			smart: .3,
			mash: 4.5,
			counter: .45,
			rally: .4,
			cmd: .12,
			str: .22,
			jug: .2,
			kc: .15,
			read: .4
		},
		1: {
			name: "Usta",
			react: .2,
			parry: .4,
			guard: .74,
			dodge: .25,
			aggr: .6,
			combo: .78,
			tick: [.13, .27],
			smart: .68,
			mash: 7,
			counter: .7,
			rally: .7,
			cmd: .32,
			str: .52,
			jug: .55,
			kc: .5,
			read: .65
		},
		2: {
			name: "Efsane",
			react: .13,
			parry: .66,
			guard: .88,
			dodge: .36,
			aggr: .66,
			combo: .92,
			tick: [.07, .17],
			smart: .95,
			mash: 9.5,
			counter: .9,
			rally: .92,
			cmd: .48,
			str: .76,
			jug: .85,
			kc: .8,
			read: .85
		},
		3: {
			name: "Şura",
			react: .11,
			parry: .74,
			guard: .92,
			dodge: .38,
			aggr: .72,
			combo: .96,
			tick: [.05, .14],
			smart: 1,
			mash: 11,
			counter: .96,
			rally: .95,
			cmd: .52,
			str: .84,
			jug: .92,
			kc: .9,
			read: .92
		}
	};
	const derive = ND.aiDerive = () => {
		const a = LEVELS[0], b = LEVELS[1], k = KNOBS.apprenticePlusK, o = LEVELS[.5];
		for (const key of Object.keys(a)) {
			if (key === "name") continue;
			if (Array.isArray(a[key])) {
				const t = o[key] || (o[key] = []);
				a[key].forEach((v, i) => {
					t[i] = v + (b[key][i] - v) * k;
				});
			} else o[key] = a[key] + (b[key] - a[key]) * k;
		}
	};
	const FIRST = {
		react: .12,
		parry: .35,
		guard: .55,
		dodge: .45,
		aggr: .7,
		combo: .6,
		smart: .65,
		mash: .75,
		counter: .45,
		rally: .4,
		cmd: .4,
		str: .45,
		jug: .5,
		kc: .3,
		read: 0,
		tick: .09
	};
	const FIRST_KNOBS = {
		kick: .12,
		kickNear: .25,
		throwFar: .1,
		heavy: .12,
		jump: .05
	};
	const deriveFirst = () => {
		const a = LEVELS[0], o = LEVELS[.25];
		for (const key of Object.keys(a)) {
			if (key === "name") continue;
			const f = FIRST[key];
			if (Array.isArray(a[key])) {
				const t = o[key] || (o[key] = []);
				a[key].forEach((v, i) => {
					t[i] = v + (f || 0);
				});
			} else o[key] = key === "react" ? a[key] + f : f != null ? a[key] * f : a[key];
		}
		Object.assign(o, FIRST_KNOBS);
	};
	LEVELS[.5] = {};
	LEVELS[.25] = {};
	derive();
	deriveFirst();
	ND.aiDerive = () => {
		derive();
		deriveFirst();
	};
	Object.defineProperty(LEVELS[.5], "name", {
		get: () => LEVELS[0].name + "+",
		enumerable: true
	});
	Object.defineProperty(LEVELS[.25], "name", {
		get: () => LEVELS[0].name,
		enumerable: true
	});
	class AI {
		constructor(me, level) {
			if (ND.tune && !(ND.game && ND.game.ais && ND.game.ais.length)) ND.tune.commit();
			this.me = me;
			this.c = me.ctrl;
			this.lv = level && typeof level === "object" ? level : LEVELS[level] || LEVELS[1];
			this.held = {};
			this.taps = [];
			this.t = 0;
			this.next = .4;
			this.seen = null;
			this.pending = null;
			this.guardUntil = 0;
			this.move = 0;
			this.moveUntil = 0;
			this.chainDone = null;
			this.seenProj = new Set();
			this.ideal = this.idealFor();
			this.kiFullT = 0;
		}
		setHeld(a, on) {
			if (on && !this.held[a]) {
				this.c.press(a, "ai");
				this.held[a] = true;
			} else if (!on && this.held[a]) {
				this.c.release(a, "ai");
				this.held[a] = false;
			}
		}
		tap(a) {
			this.c.release(a, "ai");
			this.held[a] = false;
			this.c.press(a, "ai");
			this.taps.push(a);
		}
		releaseAll() {
			for (const a in this.held) this.setHeld(a, false);
			this.move = 0;
		}
		update(dt) {
			const me = this.me, o = me.opp, lv = this.lv;
			this.t += dt;
			for (const a of this.taps) if (!this.held[a]) this.c.release(a, "ai");
			this.taps.length = 0;
			if (this.holdT && this.t >= this.holdT) {
				this.setHeld("heavy", false);
				this.holdT = 0;
			}
			if (me.locked || me.dead || o.dead) {
				this.releaseAll();
				return;
			}
			this.kiFullT = me.ki >= 100 ? this.kiFullT + dt : 0;
			if (me.state === "lock") {
				this.mashT = (this.mashT || 0) - dt;
				if (this.mashT <= 0) {
					this.tap(rnd() < .7 ? "light" : "heavy");
					this.mashT = rand(.8, 1.25) / lv.mash;
				}
				return;
			}
			const dist = Math.abs(o.x - me.x), fwd = o.x >= me.x ? 1 : -1;
			const G = ND.game;
			if (me.counterUntil > G.clock && me.serial !== this.cTok && [
				"block",
				"parry",
				"guard",
				"move"
			].includes(me.state)) {
				this.cTok = me.serial;
				if (rnd() < lv.counter) {
					const r = rnd();
					this.cAct = r < .12 ? "heavy" : "light";
					this.cDir = r < .12 ? 0 : r < .24 ? 1 : r < .34 ? -1 : 0;
					this.cAt = this.t + rand(.02, Math.min(.16, me.counterWin * .55));
				}
			}
			if (this.cAt && this.t >= this.cAt) {
				this.cAt = 0;
				if (me.counterUntil > G.clock) {
					this.setHeld("guard", false);
					this.guardUntil = 0;
					if (this.cDir) this.moveDir(this.cDir * fwd);
					else {
						this.move = 0;
						this.setHeld("left", false);
						this.setHeld("right", false);
					}
					this.tap(this.cAct);
				}
			}
			if (me.state === "hurt" && this.hTok !== me.serial) {
				this.hTok = me.serial;
				if (rnd() < lv.read * Math.min(1, this.heat() * .4)) {
					this.setHeld("guard", true);
					this.guardUntil = this.t + Math.max(0, me.dur - me.st) + rand(.2, .4);
					this.move = 0;
				}
			}
			if (me.state === "recoil" && this.rTok !== me.serial) {
				this.rTok = me.serial;
				if (rnd() < lv.rally) {
					this.anticipate = this.t + .9;
					this.setHeld("guard", true);
					this.guardUntil = this.t + .7;
					this.move = 0;
				}
			}
			if (o.state === "atk" && o.keys !== this.seen) {
				this.seen = o.keys;
				const a = o.atk;
				if (!a.counter) this.note(o.atkName);
				const longer = a.reach ? 0 : Math.max(0, o.ch.blade + (o.ch.handle || 0) - 120) * 1.1;
				const threat = a.kind === "throw" || a.kind === "shoot" || a.kind === "stance" || !a.active ? false : dist < (a.special ? 700 : a.reach || (a === ND.ATK.light3 || a === ND.ATK.heavy ? 290 : 235) + longer);
				if (threat && a.counter && this.anticipate > this.t) {
					const startAt = this.t - o.st / (o.ch.spd * o.aspd), w0 = a.active[0] / (o.ch.spd * o.aspd);
					if (rnd() < lv.parry + .2) this.pending = {
						act: "parry",
						at: startAt + w0 - rand(.03, .08),
						until: startAt + w0 + .25
					};
					else {
						this.setHeld("guard", true);
						this.guardUntil = Math.max(this.guardUntil, startAt + w0 + .3);
					}
				} else if (threat && a.active && rnd() < this.readP()) {
					const k = o.ch.spd * o.aspd, startAt = this.t - o.st / k, w0 = startAt + a.active[0] / k;
					const parry = rnd() < lv.parry + .25;
					this.pending = {
						act: "guard",
						at: Math.max(this.t, w0 - (parry ? rand(.03, .08) : rand(.12, .2))),
						until: startAt + a.active[1] / k + .14
					};
				} else if (threat) {
					const r = rnd(), startAt = this.t - o.st;
					const ak = ND.atkSlow ? ND.atkSlow(o) : 1;
					let act = "none";
					if (a.kind === "kick") act = r < lv.dodge + .25 ? "dodge" : r < lv.dodge + .25 + lv.smart * .4 ? "jab" : "guard";
					else if (r < lv.parry) act = "parry";
					else if (r < lv.parry + lv.dodge * .6) act = "dodge";
					else if (a === ND.ATK.heavy && rnd() < lv.smart * .6 && dist < 200) act = "jab";
					else if (r < lv.parry + lv.dodge * .6 + lv.guard * .8) act = "guard";
					let at = startAt + lv.react + rand(0, .05);
					if (act === "parry") {
						const ideal = startAt + (ak !== 1 ? a.active[0] / ak : a.active[0]) - rand(.04, .1);
						if (ideal >= at) at = ideal;
						else act = "guard";
					}
					this.pending = {
						act,
						at,
						until: startAt + (a.active ? a.active[1] : a.dur) / ak + .12
					};
				}
			}
			if (this.seenProj.size > 12) {
				for (const p of this.seenProj) if (!ND.game.projs.includes(p)) this.seenProj.delete(p);
			}
			for (const p of ND.game.projs) {
				if (p.owner === me || p.falling || p.stuck || this.seenProj.has(p)) continue;
				const d = (me.x - p.x) * Math.sign(p.vx);
				if (d > 0 && d < 520) {
					this.seenProj.add(p);
					const r = rnd();
					const eta = d / Math.abs(p.vx);
					if (r < lv.parry * .7) this.pending = {
						act: "parry",
						at: this.t + Math.max(lv.react * .6, eta - .1),
						until: this.t + eta + .1
					};
					else if (r < lv.guard) this.pending = {
						act: "guard",
						at: this.t + lv.react * .7,
						until: this.t + eta + .15
					};
					else if (r < lv.guard + .15) this.pending = {
						act: "jump",
						at: this.t + lv.react,
						until: 0
					};
				}
			}
			if (this.pending && this.t >= this.pending.at) {
				const p = this.pending;
				this.pending = null;
				const free = me.state === "move" || me.state === "guard" || me.state === "block" || me.state === "land" || me.state === "parry" || me.state === "recoil";
				if (free) {
					if ((p.act === "guard" || p.act === "parry") && me.state === "move" && this.catchMove() && o.state === "atk" && !o.atk.special && rnd() < lv.smart * .3) {
						this.setHeld("guard", false);
						this.dirTap("heavy", -fwd);
					} else if (p.act === "guard" || p.act === "parry") {
						this.setHeld("left", false);
						this.setHeld("right", false);
						this.move = 0;
						this.tap("guard");
						this.setHeld("guard", true);
						this.guardUntil = Math.max(p.until, this.t + .12);
					} else if (p.act === "dodge") {
						this.moveDir(-fwd);
						this.tap("dodge");
					} else if (p.act === "jab") {
						this.dirTap(rnd() < .5 ? "light" : "kick", 0);
					} else if (p.act === "jump") {
						this.tap("up");
					}
				}
			}
			if (this.held.guard && this.t > this.guardUntil) this.setHeld("guard", false);
			if (me.state === "atk" && me.atk.chain && (me.hitDone || me.atk.kind === "feint") && this.chainDone !== me.keys && me.st >= me.atk.chain[0]) {
				this.chainDone = me.keys;
				this.chainPick(me, o, fwd);
			}
			if (me.state === "atk" && me.atk.sc && me.hitDone && me.ki >= 100 && this.kcTok !== me.keys && me.mem.landed != null) {
				this.kcTok = me.keys;
				if (rnd() < lv.kc) this.tap("special");
			}
			if (this.t >= this.next && !this.held.guard) {
				this.next = this.t + rand(lv.tick[0], lv.tick[1]);
				this.decide(dist, fwd);
			}
			if (this.move && this.t > this.moveUntil) this.move = 0;
			const canMove = !this.held.guard;
			this.setHeld("right", canMove && this.move > 0);
			this.setHeld("left", canMove && this.move < 0);
		}
		moveDir(d) {
			this.move = d;
			this.moveUntil = this.t + .3;
			this.setHeld("right", d > 0);
			this.setHeld("left", d < 0);
		}
		dirTap(btn, d) {
			this.move = d;
			this.moveUntil = this.t + (d ? .14 : 0);
			this.setHeld("right", d > 0);
			this.setHeld("left", d < 0);
			this.tap(btn);
		}
		catchMove() {
			const K = ND.KITS && ND.KITS[this.me.ch.id], a = K && ND.ATK[K.bHeavy];
			return !!(a && a.catch);
		}
		chainPick(me, o, fwd) {
			const lv = this.lv, R = ND.routesFor ? ND.routesFor(me, me.atkName) : null, hit = me.mem.landed != null;
			if (!R) {
				if (rnd() < lv.combo) {
					const oppGuard = o.state === "block" || o.state === "guard";
					this.tap(oppGuard && rnd() < lv.smart ? "kick" : rnd() < .18 ? "heavy" : "light");
				}
				return;
			}
			if (R.hit && !hit) return;
			const air = o.state === "launch" && (o.jug || 0) < (ND.COMBO && ND.COMBO.jugMax || 3);
			if (me.atkName === "fHeavy" || me.atkName === "chase") {
				if (air && rnd() < lv.jug) this.dirTap(R.light ? "light" : "heavy", 0);
				return;
			}
			if (rnd() >= lv.combo) return;
			const oppGuard = o.state === "block" || o.state === "guard", r = rnd();
			if (R.fHeavy && hit && !oppGuard && r < lv.str * .35) return this.dirTap("heavy", fwd);
			if (R.heavy && r < lv.str) return this.dirTap("heavy", 0);
			if (R.kick && oppGuard && rnd() < lv.smart) return this.dirTap("kick", 0);
			if (R.light) return this.dirTap("light", 0);
			if (R.heavy) return this.dirTap("heavy", 0);
		}
		decide(dist, fwd) {
			const me = this.me, o = me.opp, lv = this.lv, r = rnd();
			const free = me.state === "move" || me.state === "land";
			if (!free) return;
			if (o.state === "down" || o.state === "getup") {
				this.go(dist < 200 ? -fwd : 0, .3);
				return;
			}
			const spR = ND.SPECIALS && ND.SPECIALS[me.ch.id] && ND.SPECIALS[me.ch.id].range || [90, 520];
			if (me.ki >= 100 && dist > spR[0] && dist < spR[1]) {
				const opening = o.state === "stagger" || o.state === "gbreak" || o.state === "atk" && o.atk.kind !== "throw" && dist > Math.min(260, spR[1] * .5);
				if (opening || rnd() < (lv.ki ?? lv.smart * .25) || this.kiFullT > KNOBS.kiWait) {
					this.tap("special");
					return;
				}
			}
			if ((o.state === "stagger" || o.state === "gbreak") && dist < 210) {
				this.dirTap(o.state === "gbreak" || r < .5 ? "heavy" : "light", 0);
				return;
			}
			if (o.state === "hurt" && o.dur - o.st > .25 && dist < Math.max(170, this.ideal + 20) && r < lv.smart * .8) {
				this.dirTap("light", 0);
				return;
			}
			if (o.state === "launch") {
				this.go(fwd, .2);
				return;
			}
			if (o.state === "recoil" && dist < this.ideal + 50 && r < lv.counter) {
				this.dirTap(rnd() < .25 ? "heavy" : "light", 0);
				return;
			}
			const heat = this.heat();
			if (heat >= 3 && dist < this.oppReach(o) + 60 && o.state !== "recoil" && rnd() < lv.read * Math.min(1, (heat - 2) * .5)) {
				this.setHeld("guard", true);
				this.guardUntil = this.t + rand(.3, .6);
				return;
			}
			if (me.posture > 70 && r < lv.smart) {
				this.go(-fwd, .4);
				if (rnd() < .3) {
					this.moveDir(-fwd);
					this.tap("dodge");
				}
				return;
			}
			const Z = me.ch.ai, zoner = !!(Z && Z.zoner);
			if (zoner && this.zone(dist, fwd, r)) return;
			const oZ = o.ch.ai && o.ch.ai.zoner;
			if (oZ && !zoner && dist > 240 && r < .55 - lv.smart * .2) {
				this.moveDir(fwd);
				this.tap("dodge");
				return;
			}
			if (dist > 380) {
				if (me.ammo > 0 && r < (lv.throwFar ?? .22) && !zoner) {
					this.tap("throw");
					return;
				}
				if (r < (lv.jump ?? .1)) {
					this.go(fwd, .35);
					this.tap("up");
					return;
				}
				this.go(fwd, .35);
				return;
			}
			if (dist > this.ideal + 40) {
				if (r < lv.aggr * .25 && dist < 300) {
					this.go(fwd, .2);
					this.tap("light");
					return;
				}
				if (me.ammo > 0 && r > .93 && !zoner) {
					this.tap("throw");
					return;
				}
				this.go(fwd, rand(.15, .35));
				return;
			}
			if (dist < 70) {
				const kn = lv.kickNear ?? .45;
				if (r < kn) {
					this.dirTap("kick", 0);
					return;
				}
				if (r < kn + .25) {
					this.moveDir(-fwd);
					this.tap("dodge");
					return;
				}
			}
			if (o.state === "atk" && o.atk.catch && o.st < o.atk.catch[1] && rnd() < lv.smart) {
				if (me.ammo > 0 && dist > 160 && rnd() < .5) this.tap("throw");
				else this.go(-fwd, .2);
				return;
			}
			if (o.state === "atk" && o.atk.kind !== "throw" && o.atk.kind !== "stance" && rnd() < lv.guard) {
				this.setHeld("guard", true);
				this.guardUntil = this.t + rand(.35, .6);
				return;
			}
			if (r < lv.aggr) {
				const oppGuard = o.state === "guard" || o.state === "block";
				const rr = rnd();
				if (oppGuard && rr < (lv.kick ?? .35) + lv.smart * .3) this.dirTap("kick", 0);
				else if (rnd() < Math.max(lv.cmd, Z && Z.cmd || 0)) this.cmdOpener(dist, fwd, oppGuard);
				else if (rr < (lv.heavy ?? .2)) this.dirTap("heavy", 0);
				else if (rr < .28 && me.ammo > 0 && dist > 200 && !zoner) this.tap("throw");
				else this.dirTap("light", 0);
				return;
			}
			const rr = rnd();
			if (rr < .35) this.go(-fwd, rand(.12, .3));
			else if (rr < .6) this.go(fwd, rand(.1, .2));
			else if (rr < .6 + lv.smart * .25) {
				this.setHeld("guard", true);
				this.guardUntil = this.t + rand(.3, .7);
			} else this.go(0, .2);
			this.ideal = this.idealFor();
		}
		cmdOpener(dist, fwd, oppGuard) {
			const r = rnd(), catchK = this.catchMove();
			if (oppGuard && r < .5) return catchK ? this.dirTap("kick", 0) : this.dirTap("heavy", -fwd);
			if (dist < 130 && r < .35) return this.dirTap("light", -fwd);
			if (r < .65) return this.dirTap("heavy", fwd);
			if (dist > 150) return this.dirTap("light", fwd);
			return this.dirTap("heavy", catchK ? fwd : -fwd);
		}
		zone(dist, fwd, r) {
			const me = this.me, o = me.opp, lv = this.lv;
			const room = ND.ARENA + me.x * fwd;
			const cornered = room < 170;
			const open = o.state === "atk" || o.state === "recoil" || o.state === "land" || o.state === "hurt" || o.state === "getup" || o.state === "air" || o.state === "dodge";
			const guarding = o.state === "guard" || o.state === "block" || o.state === "parry";
			const k = Math.pow(lv.smart, 2.5);
			if (dist < 170) {
				if (cornered) {
					if (r < .2 + lv.smart * .3) {
						this.moveDir(fwd);
						this.tap("dodge");
						return true;
					}
					return false;
				}
				if (me.ammo > 0 && r < .3 + lv.smart * .3) {
					this.tap("throw");
					return true;
				}
				if (r < .4 + .3 * lv.smart) {
					this.moveDir(-fwd);
					this.tap("dodge");
					return true;
				}
				return false;
			}
			if (me.ammo > 0 && dist > 190) {
				const p = (guarding ? .2 : open ? .55 + .35 * lv.smart : .55) * k;
				if (r < p) {
					const charge = dist > 400 && !open && rnd() < .35 + .4 * lv.smart;
					this.dirTap("heavy", 0);
					this.held.heavy = true;
					this.holdT = this.t + (charge ? rand(.45, .8) : rand(.02, .1));
					return true;
				}
			}
			if (!cornered && dist < this.ideal - 60 && r < .5 + .3 * lv.smart) {
				this.go(-fwd, rand(.2, .4));
				return true;
			}
			if (!me.ammo && dist > 200 && dist < 420 && r < .5) {
				this.go(-fwd, rand(.15, .3));
				return true;
			}
			return false;
		}
		note(name) {
			const H = this.hist || (this.hist = []);
			H.push({
				t: this.t,
				n: name
			});
			while (H.length > 10 || H.length && H[0].t < this.t - 4) H.shift();
		}
		heat() {
			const H = this.hist;
			let n = 0;
			if (H) {
				for (const h of H) if (h.t > this.t - 3) n++;
			}
			return n;
		}
		readP() {
			const H = this.hist, lv = this.lv;
			if (!H || H.length < 2 || !lv.read) return 0;
			const last = H[H.length - 1].n;
			let rep = 0;
			for (const h of H) if (h.n === last && h.t > this.t - 2.5) rep++;
			return lv.read * Math.min(1, (rep - 1) * .35 + Math.max(0, this.heat() - 2) * .15);
		}
		oppReach(o) {
			return 150 + Math.max(0, o.ch.blade + (o.ch.handle || 0) - 60) * .9;
		}
		idealFor() {
			const Z = this.me.ch.ai;
			return Z && Z.ideal ? rand(-25, 25) + Z.ideal : rand(-18, 18) + (this.lv && this.lv.range > 0 ? this.lv.range : 88 + this.me.ch.blade * .72);
		}
		go(d, dur) {
			this.move = d;
			this.moveUntil = this.t + dur;
		}
	}
	ND.AI = AI;
})(window.ND);
