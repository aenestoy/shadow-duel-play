// Shadow Duel — "Play with a friend": online rooms (docs/SHADOW-DUEL-ONLINE.md, phase 1)
//
// Flow: main menu → "Play with a friend" → create a room (6-letter code + invite link) or join one (link or code) →
// both pick a fighter (every fighter is open here), the host picks the arena → Ready → the match (js/net.js) →
// Rematch / Change fighters / Leave.
//
// Finding each other (signalling): Supabase Realtime only, the game's own project (js/config.js, the public
// publishable key; never a secret key). One channel per room, "sd-room-<CODE>": Presence says who is in the room,
// Broadcast carries the WebRTC offer / answer and the network candidates. No database table. Spoken over the Realtime
// websocket directly (the Phoenix protocol, a few JSON messages), so no library is loaded.
// Playing: a direct WebRTC connection between the two browsers, two data channels: "in" (unordered, never resent: the
// input packets of js/net.js and pings) and "ctl" (ordered, reliable: the room's messages). The network servers used to
// find a direct route are in js/config.js ICE_SERVERS (free public STUN now; a TURN relay can be added there).
//
// Invites: on CrazyGames the SDK's invite link / invite button (src/portal-bridge.ts rooms), elsewhere ?room=CODE.
// Not in the offline portal builds: vite.config.ts leaves this file and js/net.js out of them. Where the page may not
// reach outside servers (ND.platform.allowNetwork false: those portals, the Artifact host) the entry does not appear.
// Test hooks: window.__ndSignal (a signalling stand-in), window.__ndNetem ({ delay, jitter, loss } on the "in" channel).
(function (ND) {
  'use strict';
  const G = ND.game, NET = ND.net;
  if (!G || !NET) return;
  const $ = (id) => document.getElementById(id);
  const C = ND.CONFIG || {};
  const PROTO = 1;                              // room protocol version (both players must match)
  const ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ';        // room code letters: no I, L, O (read as 1, 1, 0)
  const ROOM_TTL = 10 * 60 * 1000;              // a room nobody joined closes after 10 minutes
  const FIND_MS = 8000, CONNECT_MS = 20000, PING_MS = 500;
  const T_PING = 2, T_PONG = 3;
  // Texts: Turkish is the game's source language (like the tables in arcade.js); the language catalogs
  // (js/i18n-xx.js STR.online) overlay ND.STR.online with the chosen language. This file runs after js/i18n.js, so the
  // source table is read through M(): the catalog's table when one is applied, else this one (Turkish).
  const TR = {
    title: 'Arkadaşla oyna', menuSub: 'Çevrimiçi düello · bağlantı ya da 6 harfli kod paylaş',
    homeSub: 'Bir oda kur ve bağlantıyı arkadaşına gönder ya da arkadaşının gönderdiği kodu yaz.',
    create: 'Oda kur', join: 'Katıl', codePh: 'KOD', haveCode: 'Oda kodu', room: 'Oda', linkLabel: 'Davet bağlantısı',
    back: 'Geri', leave: 'Odadan çık', copy: 'Bağlantıyı kopyala', copied: 'Kopyalandı', share: 'Paylaş', invite: 'Arkadaşını davet et',
    shareText: (c) => `Gölge Düellosu'nda benimle düello et! Oda ${c}`,
    inviteNote: 'Bağlantıyı gönder ya da kodu arkadaşına söyle.',
    waitFriend: 'Arkadaşının katılması bekleniyor…', joining: 'Oda aranıyor…', connecting: 'Arkadaşına bağlanılıyor…', connected: 'Bağlandı',
    you: 'Sen', friend: 'Arkadaş', friendTag: 'ARKADAŞ', waitPick: 'Seçiyor…',
    pickTitle: 'Dövüşçün', arenaTitle: 'Arena', arenaHost: 'Arenayı arkadaşın seçiyor',
    ready: 'Hazır', notReady: 'Hazır değil', readyWait: 'Arkadaşının hazır olması bekleniyor…', bothReady: 'Başlıyor…',
    ping: (ms) => `Ping ${ms} ms`,
    badCode: 'Oda kodu 6 harflidir.', noRoom: 'Bu kodla bir oda yok. Kodu arkadaşınla kontrol et.', full: 'Bu oda dolu.',
    expired: '10 dakika kimse katılmadığı için oda kapandı.',
    noDirect: 'Arkadaşının ağına doğrudan bağlanılamadı. Başka bir ağ dene (Wi-Fi / mobil veri).', retry: 'Tekrar dene',
    noConnect: 'Arkadaşına bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.',
    version: 'Sende ve arkadaşında oyunun farklı sürümleri var. İkiniz de sayfayı yenileyin.',
    signalDown: 'Oyun sunucusuna ulaşılamadı. İnternet bağlantını kontrol et.', friendLeft: 'Arkadaşın odadan çıktı.',
    waitIn: (s) => `Arkadaşın bekleniyor… ${s}`, away: (s) => `Arkadaşın oyundan başka bir yere geçti… ${s}`,
    leaveQ: 'Maçtan çıkılsın mı?', leaveSub: 'Bu maçı arkadaşın kazanır.', stay: 'Oynamaya devam et', leaveMatch: 'Çık',
    win: 'Kazandın', lose: 'Kaybettin', draw: 'Berabere', over: 'Maç bitti',
    whyDrop: 'Arkadaşının bağlantısı koptu. Sen kazandın (kayda geçmez).', whyLeft: 'Arkadaşın maçtan çıktı.',
    whyAway: 'Sen yokken maç bitti.', whyDesync: 'Bağlantı sorunu yüzünden iki cihaz maçı farklı hesapladı; bu maç sayılmaz.',
    rematch: 'Rövanş', rematchWait: 'Arkadaşın bekleniyor…', rematchAsk: 'Rövanş (arkadaşın istiyor)', change: 'Dövüşçü değiştir',
    rounds: (a, b) => `Raund ${a} – ${b}`,
    turning: (s) => `Arkadaşın telefonunu çeviriyor… ${s}`, paused: 'Duraklatıldı',
    whyPauseWin: 'Arkadaşın zamanında dönmedi. Sen kazandın (kayda geçmez).', whyPauseLose: 'Zamanında dönmedin; maç bitti.',
    whyPauseBoth: 'İkiniz de zamanında dönmediniz; maç bitti.',
  };
  const M = () => (ND.STR && ND.STR.online && typeof ND.STR.online.title === 'string' ? ND.STR.online : TR);

  // ---------------------------------------------------------------- can this build / page play online at all?
  const url = typeof C.SUPABASE_URL === 'string' ? C.SUPABASE_URL.trim().replace(/\/+$/, '') : '';
  const key = typeof C.SUPABASE_ANON_KEY === 'string' ? C.SUPABASE_ANON_KEY.trim() : '';
  const customSignal = () => typeof window.__ndSignal === 'function';
  function available() {
    const P = ND.platform || {};
    if (!P.allowNetwork) return false;
    if (typeof RTCPeerConnection !== 'function' || typeof WebSocket !== 'function') return false;
    if (customSignal()) return true;
    return /^https:\/\/[^\s/?#]+$/i.test(url) && key.length >= 20 && !/secret|service_role/i.test(key);
  }
  // the network servers for finding a direct route (js/config.js ICE_SERVERS: free STUN)
  const iceServers = () => (Array.isArray(C.ICE_SERVERS) ? C.ICE_SERVERS : []);
  // TURN relay (for networks that allow no direct route): one-hour credentials from our Supabase Edge Function
  // (supabase/functions/turn-credentials; js/config.js TURN_FUNCTION, '' = none), asked when a room opens, at most
  // TURN_MS; without them the room connects directly or not at all, as before.
  const TURN_MS = 2000;
  function turnUrl() {
    const n = typeof C.TURN_FUNCTION === 'string' ? C.TURN_FUNCTION.trim() : '';
    return n && /^[a-z0-9-]+$/.test(n) && /^https:\/\/[^\s/?#]+$/i.test(url) ? url + '/functions/v1/' + n : '';
  }
  function cleanIce(list) {
    const out = [];
    for (const e of Array.isArray(list) ? list.slice(0, 8) : []) {
      if (!e || typeof e !== 'object') continue;
      const urls = (Array.isArray(e.urls) ? e.urls : [e.urls]).filter((u) => typeof u === 'string' && u.length < 200 && /^(stun|turns?):/i.test(u));
      if (!urls.length) continue;
      const o = { urls };
      if (typeof e.username === 'string') o.username = e.username;
      if (typeof e.credential === 'string') o.credential = e.credential;
      out.push(o);
    }
    return out;
  }
  function fetchTurn() {
    const u = turnUrl();
    if (!u || typeof fetch !== 'function') return Promise.resolve([]);
    return new Promise((done) => {
      const ctl = typeof AbortController === 'function' ? new AbortController() : null;
      const t = setTimeout(() => { if (ctl) ctl.abort(); done([]); }, TURN_MS);
      fetch(u, { method: 'GET', headers: { apikey: key }, credentials: 'omit', cache: 'no-store', signal: ctl ? ctl.signal : undefined })
        .then((res) => (res.ok ? res.json() : null))
        .then((j) => { clearTimeout(t); done(cleanIce(j && j.iceServers)); })
        .catch(() => { clearTimeout(t); done([]); });
    });
  }
  // the connection's settings: free STUN + the relay if we got one (test hook: window.__ndIcePolicy = 'relay')
  const hasTurn = (r) => !!(r.turn && r.turn.some((e) => e.urls.some((u) => /^turns?:/i.test(u))));
  const pcConfig = (r) => ({ iceServers: iceServers().concat(r.turn || []), iceTransportPolicy: window.__ndIcePolicy === 'relay' ? 'relay' : 'all' });
  // (waits for the relay's answer, at most TURN_MS after the room opened)
  function withIce(r, fn) { (r.icePromise || Promise.resolve([])).then((l) => { r.turn = l || []; if (R === r) fn(); }); }
  // no connection: without a relay the networks allow no direct route (another network may); with one, something else
  const noConnect = (r) => (hasTurn(r) ? M().noConnect : M().noDirect);

  // ---------------------------------------------------------------- signalling: Supabase Realtime over its websocket
  // h: { onOpen(), onPresence(list, initial), onMessage(msg), onError(why) }. list: [{ id, role, v }] of everyone in the
  // room (this client included). Returns { send(msg), close() }.
  function realtimeSignal(code, me, h) {
    const wsUrl = url.replace(/^http/i, 'ws') + '/realtime/v1/websocket?apikey=' + encodeURIComponent(key) + '&vsn=1.0.0';
    const topic = 'realtime:sd-room-' + code;
    let ws = null, ref = 0, joinRef = null, hb = null, closed = false, tries = 0;
    const pres = {};
    const raw = (m) => { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); } catch (e) { /* closing */ } };
    const push = (event, payload) => raw({ topic, event, payload, ref: String(++ref), join_ref: joinRef });
    const emit = (initial) => {
      const list = [];
      for (const k of Object.keys(pres)) { const m = pres[k].metas || []; if (m.length) list.push(Object.assign({ key: k }, m[m.length - 1])); }
      h.onPresence(list, initial);
    };
    function open() {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        joinRef = String(++ref);
        raw({ topic, event: 'phx_join', payload: { config: { broadcast: { self: false, ack: false }, presence: { key: me.id }, private: false } }, ref: joinRef, join_ref: joinRef });
        clearInterval(hb);
        hb = setInterval(() => raw({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++ref) }), 25000);
      };
      ws.onmessage = (e) => {
        let m;
        try { m = JSON.parse(e.data); } catch (err) { return; }
        if (!m || m.topic !== topic) return;
        const p = m.payload || {};
        if (m.event === 'phx_reply' && m.ref === joinRef) {
          if (p.status === 'ok') { tries = 0; push('presence', { type: 'presence', event: 'track', payload: me }); if (h.onOpen) h.onOpen(); }
          else h.onError('join');
        } else if (m.event === 'presence_state') {
          for (const k of Object.keys(pres)) delete pres[k];
          for (const k of Object.keys(p)) pres[k] = { metas: (p[k] && p[k].metas) || [] };
          emit(true);
        } else if (m.event === 'presence_diff') {
          const J = p.joins || {}, L = p.leaves || {};
          for (const k of Object.keys(J)) pres[k] = { metas: ((pres[k] && pres[k].metas) || []).concat((J[k] && J[k].metas) || []) };
          for (const k of Object.keys(L)) {
            if (!pres[k]) continue;
            const gone = ((L[k] && L[k].metas) || []).map((x) => x.phx_ref);
            pres[k].metas = pres[k].metas.filter((x) => !gone.includes(x.phx_ref));
            if (!pres[k].metas.length) delete pres[k];
          }
          emit(false);
        } else if (m.event === 'broadcast' && p.event === 'sig' && p.payload) h.onMessage(p.payload);
        else if (m.event === 'phx_error') { try { ws.close(); } catch (err) { /* already */ } }
      };
      ws.onclose = () => {
        clearInterval(hb);
        if (closed) return;
        if (++tries <= 5) setTimeout(() => { if (!closed) open(); }, 1000 * tries);
        else h.onError('closed');
      };
    }
    open();
    return {
      send(msg) { push('broadcast', { type: 'broadcast', event: 'sig', payload: msg }); },
      close() {
        closed = true; clearInterval(hb);
        push('presence', { type: 'presence', event: 'untrack' }); push('phx_leave', {});
        setTimeout(() => { try { ws.close(); } catch (e) { /* already */ } }, 50);
      },
    };
  }
  const signal = (code, me, h) => (customSignal() ? window.__ndSignal(code, me, h) : realtimeSignal(code, me, h));

  // ---------------------------------------------------------------- the room
  const rnd32 = () => { try { return crypto.getRandomValues(new Uint32Array(1))[0]; } catch (e) { return (Math.random() * 4294967296) >>> 0; } };
  const newId = () => rnd32().toString(36) + rnd32().toString(36);
  function newCode() { let s = ''; for (let i = 0; i < 6; i++) s += ABC[rnd32() % ABC.length]; return s; }
  const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z]/g, '');
  const validCode = (s) => s.length === 6 && [...s].every((ch) => ABC.includes(ch));
  const charOk = (i) => Number.isInteger(i) && !!ND.CHARS[i];
  const arenaOk = (a) => typeof a === 'string' && ND.ARENAS.some((x) => x.id === a);

  let R = null;          // the current room (null: none)
  let screen = null;     // 'home' | 'room' | 'match' | 'end' | null
  function room(role, code) {
    return {
      role, code, id: newId(), side: role === 'host' ? 0 : 1, sig: null, pc: null, ctl: null, inp: null, peerId: null,
      connected: false, closed: false, timers: [], iceQ: [], haveRemote: false,
      pick: (G.sel && charOk(G.sel.c[0]) ? G.sel.c[0] : 0), peerPick: null, arena: arenaOk(G.sel && G.sel.arena) ? G.sel.arena : 'temple',
      ready: false, peerReady: false, rematch: false, peerRematch: false, matchNo: 0,
      rtt: 0, rttMin: 0, pingN: 0, pings: new Map(), msg: '', err: '', status: '',
    };
  }
  const later = (fn, ms) => { const r = R, t = setTimeout(() => { if (R === r) fn(); }, ms); if (R) R.timers.push(t); return t; };

  function teardown(tellPeer) {
    const r = R;
    if (!r) return;
    R = null;
    if (tellPeer) ctlSend({ t: 'leave' }, r);
    r.closed = true;
    r.timers.forEach(clearTimeout); clearInterval(r.pingT); clearInterval(r.keepT);
    if (NET.active) NET.stop();
    setTimeout(() => {
      try { if (r.ctl) r.ctl.close(); } catch (e) { /* closed */ }
      try { if (r.inp) r.inp.close(); } catch (e) { /* closed */ }
      try { if (r.pc) r.pc.close(); } catch (e) { /* closed */ }
    }, tellPeer ? 150 : 0);
    try { if (r.sig) r.sig.close(); } catch (e) { /* closed */ }
    portalRooms((P) => P.close());
    try { if (/[?&]room=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* not allowed */ }
    document.getElementById('app').classList.remove('online');
  }

  function createRoom() {
    teardown(true);
    R = room('host', newCode());
    const r = R;
    r.icePromise = fetchTurn();
    r.status = M().waitFriend;
    r.sig = signal(r.code, { id: r.id, role: 'host', v: PROTO }, sigHandlers(r));
    later(() => {
      if (r.connected || r.peerId) return;
      fail(M().expired);
      if (r.sig) { r.sig.close(); r.sig = null; }
      portalRooms((P) => P.close());
    }, ROOM_TTL);
    portalRooms((P) => P.open(r.code, true));
    show('room');
  }
  function joinRoom(code) {
    code = cleanCode(code);
    if (!validCode(code)) { flash(M().badCode); return; }
    teardown(true);
    R = room('guest', code);
    const r = R;
    r.icePromise = fetchTurn();
    r.status = M().joining;
    r.sig = signal(code, { id: r.id, role: 'guest', v: PROTO }, sigHandlers(r));
    later(() => { if (!r.peerId && !r.connected) fail(M().noRoom); }, FIND_MS);
    show('room');
  }
  function fail(text, retry) {
    if (!R) return;
    R.err = text; R.retry = !!retry;
    if (screen === 'room' || screen === 'home') render();
  }

  function sigHandlers(r) {
    return {
      onOpen() {},
      onError(why) { if (R === r && !r.connected) fail(M().signalDown); },
      onPresence(list, initial) {
        if (R !== r) return;
        const others = list.filter((p) => p.id !== r.id);
        if (r.role === 'host') {
          // the code is taken already (another host is in it): a new code
          if (initial && !r.checked) { r.checked = true; if (others.some((p) => p.role === 'host')) { r.sig.close(); r.sig = null; teardown(false); createRoom(); return; } }
          if (!r.peerId) {
            const g = others.find((p) => p.role === 'guest');
            if (g) { r.peerId = g.id; startPeer(r); }
          } else if (!r.connected && !others.some((p) => p.id === r.peerId)) resetPeer(r);
          for (const p of others) if (p.role === 'guest' && p.id !== r.peerId) r.sig.send({ t: 'full', to: p.id });
        } else {
          const h = others.find((p) => p.role === 'host');
          if (h && !r.peerId) { r.peerId = h.id; r.status = M().connecting; if (h.v !== PROTO) fail(M().version); render(); }
        }
      },
      onMessage(m) {
        if (R !== r || !m || m.to !== r.id) return;
        if (m.t === 'full' && r.role === 'guest' && !r.connected) fail(M().full);
        else if (m.t === 'offer' && r.role === 'guest') acceptOffer(r, m);
        else if (m.t === 'answer' && r.role === 'host' && m.from === r.peerId && r.pc) {
          r.pc.setRemoteDescription(m.sdp).then(() => { r.haveRemote = true; flushIce(r); }).catch((e) => console.warn('[online] answer', e));
        } else if (m.t === 'ice' && m.from === r.peerId) {
          if (r.pc && r.haveRemote) r.pc.addIceCandidate(m.c).catch(() => {}); else r.iceQ.push(m.c);
        }
      },
    };
  }
  function flushIce(r) { for (const c of r.iceQ.splice(0)) r.pc.addIceCandidate(c).catch(() => {}); }

  // ---------------------------------------------------------------- the direct connection
  function makePc(r) {
    const cfg = pcConfig(r), pc = new RTCPeerConnection(cfg);
    r.ice = { servers: cfg.iceServers.length, turn: hasTurn(r), policy: cfg.iceTransportPolicy };
    pc.onicecandidate = (e) => { if (e.candidate && r.sig) r.sig.send({ t: 'ice', to: r.peerId, from: r.id, c: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
    const watch = () => {
      if (R !== r) return;
      const s = pc.connectionState || pc.iceConnectionState;
      if (s === 'failed') { if (!r.connected) fail(noConnect(r), true); else lost(r); }
      else if (s === 'closed' && r.connected) lost(r);
    };
    pc.onconnectionstatechange = watch; pc.oniceconnectionstatechange = watch;
    pc.ondatachannel = (e) => wire(r, e.channel);
    later(() => { if (!r.connected) fail(noConnect(r), true); }, CONNECT_MS);
    return pc;
  }
  function startPeer(r) {
    r.status = M().connecting; r.err = '';
    render();
    withIce(r, () => { if (!r.pc && r.peerId) offer(r); });
  }
  function offer(r) {
    const pc = r.pc = makePc(r);
    wire(r, pc.createDataChannel('ctl', { ordered: true }));
    wire(r, pc.createDataChannel('in', { ordered: false, maxRetransmits: 0 }));
    pc.createOffer().then((o) => pc.setLocalDescription(o)).then(() => {
      if (R === r && r.sig) r.sig.send({ t: 'offer', to: r.peerId, from: r.id, v: PROTO, sdp: pc.localDescription.toJSON ? pc.localDescription.toJSON() : pc.localDescription });
    }).catch((e) => { console.warn('[online] offer', e); fail(noConnect(r), true); });
    render();
  }
  function acceptOffer(r, m) {
    if (r.pc || r.accepting) return;
    if (m.v !== PROTO) { fail(M().version); return; }
    r.peerId = m.from; r.status = M().connecting; r.accepting = true;
    render();
    withIce(r, () => { r.accepting = false; if (!r.pc) answer(r, m); });
  }
  function answer(r, m) {
    const pc = r.pc = makePc(r);
    pc.setRemoteDescription(m.sdp).then(() => { r.haveRemote = true; flushIce(r); return pc.createAnswer(); }).then((a) => pc.setLocalDescription(a)).then(() => {
      if (R === r && r.sig) r.sig.send({ t: 'answer', to: r.peerId, from: r.id, sdp: pc.localDescription.toJSON ? pc.localDescription.toJSON() : pc.localDescription });
    }).catch((e) => { console.warn('[online] answer', e); fail(noConnect(r), true); });
    render();
  }
  // host: forget the half-made connection and wait for a guest again (the same code)
  function resetPeer(r) {
    try { if (r.pc) r.pc.close(); } catch (e) { /* closed */ }
    Object.assign(r, { pc: null, ctl: null, inp: null, peerId: null, connected: false, haveRemote: false, iceQ: [], peerPick: null, ready: false, peerReady: false, err: '', status: M().waitFriend });
    clearInterval(r.pingT);
    if (!r.sig) { r.checked = true; r.sig = signal(r.code, { id: r.id, role: 'host', v: PROTO }, sigHandlers(r)); }
    portalRooms((P) => P.open(r.code, true));
    render();
  }
  function wire(r, ch) {
    if (ch.label === 'in') { r.inp = ch; ch.binaryType = 'arraybuffer'; ch.onmessage = (e) => onIn(r, e.data); }
    else { r.ctl = ch; ch.onmessage = (e) => { let m = null; try { m = JSON.parse(e.data); } catch (err) { return; } onCtl(r, m); }; }
    ch.onopen = () => {
      if (R !== r || r.connected || !r.ctl || !r.inp || r.ctl.readyState !== 'open' || r.inp.readyState !== 'open') return;
      r.connected = true; r.err = ''; r.status = M().connected;
      // the server is not needed any more: the room's channel closes (fewer open connections on the server; the host
      // opens it again if the friend leaves and the room waits for someone else)
      if (r.sig) { const s = r.sig; r.sig = null; setTimeout(() => { try { s.close(); } catch (e) { /* closed */ } }, 2000); }
      r.pingT = setInterval(() => ping(r), PING_MS); ping(r);
      ctlSend({ t: 'hello', v: PROTO, pick: r.pick, arena: r.arena });
      portalRooms((P) => P.open(r.code, false));
      render();
    };
    ch.onclose = () => { if (R === r && r.connected) lost(r); };
  }
  // the connection is gone
  function lost(r) {
    if (R !== r || !r.connected) return;
    r.connected = false;
    clearInterval(r.pingT);
    if (screen === 'match' && NET.active) { NET.end('drop', r.side); return; }
    if (r.role === 'host' && screen === 'room') { resetPeer(r); r.err = M().friendLeft; render(); return; }
    r.err = M().friendLeft; render();
  }

  // test hook: artificial delay, jitter and loss on the unreliable channel ({ delay, jitter, loss }, ms / 0..1)
  const netem = () => window.__ndNetem || null;
  function sendIn(buf, r = R) {
    if (!r || !r.inp || r.inp.readyState !== 'open') return;
    const ch = r.inp, E = netem();
    const go = () => { try { if (ch.readyState === 'open' && ch.bufferedAmount < 65536) ch.send(buf); } catch (e) { /* closing */ } };
    if (!E) return go();
    if (E.loss > 0 && Math.random() < E.loss) return;
    const d = (E.delay || 0) + Math.random() * (E.jitter || 0);
    if (d > 0) setTimeout(go, d); else go();
  }
  function ctlSend(o, r = R) {
    if (!r || !r.ctl || r.ctl.readyState !== 'open') return;
    const ch = r.ctl, s = JSON.stringify(o), E = netem();
    const go = () => { try { if (ch.readyState === 'open') ch.send(s); } catch (e) { /* closing */ } };
    if (E && E.delay) setTimeout(go, E.delay); else go();
  }
  function ping(r) {
    const id = ++r.pingN, b = new ArrayBuffer(13), v = new DataView(b);
    v.setUint8(0, T_PING); v.setUint32(1, id); v.setFloat64(5, performance.now());
    sendIn(b, r);
    if (screen === 'match') hudPing();
  }
  function onIn(r, data) {
    if (R !== r || !(data instanceof ArrayBuffer) || data.byteLength < 1) return;
    const v = new DataView(data), t = v.getUint8(0);
    if (t === T_PING && data.byteLength >= 13) { v.setUint8(0, T_PONG); sendIn(data, r); return; }
    if (t === T_PONG && data.byteLength >= 13) {
      const ms = performance.now() - v.getFloat64(5);
      if (!(ms >= 0 && ms < 10000)) return;
      r.rtt = r.rtt ? r.rtt + (ms - r.rtt) * 0.2 : ms;
      r.rttMin = r.rttMin ? Math.min(r.rttMin, ms) : ms;
      NET.setRtt(r.rtt);
      if (screen === 'room') renderPing();
      return;
    }
    NET.receive(data);
  }

  // ---------------------------------------------------------------- room messages (reliable channel)
  function onCtl(r, m) {
    if (R !== r || !m || typeof m.t !== 'string') return;
    switch (m.t) {
      case 'hello':
        if (m.v !== PROTO) { fail(M().version); return; }
        if (charOk(m.pick)) r.peerPick = m.pick;
        if (r.role === 'guest' && arenaOk(m.arena)) r.arena = m.arena;
        render(); break;
      case 'pick': if (charOk(m.c)) { r.peerPick = m.c; r.peerReady = false; render(); } break;
      case 'arena': if (r.role === 'guest' && arenaOk(m.a)) { r.arena = m.a; r.ready = false; render(); } break;
      case 'ready': r.peerReady = !!m.on; render(); maybeStart(); break;
      case 'start': if (r.role === 'guest') begin(m); break;
      case 'go': NET.peerReady(m.m); break;
      case 'rematch': r.peerRematch = !!m.on; if (screen === 'end') renderEnd(); maybeRematch(); break;
      case 'lobby': toLobby(false); break;
      case 'end': { // the other side ended the match (its own view): e.g. it gave up waiting for this tab
        // (only this match: a late message of an earlier one must never end the rematch)
        const S = NET.active && NET.session();
        if (S && !S.finished && (m.m & 255) === S.m) NET.end(m.why === 'desync' ? 'desync' : 'away', -1);
        break;
      }
      case 'pause': NET.peerPause(m.m, m.at, m.why); break;
      case 'resume': NET.peerResume(m.m); break;
      case 'leave':
        if (screen === 'match' && NET.active) { NET.end('left', r.side); r.connected = false; return; }
        r.connected = false; clearInterval(r.pingT);
        if (r.role === 'host' && screen === 'room') { resetPeer(r); r.err = M().friendLeft; render(); }
        else { r.err = M().friendLeft; if (screen === 'end') renderEnd(); else render(); }
        break;
      default:
    }
  }
  function setPick(i) {
    if (!R || !charOk(i)) return;
    R.pick = i; R.ready = false;
    if (G.sel) G.sel.c[0] = i;
    ctlSend({ t: 'pick', c: i }); ctlSend({ t: 'ready', on: false });
    render();
  }
  function setArena(a) {
    if (!R || R.role !== 'host' || !arenaOk(a)) return;
    R.arena = a; R.peerReady = false; R.ready = false;
    ctlSend({ t: 'arena', a }); ctlSend({ t: 'ready', on: false });
    render();
  }
  function toggleReady() {
    if (!R || !R.connected) return;
    R.ready = !R.ready;
    ctlSend({ t: 'ready', on: R.ready });
    render(); maybeStart();
  }
  // host: both ready → the match (a fresh seed; the input delay from the measured round trip)
  function maybeStart() {
    const r = R;
    if (!r || r.role !== 'host' || !r.connected || !r.ready || !r.peerReady || !charOk(r.peerPick) || screen !== 'room') return;
    const m = { t: 'start', m: (++r.matchNo) & 255, seed: rnd32() | 0, chars: [r.pick, r.peerPick], arena: r.arena, delay: delayFor(r.rtt) };
    ctlSend(m);
    begin(m);
  }
  const delayFor = (rtt) => (rtt > 0 ? Math.max(2, Math.min(4, Math.round((rtt / 2000 / G.STEP) * 0.6))) : 2);
  function maybeRematch() {
    const r = R;
    if (!r || r.role !== 'host' || !r.rematch || !r.peerRematch || !r.connected || screen !== 'end') return;
    const last = r.last;
    const m = { t: 'start', m: (++r.matchNo) & 255, seed: rnd32() | 0, chars: last.chars, arena: last.arena, delay: delayFor(r.rtt) };
    ctlSend(m);
    begin(m);
  }

  // ---------------------------------------------------------------- the match
  function begin(m) {
    const r = R;
    if (!r || !charOk(m.chars && m.chars[0]) || !charOk(m.chars[1]) || !arenaOk(m.arena)) return;
    r.matchNo = m.m; r.last = { chars: m.chars.slice(), arena: m.arena };
    r.rematch = r.peerRematch = false; r.ready = r.peerReady = false; r.result = null; r.away = false;
    hideAll();
    screen = 'match';
    $('app').classList.add('online');
    if ($('first')) $('first').hidden = true;
    NET.begin({
      side: r.side, seed: m.seed, chars: m.chars, arena: m.arena, match: m.m, delay: m.delay, rtt: r.rtt,
      send: (b) => sendIn(b, r), sendCtl: (o) => ctlSend(o, r),
      onStatus: (kind, info) => waitUi(kind, info),
      onEnd: (res) => matchOver(r, res),
    });
    NET.setHidden(document.hidden);
    clearInterval(r.keepT);
    r.keepT = setInterval(() => { if (R === r && NET.active) { syncAway(); NET.keepalive(); } }, 250);
    hudShow(true);
    if (typeof ND.online.onBegin === 'function') ND.online.onBegin(m);
  }
  function matchOver(r, res) {
    if (R !== r) return;
    r.result = res;
    if (res.reason === 'drop' || res.reason === 'desync' || res.reason === 'pause') ctlSend({ t: 'end', why: res.reason, m: r.matchNo }, r);
    waitUi('ok');
    hudShow(false);
    setTimeout(() => { if (R === r && r.result === res) { screen = 'end'; renderEnd(); } }, res.reason === 'ko' ? 400 : 0);
    if (typeof ND.online.onEnd === 'function') ND.online.onEnd(res);
  }
  // back to the fighter choice (both players)
  function toLobby(tell) {
    const r = R;
    if (!r) return;
    if (tell) ctlSend({ t: 'lobby' });
    if (NET.active) NET.stop();
    clearInterval(r.keepT);
    r.ready = r.peerReady = r.rematch = r.peerRematch = false; r.result = null;
    hudShow(false); waitUi('ok');
    screen = null; // (not a match any more: the start below is not a way out of one)
    G.start('attract');
    show('room');
  }
  function leave() {
    teardown(true);
    hudShow(false); waitUi('ok'); hideAll(); screen = null;
    G.goMenu();
  }

  // ---------------------------------------------------------------- portal invites (CrazyGames)
  const bridge = () => (window.NDPortal && window.NDPortal.rooms && window.NDPortal.rooms.available() ? window.NDPortal.rooms : null);
  function portalRooms(fn) { const P = bridge(); if (P) { try { fn(P); } catch (e) { console.warn('[online] portal room', e); } } }
  function inviteLink(code) {
    const P = bridge(), l = P && P.link(code);
    if (l) return l;
    try { return location.origin + location.pathname + '?room=' + code; } catch (e) { return '?room=' + code; }
  }

  // ---------------------------------------------------------------- screens
  const CSS = `
  #app.online #pauseBtn { display: none !important; }
  #onl { display: flex; flex-direction: column; align-items: center; background: rgba(5,6,12,.8); z-index: 30; }
  .onl-card { box-sizing: border-box; width: min(640px, 100%); margin: auto 0; display: grid; gap: 14px; }
  /* (no backdrop blur: the fight keeps moving behind the room screen, a phone would blur it again on every frame) */
  #onl .onl-card, #onlEnd .card, #onlConfirm .card { backdrop-filter: none; -webkit-backdrop-filter: none; background: rgba(10,12,22,.94); }
  .onl-card p { margin: 0; }
  .onl-card p:empty { display: none; }
  .onl-head { display: flex; gap: 14px; align-items: center; }
  .onl-k { font: 700 44px/1 var(--jp); color: var(--gold); }
  .onl-title { margin: 0; font: 700 clamp(24px, 4vw, 34px)/1.05 var(--display); letter-spacing: .05em; text-transform: uppercase; }
  .onl-sub { margin: 4px 0 0; color: var(--muted); font-size: 14px; }
  .onl-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .onl-row > .grow { flex: 1 1 180px; min-width: 0; }
  .onl-in { box-sizing: border-box; width: 100%; padding: 11px 12px; background: rgba(0,0,0,.35); border: 1px solid var(--line); color: var(--text); font: 600 16px/1 var(--display); letter-spacing: .12em; }
  .onl-in.code { text-transform: uppercase; letter-spacing: .4em; font-size: 20px; }
  .onl-lbl { font: 500 11px/1 var(--display); letter-spacing: .2em; text-transform: uppercase; color: var(--muted); }
  .onl-code { font: 700 clamp(30px, 6vw, 44px)/1 var(--display); letter-spacing: .3em; color: var(--gold-hi); user-select: text; -webkit-user-select: text; }
  .onl-st { color: var(--muted); font-size: 14px; min-height: 1.4em; }
  .onl-st b { color: var(--text); font-weight: 600; }
  .onl-err { color: #ffb4a8; font-size: 14px; margin: 0; }
  /* the room: 1P card | roster and arena | 2P card (phones: the two cards side by side, the roster under them) */
  .onl-card.onl-room { width: min(1080px, 100%); gap: 12px; }
  .onl-top { display: flex; gap: 8px 18px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
  .onl-stage { display: grid; grid-template-columns: minmax(150px, 1fr) minmax(0, 2.4fr) minmax(150px, 1fr); gap: 12px; align-items: stretch; }
  .onl-mid { display: grid; gap: 6px; align-content: start; min-width: 0; }
  .onl-mid > .onl-lbl { margin: 4px 0 0; }
  .onl-p { padding: 10px 12px; border: 1px solid var(--line); border-top: 3px solid var(--pc, var(--gold)); background: rgba(10,12,22,.6); display: grid; gap: 4px; align-content: start; min-width: 0; }
  .onl-pv { display: grid; place-items: center; width: 100%; height: clamp(120px, 32vh, 270px); color: var(--muted); font: 600 13px/1.2 var(--display); letter-spacing: .1em; text-transform: uppercase; }
  .onl-p .nm { font: 600 18px/1.1 var(--display); letter-spacing: .06em; }
  .onl-p .nm .k { font-family: var(--jp); margin-right: 6px; color: var(--pc); }
  .onl-p .onl-ln { font-size: 12.5px; line-height: 1.3; color: var(--muted); min-height: 1.3em; }
  .onl-p .rd { font: 600 11px/1 var(--display); letter-spacing: .18em; text-transform: uppercase; color: var(--muted); }
  .onl-p .rd.on { color: #9be29b; }
  .onl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 6px; }
  .onl-ch { position: relative; display: grid; justify-items: center; gap: 1px; padding: 4px 4px 6px; background: rgba(255,255,255,.035); border: 1px solid var(--line); cursor: pointer; color: var(--text); font: 600 13px/1.1 var(--display); letter-spacing: .05em; text-align: center; overflow: hidden; }
  .onl-ch .onl-th { width: 100%; height: 50px; object-fit: contain; }
  .onl-ch .k { position: absolute; top: 3px; left: 5px; font: 700 13px/1 var(--jp); color: var(--cc); }
  .onl-ch[aria-pressed="true"] { border-color: var(--gold-hi); background: rgba(217,179,108,.2); box-shadow: inset 0 0 0 1px var(--gold-hi); }
  .onl-ch .fr { position: absolute; top: 3px; right: 4px; font: 600 9px/1 var(--display); letter-spacing: .1em; color: var(--gold-hi); background: rgba(8,9,16,.8); padding: 2px 3px; }
  .onl-arena { display: grid; grid-template-columns: minmax(110px, 200px) minmax(0, 1fr); gap: 8px; align-items: center; }
  .onl-arv { width: 100%; aspect-ratio: 16 / 7; border: 1px solid var(--line); background: #05060c; }
  @media (max-width: 760px) {
    .onl-stage { grid-template-columns: 1fr 1fr; }
    .onl-mid { grid-column: 1 / -1; grid-row: 2; }
    .onl-arena { grid-template-columns: 1fr; }
    .onl-arv { max-height: 90px; }
  }
  .onl-btns { display: flex; gap: 8px; flex-wrap: wrap; }
  .onl-btns .btn { flex: 1 1 160px; }
  .onl-ping { font: 600 12px/1 var(--display); letter-spacing: .12em; color: var(--muted); }
  .onl-ping.good { color: #9be29b; } .onl-ping.ok { color: #e8d48a; } .onl-ping.bad { color: #ffb4a8; }
  #onlHud { position: absolute; right: 12px; bottom: 10px; display: flex; gap: 10px; align-items: center; z-index: 12; pointer-events: auto; }
  #app.touch #onlHud { top: 64px; bottom: auto; right: 10px; } /* (touch: the pause button's corner; the pads are below) */
  #onlHud .btn { padding: 7px 10px; font-size: 12px; }
  #onlWait { position: absolute; left: 50%; top: 38%; translate: -50% 0; padding: 14px 18px; background: rgba(8,9,16,.88); border: 1px solid var(--gold); text-align: center; z-index: 31; display: grid; gap: 10px; min-width: 240px; }
  #onlWait p { margin: 0; font: 600 16px/1.3 var(--display); letter-spacing: .06em; }
  #onlConfirm, #onlEnd { display: grid; place-items: center; background: rgba(5,6,12,.72); z-index: 32; }
  @media (max-height: 460px) { .onl-card { gap: 8px; padding: 12px; } .onl-k { font-size: 30px; } .onl-code { font-size: 26px; } .onl-title { font-size: 22px; } .onl-pv { height: clamp(100px, 42vh, 170px); } .onl-grid { grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 4px; } .onl-ch .onl-th { height: 40px; } .onl-p { padding: 8px; } }
  `;
  let built = false;
  function build() {
    if (built) return;
    built = true;
    const st = document.createElement('style'); st.id = 'onlCss'; st.textContent = CSS; document.head.appendChild(st);
    const app = $('app');
    const mk = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
    app.appendChild(mk('<div id="onl" class="overlay" hidden role="dialog" aria-modal="true" aria-labelledby="onlTitle"></div>'));
    app.appendChild(mk('<div id="onlHud" hidden><span class="onl-ping" id="onlPing"></span><button class="btn" id="onlQuit" type="button"></button></div>'));
    app.appendChild(mk('<div id="onlWait" hidden role="status" aria-live="polite"><p id="onlWaitT"></p><button class="btn" id="onlWaitQuit" type="button"></button></div>'));
    app.appendChild(mk('<div id="onlConfirm" class="overlay" hidden role="dialog" aria-modal="true"><div class="dialog card"><p class="title" style="font-size:30px" id="onlCfT"></p>' +
      '<p class="sub" id="onlCfS"></p><div class="btns"><button class="btn primary" id="onlStay" type="button"></button>' +
      '<button class="btn" id="onlLeaveNow" type="button"></button></div></div></div>'));
    app.appendChild(mk('<div id="onlEnd" class="overlay" hidden role="dialog" aria-modal="true"></div>'));
    relabel();
    $('onlQuit').onclick = () => confirmLeave(true);
    $('onlWaitQuit').onclick = () => leave();
    $('onlStay').onclick = () => confirmLeave(false);
    $('onlLeaveNow').onclick = () => { confirmLeave(false); leave(); };
  }
  // texts of the parts built once (the language can change while they exist)
  function relabel() {
    const L = M(), set = (id, t) => { const e = $(id); if (e) e.textContent = t; };
    set('onlQuit', L.leaveMatch); set('onlWaitQuit', L.leaveMatch); set('onlCfT', L.leaveQ); set('onlCfS', L.leaveSub); set('onlStay', L.stay); set('onlLeaveNow', L.leaveMatch);
    const b = $('mfriend');
    if (b) { b.querySelector('strong').textContent = L.title; b.querySelector('span').textContent = L.menuSub; }
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function hideAll() { ['onl', 'onlEnd', 'onlConfirm'].forEach((id) => { const e = $(id); if (e) e.hidden = true; }); }
  function show(which) {
    build();
    screen = which;
    hideAll();
    $('menu').hidden = true;
    if ($('first')) $('first').hidden = true;
    $('onl').hidden = false;
    render();
  }
  let flashMsg = '';
  function flash(t) { flashMsg = t; render(); }

  function render() {
    if (!built || (screen !== 'home' && screen !== 'room')) return;
    const box = $('onl');
    if (screen === 'home' || !R) return renderHome(box);
    renderRoom(box);
  }
  function renderHome(box) {
    box.innerHTML = `<div class="onl-card card">
      <div class="onl-head"><b class="onl-k" aria-hidden="true">友</b><div><p class="onl-title" id="onlTitle"></p><p class="onl-sub" id="onlHomeSub"></p></div></div>
      <button class="btn primary" id="onlCreate" type="button"></button>
      <div class="onl-row"><div class="grow"><label class="onl-lbl" for="onlCode" id="onlCodeL"></label>
        <input class="onl-in code" id="onlCode" lang="en" translate="no" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" enterkeyhint="go"></div>
        <button class="btn" id="onlJoin" type="button" style="align-self:flex-end"></button></div>
      <p class="onl-err" id="onlErr"></p>
      <div class="onl-btns"><button class="btn" id="onlBack" type="button"></button></div>
    </div>`;
    $('onlTitle').textContent = M().title; $('onlHomeSub').textContent = M().homeSub;
    $('onlCreate').textContent = M().create; $('onlJoin').textContent = M().join; $('onlBack').textContent = M().back;
    $('onlCodeL').textContent = M().haveCode; $('onlCode').placeholder = M().codePh;
    $('onlErr').textContent = flashMsg; flashMsg = '';
    $('onlCreate').onclick = () => createRoom();
    const code = $('onlCode');
    code.oninput = () => { const v = cleanCode(code.value).slice(0, 6); if (v !== code.value) code.value = v; };
    code.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); joinRoom(code.value); } };
    $('onlJoin').onclick = () => joinRoom(code.value);
    $('onlBack').onclick = () => close();
    setTimeout(() => { const b = $('onlCreate'); if (b) b.focus(); }, 0);
  }
  // a fighter name in its own element with lang="en": the page language must not case it (Turkish would turn i into İ)
  function nameEl(i) { const n = document.createElement('span'); n.lang = 'en'; n.setAttribute('translate', 'no'); n.textContent = charName(i); return n; }
  function charName(i) { const c = ND.CHARS[i]; return c ? c.name.charAt(0) + c.name.slice(1).toLowerCase() : ''; }
  function charCol(i, alt) { const c = ND.CHARS[i]; if (!c) return 'var(--gold)'; const p = ND.palOf ? ND.palOf(c, alt) : c.col; return (p && p.ui) || 'var(--gold)'; }
  function arenaName(id) { const a = ND.ARENAS.find((x) => x.id === id); return a ? a.name : id; }
  // Fighter pictures for the roster (the select screen's own drawing: a fighter in its stance, full model, head and
  // shoulders), drawn once each, one per display frame, and kept for the session (canvas elements, moved into each
  // new roster). No part pictures are made (fullDetail), so nothing here is baked for the fight.
  const thumbs = new Map(), thumbQ = [];
  let thumbF = null, thumbBusy = false;
  function thumb(i) {
    let c = thumbs.get(i);
    if (!c) {
      c = document.createElement('canvas'); c.className = 'onl-th'; c.setAttribute('aria-hidden', 'true');
      thumbs.set(i, c); thumbQ.push(i);
      if (!thumbBusy) { thumbBusy = true; requestAnimationFrame(drawThumbs); }
    }
    return c;
  }
  function drawThumbs() {
    const i = thumbQ.shift();
    if (i != null) { try { drawThumb(i, thumbs.get(i)); } catch (e) { console.warn('[online] thumb', e); } }
    if (thumbQ.length) requestAnimationFrame(drawThumbs); else thumbBusy = false;
  }
  function drawThumb(i, c) {
    const ch = ND.CHARS[i];
    if (!ch || !ND.Fighter) return;
    if (!thumbF) { thumbF = new ND.Fighter(0, new ND.Ctrl()); thumbF.fullDetail = true; }
    const f = thumbF, dpr = Math.min(2, window.devicePixelRatio || 1);
    f.setChar(ch, false); f.reset(0); f.dir = 1; f.pvPose = null;
    const tp = ND.pose.copy((f.P && f.P.stance) || ND.POSES.stance, {});
    for (let k = 0; k < 12; k++) { ND.pose.approach(f.pose, tp, 10, 0.05); f.solve(0.05); ND.updateCloth(f.j, 0.05); }
    const W = Math.round(72 * dpr), H = Math.round(56 * dpr);
    c.width = W; c.height = H;
    const pc = c.getContext('2d'), k = H / 88;
    pc.setTransform(k, 0, 0, k, W / 2 - 10 * k, 4 + 194 * k); // (the top of the head just inside the frame) // head and shoulders: the feet are far below the frame
    f.draw(pc, false);
    if (ND.eyeGlow) ND.eyeGlow(pc, f.j, f.col, f.ch.acc);
  }
  // the chosen arena: the room shows the live backdrop behind it (as the select screen does) through a small window
  let arenaT = 0;
  function arenaWindow() {
    const c = $('onlArv'), cv = $('cv');
    if (!c || !cv || screen !== 'room' || $('onl').hidden) { arenaT = 0; return; }
    const now = performance.now();
    if (now - arenaT > 120 && cv.width > 2) {
      arenaT = now;
      const r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
      // the middle band of the backdrop, the arena's width fitted to the window
      const sh = Math.min(cv.height, cv.width * H / W), sy = Math.max(0, (cv.height - sh) * 0.55);
      try { c.getContext('2d').drawImage(cv, 0, sy, cv.width, sh, 0, 0, W, H); } catch (e) { /* not drawable yet */ }
    }
    requestAnimationFrame(arenaWindow);
  }
  function renderRoom(box) {
    const r = R;
    const link = inviteLink(r.code);
    // 1P (host) on the left, 2P (guest) on the right, as in the match
    const pk = r.side === 0 ? [r.pick, r.connected ? r.peerPick : null] : [r.connected ? r.peerPick : null, r.pick];
    const same = charOk(pk[0]) && pk[0] === pk[1];
    box.innerHTML = `<div class="onl-card card onl-room">
      <div class="onl-top"><div class="onl-head"><b class="onl-k" aria-hidden="true">友</b><div style="min-width:0"><p class="onl-title" id="onlTitle"></p>
        <div class="onl-row"><span class="onl-lbl" id="onlRoomL"></span><span class="onl-code" id="onlRoomCode" lang="en" translate="no"></span></div></div></div>
        <p class="onl-st"><span id="onlSt"></span> <span class="onl-ping" id="onlRtt"></span></p></div>
      <div class="onl-row" id="onlInvite"><div class="grow"><input class="onl-in" id="onlLink" readonly lang="en" translate="no"></div>
        <button class="btn" id="onlCopy" type="button"></button><button class="btn" id="onlShare" type="button" hidden></button></div>
      <p class="onl-err" id="onlErr"></p>
      <div class="onl-stage">
        <div class="onl-p p1" id="onlP1"></div>
        <div class="onl-mid">
          <p class="onl-lbl" id="onlPickL"></p><div class="onl-grid" id="onlGrid"></div>
          <p class="onl-lbl" id="onlArenaL"></p>
          <div class="onl-arena"><canvas class="onl-arv" id="onlArv" aria-hidden="true"></canvas><div class="diff" id="onlArenas"></div></div>
        </div>
        <div class="onl-p p2" id="onlP2"></div>
      </div>
      <div class="onl-btns"><button class="btn primary" id="onlReady" type="button"></button><button class="btn" id="onlLeave" type="button"></button></div>
    </div>`;
    $('onlTitle').textContent = M().title; $('onlRoomCode').textContent = r.code; $('onlRoomL').textContent = M().room;
    $('onlLink').setAttribute('aria-label', M().linkLabel);
    $('onlLink').value = link;
    $('onlLink').onfocus = (e) => { try { e.target.select(); } catch (err) { /* no */ } };
    const copy = $('onlCopy');
    copy.textContent = bridge() ? M().invite : M().copy;
    copy.onclick = () => copyText(link).then((ok) => { if (ok) { copy.textContent = M().copied; setTimeout(() => { if (copy.isConnected) copy.textContent = bridge() ? M().invite : M().copy; }, 1500); } });
    if (navigator.share && (ND.touch && ND.touch.mobile)) {
      const sh = $('onlShare'); sh.hidden = false; sh.textContent = M().share;
      sh.onclick = () => navigator.share({ title: document.title || 'Shadow Duel', text: M().shareText(r.code), url: link }).catch(() => {});
    }
    $('onlInvite').hidden = r.connected || r.role !== 'host';
    $('onlSt').textContent = r.err ? '' : r.connected ? M().connected : r.status;
    renderPing();
    const err = $('onlErr');
    err.textContent = r.err || (r.role === 'host' && !r.connected ? M().inviteNote : '');
    err.className = r.err ? 'onl-err' : 'onl-st';
    if (r.err && r.retry) {
      const b = document.createElement('button'); b.className = 'btn'; b.type = 'button'; b.textContent = M().retry; b.style.marginLeft = '10px';
      b.onclick = () => (r.role === 'host' ? (resetPeer(r), render()) : joinRoom(r.code));
      err.appendChild(b);
    }
    // the two player cards: label, the fighter itself (the select screen's animated preview), name, title · weapon, ready
    for (let s = 0; s < 2; s++) {
      const el = $('onlP' + (s + 1)), ci = pk[s], mine = s === r.side, alt = s === 1 && same;
      el.style.setProperty('--pc', charOk(ci) ? charCol(ci, alt) : 'var(--line)');
      const lbl = document.createElement('span'); lbl.className = 'onl-lbl'; lbl.textContent = (mine ? M().you : M().friend) + (s === 0 ? ' · 1P' : ' · 2P');
      const pv = document.createElement(charOk(ci) ? 'canvas' : 'div'); pv.className = 'onl-pv';
      if (charOk(ci)) { pv.id = 'onlPv' + (s + 1); pv.setAttribute('aria-hidden', 'true'); } else pv.textContent = r.connected || mine ? M().waitPick : '—';
      const nm = document.createElement('span'); nm.className = 'nm';
      const ln = document.createElement('span'); ln.className = 'onl-ln';
      if (charOk(ci)) {
        const k = document.createElement('span'); k.className = 'k'; k.textContent = ND.CHARS[ci].kanji;
        nm.append(k, nameEl(ci));
        ln.textContent = ND.CHARS[ci].title + ' · ' + ND.CHARS[ci].weapon;
      }
      const rd = document.createElement('span'), on = mine ? r.ready : r.connected && r.peerReady;
      rd.className = 'rd' + (on ? ' on' : ''); rd.textContent = on ? M().ready : M().notReady;
      el.append(lbl, pv, nm, ln, rd);
    }
    $('onlPickL').textContent = M().pickTitle;
    const grid = $('onlGrid');
    ND.CHARS.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'onl-ch'; b.setAttribute('aria-pressed', String(i === r.pick));
      b.style.setProperty('--cc', charCol(i, false));
      b.setAttribute('aria-label', charName(i) + ' · ' + c.title);
      const k = document.createElement('span'); k.className = 'k'; k.textContent = c.kanji; k.setAttribute('aria-hidden', 'true');
      b.append(thumb(i), k, nameEl(i));
      if (r.connected && i === r.peerPick) { const f = document.createElement('span'); f.className = 'fr'; f.textContent = M().friendTag; b.appendChild(f); }
      b.onclick = () => setPick(i);
      grid.appendChild(b);
    });
    const ar = $('onlArenas');
    if (r.role === 'host') {
      $('onlArenaL').textContent = M().arenaTitle;
      for (const a of ND.ARENAS) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'seg'; b.textContent = a.name; b.setAttribute('aria-pressed', String(a.id === r.arena));
        b.onclick = () => setArena(a.id);
        ar.appendChild(b);
      }
    } else {
      $('onlArenaL').textContent = M().arenaHost;
      const s = document.createElement('span'); s.className = 'seg'; s.setAttribute('aria-pressed', 'true'); s.textContent = arenaName(r.arena);
      ar.appendChild(s);
    }
    const rb = $('onlReady');
    rb.disabled = !r.connected || !charOk(r.peerPick);
    rb.textContent = r.ready ? (r.peerReady ? M().bothReady : M().readyWait) : M().ready;
    rb.style.opacity = rb.disabled ? '.5' : '';
    rb.onclick = () => toggleReady();
    $('onlLeave').textContent = M().leave;
    $('onlLeave').onclick = () => leave();
    // the game draws the two previews and the arena behind (its select stage)
    G.roomStage(['onlPv1', 'onlPv2'], charOk(pk[0]) ? pk[0] : null, charOk(pk[1]) ? pk[1] : null, r.arena);
    if (!arenaT) { arenaT = 1; requestAnimationFrame(arenaWindow); }
  }
  function pingClass(ms) { return ms < 80 ? 'good' : ms < 160 ? 'ok' : 'bad'; }
  function renderPing() {
    const el = $('onlRtt'); if (!el || !R) return;
    const ms = Math.round(R.rtt);
    el.textContent = R.connected && ms ? M().ping(ms) : '';
    el.className = 'onl-ping ' + (ms ? pingClass(ms) : '');
  }
  function hudPing() {
    const el = $('onlPing'); if (!el || !R) return;
    const ms = Math.round(R.rtt), s = NET.stats();
    el.textContent = ms ? M().ping(ms) + (DEBUG && s ? ` · D${s.delay} · rb ${s.rollbacks}/${s.maxRolled} · adv ${s.adv}` : '') : '';
    el.className = 'onl-ping ' + (ms ? pingClass(ms) : '');
  }
  const DEBUG = /[?&]netdebug=1\b/.test(location.search);
  function hudShow(on) { build(); $('onlHud').hidden = !on; if (on) hudPing(); if (!on) confirmLeave(false); }
  function waitUi(kind, info) {
    build();
    const w = $('onlWait');
    if (kind === 'count') { w.hidden = true; if (G.showCount) G.showCount(info.n); return; }
    if (G.showCount) G.showCount(0);
    if (kind !== 'wait' && kind !== 'pause') { w.hidden = true; return; }
    const s = Math.ceil((info.left || 0) / 1000);
    let t;
    if (kind === 'wait') t = info.away ? M().away(s) : M().waitIn(s);
    else if (info.peer) t = info.peer === 'turn' ? M().turning(s) : M().away(s);
    else t = M().paused; // this player's own pause (the turn-your-phone hint covers it on a phone)
    $('onlWaitT').textContent = t;
    w.hidden = false;
  }
  function confirmLeave(on) { const c = $('onlConfirm'); if (!c) return; c.hidden = !on; if (on) setTimeout(() => $('onlStay').focus(), 0); }
  function renderEnd() {
    build();
    const r = R, res = r && r.result;
    if (!res) return;
    const box = $('onlEnd'), me = r.side;
    let title = M().over, why = '';
    if (res.reason === 'ko') title = res.winner < 0 ? M().draw : res.winner === me ? M().win : M().lose;
    else if (res.reason === 'drop') why = M().whyDrop;
    else if (res.reason === 'left') why = M().whyLeft;
    else if (res.reason === 'away') why = M().whyAway;
    else if (res.reason === 'desync') why = M().whyDesync;
    else if (res.reason === 'pause') why = res.winner === me ? M().whyPauseWin : res.winner < 0 ? M().whyPauseBoth : M().whyPauseLose;
    const w = res.wins || [0, 0], alive = r.connected && res.reason !== 'left';
    box.innerHTML = `<div class="dialog card"><div class="bigk" aria-hidden="true">${res.reason === 'ko' && res.winner === me ? '勝利' : '試合'}</div>
      <p class="title" id="onlEndT"></p><p class="sub" id="onlEndS"></p><p class="onl-st" id="onlEndW" style="margin:0 0 16px"></p>
      <div class="btns"><button class="btn primary" id="onlRematch" type="button"></button><button class="btn" id="onlChange" type="button"></button><button class="btn" id="onlEndLeave" type="button"></button></div></div>`;
    $('onlEndT').textContent = title;
    $('onlEndS').textContent = M().rounds(w[me], w[1 - me]) + ' · ' + arenaName(r.last ? r.last.arena : '');
    $('onlEndW').textContent = why || (r.err || '');
    const rb = $('onlRematch');
    rb.textContent = r.rematch ? M().rematchWait : r.peerRematch ? M().rematchAsk : M().rematch;
    rb.hidden = !alive; $('onlChange').hidden = !alive;
    rb.onclick = () => { if (!R || R.rematch) return; R.rematch = true; ctlSend({ t: 'rematch', on: true }); renderEnd(); maybeRematch(); };
    $('onlChange').textContent = M().change; $('onlChange').onclick = () => toLobby(true);
    $('onlEndLeave').textContent = M().leave; $('onlEndLeave').onclick = () => leave();
    box.hidden = false;
    setTimeout(() => { const b = alive ? rb : $('onlEndLeave'); if (b && !box.hidden) b.focus(); }, 0);
  }
  function copyText(t) {
    const fallback = () => {
      try { const i = $('onlLink'); if (!i) return false; i.focus(); i.select(); return document.execCommand('copy'); } catch (e) { return false; }
    };
    try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(() => true, () => fallback()); } catch (e) { /* no clipboard */ }
    return Promise.resolve(fallback());
  }
  function open() {
    if (!available()) return;
    if (R) { show('room'); return; }
    show('home');
  }
  function close() { hideAll(); screen = null; teardown(true); $('menu').hidden = false; setTimeout(() => { const b = $('mfriend'); if (b) b.focus(); }, 0); }

  // keys: Back / Escape on the room screens; P / Back / Escape in a match asks before leaving (no pause online)
  function onKey(e) {
    const I = ND.input;
    if (screen === 'match' && G.mode === 'online') {
      if (I.isPause(e) || I.isBack(e)) { confirmLeave($('onlConfirm').hidden); return true; }
      if (!$('onlConfirm').hidden) return !I.isEditable(e.target) && e.code !== 'Tab' && e.code !== 'Enter' && e.code !== 'Space';
      return false;
    }
    if (screen === 'home' || screen === 'room' || screen === 'end') {
      if (I.isEditable(e.target)) return false;
      if (I.isBack(e)) { if (screen === 'home') close(); else if (screen === 'room') leave(); return true; }
      if (e.code === 'Enter' && (document.activeElement === document.body || !document.activeElement)) return true;
      return false;
    }
    return false;
  }

  // ---------------------------------------------------------------- menu entry, invites, tab visibility
  function addMenuEntry() {
    if ($('mfriend')) return;
    const anchor = $('msingle') || $('mplay');
    if (!anchor) return;
    const b = document.createElement('button');
    b.className = 'mode friend'; b.id = 'mfriend'; b.type = 'button';
    const s = document.createElement('strong'); s.textContent = M().title;
    const d = document.createElement('span'); d.textContent = M().menuSub;
    const k = document.createElement('b'); k.className = 'mk'; k.setAttribute('aria-hidden', 'true'); k.textContent = '友';
    b.append(s, d, k);
    b.onclick = () => { if (ND.audio && ND.audio.ui) { try { ND.audio.init(); ND.audio.ui(); } catch (e) { /* no sound yet */ } } open(); };
    anchor.after(b);
  }
  function joinFromInvite(code) {
    code = cleanCode(code);
    if (!validCode(code) || (R && R.code === code)) return;
    if (screen === 'match') return; // (a match is on: ignore)
    build();
    joinRoom(code);
  }
  document.addEventListener('visibilitychange', () => { if (NET.active) { NET.setHidden(document.hidden); syncAway(); NET.keepalive(); } });
  // Away from the match (an agreed pause of both players, js/net.js): the phone held upright (the turn-your-phone hint
  // is up), the tab hidden, or fullscreen just left (a moment to settle).
  let fsLeftAt = 0, fsWas = false;
  const PORTRAIT = (() => { try { return window.matchMedia('(orientation: portrait)'); } catch (e) { return { matches: false }; } })();
  function awayWhy() {
    if (screen !== 'match' || !NET.active) return null;
    if (document.hidden) return 'away';
    if (ND.touch && ND.touch.active && PORTRAIT.matches) return 'turn';
    if (fsLeftAt && performance.now() - fsLeftAt < 1500) return 'turn';
    return null;
  }
  function syncAway() { if (NET.active) NET.setAway(awayWhy()); }
  ['resize', 'orientationchange'].forEach((ev) => window.addEventListener(ev, () => syncAway()));
  ['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => document.addEventListener(ev, () => {
    const fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (fsWas && !fs && screen === 'match') fsLeftAt = performance.now();
    fsWas = fs; syncAway();
  }));
  window.addEventListener('pagehide', () => { if (R) teardown(true); });

  ND.online = {
    available, open, close, leave, onKey, get friendTag() { return M().friendTag; },
    create: () => { if (available()) { build(); createRoom(); } return R && R.code; },
    join: (code) => { if (available()) { build(); joinRoom(code); } },
    pick: setPick, arena: setArena, ready: toggleReady, rematch: () => { const b = $('onlRematch'); if (b) b.click(); }, toLobby: () => toLobby(true), syncAway: () => syncAway(),
    state: () => ({ screen, role: R && R.role, code: R && R.code, connected: !!(R && R.connected), rtt: R ? Math.round(R.rtt) : 0, err: R ? R.err : '', peerPick: R && R.peerPick, ready: !!(R && R.ready), peerReady: !!(R && R.peerReady), result: R && R.result, ice: R && R.ice }),
    endShown: () => screen === 'end' && !!$('onlEnd') && !$('onlEnd').hidden,
    onBegin: null, onEnd: null,
  };

  if (!available()) return;
  addMenuEntry();
  // Anything that takes the game out of a running online match without going through the room (a menu button, a
  // key) leaves the room properly: the friend is told at once instead of waiting 10 s, and no result of this match
  // can come up later over another screen.
  const start0 = G.start;
  G.start = function (mode) {
    if (mode !== 'online' && screen === 'match' && R) { teardown(true); hudShow(false); waitUi('ok'); hideAll(); screen = null; }
    return start0.apply(this, arguments);
  };
  // another language chosen (Settings): the open screen and the parts built once follow
  if (ND.i18n && ND.i18n.onChange) {
    ND.i18n.onChange(() => {
      relabel();
      if (screen === 'home' || screen === 'room') render(); else if (screen === 'end') renderEnd(); else if (screen === 'match') hudPing();
    });
  }
  const q = /[?&]room=([A-Za-z]{6})\b/.exec(location.search);
  if (q) setTimeout(() => joinFromInvite(q[1]), 0);
  // CrazyGames: the invite this game was opened from, and invites accepted while it runs
  if (ND.portal && ND.portal.ready) {
    ND.portal.ready.then(() => {
      const P = bridge();
      if (!P) return;
      const c = P.invited();
      if (c) joinFromInvite(c);
      P.onJoin((code) => joinFromInvite(code));
    }).catch(() => {});
  }
})(window.ND);
