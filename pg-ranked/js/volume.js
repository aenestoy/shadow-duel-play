(function(ND) {
	"use strict";
	const $ = (id) => document.getElementById(id);
	const au = ND.audio;
	const KINDS = [
		"master",
		"music",
		"sfx"
	];
	const T = () => ND.STR && ND.STR.vol || {};
	const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;"
	})[c]);
	const pct = (k) => Math.round(au.vol[k] * 100);
	const fmt = (p) => {
		const f = T().pct;
		try {
			return typeof f === "function" ? f(p) : p + "%";
		} catch (e) {
			return p + "%";
		}
	};
	function read() {
		let s = null;
		try {
			s = ND.save ? ND.save.settings().vol : null;
		} catch (e) {}
		for (const k of KINDS) {
			const v = s && typeof s === "object" ? Number(s[k]) : NaN;
			au.setVolume(k, Number.isFinite(v) ? Math.max(0, Math.min(100, v)) / 100 : au.VOL_DEFAULT[k]);
		}
	}
	let saveT = 0;
	function save() {
		clearTimeout(saveT);
		saveT = setTimeout(() => {
			try {
				if (!ND.save) return;
				const s = ND.save.settings();
				s.vol = {
					master: pct("master"),
					music: pct("music"),
					sfx: pct("sfx")
				};
				ND.save.saveSettings(s);
			} catch (e) {}
		}, 250);
	}
	read();
	const soundOn = () => !ND.settings || ND.settings.sound !== false;
	const musicOn = () => !ND.settings || ND.settings.music !== false;
	let lastPreview = 0;
	function set(kind, v) {
		if (!soundOn() && $("tSound")) $("tSound").click();
		if (kind === "music" && !musicOn() && $("tMusic")) $("tMusic").click();
		au.setVolume(kind, v / 100);
		if (kind === "sfx") {
			const now = performance.now();
			if (now - lastPreview >= 125) {
				lastPreview = now;
				try {
					au.previewFx();
				} catch (e) {}
			}
		}
		save();
		refresh();
	}
	function build(box, withMute) {
		if (!box) return;
		const O = T();
		const row = (k) => {
			const id = `${box.id}-${k}`;
			return `<div class="vrow"><label for="${id}">${esc(O[k] || k)}</label>` + `<input type="range" id="${id}" min="0" max="100" step="5" data-vol="${k}">` + `<output for="${id}" data-vout="${k}"></output></div>`;
		};
		box.innerHTML = `<div class="vhead"><h3>${esc(O.title || "Volume")}</h3>` + (withMute ? `<button type="button" class="tog" data-vmute><i></i><span>${esc(O.sound || "Sound")}</span></button>` : "") + "</div>" + KINDS.map(row).join("") + `<p class="vnote" data-vnote hidden>${esc(O.muted || "")}</p>`;
		box.setAttribute("role", "group");
		box.setAttribute("aria-label", O.title || "Volume");
		box.querySelectorAll("[data-vol]").forEach((r) => {
			r.oninput = () => set(r.dataset.vol, +r.value);
			r.onclick = (e) => e.stopPropagation();
			r.addEventListener("keydown", (e) => {
				if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
				const inp = ND.input;
				if (!inp || !inp.onPause) return;
				if (e.code === "KeyP" || inp.escAllowed && e.code === "Escape") {
					const pz = $("pause");
					if (!pz || pz.hidden) return;
					e.preventDefault();
					e.stopPropagation();
					inp.onPause(e);
				}
			});
		});
		const m = box.querySelector("[data-vmute]");
		if (m) m.onclick = (e) => {
			e.stopPropagation();
			if ($("tSound")) $("tSound").click();
		};
	}
	function refresh() {
		const O = T(), off = !soundOn();
		document.querySelectorAll(".vol").forEach((box) => {
			box.classList.toggle("muted", off);
			box.querySelectorAll("[data-vol]").forEach((r) => {
				const k = r.dataset.vol, p = pct(k);
				if (document.activeElement !== r || +r.value !== p) r.value = String(p);
				r.style.setProperty("--p", p + "%");
				r.setAttribute("aria-valuetext", fmt(p));
				r.classList.toggle("off", k === "music" && !musicOn());
			});
			box.querySelectorAll("[data-vout]").forEach((o) => {
				o.textContent = fmt(pct(o.dataset.vout));
			});
			const m = box.querySelector("[data-vmute]");
			if (m) m.setAttribute("aria-pressed", String(!off));
			const n = box.querySelector("[data-vnote]");
			if (n) n.hidden = !off || !O.muted;
		});
	}
	function buildAll() {
		build($("setVol"), false);
		build($("pauseVol"), true);
		refresh();
	}
	ND.volumeUI = {
		refresh,
		rebuild: buildAll,
		read
	};
	const start = () => {
		buildAll();
		if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(buildAll);
		document.querySelectorAll("#tSound, #tMusic, [data-tog=\"sound\"], [data-tog=\"music\"]").forEach((el) => el.addEventListener("click", () => setTimeout(refresh, 0)));
	};
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
	else setTimeout(start, 0);
})(window.ND);
