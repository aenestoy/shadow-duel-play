(function(ND) {
	"use strict";
	const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
	const GAP = 380, WINDOW = 4e3, BURST = 5;
	const ALWAYS = {
		gbreak: 1,
		ko: 1
	};
	const pattern = (kind, dmg) => {
		if (kind === "parry") return [32];
		if (kind === "gbreak") return [150];
		if (kind === "counter") return [
			18,
			45,
			18,
			45,
			34
		];
		if (kind === "ko") return [
			30,
			50,
			40,
			50,
			60,
			60,
			110
		];
		const d = clamp(Math.round(10 + (dmg || 0) * 1.7), 18, 58);
		return [
			d,
			35,
			Math.round(d * .55)
		];
	};
	const H = ND.haptics = {
		last: 0,
		busyUntil: 0,
		recent: [],
		log: null,
		defer: false,
		pending: null,
		off: false,
		player() {
			const G = ND.game;
			if (!G || !G.F || !ND.touch || !ND.touch.active) return null;
			const me = G.local ? G.local() : G.F[0];
			return G.isHuman && G.isHuman(me) ? me : null;
		},
		live() {
			const G = ND.game;
			if (!G || G.simOnly || G.paused || G.replay || G.mode === "attract" || G.mode === "watch") return false;
			if (G.phase !== "fight" && G.phase !== "ko") return false;
			return !(ND.input && ND.input.adLocked);
		},
		allowed() {
			const P = ND.touchPrefs;
			if (this.off || P && P.haptic === false) return false;
			try {
				if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false;
				const ua = navigator.userActivation;
				return !ua || !!ua.hasBeenActive;
			} catch (e) {
				return false;
			}
		},
		busy(t) {
			return (t == null ? performance.now() : t) < this.busyUntil;
		},
		event(kind, dmg) {
			if (!this.live() || !this.allowed()) return false;
			const t = performance.now();
			if (!ALWAYS[kind]) {
				if (t - this.last < GAP) return false;
				while (this.recent.length && t - this.recent[0] > WINDOW) this.recent.shift();
				if (this.recent.length >= BURST) return false;
			}
			const p = pattern(kind, dmg);
			let ok = false;
			if (this.defer) {
				this.pending = p;
				ok = true;
			} else {
				try {
					ok = navigator.vibrate(p) !== false;
				} catch (e) {
					ok = false;
				}
			}
			if (!ok) return false;
			this.last = t;
			this.recent.push(t);
			this.busyUntil = t + p.reduce((a, b) => a + b, 0);
			if (this.log) this.log.push({
				kind,
				p,
				t
			});
			return true;
		},
		flush() {
			const p = this.pending;
			if (!p) return;
			this.pending = null;
			try {
				navigator.vibrate(p);
			} catch (e) {}
		},
		stop() {
			this.pending = null;
			if (this.busyUntil <= performance.now()) return;
			this.busyUntil = 0;
			try {
				if (typeof navigator.vibrate === "function") navigator.vibrate(0);
			} catch (e) {}
		},
		pattern
	};
	const FP = ND.Fighter && ND.Fighter.prototype;
	if (FP && !FP._haptic) {
		const take = FP.takeHit, setSt = FP.setState;
		FP.takeHit = function(raw, a, from) {
			const hp0 = this.hp, r = take.apply(this, arguments);
			try {
				const me = H.player();
				if (me && this.hp < hp0) {
					if (this === me) H.event("hit", hp0 - this.hp);
					else if (from === me && this === me.opp && (this.hp <= 0 || a && a.counter)) H.event(this.hp <= 0 ? "ko" : "counter");
				}
			} catch (e) {}
			return r;
		};
		FP.setState = function(s) {
			const r = setSt.apply(this, arguments);
			if (s === "parry" || s === "gbreak") {
				try {
					const me = H.player();
					if (me && this === me) H.event(s);
				} catch (e) {}
			}
			return r;
		};
		FP._haptic = true;
	}
})(window.ND);
