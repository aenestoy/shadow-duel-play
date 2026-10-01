// Shadow Duel — ranked duel (online phase 2; docs/SHADOW-DUEL-ONLINE.md "Aşama 2", supabase/ranked.sql)
//
// Flow: main menu → "Ranked duel" → home (tier, rating, season) → Find opponent → queue (the server pairs players:
// nd_rank_join, then nd_rank_poll every 2 s; no Realtime) → "Opponent found" (12 s to accept; the direct connection is
// set up behind it, offer / answer through the match row: nd_rank_signal) → blind pick of an UNLOCKED fighter (15 s;
// nd_rank_pick) → the server reveals both picks, the arena and the seed → the match (js/net.js, the same rollback loop
// as "Play with a friend", best of 3) → both devices report (nd_rank_report) → the result once the server confirms.
// Honest results: every 15 s a checkpoint (confirmed step, fingerprint, input digests; nd_rank_beat), and a report at
// the end; points move only when both reports agree (the server's decision table). The leaver loses.
// Guests (a CrazyGames player who is not signed in, or a player without a nickname on our site) play in the same queue,
// unranked; "Sign in to earn points" opens CrazyGames' own sign-in only when pressed.
// While searching, after 20 s: a warm-up fight against the CPU, clearly labelled CPU and unranked; never a bot shown as
// a person. No ads from the queue to the end of the match (ND.ads is held). Hall of Champions: a "Ranked" tab.
// Not in the offline portal builds (index.html data-online; vite.config.ts leaves this file out).
// Test hooks: ND.ranked.state(), window.__ndRankReport (res → res, before a report is sent), ND.ranked.demo(screen).
(function (ND) {
  'use strict';
  const G = ND.game, NET = ND.net;
  if (!G || !NET) return;
  const $ = (id) => document.getElementById(id);
  const C = ND.CONFIG || {};
  const PROTO = 1;                               // ranked protocol (tickets carry it; only equal ones pair)
  const POLL_MS = 2000, POLL_FIRST = 1500, POLL_MATCH = 1000, BEAT_MS = 15000, WARM_AFTER = 20000, QUEUE_MAX = 10 * 60 * 1000;
  const GATHER_MS = 1500, CONNECT_MS = 14000, RESULT_MS = 150000, VS_MS = 2600;
  const ARENAS = ['temple', 'rain', 'snow', 'village', 'market', 'waterfall', 'castle'];
  const TR = {
    title: 'Dereceli düello', menuSub: 'Rastgele rakip · puan, kademe ve sezon', offline: 'Dereceli şu an kapalı',
    season: (n) => `Sezon ${n}`, endsIn: (d) => `Bitmesine ${d} gün`, endsToday: 'Bugün bitiyor',
    rating: 'Puan', record: (w, l, d) => `${w} G · ${l} M` + (d ? ` · ${d} B` : ''), placement: (a, b) => `Yerleştirme ${a}/${b}`,
    place: (n) => `Sıralamada ${n}.`, find: 'Rakip ara', findUnranked: 'Rakip ara (puansız)', board: 'Sıralama', how: 'Nasıl çalışır?',
    howLines: ['Sunucu sana yakın puanlı bir rakip bulur; beklerken aralık genişler.', 'İkiniz de kabul edince birbirinizi görmeden dövüşçü seçersiniz (yalnız açtığın dövüşçüler).',
      '3 raunttan 2’sini alan kazanır. Maçtan çıkan kaybeder.', 'Puan yalnız iki cihaz aynı sonucu bildirince değişir. Sezon 4 hafta; 1. olan özel kostüm alır.'],
    reward: 'Sezonun 1.’si: özel kostüm ve Şampiyonlar Salonu’nda adı',
    signIn: 'Puan kazanmak için giriş yap', guestNote: 'Misafir olarak puansız oynarsın.', nickNote: 'Puanlı oynamak için bir takma ad seç.',
    back: 'Geri', you: 'Sen', titleLbl: 'Unvan', noTitle: 'Yok',
    searching: 'Rakip aranıyor…', window: (n) => `Puan aralığı ±${n}`, windowAny: 'Her puan aralığı', people: (n, m) => `Şu an ${n} kişi arıyor · son 1 saatte ${m} maç`,
    warm: 'Beklerken CPU ile ısın', warmTag: 'Isınma · CPU · puansız', searchShort: 'Aranıyor', warmBack: 'Aramaya dön', cancel: 'Vazgeç',
    none: 'Şu an rakip yok.', foundTitle: 'Rakip bulundu!', accept: 'Kabul et', decline: 'Reddet',
    ranked: 'Puanlı', unranked: 'Puansız · puan değişmez',
    why: { guest: 'bir oyuncu misafir', same_network: 'aynı ağdasınız', pair_limit: 'bugün bu rakiple 3 puanlı maç yaptın', daily_limit: 'günlük puanlı maç sınırı' },
    waitOpp: 'Rakibin kabulü bekleniyor…', touch: 'Dokunmatik', keys: 'Klavye / kol', placementTag: 'Yerleştirme', guestTag: 'Misafir',
    declined: 'Rakip kabul etmedi · yeniden aranıyor', youDeclined: 'Maçı reddettin.', penalty: (s) => `Son maçları reddettin: ${s} sn sonra tekrar arayabilirsin.`,
    suspended: 'Dereceli hesabın incelemede (çok anlaşmazlık). Normal modlar açık.',
    pickTitle: 'Dövüşçünü seç', pickSub: 'Rakibin seçimini göremez', lock: 'Seç', lockedIn: 'Seçildi', oppPicking: 'Rakip seçiyor…', oppLocked: 'Rakip seçti',
    lockedFighter: 'Tek oyunculu modda açılmadı', costume: 'Kostüm', plain: 'Asıl renkler',
    connecting: 'Rakibe bağlanılıyor…', noConnect: 'Rakibe bağlanılamadı; maç sayılmadı. Yeniden aranıyor…',
    leaveQ: 'Maçtan çıkılsın mı?', leaveSub: 'Bu dereceli maçı kaybedersin.', stay: 'Oynamaya devam et', leave: 'Çık',
    waitIn: (s) => `Rakip bekleniyor… ${s}`, away: (s) => `Rakip oyundan başka bir yere geçti… ${s}`, turning: (s) => `Rakip telefonunu çeviriyor… ${s}`, paused: 'Duraklatıldı',
    confirming: 'Sonuç onaylanıyor…', win: 'Kazandın', lose: 'Kaybettin', draw: 'Berabere', over: 'Maç bitti',
    delta: (d) => (d >= 0 ? '+' : '−') + Math.abs(d) + ' puan', nc: 'Bu maç sayılmadı', disputed: 'İki cihaz farklı sonuç bildirdi: maç incelemede, puan değişmedi.',
    ncWhy: { desync: 'bağlantı sorunu yüzünden iki cihaz farklı hesapladı', connection: 'iki tarafın da bağlantısı koptu', input_mismatch: 'iki cihazın tuş kayıtları uyuşmadı', abandoned: 'iki taraf da ayrıldı', no_second_report: 'rakibin sonucu gelmedi', mixed: 'sonuçlar uyuşmadı' },
    promoted: 'Terfi!', demoted: 'Kademe düştü', placementDone: 'Yerleştirme bitti!', pending: 'Sonuç birazdan sıralamada görünecek.',
    findAgain: 'Tekrar ara', rematch: 'Rövanş', rematchWait: 'Rakip bekleniyor…', rematchAsk: 'Rövanş (rakip istiyor)', menu: 'Menü',
    youLeft: 'Maçtan çıktın: yenilgi.', oppLeft: 'Rakip maçtan çıktı: sen kazandın.', silent: 'Rakibin bağlantısı koptu.', rounds: (a, b) => `Raund ${a} – ${b}`,
    unrankedNote: 'Puansız maç',
    hallTab: 'Dereceli', hallDesc: (g) => `Bu sezonun en iyileri · sıralamaya girmek için ${g} puanlı maç`, champs: 'Şampiyonlar', champOf: (n) => `Sezon ${n} şampiyonu`,
    noChamps: 'Henüz sezon şampiyonu yok.', me: (p) => `Senin yerin: ${p}.`, meNone: 'Sıralamaya girmek için puanlı maç oyna.', empty: 'Bu sezon henüz kimse sıralamada değil.',
    tierDesc: ['Ayak askeri', 'Efendisiz samuray', 'Samuray', 'Sancak muhafızı', 'Derebeyi', 'Şogun'],
    err: { network: 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.', bad_version: 'Oyunun yeni sürümü var: sayfayı yenile.', busy: 'Kuyruk çok dolu, birazdan tekrar dene.',
      rate_limited: 'Çok sık denedin, biraz bekle.', disabled: 'Dereceli şu an kapalı.', banned: 'Bu hesap dereceli oynayamaz.', other: 'Bir sorun oldu, tekrar dene.' },
  };
  const M = () => (ND.STR && ND.STR.ranked && typeof ND.STR.ranked.title === 'string' ? ND.STR.ranked : TR);

  // ---------------------------------------------------------------- tiers (supabase/ranked.sql nd_rank_tier_of)
  // 0 = Ashigaru III … 14 = Daimyō I, 15 = Shōgun. The kanji and names are the same in every language (lang="en").
  const TIERS = [['足軽', 'Ashigaru'], ['浪人', 'Rōnin'], ['侍', 'Samurai'], ['旗本', 'Hatamoto'], ['大名', 'Daimyō'], ['将軍', 'Shōgun']];
  const TCOL = ['#9aa3ad', '#8fb3c9', '#d9b36c', '#e38b5c', '#c65bd0', '#ffd35a'];
  const DIV = ['', 'I', 'II', 'III'];
  function tierInfo(i) {
    i = Math.max(0, Math.min(15, i | 0));
    const t = i === 15 ? 5 : Math.floor(i / 3), d = i === 15 ? 0 : 3 - (i % 3);
    return { t, d, k: TIERS[t][0], n: TIERS[t][1] + (d ? ' ' + DIV[d] : ''), col: TCOL[t], desc: (M().tierDesc || TR.tierDesc)[t] };
  }
  function tierFloor(i) { return i <= 0 ? -Infinity : i === 1 ? 1117 : i === 2 ? 1183 : i >= 15 ? 2050 : 1250 + 200 * Math.floor((i - 3) / 3) + [0, 67, 133][(i - 3) % 3]; }
  // a tier badge element: 侍 Samurai II (or "Placement" while placements are left)
  function badge(tier, placement, small) {
    const b = document.createElement('span');
    b.className = 'rk-badge' + (small ? ' sm' : '');
    if (placement > 0 || tier == null) { b.classList.add('pl'); b.textContent = M().placementTag; return b; }
    const T = tierInfo(tier), k = document.createElement('b'), n = document.createElement('span');
    k.textContent = T.k; k.setAttribute('aria-hidden', 'true'); n.textContent = T.n; n.lang = 'en'; n.setAttribute('translate', 'no');
    b.style.setProperty('--tc', T.col); b.title = T.desc; b.append(k, n);
    return b;
  }

  // ---------------------------------------------------------------- the server (the leaderboard's Supabase adapter)
  const LB = () => ND.leaderboard;
  const adapter = () => { const L = LB(); const a = L && L.adapter; return a && a.name === 'supabase' && typeof a.rpc === 'function' ? a : null; };
  let demoOn = false; // (layout test only: ND.ranked.demo)
  const serverHas = () => { if (demoOn) return true; const a = adapter(); return !!(a && Array.isArray(a.features) && a.features.includes('ranked')); };
  function available() {
    const P = ND.platform || {};
    if (!P.allowNetwork || typeof RTCPeerConnection !== 'function') return false;
    return !!(ND.online && ND.online.available && ND.online.available());
  }
  const errCode = (e) => (e && e.code) || 'other';
  // a call with this device's key (the account session while signed in, else the device secret)
  async function call(fn, args, ms) {
    const a = adapter();
    if (!a) throw Object.assign(new Error('network'), { code: 'network' });
    if (a.authed) return a.authed(fn, (k) => Object.assign({ p_secret: k }, args || {}), ms || 9000);
    return a.rpc(fn, Object.assign({ p_secret: a.key() }, args || {}), ms || 9000);
  }
  const plain = (fn, args, ms) => { const a = adapter(); return a ? a.rpc(fn, args || {}, ms || 9000) : Promise.reject(Object.assign(new Error('network'), { code: 'network' })); };
  // who am I for ranked: 'account' (CrazyGames, verified), 'nick' (our site: device key + nickname), 'guest'
  function identity() {
    const L = LB(), a = adapter(), CG = ND.cgAccount;
    if (CG && CG.available) return a && a.acct ? 'account' : 'guest';
    if (L && L.nameLocked) return a && a.acct ? 'account' : 'guest';
    return a && a.pid ? 'nick' : 'guest';
  }
  const unlockedChars = () => (ND.save && ND.save.p && Array.isArray(ND.save.p.chars) ? ND.save.p.chars.filter((c) => typeof c === 'string').slice(0, 20) : ['akane', 'aoi', 'kuro', 'yuki']);
  function regionHint() {
    let z = '';
    try { z = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { z = ''; }
    if (/^America\/(Sao_Paulo|Argentina|Santiago|Bogota|Lima|Caracas|Montevideo|Asuncion|La_Paz|Guayaquil)/.test(z)) return 'SA';
    if (/^(America|US|Canada)\//.test(z)) return 'NA';
    if (/^(Australia|Pacific)\//.test(z)) return 'OC';
    if (/^Asia\/(Tokyo|Seoul|Shanghai|Hong_Kong|Taipei|Singapore|Kolkata|Calcutta|Jakarta|Bangkok|Manila|Ho_Chi_Minh|Kuala_Lumpur|Dhaka|Karachi|Almaty|Tashkent)/.test(z)) return 'AS';
    return 'EU';
  }
  const version = () => (LB() && LB().GAME_V) || '1.0';
  const charIdx = (id) => ND.CHARS.findIndex((c) => c.id === id);

  // ---------------------------------------------------------------- state
  let screen = null;          // 'home' | 'queue' | 'found' | 'pick' | 'vs' | 'match' | 'result' | null
  let me = null, stats = null, flashMsg = '', busyCall = false;
  let Q = null;               // the search: { ticket, since, polls, timer, warm, stopped }
  let X = null;               // the match: { view, id, side, timer, picked, look, conn, begun, report, result, ... }
  let K = null;               // the direct connection (kept over a rematch)
  let matchNo = 0, earlyGo = null;
  // the net loop's match number (0..255): from the server's match id, the same on both devices
  const numOf = (id) => (parseInt(String(id).slice(0, 2), 16) | 0) || 1;
  const later = (fn, ms) => setTimeout(fn, ms);

  // ads and the platform: never an ad from the queue to the end of the match
  const busy = () => !!(Q || (X && !X.done)) ;
  if (ND.ads) {
    const el = ND.ads.eligible.bind(ND.ads), ra = ND.ads.rewardedAvailable.bind(ND.ads);
    ND.ads.eligible = function () { return busy() ? false : el(); };
    ND.ads.rewardedAvailable = function () { return busy() ? false : ra(); };
  }
  const bridge = () => (window.NDPortal && window.NDPortal.rooms && window.NDPortal.rooms.available() ? window.NDPortal.rooms : null);
  function portalRoom(on) { const P = bridge(); if (!P) return; try { if (on) P.open('ranked-' + String(X && X.id || '').slice(0, 8), false); else P.close(); } catch (e) { /* SDK */ } }

  // ---------------------------------------------------------------- my profile
  async function loadMe() {
    try {
      const r = await call('nd_rank_me', {}, 8000);
      if (r && typeof r === 'object') {
        me = r;
        if (ND.rewards && !r.guest) ND.rewards.setOwned(r.player_id, r.owned);
      }
    } catch (e) { if (!me) me = null; }
    try { stats = await plain('nd_rank_stats', {}, 6000); } catch (e) { /* none */ }
    decorateEntry();
    if (screen === 'home') render();
  }

  // ---------------------------------------------------------------- the search
  async function find(keep) {
    if (busyCall) return;
    flashMsg = '';
    const ranked = identity() !== 'guest';
    busyCall = true;
    let r;
    try {
      r = await call('nd_rank_join', { p_ver: version(), p_proto: PROTO, p_region: regionHint(), p_chars: unlockedChars(),
        p_ranked: ranked, p_touch: !!(ND.touch && ND.touch.active), p_keep: keep || null }, 9000);
    } catch (e) {
      busyCall = false;
      flashMsg = (M().err || TR.err)[errCode(e)] || (M().err || TR.err).other;
      show('home');
      return;
    }
    busyCall = false;
    if (!r || r.ok !== true) {
      flashMsg = r && r.error === 'penalty' ? M().penalty(r.wait_s | 0) : r && r.error === 'suspended' ? M().suspended : (M().err || TR.err).other;
      show('home');
      return;
    }
    const since = Q && keep ? Q.since : Date.now();
    stopQueue();
    Q = { ticket: r.ticket, since, polls: 0, timer: 0, warm: false, ranked: !!r.ranked, window: 100, people: null };
    show('queue');
    schedulePoll(POLL_FIRST);
  }
  function schedulePoll(ms) { if (!Q) return; clearTimeout(Q.timer); const q = Q; Q.timer = later(() => { if (Q === q) pollQueue(); }, ms); }
  async function pollQueue() {
    const q = Q;
    if (!q) return;
    if (Date.now() - q.since > QUEUE_MAX) { stopQueue(true); flashMsg = M().none; show('home'); return; }
    let r = null;
    try { r = await call('nd_rank_poll', { p_ticket: q.ticket, p_match: null }, 8000); } catch (e) { r = null; }
    if (Q !== q) return;
    q.polls++;
    if (r && r.state === 'match' && r.match) { onFound(r.match); return; }
    if (r && r.state === 'gone') { find(); return; } // the ticket ran out (a hidden tab): search again
    if (r && r.state === 'search') {
      q.window = r.window; if (typeof r.searching === 'number') q.people = [r.searching, r.recent | 0];
    }
    if (screen === 'queue') renderQueue(); else renderBar();
    schedulePoll(Date.now() - q.since < 10000 ? POLL_FIRST : POLL_MS);
  }
  function stopQueue(tell) {
    if (!Q) return;
    clearTimeout(Q.timer);
    if (Q.warm) endWarm(false);
    Q = null;
    renderBar();
    if (tell) call('nd_rank_leave', {}, 6000).catch(() => {});
  }

  // ---------------------------------------------------------------- CPU warm-up while searching (labelled, unranked)
  function warmUp() {
    if (!Q || Q.warm) return;
    Q.warm = true;
    hideAll(); screen = null;
    const mine = unlockedChars().map(charIdx).filter((i) => i >= 0);
    const c1 = mine[(Math.random() * mine.length) | 0] || 0;
    let c2 = (Math.random() * 12) | 0; if (c2 === c1) c2 = (c2 + 1) % 12;
    warmStarting = true;
    try { G.newMatch('cpu', { c1, c2, arena: ARENAS[(Math.random() * ARENAS.length) | 0], seed: (Math.random() * 1e9) | 0 }); } finally { warmStarting = false; }
    renderBar();
  }
  let warmStarting = false;
  function endWarm(backToQueue) {
    if (!Q || !Q.warm) return;
    Q.warm = false;
    warmStarting = true;
    try { if (G.mode === 'cpu') G.start('attract'); } finally { warmStarting = false; }
    if (backToQueue) show('queue'); else renderBar();
  }

  // ---------------------------------------------------------------- found → accept
  function onFound(view) {
    const warm = Q && Q.warm;
    if (Q) { clearTimeout(Q.timer); if (warm) endWarm(false); }
    const since = Q ? Q.since : Date.now();
    Q = null;
    X = { id: view.id, side: view.side, view, viewAt: Date.now(), since, timer: 0, accepted: false, picked: false, pick: null, look: null, begun: false,
      report: null, result: null, done: false, tFound: Date.now(), tLive: 0, beatT: 0, rematchAsked: false, log: '' };
    matchNo = numOf(view.id);
    alertFound();
    if (!K || !K.connected) openConn(view);
    show('found');
    pollMatchSoon(POLL_MATCH);
  }
  function alertFound() {
    // (once per match: a repeated found view never plays it twice)
    if (X && X.alerted) return;
    if (X) X.alerted = true;
    try { if (ND.audio) { ND.audio.init(); if (ND.audio.sfx) ND.audio.sfx.matchFound(); else if (ND.audio.gong) ND.audio.gong(); else if (ND.audio.ui) ND.audio.ui(); } } catch (e) { /* no sound */ }
    if (!document.hidden) return;
    const t0 = document.title, msg = M().foundTitle;
    let n = 0;
    const iv = setInterval(() => { document.title = n++ % 2 ? t0 : msg; if (!document.hidden || n > 40) { clearInterval(iv); document.title = t0; } }, 700);
  }
  async function accept(ok) {
    if (!X || X.accepted || X.view.status !== 'found') return;
    X.accepted = true;
    let v = null;
    try { v = await call('nd_rank_accept', { p_match: X.id, p_ok: !!ok }, 8000); } catch (e) { v = null; }
    if (!ok) { closeConn(); X = null; flashMsg = M().youDeclined; show('home'); return; }
    if (v) onView(v);
    render();
  }
  function pollMatchSoon(ms) { if (!X) return; clearTimeout(X.timer); const x = X; X.timer = later(() => { if (X === x) pollMatch(); }, ms); }
  async function pollMatch() {
    const x = X;
    if (!x || x.done) return;
    let r = null;
    try { r = await call('nd_rank_poll', { p_ticket: null, p_match: x.id }, 8000); } catch (e) { r = null; }
    if (X !== x) return;
    if (r && r.state === 'match' && r.match) onView(r.match);
    // (no polling while the match runs: the checkpoints say "still here"; after the result, a while longer for a rematch)
    if (X !== x || x.done || (x.begun && !x.report) || (x.resultAt && Date.now() - x.resultAt > 125000) || (x.report && !x.resultAt && Date.now() > x.resultBy)) { if (X === x && screen === 'result') renderResult(); return; }
    pollMatchSoon(x.view.status === 'live' && x.begun ? POLL_MS : POLL_MATCH);
  }
  // every answer about the match (poll, accept, pick, report) comes through here
  function onView(v) {
    const x = X;
    if (!x || !v || v.id !== x.id) return;
    const was = x.view.status;
    x.view = v; x.viewAt = Date.now(); // (the server's remaining times count from here)
    handleSignal(v);
    if (v.status === 'declined' || v.status === 'cancelled') {
      // the other one did not accept, or no connection: back to the queue with the waiting time kept
      const keep = x.id, since = x.since, why = v.status;
      closeConn(); X = null;
      if (why === 'declined' && v.acc && v.acc[0] === false) { flashMsg = M().youDeclined; show('home'); return; }
      Q = { since }; // (find() keeps it)
      flashMsg = why === 'cancelled' ? M().noConnect : M().declined;
      find(keep);
      return;
    }
    if (v.status === 'picking' && screen !== 'pick') show('pick');
    else if (v.status === 'picking') renderPick();
    if (v.live && !x.tLive) { x.tLive = Date.now(); showVs(); }
    if (v.result && !x.resultAt) x.resultAt = Date.now();
    // the server asks for this device's input log (a dispute, or a spot check): sent once
    if (v.log_want && x.log && !x.logSent) { x.logSent = true; call('nd_rank_log', { p_match: x.id, p_log: x.log }, 9000).catch(() => { x.logSent = false; }); }
    if (v.next && x.rematchAsked) { onRematchView(v); return; }
    if (v.result && x.report) showResult();
    if (screen === 'found' && was === 'found') renderFound();
  }

  // ---------------------------------------------------------------- blind pick
  function setPick(id, look) {
    if (!X || X.picked || X.view.status !== 'picking') return;
    if (!(X.view.chars || []).includes(id)) return;
    X.pick = id; X.look = look === undefined ? X.look : look;
    if (X.look && !(ND.rewards && ND.rewards.costumesFor(id).some((e) => e.id === X.look))) X.look = null;
    renderPick();
  }
  async function lockIn() {
    const x = X;
    if (!x || x.picked || !x.pick) return;
    x.picked = true;
    renderPick();
    let v = null;
    try { v = await call('nd_rank_pick', { p_match: x.id, p_ninja: x.pick, p_look: x.look || null }, 8000); } catch (e) {
      if (X === x) { x.picked = false; if (errCode(e) === 'locked_fighter') { x.pick = null; flashMsg = M().lockedFighter; } renderPick(); }
      return;
    }
    if (v) onView(v);
  }

  // ---------------------------------------------------------------- the direct connection (WebRTC; signalling by RPC)
  function iceConfig() {
    if (ND.online && typeof ND.online.iceConfig === 'function') { try { return Promise.resolve(ND.online.iceConfig()).catch(() => ({ iceServers: C.ICE_SERVERS || [] })); } catch (e) { /* fall back */ } }
    return Promise.resolve({ iceServers: Array.isArray(C.ICE_SERVERS) ? C.ICE_SERVERS : [] });
  }
  const gathered = (pc, ms) => new Promise((done) => {
    if (pc.iceGatheringState === 'complete') return done();
    const t = setTimeout(done, ms);
    pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); done(); } });
  });
  const descOf = (pc) => { const d = pc.localDescription; return d ? { type: d.type, sdp: d.sdp } : null; };
  function openConn(view) {
    closeConn();
    earlyGo = null;
    const k = K = { side: view.side, mid: view.id, pc: null, ctl: null, inp: null, connected: false, remote: false, sent: false, rtt: 0, pingN: 0, pingT: 0, failed: false };
    iceConfig().then((cfg) => {
      if (K !== k) return;
      const pc = k.pc = new RTCPeerConnection(cfg);
      pc.ondatachannel = (e) => wire(k, e.channel);
      const watch = () => {
        if (K !== k) return;
        const s = pc.connectionState || pc.iceConnectionState;
        if (s === 'failed' || (s === 'closed' && k.connected)) lost(k);
      };
      pc.onconnectionstatechange = watch; pc.oniceconnectionstatechange = watch;
      if (k.side === 0) {
        wire(k, pc.createDataChannel('ctl', { ordered: true }));
        wire(k, pc.createDataChannel('in', { ordered: false, maxRetransmits: 0 }));
        pc.createOffer().then((o) => pc.setLocalDescription(o)).then(() => gathered(pc, GATHER_MS)).then(() => {
          if (K !== k || !X || !['found', 'picking', 'live'].includes(X.view.status)) return;
          k.sent = true;
          return call('nd_rank_signal', { p_match: X.id, p_sdp: descOf(pc), p_failed: false }, 8000).then((v) => onView(v));
        }).catch((e) => { if (K === k && X && (e && e.code) !== 'bad_request') console.warn('[ranked] offer', e); });
      }
      if (X && X.view) handleSignal(X.view);
    }).catch((e) => {
      // (a browser that refuses the connection, e.g. RTCPeerConnection throwing, must not leave the match hanging:
      // the attempt ends as a lost connection does, like online.js withIce)
      console.warn('[ranked] connection', e);
      lost(k);
    });
  }
  // the other side's offer (2P) / answer (1P) arrived in the match row
  function handleSignal(v) {
    const k = K;
    if (!k || !k.pc || k.remote || !v || !v.sig || typeof v.sig.sdp !== 'string') return;
    const want = k.side === 0 ? 'answer' : 'offer';
    if (v.sig.type !== want) return;
    k.remote = true;
    const pc = k.pc;
    if (k.side === 0) { pc.setRemoteDescription({ type: 'answer', sdp: v.sig.sdp }).catch((e) => console.warn('[ranked] answer', e)); return; }
    pc.setRemoteDescription({ type: 'offer', sdp: v.sig.sdp }).then(() => pc.createAnswer()).then((a) => pc.setLocalDescription(a))
      .then(() => gathered(pc, GATHER_MS)).then(() => {
        if (K !== k || !X || !['found', 'picking', 'live'].includes(X.view.status)) return;
        k.sent = true;
        return call('nd_rank_signal', { p_match: X.id, p_sdp: descOf(pc), p_failed: false }, 8000).then((w) => onView(w));
      }).catch((e) => { if (K === k && X && (e && e.code) !== 'bad_request') console.warn('[ranked] answer', e); });
  }
  function wire(k, ch) {
    if (ch.label === 'in') { k.inp = ch; ch.binaryType = 'arraybuffer'; ch.onmessage = (e) => onIn(k, e.data); }
    else { k.ctl = ch; ch.onmessage = (e) => { let m = null; try { m = JSON.parse(e.data); } catch (err) { return; } onCtl(k, m); }; }
    ch.onopen = () => {
      if (K !== k || k.connected || !k.ctl || !k.inp || k.ctl.readyState !== 'open' || k.inp.readyState !== 'open') return;
      k.connected = true;
      k.pingT = setInterval(() => ping(k), 500); ping(k);
      maybeBegin();
      if (screen === 'found' || screen === 'pick' || screen === 'vs') render();
    };
    ch.onclose = () => { if (K === k && k.connected) lost(k); };
  }
  function closeConn() {
    const k = K;
    if (!k) return;
    K = null;
    clearInterval(k.pingT);
    setTimeout(() => {
      try { if (k.ctl) k.ctl.close(); } catch (e) { /* closed */ }
      try { if (k.inp) k.inp.close(); } catch (e) { /* closed */ }
      try { if (k.pc) k.pc.close(); } catch (e) { /* closed */ }
    }, 150);
  }
  function lost(k) {
    if (K !== k) return;
    const was = k.connected;
    k.connected = false; clearInterval(k.pingT);
    if (X && X.begun && NET.active && !X.done) { NET.end('drop', X.side); return; }
    if (!was && X && !X.begun && !k.failed) failConn();
  }
  // no direct connection in time: the match does not count, both go back to the queue (the pair avoids each other 10 min)
  function failConn() {
    const x = X;
    if (!x || (K && K.failed)) return;
    if (K) K.failed = true;
    call('nd_rank_signal', { p_match: x.id, p_sdp: null, p_failed: true }, 8000).then((v) => onView(v)).catch(() => {
      if (X !== x) return;
      closeConn(); X = null; flashMsg = M().noConnect; find();
    });
  }
  const netem = () => window.__ndNetem || null;
  function sendIn(buf, k = K) {
    if (!k || !k.inp || k.inp.readyState !== 'open') return;
    const ch = k.inp, E = netem();
    const go = () => { try { if (ch.readyState === 'open' && ch.bufferedAmount < 65536) ch.send(buf); } catch (e) { /* closing */ } };
    if (!E) return go();
    if (E.loss > 0 && Math.random() < E.loss) return;
    const d = (E.delay || 0) + Math.random() * (E.jitter || 0);
    if (d > 0) setTimeout(go, d); else go();
  }
  function ctlSend(o, k = K) {
    if (!k || !k.ctl || k.ctl.readyState !== 'open') return;
    const ch = k.ctl, s = JSON.stringify(o), E = netem();
    const go = () => { try { if (ch.readyState === 'open') ch.send(s); } catch (e) { /* closing */ } };
    if (E && E.delay) setTimeout(go, E.delay); else go();
  }
  function ping(k) {
    const id = ++k.pingN, b = new ArrayBuffer(13), v = new DataView(b);
    v.setUint8(0, 2); v.setUint32(1, id); v.setFloat64(5, performance.now());
    sendIn(b, k);
    if (screen === 'match') hudPing();
  }
  function onIn(k, data) {
    if (K !== k || !(data instanceof ArrayBuffer) || data.byteLength < 1) return;
    const v = new DataView(data), t = v.getUint8(0);
    if (t === 2 && data.byteLength >= 13) { v.setUint8(0, 3); sendIn(data, k); return; }
    if (t === 3 && data.byteLength >= 13) {
      const ms = performance.now() - v.getFloat64(5);
      if (ms >= 0 && ms < 10000) { k.rtt = k.rtt ? k.rtt + (ms - k.rtt) * 0.2 : ms; NET.setRtt(k.rtt); }
      return;
    }
    if (X && X.begun) NET.receive(data);
  }
  function onCtl(k, m) {
    if (K !== k || !m || typeof m.t !== 'string') return;
    const S = NET.active && NET.session();
    switch (m.t) {
      case 'go': if (S) NET.peerReady(m.m); else earlyGo = m.m; break; // (the other side began first: kept until this one begins)
      case 'pause': NET.peerPause(m.m, m.at, m.why); break;
      case 'resume': NET.peerResume(m.m); break;
      case 'end': if (S && !S.finished && (m.m & 255) === S.m) NET.end(m.why === 'desync' ? 'desync' : 'away', -1); break;
      case 'leave': if (X && X.begun && S && !S.finished) NET.end('left', X.side); break;
      default:
    }
  }

  // ---------------------------------------------------------------- the match
  function showVs() {
    const x = X;
    if (!x || !x.view.live) return;
    show('vs');
    later(() => { if (X === x && !x.begun) { x.vsDone = true; maybeBegin(); } }, VS_MS);
    // no connection by then: the match does not count
    later(() => { if (X === x && !x.begun && !(K && K.connected)) failConn(); }, CONNECT_MS);
  }
  const delayFor = (rtt) => (rtt > 0 ? Math.max(2, Math.min(4, Math.round((rtt / 2000 / G.STEP) * 0.6))) : 2);
  function maybeBegin() {
    const x = X;
    if (!x || x.begun || !x.vsDone || !x.view.live || !K || !K.connected) return;
    const L = x.view.live, c0 = charIdx(L.picks[0]), c1 = charIdx(L.picks[1]);
    if (c0 < 0 || c1 < 0 || !ARENAS.includes(L.arena)) return;
    x.begun = true;
    hideAll();
    screen = 'match';
    document.getElementById('app').classList.add('online');
    if ($('first')) $('first').hidden = true;
    beginning = true;
    try {
      NET.begin({
        side: x.side, seed: L.seed | 0, chars: [c0, c1], arena: L.arena, match: matchNo, delay: delayFor(K.rtt), rtt: K.rtt,
        looks: Array.isArray(L.looks) ? L.looks.map((l) => (typeof l === 'string' && ND.rewards && ND.rewards.get(l) ? l : null)) : null,
        send: (b) => sendIn(b), sendCtl: (o) => ctlSend(o),
        onStatus: (kind, info) => waitUi(kind, info),
        onEnd: (res) => matchOver(x, res),
      });
    } finally { beginning = false; }
    if (earlyGo != null) { NET.peerReady(earlyGo); earlyGo = null; }
    NET.setHidden(document.hidden);
    hudShow(true);
    portalRoom(true);
    clearInterval(x.keepT);
    x.keepT = setInterval(() => { if (X === x && NET.active) { syncAway(); NET.keepalive(); } }, 250);
    x.beatT = setInterval(() => beat(x), BEAT_MS);
    later(() => beat(x), 5000);
  }
  let beginning = false;
  function beat(x) {
    if (X !== x || x.view.result) { clearInterval(x.beatT); return; }
    const cp = NET.active ? NET.checkpoint() : x.lastCp;
    if (!cp) return;
    x.lastCp = cp;
    call('nd_rank_beat', { p_match: x.id, p_cp: cp }, 8000).catch(() => {});
  }
  // the match ended on this device: report it (after the fingerprint of the end step is final), show "Confirming…"
  function matchOver(x, res) {
    if (X !== x) return;
    x.res = res;
    if (res.reason === 'drop' || res.reason === 'desync' || res.reason === 'pause') ctlSend({ t: 'end', why: res.reason, m: matchNo });
    waitUi('ok');
    hudShow(false);
    setTimeout(() => sendReport(x, res), 0);
    setTimeout(() => { if (X === x) show('result'); }, res.reason === 'ko' ? 500 : 0);
    if (ND.pass && ND.pass.onlineResult) ND.pass.onlineResult('ranked', res); // level XP (js/pass.js)
  }
  function sendReport(x, res, self) {
    if (x.report) return;
    const side = x.side;
    let r;
    if (self) r = { reason: 'left', left: side, winner: 1 - side };
    else if (res.reason === 'ko') r = { reason: 'ko', winner: res.winner };
    else if (res.reason === 'left') r = { reason: 'left', left: 1 - side, winner: side };
    else if (res.reason === 'drop') r = { reason: 'drop', winner: side };
    else if (res.reason === 'away') r = { reason: 'drop', winner: side }; // (the other side stopped hearing this one: a connection loss, not an admission)
    else if (res.reason === 'pause') r = { reason: 'pause', winner: res.winner };
    else if (res.reason === 'desync') r = { reason: 'desync', winner: -1, info: NET.stats() ? { desync: NET.stats().desync } : null };
    else r = { reason: 'drop', winner: side };
    if (res) {
      const step = res.confirmed | 0, h = step - (step % 60);
      r.step = step; r.dig = res.dig || null; r.wins = res.wins || null; r.hash = NET.finalAt(h) || null;
    }
    r.v = version();
    try { if (typeof window.__ndRankReport === 'function') r = window.__ndRankReport(r) || r; } catch (e) { /* test hook */ }
    x.report = r;
    try { x.log = NET.active ? NET.inputLog() : ''; } catch (e) { x.log = ''; }
    const send = (n) => call('nd_rank_report', { p_match: x.id, p_res: r }, 9000).then((v) => onView(v))
      .catch(() => { if (n < 4 && X === x) setTimeout(() => send(n + 1), 3000 * (n + 1)); });
    send(0);
    x.resultBy = Date.now() + RESULT_MS;
    pollMatchSoon(POLL_MS);
  }
  // this player leaves the match: they lose it (the other device is told at once)
  function quitMatch() {
    const x = X;
    if (!x) return;
    if (x.begun && !x.res && NET.active) {
      ctlSend({ t: 'leave' });
      x.res = { reason: 'left', winner: 1 - x.side, wins: G.wins.slice(), self: true };
      sendReport(x, null, true);
      NET.stop();
      hudShow(false); waitUi('ok');
      show('result');
      return;
    }
    if (!x.begun) { closeConn(); X = null; toMenu(); }
  }
  function showResult() { if (screen === 'result') renderResult(); else if (X && X.res) show('result'); }
  async function rematch() {
    const x = X;
    if (!x || x.rematchAsked || !K || !K.connected) return;
    x.rematchAsked = true; renderResult();
    try { const v = await call('nd_rank_rematch', { p_match: x.id }, 8000); onRematchView(v); } catch (e) { x.rematchAsked = false; renderResult(); }
  }
  function onRematchView(v) {
    const x = X;
    if (!x || !v || v.id !== x.id) return;
    x.view = v;
    if (v.next) {
      // the next match of the same pair (the same sides and connection), straight to the pick
      teardownMatch(false);
      X = { id: v.next, side: x.side, view: Object.assign({}, v, { id: v.next, status: 'picking', pick_ms: 15000, picked: [false, false], live: null, result: null, next: null, rematch: [false, false], my_pick: null }), since: Date.now(), timer: 0, accepted: true, picked: false,
        pick: x.pick, look: x.look, begun: false, report: null, result: null, done: false, tFound: Date.now(), tLive: 0, beatT: 0, rematchAsked: false, log: '' };
      matchNo = numOf(v.next);
      pollMatch();
      show('pick');
      return;
    }
    renderResult();
  }
  // the match's timers and net loop end (the connection stays for a rematch unless dropConn)
  function teardownMatch(dropConn) {
    const x = X;
    if (x) { x.done = true; clearTimeout(x.timer); clearInterval(x.keepT); clearInterval(x.beatT); }
    if (NET.active) NET.stop();
    hudShow(false); waitUi('ok'); portalRoom(false);
    document.getElementById('app').classList.remove('online');
    if (dropConn) closeConn();
  }
  function toMenu() {
    teardownMatch(true); stopQueue(true); X = null; hideAll(); screen = null;
    G.goMenu();
  }
  function findAgain() {
    teardownMatch(true); X = null;
    starting = true; try { G.start('attract'); } finally { starting = false; }
    $('menu').hidden = true;
    find();
  }
  let starting = false;

  // ---------------------------------------------------------------- screens
  const CSS = `
  #rk { display: flex; flex-direction: column; align-items: center; background: rgba(5,6,12,.82); z-index: 30; }
  #rk .rk-card { box-sizing: border-box; width: min(620px, 100%); margin: auto 0; display: grid; gap: 12px; backdrop-filter: none; -webkit-backdrop-filter: none; background: rgba(10,12,22,.95); }
  #rk .rk-card.wide { width: min(980px, 100%); }
  .rk-card p { margin: 0; }
  .rk-card p:empty { display: none; }
  .rk-head { display: flex; gap: 14px; align-items: center; }
  .rk-k { font: 700 44px/1 var(--jp); color: var(--gold); }
  .rk-title { margin: 0; font: 700 clamp(22px, 4vw, 32px)/1.05 var(--display); letter-spacing: .05em; text-transform: uppercase; }
  .rk-sub { margin: 3px 0 0; color: var(--muted); font-size: 14px; }
  .rk-row { display: flex; gap: 8px 14px; align-items: center; flex-wrap: wrap; }
  .rk-btns { display: flex; gap: 8px; flex-wrap: wrap; }
  .rk-btns .btn { flex: 1 1 150px; }
  .rk-st { color: var(--muted); font-size: 14px; }
  .rk-err { color: #ffb4a8; font-size: 14px; }
  .rk-lbl { font: 500 11px/1 var(--display); letter-spacing: .2em; text-transform: uppercase; color: var(--muted); }
  .rk-badge { display: inline-flex; align-items: baseline; gap: 6px; padding: 5px 10px; border: 1px solid var(--tc, var(--line)); color: var(--tc, var(--text)); font: 600 16px/1 var(--display); letter-spacing: .06em; white-space: nowrap; }
  .rk-badge b { font: 700 20px/1 var(--jp); }
  .rk-badge.pl { color: var(--muted); border-style: dashed; }
  .rk-badge.sm { padding: 2px 6px; font-size: 12px; } .rk-badge.sm b { font-size: 14px; }
  .rk-big { display: grid; grid-template-columns: auto 1fr; gap: 6px 16px; align-items: center; padding: 12px; border: 1px solid var(--line); background: rgba(0,0,0,.25); }
  .rk-big .rk-badge { grid-row: span 2; font-size: 20px; padding: 10px 14px; } .rk-big .rk-badge b { font-size: 34px; }
  .rk-num { font: 700 28px/1 var(--display); letter-spacing: .04em; }
  .rk-bar { height: 6px; background: rgba(255,255,255,.08); position: relative; overflow: hidden; }
  .rk-bar i { position: absolute; inset: 0 auto 0 0; background: var(--tc, var(--gold)); }
  .rk-how { margin: 0; padding-left: 18px; color: var(--muted); font-size: 13.5px; display: grid; gap: 3px; }
  .rk-titles { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; font-size: 13px; }
  .rk-tt { padding: 2px 7px; border: 1px solid var(--line); color: var(--muted); font: 600 12px/1.2 var(--display); letter-spacing: .06em; }
  .rk-tt.rw { color: var(--rc, var(--gold)); border-color: var(--rc, var(--gold)); }
  .rk-opp { display: grid; gap: 8px; justify-items: center; text-align: center; padding: 14px; border: 1px solid var(--line); background: rgba(0,0,0,.25); }
  .rk-name { font: 600 24px/1.1 var(--display); letter-spacing: .05em; overflow-wrap: anywhere; }
  .rk-count { font: 700 40px/1 var(--display); color: var(--gold-hi, var(--gold)); }
  .rk-card > .rk-count, .rk-card > .rk-seal { text-align: center; }
  .rk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 6px; }
  .rk-ch { position: relative; display: grid; justify-items: center; gap: 2px; padding: 8px 4px; background: rgba(255,255,255,.035); border: 1px solid var(--line); cursor: pointer; color: var(--text); font: 600 13px/1.1 var(--display); letter-spacing: .05em; }
  .rk-ch .k { font: 700 22px/1 var(--jp); color: var(--cc); }
  .rk-ch[aria-pressed="true"] { border-color: var(--gold-hi, var(--gold)); background: rgba(217,179,108,.2); box-shadow: inset 0 0 0 1px var(--gold-hi, var(--gold)); }
  .rk-ch[disabled] { opacity: .38; cursor: not-allowed; }
  .rk-ch[disabled]::after { content: '🔒'; position: absolute; top: 3px; right: 4px; font-size: 11px; }
  .rk-vs { display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; text-align: center; }
  .rk-vs .v { font: 700 44px/1 var(--jp); color: var(--gold); }
  .rk-vs .f b { display: block; font: 700 42px/1 var(--jp); }
  .rk-delta { font: 700 34px/1 var(--display); letter-spacing: .04em; }
  .rk-delta.up { color: #9be29b; } .rk-delta.down { color: #ffb4a8; }
  .rk-seal { font: 700 64px/1 var(--jp); color: var(--tc, var(--gold)); animation: rkSeal .6s cubic-bezier(.2,1.6,.4,1) both; }
  @keyframes rkSeal { from { transform: scale(2.4) rotate(-12deg); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .rk-seal { animation: none; } }
  #rkBar { position: absolute; left: 50%; top: calc(env(safe-area-inset-top, 0px) + 6px); translate: -50% 0; z-index: 29; display: flex; gap: 10px; align-items: center; padding: 6px 10px; background: rgba(8,9,16,.9); border: 1px solid var(--gold); font: 600 13px/1.2 var(--display); letter-spacing: .06em; max-width: calc(100% - 24px); flex-wrap: wrap; justify-content: center; }
  #rkBar .mini { flex: none; }
  #rkBar .tag { color: #ffb4a8; }
  #rkHud { position: absolute; right: 12px; bottom: 10px; display: flex; gap: 10px; align-items: center; z-index: 12; }
  #app.touch #rkHud { top: 64px; bottom: auto; right: 10px; }
  #rkHud .btn { padding: 7px 10px; font-size: 12px; }
  #rkHud .ping { font: 600 12px/1 var(--display); letter-spacing: .12em; color: var(--muted); }
  #rkWait { position: absolute; left: 50%; top: 38%; translate: -50% 0; padding: 14px 18px; background: rgba(8,9,16,.88); border: 1px solid var(--gold); text-align: center; z-index: 31; min-width: 220px; }
  #rkWait p { margin: 0; font: 600 16px/1.3 var(--display); letter-spacing: .06em; }
  #rkConfirm { display: grid; place-items: center; background: rgba(5,6,12,.72); z-index: 32; }
  .rk-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  .rk-list li { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto auto; gap: 8px; align-items: center; padding: 6px 8px; background: rgba(255,255,255,.03); }
  .rk-list li.me { background: rgba(217,179,108,.16); }
  .rk-list .pl { font: 700 15px/1 var(--display); text-align: center; color: var(--muted); }
  .rk-list .n { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rk-list .sc { font: 600 15px/1 var(--display); letter-spacing: .04em; }
  .rk-champs { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
  .rk-champs article { padding: 10px; border: 1px solid var(--line); background: rgba(0,0,0,.25); display: grid; gap: 4px; }
  .rk-champs b { color: var(--gold); }
  @media (max-height: 460px) { #rk .rk-card { gap: 8px; padding: 12px; } .rk-k { font-size: 30px; } .rk-count { font-size: 30px; } .rk-vs .v, .rk-vs .f b { font-size: 30px; } .rk-grid { grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); } .rk-ch { padding: 5px 3px; } }
  /* home: one column; on short, wide screens (phones sideways, CrazyGames' small frames) two, so it fits without scrolling */
  #rk .rk-card.home > .rk-main, #rk .rk-card.home > .rk-side { display: grid; gap: 12px; align-content: start; min-width: 0; }
  @media (max-height: 540px) {
    #rk.overlay { padding-block: 8px; }
    #rk .rk-card { gap: 8px; padding: 12px 14px; }
    .rk-k { font-size: 30px; } .rk-title { font-size: 22px; } .rk-sub { font-size: 12.5px; }
    .rk-st, .rk-err { font-size: 13px; } .rk-how { font-size: 12.5px; gap: 1px; }
    .rk-count { font-size: 30px; } .rk-name { font-size: 20px; } .rk-opp { padding: 8px; gap: 5px; }
    .rk-big { padding: 8px 10px; } .rk-big .rk-badge { font-size: 16px; padding: 7px 10px; } .rk-big .rk-badge b { font-size: 26px; } .rk-num { font-size: 22px; }
    #rk .rk-card.home > .rk-main, #rk .rk-card.home > .rk-side { gap: 8px; }
  }
  @media (max-height: 540px) and (min-width: 600px) {
    #rk .rk-card.home { width: min(920px, 100%); grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); column-gap: 18px; align-items: start; }
    #rk .rk-card.home > .rk-side { border-left: 1px solid var(--line); padding-left: 16px; }
  }
  @media (max-height: 400px) {
    #rk .rk-card { gap: 6px; padding: 10px 12px; }
    .rk-k { font-size: 26px; } .rk-title { font-size: 20px; } .rk-count { font-size: 26px; } .rk-name { font-size: 18px; }
    .rk-how { font-size: 12px; line-height: 1.3; } .rk-vs .v, .rk-vs .f b { font-size: 26px; }
  }
  /* long titles in other languages wrap instead of sticking out (DUELO CLASIFICATORIO, РЕЙТИНГОВАЯ ДУЭЛЬ) */
  .rk-head > div { min-width: 0; } .rk-title { overflow-wrap: anywhere; } .rk-big > * { min-width: 0; } .rk-badge { max-width: 100%; }
  /* narrow screens (phones upright): tighter spacing, so the ranked home fits an iPhone's 763 px without scrolling */
  @media (max-width: 560px) {
    #rk.overlay { padding-block: 10px; padding-inline: 10px; }
    #rk .rk-card { gap: 8px; padding: 12px; }
    #rk .rk-card.home > .rk-main, #rk .rk-card.home > .rk-side { gap: 8px; }
    .rk-title { font-size: 22px; } .rk-k { font-size: 32px; } .rk-how { font-size: 12.5px; gap: 1px; } .rk-st, .rk-err { font-size: 13px; }
    .rk-big { padding: 8px 10px; column-gap: 12px; } .rk-big .rk-badge { font-size: 16px; padding: 7px 10px; } .rk-big .rk-badge b { font-size: 26px; } .rk-num { font-size: 22px; }
  }
  /* touch screens: every ranked button at least 44 px tall */
  #app.touch #rk button:not(.rk-ch), #app.touch #rkHud .btn { min-height: 44px; }
  /* the search bar over the warm-up fight: one compact row under the fight's HUD (#hud), never over it */
  /* the search during the warm-up fight: a slim pill just under the HUD's clock, over the sky, never over the fighters,
     the touch controls or a menu (z-index under every overlay: pause 5, settings 60; also hidden while one is open).
     Tap it: back to the search screen; the cross: stop searching. Their touch area (44 px) reaches up into the HUD,
     which takes no touches, instead of down into the arena. */
  #rkBar { z-index: 4; top: calc(env(safe-area-inset-top, 0px) + 100px); padding: 0; gap: 0; height: 24px; box-sizing: border-box; flex-wrap: nowrap;
    background: rgba(8,9,16,.72); border: 1px solid rgba(217,179,108,.5); border-radius: 999px; font: 600 11px/1 var(--display); letter-spacing: .1em; text-transform: uppercase; pointer-events: none; max-width: none; }
  @media (max-height: 540px) { #rkBar { top: calc(env(safe-area-inset-top, 0px) + 61px); } }
  #rkBar button { pointer-events: auto; position: relative; height: 22px; min-height: 0 !important; margin: 0; border: 0; background: none; color: var(--text, #eee); font: inherit; letter-spacing: inherit; text-transform: inherit; cursor: pointer; display: flex; align-items: center; white-space: nowrap; }
  #rkBar button::before { content: ''; position: absolute; left: 0; right: 0; bottom: 0; top: -22px; }
  #rkBar .rk-pill { gap: 7px; padding: 0 9px 0 10px; }
  #rkBar .rk-pill .tag { color: rgba(255,180,168,.9); font-weight: 500; }
  #rkBar .rk-x { padding: 0 10px 0 8px; border-left: 1px solid rgba(217,179,108,.3); color: var(--muted); font-size: 13px; }
  #rkBar button:hover, #rkBar button:focus-visible { color: #f1d69c; }
  #rkBar .rk-dot { width: 7px; height: 7px; border-radius: 50%; background: #e2583e; box-shadow: 0 0 6px rgba(226,88,62,.8); animation: rkBeat 1.2s ease-in-out infinite; }
  @keyframes rkBeat { 0%, 100% { opacity: .45; transform: scale(.85); } 18% { opacity: 1; transform: scale(1.15); } 36% { opacity: .7; transform: scale(.95); } }
  @media (prefers-reduced-motion: reduce) { #rkBar .rk-dot { animation: none; } }

  /* ---- the RANKED entry in the main menu: lacquer panel, gold edge, the player's tier seal, season tag */
  #mranked { position: relative; overflow: hidden; isolation: isolate; border-color: rgba(217,179,108,.72);
    background: radial-gradient(120% 140% at 100% 50%, rgba(196,44,34,.28), rgba(196,44,34,0) 55%), linear-gradient(100deg, #1b0e10 0%, #130b10 55%, #0d0b13 100%);
    box-shadow: inset 0 0 0 1px rgba(0,0,0,.55), inset 0 0 0 2px rgba(217,179,108,.16), 0 6px 18px rgba(0,0,0,.35); }
  #mranked:hover, #mranked:focus-visible { border-color: var(--gold-hi, #f1d69c); background: radial-gradient(120% 140% at 100% 50%, rgba(214,52,40,.36), rgba(196,44,34,0) 58%), linear-gradient(100deg, #22110f 0%, #170c10 55%, #0f0c15 100%); }
  #mranked strong { color: #f1d69c; display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; }
  #mranked strong .rk-mt { font: inherit; color: inherit; letter-spacing: inherit; white-space: nowrap; grid-column: auto; }
  #mranked .rk-ms { font: 500 11px/1.2 var(--display); letter-spacing: .12em; text-transform: uppercase; color: var(--gold); white-space: nowrap; }
  #mranked .rk-ms:empty { display: none; }
  /* narrow screens: the season line takes the description's place (the entry keeps its height) */
  @media (max-width: 560px) { #mranked.has-season > .rk-md { display: none; } }
  #mranked .mk.rk-seal-m { width: 46px; height: 46px; display: grid; place-items: center; box-sizing: border-box; padding: 2px; color: #fbeedd; text-shadow: none;
    font: 700 24px/1 var(--jp); background: linear-gradient(145deg, #c8392c, #8f1d16); border: 1px solid rgba(255,230,200,.55);
    box-shadow: inset 0 0 0 2px #a8271d, inset 0 0 0 3px rgba(255,230,200,.35), 0 0 0 1px var(--tc, rgba(217,179,108,.6)), 0 0 16px rgba(214,60,40,.35);
    transform: rotate(-4deg); animation: rkEmber 4.5s ease-in-out infinite; }
  #mranked .mk.rk-seal-m.two { writing-mode: vertical-rl; font-size: 17px; letter-spacing: 0; line-height: 1.02; }
  #mranked::after { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none;
    background: linear-gradient(105deg, rgba(255,236,190,0) 40%, rgba(255,236,190,.09) 50%, rgba(255,236,190,0) 60%) no-repeat; background-size: 300% 100%; background-position: 130% 0; animation: rkSheen 7s ease-in-out 1.5s infinite; }
  @keyframes rkSheen { 0%, 70% { background-position: 130% 0; } 100% { background-position: -30% 0; } }
  @keyframes rkEmber { 0%, 100% { box-shadow: inset 0 0 0 2px #a8271d, inset 0 0 0 3px rgba(255,230,200,.35), 0 0 0 1px var(--tc, rgba(217,179,108,.6)), 0 0 12px rgba(214,60,40,.25); } 50% { box-shadow: inset 0 0 0 2px #a8271d, inset 0 0 0 3px rgba(255,230,200,.35), 0 0 0 1px var(--tc, rgba(217,179,108,.6)), 0 0 20px rgba(230,80,45,.5); } }
  @media (prefers-reduced-motion: reduce) { #mranked::after, #mranked .mk.rk-seal-m { animation: none; } }
  @media (max-height: 540px) { #mranked .mk.rk-seal-m { width: 34px; height: 34px; font-size: 19px; } #mranked .mk.rk-seal-m.two { font-size: 13px; } #mranked .rk-ms { font-size: 10px; } }
  `;
  // the styles go in with the menu entry (the entry is styled before any ranked screen opens)
  function css() { if (!$('rkCss')) { const st = document.createElement('style'); st.id = 'rkCss'; st.textContent = CSS; document.head.appendChild(st); } }
  let built = false;
  function build() {
    if (built) return;
    built = true;
    css();
    const app = $('app'), mk = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
    app.appendChild(mk('<div id="rk" class="overlay" hidden role="dialog" aria-modal="true" aria-labelledby="rkTitle"></div>'));
    app.appendChild(mk('<div id="rkBar" hidden role="status" aria-live="polite"></div>'));
    app.appendChild(mk('<div id="rkHud" hidden><span class="ping" id="rkPing"></span><button class="btn" id="rkQuit" type="button"></button></div>'));
    app.appendChild(mk('<div id="rkWait" hidden role="status" aria-live="polite"><p id="rkWaitT"></p></div>'));
    app.appendChild(mk('<div id="rkConfirm" class="overlay" hidden role="dialog" aria-modal="true"><div class="dialog card"><p class="title" style="font-size:30px" id="rkCfT"></p>' +
      '<p class="sub" id="rkCfS"></p><div class="btns"><button class="btn primary" id="rkStay" type="button"></button><button class="btn" id="rkLeaveNow" type="button"></button></div></div></div>'));
    relabel();
    $('rkQuit').onclick = () => confirmLeave(true);
    $('rkStay').onclick = () => confirmLeave(false);
    $('rkLeaveNow').onclick = () => { confirmLeave(false); quitMatch(); };
  }
  function relabel() {
    const L = M(), set = (id, t) => { const e = $(id); if (e) e.textContent = t; };
    set('rkQuit', L.leave); set('rkCfT', L.leaveQ); set('rkCfS', L.leaveSub); set('rkStay', L.stay); set('rkLeaveNow', L.leave);
    decorateEntry();
  }
  function hideAll() { ['rk', 'rkConfirm'].forEach((id) => { const e = $(id); if (e) e.hidden = true; }); }
  function show(which) {
    build();
    screen = which;
    hideAll();
    $('menu').hidden = true;
    if ($('first')) $('first').hidden = true;
    $('rk').hidden = false;
    render();
  }
  function render() {
    if (!built || !screen) return;
    if (screen === 'home') renderHome();
    else if (screen === 'queue') renderQueue();
    else if (screen === 'found') renderFound();
    else if (screen === 'pick') renderPick();
    else if (screen === 'vs') renderVs();
    else if (screen === 'result') renderResult();
    renderBar();
  }
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (text, cls, fn) => { const b = el('button', 'btn' + (cls ? ' ' + cls : ''), text); b.type = 'button'; b.onclick = () => { try { if (ND.audio) ND.audio.ui(); } catch (e) { /* no sound */ } fn(); }; return b; };
  const nameEl = (s) => { const n = el('span', null, s); n.lang = 'en'; n.setAttribute('translate', 'no'); return n; };
  function head(k, title, sub) {
    const h = el('div', 'rk-head'), kk = el('b', 'rk-k', k), t = el('div');
    kk.setAttribute('aria-hidden', 'true');
    const tt = el('p', 'rk-title', title); tt.id = 'rkTitle';
    t.append(tt); if (sub) t.append(el('p', 'rk-sub', sub));
    h.append(kk, t);
    return h;
  }
  function card(wide) { const box = $('rk'); box.textContent = ''; const c = el('div', 'rk-card card' + (wide ? ' wide' : '')); box.appendChild(c); return c; }
  const fmtClock = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  // the titles a player shows (Dan / Kyu, Monthly Tournament title, a catalog title they wear)
  function titlesOf(o) {
    const box = el('div', 'rk-titles'), L = LB();
    if (!o) return box;
    const ds = o.dan && L && L.danShort ? L.danShort(o.dan) : '';
    if (ds) box.appendChild(el('span', 'rk-tt', ds));
    if (o.best_place && L && L.titleLabel) { const t = L.titleLabel({ place: o.best_place, wins: o.wins | 0, podiums: o.podiums | 0 }); if (t) box.appendChild(el('span', 'rk-tt', t)); }
    const rt = o.title_id && ND.rewards ? ND.rewards.title(o.title_id) : null;
    if (rt) { const s = el('span', 'rk-tt rw', (rt.icon ? rt.icon + ' ' : '') + rt.name); if (rt.color) s.style.setProperty('--rc', rt.color); box.appendChild(s); }
    const pl = ND.pass && ND.pass.plate ? ND.pass.plate(o) : null; if (pl) box.appendChild(pl); // level + pass title (js/pass.js)
    return box;
  }

  function renderHome() {
    const L = M(), c0 = card(false), id = identity();
    c0.classList.add('home');
    // (two groups: what to do now, and how it works; side by side on short, wide screens)
    const c = el('div', 'rk-main'), side = el('div', 'rk-side');
    c0.append(c, side);
    c.append(head('戦', L.title, me && me.season ? L.season(me.season.id) + ' · ' + seasonLeft() : ''));
    if (!serverHas()) { c.append(el('p', 'rk-err', L.offline)); c.append(backRow()); side.remove(); return; }
    const big = el('div', 'rk-big');
    if (me && !me.guest) {
      const b = badge(me.tier, me.placement);
      const need = me.placement > 0 ? L.placement(Math.max(0, placementTotal() - me.placement), placementTotal()) : L.rating + ' ' + me.rating;
      big.append(b, el('span', 'rk-num', need));
      const sub = el('span', 'rk-st', L.record(me.wins | 0, me.losses | 0, me.draws | 0) + (me.place ? ' · ' + L.place(me.place) : ''));
      big.append(sub);
      if (!(me.placement > 0) && me.tier < 15) {
        const bar = el('div', 'rk-bar'), T = tierInfo(me.tier), lo = tierFloor(me.tier), hi = tierFloor(me.tier + 1), f = isFinite(lo) ? Math.max(0, Math.min(1, (me.rating - lo) / (hi - lo))) : 0.5;
        const i = el('i'); i.style.width = Math.round(f * 100) + '%'; bar.style.setProperty('--tc', T.col); bar.style.gridColumn = '1 / -1'; bar.appendChild(i); big.append(bar);
      }
      c.append(big);
      // my own titles: Dan / Kyu, the Monthly Tournament title, the catalog title I wear
      const L2 = LB(), mt = L2 && L2.myTitle ? L2.myTitle() : null;
      const dn = (L2 && L2.adapter && L2.adapter.srvDan) || (ND.banzuke && ND.banzuke.dan && ND.banzuke.dan.rank ? ND.banzuke.dan.rank() : 0);
      c.append(titlesOf({ dan: dn, best_place: mt && mt.place, wins: mt && mt.wins, podiums: mt && mt.podiums, title_id: me.title_id }));
      // catalog titles this player owns: the one worn shows next to the name (the match-found screen, the Hall)
      const mine = ND.rewards ? ND.rewards.owned().map((id) => ND.rewards.get(id)).filter((e) => e && e.kind !== 'costume') : [];
      if (mine.length) {
        const row = el('div', 'rk-row'); row.append(el('span', 'rk-lbl', L.titleLbl));
        const seg = (id, text) => {
          const b2 = el('button', 'seg', text); b2.type = 'button'; b2.setAttribute('aria-pressed', String((me.title_id || null) === id));
          b2.onclick = () => call('nd_reward_equip', { p_title: id }, 8000).then(() => { me.title_id = id; render(); }).catch(() => {});
          row.append(b2);
        };
        seg(null, L.noTitle); mine.forEach((e) => seg(e.id, (e.icon ? e.icon + ' ' : '') + ND.rewards.name(e)));
        c.append(row);
      }
    } else if (id === 'guest') {
      c.append(el('p', 'rk-st', ND.cgAccount && ND.cgAccount.available ? L.guestNote : L.nickNote));
    }
    side.append(el('p', 'rk-st', L.reward));
    const err = el('p', 'rk-err', flashMsg); flashMsg = ''; c.append(err);
    const row = el('div', 'rk-btns');
    const fb = btn(id === 'guest' ? L.findUnranked : L.find, 'primary', () => find());
    fb.id = 'rkFind'; if (busyCall) fb.disabled = true;
    row.append(fb);
    if (id === 'guest' && ND.cgAccount && ND.cgAccount.available && !ND.cgAccount.signedIn) {
      row.append(btn(L.signIn, '', () => { ND.cgAccount.prompt().then(() => setTimeout(() => { loadMe(); render(); }, 1500)); }));
    }
    c.append(row);
    if (id === 'guest' && !(ND.cgAccount && ND.cgAccount.available) && ND.lbUI && ND.lbUI.nickLine && !(LB() && LB().nameLocked)) {
      try { c.append(ND.lbUI.nickLine(() => { loadMe().then(() => render()); render(); })); } catch (e) { /* no nick form */ }
    }
    const how = el('ul', 'rk-how'); (L.howLines || TR.howLines).forEach((t) => how.appendChild(el('li', null, t)));
    side.append(how);
    const r2 = el('div', 'rk-btns');
    r2.append(btn(L.board, '', () => openHall()), btn(L.back, '', () => close()));
    side.append(r2);
    setTimeout(() => { const b = $('rkFind'); if (b && screen === 'home') b.focus(); }, 0);
  }
  const placementTotal = () => (me && me.games === 0 && me.placement > 3 ? me.placement : me && me.placement > 3 ? 5 : me ? Math.max(3, me.placement + (me.games | 0)) : 5);
  function seasonLeft() {
    if (!me || !me.season) return '';
    const d = Math.ceil((me.season.end - (me.now || Date.now())) / 864e5);
    return d > 0 ? M().endsIn(d) : M().endsToday;
  }
  function backRow() { const r = el('div', 'rk-btns'); r.append(btn(M().back, '', () => close())); return r; }
  function renderQueue() {
    if (screen !== 'queue' || !Q) return renderBar();
    const L = M(), c = card(false);
    c.append(head('戦', L.searching, Q.ranked ? L.ranked : L.unranked));
    c.append(el('p', 'rk-count', fmtClock(Date.now() - Q.since)));
    c.append(el('p', 'rk-st', Q.window >= 100000 ? L.windowAny : L.window(Q.window || 100)));
    if (Q.people) c.append(el('p', 'rk-st', L.people(Q.people[0], Q.people[1])));
    if (flashMsg) { c.append(el('p', 'rk-err', flashMsg)); }
    const row = el('div', 'rk-btns');
    if (Date.now() - Q.since >= WARM_AFTER) row.append(btn(L.warm, 'primary', () => warmUp()));
    const cb = btn(L.cancel, '', () => { stopQueue(true); flashMsg = ''; show('home'); }); cb.id = 'rkCancel';
    row.append(cb);
    c.append(row);
    clearTimeout(renderQueue.t);
    renderQueue.t = setTimeout(() => { if (screen === 'queue') renderQueue(); }, 1000);
  }
  // the search bar over the warm-up fight
  // (a menu over the warm-up fight: pause, settings, moves, the result screen, the turn-your-phone hint, an ad)
  const OVER = ['pause', 'end', 'setOv', 'movesOv', 'honorOv', 'rk', 'rkConfirm'];
  const covered = () => !!(G.paused || (ND.portal && ND.portal.inAd) || OVER.some((id) => { const e = $(id); return e && !e.hidden && e.getClientRects().length > 0; }) ||
    (() => { const r = $('rotate'); return !!(r && getComputedStyle(r).display !== 'none'); })());
  function renderBar() {
    const b = $('rkBar');
    if (!b) return;
    const on = !!(Q && Q.warm && screen === null);
    clearTimeout(renderBar.t); clearInterval(renderBar.v);
    if (!on) { b.hidden = true; return; }
    const L = M();
    if (!b.firstChild) {
      const pill = el('button', 'rk-pill'); pill.type = 'button';
      pill.append(el('span', 'rk-dot'), el('span', 'rk-clk'), el('span', 'tag'));
      pill.onclick = () => endWarm(true);
      const x = el('button', 'rk-x', '✕'); x.type = 'button';
      x.onclick = () => { stopQueue(true); G.goMenu(); };
      b.append(pill, x);
    }
    const pill = b.querySelector('.rk-pill'), x = b.querySelector('.rk-x');
    pill.querySelector('.rk-clk').textContent = (L.searchShort || L.searching) + ' ' + fmtClock(Date.now() - Q.since);
    pill.querySelector('.tag').textContent = L.warmTag; // (Warm-up · CPU · unranked: this fight counts for nothing)
    pill.setAttribute('aria-label', L.searching + ' ' + fmtClock(Date.now() - Q.since) + ' · ' + L.warmTag + ' · ' + L.warmBack); pill.title = L.warmBack;
    x.setAttribute('aria-label', L.cancel); x.title = L.cancel;
    // just under the fight's HUD clock (the HUD's own height on this screen)
    // (and above the touch pad's swipe area, which starts lower on taller screens)
    try {
      const hud = $('hud'), app = $('app'), hr = hud && hud.getBoundingClientRect(), ar = app.getBoundingClientRect();
      if (hr && hr.height > 8) {
        let top = hr.bottom - ar.top + 2;
        const sw = $('tSwipe'), sr = sw && sw.getClientRects().length ? sw.getBoundingClientRect() : null;
        if (sr && sr.height > 0 && getComputedStyle(sw).visibility !== 'hidden') top = Math.min(top, sr.top - ar.top - 24 - 2);
        b.style.top = Math.round(Math.max(0, top)) + 'px';
      }
    } catch (e) { /* default place */ }
    const sync = () => { const hide = covered(); if (b.hidden !== hide) b.hidden = hide; };
    sync();
    renderBar.v = setInterval(sync, 150); // a pause or a menu hides it at once, resuming brings it back
    renderBar.t = setTimeout(renderBar, 1000);
  }
  function oppCard(v) {
    const L = M(), o = v.opp || {}, box = el('div', 'rk-opp');
    const nm = el('span', 'rk-name'); nm.appendChild(nameEl(o.name || '—'));
    box.append(nm);
    if (o.guest) box.append(el('span', 'rk-badge pl', L.guestTag)); else box.append(badge(o.tier, o.placement));
    box.append(titlesOf(o));
    box.append(el('span', 'rk-st', (o.touch ? '📱 ' + L.touch : '⌨ ' + L.keys) + (K && K.rtt ? ' · ' + Math.round(K.rtt) + ' ms' : '')));
    return box;
  }
  function renderFound() {
    if (screen !== 'found' || !X) return;
    const L = M(), v = X.view, c = card(false);
    c.append(head('戦', L.foundTitle, v.ranked ? L.ranked : L.unranked + (v.why_unranked && L.why[v.why_unranked] ? ' (' + L.why[v.why_unranked] + ')' : '')));
    c.append(oppCard(v));
    const left = Math.max(0, (v.accept_ms | 0) - (Date.now() - (X.viewAt || Date.now())));
    c.append(el('p', 'rk-count', String(Math.ceil(left / 1000))));
    const row = el('div', 'rk-btns');
    if (X.accepted) row.append(el('p', 'rk-st', L.waitOpp));
    else {
      const a = btn(L.accept, 'primary', () => accept(true)); a.id = 'rkAccept';
      row.append(a, btn(L.decline, '', () => accept(false)));
    }
    c.append(row);
    clearTimeout(renderFound.t);
    renderFound.t = setTimeout(() => { if (screen === 'found') renderFound(); }, 500);
    if (!X.accepted) setTimeout(() => { const b = $('rkAccept'); if (b && screen === 'found' && document.activeElement !== b) b.focus(); }, 0);
  }
  function renderPick() {
    if (screen !== 'pick' || !X) return;
    const L = M(), v = X.view, c = card(true);
    const left = Math.max(0, (v.pick_ms == null ? 15000 : v.pick_ms) - (Date.now() - (X.viewAt || Date.now())));
    const top = el('div', 'rk-row');
    top.append(head('選', L.pickTitle, L.pickSub), el('span', 'rk-count', String(Math.ceil(left / 1000))));
    top.style.justifyContent = 'space-between';
    c.append(top);
    c.append(el('p', 'rk-st', v.picked && v.picked[1] ? L.oppLocked : L.oppPicking));
    const allowed = v.chars || [], grid = el('div', 'rk-grid');
    for (const ch of ND.CHARS) {
      if (ch.id === 'shura' || ch.hidden) continue;
      const b = el('button', 'rk-ch'); b.type = 'button';
      const ok = allowed.includes(ch.id);
      b.disabled = !ok || X.picked; if (!ok) b.title = L.lockedFighter;
      b.setAttribute('aria-pressed', String(X.pick === ch.id));
      b.style.setProperty('--cc', ch.col.ui);
      const k = el('span', 'k', ch.kanji); k.setAttribute('aria-hidden', 'true');
      b.append(k, nameEl(ch.name.charAt(0) + ch.name.slice(1).toLowerCase()));
      b.setAttribute('aria-label', ch.name + (ok ? '' : ' · ' + L.lockedFighter));
      b.onclick = () => setPick(ch.id);
      grid.appendChild(b);
    }
    c.append(grid);
    // costumes this player owns for the chosen fighter (the server checks ownership again)
    const cos = X.pick && ND.rewards ? ND.rewards.costumesFor(X.pick) : [];
    if (cos.length) {
      const row = el('div', 'rk-row'); row.append(el('span', 'rk-lbl', L.costume));
      const seg = (id, text) => { const s = el('button', 'seg', text); s.type = 'button'; s.setAttribute('aria-pressed', String((X.look || null) === id)); s.disabled = X.picked; s.onclick = () => setPick(X.pick, id); row.append(s); };
      seg(null, L.plain); cos.forEach((e) => seg(e.id, ND.rewards.name(e)));
      c.append(row);
    }
    if (flashMsg) { c.append(el('p', 'rk-err', flashMsg)); flashMsg = ''; }
    const row = el('div', 'rk-btns');
    const lb = btn(X.picked ? L.lockedIn : L.lock, 'primary', () => lockIn()); lb.id = 'rkLock'; lb.disabled = X.picked || !X.pick;
    row.append(lb);
    c.append(row);
    // the time is nearly up with a fighter chosen: lock it in
    if (!X.picked && X.pick && left < 1200) lockIn();
    clearTimeout(renderPick.t);
    renderPick.t = setTimeout(() => { if (screen === 'pick') renderPick(); }, 500);
  }
  function renderVs() {
    if (screen !== 'vs' || !X || !X.view.live) return;
    const L = M(), v = X.view, P = v.live.picks, c = card(false);
    const vs = el('div', 'rk-vs');
    const f = (id, who) => { const ch = ND.CHARS[charIdx(id)] || ND.CHARS[0], d = el('div', 'f'); const k = el('b', null, ch.kanji); k.style.color = ch.col.ui; d.append(k, nameEl(ch.name), el('small', 'rk-st', who)); return d; };
    const mine = X.side;
    vs.append(f(P[0], mine === 0 ? L.you : (v.opp && v.opp.name) || ''), el('span', 'v', '対'), f(P[1], mine === 1 ? L.you : (v.opp && v.opp.name) || ''));
    c.append(vs);
    const a = ND.ARENAS.find((x) => x.id === v.live.arena);
    c.append(el('p', 'rk-st', (a ? a.name : '') + ' · ' + (v.ranked ? L.ranked : L.unranked)));
    if (!(K && K.connected)) c.append(el('p', 'rk-st', L.connecting));
  }
  function renderResult() {
    if (screen !== 'result' || !X) return;
    const L = M(), x = X, v = x.view, res = x.res || {}, R = v.result, c = card(false), side = x.side;
    let title = L.over, why = '';
    const w = R && R.winner != null ? R.winner : res.winner;
    if (R && (R.verdict === 'disputed' || v.status === 'disputed')) { title = L.nc; why = L.disputed; }
    else if (R && v.status === 'nc') { title = L.nc; why = (L.ncWhy && L.ncWhy[R.verdict]) || ''; }
    else if (w === -1) title = L.draw; else if (w === side) title = L.win; else if (w === 1 - side) title = L.lose;
    if (!why) why = res.self ? L.youLeft : res.reason === 'left' ? L.oppLeft : (R && R.verdict === 'silent' && w === side) ? L.silent : '';
    c.append(head(w === side && R ? '勝' : '試', title, (res.wins ? L.rounds(res.wins[side] | 0, res.wins[1 - side] | 0) + ' · ' : '') + (v.opp && v.opp.name ? v.opp.name : '')));
    if (why) c.append(el('p', 'rk-st', why));
    if (!R) {
      c.append(el('p', 'rk-st', Date.now() > (x.resultBy || Infinity) ? L.pending : L.confirming));
    } else if (R.rated && R.r && R.r[side]) {
      const my = R.r[side], d = my.delta | 0;
      const dl = el('p', 'rk-delta ' + (d >= 0 ? 'up' : 'down'), L.delta(d) + ' → ' + my.after); c.append(dl);
      if (my.placement === 0 && me && me.placement > 0) c.append(el('p', 'rk-st', L.placementDone));
      if (my.placement === 0 && my.tier !== my.tier_before) {
        const T = tierInfo(my.tier), s = el('p', 'rk-seal', T.k); s.style.setProperty('--tc', T.col); c.append(s);
        c.append(el('p', 'rk-st', (my.tier > my.tier_before ? L.promoted : L.demoted) + ' '));
        c.lastChild.appendChild(badge(my.tier, 0, true));
        try { if (!x.tierSnd && ND.audio) { x.tierSnd = true; const S = ND.audio.sfx; if (S) (my.tier > my.tier_before ? S.rankUp : S.rankDown)(); else if (my.tier > my.tier_before && ND.audio.gong) ND.audio.gong(); } } catch (e) { /* no sound */ }
      } else if (my.placement > 0) c.append(el('p', 'rk-st', L.placement(Math.max(0, placementTotal() - my.placement), placementTotal())));
      else c.append(badge(my.tier, 0));
      if (!x.meReloaded) { x.meReloaded = true; loadMe(); }
    } else if (R && !R.rated && v.status === 'done') c.append(el('p', 'rk-st', L.unrankedNote));
    const row = el('div', 'rk-btns');
    const fa = btn(L.findAgain, 'primary', () => findAgain()); fa.id = 'rkAgain';
    row.append(fa);
    const alive = K && K.connected && R && (v.status === 'done' || v.status === 'nc') && !res.self && res.reason !== 'left';
    if (alive) {
      const opp = v.rematch && v.rematch[1];
      const rb = btn(x.rematchAsked ? L.rematchWait : opp ? L.rematchAsk : L.rematch, '', () => rematch()); rb.disabled = x.rematchAsked;
      row.append(rb);
    }
    row.append(btn(L.board, '', () => { toMenu(); openHall(); }), btn(L.menu, '', () => toMenu()));
    c.append(row);
    setTimeout(() => { const b = $('rkAgain'); if (b && screen === 'result' && !c.contains(document.activeElement)) b.focus(); }, 0);
  }
  function hudShow(on) { build(); $('rkHud').hidden = !on; if (on) hudPing(); if (!on) confirmLeave(false); }
  function hudPing() { const e = $('rkPing'); if (!e || !K) return; const ms = Math.round(K.rtt); e.textContent = ms ? 'Ping ' + ms + ' ms' : ''; }
  function waitUi(kind, info) {
    build();
    const w = $('rkWait');
    if (kind === 'count') { w.hidden = true; if (G.showCount) G.showCount(info.n); return; }
    if (G.showCount) G.showCount(0);
    if (kind !== 'wait' && kind !== 'pause') { w.hidden = true; return; }
    const s = Math.ceil((info.left || 0) / 1000), L = M();
    $('rkWaitT').textContent = kind === 'wait' ? (info.away ? L.away(s) : L.waitIn(s)) : info.peer ? (info.peer === 'turn' ? L.turning(s) : L.away(s)) : L.paused;
    w.hidden = false;
  }
  function confirmLeave(on) { const c = $('rkConfirm'); if (!c) return; c.hidden = !on; if (on) setTimeout(() => $('rkStay').focus(), 0); }
  function open() {
    if (!available()) return;
    build();
    if (X && !X.done && screen !== 'match') { show(screen || 'found'); return; }
    if (Q) { show('queue'); return; }
    show('home');
    loadMe();
    if (ND.rewards) ND.rewards.refresh();
  }
  function close() { stopQueue(true); hideAll(); screen = null; $('menu').hidden = false; setTimeout(() => { const b = $('mranked'); if (b) b.focus(); }, 0); }
  function openHall() {
    close();
    if (ND.banzuke && ND.banzuke.ui && ND.banzuke.ui.showHall) ND.banzuke.ui.showHall('ranked', null);
  }

  // away from the match (the agreed pause of js/net.js): phone upright, tab hidden
  const PORTRAIT = (() => { try { return window.matchMedia('(orientation: portrait)'); } catch (e) { return { matches: false }; } })();
  function syncAway() {
    if (!NET.active || screen !== 'match') return;
    NET.setAway(document.hidden ? 'away' : ND.touch && ND.touch.active && PORTRAIT.matches ? 'turn' : null);
  }
  document.addEventListener('visibilitychange', () => { if (NET.active && screen === 'match') { NET.setHidden(document.hidden); syncAway(); NET.keepalive(); } });
  // the page goes away: a running match is left (the other device is told), a search leaves the queue at once (a
  // request that outlives the page) instead of pairing someone with a ghost for up to 8 s
  window.addEventListener('pagehide', () => {
    if (X && X.begun && !X.res) ctlSend({ t: 'leave' });
    if (Q && Q.ticket) {
      const a = adapter(), base = typeof C.SUPABASE_URL === 'string' ? C.SUPABASE_URL.trim().replace(/\/+$/, '') : '', key = typeof C.SUPABASE_ANON_KEY === 'string' ? C.SUPABASE_ANON_KEY.trim() : '';
      if (a && base && key) {
        const h = { apikey: key, 'Content-Type': 'application/json' };
        if (/^eyJ/.test(key)) h.Authorization = 'Bearer ' + key;
        try { fetch(base + '/rest/v1/rpc/nd_rank_leave', { method: 'POST', keepalive: true, headers: h, body: JSON.stringify({ p_secret: a.key() }), credentials: 'omit' }).catch(() => {}); } catch (e) { /* gone */ }
      }
    }
  });

  // ---------------------------------------------------------------- keys
  function onKey(e) {
    const I = ND.input;
    if (screen === 'match' && G.mode === 'online') {
      if (I.isPause(e) || I.isBack(e)) { confirmLeave($('rkConfirm').hidden); return true; }
      if (!$('rkConfirm').hidden) return !I.isEditable(e.target) && e.code !== 'Tab' && e.code !== 'Enter' && e.code !== 'Space';
      return false;
    }
    if (screen && screen !== 'match') {
      if (I.isEditable(e.target)) return false;
      if (I.isBack(e) && !e.repeat) {
        if (screen === 'home') close(); else if (screen === 'queue') { stopQueue(true); show('home'); } else if (screen === 'found') accept(false); else if (screen === 'result') toMenu();
        return true;
      }
      return false;
    }
    return false;
  }

  // ---------------------------------------------------------------- Hall of Champions: the "Ranked" tab (js/banzuke.js ext)
  async function hallRender(body, meBox, alive) {
    const L = M(), h = (t, c, x) => el(t, c, x);
    let top = null, hall = null, my = null;
    const loading = h('p', 'lb-empty', (ND.STR && ND.STR.bz && ND.STR.bz.hall && ND.STR.bz.hall.loading) || '…');
    body.appendChild(loading);
    try {
      [top, hall, my] = await Promise.all([plain('nd_rank_top', { p_season: null, p_limit: 50 }, 8000), plain('nd_rank_hall', { p_seasons: 12 }, 8000), call('nd_rank_me', {}, 8000).catch(() => null)]);
    } catch (e) {
      if (!alive()) return;
      loading.textContent = (M().err || TR.err).network;
      return;
    }
    if (!alive()) return;
    loading.remove();
    if (my && my.season) body.appendChild(h('div', 'hall-sub', L.season(my.season.id) + ' · ' + (me = my, seasonLeft())));
    body.appendChild(h('p', 'hall-sub', L.hallDesc(10)));
    const list = h('ol', 'rk-list');
    const rows = Array.isArray(top) ? top : [];
    for (const r of rows) {
      const li = h('li', my && my.player_id === r.player_id ? 'me' : '');
      li.append(h('span', 'pl', r.place <= 3 ? ['壱', '弐', '参'][r.place - 1] : String(r.place)));
      const n = h('span', 'n'); n.append(nameEl(LB().shownName ? LB().shownName(r.nick) || '—' : r.nick));
      const rt = r.title_id && ND.rewards ? ND.rewards.title(r.title_id) : null;
      if (rt) { const s = h('em', 'rk-tt rw', (rt.icon ? rt.icon + ' ' : '') + rt.name); if (rt.color) s.style.setProperty('--rc', rt.color); s.style.marginLeft = '6px'; n.append(s); }
      li.append(n, badge(r.tier, 0, true), h('span', 'sc', String(r.rating)));
      list.appendChild(li);
    }
    if (!rows.length) body.appendChild(h('p', 'lb-empty', L.empty)); else body.appendChild(list);
    // past seasons: the champion's name kept in the Hall
    body.appendChild(h('p', 'hall-sub', L.champs));
    const hs = Array.isArray(hall) ? hall.filter((s) => s && s.champion) : [];
    if (!hs.length) body.appendChild(h('p', 'lb-empty', L.noChamps));
    else {
      const g = h('div', 'rk-champs');
      for (const s of hs) {
        const a = h('article');
        a.append(h('span', 'rk-lbl', L.champOf(s.season)), h('b', null), h('small', 'rk-st', (s.top || []).slice(1).map((t) => t.place + '. ' + t.nick).join(' · ')));
        a.children[1].appendChild(nameEl('将 ' + (LB().shownName ? LB().shownName(s.champion) || '—' : s.champion)));
        g.appendChild(a);
      }
      body.appendChild(g);
    }
    meBox.textContent = '';
    if (my && !my.guest) { meBox.appendChild(h('span', 'hm-t', my.place ? L.me(my.place) : L.meNone)); meBox.hidden = false; }
  }
  function hookHall() {
    const B = ND.banzuke && ND.banzuke.ui;
    if (!B || !Array.isArray(B.TABS) || B.TABS.includes('ranked')) return;
    B.TABS.push('ranked');
    B.ext = B.ext || {};
    B.ext.ranked = { label: () => ({ k: '戦', n: M().hallTab }), render: hallRender, available: () => available() && serverHas() };
  }

  // ---------------------------------------------------------------- menu entry
  function addMenuEntry() {
    if ($('mranked')) return;
    const anchor = $('mfriend') || $('msingle') || $('mplay');
    if (!anchor) return;
    css();
    const b = document.createElement('button');
    b.className = 'mode friend ranked'; b.id = 'mranked'; b.type = 'button';
    // title + season tag ("SEASON 1 · ENDS IN 28 DAYS"), the description, and the seal: the player's tier kanji
    // (戦 until the server says, for guests and players still in placement)
    const s = document.createElement('strong'), st = el('span', 'rk-mt'), ms = el('small', 'rk-ms');
    s.append(st, ms);
    const d = document.createElement('span'); d.className = 'rk-md';
    const k = document.createElement('b'); k.className = 'mk rk-seal-m'; k.setAttribute('aria-hidden', 'true');
    b.append(s, d, k);
    b.onclick = () => { try { if (ND.audio) { ND.audio.init(); ND.audio.ui(); } } catch (e) { /* no sound yet */ } open(); };
    anchor.after(b);
    decorateEntry();
    syncMenuEntry();
  }
  function decorateEntry() {
    const b = $('mranked');
    if (!b) return;
    const L = M(), st = b.querySelector('.rk-mt'), ms = b.querySelector('.rk-ms'), d = b.querySelector('.rk-md'), k = b.querySelector('.rk-seal-m');
    if (st) st.textContent = L.title;
    if (d) d.textContent = L.menuSub;
    if (ms) ms.textContent = me && me.season ? L.season(me.season.id) + ' · ' + seasonLeft() : '';
    b.classList.toggle('has-season', !!(ms && ms.textContent));
    if (k) {
      const T = me && !me.guest && !(me.placement > 0) && me.tier != null ? tierInfo(me.tier) : null;
      k.textContent = T ? T.k : '戦';
      k.classList.toggle('two', k.textContent.length > 1);
      if (T) { k.style.setProperty('--tc', T.col); b.title = T.n; } else { k.style.removeProperty('--tc'); b.removeAttribute('title'); }
    }
  }
  // the entry shows only when the server has ranked (nd_ping features); once shown, the player's tier and the season
  // are asked for once (one request, a few seconds later)
  let menuAsked = false;
  function syncMenuEntry() {
    const b = $('mranked'); if (!b) return;
    b.hidden = !serverHas();
    if (b.hidden || menuAsked || me) { decorateEntry(); return; }
    menuAsked = true;
    setTimeout(async () => {
      if (me || !serverHas()) { decorateEntry(); return; }
      try { const r = await call('nd_rank_me', {}, 8000); if (r && typeof r === 'object' && !me) { me = r; if (ND.rewards && !r.guest) ND.rewards.setOwned(r.player_id, r.owned); } } catch (e) { /* the plain seal stays */ }
      decorateEntry();
    }, 2500);
  }

  // ---------------------------------------------------------------- public / test API
  const R = ND.ranked = {
    available, open, close, onKey, tierInfo, TIERS,
    find: () => find(), cancel: () => { stopQueue(true); show('home'); }, warmUp, endWarm: () => endWarm(true),
    accept: (ok) => accept(ok !== false), pick: (id, look) => { setPick(id, look); return lockIn(); }, choose: setPick,
    quit: () => quitMatch(), rematch: () => rematch(), findAgain: () => findAgain(), menu: () => toMenu(), reload: () => loadMe(),
    state: () => ({ screen, identity: identity(), server: serverHas(), queue: Q ? { ticket: Q.ticket, warm: Q.warm, window: Q.window, since: Q.since } : null,
      match: X ? { id: X.id, side: X.side, status: X.view.status, ranked: X.view.ranked, opp: X.view.opp, live: X.view.live || null, begun: X.begun, res: X.res || null,
        report: X.report, result: X.view.result || null, accepted: X.accepted, picked: X.picked, chars: X.view.chars || [] } : null,
      connected: !!(K && K.connected), rtt: K ? Math.round(K.rtt) : 0, me, flash: flashMsg }),
    // layout test (scripts/viewport-check.mjs): a screen with made-up data, no server
    demo(which) {
      build();
      demoOn = true;
      const opp = { name: 'Kenji', tier: 8, placement: 0, dan: 14, best_place: 2, wins: 0, podiums: 1, title_id: 'title_season_champion', touch: true };
      me = { season: { id: 3, end: Date.now() + 9 * 864e5 }, now: Date.now(), guest: false, rating: 1604, tier: 8, placement: 0, wins: 17, losses: 9, draws: 1, place: 12, games: 27, owned: [] };
      const view = { id: 'demo', side: 0, status: which === 'pick' ? 'picking' : 'found', ranked: true, opp, accept_ms: 12000, pick_ms: 15000, picked: [false, true],
        chars: ['akane', 'aoi', 'kuro', 'yuki', 'hana'], acc: [null, null], live: { seed: 1, arena: 'temple', picks: ['akane', 'hana'], looks: [null, null] },
        result: which === 'result' ? { rated: true, winner: 0, verdict: 'ok', r: [{ before: 1590, after: 1608, delta: 18, tier: 9, tier_before: 8, placement: 0 }, { delta: -18 }] } : null, rematch: [false, false] };
      Q = null;
      X = which === 'home' || which === 'queue' ? null : { id: 'demo', side: 0, view, since: Date.now(), accepted: false, picked: false, pick: 'akane', look: null, begun: false,
        res: which === 'result' ? { reason: 'ko', winner: 0, wins: [2, 1] } : null, report: which === 'result' ? {} : null, done: which === 'result', tFound: Date.now(), demo: true };
      if (which === 'queue') { Q = { ticket: 'demo', since: Date.now() - 31000, warm: false, ranked: true, window: 565, people: [3, 12], demo: true, timer: 0 }; }
      show(which === 'vs' ? 'vs' : which);
    },
    endDemo() { if (Q && Q.demo) Q = null; if (X && X.demo) X = null; hideAll(); screen = null; },
  };

  if (!available()) return;
  addMenuEntry();
  hookHall();
  // the server's answer (nd_ping features) decides whether the entry shows
  if (LB() && LB().onChange) LB().onChange(() => { syncMenuEntry(); });
  // "Play with a friend" owns the online hooks of game.js; ranked goes first where it is the one running
  const O = ND.online;
  if (O) {
    const ok = O.onKey, lv = O.leave, es = O.endShown;
    O.onKey = (e) => onKey(e) || (ok ? ok(e) : false);
    O.leave = function () { if (X && (screen === 'match' || screen === 'result')) { if (screen === 'match') confirmLeave(true); else toMenu(); return; } return lv.apply(this, arguments); };
    O.endShown = () => (screen === 'result' && !!$('rk') && !$('rk').hidden) || (es ? es() : false);
    const tagDesc = Object.getOwnPropertyDescriptor(O, 'friendTag');
    Object.defineProperty(O, 'friendTag', { configurable: true, enumerable: true, get() {
      if (X && (screen === 'match' || beginning)) { const n = X.view.opp && X.view.opp.name; if (n) return String(n).slice(0, 20); }
      return tagDesc && tagDesc.get ? tagDesc.get.call(O) : 'FRIEND';
    } });
  }
  // anything that takes the game out of a running ranked match without the ranked screens (a menu key…) leaves it
  // properly (the other device is told at once, this player loses); the warm-up's own menu button returns to the search
  const start0 = G.start;
  G.start = function (mode) {
    if (!beginning && !starting && !warmStarting) {
      if (mode !== 'online' && X && X.begun && screen === 'match') { quitMatch(); }
      else if (Q && Q.warm && mode !== 'cpu') { Q.warm = false; const r = start0.apply(this, arguments); show('queue'); return r; }
    }
    return start0.apply(this, arguments);
  };
  if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(() => { relabel(); if (screen && screen !== 'match') render(); });
})(window.ND);
