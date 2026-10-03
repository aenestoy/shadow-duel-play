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
  // (the strike second is where the recorded blade reaches the opponent — the tip forward at the body's height, the blade
  // level: measured on each clip, 2026-10-02. The earlier strike seconds came while the blade was still raised, 30-70°
  // up: the hit, block or parry landed before the blade arrived)
  const SEG = {
    downR: ['comboSlash', 0.56, 0.87, 1.08], // kesa from the right (the combo's first cut)
    downL: ['twoHandCombo', 1.18, 1.36, 1.62], // gyaku-kesa
    down: ['overhead', 0.38, 0.66, 0.98], // shomen
    men: ['overhead', 0.12, 0.66, 1.2], // the big vertical (the whole wind-up)
    heavy: ['powerSlash', 0.32, 0.75, 1.3],
    up: ['comboSlash', 2.42, 2.68, 2.96], // rising (kiri-age)
    level: ['comboSlash', 1.5, 1.77, 1.88], // yoko
    low: ['lowSlash', 0.62, 0.92, 1.4], // sune-gari
    lowRise: ['crouchSlash', 0.25, 0.47, 0.7],
    short: ['twoHandCombo', 0.47, 0.64, 0.86], // kote (a short cut)
    spin: ['spinAttackRun', 0.82, 1.15, 1.38],
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
    // free motion capture (tools/mocap/bake.mjs f*: the kick itself only, turned onto the fight line; ACCAD, CC BY 3.0)
    axe: ['fKickAxe', 0.12, 0.75, 1.1], // kakato-otoshi: the leg up high, the heel down through the guard
    frontF: ['fKickFrontU', 0.1, 0.47, 0.9],
    roundF: ['fKickRoundU', 0.0, 0.4, 0.95],
    spinF: ['fKickSpinBackU', 0.05, 0.59, 1.15],
    draw: ['drawFwd', 0.43, 0.87, 1.15],
    // the running cut: only its sweep — the wind-up had the blade pointing behind her, the follow-through twisted away
    dashCut: ['comboSlash', 1.69, 1.77, 1.84], // nukitsuke: the hilt taken at the hip, out and through
  };
  const MOVE = {
    ak_dNuki: 'draw', ak_dKesa: 'downR', d_kesaR: 'downR', d_kesaL: 'downL', d_shomen: 'down', d_men: 'men', d_kesaH: 'heavy',
    d_kiriUp: 'up', d_antiH: 'up', d_antiL: 'lowRise', d_suneR: 'low', kr_nagi: 'low', d_dashR: 'dashCut', d_doL: 'level', d_oikomi: 'level',
    d_nagare: 'downL', d_kote: 'short', d_kabuto: 'men', kr_iwa: 'heavy', kr_kuruma: 'spin', d_taiatari: 'hilt', ak_tsuka: 'hilt',
    d_hiza: 'kickA', d_kakato: 'axe',
    ua_jab: 'jab', ua_cross: 'cross', ua_lunge: 'cross', ua_palm: 'palm', ua_upper: 'upper', ua_elbow: 'elbow', ua_ram: 'elbow',
    ua_front: 'frontF', ua_round: 'roundF', ua_spinKick: 'spinF',
    // the kit's own moves that come through in the duel (js/fighter.js ATK)
    light1: 'downR', light2: 'downL', light3: 'down', heavy: 'men', dash: 'dashCut',
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
    // (the strike second on the first frame the move can hit: a hit, block or parry lands then)
    const tH = act[0] + (act[1] - act[0]) * 0.05, dur = Math.max(a.dur || 0.5, tH + 0.05);
    if (t <= tH) return c0 + (cH - c0) * clamp(t / Math.max(1e-3, tH), 0, 1);
    return cH + (c1 - cH) * clamp((t - tH) / Math.max(1e-3, dur - tH), 0, 1);
  }

  // ------------------------------------------------------------------ clips
  // the arena's moments (MD.act, for the props pass): free motion capture, CMU / ACCAD (tools/mocap/bake.mjs f*)
  const ACTS = ['fSlipSake', 'fRugPull', 'fStoolPick', 'fRunJumpOver', 'fDiveRoll', 'fDiveRollB', 'fStepstoolJump', 'fStepstoolUp', 'fLadderUp', 'fLadderDown',
    'fCartwheel', 'fBackflip', 'fHandspring', 'fKickSide'];
  const CLIPS = [...new Set(Object.values(SEG).map((s) => s[0]).concat(['idle', 'walk', 'backWalk', 'run', 'blockIdle', 'blockedImpact', 'crouchBlockIdle', 'crouchBlockedImpact',
    'hitHead', 'hitBody', 'knockdown', 'getUp', 'sheathe', 'vault', 'pickThrow', 'fGetUp']))];
  Mo.loadAll(CLIPS).then(() => { MD.ready = true; credit(); Mo.loadAll(ACTS).catch(() => {}); }).catch((e) => { MD.error = String(e); });
  // (the arena moments load after the fight's own clips: MD.act returns false until its clip is in)
  // the licence line of the ACCAD motion capture (CC BY 3.0: the credit must show wherever its clips play) - the duel
  // page's footer while the recorded drawing is on (the game has no credits screen yet)
  MD.CREDIT = 'Motion capture data: ACCAD Open Motion Project, The Ohio State University, CC BY 3.0';
  function credit() {
    try {
      if (typeof document === 'undefined' || !document.body || document.getElementById('mocap-credit')) return;
      const el = document.createElement('div');
      el.id = 'mocap-credit'; el.textContent = MD.CREDIT;
      el.style.cssText = 'position:fixed;left:6px;bottom:2px;font:9px/1.2 sans-serif;color:rgba(255,255,255,.5);text-shadow:0 1px 2px #000;pointer-events:none;z-index:40';
      document.body.appendChild(el);
    } catch (e) { /* no page */ }
  }
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
    // (the 20-joint body's own directions, derived from the hand-keyed pose: chest = spine, wrists straight, feet level)
    if (Mo.fill20) Mo.fill20(d, true);
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
    // an arena moment the props pass asked for (MD.act): it plays over whatever the fight's state is
    const A = s.act;
    if (A && C(A.id)) return { key: 'act:' + A.n, src: clip(A.id, () => A.from + (A.to - A.from) * clamp(A.t / A.dur, 0, 1), { post: actPost(f, A) }), fade: A.fade, act: A };
    if (a) {
      // (empty-handed: the move that really plays (ua_jab...), not the button's name - 'heavy' is a sword cut's clip, and an
      // unarmed player's punches were drawn as cuts with a sword in the hand that came and went, 2026-10-03)
      const seg = segOf(a, armed ? f.atkName || a.name || '' : atkId(a));
      if (seg && !armed && C(seg[0]) && C(seg[0]).sword !== 'none') return { key: 'keyed', src: keyed, fade: 0.08 };
      if (seg && (seg[0] !== 'drawFwd' || f.wpn.iai)) return { key: 'atk:' + f.serial + ':' + seg[0], src: clip(seg[0], () => warp(seg, a, f.st), armed ? null : { post: unarm }), fade: 0.06, seg, a };
      return { key: 'keyed', src: keyed, fade: 0.08 };
    }
    switch (st) {
      case 'dbind': {
        // the bind: a two-handed guard body, the hands taken to the crossing (js/duel-bind.js); the strike and an
        // unarmed bind keep their hand-keyed poses
        // (the hand-keyed bind stands upright in its kamae; the recorded Great Sword block sat in a deep squat)
        return { key: 'keyed', src: keyed, fade: 0.08 };
      }
      case 'move': case 'zanshin': case 'win': case 'land': {
        if (!f.onGround) return { key: 'keyed', src: keyed, fade: 0.1 };
        const sp = f.vx * (f.dir < 0 ? -1 : 1);
        // Akane between moves: the sword home in the saya, the hand on the hilt (the iai stance)
        if (armed && f.wpn.iai && f.sheathed && f.sheathed()) {
          // (the sheathe is the hand-keyed one: the hand brings the hilt to the hip scabbard — the recorded clip's start
          // had the arm over the face and the point down in front)
          if (s.sheatheT < 0.55) return { key: 'keyed', src: keyed, fade: 0.1 };
          if (Math.abs(sp) > 40) return { key: 'keyed', src: keyed, fade: 0.15 };
          // (her iai stance, the hand on the hilt at the hip: the hand-keyed one — the recorded draw's held frame had the
          // forearm up across the chest)
          return { key: 'keyed', src: keyed, fade: 0.18 };
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
      // guard, block and the attacker's recoil: the hand-keyed swordsman's guard (upright kamae, knees a little bent, the
      // blade between the bodies, the face clear; a low guard is the blade low and the body upright). The recorded Great
      // Sword block clips sat the hips at 76 % / 52 % of standing height and raised both arms over the head.
      case 'guard': case 'block':
        return { key: 'keyed', src: keyed, fade: 0.1 };
      case 'recoil':
        if (armed) return { key: 'keyed', src: keyed, fade: 0.06 };
        return { key: 'recoil:' + f.serial, src: clip('hitBody', () => Math.min(0.8, 0.05 + f.st * 1.3), { post: unarm }), fade: 0.05 };
      case 'hurt': case 'gbreak': case 'stagger': {
        // (the head impact for every hit: the weight goes back, away from the blow — the recorded body hit folds
        // forward into the opponent)
        return { key: st + ':' + f.serial, src: clip('hitHead', () => 0.45 + f.st * 1.2, { post: armed ? null : unarm }), fade: 0.06 };
      }
      case 'launch': case 'down':
        // (on the floor a moment, then up: the recorded get-up from the back starts while the fight still has the body
        // down and runs on through the getup state - one rise over ~1.1 s, the lying start and the standing end cut)
        if (st === 'down' && f.st > RISE0 && C('fGetUp')) return { key: 'getup:' + s.kdSerial, src: clip('fGetUp', () => riseT(f), { post: keepOf(f) }), fade: 0.22 };
        return { key: 'kd:' + s.kdSerial, src: clip('knockdown', () => Math.min(C('knockdown').dur, 0.55 + s.kdT), { post: keepOf(f) }), fade: 0.05 };
      case 'getup':
        if (C('fGetUp')) return { key: 'getup:' + s.kdSerial, src: clip('fGetUp', () => riseT(f), { post: keepOf(f) }), fade: 0.22 };
        return { key: 'getup:' + f.serial, src: clip('getUp', () => 0.6 + f.st * 2.4, { post: keepOf(f) }), fade: 0.15 };
      default:
        return { key: 'keyed', src: keyed, fade: 0.1 };
    }
  }
  // the rise: from RISE0 s into 'down' (0.75 s, js/fighter.js) through 'getup' (0.46 s) - the clip's whole length
  const RISE0 = 0.12, RISE_T = 0.75 - RISE0 + 0.46;
  function riseT(f) { const t = f.state === 'down' ? f.st - RISE0 : 0.75 - RISE0 + f.st; return C('fGetUp').dur * clamp(t / RISE_T, 0, 1); }
  function seg3(t, T, Cc) { if (t <= T[1]) return Cc[0] + (Cc[1] - Cc[0]) * clamp((t - T[0]) / (T[1] - T[0]), 0, 1); return Cc[1] + (Cc[2] - Cc[1]) * clamp((t - T[1]) / (T[2] - T[1]), 0, 1); }
  // a recorded body without its sword: the katana stays in the saya (Akane) / out of the picture
  // (an arena moment: the sword in the saya / on the back, or kept in the hand when asked and the fight has it drawn)
  // The hand always draws the fight's own state (2026-10-03, the owner: a sword came into the hand and went again by
  // itself): a fighter that has its sword keeps it in the hand through a fall, the get-up and an arena moment (Akane's
  // stays in the saya only while the fight has it there); an empty hand never shows one. A recorded body without a
  // sword (the fall, the rise, the vault) gets one in its right fist, along the forearm and a little up.
  const sheathedNow = (f) => !!(f.wpn && f.wpn.iai && f.sheathed && f.sheathed());
  function keepOf(f) { return !isArmed(f) ? unarm : sheathedNow(f) ? sheathed : holdSword; }
  function actPost(f, A) { return (fr) => { if (!isArmed(f)) unarm(fr); else if (sheathedNow(f)) sheathed(fr); else if (!(A.keepSword && fr.armed)) holdSword(fr); }; }
  function unarm(fr) { fr.armed = 0; fr.inside = 0; fr.tw = 0; fr.fistR = 1; fr.fistL = 1; }
  function sheathed(fr) { fr.armed = 0; fr.inside = 0; fr.tw = 0; }
  function holdSword(fr) {
    if (fr.armed && !fr.inside) return;
    const fa = fr.d.faR, u = norm([fa[0], fa[1] - 0.35, fa[2]]);
    fr.d.bu = u; fr.d.be = Math.abs(u[1]) > 0.9 ? [1, 0, 0] : [0, -1, 0];
    fr.armed = 1; fr.inside = 0; fr.vis = null; fr.tw = 0; fr.fistR = 1;
  }
  // the move that plays (its ATK name), for the clip of an empty-handed move
  const ATKN = new Map();
  function atkId(a) { if (!ATKN.has(a)) for (const k in ND.ATK) ATKN.set(ND.ATK[k], k); return ATKN.get(a) || a.name || ''; }
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
    // the bind (and its first moments after): the hands at the blades' crossing, js/duel-bind.js
    let BG = D.bindGeom ? D.bindGeom(f) : null;
    // (a crossing out of the arm's reach — a bind left over from another moment — is never reached for)
    if (BG && rg.P && len(sub(BG.h, rg.P.shR)) > 150) BG = null;
    // (taken up over 0.03 s from wherever the hand was — from the contact weight it had: the blade arrives on the
    // crossing, the hand never jumps there in one frame; leaving, it follows the bind's own fade)
    if (BG && BG.w > 0) {
      if (!s.bgOn) { s.bw = s.cw || 0; s.ovPrev = null; rg.x -= s.ox || 0; s.ox = 0; } // (the keep-apart offset goes at the bind's first moment: the bind places the pair itself, the blades meet where the fight says) // (a small keep-apart offset goes at the bind's first moment: the blades meet where the fight says)
      s.bgOn = true; s.bw = Math.min(BG.w, s.bw + (dt > 0 ? dt / 0.03 : 0));
      // (the crossing is in the fight's world: a body drawn off its x by the keep-apart offset reaches it all the same)
      O3.h = BG.h; O3.u = BG.u; O3.e = BG.e; O3.w = s.bw; ovSmooth(s, dt); oxComp(s, dir); rg.ovr = O3; s.cw = s.bw; MD.stats.contact++; return;
    }
    s.bgOn = false;
    O3.e = null;
    // a deflecting counter (suriage and its kin, a.slide): before its cut the blade rides UP the opponent's drawn blade
    // - from its middle towards its point - and sparks where they touch; then the cut (2026-10-03: the owner's suriage
    // screenshot - the blades never met, the deflection did not read)
    { const SL = slideAt(f, s, rg, dir); if (SL) { O3.h = SL.h; O3.u = SL.u; O3.w = SL.w; ovSmooth(s, dt); oxComp(s, dir); rg.ovr = O3; MD.stats.slide = (MD.stats.slide || 0) + 1; return; } }
    const wcT = contactW(f);
    s.cw = s.cw == null || dt <= 0 ? wcT : s.cw + (wcT - s.cw) * Math.min(1, dt / 0.035);
    // a cut that lands: the blade is ON its target when the fight's hit frame comes (aimW)
    const wa = aimW(f), aim = wa > 0.01 ? aimAt(f, s, rg, dir) : null;
    const wc = aim ? 0 : s.cw > 0.01 ? s.cw : 0, wf = wc > 0 || aim ? 0 : drawFlatW(f, s);
    if (!aim && wc <= 0 && wf <= 0) { rg.ovr = null; s.ovPrev = null; return; }
    if (aim) { O3.h = aim.h; O3.u = aim.u; O3.w = wa; MD.stats.aim = (MD.stats.aim || 0) + 1; }
    else if (wc > 0) {
      const j = f.viewJ();
      if (!j || !j.haF || !j.tip) { rg.ovr = null; s.ovPrev = null; return; }
      const P = rg.P, hz = P ? P.haR[2] : 11;
      const h = [(j.haF.x - f.x) * dir, j.haF.y, hz];
      let bx = (j.tip.x - j.haF.x) * dir, by = j.tip.y - j.haF.y; const bl = Math.hypot(bx, by) || 1;
      O3.h = h; O3.u = norm([bx / bl, by / bl, P ? P.blade.u[2] * 0.35 : 0]); O3.w = wc;
      MD.stats.contact++;
    } else {
      // out in front of the chest, the blade level and a little across the body (a nukitsuke)
      O3.h = [46, -112, 6]; O3.u = norm([0.96, -0.05, -0.28]); O3.w = wf * 0.85;
    }
    ovSmooth(s, dt); oxComp(s, dir);
    rg.ovr = O3;
  }
  // A blade cut's hit frames: the weight of the aim (in 0.08 s before the first frame it can hit, held through its
  // window, out over 0.1 s after). The recorded cut reaches ~140 forward at the chest; the fight's reach and lunges
  // differ, so at the hit the blade is laid onto what it meets: the defender's blade when it guards / blocks / parries,
  // else its body (the chest, the head for a cut from above) — the audit's hitEarly measures exactly this.
  function aimW(f) {
    const a = f.state === 'atk' ? f.atk : null, o = f.opp;
    if (!a || a.kind !== 'blade' || !a.active || !o || o.dead || o.hidden || (f.dz && f.dz.armed === false)) return 0;
    if (f.dz && f.dz.cine) return 0;
    const t = f.st, a0 = a.active[0], a1 = a.active[1];
    const k = clamp((t - (a0 - 0.08)) / 0.07, 0, 1) * clamp(1 - (t - a1) / 0.1, 0, 1);
    return k * k * (3 - 2 * k);
  }
  function slideAt(f, s, rg, dir) {
    const a = f.state === 'atk' ? f.atk : null, o = f.opp;
    if (!a || !a.counter || !a.slide || !isArmed(f) || !o || o.dead || !isArmed(o)) return null;
    const S2 = a.slide, t = f.st, end = Math.max(S2[1], a.defl || 0) + 0.03;
    if (t < S2[0] || t > end + 0.05) return null;
    // (the cut's own hit frames belong to the aim: the blade on what it meets)
    if (aimW(f) > 0.01) return null;
    const so = ST.get(o), P = rg.P;
    if (!P || !so || !so.rig.P || !so.rig.P.armed || Math.abs(o.x - f.x) > 300) return null;
    const Q = so.rig.P, BLo = (o.wpn && o.wpn.blade) || 96, BL = (f.wpn && f.wpn.blade) || 96;
    const k = Math.min(1, Math.max(0, (t - S2[0]) / Math.max(1e-3, end - S2[0])));
    const along = 0.45 + 0.4 * k; // (up his blade, from its middle towards the point)
    const cw = Mo.project(so.rig, madd(Q.blade.h, Q.blade.u, BLo * along));
    // (only a blade held out between the two: one swept back behind his body is not reached through it)
    const oh = Mo.project(so.rig, Q.hip);
    if ((cw.x - oh.x) * (f.x - o.x) < 18) return null;
    const T = [(cw.x - rg.x) * dir, cw.y, P.haR[2]];
    // (my blade under his, rising: the hand below and behind the contact, my edge along his and tilted up)
    const tipW = Mo.project(so.rig, madd(Q.blade.h, Q.blade.u, BLo)), hiW = Mo.project(so.rig, Q.blade.h);
    let ux = (hiW.x - tipW.x) * dir, uy = hiW.y - tipW.y; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    const ca = Math.cos(-0.45), sa = Math.sin(-0.45), u = norm([-(ux * ca - uy * sa), -(ux * sa + uy * ca), 0]);
    const want = [T[0] - u[0] * BL * 0.55, T[1] - u[1] * BL * 0.55 + 6, T[2]];
    const v = sub(want, P.shR), lv = len(v), reach = 53, h = lv > reach ? add(P.shR, mul(v, reach / lv)) : want;
    const w = t <= end ? 1 : Math.max(0, 1 - (t - end) / 0.05);
    // (the spark where they touch: presentation only)
    if (!(ND.game && ND.game.simOnly) && t <= end && ND.fx && (s.slq == null || ND.simClock - s.slq > 0.025)) { s.slq = ND.simClock; ND.fx.spark(cw.x, cw.y, -Math.PI / 2, 3, 0.5, '255,236,190'); }
    return { h, u: norm(sub(T, h)), w };
  }
  function aimAt(f, s, rg, dir) {
    const o = f.opp, so = ST.get(o), P = rg.P;
    if (!P || !so || !so.rig.P || Math.abs(o.x - f.x) > 300) return null;
    const Q = so.rig.P, pj = (q) => Mo.project(so.rig, q), loc = (w) => [(w.x - rg.x) * dir, w.y, P.haR[2]];
    const defending = o.state === 'guard' || o.state === 'block' || o.state === 'parry' || o.state === 'clash';
    const BL = (f.wpn && f.wpn.blade) || 96;
    let T;
    if (defending && Q.armed && !Q.inside) { const BLo = (o.wpn && o.wpn.blade) || 96; T = loc(pj(madd(Q.blade.h, Q.blade.u, BLo * 0.45))); }
    else {
      // the body's SURFACE facing the attacker (the drawn torso is a capsule of 17 round the spine, the thigh 10): a cut
      // from above or level meets the shoulder / upper chest edge, a low cut the thigh — never the face; the tip stops
      // there (3 in): the blade never passes through the body
      const z = f.atk && f.atk.dz3 ? f.atk.dz3.v : 'level', low = z === 'low';
      const hip = pj(Q.hip), nk = pj(Q.neck), towards = f.x < o.x ? -1 : 1;
      let c, r;
      if (low) { const sd = lerp(Q.hipR, Q.knR, 0.5), sd2 = lerp(Q.hipL, Q.knL, 0.5), a1 = pj(sd), a2 = pj(sd2); c = (a1.x - a2.x) * towards > 0 ? a1 : a2; r = 10; }
      // (the chest - 0.55 up the spine, 0.65 for a cut from above - on the torso as drawn: never the collar under the chin)
      else { const k = z === 'down' ? 0.65 : 0.55; c = { x: hip.x + (nk.x - hip.x) * k, y: hip.y + (nk.y - hip.y) * k }; r = TORSO_R - 2; }
      T = loc({ x: c.x + towards * (r - 1), y: c.y });
    }
    const H = P.haR, toT = sub(T, H), d = len(toT);
    if (d < 1e-3) return null;
    // the hand where the blade's tip (0.97 of it) reaches T, within the arm with the elbow kept bent (53 of 59): out of
    // reach the blade stops short (the fight's distance)
    const u0 = norm(toT), want = sub(T, mul(u0, BL * (defending ? 0.55 : 0.97))), sh = P.shR, v = sub(want, sh), lv = len(v), reach = !f.onGround || AIRS[f.state] ? 59 : 53; // (in the air the arm may reach its full length: a jumping cut at a low target)
    const h = lv > reach ? add(sh, mul(v, reach / lv)) : want;
    return { h, u: norm(sub(T, h)) };
  }
  // An empty-handed blow that lands is drawn landing (2026-10-03, the owner: the punches felt wrong - the recorded fist
  // stopped 30-60 short of a body the fight had already hit): over its hit frames the striking fist travels on a line
  // onto the target's surface - the chin / face for a jab, cross, uppercut, backfist, the chest for a palm, lunge or
  // counter - and the drawn body steps in up to 40 to reach it (the step eases out with the blow).
  const FIST_HEAD = { ua_jab: 1, ua_cross: 1, ua_upper: 1, ua_bf: 1, ua_cFin: 1 };
  function fistAim(f, s, dt) {
    const rg = s.rig, a = f.state === 'atk' ? f.atk : null, o = f.opp, dir = f.dir < 0 ? -1 : 1;
    let w = 0;
    if (a && a.active && !isArmed(f) && /^(haF|haB)$/.test(a.limb || '') && o && !o.dead && !o.hidden && !(f.dz && f.dz.cine) && Math.abs(o.x - f.x) < 260) {
      const t = f.st, a0 = a.active[0], a1 = a.active[1];
      const k = clamp((t - (a0 - 0.06)) / 0.06, 0, 1) * clamp(1 - (t - a1) / 0.14, 0, 1);
      w = k * k * (3 - 2 * k);
    }
    const so = o ? ST.get(o) : null, P = rg.P;
    if (w <= 0.01 || !P || !so || !so.rig.P) { rg.fist = null; s.reach = (s.reach || 0) * Math.exp(-Math.max(0, dt) / 0.08); if (s.reach < 0.3) s.reach = 0; rg.x = f.x + (s.ox || 0) + (s.reach || 0) * dir; return; }
    // (the hand that strikes: the one the clip has further forward as the blow starts, kept for the whole move)
    if (s.fistSer !== f.serial) { s.fistSer = f.serial; s.fistSide = P.haR[0] >= P.haL[0] ? 'R' : 'L'; }
    const S = s.fistSide, Q = so.rig.P, pj = (q) => Mo.project(so.rig, q), towards = f.x < o.x ? -1 : 1;
    let Tw;
    if (FIST_HEAD[atkId(a)]) { const h = pj(Q.head); Tw = { x: h.x + towards * 20, y: h.y + 2 }; }
    else { const h = pj(Q.hip), n = pj(Q.neck); Tw = { x: h.x + (n.x - h.x) * 0.72 + towards * (TORSO_R + 7), y: h.y + (n.y - h.y) * 0.72 }; }
    // the step in: what the arm (55 of its 59, the elbow not locked) cannot reach from where the body stands
    const sh = P['sh' + S], baseX = f.x + (s.ox || 0);
    const need = Math.hypot((Tw.x - baseX) * dir - sh[0], Tw.y - sh[1]) - 55;
    const want = clamp(need, 0, 40) * w;
    s.reach = dt > 0 && s.reach != null ? s.reach + (want - s.reach) * Math.min(1, dt / 0.03) : want;
    rg.x = baseX + s.reach * dir;
    rg.fist = { S, T: [(Tw.x - rg.x) * dir, Tw.y, P['ha' + S][2]], w };
  }
  // (a body drawn off its fight x by the keep-apart offset still reaches the fight's own place: after the smoothing)
  function oxComp(s, dir) { if (s.ox) O3.h = [O3.h[0] - s.ox * dir, O3.h[1], O3.h[2]]; }
  // (the place the hand is held at never jumps either — the bind handing over to its strike, a parry's contact line
  // turning: it follows its target within about 0.03 s)
  function ovSmooth(s, dt) {
    const k = s.ovPrev && dt > 0 ? Math.min(1, dt / 0.03) : 1;
    if (k < 1) { O3.h = lerp(s.ovPrev.h, O3.h, k); O3.u = nlerp(s.ovPrev.u, O3.u, k); }
    s.ovPrev = { h: O3.h.slice(), u: O3.u.slice() };
  }

  // ------------------------------------------------------------------ two bodies in a bind keep a gap
  // The fight puts the pair 110-150 apart; a pose that leans in would put a head into the other's shoulder. The front
  // of the upper body (head, neck, shoulders) may come no closer than 6 to the contact point's line, so the two
  // bodies never touch: the upper body leans back round the hip as much as needed (from the last drawn pose), and leans
  // in a little (from the legs) when there is room. Outside a bind the lean eases back to none.
  function bodyGap(f, s, dt) {
    const rg = s.rig, P = rg.P, BG = D.gapPoint && D.gapPoint(f);
    let target = 0;
    if (BG && P) {
      const dir = f.dir < 0 ? -1 : 1, room = (BG.x - f.x - (s.ox || 0)) * dir - 6; // (local forward distance to the contact line)
      // the front of the body as drawn last frame, before its lean, at the current lean
      const th0 = rg.lean || 0, cs = Math.cos(th0), sn = Math.sin(th0), h = P.hip;
      let front = -1e9, ht = 60;
      const hr = D.headR ? D.headR(f) : 14;
      for (const [k, r] of [['head', hr], ['neck', 11], ['shR', 9], ['shL', 9], ['chest', 14]]) {
        const q = P[k]; if (!q) continue;
        // (undo the lean to get the pose's own point)
        const dx = q[0] - h[0], dy = q[1] - h[1], x0 = dx * cs - dy * sn, y0 = dx * sn + dy * cs;
        if (x0 + r > front) { front = x0 + r; ht = Math.max(30, -y0); }
      }
      front += h[0];
      // lean so that the front sits at the room line: x' ≈ x0 cos θ − (−h) sin θ … small angles: front − ht·θ
      const need = (front - room) / ht;
      target = clamp(need, -0.12, 0.7); // (− leans in from the legs when there is room, at most ~7°)
    }
    const k = Math.min(1, Math.max(dt, 0) / 0.05);
    rg.lean = BG ? (rg.lean == null ? target : Math.max(target, (rg.lean || 0) + (target - (rg.lean || 0)) * k)) : (rg.lean || 0) * (1 - k);
    if (Math.abs(rg.lean) < 1e-3) rg.lean = 0;
  }

  // ------------------------------------------------------------------ per drawn frame
  function tick(f, noPair) {
    const s = stateOf(f), rg = s.rig;
    const clk = ND.simClock || 0;
    if (s.clk === clk && rg.P && s.tickedAt === clk) return s; // (already brought up to this step: a second look changes nothing)
    let dt = s.clk == null ? 0 : clk - s.clk;
    if (dt < 0 || dt > 0.25) { dt = 0; rg.layers.length = 0; rg.lock.R = rg.lock.L = null; rg.prevF = null; s.ox = 0; s.act = null; s.actTail = null; } // (a jump in time: start over)
    s.clk = clk;
    // clocks the director reads
    const sp = Math.abs(f.vx);
    s.walkT += dt * Math.max(0.6, sp / 120); s.idleT = (s.idleT || 0) + dt;
    const sh = f.wpn.iai && f.sheathed ? !!f.sheathed() : false;
    if (s.lastSheathed === false && sh) s.sheatheT = 0; else s.sheatheT += dt;
    s.lastSheathed = sh;
    if ((f.state === 'launch' || f.state === 'down') && !(s.lastState === 'launch' || s.lastState === 'down')) { s.kdSerial = (s.kdSerial || 0) + 1; s.kdT = 0; } else s.kdT = (s.kdT || 0) + dt;
    s.lastState = f.state;
    if (s.act) {
      s.act.t += dt;
      if (s.act.t >= s.act.dur) {
        const A = s.act;
        s.actTail = { id: A.id, legs: A.legs, t: 0.3 }; s.act = null;
        // (a fall that leaves the body on the floor while the fight has it up again: it gets up — the recorded rise,
        // quickly — instead of being stood up by a cross-fade)
        if (A.legs === 'down' && !A.noRise && C('fGetUp') && f.state !== 'down' && f.state !== 'getup' && f.state !== 'launch') {
          MD.act(f, 'fGetUp', { dur: 0.9, legs: 'down', fade: 0.1 }); s.act.noRise = true;
        }
      }
    } else if (s.actTail && (s.actTail.t -= dt) <= 0) s.actTail = null;
    // (how fast the body really travels: the showpiece places it directly)
    if (dt > 0 && s.px != null) s.mx = (s.mx || 0) * 0.8 + ((f.x - s.px) / dt) * 0.2;
    s.px = f.x;
    // (the drawn body may stand a little off the fight's x — two bodies never drawn inside each other, below — the
    // offset eases back to the fight's own place as soon as there is room)
    // (in a bind its own lean keeps the pair apart: the offset goes at once)
    if (s.ox) { const bind = f.state === 'dbind' || (f.dz && f.dz.cine && !f.dz.cine.done); s.ox *= Math.exp(-Math.max(0, dt) / (bind ? 0.04 : 0.22)); if (Math.abs(s.ox) < 0.2) s.ox = 0; }
    rg.x = f.x + (s.ox || 0); rg.dir = f.dir < 0 ? -1 : 1; rg.vx = f.vx;
    rg.noSword = !isArmed(f); // (an empty hand: no blade drawn in it, none in the saya - through every cross-fade too)
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
    // ('down': a fall / lying; 'air': over something, a roll; else standing — kept 0.3 s after the moment ends, while its
    // pose still fades out: a body that was lying is never stood up by the standing-leg rules in one frame)
    const actL = d.act ? d.act.legs : s.actTail ? s.actTail.legs : null;
    const down = st === 'down' || st === 'getup' || st === 'launch' || !!f.roll || d.key.startsWith('kd:') || d.key.startsWith('getup') || actL === 'down';
    const L2 = s.legs || (s.legs = {});
    // (a kick stands on its other foot: grounded, the kicking leg free; only the air leaves the floor)
    L2.grounded = !air && !down && !f.hidden && actL !== 'air'; L2.kick = !!kick || actL === 'air'; L2.down = !!down; L2.snap = dt <= 0;
    L2.onFloor = ((st === 'down' || st === 'getup') && f.onGround && f.y > -2) || (actL === 'down' && f.onGround && f.y > -2);
    L2.lying = st === 'down' && f.onGround && f.y > -2; // (on the floor, not yet getting up: the floor placement eases)
    rg.legs = L2;
    rg.footLock = f.onGround && f.state !== 'launch' && !f.roll;
    if (d.src.clip) MD.stats.clip++; else MD.stats.keyed++;
    rg.drive(d.key, d.src, d.fade);
    override(f, s, dt);
    fistAim(f, s, dt);
    bodyGap(f, s, dt);
    rg.update(dt);
    s.tickedAt = clk;
    // the pair, once a step: the other brought up to this step first (both as they will be drawn), then kept apart
    const o = f.opp, so0 = o && o.dz && !o.dead && !o.hidden ? stateOf(o) : null;
    if (!noPair && MD.sep && so0 && s.pairAt !== clk) {
      if (so0.tickedAt !== clk) tick(o, true);
      s.pairAt = so0.pairAt = clk;
      if (so0.tickedAt === clk && so0.rig.P) { kickStop(f, s, o, so0); kickStop(o, so0, f, s); bladeStop(f, s, o, so0); bladeStop(o, so0, f, s); const ox0 = (s.ox || 0) * 1e3 + (so0.ox || 0); apart(f, s, o, so0); if ((s.ox || 0) * 1e3 + (so0.ox || 0) !== ox0) { bladeStop(f, s, o, so0); bladeStop(o, so0, f, s); apart(f, s, o, so0); } } // (the second round only when the keep-apart moved a body: nothing else changed) // (legs first: a bent kicking leg may bring its thigh in; blade-stop before AND after the keep-apart, and the keep-apart once more last: an arm pulled back by a blade-stop never ends in the other's head or hat brim)
    }
    return s;
  }
  MD.tick = tick;
  // ------------------------------------------------------------------ two bodies never drawn inside each other
  // Outside a bind (its own lean keeps the pair apart: bodyGap) the two fighters' heads and torsos (as drawn: the torso
  // a capsule hip → neck of radius TORSO_R (24), the head 14, the thighs 10 — the same measure scripts/duel-body-audit.mjs checks) never overlap.
  // The drawn body is moved off the fight's x just enough (both by half; a body on the floor, getting up or launched
  // takes most of it); the fight's own x stays the truth, the offset eases back when there is room.
  // When the fight puts the two closer than BODY_MIN (a dash or a throw through, a juggle under the other) a drawing
  // cannot keep them apart without leaving the fight's place: those frames are left to the fight (the audit lists them).
  // (TORSO_R: the drawn torso with its jacket and sleeves, ~24 either side of the spine in profile - 17 let two leaning
  // bodies in an exchange be drawn half inside each other while the capsules still cleared, 2026-10-02)
  const BODY_MIN = 20, OX_MAX = 80, TORSO_R = 24;
  MD.TORSO_R = TORSO_R;
  MD.sep = !(() => { try { return /[?&]sep=0(&|$)/.test(location.search || ''); } catch (e) { return false; } })(); // (?sep=0: off, to compare)
  const MOVERS = { down: 1, getup: 1, launch: 1 };
  function shapesOf(rg, dx) {
    const P = rg.P, pj = (p) => { const q = Mo.project(rg, p); q.x += dx; return q; };
    // (the thighs are body too: one standing over a body on the floor, or a kicking hip, never inside the other)
    // (and the forearms and shins: an arm reaching into the other's chest, a shin through his hakama read as one pile;
    // limbs are checked against the other's torso and head only - arms and blades may cross in front)
    // (an empty-handed blow landing (fistAim): its fist is ON the other's face / chest by design - only the fist is
    // left out, the forearm up to it still keeps clear: a counter's arm lay across the chest, 2026-10-03)
    const FS = rg.fist && rg.fist.w > 0.3 ? rg.fist.S : null;
    // (the legs as drawn: the hakama's thigh 11 round, the knee bag and the wrapped shin 8.5)
    const arm = (S) => [pj(P['el' + S]), pj(FS === S ? lerp(P['el' + S], P['ha' + S], 0.7) : P['ha' + S]), 6, 1];
    // (the head 14.5; a straw kasa's brim too: a band 54 wide over the head — two heads, a hat and a head, never pressed)
    const hd = pj(P.head), kasa = rg.look && rg.look.ch && rg.look.ch.acc === 'kasa';
    return [[pj(P.hip), pj(P.neck), TORSO_R], [hd, null, 14.5], kasa ? [{ x: hd.x - 27, y: hd.y - 8 }, { x: hd.x + 27, y: hd.y - 8 }, 6] : null, [pj(P.hipR), pj(P.knR), 11], [pj(P.hipL), pj(P.knL), 11],
      arm('R'), arm('L'), [pj(P.knR), pj(P.ftR), 8.5, 1], [pj(P.knL), pj(P.ftL), 8.5, 1]].filter(Boolean);
  }
  function segDist(p, q, r, t) {
    const sd = (P, A, B) => { if (!B) return Math.hypot(P.x - A.x, P.y - A.y); const vx = B.x - A.x, vy = B.y - A.y, l2 = vx * vx + vy * vy || 1, u = clamp(((P.x - A.x) * vx + (P.y - A.y) * vy) / l2, 0, 1); return Math.hypot(P.x - A.x - vx * u, P.y - A.y - vy * u); };
    if (q && t) {
      const cr = (A, B, C) => (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x);
      const d1 = cr(p, q, r), d2 = cr(p, q, t), d3 = cr(r, t, p), d4 = cr(r, t, q);
      if ((d1 > 0) !== (d2 > 0) && (d3 > 0) !== (d4 > 0)) return 0;
    }
    return Math.min(sd(p, r, t), q ? sd(q, r, t) : 1e9, sd(r, p, q), t ? sd(t, p, q) : 1e9);
  }
  function penOf(A, B) { let pen = 0; for (const [p, q, r1, l1] of A) for (const [u, v, r2, l2] of B) { if (l1 && l2) continue; pen = Math.max(pen, r1 + r2 - segDist(p, q, u, v)); } return pen; }
  MD.bodyPen = (fa, fb) => { const a = ST.get(fa), b = ST.get(fb); return a && b && a.rig.P && b.rig.P ? penOf(shapesOf(a.rig, 0), shapesOf(b.rig, 0)) : 0; };
  function apart(f, s, o, so) {
    if (!s.rig.P || f.dead || o.dead || f.hidden || o.hidden) return;
    if (f.state === 'dbind' || o.state === 'dbind' || (f.dz && f.dz.cine && !f.dz.cine.done) || (o.dz && o.dz.cine && !o.dz.cine.done)) return;
    if (Math.abs(f.x - o.x) < BODY_MIN) return;
    const rA = s.rig, rB = so.rig, B = shapesOf(rB, 0);
    if (penOf(shapesOf(rA, 0), B) <= 0) return;
    // the least relative shift that clears it (halving search), A moved away from B
    const away = f.x < o.x ? -1 : 1;
    let lo = 0, hi = OX_MAX * 2;
    if (penOf(shapesOf(rA, away * hi), B) > 0) lo = hi; else for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (penOf(shapesOf(rA, away * m), B) > 0) lo = m; else hi = m; }
    const need = hi + 0.5;
    // (shared: a body on the floor / getting up / launched takes most of it, the one standing over it gives way a little;
    // a share that would pass the limit goes to the other)
    const mf = MOVERS[f.state] && !MOVERS[o.state] ? 0.8 : MOVERS[o.state] && !MOVERS[f.state] ? 0.2 : 0.5;
    const mv = (st, rg, sign, amt) => { const nx = clamp((st.ox || 0) + sign * amt, -OX_MAX, OX_MAX), d = nx - (st.ox || 0); st.ox = nx; slide(rg, d); return Math.abs(d); };
    let left = need - mv(s, rA, away, need * mf);
    left -= mv(so, rB, -away, need * (1 - mf) + Math.max(0, left - need * (1 - mf)));
    if (left > 0.3) mv(s, rA, away, left);
  }
  // ------------------------------------------------------------------ a kick's foot stops at the body it meets
  // The foot (and its shin) never goes into the opponent's torso or head as drawn: it comes to rest 3 inside the
  // surface (a little give) and the leg bends to the real distance (3D IK from its own hip, the knee kept forward).
  // (the body drawn back off the other until this foot is out: the least step, within the offset's limit)
  function stepBack(f, s, o, ft, inside) {
    const rg = s.rig, away = f.x < o.x ? -1 : 1, w = Mo.project(rg, ft);
    let d = 0;
    while (d < OX_MAX * 3 && inside({ x: w.x + away * d, y: w.y }) > 0) d += 1;
    const LIM = OX_MAX * 1.5, nx = clamp((s.ox || 0) + away * (d + 0.5), -LIM, LIM), got = Math.abs(nx - (s.ox || 0));
    slide(rg, nx - (s.ox || 0)); s.ox = nx;
    // (what the limit leaves: the other gives way)
    const so = ST.get(o), left = d + 0.5 - got;
    if (so && left > 0.3) { const ny = clamp((so.ox || 0) - away * left, -LIM, LIM); slide(so.rig, ny - (so.ox || 0)); so.ox = ny; }
  }
  // (the drawn body moved along the floor whole: its planted feet go with it, the legs are not pulled by them)
  function slide(rg, d) { if (!d) return; rg.x += d; for (const k of ['R', 'L']) if (rg.lock[k] && rg.lock[k].x != null) rg.lock[k].x += d; }
  function kickStop(f, s, o, so) {
    const rg = s.rig, P = rg.P;
    if (!so || !so.rig.P || !P || f.dead || o.dead || o.hidden) return;
    const B = shapesOf(so.rig, 0).slice(0, 2); // (the torso and the head)
    // how far a world point is inside the other body (> 0: inside; the foot's own 4 counted, 3 of give allowed)
    const inside = (w) => { let m = -1e9; for (const [p, q, r] of B) { let cx = p.x, cy = p.y; if (q) { const vx = q.x - p.x, vy = q.y - p.y, l2 = vx * vx + vy * vy || 1, u = clamp(((w.x - p.x) * vx + (w.y - p.y) * vy) / l2, 0, 1); cx = p.x + vx * u; cy = p.y + vy * u; } m = Math.max(m, r + 1 - Math.hypot(w.x - cx, w.y - cy)); } return m; };
    const KC = s.kc || (s.kc = {});
    for (const k of ['R', 'L']) {
      const ft = P['ft' + k], hp = P['hip' + k], v = sub(ft, hp), pc = KC[k];
      const at = (ang, sc) => { const c = Math.cos(ang), sn = Math.sin(ang); return [hp[0] + (v[0] * c - v[1] * sn) * sc, hp[1] + (v[0] * sn + v[1] * c) * sc, hp[2] + v[2] * sc]; };
      let T = null;
      const legIn = (f2, k2) => Math.max(inside(Mo.project(rg, f2)), inside(Mo.project(rg, lerp(P['kn' + k], f2, 0.5))));
      if (legIn(ft) <= 0) {
        // (out of the body by itself: last frame's turn lets go over a few frames, never at once)
        if (!pc) continue;
        const ang = pc.ang * 0.65, sc = 1 - (1 - pc.sc) * 0.65;
        if (Math.abs(ang) < 0.02 && sc > 0.985) { delete KC[k]; continue; }
        const q = at(ang, sc), r0 = Mo.ik3(hp, q, Mo.L.thigh, Mo.L.shin, sub(P['kn' + k], lerp(hp, ft, 0.5)));
        if (inside(Mo.project(rg, q)) > 0 || inside(Mo.project(rg, lerp(r0.m, r0.e, 0.5))) > 0 || (f.onGround && ft[1] > -4 && q[1] < ft[1] - 1)) { delete KC[k]; continue; }
        KC[k] = { ang, sc }; T = q;
      } else {
        // the leg swung (round its hip, in the picture's plane) and if need be shortened, the least that brings the foot
        // out of the body — nearest to last frame's turn (a kick that lands on the surface and is turned by it)
        const a = f.state === 'atk' ? f.atk : null, free = !f.onGround || AIRS[f.state] || f.state === 'launch' || f.state === 'down' || f.state === 'getup' || (a && (a.kind === 'kick' || /^(ftF|ftB|knF|knB)$/.test(a.limb || '')));
        const pa = pc ? pc.ang : 0, ps = pc ? pc.sc : 1, C = [], onFloor = f.onGround && ft[1] > -4;
        for (const sc of [1, 0.9, 0.8, 0.7, 0.6, 0.5]) for (let i = -30; i <= 30; i++) { const ang = (i * Math.PI) / 60; C.push([Math.abs(ang - pa) + Math.abs(sc - ps) * 1.5 + Math.abs(ang) * 0.2 + (1 - sc) * 0.3, ang, sc]); }
        C.sort((x, y) => x[0] - y[0]);
        for (const [, ang, sc] of C) {
          if (Math.abs(ang - pa) > 0.6 || Math.abs(sc - ps) > 0.3) continue; // (a leg never flicks round in one frame: the body steps back instead)
          const q = at(ang, sc);
          // (outside a kick or the air the leg stays a standing leg: 35° or more under the horizontal)
          if (!free && Math.atan2(q[1] - hp[1], Math.abs(q[0] - hp[0])) < 0.61) continue;
          if (onFloor && q[1] < ft[1] - 1) continue; // (a foot standing on the floor is never lifted off it)
          if (inside(Mo.project(rg, q)) > 0) continue;
          // (the leg as it will be drawn — its knee too — clear of the body)
          const r0 = Mo.ik3(hp, q, Mo.L.thigh, Mo.L.shin, sub(P['kn' + k], lerp(hp, ft, 0.5)));
          if (inside(Mo.project(rg, lerp(r0.m, r0.e, 0.5))) > 0) continue;
          T = q; KC[k] = { ang, sc }; break;
        }
      }
      if (!T) { stepBack(f, s, o, ft, inside); stepBack(f, s, o, lerp(P['kn' + k], ft, 0.5), inside); continue; }
      // (the knee kept in the side plane, forward: a leg that does not swing towards the camera)
      // (as drawn the leg keeps its length: a solution the perspective would stretch past 1.08 is tried flat, else left)
      const pk = sub(P['kn' + k], lerp(hp, ft, 0.5)), ratio = (a, b) => { const A = Mo.project(rg, a), B = Mo.project(rg, b); return Math.hypot(A.x - B.x, A.y - B.y) / 46; };
      let r = Mo.ik3(hp, T, Mo.L.thigh, Mo.L.shin, pk);
      if (ratio(hp, r.m) > 1.08 || ratio(r.m, r.e) > 1.08) r = Mo.ik3(hp, [T[0], T[1], hp[2]], Mo.L.thigh, Mo.L.shin, [pk[0], pk[1], 0]);
      if (ratio(hp, r.m) > 1.08 || ratio(r.m, r.e) > 1.08 || inside(Mo.project(rg, r.e)) > 0 || inside(Mo.project(rg, lerp(r.m, r.e, 0.5))) > 0) {
        // (no leg that both reads and stays out: the kicker's drawn body steps back off the other instead)
        stepBack(f, s, o, ft, inside); stepBack(f, s, o, lerp(P['kn' + k], ft, 0.5), inside);
        continue;
      }
      P['kn' + k] = r.m; P['ft' + k] = r.e;
    }
  }
  // ------------------------------------------------------------------ a blade stops at the body it meets
  // An attacker's drawn blade never goes through the other's head (a circle of 14), neck or deeper than 3 into the torso (a
  // capsule of TORSO_R round the spine: the torso as drawn): the sword hand draws back along the blade (the elbow bends, 3D IK from the shoulder)
  // and, if that is not enough, the blade turns away round the hand — the least that clears it.
  function bladeStop(f, s, o, so) {
    const rg = s.rig, P = rg.P;
    if (!P || !P.armed || f.dead || o.dead || o.hidden || !so.rig.P) return;
    // (a blade still coming out of the saya - an iai draw-cut: only as far as it shows)
    if (P.inside && !(P.bladeVis > 12)) return;
    if (f.state === 'dbind' || (f.dz && f.dz.cine)) return;
    const Q = so.rig.P, pjo = (q) => Mo.project(so.rig, q), hd = pjo(Q.head), hp = pjo(Q.hip), nk = pjo(Q.neck);
    const BLf = (f.wpn && f.wpn.blade) || 96, BL = P.inside ? Math.min(BLf, P.bladeVis) : BLf, PJR = Mo.projectorOf ? Mo.projectorOf(rg) : null, pj = PJR || ((q) => Mo.project(rg, q));
    const segD = (x, y) => { const vx = nk.x - hp.x, vy = nk.y - hp.y, l2 = vx * vx + vy * vy || 1, t = clamp(((x - hp.x) * vx + (y - hp.y) * vy) / l2, 0, 1); return Math.hypot(x - hp.x - vx * t, y - hp.y - vy * t); };
    // (the neck too: neck point to the head's centre, 9 round - a blade through the throat of one leaning back)
    const neckD = (x, y) => { const vx = hd.x - nk.x, vy = hd.y - nk.y, l2 = vx * vx + vy * vy || 1, t = clamp(((x - nk.x) * vx + (y - nk.y) * vy) / l2, 0, 1); return Math.hypot(x - nk.x - vx * t, y - nk.y - vy * t); };
    // (a cut landing - its own hit window - may rest 5 into the torso as drawn (a slash ON the chest, not through it); an
    // arm brought in by it is kept off the other's body by the keep-apart that runs after the blade-stop, tick)
    const give = aimW(f) > 0.01 ? 5 : 3;
    // (the point never rests on the face, throat or under the chin - head 20, neck 20 in the cut's own hit window (22, 16
    // outside it), nor on the collar - 26 round the neck point: a riposte's point on the chin read as a cut through the
    // neck; the cut lands on the chest)
    const HR = give > 3 ? 20 : 22, NR = give > 3 ? 20 : 16;
    // (and the legs as drawn - the hakama's thighs 11, the shins 8.5, 2 of give (a landing cut's 5): a follow-through
    // turned off the body went down through the other's legs instead; and never into the floor: its point stays above it)
    const LG = [['hipR', 'knR', 11], ['hipL', 'knL', 11], ['knR', 'ftR', 8.5], ['knL', 'ftL', 8.5]].map(([a, b, r]) => [pjo(Q[a]), pjo(Q[b]), r - (give > 3 ? give : 2)]);
    const segP = (p, q, x, y) => { const vx = q.x - p.x, vy = q.y - p.y, l2 = vx * vx + vy * vy || 1, t = clamp(((x - p.x) * vx + (y - p.y) * vy) / l2, 0, 1); return Math.hypot(x - p.x - vx * t, y - p.y - vy * t); };
    // (and not ALONG the other's body: a cut touches the torso / neck / head as drawn at one point - at most 10 of the
    // blade over them - a riposte lying across the chest up to the chin read as through the neck)
    // (penT: how far the blade is from the torso's surface - the contact a landing cut is drawn to, never the head's)
    let penT = 0;
    const pen = (h, u, NS = 24) => { let m = -1e9, over = 0; penT = 1e9; const dl = (BL - 4) / NS; for (let k = 0; k <= NS; k++) { const w = pj(madd(h, u, 4 + dl * k)), dh = Math.hypot(w.x - hd.x, w.y - hd.y), dn = neckD(w.x, w.y), dt = segD(w.x, w.y); penT = Math.min(penT, dt - TORSO_R); m = Math.max(m, HR - dh, NR - dn, TORSO_R - dt - give, 26 - Math.hypot(w.x - nk.x, w.y - nk.y)); if (dh < HR || dn < NR || dt < TORSO_R) over += dl; for (const [a, b, r] of LG) m = Math.max(m, r - segP(a, b, w.x, w.y)); m = Math.max(m, w.y + 1); } return Math.max(m, over - 10); };
    let h = P.blade.h, u = P.blade.u, p0 = pen(h, u);
    // (in a cut's own hit window a blade that misses her - more than 6 off the body - is brought ON to it as well: the hit
    // never shows with the blade away from her)
    if (p0 <= 0 && !(aimW(f) > 0.3 && penT > 6)) return;
    // the least change that clears it: the hand drawn back (away from the other, within the arm: the elbow bends) and the
    // blade turned round the hand in the picture's plane — cost: 1 per unit back, 25 per radian turned
    const hitW = aimW(f), L = Mo.L, L20 = Mo.L20, j20 = !!P.wrR, away = [-1, 0, 0], rot = (uu, a) => { const c = Math.cos(a), sn = Math.sin(a); return norm([uu[0] * c - uu[1] * sn, uu[0] * sn + uu[1] * c, uu[2]]); };
    // (a hand drawn back toward the picture's edge shows the blade shorter under the perspective: its depth share is cut
    // until the drawn blade is 0.8 of its length again, js/mocap.js readableBlade - measured as it will be drawn)
    const flat = (hb, uu) => { for (let i = 0; i < 12 && Mo.bladeDrawn(hb, uu, BL) < 0.8; i++) uu = norm([uu[0], uu[1], uu[2] * 0.75]); return uu; };
    // (the sword hand, moved, never goes into the other's head, hat brim or body further than it already was: the keep-apart
    // ran before this, and an arm pulled back into a straw kasa's brim read as one pile - the forearm's 6 counted)
    const kasa = so.rig.look && so.rig.look.ch && so.rig.look.ch.acc === 'kasa';
    const handIn = (q) => { const w = pj(q); return Math.max(14.5 + 6 - Math.hypot(w.x - hd.x, w.y - hd.y), TORSO_R + 6 - segD(w.x, w.y), kasa ? 12 - Math.hypot(Math.max(0, Math.abs(w.x - hd.x) - 27), w.y - hd.y + 8) : -1e9); };
    const hand0 = Math.max(0, handIn(h));
    // (nor into its own body, further than the drawing already has it: js/mocap.js Mo.selfPen)
    const self0 = Math.max(0, Mo.selfPen(P, h, u, BLf));
    const pv = s.bsPrev && s.bsPrev.clk >= (ND.simClock || 0) - 0.05 ? s.bsPrev : null;
    let best = null, least = null;
    // (the hand also up or down a little - over or under the other's arm - when drawn back is not enough: 2 per unit)
    // (in a cut's hit window the drawn reach may also be shortened - the blade turned into the picture's depth, drawn
    // down to 0.6 of itself - so it lands ON the chest instead of being swung away from her: 30 per 0.1 of length)
    // (a frame's cost: a coarse pass - every other turn and hand step - then the neighbours of its best, cut off as soon as
    // nothing further can beat the best found; the full grid cost ~2 ms a frame on a phone, 2026-10-03)
    const DQ = hitW > 0.01 ? [1, 0.85, 0.7] : [1], HB = new Map();
    const handAt = (back, up) => {
      const key = back * 1000 + up; if (HB.has(key)) return HB.get(key);
      let hb = madd(madd(h, away, back), [0, 1, 0], up); const dS = len(sub(hb, P.shR)), MXA = L.uArm + L.fArm - 0.5; // (where the arm can put it)
      if (dS < 14) hb = madd(P.shR, norm(sub(hb, P.shR)), 14); else if (dS > MXA) hb = madd(P.shR, norm(sub(hb, P.shR)), MXA);
      if ((back || up) && handIn(hb) > hand0 + 0.5) hb = null;
      HB.set(key, hb); return hb;
    };
    const tryOne = (back, up, dq, ang) => {
      if (back < 0 || back > 64 || Math.abs(ang) > 3.15) return;
      if (best && back + Math.abs(up) * 2 + Math.abs(ang) * 25 + (1 - dq) * 300 >= best.cost) return;
      const hb = handAt(back, up); if (!hb) return;
      let uu = flat(hb, ang ? rot(u, ang) : u);
      if (dq < 1) { const r = Math.hypot(uu[0], uu[1]) || 1, q = r * dq; uu = [uu[0] / r * q, uu[1] / r * q, (uu[2] < 0 ? -1 : 1) * Math.sqrt(Math.max(0, 1 - q * q))]; if (Mo.bladeDrawn(hb, uu, BL) < 0.6) return; }
      // (and near last frame's turn: a blade held off the body keeps to one side of it, never flipping over from frame to frame)
      let cost = back + Math.abs(up) * 2 + Math.abs(ang) * 25 + (1 - dq) * 300 + (pv && hitW <= 0.01 ? Math.abs(ang - pv.ang) * 30 + Math.abs(back - pv.back) * 0.5 : 0);
      if (best && cost >= best.cost) return;
      // (a quick look first - 12 points along the blade, 10 apart; only a candidate that may win is measured in full)
      const pq = pen(hb, uu, 12);
      if (pq > 4) { if (!least || pq < least.pn) least = { pn: pq, h: hb, u: uu, ang, back, up, dq }; return; }
      const po = pen(hb, uu), tc = penT, pn = Math.max(po, Mo.selfPen(P, hb, uu, BLf) - self0 - 0.5);
      if (pn > 0) { if (!least || pn < least.pn) least = { pn, h: hb, u: uu, ang, back, up, dq }; return; }
      // (in a cut's hit window the blade stays ON the body: a blade turned off it costs its distance from the surface)
      if (hitW > 0.01) cost += Math.max(0, tc - 3) * 8 * hitW; // (from the other's torso: the chest, not the face)
      if (!best || cost < best.cost) best = { cost, h: hb, u: uu, ang, back, up, dq };
    };
    for (const up of [0, -12, 12, -24, 24]) {
      if (up && best && best.cost < Math.abs(up) * 2) continue;
      for (let back = 0; back <= 64; back += 8) {
        if (best && back + Math.abs(up) * 2 >= best.cost) break; // (nothing further back can be cheaper)
        for (const dq of DQ) for (let i = 0; i <= 30; i += 2) {
          if (best && back + Math.abs(up) * 2 + i * 2.5 + (1 - dq) * 300 >= best.cost) break;
          tryOne(back, up, dq, i * 0.1); if (i) tryOne(back, up, dq, -i * 0.1);
        }
      }
    }
    // the neighbours of the coarse best (or of the least deep, when nothing cleared)
    { const c = best || least; if (c) for (const db of [-4, 0, 4]) for (const da of [-0.1, 0, 0.1]) if (db || da) tryOne(c.back + db, c.up, c.dq || 1, Math.round((c.ang + da) * 10) / 10); }
    // (nothing clears it in reach: the least deep of them, never left as it was)
    if (!best && least && least.pn < p0) best = least;
    if (!best) return;
    s.bsPrev = { ang: best.ang, back: best.back, clk: ND.simClock || 0 };
    const h2 = best.h, u2 = best.u;
    // the arm to the new hand
    const pole = sub(P.elR, lerp(P.shR, h2, 0.5));
    if (j20) { const r = Mo.ik3(P.shR, h2, L.uArm, L20.fw + L20.hd, pole); P.elR = r.m; P.haR = r.e; P.wrR = lerp(r.m, r.e, L20.fw / (L20.fw + L20.hd)); } // (the wrist straight on the new forearm)
    else { const r = Mo.ik3(P.shR, h2, L.uArm, L.fArm, pole); P.elR = r.m; P.haR = r.e; }
    let e = sub(P.blade.e, mul(u2, dot(P.blade.e, u2))); e = len(e) > 1e-4 ? norm(e) : P.blade.e;
    P.blade = { h: P.haR, u: u2, e };
    MD.stats.bladeStop = (MD.stats.bladeStop || 0) + 1;
  }
  // Arena moments for the props pass (drawing only - the fight's own state, position and timing stay the truth):
  //   ND.duel.mocap.act(f, id, { dur, from, to, fade, legs, keepSword }) -> true when it plays
  //   id: one of MD.ACTS (or any loaded clip); dur: seconds of fight time it takes (default: the clip's own length);
  //   from / to: clip seconds (default the whole clip); legs: 'down' (a fall, a roll: the body rests on the floor),
  //   'air' (over an obstacle: no foot pinned to the floor), else standing (defaults per clip: DEF_LEGS); keepSword: a
  //   drawn sword stays in the hand. The clip's own height is drawn on top of the fight's y (a jump over a stool rises
  //   by itself: keep y on the floor); its own travel is not (the fight moves the body: C.travel, ND.mocap.clips[id]).
  //   MD.actStop(f) ends it early. A fall ('down') that ends with the fight's body up gets up by itself (fGetUp, 0.9 s);
  //   fLadderDown starts at the top of the ladder: call it as fLadderUp ends (MD.actOf(f) then reads 'fLadderUp (end)').
  MD.ACTS = ACTS; MD.SEG = SEG; MD.MOVE = MOVE;
  // ONE MOVE ALONE (a move gallery: ?move=<id>, ?who=kuro for Kuro doing it): once the fight is on, the CPU stops and
  // the move is played again every ~2 s from the same places — a duel move by name (d_kesaR, d_men, d_dashR, ak_dNuki,
  // ua_round …), or a defence staged against the other's cut: guard, guardLow, block, recoil, bind, sheathe, hit
  MD.loopMove = function (id, who) {
    const g = ND.game; if (!g || !g.F || g.F.length < 2) return false;
    const F = g.F, A = F.find((f) => f.ch.id === (who || F[0].ch.id)) || F[0], K = F.find((f) => f !== A);
    let wait = 0, phase = 0;
    const press = (c, k, on) => { if (!c) return; if (on) c.press(k, 'mv'); else c.release(k, 'mv'); };
    const cA = A.ctrl, place = (gap) => { for (const f of F) { f.setState('move'); f.vx = 0; f.hp = f.maxHp; f.inv = 0; if (f.dz) f.dz.chain = 0; } A.x = -gap / 2; K.x = gap / 2; A.dir = 1; K.dir = -1; };
    MD.loop = { id, step() {
      g.ais = [];
      for (const f of F) f.hp = f.maxHp;
      if (F.some((f) => f.state !== 'move' || (f.dz && f.dz.cine))) { wait = 50; return; }
      if (--wait > 0) return;
      wait = 160; phase++;
      press(cA, 'guard', false);
      switch (id) {
        case 'guard': place(150); press(cA, 'guard', true); break;
        case 'guardLow': place(140); press(cA, 'guard', true); K.startAtk('d_suneR'); break;
        case 'block': case 'recoil': place(140); press(cA, 'guard', true); K.startAtk('d_kesaR'); break;
        case 'bind': place(130); D.startBind(A, K); break;
        case 'sheathe': place(220); A.startAtk(A.wpn && A.wpn.iai ? 'ak_dKesa' : 'd_kesaR'); break;
        case 'hit': place(120); K.startAtk('d_kesaR'); break;
        default: place(/dash|nagare|oikomi/.test(id) ? 330 : 130); try { A.startAtk(id); } catch (e) { /* no such move */ }
      }
    } };
    return true;
  };
  (() => {
    let q = null; try { q = new URLSearchParams(location.search || ''); } catch (e) { return; }
    const id = q && q.get('move'); if (!id) return;
    const iv = setInterval(() => {
      const g = ND.game; if (!g || g.phase !== 'fight' || !g.F || g.F.length < 2) return;
      clearInterval(iv); MD.loopMove(id, q.get('who'));
      const t0 = g.tick; g.tick = function (...a) { if (MD.loop) MD.loop.step(); return t0.apply(this, a); };
    }, 200);
  })();
  const DEF_LEGS = { fSlipSake: 'down', fRugPull: 'down', fDiveRoll: 'air', fDiveRollB: 'air', fRunJumpOver: 'air', fStepstoolJump: 'air', fStepstoolUp: 'air',
    fLadderUp: 'air', fLadderDown: 'air', fCartwheel: 'air', fBackflip: 'air', fHandspring: 'air' };
  MD.act = (f, id, o = {}) => {
    const c = C(id);
    if (!c || !f) return false;
    const s = stateOf(f), from = o.from ?? 0, to = o.to ?? c.dur;
    s.act = { id, n: (s.actN = (s.actN || 0) + 1), t: 0, from, to, dur: Math.max(0.05, o.dur ?? Math.abs(to - from)), fade: o.fade ?? 0.18,
      legs: o.legs || DEF_LEGS[id] || null, keepSword: !!o.keepSword };
    return true;
  };
  MD.actStop = (f) => { const s = ST.get(f); if (s) s.act = null; };
  // (the moment playing, or the one just ended while its pose still fades out: 'id (end)')
  MD.actOf = (f) => { const s = ST.get(f); return s && s.act ? s.act.id : s && s.actTail ? s.actTail.id + ' (end)' : null; };
  MD.actLegs = (f) => { const s = ST.get(f); return s && s.act ? s.act.legs : s && s.actTail ? s.actTail.legs : null; };
  MD.rigOf = (f) => { const s = ST.get(f); return s ? s.rig : null; };
  MD.sourceOf = (f) => { const s = ST.get(f); const l = s && s.rig.layers[s.rig.layers.length - 1]; return l ? l.key : null; };

  // ------------------------------------------------------------------ drawing (after duel-depth's own override)
  const FP = ND.Fighter.prototype, draw0 = FP.draw;
  FP.draw = function (ctx, reflect, layer) {
    if (reflect || !MD.ready || !this.dz || this.dead || this.hidden || D.lite) return draw0.call(this, ctx, reflect, layer);
    const s = tick(this);
    if (!s || !s.rig.P) return draw0.call(this, ctx, reflect, layer);
    Mo.draw(ctx, s.rig, {});
  };
  // a disarmed fighter: the blade is on the floor, so none in the hand and none in the saya (the empty saya stays): the
  // last frames of a cross-fade from an armed clip and Akane's sheathed katana showed a second sword, 2026-10-03
  const build0 = Mo.Rig.prototype.build;
  Mo.Rig.prototype.build = function (F, dt) {
    if (this.noSword && F) { F.armed = 0; F.inside = 0; F.tw = 0; }
    const P = build0.call(this, F, dt);
    // (an empty-handed blow: the fist on its line onto the target, fistAim)
    const FA = this.fist, Pf = P || this.P;
    if (FA && FA.w > 0 && Pf) {
      const S = FA.S, sh = Pf['sh' + S], ha = Pf['ha' + S], el = Pf['el' + S];
      const r = Mo.ik3(sh, lerp(ha, FA.T, FA.w), L.uArm, L.fArm, sub(el, lerp(sh, ha, 0.5)));
      Pf['el' + S] = r.m; Pf['ha' + S] = r.e;
      if (Pf['wr' + S]) Pf['wr' + S] = madd(r.e, norm(sub(r.e, r.m)), -Mo.L20.hd);
      Pf['fist' + S] = true;
    }
    // (a sword held through a fall: its point rests on the floor, never in it)
    const Q = P || this.P;
    if (Q && Q.armed && Q.blade && !this.noSword) {
      const BL = (this.look.wpn || L).blade || 96, u = Q.blade.u, ty = Q.blade.h[1] + u[1] * BL;
      if (ty > -1.5 && Q.blade.h[1] < -1.5) { const sy = clamp((-1.5 - Q.blade.h[1]) / BL, -1, 1), h = Math.hypot(u[0], u[2]) || 1, k = Math.sqrt(1 - sy * sy) / h; let nx = u[0] * k, nz = u[2] * k;
        // (its length kept in the picture: at least 0.85 of it across, the rest in depth - a point on the floor pointing at the camera read as a stub)
        // (and, with the perspective, drawn at least 0.8 of its length: turned on toward the picture as far as that needs)
        const sx = nx < 0 || (nx === 0 && u[0] < 0) ? -1 : 1, szz = nz < 0 ? -1 : 1, top = 1 - sy * sy;
        const at = (q) => [sx * Math.sqrt(Math.max(0, q)), sy, szz * Math.sqrt(Math.max(0, top - q))];
        let need = Math.min(top, Math.max(nx * nx, 0.7225 - sy * sy));
        if (Mo.bladeDrawn(Q.blade.h, at(need), BL) < 0.8) { let lo = need, hi = top; for (let i = 0; i < 10; i++) { const m = (lo + hi) / 2; if (Mo.bladeDrawn(Q.blade.h, at(m), BL) < 0.8) lo = m; else hi = m; } need = hi; }
        if (need > nx * nx) { const v = at(need); nx = v[0]; nz = v[2]; }
        Q.blade.u = [nx, sy, nz]; const e = Q.blade.e, nu = Q.blade.u; Q.blade.e = norm(sub(e, mul(nu, dot(e, nu)))); }
    }
    return P;
  };
  let drawingNoSword = false;
  const kat0 = A3.drawKatana3;
  A3.drawKatana3 = function () { if (drawingNoSword) return; return kat0.apply(this, arguments); };
  const moDraw0 = Mo.draw;
  Mo.draw = function (ctx, rg) { drawingNoSword = !!(rg && rg.noSword); try { return moDraw0.apply(this, arguments); } finally { drawingNoSword = false; } };
  // what is drawn, for the props carried in a hand (the showpiece) and the continuity audit
  const snap0 = A3.snap;
  A3.snap = function (f, o) {
    // (brought up to this step first: the audit reads it without drawing)
    const s = MD.ready && !D.lite && f && f.dz && !f.dead && !f.hidden ? tick(f) : null;
    if (!s || !s.rig.P) return snap0.call(this, f, o);
    const rg = s.rig, P = rg.P, pj = (p) => Mo.project(rg, p);
    o = o || {};
    const put = (k, p) => { const q = pj(p); const t = o[k] || (o[k] = { x: 0, y: 0 }); t.x = q.x; t.y = q.y; };
    put('hip', P.hip); put('neck', P.neck); put('head', P.head); put('sh', P.shR);
    put('elF', P.elR); put('haF', P.haR); put('elB', P.elL); put('haB', P.haL);
    put('knF', P.knR); put('ftF', P.ftR); put('knB', P.knL); put('ftB', P.ftL); put('hipF', P.hipR); put('hipB', P.hipL); put('shB', P.shL);
    const BL = f.wpn.blade, u = P.blade.u;
    put('tip', madd(P.blade.h, u, BL)); put('pom', madd(P.blade.h, u, -f.wpn.handle)); put('hilt', P.armed ? madd(P.blade.h, u, 4) : P.blade.h); put('pomm', madd(P.blade.h, u, P.armed ? 4 - f.wpn.handle : -f.wpn.handle));
    put('saya', P.saya.a); put('sayaEnd', madd(P.saya.a, P.saya.u, P.saya.L)); put('obi', P.saya.a);
    o.u = { x: u[0], y: u[1], z: u[2] }; o.e = { x: P.blade.e[0], y: P.blade.e[1], z: P.blade.e[2] };
    o.armed = P.armed; o.sheathed = !P.armed; o.grip = P.gripL || 0; o.dir = rg.dir; o.mocap = true; o.fist = rg.fist && rg.fist.w > 0.3 ? rg.fist.S : null;
    return o;
  };
})(window.ND);
