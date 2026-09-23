// Gölge Düellosu — iskelet: pozlar, ters kinematik (IK), ninja çizimi, kumaş ipleri, ragdoll
(function (ND) {
  'use strict';
  const { clamp } = ND.M;
  const L = ND.LEN = { thigh: 46, shin: 46, torso: 56, headR: 12.5, uArm: 30, fArm: 29, blade: 96, handle: 24 };

  // ---------------------------------------------------------------- POZLAR
  // Yerel koordinatlar: x = ileri (rakibe doğru), y = aşağı, kök = ayakların ortası (zemin).
  // lean: gövde eğimi (ileri +), hd: baş eğimi, ax/ay: kılıç eli (omuza göre), sw: kılıç açısı,
  // grip: 1 → arka el kabzada; 0 → arka el gx/gy'de. f1 = ön ayak, f2 = arka ayak.
  const KEYS = ['hx', 'hy', 'lean', 'hd', 'ax', 'ay', 'sw', 'gx', 'gy', 'grip', 'f1x', 'f1y', 'f2x', 'f2y'];
  const def = { hx: 0, hy: -80, lean: 0.1, hd: 0, ax: 24, ay: 28, sw: -0.8, gx: -10, gy: 30, grip: 1, f1x: 22, f1y: 0, f2x: -26, f2y: 0 };
  const mk = (o) => Object.assign({}, def, o);
  const P = ND.POSES = {
    stance: mk({ hx: -2, hy: -80, lean: 0.16, hd: 0.05, ax: 26, ay: 28, sw: -0.78, f1x: 24, f2x: -26 }),
    guard: mk({ hx: -6, hy: -75, lean: 0.06, hd: 0.14, ax: 22, ay: 4, sw: -1.38, f1x: 20, f2x: -32 }),
    blockHit: mk({ hx: -14, hy: -72, lean: -0.04, hd: 0.1, ax: 16, ay: 6, sw: -1.5, f1x: 14, f2x: -36 }),
    s1a: mk({ hx: -6, hy: -80, lean: 0.0, hd: 0, ax: 4, ay: -32, sw: -2.3, f1x: 20, f2x: -28 }),
    s1b: mk({ hx: 14, hy: -74, lean: 0.42, hd: 0.15, ax: 40, ay: 18, sw: 0.55, f1x: 50, f2x: -22 }),
    s1c: mk({ hx: 10, hy: -74, lean: 0.36, hd: 0.15, ax: 24, ay: 40, sw: 1.25, f1x: 50, f2x: -22 }),
    s2a: mk({ hx: 8, hy: -74, lean: 0.3, hd: 0.1, ax: 16, ay: 44, sw: 2.05, f1x: 46, f2x: -24 }),
    s2b: mk({ hx: 16, hy: -80, lean: 0.16, hd: -0.05, ax: 42, ay: -12, sw: -0.85, grip: 0.6, gx: 10, gy: 20, f1x: 52, f2x: -18 }),
    s2c: mk({ hx: 14, hy: -82, lean: 0.06, hd: -0.1, ax: 22, ay: -36, sw: -1.95, grip: 0.3, gx: 0, gy: 26, f1x: 52, f2x: -18 }),
    s3a: mk({ hx: -2, hy: -78, lean: 0.04, hd: 0.05, ax: -2, ay: 32, sw: -0.06, f1x: 30, f2x: -30 }),
    s3b: mk({ hx: 32, hy: -70, lean: 0.5, hd: 0.2, ax: 56, ay: 10, sw: 0.02, f1x: 82, f2x: -18 }),
    h1a: mk({ hx: -10, hy: -83, lean: -0.14, hd: -0.12, ax: -4, ay: -45, sw: -2.6, f1x: 22, f2x: -30 }),
    h1b: mk({ hx: 28, hy: -64, lean: 0.64, hd: 0.25, ax: 44, ay: 30, sw: 0.9, f1x: 76, f2x: -20 }),
    h1c: mk({ hx: 24, hy: -62, lean: 0.6, hd: 0.25, ax: 30, ay: 46, sw: 1.5, f1x: 76, f2x: -20 }),
    k1a: mk({ hx: -8, hy: -82, lean: -0.1, hd: 0, ax: 6, ay: 34, sw: 0.9, grip: 0, gx: -16, gy: 18, f1x: 16, f1y: -54, f2x: -18 }),
    k1b: mk({ hx: -14, hy: -84, lean: -0.34, hd: 0.1, ax: -6, ay: 36, sw: 1.1, grip: 0, gx: -24, gy: 12, f1x: 84, f1y: -74, f2x: -22 }),
    t1a: mk({ hx: -6, hy: -80, lean: -0.02, hd: 0, ax: 10, ay: 40, sw: 1.0, grip: 0, gx: -24, gy: -24, f1x: 22, f2x: -28 }),
    t1b: mk({ hx: 6, hy: -78, lean: 0.32, hd: 0.1, ax: 4, ay: 42, sw: 1.15, grip: 0, gx: 54, gy: 6, f1x: 36, f2x: -26 }),
    dodgeF: mk({ hx: 10, hy: -54, lean: 0.8, hd: 0.3, ax: 6, ay: 40, sw: 1.9, grip: 0, gx: -10, gy: 30, f1x: 42, f2x: -42 }),
    dodgeB: mk({ hx: -12, hy: -70, lean: -0.08, hd: 0.08, ax: 22, ay: 20, sw: -0.45, f1x: 24, f1y: -18, f2x: -30 }),
    jump: mk({ hx: 0, hy: -82, lean: 0.1, ax: 20, ay: 24, sw: -0.9, f1x: 18, f1y: -36, f2x: -20, f2y: -24 }),
    fall: mk({ hx: 0, hy: -86, lean: 0.14, hd: 0.05, ax: 24, ay: 20, sw: -0.6, f1x: 22, f1y: -10, f2x: -16, f2y: -4 }),
    land: mk({ hx: 0, hy: -62, lean: 0.3, hd: 0.1, ax: 26, ay: 30, sw: -0.5, f1x: 26, f2x: -30 }),
    as1a: mk({ hx: 0, hy: -84, lean: -0.05, ax: 2, ay: -36, sw: -2.4, f1x: 18, f1y: -40, f2x: -18, f2y: -26 }),
    as1b: mk({ hx: 6, hy: -80, lean: 0.45, hd: 0.2, ax: 40, ay: 26, sw: 0.95, f1x: 24, f1y: -30, f2x: -14, f2y: -20 }),
    plunge: mk({ hx: 0, hy: -84, lean: 0.22, hd: 0.2, ax: 22, ay: 34, sw: 1.45, f1x: 20, f1y: -28, f2x: -16, f2y: -18 }),
    plungeLand: mk({ hx: 6, hy: -44, lean: 0.55, hd: 0.3, ax: 30, ay: 44, sw: 1.5, f1x: 36, f2x: -40 }),
    hurt: mk({ hx: -12, hy: -78, lean: -0.36, hd: -0.35, ax: 10, ay: 36, sw: 0.3, grip: 0.2, gx: -10, gy: 30, f1x: 20, f2x: -30 }),
    hurt2: mk({ hx: -6, hy: -72, lean: 0.48, hd: 0.5, ax: 10, ay: 44, sw: 1.4, grip: 0, gx: 4, gy: 36, f1x: 18, f2x: -30 }),
    stagger: mk({ hx: -14, hy: -80, lean: -0.42, hd: -0.3, ax: -18, ay: -26, sw: -2.7, grip: 0, gx: -22, gy: 8, f1x: 18, f2x: -32 }),
    gbreak: mk({ hx: -8, hy: -64, lean: 0.34, hd: 0.45, ax: 4, ay: 46, sw: 1.6, grip: 0, gx: -6, gy: 40, f1x: 24, f2x: -34 }),
    launch: mk({ hx: -10, hy: -72, lean: -0.95, hd: -0.3, ax: -10, ay: -22, sw: -2.2, grip: 0, gx: -22, gy: -8, f1x: 30, f1y: -34, f2x: 10, f2y: -22 }),
    down: mk({ hx: 0, hy: -13, lean: -1.52, hd: -0.25, ax: 12, ay: 10, sw: 0.15, grip: 0, gx: -10, gy: 10, f1x: 46, f1y: -4, f2x: 40, f2y: -2 }),
    kneel: mk({ hx: -4, hy: -48, lean: 0.32, hd: 0.1, ax: 24, ay: 30, sw: -0.5, f1x: 26, f2x: -32 }),
    victory: mk({ hx: 0, hy: -86, lean: 0.02, hd: -0.06, ax: 14, ay: 50, sw: 1.3, grip: 0, gx: -6, gy: 44, f1x: 14, f2x: -16 }),
    chiburi: mk({ hx: 2, hy: -80, lean: 0.12, hd: 0.05, ax: 44, ay: 20, sw: 0.7, grip: 0, gx: -8, gy: 40, f1x: 20, f2x: -24 }),
    iai1: mk({ hx: -8, hy: -60, lean: 0.48, hd: 0.22, ax: -8, ay: 42, sw: 2.95, f1x: 36, f2x: -42 }),
    iai2: mk({ hx: 22, hy: -60, lean: 0.55, hd: 0.2, ax: 56, ay: 4, sw: -0.22, grip: 0, gx: -30, gy: 26, f1x: 62, f2x: -54 }),
    lock: mk({ hx: 6, hy: -72, lean: 0.42, hd: 0.22, ax: 30, ay: -4, sw: -1.0, f1x: 40, f2x: -36 }),
    lockPush: mk({ hx: 14, hy: -70, lean: 0.55, hd: 0.25, ax: 36, ay: -2, sw: -0.9, f1x: 44, f2x: -40 }),
    recoil: mk({ hx: -14, hy: -78, lean: -0.12, hd: 0.05, ax: 14, ay: -8, sw: -1.75, f1x: 16, f2x: -36 }),
    wallHit: mk({ hx: -16, hy: -76, lean: -0.55, hd: -0.45, ax: -20, ay: -10, sw: -2.4, grip: 0, gx: -26, gy: 0, f1x: 26, f1y: -20, f2x: -10, f2y: -10 }),
    // --- karaktere özel ki teknikleri (specials.js)
    sp_akEnd: mk({ hx: 4, hy: -82, lean: 0.08, hd: -0.12, ax: 48, ay: 36, sw: 0.5, grip: 0, gx: -22, gy: 34, f1x: 30, f2x: -30 }),
    sp_kzA: mk({ hx: -10, hy: -70, lean: -0.06, hd: 0.12, ax: -18, ay: 26, sw: 2.75, grip: 0.6, gx: -6, gy: 28, f1x: 32, f2x: -36 }),
    sp_kzB: mk({ hx: 22, hy: -70, lean: 0.42, hd: 0.18, ax: 54, ay: -2, sw: -0.12, grip: 0, gx: -36, gy: 10, f1x: 64, f2x: -34 }),
    sp_kzC: mk({ hx: 18, hy: -74, lean: 0.3, hd: 0.05, ax: 34, ay: -34, sw: -1.25, grip: 0, gx: -34, gy: 18, f1x: 60, f2x: -34 }),
    sp_ykA: mk({ hx: -8, hy: -56, lean: 0.3, hd: 0.22, ax: -12, ay: 22, sw: 2.55, grip: 0.8, f1x: 30, f2x: -36 }),
    sp_ykB: mk({ hx: 0, hy: -84, lean: -0.12, hd: -0.18, ax: 0, ay: -48, sw: -2.25, f1x: 18, f1y: -30, f2x: -24, f2y: -18 }),
    sp_ykC: mk({ hx: 22, hy: -46, lean: 0.72, hd: 0.35, ax: 44, ay: 44, sw: 0.38, f1x: 52, f2x: -44 }),
    sp_fbA: mk({ hx: -8, hy: -62, lean: 0.38, hd: 0.2, ax: -6, ay: 36, sw: 2.45, grip: 0, gx: 18, gy: 12, f1x: 32, f2x: -36 }),
    sp_fb1: mk({ hx: 16, hy: -72, lean: 0.45, hd: 0.15, ax: 44, ay: 24, sw: 0.85, grip: 0, gx: -22, gy: 20, f1x: 50, f2x: -26 }),
    sp_fb2: mk({ hx: 18, hy: -74, lean: 0.3, hd: 0.05, ax: 42, ay: -26, sw: -1.35, grip: 0, gx: 4, gy: 30, f1x: 52, f2x: -24 }),
    sp_fb3: mk({ hx: 28, hy: -68, lean: 0.5, hd: 0.2, ax: 58, ay: 6, sw: 0.04, grip: 0, gx: -30, gy: 16, f1x: 70, f2x: -22 }),
    sp_fb4: mk({ hx: 20, hy: -62, lean: 0.5, hd: 0.25, ax: 46, ay: 46, sw: 0.25, grip: 0, gx: -26, gy: 26, f1x: 60, f2x: -34 }),
    sp_fb5: mk({ hx: 22, hy: -82, lean: 0.06, hd: -0.22, ax: 30, ay: -48, sw: -1.95, grip: 0, gx: -34, gy: 30, f1x: 52, f2x: -20 }),
    sp_hfW: mk({ hx: -4, hy: -62, lean: 0.3, hd: 0.2, ax: 8, ay: 22, sw: -2.3, grip: 0, gx: 12, gy: 14, f1x: 30, f2x: -34 }),
    sp_hfA: mk({ hx: 0, hy: -78, lean: 0.08, hd: 0, ax: 52, ay: 2, sw: 0.15, grip: 0, gx: -54, gy: 4, f1x: 16, f2x: -20, f2y: -12 }),
    sp_hfA2: mk({ hx: 0, hy: -76, lean: 0.04, hd: 0.05, ax: 50, ay: 14, sw: 0.4, grip: 0, gx: -52, gy: -8, f1x: 18, f1y: -10, f2x: -16 }),
    sp_hfEnd: mk({ hx: 12, hy: -58, lean: 0.35, hd: 0.2, ax: 50, ay: 26, sw: 0.45, grip: 0, gx: -44, gy: 22, f1x: 44, f2x: -40 }),
    sp_tzW: mk({ hx: -10, hy: -66, lean: -0.08, hd: 0.1, ax: -22, ay: 28, sw: 2.95, grip: 0.5, f1x: 34, f2x: -40 }),
    sp_tzA: mk({ hx: 6, hy: -70, lean: 0.18, hd: 0.05, ax: 50, ay: 22, sw: 0.12, grip: 0.4, gx: -10, gy: 26, f1x: 40, f2x: -40 }),
    sp_tzEnd: mk({ hx: 10, hy: -62, lean: 0.35, hd: 0.15, ax: 46, ay: 30, sw: 0.35, grip: 0.4, gx: -8, gy: 30, f1x: 46, f2x: -46 }),
    sp_onA: mk({ hx: -10, hy: -66, lean: 0.22, hd: 0.28, ax: -6, ay: 38, sw: 2.35, grip: 0, gx: 16, gy: 4, f1x: 30, f2x: -38 }),
    sp_onRush: mk({ hx: 18, hy: -64, lean: 0.82, hd: 0.05, ax: -16, ay: 34, sw: 2.7, grip: 0, gx: 6, gy: 22, f1x: 58, f2x: -40 }),
    sp_onRise1: mk({ hx: 6, hy: -54, lean: 0.5, hd: 0.2, ax: 30, ay: 48, sw: 2.5, grip: 0.7, f1x: 40, f2x: -40 }),
    sp_onRise2: mk({ hx: 10, hy: -90, lean: -0.15, hd: -0.3, ax: 22, ay: -50, sw: -1.35, grip: 0.3, gx: 0, gy: 20, f1x: 26, f2x: -28, f2y: -6 }),
    sp_kbSeal: mk({ hx: -2, hy: -80, lean: 0.04, hd: 0.12, ax: 10, ay: 12, sw: -1.52, grip: 0, gx: 12, gy: 14, f1x: 14, f2x: -18 }),
    sp_kbLow: mk({ hx: -6, hy: -50, lean: 0.52, hd: 0.3, ax: -12, ay: 38, sw: 2.8, grip: 0, gx: 22, gy: 30, f1x: 30, f2x: -40 }),
    sp_kbSlash: mk({ hx: 24, hy: -66, lean: 0.55, hd: 0.2, ax: 56, ay: 14, sw: 0.35, grip: 0, gx: -30, gy: 20, f1x: 62, f2x: -34 }),
    // Shura — Ashura Rasetsu: kükreme, kaybolma çömelişi, üç kesik (çapraz, yatay, yükselen), bitiş
    sp_shRoar: mk({ hx: -8, hy: -78, lean: -0.26, hd: -0.5, ax: -12, ay: 36, sw: 2.3, grip: 0, gx: -34, gy: -14, f1x: 36, f2x: -42 }),
    sp_shVanish: mk({ hx: -4, hy: -52, lean: 0.58, hd: 0.3, ax: -14, ay: 38, sw: 2.75, grip: 0.6, gx: 16, gy: 26, f1x: 34, f2x: -42 }),
    sp_shCutA: mk({ hx: -8, hy: -84, lean: -0.12, hd: -0.1, ax: -4, ay: -50, sw: -2.7, f1x: 30, f2x: -34 }),
    sp_shCutB: mk({ hx: 30, hy: -60, lean: 0.68, hd: 0.25, ax: 50, ay: 36, sw: 1.2, grip: 0.4, gx: -10, gy: 30, f1x: 80, f2x: -24 }),
    sp_shHorA: mk({ hx: -6, hy: -70, lean: 0.1, hd: 0.1, ax: -22, ay: 10, sw: 2.95, grip: 0.6, gx: 4, gy: 24, f1x: 30, f2x: -36 }),
    sp_shHorB: mk({ hx: 26, hy: -68, lean: 0.5, hd: 0.18, ax: 60, ay: 4, sw: 0.0, grip: 0, gx: -36, gy: 14, f1x: 72, f2x: -26 }),
    sp_shRiseA: mk({ hx: -4, hy: -54, lean: 0.45, hd: 0.25, ax: 10, ay: 46, sw: 2.6, grip: 0.7, f1x: 40, f2x: -40 }),
    sp_shRiseB: mk({ hx: 12, hy: -92, lean: -0.2, hd: -0.3, ax: 26, ay: -56, sw: -1.5, grip: 0.3, gx: 0, gy: 20, f1x: 30, f2x: -30, f2y: -6 }),
    sp_shEnd: mk({ hx: 4, hy: -80, lean: 0.1, hd: -0.1, ax: 46, ay: 34, sw: 0.9, grip: 0, gx: -20, gy: 36, f1x: 28, f2x: -34 }),

    // --- TORA (kusarigama): orak ön elde, zincir + ağırlık arka elde
    tr_stance: mk({ hx: -4, hy: -76, lean: 0.22, hd: 0.05, ax: 30, ay: 22, sw: -1.05, grip: 0, gx: -22, gy: 26, f1x: 26, f2x: -30 }),
    tr_guard: mk({ hx: -8, hy: -72, lean: 0.08, hd: 0.14, ax: 24, ay: 2, sw: -1.45, grip: 0, gx: 14, gy: 10, f1x: 20, f2x: -34 }),
    tr_w1a: mk({ hx: -8, hy: -78, lean: 0.04, hd: 0.08, ax: 18, ay: 30, sw: -0.9, grip: 0, gx: -26, gy: -36, f1x: 22, f2x: -32 }),
    tr_w1b: mk({ hx: 10, hy: -76, lean: 0.36, hd: 0.12, ax: 22, ay: 26, sw: -0.75, grip: 0, gx: 44, gy: -8, f1x: 46, f2x: -24 }),
    tr_w2a: mk({ hx: -6, hy: -74, lean: 0.02, hd: 0.1, ax: 20, ay: 24, sw: -1.0, grip: 0, gx: -36, gy: 12, f1x: 26, f2x: -34 }),
    tr_w2b: mk({ hx: 12, hy: -72, lean: 0.4, hd: 0.14, ax: 26, ay: 28, sw: -0.7, grip: 0, gx: 40, gy: 12, f1x: 48, f2x: -24 }),
    tr_s1a: mk({ hx: -6, hy: -78, lean: 0.04, hd: 0.05, ax: 8, ay: -30, sw: -2.3, grip: 0, gx: -24, gy: 24, f1x: 22, f2x: -30 }),
    tr_s1b: mk({ hx: 18, hy: -70, lean: 0.48, hd: 0.18, ax: 44, ay: 24, sw: 0.45, grip: 0, gx: -30, gy: 16, f1x: 56, f2x: -22 }),
    tr_s2a: mk({ hx: 6, hy: -72, lean: 0.3, hd: 0.1, ax: 16, ay: 40, sw: 1.9, grip: 0, gx: -26, gy: 20, f1x: 44, f2x: -26 }),
    tr_s2b: mk({ hx: 20, hy: -80, lean: 0.16, hd: -0.05, ax: 44, ay: -18, sw: -1.2, grip: 0, gx: -34, gy: 22, f1x: 54, f2x: -18 }),
    tr_hA: mk({ hx: -10, hy: -78, lean: -0.04, hd: 0.06, ax: 16, ay: 30, sw: -0.8, grip: 0, gx: -8, gy: -54, f1x: 22, f2x: -34 }),
    tr_hB: mk({ hx: 14, hy: -74, lean: 0.46, hd: 0.14, ax: 22, ay: 28, sw: -0.7, grip: 0, gx: 50, gy: -10, f1x: 52, f2x: -24 }),
    tr_hC: mk({ hx: -16, hy: -70, lean: -0.22, hd: 0.1, ax: 20, ay: 24, sw: -1.1, grip: 0, gx: -34, gy: 18, f1x: 36, f2x: -40 }),
    tr_spin: mk({ hx: 0, hy: -80, lean: 0.04, hd: 0.02, ax: 8, ay: -56, sw: -1.35, grip: 0, gx: -22, gy: 22, f1x: 28, f2x: -30 }),
    tr_spin2: mk({ hx: 2, hy: -78, lean: 0.08, hd: 0.06, ax: 12, ay: -54, sw: -1.2, grip: 0, gx: 18, gy: 20, f1x: 28, f2x: -30 }),
    tr_yank: mk({ hx: -14, hy: -72, lean: -0.2, hd: 0.1, ax: 2, ay: 28, sw: -1.5, grip: 0, gx: -30, gy: 14, f1x: 40, f2x: -40 }),
    tr_rise: mk({ hx: 16, hy: -90, lean: -0.12, hd: -0.25, ax: 30, ay: -52, sw: -1.75, grip: 0, gx: -26, gy: 20, f1x: 34, f2x: -26, f2y: -6 }),

    // --- JIN (bō): iki elle asa; ön uç (tip) ve arka uç (pom) ikisi de vurur
    jn_stance: mk({ hx: -4, hy: -82, lean: 0.1, hd: 0.04, ax: 30, ay: 30, sw: -0.32, grip: 1, f1x: 24, f2x: -28 }),
    jn_guard: mk({ hx: -8, hy: -78, lean: 0.02, hd: 0.12, ax: 24, ay: 8, sw: -1.36, grip: 1, f1x: 20, f2x: -32 }),
    jn_t1a: mk({ hx: -10, hy: -80, lean: 0.0, hd: 0.06, ax: 6, ay: 28, sw: -0.14, grip: 1, f1x: 22, f2x: -30 }),
    jn_t1b: mk({ hx: 20, hy: -74, lean: 0.4, hd: 0.1, ax: 50, ay: 16, sw: -0.08, grip: 1, f1x: 62, f2x: -24 }),
    jn_t2a: mk({ hx: 6, hy: -76, lean: 0.25, hd: 0.1, ax: 24, ay: 36, sw: 0.95, grip: 1, f1x: 44, f2x: -24 }),
    jn_t2b: mk({ hx: 18, hy: -80, lean: 0.3, hd: 0.0, ax: 34, ay: 6, sw: 2.45, grip: 1, f1x: 52, f2x: -22 }),
    jn_t3a: mk({ hx: -6, hy: -84, lean: -0.1, hd: -0.1, ax: 4, ay: -40, sw: -2.3, grip: 1, f1x: 24, f2x: -30 }),
    jn_t3b: mk({ hx: 28, hy: -64, lean: 0.58, hd: 0.25, ax: 46, ay: 26, sw: 0.5, grip: 1, f1x: 78, f2x: -20 }),
    jn_hA: mk({ hx: -10, hy: -70, lean: 0.14, hd: 0.1, ax: -6, ay: 34, sw: 2.9, grip: 1, f1x: 32, f2x: -38 }),
    jn_hB: mk({ hx: 18, hy: -54, lean: 0.55, hd: 0.2, ax: 48, ay: 46, sw: 0.2, grip: 1, f1x: 66, f2x: -44 }),
    jn_spA: mk({ hx: 0, hy: -80, lean: 0.06, hd: 0.0, ax: 14, ay: -46, sw: 0.0, grip: 0.5, gx: -6, gy: -30, f1x: 26, f2x: -28 }),
    jn_spB: mk({ hx: 4, hy: -78, lean: 0.12, hd: 0.04, ax: 18, ay: -44, sw: 3.1, grip: 0.5, gx: 0, gy: -30, f1x: 30, f2x: -28 }),
    jn_rise: mk({ hx: 14, hy: -90, lean: -0.16, hd: -0.28, ax: 34, ay: -48, sw: -1.95, grip: 1, f1x: 34, f2x: -26, f2y: -6 }),
    jn_bow: mk({ hx: 0, hy: -78, lean: 0.34, hd: 0.3, ax: 20, ay: 30, sw: -1.5, grip: 0, gx: 10, gy: 4, f1x: 16, f2x: -18 }),

    // --- MAI (tessen): iki savaş yelpazesi, dansçı duruşu
    mi_stance: mk({ hx: -2, hy: -84, lean: 0.08, hd: 0.02, ax: 30, ay: -8, sw: -1.15, grip: 0, gx: -26, gy: -26, f1x: 18, f2x: -24 }),
    mi_guard: mk({ hx: -6, hy: -78, lean: 0.04, hd: 0.12, ax: 24, ay: -8, sw: -1.3, grip: 0, gx: 18, gy: 6, f1x: 18, f2x: -30 }),
    mi_l1a: mk({ hx: -4, hy: -84, lean: 0.02, hd: 0.02, ax: 0, ay: -34, sw: -2.2, grip: 0, gx: -24, gy: 10, f1x: 20, f2x: -26 }),
    mi_l1b: mk({ hx: 14, hy: -78, lean: 0.38, hd: 0.12, ax: 44, ay: 14, sw: 0.35, grip: 0, gx: -30, gy: -18, f1x: 48, f2x: -22 }),
    mi_l2a: mk({ hx: 8, hy: -78, lean: 0.3, hd: 0.08, ax: 14, ay: 34, sw: 1.9, grip: 0, gx: -20, gy: -24, f1x: 44, f2x: -24 }),
    mi_l2b: mk({ hx: 18, hy: -82, lean: 0.12, hd: -0.05, ax: 44, ay: -18, sw: -1.0, grip: 0, gx: -28, gy: 6, f1x: 52, f2x: -18, f2y: -8 }),
    mi_l3a: mk({ hx: 0, hy: -80, lean: 0.06, hd: 0.0, ax: 50, ay: -6, sw: 0.05, grip: 0, gx: -50, gy: -6, f1x: 22, f2x: -22, f2y: -10 }),
    mi_l3b: mk({ hx: 22, hy: -70, lean: 0.45, hd: 0.16, ax: 50, ay: 16, sw: 0.3, grip: 0, gx: -40, gy: -30, f1x: 60, f2x: -24 }),
    mi_hA: mk({ hx: -10, hy: -78, lean: -0.06, hd: 0.08, ax: -14, ay: 10, sw: 2.8, grip: 0, gx: 20, gy: -20, f1x: 22, f2x: -32 }),
    mi_hB: mk({ hx: 16, hy: -76, lean: 0.4, hd: 0.12, ax: 54, ay: -10, sw: -0.2, grip: 0, gx: -34, gy: 14, f1x: 52, f2x: -24 }),
    mi_spA: mk({ hx: 0, hy: -86, lean: 0.0, hd: -0.1, ax: 12, ay: -52, sw: -1.6, grip: 0, gx: -14, gy: -50, f1x: 16, f2x: -16, f2y: -14 }),
    mi_spB: mk({ hx: 4, hy: -80, lean: 0.1, hd: 0.06, ax: 52, ay: -12, sw: -0.3, grip: 0, gx: -52, gy: -12, f1x: 26, f2x: -26 }),
    mi_spEnd: mk({ hx: 14, hy: -62, lean: 0.35, hd: 0.2, ax: 48, ay: 10, sw: 0.2, grip: 0, gx: -46, gy: -26, f1x: 46, f2x: -40 }),

    // --- TSUBAME (yumi + tantō): alçak duruş; yay ön elde, kiriş arka elde
    ts_stance: mk({ hx: -4, hy: -74, lean: 0.26, hd: 0.02, ax: 30, ay: 32, sw: -0.45, grip: 0, gx: 2, gy: 30, f1x: 24, f2x: -30 }),
    ts_guard: mk({ hx: -8, hy: -72, lean: 0.08, hd: 0.14, ax: 22, ay: 6, sw: -1.45, grip: 0, gx: 10, gy: 14, f1x: 20, f2x: -34 }),
    ts_nock: mk({ hx: -6, hy: -80, lean: -0.02, hd: 0.04, ax: 54, ay: -6, sw: -1.62, grip: 0, gx: 38, gy: -4, f1x: 26, f2x: -30 }),
    ts_aim: mk({ hx: -8, hy: -80, lean: -0.04, hd: 0.06, ax: 54, ay: -6, sw: -1.62, grip: 0, gx: -4, gy: -10, f1x: 26, f2x: -32 }),
    ts_loose: mk({ hx: -10, hy: -80, lean: -0.08, hd: 0.02, ax: 54, ay: -8, sw: -1.62, grip: 0, gx: -26, gy: -18, f1x: 26, f2x: -32 }),
    ts_tuck: mk({ hx: 0, hy: -88, lean: 0.12, hd: 0.08, ax: 50, ay: 8, sw: -1.3, grip: 0, gx: 2, gy: 0, f1x: 14, f1y: -40, f2x: -12, f2y: -32 }),
    ts_aimUp: mk({ hx: -6, hy: -82, lean: -0.2, hd: -0.3, ax: 34, ay: -44, sw: -2.45, grip: 0, gx: -6, gy: 0, f1x: 26, f2x: -30 }),
    ts_aimUpL: mk({ hx: -8, hy: -82, lean: -0.24, hd: -0.3, ax: 34, ay: -44, sw: -2.45, grip: 0, gx: -26, gy: 8, f1x: 26, f2x: -32 }),

    // ================================================================ KAESHI-WAZA (counter techniques, fighter.js / specials.js)
    // The defence motion flows straight into the cut: every counter starts from the guard/block pose, meets the
    // attacker's blade (contact key), then cuts without returning to stance. ks_ = katana family, kd_ = kodachi/tantō,
    // jc_ = bō, mc_ = tessen, kc_ = kusarigama, tc_ = twin tantō, nc_ = naginata, rx_ = attacker reactions,
    // *_zan = zanshin (settled follow-through held after a counter lands).
    // --- attacker reactions (recoil / hurt override)
    rx_high: mk({ hx: -14, hy: -80, lean: -0.3, hd: -0.3, ax: -2, ay: -50, sw: -2.2, grip: 0.4, gx: -20, gy: -10, f1x: 20, f2x: -34 }),
    rx_low: mk({ hx: -22, hy: -68, lean: 0.42, hd: 0.3, ax: 40, ay: 40, sw: 1.0, f1x: 26, f2x: -40 }),
    rx_over: mk({ hx: 2, hy: -70, lean: 0.42, hd: 0.2, ax: 50, ay: 30, sw: 0.5, grip: 0.3, gx: 10, gy: 30, f1x: 50, f2x: -42 }),
    rx_off: mk({ hx: -12, hy: -76, lean: -0.28, hd: 0.15, ax: 16, ay: 34, sw: 2.3, grip: 0, gx: -30, gy: -6, f1x: 12, f1y: -16, f2x: -30 }),
    // --- katana: suriage (omote → kesa, ura → kiriage, maki → katate-zuki)
    ks_suriA: mk({ hx: -2, hy: -85, lean: 0.08, hd: -0.1, ax: 36, ay: -36, sw: -1.2, f1x: 30, f2x: -30 }),
    ks_suriB: mk({ hx: 16, hy: -74, lean: 0.44, hd: 0.18, ax: 46, ay: 16, sw: 0.62, f1x: 58, f2x: -22 }),
    ks_suriC: mk({ hx: 12, hy: -71, lean: 0.42, hd: 0.2, ax: 22, ay: 42, sw: 1.9, f1x: 58, f2x: -24 }),
    ks_uraA: mk({ hx: -2, hy: -68, lean: 0.34, hd: 0.2, ax: 30, ay: 34, sw: 0.95, f1x: 40, f2x: -34 }),
    ks_uraB: mk({ hx: 16, hy: -80, lean: 0.3, hd: 0, ax: 50, ay: -6, sw: -0.55, f1x: 58, f2x: -24 }),
    ks_uraC: mk({ hx: 10, hy: -86, lean: 0.0, hd: -0.2, ax: 18, ay: -46, sw: -2.0, f1x: 58, f2x: -24, f2y: -4 }),
    ks_makiA: mk({ hx: 0, hy: -80, lean: 0.14, hd: 0.05, ax: 38, ay: -4, sw: -0.6, f1x: 32, f2x: -30 }),
    ks_makiB: mk({ hx: -2, hy: -84, lean: 0.06, hd: -0.05, ax: 32, ay: -34, sw: -1.05, f1x: 32, f2x: -30 }),
    ks_tsuki: mk({ hx: 34, hy: -64, lean: 0.62, hd: 0.25, ax: 60, ay: -2, sw: -0.1, grip: 0, gx: -40, gy: 14, f1x: 92, f2x: -30 }),
    // harai (beat aside → low cut), nuki (duck/spin past → cut from behind), uchiotoshi (beat down → rising thrust / men)
    ks_hBeat: mk({ hx: 2, hy: -76, lean: 0.24, hd: 0.1, ax: 38, ay: 10, sw: 0.35, f1x: 34, f2x: -30 }),
    ks_hDip: mk({ hx: 4, hy: -54, lean: 0.55, hd: 0.25, ax: -2, ay: 44, sw: 2.65, f1x: 46, f2x: -42 }),
    ks_hCut: mk({ hx: 22, hy: -46, lean: 0.62, hd: 0.25, ax: 50, ay: 56, sw: 0.18, f1x: 72, f2x: -44 }),
    ks_h2Beat: mk({ hx: 4, hy: -72, lean: 0.4, hd: 0.2, ax: 40, ay: 34, sw: 1.2, f1x: 42, f2x: -32 }),
    ks_h2Kneel: mk({ hx: 10, hy: -46, lean: 0.5, hd: 0.2, ax: 42, ay: 48, sw: 1.0, f1x: 58, f2x: -36 }),
    ks_h2Cut: mk({ hx: 20, hy: -52, lean: 0.45, hd: 0.1, ax: 56, ay: 30, sw: -0.45, f1x: 72, f2x: -40 }),
    ks_nDuck: mk({ hx: 12, hy: -50, lean: 0.85, hd: 0.35, ax: 4, ay: 36, sw: 2.95, f1x: 44, f2x: -46 }),
    ks_nPivot: mk({ hx: 2, hy: -72, lean: 0.25, hd: 0.1, ax: 10, ay: 26, sw: 0.05, f1x: 34, f2x: -34 }),
    ks_nCut: mk({ hx: 20, hy: -70, lean: 0.4, hd: 0.12, ax: 52, ay: 14, sw: 0.12, f1x: 58, f2x: -26 }),
    ks_nCutF: mk({ hx: 16, hy: -76, lean: 0.3, hd: 0.05, ax: 36, ay: -26, sw: -1.1, f1x: 58, f2x: -26 }),
    ks_n2Spin: mk({ hx: 4, hy: -76, lean: 0.3, hd: 0.2, ax: 10, ay: -20, sw: -1.9, f1x: 36, f2x: -36 }),
    ks_n2High: mk({ hx: -2, hy: -82, lean: 0.05, hd: -0.05, ax: 4, ay: -38, sw: -2.35, f1x: 26, f2x: -30 }),
    ks_n2Cut: mk({ hx: 18, hy: -68, lean: 0.5, hd: 0.2, ax: 48, ay: 18, sw: 0.75, f1x: 54, f2x: -24 }),
    ks_oRaise: mk({ hx: -6, hy: -82, lean: 0.0, hd: -0.05, ax: 10, ay: -40, sw: -2.0, f1x: 26, f2x: -30 }),
    ks_oDrop: mk({ hx: 6, hy: -62, lean: 0.55, hd: 0.3, ax: 36, ay: 30, sw: 0.88, f1x: 46, f2x: -38 }),
    ks_oThrust: mk({ hx: 30, hy: -74, lean: 0.4, hd: 0, ax: 56, ay: 0, sw: -0.18, f1x: 86, f2x: -20, f2y: -6 }),
    ks_o2Raise: mk({ hx: -4, hy: -80, lean: 0.1, hd: 0, ax: 18, ay: -34, sw: -1.7, f1x: 28, f2x: -30 }),
    ks_o2Drop: mk({ hx: 4, hy: -64, lean: 0.5, hd: 0.25, ax: 40, ay: 30, sw: 0.9, f1x: 44, f2x: -36 }),
    ks_o2Up: mk({ hx: 2, hy: -90, lean: -0.05, hd: -0.2, ax: 6, ay: -46, sw: -2.5, f1x: 30, f1y: -10, f2x: -28, f2y: -6 }),
    ks_o2Men: mk({ hx: 26, hy: -58, lean: 0.66, hd: 0.3, ax: 48, ay: 34, sw: 1.25, f1x: 78, f2x: -22 }),
    // finisher: sandan-giri — rising draw-cut, reverse kesa, leaping cleave
    ks_f1a: mk({ hx: -4, hy: -70, lean: 0.3, hd: 0.15, ax: -8, ay: 38, sw: 2.9, f1x: 34, f2x: -36 }),
    ks_f1b: mk({ hx: 20, hy: -70, lean: 0.45, hd: 0.15, ax: 56, ay: 4, sw: -0.15, grip: 0, gx: -36, gy: 14, f1x: 62, f2x: -30 }),
    ks_f2a: mk({ hx: 22, hy: -80, lean: 0.2, hd: -0.05, ax: 30, ay: -40, sw: -2.0, grip: 0.6, gx: 6, gy: 10, f1x: 64, f2x: -26 }),
    ks_f2b: mk({ hx: 34, hy: -68, lean: 0.5, hd: 0.2, ax: 50, ay: 26, sw: 0.9, f1x: 84, f2x: -18 }),
    ks_f3a: mk({ hx: 20, hy: -94, lean: 0.0, hd: -0.2, ax: 0, ay: -46, sw: -2.7, f1x: 60, f1y: -20, f2x: -14, f2y: -14 }),
    ks_f3b: mk({ hx: 30, hy: -40, lean: 0.7, hd: 0.3, ax: 46, ay: 50, sw: 1.35, f1x: 80, f2x: -30 }),
    // zanshin
    ks_zan: mk({ hx: 6, hy: -78, lean: 0.2, hd: 0.05, ax: 34, ay: 16, sw: 0.12, f1x: 46, f2x: -30 }),
    ks_zanHi: mk({ hx: 4, hy: -84, lean: 0.06, hd: -0.05, ax: 16, ay: -44, sw: -2.35, f1x: 46, f2x: -28 }),
    ks_zanTsuki: mk({ hx: 2, hy: -80, lean: 0.12, hd: 0.05, ax: 30, ay: 6, sw: -0.25, f1x: 36, f2x: -32 }),
    ks_zanLow: mk({ hx: 8, hy: -62, lean: 0.4, hd: 0.15, ax: 40, ay: 36, sw: 0.35, f1x: 56, f2x: -40 }),
    ks_chiburi: mk({ hx: 6, hy: -76, lean: 0.15, hd: 0.08, ax: 44, ay: 30, sw: 1.0, grip: 0, gx: -10, gy: 34, f1x: 40, f2x: -30 }),
    // --- kodachi / tantō: tight inside deflection, short cut or stab
    kd_in: mk({ hx: 8, hy: -76, lean: 0.3, hd: 0.1, ax: 16, ay: -10, sw: -1.7, f1x: 50, f2x: -26 }),
    kd_cut: mk({ hx: 26, hy: -72, lean: 0.5, hd: 0.2, ax: 40, ay: 20, sw: 0.7, f1x: 70, f2x: -20 }),
    kd_fol: mk({ hx: 22, hy: -72, lean: 0.45, hd: 0.2, ax: 24, ay: 40, sw: 1.8, f1x: 70, f2x: -22 }),
    kd_in2: mk({ hx: 8, hy: -74, lean: 0.3, hd: 0.1, ax: 20, ay: -16, sw: -2.1, f1x: 48, f2x: -26 }),
    kd_stab: mk({ hx: 30, hy: -72, lean: 0.52, hd: 0.2, ax: 56, ay: 6, sw: 0.05, grip: 0, gx: -30, gy: 10, f1x: 80, f2x: -20 }),
    // --- bō (both ends strike: sw beyond ±π turns the rear end forward)
    jc_defl: mk({ hx: -2, hy: -82, lean: 0.1, hd: 0, ax: 34, ay: -10, sw: -3.94, grip: 1, f1x: 28, f2x: -30 }),
    jc_tip: mk({ hx: 22, hy: -72, lean: 0.45, hd: 0.2, ax: 46, ay: 14, sw: 0.55, grip: 1, f1x: 56, f2x: -24 }),
    jc_tipF: mk({ hx: 20, hy: -70, lean: 0.45, hd: 0.2, ax: 36, ay: 30, sw: 1.3, grip: 1, f1x: 56, f2x: -24 }),
    jc_low: mk({ hx: 0, hy: -72, lean: 0.3, hd: 0.15, ax: 36, ay: 24, sw: 1.0, grip: 1, f1x: 40, f2x: -32 }),
    jc_smash: mk({ hx: 20, hy: -70, lean: 0.45, hd: 0.2, ax: 48, ay: 10, sw: 3.64, grip: 1, f1x: 60, f2x: -24 }),
    jc_smashF: mk({ hx: 18, hy: -68, lean: 0.45, hd: 0.2, ax: 34, ay: 20, sw: 4.1, grip: 1, f1x: 60, f2x: -24 }),
    jc_hBeat: mk({ hx: 2, hy: -76, lean: 0.25, hd: 0.1, ax: 36, ay: 12, sw: 0.4, grip: 1, f1x: 36, f2x: -30 }),
    jc_hSweep: mk({ hx: 16, hy: -50, lean: 0.55, hd: 0.25, ax: 40, ay: 44, sw: 3.35, grip: 1, f1x: 64, f2x: -44 }),
    jc_nDuck: mk({ hx: 12, hy: -52, lean: 0.85, hd: 0.35, ax: 10, ay: 20, sw: -1.9, grip: 1, f1x: 44, f2x: -46 }),
    jc_nCh: mk({ hx: -6, hy: -76, lean: 0.05, hd: 0.05, ax: 6, ay: 26, sw: -0.1, grip: 1, f1x: 26, f2x: -30 }),
    jc_nThr: mk({ hx: 26, hy: -72, lean: 0.45, hd: 0.15, ax: 56, ay: 8, sw: -0.05, grip: 1, f1x: 74, f2x: -22 }),
    jc_oRaise: mk({ hx: -4, hy: -82, lean: 0.02, hd: -0.05, ax: 20, ay: -34, sw: -1.9, grip: 1, f1x: 26, f2x: -30 }),
    jc_oDrop: mk({ hx: 6, hy: -62, lean: 0.5, hd: 0.3, ax: 38, ay: 30, sw: 0.9, grip: 1, f1x: 46, f2x: -38 }),
    jc_oThr: mk({ hx: 30, hy: -74, lean: 0.35, hd: -0.1, ax: 54, ay: -2, sw: -0.15, grip: 1, f1x: 84, f2x: -20, f2y: -6 }),
    jc_f1a: mk({ hx: -4, hy: -68, lean: 0.2, hd: 0.1, ax: 6, ay: 32, sw: -0.35, grip: 1, f1x: 34, f2x: -36 }),
    jc_f1b: mk({ hx: 30, hy: -70, lean: 0.48, hd: 0.15, ax: 58, ay: 4, sw: -0.1, grip: 1, f1x: 80, f2x: -20 }),
    jc_f2: mk({ hx: 24, hy: -78, lean: 0.2, hd: -0.1, ax: 38, ay: -12, sw: -3.9, grip: 1, f1x: 70, f2x: -26 }),
    jc_f3a: mk({ hx: 18, hy: -92, lean: 0.0, hd: -0.2, ax: 10, ay: -46, sw: -2.4, grip: 1, f1x: 60, f1y: -18, f2x: -16, f2y: -12 }),
    jc_f3b: mk({ hx: 36, hy: -46, lean: 0.68, hd: 0.3, ax: 48, ay: 44, sw: 1.15, grip: 1, f1x: 86, f2x: -28 }),
    jc_zan: mk({ hx: 2, hy: -80, lean: 0.14, hd: 0.05, ax: 36, ay: 4, sw: -0.12, grip: 1, f1x: 38, f2x: -32 }),
    jc_zanP: mk({ hx: 4, hy: -78, lean: 0.16, hd: 0.05, ax: 30, ay: 8, sw: -3.44, grip: 1, f1x: 38, f2x: -32 }),
    jc_zanLow: mk({ hx: 6, hy: -62, lean: 0.4, hd: 0.15, ax: 36, ay: 30, sw: -2.9, grip: 1, f1x: 52, f2x: -40 }),
    jc_hMid: mk({ hx: 6, hy: -62, lean: 0.45, hd: 0.2, ax: 30, ay: 20, sw: 1.9, grip: 1, f1x: 50, f2x: -40 }),
    // --- tessen (front fan: ax/ay/sw; second fan in the back hand: gx/gy)
    mc_rDefl: mk({ hx: -4, hy: -84, lean: 0.06, hd: -0.05, ax: -4, ay: 14, sw: 2.7, grip: 0, gx: 34, gy: -30, f1x: 26, f2x: -28 }),
    mc_rCut: mk({ hx: 18, hy: -76, lean: 0.42, hd: 0.15, ax: 50, ay: 8, sw: 0.55, grip: 0, gx: 6, gy: -24, f1x: 56, f2x: -22 }),
    mc_rFol: mk({ hx: 14, hy: -76, lean: 0.35, hd: 0.12, ax: 34, ay: 30, sw: 1.4, grip: 0, gx: -6, gy: -20, f1x: 56, f2x: -22 }),
    mc_r2Defl: mk({ hx: 0, hy: -76, lean: 0.25, hd: 0.1, ax: 38, ay: 20, sw: 0.3, grip: 0, gx: -30, gy: -20, f1x: 36, f2x: -30 }),
    mc_r2Up: mk({ hx: 4, hy: -84, lean: 0.05, hd: -0.05, ax: 12, ay: -44, sw: -2.3, grip: 0, gx: -28, gy: 10, f1x: 40, f2x: -28 }),
    mc_r2Str: mk({ hx: 22, hy: -72, lean: 0.5, hd: 0.2, ax: 48, ay: 20, sw: 0.9, grip: 0, gx: -34, gy: -30, f1x: 58, f2x: -22 }),
    mc_hSpin: mk({ hx: 4, hy: -54, lean: 0.4, hd: 0.2, ax: 10, ay: 30, sw: 2.6, grip: 0, gx: -20, gy: -30, f1x: 44, f2x: -40 }),
    mc_hCut: mk({ hx: 20, hy: -46, lean: 0.6, hd: 0.25, ax: 50, ay: 54, sw: 0.2, grip: 0, gx: -40, gy: -30, f1x: 70, f2x: -44 }),
    mc_nSpin: mk({ hx: 4, hy: -80, lean: 0.2, hd: 0.1, ax: 30, ay: -30, sw: -1.2, grip: 0, gx: -30, gy: -30, f1x: 30, f2x: -32, f2y: -10 }),
    mc_nCh: mk({ hx: 0, hy: -78, lean: 0.1, hd: 0.05, ax: -6, ay: 10, sw: 2.6, grip: 0, gx: 20, gy: -10, f1x: 30, f2x: -30 }),
    mc_nCut: mk({ hx: 20, hy: -76, lean: 0.42, hd: 0.15, ax: 54, ay: 4, sw: 0.2, grip: 0, gx: -20, gy: -26, f1x: 56, f2x: -22 }),
    mc_oUp: mk({ hx: -4, hy: -84, lean: 0.02, hd: -0.05, ax: 10, ay: -40, sw: -2.2, grip: 0, gx: 14, gy: -40, f1x: 28, f2x: -30 }),
    mc_oDown: mk({ hx: 6, hy: -64, lean: 0.5, hd: 0.25, ax: 40, ay: 30, sw: 0.9, grip: 0, gx: 34, gy: 26, f1x: 46, f2x: -36 }),
    mc_oRise: mk({ hx: 32, hy: -80, lean: 0.45, hd: -0.05, ax: 54, ay: 2, sw: -0.1, grip: 0, gx: -30, gy: 0, f1x: 78, f2x: -20, f2y: -8 }),
    mc_f1a: mk({ hx: -2, hy: -80, lean: 0.1, hd: 0.05, ax: -8, ay: 6, sw: 2.8, grip: 0, gx: 20, gy: -30, f1x: 30, f2x: -28 }),
    mc_f1b: mk({ hx: 20, hy: -78, lean: 0.4, hd: 0.12, ax: 52, ay: 0, sw: 0.1, grip: 0, gx: -30, gy: -20, f1x: 60, f2x: -24 }),
    mc_f2: mk({ hx: 26, hy: -74, lean: 0.45, hd: 0.15, ax: 50, ay: 16, sw: 0.6, grip: 0, gx: -30, gy: -34, f1x: 66, f2x: -22 }),
    mc_f3a: mk({ hx: 22, hy: -92, lean: 0.0, hd: -0.2, ax: 10, ay: -46, sw: -2.2, grip: 0, gx: -10, gy: -44, f1x: 58, f1y: -16, f2x: -14, f2y: -12 }),
    mc_f3b: mk({ hx: 36, hy: -52, lean: 0.65, hd: 0.3, ax: 50, ay: 40, sw: 1.1, grip: 0, gx: 40, gy: 36, f1x: 84, f2x: -26 }),
    mc_zan: mk({ hx: 0, hy: -84, lean: 0.08, hd: 0, ax: 34, ay: -16, sw: -0.9, grip: 0, gx: -30, gy: -30, f1x: 24, f2x: -26, f2y: -8 }),
    // --- kusarigama (sickle in front, chain weight in the back hand)
    kc_throw: mk({ hx: -2, hy: -80, lean: 0.15, hd: 0.05, ax: 16, ay: 20, sw: -1.3, grip: 0, gx: 40, gy: -20, f1x: 30, f2x: -30 }),
    kc_yank: mk({ hx: -12, hy: -74, lean: -0.15, hd: 0.1, ax: 20, ay: 6, sw: -1.9, grip: 0, gx: -30, gy: 14, f1x: 40, f2x: -38 }),
    kc_cut: mk({ hx: 18, hy: -70, lean: 0.5, hd: 0.2, ax: 46, ay: 22, sw: 0.6, grip: 0, gx: -24, gy: 20, f1x: 58, f2x: -22 }),
    kc_fol: mk({ hx: 12, hy: -70, lean: 0.4, hd: 0.2, ax: 24, ay: 40, sw: 1.6, grip: 0, gx: -24, gy: 22, f1x: 56, f2x: -24 }),
    kc_hook: mk({ hx: -2, hy: -82, lean: 0.1, hd: 0, ax: 36, ay: -30, sw: -1.0, grip: 0, gx: -24, gy: 24, f1x: 30, f2x: -30 }),
    kc_pull: mk({ hx: -8, hy: -72, lean: 0.05, hd: 0.1, ax: 36, ay: 22, sw: 0.6, grip: 0, gx: -20, gy: 24, f1x: 34, f2x: -34 }),
    kc_rise: mk({ hx: 22, hy: -78, lean: 0.4, hd: -0.1, ax: 56, ay: 4, sw: -0.4, grip: 0, gx: -30, gy: 16, f1x: 54, f2x: -24 }),
    kc_hThrow: mk({ hx: 0, hy: -64, lean: 0.4, hd: 0.2, ax: 10, ay: 30, sw: -0.9, grip: 0, gx: 44, gy: 30, f1x: 44, f2x: -36 }),
    kc_hPull: mk({ hx: -10, hy: -60, lean: 0.1, hd: 0.15, ax: 30, ay: 30, sw: -0.2, grip: 0, gx: -34, gy: 30, f1x: 50, f2x: -40 }),
    kc_hCut: mk({ hx: 20, hy: -46, lean: 0.6, hd: 0.25, ax: 50, ay: 50, sw: 0.5, grip: 0, gx: -36, gy: 20, f1x: 72, f2x: -44 }),
    kc_nDuck: mk({ hx: 12, hy: -52, lean: 0.85, hd: 0.35, ax: 16, ay: 30, sw: 2.4, grip: 0, gx: 20, gy: -40, f1x: 44, f2x: -46 }),
    kc_nCh: mk({ hx: 0, hy: -76, lean: 0.1, hd: 0.05, ax: 10, ay: -30, sw: -2.2, grip: 0, gx: -20, gy: -30, f1x: 30, f2x: -30 }),
    kc_nCut: mk({ hx: 20, hy: -70, lean: 0.5, hd: 0.2, ax: 46, ay: 24, sw: 0.8, grip: 0, gx: -26, gy: 16, f1x: 56, f2x: -22 }),
    kc_oSw: mk({ hx: -6, hy: -80, lean: 0.05, hd: 0, ax: 20, ay: 10, sw: -1.5, grip: 0, gx: 10, gy: -50, f1x: 28, f2x: -30 }),
    kc_oDown: mk({ hx: 4, hy: -66, lean: 0.4, hd: 0.2, ax: 30, ay: 24, sw: 0.6, grip: 0, gx: 44, gy: 30, f1x: 44, f2x: -34 }),
    kc_oRise: mk({ hx: 32, hy: -80, lean: 0.45, hd: -0.05, ax: 54, ay: 4, sw: -0.1, grip: 0, gx: -30, gy: 16, f1x: 76, f2x: -20, f2y: -6 }),
    kc_f1a: mk({ hx: -2, hy: -76, lean: 0.15, hd: 0.05, ax: 6, ay: 20, sw: 2.4, grip: 0, gx: 40, gy: -10, f1x: 30, f2x: -30 }),
    kc_f1b: mk({ hx: 20, hy: -74, lean: 0.45, hd: 0.15, ax: 52, ay: 6, sw: 0.2, grip: 0, gx: -20, gy: 20, f1x: 60, f2x: -26 }),
    kc_f2: mk({ hx: 26, hy: -84, lean: 0.15, hd: -0.1, ax: 44, ay: -34, sw: -1.3, grip: 0, gx: -30, gy: 20, f1x: 66, f2x: -24 }),
    kc_f3a: mk({ hx: 20, hy: -92, lean: 0.0, hd: -0.2, ax: 6, ay: -46, sw: -2.2, grip: 0, gx: -24, gy: -30, f1x: 58, f1y: -16, f2x: -14, f2y: -12 }),
    kc_f3b: mk({ hx: 36, hy: -50, lean: 0.66, hd: 0.3, ax: 50, ay: 40, sw: 1.0, grip: 0, gx: -30, gy: 24, f1x: 84, f2x: -26 }),
    kc_zan: mk({ hx: 0, hy: -78, lean: 0.18, hd: 0.05, ax: 34, ay: 6, sw: -0.9, grip: 0, gx: -20, gy: 20, f1x: 32, f2x: -30 }),
    // --- twin tantō (front: normal grip; back hand: reverse-grip blade along the forearm)
    tc_catch: mk({ hx: -4, hy: -80, lean: 0.12, hd: 0, ax: -4, ay: 30, sw: 0.0, grip: 0, gx: 30, gy: -30, f1x: 28, f2x: -30 }),
    tc_stab: mk({ hx: 28, hy: -70, lean: 0.5, hd: 0.2, ax: 58, ay: 6, sw: 0.05, grip: 0, gx: 16, gy: -26, f1x: 80, f2x: -22 }),
    tc_fol: mk({ hx: 20, hy: -72, lean: 0.42, hd: 0.15, ax: 44, ay: 12, sw: 0.2, grip: 0, gx: 10, gy: -20, f1x: 76, f2x: -22 }),
    tc_up: mk({ hx: -2, hy: -84, lean: 0.06, hd: -0.05, ax: 32, ay: -38, sw: -1.3, grip: 0, gx: -10, gy: 10, f1x: 28, f2x: -30 }),
    tc_down: mk({ hx: 26, hy: -66, lean: 0.6, hd: 0.3, ax: 50, ay: 30, sw: 1.2, grip: 0, gx: 20, gy: -10, f1x: 74, f2x: -24 }),
    tc_hSpin: mk({ hx: 4, hy: -50, lean: 0.5, hd: 0.2, ax: 8, ay: 36, sw: 2.6, grip: 0, gx: 20, gy: 20, f1x: 46, f2x: -40 }),
    tc_hCut: mk({ hx: 22, hy: -44, lean: 0.62, hd: 0.25, ax: 50, ay: 56, sw: 0.25, grip: 0, gx: -30, gy: 30, f1x: 72, f2x: -44 }),
    tc_tuck: mk({ hx: 4, hy: -60, lean: 0.9, hd: 0.4, ax: 12, ay: 30, sw: 1.5, grip: 0, gx: 10, gy: 30, f1x: 24, f1y: -8, f2x: -18, f2y: -6 }),
    tc_nStab: mk({ hx: 24, hy: -72, lean: 0.45, hd: 0.15, ax: 56, ay: 4, sw: 0.05, grip: 0, gx: 20, gy: -20, f1x: 60, f2x: -24 }),
    tc_oX: mk({ hx: 6, hy: -62, lean: 0.55, hd: 0.3, ax: 36, ay: 36, sw: 1.1, grip: 0, gx: 34, gy: 34, f1x: 46, f2x: -38 }),
    tc_oRise: mk({ hx: 32, hy: -84, lean: 0.45, hd: -0.1, ax: 54, ay: 2, sw: -0.1, grip: 0, gx: 40, gy: -20, f1x: 76, f2x: -18, f2y: -8 }),
    tc_f1: mk({ hx: 28, hy: -70, lean: 0.5, hd: 0.2, ax: 48, ay: 18, sw: 0.7, grip: 0, gx: -10, gy: 20, f1x: 74, f2x: -24 }),
    tc_f2: mk({ hx: 30, hy: -76, lean: 0.35, hd: 0.05, ax: 52, ay: -6, sw: -0.5, grip: 0, gx: 30, gy: 20, f1x: 78, f2x: -22 }),
    tc_f3a: mk({ hx: 22, hy: -60, lean: 0.55, hd: 0.3, ax: 20, ay: 40, sw: 1.9, grip: 0, gx: 30, gy: 36, f1x: 64, f2x: -32 }),
    tc_f3b: mk({ hx: 34, hy: -84, lean: 0.25, hd: -0.15, ax: 52, ay: -24, sw: -0.7, grip: 0, gx: 44, gy: -36, f1x: 84, f1y: -10, f2x: -12, f2y: -8 }),
    tc_zan: mk({ hx: 0, hy: -66, lean: 0.3, hd: 0.1, ax: 30, ay: 14, sw: -0.5, grip: 0, gx: 26, gy: 4, f1x: 34, f2x: -36 }),
    // --- naginata (block with the shaft, cut with the blade end)
    nc_shaft: mk({ hx: -4, hy: -82, lean: 0.06, hd: 0, ax: 34, ay: -24, sw: -1.95, f1x: 28, f2x: -30 }),
    nc_sweep: mk({ hx: 22, hy: -68, lean: 0.5, hd: 0.2, ax: 46, ay: 24, sw: 0.7, f1x: 62, f2x: -24 }),
    nc_fol: mk({ hx: 18, hy: -66, lean: 0.45, hd: 0.2, ax: 30, ay: 40, sw: 1.8, f1x: 62, f2x: -26 }),
    nc_butt: mk({ hx: 0, hy: -76, lean: 0.2, hd: 0.1, ax: 30, ay: 6, sw: 2.4, f1x: 32, f2x: -32 }),
    nc_rise: mk({ hx: 22, hy: -80, lean: 0.3, hd: -0.05, ax: 48, ay: -20, sw: -0.7, f1x: 62, f2x: -24 }),
    nc_rFol: mk({ hx: 16, hy: -84, lean: 0.1, hd: -0.1, ax: 32, ay: -40, sw: -1.6, f1x: 62, f2x: -24 }),
    nc_hBeat: mk({ hx: 0, hy: -76, lean: 0.2, hd: 0.1, ax: 36, ay: 6, sw: -0.7, f1x: 34, f2x: -30 }),
    nc_hCh: mk({ hx: -4, hy: -58, lean: 0.4, hd: 0.2, ax: 6, ay: 36, sw: 2.7, f1x: 44, f2x: -44 }),
    nc_hCut: mk({ hx: 18, hy: -54, lean: 0.5, hd: 0.2, ax: 46, ay: 44, sw: 0.28, f1x: 68, f2x: -44 }),
    nc_nSpin: mk({ hx: 10, hy: -60, lean: 0.6, hd: 0.3, ax: 14, ay: 20, sw: -1.6, f1x: 44, f2x: -44 }),
    nc_nCh: mk({ hx: -4, hy: -76, lean: 0.1, hd: 0.05, ax: 4, ay: 30, sw: 2.8, f1x: 28, f2x: -32 }),
    nc_nCut: mk({ hx: 22, hy: -68, lean: 0.5, hd: 0.2, ax: 48, ay: 20, sw: 0.35, f1x: 58, f2x: -24 }),
    nc_oUp: mk({ hx: -4, hy: -84, lean: 0.02, hd: -0.05, ax: 16, ay: -40, sw: -2.2, f1x: 26, f2x: -30 }),
    nc_oDown: mk({ hx: 8, hy: -60, lean: 0.55, hd: 0.3, ax: 40, ay: 30, sw: 0.55, f1x: 46, f2x: -38 }),
    nc_oRise: mk({ hx: 24, hy: -82, lean: 0.2, hd: -0.1, ax: 48, ay: -8, sw: -0.45, f1x: 78, f2x: -20, f2y: -6 }),
    nc_f1a: mk({ hx: -4, hy: -60, lean: 0.4, hd: 0.2, ax: 4, ay: 36, sw: 2.9, f1x: 46, f2x: -44 }),
    nc_f1b: mk({ hx: 20, hy: -54, lean: 0.5, hd: 0.2, ax: 48, ay: 44, sw: 0.25, f1x: 68, f2x: -44 }),
    nc_f2: mk({ hx: 26, hy: -84, lean: 0.15, hd: -0.1, ax: 46, ay: -34, sw: -1.2, f1x: 70, f2x: -24 }),
    nc_f3a: mk({ hx: 22, hy: -92, lean: 0.0, hd: -0.2, ax: 6, ay: -46, sw: -2.6, f1x: 60, f1y: -16, f2x: -14, f2y: -12 }),
    nc_f3b: mk({ hx: 36, hy: -48, lean: 0.68, hd: 0.3, ax: 48, ay: 42, sw: 0.95, f1x: 86, f2x: -28 }),
    nc_zan: mk({ hx: 0, hy: -76, lean: 0.14, hd: 0.05, ax: 30, ay: 18, sw: 0.2, f1x: 36, f2x: -34 }),

    // --- AKANE (iaijutsu): katana in the scabbard at the hip between strikes (sw ≈ π - 0.3 = along the saya),
    // right hand on the hilt, left hand holding the scabbard mouth; every normal is a draw-cut (nukitsuke)
    ak_stance: mk({ hx: -4, hy: -70, lean: 0.3, hd: -0.12, ax: 3, ay: 44, sw: 2.84, grip: 0, gx: -2, gy: 46, f1x: 30, f2x: -36 }),
    ak_guard: mk({ hx: -6, hy: -72, lean: 0.12, hd: 0.12, ax: 22, ay: 6, sw: -1.3, grip: 1, f1x: 22, f2x: -32 }),
    ak_l1b: mk({ hx: 16, hy: -70, lean: 0.34, hd: 0.05, ax: 50, ay: 14, sw: 0.02, grip: 0, gx: -12, gy: 42, f1x: 58, f2x: -30 }),
    ak_l1c: mk({ hx: 14, hy: -72, lean: 0.26, hd: 0.05, ax: 40, ay: -6, sw: -0.7, grip: 0, gx: -14, gy: 40, f1x: 58, f2x: -30 }),
    ak_l2a: mk({ hx: 10, hy: -76, lean: 0.1, hd: -0.05, ax: 10, ay: -36, sw: -2.3, grip: 1, f1x: 50, f2x: -26 }),
    ak_l2b: mk({ hx: 18, hy: -70, lean: 0.44, hd: 0.18, ax: 40, ay: 22, sw: 0.75, grip: 1, f1x: 56, f2x: -24 }),
    ak_l3a: mk({ hx: 8, hy: -66, lean: 0.4, hd: 0.1, ax: -4, ay: 40, sw: 2.5, grip: 0, gx: -10, gy: 40, f1x: 50, f2x: -28 }),
    ak_l3b: mk({ hx: 30, hy: -68, lean: 0.46, hd: 0.12, ax: 56, ay: 0, sw: -0.25, grip: 0, gx: -30, gy: 30, f1x: 80, f2x: -24 }),
    ak_hA: mk({ hx: -8, hy: -58, lean: 0.42, hd: -0.2, ax: 0, ay: 42, sw: 2.9, grip: 0, gx: -4, gy: 44, f1x: 36, f2x: -42 }),
    ak_hB: mk({ hx: 30, hy: -64, lean: 0.5, hd: 0.1, ax: 58, ay: 6, sw: 0.08, grip: 0, gx: -34, gy: 30, f1x: 84, f2x: -40 }),
    ak_hC: mk({ hx: 28, hy: -66, lean: 0.4, hd: 0.05, ax: 40, ay: -20, sw: -1.0, grip: 0, gx: -34, gy: 32, f1x: 84, f2x: -40 }),
    ak_upB: mk({ hx: 12, hy: -90, lean: -0.1, hd: -0.25, ax: 30, ay: -50, sw: -1.55, grip: 0, gx: -24, gy: 30, f1x: 40, f2x: -24, f2y: -4 }),
    ak_tsuka: mk({ hx: 14, hy: -72, lean: 0.38, hd: 0.05, ax: 22, ay: 26, sw: 2.7, grip: 0, gx: 6, gy: 34, f1x: 52, f2x: -28 }),
    ak_catch: mk({ hx: -10, hy: -60, lean: 0.38, hd: -0.02, ax: 2, ay: 44, sw: 2.92, grip: 0, gx: -4, gy: 45, f1x: 34, f2x: -46 }),
    ak_s1a: mk({ hx: 20, hy: -72, lean: 0.3, hd: 0, ax: 44, ay: -24, sw: -1.2, grip: 1, f1x: 60, f2x: -24 }),
    ak_s1b: mk({ hx: 26, hy: -66, lean: 0.5, hd: 0.2, ax: 44, ay: 30, sw: 1.1, grip: 1, f1x: 66, f2x: -24 }),

    // --- AOI (kaze-ryū): one-handed tachi fencer, side-on, point toward the opponent, off hand behind the back
    ao_stance: mk({ hx: -6, hy: -84, lean: 0.04, hd: 0.04, ax: 40, ay: 16, sw: -0.22, grip: 0, gx: -18, gy: 40, f1x: 30, f2x: -24 }),
    ao_guard: mk({ hx: -8, hy: -80, lean: 0.02, hd: 0.12, ax: 28, ay: -4, sw: -1.35, grip: 0, gx: -18, gy: 40, f1x: 24, f2x: -30 }),
    ao_l1a: mk({ hx: -8, hy: -82, lean: 0.0, hd: 0.04, ax: 18, ay: 18, sw: -0.12, grip: 0, gx: -20, gy: 36, f1x: 28, f2x: -26 }),
    ao_l1b: mk({ hx: 18, hy: -74, lean: 0.32, hd: 0.1, ax: 58, ay: 2, sw: -0.06, grip: 0, gx: -34, gy: 18, f1x: 66, f2x: -24 }),
    ao_l2a: mk({ hx: 6, hy: -78, lean: 0.18, hd: 0.06, ax: 40, ay: 30, sw: 1.0, grip: 0, gx: -24, gy: 30, f1x: 50, f2x: -26 }),
    ao_l2b: mk({ hx: 12, hy: -84, lean: 0.04, hd: -0.1, ax: 40, ay: -34, sw: -1.4, grip: 0, gx: -28, gy: 24, f1x: 52, f2x: -24 }),
    ao_l3a: mk({ hx: -14, hy: -76, lean: -0.06, hd: 0.06, ax: 4, ay: 14, sw: -0.08, grip: 0, gx: -20, gy: 30, f1x: 22, f2x: -34 }),
    ao_l3b: mk({ hx: 34, hy: -60, lean: 0.5, hd: 0.18, ax: 58, ay: 4, sw: 0.0, grip: 0, gx: -40, gy: 10, f1x: 92, f2x: -30 }),
    ao_hA: mk({ hx: -6, hy: -78, lean: -0.04, hd: 0.06, ax: -18, ay: 14, sw: 2.9, grip: 0, gx: 14, gy: 24, f1x: 30, f2x: -32 }),
    ao_hB: mk({ hx: 22, hy: -72, lean: 0.36, hd: 0.1, ax: 56, ay: 8, sw: 0.12, grip: 0, gx: -36, gy: 20, f1x: 66, f2x: -30 }),
    ao_upA: mk({ hx: 0, hy: -64, lean: 0.4, hd: 0.2, ax: 22, ay: 44, sw: 2.2, grip: 0, gx: -22, gy: 30, f1x: 40, f2x: -38 }),
    ao_upB: mk({ hx: 10, hy: -92, lean: -0.14, hd: -0.3, ax: 22, ay: -54, sw: -1.7, grip: 0, gx: -26, gy: 22, f1x: 30, f2x: -26, f2y: -8 }),
    ao_bhA: mk({ hx: -22, hy: -70, lean: 0.2, hd: 0.06, ax: 16, ay: 22, sw: -0.02, grip: 0, gx: -22, gy: 30, f1x: 16, f2x: -44 }),
    ao_blA: mk({ hx: -18, hy: -82, lean: -0.08, hd: 0.04, ax: 24, ay: -30, sw: -2.2, grip: 0, gx: -18, gy: 36, f1x: 18, f2x: -36 }),
    ao_blB: mk({ hx: -4, hy: -76, lean: 0.22, hd: 0.12, ax: 52, ay: 20, sw: 0.5, grip: 0, gx: -26, gy: 30, f1x: 36, f2x: -40 }),

    // --- REN (brawler): sword resting on the shoulder in one hand, the other fist forward; elbows, knees, shoulder, head
    rn_stance: mk({ hx: -2, hy: -74, lean: 0.24, hd: 0.14, ax: 4, ay: -6, sw: -2.45, grip: 0, gx: 28, gy: 2, f1x: 30, f2x: -32 }),
    rn_guard: mk({ hx: -6, hy: -74, lean: 0.08, hd: 0.18, ax: 22, ay: 2, sw: -1.4, grip: 0, gx: 18, gy: 12, f1x: 22, f2x: -32 }),
    rn_l1a: mk({ hx: -4, hy: -76, lean: 0.1, hd: 0.1, ax: -2, ay: -20, sw: -2.6, grip: 0, gx: 24, gy: 10, f1x: 28, f2x: -32 }),
    rn_l1b: mk({ hx: 18, hy: -70, lean: 0.46, hd: 0.2, ax: 44, ay: 24, sw: 0.9, grip: 0, gx: -14, gy: 20, f1x: 58, f2x: -24 }),
    rn_elbA: mk({ hx: 4, hy: -74, lean: 0.3, hd: 0.12, ax: 6, ay: -10, sw: -2.6, grip: 0, gx: 20, gy: 14, f1x: 40, f2x: -28 }),
    rn_elbB: mk({ hx: 22, hy: -70, lean: 0.5, hd: 0.2, ax: 10, ay: -6, sw: -2.8, grip: 0, gx: -10, gy: 24, f1x: 62, f2x: -24 }),
    rn_kneeA: mk({ hx: 4, hy: -84, lean: 0.1, hd: 0.1, ax: 4, ay: -8, sw: -2.4, grip: 0, gx: 20, gy: 16, f1x: 18, f1y: -30, f2x: -22 }),
    rn_kneeB: mk({ hx: 20, hy: -96, lean: -0.1, hd: 0, ax: 2, ay: -4, sw: -2.5, grip: 0, gx: -6, gy: 18, f1x: 34, f1y: -60, f2x: -10, f2y: -10 }),
    rn_hA: mk({ hx: -8, hy: -84, lean: -0.16, hd: -0.14, ax: -6, ay: -46, sw: -2.7, grip: 1, f1x: 24, f2x: -30 }),
    rn_hB: mk({ hx: 30, hy: -58, lean: 0.7, hd: 0.3, ax: 46, ay: 36, sw: 1.2, grip: 1, f1x: 80, f2x: -22 }),
    rn_sh: mk({ hx: 18, hy: -68, lean: 0.62, hd: 0.2, ax: -8, ay: 10, sw: -2.8, grip: 0, gx: -12, gy: 24, f1x: 50, f2x: -34 }),
    rn_headA: mk({ hx: -8, hy: -80, lean: -0.2, hd: -0.3, ax: 2, ay: -8, sw: -2.4, grip: 0, gx: 24, gy: 6, f1x: 26, f2x: -32 }),
    rn_headB: mk({ hx: 12, hy: -76, lean: 0.5, hd: 0.4, ax: 4, ay: -4, sw: -2.5, grip: 0, gx: 20, gy: 16, f1x: 44, f2x: -26 }),
    rn_upA: mk({ hx: -2, hy: -58, lean: 0.45, hd: 0.2, ax: 10, ay: 44, sw: 2.4, grip: 1, f1x: 36, f2x: -40 }),
    rn_upB: mk({ hx: 12, hy: -92, lean: -0.2, hd: -0.3, ax: 24, ay: -52, sw: -1.6, grip: 1, f1x: 32, f2x: -26, f2y: -6 }),
    rn_axeA: mk({ hx: -8, hy: -86, lean: -0.3, hd: 0, ax: 0, ay: -8, sw: -2.4, grip: 0, gx: 20, gy: 10, f1x: 40, f1y: -120, f2x: -22 }),
    rn_axeB: mk({ hx: 16, hy: -72, lean: 0.3, hd: 0.2, ax: 4, ay: -6, sw: -2.5, grip: 0, gx: 14, gy: 20, f1x: 76, f1y: -20, f2x: -28 }),

    // --- KAGE (gyaku-te): ninjatō in a reverse grip, blade along the forearm; low crouch, free hand forward
    kg_stance: mk({ hx: -6, hy: -66, lean: 0.34, hd: 0.02, ax: 24, ay: 26, sw: -2.7, grip: 0, gx: 30, gy: 4, f1x: 32, f2x: -36 }),
    kg_guard: mk({ hx: -8, hy: -70, lean: 0.16, hd: 0.1, ax: 22, ay: 4, sw: -1.75, grip: 0, gx: 18, gy: 14, f1x: 24, f2x: -34 }),
    kg_l1a: mk({ hx: -4, hy: -68, lean: 0.22, hd: 0.05, ax: 6, ay: -6, sw: -2.2, grip: 0, gx: 26, gy: 18, f1x: 30, f2x: -34 }),
    kg_l1b: mk({ hx: 16, hy: -64, lean: 0.46, hd: 0.12, ax: 48, ay: 20, sw: 0.9, grip: 0, gx: -12, gy: 26, f1x: 58, f2x: -30 }),
    kg_l2a: mk({ hx: 4, hy: -66, lean: 0.3, hd: 0.06, ax: 10, ay: 30, sw: 2.4, grip: 0, gx: 24, gy: 6, f1x: 40, f2x: -30 }),
    kg_l2b: mk({ hx: 18, hy: -70, lean: 0.36, hd: 0.05, ax: 52, ay: -4, sw: -0.3, grip: 0, gx: -24, gy: 20, f1x: 60, f2x: -28 }),
    kg_l3a: mk({ hx: 0, hy: -52, lean: 0.6, hd: 0.3, ax: 10, ay: 36, sw: -2.8, grip: 0, gx: 20, gy: 30, f1x: 36, f2x: -40 }),
    kg_l3b: mk({ hx: 22, hy: -74, lean: 0.3, hd: 0.05, ax: 50, ay: -10, sw: -0.4, grip: 0, gx: -20, gy: 24, f1x: 62, f2x: -26 }),
    kg_hA: mk({ hx: 0, hy: -90, lean: 0.1, hd: -0.1, ax: 10, ay: -44, sw: -1.9, grip: 0, gx: 20, gy: 10, f1x: 20, f1y: -30, f2x: -20, f2y: -20 }),
    kg_hB: mk({ hx: 24, hy: -56, lean: 0.6, hd: 0.3, ax: 40, ay: 40, sw: 1.3, grip: 0, gx: -10, gy: 36, f1x: 60, f2x: -34 }),
    kg_fA: mk({ hx: -2, hy: -72, lean: 0.1, hd: 0, ax: 6, ay: -30, sw: -2.0, grip: 0, gx: 26, gy: 10, f1x: 30, f2x: -32 }),
    kg_upA: mk({ hx: -2, hy: -56, lean: 0.5, hd: 0.2, ax: 20, ay: 40, sw: -2.9, grip: 0, gx: 24, gy: 20, f1x: 36, f2x: -40 }),
    kg_upB: mk({ hx: 14, hy: -94, lean: -0.1, hd: -0.25, ax: 30, ay: -50, sw: -0.9, grip: 0, gx: -20, gy: 20, f1x: 30, f2x: -26, f2y: -8 }),
    kg_smA: mk({ hx: -4, hy: -70, lean: 0.3, hd: 0.1, ax: 10, ay: 20, sw: -2.6, grip: 0, gx: 40, gy: 40, f1x: 30, f2x: -34 }),
  };

  ND.pose = {
    KEYS,
    copy(src, dst = {}) { for (const k of KEYS) dst[k] = src[k]; return dst; },
    lerp(a, b, t, out = {}) { for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t; return out; },
    approach(cur, target, rate, dt) { const t = 1 - Math.exp(-rate * dt); for (const k of KEYS) cur[k] += (target[k] - cur[k]) * t; return cur; },
    // Anahtar kare dizisi: [[zaman, poz, yumuşatma], ...]
    seq(keys, t, out) {
      if (t <= keys[0][0]) return this.copy(keys[0][1], out);
      for (let i = 1; i < keys.length; i++) {
        if (t <= keys[i][0]) {
          const a = keys[i - 1], b = keys[i];
          const u = (t - a[0]) / Math.max(1e-4, b[0] - a[0]);
          return this.lerp(a[1], b[1], (b[2] || ND.M.ease.inOutSine)(u), out);
        }
      }
      return this.copy(keys[keys.length - 1][1], out);
    },
  };

  // ---------------------------------------------------------------- IK
  // İki kemikli çözüm; iki olası dirsek/diz noktasından "score" fonksiyonuna göre en uygununu seçer.
  function ik(ax, ay, bx, by, l1, l2, score) {
    let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
    const max = l1 + l2 - 0.01;
    if (d > max) { bx = ax + (dx / d) * max; by = ay + (dy / d) * max; dx = bx - ax; dy = by - ay; d = max; }
    d = Math.max(d, 1e-3);
    const base = Math.atan2(dy, dx);
    const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const e1x = ax + Math.cos(base + A) * l1, e1y = ay + Math.sin(base + A) * l1;
    const e2x = ax + Math.cos(base - A) * l1, e2y = ay + Math.sin(base - A) * l1;
    const pick = score(e1x, e1y) >= score(e2x, e2y);
    return { mx: pick ? e1x : e2x, my: pick ? e1y : e2y, ex: bx, ey: by };
  }
  const elbowScore = (x, y) => y + 0.3 * x;
  const kneeScore = (x, y) => x - 0.5 * y;

  // Pozdan dünya uzayı eklem noktaları
  ND.solve = function (p, rx, ry, dir, j = {}, wpn = L) {
    const hip = [p.hx, p.hy];
    const ux = Math.sin(p.lean), uy = -Math.cos(p.lean);
    const neck = [hip[0] + ux * L.torso, hip[1] + uy * L.torso];
    const sh = [hip[0] + ux * L.torso * 0.86, hip[1] + uy * L.torso * 0.86];
    const ha = p.lean + p.hd;
    const head = [neck[0] + Math.sin(ha) * 15, neck[1] - Math.cos(ha) * 15];
    // kılıç eli
    const hf = [sh[0] + p.ax, sh[1] + p.ay];
    const armF = ik(sh[0], sh[1], hf[0], hf[1], L.uArm, L.fArm, elbowScore);
    const cs = Math.cos(p.sw), sn = Math.sin(p.sw);
    const hand = [armF.ex, armF.ey];
    const tip = [hand[0] + cs * wpn.blade, hand[1] + sn * wpn.blade];
    const pom = [hand[0] - cs * wpn.handle, hand[1] - sn * wpn.handle];
    // arka el
    const gg = wpn.handle * 0.55;
    const gripX = hand[0] - cs * gg, gripY = hand[1] - sn * gg;
    const g = wpn.twin ? 0 : clamp(p.grip, 0, 1);
    const shB = [sh[0] - 3, sh[1] + 1];
    const hbx = gripX * g + (sh[0] + p.gx) * (1 - g), hby = gripY * g + (sh[1] + p.gy) * (1 - g);
    const armB = ik(shB[0], shB[1], hbx, hby, L.uArm, L.fArm, elbowScore);
    // bacaklar
    const legF = ik(hip[0], hip[1], p.f1x, p.f1y, L.thigh, L.shin, kneeScore);
    const legB = ik(hip[0] - 2, hip[1], p.f2x, p.f2y, L.thigh, L.shin, kneeScore);

    const W = (pt, key) => { const o = j[key] || (j[key] = { x: 0, y: 0 }); o.x = rx + pt[0] * dir; o.y = ry + pt[1]; };
    W(hip, 'hip'); W(neck, 'neck'); W(sh, 'sh'); W(head, 'head');
    W([armF.mx, armF.my], 'elF'); W(hand, 'haF'); W(tip, 'tip'); W(pom, 'pom');
    W([armB.mx, armB.my], 'elB'); W([armB.ex, armB.ey], 'haB');
    W([legF.mx, legF.my], 'knF'); W([legF.ex, legF.ey], 'ftF');
    W([legB.mx, legB.my], 'knB'); W([legB.ex, legB.ey], 'ftB');
    j.dir = dir; j.hasSword = true;
    j.hang = Math.atan2(j.head.y - j.neck.y, j.head.x - j.neck.x);
    return j;
  };

  // Vuruş alanları: [ax, ay, bx, by, yarıçap, bölge]
  ND.hurtboxes = function (j) {
    return [
      [j.head.x, j.head.y, j.head.x, j.head.y, 14, 'head'],
      [j.hip.x, j.hip.y, j.neck.x, j.neck.y, 17, 'body'],
      [j.hip.x, j.hip.y, j.knF.x, j.knF.y, 10, 'leg'], [j.knF.x, j.knF.y, j.ftF.x, j.ftF.y, 8, 'leg'],
      [j.hip.x, j.hip.y, j.knB.x, j.knB.y, 10, 'leg'], [j.knB.x, j.knB.y, j.ftB.x, j.ftB.y, 8, 'leg'],
      [j.sh.x, j.sh.y, j.elF.x, j.elF.y, 7, 'arm'], [j.elF.x, j.elF.y, j.haF.x, j.haF.y, 6, 'arm'],
    ];
  };

  // ---------------------------------------------------------------- KUMAŞ İPİ (verlet)
  const RB = [];
  class Rope {
    constructor(n, seg) { this.n = n; this.seg = seg; this.p = []; this.init = false; }
    reset(x, y) { this.p = []; for (let i = 0; i < this.n; i++) this.p.push({ x, y: y + i * this.seg, px: x, py: y + i * this.seg }); this.init = true; }
    update(dt, ax, ay, wind) {
      if (!this.init) this.reset(ax, ay);
      const p = this.p, d2 = dt * dt;
      p[0].x = ax; p[0].y = ay; p[0].px = ax; p[0].py = ay;
      for (let i = 1; i < p.length; i++) {
        const q = p[i], vx = (q.x - q.px) * 0.97, vy = (q.y - q.py) * 0.97;
        q.px = q.x; q.py = q.y;
        q.x += vx + wind * d2 * (0.6 + 0.4 * Math.sin(ND.scene.t * 5 + i));
        q.y += vy + 900 * d2 + Math.sin(ND.scene.t * 7 + i * 1.3) * 18 * d2;
        if (q.y > -1) q.y = -1;
      }
      for (let k = 0; k < 4; k++) {
        for (let i = 1; i < p.length; i++) {
          const a = p[i - 1], b = p[i];
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-3, diff = (d - this.seg) / d;
          if (i === 1) { b.x -= dx * diff; b.y -= dy * diff; }
          else { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5; }
        }
      }
    }
    // İncelen kumaş şeridi: segment başına çizgi yerine tek dolgu (daha hızlı ve pürüzsüz);
    // hi verilirse ortasından ince bir parlaklık çizgisi geçer.
    draw(ctx, color, w0, hi) {
      const p = this.p, n = p.length;
      if (n < 2) return;
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = p[i > 0 ? i - 1 : 0], b = p[i < n - 1 ? i + 1 : n - 1];
        let tx = b.x - a.x, ty = b.y - a.y; const d = Math.hypot(tx, ty) || 1; tx /= d; ty /= d;
        const w = (w0 * (1 - Math.max(0, i - 1) / n) + 0.8) * 0.5;
        const x = p[i].x - ty * w, y = p[i].y + tx * w;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        RB[i * 2] = p[i].x + ty * w; RB[i * 2 + 1] = p[i].y - tx * w;
      }
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(RB[i * 2], RB[i * 2 + 1]);
      ctx.closePath(); ctx.fill();
      if (hi) {
        ctx.strokeStyle = hi; ctx.lineWidth = Math.max(0.6, w0 * 0.22); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y);
        for (let i = 1; i < n - 1; i++) ctx.lineTo(p[i].x, p[i].y);
        ctx.stroke();
      }
    }
  }
  ND.Rope = Rope;

  // ---------------------------------------------------------------- ZİNCİR (kusarigama; sabit düğüm sayısı, tahsis yok)
  // Düğüm 0 orağın kabza ucuna (pom) bağlı. Boştayken düğüm HN arka elde tutulur, geri kalanı ağırlıkla sarkar
  // (ya da ağırlık elin çevresinde döndürülür). Saldırıda son düğüm (ağırlık) hedef yola sürülür; aradaki halkalar
  // yerçekimiyle sarkan verlet zinciri. Halka boyu mesafeye göre değişir: zincir uzar/kısalır (çözülüp toplanır).
  const CH_N = 12, CH_HN = 7;
  class Chain {
    constructor() {
      this.n = CH_N; this.x = new Float32Array(CH_N); this.y = new Float32Array(CH_N);
      this.px = new Float32Array(CH_N); this.py = new Float32Array(CH_N);
      this.tx = new Float32Array(6); this.ty = new Float32Array(6); this.ti = 0; // ağırlık izi (halka tampon)
      this.init = false; this.wpx = 0; this.wpy = 0; this.spd = 0;
    }
    reset(x, y) {
      for (let i = 0; i < CH_N; i++) { this.x[i] = this.px[i] = x; this.y[i] = this.py[i] = y + i * 4; }
      for (let i = 0; i < 6; i++) { this.tx[i] = x; this.ty[i] = y; }
      this.init = true; this.wpx = x; this.wpy = y + 44;
    }
    get wx() { return this.x[CH_N - 1]; }
    get wy() { return this.y[CH_N - 1]; }
    // ax/ay: kabza ucu; hx/hy: arka el; drive: ağırlık hedefi sürülüyor mu; tx/ty: hedef; tw: boşta döndürme açısı (NaN = sarkıt)
    update(dt, ax, ay, hx, hy, drive, tx, ty, tw) {
      if (!this.init) this.reset(ax, ay);
      const X = this.x, Y = this.y, PX = this.px, PY = this.py, L = CH_N - 1, d2 = dt * dt;
      this.wpx = X[L]; this.wpy = Y[L];
      // ağırlık: sürülürken hedefe hızla yaklaşır (ışınlanmaz); döndürmede elin çevresinde daire çizer
      let pinW = false;
      if (drive) {
        const k = 1 - Math.exp(-42 * dt);
        X[L] += (tx - X[L]) * k; Y[L] += (ty - Y[L]) * k; PX[L] = X[L]; PY[L] = Y[L]; pinW = true;
      } else if (tw === tw) {
        const cx = hx + Math.cos(tw) * 20, cy = hy + Math.sin(tw) * 20, k = 1 - Math.exp(-30 * dt);
        X[L] += (cx - X[L]) * k; Y[L] += (cy - Y[L]) * k; PX[L] = X[L]; PY[L] = Y[L]; pinW = true;
      }
      for (let i = 1; i < CH_N; i++) {
        if (i === L && pinW) continue;
        if (!drive && i === CH_HN) continue;
        const vx = (X[i] - PX[i]) * 0.96, vy = (Y[i] - PY[i]) * 0.96;
        PX[i] = X[i]; PY[i] = Y[i]; X[i] += vx; Y[i] += vy + 1400 * d2;
        if (Y[i] > -2) Y[i] = -2;
      }
      X[0] = ax; Y[0] = ay; PX[0] = ax; PY[0] = ay;
      let segA, segB;
      if (drive) {
        segA = segB = Math.max(3, Math.hypot(X[L] - ax, Y[L] - ay) * 1.04 / L);
      } else {
        X[CH_HN] = hx; Y[CH_HN] = hy; PX[CH_HN] = hx; PY[CH_HN] = hy;
        segA = Math.max(3.2, Math.hypot(hx - ax, hy - ay) * 1.12 / CH_HN); segB = pinW ? 5.2 : 6;
      }
      for (let it = 0; it < 4; it++) {
        for (let i = 1; i < CH_N; i++) {
          const a = i - 1, b = i, seg = !drive && i > CH_HN ? segB : segA;
          const dx = X[b] - X[a], dy = Y[b] - Y[a], d = Math.hypot(dx, dy) || 1e-3, df = (d - seg) / d;
          const pa = a === 0 || (!drive && a === CH_HN), pb = (b === L && pinW) || (!drive && b === CH_HN);
          const fa = pa ? 0 : pb ? 1 : 0.5, fb = pb ? 0 : pa ? 1 : 0.5;
          X[a] += dx * df * fa; Y[a] += dy * df * fa; X[b] -= dx * df * fb; Y[b] -= dy * df * fb;
        }
      }
      this.spd = Math.hypot(X[L] - this.wpx, Y[L] - this.wpy) / Math.max(1e-4, dt);
      this.ti = (this.ti + 1) % 6; this.tx[this.ti] = X[L]; this.ty[this.ti] = Y[L];
    }
    draw(ctx, col, lod) {
      const X = this.x, Y = this.y, n = this.n || CH_N, L = n - 1;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (lod === 'low') {
        ctx.strokeStyle = '#3a3e48'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(X[0], Y[0]); for (let i = 1; i < n; i++) ctx.lineTo(X[i], Y[i]); ctx.stroke();
        ctx.fillStyle = '#2a2d34'; ctx.beginPath(); ctx.arc(X[L], Y[L], 4, 0, TAU); ctx.fill();
        return;
      }
      // hızlı savrulurken ağırlığın ardında soluk iz
      if (this.spd > 900 && this.tx) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(200,210,235,.16)'; ctx.lineWidth = 7;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) { const i = (this.ti + 1 + k) % 6; if (k) ctx.lineTo(this.tx[i], this.ty[i]); else ctx.moveTo(this.tx[i], this.ty[i]); }
        ctx.stroke(); ctx.restore();
      }
      ctx.beginPath(); ctx.moveTo(X[0], Y[0]); for (let i = 1; i < n; i++) ctx.lineTo(X[i], Y[i]);
      ctx.strokeStyle = '#101116'; ctx.lineWidth = 3.8; ctx.stroke();
      ctx.strokeStyle = '#7b8292'; ctx.lineWidth = 2.1; ctx.setLineDash(DASH); ctx.stroke();
      ctx.strokeStyle = 'rgba(225,232,245,.55)'; ctx.lineWidth = 0.8; ctx.lineDashOffset = 1.6; ctx.stroke();
      ctx.setLineDash(NODASH); ctx.lineDashOffset = 0;
      // ağırlık (fundo): son halkaya hizalı dökme demir
      const dx = X[L] - X[L - 1], dy = Y[L] - Y[L - 1], a = Math.atan2(dy, dx);
      ctx.fillStyle = '#23252c'; ctx.strokeStyle = '#08090b'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(X[L] + Math.cos(a) * 2, Y[L] + Math.sin(a) * 2, 6.4, 4.4, a, 0, TAU); ctx.stroke(); ctx.fill();
      ctx.fillStyle = col ? col : '#8a6a3a';
      ctx.beginPath(); ctx.ellipse(X[L] - Math.cos(a) * 2.6, Y[L] - Math.sin(a) * 2.6, 1.6, 4, a, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(220,228,240,.55)';
      ctx.beginPath(); ctx.arc(X[L] + LT.x * 2 + Math.cos(a) * 2, Y[L] + LT.y * 2 + Math.sin(a) * 2, 1.4, 0, TAU); ctx.fill();
    }
  }
  const DASH = [2.6, 1.9], NODASH = [];
  ND.Chain = Chain;

  // ---------------------------------------------------------------- ÇİZİM
  const TAU = Math.PI * 2, HP = Math.PI / 2;
  // Anahtar ışık: ışığa doğru dünya birim vektörü (sahnenin key.from tarafı + yukarıdan)
  const LT = { x: 0.55, y: -0.835 };
  function updLight() {
    const th = ND.scene && ND.scene.theme, k = th && th.key;
    LT.x = k && k.from < 0 ? -0.55 : 0.55;
  }

  // Palet türevleri: palet nesnesi başına bir kez hesaplanıp önbelleğe alınır
  const PAL = new WeakMap();
  function rgbOf(h, fb) {
    if (typeof h === 'string') {
      if (h[0] === '#') {
        let s = h.slice(1); if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
        const n = parseInt(s.slice(0, 6), 16); if (!isNaN(n)) return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      }
      const m = h.match(/rgba?\(([^)]+)\)/);
      if (m) { const v = m[1].split(',').map(Number); return [v[0] | 0, v[1] | 0, v[2] | 0]; }
    }
    return fb || [30, 28, 32];
  }
  function mixC(a, b, f, al) {
    const r = Math.round(a[0] + (b[0] - a[0]) * f), g = Math.round(a[1] + (b[1] - a[1]) * f), bb = Math.round(a[2] + (b[2] - a[2]) * f);
    return al === undefined ? `rgb(${r},${g},${bb})` : `rgba(${r},${g},${bb},${al})`;
  }
  function pal(c) {
    let d = PAL.get(c); if (d) return d;
    const K = [0, 0, 0], W = [255, 255, 255];
    const hi = rgbOf(c.clothHi), dk = rgbOf(c.clothDark), wr = rgbOf(c.wrap), wd = rgbOf(c.wrapDark), ac = rgbOf(c.accent);
    const sk = rgbOf(c.skin, [200, 156, 129]), ar = rgbOf(c.armor || '#2a2622'), mk = rgbOf(c.mask || '#b3261e');
    d = {
      line: mixC(dk, K, 0.6),
      hiA: mixC(hi, W, 0.12, 0.5), hiW: mixC(wr, W, 0.16, 0.45), hiB: mixC(hi, W, 0.05, 0.22),
      glove: c.glove || mixC(dk, K, 0.3), gloveHi: c.glove ? mixC(rgbOf(c.glove), W, 0.2) : mixC(hi, W, 0.1), tabi: c.tabi || mixC(dk, K, 0.15), sole: mixC(wd, W, 0.08),
      inner: mixC(dk, K, 0.5), collar: mixC(hi, W, 0.2),
      accHi: mixC(ac, W, 0.45), accSh: mixC(ac, K, 0.5),
      skinSh: mixC(sk, [50, 20, 16], 0.5), skinHi: mixC(sk, [255, 236, 220], 0.35), skinMd: mixC(sk, [70, 34, 26], 0.2),
      mask: mixC(mk, mk, 0), maskSh: mixC(mk, K, 0.55), maskHi: mixC(mk, W, 0.5), maskMid: mixC(mk, K, 0.28),
      armor: mixC(ar, ar, 0), armorHi: mixC(ar, W, 0.3), armorLt: mixC(ar, W, 0.1), armorDk: mixC(ar, K, 0.45),
    };
    PAL.set(c, d); return d;
  }

  // Sivrilen kapsül: tek kapalı kontur, hep aynı yönde (birleşik dolgu/konturda delik oluşmaz)
  function capPath(ctx, ax, ay, bx, by, r0, r1) {
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
    if (d <= Math.abs(r0 - r1) + 1e-3) {
      const big = r0 >= r1, x = big ? ax : bx, y = big ? ay : by, r = big ? r0 : r1;
      ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); return;
    }
    const th = Math.atan2(dy, dx), ph = Math.asin((r0 - r1) / d), s = th + HP - ph;
    ctx.moveTo(ax + Math.cos(s) * r0, ay + Math.sin(s) * r0);
    ctx.arc(ax, ay, r0, s, th + 3 * HP + ph);
    ctx.arc(bx, by, r1, th - HP + ph, s);
    ctx.closePath();
  }
  // Yumuşak kapalı eğri: kontrol noktaları arası orta noktalardan quadratic; yön hep pozitif
  const BUF = [];
  function blob(ctx, P, n) {
    let ar = 0;
    for (let i = 0, k = n - 1; i < n; k = i++) ar += P[k * 2] * P[i * 2 + 1] - P[i * 2] * P[k * 2 + 1];
    const f = ar >= 0;
    const ix = (m) => (f ? m : n - 1 - m) * 2;
    let a = ix(n - 1), b = ix(0);
    ctx.moveTo((P[a] + P[b]) * 0.5, (P[a + 1] + P[b + 1]) * 0.5);
    for (let m = 0; m < n; m++) {
      a = ix(m); b = ix((m + 1) % n);
      ctx.quadraticCurveTo(P[a], P[a + 1], (P[a] + P[b]) * 0.5, (P[a + 1] + P[b + 1]) * 0.5);
    }
    ctx.closePath();
  }
  function line(ctx, ax, ay, bx, by) { ctx.moveTo(ax, ay); ctx.lineTo(bx, by); }

  // Kapsül gölgelendirme: gölge tarafında koyu çekirdek bant, ışık tarafında parlak bant ve ince kenar ışığı
  function shade(ctx, ax, ay, bx, by, r0, r1, hiCol, rimCol, shA) {
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1e-3;
    let nx = -dy / d, ny = dx / d, k = nx * LT.x + ny * LT.y;
    if (k < 0) { nx = -nx; ny = -ny; k = -k; }
    const rm = r0 < r1 ? r0 : r1;
    if (shA !== 0) {
      ctx.strokeStyle = shA || 'rgba(0,0,0,.3)'; ctx.lineWidth = rm * 0.95;
      ctx.beginPath(); line(ctx, ax - nx * r0 * 0.5, ay - ny * r0 * 0.5, bx - nx * r1 * 0.5, by - ny * r1 * 0.5); ctx.stroke();
    }
    if (hiCol) {
      ctx.strokeStyle = hiCol; ctx.lineWidth = rm * 0.48;
      ctx.beginPath(); line(ctx, ax + nx * r0 * 0.4, ay + ny * r0 * 0.4, bx + nx * r1 * 0.4, by + ny * r1 * 0.4); ctx.stroke();
    }
    if (rimCol) {
      ctx.strokeStyle = rimCol; ctx.lineWidth = 0.6 + k * 1.0;
      ctx.beginPath(); line(ctx, ax + nx * (r0 - 0.7), ay + ny * (r0 - 0.7), bx + nx * (r1 - 0.7), by + ny * (r1 - 0.7)); ctx.stroke();
    }
  }

  // Gövde yerel çerçevesi: u = kalçadan boyuna, n = ileri (dir ile ölçekli; kesirli dir'de gövde daralır)
  const TF = { hx: 0, hy: 0, ux: 0, uy: -1, nx: 1, ny: 0, ln: 56 };
  function torsoFrame(j) {
    let ux = j.neck.x - j.hip.x, uy = j.neck.y - j.hip.y; const ln = Math.hypot(ux, uy) || 1; ux /= ln; uy /= ln;
    TF.hx = j.hip.x; TF.hy = j.hip.y; TF.ux = ux; TF.uy = uy; TF.nx = j.dir * -uy; TF.ny = j.dir * ux; TF.ln = ln;
  }
  const PX = (u, n) => TF.hx + TF.ux * u + TF.nx * n, PY = (u, n) => TF.hy + TF.uy * u + TF.ny * n;
  // Atletik gövde profili (u oranı × boy, n): karın, göğüs, köprücük, ense, kürek, bel çukuru, kalça
  const TORSO = [-0.14, 13, 0.25, 15.5, 0.62, 18.5, 0.92, 14, 1.06, 6, 1.08, -4, 0.95, -12.5, 0.7, -17.2, 0.42, -15, 0.14, -17.5, -0.14, -15, -0.24, 0];
  function torsoPath(ctx) {
    const ln = TF.ln;
    for (let i = 0; i < 12; i++) { BUF[i * 2] = PX(TORSO[i * 2] * ln, TORSO[i * 2 + 1]); BUF[i * 2 + 1] = PY(TORSO[i * 2] * ln, TORSO[i * 2 + 1]); }
    blob(ctx, BUF, 12);
  }

  // Tabi ayak çerçevesi: yere basarken düz, havadayken inciğe dik
  const FF = { fx: 1, fy: 0, ux: 0, uy: -1, ox: 0, oy: 0 };
  const FOOT = [-4.5, -1, -4.8, -4.4, -2.5, -5.9, 6, -6.1, 11.8, -5.7, 13.4, -3.4, 11.7, -1.1, 6, 0.9, 1.5, 3.8, -3.8, 3.3];
  function footFrame(ft, kn, dir, s) {
    const sd = dir < 0 ? -1 : 1, ad = Math.max(0.12, Math.abs(dir));
    let sx = (ft.x - kn.x) / ad, sy = ft.y - kn.y; const d = Math.hypot(sx, sy) || 1; sx /= d; sy /= d;
    let fx = sd * sy, fy = -sd * sx;
    const w = clamp(1 - (-ft.y - 3) / 16, 0, 1);
    fx += (sd - fx) * w; fy *= 1 - w;
    const m = Math.hypot(fx, fy) || 1; fx /= m; fy /= m;
    FF.fx = fx * ad * s; FF.fy = fy * s; FF.ux = sd * fy * ad * s; FF.uy = -sd * fx * s; FF.ox = ft.x; FF.oy = ft.y;
  }
  const FX = (a, b) => FF.ox + FF.fx * a + FF.ux * b, FY = (a, b) => FF.oy + FF.fy * a + FF.uy * b;
  function footPath(ctx) {
    for (let i = 0; i < 10; i++) { BUF[i * 2] = FX(FOOT[i * 2], FOOT[i * 2 + 1]); BUF[i * 2 + 1] = FY(FOOT[i * 2], FOOT[i * 2 + 1]); }
    blob(ctx, BUF, 10);
  }

  // Bıçak gövdesi: eğrilik (sori), genişlik, renk
  function blade(ctx, x0, y0, x1, y1, nx, ny, sori, w, dark) {
    const mx = (x0 + x1) / 2 - nx * sori, my = (y0 + y1) / 2 - ny * sori;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    if (dark) { g.addColorStop(0, '#6d7480'); g.addColorStop(0.6, '#a8afba'); g.addColorStop(1, '#d6dbe2'); }
    else { g.addColorStop(0, '#9aa3b2'); g.addColorStop(0.6, '#d7dde6'); g.addColorStop(1, '#f5f8fc'); }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0 + nx * 1.9 * w, y0 + ny * 1.9 * w);
    ctx.quadraticCurveTo(mx + nx * 1.6 * w, my + ny * 1.6 * w, x1, y1);
    ctx.quadraticCurveTo(mx - nx * 1.8 * w, my - ny * 1.8 * w, x0 - nx * 1.9 * w, y0 - ny * 1.9 * w);
    ctx.closePath(); ctx.fill();
    // sırt (mune) tarafı gölgesi + ağız parlaklığı
    ctx.strokeStyle = 'rgba(40,46,60,.35)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(x0 - nx * 1.7 * w, y0 - ny * 1.7 * w); ctx.quadraticCurveTo(mx - nx * 1.6 * w, my - ny * 1.6 * w, x1, y1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x0 + nx * 1.4 * w, y0 + ny * 1.4 * w); ctx.quadraticCurveTo(mx + nx * 1.2 * w, my + ny * 1.2 * w, x1, y1); ctx.stroke();
    return [mx, my];
  }
  // Hareket ettikçe bıçak boyunca kayan ışık yansıması
  function spec(ctx, x0, y0, x1, y1, ang) {
    const u = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(ang * 3 + ND.scene.t * 1.3));
    const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(1.8, 0.35);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 9);
    g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 6.283); ctx.fill();
    ctx.restore();
  }
  function tipGlint(ctx, tx, ty, glint) {
    if (glint <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= glint;
    const r = 26 * glint + 6;
    const gg = ctx.createRadialGradient(tx, ty, 0, tx, ty, r);
    gg.addColorStop(0, 'rgba(255,255,255,1)'); gg.addColorStop(0.25, 'rgba(255,220,160,.6)'); gg.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(tx, ty, r, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(tx - r * 1.3, ty); ctx.lineTo(tx + r * 1.3, ty); ctx.moveTo(tx, ty - r * 1.3); ctx.lineTo(tx, ty + r * 1.3); ctx.stroke();
    ctx.restore();
  }

  // Düşük ayrıntılı kılıç (yansıma / gölge)
  function swordLow(ctx, hx, hy, ang, wpn, j) {
    const cs = Math.cos(ang), sn = Math.sin(ang), BL = wpn.blade, HL = wpn.handle, ty = wpn.type;
    ctx.lineCap = 'round';
    if (ty === 'bo') {
      ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 4.2;
      ctx.beginPath(); line(ctx, hx - cs * HL, hy - sn * HL, hx + cs * BL, hy + sn * BL); ctx.stroke();
      return;
    }
    if (ty === 'kusarigama') {
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 3.6;
      ctx.beginPath(); line(ctx, hx - cs * HL, hy - sn * HL, hx + cs * (BL - 14), hy + sn * (BL - 14)); ctx.stroke();
      ctx.strokeStyle = '#c9d0da'; ctx.lineWidth = 2.4;
      ctx.beginPath(); line(ctx, hx + cs * (BL - 14), hy + sn * (BL - 14), hx + cs * (BL - 18) - sn * 26 * ((j && j.dir) < 0 ? -1 : 1), hy + sn * (BL - 18) + cs * 26 * ((j && j.dir) < 0 ? -1 : 1)); ctx.stroke();
      return;
    }
    if (ty === 'tessen') {
      const o = j ? j.wFan || 0 : 0;
      if (o < 0.1) { ctx.strokeStyle = '#1d1f24'; ctx.lineWidth = 4.2; ctx.beginPath(); line(ctx, hx, hy, hx + cs * BL, hy + sn * BL); ctx.stroke(); return; }
      const h = (0.14 + o * 2.35) / 2;
      ctx.fillStyle = '#3a2b36';
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.arc(hx, hy, BL, ang - h, ang + h); ctx.closePath(); ctx.fill();
      return;
    }
    if (ty === 'yumi' && j && j.wBow > 0.5) {
      ctx.strokeStyle = '#1c1410'; ctx.lineWidth = 2.6;
      const nx = -sn * (j.dir < 0 ? -1 : 1), ny = cs * (j.dir < 0 ? -1 : 1);
      ctx.beginPath(); ctx.moveTo(hx - cs * 46 - nx * 6, hy - sn * 46 - ny * 6); ctx.quadraticCurveTo(hx - cs * 11 + nx * 10, hy - sn * 11 + ny * 10, hx + cs * 68 - nx * 7, hy + sn * 68 - ny * 7); ctx.stroke();
      return;
    }
    if (wpn.type === 'naginata') {
      ctx.strokeStyle = '#2b1b12'; ctx.lineWidth = 4.2;
      ctx.beginPath(); line(ctx, hx - cs * HL, hy - sn * HL, hx + cs * (BL - 48), hy + sn * (BL - 48)); ctx.stroke();
      ctx.strokeStyle = '#c9d0da'; ctx.lineWidth = 3;
      ctx.beginPath(); line(ctx, hx + cs * (BL - 46), hy + sn * (BL - 46), hx + cs * BL, hy + sn * BL); ctx.stroke();
      return;
    }
    if (j && j.wSheath) {
      // iai: scabbard along the blade line, hilt in front
      ctx.strokeStyle = '#141116'; ctx.lineWidth = 5;
      ctx.beginPath(); line(ctx, hx - cs * HL, hy - sn * HL, hx + cs * (BL + 4), hy + sn * (BL + 4)); ctx.stroke();
      return;
    }
    ctx.strokeStyle = '#141116'; ctx.lineWidth = 5;
    ctx.beginPath(); line(ctx, hx - cs * HL, hy - sn * HL, hx, hy); ctx.stroke();
    ctx.strokeStyle = '#c9d0da'; ctx.lineWidth = BL > 110 ? 3 : 2.5;
    ctx.beginPath(); line(ctx, hx + cs * 3, hy + sn * 3, hx + cs * BL, hy + sn * BL); ctx.stroke();
  }

  // j (isteğe bağlı): kesirli dir ve silah durumu (yelpaze açıklığı, yay/kiriş) için eklem nesnesi
  function drawSword(ctx, hx, hy, ang, col, glint, wpn = L, lod, j) {
    if (lod === 'low') { swordLow(ctx, hx, hy, ang, wpn, j); return; }
    const cs = Math.cos(ang), sn = Math.sin(ang), nx = -sn, ny = cs;
    const BL = wpn.blade, HL = wpn.handle;
    let type = wpn.type || (BL > 110 ? 'nodachi' : BL < 80 ? 'kodachi' : 'katana');
    const d = j ? j.dir : 1;
    if (type === 'bo') { drawBo(ctx, hx, hy, ang, col, glint, wpn); return; }
    if (type === 'kusarigama') { drawKama(ctx, hx, hy, ang, col, glint, wpn, d); return; }
    if (type === 'tessen') { drawTessen(ctx, hx, hy, ang, col, j ? j.wFan || 0 : 0, BL, d, glint); return; }
    if (type === 'yumi') { if (j && j.wBow > 0.5 && j.haB) { drawBow(ctx, j, col, glint); return; } type = 'tanto'; }
    ctx.lineCap = 'round';
    if (type === 'naginata') {
      const bl = 48, se = BL - bl;
      ctx.strokeStyle = '#2b1b12'; ctx.lineWidth = 4.6;
      ctx.beginPath(); ctx.moveTo(hx - cs * HL, hy - sn * HL); ctx.lineTo(hx + cs * se, hy + sn * se); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,215,170,.14)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(hx - cs * HL + nx, hy - sn * HL + ny); ctx.lineTo(hx + cs * se + nx, hy + sn * se + ny); ctx.stroke();
      ctx.strokeStyle = col.accent; ctx.lineWidth = 5.4;
      for (const d of [-HL + 2, se - 14, se - 8]) { ctx.beginPath(); ctx.moveTo(hx + cs * d, hy + sn * d); ctx.lineTo(hx + cs * (d + 2.5), hy + sn * (d + 2.5)); ctx.stroke(); }
      ctx.fillStyle = '#3b3530';
      ctx.beginPath(); ctx.ellipse(hx + cs * se, hy + sn * se, 2, 6, ang, 0, 6.283); ctx.fill();
      const x0 = hx + cs * (se + 2), y0 = hy + sn * (se + 2), tx = hx + cs * BL, ty = hy + sn * BL;
      blade(ctx, x0, y0, tx, ty, nx, ny, 7, 1.35, false);
      spec(ctx, x0, y0, tx, ty, ang);
      tipGlint(ctx, tx, ty, glint);
      return;
    }
    // kabza (tsuka): koyu gövde + çapraz ito sargısı (elmas desen)
    ctx.strokeStyle = '#141116'; ctx.lineWidth = type === 'tanto' ? 4.6 : 5.2;
    ctx.beginPath(); ctx.moveTo(hx - cs * HL, hy - sn * HL); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = col.accentDark; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 3; i < HL - 2; i += 4.5) {
      const x = hx - cs * i, y = hy - sn * i;
      ctx.moveTo(x + nx * 2.4 - cs * 1.8, y + ny * 2.4 - sn * 1.8); ctx.lineTo(x - nx * 2.4 + cs * 1.8, y - ny * 2.4 + sn * 1.8);
      ctx.moveTo(x - nx * 2.4 - cs * 1.8, y - ny * 2.4 - sn * 1.8); ctx.lineTo(x + nx * 2.4 + cs * 1.8, y + ny * 2.4 + sn * 1.8);
    }
    ctx.stroke();
    // kashira (kabza ucu)
    ctx.strokeStyle = '#3b3530'; ctx.lineWidth = 5.6;
    ctx.beginPath(); ctx.moveTo(hx - cs * HL, hy - sn * HL); ctx.lineTo(hx - cs * (HL - 1.6), hy - sn * (HL - 1.6)); ctx.stroke();
    // tsuba
    ctx.fillStyle = '#3b3530';
    if (type === 'ninjato') {
      ctx.save(); ctx.translate(hx + cs * 1.5, hy + sn * 1.5); ctx.rotate(ang); ctx.fillRect(-2, -7.5, 4, 15);
      ctx.fillStyle = 'rgba(255,240,210,.22)'; ctx.fillRect(-2, -7.5, 1, 15); ctx.restore();
    } else if (type !== 'tanto') {
      ctx.beginPath(); ctx.ellipse(hx + cs * 1.5, hy + sn * 1.5, 2.2, 7, ang, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(255,236,200,.28)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.ellipse(hx + cs * 1.5, hy + sn * 1.5, 1.4, 6.2, ang, -2.2, -0.6); ctx.stroke();
    }
    if (j && j.wSheath) return; // iai: the blade rests in the hip scabbard, only the hilt shows
    const w = type === 'nodachi' ? 1.25 : type === 'kodachi' ? 0.85 : type === 'tanto' ? 0.8 : 1;
    const sori = type === 'ninjato' ? 0.4 : type === 'tanto' ? 1 : 3.2 * BL / 96;
    const bx0 = hx + cs * 3, by0 = hy + sn * 3, tx = hx + cs * BL, ty = hy + sn * BL;
    blade(ctx, bx0, by0, tx, ty, nx, ny, sori, w, type === 'ninjato');
    if (type !== 'tanto') {
      ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const u = 0.06 + i * 0.07, bx = bx0 + (tx - bx0) * u, by = by0 + (ty - by0) * u;
        const off = -sori * 4 * u * (1 - u) + 0.6 * w + Math.sin(i * 2.1) * 0.35;
        const x = bx + nx * off, y = by + ny * off;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#c8b27a'; ctx.fillRect(hx + cs * 2.5 - 1.8, hy + sn * 2.5 - 1.8, 3.6, 3.6);
    spec(ctx, bx0, by0, tx, ty, ang);
    tipGlint(ctx, tx, ty, glint);
  }

  // ---------------------------------------------------------------- YENİ SİLAHLAR (bō, kusarigama, tessen, yumi)
  // Silah çerçevesi: u = eksen (el → uç), n = eksene dik "ileri" taraf (pozda sw'ye göre +90°). Kesirli dir (dönüş)
  // çerçeveyi yatayda sıkıştırır, dir < 0 aynalar: çizim her yöne bakışta ve dönüşte tutarlı kalır.
  const WF = { ox: 0, oy: 0, ux: 1, uy: 0, nx: 0, ny: 1 };
  function wframe(hx, hy, ang, d) {
    let s = d == null ? 1 : d;
    if (Math.abs(s) < 0.06) s = s < 0 ? -0.06 : 0.06;
    const la = Math.atan2(Math.sin(ang), Math.cos(ang) / s), c = Math.cos(la), n = Math.sin(la);
    WF.ox = hx; WF.oy = hy; WF.ux = c * s; WF.uy = n; WF.nx = -n * s; WF.ny = c;
  }
  const WX = (u, n) => WF.ox + WF.ux * u + WF.nx * n, WY = (u, n) => WF.oy + WF.uy * u + WF.ny * n;
  const PA = [0, 0], PB = [0, 0], PC = [0, 0], PD = [0, 0], RATTAN = [0.1, 0.16, 0.8, 0.86, 0.93], BO_WRAP = [0.34, -0.18, -0.72];
  // yelpaze yaprağı noktası (kapanış tahsisi yok): i = kaburga sırası, r = yarıçap
  const FAN = { h: 0, S: 0 }, FAN_N = 10;
  function fanPt(i, r, o = PA) { const th = -FAN.h + (FAN.S * i) / FAN_N, u = Math.cos(th) * r, n = Math.sin(th) * r; o[0] = WX(u, n); o[1] = WY(u, n); return o; }
  // yay eğrisi noktası (ikinci derece Bézier B → C → T)
  const BQ = { bx: 0, by: 0, cx: 0, cy: 0, tx: 0, ty: 0 };
  function bowPt(t, o) { const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c2 = t * t; o[0] = BQ.bx * a + BQ.cx * b + BQ.tx * c2; o[1] = BQ.by * a + BQ.cy * b + BQ.ty * c2; return o; }
  const wl = (ctx, u0, n0, u1, n1) => { ctx.moveTo(WX(u0, n0), WY(u0, n0)); ctx.lineTo(WX(u1, n1), WY(u1, n1)); };

  // Bō: meşe asa, iki ucu demir başlıklı, ortası deri sargılı; iki uç da vurur
  function drawBo(ctx, hx, hy, ang, col, glint, wpn) {
    const cs = Math.cos(ang), sn = Math.sin(ang), BL = wpn.blade, HL = wpn.handle;
    const ax = hx - cs * HL, ay = hy - sn * HL, bx = hx + cs * BL, by = hy + sn * BL;
    let nx = -sn, ny = cs; if (nx * LT.x + ny * LT.y < 0) { nx = -nx; ny = -ny; }
    ctx.lineCap = 'butt';
    ctx.strokeStyle = '#120c08'; ctx.lineWidth = 6.8;
    ctx.beginPath(); line(ctx, ax - cs * 0.8, ay - sn * 0.8, bx + cs * 0.8, by + sn * 0.8); ctx.stroke();
    ctx.strokeStyle = '#66401f'; ctx.lineWidth = 4.8;
    ctx.beginPath(); line(ctx, ax, ay, bx, by); ctx.stroke();
    ctx.strokeStyle = '#3d240f'; ctx.lineWidth = 1.7;
    ctx.beginPath(); line(ctx, ax - nx * 1.4, ay - ny * 1.4, bx - nx * 1.4, by - ny * 1.4); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,214,160,.38)'; ctx.lineWidth = 1.1;
    ctx.beginPath(); line(ctx, ax + nx * 1.3, ay + ny * 1.3, bx + nx * 1.3, by + ny * 1.3); ctx.stroke();
    // damar izleri
    ctx.strokeStyle = 'rgba(40,20,8,.45)'; ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let k = -HL + 14; k < BL - 14; k += 23) { const o = ((k * 7) % 5) * 0.3 - 0.6; line(ctx, hx + cs * k + nx * o, hy + sn * k + ny * o, hx + cs * (k + 9) + nx * o, hy + sn * (k + 9) + ny * o); }
    ctx.stroke();
    // deri sargılar (tutuş yerleri)
    ctx.strokeStyle = col.accentDark; ctx.lineWidth = 5.6;
    ctx.beginPath();
    for (const f of BO_WRAP) { const k = f > 0 ? BL * f : HL * f; line(ctx, hx + cs * k, hy + sn * k, hx + cs * (k + 5), hy + sn * (k + 5)); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const f of BO_WRAP) { const k = f > 0 ? BL * f : HL * f; line(ctx, hx + cs * k + nx * 2, hy + sn * k + ny * 2, hx + cs * (k + 5) + nx * 2, hy + sn * (k + 5) + ny * 2); }
    ctx.stroke();
    // demir başlıklar
    ctx.strokeStyle = '#4b505a'; ctx.lineWidth = 5.8;
    ctx.beginPath(); line(ctx, bx - cs * 8, by - sn * 8, bx, by); line(ctx, ax, ay, ax + cs * 8, ay + sn * 8); ctx.stroke();
    ctx.strokeStyle = '#b3bac6'; ctx.lineWidth = 1;
    ctx.beginPath(); line(ctx, bx - cs * 7 + nx * 1.6, by - sn * 7 + ny * 1.6, bx + nx * 1.6, by + ny * 1.6); line(ctx, ax + nx * 1.6, ay + ny * 1.6, ax + cs * 7 + nx * 1.6, ay + sn * 7 + ny * 1.6); ctx.stroke();
    ctx.lineCap = 'round';
    tipGlint(ctx, bx, by, glint);
  }

  // Kusarigama orağı: sargılı ahşap sap, demir bilezik, sapa dik hilal bıçak; zincir kabza ucundaki halkaya bağlı
  function drawKama(ctx, hx, hy, ang, col, glint, wpn, d) {
    wframe(hx, hy, ang, d);
    const HL = wpn.handle, TOP = wpn.blade - 16;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#100b08'; ctx.lineWidth = 6;
    ctx.beginPath(); wl(ctx, -HL, 0, TOP, 0); ctx.stroke();
    ctx.strokeStyle = '#5b3b22'; ctx.lineWidth = 4.2;
    ctx.beginPath(); wl(ctx, -HL, 0, TOP, 0); ctx.stroke();
    ctx.strokeStyle = col.accentDark; ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let u = -HL + 4; u < TOP - 9; u += 4.4) { wl(ctx, u - 1.6, -2.2, u + 1.6, 2.2); wl(ctx, u - 1.6, 2.2, u + 1.6, -2.2); }
    ctx.stroke();
    // bıçak (sapa dik, ele doğru kıvrık; ağız iç tarafta)
    ctx.beginPath();
    ctx.moveTo(WX(TOP + 1.5, -3), WY(TOP + 1.5, -3));
    ctx.quadraticCurveTo(WX(TOP + 8, 14), WY(TOP + 8, 14), WX(TOP - 5, 31), WY(TOP - 5, 31));
    ctx.quadraticCurveTo(WX(TOP - 1, 15), WY(TOP - 1, 15), WX(TOP - 2.5, 1), WY(TOP - 2.5, 1));
    ctx.closePath();
    ctx.fillStyle = '#c3cad6'; ctx.fill();
    ctx.strokeStyle = 'rgba(30,34,44,.8)'; ctx.lineWidth = 0.9; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(WX(TOP - 5, 30), WY(TOP - 5, 30)); ctx.quadraticCurveTo(WX(TOP - 1.2, 15), WY(TOP - 1.2, 15), WX(TOP - 2, 3), WY(TOP - 2, 3)); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,46,60,.45)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(WX(TOP + 2, 0), WY(TOP + 2, 0)); ctx.quadraticCurveTo(WX(TOP + 6.5, 14), WY(TOP + 6.5, 14), WX(TOP - 3, 26), WY(TOP - 3, 26)); ctx.stroke();
    // demir bilezik + kabza halkası
    ctx.strokeStyle = '#3b3530'; ctx.lineWidth = 6.4;
    ctx.beginPath(); wl(ctx, TOP - 5, 0, TOP + 1, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,236,200,.3)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); wl(ctx, TOP - 4.5, -1.8, TOP + 0.5, -1.8); ctx.stroke();
    ctx.strokeStyle = '#6d737e'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(WX(-HL - 2.4, 0), WY(-HL - 2.4, 0), 2.6, 0, TAU); ctx.stroke();
    tipGlint(ctx, WX(TOP - 5, 30), WY(TOP - 5, 30), glint);
  }

  // Tessen: demir kaburgalı savaş yelpazesi. open 0 = kapalı demir çubuk, 1 = ~150° açık yaprak
  function drawTessen(ctx, hx, hy, ang, col, open, R, d, glint) {
    wframe(hx, hy, ang, d);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const tsw = Math.sin((ND.scene ? ND.scene.t : 0) * 4 + hx * 0.05) * 1.5;
    // püskül (menteşe halkasından sarkar)
    ctx.strokeStyle = col.accentDark; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(WX(-5, 0), WY(-5, 0)); ctx.quadraticCurveTo(WX(-7, 0) + tsw, WY(-7, 0) + 5, WX(-6, 0) + tsw * 1.6, WY(-6, 0) + 10); ctx.stroke();
    ctx.fillStyle = col.accent; ctx.beginPath(); ctx.ellipse(WX(-6, 0) + tsw * 1.6, WY(-6, 0) + 11.5, 1.5, 3, 0, 0, TAU); ctx.fill();
    if (open < 0.06) {
      ctx.strokeStyle = '#0c0d10'; ctx.lineWidth = 6.4;
      ctx.beginPath(); wl(ctx, -5, 0, R, 0); ctx.stroke();
      ctx.strokeStyle = '#2b2e35'; ctx.lineWidth = 4.4; ctx.stroke();
      ctx.strokeStyle = col.accent; ctx.lineWidth = 4.6;
      ctx.beginPath(); wl(ctx, R * 0.62, 0, R * 0.9, 0); ctx.stroke();
      ctx.strokeStyle = 'rgba(210,218,232,.55)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); wl(ctx, -3, -1.4, R - 1, -1.2); ctx.stroke();
      ctx.fillStyle = '#c2ab72'; ctx.beginPath(); ctx.arc(hx, hy, 1.7, 0, TAU); ctx.fill();
      return;
    }
    const S = 0.14 + open * 2.35, r0 = R * 0.3, N = FAN_N;
    FAN.h = S / 2; FAN.S = S;
    const P = fanPt;
    // yaprak (kâğıt/ipek)
    ctx.beginPath();
    for (let i = 0; i <= N; i++) { const p = P(i, R); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
    for (let i = N; i >= 0; i--) { const p = P(i, r0); ctx.lineTo(p[0], p[1]); }
    ctx.closePath();
    ctx.strokeStyle = '#0d0e12'; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.fillStyle = col.accent; ctx.fill();
    // pliler: bir koyu bir açık panel
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath();
    for (let i = 0; i < N; i += 2) { const a = P(i, R, PA), b = P(i + 1, R, PB), c2 = P(i + 1, r0, PC), e = P(i, r0, PD); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c2[0], c2[1]); ctx.lineTo(e[0], e[1]); ctx.closePath(); }
    ctx.fill();
    // arma: güneş diski + iç şerit
    const sr = R * 0.14 * (0.35 + 0.65 * Math.min(1, Math.abs(d || 1))) * Math.min(1, open * 1.4);
    ctx.fillStyle = 'rgba(246,238,222,.9)'; ctx.beginPath(); ctx.arc(WX(R * 0.66, 0), WY(R * 0.66, 0), sr, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,245,225,.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); for (let i = 0; i <= N; i++) { const p = P(i, R * 0.86); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); } ctx.stroke();
    // kaburgalar
    ctx.strokeStyle = 'rgba(12,12,16,.6)'; ctx.lineWidth = 0.8; ctx.beginPath();
    for (let i = 1; i < N; i++) { const p = P(i, R * 0.97); ctx.moveTo(WX(-2, 0), WY(-2, 0)); ctx.lineTo(p[0], p[1]); }
    ctx.stroke();
    // kenar demirleri (oyabone)
    const e0 = P(0, R + 1.5, PA), e1 = P(N, R + 1.5, PB);
    ctx.strokeStyle = '#0b0c0f'; ctx.lineWidth = 3.8;
    ctx.beginPath(); ctx.moveTo(WX(-5, 0), WY(-5, 0)); ctx.lineTo(e0[0], e0[1]); ctx.moveTo(WX(-5, 0), WY(-5, 0)); ctx.lineTo(e1[0], e1[1]); ctx.stroke();
    ctx.strokeStyle = '#3a3e47'; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.strokeStyle = 'rgba(220,226,238,.55)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(WX(-3, 0), WY(-3, 0)); ctx.lineTo(e1[0], e1[1]); ctx.stroke();
    // dış kenar ışığı
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); for (let i = 0; i <= N; i++) { const p = P(i, R - 0.8); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); } ctx.stroke();
    ctx.fillStyle = '#c2ab72'; ctx.beginPath(); ctx.arc(hx, hy, 2, 0, TAU); ctx.fill();
    if (glint > 0) tipGlint(ctx, WX(R, 0), WY(R, 0), glint);
  }

  // Yumi: asimetrik uzun yay (üst kol uzun), rattan sargılar, kiriş arka ele çekilir; j.wDraw 0..1, j.wArrow, j.wCharge
  const BOW_T = 68, BOW_B = -46;
  function drawBow(ctx, j, col, glint) {
    const hx = j.haF.x, hy = j.haF.y, ang = Math.atan2(j.tip.y - hy, j.tip.x - hx);
    wframe(hx, hy, ang, j.dir);
    const dr = clamp(j.wDraw || 0, 0, 1), tn = -(6 + 10 * dr);
    const Tx = WX(BOW_T, tn), Ty = WY(BOW_T, tn), Bx = WX(BOW_B, tn * 0.85), By = WY(BOW_B, tn * 0.85);
    const Cx = WX(-11, -tn * 0.93), Cy = WY(-11, -tn * 0.93);
    // kiriş (okçu tarafında): çekilince arka ele kırılır
    let kx = (Tx + Bx) * 0.5, ky = (Ty + By) * 0.5;
    if (dr > 0.01 && j.haB) { kx += (j.haB.x - kx) * dr; ky += (j.haB.y - ky) * dr; }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(236,228,206,.92)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(Bx, By); ctx.lineTo(kx, ky); ctx.lineTo(Tx, Ty); ctx.stroke();
    // yay gövdesi (lake bambu)
    ctx.beginPath(); ctx.moveTo(Bx, By); ctx.quadraticCurveTo(Cx, Cy, Tx, Ty);
    ctx.strokeStyle = '#0b0807'; ctx.lineWidth = 4.6; ctx.stroke();
    ctx.strokeStyle = '#2c1d15'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(Bx + LT.x, By + LT.y); ctx.quadraticCurveTo(Cx + LT.x, Cy + LT.y, Tx + LT.x, Ty + LT.y);
    ctx.strokeStyle = 'rgba(255,222,180,.34)'; ctx.lineWidth = 0.9; ctx.stroke();
    // rattan halkaları + tutamak sargısı
    BQ.bx = Bx; BQ.by = By; BQ.cx = Cx; BQ.cy = Cy; BQ.tx = Tx; BQ.ty = Ty;
    const q = bowPt;
    ctx.strokeStyle = col.accent; ctx.lineWidth = 3.8;
    ctx.beginPath();
    for (const t of RATTAN) { const p = q(t, PA), p2 = q(t + 0.012, PB); ctx.moveTo(p[0], p[1]); ctx.lineTo(p2[0], p2[1]); }
    ctx.stroke();
    ctx.strokeStyle = col.accentDark; ctx.lineWidth = 5;
    { const p = q(0.36, PA), p2 = q(0.46, PB); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); }
    // uç çentikleri (hafif ters kıvrım)
    ctx.strokeStyle = '#0b0807'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(Tx, Ty); ctx.lineTo(WX(BOW_T + 3, tn + 3), WY(BOW_T + 3, tn + 3)); ctx.moveTo(Bx, By); ctx.lineTo(WX(BOW_B - 3, tn * 0.85 + 2.5), WY(BOW_B - 3, tn * 0.85 + 2.5)); ctx.stroke();
    // yaydaki ok
    if (j.wArrow) {
      let ax = WF.nx, ay = WF.ny; const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
      const len = 80, hx2 = kx + ax * len, hy2 = ky + ay * len;
      ctx.strokeStyle = '#150f0a'; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(hx2, hy2); ctx.stroke();
      ctx.strokeStyle = '#d6c296'; ctx.lineWidth = 1.5; ctx.stroke();
      arrowHead(ctx, hx2, hy2, ax, ay);
      fletch(ctx, kx + ax * 3, ky + ay * 3, ax, ay, col);
      if (j.wCharge > 0) tipGlint(ctx, hx2, hy2, Math.min(1, j.wCharge) * (0.7 + 0.3 * Math.sin((ND.scene ? ND.scene.t : 0) * 30)));
    }
    if (glint > 0) tipGlint(ctx, Tx, Ty, glint);
  }
  function arrowHead(ctx, x, y, ux, uy) {
    ctx.fillStyle = '#cfd5de'; ctx.strokeStyle = '#15171c'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x + ux * 8, y + uy * 8); ctx.lineTo(x - uy * 2.6, y + ux * 2.6); ctx.lineTo(x + uy * 2.6, y - ux * 2.6); ctx.closePath(); ctx.stroke(); ctx.fill();
  }
  function fletch(ctx, x, y, ux, uy, col) {
    ctx.fillStyle = '#ece6da';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ux * 13 - uy * 1, y + uy * 13 + ux * 1); ctx.lineTo(x + ux * 4 - uy * 4, y + uy * 4 + ux * 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col ? col.accent : '#a33';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ux * 13 + uy * 1, y + uy * 13 - ux * 1); ctx.lineTo(x + ux * 4 + uy * 4, y + uy * 4 - ux * 4); ctx.closePath(); ctx.fill();
  }
  // Uçan ok (mermi görünümü de kullanır): x,y = uç; ux,uy = yön
  ND.drawArrow = function (ctx, x, y, ux, uy, col, len = 66, glow = 0) {
    const tx = x - ux * len, ty = y - uy * len;
    ctx.lineCap = 'round';
    if (glow > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = glow;
      ctx.strokeStyle = col && col.glow ? col.glow : 'rgba(170,235,255,.8)'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.restore();
    }
    ctx.strokeStyle = '#150f0a'; ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.strokeStyle = '#d6c296'; ctx.lineWidth = 1.5; ctx.stroke();
    arrowHead(ctx, x, y, ux, uy);
    fletch(ctx, tx, ty, ux, uy, col);
  };
  // Yayın nişan yönü ve okun çıkış noktası (fırlatma için; çizimle aynı hesap)
  ND.bowAim = function (j, out = {}) {
    const ang = Math.atan2(j.tip.y - j.haF.y, j.tip.x - j.haF.x);
    wframe(j.haF.x, j.haF.y, ang, j.dir);
    let ax = WF.nx, ay = WF.ny; const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
    out.x = j.haF.x + ax * 16; out.y = j.haF.y + ay * 16; out.dx = ax; out.dy = ay;
    return out;
  };

  // Sırtta sadak (ok sayısı kadar tüy görünür) + yay elde değilse çapraz asılı yay
  function quiverBack(ctx, j, c, D) {
    const bx = -TF.nx, by = -TF.ny, ux = TF.ux, uy = TF.uy;
    if (!(j.wBow > 0.5)) {
      // sırtta asılı yay
      const x0 = j.sh.x + ux * 38 + bx * 4, y0 = j.sh.y + uy * 38 + by * 4, x1 = j.hip.x - ux * 44 + bx * 10, y1 = j.hip.y - uy * 44 + by * 10;
      const cx = j.hip.x + ux * 18 + bx * 36, cy = j.hip.y + uy * 18 + by * 36;
      ctx.strokeStyle = 'rgba(236,228,206,.7)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1);
      ctx.strokeStyle = D.line; ctx.lineWidth = 4.4; ctx.stroke();
      ctx.strokeStyle = '#2c1d15'; ctx.lineWidth = 2.8; ctx.stroke();
      ctx.strokeStyle = c.accent; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(x0 + (cx - x0) * 0.16, y0 + (cy - y0) * 0.16); ctx.lineTo(x0 + (cx - x0) * 0.2, y0 + (cy - y0) * 0.2); ctx.stroke();
    }
    const x0 = j.sh.x + bx * 11 + ux * 12, y0 = j.sh.y + by * 11 + uy * 12;
    const x1 = j.hip.x + bx * 20 + ux * 4, y1 = j.hip.y + by * 20 + uy * 4;
    const dx = x0 - x1, dy = y0 - y1, dl = Math.hypot(dx, dy) || 1, tx = dx / dl, ty = dy / dl;
    // oklar (tüyler ağızdan taşar)
    const n = Math.max(0, Math.min(5, j.wAmmo == null ? 5 : j.wAmmo));
    for (let k = 0; k < n; k++) {
      const sp = (k - (n - 1) / 2) * 0.13, ca = Math.cos(sp), sa = Math.sin(sp), ax = tx * ca - ty * sa, ay = tx * sa + ty * ca;
      const ox = x0 + ax * 4 - ty * (k - 2) * 1.1, oy = y0 + ay * 4 + tx * (k - 2) * 1.1;
      ctx.strokeStyle = '#1b140e'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + ax * 5, oy + ay * 5); ctx.stroke();
      fletch(ctx, ox + ax * 17, oy + ay * 17, -ax, -ay, k & 1 ? c : null);
    }
    ctx.lineCap = 'round';
    ctx.strokeStyle = D.line; ctx.lineWidth = 10;
    ctx.beginPath(); line(ctx, x0, y0, x1, y1); ctx.stroke();
    ctx.strokeStyle = '#3b2a1e'; ctx.lineWidth = 7.6; ctx.stroke();
    let nx = -ty, ny = tx; if (nx * LT.x + ny * LT.y < 0) { nx = -nx; ny = -ny; }
    ctx.strokeStyle = 'rgba(255,220,180,.18)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); line(ctx, x0 + nx * 2.4 - tx * 3, y0 + ny * 2.4 - ty * 3, x1 + nx * 2.4 + tx * 3, y1 + ny * 2.4 + ty * 3); ctx.stroke();
    ctx.strokeStyle = c.accent; ctx.lineWidth = 8.4;
    ctx.beginPath(); line(ctx, x0 - tx * 2, y0 - ty * 2, x0 - tx * 5, y0 - ty * 5); line(ctx, x1 + tx * 6, y1 + ty * 6, x1 + tx * 8, y1 + ty * 8); ctx.stroke();
    ctx.strokeStyle = '#1d1510'; ctx.lineWidth = 8;
    ctx.beginPath(); line(ctx, x1 + tx * 1.5, y1 + ty * 1.5, x1, y1); ctx.stroke();
  }
  // Yay eldeyken tantō kuşakta kınında durur
  function tantoSheath(ctx, c, D) {
    const x0 = PX(9, 14), y0 = PY(9, 14), x1 = PX(-1, -24), y1 = PY(-1, -24);
    ctx.lineCap = 'round';
    ctx.strokeStyle = D.line; ctx.lineWidth = 5.8; ctx.beginPath(); line(ctx, x0, y0, x1, y1); ctx.stroke();
    ctx.strokeStyle = '#141116'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = c.accent; ctx.lineWidth = 4.2;
    ctx.beginPath(); line(ctx, x0 + (x1 - x0) * 0.3, y0 + (y1 - y0) * 0.3, x0 + (x1 - x0) * 0.34, y0 + (y1 - y0) * 0.34); ctx.stroke();
  }
  ND.drawSword = drawSword;

  // ---------------------------------------------------------------- ELLER
  // Yumruk: h = kabza yönü (bıçağa doğru), f = önkol yönü. Dört parmak kabzayı sarar, başparmak üstte.
  function fist(ctx, x, y, hx, hy, fx, fy, D, rimC, hi) {
    const a = Math.atan2(hy, hx), cx = x + fx * 0.8, cy = y + fy * 0.8;
    ctx.fillStyle = D.glove; ctx.strokeStyle = D.line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, 5.3, 4.5, a, 0, TAU); ctx.stroke(); ctx.fill();
    if (!hi) return;
    // parmak aralıkları (boğum tarafında)
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let k = -1; k <= 1; k++) { const px = cx + hx * k * 2.4, py = cy + hy * k * 2.4; line(ctx, px + fx * 1.4, py + fy * 1.4, px + fx * 4.2, py + fy * 4.2); }
    ctx.stroke();
    // başparmak
    ctx.fillStyle = D.gloveHi; ctx.beginPath();
    capPath(ctx, x - fx * 0.6 - hx * 1.8, y - fy * 0.6 - hy * 1.8, x - fx * 0.2 + hx * 4.6, y - fy * 0.2 + hy * 4.6, 2.1, 1.6); ctx.fill();
    // kenar ışığı
    const la = Math.atan2(LT.y, LT.x) - a;
    ctx.strokeStyle = rimC; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.ellipse(cx, cy, 4.6, 3.8, a, la - 0.9, la + 0.9); ctx.stroke();
  }
  // Açık el: parmaklar bitişik (eldiven), başparmak ayrık
  function openHand(ctx, x, y, fx, fy, sd, D, rimC, hi) {
    let tx = -fy, ty = fx; if (tx * sd - ty < 0) { tx = -tx; ty = -ty; }
    ctx.fillStyle = D.glove; ctx.strokeStyle = D.line; ctx.lineWidth = 2;
    ctx.beginPath();
    capPath(ctx, x, y, x + fx * 6.2, y + fy * 6.2, 3.9, 2.9);
    capPath(ctx, x + fx * 1 + tx * 2.2, y + fy * 1 + ty * 2.2, x + fx * 4.2 + tx * 4.2, y + fy * 4.2 + ty * 4.2, 1.7, 1.3);
    ctx.stroke(); ctx.fill();
    if (!hi) return;
    ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); line(ctx, x + fx * 3.2 - tx * 0.6, y + fy * 3.2 - ty * 0.6, x + fx * 7, y + fy * 7); ctx.stroke();
    ctx.strokeStyle = rimC; ctx.lineWidth = 0.9;
    ctx.beginPath(); line(ctx, x + tx * 3.2, y + ty * 3.2, x + fx * 5 + tx * 2.4, y + fy * 5 + ty * 2.4); ctx.stroke();
  }

  // ---------------------------------------------------------------- BACAK
  // Bol hakama: kalçadan dize genişler, dizin altında bir miktar sarkar ve incik sargısında (kyahan) toplanır
  function drawLeg(ctx, j, front, c, D) {
    const hip = j.hip, kn = front ? j.knF : j.knB, ft = front ? j.ftF : j.ftB;
    const s = front ? 1 : 0.94, rimC = front ? c.rim : c.rimDim;
    const clothC = front ? c.hakama || c.cloth : c.hakamaDark || c.clothDark, wrapC = front ? c.wrap : c.wrapDark;
    const bx = kn.x + (ft.x - kn.x) * 0.36, by = kn.y + (ft.y - kn.y) * 0.36;
    ctx.strokeStyle = D.line; ctx.lineWidth = 2.6;
    // incik sargısı
    ctx.beginPath(); capPath(ctx, kn.x, kn.y, ft.x, ft.y, 6.6 * s, 5 * s); ctx.stroke();
    ctx.fillStyle = wrapC; ctx.fill();
    shade(ctx, bx, by, ft.x, ft.y, 6.9 * s, 5 * s, front ? D.hiW : null, rimC, front ? undefined : 0);
    // sargı bantları (çapraz)
    {
      const dx = ft.x - kn.x, dy = ft.y - kn.y, d = Math.hypot(dx, dy) || 1, tx = dx / d, ty = dy / d, nx = -ty, ny = tx;
      ctx.strokeStyle = 'rgba(0,0,0,.42)'; ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const u = 0.42 + i * 0.115, x = kn.x + dx * u, y = kn.y + dy * u, w = (6.6 - u * 1.6) * s, sk = i & 1 ? 1.8 : -1.8;
        line(ctx, x + nx * w - tx * sk, y + ny * w - ty * sk, x - nx * w + tx * sk, y - ny * w + ty * sk);
      }
      ctx.stroke();
      if (front) {
        ctx.strokeStyle = 'rgba(255,255,255,.07)';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const u = 0.42 + i * 0.115 - 0.035, x = kn.x + dx * u, y = kn.y + dy * u, w = (6.6 - u * 1.6) * s - 0.8, sk = i & 1 ? 1.8 : -1.8;
          line(ctx, x + nx * w - tx * sk, y + ny * w - ty * sk, x - nx * w + tx * sk, y - ny * w + ty * sk);
        }
        ctx.stroke();
      }
    }
    // tabi
    footFrame(ft, kn, j.dir, s);
    ctx.beginPath(); footPath(ctx); ctx.strokeStyle = D.line; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.fillStyle = D.tabi; ctx.fill();
    ctx.strokeStyle = D.sole; ctx.lineWidth = 1.3;
    ctx.beginPath(); line(ctx, FX(-3.2, -5.3), FY(-3.2, -5.3), FX(11.2, -5.1), FY(11.2, -5.1)); ctx.stroke();
    if (front) {
    ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 0.8; // ayrık parmak
    ctx.beginPath(); line(ctx, FX(10.3, -1.6), FY(10.3, -1.6), FX(9.8, -4.6), FY(9.8, -4.6)); ctx.stroke();
    ctx.strokeStyle = rimC; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(FX(0.5, 3.3), FY(0.5, 3.3)); ctx.quadraticCurveTo(FX(6.5, 1), FY(6.5, 1), FX(11.6, -1.3), FY(11.6, -1.3)); ctx.stroke();
    }
    // hakama: uyluk + diz torbası
    ctx.strokeStyle = D.line; ctx.lineWidth = 2.6;
    ctx.beginPath();
    capPath(ctx, hip.x, hip.y, kn.x, kn.y, 10.2 * s, 10.8 * s);
    capPath(ctx, kn.x, kn.y, bx, by, 10.8 * s, 7.8 * s);
    ctx.stroke(); ctx.fillStyle = clothC; ctx.fill();
    shade(ctx, hip.x, hip.y, kn.x, kn.y, 10.2 * s, 10.8 * s, front ? D.hiA : D.hiB, rimC);
    shade(ctx, kn.x, kn.y, bx, by, 10.8 * s, 7.8 * s, front ? D.hiA : null, rimC, front ? undefined : 0);
    // paça kenarı (sargının üstüne dökülen kumaş) + kıvrımlar (tek çizim)
    const sx = ft.x - kn.x, sy = ft.y - kn.y, sd0 = Math.hypot(sx, sy) || 1, pnx = -sy / sd0 * 7.6 * s, pny = sx / sd0 * 7.6 * s;
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = front ? 'rgba(0,0,0,.42)' : 'rgba(0,0,0,.32)';
    ctx.beginPath(); ctx.moveTo(bx + pnx, by + pny); ctx.quadraticCurveTo(bx + sx / sd0 * 2.4, by + sy / sd0 * 2.4, bx - pnx, by - pny);
    // kıvrımlar: diz bükülmesiyle belirginleşen iç kıvrım + uyluk çekme çizgileri
    const t1x = (kn.x - hip.x), t1y = (kn.y - hip.y), l1 = Math.hypot(t1x, t1y) || 1;
    const ax1 = t1x / l1, ay1 = t1y / l1, ax2 = sx / sd0, ay2 = sy / sd0;
    let ix = ax2 - ax1, iy = ay2 - ay1; const bend = Math.hypot(ix, iy);
    ctx.moveTo(hip.x + t1x * 0.2 + ay1 * -4 * j.dir, hip.y + t1y * 0.2 - ax1 * -4 * j.dir);
    ctx.quadraticCurveTo(hip.x + t1x * 0.55 + ay1 * 2, hip.y + t1y * 0.55 - ax1 * 2, hip.x + t1x * 0.86 - ay1 * 3 * j.dir, hip.y + t1y * 0.86 + ax1 * 3 * j.dir);
    if (bend > 0.25) {
      ix /= bend; iy /= bend;
      const k = Math.min(1, (bend - 0.25) * 1.2) * 6;
      const px = kn.x + ix * 4, py = kn.y + iy * 4;
      ctx.moveTo(px - ax1 * k + ix * 3, py - ay1 * k + iy * 3); ctx.lineTo(px, py); ctx.lineTo(px + ax2 * k + ix * 3, py + ay2 * k + iy * 3);
      ctx.moveTo(px - ax1 * k * 0.6 + ix * 5.5, py - ay1 * k * 0.6 + iy * 5.5); ctx.lineTo(px + ix * 2.8, py + iy * 2.8); ctx.lineTo(px + ax2 * k * 0.6 + ix * 5.5, py + ay2 * k * 0.6 + iy * 5.5);
    }
    ctx.stroke();
    if (front) {
      ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(hip.x + t1x * 0.3 - ay1 * 5 * j.dir, hip.y + t1y * 0.3 + ax1 * 5 * j.dir);
      ctx.quadraticCurveTo(hip.x + t1x * 0.6, hip.y + t1y * 0.6, hip.x + t1x * 0.9 + ay1 * 3 * j.dir, hip.y + t1y * 0.9 - ax1 * 3 * j.dir); ctx.stroke();
    }
  }

  // ---------------------------------------------------------------- KOL
  // Bol yen (üst kol) + sargılı önkol (tekko) + el. Yen alt tarafı yerçekimiyle sarkar ve hafifçe dalgalanır.
  function drawArm(ctx, j, front, c, D, X, wpn, acc) {
    const sh = j.sh, el = front ? j.elF : j.elB, ha = front ? j.haF : j.haB;
    const s = front ? 1 : 0.93, rimC = front ? c.rim : c.rimDim;
    const clothC = front ? c.cloth : c.clothDark, wrapC = front ? c.wrap : c.wrapDark;
    let ux = el.x - sh.x, uy = el.y - sh.y; const d = Math.hypot(ux, uy) || 1; ux /= d; uy /= d;
    let nx = -uy, ny = ux; if (ny < 0) { nx = -nx; ny = -ny; }
    const horiz = 1 - Math.abs(uy);
    const t = ND.scene.t, amp = 0.7 + Math.min(1.6, Math.abs(j._vs || 0) * 0.25);
    const fl = Math.sin(t * 9 + (front ? 0 : 1.7) + sh.x * 0.03) * amp;
    const sag = horiz * (4.8 + fl) + 0.6 * fl + 1;
    const mx = (sh.x + el.x) * 0.5, my = (sh.y + el.y) * 0.5;
    const P = BUF;
    const put = (i, x, y) => { P[i * 2] = x; P[i * 2 + 1] = y; };
    const sleeve = () => {
      put(0, sh.x - nx * 8.2 * s, sh.y - ny * 8.2 * s);
      put(1, el.x - nx * 7.4 * s, el.y - ny * 7.4 * s);
      put(2, el.x + ux * 4.4 - nx * 7 * s, el.y + uy * 4.4 - ny * 7 * s);
      put(3, el.x + ux * 5 + nx * (9.4 * s + sag), el.y + uy * 5 + ny * (9.4 * s + sag));
      put(4, mx + nx * (8.4 * s + sag * 0.6), my + ny * (8.4 * s + sag * 0.6));
      put(5, sh.x + nx * 7.2 * s, sh.y + ny * 7.2 * s);
      put(6, sh.x - ux * 6, sh.y - uy * 6);
      blob(ctx, P, 7);
    };
    const hdx = ha.x - el.x, hdy = ha.y - el.y, hd = Math.hypot(hdx, hdy) || 1, fx = hdx / hd, fy = hdy / hd;
    // dış hat
    ctx.strokeStyle = D.line; ctx.lineWidth = 2.6;
    ctx.beginPath(); sleeve(); capPath(ctx, el.x, el.y, ha.x, ha.y, 5.2 * s, 4.3 * s); ctx.stroke();
    // yen gövdesi
    ctx.fillStyle = clothC; ctx.beginPath(); sleeve(); ctx.fill();
    shade(ctx, sh.x, sh.y, el.x + ux * 2, el.y + uy * 2, 6.8 * s, 6.4 * s, front ? D.hiA : null, rimC);
    if (front) {
      // yen kıvrımları: omuzdan sarkan uca doğru
      ctx.strokeStyle = 'rgba(0,0,0,.34)'; ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(sh.x + nx * 2 + ux * 3, sh.y + ny * 2 + uy * 3); ctx.quadraticCurveTo(mx + nx * 5, my + ny * 5, el.x + ux * 3 + nx * (6 + sag * 0.8), el.y + uy * 3 + ny * (6 + sag * 0.8));
      ctx.moveTo(mx - nx * 2, my - ny * 2); ctx.quadraticCurveTo(el.x + nx * 1, el.y + ny * 1, el.x + ux * 4 + nx * 3.5, el.y + uy * 4 + ny * 3.5);
      ctx.stroke();
    }
    if (acc === 'kabuto') sode(ctx, sh, el, c, D, !front);
    // önkol (tekko sargısı)
    ctx.fillStyle = wrapC; ctx.beginPath(); capPath(ctx, el.x, el.y, ha.x, ha.y, 5.2 * s, 4.3 * s); ctx.fill();
    shade(ctx, el.x, el.y, ha.x, ha.y, 5.2 * s, 4.3 * s, front ? D.hiW : null, rimC, front ? undefined : 0);
    if (front) {
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const u = 0.3 + i * 0.14, x = el.x + hdx * u, y = el.y + hdy * u, w = (5.2 - u) * s, sk = i & 1 ? 1.4 : -1.4;
        line(ctx, x - fy * w - fx * sk, y + fx * w - fy * sk, x + fy * w + fx * sk, y - fx * w + fy * sk);
      }
      ctx.stroke();
    }
    // tekko: bileği örten koyu eldiven manşeti
    ctx.fillStyle = D.glove; ctx.beginPath(); capPath(ctx, el.x + hdx * 0.72, el.y + hdy * 0.72, ha.x, ha.y, 4.8 * s, 4.4 * s); ctx.fill();
    if (front) {
      ctx.strokeStyle = D.hiW; ctx.lineWidth = 0.9;
      ctx.beginPath(); line(ctx, el.x + hdx * 0.72 - fy * 4.6, el.y + hdy * 0.72 + fx * 4.6, el.x + hdx * 0.72 + fy * 4.6, el.y + hdy * 0.72 - fx * 4.6); ctx.stroke();
    }
    // yen ağzı (dirseği örten manşet) + içindeki gölge
    put(0, el.x - ux * 1.5 - nx * 7.2 * s, el.y - uy * 1.5 - ny * 7.2 * s);
    put(1, el.x + ux * 4.4 - nx * 7 * s, el.y + uy * 4.4 - ny * 7 * s);
    put(2, el.x + ux * 5 + nx * (9.4 * s + sag), el.y + uy * 5 + ny * (9.4 * s + sag));
    put(3, el.x - ux * 1.5 + nx * (8.4 * s + sag * 0.8), el.y - uy * 1.5 + ny * (8.4 * s + sag * 0.8));
    ctx.fillStyle = clothC; ctx.beginPath(); blob(ctx, P, 4); ctx.fill();
    // yen ağzının içi (koyu) + ağız kenarında ışık
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(el.x + ux * 3.8 - nx * 5.4 * s, el.y + uy * 3.8 - ny * 5.4 * s);
    ctx.quadraticCurveTo(el.x + ux * 5.8 + nx * 2, el.y + uy * 5.8 + ny * 2, el.x + ux * 4.2 + nx * (7.6 * s + sag), el.y + uy * 4.2 + ny * (7.6 * s + sag)); ctx.stroke();
    if (front) {
      ctx.strokeStyle = D.hiA; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(el.x + ux * 2.6 - nx * 6.2 * s, el.y + uy * 2.6 - ny * 6.2 * s);
      ctx.quadraticCurveTo(el.x + ux * 4.6 + nx * 2, el.y + uy * 4.6 + ny * 2, el.x + ux * 3.2 + nx * (8.2 * s + sag), el.y + uy * 3.2 + ny * (8.2 * s + sag)); ctx.stroke();
      ctx.strokeStyle = rimC; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(el.x - ux * 1 - nx * 6.4, el.y - uy * 1 - ny * 6.4); ctx.lineTo(el.x + ux * 3.8 - nx * 6.3, el.y + uy * 3.8 - ny * 6.3); ctx.stroke();
    }
    // el
    const sd = j.dir < 0 ? -1 : 1;
    if (front) {
      if (j.hasSword && j.tip) {
        const bdx = j.tip.x - ha.x, bdy = j.tip.y - ha.y, bl = Math.hypot(bdx, bdy) || 1;
        fist(ctx, ha.x, ha.y, bdx / bl, bdy / bl, fx, fy, D, rimC, true);
      } else openHand(ctx, ha.x, ha.y, fx, fy, sd, D, rimC, true);
      return;
    }
    if (wpn.type === 'tessen' && j.hasSword) {
      // ikinci yelpaze: ön kolun uzantısında, arka elde
      const a2 = Math.atan2(ha.y - el.y, ha.x - el.x) - j.dir * 0.3;
      drawTessen(ctx, ha.x, ha.y, a2, c, j.wFanB || 0, wpn.blade * 0.94, j.dir, 0);
      fist(ctx, ha.x, ha.y, Math.cos(a2), Math.sin(a2), fx, fy, D, rimC, false);
      return;
    }
    if ((wpn.type === 'kusarigama' || (wpn.type === 'yumi' && j.wBow > 0.5)) && j.hasSword) { fist(ctx, ha.x, ha.y, fx, fy, fx, fy, D, rimC, false); return; }
    if (wpn.twin && j.hasSword) {
      // ters tutuşlu ikinci tantō: bıçak ön kol boyunca geriye uzanır
      const a2 = Math.atan2(el.y - ha.y, el.x - ha.x) + j.dir * 0.25;
      drawSword(ctx, ha.x, ha.y, a2, c, 0, wpn);
      fist(ctx, ha.x, ha.y, Math.cos(a2), Math.sin(a2), fx, fy, D, rimC, false);
      return;
    }
    if (j.hasSword && j.tip) {
      const bdx = j.tip.x - j.haF.x, bdy = j.tip.y - j.haF.y, bl = Math.hypot(bdx, bdy) || 1, hx = bdx / bl, hy = bdy / bl;
      // arka el kabzada mı? (kabza doğru parçasına uzaklık)
      const px = ha.x - j.haF.x, py = ha.y - j.haF.y, along = clamp(px * hx + py * hy, -wpn.handle, 0);
      if (Math.hypot(px - hx * along, py - hy * along) < 6) { fist(ctx, ha.x, ha.y, hx, hy, fx, fy, D, rimC, false); return; }
    }
    openHand(ctx, ha.x, ha.y, fx, fy, sd, D, rimC, false);
  }

  // Omuz zırhı (sode): omuzdan sarkan katmanlı plaka, bağcıklı
  function sode(ctx, sh, el, c, D, dim) {
    const dx = el.x - sh.x, dy = el.y - sh.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
    for (let i = 0; i < 3; i++) {
      const a = 2 + i * 7, b = a + 8.5;
      ctx.fillStyle = dim ? '#15130f' : (i % 2 ? D.armor : D.armorLt);
      ctx.beginPath();
      ctx.moveTo(sh.x + ux * a + nx * 9, sh.y + uy * a + ny * 9); ctx.lineTo(sh.x + ux * b + nx * 10.5, sh.y + uy * b + ny * 10.5);
      ctx.lineTo(sh.x + ux * b - nx * 10.5, sh.y + uy * b - ny * 10.5); ctx.lineTo(sh.x + ux * a - nx * 9, sh.y + uy * a - ny * 9); ctx.closePath();
      ctx.strokeStyle = D.line; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fill();
      if (dim) continue;
      ctx.strokeStyle = D.armorHi; ctx.lineWidth = 0.8;
      ctx.beginPath(); line(ctx, sh.x + ux * (a + 0.8) + nx * 8.6, sh.y + uy * (a + 0.8) + ny * 8.6, sh.x + ux * (a + 0.8) - nx * 8.6, sh.y + uy * (a + 0.8) - ny * 8.6); ctx.stroke();
    }
    if (dim) return;
    ctx.strokeStyle = c.accent; ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (const k of [-5, 0, 5]) line(ctx, sh.x + ux * 3 + nx * k, sh.y + uy * 3 + ny * k, sh.x + ux * 23 + nx * k * 1.15, sh.y + uy * 23 + ny * k * 1.15);
    ctx.stroke();
    ctx.strokeStyle = c.accentDark; ctx.lineWidth = 1.3;
    ctx.beginPath(); line(ctx, sh.x + ux * 24 + nx * 10.4, sh.y + uy * 24 + ny * 10.4, sh.x + ux * 24 - nx * 10.4, sh.y + uy * 24 - ny * 10.4); ctx.stroke();
  }

  // ---------------------------------------------------------------- GÖVDE
  function drawTorso(ctx, j, c, D, acc) {
    const ln = TF.ln;
    ctx.beginPath(); torsoPath(ctx);
    ctx.strokeStyle = D.line; ctx.lineWidth = 2.6; ctx.stroke();
    const cx = (j.hip.x + j.neck.x) * 0.5, cy = (j.hip.y + j.neck.y) * 0.5;
    const g = ctx.createLinearGradient(cx + LT.x * 24, cy + LT.y * 24, cx - LT.x * 20, cy - LT.y * 20);
    g.addColorStop(0, c.clothHi); g.addColorStop(0.5, c.cloth); g.addColorStop(1, c.clothDark);
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    const M = (u, n) => ctx.moveTo(PX(u, n), PY(u, n)), T = (u, n) => ctx.lineTo(PX(u, n), PY(u, n));
    const Q = (u0, n0, u1, n1) => ctx.quadraticCurveTo(PX(u0, n0), PY(u0, n0), PX(u1, n1), PY(u1, n1));
    // iç kat (V yaka; zincir zırh izi)
    ctx.fillStyle = D.inner;
    ctx.beginPath(); M(ln * 1.02, -1); Q(ln * 0.94, 5, ln * 0.62, 11.5); T(ln * 0.5, 30); T(ln * 1.3, 30); T(ln * 1.3, -1); ctx.fill();
    // yaka bandı (eri) + altındaki bindirme gölgesi
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); M(ln * 1.06, -8.5); Q(ln * 0.9, 1.5, ln * 0.58, 8.5); T(13, 12.5); ctx.stroke();
    ctx.strokeStyle = D.collar; ctx.lineWidth = 3.4;
    ctx.beginPath(); M(ln * 1.07, -6.5); Q(ln * 0.94, 3.5, ln * 0.62, 11); T(14, 15.5); ctx.stroke();
    // göğüs / sırt kütlesi, kumaş çekme kıvrımları, hakama pilileri
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    M(ln * 0.5, 4); Q(ln * 0.47, 12, ln * 0.55, 20);
    M(ln * 0.86, -7); Q(ln * 0.7, -12, ln * 0.52, -12.5);
    M(ln * 0.66, 2); Q(ln * 0.4, -2, 16, -9);
    M(ln * 0.4, 9); Q(ln * 0.3, 4, 15, 2);
    M(0, 7); T(-14, 9); M(0, -3); T(-14, -4);
    ctx.stroke();
    ctx.strokeStyle = D.hiB; ctx.lineWidth = 1.2;
    ctx.beginPath(); M(ln * 0.8, -3); Q(ln * 0.6, -7, ln * 0.38, -8); M(ln * 0.62, 6); Q(ln * 0.45, 3, ln * 0.3, 6); ctx.stroke();
    if (acc === 'kabuto') dou(ctx, c, D, ln);
    else if (acc === 'monk') kesa(ctx, c, D, ln);
    // kuşak üstü/altı gölgesi
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 3;
    ctx.beginPath(); M(-0.5, -30); T(-0.5, 30); M(12.5, -30); T(12.5, 30); ctx.stroke();
    // obi (kuşak)
    ctx.fillStyle = c.accent;
    ctx.beginPath(); M(1, -30); T(1, 30); T(11.5, 30); T(11.5, -30); ctx.fill();
    ctx.strokeStyle = D.accHi; ctx.lineWidth = 0.9;
    ctx.beginPath(); M(10.8, -30); T(10.8, 30); ctx.stroke();
    ctx.strokeStyle = D.accSh; ctx.lineWidth = 1.3;
    ctx.beginPath(); M(1.8, -30); T(1.8, 30); M(6.2, -30); T(6.2, 30); ctx.stroke();
    if (acc === 'akane') {
      // tasuki: crimson cord tying the sleeves back, crossing over the back
      ctx.strokeStyle = D.accSh; ctx.lineWidth = 3.6;
      ctx.beginPath(); M(ln * 0.98, -15); T(12, 17); M(ln * 0.9, 16); T(12, -17); ctx.stroke();
      ctx.strokeStyle = c.accent; ctx.lineWidth = 2.4;
      ctx.beginPath(); M(ln * 0.98, -15); T(12, 17); M(ln * 0.9, 16); T(12, -17); ctx.stroke();
    }
    // baş gölgesi (çene altı) + ön kolun gövdeye düşen gölgesi (AO)
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath();
    ctx.ellipse(j.neck.x + (j.head.x - j.neck.x) * 0.35 - LT.x * 3, j.neck.y + (j.head.y - j.neck.y) * 0.35 + 5, 12, 8, 0, 0, TAU);
    const ox = -LT.x * 4, oy = 4;
    capPath(ctx, j.sh.x + ox, j.sh.y + oy, j.elF.x + ox, j.elF.y + oy, 8.5, 8);
    capPath(ctx, j.elF.x + ox, j.elF.y + oy, j.haF.x + ox, j.haF.y + oy, 6, 5.5);
    ctx.fill();
    // iç kenar ışığı: ışıktan uzağa kaydırılmış konturun kırpılmış çizgisi
    ctx.translate(-LT.x * 1.6, -LT.y * 1.6);
    ctx.beginPath(); torsoPath(ctx);
    ctx.strokeStyle = c.rim; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.restore();
    // arkada kuşak düğümü
    const kx = PX(6.5, -16.5), ky = PY(6.5, -16.5);
    if (acc === 'mai') { obiBow(ctx, c, D, kx, ky); return; }
    ctx.fillStyle = c.accentDark; ctx.strokeStyle = D.line; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(kx, ky, 4.8, 3.8, Math.atan2(TF.uy, TF.ux), 0, TAU); ctx.stroke(); ctx.fill();
    ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(kx, ky, 2, 0, TAU); ctx.fill();
  }
  // Kesa: omuzdan kalçaya çapraz inen yamalı keşiş şalı (gövdeye kırpılmış)
  function kesa(ctx, c, D, ln) {
    const M = (u, n) => ctx.moveTo(PX(u, n), PY(u, n)), T = (u, n) => ctx.lineTo(PX(u, n), PY(u, n));
    ctx.fillStyle = c.accent;
    ctx.beginPath(); M(ln * 1.12, -22); T(ln * 1.12, -7); T(-4, 25); T(-4, 9); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = D.accSh; ctx.lineWidth = 1.2;
    ctx.beginPath(); M(ln * 1.12, -22); T(-4, 9); M(ln * 1.12, -7); T(-4, 25); ctx.stroke();
    // yama dikişleri
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 0.9; ctx.beginPath();
    for (let k = 1; k < 6; k++) { const f = k / 6, u = ln * 1.12 + (-4 - ln * 1.12) * f, n = -14.5 + 31.5 * f; M(u + 3, n - 7); T(u - 3, n + 7); }
    ctx.stroke();
    ctx.strokeStyle = D.accHi; ctx.lineWidth = 0.8;
    ctx.beginPath(); M(ln * 1.1, -20.5); T(-3, 10.5); ctx.stroke();
  }
  // Juzu: boyna dolanan tespih ve göğüste büyük boncuk (püskül ipi fighter.js'te)
  function juzu(ctx, j, c, D) {
    const ln = TF.ln;
    ctx.fillStyle = '#3b2618'; ctx.strokeStyle = D.line; ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const f = i / 10, a = Math.PI * f, u = ln * 0.99 - Math.sin(a) * ln * 0.36, n = -6 + 13.5 * f + Math.sin(a) * 6;
      const x = PX(u, n), y = PY(u, n);
      ctx.moveTo(x + 2.4, y); ctx.arc(x, y, 2.4, 0, TAU);
    }
    ctx.stroke(); ctx.fill();
    const bx = PX(ln * 0.6, 9.5), by = PY(ln * 0.6, 9.5);
    ctx.fillStyle = c.accentDark; ctx.beginPath(); ctx.arc(bx, by, 3.4, 0, TAU); ctx.stroke(); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,190,.5)'; ctx.beginPath();
    for (let i = 0; i <= 10; i += 2) {
      const f = i / 10, a = Math.PI * f, u = ln * 0.99 - Math.sin(a) * ln * 0.36, n = -6 + 13.5 * f + Math.sin(a) * 6;
      const x = PX(u, n) + LT.x * 0.9, y = PY(u, n) + LT.y * 0.9; ctx.moveTo(x + 0.8, y); ctx.arc(x, y, 0.8, 0, TAU);
    }
    ctx.moveTo(bx + LT.x * 1.2 + 1.1, by + LT.y * 1.2); ctx.arc(bx + LT.x * 1.2, by + LT.y * 1.2, 1.1, 0, TAU);
    ctx.fill();
  }
  // Kunoichi dansçının büyük kelebek obi fiyongu
  function obiBow(ctx, c, D, kx, ky) {
    const a = Math.atan2(TF.uy, TF.ux), bx = -TF.nx, by = -TF.ny, sg = TF.nx < 0 ? -1 : 1;
    ctx.fillStyle = c.accentDark; ctx.strokeStyle = D.line; ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(kx + TF.ux * 7 + bx * 5, ky + TF.uy * 7 + by * 5, 8.5, 4.6, a + 0.5 * sg, 0, TAU);
    ctx.moveTo(kx - TF.ux * 6 + bx * 5 + 8, ky - TF.uy * 6 + by * 5);
    ctx.ellipse(kx - TF.ux * 6 + bx * 5, ky - TF.uy * 6 + by * 5, 8, 4.2, a - 0.5 * sg, 0, TAU);
    ctx.stroke(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(kx + bx * 3, ky + by * 3); ctx.lineTo(kx + TF.ux * 11 + bx * 7, ky + TF.uy * 11 + by * 7);
    ctx.moveTo(kx + bx * 3, ky + by * 3); ctx.lineTo(kx - TF.ux * 10 + bx * 7, ky - TF.uy * 10 + by * 7); ctx.stroke();
    ctx.fillStyle = c.accent; ctx.beginPath(); ctx.ellipse(kx + bx * 2, ky + by * 2, 4.2, 3.4, a, 0, TAU); ctx.stroke(); ctx.fill();
    ctx.fillStyle = D.accHi; ctx.beginPath(); ctx.arc(kx + bx * 2 + LT.x, ky + by * 2 + LT.y, 1.2, 0, TAU); ctx.fill();
  }

  // Göğüs zırhı (dō): gövdeye kırpılmış yatay plakalar, bağcıklar ve lake parlaması
  function dou(ctx, c, D, ln) {
    const M = (u, n) => ctx.moveTo(PX(u, n), PY(u, n)), T = (u, n) => ctx.lineTo(PX(u, n), PY(u, n));
    const u0 = 12, u1 = ln * 0.88, n = 5, h = (u1 - u0) / n;
    ctx.fillStyle = D.armor;
    ctx.beginPath(); M(u0, -30); T(u0, 30); T(u1, 30); T(u1, -30); ctx.fill();
    ctx.fillStyle = D.armorLt;
    ctx.beginPath(); M(u1, -30); T(u1, 30); T(ln * 0.98, 30); T(ln * 0.98, -30); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); for (let i = 1; i <= n; i++) { M(u0 + h * i - 0.8, -30); T(u0 + h * i - 0.8, 30); } ctx.stroke();
    ctx.strokeStyle = D.armorHi; ctx.lineWidth = 0.8;
    ctx.beginPath(); for (let i = 1; i <= n; i++) { M(u0 + h * i, -30); T(u0 + h * i, 30); } ctx.stroke();
    ctx.strokeStyle = c.accent; ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let i = 0; i < n; i++) for (let k = -10; k <= 14; k += 8) { M(u0 + h * i + 1, k); T(u0 + h * i + h - 2, k + 0.6); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,244,220,.13)';
    const cx = PX(ln * 0.62, 0) + LT.x * 9, cy = PY(ln * 0.62, 0) + LT.y * 6;
    ctx.beginPath(); ctx.ellipse(cx, cy, 5, 11, Math.atan2(TF.uy, TF.ux), 0, TAU); ctx.fill();
  }
  // Etek plakaları (kusazuri): kuşaktan kalçaya sarkar
  function kusazuri(ctx, c, D) {
    const P = (u, n) => [PX(u, n), PY(u, n)];
    const plates = [[-16, -6, 5, D.armorDk], [5, 15, 4, D.armor], [-7, 7, 3, D.armorLt]];
    for (const [n0, n1, fl, col] of plates) {
      const a = P(2, n0), b = P(2, n1), cc = P(-19, n1 + fl), d = P(-19, n0 - fl * 0.4), m = P(-21, (n0 + n1) / 2 + fl * 0.3);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(cc[0], cc[1]); ctx.quadraticCurveTo(m[0], m[1], d[0], d[1]); ctx.closePath();
      ctx.strokeStyle = D.line; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = col; ctx.fill();
      ctx.beginPath();
      for (const u of [-5, -12]) { const e = P(u, n0 - 0.3), f = P(u, n1 + fl * 0.4); ctx.moveTo(e[0], e[1]); ctx.lineTo(f[0], f[1]); }
      ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath();
      for (const u of [-4.3, -11.3]) { const e = P(u, n0 - 0.3), f = P(u, n1 + fl * 0.4); ctx.moveTo(e[0], e[1]); ctx.lineTo(f[0], f[1]); }
      ctx.strokeStyle = D.armorHi; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(d[0], d[1]); ctx.quadraticCurveTo(m[0], m[1], cc[0], cc[1]);
      ctx.strokeStyle = c.accent; ctx.lineWidth = 1.1; ctx.stroke();
    }
  }

  // Sırttaki kın (saya): lake, ağız halkası, sageo kordonu, uç başlığı
  function saya(ctx, j, c, D, wpn) {
    const bx = -TF.nx, by = -TF.ny, ux = TF.ux, uy = TF.uy, sl = (wpn.blade + wpn.handle) / 120;
    const x0 = j.sh.x + bx * 2 + ux * 16 * sl, y0 = j.sh.y + by * 2 + uy * 16 * sl;
    const x1 = j.hip.x + bx * 40 - ux * 36 * sl, y1 = j.hip.y + by * 40 - uy * 36 * sl;
    const dx = x1 - x0, dy = y1 - y0, dl = Math.hypot(dx, dy) || 1, tx = dx / dl, ty = dy / dl;
    ctx.lineCap = 'round';
    ctx.strokeStyle = D.line; ctx.lineWidth = 6.6;
    ctx.beginPath(); line(ctx, x0, y0, x1, y1); ctx.stroke();
    ctx.strokeStyle = '#141116'; ctx.lineWidth = 4.4;
    ctx.beginPath(); line(ctx, x0, y0, x1, y1); ctx.stroke();
    let nx = -ty, ny = tx; if (nx * LT.x + ny * LT.y < 0) { nx = -nx; ny = -ny; }
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); line(ctx, x0 + nx * 1.3 + tx * 4, y0 + ny * 1.3 + ty * 4, x1 + nx * 1.3 - tx * 4, y1 + ny * 1.3 - ty * 4); ctx.stroke();
    ctx.strokeStyle = '#3b3530'; ctx.lineWidth = 4.8;
    ctx.beginPath(); line(ctx, x1 - tx * 5, y1 - ty * 5, x1, y1); line(ctx, x0, y0, x0 + tx * 2.5, y0 + ty * 2.5); ctx.stroke();
    ctx.strokeStyle = c.accent; ctx.lineWidth = 4.8;
    ctx.beginPath(); line(ctx, x0 + tx * 9, y0 + ty * 9, x0 + tx * 11.5, y0 + ty * 11.5); ctx.stroke();
  }

  // Iai: scabbard thrust through the obi at the hip (koshi-zashi). Sheathed (j.wSheath) it follows the blade line
  // from the hand, so a pommel strike carries the whole sword; drawn, it rests back and down from the belt.
  function sayaHip(ctx, j, c, D, wpn) {
    let x0, y0, tx, ty;
    const L0 = wpn.blade + 6;
    if (j.wSheath && j.tip) {
      const dx = j.tip.x - j.haF.x, dy = j.tip.y - j.haF.y, dl = Math.hypot(dx, dy) || 1;
      tx = dx / dl; ty = dy / dl; x0 = j.haF.x + tx * 2; y0 = j.haF.y + ty * 2;
    } else {
      x0 = PX(5, 13); y0 = PY(5, 13);
      // rest direction: back and 0.3 rad down, mirrored by the (possibly fractional) facing
      tx = -0.955 * j.dir; ty = 0.296;
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    }
    const x1 = x0 + tx * L0, y1 = y0 + ty * L0;
    ctx.lineCap = 'round';
    ctx.strokeStyle = D.line; ctx.lineWidth = 7;
    ctx.beginPath(); line(ctx, x0, y0, x1, y1); ctx.stroke();
    ctx.strokeStyle = '#1a0f10'; ctx.lineWidth = 4.8;
    ctx.beginPath(); line(ctx, x0, y0, x1, y1); ctx.stroke();
    let nx = -ty, ny = tx; if (nx * LT.x + ny * LT.y < 0) { nx = -nx; ny = -ny; }
    ctx.strokeStyle = 'rgba(255,120,110,.22)'; ctx.lineWidth = 0.9; // red lacquer sheen
    ctx.beginPath(); line(ctx, x0 + nx * 1.4 + tx * 5, y0 + ny * 1.4 + ty * 5, x1 + nx * 1.4 - tx * 5, y1 + ny * 1.4 - ty * 5); ctx.stroke();
    ctx.strokeStyle = '#3b3530'; ctx.lineWidth = 5;
    ctx.beginPath(); line(ctx, x1 - tx * 5, y1 - ty * 5, x1, y1); line(ctx, x0, y0, x0 + tx * 2.5, y0 + ty * 2.5); ctx.stroke();
    // sageo cord looping from the scabbard to the belt
    ctx.strokeStyle = c.accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0 + tx * 10, y0 + ty * 10); ctx.quadraticCurveTo(x0 + tx * 16 + nx * 7, y0 + ty * 16 + ny * 7, x0 + tx * 24 + nx * 3, y0 + ty * 24 + ny * 3); ctx.stroke();
  }

  // ---------------------------------------------------------------- BAŞ
  const JAW = [0.3, -5, 0.95, -4.6, 1.07, 1, 1.2, 3.9, 1.0, 6, 1.02, 8.4, 0.7, 12.6, 0.05, 11.5, -0.3, 4];
  function headPath(ctx, R) {
    ctx.ellipse(-0.5, -0.6, R * 1.02, R * 1.06, 0, 0, TAU);
    for (let i = 0; i < 9; i++) { BUF[i * 2] = JAW[i * 2] * R; BUF[i * 2 + 1] = JAW[i * 2 + 1]; }
    blob(ctx, BUF, 9);
  }
  function eye(ctx, D, x, y) {
    ctx.fillStyle = '#e6e0d6';
    ctx.beginPath(); ctx.moveTo(x - 2.9, y + 0.2); ctx.quadraticCurveTo(x - 0.2, y - 2.1, x + 2.7, y - 0.4); ctx.quadraticCurveTo(x + 0.2, y + 1.7, x - 2.9, y + 0.2); ctx.fill();
    ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.arc(x + 0.9, y - 0.3, 1.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#050404'; ctx.beginPath(); ctx.arc(x + 1.05, y - 0.3, 0.65, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 0.5, y - 0.85, 0.45, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#0d0907'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(x - 3.1, y + 0.15); ctx.quadraticCurveTo(x - 0.2, y - 2.35, x + 2.9, y - 0.5); ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - 3.3, y - 3.1); ctx.lineTo(x + 3.1, y - 2.2); ctx.stroke();
  }

  function drawHead(ctx, j, c, D, acc) {
    const h = j.head, dir = j.dir, sd = dir < 0 ? -1 : 1, R = L.headR, ang = j.hang + HP;
    ctx.save();
    ctx.translate(h.x, h.y); ctx.rotate(ang); ctx.scale(dir, 1);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const lx = (LT.x * ca + LT.y * sa) * sd, ly = -LT.x * sa + LT.y * ca;
    const hood = acc === 'hood', oni = acc === 'oni', kasa = acc === 'kasa';
    if (acc === 'monk') { headMonk(ctx, c, D, R, lx, ly); ctx.restore(); return; }
    if (acc === 'akane') { headAkane(ctx, c, D, R, lx, ly); ctx.restore(); return; }
    // kafa + yüz profili (kapüşon/maske kumaşı)
    ctx.beginPath(); headPath(ctx, R);
    ctx.strokeStyle = D.line; ctx.lineWidth = 2.4; ctx.stroke();
    const g = ctx.createRadialGradient(lx * R * 0.5, ly * R * 0.5 - 1, 1, lx * R * 0.2, ly * R * 0.2, R * 1.45);
    const hc = c.hood || c; // c.hood: separate hood/mask cloth (a light coat over a dark hood)
    g.addColorStop(0, hc.clothHi); g.addColorStop(0.55, hc.cloth); g.addColorStop(1, hc.clothDark);
    ctx.fillStyle = g; ctx.fill();
    // kenar ışığı: kafatasının aydınlık tarafında ince yay
    const la = Math.atan2(ly, lx);
    ctx.strokeStyle = c.rim; ctx.lineWidth = 1.9;
    ctx.beginPath(); ctx.ellipse(-0.5, -0.6, R * 1.02 - 1, R * 1.06 - 1, 0, la - 1.2, la + 1.2); ctx.stroke();
    if (!oni) {
      const EX = R * 0.68, EY = -2.6;
      // göz yarığı (yüz profilinin içinde kalır)
      ctx.fillStyle = hood ? '#060608' : c.skin;
      ctx.beginPath(); ctx.moveTo(-1, -5.3); ctx.quadraticCurveTo(R * 0.5, -6.4, R * 0.86, -6.0); ctx.lineTo(R * 0.97, -0.1); ctx.quadraticCurveTo(R * 0.6, 0.7, -1, -0.4); ctx.closePath(); ctx.fill();
      if (!hood) {
        ctx.fillStyle = D.skinSh;
        ctx.beginPath(); ctx.moveTo(-1, -0.4); ctx.quadraticCurveTo(R * 0.3, 0.2, R * 0.42, -2.8); ctx.quadraticCurveTo(R * 0.2, -4.8, -1, -5.3); ctx.fill();
        eye(ctx, D, EX, EY);
      }
      // kaş gölgesi (kapüşon kenarı yarığa gölge düşürür)
      ctx.fillStyle = 'rgba(0,0,0,.38)';
      ctx.beginPath(); ctx.moveTo(-1, -5.4); ctx.quadraticCurveTo(R * 0.5, -6.5, R * 0.86, -6.1); ctx.lineTo(R * 0.9, -4.4); ctx.quadraticCurveTo(R * 0.5, -4.3, -1, -3.7); ctx.fill();
      // yarık kenarı (kapüşon kumaşının kıvrık ağzı)
      ctx.strokeStyle = (c.hood || c).clothHi; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(-1, -5.7); ctx.quadraticCurveTo(R * 0.5, -6.8, R * 0.87, -6.4); ctx.stroke();
      // maske kıvrımları + burun sırtı
      ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(R * 0.98, 2.2); ctx.quadraticCurveTo(R * 0.55, 4.6, R * 0.05, 3);
      ctx.moveTo(R * 0.92, 6.6); ctx.quadraticCurveTo(R * 0.55, 8.4, R * 0.15, 7.6);
      ctx.moveTo(R * 0.78, 10.4); ctx.quadraticCurveTo(R * 0.5, 10.8, R * 0.3, 10.2);
      ctx.stroke();
      ctx.strokeStyle = D.hiA; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(R * 1.0, 0.8); ctx.quadraticCurveTo(R * 1.1, 2.4, R * 1.1, 3.6); ctx.stroke();
      if (kasa) {
        // şapka gölgesi kafatasının üst yarısına düşer; gözde tek bir parıltı kalır
        ctx.fillStyle = 'rgba(0,0,0,.45)';
        ctx.beginPath(); ctx.ellipse(-0.5, -0.6, R * 1.02, R * 1.06, 0, Math.PI + 0.13, TAU - 0.13); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,250,240,.9)'; ctx.beginPath(); ctx.arc(EX + 0.5, EY - 0.85, 0.5, 0, TAU); ctx.fill();
      }
    }
    ctx.lineCap = 'round';
    if (kasa) headKasa(ctx, c, D, R, lx);
    else if (acc === 'ponytail') headPonytail(ctx, c, D, R, lx);
    else if (hood) headHood(ctx, c, D, R);
    else if (oni) headOni(ctx, c, D, R, lx, ly);
    else if (acc === 'kabuto') headKabuto(ctx, c, D, R, lx);
    else if (acc === 'tora') headTora(ctx, c, D, R, lx);
    else if (acc === 'mai') headMai(ctx, c, D, R, lx);
    else if (acc === 'tsubame') headTsubame(ctx, c, D, R, lx);
    else if (acc === 'aoi') headAoi(ctx, c, D, R, lx);
    else headBand(ctx, c, D, R, acc !== 'scarf');
    ctx.restore();
  }

  // TORA: diken diken yele, kaplan çizgili alın bandı
  function headTora(ctx, c, D, R, lx) {
    ctx.fillStyle = '#26190f'; ctx.strokeStyle = D.line; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(R * 0.62, -R * 0.74);
    for (let i = 0; i <= 8; i++) {
      const a = -1.2 - i * 0.29, sp = i % 2 === 0;
      const r = sp ? R * (1.34 + 0.1 * Math.sin(i * 2.1)) : R * 0.96;
      const x = Math.cos(a) * r - 1 - (sp ? R * 0.18 : 0), y = Math.sin(a) * r * 0.96 - 2;
      if (sp) ctx.quadraticCurveTo(Math.cos(a + 0.12) * r * 0.9 - 1, Math.sin(a + 0.12) * r * 0.86 - 2, x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(-R * 0.86, R * 0.4); ctx.lineTo(-R * 0.2, -R * 0.2); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.strokeStyle = 'rgba(200,150,90,.25)'; ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let i = 0; i <= 8; i += 2) { const a = -1.2 - i * 0.29; ctx.moveTo(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5 - 2); ctx.lineTo(Math.cos(a) * R * 1.2 - 1 - R * 0.15, Math.sin(a) * R * 1.15 - 2); }
    ctx.stroke();
    headBand(ctx, c, D, R, false, true);
    // kaplan çizgileri
    ctx.fillStyle = '#16100b';
    ctx.beginPath();
    for (let k = 0; k < 3; k++) { const x0 = R * (-0.62 + k * 0.54); ctx.moveTo(x0, -9.9); ctx.lineTo(x0 + 3.2, -9.6); ctx.lineTo(x0 + 0.6, -6.9); ctx.lineTo(x0 + 2.2, -5.6); ctx.lineTo(x0 - 1.6, -5.8); ctx.closePath(); }
    ctx.fill();
  }

  // JIN: tıraşlı baş, açık yüz (kaş, göz, burun, ağız), kulak; ışık tarafında kafa parlaması
  function headMonk(ctx, c, D, R, lx, ly) {
    const sk = c.skin || '#c89c81';
    ctx.beginPath(); headPath(ctx, R);
    ctx.strokeStyle = D.line; ctx.lineWidth = 2.4; ctx.stroke();
    const g = ctx.createRadialGradient(lx * R * 0.45, ly * R * 0.45 - 1, 1, lx * R * 0.1, ly * R * 0.1, R * 1.5);
    g.addColorStop(0, D.skinHi); g.addColorStop(0.5, sk); g.addColorStop(1, D.skinSh);
    ctx.fillStyle = g; ctx.fill();
    // tıraş izi + kafa parlaması
    ctx.fillStyle = 'rgba(60,40,36,.16)';
    ctx.beginPath(); ctx.ellipse(-1.5, -3, R * 0.98, R * 0.8, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,245,230,.4)';
    ctx.beginPath(); ctx.ellipse(lx * R * 0.35 - 0.5, -R * 0.62, R * 0.32, R * 0.14, lx * 0.5, 0, TAU); ctx.fill();
    const la = Math.atan2(ly, lx);
    ctx.strokeStyle = c.rim; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(-0.5, -0.6, R * 1.02 - 1, R * 1.06 - 1, 0, la - 1.1, la + 1.1); ctx.stroke();
    // kulak
    ctx.fillStyle = D.skinMd; ctx.strokeStyle = D.skinSh; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.ellipse(-R * 0.18, 0.2, 2.5, 3.8, 0.15, 0, TAU); ctx.stroke(); ctx.fill();
    ctx.strokeStyle = 'rgba(70,35,25,.6)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.ellipse(-R * 0.16, 0.4, 1.2, 2.3, 0.15, -1.2, 1.9); ctx.stroke();
    // göz çukuru gölgesi + göz + kalın kaş
    ctx.fillStyle = 'rgba(70,35,25,.25)';
    ctx.beginPath(); ctx.ellipse(R * 0.66, -2.8, 4.2, 2.6, -0.1, 0, TAU); ctx.fill();
    eye(ctx, D, R * 0.68, -2.6);
    ctx.strokeStyle = '#1a120e'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(R * 0.36, -5.9); ctx.quadraticCurveTo(R * 0.7, -7.2, R * 0.98, -5.8); ctx.stroke();
    // burun, ağız, çene çizgisi
    ctx.strokeStyle = D.skinSh; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(R * 0.99, -1.8); ctx.quadraticCurveTo(R * 1.2, 1.6, R * 1.02, 2.9); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,24,18,.75)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(R * 0.62, 6.4); ctx.quadraticCurveTo(R * 0.82, 6.9, R * 0.98, 6.1); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,30,24,.28)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(R * 0.1, 7.5); ctx.quadraticCurveTo(R * 0.4, 11.4, R * 0.78, 11); ctx.stroke();
    // alında üç nokta (adak izi)
    ctx.fillStyle = 'rgba(90,40,30,.45)';
    ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(R * (0.35 + k * 0.2) + 0.7, -R * 0.78 + k * 0.4); ctx.arc(R * (0.35 + k * 0.2), -R * 0.78 + k * 0.4, 0.7, 0, TAU); } ctx.fill();
  }

  // MAI: topuz saç, kanzashi tokaları (sarkan süsler), çiçek
  function headMai(ctx, c, D, R, lx) {
    ctx.fillStyle = '#0d0a0c'; ctx.strokeStyle = D.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(-1.5, -4.2, R * 1.06, R * 0.86, -0.15, Math.PI * 0.95, Math.PI * 2.05); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(R * 0.2, -R * 0.87); ctx.quadraticCurveTo(R * 1.08, -R * 0.72, R * 1.06, -4); ctx.lineTo(R * 0.55, -5.5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-R * 0.95, -R * 0.2); ctx.quadraticCurveTo(-R * 1.2, R * 0.5, -R * 0.8, R * 0.9); ctx.lineTo(-R * 0.62, R * 0.1); ctx.closePath(); ctx.fill();
    // topuz
    ctx.beginPath(); ctx.ellipse(-R * 0.62, -R * 1.02, R * 0.5, R * 0.4, -0.5, 0, TAU); ctx.stroke(); ctx.fill();
    ctx.strokeStyle = 'rgba(160,150,180,.3)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.ellipse(-R * 0.62, -R * 1.02, R * 0.34, R * 0.24, -0.5, 3.4, 5.6); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1.3;
    const s = lx >= 0 ? 0.3 : -0.3;
    ctx.beginPath(); ctx.ellipse(-1.5, -4.2, R * 0.9, R * 0.7, -0.15, Math.PI * (1.45 + s), Math.PI * (1.75 + s)); ctx.stroke();
    // kanzashi: iki altın toka + sarkan süs
    ctx.strokeStyle = '#d9b55c'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-R * 0.05, -R * 1.5); ctx.lineTo(-R * 1.25, -R * 0.62); ctx.moveTo(-R * 0.3, -R * 1.62); ctx.lineTo(-R * 1.05, -R * 0.45); ctx.stroke();
    const sw = Math.sin((ND.scene ? ND.scene.t : 0) * 3.1) * 1.2;
    ctx.strokeStyle = 'rgba(217,181,92,.8)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(-R * 1.25, -R * 0.62); ctx.lineTo(-R * 1.28 + sw, -R * 0.62 + 7); ctx.moveTo(-R * 1.18, -R * 0.66); ctx.lineTo(-R * 1.16 + sw, -R * 0.66 + 9); ctx.stroke();
    ctx.fillStyle = c.accent; ctx.beginPath();
    ctx.moveTo(-R * 1.28 + sw + 1.3, -R * 0.62 + 7.5); ctx.arc(-R * 1.28 + sw, -R * 0.62 + 7.5, 1.3, 0, TAU);
    ctx.moveTo(-R * 1.16 + sw + 1.1, -R * 0.66 + 9.6); ctx.arc(-R * 1.16 + sw, -R * 0.66 + 9.6, 1.1, 0, TAU);
    ctx.fill();
    // çiçek
    const fx0 = -R * 0.12, fy0 = -R * 1.12;
    ctx.fillStyle = c.accent; ctx.beginPath();
    for (let k = 0; k < 5; k++) { const a = k * 1.2566 + 0.3, x = fx0 + Math.cos(a) * 2.2, y = fy0 + Math.sin(a) * 2.2; ctx.moveTo(x + 1.7, y); ctx.arc(x, y, 1.7, 0, TAU); }
    ctx.fill();
    ctx.fillStyle = D.accHi; ctx.beginPath(); ctx.arc(fx0, fy0, 1.1, 0, TAU); ctx.fill();
  }

  // AKANE: bare face (onna-bugeisha), hair gathered low at the nape with a crimson ribbon; the long tail and the
  // ribbon ends are cloth ropes (fighter.solve)
  function headAkane(ctx, c, D, R, lx, ly) {
    const sk = c.skin || '#c89c81';
    ctx.beginPath(); headPath(ctx, R);
    ctx.strokeStyle = D.line; ctx.lineWidth = 2.2; ctx.stroke();
    const g = ctx.createRadialGradient(lx * R * 0.45, ly * R * 0.45 - 1, 1, lx * R * 0.1, ly * R * 0.1, R * 1.5);
    g.addColorStop(0, D.skinHi); g.addColorStop(0.5, sk); g.addColorStop(1, D.skinSh);
    ctx.fillStyle = g; ctx.fill();
    // eye, brow, nose, lips
    ctx.fillStyle = 'rgba(70,35,25,.2)';
    ctx.beginPath(); ctx.ellipse(R * 0.66, -2.8, 4, 2.4, -0.1, 0, TAU); ctx.fill();
    eye(ctx, D, R * 0.68, -2.6);
    ctx.strokeStyle = '#140c0a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(R * 0.42, -6.2); ctx.quadraticCurveTo(R * 0.72, -7.2, R * 0.98, -6.3); ctx.stroke();
    ctx.strokeStyle = D.skinSh; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(R * 1.0, -1.6); ctx.quadraticCurveTo(R * 1.17, 1.4, R * 1.0, 2.6); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,40,40,.8)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(R * 0.7, 6.2); ctx.quadraticCurveTo(R * 0.86, 6.7, R * 0.98, 6.0); ctx.stroke();
    // hair mass: crown and back, fringe over the brow, side lock framing the face
    ctx.fillStyle = '#0d0a0b'; ctx.strokeStyle = D.line; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(R * 1.02, -5.2);
    ctx.quadraticCurveTo(R * 1.02, -R * 1.2, -R * 0.2, -R * 1.16);
    ctx.quadraticCurveTo(-R * 1.28, -R * 0.9, -R * 1.18, R * 0.35);
    ctx.quadraticCurveTo(-R * 0.9, R * 0.75, -R * 0.52, R * 0.5);
    ctx.quadraticCurveTo(-R * 0.35, -R * 0.2, R * 0.2, -R * 0.52);
    ctx.quadraticCurveTo(R * 0.62, -R * 0.5, R * 1.02, -5.2);
    ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(R * 0.26, -R * 0.58); ctx.quadraticCurveTo(R * 0.46, R * 0.1, R * 0.3, R * 0.62); ctx.quadraticCurveTo(R * 0.14, R * 0.1, R * 0.06, -R * 0.48); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(R * 0.5, -R * 0.8); ctx.quadraticCurveTo(R * 1.02, -R * 0.62, R * 0.94, -3.8); ctx.quadraticCurveTo(R * 0.8, -R * 0.52, R * 0.36, -R * 0.62); ctx.fill();
    ctx.strokeStyle = 'rgba(160,150,175,.28)'; ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let k = 0; k < 4; k++) { ctx.moveTo(R * (0.8 - k * 0.14), -R * (0.8 + k * 0.05)); ctx.quadraticCurveTo(-R * 0.2 * k, -R * (1.05 - k * 0.03), -R * (0.9 + k * 0.05), -R * (0.3 - k * 0.12)); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.17)'; ctx.lineWidth = 1.3;
    const s = lx >= 0 ? 0.3 : -0.3;
    ctx.beginPath(); ctx.ellipse(-1.5, -3.6, R * 0.92, R * 0.78, -0.15, Math.PI * (1.45 + s), Math.PI * (1.75 + s)); ctx.stroke();
    // crimson ribbon knot at the nape
    ctx.fillStyle = c.accent; ctx.strokeStyle = D.line; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.ellipse(-R * 1.12, R * 0.2, 3.2, 1.9, -0.9, 0, TAU); ctx.ellipse(-R * 1.0, R * 0.62, 3, 1.8, 0.7, 0, TAU); ctx.stroke(); ctx.fill();
    ctx.fillStyle = D.accSh; ctx.beginPath(); ctx.arc(-R * 1.05, R * 0.4, 1.6, 0, TAU); ctx.fill();
  }

  // AOI: masked head with a tall tied topknot (chasen-mage) bound by a blue cord; no headband
  function headAoi(ctx, c, D, R, lx) {
    ctx.fillStyle = '#0e0c10'; ctx.strokeStyle = D.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(-1.4, -5.2, R * 1.0, R * 0.72, -0.12, Math.PI * 1.0, Math.PI * 2.0); ctx.closePath(); ctx.stroke(); ctx.fill();
    // bound stem rising up and back, flared brush at the end
    ctx.beginPath();
    ctx.moveTo(-R * 0.55, -R * 0.95); ctx.lineTo(-R * 0.62, -R * 1.62); ctx.lineTo(-R * 0.18, -R * 1.66); ctx.lineTo(-R * 0.08, -R * 1.02); ctx.closePath();
    ctx.stroke(); ctx.fill();
    const sw = Math.sin((ND.scene ? ND.scene.t : 0) * 2.4) * 0.8;
    ctx.beginPath();
    ctx.moveTo(-R * 0.66, -R * 1.6);
    ctx.quadraticCurveTo(-R * 1.1 + sw, -R * 2.3, -R * 1.62 + sw, -R * 2.2);
    ctx.quadraticCurveTo(-R * 1.1 + sw, -R * 2.02, -R * 0.9 + sw * 0.5, -R * 1.72);
    ctx.quadraticCurveTo(-R * 0.62, -R * 2.28, -R * 0.1 + sw * 0.3, -R * 2.34);
    ctx.quadraticCurveTo(-R * 0.34, -R * 1.98, -R * 0.14, -R * 1.64);
    ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.strokeStyle = 'rgba(160,170,200,.3)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(-R * 0.5, -R * 1.7); ctx.quadraticCurveTo(-R * 0.9, -R * 2.1, -R * 1.4 + sw, -R * 2.16); ctx.moveTo(-R * 0.36, -R * 1.72); ctx.quadraticCurveTo(-R * 0.4, -R * 2.1, -R * 0.2 + sw * 0.3, -R * 2.26); ctx.stroke();
    ctx.strokeStyle = c.accent; ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let k = 0; k < 3; k++) { const u = 1.12 + k * 0.17; ctx.moveTo(-R * (0.6 + k * 0.02), -R * u); ctx.lineTo(-R * (0.1 - k * 0.02), -R * (u + 0.05)); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1.2;
    const s = lx >= 0 ? 0.3 : -0.3;
    ctx.beginPath(); ctx.ellipse(-1.4, -5.2, R * 0.86, R * 0.58, -0.12, Math.PI * (1.45 + s), Math.PI * (1.75 + s)); ctx.stroke();
  }

  // TSUBAME: tepe topuzu, bant, düğümde tüy (uzun çatal kurdeleler ipte)
  function headTsubame(ctx, c, D, R, lx) {
    ctx.fillStyle = '#100c0d'; ctx.strokeStyle = D.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(-1.2, -4.8, R * 1.04, R * 0.8, -0.1, Math.PI * 0.98, Math.PI * 2.02); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-R * 0.35, -R * 1.2, R * 0.3, R * 0.2, -0.3, 0, TAU); ctx.stroke(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-R * 0.55, -R * 1.25); ctx.quadraticCurveTo(-R * 1.05, -R * 1.45, -R * 1.25, -R * 1.05); ctx.quadraticCurveTo(-R * 0.95, -R * 1.2, -R * 0.5, -R * 1.1); ctx.closePath(); ctx.fill();
    headBand(ctx, c, D, R, false, true);
    // tüy
    ctx.fillStyle = '#ece6da'; ctx.strokeStyle = D.line; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(-R - 0.5, -8.5); ctx.quadraticCurveTo(-R * 1.9, -R * 1.5, -R * 2.3, -R * 1.9); ctx.quadraticCurveTo(-R * 1.6, -R * 1.2, -R - 0.2, -6.4); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.moveTo(-R - 0.4, -7.6); ctx.quadraticCurveTo(-R * 1.7, -R * 1.35, -R * 2.2, -R * 1.85); ctx.stroke();
    ctx.fillStyle = c.accent; ctx.beginPath(); ctx.moveTo(-R * 2.3, -R * 1.9); ctx.lineTo(-R * 2.0, -R * 1.62); ctx.lineTo(-R * 2.14, -R * 1.86); ctx.closePath(); ctx.fill();
  }

  // hachimaki: alın bandı, alın plakası (hitai-ate) ve arkada düğüm
  function headBand(ctx, c, D, R, plate, noTails) {
    ctx.fillStyle = c.accent; ctx.strokeStyle = D.line; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-R - 0.8, -8.8); ctx.quadraticCurveTo(0, -10.6, R + 0.7, -9.5); ctx.lineTo(R + 1, -5.9);
    ctx.quadraticCurveTo(0, -6.8, -R - 0.8, -5.3); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.strokeStyle = D.accHi; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-R * 0.6, -9.3); ctx.quadraticCurveTo(0, -10.1, R * 0.8, -9.3); ctx.stroke();
    ctx.strokeStyle = D.accSh; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-R, -5.6); ctx.quadraticCurveTo(0, -6.9, R + 0.8, -6.2); ctx.stroke();
    if (plate) {
      ctx.fillStyle = '#7d8591'; ctx.strokeStyle = '#1a1b20'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(R * 0.36, -9.9); ctx.lineTo(R * 1.0, -9.6); ctx.lineTo(R * 1.02, -6.1); ctx.lineTo(R * 0.36, -6.5); ctx.closePath(); ctx.stroke(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(R * 0.44, -9.5, R * 0.5, 0.9);
      ctx.strokeStyle = '#2a2c33'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(R * 0.55, -7.4); ctx.lineTo(R * 0.72, -8.6); ctx.lineTo(R * 0.86, -7.3); ctx.stroke();
    }
    if (!plate && !noTails) {
      // atkılı ninja: rüzgâr ipleri atkıya ait; bandın düğümünden kısa, hafif sallanan iki uç sarkar
      const sw = Math.sin((ND.scene ? ND.scene.t : 0) * 2.6) * 0.9;
      ctx.fillStyle = c.accentDark; ctx.strokeStyle = D.line; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-R - 1.2, -8.4); ctx.quadraticCurveTo(-R - 6.5, -6.8 + sw, -R - 9.5 + sw, -1.2);
      ctx.lineTo(-R - 7.2 + sw, -0.4); ctx.quadraticCurveTo(-R - 4.6, -4.4, -R - 0.6, -6.4); ctx.closePath();
      ctx.moveTo(-R - 0.8, -6.6); ctx.quadraticCurveTo(-R - 4.2, -3.6 - sw * 0.5, -R - 5.2 + sw * 0.6, 1.8);
      ctx.lineTo(-R - 3.1 + sw * 0.6, 2.2); ctx.quadraticCurveTo(-R - 2.6, -2.6, -R + 0.2, -5.4); ctx.closePath();
      ctx.stroke(); ctx.fill();
    }
    // düğüm: iki ilmek + merkez
    ctx.fillStyle = c.accentDark;
    ctx.beginPath(); ctx.ellipse(-R - 1.8, -9.2, 2.8, 1.8, -0.6, 0, TAU); ctx.ellipse(-R - 1.5, -5, 2.6, 1.7, 0.6, 0, TAU); ctx.fill();
    ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(-R + 0.2, -7.1, 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = D.accHi; ctx.beginPath(); ctx.arc(-R + 0.6, -7.8, 0.8, 0, TAU); ctx.fill();
  }

  // kasa: hasır örgülü konik şapka
  function headKasa(ctx, c, D, R, lx) {
    ctx.strokeStyle = 'rgba(20,16,10,.85)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-3, -6); ctx.quadraticCurveTo(2, 4, 5, 11.5); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath(); ctx.ellipse(1, -R * 0.36, R * 2.15, 3.2, 0, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(0, -R * 1.5, 0, -R * 0.2);
    g.addColorStop(0, '#a58f60'); g.addColorStop(1, '#5a4a2e');
    ctx.fillStyle = g; ctx.strokeStyle = 'rgba(12,9,5,.9)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-R * 2.25, -R * 0.42);
    ctx.quadraticCurveTo(-R * 0.9, -R * 0.95, 0, -R * 1.5);
    ctx.quadraticCurveTo(R * 0.9, -R * 0.95, R * 2.25, -R * 0.42);
    ctx.quadraticCurveTo(0, -R * 0.62, -R * 2.25, -R * 0.42);
    ctx.stroke(); ctx.fill();
    // ışık tarafında hasır parlaması
    const s = lx >= 0 ? 1 : -1;
    ctx.fillStyle = 'rgba(255,236,190,.16)';
    ctx.beginPath(); ctx.moveTo(0, -R * 1.45); ctx.quadraticCurveTo(s * R * 0.9, -R * 0.95, s * R * 2.1, -R * 0.46); ctx.lineTo(s * R * 0.5, -R * 0.56); ctx.closePath(); ctx.fill();
    // örgü: halkalar + ışınsal çubuklar
    ctx.strokeStyle = 'rgba(40,30,15,.5)'; ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let i = -3; i <= 3; i++) { ctx.moveTo(0, -R * 1.45); ctx.lineTo(i * R * 0.66, -R * 0.5 - Math.abs(i) * 0.4); }
    for (const f of [0.35, 0.6, 0.83]) {
      ctx.moveTo(-R * 2.25 * f, -R * 1.5 + (R * 1.08) * f); ctx.quadraticCurveTo(0, -R * 1.5 + R * 0.93 * f, R * 2.25 * f, -R * 1.5 + (R * 1.08) * f);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(225,205,150,.4)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-R * 2.2, -R * 0.45); ctx.quadraticCurveTo(0, -R * 0.66, R * 2.2, -R * 0.45); ctx.stroke();
    ctx.fillStyle = '#3a2f1c'; ctx.beginPath(); ctx.arc(0, -R * 1.47, 1.6, 0, TAU); ctx.fill();
  }

  // at kuyruğu: saç kütlesi, perçem, tutam çizgileri, parlama, saç bağı
  function headPonytail(ctx, c, D, R, lx) {
    ctx.fillStyle = '#0c0a0b'; ctx.strokeStyle = D.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(-1.5, -4.5, R * 1.06, R * 0.84, -0.15, Math.PI * 0.95, Math.PI * 2.05); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(R * 0.2, -R * 0.87); ctx.quadraticCurveTo(R * 1.08, -R * 0.72, R * 1.06, -4); ctx.lineTo(R * 0.55, -5.5); ctx.closePath(); ctx.fill();
    // perçem tutamları (yarığın önüne düşen)
    ctx.beginPath(); ctx.moveTo(R * 0.5, -R * 0.8); ctx.quadraticCurveTo(R * 0.95, -R * 0.4, R * 0.78, -2.6); ctx.quadraticCurveTo(R * 0.72, -R * 0.45, R * 0.3, -R * 0.66); ctx.fill();
    ctx.strokeStyle = 'rgba(150,140,170,.28)'; ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let k = 0; k < 4; k++) { ctx.moveTo(R * (0.7 - k * 0.1), -R * (0.72 + k * 0.03)); ctx.quadraticCurveTo(-R * 0.1 * k, -R * (1.02 - k * 0.02), -R * 0.62, -R * (0.72 - k * 0.1)); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1.4;
    const s = lx >= 0 ? 0.3 : -0.3;
    ctx.beginPath(); ctx.ellipse(-1.5, -4.5, R * 0.9, R * 0.7, -0.15, Math.PI * (1.45 + s), Math.PI * (1.75 + s)); ctx.stroke();
    ctx.fillStyle = c.accent;
    ctx.beginPath(); ctx.ellipse(-R * 0.62, -R * 0.82, 3.1, 2.3, 0.6, 0, TAU); ctx.fill();
    ctx.fillStyle = D.accHi; ctx.beginPath(); ctx.arc(-R * 0.55, -R * 0.9, 0.9, 0, TAU); ctx.fill();
  }

  // kapüşon: sivri, kıvrımlı; derin gölgede parlayan göz
  function headHood(ctx, c, D, R) {
    ctx.fillStyle = c.clothDark; ctx.strokeStyle = D.line; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(R * 1.1, -5.5); ctx.quadraticCurveTo(R * 0.62, -R * 1.52, -R * 0.4, -R * 1.62);
    ctx.quadraticCurveTo(-R * 1.66, -R * 1.2, -R * 1.3, R * 0.45); ctx.quadraticCurveTo(-R * 0.4, -R * 0.4, R * 1.1, -5.5); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-R * 0.3, -R * 1.45); ctx.quadraticCurveTo(-R * 0.9, -R * 0.9, -R * 1.0, R * 0.1);
    ctx.moveTo(R * 0.5, -R * 1.15); ctx.quadraticCurveTo(-R * 0.2, -R * 0.9, -R * 0.6, -R * 0.2);
    ctx.stroke();
    ctx.strokeStyle = c.clothHi; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(R * 1.1, -5.6); ctx.quadraticCurveTo(R * 0.62, -R * 1.45, -R * 0.35, -R * 1.52); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const eg = ctx.createRadialGradient(R * 0.72, -2.3, 0, R * 0.72, -2.3, 7);
    eg.addColorStop(0, c.accent); eg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(R * 0.72, -2.3, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(R * 0.76, -2.4, 1.9, 0.85, -0.12, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // oni maskesi: oyma kaşlar, derin göz, burun delikleri, dişler, halkalı boynuzlar, lake parlaması
  function headOni(ctx, c, D, R, lx, ly) {
    // dağınık, geriye savrulmuş yele
    ctx.fillStyle = '#1f1b1c'; ctx.strokeStyle = D.line; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-R * 0.85, R * 0.55);
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * (0.9 + i * 0.105), long = i % 2 === 1;
      const r = long ? R * (1.42 + 0.14 * Math.sin(i * 1.7)) : R * 0.98;
      const x = Math.cos(a) * r - 1 - (long ? R * 0.24 : 0), y = Math.sin(a) * r * 0.95 - 2;
      if (long) ctx.quadraticCurveTo(Math.cos(a - 0.13) * r * 0.86 - 1, Math.sin(a - 0.13) * r * 0.82 - 2, x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(R * 0.6, -R * 0.4); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.strokeStyle = 'rgba(170,160,170,.24)'; ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let i = 1; i <= 9; i += 2) {
      const a = Math.PI * (0.9 + i * 0.105), r = R * 1.3;
      ctx.moveTo(Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.45 - 2);
      ctx.quadraticCurveTo(Math.cos(a - 0.1) * R * 0.95 - 1, Math.sin(a - 0.1) * R * 0.9 - 2, Math.cos(a) * r - 1 - R * 0.2, Math.sin(a) * r * 0.95 - 2);
    }
    ctx.stroke();
    // boynuzlar (maskenin arkasında başlar)
    const horn = (x0, y0, cx, cy, tx, ty, x1, y1, qx, qy) => {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, tx, ty); ctx.quadraticCurveTo(qx, qy, x1, y1); ctx.closePath();
      ctx.fillStyle = '#e9dfc6'; ctx.strokeStyle = D.line; ctx.lineWidth = 1; ctx.stroke(); ctx.fill();
    };
    horn(R * 0.2, -R * 0.72, R * 0.05, -R * 1.5, R * 0.55, -R * 1.8, R * 0.74, -R * 0.8, R * 0.45, -R * 1.2);
    horn(R * 0.92, -R * 0.82, R * 1.02, -R * 1.38, R * 1.5, -R * 1.55, R * 1.24, -R * 0.6, R * 1.22, -R * 1.05);
    ctx.strokeStyle = 'rgba(110,85,50,.6)'; ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(R * 0.22, -R * 1.02); ctx.lineTo(R * 0.62, -R * 0.98); ctx.moveTo(R * 0.25, -R * 1.3); ctx.lineTo(R * 0.52, -R * 1.28);
    ctx.moveTo(R * 1.0, -R * 1.05); ctx.lineTo(R * 1.22, -R * 0.92); ctx.moveTo(R * 1.12, -R * 1.3); ctx.lineTo(R * 1.3, -R * 1.2);
    ctx.stroke();
    // maske gövdesi
    const maskPath = () => {
      ctx.beginPath(); ctx.moveTo(-0.5, -R * 0.8); ctx.quadraticCurveTo(R * 1.22, -R * 0.92, R * 1.32, -1);
      ctx.quadraticCurveTo(R * 1.38, R * 0.72, R * 0.42, R * 1.0); ctx.quadraticCurveTo(-1.2, R * 0.82, -0.5, -R * 0.8); ctx.closePath();
    };
    maskPath(); ctx.strokeStyle = D.line; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = D.mask; ctx.fill();
    ctx.save(); ctx.clip();
    // lake gölgesi: ışıktan uzak taraf
    ctx.fillStyle = D.maskSh;
    ctx.beginPath(); ctx.ellipse(R * 0.4 - lx * R * 0.9, R * 0.2 - ly * R * 0.9, R * 1.1, R * 1.1, 0, 0, TAU); ctx.fill();
    // kaş çıkıntısı
    ctx.fillStyle = D.maskMid;
    ctx.beginPath(); ctx.moveTo(R * 0.3, -R * 0.62); ctx.quadraticCurveTo(R * 0.9, -R * 0.62, R * 1.4, -R * 0.42); ctx.lineTo(R * 1.35, -R * 0.2); ctx.quadraticCurveTo(R * 0.8, -R * 0.4, R * 0.35, -R * 0.36); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = D.maskHi; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(R * 0.35, -R * 0.64); ctx.quadraticCurveTo(R * 0.9, -R * 0.66, R * 1.38, -R * 0.45); ctx.stroke();
    // oyma yanak ve burun kanadı çizgileri
    ctx.strokeStyle = D.maskSh; ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(R * 1.08, R * 0.08); ctx.quadraticCurveTo(R * 0.7, R * 0.2, R * 0.55, R * 0.46);
    ctx.moveTo(R * 0.45, -R * 0.1); ctx.quadraticCurveTo(R * 0.2, R * 0.2, R * 0.25, R * 0.6);
    ctx.stroke();
    ctx.restore();
    // göz çukuru + parıltı
    ctx.fillStyle = '#120808'; ctx.beginPath(); ctx.ellipse(R * 0.8, -2.6, 3.4, 2, -0.15, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const eg = ctx.createRadialGradient(R * 0.8, -2.6, 0, R * 0.8, -2.6, 6);
    eg.addColorStop(0, 'rgba(255,170,60,1)'); eg.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(R * 0.8, -2.6, 6, 0, TAU); ctx.fill(); ctx.restore();
    // burun deliği
    ctx.fillStyle = '#120808'; ctx.beginPath(); ctx.ellipse(R * 1.2, R * 0.2, 1.3, 0.8, 0.4, 0, TAU); ctx.fill();
    // ağız + dişler + azı dişleri
    ctx.fillStyle = '#120808';
    ctx.beginPath(); ctx.moveTo(R * 0.3, R * 0.42); ctx.quadraticCurveTo(R * 0.8, R * 0.52, R * 1.25, R * 0.4); ctx.lineTo(R * 1.2, R * 0.66); ctx.quadraticCurveTo(R * 0.75, R * 0.76, R * 0.35, R * 0.62); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f2ead6';
    ctx.beginPath();
    ctx.moveTo(R * 0.45, R * 0.46); ctx.lineTo(R * 0.55, R * 0.8); ctx.lineTo(R * 0.65, R * 0.48);
    ctx.moveTo(R * 1.0, R * 0.46); ctx.lineTo(R * 1.08, R * 0.8); ctx.lineTo(R * 1.16, R * 0.44);
    ctx.moveTo(R * 0.78, R * 0.72); ctx.lineTo(R * 0.84, R * 0.5); ctx.lineTo(R * 0.9, R * 0.72);
    ctx.fill();
    // lake parlaması (keskin)
    const sx = R * 0.75 + lx * R * 0.35, sy = -R * 0.2 + ly * R * 0.35;
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.ellipse(sx, sy, 3.6, 1.3, -0.35, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(sx + 1, sy - 0.2, 0.7, 0, TAU); ctx.fill();
  }

  // kabuto: kaburgalı kubbe, perçinler, fukigaeshi, altın arma, menpō ve katmanlı ense korumu
  function headKabuto(ctx, c, D, R, lx) {
    const ar = D.armor;
    for (let i = 2; i >= 0; i--) {
      ctx.fillStyle = i % 2 ? ar : c.accentDark; ctx.strokeStyle = D.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-R * 0.2, -R * 0.4); ctx.lineTo(-R * (1.25 + i * 0.12), R * (0.05 + i * 0.28));
      ctx.lineTo(-R * (0.75 + i * 0.1), R * (0.25 + i * 0.3)); ctx.lineTo(R * 0.1, -R * 0.1); ctx.closePath(); ctx.stroke(); ctx.fill();
    }
    ctx.strokeStyle = c.accent; ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) { ctx.moveTo(-R * (0.5 + i * 0.12), R * (-0.05 + i * 0.28)); ctx.lineTo(-R * (0.95 + i * 0.12), R * (0.2 + i * 0.3)); }
    ctx.stroke();
    const hg = ctx.createLinearGradient(lx * R, -R * 1.3, -lx * R * 0.5, 0);
    hg.addColorStop(0, D.armorHi); hg.addColorStop(0.45, D.armorLt); hg.addColorStop(1, D.armorDk);
    ctx.fillStyle = hg; ctx.strokeStyle = D.line; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(0, -2.5, R * 1.12, R * 1.02, 0, Math.PI, TAU); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(i * R * 0.35, -2.5); ctx.quadraticCurveTo(i * R * 0.2, -R * 1.0, 0, -R * 1.15); } ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,190,.3)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(i * R * 0.35 + 0.8, -2.8); ctx.quadraticCurveTo(i * R * 0.2 + 0.6, -R * 1.0, 0.4, -R * 1.12); } ctx.stroke();
    ctx.fillStyle = D.accHi;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.arc(i * R * 0.3, -R * 0.52 + Math.abs(i) * 0.9, 0.7, 0, TAU); ctx.fill(); }
    ctx.fillStyle = c.accent; ctx.fillRect(-R * 1.15, -3.5, R * 2.35, 2.2);
    ctx.fillStyle = D.accHi; ctx.fillRect(-R * 1.1, -3.5, R * 2.25, 0.6);
    // fukigaeshi (şakak kanadı)
    ctx.fillStyle = c.accentDark; ctx.strokeStyle = D.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(R * 0.15, -3.6); ctx.lineTo(R * 0.72, -4.4); ctx.quadraticCurveTo(R * 0.7, 0.5, R * 0.3, 1.6); ctx.quadraticCurveTo(R * 0.1, -1, R * 0.15, -3.6); ctx.stroke(); ctx.fill();
    ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(R * 0.42, -1.6, 1.3, 0, TAU); ctx.fill();
    // maedate (altın boynuz arması)
    ctx.strokeStyle = D.line; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    const crest = () => { ctx.beginPath(); ctx.moveTo(R * 0.55, -R * 0.9); ctx.quadraticCurveTo(R * 0.1, -R * 1.8, R * 0.35, -R * 2.3); ctx.moveTo(R * 0.55, -R * 0.9); ctx.quadraticCurveTo(R * 1.3, -R * 1.6, R * 1.7, -R * 1.9); };
    crest(); ctx.stroke();
    ctx.strokeStyle = c.accent; ctx.lineWidth = 2; crest(); ctx.stroke();
    ctx.strokeStyle = D.accHi; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(R * 0.46, -R * 1.2); ctx.quadraticCurveTo(R * 0.2, -R * 1.75, R * 0.33, -R * 2.2); ctx.stroke();
    ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(R * 0.55, -R * 0.9, 2.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff8e0'; ctx.beginPath(); ctx.arc(R * 0.5, -R * 0.96, 0.8, 0, TAU); ctx.fill();
    // kubbe parlaması
    ctx.fillStyle = 'rgba(255,245,225,.22)';
    ctx.beginPath(); ctx.ellipse(lx * R * 0.45, -R * 0.78, R * 0.32, 1.6, lx * 0.4, 0, TAU); ctx.fill();
    // menpō + bıyık + boğaz korumu
    ctx.fillStyle = ar; ctx.strokeStyle = D.line; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(R * 0.05, 0.6); ctx.lineTo(R * 1.28, 0.2); ctx.quadraticCurveTo(R * 1.22, R * 0.92, R * 0.3, R * 1.04); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.strokeStyle = D.armorHi; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(R * 0.3, 0.9); ctx.lineTo(R * 1.2, 0.55); ctx.stroke();
    ctx.strokeStyle = '#4d4641'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(R * 1.1, R * 0.32); ctx.quadraticCurveTo(R * 0.8, R * 0.5, R * 0.55, R * 0.36); ctx.moveTo(R * 1.1, R * 0.34); ctx.quadraticCurveTo(R * 0.85, R * 0.6, R * 0.62, R * 0.56); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(R * 0.7, R * 0.68); ctx.lineTo(R * 1.12, R * 0.62); ctx.stroke();
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = i ? c.accentDark : ar; ctx.strokeStyle = D.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(R * (0.25 - i * 0.05), R * (1.0 + i * 0.22)); ctx.lineTo(R * (1.05 - i * 0.08), R * (0.9 + i * 0.22));
      ctx.lineTo(R * (1.0 - i * 0.08), R * (1.14 + i * 0.22)); ctx.lineTo(R * (0.3 - i * 0.05), R * (1.24 + i * 0.22)); ctx.closePath(); ctx.stroke(); ctx.fill();
    }
  }

  // ---------------------------------------------------------------- DÜŞÜK AYRINTI (yansıma / gölge)
  function drawLow(ctx, j, c, X, wpn, acc) {
    torsoFrame(j);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = c.clothDark; ctx.beginPath();
    capPath(ctx, j.hip.x, j.hip.y, j.knB.x, j.knB.y, 9.6, 10.2); capPath(ctx, j.knB.x, j.knB.y, j.ftB.x, j.ftB.y, 7.4, 5);
    footFrame(j.ftB, j.knB, j.dir, 0.95); capPath(ctx, FX(-2, -2.5), FY(-2, -2.5), FX(10, -3.5), FY(10, -3.5), 3.8, 2.8);
    capPath(ctx, j.sh.x, j.sh.y, j.elB.x, j.elB.y, 7, 6.6); capPath(ctx, j.elB.x, j.elB.y, j.haB.x, j.haB.y, 5, 4.4);
    ctx.fill();
    if (X.ropes) for (const r of X.ropes) r.rope.draw(ctx, r.col, r.w);
    ctx.fillStyle = c.cloth; ctx.beginPath();
    torsoPath(ctx);
    const h = j.head, R = L.headR;
    const hrx = R * 1.05 * Math.max(0.2, Math.abs(j.dir));
    ctx.moveTo(h.x + hrx, h.y); ctx.ellipse(h.x, h.y, hrx, R * 1.08, 0, 0, TAU);
    capPath(ctx, j.neck.x, j.neck.y, h.x, h.y, 6, 6);
    capPath(ctx, j.hip.x, j.hip.y, j.knF.x, j.knF.y, 10.2, 10.8); capPath(ctx, j.knF.x, j.knF.y, j.ftF.x, j.ftF.y, 7.8, 5);
    footFrame(j.ftF, j.knF, j.dir, 1); capPath(ctx, FX(-2, -2.5), FY(-2, -2.5), FX(10, -3.5), FY(10, -3.5), 3.8, 2.8);
    capPath(ctx, j.sh.x, j.sh.y, j.elF.x, j.elF.y, 7.4, 7); capPath(ctx, j.elF.x, j.elF.y, j.haF.x, j.haF.y, 5.2, 4.8);
    if (acc === 'kasa') {
      const ux = Math.cos(j.hang), uy = Math.sin(j.hang), sx = -uy, sy = ux;
      BUF[0] = h.x + ux * R * 1.5; BUF[1] = h.y + uy * R * 1.5;
      BUF[2] = h.x + ux * R * 0.4 + sx * R * 2.25; BUF[3] = h.y + uy * R * 0.4 + sy * R * 2.25;
      BUF[4] = h.x + ux * R * 0.2; BUF[5] = h.y + uy * R * 0.2;
      BUF[6] = h.x + ux * R * 0.4 - sx * R * 2.25; BUF[7] = h.y + uy * R * 0.4 - sy * R * 2.25;
      blob(ctx, BUF, 4);
    }
    ctx.fill();
    if (c.hakama) {
      // separate hakama colour (Akane, Aoi): legs over the single-colour silhouette
      ctx.fillStyle = c.hakama; ctx.beginPath();
      capPath(ctx, j.hip.x, j.hip.y, j.knB.x, j.knB.y, 9.6, 10.2); capPath(ctx, j.knB.x, j.knB.y, j.ftB.x, j.ftB.y, 7.4, 5);
      capPath(ctx, j.hip.x, j.hip.y, j.knF.x, j.knF.y, 10.2, 10.8); capPath(ctx, j.knF.x, j.knF.y, j.ftF.x, j.ftF.y, 7.8, 5);
      ctx.fill();
    }
    if (j.hasSword && j.tip) {
      if (wpn.type === 'tessen') swordLow(ctx, j.haB.x, j.haB.y, Math.atan2(j.haB.y - j.elB.y, j.haB.x - j.elB.x) - j.dir * 0.3, wpn, j);
      else if (wpn.twin) swordLow(ctx, j.haB.x, j.haB.y, Math.atan2(j.elB.y - j.haB.y, j.elB.x - j.haB.x) + j.dir * 0.25, wpn);
      swordLow(ctx, j.haF.x, j.haF.y, Math.atan2(j.tip.y - j.haF.y, j.tip.x - j.haF.x), wpn, j);
      if (j.chain) ND.Chain.prototype.draw.call(j.chain, ctx, null, 'low');
    }
  }

  // Tek yolda birleşik siluet (hayaletler / efektler için): gövde, baş, uzuvlar, ayaklar
  ND.ninjaPath = function (ctx, j) {
    torsoFrame(j);
    const h = j.head, R = L.headR;
    torsoPath(ctx);
    const hrx = R * Math.max(0.2, Math.abs(j.dir));
    ctx.moveTo(h.x + hrx, h.y); ctx.ellipse(h.x, h.y, hrx, R * 1.08, 0, 0, TAU);
    capPath(ctx, j.neck.x, j.neck.y, h.x, h.y, 6, 6);
    for (const [k, f] of [['knB', 'ftB'], ['knF', 'ftF']]) {
      capPath(ctx, j.hip.x, j.hip.y, j[k].x, j[k].y, 10, 10.6); capPath(ctx, j[k].x, j[k].y, j[f].x, j[f].y, 7.4, 5);
      footFrame(j[f], j[k], j.dir, 1); capPath(ctx, FX(-2, -2.5), FY(-2, -2.5), FX(10, -3.5), FY(10, -3.5), 3.8, 2.8);
    }
    for (const [e, a] of [['elB', 'haB'], ['elF', 'haF']]) { capPath(ctx, j.sh.x, j.sh.y, j[e].x, j[e].y, 7.2, 6.8); capPath(ctx, j[e].x, j[e].y, j[a].x, j[a].y, 5, 4.6); }
  };

  // Parlayan göz halesi (kapüşon / oni). Işık katmanı saydam olduğundan 'lighter' parıltı siluetin
  // dışında sönük kalıyordu; bu hale, dövüşçü sahneye basıldıktan sonra ana tuvale eklenir.
  ND.eyeGlow = function (ctx, j, c, acc, k = 1) {
    if ((acc !== 'hood' && acc !== 'oni') || !j || !j.head || j.hang == null) return;
    const R = L.headR, ang = j.hang + HP, ca = Math.cos(ang), sa = Math.sin(ang);
    const px = (acc === 'hood' ? R * 0.74 : R * 0.8) * j.dir, py = acc === 'hood' ? -2.35 : -2.6;
    const x = j.head.x + px * ca - py * sa, y = j.head.y + px * sa + py * ca, r = acc === 'hood' ? 11 : 8.5;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= (acc === 'hood' ? 0.5 : 0.3) * k;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    if (acc === 'hood') { g.addColorStop(0, c.accent); g.addColorStop(1, 'rgba(0,0,0,0)'); }
    else { g.addColorStop(0, 'rgba(255,150,50,1)'); g.addColorStop(1, 'rgba(255,80,20,0)'); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.restore();
  };

  // ---------------------------------------------------------------- TAM NİNJA
  // extra: { ropes, trail, glint, wpn, acc, lod: 'high' | 'low' }
  ND.drawNinja = function (ctx, j, c, extra) {
    const X = extra || {}, wpn = X.wpn || L, acc = X.acc || 'hachimaki';
    if (X.lod === 'low') { drawLow(ctx, j, c, X, wpn, acc); return; }
    updLight();
    const D = pal(c), t = ND.scene ? ND.scene.t : 0;
    // kumaş dalgalanması için yatay hız tahmini (aynı karede birden çok çizim olabilir)
    if (j._t !== t) { const v = j._px === undefined ? 0 : j.hip.x - j._px; j._vs = (j._vs || 0) * 0.6 + clamp(v, -12, 12) * 0.4; j._px = j.hip.x; j._t = t; }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    torsoFrame(j);
    const wt = wpn.type;
    if (wt === 'yumi') quiverBack(ctx, j, c, D);
    else if (wpn.iai) sayaHip(ctx, j, c, D, wpn);
    else if (wt !== 'naginata' && wt !== 'bo' && wt !== 'tessen' && wt !== 'kusarigama') saya(ctx, j, c, D, wpn);
    // arka bacak + kumaş uçları + arka kol
    drawLeg(ctx, j, false, c, D);
    if (X.ropes) for (const r of X.ropes) r.rope.draw(ctx, r.col, r.w, 'rgba(255,255,255,.07)');
    drawArm(ctx, j, false, c, D, X, wpn, acc);
    // gövde, atkı, boyun, baş
    torsoFrame(j);
    drawTorso(ctx, j, c, D, acc);
    if (acc === 'scarf') {
      const a = Math.atan2(TF.uy, TF.ux) + HP, sx = j.neck.x - TF.ux * 3, sy = j.neck.y - TF.uy * 3;
      ctx.fillStyle = c.accentDark; ctx.strokeStyle = D.line; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(sx, sy, 11.5, 7, a, 0, TAU); ctx.stroke(); ctx.fill();
      ctx.fillStyle = c.accent; ctx.beginPath(); ctx.ellipse(sx + TF.ux + LT.x * 0.8, sy + TF.uy + LT.y * 0.8, 10.2, 5.4, a, 0, TAU); ctx.fill();
      ctx.strokeStyle = D.accSh; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(sx + TF.ux * 1.5, sy + TF.uy * 1.5, 8.5, 3, a, 0.2, 2.6);
      ctx.moveTo(sx - TF.nx * 6 + TF.ux * 3, sy - TF.ny * 6 + TF.uy * 3); ctx.lineTo(sx - TF.nx * 2 - TF.ux * 2, sy - TF.ny * 2 - TF.uy * 2);
      ctx.stroke();
      ctx.strokeStyle = D.accHi; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.ellipse(sx + TF.ux * 0.5, sy + TF.uy * 0.5, 9.2, 4.4, a, 3.6, 5.2); ctx.stroke();
    } else {
      ctx.beginPath(); capPath(ctx, j.neck.x - TF.ux * 2, j.neck.y - TF.uy * 2, j.neck.x + (j.head.x - j.neck.x) * 0.55, j.neck.y + (j.head.y - j.neck.y) * 0.55, 6.2, 5.6);
      ctx.strokeStyle = D.line; ctx.lineWidth = 2.4; ctx.stroke(); ctx.fillStyle = acc === 'monk' || acc === 'akane' ? c.skin : (c.hood || c).clothDark; ctx.fill();
    }
    if (acc === 'monk') juzu(ctx, j, c, D);
    if (wt === 'yumi' && j.wBow > 0.5 && j.hasSword) tantoSheath(ctx, c, D);
    drawHead(ctx, j, c, D, acc);
    // ön bacak
    drawLeg(ctx, j, true, c, D);
    if (acc === 'kabuto') { torsoFrame(j); kusazuri(ctx, c, D); }
    // kılıç + iz
    if (X.trail) X.trail(ctx);
    if (j.hasSword && j.tip) drawSword(ctx, j.haF.x, j.haF.y, Math.atan2(j.tip.y - j.haF.y, j.tip.x - j.haF.x), c, X.glint || 0, wpn, 'high', j);
    if (j.chain && j.hasSword) ND.Chain.prototype.draw.call(j.chain, ctx, c.accent);
    // ön kol
    drawArm(ctx, j, true, c, D, X, wpn, acc);
  };

  // ---------------------------------------------------------------- RAGDOLL
  const RD_PTS = ['head', 'neck', 'hip', 'elF', 'haF', 'elB', 'haB', 'knF', 'ftF', 'knB', 'ftB'];
  const RD_STICKS = [['head', 'neck'], ['neck', 'hip'], ['neck', 'elF'], ['elF', 'haF'], ['neck', 'elB'], ['elB', 'haB'],
    ['hip', 'knF'], ['knF', 'ftF'], ['hip', 'knB'], ['knB', 'ftB'], ['head', 'hip']];
  const RD_MIN = [['ftF', 'hip', 0.55], ['ftB', 'hip', 0.55], ['knF', 'neck', 0.7], ['knB', 'neck', 0.7], ['head', 'knF', 0.6], ['haF', 'hip', 0.3]];

  class Ragdoll {
    constructor(j, vx, vy, imp) {
      this.dir = j.dir; this.p = {}; this.t = 0;
      const dt0 = 1 / 60;
      for (const k of RD_PTS) {
        const s = j[k];
        const up = clamp((j.hip.y - s.y) / 90, -0.3, 1);
        const ivx = imp.x * (0.5 + up * 0.8) + (Math.random() - 0.5) * 40;
        const ivy = imp.y * (0.6 + up * 0.5) - 60 * up;
        this.p[k] = { x: s.x, y: s.y, px: s.x - (vx + ivx) * dt0, py: s.y - (vy + ivy) * dt0 };
      }
      const d = (a, b) => Math.hypot(this.p[a].x - this.p[b].x, this.p[a].y - this.p[b].y);
      this.sticks = RD_STICKS.map(([a, b]) => [a, b, d(a, b)]);
      this.mins = RD_MIN.map(([a, b, f]) => [a, b, d(a, b) * f]);
      this.j = { dir: j.dir, hasSword: false };
      this.hitGround = false;
      this.joints();
    }
    step(dt) {
      this.t += dt;
      const P = this.p, d2 = dt * dt, A = ND.ARENA + 20;
      let impact = 0;
      for (const k in P) {
        const q = P[k], vx = (q.x - q.px) * 0.996, vy = (q.y - q.py) * 0.996;
        q.px = q.x; q.py = q.y; q.x += vx; q.y += vy + 1900 * d2;
      }
      for (let it = 0; it < 10; it++) {
        for (const [a, b, len] of this.sticks) {
          const p = P[a], q = P[b], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1e-3, f = (d - len) / d * 0.5;
          p.x += dx * f; p.y += dy * f; q.x -= dx * f; q.y -= dy * f;
        }
        for (const [a, b, len] of this.mins) {
          const p = P[a], q = P[b], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1e-3;
          if (d < len) { const f = (d - len) / d * 0.5; p.x += dx * f; p.y += dy * f; q.x -= dx * f; q.y -= dy * f; }
        }
        for (const k in P) {
          const q = P[k], r = k === 'head' ? 12 : k === 'hip' || k === 'neck' ? 10 : 5;
          if (q.y > -r) {
            const vy = q.y - q.py;
            if (vy > 6) impact = Math.max(impact, vy);
            q.y = -r; q.px = q.x - (q.x - q.px) * 0.55; q.py = q.y + vy * 0.2;
          }
          if (q.x < -A) q.x = -A; if (q.x > A) q.x = A;
        }
      }
      return impact;
    }
    joints() {
      const P = this.p, j = this.j;
      for (const k of RD_PTS) { const o = j[k] || (j[k] = { x: 0, y: 0 }); o.x = P[k].x; o.y = P[k].y; }
      j.sh = j.sh || { x: 0, y: 0 };
      j.sh.x = P.neck.x + (P.hip.x - P.neck.x) * 0.14; j.sh.y = P.neck.y + (P.hip.y - P.neck.y) * 0.14;
      j.hang = Math.atan2(P.head.y - P.neck.y, P.head.x - P.neck.x);
      return j;
    }
  }
  ND.Ragdoll = Ragdoll;

  // Düşen kılıç: iki noktalı çubuk; ucu yere saplanabilir
  class LooseSword {
    constructor(hx, hy, tx, ty, vx, vy, spin, wpn) {
      this.wpn = wpn || L;
      const dt0 = 1 / 60;
      this.a = { x: hx, y: hy, px: hx - (vx - spin) * dt0, py: hy - vy * dt0 };
      this.b = { x: tx, y: ty, px: tx - (vx + spin) * dt0, py: ty - (vy - spin * 0.5) * dt0 };
      this.len = Math.hypot(tx - hx, ty - hy); this.stuck = false; this.wob = 0; this.bounces = 0;
    }
    step(dt) {
      if (this.stuck) { this.wob *= Math.exp(-4 * dt); return; }
      const d2 = dt * dt;
      for (const q of [this.a, this.b]) {
        const vx = q.x - q.px, vy = q.y - q.py; q.px = q.x; q.py = q.y; q.x += vx; q.y += vy + 1900 * d2;
      }
      const dx = this.b.x - this.a.x, dy = this.b.y - this.a.y, d = Math.hypot(dx, dy) || 1e-3, f = (d - this.len) / d * 0.5;
      this.a.x += dx * f; this.a.y += dy * f; this.b.x -= dx * f; this.b.y -= dy * f;
      // arena duvarı: uzun silahlar (asa) sahne dışına uçmasın, duvardan seksin
      const WA = (ND.ARENA || 880) + 20;
      for (const q of [this.a, this.b]) if (Math.abs(q.x) > WA) { const s = Math.sign(q.x), v = q.x - q.px; q.x = s * WA; q.px = q.x + v * 0.4; }
      const tip = this.b, vy = tip.y - tip.py;
      if (tip.y > 0) {
        const steep = (tip.y - this.a.y) / this.len;
        if (vy * 60 > 260 && steep > 0.72) {
          this.stuck = true; this.wob = 1; tip.y = 16;
          const ang = Math.atan2(tip.y - this.a.y, tip.x - this.a.x);
          this.a.x = tip.x - Math.cos(ang) * this.len; this.a.y = tip.y - Math.sin(ang) * this.len;
          ND.audio.tick(ND.cam.pan(tip.x)); ND.fx.dust(tip.x, 0, 5, 0.5);
          return;
        }
        tip.y = 0; tip.py = tip.y + vy * 0.3; tip.px = tip.x - (tip.x - tip.px) * 0.5;
        if (vy > 3 && this.bounces++ < 6) ND.audio.tick(ND.cam.pan(tip.x));
      }
      const h = this.a;
      if (h.y > -3) { const v = h.y - h.py; h.y = -3; h.py = h.y + v * 0.3; h.px = h.x - (h.x - h.px) * 0.5; }
    }
    draw(ctx, col) {
      const ang = Math.atan2(this.b.y - this.a.y, this.b.x - this.a.x) + Math.sin(ND.scene.t * 40) * this.wob * 0.05;
      drawSword(ctx, this.a.x, this.a.y, ang, col, 0, this.wpn);
    }
  }
  ND.LooseSword = LooseSword;
})(window.ND);
