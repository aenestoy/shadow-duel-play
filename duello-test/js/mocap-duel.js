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
      const seg = segOf(a, f.atkName || a.name || '');
      if (seg && (seg[0] !== 'drawFwd' || f.wpn.iai)) return { key: 'atk:' + f.serial + ':' + seg[0], src: clip(seg[0], () => warp(seg, a, f.st)), fade: 0.06, seg, a };
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
        if (st === 'down' && f.st > RISE0 && C('fGetUp')) return { key: 'getup:' + s.kdSerial, src: clip('fGetUp', () => riseT(f), { post: sheathed }), fade: 0.22 };
        return { key: 'kd:' + s.kdSerial, src: clip('knockdown', () => Math.min(C('knockdown').dur, 0.55 + s.kdT), { post: sheathed }), fade: 0.05 };
      case 'getup':
        if (C('fGetUp')) return { key: 'getup:' + s.kdSerial, src: clip('fGetUp', () => riseT(f), { post: sheathed }), fade: 0.22 };
        return { key: 'getup:' + f.serial, src: clip('getUp', () => 0.6 + f.st * 2.4, { post: sheathed }), fade: 0.15 };
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
  function actPost(f, A) { return (fr) => { if (!(A.keepSword && isArmed(f) && fr.armed)) sheathed(fr); }; }
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
    const wcT = contactW(f);
    s.cw = s.cw == null || dt <= 0 ? wcT : s.cw + (wcT - s.cw) * Math.min(1, dt / 0.035);
    const wc = s.cw > 0.01 ? s.cw : 0, wf = wc > 0 ? 0 : drawFlatW(f, s);
    if (wc <= 0 && wf <= 0) { rg.ovr = null; s.ovPrev = null; return; }
    if (wc > 0) {
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
    bodyGap(f, s, dt);
    rg.update(dt);
    s.tickedAt = clk;
    // the pair, once a step: the other brought up to this step first (both as they will be drawn), then kept apart
    const o = f.opp, so0 = o && o.dz && !o.dead && !o.hidden ? stateOf(o) : null;
    if (!noPair && MD.sep && so0 && s.pairAt !== clk) {
      if (so0.tickedAt !== clk) tick(o, true);
      s.pairAt = so0.pairAt = clk;
      if (so0.tickedAt === clk && so0.rig.P) { kickStop(f, s, o, so0); kickStop(o, so0, f, s); apart(f, s, o, so0); } // (legs first: a bent kicking leg may bring its thigh in)
    }
    return s;
  }
  MD.tick = tick;
  // ------------------------------------------------------------------ two bodies never drawn inside each other
  // Outside a bind (its own lean keeps the pair apart: bodyGap) the two fighters' heads and torsos (as drawn: the torso
  // a capsule hip → neck of radius 17, the head 14, the thighs 10 — the same measure scripts/duel-body-audit.mjs checks) never overlap.
  // The drawn body is moved off the fight's x just enough (both by half; a body on the floor, getting up or launched
  // takes most of it); the fight's own x stays the truth, the offset eases back when there is room.
  // When the fight puts the two closer than BODY_MIN (a dash or a throw through, a juggle under the other) a drawing
  // cannot keep them apart without leaving the fight's place: those frames are left to the fight (the audit lists them).
  const BODY_MIN = 20, OX_MAX = 70;
  MD.sep = !(() => { try { return /[?&]sep=0(&|$)/.test(location.search || ''); } catch (e) { return false; } })(); // (?sep=0: off, to compare)
  const MOVERS = { down: 1, getup: 1, launch: 1 };
  function shapesOf(rg, dx) {
    const P = rg.P, pj = (p) => { const q = Mo.project(rg, p); q.x += dx; return q; };
    // (the thighs are body too: one standing over a body on the floor, or a kicking hip, never inside the other)
    return [[pj(P.hip), pj(P.neck), 17], [pj(P.head), null, 14], [pj(P.hipR), pj(P.knR), 10], [pj(P.hipL), pj(P.knL), 10]];
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
  function penOf(A, B) { let pen = 0; for (const [p, q, r1] of A) for (const [u, v, r2] of B) pen = Math.max(pen, r1 + r2 - segDist(p, q, u, v)); return pen; }
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
    const B = shapesOf(so.rig, 0).slice(0, 2);
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
    put('knF', P.knR); put('ftF', P.ftR); put('knB', P.knL); put('ftB', P.ftL); put('hipF', P.hipR); put('hipB', P.hipL); put('shB', P.shL);
    const BL = f.wpn.blade, u = P.blade.u;
    put('tip', madd(P.blade.h, u, BL)); put('pom', madd(P.blade.h, u, -f.wpn.handle)); put('hilt', P.armed ? madd(P.blade.h, u, 4) : P.blade.h); put('pomm', madd(P.blade.h, u, P.armed ? 4 - f.wpn.handle : -f.wpn.handle));
    put('saya', P.saya.a); put('sayaEnd', madd(P.saya.a, P.saya.u, P.saya.L)); put('obi', P.saya.a);
    o.u = { x: u[0], y: u[1], z: u[2] }; o.e = { x: P.blade.e[0], y: P.blade.e[1], z: P.blade.e[2] };
    o.armed = P.armed; o.sheathed = !P.armed; o.grip = P.gripL || 0; o.dir = rg.dir; o.mocap = true;
    return o;
  };
})(window.ND);
