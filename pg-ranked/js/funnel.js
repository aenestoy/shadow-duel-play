(function(ND) {
	"use strict";
	const KEY = "golge-duellosu-funnel", V = 1;
	const STEPS = [
		"boot",
		"menu",
		"modes",
		"play",
		"direct",
		"select",
		"vs",
		"fight1",
		"tut",
		"warm",
		"tut1",
		"tut2",
		"tut3",
		"tut_skip",
		"round1",
		"fight1_win",
		"fight1_loss",
		"fight2",
		"m3",
		"m5",
		"m10"
	];
	const TIMES = [
		[180, "m3"],
		[300, "m5"],
		[600, "m10"]
	];
	const SESS_MAX = 12, SAVE_EVERY = 10;
	const ls = (() => {
		try {
			const s = window.localStorage, k = "__nd_fn";
			s.setItem(k, "1");
			s.removeItem(k);
			return s;
		} catch (e) {
			return null;
		}
	})();
	const loud = (() => {
		try {
			return /[?&]funnel=1(&|$)/.test(location.search || "");
		} catch (e) {
			return false;
		}
	})();
	const num = (v, hi) => typeof v === "number" && isFinite(v) && v >= 0 ? Math.min(hi, Math.round(v)) : null;
	const day = () => Math.floor(Date.now() / 864e5);
	function read() {
		let o = null;
		try {
			o = ls ? JSON.parse(ls.getItem(KEY) || "null") : null;
		} catch (e) {
			o = null;
		}
		if (!o || typeof o !== "object" || o.v !== V) return null;
		const first = {};
		if (o.first && typeof o.first === "object") for (const k of STEPS) {
			const s = num(o.first[k], 1e7);
			if (s != null) first[k] = s;
		}
		const sess = Array.isArray(o.sess) ? o.sess.filter((x) => x && typeof x === "object").slice(-SESS_MAX).map((x) => ({
			d: num(x.d, 1e6) || 0,
			n: !!x.n,
			s: STEPS.includes(x.s) ? x.s : "boot",
			v: num(x.v, 1e6) || 0
		})) : [];
		return {
			v: V,
			isNew: !!o.isNew,
			play: num(o.play, 1e8) || 0,
			first,
			sess
		};
	}
	const saved = read();
	const newPlayer = saved ? saved.isNew : !(ND.save && ND.save.p && ND.save.p.firstDone);
	const rec = saved || {
		v: V,
		isNew: newPlayer,
		play: 0,
		first: {},
		sess: []
	};
	const sess = {
		d: day(),
		n: rec.isNew,
		s: "boot",
		v: 0
	};
	rec.sess.push(sess);
	while (rec.sess.length > SESS_MAX) rec.sess.shift();
	let dirty = true, sinceSave = 0, visible = true;
	function write() {
		if (!ls || !dirty) return;
		dirty = false;
		try {
			ls.setItem(KEY, JSON.stringify(rec));
		} catch (e) {}
	}
	const F = ND.funnel = {
		STEPS,
		get isNew() {
			return rec.isNew;
		},
		get playSec() {
			return rec.play;
		},
		get sessionSec() {
			return sess.v;
		},
		step(id) {
			if (!STEPS.includes(id)) return false;
			if (STEPS.indexOf(id) > STEPS.indexOf(sess.s)) {
				sess.s = id;
				dirty = true;
			}
			if (!rec.isNew || rec.first[id] != null) return false;
			rec.first[id] = rec.play;
			dirty = true;
			write();
			if (loud) console.info("[funnel]", id, "at", rec.play + "s", F.report());
			try {
				if (ND.studioStats) ND.studioStats.funnel(id);
			} catch (e) {}
			try {
				if (ND.portal && ND.portal.track) ND.portal.track("funnel_" + id);
			} catch (e) {}
			return true;
		},
		fightStarted() {
			if (rec.first.fight1 == null) F.step("fight1");
			else F.step("fight2");
		},
		fightEnded(won) {
			if (rec.first.fight1_win == null && rec.first.fight1_loss == null) F.step(won ? "fight1_win" : "fight1_loss");
		},
		report() {
			const first = STEPS.filter((k) => rec.first[k] != null).map((k) => [k, rec.first[k]]);
			return {
				isNew: rec.isNew,
				play: rec.play,
				first,
				sessions: rec.sess.map((x) => Object.assign({}, x))
			};
		},
		reset() {
			rec.first = {};
			rec.play = 0;
			rec.sess = [sess];
			sess.s = "boot";
			sess.v = 0;
			rec.isNew = true;
			dirty = true;
			write();
		},
		_tick(sec) {
			if (!visible) return;
			rec.play += sec;
			sess.v += sec;
			dirty = true;
			for (const [s, id] of TIMES) if (rec.play >= s) F.step(id);
			if ((sinceSave += sec) >= SAVE_EVERY) {
				sinceSave = 0;
				write();
			}
		}
	};
	try {
		visible = !document.hidden;
	} catch (e) {
		visible = true;
	}
	try {
		document.addEventListener("visibilitychange", () => {
			visible = !document.hidden;
			if (!visible) write();
		});
		window.addEventListener("pagehide", write);
	} catch (e) {}
	setInterval(() => F._tick(1), 1e3);
	F.step("boot");
	write();
})(window.ND = window.ND || {});
