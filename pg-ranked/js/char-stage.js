(function(ND) {
	"use strict";
	if (!ND || typeof document === "undefined") return;
	const doc = document;
	const G = () => ND.game;
	const safe = (f) => {
		try {
			return f();
		} catch (e) {
			return undefined;
		}
	};
	const TCOL = [
		"#9aa3ad",
		"#8fb3c9",
		"#d9b36c",
		"#e38b5c",
		"#c65bd0",
		"#ffd35a"
	];
	const fam = (tier) => tier === "placement" ? "pl" : tier == null || tier === false || !Number.isFinite(+tier) ? null : +tier >= 15 ? 5 : Math.max(0, Math.min(4, Math.floor(+tier / 3)));
	const GOLD = "stroke=\"#f6dfa6\" stroke-width=\"1\"";
	const CORNER = {
		0: `<circle cx="7" cy="7" r="3.6" fill="#c3cad2" stroke="#2b2f35" stroke-width="1.4"/><circle cx="6" cy="6" r="1.2" fill="#eef1f4"/>`,
		1: `<path d="M2 15V4.5L4.5 2H15" fill="none" stroke="#cfe3ef" stroke-width="3" stroke-linecap="square"/><path d="M15 2l-2 2.6M2 15l2.4-1.6" stroke="#2b3a45" stroke-width="1.2"/>`,
		2: `<path d="M2 19V2h17" fill="none" stroke="#d9b36c" stroke-width="3.2"/><path d="M5 16V5h11" fill="none" ${GOLD} opacity=".7"/><circle cx="2.5" cy="2.5" r="2.6" fill="#f6dfa6" stroke="#7d5d24" stroke-width=".8"/>`,
		3: `<path d="M2 20V2h18" fill="none" stroke="#e6bf6e" stroke-width="3.2"/><path d="M8 8l3-3 3 3-3 3z" fill="#e3442f" stroke="#f6dfa6" stroke-width=".8"/><circle cx="2.5" cy="2.5" r="2.6" fill="#f6dfa6" stroke="#7d5d24" stroke-width=".8"/>`,
		4: `<path d="M2 21V2h19" fill="none" stroke="#e6bf6e" stroke-width="3.2"/><g fill="#d58be0" stroke="#f6dfa6" stroke-width=".6"><circle cx="8" cy="7.5" r="2"/><circle cx="8" cy="12" r="1.7"/><circle cx="8" cy="16" r="1.3"/><circle cx="12.5" cy="7.5" r="1.7"/><circle cx="16.5" cy="7.5" r="1.3"/></g><circle cx="2.5" cy="2.5" r="2.6" fill="#f6dfa6" stroke="#7d5d24" stroke-width=".8"/>`,
		5: `<path d="M2 22V2h20" fill="none" stroke="#ffe08a" stroke-width="3.4"/><g stroke="#fff3c4" stroke-width="1.3" stroke-linecap="round"><path d="M6 6l9 9M6 11l6 5M11 6l5 6M6 16l3 2M16 6l2 3"/></g><circle cx="5.5" cy="5.5" r="3.2" fill="#e3263c" stroke="#fff3c4" stroke-width="1.1"/>`,
		pl: `<path d="M3 17C2 10 4 5 9 3c3-1 6-1 9 0" fill="none" stroke="#e8e2d2" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>`
	};
	const CSS = `
  .cst { --fr0: #3a3f4a; --fr1: #6b7280; --fr2: #2a2e37; --frt: rgba(150,160,175,.16); --frg: rgba(0,0,0,0);
    position: relative; box-sizing: border-box; min-width: 0; min-height: 0; overflow: hidden; isolation: isolate;
    border: 3px solid transparent; border-radius: 6px;
    background: radial-gradient(120% 90% at 50% 78%, var(--frt), rgba(8,9,16,0) 62%) padding-box,
                linear-gradient(180deg, rgba(14,16,26,.94), rgba(6,7,12,.97)) padding-box,
                linear-gradient(145deg, var(--fr1), var(--fr0) 38%, var(--fr2) 62%, var(--fr1)) border-box;
    box-shadow: 0 0 0 1px rgba(0,0,0,.55), 0 6px 22px rgba(0,0,0,.5), 0 0 18px var(--frg); }
  .cst > canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; z-index: 1; }
  .cst > .cst-pt { position: absolute; left: 50%; top: 0; height: 100%; width: auto; max-width: 100%; aspect-ratio: 4 / 5; transform: translateX(-50%); z-index: 1; display: none; object-fit: cover; object-position: 50% 30%; pointer-events: none;
    -webkit-mask-image: radial-gradient(ellipse 62% 70% at 50% 62%, #000 62%, transparent 100%); mask-image: radial-gradient(ellipse 62% 70% at 50% 62%, #000 62%, transparent 100%); }
  .cst.pt > .cst-pt { display: block; } .cst.pt > canvas { visibility: hidden; }
  .cst > .cst-c { position: absolute; width: 24px; height: 24px; z-index: 3; pointer-events: none; }
  .cst > .cst-c svg { display: block; width: 100%; height: 100%; }
  .cst > .cst-c.a { top: 1px; left: 1px; } .cst > .cst-c.b { top: 1px; right: 1px; transform: scaleX(-1); }
  .cst > .cst-c.c { bottom: 1px; left: 1px; transform: scaleY(-1); } .cst > .cst-c.d { bottom: 1px; right: 1px; transform: scale(-1); }
  .cst::before { content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
    background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,0) 30%), repeating-linear-gradient(90deg, rgba(255,255,255,.018) 0 1px, rgba(0,0,0,0) 1px 22px); }
  .cst::after { content: ''; position: absolute; inset: -20% -60%; z-index: 4; pointer-events: none; opacity: 0;
    background: linear-gradient(105deg, rgba(255,255,255,0) 42%, rgba(255,255,255,.34) 49%, rgba(255,246,214,.55) 50%, rgba(255,255,255,.3) 51%, rgba(255,255,255,0) 58%);
    transform: translateX(-60%); }
  .cst.gl::after { animation: cstGlint .85s cubic-bezier(.3,.6,.3,1) 1; }
  @keyframes cstGlint { 0% { opacity: 1; transform: translateX(-60%); } 100% { opacity: 1; transform: translateX(60%); } }
  .cst.f0 { --fr0: #5a6169; --fr1: #b9c0c8; --fr2: #3c4148; --frt: rgba(154,163,173,.2); }
  .cst.f1 { --fr0: #4f6f84; --fr1: #cfe3ef; --fr2: #2f4352; --frt: rgba(143,179,201,.22); }
  .cst.f2 { --fr0: #7d5d24; --fr1: #f6dfa6; --fr2: #1a1712; --frt: rgba(217,179,108,.22); --frg: rgba(217,179,108,.16); }
  .cst.f3 { --fr0: #b8432c; --fr1: #f6dfa6; --fr2: #6e1d12; --frt: rgba(227,139,92,.25); --frg: rgba(227,110,70,.2); }
  .cst.f4 { --fr0: #6b2a78; --fr1: #f6dfa6; --fr2: #2c0f34; --frt: rgba(198,91,208,.25); --frg: rgba(198,91,208,.22); }
  .cst.f5 { --fr0: #b8862b; --fr1: #fff3c4; --fr2: #7a4d0e; --frt: rgba(255,211,90,.3); --frg: rgba(255,211,90,.4); border-width: 4px; }
  .cst.f5 > .cst-c { width: 28px; height: 28px; }
  .cst.fpl { border-style: dashed; border-color: rgba(232,226,210,.55); background: radial-gradient(120% 90% at 50% 78%, rgba(232,226,210,.1), rgba(8,9,16,0) 62%) padding-box, linear-gradient(180deg, rgba(14,16,26,.94), rgba(6,7,12,.97)) padding-box; }
  .cst.f5:not(.still)::after { animation: cstGlint 1.1s cubic-bezier(.3,.6,.3,1) 2.2s infinite; animation-duration: 1.1s; }
  .cst.f5.gl::after { animation: cstGlint .85s cubic-bezier(.3,.6,.3,1) 1, cstGlint 1.1s cubic-bezier(.3,.6,.3,1) 3.4s infinite; }
  @keyframes cstPulse { 50% { box-shadow: 0 0 0 1px rgba(0,0,0,.55), 0 6px 22px rgba(0,0,0,.5), 0 0 30px rgba(255,211,90,.55); } }
  .cst.f5:not(.still) { animation: cstPulse 2.6s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) { .cst::after, .cst.gl::after, .cst.f5:not(.still)::after, .cst.f5:not(.still) { animation: none !important; } }
  `;
	function css() {
		if (doc.getElementById("cstCss")) return;
		const s = doc.createElement("style");
		s.id = "cstCss";
		s.textContent = CSS;
		doc.head.appendChild(s);
	}
	function setFrame(el, tier) {
		const f = fam(tier);
		for (const c of [...el.classList]) if (/^f(\d|pl)$/.test(c)) el.classList.remove(c);
		if (f != null) el.classList.add("f" + f);
		el.dataset.fam = f == null ? "none" : String(f);
		const svg = f == null ? "" : `<svg viewBox="0 0 24 24" aria-hidden="true">${CORNER[f]}</svg>`;
		el.querySelectorAll(":scope > .cst-c").forEach((c) => {
			c.innerHTML = svg;
		});
	}
	const live = new Set();
	let raf = 0, last = 0, acc = 0;
	const lowMotion = () => safe(() => ND.alive && ND.alive.level && ND.alive.level() === "low") || false;
	function kick() {
		if (!raf && live.size) {
			last = performance.now();
			raf = requestAnimationFrame(frame);
		}
	}
	function frame(now) {
		raf = 0;
		const g = G();
		if (!live.size || !g || !g.stepPv || !g.drawPv) return;
		const dt = Math.min(.05, Math.max(0, (now - last) / 1e3));
		last = now;
		if (doc.hidden) {
			raf = requestAnimationFrame(frame);
			return;
		}
		acc += dt;
		const step = lowMotion() ? 1 / 30 : 0;
		if (!step || acc >= step) {
			const d = acc;
			acc = 0;
			for (const s of [...live]) {
				if (!s.el.isConnected) {
					s.destroy();
					continue;
				}
				if (!s.f || !s.el.getClientRects().length || s.el.classList.contains("pt")) continue;
				for (let r = d, t = now / 1e3 - d; r > 1e-6;) {
					const h = Math.min(1 / 60, r);
					r -= h;
					t += h;
					safe(() => g.stepPv(s.f, h, t + s.id * 1.3));
				}
				safe(() => drawFighter(s.cv, s.f, s.zoom, s.foot));
			}
		}
		if (live.size) raf = requestAnimationFrame(frame);
	}
	function drawFighter(c, pv, zoom, foot) {
		const g = G();
		if (!g || !pv) return false;
		if (!(zoom > 0) || zoom === 1) return g.drawPv(c, pv);
		const r = c.getBoundingClientRect(), dpr = Math.min(g.dprCap || 2, window.devicePixelRatio || 1);
		if (r.width < 2 || r.height < 2) return false;
		const pc = c.__pv2d || (c.__pv2d = c.getContext("2d", { willReadFrequently: true }));
		const W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
		if (c.width !== W || c.height !== H) {
			c.width = W;
			c.height = H;
		}
		pc.setTransform(1, 0, 0, 1, 0, 0);
		pc.clearRect(0, 0, W, H);
		const gr = pc.createRadialGradient(W / 2, H * .58, 10, W / 2, H * .58, H * .62);
		gr.addColorStop(0, pv.col.ui + "55");
		gr.addColorStop(1, "rgba(0,0,0,0)");
		pc.fillStyle = gr;
		pc.fillRect(0, 0, W, H);
		const k = H / 220 * zoom, fy = foot > 0 && foot <= 1 ? foot : .95;
		pc.setTransform(k, 0, 0, k, W / 2 - (pv.ch.blade > 110 ? 20 : 0) * k * pv.dir, H * fy);
		pc.fillStyle = "rgba(0,0,0,.45)";
		pc.beginPath();
		pc.ellipse(0, 3, 50, 7, 0, 0, 6.283);
		pc.fill();
		pv.draw(pc, false);
		if (ND.eyeGlow) ND.eyeGlow(pc, pv.j, pv.col, pv.ch.acc);
		return true;
	}
	const MW = 640, MH = 560, MX = 320, MY = 420;
	let mcv = null;
	function measureFighter(pv) {
		if (!pv) return null;
		if (!mcv) {
			mcv = doc.createElement("canvas");
			mcv.width = MW;
			mcv.height = MH;
		}
		const pc = mcv.__m2d || (mcv.__m2d = mcv.getContext("2d", { willReadFrequently: true }));
		pc.setTransform(1, 0, 0, 1, 0, 0);
		pc.clearRect(0, 0, MW, MH);
		pc.setTransform(1, 0, 0, 1, MX, MY);
		pv.draw(pc, false);
		if (ND.eyeGlow) ND.eyeGlow(pc, pv.j, pv.col, pv.ch.acc);
		const d = pc.getImageData(0, 0, MW, MH).data;
		let x0 = MW, x1 = -1, y0 = MH, y1 = -1;
		for (let y = 0; y < MH; y++) {
			const row = y * MW * 4;
			for (let x = 0; x < MW; x++) {
				if (d[row + x * 4 + 3] > 40) {
					if (x < x0) x0 = x;
					if (x > x1) x1 = x;
					if (y < y0) y0 = y;
					if (y > y1) y1 = y;
				}
			}
		}
		if (x1 < 0) return null;
		return {
			x0: x0 - MX,
			x1: x1 + 1 - MX,
			y0: y0 - MY,
			y1: Math.max(y1 + 1 - MY, 4)
		};
	}
	const unionBox = (a, b) => !a ? b : !b ? a : {
		x0: Math.min(a.x0, b.x0),
		x1: Math.max(a.x1, b.x1),
		y0: Math.min(a.y0, b.y0),
		y1: Math.max(a.y1, b.y1)
	};
	function drawFit(c, pv, box, pad) {
		const g = G();
		if (!g || !pv || !box) return false;
		const r = c.getBoundingClientRect(), dpr = Math.min(g.dprCap || 2, window.devicePixelRatio || 1);
		if (r.width < 2 || r.height < 2) return false;
		const pc = c.__pv2d || (c.__pv2d = c.getContext("2d", { willReadFrequently: true }));
		const W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
		if (c.width !== W || c.height !== H) {
			c.width = W;
			c.height = H;
		}
		pc.setTransform(1, 0, 0, 1, 0, 0);
		pc.clearRect(0, 0, W, H);
		const gr = pc.createRadialGradient(W / 2, H * .58, 10, W / 2, H * .58, H * .62);
		gr.addColorStop(0, pv.col.ui + "55");
		gr.addColorStop(1, "rgba(0,0,0,0)");
		pc.fillStyle = gr;
		pc.fillRect(0, 0, W, H);
		const m = (pad == null ? 5 : pad) * dpr, bw = Math.max(20, box.x1 - box.x0), bh = Math.max(40, box.y1 - box.y0);
		const k = Math.min((W - 2 * m) / bw, (H - 2 * m) / bh);
		const tx = W / 2 - k * (box.x0 + box.x1) / 2, ty = H - m - k * box.y1;
		pc.setTransform(k, 0, 0, k, tx, ty);
		pc.fillStyle = "rgba(0,0,0,.45)";
		pc.beginPath();
		pc.ellipse(0, Math.min(3, box.y1 - 4), Math.min(50, bw / 2), 6, 0, 0, 6.283);
		pc.fill();
		pv.draw(pc, false);
		if (ND.eyeGlow) ND.eyeGlow(pc, pv.j, pv.col, pv.ch.acc);
		c.__fit = {
			x0: (tx + k * box.x0) / dpr,
			x1: (tx + k * box.x1) / dpr,
			y0: (ty + k * box.y0) / dpr,
			y1: (ty + k * box.y1) / dpr,
			w: W / dpr,
			h: H / dpr
		};
		return true;
	}
	const PORTRAIT_BASE = "assets/portraits/";
	let plist = null;
	const portraitList = () => plist || (plist = typeof fetch === "function" ? fetch(PORTRAIT_BASE + "portraits.json", { cache: "no-cache" }).then((r) => r.ok ? r.json() : []).then((a) => new Set(Array.isArray(a) ? a.filter((x) => typeof x === "string" && /^[a-z]+(-[a-z0-9]+)?$/.test(x)) : []), () => new Set()) : Promise.resolve(new Set()));
	function portrait(s, ninja, key) {
		const want = key == null || key === false ? null : ninja + (key ? "-" + key : "");
		if (s.pKey === want) return;
		s.pKey = want;
		const off = () => {
			s.el.classList.remove("pt");
			const im = s.el.querySelector(":scope > .cst-pt");
			if (im) im.remove();
		};
		if (!want) {
			off();
			return;
		}
		portraitList().then((set) => {
			if (s.dead || s.pKey !== want) return;
			if (!set.has(want)) {
				off();
				return;
			}
			let im = s.el.querySelector(":scope > .cst-pt");
			if (!im) {
				im = doc.createElement("img");
				im.className = "cst-pt";
				im.alt = "";
				im.decoding = "async";
				im.setAttribute("aria-hidden", "true");
				s.el.insertBefore(im, s.cv.nextSibling);
			}
			im.onload = () => {
				if (s.pKey === want) s.el.classList.add("pt");
			};
			im.onerror = () => {
				if (s.pKey === want) off();
			};
			im.src = PORTRAIT_BASE + want + ".webp";
		});
	}
	function applyLook(f, ch, look) {
		if (look && typeof look === "object" && look.pal && typeof look.pal === "object") {
			f.setChar(ch, false);
			f.col = Object.assign({}, ND.palOf ? ND.palOf(ch, false) : ch.col, look.pal);
			f._ropes = null;
			return;
		}
		if (typeof look === "string" && look.startsWith("cos:")) {
			f.setChar(ch, false);
			const key = ND.costumeKey ? ND.costumeKey(look.slice(4), ch.id) : null;
			if (key && ND.costumePal && ND.palOf) {
				f.col = ND.costumePal(ND.palOf(ch, false), key);
				f._ropes = null;
			}
			return;
		}
		f.setChar(ch, look == null ? false : look);
	}
	function create(o) {
		o = o || {};
		css();
		const el = doc.createElement("div"), cv = doc.createElement("canvas");
		el.className = "cst" + (o.cls ? " " + o.cls : "");
		cv.setAttribute("aria-hidden", "true");
		el.append(cv);
		for (const k of [
			"a",
			"b",
			"c",
			"d"
		]) {
			const c = doc.createElement("span");
			c.className = "cst-c " + k;
			c.setAttribute("aria-hidden", "true");
			el.append(c);
		}
		if (safe(() => ND.alive && ND.alive.level && ND.alive.level() === "off")) el.classList.add("still");
		const s = {
			el,
			cv,
			f: null,
			id: o.id | 0,
			key: "",
			dead: false,
			zoom: o.zoom || 1,
			foot: o.foot || 0,
			set(p) {
				p = p || {};
				const id = p.ninja || o.ninja, ch = ND.CHARS && (ND.CHARS.find((c) => c.id === id) || ND.CHARS[0]);
				if (!ch || !ND.Fighter || !ND.Ctrl) return s;
				const look = p.look !== undefined ? p.look : o.look, dir = p.dir || o.dir || 1;
				const por = p.portrait !== undefined ? p.portrait : o.portrait;
				o.ninja = ch.id;
				o.look = look;
				o.dir = dir;
				o.portrait = por;
				portrait(s, ch.id, por);
				const key = ch.id + "|" + (look && typeof look === "object" ? JSON.stringify(look) : String(look)) + "|" + dir;
				if (key === s.key) return s;
				if (!s.f) {
					s.f = new ND.Fighter(s.id, new ND.Ctrl());
					s.f.fullDetail = true;
				}
				safe(() => {
					applyLook(s.f, ch, look);
					s.f.reset(0);
					s.f.dir = dir;
					s.f.pvPose = null;
					if (ND.alive && ND.alive.menu) ND.alive.menu(s.f, false);
				});
				s.key = key;
				el.dataset.ninja = ch.id;
				el.dataset.look = look && typeof look === "object" ? "pal" : String(look);
				el.style.setProperty("--nc", s.f.col && s.f.col.ui || ch.col.ui);
				if (!s.dead) {
					live.add(s);
					kick();
				}
				safe(() => drawFighter(cv, s.f, s.zoom, s.foot));
				return s;
			},
			setTier(t) {
				setFrame(el, t);
				return s;
			},
			play(move, opt) {
				return !!(s.f && ND.alive && ND.alive.play && safe(() => ND.alive.play(s.f, move, opt)));
			},
			glint() {
				el.classList.remove("gl");
				void el.offsetWidth;
				el.classList.add("gl");
				return s;
			},
			destroy() {
				if (s.dead) return;
				s.dead = true;
				live.delete(s);
				cv.width = 0;
				cv.height = 0;
				s.f = null;
			}
		};
		setFrame(el, o.tier);
		s.set({});
		return s;
	}
	ND.charStage = {
		create,
		fam,
		TCOL,
		CORNER,
		frameCss: css,
		setFrame,
		drawFighter,
		measureFighter,
		unionBox,
		drawFit,
		applyLook,
		PORTRAIT_BASE,
		portraitList
	};
})(window.ND);
