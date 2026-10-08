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
	const D = ND.duel;
	const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
	const sstep = (u) => {
		u = clamp(u, 0, 1);
		return u * u * (3 - 2 * u);
	};
	const HILT0 = 4, Q = .38;
	const ANG = {
		def: 62,
		att: 30
	};
	const LAST = new WeakMap();
	function point(c) {
		const sd = Math.sign(c.def.x - c.att.x) || 1, s = sstep(c.t / .6);
		return {
			x: c.px + sd * 4 * s,
			y: c.py
		};
	}
	function geomFor(f, c, C) {
		const isDef = c.def === f, dir = f.dir < 0 ? -1 : 1, wpn = f.wpn || ND.LEN;
		const a = ANG[isDef ? "def" : "att"] * Math.PI / 180, ux = Math.cos(a), uy = -Math.sin(a);
		const d = Q * wpn.blade + HILT0;
		const sori = 3.2 * wpn.blade / 96 * 4 * Q * (1 - Q);
		const ex = -uy, ey = ux;
		const hx = (C.x - f.x) * dir - ux * d + ex * sori, hy = C.y - uy * d + ey * sori;
		return {
			h: [
				hx,
				hy,
				isDef ? 6 : 10
			],
			u: [
				ux,
				uy,
				0
			],
			e: [
				ex,
				ey,
				0
			],
			C
		};
	}
	D.bindGeom = function(f) {
		if (!f || !f.dz || f.dead) return null;
		const clk = ND.simClock || 0, c = f.dz.cine;
		if (c && f.state === "dbind" && !c.done && f.dz.armed !== false && c.def && c.att) {
			const C = point(c);
			const g = geomFor(f, c, C);
			g.w = c.ph === "bind" ? 1 : c.ph === "strike" ? 1 - sstep(c.t2 / .06) : 1;
			LAST.set(f, {
				g,
				clk,
				x: f.x
			});
			return g.w > 0 ? g : null;
		}
		const L = LAST.get(f);
		if (L && clk >= L.clk && clk - L.clk < .12) {
			const dir = f.dir < 0 ? -1 : 1, g = Object.assign({}, L.g);
			g.h = [
				g.h[0] - (f.x - L.x) * dir,
				g.h[1],
				g.h[2]
			];
			g.w = (L.g.w || 1) * (1 - sstep((clk - L.clk) / .12));
			return g.w > .01 ? g : null;
		}
		return null;
	};
	D.bindPoint = function(f) {
		const c = f && f.dz && f.dz.cine;
		return c && c.ph === "bind" && !c.done ? point(c) : null;
	};
	D.gapPoint = function(f) {
		const c = f && f.dz && f.dz.cine;
		if (c && !c.done && (f.state === "dbind" || f.state === "dcut") && c.def && c.att) return point(c);
		const Lk = ND.game && ND.game.lock;
		if (f && f.dz && f.state === "lock" && Lk && (Lk.a === f || Lk.b === f)) return {
			x: Lk.mid + Lk.a.dir * (Lk.off || 0),
			y: -132
		};
		return null;
	};
	if (ND.depth25) ND.depth25.bindHand = D.bindGeom;
	const L = ND.LEN;
	function frontOf(P, f) {
		const ux = Math.sin(P.lean), ha = P.lean + P.hd, hr = HEADR[f.ch.acc] || 15;
		const chest = P.hx + ux * L.torso * .75 + 19, head = P.hx + ux * L.torso + Math.sin(ha) * 15 + hr;
		return Math.max(chest, head);
	}
	const HEADR = {
		kasa: 33,
		kabuto: 19,
		hood: 17,
		oni: 17,
		tora: 19,
		monk: 16
	};
	D.headR = (f) => HEADR[f.ch.acc] || 15;
	if (ND.anim && ND.anim.preSolve) {
		const ps0 = ND.anim.preSolve;
		ND.anim.preSolve = function(f, D0, S, dt, hold, act) {
			ps0.apply(this, arguments);
			if (!f.dz || f.dead || !D0) return;
			const C = D.gapPoint(f);
			if (!C) return;
			const dir = f.dir < 0 ? -1 : 1, room = (C.x - f.x) * dir - 15;
			for (let i = 0; i < 24 && frontOf(D0, f) > room; i++) {
				if (D0.hx > -10) D0.hx -= 1.5;
				else D0.lean -= .04;
			}
		};
	}
})(window.ND);
