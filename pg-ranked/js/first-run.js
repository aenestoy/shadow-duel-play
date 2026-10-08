(function(ND) {
	"use strict";
	const $ = (id) => typeof document !== "undefined" ? document.getElementById(id) : null;
	const tr = (s, ...a) => ND.firstTr ? ND.firstTr(s, ...a) : s;
	const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;"
	})[c]);
	const OFF = (() => {
		try {
			return /[?&]guide=0(&|$)/.test(location.search || "");
		} catch (e) {
			return false;
		}
	})();
	const GUIDE_N = 3;
	const NEXT_S = 5;
	const VS_S = 3;
	const P = () => ND.save && ND.save.p || null;
	const today = () => {
		const d = new Date();
		return Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5);
	};
	const touchUI = () => !!(ND.touch && ND.touch.active);
	const portrait = () => {
		try {
			return matchMedia("(orientation: portrait)").matches;
		} catch (e) {
			return false;
		}
	};
	const st = () => ND.studioStats || null;
	const once = (n) => {
		try {
			const s = st();
			if (s && s.once) s.once(n);
		} catch (e) {}
	};
	const rep = (n) => {
		try {
			const s = st();
			if (s && s.rep) s.rep(n);
		} catch (e) {}
	};
	const HP_TAGS = [
		[.5, "p50"],
		[.25, "p25"],
		[0, "p0"],
		[-.25, "m0"],
		[-.5, "m25"]
	];
	const hpTag = (G) => {
		const F = G && G.F;
		if (!F) return "na";
		const d = F[0].hp / Math.max(1, F[0].maxHp) - F[1].hp / Math.max(1, F[1].maxHp);
		for (const [v, t] of HP_TAGS) if (d >= v) return t;
		return "m50";
	};
	const GAH_S = .6;
	const NO_MATCH = {
		attract: 1,
		watch: 1
	};
	let M = null;
	let ff = null;
	let inputSent = false, orientSent = false;
	function matchStart(G) {
		M = null;
		if (!G || NO_MATCH[G.mode]) return;
		M = {
			mode: G.mode,
			ended: false,
			hid: false,
			cine: 0,
			dis: 0,
			atk: 0,
			gah: 0,
			open: -1,
			wasAtk: false,
			lastCine: [null, null],
			lastDis: [null, null]
		};
		for (let i = 0; i < 2; i++) {
			const z = G.F[i] && G.F[i].dz;
			M.lastDis[i] = z ? z.disarmT : null;
			M.lastCine[i] = z ? z.cine : null;
		}
		rep("match_start");
	}
	function matchEnd(G, w) {
		if (!M || M.ended) return;
		M.ended = true;
		const me = G.local ? G.local() : G.F[0];
		rep(w && w === me ? "match_win" : "match_loss");
		rep("mx_cine_" + (M.cine >= 3 ? "3p" : M.cine));
		rep("mx_disarm_" + (M.dis >= 2 ? "2p" : M.dis));
		if (M.atk >= 3) {
			const r = M.gah / M.atk;
			rep("mx_gah_" + (r >= .75 ? 75 : r >= .5 ? 50 : r >= .25 ? 25 : 0));
		}
		if (!inputSent) {
			inputSent = true;
			const c = me && me.ctrl;
			rep(touchUI() ? ND.touchUI && ND.touchUI.prefs && ND.touchUI.prefs.layout === "simple" ? "input_simple" : "input_dpad" : c && c.lastSrc && c.lastSrc[0] === "g" ? "input_pad" : "input_keys");
		}
		if (ff) {
			once((w && w === G.F[0] ? "ff_r1_win_" : "ff_r1_loss_") + hpTag(G));
			ff = null;
		}
	}
	function probe(G) {
		if (!M || M.ended || !G || G.simOnly || G.phase !== "fight" || !G.F) return;
		for (let i = 0; i < 2; i++) {
			const z = G.F[i].dz;
			if (!z) continue;
			if (z.cine && z.cine !== M.lastCine[i] && z.cine.fin) M.cine++;
			M.lastCine[i] = z.cine;
			if (z.disarmT != null && z.disarmT !== M.lastDis[i]) M.dis++;
			M.lastDis[i] = z.disarmT;
		}
		if (ND.tutor && ND.tutor.on) return;
		const f = G.local ? G.local() : G.F[0], atk = f.state === "atk" && !(f.atk && f.atk.counter);
		if (M.wasAtk && !atk && !f.dead && f.state !== "hurt" && f.state !== "launch" && f.state !== "down") {
			M.atk++;
			M.open = G.clock + GAH_S;
		}
		M.wasAtk = atk;
		if (M.open > 0) {
			const g = f.ctrl && f.ctrl.held && f.ctrl.held("guard") || f.state === "guard" || f.state === "block" || f.state === "parry";
			if (g) {
				M.gah++;
				M.open = -1;
			} else if (G.clock > M.open || atk) M.open = -1;
		}
	}
	function leftMatch(why) {
		if (!M || M.ended) return;
		if (why === "hide") {
			if (!M.hid) {
				M.hid = true;
				rep("match_hide");
			}
		} else {
			M.ended = true;
			rep("match_quit");
		}
		if (ff) {
			const T = ND.tutor;
			once(T && T.on ? "ff_quit_tut" + (T.stepN || 0) : "ff_quit_r1_" + hpTag(ND.game));
			if (why !== "hide") ff = null;
		}
	}
	const FR = ND.firstRun = {
		NEXT_S,
		VS_S,
		GUIDE_N,
		get off() {
			return OFF;
		},
		guided() {
			const p = P();
			return !OFF && !!p && (p.guide | 0) < GUIDE_N;
		},
		oneRound() {
			const p = P();
			return !OFF && !!p && (p.guide | 0) === 0 && !p.coached;
		},
		rankedGate() {
			return FR.guided() ? touchUI() ? "hide" : "quiet" : "";
		},
		roundBegun() {
			if (ff) {
				ff.round = true;
				once("ff_r1_start");
			}
		},
		tomorrowXp() {
			const X = ND.LEVEL && ND.LEVEL.XP, p = P(), d = p && p.lv && p.lv.d, t = today();
			const base = X ? X.firstWin : 100, per = X ? X.streak : 15, max = X ? X.streakMax : 6;
			const s0 = d && typeof d.s === "number" ? d.s : 0, s = d && d.k === t ? s0 : d && d.k === t - 1 ? s0 + 1 : 1;
			return base + per * Math.min(max, Math.max(0, s));
		},
		todayXp() {
			const X = ND.LEVEL && ND.LEVEL.XP, p = P(), d = p && p.lv && p.lv.d, t = today();
			const base = X ? X.firstWin : 100, per = X ? X.streak : 15, max = X ? X.streakMax : 6;
			const s0 = d && typeof d.s === "number" ? d.s : 0, s = d && d.k === t ? s0 : d && d.k === t - 1 ? s0 + 1 : 1;
			return base + per * Math.min(max, Math.max(0, s - 1));
		},
		goal() {
			const H = ND.honor, HON = ND.HONOR;
			if (!H || !H.goal || !HON) return null;
			const g = H.goal();
			if (!g || !g.ch || g.kind === "all") return null;
			const name = g.ch.name, col = g.ch.col && g.ch.col.ui;
			if (g.kind === "ready") return {
				kanji: g.ch.kanji,
				color: col,
				name,
				text: tr("Rival challenge ready!"),
				pct: 1
			};
			const L = H.last, won = !!(L && L.rows && L.rows.some((q) => q[0] === "win"));
			const per = Math.max(5, won && L.total > 0 ? L.total : HON.win && HON.win[0] || 20), n = Math.max(1, Math.ceil(g.left / per));
			return {
				kanji: g.ch.kanji,
				color: col,
				name,
				text: n === 1 ? tr("Rival challenge in 1 win") : tr("Rival challenge in {0} wins", n),
				pct: g.pct
			};
		}
	};
	let cd = null;
	function cdStop(why) {
		if (!cd) return;
		const c = cd;
		cd = null;
		clearInterval(c.iv);
		if (c.tag && c.tag.parentNode) c.tag.remove();
		if (c.hint && c.hint.parentNode) c.hint.remove();
		c.btn.classList.remove("fr-cd");
		if (why === "stay" && c.stat) rep("guide_stay");
	}
	function cdStart(btn, sec, o = {}) {
		cdStop();
		if (!btn) return;
		const tag = document.createElement("i");
		tag.className = "fr-cdn";
		tag.setAttribute("aria-hidden", "true");
		btn.appendChild(tag);
		btn.classList.add("fr-cd");
		btn.style.setProperty("--fr-cd", sec + "s");
		const hint = null;
		let left = sec * 1e3, last = Date.now();
		const c = cd = {
			btn,
			tag,
			hint,
			stat: !!o.stat,
			iv: 0
		};
		const show = () => {
			tag.textContent = String(Math.max(1, Math.ceil(left / 1e3)));
		};
		show();
		c.iv = setInterval(() => {
			const now = Date.now(), dt = now - last;
			last = now;
			if (cd !== c) return;
			if (!o.live || !o.live()) {
				cdStop();
				return;
			}
			if (document.hidden || ND.ads && ND.ads.busy || ND.pass && ND.pass.isOpen || $("lvUp") && !$("lvUp").hidden) return;
			left -= dt;
			show();
			if (left <= 0) {
				cdStop();
				if (o.stat) rep("guide_next_auto");
				btn.click();
			}
		}, 100);
	}
	const stayIf = (e) => {
		if (!cd) return;
		const t = e.target;
		if (t && t.closest && t.closest(".fr-cd")) {
			if (cd.stat) rep("guide_next_tap");
			cdStop();
			return;
		}
		if (e.type === "keydown" && (e.key === "Enter" || e.key === " ")) {
			cdStop();
			return;
		}
		cdStop("stay");
	};
	if (typeof window !== "undefined") {
		window.addEventListener("pointerdown", stayIf, true);
		window.addEventListener("keydown", stayIf, true);
	}
	function guideBox() {
		let el = $("endGuide");
		if (el) return el;
		const btns = $("end") && $("end").querySelector(".btns");
		if (!btns) return null;
		el = document.createElement("div");
		el.id = "endGuide";
		el.className = "fr-guide";
		el.hidden = true;
		btns.insertBefore(el, btns.firstChild);
		return el;
	}
	let goal0 = null;
	const pctOf = (v) => (Math.max(.03, Math.min(1, v)) * 100).toFixed(1) + "%";
	function goalHtml() {
		const g = FR.goal();
		if (!g) return "";
		const p0 = goal0 && goal0.name === g.name ? goal0.pct : g.pct;
		return `<div class="fr-goal"><b class="fr-k" style="color:${esc(g.color || "#f1d69c")}">${esc(g.kanji)}</b><span><strong>${esc(tr("NEW NINJA: {0}", g.name))}</strong>` + `<small>${esc(g.text)}</small><i class="fr-bar" style="--p0:${pctOf(p0)};--p:${pctOf(g.pct)}"></i></span></div>`;
	}
	function backHtml() {
		const CG = ND.cgAccount, A = ND.STR && ND.STR.acct || {};
		const sign = CG && CG.available && !CG.signedIn && A.cgSave ? `<button class="btn fr-sign" type="button">${esc(A.cgSave)}</button>` : "";
		return `<div class="fr-back"><b>${esc(tr("COME BACK TOMORROW"))}</b><span>${esc(tr("Daily reward waiting: your first win gives +{0} XP", FR.tomorrowXp()))}</span>${sign}</div>`;
	}
	function wireSign(box) {
		const b = box && box.querySelector(".fr-sign");
		if (!b) return;
		b.onclick = (e) => {
			e.stopPropagation();
			rep("cg_nudge_tap");
			const CG = ND.cgAccount;
			if (CG && CG.prompt) CG.prompt().then((ok) => {
				if (ok) b.remove();
			});
		};
	}
	function promise() {
		const p = P();
		if (!p) return false;
		const d = today();
		if (p.back && p.back.d === d) return false;
		p.back = {
			d,
			s: false
		};
		if (ND.save.commit) ND.save.commit();
		rep("back_shown");
		return true;
	}
	function guidedEnd(A, wasGuided, won) {
		const box = guideBox();
		if (!box) return;
		box.hidden = true;
		box.innerHTML = "";
		const p = P(), R = A.run;
		if (!wasGuided || !p || !R) return;
		const n = (p.guide | 0) + 1;
		p.guide = Math.min(GUIDE_N, n);
		if (ND.save.commit) ND.save.commit();
		if (ND.ranked && ND.ranked.syncEntry) ND.ranked.syncEntry();
		const last = n >= GUIDE_N, boss = R.fights[R.i] && R.fights[R.i].boss;
		const end = $("end"), E = ND.STR && ND.STR.end || {}, O = ND.STR && ND.STR.onb || {};
		end.classList.add("fr-on", "fr-simple");
		if (won && E.winSub && R.fightPts) $("endSub").textContent = E.winSub(R.i + 1, R.fights.length, R.fightPts[R.i] || 0);
		if (E.menu) $("bEndMenu").textContent = E.menu;
		const dlg = end.querySelector(".dialog");
		let det = $("frDet");
		if (!det && dlg) {
			det = document.createElement("button");
			det.id = "frDet";
			det.type = "button";
			det.className = "fr-det";
			dlg.insertBefore(det, dlg.querySelector(".btns"));
		}
		if (det) {
			det.textContent = (O.more || "Details") + " ▾";
			det.hidden = false;
			det.onclick = (e) => {
				e.stopPropagation();
				end.classList.toggle("fr-simple");
			};
		}
		let html = goalHtml();
		if (last && promise()) html += backHtml();
		if (!html && last) return;
		box.innerHTML = html;
		box.hidden = !html;
		wireSign(box);
		if (last || boss) return;
		const btn = $("bRematch");
		pendingCd = {
			btn,
			won,
			box
		};
	}
	let pendingCd = null;
	function contRun() {
		const p = P();
		if (!p || !p.np || !p.last) return null;
		const R = p.journey && p.journey.runs && p.journey.runs[p.last];
		if (!R || R.done || !(R.i >= 1) || R.i >= R.fights.length) return null;
		const ci = ND.CHARS.findIndex((c) => c.id === p.last), op = ND.CHARS.find((c) => c.id === (R.fights[R.i] && R.fights[R.i].opp));
		if (ci < 0 || !op) return null;
		return {
			ci,
			i: R.i,
			n: R.fights.length,
			op
		};
	}
	function menuCard() {
		const menu = $("menu"), play = $("mplay");
		if (!menu || !play) return;
		let b = $("mcont");
		const c = OFF ? null : contRun();
		if (!c) {
			if (b) b.hidden = true;
			return;
		}
		if (!b) {
			b = document.createElement("button");
			b.id = "mcont";
			b.type = "button";
			b.className = "mode fr-cont";
			play.parentNode.insertBefore(b, play);
			b.onclick = () => {
				const cc = contRun();
				if (!cc) return;
				rep("cont_tap");
				try {
					if (ND.audio) {
						ND.audio.init();
						ND.audio.ui();
					}
				} catch (e) {}
				FR.gate(() => {
					if (ND.game && ND.game.sel) ND.game.sel.c[0] = cc.ci;
					ND.arcade.begin(cc.ci);
				});
			};
		}
		b.hidden = false;
		b.innerHTML = `<strong>${esc(tr("CONTINUE JOURNEY"))}</strong><span>${esc(tr("Fight {0}/{1} · vs {2}", c.i + 1, c.n, c.op.name))}</span><b class="mk" aria-hidden="true">${esc(c.op.kanji)}</b>`;
	}
	function menuNote() {
		const p = P();
		if (!p || OFF) return;
		const d = today();
		if (p.back && p.back.d < d && !p.back.s) {
			p.back.s = true;
			if (ND.save.commit) ND.save.commit();
			rep("back_ready");
			showNote(`<b>${esc(tr("DAILY REWARD READY"))}</b><span>${esc(tr("Win a fight today: +{0} XP", FR.todayXp()))}</span>`, 6500);
			return;
		}
		if (menuFromFight && p.np && (p.guide | 0) >= 1 && (!p.back || p.back.d !== d) && promise()) showNote(backHtml(), 9e3);
	}
	function showNote(html, ms) {
		let el = $("frNote");
		if (!el) {
			el = document.createElement("div");
			el.id = "frNote";
			el.className = "fr-note";
			el.setAttribute("role", "status");
			($("app") || document.body).appendChild(el);
		}
		el.innerHTML = html + "<button class=\"fr-x\" type=\"button\" aria-label=\"×\">×</button>";
		el.hidden = false;
		el.classList.remove("out");
		wireSign(el);
		const shut = () => {
			el.classList.add("out");
			setTimeout(() => {
				el.hidden = true;
			}, 300);
		};
		el.querySelector(".fr-x").onclick = (e) => {
			e.stopPropagation();
			shut();
		};
		clearTimeout(showNote.t);
		showNote.t = setTimeout(shut, ms);
	}
	let gateFn = null, gateAt = 0;
	FR.gate = (fn) => {
		if (OFF || !touchUI() || !portrait()) {
			fn();
			return false;
		}
		const el = gateEl();
		gateFn = fn;
		gateAt = Date.now();
		el.hidden = false;
		rep("rot_menu_shown");
		return true;
	};
	function gateEl() {
		let el = $("rotGate");
		if (el) return el;
		el = document.createElement("div");
		el.id = "rotGate";
		el.className = "overlay";
		el.hidden = true;
		el.setAttribute("role", "dialog");
		const TT = ND.STR && ND.STR.touch || {};
		el.innerHTML = "<div class=\"rg-wrap\"><svg class=\"rg-ic\" viewBox=\"0 0 160 160\" aria-hidden=\"true\">" + "<path class=\"rg-arc\" d=\"M30 58 A56 56 0 0 1 112 26\" fill=\"none\" stroke-width=\"5\" stroke-linecap=\"round\"/>" + "<path class=\"rg-arc\" d=\"M104 16 L114 26 L101 33\" fill=\"none\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>" + "<g class=\"rg-ph\"><rect x=\"55\" y=\"38\" width=\"50\" height=\"88\" rx=\"9\" fill=\"none\" stroke-width=\"5\"/><rect x=\"62\" y=\"49\" width=\"36\" height=\"62\" rx=\"2\" class=\"rg-scr\"/>" + "<path class=\"rg-ninja\" d=\"M80 62 l5 9 -3 13 6 13 M80 62 l-6 10 2 12 -6 12 M85 71 l9 -8\" fill=\"none\" stroke-width=\"3\" stroke-linecap=\"round\"/><circle cx=\"80\" cy=\"58\" r=\"4\" class=\"rg-head\"/>" + "<circle cx=\"80\" cy=\"119\" r=\"2.6\" class=\"rg-dot\"/></g></svg>" + `<b>${esc(TT.rotateTitle || "Turn your screen sideways")}</b><span>${esc(tr("The fight starts as soon as you turn it"))}</span>` + `<button class="btn" id="rgBack" type="button">${esc(tr("Back"))}</button></div>`;
		($("app") || document.body).appendChild(el);
		el.querySelector("#rgBack").onclick = () => {
			gateFn = null;
			el.hidden = true;
			rep("rot_menu_back");
		};
		return el;
	}
	function gateCheck() {
		const el = $("rotGate");
		if (!el || el.hidden || !gateFn || portrait()) return;
		const fn = gateFn;
		gateFn = null;
		rep("rot_menu_turned_" + secTag((Date.now() - gateAt) / 1e3));
		setTimeout(() => {
			el.hidden = true;
			fn();
		}, 250);
	}
	const secTag = (s) => s < 3 ? "s3" : s < 6 ? "s6" : s < 10 ? "s10" : s < 20 ? "s20" : "sl";
	try {
		window.addEventListener("resize", gateCheck);
		window.addEventListener("orientationchange", () => setTimeout(gateCheck, 120));
	} catch (e) {}
	FR.demo = (which) => {
		if (which === "gate") {
			gateEl().hidden = false;
			return;
		}
		if (which === "gate-off") {
			const g = $("rotGate");
			if (g) g.hidden = true;
			return;
		}
		if (which === "note") {
			showNote(backHtml(), 6e4);
			return;
		}
		if (which === "ready") {
			showNote(`<b>${esc(tr("DAILY REWARD READY"))}</b><span>${esc(tr("Win a fight today: +{0} XP", FR.todayXp()))}</span>`, 6e4);
			return;
		}
		if (which === "cont") {
			menuCard();
		}
	};
	let menuFromFight = false, wasMenu = false, vsCd = false;
	function install() {
		const G = ND.game, A = ND.arcade;
		if (!G || !A || install.done) return !!install.done;
		install.done = true;
		const wrap = (obj, name, after, before) => {
			const f = obj && obj[name];
			if (typeof f !== "function") return;
			obj[name] = function(...args) {
				let pre;
				if (before) try {
					pre = before.apply(this, args);
				} catch (e) {}
				const r = f.apply(this, args);
				if (after) try {
					after.call(this, args, r, pre);
				} catch (e) {}
				return r;
			};
		};
		wrap(G, "start", function() {
			matchStart(this);
			goal0 = FR.guided() ? FR.goal() : null;
		}, function() {
			cdStop();
			const ms = $("end");
			if (ms) ms.classList.remove("fr-on", "fr-simple");
			const d = $("frDet");
			if (d) d.hidden = true;
			leftMatch("quit");
			ff = null;
		});
		const CT = ND.coach && ND.coach.tips;
		if (CT) for (const k of ["afterWin", "afterFight"]) {
			const f = CT[k];
			if (typeof f === "function") CT[k] = function() {
				return FR.guided() ? false : f.apply(this, arguments);
			};
		}
		wrap(G, "matchEnd", null, function(w) {
			matchEnd(this, w);
		});
		wrap(A, "onMatchEnd", function(args, r, wasGuided) {
			if (this.G.mode === "arcade") guidedEnd(this, wasGuided, args[0] === this.G.F[0]);
		}, function() {
			return FR.guided();
		});
		wrap(A, "openVs", function() {
			if (FR.guided() && this.run && this.run.i > 0) vsCd = true;
		});
		wrap(A, "fight", function() {
			const R = this.run;
			if (R && R.i === 0 && ND.tutor && ND.tutor.on && ND.tutor.opts && ND.tutor.opts.oneRound) ff = { at: Date.now() };
		});
		wrap(G, "update", function() {
			probe(this);
		});
		try {
			document.addEventListener("visibilitychange", () => {
				if (document.hidden) leftMatch("hide");
			});
		} catch (e) {}
		return true;
	}
	setInterval(() => {
		if (!install()) return;
		const G = ND.game;
		const end = $("end"), vs = $("vs"), menu = $("menu");
		if (pendingCd && end && !end.hidden && G.phase === "end") {
			const c = pendingCd;
			pendingCd = null;
			cdStart(c.btn, NEXT_S, {
				stat: true,
				live: () => G.phase === "end" && !end.hidden
			});
		}
		if (pendingCd && G.phase !== "end") pendingCd = null;
		if (vsCd && G.phase === "vs" && vs && !vs.hidden) {
			vsCd = false;
			cdStart($("vsGo"), VS_S, { live: () => G.phase === "vs" && !vs.hidden });
		}
		if (vsCd && G.phase !== "vs") vsCd = false;
		const atMenu = G.mode === "attract" && menu && !menu.hidden;
		if (atMenu && !wasMenu) {
			leftMatch("menu");
			if (ND.ranked && ND.ranked.syncEntry) ND.ranked.syncEntry();
			menuCard();
			menuNote();
			menuFromFight = false;
		}
		if (!atMenu && G.mode !== "attract") menuFromFight = true;
		if (atMenu && touchUI() && !orientSent) {
			orientSent = true;
			rep(portrait() ? "menu_up" : "menu_side");
		}
		wasMenu = atMenu;
		gateCheck();
	}, 250);
})(window.ND = window.ND || {});
