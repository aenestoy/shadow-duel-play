(function(ND) {
	"use strict";
	const G = ND.game, au = ND.audio;
	if (!G || !G.saveState || !ND.FrameCtrl) return;
	const STEP = G.STEP;
	const HASH_EVERY = 60;
	const ROLL_MAX = 10, ROLL_WEAK = 6;
	const MAX_STEPS = 8;
	const WAIT_MS = 1e3, DROP_MS = 1e4;
	const PAUSE_LEAD = 24, PAUSE_MS = 6e4, RESUME_MS = 1800;
	const MAX_SEND = 64;
	const SND_KEEP = 2;
	const now = () => performance.now();
	const fnv = (h, x) => {
		h = Math.imul(h ^ x >> 16 & 255, 16777619);
		h = Math.imul(h ^ x >> 8 & 255, 16777619);
		return Math.imul(h ^ x & 255, 16777619) >>> 0;
	};
	const FNV0 = 2166136261;
	const hex8 = (n) => (n >>> 0).toString(16).padStart(8, "0");
	const PK_INPUT = 1;
	function encode(p) {
		const n = p.inputs.length, hb = p.hash ? 12 : 0;
		const b = new ArrayBuffer(18 + hb + n * 3), v = new DataView(b);
		v.setUint8(0, PK_INPUT);
		v.setUint8(1, p.m & 255);
		v.setUint32(2, p.first);
		v.setUint8(6, n);
		v.setUint32(7, p.ack);
		v.setUint32(11, p.frame);
		v.setInt16(15, Math.max(-32e3, Math.min(32e3, Math.round(p.adv * 16))));
		v.setUint8(17, (p.bg ? 1 : 0) | (p.hash ? 2 : 0));
		let o = 18;
		if (p.hash) {
			v.setUint32(o, p.hash[0]);
			v.setUint32(o + 4, parseInt(p.hash[1].slice(0, 8), 16) >>> 0);
			v.setUint32(o + 8, parseInt(p.hash[1].slice(8, 16), 16) >>> 0);
			o += 12;
		}
		for (let i = 0; i < n; i++, o += 3) {
			const x = p.inputs[i] & 4194303;
			v.setUint8(o, x >> 16);
			v.setUint16(o + 1, x & 65535);
		}
		return b;
	}
	function decode(b) {
		const v = new DataView(b);
		if (b.byteLength < 18 || v.getUint8(0) !== PK_INPUT) return null;
		const n = v.getUint8(6), fl = v.getUint8(17);
		const p = {
			m: v.getUint8(1),
			first: v.getUint32(2),
			ack: v.getUint32(7),
			frame: v.getUint32(11),
			adv: v.getInt16(15) / 16,
			bg: !!(fl & 1),
			hash: null,
			inputs: []
		};
		let o = 18;
		if (fl & 2) {
			if (b.byteLength < o + 12) return null;
			p.hash = [v.getUint32(o), v.getUint32(o + 4).toString(16).padStart(8, "0") + v.getUint32(o + 8).toString(16).padStart(8, "0")];
			o += 12;
		}
		if (b.byteLength < o + n * 3) return null;
		for (let i = 0; i < n; i++, o += 3) p.inputs.push(v.getUint8(o) << 16 | v.getUint16(o + 1));
		return p;
	}
	let S = null;
	function presGate(fn) {
		if (!S || !S.inStep) {
			try {
				fn();
			} catch (e) {
				console.warn("[net] presentation", e);
			}
			return;
		}
		if (S.cur < S.flushed) return;
		const list = S.pending.get(S.cur);
		if (list) list.push(fn);
	}
	const AU_FX = [
		"noise",
		"tone",
		"sample",
		"swoosh",
		"clang",
		"parry",
		"cut",
		"thud",
		"step",
		"whistle",
		"tick",
		"gong",
		"taiko",
		"ko",
		"whoosh",
		"hit",
		"synthHit",
		"block",
		"swing",
		"kShing",
		"kDraw",
		"kHit"
	];
	let depth = 0, curEv = null;
	function wrapAudio() {
		if (!au || au._netWrapped) return;
		au._netWrapped = true;
		for (const name of AU_FX) {
			const orig = au[name];
			if (typeof orig !== "function") continue;
			au[name] = function() {
				if (!S || !S.inStep || depth > 0 || G.presPart || S.cur < S.sndFloor) return orig.apply(this, arguments);
				const c = S.counts, key = name + "#" + (c[name] = (c[name] || 0) + 1);
				let list = S.snd.get(S.cur);
				if (!list) S.snd.set(S.cur, list = []);
				for (const e of list) if (e.key === key) {
					e.seen = true;
					return name === "sample" ? true : undefined;
				}
				const ev = {
					key,
					nodes: [],
					seen: true
				};
				list.push(ev);
				const q = au.quiet;
				if (G.simOnly) au.quiet = S.quiet0;
				depth++;
				curEv = ev;
				try {
					return orig.apply(this, arguments);
				} finally {
					depth--;
					curEv = null;
					au.quiet = q;
				}
			};
		}
		const out = au.out;
		if (typeof out === "function") au.out = function() {
			const g = out.apply(this, arguments);
			if (curEv && g) curEv.nodes.push(g);
			return g;
		};
	}
	function cancelSound(e) {
		const c = au && au.ctx;
		if (!c) return;
		const t = c.currentTime;
		for (const g of e.nodes) {
			try {
				const p = g.gain;
				p.cancelScheduledValues(t);
				p.setValueAtTime(p.value, t);
				p.linearRampToValueAtTime(0, t + .04);
			} catch (err) {}
		}
	}
	const net = ND.net = {
		active: false,
		encode,
		decode,
		begin(o) {
			this.stop();
			wrapAudio();
			const weak = !!(ND.gfx && ND.gfx.tier === "low");
			const D = Math.max(2, Math.min(5, o.delay | 0 || 2));
			S = {
				o,
				side: o.side ? 1 : 0,
				m: o.match & 255,
				ctrls: [new ND.FrameCtrl(), new ND.FrameCtrl()],
				frame: 0,
				L: [],
				nextLocal: D,
				D,
				R: [],
				rRecv: 0,
				used: [],
				saves: new Map(),
				hashAt: new Map(),
				finalMap: new Map(),
				finalH: [],
				myFinal: null,
				hashNext: 0,
				peerHash: new Map(),
				peerAck: 0,
				peerFrame: 0,
				peerAdv: 0,
				myAdv: 0,
				rtt: o.rtt > 0 ? o.rtt : 80,
				queue: [],
				acc: 0,
				lastT: 0,
				lastRecv: 0,
				started: false,
				goSent: false,
				peerGo: false,
				stallSince: 0,
				waitSince: 0,
				lastSkip: 0,
				lastDelay: 0,
				peerBg: false,
				bg: false,
				pending: new Map(),
				flushed: 0,
				snd: new Map(),
				sndFloor: 0,
				cur: -1,
				inStep: false,
				counts: null,
				quiet0: false,
				maxRoll: weak ? ROLL_WEAK : ROLL_MAX,
				weak,
				saveMs: [],
				st: {
					rollbacks: 0,
					rolledSteps: 0,
					maxRolled: 0,
					stalls: 0,
					skips: 0,
					packetsIn: 0,
					packetsOut: 0,
					soundsCancelled: 0,
					soundsLate: 0,
					desync: null,
					pauses: 0,
					saves: 0,
					hashes: 0,
					saveMs: 0,
					hashMs: 0,
					rollMs: 0,
					stepMs: 0
				},
				finished: false,
				result: null,
				pause: {
					mine: null,
					peer: null,
					at: -1,
					since: 0,
					resumeAt: 0
				},
				dig: [
					FNV0,
					FNV0,
					FNV0
				],
				digAt: new Map()
			};
			for (let i = 0; i < D; i++) S.L[i] = 0;
			G.newMatch("online", {
				c1: o.chars[0],
				c2: o.chars[1],
				arena: o.arena,
				seed: o.seed,
				side: S.side,
				ctrls: S.ctrls,
				looks: o.looks || null,
				speed: o.speed
			});
			const T = window.__ndNetTest;
			if (T && T.hp > 0 && T.hp < 1) for (const f of G.F) {
				f.maxHp = Math.max(1, Math.round(f.maxHp * T.hp));
				f.hp = f.ghost = f.maxHp;
			}
			ND.presGate = presGate;
			this.active = true;
			return S;
		},
		peerReady(m) {
			if (S && (m & 255) === S.m) S.peerGo = true;
		},
		receive(buf) {
			if (!S) return;
			let p = null;
			try {
				p = decode(buf);
			} catch (e) {
				p = null;
			}
			if (!p || p.m !== S.m) return;
			p.at = now();
			S.lastRecv = p.at;
			S.queue.push(p);
		},
		setRtt(ms) {
			if (S && ms > 0) S.rtt = ms;
		},
		setHidden(h) {
			if (S) S.bg = !!h;
		},
		keepalive() {
			if (S && S.goSent) this.sendInputs();
		},
		session() {
			return S;
		},
		isWaiting() {
			return !!(S && !S.finished && (S.waitSince || S.pause.at >= 0 && S.frame >= S.pause.at));
		},
		frame() {
			if (!S) return 0;
			const t0 = now();
			if (!S.started) {
				if (!S.goSent) {
					S.goSent = true;
					S.o.sendCtl({
						t: "go",
						m: S.m
					});
				}
				if (!S.peerGo) return 1;
				S.started = true;
				S.lastT = t0;
				S.lastRecv = Math.max(S.lastRecv, t0);
			}
			this.process();
			if (S.finished) {
				this.sendInputs();
				return 1;
			}
			const dt = Math.min(.25, Math.max(0, (t0 - S.lastT) / 1e3));
			S.lastT = t0;
			if (this.paused(t0)) {
				S.acc = 0;
				this.flush();
				this.sendInputs();
				return 1;
			}
			if (this.waiting(t0)) {
				S.acc = 0;
				this.sendInputs();
				return 1;
			}
			if (t0 - S.lastDelay > 2e3) {
				S.lastDelay = t0;
				this.adjustDelay();
			}
			S.acc += dt;
			let n = Math.floor(S.acc / STEP + .2);
			if (n > 0) S.acc -= n * STEP;
			if (n > 0 && (S.myAdv - S.peerAdv) / 2 >= 1 && t0 - S.lastSkip > 200) {
				n--;
				S.lastSkip = t0;
				S.st.skips++;
			}
			if (n > MAX_STEPS) {
				n = MAX_STEPS;
				S.acc = Math.min(S.acc, STEP);
			}
			G.inBatch = true;
			try {
				for (let i = 0; i < n; i++) {
					if (S.pause.at >= 0 && S.frame >= S.pause.at) {
						S.acc = 0;
						break;
					}
					if (S.frame >= S.rRecv + S.maxRoll) {
						if (!S.stallSince) S.stallSince = t0;
						S.st.stalls++;
						S.acc = Math.min(S.acc + (n - i) * STEP, 3 * STEP);
						break;
					}
					S.stallSince = 0;
					this.step();
				}
			} finally {
				G.inBatch = false;
			}
			this.flush();
			this.sendInputs();
			if (S && G.phase !== "replay") G.hud();
			return 1;
		},
		process() {
			if (!S.queue.length) return;
			const q = S.queue, old = S.rRecv;
			S.queue = [];
			for (const p of q) {
				S.st.packetsIn++;
				if (p.ack > S.peerAck) S.peerAck = Math.min(p.ack, S.nextLocal);
				if (p.frame >= S.peerFrame) {
					S.peerFrame = p.frame;
					S.peerAdv = p.adv;
					S.peerBg = p.bg;
					const est = p.frame + ((now() - p.at) / 1e3 + S.rtt / 2e3) / STEP;
					S.myAdv += (S.frame - est - S.myAdv) * .1;
				}
				for (let i = 0; i < p.inputs.length; i++) {
					const t = p.first + i;
					if (t >= S.rRecv && S.R[t] === undefined) S.R[t] = p.inputs[i];
				}
				if (p.hash) S.peerHash.set(p.hash[0], p.hash[1]);
			}
			while (S.R[S.rRecv] !== undefined) S.rRecv++;
			if (S.finished) return;
			const lim = Math.min(S.rRecv, S.frame);
			for (let t = old; t < lim; t++) if (S.used[t] !== S.R[t]) {
				this.rollback(t);
				break;
			}
		},
		rollback(m) {
			let s = m - (m & 1);
			while (s > 0 && !S.saves.has(s)) s -= 2;
			const st = S.saves.get(s);
			if (!st) {
				console.warn("[net] no saved state for step", m);
				return;
			}
			const n = S.frame - s;
			S.st.rollbacks++;
			S.st.rolledSteps += n;
			if (n > S.st.maxRolled) S.st.maxRolled = n;
			const turns = G.rally && G.rally.turns ? G.rally.turns.join() : "";
			const r0 = now();
			G.loadState(st);
			S.quiet0 = !!au.quiet;
			G.resim(n, (i) => {
				const t = s + i;
				if (i > 0) {
					if (this.needSave(t)) this.save(t);
					if (t % HASH_EVERY === 0) this.hash(t);
				}
				this.enter(t);
				this.apply(t);
			}, (i) => this.leave(s + i));
			S.inStep = false;
			S.st.rollMs += now() - r0;
			if (G.rally && G.rally.turns && G.rally.turns.join() !== turns && G.rallyHud) G.rallyHud();
		},
		step() {
			const t = S.frame;
			if (S.nextLocal <= t + S.D) {
				const I = ND.input, v = I.adLocked ? 0 : I.p1.frame();
				S.L[S.nextLocal++] = v;
				while (S.nextLocal <= t + S.D) S.L[S.nextLocal++] = v & 2098175;
			}
			const c0 = now();
			if (this.needSave(t)) this.saveCost(this.save(t));
			if (t % HASH_EVERY === 0) this.hash(t);
			this.enter(t);
			this.apply(t);
			try {
				G.tick(true);
			} finally {
				this.leave(t);
			}
			S.frame = t + 1;
			S.st.stepMs += now() - c0;
		},
		needSave(t) {
			return !(t & 1) && t >= S.rRecv - 1;
		},
		save(t) {
			const c0 = now();
			S.saves.set(t, G.saveState());
			const ms = now() - c0;
			S.st.saves++;
			S.st.saveMs += ms;
			return ms;
		},
		hash(t) {
			const c0 = now();
			S.hashAt.set(t, G.hashState());
			S.st.hashes++;
			S.st.hashMs += now() - c0;
		},
		apply(t) {
			const l = S.L[t], r = S.R[t] !== undefined ? S.R[t] : S.rRecv ? S.R[S.rRecv - 1] & 2098175 : 0;
			S.used[t] = r;
			S.ctrls[S.side].applyFrame(l);
			S.ctrls[1 - S.side].applyFrame(r);
		},
		enter(t) {
			S.cur = t;
			S.inStep = true;
			S.counts = Object.create(null);
			if (t >= S.flushed) S.pending.set(t, []);
			const a = S.snd.get(t);
			if (a) for (const e of a) e.seen = false;
		},
		leave(t) {
			S.inStep = false;
			const a = S.snd.get(t);
			if (!a) return;
			for (let i = a.length - 1; i >= 0; i--) if (!a[i].seen) {
				cancelSound(a[i]);
				a.splice(i, 1);
				S.st.soundsCancelled++;
			}
		},
		flush() {
			if (!S) return;
			const lim = Math.min(S.rRecv, S.frame);
			while (S && S.flushed < lim && !S.finished) {
				const t = S.flushed++;
				this.digest(t);
				const list = S.pending.get(t);
				S.pending.delete(t);
				if (list) for (const fn of list) {
					try {
						fn();
					} catch (e) {
						console.warn("[net] presentation", e);
					}
				}
			}
			if (!S) return;
			while (S.sndFloor < lim - SND_KEEP) S.snd.delete(S.sndFloor++);
			const keep = lim - (lim & 1);
			for (const k of S.saves.keys()) if (k < keep) S.saves.delete(k);
			while (S.hashNext <= lim && S.hashAt.has(S.hashNext)) {
				const h = S.hashNext, x = S.hashAt.get(h);
				S.finalH.push([h, x]);
				S.finalMap.set(h, x);
				S.myFinal = [h, x];
				S.hashAt.delete(h);
				if (S.finalMap.size > 64) S.finalMap.delete(S.finalMap.keys().next().value);
				S.hashNext += HASH_EVERY;
			}
			for (const k of S.hashAt.keys()) if (k < S.hashNext) S.hashAt.delete(k);
			for (const [h, x] of S.peerHash) {
				const mine = S.finalMap.get(h);
				if (mine === undefined) {
					if (h < S.hashNext - 64 * HASH_EVERY) S.peerHash.delete(h);
					continue;
				}
				S.peerHash.delete(h);
				if (mine !== x) {
					S.st.desync = {
						step: h,
						mine,
						theirs: x
					};
					console.warn("[net] out of sync at step", h, mine, x);
					this.end("desync", -1);
					return;
				}
			}
		},
		digest(t) {
			const a = S.side === 0 ? S.L[t] : S.R[t], b = S.side === 0 ? S.R[t] : S.L[t], x = (a | 0) & 4194303, y = (b | 0) & 4194303, d = S.dig;
			d[0] = fnv(d[0], x);
			d[1] = fnv(d[1], y);
			d[2] = fnv(fnv(d[2], x), y);
			if ((t + 1) % HASH_EVERY === 0) {
				S.digAt.set(t + 1, d.map(hex8));
				if (S.digAt.size > 64) S.digAt.delete(S.digAt.keys().next().value);
			}
		},
		finalAt(h) {
			return S ? S.finalMap.get(h) || null : null;
		},
		digests() {
			return S ? {
				step: S.flushed,
				dig: S.dig.map(hex8)
			} : null;
		},
		checkpoint() {
			if (!S || !S.myFinal) return null;
			const h = S.myFinal[0], d = S.digAt.get(h);
			return {
				step: h,
				hash: S.myFinal[1],
				dig: d || null,
				wins: G.wins.slice()
			};
		},
		inputLog() {
			if (!S) return "";
			const n = S.flushed, pack = (arr) => {
				const out = [];
				for (let i = 0; i < n;) {
					const v = (arr[i] | 0) & 4194303;
					let k = 1;
					while (i + k < n && ((arr[i + k] | 0) & 4194303) === v) k++;
					out.push(v.toString(36) + "," + k.toString(36));
					i += k;
				}
				return out.join(";");
			};
			const p1 = S.side === 0 ? S.L : S.R, p2 = S.side === 0 ? S.R : S.L;
			return "L1:" + pack(p1) + "." + pack(p2);
		},
		sendInputs() {
			if (!S) return;
			const first = Math.min(S.peerAck, S.nextLocal), n = Math.min(S.nextLocal - first, MAX_SEND);
			const buf = encode({
				m: S.m,
				first,
				inputs: S.L.slice(first, first + n),
				ack: S.rRecv,
				frame: S.frame,
				adv: S.myAdv,
				bg: S.bg,
				hash: S.myFinal
			});
			S.st.packetsOut++;
			try {
				S.o.send(buf);
			} catch (e) {}
		},
		setAway(why) {
			if (!S || !S.goSent || S.finished) return;
			why = why || null;
			const P = S.pause;
			if (why === P.mine) return;
			const was = P.mine;
			P.mine = why;
			if (why) {
				if (!was) this.pauseAt(Math.max(S.frame, S.peerFrame) + PAUSE_LEAD);
				S.o.sendCtl({
					t: "pause",
					m: S.m,
					at: P.at,
					why
				});
			} else S.o.sendCtl({
				t: "resume",
				m: S.m
			});
		},
		peerPause(m, at, why) {
			if (!S || (m & 255) !== S.m || S.finished || !(at >= 0)) return;
			S.pause.peer = why === "turn" ? "turn" : "away";
			this.pauseAt(at | 0);
		},
		peerResume(m) {
			if (S && (m & 255) === S.m) S.pause.peer = null;
		},
		pauseAt(at) {
			const P = S.pause;
			if (P.at < 0) {
				P.at = at;
				P.since = 0;
				P.resumeAt = 0;
				S.st.pauses++;
			} else P.at = Math.min(P.at, at);
		},
		paused(t0) {
			const P = S.pause;
			if (P.at < 0) return false;
			const away = !!(P.mine || P.peer);
			if (S.frame < P.at) {
				if (away) this.status("pause", {
					left: PAUSE_MS,
					mine: P.mine,
					peer: P.peer
				});
				return false;
			}
			if (!P.since) P.since = t0;
			if (away) {
				P.resumeAt = 0;
				const left = PAUSE_MS - (t0 - P.since);
				this.status("pause", {
					left: Math.max(0, left),
					mine: P.mine,
					peer: P.peer
				});
				if (left <= 0) this.end("pause", P.mine && !P.peer ? 1 - S.side : P.peer && !P.mine ? S.side : -1);
				return true;
			}
			if (!P.resumeAt) P.resumeAt = t0 + RESUME_MS;
			if (t0 < P.resumeAt) {
				this.status("count", { n: Math.max(1, Math.ceil((P.resumeAt - t0) / (RESUME_MS / 3))) });
				return true;
			}
			P.at = -1;
			P.since = 0;
			P.resumeAt = 0;
			S.lastT = t0;
			S.lastRecv = Math.max(S.lastRecv, t0);
			S.stallSince = 0;
			S.waitSince = 0;
			this.status("ok");
			return false;
		},
		isPaused() {
			return !!(S && S.pause.at >= 0 && S.frame >= S.pause.at);
		},
		waiting(t0) {
			if (S.pause.at >= 0) {
				S.stallSince = 0;
				S.waitSince = 0;
				return false;
			}
			if (S.frame < S.rRecv + S.maxRoll) S.stallSince = 0;
			const silent = t0 - S.lastRecv > WAIT_MS, stalled = S.stallSince && t0 - S.stallSince > WAIT_MS;
			if (silent || stalled || S.peerBg) {
				if (!S.waitSince) S.waitSince = t0;
				const left = DROP_MS - (t0 - S.waitSince);
				this.status("wait", {
					left: Math.max(0, left),
					away: S.peerBg && !silent
				});
				if (left <= 0) this.end("drop", S.side);
				return true;
			}
			if (S.waitSince) {
				S.waitSince = 0;
				S.lastT = t0;
				this.status("ok");
			}
			return false;
		},
		status(kind, info) {
			try {
				if (S && S.o.onStatus) S.o.onStatus(kind, info || {});
			} catch (e) {
				console.warn("[net] status", e);
			}
		},
		adjustDelay() {
			const oneWay = S.rtt / 2e3 / STEP;
			const want = Math.max(2, Math.min(4, Math.round(oneWay * .6))) + (S.weak ? 1 : 0);
			if (want > S.D) S.D++;
			else if (want < S.D) S.D--;
		},
		saveCost(ms) {
			if (S.weak || S.frame < 40) return;
			S.saveMs.push(ms);
			if (S.saveMs.length < 40) return;
			const avg = S.saveMs.reduce((a, b) => a + b, 0) / S.saveMs.length;
			S.saveMs.length = 0;
			if (avg > .45) {
				S.weak = true;
				S.maxRoll = ROLL_WEAK;
			}
		},
		matchEnded(winner) {
			this.end("ko", winner);
		},
		end(reason, winner) {
			if (!S || S.finished) return;
			S.finished = true;
			S.result = {
				reason,
				winner,
				side: S.side,
				wins: G.wins.slice(),
				round: G.round,
				frame: S.frame,
				stats: this.stats(),
				confirmed: S.flushed,
				dig: S.dig.map(hex8)
			};
			try {
				if (S.o.onEnd) S.o.onEnd(S.result);
			} catch (e) {
				console.warn("[net] end", e);
			}
		},
		stop() {
			this.active = false;
			if (ND.presGate === presGate) ND.presGate = null;
			if (S) {
				S.inStep = false;
				for (const [, a] of S.snd) for (const e of a) e.nodes.length = 0;
			}
			S = null;
		},
		stats() {
			if (!S) return null;
			return Object.assign({
				frame: S.frame,
				confirmed: Math.min(S.rRecv, S.frame),
				delay: S.D,
				maxRoll: S.maxRoll,
				weak: S.weak,
				rtt: Math.round(S.rtt),
				adv: +S.myAdv.toFixed(2),
				hashes: S.finalH.length
			}, S.st);
		}
	};
})(window.ND);
