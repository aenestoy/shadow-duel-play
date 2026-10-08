(function(ND) {
	"use strict";
	const G = ND.game;
	if (!G) return;
	const $ = (id) => document.getElementById(id);
	const TEST_MS = typeof window.__ndUpdateMs === "number" && window.__ndUpdateMs > 0 ? window.__ndUpdateMs : 0;
	const CHECK_MS = TEST_MS || 10 * 60 * 1e3, TICK_MS = TEST_MS ? Math.max(50, TEST_MS / 4) : 30 * 1e3, GAME = "shadow-duel";
	const TR = {
		ready: "Yeni sürüm hazır — dokun, güncelle",
		refresh: "Yeni sürüm çıktı — oynamak için sayfayı yenile",
		close: "Kapat"
	};
	const T = () => {
		const s = ND.STR && ND.STR.upd;
		return s && typeof s.ready === "string" ? Object.assign({}, TR, s) : TR;
	};
	function ownVersion() {
		const m = document.querySelector("meta[name=\"nd-version\"]");
		const v = m && m.content || ND.leaderboard && ND.leaderboard.GAME_V || "";
		return /^\d{1,4}(\.\d{1,4}){0,3}$/.test(v) ? v : "";
	}
	function newer(a, b) {
		const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
		for (let i = 0; i < Math.max(x.length, y.length); i++) {
			const d = (x[i] || 0) - (y[i] || 0);
			if (d) return d > 0;
		}
		return false;
	}
	const ss = {
		get(k) {
			try {
				return sessionStorage.getItem(k);
			} catch (e) {
				return null;
			}
		},
		set(k, v) {
			try {
				sessionStorage.setItem(k, v);
			} catch (e) {}
		}
	};
	const portal = () => String(ND.portalName || ND.platform && ND.platform.name || "");
	const C = ND.CONFIG || {};
	const useServer = () => portal() === "xportalc" && !!(ND.platform && ND.platform.allowNetwork) && typeof C.SUPABASE_URL === "string" && /^https:\/\//.test(C.SUPABASE_URL) && typeof C.SUPABASE_ANON_KEY === "string" && !!C.SUPABASE_ANON_KEY;
	async function fetchServer() {
		const base = C.SUPABASE_URL.trim().replace(/\/+$/, ""), key = C.SUPABASE_ANON_KEY.trim();
		const h = {
			apikey: key,
			"Content-Type": "application/json"
		};
		if (/^eyJ/.test(key)) h.Authorization = "Bearer " + key;
		const r = await fetch(base + "/rest/v1/rpc/st_latest", {
			method: "POST",
			headers: h,
			body: JSON.stringify({
				p_game: GAME,
				p_portal: "xportalc"
			}),
			credentials: "omit",
			cache: "no-store"
		});
		if (!r.ok) return null;
		const j = await r.json();
		return j && j.ok && typeof j.v === "string" ? {
			v: j.v,
			mode: "refresh"
		} : null;
	}
	async function fetchFile() {
		const r = await fetch("version.json?t=" + Date.now(), {
			cache: "no-store",
			credentials: "same-origin"
		});
		if (!r.ok) return null;
		const j = await r.json();
		return j && typeof j.v === "string" ? {
			v: j.v,
			mode: "reload"
		} : null;
	}
	function onMenu() {
		if (document.hidden || G.mode !== "attract") return false;
		const menu = $("menu");
		if (!menu || menu.hidden) return false;
		for (const o of document.querySelectorAll(".overlay")) if (o !== menu && !o.hidden && o.getClientRects().length) return false;
		try {
			const P = window.NDPortal;
			if (P && P.state && P.state().inAd) return false;
		} catch (e) {}
		try {
			const R = ND.ranked && ND.ranked.state ? ND.ranked.state() : null;
			if (R && (R.queue || R.match || R.screen)) return false;
		} catch (e) {}
		try {
			if (ND.online && ND.online.state && ND.online.state().screen) return false;
		} catch (e) {}
		if (ND.tutorial && ND.tutorial.active) return false;
		return true;
	}
	const S = {
		own: ownVersion(),
		lastCheck: Date.now(),
		busy: false,
		found: null,
		mode: null,
		dismissed: ss.get("nd-upd-x"),
		checks: 0,
		error: null
	};
	let el = null;
	function build() {
		if (el) return el;
		if (!$("updCss")) {
			const st = document.createElement("style");
			st.id = "updCss";
			st.textContent = `
  #updNote { position: absolute; left: 50%; bottom: calc(env(safe-area-inset-bottom, 0px) + 12px); z-index: 30; transform: translateX(-50%); display: flex; align-items: stretch;
    max-width: min(560px, calc(100% - 24px)); box-sizing: border-box; background: rgba(14,12,20,.94); border: 1px solid rgba(217,179,108,.75); border-radius: 999px;
    box-shadow: 0 6px 22px rgba(0,0,0,.5), 0 0 14px rgba(217,179,108,.18); color: var(--text, #eee); font: 600 13px/1.25 var(--display); letter-spacing: .06em; animation: updIn .35s ease-out; }
  #updNote[hidden] { display: none; }
  #updNote button { margin: 0; border: 0; background: none; color: inherit; font: inherit; letter-spacing: inherit; cursor: pointer; min-height: 40px; }
  #updNote .un-go { display: flex; align-items: center; gap: 9px; padding: 6px 12px 6px 16px; text-align: left; }
  #updNote .un-go b { flex: none; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--gold, #d9b36c); color: #17130a; font: 700 14px/1 var(--display); }
  #updNote.refresh .un-go { cursor: default; }
  #updNote .un-x { flex: none; padding: 0 14px 0 10px; border-left: 1px solid rgba(217,179,108,.35); color: var(--muted, #aaa); font-size: 18px; }
  #updNote button:hover, #updNote button:focus-visible { color: #f1d69c; }
  #app.touch #updNote button { min-height: 44px; }
  @keyframes updIn { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
  @media (prefers-reduced-motion: reduce) { #updNote { animation: none; } }
  @media (max-height: 540px) { #updNote { bottom: calc(env(safe-area-inset-bottom, 0px) + 6px); font-size: 12px; } }
`;
			document.head.appendChild(st);
		}
		el = document.createElement("div");
		el.id = "updNote";
		el.hidden = true;
		el.setAttribute("role", "status");
		el.setAttribute("aria-live", "polite");
		el.innerHTML = "<button class=\"un-go\" type=\"button\"><b aria-hidden=\"true\">↻</b><span></span></button><button class=\"un-x\" type=\"button\">×</button>";
		el.querySelector(".un-go").onclick = () => {
			if (S.mode !== "reload" || !S.found) return;
			try {
				if (ND.audio) ND.audio.ui();
			} catch (e) {}
			try {
				if (ND.save && ND.save.commit) ND.save.commit();
			} catch (e) {}
			ss.set("nd-upd-tried", S.found);
			try {
				location.reload();
			} catch (e) {}
		};
		el.querySelector(".un-x").onclick = () => {
			try {
				if (ND.audio) ND.audio.ui();
			} catch (e) {}
			S.dismissed = S.found || "1";
			ss.set("nd-upd-x", S.dismissed);
			sync();
		};
		($("app") || document.body).appendChild(el);
		label();
		return el;
	}
	function label() {
		if (!el) return;
		const t = T();
		el.querySelector(".un-go span").textContent = S.mode === "refresh" ? t.refresh : t.ready;
		el.querySelector(".un-x").setAttribute("aria-label", t.close);
		el.classList.toggle("refresh", S.mode === "refresh");
	}
	function wanted() {
		return !!S.found && !S.dismissed && ss.get("nd-upd-tried") !== S.found && onMenu();
	}
	function sync() {
		const on = wanted();
		if (on) build();
		if (el) {
			label();
			el.hidden = !on;
		}
	}
	async function check(force) {
		if (S.busy || !force && !onMenu()) return;
		S.busy = true;
		S.lastCheck = Date.now();
		S.checks++;
		try {
			const own = S.own || ownVersion();
			S.own = own;
			const src = typeof window.__ndUpdateSrc === "function" ? window.__ndUpdateSrc : useServer() ? fetchServer : fetchFile;
			const r = own ? await src() : null;
			if (r && typeof r.v === "string" && /^\d{1,4}(\.\d{1,4}){0,3}$/.test(r.v) && newer(r.v, own)) {
				S.found = r.v;
				S.mode = r.mode === "refresh" ? "refresh" : useServer() ? "refresh" : "reload";
			}
			S.error = null;
		} catch (e) {
			S.error = String(e && e.message || e);
		}
		S.busy = false;
		sync();
	}
	setInterval(() => {
		if (!S.found && Date.now() - S.lastCheck >= CHECK_MS && onMenu()) check(false);
	}, TICK_MS);
	setInterval(() => {
		if (S.found) sync();
	}, 1e3);
	document.addEventListener("visibilitychange", () => {
		if (S.found) sync();
	});
	if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(() => label());
	ND.updateNote = {
		state: () => ({
			own: S.own || ownVersion(),
			found: S.found,
			mode: S.mode,
			dismissed: S.dismissed,
			shown: !!(el && !el.hidden),
			onMenu: onMenu(),
			checks: S.checks,
			lastCheck: S.lastCheck,
			error: S.error,
			server: useServer()
		}),
		check: () => check(true),
		show(v, mode) {
			S.found = v;
			S.mode = mode === "refresh" ? "refresh" : "reload";
			sync();
		},
		hide() {
			S.found = null;
			sync();
		},
		newer
	};
})(window.ND);
