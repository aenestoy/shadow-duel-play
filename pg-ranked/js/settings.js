(function(ND) {
	"use strict";
	const $ = (id) => document.getElementById(id);
	const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;"
	})[c]);
	const I = () => ND.i18n;
	const TABS = [
		"audio",
		"controls",
		"gfx",
		"lang",
		"save"
	];
	let ov = null, back = null, tab = "audio", fromPause = false;
	const ui = () => {
		try {
			if (ND.audio && ND.audio.ready) ND.audio.ui();
		} catch (e) {}
	};
	const visible = (el) => !!el && !el.hidden && !el.closest("[hidden]") && el.getClientRects().length > 0;
	function fillLangs() {
		const box = $("setLangs"), i = I();
		if (!box || !i) return;
		const cur = i.lang, f = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.setLang : null;
		box.innerHTML = i.supported.map((l) => `<button type="button" data-set-lang="${l}" lang="${l}" aria-pressed="${l === cur}"><span>${esc(i.names[l] || l)}</span><small>${l.toUpperCase()}</small></button>`).join("");
		box.querySelectorAll("[data-set-lang]").forEach((b) => {
			b.onclick = (e) => {
				e.stopPropagation();
				i.setLang(b.dataset.setLang, { save: true });
				ui();
			};
		});
		if (f) {
			const b = box.querySelector(`[data-set-lang="${f}"]`);
			if (b) b.focus();
		}
	}
	function fillKeys() {
		const keys = document.querySelector("#menu aside .keys"), pad = document.querySelector("#menu aside .kbnote");
		const k = $("setKeys"), p = $("setPad"), th = $("setTouchHelp"), mt = document.querySelector("#menu aside .touch-help");
		if (k) {
			k.textContent = "";
			if (keys) k.appendChild(keys.cloneNode(true));
		}
		if (th) {
			th.textContent = "";
			if (mt) th.appendChild(mt.cloneNode(true));
		}
		if (p) {
			p.textContent = "";
			if (pad) {
				const c = pad.cloneNode(true);
				c.className = "";
				p.appendChild(c);
			}
		}
	}
	const rc = {
		code: null,
		msg: "",
		ok: null,
		busy: false,
		pid: null
	};
	function fillSave() {
		const box = $("setSave"), LB = ND.leaderboard;
		if (!box || !LB) return;
		const A = ND.STR && ND.STR.acct || {}, E = A.err || {}, CG = ND.cgAccount || {};
		const inp0 = box.querySelector("input"), typed = inp0 ? inp0.value : "", focused = !!inp0 && document.activeElement === inp0;
		const pid = LB.adapter && LB.adapter.pid;
		if (rc.pid !== pid) {
			rc.code = null;
			rc.pid = pid;
		}
		box.textContent = "";
		const el = (tag, cls, text) => {
			const e = document.createElement(tag);
			if (cls) e.className = cls;
			if (text != null) e.textContent = text;
			return e;
		};
		const btn = (text, fn, cls) => {
			const b = el("button", "btn" + (cls ? " " + cls : ""), text);
			b.type = "button";
			b.disabled = rc.busy;
			b.onclick = (e) => {
				e.stopPropagation();
				ui();
				fn();
			};
			return b;
		};
		const run = async (job) => {
			rc.busy = true;
			fillSave();
			try {
				await job();
			} finally {
				rc.busy = false;
				fillSave();
			}
		};
		const errText = (c) => E[c] || E.error || "";
		box.appendChild(el("h3", null, A.title || ""));
		if (LB.nameLocked) {
			const a = LB.account(), f = a.on ? A.cgOn : a.state === "pending" ? A.cgWait : A.cgFail;
			box.appendChild(el("p", "acc-note", typeof f === "function" ? f(a.name) : ""));
			return;
		}
		if (CG.available) {
			box.appendChild(btn(A.cgSave || "", () => {
				if (CG.prompt) CG.prompt().then(() => fillSave());
			}, "primary"));
			box.appendChild(el("p", "acc-note", A.cgSaveNote || ""));
		}
		if (!LB.canRecover()) {
			box.appendChild(el("p", "acc-note", LB.status === "offline" ? A.offline : A.local));
			return;
		}
		box.appendChild(el("h3", null, A.rcTitle || ""));
		box.appendChild(el("p", "acc-note", A.rcNote || ""));
		const row = el("div", "set-rc");
		if (!LB.hasServerId()) row.appendChild(el("p", "acc-note", A.rcNeedName || ""));
		else if (!rc.code) row.appendChild(btn(A.rcShow || "", () => run(async () => {
			const r = await LB.recoveryCode(false);
			if (r.ok) {
				rc.code = r.code;
				rc.msg = "";
				rc.ok = null;
			} else {
				rc.msg = errText(r.code);
				rc.ok = 0;
			}
		})));
		else {
			row.appendChild(el("code", "set-code", rc.code));
			row.appendChild(btn(A.rcNew || "", () => run(async () => {
				const r = await LB.recoveryCode(true);
				if (r.ok) {
					rc.code = r.code;
					rc.msg = A.rcNewDone || "";
					rc.ok = 1;
				} else {
					rc.msg = errText(r.code);
					rc.ok = 0;
				}
			}), "mini"));
		}
		box.appendChild(row);
		box.appendChild(el("h3", null, A.rcEnter || ""));
		const form = el("form", "set-rcform");
		const inp = el("input");
		inp.type = "text";
		inp.maxLength = 20;
		inp.placeholder = "KAGE-XXXX-XXXX";
		inp.autocomplete = "off";
		inp.spellcheck = false;
		inp.setAttribute("autocapitalize", "characters");
		inp.setAttribute("aria-label", A.rcEnter || "");
		inp.setAttribute("enterkeyhint", "go");
		inp.value = typed;
		inp.disabled = rc.busy;
		inp.addEventListener("keydown", (e) => {
			e.stopPropagation();
			if (e.key === "Escape") inp.blur();
		});
		inp.addEventListener("keyup", (e) => e.stopPropagation());
		const go = btn(A.rcGo || "", () => form.requestSubmit ? form.requestSubmit() : form.onsubmit(new Event("submit")));
		go.type = "submit";
		go.onclick = (e) => e.stopPropagation();
		form.onsubmit = (e) => {
			e.preventDefault();
			if (rc.busy) return;
			ui();
			const text = inp.value;
			run(async () => {
				const r = await LB.recover(text);
				if (r.ok) {
					rc.code = r.code || null;
					rc.pid = LB.adapter && LB.adapter.pid;
					rc.msg = A.rcDone ? A.rcDone(r.name || LB.getName(), r.code || "") : "";
					rc.ok = 1;
					inp.value = "";
				} else {
					rc.msg = errText(r.code);
					rc.ok = 0;
				}
			});
		};
		form.append(inp, go);
		box.appendChild(form);
		if (rc.msg) {
			const m = el("p", "set-rcmsg", rc.msg);
			m.dataset.ok = String(rc.ok);
			m.setAttribute("role", "status");
			box.appendChild(m);
		}
		if (focused && !rc.busy) setTimeout(() => {
			const i = box.querySelector("input");
			if (i) i.focus();
		}, 0);
	}
	function select(name, focus) {
		if (!TABS.includes(name)) name = "audio";
		tab = name;
		if (!ov) return;
		ov.querySelectorAll("[role=\"tab\"]").forEach((b) => {
			const on = b.dataset.tab === name;
			b.setAttribute("aria-selected", String(on));
			b.tabIndex = on ? 0 : -1;
			if (on && focus) b.focus();
		});
		ov.querySelectorAll("[role=\"tabpanel\"]").forEach((p) => {
			p.hidden = p.id !== "setPane-" + name;
		});
		if (name === "save") fillSave();
		const panes = ov.querySelector(".set-panes");
		if (panes) panes.scrollTop = 0;
	}
	let scrubbedAt = -1e9;
	function scrubAndSwipe() {
		const bar = ov.querySelector("[role=\"tablist\"]"), panes = ov.querySelector(".set-panes");
		if (bar) {
			let id = null, moved = false;
			const tabAt = (x, y) => {
				for (const b of bar.querySelectorAll("[role=\"tab\"]")) {
					const r = b.getBoundingClientRect();
					if (x >= r.left && x <= r.right && y >= r.top - 6 && y <= r.bottom + 6) return b;
				}
				return null;
			};
			bar.addEventListener("pointerdown", (e) => {
				if (e.button > 0 || !e.target.closest("[role=\"tab\"]")) return;
				id = e.pointerId;
				moved = false;
				try {
					bar.setPointerCapture(id);
				} catch (err) {}
			});
			bar.addEventListener("pointermove", (e) => {
				if (e.pointerId !== id) return;
				const b = tabAt(e.clientX, e.clientY);
				if (b && b.dataset.tab !== tab) {
					moved = true;
					select(b.dataset.tab, true);
					try {
						b.scrollIntoView({
							block: "nearest",
							inline: "nearest"
						});
					} catch (err) {}
				}
			});
			const end = (e) => {
				if (e.pointerId !== id) return;
				id = null;
				if (moved) {
					scrubbedAt = performance.now();
					ui();
				}
			};
			bar.addEventListener("pointerup", end);
			bar.addEventListener("pointercancel", end);
		}
		if (panes) {
			const CTRL = "input, button, select, textarea, a, label, [role=\"slider\"], [role=\"button\"], .seg, .tog, [contenteditable]";
			let s = null;
			panes.addEventListener("pointerdown", (e) => {
				s = null;
				if (e.button > 0 || e.target.closest && e.target.closest(CTRL)) return;
				s = {
					id: e.pointerId,
					x: e.clientX,
					y: e.clientY,
					t: performance.now()
				};
			});
			panes.addEventListener("pointerup", (e) => {
				if (!s || e.pointerId !== s.id) return;
				const dx = e.clientX - s.x, dy = e.clientY - s.y, dt = performance.now() - s.t;
				s = null;
				if (dt > 700 || Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
				const i = TABS.indexOf(tab), j = i + (dx < 0 ? 1 : -1);
				if (j < 0 || j >= TABS.length) return;
				select(TABS[j], false);
				ui();
			});
			panes.addEventListener("pointercancel", () => {
				s = null;
			});
		}
	}
	function open(name) {
		ov = ov || $("setOv");
		if (!ov) return;
		const G = ND.game;
		if (G && G.phase === "fight" && G.mode !== "attract" && !G.paused && ND.input && ND.input.onPause) ND.input.onPause(null);
		const pz = $("pause");
		fromPause = !!(pz && !pz.hidden);
		if (ov.hidden) back = document.activeElement;
		fillLangs();
		fillKeys();
		rc.msg = "";
		try {
			if (ND.touchUI) ND.touchUI.refresh();
			if (ND.volumeUI) ND.volumeUI.refresh();
		} catch (e) {}
		ov.hidden = false;
		select(typeof name === "string" ? name : tab, false);
		setTimeout(() => {
			if (!ov.hidden) {
				const t = ov.querySelector("[role=\"tab\"][aria-selected=\"true\"]");
				if (t) t.focus();
			}
		}, 0);
		ui();
	}
	function close(restore) {
		if (!ov || ov.hidden) return;
		ov.hidden = true;
		const el = back;
		back = null;
		fromPause = false;
		if (restore !== false && el && el.isConnected && typeof el.focus === "function") setTimeout(() => {
			if (el.isConnected && visible(el)) el.focus({ preventScroll: true });
		}, 0);
	}
	function focusables() {
		return [...ov.querySelectorAll("button, input, select, [tabindex=\"0\"]")].filter((el) => !el.disabled && el.tabIndex >= 0 && visible(el));
	}
	function onKey(e) {
		const app = $("app");
		if (app && app.classList.contains("t-editing")) return false;
		if (e.ctrlKey || e.metaKey || e.altKey) return true;
		const inp = ND.input || {};
		if (e.code === "Escape" && inp.escAllowed === false) return true;
		const a = document.activeElement;
		if ((e.code === "Escape" || e.code === "Backspace" && !(inp.isEditable && inp.isEditable(a))) && !e.repeat) {
			e.preventDefault();
			close(true);
			return true;
		}
		if (e.code === "Tab") {
			const list = focusables();
			if (!list.length) return true;
			const i = list.indexOf(a);
			const n = i < 0 ? e.shiftKey ? list.length - 1 : 0 : (i + (e.shiftKey ? -1 : 1) + list.length) % list.length;
			list[n].focus();
			e.preventDefault();
			return true;
		}
		if (a && a.getAttribute && a.getAttribute("role") === "tab") {
			const i = TABS.indexOf(a.dataset.tab);
			const d = {
				ArrowUp: -1,
				ArrowLeft: -1,
				ArrowDown: 1,
				ArrowRight: 1
			}[e.code];
			if (d) {
				select(TABS[(i + d + TABS.length) % TABS.length], true);
				e.preventDefault();
				return true;
			}
			if (e.code === "Home" || e.code === "End") {
				select(TABS[e.code === "Home" ? 0 : TABS.length - 1], true);
				e.preventDefault();
				return true;
			}
		}
		return true;
	}
	function start() {
		ov = $("setOv");
		if (!ov) return;
		document.querySelectorAll("[data-set-open]").forEach((b) => {
			b.onclick = (e) => {
				e.stopPropagation();
				open();
			};
		});
		const c = $("setClose");
		if (c) c.onclick = (e) => {
			e.stopPropagation();
			close(true);
			ui();
		};
		ov.addEventListener("click", (e) => {
			if (e.target === ov) close(true);
		});
		ov.querySelectorAll("[role=\"tab\"]").forEach((b) => {
			b.onclick = (e) => {
				e.stopPropagation();
				if (performance.now() - scrubbedAt < 400) return;
				select(b.dataset.tab, true);
				ui();
			};
		});
		scrubAndSwipe();
		window.addEventListener("keydown", (e) => {
			if (ov && !ov.hidden && onKey(e)) e.stopPropagation();
		}, true);
		const pz = $("pause");
		if (pz && typeof MutationObserver !== "undefined") new MutationObserver(() => {
			if (pz.hidden && fromPause && ov && !ov.hidden) close(false);
		}).observe(pz, {
			attributes: true,
			attributeFilter: ["hidden"]
		});
		if (I() && I().onChange) I().onChange(() => {
			if (ov && !ov.hidden) {
				fillLangs();
				fillKeys();
				if (tab === "save") fillSave();
			}
		});
		if (ND.leaderboard && ND.leaderboard.onChange) ND.leaderboard.onChange(() => {
			if (ov && !ov.hidden && tab === "save" && !rc.busy) fillSave();
		});
		select(tab, false);
	}
	ND.settingsUI = {
		open,
		close: () => close(true),
		select,
		get isOpen() {
			return !!ov && !ov.hidden;
		},
		get tab() {
			return tab;
		}
	};
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
	else setTimeout(start, 0);
})(window.ND);
