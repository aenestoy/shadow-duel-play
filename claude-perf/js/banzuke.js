// Gölge Düellosu — rekabet katmanı (番付 Banzuke): Aylık Turnuva, Dan rütbesi, kural değiştiriciler, Şampiyonlar Salonu
//   Turnuva dönemi bir UTC takvim ayıdır (leaderboard.js period). Kod içindeki "week" adları eski sürümden kaldı.
//   Biten ayın ilk 3'ü kalıcı unvan alır (Aylık Şampiyon / Finalist); şampiyon, kullandığı ninjanın Şampiyon renklerini açar.
//
//   ND.MODS / ND.mods   — kural değiştirici tablosu + çalışma zamanı (dövüşçü yöntemlerini sarar; fighter.js'e dokunmaz)
//   ND.banzuke.gen(key) — ay anahtarından (2026-09) TOHUMLU üretilen 8 dövüşlük merdiven (herkes için aynı; Math.random yok)
//   ND.banzuke.tourney  — turnuva koşusu (arcade gibi bir "koşu denetleyicisi": game.runner)
//   ND.banzuke.danRun   — Dan sınavı koşusu; ND.banzuke.dan — rütbe durumu (ND.save)
//   ND.banzuke.ui       — lobi (turnuva / Dan), sonuç ekranı, Şampiyonlar Salonu, menü durumu
//
// Koşu denetleyicisi arayüzü (game.js çağırır): mode, run, hudTags(), tick(rdt), onRoundEnd(w), onMatchEnd(w, res) → bool,
//   primary(), retry(), quit(), abandon(), fight(), onKey(e), noRestart
(function (ND) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const T = () => (ND.STR && ND.STR.bz) || {};
  const LB = () => ND.leaderboard;
  const au = () => ND.audio || { ui() {}, tick() {}, taiko() {}, gong() {} };
  const fmtNum = (n) => { if (ND.i18n) return ND.i18n.num(n); try { return Math.round(n).toLocaleString('tr-TR'); } catch (e) { return String(Math.round(n)); } };
  const upper = (s) => (ND.i18n ? ND.i18n.upper(s) : String(s).toLocaleUpperCase('tr-TR'));
  const tx = (s) => (ND.i18n ? ND.i18n.t(s) : s);
  const fmtTime = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  // DOM yardımcısı: h('div', { class, title, … , on: { click } }, ...çocuklar) — metin daima textContent
  function h(tag, a, ...kids) {
    const e = document.createElement(tag);
    if (a) for (const k of Object.keys(a)) {
      const v = a[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'on') for (const ev of Object.keys(v)) e.addEventListener(ev, v[ev]);
      else if (k === 'style') e.style.cssText = v;
      else if (k === 'text') e.textContent = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    add(e, kids);
    return e;
  }
  // Element.append(null) "null" yazar: boşları atlayarak ekle
  function add(e, ...kids) {
    for (const c of kids.flat(2)) { if (c == null || c === false) continue; e.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c))); }
    return e;
  }

  // ================================================================ TOHUMLU RASTGELE (haftalık merdiven için)
  function hash32(str) { let x = 0x811c9dc5; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 0x01000193); } return x >>> 0; }
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hex8 = (n) => (n >>> 0).toString(16).padStart(8, '0');

  // ================================================================ KURAL DEĞİŞTİRİCİLER
  // Her biri var olan sistemleri çarpanla ayarlar; iki taraf için de geçerlidir (ayna hariç: o rakip seçimidir).
  //   dmgAll: tüm hasar · dmgCounter: karşılık/bitiriş hasarı · dmgNormal: karşılık ve ki tekniği dışı vuruşlar
  //   post: denge (posture) hasarı · ki: ki kazancı · ammo: shuriken sayısı · roundKi: raund başı ki · hpStart: raund başı can
  //   winsNeed: maçı almak için gereken raund · mirror: rakip = senin ninjan
  const MODS = ND.MODS = {
    rally2x: { k: '連', dmgCounter: 2, w: 3 },
    fullKi: { k: '満', roundKi: 100, w: 3 },
    sudden: { k: '一', winsNeed: 1, hpStart: 0.5, w: 2 },
    mirror: { k: '鏡', mirror: true, w: 2 },
    parryOnly: { k: '返', dmgNormal: 0.25, dmgCounter: 1.5, w: 2 },
    posture2x: { k: '崩', post: 2, w: 3 },
    shuriken3x: { k: '星', ammo: 3, w: 3 },
    kiRush: { k: '気', ki: 2, w: 3 },
    glass: { k: '刃', dmgAll: 1.5, w: 2 },
  };
  const MOD_IDS = Object.keys(MODS);
  const baseF = () => ({ dmgAll: 1, dmgCounter: 1, dmgNormal: 1, post: 1, ki: 1, ammo: 1, roundKi: 0, hpStart: 1, winsNeed: 2 });
  const M = ND.mods = {
    on: false, ids: [], f: baseF(), hits: 0,
    // game.start her maçta çağırır: ids yoksa kapanır (isabet sayacı her maçta sıfırlanır)
    set(ids) {
      this.hits = 0;
      this.ids = (Array.isArray(ids) ? ids : []).filter((id) => Object.prototype.hasOwnProperty.call(MODS, id));
      const f = baseF();
      for (const id of this.ids) {
        const m = MODS[id];
        if (m.dmgAll) f.dmgAll *= m.dmgAll;
        if (m.dmgCounter) f.dmgCounter *= m.dmgCounter;
        if (m.dmgNormal) f.dmgNormal *= m.dmgNormal;
        if (m.post) f.post *= m.post;
        if (m.ki) f.ki *= m.ki;
        if (m.ammo) f.ammo = Math.max(f.ammo, m.ammo);
        if (m.roundKi) f.roundKi = Math.max(f.roundKi, m.roundKi);
        if (m.hpStart) f.hpStart = Math.min(f.hpStart, m.hpStart);
        if (m.winsNeed) f.winsNeed = Math.min(f.winsNeed, m.winsNeed);
      }
      this.f = f; this.on = this.ids.length > 0;
    },
    clear() { this.set(null); },
    winsNeed() { return this.on ? this.f.winsNeed : 2; },
    // raund başı (fighter.reset'ten sonra): ki, shuriken, can
    roundStart(F) {
      if (!this.on) return;
      for (const f of F) {
        if (this.f.roundKi) f.ki = Math.max(f.ki || 0, this.f.roundKi);
        if (this.f.ammo > 1) f.ammo = f.ch.ammo * this.f.ammo;
        if (this.f.hpStart < 1) { f.hp = f.ghost = Math.max(1, Math.round(f.maxHp * this.f.hpStart)); }
      }
    },
  };
  // Dövüşçü yöntemlerini sar (orijinal davranış değişmez; değiştirici yoksa doğrudan geçer)
  if (ND.Fighter && !ND.Fighter.prototype._bzWrapped) {
    const FP = ND.Fighter.prototype, take = FP.takeHit, blk = FP.blocked, gk = FP.gainKi;
    FP._bzWrapped = true;
    FP.takeHit = function (raw, a, from) {
      const args = Array.prototype.slice.call(arguments);
      if (M.on && a) {
        let m = M.f.dmgAll;
        if (a.counter || a.crush) m *= M.f.dmgCounter; else if (!a.special) m *= M.f.dmgNormal;
        if (m !== 1) args[0] = raw * m;
        if (M.f.post !== 1 && a.post) args[1] = Object.assign({}, a, { post: a.post * M.f.post });
      }
      const G = ND.game, hp0 = this.hp;
      const r = take.apply(this, args);
      if (G && G.F && this === G.F[1] && from === G.F[0] && this.hp < hp0) M.hits++;
      return r;
    };
    FP.blocked = function (a) {
      const args = Array.prototype.slice.call(arguments);
      if (M.on && M.f.post !== 1 && a && a.post) args[0] = Object.assign({}, a, { post: a.post * M.f.post });
      return blk.apply(this, args);
    };
    FP.gainKi = function (v) { return gk.call(this, M.on && M.f.ki !== 1 ? v * M.f.ki : v); };
  }

  // ================================================================ DAN RÜTBESİ
  // r = kazanılan rütbe: 0 rütbesiz, 1 = 10. Kyu … 10 = 1. Kyu, 11 = 1. Dan … 20 = 10. Dan.
  // DAN[r] = r rütbesini kazandıran sınav: f = dövüşlerin yapay zekâ seviyeleri (0 Çırak … 3 Şura), hp = rakip can çarpanı,
  //   mods = kural değiştiriciler, boss = son dövüş Şura'ya karşı. (Sunucudaki nd_dan_min_level ile uyumlu: en yüksek seviye ≥ eşik.)
  // Düşme: 2. Dan ve üstünde (r ≥ 12) art arda 3 başarısız sınav → bir basamak aşağı. Kyu'lar ve 1. Dan düşmez.
  const DAN = [null,
    { f: [0] }, { f: [0] }, { f: [0], hp: 1.15 },
    { f: [1] }, { f: [1], mods: ['kiRush'] }, { f: [1], hp: 1.15 }, { f: [1, 1] },
    { f: [2] }, { f: [2], mods: ['posture2x'] }, { f: [2, 2] },
    { f: [2, 2], hp: 1.1 }, { f: [2, 2], mods: ['parryOnly'] }, { f: [3] }, { f: [2, 3], hp: 1.1 },
    { f: [3, 3], mods: ['glass'] }, { f: [3, 3], hp: 1.15 }, { f: [3, 3, 3] }, { f: [3, 3, 3], mods: ['sudden'] },
    { f: [3, 3, 3], hp: 1.2 }, { f: [3, 3, 3], hp: 1.25, boss: true },
  ];
  const DAN_MAX = 20, DEMOTE_FROM = 12, STRIKES = 3;
  const dsave = () => { const p = ND.save && ND.save.p; if (p && p.bz && p.bz.dan) return p.bz.dan; return (dsave.mem = dsave.mem || { r: 0, best: 0, strikes: 0, tries: 0, passes: 0 }); };
  const commit = () => { try { if (ND.save) ND.save.commit(); } catch (e) { /* yok */ } };
  const dan = {
    TABLE: DAN, MAX: DAN_MAX,
    rank() { return clamp(dsave().r | 0, 0, DAN_MAX); },
    best() { return clamp(Math.max(dsave().best | 0, this.rank()), 0, DAN_MAX); },
    strikes() { return dsave().strikes | 0; },
    canDemote(r = this.rank()) { return r >= DEMOTE_FROM; },
    trial(r = this.rank() + 1) { return DAN[r] || null; },
    name(r) { const t = T(); return t.rank ? t.rank(r) : String(r); },
    short(r) { return LB() ? LB().danShort(r) : ''; },
    // Sınav sonucu: kazandıysa terfi, kaybettiyse (2. Dan+) hak düşer → 3'te bir basamak iner
    result(passed, sum) {
      const d = dsave(), r0 = this.rank();
      d.tries = (d.tries | 0) + 1;
      let change = 0;
      if (passed && r0 < DAN_MAX) { d.r = r0 + 1; d.best = Math.max(d.best | 0, d.r); d.strikes = 0; d.passes = (d.passes | 0) + 1; change = 1; }
      else if (!passed && this.canDemote(r0)) { d.strikes = (d.strikes | 0) + 1; if (d.strikes >= STRIKES) { d.r = r0 - 1; d.strikes = 0; change = -1; } }
      commit();
      if (change && LB()) LB().setDan(d.r, sum);
      return { from: r0, to: d.r, change, strikes: d.strikes | 0 };
    },
  };

  // ================================================================ AYLIK TURNUVA: tohumlu merdiven
  const TOUR = ND.TOURNEY = { fights: 8, clear: 15000, stage: 1000, levels: [0, 1, 1, 1, 2, 2, 2, 3] };
  const BOSS = 'shura', BOSS_ARENA = 'castle';
  // Aynı ay anahtarı + aynı kadro → herkes için aynı merdiven (Math.random kullanılmaz)
  function gen(key) {
    const rng = mulberry32(hash32('nd-tourney-v1|' + key));
    const pick = (arr) => arr[Math.floor(rng() * arr.length) % arr.length];
    const pool = ND.CHARS.filter((c) => !c.hidden && !c.boss).map((c) => c.id).sort();
    const arenas = ND.ARENAS.map((a) => a.id).sort();
    const hasBoss = ND.CHARS.some((c) => c.id === BOSS);
    const order = pool.slice();
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    // arenalar: patron arenası (Kale Çatısı) yalnız patron dövüşüne saklı; diğerleri tohumlu sırayla, arka arkaya tekrar yok
    const arOrder = arenas.filter((a) => a !== BOSS_ARENA || arenas.length === 1);
    for (let i = arOrder.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arOrder[i], arOrder[j]] = [arOrder[j], arOrder[i]]; }
    const bag = []; MOD_IDS.forEach((id) => { for (let k = 0; k < MODS[id].w; k++) bag.push(id); });
    const fights = [];
    let mirrorUsed = false; // ayna merdivende en çok bir kez
    for (let i = 0; i < TOUR.fights; i++) {
      const last = i === TOUR.fights - 1;
      const boss = last && hasBoss && rng() < 0.5;
      let level = TOUR.levels[i];
      if (i >= 1 && i <= 5 && rng() < 0.3) level = Math.min(3, level + 1);
      const arena = boss && arenas.includes(BOSS_ARENA) ? BOSS_ARENA : arOrder[i % arOrder.length];
      const n = i === 0 ? 1 : rng() < 0.45 ? 2 : 1, mods = [];
      for (let guard = 0; mods.length < n && guard < 40; guard++) {
        const id = pick(bag);
        if (mods.includes(id) || (id === 'mirror' && (boss || mirrorUsed)) || (i === 0 && (id === 'sudden' || id === 'glass'))) continue;
        mods.push(id);
      }
      mods.sort((a, b) => MOD_IDS.indexOf(a) - MOD_IDS.indexOf(b));
      if (mods.includes('mirror')) mirrorUsed = true;
      const opp = boss ? BOSS : mods.includes('mirror') ? 'mirror' : order[i % Math.max(1, order.length)];
      fights.push({ opp, level: boss ? 3 : level, arena, mods, boss });
    }
    return { key, fights, hash: hex8(hash32(JSON.stringify(fights))) };
  }
  const weekNow = () => (LB() ? LB().week() : null);
  const tsave = () => { const p = ND.save && ND.save.p; if (p && p.bz && p.bz.t) return p.bz.t; return (tsave.mem = tsave.mem || {}); };
  const myWeek = (key) => tsave()[key] || null;

  // ================================================================ KOŞU DENETLEYİCİSİ (turnuva + Dan ortak)
  const charIdx = (id, def) => { const i = ND.CHARS.findIndex((c) => c.id === id); return i >= 0 ? i : def; };
  const nice = (n) => n[0] + n.slice(1).toLowerCase();
  function makeRunner(mode) {
    const C = {
      mode, run: null, G: null, noRestart: true,
      // oyun kancaları
      hudTags() {
        const R = this.run, F = R && R.fights[R.i], H = (ND.STR && ND.STR.hud) || {};
        if (!F) return [tx(H.you || 'SEN'), H.cpu || 'CPU'];
        const lv = upper((ND.AI_LEVELS[F.level] || ND.AI_LEVELS[1]).name);
        return [tx(H.you || 'SEN') + ' · ' + (R.i + 1) + '/' + R.fights.length, F.boss ? H.boss || '' : (H.cpu || 'CPU') + ' · ' + lv];
      },
      tick(rdt) {
        const R = this.run, G = this.G;
        if (!R || !R.cur || G.mode !== mode) return;
        if (G.phase === 'intro' || G.phase === 'fight' || G.phase === 'ko' || G.phase === 'timeup') { R.time += rdt; R.cur.t += rdt; }
      },
      onRoundEnd(w) { const R = this.run; if (!R) return; R.rounds++; if (w === this.G.F[0]) R.rw++; },
      fight() {
        const R = this.run; if (!R) return;
        const F = R.fights[R.i];
        $('vs').hidden = true;
        R.cur = { t: 0 };
        au().gong();
        this.G.start(mode, { c1: R.me, c2: F.oppIdx, arena: F.arena, level: F.level, mods: F.mods, oppHp: F.hp || null });
      },
      retry() { /* turnuva/Dan: maç yeniden başlatılamaz (deneme hakkı yok) */ },
      primary() {
        const R = this.run; if (!R) return this.G.goMenu();
        if (R.last === 'win' && R.i < R.fights.length - 1) { R.i++; this.openVs(); }
        else this.finish(R.last === 'win');
      },
      // Bitiş penceresindeki "çık": kazanılmış dövüş varsa sonucu kaydet ve göster
      quit() {
        const R = this.run;
        if (R && !R.shown && ((mode === 'tourney' && R.won > 0) || (mode === 'dan' && R.rec))) return this.finish(R.last === 'win' && R.i === R.fights.length - 1);
        if (R && !R.shown && mode === 'dan' && R.last === 'win') this.record(false); // sınavın ortasında çıkmak = başarısız
        this.leave();
      },
      // Duraklatma → ana menü: turnuvada kazanılanı sessizce kaydet; Dan sınavını yarıda bırakmak başarısız sayılır
      abandon() {
        const R = this.run;
        if (R && !R.shown && ((mode === 'tourney' && R.won > 0) || mode === 'dan')) this.finish(false, true);
        this.run = null; if (this.G.runner === this) this.G.runner = null;
      },
      leave() { this.run = null; if (this.G.runner === this) this.G.runner = null; ['vs', 'bzRes'].forEach((id) => { const e = $(id); if (e) e.hidden = true; }); this.G.goMenu(); },
      onMatchEnd(w, res) {
        const R = this.run, G = this.G; if (!R) return false;
        const F = R.fights[R.i], f1 = G.F[0], won = w === f1, S = T(), E = (ND.STR && ND.STR.end) || {};
        R.last = won ? 'win' : 'loss';
        R.hits += M.hits; R.lvl = Math.max(R.lvl, F.level);
        R.played = R.i + 1;
        if (won) {
          const pts = res ? res.total : 0;
          R.won++; R.pts[R.i] = pts;
          if (mode === 'tourney') R.score += pts + TOUR.stage; else R.score += pts;
          if (G.showScore) G.showScore(res, { note: mode === 'tourney' ? S.t.runNote(R.score, TOUR.stage) : S.d.runNote(R.i + 1, R.fights.length) });
          if (R.i === R.fights.length - 1) { setTimeout(() => this.finish(true), 900); return true; }
          $('endK').textContent = '勝利';
          $('endTitle').textContent = E.winTitle || '';
          $('endSub').textContent = (mode === 'tourney' ? S.t.head : S.d.head) + ' · ' + (E.winSub ? E.winSub(R.i + 1, R.fights.length, pts) : '');
          $('bRematch').textContent = E.next || '';
        } else {
          $('endK').textContent = '敗';
          $('endTitle').textContent = E.lossTitle || '';
          $('endSub').textContent = mode === 'tourney' ? S.t.lossSub(nice(ND.CHARS[F.oppIdx].name), R.won) : S.d.lossSub(nice(ND.CHARS[F.oppIdx].name));
          $('bRematch').textContent = S.seeResult || '';
          if (mode === 'dan') this.record(false);
          if (G.showScore) G.showScore(res, { lost: true, note: mode === 'tourney' ? S.t.lossNote(R.score) : S.d.lossNote });
        }
        $('bChange').hidden = true;
        $('bEndMenu').textContent = mode === 'tourney' ? S.t.quit : S.d.quit;
        return false;
      },
      onKey(e) {
        const G = this.G;
        if (G.phase === 'vs') {
          if ((e.code === 'Enter' || e.code === 'KeyF' || e.code === 'Space') && !e.repeat) { this.fight(); return true; }
          if (ND.input.isBack(e)) { this.quit(); return true; }
          return false;
        }
        if (G.phase === 'ending') return ui.resKey(e);
        return false;
      },
      onPad(st, prev) {
        const pr = (a) => st[a] && !prev[a], G = this.G;
        if (G.phase === 'vs') { if (pr('light') || pr('up')) this.fight(); else if (pr('kick')) this.quit(); }
        else if (G.phase === 'ending') { if (pr('light') || pr('up')) ui.resPrimary(); else if (pr('kick')) this.leave(); }
      },

      // VS ekranı (arcade'in #vs düzeni; değiştiriciler #vsMods'ta)
      openVs() {
        const R = this.run, G = this.G, F = R.fights[R.i], me = ND.CHARS[R.me], op = ND.CHARS[F.oppIdx], S = T();
        ND.scene.setTheme(F.arena);
        G.showStage('vs', ['vs1', 'vs2'], R.me, F.oppIdx);
        ND.music.setMode(F.boss || F.level >= 3 ? 'final' : 'menu');
        const vs = $('vs');
        vs.hidden = false; vs.classList.toggle('boss', !!F.boss);
        vs.classList.remove('in'); void vs.offsetWidth; vs.classList.add('in');
        const alt = R.me === F.oppIdx;
        const side = (n, ch, a) => {
          const col = ND.palOf(ch, a);
          $('vsk' + n).textContent = ch.kanji; $('vsk' + n).style.color = col.ui;
          $('vsn' + n).textContent = ch.name; $('vst' + n).textContent = ch.title + ' · ' + ch.weapon;
          $('vss' + n).style.setProperty('--sc', col.ui);
        };
        const look = ND.save && ND.save.look ? ND.save.look(me.id) : false; // Legacy / Champion colors
        side(1, me, look); side(2, op, alt && !look);
        const arena = ND.ARENAS.find((a) => a.id === F.arena);
        $('vsStage').textContent = (mode === 'tourney' ? S.t.head : S.d.trialOf(dan.name(R.target))) + ' · ' + S.fightOf(R.i + 1, R.fights.length);
        const ar = $('vsArena'); ar.textContent = '';
        if (arena) { add(ar, h('b', null, arena.kanji), arena.name); }
        $('vsLevel').textContent = (ND.AI_LEVELS[F.level] || ND.AI_LEVELS[1]).name + (F.hp && F.hp > 1 ? ' · ' + S.hpBonus(Math.round((F.hp - 1) * 100)) : '');
        $('vsKeys').innerHTML = ND.STR.pickT(ND.STR.vs.keys, '');
        $('vsQuit').textContent = mode === 'tourney' ? S.t.quit : S.d.quit;
        const lad = $('vsLadder'); lad.textContent = '';
        R.fights.forEach((f, k) => {
          const ch = ND.CHARS[f.oppIdx];
          const i = h('i', { class: (k < R.i ? 'done' : k === R.i ? 'cur' : '') + (f.boss ? ' boss' : ''), title: ch.name, style: '--sc:' + ((f.oppIdx === R.me ? ch.alt : ch.col).ui) }, ch.kanji);
          lad.appendChild(i);
        });
        const mb = $('vsMods');
        if (mb) { mb.textContent = ''; mb.hidden = !F.mods.length; F.mods.forEach((id) => mb.appendChild(ui.modChip(id, true))); }
        const tb = $('vsTalk'); tb.textContent = '';
        const lines = ND.arcade && ND.arcade.talk ? ND.arcade.talk(op.id, me.id, !!F.boss) : [];
        lines.forEach(([sd, id, text], k) => {
          const ch = ND.CHARS.find((c) => c.id === id); if (!ch) return;
          const col = sd === 'r' && alt && !look ? ch.alt.ui : sd === 'l' ? ND.palOf(ch, look).ui : ch.col.ui;
          tb.appendChild(h('p', { class: 'ln ' + sd, style: '--lc:' + col + ';animation-delay:' + (0.35 + k * 0.75) + 's' }, h('b', null, ch.name), h('span', null, text)));
        });
        setTimeout(() => { if (G.phase === 'vs') $('vsGo').focus(); }, 0);
      },
      // Koşunun sonucunu BİR KEZ kaydet (yerel rekor / Dan terfisi-hakkı); gösterimden ayrı
      record(cleared) {
        const R = this.run; if (!R) return null;
        if (R.rec) return R.rec;
        const me = ND.CHARS[R.me];
        const sum = { dur: R.time, fights: Math.max(1, R.played || R.i + 1), won: R.won, rounds: R.rounds, rw: R.rw, hits: R.hits, lvl: R.lvl, mh: R.gh || '', mode };
        if (mode === 'tourney') {
          const total = R.score + (cleared ? TOUR.clear : 0);
          const rec = tsave(), prev = rec[R.week];
          rec[R.week] = { best: Math.max(prev ? prev.best | 0 : 0, total), char: prev && prev.best >= total ? prev.char : me.id, att: (prev ? prev.att | 0 : 0) + 1, won: Math.max(prev ? prev.won | 0 : 0, R.won), date: Date.now() };
          R.newBest = !prev || total > (prev.best | 0);
          commit();
          R.rec = { cleared: !!cleared, total, entry: { score: total, char: me.id, time: Math.round(R.time), date: Date.now(), sum } };
          // Onur (honor.js): turnuvayı bitirme bonusu
          if (cleared && ND.honor && ND.HONOR) ND.honor.bonus('tourneyClear', ND.HONOR.tourneyClear);
        } else {
          R.rec = { cleared: !!cleared, out: dan.result(!!cleared, sum) };
          // Onur: geçilen Dan sınavı (yeni rütbeye göre)
          if (R.rec.out.change > 0 && ND.honor && ND.HONOR) ND.honor.bonus('danPass', ND.HONOR.danPass(R.rec.out.to));
        }
        return R.rec;
      },
      // Koşu sonucu ekranı (sessiz: duraklatmadan menüye dönerken; gösterim yok)
      finish(cleared, silent) {
        const R = this.run; if (!R || R.shown) return;
        const o = this.record(cleared);
        if (silent) {
          if (mode === 'tourney' && o.total > 0 && LB()) { LB().submit(LB().weeklyBoard(R.week), o.entry); if (ND.toast) ND.toast(T().t.savedToast(fmtNum(o.total)), '月'); }
          if (mode === 'dan' && ND.toast) ND.toast(T().d.leftToast, '段');
          this.run = null; return;
        }
        R.shown = true; R.done = true;
        ui.showResult(this, o);
      },
    };
    return C;
  }

  const tourney = makeRunner('tourney');
  tourney.begin = function (ci) {
    const W = weekNow(), T0 = gen(W.key), me = ND.CHARS[ci];
    const fights = T0.fights.map((f) => Object.assign({}, f, { oppIdx: f.opp === 'mirror' ? ci : charIdx(f.opp, (ci + 1) % ND.CHARS.length) }));
    this.run = { kind: 'tourney', week: W.key, gh: T0.hash, me: ci, fights, i: 0, time: 0, score: 0, won: 0, rounds: 0, rw: 0, hits: 0, lvl: 0, pts: [], cur: null, last: null, done: false };
    this.G.runner = this;
    void me;
    this.openVs();
  };
  const danRun = makeRunner('dan');
  danRun.begin = function (ci) {
    const target = dan.rank() + 1, tr = DAN[target];
    if (!tr) return this.G.goMenu();
    const pool = ND.CHARS.map((c, i) => i).filter((i) => !ND.CHARS[i].hidden && !ND.CHARS[i].boss && i !== ci);
    const arenas = ND.ARENAS.filter((a) => a.id !== BOSS_ARENA).map((a) => a.id);
    const used = new Set();
    const fights = tr.f.map((lv, k) => {
      const last = k === tr.f.length - 1;
      if (last && tr.boss && ND.CHARS.some((c) => c.id === BOSS)) return { oppIdx: charIdx(BOSS, 0), level: 3, arena: ND.ARENAS.some((a) => a.id === BOSS_ARENA) ? BOSS_ARENA : arenas[0], mods: (tr.mods || []).slice(), boss: true, hp: tr.hp || null };
      let oi = pool.length ? pool[(Math.random() * pool.length) | 0] : (ci + 1) % ND.CHARS.length;
      for (let g = 0; g < 8 && used.has(oi) && pool.length > tr.f.length; g++) oi = pool[(Math.random() * pool.length) | 0];
      used.add(oi);
      return { oppIdx: oi, level: lv, arena: arenas[(Math.random() * arenas.length) | 0] || 'temple', mods: (tr.mods || []).slice(), boss: false, hp: tr.hp || null };
    });
    this.run = { kind: 'dan', target, me: ci, fights, i: 0, time: 0, score: 0, won: 0, rounds: 0, rw: 0, hits: 0, lvl: 0, pts: [], cur: null, last: null, done: false, gh: '' };
    this.G.runner = this;
    this.openVs();
  };

  // ================================================================ ARAYÜZ
  const TICK_MS = 1000;
  const ui = {
    open: null, // 'lobby-tourney' | 'lobby-dan' | 'hall' | null
    tab: 'week', charSel: null, tok: 0, timer: 0, resCtl: null, back: null,

    modChip(id, full) {
      const S = T(), m = MODS[id], d = (S.mods && S.mods[id]) || { n: id, d: '' };
      return h('span', { class: 'bz-mod', title: d.d }, h('b', { 'aria-hidden': 'true' }, m ? m.k : '?'), h('span', null, d.n), full && d.d ? h('small', null, d.d) : null);
    },
    countdown(ms) { const S = T(); return S.left ? S.left(Math.max(0, ms)) : ''; },
    // '2026-09' → "September 2026" (the tournament period is a calendar month)
    weekLabel(key) { const S = T(), m = /^(\d{4})-(\d{2})$/.exec(key || ''); return m && S.weekName ? S.weekName(+m[2], +m[1]) : key; },
    // Title tag (Monthly Champion / Finalist) for a leaderboard row; null when the player has none
    titleTag(t) { return LB() && LB().titleEl ? LB().titleEl(t) : null; },

    // --- tam ekran katmanı aç/kapat (menü arkada gösteri maçı sürerken)
    showLayer(id, openKey, back) {
      const G = ND.game;
      ['bzLobby', 'bzRes', 'hall'].forEach((x) => { const e = $(x); if (e) e.hidden = x !== id; });
      $('menu').hidden = true;
      this.open = openKey; this.back = back || null;
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tickClock(), TICK_MS);
      void G;
    },
    closeLayer() {
      const was = this.open;
      clearInterval(this.timer); this.timer = 0;
      ['bzLobby', 'hall'].forEach((x) => { const e = $(x); if (e) e.hidden = true; });
      this.open = null;
      const b = this.back; this.back = null;
      au().ui();
      if (b) return b();
      const G = ND.game;
      if (G && G.mode === 'attract') { $('menu').hidden = false; ui.refreshMenu(); const f = was === 'hall' ? $(ui.hallFrom || 'mlb') : was === 'lobby-dan' ? $('mdan') : $('mtour'); setTimeout(() => f && f.focus(), 0); }
      else if (G) G.goMenu();
    },
    // game.hideOverlays çağırınca durum temizlensin
    onHidden() { if (this.open) { clearInterval(this.timer); this.timer = 0; this.open = null; this.back = null; } },
    tickClock() {
      document.querySelectorAll('[data-bz-clock]').forEach((e) => {
        const W = weekNow(); if (!W) return;
        e.textContent = this.countdown(W.end - LB().now());
      });
      // hafta döndüyse açık lobi/salonu yenile
      const W = weekNow();
      if (W && this._wk && W.key !== this._wk) { this._wk = W.key; if (this.open === 'lobby-tourney') this.lobbyTourney(); else if (this.open === 'hall') this.renderHall(); }
    },

    // ---------------------------------------------------- TURNUVA LOBİSİ
    lobbyTourney(back, again) {
      const S = T(), W = weekNow(), TG = gen(W.key), box = $('bzLobbyIn');
      this._wk = W.key;
      if (this.open !== 'lobby-tourney') this.showLayer('bzLobby', 'lobby-tourney', back);
      box.textContent = '';
      const rec = myWeek(W.key);
      const head = h('header', { class: 'bz-head' },
        h('b', { class: 'bz-k', 'aria-hidden': 'true' }, '月'),
        h('div', { class: 'bz-tt' },
          h('p', { class: 'title', id: 'bzLobbyTitle' }, S.t.title),
          h('small', null, this.weekLabel(W.key), ' · ', S.resetIn, ' ', h('b', { 'data-bz-clock': '' }, this.countdown(W.end - LB().now())))),
        h('button', { class: 'btn bz-close', type: 'button', on: { click: () => this.closeLayer() } }, S.back));
      const me = h('p', { class: 'bz-me' }, rec ? S.t.myBest(fmtNum(rec.best), rec.att) : S.t.noTry);
      const st = LB().standing();
      if (rec && st && st.place) me.appendChild(h('b', null, ' · ' + S.t.place(st.place, st.total)));
      const list = h('ol', { class: 'bz-gaunt' });
      const lvName = (lv) => (ND.AI_LEVELS[lv] || ND.AI_LEVELS[1]).name;
      TG.fights.forEach((f, i) => {
        const ch = f.opp === 'mirror' ? null : ND.CHARS.find((c) => c.id === f.opp);
        const ar = ND.ARENAS.find((a) => a.id === f.arena);
        list.appendChild(h('li', { class: f.boss ? 'boss' : '' },
          h('span', { class: 'g-n' }, String(i + 1)),
          h('span', { class: 'g-o' },
            h('b', { style: ch ? 'color:' + ch.col.ui : '' }, ch ? ch.kanji : '鏡'),
            h('span', null, ch ? ch.name : S.mirrorOpp)),
          h('span', { class: 'g-a' }, ar ? h('b', null, ar.kanji) : null, ar ? ar.name : ''),
          h('span', { class: 'g-l' + (f.level >= 3 ? ' hot' : '') }, lvName(f.level)),
          h('span', { class: 'g-m' }, f.mods.map((id) => this.modChip(id, false)))));
      });
      const rules = h('p', { class: 'bz-rules' }, S.t.rules(TOUR.fights, fmtNum(TOUR.clear), fmtNum(TOUR.stage)));
      // what the top 3 win, only where titles can be earned; elsewhere a neutral line (scores stay on this device)
      const rewardText = S.ttl ? (LB().titlesEarnable?.() ? S.ttl.reward : S.ttl.local) : '';
      const reward = rewardText ? h('p', { class: 'bz-reward' }, rewardText) : null;
      const acts = h('div', { class: 'sel-actions' },
        h('button', { class: 'btn primary', type: 'button', id: 'bzGo', on: { click: () => { au().ui(); ND.game.openSelect('tourney'); } } }, rec ? S.t.again : S.t.start),
        h('button', { class: 'btn', type: 'button', on: { click: () => { au().ui(); this.showHall('week', () => this.lobbyTourney()); } } }, S.hall.title));
      add(box, head, me, list, rules, reward, acts);
      setTimeout(() => { const b = $('bzGo'); if (b && this.open === 'lobby-tourney') b.focus(); }, 0);
      // sıralamayı arka planda tazele → gelince BİR KEZ yeniden çiz (again = yeniden çizim; tekrar istek yok)
      if (!again && rec) LB().hall('week', W.key).then(() => { if (this.open === 'lobby-tourney') this.lobbyTourney(null, true); }, () => {});
    },

    // ---------------------------------------------------- DAN LOBİSİ
    lobbyDan(back) {
      const S = T(), box = $('bzLobbyIn'), r = dan.rank(), next = dan.trial(r + 1);
      if (this.open !== 'lobby-dan') this.showLayer('bzLobby', 'lobby-dan', back);
      box.textContent = '';
      const head = h('header', { class: 'bz-head' },
        h('b', { class: 'bz-k', 'aria-hidden': 'true' }, '段'),
        h('div', { class: 'bz-tt' }, h('p', { class: 'title', id: 'bzLobbyTitle' }, S.d.title), h('small', null, S.d.sub)),
        h('button', { class: 'btn bz-close', type: 'button', on: { click: () => this.closeLayer() } }, S.back));
      const cur = h('div', { class: 'dan-now' },
        h('b', { class: 'dan-badge' + (r > 10 ? ' dan' : r > 0 ? ' kyu' : '') }, r > 0 ? dan.short(r) : '無'),
        h('div', null, h('small', null, S.d.yourRank), h('p', { class: 'title' }, dan.name(r)),
          dan.best() > r ? h('small', null, S.d.bestWas(dan.name(dan.best()))) : null));
      const lad = h('ol', { class: 'dan-ladder', 'aria-label': S.d.ladder });
      for (let k = 1; k <= DAN_MAX; k++) lad.appendChild(h('li', { class: (k <= r ? 'ok' : '') + (k === r + 1 ? ' next' : '') + (k > 10 ? ' d' : ''), title: dan.name(k) }, dan.short(k)));
      const card = h('div', { class: 'dan-trial card' });
      if (next) {
        const lv = next.f.map((l) => (ND.AI_LEVELS[l] || ND.AI_LEVELS[1]).name);
        add(card, h('h3', null, S.d.nextTrial(dan.name(r + 1))),
          h('p', null, S.d.fights(next.f.length), ' · ', lv.join(' → ')),
          next.hp ? h('p', null, S.hpBonus(Math.round((next.hp - 1) * 100))) : null,
          next.boss ? h('p', { class: 'hot' }, S.d.bossLast) : null,
          next.mods && next.mods.length ? h('p', { class: 'mods' }, next.mods.map((id) => this.modChip(id, true))) : null,
          dan.canDemote(r) ? h('p', { class: 'strk' }, S.d.strikes(STRIKES - dan.strikes(), STRIKES)) : h('p', { class: 'strk ok' }, S.d.safe));
      } else add(card, h('h3', null, S.d.maxed), h('p', null, S.d.maxedSub));
      const acts = h('div', { class: 'sel-actions' },
        h('button', { class: 'btn primary', type: 'button', id: 'bzGo', disabled: !next, on: { click: () => { if (!next) return; au().ui(); ND.game.openSelect('dan'); } } }, S.d.start),
        h('button', { class: 'btn', type: 'button', on: { click: () => { au().ui(); this.showHall('dan', () => this.lobbyDan()); } } }, S.hall.title));
      add(box, head, h('div', { class: 'dan-grid' }, h('div', null, cur, lad), card), acts);
      setTimeout(() => { const b = $('bzGo'); if (b && this.open === 'lobby-dan') b.focus(); }, 0);
    },

    // ---------------------------------------------------- SONUÇ EKRANI (turnuva / Dan)
    showResult(ctl, o) {
      const S = T(), G = ND.game, R = ctl.run, me = ND.CHARS[R.me];
      this.resCtl = ctl;
      $('end').hidden = true;
      G.showStage('ending', [null, null], R.me, null);
      ND.music.setMode('menu');
      const box = $('bzResIn'); box.textContent = '';
      const stats = h('div', { class: 'ed-stats' });
      const cell = (l, v, cls) => stats.appendChild(h('div', { class: cls || '' }, h('small', null, l), h('b', null, v)));
      let k, title, sub, lbBox = null;
      if (ctl.mode === 'tourney') {
        k = o.cleared ? '制覇' : '敗';
        if (o.cleared && ND.portal) ND.portal.happyTime();
        title = o.cleared ? S.t.clearTitle : S.t.overTitle;
        sub = this.weekLabel(R.week) + ' · ' + me.name;
        cell(S.rows.fights, R.won + ' / ' + R.fights.length);
        cell(S.rows.time, fmtTime(R.time));
        cell(S.rows.fightPts, fmtNum(R.pts.reduce((a, b) => a + (b || 0), 0)));
        cell(S.rows.stage, '+' + fmtNum(R.won * TOUR.stage));
        if (o.cleared) cell(S.rows.clear, '+' + fmtNum(TOUR.clear));
        const tot = h('div', { class: 'sc' }, h('small', null, S.rows.total), h('b', null, fmtNum(o.total)));
        if (R.newBest) tot.appendChild(h('em', null, S.newBest));
        stats.appendChild(tot);
        const rec = myWeek(R.week);
        cell(S.rows.weekBest, fmtNum(rec ? rec.best : o.total));
        lbBox = h('div', { class: 'lbp', 'aria-live': 'polite' });
      } else {
        const out = o.out;
        k = out.change > 0 ? '昇段' : out.change < 0 ? '降段' : o.cleared ? '段' : '敗';
        title = out.change > 0 ? S.d.promoted(dan.name(out.to)) : out.change < 0 ? S.d.demoted(dan.name(out.to)) : S.d.failed;
        sub = out.change > 0 ? S.d.promotedSub(dan.name(out.from), dan.name(out.to)) : out.change < 0 ? S.d.demotedSub : dan.canDemote(out.to) ? S.d.strikes(STRIKES - out.strikes, STRIKES) : S.d.tryAgain;
        cell(S.rows.fights, R.won + ' / ' + R.fights.length);
        cell(S.rows.time, fmtTime(R.time));
        cell(S.rows.fightPts, fmtNum(R.score));
        const rk = h('div', { class: 'sc' }, h('small', null, S.d.yourRank), h('b', null, dan.name(out.to)));
        stats.appendChild(rk);
        if (out.change > 0) { au().taiko(1.1); if (ND.portal) ND.portal.happyTime(); if (ND.toast) setTimeout(() => ND.toast(S.d.toast(dan.name(out.to)), '段'), 400); }
      }
      const btns = h('div', { class: 'ed-btns' },
        h('button', { class: 'btn primary', type: 'button', id: 'bzResAgain', on: { click: () => this.resPrimary() } }, ctl.mode === 'tourney' ? S.t.again : dan.trial() ? S.d.next : S.back),
        h('button', { class: 'btn', type: 'button', on: { click: () => { const m = ctl.mode; ctl.run = null; G.runner = null; this.showHall(m === 'tourney' ? 'week' : 'dan', null); } } }, S.hall.title),
        h('button', { class: 'btn', type: 'button', id: 'bzResMenu', on: { click: () => ctl.leave() } }, S.toMenu));
      add(box,
        h('div', { class: 'bz-res-head' }, h('b', { class: 'bz-res-k' + (k.length > 1 ? ' two' : '') }, k), h('div', null, h('h2', null, ctl.mode === 'tourney' ? S.t.title : S.d.title), h('p', { class: 'title' }, title), h('p', { class: 'sub' }, sub))),
        stats, lbBox, btns);
      const el = $('bzRes'); el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
      if (lbBox && ND.lbUI && o.entry) {
        ND.lbUI.panel(lbBox, LB().weeklyBoard(R.week), o.entry, {
          noOpen: true, // salon düğmesi zaten aşağıda
          open: () => { ctl.run = null; G.runner = null; this.showHall('week', null); },
          onResult: () => ui.refreshMenu(),
        });
      }
      ui.refreshMenu();
      setTimeout(() => { const b = $('bzResAgain'); if (b && G.phase === 'ending') b.focus(); }, 0);
    },
    resPrimary() {
      const ctl = this.resCtl; if (!ctl) return;
      const m = ctl.mode; ctl.run = null; if (ND.game.runner === ctl) ND.game.runner = null;
      $('bzRes').hidden = true;
      if (m === 'dan' && !dan.trial()) return ND.game.goMenu();
      ND.game.openSelect(m);
    },
    resKey(e) {
      if (e.repeat) return false;
      if (ND.input.isBack(e)) { if (this.resCtl) this.resCtl.leave(); return true; }
      if (e.code === 'Enter' && document.activeElement === document.body) { this.resPrimary(); return true; }
      return false;
    },

    // ---------------------------------------------------- ŞAMPİYONLAR SALONU
    TABS: ['week', 'alltime', 'archive', 'chars', 'dan'],
    showHall(tab, back) {
      const S = T();
      if (ND.game && ND.game.phase === 'ending') { $('bzRes').hidden = true; ND.game.start('attract'); } // sonuçtan geliyorsa arka planı menüye çevir
      this.showLayer('hall', 'hall', back);
      if (tab) this.tab = tab;
      this.charSel = null;
      this._wk = weekNow().key;
      const box = $('hallIn'); box.textContent = '';
      const tabs = h('div', { class: 'hall-tabs', role: 'tablist', id: 'hallTabs' });
      for (const t of this.TABS) {
        const d = S.hall.tabs[t];
        tabs.appendChild(h('button', { type: 'button', class: 'hall-tab', role: 'tab', 'data-t': t, on: { click: () => { au().ui(); this.selectTab(t); } } },
          h('b', { 'aria-hidden': 'true' }, d.k), h('span', null, d.n)));
      }
      add(box,
        h('header', { class: 'hall-head' },
          h('b', { class: 'hall-k', 'aria-hidden': 'true' }, '殿堂'),
          h('div', { class: 'hall-tt' }, h('p', { class: 'title', id: 'hallTitle' }, S.hall.title), h('small', { class: 'lb-st', id: 'hallSt' })),
          h('button', { class: 'btn bz-close', type: 'button', id: 'hallClose', on: { click: () => this.closeLayer() } }, S.back)),
        tabs,
        h('div', { class: 'hall-body', id: 'hallBody', tabindex: '-1' }),
        h('div', { class: 'hall-me', id: 'hallMe', hidden: true }),
        h('footer', { class: 'hall-foot', id: 'hallFoot' }));
      this.selectTab(this.tab);
      // sunucu saatini / bağlantıyı tazele, sonra yeniden yükle
      LB().refresh().then(() => { if (this.open === 'hall') { LB().hallClear(); this.renderHall(); } });
      setTimeout(() => { const t = document.querySelector('#hallTabs [aria-selected="true"]'); if (t && this.open === 'hall') t.focus(); }, 0);
    },
    selectTab(t) {
      this.tab = t; this.charSel = null;
      document.querySelectorAll('#hallTabs [data-t]').forEach((b) => { const on = b.dataset.t === t; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
      this.renderHall();
    },
    renderFoot() {
      const S = T(), f = $('hallFoot'); if (!f) return;
      const st = $('hallSt'); if (st) { st.textContent = LB().statusText(); st.dataset.st = LB().statusKey(); }
      if (f.querySelector('form.nick') && !LB().nameLocked) return;
      f.textContent = '';
      if ((LB().nameLocked || LB().adapter.needsName) && ND.lbUI) f.appendChild(ND.lbUI.nickLine(() => { LB().hallClear(); this.renderHall(); }));
      const pend = LB().pending();
      if (pend) f.appendChild(h('small', { class: 'hall-pend' }, S.hall.pending(pend)));
      f.appendChild(h('button', { type: 'button', class: 'mini', on: { click: () => this.openClassic() } }, S.hall.classic));
    },
    openClassic() {
      if (!ND.lbUI) return;
      const tab = this.tab;
      clearInterval(this.timer); this.timer = 0; $('hall').hidden = true; this.open = null;
      const back = this.back;
      ND.lbUI.show(null, { back: () => this.showHall(tab, back) });
    },
    async renderHall() {
      const S = T(), body = $('hallBody'), meBox = $('hallMe'); if (!body) return;
      const tok = ++this.tok, W = weekNow();
      body.textContent = ''; meBox.hidden = true; meBox.textContent = '';
      body.setAttribute('aria-busy', 'true');
      const loading = h('p', { class: 'lb-empty' }, S.hall.loading);
      // sekme başlığı
      if (this.tab === 'week') body.appendChild(h('div', { class: 'hall-sub' }, h('b', null, this.weekLabel(W.key)), h('span', null, S.resetIn, ' ', h('b', { 'data-bz-clock': '' }, this.countdown(W.end - LB().now())))));
      else if (S.hall.desc[this.tab]) body.appendChild(h('p', { class: 'hall-sub' }, S.hall.desc[this.tab]));
      // what the top 3 win (This Month and Champions tabs)
      if ((this.tab === 'week' || this.tab === 'archive') && S.ttl && S.ttl.hall && LB().titlesEarnable?.()) body.appendChild(h('p', { class: 'hall-reward' }, S.ttl.hall));
      body.appendChild(loading);
      this.renderFoot();
      let data;
      try {
        if (this.tab === 'chars' && this.charSel) data = await LB().hall('char', this.charSel);
        else data = await LB().hall(this.tab === 'week' ? 'week' : this.tab, this.tab === 'week' ? W.key : null);
      } catch (e) {
        if (tok !== this.tok || this.open !== 'hall') return;
        loading.textContent = S.hall.error;
        body.appendChild(h('button', { type: 'button', class: 'mini', on: { click: () => { LB().hallClear(); this.renderHall(); } } }, S.hall.retry));
        body.removeAttribute('aria-busy');
        return;
      }
      if (tok !== this.tok || this.open !== 'hall') return;
      loading.remove(); body.removeAttribute('aria-busy');
      if (this.tab === 'archive') return this.renderArchive(body, data);
      if (this.tab === 'chars' && !this.charSel) return this.renderChars(body, data);
      if (this.tab === 'chars') body.appendChild(this.charHeader());
      const rows = (data && data.rows) || [];
      if (!rows.length) {
        body.appendChild(h('p', { class: 'lb-empty' }, this.tab === 'dan' ? S.hall.emptyDan : S.hall.empty));
        if (this.tab === 'week') body.appendChild(h('button', { type: 'button', class: 'btn primary hall-cta', on: { click: () => this.lobbyTourney() } }, S.t.start));
      }
      const list = h('ol', { class: 'hall-list' + (this.tab === 'dan' ? ' dan' : '') });
      rows.forEach((r, i) => list.appendChild(this.hallRow(r, r.rank || i + 1)));
      body.appendChild(list);
      this.renderMe(meBox, data && data.me, rows);
      this.renderFoot();
    },
    hallRow(r, place) {
      const S = T(), dn = this.tab === 'dan';
      const li = h('li', { class: 'hr' + (r.me ? ' me' : '') + (place <= 3 ? ' p' + place : '') });
      li.appendChild(h('span', { class: 'hr-pl' }, place <= 3 ? ['壱', '弐', '参'][place - 1] : String(place)));
      const nm = h('span', { class: 'hr-nm' }, h('span', { class: 'n' }, r.name || (r.me ? LB().getName() || S.you : S.hall.anon)));
      const ds = LB().danShort(r.me && !dn ? (r.dan || dan.rank()) : r.dan);
      if (ds && !dn) nm.appendChild(h('em', { class: 'dn' }, ds));
      const tt = this.titleTag(r.title); if (tt) nm.appendChild(tt);
      if (r.me) nm.appendChild(h('i', null, S.youTag));
      if (this.tab === 'alltime' && r.week) nm.appendChild(h('small', null, this.weekLabel(LB().weekKeyOf(r.week))));
      li.appendChild(nm);
      if (dn) {
        li.appendChild(h('span', { class: 'hr-dan' }, h('b', { class: 'dan-badge' + (r.score > 10 ? ' dan' : ' kyu') }, LB().danShort(r.score)), h('small', null, dan.name(r.score))));
      } else {
        const ch = ND.CHARS.find((c) => c.id === r.char);
        li.appendChild(h('span', { class: 'hr-ck', title: ch ? ch.name : '', style: ch ? 'color:' + ch.col.ui : '' }, ch ? ch.kanji : '·'));
        li.appendChild(h('span', { class: 'hr-sc' }, fmtNum(r.score)));
      }
      return li;
    },
    renderMe(box, me, rows) {
      const S = T();
      box.textContent = '';
      const inTop = rows.some((r) => r.me);
      let txt = null;
      if (me && me.place) {
        if (this.tab === 'dan') txt = S.hall.meDan(me.place, dan.name(me.score || dan.best()));
        else txt = me.place <= 10 ? S.hall.meTop(me.place, fmtNum(me.score)) : S.hall.meGap(me.place, fmtNum(me.gap || 0), fmtNum(me.score));
      } else if (this.tab === 'week') txt = S.hall.meNone;
      else if (this.tab === 'dan') txt = dan.best() ? S.hall.meDanLocal(dan.name(dan.best())) : S.hall.meNoDan;
      if (!txt) return;
      box.appendChild(h('span', { class: 'hm-t' }, txt));
      if (this.tab === 'week' && (!me || !me.place || me.place > 10)) box.appendChild(h('button', { type: 'button', class: 'mini', on: { click: () => { au().ui(); this.lobbyTourney(); } } }, S.t.go));
      if (this.tab === 'dan' && dan.trial()) box.appendChild(h('button', { type: 'button', class: 'mini', on: { click: () => { au().ui(); this.lobbyDan(); } } }, S.d.go));
      box.hidden = false;
      box.classList.toggle('top', !!(me && me.place && me.place <= 10) || inTop);
    },
    renderArchive(body, data) {
      const S = T(), weeks = (data && data.weeks) || [];
      if (!weeks.length) { body.appendChild(h('p', { class: 'lb-empty' }, LB().titlesEarnable?.() ? S.hall.emptyArchive : S.hall.emptyArchiveLocal || S.hall.emptyArchive)); return; }
      const grid = h('div', { class: 'plq-grid' });
      for (const w of weeks) {
        const m = /^(\d{4})-(\d{2})$/.exec(w.key) || [];
        const ol = h('ol', null);
        w.rows.forEach((r, i) => {
          const ch = ND.CHARS.find((c) => c.id === r.char);
          ol.appendChild(h('li', { class: (i < 3 ? 'p' + (i + 1) : '') + (r.me ? ' me' : '') },
            h('span', { class: 'pl' }, i < 3 ? ['壱', '弐', '参'][i] : String(i + 1)),
            h('span', { class: 'n' }, r.name || S.hall.anon, LB().danShort(r.dan) ? h('em', { class: 'dn' }, LB().danShort(r.dan)) : null, this.titleTag(r.title)),
            h('span', { class: 'c', style: ch ? 'color:' + ch.col.ui : '' }, ch ? ch.kanji : ''),
            h('span', { class: 's' }, fmtNum(r.score))));
        });
        grid.appendChild(h('article', { class: 'plq' },
          h('header', null, h('b', null, m[2] && S.monthName ? S.monthName(+m[2]) : '?'), h('span', null, m[1] || '')),
          ol));
      }
      body.appendChild(grid);
    },
    renderChars(body, data) {
      const S = T(), best = {};
      ((data && data.rows) || []).forEach((r) => { if (r.char && !best[r.char]) best[r.char] = r; });
      const grid = h('div', { class: 'cc-grid' });
      for (const ch of ND.CHARS.filter((c) => !c.hidden || (ND.save && ND.save.isCharUnlocked(c.id)))) {
        const r = best[ch.id];
        grid.appendChild(h('button', { type: 'button', class: 'cc' + (r && r.me ? ' me' : ''), style: '--sc:' + ch.col.ui, on: { click: () => { au().ui(); this.charSel = ch.id; this.renderHall(); } } },
          h('b', { class: 'cc-k' }, ch.kanji),
          h('span', { class: 'cc-n' }, ch.name),
          r ? h('span', { class: 'cc-w' }, h('span', null, r.name || S.hall.anon), h('b', null, fmtNum(r.score))) : h('span', { class: 'cc-w none' }, S.hall.noRecord)));
      }
      body.appendChild(grid);
    },
    charHeader() {
      const S = T(), ch = ND.CHARS.find((c) => c.id === this.charSel);
      return h('div', { class: 'hall-sub cc-head' },
        h('button', { type: 'button', class: 'mini', on: { click: () => { au().ui(); this.charSel = null; this.renderHall(); } } }, '◀ ', S.hall.allNinjas),
        ch ? h('b', { style: 'color:' + ch.col.ui }, ch.kanji, ' ', ch.name) : null);
    },
    cycleTab(d) { const i = this.TABS.indexOf(this.tab); this.selectTab(this.TABS[(i + d + this.TABS.length) % this.TABS.length]); au().ui(); const t = document.querySelector('#hallTabs [aria-selected="true"]'); if (t) t.focus(); },

    // ---------------------------------------------------- klavye / gamepad (game.js input.onKey'den önce)
    onKey(e) {
      if (!this.open) return false;
      const ae = document.activeElement;
      if (ae && ae.tagName === 'INPUT') return false;
      if (e.repeat && (e.code === 'Escape' || e.code === 'Backspace')) return true;
      if (ND.input.isBack(e)) { this.closeLayer(); return true; }
      if (this.open === 'hall') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.cycleTab(-1); return true; }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.cycleTab(1); return true; }
        if (e.code === 'PageDown') { $('hallBody').scrollBy(0, 200); return true; }
        if (e.code === 'PageUp') { $('hallBody').scrollBy(0, -200); return true; }
      }
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') {
        if (ae && ae !== document.body && typeof ae.click === 'function') { ae.click(); return true; }
        const go = $('bzGo'); if (go && this.open !== 'hall') { go.click(); return true; }
        return true;
      }
      return false;
    },
    onPad(st, prev) {
      if (!this.open) return false;
      const pr = (a) => st[a] && !prev[a];
      if (this.open === 'hall') { if (pr('left')) this.cycleTab(-1); else if (pr('right')) this.cycleTab(1); }
      else if (pr('light') || pr('up')) { const go = $('bzGo'); if (go) go.click(); }
      if (pr('kick')) this.closeLayer();
      return true;
    },

    // ---------------------------------------------------- MENÜ: "Bu ay: #12 · sıfırlanmaya 3g 4s"
    // ---------------------------------------------------- MAIN MENU: HALL OF CHAMPIONS CARD (index.html #mlb)
    // The card lists this month's top 10 itself: #1 large in gold (title, ninja, score), #2-#10 as compact rows; the
    // CSS shows 10 / 5 / 3 places by screen height. The places are always drawn — empty ones as "—" with a short
    // "be the first" hint on #1 — so an empty month still reads as a board. Board: the tournament board from the
    // leaderboard adapter: the live board when online (guests, and signed-in CrazyGames players who can read it; for
    // them a line says their own scores stay on this device), this device's board otherwise (Poki, offline, local),
    // labelled so. Never blocks the menu: the last result is drawn at once and a fetch runs at most every 60 s while
    // the menu is shown. After a month ends (live board) a small line names last month's champion. Names are
    // user-made: textContent only, cleaned (markup / control characters, 20 characters at most) and passed through
    // the nickname word filter (leaderboard.js shownName). Clicking opens the full hall (js/banzuke.js showHall).
    champ: { key: '', t: 0, data: null, last: null, busy: false },
    champCard(force) {
      const el = $('mlb'), L = LB();
      if (!el) return;
      if (!L) { el.hidden = true; return; }
      const W = weekNow(), key = L.mode + '|' + W.key, C = this.champ;
      if (C.key !== key) { C.key = key; C.t = 0; C.data = null; C.last = null; }
      this.renderChamp();
      if (C.busy || (!force && C.data && Date.now() - C.t < 60000)) return;
      C.busy = true; C.t = Date.now();
      const done = () => { C.busy = false; if (C.key === key) this.renderChamp(); };
      L.hall('week', W.key).then((d) => { if (C.key === key) C.data = d && Array.isArray(d.rows) ? d : { rows: [] }; },
        () => { if (C.key === key && !C.data) C.data = { rows: [] }; })
        .then(() => (L.online ? L.hall('archive', null).then((a) => {
          const prev = L.prevPeriod(W), w = a && a.weeks && a.weeks[0];
          if (C.key === key) C.last = w && prev && w.id === prev.id && w.rows && w.rows[0] ? w.rows[0] : null;
        }, () => {}) : null))
        .then(done, done);
    },
    renderChamp() {
      const S = T(), M = S.menu || {}, L = LB(), C = this.champ;
      const el = $('mlb'), lab = $('champLab'), top = $('champTop'), list = $('champList'), last = $('champLast');
      if (!el || !lab || !top || !list || !L) return;
      const live = !!L.online, rows = (C.data && C.data.rows) || [], title = (live ? M.champTitle : M.champLocal) || '';
      lab.textContent = title;
      el.setAttribute('aria-busy', String(!C.data));
      el.setAttribute('aria-label', [M.hall, title, M.champOpen].filter(Boolean).join(' · '));
      top.textContent = ''; list.textContent = '';
      const name = (r) => L.shownName(r.name) || (r.me ? L.shownName(L.getName()) || S.you : S.hall.anon);
      const r = rows[0];
      top.classList.toggle('empty', !r);
      if (!r) add(top, h('span', { class: 'ch-pl', 'aria-hidden': 'true' }, '壱'), h('b', { class: 'ch-n' }, '—'), h('span', { class: 'ch-hint' }, C.data ? M.champEmpty : M.champLoading));
      else {
        const ch = ND.CHARS.find((c) => c.id === r.char);
        add(top, h('span', { class: 'ch-pl', 'aria-hidden': 'true' }, '壱'), h('b', { class: 'ch-n' }, name(r)), this.titleTag(r.title),
          ch ? h('span', { class: 'ch-ck', title: ch.name, style: 'color:' + ch.col.ui }, ch.kanji) : null,
          r.me ? h('span', { class: 'ch-me' }, S.youTag) : null,
          h('span', { class: 'ch-sc' }, fmtNum(r.score)));
      }
      // places 2-10: filled rows, then "—" placeholders (always nine; the CSS hides the ones a short screen has no room for)
      for (let p = 2; p <= 10; p++) {
        const q = rows[p - 1];
        list.appendChild(q ? h('li', { class: q.me ? 'me' : null }, h('i', null, String(p)), h('b', null, name(q)), h('span', null, fmtNum(q.score)))
          : h('li', { class: 'empty' }, h('i', null, String(p)), h('b', null, '—'), h('span', null, '')));
      }
      if (last) {
        let txt = '';
        if (live && C.last && typeof M.champLast === 'function') txt = M.champLast(name(C.last));
        else if (live && L._viewOnly() && S.ttl && S.ttl.local) txt = S.ttl.local;
        last.hidden = !txt; last.textContent = txt;
      }
    },
    refreshMenu() {
      const S = T(); if (!S.t || !LB()) return;
      const W = weekNow(), ts = $('tourStat'), ds = $('danStat');
      if (ts) {
        const rec = myWeek(W.key), st = rec ? LB().standing() : null, left = this.countdown(W.end - LB().now());
        ts.textContent = rec ? (st && st.place ? S.menu.tourRank(st.place, left) : S.menu.tourBest(fmtNum(rec.best), left)) : S.menu.tourNew(left);
      }
      if (ds) { const r = dan.rank(); ds.textContent = r ? S.menu.danRank(dan.name(r), dan.trial() ? dan.name(r + 1) : null) : S.menu.danNew; }
      const tn = $('tNickT'); if (tn) { tn.textContent = S.menu.nick(LB().getName()); tn.parentNode.hidden = !LB().adapter.needsName; }
      this.champCard();
    },
  };

  // ================================================================ BAŞLAT
  const B = ND.banzuke = {
    MODS, gen, dan, tourney, danRun, ui, TOUR, hash32, mulberry32,
    init(G) {
      tourney.G = danRun.G = G;
      const card = (id, fn) => { const e = $(id); if (e) e.onclick = () => { au().ui(); fn(); }; };
      card('mtour', () => ui.lobbyTourney());
      card('mdan', () => ui.lobbyDan());
      // Hall of Champions card (this month's top 10 on the card): opens the full hall; refreshed while the menu is shown
      card('mlb', () => { ui.hallFrom = 'mlb'; ui.showHall('week', null); });
      const mc = $('mlb');
      if (mc) mc.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === mc) { e.preventDefault(); e.stopPropagation(); mc.click(); } };
      setInterval(() => { const G = ND.game, m = $('menu'); if (G && G.mode === 'attract' && m && !m.hidden && !document.hidden && !ui.open) ui.champCard(); }, 15000);
      // Ayarlar satırı: takma ad → salonun altındaki ad formu açık gelir
      card('tNick', () => { ui.hallFrom = 'tNick'; ui.showHall('week', null); setTimeout(() => { const b = document.querySelector('#hallFoot .nick-line .mini'); if (b) b.click(); }, 0); });
      if (LB()) LB().onChange(() => { if (!ui.open && ND.game && ND.game.mode === 'attract') ui.refreshMenu(); if (ui.open === 'hall') ui.renderFoot(); });
      // menü geri sayımı (dakika çözünürlüğü yeterli)
      setInterval(() => { if (!document.hidden && ND.game && ND.game.mode === 'attract' && !$('menu').hidden) ui.refreshMenu(); }, 30000);
      ui.refreshMenu();
    },
    // game.js'ten: açık katmanın tuşları / kolu
    onKey(e) { return ui.onKey(e); },
    onPad(st, prev) { return ui.onPad(st, prev); },
    onHidden() { ui.onHidden(); },
    // HUD / tablo için kısa rütbe etiketi ("3. KYU")
    rankTag() { const r = dan.rank(); return r ? upper(dan.name(r)) : ''; },
  };
})(window.ND);
