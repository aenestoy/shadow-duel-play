(function(ND) {
	"use strict";
	const now = () => typeof ND.simClock === "number" ? ND.simClock : performance.now() / 1e3;
	const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
	const ACTS = [
		"left",
		"right",
		"up",
		"guard",
		"light",
		"heavy",
		"kick",
		"throw",
		"dodge",
		"special"
	];
	const CTX_EDGE = 1 << 30;
	const BIT = {};
	ACTS.forEach((a, i) => BIT[a] = 1 << i);
	const GUARD_MIN = 180;
	const guardHold = (c) => {
		const F = ND.game && ND.game.F, f = c.owner || F && (F[1] && F[1].ctrl === c ? F[1] : F[0]);
		return Math.max(GUARD_MIN / 1e3, f && ND.parryWin ? ND.parryWin(f) + .017 : 0);
	};
	const keyOrPad = (src) => src.length > 1 && (src[0] === "k" && src[1] >= "A" && src[1] <= "Z" || src[0] === "g" && src[1] >= "0" && src[1] <= "9");
	const ENDS_GX = {
		left: 1,
		right: 1,
		up: 1,
		dodge: 1
	};
	class Ctrl {
		constructor() {
			this.mask = null;
			this.lastSrc = "";
			this.clear();
		}
		clear() {
			this.srcs = {};
			this.buf = {};
			this.lastTap = {
				left: -9,
				right: -9
			};
			this.tapDir = 0;
			this.edges = 0;
			this.gT = null;
			this.gx = null;
			this.swQ = null;
			this.dashT = null;
		}
		press(a, src = "k") {
			const s = this.srcs[a] || (this.srcs[a] = new Set());
			const was = s.size > 0;
			s.add(src);
			if (src !== "tut") this.lastSrc = src;
			if (was) return;
			if (this.mask && this.mask[a] && src !== "tut") {
				if (a === "guard") this.gT = null;
				if (this.maskAlias && src[0] === "t" && !this.mask[this.maskAlias]) this.buffer(this.maskAlias);
				return;
			}
			this.edges |= BIT[a] || (a === "ctx" ? CTX_EDGE : 0);
			this.buffer(a);
			if (a === "guard") this.gT = now();
			else if (ENDS_GX[a]) this.gx = null;
		}
		step() {
			if (this.gx != null && now() >= this.gx) this.gx = null;
			const q = this.swQ;
			if (q && now() > q.t) {
				this.swQ = null;
				if (!(this.mask && this.mask[q.a]) && !(this.dashT != null && this.dashT >= q.t)) {
					this.edges |= BIT[q.a];
					this.buffer(q.a);
				}
			}
		}
		swipe(a, src) {
			if (this.mask && this.mask[a] || this.noTap) return false;
			if (this.dashT != null && this.dashT === this.lastTap[a] && now() - this.dashT < .24) return true;
			if (!(now() - this.lastTap[a] < .24)) {
				this.press(a, src);
				this.release(a, src);
			}
			this.swQ = {
				a,
				t: now()
			};
			return true;
		}
		guardHold() {
			return guardHold(this);
		}
		buffer(a) {
			const t = now();
			this.buf[a] = t;
			if (!this.noTap && (a === "left" || a === "right")) {
				if (t - this.lastTap[a] < .24) {
					this.buf.dodge = t;
					this.tapDir = a === "left" ? -1 : 1;
					this.dashT = t;
				}
				this.lastTap[a] = t;
			}
			if (a === "dodge") this.tapDir = 0;
			if (this.onPress) {
				try {
					this.onPress(a, t);
				} catch (e) {}
			}
		}
		release(a, src = "k") {
			const s = this.srcs[a];
			if (!s || !s.delete(src)) return;
			if (a === "guard" && !s.size && this.gT != null && keyOrPad(src)) {
				const until = this.gT + guardHold(this);
				if (now() < until) this.gx = until;
			}
		}
		held(a) {
			const s = this.srcs[a];
			if (s && s.size) return !this.mask || !this.mask[a] || s.has("tut");
			return a === "guard" && this.gx != null && (!this.mask || !this.mask.guard);
		}
		axis() {
			return (this.held("right") ? 1 : 0) - (this.held("left") ? 1 : 0);
		}
		has(a, win = .2) {
			const t = this.buf[a];
			return t != null && now() - t <= win;
		}
		take(a, win = .2) {
			if (this.has(a, win)) {
				this.buf[a] = null;
				return true;
			}
			return false;
		}
		since(a) {
			const t = this.buf[a];
			return t == null ? 99 : now() - t;
		}
		frame() {
			this.step();
			const ce = this.edges & CTX_EDGE;
			let v = (this.edges & ~CTX_EDGE) << 10;
			this.edges = 0;
			for (let i = 0; i < ACTS.length; i++) if (this.held(ACTS[i])) v |= 1 << i;
			if (ce) v |= 1 << 20;
			if (this.held("ctx")) v |= 1 << 21;
			return v;
		}
	}
	class FrameCtrl extends Ctrl {
		clear() {
			super.clear();
			this.hm = 0;
		}
		held(a) {
			return a === "ctx" ? !!this.hc : (this.hm & (BIT[a] || 0)) !== 0;
		}
		applyFrame(v) {
			for (let i = 0; i < ACTS.length; i++) if (v & 1 << 10 + i) this.buffer(ACTS[i]);
			if (v & 1 << 20) this.buffer("ctx");
			this.hm = v & 1023;
			this.hc = (v & 1 << 21) !== 0;
		}
	}
	Ctrl.ACTS = ACTS;
	Ctrl.BIT = BIT;
	const KEYMAP = {
		p1: {
			KeyA: "left",
			KeyD: "right",
			KeyW: "up",
			KeyS: "guard",
			KeyF: "light",
			KeyG: "heavy",
			KeyR: "kick",
			KeyT: "throw",
			ShiftLeft: "dodge",
			KeyE: "special"
		},
		p2: {
			ArrowLeft: "left",
			ArrowRight: "right",
			ArrowUp: "up",
			ArrowDown: "guard",
			KeyK: "light",
			KeyL: "heavy",
			KeyO: "kick",
			KeyI: "throw",
			ShiftRight: "dodge",
			KeyU: "special",
			Numpad3: "special",
			Numpad1: "light",
			Numpad2: "heavy",
			Numpad4: "kick",
			Numpad5: "throw",
			Numpad0: "dodge"
		}
	};
	const mm = (q) => {
		try {
			return window.matchMedia(q).matches;
		} catch (e) {
			return false;
		}
	};
	const UA = navigator.userAgent || "";
	const touch = ND.touch = {
		capable: false,
		active: false,
		coarse: false,
		forced: null,
		kb: false,
		pad: false,
		mobile: false,
		fns: [],
		detect() {
			const h = (location.hash || "").toLowerCase();
			let forced = /\bnotouch\b/.test(h) ? false : /\btouch\b/.test(h) ? true : null;
			if (typeof ND.forceTouch === "boolean") forced = ND.forceTouch;
			this.forced = forced;
			this.coarse = mm("(pointer: coarse)");
			this.capable = this.coarse || "ontouchstart" in window || (navigator.maxTouchPoints || 0) > 0;
			if (forced === true) this.capable = true;
			this.set(forced != null ? forced : this.coarse, true);
		},
		force(v) {
			ND.forceTouch = v;
			this.detect();
		},
		set(v, init) {
			v = !!v;
			if (!init && this.forced != null && v !== this.forced) return;
			if (v === this.active && !init) return;
			this.active = v;
			const app = document.getElementById("app");
			if (app) app.classList.toggle("touch", v);
			this.swapTexts();
			this.notify();
		},
		notify() {
			for (const fn of this.fns) {
				try {
					fn(this.active);
				} catch (e) {}
			}
		},
		onChange(fn) {
			this.fns.push(fn);
		},
		hasPad() {
			try {
				const l = navigator.getGamepads ? navigator.getGamepads() : [];
				for (const g of l) if (g && g.connected) return true;
			} catch (e) {}
			return false;
		},
		twoPlayerOk() {
			return !this.active || this.kb || this.pad || this.hasPad();
		},
		swapTexts() {
			const STR = ND.STR, get = (p) => STR && p ? p.split(".").reduce((o, k) => o ? o[k] : undefined, STR) : undefined;
			document.querySelectorAll("[data-t]").forEach((el) => {
				if (el.dataset.k == null) el.dataset.k = el.innerHTML;
				const t = get(el.dataset.t), k = get(el.dataset.tk);
				el.innerHTML = this.active && typeof t === "string" ? t : typeof k === "string" ? k : el.dataset.k;
			});
		}
	};
	touch.mobile = mm("(pointer: coarse)") || /Android|iPhone|iPad|iPod|Mobile/i.test(UA) || /Macintosh/.test(UA) && (navigator.maxTouchPoints || 0) > 1;
	touch.lowEnd = touch.mobile && ((navigator.deviceMemory || 8) <= 4 || (navigator.hardwareConcurrency || 8) <= 4);
	const editable = (t) => !!(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || "")));
	const shortcut = (e) => e.ctrlKey || e.metaKey || e.altKey;
	const KEY2CODE = {
		" ": "Space",
		Spacebar: "Space",
		Esc: "Escape",
		Escape: "Escape",
		Backspace: "Backspace",
		Enter: "Enter",
		Tab: "Tab",
		ArrowLeft: "ArrowLeft",
		ArrowRight: "ArrowRight",
		ArrowUp: "ArrowUp",
		ArrowDown: "ArrowDown",
		Left: "ArrowLeft",
		Right: "ArrowRight",
		Up: "ArrowUp",
		Down: "ArrowDown",
		Shift: "ShiftLeft"
	};
	const fixCode = (e) => {
		if (e.code || typeof e.key !== "string") return;
		let c = KEY2CODE[e.key];
		if (!c && /^[a-z]$/i.test(e.key)) c = "Key" + e.key.toUpperCase();
		else if (!c && /^\d$/.test(e.key)) c = "Digit" + e.key;
		if (c) {
			try {
				Object.defineProperty(e, "code", { value: c });
			} catch (err) {}
		}
	};
	window.addEventListener("keydown", fixCode, true);
	window.addEventListener("keyup", fixCode, true);
	const input = ND.input = {
		p1: new Ctrl(),
		p2: new Ctrl(),
		solo: false,
		enabled: true,
		onKey: null,
		onPause: null,
		pads: {},
		adLocked: false,
		KEYMAP,
		escAllowed: ND.portalName !== "xportalc",
		isPause(e) {
			return !!e && !e.repeat && !editable(e.target) && !shortcut(e) && (e.code === "KeyP" || input.escAllowed && e.code === "Escape");
		},
		isBack(e) {
			return !!e && !e.repeat && !editable(e.target) && !shortcut(e) && (e.code === "Backspace" || input.escAllowed && e.code === "Escape");
		},
		isEditable: editable,
		route(code) {
			if (KEYMAP.p1[code]) return [input.p1, KEYMAP.p1[code]];
			if (KEYMAP.p2[code]) return [input.solo ? input.p1 : input.p2, KEYMAP.p2[code]];
			return null;
		},
		init() {
			touch.detect();
			window.addEventListener("keydown", (e) => {
				if (e.isTrusted && !e.repeat && !/^(Shift|Control|Alt|Meta)/.test(e.key || "") && e.key !== "Unidentified") {
					const first = !touch.kb;
					touch.kb = true;
					if (touch.active && touch.forced == null) touch.set(false);
					else if (first) touch.notify();
				}
				learnKey(e);
				if (input.adLocked) {
					if (!shortcut(e) && !editable(e.target)) e.preventDefault();
					return;
				}
				if (input.onKey && input.onKey(e)) {
					e.preventDefault();
					return;
				}
				if (editable(e.target) || shortcut(e)) return;
				if (e.code === "KeyP" && input.onPause) {
					e.preventDefault();
					if (!e.repeat) input.onPause(e);
					return;
				}
				const r = input.route(e.code);
				if (!r) {
					if (e.code === "Space" && (e.target === document.body || e.target === document.documentElement)) e.preventDefault();
					return;
				}
				e.preventDefault();
				if (!e.repeat && input.enabled) r[0].press(r[1], "k" + e.code);
			});
			window.addEventListener("keyup", (e) => {
				const r = input.route(e.code);
				if (r) r[0].release(r[1], "k" + e.code);
			});
			window.addEventListener("blur", () => {
				input.p1.clear();
				input.p2.clear();
				input.touchReset();
			});
			if (ND.portal) ND.portal.onAd((ph) => input.lockForAd(ph === "start"));
			initLayout();
			const onTouch = () => {
				if (!touch.active) {
					touch.capable = true;
					touch.set(true);
				}
			};
			window.addEventListener("touchstart", onTouch, {
				passive: true,
				capture: true
			});
			window.addEventListener("pointerdown", (e) => {
				if (e.pointerType === "touch") onTouch();
			}, {
				passive: true,
				capture: true
			});
			window.addEventListener("gamepadconnected", () => {
				touch.pad = true;
				touch.notify();
			});
			document.addEventListener("gesturestart", (e) => e.preventDefault());
			const app = document.getElementById("app");
			if (app) app.addEventListener("contextmenu", (e) => {
				if (touch.active) e.preventDefault();
			});
			const tc = document.getElementById("touch");
			if (tc) {
				tc.addEventListener("contextmenu", (e) => e.preventDefault());
				tc.addEventListener("touchstart", (e) => {
					if (e.cancelable) e.preventDefault();
				}, { passive: false });
			}
			initSwipeZone();
			initActs();
			initDpad();
		},
		touchReset() {
			if (acts) acts.reset();
			if (dpad) dpad.reset();
		},
		touchRelayout() {
			if (acts) acts.relayout();
			if (dpad) dpad.relayout();
		},
		lockForAd(on) {
			input.adLocked = !!on;
			if (on && ND.haptics) ND.haptics.stop();
			input.p1.clear();
			input.p2.clear();
			input.touchReset();
			const app = document.getElementById("app");
			if (app) app.classList.toggle("ad-lock", !!on);
		},
		keyLabel(code) {
			return keyLabel(code);
		},
		onLayout(fn) {
			layoutFns.push(fn);
		},
		relabel(root) {
			relabel(root || document);
		},
		pollPads() {
			if (!navigator.getGamepads) return;
			let list;
			try {
				list = navigator.getGamepads();
			} catch (e) {
				return;
			}
			let n = 0;
			for (const gp of list) {
				if (!gp || !gp.connected) continue;
				const ctrl = n === 0 || input.solo ? input.p1 : input.p2;
				n++;
				const b = (i) => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > .5));
				const ax = gp.axes[0] || 0;
				const st = {
					left: b(14) || ax < -.45,
					right: b(15) || ax > .45,
					up: b(0) || b(12),
					guard: b(4) || b(6) || b(13),
					light: b(2),
					heavy: b(3),
					kick: b(1),
					throw: b(5),
					dodge: b(7),
					special: b(11) || b(10)
				};
				const prev = input.pads[gp.index] || {};
				const id = "g" + gp.index;
				let any = false;
				const ps = input.padStart || (input.padStart = {}), start = b(9), prevStart = !!ps[gp.index];
				ps[gp.index] = start;
				if (input.adLocked) {
					input.pads[gp.index] = {};
					continue;
				}
				if (start && !prevStart && input.onPause) {
					any = true;
					input.onPause(null);
				}
				for (const a in st) {
					if (st[a] && !prev[a]) {
						any = true;
						if (input.enabled) ctrl.press(a, id);
					} else if (!st[a] && prev[a]) ctrl.release(a, id);
				}
				input.pads[gp.index] = st;
				if (any) {
					const first = !touch.pad;
					touch.pad = true;
					if (touch.active && touch.forced == null) touch.set(false);
					else if (first) touch.notify();
				}
				if (input.onPad) input.onPad(st, prev, gp);
			}
		}
	};
	const pref = (k, def) => {
		const P = ND.touchPrefs;
		return P && typeof P[k] === "boolean" ? P[k] : def;
	};
	const buzz = () => {
		if (!pref("haptic", true)) return;
		try {
			const ua = navigator.userActivation;
			if (typeof navigator.vibrate === "function" && (!ua || ua.hasBeenActive) && !(ND.haptics && ND.haptics.busy())) navigator.vibrate(7);
		} catch (e) {}
	};
	const wake = () => {
		try {
			ND.audio.init();
		} catch (e) {}
	};
	const T_PREF = () => ND.touchPrefs || {};
	const guardMin = () => guardHold(input.p1) * 1e3;
	const STEP_MS = 170;
	const SW = {
		ms: 230,
		px: 48,
		v: .4,
		ratio: 2
	};
	const swStart = (e) => ({
		x: e.clientX,
		y: e.clientY,
		t: performance.now()
	});
	function swEnd(s, e) {
		if (!s || !e || input.adLocked || !input.enabled) return 0;
		const dx = e.clientX - s.x, dy = e.clientY - s.y, dt = performance.now() - s.t, ax = Math.abs(dx);
		if (dt > SW.ms || ax < SW.px || ax < Math.abs(dy) * SW.ratio || ax / Math.max(dt, 1) < SW.v) return 0;
		return input.p1.swipe(dx > 0 ? "right" : "left", "tw") ? Math.sign(dx) : 0;
	}
	input.SW = SW;
	function initSwipeZone() {
		const z = document.getElementById("tSwipe");
		if (!z) return;
		const live = new Map();
		z.addEventListener("pointerdown", (e) => {
			e.preventDefault();
			live.set(e.pointerId, swStart(e));
			try {
				z.setPointerCapture(e.pointerId);
			} catch (_) {}
			wake();
		});
		z.addEventListener("pointerup", (e) => {
			const s = live.get(e.pointerId);
			live.delete(e.pointerId);
			if (s) swEnd(s, e);
			wake();
		});
		const drop = (e) => live.delete(e.pointerId);
		z.addEventListener("pointercancel", drop);
		z.addEventListener("lostpointercapture", drop);
	}
	function group(boxId, onDown, onMove, onUp) {
		const box = document.getElementById(boxId);
		if (!box) return null;
		const G = {
			box,
			ptr: new Map(),
			rects: null
		};
		G.measure = () => G.rects = [...box.querySelectorAll("button")].map((b) => {
			const r = b.getBoundingClientRect();
			return {
				b,
				x: r.left + r.width / 2,
				y: r.top + r.height / 2,
				rad: r.width / 2
			};
		}).filter((q) => q.rad > 1);
		G.relayout = () => {
			if (G.ptr.size === 0) G.rects = null;
			else G.stale = true;
		};
		box.addEventListener("pointerdown", (e) => {
			const b = e.target && e.target.closest && e.target.closest("button");
			if (!b || !box.contains(b)) return;
			e.preventDefault();
			if (G.ptr.size === 0 || !G.rects || G.stale) {
				G.stale = false;
				G.measure();
			}
			wake();
			try {
				b.setPointerCapture(e.pointerId);
			} catch (_) {}
			onDown(e);
		});
		box.addEventListener("pointermove", (e) => {
			if (G.ptr.has(e.pointerId)) onMove(e);
		});
		const up = (e) => {
			if (G.ptr.has(e.pointerId)) onUp(e);
		};
		box.addEventListener("pointerup", (e) => {
			up(e);
			wake();
		});
		box.addEventListener("pointercancel", up);
		box.addEventListener("lostpointercapture", up);
		return G;
	}
	let acts = null;
	function initActs() {
		const A = acts = group("tActs", (e) => {
			const b = pick(e.clientX, e.clientY, true);
			if (!b) return;
			A.ptr.set(e.pointerId, b);
			on(b, e.pointerId);
		}, (e) => {
			const cur = A.ptr.get(e.pointerId);
			const nb = pick(e.clientX, e.clientY, false);
			if (nb && nb !== cur) {
				A.ptr.set(e.pointerId, nb);
				off(cur, e.pointerId);
				on(nb, e.pointerId);
			}
		}, (e) => {
			const b = A.ptr.get(e.pointerId);
			A.ptr.delete(e.pointerId);
			off(b, e.pointerId);
		});
		if (!A) return;
		A.rep = new Map();
		const REP_FIRST = 260, REP_EVERY = 150;
		const stopRep = (id) => {
			const t = A.rep.get(id);
			if (t) {
				clearTimeout(t);
				A.rep.delete(id);
			}
		};
		const startRep = (b, id) => {
			stopRep(id);
			const step = (ms) => A.rep.set(id, setTimeout(() => {
				if (A.ptr.get(id) !== b || input.adLocked || !pref("assist", true)) {
					A.rep.delete(id);
					return;
				}
				input.p1.release("light", "t" + id);
				input.p1.press("light", "t" + id);
				step(REP_EVERY);
			}, ms));
			step(REP_FIRST);
		};
		const pick = (x, y, loose) => {
			let best = null, bd = Infinity;
			for (const q of A.rects || A.measure()) {
				const d = Math.hypot(x - q.x, y - q.y) / q.rad;
				if (d < bd) {
					bd = d;
					best = q.b;
				}
			}
			return bd <= (loose ? 1.4 : .98) ? best : null;
		};
		const held = (b) => {
			for (const v of A.ptr.values()) if (v === b) return true;
			return false;
		};
		const t0 = new Map();
		const on = (b, id) => {
			if (input.adLocked) return;
			b.classList.add("on");
			input.p1.press(b.dataset.act, "t" + id);
			buzz();
			t0.set(id, performance.now());
			if (b.dataset.act === "light" && pref("assist", true)) startRep(b, id);
		};
		const off = (b, id, now) => {
			stopRep(id);
			const act = b.dataset.act, src = "t" + id, left = guardMin() - (performance.now() - (t0.get(id) || 0));
			t0.delete(id);
			if (act === "guard" && !now && left > 0 && pref("assist", true)) {
				setTimeout(() => {
					input.p1.release(act, src);
					if (!held(b)) b.classList.remove("on");
				}, left);
				return;
			}
			input.p1.release(act, src);
			if (!held(b)) b.classList.remove("on");
		};
		A.reset = () => {
			for (const [id, b] of [...A.ptr]) {
				A.ptr.delete(id);
				off(b, id, true);
			}
			for (const id of [...A.rep.keys()]) stopRep(id);
			A.box.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
			A.rects = null;
		};
	}
	let dpad = null;
	function initDpad() {
		const sw = new Map();
		const P = dpad = group("tDpad", (e) => {
			sw.set(e.pointerId, swStart(e));
			P.ptr.set(e.pointerId, pickDirs(e.clientX, e.clientY, true));
			sync();
		}, (e) => {
			const n = pickDirs(e.clientX, e.clientY, false);
			if (n !== P.ptr.get(e.pointerId)) {
				P.ptr.set(e.pointerId, n);
				sync();
			}
		}, (e) => {
			P.ptr.delete(e.pointerId);
			sync();
			const s = sw.get(e.pointerId);
			sw.delete(e.pointerId);
			if (s && e.type === "pointerup") swEnd(s, e);
		});
		if (!P) return;
		const DIRS = [
			"left",
			"right",
			"up",
			"guard"
		];
		const st = {};
		for (const a of DIRS) st[a] = {
			on: false,
			t0: 0,
			timer: 0
		};
		const pickDirs = (x, y, first) => {
			const list = [];
			for (const q of P.rects || P.measure()) list.push({
				a: q.b.dataset.dir,
				d: Math.hypot(x - q.x, y - q.y) / q.rad
			});
			list.sort((m, n) => m.d - n.d);
			const a = list[0], b = list[1];
			if (!a) return "";
			const opp = b && (a.a === "left" && b.a === "right" || a.a === "right" && b.a === "left" || a.a === "up" && b.a === "guard" || a.a === "guard" && b.a === "up");
			if (b && !opp && a.d <= 1.65 && b.d <= 1.65 && b.d <= a.d * 1.3) return [a.a, b.a].sort().join("+");
			return a.d <= (first ? 1.4 : 1.25) ? a.a : "";
		};
		const btn = (a) => P.box.querySelector(`[data-dir="${a}"]`);
		const down = (a) => {
			const s = st[a];
			if (s.timer) {
				clearTimeout(s.timer);
				s.timer = 0;
				input.p1.release(a, "td");
			}
			if (input.adLocked) return;
			s.on = true;
			s.t0 = performance.now();
			input.p1.press(a, "td");
			buzz();
			const b = btn(a);
			if (b) b.classList.add("on");
		};
		const up = (a, now) => {
			const s = st[a];
			s.on = false;
			const min = now ? 0 : a === "guard" ? pref("assist", true) ? guardMin() : 0 : (a === "left" || a === "right") && T_PREF().dtap ? STEP_MS : 0;
			const left = min - (performance.now() - s.t0);
			const done = () => {
				s.timer = 0;
				input.p1.release(a, "td");
				const b = btn(a);
				if (b) b.classList.remove("on");
			};
			if (left > 0) s.timer = setTimeout(done, left);
			else done();
		};
		const sync = () => {
			const want = new Set();
			for (const k of P.ptr.values()) if (k) k.split("+").forEach((a) => want.add(a));
			for (const a of DIRS) {
				if (want.has(a) && !st[a].on) down(a);
				else if (!want.has(a) && st[a].on) up(a);
			}
		};
		P.reset = () => {
			P.ptr.clear();
			for (const a of DIRS) {
				const s = st[a];
				if (s.timer) clearTimeout(s.timer);
				s.timer = 0;
				s.on = false;
				input.p1.release(a, "td");
			}
			P.box.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
			P.rects = null;
		};
	}
	const layout = {}, learned = {}, layoutFns = [];
	const GUESS = {
		azerty: {
			KeyQ: "A",
			KeyA: "Q",
			KeyW: "Z",
			KeyZ: "W",
			KeyM: ",",
			Semicolon: "M"
		},
		qwertz: {
			KeyY: "Z",
			KeyZ: "Y"
		}
	};
	const SPECIAL = {
		ShiftLeft: "Shift",
		ShiftRight: "Shift",
		Space: "Space",
		Enter: "Enter",
		Backspace: "⌫",
		Escape: "Esc",
		ArrowLeft: "←",
		ArrowRight: "→",
		ArrowUp: "↑",
		ArrowDown: "↓"
	};
	const fireLayout = () => {
		for (const fn of layoutFns) {
			try {
				fn();
			} catch (e) {}
		}
		relabel(document);
	};
	function keyLabel(code) {
		if (!code) return "";
		if (learned[code]) return learned[code];
		if (layout[code]) return layout[code];
		if (SPECIAL[code]) return SPECIAL[code];
		let m = /^Key([A-Z])$/.exec(code);
		if (m) return m[1];
		m = /^Digit(\d)$/.exec(code);
		if (m) return m[1];
		m = /^Numpad(\d)$/.exec(code);
		if (m) return "Num " + m[1];
		return code;
	}
	function learnKey(e) {
		if (!e || !e.isTrusted || !e.code || !/^Key[A-Z]$/.test(e.code) || typeof e.key !== "string" || e.key.length !== 1 || shortcut(e)) return;
		const k = e.key.toUpperCase();
		if (!/^\p{L}$/u.test(k) || learned[e.code] === k) return;
		learned[e.code] = k;
		if (k !== e.code.slice(3)) {
			const az = e.code === "KeyQ" && k === "A" || e.code === "KeyW" && k === "Z" || e.code === "KeyA" && k === "Q" || e.code === "KeyZ" && k === "W";
			const qz = e.code === "KeyY" && k === "Z" || e.code === "KeyZ" && k === "Y";
			const g = az ? GUESS.azerty : qz ? GUESS.qwertz : null;
			if (g) {
				for (const c in g) if (!learned[c]) layout[c] = g[c];
			}
			fireLayout();
		}
	}
	function initLayout() {
		let first = "";
		try {
			first = String(navigator.languages && navigator.languages[0] || navigator.language || "").toLowerCase();
		} catch (e) {}
		if (/^fr(-(fr|be))?$/.test(first)) Object.assign(layout, GUESS.azerty);
		else if (/^(de|cs|hu|sk|sl|hr)(-|$)/.test(first)) Object.assign(layout, GUESS.qwertz);
		try {
			const kb = navigator.keyboard;
			if (kb && kb.getLayoutMap) kb.getLayoutMap().then((map) => {
				for (const c in layout) delete layout[c];
				map.forEach((key, code) => {
					if (/^Key[A-Z]$/.test(code) && typeof key === "string" && key.length === 1) {
						const v = key.toUpperCase();
						if (v !== code.slice(3)) layout[code] = v;
					}
				});
				fireLayout();
			}).catch(() => {});
		} catch (e) {}
		if (Object.keys(layout).length) fireLayout();
	}
	function relabel(root) {
		if (!root || !root.querySelectorAll) return;
		root.querySelectorAll("kbd").forEach((el) => {
			let code = el.dataset.code;
			if (!code) {
				const t = (el.textContent || "").trim();
				if (!/^[A-Z]$/.test(t)) return;
				code = el.dataset.code = "Key" + t;
			}
			const lab = keyLabel(code);
			if (el.textContent !== lab) el.textContent = lab;
		});
	}
	ND.Ctrl = Ctrl;
	ND.FrameCtrl = FrameCtrl;
})(window.ND);
