// Gölge Düellosu — dövüşçü: durum makinesi, hareket, saldırılar, savunma, savuşturma, ki, kilitlenme, shuriken
(function (ND) {
  'use strict';
  const { clamp, rand, ease, segSeg } = ND.M;
  const PO = ND.POSES, pose = ND.pose, fx = ND.fx, au = ND.audio, cam = ND.cam;
  const GRAV = 2500, JUMP_V = -900, WALK_F = 255, WALK_B = 195, PARRY_WIN = 0.17;
  // Small human-only timing differences. Master is the original tuning; AI and local 2P keep it.
  const DEFENSE_TIMING = [
    { parry: 0.2, counter: 0.56, blockCounter: 0.4 },
    { parry: PARRY_WIN, counter: 0.5, blockCounter: 0.36 },
    { parry: 0.15, counter: 0.44, blockCounter: 0.32 },
  ];
  const playerTiming = (f) => {
    const g = ND.game;
    return g && g.matchLevel != null && g.isHuman && g.isHuman(f)
      ? DEFENSE_TIMING[clamp(g.matchLevel, 0, 2)] : null;
  };
  // Preserve character bonuses (Mai's fans) at every difficulty.
  const parryWin = (f) => {
    const base = (f && f.ch && f.ch.parryWin) || PARRY_WIN, timing = playerTiming(f);
    return base + (timing ? timing.parry - PARRY_WIN : 0);
  };
  ND.parryWin = parryWin;

  const ATK = ND.ATK = {
    light1: { keys: [[0.10, 's1a', ease.inOutSine], [0.19, 's1b', ease.outQuart], [0.30, 's1c', ease.outCubic], [0.47, 'stance']],
      active: [0.13, 0.22], dmg: 9, post: 14, kb: 230, stun: 0.34, lunge: [0.1, 0.2, 260], chain: [0.21, 0.47], next: 'light2', sw: 0.1, pw: 0.9, kind: 'blade' },
    light2: { keys: [[0.08, 's2a', ease.inOutSine], [0.17, 's2b', ease.outQuart], [0.28, 's2c', ease.outCubic], [0.46, 'stance']],
      active: [0.1, 0.19], dmg: 10, post: 15, kb: 240, stun: 0.36, lunge: [0.08, 0.17, 240], chain: [0.19, 0.46], next: 'light3', sw: 0.08, pw: 0.95, kind: 'blade', sc: true },
    light3: { keys: [[0.13, 's3a', ease.inOutSine], [0.21, 's3b', ease.outQuart], [0.33, 's3b'], [0.58, 'stance']],
      active: [0.15, 0.25], dmg: 14, post: 22, kb: 500, stun: 0.5, lunge: [0.13, 0.23, 540], sw: 0.14, pw: 1.1, kind: 'blade', thrust: true, sc: true },
    dash: { keys: [[0.06, 's1a', ease.inOutSine], [0.14, 's1b', ease.outQuart], [0.25, 's1c', ease.outCubic], [0.44, 'stance']],
      active: [0.08, 0.17], dmg: 11, post: 16, kb: 320, stun: 0.42, lunge: [0, 0.14, 560], sw: 0.05, pw: 1.05, kind: 'blade' },
    heavy: { keys: [[0.30, 'h1a', ease.inOutSine], [0.39, 'h1a'], [0.47, 'h1b', ease.outQuart], [0.6, 'h1c', ease.outCubic], [0.92, 'stance']],
      active: [0.40, 0.50], dmg: 24, post: 44, kb: 430, stun: 0.6, lunge: [0.37, 0.47, 430], sw: 0.39, pw: 1.5, kind: 'blade', knock: true, glint: [0.18, 0.4], sc: true },
    kick: { keys: [[0.12, 'k1a', ease.inOutSine], [0.2, 'k1b', ease.outQuart], [0.3, 'k1b'], [0.54, 'stance']],
      active: [0.15, 0.28], dmg: 6, post: 36, kb: 500, stun: 0.45, lunge: [0.1, 0.2, 170], chain: [0.28, 0.54], kind: 'kick' },
    throw: { keys: [[0.12, 't1a', ease.inOutSine], [0.2, 't1b', ease.outQuart], [0.44, 'stance']], release: 0.17, kind: 'throw' },
    air: { keys: [[0.08, 'as1a', ease.inOutSine], [0.17, 'as1b', ease.outQuart], [0.42, 'fall']],
      active: [0.09, 0.2], dmg: 11, post: 16, kb: 260, stun: 0.4, sw: 0.08, pw: 1, kind: 'blade', air: true },
    plunge: { dmg: 18, post: 38, kb: 380, stun: 0.5, kind: 'blade', knock: true },
    // --- karşılık (kaeshi-waza / ōji-waza) hareketleri: gard/savuşturma sonrası. Savunma hareketi kesiğe akar:
    // defl = rakibin kılıcıyla temas anı (kıvılcım, ses, kısa donma, rakibin tepki pozu), slide = temas boyunca
    // kılıç üzerinde kayan kıvılcım [t0, t1, u0, u1], react = saldıranın savrulma pozu, hurt = isabette acı pozu,
    // zan = isabetten sonra zanshin [t, poz, süre], tech = ND.TXT anahtarı (isabet yazısı).
    // Varyantlar (riposte2… ve silah aileleri, specials.js) sayısal değerleri tabandan alır: pencereler/hasar aynı.
    // SURIAGE (omote): kılıç rakibinkine sürtünerek yükselir, onu yukarı savurur, tek yayda çapraz kesiğe iner
    riposte: { keys: [[0.055, 'ks_suriA', ease.outCubic], [0.14, 'ks_suriB', ease.inOutSine], [0.22, 'ks_suriC', ease.outCubic], [0.4, 'stance', ease.inOut]],
      active: [0.08, 0.16], dmg: 11, post: 16, kb: 240, stun: 0.36, lunge: [0.06, 0.14, 300], sw: 0.06, pw: 1, kind: 'blade', counter: true,
      tech: 'kSuriage', defl: 0.045, slide: [0, 0.05, 0.25, 0.75], react: 'rx_high', hurt: 'rx_high', zan: [0.24, 'ks_zan', 0.16] },
    // HARAI: rakibin kılıcını yana/aşağı vurup açılan boşluktan girer, bacaklara alçak kesik (yere serer)
    sweep: { keys: [[0.04, 'ks_hBeat', ease.outCubic], [0.09, 'ks_hDip', ease.inOutSine], [0.17, 'ks_hCut', ease.outCubic], [0.28, 'ks_hCut'], [0.48, 'stance', ease.inOut]],
      active: [0.1, 0.2], dmg: 9, post: 18, kb: 200, stun: 0.4, lunge: [0.07, 0.16, 380], sw: 0.08, pw: 1, kind: 'blade', counter: true, knock: true, trip: true,
      tech: 'kHarai', defl: 0.035, slide: [0, 0.035, 0.45, 0.8], react: 'rx_off', zan: [0.3, 'ks_zanLow', 0.16] },
    // NUKI: eğilip hattan çıkar, rakibin kılıcı boşa geçer; dönüp yandan/arkadan keser
    mawari: { keys: [[0.07, 'ks_nDuck', ease.outCubic], [0.19, 'ks_nDuck'], [0.23, 'ks_nPivot', ease.inOutSine], [0.31, 'ks_nCut', ease.outCubic], [0.42, 'ks_nCutF', ease.outCubic], [0.58, 'stance', ease.inOut]],
      active: [0.27, 0.35], dmg: 10, post: 16, kb: 260, stun: 0.4, lunge: [0.02, 0.2, 950], lunge2: [0.26, 0.33, 220], turn: 0.21, pass: [0.02, 0.22], inv: [0.02, 0.21], sw: 0.26, pw: 1, kind: 'blade', counter: true,
      tech: 'kNuki', defl: 0.07, whiff: true, spin: [0.21, 0.3, 0.5, Math.PI], react: 'rx_over', hurt: 'rx_over', zan: [0.42, 'ks_zan', 0.16] },
    // UCHIOTOSHI: rakibin kılıcını yere çarpar (yerde kıvılcım), ardından yükselen güçlü tsuki
    kaeshiHeavy: { keys: [[0.035, 'ks_oRaise', ease.outCubic], [0.075, 'ks_oDrop', ease.inQuad], [0.1, 'ks_oDrop'], [0.17, 'ks_oThrust', ease.outCubic], [0.3, 'ks_oThrust'], [0.55, 'stance', ease.inOut]],
      active: [0.12, 0.21], dmg: 17, post: 30, kb: 520, stun: 0.5, lunge: [0.1, 0.2, 600], sw: 0.12, pw: 1.3, kind: 'blade', counter: true, knock: true, thrust: true,
      tech: 'kUchiotoshi', defl: 0.07, ground: true, react: 'rx_low', zan: [0.32, 'ks_zanTsuki', 0.18] },
    // Seri doruğu (5. karşılık): sandan-giri — yükselen çekme kesiği, ters kesa, sıçrayıp yere inen ikiye bölme; chiburi
    finisher: { keys: [[0.05, 'ks_f1a', ease.outCubic], [0.12, 'ks_f1b', ease.outCubic], [0.17, 'ks_f2a', ease.outCubic], [0.24, 'ks_f2b', ease.outCubic], [0.3, 'ks_f3a', ease.outCubic], [0.38, 'ks_f3b', ease.inQuad], [0.52, 'ks_f3b'], [0.76, 'stance', ease.inOut]],
      active: [0.08, 0.13], hits: [[0.08, 0.13], [0.2, 0.25], [0.33, 0.4]], dmg: 9, post: 22, kb: 180, stun: 0.3, lunge: [0.05, 0.38, 240], sw: 0.07, pw: 1.3, kind: 'blade', counter: true, crush: true, knockLast: true,
      defl: 0.025, react: 'rx_off', zan: [0.54, 'ks_chiburi', 0.22], fin: true },
    special: { keys: [[0.26, 'iai1', ease.inOutSine], [0.3, 'iai1'], [0.42, 'iai2', ease.outQuart], [0.72, 'iai2'], [0.98, 'stance', ease.inOut]],
      active: [0.3, 0.45], dmg: 26, post: 65, kb: 380, stun: 0.6, lunge: [0.3, 0.43, 1900], sw: 0.3, pw: 1.7, kind: 'blade', knock: true, special: true, cross: true, pass: [0.28, 0.5], glint: [0.1, 0.3] },
  };
  // Karşılık varyantı: tabanın tüm sayısal değerleri (pencereler, hasar, itme, atılma) + yeni anahtar kareler/efektler
  const kv = ND.kaeshiVariant = (base, o) => Object.assign({}, ATK[base], { ev: null, tick: null, wpath: null, fan: null, fanB: null, spin: null, rollT: null, whiff: false, ground: false, slide: null, hurt: null }, o);
  const E = ease;
  // SURIAGE (ura): alttan yakalar, kılıcı yukarı sıyırır ve yükselen çapraz kesikle (kiriage) devam eder
  ATK.riposte2 = kv('riposte', { keys: [[0.06, 'ks_uraA', E.outCubic], [0.13, 'ks_uraB', E.inOutSine], [0.2, 'ks_uraC', E.outCubic], [0.4, 'stance', E.inOut]],
    defl: 0.05, slide: [0.04, 0.1, 0.2, 0.75], react: 'rx_high', hurt: 'rx_high', zan: [0.24, 'ks_zanHi', 0.16] });
  // SURIAGE (maki): uç küçük bir daire çizip kılıcı sarar ve kenara atar; tek elle uzun tsuki (katate-zuki)
  ATK.riposte3 = kv('riposte', { keys: [[0.03, 'ks_makiA', E.outCubic], [0.06, 'ks_makiB', E.inOutSine], [0.13, 'ks_tsuki', E.outCubic], [0.24, 'ks_tsuki'], [0.4, 'stance', E.inOut]],
    thrust: true, defl: 0.035, slide: [0, 0.06, 0.4, 0.85], react: 'rx_off', zan: [0.26, 'ks_zanTsuki', 0.16] });
  // HARAI (aşağı): kılıcı yere doğru vurur, diz çöküp bacaklardan yukarı keser
  ATK.sweep2 = kv('sweep', { keys: [[0.045, 'ks_h2Beat', E.outCubic], [0.09, 'ks_h2Kneel', E.inOutSine], [0.17, 'ks_h2Cut', E.outCubic], [0.28, 'ks_h2Cut'], [0.48, 'stance', E.inOut]],
    defl: 0.04, slide: [0, 0.04, 0.5, 0.85], react: 'rx_off', zan: [0.3, 'ks_zanLow', 0.16] });
  // NUKI (dönüş): piruet atarak yanından geçer, arkasından yüksekten çapraz iner
  ATK.mawari2 = kv('mawari', { keys: [[0.07, 'ks_n2Spin', E.outCubic], [0.19, 'ks_n2Spin'], [0.25, 'ks_n2High', E.inOutSine], [0.33, 'ks_n2Cut', E.inOutSine], [0.42, 'ks_suriC', E.outCubic], [0.58, 'stance', E.inOut]],
    defl: 0.07, whiff: true, spin: [0.03, 0.21, 0.5], react: 'rx_over', hurt: 'rx_over', zan: [0.42, 'ks_zan', 0.16] });
  // UCHIOTOSHI (men): kılıcı yere çarpar, sıçrayıp tepeden ikiye böler
  ATK.kaeshiHeavy2 = kv('kaeshiHeavy', { keys: [[0.03, 'ks_o2Raise', E.outCubic], [0.07, 'ks_o2Drop', E.inQuad], [0.12, 'ks_o2Up', E.outCubic], [0.19, 'ks_o2Men', E.inOutSine], [0.3, 'ks_o2Men'], [0.55, 'stance', E.inOut]],
    thrust: false, defl: 0.065, ground: true, react: 'rx_low', zan: [0.32, 'ks_zanLow', 0.18] });
  // kodachi / tantō: dar, hızlı iç savuşturma — gövdeye yakın dik kılıç, içeri adım, kısa kesik ya da bıçaklama
  ATK.kd_rip1 = kv('riposte', { keys: [[0.04, 'kd_in', E.outCubic], [0.13, 'kd_cut', E.outCubic], [0.2, 'kd_fol', E.outCubic], [0.4, 'stance', E.inOut]],
    defl: 0.035, slide: [0, 0.04, 0.2, 0.7], react: 'rx_high', hurt: 'rx_high', zan: [0.22, 'ks_zan', 0.16] });
  ATK.kd_rip2 = kv('riposte', { keys: [[0.04, 'kd_in2', E.outCubic], [0.13, 'kd_stab', E.outCubic], [0.22, 'kd_stab'], [0.4, 'stance', E.inOut]],
    thrust: true, defl: 0.035, slide: [0, 0.04, 0.25, 0.75], react: 'rx_off', zan: [0.24, 'ks_zanTsuki', 0.16] });
  // YOKO (do-giri): the sideways beat carries the blade down to the hip, then one level cut through the waist
  ATK.riposte4 = kv('riposte', { keys: [[0.05, 'ks_yA', E.outCubic], [0.14, 'ks_yB', E.inQuad], [0.22, 'ks_yC', E.outCubic], [0.4, 'stance', E.inOut]],
    defl: 0.04, slide: [0, 0.05, 0.3, 0.8], react: 'rx_off', zan: [0.24, 'ks_zanTsuki', 0.16] });
  // per-fighter flavour of the plain reply (KAESHI.chars): same numbers as riposte, own body
  // Akane: the blade clicks back into the saya and comes out again as a level draw-cut (nukitsuke)
  ATK.ak_rip = kv('riposte', { keys: [[0.045, 'ak_rDefl', E.outCubic], [0.13, 'ak_l1b', E.outQuart], [0.21, 'ak_l1c', E.outCubic], [0.4, 'ak_stance', E.inOut]],
    sheath: [0.03, 0.06], defl: 0.03, react: 'rx_off', zan: [0.24, 'sp_akEnd', 0.16] });
  // Aoi: one-handed wheel — over the head, a long descending arc at full reach, round again below
  ATK.ao_rip = kv('riposte', { keys: [[0.05, 'ao_rA', E.outCubic], [0.14, 'ao_rB', E.inOutSine], [0.22, 'ao_rC', E.outCubic], [0.4, 'ao_stance', E.inOut]],
    defl: 0.045, slide: [0, 0.05, 0.3, 0.8], react: 'rx_high', hurt: 'rx_high', zan: [0.24, 'ao_l1b', 0.16] });
  // Ren: heaves the blade off on his forearm, then a backhand smash from over the shoulder
  ATK.rn_rip = kv('riposte', { keys: [[0.05, 'rn_rA', E.outCubic], [0.13, 'rn_rB', E.inQuad], [0.22, 'rn_rC', E.outCubic], [0.4, 'rn_stance', E.inOut]],
    defl: 0.045, slide: [0, 0.05, 0.1, 0.6], react: 'rx_high', hurt: 'rx_high', zan: [0.24, 'rn_l1b', 0.16], ev: [[0.12, () => cam.punch(4)]] });
  // Kage: drops into a low shadow step (afterimages) and rises through a reverse-grip cut
  ATK.kg_rip = kv('riposte', { keys: [[0.05, 'kg_rA', E.outCubic], [0.13, 'kg_rB', E.outQuart], [0.22, 'kg_rC', E.outCubic], [0.4, 'kg_stance', E.inOut]],
    defl: 0.04, react: 'rx_low', zan: [0.24, 'kg_l2b', 0.16],
    tick(f, dt, t) { if (t > 0.03 && t < 0.13 && ((t * 60) | 0) % 2 === 0) f.addGhost(0.3); } });
  // fd: which parry deflection (DEFL dir) the reply flows out of — up → a descending cut, down → a rising cut,
  // side → a level cut or a thrust. KAESHI.pick prefers the matching variant, never the one used last.
  for (const [k, d] of [['riposte', 'up'], ['riposte2', 'down'], ['riposte3', 'side'], ['riposte4', 'side'], ['kd_rip1', 'up'], ['kd_rip2', 'side'],
    ['ak_rip', 'side'], ['ao_rip', 'up'], ['rn_rip', 'up'], ['kg_rip', 'down'], ['sweep', 'side'], ['sweep2', 'down'], ['mawari', 'up'], ['mawari2', 'side'],
    ['kaeshiHeavy', 'down'], ['kaeshiHeavy2', 'up']]) ATK[k].fd = d;

  for (const k in ATK) {
    const a = ATK[k];
    if (a.keys && typeof a.keys[0][1] !== 'object') { a.keys = a.keys.map(([t, p, e]) => [t, typeof p === 'string' ? PO[p] : p, e]); a.dur = a.keys[a.keys.length - 1][0]; }
  }

  // A rally follows the attack that was actually defended, not merely two nearby counter inputs.
  // n remains the exchange count used by scoring; turns counts each fighter's own replies (1x, 2x, 3x).
  const RALLY = ND.RALLY = {
    reset(r) { r.n = 0; r.last = null; r.t = 0; r.serial = null; r.turns = [0, 0]; },
    advance(r, f, source) {
      const linked = r.n > 0 && r.last !== f && r.t < 1.6 && source && source.counter &&
        source.from === r.last && source.serial === r.serial;
      if (!linked) this.reset(r);
      r.n++; r.turns[f.id]++; r.last = f; r.t = 0; r.serial = null;
      return r.turns[f.id];
    },
  };

  // Weapon-specific choreography progresses on this fighter's replies, independently of the opponent's count.
  const KAESHI = ND.KAESHI = {
    sets: {
      katana: { riposte: ['riposte', 'riposte2', 'riposte3', 'riposte4'], sweep: ['sweep', 'sweep2'], mawari: ['mawari', 'mawari2'], kaeshiHeavy: ['kaeshiHeavy', 'kaeshiHeavy2'], finisher: ['finisher'] },
      kodachi: { riposte: ['kd_rip1', 'kd_rip2', 'riposte2', 'riposte4', 'riposte'] },
    },
    // a fighter's own extra variants, added to the weapon family's list
    chars: { akane: { riposte: ['ak_rip'] }, aoi: { riposte: ['ao_rip'] }, ren: { riposte: ['rn_rip'] }, kage: { riposte: ['kg_rip'] } },
    _cat: {},
    list(f, name, L) {
      const X = this.chars[f.ch.id], x = X && X[name];
      if (!x) return L;
      const k = f.ch.id + '|' + name + '|' + L[0];
      return this._cat[k] || (this._cat[k] = L.concat(x.filter((n) => ATK[n])));
    },
    // silah malzemesi: kayma kıvılcımı rengi (ahşap sap → talaş)
    wood: { bo: 1, naginata: 1 },
    fam(f) {
      const w = f.wpn || {}, t = w.type || (w.blade > 110 ? 'nodachi' : w.blade < 80 ? 'kodachi' : 'katana');
      if (f.ch && f.ch.kaeshi) return f.ch.kaeshi;
      if (w.twin && t === 'tanto') return 'twin';
      if (t === 'tanto' || t === 'yumi') return 'kodachi';
      if (t === 'ninjato') return 'katana';
      return t;
    },
    pick(f, name) {
      const S = this.sets[this.fam(f)], L = (S && S[name]) || this.sets.katana[name];
      if (!L || !L.length) return name;
      const stage = Math.max(1, f.counterStage || 1);
      // Longer rallies alternate two three-cut sequences. Build once per weapon, retaining all hit windows,
      // damage and travel values. Only the first two physical cuts change; the last cleave still closes it.
      if (name === 'finisher' && stage >= 4 && stage % 2 === 0) {
        const base = L[0], alt = base + '_return';
        if (!ATK[alt]) {
          const replies = (S && S.riposte) || this.sets.katana.riposte;
          const one = ATK[replies[1] || replies[0]], two = ATK[replies[0]], a = ATK[base];
          const keys = a.keys.map(k => k.slice());
          // Some weapon finishers omit the second wind-up key. Preserve their original timestamps.
          for (const k of keys) {
            if (k[0] <= 0.05) k[1] = one.keys[0][1];
            else if (k[0] <= 0.13) k[1] = one.keys[1][1];
            else if (k[0] < 0.2) k[1] = two.keys[0][1];
            else if (k[0] <= 0.25) k[1] = two.keys[1][1];
          }
          ATK[alt] = Object.assign({}, a, { keys });
        }
        f.kvLast = alt; f.pdDir = null;
        return alt;
      }
      // Every reply looks different from the one before it: prefer a variant that flows out of the parry's
      // deflection (f.pdDir, set by DEFL on a parry), otherwise rotate; never repeat this fighter's last variant.
      // Only the choreography changes: every variant carries its logical move's numbers (kaeshiVariant).
      const C = this.list(f, name, L), n = f.kvN | 0, want = f.pdDir, last = f.kvLast;
      let pick = null;
      for (let pass = want ? 0 : 1; pass < 2 && !pick; pass++) {
        for (let i = 0; i < C.length; i++) {
          const k = C[(n + i) % C.length], a = ATK[k];
          if (a && k !== last && (pass || a.fd === want)) { pick = k; break; }
        }
      }
      if (!pick) pick = ATK[C[n % C.length]] ? C[n % C.length] : name;
      f.kvLast = pick; f.kvN = n + 1; f.pdDir = null;
      return pick;
    },
    // temas/zanshin sesleri; specials.js aileye özel olanları ekler. kind: clang | ground | whiff | wrap | zan
    snd: {
      katana(f, kind, pan) {
        const lo = f.wpn.blade > 110 ? 0.78 : f.wpn.blade < 80 ? 1.2 : 1;
        if (kind === 'whiff') { au.swoosh(0.75, pan); au.noise({ type: 'lowpass', f0: 900, dur: 0.12, gain: 0.1, send: 0.1, pan }); return; }
        if (kind === 'zan') { au.swoosh(0.32, pan); au.tone({ freq: 2300 * lo, freq1: 2200 * lo, dur: 0.7, gain: 0.018, send: 0.7, pan }); return; }
        if (kind === 'ground') { au.clang(1.05, pan, 0.72 * lo); au.thud(0.8, pan); au.noise({ type: 'lowpass', f0: 700, f1: 160, dur: 0.3, gain: 0.3, send: 0.3, pan }); return; }
        // sürtünerek kayan çelik: kısa çın + yukarı süzülen tıslama
        au.clang(0.55, pan, 1.5 * lo);
        au.noise({ type: 'bandpass', f0: 2600 * lo, f1: 5200 * lo, q: 5, dur: 0.16 / lo, gain: 0.14, attack: 0.02, send: 0.3, pan });
      },
    },
  };
  ND.TXT = Object.assign({ kSuriage: 'SURIAGE!', kHarai: 'HARAI!', kNuki: 'NUKI!', kUchiotoshi: 'UCHIOTOSHI!' }, ND.TXT || {});
  KAESHI.sound = function (f, kind) { const fn = this.snd[this.fam(f)] || this.snd.katana; fn(f, kind, f.pan); };

  // ------------------------------------------------------------ SAVUŞTURMA HAREKETİ (uke-nagashi)
  // A parry is a real deflection, played in the 'parry' state (0.2 s, nothing about its timing changes): the first
  // frame meets the attack (Fighter.meetPose: a sword turns onto the point the attack reached, other weapons take the
  // variant's meeting key G) and holds through the hit-stop, then the defender drives the attacker's weapon away (P at
  // 0.07 s, together with the attacker's knocked-away pose), follows through (F) and settles back into guard.
  // Every key is a delta on the fighter's own guard pose (own grip, stance, weapon), so one table fits every fighter
  // of a weapon family. dir = where the attacker's weapon goes: up (over the head), down (beaten to the floor),
  // side (driven out / off line); the counter that follows prefers a variant flowing from it (ATK[..].fd).
  // m/u: which part of the own weapon slides along the attacker's (wpnPt mode; u0 → u1 over the push).
  // kinds: attack shape → candidate order; the one used last by this fighter is skipped, so no two parries in a row
  // look the same.
  const DV = (id, dir, m, u0, u1, G, P, F) => ({ id, dir, slide: [0.012, 0.07, u0, u1, m || null], k: [G, P, F] });
  const DK = {
    age: DV('age', 'up', null, 0.25, 0.7, { hx: -2, ax: -4, ay: 4, sw: 0.18 },
      { hx: 2, hy: -5, lean: -0.1, hd: -0.26, ax: -8, ay: -38, sw: -0.92, f1x: 2 }, { hx: 1, hy: -4, lean: -0.06, hd: -0.19, ax: -4, ay: -28, sw: -0.62 }),
    age2: DV('age2', 'up', null, 0.3, 0.8, { ay: 6, sw: -0.12 },
      { hx: -2, hy: -7, lean: -0.18, hd: -0.44, ax: 8, ay: -38, sw: 0.38, f1x: -2, f2x: -2 }, { hy: -5, lean: -0.14, hd: -0.34, ax: 6, ay: -30, sw: 0.23 }),
    otoshi: DV('otoshi', 'down', null, 0.3, 0.75, { hy: -3, ax: -6, ay: -8, sw: -0.32 },
      { hx: 6, hy: 9, lean: 0.28, hd: 0.08, ax: 16, ay: 22, sw: 2.08, f1x: 8, f2x: -2 }, { hx: 4, hy: 7, lean: 0.24, hd: 0.06, ax: 12, ay: 24, sw: 2.23 }),
    harai: DV('harai', 'side', null, 0.2, 0.7, { hx: -2, ax: -6, ay: 2, sw: -0.24 },
      { hx: 8, hy: 1, lean: 0.14, hd: -0.04, ax: 18, ay: -8, sw: 1.08, f1x: 8, f2x: 2 }, { hx: 6, lean: 0.1, ax: 14, ay: -4, sw: 1.18, f1x: 6 }),
    nagashi: DV('nagashi', 'down', null, 0.2, 0.85, { ax: -2, ay: -10, sw: -0.12 },
      { hx: -6, hy: -3, lean: -0.16, hd: -0.14, ax: -4, ay: -34, sw: 1.73, f1x: -4, f2x: -6 }, { hx: -6, hy: -2, lean: -0.14, hd: -0.1, ax: 0, ay: -28, sw: 1.88, f2x: -6 }),
    maki: DV('maki', 'side', null, 0.5, 0.8, { ax: 6, ay: -2, sw: 0.43 },
      { hx: 4, lean: 0.08, ax: 12, ay: 8, sw: 1.78 }, { hx: 2, lean: 0.04, ax: 8, ay: -4, sw: 0.93 }),
  };
  const DEFL = ND.DEFL = {
    T: [0.07, 0.125, 0.2], mk: DV, K: DK, // mk/K: specials.js builds the other weapon families' sets
    sets: {
      katana: { v: DK, kinds: { high: ['age', 'nagashi', 'age2'], mid: ['harai', 'age', 'otoshi', 'nagashi'], low: ['otoshi', 'harai'],
        thrust: ['maki', 'harai', 'otoshi'], air: ['age2', 'age'] } },
    },
    // high: a descending cut (the blade's point is still falling), low: rising / low / tripping, thrust, air, mid
    kind(att, a, y, def) {
      if (a.air || !att.onGround || att.y < -30) return 'air';
      if (a.thrust) return 'thrust';
      let dsw = 0;
      if (att.state === 'atk' && att.keys) dsw = pose.seq(att.keys, att.st + 0.03, DQ).sw - att.pose.sw;
      if (a.trip || def.y - y < 72 || dsw < -0.12) return 'low';
      return dsw > 0.12 ? 'high' : 'mid';
    },
    pick(f, kind) {
      const S = this.sets[KAESHI.fam(f)] || this.sets.katana, L = S.kinds[kind] || S.kinds.mid, n = f.parries | 0;
      for (let i = 0; i < L.length; i++) { const v = S.v[L[(n + i) % L.length]]; if (v && v.id !== f.pdLast) return v; }
      return S.v[L[0]];
    },
  };
  const DQ = {}, DJ = {}, DP = { x: 0, y: 0 }, DE = [ease.outCubic, ease.inOutSine, ease.inOut];
  // attacker's reaction (recoil / stagger pose) for each deflection direction
  const DRX = { up: ['rc_up', 'stagger'], down: ['rc_down', 'st_down'], side: ['rc_out', 'st_out'] };
  const TAU = Math.PI * 2, CP = { x: 0, y: 0 };
  const BTNS = ['light', 'heavy', 'kick'], FWD = ['fLight', 'fHeavy', 'fKick'], BACK = ['bLight', 'bHeavy', 'bKick'];
  const RK = [[0, null], [0, null, ease.outCubic], [0, null], [0, null, ease.inOut]], ZK = [[0, null], [0.07, null, ease.outCubic], [0, null]];

  // ------------------------------------------------------------ HASAR ÖLÇEĞİ (raund uzunluğu ayarı)
  // Tüm can kaybı takeHit'ten geçer (normal, karşılık, ki teknikleri, shuriken, dalış, mermiler) ve burada ölçeklenir.
  // Tablodaki ham değerler (ATK, SPECIALS) karakter kimliğini ve vuruşlar arası oranları taşır; vuruş hissi
  // (hitstop, kamera sarsıntısı, kan, parlama, ses) ham hasarla hesaplanır, böylece darbeler aynı "ağır" hissettirir.
  // Ki kazancı ölçekli hasardan gelir: bir raundda dolan ki (≈ rakibin canı kadar hasar) değişmez.
  // Karşılık/son vuruş/ki teknikleri temel vuruşlardan daha az kırpılır: seri kıran sinematik vuruşlar büyük kalsın.
  // Ölçüm (YZ-YZ, seviye 1–2): 1.0 → ort. ~17 sn raund; bu değerlerle ~30 sn. Tüm ölçek ≈ raund süresiyle ters orantılı.
  // Balance pass (2026-09, after the combo layer): the old 0.54 base gave ~38 s (level 2) / ~40 s (level 1) rounds;
  // every factor ×1.2 → ~31 s / ~32 s (AI vs AI, 1,800+ matches per level).
  // Can artırmak yerine hasar ölçeklendi: can ×1.75 de aynı süreyi verir ama ki hasardan dolduğu için
  // raund başına ki tekniği ~2 katına çıkar (fazla sık) — ölçekli hasarda ki temposu korunur.
  const DMG = ND.DMG = { base: 0.65, counter: 0.72, finisher: 0.84, special: 0.9, shuriken: 0.65 };
  ND.dmgScale = (a) => (a.special ? DMG.special : a.crush ? DMG.finisher : a.counter ? DMG.counter : a.kind === 'shuriken' ? DMG.shuriken : DMG.base);
  ND.scaleDmg = (raw, a) => Math.max(1, Math.round(raw * ND.dmgScale(a)));

  // ------------------------------------------------------------ COMBO RULES (strings, launchers, juggles)
  // step/floor: damage of every further MOVE in one combo is ×step (hits of one multi-hit move count once), never below
  //   ×floor; applied on top of ND.DMG. jugMax: air hits a launched fighter can take before it becomes untouchable until
  //   it lands; jugGrav: extra gravity per air hit taken (each pop is shorter). chainMax: moves chained from one opener.
  //   buf: how long (s) a string press is remembered before its window opens (keyboard and touch).
  //   enderStun: hit stun ×this for a move that ends a string (no chain window) landing as the 3rd+ move of a combo:
  //   mashing the light string no longer loops light3 → light1 into a guardless opponent (the victim is out of hit
  //   stun just before the next opener lands, so a held guard blocks it). Chains and juggles are unchanged.
  const COMBO = ND.COMBO = { step: 0.9, floor: 0.5, jugMax: 3, jugGrav: 0.22, jugPop: 0.25, chainMax: 5, buf: 0.3, launchV: -880, enderStun: 0.8 };
  // Human input leniency (keyboard and touch; the AI presses inside the windows and never needs it):
  //   late: a routed press that comes this long (s, real time) after a chainable move has ended still continues the
  //         string (players who wait to see the hit land press a beat late); dir: a direction key pressed this long
  //         after LIGHT/HEAVY still turns the opener into its command normal (→ + G pressed as G then →).
  const LENIENT = ND.LENIENT = { late: 0.2, dir: 0.08 };
  // Counter (kaeshi-waza) window in game seconds after a parry / a plain block. The parry's hitstop and slow motion
  // stretch the parry window to ~0.75 s of real time; the AI's counter timing does not depend on these.
  const CWIN = ND.CWIN = { parry: 0.5, block: 0.36 };
  // Attack lockout (game seconds from the contact) for the fighter whose attack was blocked / parried / caught: no new
  // cut, heavy, kick, shuriken, ki technique, dash attack, air attack or string / ki cancel before it runs out, so
  // the defender gets a real turn and mashing into a guard is a losing bet. Guard, parry, walking and dodging are not
  // locked, and neither is a counter (kaeshi-waza) earned by defending: the counter rally keeps its back-and-forth.
  // Before: the next attack could start ~0.33 s after a block or parry (0.16 s for moves that do not bounce back).
  const ATK_LOCK = ND.ATK_LOCK = { block: 0.45, parry: 0.5 };
  // states in which a fighter has recovered (or acts again): the combo against them ends
  const COMBO_RESET = { move: 1, guard: 1, block: 1, parry: 1, atk: 1, dodge: 1, lock: 1, clash: 1, getup: 1, win: 1 };

  // ------------------------------------------------------------ SHURIKEN
  class Shuriken {
    // opt: { skin: görünüm kodu (ND.projSkins), a: vuruş tanımı, v: hız, sound: 'thud' }
    constructor(owner, x, y, dir, opt) {
      this.owner = owner; this.x = x; this.y = y; this.vx = dir * ((opt && opt.v) || 1150); this.vy = -30;
      this.rot = 0; this.falling = false; this.stuck = false; this.dead = false;
      this.skin = (opt && opt.skin) || 0; this.a = opt && opt.a; this.spin = 0;
      if (this.skin) this.rot = this.skin * 1000;
    }
    update(dt) {
      if (this.stuck) return;
      if (this.skin) { this.spin = (this.spin + dt * (this.falling ? 9 : 16)) % 6.283; this.rot = this.skin * 1000 + this.spin; }
      else this.rot += dt * (this.falling ? 14 : 38);
      this.vy += (this.falling ? GRAV : 160) * dt;
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.y > 0) { this.y = rand(0, 5); this.stuck = true; au.tick(cam.pan(this.x)); return; }
      const A = ND.ARENA + 40;
      if (Math.abs(this.x) > A) { this.x = Math.sign(this.x) * A; this.stuck = true; au.tick(cam.pan(this.x)); return; }
      if (this.falling) return;
      const t = this.owner.opp;
      if (!t || t.dead || t.isInv()) return;
      const pan = cam.pan(this.x);
      if (t.bladeActive()) {
        const r = segSeg(this.x, this.y, this.x, this.y, t.j.haF.x, t.j.haF.y, t.j.tip.x, t.j.tip.y);
        if (r.d < 12) { this.deflect(); fx.spark(this.x, this.y, Math.atan2(-1, -Math.sign(this.vx)), 10); au.clang(0.5, pan, 1.8); return; }
      }
      for (const h of ND.hurtboxes(t.j)) {
        const r = segSeg(this.x, this.y, this.x, this.y, h[0], h[1], h[2], h[3]);
        if (r.d > h[4] + 5) continue;
        if (t.guardingFrom(this.owner)) {
          if (t.ctrl.since('guard') <= parryWin(t) || t.ch.reflect) {
            this.owner = t; this.vx = -this.vx * 1.1; this.vy = -20;
            fx.ring(this.x, this.y); fx.spark(this.x, this.y, this.vx > 0 ? 0 : Math.PI, 14);
            fx.text(t.x, -190, 'YANSITMA!', '#ffe3a1'); au.parry(pan); ND.game.hitstop(0.08); t.gainKi(12);
          } else {
            this.deflect(); t.posture += 9; t.sinceHit = 0;
            fx.spark(this.x, this.y, this.vx > 0 ? Math.PI : 0, 10); au.clang(0.45, pan, 1.7);
          }
          return;
        }
        this.dead = true;
        t.takeHit(this.a ? this.a.dmg : 6, this.a || SHURI, this.owner, this.x, this.y, h[5], Math.sign(this.vx));
        return;
      }
    }
    deflect() { this.falling = true; this.vx *= -0.25; this.vy = -380; }
    draw(ctx) {
      // özel mermiler (rüzgâr bıçağı, şok dalgası) tekrar görüntüsünde de doğru görünsün: rot >= 1000 → görünüm kodu
      if (this.rot >= 1000) { const sk = ND.projSkins && ND.projSkins[(this.rot / 1000) | 0]; if (sk) sk(ctx, this); return; }
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
      if (!this.stuck && !this.falling) {
        ctx.globalAlpha = 0.25; ctx.fillStyle = '#c9d2e0';
        ctx.beginPath(); ctx.ellipse(-Math.sign(this.vx) * 14, 0, 16, 3, 0, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#aab3c2';
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
        ctx.lineTo(Math.cos(a + 0.785) * 2.6, Math.sin(a + 0.785) * 2.6);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1b1d24'; ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, 6.283); ctx.fill();
      ctx.restore();
    }
  }
  const SHURI = { kb: 110, stun: 0.2, post: 6, kind: 'shuriken' };
  ND.Shuriken = Shuriken;

  const JKEYS = ['hip', 'neck', 'sh', 'head', 'elF', 'haF', 'tip', 'elB', 'haB', 'knF', 'ftF', 'knB', 'ftB'];
  // silah durumu (yelpaze açıklığı, yay/kiriş, sadak) ve zincir de kopyalanır: hayalet/tekrar görüntüsü aynı görünsün
  const WKEYS = ['wFan', 'wFanB', 'wBow', 'wDraw', 'wArrow', 'wCharge', 'wAmmo', 'wSheath'];
  ND.cloneJ = (j) => {
    const o = { dir: j.dir, hang: j.hang, hasSword: j.hasSword, _vs: j._vs || 0 };
    for (const k of JKEYS) if (j[k]) o[k] = { x: j[k].x, y: j[k].y };
    if (j.pom) o.pom = { x: j.pom.x, y: j.pom.y };
    for (const k of WKEYS) if (j[k] != null) o[k] = j[k];
    if (j.chain) o.chain = { n: j.chain.n, x: j.chain.x.slice(), y: j.chain.y.slice() };
    return o;
  };
  const RKEYS = JKEYS.concat(['pom']);
  // Fighter.bounds() scratch: running min/max (x0, y0, x1, y1), no helper closure or point objects per call
  const BB = [0, 0, 0, 0];
  const bbXY = (x, y) => { if (x < BB[0]) BB[0] = x; if (y < BB[1]) BB[1] = y; if (x > BB[2]) BB[2] = x; if (y > BB[3]) BB[3] = y; };
  const bbAdd = (p) => { if (p) bbXY(p.x, p.y); };
  // Fighter.drawShadow: the contact shadow's gradient, made on first use
  let SHADOW_G = null;
  function shadowGrad(ctx) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    return g;
  }

  // ------------------------------------------------------------ DÖVÜŞÇÜ
  class Fighter {
    constructor(id, ctrl) {
      this.id = id; this.ctrl = ctrl;
      this.pose = pose.copy(PO.stance); this.entry = pose.copy(PO.stance); this.tmp = {}; this.rkE = pose.copy(PO.stance);
      this.j = {}; this.prevBlade = null; this.ghosts = [];
      this.pdT = { light: null, heavy: null, kick: null }; this.pdD = { light: 0, heavy: 0, kick: 0 }; // direction held at each press
      // drawing scratch, reused every frame (draw() runs up to 3× per fighter per frame: reflection, cast shadow,
      // lit pass): one options object for ND.drawNinja, one trail callback, one bounds box
      this._trailFn = (c) => this.drawTrail(c);
      this._dopt = { ropes: null, trail: null, glint: 0, wpn: null, acc: null, lod: 'high', bake: null, layer: false };
      this._bb = [0, 0, 0, 0];
      // parry deflection keys (DEFL), refilled on every parry: meet → push → follow → guard
      this.pkA = [[0, null], [DEFL.T[0], null, DE[0]], [DEFL.T[1], null, DE[1]], [DEFL.T[2], null, DE[2]]]; this.pdM = pose.copy(PO.guard);
      this.setChar(ND.CHARS[id], false);
      this.reset(id === 0 ? -260 : 260);
    }
    setChar(ch, alt) {
      // alt: false = original colors, true = Legacy colors, 'champ' = Champion colors (characters.js ND.palOf)
      this.ch = ch; this.col = ND.palOf ? ND.palOf(ch, alt) : alt ? ch.alt : ch.col; this.wpn = { blade: ch.blade, handle: ch.handle, type: ch.type, twin: ch.twin, dual: ch.type === 'bo', iai: !!ch.iai };
      this.maxHp = ch.hp;
      // karaktere özel duruş/gard pozu (ch.poses = { stance: 'poz adı', guard: ... })
      this.P = PO; this._pd = null;
      if (ch.poses) { this.P = Object.create(PO); for (const k in ch.poses) if (PO[ch.poses[k]]) this.P[k] = PO[ch.poses[k]]; }
      this.chain = ch.type === 'kusarigama' && ND.Chain ? new ND.Chain() : null;
      this.j.chain = null;
      const A = ch.acc;
      if (A === 'scarf') this.tails = [new ND.Rope(12, 7.5), new ND.Rope(9, 7)];
      else if (A === 'kasa') this.tails = [new ND.Rope(4, 6)];
      else if (A === 'ponytail') this.tails = [new ND.Rope(9, 6.5)];
      else if (A === 'hood') this.tails = [new ND.Rope(10, 8), new ND.Rope(8, 8)];
      else if (A === 'oni') this.tails = [new ND.Rope(8, 7), new ND.Rope(6, 7)];
      else if (A === 'kabuto') this.tails = [new ND.Rope(5, 6)];
      else if (A === 'monk') this.tails = [new ND.Rope(4, 5)];
      else if (A === 'mai') this.tails = [new ND.Rope(10, 7), new ND.Rope(8, 7)];
      else if (A === 'tsubame') this.tails = [new ND.Rope(11, 7), new ND.Rope(10, 7)];
      else if (A === 'tora') this.tails = [new ND.Rope(7, 7), new ND.Rope(6, 7)];
      else if (A === 'akane') this.tails = [new ND.Rope(9, 7.5), new ND.Rope(6, 6.5)]; // long hair tail + ribbon ends
      else if (A === 'aoi') this.tails = [new ND.Rope(7, 8), new ND.Rope(6, 8)]; // haori hem tails flowing behind the hips
      else this.tails = [new ND.Rope(7, 7), new ND.Rope(6, 7.5)];
      this.sash = new ND.Rope(5, 7);
      this._ropes = null; // rope list (colours + widths) is rebuilt for the new character on the next draw
    }
    reset(x) {
      this.x = x; this.y = 0; this.vx = 0; this.vy = 0; this.dir = this.id === 0 ? 1 : -1; this.onGround = true;
      this.hp = this.maxHp; this.ghost = this.maxHp; this.ghostT = 0; this.posture = 0; this.sinceHit = 9;
      this.dead = false; this.rag = null; this.looseSword = null; this.ammo = this.ch.ammo; this.ammoT = 0;
      this.gait = 0; this.walkBlend = 0; this.trail = []; this.inv = 0; this.jit = 0; this.airUsed = false; this.flash = 0;
      this.locked = true; this.damageTaken = 0; this.lastStepQ = [0, 0.5]; this.ghosts = []; this.wallBounced = false;
      this.ki = this.ki || 0; this.counterUntil = 0; this.atkLock = 0; this.counterWin = 0.3; this.counterSource = null; this.counterStage = 0; this.aspd = 1; this.roll = 0;
      this.jug = 0; this.comboN = 0; this.comboHits = 0; this.comboKey = -1; this.comboTxt = null; this.chainN = 0; this.late = null; this.cwKind = null;
      this.kvLast = null; this.kvN = 0; this.pdLast = null; this.pdDir = null;
      if (this.chain) this.chain.init = false;
      pose.copy(this.P.stance, this.pose);
      this.setState('move');
      ND.solve(this.pose, this.x, this.y, this.dir, this.j, this.wpn);
      ND.updateCloth(this.j, 0);
      this.tails.forEach((r) => (r.init = false)); this.sash.init = false;
      this.prevBlade = null;
      if (this.id === 0 && ND.specialFx) ND.specialFx.clear();
    }
    setState(s, extra) {
      this.state = s; this.st = 0; this.hitDone = false; this.sfx = false; this.thrown = false; this.dashFrom = null;
      this.aspd = 1; this.turned = false; this.hitIdx = -1; this.serial = (this.serial || 0) + 1;
      this.evI = 0; this.mem = {}; this.hidden = false; this.vdir = 1; this.roll = 0; this.rk = null; this.pk = null; this.pv = null;
      // juggle count lives only while airborne from hits; a combo against us ends once we act or recover again
      if (s !== 'launch') this.jug = 0;
      if (COMBO_RESET[s]) { this.comboN = 0; this.comboHits = 0; this.comboKey = -1; }
      // bō karşılıkları kılıç açısını ±π ötesine taşır (arka uç öne döner): görünüm aynı kalacak biçimde geri sar
      const sw = this.pose.sw;
      if (sw > Math.PI || sw < -Math.PI) this.pose.sw = Math.atan2(Math.sin(sw), Math.cos(sw));
      pose.copy(this.pose, this.entry);
      Object.assign(this, extra || {});
    }
    startAtk(name, spd = 1) {
      // karaktere özel hareket eşlemesi: mantıksal ad (light1, heavy…) korunur, tanım değişir
      // karşılıklar: silah ailesine ve seri adımına göre teknik (ND.KAESHI); mantıksal ad (riposte…) atkName'de kalır
      let nm = name;
      if (ATK[name] && ATK[name].counter) nm = KAESHI.pick(this, name);
      else {
        const M = ND.MOVES && ND.MOVES[this.ch.id];
        nm = M ? (typeof M === 'function' ? M(this, name) : M[name]) || name : name;
      }
      let a = ATK[nm] || ATK[name];
      if (!a) { name = /light|Light|dash$/.test(name) ? 'light1' : 'heavy'; a = ATK[name]; } // unknown command: plain normal
      if (!a.counter) this.counterStage = 0;
      this.late = null;
      this.setState('atk', { atk: a, atkName: name, keys: [[0, this.entry]].concat(a.keys), aspd: spd });
      if (a.special) { this.ki = 0; ND.game.onSpecial(this); }
    }
    // Neutral / command / dash openers start a new chain (string routes count from here)
    startOpener(name) { this.chainN = 0; return this.startAtk(name); }
    // light/heavy + held direction → logical command normal (down is guard, so only forward/back)
    dirFor(b) { const c = this.ctrl; return (c.axis() || (c.buf[b] === this.pdT[b] ? this.pdD[b] : 0)) * this.dir; }
    cmd(btn) {
      const d = this.dirFor(btn);
      if (btn === 'light') return d > 0 ? 'fLight' : d < 0 ? 'bLight' : 'light1';
      return d > 0 ? 'fHeavy' : d < 0 ? 'bHeavy' : 'heavy';
    }
    // String / target-combo routing: ND.routesFor(f)[current logical move] = { light | heavy | kick | fLight | bLight |
    // fHeavy | bHeavy : next logical move }. A direction-qualified route wins when that direction is held. The press is
    // consumed only when a route exists, so an unrouted button stays buffered for the dodge cancel / next opener.
    // name/landed: the move the press continues from (the current one, or the one that just ended for a late press).
    // When several routed buttons are buffered they are served in the order they were pressed (the buffer keeps each
    // button's latest press, so mashing LIGHT and tapping HEAVY once gives the HEAVY step next, not a LIGHT again).
    route(a, name = this.atkName, landed = this.mem.landed) {
      const c = this.ctrl, R = ND.routesFor ? ND.routesFor(this, name) : null;
      if (!R) {
        // legacy tables (no routing module): light → next, heavy, kick
        if (!a || !a.next) return null;
        if (c.take('light', COMBO.buf)) return a.next;
        if (c.take('heavy', COMBO.buf)) return 'heavy';
        if (c.take('kick', COMBO.buf)) return 'kick';
        return null;
      }
      if (R.hit && landed == null) return null; // launcher follow-ups need a landed hit
      let best = -1, bestTo = null, bestT = Infinity;
      for (let i = 0; i < 3; i++) {
        const b = BTNS[i];
        if (!c.has(b, COMBO.buf)) continue;
        const d = this.dirFor(b);
        const to = (d > 0 && R[FWD[i]]) || (d < 0 && R[BACK[i]]) || R[b];
        if (!to) continue;
        if (c.buf[b] < bestT) { bestT = c.buf[b]; best = i; bestTo = to; }
      }
      if (best < 0) return null;
      c.take(BTNS[best], COMBO.buf);
      return bestTo;
    }
    // Iai: is the katana resting in the scabbard? Forced by the move (a.sheath = [t0, t1]) or when the pose is back at
    // the sheathed stance (the hand returning to the hilt reads as nōtō)
    sheathed() {
      const s = this.state;
      if (s === 'atk' && this.atk.sheath) { const S = this.atk.sheath; if (this.st >= S[0] && this.st <= S[1]) return 1; }
      if (s !== 'move' && s !== 'land' && s !== 'atk' && s !== 'getup' && s !== 'zanshin') return 0;
      const p = this.pose, q = this.P.stance;
      return Math.abs(p.sw - q.sw) < 0.32 && Math.abs(p.ax - q.ax) + Math.abs(p.ay - q.ay) < 16 ? 1 : 0;
    }
    // Draw-stance counter (a.catch = [t0, t1]): a melee hit landing inside the window is caught instead —
    // the attacker is knocked aside and the reply (a.catchInto) starts at once
    tryCatch(att, a) {
      if (this.state !== 'atk' || this.dead || !a || a.special) return false;
      const A = this.atk, C = A.catch;
      if (!C || this.st < C[0] || this.st > C[1]) return false;
      const G = ND.game, pan = this.pan, x = (att.x + this.x) / 2, y = this.y - 110;
      att.hitDone = true;
      att.setState('recoil'); att.vx = -att.dir * 180; att.sinceHit = 0; att.lockAtk('parry');
      this.dir = att.x >= this.x ? 1 : -1;
      fx.spark(x, y, -Math.PI / 2, 20, 1.1); fx.flash(x, y, 0, 80, '255,236,200'); fx.ring(x, y, '255,90,70', 90);
      fx.text(this.x, -220, (ND.TXT && ND.TXT.iaiCatch) || 'IAI GAESHI!', this.col.ui);
      au.clang(0.9, pan, 1.4); cam.punch(6); G.hitstop(0.12);
      this.gainKi(10);
      this.startAtk(A.catchInto || 'heavy');
      return true;
    }
    // Karaktere özel ki tekniği (specials.js yüklü değilse genel Gölge Kesiği)
    specialName() {
      const s = ND.SPECIALS && ND.SPECIALS[this.ch.id];
      return s && ATK[s.atk] ? s.atk : 'special';
    }
    gainKi(v) { this.ki = Math.min(100, this.ki + v); }
    // ATK_LOCK: after a blocked / parried attack the next one waits (presses stay buffered for when it ends)
    canAtk() { const g = ND.game; return !(g && g.clock < this.atkLock); }
    lockAtk(kind) { const g = ND.game; if (g && g.clock != null) this.atkLock = Math.max(this.atkLock || 0, g.clock + ATK_LOCK[kind]); }
    isInv() {
      return this.dead || this.inv > 0 || this.state === 'down' || this.state === 'getup' || this.state === 'lock' ||
        (this.state === 'launch' && this.jug >= COMBO.jugMax) || // juggle limit: no more air hits until we land
        (this.state === 'dodge' && this.st > 0.02 && this.st < 0.25 * (this.ch.dodge || 1)) ||
        (this.state === 'atk' && this.atk.inv && this.st > this.atk.inv[0] && this.st < this.atk.inv[1]);
    }
    bladeActive() {
      if (this.state === 'plunge') return true;
      if (this.state !== 'atk' || this.atk.kind !== 'blade') return false;
      return !!this.curWin(true);
    }
    // Şu anki (ya da sıradaki) aktif pencere; çok vuruşlu saldırılar için
    curWin(onlyActive) {
      if (this.state !== 'atk' || !this.atk.active) return null;
      const a = this.atk, W = a.hits || [a.active];
      for (const w of W) {
        if (this.st >= w[0] && this.st <= w[1]) return w;
        if (!onlyActive && this.st < w[0]) return w;
      }
      return null;
    }
    passing() { const a = this.atk; return this.state === 'atk' && a.pass && this.st >= a.pass[0] && this.st <= a.pass[1]; }
    guardingFrom(att, fromX) {
      const g = this.state === 'guard' || this.state === 'block' || this.state === 'parry';
      return g && ((fromX ?? att.x) - this.x) * this.dir > 0;
    }
    get pan() { return cam.pan(this.x); }

    // ---------------------------------------------------- GÜNCELLEME
    update(dt) {
      this.st += dt * (this.state === 'atk' ? this.ch.spd * this.aspd : 1);
      if (this.inv > 0) this.inv -= dt;
      if (this.jit > 0) this.jit -= dt;
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 5);
      for (let i = this.ghosts.length - 1; i >= 0; i--) { this.ghosts[i].life -= dt; if (this.ghosts[i].life <= 0) this.ghosts.splice(i, 1); }
      if (this.id === 0 && ND.specialFx && !ND.specialFx.hooked) ND.specialFx.step(dt); // game.js çağırmıyorsa yedek
      if (this.dead) { this.updDead(dt); return; }
      const c = this.ctrl, o = this.opp, locked = this.locked;
      this.sinceHit += dt;
      // remember the direction held when light/heavy/kick went down: a buffered string press keeps its direction even if
      // the stick/key was let go before the chain window opened (keyboard and touch)
      for (let i = 0; i < 3; i++) { const b = BTNS[i], t = c.buf[b]; if (t != null && t !== this.pdT[b]) { this.pdT[b] = t; this.pdD[b] = c.axis(); } }
      if (this.state !== 'gbreak' && this.sinceHit > 1.1) {
        const r = (this.state === 'guard' ? 7 : 22) * (0.45 + 0.55 * this.hp / this.maxHp);
        this.posture = Math.max(0, this.posture - r * dt);
      }
      this.posture = Math.min(100, this.posture);
      if (this.ammo < this.ch.ammo) { this.ammoT += dt; if (this.ammoT > 3) { this.ammoT = 0; this.ammo++; } }
      this.ghostT -= dt;
      if (this.ghostT <= 0) this.ghost = Math.max(this.hp, this.ghost - 40 * dt);

      const free = this.state === 'move' || this.state === 'guard' || (this.state === 'land' && this.st > 0.08) || (this.state === 'shove' && this.st > 0.12);
      if (free && this.onGround) this.dir = o.x >= this.x ? 1 : -1;
      if (free && this.onGround && !locked) this.freeInput();

      let fr = 10;
      const walk = this.ch.walk;
      switch (this.state) {
        case 'move': {
          const ax = locked ? 0 : c.axis();
          const fwd = ax * this.dir;
          const tv = ax * (fwd > 0 ? WALK_F : WALK_B) * walk;
          this.vx = ND.M.approach(this.vx, tv, 11, dt); fr = 0;
          const tp = pose.copy(this.P.stance, this.tmp);
          const t = ND.scene.t + this.id;
          tp.hy += Math.sin(t * 2.3) * 1.3; tp.ay += Math.sin(t * 2.3 + 0.6) * 1.6; tp.sw += Math.sin(t * 1.15) * 0.035;
          tp.lean += clamp(this.vx * this.dir * 0.00035, -0.08, 0.1);
          if (this.hp / this.maxHp < 0.3) { tp.hy += 3 + Math.sin(t * 3.4) * 1.5; tp.lean += 0.08; tp.hd += 0.1; } // yorgun/yaralı duruş
          pose.approach(this.pose, tp, 13, dt);
          this.gaitFeet(dt);
          break;
        }
        case 'guard': {
          if (locked || !c.held('guard')) { this.setState('move'); break; }
          // karşılığın temasında gard sarsılır (görsel; gard tutmaya devam eder)
          const age = this.rk ? this.st - this.rkT : 9;
          pose.approach(this.pose, age < 0.18 ? pose.lerp(this.P.guard, this.rk, 0.42 * (1 - age / 0.18), this.tmp) : this.P.guard, 30, dt);
          break;
        }
        case 'block':
          pose.seq([[0, this.entry], [0.05, PO.blockHit, ease.outCubic], [this.dur, this.P.guard]], this.st, this.pose);
          fr = 7;
          if (!locked && this.st > 0.03 && this.tryCounter()) break;
          if (this.st >= this.dur) this.setState(c.held('guard') && !locked ? 'guard' : 'move');
          break;
        case 'recoil': {
          // karşılığın temasında tekniğe özel savrulma: kılıç yukarı (suriage), yere (uchiotoshi), boşa (nuki), yana (harai)
          const rk = this.rk, end = rk ? this.rkEnd : 0.32;
          if (rk) {
            RK[0][0] = this.rkT; RK[0][1] = this.rkE; RK[1][0] = this.rkT + 0.07; RK[1][1] = rk; RK[2][0] = this.rkT + 0.12; RK[2][1] = rk; RK[3][0] = end; RK[3][1] = this.P.stance;
            pose.seq(RK, this.st, this.pose);
          } else pose.seq([[0, this.entry], [0.06, PO.recoil, ease.outCubic], [0.32, this.P.stance, ease.inOut]], this.st, this.pose);
          fr = 8;
          if (!locked && this.st > 0.04) {
            if (c.held('guard')) { this.setState('guard'); break; }
            if (c.has('dodge', 0.2)) { this.setState('move'); this.freeInput(); break; }
          }
          if (this.st > end) this.setState('move');
          break;
        }
        case 'zanshin':
          // isabetli karşılıktan sonra kısa, oturmuş duruş; yalnız gard ya da atılmayla kesilir
          ZK[0][1] = this.entry; ZK[1][1] = this.zp; ZK[2][0] = this.dur; ZK[2][1] = this.zp;
          pose.seq(ZK, this.st, this.pose);
          fr = 9;
          if (!locked && this.st > 0.02) {
            if (c.held('guard')) { this.setState('guard'); break; }
            if (c.has('dodge', 0.2)) { this.setState('move'); this.freeInput(); break; }
          }
          if (this.st >= this.dur) this.setState('move');
          break;
        case 'parry':
          // the deflection (DEFL): parries without an attacker blade (reflected projectiles) pick one on entry
          if (!this.pk) this.parryPose(DEFL.pick(this, 'mid'));
          pose.seq(this.pk, this.st, this.pose);
          if (this.pv.slide && this.st >= this.pv.slide[0] && this.st <= this.pv.slide[1]) this.slideFx(this.pv, this.st);
          if (!this.mem.pSnd && this.st >= 0.02) { this.mem.pSnd = true; KAESHI.sound(this, 'clang'); }
          if (!locked && this.st > 0.02 && this.tryCounter()) break;
          if (this.st > 0.2) this.setState(c.held('guard') && !locked ? 'guard' : 'move');
          else if (!locked && this.st > 0.06) this.freeInput(true);
          break;
        case 'clash':
          pose.seq([[0, this.entry], [0.06, PO.blockHit, ease.outCubic], [0.34, this.P.stance]], this.st, this.pose);
          fr = 6;
          if (this.st > 0.34) this.setState('move');
          break;
        case 'lock': {
          const tp = pose.copy(this.lockWin ? PO.lockPush : PO.lock, this.tmp);
          tp.ax += Math.sin(ND.scene.t * 43 + this.id) * 1.2; tp.hy += Math.sin(ND.scene.t * 31) * 0.8;
          pose.approach(this.pose, tp, 18, dt); fr = 0; this.vx = 0;
          break;
        }
        case 'shove':
          pose.seq([[0, this.entry], [0.08, PO.lockPush, ease.outCubic], [0.3, this.P.stance]], this.st, this.pose);
          fr = 8;
          if (this.st > 0.3) this.setState('move');
          break;
        case 'atk': this.updAtk(dt); fr = this.drive ? 0 : 9; break;
        case 'air': {
          pose.approach(this.pose, this.vy < 0 ? PO.jump : PO.fall, 9, dt);
          const ax = locked ? 0 : c.axis();
          this.vx = clamp(ND.M.approach(this.vx, this.vx + ax * 60, 4, dt), -300, 300);
          if (!locked && this.canAtk()) {
            if (!this.airUsed && c.take('light')) { this.airUsed = true; this.startAtk('air'); }
            else if (!this.airUsed && c.take('heavy') && this.y < -50) { this.airUsed = true; this.setState('plunge'); this.vy = 1350; this.vx *= 0.3; au.swoosh(1.3, this.pan); }
          }
          fr = 0;
          break;
        }
        case 'plunge':
          pose.approach(this.pose, PO.plunge, 22, dt); fr = 0;
          if (!this.hitDone) this.checkBlade(ATK.plunge);
          break;
        case 'plungeLand':
          pose.seq([[0, this.entry], [0.05, PO.plungeLand, ease.outCubic], [0.38, PO.plungeLand], [0.6, this.P.stance]], this.st, this.pose);
          if (this.st > 0.6) this.setState('move');
          break;
        case 'land':
          pose.seq([[0, this.entry], [0.06, PO.land, ease.outCubic], [0.18, this.P.stance]], this.st, this.pose);
          if (this.st > 0.18) this.setState('move');
          break;
        case 'dodge': {
          const P = this.back ? PO.dodgeB : PO.dodgeF;
          pose.seq([[0, this.entry], [0.07, P, ease.outCubic], [0.24, P], [0.36, this.P.stance]], this.st, this.pose);
          const k = this.st < 0.26 ? 1 : Math.max(0, 1 - (this.st - 0.26) * 8);
          this.vx = this.ddir * (this.back ? 520 : 760) * k * (1 - this.st * 1.2) * (0.9 + walk * 0.1) * (this.ch.dodge || 1); fr = 0;
          if ((!this.back || this.ch.shadow) && this.st > 0.03 && this.st < 0.22 && ((this.st * 60) | 0) % 3 === 0) this.addGhost(this.ch.shadow ? 0.4 : 0.22);
          if (!locked && !this.back && this.st > 0.05 && this.st < 0.3 && this.canAtk()) {
            if (c.take('light')) { this.startOpener('dash'); break; }
            if (c.take('heavy')) { this.startOpener('dashHeavy'); break; }
          }
          if (this.st > 0.36) this.setState('move');
          break;
        }
        case 'hurt':
          pose.seq([[0, this.entry], [0.07, this.hurtPose, ease.outCubic], [this.dur, this.P.stance, ease.inOut]], this.st, this.pose);
          fr = 6;
          if (this.st >= this.dur) this.setState('move');
          break;
        case 'stagger':
          pose.seq([[0, this.entry], [0.1, this.rk || PO.stagger, ease.outCubic], [0.55, this.rk || PO.stagger], [0.74, this.P.stance]], this.st, this.pose);
          fr = 7;
          if (this.st > 0.74) this.setState('move');
          break;
        case 'gbreak':
          pose.seq([[0, this.entry], [0.15, PO.gbreak, ease.outCubic], [1.0, PO.gbreak], [1.2, this.P.stance]], this.st, this.pose);
          fr = 6;
          if (this.st > 1.2) { this.posture = 45; this.setState('move'); }
          break;
        case 'launch':
          pose.approach(this.pose, this.wallBounced && this.st < 0.25 ? PO.wallHit : PO.launch, 12, dt); fr = 0;
          break;
        case 'down':
          pose.seq([[0, this.entry], [0.14, PO.down, ease.outCubic]], this.st, this.pose);
          fr = 5;
          if (this.st > 0.75) this.setState('getup');
          break;
        case 'getup':
          pose.seq([[0, this.entry], [0.24, PO.kneel, ease.inOut], [0.46, this.P.stance, ease.outCubic]], this.st, this.pose);
          if (this.st > 0.46) { this.inv = 0.15; this.setState('move'); }
          break;
        case 'win':
          pose.seq([[0, this.entry], [0.25, PO.chiburi, ease.outQuart], [0.5, PO.chiburi], [1.3, PO.victory, ease.inOut]], this.st, this.pose);
          if (!this.sfx && this.st > 0.12) { this.sfx = true; au.swoosh(0.9, this.pan); }
          break;
      }

      // fizik
      // özel teknik havada (senaryolu yay) kesilirse düşsün
      if (this.onGround && this.y < -0.5 && !(this.state === 'atk' && this.atk.arc)) { this.onGround = false; this.vy = Math.max(this.vy, 0); }
      if (!this.onGround) this.vy += GRAV * dt * (this.state === 'launch' && this.jug ? 1 + COMBO.jugGrav * this.jug : 1);
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.onGround && fr > 0) this.vx *= Math.exp(-fr * dt);
      if (!this.onGround && this.y >= 0) { this.y = 0; this.vy = 0; this.onGround = true; this.landed(); }
      const A = ND.ARENA;
      if (Math.abs(this.x) > A) {
        const side = Math.sign(this.x);
        this.x = side * A;
        if (this.state === 'launch' && !this.wallBounced && this.vx * side > 180) {
          // duvara çarpıp sekme
          this.wallBounced = true; this.st = 0;
          this.vx = -this.vx * 0.42; this.vy = Math.min(this.vy, -280);
          fx.dust(this.x + side * 10, this.y - 80, 10, 0.8); fx.spark(this.x + side * 12, this.y - 90, side > 0 ? Math.PI : 0, 6, 0.5, '220,210,190');
          fx.text(this.x - side * 30, -210, 'DUVAR!', '#d9dbe6');
          au.thud(1.2, this.pan); cam.punch(8); ND.game.hitstop(0.06);
        } else if (this.vx * side > 0) this.vx = 0;
      }
    }

    // Karşılık penceresi açıkken saldırı → kaeshi-waza (yöne göre)
    tryCounter() {
      if (!this.onGround || ND.game.clock >= this.counterUntil) return false;
      const c = this.ctrl, ax = c.axis() * this.dir;
      let name = null;
      // tampon 0.3 sn (gerçek zaman): savuşturma duraksaması (0.17 sn) sırasında erken basılan tuş da sayılsın
      if (c.take('heavy', 0.3)) name = 'kaeshiHeavy';
      else if (c.take('light', 0.3)) name = ax < 0 ? 'mawari' : ax > 0 ? 'sweep' : 'riposte';
      if (!name) return false;
      this.counterUntil = 0;
      const r = ND.game.onCounter(this, name, this.counterSource);
      this.counterSource = null;
      this.dir = this.opp.x >= this.x ? 1 : -1;
      this.startAtk(r.name, r.speed);
      if (ND.game.rally.last === this) ND.game.rally.serial = this.serial;
      if (ND.cine) ND.cine.counterStart(this, this.atkName);
      return true;
    }
    // kind: 'parry' | 'block' (the counter prompt is big after a parry, small after a block)
    openCounter(win, kind, source) {
      const timing = playerTiming(this);
      if (timing) win = kind === 'parry' ? timing.counter : timing.blockCounter;
      this.counterWin = win; this.counterUntil = ND.game.clock + win; this.cwKind = kind || 'block';
      this.counterSource = source || null;
      if (kind !== 'parry') this.pdDir = null; // a reply after a plain block has no deflection to flow from
    }

    // ---------------------------------------------------- SAVUŞTURMA: saptırma hareketi (DEFL)
    // own guard + the variant's delta, built once per fighter/character and variant
    pdPose(v, i) {
      const C = this._pd || (this._pd = {}), key = v.id + i;
      let p = C[key];
      if (!p) { p = C[key] = pose.copy(this.P.guard); const d = v.k[i]; for (const k in d) p[k] += d[k]; }
      return p;
    }
    parryPose(v) {
      const K = this.pkA;
      K[0][1] = this.entry; K[1][1] = this.pdPose(v, 1); K[2][1] = this.pdPose(v, 2); K[3][1] = this.P.guard;
      this.pk = K; this.pv = v; this.pdLast = v.id; this.pdDir = v.dir;
      return v;
    }
    // The pose that meets the attack (the parry's first frame, shown through the hit-stop): a sword-like front weapon
    // turns onto the point the attack reached (never more than 2.1 rad, never pointing back into ourselves); weapons
    // that parry with another part (staff end, back blade, fan, chain) take the variant's own meeting key.
    meetPose(v, x, y) {
      const M = pose.copy(this.entry, this.pdM), j = this.j;
      if (v.slide[4]) return pose.copy(this.pdPose(v, 0), M);
      if (!j.haF) return M;
      const dx = (x - j.haF.x) * this.dir, dy = y - j.haF.y;
      if (dx * dx + dy * dy < 144) return M;
      let t = Math.atan2(dy, Math.max(dx, 8));
      while (t - M.sw > Math.PI) t -= TAU;
      while (M.sw - t > Math.PI) t += TAU;
      M.sw += clamp(t - M.sw, -2.1, 2.1);
      return M;
    }
    // Enter the parry against att's attack a (contact reported at x, y). The attacker's weapon is thrown the way the
    // deflection sends it; returns the point where the two weapons actually touch (for the parry sparks).
    parryStart(att, a, x, y, kind) {
      this.setState('parry');
      const v = this.parryPose(DEFL.pick(this, kind)), R = DRX[v.dir];
      // the first frame already meets the blade (it holds through the hit-stop), then the deflection drives it away
      pose.copy(this.meetPose(v, x, y), this.entry); pose.copy(this.entry, this.pose);
      // the attacker's blade stays on ours for a moment (rkT), then flies: our blade reads as the one driving it
      if (att.state === 'recoil') { att.rk = PO[R[0]]; att.rkT = 0.015; pose.copy(att.pose, att.rkE); att.rkEnd = 0.32; }
      else if (att.state === 'stagger') att.rk = PO[R[1]];
      // where the blades touch: the closest points of the attacker's blade and the part of our weapon that deflects
      const aj = att.j, m = v.slide[4], j = m ? this.j : ND.solve(this.pose, this.x, this.y, this.dir, DJ, this.wpn);
      DP.x = x; DP.y = y;
      if (aj.haF && aj.tip && j.haF && j.tip) {
        let x0 = j.haF.x, y0 = j.haF.y, x1 = j.tip.x, y1 = j.tip.y;
        if (m) { const p0 = this.wpnPt(0, m, CP); x0 = p0.x; y0 = p0.y; const p1 = this.wpnPt(1, m, CP); x1 = p1.x; y1 = p1.y; }
        const r = segSeg(x0, y0, x1, y1, aj.haF.x, aj.haF.y, aj.tip.x, aj.tip.y);
        if (r.d < 36) { DP.x = r.x; DP.y = r.y; }
      }
      return DP;
    }

    // ---------------------------------------------------- KARŞILIK TEKNİĞİ: temas, kayma, savrulma, isabet hissi
    // Kendi silahımızda u oranındaki nokta. m (slide[4]): 'B' arka eldeki ters tutuşlu bıçak (dirseğe doğru),
    // 'BF' arka eldeki ikinci silah (yelpaze; önkolun uzantısında), 'P' kabza/arka uç (bō, naginata sapı), yoksa ön silah
    wpnPt(u, m, out) {
      const j = this.j;
      if ((m === 'B' || m === 'BF') && j.haB && j.elB) {
        const s = m === 'B' ? 1 : -1, dx = (j.elB.x - j.haB.x) * s, dy = (j.elB.y - j.haB.y) * s, d = Math.hypot(dx, dy) || 1, L = this.wpn.blade * u;
        out.x = j.haB.x + (dx / d) * L; out.y = j.haB.y + (dy / d) * L;
      } else if (m === 'P' && j.pom) { out.x = j.haF.x + (j.pom.x - j.haF.x) * u; out.y = j.haF.y + (j.pom.y - j.haF.y) * u; }
      else if (m === 'C' && j.pom && j.haB) { out.x = j.pom.x + (j.haB.x - j.pom.x) * u; out.y = j.pom.y + (j.haB.y - j.pom.y) * u; } // kusarigama chain
      else { out.x = j.haF.x + (j.tip.x - j.haF.x) * u; out.y = j.haF.y + (j.tip.y - j.haF.y) * u; }
      return out;
    }
    // Savunma hareketinin rakibin silahına değdiği an: kıvılcım/talaş, ses, kısa donma, rakibin tepki pozu
    kaeshiContact(a, o) {
      const S = a.slide, p = this.wpnPt(S ? S[3] : 0.6, S && S[4], CP), oj = o.j;
      let x = p.x, y = p.y;
      const near = !a.whiff && !(S && S[4]) && oj.tip && oj.haF && Math.abs(o.x - this.x) < 260;
      if (a.wrap && this.chain && this.chain.init) { const C = this.chain; x = C.x[C.n - 1]; y = C.y[C.n - 1]; } // zincir ağırlığının dolandığı yer
      else if (near) { const r = segSeg(this.j.haF.x, this.j.haF.y, this.j.tip.x, this.j.tip.y, oj.haF.x, oj.haF.y, oj.tip.x, oj.tip.y); if (r.d < 70) { x = r.x; y = r.y; } }
      const wood = KAESHI.wood[this.wpn.type], col = wood ? '240,220,180' : '255,232,176', side = Math.atan2(-1, -this.dir);
      if (a.whiff) {
        // nuki: rakibin kılıcı boşa geçer — hava çizgisi, toz
        const ox = oj.tip ? oj.tip.x : o.x, oy = oj.tip ? oj.tip.y : o.y - 110;
        fx.flash(ox, oy, Math.atan2(oy - (oj.haF ? oj.haF.y : oy), ox - (oj.haF ? oj.haF.x : ox)), 46, '200,215,255');
        fx.dust(this.x, 0, 5, 0.8);
        KAESHI.sound(this, 'whiff');
        this.kaeshiStop(o, 0.025);
      } else if (a.ground) {
        // uchiotoshi: kılıç yere çakılır — zeminde kıvılcım, toz, halka
        const C = a.wpath && this.chain && this.chain.init ? this.chain : null;
        const gx = C ? C.x[C.n - 1] : clamp(this.j.tip.x, Math.min(this.x, o.x) - 40, Math.max(this.x, o.x) + 60);
        fx.spark(gx, -3, -Math.PI / 2, 30, 1.3, col); fx.spark(x, y, side, 10, 0.8, col);
        fx.dust(gx, 0, 12, 1.4); fx.ring(gx, -4, '255,236,190', 95); fx.flash(gx, -8, -Math.PI / 2, 95, '255,236,190');
        KAESHI.sound(this, 'ground');
        cam.punch(6); this.kaeshiStop(o, 0.06);
      } else {
        fx.spark(x, y, side, wood ? 8 : 16, wood ? 0.6 : 1, col); fx.flash(x, y, Math.atan2(this.j.tip.y - this.j.haF.y, this.j.tip.x - this.j.haF.x), 52, '255,240,210');
        if (wood) fx.dust(x, y, 3, 0.5);
        KAESHI.sound(this, a.wrap ? 'wrap' : 'clang');
        cam.punch(3); this.kaeshiStop(o, 0.04);
      }
      if (a.react) o.knockAside(a.react);
    }
    // Temas donması. Savuşturma penceresi gerçek zamanla ölçülür (ctrl.since): donma, savunanın erken bastığı gard ile
    // darbe arasına düştüğü için basış anını donma kadar ileri al — pencere oyun zamanında aynı kalır (adil zamanlama).
    kaeshiStop(o, d) {
      const G = ND.game, before = Math.max(0, G.hitstopT || 0);
      G.hitstop(d);
      const added = Math.max(0, d - before), b = o.ctrl && o.ctrl.buf;
      if (added > 0 && b && b.guard != null) b.guard += added;
    }
    // Karşılığın temasında saldıranın tepkisi (geri sekme ya da gard içinde sarsılma); zamanlama değişmez
    knockAside(name) {
      const P = PO[name];
      if (!P || (this.state !== 'recoil' && this.state !== 'guard')) return;
      this.rk = P; this.rkT = this.st; pose.copy(this.pose, this.rkE);
      this.rkEnd = Math.max(0.32, this.st + 0.2);
    }
    // Temas boyunca kılıç üzerinde kayan kıvılcım (≈90 Hz, kısa)
    slideFx(a, t) {
      const q = (t * 90) | 0;
      if (q === this.mem.slq) return;
      this.mem.slq = q;
      const S = a.slide, u = S[2] + (S[3] - S[2]) * clamp((t - S[0]) / Math.max(1e-3, S[1] - S[0]), 0, 1);
      const p = this.wpnPt(u, S[4], CP), wood = KAESHI.wood[this.wpn.type] || S[4] === 'P';
      fx.spark(p.x, p.y, Math.atan2(-1, -this.dir * 0.6), wood ? 1 : 3, wood ? 0.35 : 0.5, wood ? '235,215,180' : '255,236,190');
    }
    // İsabetli karşılık: biraz daha uzun donma + küçük kamera itişi (zoom-in), seri doruğunda daha güçlü
    counterJuice(a, x, y, dmg) {
      const G = ND.game, last = !a.hits || this.hitIdx >= a.hits.length - 1;
      // heavier than any normal cut: the counter's hit freezes noticeably longer
      G.hitstop((G.hitstopT || 0) + (last ? (a.fin ? 0.1 : 0.085) : 0.03));
      if (G.phase === 'fight') {
        const k = last ? (a.fin ? 1.1 : 1.06) : 1.025;
        cam.z = Math.min(2.2, cam.z * k); cam.x += (x - cam.x) * (last ? 0.16 : 0.06); cam.y += (y - cam.y) * 0.08;
      }
      if (ND.cine) ND.cine.counterHit(this, this.opp, a, x, y, dmg, last);
      if (G.counterFx) G.counterFx(this, this.opp, a, x, y);
    }

    freeInput(fromParry) {
      const c = this.ctrl;
      if (this.tryCounter()) return;
      const ready = this.canAtk();
      if (ready && this.ki >= 100 && (c.take('special') || (this.state === 'guard' && c.take('heavy')))) return this.startAtk(this.specialName());
      if (ready) c.take('special');
      if (c.take('dodge')) {
        let d = c.tapDir || c.axis();
        if (!d) d = -this.dir;
        this.setState('dodge', { ddir: d, back: d !== this.dir });
        this.dir = this.opp.x >= this.x ? 1 : -1;
        fx.dust(this.x, 0, 6); au.swoosh(0.5, this.pan); return;
      }
      // a press just after a chainable move ended still continues the string (human players only, see LENIENT)
      const L = this.late;
      if (L && ready && this.state === 'move' && this.onGround && ND.simClock <= L.until) {
        const nx = this.route(null, L.name, L.landed);
        if (nx) { this.late = null; this.chainN = L.chainN + 1; return this.startAtk(nx); }
      }
      // command normals: the direction held at the press (forward / back toward the opponent) picks the move
      if (ready) {
        if (c.take('heavy')) return this.startOpener(this.cmd('heavy'));
        if (c.take('light')) return this.startOpener(this.cmd('light'));
        if (c.take('kick')) return this.startOpener('kick');
        if (c.take('throw')) { if (this.ammo > 0) return this.startAtk('throw'); }
      }
      if (fromParry) return;
      if (c.take('up')) {
        this.setState('air'); this.onGround = false; this.vy = JUMP_V; this.airUsed = false;
        this.vx = c.axis() * 260 * this.ch.walk; fx.dust(this.x, 0, 5); au.step(this.pan, 2.5); return;
      }
      if (c.held('guard') && this.state !== 'guard') this.setState('guard');
    }

    updAtk(dt) {
      const a = this.atk, c = this.ctrl, o = this.opp;
      // basılı tutma (şarj): a.hold = { key, t, max } — tuş basılıyken animasyon t'de bekler, şarj birikir
      if (a.hold && !this.mem.rel && this.st >= a.hold.t) {
        const H = a.hold;
        if (!this.locked && c.held(H.key) && (this.mem.charge || 0) < H.max) { this.mem.charge = (this.mem.charge || 0) + dt; this.st = H.t; }
        else this.mem.rel = true;
      }
      const t = this.st;
      // late direction: LIGHT/HEAVY pressed a hair before the direction key still gives the command normal
      if (!this.mem.dirFix && this.chainN === 0 && (this.atkName === 'light1' || this.atkName === 'heavy')) {
        const ax = c.axis() * this.dir, sinceAtk = t / (this.ch.spd * this.aspd) + 0.01;
        if (t > LENIENT.dir * this.ch.spd) this.mem.dirFix = true;
        else if (ax && !this.locked && ND.game.isHuman && ND.game.isHuman(this) && c.since(c.held('right') ? 'right' : 'left') <= sinceAtk) {
          this.mem.dirFix = true;
          const nm = this.atkName === 'light1' ? (ax > 0 ? 'fLight' : 'bLight') : (ax > 0 ? 'fHeavy' : 'bHeavy');
          return this.startOpener(nm);
        }
      }
      pose.seq(this.keys, t, this.pose);
      this.drive = false;
      // counter technique: coloured afterimages trail the body through the cut (reuses the ghost system)
      if (a.counter && a.active && t < (a.hits ? a.hits[a.hits.length - 1][1] : a.active[1]) + 0.04 && ((t * 60) | 0) % 2 === 0) this.addGhost(0.32, ND.cine && ND.cine.ghostCol(this));
      if (a.lunge && t >= a.lunge[0] && t < a.lunge[1] && this.onGround) {
        const gap = Math.abs(o.x - this.x);
        this.vx = this.dir * a.lunge[2] * (gap < 70 && !a.special && !a.pass ? 0.2 : 1); this.drive = true;
      }
      if (a.turn && !this.turned && t >= a.turn) { const d0 = this.dir; this.turned = true; this.dir = o.x >= this.x ? 1 : -1; this.mem.flip = this.dir !== d0; }
      if (a.lunge2 && t >= a.lunge2[0] && t < a.lunge2[1] && this.onGround) { this.vx = this.dir * a.lunge2[2]; this.drive = true; }
      // zamanlı olaylar [[t, fn(f, a, o)]] ve kare başı kanca tick(f, dt, t, o) — specials.js
      if (a.ev) {
        while (this.evI < a.ev.length && this.st >= a.ev[this.evI][0]) {
          a.ev[this.evI++][1](this, a, o);
          if (this.state !== 'atk' || this.atk !== a) return;
        }
      }
      if (a.tick) { a.tick(this, dt, this.st, o); if (this.state !== 'atk' || this.atk !== a) return; }
      // karşılık kancaları: gövde dönüşü (spin: [t0, t1, tur, başlangıç açısı] → kesirli yön), takla (rollT), kılıç teması, kayan kıvılcım
      if (a.spin) {
        const S = a.spin;
        let c2 = 1;
        if (t >= S[0] && t < S[1]) c2 = Math.cos((S[3] || 0) + ((t - S[0]) / (S[1] - S[0])) * TAU * S[2]);
        // rakibin yanından geçilemediyse (dönüşte yön değişmedi): ani aynalanma olmasın — dönüş sonrası yarım tur
        // hiç yapılmaz, dönüş öncesi yarım tur tam tura tamamlanır
        if (a.turn && this.turned && !this.mem.flip) c2 = S[3] ? 1 : t < a.turn + 0.08 ? Math.cos(Math.PI * (1 + (t - a.turn) / 0.08)) : 1;
        this.vdir = (c2 < 0 ? -1 : 1) * Math.max(0.12, Math.abs(c2));
      }
      if (a.rollT) { const R = a.rollT; this.roll = t >= R[0] && t < R[1] ? this.dir * TAU * ease.inOutSine((t - R[0]) / (R[1] - R[0])) : 0; }
      if (a.defl != null && !this.mem.defl && t >= a.defl) { this.mem.defl = true; this.kaeshiContact(a, o); if (this.state !== 'atk' || this.atk !== a) return; }
      if (a.slide && t >= a.slide[0] && t <= a.slide[1]) this.slideFx(a, t);
      if (a.hits) {
        const w = a.hits.findIndex((h) => t >= h[0] && t <= h[1]);
        if (w >= 0 && w !== this.hitIdx) { this.hitIdx = w; this.hitDone = false; if (w > 0) au.swoosh(1.1, this.pan); }
      }
      if (a.sw != null && !this.sfx && t >= a.sw) { this.sfx = true; au.swoosh(a.pw, this.pan); if (a.special) au.swoosh(1.4, this.pan); }
      if (a.cross && t >= a.active[0] && t <= a.active[1] + 0.05) {
        if (this.dashFrom == null) this.dashFrom = this.x;
        this.addGhost(0.4);
        if (!this.hitDone && !o.isInv() && Math.abs(o.y - this.y) < 120 && Math.sign(o.x - this.dashFrom) !== Math.sign(o.x - this.x)) {
          if (o.guardingFrom(this, this.dashFrom)) this.blocked(a, o.x, o.y - 100, false, this.dashFrom);
          else this.landHit(a, 'body', o.x, o.y - 105);
        }
      }
      if (this.ch.shadow && a.kind === 'blade' && this.curWin(true)) this.addGhost(0.3);
      if (a.hide) this.hidden = t >= a.hide[0] && t < a.hide[1]; // shadow step: unseen while it moves
      if (a.kind === 'blade' && !this.hitDone && this.curWin(true)) { if (a.zone) this.checkZone(this.hitAtk(a)); else this.checkBlade(this.hitAtk(a)); }
      if (a.kind === 'kick' && !this.hitDone && this.curWin(true)) { if (a.zone) this.checkZone(this.hitAtk(a), true); else this.checkKick(this.hitAtk(a)); }
      if (a.kind === 'whip' && !this.hitDone && this.curWin(true)) { if (a.zone) this.checkZone(this.hitAtk(a)); else this.checkWhip(this.hitAtk(a)); }
      if (this.state !== 'atk' || this.atk !== a) return; // hit / block / catch changed our state
      // ki cancel: on contact (hit, or a blocked strike that does not bounce us back) a.sc moves go straight into the ki technique
      if (!this.locked && a.sc && this.hitDone && this.ki >= 100 && this.canAtk() && this.onGround && a.active && t >= a.active[0] && c.take('special', 0.25)) {
        this.chainN++; fx.text(this.x, -228, (ND.TXT && ND.TXT.kiCancel) || 'KI!', this.col.ui);
        return this.startAtk(this.specialName());
      }
      if (a.kind === 'throw' && !this.thrown && t >= a.release) {
        this.thrown = true; this.ammo--;
        const mk = a.proj && ND.PROJ && ND.PROJ[a.proj];
        ND.game.projs.push(mk ? mk(this) : new Shuriken(this, this.j.haB.x, this.j.haB.y, this.dir)); if (!mk) au.whistle(this.pan);
      }
      if (!this.locked) {
        if (a.chain && t >= a.chain[0] && t <= a.chain[1] && this.chainN < COMBO.chainMax && this.canAtk()) {
          const nx = this.route(a, this.atkName, this.mem.landed);
          if (nx) { this.chainN++; return this.startAtk(nx); }
        }
        if (a.active && !a.special && !a.hits && t > a.active[1] + 0.07 && this.onGround && c.has('dodge', 0.15)) { this.freeInput(); if (this.state !== 'atk') return; }
      }
      // isabetli karşılık (çok vuruşluda son vuruş) → zanshin
      if (a.zan && this.mem.landed != null && t >= a.zan[0] && this.onGround && (!a.hits || this.mem.landed >= a.hits.length - 1)) {
        this.setState('zanshin', { zp: PO[a.zan[1]] || this.P.stance, dur: a.zan[2] });
        KAESHI.sound(this, 'zan');
        return;
      }
      if (t >= a.dur) {
        if (a.special || a.turnEnd) this.dir = o.x >= this.x ? 1 : -1;
        const late = a.chain && this.onGround && !this.locked && this.chainN < COMBO.chainMax && ND.game.isHuman && ND.game.isHuman(this)
          ? { name: this.atkName, landed: this.mem.landed, chainN: this.chainN, until: ND.simClock + LENIENT.late } : null;
        if (!this.onGround) { this.setState('air'); this.airUsed = true; }
        else { this.setState('move'); this.late = late; }
      }
    }

    // Çok vuruşlu saldırıda yalnız son vuruş yere serer
    hitAtk(a) {
      if (!a.hits || !a.knockLast) return a;
      return this.hitIdx >= a.hits.length - 1 ? Object.assign({}, a, { knock: true }, a.lastHit) : a;
    }
    // col: tint (counter afterimages use their technique's colour and appear even without much travel)
    addGhost(life, col) {
      const last = this.ghosts[this.ghosts.length - 1];
      if (last && (col ? last.max - last.life < 0.03 && Math.abs(last.x - this.x) < 8 : Math.abs(last.x - this.x) < 26)) return;
      this.ghosts.push({ j: ND.cloneJ(this.j), life, max: life, x: this.x, c: col || null });
      if (this.ghosts.length > (col && !ND.settings.hq ? 2 : 8)) this.ghosts.shift();
    }

    landed() {
      const s = this.state;
      ND.scene.footprint(this.x, this.dir, true);
      if (s === 'plunge') {
        this.setState('plungeLand'); this.vx = 0;
        fx.dust(this.x + this.dir * 40, 0, 14, 1.6); fx.ring(this.x + this.dir * 60, -4, '200,210,240', 70);
        au.thud(1.1, this.pan); cam.punch(7);
      } else if (s === 'launch') {
        this.setState('down'); fx.dust(this.x, 0, 12, 1.4); au.thud(1.2, this.pan); cam.punch(6);
      } else if (s === 'hurt') {
        this.setState('down'); fx.dust(this.x, 0, 8); au.thud(0.8, this.pan);
      } else if (s === 'atk' || s === 'air') {
        this.setState('land'); fx.dust(this.x, 0, 6); au.step(this.pan, 3);
      }
    }

    gaitFeet(dt) {
      const sp = Math.abs(this.vx);
      this.walkBlend = ND.M.approach(this.walkBlend, sp > 30 ? 1 : 0, 8, dt);
      const Ls = 24, lift = 12;
      this.gait = (this.gait + (sp * dt) / (4 * Ls)) % 1;
      const s = this.vx * this.dir >= 0 ? 1 : -1;
      const feet = [[8, 'f1x', 'f1y', 0], [-12, 'f2x', 'f2y', 0.5]];
      for (let i = 0; i < 2; i++) {
        const [base, kx, ky, off] = feet[i];
        const q = (this.gait + off) % 1;
        let x, y;
        if (q < 0.5) { x = s * Ls * (1 - 4 * q); y = 0; }
        else { const u = (q - 0.5) * 2; x = s * Ls * (-1 + 2 * u); y = -Math.sin(Math.PI * u) * lift; }
        const w = this.walkBlend;
        this.pose[kx] = this.P.stance[kx] * (1 - w) + (base + x) * w;
        this.pose[ky] = this.P.stance[ky] * (1 - w) + y * w;
        if (w > 0.5 && this.lastStepQ[i] > 0.9 && q < 0.1) { au.step(this.pan); ND.scene.footprint(this.x + (base + s * Ls) * this.dir, this.dir); }
        this.lastStepQ[i] = q;
      }
      this.pose.hy -= Math.abs(Math.sin(this.gait * Math.PI * 2)) * 3 * this.walkBlend;
    }

    // ---------------------------------------------------- VURUŞ TESTLERİ
    checkBlade(a) {
      const o = this.opp, j = this.j;
      if (o.isInv() || !this.prevBlade) return;
      const pb = this.prevBlade, dual = this.wpn.dual && j.pom && this.prevPom, og = o.wpn.dual && o.j.pom ? o.j.pom : o.j.haF;
      if (o.bladeActive()) {
        let r = segSeg(j.haF.x, j.haF.y, j.tip.x, j.tip.y, og.x, og.y, o.j.tip.x, o.j.tip.y);
        if (dual && r.d >= 12) r = segSeg(j.haF.x, j.haF.y, j.pom.x, j.pom.y, og.x, og.y, o.j.tip.x, o.j.tip.y);
        if (r.d < 12) return this.clash(r.x, r.y);
      }
      const hb = ND.hurtboxes(o.j), guarding = o.guardingFrom(this, this.dashFrom);
      for (let seg = 0; seg < (dual ? 2 : 1); seg++) {
        const ex = seg ? j.pom.x : j.tip.x, ey = seg ? j.pom.y : j.tip.y, px = seg ? this.prevPom[0] : pb[2], py = seg ? this.prevPom[1] : pb[3];
        for (let s = 1; s <= 4; s++) {
          const u = s / 4;
          const hx = pb[0] + (j.haF.x - pb[0]) * u, hy = pb[1] + (j.haF.y - pb[1]) * u;
          const tx = px + (ex - px) * u, ty = py + (ey - py) * u;
          if (guarding) {
            const r = segSeg(hx, hy, tx, ty, og.x, og.y, o.j.tip.x, o.j.tip.y);
            if (r.d < 10) return this.blocked(a, r.x, r.y, false, this.dashFrom);
          }
          for (const h of hb) {
            const r = segSeg(hx, hy, tx, ty, h[0], h[1], h[2], h[3]);
            if (r.d < h[4]) {
              if (guarding) return this.blocked(a, r.x, r.y, false, this.dashFrom);
              return this.landHit(a, h[5], r.x, r.y);
            }
          }
        }
      }
    }
    // Alan vuruşu: a.zone = [ileri menzil, geri menzil, dikey tolerans] — dönen/çok vuruşlu teknikler için
    checkZone(a, isKick) {
      const o = this.opp, z = a.zone;
      if (o.isInv()) return;
      const dx = (o.x - this.x) * this.dir;
      if (dx > z[0] || dx < -z[1] || Math.abs(o.y - this.y) > (z[2] || 110)) return;
      const side = Math.sign(o.x - this.x) || this.dir, x = o.x - side * 12, y = o.y - 104;
      if (o.guardingFrom(this, this.x)) return this.blocked(a, x, y, !!isKick, this.x);
      return this.landHit(a, 'body', x, y, side);
    }
    // Zincir ağırlığı: önceki → şimdiki konum süpürmesi + son zincir halkası (kalınlık), hurtbox'lara karşı
    checkWhip(a) {
      const o = this.opp, C = this.chain;
      if (!C || o.isInv()) return;
      const L = C.n - 1, x1 = C.x[L], y1 = C.y[L], x0 = C.wpx, y0 = C.wpy, x2 = C.x[L - 2], y2 = C.y[L - 2];
      const guarding = o.guardingFrom(this, this.x);
      for (const h of ND.hurtboxes(o.j)) {
        let r = segSeg(x0, y0, x1, y1, h[0], h[1], h[2], h[3]);
        if (r.d > h[4] + 7) { r = segSeg(x2, y2, x1, y1, h[0], h[1], h[2], h[3]); if (r.d > h[4] + 4) continue; }
        if (guarding) return this.blocked(a, r.x, r.y, false, this.x);
        return this.landHit(a, h[5], r.x, r.y);
      }
    }
    // strikes with the body (kick, knee, elbow, shoulder, head, pommel): a.limb names the striking joint
    checkKick(a) {
      const o = this.opp, f = this.j[a.limb || 'ftF'] || this.j.ftF;
      if (o.isInv()) return;
      for (const h of ND.hurtboxes(o.j)) {
        const r = segSeg(f.x, f.y, f.x, f.y, h[0], h[1], h[2], h[3]);
        if (r.d < h[4] + (a.limbR || 9)) {
          if (o.guardingFrom(this)) return this.blocked(a, r.x, r.y, true);
          return this.landHit(a, h[5] === 'head' ? 'head' : 'body', r.x, r.y);
        }
      }
    }

    landHit(a, part, x, y, kdir) {
      const o = this.opp;
      this.hitDone = true;
      if (ND.game.phase === 'timeup') return; // süre bittikten sonra (ör. görünmezken başlamış teknik) sonuç değişmesin
      if (o.tryCatch(this, a)) return; // Akane's draw stance catches the blow
      let dmg = a.dmg * this.ch.dmg * (a.kind === 'kick' ? this.ch.kickMul || 1 : 1), txt = null;
      if (part === 'head') dmg *= 1.35; else if (part === 'leg') dmg *= 0.8;
      if (o.state === 'atk' && o.atk.active && o.st < o.atk.active[0]) { dmg *= 1.3; txt = 'KARŞI!'; }
      if (o.state === 'stagger' || o.state === 'gbreak') { dmg *= 1.5; txt = 'KRİTİK!'; }
      if (part === 'head' && !txt && a.kind === 'blade') txt = 'KAFA!';
      if (a.special) txt = a.hits && this.hitIdx > 0 ? (a.hitTxt || null) : (a.kanji || '影斬り');
      if (a.counter) {
        dmg *= 1 + 0.1 * Math.min(8, ND.game.rally.n);
        // tekniğin adı (ND.TXT): SURIAGE! / HARAI! / NUKI! / UCHIOTOSHI!
        const tn = a.tech && ND.TXT && ND.TXT[a.tech];
        if (tn && (!txt || txt === 'KAFA!')) txt = tn;
        else if (!txt) txt = a.trip ? 'SÜPÜRME!' : this.atkName === 'mawari' ? 'ARKADAN!' : a.fin ? null : 'KARŞILIK!';
      }
      dmg = Math.round(dmg);
      if (txt) fx.text(x, y - 34, txt, txt === 'KAFA!' ? '#f2d0c8' : '#ffd27a');
      this.gainKi(ND.scaleDmg(dmg, a) * 1.6);
      this.mem.landed = this.hitIdx;
      const hp0 = o.hp;
      o.takeHit(dmg, a, this, x, y, part, kdir ?? this.dir);
      if (a.counter) this.counterJuice(a, x, y, hp0 - o.hp);
      // çekme (zincirle yakalama): a.pull = bırakılacak mesafe; rakip saldırana doğru sürüklenir
      if (a.pull && !o.dead && (o.state === 'hurt' || o.state === 'launch')) {
        const gap = (o.x - this.x) * this.dir;
        if (gap > a.pull) {
          o.vx = -this.dir * Math.min(1400, (gap - a.pull) * (o.state === 'hurt' ? 6.2 : 1.6));
          if (o.state === 'hurt') o.dur = Math.max(o.dur, a.pullStun || 0.55);
        }
        this.mem.caught = o;
      }
      if (a.onHit && !o.dead) a.onHit(this, o, x, y);
    }

    // raw: ham (ölçeksiz) hasar — his efektleri bununla; can kaybı ND.DMG ile ölçeklenir
    takeHit(raw, a, from, x, y, part, kdir) {
      if (ND.game.phase === 'timeup') return;
      // süper zırh: hasar alır ama teknik kesilmez
      const armor = this.state === 'atk' && this.atk.armor && this.st >= this.atk.armor[0] && this.st <= this.atk.armor[1];
      let dmg = ND.scaleDmg(raw, a);
      if (armor) { const m = this.atk.armorMul ?? 0.6; dmg = Math.max(1, Math.round(dmg * m)); raw *= m; }
      // combo scaling: every further move of one combo (all hits of a multi-hit move count as one) deals ×step, ≥ ×floor
      const ck = from ? from.serial * 2 + from.id : -2;
      if (ck !== this.comboKey) { this.comboN++; this.comboKey = ck; }
      this.comboHits++;
      if (this.comboN > 1) dmg = Math.max(1, Math.round(dmg * Math.max(COMBO.floor, Math.pow(COMBO.step, this.comboN - 1))));
      this.hp = Math.max(0, this.hp - dmg); this.damageTaken += dmg;
      this.ghostT = 0.55; this.sinceHit = 0; this.jit = 0.12; this.flash = 1;
      this.posture = Math.min(99, this.posture + (a.post || 0) * 0.45);
      this.gainKi(dmg * 1.2);
      const pan = this.pan;
      // künt vuruş (bō, zincir ağırlığı, taş): kesik sesi/kan yok; gümbürtü, toz ve darbe halkası
      const blunt = !!(a.blunt || a.kind === 'whip' || (a.kind === 'blade' && from && from.ch && from.ch.blunt));
      const blade = a.kind === 'blade' && !blunt;
      if (blunt) { au.thud(0.8 + raw / 22, pan); au.tone({ freq: 150 + raw * 2, freq1: 60, dur: 0.18, gain: 0.12 + raw * 0.006, send: 0.2, pan }); fx.dust(x, y, 4 + (raw / 4 | 0), 0.7); fx.spark(x, y, Math.atan2(-0.4, kdir), 8, 0.6, '235,225,205'); }
      else if (a.kind === 'kick') { au.thud(1, pan); fx.dust(x, y, 4, 0.4); }
      else if (a.kind === 'shuriken') { au.cut(0.45, pan); }
      else au.cut(0.7 + raw / 25, pan);
      if (!blunt && (blade || a.kind === 'shuriken' || a.kind === 'arrow')) fx.blood(x, y, kdir, -0.25, (blade ? 10 : 4) + raw, 0.8 + raw / 22);
      if (blunt) { fx.flash(x, y, 0, 30 + raw * 1.6, '255,244,225'); fx.ring(x, y, '240,230,210', 30 + raw * 2.2); }
      else if (blade) {
        const ang = Math.atan2(from.j.tip.y - from.j.haF.y, from.j.tip.x - from.j.haF.x) + (a.thrust ? 0 : 0.5 * kdir);
        fx.flash(x, y, a.special ? 0 : ang, (40 + raw * 2.4) * (a.special ? 1.2 : 1));
      } else fx.flash(x, y, 0, 26, '255,240,220');
      cam.punch(2 + raw * 0.4);
      ND.game.hitstop(0.05 + raw * 0.0045);
      ND.game.onHit && ND.game.onHit(from, this, dmg);
      if (this.comboHits >= 2 && from) this.comboFx(from, a);
      if (this.hp <= 0) return this.die(from, a, x, y, kdir);
      if (armor) { this.jit = 0.18; if (this.atk.onArmor) this.atk.onArmor(this, from, x, y); return; }
      const wasAir = !this.onGround || this.y < -20; // senaryolu sıçrayışta vurulan da havada sayılır
      if (wasAir) this.jug++; // juggle: counted before the state change (launch → launch keeps it)
      if (a.launch || a.spike) {
        // launcher: high, short pop straight up (follow-ups can reach it); spike: slammed into the floor
        const pop = Math.max(0.35, 1 - COMBO.jugPop * this.jug);
        this.setState('launch', { wallBounced: false }); this.onGround = false;
        this.vy = a.spike ? 900 : COMBO.launchV * (a.lift || 1) * pop; this.vx = kdir * a.kb * 0.35;
        if (a.launch && !wasAir) fx.text(this.x, -200, (ND.TXT && ND.TXT.launch) || 'HAVAYA!', '#d9dbe6');
      } else if (a.knock || wasAir) {
        const pop = wasAir ? Math.max(0.35, 1 - COMBO.jugPop * (this.jug - 1)) : 1;
        this.setState('launch', { wallBounced: false }); this.onGround = false;
        this.vy = (a.knock ? -460 : -260) * (a.lift || 1) * pop; this.vx = kdir * a.kb * 0.75 * (a.special ? 1.6 : 1);
        if (a.knock && !a.special) fx.text(this.x, -200, 'YERE SERİLDİ', '#d9dbe6');
      } else {
        const sm = this.ch.stunMul || 1, ender = this.comboN >= 3 && !a.chain && !a.counter ? COMBO.enderStun : 1;
        this.setState('hurt', { dur: a.stun * sm * ender, hurtPose: (a.hurt && PO[a.hurt]) || (part === 'head' ? PO.hurt : PO.hurt2) });
        this.vx = kdir * a.kb * (0.4 + 0.6 * sm);
      }
    }

    // Combo counter over the fighter taking the combo ("3 VURUŞ" → "3 HIT"), and the combo's name when a named
    // string / juggle ender lands as the 3rd+ hit. Only one counter text lives at a time (the old one is retired).
    comboFx(from, a) {
      // big side-of-screen counter with the combo's name (ND.cine); the old floating text is the fallback
      if (ND.cine && ND.cine.combo(from, this, this.comboHits, this.comboHits >= 3 && from.state === 'atk' && ND.comboName ? ND.comboName(from, from.atkName) : null)) return;
      const T = fx.texts;
      if (this.comboTxt) { this.comboTxt.life = 0; this.comboTxt = null; }
      fx.text(this.x, -262, this.comboHits + ' VURUŞ', from.col.ui);
      this.comboTxt = T && T.length ? T[T.length - 1] : null;
      if (this.comboHits >= 3 && from.state === 'atk' && this.comboNamed !== this.comboKey && ND.comboName) {
        const nm = ND.comboName(from, from.atkName);
        if (nm) { this.comboNamed = this.comboKey; fx.text(this.x, -292, nm, '#ffd27a'); }
      }
    }

    blocked(a, x, y, isKick, fromX) {
      const o = this.opp, pan = o.pan;
      // Capture before recoil changes the attacker's serial/state.
      const source = { from: this, serial: this.serial, counter: !!a.counter };
      this.hitDone = true;
      o.sinceHit = 0;
      if (!isKick && o.ctrl.since('guard') <= parryWin(o)) {
        const kind = DEFL.kind(this, a, y, o); // read the attack's shape before the recoil replaces it
        // seri içindeki karşılık savuşturulursa kılıç savrulur ama savunma imkânı kalır (film gibi karşılıklı akış)
        if (((!a.knock && !a.special && !a.crush) || (a.counter && a.fin)) && this.state === 'atk') { this.setState('recoil'); this.vx = -this.dir * 200; this.posture = Math.min(90, this.posture + 12); }
        else { this.setState('stagger'); this.vx = -this.dir * 240; this.posture = Math.min(99, this.posture + (a.special ? 60 : 24)); }
        this.sinceHit = 0;
        // the defender's blade drives the attacker's away (DEFL); sparks sit where the two weapons touch
        const cp = o.parryStart(this, a, x, y, kind);
        x = cp.x; y = cp.y;
        this.lockAtk('parry');
        o.posture = Math.max(0, o.posture - 14); o.gainKi(18); o.openCounter(CWIN.parry, 'parry', source);
        const sd = o.pv.dir, sy = sd === 'down' ? 0.7 : sd === 'side' ? -0.25 : -1; // sparks fly the way the blade is sent
        fx.spark(x, y, Math.atan2(sy, -this.dir), 26, 1.3); fx.ring(x, y); fx.flash(x, y, -0.6, 70, '255,236,190');
        fx.text(o.x, -205, 'SAVUŞTURMA!', '#ffe3a1');
        au.parry(pan); cam.punch(8);
        // the cinematic (slow motion, ring on the defender, "shing", camera nudge, STRIKE! prompt) replaces part of
        // the old 0.17 s freeze: the counter window runs in game time, so the slow motion stretches it for the eye
        if (ND.cine) { ND.game.hitstop(0.1); ND.cine.onParry(o, this, x, y); } else ND.game.hitstop(0.17);
        o.parries = (o.parries || 0) + 1;
        return;
      }
      o.posture += a.post * (isKick ? 1.2 * (this.ch.kickMul || 1) : 1) * (a.special ? 1 : this.ch.dmg) * (a.crush ? 2.2 : 1) * (a.gcrush || 1) * (this.ch.post || 1) * (o.ch.guardMul || 1);
      // bloklanan kesik bazen kılıç kilidine döner (tsubazeriai)
      if (!isKick && !a.special && a.kind === 'blade' && this.state === 'atk' && this.onGround && o.onGround && o.posture < 95 && Math.abs(this.x - o.x) < 150 && Math.random() < 0.3) {
        fx.spark(x, y, -Math.PI / 2, 18, 1); au.clang(1.1, pan); this.gainKi(5); o.gainKi(5);
        ND.game.hitstop(0.08); ND.game.startLock(this, o, x, y); return;
      }
      o.gainKi(3); this.lockAtk('block');
      fx.spark(x, y, Math.atan2(-0.6, -this.dir), isKick ? 6 : 16, isKick ? 0.6 : 1);
      const rn = ND.game.rally.n;
      if (isKick) au.thud(0.8, pan); else au.clang(0.6 + a.post / 60 + rn * 0.05, pan, 1 + Math.min(rn, 8) * 0.06);
      if (rn >= 2 && !isKick) { fx.spark(x, y, -Math.PI / 2, 8 + rn * 3, 1 + rn * 0.08); fx.ring(x, y, '255,236,190', 50 + rn * 10); }
      if (!a.special) this.vx = -this.dir * 120;
      // kılıç geri seker: saldıran kısa süre toparlanır, savunan karşılık penceresi kazanır
      const midFlurry = a.hits && this.hitIdx < a.hits.length - 1;
      if (!isKick && !a.special && !midFlurry && this.state === 'atk' && a.kind === 'blade') this.setState('recoil');
      const pdir = fromX != null ? Math.sign(o.x - fromX) || this.dir : this.dir;
      o.vx = pdir * a.kb * (isKick ? 0.9 : 0.55);
      cam.punch(isKick ? 4 : 3); ND.game.hitstop(isKick ? 0.06 : 0.07);
      if (o.posture >= 100) {
        o.posture = 100; o.setState('gbreak'); o.vx = pdir * 260; o.counterUntil = 0;
        fx.text(o.x, -205, 'DENGE KIRILDI!', '#ff9b7a');
        au.clang(1.3, pan, 0.7); cam.punch(9); ND.game.hitstop(0.13);
      } else {
        o.setState('block', { dur: isKick ? 0.38 : 0.16 + a.post * 0.004 });
        if (!isKick && !midFlurry) o.openCounter(CWIN.block, 'block', source);
      }
    }

    clash(x, y) {
      const o = this.opp;
      this.hitDone = true; o.hitDone = true;
      this.gainKi(8); o.gainKi(8);
      fx.spark(x, y, -Math.PI / 2, 34, 1.4); fx.ring(x, y, '255,240,200', 110); fx.flash(x, y, -1.2, 90, '255,236,190');
      au.clang(1.6, cam.pan(x), 0.9); cam.punch(10); ND.game.hitstop(0.16);
      const sp = (f) => f.state === 'atk' && f.atk.special;
      if (this.onGround && o.onGround && !sp(this) && !sp(o) && this.state === 'atk' && o.state === 'atk' && Math.abs(this.x - o.x) < 200 && Math.random() < 0.7) {
        ND.game.startLock(this, o, x, y); return;
      }
      this.setState('clash'); o.setState('clash');
      this.vx = -this.dir * 330; o.vx = -o.dir * 330;
      fx.text(x, y - 50, 'ÇARPIŞMA!', '#ffe3a1');
    }

    die(from, a, x, y, kdir) {
      this.dead = true; this.state = 'dead'; this.st = 0; this.hidden = false;
      if (Math.abs(this.j.dir) !== 1) ND.solve(this.pose, this.x, this.y, this.dir, this.j, this.wpn); // dönüş sıkıştırmasını kaldır
      const imp = { x: kdir * ((a.kb || 200) * 0.55 + 140) * (a.special ? 1.5 : 1), y: -300 };
      this.roll = 0;
      this.rag = new ND.Ragdoll(this.j, this.vx * 0.3, this.vy * 0.3, imp);
      const j = this.j, W = this.wpn;
      // iki uçlu silah (bō) bütün olarak düşer: kabza ucundan başlayan tek çubuk
      const dual = W.dual && j.pom, lw = dual ? Object.assign({}, W, { blade: W.blade + W.handle, handle: 0 }) : W;
      this.looseSword = new ND.LooseSword(dual ? j.pom.x : j.haF.x, dual ? j.pom.y : j.haF.y, j.tip.x, j.tip.y, kdir * rand(120, 260), rand(-750, -520), rand(-420, 420), lw);
      const blunt = a.blunt || a.kind === 'whip' || (a.kind === 'blade' && from && from.ch && from.ch.blunt);
      if (blunt) { fx.dust(x, y, 14, 1.2); fx.ring(x, y, '240,230,210', 90); } else fx.blood(x, y, kdir, -0.4, 50, 1.6);
      ND.game.onKO(this, from);
    }

    updDead(dt) {
      const imp = this.rag.step(dt);
      if (imp > 8 && this.st - (this.lastThud || -1) > 0.15) {
        this.lastThud = this.st; const hp = this.rag.p.hip;
        au.thud(Math.min(1.2, imp / 20), cam.pan(hp.x)); fx.dust(hp.x, 0, 6);
        if (ND.settings.blood && Math.random() < 0.6) fx.decals.push({ x: hp.x + rand(-20, 20), y: rand(2, 16), rx: rand(14, 30), ry: rand(3, 6), a: 0.8 });
      }
      this.looseSword.step(dt);
      this.x = this.rag.p.hip.x;
    }

    // ---------------------------------------------------- İSKELET + KUMAŞ
    solve(dt) {
      const j = this.dead ? this.rag.joints() : ND.solve(this.pose, this.x, this.y, this.dir * (this.vdir ?? 1), this.j, this.wpn);
      if (!this.dead) {
        this.j = j;
        // gövde dönüşü (ters takla vb.): tüm eklemler kalçanın biraz üstünde bir eksen etrafında döner
        if (this.roll) {
          const cx = this.x, cy = this.y - 72, c = Math.cos(this.roll), s = Math.sin(this.roll);
          for (const k of RKEYS) { const p = j[k]; if (!p) continue; const dx = p.x - cx, dy = p.y - cy; p.x = cx + dx * c - dy * s; p.y = cy + dx * s + dy * c; }
          j.hang += this.roll;
        }
        // silaha özel görsel durum (zincir fiziği, yelpaze açıklığı, yay/kiriş) — specials.js: ND.wpnState
        const ws = ND.wpnState && ND.wpnState[this.wpn.type];
        if (ws) ws(this, j, dt);
        j.wSheath = this.wpn.iai ? this.sheathed() : 0;
      }
      const A = this.state === 'atk' ? this.atk : null;
      const trailOn = this.bladeActive() || (A && A.kind === 'blade' && ((this.st > A.active[0] - 0.04 && this.st < A.active[1] + 0.06) || (A.slide && this.st >= A.slide[0] && this.st <= A.slide[1]))) || (this.state === 'win' && this.st < 0.3);
      if (trailOn && !this.dead) {
        // a counter technique leaves a twice-as-long, wider streak (the ink stroke of the kaeshi-waza)
        const ctr = A && A.counter, k = ctr ? 0.12 : 0.28;
        this.trail.push([j.haF.x + (j.tip.x - j.haF.x) * k, j.haF.y + (j.tip.y - j.haF.y) * k, j.tip.x, j.tip.y]);
        if (this.trail.length > (ctr ? 16 : 8)) this.trail.shift();
      } else if (this.trail.length) this.trail.shift();
      const R = ND.LEN.headR, th = j.hang + Math.PI / 2, cs = Math.cos(th), sn = Math.sin(th);
      const wind = -this.vx * 5 - 180 + Math.sin(ND.scene.t * 1.3) * 90 + ND.scene.wind;
      let ux = j.neck.x - j.hip.x, uy = j.neck.y - j.hip.y; const ln = Math.hypot(ux, uy) || 1; ux /= ln; uy /= ln;
      const nx = j.dir * -uy, ny = j.dir * ux;
      if (this.ch.acc === 'scarf') {
        const ax = j.neck.x - nx * 6 - ux * 3, ay = j.neck.y - ny * 6 - uy * 3;
        this.tails[0].update(dt, ax, ay, wind * 1.2);
        this.tails[1].update(dt, ax, ay + 2, wind);
      } else if (this.ch.acc === 'kasa') {
        const lx = j.dir * -4, ly = 11;
        this.tails[0].update(dt, j.head.x + lx * cs - ly * sn, j.head.y + lx * sn + ly * cs, wind * 0.4);
      } else if (this.ch.acc === 'ponytail' || this.ch.acc === 'kabuto') {
        const lx = j.dir * -R * 0.62, ly = this.ch.acc === 'kabuto' ? -R * 0.4 : -R * 0.82;
        this.tails[0].update(dt, j.head.x + lx * cs - ly * sn, j.head.y + lx * sn + ly * cs, wind * 0.9);
      } else if (this.ch.acc === 'mai') {
        const lx = j.dir * -R * 0.95, ly = -R * 1.0;
        const ax = j.head.x + lx * cs - ly * sn, ay = j.head.y + lx * sn + ly * cs;
        this.tails[0].update(dt, ax, ay, wind); this.tails[1].update(dt, ax, ay + 2, wind * 0.8);
      } else if (this.ch.acc === 'monk') {
        const ln0 = Math.hypot(j.neck.x - j.hip.x, j.neck.y - j.hip.y);
        this.tails[0].update(dt, j.hip.x + ux * ln0 * 0.6 + nx * 9.5, j.hip.y + uy * ln0 * 0.6 + ny * 9.5, wind * 0.3);
      } else if (this.ch.acc === 'akane') {
        // hair gathered at the nape: tail and ribbon hang from the back of the head
        const lx = j.dir * -R * 1.05, ly = R * 0.42;
        const ax = j.head.x + lx * cs - ly * sn, ay = j.head.y + lx * sn + ly * cs;
        this.tails[0].update(dt, ax, ay, wind * 0.8); this.tails[1].update(dt, ax, ay + 1, wind * 1.1);
      } else if (this.ch.acc === 'aoi') {
        // haori: the coat's back hem splits into two wide tails that stream behind the hips
        const ax = j.hip.x + ux * 8 - nx * 17, ay = j.hip.y + uy * 8 - ny * 17;
        this.tails[0].update(dt, ax, ay, wind * 1.3 - j.dir * 760); this.tails[1].update(dt, ax + nx * 5, ay + ny * 5, wind * 1.1 - j.dir * 560);
      } else if (this.ch.acc === 'hood' || this.ch.acc === 'oni') {
        const lx = j.dir * -R * 0.9, ly = this.ch.acc === 'hood' ? -R * 0.9 : -R * 0.5;
        const ax = j.head.x + lx * cs - ly * sn, ay = j.head.y + lx * sn + ly * cs;
        this.tails[0].update(dt, ax, ay, wind); this.tails[1].update(dt, ax, ay + 3, wind * 0.8);
      } else {
        const lx = j.dir * (-R + 0.5), ly = -7;
        const axx = j.head.x + lx * cs - ly * sn, ayy = j.head.y + lx * sn + ly * cs;
        this.tails[0].update(dt, axx, ayy, wind);
        this.tails[1].update(dt, axx, ayy + 1.5, wind * 0.85);
      }
      this.sash.update(dt, j.hip.x + ux * 8 - nx * 15, j.hip.y + uy * 8 - ny * 15, wind * 0.7);
    }
    afterCombat() {
      const j = this.j;
      if (this.dead) return;
      this.prevBlade = [j.haF.x, j.haF.y, j.tip.x, j.tip.y];
      if (this.wpn.dual && j.pom) this.prevPom = [j.pom.x, j.pom.y];
    }

    // ---------------------------------------------------- ÇİZİM
    drawShadow(ctx) {
      if (this.hidden) return;
      const x = this.dead ? this.rag.p.hip.x : this.x;
      const h = this.dead ? 0 : -this.y;
      const w = 50 * Math.max(0.4, 1 - h / 400), a = 0.55 * Math.max(0.3, 1 - h / 300);
      // one gradient made once (radius 50, full strength): the size comes from the scale, the strength from
      // globalAlpha (same pixels as a new gradient with radius w and stop alphas a / 0.55a every frame)
      if (ND.gfx && ND.gfx.tier === 'low') { // Low: a plain soft-edged ellipse, no gradient
        ctx.save(); ctx.globalAlpha *= a * 0.6; ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(x, 3, w * 0.8, w * 0.13, 0, 0, 6.283); ctx.fill(); ctx.restore();
        return;
      }
      const g = SHADOW_G || (SHADOW_G = shadowGrad(ctx)), k = w / 50;
      ctx.save(); ctx.translate(x, 3); ctx.scale(k, 0.16 * k);
      ctx.globalAlpha *= a;
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 50, 0, 6.283); ctx.fill(); ctx.restore();
    }
    drawTrail(ctx) {
      const T = this.trail;
      if (T.length < 2) return;
      const sp = this.state === 'atk' && this.atk.special, ct = !sp && this.state === 'atk' && this.atk.counter;
      // counter streak takes its technique's colour (ND.cine: gold suriage, cyan harai, violet nuki, red uchiotoshi)
      const tc = (sp && this.atk.trail) || (ct && ND.cine && ND.cine.rgb(this));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 1; i < T.length; i++) {
        const a = T[i - 1], b = T[i];
        // karşılık kesiği sıcak beyaz iz bırakır (normal saldırılar soğuk mavi)
        ctx.fillStyle = tc ? `rgba(${tc},${(i / T.length) * 0.55})` : sp ? `rgba(255,190,150,${(i / T.length) * 0.5})` : ct ? `rgba(255,228,176,${(i / T.length) * 0.42})` : `rgba(200,220,255,${(i / T.length) * 0.32})`;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[2], a[3]); ctx.lineTo(b[2], b[3]); ctx.lineTo(b[0], b[1]); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    drawGhosts(ctx) {
      if (this.id === 0 && ND.specialFx && !ND.specialFx.drawHooked) ND.specialFx.render(ctx); // game.js çizmiyorsa yedek
      if (!this.ghosts.length) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const every = ND.gfx && ND.gfx.tier === 'low' ? 2 : 1; // Low: every other afterimage
      for (let gi = this.ghosts.length - 1; gi >= 0; gi -= every) {
        const g = this.ghosts[gi];
        const j = g.j, a = (g.life / g.max) * (g.c ? 0.3 : 0.22), gc = g.c || this.col.accent;
        ctx.strokeStyle = gc; ctx.globalAlpha = a;
        const seg = (p, q, w) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); };
        if (ND.ninjaPath) {
          // tek birleşik siluet: üst üste binen uzuvlar parlak düğümler oluşturmaz
          ctx.fillStyle = gc; ctx.globalAlpha = a * 1.15;
          ctx.beginPath(); ND.ninjaPath(ctx, j); ctx.fill();
          ctx.globalAlpha = a;
        } else {
          seg(j.hip, j.knB, 11); seg(j.knB, j.ftB, 8); seg(j.hip, j.knF, 12); seg(j.knF, j.ftF, 9);
          seg(j.hip, j.neck, 22); seg(j.sh, j.elF, 7); seg(j.elF, j.haF, 6); seg(j.sh, j.elB, 6); seg(j.elB, j.haB, 5);
          ctx.fillStyle = this.col.accent; ctx.beginPath(); ctx.arc(j.head.x, j.head.y, 11, 0, 6.283); ctx.fill();
        }
        if (j.tip) { ctx.strokeStyle = '#dfe8ff'; seg(j.haF, j.tip, 2.5); }
      }
      ctx.restore();
    }
    // Ropes to draw (tails + sash) with their colour and width. Made once per character / colour set (setChar), not
    // every draw; callers only read it (game.js replay recording copies the points).
    ropeList() {
      const R = this._ropes;
      if (R && this._ropesCol === this.col && this._ropesTails === this.tails && this._ropesSash === this.sash) return R;
      this._ropesCol = this.col; this._ropesTails = this.tails; this._ropesSash = this.sash;
      return (this._ropes = this.makeRopeList());
    }
    makeRopeList() {
      const c = this.col;
      if (this.ch.acc === 'scarf') return [{ rope: this.tails[0], col: c.accent, w: 6 }, { rope: this.tails[1], col: c.accentDark, w: 5 }, { rope: this.sash, col: c.accentDark, w: 4 }];
      if (this.ch.acc === 'kasa') return [{ rope: this.tails[0], col: '#6b5a3a', w: 1.4 }, { rope: this.sash, col: c.accent, w: 4 }];
      if (this.ch.acc === 'ponytail') return [{ rope: this.tails[0], col: '#0c0a0b', w: 6 }, { rope: this.sash, col: c.accent, w: 4 }];
      if (this.ch.acc === 'hood') return [{ rope: this.tails[0], col: c.clothDark, w: 7 }, { rope: this.tails[1], col: c.cloth, w: 6 }, { rope: this.sash, col: c.accent, w: 3 }];
      if (this.ch.acc === 'oni') return [{ rope: this.tails[0], col: '#1f1b1c', w: 8 }, { rope: this.tails[1], col: '#2c2729', w: 6 }, { rope: this.sash, col: c.accent, w: 4 }];
      if (this.ch.acc === 'kabuto') return [{ rope: this.tails[0], col: c.accent, w: 2.4 }, { rope: this.sash, col: c.accent, w: 4 }];
      if (this.ch.acc === 'monk') return [{ rope: this.tails[0], col: c.accentDark, w: 3 }, { rope: this.sash, col: c.accent, w: 5 }];
      if (this.ch.acc === 'mai') return [{ rope: this.tails[0], col: c.accent, w: 3.6 }, { rope: this.tails[1], col: c.accentDark, w: 3 }, { rope: this.sash, col: c.accent, w: 5.5 }];
      if (this.ch.acc === 'tsubame') return [{ rope: this.tails[0], col: c.accent, w: 4 }, { rope: this.tails[1], col: c.accent, w: 4 }, { rope: this.sash, col: c.accentDark, w: 4 }];
      if (this.ch.acc === 'tora') return [{ rope: this.tails[0], col: c.accent, w: 3.6 }, { rope: this.tails[1], col: '#1a120c', w: 3 }, { rope: this.sash, col: c.accent, w: 4 }];
      if (this.ch.acc === 'akane') return [{ rope: this.tails[0], col: '#0d0a0b', w: 7.5 }, { rope: this.tails[1], col: c.accent, w: 2.6 }, { rope: this.sash, col: c.accent, w: 4 }];
      if (this.ch.acc === 'aoi') return [{ rope: this.tails[0], col: c.haori || c.clothDark, w: 15 }, { rope: this.tails[1], col: c.cloth, w: 13 }, { rope: this.sash, col: c.accent, w: 3.5 }];
      return [{ rope: this.tails[0], col: c.accent, w: 3.4 }, { rope: this.tails[1], col: c.accentDark, w: 3 }, { rope: this.sash, col: c.accent, w: 4 }];
    }
    glint() {
      if (this.state === 'atk' && this.atk.glint) {
        const [g0, g1] = this.atk.glint;
        if (this.st > g0 && this.st < g1) return Math.sin(((this.st - g0) / (g1 - g0)) * Math.PI);
      }
      return 0;
    }
    // layer: ctx is an empty layer of its own (game.drawLit), which lets the part cache draw back to front faster
    draw(ctx, reflect, layer) {
      const j = this.dead ? this.rag.j : this.j;
      if (!j.hip || this.hidden) return;
      ctx.save();
      if (this.jit > 0) ctx.translate((Math.random() - 0.5) * 5, 0);
      const o = this._dopt;
      o.ropes = this.ropeList(); o.trail = reflect ? null : this._trailFn; o.glint = this.glint(); o.wpn = this.wpn; o.acc = this.ch.acc;
      // reflections: the flat two-tone model (skeleton.js drawLow). Low graphics: the same detailed fighter, drawn
      // from its cached part pictures (bake.js) instead of paths (select-screen previews set fullDetail: paths)
      o.lod = reflect ? 'low' : 'high';
      o.bake = !reflect && !this.fullDetail && ND.gfx ? (ND.gfx.tier === 'low' ? this.bakeCache() : null) : null; o.layer = !!layer;
      ND.drawNinja(ctx, j, this.col, o);
      ctx.restore();
      if (this.looseSword) this.looseSword.draw(ctx, this.col);
    }
    // the fighter's part picture cache (bake.js), made on first use; null without bake.js
    bakeCache() { return this._bake || (this._bake = ND.bakeCache ? ND.bakeCache() : null); }
    // Ekran uzayında kaba sınır kutusu (ışık katmanı için)
    // Returns the fighter's own reused array [x0, y0, x1, y1]: read it right away (it changes on the next call).
    bounds() {
      const j = this.dead ? this.rag.j : this.j;
      BB[0] = 1e9; BB[1] = 1e9; BB[2] = -1e9; BB[3] = -1e9;
      for (let i = 0; i < JKEYS.length; i++) bbAdd(j[JKEYS[i]]);
      for (let r = 0; r < this.tails.length; r++) { const P = this.tails[r].p; for (let i = 0; i < P.length; i++) bbAdd(P[i]); }
      { const P = this.sash.p; for (let i = 0; i < P.length; i++) bbAdd(P[i]); }
      if (this.chain && !this.dead && this.chain.init) { const C = this.chain; for (let i = 0; i < C.n; i += 3) bbXY(C.x[i], C.y[i]); BB[0] = Math.min(BB[0], C.wx); BB[2] = Math.max(BB[2], C.wx); BB[1] = Math.min(BB[1], C.wy); }
      if (this.looseSword) { bbAdd(this.looseSword.a); bbAdd(this.looseSword.b); }
      const T = this.trail;
      for (let i = 0; i < T.length; i++) bbXY(T[i][2], T[i][3]);
      const b = this._bb;
      b[0] = BB[0] - 40; b[1] = BB[1] - 40; b[2] = BB[2] + 40; b[3] = BB[3] + 40;
      return b;
    }
  }
  ND.Fighter = Fighter;
})(window.ND);
