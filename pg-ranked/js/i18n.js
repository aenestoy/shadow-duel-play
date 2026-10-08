(function(ND) {
	"use strict";
	const SOURCE = "tr";
	const DEFAULT = "en";
	const SUPPORTED = [
		"en",
		"tr",
		"es",
		"pt",
		"ru",
		"de",
		"fr",
		"it",
		"pl",
		"id",
		"vi",
		"th",
		"hi",
		"ar",
		"zh",
		"zh-TW",
		"ja",
		"ko"
	];
	const NAMES = {
		en: "English",
		tr: "Türkçe",
		es: "Español",
		pt: "Português",
		ru: "Русский",
		de: "Deutsch",
		fr: "Français",
		it: "Italiano",
		pl: "Polski",
		id: "Bahasa Indonesia",
		vi: "Tiếng Việt",
		th: "ไทย",
		hi: "हिन्दी",
		ar: "العربية",
		zh: "简体中文",
		"zh-TW": "繁體中文",
		ja: "日本語",
		ko: "한국어"
	};
	const LOCALES = {
		en: "en-US",
		tr: "tr-TR",
		es: "es-ES",
		pt: "pt-BR",
		ru: "ru-RU",
		de: "de-DE",
		fr: "fr-FR",
		it: "it-IT",
		pl: "pl-PL",
		id: "id-ID",
		vi: "vi-VN",
		th: "th-TH",
		hi: "hi-IN",
		ar: "ar-u-nu-latn",
		zh: "zh-CN",
		"zh-TW": "zh-TW",
		ja: "ja-JP",
		ko: "ko-KR"
	};
	const ALIAS = {
		be: "ru",
		kk: "ru",
		uk: "ru",
		uz: "ru",
		ms: "id",
		in: "id"
	};
	const BUNDLED = ["en", "tr"];
	const LAZY = SUPPORTED.filter((l) => !BUNDLED.includes(l));
	const FONT_CSS = {
		th: 1,
		hi: 1,
		ar: 1,
		zh: 1,
		"zh-TW": 1,
		ja: 1,
		ko: 1
	};
	const LAZY_V = "langs-1";
	const DEC_POINT = {
		en: 1,
		zh: 1,
		"zh-TW": 1,
		ja: 1,
		ko: 1,
		th: 1,
		hi: 1,
		ar: 1
	};
	const LS_KEY = "nd.lang";
	const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
	const norm = (s) => String(s).replace(/\s+/g, " ").trim();
	const normHtml = (h) => norm(String(h).replace(/ data-code="[^"]*"/g, ""));
	const langOf = (code) => {
		const raw = String(code || "").trim().replace(/_/g, "-").toLowerCase();
		if (/^zh\b/.test(raw)) return /-hans\b/.test(raw) ? "zh" : /-(hant|tw|hk|mo)\b/.test(raw) ? "zh-TW" : "zh";
		if (/^yue\b/.test(raw)) return "zh-TW";
		const c = raw.slice(0, 2), l = ALIAS[c] || c;
		return SUPPORTED.includes(l) ? l : null;
	};
	const fileOf = (l) => "js/i18n-" + l.toLowerCase() + ".js?v=" + LAZY_V;
	const hasCatalog = (l) => l === SOURCE || !!(ND.I18N_CATALOGS && typeof ND.I18N_CATALOGS[l] === "function");
	const pick = (code) => langOf(code) || DEFAULT;
	const catalogs = {};
	function fill(target, src) {
		if (!isObj(src) || !target) return target;
		for (const k of Object.keys(src)) {
			if (isObj(src[k])) {
				if (!isObj(target[k])) target[k] = {};
				fill(target[k], src[k]);
			} else if (!Object.prototype.hasOwnProperty.call(target, k)) target[k] = src[k];
		}
		return target;
	}
	function catalog(lang) {
		if (catalogs[lang]) return catalogs[lang];
		if (lang !== "en" && !hasCatalog(lang)) return catalog("en");
		const EN = catalogs[lang] = {
			STR: {},
			TXT: {},
			CHARS: {},
			ARENAS: {},
			SPECIALS: {},
			AI_LEVELS: {},
			NUMWORDS: [],
			PHRASES: {},
			HTML: {},
			PATTERNS: []
		};
		const build = ND.I18N_CATALOGS && ND.I18N_CATALOGS[lang];
		if (typeof build === "function") {
			try {
				build(I, EN);
			} catch (e) {
				console.warn("[i18n] catalog build failed:", lang, e);
			}
		}
		if (lang !== "en" && lang !== SOURCE) {
			const B = catalog("en");
			for (const part of [
				"STR",
				"TXT",
				"CHARS",
				"ARENAS",
				"SPECIALS",
				"AI_LEVELS",
				"PHRASES",
				"HTML"
			]) fill(EN[part], B[part]);
			if (!EN.NUMWORDS.length) EN.NUMWORDS = B.NUMWORDS.slice();
			EN.PATTERNS = EN.PATTERNS.concat(B.PATTERNS);
		}
		EN._phr = new Map(Object.keys(EN.PHRASES).map((k) => [norm(k), EN.PHRASES[k]]));
		EN._html = new Map(Object.keys(EN.HTML).map((k) => [normHtml(k), EN.HTML[k]]));
		EN._htmlMax = Math.max(0, ...Object.keys(EN.HTML).map((k) => norm(k.replace(/<[^>]*>/g, "")).length)) + 8;
		return EN;
	}
	function merge(target, src) {
		if (!isObj(src) || !target) return target;
		for (const k of Object.keys(src)) {
			if (isObj(src[k])) {
				if (!isObj(target[k])) target[k] = {};
				merge(target[k], src[k]);
			} else target[k] = src[k];
		}
		return target;
	}
	function overlay(target, src, backup) {
		if (!isObj(src) || !target) return;
		for (const k of Object.keys(src)) {
			if (isObj(src[k]) && isObj(target[k])) {
				const kid = backup.kids.get(k) || {
					orig: new Map(),
					kids: new Map()
				};
				backup.kids.set(k, kid);
				overlay(target[k], src[k], kid);
			} else {
				if (!backup.orig.has(k)) backup.orig.set(k, Object.prototype.hasOwnProperty.call(target, k) ? target[k] : NONE);
				target[k] = src[k];
			}
		}
	}
	const NONE = {};
	function restore(target, backup) {
		if (!target || !backup) return;
		for (const [k, v] of backup.orig) {
			if (v === NONE) delete target[k];
			else target[k] = v;
		}
		for (const [k, kid] of backup.kids) restore(target[k], kid);
		backup.orig.clear();
		backup.kids.clear();
	}
	const backups = new Map();
	const bk = (obj) => {
		let b = backups.get(obj);
		if (!b) {
			b = {
				orig: new Map(),
				kids: new Map()
			};
			backups.set(obj, b);
		}
		return b;
	};
	function applyTables(EN) {
		if (ND.STR) overlay(ND.STR, EN.STR, bk(ND.STR));
		if (ND.TXT) overlay(ND.TXT, EN.TXT, bk(ND.TXT));
		(ND.CHARS || []).forEach((c) => {
			const e = EN.CHARS[c.id];
			if (e) overlay(c, e, bk(c));
		});
		(ND.ARENAS || []).forEach((a) => {
			const e = EN.ARENAS[a.id];
			if (typeof e === "string") overlay(a, { name: e }, bk(a));
			else if (isObj(e)) overlay(a, e, bk(a));
		});
		if (ND.SPECIALS) {
			for (const id in EN.SPECIALS) if (ND.SPECIALS[id]) overlay(ND.SPECIALS[id], EN.SPECIALS[id], bk(ND.SPECIALS[id]));
		}
		if (ND.AI_LEVELS) for (const k in EN.AI_LEVELS) {
			const L = ND.AI_LEVELS[k];
			if (L) overlay(L, { name: EN.AI_LEVELS[k] }, bk(L));
		}
	}
	function restoreTables() {
		for (const [obj, b] of backups) restore(obj, b);
	}
	function src(obj, key) {
		const b = backups.get(obj);
		return b && b.orig.has(key) && b.orig.get(key) !== NONE ? b.orig.get(key) : obj[key];
	}
	const cache = new Map();
	const strPath = (p) => ND.STR && /^[A-Za-z]\w*(\.\w+)+$/.test(p) ? p.split(".").reduce((o, k) => o != null ? o[k] : undefined, ND.STR) : undefined;
	function t(text, ...args) {
		if (text == null) return "";
		if (typeof text !== "string") return String(text);
		const path = strPath(text);
		if (typeof path === "string") return path;
		if (typeof path === "function") {
			try {
				return String(path(...args));
			} catch (e) {
				return text;
			}
		}
		if (I.lang === SOURCE || !text) return text;
		const key = norm(text);
		if (!key || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(key)) return text;
		const hit = cache.get(key);
		if (hit !== undefined) return hit === null ? text : hit;
		const EN = catalog(I.lang);
		let out = EN._phr.get(key);
		if (out === undefined) {
			for (const [re, rep] of EN.PATTERNS) {
				re.lastIndex = 0;
				if (re.test(key)) {
					re.lastIndex = 0;
					try {
						out = key.replace(re, rep);
					} catch (e) {
						out = undefined;
					}
					break;
				}
			}
		}
		if (cache.size > 4e3) cache.clear();
		cache.set(key, out === undefined ? null : out);
		return out === undefined ? text : out;
	}
	const loc = () => LOCALES[I.lang] || "en-US";
	const nf = {};
	function num(n) {
		const v = Math.round(Number(n) || 0), l = loc();
		try {
			return (nf[l] || (nf[l] = new Intl.NumberFormat(l))).format(v);
		} catch (e) {
			return String(v);
		}
	}
	const dec = (x) => DEC_POINT[I.lang] ? String(x) : String(x).replace(".", ",");
	const time = (s) => {
		s = Math.max(0, Math.round(s));
		return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
	};
	const upper = (s) => {
		try {
			return String(s).toLocaleUpperCase(loc());
		} catch (e) {
			return String(s).toUpperCase();
		}
	};
	const lower = (s) => {
		try {
			return String(s).toLocaleLowerCase(loc());
		} catch (e) {
			return String(s).toLowerCase();
		}
	};
	const nodeSrc = new WeakMap();
	const elSrc = new WeakMap();
	const ATTRS = [
		"aria-label",
		"title",
		"placeholder"
	];
	const SKIP_TAGS = /^(SCRIPT|STYLE|CANVAS|svg|SVG|TEXTAREA|INPUT|SELECT|NOSCRIPT|TEMPLATE)$/;
	const skipEl = (el) => SKIP_TAGS.test(el.tagName) || el.getAttribute("translate") === "no" || el.hasAttribute("data-i18n-skip");
	const skippedBranch = (node) => {
		for (let el = node.nodeType === 1 ? node : node.parentElement; el; el = el.parentElement) if (skipEl(el)) return true;
		return false;
	};
	function textNode(n) {
		const v = n.nodeValue;
		let rec = nodeSrc.get(n);
		if (!rec || v !== rec.out && v !== rec.src) {
			rec = {
				src: v,
				out: v
			};
			nodeSrc.set(n, rec);
		}
		let out = rec.src;
		if (I.lang !== SOURCE) {
			const k = norm(rec.src);
			if (k) {
				const tr = t(k);
				if (tr !== k) {
					const m = /^(\s*)[\s\S]*?(\s*)$/.exec(rec.src);
					out = m[1] + tr + m[2];
				}
			}
		}
		rec.out = out;
		if (v !== out) n.nodeValue = out;
		if (I.lang === SOURCE) guardCase(n);
	}
	let foreignRe = null, foreignN = -1;
	function foreignNames() {
		const S = ND.SPECIALS || {}, n = (ND.CHARS || []).length * 1e3 + Object.keys(S).length;
		if (n === foreignN) return foreignRe;
		foreignN = n;
		const words = new Set();
		for (const c of ND.CHARS || []) {
			const s = String(c && c.name || "");
			if (s) words.add(s.charAt(0) + s.slice(1).toLowerCase());
		}
		for (const k of Object.keys(S)) {
			const s = S[k] && S[k].name;
			if (typeof s === "string" && /^[A-Za-z\sōū'-]+$/.test(s)) words.add(s);
		}
		const list = [...words].filter((w) => w.includes("i")).sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
		foreignRe = list.length ? new RegExp("(^|[^\\p{L}])(" + list.join("|") + ")(?![\\p{L}])", "u") : null;
		return foreignRe;
	}
	function guardCase(n) {
		const p = n.parentElement, v = n.nodeValue;
		if (!p || p.lang || !v || !v.includes("i") || typeof getComputedStyle !== "function") return;
		const re = foreignNames(), m = re && re.exec(v);
		if (!m) return;
		let tt = "";
		try {
			tt = getComputedStyle(p).textTransform;
		} catch (e) {
			return;
		}
		if (tt !== "uppercase") return;
		const name = n.splitText(m.index + m[1].length), rest = name.splitText(m[2].length);
		const sp = document.createElement("span");
		sp.lang = "en";
		sp.textContent = m[2];
		name.replaceWith(sp);
		guardCase(rest);
	}
	function element(el, EN) {
		let rec = elSrc.get(el);
		const key = el.getAttribute("data-i18n");
		if (key) {
			const v = t(key);
			if (el.textContent !== v) el.textContent = v;
			return false;
		}
		for (const a of ATTRS) {
			if (!el.hasAttribute(a)) continue;
			rec = rec || { attrs: {} };
			elSrc.set(el, rec);
			const cur = el.getAttribute(a), prev = rec.attrs[a];
			if (!prev || cur !== prev.out && cur !== prev.src) rec.attrs[a] = {
				src: cur,
				out: cur
			};
			const r = rec.attrs[a], out = I.lang === SOURCE ? r.src : t(r.src);
			r.out = out;
			if (cur !== out) el.setAttribute(a, out);
		}
		if (EN && EN._html.size && el.firstElementChild) {
			const cur = el.innerHTML;
			if (rec && rec.html && normHtml(cur) === normHtml(rec.html.out)) {
				const tr = EN._html.get(normHtml(rec.html.src));
				if (tr !== undefined && normHtml(tr) !== normHtml(cur)) {
					el.innerHTML = tr;
					rec.html.out = tr;
				}
				return true;
			}
			if ((el.textContent || "").length <= EN._htmlMax * 1.5) {
				const tr = EN._html.get(normHtml(cur));
				if (tr !== undefined) {
					rec = rec || { attrs: {} };
					elSrc.set(el, rec);
					rec.html = {
						src: cur,
						out: tr
					};
					el.innerHTML = tr;
					return true;
				}
			}
		} else if (!EN && rec && rec.html && normHtml(el.innerHTML) === normHtml(rec.html.out)) {
			el.innerHTML = rec.html.src;
			rec.html = null;
		}
		return false;
	}
	function apply(root) {
		root = root || document.body;
		if (!root || skippedBranch(root)) return;
		const EN = I.lang === SOURCE ? null : catalog(I.lang);
		if (root.nodeType === 3) {
			textNode(root);
			return;
		}
		if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
		const walk = (el) => {
			if (el.nodeType === 1 && skipEl(el)) return;
			if (el.nodeType === 1 && element(el, EN)) {
				relabel(el);
				return;
			}
			for (let c = el.firstChild; c; c = c.nextSibling) {
				if (c.nodeType === 3) textNode(c);
				else if (c.nodeType === 1) walk(c);
			}
		};
		walk(root.nodeType === 9 ? root.documentElement : root);
		relabel(root);
		if (root === document.body || root === document || root === document.documentElement) {
			document.title = I.lang === SOURCE ? TITLE_TR : t(TITLE_TR);
		}
	}
	const TITLE_TR = "Gölge Düellosu";
	const relabel = (root) => {
		try {
			if (ND.input && ND.input.relabel && root.querySelectorAll) ND.input.relabel(root);
		} catch (e) {}
	};
	let observer = null, busy = false;
	function watch(root) {
		root = root || document.getElementById("app") || document.body;
		if (!root || typeof MutationObserver === "undefined" || observer) return;
		observer = new MutationObserver((list) => {
			if (busy) return;
			busy = true;
			try {
				for (const m of list) {
					if (m.type === "characterData") {
						if (m.target.parentElement && !skippedBranch(m.target)) textNode(m.target);
					} else for (const n of m.addedNodes) {
						if (n.nodeType === 3) {
							if (n.parentElement && !skippedBranch(n)) textNode(n);
						} else if (n.nodeType === 1) apply(n);
					}
				}
			} catch (e) {
				console.warn("[i18n] observer", e);
			}
			busy = false;
		});
		observer.observe(root, {
			childList: true,
			characterData: true,
			subtree: true
		});
	}
	const fns = [];
	let explicit = false, from = "default";
	function savedLang() {
		let s = null;
		try {
			s = ND.save && ND.save.settings ? ND.save.settings().lang : null;
		} catch (e) {}
		if (s && langOf(s) === s) return s;
		try {
			const old = localStorage.getItem(LS_KEY);
			if (old && langOf(old) === old) {
				if (storeLang(old)) localStorage.removeItem(LS_KEY);
				return old;
			}
		} catch (e) {}
		return null;
	}
	function storeLang(lang) {
		try {
			if (ND.save && ND.save.saveSettings) {
				const s = ND.save.settings() || {};
				s.lang = lang;
				ND.save.saveSettings(s);
				return ND.save.settings().lang === lang;
			}
		} catch (e) {}
		return false;
	}
	const browserLangs = () => {
		try {
			const list = navigator.languages && navigator.languages.length ? Array.from(navigator.languages) : [];
			if (navigator.language) list.push(navigator.language);
			return list;
		} catch (e) {
			return [];
		}
	};
	const deviceLang = () => {
		for (const c of browserLangs()) {
			const l = langOf(c);
			if (l) return l;
		}
		return null;
	};
	const PORTAL_LANG = {
		xportalx: true,
		playgama: true
	};
	function initialLang() {
		try {
			const q = ND.qs ? ND.qs.get("lang") : new URLSearchParams(location.search).get("lang");
			if (q) {
				explicit = true;
				from = "url";
				return pick(q);
			}
		} catch (e) {}
		const s = savedLang();
		if (s) {
			explicit = true;
			from = "saved";
			return s;
		}
		const dev = deviceLang();
		if (PORTAL_LANG[ND.portalName]) {
			from = "portal-guess";
			return dev || DEFAULT;
		}
		if (dev) {
			from = "device";
			return dev;
		}
		from = "default";
		return DEFAULT;
	}
	const FONT_PROBE = {
		ru: "ДуэльЖЯ",
		tr: "ğışİ",
		de: "ßÄ",
		fr: "œÉ",
		es: "ñÁ",
		pt: "ãõ",
		pl: "ąęłśżŁ",
		it: "àèìò",
		vi: "ạếờĐữ",
		th: "ไทย",
		hi: "हिन्दी",
		ar: "العربية",
		zh: "中文",
		"zh-TW": "中文",
		ja: "あア日本",
		ko: "한국어"
	};
	function loadFonts(lang) {
		const p = FONT_PROBE[lang];
		if (!p || !document.fonts || !document.fonts.load) return;
		[
			"700 20px Oswald",
			"600 20px Oswald",
			"500 14px \"Source Sans 3\"",
			"600 14px \"Source Sans 3\""
		].forEach((f) => {
			try {
				document.fonts.load(f, p).catch(() => {});
			} catch (e) {}
		});
	}
	const fontLinks = {};
	function langFonts(lang) {
		for (const l of Object.keys(fontLinks)) fontLinks[l].disabled = l !== lang;
		if (!FONT_CSS[lang] || fontLinks[lang] || !document.createElement) return;
		try {
			const k = document.createElement("link");
			k.rel = "stylesheet";
			k.href = "fonts/lang/" + lang.toLowerCase() + ".css?v=" + LAZY_V;
			k.onload = () => {
				if (I.lang === lang) loadFonts(lang);
			};
			(document.head || document.documentElement).appendChild(k);
			fontLinks[lang] = k;
		} catch (e) {}
	}
	const loading = {};
	function loadLang(l) {
		if (hasCatalog(l)) return Promise.resolve(true);
		if (loading[l]) return loading[l];
		return loading[l] = new Promise((done) => {
			try {
				const s = document.createElement("script");
				s.src = fileOf(l);
				s.async = true;
				s.onload = () => done(hasCatalog(l));
				s.onerror = () => {
					delete loading[l];
					done(false);
				};
				(document.head || document.documentElement).appendChild(s);
			} catch (e) {
				delete loading[l];
				done(false);
			}
		});
	}
	let want = null;
	function setLang(lang, opts = {}) {
		lang = langOf(lang) || DEFAULT;
		if (opts.save) {
			explicit = true;
			from = "saved";
			storeLang(lang);
		}
		if (!hasCatalog(lang)) {
			if (I.lang === SOURCE && !I.ready) setLang(DEFAULT);
			want = lang;
			loadLang(lang).then((ok) => {
				if (want !== lang) return;
				want = null;
				if (ok) setLang(lang);
			});
			return I.lang;
		}
		want = null;
		if (lang === I.lang && I.ready) return lang;
		restoreTables();
		I.lang = lang;
		cache.clear();
		if (lang !== SOURCE) applyTables(catalog(lang));
		document.documentElement.lang = lang;
		langFonts(lang);
		loadFonts(lang);
		if (I.ready) refreshDom();
		return lang;
	}
	function refreshDom() {
		try {
			if (ND.STR && typeof ND.STR.apply === "function") ND.STR.apply(document);
		} catch (e) {}
		try {
			if (ND.touch && ND.touch.swapTexts) ND.touch.swapTexts();
		} catch (e) {}
		apply(document.body);
		fns.forEach((fn) => {
			try {
				fn(I.lang);
			} catch (e) {
				console.warn("[i18n] listener", e);
			}
		});
	}
	function audit() {
		const TRCH = /[çğıöşüÇĞİÖŞÜ]/, out = {
			lang: I.lang,
			str: [],
			chars: [],
			specials: [],
			arenas: [],
			dom: []
		};
		if (I.lang === SOURCE) return out;
		const walk = (o, p) => {
			if (!o) return;
			for (const k of Object.keys(o)) {
				const v = o[k], q = p ? p + "." + k : k;
				if (typeof v === "string") {
					if (TRCH.test(v) || / (ve|ile|bir|için) /.test(v)) out.str.push(q);
				} else if (typeof v === "function" && k !== "apply" && k !== "pickT") {
					try {
						const s = String(v(1, 2, 3, 4, 5));
						if (TRCH.test(s)) out.str.push(q + "()");
					} catch (e) {}
				} else if (Array.isArray(v) || isObj(v)) walk(v, q);
			}
		};
		walk(ND.STR, "STR");
		walk(ND.TXT, "TXT");
		(ND.CHARS || []).forEach((c) => [
			"title",
			"desc",
			"weapon"
		].forEach((k) => {
			if (TRCH.test(c[k] || "")) out.chars.push(c.id + "." + k);
		}));
		(ND.ARENAS || []).forEach((a) => {
			if (TRCH.test(a.name || "")) out.arenas.push(a.id);
		});
		if (ND.SPECIALS) for (const id in ND.SPECIALS) ["desc", "tip"].forEach((k) => {
			if (TRCH.test(ND.SPECIALS[id][k] || "")) out.specials.push(id + "." + k);
		});
		const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
		for (let n = tw.nextNode(); n; n = tw.nextNode()) {
			const pe = n.parentElement;
			if (!pe || skipEl(pe) || pe.closest("[hidden]") || !n.nodeValue.trim()) continue;
			if (TRCH.test(n.nodeValue)) out.dom.push(norm(n.nodeValue).slice(0, 80));
		}
		return out;
	}
	const I = ND.i18n = {
		lang: SOURCE,
		source: SOURCE,
		default: DEFAULT,
		supported: SUPPORTED,
		names: NAMES,
		ready: false,
		catalog,
		merge,
		t,
		num,
		dec,
		time,
		upper,
		lower,
		src,
		apply,
		watch,
		setLang,
		audit,
		langOf,
		locale: loc,
		load: loadLang,
		loaded(l) {
			if (catalogs[l] && l !== "en") delete catalogs[l];
		},
		get pending() {
			return want;
		},
		get explicit() {
			return explicit;
		},
		get from() {
			return from;
		},
		onChange(fn) {
			fns.push(fn);
		},
		init(first) {
			if (I.ready) return;
			setLang(first || initialLang());
			I.ready = true;
			refreshDom();
			watch();
			const P = ND.portal;
			if (P && P.ready) P.ready.then(() => {
				if (explicit) return;
				const req = P.requiredLanguage ? P.requiredLanguage() : null;
				if (!req) return;
				from = "portal";
				const l = pick(req);
				if (l !== I.lang) setLang(l);
			});
		}
	};
	function touchSource(STR) {
		if (!STR || !STR.touch) return;
		const tb = (t, c) => `<i class="tb${c ? " " + c : ""}">${t}</i>`;
		const ATK = tb("SALDIR", "tb-light"), HV = tb("AĞIR"), GD = tb("▼", "tb-guard"), KI = tb("KI", "ki");
		merge(STR.touch, {
			btn: { light: "SALDIR" },
			lock: "SALDIR’a hızlıca bas!",
			rotMenu: "Ana menü",
			opt: {
				title: "Dokunmatik kontroller",
				layout: "Düzen",
				simple: "Basit",
				full: "Tam",
				size: "Boyut",
				sizes: {
					s: "Küçük",
					m: "Orta",
					l: "Büyük"
				},
				hand: "Düğmeler",
				right: "Sağda",
				left: "Solda",
				assist: "Kolay yardım",
				haptic: "Titreşim",
				fullscreen: "Tam ekran",
				exitFullscreen: "Tam ekrandan çık",
				note: "Basit: 4 büyük düğme. Tam: tekme ve shuriken de eklenir. Kolay yardım: SALDIR’ı basılı tutunca seri kendiliğinden sürer, ▼’ye kısa dokunuş savuşturmaya yetecek kadar sürer. Yalnız dokunmayı kolaylaştırır; kurallar ve puanlar herkes için aynı.",
				fullNote: "TEKME ve SHURIKEN düğmeleri Tam düzende (Ayarlar → Kontroller)."
			},
			help: "<div class=\"th-grid\">" + "<div><h3>Yön tuşları</h3><dl>" + `<dt>${tb("◀ ▶")}</dt><dd>Basılı tut: yürü</dd>` + `<dt>${tb("▲")}</dt><dd>Dokun: zıpla</dd>` + `<dt>${GD}</dt><dd>Basılı tut: gard. Darbeden hemen önce dokun: savuşturma</dd>` + `<dt>${tb("▶▶")}</dt><dd>İki kez dokun: atılma</dd>` + "</dl></div>" + "<div><h3>Düğmeler</h3><dl>" + `<dt>${ATK}</dt><dd>Kesik. Art arda dokun: kombo. İleri ya da geri tutarak dokun: başka teknik</dd>` + `<dt>${HV}</dt><dd>Ağır kesik. İleri + AĞIR: rakibi havaya fırlatır</dd>` + `<dt>${tb("ATIL")}</dt><dd>Atılma (basılı tuttuğun ◀ ▶ yönüne, yoksa geriye)</dd>` + `<dt>${KI}</dt><dd>Ki tekniği: ki dolunca düğme parlar</dd>` + `<dt>${tb("TEKME")} ${tb("SHUR.")}</dt><dd>Tam düzende: tekme ve shuriken</dd>` + "</dl></div></div>",
			note: `Aynı anda birden çok düğmeye basabilirsin: ${GD}’yi basılı tutup gard al, öbür başparmağınla ${ATK}’a dokun. Ekranın üstündeki <b>II</b> duraklatır; düzen, boyut ve solak ayarı <b>Ayarlar</b>’dadır. Klavye ya da gamepad kullanınca kontroller kendiliğinden onlara geçer.`
		});
		STR.movesTouch = [
			[
				tb("◀ ▶"),
				"Yürü",
				"basılı tut · iki kez dokun: atılma"
			],
			[
				tb("▲"),
				"Zıpla",
				"dokun"
			],
			[
				ATK + "×3",
				"Üçlü kombo",
				"art arda dokun; üçüncü vuruş iter"
			],
			[
				HV,
				"Ağır kesik",
				"yere serer"
			],
			[
				tb("TEKME"),
				"Tekme",
				"gardı zorlar, dengeyi doldurur · Tam düzen"
			],
			[
				tb("▼", "tb-guard") + "+" + tb("TEKME"),
				"Süpürme",
				"yere serer · üstünden atla"
			],
			[
				"Geri+" + tb("TEKME"),
				"Dönen tekme",
				"yavaş, güçlü, gardı kırar"
			],
			[
				"İleri+" + tb("TEKME"),
				"El tekmesi",
				"kalkışa denk gelirse kılıcı düşürür"
			],
			[
				tb("▲") + "›" + tb("TEKME"),
				"Uçan tekme",
				"havada"
			],
			[
				"←→+" + tb("TEKME"),
				"Özel tekme",
				"her ninjanın kendine özgü"
			],
			[
				tb("TEKME"),
				"Kılıcı tekmeyle kaldır",
				"silahsızken kılıcının yanında"
			],
			[
				tb("SHUR."),
				"Shuriken",
				"Tam düzen"
			],
			[
				tb("ATIL"),
				"Atılma",
				""
			],
			[
				tb("ATIL") + "›" + ATK,
				"Atılarak kesik",
				""
			],
			[
				tb("▲") + "›" + ATK,
				"Hava kesiği",
				""
			],
			[
				tb("▲") + "›" + HV,
				"Dalış",
				"havadayken ağır"
			],
			[
				GD,
				"Gard",
				"basılı tut"
			],
			[
				GD + "!",
				"Savuşturma",
				"darbe inmeden hemen önce dokun"
			],
			[
				ATK,
				"Düz karşılık",
				"gard/savuşturma sonrası"
			],
			[
				"İleri+" + ATK,
				"Süpürme",
				"karşılık · bacağa"
			],
			[
				"Geri+" + ATK,
				"Arkadan dönüş",
				"karşılık · yanından geç"
			],
			[
				HV,
				"Ağır karşılık",
				"karşılık · yere serer"
			],
			[
				"Seri",
				"Karşılıklı seri",
				"karşılığı karşıla, yeniden karşılık ver; kendi 3. karşılığın bitiriş"
			],
			[
				ATK + "!!",
				"Kılıç kilidi",
				"kilitte SALDIR’a hızlıca bas, rakibi it"
			]
		];
		STR.lessonsTouch = Object.assign(STR.lessonsTouch || {}, {
			walk: `${tb("◀")} ve ${tb("▶")} tuşlarını basılı tutarak ileri geri yürü.`,
			combo: `${ATK} düğmesine art arda üç kez dokun: üç kesiği zincirle ve kuklaya vur.`,
			heavy: `${HV} ile ağır kesik vur. Yavaştır ama yere serer.`,
			gbreak: `Kukla gard tutuyor. ${HV} ile vurarak denge çubuğunu doldur ve gardını kır (Tam düzendeki ${tb("TEKME")} daha da hızlı doldurur).`,
			block: `Kukla saldırıyor. ${GD} tuşunu basılı tut ve bir kesiği karşıla.`,
			parry: `Darbe inmeden hemen önce ${GD}’ye dokun. Mavi halka küçülünce tam zamanıdır.`,
			counter: `Gard ya da savuşturmanın hemen ardından ${ATK}: karşı kesik. İleri/geri + ${ATK} ya da ${HV} da dene.`,
			special: `Ki barın dolu. Parlayan ${KI} düğmesiyle {sp} kullan.`
		});
		if (STR.coach) merge(STR.coach, {
			attackT: (l) => `${l}’a dokun · art arda dokun: kombo`,
			guardT: (l, g) => `${g}’yi basılı tut: gard`,
			parryT: (l, g) => `Darbe inmeden hemen önce ${g}’ye dokun: savuştur`
		});
	}
	touchSource(ND.STR);
	function combatSource(STR) {
		if (!STR) return;
		const tb = (t, c) => `<i class="tb${c ? " " + c : ""}">${t}</i>`;
		STR.kaeshi = {
			head: "KAESHI-WAZA",
			strike: "VUR!",
			hits: "VURUŞ",
			names: {
				suriage: "SURIAGE",
				harai: "HARAI",
				nuki: "NUKI",
				uchiotoshi: "UCHIOTOSHI",
				sandan: "SANDAN-GIRI"
			},
			labels: {
				suriage: "Kılıcını sıyırıp yukarı at, çapraz in",
				harai: "Kılıcını yana savur, bacağa kes",
				nuki: "Darbeden sıyrıl, arkadan kes",
				uchiotoshi: "Kılıcını yere çarp, delip geç",
				sandan: "Üç kesikten oluşan karşılık"
			}
		};
		STR.trial = {
			title: "Kombo denemesi",
			btn: {
				prev: "Önceki kombo",
				next: "Sonraki kombo",
				retry: "Baştan",
				close: "Kapat"
			},
			names: {
				chain: "Temel seri",
				s1: "Seri bitirişi",
				s2: "Tekme serisi",
				launch: "Havaya fırlat",
				s3: "Uzun kombo"
			},
			desc: {
				chain: "{L} üç kez. Her vuruş değince bir sonrakine bas; seri adlı bir bitirişle biter.",
				s1: "İki kez {L}, sonra {H}: seri ağır bir kesikle biter.",
				s2: "{L}, tekme {K}, sonra {H}.",
				launch: "{D} + {H} ile havaya fırlat, o havadayken {L}, sonra {H}.",
				s3: "İki {L}, {D} + {H} ile fırlat, {L}, {H}: beş vuruş."
			},
			ready: (w) => `Başla: ${w}`,
			startWith: (w) => `Bu kombo ${w} ile başlar.`,
			early: "Çok erken: bir önceki vuruş değdiği anda bas.",
			late: "Çok geç: hareket bitmeden bas — vuruş değer değmez.",
			wrong: (got, want) => `Yanlış tuş: ${got} değil, ${want}.`,
			dir: (want) => `Yön eksik: ${want} — yönü tut, sonra bas.`,
			miss: "Iska: vuruş değmedi. Kuklaya yaklaş.",
			clear: "KOMBO TAMAM!",
			clearPop: "KOMBO TAMAM!",
			all: "Bu ninjanın tüm kombo denemeleri tamam!"
		};
		if (STR.coach) merge(STR.coach, {
			combo: (l) => `${l} ${l} ${l} art arda: üçlü kombo`,
			comboT: (l) => `${l}’a art arda üç kez dokun: kombo`,
			counter: (l) => `Gard ya da savuşturmadan sonra VUR! çıkınca ${l}: karşılık`,
			counterT: (l) => `Gard ya da savuşturmadan sonra VUR! çıkınca ${l}’a dokun`
		});
		const L = Array.isArray(STR.lessons) && STR.lessons.find((l) => l.id === "counter");
		if (L) L.d = "Gard ya da savuşturmadan sonra başının üstünde <b>VUR!</b> çıkar: altındaki çubuk bitmeden <kbd>F</kbd>’ye bas. İleri/geri + <kbd>F</kbd> ya da <kbd>G</kbd> başka karşılıklardır.";
		if (STR.lessonsTouch) STR.lessonsTouch.counter = `Gard ya da savuşturmadan sonra başının üstünde <b>VUR!</b> çıkar: çubuk bitmeden ${tb("SALDIR", "tb-light")}’a dokun. İleri/geri + ${tb("SALDIR", "tb-light")} ya da ${tb("AĞIR")} başka karşılıklardır.`;
	}
	combatSource(ND.STR);
	if (ND.STR) {
		ND.STR.tutor = {
			defend: "SAVUN!",
			attack: "SALDIR!",
			again: "TEKRAR!",
			pass: {
				freeze: (l, g) => `Zaman durur: ${g} ile savun, ${l} ile karşılık ver`,
				slow: (l, g) => `Ağır çekim: halka kapanırken ${g}, sonra ${l}`,
				real: (l, g) => `Tam hız: ${g} ile savun, ${l} ile karşılık ver, iki kez`
			},
			fail: {
				early: "Erken! Kılıç inmeden hemen önce gard al.",
				late: "Geç! Kılıç inmeden hemen önce gard al.",
				slow: "Geç kaldın! SALDIR! yazısı varken karşılık ver.",
				atk: "Önce savun, sonra saldır!",
				miss: "Bir daha deneyelim."
			},
			mastered: "USTALAŞTIN!",
			masteredSub: "Savun, karşılık ver, yeniden",
			warm: (l) => `Isın: ${l} ile üç kez vur`,
			nudge: (k) => `${k} tuşuna bas`,
			nudgeT: (k) => `${k} düğmesine dokun`,
			skip: "Geç ›",
			steps: {
				attack: (b) => `${b} ile vur`,
				guard: (b) => `Kılıcı ${b} ile karşıla`,
				counter: (b) => `${b} ile karşılık ver`,
				timing: (b, l) => `Sıra sende: halka kapanırken ${b}, sonra ${l}`
			},
			ok: {
				attack: "GÜZEL!",
				guard: "SAVUŞTURDUN!",
				counter: "KARŞILIK!",
				timing: "KUSURSUZ!"
			},
			ready: "HAZIRSIN!",
			readySub: "Şimdi düelloyu kazan"
		};
	}
	if (ND.STR) {
		ND.STR.onb = {
			selIntro: "Ninjanı seç: her birinin kendi yolculuğu var",
			more: "Ayrıntı"
		};
		ND.STR.tips = {
			head: "İPUCU",
			ki: (k) => `KI doldu! ${k}: özel hareket`,
			gbreak: (k, h) => `Rakip hep gardda: ${k} tekme ya da ${h} ağır kesik sarı çubuğunu doldurur, gardını kırar`,
			gbreakH: (h) => `Rakip hep gardda: ${h} ağır kesik sarı çubuğunu doldurur, gardını kırar`,
			posture: (g) => `Duruş çubuğun doluyor: geri çekil ya da ${g} ile savuştur`,
			dash: (a) => `Hızlıca iki kez ${a}: atıl`,
			shuriken: (t) => `${t}: shuriken fırlat`,
			heavy: (h) => `${h}: ağır kesik, yavaş ama sert`,
			lessons: (a, b) => `Tüm dersler: ${a} → ${b}`,
			controls: (a, b) => `Düğmeleri taşıyıp büyütebilirsin: ${a} → ${b}`
		};
	}
	if (ND.STR) ND.STR.vol = merge(ND.STR.vol || {}, {
		title: "Ses düzeyi",
		master: "Genel",
		music: "Müzik",
		sfx: "Efektler",
		sound: "Ses",
		pct: (n) => `%${n}`,
		muted: "Ses kapalı. Bir sürgüyü oynatınca yeniden açılır.",
		voice: "Seslendirme",
		uiSfx: "Menü sesleri",
		credit: "Seslendirme: ユーフルカ (youfulca.com) · 効果音ラボ · すぱらんど"
	});
	if (ND.STR) ND.STR.tedit = merge(ND.STR.tedit || {}, {
		mnote: {
			dpad: "Ayrı düğmeler: basılı tut yürü, iki kez dokun atıl. İki düğmenin arasına basınca ikisi birden (▶ + ▲ = ileri zıpla).",
			dtap: "Ayrı düğmeler: ◀ ▶ kısa dokunuşta tek küçük adım, basılı tut yürü, iki kez dokun atıl."
		},
		dtap: "Dokun: adım at",
		edit: "Kontrolleri düzenle",
		title: "Kontrolleri düzenle",
		hint: "Düğmeyi sürükleyip istediğin yere koy. Dokununca boyut, görünürlük ve gizleme çıkar.",
		rotate: "Dövüş düğmelerini yerleştirmek için ekranı yan çevir.",
		shapes: {
			phone: "Telefon",
			tablet: "Tablet",
			portrait: "Dik ekran"
		},
		screenNote: "Düzen bu ekran biçimi için kaydedilir: telefon ve tablet için ayrı ayrı.",
		save: "Kaydet",
		cancel: "Vazgeç",
		options: "Seçenekler",
		done: "Tamam",
		close: "Kapat",
		size: "Boyut",
		sizes: {
			s: "K",
			m: "O",
			l: "B",
			xl: "ÇB"
		},
		opacity: "Görünürlük",
		opacityAll: "Hepsinin görünürlüğü",
		hide: "Gizle",
		show: "Göster",
		hidden: "Gizli",
		snap: "Izgaraya hizala",
		presets: "Hazır düzen",
		pRight: "Sağ el",
		pLeft: "Sol el",
		reset: "Varsayılana dön",
		resetDone: "Varsayılan düzen geri geldi (kaydedince geçerli).",
		overlap: "Düğmeler üst üste binemez: en yakın boş yere kondu.",
		noRoom: "Orada yer yok: düğme eski yerine döndü.",
		saved: "Kontroller kaydedildi",
		throwName: "SHURIKEN",
		pauseName: "Duraklat",
		dirs: {
			dl: "◀ Sol",
			dr: "Sağ ▶",
			du: "▲ Zıpla",
			dd: "▼ Gard"
		}
	});
	if (ND.STR) ND.STR.gfx = merge(ND.STR.gfx || {}, {
		title: "Grafik",
		levels: {
			auto: "Otomatik",
			high: "Yüksek",
			medium: "Orta",
			low: "Düşük",
			custom: "Özel"
		},
		note: {
			auto: "Cihaza göre seçer; dövüş takılırsa kendiliğinden düşürür.",
			high: "Tüm ışık ve efektler. Güçlü cihazlar için.",
			medium: "Hafif ışıma, gölgesiz. Çoğu telefon için.",
			low: "En akıcı. Zayıf telefonlar için.",
			custom: "Kendi seçtiğin ayarlar (Gelişmiş)."
		},
		now: (lv) => `Şu an: ${lv}`,
		adv: {
			title: "Gelişmiş",
			note: "Birini değiştirince seçim \"Özel\" olur; bir hazır ayara basınca onun değerleri geri gelir.",
			hot: "en çok ısıtan",
			knob: {
				scale: "Çözünürlük",
				msaa: "Kenar yumuşatma",
				bloom: "Işık efektleri",
				shadows: "Gölge ve yansıma",
				effects: "Hava ve parçacıklar"
			},
			val: {
				off: "Kapalı",
				low: "Az",
				mid: "Orta",
				full: "Tam",
				simple: "Sade"
			}
		}
	});
	if (ND.STR) ND.STR.fps = merge(ND.STR.fps || {}, {
		title: "Kare hızı",
		show: "FPS göster",
		levels: { max: "Maks" },
		note: {
			60: "Akıcı ve serin. Çoğu telefon için en iyisi.",
			90: "Ekran destekliyorsa daha akıcı. Daha çok pil harcar.",
			120: "120 Hz ekranlarda en akıcı. Daha çok pil harcar.",
			max: "Ekranın izin verdiği kadar hızlı."
		}
	});
	if (ND.STR) ND.STR.lang = merge(ND.STR.lang || {}, {
		title: "Dil",
		change: "Dili değiştir",
		close: "Kapat"
	});
	if (ND.STR) ND.STR.loadTip = merge(ND.STR.loadTip || {}, {
		head: "ÖNEMLİ İPUCU",
		text: (g) => `Dövüşte ustalaşmak mı istiyorsun? HER saldırıdan sonra ${g} tuşuna bas.`
	});
	if (ND.STR) ND.STR.set = merge(ND.STR.set || {}, {
		title: "Ayarlar",
		close: "Kapat",
		tabs: {
			audio: "Ses",
			controls: "Kontroller",
			gfx: "Grafik",
			lang: "Dil"
		},
		touch: "Dokunmatik",
		keys: "Klavye",
		pad: "Gamepad",
		touchNote: "Dokunmatik kontrol ayarları, ekrana dokunduğunda burada çıkar."
	});
	if (ND.STR) ND.STR.thelp = merge(ND.STR.thelp || {}, {
		title: { dpad: "Yön tuşları" },
		dpad: {
			walk: "Basılı tut: yürü",
			step: "Kısa dokun: tek küçük adım",
			jump: "Dokun: zıpla",
			guard: "Basılı tut: gard. Darbeden hemen önce dokun: savuşturma",
			dash: "İki kez dokun: atılma",
			both: "İki düğmenin arasına bas: ikisi birden (▶ + ▲ = ileri zıpla)"
		},
		edit: (b) => `${b}: her düğmeyi istediğin yere sürükle, boyutunu ve görünürlüğünü ayarla. Ayarlar → Kontroller’de.`
	});
	if (ND.STR) {
		ND.STR.set = merge(ND.STR.set || {}, { tabs: { save: "Kayıt" } });
		ND.STR.acct = merge(ND.STR.acct || {}, {
			title: "İlerlemeni koru",
			cgOn: (n) => `PortalC hesabı: ${n}. Unvanların, Şampiyon renklerin, Dan’ın ve skorların hesabına kaydediliyor.`,
			cgWait: (n) => `PortalC hesabı: ${n}. Hesabına bağlanılıyor…`,
			cgFail: (n) => `PortalC hesabı: ${n}. Hesabına şu an ulaşılamıyor; yeni skorların şimdilik bu cihazda.`,
			cgSave: "İlerlemeni PortalC hesabına kaydet",
			cgSaveNote: "Giriş yapınca unvanların, Şampiyon renklerin ve skorların hesabına geçer; her cihazda seninle olur.",
			rcTitle: "Kurtarma kodu",
			rcNote: "Bu kodu bir yere yaz. Yeni bir cihazda buraya girersen unvanların, Şampiyon renklerin, Dan’ın ve skorların geri gelir.",
			rcShow: "Kodu göster",
			rcNew: "Yeni kod",
			rcNewDone: "Yeni kod hazır; eski kod artık çalışmıyor.",
			rcNeedName: "Kurtarma kodu için önce bir takma adla skor kaydet.",
			rcEnter: "Kurtarma kodunu gir",
			rcGo: "Geri yükle",
			rcDone: (n, c) => `Tekrar hoş geldin, ${n}! İlerlemen geri geldi. Yeni kurtarma kodun: ${c}`,
			err: {
				bad_code: "Bu kod tanınmadı. Karakterleri kontrol et.",
				rate: "Çok fazla deneme. Biraz sonra yeniden dene.",
				offline: "Sunucuya ulaşılamadı. Bağlantını kontrol et.",
				banned: "Bu kimlik kullanılamıyor.",
				error: "Bir şeyler ters gitti. Yeniden dene."
			},
			local: "Çevrimiçi kayıt burada yok; ilerlemen bu cihazda saklanıyor.",
			offline: "Şu an çevrimdışısın; ilerlemen bu cihazda saklanıyor.",
			loading: "Yükleniyor…"
		});
	}
	if (ND.STR) ND.STR.priv = merge(ND.STR.priv || {}, {
		notice: "Gölge Düellosu, çevrimiçi sıralamalar için takma adını ve skorlarını kaydeder.",
		policy: "Gizlilik Politikası",
		terms: "Koşullar",
		both: "Gizlilik Politikası ve Koşullar",
		ok: "Tamam",
		label: "Gizlilik bildirimi",
		noticeNet: "Çevrimiçi oyun: takma adın, skorların ve dereceli maçların oyunun sunucusunda kaydedilir.",
		more: "Ayrıntılar",
		details: "Oyunun sunucusunda kaydedilenler: bu cihazda oluşturulan rastgele bir kimlik, seçtiğin takma ad, skorların, seviyen ve dereceli sonuçların (hesap, e-posta ya da gerçek ad yok). Takma adlar ve skorlar sıralamalarda herkese açıktır. Dereceli maçta cihazın rakibininkine doğrudan ya da bir aktarma sunucusu üzerinden bağlanır; bu yüzden iki taraf birbirinin IP adresini görebilir. Sunucumuz bunun yalnızca geri çevrilemez biçimde karıştırılmış hâlini, maçları adil tutmak için saklar.",
		computer: "Rakip bulunamazsa bilgisayarın yönettiği bir rakiple eşleşebilirsin.",
		contact: "Verilerinin silinmesi için takma adınla birlikte {0} adresine yaz."
	});
	if (!ND.I18N_MANUAL) {
		const first = initialLang();
		let wrote = false;
		if (!hasCatalog(first) && LAZY.includes(first)) {
			try {
				const cur = document.currentScript;
				if (document.readyState === "loading" && cur && !cur.async && !cur.defer && typeof document.write === "function") {
					I.boot = () => {
						I.boot = null;
						I.init(first);
					};
					langFonts(first);
					document.write("<script src=\"" + fileOf(first) + "\"></scr" + "ipt><script>window.ND.i18n.boot&&window.ND.i18n.boot()</scr" + "ipt>");
					wrote = true;
				}
			} catch (e) {
				wrote = false;
			}
		}
		if (!wrote) I.init(first);
	}
})(window.ND);
