

















(function (ND) {
  'use strict';
  const FLAG = (() => { try { return !/[?&]duel=0(&|$)/.test(location.search || ''); } catch (e) { return true; } })();
  if (!FLAG || !ND.duel) return;
  const Math = ND.DM || globalThis.Math;
  const PO = ND.POSES, pose = ND.pose, ATK = ND.ATK, fx = ND.fx, au = ND.audio, cam = ND.cam, D = ND.duel, E = ND.M.ease;
  const { clamp } = ND.M;
  const mk = pose.mk;
  const eo = E.outCubic, eq = E.outQuart, es = E.inOutSine, ei = E.inOut, eqd = E.inQuad;


  const ARM = {
    kesaR: [{ ax: -2, ay: -50, sw: -2.45, hd: -0.12 }, { ax: 46, ay: 12, sw: 0.6 }, { ax: 20, ay: 42, sw: 2.2 }],
    kesaL: [{ ax: -16, ay: -42, sw: -2.95, hd: 0.06 }, { ax: 44, ay: 16, sw: 0.8 }, { ax: 32, ay: 38, sw: 1.62 }],
    kiriR: [{ ax: 2, ay: 42, sw: 2.55 }, { ax: 50, ay: -8, sw: -0.5 }, { ax: 14, ay: -48, sw: -2.1, hd: -0.2 }],
    kiriL: [{ ax: -10, ay: 32, sw: 3.0 }, { ax: 50, ay: -6, sw: -0.45 }, { ax: 22, ay: -46, sw: -1.75, hd: -0.18 }],
    yokoR: [{ ax: -14, ay: 20, sw: 2.9 }, { ax: 54, ay: 2, sw: 0.0 }, { ax: 14, ay: 10, sw: -2.85 }],
    yokoL: [{ ax: -4, ay: 4, sw: -2.95 }, { ax: 54, ay: 4, sw: 0.02 }, { ax: -8, ay: 18, sw: 2.95 }],
    shomen: [{ ax: 4, ay: -54, sw: -1.95, hd: -0.16 }, { ax: 50, ay: 14, sw: 0.72 }, { ax: 40, ay: 40, sw: 1.3 }],
    kiriV: [{ ax: 30, ay: 42, sw: 1.35 }, { ax: 46, ay: -22, sw: -0.9 }, { ax: 20, ay: -50, sw: -1.85, hd: -0.2 }],
    tsuki: [{ ax: 2, ay: 18, sw: -0.06 }, { ax: 58, ay: 0, sw: -0.08 }, { ax: 54, ay: 2, sw: -0.06 }],
  };

  const MID = { yokoR: { ax: 22, ay: 20, sw: 1.45 }, yokoL: { ax: 20, ay: 14, sw: -1.6 } };
  const SIDE = { kesaR: 1, kesaL: -1, kiriR: 1, kiriL: -1, yokoR: 1, yokoL: -1, shomen: 0, kiriV: 0, tsuki: 0 };
  const VERT = { kesaR: 'down', kesaL: 'down', kiriR: 'up', kiriL: 'up', yokoR: 'level', yokoL: 'level', shomen: 'down', kiriV: 'up', tsuki: 'thrust' };

  const Z3 = {
    kesaR: [[0.85, 0.35, 1, 0.85], [0, -0.1, 0.5, 1], [-0.75, -0.4, -1, 0.8]],
    kesaL: [[-0.9, -0.35, -1, 0.8], [0, 0.1, 0.4, 1], [0.7, 0.4, 1, 0.85]],
    kiriR: [[0.75, 0.3, 1, 0.9], [0, 0, 0.4, 1], [-0.65, -0.3, -1, 0.8]],
    kiriL: [[-0.85, -0.35, -1, 0.8], [0, 0, 0.4, 1], [0.65, 0.3, 1, 0.85]],
    yokoR: [[1.05, 0.45, 1, 1], [0, 0, 0.5, 1], [-1.0, -0.45, -1, 0.9]],
    yokoL: [[-1.05, -0.45, -1, 1], [0, 0, 0.5, 1], [1.0, 0.45, 1, 0.9]],
    shomen: [[0.12, 0, 0.3, 0.85], [0, 0, 0.5, 1], [-0.15, 0, 0.3, 1]],
    kiriV: [[0, 0, 0.4, 1], [0, 0, 0.4, 1], [0, 0, 0.3, 0.9]],
    tsuki: [[0.5, 0.2, 0.6, 1], [-0.4, -0.2, 0.4, 1], [-0.3, -0.15, 0.4, 1]],
  };
  const ZMID = { yokoR: [0.55, 0.2, 1, 0.3], yokoL: [-0.55, -0.2, -1, 0.3] };
  const REST = [0, 0, 1, 1];

  const BODY = {
    std: [{ hx: -6, hy: -80, lean: 0.04, f1x: 22, f2x: -30 }, { hx: 16, hy: -72, lean: 0.42, hd: 0.15, f1x: 56, f2x: -24 }, { hx: 14, hy: -72, lean: 0.36, hd: 0.15, f1x: 56, f2x: -24 }],
    low: [{ hx: -4, hy: -66, lean: 0.36, f1x: 30, f2x: -34 }, { hx: 18, hy: -60, lean: 0.5, hd: 0.2, f1x: 64, f2x: -30 }, { hx: 16, hy: -62, lean: 0.44, hd: 0.18, f1x: 64, f2x: -30 }],
    rise: [{ hx: -4, hy: -64, lean: 0.4, f1x: 30, f2x: -34 }, { hx: 16, hy: -78, lean: 0.24, f1x: 58, f2x: -24 }, { hx: 12, hy: -86, lean: 0.0, hd: -0.15, f1x: 58, f2x: -22, f2y: -6 }],
    heavy: [{ hx: -10, hy: -83, lean: -0.12, f1x: 22, f2x: -32 }, { hx: 28, hy: -62, lean: 0.62, hd: 0.25, f1x: 78, f2x: -22 }, { hx: 24, hy: -60, lean: 0.6, hd: 0.25, f1x: 78, f2x: -22 }],
    lunge: [{ hx: -12, hy: -74, lean: 0.12, f1x: 18, f2x: -36 }, { hx: 34, hy: -64, lean: 0.62, hd: 0.25, f1x: 94, f2x: -28 }, { hx: 30, hy: -66, lean: 0.55, hd: 0.2, f1x: 94, f2x: -28 }],
    small: [{ hx: 0, hy: -78, lean: 0.14, f1x: 26, f2x: -28 }, { hx: 10, hy: -74, lean: 0.34, hd: 0.12, f1x: 40, f2x: -26 }, { hx: 8, hy: -74, lean: 0.3, hd: 0.12, f1x: 40, f2x: -26 }],
    hop: [{ hx: -4, hy: -96, lean: -0.1, hd: -0.15, f1x: 26, f1y: -26, f2x: -24, f2y: -18 }, { hx: 30, hy: -48, lean: 0.72, hd: 0.3, f1x: 80, f2x: -30 }, { hx: 28, hy: -46, lean: 0.7, hd: 0.3, f1x: 80, f2x: -30 }],
    spin: [{ hx: -2, hy: -76, lean: 0.2, f1x: 30, f2x: -30 }, { hx: 18, hy: -70, lean: 0.4, hd: 0.12, f1x: 60, f2x: -26 }, { hx: 16, hy: -72, lean: 0.34, f1x: 60, f2x: -26 }],
    back: [{ hx: -16, hy: -70, lean: 0.24, f1x: 10, f2x: -46 }, { hx: 6, hy: -56, lean: 0.55, hd: 0.25, f1x: 70, f2x: -44 }, { hx: 4, hy: -58, lean: 0.5, hd: 0.2, f1x: 70, f2x: -44 }],
  };
  const reg = (name, d) => { d.keys = d.keys.map(([t, p, e]) => [t, typeof p === 'string' ? PO[p] || PO.stance : p, e]); d.dur = d.keys[d.keys.length - 1][0]; ATK[name] = d; return d; };
  const P = (name, o) => (PO[name] = mk(o));

  function poses3(id, dir, body, x) {
    const B = BODY[body] || body, A = ARM[dir];
    for (let i = 0; i < 3; i++) P(id + 'WSF'[i], Object.assign({}, B[i], A[i], x && x[i]));
    if (MID[dir]) P(id + 'M', Object.assign({}, B[0], { hx: (B[0].hx + B[1].hx) / 2, hy: (B[0].hy + B[1].hy) / 2, lean: (B[0].lean + B[1].lean) / 2, f1x: B[1].f1x, f2x: B[1].f2x }, MID[dir], x && x[3]));
    return id;
  }

  const z3Cut = (dir, tw, ts, tf, te, k = 1) => {
    const Z = Z3[dir], S = (v) => [v[0] * k, v[1] * k, v[2], v[3]];
    const L = [[0, ...REST], [tw, ...S(Z[0])]];
    if (ZMID[dir]) L.push([(tw + ts) / 2, ...S(ZMID[dir])]);
    L.push([ts, ...S(Z[1])], [tf, ...S(Z[2])], [te, ...REST]);
    return L;
  };

  const LIST = D.LIST = [];
  const note = (id, who, name, button, when) => LIST.push({ id, who, name, button, when });






  function light(name, dir, body, o = {}, x) {
    const id = poses3('dz_' + name, dir, body, x), m = MID[dir];
    let t = o.t || [0.065, 0.125, 0.21, 0.42];
    if (t.length === 4) {
      t = [t[0] + 0.015, t[0] + 0.04, t[1] + 0.025, t[2] + 0.025, t[3] + 0.03];
      if (o.a) for (const k of ['lunge', 'lunge2', 'spin']) if (o.a[k]) o.a[k] = [o.a[k][0] + 0.025, o.a[k][1] + 0.025, ...o.a[k].slice(2)];
    }
    const keys = [[t[0], id + 'W', es], [t[1], id + 'W']];
    if (m) keys.push([(t[1] + t[2]) / 2, id + 'M', eqd]);
    keys.push([t[2], id + 'S', eq], [t[3], id + 'F', eo], [t[4], o.end || 'stance', ei]);
    const z = z3Cut(dir, t[1], t[2], t[3], t[4]);
    z.splice(1, 0, [t[0], ...z[1].slice(1)]);
    return reg(name, Object.assign({
      keys, active: [t[1] + 0.005, t[2] + 0.04], dmg: 9, post: 14, kb: 230, stun: 0.34, lunge: [t[1] - 0.01, t[2] + 0.025, 260],
      chain: [t[2] + 0.05, t[4]], sw: t[1] - 0.005, pw: 1, kind: 'blade', dz3: { side: SIDE[dir], v: VERT[dir], dir },
      z3: z, thrust: dir === 'tsuki' || undefined, tw: t,
    }, o.a));
  }
  function heavy(name, dir, body, o = {}, x) {
    const id = poses3('dz_' + name, dir, body, x), m = MID[dir];
    const t = o.t || [0.2, 0.33, 0.42, 0.55, 0.9];
    const keys = [[t[0], id + 'W', es], [t[1], id + 'W']];
    if (m) keys.push([(t[1] + t[2]) / 2, id + 'M', eqd]);
    keys.push([t[2], id + 'S', eq], [t[3], id + 'F', eo], [t[4], o.end || 'stance', ei]);

    const z = z3Cut(dir, t[1], t[2], t[3], t[4]);
    z.splice(1, 0, [t[0], ...z[1].slice(1)]);
    return reg(name, Object.assign({
      keys, active: [t[2] - 0.05, t[2] + 0.05], dmg: 23, post: 42, kb: 430, stun: 0.6, knock: true, heavyClass: true,
      lunge: [t[2] - 0.08, t[2] + 0.03, 430], glint: [t[0] - 0.06, t[1]], sw: t[2] - 0.06, pw: 1.5, kind: 'blade', sc: true,
      dz3: { side: SIDE[dir], v: VERT[dir], dir }, z3: z, thrust: dir === 'tsuki' || undefined,
    }, o.a));
  }



  light('d_kesaR', 'kesaR', 'std'); note('d_kesaR', 'kuro', 'Kesa-giri (R)', 'LIGHT', 'string 1');
  light('d_kesaL', 'kesaL', 'std', { t: [0.07, 0.13, 0.22, 0.44] }); note('d_kesaL', 'both', 'Gyaku-kesa (L)', 'LIGHT', 'string 2 (Kuro) / 3 (Akane)');
  light('d_shomen', 'shomen', 'std', { t: [0.09, 0.16, 0.25, 0.56], a: { dmg: 13, post: 20, kb: 480, stun: 0.48, chain: null } }); note('d_shomen', 'kuro', 'Shomen (down the centre)', 'LIGHT', 'string 3');

  light('ak_dNuki', 'yokoL', 'std', { t: [0.05, 0.12, 0.2, 0.42], end: 'ak_stance', a: { sheath: [0, 0.045] } }, [{ ax: -6, ay: 30, sw: 2.95 }, null, null, { ax: 26, ay: 30, sw: 1.35 }]);
  note('ak_dNuki', 'akane', 'Nukitsuke (L, from the scabbard)', 'LIGHT', 'string 1');
  light('ak_dKesa', 'kesaR', 'std', { t: [0.07, 0.13, 0.22, 0.46], end: 'ak_stance' }); note('ak_dKesa', 'akane', 'Kesa-giri (R)', 'LIGHT', 'string 2');
  light('d_tsukiL3', 'tsuki', 'lunge', { t: [0.09, 0.16, 0.26, 0.58], a: { dmg: 13, post: 20, kb: 500, stun: 0.48, chain: null, lunge: [0.1, 0.2, 560] } }); note('d_tsukiL3', 'akane', 'Tsuki (thrust)', 'LIGHT', 'string 3');
  light('ak_dKiri', 'kiriL', 'rise', { t: [0.07, 0.13, 0.22, 0.5], end: 'ak_stance', a: { sheath: [0, 0.07], knock: true, kb: 240, chain: null } }, [{ ax: -6, ay: 34, sw: 2.95 }]);
  note('ak_dKiri', 'akane', 'Gyaku kiri-age (L, rising from the scabbard)', '← + LIGHT', 'always');

  light('d_tsuki', 'tsuki', 'lunge', { t: [0.07, 0.14, 0.24, 0.46], a: { lunge: [0.04, 0.16, 560], reach: 250, kb: 260 } }); note('d_tsuki', 'both', 'Tsuki (thrust)', '→ + LIGHT', 'always');
  light('d_suneR', 'yokoR', 'low', { t: [0.07, 0.13, 0.22, 0.5], a: { trip: true, knock: true, dmg: 8, post: 16, kb: 220, stun: 0.4, chain: null } }, [{ ay: 30, sw: 2.6 }, { ay: 34, sw: 0.45 }, { ay: 28, sw: -2.7 }, { ay: 34, sw: 1.7 }]);
  note('d_suneR', 'kuro', 'Sune-gari (low, R)', '← + LIGHT', 'always');
  heavy('d_men', 'shomen', 'heavy'); note('d_men', 'both', 'Men (big vertical)', 'HEAVY', 'default');
  heavy('d_kiriUp', 'kiriR', 'rise', { t: [0.1, 0.18, 0.27, 0.38, 0.64], a: { dmg: 10, post: 20, kb: 80, stun: 0.5, launch: true, knock: undefined, heavyClass: undefined, chain: [0.29, 0.64], lunge: [0.18, 0.27, 320], glint: undefined, sw: 0.2, pw: 1.2 } });
  note('d_kiriUp', 'both', 'Kiri-age launcher (R)', '→ + HEAVY', 'always');
  heavy('d_kesaH', 'kesaL', 'heavy', { a: { gcrush: 1.4, dmg: 18, post: 38 } }); note('d_kesaH', 'kuro', 'Gyaku-kesa heavy (L, guard crush)', '← + HEAVY', 'always');
  light('d_dashR', 'yokoR', 'lunge', { t: [0.05, 0.12, 0.22, 0.44], a: { lunge: [0, 0.14, 560], kb: 320, stun: 0.42, dmg: 11, chain: null } }); note('d_dashR', 'both', 'Running yoko (R)', 'dash + LIGHT', 'always');


  light('d_kote', 'shomen', 'small', { t: [0.055, 0.11, 0.19, 0.4], a: { dmg: 8, kb: 200, lunge: [0.05, 0.12, 120] } }, [{ ax: 14, ay: -38, sw: -1.55 }, { ax: 40, ay: 6, sw: 0.45 }, { ax: 36, ay: 22, sw: 0.85 }]);
  note('d_kote', 'both', 'Kote-uchi (wrist cut, short)', 'LIGHT', 'opponent very close');
  light('d_tobikomi', 'tsuki', 'lunge', { t: [0.08, 0.15, 0.26, 0.5], a: { lunge: [0.03, 0.17, 820], reach: 290, dmg: 10, kb: 300 } }, [{ hy: -70, lean: 0.3 }, { hx: 40, f1x: 104 }]);
  note('d_tobikomi', 'both', 'Tobikomi-zuki (leaping thrust)', 'LIGHT', 'opponent far');
  light('d_doL', 'yokoL', 'low', { t: [0.07, 0.13, 0.22, 0.46] }, [{ ay: 14 }, { ay: 20, sw: 0.18 }, { ay: 26 }]);
  note('d_doL', 'both', 'Do-giri (L, under the guard)', 'LIGHT', 'opponent guarding');
  light('d_antiL', 'kiriV', 'rise', { t: [0.07, 0.13, 0.23, 0.48], a: { knock: true, kb: 260, dmg: 10, chain: null } }, [null, { ax: 34, ay: -40, sw: -1.2 }, { ax: 12, ay: -54, sw: -1.8 }]);
  note('d_antiL', 'both', 'Sora-giri (rising, anti-air)', 'LIGHT', 'opponent in the air');
  light('d_wallL', 'tsuki', 'lunge', { t: [0.08, 0.15, 0.3, 0.56], a: { dmg: 12, stun: 0.7, kb: 120, chain: null, lunge: [0.06, 0.17, 600], onHit: (f, o) => { if (Math.abs(o.x) > ND.ARENA - 140) { fx.text(o.x, -205, 'PINNED!', '#ffd27a'); cam.punch(8); o.vx = 0; } } } });
  note('d_wallL', 'both', 'Kabe-zuki (pinning thrust)', 'LIGHT', 'opponent backed to a wall');
  light('d_oikomi', 'yokoR', 'lunge', { t: [0.07, 0.14, 0.24, 0.48], a: { lunge: [0.04, 0.18, 420], kb: 300 } });
  note('d_oikomi', 'both', 'Oikomi (wide R, pressing)', 'LIGHT', 'opponent unarmed');
  heavy('d_kabuto', 'shomen', 'hop', { t: [0.16, 0.26, 0.34, 0.48, 0.86], a: { dmg: 26, post: 50, kb: 460, lunge: [0.22, 0.36, 520] } }, [{ ay: -56, sw: -2.15 }, { ay: 18, sw: 0.95 }, { ay: 44, sw: 1.4 }]);
  note('d_kabuto', 'both', 'Kabuto-wari (helmet splitter)', 'HEAVY', 'opponent staggered / guard broken (disarms)');
  heavy('d_antiH', 'kiriR', 'rise', { t: [0.16, 0.24, 0.32, 0.44, 0.78], a: { dmg: 18, launch: true, knock: undefined, kb: 120, lunge: [0.24, 0.33, 300] } }, [null, { ax: 40, ay: -34, sw: -1.0 }, { ax: 10, ay: -54, sw: -2.0 }]);
  note('d_antiH', 'both', 'Ten-giri (heavy rising, anti-air)', 'HEAVY', 'opponent in the air');
  heavy('d_kaiten', 'yokoL', 'spin', { t: [0.14, 0.2, 0.3, 0.44, 0.8], a: { spin: [0.05, 0.25, 1], zone: [150, 40, 120], dmg: 18, kb: 380, lunge: [0.18, 0.32, 520] } });
  note('d_kaiten', 'both', 'Kaiten-giri (spinning, off the wall)', 'HEAVY', 'own back to a wall');
  P('dz_taiA', { hx: -10, hy: -76, lean: 0.06, hd: 0.1, ax: 20, ay: 0, sw: -1.2, f1x: 18, f2x: -34 });
  P('dz_taiB', { hx: 22, hy: -68, lean: 0.62, hd: 0.3, ax: 12, ay: 4, sw: -1.35, f1x: 62, f2x: -26 });
  reg('d_taiatari', { keys: [[0.14, 'dz_taiA', es], [0.26, 'dz_taiA'], [0.33, 'dz_taiB', eq], [0.46, 'dz_taiB'], [0.76, 'stance', ei]],
    active: [0.3, 0.4], dmg: 9, post: 46, gcrush: 1.5, kb: 520, stun: 0.6, lunge: [0.26, 0.38, 640], kind: 'kick', limb: 'sh', limbR: 22, parry: true, sw: 0.27, pw: 1.3,
    dz3: { side: 0, v: 'level', dir: 'body' }, z3: [[0, ...REST], [0.14, -0.6, -0.3, 1, 0.85], [0.33, -0.9, -0.4, 1, 0.9], [0.76, ...REST]] });
  note('d_taiatari', 'both', 'Tai-atari (shoulder check)', 'HEAVY', 'opponent very close');
  heavy('d_nagare', 'kesaL', 'lunge', { t: [0.14, 0.22, 0.32, 0.46, 0.84], a: { lunge: [0.12, 0.34, 620], dmg: 20 } });
  note('d_nagare', 'both', 'Nagare-giri (running gyaku-kesa)', 'HEAVY', 'opponent far');

  P('dz_hizaA', { hx: 2, hy: -84, lean: 0.06, hd: 0.08, ax: 30, ay: 10, sw: -0.9, f1x: 16, f1y: -34, f2x: -24 });
  P('dz_hizaB', { hx: 16, hy: -94, lean: -0.08, hd: 0.0, ax: 34, ay: 18, sw: -0.6, f1x: 30, f1y: -64, f2x: -14, f2y: -6 });
  reg('d_hiza', { keys: [[0.08, 'dz_hizaA', es], [0.14, 'dz_hizaB', eq], [0.22, 'dz_hizaB'], [0.44, 'stance', ei]],
    active: [0.1, 0.18], dmg: 7, post: 30, kb: 380, stun: 0.42, kind: 'kick', limb: 'knF', limbR: 12, chain: [0.2, 0.44], lunge: [0.06, 0.14, 160],
    dz3: { side: 0, v: 'up', dir: 'knee' }, z3: [[0, ...REST], [0.08, 0.2, 0.3, 1, 1], [0.14, -0.2, -0.3, 1, 1], [0.44, ...REST]] });
  note('d_hiza', 'both', 'Hiza-geri (knee)', 'KICK', 'opponent very close');
  P('dz_kakaA', { hx: -8, hy: -86, lean: -0.22, hd: -0.05, ax: 10, ay: 20, sw: 0.9, grip: 0, gx: -18, gy: 10, f1x: 30, f1y: -124, f2x: -22 });
  P('dz_kakaB', { hx: 8, hy: -74, lean: 0.24, hd: 0.15, ax: 12, ay: 30, sw: 1.0, grip: 0, gx: -16, gy: 18, f1x: 66, f1y: -36, f2x: -24 });
  reg('d_kakato', { keys: [[0.16, 'dz_kakaA', es], [0.24, 'dz_kakaB', eqd], [0.3, 'dz_kakaB'], [0.56, 'stance', ei]],
    active: [0.2, 0.28], dmg: 8, post: 40, gcrush: 1.6, kb: 300, stun: 0.5, kind: 'kick', limb: 'ftF', limbR: 12, lunge: [0.14, 0.24, 200],
    dz3: { side: 0, v: 'down', dir: 'axe' }, z3: [[0, ...REST], [0.16, 0.3, 0.5, 1, 1], [0.24, -0.1, -0.2, 1, 1], [0.56, ...REST]] });
  note('d_kakato', 'both', 'Kakato-otoshi (axe kick, guard crush)', 'KICK', 'opponent guarding');
  P('dz_barA', { hx: 0, hy: -54, lean: 0.5, hd: 0.25, ax: 20, ay: 30, sw: -0.6, f1x: 26, f2x: -34 });
  P('dz_barB', { hx: 4, hy: -44, lean: 0.55, hd: 0.3, ax: 24, ay: 30, sw: -0.5, f1x: 96, f1y: -4, f2x: -34 });
  reg('d_ashibarai', { keys: [[0.1, 'dz_barA', es], [0.18, 'dz_barB', eq], [0.26, 'dz_barB'], [0.52, 'stance', ei]],
    active: [0.13, 0.22], dmg: 6, post: 20, kb: 160, stun: 0.5, knock: true, trip: true, kind: 'kick', limb: 'ftF', limbR: 14, lunge: [0.08, 0.16, 200],
    dz3: { side: 0, v: 'low', dir: 'sweep' }, z3: [[0, ...REST], [0.1, 0.3, 0.4, 1, 1], [0.18, -0.4, -0.6, 1, 1], [0.52, ...REST]] });
  note('d_ashibarai', 'both', 'Ashi-barai (foot sweep)', 'KICK', 'opponent unarmed');



  light('ak_tsubame1', 'kesaR', 'std', { t: [0.07, 0.13, 0.17, 0.2] });
  P('dz_tsubSa', mk(Object.assign({}, BODY.rise[1], ARM.kiriL[1]))); P('dz_tsubFa', mk(Object.assign({}, BODY.rise[2], ARM.kiriL[2])));
  reg('ak_tsubame', { keys: [[0.07, 'dz_ak_tsubame1W', es], [0.13, 'dz_ak_tsubame1S', eq], [0.19, 'dz_ak_tsubame1F', eo], [0.27, 'dz_tsubSa', eq], [0.35, 'dz_tsubFa', eo], [0.62, 'ak_stance', ei]],
    active: [0.09, 0.15], hits: [[0.09, 0.15], [0.23, 0.29]], sides: [1, -1], dmg: 8, post: 14, kb: 180, stun: 0.42, knockLast: true, lastHit: { dmg: 11, kb: 420, post: 20 },
    lunge: [0.06, 0.3, 240], sw: 0.08, pw: 1.2, kind: 'blade', sheath: [0, 0.04], dz3: { side: 1, v: 'down', dir: 'kesaR' },
    z3: [[0, ...REST], [0.07, ...Z3.kesaR[0]], [0.13, ...Z3.kesaR[1]], [0.19, ...Z3.kesaR[2]], [0.27, ...Z3.kiriL[1]], [0.35, ...Z3.kiriL[2]], [0.62, ...REST]] });
  note('ak_tsubame', 'akane', 'Tsubame-gaeshi (kesa down, then straight back up)', '← → + LIGHT', 'combo');
  P('dz_kageA', { hx: -16, hy: -64, lean: 0.38, hd: -0.05, ax: 2, ay: 44, sw: 2.9, grip: 0, gx: -4, gy: 44, f1x: 16, f2x: -46 });
  light('ak_kage2', 'yokoL', 'lunge', { t: [0.2, 0.27, 0.36, 0.62] });
  reg('ak_kage', { keys: [[0.06, 'ak_tsuka', eo], [0.14, 'dz_kageA', es], [0.2, 'dz_ak_kage2W', eqd], [0.235, 'dz_ak_kage2M', eqd], [0.27, 'dz_ak_kage2S', eq], [0.36, 'dz_ak_kage2F', eo], [0.62, 'ak_stance', ei]],
    active: [0.22, 0.31], dmg: 12, post: 20, kb: 320, stun: 0.5, lunge: [0, 0.1, -300], lunge2: [0.19, 0.3, 980], sw: 0.21, pw: 1.3, kind: 'blade', sheath: [0, 0.19], glint: [0.08, 0.2],
    dz3: { side: -1, v: 'level', dir: 'yokoL' }, z3: [[0, ...REST], [0.14, 0.3, 0.1, 1, 1], [0.2, ...Z3.yokoL[0]], [0.235, ...ZMID.yokoL], [0.27, ...Z3.yokoL[1]], [0.36, ...Z3.yokoL[2]], [0.62, ...REST]] });
  note('ak_kage', 'akane', 'Kage-iai (feint, step back, then a lunging draw from the left)', '→ ← + LIGHT', 'combo');
  heavy('ak_ryusei', 'shomen', 'hop', { t: [0.14, 0.24, 0.33, 0.46, 0.84], end: 'ak_stance', a: { dmg: 22, lunge: [0.18, 0.35, 700], sheath: [0, 0.1] } }, [{ ay: -58, sw: -2.3, hy: -104 }, null, null]);
  note('ak_ryusei', 'akane', 'Ryusei (leaping draw from above)', '→ ← + HEAVY', 'combo');
  P('dz_makiTA', { hx: -6, hy: -64, lean: 0.36, hd: 0.1, ax: 4, ay: 42, sw: 2.7, grip: 1, f1x: 34, f2x: -36 });
  P('dz_makiTB', { hx: 18, hy: -74, lean: 0.36, hd: 0.1, ax: 50, ay: -6, sw: -0.55, f1x: 62, f2x: -26 });
  P('dz_makiTC', { hx: 14, hy: -84, lean: 0.1, hd: -0.12, ax: 32, ay: -46, sw: -1.55, f1x: 62, f2x: -24 });
  reg('ak_maki', { keys: [[0.12, 'dz_makiTA', es], [0.2, 'dz_makiTA'], [0.27, 'dz_makiTB', eq], [0.36, 'dz_makiTC', eo], [0.7, 'ak_stance', ei]],
    active: [0.23, 0.32], dmg: 6, post: 30, kb: 200, stun: 0.6, lunge: [0.18, 0.3, 520], sw: 0.22, pw: 1.4, kind: 'blade', sheath: [0, 0.12], glint: [0.06, 0.2],
    disarm: true, kiCost: D.T.disarmKi, dz3: { side: 1, v: 'up', dir: 'kiriR' },
    z3: [[0, ...REST], [0.12, 0.8, 0.3, 1, 0.9], [0.2, 0.8, 0.3, 1, 0.9], [0.27, 0, 0, 0.4, 1], [0.36, -0.6, -0.3, -1, 0.85], [0.7, ...REST]] });
  note('ak_maki', 'akane', 'Maki-otoshi (wraps the blade and flings it: DISARM, 50 ki)', '← → + HEAVY', 'combo');

  light('kr_kuruma', 'yokoR', 'spin', { t: [0.1, 0.2, 0.3, 0.58], a: { spin: [0.08, 0.24, 1], zone: [160, 50, 120], dmg: 11, kb: 340, stun: 0.45, chain: null, lunge: [0.1, 0.24, 300] } });
  note('kr_kuruma', 'kuro', 'Kuruma-giri (spinning wheel cut, R)', '← → + LIGHT', 'combo');
  light('kr_nagi', 'yokoL', 'back', { t: [0.1, 0.18, 0.28, 0.6], a: { trip: true, knock: true, dmg: 9, kb: 220, stun: 0.45, chain: null, lunge: [0, 0.09, -320], lunge2: [0.12, 0.2, 440] } }, [{ ay: 30 }, { ay: 36, sw: 0.4 }, { ay: 30 }, { ay: 30 }]);
  note('kr_nagi', 'kuro', 'Nagi-harai (step back, long low reap, L)', '→ ← + LIGHT', 'combo');
  heavy('kr_iwa', 'shomen', 'heavy', { t: [0.24, 0.36, 0.45, 0.6, 0.98], a: { dmg: 26, gcrush: 1.7, post: 52, ev: [[0.45, (f) => { fx.dust(f.x + f.dir * 110, 0, 14, 1.5); fx.ring(f.x + f.dir * 110, -4, '255,236,190', 120); cam.punch(9); au.thud(1.2, f.pan); }]] } }, [{ ay: -56, sw: -2.4 }, { ay: 30, sw: 1.15 }, { ay: 46, sw: 1.45 }]);
  note('kr_iwa', 'kuro', 'Iwa-kudaki (rock splitter, guard crush)', '→ ← + HEAVY', 'combo');
  P('dz_uchiA', { hx: -8, hy: -86, lean: -0.1, hd: -0.12, ax: 10, ay: -52, sw: -1.7, f1x: 24, f2x: -30 });
  P('dz_uchiB', { hx: 22, hy: -60, lean: 0.62, hd: 0.3, ax: 46, ay: 34, sw: 1.05, f1x: 74, f2x: -24 });
  reg('kr_uchi', { keys: [[0.16, 'dz_uchiA', es], [0.26, 'dz_uchiA'], [0.33, 'dz_uchiB', eqd], [0.46, 'dz_uchiB'], [0.8, 'stance', ei]],
    active: [0.28, 0.37], dmg: 8, post: 34, kb: 260, stun: 0.6, lunge: [0.24, 0.34, 460], sw: 0.27, pw: 1.6, kind: 'blade', glint: [0.08, 0.26],
    disarm: true, kiCost: D.T.disarmKi, dz3: { side: 0, v: 'down', dir: 'shomen' },
    z3: [[0, ...REST], [0.16, 0.15, 0, 0.3, 0.85], [0.33, 0, 0, 0.5, 1], [0.8, ...REST]] });
  note('kr_uchi', 'kuro', 'Uchi-otoshi (smashes the blade down: DISARM, 50 ki)', '← → + HEAVY', 'combo');


  P('dz_makiA', { hx: 4, hy: -70, lean: 0.34, hd: 0.15, ax: 40, ay: 18, sw: 0.6, f1x: 44, f2x: -34 });
  P('dz_makiB', { hx: 12, hy: -82, lean: 0.12, hd: -0.05, ax: 44, ay: -36, sw: -1.1, f1x: 50, f2x: -30 });
  P('dz_makiC', { hx: 8, hy: -84, lean: 0.04, hd: -0.12, ax: 20, ay: -50, sw: -1.9, f1x: 50, f2x: -30 });
  P('dz_bindPress', { hx: -2, hy: -72, lean: 0.34, hd: 0.2, ax: 34, ay: -4, sw: -0.55, f1x: 40, f2x: -36 });
  P('dz_flung', { hx: -16, hy: -80, lean: -0.38, hd: -0.32, ax: -8, ay: -46, sw: -2.2, grip: 0, gx: -26, gy: -22, f1x: 16, f2x: -38 });



  const U = (name, o) => P(name, Object.assign({ grip: 0 }, o));
  U('ua_stance', { hx: -2, hy: -78, lean: 0.14, hd: 0.08, ax: 24, ay: -12, sw: -0.35, gx: 16, gy: -6, f1x: 24, f2x: -28 });
  U('ua_guard', { hx: -6, hy: -76, lean: 0.06, hd: 0.18, ax: 20, ay: -16, sw: -1.25, gx: 12, gy: -12, f1x: 20, f2x: -32 });
  U('ua_jabA', { hx: 0, hy: -78, lean: 0.18, hd: 0.1, ax: 18, ay: -8, sw: -0.3, gx: 14, gy: -8, f1x: 26, f2x: -28 });
  U('ua_jabB', { hx: 10, hy: -76, lean: 0.32, hd: 0.12, ax: 56, ay: -14, sw: -0.22, gx: 14, gy: -10, f1x: 42, f2x: -26 });
  U('ua_crossA', { hx: -2, hy: -78, lean: 0.1, hd: 0.08, ax: 22, ay: -16, sw: -0.4, gx: 2, gy: -2, f1x: 26, f2x: -30 });
  U('ua_crossB', { hx: 12, hy: -74, lean: 0.4, hd: 0.15, ax: 10, ay: -18, sw: -0.9, gx: 56, gy: -10, f1x: 42, f2x: -24 });
  U('ua_elbowA', { hx: -2, hy: -78, lean: 0.12, hd: 0.08, ax: -4, ay: -12, sw: 2.6, gx: 16, gy: -10, f1x: 26, f2x: -28 });
  U('ua_elbowB', { hx: 14, hy: -74, lean: 0.48, hd: 0.15, ax: 4, ay: -24, sw: -2.6, gx: 14, gy: -12, f1x: 44, f2x: -24 });
  U('ua_upperA', { hx: -2, hy: -62, lean: 0.42, hd: 0.2, ax: 14, ay: 26, sw: -1.0, gx: 16, gy: -10, f1x: 30, f2x: -32 });
  U('ua_upperB', { hx: 10, hy: -90, lean: -0.12, hd: -0.2, ax: 30, ay: -42, sw: -1.4, gx: 12, gy: -14, f1x: 36, f2x: -24, f2y: -6 });
  U('ua_palmA', { hx: -10, hy: -74, lean: 0.06, hd: 0.06, ax: -6, ay: 8, sw: -0.2, gx: -10, gy: 10, f1x: 20, f2x: -34 });
  U('ua_palmB', { hx: 26, hy: -66, lean: 0.55, hd: 0.2, ax: 58, ay: -4, sw: -1.4, gx: 52, gy: 8, f1x: 84, f2x: -30 });
  U('ua_kneeA', { hx: 2, hy: -82, lean: 0.12, hd: 0.1, ax: 40, ay: -6, sw: 0.4, gx: 36, gy: -4, f1x: 18, f1y: -36, f2x: -24 });
  U('ua_kneeB', { hx: 16, hy: -92, lean: -0.06, hd: 0.05, ax: 36, ay: 14, sw: 1.3, gx: 30, gy: 16, f1x: 30, f1y: -66, f2x: -12, f2y: -4 });
  U('ua_frontA', { hx: -4, hy: -82, lean: -0.06, hd: 0.06, ax: 22, ay: -18, sw: -0.6, gx: 14, gy: -12, f1x: 16, f1y: -48, f2x: -22 });
  U('ua_frontB', { hx: -12, hy: -84, lean: -0.32, hd: 0.12, ax: 18, ay: -16, sw: -0.8, gx: 8, gy: -14, f1x: 86, f1y: -70, f2x: -22 });
  U('ua_roundA', { hx: -4, hy: -82, lean: -0.1, hd: 0.06, ax: 20, ay: -20, sw: -0.8, gx: 10, gy: -16, f1x: 30, f1y: -84, f2x: -22 });
  U('ua_roundB', { hx: -14, hy: -84, lean: -0.5, hd: 0.15, ax: 10, ay: -26, sw: -1.2, gx: -6, gy: -14, f1x: 90, f1y: -110, f2x: -20 });
  U('ua_spinA', { hx: 4, hy: -74, lean: 0.4, hd: 0.2, ax: 14, ay: -6, sw: -0.4, gx: 10, gy: -10, f1x: 18, f2x: -30 });
  U('ua_spinB', { hx: -10, hy: -80, lean: -0.55, hd: 0.1, ax: 6, ay: -20, sw: -0.9, gx: -8, gy: -12, f1x: 96, f1y: -62, f2x: -18 });
  U('ua_sweepA', { hx: -2, hy: -42, lean: 0.62, hd: 0.3, ax: 22, ay: 46, sw: 1.3, gx: 30, gy: 44, f1x: 30, f2x: -36 });
  U('ua_sweepB', { hx: 0, hy: -36, lean: 0.55, hd: 0.3, ax: 20, ay: 48, sw: 1.3, gx: 26, gy: 46, f1x: 98, f1y: -6, f2x: -36 });
  U('ua_bfA', { hx: 0, hy: -78, lean: 0.24, hd: 0.15, ax: 0, ay: -6, sw: 2.8, gx: 16, gy: -8, f1x: 28, f2x: -28 });
  U('ua_bfB', { hx: 12, hy: -76, lean: 0.24, hd: 0.06, ax: 52, ay: -22, sw: -0.55, gx: 10, gy: -10, f1x: 46, f2x: -24 });
  U('ua_lungeA', { hx: -8, hy: -76, lean: 0.12, hd: 0.08, ax: 10, ay: -6, sw: -0.3, gx: 12, gy: -8, f1x: 22, f2x: -32 });
  U('ua_lungeB', { hx: 34, hy: -68, lean: 0.55, hd: 0.2, ax: 58, ay: -6, sw: -0.12, gx: 4, gy: 4, f1x: 96, f2x: -26 });
  U('ua_airA', { hx: 0, hy: -86, lean: 0.0, hd: 0.06, ax: 20, ay: -20, sw: -0.8, gx: 12, gy: -14, f1x: 20, f1y: -40, f2x: -16, f2y: -24 });
  U('ua_airB', { hx: -6, hy: -86, lean: -0.3, hd: 0.1, ax: 16, ay: -24, sw: -1.0, gx: 0, gy: -14, f1x: 80, f1y: -40, f2x: -18, f2y: -30 });
  U('ua_stompA', { hx: 0, hy: -90, lean: 0.1, hd: 0.2, ax: 22, ay: -12, sw: -0.6, gx: 12, gy: -10, f1x: 18, f1y: -36, f2x: -14, f2y: -26 });
  U('ua_stompB', { hx: 0, hy: -84, lean: 0.25, hd: 0.3, ax: 20, ay: -8, sw: -0.5, gx: 10, gy: -6, f1x: 26, f1y: 12, f2x: -16, f2y: -20 });


  U('ua_duck', { hx: -6, hy: -52, lean: 0.62, hd: 0.4, ax: 18, ay: -12, sw: -1.2, gx: 10, gy: -8, f1x: 30, f2x: -36 });
  U('ua_sway', { hx: -24, hy: -72, lean: -0.5, hd: -0.25, ax: 22, ay: -14, sw: -1.25, gx: 12, gy: -10, f1x: 30, f2x: -44 });
  U('ua_slip', { hx: -14, hy: -84, lean: 0.12, hd: 0.06, ax: 22, ay: -14, sw: -1.2, gx: 12, gy: -10, f1x: 6, f1y: -24, f2x: -34 });
  U('ua_catchA', { hx: 2, hy: -76, lean: 0.24, hd: 0.0, ax: 42, ay: -30, sw: -0.9, gx: 38, gy: -24, f1x: 34, f2x: -30 });
  U('ua_catchB', { hx: 6, hy: -64, lean: 0.46, hd: 0.25, ax: 24, ay: 30, sw: 1.2, gx: 12, gy: 32, f1x: 40, f2x: -36 });
  U('ua_roll', { hx: 4, hy: -40, lean: 1.05, hd: 0.7, ax: 18, ay: 24, sw: 1.2, gx: 10, gy: 26, f1x: 20, f1y: -22, f2x: -6, f2y: -12 });
  U('ua_pickLow', { hx: 2, hy: -46, lean: 0.78, hd: 0.45, ax: 44, ay: 46, sw: 1.0, gx: 2, gy: 30, f1x: 36, f2x: -32 });
  U('ua_pickHigh', { hx: 4, hy: -74, lean: 0.32, hd: 0.2, ax: 46, ay: 8, sw: 0.4, gx: 8, gy: 10, f1x: 40, f2x: -28 });
  U('ua_kiA', { hx: -12, hy: -66, lean: 0.2, hd: 0.0, ax: -8, ay: 14, sw: 0, gx: -12, gy: 14, f1x: 18, f2x: -40 });
  U('ua_win', { hx: 0, hy: -82, lean: 0.06, hd: -0.05, ax: 20, ay: -30, sw: -1.4, gx: 10, gy: 24, f1x: 18, f2x: -22 });

  const ua = (name, o) => reg(name, Object.assign({ kind: 'kick', parry: true, limbR: 11 }, o));
  const UZ = (a, b, c) => [[0, ...REST], ...a.map((k) => [k[0], k[1], k[2], 1, 1]), [b, ...REST]];

  ua('ua_jab', { keys: [[0.05, 'ua_jabA', es], [0.1, 'ua_jabB', eq], [0.16, 'ua_jabB'], [0.34, 'ua_stance', ei]], active: [0.07, 0.13], dmg: 6, post: 9, kb: 180, stun: 0.3,
    limb: 'haF', chain: [0.13, 0.34], lunge: [0.04, 0.1, 220], sw: 0.05, pw: 0.5, z3: UZ([[0.05, 0.25, 0.1], [0.1, -0.45, -0.2]], 0.34) });
  ua('ua_cross', { keys: [[0.06, 'ua_crossA', es], [0.12, 'ua_crossB', eq], [0.18, 'ua_crossB'], [0.38, 'ua_stance', ei]], active: [0.08, 0.15], dmg: 7, post: 11, kb: 220, stun: 0.34,
    limb: 'haB', chain: [0.15, 0.38], lunge: [0.05, 0.12, 200], sw: 0.06, pw: 0.6, z3: UZ([[0.06, -0.4, -0.2], [0.12, 0.75, 0.35]], 0.38) });
  ua('ua_elbow', { keys: [[0.06, 'ua_elbowA', es], [0.12, 'ua_elbowB', eq], [0.18, 'ua_elbowB'], [0.4, 'ua_stance', ei]], active: [0.08, 0.15], dmg: 8, post: 14, kb: 260, stun: 0.38,
    limb: 'elF', limbR: 13, chain: [0.16, 0.4], lunge: [0.05, 0.12, 160], sw: 0.06, pw: 0.6, z3: UZ([[0.06, 0.5, 0.2], [0.12, -0.6, -0.3]], 0.4) });
  ua('ua_upper', { keys: [[0.09, 'ua_upperA', es], [0.17, 'ua_upperB', eq], [0.26, 'ua_upperB'], [0.5, 'ua_stance', ei]], active: [0.12, 0.2], dmg: 9, post: 18, kb: 70, stun: 0.5,
    launch: true, limb: 'haF', limbR: 13, chain: [0.22, 0.5], lunge: [0.08, 0.17, 220], sw: 0.1, pw: 0.8, z3: UZ([[0.09, 0.4, 0.3], [0.17, -0.3, -0.2]], 0.5) });
  ua('ua_bf', { keys: [[0.06, 'ua_bfA', es], [0.14, 'ua_bfB', eq], [0.22, 'ua_bfB'], [0.44, 'ua_stance', ei]], active: [0.1, 0.17], dmg: 7, post: 14, kb: 260, stun: 0.42,
    limb: 'haF', spin: [0.0, 0.12, 1], lunge: [0.04, 0.14, 240], sw: 0.08, pw: 0.7, z3: UZ([[0.06, -0.8, -0.3], [0.14, 0.4, 0.2]], 0.44) });
  ua('ua_lunge', { keys: [[0.06, 'ua_lungeA', es], [0.13, 'ua_lungeB', eq], [0.22, 'ua_lungeB'], [0.46, 'ua_stance', ei]], active: [0.09, 0.16], dmg: 7, post: 12, kb: 300, stun: 0.4,
    limb: 'haF', limbR: 12, chain: [0.18, 0.46], lunge: [0.03, 0.14, 700], sw: 0.05, pw: 0.7, z3: UZ([[0.06, 0.3, 0.2], [0.13, -0.5, -0.3]], 0.46) });

  ua('ua_palm', { keys: [[0.16, 'ua_palmA', es], [0.26, 'ua_palmA'], [0.32, 'ua_palmB', eq], [0.42, 'ua_palmB'], [0.68, 'ua_stance', ei]], active: [0.28, 0.36], dmg: 14, post: 34, kb: 540, stun: 0.6,
    knock: true, limb: 'haF', limbR: 16, lunge: [0.26, 0.36, 560], glint: undefined, sw: 0.27, pw: 1.1, z3: UZ([[0.16, 0.5, 0.3], [0.32, -0.2, -0.1]], 0.68) });
  ua('ua_spinKick', { keys: [[0.14, 'ua_spinA', es], [0.26, 'ua_spinB', eq], [0.34, 'ua_spinB'], [0.64, 'ua_stance', ei]], active: [0.22, 0.31], dmg: 13, post: 30, kb: 480, stun: 0.6,
    knock: true, limb: 'ftF', limbR: 14, spin: [0.03, 0.2, 1], lunge: [0.16, 0.28, 300], sw: 0.2, pw: 1, z3: UZ([[0.14, -0.9, -0.6], [0.26, 0.2, 0.2]], 0.64) });

  ua('ua_front', { keys: [[0.1, 'ua_frontA', es], [0.17, 'ua_frontB', eq], [0.26, 'ua_frontB'], [0.48, 'ua_stance', ei]], active: [0.12, 0.22], dmg: 7, post: 30, kb: 480, stun: 0.44,
    limb: 'ftF', limbR: 12, chain: [0.24, 0.48], lunge: [0.08, 0.16, 160], parry: undefined, z3: UZ([[0.1, 0.2, 0.3], [0.17, 0.0, -0.2]], 0.48) });
  ua('ua_knee', { keys: [[0.07, 'ua_kneeA', es], [0.13, 'ua_kneeB', eq], [0.2, 'ua_kneeB'], [0.42, 'ua_stance', ei]], active: [0.09, 0.16], dmg: 8, post: 22, kb: 360, stun: 0.42,
    limb: 'knF', limbR: 13, chain: [0.18, 0.42], lunge: [0.05, 0.12, 180], parry: undefined, z3: UZ([[0.07, 0.2, 0.3], [0.13, -0.2, -0.3]], 0.42) });
  ua('ua_round', { keys: [[0.12, 'ua_roundA', es], [0.21, 'ua_roundB', eq], [0.29, 'ua_roundB'], [0.56, 'ua_stance', ei]], active: [0.16, 0.25], dmg: 9, post: 34, kb: 420, stun: 0.5,
    limb: 'ftF', limbR: 14, lunge: [0.1, 0.2, 160], parry: undefined, z3: UZ([[0.12, 0.6, 0.5], [0.21, -0.5, -0.6]], 0.56) });
  ua('ua_sweep', { keys: [[0.1, 'ua_sweepA', es], [0.19, 'ua_sweepB', eq], [0.27, 'ua_sweepB'], [0.52, 'ua_stance', ei]], active: [0.14, 0.23], dmg: 6, post: 20, kb: 160, stun: 0.5,
    knock: true, trip: true, limb: 'ftF', limbR: 15, lunge: [0.08, 0.16, 180], parry: undefined, z3: UZ([[0.1, 0.4, 0.4], [0.19, -0.5, -0.7]], 0.52) });

  ua('ua_air', { keys: [[0.06, 'ua_airA', es], [0.12, 'ua_airB', eq], [0.36, 'fall']], active: [0.08, 0.2], dmg: 8, post: 12, kb: 260, stun: 0.4, air: true, limb: 'ftF', limbR: 13, parry: undefined });
  ua('ua_stomp', { keys: [[0.06, 'ua_stompA', es], [0.14, 'ua_stompB', eq], [0.6, 'ua_stompB']], active: [0.08, 0.6], dmg: 9, post: 24, kb: 300, stun: 0.5, knock: true, air: true, limb: 'ftF', limbR: 16, parry: undefined,
    tick(f, dt, t) { if (t > 0.06 && !f.onGround) f.vy = Math.max(f.vy, 1100); if (t > 0.1 && f.onGround) { f.st = 0.6; } } });
  ua('ua_flyknee', { keys: [[0.08, 'ua_kneeA', es], [0.16, 'ua_kneeB', eq], [0.3, 'ua_kneeB'], [0.52, 'ua_stance', ei]], active: [0.12, 0.26], dmg: 11, post: 26, kb: 460, stun: 0.5,
    knock: true, limb: 'knF', limbR: 15, lunge: [0, 0.22, 640], parry: undefined, z3: UZ([[0.08, 0.3, 0.3], [0.16, -0.3, -0.3]], 0.52),
    tick(f, dt, t) { if (!f.mem.fj && t > 0.05) { f.mem.fj = 1; f.onGround = false; f.vy = -520; } } });
  ua('ua_ram', { keys: [[0.12, 'dz_taiA', es], [0.2, 'dz_taiA'], [0.27, 'dz_taiB', eq], [0.38, 'dz_taiB'], [0.62, 'ua_stance', ei]], active: [0.23, 0.32], dmg: 10, post: 40, gcrush: 1.4, kb: 560, stun: 0.6,
    knock: true, limb: 'sh', limbR: 22, lunge: [0.2, 0.3, 700], z3: [[0, ...REST], [0.12, -0.6, -0.3, 1, 1], [0.27, -0.9, -0.4, 1, 1], [0.62, ...REST]] });
  ua('ua_ki', { keys: [[0.16, 'ua_kiA', es], [0.28, 'ua_kiA'], [0.34, 'ua_palmB', eq], [0.5, 'ua_palmB'], [0.8, 'ua_stance', ei]], active: [0.3, 0.42], dmg: 22, post: 60, kb: 640, stun: 0.6,
    knock: true, special: true, limb: 'haF', limbR: 20, lunge: [0.28, 0.42, 1400], glint: [0.1, 0.28], sw: 0.29, pw: 1.5, parry: undefined, kanji: '鉄山靠' });

  const uc = (name, base, o) => ua(name, Object.assign({}, o, { counter: true, kb: (ATK[base] || {}).kb || 240, stun: (ATK[base] || {}).stun || 0.4 }));
  uc('ua_cRip', 'riposte', { keys: [[0.05, 'ua_palmA', eo], [0.11, 'ua_palmB', eq], [0.2, 'ua_palmB'], [0.4, 'ua_stance', ei]], active: [0.07, 0.15], dmg: 10, post: 16, limb: 'haF', limbR: 16, lunge: [0.05, 0.13, 320] });
  uc('ua_cSweep', 'sweep', { keys: [[0.05, 'ua_sweepA', eo], [0.13, 'ua_sweepB', eq], [0.22, 'ua_sweepB'], [0.48, 'ua_stance', ei]], active: [0.08, 0.18], dmg: 8, post: 18, knock: true, trip: true, limb: 'ftF', limbR: 15, lunge: [0.05, 0.14, 300] });
  uc('ua_cSpin', 'mawari', { keys: [[0.06, 'ua_elbowA', eo], [0.16, 'ua_spinA', es], [0.24, 'ua_elbowB', eq], [0.3, 'ua_elbowB'], [0.52, 'ua_stance', ei]], active: [0.2, 0.28], dmg: 10, post: 16, limb: 'elF', limbR: 14,
    spin: [0.04, 0.2, 1], lunge: [0.02, 0.2, 520] });
  uc('ua_cHeavy', 'kaeshiHeavy', { keys: [[0.05, 'ua_palmA', eo], [0.13, 'ua_palmB', eq], [0.26, 'ua_palmB'], [0.5, 'ua_stance', ei]], active: [0.09, 0.19], dmg: 15, post: 30, knock: true, limb: 'haF', limbR: 18, lunge: [0.07, 0.17, 560] });
  uc('ua_cFin', 'finisher', { keys: [[0.04, 'ua_jabA', eo], [0.08, 'ua_jabB', eq], [0.13, 'ua_crossA', es], [0.18, 'ua_crossB', eq], [0.26, 'ua_upperA', es], [0.34, 'ua_upperB', eq], [0.62, 'ua_stance', ei]],
    active: [0.06, 0.1], hits: [[0.06, 0.1], [0.16, 0.2], [0.3, 0.36]], dmg: 7, post: 14, crush: true, knockLast: true, limb: 'haF', limbR: 14, lunge: [0.04, 0.34, 220], lastHit: { limb: 'haF', dmg: 10, kb: 420 } });
  for (const [n, nm] of [['ua_cRip', 'Palm counter'], ['ua_cSweep', 'Sweep counter'], ['ua_cSpin', 'Spinning elbow'], ['ua_cHeavy', 'Heavy palm'], ['ua_cFin', 'Three-punch finish']]) note(n, 'both', nm, 'UNARMED COUNTER', '');
  D.uaCounter = (f, name) => ({ riposte: 'ua_cRip', sweep: 'ua_cSweep', mawari: 'ua_cSpin', kaeshiHeavy: 'ua_cHeavy', finisher: 'ua_cFin' })[name] || null;
  for (const n of ['ua_jab', 'ua_cross', 'ua_elbow', 'ua_upper', 'ua_bf', 'ua_lunge', 'ua_palm', 'ua_spinKick', 'ua_front', 'ua_knee', 'ua_round', 'ua_sweep', 'ua_air', 'ua_stomp', 'ua_flyknee', 'ua_ram', 'ua_ki'])
    note(n, 'both', ({ ua_jab: 'Jab', ua_cross: 'Cross (far hand)', ua_elbow: 'Hiji-ate (elbow)', ua_upper: 'Uppercut (launcher)', ua_bf: 'Spinning backfist', ua_lunge: 'Oi-zuki (lunging punch)',
      ua_palm: 'Teisho (palm strike)', ua_spinKick: 'Ushiro-mawashi (spinning back kick)', ua_front: 'Mae-geri (front kick)', ua_knee: 'Hiza-geri (knee)', ua_round: 'Mawashi-geri (roundhouse)',
      ua_sweep: 'Ashi-barai (low sweep)', ua_air: 'Tobi-geri (flying kick)', ua_stomp: 'Fumikomi (stomp)', ua_flyknee: 'Tobi-hiza (flying knee)', ua_ram: 'Tetsuzan-ko (shoulder ram)', ua_ki: 'Ki palm (unarmed ki)' })[n], 'UNARMED', '');
















  const KICK_ON0 = Object.freeze({ akane: 1, aoi: 1, kuro: 1, yuki: 1, hana: 1, tetsu: 1, ren: 1 }), KICK_ON = Object.assign({}, KICK_ON0);
  { const q = (/[?&]kicks=([a-z,]+|all|0)(&|$)/.exec(location.search || '') || [])[1]; if (q === '0') for (const k of Object.keys(KICK_ON)) delete KICK_ON[k]; else if (q === 'all') for (const id of Object.keys(D.ROSTER)) KICK_ON[id] = 1; else if (q) for (const id of q.split(',')) KICK_ON[id] = 1; }
  D.KICK_ON = KICK_ON;
  const kOn = (id) => (ND.game && ND.game.mode === 'online' ? KICK_ON0 : KICK_ON)[id];
  D.kicksOn = (f) => !!(f && f.ch && kOn(f.ch.id));
  const KZ = (a, b) => [[0, ...REST], ...a, [b, ...REST]];

  const KH = { ax: 10, ay: 12, sw: -1.25 };

  P('dk_swA', Object.assign({ hx: -10, hy: -52, lean: 0.52, hd: 0.28, f1x: 30, f2x: -40 }, KH, { ax: 12, ay: 2, sw: -1.6 }));
  P('dk_swB', Object.assign({ hx: -2, hy: -44, lean: 0.5, hd: 0.3, f1x: 92, f1y: -3, f2x: -42 }, KH, { ax: 14, ay: 6, sw: -1.55 }));
  P('dk_swC', Object.assign({ hx: 2, hy: -46, lean: 0.46, hd: 0.26, f1x: 74, f1y: -2, f2x: -40 }, KH, { ax: 16, ay: 8, sw: -1.5 }));
  reg('dk_sweep', { keys: [[0.1, 'dk_swA', es], [0.19, 'dk_swB', eq], [0.28, 'dk_swC', eo], [0.6, 'stance', ei]],
    active: [0.15, 0.26], dmg: 6, post: 18, kb: 170, stun: 0.5, knock: true, trip: true, low: true, kind: 'kick', limb: 'ftF', limbR: 15, lunge: [0.08, 0.18, 230],
    dz3: { side: 0, v: 'low', dir: 'sweep' }, z3: KZ([[0.1, 0.35, 0.45, 1, 1], [0.19, -0.45, -0.65, 1, 1], [0.28, -0.3, -0.45, 1, 1]], 0.6) });
  note('dk_sweep', 'both', 'Ashi-barai (low sweep)', '↓ + KICK', 'knocks down · jump over it');

  P('dk_spA', Object.assign({ hx: 4, hy: -76, lean: 0.34, hd: 0.2, f1x: 20, f2x: -30 }, KH));
  P('dk_spB', Object.assign({ hx: -12, hy: -84, lean: -0.5, hd: 0.12, f1x: 94, f1y: -78, f2x: -18 }, KH, { ax: 4, ay: 16, sw: -1.4 }));
  reg('dk_spin', { keys: [[0.2, 'dk_spA', es], [0.32, 'dk_spB', eq], [0.44, 'dk_spB'], [0.86, 'stance', ei]],
    active: [0.29, 0.4], dmg: 14, post: 40, gcrush: 1.5, kb: 520, stun: 0.6, knock: true, kind: 'kick', limb: 'ftF', limbR: 14, parry: true, spin: [0.08, 0.28, 1],
    lunge: [0.2, 0.32, 300], sw: 0.27, pw: 1.2, punish: true,
    dz3: { side: 0, v: 'level', dir: 'spinKick' }, z3: KZ([[0.12, -1.3, -0.7, 1, 0.8], [0.2, -1.7, -1.1, -1, 0.7], [0.27, -0.9, -1.2, -1, 0.8], [0.32, 0.25, 0.2, 1, 1], [0.44, 0.15, 0.1, 1, 1]], 0.86) });
  note('dk_spin', 'both', 'Ushiro-mawashi (spinning back kick)', '← + KICK', 'slow, strong, breaks a guard · open if it misses');

  P('dk_wrA', Object.assign({ hx: -2, hy: -84, lean: -0.04, hd: 0.06, f1x: 18, f1y: -52, f2x: -22 }, KH));
  P('dk_wrB', Object.assign({ hx: -10, hy: -86, lean: -0.3, hd: 0.1, f1x: 70, f1y: -108, f2x: -22 }, KH, { ax: 6, ay: 18, sw: -1.35 }));
  reg('dk_wrist', { keys: [[0.07, 'dk_wrA', es], [0.13, 'dk_wrB', eq], [0.21, 'dk_wrB'], [0.46, 'stance', ei]],
    active: [0.1, 0.19], dmg: 5, post: 22, kb: 220, stun: 0.4, kind: 'kick', limb: 'ftF', limbR: 13, lunge: [0.05, 0.12, 180], disarmKick: true,
    dz3: { side: 0, v: 'up', dir: 'wristKick' }, z3: KZ([[0.07, 0.25, 0.3, 1, 1], [0.13, -0.1, -0.2, 1, 1]], 0.46) });
  note('dk_wrist', 'both', 'Kote-geri (wrist kick)', '→ + KICK', 'into a cut\'s wind-up: kicks the sword away');

  P('dk_flyA', Object.assign({ hx: 0, hy: -88, lean: 0.0, hd: 0.06, f1x: 20, f1y: -42, f2x: -16, f2y: -26 }, KH));
  P('dk_flyB', Object.assign({ hx: -6, hy: -88, lean: -0.3, hd: 0.1, f1x: 84, f1y: -44, f2x: -18, f2y: -30 }, KH, { ax: 4, ay: 14, sw: -1.4 }));
  reg('dk_fly', { keys: [[0.06, 'dk_flyA', es], [0.12, 'dk_flyB', eq], [0.36, 'fall']], active: [0.08, 0.22], dmg: 8, post: 16, kb: 300, stun: 0.45, air: true,
    kind: 'kick', limb: 'ftF', limbR: 14 });
  note('dk_fly', 'both', 'Tobi-geri (flying kick)', 'in the air + KICK', '');



  P('ak_ndA', Object.assign({ hx: -2, hy: -82, lean: 0.0, hd: 0.06, f1x: 18, f1y: -40, f2x: -24 }, KH));
  P('ak_ndB', Object.assign({ hx: -6, hy: -82, lean: -0.16, hd: 0.08, f1x: 78, f1y: -34, f2x: -24 }, KH));
  P('ak_ndC', Object.assign({ hx: -4, hy: -86, lean: -0.08, hd: 0.06, f1x: 20, f1y: -62, f2x: -22 }, KH));
  P('ak_ndD', Object.assign({ hx: -12, hy: -86, lean: -0.4, hd: 0.14, f1x: 78, f1y: -112, f2x: -22 }, KH, { ax: 4, ay: 18, sw: -1.4 }));
  reg('ak_nidan', { keys: [[0.06, 'ak_ndA', es], [0.11, 'ak_ndB', eq], [0.17, 'ak_ndC', es], [0.23, 'ak_ndD', eq], [0.32, 'ak_ndD'], [0.58, 'ak_stance', ei]],
    active: [0.09, 0.14], hits: [[0.09, 0.14], [0.21, 0.28]], dmg: 5, post: 16, kb: 160, stun: 0.42, knockLast: true, lastHit: { dmg: 8, kb: 440, post: 22 },
    kind: 'kick', limb: 'ftF', limbR: 13, lunge: [0.04, 0.22, 220],
    dz3: { side: 0, v: 'up', dir: 'doubleKick' }, z3: KZ([[0.06, 0.2, 0.3, 1, 1], [0.11, -0.1, -0.2, 1, 1], [0.17, 0.15, 0.25, 1, 1], [0.23, -0.2, -0.3, 1, 1]], 0.58) });
  note('ak_nidan', 'akane', 'Nidan-geri (double kick, low then high)', '← → + KICK', 'her own kick');


  U('dk_kuA', { hx: -8, hy: -76, lean: 0.2, hd: 0.2, ax: 22, ay: -10, sw: -0.8, gx: 12, gy: -8, f1x: 34, f1y: -2, f2x: -30 });
  U('dk_kuB', { hx: -4, hy: -82, lean: -0.08, hd: 0.0, ax: 30, ay: -34, sw: -1.3, gx: 14, gy: -16, f1x: 30, f1y: -44, f2x: -26 });
  U('dk_kuC', { hx: -2, hy: -80, lean: 0.06, hd: -0.05, ax: 34, ay: -44, sw: -1.5, gx: 16, gy: -20, f1x: 26, f2x: -28 });
  reg('dk_kickup', { keys: [[0.08, 'dk_kuA', es], [0.15, 'dk_kuB', eq], [0.27, 'dk_kuC', eo], [0.44, 'ua_stance', ei]], kind: 'kick', limb: 'ftF', limbR: 10,
    ev: [[0.13, (f) => D.kickUp && D.kickUp(f, 'flick')], [0.29, (f) => D.kickUp && D.kickUp(f, 'catch')]],
    dz3: { side: 0, v: 'up', dir: 'kickUp' }, z3: KZ([[0.08, 0.2, 0.2, 1, 1], [0.15, -0.1, -0.1, 1, 1]], 0.44) });
  note('dk_kickup', 'both', 'Keri-age (kicks the own sword up into the hand)', 'KICK', 'unarmed, standing at the own sword');

  const K = (o) => Object.assign({}, KH, o);

  const hop = (t0, vy, vx = 0) => function (f, dt, t) { if (!f.mem.hop && t > t0) { f.mem.hop = 1; f.onGround = false; f.vy = vy; if (vx) f.vx = f.dir * vx; } };
  const sig = (name, who, keys, o, nm, when) => { reg(name, Object.assign({ keys, kind: 'kick', limb: 'ftF', limbR: 14, dz3: { side: 0, v: 'level', dir: 'sigKick' } }, o)); note(name, who, nm, '← → + KICK', when || 'own kick'); return name; };

  P('ao_kzA', K({ hx: -4, hy: -80, lean: 0.1, hd: 0.06, ax: -8, ay: 0, sw: -2.3, f1x: 26, f1y: -46, f2x: -26 }));
  P('ao_kzB', K({ hx: -16, hy: -84, lean: -0.48, hd: 0.14, ax: -14, ay: -4, sw: -2.5, f1x: 98, f1y: -76, f2x: -26 }));
  sig('ao_kaze', 'aoi', [[0.1, 'ao_kzA', es], [0.2, 'ao_kzB', eq], [0.3, 'ao_kzB'], [0.6, 'ao_stance', ei]],
    { active: [0.17, 0.27], dmg: 10, post: 26, kb: 560, stun: 0.5, lunge: [0.04, 0.19, 640], z3: KZ([[0.1, 0.4, 0.5, -1, 0.8], [0.2, -0.2, -0.4, -1, 0.8]], 0.6) },
    'Kaze-geri (gliding side kick)');

  P('kr_ygA', K({ hx: -10, hy: -84, lean: -0.1, hd: 0.05, ax: 0, ay: -20, sw: -1.9, f1x: 20, f1y: -62, f2x: -30 }));
  P('kr_ygB', K({ hx: 6, hy: -80, lean: -0.22, hd: 0.12, ax: -4, ay: -16, sw: -2.0, f1x: 96, f1y: -60, f2x: -26 }));
  sig('kr_yama', 'kuro', [[0.18, 'kr_ygA', es], [0.3, 'kr_ygB', eq], [0.42, 'kr_ygB'], [0.82, 'stance', ei]],
    { active: [0.26, 0.36], dmg: 12, post: 48, gcrush: 1.7, kb: 640, stun: 0.6, knock: true, lunge: [0.2, 0.32, 420], z3: KZ([[0.18, 0.3, 0.3, 1, 1], [0.3, -0.2, -0.2, 1, 1]], 0.82) },
    'Yama-geri (stamping push kick, breaks a guard)');

  P('yk_ktA', K({ hx: 0, hy: -90, lean: 0.0, hd: 0.06, ax: 14, ay: 6, sw: -1.2, f1x: 20, f1y: -46, f2x: -14, f2y: -28 }));
  P('yk_ktB', K({ hx: -4, hy: -90, lean: -0.24, hd: 0.08, ax: 10, ay: 10, sw: -1.3, f1x: 80, f1y: -52, f2x: -14, f2y: -30 }));
  P('yk_ktC', K({ hx: -4, hy: -92, lean: -0.1, hd: 0.06, ax: 12, ay: 8, sw: -1.3, f1x: 16, f1y: -54, f2x: 20, f2y: -50 }));
  P('yk_ktD', K({ hx: -8, hy: -92, lean: -0.36, hd: 0.1, ax: 8, ay: 12, sw: -1.4, f1x: 22, f1y: -48, f2x: 84, f2y: -64 }));
  sig('yk_kitsune', 'yuki', [[0.06, 'yk_ktA', es], [0.11, 'yk_ktB', eq], [0.17, 'yk_ktC', es], [0.22, 'yk_ktD', eq], [0.34, 'yk_ktD'], [0.5, 'fall']],
    { hits: [[0.09, 0.14], [0.2, 0.27]], active: [0.09, 0.14], dmg: 5, post: 14, kb: 200, stun: 0.4, knockLast: true, lastHit: { dmg: 7, kb: 420, limb: 'ftB' }, air: true,
      lunge: [0.0, 0.12, 320], tick: hop(0.03, -300, 260) },
    'Kitsune-tobi (hop, two kicks in the air)');

  P('hn_sgA', K({ hx: 0, hy: -70, lean: 0.6, hd: 0.3, ax: 30, ay: 40, sw: 1.2, gx: 24, gy: 42, f1x: 30, f2x: -30 }));
  P('hn_sgB', K({ hx: 4, hy: -126, lean: 0.1, hd: 0.06, ax: 20, ay: 8, sw: -1.2, f1x: 60, f1y: -60, f2x: -40, f2y: -40 }));
  P('hn_sgC', K({ hx: 8, hy: -80, lean: 0.3, hd: 0.15, ax: 22, ay: 12, sw: -1.1, f1x: 74, f1y: -20, f2x: -20 }));
  sig('hn_sakura', 'hana', [[0.08, 'hn_sgA', es], [0.22, 'hn_sgB', es], [0.3, 'hn_sgC', eq], [0.38, 'hn_sgC'], [0.62, 'stance', ei]],
    { active: [0.26, 0.34], dmg: 11, post: 34, gcrush: 1.3, kb: 380, stun: 0.55, knock: true, lunge: [0.06, 0.26, 360], rollT: [0.06, 0.28], tick: hop(0.05, -520, 240), z3: KZ([[0.08, 0.3, 0.3, 1, 1], [0.3, -0.2, -0.2, 1, 1]], 0.62) },
    'Sakura-guruma (flip, the heel falls from above)');

  P('tt_vtA', K({ hx: -8, hy: -76, lean: 0.24, hd: 0.1, ax: 34, ay: 30, sw: -1.5, f1x: 24, f2x: -32 }));
  P('tt_vtB', K({ hx: 6, hy: -100, lean: -0.3, hd: 0.06, ax: 40, ay: 30, sw: -1.55, f1x: 54, f1y: -66, f2x: 44, f2y: -60 }));
  P('tt_vtC', K({ hx: 0, hy: -96, lean: -0.5, hd: 0.12, ax: 36, ay: 28, sw: -1.5, f1x: 82, f1y: -64, f2x: 76, f2y: -54 }));
  sig('tt_vault', 'tetsu', [[0.14, 'tt_vtA', es], [0.26, 'tt_vtB', es], [0.34, 'tt_vtC', eq], [0.44, 'tt_vtC'], [0.86, 'stance', ei]],
    { active: [0.3, 0.42], dmg: 14, post: 40, kb: 620, stun: 0.6, knock: true, lunge: [0.14, 0.36, 460], tick: hop(0.2, -380, 90), limbR: 16, z3: KZ([[0.14, 0.2, 0.2, 1, 1], [0.34, 0, 0, 1, 1]], 0.86) },
    'Bo-tobi (vaults on the naginata, two-foot kick)');

  P('rn_ofA', K({ hx: 6, hy: -86, lean: 0.0, hd: 0.06, ax: 4, ay: -6, sw: -2.4, f1x: 30, f1y: -64, f2x: -20 }));
  P('rn_ofB', K({ hx: 8, hy: -82, lean: -0.3, hd: 0.12, ax: 2, ay: -8, sw: -2.45, f1x: 90, f1y: -72, f2x: -24 }));
  sig('rn_oni', 'ren', [[0.07, 'rn_ofA', eq], [0.14, 'rn_ofA'], [0.24, 'rn_ofB', eq], [0.34, 'rn_ofB'], [0.62, 'rn_stance', ei]],
    { hits: [[0.07, 0.13], [0.22, 0.3]], active: [0.07, 0.13], dmg: 5, post: 22, kb: 160, stun: 0.45, knockLast: true, lastHit: { dmg: 8, kb: 600, post: 40, gcrush: 1.5, limb: 'ftF' },
      limb: 'knF', lunge: [0.04, 0.26, 260], z3: KZ([[0.07, 0.2, 0.3, 1, 1], [0.24, -0.25, -0.3, 1, 1]], 0.62) },
    'Oni-fumikomi (knee, then the stamp kick)');

  P('kg_khA', K({ hx: -4, hy: -64, lean: 0.4, hd: 0.06, ax: 20, ay: 24, sw: -2.6, f1x: 30, f2x: -36 }));
  P('kg_khB', K({ hx: -12, hy: -84, lean: -0.5, hd: 0.14, ax: 12, ay: 20, sw: -2.6, f1x: 90, f1y: -96, f2x: -20 }));
  sig('kg_kage', 'kage', [[0.08, 'kg_khA', es], [0.2, 'kg_khA'], [0.28, 'kg_khB', eq], [0.38, 'kg_khB'], [0.66, 'kg_stance', ei]],
    { active: [0.25, 0.34], dmg: 10, post: 26, kb: 460, stun: 0.55, knock: true, lunge: [0.08, 0.24, 760], hide: [0.08, 0.2], spin: [0.2, 0.3, 1], z3: KZ([[0.2, -0.8, -0.5, 1, 1], [0.28, 0.3, 0.2, 1, 1]], 0.66) },
    'Kage-geri (vanishes, reappears with a hook kick)');

  P('tr_kgA', K({ hx: -4, hy: -78, lean: 0.2, hd: 0.06, ax: 30, ay: -30, sw: -2.2, gx: -22, gy: 26, f1x: 26, f2x: -30 }));
  P('tr_kgB', K({ hx: -10, hy: -92, lean: -0.46, hd: 0.12, ax: 28, ay: -20, sw: 0.6, gx: -22, gy: 26, f1x: 92, f1y: -88, f2x: -10, f2y: -26 }));
  sig('tr_kusari', 'tora', [[0.14, 'tr_kgA', es], [0.26, 'tr_kgB', eq], [0.36, 'tr_kgB'], [0.62, 'tr_stance', ei]],
    { active: [0.22, 0.32], dmg: 12, post: 30, kb: 520, stun: 0.55, knock: true, spin: [0.06, 0.24, 1], lunge: [0.1, 0.26, 360], tick: hop(0.14, -360, 300), z3: KZ([[0.14, -0.7, -0.4, 1, 1], [0.26, 0.3, 0.2, 1, 1]], 0.62) },
    'Kusari-geri (chain whirl into a jumping hook kick)');

  P('jn_tbA', K({ hx: 0, hy: -70, lean: 0.3, hd: 0.08, ax: 14, ay: -24, sw: 0.0, grip: 1, f1x: 26, f2x: -32 }));
  P('jn_tbB', K({ hx: -4, hy: -74, lean: 0.1, hd: 0.08, ax: 14, ay: -26, sw: 0.0, grip: 1, f1x: 88, f1y: -26, f2x: -30 }));
  P('jn_tbC', K({ hx: -10, hy: -86, lean: -0.42, hd: 0.12, ax: 12, ay: -28, sw: 0.0, grip: 1, f1x: 88, f1y: -100, f2x: -20 }));
  sig('jn_tenbin', 'jin', [[0.08, 'jn_tbA', es], [0.15, 'jn_tbB', eq], [0.21, 'jn_tbA', es], [0.29, 'jn_tbC', eq], [0.38, 'jn_tbC'], [0.64, 'jn_stance', ei]],
    { hits: [[0.12, 0.18], [0.26, 0.33]], active: [0.12, 0.18], dmg: 5, post: 18, kb: 180, stun: 0.42, knockLast: true, lastHit: { dmg: 8, kb: 460 }, lunge: [0.06, 0.3, 240],
      spin: [0.17, 0.26, 1], z3: KZ([[0.08, 0.3, 0.3, 1, 1], [0.15, -0.3, -0.3, 1, 1], [0.29, 0.2, 0.1, 1, 1]], 0.64) },
    'Tenbin-geri (staff on the shoulders, low and high spinning kicks)');

  P('mi_omA', K({ hx: 0, hy: -86, lean: 0.0, hd: 0.0, ax: 40, ay: -30, sw: -1.0, gx: -30, gy: -30, f1x: 20, f2x: -22 }));
  P('mi_omB', K({ hx: -10, hy: -86, lean: -0.42, hd: 0.1, ax: 36, ay: -26, sw: -1.1, gx: -24, gy: -30, f1x: 84, f1y: -104, f2x: -18 }));
  P('mi_omC', K({ hx: -6, hy: -84, lean: -0.2, hd: 0.06, ax: 34, ay: -20, sw: -1.1, gx: -26, gy: -26, f1x: 76, f1y: -40, f2x: -20 }));
  sig('mi_ogi', 'mai', [[0.1, 'mi_omA', es], [0.22, 'mi_omB', eq], [0.3, 'mi_omC', eo], [0.56, 'mi_stance', ei]],
    { active: [0.18, 0.28], dmg: 10, post: 26, kb: 420, stun: 0.55, knock: true, spin: [0.02, 0.18, 1], lunge: [0.04, 0.2, 300], z3: KZ([[0.1, 0.5, 0.3, 1, 1], [0.22, -0.4, -0.3, 1, 1]], 0.56) },
    'Ogi-mai (fan twirl into a crescent kick)');

  P('ts_sgA', K({ hx: 0, hy: -70, lean: 0.3, hd: 0.06, ax: 20, ay: 28, sw: -0.5, f1x: 26, f2x: -30 }));
  P('ts_sgB', K({ hx: -6, hy: -92, lean: -0.6, hd: 0.2, ax: 16, ay: 24, sw: -0.6, f1x: 74, f1y: -120, f2x: -10, f2y: -30 }));
  sig('ts_tsubame', 'tsubame', [[0.07, 'ts_sgA', es], [0.16, 'ts_sgB', eq], [0.3, 'ts_sgB'], [0.56, 'fall']],
    { active: [0.12, 0.22], dmg: 9, post: 20, kb: 300, stun: 0.6, launch: true, air: true, rollT: [0.12, 0.42], lunge: [0.0, 0.05, 200], tick: hop(0.1, -620, -300),
      z3: KZ([[0.07, 0.2, 0.2, 1, 1], [0.16, -0.2, -0.1, 1, 1]], 0.56) },
    'Tsubame-gaeshi geri (somersault kick, away)');

  P('sh_aoA', K({ hx: -6, hy: -96, lean: -0.2, hd: -0.05, ax: 6, ay: -20, sw: -1.8, f1x: 34, f1y: -134, f2x: -16, f2y: -24 }));
  P('sh_aoB', K({ hx: 8, hy: -78, lean: 0.26, hd: 0.15, ax: 10, ay: -10, sw: -1.7, f1x: 70, f1y: -36, f2x: -22 }));
  sig('sh_ashura', 'shura', [[0.18, 'sh_aoA', es], [0.3, 'sh_aoB', eqd], [0.38, 'sh_aoB'], [0.78, 'stance', ei]],
    { active: [0.25, 0.34], dmg: 14, post: 52, gcrush: 1.8, kb: 360, stun: 0.6, knock: true, lunge: [0.1, 0.28, 420], tick: hop(0.08, -420, 320), z3: KZ([[0.18, 0.3, 0.5, 1, 1], [0.3, -0.1, -0.2, 1, 1]], 0.78) },
    'Ashura-otoshi (leaping axe kick, breaks a guard)');
  const SIG = { akane: 'ak_nidan', aoi: 'ao_kaze', kuro: 'kr_yama', yuki: 'yk_kitsune', hana: 'hn_sakura', tetsu: 'tt_vault', ren: 'rn_oni', kage: 'kg_kage',
    tora: 'tr_kusari', jin: 'jn_tenbin', mai: 'mi_ogi', tsubame: 'ts_tsubame', shura: 'sh_ashura' };
  D.KICK_SIG = SIG;

  function kickPick(f) {
    const id = f.ch.id, armed = f.dz.armed, cb = D.combo(f);
    if (!armed && !cb && D.canPick(f)) return 'dk_kickup';
    if (cb === 'bf') return armed ? (SIG[id] && ATK[SIG[id]] ? SIG[id] : null) : 'ua_flyknee';
    if (f.ctrl.held('guard')) return armed ? 'dk_sweep' : 'ua_sweep';
    const d = f.dirFor('kick');
    if (d < 0) return armed ? 'dk_spin' : 'ua_spinKick';
    if (d > 0) return armed ? 'dk_wrist' : 'ua_front';
    return null;
  }
  D.kickPick = kickPick;



  const KIT = {
    akane: { light1: 'ak_dNuki', light2: 'ak_dKesa', light3: 'd_tsukiL3', heavy: 'd_men', fLight: 'd_tsuki', bLight: 'ak_dKiri', fHeavy: 'd_kiriUp', dash: 'd_dashR' },
    kuro: { light1: 'd_kesaR', light2: 'd_kesaL', light3: 'd_shomen', heavy: 'd_men', fLight: 'd_tsuki', bLight: 'd_suneR', fHeavy: 'd_kiriUp', bHeavy: 'd_kesaH', dash: 'd_dashR' },
  };
  const COMBO = {
    akane: { bfL: 'ak_tsubame', fbL: 'ak_kage', bfH: 'ak_maki', fbH: 'ak_ryusei' },
    kuro: { bfL: 'kr_kuruma', fbL: 'kr_nagi', bfH: 'kr_uchi', fbH: 'kr_iwa' },
  };

  const SIT = {
    light1: [['oAir', 'd_antiL'], ['oWall', 'd_wallL'], ['close', 'd_kote'], ['oUnarmed', 'd_oikomi'], ['oGuard', 'd_doL'], ['far', 'd_tobikomi']],
    heavy: [['oBroken', 'd_kabuto'], ['oAir', 'd_antiH'], ['meWall', 'd_kaiten'], ['close', 'd_taiatari'], ['far', 'd_nagare']],
    kick: [['oUnarmed', 'd_ashibarai'], ['close', 'd_hiza'], ['oGuard', 'd_kakato']],
  };
  const UA = {
    light1: 'ua_jab', light2: 'ua_cross', light3: 'ua_upper', heavy: 'ua_palm', fLight: 'ua_lunge', bLight: 'ua_bf', fHeavy: 'ua_upper', bHeavy: 'ua_spinKick',
    kick: 'ua_front', dash: 'ua_lunge', dashHeavy: 'ua_flyknee', str1: 'ua_palm', str2: 'ua_spinKick', air: 'ua_air', chase: 'ua_air', chaseEnd: 'ua_stomp',
  };
  const UA_SIT = {
    light1: [['close', 'ua_elbow']], heavy: [['oAir', 'ua_upper']], kick: [['close', 'ua_knee'], ['oGuard', 'ua_round'], ['oUnarmed', 'ua_sweep']],
  };
  const isSpecial = (f, n) => ND.SPECIALS && ND.SPECIALS[f.ch.id] && ND.SPECIALS[f.ch.id].atk === n;
  function pick(f, n) {
    const id = f.ch.id, opener = (f.chainN | 0) === 0;
    if (isSpecial(f, n)) return f.dz.armed ? null : 'ua_ki';
    const btn = /^(light1|fLight|bLight|dash)$/.test(n) ? 'L' : /^(heavy|fHeavy|bHeavy|dashHeavy)$/.test(n) ? 'H' : n === 'kick' ? 'K' : null;
    if (opener && btn === 'K' && kOn(id)) { const k = kickPick(f); if (k && ATK[k]) return k; }
    if (!f.dz.armed) {
      if (opener && btn) {
        const cb = D.combo(f);
        if (cb === 'bf' && btn === 'L') return 'ua_ram';
        if (cb === 'bf' && btn === 'K') return 'ua_flyknee';
      }
      if (opener && UA_SIT[n]) { const S = D.sit(f); for (const [k, m] of UA_SIT[n]) if (S[k]) return m; }
      return UA[n] || (/light/i.test(n) ? 'ua_jab' : /heavy/i.test(n) ? 'ua_palm' : n === 'throw' ? null : null);
    }
    if (opener && btn && btn !== 'K') {
      const cb = D.combo(f), C = COMBO[id];
      if (cb && C) {
        const m = C[cb + btn];
        if (m && ATK[m]) {
          const cost = ATK[m].kiCost || 0;
          if (f.ki >= cost) { f.ki -= cost; return m; }
        }
      }
    }
    if (opener && SIT[n === 'light1' ? 'light1' : n]) {
      const S = D.sit(f), L = SIT[n];
      if (n === 'kick' && id === 'akane' && S.close && S.oGuard) return 'ak_bl';
      for (const [k, m] of L) if (S[k]) return m;
    }
    const K = KIT[id];
    return (K && K[n]) || null;
  }
  for (const id of Object.keys(D.ROSTER)) D.pick[id] = pick;
  D.KIT = KIT; D.COMBO = COMBO; D.SIT = SIT; D.UA = UA; D.UA_SIT = UA_SIT;
  D.ARM = ARM; D.SIDE = SIDE; D.Z3 = Z3;
})(window.ND);
