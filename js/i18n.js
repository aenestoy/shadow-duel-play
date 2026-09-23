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
// Language: ?lang=xx > saved choice > portal SDK language (when it answers) > browser. 'tr' → Turkish, else English.
// Catalogs register as ND.I18N_CATALOGS[lang] = (I, EN) => { ...fill EN... } (see i18n-en.js).
// Load order: after every script that defines a table (arcade, roster2, banzuke…), before game.js.
(function (ND) {
  'use strict';

  const SOURCE = 'tr';
  const SUPPORTED = ['tr', 'en'];
  const LS_KEY = 'nd.lang';
  const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  // HTML keys ignore the data-code marks input.js puts on <kbd> for keyboard-layout labels
  const normHtml = (h) => norm(String(h).replace(/ data-code="[^"]*"/g, ''));
  const pick = (code) => (String(code || '').slice(0, 2).toLowerCase() === 'tr' ? 'tr' : 'en');

  // ---------------------------------------------------------------- catalogs
  const catalogs = {};
  function catalog(lang) {
    if (catalogs[lang]) return catalogs[lang];
    const EN = catalogs[lang] = { STR: {}, TXT: {}, CHARS: {}, ARENAS: {}, SPECIALS: {}, AI_LEVELS: {}, NUMWORDS: [], PHRASES: {}, HTML: {}, PATTERNS: [] };
    const build = ND.I18N_CATALOGS && ND.I18N_CATALOGS[lang];
    if (typeof build === 'function') {
      try { build(I, EN); } catch (e) { console.warn('[i18n] catalog build failed:', lang, e); }
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
  const loc = () => (I.lang === 'tr' ? 'tr-TR' : 'en-US');
  const nf = {};
  function num(n) {
    const v = Math.round(Number(n) || 0), l = loc();
    try { return (nf[l] || (nf[l] = new Intl.NumberFormat(l))).format(v); } catch (e) { return String(v); }
  }
  const dec = (x) => (I.lang === 'tr' ? String(x).replace('.', ',') : String(x));
  const time = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const upper = (s) => { try { return String(s).toLocaleUpperCase(loc()); } catch (e) { return String(s).toUpperCase(); } };
  const lower = (s) => { try { return String(s).toLocaleLowerCase(loc()); } catch (e) { return String(s).toLowerCase(); } };

  // ---------------------------------------------------------------- DOM
  const nodeSrc = new WeakMap(); // text node -> { src, out }
  const elSrc = new WeakMap();   // element -> { html?, attrs: {} }
  const ATTRS = ['aria-label', 'title', 'placeholder'];
  const SKIP_TAGS = /^(SCRIPT|STYLE|CANVAS|svg|SVG|TEXTAREA|INPUT|SELECT|NOSCRIPT|TEMPLATE)$/;
  const skipEl = (el) => SKIP_TAGS.test(el.tagName) || el.getAttribute('translate') === 'no' || el.hasAttribute('data-i18n-skip');

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
    if (skipEl(el)) return false;
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
    if (EN && EN._html.size && el.firstElementChild && (el.textContent || '').length <= EN._htmlMax * 1.5) {
      const cur = el.innerHTML;
      rec = rec || { attrs: {} }; elSrc.set(el, rec);
      if (rec.html && normHtml(cur) === normHtml(rec.html.out)) return true; // already ours
      const tr = EN._html.get(normHtml(cur));
      if (tr !== undefined) { rec.html = { src: cur, out: tr }; el.innerHTML = tr; return true; }
    } else if (!EN && rec && rec.html && normHtml(el.innerHTML) === normHtml(rec.html.out)) {
      el.innerHTML = rec.html.src; rec.html = null;
    }
    return false;
  }
  function apply(root) {
    root = root || document.body;
    if (!root) return;
    const EN = I.lang === SOURCE ? null : catalog(I.lang);
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    const walk = (el) => {
      if (el.nodeType === 1 && element(el, EN)) { relabel(el); return; }
      for (let c = el.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) textNode(c);
        else if (c.nodeType === 1) walk(c);
      }
    };
    walk(root.nodeType === 9 ? root.documentElement : root);
    relabel(root);
    if (root === document.body || root === document || root === document.documentElement) {
      if (!titleSrc) titleSrc = document.title;
      document.title = I.lang === SOURCE ? titleSrc : t(titleSrc);
    }
  }
  let titleSrc = '';
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
          if (m.type === 'characterData') { if (m.target.parentElement && !skipEl(m.target.parentElement)) textNode(m.target); }
          else for (const n of m.addedNodes) {
            if (n.nodeType === 3) { if (n.parentElement && !skipEl(n.parentElement)) textNode(n); }
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
  let explicit = false;
  function initialLang() {
    try { const q = ND.qs ? ND.qs.get('lang') : new URLSearchParams(location.search).get('lang'); if (q) { explicit = true; return pick(q); } } catch (e) { /* yok */ }
    try { const s = localStorage.getItem(LS_KEY); if (s && SUPPORTED.includes(s)) { explicit = true; return s; } } catch (e) { /* gizli sekme */ }
    try { return pick((navigator.languages && navigator.languages[0]) || navigator.language); } catch (e) { return 'en'; }
  }
  function setLang(lang, opts = {}) {
    lang = SUPPORTED.includes(lang) ? lang : pick(lang);
    if (opts.save) { explicit = true; try { localStorage.setItem(LS_KEY, lang); } catch (e) { /* yok */ } }
    if (lang === I.lang && I.ready) return lang;
    restoreTables();
    I.lang = lang;
    cache.clear();
    if (lang !== SOURCE) applyTables(catalog(lang));
    document.documentElement.lang = lang;
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
    lang: SOURCE, source: SOURCE, supported: SUPPORTED, ready: false,
    catalog, merge, t, num, dec, time, upper, lower, src, apply, watch, setLang, audit,
    get explicit() { return explicit; },
    onChange(fn) { fns.push(fn); },
    // Start: pick the language, translate tables + DOM, keep watching the DOM; follow the portal language later
    init() {
      if (I.ready) return;
      setLang(initialLang());
      I.ready = true;
      refreshDom();
      watch();
      if (ND.portal && ND.portal.ready) ND.portal.ready.then(() => {
        if (explicit || !ND.portal.sdk) return;
        const l = pick(ND.portal.language());
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
        fullNote: 'TEKME ve SHURIKEN düğmeleri Tam düzende (Duraklat → Dokunmatik kontroller).',
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
      note: `Aynı anda birden çok düğmeye basabilirsin: gardı tutup saldır ya da parmağını ${GD}’dan ${ATK}’a kaydır. Ekranın üstündeki <b>II</b> duraklatır; düzen, boyut ve solak ayarı oradadır. Klavye ya da gamepad kullanınca kontroller kendiliğinden onlara geçer.`,
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
      ['Seri', 'Karşılıklı seri', 'karşılığı karşıla, yeniden karşılık ver; 5. karşılık bitiriş'],
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

  // Scripts sit at the end of <body>, so the DOM is there: start now unless a page wants to call init() itself
  if (!ND.I18N_MANUAL) I.init();
})(window.ND);
