(function(ND) {
	"use strict";
	if (!ND || typeof document === "undefined") return;
	const doc = document, $ = (id) => doc.getElementById(id);
	const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;"
	})[c]);
	const T = (t) => ND.firstTr ? ND.firstTr(t) : t;
	const store = {
		get() {
			try {
				return ND.save && ND.save.settings && ND.save.settings() || {};
			} catch (e) {
				return {};
			}
		},
		set(o) {
			try {
				if (ND.save && ND.save.saveSettings) ND.save.saveSettings(Object.assign(this.get(), o));
			} catch (e) {}
		}
	};
	const FULL_ROUNDS = 2;
	const SETS = [[
		[
			["KeyA", "KeyD"],
			"Move",
			"move"
		],
		[
			["KeyW"],
			"Jump",
			"up"
		],
		[
			["KeyS"],
			"Guard",
			"guard"
		],
		[
			["KeyF"],
			"Attack",
			"light"
		],
		[
			["KeyG"],
			"Heavy",
			"heavy"
		],
		[
			["KeyR"],
			"Kick",
			"kick"
		],
		[
			["KeyT"],
			"Shuriken",
			"throw"
		],
		[
			["ShiftLeft"],
			"Dash",
			"dodge"
		],
		[
			["KeyE"],
			"Ki",
			"special"
		],
		[
			["KeyP"],
			"Pause",
			"pause"
		]
	], [
		[
			["ArrowLeft", "ArrowRight"],
			"Move",
			"move"
		],
		[
			["ArrowUp"],
			"Jump",
			"up"
		],
		[
			["ArrowDown"],
			"Guard",
			"guard"
		],
		[
			["KeyK"],
			"Attack",
			"light"
		],
		[
			["KeyL"],
			"Heavy",
			"heavy"
		],
		[
			["KeyO"],
			"Kick",
			"kick"
		],
		[
			["KeyI"],
			"Shuriken",
			"throw"
		],
		[
			["ShiftRight"],
			"Dash",
			"dodge"
		],
		[
			["KeyU"],
			"Ki",
			"special"
		]
	]];
	const PAD = [
		[
			["◀", "▶"],
			"Move",
			"move"
		],
		[
			["A"],
			"Jump",
			"up"
		],
		[
			["LB"],
			"Guard",
			"guard"
		],
		[
			["X"],
			"Attack",
			"light"
		],
		[
			["Y"],
			"Heavy",
			"heavy"
		],
		[
			["B"],
			"Kick",
			"kick"
		],
		[
			["RB"],
			"Shuriken",
			"throw"
		],
		[
			["RT"],
			"Dash",
			"dodge"
		],
		[
			["R3"],
			"Ki",
			"special"
		],
		[
			["Start"],
			"Pause",
			"pause"
		]
	];
	let el = null, key = "", on = true, rounds = 0, lastRound = null;
	{
		const s = store.get();
		on = s.keyLegend !== false;
		rounds = Math.max(0, s.klRounds | 0);
	}
	const G = () => ND.game;
	const label = (code) => ND.input && ND.input.keyLabel ? ND.input.keyLabel(code) : code.replace(/^Key/, "");
	const device = () => {
		if (ND.touch && ND.touch.active) return "touch";
		const g = G(), c = g && g.F && g.F[0] && g.F[0].ctrl;
		return c && c.lastSrc && c.lastSrc[0] === "g" ? "pad" : "key";
	};
	function group(set, pad) {
		return "<span class=\"kl-g\">" + set.map(([codes, word, act]) => `<span class="kl-i" data-a="${act}">${codes.map((c) => `<kbd>${esc(pad ? c : label(c))}</kbd>`).join("")}<em>${esc(T(word))}</em></span>`).join("") + "</span>";
	}
	function build(dev, duo) {
		if (!el) {
			el = doc.createElement("div");
			el.id = "keyLegend";
			el.hidden = true;
			el.setAttribute("aria-hidden", "true");
			el.setAttribute("data-i18n-skip", "");
			const app = $("app") || doc.body;
			const lh = $("lockHint");
			if (lh && lh.parentNode) lh.parentNode.insertBefore(el, lh);
			else app.appendChild(el);
		}
		el.classList.toggle("duo", duo);
		el.innerHTML = dev === "pad" ? group(PAD, true) : duo ? group(SETS[0]) + group(SETS[1]) : group(SETS[0]);
	}
	const wanted = (g) => on && g && [
		"intro",
		"fight",
		"ko"
	].includes(g.phase) && g.mode !== "attract" && g.mode !== "watch" && !g.paused && device() !== "touch" && !g.replay;
	function tick() {
		const g = G();
		const show = wanted(g);
		if (!show) {
			if (el && !el.hidden) el.hidden = true;
			return;
		}
		const dev = device(), duo = g.mode === "2p";
		const k = dev + "|" + duo + "|" + (ND.i18n && ND.i18n.lang) + "|" + label("KeyW") + label("KeyA") + label("KeyQ");
		if (k !== key || !el) {
			key = k;
			build(dev, duo);
		}
		if (g.phase === "fight" && g.round != null) {
			const c = +g.clock || 0;
			if (!lastRound || lastRound.r !== g.round || c < lastRound.c) {
				if (rounds <= FULL_ROUNDS) {
					rounds++;
					store.set({ klRounds: rounds });
				}
			}
			lastRound = {
				r: g.round,
				c
			};
		}
		const lh = $("lockHint"), lock = !!(g.lock && lh && !lh.hidden && lh.classList.contains("mash"));
		el.classList.toggle("dim", rounds > FULL_ROUNDS && !lock);
		el.classList.toggle("lock", lock);
		el.hidden = false;
	}
	setInterval(tick, 200);
	if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(() => {
		key = "";
		label2();
	});
	if (ND.input && ND.input.onLayout) ND.input.onLayout(() => {
		key = "";
	});
	function setOn(v, say) {
		on = !!v;
		store.set({ keyLegend: on });
		label2();
		if (!on && el) el.hidden = true;
		if (say && ND.toast) ND.toast(on ? T("Key legend on") : T("Key legend off · press H to show it"), "鍵");
	}
	window.addEventListener("keydown", (e) => {
		if (e.code !== "KeyH" || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
		if (ND.input && ND.input.isEditable && ND.input.isEditable(e.target)) return;
		const g = G();
		if (!g || g.mode === "train" || g.mode === "attract" || ![
			"intro",
			"fight",
			"ko"
		].includes(g.phase) || g.paused) return;
		setOn(!on, true);
	});
	function label2() {
		const b = $("tKeyLegend");
		if (b) {
			b.setAttribute("aria-pressed", String(on));
			const s = b.querySelector("span");
			if (s) s.textContent = T("Key legend in fights") + " (H)";
		}
	}
	function addSwitch() {
		const box = doc.querySelector("#setPane-controls .set-togs");
		if (!box || $("tKeyLegend")) return;
		const b = doc.createElement("button");
		b.className = "tog";
		b.id = "tKeyLegend";
		b.type = "button";
		b.innerHTML = "<i></i><span></span>";
		b.onclick = (e) => {
			e.stopPropagation();
			setOn(!on, false);
			try {
				if (ND.audio && ND.audio.ui) ND.audio.ui();
			} catch (x) {}
		};
		box.appendChild(b);
		label2();
	}
	if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", addSwitch);
	else addSwitch();
	ND.keyLegend = {
		get on() {
			return on;
		},
		set: (v) => setOn(v, false),
		tick,
		get rounds() {
			return rounds;
		},
		reset: () => {
			rounds = 0;
			store.set({ klRounds: 0 });
		}
	};
})(window.ND);
