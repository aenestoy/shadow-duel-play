(function(ND) {
	"use strict";
	const HOLD_MS = 2400, HOLD_N = 10, HOLD_F = 300, LS = "nd-loadtip";
	const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;"
	})[c]);
	let panel;
	function ui() {
		if (panel) return panel;
		panel = document.createElement("div");
		panel.id = "matchLoading";
		panel.hidden = true;
		panel.setAttribute("role", "status");
		panel.setAttribute("aria-live", "polite");
		panel.innerHTML = "<div class=\"match-loading-card\"><span aria-hidden=\"true\">影</span><h2>PREPARING DUEL</h2><p>Getting the arena ready</p><progress max=\"1\" value=\"0\" aria-label=\"Match preparation\"></progress>" + "<div class=\"ltip\" data-ltip><b class=\"ltip-h\"></b><p class=\"ltip-t\"></p><div class=\"ltip-a\" aria-hidden=\"true\"></div></div></div>";
		document.getElementById("app").appendChild(panel);
		return panel;
	}
	function device() {
		if (ND.touch && ND.touch.active) return "touch";
		const c = ND.input && ND.input.p1;
		return c && c.lastSrc && c.lastSrc[0] === "g" ? "pad" : "key";
	}
	function tip(el) {
		const box = el.querySelector("[data-ltip]"), L = ND.STR && ND.STR.loadTip || {}, B = ND.STR && ND.STR.touch && ND.STR.touch.btn || {};
		if (!box) return;
		const d = device(), key = (code) => ND.input && ND.input.keyLabel ? ND.input.keyLabel(code) : code.slice(3);
		const atk = d === "touch" ? "" : d === "pad" ? "X" : key("KeyF"), grd = d === "touch" ? "▼" : d === "pad" ? "LB" : key("KeyS");
		const chip = d === "touch" ? `<i class="tb tb-guard">${esc(grd)}</i>` : `<kbd>${esc(grd)}</kbd>`;
		box.querySelector(".ltip-h").textContent = L.head || "IMPORTANT TIP";
		let t = "";
		try {
			t = typeof L.text === "function" ? L.text(chip) : "";
		} catch (e) {
			t = "";
		}
		box.querySelector(".ltip-t").innerHTML = t || `Want to master the fight? After EVERY attack, press ${chip}.`;
		const c = box.querySelector(".ltip-t kbd, .ltip-t .tb"), nx = c && c.nextSibling;
		if (nx && nx.nodeType === 3) {
			const m = /^[^\s]+/.exec(nx.data);
			if (m) {
				const w = document.createElement("span");
				w.className = "ltip-nb";
				c.replaceWith(w);
				w.append(c, m[0]);
				nx.data = nx.data.slice(m[0].length);
			}
		}
		const k = (cls, face, name) => `<span class="ltip-k ${cls}"><i>${esc(face)}</i><em>${esc(name)}</em></span>`;
		const A = k("a", atk || B.light || "ATTACK", atk ? B.light || "ATTACK" : ""), G = k("g", grd, B.down || "GUARD");
		box.querySelector(".ltip-a").innerHTML = [
			A,
			G,
			A,
			G
		].join("<s>›</s>");
		box.dataset.dev = d;
	}
	function holdMs() {
		const G = ND.game;
		if (!G || G.mode === "online" || G.mode === "watch" || G.mode === "attract") return 0;
		let n = 0;
		try {
			n = parseInt(localStorage.getItem(LS) || "0", 10) || 0;
			localStorage.setItem(LS, String(n + 1));
		} catch (e) {
			n = 0;
		}
		return n < HOLD_N ? HOLD_MS : 0;
	}
	ND.prepare = {
		start(jobs, onDone) {
			const el = ui(), bar = el.querySelector("progress");
			let index = 0, cancelled = false;
			tip(el);
			const t0 = performance.now(), hold = holdMs();
			let held = 0;
			const over = () => !hold || performance.now() - t0 >= hold || ++held >= HOLD_F;
			el.hidden = false;
			el.setAttribute("aria-busy", "true");
			bar.value = 0;
			return {
				step() {
					if (cancelled) return;
					if (index >= jobs.length) {
						if (over()) {
							this.cancel();
							onDone();
						}
						return;
					}
					try {
						if (jobs[index]() !== false) index++;
					} catch (error) {
						console.warn("[ND.prepare] warm-up failed; using live drawing", error);
						index++;
					}
					bar.value = index / jobs.length;
					if (index >= jobs.length && over()) {
						this.cancel();
						onDone();
					}
				},
				cancel() {
					cancelled = true;
					el.hidden = true;
					el.setAttribute("aria-busy", "false");
				}
			};
		},
		tip() {
			tip(ui());
			return ui();
		}
	};
})(window.ND);
