// Shadow Duel — the DUEL drawn from recorded motion (?duel=1 with the mocap player js/mocap.js; ?mocap=0 turns it off).
//
// Drawing only: the fight (states, moves, hit boxes, timing) is untouched and never reads anything here; every value
// below lives in a WeakMap keyed by the fighter (sim-state.js never sees it). Each drawn frame a director looks at the
// fighter's state and move and names what plays:
//   - a recorded clip (mocap/*.json) at a clip time computed from the move's own clock (f.st) through a time warp:
//     the clip's strike (its blade / fist / foot at full speed) lands on the move's hit window, the wind-up and the
//     recovery are squeezed or stretched to the move's frames (a katana's short, fast wind-ups), or
//   - the hand-keyed pose (the duel's own drawing, depth25's 3D skeleton) for what Mixamo has no recording of
//     (thrusts, parries, binds, rolls, flying kicks, sweeps, wall moves, the showpiece's stool / table business).
// A change of source cross-fades (bone directions blended), so a recorded cut flows out of a keyed parry and back.
// Contact: while blades meet (block, parry, clash, the bind; a cut that is being blocked) the sword arm is pulled by 3D
// IK onto the fight's own drawn blade line, so the blades meet where the sparks are. The iai draw is flattened towards
// the opponent (Mixamo's draw rises; a nukitsuke goes out level).
(function (ND) {
  'use strict';
  const Q = (() => { try { return location.search || ''; } catch (e) { return ''; } })();
  const ON = /[?&]duel=\d/.test(Q) && !/[?&]mocap=0(&|$)/.test(Q) && !/[?&]mduel=0(&|$)/.test(Q); // (mduel=0: the mocap-test page's NOW panel)
  const Mo = ND.mocap, D = ND.duel, A3 = ND.depth25;
  if (!ON || !Mo || !D || !A3 || !ND.Fighter) return;
  const L = ND.LEN, PO = ND.POSES;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const { add, sub, mul, madd, dot, len, norm, lerp, nlerp } = Mo.v;
  const MD = (D.mocap = { on: true, ready: false, stats: { clip: 0, keyed: 0, contact: 0 }, src: new Map() });

  // ------------------------------------------------------------------ move → clip (clip seconds: start, strike, end)
  // The strike second is where the recorded blade (fist, foot) is at full speed; it is put on the move's hit window.
  const SEG = {
    downR: ['comboSlash', 0.56, 0.8, 1.05], // kesa from the right (the combo's first cut)
    downL: ['twoHandCombo', 1.18, 1.34, 1.62], // gyaku-kesa
    down: ['overhead', 0.38, 0.64, 0.98], // shomen
    men: ['overhead', 0.12, 0.64, 1.2], // the big vertical (the whole wind-up)
    heavy: ['powerSlash', 0.32, 0.72, 1.3],
    up: ['comboSlash', 2.42, 2.74, 2.96], // rising (kiri-age)
    level: ['comboSlash', 1.42, 1.72, 1.96], // yoko
    low: ['lowSlash', 0.62, 1.0, 1.4], // sune-gari
    lowRise: ['crouchSlash', 0.25, 0.43, 0.7],
    short: ['twoHandCombo', 0.47, 0.64, 0.86], // kote (a short cut)
    spin: ['spinAttackRun', 0.82, 1.07, 1.32],
    hilt: ['hiltStrike', 0.02, 0.2, 0.62],
    kickA: ['sideKickArmed', 0.38, 0.73, 1.2],
    jab: ['punches', 0.38, 0.57, 0.76],
    cross: ['punches', 0.66, 0.83, 1.02],
    palm: ['punches', 0.92, 1.07, 1.26],
    upper: ['punches', 1.12, 1.3, 1.6],
    elbow: ['elbow', 0.36, 0.58, 1.0],
    front: ['sideKick', 0.32, 0.68, 1.25],
    round: ['roundhouse', 0.12, 0.65, 1.2],
    spinKick: ['spinKick', 0.22, 0.62, 1.0],
    draw: ['drawFwd', 0.43, 0.74, 1.15], // nukitsuke: the hilt taken at the hip, out and through
  };
  const MOVE = {
    ak_dNuki: 'draw', ak_dKesa: 'downR', d_kesaR: 'downR', d_kesaL: 'downL', d_shomen: 'down', d_men: 'men', d_kesaH: 'heavy',
    d_kiriUp: 'up', d_antiH: 'up', d_antiL: 'lowRise', d_suneR: 'low', kr_nagi: 'low', d_dashR: 'level', d_doL: 'level', d_oikomi: 'level',
    d_nagare: 'downL', d_kote: 'short', d_kabuto: 'men', kr_iwa: 'heavy', kr_kuruma: 'spin', d_taiatari: 'hilt', ak_tsuka: 'hilt',
    d_hiza: 'kickA', d_kakato: 'kickA',
    ua_jab: 'jab', ua_cross: 'cross', ua_lunge: 'cross', ua_palm: 'palm', ua_upper: 'upper', ua_elbow: 'elbow', ua_ram: 'elbow',
    ua_front: 'front', ua_round: 'round', ua_spinKick: 'spinKick',
    // the kit's own moves that come through in the duel (js/fighter.js ATK)
    light1: 'downR', light2: 'downL', light3: 'down', heavy: 'men',
  };
  // moves left on their hand-keyed poses: no recording fits (listed for the report and the test page)
  MD.KEYED = ['d_tsuki', 'd_tsukiL3', 'd_tobikomi', 'd_wallL', 'd_kaiten', 'd_ashibarai', 'ak_dKiri', 'ak_tsubame', 'ak_kage', 'ak_ryusei', 'ak_maki', 'kr_uchi',
    'ua_bf', 'ua_knee', 'ua_sweep', 'ua_air', 'ua_stomp', 'ua_flyknee', 'ua_ki', 'ua_cRip', 'ua_cSweep', 'ua_cSpin', 'ua_cHeavy', 'ua_cFin',
    'parry', 'clash', 'dbind', 'droll', 'dodge', 'air / jump', 'land', 'specials', 'counters', 'showpiece except the vault and the bottle'];
  // a move without its own entry: by the direction of its cut (js/duel-moves.js a.dz3)
  function segOf(a, name) {
    const k = MOVE[name];
    if (k) return SEG[k];
    if (!a || a.special || a.counter) return null;
    const z = a.dz3;
    if (a.kind === 'blade' && z) return z.v === 'down' ? (z.side < 0 ? SEG.downL : z.side > 0 ? SEG.downR : SEG.down) : z.v === 'up' ? SEG.up : z.v === 'level' ? SEG.level : null;
    return null;
  }
  // clip time for move time t: start → strike on the hit window → end (piecewise linear: a katana's wind-up is short)
  function warp(seg, a, t) {
    const [, c0, cH, c1] = seg;
    const act = a.active || [a.dur * 0.3, a.dur * 0.45];
    const tH = act[0] + (act[1] - act[0]) * 0.3, dur = Math.max(a.dur || 0.5, tH + 0.05);
    if (t <= tH) return c0 + (cH - c0) * clamp(t / Math.max(1e-3, tH), 0, 1);
    return cH + (c1 - cH) * clamp((t - tH) / Math.max(1e-3, dur - tH), 0, 1);
  }

  // ------------------------------------------------------------------ clips
  const CLIPS = [...new Set(Object.values(SEG).map((s) => s[0]).concat(['idle', 'walk', 'backWalk', 'run', 'blockIdle', 'blockedImpact', 'crouchBlockIdle', 'crouchBlockedImpact',
    'hitHead', 'hitBody', 'knockdown', 'getUp', 'sheathe', 'vault', 'pickThrow']))];
  Mo.loadAll(CLIPS).then(() => { MD.ready = true; }).catch((e) => { MD.error = String(e); });
  const C = (id) => Mo.clips[id];

  // ------------------------------------------------------------------ the hand-keyed pose as a frame (depth25's 3D skeleton)
  const Z0 = [0, 0, 1];
  function keyedFrame(f, out) {
    const S = A3.pose3d(f, true);
    if (!S) return out;
    const P = S.P, v = (p) => [p.x, p.y, p.z];
    const hip = v(P.hip), neck = v(P.neck), head = v(P.head), shF = v(S.shF), shB = v(S.shB);
    const hipR = madd(hip, Z0, 7.5), hipL = madd(hip, Z0, -7.5);
    const d = out.d;
    d.pl = Z0.slice(); d.thR = norm(sub(v(P.knF), hipR)); d.snR = norm(sub(v(P.ftF), v(P.knF))); d.thL = norm(sub(v(P.knB), hipL)); d.snL = norm(sub(v(P.ftB), v(P.knB)));
    d.sp = norm(sub(neck, hip)); d.sc = d.sp.slice(); d.sl = norm(sub(shF, shB)); d.hd = norm(sub(head, neck));
    d.uaR = norm(sub(v(P.elF), shF)); d.faR = norm(sub(v(P.haF), v(P.elF))); d.uaL = norm(sub(v(P.elB), shB)); d.faL = norm(sub(v(P.haB), v(P.elB)));
    d.cf = norm([d.sl[2], 0, -d.sl[0]]); d.hf = d.cf.slice();
    const j = f.viewJ();
    // (relative to the fight's own height, like a recorded clip: the rig adds f.y to every source alike)
    out.hip = [hip[0], hip[1] - f.y, 0];
    out.armed = S.armed && !S.sheathed ? 1 : 0;
    out.inside = S.sheathS > 0.01 && !S.sheathed ? 1 : 0;
    out.vis = out.inside ? (1 - S.sheathS) * (f.wpn.blade || 96) : null;
    d.bu = [S.blade.u.x, S.blade.u.y, S.blade.u.z]; d.be = [S.blade.e.x, S.blade.e.y, S.blade.e.z];
    out.A = sub([S.saya.a.x, S.saya.a.y, S.saya.a.z], [hip[0], hip[1], 0]); d.ss = [S.saya.u.x, S.saya.u.y, S.saya.u.z];
    out.tw = out.armed ? S.grip || 0 : 0;
    out.sw = f.wpn.iai && (S.sheathed || out.inside) && j.haB && Math.hypot(P.haB.x - S.saya.a.x, P.haB.y - S.saya.a.y) < 16 ? 1 : 0;
    out.cR = P.ftF.y > -3 && f.onGround ? 1 : 0; out.cL = P.ftB.y > -3 && f.onGround ? 1 : 0;
    out.fistR = j.hasSword || j.fist ? 1 : 0; out.fistL = out.tw > 0.5 || j.fist ? 1 : 0;
    return out;
  }

  // ------------------------------------------------------------------ the director
  const ST = new WeakMap();
  function stateOf(f) {
    let s = ST.get(f);
    if (!s) {
      s = { rig: new Mo.Rig(f, f.x, f.dir), clk: null, walkT: 0, lastSheathed: null, sheatheT: 9, impactT: 9, lastState: '', lastSerial: -1 };
      s.rig.driven = true; s.rig.travel = 0; s.rig.footLock = true; s.rig.maxTurn = 26; // (rad / s: a fast katana cut's forearm)
      ST.set(f, s);
    }
    return s;
  }
  const AIRS = { air: 1, jump: 1, launch: 1, plunge: 1 };
  const isArmed = (f) => !(f.dz && f.dz.armed === false) && !(f.wpn && (f.wpn.fist || f.wpn.none));
  // what plays for f now: { key, src, fade } (src as Rig.drive takes it)
  function direct(f, s, dt) {
    const st = f.state, a = st === 'atk' ? f.atk : null, armed = isArmed(f);
    const clip = (id, t, extra) => Object.assign({ clip: C(id), t: typeof t === 'function' ? t : () => t }, extra || {});
    const keyed = { frame: (out) => keyedFrame(f, out) };
    const seqc = st === 'dseq' && f.dz ? f.dz.seq : null;
    // the showpiece: the bottle thrown (A); the rest stays hand-keyed
    if (seqc) {
      const t = seqc.t;
      // (the table vault stays hand-keyed: the recorded box vault's dive and tuck did not read as legs over a flipping
      // table — knees and shins tangled, the body half in the floor; the leg audit's worst frames, 2026-10-02)
      if (seqc.att === f && t > 3.95 && t < 4.5) return { key: 'seq:throw', src: clip('pickThrow', () => seg3(t, [3.97, 4.21, 4.48], [2.02, 2.45, 2.85])), fade: 0.12 };
      return { key: 'keyed', src: keyed, fade: 0.12 };
    }
    if (f.dead) return null;
    if (a) {
      const seg = segOf(a, f.atkName || a.name || '');
      if (seg && (seg[0] !== 'drawFwd' || f.wpn.iai)) return { key: 'atk:' + f.serial + ':' + seg[0], src: clip(seg[0], () => warp(seg, a, f.st)), fade: 0.06, seg, a };
      return { key: 'keyed', src: keyed, fade: 0.08 };
    }
    switch (st) {
      case 'move': case 'zanshin': case 'win': case 'land': {
        if (!f.onGround) return { key: 'keyed', src: keyed, fade: 0.1 };
        const sp = f.vx * (f.dir < 0 ? -1 : 1);
        // Akane between moves: the sword home in the saya, the hand on the hilt (the iai stance)
        if (armed && f.wpn.iai && f.sheathed && f.sheathed()) {
          if (s.sheatheT < 0.55) return { key: 'sheathe', src: clip('sheathe', () => 0.62 + s.sheatheT * 1.6), fade: 0.1 };
          if (Math.abs(sp) > 40) return { key: 'keyed', src: keyed, fade: 0.15 };
          return { key: 'iai', src: clip('drawFwd', 0.42), fade: 0.18 };
        }
        if (!armed) {
          if (Math.abs(sp) > 40) return { key: 'keyed', src: keyed, fade: 0.15 };
          return { key: 'ua', src: clip('punches', 0.05), fade: 0.18 };
        }
        if (Math.abs(sp) > 260) return { key: 'run', src: clip('run', () => s.walkT % C('run').dur), fade: 0.15 };
        if (sp > 40) return { key: 'walk', src: clip('walk', () => s.walkT % C('walk').dur), fade: 0.15 };
        if (sp < -40) return { key: 'back', src: clip('backWalk', () => s.walkT % C('backWalk').dur), fade: 0.15 };
        return { key: 'idle', src: clip('idle', () => s.idleT % C('idle').dur), fade: 0.2 };
      }
      case 'guard': {
        if (!armed) return { key: 'keyed', src: keyed, fade: 0.1 };
        const low = lowGuard(f);
        return low ? { key: 'gLow', src: clip('crouchBlockIdle', () => s.idleT % C('crouchBlockIdle').dur), fade: 0.1 } : { key: 'gHigh', src: clip('blockIdle', () => s.idleT % C('blockIdle').dur), fade: 0.1 };
      }
      case 'block': {
        if (!armed) return { key: 'keyed', src: keyed, fade: 0.08 };
        const low = lowGuard(f);
        return { key: 'block:' + f.serial, src: clip(low ? 'crouchBlockedImpact' : 'blockedImpact', () => Math.min(0.8, f.st * 1.3)), fade: 0.05 };
      }
      case 'recoil': // the blade bounced off a guard: the recorded blocked impact
        return { key: 'recoil:' + f.serial, src: clip(armed ? 'blockedImpact' : 'hitBody', () => Math.min(0.8, 0.05 + f.st * 1.3), { post: armed ? null : unarm }), fade: 0.05 };
      case 'hurt': case 'gbreak': case 'stagger': {
        // (the head impact for every hit: the weight goes back, away from the blow — the recorded body hit folds
        // forward into the opponent)
        return { key: st + ':' + f.serial, src: clip('hitHead', () => 0.45 + f.st * 1.2, { post: armed ? null : unarm }), fade: 0.06 };
      }
      case 'launch': case 'down':
        return { key: 'kd:' + s.kdSerial, src: clip('knockdown', () => Math.min(C('knockdown').dur, 0.55 + s.kdT), { post: sheathed }), fade: 0.05 };
      case 'getup':
        return { key: 'getup:' + f.serial, src: clip('getUp', () => 0.6 + f.st * 2.4, { post: sheathed }), fade: 0.15 };
      default:
        return { key: 'keyed', src: keyed, fade: 0.1 };
    }
  }
  function seg3(t, T, Cc) { if (t <= T[1]) return Cc[0] + (Cc[1] - Cc[0]) * clamp((t - T[0]) / (T[1] - T[0]), 0, 1); return Cc[1] + (Cc[2] - Cc[1]) * clamp((t - T[1]) / (T[2] - T[1]), 0, 1); }
  // a recorded body without its sword: the katana stays in the saya (Akane) / out of the picture
  function unarm(fr) { fr.armed = 0; fr.inside = 0; fr.tw = 0; fr.fistR = 1; fr.fistL = 1; }
  function sheathed(fr) { fr.armed = 0; fr.inside = 0; fr.tw = 0; }
  // a low guard against a cut that comes in low (the fight's own threat; kept while the block plays)
  function lowGuard(f) {
    const s = stateOf(f);
    if (f.state === 'guard') { try { const th = D.threat(f); s.low = th.ok ? th.h === 'low' : s.low && f.st > 0; } catch (e) { s.low = false; } }
    return !!s.low;
  }

  // ------------------------------------------------------------------ contact: the drawn blade onto the fight's blade
  function contactW(f) {
    const st = f.state, o = f.opp;
    if (st === 'block' || st === 'parry' || st === 'clash' || st === 'recoil') return clamp(1 - (f.st - 0.12) / 0.15, 0, 1);
    if (st === 'dbind') return 1;
    if (st === 'atk' && o && (o.state === 'block' || o.state === 'parry' || o.state === 'clash')) return clamp(1 - (o.st - 0.1) / 0.15, 0, 1);
    return 0;
  }
  // the iai draw goes out level towards the opponent, at chest height
  function drawFlatW(f, s) {
    const a = f.state === 'atk' ? f.atk : null;
    if (!a || !f.wpn.iai || MOVE[f.atkName] !== 'draw') return 0;
    const act = a.active || [0.08, 0.14];
    return clamp(f.st / Math.max(1e-3, act[0]), 0, 1) * clamp(1 - (f.st - act[1]) / 0.12, 0, 1);
  }
  const O3 = {};
  function override(f, s, dt) {
    const rg = s.rig, dir = f.dir < 0 ? -1 : 1;
    // (eased in over a few frames: the blade travels onto the contact line, it never jumps there)
    const wcT = contactW(f);
    s.cw = s.cw == null || dt <= 0 ? wcT : s.cw + (wcT - s.cw) * Math.min(1, dt / 0.035);
    const wc = s.cw > 0.01 ? s.cw : 0, wf = wc > 0 ? 0 : drawFlatW(f, s);
    if (wc <= 0 && wf <= 0) { rg.ovr = null; return; }
    if (wc > 0) {
      const j = f.viewJ();
      if (!j || !j.haF || !j.tip) { rg.ovr = null; return; }
      const P = rg.P, hz = P ? P.haR[2] : 11;
      const h = [(j.haF.x - f.x) * dir, j.haF.y, hz];
      let bx = (j.tip.x - j.haF.x) * dir, by = j.tip.y - j.haF.y; const bl = Math.hypot(bx, by) || 1;
      O3.h = h; O3.u = norm([bx / bl, by / bl, P ? P.blade.u[2] * 0.35 : 0]); O3.w = wc;
      MD.stats.contact++;
    } else {
      // out in front of the chest, the blade level and a little across the body (a nukitsuke)
      O3.h = [46, -112, 6]; O3.u = norm([0.96, -0.05, -0.28]); O3.w = wf * 0.85;
    }
    rg.ovr = O3;
  }

  // ------------------------------------------------------------------ per drawn frame
  function tick(f) {
    const s = stateOf(f), rg = s.rig;
    const clk = ND.simClock || 0;
    let dt = s.clk == null ? 0 : clk - s.clk;
    if (dt < 0 || dt > 0.25) { dt = 0; rg.layers.length = 0; rg.lock.R = rg.lock.L = null; rg.prevF = null; } // (a jump in time: start over)
    s.clk = clk;
    // clocks the director reads
    const sp = Math.abs(f.vx);
    s.walkT += dt * Math.max(0.6, sp / 120); s.idleT = (s.idleT || 0) + dt;
    const sh = f.wpn.iai && f.sheathed ? !!f.sheathed() : false;
    if (s.lastSheathed === false && sh) s.sheatheT = 0; else s.sheatheT += dt;
    s.lastSheathed = sh;
    if ((f.state === 'launch' || f.state === 'down') && !(s.lastState === 'launch' || s.lastState === 'down')) { s.kdSerial = (s.kdSerial || 0) + 1; s.kdT = 0; } else s.kdT = (s.kdT || 0) + dt;
    s.lastState = f.state;
    // (how fast the body really travels: the showpiece places it directly)
    if (dt > 0 && s.px != null) s.mx = (s.mx || 0) * 0.8 + ((f.x - s.px) / dt) * 0.2;
    s.px = f.x;
    rg.x = f.x; rg.dir = f.dir < 0 ? -1 : 1; rg.vx = f.vx;
    const d = direct(f, s, dt);
    if (!d) return null;
    // a recorded run / vault faces the way the body travels
    if (d.src.along && Math.abs(s.mx || 0) > 30) rg.dir = s.mx < 0 ? -1 : 1;
    // the fight's height is the truth for every source (a clip or the hand-keyed pose blend on the same footing)
    rg.y = d.src.y != null ? d.src.y : f.y;
    // the legs (js/mocap.js sideLegs): from the side, knees forward, on the floor while the fight has the body on it
    const st = f.state, a = st === 'atk' ? f.atk : null;
    const segK = d.seg && /kick|Kick|front|round/.test(d.seg[0] + (MOVE[f.atkName] || ''));
    const air = AIRS[st] || !f.onGround || f.y < -2;
    const kick = air || (a && (a.kind === 'kick' || /^(ftF|ftB|knF|knB)$/.test(a.limb || ''))) || !!segK || d.key === 'seq:vault';
    const down = st === 'down' || st === 'getup' || st === 'launch' || !!f.roll || d.key.startsWith('kd:') || d.key.startsWith('getup');
    const L2 = s.legs || (s.legs = {});
    // (a kick stands on its other foot: grounded, the kicking leg free; only the air leaves the floor)
    L2.grounded = !air && !down && !f.hidden; L2.kick = !!kick; L2.down = !!down; L2.snap = dt <= 0;
    L2.onFloor = (st === 'down' || st === 'getup') && f.onGround && f.y > -2;
    rg.legs = L2;
    rg.footLock = f.onGround && f.state !== 'launch' && !f.roll;
    if (d.src.clip) MD.stats.clip++; else MD.stats.keyed++;
    rg.drive(d.key, d.src, d.fade);
    override(f, s, dt);
    rg.update(dt);
    return s;
  }
  MD.tick = tick;
  MD.rigOf = (f) => { const s = ST.get(f); return s ? s.rig : null; };
  MD.sourceOf = (f) => { const s = ST.get(f); const l = s && s.rig.layers[s.rig.layers.length - 1]; return l ? l.key : null; };

  // ------------------------------------------------------------------ drawing (after duel-depth's own override)
  const FP = ND.Fighter.prototype, draw0 = FP.draw;
  FP.draw = function (ctx, reflect, layer) {
    if (reflect || !MD.ready || !this.dz || this.dead || this.hidden) return draw0.call(this, ctx, reflect, layer);
    const s = tick(this);
    if (!s || !s.rig.P) return draw0.call(this, ctx, reflect, layer);
    Mo.draw(ctx, s.rig, {});
  };
  // what is drawn, for the props carried in a hand (the showpiece) and the continuity audit
  const snap0 = A3.snap;
  A3.snap = function (f, o) {
    // (brought up to this step first: the audit reads it without drawing)
    const s = MD.ready && f && f.dz && !f.dead && !f.hidden ? tick(f) : null;
    if (!s || !s.rig.P) return snap0.call(this, f, o);
    const rg = s.rig, P = rg.P, pj = (p) => Mo.project(rg, p);
    o = o || {};
    const put = (k, p) => { const q = pj(p); const t = o[k] || (o[k] = { x: 0, y: 0 }); t.x = q.x; t.y = q.y; };
    put('hip', P.hip); put('neck', P.neck); put('head', P.head); put('sh', P.shR);
    put('elF', P.elR); put('haF', P.haR); put('elB', P.elL); put('haB', P.haL);
    put('knF', P.knR); put('ftF', P.ftR); put('knB', P.knL); put('ftB', P.ftL); put('hipF', P.hipR); put('hipB', P.hipL);
    const BL = f.wpn.blade, u = P.blade.u;
    put('tip', madd(P.blade.h, u, BL)); put('pom', madd(P.blade.h, u, -f.wpn.handle)); put('hilt', P.armed ? madd(P.blade.h, u, 4) : P.blade.h); put('pomm', madd(P.blade.h, u, P.armed ? 4 - f.wpn.handle : -f.wpn.handle));
    put('saya', P.saya.a); put('sayaEnd', madd(P.saya.a, P.saya.u, P.saya.L)); put('obi', P.saya.a);
    o.u = { x: u[0], y: u[1], z: u[2] }; o.e = { x: P.blade.e[0], y: P.blade.e[1], z: P.blade.e[2] };
    o.armed = P.armed; o.sheathed = !P.armed; o.grip = P.gripL || 0; o.dir = rg.dir; o.mocap = true;
    return o;
  };
})(window.ND);
