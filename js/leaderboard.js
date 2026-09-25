// Gölge Düellosu — sıralama tablosu (ND.leaderboard) + sıralama ekranı ve bitiş paneli (ND.lbUI)
//
// Bağdaştırıcılar (hepsi aynı arayüz; bkz. ADAPTER ARAYÜZÜ):
//   'supabase' — kendi sunucumuz (Supabase REST/PostgREST, düz fetch; dış SDK yok). js/config.js dolu ve platform ağa
//                izin veriyorsa (ND.platform.allowNetwork) kullanılır. Tüm yazmalar sunucu fonksiyonlarıyla (RPC) yapılır,
//                sunucu her şeyi yeniden denetler (supabase/setup.sql).
//   'claude'   — claude.ai Artifact olarak yayınlanınca: `db` (paylaşılan belge deposu) + `user` (izleyici kimliği)
//   'local'    — yedek: ND.save üzerinden cihazda tablo başına ilk 10 (+ her ninjanın en iyisi), takma ad bir kez sorulur
//   'mock'     — test: sahte Claude çalışma zamanı → 'claude' kodunu sürer. Supabase testi: js/sb-mock.js + useSupabaseMock()
//
// Seçim sırası (init): window.claude varsa 'claude' → değilse ND.platform.allowNetwork && config doluysa 'supabase'
//   (sunucuya ulaşılamazsa 'local' + durum 'offline'; salon açılınca yeniden denenir) → değilse 'local'.
// Skorlar HER ZAMAN önce yerel tabloya yazılır; çevrimiçi gönderim başarısızsa (ağ yok, hız sınırı, takma ad yok)
// giden kutusuna (outbox) girer ve sonra yeniden denenir.
//
// Panolar: 'arcade', 'cpu_efsane' (klasik) ve 'weekly@2026-09' (turnuva; dönem anahtarı panonun parçası).
// Turnuva dönemi bir UTC takvim ayıdır. Eski adlar kaldı ('weekly', week, LB.week()), ama değerler aydır:
//   id YYYYMM (202609), anahtar 'YYYY-MM' ('2026-09'). Sunucu (setup.sql nd_week_id) aynı numarayı kullanır.
//
// Claude DB şeması: koleksiyon `lb_<pano>` (lb_arcade, lb_cpu_efsane), turnuva `lb_w<ayNo>` (lb_w202609),
//   haftalık tüm zamanlar `lb_wall`, Dan `lb_dan`; belge kimliği = izleyicinin opak kimliği (user.id()).
//   { uid, score, char, time, date, v, gv, dan, wk, by: { <ninja>: { s, t, d } }, cs_<ninja>: s }
//   Kullanıcı başına pano başına tek belge; yalnız en iyi skor (genel + ninja başına) tutulur. Ad ASLA saklanmaz:
//   görüntülerken user.profiles(ids) ile çözülür. Paylaşılan veri güvenilmezdir: her alan doğrulanır/sınırlanır.
(function (ND) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const S = () => (ND.STR && ND.STR.lb) || {};
  const fmtNum = (n) => { if (ND.i18n) return ND.i18n.num(n); try { return Math.round(n).toLocaleString('tr-TR'); } catch (e) { return String(Math.round(n)); } };
  const fmtTime = (s) => { if (s == null) return '–'; s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const fmtDate = (d) => { if (!d) return '–'; try { return new Date(d).toLocaleDateString(!ND.i18n ? 'tr-TR' : ND.i18n.lang === 'en' ? 'en-GB' : ND.i18n.locale(), { day: '2-digit', month: '2-digit', year: '2-digit' }); } catch (e) { return '–'; } };
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  // ================================================================ PLATFORM
  // allowNetwork = false → hiçbir dış sunucuya istek yapılmaz (Poki / YouTube Playables kuralı; claude.ai sandbox'ı zaten engeller).
  // Test: adrese ?net=0 / ?net=1 eklenebilir. Portal katmanı ND.platform'u önceden tanımlarsa onun değerleri geçerlidir.
  function detectPlatform() {
    let host = '', anc = [], ref = '', q = '';
    try { host = String(location.hostname || '').toLowerCase(); q = String(location.search || ''); } catch (e) { /* yok */ }
    try { anc = Array.from(location.ancestorOrigins || []); } catch (e) { /* yok */ }
    try { ref = String(document.referrer || ''); } catch (e) { /* yok */ }
    const all = [host].concat(anc, [ref]).join(' ').toLowerCase();
    let name = 'web', allow = true;
    const claudeRt = typeof window !== 'undefined' && window.claude && typeof window.claude.use === 'function';
    if (claudeRt || /claudeusercontent\.com|(^|[./\s])claude\.(ai|site)\b/.test(all)) { name = 'claude'; allow = false; }
    else if (/(^|[./\s])poki(-gdn)?\.(com|io|dev|net)\b|pokiplayground|poki-cdn/.test(all)) { name = 'poki'; allow = false; }
    else if (/youtube\.com|youtube-nocookie\.com|ytimg\.com|youtubeplayables|playables\.usercontent\.goog|usercontent\.goog/.test(all)) { name = 'youtube'; allow = false; }
    else if (/crazygames\./.test(all)) name = 'crazygames';
    else if (/yandex\.|yandexgames|games\.s3\.yandex/.test(all)) name = 'yandex';
    else if (!host || host === 'localhost' || /^127\.|^192\.168\.|^10\./.test(host)) name = 'dev';
    const m = /[?&]net=([01])\b/.exec(q);
    if (m) allow = m[1] === '1';
    return { name, allowNetwork: allow };
  }
  ND.platform = Object.assign(detectPlatform(), ND.platform || {});

  const GAME_V = '1.0.0', DOC_V = 1; // = package.json version (scripts/version-check.mjs)
  const TOP_N = 20, HALL_N = 50, LOCAL_KEEP = 10, MAX_SUBS = 8, SETTLE_MS = 11000, OUT_MAX = 12;
  // Pano tanımları; max = makul üst sınır (üstündeki değerler kurcalanmış sayılır ve gösterilmez)
  const BOARDS = {
    arcade: { max: 1000000, k: '道' },
    cpu_efsane: { max: 200000, k: '鬼' },
    weekly: { max: 600000, k: '月', weekly: true }, // aylık turnuva (ad eski sürümden)
    wall: { max: 600000, k: '歴', hidden: true }, // (iç) haftalık turnuvanın tüm zamanlar en iyisi
  };
  const BOARD_IDS = ['arcade', 'cpu_efsane']; // klasik sıralama ekranının sekmeleri
  const WK_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
  // 'arcade' → { base:'arcade', id:0 } · 'weekly@2026-09' → { base:'weekly', wk:'2026-09', id:202609 }
  function parseBoard(b) {
    if (typeof b !== 'string' || b.length > 40) return null;
    const i = b.indexOf('@');
    if (i < 0) return own(BOARDS, b) && !BOARDS[b].weekly && !BOARDS[b].hidden ? { base: b, wk: null, id: 0 } : null;
    const m = WK_RE.exec(b.slice(i + 1));
    if (b.slice(0, i) !== 'weekly' || !m) return null;
    return { base: 'weekly', wk: b.slice(i + 1), id: +m[1] * 100 + +m[2] };
  }
  const weekKeyOf = (id) => Math.floor(id / 100) + '-' + String(id % 100).padStart(2, '0');

  // ---------------------------------------------------------------- turnuva dönemi: UTC takvim ayı (ayın 1'i 00:00'da başlar)
  // { year, week (= ay 1–12, eski ad), month, id: YYYYMM, key: 'YYYY-MM', start, end } (ms)
  const DAY = 864e5;
  function period(ms) {
    const d = new Date(ms), year = d.getUTCFullYear(), month = d.getUTCMonth() + 1;
    return { year, week: month, month, id: year * 100 + month, key: year + '-' + String(month).padStart(2, '0'),
      start: Date.UTC(year, month - 1, 1), end: Date.UTC(year, month, 1) };
  }
  const prevPeriod = (p) => period(p.start - 1);

  // ---------------------------------------------------------------- doğrulama
  const EPOCH = Date.UTC(2025, 0, 1);
  const isBoard = (b) => !!parseBoard(b);
  const bMax = (b) => { const p = parseBoard(b) || (b === 'wall' ? { base: 'wall' } : null); return p ? BOARDS[p.base].max : 0; };
  const isChar = (c) => typeof c === 'string' && c.length <= 24 && ND.CHARS.some((x) => x.id === c);
  const int = (v, lo, hi) => (typeof v === 'number' && isFinite(v) && v >= lo && v <= hi ? Math.round(v) : null);
  const cleanScore = (b, v) => int(v, 0, bMax(b));
  const cleanTime = (v) => int(v, 0, 86400);
  const cleanDateV = (v) => int(v, EPOCH, Date.now() + DAY);
  const cleanDan = (v) => int(v, 0, 20) || 0;
  // Display names allow CrazyGames' 20 characters; manually entered nicknames remain limited to 16.
  const cleanName = (s) => Array.from(String(s == null ? '' : s)
    .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩<>&"'`\\]/g, '')
    .replace(/\s+/g, ' ').trim()).slice(0, 20).join('').trim();
  // Maç özeti (sunucu makullük denetimi için): yalnız bilinen alanlar
  const SUM_NUM = ['dur', 'fights', 'won', 'rounds', 'rw', 'hits', 'lvl'];
  function cleanSum(s) {
    if (!s || typeof s !== 'object') return null;
    const o = { v: GAME_V };
    for (const k of SUM_NUM) { const v = s[k]; o[k] = typeof v === 'number' && isFinite(v) && v >= 0 ? (k === 'dur' ? Math.round(v * 10) / 10 : Math.round(v)) : 0; }
    if (typeof s.mh === 'string' && /^[0-9a-f]{0,16}$/.test(s.mh)) o.mh = s.mh;
    if (typeof s.opp === 'string' && /^[a-z][a-z0-9_]{1,15}$/.test(s.opp)) o.opp = s.opp;
    if (typeof s.mode === 'string' && /^[a-z]{1,12}$/.test(s.mode)) o.mode = s.mode;
    return o;
  }
  const cleanEntry = (b, e) => {
    if (!isBoard(b) || !e) return null;
    const score = cleanScore(b, e.score);
    if (score == null) return null;
    return { score, char: isChar(e.char) ? e.char : null, time: cleanTime(e.time), date: cleanDateV(e.date) || Date.now(), sum: cleanSum(e.sum), dan: cleanDan(e.dan) };
  };

  // ---------------------------------------------------------------- takma ad kuralları (sunucudakiyle aynı: setup.sql nd_check_nick)
  // 3–16 karakter; harf, rakam, boşluk, _ . - ; en az bir harf; küfür listesi (EN + TR). Sunucu yine de son sözü söyler.
  const FOLD_FROM = 'ıİIşŞçÇğĞöÖüÜâÂîÎûÛäÄëËïÏéÉèÈêÊáÁíÍóÓúÚñÑ0134578@$!|', FOLD_TO = 'iiissccggoouuaaiiuuaaeeiieeeeeeaaiioouunnoieastbasii';
  const FOLD = {}; Array.from(FOLD_FROM).forEach((c, i) => { FOLD[c] = FOLD_TO[i]; });
  const fold = (s) => Array.from(s, (c) => FOLD[c] || c).join('').toLowerCase();
  const BAD_SUB = ('fuck shit bitch cunt nigger nigga faggot whore slut rapist pussy dickhead asshole bastard retard hitler nazi porn penis ' +
    'vagina wanker twat motherfucker cocksucker orospu oruspu siktir sikis sikik sikim sikerim sikeyim amcik amina yarrak yarak pezevenk ' +
    'kahpe gavat yavsak surtuk kaltak ibne gotveren dalyarak serefsiz').split(' ');
  const BAD_WORD = 'fuk ass fag dick cum sex kkk cock tits pust sik am amk aq got pic oc anan anani sg'.split(' ');
  const L_CH = 'A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛûÄäËëÏïÉéÈèÊêÁáÍíÓóÚúÑñ';
  const NICK_RE = new RegExp('^[' + L_CH + '0-9 _.\\-]+$'), LETTER_RE = new RegExp('[' + L_CH + ']');
  function checkName(s) {
    const v = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    const n = Array.from(v).length;
    if (n < 3 || n > 16) return { ok: false, code: 'nick_length', name: v };
    if (!NICK_RE.test(v) || !LETTER_RE.test(v)) return { ok: false, code: 'nick_chars', name: v };
    if (badName(v)) return { ok: false, code: 'nick_bad', name: v };
    return { ok: true, name: v };
  }
  // the nickname word filter alone (also used to show other players' names: js/banzuke.js champCard)
  function badName(v) {
    const f = fold(v), l = f.replace(/[^a-z]/g, ''), c = l.replace(/(.)\1+/g, '$1'), toks = f.split(/[^a-z]+/);
    for (const w of BAD_SUB) if (l.includes(w) || (!/(.)\1/.test(w) && c.includes(w))) return true;
    for (const w of BAD_WORD) if (l === w || toks.includes(w)) return true;
    return false;
  }
  // Rütbe kısaltması (tablolarda adın yanında): 1..10 → "10級"…"1級", 11..20 → "1段"…"10段"
  const danShort = (d) => (!(d > 0) ? '' : d <= 10 ? (11 - d) + '級' : (d - 10) + '段');

  // Paylaşılan belgeyi (başka izleyicilerin yazdığı) güvenli satıra çevir; geçersizse null
  function cleanDoc(b, d, id) {
    if (!d || typeof d !== 'object' || typeof id !== 'string' || id.length > 200) return null;
    const score = cleanScore(b, d.score);
    if (score == null) return null;
    const by = {};
    if (d.by && typeof d.by === 'object') {
      for (const c of Object.keys(d.by)) {
        if (!isChar(c)) continue;
        const e = d.by[c]; if (!e || typeof e !== 'object') continue;
        const s = cleanScore(b, e.s);
        if (s != null) by[c] = { s, t: cleanTime(e.t), d: cleanDateV(e.d), w: typeof e.w === 'string' && WK_RE.test(e.w) ? e.w : null };
      }
    }
    const char = isChar(d.char) ? d.char : null;
    if (char && !by[char]) by[char] = { s: score, t: cleanTime(d.time), d: cleanDateV(d.date), w: null };
    const wk = typeof d.wk === 'string' && WK_RE.test(d.wk) ? d.wk : null;
    return { uid: id, score, char, time: cleanTime(d.time), date: cleanDateV(d.date), dan: cleanDan(d.dan), wk, by };
  }
  // Belge satırını (genel ya da ninja süzgeçli) tablo satırına çevir
  function docRow(r, char) {
    if (!char) return { key: r.uid, uid: r.uid, score: r.score, char: r.char, time: r.time, date: r.date, dan: r.dan, wk: r.wk };
    const e = r.by[char]; if (!e) return null;
    return { key: r.uid, uid: r.uid, score: e.s, char, time: e.t, date: e.d, dan: r.dan, wk: e.w || null };
  }
  const byScore = (a, b) => b.score - a.score || (a.date || 0) - (b.date || 0);

  // ---------------------------------------------------------------- olaylar
  const fns = new Set();
  let emitQ = false;
  function emit() {
    if (emitQ) return; emitQ = true;
    Promise.resolve().then(() => { emitQ = false; fns.forEach((fn) => { try { fn(LB); } catch (e) { /* dinleyici hatası oyunu durdurmasın */ } }); });
  }

  // ================================================================ ADAPTER ARAYÜZÜ
  // {
  //   name: 'local' | 'claude' | 'supabase' | …, online: bool, needsName: bool (takma ad gerekir mi), readonly: bool,
  //   submit(board, entry) → Promise<{ ok, stored: 'online'|'local', improved, best, rank, reason?, retry?, code? }>
  //   watch(board, char)   → Promise<rows>   (sorgu başına tek abonelik; render'dan çağrılmaz)
  //   peek(board, char)    → { rows, loading, error }   (eşzamanlı, render için)
  //   mine(board, char)    → satır | null     (bu izleyicinin en iyisi)
  //   rank(board, char, score) → Promise<number|null>
  //   names(ids)           → Promise<{ [id]: string }>   (yalnız çevrimiçi; ad render anında çözülür)
  //   hall(kind, arg)      → Promise<…>  (Şampiyonlar Salonu: 'week' | 'alltime' | 'archive' | 'chars' | 'char' | 'dan')
  //   setDan(r, sum)       → Promise<{ ok, dan?, pending?, reason?, retry? }>   (isteğe bağlı)
  //   register(name)       → Promise<{ ok, name }>   (isteğe bağlı: sunucuda takma ad)
  //   now()                → sunucu saati (ms)       (isteğe bağlı)
  // }
  // Satır: { key, uid?, pid?, name?, dan, char, score, time, date, week?, me, rank? }
  // "me" bilgisi (salon): { place, score, total, tenth, gap }

  // ---------------------------------------------------------------- YEREL
  const memLb = { name: '', boards: {}, last: {}, out: [] };
  const localData = () => { try { const d = ND.save && ND.save.lb; if (d) return d; } catch (e) { /* yok */ } return memLb; };
  const localCommit = () => { try { if (ND.save && ND.save.commit) ND.save.commit(); } catch (e) { /* yok */ } };
  const myDan = () => { try { return ND.banzuke && ND.banzuke.dan ? cleanDan(ND.banzuke.dan.rank()) : 0; } catch (e) { return 0; } };

  // ---------------------------------------------------------------- unvanlar ve Şampiyon renkleri (aylık turnuva)
  // Biten her ayın ilk 3'ü kalıcı unvan alır; sunucu söyler (nd_titles, nd_me), istemci yalnız gösterir.
  //   unvan: { place: 1 | 2 | 3 (en iyi derece), wins (kaç kez 1.), podiums (kaç kez ilk 3) }
  //   place 1 → "Aylık Şampiyon", 2–3 → "Finalist". Birinci olunan ninjanın Şampiyon renkleri açılır (champ).
  // Kendi unvanım + champ, ND.save.lb içinde saklanır (lb.title, lb.champ): çevrimdışıyken de görünür. Yalnız
  // sunucu cevabı yazar; kostüm yalnız görünüştür, tablolara gönderilmez.
  const cleanTitle = (bp, w, pd) => {
    const place = int(bp, 1, 3); if (!place) return null;
    return { place, wins: int(w, 0, 9999) || 0, podiums: Math.max(int(pd, 0, 9999) || 0, 1) };
  };
  const cleanChamp = (a) => (Array.isArray(a) ? [...new Set(a.filter(isChar))].slice(0, 40) : []);
  const TT = () => (ND.STR && ND.STR.bz && ND.STR.bz.ttl) || {};
  // "Aylık Şampiyon ×2" / "Finalist" (sayı yalnız birden çoksa)
  function titleLabel(t) {
    if (!t || !t.place) return '';
    const B = TT(), n = t.place === 1 ? t.wins : t.podiums;
    return (t.place === 1 ? B.champ || 'Champion' : B.finalist || 'Finalist') + (n > 1 ? ' ×' + n : '');
  }
  function titleEl(t, tag) {
    if (!t || !t.place || typeof document === 'undefined') return null;
    const e = document.createElement(tag || 'b');
    e.className = 'ttl ' + (t.place === 1 ? 'ttl-c' : 'ttl-f');
    e.textContent = titleLabel(t);
    return e;
  }
  function localList(b) {
    const L = localData();
    const raw = Array.isArray(L.boards[b]) ? L.boards[b] : [];
    const list = [];
    for (const r of raw) {
      if (!r || typeof r !== 'object') continue;
      const s = cleanScore(b, r.s); if (s == null) continue;
      list.push({ n: cleanName(r.n), s, c: isChar(r.c) ? r.c : null, t: cleanTime(r.t), d: cleanDateV(r.d) || 0, v: DOC_V, r: cleanDan(r.r) });
    }
    list.sort((x, y) => y.s - x.s || x.d - y.d);
    return list;
  }
  // İlk LOCAL_KEEP + her ninjanın en iyisi (ninja süzgeci için)
  function prune(list) {
    const keep = list.slice(0, LOCAL_KEEP), seen = new Set(keep.map((r) => r.c));
    for (const r of list.slice(LOCAL_KEEP)) if (r.c && !seen.has(r.c)) { keep.push(r); seen.add(r.c); }
    return keep;
  }
  const weeklyKeys = () => Object.keys(localData().boards || {}).filter((k) => { const p = parseBoard(k); return p && p.base === 'weekly'; });
  const localRow = (b, r, i, myName) => ({ key: 'l' + b + i, uid: null, name: r.n || null, dan: r.r || 0, score: r.s, char: r.c, time: r.t, date: r.d,
    // a local board only holds this device's scores: a row saved before a nickname was set is ours too
    week: (parseBoard(b) || {}).id || 0, me: (!!myName && r.n === myName) || !r.n });
  const standing = (rows, meRow) => {
    if (!meRow) return null;
    const place = rows.indexOf(meRow) + 1, tenth = rows[9] ? rows[9].score : null;
    return { place, score: meRow.score, total: rows.length, tenth, gap: place <= 10 ? 0 : Math.max(0, tenth - meRow.score + 1) };
  };
  const localAdapter = {
    name: 'local', online: false, needsName: true, readonly: false,
    async submit(b, e) {
      const L = localData(), list = localList(b);
      const prev = list.length ? list[0].s : 0;
      const row = { n: LB.getName(), s: e.score, c: e.char, t: e.time, d: e.date, v: DOC_V, r: e.dan || 0 };
      list.push(row);
      list.sort((x, y) => y.s - x.s || x.d - y.d);
      const rank = list.indexOf(row) + 1;
      L.boards[b] = prune(list);
      if (!L.last || typeof L.last !== 'object') L.last = {};
      L.last[b] = { s: e.score, d: e.date, r: rank, c: e.char };
      localCommit(); emit();
      return { ok: true, stored: 'local', improved: e.score > prev, best: Math.max(prev, e.score), rank };
    },
    async watch(b, c) { return this.peek(b, c).rows; },
    peek(b, c) {
      const L = localData(), last = (L.last && L.last[b]) || null;
      const rows = localList(b).filter((r) => !c || r.c === c).slice(0, TOP_N).map((r, i) => ({
        key: 'l' + i, uid: null, name: r.n || null, dan: r.r || 0, score: r.s, char: r.c, time: r.t, date: r.d, me: !!last && r.d === last.d && r.s === last.s,
      }));
      return { rows, loading: false, error: null };
    },
    mine(b, c) {
      const L = localData(), last = L.last && L.last[b];
      if (!last || (c && last.c !== c)) return null;
      const list = localList(b).filter((r) => !c || r.c === c);
      const i = list.findIndex((r) => r.d === last.d && r.s === last.s);
      return { key: 'me', uid: null, name: i >= 0 ? list[i].n || null : LB.getName() || null, dan: myDan(), score: last.s, char: last.c, time: null, date: last.d, me: true, rank: i >= 0 ? i + 1 : last.r || null };
    },
    async rank(b, c, s) { return localList(b).filter((r) => (!c || r.c === c) && r.s > s).length + 1; },
    async names() { return {}; },
    // Salon: yalnız bu cihazın kayıtları (aynı cihazda farklı takma adlar ayrı satır)
    async hall(kind, arg) {
      const myName = LB.getName();
      const allWeekly = () => {
        const out = [];
        for (const k of weeklyKeys()) localList(k).forEach((r, i) => out.push(localRow(k, r, i, myName)));
        return out.sort(byScore);
      };
      const bestPer = (rows, keyFn) => { const seen = new Set(), out = []; for (const r of rows) { const k = keyFn(r); if (seen.has(k)) continue; seen.add(k); out.push(r); } return out; };
      if (kind === 'week') {
        const b = 'weekly@' + arg;
        const rows = bestPer(localList(b).map((r, i) => localRow(b, r, i, myName)), (r) => r.name || '?').slice(0, HALL_N);
        return { rows, me: standing(rows, rows.find((r) => r.me)) };
      }
      if (kind === 'alltime') { const rows = bestPer(allWeekly(), (r) => r.name || '?').slice(0, HALL_N); return { rows, me: standing(rows, rows.find((r) => r.me)) }; }
      if (kind === 'char') { const rows = bestPer(allWeekly().filter((r) => r.char === arg), (r) => r.name || '?').slice(0, TOP_N); return { rows, me: standing(rows, rows.find((r) => r.me)) }; }
      if (kind === 'chars') return { rows: bestPer(allWeekly().filter((r) => r.char), (r) => r.char) };
      if (kind === 'archive') {
        const cur = LB.week().id;
        const weeks = weeklyKeys().map((k) => parseBoard(k)).filter((p) => p.id < cur).sort((a, b) => b.id - a.id).slice(0, 12)
          .map((p) => { const b = 'weekly@' + p.wk; return { id: p.id, key: p.wk, rows: bestPer(localList(b).map((r, i) => localRow(b, r, i, myName)), (r) => r.name || '?').slice(0, 10) }; })
          .filter((w) => w.rows.length);
        return { weeks };
      }
      if (kind === 'dan') {
        const best = (() => { try { return ND.banzuke ? cleanDan(ND.banzuke.dan.best()) : 0; } catch (e) { return 0; } })();
        const rows = best > 0 ? [{ key: 'me', uid: null, name: myName || null, dan: myDan(), score: best, char: null, time: null, date: null, me: true }] : [];
        return { rows, me: rows.length ? { place: 1, score: best, total: 1, tenth: null, gap: 0 } : null };
      }
      return { rows: [] };
    },
  };

  // ---------------------------------------------------------------- CLAUDE (Artifact: db + user)
  function claudeAdapter(db, user) {
    const A = {
      name: 'claude', online: true, needsName: false, readonly: false, uid: null, canWrite: null,
      subs: new Map(), my: {}, mySubs: [], rankCache: new Map(), q: Promise.resolve(),
    };
    const colName = (b) => { const p = parseBoard(b); return p && p.base === 'weekly' ? 'lb_w' + p.id : 'lb_' + b; };
    const col = (b) => db.collection(colName(b));
    const myRef = (b) => { try { return A.uid ? col(b).doc(A.uid) : null; } catch (e) { return null; } }; // kimlik yol dilbilgisine uymazsa yazılamaz
    const code = (e) => (e && typeof e.code === 'string' ? e.code : 'unavailable');
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    // 'unavailable' → kısa rastgele beklemeyle bir kez yeniden dene (belgeye göre)
    const retry = async (fn) => { try { return await fn(); } catch (e) { if (code(e) !== 'unavailable') throw e; await sleep(400 + Math.random() * 900); return fn(); } };

    A.init = async () => {
      try { A.uid = user ? await user.id() : null; } catch (e) { A.uid = null; }
      try { A.canWrite = user ? await user.can('data.write') : null; } catch (e) { A.canWrite = null; }
      if (typeof A.uid !== 'string' || !A.uid) A.uid = null;
      A.readonly = !A.uid || A.canWrite === false || !myRef(BOARD_IDS[0]);
      // kendi belgelerime tek abonelik (klasik pano başına)
      if (A.uid) for (const b of BOARD_IDS) {
        const ref = myRef(b); if (!ref) continue;
        A.mySubs.push(ref.onSnapshot((snap) => {
          A.my[b] = snap && snap.exists ? cleanDoc(b, snap.data(), A.uid) : null;
          A.rankCache.clear(); emit();
        }, (e) => { if (code(e) === 'revoked') LB._fail('revoked'); }));
      }
    };
    A.close = () => { A.mySubs.forEach((u) => { try { u(); } catch (e) { /* yok */ } }); A.mySubs = []; A.subs.forEach((s) => { try { s.unsub && s.unsub(); } catch (e) { /* yok */ } }); A.subs.clear(); };
    // Haftalık panoda kendi belgemi bir kez oku (abonelik yok: 64 sınırını korumak için)
    const loadMine = (b) => {
      if (!A.uid || A.my[b] !== undefined || BOARD_IDS.includes(b)) return;
      A.my[b] = null;
      const ref = myRef(b); if (!ref) return;
      retry(() => ref.get()).then((snap) => { A.my[b] = snap && snap.exists ? cleanDoc(b, snap.data(), A.uid) : null; A.rankCache.clear(); emit(); }).catch(() => {});
    };

    // Sorgu başına TEK abonelik (sekme/süzgeç değişince açılır; render yalnız peek okur)
    A.watch = (b, c) => {
      loadMine(b);
      const key = b + '|' + (c || '');
      let s = A.subs.get(key);
      if (s && !s.dead) { A.subs.delete(key); A.subs.set(key, s); return s.ready; } // LRU tazele
      s = { rows: [], loading: true, error: null, dead: false, unsub: null };
      s.ready = new Promise((res) => { s.res = res; });
      A.subs.set(key, s);
      // abonelik sınırı (64/görünüm): en eski kullanılmayanı kapat
      while (A.subs.size > MAX_SUBS) {
        const [k0, s0] = A.subs.entries().next().value;
        A.subs.delete(k0); try { s0.unsub && s0.unsub(); } catch (e) { /* yok */ }
      }
      const field = c ? 'cs_' + c : 'score';
      try {
        s.unsub = col(b).orderBy(field, 'desc').limit(TOP_N + 10).onSnapshot((snap) => {
          const rows = [];
          for (const d of snap.docs) {
            const r = cleanDoc(b, d.data(), d.id); if (!r) continue;
            const row = docRow(r, c); if (row) rows.push(row);
          }
          rows.sort(byScore);
          s.rows = rows.slice(0, TOP_N); s.loading = false; s.error = null;
          A.rankCache.clear();
          s.res(s.rows); emit();
        }, (e) => {
          s.loading = false; s.error = code(e); s.dead = true; s.res(s.rows);
          if (s.error === 'revoked') LB._fail('revoked');
          emit();
        });
      } catch (e) { s.loading = false; s.error = code(e); s.dead = true; s.res([]); }
      return s.ready;
    };
    A.peek = (b, c) => {
      const s = A.subs.get(b + '|' + (c || ''));
      if (!s) return { rows: [], loading: true, error: null };
      return { rows: s.rows.map((r) => Object.assign({}, r, { me: !!A.uid && r.uid === A.uid })), loading: s.loading, error: s.error };
    };
    A.mine = (b, c) => {
      const r = A.my[b]; if (!r) return null;
      const row = docRow(r, c); return row ? Object.assign(row, { me: true }) : null;
    };
    // Sıra = benden yüksek skorlu belge sayısı + 1 (önbellekli; yalnız ilk 20 dışındaysam sorulur)
    A.rank = async (b, c, score) => {
      const key = b + '|' + (c || '') + '|' + score;
      if (A.rankCache.has(key)) return A.rankCache.get(key);
      const p = retry(() => col(b).where(c ? 'cs_' + c : 'score', '>', score).limit(1000).get())
        .then((snap) => {
          let n = 0;
          for (const d of snap.docs) { const r = cleanDoc(b, d.data(), d.id); const row = r && docRow(r, c); if (row && row.score > score) n++; }
          return n + 1;
        }).catch(() => null);
      A.rankCache.set(key, p);
      return p;
    };
    A.names = async (ids) => {
      const out = {};
      if (!user || !ids.length) return out;
      try {
        const ps = await user.profiles(ids);
        for (const id of ids) out[id] = (ps && ps[id] && typeof ps[id].name === 'string' && ps[id].name) || '';
      } catch (e) { /* profiles asla reddetmez; yine de */ }
      return out;
    };
    // Belgeyi baştan kur (yalnız bilinen alanlar; gelen veri temizlenmiş)
    function buildDoc(cur, e, wk) {
      const by = Object.assign({}, cur ? cur.by : {});
      let improved = false, charImproved = false;
      let best = cur ? { score: cur.score, char: cur.char, time: cur.time, date: cur.date, wk: cur.wk } : null;
      if (!best || e.score > best.score) { best = { score: e.score, char: e.char, time: e.time, date: e.date, wk: wk || null }; improved = true; }
      if (e.char && (!by[e.char] || e.score > by[e.char].s)) { by[e.char] = { s: e.score, t: e.time, d: e.date, w: wk || null }; charImproved = true; }
      const doc = { uid: A.uid, score: best.score, char: best.char, time: best.time, date: best.date, dan: e.dan || 0, v: DOC_V, gv: GAME_V, by: {} };
      if (best.wk) doc.wk = best.wk;
      for (const c of Object.keys(by)) { doc.by[c] = { s: by[c].s, t: by[c].t, d: by[c].d }; if (by[c].w) doc.by[c].w = by[c].w; doc['cs_' + c] = by[c].s; }
      return { doc, changed: improved || charImproved || (cur && cur.dan !== (e.dan || 0)), improved, best: best.score };
    }
    const failCode = (err) => {
      const c = code(err);
      // iyi biçimli bir set() invalid_argument ile reddedildiyse: bu ziyaret boyunca salt okunur
      if (c === 'invalid_argument' || c === 'transform_error' || c === 'not_granted') { A.readonly = true; emit(); return { ok: false, reason: 'rejected' }; }
      if (c === 'quota_exceeded') return { ok: false, reason: 'quota' };
      if (c === 'revoked' || c === 'capability_disabled' || c === 'capability_removed') { LB._fail('revoked'); return { ok: false, reason: 'rejected' }; }
      return { ok: false, reason: 'error' };
    };
    const queue = (run) => { const p = A.q.then(run, run); A.q = p.catch(() => {}); return p; };
    A.submit = (b, e) => queue(async () => {
      // aynı belgeye tek seferde bir yazma: sırala
      if (A.readonly) return { ok: false, reason: 'readonly' };
      const ref = myRef(b); if (!ref) { A.readonly = true; return { ok: false, reason: 'readonly' }; }
      const pb = parseBoard(b);
      try {
        const snap = await retry(() => ref.get());
        const cur = snap && snap.exists ? cleanDoc(b, snap.data(), A.uid) : null;
        const nx = buildDoc(cur, e, pb && pb.wk);
        if (nx.changed) await retry(() => ref.set(nx.doc));
        A.my[b] = cleanDoc(b, nx.doc, A.uid); A.rankCache.clear();
        // haftalık → tüm zamanlar belgesi (lb_wall) de güncellenir
        if (pb && pb.base === 'weekly') {
          const wref = db.collection('lb_wall').doc(A.uid);
          const ws = await retry(() => wref.get());
          const wcur = ws && ws.exists ? cleanDoc('wall', ws.data(), A.uid) : null;
          const wx = buildDoc(wcur, e, pb.wk);
          if (wx.changed) await retry(() => wref.set(wx.doc));
        }
        emit();
        return { ok: true, stored: 'online', improved: nx.improved, best: nx.best };
      } catch (err) { return failCode(err); }
    });
    A.setDan = (r, sum) => queue(async () => {
      if (A.readonly || !A.uid) return { ok: false, reason: 'readonly' };
      try {
        const ref = db.collection('lb_dan').doc(A.uid);
        const snap = await retry(() => ref.get());
        const d = snap && snap.exists ? snap.data() : null;
        const best = Math.max(cleanDan(d && d.best), cleanDan(r));
        await retry(() => ref.set({ uid: A.uid, dan: cleanDan(r), best, date: Date.now(), v: DOC_V, lvl: sum && typeof sum.lvl === 'number' ? sum.lvl : 0 }));
        return { ok: true, dan: cleanDan(r), best, pending: false };
      } catch (err) { return failCode(err); }
    });
    // Salon sorguları: tek seferlik get() (abonelik değil) + ad çözümü
    const named = async (rows) => {
      const ids = [...new Set(rows.map((r) => r.uid).filter(Boolean))];
      const m = ids.length ? await A.names(ids) : {};
      rows.forEach((r) => { r.name = cleanName(m[r.uid]) || null; r.me = !!A.uid && r.uid === A.uid; });
      return rows;
    };
    const getRows = async (colPath, field, lim, b, char) => {
      const snap = await retry(() => db.collection(colPath).orderBy(field, 'desc').limit(lim).get());
      const rows = [];
      for (const d of snap.docs) { const r = cleanDoc(b, d.data(), d.id); const row = r && docRow(r, char); if (row) rows.push(row); }
      return rows.sort(byScore);
    };
    const meOf = (rows) => {
      const i = rows.findIndex((r) => r.me); if (i < 0) return null;
      const tenth = rows[9] ? rows[9].score : null;
      return { place: i + 1, score: rows[i].score, total: null, tenth, gap: i < 10 ? 0 : Math.max(0, tenth - rows[i].score + 1) };
    };
    A.hall = async (kind, arg) => {
      if (kind === 'week') {
        const b = 'weekly@' + arg;
        const rows = await named(await getRows(colName(b), 'score', HALL_N, b, null));
        let me = meOf(rows);
        if (!me && A.uid) {
          const snap = await retry(() => myRef(b).get()).catch(() => null);
          const mine = snap && snap.exists ? cleanDoc(b, snap.data(), A.uid) : null;
          if (mine) { const place = await A.rank(b, null, mine.score); const tenth = rows[9] ? rows[9].score : null; me = { place, score: mine.score, total: null, tenth, gap: place && place > 10 && tenth != null ? Math.max(0, tenth - mine.score + 1) : 0 }; }
        }
        return { rows, me };
      }
      if (kind === 'alltime') { const rows = await named(await getRows('lb_wall', 'score', HALL_N, 'wall', null)); return { rows, me: meOf(rows) }; }
      if (kind === 'char') { const rows = await named(await getRows('lb_wall', 'cs_' + arg, TOP_N, 'wall', arg)); return { rows, me: meOf(rows) }; }
      if (kind === 'chars') {
        const ids = ND.CHARS.map((c) => c.id);
        const lists = await Promise.all(ids.map((c) => getRows('lb_wall', 'cs_' + c, 1, 'wall', c).catch(() => [])));
        return { rows: await named(lists.map((l) => l[0]).filter(Boolean)) };
      }
      if (kind === 'archive') {
        const ids = [];
        for (let p = prevPeriod(LB.week()), k = 0; k < 8; k++, p = prevPeriod(p)) ids.push(p.id);
        const lists = await Promise.all(ids.map((id) => getRows('lb_w' + id, 'score', 10, 'weekly@' + weekKeyOf(id), null).catch(() => [])));
        const weeks = [];
        for (let k = 0; k < ids.length; k++) if (lists[k].length) weeks.push({ id: ids[k], key: weekKeyOf(ids[k]), rows: await named(lists[k]) });
        return { weeks };
      }
      if (kind === 'dan') {
        const snap = await retry(() => db.collection('lb_dan').orderBy('best', 'desc').limit(HALL_N).get());
        const rows = [];
        for (const d of snap.docs) {
          const v = d.data(); if (!v || typeof v !== 'object') continue;
          const best = int(v.best, 1, 20); if (best == null || typeof d.id !== 'string' || d.id.length > 200) continue;
          rows.push({ key: d.id, uid: d.id, dan: cleanDan(v.dan), score: best, char: null, time: null, date: cleanDateV(v.date) });
        }
        rows.sort((a, b) => b.score - a.score || (a.date || 0) - (b.date || 0));
        await named(rows);
        return { rows, me: meOf(rows) };
      }
      return { rows: [] };
    };
    return A;
  }

  // ---------------------------------------------------------------- SUPABASE (düz fetch; PostgREST RPC)
  // cfg: { url, key, fetch? (test için sahte fetch), label? }
  // Anahtar: eski "anon" JWT'si (eyJ…) hem apikey hem Authorization başlığında; yeni "publishable" anahtar (sb_publishable_…)
  // yalnız apikey başlığında gönderilir (JWT değildir).
  function supabaseAdapter(cfg) {
    const base = String(cfg.url || '').replace(/\/+$/, '') + '/rest/v1/rpc/';
    const key = String(cfg.key || '');
    const jwt = /^eyJ/.test(key);
    const ff = cfg.fetch || ((u, o) => window.fetch(u, o));
    const A = { name: 'supabase', online: true, needsName: true, readonly: false, uid: null, pid: null, nick: '', srvDan: null, off: 0, week: 0, subs: new Map(),
      // CrazyGames account session (verified by the cg-session Edge Function): { secret, exp, pid } | null. Kept in memory
      // only; the CrazyGames token is asked again when it runs out (A.renew).
      acct: null, tokenFn: null, features: [] };
    const fnBase = String(cfg.url || '').replace(/\/+$/, '') + '/functions/v1/';
    const mkErr = (c, status) => Object.assign(new Error(c), { code: c, status: status || 0 });
    A.rpc = async (fn, args, ms) => {
      let ctl = null; try { ctl = typeof AbortController === 'function' ? new AbortController() : null; } catch (e) { ctl = null; }
      const to = setTimeout(() => { try { if (ctl) ctl.abort(); } catch (e) { /* yok */ } }, ms || 9000);
      const headers = { apikey: key, 'Content-Type': 'application/json', Accept: 'application/json' };
      if (jwt) headers.Authorization = 'Bearer ' + key;
      let res;
      try {
        res = await ff(base + fn, { method: 'POST', headers, body: JSON.stringify(args || {}), signal: ctl ? ctl.signal : undefined, cache: 'no-store', credentials: 'omit', mode: 'cors', referrerPolicy: 'no-referrer' });
      } catch (e) { throw mkErr('network'); } finally { clearTimeout(to); }
      let body = null;
      try { body = await res.json(); } catch (e) { body = null; }
      if (!res.ok) {
        const m = body && typeof body.message === 'string' ? body.message : '';
        const k = /^nd:([a-z_]+)/.exec(m);
        throw mkErr(k ? k[1] : res.status === 429 ? 'rate_limited' : res.status >= 500 ? 'server'
          : res.status === 401 || res.status === 403 ? 'auth' : res.status === 404 ? 'not_setup' : 'bad_request', res.status);
      }
      return body;
    };
    // Edge Function call (cg-session): same headers as the RPCs; errors → code ('not_setup' when the function is not deployed)
    A.fn = async (name, args, ms) => {
      let ctl = null; try { ctl = typeof AbortController === 'function' ? new AbortController() : null; } catch (e) { ctl = null; }
      const to = setTimeout(() => { try { if (ctl) ctl.abort(); } catch (e) { /* yok */ } }, ms || 12000);
      const headers = { apikey: key, 'Content-Type': 'application/json', Accept: 'application/json' };
      if (jwt) headers.Authorization = 'Bearer ' + key;
      let res;
      try {
        res = await ff(fnBase + name, { method: 'POST', headers, body: JSON.stringify(args || {}), signal: ctl ? ctl.signal : undefined, cache: 'no-store', credentials: 'omit', mode: 'cors', referrerPolicy: 'no-referrer' });
      } catch (e) { throw mkErr('network'); } finally { clearTimeout(to); }
      let body = null;
      try { body = await res.json(); } catch (e) { body = null; }
      if (!res.ok || !body || body.ok !== true) {
        const c = body && typeof body.error === 'string' && /^[a-z_]{1,24}$/.test(body.error) ? body.error : '';
        throw mkErr(res.status === 404 ? 'not_setup' : res.status >= 500 && c !== 'not_setup' ? 'server' : c || 'bad_request', res.status);
      }
      return body;
    };
    // The key this device writes with: the account session while signed in (verified), else the guest device secret
    A.key = () => (A.acct ? A.acct.secret : secret());
    const normMe = (m) => {
      if (!m || typeof m !== 'object' || int(m.place, 1, 1e8) == null) return null;
      return { place: int(m.place, 1, 1e8), score: int(m.score, 0, 1e8), total: int(m.total, 0, 1e8), tenth: int(m.tenth, 0, 1e8), gap: int(m.gap, 0, 1e8) };
    };
    const normRow = (r, b, danBoard) => {
      if (!r || typeof r !== 'object') return null;
      const id = int(r.player_id, 1, 9e15); if (id == null) return null;
      const score = danBoard ? int(r.dan_best, 1, 20) : cleanScore(b, r.score);
      if (score == null) return null;
      const at = typeof r.at === 'string' ? Date.parse(r.at) : null;
      return { key: 'p' + id, uid: 'p' + id, pid: id, name: cleanName(r.nick) || '', dan: cleanDan(r.dan), char: isChar(r.ninja) ? r.ninja : null,
        score, time: cleanTime(r.time_s), date: at && isFinite(at) ? at : null, week: int(r.week, 0, 999999) || 0, rank: int(r.place, 1, 1e8), me: id === A.pid };
    };
    const rowsOf = (list, b, danBoard) => (Array.isArray(list) ? list : []).map((r) => normRow(r, b, danBoard)).filter(Boolean);

    // Unvanlar: oturum boyunca önbellekte; salon açılınca tazelenir (LB.refresh). Sunucuda nd_titles yoksa (eski kurulum)
    // bir daha sorulmaz: unvansız çalışır.
    A.titles = null; A.titlesP = null; A.titlesOff = false;
    A.loadTitles = (force) => {
      if (A.titlesOff) return Promise.resolve(null);
      if (A.titlesP && !force) return A.titlesP;
      const p = A.rpc('nd_titles', {}, 7000).then((list) => {
        const m = new Map();
        for (const r of Array.isArray(list) ? list : []) {
          const id = r && int(r.player_id, 1, 9e15), t = r && cleanTitle(r.best_place, r.wins, r.podiums);
          if (id != null && t) m.set(id, t);
        }
        A.titles = m; emit();
        return m;
      }, (er) => { if (A.titlesP === p) A.titlesP = null; if (er && er.code === 'not_setup') A.titlesOff = true; throw er; });
      A.titlesP = p;
      return p;
    };
    A.titleOf = (pid) => (A.titles && A.titles.get(pid)) || null;
    const withTitles = (res) => {
      const put = (r) => { r.title = A.titleOf(r.pid); };
      if (res && Array.isArray(res.rows)) res.rows.forEach(put);
      if (res && Array.isArray(res.weeks)) res.weeks.forEach((w) => w.rows.forEach(put));
      return res;
    };
    // nd_me cevabındaki kendi unvanım ve Şampiyon ninjalarım (eski sunucu bu alanları göndermezse dokunulmaz)
    A.applyMe = (me) => {
      if (!me || typeof me !== 'object' || !Object.prototype.hasOwnProperty.call(me, 'podiums')) return;
      const L = localData();
      L.title = cleanTitle(me.best_place, me.wins, me.podiums);
      L.champ = cleanChamp(me.champ_ninjas);
      localCommit();
      LB._announce();
      emit();
    };
    A.refreshMe = async () => {
      if (!A.pid) return;
      try {
        const me = await A.authed('nd_me', (k) => ({ p_secret: k }), 7000);
        if (me && int(me.player_id, 1, 9e15) === A.pid) A.applyMe(me);
      } catch (e) { /* ağ yok / eski kurulum: önbellekteki unvan kalır */ }
    };

    // ---- CrazyGames account (js/portal-user.js → LB.linkAccount → here)
    // signIn: token → Edge Function → session. The device's guest identity (if it has one) goes along once: the server
    // attaches it to the account or merges it in (supabase/setup.sql 1b). Its device secret stops working then, so it
    // is dropped here; the account is the identity from now on (titles, Champion colors, Dan, scores).
    A.signIn = async (tokenFn) => {
      let tok;
      try { tok = await tokenFn(); } catch (e) { throw mkErr('no_token'); }
      if (typeof tok !== 'string' || tok.length < 10 || tok.length > 4096) throw mkErr('no_token');
      const L = localData();
      const guest = !A.acct && typeof L.pid === 'number' && typeof L.sec === 'string' && /^[A-Za-z0-9_-]{32,64}$/.test(L.sec) ? L.sec : null;
      const r = await A.fn('cg-session', { token: tok, guest });
      const me = r.me, id = me && int(me.player_id, 1, 9e15);
      if (typeof r.secret !== 'string' || !/^[A-Za-z0-9_-]{32,64}$/.test(r.secret) || id == null) throw mkErr('server');
      A.tokenFn = tokenFn;
      A.acct = { secret: r.secret, exp: typeof r.expires === 'number' && isFinite(r.expires) ? r.expires : Date.now() + 6 * 3600e3, pid: id };
      const changed = A.pid !== id;
      A.pid = id; A.uid = 'p' + id; A.nick = cleanName(me.nick) || ''; A.srvDan = cleanDan(me.dan);
      if (r.guest === 'attached' || r.guest === 'merged') { delete L.sec; delete L.pid; delete L.sname; }
      L.acct = id; localCommit();
      if (changed) { A.subs.clear(); A.titlesP = null; }
      A.applyMe(me);
      return r.guest || 'none';
    };
    // one renewal at a time; a token the server refuses ends the account session (the game falls back to on-device)
    let renewing = null;
    A.renew = () => {
      if (!A.tokenFn) return Promise.reject(mkErr('auth'));
      if (!renewing) {
        renewing = A.signIn(A.tokenFn).catch((er) => {
          const c = er && er.code;
          if (c !== 'network' && c !== 'server') { A.acct = null; LB._acctLost(c); }
          throw er;
        }).finally(() => { renewing = null; });
      }
      return renewing;
    };
    // RPC with this device's key; an account session near its end is renewed first, a refused one renewed once
    A.authed = async (fn, mk, ms) => {
      for (let k = 0; k < 2; k++) {
        if (A.acct && A.acct.exp - Date.now() < 5 * 60000) await A.renew().catch(() => null);
        try { return await A.rpc(fn, mk(A.key()), ms); } catch (er) {
          if (A.acct && k === 0 && er && (er.code === 'auth' || er.code === 'unknown_player')) {
            if (await A.renew().then(() => true, () => false)) continue;
          }
          throw er;
        }
      }
      throw mkErr('auth');
    };
    // signed out of CrazyGames: back to this device's guest identity (usually a fresh one after a link)
    A.signOut = () => {
      if (!A.acct && !A.tokenFn) return;
      A.acct = null; A.tokenFn = null;
      const L = localData();
      A.pid = null; A.uid = null; A.nick = ''; A.srvDan = null;
      if (typeof L.pid === 'number' && L.pid > 0 && cleanName(L.sname)) { A.pid = L.pid; A.nick = cleanName(L.sname); A.uid = 'p' + A.pid; }
      A.subs.clear(); A.titlesP = null;
      if (A.pid) A.refreshMe();
    };
    // ---- recovery code (guests on a server that knows it: nd_ping features)
    A.canRecover = () => A.features.includes('recovery');
    A.recoveryCode = async (rotate) => {
      const r = await A.rpc('nd_recovery_code', { p_secret: secret(), p_rotate: !!rotate }, 8000);
      const code = r && typeof r.code === 'string' && /^KAGE-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/.test(r.code) ? r.code : null;
      if (!code) throw mkErr('server');
      return code;
    };
    A.recover = async (code) => {
      const r = await A.rpc('nd_recover', { p_code: code, p_secret: secret() }, 9000);
      if (!r || r.ok !== true) return { ok: false, code: (r && typeof r.error === 'string' && r.error) || 'bad_code' };
      const me = r.me, id = me && int(me.player_id, 1, 9e15);
      if (id == null) throw mkErr('server');
      const L = localData();
      A.pid = id; A.uid = 'p' + id; A.nick = cleanName(me.nick) || A.nick; A.srvDan = cleanDan(me.dan);
      L.pid = id; L.sname = A.nick; if (checkName(A.nick).ok) L.name = A.nick;
      localCommit();
      A.subs.clear(); A.titlesP = null;
      A.applyMe(me);
      return { ok: true, code: typeof r.code === 'string' ? r.code : null, name: A.nick };
    };

    A.syncClock = (p) => { if (p && typeof p.now === 'number' && isFinite(p.now)) A.off = p.now - Date.now(); if (p && typeof p.week === 'number') A.week = p.week; };
    A.now = () => Date.now() + A.off;
    A.ping = async () => {
      const p = await A.rpc('nd_ping', {}, 7000); if (!p || p.ok !== true) throw mkErr('not_setup');
      A.syncClock(p); A.features = Array.isArray(p.features) ? p.features.filter((x) => typeof x === 'string').slice(0, 20) : [];
      return p;
    };
    A.init = async () => {
      await A.ping();
      const L = localData();
      if (typeof L.pid === 'number' && L.pid > 0 && cleanName(L.sname)) { A.pid = L.pid; A.nick = cleanName(L.sname); A.uid = 'p' + A.pid; }
      // Kimliği sunucuda doğrula: veritabanı sıfırlanırsa eski numara başka bir oyuncuya ait olabilir
      if (A.pid) {
        try {
          const me = await A.rpc('nd_me', { p_secret: secret() }, 7000);
          const id = me && int(me.player_id, 1, 9e15);
          if (id == null) A.forget();
          else { A.pid = id; A.uid = 'p' + id; A.nick = cleanName(me.nick) || A.nick; A.srvDan = cleanDan(me.dan); L.pid = id; L.sname = A.nick; localCommit(); if (!LB.nameLocked) A.applyMe(me); }
        } catch (e) { /* nd_me yoksa (eski kurulum) ya da ağ hatası: önbellekteki kimlikle devam */ }
      }
    };
    A.hasName = () => !!A.pid;
    A.forget = () => { const L = localData(); A.pid = null; A.uid = null; A.nick = ''; delete L.pid; delete L.sname; if (!L.acct) { L.title = null; L.champ = []; } localCommit(); };
    A.register = async (name) => {
      // The legacy device-secret backend is not CrazyGames account authentication.
      if (ND.portalUserReady) await ND.portalUserReady;
      if (LB.nameLocked || A.acct) throw mkErr('readonly');
      const pu = LB.platformUser;
      const r = await A.rpc('nd_register', { p_secret: secret(), p_nick: name, p_country: null,
        p_platform: pu && typeof pu.provider === 'string' ? pu.provider : null, p_platform_uid: pu && pu.id != null ? String(pu.id).slice(0, 64) : null });
      const id = int(r && r.player_id, 1, 9e15); if (id == null) throw mkErr('server');
      A.pid = id; A.uid = 'p' + id; A.nick = cleanName(r.nick) || name;
      if (typeof r.dan === 'number') A.srvDan = cleanDan(r.dan);
      const L = localData(); L.pid = id; L.sname = A.nick; localCommit();
      A.subs.clear(); LB.uid = A.uid; emit();
      return { ok: true, name: A.nick };
    };
    const fail = (er, reg) => {
      const c = (er && er.code) || 'error';
      if (c === 'network' || c === 'server') return { ok: false, reason: 'offline', retry: true, code: c };
      if (c === 'auth') return { ok: false, reason: 'readonly', code: c };
      if (c === 'rate_limited') return { ok: false, reason: 'rate', retry: true, code: c };
      if (c === 'daily_limit') return { ok: false, reason: 'daily', code: c };
      if (reg && /^nick_/.test(c)) return { ok: false, reason: 'needName', retry: true, code: c };
      if (c === 'wrong_week') return { ok: false, reason: 'week', code: c };
      return { ok: false, reason: 'rejected', code: c };
    };
    // Kayıtlı değilse yerel takma adla kaydolmayı dener; ad yoksa/geçersizse 'needName'
    const ensure = async () => {
      if (ND.portalUserReady) await ND.portalUserReady;
      if (A.acct) return null;
      if (LB.nameLocked) return { ok: false, reason: 'readonly' };
      if (A.pid) return null;
      const nm = checkName(localData().name);
      if (!nm.ok) return { ok: false, reason: 'needName', retry: true };
      try { await A.register(nm.name); return null; } catch (er) { return fail(er, true); }
    };
    A.submit = async (b, e) => {
      const pb = parseBoard(b); if (!pb || !e.char) return { ok: false, reason: 'invalid' };
      for (let k = 0; k < 2; k++) {
        const need = await ensure(); if (need) return need;
        try {
          const r = await A.authed('nd_submit', (k2) => ({ p_secret: k2, p_board: pb.base, p_week: pb.id, p_ninja: e.char, p_score: e.score,
            p_time: Math.round(e.time || 0), p_summary: e.sum || {} }));
          const me = normMe(r);
          for (const [k2, s] of A.subs) if (k2.startsWith(b + '|')) { s.t = 0; if (me && k2 === b + '|') s.me = me; }
          // a tournament submit may have engraved last month: pick up a new title / Champion colors
          if (pb.base === 'weekly') A.refreshMe();
          return { ok: true, stored: 'online', improved: !!(r && r.improved), best: me ? me.score : e.score, rank: me ? me.place : null, total: me ? me.total : null, gap: me ? me.gap : null };
        } catch (er) {
          if (er && er.code === 'unknown_player' && k === 0 && !A.acct) { A.forget(); continue; } // sunucu sıfırlanmış: bir kez yeniden kaydol
          return fail(er);
        }
      }
      return { ok: false, reason: 'error' };
    };
    A.setDan = async (r, sum) => {
      for (let k = 0; k < 2; k++) {
        const need = await ensure(); if (need) return need;
        try {
          const x = await A.authed('nd_set_dan', (k2) => ({ p_secret: k2, p_dan: cleanDan(r), p_summary: sum || null }));
          A.srvDan = cleanDan(x && x.dan);
          return { ok: true, dan: A.srvDan, best: cleanDan(x && x.dan_best), pending: !!(x && x.pending) };
        } catch (er) {
          if (er && er.code === 'unknown_player' && k === 0 && !A.acct) { A.forget(); continue; }
          return fail(er);
        }
      }
      return { ok: false, reason: 'error' };
    };
    const args = (pb, c, lim) => ({ p_board: pb.base, p_week: pb.base === 'weekly' ? pb.id : null, p_ninja: c || null, p_limit: lim });
    // Klasik ekran (lbUI) için: sorgu başına önbellek; 20 sn'den eskiyse yeniden çekilir
    A.watch = (b, c) => {
      const k = b + '|' + (c || '');
      const old = A.subs.get(k);
      if (old && (old.loading || (Date.now() - old.t < 20000 && !old.error))) return old.ready;
      const pb = parseBoard(b);
      const s = { rows: old ? old.rows : [], me: old ? old.me : null, loading: true, error: null, t: Date.now() };
      s.ready = (async () => {
        try {
          A.loadTitles().catch(() => null);
          const [rows, me] = await Promise.all([
            A.rpc('nd_top', args(pb, c, TOP_N)),
            A.pid ? A.rpc('nd_my_rank', { p_player: A.pid, p_board: pb.base, p_week: pb.base === 'weekly' ? pb.id : null, p_ninja: c || null }).catch(() => null) : null,
          ]);
          s.rows = rowsOf(rows, b); s.me = normMe(me);
        } catch (er) { s.error = (er && er.code) || 'error'; }
        s.loading = false; emit();
        return s.rows;
      })();
      A.subs.set(k, s);
      return s.ready;
    };
    A.peek = (b, c) => {
      const s = A.subs.get(b + '|' + (c || ''));
      if (!s) return { rows: [], loading: true, error: null };
      return { rows: s.rows.map((r) => Object.assign({}, r, { me: !!A.pid && r.pid === A.pid, title: A.titleOf(r.pid) })), loading: s.loading, error: s.error };
    };
    A.mine = (b, c) => {
      const s = A.subs.get(b + '|' + (c || ''));
      if (!s || !s.me || s.me.score == null) return null;
      return { key: 'me', uid: A.uid, pid: A.pid, name: A.nick, dan: A.srvDan != null ? A.srvDan : myDan(), score: s.me.score, char: c || null, time: null, date: null, me: true, rank: s.me.place };
    };
    A.rank = async (b, c) => { const s = A.subs.get(b + '|' + (c || '')); if (s) await s.ready; return s && s.me ? s.me.place : null; };
    A.names = async () => ({});
    A.hall = async (kind, arg) => {
      const tl = A.loadTitles().catch(() => null);
      const res = await A.hallRows(kind, arg);
      await tl;
      return withTitles(res);
    };
    A.hallRows = async (kind, arg) => {
      const my = (pb, c) => (A.pid ? A.rpc('nd_my_rank', { p_player: A.pid, p_board: pb.base, p_week: pb.base === 'weekly' && pb.id ? pb.id : null, p_ninja: c || null }).then(normMe).catch(() => null) : Promise.resolve(null));
      if (kind === 'week' || kind === 'alltime' || kind === 'char') {
        const b = kind === 'week' ? 'weekly@' + arg : 'wall';
        const pb = kind === 'week' ? parseBoard(b) : { base: 'weekly', id: 0 };
        const c = kind === 'char' ? arg : null;
        const [rows, me] = await Promise.all([
          A.rpc('nd_top', { p_board: 'weekly', p_week: pb.id || null, p_ninja: c, p_limit: kind === 'char' ? TOP_N : HALL_N }),
          my(pb, c),
        ]);
        return { rows: rowsOf(rows, b), me };
      }
      if (kind === 'chars') return { rows: rowsOf(await A.rpc('nd_ninja_best', { p_board: 'weekly', p_week: null }), 'wall') };
      if (kind === 'archive') {
        const a = await A.rpc('nd_archive', { p_weeks: 12 });
        const weeks = (Array.isArray(a) ? a : []).map((w) => {
          const id = int(w && w.week, 200001, 999953); if (id == null) return null;
          return { id, key: weekKeyOf(id), rows: rowsOf(w.rows, 'wall').slice(0, 10) };
        }).filter(Boolean);
        return { weeks };
      }
      if (kind === 'dan') {
        const [rows, me] = await Promise.all([A.rpc('nd_dan_top', { p_limit: HALL_N }), A.pid ? A.rpc('nd_my_rank', { p_player: A.pid, p_board: 'dan', p_week: null, p_ninja: null }).then(normMe).catch(() => null) : null]);
        return { rows: rowsOf(rows, null, true), me };
      }
      return { rows: [] };
    };
    return A;
  }

  // ---------------------------------------------------------------- kurtarma kodu biçimi (setup.sql nd_rc_norm ile aynı)
  // KAGE-XXXX-XXXX: 8 karakter, Crockford alfabesi (I, L, O, U yok). Girişte büyük/küçük harf, tire, boşluk serbest;
  // O → 0, I / L → 1, U → V. Geçersizse null (sunucuya hiç gitmez).
  function rcNorm(t) {
    let v = String(t == null ? '' : t).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length === 12 && v.startsWith('KAGE')) v = v.slice(4);
    v = v.replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V');
    return /^[0-9A-HJKMNP-TV-Z]{8}$/.test(v) ? v : null;
  }
  const rcShow = (c) => 'KAGE-' + c.slice(0, 4) + '-' + c.slice(4);

  // ---------------------------------------------------------------- cihaz kimliği (gizli, rastgele; ND.save içinde)
  function randId(n) {
    const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', b = new Uint8Array(n);
    try { crypto.getRandomValues(b); } catch (e) { for (let i = 0; i < n; i++) b[i] = (Math.random() * 256) | 0; }
    return Array.from(b, (x) => AL[x & 63]).join('');
  }
  function secret() {
    const L = localData();
    if (typeof L.sec !== 'string' || !/^[A-Za-z0-9_-]{32,64}$/.test(L.sec)) { L.sec = randId(40); localCommit(); }
    return L.sec;
  }

  // ---------------------------------------------------------------- PLATFORM TASLAĞI (gelecek)
  // Örnek: CrazyGames / Poki SDK'sı. Bağdaştırıcı yukarıdaki arayüzü uygular ve
  //   ND.leaderboard.registerAdapter('crazygames', async () => adapterObj /* ya da null: kullanılamıyor */);
  //   ND.leaderboard.use('crazygames');
  // ile etkinleştirilir. Platform kullanıcı adı kancası: ND.leaderboard.usePlatformUser({ provider: 'crazygames', id, name })
  // Display names are connected by portal-user.js; server account linking remains separate.
  const factories = {};

  // ---------------------------------------------------------------- SAHTE ÇALIŞMA ZAMANI (test)
  function mockRuntime(o) {
    o = Object.assign({ users: 30, latency: 250, canWrite: true, can: null, runtime: true, me: 'u_mock_me', meName: 'Test Oyuncu', meScore: null, seed: true }, o || {});
    const wait = (v, k = 1) => new Promise((res) => setTimeout(() => res(v), o.latency * k * (0.5 + Math.random())));
    const docs = new Map(), listeners = new Set();
    const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
    const mkErr = (c, m) => Object.assign(new Error(m || c), { code: c });
    const seg = (id) => { if (typeof id !== 'string' || !/^[A-Za-z0-9_\-.~:@+]{1,200}$/.test(id) || id === '.' || id === '..') throw new TypeError('invalid path segment'); return id; };
    const snapDoc = (path) => { const d = docs.get(path); return Object.freeze({ id: path.split('/').pop(), exists: !!d, data: () => clone(d), metadata: { fromCache: false, hasPendingWrites: false } }); };
    const test = (v, op, x) => ({ '==': v === x, '!=': v !== x, '>': v > x, '>=': v >= x, '<': v < x, '<=': v <= x }[op]);
    function run(q) {
      let out = [];
      for (const [p, d] of docs) {
        const i = p.lastIndexOf('/');
        if (p.slice(0, i) !== q.col) continue;
        if (q.where.every((w) => d[w[0]] !== undefined && test(d[w[0]], w[1], w[2]))) out.push([p, d]);
      }
      if (q.order) {
        const [f, dir] = q.order;
        out = out.filter(([, d]) => d[f] !== undefined); // orderBy alanı olmayan belge sonuçta yer almaz (belge deposu kuralı)
        out.sort((A2, B2) => { const a = A2[1][f], b = B2[1][f]; return (a < b ? -1 : a > b ? 1 : 0) * (dir === 'desc' ? -1 : 1); });
      } else out.sort((A2, B2) => (A2[0] < B2[0] ? -1 : 1));
      if (q.lim) out = out.slice(0, q.lim);
      const ds = out.map(([p]) => snapDoc(p));
      return Object.freeze({ docs: ds, size: ds.length, empty: !ds.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } });
    }
    const listen = (fire) => { const L = { dead: false }; L.fire = () => setTimeout(() => { if (!L.dead) fire(); }, o.latency * 0.6); listeners.add(L); L.fire(); return () => { L.dead = true; listeners.delete(L); }; };
    const notify = () => listeners.forEach((L) => L.fire());
    function query(colPath, where, order, lim) {
      const q = { col: colPath, where, order, lim };
      return {
        where: (f, op, v) => query(colPath, where.concat([[f, op, v]]), order, lim),
        orderBy: (f, dir) => query(colPath, where, [f, dir || 'asc'], lim),
        limit: (n) => query(colPath, where, order, n),
        get: () => wait(run(q)),
        onSnapshot: (next) => listen(() => next(run(q))),
      };
    }
    function docRef(path) {
      const parts = path.split('/'); parts.forEach(seg);
      if (parts.length % 2) throw new TypeError('document path needs an even number of segments');
      return Object.freeze({
        id: parts[parts.length - 1], path,
        get: () => wait(snapDoc(path)),
        set: async (data) => { await wait(); if (!o.canWrite) throw mkErr('invalid_argument', 'write not permitted for this viewer'); docs.set(path, clone(data)); notify(); },
        update: async (data) => { await wait(); if (!o.canWrite || !docs.has(path)) throw mkErr('invalid_argument'); docs.set(path, Object.assign(clone(docs.get(path)), clone(data))); notify(); },
        delete: async () => { await wait(); if (!o.canWrite) throw mkErr('invalid_argument'); docs.delete(path); notify(); },
        onSnapshot: (next) => listen(() => next(snapDoc(path))),
        collection: (p) => collection(path + '/' + p),
      });
    }
    function collection(path) {
      const parts = path.split('/'); parts.forEach(seg);
      if (!(parts.length % 2)) throw new TypeError('collection path needs an odd number of segments');
      return Object.assign(query(path, [], null, 0), {
        path,
        doc: (id) => docRef(path + '/' + (id == null ? 'm' + Math.random().toString(36).slice(2, 12) : id)),
        add: async (d) => { const r = docRef(path + '/m' + Math.random().toString(36).slice(2, 12)); await r.set(d); return r; },
      });
    }
    const db = Object.freeze({ doc: docRef, collection });
    // --- sahte oyuncular + skorlar (bazıları bilerek bozuk: doğrulamayı sınamak için)
    const NAMES = ['Kenji', 'Ayşe', 'Mert', 'Deniz', 'Yuna', 'Can', 'Elif', 'Hiro', 'Zeynep', 'Emre', 'Sakura', 'Burak', 'Selin', 'Taro', 'Ece', 'Kaan', 'Mina', 'Onur', 'Rin', 'Arda', '', 'Defne', 'Kerem', 'Aiko', 'İpek', 'Ozan', 'Nao', 'Cem', 'Lale', 'Sora', '<img src=x onerror=alert(1)>', 'Çok Uzun İsimli Bir Oyuncu Adı Burada'];
    const names = { [o.me]: o.meName };
    const chars = ND.CHARS.filter((c) => !c.hidden).map((c) => c.id);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const mkDoc = (uid, b, entries, dan) => {
      const d = { uid, v: DOC_V, gv: GAME_V, by: {}, dan: dan || 0 };
      for (const e of entries) {
        if (!d.by[e.c] || e.s > d.by[e.c].s) { d.by[e.c] = { s: e.s, t: e.t, d: e.d }; if (e.w) d.by[e.c].w = e.w; d['cs_' + e.c] = e.s; }
        if (!(d.score >= e.s)) Object.assign(d, { score: e.s, char: e.c, time: e.t, date: e.d }, e.w ? { wk: e.w } : {});
      }
      return d;
    };
    if (o.seed) {
      const now = Date.now(), cw = period(now);
      for (let i = 0; i < o.users; i++) {
        const uid = 'u_mock_' + i; names[uid] = NAMES[i % NAMES.length];
        const dan = Math.random() < 0.8 ? 1 + ((Math.random() * 18) | 0) : 0;
        for (const b of BOARD_IDS) {
          if (Math.random() < 0.15) continue;
          const hi = b === 'arcade' ? 180000 : 42000, lo = b === 'arcade' ? 30000 : 9000;
          const n = 1 + ((Math.random() * 3) | 0), es = [];
          for (let k = 0; k < n; k++) es.push({ s: Math.round(rnd(lo, hi)), c: chars[(Math.random() * chars.length) | 0], t: Math.round(b === 'arcade' ? rnd(420, 1500) : rnd(45, 170)), d: now - Math.round(rnd(0, 40) * DAY) });
          docs.set('lb_' + b + '/' + uid, mkDoc(uid, b, es, dan));
        }
        // aylık turnuva: bu ay + 6 geçmiş ay; tüm zamanlar; Dan
        const all = [];
        for (let w = 0, wk = cw; w < 7; w++, wk = prevPeriod(wk)) {
          if (Math.random() < 0.3) continue;
          const e = { s: Math.round(rnd(20000, 240000)), c: chars[(Math.random() * chars.length) | 0], t: Math.round(rnd(300, 1200)), d: Math.min(now, wk.start + Math.round(rnd(0.02, 0.98) * (wk.end - wk.start))), w: wk.key };
          docs.set('lb_w' + wk.id + '/' + uid, mkDoc(uid, 'weekly', [e], dan));
          all.push(e);
        }
        if (all.length) docs.set('lb_wall/' + uid, mkDoc(uid, 'wall', all, dan));
        if (dan) docs.set('lb_dan/' + uid, { uid, dan, best: Math.min(20, dan + ((Math.random() * 2) | 0)), date: now - Math.round(rnd(0, 30) * DAY), v: DOC_V });
      }
      // bozuk / kurcalanmış belgeler: gösterilmemeli
      docs.set('lb_arcade/u_bad_huge', { uid: 'u_bad_huge', score: 1e12, char: 'akane', by: {} });
      docs.set('lb_arcade/u_bad_type', { uid: 'u_bad_type', score: '99999', char: 'akane' });
      docs.set('lb_arcade/u_bad_char', { uid: 'u_bad_char', score: 31000, char: '<b>x</b>', time: -5, date: 'dün', by: { '<b>x</b>': { s: 5 } } });
      docs.set('lb_w' + cw.id + '/u_bad_huge', { uid: 'u_bad_huge', score: 9e9, char: 'akane', by: {} });
      docs.set('lb_dan/u_bad_dan', { uid: 'u_bad_dan', dan: 99, best: 99 });
      names.u_bad_char = 'Bozuk Veri';
      if (o.meScore) for (const b of Object.keys(o.meScore)) docs.set('lb_' + b + '/' + o.me, mkDoc(o.me, b, [{ s: o.meScore[b], c: 'akane', t: 600, d: now - 3 * DAY }]));
    }
    const user = Object.freeze({
      id: () => wait(o.me, 0.3),
      can: (n) => wait(n === 'data.write' ? o.can : false, 0.3),
      isOwner: () => wait(false, 0.3), canEdit: () => wait(false, 0.3),
      me: () => wait({ id: o.me, name: o.meName, avatarUrl: '', color: '#888', email: null, isOwner: false, canEdit: false }, 0.3),
      profiles: (ids) => wait(Object.fromEntries([].concat(ids).map((id) => [id, { id, name: names[id] || '', avatarUrl: '', color: '#888', email: null, isMe: id === o.me, guest: false }])), 0.5),
    });
    return { use: (n) => wait(o.runtime ? (n === 'db' ? db : n === 'user' ? user : null) : null, 2), _docs: docs, _opts: o };
  }

  // ================================================================ CEPHE: ND.leaderboard
  let cur = localAdapter, connTok = 0, settleRes = null, flushT = 0;
  let settled = new Promise((r) => { settleRes = r; });
  const hallCache = new Map();
  const LB = ND.leaderboard = {
    BOARDS: BOARD_IDS.slice(), TOP_N, GAME_V,
    ready: false, mode: 'local', status: 'loading', uid: null, lastError: null, _mock: null, platformUser: null, _res: {},
    get readonly() { return !!cur.readonly; },
    get adapter() { return cur; },
    get online() { return cur !== localAdapter; },
    get nameLocked() { return !!this.platformUser; },

    // yardımcılar (diğer modüller için)
    parseBoard, period, prevPeriod, checkName, cleanName, danShort, weekKeyOf,
    // a name safe to show: control / markup characters removed, at most 20 characters, '' when the word filter rejects it
    shownName(s) { const n = cleanName(s); return n && !badName(n) ? n : ''; },
    now() { try { return cur.now ? cur.now() : Date.now(); } catch (e) { return Date.now(); } },
    // current tournament period (a UTC calendar month; the name is kept from the weekly version)
    week(ms) { return period(ms == null ? this.now() : ms); },
    weeklyBoard(key) { return 'weekly@' + (key || this.week().key); },

    onChange(fn) { fns.add(fn); return () => fns.delete(fn); },
    // Bağlantı kararı verilene dek bekle (en çok ms); bitiş panelindeki gönderim çevrimiçi tabloya gitsin
    whenSettled(ms = SETTLE_MS) { return Promise.race([settled, new Promise((r) => setTimeout(r, ms))]); },

    needsName() {
      if (this.nameLocked) return false;
      if (!cur.needsName) return false;
      if (cur.hasName) return !cur.hasName() && !checkName(localData().name).ok;
      return !cleanName(localData().name);
    },
    getName() { return this.nameLocked ? this.platformUser.name : (cur.nick && cur.hasName && cur.hasName()) ? cur.nick : cleanName(localData().name); },
    // Eski (senkron) yol: yalnız yerel ad. Yeni formlar saveName kullanır.
    setName(n) {
      if (this.nameLocked) return this.getName();
      const r = checkName(n);
      if (!r.ok) return '';
      const L = localData();
      L.name = r.name;
      // adsız kaydedilmiş yerel satırlara bu adı ver
      for (const b of Object.keys(L.boards || {})) if (Array.isArray(L.boards[b])) L.boards[b].forEach((x) => { if (x && !cleanName(x.n)) x.n = r.name; });
      localCommit(); emit();
      return r.name;
    },
    // Takma adı kaydet: kurallar (istemci) → yerel → (varsa) sunucu kaydı → bekleyen gönderimler
    //   → { ok, name } | { ok:false, code: 'nick_length'|'nick_chars'|'nick_bad'|'rate_limited'|'offline'|… }
    async saveName(n) {
      if (this.nameLocked) return { ok: true, name: this.getName() };
      const r = checkName(n);
      if (!r.ok) return r;
      const L = localData(), prev = L.name;
      if (cur.register) {
        // yerel ad ve adsız satırlar ancak sunucu kabul edince (ya da ağ yoksa) güncellenir
        try { await cur.register(r.name); } catch (er) {
          const c = (er && er.code) || 'error';
          if (c === 'network' || c === 'server') { this.setName(r.name); return { ok: true, name: r.name, offline: true }; } // ağ yok: yerelde kaldı, sonra kaydolur
          // sunucu reddetti (kural / hız sınırı / yasak): yerel ad da eski haline dönsün (iki ad ayrışmasın)
          L.name = prev; localCommit(); emit();
          return { ok: false, code: c, name: r.name };
        }
        this.setName(r.name);
        this.hallClear();
        await this.flush();
      } else this.setName(r.name);
      emit();
      return { ok: true, name: this.getName() };
    },
    // Session display name. Preserve the guest nickname and never accept a client-side account ID.
    usePlatformUser(u) {
      const name = u && typeof u.name === 'string' ? u.name : '';
      this.platformUser = u && u.provider === 'crazygames' && /^[A-Za-z0-9._]{6,20}$/.test(name) ? { provider: 'crazygames', name } : null;
      this.hallClear();
      emit();
    },
    profile() {
      return { name: this.getName(), pid: cur.pid || null, online: cur !== localAdapter, mode: this.mode, status: this.status, needsName: this.needsName(), platform: ND.platform.name };
    },

    // ---- CrazyGames account (js/portal-user.js). tokenFn = () => SDK user.getUserToken(); null = not signed in.
    // signedOut = the SDK said "nobody is signed in" (not just "no answer"): the cached title / Champion colors of the
    // account that was here last are put away; they come back from the server at the next sign-in.
    // While the account is being checked (or the check failed) the player's new scores stay on this device, as before.
    _acctTok: null, _acctP: null, acctState: 'none', acctError: null, _acctTries: 0, _acctT: 0,
    linkAccount(tokenFn, signedOut) {
      clearTimeout(this._acctT);
      this._acctTries = 0;
      if (typeof tokenFn === 'function') { this._acctTok = tokenFn; this._acctRun(); return; }
      const had = !!this._acctTok || this.acctState !== 'none';
      this._acctTok = null; this._acctP = null; this.acctState = 'none'; this.acctError = null;
      if (cur.signOut) cur.signOut();
      if (signedOut || had) this._acctForget();
      this.hallClear(); emit();
    },
    _acctForget() {
      const L = localData();
      if (!L.acct) return;
      delete L.acct; L.title = null; L.champ = []; localCommit();
    },
    _acctRun() {
      const fn = this._acctTok;
      if (!fn) return null;
      if (!(cur.signIn && this.status === 'online')) {
        // server still connecting → wait (useSupabase calls again); offline / no server → say so, do not claim "connecting"
        if (this._sbCfg && this.status === 'loading') this.acctState = 'pending';
        else { this.acctState = this._sbCfg ? 'failed' : 'off'; this.acctError = 'offline'; }
        emit(); return null;
      }
      const ad = cur;
      this.acctState = 'pending'; this.acctError = null; emit();
      const p = this._acctP = ad.signIn(fn).then(() => {
        if (this._acctP !== p) return;
        this.acctState = 'on'; this._acctTries = 0; this.uid = ad.uid;
        this.hallClear(); emit(); this.flush();
      }, (er) => {
        if (this._acctP !== p) return;
        const c = (er && er.code) || 'error';
        this.acctState = 'failed'; this.acctError = c; emit();
        // a passing network / server hiccup: try again a few times (the function not being there is not a hiccup)
        if ((c === 'network' || c === 'server') && this._acctTries++ < 3) this._acctT = setTimeout(() => { if (this._acctTok === fn) this._acctRun(); }, 20000 * this._acctTries);
      });
      return p;
    },
    // the server refused a renewal (token no longer valid): account scores stay on this device until the next sign-in
    _acctLost(code) { this.acctState = 'failed'; this.acctError = code || 'auth'; this.hallClear(); emit(); },
    // signed in to CrazyGames but the account is not (yet) verified by our server
    accountPending() { return this.nameLocked && !(cur && cur.acct); },
    account() { return { state: this.acctState, error: this.acctError, name: this.nameLocked ? this.platformUser.name : '', on: !!(cur && cur.acct) }; },
    // Guest recovery code (Settings): only on our server, only for a guest that has a server identity
    canRecover() { return cur.name === 'supabase' && this.status === 'online' && !!cur.canRecover && cur.canRecover() && !this.nameLocked && !cur.acct; },
    hasServerId() { return !!(cur.pid && !cur.acct); },
    async recoveryCode(rotate) {
      if (!this.canRecover()) return { ok: false, code: 'unavailable' };
      if (!cur.pid) return { ok: false, code: 'needName' };
      // not kept in the save: a code used on another device changes, the server is the only source
      try { return { ok: true, code: await cur.recoveryCode(rotate) }; }
      catch (er) { const c = (er && er.code) || 'error'; return { ok: false, code: c === 'network' || c === 'server' ? 'offline' : c === 'rate_limited' ? 'rate' : c }; }
    },
    async recover(text) {
      if (!this.canRecover()) return { ok: false, code: 'unavailable' };
      const c = rcNorm(text);
      if (!c) return { ok: false, code: 'bad_code' };
      let r;
      try { r = await cur.recover(rcShow(c)); } catch (er) {
        const k = (er && er.code) || 'error';
        return { ok: false, code: k === 'network' || k === 'server' ? 'offline' : k === 'rate_limited' ? 'rate' : k === 'banned' ? 'banned' : 'error' };
      }
      if (r.ok) { this.hallClear(); emit(); this.flush(); }
      return r;
    },
    rcNorm, rcShow,
    // After a new title / Champion colors, a CrazyGames guest is offered the CrazyGames sign-in once (never mid-fight)
    _askSave() {
      const CG = ND.cgAccount;
      if (!CG || !CG.available || CG.signedIn || !CG.prompt) return;
      const L = localData(), key = cleanChamp(L.champ).join(',') + '|' + ((L.title && L.title.place) || 0);
      if (L.askKey === key) return;
      L.askKey = key; localCommit();
      let tries = 0;
      const PLAY = { intro: 1, fight: 1, ko: 1, timeup: 1, replay: 1 };
      const go = () => {
        const G = ND.game, busy = (G && G.mode !== 'attract' && PLAY[G.phase]) || (ND.portal && ND.portal.inAd);
        if (busy) { if (++tries < 200) setTimeout(go, 3000); return; }
        if (!CG.signedIn) CG.prompt();
      };
      setTimeout(go, 5600);
    },

    // Skor gönder: her zaman yerel kopya + (varsa) çevrimiçi. o.skipLocal: yalnız çevrimiçi (yeniden gönderim)
    async submit(board, entry, o = {}) {
      const e = cleanEntry(board, entry);
      if (!e) return { ok: false, reason: 'invalid' };
      if (e.dan == null || !e.dan) e.dan = myDan();
      await this.whenSettled();
      if (ND.portalUserReady) await ND.portalUserReady;
      if (this.nameLocked && this._acctP && this.acctState === 'pending') await Promise.race([this._acctP, new Promise((r) => setTimeout(r, 9000))]);
      const loc = o.skipLocal ? null : await localAdapter.submit(board, e);
      this.hallClear();
      if (cur === localAdapter) {
        // çevrimiçi olabilirdi ama bağlantı yok → sonra gönderilmek üzere sakla
        if (!this.nameLocked && this.status === 'offline' && this._sbCfg) outAdd(board, e);
        return loc || { ok: false, reason: 'offline' };
      }
      let r;
      try { r = await cur.submit(board, e); } catch (err) { r = { ok: false, reason: 'error' }; }
      if (!r || !r.ok) {
        if (r && r.retry) { outAdd(board, e); if (r.reason === 'rate') scheduleFlush(22000); else if (r.reason === 'offline') scheduleFlush(45000); }
        return { ok: false, stored: 'local', reason: (r && r.reason) || 'error', code: r && r.code, rank: loc && loc.rank, improved: loc && loc.improved, best: loc && loc.best };
      }
      outDrop(board, e);
      const rank = r.rank != null ? r.rank : await cur.rank(board, null, r.best);
      const res = Object.assign({}, r, { rank });
      this._res[board + '|' + e.date] = res;
      return res;
    },
    // Son (giden kutusundan da gelmiş olabilir) gönderim sonucu
    resultFor(board, date) { return this._res[board + '|' + date] || null; },
    // Giden kutusunu sırayla gönder (hız sınırına takılınca bekler)
    flush() {
      if (this._flushing) return this._flushing;
      if (cur === localAdapter || !cur.submit) return Promise.resolve();
      const run = (async () => {
        await null; // önce this._flushing atansın (boş kutuda gövde eşzamanlı bitip bayrağı kilitlemesin)
        const L = localData();
        if (!Array.isArray(L.out)) L.out = [];
        try {
          if (L.danOut && cur.setDan) { const d = await this.flushDan(); if (d && !d.ok && d.retry) return; }
          while (L.out.length) {
            const it = L.out[0];
            if (!it || !outAlive(it)) { L.out.shift(); localCommit(); continue; }
            let r;
            try { r = await cur.submit(it.b, it.e); } catch (e) { r = { ok: false, reason: 'error' }; }
            if (r && r.ok) { L.out.shift(); localCommit(); this._res[it.b + '|' + it.e.date] = r; this.hallClear(); emit(); continue; }
            if (r && r.reason === 'rate') { scheduleFlush(22000); break; }
            if (r && r.reason === 'offline') { scheduleFlush(60000); break; }
            if (r && (r.reason === 'needName' || r.reason === 'readonly')) break;
            this._res[it.b + '|' + it.e.date] = r; L.out.shift(); localCommit(); emit(); // kalıcı ret: bırak
          }
        } finally { this._flushing = null; }
      })();
      this._flushing = run;
      return run;
    },
    pending() { const L = localData(); return (Array.isArray(L.out) ? L.out.length : 0) + (L.danOut ? 1 : 0); },

    // Dan rütbesi: yerel kayıt banzuke.js'te; burada yalnız çevrimiçi eşitleme
    async setDan(r, sum) {
      if (ND.portalUserReady) await ND.portalUserReady;
      if (this.accountPending()) return { ok: false, stored: 'local', reason: 'readonly' };
      const L = localData();
      if (!cur.setDan) { if (this.status === 'offline' && this._sbCfg) { L.danOut = { r: cleanDan(r), sum: cleanSum(sum), t: Date.now() }; localCommit(); } return { ok: false, stored: 'local' }; }
      L.danOut = { r: cleanDan(r), sum: cleanSum(sum), t: Date.now() }; localCommit();
      this.hallClear();
      return this.flushDan();
    },
    async flushDan() {
      if (ND.portalUserReady) await ND.portalUserReady;
      if (this.accountPending()) return { ok: false, reason: 'readonly', retry: true };
      const L = localData(), d = L.danOut;
      if (!d || !cur.setDan) return null;
      let res;
      try { res = await cur.setDan(d.r, d.sum); } catch (e) { res = { ok: false, reason: 'error', retry: true }; }
      if (res.ok) { if (!res.pending || L.danOut !== d) { if (L.danOut === d) L.danOut = null; } else scheduleFlush(22000); }
      else if (res.retry) { if (res.reason !== 'needName') scheduleFlush(res.reason === 'rate' ? 22000 : 60000); }
      else L.danOut = null;
      localCommit(); emit();
      return res;
    },

    // Şampiyonlar Salonu sorguları (önbellekli, 25 sn)
    hall(kind, arg, o = {}) {
      const k = this.mode + '|' + kind + '|' + (arg || '');
      const c = hallCache.get(k);
      if (c && !o.fresh && Date.now() - c.t < 25000) return c.p;
      const ad = cur.hall ? cur : localAdapter;
      const ent = { t: Date.now(), p: null, v: null };
      ent.p = ad.hall(kind, arg).then((v) => { ent.v = v; return v; }, (e) => { if (hallCache.get(k) === ent) hallCache.delete(k); throw e; });
      hallCache.set(k, ent);
      return ent.p;
    },
    hallClear() { hallCache.clear(); },
    _touch() { emit(); }, // listeners redraw (e.g. the CrazyGames account became known)
    // Menü için: bu haftaki yerim (önbellekten; yoksa arka planda çeker)
    standing() {
      const k = this.mode + '|week|' + this.week().key, c = hallCache.get(k);
      if (!c || Date.now() - c.t > 60000) { this.hall('week', this.week().key).then(() => emit(), () => {}); }
      return c && c.v ? c.v.me : null;
    },

    watch(board, char) { return cur.watch(board, char || null); },
    peek(board, char) { return cur.peek(board, char || null); },
    async top(board, o = {}) { const rows = await cur.watch(board, o.char || null); return rows.slice(0, o.limit || TOP_N); },
    mine(board, char) { return cur.mine(board, char || null); },
    async myBest(board, char) { await this.whenSettled(); return cur.mine(board, char || null); },
    rank(board, char, score) { return cur.rank(board, char || null, score); },
    names(ids) { return cur.names(ids); },

    // --- unvanlar (aylık turnuvanın ilk 3'ü) ve Şampiyon renkleri. Yerel / Claude tablolarında unvan yok (null).
    titleOf(pid) { return pid != null && cur.titleOf ? cur.titleOf(pid) : null; },
    // Kendi unvanım (sunucunun son cevabı; çevrimdışıyken önbellekten). CrazyGames hesabı: sunucu hesabı doğrulayınca
    // (ya da bu cihazdaki önbellek o hesaba aitken) görünür.
    myTitle() {
      if (!this._sbCfg || (this.accountPending() && !localData().acct)) return null;
      const t = localData().title;
      return t && typeof t === 'object' ? cleanTitle(t.place, t.wins, t.podiums) : null;
    },
    // Şampiyon renkleri açılmış ninjalar (sunucudan; önbellek)
    champNinjas() { return cleanChamp(localData().champ); },
    titleLabel, titleEl,
    // Yeni gelen unvan / Şampiyon renkleri için bir kez duyuru (ilk görüldüğünde); yeni renkler kendiliğinden giyilir
    _announce() {
      const L = localData(), B = TT(), champ = cleanChamp(L.champ);
      const seen = cleanChamp(L.champSeen), fresh = champ.filter((c) => !seen.includes(c));
      const msgs = [];
      if (fresh.length) {
        if (!L.champUse || typeof L.champUse !== 'object') L.champUse = {};
        for (const c of fresh) {
          L.champUse[c] = true;
          const ch = ND.CHARS.find((x) => x.id === c);
          if (B.unlocked) msgs.push(B.unlocked(ch ? ch.name : c));
        }
        L.champSeen = cleanChamp(seen.concat(fresh));
      }
      const t = cleanTitle(L.title && L.title.place, 0, 1), was = int(L.titleSeen, 1, 3);
      if (t && (!was || t.place < was)) {
        if (!fresh.length && B.newTitle) msgs.push(B.newTitle(titleLabel({ place: t.place, wins: 1, podiums: 1 })));
        L.titleSeen = t.place;
      }
      localCommit();
      if (msgs.length && ND.toast) msgs.forEach((m, i) => setTimeout(() => { try { ND.toast(m, '覇', '#ffd35a'); } catch (e) { /* yok */ } }, 400 + i * 2600));
      if (msgs.length) this._askSave();
      if (fresh.length && ND.game && ND.game.phase === 'select' && ND.game.refreshSelect) ND.game.refreshSelect();
    },

    // --- bağdaştırıcı yönetimi
    registerAdapter(name, factory) { if (typeof factory === 'function') factories[name] = factory; },
    async use(name) {
      if (name === 'local') return this.useLocal();
      const f = factories[name]; if (!f) return false;
      const tok = ++connTok; this._set('loading');
      let ad = null; try { ad = await f(); } catch (e) { ad = null; }
      if (tok !== connTok) return false;
      if (!ad) { this._switch(localAdapter, 'local'); return false; }
      this._switch(ad, name, ad.readonly ? 'readonly' : 'online'); return true;
    },
    useLocal() { connTok++; this._mock = null; this._sbCfg = null; this._switch(localAdapter, 'local'); return true; },
    // Test: sahte çalışma zamanı → 'claude' bağdaştırıcısı onun üstünde çalışır
    //   useMock({ users, latency, canWrite, can, runtime:false (null çalışma zamanı), meScore:{ arcade: 12000 } })
    useMock(opts) { const rt = mockRuntime(opts); this._mock = rt; this.connect(rt, 'mock'); return rt; },
    // Supabase: cfg = { url, key, fetch?, label? }. Sunucuya ulaşılamazsa yerel + 'offline' (retryOnline ile yeniden denenir)
    useSupabase(cfg) {
      const tok = ++connTok;
      if (cur !== localAdapter && cur.close) cur.close();
      cur = localAdapter; this.mode = 'local'; this.uid = null; this._sbCfg = cfg; this._mock = null;
      this._set('loading');
      settled = new Promise((r) => { settleRes = r; });
      const ad = supabaseAdapter(cfg);
      return (async () => {
        try { await ad.init(); } catch (e) {
          if (tok !== connTok) return false;
          this.lastError = (e && e.code) || 'network';
          this._switch(localAdapter, 'local', 'offline');
          if (this._acctTok) this._acctRun(); // the account waits for the server: say it cannot be reached now
          return false;
        }
        if (tok !== connTok) return false;
        this.lastError = null; this.hallClear();
        this._switch(ad, cfg.label || 'supabase', 'online');
        if (this._acctTok) this._acctRun();
        this.flush();
        return true;
      })();
    },
    // Test: sahte Supabase sunucusu (js/sb-mock.js yüklü olmalı). Sahte sunucuyu döndürür (saat, ağ kesintisi… denetimi).
    useSupabaseMock(opts) {
      if (!ND.sbMock) throw new Error('js/sb-mock.js yüklü değil');
      const srv = ND.sbMock.create(opts || {});
      this.useSupabase({ url: 'https://mock.supabase.co', key: 'sb_publishable_mock', fetch: srv.fetch, label: 'supabase' });
      return srv;
    },
    retryOnline() { if (this._sbCfg && cur === localAdapter && this.status === 'offline') return this.useSupabase(this._sbCfg); return Promise.resolve(cur !== localAdapter); },
    // Sunucu saatini ve dönemi (ay), unvanları ve kendi unvanımı tazele (salon açılınca)
    async refresh() {
      if (cur.ping) { try { await cur.ping(); } catch (e) { /* yok */ } }
      if (cur.loadTitles) cur.loadTitles(true).catch(() => null);
      if (cur.refreshMe) cur.refreshMe();
      return this.retryOnline();
    },

    // claude.ai çalışma zamanı: window.claude yalnız use() taşır; namespace sonradan gelir (ya da null)
    connect(rt, label) {
      const tok = ++connTok;
      if (cur !== localAdapter && cur.close) cur.close();
      cur = localAdapter; this.mode = 'local'; this.uid = null; this._sbCfg = null;
      this._set('loading');
      settled = new Promise((r) => { settleRes = r; });
      (async () => {
        let db = null, user = null;
        try { [db, user] = await Promise.all([rt.use('db'), rt.use('user')]); } catch (e) { db = null; }
        if (tok !== connTok) return;
        if (!db) { this._switch(localAdapter, 'local'); return; }
        const ad = claudeAdapter(db, user);
        try { await ad.init(); } catch (e) { /* salt okunur kalır */ }
        if (tok !== connTok) { ad.close(); return; }
        ad.mode = label || 'claude';
        this.hallClear();
        this._switch(ad, label || 'claude', ad.readonly ? 'readonly' : 'online');
        this.uid = ad.uid;
      })();
    },
    _switch(ad, mode, status) {
      if (cur !== ad && cur !== localAdapter && cur.close) cur.close();
      cur = ad; this.mode = mode; this.ready = true; this.uid = ad.uid || null;
      this._set(status || (ad === localAdapter ? 'local' : 'online'));
      if (settleRes) settleRes();
    },
    _set(st) { if (this.status !== st) { this.status = st; } emit(); },
    _fail(reason) { this.lastError = reason; this._switch(localAdapter, 'local', 'error'); },
    statusText() {
      const T = S().status || {};
      if (this.status === 'online' && this._viewOnly()) return T.readonly || '';
      return T[this.status] || '';
    },
    statusKey() { return this.status === 'online' && this._viewOnly() ? 'readonly' : this.status; },
    // Monthly titles and Champion colors are given by the server (Supabase nd_titles) to scores it holds: only an
    // online Supabase connection whose scores are sent counts. Not on Poki / offline / local (no network), the
    // claude.ai host, or for a signed-in CrazyGames player whose account our server has not verified (_viewOnly).
    titlesEarnable() { return cur.name === 'supabase' && this.status === 'online' && !this._viewOnly(); },
    // CrazyGames hesabı: sunucu hesabı doğrulayana dek (cg-session) skor yalnız bu cihazda (tablo yalnızca görüntülenir)
    _viewOnly() { return !!cur.readonly || (this.accountPending() && cur.name === 'supabase'); },

    init() {
      const rt = typeof window !== 'undefined' && window.claude;
      if (rt && typeof rt.use === 'function') return this.connect(rt, 'claude');
      const C = ND.CONFIG || {};
      const url = typeof C.SUPABASE_URL === 'string' ? C.SUPABASE_URL.trim() : '', key = typeof C.SUPABASE_ANON_KEY === 'string' ? C.SUPABASE_ANON_KEY.trim() : '';
      if (ND.platform.allowNetwork && /^https:\/\/[^\s/?#]+\/?$/i.test(url) && key.length >= 20 && !isSecretKey(key)) {
        this.useSupabase({ url, key });
      } else this._switch(localAdapter, 'local');
      // The claude.ai host may define window.claude after the page's first script run: look again for ~10 s
      let tries = 0;
      const again = () => {
        const r = typeof window !== 'undefined' && window.claude;
        if (r && typeof r.use === 'function') { if (!this._mock && this.mode !== 'claude') this.connect(r, 'claude'); return; }
        if (++tries < 40) setTimeout(again, 250);
      };
      setTimeout(again, 250);
    },
  };

  // Gizli anahtar (service_role / sb_secret_) asla kullanılmaz: tarayıcıda herkes görür, veritabanını tamamen açar
  function isSecretKey(key) {
    if (/^sb_secret_/.test(key) || /service_role/.test(key)) return true;
    const m = /^eyJ[^.]*\.([^.]+)\./.exec(key); // eski JWT anahtar: gövdedeki "role" alanına bak
    if (!m) return false;
    try { const j = JSON.parse(atob(m[1].replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((m[1].length + 3) % 4))); return j && j.role !== 'anon'; } catch (e) { return true; }
  }
  LB.isSecretKey = isSecretKey;

  // ---------------------------------------------------------------- giden kutusu (outbox)
  function outAlive(it) {
    if (!it || !it.b || !it.e) return false;
    const p = parseBoard(it.b); if (!p) return false;
    if (Date.now() - (it.t || 0) > 3 * DAY) return false;
    if (p.base !== 'weekly') return true;
    const w = LB.week();
    return p.id === w.id || (p.id === prevPeriod(w).id && LB.now() < w.start + 15 * 60000);
  }
  function outAdd(b, e) {
    const L = localData();
    if (!Array.isArray(L.out)) L.out = [];
    if (L.out.some((x) => x && x.b === b && x.e && x.e.char === e.char && x.e.score >= e.score)) return;
    L.out = L.out.filter((x) => !(x && x.b === b && x.e && x.e.char === e.char));
    L.out.push({ b, e, t: Date.now() });
    while (L.out.length > OUT_MAX) L.out.shift();
    localCommit();
  }
  function outDrop(b, e) {
    const L = localData(); if (!Array.isArray(L.out) || !L.out.length) return;
    const n = L.out.length;
    L.out = L.out.filter((x) => !(x && x.b === b && x.e && x.e.char === e.char && x.e.score <= e.score));
    if (L.out.length !== n) localCommit();
  }
  function scheduleFlush(ms) {
    clearTimeout(flushT);
    flushT = setTimeout(() => { if (LB.status === 'offline') LB.retryOnline(); else LB.flush(); }, ms);
  }

  // ================================================================ EKRAN: ND.lbUI
  const UI = ND.lbUI = {
    G: null, open: false, board: 'arcade', char: null, back: null, names: {}, rtok: 0,

    init(G) {
      this.G = G;
      $('lbClose').onclick = () => this.close();
      // bağdaştırıcı değişince (ör. claude çalışma zamanı geç geldi) açık sorguyu yeni bağdaştırıcıda bir kez aç
      LB.onChange(() => {
        if (this.panelNameRefresh) this.panelNameRefresh();
        if (!this.open) return;
        if (this._ad !== LB.adapter) { this._ad = LB.adapter; LB.watch(this.board, this.char); }
        this.render();
      });
      const list = $('lbList');
      if (list) list.addEventListener('keydown', (e) => e.stopPropagation(), false);
    },

    // board: 'arcade' | 'cpu_efsane'; opts.back: kapatınca çağrılır (yoksa ana menü)
    show(board, opts = {}) {
      this.open = true; this.back = opts.back || null;
      if (board && BOARD_IDS.includes(board)) this.board = board;
      if (opts.char !== undefined) this.char = opts.char;
      $('lb').hidden = false;
      this.buildTabs(); this.buildChips();
      this.select(this.board, this.char);
      setTimeout(() => { if (this.open) { const t = document.querySelector('#lbTabs [aria-selected="true"]'); (t || $('lbClose')).focus(); } }, 0);
    },
    close() {
      if (!this.open) return;
      this.open = false; $('lb').hidden = true;
      if (ND.audio) ND.audio.ui();
      const b = this.back; this.back = null;
      if (b) b(); else if (this.G) this.G.goMenu();
    },
    select(board, char) {
      this.board = board; this.char = char || null;
      this._ad = LB.adapter;
      LB.watch(this.board, this.char); // sorgu başına tek abonelik (değişince); render yalnız okur
      document.querySelectorAll('#lbTabs [data-b]').forEach((t) => { const on = t.dataset.b === this.board; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      document.querySelectorAll('#lbChips [data-c]').forEach((c) => c.setAttribute('aria-pressed', String((c.dataset.c || null) === this.char)));
      const ch = document.querySelector('#lbChips [aria-pressed="true"]');
      if (ch && ch.scrollIntoView) { try { ch.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { /* yok */ } }
      this.render();
    },
    chars() { return ND.CHARS.filter((c) => !c.hidden || (ND.save && ND.save.isCharUnlocked(c.id))); },
    buildTabs() {
      const box = $('lbTabs'), T = S();
      box.textContent = '';
      for (const b of BOARD_IDS) {
        const t = document.createElement('button');
        t.type = 'button'; t.className = 'lb-tab'; t.dataset.b = b; t.setAttribute('role', 'tab');
        const k = document.createElement('b'); k.textContent = BOARDS[b].k; k.setAttribute('aria-hidden', 'true');
        const sp = document.createElement('span'); sp.textContent = (T.boards && T.boards[b]) || b;
        t.append(k, sp);
        t.onclick = () => { if (ND.audio) ND.audio.ui(); this.select(b, this.char); };
        box.appendChild(t);
      }
    },
    buildChips() {
      const box = $('lbChips'), T = S();
      box.textContent = '';
      const add = (id, label, kanji, color) => {
        const c = document.createElement('button');
        c.type = 'button'; c.className = 'chip lb-chip'; c.dataset.c = id || '';
        if (kanji) { const k = document.createElement('b'); k.textContent = kanji; if (color) k.style.color = color; c.appendChild(k); c.title = label; c.setAttribute('aria-label', label); }
        else c.textContent = label;
        c.onclick = () => { if (ND.audio) ND.audio.ui(); this.select(this.board, id); };
        box.appendChild(c);
      };
      add(null, ND.i18n ? ND.i18n.t(T.all || 'Tümü') : T.all || 'Tümü');
      for (const ch of this.chars()) add(ch.id, ch.name, ch.kanji, ch.col.ui);
    },
    cycleBoard(d) { const i = BOARD_IDS.indexOf(this.board); this.select(BOARD_IDS[(i + d + BOARD_IDS.length) % BOARD_IDS.length], this.char); if (ND.audio) ND.audio.ui(); },
    cycleChar(d) {
      const ids = [null].concat(this.chars().map((c) => c.id));
      const i = ids.indexOf(this.char);
      this.select(this.board, ids[(i + d + ids.length) % ids.length]); if (ND.audio) ND.audio.ui();
    },

    render() {
      const T = S(), st = $('lbStatus');
      st.textContent = LB.statusText(); st.dataset.st = LB.statusKey();
      $('lbDesc').textContent = (T.boardDesc && T.boardDesc[this.board]) || '';
      const P = LB.peek(this.board, this.char), list = $('lbList');
      list.textContent = '';
      list.setAttribute('aria-busy', String(!!P.loading));
      const rows = P.rows;
      if (!rows.length) {
        const p = document.createElement('p'); p.className = 'lb-empty';
        p.textContent = P.loading ? (T.status && T.status.loading) || '' : P.error ? (T.loadErr || '') : (T.empty || '');
        list.appendChild(p);
      }
      rows.forEach((r, i) => list.appendChild(this.row(r, r.rank || i + 1)));
      // benim satırım: ilk 20'de yoksa altta sabit
      const meBox = $('lbMe'); meBox.textContent = ''; meBox.hidden = true;
      const mine = LB.mine(this.board, this.char);
      const inTop = rows.some((r) => r.me);
      if (mine && !inTop) {
        const tok = ++this.rtok;
        const put = (rk) => { if (tok !== this.rtok || !this.open) return; meBox.textContent = ''; meBox.appendChild(this.row(Object.assign({}, mine, { me: true }), rk)); meBox.hidden = false; };
        if (mine.rank) put(mine.rank);
        else { put(null); LB.rank(this.board, this.char, mine.score).then((rk) => put(rk)); }
      }
      this.renderFoot();
      this.fillNames();
    },
    row(r, rank) {
      const T = S(), el = document.createElement('div');
      el.className = 'lb-row' + (r.me ? ' me' : '') + (rank && rank <= 3 ? ' top' + rank : '');
      el.setAttribute('role', 'row');
      const cell = (cls, text) => { const s = document.createElement('span'); s.className = cls; s.setAttribute('role', 'cell'); s.textContent = text; el.appendChild(s); return s; };
      cell('rk', rank ? String(rank) : '…');
      const nm = cell('nm', '');
      if (r.name) nm.textContent = r.name;
      else if (r.uid) { nm.dataset.uid = r.uid; nm.textContent = this.names[r.uid] || (r.me ? T.you || '' : '…'); }
      else nm.textContent = r.me ? LB.getName() || T.you || '' : T.you || '';
      const ds = danShort(r.me ? (r.dan || myDan()) : r.dan);
      if (ds) { const d = document.createElement('em'); d.className = 'dn'; d.textContent = ds; nm.appendChild(d); }
      const tt = titleEl(r.title); if (tt) nm.appendChild(tt);
      if (r.me) { const y = document.createElement('i'); y.textContent = T.youTag || ''; nm.appendChild(y); }
      const ch = ND.CHARS.find((c) => c.id === r.char);
      const k = cell('ck', ch ? ch.kanji : '?');
      if (ch) { k.style.color = ch.col.ui; k.title = ch.name; }
      cell('sc', fmtNum(r.score));
      cell('tm', fmtTime(r.time));
      cell('dt', fmtDate(r.date));
      return el;
    },
    // Adlar render anında çözülür (profiles her çağrıda ucuz); yalnız textContent
    fillNames() {
      const ids = [...new Set([...document.querySelectorAll('#lb [data-uid]')].map((e) => e.dataset.uid))];
      if (!ids.length) return;
      const T = S();
      LB.names(ids).then((m) => {
        if (!this.open) return;
        for (const id of ids) if (m[id] !== undefined) this.names[id] = cleanName(m[id]) || '';
        document.querySelectorAll('#lb [data-uid]').forEach((e) => {
          if (this.names[e.dataset.uid] === undefined) return;
          const me = e.parentNode && e.parentNode.classList.contains('me');
          const tags = [...e.querySelectorAll('i, em, b.ttl')];
          e.textContent = this.names[e.dataset.uid] || (me ? T.you : T.player) || '';
          tags.forEach((t) => e.appendChild(t));
        });
      });
    },
    renderFoot() {
      const T = S(), f = $('lbFoot');
      f.textContent = '';
      if (LB.nameLocked || LB.adapter.needsName) f.appendChild(this.nickLine(() => this.render()));
      const k = document.createElement('small'); k.className = 'lb-keys';
      k.innerHTML = ND.STR && ND.STR.pickT ? ND.STR.pickT(T.keys || '', '') : T.keys || ''; // tablodaki güvenilir HTML
      f.appendChild(k);
    },
    // "Takma ad: X [Değiştir]" satırı (klasik tablo + salon altlığı)
    nickLine(after) {
      const T = S(), box = document.createElement('span'); box.className = 'nick-line';
      const nm = LB.getName();
      const lab = document.createElement('span'); lab.textContent = (LB.nameLocked ? 'CrazyGames' : T.nick || '') + ': ';
      const v = document.createElement('b'); v.textContent = nm || '—';
      if (LB.nameLocked) { box.append(lab, v); return box; }
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'mini'; btn.textContent = nm ? T.nickEdit : T.nickSave;
      btn.onclick = () => { box.textContent = ''; const fm = this.nickForm(() => { fm.remove(); if (after) after(); }, true); box.appendChild(fm); };
      box.append(lab, v, btn);
      return box;
    },
    // Takma ad formu: 3–16 karakter, kurallar + küfür denetimi (istemci + sunucu); hata mesajı formun altında
    nickForm(done, focus) {
      if (LB.nameLocked) return this.nickLine();
      const T = S(), form = document.createElement('form');
      form.className = 'nick';
      const inp = document.createElement('input');
      inp.type = 'text'; inp.maxLength = 16; inp.placeholder = T.nickPh || ''; inp.autocomplete = 'off'; inp.spellcheck = false;
      inp.setAttribute('enterkeyhint', 'done'); inp.setAttribute('aria-label', T.nick || '');
      inp.value = LB.getName();
      const err = document.createElement('small'); err.className = 'nick-err'; err.setAttribute('role', 'alert');
      let busy = false;
      // oyun tuşları (A/D/F…) yazmayı engellemesin: olay pencereye ulaşmadan dursun
      const save = async () => {
        if (busy) return;
        busy = true; b.disabled = true; err.textContent = '';
        const r = await LB.saveName(inp.value);
        busy = false; b.disabled = false;
        if (r.ok) { inp.blur(); if (ND.audio) ND.audio.ui(); done && done(r.name, r); }
        else { err.textContent = (T.nickErr && T.nickErr[r.code]) || T.nickErrDef || ''; inp.focus(); if (ND.audio && ND.audio.tick) ND.audio.tick(0); }
      };
      inp.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') inp.blur();
        else if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); save(); }
      });
      inp.addEventListener('keyup', (e) => e.stopPropagation());
      inp.addEventListener('input', () => { err.textContent = ''; });
      const b = document.createElement('button'); b.type = 'submit'; b.className = 'mini'; b.textContent = T.nickSave || 'OK';
      form.append(inp, b);
      if (ND.privacy) form.appendChild(ND.privacy.link('both')); // js/privacy.js: the policy page, new tab
      form.appendChild(err);
      form.onsubmit = (e) => { e.preventDefault(); save(); };
      if (focus) setTimeout(() => inp.focus(), 0);
      return form;
    },

    // Gönderim sonucunu sade cümleye çevir
    resultText(r) {
      const T = S();
      if (!r) return '';
      if (r.stored === 'online' || (r.ok && r.stored !== 'local')) {
        if (!r.rank) return T.savedOnlineNoRank || '';
        return r.gap > 0 && T.savedOnlineGap ? T.savedOnlineGap(r.rank, fmtNum(r.gap)) : T.savedOnline(r.rank);
      }
      if (r.ok) return r.rank ? T.savedLocal(r.rank) : T.savedLocal(null);
      if (r.reason === 'readonly' && LB.nameLocked && T.savedLocalAccount) return T.savedLocalAccount(r.rank);
      const R = T.reason || {};
      if (R[r.reason]) return typeof R[r.reason] === 'function' ? R[r.reason](r) : R[r.reason];
      if (r.reason === 'readonly' || r.reason === 'rejected' || r.reason === 'error') return LB.mode === 'local' ? T.savedLocal(r.rank) : T.rejected;
      if (r.reason === 'quota') return T.quota;
      return r.rank ? T.savedLocal(r.rank) : '';
    },

    // Bitiş ekranı paneli: otomatik gönder, sonucu + sırayı göster; takma ad yoksa tek dokunuşla sor
    //   opts: { back, onOpen, onResult, openLabel, open: () => void (varsayılan: klasik tablo) }
    panel(el, board, entry, opts = {}) {
      if (!el) return;
      const T = S();
      el.hidden = false; el.textContent = '';
      const st = document.createElement('span'); st.className = 'lbp-st'; st.textContent = T.saving || '';
      const open = document.createElement('button'); open.type = 'button'; open.className = 'mini lbp-open';
      open.textContent = opts.openLabel || T.open || '';
      open.onclick = () => { if (opts.onOpen) opts.onOpen(); if (opts.open) opts.open(); else this.show(board, { back: opts.back, char: null }); };
      el.append(st, open);
      if (opts.noOpen) open.hidden = true;
      const tok = (this.ptok = (this.ptok || 0) + 1);
      const identity = document.createElement('span'); identity.className = 'lbp-identity';
      el.insertBefore(identity, open);
      let result = null, identityKey = null;
      this.panelNameRefresh = () => {
        if (tok !== this.ptok || !el.isConnected || !result) return;
        const key = [LB.nameLocked, LB.getName(), LB.needsName(), LB.online, result.reason].join('|');
        if (key === identityKey) return;
        identityKey = key; identity.textContent = '';
        if (LB.nameLocked) { identity.appendChild(this.nickLine()); return; }
        if (!LB.needsName() && result.reason !== 'needName') return;
        const ask = document.createElement('span'); ask.className = 'lbp-ask';
        ask.textContent = LB.online ? T.nickAskOnline || T.nickAsk || '' : T.nickAsk || '';
        const form = this.nickForm(() => {
          identity.textContent = '';
          const rr = LB.resultFor(board, entry.date);
          if (rr && tok === this.ptok) { result = rr; show(rr); }
        }, false);
        identity.append(ask, form);
      };
      const show = (r) => {
        st.textContent = this.resultText(r);
        el.dataset.st = r && (r.stored === 'online' || (r.ok && LB.online)) ? 'online' : r && r.reason && LB.mode !== 'local' && !(r.reason === 'readonly' && LB.nameLocked) ? 'warn' : 'local';
      };
      LB.submit(board, entry).then((r) => {
        if (tok !== this.ptok) return;
        result = r;
        show(r);
        this.panelNameRefresh();
        if (opts.onResult) opts.onResult(r);
      });
    },

    onKey(e) {
      if (!this.open) return false;
      const ae = document.activeElement;
      if (ae && ae.tagName === 'INPUT') return false;
      // e.code boş gelebilir (bazı sanal klavyeler / otomasyon): e.key'e düş
      const code = e.code || ({ ' ': 'Space', Esc: 'Escape', Left: 'ArrowLeft', Right: 'ArrowRight', Up: 'ArrowUp', Down: 'ArrowDown' }[e.key] || e.key || '');
      if (e.repeat && (code === 'Escape' || code === 'Backspace')) return true;
      if (ND.input && ND.input.isBack ? ND.input.isBack(e) : code === 'Backspace') { this.close(); return true; }
      switch (code) {
        case 'ArrowLeft': case 'KeyA': this.cycleBoard(-1); this.focusTab(); return true;
        case 'ArrowRight': case 'KeyD': this.cycleBoard(1); this.focusTab(); return true;
        case 'ArrowUp': case 'KeyW': this.cycleChar(-1); return true;
        case 'ArrowDown': case 'KeyS': this.cycleChar(1); return true;
        case 'PageDown': $('lbList').scrollBy(0, 160); return true;
        case 'PageUp': $('lbList').scrollBy(0, -160); return true;
        case 'Enter': case 'Space': case 'NumpadEnter':
          if (ae && ae !== document.body && $('lb').contains(ae) && typeof ae.click === 'function') { ae.click(); return true; }
          return true;
      }
      return false; // Tab vb. tarayıcıya kalsın
    },
    focusTab() { const t = document.querySelector('#lbTabs [aria-selected="true"]'); if (t) t.focus(); },
    onPad(st, prev) {
      const pr = (a) => st[a] && !prev[a];
      if (pr('left')) this.cycleBoard(-1);
      else if (pr('right')) this.cycleBoard(1);
      if (pr('light') || pr('guard')) this.cycleChar(1);
      else if (pr('heavy')) this.cycleChar(-1);
      if (pr('kick')) this.close();
    },
  };
})(window.ND);
