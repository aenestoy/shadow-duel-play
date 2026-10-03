





















(function (ND) {
  'use strict';
  const G = ND.game, NET = ND.net;
  if (!G || !NET) return;
  const $ = (id) => document.getElementById(id);
  const C = ND.CONFIG || {};
  const PROTO = 1;
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
    searching: 'Rakip aranıyor…', window: (n) => `Puan aralığı ±${n}`, windowAny: 'Her puan aralığı',
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
    ghostFound: 'Gerçek bir oyuncunun gölgesi geldi',
    ghostHouseName: (n) => `Dojo gölgesi · ${n}`, ghostHouseFound: 'Bir dojo gölgesi geldi', ghostHouseNote: 'Dojodan tipik bir tarzda dövüşen bilgisayar; canlı bir oyuncu değil.', ghostName: (n) => { const g = trGen(n); return g ? `${g} gölgesi` : `Gölge · ${n}`; }, ghostTag: 'Gölge',
    ghostNote: 'Bu, gerçek bir oyuncunun tarzında dövüşen bilgisayar; canlı bir oyuncu değil.',
    ghostReady: 'Gölge hazır',
    ghostLeft: 'Gölge maçından çıktın: yenilgi.', aiTag: 'YZ',
    hallTab: 'Dereceli', hallDesc: (g) => `Bu sezonun en iyileri · sıralamaya girmek için ${g} puanlı maç`, champs: 'Şampiyonlar', champOf: (n) => `Sezon ${n} şampiyonu`,
    noChamps: 'Henüz sezon şampiyonu yok.', me: (p) => `Senin yerin: ${p}.`, meNone: 'Sıralamaya girmek için puanlı maç oyna.', empty: 'Bu sezon henüz kimse sıralamada değil.',
    tierDesc: ['Ayak askeri', 'Efendisiz samuray', 'Samuray', 'Sancak muhafızı', 'Derebeyi', 'Şogun'],
    rulesBtn: 'Derece sistemi', rulesTitle: 'Derece sistemi', rulesSub: 'Kademeler, puan ve sezonlar', rTiers: 'Kademeler', rYou: 'Sen',
    rNext: (n, name) => `${name} için ${n} puan`, rTop: 'En üst kademedesin', rPlacing: (a, b) => `Yerleştirme ${a}/${b}: bitince kademen görünür`,
    rPlacement: 'Yerleştirme', rPlaceLine: (a, b) => `İlk ${a} dereceli maçın seni yerleştirir (sonraki sezonlarda ${b}); sonra kademen görünür.`,
    rPoints: 'Puan', rPointsLines: ['Kazanınca puan alırsın, kaybedince düşer; beraberlik az oynatır.', 'Güçlü bir rakibi yenmek daha çok puan kazandırır; zayıf birine kaybetmek daha çok kaybettirir.', 'Maçtan çıkmak yenilgi sayılır.'],
    rSeason: 'Sezon', rSeasonLine: (d, left) => `Bir sezon ${d} gün sürer · ${left}.`,
    rSeasonEnd: (p) => `Sezon sonunda puanın 1500'e doğru yarı yarıya yaklaşır ve yeniden ${p} yerleştirme maçı oynarsın; en yüksek kademen rozet olarak kalır.`,
    rReward: (list, n) => `Sezonun 1.'si kazanır: ${list} (sıralamada en az ${n} oyuncu varsa).`, rCostumeAll: (x) => `${x} (her dövüşçü için)`, rRewardAny: 'özel bir kostüm ve unvan',
    rBoard: 'Sıralama', rBoardLine: (g) => `Girmek için: bu sezon ${g} puanlı maç ve yerleştirmenin bitmesi.`,
    rFighters: 'Dövüşçüler', rFightersLine: 'Tek oyunculu modda açtığın dövüşçüleri seçebilirsin.',
    aiNote: 'Az oyuncu çevrimiçiyken, gerçek oyuncuların tarzında oynayan yapay zekâ rakiplerle eşleşebilirsin.', gotIt: 'Anladım',
    err: { network: 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.', bad_version: 'Oyunun yeni sürümü var: sayfayı yenile.', busy: 'Kuyruk çok dolu, birazdan tekrar dene.',
      rate_limited: 'Çok sık denedin, biraz bekle.', disabled: 'Dereceli şu an kapalı.', banned: 'Bu hesap dereceli oynayamaz.', other: 'Bir sorun oldu, tekrar dene.' },
  };
  const M = () => (ND.STR && ND.STR.ranked && typeof ND.STR.ranked.title === 'string' ? ND.STR.ranked : TR);


  function trGen(n) {
    const s = String(n || ''), low = s.toLocaleLowerCase('tr'), V = 'aeıioöuü';
    if (!/[a-zçğıöşü]$/.test(low)) return null;
    let v = '';
    for (let i = low.length - 1; i >= 0 && !v; i--) if (V.includes(low[i])) v = low[i];
    if (!v) return null;
    const suf = 'aı'.includes(v) ? 'ın' : 'ei'.includes(v) ? 'in' : 'ou'.includes(v) ? 'un' : 'ün';
    return s + "'" + (V.includes(low[low.length - 1]) ? 'n' : '') + suf;
  }



  const TIERS = [['足軽', 'Ashigaru'], ['浪人', 'Rōnin'], ['侍', 'Samurai'], ['旗本', 'Hatamoto'], ['大名', 'Daimyō'], ['将軍', 'Shōgun']];
  const TCOL = ['#9aa3ad', '#8fb3c9', '#d9b36c', '#e38b5c', '#c65bd0', '#ffd35a'];
  const DIV = ['', 'I', 'II', 'III'];
  function tierInfo(i) {
    i = Math.max(0, Math.min(15, i | 0));
    const t = i === 15 ? 5 : Math.floor(i / 3), d = i === 15 ? 0 : 3 - (i % 3);
    return { t, d, k: TIERS[t][0], n: TIERS[t][1] + (d ? ' ' + DIV[d] : ''), col: TCOL[t], desc: (M().tierDesc || TR.tierDesc)[t] };
  }
  function tierFloor(i) { return i <= 0 ? -Infinity : i === 1 ? 1117 : i === 2 ? 1183 : i >= 15 ? 2050 : 1250 + 200 * Math.floor((i - 3) / 3) + [0, 67, 133][(i - 3) % 3]; }






  const emblem = (tier, opts) => { try { const E = ND.rankEmblem; if (!E || !E.el) return null; const s2 = E.el(tier, opts); s2.setAttribute('aria-hidden', 'true'); return s2; } catch (e) { return null; } };
  function badge(tier, placement, small, o) {
    o = o || {};
    const b = document.createElement('span'), pl = placement > 0 || tier == null;
    const size = o.size || (small ? 22 : 30);
    const em = emblem(pl ? 'placement' : Math.max(0, Math.min(15, tier | 0)), { size, glow: size >= 40, anim: size >= 40, placed: o.placed, of: o.of });
    b.className = 'rk-badge' + (small ? ' sm' : '') + (em ? ' em' : '') + (o.big ? ' big' : '') + (pl ? ' pl' : '');
    if (em) b.append(em);
    if (pl) { b.append(el('span', null, M().placementTag)); return b; }
    const T = tierInfo(tier), n = document.createElement('span');
    if (!em) { const k = document.createElement('b'); k.textContent = T.k; k.setAttribute('aria-hidden', 'true'); b.append(k); }
    n.textContent = o.whole ? TIERS[T.t][1] : T.n; n.lang = 'en'; n.setAttribute('translate', 'no');
    b.style.setProperty('--tc', T.col); b.title = T.desc; b.append(n);
    return b;
  }


  const LB = () => ND.leaderboard;
  const adapter = () => { const L = LB(); const a = L && L.adapter; return a && a.name === 'supabase' && typeof a.rpc === 'function' ? a : null; };
  let demoOn = false;
  const serverHas = () => { if (demoOn) return true; const a = adapter(); return !!(a && Array.isArray(a.features) && a.features.includes('ranked')); };
  function available() {
    const P = ND.platform || {};
    if (!P.allowNetwork || typeof RTCPeerConnection !== 'function') return false;
    return !!(ND.online && ND.online.available && ND.online.available());
  }
  const errCode = (e) => (e && e.code) || 'other';

  async function call(fn, args, ms) {
    const a = adapter();
    if (!a) throw Object.assign(new Error('network'), { code: 'network' });
    if (a.authed) return a.authed(fn, (k) => Object.assign({ p_secret: k }, args || {}), ms || 9000);
    return a.rpc(fn, Object.assign({ p_secret: a.key() }, args || {}), ms || 9000);
  }
  const plain = (fn, args, ms) => { const a = adapter(); return a ? a.rpc(fn, args || {}, ms || 9000) : Promise.reject(Object.assign(new Error('network'), { code: 'network' })); };

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


  let screen = null;
  let me = null, stats = null, flashMsg = '', busyCall = false;
  let Q = null;
  let X = null;
  let K = null;
  let matchNo = 0, earlyGo = null;

  const numOf = (id) => (parseInt(String(id).slice(0, 2), 16) | 0) || 1;
  const later = (fn, ms) => setTimeout(fn, ms);


  const busy = () => !!(Q || (X && !X.done)) ;
  if (ND.ads) {
    const el = ND.ads.eligible.bind(ND.ads), ra = ND.ads.rewardedAvailable.bind(ND.ads);
    ND.ads.eligible = function () { return busy() ? false : el(); };
    ND.ads.rewardedAvailable = function () { return busy() ? false : ra(); };
  }
  const bridge = () => (window.NDPortal && window.NDPortal.rooms && window.NDPortal.rooms.available() ? window.NDPortal.rooms : null);
  function portalRoom(on) { const P = bridge(); if (!P) return; try { if (on) P.open('ranked-' + String(X && X.id || '').slice(0, 8), false); else P.close(); } catch (e) {           } }


  async function loadMe() {
    try {
      const r = await call('nd_rank_me', {}, 8000);
      if (r && typeof r === 'object') {
        me = r;
        if (ND.rewards && !r.guest) ND.rewards.setOwned(r.player_id, r.owned);
      }
    } catch (e) { if (!me) me = null; }
    try { stats = await plain('nd_rank_stats', {}, 6000); } catch (e) {            }
    decorateEntry();
    boardFallback();
    if (screen === 'home') render();
  }


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
    Q = { ticket: r.ticket, since, polls: 0, timer: 0, warm: false, ranked: !!r.ranked, window: 100, ghost: null };
    show('queue');
    schedulePoll(POLL_FIRST);
    if (Q.ranked) ghostInfo(Q);
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
    if (r && r.state === 'gone') { find(); return; }
    if (r && r.state === 'search') {
      q.window = r.window;
      maybeGhost(q);
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


  function onFound(view) {
    if (X && X.ghost && !X.begun) { dropOffer(X); X = null; }
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

    if (X && X.alerted) return;
    if (X) X.alerted = true;
    try { if (ND.audio) { ND.audio.init(); if (ND.audio.sfx) ND.audio.sfx.matchFound(); else if (ND.audio.gong) ND.audio.gong(); else if (ND.audio.ui) ND.audio.ui(); } } catch (e) {                }
    if (!document.hidden) return;
    const t0 = document.title, msg = M().foundTitle;
    let n = 0;
    const iv = setInterval(() => { document.title = n++ % 2 ? t0 : msg; if (!document.hidden || n > 40) { clearInterval(iv); document.title = t0; } }, 700);
  }
  async function accept(ok) {
    if (X && X.ghost) { ghostAccept(ok); return; }
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

    if (X !== x || x.done || (x.begun && !x.report) || (x.resultAt && Date.now() - x.resultAt > 125000) || (x.report && !x.resultAt && Date.now() > x.resultBy)) { if (X === x && screen === 'result') renderResult(); return; }
    pollMatchSoon(x.view.status === 'live' && x.begun ? POLL_MS : POLL_MATCH);
  }

  function onView(v) {
    const x = X;
    if (!x || !v || v.id !== x.id) return;
    const was = x.view.status;
    x.view = v; x.viewAt = Date.now();
    handleSignal(v);
    if (v.status === 'declined' || v.status === 'cancelled') {

      const keep = x.id, since = x.since, why = v.status;
      closeConn(); X = null;
      if (why === 'declined' && v.acc && v.acc[0] === false) { flashMsg = M().youDeclined; show('home'); return; }
      Q = { since };
      flashMsg = why === 'cancelled' ? M().noConnect : M().declined;
      find(keep);
      return;
    }
    if (v.status === 'picking' && screen !== 'pick') show('pick');
    else if (v.status === 'picking') renderPick();
    if (v.live && !x.tLive) { x.tLive = Date.now(); showVs(); }
    if (v.result && !x.resultAt) x.resultAt = Date.now();

    if (v.result && v.status === 'done' && v.result.verdict === 'ok' && x.style && !x.styleSent && identity() !== 'guest') {
      x.styleSent = true;
      call('nd_rank_style', { p_match: x.id, p_style: x.style }, 8000).catch(() => {});
    }

    if (v.log_want && x.log && !x.logSent) { x.logSent = true; call('nd_rank_log', { p_match: x.id, p_log: x.log }, 9000).catch(() => { x.logSent = false; }); }
    if (v.next && x.rematchAsked) { onRematchView(v); return; }
    if (v.result && x.report) showResult();
    if (screen === 'found' && was === 'found') renderFound();
  }









  const ghostOk = () => !!(ND.ghost && typeof ND.ghost.level === 'function');


  const ghostLabel = (o, L = M()) => (o && o.house ? L.ghostHouseName(o.name || '—') : L.ghostName((o && o.name) || '—'));
  const GHOST_GO_MS = 3000;

  const aiTag = () => { const t = el('span', 'rk-ai-tag', M().aiTag || TR.aiTag); t.lang = M() === TR ? 'tr' : (ND.i18n && ND.i18n.lang) || 'en'; return t; };
  async function ghostInfo(q) {
    if (!ghostOk() || !q.ranked) return;
    let r = null;
    try { r = await call('nd_rank_ghost', { p_ticket: q.ticket, p_take: false }, 8000); } catch (e) { r = null; }
    if (Q !== q) return;
    q.ghost = r && typeof r === 'object' ? r : { on: false, why: 'network' };
    if (!(+q.ghost.v >= 2)) q.ghost = { on: false, why: 'old_server' };
    q.ghostAt = Date.now() + Math.max(0, (+q.ghost.wait_s || 0) * 1000);
    if (screen === 'queue') renderQueue();
  }

  function maybeGhost(q) {
    const g = q.ghost;
    if (!g || q.ghostBusy || q.warm || X || Date.now() < (q.ghostAt || 0)) return;

    if (!g.on && g.why !== 'humans') return;
    q.ghostBusy = true;
    call('nd_rank_ghost', { p_ticket: q.ticket, p_take: true }, 9000).then((r) => {
      q.ghostBusy = false;
      if (r && r.ok && r.offer) {
        if (Q !== q || X) { dropOffer(r.offer); return; }
        onGhostOffer(q, r.offer);
        return;
      }
      if (Q !== q) return;
      const why = r && typeof r.why === 'string' ? r.why : 'other';
      q.ghost = Object.assign({}, g, r && typeof r === 'object' ? r : {}, { on: why === 'early', why });
      q.ghostAt = Date.now() + (why === 'early' ? Math.max(1, +r.wait_s || 1) * 1000 : 20000);
      if (screen === 'queue') renderQueue();
    }).catch(() => { q.ghostBusy = false; q.ghostAt = Date.now() + 15000; });
  }
  function dropOffer(o) { if (o && o.id && o.token) call('nd_rank_ghost_start', { p_match: o.id, p_token: o.token, p_ninja: null }, 6000).catch(() => {}); }
  function onGhostOffer(q, o) {
    if (!(+o.v >= 2)) { dropOffer(o); q.ghost = { on: false, why: 'old_server' }; return; }
    const w = Math.max(0, Math.min(1, +o.weight || 0));
    const x = X = { ghost: true, id: o.id, token: o.token, side: 0, since: q.since, timer: 0, accepted: false, picked: false, pick: null, look: null, begun: false,
      report: null, result: null, done: false, tFound: Date.now(), viewAt: Date.now(), tLive: 0, log: '',
      view: { id: o.id, status: 'found', side: 0, ranked: true, ghost: true, weight: w, accept_ms: +window.__rkGhostGoMs || GHOST_GO_MS, pick_ms: 15000,
        opp: { name: String(o.nick || '—'), ghost: true, house: !!o.house, tier: o.tier == null ? null : o.tier | 0, placement: 0, flair: o.flair && typeof o.flair === 'object' ? o.flair : null },
        chars: Array.isArray(o.chars) ? o.chars.filter((c) => typeof c === 'string') : [], picked: [false, true], live: null, result: null } };
    alertFound();
    show('found');
    const tick = () => {
      if (X !== x || x.accepted) return;
      if (Date.now() - x.viewAt >= x.view.accept_ms) { ghostAccept(true); return; }
      x.timer = later(tick, 500);
    };
    x.timer = later(tick, 500);
  }


  function ghostAccept(ok) {
    const x = X;
    if (!x || !x.ghost || x.accepted) return;
    clearTimeout(x.timer);
    if (!ok) {
      dropOffer(x); X = null;
      if (Q) { Q.ghost = Object.assign({}, Q.ghost, { on: false, why: 'declined' }); show('queue'); } else show('home');
      return;
    }
    x.accepted = true;
    stopQueue(true);
    x.view.status = 'picking'; x.viewAt = Date.now();
    show('pick');
  }
  async function ghostStart(x) {
    let r = null;
    try { r = await call('nd_rank_ghost_start', { p_match: x.id, p_token: x.token, p_ninja: x.pick }, 9000); } catch (e) { r = { ok: false, error: errCode(e) }; }
    if (X !== x) return;
    if (!r || !r.ok || !r.live) {
      if (r && r.error === 'locked_fighter') { x.picked = false; x.pick = null; flashMsg = M().lockedFighter; renderPick(); return; }
      X = null; flashMsg = (M().err || TR.err)[r && r.error] || (M().err || TR.err).other; show('home');
      return;
    }
    x.view.status = 'live'; x.view.live = r.live; x.tLive = Date.now();
    show('vs');
    later(() => { if (X === x && !x.begun) beginGhost(x); }, VS_MS);
  }
  function beginGhost(x) {
    const L = x.view.live, c0 = charIdx(L.picks[0]), c1 = charIdx(L.picks[1]);
    if (c0 < 0 || c1 < 0 || !ARENAS.includes(L.arena) || !ghostOk()) { X = null; flashMsg = (M().err || TR.err).other; show('home'); return; }
    x.begun = true;
    hideAll();
    screen = 'match';
    if ($('first')) $('first').hidden = true;
    beginning = true;
    if (ND.pass && ND.pass.matchFlair) ND.pass.matchFlair(0, x.view.opp);
    try { G.newMatch('shadow', { c1: c0, c2: c1, arena: L.arena, seed: L.seed | 0, ai: ND.ghost.level(L.style, L.rating, L.picks[1]) }); } finally { beginning = false; }
    hudShow(true);
  }

  function shadowEnded(wid) {
    const x = X;
    if (!x || !x.ghost || !x.begun || x.res) return;
    x.res = { reason: 'ko', winner: wid === 0 || wid === 1 ? wid : -1, wins: G.wins.slice() };
    hudShow(false);
    ghostReport(x);
    setTimeout(() => { if (X === x) show('result'); }, 500);
  }
  function ghostReport(x) {
    if (x.report) return;
    const r = x.report = { reason: x.res.reason, winner: x.res.winner, wins: x.res.wins || null, v: version() };
    const send = (n) => call('nd_rank_ghost_report', { p_match: x.id, p_token: x.token, p_res: r }, 9000).then((v) => onGhostResult(x, v))
      .catch(() => { if (n < 4 && X === x) setTimeout(() => send(n + 1), 3000 * (n + 1)); });
    send(0);
    x.resultBy = Date.now() + RESULT_MS;
  }
  function onGhostResult(x, v) {
    if (X !== x || !v || typeof v !== 'object' || !v.result) return;
    x.view.result = v.result; x.view.status = v.status || 'done'; x.resultAt = Date.now();
    if (screen === 'result') renderResult(); else if (x.res) show('result');
  }

  function sampleDist(x) {
    const F = G.F;
    if (!F || G.phase !== 'fight') return;
    const me = F[x.side], o = F[1 - x.side];
    if (!me || !o || (me.state !== 'move' && me.state !== 'guard')) return;
    const d = x.dist || (x.dist = [0, 0]);
    d[0] += Math.abs(o.x - me.x); d[1]++;
  }


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
    if (x.ghost) { ghostStart(x); return; }
    let v = null;
    try { v = await call('nd_rank_pick', { p_match: x.id, p_ninja: x.pick, p_look: x.look || null }, 8000); } catch (e) {
      if (X === x) { x.picked = false; if (errCode(e) === 'locked_fighter') { x.pick = null; flashMsg = M().lockedFighter; } renderPick(); }
      return;
    }
    if (v) onView(v);
  }


  function iceConfig() {
    if (ND.online && typeof ND.online.iceConfig === 'function') { try { return Promise.resolve(ND.online.iceConfig()).catch(() => ({ iceServers: C.ICE_SERVERS || [] })); } catch (e) {                 } }
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


      console.warn('[ranked] connection', e);
      lost(k);
    });
  }

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
      try { if (k.ctl) k.ctl.close(); } catch (e) {              }
      try { if (k.inp) k.inp.close(); } catch (e) {              }
      try { if (k.pc) k.pc.close(); } catch (e) {              }
    }, 150);
  }
  function lost(k) {
    if (K !== k) return;
    const was = k.connected;
    k.connected = false; clearInterval(k.pingT);
    if (X && X.begun && NET.active && !X.done) { NET.end('drop', X.side); return; }
    if (!was && X && !X.begun && !k.failed) failConn();
  }

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
    const go = () => { try { if (ch.readyState === 'open' && ch.bufferedAmount < 65536) ch.send(buf); } catch (e) {               } };
    if (!E) return go();
    if (E.loss > 0 && Math.random() < E.loss) return;
    const d = (E.delay || 0) + Math.random() * (E.jitter || 0);
    if (d > 0) setTimeout(go, d); else go();
  }
  function ctlSend(o, k = K) {
    if (!k || !k.ctl || k.ctl.readyState !== 'open') return;
    const ch = k.ctl, s = JSON.stringify(o), E = netem();
    const go = () => { try { if (ch.readyState === 'open') ch.send(s); } catch (e) {               } };
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
      case 'go': if (S) NET.peerReady(m.m); else earlyGo = m.m; break;
      case 'pause': NET.peerPause(m.m, m.at, m.why); break;
      case 'resume': NET.peerResume(m.m); break;
      case 'end': if (S && !S.finished && (m.m & 255) === S.m) NET.end(m.why === 'desync' ? 'desync' : 'away', -1); break;
      case 'leave': if (X && X.begun && S && !S.finished) NET.end('left', X.side); break;
      default:
    }
  }


  function showVs() {
    const x = X;
    if (!x || !x.view.live) return;
    show('vs');
    later(() => { if (X === x && !x.begun) { x.vsDone = true; maybeBegin(); } }, VS_MS);

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
    if (ND.pass && ND.pass.matchFlair) ND.pass.matchFlair(x.side, x.view.opp);
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
    x.keepT = setInterval(() => { if (X === x && NET.active) { syncAway(); NET.keepalive(); sampleDist(x); } }, 250);
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

  function matchOver(x, res) {
    if (X !== x) return;
    x.res = res;

    try { if (ghostOk() && res.reason === 'ko') { const S = NET.session(); if (S) x.style = ND.ghost.sample({ mine: S.L, opp: S.R, n: S.flushed, stats: G.stats && G.stats[x.side], dist: x.dist }); } } catch (e) { x.style = null; }
    if (res.reason === 'drop' || res.reason === 'desync' || res.reason === 'pause') ctlSend({ t: 'end', why: res.reason, m: matchNo });
    waitUi('ok');
    hudShow(false);
    setTimeout(() => sendReport(x, res), 0);
    setTimeout(() => { if (X === x) show('result'); }, res.reason === 'ko' ? 500 : 0);

    const xr = ND.pass && ND.pass.onlineResult ? ND.pass.onlineResult('ranked', res) : null;
    if (xr && ND.pass.rankedHonor) {
      const st = (G.stats && G.stats[x.side]) || {};
      ND.pass.rankedHonor({ mode: 'ranked', won: res.winner === x.side, rounds: res.wins ? res.wins[x.side] : 0, parries: st.parries, counters: st.counters, rallies: st.rallies, perfects: st.perfect });
    }
  }
  function sendReport(x, res, self) {
    if (x.report) return;
    const side = x.side;
    let r;
    if (self) r = { reason: 'left', left: side, winner: 1 - side };
    else if (res.reason === 'ko') r = { reason: 'ko', winner: res.winner };
    else if (res.reason === 'left') r = { reason: 'left', left: 1 - side, winner: side };
    else if (res.reason === 'drop') r = { reason: 'drop', winner: side };
    else if (res.reason === 'away') r = { reason: 'drop', winner: side };
    else if (res.reason === 'pause') r = { reason: 'pause', winner: res.winner };
    else if (res.reason === 'desync') r = { reason: 'desync', winner: -1, info: NET.stats() ? { desync: NET.stats().desync } : null };
    else r = { reason: 'drop', winner: side };
    if (res) {
      const step = res.confirmed | 0, h = step - (step % 60);
      r.step = step; r.dig = res.dig || null; r.wins = res.wins || null; r.hash = NET.finalAt(h) || null;
    }
    r.v = version();
    try { if (typeof window.__ndRankReport === 'function') r = window.__ndRankReport(r) || r; } catch (e) {                 }
    x.report = r;
    try { x.log = NET.active ? NET.inputLog() : ''; } catch (e) { x.log = ''; }
    const send = (n) => call('nd_rank_report', { p_match: x.id, p_res: r }, 9000).then((v) => onView(v))
      .catch(() => { if (n < 4 && X === x) setTimeout(() => send(n + 1), 3000 * (n + 1)); });
    send(0);
    x.resultBy = Date.now() + RESULT_MS;
    pollMatchSoon(POLL_MS);
  }

  function quitMatch() {
    const x = X;
    if (!x) return;
    if (x.ghost) {

      if (x.begun && !x.res) {
        x.res = { reason: 'left', winner: 1, wins: G.wins.slice(), self: true };
        ghostReport(x);
        starting = true; try { G.start('attract'); } finally { starting = false; }
        hudShow(false); waitUi('ok');
        show('result');
        return;
      }
      if (!x.begun) { dropOffer(x); X = null; toMenu(); }
      return;
    }
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

    setTimeout(() => { if (!screen) loadMe(); }, 1500);
  }
  function findAgain() {
    teardownMatch(true); X = null;
    starting = true; try { G.start('attract'); } finally { starting = false; }
    $('menu').hidden = true;
    find();
  }
  let starting = false;


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
  .rk-st.rk-shield { color: #9fd0ff; font-weight: 600; }
  .rk-st.rk-honor { color: var(--gold); font-weight: 600; }
  .rk-err { color: #ffb4a8; font-size: 14px; }
  .rk-lbl { font: 500 11px/1 var(--display); letter-spacing: .2em; text-transform: uppercase; color: var(--muted); }
  .rk-badge { display: inline-flex; align-items: baseline; gap: 6px; padding: 5px 10px; border: 1px solid var(--tc, var(--line)); color: var(--tc, var(--text)); font: 600 16px/1 var(--display); letter-spacing: .06em; white-space: nowrap; }
  .rk-badge b { font: 700 20px/1 var(--jp); }
  .rk-badge.pl { color: var(--muted); border-style: dashed; }
  .rk-badge.sm { padding: 2px 6px; font-size: 12px; } .rk-badge.sm b { font-size: 14px; }
  /* with its emblem (js/rank-emblem.js): no frame, the crest and the name in the tier's colour */
  .rk-badge.em { align-items: center; gap: 7px; padding: 0; border: 0; }
  .rk-badge.em svg { flex: none; }
  .rk-badge.em.sm { gap: 5px; padding: 0; }
  .rk-badge.em.pl { color: var(--muted); }
  .rk-badge.em.big { flex-direction: column; gap: 4px; }
  .rk-big { display: grid; grid-template-columns: auto 1fr; gap: 6px 16px; align-items: center; padding: 12px; border: 1px solid var(--line); background: rgba(0,0,0,.25); }
  .rk-big .rk-badge { grid-row: span 2; font-size: 20px; padding: 10px 14px; } .rk-big .rk-badge b { font-size: 34px; }
  .rk-big .rk-badge.em { padding: 0 4px; font-size: 17px; }
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
  /* pick: the chosen fighter, live (a box the canvas fills: the canvas follows the box, never the other way round) —
     above the fighters when upright, beside them when sideways; big enough for the costume to read */
  .rk-pk { display: grid; gap: 12px; min-width: 0; }
  .rk-pkr { display: grid; gap: 12px; align-content: start; min-width: 0; }
  .rk-pv { position: relative; height: clamp(150px, 30vh, 300px); border: 1px solid var(--line); background: rgba(0,0,0,.28); overflow: hidden; }
  .rk-pv canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .rk-pv.dim canvas { opacity: .35; filter: grayscale(.7); }
  /* (upright: four fighters a row, so the picture and the costume row fit a 360×740 phone without scrolling) */
  @media (orientation: portrait) { .rk-pk.pv .rk-grid { grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); } }
  @media (orientation: landscape) {
    .rk-pk.pv { grid-template-columns: minmax(150px, 32%) minmax(0, 1fr); }
    .rk-pv { height: auto; min-height: clamp(140px, 40vh, 300px); } /* (not taller than wide: a long blade held out stays inside) */
  }
  /* (short and wide, beside the picture: the costume choices keep to one line; their label is read out (the row's name), not shown; tighter gaps) */
  @media (orientation: landscape) and (max-height: 460px) {
    .rk-pk.pv .rk-pkr .rk-row .rk-lbl { display: none; }
    .rk-pk, .rk-pkr { gap: 8px; }
  }
  /* "How ranked works": the card keeps to the screen, its middle scrolls (no bar) when it does not fit; the ladder on the
     left, the rules on the right (one column on narrow screens) */
  #rk .rk-card.rules { display: flex; flex-direction: column; max-height: 100%; min-height: 0; }
  .rk-rules { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: 12px 24px; align-items: start; }
  .rk-rules::-webkit-scrollbar { display: none; }
  .rk-rules h3 { margin: 0 0 6px; font: 500 11px/1 var(--display); letter-spacing: .2em; text-transform: uppercase; color: var(--gold); }
  .rk-rs2 { display: grid; gap: 10px; min-width: 0; }
  .rk-rs { min-width: 0; }
  .rk-rs p, .rk-rs li { margin: 0; color: var(--muted); font-size: 13.5px; line-height: 1.35; }
  .rk-rs ul { margin: 0; padding-left: 18px; display: grid; gap: 2px; }
  .rk-tiers { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
  .rk-tiers > li { display: grid; grid-template-columns: 11em minmax(0, 1fr); gap: 4px 12px; align-items: center; padding: 6px 8px; border: 1px solid transparent; background: rgba(255,255,255,.03); }
  .rk-tiers > li .rk-badge { justify-self: start; }
  .rk-tiers .tx { display: grid; gap: 2px; min-width: 0; }
  .rk-tiers .ds { color: var(--text); font-size: 13.5px; }
  .rk-tiers .dv, .rk-tiers .nx { color: var(--muted); font-size: 12.5px; font-variant-numeric: tabular-nums; }
  .rk-tiers .you { font: 600 13px/1.2 var(--display); letter-spacing: .05em; color: var(--tc); }
  .rk-tiers .you b { margin-right: 6px; color: var(--gold-hi, var(--gold)); }
  .rk-tiers .rk-bar { margin: 2px 0; }
  .rk-tiers > li.me { border-color: var(--tc); background: rgba(217,179,108,.12); box-shadow: inset 3px 0 0 var(--tc); }
  .rk-ai { margin: 2px 0 0; padding-top: 8px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12.5px; }
  @media (max-width: 720px) { .rk-rules { grid-template-columns: minmax(0, 1fr); } }
  @media (max-height: 460px) { .rk-tiers > li { padding: 4px 8px; } }
  .rk-vs { display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; text-align: center; }
  .rk-vs .v { font: 700 44px/1 var(--jp); color: var(--gold); }
  .rk-vs .f b { display: block; font: 700 42px/1 var(--jp); }
  .rk-delta { font: 700 34px/1 var(--display); letter-spacing: .04em; }
  .rk-delta.up { color: #9be29b; } .rk-delta.down { color: #ffb4a8; }
  /* result: the rank-up / rank-down moment (the old crest out, the new one in) */
  .rk-rankup { position: relative; width: 180px; height: 180px; margin: 0 auto; }
  .rk-rankup svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .rk-rankup .old { animation: rkOld .5s ease-in .35s both; }
  .rk-rankup.up .new { animation: rkUp .7s cubic-bezier(.2,1.5,.4,1) .75s both; }
  .rk-rankup.down .new { animation: rkDown .7s ease-out .75s both; }
  @keyframes rkOld { from { opacity: 1; transform: none; } to { opacity: 0; transform: scale(.7); } }
  @keyframes rkUp { from { opacity: 0; transform: scale(1.6) rotate(-10deg); } to { opacity: 1; transform: none; } }
  @keyframes rkDown { from { opacity: 0; transform: translateY(-28px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .rk-rankup .old { display: none; } .rk-rankup .new { animation: none; } }
  @media (max-height: 460px) { .rk-rankup { width: 112px; height: 112px; } }
  .rk-vs .f { display: grid; justify-items: center; gap: 3px; min-width: 0; }
  .rk-vs .f .rk-badge { margin-top: 2px; }
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
  /* the shadow mark (影): a shadow opponent is always marked as such, never shown as a live player */
  .rk-gh { display: inline-flex; align-items: baseline; gap: 6px; padding: 4px 9px; border: 1px dashed rgba(190,175,240,.8); color: #d6cbff; background: rgba(60,44,120,.28);
    font: 600 13px/1 var(--display); letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }
  .rk-gh b { font: 700 18px/1 var(--jp); color: #ebe5ff; }
  .rk-gh.sm { padding: 2px 6px; font-size: 11px; vertical-align: middle; } .rk-gh.sm b { font-size: 14px; }
  #rk .rk-opp.rk-ghost { border-style: dashed; border-color: rgba(190,175,240,.6); background: rgba(40,30,86,.3); }
  .rk-ghost-in { color: #d6cbff; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  /* the small "AI" tag next to a shadow's name */
  .rk-ai-tag { display: inline-block; margin-left: 2px; padding: 1px 5px; border: 1px solid rgba(190,175,240,.75); border-radius: 3px; color: #d6cbff;
    font: 700 11px/1.3 var(--display); letter-spacing: .1em; vertical-align: middle; white-space: nowrap; }
  .rk-ghost-in .rk-ai-tag { margin-left: 0; }
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

  /* ---- the RANKED card in the main menu (1.4, the menu's centrepiece): lacquer panel, gold edge, the player's tier
     emblem, standing, the season's top 3 and FIND MATCH. Grid areas: computers two columns (standing | top 3 over the
     button); CrazyGames' 821×462 / 907×510 the same, tighter; phones sideways (≤ 430 px tall) one row with the most
     important lines; phones upright stacked. */
  #mranked { position: relative; overflow: hidden; isolation: isolate; border-color: rgba(217,179,108,.72);
    background: radial-gradient(120% 140% at 100% 50%, rgba(196,44,34,.28), rgba(196,44,34,0) 55%), linear-gradient(100deg, #1b0e10 0%, #130b10 55%, #0d0b13 100%);
    box-shadow: inset 0 0 0 1px rgba(0,0,0,.55), inset 0 0 0 2px rgba(217,179,108,.16), 0 6px 18px rgba(0,0,0,.35); }
  #mranked:hover, #mranked:focus-visible { border-color: var(--gold-hi, #f1d69c); background: radial-gradient(120% 140% at 100% 50%, rgba(214,52,40,.36), rgba(196,44,34,0) 58%), linear-gradient(100deg, #22110f 0%, #170c10 55%, #0f0c15 100%); }
  #mranked.rkc { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); grid-template-areas: "head head" "me top" "me find";
    align-items: start; gap: 8px 18px; padding: 13px 18px 15px; cursor: pointer; }
  #mranked span { grid-column: auto; font-size: inherit; color: inherit; }
  #mranked .rkc-head { grid-area: head; min-width: 0; }
  #mranked strong { color: #f1d69c; display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; font-size: 24px; }
  #mranked strong .rk-mt { font: inherit; color: inherit; letter-spacing: inherit; white-space: nowrap; }
  #mranked .rk-ms { font: 500 11px/1.2 var(--display); letter-spacing: .12em; text-transform: uppercase; color: var(--gold); white-space: nowrap; }
  #mranked .rk-ms:empty { display: none; }
  #mranked .rkc-me { grid-area: me; display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 4px 14px; min-width: 0; align-self: center; }
  #mranked .mk.rk-seal-m { grid-row: auto; grid-column: auto; width: 68px; height: 68px; display: grid; place-items: center; box-sizing: border-box; padding: 2px; color: #fbeedd; text-shadow: none;
    font: 700 32px/1 var(--jp); background: linear-gradient(145deg, #c8392c, #8f1d16); border: 1px solid rgba(255,230,200,.55);
    box-shadow: inset 0 0 0 2px #a8271d, inset 0 0 0 3px rgba(255,230,200,.35), 0 0 0 1px var(--tc, rgba(217,179,108,.6)), 0 0 16px rgba(214,60,40,.35);
    transform: rotate(-4deg); animation: rkEmber 4.5s ease-in-out infinite; }
  #mranked .mk.rk-seal-m.two { writing-mode: vertical-rl; font-size: 22px; letter-spacing: 0; line-height: 1.02; }
  /* the player's emblem in place of the red seal */
  #mranked .mk.rk-seal-m.emb { padding: 0; background: none; border: 0; box-shadow: none; transform: none; animation: none; }
  #mranked .mk.rk-seal-m.emb svg { width: 100%; height: 100%; }
  #mranked .rkc-stand { display: grid; gap: 3px; min-width: 0; }
  #mranked .rkc-stand > span { display: block; min-width: 0; overflow-wrap: anywhere; }
  #mranked .rkc-tier { font: 600 17px/1.1 var(--display) !important; letter-spacing: .08em; text-transform: uppercase; color: var(--tc, #f1d69c) !important; }
  #mranked .rkc-tier small { margin-left: 8px; font: 500 11px/1 var(--display); letter-spacing: .1em; color: var(--muted); }
  #mranked .rkc-rt { display: flex !important; align-items: baseline; gap: 6px; white-space: nowrap; }
  #mranked .rkc-rt b { font: 700 32px/1 var(--display); letter-spacing: .03em; color: #fbeedd; }
  #mranked .rkc-rt small { font: 500 11px/1 var(--display); letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
  #mranked .rkc-place { font: 600 13.5px/1.25 var(--display) !important; letter-spacing: .06em; color: var(--muted) !important; }
  #mranked .rkc-place.on { color: #f1d69c !important; font-size: 15px !important; }
  #mranked .rkc-rec { font-size: 13px !important; line-height: 1.35; color: var(--text) !important; }
  #mranked .rkc-rec b { font-weight: 600; white-space: nowrap; }
  #mranked .rkc-rec i { font-style: normal; white-space: nowrap; color: var(--muted); }
  #mranked .rkc-rec i::before { content: ' · '; color: rgba(217,179,108,.5); }
  #mranked .rkc-sk { font: 600 12.5px/1.3 var(--display) !important; letter-spacing: .06em; }
  #mranked .rkc-sk.w { color: #9fdc9a !important; } #mranked .rkc-sk.l { color: #ff9f8f !important; }
  #mranked .rkc-more, #mranked .rkc-inv { font-size: 12.5px !important; line-height: 1.35; color: var(--muted) !important; }
  #mranked .rkc-inv { font-size: 14px !important; color: var(--text) !important; }
  #mranked .rkc-top { grid-area: top; min-width: 0; display: grid; gap: 3px; }
  #mranked .rkc-top[hidden] { display: none; }
  #mranked .rkc-th { font: 500 10.5px/1.2 var(--display) !important; letter-spacing: .16em; text-transform: uppercase; color: var(--gold) !important; }
  #mranked .rkc-none { font-size: 12.5px !important; color: var(--muted) !important; }
  #mranked .rkc-top ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  #mranked .rkc-top li { display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; align-items: baseline; gap: 6px; padding: 2px 6px; border-left: 2px solid var(--tc, rgba(217,179,108,.4)); background: rgba(255,255,255,.03); font-size: 13px; }
  #mranked .rkc-top li .pl { font: 700 13px/1 var(--jp); color: var(--gold); }
  #mranked .rkc-top li .n { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #mranked .rkc-top li .sc { font: 600 13px/1 var(--display) !important; color: var(--muted) !important; }
  #mranked .rkc-top li.me { background: rgba(217,179,108,.2); }
  #mranked .rkc-top li.me .n, #mranked .rkc-top li.me .sc { color: #f1d69c !important; font-weight: 600; }
  #mranked .rkc-find { grid-area: find; align-self: end; width: 100%; min-height: 44px; padding: 10px 14px; font-size: 17px; letter-spacing: .14em;
    background: linear-gradient(180deg, #d0402f, #9d2219); border: 1px solid rgba(255,214,160,.7); color: #fff6e6; box-shadow: 0 0 14px rgba(214,60,40,.35); }
  #mranked .rkc-find:hover, #mranked .rkc-find:focus-visible { background: linear-gradient(180deg, #e0503c, #b02a1f); border-color: #ffe2b0; }
  #mranked .rkc-find:disabled { opacity: .7; }
  /* nothing to list yet (an older server without the top 3 before it answers): the standing beside the button */
  #mranked.rkc:has(.rkc-top[hidden]) { grid-template-areas: "head head" "me find"; align-items: center; }
  #mranked::after { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none;
    background: linear-gradient(105deg, rgba(255,236,190,0) 40%, rgba(255,236,190,.09) 50%, rgba(255,236,190,0) 60%) no-repeat; background-size: 300% 100%; background-position: 130% 0; animation: rkSheen 7s ease-in-out 1.5s infinite; }
  @keyframes rkSheen { 0%, 70% { background-position: 130% 0; } 100% { background-position: -30% 0; } }
  @keyframes rkEmber { 0%, 100% { box-shadow: inset 0 0 0 2px #a8271d, inset 0 0 0 3px rgba(255,230,200,.35), 0 0 0 1px var(--tc, rgba(217,179,108,.6)), 0 0 12px rgba(214,60,40,.25); } 50% { box-shadow: inset 0 0 0 2px #a8271d, inset 0 0 0 3px rgba(255,230,200,.35), 0 0 0 1px var(--tc, rgba(217,179,108,.6)), 0 0 20px rgba(230,80,45,.5); } }
  @media (prefers-reduced-motion: reduce) { #mranked::after, #mranked .mk.rk-seal-m { animation: none; } }
  /* short screens (CrazyGames' 821×462 / 907×510, tablets sideways, phones sideways): tighter */
  @media (max-height: 540px) {
    #mranked.rkc { gap: 5px 12px; padding: 8px 12px 9px; }
    #mranked strong { font-size: 18px; }
    #mranked .rk-ms { font-size: 10px; }
    #mranked .mk.rk-seal-m { width: 50px; height: 50px; font-size: 24px; }
    #mranked .mk.rk-seal-m.two { font-size: 16px; }
    #mranked .rkc-me { gap: 2px 10px; }
    #mranked .rkc-stand { gap: 1px; }
    #mranked .rkc-tier { font-size: 14px !important; }
    #mranked .rkc-rt b { font-size: 23px; }
    #mranked .rkc-place, #mranked .rkc-place.on { font-size: 12.5px !important; }
    #mranked .rkc-rec, #mranked .rkc-inv { font-size: 12px !important; }
    #mranked .rkc-more, #mranked .rkc-sk { font-size: 11px !important; }
    #mranked .rkc-th { font-size: 9.5px !important; }
    #mranked .rkc-top { gap: 2px; }
    #mranked .rkc-top ol { gap: 1px; }
    #mranked .rkc-top li { padding: 1px 5px; font-size: 12px; }
    #mranked .rkc-top li .sc { font-size: 12px !important; }
    #mranked .rkc-find { min-height: 34px; padding: 6px 10px; font-size: 14px; }
    #app.touch #mranked .rkc-find { min-height: 44px; }
  }
  /* phones sideways (≤ 430 px tall): one row, the most important lines: emblem · tier and rating, place, W–L · the
     button; the top 3, the extra line, win rate and run are left out (all of it is on the ranked home) */
  @media (max-height: 430px) {
    #mranked.rkc, #mranked.rkc:has(.rkc-top[hidden]) { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "head head" "me find"; align-items: center; gap: 2px 10px; padding: 6px 10px 7px; }
    #mranked strong { font-size: 16px; gap: 0 8px; }
    #mranked .rkc-top, #mranked .rkc-more, #mranked .rkc-sk { display: none !important; }
    #mranked .mk.rk-seal-m { width: 42px; height: 42px; font-size: 21px; }
    #mranked .rkc-stand { grid-template-columns: auto minmax(0, 1fr); align-items: baseline; gap: 0 8px; }
    #mranked .rkc-stand > span:not(.rkc-tier):not(.rkc-rt) { grid-column: 1 / -1; }
    #mranked .rkc-tier { font-size: 13px !important; }
    #mranked .rkc-tier small { display: none; }
    #mranked .rkc-rt b { font-size: 18px; }
    #mranked .rkc-rt small { font-size: 9.5px; }
    #mranked .rkc-place, #mranked .rkc-place.on { font-size: 11.5px !important; line-height: 1.2; }
    #mranked .rkc-rec, #mranked .rkc-inv { font-size: 11.5px !important; line-height: 1.25; }
    #mranked .rkc-find { align-self: center; width: auto; min-width: 104px; max-width: 150px; white-space: normal; line-height: 1.1; font-size: 13px; letter-spacing: .1em; }
  }
  /* phones upright and other narrow screens: the standing beside the button, short enough that SINGLE MATCH and PLAY
     WITH A FRIEND stay on the first screen (iPhone too, with its notch and home bar); the top 3, the run and the extra
     line are on the ranked home */
  @media (max-width: 520px) {
    #mranked.rkc, #mranked.rkc:has(.rkc-top[hidden]) { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "head head" "me find"; align-items: center; gap: 6px 10px; padding: 10px 12px 11px; }
    #mranked .rkc-find { align-self: center; width: auto; min-width: 96px; max-width: 124px; padding: 6px 10px; white-space: normal; line-height: 1.1; font-size: 14px; letter-spacing: .1em; }
    #mranked strong { font-size: 20px; }
    #mranked .rkc-top, #mranked .rkc-more, #mranked .rkc-sk { display: none !important; }
    #mranked .mk.rk-seal-m { width: 54px; height: 54px; font-size: 26px; }
    #mranked .rkc-stand { gap: 1px; }
    #mranked .rkc-me { gap: 2px 10px; }
    #mranked .rkc-tier { font-size: 14px !important; }
    #mranked .rkc-tier small { display: none; }
    #mranked .rkc-rt b { font-size: 24px; }
    #mranked .rkc-place, #mranked .rkc-place.on { font-size: 13px !important; }
    #mranked .rkc-rec, #mranked .rkc-inv { font-size: 12.5px !important; }
  }
  @media (max-width: 520px) and (max-height: 780px) {
    #mranked.rkc { padding-block: 8px 9px; gap: 5px; }
    #mranked strong { font-size: 18px; }
    #mranked .mk.rk-seal-m { width: 46px; height: 46px; font-size: 22px; }
    #mranked .rkc-rt b { font-size: 21px; }
  }
  `;

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
  function hideAll() { stopPreview(); ['rk', 'rkConfirm'].forEach((id) => { const e = $(id); if (e) e.hidden = true; }); }
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
    else if (screen === 'rules') renderRules();
    else if (screen === 'queue') renderQueue();
    else if (screen === 'found') renderFound();
    else if (screen === 'pick') renderPick();
    else if (screen === 'vs') renderVs();
    else if (screen === 'result') renderResult();
    renderBar();
  }
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (text, cls, fn) => { const b = el('button', 'btn' + (cls ? ' ' + cls : ''), text); b.type = 'button'; b.onclick = () => { try { if (ND.audio) ND.audio.ui(); } catch (e) {                } fn(); }; return b; };
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

  function titlesOf(o) {
    const box = el('div', 'rk-titles'), L = LB();
    if (!o) return box;
    const ds = o.dan && L && L.danShort ? L.danShort(o.dan) : '';
    if (ds) box.appendChild(el('span', 'rk-tt', ds));
    if (o.best_place && L && L.titleLabel) { const t = L.titleLabel({ place: o.best_place, wins: o.wins | 0, podiums: o.podiums | 0 }); if (t) box.appendChild(el('span', 'rk-tt', t)); }
    const rt = o.title_id && ND.rewards ? ND.rewards.title(o.title_id) : null;
    if (rt) { const s = el('span', 'rk-tt rw', (rt.icon ? rt.icon + ' ' : '') + rt.name); if (rt.color) s.style.setProperty('--rc', rt.color); box.appendChild(s); }
    const pl = ND.pass && ND.pass.plate ? ND.pass.plate(o) : null; if (pl) box.appendChild(pl);
    return box;
  }

  function renderHome() {
    const L = M(), c0 = card(false), id = identity();
    c0.classList.add('home');

    const c = el('div', 'rk-main'), side = el('div', 'rk-side');
    c0.append(c, side);
    c.append(head('戦', L.title, me && me.season ? L.season(me.season.id) + ' · ' + seasonLeft() : ''));
    if (!serverHas()) { c.append(el('p', 'rk-err', L.offline)); c.append(backRow()); side.remove(); return; }
    const big = el('div', 'rk-big');
    if (me && !me.guest) {
      const short = window.innerHeight <= 460, pt = placementTotal();

      const b = badge(me.tier, me.placement, false, { size: short ? 50 : 88, big: !short, placed: Math.max(0, pt - (me.placement | 0)), of: pt });
      const need = me.placement > 0 ? L.placement(Math.max(0, placementTotal() - me.placement), placementTotal()) : L.rating + ' ' + me.rating;
      big.append(b, el('span', 'rk-num', need));
      const sub = el('span', 'rk-st', L.record(me.wins | 0, me.losses | 0, me.draws | 0) + (me.place ? ' · ' + L.place(me.place) : ''));
      big.append(sub);
      if (!(me.placement > 0) && me.tier < 15) {
        const bar = el('div', 'rk-bar'), T = tierInfo(me.tier), lo = tierFloor(me.tier), hi = tierFloor(me.tier + 1), f = isFinite(lo) ? Math.max(0, Math.min(1, (me.rating - lo) / (hi - lo))) : 0.5;
        const i = el('i'); i.style.width = Math.round(f * 100) + '%'; bar.style.setProperty('--tc', T.col); bar.style.gridColumn = '1 / -1'; bar.appendChild(i); big.append(bar);
      }
      c.append(big);

      const L2 = LB(), mt = L2 && L2.myTitle ? L2.myTitle() : null;
      const dn = (L2 && L2.adapter && L2.adapter.srvDan) || (ND.banzuke && ND.banzuke.dan && ND.banzuke.dan.rank ? ND.banzuke.dan.rank() : 0);
      c.append(titlesOf({ dan: dn, best_place: mt && mt.place, wins: mt && mt.wins, podiums: mt && mt.podiums, title_id: me.title_id }));

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
      try { c.append(ND.lbUI.nickLine(() => { loadMe().then(() => render()); render(); })); } catch (e) {                    }
    }
    const how = el('ul', 'rk-how'); (L.howLines || TR.howLines).forEach((t) => how.appendChild(el('li', null, t)));
    side.append(how);
    const r2 = el('div', 'rk-btns');
    const rb = btn(L.rulesBtn || TR.rulesBtn, '', () => { rulesFirst = false; show('rules'); }); rb.id = 'rkRules';
    r2.append(rb, btn(L.board, '', () => openHall()), btn(L.back, '', () => close()));
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










  const RULES = { placeFirst: 5, placeNext: 3, boardGames: 5, minPlayers: 8, seasonDays: 28 };
  const boardGames = (o) => { const b = (o || me || {}).board; return b && b.games != null ? Math.max(1, b.games | 0) : RULES.boardGames; };
  let rulesFirst = false;
  const rulesSeen = () => { try { return !!(ND.save && ND.save.p && ND.save.p.rkRules); } catch (e) { return true; } };
  function rulesDone() {
    try { if (ND.save && ND.save.p && !ND.save.p.rkRules) { ND.save.p.rkRules = 1; ND.save.commit(); } } catch (e) {                 }
    rulesFirst = false;
    show('home');
  }
  function renderRules() {
    const L = M(), c = card(true), T0 = (k) => (L[k] != null ? L[k] : TR[k]);
    c.classList.add('rules');
    c.append(head('階', T0('rulesTitle'), T0('rulesSub')));
    const body = el('div', 'rk-rules'), left = el('section', 'rk-rs'), right = el('div', 'rk-rs2');
    body.append(left, right);
    c.append(body);

    const mine = me && !me.guest ? me : null, placing = !!(mine && mine.placement > 0);
    const myTier = mine && !placing ? Math.max(0, Math.min(15, mine.tier | 0)) : -1;
    left.append(el('h3', null, T0('rTiers')));
    const ol = el('ol', 'rk-tiers');
    for (let t = 0; t < 6; t++) {
      const li = el('li'), T = tierInfo(t === 5 ? 15 : t * 3);
      li.style.setProperty('--tc', T.col);
      const own = myTier >= 0 && tierInfo(myTier).t === t;
      li.append(badge(own ? myTier : t === 5 ? 15 : t * 3, 0, false, { whole: true, size: window.innerHeight <= 460 ? 34 : 42 }));
      const txt = el('div', 'tx');
      txt.append(el('span', 'ds', T.desc));

      const divs = t === 5 ? [[15, '']] : [[t * 3, 'III'], [t * 3 + 1, 'II'], [t * 3 + 2, 'I']];
      txt.append(el('span', 'dv', divs.map(([i, d]) => { const f = tierFloor(i); return (d ? d : '') + (isFinite(f) ? (d ? ' ' : '') + f + (t === 5 ? '+' : '') : ''); }).join(' · ')));
      li.append(txt);
      if (myTier >= 0 && tierInfo(myTier).t === t) {
        li.classList.add('me');
        const you = el('span', 'you'); you.append(el('b', null, T0('rYou')), nameEl(tierInfo(myTier).n), document.createTextNode(' · ' + mine.rating));
        txt.append(you);
        if (myTier < 15) {
          const next = myTier + 1, lo = tierFloor(myTier), hi = tierFloor(next), f = isFinite(lo) ? Math.max(0, Math.min(1, (mine.rating - lo) / (hi - lo))) : 0.5;
          const bar = el('div', 'rk-bar'), i = el('i'); i.style.width = Math.round(f * 100) + '%'; bar.style.setProperty('--tc', T.col); bar.appendChild(i);
          txt.append(bar, el('span', 'nx', T0('rNext')(Math.max(1, Math.ceil(hi - mine.rating)), tierInfo(next).n)));
        } else txt.append(el('span', 'nx', T0('rTop')));
      }
      ol.append(li);
    }
    left.append(ol);
    if (placing) left.append(el('p', 'rk-st', T0('rPlacing')(Math.max(0, placementTotal() - mine.placement), placementTotal())));
    const sec = (title, ...lines) => { const s2 = el('section', 'rk-rs'); s2.append(el('h3', null, title)); lines.forEach((t) => s2.append(el('p', null, t))); right.append(s2); return s2; };
    sec(T0('rPlacement'), T0('rPlaceLine')(RULES.placeFirst, RULES.placeNext));
    const pts = sec(T0('rPoints')), ul = el('ul');
    (T0('rPointsLines') || []).forEach((t) => ul.append(el('li', null, t)));
    pts.append(ul);

    const S = me && me.season, days = S && S.end > S.start ? Math.round((S.end - S.start) / 864e5) : RULES.seasonDays;
    const names = (S && Array.isArray(S.rewards) ? S.rewards : []).map((id) => {
      const e = ND.rewards && ND.rewards.get ? ND.rewards.get(id) : null;
      if (!e) return null;
      const n = ND.rewards.name(e);
      return e.kind === 'costume' ? T0('rCostumeAll')(n) : n;
    }).filter(Boolean);
    sec(T0('rSeason'), T0('rSeasonLine')(days, S ? seasonLeft() : L.endsIn(days)), T0('rSeasonEnd')(RULES.placeNext),
      T0('rReward')(names.length ? names.join(', ') : T0('rRewardAny'), RULES.minPlayers));
    sec(T0('rBoard'), T0('rBoardLine')(boardGames()));
    sec(T0('rFighters'), T0('rFightersLine'));
    right.append(el('p', 'rk-ai', T0('aiNote')));
    const row = el('div', 'rk-btns');
    const ok = btn(rulesFirst ? T0('gotIt') : L.back, 'primary', () => rulesDone()); ok.id = 'rkRulesOk';
    row.append(ok);
    c.append(row);
    setTimeout(() => { const b = $('rkRulesOk'); if (b && screen === 'rules' && document.activeElement !== b) b.focus(); }, 0);
  }
  function renderQueue() {
    if (screen !== 'queue' || !Q) return renderBar();
    const L = M(), c = card(false);
    c.append(head('戦', L.searching, Q.ranked ? L.ranked : L.unranked));
    c.append(el('p', 'rk-count', fmtClock(Date.now() - Q.since)));
    c.append(el('p', 'rk-st', Q.window >= 100000 ? L.windowAny : L.window(Q.window || 100)));
    if (flashMsg) { c.append(el('p', 'rk-err', flashMsg)); }
    const gOn = !!(Q.ghost && Q.ghost.on);
    const row = el('div', 'rk-btns');
    if (Date.now() - Q.since >= WARM_AFTER && !gOn) row.append(btn(L.warm, 'primary', () => warmUp()));
    const cb = btn(L.cancel, '', () => { stopQueue(true); flashMsg = ''; show('home'); }); cb.id = 'rkCancel';
    row.append(cb);
    c.append(row);
    clearTimeout(renderQueue.t);
    renderQueue.t = setTimeout(() => { if (screen === 'queue') renderQueue(); }, 1000);
  }


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
    pill.querySelector('.tag').textContent = L.warmTag;
    pill.setAttribute('aria-label', L.searching + ' ' + fmtClock(Date.now() - Q.since) + ' · ' + L.warmTag + ' · ' + L.warmBack); pill.title = L.warmBack;
    x.setAttribute('aria-label', L.cancel); x.title = L.cancel;


    try {
      const hud = $('hud'), app = $('app'), hr = hud && hud.getBoundingClientRect(), ar = app.getBoundingClientRect();
      if (hr && hr.height > 8) {
        let top = hr.bottom - ar.top + 2;
        const sw = $('tSwipe'), sr = sw && sw.getClientRects().length ? sw.getBoundingClientRect() : null;
        if (sr && sr.height > 0 && getComputedStyle(sw).visibility !== 'hidden') top = Math.min(top, sr.top - ar.top - 24 - 2);
        b.style.top = Math.round(Math.max(0, top)) + 'px';
      }
    } catch (e) {                     }
    const sync = () => { const hide = covered(); if (b.hidden !== hide) b.hidden = hide; };
    sync();
    renderBar.v = setInterval(sync, 150);
    renderBar.t = setTimeout(renderBar, 1000);
  }
  function oppCard(v) {
    const L = M(), o = v.opp || {}, box = el('div', 'rk-opp');
    const nm = el('span', 'rk-name'); nm.appendChild(nameEl(o.name || '—'));
    box.append(nm);
    if (o.guest) box.append(el('span', 'rk-badge pl', L.guestTag)); else box.append(badge(o.tier, o.placement, false, { size: 32 }));
    box.append(titlesOf(o));
    box.append(el('span', 'rk-st', (o.touch ? '📱 ' + L.touch : '⌨ ' + L.keys) + (K && K.rtt ? ' · ' + Math.round(K.rtt) + ' ms' : '')));
    return box;
  }

  function ghostMark(small) {
    const b = el('span', 'rk-gh' + (small ? ' sm' : '')), k = el('b', null, '影');
    k.setAttribute('aria-hidden', 'true');
    b.append(k, el('span', null, M().ghostTag));
    return b;
  }
  function renderGhostFound() {
    const L = M(), v = X.view, c = card(false);
    c.append(head('影', v.opp.house ? L.ghostHouseFound : L.ghostFound, L.ranked));
    const box = el('div', 'rk-opp rk-ghost'), nm = el('span', 'rk-name', ghostLabel(v.opp, L));
    nm.append(' ', aiTag());
    box.append(nm, ghostMark(false));
    if (v.opp.tier != null) box.append(badge(v.opp.tier, 0, false, { size: 32 }));
    box.append(el('p', 'rk-st', v.opp.house ? L.ghostHouseNote : L.ghostNote));
    c.append(box);

    const left = Math.max(0, (v.accept_ms | 0) - (Date.now() - (X.viewAt || Date.now())));
    c.append(el('p', 'rk-count', String(Math.max(1, Math.ceil(left / 1000)))));
    clearTimeout(renderFound.t);
    renderFound.t = setTimeout(() => { if (screen === 'found') renderFound(); }, 500);
  }
  function renderFound() {
    if (screen !== 'found' || !X) return;
    if (X.ghost) { renderGhostFound(); return; }
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

    const body = el('div', 'rk-pk'), side = el('div', 'rk-pkr'), pvBox = pickPreview();
    if (pvBox) { body.classList.add('pv'); body.append(pvBox); }
    body.append(side);
    c.append(body);
    if (X.ghost) { const g = el('p', 'rk-st rk-ghost-in'); g.append(ghostMark(true), el('span', null, ghostLabel(v.opp, L) + ' · ' + L.ghostReady), aiTag()); side.append(g); }
    else side.append(el('p', 'rk-st', v.picked && v.picked[1] ? L.oppLocked : L.oppPicking));
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
    side.append(grid);

    const cos = X.pick && ND.rewards && !X.ghost ? ND.rewards.costumesFor(X.pick) : [];
    if (cos.length) {
      const row = el('div', 'rk-row'); row.append(el('span', 'rk-lbl', L.costume));
      row.setAttribute('role', 'group'); row.setAttribute('aria-label', L.costume);
      const seg = (id, text) => { const s = el('button', 'seg', text); s.type = 'button'; s.setAttribute('aria-pressed', String((X.look || null) === id)); s.disabled = X.picked; s.onclick = () => setPick(X.pick, id); row.append(s); };
      seg(null, L.plain); cos.forEach((e) => seg(e.id, ND.rewards.name(e)));
      side.append(row);
    }
    if (flashMsg) { c.append(el('p', 'rk-err', flashMsg)); flashMsg = ''; }
    const row = el('div', 'rk-btns');
    const lb = btn(X.picked ? L.lockedIn : L.lock, 'primary', () => lockIn()); lb.id = 'rkLock'; lb.disabled = X.picked || !X.pick;
    row.append(lb);
    c.append(row);

    if (X.ghost && !X.picked && !X.pick && left < 1200 && allowed.length) X.pick = allowed[0];
    if (!X.picked && X.pick && left < 1200) lockIn();
    if (pvBox) drawPreview(false);
    clearTimeout(renderPick.t);
    renderPick.t = setTimeout(() => { if (screen === 'pick') renderPick(); }, 500);
  }





  let pv = null;
  function pickPreview() {
    if (!X || !ND.Fighter || !ND.Ctrl || !G || !G.drawPv || !G.stepPv) return null;
    const allowed = X.view.chars || [], id = X.pick || allowed[0], ci = id ? charIdx(id) : -1;
    if (ci < 0) return null;
    if (!pv) {
      const box = el('div', 'rk-pv'), cv = el('canvas');
      box.setAttribute('aria-hidden', 'true'); box.append(cv);
      pv = { f: null, box, cv, key: '', raf: 0, last: 0 };
    }
    const look = X.ghost ? (ND.save && ND.save.look ? ND.save.look(id) : false) : X.look ? 'rw:' + X.look : false;
    const key = id + '|' + look;
    pv.box.classList.toggle('dim', !X.pick);
    if (pv.key !== key) {
      if (!pv.f) { pv.f = new ND.Fighter(0, new ND.Ctrl()); pv.f.fullDetail = true; }
      pv.f.setChar(ND.CHARS[ci], look); pv.f.reset(0); pv.f.dir = 1; pv.f.pvPose = null;
      pv.key = key; pv.fresh = true;
    }
    if (!pv.raf) { pv.last = performance.now(); pv.raf = requestAnimationFrame(previewFrame); }
    return pv.box;
  }

  function drawPreview(always) { if (pv && pv.f && (always || pv.fresh)) { pv.fresh = false; G.drawPv(pv.cv, pv.f); } }
  function previewFrame(now) {
    const p = pv;
    if (!p) return;
    p.raf = 0;
    const rk = $('rk');
    if (screen !== 'pick' || !X || !p.box.isConnected || !rk || rk.hidden) { stopPreview(); return; }
    const dt = Math.min(0.05, Math.max(0, (now - p.last) / 1000));
    p.last = now;


    for (let r = dt, t = now / 1000 - dt; r > 1e-6; ) { const h = Math.min(1 / 60, r); r -= h; t += h; G.stepPv(p.f, h, t); }
    drawPreview(true);
    p.raf = requestAnimationFrame(previewFrame);
  }
  function stopPreview() {
    if (!pv) return;
    if (pv.raf) cancelAnimationFrame(pv.raf);
    pv.box.remove(); pv.cv.width = 0; pv.cv.height = 0;
    pv = null;
  }
  function renderVs() {
    if (screen !== 'vs' || !X || !X.view.live) return;
    const L = M(), v = X.view, P = v.live.picks, c = card(false);
    const vs = el('div', 'rk-vs');

    const f = (id, who, p) => {
      const ch = ND.CHARS[charIdx(id)] || ND.CHARS[0], d = el('div', 'f'); const k = el('b', null, ch.kanji); k.style.color = ch.col.ui;
      const w2 = el('small', 'rk-st', who); if (p && p.ghost) w2.append(' ', aiTag());
      d.append(k, nameEl(ch.name), w2);
      if (p && !p.guest && (p.tier != null || p.placement > 0)) d.append(badge(p.tier, p.placement, true, { size: 26 }));
      return d;
    };
    const mine = X.side, on = v.opp && v.opp.name ? (X.ghost ? ghostLabel(v.opp, L) : v.opp.name) : '', mp = me && !me.guest ? me : null;
    vs.append(f(P[0], mine === 0 ? L.you : on, mine === 0 ? mp : v.opp), el('span', 'v', '対'), f(P[1], mine === 1 ? L.you : on, mine === 1 ? mp : v.opp));
    if (ND.pass && ND.pass.matchFlair) ND.pass.matchFlair(X.side, v.opp);
    if (ND.flair) { ND.flair.card(vs.firstChild, 0); ND.flair.card(vs.lastChild, 1); }
    c.append(vs);
    const a = ND.ARENAS.find((x) => x.id === v.live.arena);
    c.append(el('p', 'rk-st', (a ? a.name : '') + ' · ' + (v.ranked ? L.ranked : L.unranked)));
    if (X.ghost) c.append(ghostMark(true));
    else if (!(K && K.connected)) c.append(el('p', 'rk-st', L.connecting));
  }
  function renderResult() {
    if (screen !== 'result' || !X) return;
    const L = M(), x = X, v = x.view, res = x.res || {}, R = v.result, c = card(false), side = x.side;
    let title = L.over, why = '';
    const w = R && R.winner != null ? R.winner : res.winner;
    if (R && (R.verdict === 'disputed' || v.status === 'disputed')) { title = L.nc; why = L.disputed; }
    else if (R && v.status === 'nc') { title = L.nc; why = (L.ncWhy && L.ncWhy[R.verdict]) || ''; }
    else if (w === -1) title = L.draw; else if (w === side) title = L.win; else if (w === 1 - side) title = L.lose;
    if (!why) why = res.self ? (x.ghost ? L.ghostLeft : L.youLeft) : res.reason === 'left' ? L.oppLeft : (R && R.verdict === 'silent' && w === side) ? L.silent : '';
    const oppName = v.opp && v.opp.name ? (x.ghost ? ghostLabel(v.opp, L) : v.opp.name) : '';
    c.append(head(w === side && R ? '勝' : '試', title, (res.wins ? L.rounds(res.wins[side] | 0, res.wins[1 - side] | 0) + ' · ' : '') + oppName));
    if (x.ghost) { const g = el('p', 'rk-st rk-ghost-in'); g.append(ghostMark(true), el('span', null, oppName), aiTag()); c.append(g); }
    if (why) c.append(el('p', 'rk-st', why));
    if (!R) {
      c.append(el('p', 'rk-st', Date.now() > (x.resultBy || Infinity) ? L.pending : L.confirming));
    } else if (R.rated && R.r && R.r[side]) {
      const my = R.r[side], d = my.delta | 0;
      const dl = el('p', 'rk-delta ' + (d >= 0 ? 'up' : 'down'), L.delta(d) + ' → ' + my.after); c.append(dl);

      if (my.shield) { const P2 = (ND.STR && ND.STR.pass) || {}; c.append(el('p', 'rk-st rk-shield', '盾 ' + (P2.shieldUsed || ''))); }
      if (my.placement === 0 && me && me.placement > 0) c.append(el('p', 'rk-st', L.placementDone));
      if (my.placement === 0 && my.tier !== my.tier_before) {


        const T = tierInfo(my.tier), up = my.tier > my.tier_before, a = emblem(Math.max(0, Math.min(15, my.tier_before | 0)), { size: 180 }), nw = emblem(my.tier, { size: 180 });
        if (a && nw) {
          const box = el('div', 'rk-rankup ' + (up ? 'up' : 'down')); box.style.setProperty('--tc', T.col);
          a.classList.add('old'); nw.classList.add('new'); box.append(a, nw); c.append(box);
        } else { const s = el('p', 'rk-seal', T.k); s.style.setProperty('--tc', T.col); c.append(s); }
        c.append(el('p', 'rk-st', (my.tier > my.tier_before ? L.promoted : L.demoted) + ' '));
        c.lastChild.appendChild(badge(my.tier, 0, true));
        try { if (!x.tierSnd && ND.audio) { x.tierSnd = true; const S = ND.audio.sfx; if (S) (my.tier > my.tier_before ? S.rankUp : S.rankDown)(); else if (my.tier > my.tier_before && ND.audio.gong) ND.audio.gong(); } } catch (e) {                }
      } else if (my.placement > 0) c.append(el('p', 'rk-st', L.placement(Math.max(0, placementTotal() - my.placement), placementTotal())));
      else c.append(badge(my.tier, 0));
      if (!x.meReloaded) { x.meReloaded = true; loadMe(); }
    } else if (R && !R.rated && (v.status === 'done' || (x.ghost && v.status === 'void'))) c.append(el('p', 'rk-st', L.unrankedNote));

    const hon = x.begun && !res.self && ND.pass ? ND.pass.lastHonor : 0;
    if (hon > 0) { const P2 = (ND.STR && ND.STR.pass) || {}; c.append(el('p', 'rk-st rk-honor', '誉 ' + (P2.rankedHonor ? P2.rankedHonor(hon) : '+' + hon))); }
    const row = el('div', 'rk-btns');
    const fa = btn(L.findAgain, 'primary', () => findAgain()); fa.id = 'rkAgain';
    row.append(fa);
    const alive = !x.ghost && K && K.connected && R && (v.status === 'done' || v.status === 'nc') && !res.self && res.reason !== 'left';
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
  function hudPing() { const e = $('rkPing'); if (e && X && X.ghost) { e.textContent = '影 ' + M().ghostTag + ' · ' + (M().aiTag || TR.aiTag); return; } if (!e || !K) return; const ms = Math.round(K.rtt); e.textContent = ms ? 'Ping ' + ms + ' ms' : ''; }
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

    if (serverHas() && !rulesSeen()) { rulesFirst = true; show('rules'); } else show('home');
    loadMe();
    if (ND.rewards) ND.rewards.refresh();
  }
  function close() { stopQueue(true); hideAll(); screen = null; $('menu').hidden = false; setTimeout(() => { const b = $('mranked'); if (b) b.focus(); }, 0); }
  function openHall() {
    close();
    if (ND.banzuke && ND.banzuke.ui && ND.banzuke.ui.showHall) ND.banzuke.ui.showHall('ranked', null);
  }


  const PORTRAIT = (() => { try { return window.matchMedia('(orientation: portrait)'); } catch (e) { return { matches: false }; } })();
  function syncAway() {
    if (!NET.active || screen !== 'match') return;
    NET.setAway(document.hidden ? 'away' : ND.touch && ND.touch.active && PORTRAIT.matches ? 'turn' : null);
  }
  document.addEventListener('visibilitychange', () => { if (NET.active && screen === 'match') { NET.setHidden(document.hidden); syncAway(); NET.keepalive(); } });



  function beacon(fn, body) {
    const a = adapter(), base = typeof C.SUPABASE_URL === 'string' ? C.SUPABASE_URL.trim().replace(/\/+$/, '') : '', key = typeof C.SUPABASE_ANON_KEY === 'string' ? C.SUPABASE_ANON_KEY.trim() : '';
    if (!a || !base || !key) return;
    const h = { apikey: key, 'Content-Type': 'application/json' };
    if (/^eyJ/.test(key)) h.Authorization = 'Bearer ' + key;
    try { fetch(base + '/rest/v1/rpc/' + fn, { method: 'POST', keepalive: true, headers: h, body: JSON.stringify(Object.assign({ p_secret: a.key() }, body || {})), credentials: 'omit' }).catch(() => {}); } catch (e) {            }
  }
  window.addEventListener('pagehide', () => {

    if (X && X.ghost && X.view.status === 'live' && !X.res && X.token) { X.res = { reason: 'left', winner: 1, self: true }; beacon('nd_rank_ghost_report', { p_match: X.id, p_token: X.token, p_res: { reason: 'left', winner: 1 } }); }
    else if (X && X.begun && !X.res) ctlSend({ t: 'leave' });
    if (Q && Q.ticket) beacon('nd_rank_leave');
  });


  function onKey(e) {
    const I = ND.input;
    if (screen === 'match' && (G.mode === 'online' || G.mode === 'shadow')) {
      if (I.isPause(e) || I.isBack(e)) { confirmLeave($('rkConfirm').hidden); return true; }
      if (!$('rkConfirm').hidden) return !I.isEditable(e.target) && e.code !== 'Tab' && e.code !== 'Enter' && e.code !== 'Space';
      return false;
    }
    if (screen && screen !== 'match') {
      if (I.isEditable(e.target)) return false;
      if (I.isBack(e) && !e.repeat) {
        if (screen === 'home') close(); else if (screen === 'rules') rulesDone(); else if (screen === 'queue') { stopQueue(true); show('home'); } else if (screen === 'found') accept(false); else if (screen === 'result') toMenu();
        return true;
      }
      return false;
    }
    return false;
  }


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
    body.appendChild(h('p', 'hall-sub', L.hallDesc(boardGames(my))));
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















  const CARD = {
    findMatch: 'Rakip ara', searching: 'Aranıyor…', resume: 'Maça dön',
    place: (p, n) => `Sıralamada ${p}. · ${n} kişi`, placeOnly: (p) => `Sıralamada ${p}.`,
    toBoard: (n) => `Sıralamaya girmek için ${n} maç daha`, toBoardSoon: 'Birkaç maç daha oyna, sıralamaya gir',
    invite: 'Ashigaru’dan Şogun’a: ilk dereceli maçın bir dokunuş uzakta',
    guestInvite: 'Puanla oynamak için giriş yap · misafir puansız oynar', nickInvite: 'Puanla oynamak için takma ad seç',
    winRate: (p) => `%${p} galibiyet`, streakW: (n) => `${n} galibiyet serisi`, streakL: (n) => `${n} yenilgi serisi`,
    peak: (t) => `En iyi: ${t}`, shields: (n) => `Kalkan ×${n}`, top: 'Sezonun ilk 3’ü', you: 'Sen', empty: 'Sıralama boş: ilk sen gir',
    rating: 'puan',
  };
  const CL = () => { const L = M(); return L.card && typeof L.card.findMatch === 'string' ? L.card : CARD; };
  const KANJI3 = ['壱', '弐', '参'];
  let topAlt = null, topAsked = false;
  function addMenuEntry() {
    if ($('mranked')) return;
    const anchor = $('msingle') || $('mfriend');
    if (!anchor && !$('mplay')) return;
    css();
    const b = document.createElement('div');
    b.className = 'mode friend ranked rkc'; b.id = 'mranked'; b.tabIndex = 0; b.setAttribute('role', 'button');
    b.innerHTML = '<div class="rkc-head"><strong><span class="rk-mt"></span><small class="rk-ms"></small></strong></div>' +
      '<div class="rkc-me"><b class="mk rk-seal-m" aria-hidden="true"></b><div class="rkc-stand"></div></div>' +
      '<div class="rkc-top"></div><button class="btn primary rkc-find" id="mrankedFind" type="button"></button>';
    const go = () => { try { if (ND.audio) { ND.audio.init(); ND.audio.ui(); } } catch (e) {                    } open(); };
    b.onclick = (e) => { if (e.target && e.target.closest && e.target.closest('#mrankedFind')) return; go(); };
    b.onkeydown = (e) => { if (e.target === b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(); } };
    b.querySelector('#mrankedFind').onclick = (e) => { e.stopPropagation(); try { if (ND.audio) { ND.audio.init(); ND.audio.ui(); } } catch (x) {                    } findFromMenu(); };
    if (anchor) anchor.before(b); else $('mplay').after(b);
    decorateEntry();
    syncMenuEntry();
  }


  function findFromMenu() {
    if (!available()) return;
    if ((X && !X.done) || Q || !serverHas() || !rulesSeen()) { open(); return; }
    show('home');
    loadMe();
    if (ND.rewards) ND.rewards.refresh();
    find();
  }
  const shieldsHeld = () => { try { return ND.pass && ND.pass.shields ? ND.pass.shields() | 0 : 0; } catch (e) { return 0; } };
  function decorateEntry() {
    const b = $('mranked');
    if (!b) return;
    const L = M(), C2 = CL(), st = b.querySelector('.rk-mt'), ms = b.querySelector('.rk-ms'), k = b.querySelector('.rk-seal-m');
    const stand = b.querySelector('.rkc-stand'), topBox = b.querySelector('.rkc-top'), fb = b.querySelector('#mrankedFind');
    if (st) st.textContent = L.title;
    if (ms) ms.textContent = me && me.season ? L.season(me.season.id) + ' · ' + seasonLeft() : '';
    b.classList.toggle('has-season', !!(ms && ms.textContent));
    const player = !!(me && !me.guest), played = player && ((me.games | 0) > 0 || (me.wins | 0) + (me.losses | 0) + (me.draws | 0) > 0);
    const kind = !me ? 'wait' : me.guest ? 'guest' : !played ? 'new' : 'player';
    b.dataset.kind = kind;
    if (k) {


      const ranked = kind === 'player' && me.tier != null, T = ranked && !(me.placement > 0) ? tierInfo(me.tier) : null;
      const key = ranked ? (T ? 't' + me.tier : 'pl') : '戦';
      if (k.dataset.k !== key) {
        k.dataset.k = key;
        const em = ranked ? emblem(T ? me.tier : 'placement', { size: 64, glow: false, anim: false }) : null;
        k.textContent = em ? '' : T ? T.k : '戦';
        if (em) k.append(em);
        k.classList.toggle('emb', !!em);
        k.classList.toggle('two', !em && k.textContent.length > 1);
      }
      if (T) { k.style.setProperty('--tc', T.col); b.title = T.n; } else { k.style.removeProperty('--tc'); b.removeAttribute('title'); }
    }

    if (stand) {
      stand.textContent = '';
      const line = (cls, text) => { const e = el('span', cls, text); stand.append(e); return e; };
      if (kind === 'player') {
        const T = tierInfo(me.tier), pl = me.placement > 0, pt = placementTotal();
        const tl = line('rkc-tier');
        tl.append(nameEl(pl ? L.placementTag : T.n));
        if (!pl) tl.style.setProperty('--tc', T.col);
        else tl.append(el('small', null, L.placement(Math.max(0, pt - me.placement), pt)));
        const rt = line('rkc-rt'); rt.append(el('b', null, String(me.rating | 0)), el('small', null, C2.rating));

        const B = me.board || {}, need = Math.max(boardGames() - (me.games | 0), me.placement | 0);
        const n = B.n != null ? B.n | 0 : 0;
        line('rkc-place' + (me.place ? ' on' : ''), me.place ? (n ? C2.place(me.place, Math.max(n, me.place)) : C2.placeOnly(me.place)) : need > 0 ? C2.toBoard(need) : C2.toBoardSoon);
        const w = me.wins | 0, l = me.losses | 0, dr = me.draws | 0, tot = w + l + dr;
        const rec = line('rkc-rec'); rec.append(el('b', null, L.record(w, l, dr)));
        if (tot) rec.append(el('i', 'wr', C2.winRate(Math.round(w * 100 / tot))));
        const sk = me.streak | 0;
        if (sk >= 2 || sk <= -2) line('rkc-sk ' + (sk > 0 ? 'w' : 'l'), (sk > 0 ? '▲ ' + C2.streakW(sk) : '▼ ' + C2.streakL(-sk)));
        const more = [];
        if (me.peak_tier != null && !pl && (me.peak_tier | 0) > (me.tier | 0)) more.push(C2.peak(tierInfo(me.peak_tier).n));
        const sh = shieldsHeld();
        if (sh > 0) more.push('盾 ' + C2.shields(sh));
        if (more.length) line('rkc-more', more.join(' · '));
      } else if (kind === 'guest') {
        line('rkc-inv', ND.cgAccount && ND.cgAccount.available ? C2.guestInvite : C2.nickInvite);
        line('rkc-more', L.menuSub);
      } else if (kind === 'new') {
        line('rkc-inv', C2.invite);
        line('rkc-more', L.menuSub);
        const sh = shieldsHeld();
        if (sh > 0) line('rkc-more', '盾 ' + C2.shields(sh));
      } else {
        line('rkc-inv', L.menuSub);
      }
    }

    if (topBox) {
      topBox.textContent = '';
      const rows = me && me.board && Array.isArray(me.board.top) ? me.board.top : topAlt;
      topBox.hidden = !rows;
      if (rows) {
        topBox.append(el('small', 'rkc-th', C2.top));
        if (!rows.length) topBox.append(el('span', 'rkc-none', C2.empty));
        else {
          const ol = el('ol');
          rows.slice(0, 3).forEach((r, i) => {
            const mine = !!(me && !me.guest && me.player_id != null && r.player_id === me.player_id);
            const li = el('li', mine ? 'me' : '');
            li.append(el('b', 'pl', KANJI3[i] || String(i + 1)));
            const nn = el('span', 'n'); nn.append(nameEl(mine ? C2.you : (LB() && LB().shownName ? LB().shownName(r.nick) || '—' : r.nick || '—'))); li.append(nn);
            li.append(el('span', 'sc', String(r.rating | 0)));
            if (r.tier != null) li.style.setProperty('--tc', tierInfo(r.tier).col);
            ol.append(li);
          });
          topBox.append(ol);
        }
      }
    }
    if (fb) {
      fb.textContent = Q ? C2.searching : X && !X.done ? C2.resume : C2.findMatch;
      fb.disabled = !!busyCall;
    }
    b.setAttribute('aria-label', [L.title, ms && ms.textContent, stand && stand.textContent].filter(Boolean).join(' · '));
  }


  let menuAsked = false;
  function syncMenuEntry() {
    const b = $('mranked'); if (!b) return;
    b.hidden = !serverHas();
    if (b.hidden || menuAsked || me) { decorateEntry(); return; }
    menuAsked = true;
    setTimeout(async () => {
      if (me || !serverHas()) { decorateEntry(); return; }
      try { const r = await call('nd_rank_me', {}, 8000); if (r && typeof r === 'object' && !me) { me = r; if (ND.rewards && !r.guest) ND.rewards.setOwned(r.player_id, r.owned); } } catch (e) {                            }
      decorateEntry();
      boardFallback();
    }, 2500);
  }

  function boardFallback() {
    if (topAsked || !me || me.board || !serverHas()) return;
    topAsked = true;
    plain('nd_rank_top', { p_season: null, p_limit: 3 }, 8000).then((rows) => { if (Array.isArray(rows)) { topAlt = rows.slice(0, 3); decorateEntry(); } }).catch(() => {});
  }


  const R = ND.ranked = {
    available, open, close, onKey, tierInfo, TIERS,
    find: () => find(), cancel: () => { stopQueue(true); show('home'); }, warmUp, endWarm: () => endWarm(true),
    accept: (ok) => accept(ok !== false), pick: (id, look) => { setPick(id, look); return lockIn(); }, choose: setPick,
    quit: () => quitMatch(), rematch: () => rematch(), findAgain: () => findAgain(), menu: () => toMenu(), reload: () => loadMe(),

    shadowEnded, ghostAccept: (ok) => ghostAccept(ok !== false), labels: () => M(),
    get shadowTag() { return X && X.ghost && X.view.opp ? ('影 ' + ghostLabel(X.view.opp)).slice(0, 26) + ' · ' + (M().aiTag || TR.aiTag) : null; },
    state: () => ({ screen, identity: identity(), server: serverHas(), queue: Q ? { ticket: Q.ticket, warm: Q.warm, window: Q.window, since: Q.since, ghost: Q.ghost || null } : null,
      match: X ? { id: X.id, side: X.side, status: X.view.status, ranked: X.view.ranked, ghost: !!X.ghost, weight: X.ghost ? X.view.weight : null, opp: X.view.opp, live: X.view.live || null, begun: X.begun, res: X.res || null,
        report: X.report, result: X.view.result || null, accepted: X.accepted, picked: X.picked, chars: X.view.chars || [] } : null,
      connected: !!(K && K.connected), rtt: K ? Math.round(K.rtt) : 0, me, flash: flashMsg, preview: pv ? { key: pv.key, on: !!pv.raf } : null }),

    demo(which) {
      build();
      demoOn = true;


      if (/^menu-/.test(which)) {
        const t0 = Date.now(), season = { id: 3, start: t0 - 19 * 864e5, end: t0 + 9 * 864e5, rewards: [] };
        const top = [{ place: 1, player_id: 11, nick: 'StolenBurntToast', rating: 1846, tier: 11 }, { place: 2, player_id: 7, nick: 'Kenji', rating: 1712, tier: 9 }, { place: 3, player_id: 23, nick: 'Mira', rating: 1655, tier: 8 }];
        const board = { games: 5, rd: 200, n: 4, top };
        const base = { season, now: t0, guest: false, player_id: 7, nick: 'Kenji', board, owned: [], penalty_s: 0 };
        me = which === 'menu-guest' ? { season, now: t0, guest: true, board, penalty_s: 0 }
          : which === 'menu-new' ? Object.assign({}, base, { rating: 1500, rd: 350, tier: 7, placement: 5, games: 0, wins: 0, losses: 0, draws: 0, place: null, streak: 0, peak_tier: null })
          : which === 'menu-placement' ? Object.assign({}, base, { rating: 1532, rd: 260, tier: 7, placement: 3, games: 2, wins: 1, losses: 1, draws: 0, place: null, streak: 0, peak_tier: null })
          : which === 'menu-unboarded' ? Object.assign({}, base, { player_id: 99, rating: 1588, rd: 190, tier: 7, placement: 0, games: 3, wins: 2, losses: 1, draws: 0, place: null, streak: 2, peak_tier: 7 })
          : Object.assign({}, base, { rating: 1712, rd: 95, tier: 9, placement: 0, games: 27, wins: 17, losses: 9, draws: 1, place: 2, streak: 3, peak_tier: 10, peak_rating: 1760 });
        Q = null; X = null; hideAll(); screen = null;
        const mb = $('mranked'); if (mb) mb.hidden = false;
        if ($('first')) $('first').hidden = true;
        $('menu').hidden = false;
        decorateEntry();
        return;
      }
      const opp = { name: 'Kenji', tier: 8, placement: 0, dan: 14, best_place: 2, wins: 0, podiums: 1, title_id: 'title_season_champion', touch: true };
      me = { season: { id: 3, end: Date.now() + 9 * 864e5 }, now: Date.now(), guest: false, rating: 1604, tier: 8, placement: 0, wins: 17, losses: 9, draws: 1, place: 12, games: 27, owned: [] };
      decorateEntry();
      const view = { id: 'demo', side: 0, status: which === 'pick' ? 'picking' : 'found', ranked: true, opp, accept_ms: 12000, pick_ms: 15000, picked: [false, true],
        chars: ['akane', 'aoi', 'kuro', 'yuki', 'hana'], acc: [null, null], live: { seed: 1, arena: 'temple', picks: ['akane', 'hana'], looks: [null, null] },
        result: which === 'result' ? { rated: true, winner: 0, verdict: 'ok', r: [{ before: 1590, after: 1608, delta: 18, tier: 9, tier_before: 8, placement: 0 }, { delta: -18 }] }

          : which === 'result-shield' ? { rated: true, winner: 1, verdict: 'ok', r: [{ before: 1604, after: 1604, delta: 0, tier: 8, tier_before: 8, placement: 0, shield: true }, { delta: 17 }] } : null, rematch: [false, false] };
      Q = null;
      X = which === 'home' || which === 'queue' ? null : { id: 'demo', side: 0, view, since: Date.now(), accepted: false, picked: false, pick: 'akane', look: null, begun: false,
        res: which === 'result' ? { reason: 'ko', winner: 0, wins: [2, 1] } : which === 'result-shield' ? { reason: 'ko', winner: 1, wins: [1, 2] } : null,
        report: /^result/.test(which) ? {} : null, done: /^result/.test(which), begun: which === 'result-shield', tFound: Date.now(), demo: true };
      if (which === 'result-shield') { if (ND.pass && ND.pass.rankedHonor) ND.pass.rankedHonor({ mode: 'ranked', won: false, rounds: 1, parries: 4, counters: 2 }); show('result'); return; }
      if (which === 'queue') { Q = { ticket: 'demo', since: Date.now() - 31000, warm: false, ranked: true, window: 565, demo: true, timer: 0 }; }


      if (/^ghost-/.test(which)) {
        const house = which === 'ghost-house', g = house ? 'found' : which.slice(6), name = house ? 'Tate' : 'Kenji';
        if (g === 'queue') { Q = { ticket: 'demo', since: Date.now() - 12000, warm: false, ranked: true, window: 280, demo: true, timer: 0, ghost: { on: true, after_s: 8, weight: 0.5 }, ghostAt: Date.now() + 13000, ghostBusy: true }; X = null; }
        else {
          const gv = { id: 'demo', status: g === 'found' ? 'found' : g === 'pick' ? 'picking' : 'live', side: 0, ranked: true, ghost: true, weight: 1, accept_ms: 3000, pick_ms: 15000,
            opp: { name, ghost: true, house, tier: house ? null : 8, placement: 0 }, chars: view.chars, picked: [false, true], live: { seed: 1, arena: 'temple', picks: ['akane', 'hana'], style: {}, rating: 1600 },
            result: g === 'result' ? { rated: true, weight: 1, winner: 0, verdict: 'ok', r: [{ before: 1590, after: 1608, delta: 18, tier: 8, tier_before: 8, placement: 0 }] } : null };
          X = { id: 'demo', ghost: true, token: 'demo', side: 0, view: gv, viewAt: Date.now(), since: Date.now(), accepted: g !== 'found', picked: g !== 'found' && g !== 'pick', pick: g === 'pick' ? null : 'akane', look: null, begun: false,
            res: g === 'result' ? { reason: 'ko', winner: 0, wins: [2, 1] } : null, report: g === 'result' ? {} : null, done: g === 'result', tFound: Date.now(), demo: true, timer: 0 };
        }
        show(g);
        return;
      }
      if (which === 'rules' || which === 'rules-first') { X = null; rulesFirst = which === 'rules-first'; show('rules'); return; }
      show(which === 'vs' ? 'vs' : which);
    },
    rulesSeen: () => rulesSeen(), rulesDone: () => { if (screen === 'rules') rulesDone(); },
    endDemo() { if (Q && Q.demo) Q = null; if (X && X.demo) X = null; hideAll(); screen = null; },
  };

  if (!available()) return;
  addMenuEntry();
  hookHall();

  if (LB() && LB().onChange) LB().onChange(() => { syncMenuEntry(); });

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


  const start0 = G.start;
  G.start = function (mode) {
    if (!beginning && !starting && !warmStarting) {
      if (X && X.begun && screen === 'match' && mode !== (X.ghost ? 'shadow' : 'online')) { quitMatch(); }
      else if (Q && Q.warm && mode !== 'cpu') { Q.warm = false; const r = start0.apply(this, arguments); show('queue'); return r; }
    }
    return start0.apply(this, arguments);
  };
  if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(() => { relabel(); if (screen && screen !== 'match') render(); });
})(window.ND);
