// Gölge Düellosu — oyun döngüsü, seçim ekranı, raund akışı, kilitlenme, ışık, tekrar, HUD
(function (ND) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const cv = $('cv'), ctx = cv.getContext('2d');
  const lc = document.createElement('canvas'), lctx = lc.getContext('2d');
  // Gölge silüeti tuvali + yardımcılar
  const shc = document.createElement('canvas'), shx = shc.getContext('2d'), SHA = [], SH_RES = 0.5;
  lc.width = lc.height = shc.width = shc.height = 64;
  // Tuvali gerekirse büyüt (64'ün katlarına; küçültme yok → her karede yeniden ayırma olmaz)
  function growCanvas(c, w, h) {
    if (c.width < w) c.width = Math.ceil(w / 64) * 64;
    if (c.height < h) c.height = Math.ceil(h / 64) * 64;
  }
  const bc = document.createElement('canvas'), bx = bc.getContext('2d'), bc2 = document.createElement('canvas'), b2 = bc2.getContext('2d');
  const HAS_FILTER = typeof ctx.filter === 'string';
  const grain = document.createElement('canvas'); grain.width = grain.height = 128;
  { const gx = grain.getContext('2d'), im = gx.createImageData(128, 128);
    for (let i = 0; i < im.data.length; i += 4) { const v = (Math.random() * 255) | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    gx.putImageData(im, 0, 0); }
  const grainPat = ctx.createPattern(grain, 'repeat');
  const input = ND.input, au = ND.audio, cam = ND.cam, fx = ND.fx, scene = ND.scene, mu = ND.music;
  ND.simClock = 0; // simulation clock (seconds of fixed steps); input buffers read it, see game.advance
  // Text that is not in ND.STR (fallbacks, composed banners) goes through the i18n phrase table
  const tx = (s) => (ND.i18n ? ND.i18n.t(s) : s);
  const upper = (s) => (ND.i18n ? ND.i18n.upper(s) : String(s).toUpperCase());
  const keyLabel = (code) => (input.keyLabel ? input.keyLabel(code) : code.replace(/^Key/, ''));
  const { rand, clamp } = ND.M;
  const ROUND_TIME = 60, KANJI = ['壱', '弐', '参'];

  const aiC1 = new ND.Ctrl(), aiC2 = new ND.Ctrl();
  aiC1.noTap = aiC2.noTap = true;
  const f1 = new ND.Fighter(0, input.p1), f2 = new ND.Fighter(1, input.p2);
  f1.opp = f2; f2.opp = f1;
  const F = [f1, f2], ORD = [f1, f2];
  const PM = ND.pm;

  // ---------------------------------------------------------------- ayarlar
  // Tüm kalıcılık ND.save (arcade.js) üzerinden; modül yoksa bellekte kalır
  const store = {
    get() { try { return ND.save ? ND.save.settings() : {}; } catch (e) { return {}; } },
    set(v) { try { if (ND.save) ND.save.saveSettings(v); } catch (e) { /* depolama yok */ } },
  };
  const saved = store.get();
  ND.settings.sound = saved.sound !== false;
  // Blood is opt-in (new key, so old saves that had it on by default start in ink mode) and portal-gated (core.js)
  ND.settings.blood = !!(ND.bloodAllowed && ND.bloodAllowed()) && saved.bloodOptIn === true;
  ND.settings.music = saved.music !== false;
  ND.settings.hints = saved.hints !== false;
  // Yüksek grafik: kullanıcı elle seçtiyse (hqUser) otomatik düşürme kalıcı kaydedilmez
  let hqUser = !!saved.hqUser, hqAutoOff = false;
  // Telefon/tablet: zayıf cihazda (≤4 GB bellek ya da ≤4 çekirdek) kullanıcı seçmediyse düşük grafikle başla
  const TCH = ND.touch || {}, MOBILE = !!TCH.mobile, LOW_END = !!TCH.lowEnd;
  ND.settings.hq = hqUser || !LOW_END ? saved.hq !== false : false;
  // Dokunmatik kumandanın görüneceği modlar (2P: 1. oyuncu dokunmatik, 2. oyuncu gamepad olabilir)
  const TOUCH_MODES = { cpu: 1, arcade: 1, train: 1, '2p': 1, tourney: 1, dan: 1, rival: 1 };
  const TOUCH_PHASES = { intro: 1, fight: 1, ko: 1, timeup: 1 };
  const ROT_PHASES = { intro: 1, fight: 1, ko: 1, timeup: 1, replay: 1 };
  const PORTRAIT = (() => { try { return window.matchMedia('(orientation: portrait)'); } catch (e) { return { matches: false }; } })();
  const tOn = () => !!(ND.touch && ND.touch.active);
  const STR = ND.STR || {};
  const charOk = (i) => !!ND.CHARS[i] && (!ND.save || ND.save.isCharUnlocked(ND.CHARS[i].id) || ND._trial === ND.CHARS[i].id);
  const arenaOk = (id) => !ND.save || ND.save.isArenaUnlocked(id);
  // Seçilebilir kadro: gizli olmayanlar + açılmış gizliler
  const visibleChars = () => ND.CHARS.map((c, i) => i).filter((i) => !ND.CHARS[i].hidden || charOk(i));
  const charIdx = (v, def) => { if (typeof v === 'number' && ND.CHARS[v]) return v; const i = ND.CHARS.findIndex((c) => c.id === v); return i >= 0 ? i : def; };
  const randArena = (onlyOpen) => { const list = ND.ARENAS.filter((a) => !onlyOpen || arenaOk(a.id)); return (list.length ? list : ND.ARENAS)[(Math.random() * (list.length || ND.ARENAS.length)) | 0].id; };
  // Seyret/menü arka planı: gizli son patron hariç herkes
  const pickPair = () => {
    const pool = ND.CHARS.map((c, i) => i).filter((i) => !ND.CHARS[i].hidden), n = pool.length, a = (Math.random() * n) | 0;
    return [pool[a], pool[(a + 1 + ((Math.random() * (n - 1)) | 0)) % n]];
  };
  const SOLO = { cpu: 1, arcade: 1, train: 1, tourney: 1, dan: 1, rival: 1 };
  // Koşu modları: bir "koşu denetleyicisi" (game.runner) yönetir — arcade ve meydan okuma (arcade.js), turnuva ve Dan (banzuke.js)
  const RUN_MODES = { arcade: 1, tourney: 1, dan: 1, rival: 1 };
  // Onur (誉, honor.js) kazandıran modlar: tek oyunculu her maç (antrenman hariç)
  const HONOR_MODES = { cpu: 1, arcade: 1, tourney: 1, dan: 1, rival: 1 };

  // ---------------------------------------------------------------- PUAN (tek oyunculu: CPU + Arcade; 2P/Seyret/Antrenman'da kapalı)
  // Tek puan modeli: canlı puan yalnız insan oyuncu (1P) için; Arcade toplamı = dövüş puanları + bitiriş bonusu (arcade.js).
  // Zorluk çarpanı her kazanımda anında uygulanır (açılır "+120" = gerçek puan). Oyalanmayı ödüllendirmemek için:
  // süre bonusu raund başına tavanlı ve zamanla azalır, aynı eylemin tekrarı azalan getirili, vuruş dışı puan raund başına tavanlı.
  const SR = ND.SCORE_RULES = {
    hit: 10,                                        // rakibe verilen her can puanı (ölçeklenmiş hasar) başına
    comboStep: 0.15, comboMax: 2, comboGap: 3,      // karşılıksız ardışık vuruş: ×(1 + 0.15·(n−1)), en çok ×2; 3 sn ara ya da yenen darbe sıfırlar
    counter: 60, counterMaxN: 6,                    // karşılık (kaeshi-waza) başlatma: 60 × seri adımı (en çok 6)
    rallyBreak: 120, rallyMaxN: 8, finisher: 300,   // seriyi kıran vuruş: 120 × seri uzunluğu; 5. karşılık bitirişi
    parry: 150, gbreak: 250, knock: 100, lock: 150, special: 300,
    styleCap: 2500,                                 // raund başına vuruş dışı (stil) puan tavanı (çarpan öncesi)
    repeatRing: 6, repeatStep: 0.15, repeatMin: 0.25, // son 6 eylemde aynı eylemin her tekrarı −%15 (en az %25)
    round: 1000, perfect: 1500, hp: 1000, time: 800, timeFast: 15, match: 2000,
    diff: [0.5, 1, 1.5, 2],                         // Çırak, Usta, Efsane, Şura (patron)
  };
  const SCORE_CATS = ['hit', 'combo', 'counter', 'defense', 'pressure', 'special', 'round', 'perfect', 'hp', 'time'];
  const fmtN = (n) => (ND.i18n ? ND.i18n.num(n) : String(Math.round(n)));
  const score = ND.score = {
    on: false, level: 1, mult: 1, total: 0, cat: {}, combo: 0, comboT: 0, ring: [], style: 0, armed: false, t: 0, pops: [], last: null,
    begin(level) {
      this.on = true; this.level = level; this.mult = SR.diff[level] ?? 1; this.total = 0; this.t = 0; this.last = null;
      this.cat = {}; SCORE_CATS.forEach((k) => (this.cat[k] = 0));
      this.pops.length = 0; this.roundStart(); this.hud(true);
    },
    off() { this.on = false; this.pops.length = 0; this.hud(true); },
    roundStart() { this.combo = 0; this.comboT = 0; this.ring.length = 0; this.style = 0; this.armed = false; },
    live() { return this.on && game.phase === 'fight'; },
    comboMul() { return Math.min(SR.comboMax, 1 + SR.comboStep * Math.max(0, this.combo - 1)); },
    // azalan getiri: son eylemler halkasında aynı anahtarın tekrar sayısı
    dim(key) {
      let n = 0; for (const k of this.ring) if (k === key) n++;
      this.ring.push(key); if (this.ring.length > SR.repeatRing) this.ring.shift();
      return Math.max(SR.repeatMin, 1 - SR.repeatStep * n);
    },
    credit(cat, base, style) {
      if (!this.on || !(base > 0)) return 0;
      if (style) { base = Math.min(base, Math.max(0, SR.styleCap - this.style)); this.style += base; }
      const v = Math.round(base * this.mult);
      if (v <= 0) return 0;
      this.cat[cat] += v; this.total += v;
      return v;
    },
    // --- olaylar (takeHit / setState sarmalayıcıları ve oyun kancalarından)
    damage(to, from, dmg, a, x, y) {
      if (to === f1) { if (dmg > 0) { this.combo = 0; this.comboT = 0; } return; }
      if (to !== f2 || from !== f1 || !(dmg > 0)) return;
      this.combo = this.comboT > 0 ? this.combo + 1 : 1; this.comboT = SR.comboGap;
      const key = a.kind === 'shuriken' ? 'shuriken' : from.state === 'atk' ? 'a:' + from.atkName : 's:' + from.state + ':' + (a.kind || '');
      const base = dmg * SR.hit * this.dim(key);
      let v = this.credit('hit', base) + this.credit('combo', base * (this.comboMul() - 1));
      if (a.special && this.armed) { this.armed = false; v += this.credit('special', SR.special); }
      if (a.knock && !to.dead && to.state === 'launch') v += this.credit('pressure', SR.knock * this.dim('knock'), true);
      this.pop(x ?? to.x, y ?? -150, v);
    },
    counter(n) { if (this.live()) this.pop(f1.x, -250, this.credit('counter', SR.counter * Math.min(n, SR.counterMaxN), true)); },
    rallyBreak(n, to) { if (this.live()) this.pop(to.x, -215, this.credit('counter', SR.rallyBreak * Math.min(n, SR.rallyMaxN), true), true); },
    finisher() { if (this.live()) this.pop(f1.x, -265, this.credit('counter', SR.finisher, true)); },
    parry() { if (this.live()) this.pop(f1.x, -240, this.credit('defense', SR.parry * this.dim('parry'), true)); },
    gbreak() { if (this.live()) this.pop(f2.x, -240, this.credit('pressure', SR.gbreak * this.dim('gbreak'), true)); },
    lockWin() { if (this.live()) this.pop(f1.x, -250, this.credit('defense', SR.lock * this.dim('lock'), true)); },
    special() { if (this.live()) this.armed = true; },
    roundEnd(w, timer, ko) {
      if (!this.on) return;
      this.combo = 0; this.comboT = 0;
      if (w !== f1) return;
      let v = this.credit('round', SR.round);
      if (f1.damageTaken === 0) v += this.credit('perfect', SR.perfect);
      v += this.credit('hp', SR.hp * clamp(f1.hp / f1.maxHp, 0, 1));
      if (ko) { // hızlı bitiriş: ilk timeFast sn tam, sonra raund sonuna dek doğrusal azalır
        const el = ROUND_TIME - timer;
        v += this.credit('time', SR.time * clamp(1 - (el - SR.timeFast) / Math.max(1, ROUND_TIME - SR.timeFast), 0, 1));
      }
      this.pop(f1.dead ? 0 : f1.x, -285, v, true);
    },
    matchEnd(w) {
      if (!this.on) return null;
      if (w === f1) this.credit('round', SR.match);
      const res = { total: this.total, cat: Object.assign({}, this.cat), mult: this.mult, level: this.level, won: w === f1, time: Math.round(this.t), char: f1.ch.id };
      this.last = res; this.hud();
      return res;
    },
    tick(rdt, fdt) {
      if (this.on) {
        const ph = game.phase;
        if (ph === 'intro' || ph === 'fight' || ph === 'ko' || ph === 'timeup') this.t += rdt;
        if (this.comboT > 0 && ph === 'fight') { this.comboT -= fdt; if (this.comboT <= 0) this.combo = 0; }
      }
      const P = this.pops;
      for (let i = P.length - 1; i >= 0; i--) { P[i].age += rdt; if (P[i].age >= P[i].life) P.splice(i, 1); }
      this.hud();
    },
    hud(force) {
      const el = $('score1'); if (!el) return;
      const show = this.on;
      if (force || el._on !== show) { el._on = show; el.hidden = !show; }
      if (!show) return;
      if (el._v !== this.total) {
        const up = el._v != null && this.total > el._v;
        el._v = this.total; $('scoreN').textContent = fmtN(this.total);
        if (up) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
      }
      const cm = this.combo >= 2 ? this.comboMul() : 0;
      const xs = cm ? '×' + (ND.i18n ? ND.i18n.dec(+cm.toFixed(2)) : String(+cm.toFixed(2))) : '';
      if (el._x !== xs) { el._x = xs; $('scoreX').textContent = xs; }
    },
    // yüzen "+120": yakın zamanda ve yakında çıkan puanlar tek balonda toplanır (kalabalık olmasın)
    pop(x, y, v, big) {
      if (!(v > 0) || game.mode === 'attract') return;
      const P = this.pops, last = P[P.length - 1];
      if (last && !big && !last.big && last.age < 0.4 && Math.abs(last.x - x) < 110) { last.v += v; last.age = Math.min(last.age, 0.08); return; }
      P.push({ x, y, v, age: 0, life: big ? 1.6 : 1.1, big: !!big });
      if (P.length > 6) P.shift();
    },
    drawPops(c) {
      const P = this.pops; if (!P.length) return;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      const minPx = (game.pxr || 1) * (tOn() ? 15 : 13);
      for (const p of P) {
        const fs = Math.max(minPx * (p.big ? 1.25 : 1), (p.big ? 28 : 20) * cam.s) * (1 + Math.max(0, 0.12 - p.age) * 2.5);
        c.font = `700 ${Math.round(fs)}px Oswald, "Arial Narrow", sans-serif`;
        const s = '+' + fmtN(p.v), w = c.measureText(s).width;
        const X = clamp(cam.sx(p.x), w / 2 + 6, cam.W - w / 2 - 6), Y = clamp(cam.sy(p.y) - p.age * 55 * cam.s, fs, cam.H - fs);
        c.globalAlpha = clamp((p.life - p.age) / 0.35, 0, 1);
        c.lineWidth = Math.max(3, fs * 0.22); c.strokeStyle = 'rgba(5,6,12,.88)';
        c.strokeText(s, X, Y);
        c.fillStyle = p.big ? '#f1d69c' : '#ffe08a'; c.fillText(s, X, Y);
      }
      c.restore();
    },
  };

  // Dövüşçü olaylarını puana bağla (fighter.js'e dokunmadan): tüm can kaybı takeHit'ten, savuşturma / denge kırma setState'ten geçer
  {
    const FP = ND.Fighter.prototype, take = FP.takeHit, setSt = FP.setState;
    FP.takeHit = function (raw, a, from) {
      const live = score.on && game.phase === 'fight' && (this === f1 || this === f2), hp0 = this.hp;
      const r = take.apply(this, arguments);
      if (live) { try { score.damage(this, from, hp0 - this.hp, a || {}, arguments[3], arguments[4]); } catch (e) { /* puan hatası dövüşü bozmasın */ } }
      return r;
    };
    FP.setState = function (s) {
      const r = setSt.apply(this, arguments);
      if (score.on && (s === 'parry' || s === 'gbreak')) {
        try { if (s === 'parry' && this === f1) score.parry(); else if (s === 'gbreak' && this === f2) score.gbreak(); } catch (e) { /* yok */ }
      }
      return r;
    };
  }

  // fx çağrılarını tekrar için kaydet
  const FX_EV = ['spark', 'blood', 'dust', 'flash', 'ring', 'text'];
  FX_EV.forEach((name) => {
    const orig = fx[name].bind(fx);
    fx[name] = (...args) => { if (game.recording) game.fxEvents.push([name, args]); return orig(...args); };
    fx['_' + name] = orig;
  });

  const game = ND.game = {
    mode: 'attract', level: [0, 1, 2].includes(saved.level) ? saved.level : 1, phase: 'menu', pt: 0, projs: [], hitstopT: 0, slow: 1, slowT: 0,
    round: 1, wins: [0, 0], timer: ROUND_TIME, focus: null, paused: false, bars: 0, ais: [], bannerT: 0, dim: 0,
    stats: null, flags: {}, lock: null, clock: 0, rally: { n: 0, last: null, t: 0 }, slowV: 0.35, cineT: 0, cineX: 0, recording: false, fxEvents: [], rec: [], koIndex: -1, replay: null,
    sel: { c: [charIdx(saved.c1, 0), charIdx(saved.c2, 1)], arena: saved.arena ?? 'temple', ready: [false, false] },
    F, pv: null, pvIds: ['pv1', 'pv2'],

    hitstop(t) { this.hitstopT = Math.max(this.hitstopT, t); },

    // ---------------------------------------------------- mod başlatma
    start(mode, opts = {}) {
      this.mode = mode;
      // başka moda geçilince etkin koşu biter (arcade/turnuva/Dan)
      if (this.runner && this.runner.mode !== mode) { this.runner.run = null; this.runner = null; }
      if (mode !== 'arcade' && ND.arcade && ND.arcade.run && this.runner !== ND.arcade) ND.arcade.run = null;
      // kural değiştiriciler yalnız bu maç için (yoksa kapanır); raund sayısı ve rakip canı da buradan
      if (ND.mods) ND.mods.set(opts.mods || null);
      this.winsNeed = ND.mods ? ND.mods.winsNeed() : 2;
      f1.ctrl = mode === 'watch' || mode === 'attract' ? aiC1 : input.p1;
      f2.ctrl = mode === '2p' ? input.p2 : aiC2;
      input.solo = !!SOLO[mode];
      [aiC1, aiC2, input.p1, input.p2].forEach((c) => c.clear());
      this.ais = [];
      let c1 = opts.c1, c2 = opts.c2, arena = opts.arena;
      if (mode === 'watch' || mode === 'attract') {
        [c1, c2] = pickPair();
        arena = randArena(false);
      }
      this.applyChars(c1 ?? 0, c2 ?? 1);
      if (opts.oppHp > 0 && RUN_MODES[mode]) f2.maxHp = Math.round(f2.ch.hp * opts.oppHp); // Dan sınavı: güçlendirilmiş rakip
      if (mode === 'watch' || mode === 'attract') {
        const lv = mode === 'attract' ? 1 : 2;
        this.ais.push(new ND.AI(f1, lv), new ND.AI(f2, lv));
      } else if (mode === 'cpu') this.ais.push(new ND.AI(f2, this.level));
      else if (RUN_MODES[mode]) this.ais.push(new ND.AI(f2, opts.level ?? 1));
      else if (mode === 'train') this.ais.push(ND.training.makeDummy(f2));
      if (arena === 'random' || !arena) arena = randArena(!RUN_MODES[mode]);
      scene.setTheme(arena);
      this.wins = [0, 0]; this.round = 1;
      this.stats = [{ dmg: 0, parries: 0, specials: 0, counters: 0, rallies: 0, perfect: 0 }, { dmg: 0, parries: 0, specials: 0, counters: 0, rallies: 0, perfect: 0 }];
      F.forEach((f) => { f.parries = 0; f.ki = 0; });
      if (mode === 'cpu') score.begin(this.level); else if (RUN_MODES[mode]) score.begin(opts.level ?? 1); else score.off();
      au.quiet = mode === 'attract';
      const attract = mode === 'attract';
      this.hideOverlays();
      $('menu').hidden = !attract; $('hud').hidden = attract;
      $('pauseBtn').hidden = attract;
      this.paused = false; this.replay = null;
      input.touchReset(); this.syncTouch();
      const H = STR.hud || {};
      let t1 = '1P', t2 = '2P';
      if (mode === 'watch') t1 = t2 = 'CPU';
      else if (mode === 'cpu') { t1 = tx(H.you || 'SEN'); t2 = 'CPU · ' + upper(ND.AI_LEVELS[this.level].name); }
      else if (RUN_MODES[mode] && this.runner) [t1, t2] = this.runner.hudTags();
      else if (mode === 'train') { t1 = tx(H.you || 'SEN'); t2 = tx(H.dummy || 'KUKLA'); }
      $('tag1').textContent = t1; $('tag2').textContent = t2;
      // Dan rütbesi 1P adının yanında (tek oyunculu modlar)
      const rk = $('rank1');
      if (rk) { const tag = SOLO[mode] && ND.banzuke ? ND.banzuke.rankTag() : ''; rk.textContent = tag; rk.hidden = !tag; }
      $('arenaName').textContent = (ND.ARENAS.find((a) => a.id === scene.themeId) || ND.ARENAS[0]).name;
      mu.setMode(attract ? 'menu' : 'fight');
      this.startRound();
      if (mode === 'train') ND.training.onStart();
      if (attract && ND.arcade) ND.arcade.refreshMenu();
    },

    // Tüm tam ekran katmanları kapat (menü/HUD hariç)
    hideOverlays() {
      ['end', 'pause', 'select', 'vs', 'ending', 'replayTag', 'lockHint', 'rally', 'lb', 'bzLobby', 'bzRes', 'hall', 'honorOv', 'movesOv', 'reveal'].forEach((id) => { const el = $(id); if (el) el.hidden = true; });
      if (ND.lbUI) ND.lbUI.open = false;
      if (ND.banzuke) ND.banzuke.onHidden();
      if (ND.training) ND.training.hide();
      $('banner').classList.remove('show');
    },

    // Önizleme sahnesi (VS ekranı, final): arka planda arena, önizleme tuvallerinde dövüşçüler
    ensurePv() {
      if (!this.pv) {
        this.pv = [new ND.Fighter(0, new ND.Ctrl()), new ND.Fighter(1, new ND.Ctrl())];
        this.pv[0].opp = this.pv[1]; this.pv[1].opp = this.pv[0];
      }
      return this.pv;
    },
    showStage(phase, ids, c1, c2) {
      this.phase = phase; this.pt = 0; this.ais = []; this.paused = false; this.lock = null; this.replay = null;
      F.forEach((f) => (f.locked = true));
      au.quiet = false;
      this.hideOverlays();
      $('menu').hidden = true; $('hud').hidden = true; $('pauseBtn').hidden = true;
      this.syncTouch();
      this.ensurePv(); this.pvIds = ids;
      const set = (pv, ci, alt, dir) => { pv.setChar(ND.CHARS[ci], alt); pv.reset(0); pv.dir = dir; pv.pvPose = null; };
      set(this.pv[0], c1, false, 1);
      if (c2 != null) set(this.pv[1], c2, c1 === c2, -1);
    },

    applyChars(i1, i2) {
      const c1 = ND.CHARS[i1], c2 = ND.CHARS[i2];
      f1.setChar(c1, false); f2.setChar(c2, i1 === i2);
      for (const n of [1, 2]) {
        const f = F[n - 1];
        $('nm' + n).textContent = f.ch.name; $('kj' + n).textContent = f.ch.kanji; $('kj' + n).style.color = f.col.ui;
        document.documentElement.style.setProperty('--c' + n, f.col.ui);
      }
    },

    startRound() {
      f1.reset(-260); f2.reset(260);
      this.projs = []; fx.clear(); ND.specialFx?.clear(); this.lock = null; $('lockHint').hidden = true;
      this.timer = ROUND_TIME; this.phase = 'intro'; this.pt = 0; this.slow = 1; this.slowT = 0; this.hitstopT = 0; this.dim = 0;
      this.focus = { x: 0, y: -130, z: 0.82 }; this.flags = {}; this.doubleKO = false; this.winner = null;
      this.rec = []; this.koIndex = -1; this.fxEvents = [];
      this.rally = { n: 0, last: null, t: 0 }; this.cineT = 0; this.rallyHud();
      if (ND.mods) ND.mods.roundStart(F); // değiştiriciler: dolu ki, üç kat shuriken, yarım can…
      score.roundStart();
      $('rlabel').textContent = tx('RAUND ' + this.round);
      if (this.mode === 'attract' && this.round > 1) scene.setTheme(randArena(false));
      if (this.mode === 'train') { this.focus = null; $('rlabel').textContent = upper(tx(STR.train && STR.train.title || 'Antrenman')); }
    },

    banner(text, kanji, sub, dur = 1.1) {
      if (this.mode === 'attract') return;
      const el = $('banner');
      $('bt').textContent = tx(text); $('bk').textContent = kanji || ''; $('bs').textContent = sub ? tx(sub) : '';
      el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
      this.bannerT = dur;
    },

    // ---------------------------------------------------- olay kancaları
    onKO(loser, winner) {
      if (this.phase === 'ko') { this.doubleKO = true; return; }
      if (this.phase !== 'fight') return;
      if (this.lock) this.endLock(null);
      this.phase = 'ko'; this.pt = 0; this.loser = loser; this.winner = winner;
      this.koIndex = this.rec.length;
      F.forEach((f) => (f.locked = true));
      this.slow = 0.2; cam.punch(12); this.hitstop(0.22);
      au.ko(); mu.setMode('ko');
    },
    onSpecial(f) {
      this.dim = 1; this.slowT = 0.3; this.slowV = 0.35;
      au.whoosh(1.3); cam.punch(4);
      fx.text(f.x, -215, ND.SPECIALS?.[f.ch.id]?.kanji || '影斬り', f.col.ui);
      if (this.stats) this.stats[f.id].specials++;
      if (f === f1) score.special();
    },

    // ---------------------------------------------------- karşılık serisi (kaeshi-waza)
    onCounter(f, name) {
      const R = this.rally;
      if (R.last && R.last !== f && R.t < 1.5) R.n++; else R.n = 1;
      R.last = f; R.t = 0;
      let nm = name;
      if (R.n >= 5 && name !== 'mawari') nm = 'finisher';
      const speed = 1 + 0.07 * Math.min(R.n - 1, 7);
      if (R.n >= 2) fx.text(f.x, -236, R.n + '. KARŞILIK', '#ffe3a1');
      if (R.n >= 3 && this.mode !== 'attract') mu.setMode('final');
      if (f === f1) score.counter(R.n);
      if (this.stats && this.phase === 'fight') this.stats[f.id].counters++;
      if (nm === 'finisher') this.onFinisher(f);
      this.rallyHud();
      return { name: nm, speed };
    },
    onFinisher(f) {
      this.dim = 0.9; this.slowT = 0.6; this.slowV = 0.5; this.cineT = 0.9; this.cineX = (f.x + f.opp.x) / 2;
      fx.text(f.x, -258, 'SON VURUŞ!', f.col.ui);
      au.whoosh(1.5); au.taiko(1.1); cam.punch(5);
      if (f === f1) score.finisher();
    },
    onHit(from, to, dmg) {
      const R = this.rally;
      if (!R.n) return;
      if (from === f1 && R.n >= 2) score.rallyBreak(R.n, to);
      if (R.n >= 3 && this.stats && this.stats[from.id]) this.stats[from.id].rallies++;
      if (R.n >= 3) {
        this.slowT = 0.85; this.slowV = 0.25; this.cineT = 0.9; this.cineX = to.x;
        fx.text(to.x, -262, R.n + ' VURUŞLUK SERİ!', '#ff9b7a');
        au.taiko(1.2); cam.punch(10);
      }
      R.n = 0; R.last = null; this.rallyHud();
    },
    rallyHud() {
      const n = this.rally.n, el = $('rally');
      if (!el) return;
      el.hidden = n < 2 || this.mode === 'attract';
      if (n >= 2) { $('rallyN').textContent = n; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); el.classList.toggle('hot', n >= 4); }
    },
    isHuman(f) { return this.mode === '2p' || (SOLO[this.mode] && f === f1); },
    // Filmdeki gibi tuş istemi: daralan halka doğru anı gösterir
    drawPrompts() {
      const tut = this.mode === 'train' && ND.training && ND.training.tut && !ND.training.finished;
      if ((!ND.settings.hints && !tut) || this.phase !== 'fight') return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const TB = (STR.touch && STR.touch.btn) || {};
      for (const f of F) {
        if (!this.isHuman(f) || f.dead) continue;
        // dokunmatikte harf yerine düğme adı (HAFİF / GARD), halka da parmakla okunacak kadar büyük
        const tch = f === f1 && tOn();
        const o = f.opp, L = tch ? [tx(TB.light || 'HAFİF'), tx(TB.guard || 'GARD')] : f === f1 ? [keyLabel('KeyF'), keyLabel('KeyS')] : [keyLabel('KeyK'), '↓'];
        let frac = -1, key, label, col;
        const cw = f.counterUntil - this.clock;
        if (cw > 0 && ['block', 'parry', 'guard', 'move', 'recoil'].includes(f.state)) { frac = cw / f.counterWin; key = L[0]; label = tx('KARŞILIK'); col = '255,210,122'; }
        // savuşturma istemi: normalde yalnız karşılık hareketlerinde; antrenmanda her kılıç darbesinde
        else if (o.state === 'atk' && (o.atk.counter || (this.mode === 'train' && o.atk.kind === 'blade')) && !o.hitDone) {
          const w = o.curWin(false);
          if (w && o.st < w[0]) {
            const rem = (w[0] - o.st) / (o.ch.spd * o.aspd);
            if (rem < 0.5) { frac = rem / 0.5; key = L[1]; label = tx('SAVUŞTUR'); col = '150,210,255'; }
          }
        }
        if (frac < 0) continue;
        let s = cam.s * Math.max(0.9, cam.z);
        if (tch) s = Math.max(s, (this.pxr || 1) * 1.05);
        const x = cam.sx(f.x), y = cam.sy(f.y - 200);
        ctx.lineWidth = 3 * s; ctx.strokeStyle = `rgba(${col},${0.35 + 0.65 * (1 - frac)})`;
        ctx.beginPath(); ctx.arc(x, y, (15 + 38 * frac) * s, 0, 6.283); ctx.stroke();
        ctx.fillStyle = 'rgba(8,9,16,.85)'; ctx.beginPath(); ctx.arc(x, y, 15 * s, 0, 6.283); ctx.fill();
        ctx.strokeStyle = `rgb(${col})`; ctx.lineWidth = 2 * s; ctx.stroke();
        ctx.fillStyle = `rgb(${col})`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let fs = Math.round(15 * s);
        ctx.font = `700 ${fs}px Oswald, sans-serif`;
        if (key.length > 1) { const w = ctx.measureText(key).width, mw = 25 * s; if (w > mw) { fs = Math.max(6, Math.floor(fs * mw / w)); ctx.font = `700 ${fs}px Oswald, sans-serif`; } }
        ctx.fillText(key, x, y + s);
        ctx.font = `600 ${Math.round(10 * s)}px Oswald, sans-serif`; ctx.fillText(label, x, y + 27 * s);
        ctx.textBaseline = 'alphabetic';
      }
    },

    // ---------------------------------------------------- kılıç kilitlenmesi (tsubazeriai)
    startLock(a, b, x, y) {
      const mid = clamp((a.x + b.x) / 2, -ND.ARENA + 60, ND.ARENA - 60);
      a.setState('lock', { lockWin: false }); b.setState('lock', { lockWin: false });
      a.dir = b.x >= a.x ? 1 : -1; b.dir = -a.dir;
      a.x = mid - a.dir * 50; b.x = mid - b.dir * 50; a.vx = b.vx = 0;
      this.lock = { a, b, t: 0, pa: 0, pb: 0, sp: 0, mid, off: 0 };
      fx.text(mid, -235, 'KİLİTLENDİ!', '#ffe3a1');
      if (this.mode !== 'attract') {
        const H = STR.hud || {};
        const hint = SOLO[this.mode] && tOn() && STR.touch ? STR.touch.lock : SOLO[this.mode] ? H.lockSolo || 'F / K tuşuna hızlıca bas!' : H.lockDuo || 'Hafif ya da ağır tuşuna hızlıca bas!';
        $('lockHint').textContent = tx(hint); $('lockHint').hidden = false;
      }
    },
    updateLock(dt) {
      const L = this.lock; if (!L) return;
      L.t += dt;
      const count = (f) => { let n = 0; while (f.ctrl.take('light', 0.6) || f.ctrl.take('heavy', 0.6)) n++; return Math.min(n, 1); };
      L.pa += count(L.a); L.pb += count(L.b);
      const diff = L.pa - L.pb;
      L.off = ND.M.approach(L.off, clamp(diff, -7, 7) * 6, 10, dt);
      const c = L.mid + L.a.dir * L.off;
      L.a.x = c - L.a.dir * 50; L.b.x = c - L.b.dir * 50;
      L.a.lockWin = diff > 0; L.b.lockWin = diff < 0;
      L.sp -= dt;
      if (L.sp <= 0) {
        L.sp = 0.08;
        fx._spark(c, -132, -Math.PI / 2, 3, 0.45);
        au.noise({ type: 'bandpass', f0: 3200 + Math.random() * 800, q: 8, dur: 0.09, gain: 0.08, send: 0.3, pan: cam.pan(c) });
        cam.punch(1.2);
      }
      if (Math.abs(diff) >= 7 || L.t > 2.8) this.endLock(diff > 0 ? L.a : diff < 0 ? L.b : null);
    },
    endLock(winner) {
      const L = this.lock; if (!L) return;
      this.lock = null; $('lockHint').hidden = true;
      if (L.a.dead || L.b.dead) return;
      const c = (L.a.x + L.b.x) / 2;
      if (winner) {
        const loser = winner.opp;
        loser.setState('stagger'); loser.vx = winner.dir * 420; loser.posture = Math.min(99, loser.posture + 30); loser.sinceHit = 0;
        winner.setState('shove'); winner.vx = winner.dir * 80; winner.gainKi(15);
        if (winner === f1) score.lockWin();
        fx.text(c, -225, 'İTTİ!', '#ffe3a1');
      } else {
        L.a.setState('clash'); L.b.setState('clash'); L.a.vx = -L.a.dir * 330; L.b.vx = -L.b.dir * 330;
      }
      fx.spark(c, -130, -Math.PI / 2, 22, 1.2); fx.ring(c, -130);
      au.clang(1.3, cam.pan(c), 0.85); cam.punch(8); this.hitstop(0.1);
    },

    // ---------------------------------------------------- raund akışı
    phaseUpdate(rdt, gdt) {
      const pt = this.pt, fl = this.flags;
      if (this.bannerT > 0) { this.bannerT -= rdt; if (this.bannerT <= 0) $('banner').classList.remove('show'); }
      if (this.phase === 'intro' && this.mode === 'train') {
        // antrenman: tanıtım yok, hemen başla
        if (pt > 0.3) { this.phase = 'fight'; F.forEach((f) => (f.locked = false)); }
      } else if (this.phase === 'intro') {
        if (pt > 0.25 && !fl.r) {
          fl.r = true;
          const need = this.winsNeed || 2, last = this.wins[0] === need - 1 && this.wins[1] === need - 1;
          const BZ = STR.bz || {};
          this.banner(last ? 'Son raund' : this.round + '. Raund', KANJI[Math.min(2, this.round - 1)], need === 1 ? BZ.suddenSub || '' : last ? 'Kazanan her şeyi alır' : 'İlk iki raundu alan kazanır', 1.15);
          au.gong();
          if (this.mode !== 'attract') mu.setMode(last ? 'final' : 'fight');
        }
        if (pt > 0.9) this.focus = null;
        if (pt > 1.5 && !fl.f) { fl.f = true; this.banner('Dövüş!', '始め', '', 0.75); au.taiko(1.1); }
        if (pt > (this.mode === 'attract' ? 0.8 : 1.75)) { this.phase = 'fight'; F.forEach((f) => (f.locked = false)); }
      } else if (this.phase === 'fight') {
        if (this.mode === 'train') return;
        this.timer -= gdt;
        if (this.mode !== 'attract' && Math.min(f1.hp / f1.maxHp, f2.hp / f2.maxHp) < 0.3) mu.setMode('final');
        if (this.timer <= 0) {
          if (this.lock) this.endLock(null);
          this.timer = 0; this.phase = 'timeup'; this.pt = 0;
          F.forEach((f) => (f.locked = true));
          const d = f1.hp / f1.maxHp - f2.hp / f2.maxHp;
          this.winner = d > 0.001 ? f1 : d < -0.001 ? f2 : null;
          this.banner('Süre doldu', this.winner ? '一本' : '引分', this.winner ? this.winner.ch.name + ' önde' : 'Berabere', 1.8);
          au.taiko(1); au.gong(); mu.setMode('ko');
        }
      } else if (this.phase === 'ko') {
        const L = this.loser;
        if (pt < 1.5) this.focus = { x: (L.rag ? L.rag.p.hip.x : L.x) * 0.7 + this.winner.x * 0.3, y: -95, z: 1.45 };
        else this.focus = null;
        this.slow = pt < 1.3 ? 0.2 : Math.min(1, this.slow + rdt * 2);
        if (pt > 0.55 && !fl.k) {
          fl.k = true;
          const perfect = this.winner.damageTaken === 0;
          this.banner(this.doubleKO ? 'Çifte K.O.' : 'K.O.', '一本', perfect && !this.doubleKO ? 'Mükemmel' : '', 1.6);
        }
        if (pt > 1.6 && !fl.w && !this.winner.dead) { fl.w = true; this.winner.setState('win'); }
        if (this.mode === 'train') { if (pt > 2.6) { this.startRound(); if (ND.training.dummy) ND.training.setDummy(ND.training.dummy.beh); } return; }
        if (pt > (this.mode === 'attract' ? 3.2 : 4.3)) this.endRound(this.doubleKO ? null : this.winner);
      } else if (this.phase === 'timeup') {
        if (pt > 1.0 && !fl.w && this.winner) { fl.w = true; this.winner.setState('win'); }
        if (pt > 3.6) this.endRound(this.winner);
      }
    },

    endRound(w) {
      if (this.stats) { this.stats[0].dmg += f2.damageTaken; this.stats[1].dmg += f1.damageTaken; }
      if (this.mode === 'attract') {
        this.round++;
        if (this.round > 3) { this.round = 1; this.applyChars(...pickPair()); }
        this.startRound(); return;
      }
      if (this.runner && this.mode === this.runner.mode) this.runner.onRoundEnd(w);
      if (w && this.stats && w.damageTaken === 0) this.stats[w.id].perfect++;
      if (score.on) score.roundEnd(w, this.timer, this.phase === 'ko' && !this.doubleKO);
      if (w) this.wins[w.id]++;
      if (w && this.wins[w.id] >= (this.winsNeed || 2)) {
        if (this.koIndex > 30 && !this.doubleKO && this.rec.length > this.koIndex) return this.startReplay(w);
        return this.matchEnd(w);
      }
      this.round++; this.startRound();
    },

    matchEnd(w) {
      this.phase = 'end'; this.replay = null; this.bars = 0;
      this.stats[0].parries = f1.parries || 0; this.stats[1].parries = f2.parries || 0;
      const vsCpu = this.mode === 'cpu';
      const nice = (n) => n[0] + n.slice(1).toLowerCase();
      const E = STR.end || {};
      $('endK').textContent = '勝利';
      $('endTitle').textContent = tx(vsCpu ? (w === f1 ? 'Zafer senin' : nice(w.ch.name) + ' kazandı') : nice(w.ch.name) + ' kazandı');
      $('endSub').textContent = tx(`${this.wins[0]} – ${this.wins[1]} · ${this.round} raund · ${(ND.ARENAS.find((a) => a.id === scene.themeId) || ND.ARENAS[0]).name}`);
      $('bRematch').textContent = tx(E.rematch || 'Rövanş'); $('bChange').textContent = tx(E.change || 'Karakter değiştir'); $('bEndMenu').textContent = tx(E.menu || 'Ana menü');
      $('bChange').hidden = false;
      const bc = $('bContinue'); if (bc) bc.hidden = true;
      // a locked ninja tried for one fight (rewarded ad) goes back to the lock afterwards
      if (ND._trial) { ND._trial = null; if (this.trialPrev != null) this.sel.c[0] = this.trialPrev; this.trialPrev = null; }
      if (ND.coach) ND.coach.stop();
      const s = this.stats, rows = [
        [nice(f1.ch.name), '', nice(f2.ch.name)],
        [this.wins[0], tx('Raund'), this.wins[1]],
        [s[0].dmg, tx('Verilen hasar'), s[1].dmg],
        [s[0].parries, tx('Savuşturma'), s[1].parries],
        [s[0].specials, tx('Ki Saldırısı'), s[1].specials],
      ];
      $('endStats').innerHTML = rows.map((r, i) => `<div class="l" style="${i ? '' : 'color:var(--c1);font-weight:600'}">${r[0]}</div><div class="m">${r[1]}</div><div class="r" style="${i ? '' : 'color:var(--c2);font-weight:600'}">${r[2]}</div>`).join('');
      const res = score.matchEnd(w);
      this.showScore(null);
      // Onur: maç dökümü (koşu denetleyicisi bonus satırı ekleyebilir, sonra gösterilir)
      let hon = null;
      if (HONOR_MODES[this.mode] && ND.honor) {
        try {
          hon = ND.honor.award({ mode: this.mode, won: w === f1, level: score.level, roundsWon: this.wins[0], parries: s[0].parries, counters: s[0].counters, rallies: s[0].rallies, perfects: s[0].perfect });
        } catch (e) { console.warn('[honor]', e); }
      }
      const handled = this.runner && this.mode === this.runner.mode && this.runner.onMatchEnd(w, res);
      if (ND.honor) ND.honor.render($('endHonor'), hon, { challenge: this.mode === 'cpu' });
      if (handled) return;
      if (this.mode === 'cpu' && res) this.cpuResult(res);
      setTimeout(() => { if (this.phase === 'end') { $('end').hidden = false; $('bRematch').focus(); } }, 500);
    },

    // Maç sonu puan dökümü (#endScore). res null → gizle. o: { lost, newBest, note }
    showScore(res, o = {}) {
      const box = $('endScore'), lb = $('endLb'), dlg = $('end').querySelector('.dialog');
      if (dlg) dlg.classList.toggle('scored', !!res);
      if (lb) { lb.hidden = true; lb.textContent = ''; }
      if (!box) return;
      box.textContent = ''; box.hidden = !res;
      if (!res) return;
      const T = STR.score || {}, RW = T.rows || {};
      const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
      const grid = el('div', 'sbd-rows');
      for (const k of SCORE_CATS) {
        if (!res.cat[k]) continue;
        const d = el('div'); d.append(el('small', '', RW[k] || k), el('b', '', fmtN(res.cat[k]))); grid.appendChild(d);
      }
      const tot = el('div', 'sbd-tot' + (o.lost ? ' lost' : ''));
      tot.append(el('small', '', T.total || ''), el('b', '', fmtN(res.total)));
      if (o.newBest) tot.appendChild(el('em', '', T.newBest || ''));
      const lvName = (ND.AI_LEVELS[res.level] || ND.AI_LEVELS[1]).name;
      tot.appendChild(el('span', 'sbd-m', T.diff ? T.diff(lvName, res.mult) : ''));
      box.append(grid, tot);
      if (o.note) box.appendChild(el('p', 'sbd-note', o.note));
    },
    // CPU maçı: kişisel rekor (zorluk başına, yalnız galibiyet) + Efsane'de sıralamaya otomatik gönderim
    cpuResult(res) {
      const T = STR.score || {};
      const rec = ND.save && res.won ? ND.save.recordCpu(this.level, res.total) : null;
      const prev = ND.save ? (ND.save.p.cpuBest || {})[this.level] || 0 : 0;
      const bestTxt = T.best ? T.best(Math.max(prev, rec ? rec.best : 0)) : '';
      let note = bestTxt;
      if (this.level === 2 && !res.won) note = [T.lossCpu, bestTxt].filter(Boolean).join(' · ');
      else if (this.level !== 2) note = [bestTxt, T.cpuBoardHint].filter(Boolean).join(' · ');
      this.showScore(res, { newBest: !!(rec && rec.newBest), note, lost: !res.won });
      if (rec && rec.newBest && ND.toast && STR.toast) setTimeout(() => ND.toast(STR.toast.newBest(res.total), STR.toast.bestK), 600);
      if (this.level === 2 && res.won && ND.lbUI) {
        const back = () => { $('end').hidden = false; setTimeout(() => $('bRematch').focus(), 0); };
        // maç özeti: sunucu makullük denetimi için
        const sum = { dur: res.time, fights: 1, won: 1, rounds: this.round, rw: this.wins[0], hits: ND.mods ? ND.mods.hits : 0, lvl: 2, mode: 'cpu' };
        ND.lbUI.panel($('endLb'), 'cpu_efsane', { score: res.total, char: res.char, time: res.time, date: Date.now(), sum }, { back, onOpen: () => { $('end').hidden = true; } });
      }
    },

    // ---------------------------------------------------- tekrar (son darbe)
    snapshot() {
      return {
        cam: { x: cam.x, y: cam.y, z: cam.z },
        fs: F.map((f) => ({
          j: ND.cloneJ(f.dead ? f.rag.j : f.j),
          ropes: f.ropeList().map((r) => ({ p: r.rope.p.map((q) => ({ x: q.x, y: q.y })), col: r.col, w: r.w })),
          trail: f.trail.map((t) => t.slice()), glint: f.glint(), flash: f.flash, x: f.dead ? f.rag.p.hip.x : f.x, y: f.y,
          dead: f.dead, hidden: !!f.hidden && !f.dead, // 影分身 / 阿修羅 ışınlanması: görünmezken tekrarda da görünmesin
          ls: f.looseSword ? { a: { x: f.looseSword.a.x, y: f.looseSword.a.y }, b: { x: f.looseSword.b.x, y: f.looseSword.b.y } } : null,
          ghosts: f.ghosts.map((g) => ({ j: g.j, life: g.life, max: g.max })),
        })),
        projs: this.projs.map((p) => ({ x: p.x, y: p.y, rot: p.rot, vx: p.vx, stuck: p.stuck, falling: p.falling, col: p.col, alpha: p.alpha })),
        fx: this.fxEvents.splice(0),
      };
    },
    startReplay(w) {
      const from = Math.max(0, this.koIndex - 100), to = Math.min(this.rec.length - 1, this.koIndex + 75);
      this.replay = { w, i: from, from, to, ko: this.koIndex, last: from - 1, decals: fx.decals.length };
      this.phase = 'replay'; this.pt = 0;
      fx.clear();
      $('replayTag').hidden = false; $('banner').classList.remove('show');
      $('hud').hidden = true; $('pauseBtn').hidden = true; $('rally').hidden = true; // sinematik: HUD tekrar etiketinin üstüne binmesin
      mu.setMode('menu');
    },
    updateReplay(rdt) {
      const R = this.replay;
      const d = R.i - R.ko;
      const speed = d < -28 ? 1 : d < 30 ? 0.28 : 0.6;
      R.i += rdt * 60 * speed;
      const idx = Math.min(R.to, Math.floor(R.i));
      for (let k = R.last + 1; k <= idx; k++) {
        const fr = this.rec[k];
        if (fr) for (const [name, args] of fr.fx) fx['_' + name](...args);
      }
      R.last = idx;
      fx.update(rdt * speed);
      const s = this.rec[idx];
      if (s) { cam.x = s.cam.x; cam.y = s.cam.y - 6; cam.z = s.cam.z * 1.12; cam.shx = cam.shy = 0; }
      if (R.i >= R.to) this.finishReplay();
    },
    finishReplay() {
      if (!this.replay) return;
      const w = this.replay.w;
      $('replayTag').hidden = true;
      $('hud').hidden = false; $('pauseBtn').hidden = false;
      this.replay = null;
      this.matchEnd(w);
    },
    drawSnapFighter(c, s, f) {
      const mkRope = (r) => ({ rope: Object.assign(Object.create(ND.Rope.prototype), { p: r.p }), col: r.col, w: r.w });
      ND.drawNinja(c, s.j, f.col, {
        ropes: s.ropes.map(mkRope), glint: s.glint, wpn: f.wpn, acc: f.ch.acc,
        trail: (cc) => { const save = f.trail; f.trail = s.trail; f.drawTrail(cc); f.trail = save; },
      });
      if (s.ls) ND.drawSword(c, s.ls.a.x, s.ls.a.y, Math.atan2(s.ls.b.y - s.ls.a.y, s.ls.b.x - s.ls.a.x), f.col, 0, f.wpn);
    },

    // ---------------------------------------------------- güncelleme
    separate() {
      if (f1.dead || f2.dead || f1.state === 'dodge' || f2.state === 'dodge' || f1.passing() || f2.passing() || this.lock) return;
      if (Math.abs(f1.y - f2.y) > 100) return;
      const d = f2.x - f1.x, ad = Math.abs(d), min = 44;
      if (ad >= min) return;
      const s = d === 0 ? f1.dir : Math.sign(d), push = (min - ad) / 2, A = ND.ARENA;
      f1.x -= s * push; f2.x += s * push;
      if (Math.abs(f1.x) > A) { const o = Math.abs(f1.x) - A; f1.x = Math.sign(f1.x) * A; f2.x += s * o; }
      if (Math.abs(f2.x) > A) { const o = Math.abs(f2.x) - A; f2.x = Math.sign(f2.x) * A; f1.x -= s * o; }
    },

    update(rdt) {
      this.pt += rdt;
      if (this.phase === 'select' || this.phase === 'vs' || this.phase === 'ending') { this.updateSelect(rdt); scene.update(rdt); cam.follow(rdt, { x: -200, y: 0 }, { x: 200, y: 0 }, null); return; }
      if (this.phase === 'replay') { scene.update(rdt * 0.4); this.updateReplay(rdt); this.bars = 1; return; }
      if (this.slowT > 0) { this.slowT -= rdt; if (this.phase === 'fight') this.slow = this.slowT > 0 ? this.slowV : 1; }
      if (this.cineT > 0) this.cineT -= rdt;
      this.dim = Math.max(0, this.dim - rdt * 1.6);
      const gdt = rdt * this.slow;
      this.phaseUpdate(rdt, gdt);
      scene.update(gdt);
      let fdt = gdt;
      if (this.hitstopT > 0) { this.hitstopT -= rdt; fdt = 0; }
      this.recording = this.mode !== 'attract' && (this.phase === 'fight' || this.phase === 'ko');
      if (fdt > 0) {
        for (const ai of this.ais) ai.update(fdt);
        const n = Math.max(1, Math.ceil(fdt * 120)), h = fdt / n;
        for (let i = 0; i < n; i++) {
          this.clock += h;
          f1.update(h); f2.update(h); this.separate();
          if (this.lock) this.updateLock(h);
          f1.solve(h); f2.solve(h); f1.afterCombat(); f2.afterCombat();
          for (const p of this.projs) p.update(h);
          if (this.hitstopT > 0) break;
        }
        const R = this.rally;
        if (R.n) { R.t += fdt; if (R.t > 1.6) { R.n = 0; R.last = null; this.rallyHud(); } }
        this.projs = this.projs.filter((p) => !p.dead);
        const stuck = this.projs.filter((p) => p.stuck);
        if (stuck.length > 14) this.projs.splice(this.projs.indexOf(stuck[0]), 1);
      }
      fx.update(fdt > 0 ? gdt : gdt * 0.25);
      ND.specialFx?.update(fdt > 0 ? gdt : gdt * 0.25);
      if (this.runner && this.mode === this.runner.mode) this.runner.tick(rdt);
      else if (this.mode === 'train') ND.training?.tick(rdt);
      score.tick(rdt, fdt);
      let focus = this.focus;
      const mid = (f1.x + f2.x) / 2;
      if (!focus && this.lock) focus = { x: mid, y: -115, z: 1.35 };
      else if (!focus && this.cineT > 0) focus = { x: this.cineX, y: -108, z: 1.55 };
      else if (!focus && this.rally.n >= 2 && Math.abs(f1.x - f2.x) < 420) focus = { x: mid, y: -116, z: Math.min(1.45, 1.08 + 0.06 * this.rally.n) };
      cam.follow(rdt, f1, f2, focus);
      this.bars = ND.M.approach(this.bars, (this.phase === 'ko' && this.pt < 3.5) || this.lock ? 1 : 0, 6, rdt);
      // The replay reads 60 snapshots per second of game time (updateReplay), so with the 120 Hz step only every
      // other step is recorded; fx events of the skipped step wait in fxEvents for the next snapshot.
      if (this.recording) {
        this.recOdd = !this.recOdd;
        if (this.recOdd || this.rec.length === 0) { this.rec.push(this.snapshot()); if (this.rec.length > 900) { this.rec.shift(); this.koIndex--; } }
      }
      if (this.mode !== 'attract' && !this.inBatch) this.hud();
    },

    // Fixed timestep: the simulation always advances in STEP (1/120 s) slices whatever the display rate
    // (60/120/144/165 Hz or an uneven frame time), so jumps, dashes, attack timings, AI reactions and the round
    // clock are identical everywhere. Rendering is not interpolated (at 144/165 Hz some frames show the same step).
    // A little slack (SLACK of a step) absorbs rAF jitter so a 60 Hz screen gets exactly two steps every frame
    // instead of alternating 1/3; the debt is kept in acc, so over time the speed is exact.
    STEP: 1 / 120,
    acc: 0,
    advance(rdt) {
      const STEP = this.STEP, SLACK = 0.2;
      this.acc = Math.min(this.acc + rdt, 0.1);
      let n = Math.floor(this.acc / STEP + SLACK);
      if (n <= 0) return 0;
      this.acc -= n * STEP;
      this.inBatch = true;
      try {
        while (n-- > 0) {
          ND.simClock = (ND.simClock || 0) + STEP;
          this.update(STEP);
          if (this.paused) { this.acc = 0; break; } // paused from inside the step (tutorial, coach, runner)
        }
      } finally { this.inBatch = false; }
      if (this.mode !== 'attract' && this.phase !== 'select' && this.phase !== 'vs' && this.phase !== 'ending' && this.phase !== 'replay') this.hud();
      return 1;
    },

    // ---------------------------------------------------- çizim
    // Işık katmanı yalnız dövüşçünün kutusu kadar küçük bir tuvalde (tam ekran tuvalin anlık görüntüsü her karede
    // kopyalanmasın); tuval yalnız büyür, her karede yeniden boyutlanmaz
    drawLit(f, drawFn, fx0) {
      const b = fx0 || f.bounds();
      let sx0 = Math.floor(cam.sx(b[0])), sy0 = Math.floor(cam.sy(b[1])), sx1 = Math.ceil(cam.sx(b[2])), sy1 = Math.ceil(cam.sy(b[3]));
      sx0 = Math.max(0, sx0); sy0 = Math.max(0, sy0); sx1 = Math.min(cam.W, sx1); sy1 = Math.min(cam.H, sy1);
      const w = sx1 - sx0, h = sy1 - sy0;
      if (w <= 0 || h <= 0) return;
      growCanvas(lc, w, h);
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.globalCompositeOperation = 'source-over'; lctx.globalAlpha = 1;
      lctx.clearRect(0, 0, w, h);
      const k = cam.k;
      lctx.setTransform(k, 0, 0, k, cam.W / 2 - cam.x * k + cam.shx - sx0, cam.gy - cam.y * k + cam.shy - sy0);
      drawFn(lctx);
      scene.lightFighter(lctx, f, b[0], b[1], b[2], b[3]);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(lc, 0, 0, w, h, sx0, sy0, w, h);
    },

    render() {
      if (this.phase === 'select' || this.phase === 'vs' || this.phase === 'ending') { this.renderScene(false); this.post(); this.renderSelect(); return; }
      if (this.phase === 'replay') { this.renderReplay(); this.post(); return; }
      this.renderScene(true);
      this.post();
    },

    renderScene(withFighters) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      scene.drawBack(ctx);
      if (!withFighters) { scene.drawFront(ctx); PM('front'); return; }
      if (this.dim > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(0,0,0,${this.dim * 0.55})`; ctx.fillRect(0, 0, cam.W, cam.H); }
      cam.world(ctx);
      ctx.save(); ctx.globalAlpha = scene.theme.reflect; ctx.transform(1, 0, 0, -0.55, 0, 0);
      for (const f of F) f.draw(ctx, true);
      ctx.restore();
      PM('reflect');
      for (const f of F) f.drawShadow(ctx);
      if (ND.settings.hq) this.castShadows();
      PM('shadows');
      scene.drawWeather(ctx, false);
      cam.world(ctx);
      for (const p of this.projs) p.draw(ctx);
      // çizim sırası (karede dizi ayırmadan)
      const swap = f1.dead ? false : f2.dead ? true : f1.state === 'atk' && f2.state !== 'atk';
      ORD[0] = swap ? f2 : f1; ORD[1] = swap ? f1 : f2;
      cam.world(ctx);
      for (const f of ORD) f.drawGhosts(ctx);
      PM('weather+ghosts');
      for (const f of ORD) this.drawLit(f, f._litFn || (f._litFn = (c) => f.draw(c, false)));
      PM('fighters');
      cam.world(ctx);
      for (const f of ORD) if (!f.dead && !f.hidden) ND.eyeGlow?.(ctx, f.j, f.col, f.ch.acc);
      fx.draw(ctx);
      if (ND.specialFx) { ctx.save(); cam.world(ctx); ND.specialFx.draw(ctx); ctx.restore(); }
      PM('fx');
      scene.drawFront(ctx);
      PM('front');
      fx.drawTexts(ctx);
      score.drawPops(ctx);
      this.drawPrompts();
      this.overlays();
      PM('hud');
    },

    // Fenerlerin yere düşürdüğü uzun gölgeler. Dövüşçü karede bir kez, yere basık (y × −0.13) siyah bir silüet olarak
    // küçük bir tuvale yarım çözünürlükte çizilir (büyütülürken gelen yumuşaklık eski blur(1.5px) yerine geçer);
    // her ışık için bu silüet yalnız eğilerek basılır — ctx.filter ve ışık başına yeniden vektör çizimi yok.
    // Silüet parçaları ışığın opaklığıyla üst üste bindirilir: eski çizim başına süzgeçteki koyu örtüşmeler korunur.
    castShadows() {
      const lights = scene.lights();
      for (const f of F) {
        if (f.hidden) continue;
        const x = f.dead ? f.rag.p.hip.x : f.x;
        let amax = 0, n = 0;
        for (const L of lights) {
          if (L.shadow === false) continue; // gölge düşürmeyen ışık (ör. çarşının tavan feneri)
          const d = Math.abs(x - L.x);
          if (d > 700) continue;
          const a = 0.42 * (1 - d / 700) * L.f;
          SHA[n++] = a; if (a > amax) amax = a;
        }
        if (!n || amax <= 0.002) continue;
        const b = f.bounds(), sc = cam.k * SH_RES, P = 2;
        const u0 = -0.13 * b[3], u1 = -0.13 * b[1]; // basık uzayda (u = −0.13·y) dikey aralık
        const w = Math.ceil((b[2] - b[0]) * sc) + P * 2, h = Math.ceil((u1 - u0) * sc) + P * 2;
        if (w < 3 || h < 3) continue;
        growCanvas(shc, w, h);
        shx.setTransform(1, 0, 0, 1, 0, 0); shx.globalCompositeOperation = 'source-over'; shx.globalAlpha = 1;
        shx.clearRect(0, 0, w, h);
        shx.setTransform(sc, 0, 0, -0.13 * sc, P - b[0] * sc, P - u0 * sc);
        shx.globalAlpha = amax;
        f.draw(shx, true);
        shx.setTransform(1, 0, 0, 1, 0, 0); shx.globalAlpha = 1;
        shx.globalCompositeOperation = 'source-in'; shx.fillStyle = '#000'; shx.fillRect(0, 0, w, h);
        shx.globalCompositeOperation = 'source-over';
        let i = 0;
        for (const L of lights) {
          if (L.shadow === false) continue;
          const d = Math.abs(x - L.x);
          if (d > 700) continue;
          const k = clamp((x - L.x) / 260, -2.6, 2.6), a = SHA[i++];
          // dünya (px, y) → (px − k·y, 2 − 0.13·y)  ≡  basık (px, u) → (px + k/0.13·u, 2 + u)
          cam.world(ctx);
          ctx.globalAlpha = a / amax;
          ctx.transform(1, 0, k / 0.13, 1, 0, 2);
          ctx.drawImage(shc, 0, 0, w, h, b[0] - P / sc, u0 - P / sc, w / sc, h / sc);
        }
        ctx.globalAlpha = 1;
      }
    },
    // Işıma (bloom) + film greni
    post() {
      if (!ND.settings.hq) return;
      const bw = Math.max(1, cam.W >> 2), bh = Math.max(1, cam.H >> 2);
      if (bc.width !== bw || bc.height !== bh) { bc.width = bc2.width = bw; bc.height = bc2.height = bh; }
      bx.globalCompositeOperation = 'copy'; bx.globalAlpha = 1; bx.drawImage(cv, 0, 0, bw, bh);
      bx.globalCompositeOperation = 'multiply'; bx.drawImage(bc, 0, 0); bx.drawImage(bc, 0, 0);
      b2.globalCompositeOperation = 'copy';
      if (HAS_FILTER) b2.filter = 'blur(5px)';
      b2.drawImage(bc, 0, 0);
      if (HAS_FILTER) b2.filter = 'none';
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = scene.theme.bloom ?? 0.5;
      ctx.drawImage(bc2, 0, 0, cam.W, cam.H);
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07;
      ctx.translate((Math.random() * 128) | 0, (Math.random() * 128) | 0);
      ctx.fillStyle = grainPat; ctx.fillRect(-128, -128, cam.W + 128, cam.H + 128);
      ctx.restore();
      PM('post');
    },

    overlays() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (this.slow < 0.95 && this.phase === 'ko') { ctx.fillStyle = `rgba(90,8,12,${(1 - this.slow) * 0.16})`; ctx.fillRect(0, 0, cam.W, cam.H); }
      if (this.bars > 0.01) {
        const h = cam.H * 0.085 * this.bars;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cam.W, h); ctx.fillRect(0, cam.H - h, cam.W, h);
      }
    },

    renderReplay() {
      const R = this.replay, s = this.rec[Math.min(R.to, Math.floor(R.i))];
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      scene.drawBack(ctx);
      if (s) {
        cam.world(ctx);
        for (const fs of s.fs) { if (fs.hidden) continue; ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(fs.x, 3, 44, 7, 0, 0, 6.283); ctx.fill(); }
        for (const p of s.projs) { const o = Object.assign(Object.create(ND.Shuriken.prototype), p); o.draw(ctx); }
        s.fs.forEach((fs, i) => { const f = F[i]; const save = f.ghosts; f.ghosts = fs.ghosts; f.drawGhosts(ctx); f.ghosts = save; });
        s.fs.forEach((fs, i) => {
          if (fs.hidden) return;
          const f = F[i];
          const b = [fs.x - 200, -320, fs.x + 200, 40];
          this.drawLit({ x: fs.x, flash: fs.flash }, (c) => this.drawSnapFighter(c, fs, f), b);
        });
        cam.world(ctx);
        s.fs.forEach((fs, i) => { if (!fs.hidden && !fs.dead) ND.eyeGlow?.(ctx, fs.j, F[i].col, F[i].ch.acc); });
        fx.draw(ctx);
      }
      scene.drawFront(ctx);
      fx.drawTexts(ctx);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = 'rgba(70,50,30,.18)'; ctx.fillRect(0, 0, cam.W, cam.H);
      for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`; ctx.fillRect(Math.random() * cam.W, Math.random() * cam.H, 2, 2); }
      this.bars = 1; this.overlays();
    },

    hud() {
      for (let i = 0; i < 2; i++) {
        const f = F[i], n = i + 1;
        sx($('h' + n), f.hp / f.maxHp); sx($('g' + n), f.ghost / f.maxHp);
        const pw = Math.min(100, f.posture) + '%', pe = $('p' + n);
        if (pe._w !== pw) { pe.style.width = pw; pe._w = pw; }
        $('pb' + n).classList.toggle('hot', f.posture > 70);
        $('hpb' + n).classList.toggle('low', f.hp > 0 && f.hp / f.maxHp < 0.25);
        sx($('k' + n), f.ki / 100);
        $('kb' + n).classList.toggle('full', f.ki >= 100);
        const am = $('a' + n), cap = Math.max(f.ch.ammo, f.ammo), key = f.ammo + '/' + cap;
        if (am._n !== key) { am._n = key; am.innerHTML = Array.from({ length: cap }, (_, k) => `<b class="${k < f.ammo ? 'on' : ''}"></b>`).join(''); }
        [...$('w' + n).children].forEach((b, k) => b.classList.toggle('on', k < this.wins[i]));
      }
      const tt = this.mode === 'train' ? '∞' : Math.ceil(this.timer), te = $('timer');
      if (te._t !== tt) { te._t = tt; te.textContent = tt; $('clock').classList.toggle('urgent', tt <= 10); }
      if (this._touchOn) this.touchHud();
    },

    // ---------------------------------------------------- seçim ekranı
    // Modlar: '2p', 'cpu', 'arcade' (tek slot), 'train' (slot 2 = kukla), 'tutorial' (tek slot)
    openSelect(mode) {
      this.selMode = mode; this.phase = 'select'; this.pt = 0;
      this.sel.ready = [false, false];
      this.ais = []; F.forEach((f) => (f.locked = true));
      au.quiet = false; this.paused = false;
      const S = this.sel, SS = STR.sel || {}, solo1 = !!RUN_MODES[mode] || mode === 'tutorial';
      this.hideOverlays();
      $('menu').hidden = true; $('hud').hidden = true; $('select').hidden = false; $('pauseBtn').hidden = true;
      this.syncTouch();
      $('slot2').hidden = solo1; $('selVs').hidden = solo1; $('selGrid').classList.toggle('solo', solo1);
      $('arenaRow').hidden = !!RUN_MODES[mode];
      const rv = mode === 'rival' && ND.rival ? ND.CHARS.find((c) => c.id === ND.rival.target) : null;
      $('selTitle').textContent = rv && STR.rival ? STR.rival.selTitle(rv.name) : tx((SS.title && SS.title[mode]) || 'Ninjanı seç');
      this.selTexts();
      $('bFight').textContent = tx(SS.go ? SS.go[mode] || SS.go.def : 'Dövüşe başla');
      this.trialOffer(null);
      this.closeMoves();
      // hazır bir meydan okuma varsa seçim ekranında da kabul düğmesi (meydan okuma / eğitim / 2P hariç)
      const rd = ND.save && ND.save.readyRivals && !{ rival: 1, tutorial: 1, '2p': 1 }[mode] ? ND.save.readyRivals()[0] : null;
      this.challengeOffer(rd ? rd.id : null);
      // kilitli seçimleri düzelt
      const open = visibleChars().filter(charOk);
      for (let i = 0; i < 2; i++) if (!charOk(this.sel.c[i])) S.c[i] = open[Math.min(i, open.length - 1)];
      if (S.arena !== 'random' && (!arenaOk(S.arena) || !ND.ARENAS.some((a) => a.id === S.arena))) S.arena = 'temple';
      this.ensurePv(); this.pvIds = solo1 ? ['pv1', null] : ['pv1', 'pv2'];
      this.pv.forEach((pv) => (pv.pvPose = null));
      if (scene.themeId !== S.arena && S.arena !== 'random') scene.setTheme(S.arena);
      this.buildRoster(); this.buildArenas();
      this.refreshSelect();
      mu.setMode('menu');
      setTimeout(() => $('bFight').focus(), 0);
    },
    buildRoster() {
      const SS = STR.sel || {};
      for (let i = 0; i < 2; i++) {
        const ro = $('ro' + (i + 1));
        ro.innerHTML = '';
        // 10'dan fazla ninja: iki dengeli satır (dar ekranda da parmak boyu kalsın)
        const nVis = visibleChars().length;
        ro.style.setProperty('--rc', String(nVis <= 10 ? nVis : Math.ceil(nVis / 2)));
        visibleChars().forEach((k) => {
          const ch = ND.CHARS[k], locked = !charOk(k), b = document.createElement('button');
          b.type = 'button'; b.dataset.k = k;
          // kilitli kart: onur çubuğu ya da "meydan okumaya hazır" işareti
          const ri = locked && ND.save && ND.save.rivalInfo ? ND.save.rivalInfo(ch.id) : null;
          const mark = !ri ? '' : ri.ready ? '<i class="rdyb" aria-hidden="true">挑</i>' : `<i class="rbar" aria-hidden="true" style="--p:${(ND.honor ? ND.honor.pct(ch.id) * 100 : 0).toFixed(0)}%"></i>`;
          b.innerHTML = `<b style="color:${locked && !(ri && ri.ready) ? 'inherit' : ch.col.ui}">${ch.kanji}</b><span>${ch.name}</span>` + (locked ? '<i class="lk" aria-hidden="true"></i>' : '') + mark;
          if (locked) {
            const hint = ND.save ? ND.save.charHint(ch.id) : '';
            b.className = 'locked' + (ri && ri.ready ? ' chal' : ''); b.setAttribute('aria-disabled', 'true');
            b.setAttribute('aria-label', ch.name + ' · ' + tx(SS.locked || 'Kilitli') + ' · ' + hint); b.title = hint;
            b.onclick = () => this.lockInfo(i, k);
          } else {
            b.setAttribute('aria-label', ch.name);
            b.onclick = () => { this.sel.c[i] = k; this.sel.ready[i] = false; au.ui(); if (i === 0) this.trialOffer(null); this.refreshSelect(); };
          }
          ro.appendChild(b);
        });
      }
    },
    buildArenas() {
      const box = $('arenaChips'), SS = STR.sel || {};
      box.innerHTML = '';
      const add = (id, html, locked, hint) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip' + (locked ? ' locked' : ''); b.dataset.arena = id; b.innerHTML = html;
        if (locked) {
          b.setAttribute('aria-disabled', 'true'); b.title = hint;
          b.onclick = () => this.lockMsg('selHint', hint);
        } else b.onclick = () => { this.sel.arena = id; au.ui(); if (id !== 'random') scene.setTheme(id); this.refreshSelect(); };
        box.appendChild(b);
      };
      for (const a of ND.ARENAS) {
        const locked = !arenaOk(a.id), hint = ND.save ? ND.save.arenaHint(a.id) : '';
        add(a.id, `<b>${a.kanji}</b>${a.name}` + (locked ? '<i class="lk" aria-hidden="true"></i>' : ''), locked, SS.lockMsg ? SS.lockMsg(a.name, hint) : hint);
      }
      add('random', tx(SS.random || 'Rastgele'), false);
    },
    // Rewarded ad: try a locked ninja for one CPU fight. k = roster index, or null to hide the offer.
    trialOffer(k) {
      const b = $('bTrial'); if (!b) return;
      const ok = k != null && this.selMode === 'cpu' && ND.ads && ND.ads.rewardedAvailable() && !!ND.CHARS[k];
      b.hidden = !ok;
      if (!ok) return;
      const A = STR.ads || {}, ch = ND.CHARS[k];
      b.innerHTML = '';
      const sp = document.createElement('span'); sp.textContent = A.trial ? A.trial(ch.name) : ch.name;
      const sm = document.createElement('small'); sm.textContent = A.trialSub || '';
      b.append(sp, sm);
      b.onclick = () => {
        if (ND.ads.busy) return;
        ND.ads.rewarded().then((got) => {
          if (!got) { if (ND.toast) ND.toast(A.fail || '', '忍'); return; }
          if (this.phase !== 'select') return;
          this.trialPrev = this.sel.c[0]; ND._trial = ch.id;
          this.sel.c[0] = k; b.hidden = true;
          this.start('cpu', { c1: k, c2: this.sel.c[1], arena: this.sel.arena });
        });
      };
    },
    // Kilitli ninja kartı: gereksinim + onur çubuğu açıklama alanında; hazırsa meydan okuma düğmesi, reklam varsa deneme
    lockInfo(i, k) {
      const ch = ND.CHARS[k], SS = STR.sel || {}, sd = $('sd' + (i + 1)); if (!ch || !sd) return;
      const hint = ND.save ? ND.save.charHint(ch.id) : '', ri = ND.save && ND.save.rivalInfo ? ND.save.rivalInfo(ch.id) : null;
      au.tick(0);
      sd.textContent = SS.lockMsg ? SS.lockMsg(ch.name, hint) : hint;
      sd.classList.add('lockmsg');
      if (ri && !ri.ready && !ri.unlocked && ND.honor) sd.insertAdjacentHTML('beforeend', ND.honor.bar(ND.honor.pct(ch.id)));
      if (i === 0) {
        this.trialOffer(k);
        if (ri && ri.ready && !ri.unlocked && this.selMode !== 'rival' && this.selMode !== '2p') this.challengeOffer(ch.id);
      }
      clearTimeout(this._lmT);
      this._lmT = setTimeout(() => { if (this.phase === 'select') { this.selTexts(); this.refreshSelect(); } }, 5000);
    },
    // Meydan okuma düğmesi (#bChallenge): id = hazır rakip, null = gizle
    challengeOffer(id) {
      const b = $('bChallenge'); if (!b) return;
      const ch = id && ND.rival ? ND.CHARS.find((c) => c.id === id) : null;
      b.hidden = !ch;
      if (!ch) return;
      const R = STR.rival || {};
      b.textContent = '';
      const sp = document.createElement('span'); sp.textContent = R.accept || '';
      const sm = document.createElement('small'); sm.textContent = R.acceptSub ? R.acceptSub(ch.name) : ch.name;
      const kj = document.createElement('b'); kj.className = 'k'; kj.textContent = ch.kanji; kj.style.color = ch.col.ui; kj.setAttribute('aria-hidden', 'true');
      b.append(kj, sp, sm);
      b.onclick = () => { if (this.phase !== 'select') return; persist(); au.taiko(0.8); ND.rival.begin(this.sel.c[0], ch.id); };
    },
    // Hareketler paneli (#movesOv): seçili ninjanın hareket listesi (ND.MOVELIST varsa ondan)
    fillMoves() {
      const ch = ND.CHARS[this.sel.c[0]]; if (!ch || !ND.training || !ND.training.movesHtml || !$('mvList')) return false;
      const SS = STR.sel || {};
      $('mvK').textContent = ch.kanji; $('mvK').style.color = ch.col.ui;
      $('mvTitle').textContent = SS.movesOf ? SS.movesOf(ch.name) : ch.name;
      $('mvList').innerHTML = ND.training.movesHtml(ch);
      return true;
    },
    openMoves() {
      const ov = $('movesOv'); if (!ov || !this.fillMoves()) return;
      ov.hidden = false; au.ui();
      setTimeout(() => $('mvClose').focus(), 0);
    },
    closeMoves(focus) {
      const ov = $('movesOv'); if (!ov || ov.hidden) return false;
      ov.hidden = true;
      if (focus) setTimeout(() => $('bMoves') && $('bMoves').focus(), 0);
      return true;
    },
    get movesOpen() { const ov = $('movesOv'); return !!ov && !ov.hidden; },
    // Kilitli öğeye tıklanınca kısa süreli açıklama
    lockMsg(id, text) {
      const el = $(id); if (!el) return;
      au.tick(0);
      el.classList.add('lockmsg'); el.textContent = text;
      clearTimeout(this._lmT);
      this._lmT = setTimeout(() => {
        if (this.phase !== 'select') return;
        this.selTexts();
        this.refreshSelect();
      }, 2600);
    },
    // Seçim ekranı yönergeleri: dokunmatikte tuş harfleri yerine dokunma metni, klavye ipucu gizli
    selTexts() {
      const SS = STR.sel || {}, TS = (STR.touch && STR.touch.sel) || {}, mode = this.selMode, t = tOn() && mode !== '2p';
      $('who1').textContent = t && TS.who1 ? TS.who1 : SS.who1 ? SS.who1[mode] || SS.who1.def : '';
      $('who2').textContent = t && TS.who2 ? (mode === 'train' ? TS.who2train : TS.who2) : SS.who2 ? SS.who2[mode] || SS.who2.cpu : '';
      $('selHint').innerHTML = t ? '' : SS.keyHint || ''; $('selHint').classList.remove('lockmsg');
    },
    // Dokunmatik kumanda görünürlüğü + dik ekran uyarısı (her karede; yalnız değişince DOM'a dokunur)
    syncTouch() {
      const T = tOn(), app = $('app');
      // "playing" (portrait → turn-your-phone hint) only while a match is on screen: select, VS, end and ending
      // screens stay usable in portrait
      const playing = this.mode !== 'attract' && !!ROT_PHASES[this.phase];
      const rot = T && playing && PORTRAIT.matches;
      if (playing !== this._playing) { this._playing = playing; app.classList.toggle('playing', playing); }
      // dokunmatik dövüşte kamera: zemin biraz yukarıda, yanlarda ek pay (düğmeler dövüşçüleri daha az örter)
      const camT = T && !!TOUCH_MODES[this.mode];
      if (camT !== this._camT) { this._camT = camT; cam.gyK = camT ? 0.48 : 0.6; cam.padX = camT ? 80 : 0; }
      if (rot && !this.paused && (this.phase === 'fight' || this.phase === 'intro')) setPause(true);
      // stays drawn under the pause dialog (dimmed, not touchable) so size / layout / hand changes show at once
      const on = T && !!TOUCH_MODES[this.mode] && !!TOUCH_PHASES[this.phase] && !this.replay && !rot;
      if (on !== this._touchOn) {
        this._touchOn = on; $('touch').hidden = !on;
        if (on) this.touchHud(true); else input.touchReset();
      }
    },
    // KI düğmesi (dolunca parlar) + shuriken sayısı
    touchHud(force) {
      const b = $('tKi'), am = $('tAmmo'); if (!b) return;
      const k = Math.min(100, Math.floor(f1.ki));
      if (force || b._k !== k) { b._k = k; b.style.setProperty('--ki', (k / 100).toFixed(2)); b.classList.toggle('ready', k >= 100); }
      if (am && (force || am._n !== f1.ammo)) { am._n = f1.ammo; am.textContent = f1.ammo; am.parentNode.classList.toggle('empty', f1.ammo <= 0); }
    },
    refreshSelect() {
      const S = this.sel;
      for (let i = 0; i < 2; i++) {
        const ch = ND.CHARS[S.c[i]], n = i + 1, alt = i === 1 && S.c[0] === S.c[1];
        const col = alt ? ch.alt : ch.col;
        $('sn' + n).textContent = ch.name; $('sk' + n).textContent = ch.kanji; $('sk' + n).style.color = col.ui;
        $('st' + n).textContent = ch.title + ' · ' + ch.weapon; $('sd' + n).textContent = ch.desc; $('sd' + n).classList.remove('lockmsg');
        if (i === 0 && this.movesOpen) this.fillMoves();
        // ninjaya özel ipuçları (roster2.js: STR.roster2.notes) açıklamanın altında
        const notes = STR.roster2 && STR.roster2.notes && STR.roster2.notes[ch.id];
        if (Array.isArray(notes)) notes.forEach((t) => { const s = document.createElement('small'); s.className = 'cnote'; s.textContent = t; $('sd' + n).appendChild(s); });
        const lab = { hiz: tx('Hız'), guc: tx('Güç'), menzil: tx('Menzil'), can: tx('Can') };
        $('sb' + n).innerHTML = Object.keys(lab).map((k) => `<dt>${lab[k]}</dt><dd>${[1, 2, 3, 4, 5].map((v) => `<i class="${v <= ch.stats[k] ? 'on' : ''}"></i>`).join('')}</dd>`).join('');
        $('slot' + n).style.setProperty('--sc', col.ui);
        $('slot' + n).classList.toggle('ready', S.ready[i]);
        const pv = this.pv[i]; pv.setChar(ch, alt); pv.reset(0); pv.dir = i === 0 ? 1 : -1;
        [...$('ro' + n).children].forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.k === S.c[i])));
      }
      document.querySelectorAll('#arenaChips [data-arena]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.arena === S.arena)));
    },
    cycle(i, d) {
      const list = visibleChars().filter(charOk); if (!list.length) return;
      const k = list.indexOf(this.sel.c[i]);
      this.sel.c[i] = list[k < 0 ? 0 : (k + d + list.length) % list.length];
      this.sel.ready[i] = false; au.ui(); this.refreshSelect();
    },
    confirm(i) {
      this.sel.ready[i] = true; au.taiko(0.5); this.refreshSelect();
      if (this.sel.ready[0] && (this.selMode !== '2p' || this.sel.ready[1])) setTimeout(() => { if (this.phase === 'select') this.fightFromSelect(); }, 350);
    },
    fightFromSelect() {
      const S = this.sel, m = this.selMode;
      persist();
      if (m === 'arcade') { au.taiko(0.8); return ND.arcade.begin(S.c[0]); }
      if (m === 'tourney' && ND.banzuke) { au.taiko(0.8); return ND.banzuke.tourney.begin(S.c[0]); }
      if (m === 'dan' && ND.banzuke) { au.taiko(0.8); return ND.banzuke.danRun.begin(S.c[0]); }
      if (m === 'rival' && ND.rival) { au.taiko(0.8); return ND.rival.begin(S.c[0]); }
      au.gong();
      if (m === 'tutorial' || m === 'train') {
        let c2 = S.c[1];
        if (m === 'tutorial') { const kuro = ND.CHARS.findIndex((c) => c.id === 'kuro'); c2 = kuro >= 0 && kuro !== S.c[0] ? kuro : ND.CHARS.findIndex((c) => c.id === 'akane'); }
        return ND.training.begin(S.c[0], c2, S.arena, m === 'tutorial');
      }
      this.start(m, { c1: S.c[0], c2: S.c[1], arena: S.arena });
    },
    updateSelect(rdt) {
      for (const pv of this.pv) {
        pv.st += rdt;
        const tp = ND.pose.copy(ND.POSES[pv.pvPose] || (pv.P && pv.P.stance) || ND.POSES.stance, pv.tmp);
        const t = scene.t + pv.id * 1.3;
        tp.hy += Math.sin(t * 2.3) * 1.3; tp.ay += Math.sin(t * 2.3 + 0.6) * 1.6; tp.sw += Math.sin(t * 1.15) * 0.035;
        ND.pose.approach(pv.pose, tp, pv.pvPose ? 4 : 10, rdt);
        pv.solve(rdt);
      }
    },
    renderSelect() {
      for (let i = 0; i < 2; i++) {
        const id = this.pvIds[i], c = id && $(id), pv = this.pv[i];
        if (!c) continue;
        const r = c.getBoundingClientRect(), dpr = Math.min(this.dprCap || 2, window.devicePixelRatio || 1);
        if (r.width < 2 || r.height < 2) continue;
        const pc = c.getContext('2d');
        const W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
        if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
        pc.setTransform(1, 0, 0, 1, 0, 0); pc.clearRect(0, 0, W, H);
        const g = pc.createRadialGradient(W / 2, H * 0.62, 10, W / 2, H * 0.62, H * 0.6);
        g.addColorStop(0, pv.col.ui + '55'); g.addColorStop(1, 'rgba(0,0,0,0)');
        pc.fillStyle = g; pc.fillRect(0, 0, W, H);
        const k = H / 245;
        pc.setTransform(k, 0, 0, k, W / 2 - (pv.ch.blade > 110 ? 20 : 0) * k * pv.dir, H * 0.9);
        pc.fillStyle = 'rgba(0,0,0,.45)'; pc.beginPath(); pc.ellipse(0, 3, 50, 7, 0, 0, 6.283); pc.fill();
        pv.draw(pc, false);
        ND.eyeGlow?.(pc, pv.j, pv.col, pv.ch.acc);
      }
    },
  };
  function sx(el, v) { const s = `scaleX(${Math.max(0, v).toFixed(3)})`; if (el._s !== s) { el.style.transform = s; el._s = s; } }

  // ---------------------------------------------------------------- UI bağlantıları
  function persist() {
    const id = (i) => (ND.CHARS[i] ? ND.CHARS[i].id : i);
    const hq = hqAutoOff && hqUser ? true : ND.settings.hq;
    // merged into what is stored, so settings kept by other files (touch controls: key "touch", js/touch.js) survive
    store.set(Object.assign(store.get(), { sound: ND.settings.sound, bloodOptIn: ND.settings.blood, music: ND.settings.music, hints: ND.settings.hints, hq, hqUser, level: game.level, c1: id(game.sel.c[0]), c2: id(game.sel.c[1]), arena: game.sel.arena }));
  }
  function unlockAudio() { au.init(); au.setEnabled(ND.settings.sound); mu.init(); mu.setEnabled(ND.settings.music); if (mu.mode === 'off') mu.setMode(game.phase === 'fight' ? 'fight' : 'menu'); }
  function choose(mode) { unlockAudio(); au.ui(); if (mode === 'watch') { au.quiet = false; game.start('watch'); } else game.openSelect(mode); }
  function goMenu() { game.start('attract'); mu.setMode('menu'); if ($('first')) $('first').hidden = true; refreshPlay(); setTimeout(() => $('mplay').focus(), 0); }
  // PLAY: straight into a fight against the CPU with the last ninja (first visit: Akane vs an Apprentice, with 3 tips)
  function quickPlay(first) {
    unlockAudio(); au.ui();
    const open = visibleChars().filter(charOk);
    const akane = ND.CHARS.findIndex((c) => c.id === 'akane');
    const c1 = first && akane >= 0 ? akane : charOk(game.sel.c[0]) ? game.sel.c[0] : open[0];
    const pool = open.filter((i) => i !== c1 && !ND.CHARS[i].hidden);
    const c2 = first ? (ND.CHARS.findIndex((c) => c.id === 'aoi') >= 0 ? ND.CHARS.findIndex((c) => c.id === 'aoi') : pool[0]) : pool[(Math.random() * pool.length) | 0] ?? open[0];
    if (first) {
      game.level = 0;
      document.querySelectorAll('.seg[data-lv]').forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.lv === 0)));
      if (ND.save) { ND.save.p.firstDone = true; ND.save.commit(); }
    }
    game.sel.c[0] = c1; game.sel.c[1] = c2;
    persist();
    if ($('first')) $('first').hidden = true;
    au.gong();
    game.start('cpu', { c1, c2, arena: first ? 'temple' : 'random' });
    if (first && ND.coach) ND.coach.start();
  }
  game.quickPlay = quickPlay;
  function refreshPlay() {
    const el = $('playSub'), M = STR.menu || {};
    if (!el) return;
    const c = ND.CHARS[charOk(game.sel.c[0]) ? game.sel.c[0] : 0], lv = ND.AI_LEVELS[game.level] || ND.AI_LEVELS[1];
    el.textContent = M.playSub ? M.playSub(c.name[0] + c.name.slice(1).toLowerCase(), lv.name) : '';
  }
  game.refreshPlay = refreshPlay;
  game.goMenu = goMenu;
  // Seçim ekranından geri: turnuva/Dan lobisine, diğerleri ana menüye
  function selBack() {
    const m = game.selMode;
    if ((m === 'tourney' || m === 'dan') && ND.banzuke) { goMenu(); if (m === 'tourney') ND.banzuke.ui.lobbyTourney(); else ND.banzuke.ui.lobbyDan(); return; }
    goMenu();
  }
  function setPause(v) {
    if (game.mode === 'attract' || game.phase === 'end' || game.phase === 'select' || game.phase === 'replay' || game.phase === 'vs' || game.phase === 'ending') return;
    game.paused = v; $('pause').hidden = !v;
    const br = $('bRestart'); if (br) br.hidden = !!(game.runner && game.runner.noRestart && game.mode === game.runner.mode);
    if (v) { input.p1.clear(); input.p2.clear(); input.touchReset(); $('bResume').focus(); }
    else { input.p1.buf = {}; input.p2.buf = {}; } // presses made in the pause menu must not fire on resume
    game.syncTouch();
  }
  // Rol=button kartlar (içinde ek düğmeler olan mod kartları)
  const card = (id, fn) => {
    const el = $(id); if (!el) return;
    el.onclick = fn;
    el.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === el) { e.preventDefault(); fn(); } };
  };

  // Yalnız dokunmatik cihazda iki oyuncu pratik değil: klavye/gamepad görülene dek kibarca uyar
  const twoPOk = () => !ND.touch || ND.touch.twoPlayerOk();
  const mark2p = () => { const m = $('m2p'); if (m) m.classList.toggle('needkb', !twoPOk()); };
  $('m2p').onclick = () => {
    if (!twoPOk()) { unlockAudio(); au.tick(0); const T = STR.touch || {}; ND.toast?.(T.need2pToast || T.need2p || '', '忍'); mark2p(); return; }
    choose('2p');
  };
  $('mwatch').onclick = () => choose('watch');
  $('mplay').onclick = () => quickPlay(false);
  if ($('fPlay')) $('fPlay').onclick = () => quickPlay(true);
  if ($('fMenu')) $('fMenu').onclick = () => { unlockAudio(); au.ui(); if (ND.save) { ND.save.p.firstDone = true; ND.save.commit(); } $('first').hidden = true; $('menu').hidden = false; refreshPlay(); setTimeout(() => $('mplay').focus(), 0); };
  // Sıralama: menünün üstünde açılır (arka planda gösteri maçı sürer); kapatınca menüye döner
  $('mlb').onclick = () => {
    unlockAudio(); au.ui();
    if (ND.banzuke) return ND.banzuke.ui.showHall('week', null);
    if (!ND.lbUI) return;
    $('menu').hidden = true;
    ND.lbUI.show(null, { back: () => { if (game.mode === 'attract') { $('menu').hidden = false; setTimeout(() => $('mlb').focus(), 0); } else goMenu(); } });
  };
  $('marcade').onclick = () => choose('arcade');
  // Rekabet kartları (banzuke.js yoksa gizli)
  ['mtour', 'mdan'].forEach((id) => { const el = $(id); if (el && !ND.banzuke) el.hidden = true; });
  if ($('mtour')) $('mtour').addEventListener('click', unlockAudio);
  if ($('mdan')) $('mdan').addEventListener('click', unlockAudio);
  card('mcpu', () => choose('cpu'));
  card('mtrain', () => choose('train'));
  $('mtFree').onclick = (e) => { e.stopPropagation(); choose('train'); };
  $('mtTut').onclick = (e) => { e.stopPropagation(); choose('tutorial'); };
  document.querySelectorAll('.seg[data-lv]').forEach((b) => {
    b.setAttribute('aria-pressed', String(+b.dataset.lv === game.level));
    b.onclick = (e) => {
      e.stopPropagation(); game.level = +b.dataset.lv; persist(); unlockAudio(); au.ui(); refreshPlay();
      document.querySelectorAll('.seg[data-lv]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    };
  });
  const toggles = { tSound: 'sound', tBlood: 'blood', tMusic: 'music', tHints: 'hints', tHq: 'hq' };
  for (const id in toggles) {
    const key = toggles[id], el = $(id);
    el.setAttribute('aria-pressed', String(ND.settings[key]));
    el.onclick = () => {
      ND.settings[key] = !ND.settings[key]; el.setAttribute('aria-pressed', String(ND.settings[key]));
      if (key === 'hq') { hqUser = true; hqAutoOff = false; perf.done = true; drsReset(); } // elle seçim: otomatik ayar bir daha karışmaz; çözünürlük baştan ölçülür
      unlockAudio(); persist();
      if (key === 'blood' && !ND.settings.blood) fx.decals.length = 0;
    };
  }
  if (!(ND.bloodAllowed && ND.bloodAllowed())) { const tb = $('tBlood'); if (tb) tb.hidden = true; }
  document.querySelectorAll('[data-slot]').forEach((b) => (b.onclick = () => game.cycle(+b.dataset.slot, +b.dataset.d)));
  $('bFight').onclick = () => game.fightFromSelect();
  if ($('bMoves')) $('bMoves').onclick = () => (game.movesOpen ? game.closeMoves(true) : game.openMoves());
  if ($('mvClose')) $('mvClose').onclick = () => game.closeMoves(true);
  if ($('movesOv')) $('movesOv').addEventListener('click', (e) => { if (e.target === $('movesOv')) game.closeMoves(true); });
  $('bBack').onclick = () => selBack();
  $('bResume').onclick = () => setPause(false);
  $('bRestart').onclick = () => {
    setPause(false);
    if (game.runner && game.mode === game.runner.mode && game.runner.run) return game.runner.retry();
    if (game.mode === 'train') return ND.training.reset();
    game.start(game.mode, { c1: game.sel.c[0], c2: game.sel.c[1], arena: scene.themeId });
  };
  $('bMenu').onclick = () => { setPause(false); if (game.runner && game.runner.abandon) game.runner.abandon(); goMenu(); };
  // Natural break between matches: maybe an interstitial first (ads.js decides), then act
  const afterBreak = (fn) => {
    if (ND.ads && ND.ads.busy) return;
    const lossOffer = !$('bContinue').hidden;
    if (!ND.ads || lossOffer) { if (ND.ads) ND.ads.offered = false; return fn(); }
    ND.ads.breakpoint().then(fn);
  };
  $('bRematch').onclick = () => afterBreak(rematch);
  function rematch() {
    unlockAudio();
    if (game.runner && game.mode === game.runner.mode && game.runner.run) return game.runner.primary();
    game.mode === 'watch' ? game.start('watch') : game.start(game.mode, { c1: game.sel.c[0], c2: game.sel.c[1], arena: game.sel.arena });
  };
  $('bChange').onclick = () => afterBreak(() => { unlockAudio(); game.mode === 'watch' ? goMenu() : game.openSelect(game.mode); });
  $('bEndMenu').onclick = () => afterBreak(() => { if (game.runner && game.mode === game.runner.mode && game.runner.run && game.runner.quit) return game.runner.quit(); goMenu(); });
  $('pauseBtn').onclick = () => setPause(!game.paused);
  cv.addEventListener('pointerdown', () => { if (game.phase === 'replay') game.finishReplay(); });

  input.onKey = (e) => {
    if (ND.reveal && ND.reveal.close && !e.repeat && ND.reveal.close()) return true; // yeni ninja tanıtımı: herhangi bir tuş kapatır
    if (ND.honor && ND.honor.roadOpen) { if (input.isBack(e)) { ND.honor.hideRoad(true); return true; } return false; }
    if (ND.lbUI && ND.lbUI.open) return ND.lbUI.onKey(e);
    if (ND.banzuke && ND.banzuke.onKey(e)) return true; // salon / lobi açıkken
    if (game.phase === 'replay' && !e.repeat) { game.finishReplay(); return true; }
    if ((game.phase === 'vs' || game.phase === 'ending') && (game.runner || ND.arcade)) return (game.runner || ND.arcade).onKey(e);
    if (game.phase === 'select') {
      if (game.movesOpen) { if ((input.isBack(e) || e.code === 'KeyM') && !e.repeat) { game.closeMoves(true); return true; } return false; }
      if (e.code === 'KeyM' && !e.repeat) { game.openMoves(); return true; }
      const map = { KeyA: [0, -1], KeyD: [0, 1], ArrowLeft: [1, -1], ArrowRight: [1, 1] };
      if (map[e.code] && !e.repeat) { if (map[e.code][0] === 0 || !$('slot2').hidden) game.cycle(...map[e.code]); return true; }
      if (e.code === 'KeyF' && !e.repeat) { game.confirm(0); return true; }
      if (e.code === 'KeyK' && !e.repeat && game.selMode === '2p') { game.confirm(1); return true; }
      if (input.isBack(e)) { selBack(); return true; }
      if (e.code === 'Enter' && !e.repeat) { game.fightFromSelect(); return true; }
      return false;
    }
    if (input.isPause(e)) { setPause(!game.paused); return true; }
    if (game.mode === 'train' && ND.training?.onKey(e)) return true;
    if (e.code === 'Enter' && !e.repeat && game.mode === 'attract' && (document.activeElement === document.body || !document.activeElement)) {
      if (!$('first').hidden || !$('menu').hidden) { quickPlay(!$('first').hidden); return true; }
    }
    return false;
  };
  input.onPause = () => setPause(!game.paused);
  // Gamepad ile menü dışı ekranlar: X/A onay, B geri, yön seçim
  input.onPad = (st, prev) => {
    if (ND.honor && ND.honor.roadOpen) {
      const p = (a) => st[a] && !prev[a];
      if (p('kick')) ND.honor.hideRoad(true);
      else if (p('light') || p('up')) { const b = document.querySelector('#honorOv [data-rival]'); if (b) b.click(); }
      return;
    }
    if (ND.lbUI && ND.lbUI.open) return ND.lbUI.onPad(st, prev);
    if (ND.banzuke && ND.banzuke.onPad(st, prev)) return;
    if ((game.phase === 'vs' || game.phase === 'ending') && game.runner && game.runner.onPad) return game.runner.onPad(st, prev);
    const pr = (a) => st[a] && !prev[a];
    if (game.phase === 'select' && game.selMode !== '2p') {
      if (game.movesOpen) { if (pr('kick') || pr('throw')) game.closeMoves(true); return; }
      if (pr('throw')) { game.openMoves(); return; }
      if (pr('heavy')) { const b = $('bChallenge'); if (b && !b.hidden) { b.click(); return; } }
      if (pr('left')) game.cycle(0, -1); else if (pr('right')) game.cycle(0, 1);
      if (pr('light') || pr('up')) game.confirm(0);
      if (pr('kick')) selBack();
    } else if (game.phase === 'vs' && ND.arcade) {
      if (pr('light') || pr('up')) ND.arcade.fight(); else if (pr('kick')) ND.arcade.quit();
    } else if (game.phase === 'ending' && ND.arcade) {
      if (pr('light') || pr('up') || pr('kick')) ND.arcade.quit();
    }
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  // iOS Safari: AudioContext yalnız touchend/click gibi "etkinleştiren" olaylarda açılır ve arka plandan dönünce
  // 'interrupted' kalabilir → çalışmıyorsa her dokunuş bırakılışında yeniden dene
  const gestureAudio = () => { if (!au.ctx || au.ctx.state !== 'running' || !mu.ready) unlockAudio(); };
  ['pointerup', 'touchend', 'click', 'keydown'].forEach((ev) => window.addEventListener(ev, gestureAudio, { capture: true, passive: true }));
  // Sekme/uygulama arka plana: dövüşü duraklat, basılı tuşları bırak, sesi askıya al
  let hiddenAt = 0;
  function onHide() {
    if (hiddenAt) return;
    hiddenAt = performance.now();
    if (game.phase === 'fight' || game.phase === 'intro') setPause(true);
    input.p1.clear(); input.p2.clear(); input.touchReset();
    try { if (au.ctx && au.ctx.state === 'running') au.ctx.suspend().catch(() => {}); } catch (e) { /* yok */ }
  }
  function onShow() {
    hiddenAt = 0;
    // iOS jest olmadan reddedebilir: o zaman ilk dokunuşta gestureAudio açar
    try { if (au.ctx && au.ctx.state !== 'running') au.ctx.resume().catch(() => {}); } catch (e) { /* yok */ }
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? onHide() : onShow()));
  window.addEventListener('pagehide', onHide);
  window.addEventListener('pageshow', () => { if (!document.hidden) onShow(); });
  // Dokunmatik ↔ klavye geçişi: açık ekranların metinleri, kumanda, 2P işareti
  if (ND.touch) ND.touch.onChange(() => {
    mark2p();
    if (game.phase === 'select') game.selTexts();
    game.syncTouch();
  });
  mark2p();

  // ---------------------------------------------------------------- başlat
  // Tuval çözünürlüğü = CSS boyutu × DPR (en çok 2) × dinamik ölçek (drs). Çok büyük ekranlarda (5K vb.)
  // arka tampon ~4K piksel sayısıyla sınırlanır; HUD DOM olduğundan her zaman keskin kalır.
  // Telefon/tablet: DPR en çok 1.5 (zayıf cihazda 1.25) ve ~2.2 MP; 3× ekranlarda tam çözünürlük pili ve kareyi yer.
  const MAX_PX = MOBILE ? 2.2e6 : 3840 * 2160, DPR_CAP = MOBILE ? (LOW_END ? 1.25 : 1.5) : 2;
  function resize() {
    const r = cv.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    let dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const px = r.width * r.height * dpr * dpr;
    if (px > MAX_PX) dpr *= Math.sqrt(MAX_PX / px);
    const k = dpr * DRS_LEVELS[drs.i];
    const w = Math.max(1, Math.round(r.width * k)), h = Math.max(1, Math.round(r.height * k));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    game.pxr = cv.width / r.width; // tuval pikseli / CSS pikseli (tuş istemi boyutu için)
    scene.resize(cv.width, cv.height);
  }
  game.dprCap = DPR_CAP;
  // ---------------------------------------------------------------- dinamik çözünürlük
  // Dövüşte 1 sn'lik pencerelerde ortalama kare aralığı 20 ms'yi aşarsa (60 Hz'de ~50 fps altı) iç çözünürlük
  // kademeli düşer (1 → 0.85 → 0.7). Düşüşten sonraki pencere belirgin iyileşme göstermezse (darboğaz çözünürlük
  // değil; ör. 30 Hz ekran ya da işlemci) geri alınır ve ölçek sabitlenir. Uzun süre hızlı kalınca bir kademe
  // geri çıkar; çıkış yine yavaşlatırsa o seviyede kilitlenir (gidip gelme olmaz). En düşük seviyede hâlâ yavaşsa
  // eski otomatik kalite düşürme (perfWatch) devreye girer.
  const DRS_LEVELS = MOBILE ? [1, 0.85, 0.7, 0.6] : [1, 0.85, 0.7];
  const drs = { i: 0, t: 0, n: 0, gap: 0, slow: 0, fast: 0, probe: 0, upT: 0, fixed: false, noUp: false, settle: 0 };
  function drsSet(i) { drs.i = i; drs.settle = 1; resize(); }
  function drsReset() { Object.assign(drs, { t: 0, n: 0, gap: 0, slow: 0, fast: 0, probe: 0, upT: 0, fixed: false, noUp: false, settle: 0 }); if (drs.i) drsSet(0); }
  function drsWatch(gapMs) {
    if (game.paused || game.phase !== 'fight' || game.mode === 'attract' || document.hidden || gapMs > 120) {
      if (gapMs > 120 || game.phase !== 'fight') { drs.t = drs.n = drs.gap = 0; }
      return;
    }
    drs.t += gapMs; drs.n++; drs.gap += gapMs;
    if (drs.t < 1000) return;
    const g = drs.gap / drs.n; drs.t = drs.n = drs.gap = 0;
    game.drsStat = { gap: g, scale: DRS_LEVELS[drs.i] };
    if (drs.settle > 0) { drs.settle--; return; } // yeniden boyutlanmanın ilk penceresi sayılmaz
    if (drs.probe) { // düşüş işe yaradı mı?
      if (g > drs.probe * 0.92) { drs.fixed = true; drsSet(drs.i - 1); }
      drs.probe = 0; return;
    }
    if (drs.upT > 0) { drs.upT--; if (g > 20) { drs.noUp = true; drsSet(drs.i + 1); return; } } // çıkış yavaşlattı → geri, kilitle
    if (g > 20) {
      drs.fast = 0;
      if (!drs.fixed && drs.i < DRS_LEVELS.length - 1 && ++drs.slow >= 2) { drs.slow = 0; drs.probe = g; drsSet(drs.i + 1); }
    } else {
      drs.slow = 0;
      if (g < 17.8 && drs.i > 0 && !drs.noUp && ++drs.fast >= 10) { drs.fast = 0; drs.upT = 3; drsSet(drs.i - 1); }
    }
  }
  const drsExhausted = () => drs.fixed || drs.i === DRS_LEVELS.length - 1;
  game.drs = drs; game._drsWatch = drsWatch; game._drsReset = drsReset; // konsoldan test için
  // Adres çubuğu açılıp kapanınca / döndürünce tuval gerilmesin: her boyut değişiminde arka tamponu yeniden ölç
  const onResize = () => { resize(); if (game.syncTouch) game.syncTouch(); };
  window.addEventListener('resize', onResize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => { onResize(); setTimeout(onResize, 300); });
  if (window.ResizeObserver) { try { new ResizeObserver(onResize).observe(cv); } catch (e) { /* yok */ } }
  resize();
  input.init();
  scene.init();
  ND.STR?.apply?.();
  ND.arcade?.init(game);
  ND.training?.init(game);
  ND.leaderboard?.init();
  ND.lbUI?.init(game);
  ND.banzuke?.init(game);
  game.start('attract');
  refreshPlay();
  if ($('first') && ND.save && !ND.save.p.firstDone) { $('first').hidden = false; $('menu').hidden = true; setTimeout(() => $('fPlay') && $('fPlay').focus(), 0); }
  ND.save?.syncPortal?.();
  game.onSaveAdopted = () => { refreshPlay(); if (game.mode === 'attract' && ND.save.p.firstDone && $('first') && !$('first').hidden) { $('first').hidden = true; $('menu').hidden = false; } };
  ND.i18n?.onChange(() => { ND.arcade?.refreshMenu(); refreshPlay(); if (game.phase === 'select') { game.openSelect(game.selMode); } });

  // ---------------------------------------------------------------- otomatik kalite
  // Dövüş sırasında 3 sn'lik pencerelerde ortalama kare süresi ölçülür; art arda üç pencere (~9 sn) yavaşsa
  // (kare aralığı > 22 ms ve iş süresi de belirgin) yüksek grafik kapatılır. Bir kez düşürür, geri açmaz.
  // Önce dinamik çözünürlük denenir: o tükenmeden (en düşük ölçek ya da sabitlenmiş) sayılmaz.
  const perf = { done: false, t: 0, n: 0, gap: 0, work: 0, slow: 0 };
  function perfWatch(gapMs, workMs) {
    if (perf.done) return;
    if (!ND.settings.hq || !drsExhausted() || game.paused || game.phase !== 'fight' || game.mode === 'attract' || document.hidden || gapMs > 120) {
      if (!drsExhausted()) { perf.t = perf.n = perf.gap = perf.work = 0; perf.slow = 0; }
      if (gapMs > 120 || game.phase !== 'fight') { perf.t = perf.n = perf.gap = perf.work = 0; }
      return;
    }
    perf.t += gapMs; perf.n++; perf.gap += gapMs; perf.work += workMs;
    if (perf.t < 3000) return;
    const gap = perf.gap / perf.n, work = perf.work / perf.n;
    perf.t = perf.n = perf.gap = perf.work = 0;
    perf.slow = gap > 22 && work > 7 ? perf.slow + 1 : 0;
    game.perfStat = { gap, work };
    if (perf.slow < 3) return;
    perf.done = true; hqAutoOff = true;
    ND.settings.hq = false; $('tHq').setAttribute('aria-pressed', 'false');
    drsReset(); // düşük grafikte çözünürlük yeniden tam ölçekten denenir
    persist();
    const T = STR.toast || {};
    ND.toast?.(tx(T.perf || 'Performans için grafik düşürüldü'), T.perfK || '軽');
  }
  game.perf = perf; game._perfWatch = perfWatch; // konsoldan test için

  // Portal gameplay events: "playing" = a match is on screen and running (intro, fight, KO, replay), not paused,
  // not in an ad, tab visible. Menus, select, VS and end screens are stopped. The bridge drops duplicates.
  const PLAY_PHASES = { intro: 1, fight: 1, ko: 1, timeup: 1, replay: 1 };
  let loaded = false, wasPlaying = false;
  function portalTick(rdt, inAd) {
    const playing = game.mode !== 'attract' && !!PLAY_PHASES[game.phase] && !game.paused && !inAd && !document.hidden;
    if (playing !== wasPlaying) { wasPlaying = playing; if (ND.portal) playing ? ND.portal.gameplayStart() : ND.portal.gameplayStop(); }
    if (playing && game.phase === 'fight' && ND.ads) ND.ads.tick(rdt);
    if (ND.coach && ND.coach.on) ND.coach.tick(rdt, game);
  }
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const gap = now - last; last = now;
    frameBody(gap);
  }
  // One display frame (gap = ms since the previous one). Exposed as game._frame for console tests (hidden tab: no rAF).
  function frameBody(gap) {
    const rdt = Math.min(0.05, Math.max(0, gap / 1000));
    const w0 = performance.now();
    input.pollPads();
    const inAd = !!(ND.portal && ND.portal.inAd);
    if (!game.paused && !inAd) game.advance(rdt); else game.acc = 0;
    portalTick(rdt, inAd);
    game.syncTouch();
    game.render();
    if (!loaded) { loaded = true; ND.portal?.loadingFinished(); }
    drsWatch(gap);
    perfWatch(gap, performance.now() - w0);
  }
  game._frame = frameBody;
  requestAnimationFrame(frame);
})(window.ND);
