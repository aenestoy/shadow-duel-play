(function(ND) {
	"use strict";
	const LV = ND.LEVEL;
	if (!LV || !ND.save) return;
	const $ = (id) => document.getElementById(id);
	const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	})[c]);
	const T = () => ND.STR && ND.STR.pass || {};
	const num = (n) => ND.i18n && ND.i18n.num ? ND.i18n.num(n) : String(Math.round(n));
	const nice = (s) => s ? s[0] + s.slice(1).toLowerCase() : "";
	const tz = () => {
		try {
			return new Date().getTimezoneOffset();
		} catch (e) {
			return 0;
		}
	};
	const charIds = () => (ND.CHARS || []).map((c) => c.id);
	const chOf = (id) => (ND.CHARS || []).find((c) => c.id === id) || null;
	const au = () => ND.audio && ND.audio.ready ? ND.audio : null;
	const safe = (fn) => {
		try {
			return fn();
		} catch (e) {
			console.warn("[pass]", e);
			return undefined;
		}
	};
	let cache = {
		p: null,
		s: null
	};
	function S() {
		const p = ND.save.p;
		if (cache.p !== p || p.lv !== cache.s) {
			const st = LV.cleanState(p.lv, charIds());
			if (!st.mig) LV.migrate(st, p);
			p.lv = st;
			cache = {
				p,
				s: st
			};
		}
		return cache.s;
	}
	const commit = () => ND.save.commit();
	const DEF = LV.cleanSeason(LV.DEFAULT_SEASON);
	let remote = null;
	function season() {
		const t = P.now();
		if (remote && t >= remote.start && t < remote.end) return remote;
		const c = LV.seasonAt(t);
		return {
			key: c.key,
			n: c.n,
			start: c.start,
			end: c.end,
			C: DEF
		};
	}
	function sp(st, se) {
		return st.ps[se.key] || (st.ps[se.key] = {
			x: 0,
			f: [],
			b: [],
			a: 0,
			w: 0
		});
	}
	const changed = () => {
		try {
			if (ND.passNet && ND.passNet.soon) ND.passNet.soon();
		} catch (e) {}
	};
	const once = (name) => {
		try {
			if (ND.studioStats && ND.studioStats.event) ND.studioStats.event(name);
		} catch (e) {}
	};
	const rwOk = () => !!(ND.passNet && ND.passNet.canGrant && ND.passNet.canGrant());
	const rwEntry = (it) => it && it.kind === "rw" && ND.rewards ? ND.rewards.get(it.ref) : null;
	const daysLeft = (se) => Math.max(0, Math.ceil((se.end - P.now()) / 864e5));
	const adsOk = () => !!(ND.ads && ND.ads.rewardedAvailable && ND.ads.rewardedAvailable());
	function itemName(id, short) {
		const it = LV.item(id), t = T();
		if (!it) return "";
		if (it.journey) {
			const ch = chOf(it.ninja), n = ch ? nice(ch.name) : it.ninja;
			return it.kind === "cos" ? it.journey === 2 ? t.cos2(n) : t.cos3(n) : n + " · " + ((t.rank || {})[it.journey] || "");
		}
		if (it.kind === "cos" && it.theme) {
			const ch = chOf(it.ninja);
			return ((t.themes || {})[it.theme] || it.theme) + " · " + (ch ? nice(ch.name) : it.ninja);
		}
		if (it.kind === "cos" && it.drawn) {
			const ch = chOf(it.ninja), n = (t.flair || {})[it.drawn] || (ND.flair ? ND.flair.name(it.drawn) : id);
			return short ? n : n + " · " + (ch ? nice(ch.name) : it.ninja);
		}
		if (it.flair) return (t.flair || {})[id] || (ND.flair ? ND.flair.name(id) : (t.kinds2 || {})[it.kind] || id);
		if (t.items2 && t.items2[id]) return t.items2[id];
		if (it.kind === "boost") return t.boostName ? t.boostName(it.n) : id;
		if (it.kind === "honor") return t.honorName ? t.honorName(it.n) : id;
		if (it.kind === "rw") return ND.rewards && ND.rewards.name(it.ref) || it.ref;
		return t.items && t.items[id] || id;
	}
	const hex2rgb = (h) => [
		1,
		3,
		5
	].map((i) => parseInt(h.slice(i, i + 2), 16));
	function hsl2hex(h, s, l) {
		s /= 100;
		l /= 100;
		const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
		const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
		return "#" + [
			f(0),
			f(8),
			f(4)
		].map((v) => v.toString(16).padStart(2, "0")).join("");
	}
	function hueOf(hex) {
		const [r, g, b] = hex2rgb(hex).map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
		if (!d) return 220;
		const h = mx === r ? (g - b) / d % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
		return (h * 60 + 360) % 360;
	}
	const rgba = (hex, a) => `rgba(${hex2rgb(hex).join(",")},${a})`;
	function themePal(c, X) {
		const o = Object.assign({}, c, X);
		o.skin = c.skin;
		if (!X.rim) {
			o.rim = c.rim;
			o.rimDim = c.rimDim;
		}
		if (c.haori) o.haori = X.cloth;
		if (c.hood) o.hood = {
			cloth: X.hakama || X.wrapDark,
			clothHi: X.wrap,
			clothDark: X.hakamaDark || X.wrapDark
		};
		if (c.armor) o.armor = X.clothDark;
		if (c.mask) o.mask = X.accent;
		if (c.glove) o.glove = X.wrap;
		if (c.tabi) o.tabi = X.hakamaDark || X.wrapDark;
		return o;
	}
	function journeyX(c, n) {
		const h = hueOf(c.ui);
		if (n === 2) return {
			cloth: hsl2hex(h, 42, 27),
			clothHi: hsl2hex(h, 38, 38),
			clothDark: hsl2hex(h, 46, 16),
			wrap: "#ece4d2",
			wrapDark: "#a59c88",
			accent: "#f6efe0",
			accentDark: "#9c917a",
			ui: c.ui,
			hakama: hsl2hex(h, 30, 12),
			hakamaDark: hsl2hex(h, 30, 7),
			rim: "rgba(255,240,215,.62)",
			rimDim: "rgba(200,185,160,.32)"
		};
		return {
			cloth: "#0e0e13",
			clothHi: "#24242e",
			clothDark: "#07070a",
			wrap: hsl2hex(h, 58, 34),
			wrapDark: hsl2hex(h, 58, 18),
			accent: "#f4efe6",
			accentDark: "#8f897d",
			ui: c.ui,
			hakama: "#0a0a0e",
			hakamaDark: "#050507",
			rim: rgba(c.ui, .95),
			rimDim: rgba(c.ui, .5)
		};
	}
	const palCache = new Map();
	function itemPal(ch, id) {
		const it = LV.item(id);
		if (!ch || !it || it.kind !== "cos" || it.ninja && it.ninja !== ch.id) return null;
		const k = ch.id + "|" + id;
		let p = palCache.get(k);
		if (!p && it.drawn) {
			p = ND.passCostume ? ND.passCostume(ch) : null;
			if (!p) return null;
		}
		if (!p) p = themePal(ch.col, it.journey ? journeyX(ch.col, it.journey) : it.pal);
		palCache.set(k, p);
		return p;
	}
	function iconPal(it) {
		if (it.journey) {
			const ch = chOf(it.ninja);
			return ch ? themePal(ch.col, journeyX(ch.col, it.journey)) : null;
		}
		return it.pal || null;
	}
	const FLAIR_K = {
		pose: "勝",
		hitfx: "撃",
		slash: "斬",
		aura: "気",
		ko: "終",
		card: "名",
		arena: "景",
		music: "楽"
	};
	const FLAIR_UI = {
		pose: "#f1d69c",
		hitfx: "#ff8fbd",
		slash: "#ffd36a",
		aura: "#5fd2ff",
		ko: "#c3a6ff",
		card: "#e0b04a",
		arena: "#dfe6f5",
		music: "#ffb7d2"
	};
	const pics = new Map();
	function costumeCanvas(ch, key, W, H) {
		if (!ND.Fighter || !ND.Ctrl || !ND.pose || !ND.costumePal || !ND.COSTUMES || !ND.COSTUMES[key]) return null;
		const cv = document.createElement("canvas");
		cv.width = W;
		cv.height = H;
		const g = cv.getContext("2d"), f = new ND.Fighter(0, new ND.Ctrl());
		f.fullDetail = true;
		f.setChar(ch, false);
		f.col = ND.costumePal(f.col, key);
		f.reset(0);
		f.dir = 1;
		f.state = "move";
		f.dead = false;
		ND.pose.copy(f.P.stance, f.pose);
		f._anim = null;
		for (let i = 0; i < 50; i++) {
			f.solve(1 / 60);
			if (ND.updateCloth) ND.updateCloth(f.j, 1 / 60);
		}
		const gr = g.createRadialGradient(W / 2, H * .42, 2, W / 2, H * .42, W * .55);
		gr.addColorStop(0, "rgba(217,222,240,.38)");
		gr.addColorStop(1, "rgba(217,222,240,0)");
		g.fillStyle = gr;
		g.fillRect(0, 0, W, H);
		const k = H / 140;
		g.setTransform(k, 0, 0, k, W / 2 - 4 * k, H * 1.42);
		f.draw(g, false);
		return cv;
	}
	function pic(kind, id, big) {
		const key = kind + "|" + id + (big ? "|b" : "");
		if (pics.has(key)) return pics.get(key);
		let u = null;
		try {
			const S = big ? 2 : 1;
			if (kind === "cos") {
				const ch = chOf(LV.item(id).ninja), cv = ch && costumeCanvas(ch, LV.item(id).drawn, 96 * S, 96 * S);
				if (cv) u = cv.toDataURL();
			} else if (ND.flair && ND.flair.preview) {
				const cv = document.createElement("canvas");
				ND.flair.preview(kind, id, cv, {
					w: 64 * S,
					h: 64 * S,
					dpr: 1.5
				});
				u = cv.toDataURL();
			}
		} catch (e) {
			u = null;
		}
		if (u || ND.flair) pics.set(key, u);
		return u;
	}
	function icon(id) {
		let it = LV.item(id);
		if (!it) return "";
		if (it.kind === "rw") {
			const e = rwEntry(it);
			if (!e) return `<b class="ps-ttl" style="--tc:#c79bff">賞</b>`;
			if (e.kind === "costume") it = {
				kind: "cos",
				pal: Object.assign({
					cloth: "#3a3550",
					clothHi: "#5a547a",
					wrap: "#c79bff",
					accent: "#f1d69c",
					hakama: "#1b1826"
				}, e.pal || {})
			};
			else if (e.kind === "badge") it = {
				kind: "badge",
				icon: e.icon || "賞",
				color: e.color || "#c79bff"
			};
			else it = {
				kind: "title",
				color: e.color || "#c79bff"
			};
		}
		if (it.kind === "cos" && it.drawn) {
			const u = pic("cos", id);
			if (u) return `<img class="ps-pic" src="${u}" alt="">`;
			it = {
				kind: "cos",
				ninja: it.ninja,
				pal: {
					cloth: "#2a2148",
					clothHi: "#4a3c80",
					wrap: "#d9def0",
					accent: "#d6263a",
					hakama: "#1b1530",
					rim: "rgba(217,222,240,.8)"
				}
			};
		}
		if (it.flair) {
			const u = pic(it.kind, id);
			return u ? `<img class="ps-pic" src="${u}" alt="">` : `<b class="ps-fk" style="--tc:${FLAIR_UI[it.kind] || "#c79bff"}">${FLAIR_K[it.kind] || "飾"}</b>`;
		}
		if (it.kind === "rkey" || it.kind === "akey") return `<b class="ps-key${it.kind === "akey" ? " a" : ""}">${it.kind === "akey" ? "門" : "挑"}<i>鍵</i></b>`;
		if (it.kind === "ticket") return `<b class="ps-tkt">札<small>×${it.n}</small></b>`;
		if (it.kind === "shield") return `<b class="ps-shd">盾</b>`;
		if (it.kind === "cos") {
			const p = iconPal(it) || {}, rim = p.rim || "rgba(255,255,255,.3)";
			const ch = it.ninja ? chOf(it.ninja) : null;
			return `<svg class="ps-svg" viewBox="0 0 48 48" aria-hidden="true" style="filter:drop-shadow(0 0 3px ${rim})">` + `<circle cx="24" cy="26" r="21" fill="rgba(255,255,255,.07)"/>` + `<path d="M9 15 17 9.5 24 14 31 9.5 39 15 44 26 37.5 28 36 43 12 43 10.5 28 4 26Z" fill="${p.cloth}" stroke="${p.rim || "rgba(255,255,255,.4)"}" stroke-width="1.3" stroke-linejoin="round"/>` + `<path d="M17 9.5 24 23 31 9.5" fill="none" stroke="${p.clothHi}" stroke-width="2.6" stroke-linejoin="round"/>` + `<path d="M12 34 36 34 36 43 12 43Z" fill="${p.hakama || p.clothDark}"/>` + `<rect x="11.2" y="26" width="25.6" height="6.4" fill="${p.wrap}"/><rect x="11.2" y="28.3" width="25.6" height="1.8" fill="${p.accent}"/>` + (ch ? `<text x="24" y="21.5" text-anchor="middle" font-size="9" font-family="serif" fill="${p.accent}">${esc(ch.kanji)}</text>` : "") + "</svg>";
		}
		if (it.kind === "trail") {
			const g = "psg_" + id;
			return `<svg class="ps-svg" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="rgb(${it.rgb})" stop-opacity="0"/><stop offset="1" stop-color="rgb(${it.rgb})" stop-opacity="1"/></linearGradient></defs>` + `<path d="M6 40 Q14 10 42 7 Q20 18 6 40Z" fill="url(#${g})"/><path d="M8 38 Q18 14 42 7" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.3" stroke-linecap="round"/></svg>`;
		}
		if (it.kind === "badge") return `<b class="ps-bdg" style="--bc:${it.color}">${esc(it.icon)}</b>`;
		if (it.kind === "frame") return `<b class="ps-frm" style="--fc:${it.color}">名</b>`;
		if (it.kind === "title") return `<b class="ps-ttl" style="--tc:${it.color}">${it.journey ? it.journey === 3 ? "皆伝" : "免許" : "称"}</b>`;
		if (it.kind === "boost") return `<b class="ps-bst"><small>XP</small>×1.5<i>${it.n}</i></b>`;
		if (it.kind === "honor") return `<b class="ps-hon">誉<small>+${it.n}</small></b>`;
		return "";
	}
	const owns = (id) => S().own.includes(id);
	function costumesFor(ninja) {
		return S().own.filter((id) => {
			const it = LV.item(id);
			return it && it.kind === "cos" && (!it.ninja || it.ninja === ninja);
		});
	}
	function wearing(ninja) {
		const st = S(), w = st.wear[ninja];
		return w && st.own.includes(w) ? w : null;
	}
	const basePalOf = ND.palOf;
	if (basePalOf) ND.palOf = (ch, look) => typeof look === "string" && look.startsWith("ps:") ? itemPal(ch, look.slice(3)) || ch.col : basePalOf(ch, look);
	(function wrapLooks(sv) {
		const oLook = sv.look, oOpts = sv.lookOptions, oSet = sv.setLook;
		if (!oLook || !oOpts || !oSet) return;
		sv.look = function(id) {
			const w = safe(() => wearing(id));
			return w ? "ps:" + w : oLook.call(this, id);
		};
		sv.lookOptions = function(id) {
			const a = oOpts.call(this, id);
			safe(() => {
				for (const e of costumesFor(id)) a.push("ps:" + e);
			});
			return a;
		};
		sv.setLook = function(id, v) {
			const st = S();
			if (typeof v === "string" && v.startsWith("ps:")) {
				const it = v.slice(3);
				if (!costumesFor(id).includes(it)) return;
				st.wear[id] = it;
				LV.markSeen(st, it);
				commit();
				return;
			}
			if (typeof v === "string" && v.startsWith("rw:") && st.nw.includes(v)) {
				LV.markSeen(st, v);
				commit();
			}
			delete st.wear[id];
			return oSet.call(this, id, v);
		};
	})(ND.save);
	const TRAIL_OFF = {
		online: 1,
		"2p": 1,
		watch: 1,
		attract: 1
	};
	function setTrail(mode) {
		const id = S().eq.trail, it = id && LV.item(id);
		ND.passTrail = it && !TRAIL_OFF[mode] ? it.rgb : null;
	}
	const NO_XP = {
		online: 1,
		"2p": 1,
		watch: 1,
		attract: 1,
		train: 1,
		tutorial: 1
	};
	let matchNo = 0, awardedNo = -1, playSec0 = 0, last = null;
	let pend = null;
	const plateEq = new Map();
	let lastHonor = null;
	function gain(n) {
		const st = S(), se = season(), t0 = tierOf(se, sp(st, se)).tier;
		const r = LV.add(st, n, se.key, se.C.mul, se.C.lvMul);
		commit();
		for (const L of r.ups) if ([
			2,
			5,
			10,
			20
		].includes(L)) once("level_" + L);
		const t1 = tierOf(se, sp(st, se)).tier;
		for (const k of [
			5,
			10,
			30
		]) if (t0 < k && t1 >= k) once("pass_tier_" + k);
		refreshStrip();
		changed();
		return r;
	}
	function fightDone(G, w) {
		if (awardedNo === matchNo) return null;
		awardedNo = matchNo;
		const mode = G.mode;
		if (NO_XP[mode]) {
			last = null;
			return null;
		}
		const f1 = G.F && G.F[0], s = G.stats && G.stats[0] || {}, sc = ND.score && ND.score.on ? ND.score.last : null;
		let sec = sc && typeof sc.time === "number" ? sc.time : ND.ads ? ND.ads.playSec - playSec0 : 60;
		const R = mode === "arcade" && ND.arcade ? ND.arcade.run : null, early = !!R && (R.i | 0) < 2 && S().xp < NEW_XP;
		if (early) sec = Math.max(sec, LV.XP.shortSec);
		const c = {
			mode,
			won: !!w && w === f1,
			level: sc ? sc.level : 1,
			roundsWon: (G.wins && G.wins[0]) | 0,
			parries: s.parries | 0,
			counters: s.counters | 0,
			rallies: s.rallies | 0,
			perfects: s.perfect | 0,
			sec,
			welcome: early && !!w && w === f1
		};
		return award(c);
	}
	const NEW_XP = 1e3;
	function welcomeXp(st) {
		const se = season(), p = sp(st, se), R = tierOf(se, p);
		if (R.tier >= 1 || st.xp >= NEW_XP) return 0;
		const mul = se.C.mul || 1;
		return Math.max(0, Math.ceil((R.need - R.into) / mul));
	}
	function award(c) {
		const st = S(), cl = pend && Date.now() - pend.t < 5e3 ? pend : null;
		pend = null;
		const lvBefore = cl ? cl.before : LV.levelOf(st.xp);
		const x = LV.fight(st, c, P.now(), tz());
		if (x.rows.some((q) => q[0] === "daily")) {
			const p = sp(st, season());
			p.w = Math.min(60, (p.w | 0) + 1);
		}
		let r = gain(x.total);
		const wx = c.welcome ? welcomeXp(st) : 0;
		if (wx > 0) {
			r = gain(wx);
			r.from = lvBefore;
			x.rows.push(["first", wx]);
			x.total += wx;
		}
		if (cl) {
			x.rows.push([
				"clear",
				cl.xp,
				cl.n
			]);
			x.total += cl.xp;
		}
		last = {
			x,
			r,
			before: lvBefore,
			t: Date.now()
		};
		return last;
	}
	function onlineEnd(o) {
		return safe(() => {
			if (!o || o.sec != null && o.sec < LV.XP.minSec) return null;
			const r = award({
				mode: o.kind === "ranked" ? "ranked" : "friend",
				won: !!o.won,
				level: 1,
				roundsWon: o.rounds | 0,
				sec: o.sec,
				parries: o.parries | 0
			});
			if (r && r.r.ups.length) setTimeout(() => levelUp(r.r.to.lv), 1500);
			return r;
		});
	}
	function onlineResult(kind, res) {
		oppWorn = null;
		return safe(() => {
			if (!res || res.reason === "desync" || typeof res.side !== "number") return null;
			const sec = (res.frame | 0) * (ND.game && ND.game.STEP || 1 / 120);
			if (res.reason !== "ko" && sec < LV.XP.shortSec) return null;
			const st = ND.game && ND.game.stats && ND.game.stats[res.side];
			return onlineEnd({
				kind,
				won: res.winner === res.side,
				sec,
				rounds: res.wins ? res.wins[res.side] : 0,
				parries: st && st.parries
			});
		});
	}
	function bonus(key, n) {
		if (!(n > 0)) return;
		const r = gain(n);
		if (ND.toast) ND.toast(T().plus(num(n)) + " · " + ((T().rows || {})[key] || key), T().k);
		if (r.ups.length) setTimeout(() => levelUp(r.to.lv), 600);
	}
	function journeyCleared(ninja) {
		const st = S(), before = LV.levelOf(st.xp), j = LV.journeyClear(st, ninja);
		commit();
		const r = gain(j.xp);
		pend = {
			xp: j.xp,
			n: j.n,
			before,
			t: Date.now()
		};
		last = {
			x: {
				total: j.xp,
				rows: [[
					"clear",
					j.xp,
					j.n
				]]
			},
			r,
			before,
			t: Date.now()
		};
		for (const g of j.items) setTimeout(() => gotToast(g), 900);
		return j;
	}
	function payHonor(g) {
		if (g && g.kind === "honor" && ND.save.addHonor) {
			const ev = ND.save.addHonor(g.n);
			if (ND.toastEvents) ND.toastEvents(ev);
		}
	}
	const hasRanked = () => !!(ND.ranked && ND.ranked.available && safe(() => ND.ranked.available()));
	function payOut(g) {
		if (!g) return false;
		const t = T(), toast = (msg, k, c) => {
			if (ND.toast) ND.toast(msg, k, c);
		};
		if (g.kind === "rkey" || g.kind === "akey") {
			const ev = safe(() => g.kind === "rkey" ? ND.save.keyRival() : ND.save.keyArena());
			if (ev) {
				const ch = g.kind === "rkey" ? chOf(ev.id) : null, ar = g.kind === "akey" ? (ND.ARENAS || []).find((a) => a.id === ev.id) : null;
				if (ch) toast(t.keyRival(nice(ch.name)), "鍵", ch.col.ui);
				else if (ar) toast(t.keyArena(ar.name), "鍵");
				safe(() => {
					if (ND.arcade && ND.arcade.refreshMenu) ND.arcade.refreshMenu();
				});
			} else {
				payHonor({
					kind: "honor",
					n: LV.KEY_HONOR
				});
				toast(t.keyHonor(num(LV.KEY_HONOR)), "誉");
			}
			return true;
		}
		if (g.kind === "honor") {
			payHonor(g);
			if (g.from === "shield") {
				toast(hasRanked() ? t.shieldFull(num(g.n)) : t.shieldOff(num(g.n)), "盾");
				return true;
			}
			return false;
		}
		if (g.kind === "shield") {
			toast(t.shieldGot(S().sd, LV.SHIELD_MAX), "盾", "#9fd0ff");
			return true;
		}
		if (g.kind === "ticket") {
			toast(t.got + ": " + itemName(g.id) + " · " + t.tickets(S().tk), "札", "#c79bff");
			return true;
		}
		return false;
	}
	function gotToast(g) {
		if (!g || !ND.toast) return;
		const t = T(), it = LV.item(g.id);
		if (g.dup) {
			ND.toast(t.gotDup(g.n), t.k);
			return;
		}
		ND.toast(t.got + ": " + itemName(g.id), it && it.icon ? it.icon : t.k, it && it.color);
	}
	const rwBlocked = (se, t) => {
		const T0 = se.C.tiers[t - 1], it = T0 && LV.item(T0.r);
		return !!it && it.kind === "rw" && !rwOk();
	};
	function claim(tier) {
		const st = S(), se = season(), p = sp(st, se), ok = adsOk(), way = LV.claimWay(se.C, p, tier, ok);
		if (!way) return Promise.resolve(null);
		if (rwBlocked(se, tier)) {
			if (ND.toast) ND.toast(T().online, T().k);
			return Promise.resolve(null);
		}
		const done = () => {
			const first = !Object.values(S().ps).some((q) => q.f && q.f.length);
			const g = LV.claim(se.C, S(), se.key, tier, way, ok, { ranked: hasRanked() });
			if (g) {
				commit();
				const it = g.id ? LV.item(g.id) : null;
				const cel = !!it && safe(() => ND.alive && ND.alive.celebrate({
					kind: "claim",
					icon: icon(g.id),
					title: g.dup ? T().gotDup(g.n) : itemName(g.id),
					sub: T().got,
					color: it.color
				}));
				if (!payOut(g) && !cel) gotToast(g);
				fx("claim");
				changed();
				applyWorn();
				if (first) once("first_bonus_claim");
				if ((g.kind === "rw" || g.kind === "shield") && ND.passNet) ND.passNet.now();
			}
			return g;
		};
		if (way !== "ad") return Promise.resolve(done());
		if (ND.ads.busy) return Promise.resolve(null);
		return ND.ads.rewarded().then((ok2) => {
			if (!ok2) {
				if (ND.toast) ND.toast((ND.STR.ads || {}).fail || "", "忍");
				return null;
			}
			return done();
		});
	}
	function claimAllWaiting() {
		const se = season(), p = sp(S(), se);
		let n = 0;
		for (let t = 1; t <= se.C.tiers.length; t++) if (LV.claimWay(se.C, p, t, false) === "wait" && !adsOk() && !rwBlocked(se, t)) {
			claim(t);
			n++;
		}
		return n;
	}
	function readyCount() {
		const se = season(), p = sp(S(), se), ok = adsOk();
		let n = 0;
		for (let t = 1; t <= se.C.tiers.length; t++) if (LV.claimWay(se.C, p, t, ok)) n++;
		return n;
	}
	const tierOf = (se, p) => LV.tierOf(se.C, p.x);
	function equip(kind, id) {
		const st = S();
		if (kind === "arena" && typeof id === "string" && id.startsWith("plain:")) delete st.av[id.slice(6)];
		else if (!LV.equip(st, kind, id || null)) return false;
		if (id) LV.markSeen(st, id);
		commit();
		refreshStrip();
		changed();
		applyWorn();
		newDots();
		return true;
	}
	const SEEN_MS = 1e3;
	const chUnlocked = (id) => !!chOf(id) && (!ND.save.isCharUnlocked || ND.save.isCharUnlocked(id));
	const arUnlocked = (id) => (ND.ARENAS || []).some((a) => a.id === id) && (!ND.save.isArenaUnlocked || ND.save.isArenaUnlocked(id));
	const rwOwned = (ref) => !!(ND.rewards && ND.rewards.get(ref) && ND.rewards.owns(ref));
	function showable(id) {
		if (id.startsWith("ch:")) return chUnlocked(id.slice(3));
		if (id.startsWith("ar:")) return arUnlocked(id.slice(3));
		const it = LV.item(id);
		if (!it) return false;
		if (it.kind === "rw") return rwOwned(it.ref);
		if (it.kind === "shield" || it.kind === "ticket") return true;
		return S().own.includes(id);
	}
	const isNew = (id) => S().nw.includes(id);
	function newIds() {
		return safe(() => S().nw.filter(showable)) || [];
	}
	const newCount = () => newIds().length;
	function markNew(ids) {
		safe(() => {
			if (!LV.markNew(S(), ids)) return;
			commit();
			refreshStrip();
			if (P.isOpen && tab === "profile") render(false);
		});
	}
	const nwShown = new Set();
	function markSeen(ids) {
		safe(() => {
			const list = [].concat(ids);
			for (const id of list) if (isNew(id)) nwShown.add(id);
			if (!LV.markSeen(S(), list)) return;
			commit();
			refreshStrip();
			newDots();
		});
	}
	(function wrapUnlock(sv) {
		const o = sv.unlock;
		if (typeof o !== "function") return;
		sv.unlock = function(kind, id) {
			const e = o.apply(this, arguments);
			if (e && (kind === "char" || kind === "arena")) markNew((kind === "char" ? "ch:" : "ar:") + id);
			return e;
		};
	})(ND.save);
	function applyWorn() {
		safe(() => {
			const F = ND.flair;
			if (!F) return;
			const st = S();
			F.music(st.eq.music || null);
			for (const b of Object.values(LV.ARENA_BASE)) F.arena(b, st.av[b] || null);
		});
	}
	const FLAIR_OFF = {
		attract: 1,
		watch: 1,
		"2p": 1
	};
	let oppWorn = null;
	function setFlair(G, mode) {
		safe(() => {
			const F = ND.flair;
			if (!F) return;
			const me = FLAIR_OFF[mode] ? null : LV.fightFlair(S().eq);
			const side = mode === "online" ? G.localSide | 0 : 0;
			F.set(side, me);
			F.set(1 - side, oppWorn && (mode === "online" || mode === "shadow") ? oppWorn.worn : null);
			if (mode !== "online" && mode !== "shadow") oppWorn = null;
		});
	}
	function fx(kind) {
		const a = au();
		if (!a) return;
		try {
			if (kind === "claim") {
				a.tone({
					freq: 660,
					dur: .5,
					gain: .07,
					send: .5,
					type: "triangle"
				});
				a.tone({
					freq: 990,
					dur: .7,
					gain: .06,
					send: .6,
					delay: .08,
					type: "sine"
				});
			} else if (kind === "up") {
				if (a.gong) a.gong();
				if (a.taiko) a.taiko(1);
				a.tone({
					freq: 1320,
					dur: 1.2,
					gain: .05,
					send: .8,
					delay: .25,
					type: "sine"
				});
			} else if (kind === "tick") a.tone({
				freq: 1500,
				dur: .06,
				gain: .025,
				send: .1,
				type: "sine"
			});
		} catch (e) {}
	}
	const CSS = `
  .pass-strip { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; width: 100%; box-sizing: border-box; padding: 0; background: linear-gradient(90deg, rgba(120,90,200,.12), rgba(217,179,108,.06)); border: 1px solid rgba(190,160,255,.38); }
  .pass-strip.aside { flex: 1 1 100%; margin-top: 6px; }
  .ps-half { position: relative; display: grid; align-items: center; gap: 12px; min-width: 0; box-sizing: border-box; padding: 7px 12px 7px 8px; text-align: left; background: none; border: 0; color: var(--text); font: inherit; cursor: pointer; transition: background .15s, box-shadow .15s; }
  .ps-half.pf { grid-template-columns: auto minmax(0, 1fr); }
  .ps-half.ps { border-left: 1px solid rgba(190,160,255,.25); padding-left: 12px; }
  .ps-half:hover, .ps-half:focus-visible { background: rgba(120,90,200,.2); box-shadow: inset 0 0 0 1px #c79bff; outline: none; }
  .ps-mid small b { font-weight: 700; color: #f1d69c; }
  .ps-lvb { position: relative; display: grid; place-items: center; width: 42px; height: 42px; box-sizing: border-box; border: 2px solid var(--fc, var(--gold)); background: radial-gradient(circle at 35% 30%, #3a2a14, #140f08 70%); color: var(--gold-hi); font: 700 19px/1 var(--display); font-variant-numeric: tabular-nums; box-shadow: 0 0 0 1px rgba(0,0,0,.6), 0 0 14px -4px var(--fc, var(--gold)); }
  .ps-lvb small { position: absolute; top: -7px; left: 50%; transform: translateX(-50%); padding: 0 4px; background: #17130a; color: var(--gold); font: 600 9px/1.3 var(--display); letter-spacing: .14em; }
  .ps-lvb .ps-bdg { position: absolute; right: -9px; bottom: -8px; width: 19px; height: 19px; font-size: 11px; }
  .pass-strip .ps-mid { display: grid; gap: 4px; min-width: 0; }
  .pass-strip .ps-mid small { font: 500 10.5px/1 var(--display); letter-spacing: .14em; text-transform: uppercase; color: var(--gold); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pass-strip .ps-mid small em { font-style: normal; color: var(--tc, var(--muted)); }
  .pass-strip .ps-mid span { font: 600 13px/1.1 var(--display); letter-spacing: .05em; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ps-xbar { position: relative; display: block; height: 6px; background: rgba(255,255,255,.1); overflow: hidden; }
  .ps-xbar::after { content: ''; position: absolute; inset: 0 auto 0 0; width: var(--p, 0%); background: linear-gradient(90deg, #8f6bff, #c79bff 60%, #f1d69c); transition: width var(--d, 0s) cubic-bezier(.3,.7,.3,1); }
  .pass-strip .ps-pss { display: grid; justify-items: end; gap: 3px; }
  .pass-strip .ps-pss b { font: 700 13px/1 var(--display); letter-spacing: .12em; text-transform: uppercase; color: #d9c2ff; white-space: nowrap; }
  .pass-strip .ps-pss b::before { content: '影'; font-family: var(--jp); margin-right: 6px; color: #c79bff; }
  .pass-strip .ps-pss small { font: 500 10.5px/1 var(--display); letter-spacing: .1em; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
  /* the ready count sits on the strip's corner, never over the title */
  .ps-dot { position: absolute; top: -8px; right: -6px; z-index: 1; min-width: 16px; height: 16px; padding: 0 4px; box-sizing: border-box; border-radius: 8px; background: #e04a3c; color: #fff; font: 700 10px/16px var(--display); text-align: center; box-shadow: 0 0 10px rgba(224,74,60,.8); animation: psPulse 1.1s ease-in-out infinite alternate; }
  @keyframes psPulse { from { transform: scale(1); } to { transform: scale(1.15); } }
  @media (max-width: 560px) { .pass-strip .ps-pss small { display: none; } }

  #passOv, #profOv { z-index: 24; display: flex; flex-direction: column; align-items: center; }
  #passOv .ps-card, #profOv .ps-card { box-sizing: border-box; width: min(1000px, 100%); margin: auto 0; padding: 14px 16px; display: grid; gap: 10px; background: rgba(10,12,22,.94); backdrop-filter: none; -webkit-backdrop-filter: none; }
  .ps-head { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: 14px; }
  .ps-head .ps-lvb { width: 50px; height: 50px; font-size: 22px; }
  .ps-who { display: grid; gap: 5px; min-width: 0; }
  .ps-who strong { font: 600 18px/1 var(--display); letter-spacing: .08em; text-transform: uppercase; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ps-who strong em { font-style: normal; font-size: 13px; letter-spacing: .06em; margin-left: 8px; color: var(--tc, var(--muted)); }
  .ps-who small { font: 500 11px/1 var(--display); letter-spacing: .1em; color: var(--muted); text-transform: uppercase; }
  .ps-sea { display: grid; justify-items: end; gap: 3px; }
  .ps-sea b { font: 700 16px/1 var(--display); letter-spacing: .12em; text-transform: uppercase; color: #d9c2ff; white-space: nowrap; }
  .ps-sea b::before { content: '影'; font-family: var(--jp); margin-right: 6px; color: #c79bff; }
  .ps-sea small { font: 500 11px/1 var(--display); letter-spacing: .1em; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
  .ps-tabs { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .ps-tabs [role="tab"] { padding: 7px 14px; background: rgba(255,255,255,.04); border: 1px solid var(--line); color: var(--muted); font: 600 13px/1 var(--display); letter-spacing: .12em; text-transform: uppercase; cursor: pointer; }
  .ps-tabs [role="tab"][aria-selected="true"] { color: #17130a; background: var(--gold); border-color: var(--gold); }
  .ps-tabs .ps-sp { flex: 1; }
  .ps-tabs .ps-note { font: 500 11.5px/1.2 var(--display); letter-spacing: .06em; color: var(--muted); }
  .ps-tabs .ps-note.on { color: var(--gold-hi); }
  .ps-tabs .btn { padding: 7px 12px; font-size: 13px; }
  .ps-wrap { display: grid; grid-template-columns: 74px minmax(0, 1fr); gap: 6px; }
  .ps-lab { display: grid; grid-template-rows: 30px 28px 1fr; gap: 6px; }
  .ps-lab span { display: grid; align-content: center; justify-items: center; gap: 3px; padding: 4px; text-align: center; border: 1px solid rgba(217,179,108,.3); background: rgba(217,179,108,.06); font: 700 12px/1.1 var(--display); letter-spacing: .1em; text-transform: uppercase; color: var(--gold); }
  .ps-lab span:first-child, .ps-lab span:empty { border: 0; background: none; }
  .ps-lab .ps-lb { border-color: rgba(190,160,255,.45); background: rgba(120,90,200,.12); color: #d9c2ff; }
  .ps-lab span small { font: 500 9.5px/1.2 var(--body); letter-spacing: 0; text-transform: none; color: var(--muted); }
  .ps-lab b { font: 700 18px/1 var(--jp); }
  .ps-track { overflow-x: auto; overflow-y: hidden; touch-action: pan-x pan-y; overscroll-behavior-x: contain; scroll-behavior: smooth; padding-bottom: 2px; }
  .ps-track.drag { cursor: grabbing; scroll-behavior: auto; user-select: none; }
  .ps-trk { position: relative; min-width: 0; }
  .ps-arr { display: none; }
  @media (hover: hover) and (pointer: fine) {
    .ps-track { cursor: grab; }
    .ps-arr { display: grid; place-items: center; position: absolute; top: 50%; transform: translateY(-50%); z-index: 3; width: 34px; height: 56px; padding: 0; border: 1px solid rgba(190,160,255,.45); background: rgba(16,12,28,.86); color: #e8dcff; font: 700 28px/1 var(--display); cursor: pointer; transition: opacity .15s, background .15s; }
    .ps-arr:hover { background: rgba(70,50,120,.95); }
    .ps-arr.l { left: 2px; } .ps-arr.r { right: 2px; }
    .ps-trk.at-l .ps-arr.l, .ps-trk.at-r .ps-arr.r { opacity: 0; pointer-events: none; }
  }
  .ps-grid { position: relative; display: grid; grid-auto-flow: column; grid-template-rows: 30px 28px auto; grid-auto-columns: 96px; gap: 6px; width: max-content; }
  .ps-prog { position: relative; align-self: center; height: 4px; background: rgba(255,255,255,.08); }
  .ps-tn.soon { opacity: .45; border-style: dashed; }
  .ps-rw.soon { opacity: .5; border-style: dashed; border-color: rgba(190,160,255,.25); background: rgba(120,90,200,.04); min-height: 0; }
  .ps-q { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; border: 1px dashed rgba(199,155,255,.5); color: #c79bff; font: 700 20px/1 var(--display); }
  .ps-soon { position: sticky; left: 0; justify-self: start; max-width: min(100%, 320px); display: grid; align-content: center; gap: 1px; padding: 0 8px; border-left: 2px solid #c79bff; min-width: 0; overflow: hidden; white-space: nowrap; }
  .ps-soon b { font: 700 12px/1.1 var(--display); letter-spacing: .1em; text-transform: uppercase; color: #d9c2ff; overflow: hidden; text-overflow: ellipsis; }
  .ps-soon small { font: 500 10.5px/1.1 var(--body); color: var(--muted); overflow: hidden; text-overflow: ellipsis; }
  .ps-prog i { position: absolute; inset: 0 auto 0 0; width: var(--p, 0%); background: linear-gradient(90deg, #8f6bff, #f1d69c); box-shadow: 0 0 8px rgba(199,155,255,.6); }
  .ps-tn { position: relative; z-index: 1; justify-self: center; display: grid; place-items: center; width: 26px; height: 26px; box-sizing: border-box; border-radius: 50%; border: 1px solid rgba(255,255,255,.2); background: #121420; font: 700 12px/1 var(--display); color: var(--muted); font-variant-numeric: tabular-nums; }
  .ps-tn.on { background: var(--gold); border-color: var(--gold-hi); color: #17130a; }
  .ps-tn.cur { box-shadow: 0 0 0 3px rgba(199,155,255,.45); }
  .ps-rw { position: relative; display: grid; grid-template-rows: auto auto 1fr auto; justify-items: center; gap: 3px; min-height: 118px; box-sizing: border-box; padding: 7px 5px 6px; text-align: center; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.03); }
  .ps-rw.b { border-color: rgba(190,160,255,.2); background: rgba(120,90,200,.07); }
  .ps-rw.empty { background: none; border-style: dashed; border-color: rgba(255,255,255,.06); }
  .ps-rw.got { opacity: .55; }
  .ps-rw.got::after { content: '✓'; position: absolute; top: 3px; right: 6px; color: #7be08f; font: 700 15px/1 var(--display); }
  .ps-rw.rdy { border-color: var(--gold); box-shadow: 0 0 14px -4px var(--gold); }
  .ps-rw.b.rdy { border-color: #c79bff; box-shadow: 0 0 14px -4px #c79bff; }
  .ps-rw.lock .ps-ic { filter: grayscale(.6) brightness(.7); }
  .ps-rw small { font: 500 10.5px/1.15 var(--body); color: var(--text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
  .ps-rw em { font: 500 9px/1 var(--display); font-style: normal; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
  .ps-rw button { width: 100%; padding: 6px 2px; border: 1px solid var(--gold); background: var(--gold); color: #17130a; font: 700 11px/1 var(--display); letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
  .ps-rw.b button { background: #b38cff; border-color: #d9c2ff; }
  .ps-rw button.ad::before { content: '▶ '; }
  .ps-rw .ps-st { font: 500 10px/1.1 var(--display); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
  /* every icon stays inside its 46 × 46 box (no part sticks out over the label); smaller screens zoom the box */
  .ps-ic { display: grid; place-items: center; width: 46px; height: 46px; flex: none; }
  .ps-svg { width: 46px; height: 46px; }
  .ps-bdg { display: grid; place-items: center; width: 38px; height: 38px; box-sizing: border-box; border-radius: 50%; border: 2px solid var(--bc); background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.12), rgba(0,0,0,.4)); color: var(--bc); font: 700 20px/1 var(--jp); box-shadow: 0 0 10px -3px var(--bc); }
  .ps-frm { display: grid; place-items: center; width: 40px; height: 32px; box-sizing: border-box; border: 3px double var(--fc); background: rgba(0,0,0,.35); color: var(--fc); font: 700 16px/1 var(--jp); box-shadow: 0 0 10px -3px var(--fc); }
  .ps-ttl { display: grid; place-items: center; min-width: 38px; height: 30px; padding: 0 4px; box-sizing: border-box; white-space: nowrap; border-top: 2px solid var(--tc); border-bottom: 2px solid var(--tc); background: rgba(0,0,0,.3); color: var(--tc); font: 700 15px/1 var(--jp); }
  .ps-bst { position: relative; display: grid; place-items: center; width: 36px; height: 30px; box-sizing: border-box; border: 1px solid #c79bff; background: linear-gradient(180deg, rgba(199,155,255,.25), rgba(0,0,0,.3)); color: #e9dcff; font: 700 14px/1 var(--display); }
  .ps-bst small { position: absolute; top: -7px; left: 3px; padding: 0 2px; background: #17130a; font-size: 8.5px; color: #c79bff; }
  .ps-bst i { position: absolute; right: -5px; bottom: -7px; width: 15px; height: 15px; line-height: 15px !important; border-radius: 50%; background: #c79bff; color: #17130a; font: 700 10px/16px var(--display); font-style: normal; }
  .ps-hon { display: grid; place-items: center; gap: 2px; color: var(--gold); font: 700 22px/1 var(--jp); }
  .ps-hon small { font: 700 11px/1 var(--display); color: var(--gold-hi); }
  .ps-prof { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px 16px; max-height: min(60vh, 520px); overflow-y: auto; }
  .ps-prof section { display: grid; gap: 6px; align-content: start; }
  .ps-prof h3 { margin: 0; font: 600 13px/1 var(--display); letter-spacing: .14em; text-transform: uppercase; color: var(--gold); }
  .ps-chips { display: flex; flex-wrap: wrap; gap: 5px; }
  .ps-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px 4px 5px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.035); color: var(--text); font: 500 12px/1.2 var(--body); cursor: pointer; }
  .ps-chip[aria-pressed="true"] { border-color: var(--gold); background: rgba(217,179,108,.16); }
  .ps-chip .ps-ic, .ps-chip .ps-svg, .ps-chip .ps-pic { width: 24px; height: 24px; }
  .ps-chip .ps-bdg { width: 22px; height: 22px; font-size: 12px; border-width: 1px; }
  .ps-chip .ps-frm { width: 24px; height: 20px; font-size: 10px; border-width: 2px; }
  .ps-chip .ps-ttl { min-width: 24px; height: 20px; padding: 0 2px; font-size: 9.5px; }
  #journeyLook .ps-look::before { content: '影'; font-family: var(--jp); margin-right: 5px; color: #c79bff; }
  #journeyLook .ps-look.ps-lj::before { content: '道'; color: #ff8a6a; }
  .ps-chip.none { color: var(--muted); }
  .ps-prof p { margin: 0; font-size: 12.5px; color: var(--muted); }
  .ps-seals { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 5px; }
  .ps-seals span { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border: 1px solid rgba(255,255,255,.08); font: 600 12px/1 var(--display); letter-spacing: .06em; color: var(--muted); }
  .ps-seals span.on { color: var(--text); }
  .ps-seals .k { font: 700 16px/1 var(--jp); }
  .ps-seal { display: inline-grid; place-items: center; width: 17px; height: 17px; box-sizing: border-box; border-radius: 3px; font: 700 10.5px/1 var(--jp); font-style: normal; vertical-align: middle; }
  .ps-seal.s0 { border: 1px dashed rgba(255,255,255,.2); color: transparent; }
  .ps-seal.s1 { background: var(--gold); color: #17130a; }
  .ps-seal.s2 { background: linear-gradient(135deg, #f4f6fa, #aab0bf); color: #1b1d24; box-shadow: 0 0 6px rgba(220,225,240,.5); }
  .ps-seal.s3 { background: #c8322a; color: #fff3e2; box-shadow: 0 0 8px rgba(230,70,50,.75); outline: 1px solid #ff8a6a; outline-offset: 1px; }
  .roster .rdyb.ps-seal { top: -8px; padding: 0; width: 18px; height: 18px; font-size: 12px; }
  .vs-side .ps-seal, #vs .ps-seal { margin-left: 8px; width: 22px; height: 22px; font-size: 13px; }
  .ps-jl { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  .ps-plate { display: inline-flex; align-items: center; gap: 5px; }
  .ps-plate b { padding: 0 4px; border: 1px solid var(--fc, var(--gold)); color: var(--gold-hi); font: 700 11px/1.4 var(--display); letter-spacing: .08em; }
  .ps-plate i { font: 700 13px/1 var(--jp); font-style: normal; }
  .ps-plate em { font-style: normal; }
  .xpb { margin: -6px 0 12px; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 4px 10px; text-align: left; padding: 6px 10px; border: 1px solid rgba(190,160,255,.4); background: rgba(120,90,200,.09); }
  .xpb .ps-lvb { grid-row: span 2; width: 36px; height: 36px; font-size: 16px; }
  .xpb .ps-xbar { height: 8px; }
  .xpb strong { font: 700 18px/1 var(--display); color: #e9dcff; font-variant-numeric: tabular-nums; }
  .xpb .xr { grid-column: 2 / -1; display: flex; flex-wrap: wrap; gap: 3px 10px; font: 500 10.5px/1.2 var(--display); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
  .xpb .xr b { color: #d9c2ff; font-weight: 600; }
  .xpb.up { animation: xpUp .8s ease-out; }
  @keyframes xpUp { 0% { box-shadow: 0 0 18px 2px rgba(241,214,156,.75); border-color: #f1d69c; } 100% { box-shadow: 0 0 22px 4px rgba(241,214,156,0); } }
  .ed-stats + .xpb, #edXp { margin: 10px 0 0; }
  /* the end screen's pass card (passCard): the next reward, the bar to it, one claim button when it is ready */
  .pcard { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 6px 10px; text-align: left; padding: 6px 10px; border: 1px solid rgba(241,214,156,.35); background: rgba(241,214,156,.06); }
  .pcard .ps-ic { width: 40px; height: 40px; display: grid; place-items: center; }
  .pcard .ps-ic svg, .pcard .ps-ic img { max-width: 40px; max-height: 40px; }
  .pcard .pc-t { display: grid; gap: 3px; min-width: 0; }
  .pcard small { font: 500 10.5px/1.2 var(--display); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
  .pcard small b { color: var(--gold); font-family: var(--jp); }
  .pcard strong { font: 600 14px/1.15 var(--display); color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pcard .ps-xbar { height: 6px; }
  .pcard .pc-go { grid-column: 1 / -1; min-width: 0; padding: 8px 14px; }
  .pcard .pc-go.free span::before { content: '✓'; }
  .pcard.rdy { border-color: #f1d69c; box-shadow: 0 0 18px -6px rgba(241,214,156,.8); }
  .pcard.rdy .pc-go { animation: pcGo 1.1s ease-in-out infinite alternate; }
  @keyframes pcGo { from { box-shadow: 0 0 0 0 rgba(241,214,156,0); } to { box-shadow: 0 0 0 5px rgba(241,214,156,.25), 0 0 18px rgba(241,214,156,.6); } }
  @media (prefers-reduced-motion: reduce) { .pcard.rdy .pc-go { animation: none; } }

  #lvUp { position: absolute; inset: 0; z-index: 60; display: grid; place-items: center; pointer-events: none; }
  /* (never in the way: the buttons under it keep working; it goes by itself) */
  #lvUp .lu { display: grid; justify-items: center; gap: 8px; padding: 18px 30px 16px; background: radial-gradient(ellipse at center, rgba(20,14,30,.94), rgba(10,8,16,.86)); border: 1px solid #c79bff; box-shadow: 0 20px 60px rgba(0,0,0,.6), 0 0 40px -8px #c79bff; animation: luIn .55s cubic-bezier(.2,1.4,.4,1); }
  #lvUp .lu.out { animation: luOut .35s ease-in forwards; }
  #lvUp small { font: 600 13px/1 var(--display); letter-spacing: .3em; text-transform: uppercase; color: #d9c2ff; }
  #lvUp .lu-n { display: grid; place-items: center; width: 92px; height: 92px; box-sizing: border-box; border: 3px solid var(--gold); background: radial-gradient(circle at 35% 30%, #4a3416, #120c05 70%); color: var(--gold-hi); font: 700 46px/1 var(--display); box-shadow: 0 0 30px -4px var(--gold); transform: rotate(-4deg); }
  #lvUp em { font: 500 12px/1.3 var(--body); font-style: normal; color: var(--muted); }
  @keyframes luIn { from { opacity: 0; transform: scale(1.6); } to { opacity: 1; transform: scale(1); } }
  @keyframes luOut { to { opacity: 0; transform: scale(.9); } }
  @media (max-width: 640px) {
    .ps-head { grid-template-columns: auto minmax(0, 1fr) auto; gap: 8px 10px; }
    .ps-sea { grid-column: 1 / -1; grid-row: 2; justify-items: start; }
    .ps-wrap { grid-template-columns: 56px minmax(0, 1fr); }
    .ps-lab span small { display: none; }
  }
  @media (max-height: 400px) {
    #passOv .ps-head .ps-xbar { height: 4px; }
    #passOv .ps-rw { gap: 2px; }
    #passOv .ps-rw .ps-ic { zoom: .72; }
    #passOv .ps-rw em { display: none; }
    #passOv .ps-rw { grid-template-rows: auto 1fr auto; min-height: 86px; }
    #passOv .ps-rw button { padding: 5px 2px; }
    #passOv .ps-lab { grid-template-rows: 26px 24px 1fr; }
    #passOv .ps-grid { grid-template-rows: 26px 24px auto; }
    #passOv .ps-tn { width: 22px; height: 22px; }
  }
  @media (max-height: 520px) {
    #passOv.overlay, #profOv.overlay { padding-block: 6px; }
    #passOv .ps-card, #profOv .ps-card { padding: 8px 12px; gap: 6px; }
    .ps-head .ps-lvb { width: 40px; height: 40px; font-size: 18px; }
    .ps-who strong { font-size: 15px; }
    .ps-tabs [role="tab"], .ps-tabs .btn { padding: 6px 10px; font-size: 12px; }
    .ps-rw { min-height: 104px; padding: 5px 4px; }
    .ps-rw .ps-ic { zoom: .82; }
    .ps-grid { grid-auto-columns: 88px; gap: 5px; }
    .ps-prof { max-height: calc(100vh - 150px); }
    .xpb { margin: -4px 0 8px; padding: 4px 8px; }
    .xpb .ps-lvb { width: 30px; height: 30px; font-size: 14px; }
  }
  
  .ps-lvb.tap { cursor: pointer; }
  .ps-lvtop { display: grid; place-items: center; padding: 0; margin-right: 2px; background: none; border: 0; cursor: pointer; }
  .ps-lvtop[hidden] { display: none; }
  .ps-lvtop .ps-lvb { width: 36px; height: 36px; font-size: 16px; }
  #app.touch .ps-lvtop .ps-lvb { width: 40px; height: 40px; }
  .btn.ps-go { display: inline-flex; align-items: center; gap: 7px; padding: 7px 12px; font-size: 13px; border-color: rgba(190,160,255,.55); }
  .btn.ps-go b { font: 700 15px/1 var(--jp); color: #c79bff; }
  .ps-rw.top { border-color: #f1d69c; background: linear-gradient(180deg, rgba(241,214,156,.14), rgba(120,90,200,.08)); }
  .ps-pic { width: 46px; height: 46px; object-fit: contain; border-radius: 4px; }
  .ps-fk { display: grid; place-items: center; width: 38px; height: 38px; box-sizing: border-box; border-radius: 50%; border: 2px solid var(--tc); color: var(--tc); font: 700 19px/1 var(--jp); background: rgba(0,0,0,.3); }
  .ps-key { position: relative; display: grid; place-items: center; width: 36px; height: 36px; box-sizing: border-box; border: 2px solid #f1d69c; border-radius: 8px; background: radial-gradient(circle at 35% 30%, rgba(241,214,156,.28), rgba(0,0,0,.4)); color: #f1d69c; font: 700 18px/1 var(--jp); }
  .ps-key.a { border-color: #9fe0c0; color: #9fe0c0; background: radial-gradient(circle at 35% 30%, rgba(159,224,192,.25), rgba(0,0,0,.4)); }
  .ps-key i { position: absolute; right: -7px; bottom: -7px; padding: 1px 2px; background: #17130a; font: 700 11px/1 var(--jp); font-style: normal; color: inherit; }
  .ps-tkt { position: relative; display: grid; place-items: center; width: 40px; height: 30px; box-sizing: border-box; border: 2px dashed #c79bff; background: rgba(120,90,200,.18); color: #e2d2ff; font: 700 17px/1 var(--jp); }
  .ps-tkt small { position: absolute; right: -8px; bottom: -8px; padding: 2px 3px; border-radius: 6px; background: #c79bff; color: #17130a; font: 700 10px/1 var(--display); }
  .ps-shd { display: grid; place-items: center; width: 34px; height: 40px; clip-path: polygon(50% 0, 100% 14%, 93% 68%, 50% 100%, 7% 68%, 0 14%); background: linear-gradient(180deg, #cfe8ff, #4d84c2 70%, #2c5a8f); color: #0b1828; font: 700 18px/1 var(--jp); }
  .chip.av b { font-family: var(--jp); color: #c79bff; margin-right: 4px; }
  .chip.av[aria-pressed="true"] { border-color: #c79bff; background: rgba(199,155,255,.2); }
  /* the Profile: the wardrobe */
  .pf-body { grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); }
  .pf-body .pf-wide { grid-column: 1 / -1; }
  .pf-title h3 small, .ps-prof h3 small { margin-left: 8px; font: 500 11px/1 var(--body); letter-spacing: 0; text-transform: none; color: var(--muted); }
  .ps-chip.big { padding: 6px 12px 6px 6px; font: 600 13.5px/1.2 var(--display); letter-spacing: .04em; color: var(--tc, var(--text)); }
  .ps-chip.big .ps-ic { width: 30px; height: 30px; }
  .ps-chip[aria-pressed="true"]::after { content: '✓'; margin-left: 2px; color: #7be08f; font: 700 13px/1 var(--display); }
  .ps-chip.none[aria-pressed="true"]::after { content: none; }
  .pf-flair { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 8px 16px; }
  .pf-flair > h3 { grid-column: 1 / -1; }
  .pf-slot { display: grid; gap: 4px; align-content: start; }
  .pf-slot h4 { margin: 0; font: 600 11.5px/1.1 var(--display); letter-spacing: .12em; text-transform: uppercase; color: #d9c2ff; }
  .pf-tiles { display: flex; flex-wrap: wrap; gap: 6px; }
  .pf-tile { display: grid; justify-items: center; align-content: start; gap: 3px; width: 80px; box-sizing: border-box; padding: 4px 3px 5px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.035); color: var(--text); cursor: pointer; }
  .pf-tile[aria-pressed="true"] { border-color: var(--gold); background: rgba(217,179,108,.16); box-shadow: 0 0 10px -4px var(--gold); }
  .pf-tile .pf-pic { display: grid; place-items: center; width: 64px; height: 64px; }
  .pf-tile .ps-pic { width: 64px; height: 64px; }
  .pf-tile small { max-width: 74px; font: 500 10.5px/1.15 var(--body); text-align: center; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
  .pf-none { font: 700 22px/1 var(--jp); color: var(--muted); }
  .pf-items { display: grid; gap: 8px; }
  .pf-items > span { display: flex; align-items: center; gap: 12px; }
  .pf-items strong { display: block; font: 600 13px/1.2 var(--display); letter-spacing: .06em; }
  .pf-items small { font: 500 11.5px/1.3 var(--body); color: var(--muted); }
  @media (max-width: 640px) {
    .pf-body { grid-template-columns: minmax(0, 1fr); }
    .pass-strip .ps-half.ps { padding-inline: 8px; }
    #profOv .ps-head { grid-template-columns: auto minmax(0, 1fr) auto; }
    #profOv .ps-head #profPass { grid-column: 1 / 3; grid-row: 2; justify-self: start; }
  }
  @media (max-height: 520px) {
    .pf-tile { width: 70px; } .pf-tile .pf-pic, .pf-tile .ps-pic { width: 52px; height: 52px; }
  }
  /* 1.4: new things. The count on PROFILE (the pass's ready-count badge), on the level square of the top row and on
     the Pass screen's Profile button; a count per Profile section; a NEW tag on each new thing (dimmed once seen) */
  .ps-lvtop, .btn.ps-go { position: relative; }
  .ps-half.pf .pf-nd { top: -8px; right: -6px; }
  .ps-lvtop .pf-nd { top: -7px; right: -9px; }
  .btn.ps-go .pf-nd { top: -9px; right: -9px; }
  .pf-dot { display: inline-block; min-width: 16px; height: 16px; margin: -3px 0 -3px 8px; padding: 0 4px; box-sizing: border-box; border-radius: 8px; background: #e04a3c; color: #fff; font: 700 10px/16px var(--display); letter-spacing: 0; text-align: center; vertical-align: 1px; box-shadow: 0 0 8px rgba(224,74,60,.7); }
  .pf-dot[hidden] { display: none; }
  .pf-new { display: inline-block; flex: none; margin-left: 2px; padding: 0 4px; border-radius: 3px; background: #e04a3c; color: #fff; font: 700 9px/14px var(--display); letter-spacing: .08em; white-space: nowrap; box-shadow: 0 0 8px rgba(224,74,60,.55); transition: background .4s, color .4s, box-shadow .4s; }
  .pf-new.seen { background: rgba(255,255,255,.14); color: var(--muted); box-shadow: none; }
  .pf-tile, .ps-chip { position: relative; }
  .pf-tile .pf-new { position: absolute; top: 2px; right: 2px; margin: 0; }
  /* (on a chip's corner: it takes no width, the chips wrap the same with or without it) */
  .ps-chip .pf-new { position: absolute; z-index: 1; top: -7px; right: -5px; margin: 0; font-size: 8.5px; line-height: 13px; }
  .pf-items strong .pf-new { margin-left: 8px; vertical-align: 1px; }
  .pf-un .ps-chip { cursor: default; }
  .pf-un .ps-chip .k { font: 700 15px/1 var(--jp); }
  .pf-un .ps-chip.ar .k { color: var(--gold); }
  @media (prefers-reduced-motion: reduce) { .pf-nd { animation: none; } }
`;
	function injectCss() {
		if ($("passCss")) return;
		const st = document.createElement("style");
		st.id = "passCss";
		st.textContent = CSS;
		document.head.appendChild(st);
	}
	function lvBadge(lv, small) {
		const st = S(), fr = st.eq.frame && LV.item(st.eq.frame), bd = st.eq.badge && LV.item(st.eq.badge);
		return `<span class="ps-lvb" style="${fr ? "--fc:" + fr.color : ""}"><small>${esc(T().lv)}</small>${lv}${!small && bd ? `<b class="ps-bdg" style="--bc:${bd.color}">${esc(bd.icon)}</b>` : ""}</span>`;
	}
	function titleHtml() {
		const st = S(), id = st.eq.title, it = id && LV.item(id);
		return it ? `<em style="--tc:${it.color}">${esc(itemName(id))}</em>` : "";
	}
	const seal = (n) => `<i class="ps-seal s${Math.min(3, n | 0)}" aria-hidden="true">${[
		"",
		"一",
		"二",
		"三"
	][Math.min(3, n | 0)] || ""}</i>`;
	function placeStrip(el) {
		const hon = $("mhonor"), opts = document.querySelector("#menu .opts");
		let short = (window.innerWidth || 1280) <= 600;
		try {
			short = short || window.matchMedia("(max-height: 540px) and (min-width: 560px)").matches;
		} catch (e) {}
		const top = $("mlvTop");
		if (top) top.hidden = !(short && opts);
		if (short && opts) {
			if (el.parentNode !== opts) opts.appendChild(el);
			el.classList.add("aside");
			return;
		}
		const modes = hon ? hon.parentNode : document.querySelector("#menu .modes");
		if (!modes) return;
		el.classList.remove("aside");
		if (hon) {
			if (hon.nextSibling !== el) modes.insertBefore(el, hon.nextSibling);
		} else if (el.parentNode !== modes) modes.appendChild(el);
	}
	function ensureStrip() {
		let el = $("mstrip");
		if (el) {
			placeStrip(el);
			return el;
		}
		if (!$("mhonor") && !document.querySelector("#menu .modes")) return null;
		el = document.createElement("div");
		el.id = "mstrip";
		el.className = "pass-strip";
		el.innerHTML = "<button type=\"button\" id=\"mprof\" class=\"ps-half pf\"></button><button type=\"button\" id=\"mpass\" class=\"ps-half ps\"></button>";
		el.querySelector("#mprof").onclick = () => {
			if (ND.audio && ND.audio.ui) ND.audio.ui();
			open("profile");
		};
		el.querySelector("#mpass").onclick = () => {
			if (ND.audio && ND.audio.ui) ND.audio.ui();
			open("pass");
		};
		const mt = $("menuTop");
		if (mt && !$("mlvTop")) {
			const b = document.createElement("button");
			b.type = "button";
			b.id = "mlvTop";
			b.className = "ps-lvtop";
			b.hidden = true;
			b.onclick = () => {
				if (ND.audio && ND.audio.ui) ND.audio.ui();
				open("profile");
			};
			mt.insertBefore(b, mt.firstChild);
		}
		placeStrip(el);
		try {
			window.addEventListener("resize", () => placeStrip(el));
		} catch (e) {}
		return el;
	}
	function refreshStrip() {
		safe(() => {
			const el = ensureStrip();
			if (!el) return;
			const st = S(), L = LV.levelOf(st.xp), t = T(), se = season(), p = sp(st, se), R = tierOf(se, p), rd = readyCount();
			const ti = st.eq.title && LV.item(st.eq.title);
			const pf = $("mprof"), ps = $("mpass");
			pf.innerHTML = lvBadge(L.lv) + `<span class="ps-mid"><small><b>${esc(t.profile)}</b>${ti ? ` · <em style="--tc:${ti.color}">${esc(itemName(st.eq.title))}</em>` : ""}</small>` + `<i class="ps-xbar" style="--p:${(L.pct * 100).toFixed(1)}%"></i><span>${esc(L.lv >= LV.MAX ? t.xpMax(num(st.xp)) : t.xp(num(L.into), num(L.need)))}${st.bo ? " · " + esc(t.boostLeft(st.bo)) : ""}</span></span>`;
			const nn = newCount(), nd = nn ? `<i class="ps-dot pf-nd">${nn}</i>` : "";
			pf.insertAdjacentHTML("beforeend", nd);
			pf.setAttribute("aria-label", t.profile + " · " + t.level(L.lv) + (ti ? " · " + itemName(st.eq.title) : "") + (nn ? " · " + t.newN(nn) : ""));
			ps.innerHTML = `<span class="ps-pss"><b>${esc(t.name)}</b><small>${esc(t.tier(R.tier, R.max))} · ${esc(daysLeft(se) <= 1 ? t.lastDay : t.left(daysLeft(se)))}</small>${rd ? `<i class="ps-dot">${rd}</i>` : ""}</span>`;
			ps.setAttribute("aria-label", t.name + " · " + t.tier(R.tier, R.max) + (rd ? " · " + t.ready(rd) : ""));
			const top = $("mlvTop");
			if (top) {
				top.innerHTML = lvBadge(L.lv, true) + nd;
				top.setAttribute("aria-label", t.profile + " · " + t.level(L.lv) + (nn ? " · " + t.newN(nn) : ""));
				top.title = t.profile;
			}
			const pp = $("passProf");
			if (pp) {
				const d = pp.querySelector(".pf-nd");
				if (d) d.remove();
				if (nn) pp.insertAdjacentHTML("beforeend", nd);
			}
		});
	}
	let tab = "pass", ov = null, pov = null, backTo = null;
	function makeOv(id, inner) {
		const o = document.createElement("div");
		o.id = id;
		o.className = "overlay";
		o.hidden = true;
		o.setAttribute("role", "dialog");
		o.setAttribute("aria-modal", "true");
		o.innerHTML = `<div class="card ps-card" id="${inner}"></div>`;
		($("app") || document.body).appendChild(o);
		o.addEventListener("keydown", (e) => {
			if (e.code === "Escape" || e.code === "Backspace" || ND.input && ND.input.isBack && ND.input.isBack(e)) {
				e.preventDefault();
				e.stopPropagation();
				close();
			}
		});
		return o;
	}
	function ensureOv() {
		if (!ov) ov = makeOv("passOv", "passIn");
		if (!pov) {
			pov = makeOv("profOv", "profIn");
			pov.classList.add("pf-ov");
			pov.addEventListener("click", (e) => {
				const el = e.target && e.target.closest ? e.target.closest("[data-new]") : null;
				if (el && isNew(el.dataset.new)) markSeen(el.dataset.new);
			});
		}
		return ov;
	}
	const cur = () => tab === "profile" ? pov : ov;
	let offerCounted = false;
	function open(which) {
		safe(() => {
			injectCss();
			ensureOv();
			const was = P.isOpen;
			if (was) {
				ov.hidden = true;
				pov.hidden = true;
				stopWatch();
				nwShown.clear();
			}
			tab = which === "profile" ? "profile" : "pass";
			offerCounted = false;
			if (tab === "profile") safe(() => ND.alive && ND.alive.quiet && ND.alive.quiet());
			if (!was) backTo = $("menu") && !$("menu").hidden ? "menu" : null;
			if (backTo) $("menu").hidden = true;
			cur().hidden = false;
			render(true);
			setTimeout(() => {
				const o = cur();
				const f = tab === "pass" ? o.querySelector(".ps-rw button") || $("passClose") : o.querySelector(".pf-title [aria-pressed=\"true\"]") || o.querySelector(".pf-title [aria-pressed]") || $("profClose");
				if (f) f.focus({ preventScroll: true });
			}, 0);
		});
	}
	function close() {
		if (!P.isOpen) return;
		const was = tab;
		ov.hidden = true;
		pov.hidden = true;
		stopWatch();
		nwShown.clear();
		if (backTo === "menu" && ND.game && ND.game.mode === "attract") {
			$("menu").hidden = false;
			setTimeout(() => {
				const m = $(was === "profile" ? "mprof" : "mpass");
				if (m) m.focus();
			}, 0);
		}
		refreshStrip();
	}
	function rewardCard(se, p, t, ok) {
		const Tt = se.C.tiers[t - 1], id = Tt && Tt.r, tx = T();
		if (!id) return `<div class="ps-rw b empty" aria-hidden="true"></div>`;
		const it = LV.item(id), reached = tierOf(se, p).tier >= t, got = p.f.includes(t);
		let act = "", cls = "";
		if (got) {
			cls = "got";
			act = `<span class="ps-st">${esc(tx.owned)}</span>`;
		} else {
			const w = LV.claimWay(se.C, p, t, ok);
			if (w === "ad") {
				cls = "rdy";
				act = `<button type="button" class="ad" data-claim="${t}">${esc(tx.watch)}</button>`;
			} else if (w === "wait") {
				cls = "rdy";
				act = `<button type="button" data-claim="${t}">${esc(tx.claim)}</button>`;
			} else {
				cls = "lock";
				act = `<span class="ps-st">🔒 ${esc(tx.opensAt(ok ? t : LV.waitTier(se.C, t)))}</span>`;
			}
		}
		void reached;
		if (!got && it.kind === "rw" && !rwOk() && cls === "rdy") {
			cls = "lock";
			act = `<span class="ps-st">🔒 ${esc(tx.online)}</span>`;
		}
		const kind = it.kind === "rw" ? (rwEntry(it) || {}).kind === "costume" ? "cos" : (rwEntry(it) || {}).kind || "title" : it.kind;
		const kn = kindName(kind);
		return `<div class="ps-rw b ${cls}${it.drawn ? " top" : ""}" data-item="${esc(id)}" title="${esc(kn)}: ${esc(itemName(id))}"><span class="ps-ic">${icon(id)}</span><em>${esc(kn)}</em><small>${esc(itemName(id, true))}</small>${act}</div>`;
	}
	function kindName(kind) {
		const t = T();
		return (t.kinds || {})[kind] || (t.kinds2 || {})[kind] || "";
	}
	function head(L, st, t, extra) {
		const ti = st.eq.title && LV.item(st.eq.title);
		return `<div class="ps-head">${lvBadge(L.lv)}<div class="ps-who"><strong>${esc(t.level(L.lv))}${ti ? ` <em style="--tc:${ti.color}">${esc(itemName(st.eq.title))}</em>` : ""}</strong>` + `<i class="ps-xbar" style="--p:${(L.pct * 100).toFixed(1)}%"></i><small>${esc(L.lv >= LV.MAX ? t.xpMax(num(st.xp)) : t.xp(num(L.into), num(L.need)))}${st.bo ? " · " + esc(t.boostLeft(st.bo)) : ""}</small></div>` + extra + "</div>";
	}
	function render(scroll) {
		if (!ov || !P.isOpen) return;
		if (tab === "profile") {
			renderProfile(scroll);
			return;
		}
		const st = S(), t = T(), se = season(), p = sp(st, se), R = tierOf(se, p), L = LV.levelOf(st.xp), ok = adsOk(), N = se.C.tiers.length;
		const left = daysLeft(se), waitN = ok ? 0 : (() => {
			let n = 0;
			for (let k = 1; k <= N; k++) if (LV.claimWay(se.C, p, k, false) === "wait") n++;
			return n;
		})();
		const keep = {
			ov: ov.scrollTop,
			track: ($("psTrack") || {}).scrollLeft || 0
		};
		const daily = st.d.w === LV.dayOf(P.now(), tz());
		const cols = [], M = Math.max(N, se.C.soon | 0);
		for (let k = 1; k <= N; k++) {
			cols.push(`<span class="ps-tn ${R.tier >= k ? "on" : ""} ${R.tier + 1 === k ? "cur" : ""}" style="grid-column:${k};grid-row:2">${k}</span>`);
			cols.push(rewardCard(se, p, k, ok).replace("<div ", `<div style="grid-column:${k};grid-row:3" `));
		}
		if (M > N) {
			cols.push(`<span class="ps-soon" style="grid-column:${N + 1}/${M + 1};grid-row:1"><b>${esc(t.soon)}</b><small>${esc(t.soonXp)}</small></span>`);
			for (let k = N + 1; k <= M; k++) {
				cols.push(`<span class="ps-tn soon" style="grid-column:${k};grid-row:2">${k}</span>`);
				cols.push(`<div class="ps-rw soon" style="grid-column:${k};grid-row:3" aria-hidden="true"><span class="ps-ic"><b class="ps-q">?</b></span><span class="ps-st">🔒</span></div>`);
			}
		}
		const prog = (R.tier + (R.tier < N ? R.pct : 0)) / N * 100;
		const body = `<div class="ps-wrap"><div class="ps-lab"><span></span><span></span><span class="ps-lb"><b>影</b>${esc(t.bonus)}<small>${esc(ok ? t.bonusAds : t.bonusWait(se.C.waitTiers))}</small></span></div>` + `<div class="ps-trk"><div class="ps-track" id="psTrack"><div class="ps-grid" style="grid-template-columns:repeat(${M},var(--cw,96px))"><span class="ps-prog" style="grid-column:1/${N + 1};grid-row:2"><i style="--p:${prog.toFixed(2)}%"></i></span>${cols.join("")}</div></div></div></div>`;
		$("passIn").innerHTML = head(L, st, t, `<div class="ps-sea"><b>${esc(t.name)}</b><small>${esc(t.season(se.n))} · ${esc(left <= 1 ? t.lastDay : t.left(left))}</small><small>${esc(t.tier(R.tier, N))}${R.tier < N ? " · " + esc(t.xp(num(R.into), num(R.need))) : ""}</small></div>` + `<button class="btn" type="button" id="passClose">${esc(t.close)}</button>`) + `<div class="ps-tabs"><button class="btn ps-go" type="button" id="passProf"><b>人</b>${esc(t.profile)}${(() => {
			const nn = newCount();
			return nn ? `<i class="ps-dot pf-nd">${nn}</i>` : "";
		})()}</button>` + `<span class="ps-sp"></span><span class="ps-note ${daily ? "" : "on"}">${esc(daily ? t.dailyDone : t.daily)}</span>` + (waitN > 1 ? `<button class="btn primary" type="button" id="passAll">${esc(t.claimAll(waitN))}</button>` : "") + "</div>" + body;
		$("passClose").onclick = () => close();
		$("passProf").onclick = () => {
			if (ND.audio && ND.audio.ui) ND.audio.ui();
			open("profile");
		};
		const hb = ov.querySelector(".ps-head .ps-lvb");
		if (hb) {
			hb.classList.add("tap");
			hb.onclick = () => open("profile");
		}
		if (!offerCounted && ov.querySelector("button.ad") && ND.ads && typeof ND.ads.showOffer === "function") {
			offerCounted = true;
			safe(() => {
				const x = document.createElement("i");
				x.hidden = true;
				ND.ads.showOffer(x);
			});
		}
		const all = $("passAll");
		if (all) all.onclick = () => {
			claimAllWaiting();
			render(false);
		};
		ov.querySelectorAll("[data-claim]").forEach((b) => b.onclick = () => {
			b.disabled = true;
			claim(+b.dataset.claim).then(() => render(false), () => render(false));
		});
		const tr = $("psTrack");
		if (tr) dragScroll(tr);
		if (!scroll) {
			ov.scrollTop = keep.ov;
			if (tr) {
				tr.style.scrollBehavior = "auto";
				tr.scrollLeft = keep.track;
				tr.style.scrollBehavior = "";
			}
		}
		if (tr && scroll) {
			let k = 1;
			while (k <= N && !LV.claimWay(se.C, p, k, ok)) k++;
			if (k > N) k = Math.min(N, R.tier + 1);
			tr.style.scrollBehavior = "auto";
			tr.scrollLeft = Math.max(0, (k - 2) * (tr.scrollWidth / M));
			tr.style.scrollBehavior = "";
		}
	}
	function dragScroll(tr) {
		const step = (d) => tr.scrollBy({
			left: d * Math.max(120, tr.clientWidth * .7),
			behavior: "smooth"
		});
		let x0 = 0, s0 = 0, id = null, moved = false;
		tr.addEventListener("pointerdown", (e) => {
			if (e.pointerType !== "mouse" || e.button !== 0) return;
			id = e.pointerId;
			x0 = e.clientX;
			s0 = tr.scrollLeft;
			moved = false;
		});
		tr.addEventListener("pointermove", (e) => {
			if (e.pointerId !== id) return;
			const dx = e.clientX - x0;
			if (!moved && Math.abs(dx) > 5) {
				moved = true;
				tr.classList.add("drag");
				try {
					tr.setPointerCapture(id);
				} catch (err) {}
			}
			if (moved) tr.scrollLeft = s0 - dx;
		});
		const end = (e) => {
			if (e.pointerId !== id) return;
			id = null;
			tr.classList.remove("drag");
		};
		tr.addEventListener("pointerup", end);
		tr.addEventListener("pointercancel", end);
		tr.addEventListener("click", (e) => {
			if (moved) {
				e.preventDefault();
				e.stopPropagation();
				moved = false;
			}
		}, true);
		tr.addEventListener("wheel", (e) => {
			if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || tr.scrollWidth <= tr.clientWidth) return;
			const max = tr.scrollWidth - tr.clientWidth;
			if (e.deltaY < 0 && tr.scrollLeft <= 0 || e.deltaY > 0 && tr.scrollLeft >= max - 1) return;
			e.preventDefault();
			tr.scrollLeft += e.deltaY;
		}, { passive: false });
		const wrap = tr.parentElement;
		if (!wrap || wrap.querySelector(".ps-arr")) return;
		for (const d of [-1, 1]) {
			const b = document.createElement("button");
			b.type = "button";
			b.className = "ps-arr " + (d < 0 ? "l" : "r");
			b.textContent = d < 0 ? "‹" : "›";
			b.setAttribute("aria-label", d < 0 ? "←" : "→");
			b.tabIndex = -1;
			b.onclick = () => step(d);
			wrap.appendChild(b);
		}
		const arr = () => {
			const max = tr.scrollWidth - tr.clientWidth;
			wrap.classList.toggle("at-l", tr.scrollLeft <= 2);
			wrap.classList.toggle("at-r", tr.scrollLeft >= max - 2);
		};
		tr.addEventListener("scroll", arr, { passive: true });
		arr();
	}
	const owned = (st, kind) => st.own.filter((id) => {
		const it = LV.item(id);
		return it && it.kind === kind;
	});
	const tagOf = (id) => isNew(id) || nwShown.has(id) ? `<b class="pf-new${isNew(id) ? "" : " seen"}" data-tag="${esc(id)}">${esc(T().newTag)}</b>` : "";
	const nwAttr = (id) => isNew(id) || nwShown.has(id) ? ` data-new="${esc(id)}"` : "";
	const DOT = "<i class=\"pf-dot\" hidden></i>";
	function tile(kind, id, on, label, picHtml, nid) {
		return `<button type="button" class="pf-tile${on ? " on" : ""}" data-eq="${kind}:${esc(id || "")}" aria-pressed="${on}"${nid ? nwAttr(nid) : ""}>` + `<span class="pf-pic">${picHtml}</span><small>${esc(label)}</small>${nid ? tagOf(nid) : ""}</button>`;
	}
	function renderProfile(scroll) {
		const st = S(), t = T(), L = LV.levelOf(st.xp), H2 = t.heads2 || {}, K2 = t.kinds2 || {};
		const keep = {
			pf: (pov.querySelector(".pf-body") || {}).scrollTop || 0,
			ov: pov.scrollTop
		};
		const sec = [];
		if (ND.charPreview && ND.charStage) sec.push(`<section class="pf-wide pf-char"><h3>${esc(ND.charPreview.head())}</h3><div id="pfCharIn"></div></section>`);
		const titles = owned(st, "title");
		sec.push(`<section class="pf-title pf-wide"><h3>${esc(H2.title || t.heads.titles)}${DOT} <small>${esc(t.tapEquip)}</small></h3><div class="ps-chips">` + (titles.length ? `<button type="button" class="ps-chip none" data-eq="title:" aria-pressed="${!st.eq.title}">—</button>` + titles.map((id) => `<button type="button" class="ps-chip big" data-eq="title:${esc(id)}" aria-pressed="${st.eq.title === id}" style="--tc:${LV.item(id).color}"${nwAttr(id)}><span class="ps-ic">${icon(id)}</span>${esc(itemName(id))}${tagOf(id)}</button>`).join("") : `<p>${esc(t.none)}</p>`) + "</div></section>");
		for (const [k, head] of [
			["badge", t.heads.badges],
			["frame", t.heads.frames],
			["trail", t.heads.trails]
		]) {
			const own = owned(st, k);
			const chips = own.length ? `<button type="button" class="ps-chip none" data-eq="${k}:" aria-pressed="${!st.eq[k]}">—</button>` + own.map((id) => `<button type="button" class="ps-chip" data-eq="${k}:${esc(id)}" aria-pressed="${st.eq[k] === id}"${nwAttr(id)}><span class="ps-ic">${icon(id)}</span>${esc(itemName(id))}${tagOf(id)}</button>`).join("") : `<p>${esc(t.noneYet)}</p>`;
			sec.push(`<section><h3>${esc(head)}${DOT}</h3><div class="ps-chips">${chips}</div></section>`);
		}
		const slots = [
			"pose",
			"hitfx",
			"slash",
			"aura",
			"ko",
			"card"
		].map((k) => {
			const own = owned(st, k);
			const tiles = own.length ? tile(k, null, !st.eq[k], t.usual, "<b class=\"pf-none\">—</b>") + own.map((id) => tile(k, id, st.eq[k] === id, itemName(id), icon(id), id)).join("") : `<p>${esc(t.noneYet)}</p>`;
			return `<div class="pf-slot"><h4>${esc(K2[k] || k)}</h4><div class="pf-tiles">${tiles}</div></div>`;
		}).join("");
		sec.push(`<section class="pf-wide pf-flair"><h3>${esc(H2.flair)}${DOT}</h3>${slots}</section>`);
		const av = owned(st, "arena");
		const arenas = av.length ? av.map((id) => {
			const it = LV.item(id), A = (ND.ARENAS || []).find((a) => a.id === it.base), name = A ? A.name : it.base, open = !ND.save.isArenaUnlocked || ND.save.isArenaUnlocked(it.base);
			return `<div class="pf-slot"><h4>${esc(name)}${open ? "" : " 🔒"}</h4><div class="pf-tiles">${tile("arena", "plain:" + it.base, st.av[it.base] !== id, t.plain, "<b class=\"pf-none\">" + esc(A ? A.kanji : "景") + "</b>")}${tile("arena", id, st.av[it.base] === id, itemName(id), icon(id), id)}</div></div>`;
		}).join("") : `<p>${esc(t.noneYet)}</p>`;
		sec.push(`<section><h3>${esc(H2.arenas)}${DOT}</h3>${arenas}</section>`);
		const mus = owned(st, "music");
		sec.push(`<section><h3>${esc(H2.music)}${DOT}</h3><div class="pf-tiles">${mus.length ? tile("music", null, !st.eq.music, t.usual, "<b class=\"pf-none\">楽</b>") + mus.map((id) => tile("music", id, st.eq.music === id, itemName(id), icon(id), id)).join("") : `<p>${esc(t.noneYet)}</p>`}</div></section>`);
		const cos = owned(st, "cos");
		sec.push(`<section><h3>${esc(t.heads.costumes)}${DOT}</h3><div class="ps-chips">${cos.length ? cos.map((id) => `<span class="ps-chip"${nwAttr(id)}><span class="ps-ic">${icon(id)}</span>${esc(itemName(id))}${tagOf(id)}</span>`).join("") : `<p>${esc(t.none)}</p>`}</div><p>${esc(t.wearHint)}</p></section>`);
		sec.push(`<section><h3>${esc(H2.items)}${DOT}</h3><div class="pf-items"><span${nwAttr("shield")}><b class="ps-shd">盾</b><span><strong>${esc(t.shields(st.sd | 0, LV.SHIELD_MAX))}${tagOf("shield")}</strong><small>${esc(t.shieldHelp)}</small></span></span>` + `<span${nwAttr("ticket_trial")}><b class="ps-tkt">札</b><span><strong>${esc(t.tickets(st.tk | 0))}${tagOf("ticket_trial")}</strong><small>${esc(t.ticketHelp)}</small></span></span></div></section>`);
		const rws = safe(() => ND.rewards ? ND.rewards.owned().map((ref) => ND.rewards.get(ref)).filter(Boolean) : []) || [];
		if (rws.length) sec.push(`<section><h3>${esc(t.headRewards)}${DOT}</h3><div class="ps-chips">${rws.map((e) => {
			const id = "rw:" + e.id;
			return `<span class="ps-chip"${nwAttr(id)}><span class="ps-ic">${icon(id)}</span>${esc(itemName(id))}${tagOf(id)}</span>`;
		}).join("")}</div></section>`);
		const chs = (ND.CHARS || []).filter((c) => chUnlocked(c.id) && (!c.hidden || isNew("ch:" + c.id) || st.jc[c.id]));
		const ars = (ND.ARENAS || []).filter((a) => arUnlocked(a.id));
		sec.push(`<section class="pf-wide pf-un"><h3>${esc(t.headUnlocks)}${DOT}</h3><div class="ps-chips">` + chs.map((c) => `<span class="ps-chip"${nwAttr("ch:" + c.id)}><b class="k" style="color:${c.col.ui}">${esc(c.kanji)}</b>${esc(nice(c.name))}${tagOf("ch:" + c.id)}</span>`).join("") + ars.map((a) => `<span class="ps-chip ar"${nwAttr("ar:" + a.id)}><b class="k">${esc(a.kanji)}</b>${esc(a.name)}${tagOf("ar:" + a.id)}</span>`).join("") + "</div></section>");
		const seals = (ND.CHARS || []).filter((c) => !c.hidden || st.jc[c.id]).map((c) => {
			const n = st.jc[c.id] | 0;
			return `<span class="${n ? "on" : ""}" title="${esc(n ? t.clears(n) : "")}"><b class="k" style="color:${n ? c.col.ui : "inherit"}">${esc(c.kanji)}</b>${esc(nice(c.name))}${n ? seal(n) : seal(0)}</span>`;
		}).join("");
		sec.push(`<section class="pf-wide"><h3>${esc(t.heads.seals)}</h3><div class="ps-seals">${seals}</div><p>${esc(t.total(num(st.xp)))}${st.d.s > 1 ? " · " + esc(t.streak(st.d.s)) : ""}</p></section>`);
		$("profIn").innerHTML = head(L, st, t, `<button class="btn ps-go" type="button" id="profPass"><b>影</b>${esc(t.passTab || t.name)}</button><button class="btn" type="button" id="profClose">${esc(t.close)}</button>`) + `<div class="ps-prof pf-body">${sec.join("")}</div>`;
		if (ND.charPreview && $("pfCharIn")) ND.charPreview.mount($("pfCharIn"));
		$("profClose").onclick = () => close();
		$("profPass").onclick = () => {
			if (ND.audio && ND.audio.ui) ND.audio.ui();
			open("pass");
		};
		pov.querySelectorAll("[data-eq]").forEach((b) => b.onclick = () => {
			const i = b.dataset.eq.indexOf(":"), k = b.dataset.eq.slice(0, i), id = b.dataset.eq.slice(i + 1);
			if (b.dataset.new) markSeen(b.dataset.new);
			equip(k, id || null);
			fx("tick");
			render(false);
		});
		newDots();
		if (!scroll) {
			const pf = pov.querySelector(".pf-body");
			if (pf) pf.scrollTop = keep.pf;
			pov.scrollTop = keep.ov;
		}
		watchNew();
	}
	function newDots() {
		safe(() => {
			if (!pov || pov.hidden) return;
			const nw = S().nw, t = T();
			pov.querySelectorAll(".pf-body > section").forEach((s) => {
				const d = s.querySelector("h3 .pf-dot");
				if (!d) return;
				const n = new Set([...s.querySelectorAll("[data-new]")].map((e) => e.dataset.new).filter((id) => nw.includes(id))).size;
				d.hidden = !n;
				d.textContent = n ? String(n) : "";
				if (n) d.setAttribute("aria-label", t.newN(n));
				else d.removeAttribute("aria-label");
			});
			pov.querySelectorAll(".pf-new[data-tag]").forEach((e) => e.classList.toggle("seen", !nw.includes(e.dataset.tag)));
		});
	}
	let io = null;
	const ioT = new Map();
	function stopWatch() {
		if (io) io.disconnect();
		io = null;
		for (const k of ioT.values()) clearTimeout(k);
		ioT.clear();
	}
	const WIPE_MS = 500;
	let watchAt = 0;
	function watchNew() {
		stopWatch();
		watchAt = Date.now();
		if (typeof IntersectionObserver !== "function" || !pov) return;
		io = new IntersectionObserver((es) => {
			for (const e of es) {
				const el = e.target, id = el.dataset.new;
				if (e.isIntersecting && e.intersectionRatio >= .5) {
					if (!ioT.has(el)) ioT.set(el, setTimeout(() => {
						ioT.delete(el);
						if (P.isOpen && tab === "profile" && el.isConnected && !document.hidden) markSeen(id);
					}, SEEN_MS + Math.max(0, watchAt + WIPE_MS - Date.now())));
				} else if (ioT.has(el)) {
					clearTimeout(ioT.get(el));
					ioT.delete(el);
				}
			}
		}, { threshold: [
			0,
			.5,
			1
		] });
		pov.querySelectorAll("[data-new]").forEach((el) => {
			if (isNew(el.dataset.new)) io.observe(el);
		});
	}
	function xpBlock(id, after, res) {
		let el = $(id);
		if (!res) {
			if (el) el.hidden = true;
			return null;
		}
		if (!el) {
			el = document.createElement("div");
			el.id = id;
			el.className = "xpb";
			el.setAttribute("aria-live", "polite");
			if (after && after.parentNode) after.parentNode.insertBefore(el, after.nextSibling);
			else return null;
		}
		const t = T(), x = res.x, from = res.before, to = res.r.to;
		const rows = x.rows.filter((r) => [
			"daily",
			"streak",
			"boost",
			"short",
			"clear",
			"first"
		].includes(r[0])).map(([k, v, n]) => `<span>${esc((t.rows || {})[k] || k)}${k === "streak" ? " · " + esc(t.streakN(n)) : k === "clear" ? " " + seal(n) : ""} <b>${v < 0 ? "−" + num(-v) : "+" + num(v)}</b></span>`).join("");
		el.hidden = false;
		el.classList.remove("up");
		const why = !x.total && x.short ? `<span>${esc((t.rows || {}).short || "")}</span>` : "";
		el.innerHTML = lvBadge(from.lv, true) + `<i class="ps-xbar" style="--p:${(from.pct * 100).toFixed(1)}%"></i><strong>${esc(t.plus(num(x.total)))}</strong>` + (rows || why ? `<div class="xr">${rows}${why}</div>` : "");
		const bar = el.querySelector(".ps-xbar"), box = el.querySelector(".ps-lvb");
		const steps = [];
		for (let L = from.lv; L < to.lv; L++) steps.push([1, L + 1]);
		steps.push([to.pct, null]);
		let i = 0;
		const next = () => {
			if (i >= steps.length || el.hidden) return;
			const [pct, up] = steps[i++];
			bar.style.setProperty("--d", ".7s");
			bar.style.setProperty("--p", (pct * 100).toFixed(1) + "%");
			setTimeout(() => {
				if (up) {
					bar.style.setProperty("--d", "0s");
					bar.style.setProperty("--p", "0%");
					if (box) box.lastChild.textContent = String(up);
					el.classList.remove("up");
					void el.offsetWidth;
					el.classList.add("up");
					if (i === steps.length - 1) levelUp(to.lv);
					setTimeout(next, 60);
				} else next();
			}, 720);
		};
		setTimeout(next, 650);
		return el;
	}
	function passCard(G, res) {
		let el = $("endPass");
		const hide = () => {
			if (el) el.hidden = true;
			return null;
		};
		if (!res || !G || NO_XP[G.mode] || G.mode === "shadow") return hide();
		const st = S(), se = season(), p = sp(st, se), N = se.C.tiers.length, ok = adsOk(), t = T();
		let k = 1;
		while (k <= N && (p.f.includes(k) || rwBlocked(se, k))) k++;
		if (k > N) return hide();
		const way = LV.claimWay(se.C, p, k, ok), R = tierOf(se, p), fresh = G.mode === "arcade" && !!res.x.rows.some((q) => q[0] === "win") && st.xp < NEW_XP * 2;
		if (!way && !fresh) return hide();
		if (!el) {
			const box = $("end") && $("end").querySelector(".btns");
			if (!box) return null;
			el = document.createElement("div");
			el.id = "endPass";
			el.className = "pcard";
			el.setAttribute("aria-live", "polite");
			box.insertBefore(el, box.firstChild);
		}
		const id = se.C.tiers[k - 1].r;
		const from = k > 1 ? LV.tierXp(se.C, k - 1) : 0, to = LV.tierXp(se.C, k), pct = Math.max(0, Math.min(1, (p.x - from) / Math.max(1, to - from)));
		const line = way ? t.ready(1) : R.tier >= k ? t.opensAt(LV.waitTier(se.C, k)) : t.xp(num(Math.max(0, p.x - from)), num(to - from));
		const btn = way === "ad" ? `<button type="button" class="btn ad pc-go"><span>${esc(t.claim)}</span><small>${esc(t.watch)}</small></button>` : way === "wait" ? `<button type="button" class="btn ad free pc-go"><span>${esc(t.claim)}</span></button>` : "";
		el.hidden = false;
		el.classList.toggle("rdy", !!way);
		el.innerHTML = `<span class="ps-ic">${icon(id)}</span><div class="pc-t"><small><b>${esc(t.k)}</b> ${esc(t.name)} · ${esc(t.tier(k, N))}</small>` + `<strong>${esc(itemName(id))}</strong><i class="ps-xbar" style="--p:${(pct * 100).toFixed(1)}%"></i><small>${esc(line)}</small></div>` + btn;
		const b = el.querySelector(".pc-go");
		if (b) b.onclick = () => {
			if (b.disabled || ND.ads && ND.ads.busy) return;
			b.disabled = true;
			Promise.resolve(claim(k)).then(() => {
				passCard(G, res);
			}, () => {
				passCard(G, res);
			});
		};
		return el;
	}
	function levelUp(lv) {
		const st = S();
		if (lv <= st.seen) return;
		st.seen = lv;
		commit();
		let el = $("lvUp");
		if (!el) {
			el = document.createElement("div");
			el.id = "lvUp";
			($("app") || document.body).appendChild(el);
		}
		const t = T(), se = season(), p = sp(st, se), R = tierOf(se, p);
		el.hidden = false;
		el.innerHTML = `<div class="lu" role="status"><small>${esc(t.up)}</small><b class="lu-n">${lv}</b><em>${esc(t.name)} · ${esc(t.tier(R.tier, R.max))}</em></div>`;
		fx("up");
		const box = el.firstChild;
		const shut = () => {
			if (!box.isConnected || box.classList.contains("out")) return;
			box.classList.add("out");
			setTimeout(() => {
				if (el.firstChild === box) {
					el.hidden = true;
					el.textContent = "";
				}
			}, 360);
		};
		setTimeout(shut, 2600);
		refreshStrip();
	}
	function hookGame(G) {
		injectCss();
		const wrap = (obj, name, after, before) => {
			const f = obj && obj[name];
			if (typeof f !== "function") return;
			obj[name] = function(...args) {
				if (before) safe(() => before.call(this, args));
				const r = f.apply(this, args);
				if (after) safe(() => after.call(this, args, r));
				return r;
			};
		};
		wrap(G, "start", function() {
			matchNo++;
			playSec0 = ND.ads ? ND.ads.playSec : 0;
			setTrail(G.mode);
			setFlair(G, G.mode);
		});
		wrap(G, "matchEnd", function(args) {
			if (G.mode === "online") return;
			if (G.mode === "shadow") {
				const r = fightDone(G, args[0]);
				if (r && r.r.ups.length) setTimeout(() => levelUp(r.r.to.lv), 1500);
				if (r) {
					const s0 = G.stats && G.stats[0] || {};
					P.rankedHonor({
						mode: "shadow",
						won: !!args[0] && args[0] === G.F[0],
						rounds: G.wins ? G.wins[0] : 0,
						parries: s0.parries,
						counters: s0.counters,
						rallies: s0.rallies,
						perfects: s0.perfect
					});
				}
				return;
			}
			const res = fightDone(G, args[0]);
			const after = $("endHonor") || $("endScore");
			if (res && G.phase === "end") xpBlock("endXp", after, res);
			else xpBlock("endXp", after, null);
			passCard(G, res && G.phase === "end" ? res : null);
		});
		const A = ND.arcade;
		wrap(A, "refreshMenu", () => {
			refreshStrip();
			const st = S(), L = LV.levelOf(st.xp).lv;
			if (L > st.seen) setTimeout(() => {
				if (ND.game && ND.game.mode === "attract" && !$("menu").hidden) levelUp(L);
			}, 500);
		});
		wrap(A, "complete", function() {
			const R = this.run;
			if (R && R.done && !this._psWasDone) journeyCleared(ND.CHARS[R.me].id);
		}, function() {
			this._psWasDone = !!(this.run && this.run.done);
		});
		wrap(A, "showEnding", function() {
			const R = this.run;
			if (!R) return;
			const id = ND.CHARS[R.me].id, n = S().jc[id] | 0;
			xpBlock("edXp", $("edStats"), last && Date.now() - last.t < 6e4 ? last : null);
			const mr = $("journeyReward");
			if (mr && n) {
				const t = T(), nx = n === 1 ? t.next2 : n === 2 ? t.next3 : "";
				mr.insertAdjacentHTML("beforeend", `<span class="ps-jl">${seal(n)} ${esc(t.seal[Math.min(3, n)])}${nx ? " · " + esc(nx) : ""}</span>`);
			}
		});
		wrap(A, "refreshSelect", function() {
			selectSeals();
		});
		wrap(G, "refreshSelect", function() {
			arenaVariants(G);
		});
		wrap(G, "showStage", null, function(args) {
			if (args[0] !== "vs" || !ND.flair) return;
			ND.flair.set(0, LV.fightFlair(S().eq));
			ND.flair.set(1, null);
		});
		applyWorn();
		wrap(A, "openVs", function() {
			const R = this.run;
			if (!R) return;
			const n = S().jc[ND.CHARS[R.me].id] | 0, el = $("vsn1");
			if (el && n) el.insertAdjacentHTML("beforeend", " " + seal(n));
		});
		const CT = ND.comboTrial;
		if (CT) wrap(CT, "clear", null, function() {
			const T0 = this.list && this.list[this.i], first = T0 && !this.cleared(T0.id), st = S();
			LV.touchDay(st, P.now(), tz());
			if (first) setTimeout(() => bonus("trial", LV.XP.trial), 0);
			else if ((st.d.t | 0) < LV.XP.trialAgainMax) {
				st.d.t = (st.d.t | 0) + 1;
				setTimeout(() => bonus("trial", LV.XP.trialAgain), 0);
			}
		});
		const sv = ND.save;
		wrap(sv, "tutorialDone", null, function() {
			if (!this.p.tutorial) setTimeout(() => bonus("tutorial", LV.XP.tutorial), 0);
		});
		wrap(sv, "lessonDone", null, function(args) {
			if (!this.p.lessons.includes(args[0])) setTimeout(() => bonus("trial", LV.XP.lesson), 0);
		});
		const I = ND.input;
		if (I && typeof I.onKey === "function") {
			const oKey = I.onKey;
			I.onKey = function(e) {
				if (P.isOpen) {
					if (I.isBack && I.isBack(e) && !e.repeat) {
						close();
						return true;
					}
					return false;
				}
				return oKey.apply(this, arguments);
			};
		}
		if (I && typeof I.onPad === "function") {
			const oPad = I.onPad;
			I.onPad = function(st, prev) {
				if (!P.isOpen) return oPad.apply(this, arguments);
				if (st.kick && !prev.kick) close();
				else if (st.light && !prev.light || st.up && !prev.up) {
					const b = cur().querySelector(".ps-rw button");
					if (b) b.click();
				}
			};
		}
		if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(() => {
			refreshStrip();
			render(false);
		});
		refreshStrip();
	}
	function arenaVariants(G) {
		safe(() => {
			const box = $("arenaChips");
			if (!box) return;
			box.querySelectorAll(".av").forEach((e) => e.remove());
			const base = G.sel && G.sel.arena, st = S();
			if (!base || base === "random") return;
			const t = T();
			for (const id of st.own) {
				const it = LV.item(id);
				if (!it || it.kind !== "arena" || it.base !== base) continue;
				const b = document.createElement("button"), on = st.av[base] === id;
				b.type = "button";
				b.className = "chip av";
				b.dataset.variant = id;
				b.setAttribute("aria-pressed", String(on));
				b.title = (t.variant || "") + ": " + itemName(id);
				b.innerHTML = `<b>影</b>${esc(itemName(id))}`;
				b.onclick = () => {
					equip("arena", on ? "plain:" + base : id);
					if (ND.scene && ND.scene.setTheme) ND.scene.setTheme(base);
					if (ND.audio && ND.audio.ui) ND.audio.ui();
					arenaVariants(G);
				};
				const after = box.querySelector(`[data-arena="${base}"]`);
				if (after && after.nextSibling) box.insertBefore(b, after.nextSibling);
				else box.appendChild(b);
			}
		});
	}
	function selectSeals() {
		const st = S(), t = T();
		for (const n of [1, 2]) {
			const ro = $("ro" + n);
			if (ro) for (const b of ro.children) {
				const c = ND.CHARS[+b.dataset.k], badge = b.querySelector("[data-journey-badge]");
				if (!c || !badge) continue;
				const k = Math.max(1, Math.min(3, st.jc[c.id] | 0));
				badge.className = "rdyb ps-seal s" + k;
				badge.textContent = [
					"",
					"一",
					"二",
					"三"
				][k];
				b.title = t.seal[k] || b.title;
			}
		}
		const panel = $("journeyPanel"), G = ND.game;
		if (panel && !panel.hidden && G && G.sel) {
			const ch = ND.CHARS[G.selShown ? G.selShown(0) : G.sel.c[0]], n = ch ? st.jc[ch.id] | 0 : 0;
			if (ch && n) {
				const nx = n <= 1 ? t.next2 : n === 2 ? t.next3 : "";
				panel.insertAdjacentHTML("beforeend", `<p class="ps-jl">${seal(n)} ${esc(n ? t.clears(n) : "")}${n && nx ? " · " : ""}${esc(n >= 1 ? nx : "")}</p>`);
			}
		}
		const look = $("journeyLook"), sel = G && G.sel && ND.CHARS[G.selShown ? G.selShown(0) : G.sel.c[0]];
		if (look && !look.hidden && sel && !(G.selShown && G.selShown(0) !== G.sel.c[0])) {
			const now = ND.save.look(sel.id);
			for (const id of costumesFor(sel.id)) {
				const v = "ps:" + id, b = document.createElement("button");
				b.type = "button";
				b.className = "look-slot ps-look" + (LV.item(id).journey ? " ps-lj" : "");
				b.textContent = itemName(id);
				b.setAttribute("aria-pressed", String(now === v));
				b.onclick = () => {
					ND.save.setLook(sel.id, v);
					if (G.refreshSelect) G.refreshSelect();
				};
				look.appendChild(b);
			}
		}
	}
	const P = ND.pass = {
		now: () => Date.now(),
		state: S,
		season,
		itemName,
		itemPal,
		icon,
		owns,
		costumesFor,
		wearing,
		get last() {
			return last;
		},
		award,
		onlineEnd,
		onlineResult,
		bonus,
		journeyCleared,
		claim,
		claimAllWaiting,
		readyCount,
		equip,
		newIds,
		newCount,
		markNew,
		markSeen,
		open,
		close,
		get isOpen() {
			return !!ov && !ov.hidden || !!pov && !pov.hidden;
		},
		get screen() {
			return P.isOpen ? tab : null;
		},
		refreshStrip,
		levelUp,
		tickets: () => S().tk | 0,
		useTicket() {
			const st = S();
			if (!(st.tk > 0)) return false;
			st.tk--;
			commit();
			return true;
		},
		shields: () => S().sd | 0,
		matchFlair(side, o) {
			safe(() => {
				let eq = o && o.flair && typeof o.flair === "object" ? o.flair : null;
				if (!eq && o && o.player_id != null) {
					const c = plateEq.get(Math.round(+o.player_id));
					eq = c || null;
					if (!c) P.plate(o);
				}
				oppWorn = {
					side: side | 0,
					worn: eq ? LV.fightFlair(eq) : null
				};
				const F = ND.flair;
				if (!F) return;
				F.set(side | 0, LV.fightFlair(S().eq));
				F.set(1 - (side | 0), oppWorn.worn);
			});
		},
		rankedHonor(r) {
			return safe(() => {
				if (!r || !ND.HONOR || !ND.save.addHonor) return null;
				const h = ND.HONOR.match({
					mode: r.mode === "shadow" ? "shadow" : "ranked",
					won: !!r.won,
					level: 1,
					roundsWon: r.rounds | 0,
					parries: r.parries | 0,
					counters: r.counters | 0,
					rallies: r.rallies | 0,
					perfects: r.perfects | 0
				});
				const ev = ND.save.addHonor(h.total);
				if (ND.toastEvents) ND.toastEvents(ev);
				lastHonor = {
					total: h.total,
					t: Date.now()
				};
				return h;
			}) || null;
		},
		get lastHonor() {
			return lastHonor && Date.now() - lastHonor.t < 12e4 ? lastHonor.total : 0;
		},
		applyWorn,
		level: () => LV.levelOf(S().xp),
		defaultSeason: DEF,
		setRemote(r) {
			if (r && r.key) {
				const st = S(), loc = LV.seasonAt(P.now()).key;
				if (!st.ps[r.key] && st.ps[loc] && st.ps[loc].x > 0) {
					st.ps[r.key] = {
						x: st.ps[loc].x,
						f: [],
						b: [],
						a: 0,
						w: st.ps[loc].w | 0
					};
					commit();
				}
			}
			remote = r;
			refreshStrip();
			render(false);
		},
		syncState() {
			const st = S(), se = season(), p = sp(st, se);
			return {
				season: se.n,
				server: !!(remote && se === remote),
				xp: st.xp,
				x: p.x,
				r: p.f.slice(),
				f: p.f.slice(),
				b: [],
				a: p.a | 0,
				w: p.w | 0,
				jc: Object.assign({}, st.jc),
				cv: 2,
				eq: {
					title: st.eq.title || null,
					badge: st.eq.badge || null,
					frame: st.eq.frame || null,
					...LV.fightFlair(st.eq)
				}
			};
		},
		mergeServer(me, key) {
			if (!me || typeof me !== "object") return;
			const st = S(), num0 = (v, hi) => typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0;
			const from = LV.levelOf(st.xp);
			st.xp = Math.max(st.xp, num0(me.xp, LV.BASE[LV.MAX] * 4));
			if (me.jc && typeof me.jc === "object") {
				for (const k of Object.keys(me.jc)) if (chOf(k)) st.jc[k] = Math.max(st.jc[k] | 0, num0(me.jc[k], 9999));
			}
			const se = season();
			if (key && key === se.key) {
				const p = sp(st, se), C = se.C;
				p.x = Math.max(p.x, num0(me.x, 1e7));
				p.a = Math.max(p.a | 0, num0(me.a, 999));
				p.w = Math.max(p.w | 0, num0(me.w, 60));
				const list = [
					...Array.isArray(me.r) ? me.r : [],
					...Array.isArray(me.f) ? me.f : [],
					...Array.isArray(me.b) ? me.b : []
				];
				for (const t of list) {
					if (!Number.isInteger(t) || t < 1 || t > C.tiers.length || p.f.includes(t)) continue;
					p.f.push(t);
					const id = C.tiers[t - 1].r, it = LV.item(id);
					if (it && !LV.USED[it.kind] && !st.own.includes(id)) {
						st.own.push(id);
						LV.markNew(st, id);
					}
				}
				p.f.sort((q, r) => q - r);
			}
			if (typeof me.shields === "number" && Number.isFinite(me.shields)) st.sd = Math.max(0, Math.min(LV.SHIELD_MAX, Math.round(me.shields)));
			if (LV.levelOf(st.xp).lv > from.lv) st.seen = Math.max(st.seen, LV.levelOf(st.xp).lv);
			commit();
			refreshStrip();
			render(false);
		},
		plate(o) {
			return safe(() => {
				if (!o || o.guest) return null;
				const el = document.createElement("span");
				el.className = "rk-tt ps-plate";
				const fill = (lv, eq, jc) => {
					if (o.player_id != null && eq && typeof eq === "object") plateEq.set(Math.round(+o.player_id), eq);
					const ti = eq && eq.title && LV.item(eq.title), bd = eq && eq.badge && LV.item(eq.badge), fr = eq && eq.frame && LV.item(eq.frame);
					const best = jc && typeof jc === "object" ? Math.min(3, Math.max(0, ...Object.values(jc).map((v) => v | 0))) : 0;
					el.innerHTML = `<b style="${fr ? "--fc:" + fr.color : ""}">${esc(T().lv)} ${lv | 0}</b>${best ? seal(best) : ""}${bd ? `<i style="color:${bd.color}">${esc(bd.icon)}</i>` : ""}${ti ? `<em style="color:${ti.color}">${esc(itemName(eq.title))}</em>` : ""}`;
				};
				if (o.player_id == null) {
					const st = S();
					fill(LV.levelOf(st.xp).lv, st.eq, st.jc);
					return el;
				}
				if (!ND.passNet || !ND.passNet.plate) return null;
				el.hidden = true;
				ND.passNet.plate(o.player_id).then((q) => {
					if (q) {
						fill(q.lv, q.eq, q.jc);
						el.hidden = false;
					}
				}, () => {});
				return el;
			}) || null;
		},
		plateData(o) {
			return safe(() => {
				if (!o || o.guest) return Promise.resolve(null);
				if (o.player_id == null) {
					const st = S();
					return Promise.resolve({
						lv: LV.levelOf(st.xp).lv,
						eq: Object.assign({}, st.eq),
						jc: Object.assign({}, st.jc)
					});
				}
				if (!ND.passNet || !ND.passNet.plate) return Promise.resolve(null);
				return ND.passNet.plate(o.player_id).then((q) => {
					if (q && q.eq && typeof q.eq === "object") plateEq.set(Math.round(+o.player_id), q.eq);
					return q || null;
				}, () => null);
			}) || Promise.resolve(null);
		},
		itemInfo(id) {
			return safe(() => {
				const it = id && LV.item(id);
				return it ? {
					id,
					kind: it.kind,
					name: itemName(id),
					color: it.color || null,
					icon: it.icon || ""
				} : null;
			}) || null;
		},
		levelLabel: () => safe(() => T().lv) || "LV",
		_hookGame: hookGame
	};
	if (ND.arcade && typeof ND.arcade.init === "function") {
		const oInit = ND.arcade.init;
		ND.arcade.init = function(G) {
			const r = oInit.apply(this, arguments);
			safe(() => hookGame(G));
			return r;
		};
	}
})(window.ND);
