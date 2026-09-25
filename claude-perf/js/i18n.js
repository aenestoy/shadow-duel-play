// Shadow Duel — localisation layer (ND.i18n)
//
// The game was written in Turkish; Turkish stays the source language and every other language is an
// overlay applied at startup:
//   - text tables are translated IN PLACE: ND.STR, ND.TXT, ND.CHARS (title/desc/weapon), ND.ARENAS (name),
//     ND.SPECIALS (desc/tip), ND.AI_LEVELS (name). The originals are kept, so setLang('tr') restores them.
//   - the DOM is translated by a pass over text nodes and aria-label/title/placeholder (exact phrases),
//     whole-element HTML for mixed content, and data-i18n="key" elements; a MutationObserver keeps doing it
//     for text the game writes later (banners, end screen, toasts).
//   - canvas pop-ups: fx.text() (scene.js) calls t() itself.
//   - t(text) = exact phrase → regex pattern → unchanged. t('menu.arcade') also reads a ND.STR path.
// Language (first match wins):
//   1. ?lang=xx in the URL (testing; not saved)
//   2. the player's own choice, saved in ND.save settings as `lang` (older builds: localStorage nd.lang)
//   3. a portal that requires its own language: Yandex Games (SDK environment.i18n.lang, via ND.portal.requiredLanguage()
//      once the SDK answers; until then the device language below is the best guess there)
//   4. the device language: the first entry of navigator.languages (then navigator.language) that is one of the seven
//      supported languages, e.g. ['nl-NL', 'fr-FR', 'en'] → fr. CrazyGames and Poki start here too (their SDK locale is
//      not used: the browser already gives the same answer at once, without a late switch).
//   5. English, when none of the device languages is supported.
// Codes map to a supported language with langOf(): ru/be/kk/uk/uz → ru, pt-BR/pt-PT → pt, tr, es, de, fr, en; others: none.
// Catalogs register as ND.I18N_CATALOGS[lang] = (I, EN) => { ...fill EN... } (see i18n-en.js). A catalog other than
// English falls back to English for any key it lacks (never to the Turkish source).
// Load order: after every script that defines a table (arcade, roster2, banzuke…) and the catalogs, before game.js.
(function (ND) {
  'use strict';

  const SOURCE = 'tr';
  const DEFAULT = 'en';
  // order of the language picker
  const SUPPORTED = ['en', 'tr', 'es', 'pt', 'ru', 'de', 'fr'];
  // each language's name in its own language (picker, aria labels)
  const NAMES = { en: 'English', tr: 'Türkçe', es: 'Español', pt: 'Português', ru: 'Русский', de: 'Deutsch', fr: 'Français' };
  const LOCALES = { en: 'en-US', tr: 'tr-TR', es: 'es-ES', pt: 'pt-BR', ru: 'ru-RU', de: 'de-DE', fr: 'fr-FR' };
  const ALIAS = { be: 'ru', kk: 'ru', uk: 'ru', uz: 'ru' };
  const LS_KEY = 'nd.lang'; // older builds saved the choice here; read once and moved into ND.save settings
  const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  // HTML keys ignore the data-code marks input.js puts on <kbd> for keyboard-layout labels
  const normHtml = (h) => norm(String(h).replace(/ data-code="[^"]*"/g, ''));
  // 'pt-BR' / 'RU' / 'uk' → a supported language, or null
  const langOf = (code) => { const c = String(code || '').trim().slice(0, 2).toLowerCase(); const l = ALIAS[c] || c; return SUPPORTED.includes(l) ? l : null; };
  const pick = (code) => langOf(code) || DEFAULT;

  // ---------------------------------------------------------------- catalogs
  const catalogs = {};
  // fill(target, src): add what target lacks (plain objects recurse; strings, functions and arrays are taken whole)
  function fill(target, src) {
    if (!isObj(src) || !target) return target;
    for (const k of Object.keys(src)) {
      if (isObj(src[k])) { if (!isObj(target[k])) target[k] = {}; fill(target[k], src[k]); }
      else if (!Object.prototype.hasOwnProperty.call(target, k)) target[k] = src[k];
    }
    return target;
  }
  function catalog(lang) {
    if (catalogs[lang]) return catalogs[lang];
    const EN = catalogs[lang] = { STR: {}, TXT: {}, CHARS: {}, ARENAS: {}, SPECIALS: {}, AI_LEVELS: {}, NUMWORDS: [], PHRASES: {}, HTML: {}, PATTERNS: [] };
    const build = ND.I18N_CATALOGS && ND.I18N_CATALOGS[lang];
    if (typeof build === 'function') {
      try { build(I, EN); } catch (e) { console.warn('[i18n] catalog build failed:', lang, e); }
    }
    // anything this catalog lacks comes from English (a late key never shows the Turkish source)
    if (lang !== 'en' && lang !== SOURCE) {
      const B = catalog('en');
      for (const part of ['STR', 'TXT', 'CHARS', 'ARENAS', 'SPECIALS', 'AI_LEVELS', 'PHRASES', 'HTML']) fill(EN[part], B[part]);
      if (!EN.NUMWORDS.length) EN.NUMWORDS = B.NUMWORDS.slice();
      EN.PATTERNS = EN.PATTERNS.concat(B.PATTERNS);
    }
    // normalised lookups
    EN._phr = new Map(Object.keys(EN.PHRASES).map((k) => [norm(k), EN.PHRASES[k]]));
    EN._html = new Map(Object.keys(EN.HTML).map((k) => [normHtml(k), EN.HTML[k]]));
    // cheap pre-check before serialising an element: its text can't be longer than the longest key's text
    EN._htmlMax = Math.max(0, ...Object.keys(EN.HTML).map((k) => norm(k.replace(/<[^>]*>/g, '')).length)) + 8;
    return EN;
  }

  // merge(target, src): plain objects recurse; strings, numbers, functions and arrays replace
  function merge(target, src) {
    if (!isObj(src) || !target) return target;
    for (const k of Object.keys(src)) {
      if (isObj(src[k])) { if (!isObj(target[k])) target[k] = {}; merge(target[k], src[k]); }
      else target[k] = src[k];
    }
    return target;
  }

  // Same as merge, but records the values it overwrote so they can be put back
  function overlay(target, src, backup) {
    if (!isObj(src) || !target) return;
    for (const k of Object.keys(src)) {
      if (isObj(src[k]) && isObj(target[k])) {
        const kid = backup.kids.get(k) || { orig: new Map(), kids: new Map() };
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
    for (const [k, v] of backup.orig) { if (v === NONE) delete target[k]; else target[k] = v; }
    for (const [k, kid] of backup.kids) restore(target[k], kid);
    backup.orig.clear(); backup.kids.clear();
  }

  // ---------------------------------------------------------------- tables
  const backups = new Map(); // table object -> backup tree
  const bk = (obj) => { let b = backups.get(obj); if (!b) { b = { orig: new Map(), kids: new Map() }; backups.set(obj, b); } return b; };
  function applyTables(EN) {
    if (ND.STR) overlay(ND.STR, EN.STR, bk(ND.STR));
    if (ND.TXT) overlay(ND.TXT, EN.TXT, bk(ND.TXT));
    (ND.CHARS || []).forEach((c) => { const e = EN.CHARS[c.id]; if (e) overlay(c, e, bk(c)); });
    (ND.ARENAS || []).forEach((a) => { const e = EN.ARENAS[a.id]; if (typeof e === 'string') overlay(a, { name: e }, bk(a)); else if (isObj(e)) overlay(a, e, bk(a)); });
    if (ND.SPECIALS) for (const id in EN.SPECIALS) if (ND.SPECIALS[id]) overlay(ND.SPECIALS[id], EN.SPECIALS[id], bk(ND.SPECIALS[id]));
    if (ND.AI_LEVELS) for (const k in EN.AI_LEVELS) { const L = ND.AI_LEVELS[k]; if (L) overlay(L, { name: EN.AI_LEVELS[k] }, bk(L)); }
  }
  function restoreTables() { for (const [obj, b] of backups) restore(obj, b); }
  // Original (source-language) value of a table field, e.g. src(ND.CHARS[0], 'title')
  function src(obj, key) { const b = backups.get(obj); return b && b.orig.has(key) && b.orig.get(key) !== NONE ? b.orig.get(key) : obj[key]; }

  // ---------------------------------------------------------------- t()
  const cache = new Map();
  const strPath = (p) => (ND.STR && /^[A-Za-z]\w*(\.\w+)+$/.test(p) ? p.split('.').reduce((o, k) => (o != null ? o[k] : undefined), ND.STR) : undefined);
  function t(text, ...args) {
    if (text == null) return '';
    if (typeof text !== 'string') return String(text);
    const path = strPath(text);
    if (typeof path === 'string') return path;
    if (typeof path === 'function') { try { return String(path(...args)); } catch (e) { return text; } }
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
        if (re.test(key)) { re.lastIndex = 0; try { out = key.replace(re, rep); } catch (e) { out = undefined; } break; }
      }
    }
    if (cache.size > 4000) cache.clear();
    cache.set(key, out === undefined ? null : out);
    return out === undefined ? text : out;
  }

  // ---------------------------------------------------------------- formatting
  const loc = () => LOCALES[I.lang] || 'en-US';
  const nf = {};
  function num(n) {
    const v = Math.round(Number(n) || 0), l = loc();
    try { return (nf[l] || (nf[l] = new Intl.NumberFormat(l))).format(v); } catch (e) { return String(v); }
  }
  // decimal comma everywhere but English
  const dec = (x) => (I.lang === 'en' ? String(x) : String(x).replace('.', ','));
  const time = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const upper = (s) => { try { return String(s).toLocaleUpperCase(loc()); } catch (e) { return String(s).toUpperCase(); } };
  const lower = (s) => { try { return String(s).toLocaleLowerCase(loc()); } catch (e) { return String(s).toLowerCase(); } };

  // ---------------------------------------------------------------- DOM
  const nodeSrc = new WeakMap(); // text node -> { src, out }
  const elSrc = new WeakMap();   // element -> { html?, attrs: {} }
  const ATTRS = ['aria-label', 'title', 'placeholder'];
  const SKIP_TAGS = /^(SCRIPT|STYLE|CANVAS|svg|SVG|TEXTAREA|INPUT|SELECT|NOSCRIPT|TEMPLATE)$/;
  const skipEl = (el) => SKIP_TAGS.test(el.tagName) || el.getAttribute('translate') === 'no' || el.hasAttribute('data-i18n-skip');
  // Added nodes and text mutations may arrive deep inside a protected subtree.
  const skippedBranch = (node) => {
    for (let el = node.nodeType === 1 ? node : node.parentElement; el; el = el.parentElement) if (skipEl(el)) return true;
    return false;
  };

  function textNode(n) {
    const v = n.nodeValue;
    let rec = nodeSrc.get(n);
    if (!rec || (v !== rec.out && v !== rec.src)) { rec = { src: v, out: v }; nodeSrc.set(n, rec); } // new text written by the game
    let out = rec.src;
    if (I.lang !== SOURCE) {
      const k = norm(rec.src);
      if (k) { const tr = t(k); if (tr !== k) { const m = /^(\s*)[\s\S]*?(\s*)$/.exec(rec.src); out = m[1] + tr + m[2]; } }
    }
    rec.out = out;
    if (v !== out) n.nodeValue = out;
  }
  function element(el, EN) {
    let rec = elSrc.get(el);
    // explicit key
    const key = el.getAttribute('data-i18n');
    if (key) { const v = t(key); if (el.textContent !== v) el.textContent = v; return false; }
    // attributes
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      rec = rec || { attrs: {} }; elSrc.set(el, rec);
      const cur = el.getAttribute(a), prev = rec.attrs[a];
      if (!prev || (cur !== prev.out && cur !== prev.src)) rec.attrs[a] = { src: cur, out: cur };
      const r = rec.attrs[a], out = I.lang === SOURCE ? r.src : t(r.src);
      r.out = out; if (cur !== out) el.setAttribute(a, out);
    }
    // whole-element HTML (mixed text + tags)
    if (EN && EN._html.size && el.firstElementChild) {
      const cur = el.innerHTML;
      if (rec && rec.html && normHtml(cur) === normHtml(rec.html.out)) {
        // ours from an earlier pass: re-translate from the source (the language may have changed)
        const tr = EN._html.get(normHtml(rec.html.src));
        if (tr !== undefined && normHtml(tr) !== normHtml(cur)) { el.innerHTML = tr; rec.html.out = tr; }
        return true;
      }
      if ((el.textContent || '').length <= EN._htmlMax * 1.5) {
        const tr = EN._html.get(normHtml(cur));
        if (tr !== undefined) { rec = rec || { attrs: {} }; elSrc.set(el, rec); rec.html = { src: cur, out: tr }; el.innerHTML = tr; return true; }
      }
    } else if (!EN && rec && rec.html && normHtml(el.innerHTML) === normHtml(rec.html.out)) {
      el.innerHTML = rec.html.src; rec.html = null;
    }
    return false;
  }
  function apply(root) {
    root = root || document.body;
    if (!root || skippedBranch(root)) return;
    const EN = I.lang === SOURCE ? null : catalog(I.lang);
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    const walk = (el) => {
      if (el.nodeType === 1 && skipEl(el)) return;
      if (el.nodeType === 1 && element(el, EN)) { relabel(el); return; }
      for (let c = el.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) textNode(c);
        else if (c.nodeType === 1) walk(c);
      }
    };
    walk(root.nodeType === 9 ? root.documentElement : root);
    relabel(root);
    if (root === document.body || root === document || root === document.documentElement) {
      // the page's <title> is English (what crawlers and portal previews read); the Turkish name is the lookup key
      document.title = I.lang === SOURCE ? TITLE_TR : t(TITLE_TR);
    }
  }
  const TITLE_TR = 'Gölge Düellosu';
  const relabel = (root) => { try { if (ND.input && ND.input.relabel && root.querySelectorAll) ND.input.relabel(root); } catch (e) { /* yok */ } };

  let observer = null, busy = false;
  function watch(root) {
    root = root || document.getElementById('app') || document.body;
    if (!root || typeof MutationObserver === 'undefined' || observer) return;
    observer = new MutationObserver((list) => {
      if (busy) return;
      busy = true;
      try {
        for (const m of list) {
          if (m.type === 'characterData') { if (m.target.parentElement && !skippedBranch(m.target)) textNode(m.target); }
          else for (const n of m.addedNodes) {
            if (n.nodeType === 3) { if (n.parentElement && !skippedBranch(n)) textNode(n); }
            else if (n.nodeType === 1) apply(n);
          }
        }
      } catch (e) { console.warn('[i18n] observer', e); }
      busy = false;
    });
    observer.observe(root, { childList: true, characterData: true, subtree: true });
  }

  // ---------------------------------------------------------------- language
  const fns = [];
  let explicit = false, from = 'default';
  // The player's saved choice (ND.save settings `lang`; the older localStorage key is moved there once)
  function savedLang() {
    let s = null;
    try { s = ND.save && ND.save.settings ? ND.save.settings().lang : null; } catch (e) { /* storage blocked */ }
    if (s && langOf(s) === s) return s;
    try {
      const old = localStorage.getItem(LS_KEY);
      if (old && langOf(old) === old) { if (storeLang(old)) localStorage.removeItem(LS_KEY); return old; }
    } catch (e) { /* private tab */ }
    return null;
  }
  function storeLang(lang) {
    try {
      if (ND.save && ND.save.saveSettings) {
        const s = ND.save.settings() || {}; s.lang = lang; ND.save.saveSettings(s);
        return ND.save.settings().lang === lang;
      }
    } catch (e) { /* storage blocked: this session only */ }
    return false;
  }
  // The device's languages in the player's order (navigator.languages; older browsers only navigator.language)
  const browserLangs = () => {
    try {
      const list = navigator.languages && navigator.languages.length ? Array.from(navigator.languages) : [];
      if (navigator.language) list.push(navigator.language);
      return list;
    } catch (e) { return []; }
  };
  // First device language the game speaks, or null (→ English)
  const deviceLang = () => { for (const c of browserLangs()) { const l = langOf(c); if (l) return l; } return null; };
  // Portals that make the game follow their language (Yandex rule 2.14). Others: device language.
  const PORTAL_LANG = { yandex: true };
  function initialLang() {
    try { const q = ND.qs ? ND.qs.get('lang') : new URLSearchParams(location.search).get('lang'); if (q) { explicit = true; from = 'url'; return pick(q); } } catch (e) { /* no URL */ }
    const s = savedLang();
    if (s) { explicit = true; from = 'saved'; return s; }
    const dev = deviceLang();
    // Yandex: its SDK answers later; the device language is the closest guess until then
    if (PORTAL_LANG[ND.portalName]) { from = 'portal-guess'; return dev || DEFAULT; }
    if (dev) { from = 'device'; return dev; }
    from = 'default';
    return DEFAULT;
  }
  // Canvas text does not make the browser fetch a font: ask for the glyph subsets a language needs up front
  const FONT_PROBE = { ru: 'ДуэльЖЯ', tr: 'ğışİ', de: 'ßÄ', fr: 'œÉ', es: 'ñÁ', pt: 'ãõ' };
  function loadFonts(lang) {
    const p = FONT_PROBE[lang];
    if (!p || !document.fonts || !document.fonts.load) return;
    ['700 20px Oswald', '600 20px Oswald', '500 14px "Source Sans 3"', '600 14px "Source Sans 3"'].forEach((f) => { try { document.fonts.load(f, p).catch(() => {}); } catch (e) { /* old browser */ } });
  }
  // setLang(lang, { save: true }) = the player's choice (kept across visits). Returns the language in use.
  function setLang(lang, opts = {}) {
    lang = langOf(lang) || DEFAULT;
    if (opts.save) { explicit = true; from = 'saved'; storeLang(lang); }
    if (lang === I.lang && I.ready) return lang;
    restoreTables();
    I.lang = lang;
    cache.clear();
    if (lang !== SOURCE) applyTables(catalog(lang));
    document.documentElement.lang = lang;
    loadFonts(lang);
    if (I.ready) refreshDom();
    return lang;
  }
  // Re-fill everything already on screen: data-s texts (ND.STR.apply), touch/keyboard swaps, then the DOM pass
  function refreshDom() {
    try { if (ND.STR && typeof ND.STR.apply === 'function') ND.STR.apply(document); } catch (e) { /* yok */ }
    try { if (ND.touch && ND.touch.swapTexts) ND.touch.swapTexts(); } catch (e) { /* yok */ }
    apply(document.body);
    fns.forEach((fn) => { try { fn(I.lang); } catch (e) { console.warn('[i18n] listener', e); } });
  }

  // Every string table and DOM text still in Turkish while another language is on: for QA, run ND.i18n.audit()
  function audit() {
    const TRCH = /[çğıöşüÇĞİÖŞÜ]/, out = { lang: I.lang, str: [], chars: [], specials: [], arenas: [], dom: [] };
    if (I.lang === SOURCE) return out;
    const walk = (o, p) => {
      if (!o) return;
      for (const k of Object.keys(o)) {
        const v = o[k], q = p ? p + '.' + k : k;
        if (typeof v === 'string') { if (TRCH.test(v) || / (ve|ile|bir|için) /.test(v)) out.str.push(q); }
        else if (typeof v === 'function' && k !== 'apply' && k !== 'pickT') { try { const s = String(v(1, 2, 3, 4, 5)); if (TRCH.test(s)) out.str.push(q + '()'); } catch (e) { /* yok */ } }
        else if (Array.isArray(v) || isObj(v)) walk(v, q);
      }
    };
    walk(ND.STR, 'STR'); walk(ND.TXT, 'TXT');
    (ND.CHARS || []).forEach((c) => ['title', 'desc', 'weapon'].forEach((k) => { if (TRCH.test(c[k] || '')) out.chars.push(c.id + '.' + k); }));
    (ND.ARENAS || []).forEach((a) => { if (TRCH.test(a.name || '')) out.arenas.push(a.id); });
    if (ND.SPECIALS) for (const id in ND.SPECIALS) ['desc', 'tip'].forEach((k) => { if (TRCH.test(ND.SPECIALS[id][k] || '')) out.specials.push(id + '.' + k); });
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const pe = n.parentElement;
      if (!pe || skipEl(pe) || pe.closest('[hidden]') || !n.nodeValue.trim()) continue;
      if (TRCH.test(n.nodeValue)) out.dom.push(norm(n.nodeValue).slice(0, 80));
    }
    return out;
  }

  const I = ND.i18n = {
    lang: SOURCE, source: SOURCE, default: DEFAULT, supported: SUPPORTED, names: NAMES, ready: false,
    catalog, merge, t, num, dec, time, upper, lower, src, apply, watch, setLang, audit, langOf, locale: loc,
    get explicit() { return explicit; },
    // where the language came from: 'url' | 'saved' | 'portal' | 'portal-guess' | 'device' | 'default'
    get from() { return from; },
    onChange(fn) { fns.push(fn); },
    // Start: pick the language, translate tables + DOM, keep watching the DOM; follow a portal that requires its language
    init() {
      if (I.ready) return;
      setLang(initialLang());
      I.ready = true;
      refreshDom();
      watch();
      const P = ND.portal;
      if (P && P.ready) P.ready.then(() => {
        if (explicit) return;
        const req = P.requiredLanguage ? P.requiredLanguage() : null;
        if (!req) return;
        from = 'portal';
        const l = pick(req);
        if (l !== I.lang) setLang(l);
      });
    },
  };
  // ---------------------------------------------------------------- Turkish source additions: touch controls
  // The touch layout (js/touch.js: simple 5-button layout, ATTACK button, settings in pause) replaced the older
  // touch texts that arcade.js defines. They are written into ND.STR here, before any language overlay, so they are
  // the Turkish source and i18n-en.js translates them like every other table.
  function touchSource(STR) {
    if (!STR || !STR.touch) return;
    const tb = (t, c) => `<i class="tb${c ? ' ' + c : ''}">${t}</i>`;
    const ATK = tb('SALDIR', 'tb-light'), HV = tb('AĞIR'), GD = tb('GARD', 'tb-guard'), KI = tb('KI', 'ki');
    merge(STR.touch, {
      btn: { light: 'SALDIR' },
      lock: 'SALDIR’a hızlıca bas!',
      rotMenu: 'Ana menü',
      opt: {
        title: 'Dokunmatik kontroller',
        layout: 'Düzen', simple: 'Basit', full: 'Tam',
        size: 'Boyut', sizes: { s: 'Küçük', m: 'Orta', l: 'Büyük' },
        hand: 'Düğmeler', right: 'Sağda', left: 'Solda',
        assist: 'Kolay yardım', haptic: 'Titreşim',
        fullscreen: 'Tam ekran', exitFullscreen: 'Tam ekrandan çık',
        note: 'Basit: 5 büyük düğme. Tam: tekme ve shuriken de eklenir. Kolay yardım: SALDIR’ı basılı tutunca seri kendiliğinden sürer, GARD’a kısa dokunuş savuşturmaya yetecek kadar sürer, yön çubuğu kazayla zıplatmaz. Yalnız dokunmayı kolaylaştırır; kurallar ve puanlar herkes için aynı.',
        fullNote: 'TEKME ve SHURIKEN düğmeleri Tam düzende (Ayarlar → Kontroller).',
      },
      help: '<div class="th-grid">' +
        '<div><h3>Yön çubuğu</h3><dl>' +
        `<dt>${tb('◀ ▶')}</dt><dd>Boş yarıda başparmağını koy ve kaydır: yürü</dd>` +
        `<dt>${tb('▲')}</dt><dd>Yukarı it: zıpla</dd>` +
        `<dt>${tb('▼', 'tb-guard')}</dt><dd>Aşağı çek: gard</dd>` +
        `<dt>${tb('▶▶')}</dt><dd>Yana hızlıca iki kez it: atılma</dd>` +
        '</dl></div>' +
        '<div><h3>Düğmeler</h3><dl>' +
        `<dt>${ATK}</dt><dd>Kesik. Art arda dokun: kombo. İleri ya da geri tutarak dokun: başka teknik</dd>` +
        `<dt>${HV}</dt><dd>Ağır kesik. İleri + AĞIR: rakibi havaya fırlatır</dd>` +
        `<dt>${GD}</dt><dd>Basılı tut: gard. Darbeden hemen önce dokun: savuşturma</dd>` +
        `<dt>${tb('ATIL')}</dt><dd>Atılma (çubuğun yönüne, yoksa geriye)</dd>` +
        `<dt>${KI}</dt><dd>Ki tekniği: ki dolunca düğme parlar</dd>` +
        `<dt>${tb('TEKME')} ${tb('SHUR.')}</dt><dd>Tam düzende: tekme ve shuriken</dd>` +
        '</dl></div></div>',
      note: `Aynı anda birden çok düğmeye basabilirsin: gardı tutup saldır ya da parmağını ${GD}’dan ${ATK}’a kaydır. Ekranın üstündeki <b>II</b> duraklatır; düzen, boyut ve solak ayarı <b>Ayarlar</b>’dadır. Klavye ya da gamepad kullanınca kontroller kendiliğinden onlara geçer.`,
    });
    STR.movesTouch = [
      [tb('◀ ▶'), 'Yürü', 'yön çubuğu · hızlıca iki kez it: atılma'],
      [tb('▲'), 'Zıpla', 'çubuğu yukarı it'],
      [ATK + '×3', 'Üçlü kombo', 'art arda dokun; üçüncü vuruş iter'],
      [HV, 'Ağır kesik', 'yere serer'],
      [tb('TEKME'), 'Tekme', 'gardı zorlar, dengeyi doldurur · Tam düzen'],
      [tb('SHUR.'), 'Shuriken', 'Tam düzen'],
      [tb('ATIL'), 'Atılma', ''],
      [tb('ATIL') + '›' + ATK, 'Atılarak kesik', ''],
      [tb('▲') + '›' + ATK, 'Hava kesiği', ''],
      [tb('▲') + '›' + HV, 'Dalış', 'havadayken ağır'],
      [GD, 'Gard', 'basılı tut ya da çubuğu aşağı çek'],
      [GD + '!', 'Savuşturma', 'darbe inmeden hemen önce dokun'],
      [ATK, 'Düz karşılık', 'gard/savuşturma sonrası'],
      ['İleri+' + ATK, 'Süpürme', 'karşılık · bacağa'],
      ['Geri+' + ATK, 'Arkadan dönüş', 'karşılık · yanından geç'],
      [HV, 'Ağır karşılık', 'karşılık · yere serer'],
      ['Seri', 'Karşılıklı seri', 'karşılığı karşıla, yeniden karşılık ver; kendi 3. karşılığın bitiriş'],
      [ATK + '!!', 'Kılıç kilidi', 'kilitte SALDIR’a hızlıca bas, rakibi it'],
    ];
    STR.lessonsTouch = Object.assign(STR.lessonsTouch || {}, {
      walk: 'Ekranın boş yarısında başparmağını kaydır: yön çubuğunu sağa ve sola iterek yürü.',
      combo: `${ATK} düğmesine art arda üç kez dokun: üç kesiği zincirle ve kuklaya vur.`,
      heavy: `${HV} ile ağır kesik vur. Yavaştır ama yere serer.`,
      gbreak: `Kukla gard tutuyor. ${HV} ile vurarak denge çubuğunu doldur ve gardını kır (Tam düzendeki ${tb('TEKME')} daha da hızlı doldurur).`,
      block: `Kukla saldırıyor. ${GD} düğmesini basılı tut (ya da çubuğu aşağı çek) ve bir kesiği karşıla.`,
      parry: `Darbe inmeden hemen önce ${GD}’a dokun. Mavi halka küçülünce tam zamanıdır.`,
      counter: `Gard ya da savuşturmanın hemen ardından ${ATK}: karşı kesik. Çubuk ileri/geri + ${ATK} ya da ${HV} da dene.`,
      special: `Ki barın dolu. Parlayan ${KI} düğmesiyle {sp} kullan.`,
    });
    // first-fight coach (coach.js) on touch: its own sentences (the button chip is the verb's object)
    if (STR.coach) merge(STR.coach, {
      attackT: (l) => `${l}’a dokun · art arda dokun: kombo`,
      guardT: (l, g) => `${g}’ı basılı tut: gard`,
      parryT: (l, g) => `Darbe inmeden hemen önce ${g}’a dokun: savuştur`,
    });
  }
  touchSource(ND.STR);

  // ---------------------------------------------------------------- Turkish source additions: counter cinematic + combo trial
  // (combat feel pass: js/kaeshi-cine.js STR.kaeshi, js/combo-trial.js STR.trial, js/coach.js combo/counter tips,
  // the Counter lesson text). English in i18n-en.js, block "COUNTER CINEMATIC + COMBO TRIAL".
  function combatSource(STR) {
    if (!STR) return;
    const tb = (t, c) => `<i class="tb${c ? ' ' + c : ''}">${t}</i>`;
    STR.kaeshi = {
      head: 'KAESHI-WAZA', strike: 'VUR!', hits: 'VURUŞ',
      names: { suriage: 'SURIAGE', harai: 'HARAI', nuki: 'NUKI', uchiotoshi: 'UCHIOTOSHI', sandan: 'SANDAN-GIRI' },
      labels: {
        suriage: 'Kılıcını sıyırıp yukarı at, çapraz in',
        harai: 'Kılıcını yana savur, bacağa kes',
        nuki: 'Darbeden sıyrıl, arkadan kes',
        uchiotoshi: 'Kılıcını yere çarp, delip geç',
        sandan: "Üç kesikten oluşan karşılık",
      },
    };
    STR.trial = {
      title: 'Kombo denemesi',
      btn: { prev: 'Önceki kombo', next: 'Sonraki kombo', retry: 'Baştan', close: 'Kapat' },
      names: { chain: 'Temel seri', s1: 'Seri bitirişi', s2: 'Tekme serisi', launch: 'Havaya fırlat', s3: 'Uzun kombo' },
      desc: {
        chain: '{L} üç kez. Her vuruş değince bir sonrakine bas; seri adlı bir bitirişle biter.',
        s1: 'İki kez {L}, sonra {H}: seri ağır bir kesikle biter.',
        s2: '{L}, tekme {K}, sonra {H}.',
        launch: '{D} + {H} ile havaya fırlat, o havadayken {L}, sonra {H}.',
        s3: 'İki {L}, {D} + {H} ile fırlat, {L}, {H}: beş vuruş.',
      },
      ready: (w) => `Başla: ${w}`,
      startWith: (w) => `Bu kombo ${w} ile başlar.`,
      early: 'Çok erken: bir önceki vuruş değdiği anda bas.',
      late: 'Çok geç: hareket bitmeden bas — vuruş değer değmez.',
      wrong: (got, want) => `Yanlış tuş: ${got} değil, ${want}.`,
      dir: (want) => `Yön eksik: ${want} — yönü tut, sonra bas.`,
      miss: 'Iska: vuruş değmedi. Kuklaya yaklaş.',
      clear: 'KOMBO TAMAM!', clearPop: 'KOMBO TAMAM!',
      all: 'Bu ninjanın tüm kombo denemeleri tamam!',
    };
    if (STR.coach) merge(STR.coach, {
      combo: (l) => `${l} ${l} ${l} art arda: üçlü kombo`,
      comboT: (l) => `${l}’a art arda üç kez dokun: kombo`,
      counter: (l) => `Gard ya da savuşturmadan sonra VUR! çıkınca ${l}: karşılık`,
      counterT: (l) => `Gard ya da savuşturmadan sonra VUR! çıkınca ${l}’a dokun`,
    });
    const L = Array.isArray(STR.lessons) && STR.lessons.find((l) => l.id === 'counter');
    if (L) L.d = 'Gard ya da savuşturmadan sonra başının üstünde <b>VUR!</b> çıkar: altındaki çubuk bitmeden <kbd>F</kbd>’ye bas. İleri/geri + <kbd>F</kbd> ya da <kbd>G</kbd> başka karşılıklardır.';
    if (STR.lessonsTouch) STR.lessonsTouch.counter = `Gard ya da savuşturmadan sonra başının üstünde <b>VUR!</b> çıkar: çubuk bitmeden ${tb('SALDIR', 'tb-light')}’a dokun. Çubuk ileri/geri + ${tb('SALDIR', 'tb-light')} ya da ${tb('AĞIR')} başka karşılıklardır.`;
  }
  combatSource(ND.STR);

  // ---------------------------------------------------------------- Turkish source additions: volume sliders
  // js/volume.js (menu controls card + pause dialog). English in i18n-en.js, block "VOLUME".
  if (ND.STR) ND.STR.vol = merge(ND.STR.vol || {}, {
    title: 'Ses düzeyi', master: 'Genel', music: 'Müzik', sfx: 'Efektler', sound: 'Ses',
    pct: (n) => `%${n}`,
    muted: 'Ses kapalı. Bir sürgüyü oynatınca yeniden açılır.',
  });

  // ---------------------------------------------------------------- Turkish source additions: touch movement modes + layout editor
  // js/touch.js (movement row, "tap to step", the Customize button in the touch settings) and js/touch-editor.js
  // (the editor). English in i18n-en.js, block "TOUCH LAYOUT EDITOR". Button names come from STR.touch.btn.
  if (ND.STR) ND.STR.tedit = merge(ND.STR.tedit || {}, {
    move: 'Hareket',
    moves: { float: 'Çubuk', fixed: 'Sabit çubuk', dpad: 'Yön tuşları' },
    mnote: {
      float: 'Çubuk, başparmağının değdiği yerde belirir.',
      fixed: 'Çubuk, koyduğun yerde durur; ortasından it.',
      dpad: 'Ayrı düğmeler: basılı tut yürü, iki kez dokun atıl. İki düğmenin arasına basınca ikisi birden (▶ + ▲ = ileri zıpla).',
      dtap: 'Ayrı düğmeler: ◀ ▶ kısa dokunuşta tek küçük adım, basılı tut yürü, iki kez dokun atıl.',
    },
    dtap: 'Dokun: adım at',
    edit: 'Kontrolleri düzenle',
    title: 'Kontrolleri düzenle',
    hint: 'Düğmeyi sürükleyip istediğin yere koy. Dokununca boyut, görünürlük ve gizleme çıkar.',
    rotate: 'Dövüş düğmelerini yerleştirmek için ekranı yan çevir.',
    shapes: { phone: 'Telefon', tablet: 'Tablet', portrait: 'Dik ekran' },
    screenNote: 'Düzen bu ekran biçimi için kaydedilir: telefon ve tablet için ayrı ayrı.',
    save: 'Kaydet', cancel: 'Vazgeç', options: 'Seçenekler', done: 'Tamam', close: 'Kapat',
    size: 'Boyut', sizes: { s: 'K', m: 'O', l: 'B', xl: 'ÇB' },
    opacity: 'Görünürlük', opacityAll: 'Hepsinin görünürlüğü',
    hide: 'Gizle', show: 'Göster', hidden: 'Gizli',
    snap: 'Izgaraya hizala',
    presets: 'Hazır düzen', pRight: 'Sağ el', pLeft: 'Sol el', pSplit: 'Gard solda',
    reset: 'Varsayılana dön', resetDone: 'Varsayılan düzen geri geldi (kaydedince geçerli).',
    overlap: 'Düğmeler üst üste binemez: en yakın boş yere kondu.',
    noRoom: 'Orada yer yok: düğme eski yerine döndü.',
    saved: 'Kontroller kaydedildi',
    throwName: 'SHURIKEN',
    pauseName: 'Duraklat',
    dirs: { dl: '◀ Sol', dr: 'Sağ ▶', du: '▲ Zıpla', dd: '▼ Gard' },
  });

  // ---------------------------------------------------------------- Turkish source additions: graphics quality
  // js/gfx.js choices (ND.gfx.levels: auto / high / medium / low) for the Graphics setting. English in i18n-en.js,
  // block "GRAPHICS QUALITY". note.* = one short line under the choice.
  if (ND.STR) ND.STR.gfx = merge(ND.STR.gfx || {}, {
    title: 'Grafik',
    levels: { auto: 'Otomatik', high: 'Yüksek', medium: 'Orta', low: 'Düşük' },
    note: {
      auto: 'Cihaza göre seçer; dövüş takılırsa kendiliğinden düşürür.',
      high: 'Tüm ışık ve efektler. Güçlü cihazlar için.',
      medium: 'Hafif ışıma, gölgesiz. Çoğu telefon için.',
      low: 'En akıcı. Zayıf telefonlar için.',
    },
    now: (lv) => `Şu an: ${lv}`,
  });

  // ---------------------------------------------------------------- Turkish source additions: frame rate
  // Settings → Graphics, the Frame rate row (js/gfx.js makePacer targets 60 / 90 / 120 / max; game.js). English in
  // i18n-en.js, block "FRAME RATE". The numbers are shown as they are; only "Max" and the lines under the row are text.
  if (ND.STR) ND.STR.fps = merge(ND.STR.fps || {}, {
    title: 'Kare hızı',
    // the switch under the row: a small frame-rate readout at the bottom of the screen (game.js fpsMeter)
    show: 'FPS göster',
    levels: { max: 'Maks' },
    note: {
      60: 'Akıcı ve serin. Çoğu telefon için en iyisi.',
      90: 'Ekran destekliyorsa daha akıcı. Daha çok pil harcar.',
      120: '120 Hz ekranlarda en akıcı. Daha çok pil harcar.',
      max: 'Ekranın izin verdiği kadar hızlı.',
    },
  });

  // ---------------------------------------------------------------- Turkish source additions: language picker
  // js/lang-ui.js (globe on the first screen / menu title, "Language" row in the controls card and the pause dialog).
  // Other languages: block "LANGUAGE PICKER" in each js/i18n-*.js. Language names themselves come from ND.i18n.names.
  if (ND.STR) ND.STR.lang = merge(ND.STR.lang || {}, { title: 'Dil', change: 'Dili değiştir', close: 'Kapat' });

  // ---------------------------------------------------------------- Turkish source additions: settings screen
  // js/settings.js (the ⚙ Settings button on the first screen, the main menu and the pause dialog, and the Settings
  // panel with its tabs). Other languages: block "SETTINGS SCREEN" in each js/i18n-*.js.
  if (ND.STR) ND.STR.set = merge(ND.STR.set || {}, {
    title: 'Ayarlar', close: 'Kapat',
    tabs: { audio: 'Ses', controls: 'Kontroller', gfx: 'Grafik', lang: 'Dil' },
    touch: 'Dokunmatik', keys: 'Klavye', pad: 'Gamepad',
    touchNote: 'Dokunmatik kontrol ayarları, ekrana dokunduğunda burada çıkar.',
  });

  // ---------------------------------------------------------------- Turkish source additions: touch help per movement mode
  // game.js touchHelp(): the first column of the menu's touch help (STR.touch.help) follows the chosen movement mode
  // (js/touch.js prefs.move: float / fixed / dpad, dpad + dtap = tap to step), and a line points to the layout editor.
  // Button chips (◀ ▶, ▲, ▼…) are added by game.js. English in i18n-en.js, block "TOUCH HELP PER MOVEMENT MODE".
  if (ND.STR) ND.STR.thelp = merge(ND.STR.thelp || {}, {
    title: { float: 'Yön çubuğu', fixed: 'Sabit çubuk', dpad: 'Yön tuşları' },
    float: { walk: 'Başparmağını boş yarıya koy ve kaydır: yürü', jump: 'Yukarı it: zıpla', guard: 'Aşağı çek: gard', dash: 'Yana hızlıca iki kez it: atılma' },
    fixed: { walk: 'Çubuğu ortasından tut, yana it: yürü', jump: 'Yukarı it: zıpla', guard: 'Aşağı çek: gard', dash: 'Yana hızlıca iki kez it: atılma' },
    dpad: {
      walk: 'Basılı tut: yürü', step: 'Kısa dokun: tek küçük adım', jump: 'Dokun: zıpla', guard: 'Basılı tut: gard',
      dash: 'İki kez dokun: atılma', both: 'İki düğmenin arasına bas: ikisi birden (▶ + ▲ = ileri zıpla)',
    },
    // b = the editor's button name (STR.tedit.edit), drawn as a chip
    edit: (b) => `${b}: her düğmeyi istediğin yere sürükle, boyutunu ve görünürlüğünü ayarla. Ayarlar → Kontroller’de.`,
  });

  // Scripts sit at the end of <body>, so the DOM is there: start now unless a page wants to call init() itself
  if (!ND.I18N_MANUAL) I.init();
})(window.ND);
