













(function (ND) {
  'use strict';
  const Q = (() => { try { return location.search || ''; } catch (e) { return ''; } })();
  const ON = !/[?&]duel=0(&|$)/.test(Q) && !/[?&]mocap=0(&|$)/.test(Q) && !/[?&]mduel=0(&|$)/.test(Q);
  const Mo = ND.mocap, D = ND.duel, A3 = ND.depth25;
  if (!ON || !Mo || !D || !A3 || !ND.Fighter) return;
  const L = ND.LEN, PO = ND.POSES;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const { add, sub, mul, madd, dot, len, norm, lerp, nlerp } = Mo.v;
  const MD = (D.mocap = { on: true, ready: false, stats: { clip: 0, keyed: 0, contact: 0 }, src: new Map() });






  const SEG = {
    downR: ['comboSlash', 0.56, 0.87, 1.08],
    downL: ['twoHandCombo', 1.18, 1.36, 1.62],
    down: ['overhead', 0.38, 0.66, 0.98],
    men: ['overhead', 0.12, 0.74, 1.2],
    heavy: ['powerSlash', 0.32, 0.75, 1.3],
    up: ['comboSlash', 2.42, 2.68, 2.96],
    level: ['comboSlash', 1.5, 1.77, 1.88],
    low: ['lowSlash', 0.62, 0.92, 1.4],
    lowRise: ['crouchSlash', 0.25, 0.47, 0.7],
    short: ['twoHandCombo', 0.47, 0.64, 0.86],
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

    axe: ['fKickAxe', 0.12, 0.75, 1.1],
    frontF: ['fKickFrontU', 0.1, 0.47, 0.9],
    roundF: ['fKickRoundU', 0.0, 0.4, 0.95],
    spinF: ['fKickSpinBackU', 0.05, 0.59, 1.15],
    draw: ['drawFwd', 0.43, 0.87, 1.15],

    dashCut: ['comboSlash', 1.69, 1.77, 1.84],
  };
  const MOVE = {
    ak_dNuki: 'draw', ak_dKesa: 'downR', d_kesaR: 'downR', d_kesaL: 'downL', d_shomen: 'down', d_men: 'men', d_kesaH: 'heavy',
    d_kiriUp: 'up', d_antiH: 'up', d_antiL: 'lowRise', d_suneR: 'low', kr_nagi: 'low', d_dashR: 'dashCut', d_doL: 'level', d_oikomi: 'level',
    d_nagare: 'downL', d_kote: 'short', d_kabuto: 'men', kr_iwa: 'heavy', kr_kuruma: 'spin', d_taiatari: 'hilt', ak_tsuka: 'hilt',
    d_hiza: 'kickA', d_kakato: 'axe',
    ua_jab: 'jab', ua_cross: 'cross', ua_lunge: 'cross', ua_palm: 'palm', ua_upper: 'upper', ua_elbow: 'elbow', ua_ram: 'elbow',
    ua_front: 'frontF', ua_round: 'roundF', ua_spinKick: 'spinF',

    light1: 'downR', light2: 'downL', light3: 'down', heavy: 'men', dash: 'dashCut',
  };

  MD.KEYED = ['d_tsuki', 'd_tsukiL3', 'd_tobikomi', 'd_wallL', 'd_kaiten', 'd_ashibarai', 'ak_dKiri', 'ak_tsubame', 'ak_kage', 'ak_ryusei', 'ak_maki', 'kr_uchi',

    'dk_sweep', 'dk_spin', 'dk_wrist', 'dk_fly', 'ak_nidan',
    'ua_bf', 'ua_knee', 'ua_sweep', 'ua_air', 'ua_stomp', 'ua_flyknee', 'ua_ki', 'ua_cRip', 'ua_cSweep', 'ua_cSpin', 'ua_cHeavy', 'ua_cFin',
    'parry', 'clash', 'dbind', 'droll', 'dodge', 'air / jump', 'land', 'specials', 'counters', 'showpiece except the vault and the bottle'];

  function segOf(a, name) {
    const k = MOVE[name];
    if (k) return SEG[k];
    if (!a || a.special || a.counter) return null;
    const z = a.dz3;
    if (a.kind === 'blade' && z) return z.v === 'down' ? (z.side < 0 ? SEG.downL : z.side > 0 ? SEG.downR : SEG.down) : z.v === 'up' ? SEG.up : z.v === 'level' ? SEG.level : null;
    return null;
  }

  function warp(seg, a, t) {
    const [, c0, cH, c1] = seg;
    const act = a.active || [a.dur * 0.3, a.dur * 0.45];

    const tH = act[0] + (act[1] - act[0]) * 0.05, dur = Math.max(a.dur || 0.5, tH + 0.05);
    if (t <= tH) return c0 + (cH - c0) * clamp(t / Math.max(1e-3, tH), 0, 1);
    return cH + (c1 - cH) * clamp((t - tH) / Math.max(1e-3, dur - tH), 0, 1);
  }



  const ACTS = ['fSlipSake', 'fRugPull', 'fStoolPick', 'fRunJumpOver', 'fDiveRoll', 'fDiveRollB', 'fStepstoolJump', 'fStepstoolUp', 'fLadderUp', 'fLadderDown',
    'fCartwheel', 'fBackflip', 'fHandspring', 'fKickSide'];
  const CLIPS = [...new Set(Object.values(SEG).map((s) => s[0]).concat(['idle', 'walk', 'backWalk', 'run', 'blockIdle', 'blockedImpact', 'crouchBlockIdle', 'crouchBlockedImpact',
    'hitHead', 'hitBody', 'knockdown', 'getUp', 'sheathe', 'vault', 'pickThrow', 'fGetUp']))];



  let loading = false;
  MD.load = () => {
    if (loading) return; loading = true;
    Mo.loadAll(CLIPS).then(() => { MD.ready = true; credit(); Mo.loadAll(ACTS).catch(() => {}); }).catch((e) => { MD.error = String(e); });
  };
  if (/[?&]duel=1(&|$)/.test(Q) || /[?&]mocap=1(&|$)/.test(Q)) MD.load();
  else {
    const G0 = ND.game, nm0 = G0 && G0.newMatch;
    if (nm0) G0.newMatch = function () { const r = nm0.apply(this, arguments); if (this.F && this.F.some((f) => f.dz)) MD.load(); return r; };
    try { setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(() => MD.load(), { timeout: 4000 }) : MD.load()), 6000); } catch (e) { MD.load(); }
  }



  MD.CREDIT = 'Motion capture data: ACCAD Open Motion Project, The Ohio State University, CC BY 3.0';
  function credit() {
    try {
      if (typeof document === 'undefined' || !document.body || document.getElementById('mocap-credit')) return;
      const el = document.createElement('div');
      el.id = 'mocap-credit'; el.textContent = MD.CREDIT;
      el.style.cssText = 'position:fixed;left:6px;bottom:2px;font:9px/1.2 sans-serif;color:rgba(255,255,255,.5);text-shadow:0 1px 2px #000;pointer-events:none;z-index:40';
      document.body.appendChild(el);

      const G1 = ND.game;
      if (G1) setInterval(() => { const on = !!(G1.F && G1.F[0] && G1.F[0].dz && !D.lite && (G1.phase === 'fight' || G1.phase === 'intro' || G1.phase === 'ko')); if (el.hidden === on) el.hidden = !on; }, 500);
    } catch (e) {               }
  }
  const C = (id) => Mo.clips[id];


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

    if (Mo.fill20) Mo.fill20(d, true);
    return out;
  }


  const ST = new WeakMap();
  (ND.onLook || (ND.onLook = [])).push((f) => { ST.delete(f); });



  function stateOf(f) {
    let s = ST.get(f);
    if (s && (s.ch !== f.ch || s.col !== f.col || s.wpn !== f.wpn)) s = null;
    if (!s) {
      s = { rig: new Mo.Rig(f, f.x, f.dir), clk: null, walkT: 0, lastSheathed: null, sheatheT: 9, impactT: 9, lastState: '', lastSerial: -1, ch: f.ch, col: f.col, wpn: f.wpn };
      s.rig.driven = true; s.rig.travel = 0; s.rig.footLock = true; s.rig.maxTurn = 26;
      ST.set(f, s);
    }
    return s;
  }
  const AIRS = { air: 1, jump: 1, launch: 1, plunge: 1 };
  const isArmed = (f) => !(f.dz && f.dz.armed === false) && !(f.wpn && (f.wpn.fist || f.wpn.none));

  function direct(f, s, dt) {
    const st = f.state, a = st === 'atk' ? f.atk : null, armed = isArmed(f);
    const clip = (id, t, extra) => Object.assign({ clip: C(id), t: typeof t === 'function' ? t : () => t }, extra || {});
    const keyed = { frame: (out) => keyedFrame(f, out) };
    const seqc = st === 'dseq' && f.dz ? f.dz.seq : null;

    if (seqc) {
      const t = seqc.t;


      if (seqc.att === f && t > 3.95 && t < 4.5) return { key: 'seq:throw', src: clip('pickThrow', () => seg3(t, [3.97, 4.21, 4.48], [2.02, 2.45, 2.85])), fade: 0.12 };
      return { key: 'keyed', src: keyed, fade: 0.12 };
    }
    if (f.dead) return null;

    const A = s.act;
    if (A && C(A.id)) return { key: 'act:' + A.n, src: clip(A.id, () => A.from + (A.to - A.from) * clamp(A.t / A.dur, 0, 1), { post: actPost(f, A) }), fade: A.fade, act: A };
    if (a) {


      const seg = segOf(a, armed ? f.atkName || a.name || '' : atkId(a));
      if (seg && !armed && C(seg[0]) && C(seg[0]).sword !== 'none') return { key: 'keyed', src: keyed, fade: 0.08 };
      if (seg && (seg[0] !== 'drawFwd' || f.wpn.iai)) return { key: 'atk:' + f.serial + ':' + seg[0], src: clip(seg[0], () => warp(seg, a, f.st), armed ? null : { post: unarm }), fade: 0.06, seg, a };
      return { key: 'keyed', src: keyed, fade: 0.08 };
    }
    switch (st) {
      case 'dbind': {



        return { key: 'keyed', src: keyed, fade: 0.08 };
      }
      case 'move': case 'zanshin': case 'win': case 'land': {
        if (!f.onGround) return { key: 'keyed', src: keyed, fade: 0.1 };
        const sp = f.vx * (f.dir < 0 ? -1 : 1);

        if (armed && f.wpn.iai && f.sheathed && f.sheathed()) {


          if (s.sheatheT < 0.55) return { key: 'keyed', src: keyed, fade: 0.1 };
          if (Math.abs(sp) > 40) return { key: 'keyed', src: keyed, fade: 0.15 };


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



      case 'guard': case 'block':
        return { key: 'keyed', src: keyed, fade: 0.1 };
      case 'recoil':
        if (armed) return { key: 'keyed', src: keyed, fade: 0.06 };
        return { key: 'recoil:' + f.serial, src: clip('hitBody', () => Math.min(0.8, 0.05 + f.st * 1.3), { post: unarm }), fade: 0.05 };
      case 'hurt': case 'gbreak': case 'stagger': {


        return { key: st + ':' + f.serial, src: clip('hitHead', () => 0.45 + f.st * 1.2, { post: armed ? (finStruckArmed(f) ? lowBlade : null) : unarm }), fade: 0.06 };
      }
      case 'launch': case 'down':


        if (st === 'down' && f.st > RISE0 && C('fGetUp')) return { key: 'getup:' + s.kdSerial, src: clip('fGetUp', () => riseT(f), { post: keepOf(f) }), fade: 0.22 };
        return { key: 'kd:' + s.kdSerial, src: clip('knockdown', () => Math.min(C('knockdown').dur, 0.55 + s.kdT), { post: keepOf(f) }), fade: 0.05 };
      case 'getup':
        if (C('fGetUp')) return { key: 'getup:' + s.kdSerial, src: clip('fGetUp', () => riseT(f), { post: keepOf(f) }), fade: 0.22 };
        return { key: 'getup:' + f.serial, src: clip('getUp', () => 0.6 + f.st * 2.4, { post: keepOf(f) }), fade: 0.15 };
      default:
        return { key: 'keyed', src: keyed, fade: 0.1 };
    }
  }

  const RISE0 = 0.12, RISE_T = 0.75 - RISE0 + 0.46;
  function riseT(f) { const t = f.state === 'down' ? f.st - RISE0 : 0.75 - RISE0 + f.st; return C('fGetUp').dur * clamp(t / RISE_T, 0, 1); }
  function seg3(t, T, Cc) { if (t <= T[1]) return Cc[0] + (Cc[1] - Cc[0]) * clamp((t - T[0]) / (T[1] - T[0]), 0, 1); return Cc[1] + (Cc[2] - Cc[1]) * clamp((t - T[1]) / (T[2] - T[1]), 0, 1); }






  const sheathedNow = (f) => !!(f.wpn && f.wpn.iai && f.sheathed && f.sheathed());
  function keepOf(f) { return !isArmed(f) ? unarm : sheathedNow(f) ? sheathed : holdSword; }
  function actPost(f, A) { return (fr) => { if (!isArmed(f)) unarm(fr); else if (sheathedNow(f)) sheathed(fr); else if (!(A.keepSword && fr.armed)) holdSword(fr); }; }




  function finStruckArmed(f) { const c = D.finOf && D.finOf(f); return !!(c && c.un && c.V === f && isArmed(f)); }
  function lowBlade(fr) {
    if (!fr.armed || fr.inside) return;
    const u = fr.d.bu;
    fr.d.bu = norm([-0.6, -0.8, u[2] * 0.2 + 0.15]); fr.d.be = [0, -1, 0];

    const fa = fr.d.faR; fr.d.faR = norm([fa[0] * 0.3, Math.max(0.2, fa[1]), fa[2]]);
    if (fr.d.fwR) fr.d.fwR = fr.d.faR.slice(); if (fr.d.hdR) fr.d.hdR = fr.d.faR.slice();
    fr.tw = 0;
  }
  function keepLow(fr) { holdSword(fr); lowBlade(fr); }


  const UPB = norm([-0.62, 0.75, -0.25]);
  function bladeUp(P) {
    if (!P || !P.armed || P.inside || !P.blade) return;
    const u = UPB, e0 = P.blade.e || [0, -1, 0], d = dot(e0, u);
    let e = [e0[0] - u[0] * d, e0[1] - u[1] * d, e0[2] - u[2] * d]; const l = len(e); e = l > 1e-4 ? mul(e, 1 / l) : [0, 0, 1];
    P.blade = Object.assign({}, P.blade, { u: u.slice(), e });
  }
  function unarm(fr) { fr.armed = 0; fr.inside = 0; fr.tw = 0; fr.fistR = 1; fr.fistL = 1; }
  function sheathed(fr) { fr.armed = 0; fr.inside = 0; fr.tw = 0; }
  function holdSword(fr) {
    if (fr.armed && !fr.inside) return;
    const fa = fr.d.faR, u = norm([fa[0], fa[1] - 0.35, fa[2]]);
    fr.d.bu = u; fr.d.be = Math.abs(u[1]) > 0.9 ? [1, 0, 0] : [0, -1, 0];
    fr.armed = 1; fr.inside = 0; fr.vis = null; fr.tw = 0; fr.fistR = 1;
  }

  const ATKN = new Map();
  function atkId(a) { if (!ATKN.has(a)) for (const k in ND.ATK) ATKN.set(ND.ATK[k], k); return ATKN.get(a) || a.name || ''; }

  function lowGuard(f) {
    const s = stateOf(f);
    if (f.state === 'guard') { try { const th = D.threat(f); s.low = th.ok ? th.h === 'low' : s.low && f.st > 0; } catch (e) { s.low = false; } }
    return !!s.low;
  }


  function contactW(f) {
    const st = f.state, o = f.opp;
    if (st === 'block' || st === 'parry' || st === 'clash' || st === 'recoil') return clamp(1 - (f.st - 0.12) / 0.15, 0, 1);
    if (st === 'dbind') return 1;
    if (st === 'atk' && o && (o.state === 'block' || o.state === 'parry' || o.state === 'clash')) return clamp(1 - (o.st - 0.1) / 0.15, 0, 1);
    return 0;
  }

  function drawFlatW(f, s) {
    const a = f.state === 'atk' ? f.atk : null;
    if (!a || !f.wpn.iai || MOVE[f.atkName] !== 'draw') return 0;
    const act = a.active || [0.08, 0.14];
    return clamp(f.st / Math.max(1e-3, act[0]), 0, 1) * clamp(1 - (f.st - act[1]) / 0.12, 0, 1);
  }
  const O3 = {};
  function override(f, s, dt) {
    const rg = s.rig, dir = f.dir < 0 ? -1 : 1;


    let BG = D.bindGeom ? D.bindGeom(f) : null;

    if (BG && rg.P && len(sub(BG.h, rg.P.shR)) > 150) BG = null;


    if (BG && BG.w > 0) {
      if (!s.bgOn) { s.bw = s.cw || 0; s.ovPrev = null; rg.x -= s.ox || 0; s.ox = 0; }
      s.bgOn = true; s.bw = Math.min(BG.w, s.bw + (dt > 0 ? dt / 0.03 : 0));



      { const tgt = f.wpn && f.wpn.type === 'naginata' ? Math.max(0, f.wpn.blade - 96) * s.bw : 0; rg.poleSlide = (rg.poleSlide || 0) + (tgt - (rg.poleSlide || 0)) * Math.min(1, dt > 0 ? dt / 0.06 : 1); }
      O3.h = BG.h; O3.u = BG.u; O3.e = BG.e; O3.w = s.bw; ovSmooth(s, dt); oxComp(s, dir); rg.ovr = O3; s.cw = s.bw; MD.stats.contact++; return;
    }
    s.bgOn = false;
    if (rg.poleSlide) { rg.poleSlide *= Math.exp(-Math.max(0, dt) / 0.08); if (rg.poleSlide < 0.5) rg.poleSlide = 0; }
    O3.e = null;



    { const SL = slideAt(f, s, rg, dir); if (SL) { O3.h = SL.h; O3.u = SL.u; O3.w = SL.w; ovSmooth(s, dt); oxComp(s, dir); rg.ovr = O3; MD.stats.slide = (MD.stats.slide || 0) + 1; return; } }
    const wcT = contactW(f);
    s.cw = s.cw == null || dt <= 0 ? wcT : s.cw + (wcT - s.cw) * Math.min(1, dt / 0.035);

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

      O3.h = [46, -112, 6]; O3.u = norm([0.96, -0.05, -0.28]); O3.w = wf * 0.85;
    }
    ovSmooth(s, dt); oxComp(s, dir);
    rg.ovr = O3;
  }




  function aimW(f) {
    const a = f.state === 'atk' ? f.atk : null, o = f.opp;
    if (!a || a.kind !== 'blade' || !a.active || !o || o.dead || o.hidden || (f.dz && f.dz.armed === false)) return 0;
    if (f.dz && f.dz.cine && !f.dz.cine.fin) return 0;


    const t = f.st, W = a.hits && a.hits.length ? a.hits : [a.active];
    let best = 0;
    for (const [a0, a1] of W) { const k = clamp((t - (a0 - 0.08)) / 0.07, 0, 1) * clamp(1 - (t - a1) / 0.1, 0, 1); if (k > best) best = k; }



    if (t >= W[W.length - 1][0] && (o.state === 'hurt' || o.state === 'stagger' || o.state === 'launch') && o.st > 0.04) best *= clamp(1 - (o.st - 0.04) / 0.08, 0, 1);
    return best * best * (3 - 2 * best);
  }
  function slideAt(f, s, rg, dir) {
    const a = f.state === 'atk' ? f.atk : null, o = f.opp;
    if (!a || !a.counter || !a.slide || !isArmed(f) || !o || o.dead || !isArmed(o)) return null;
    const S2 = a.slide, t = f.st, end = Math.max(S2[1], a.defl || 0) + 0.03;
    if (t < S2[0] || t > end + 0.05) return null;

    if (aimW(f) > 0.01) return null;
    const so = ST.get(o), P = rg.P;
    if (!P || !so || !so.rig.P || !so.rig.P.armed || Math.abs(o.x - f.x) > 300) return null;
    const Q = so.rig.P, BLo = (o.wpn && o.wpn.blade) || 96, BL = (f.wpn && f.wpn.blade) || 96;
    const k = Math.min(1, Math.max(0, (t - S2[0]) / Math.max(1e-3, end - S2[0])));
    const along = 0.45 + 0.4 * k;
    const cw = Mo.project(so.rig, madd(Q.blade.h, Q.blade.u, BLo * along));

    const oh = Mo.project(so.rig, Q.hip);
    if ((cw.x - oh.x) * (f.x - o.x) < 18) return null;
    const T = [(cw.x - rg.x) * dir, cw.y, P.haR[2]];

    const tipW = Mo.project(so.rig, madd(Q.blade.h, Q.blade.u, BLo)), hiW = Mo.project(so.rig, Q.blade.h);
    let ux = (hiW.x - tipW.x) * dir, uy = hiW.y - tipW.y; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    const ca = Math.cos(-0.45), sa = Math.sin(-0.45), u = norm([-(ux * ca - uy * sa), -(ux * sa + uy * ca), 0]);
    const want = [T[0] - u[0] * BL * 0.55, T[1] - u[1] * BL * 0.55 + 6, T[2]];
    const v = sub(want, P.shR), lv = len(v), reach = 53, h = lv > reach ? add(P.shR, mul(v, reach / lv)) : want;
    const w = t <= end ? 1 : Math.max(0, 1 - (t - end) / 0.05);

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



      const z = f.atk && f.atk.dz3 ? f.atk.dz3.v : 'level', low = z === 'low';
      const hip = pj(Q.hip), nk = pj(Q.neck), towards = f.x < o.x ? -1 : 1;
      let c, r;
      if (low) { const sd = lerp(Q.hipR, Q.knR, 0.5), sd2 = lerp(Q.hipL, Q.knL, 0.5), a1 = pj(sd), a2 = pj(sd2); c = (a1.x - a2.x) * towards > 0 ? a1 : a2; r = 10; }

      else { const k = z === 'down' ? 0.65 : 0.55; c = { x: hip.x + (nk.x - hip.x) * k, y: hip.y + (nk.y - hip.y) * k }; r = TORSO_R - 2; }
      T = loc({ x: c.x + towards * (r - 1), y: c.y });
    }
    const H = P.haR, toT = sub(T, H), d = len(toT);
    if (d < 1e-3) return null;



    if (!defending) {
      const j = f.viewJ ? f.viewJ() : f.j;
      if (j && j.haF && j.tip) {
        const bx = (j.tip.x - j.haF.x) * dir, by = j.tip.y - j.haF.y, bl = Math.hypot(bx, by) || 1;
        const uc = norm([bx / bl, by / bl, P.blade.u[2] * 0.3]);
        const want = sub(T, mul(uc, BL * 0.9)), sh = P.shR, v = sub(want, sh), lv = len(v), reach = !f.onGround || AIRS[f.state] ? 59 : 53;
        return { h: lv > reach ? add(sh, mul(v, reach / lv)) : want, u: uc };
      }
    }


    const u0 = norm(toT), want = sub(T, mul(u0, BL * (defending ? 0.55 : 0.97))), sh = P.shR, v = sub(want, sh), lv = len(v), reach = !f.onGround || AIRS[f.state] ? 59 : 53;
    const h = lv > reach ? add(sh, mul(v, reach / lv)) : want;
    return { h, u: norm(sub(T, h)) };
  }




  const FIST_HEAD = { ua_jab: 1, ua_cross: 1, ua_upper: 1, ua_bf: 1, ua_cFin: 1 };
  function fistAim(f, s, dt) {
    const rg = s.rig, a = f.state === 'atk' ? f.atk : null, o = f.opp, dir = f.dir < 0 ? -1 : 1;
    let w = 0;
    if (a && a.active && !isArmed(f) && /^(haF|haB)$/.test(a.limb || '') && o && !o.dead && !o.hidden && !(f.dz && f.dz.cine && !f.dz.cine.fin) && Math.abs(o.x - f.x) < 260) {
      const t = f.st, a0 = a.active[0], a1 = a.active[1];
      const k = clamp((t - (a0 - 0.06)) / 0.06, 0, 1) * clamp(1 - (t - a1) / 0.14, 0, 1);
      w = k * k * (3 - 2 * k);
    }
    const so = o ? ST.get(o) : null, P = rg.P;
    if (w <= 0.01 || !P || !so || !so.rig.P) { rg.fist = null; s.reach = (s.reach || 0) * Math.exp(-Math.max(0, dt) / 0.08); if (s.reach < 0.3) s.reach = 0; rg.x = f.x + (s.ox || 0) + (s.reach || 0) * dir; return; }

    if (s.fistSer !== f.serial) { s.fistSer = f.serial; s.fistSide = P.haR[0] >= P.haL[0] ? 'R' : 'L'; }
    const S = s.fistSide, Q = so.rig.P, pj = (q) => Mo.project(so.rig, q), towards = f.x < o.x ? -1 : 1;
    let Tw;
    if (FIST_HEAD[atkId(a)]) { const h = pj(Q.head); Tw = { x: h.x + towards * 20, y: h.y + 2 }; }
    else { const h = pj(Q.hip), n = pj(Q.neck); Tw = { x: h.x + (n.x - h.x) * 0.72 + towards * (TORSO_R + 7), y: h.y + (n.y - h.y) * 0.72 }; }

    const sh = P['sh' + S], baseX = f.x + (s.ox || 0);
    const need = Math.hypot((Tw.x - baseX) * dir - sh[0], Tw.y - sh[1]) - 55;
    const want = clamp(need, 0, 40) * w;
    s.reach = dt > 0 && s.reach != null ? s.reach + (want - s.reach) * Math.min(1, dt / 0.03) : want;
    rg.x = baseX + s.reach * dir;
    rg.fist = { S, T: [(Tw.x - rg.x) * dir, Tw.y, P['ha' + S][2]], w };
  }

  function oxComp(s, dir) { if (s.ox) O3.h = [O3.h[0] - s.ox * dir, O3.h[1], O3.h[2]]; }


  function ovSmooth(s, dt) {
    const k = s.ovPrev && dt > 0 ? Math.min(1, dt / 0.03) : 1;
    if (k < 1) { O3.h = lerp(s.ovPrev.h, O3.h, k); O3.u = nlerp(s.ovPrev.u, O3.u, k); }
    s.ovPrev = { h: O3.h.slice(), u: O3.u.slice() };
  }






  function bodyGap(f, s, dt) {
    const rg = s.rig, P = rg.P, BG = D.gapPoint && D.gapPoint(f);
    let target = 0;
    if (BG && P) {
      const dir = f.dir < 0 ? -1 : 1, room = (BG.x - f.x - (s.ox || 0)) * dir - 15;

      const th0 = rg.lean || 0, cs = Math.cos(th0), sn = Math.sin(th0), h = P.hip;
      let front = -1e9, ht = 60;
      const hr = D.headR ? D.headR(f) : 14;
      for (const [k, r] of [['head', hr], ['neck', 11], ['shR', 9], ['shL', 9], ['chest', 14]]) {
        const q = P[k]; if (!q) continue;

        const dx = q[0] - h[0], dy = q[1] - h[1], x0 = dx * cs - dy * sn, y0 = dx * sn + dy * cs;
        if (x0 + r > front) { front = x0 + r; ht = Math.max(30, -y0); }
      }
      front += h[0];

      const need = (front - room) / ht;
      target = clamp(need, -0.12, 0.7);
    }
    const k = Math.min(1, Math.max(dt, 0) / 0.05);
    rg.lean = BG ? (rg.lean == null ? target : Math.max(target, (rg.lean || 0) + (target - (rg.lean || 0)) * k)) : (rg.lean || 0) * (1 - k);
    if (Math.abs(rg.lean) < 1e-3) rg.lean = 0;
  }


  function tick(f, noPair) {
    const s = stateOf(f), rg = s.rig;
    const clk = ND.simClock || 0;
    if (s.clk === clk && rg.P && s.tickedAt === clk) return s;
    let dt = s.clk == null ? 0 : clk - s.clk;
    if (dt < 0 || dt > 0.25) { dt = 0; rg.layers.length = 0; rg.lock.R = rg.lock.L = null; rg.prevF = null; s.ox = 0; s.act = null; s.actTail = null; }
    s.clk = clk;

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


        if (A.legs === 'down' && !A.noRise && C('fGetUp') && f.state !== 'down' && f.state !== 'getup' && f.state !== 'launch') {
          MD.act(f, 'fGetUp', { dur: 0.9, legs: 'down', fade: 0.1 }); s.act.noRise = true;
        }
      }
    } else if (s.actTail && (s.actTail.t -= dt) <= 0) s.actTail = null;

    if (dt > 0 && s.px != null) s.mx = (s.mx || 0) * 0.8 + ((f.x - s.px) / dt) * 0.2;
    s.px = f.x;



    if (s.ox) { const bind = f.state === 'dbind' || (f.dz && f.dz.cine && !f.dz.cine.done && !f.dz.cine.fin); s.ox *= Math.exp(-Math.max(0, dt) / (bind ? 0.04 : 0.22)); if (Math.abs(s.ox) < 0.2) s.ox = 0; }
    rg.x = f.x + (s.ox || 0); rg.dir = f.dir < 0 ? -1 : 1; rg.vx = f.vx;
    rg.noSword = !isArmed(f);


    rg.oneHand = f.dz && f.dz.armed === false ? f.dz.oneHand || null : null;
    rg.pickTwo = !!(f.dz && f.dz.pickTwo);
    { let to = null;
      if (rg.pickTwo && f.dz.armed === false && D.swordOf) { const sw = D.swordOf(f); if (sw && sw.resting() && sw.bl) { const Pq = { x: 0, y: 0 }; sw.pt(-0.12 + 32 / sw.bl, Pq); to = [(Pq.x - rg.x) * rg.dir, Math.min(-3, Pq.y), rg.P ? rg.P.haL[2] : -6]; } }
      rg.leftTo = to || rg.leftTo; rg.leftW = clamp((rg.leftW || 0) + (to ? 1 : -1) * Math.max(0, dt) / 0.12, 0, 1); if (!rg.leftW) rg.leftTo = null; }
    const d = direct(f, s, dt);
    if (!d) return null;

    if (d.src.along && Math.abs(s.mx || 0) > 30) rg.dir = s.mx < 0 ? -1 : 1;

    rg.y = d.src.y != null ? d.src.y : f.y;

    const st = f.state, a = st === 'atk' ? f.atk : null;
    const segK = d.seg && /kick|Kick|front|round/.test(d.seg[0] + (MOVE[f.atkName] || ''));
    const air = AIRS[st] || !f.onGround || f.y < -2;
    const kick = air || (a && (a.kind === 'kick' || /^(ftF|ftB|knF|knB)$/.test(a.limb || ''))) || !!segK || d.key === 'seq:vault';


    const actL = d.act ? d.act.legs : s.actTail ? s.actTail.legs : null;
    const down = st === 'down' || st === 'getup' || st === 'launch' || !!f.roll || d.key.startsWith('kd:') || d.key.startsWith('getup') || actL === 'down';
    const L2 = s.legs || (s.legs = {});

    L2.grounded = !air && !down && !f.hidden && actL !== 'air'; L2.kick = !!kick || actL === 'air'; L2.down = !!down; L2.snap = dt <= 0;
    L2.onFloor = ((st === 'down' || st === 'getup') && f.onGround && f.y > -2) || (actL === 'down' && f.onGround && f.y > -2);
    L2.lying = st === 'down' && f.onGround && f.y > -2;
    rg.legs = L2;
    rg.footLock = f.onGround && f.state !== 'launch' && !f.roll;
    if (d.src.clip) MD.stats.clip++; else MD.stats.keyed++;
    rg.drive(d.key, d.src, d.fade);
    override(f, s, dt);
    fistAim(f, s, dt);
    bodyGap(f, s, dt);
    rg.update(dt);
    s.tickedAt = clk;

    const o = f.opp, so0 = o && o.dz && !o.dead && !o.hidden ? stateOf(o) : null;
    if (!noPair && MD.sep && so0 && s.pairAt !== clk) {
      if (so0.tickedAt !== clk) tick(o, true);
      s.pairAt = so0.pairAt = clk;


      if (so0.tickedAt === clk && so0.rig.P && !(D.passing && (D.passing(f) || D.passing(o)))) { kickStop(f, s, o, so0); kickStop(o, so0, f, s); bladeStop(f, s, o, so0); bladeStop(o, so0, f, s); const ox0 = (s.ox || 0) * 1e3 + (so0.ox || 0); apart(f, s, o, so0); if ((s.ox || 0) * 1e3 + (so0.ox || 0) !== ox0) { bladeStop(f, s, o, so0); bladeStop(o, so0, f, s); apart(f, s, o, so0); } secondStop(f, s, o, so0); secondStop(o, so0, f, s); chainStop(f, s, o, so0); chainStop(o, so0, f, s); }
    }


    if (f.wpn && f.wpn.type === 'kusarigama' && rg.P && ND.Chain && dt > 0) {
      const C = rg.chain || (rg.chain = new ND.Chain()), P = rg.P;
      const pm = Mo.project(rg, madd(P.blade.h, P.blade.u, -(f.wpn.handle || 12))), hl = Mo.project(rg, P.haL);
      const a = f.state === 'atk' ? f.atk : null, p = a && a.wpath ? a.wpath(f, f.st, CHP) : null;
      let tw = NaN;
      if (!p && (f.state === 'move' || f.state === 'win' || f.state === 'land' || f.state === 'zanshin')) { s.twA = ((s.twA || 0) + dt * 12 * (f.dir || 1)) % (Math.PI * 2); tw = s.twA; }
      C.update(dt, pm.x, pm.y, hl.x, hl.y, !!p, p ? p.x + (s.ox || 0) : 0, p ? p.y : 0, tw);


      const so1 = f.opp && ST.get(f.opp); if (so1 && so1.rig.P && s.pairAt === clk) chainStop(f, s, f.opp, so1);
    }
    return s;
  }
  const CHP = { x: 0, y: 0 };
  MD.tick = tick;









  const BODY_MIN = 20, OX_MAX = 80, TORSO_R = 24;
  MD.TORSO_R = TORSO_R;

  MD.torsoOf = (acc) => (acc === 'kabuto' ? TORSO_R + 4 : TORSO_R);
  MD.sep = !(() => { try { return /[?&]sep=0(&|$)/.test(location.search || ''); } catch (e) { return false; } })();
  const MOVERS = { down: 1, getup: 1, launch: 1 };
  function shapesOf(rg, dx) {
    const P = rg.P, pj = (p) => { const q = Mo.project(rg, p); q.x += dx; return q; };





    const FS = rg.fist && rg.fist.w > 0.3 ? rg.fist.S : null;

    const arm = (S) => [pj(P['el' + S]), pj(FS === S ? lerp(P['el' + S], P['ha' + S], 0.7) : P['ha' + S]), 6, 1];

    const hd = pj(P.head), kasa = rg.look && rg.look.ch && rg.look.ch.acc === 'kasa';
    return [[pj(P.hip), pj(P.neck), MD.torsoOf(rg.look && rg.look.ch && rg.look.ch.acc)], [hd, null, 14.5], kasa ? [{ x: hd.x - 27, y: hd.y - 8 }, { x: hd.x + 27, y: hd.y - 8 }, 6] : null, [pj(P.hipR), pj(P.knR), 11], [pj(P.hipL), pj(P.knL), 11],
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
    if (f.state === 'dbind' || o.state === 'dbind' || (f.dz && f.dz.cine && !f.dz.cine.done && !f.dz.cine.fin) || (o.dz && o.dz.cine && !o.dz.cine.done && !o.dz.cine.fin)) return;

    if (D.passing && (D.passing(f) || D.passing(o))) return;
    if (Math.abs(f.x - o.x) < BODY_MIN) return;
    const rA = s.rig, rB = so.rig, B = shapesOf(rB, 0);
    if (penOf(shapesOf(rA, 0), B) <= 0) return;

    const away = f.x < o.x ? -1 : 1;
    let lo = 0, hi = OX_MAX * 2;
    if (penOf(shapesOf(rA, away * hi), B) > 0) lo = hi; else for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (penOf(shapesOf(rA, away * m), B) > 0) lo = m; else hi = m; }
    const need = hi + 0.5;


    const mf = MOVERS[f.state] && !MOVERS[o.state] ? 0.8 : MOVERS[o.state] && !MOVERS[f.state] ? 0.2 : 0.5;
    const mv = (st, rg, sign, amt) => { const nx = clamp((st.ox || 0) + sign * amt, -OX_MAX, OX_MAX), d = nx - (st.ox || 0); st.ox = nx; slide(rg, d); return Math.abs(d); };
    let left = need - mv(s, rA, away, need * mf);
    left -= mv(so, rB, -away, need * (1 - mf) + Math.max(0, left - need * (1 - mf)));
    if (left > 0.3) mv(s, rA, away, left);
  }




  function stepBack(f, s, o, ft, inside) {
    const rg = s.rig, away = f.x < o.x ? -1 : 1, w = Mo.project(rg, ft);
    let d = 0;
    while (d < OX_MAX * 3 && inside({ x: w.x + away * d, y: w.y }) > 0) d += 1;
    const LIM = OX_MAX * 1.5, nx = clamp((s.ox || 0) + away * (d + 0.5), -LIM, LIM), got = Math.abs(nx - (s.ox || 0));
    slide(rg, nx - (s.ox || 0)); s.ox = nx;

    const so = ST.get(o), left = d + 0.5 - got;
    if (so && left > 0.3) { const ny = clamp((so.ox || 0) - away * left, -LIM, LIM); slide(so.rig, ny - (so.ox || 0)); so.ox = ny; }
  }

  function slide(rg, d) { if (!d) return; rg.x += d; for (const k of ['R', 'L']) if (rg.lock[k] && rg.lock[k].x != null) rg.lock[k].x += d; }
  function kickStop(f, s, o, so) {
    const rg = s.rig, P = rg.P;
    if (!so || !so.rig.P || !P || f.dead || o.dead || o.hidden) return;
    const B = shapesOf(so.rig, 0).slice(0, 2);

    const inside = (w) => { let m = -1e9; for (const [p, q, r] of B) { let cx = p.x, cy = p.y; if (q) { const vx = q.x - p.x, vy = q.y - p.y, l2 = vx * vx + vy * vy || 1, u = clamp(((w.x - p.x) * vx + (w.y - p.y) * vy) / l2, 0, 1); cx = p.x + vx * u; cy = p.y + vy * u; } m = Math.max(m, r + 1 - Math.hypot(w.x - cx, w.y - cy)); } return m; };
    const KC = s.kc || (s.kc = {});
    for (const k of ['R', 'L']) {
      const ft = P['ft' + k], hp = P['hip' + k], v = sub(ft, hp), pc = KC[k];
      const at = (ang, sc) => { const c = Math.cos(ang), sn = Math.sin(ang); return [hp[0] + (v[0] * c - v[1] * sn) * sc, hp[1] + (v[0] * sn + v[1] * c) * sc, hp[2] + v[2] * sc]; };
      let T = null;
      const legIn = (f2, k2) => Math.max(inside(Mo.project(rg, f2)), inside(Mo.project(rg, lerp(P['kn' + k], f2, 0.5))));
      if (legIn(ft) <= 0) {

        if (!pc) continue;
        const ang = pc.ang * 0.65, sc = 1 - (1 - pc.sc) * 0.65;
        if (Math.abs(ang) < 0.02 && sc > 0.985) { delete KC[k]; continue; }
        const q = at(ang, sc), r0 = Mo.ik3(hp, q, Mo.L.thigh, Mo.L.shin, sub(P['kn' + k], lerp(hp, ft, 0.5)));
        if (inside(Mo.project(rg, q)) > 0 || inside(Mo.project(rg, lerp(r0.m, r0.e, 0.5))) > 0 || (f.onGround && ft[1] > -4 && q[1] < ft[1] - 1)) { delete KC[k]; continue; }
        KC[k] = { ang, sc }; T = q;
      } else {


        const a = f.state === 'atk' ? f.atk : null, free = !f.onGround || AIRS[f.state] || f.state === 'launch' || f.state === 'down' || f.state === 'getup' || (a && (a.kind === 'kick' || /^(ftF|ftB|knF|knB)$/.test(a.limb || '')));
        const pa = pc ? pc.ang : 0, ps = pc ? pc.sc : 1, C = [], onFloor = f.onGround && ft[1] > -4;
        for (const sc of [1, 0.9, 0.8, 0.7, 0.6, 0.5]) for (let i = -30; i <= 30; i++) { const ang = (i * Math.PI) / 60; C.push([Math.abs(ang - pa) + Math.abs(sc - ps) * 1.5 + Math.abs(ang) * 0.2 + (1 - sc) * 0.3, ang, sc]); }
        C.sort((x, y) => x[0] - y[0]);
        for (const [, ang, sc] of C) {
          if (Math.abs(ang - pa) > 0.6 || Math.abs(sc - ps) > 0.3) continue;
          const q = at(ang, sc);

          if (!free && Math.atan2(q[1] - hp[1], Math.abs(q[0] - hp[0])) < 0.61) continue;
          if (onFloor && q[1] < ft[1] - 1) continue;
          if (inside(Mo.project(rg, q)) > 0) continue;

          const r0 = Mo.ik3(hp, q, Mo.L.thigh, Mo.L.shin, sub(P['kn' + k], lerp(hp, ft, 0.5)));
          if (inside(Mo.project(rg, lerp(r0.m, r0.e, 0.5))) > 0) continue;
          T = q; KC[k] = { ang, sc }; break;
        }
      }
      if (!T) { stepBack(f, s, o, ft, inside); stepBack(f, s, o, lerp(P['kn' + k], ft, 0.5), inside); continue; }


      const pk = sub(P['kn' + k], lerp(hp, ft, 0.5)), ratio = (a, b) => { const A = Mo.project(rg, a), B = Mo.project(rg, b); return Math.hypot(A.x - B.x, A.y - B.y) / 46; };
      let r = Mo.ik3(hp, T, Mo.L.thigh, Mo.L.shin, pk);
      if (ratio(hp, r.m) > 1.08 || ratio(r.m, r.e) > 1.08) r = Mo.ik3(hp, [T[0], T[1], hp[2]], Mo.L.thigh, Mo.L.shin, [pk[0], pk[1], 0]);
      if (ratio(hp, r.m) > 1.08 || ratio(r.m, r.e) > 1.08 || inside(Mo.project(rg, r.e)) > 0 || inside(Mo.project(rg, lerp(r.m, r.e, 0.5))) > 0) {

        stepBack(f, s, o, ft, inside); stepBack(f, s, o, lerp(P['kn' + k], ft, 0.5), inside);
        continue;
      }
      P['kn' + k] = r.m; P['ft' + k] = r.e;
    }
  }





  function bodyOf(so) {
    const Q = so.rig.P, pj = (q) => Mo.project(so.rig, q);
    return { hd: pj(Q.head), nk: pj(Q.neck), hp: pj(Q.hip) };
  }
  const segPt2 = (p, q, x, y) => { const vx = q.x - p.x, vy = q.y - p.y, l2 = vx * vx + vy * vy || 1, t = clamp(((x - p.x) * vx + (y - p.y) * vy) / l2, 0, 1); return [Math.hypot(x - p.x - vx * t, y - p.y - vy * t), p.x + vx * t, p.y + vy * t]; };

  const inBody = (B, x, y) => Math.max(16 - Math.hypot(x - B.hd.x, y - B.hd.y), 10 - segPt2(B.nk, B.hd, x, y)[0], TORSO_R - 4 - segPt2(B.hp, B.nk, x, y)[0]);
  function secondStop(f, s, o, so) {
    const rg = s.rig, P = rg.P, w = f.wpn;
    const kept = rg.oneHand === 'R' && w && w.twin;
    if (!P || !w || !w.twin || (!kept && (!P.armed || P.inside || (f.dz && !f.dz.armed))) || f.dead || o.dead || o.hidden || !so.rig.P) { rg.secA = 0; rg.secQ = 1; rg.secO = 1; return; }
    const B = bodyOf(so), own = bodyOf(s), ownFront = Mo.bladeFront ? Mo.bladeFront(P, P.haL, [0, 0, 0], 0).T : true;
    const a0 = rg.secA || 0, q0 = rg.secQ || 1, o0 = rg.secO != null ? rg.secO : 1;
    rg.secA = 0; rg.secQ = 1; rg.secO = 1;
    const base = Mo.secondLine(rg, w), towards = o.x > f.x ? 1 : -1;


    const sprOf = (op) => { const sp = Mo.fanSpread(Object.assign({}, rg, { secO: op }), w, 'B'); return sp > 0.05 ? [0, -sp, sp, -sp / 2, sp / 2] : [0]; };
    const SPRS = { 1: sprOf(1), 0.5: sprOf(0.5), 0: [0] };
    const pen = (a, q, op = 1) => {
      let m = -1e9; const L = base.L * q, SPR = SPRS[op] || sprOf(op);
      for (const sp of SPR) for (let i = 0; i <= 12; i++) {
        const d = (L * i) / 12, x = base.h.x + Math.cos(base.ang + a + sp) * d, y = base.h.y + Math.sin(base.ang + a + sp) * d;
        m = Math.max(m, inBody(B, x, y));

        if (ownFront && d > 10 && !sp) m = Math.max(m, inBody(own, x, y) - 1);
      }
      return m;
    };

    const p00 = pen(0, 1);
    if (p00 <= 0 && Math.abs(a0) < 0.02 && q0 > 0.99 && o0 > 0.99) return;
    const OPS = w.type === 'tessen' ? [1, 0.5, 0] : [1];
    let best = null, least = null;
    for (const op of OPS) for (const q of [1, 0.85, 0.7, 0.6]) for (let i = 0; i <= 31; i++) for (const sg of i ? [1, -1] : [1]) {
      const a = sg * i * 0.1;
      const tipx = Math.cos(base.ang + a) * towards;
      const cost = Math.abs(a - a0) * 1.2 + Math.abs(a) * 0.4 + (1 - q) * 4 + (1 - op) * 3 + Math.abs(op - o0) * 0.5 + (p00 > 0 ? Math.max(0, tipx) * 0.8 : 0);
      if (best && cost >= best.cost) continue;
      const pn = pen(a, q, op);
      if (pn > 0) { if (!least || pn < least.pn - 0.5 || (pn < least.pn + 0.5 && cost < least.cost)) least = { pn, cost, a, q, op }; continue; }
      best = { cost, a, q, op };
    }

    if (!best && least && least.pn < Math.max(p00, pen(a0, q0, o0))) best = least;
    if (!best) { rg.secA = a0; rg.secQ = q0; rg.secO = o0; return; }

    if (p00 <= 0 && best.cost > 0) best = { a: 0, q: 1, op: 1 };
    let A = best.a, Qq = best.q, Op = best.op;
    for (const k of [0.34, 0.5, 0.75]) { const a = a0 + (best.a - a0) * k, q = q0 + (best.q - q0) * k, op = o0 + (best.op - o0) * k; if (pen(a, q, op) <= 0) { A = a; Qq = q; Op = op; break; } }
    rg.secA = A; rg.secQ = Qq; rg.secO = Op;
    MD.stats.secondStop = (MD.stats.secondStop || 0) + 1;
  }
  function chainStop(f, s, o, so) {
    const rg = s.rig, C = rg.chain;
    if (!C || !C.init || !f.wpn || f.wpn.type !== 'kusarigama' || !rg.P || o.dead || o.hidden || !so.rig.P) return;
    const B = bodyOf(so), X = C.x, Y = C.y, PX = C.px, PY = C.py, n = C.n || X.length;

    const pm = Mo.project(rg, madd(rg.P.blade.h, rg.P.blade.u, -(f.wpn.handle || 12))), dx = pm.x - X[0], dy = pm.y - Y[0];
    if (Math.abs(dx) + Math.abs(dy) > 0.01 && Math.abs(dx) < 60 && Math.abs(dy) < 60) for (let i = 0; i < n; i++) { X[i] += dx; Y[i] += dy; PX[i] += dx; PY[i] += dy; }


    for (let it = 0; it < 2; it++) for (let i = 1; i < n; i++) {

      const cand = [[16, B.hd.x, B.hd.y, Math.hypot(X[i] - B.hd.x, Y[i] - B.hd.y)]];
      { const r = segPt2(B.nk, B.hd, X[i], Y[i]); cand.push([10, r[1], r[2], r[0]]); }
      { const r = segPt2(B.hp, B.nk, X[i], Y[i]); cand.push([TORSO_R - 4, r[1], r[2], r[0]]); }
      for (const [Rr, cx, cy, d] of cand) {
        if (d >= Rr) continue;
        const nx = d > 1e-3 ? (X[i] - cx) / d : (o.x > f.x ? -1 : 1), ny = d > 1e-3 ? (Y[i] - cy) / d : 0, k = Rr - d + 0.3;
        X[i] += nx * k; Y[i] += ny * k; PX[i] += nx * k; PY[i] += ny * k;
      }
    }
    MD.stats.chainStop = (MD.stats.chainStop || 0) + 1;
  }




  const cross2 = (px, py, qx, qy, rx, ry) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
  const ptSeg2 = (px, py, qx, qy, x, y) => { const vx = qx - px, vy = qy - py, l2 = vx * vx + vy * vy || 1, t = clamp(((x - px) * vx + (y - py) * vy) / l2, 0, 1), ex = x - px - vx * t, ey = y - py - vy * t; return Math.sqrt(ex * ex + ey * ey); };
  function segSeg2(ax, ay, bx, by, cx, cy, dx, dy) {
    const d1 = cross2(ax, ay, bx, by, cx, cy), d2 = cross2(ax, ay, bx, by, dx, dy), d3 = cross2(cx, cy, dx, dy, ax, ay), d4 = cross2(cx, cy, dx, dy, bx, by);
    if ((d1 > 0) !== (d2 > 0) && (d3 > 0) !== (d4 > 0)) return 0;
    return Math.min(ptSeg2(cx, cy, dx, dy, ax, ay), ptSeg2(cx, cy, dx, dy, bx, by), ptSeg2(ax, ay, bx, by, cx, cy), ptSeg2(ax, ay, bx, by, dx, dy));
  }
  const BS_GRID = [];

  const BS_U = new Float64Array(3);
  const drawnOf = (h, x, y, z, BL) => { const cam = Mo.cam, sh = cam / (cam - h[2]), t0 = h[0] + x * BL, t1 = h[1] + y * BL, t2 = h[2] + z * BL, st = cam / (cam - t2); return Math.hypot(t0 * st - h[0] * sh, t1 * st - h[1] * sh) / (BL * sh); };
  function bsGrid(wideUp, shorten) {
    const key = (wideUp ? 2 : 0) + (shorten ? 1 : 0);
    if (BS_GRID[key]) return BS_GRID[key];
    const UPS = wideUp ? [0, -12, 12, -24, 24, -36, -48] : [0, -12, 12, -24, 24], DQS = shorten ? [1, 0.88, 0.78] : [1], C = [];
    for (const up of UPS) for (let back = 0; back <= 64; back += 8) for (const dq of DQS) for (let i = 0; i <= 30; i += 2) {
      for (const ang of i ? [i * 0.1, -i * 0.1] : [i * 0.1]) C.push({ up, back, dq, ang, lb: back + Math.abs(up) * 2 + Math.abs(ang) * 25 + (1 - dq) * 300, idx: C.length });
    }
    C.sort((a, b) => a.lb - b.lb || a.idx - b.idx);
    const n = C.length, G = { n, up: new Float64Array(n), back: new Float64Array(n), dq: new Float64Array(n), ang: new Float64Array(n), lb: new Float64Array(n), idx: new Float64Array(n) };
    C.forEach((c, k) => { G.up[k] = c.up; G.back[k] = c.back; G.dq[k] = c.dq; G.ang[k] = c.ang; G.lb[k] = c.lb; G.idx[k] = c.idx; });
    return (BS_GRID[key] = G);
  }




  function bladeStop(f, s, o, so) {
    const rg = s.rig, P = rg.P;
    if (!P || !P.armed || f.dead || o.dead || o.hidden || !so.rig.P) return;

    if (P.inside && !(P.bladeVis > 12)) return;
    if (f.state === 'dbind' || (f.dz && f.dz.cine && !f.dz.cine.fin)) return;
    const Q = so.rig.P, pjo = (q) => Mo.project(so.rig, q), hd = pjo(Q.head), hp = pjo(Q.hip), nk = pjo(Q.neck);


    const SL = rg.poleSlide || 0, B0 = Mo.isPole && Mo.isPole(f.wpn) ? -((f.wpn.handle || 0) + SL) : 4;
    const BLf = (f.wpn && f.wpn.blade) || 96, BL = P.inside ? Math.min(BLf, P.bladeVis) : BLf, PJR = Mo.projectorOf ? Mo.projectorOf(rg) : null, pj = PJR || ((q) => Mo.project(rg, q));
    const segD = (x, y) => { const vx = nk.x - hp.x, vy = nk.y - hp.y, l2 = vx * vx + vy * vy || 1, t = clamp(((x - hp.x) * vx + (y - hp.y) * vy) / l2, 0, 1), ex = x - hp.x - vx * t, ey = y - hp.y - vy * t; return Math.sqrt(ex * ex + ey * ey); };

    const neckD = (x, y) => { const vx = hd.x - nk.x, vy = hd.y - nk.y, l2 = vx * vx + vy * vy || 1, t = clamp(((x - nk.x) * vx + (y - nk.y) * vy) / l2, 0, 1), ex = x - nk.x - vx * t, ey = y - nk.y - vy * t; return Math.sqrt(ex * ex + ey * ey); };


    const give = aimW(f) > 0.01 ? 5 : 3;



    const HR = give > 3 ? 20 : 22, NR = give > 3 ? 20 : 16;


    const LG = [['hipR', 'knR', 11], ['hipL', 'knL', 11], ['knR', 'ftR', 8.5], ['knL', 'ftL', 8.5]].map(([a, b, r]) => [pjo(Q[a]), pjo(Q[b]), r - (give > 3 ? give : 2)]);
    const segP = (p, q, x, y) => { const vx = q.x - p.x, vy = q.y - p.y, l2 = vx * vx + vy * vy || 1, t = clamp(((x - p.x) * vx + (y - p.y) * vy) / l2, 0, 1), ex = x - p.x - vx * t, ey = y - p.y - vy * t; return Math.sqrt(ex * ex + ey * ey); };



    let penT = 0;
    const NSK = Math.max(1, (BL - SL - B0) / 92);


    const FSP = Mo.fanSpread ? Mo.fanSpread(rg, f.wpn, 'F') : 0;

    const BB = FSP > 0.05 ? { hd, nk, hp } : null;
    const penFan = BB ? (h, u, NS0, cut) => {
      let m = pen1(h, u, NS0, false, cut);
      const h0 = pj(h), t0 = pj(madd(h, u, BLf)), a0 = Math.atan2(t0.y - h0.y, t0.x - h0.x), LL = BLf * (h0.s || 1);
      for (const sp of [-FSP, FSP, -FSP / 2, FSP / 2]) for (let i = 2; i <= 12; i++) { const d = (LL * i) / 12; m = Math.max(m, inBody(BB, h0.x + Math.cos(a0 + sp) * d, h0.y + Math.sin(a0 + sp) * d)); }
      return m;
    } : null;


    const RL = o.state === 'hurt' || o.state === 'stagger' || o.state === 'launch';

    const pen = (h, u, NS0 = 24, cut = Infinity) => (penFan ? penFan(h, u, NS0, cut) : pen1(h, u, NS0, false, cut));


    const PJd = rg.dir, PJx = rg.x, PJc = Mo.cam;
    const pen1 = (h, u, NS0 = 24, rib, cut = Infinity) => { const NS = Math.ceil(NS0 * NSK); let m = -1e9, over = 0; if (!rib) penT = 1e9; const dl = (BL - SL - B0) / NS; for (let k = 0; k <= NS; k++) { const kk = B0 + dl * k, pz = h[2] + u[2] * kk, sc = PJc / (PJc - pz), wx = PJx + (h[0] + u[0] * kk) * PJd * sc, wy = (h[1] + u[1] * kk) * sc, ax = wx - hd.x, ay = wy - hd.y, dh = Math.sqrt(ax * ax + ay * ay), dn = neckD(wx, wy), dt = segD(wx, wy), bx = wx - nk.x, by = wy - nk.y; penT = Math.min(penT, dt - TORSO_R); m = Math.max(m, HR - dh, NR - dn, TORSO_R - dt - give, 26 - Math.sqrt(bx * bx + by * by)); if (RL && kk > 30) m = Math.max(m, TORSO_R + 6 - dt, 24 - dh, 16 - dn); if (dh < HR || dn < (RL ? 14 : NR) || dt < TORSO_R + (RL ? 4 : 0)) over += dl; for (let i = 0; i < LG.length; i++) { const L = LG[i]; m = Math.max(m, L[2] - segP(L[0], L[1], wx, wy)); } m = Math.max(m, wy + 1); if (m > cut) return m; } return Math.max(m, over - (RL ? 6 : 10)); };


    const bladeToSpine = (h, u) => {
      const k0 = B0, k1 = BL - SL;
      const s0 = PJc / (PJc - (h[2] + u[2] * k0)), ax = PJx + (h[0] + u[0] * k0) * PJd * s0, ay = (h[1] + u[1] * k0) * s0;
      const s1 = PJc / (PJc - (h[2] + u[2] * k1)), bx = PJx + (h[0] + u[0] * k1) * PJd * s1, by = (h[1] + u[1] * k1) * s1;
      return segSeg2(ax, ay, bx, by, hp.x, hp.y, nk.x, nk.y);
    };
    let h = P.blade.h, u = P.blade.u, p0 = pen(h, u);




    const aimed = aimW(f) > 0.01 && !!rg.ovr;
    const selfNow = aimed ? Mo.selfPen(P, P.blade.h, P.blade.u, BLf) : -1;

    const now = ND.simClock || 0, ap = s.bsAp && s.bsAp.clk >= now - 0.05 ? s.bsAp : null;
    const resting = !ap || (Math.abs(ap.cur.ang) < 0.02 && ap.cur.back < 0.5 && Math.abs(ap.cur.up) < 0.5 && ap.cur.dq > 0.995);
    const needFix = !(p0 <= 0 && !(aimW(f) > 0.3 && penT > 6) && !(selfNow > 0.5));
    if (!needFix && resting) { s.bsAp = null; return; }


    const hitW = aimW(f), L = Mo.L, L20 = Mo.L20, j20 = !!P.wrR, away = [-1, 0, 0], rot = (uu, a) => { const c = Math.cos(a), sn = Math.sin(a); return norm([uu[0] * c - uu[1] * sn, uu[0] * sn + uu[1] * c, uu[2]]); };


    const flat = (hb, uu) => { for (let i = 0; i < 12 && Mo.bladeDrawn(hb, uu, BL) < 0.8; i++) uu = norm([uu[0], uu[1], uu[2] * 0.75]); return uu; };


    const kasa = so.rig.look && so.rig.look.ch && so.rig.look.ch.acc === 'kasa';
    const handIn = (q) => { const w = pj(q); return Math.max(14.5 + 6 - Math.hypot(w.x - hd.x, w.y - hd.y), TORSO_R + 6 - segD(w.x, w.y), kasa ? 12 - Math.hypot(Math.max(0, Math.abs(w.x - hd.x) - 27), w.y - hd.y + 8) : -1e9); };
    const hand0 = Math.max(0, handIn(h));

    const self0 = aimed ? 0 : Math.max(0, Mo.selfPen(P, h, u, BLf));
    const pv = s.bsPrev && s.bsPrev.clk >= (ND.simClock || 0) - 0.05 ? s.bsPrev : null;
    let best = null, least = null;





    const DQ = hitW > 0.01 ? [1, 0.88, 0.78] : [1], HB = new Map();
    const handAt = (back, up) => {
      const key = back * 1000 + up; if (HB.has(key)) return HB.get(key);
      let hb = madd(madd(h, away, back), [0, 1, 0], up); const dS = len(sub(hb, P.shR)), MXA = L.uArm + L.fArm - 0.5;
      if (dS < 14) hb = madd(P.shR, norm(sub(hb, P.shR)), 14); else if (dS > MXA) hb = madd(P.shR, norm(sub(hb, P.shR)), MXA);
      if ((back || up) && handIn(hb) > hand0 + 0.5) hb = null;
      HB.set(key, hb); return hb;
    };
    const tryOne = (back, up, dq, ang, idx) => {
      if (back < 0 || back > 64 || Math.abs(ang) > 3.15) return;
      { const lb = back + Math.abs(up) * 2 + Math.abs(ang) * 25 + (1 - dq) * 300; if (best && (lb > best.cost || (lb === best.cost && !(idx < best.idx)))) return; }

      let cost = back + Math.abs(up) * 2 + Math.abs(ang) * 25 + (1 - dq) * 300 + (pv && hitW <= 0.01 ? Math.abs(ang - pv.ang) * 30 + Math.abs(back - pv.back) * 0.5 : 0);
      if (best && (cost > best.cost || (cost === best.cost && !(idx < best.idx)))) return;
      const hb = handAt(back, up); if (!hb) return;


      const uu = BS_U;
      {
        let x = u[0], y = u[1], z = u[2];
        if (ang) { const c = Math.cos(ang), sn = Math.sin(ang), rx = x * c - y * sn, ry = x * sn + y * c, l = Math.hypot(rx, ry, z) || 1; x = rx / l; y = ry / l; z = z / l; }
        for (let i = 0; i < 12 && drawnOf(hb, x, y, z, BL) < 0.8; i++) { const z2 = z * 0.75, l = Math.hypot(x, y, z2) || 1; x = x / l; y = y / l; z = z2 / l; }
        if (dq < 1) { const r = Math.hypot(x, y) || 1, q = r * dq; x = x / r * q; y = y / r * q; z = (z < 0 ? -1 : 1) * Math.sqrt(Math.max(0, 1 - q * q)); if (drawnOf(hb, x, y, z, BL) < 0.76) return; }
        uu[0] = x; uu[1] = y; uu[2] = z;
      }



      if (best && hitW > 0.01) {
        const lbT = bladeToSpine(hb, uu) - TORSO_R - 1e-6, lbc = cost + Math.max(0, lbT - 3) * 8 * hitW;
        if (lbc > best.cost || (lbc === best.cost && !(idx < best.idx))) return;
      }





      const pq = pen(hb, uu, 12, best ? 4 : least ? Math.max(4, least.pn) : Infinity);
      if (pq > 4) { if (!best && (!least || pq < least.pn || (pq === least.pn && idx < least.idx))) least = { pn: pq, h: hb, u: [uu[0], uu[1], uu[2]], ang, back, up, dq, idx }; return; }
      const po = pen(hb, uu, 24, best ? 0 : Infinity); if (best && po > 0) return;
      const tc = penT, pn = Math.max(po, Mo.selfPen(P, hb, uu, BLf, best ? self0 + 0.5 + 1e-6 : Infinity) - self0 - 0.5);
      if (pn > 0) { if (!best && (!least || pn < least.pn || (pn === least.pn && idx < least.idx))) least = { pn, h: hb, u: [uu[0], uu[1], uu[2]], ang, back, up, dq, idx }; return; }

      if (hitW > 0.01) cost += Math.max(0, tc - 3) * 8 * hitW;
      if (!best || cost < best.cost || (cost === best.cost && idx < best.idx)) best = { cost, h: hb, u: [uu[0], uu[1], uu[2]], ang, back, up, dq, idx };
    };






    if (needFix) {
      const G = bsGrid(hitW > 0.3, DQ.length > 1);
      for (let k = 0; k < G.n; k++) {
        if (best && G.lb[k] > best.cost) break;
        tryOne(G.back[k], G.up[k], G.dq[k], G.ang[k], G.idx[k]);
      }
    }

    if (needFix) { const c = best || least; if (c) for (const db of [-4, 0, 4]) for (const da of [-0.1, 0, 0.1]) if (db || da) tryOne(c.back + db, c.up, c.dq || 1, Math.round((c.ang + da) * 10) / 10, Infinity); }

    if (!best && least && least.pn < p0) best = least;
    if (!needFix) best = { h, u, ang: 0, back: 0, up: 0, dq: 1 };
    if (!best) return;
    s.bsPrev = { ang: best.ang, back: best.back, clk: now };



    const tgt = { ang: best.ang, back: best.back, up: best.up || 0, dq: best.dq || 1 };
    const from = ap ? (ap.clk === now ? ap.prev : ap.cur) : { ang: 0, back: 0, up: 0, dq: 1 };
    const onTop = (() => { const g = ND.game, F2 = g && g.F; if (!F2) return true; const sw = F2[0].dead ? false : F2[1].dead ? true : F2[0].state === 'atk' && F2[1].state !== 'atk'; return f === (sw ? F2[0] : F2[1]); })();



    const reeling = o.state === 'hurt' || o.state === 'stagger' || o.state === 'launch';
    const throughOk = (hb, uu) => {
      let ov = 0; const dl = (BL - 10) / 16;

      if (B0 < 0) for (let k = 0; k <= 6; k++) { const w = pj(madd(hb, uu, B0 + (10 - B0) * k / 6)); if (15 - Math.hypot(w.x - hd.x, w.y - hd.y) > 0 || 9 - neckD(w.x, w.y) > 0) return false; }
      for (let k = 0; k <= 16; k++) {
        const w = pj(madd(hb, uu, 10 + dl * k));
        if (segD(w.x, w.y) < TORSO_R + (reeling ? 4 : 0) || (reeling && neckD(w.x, w.y) < 14)) { ov += dl; if (reeling && ov > 6) return false; }
        if (15 - Math.hypot(w.x - hd.x, w.y - hd.y) > 0 || 9 - neckD(w.x, w.y) > 0) return false;
        if (!(hitW > 0.01 && onTop) && TORSO_R - 5 - segD(w.x, w.y) > 0) return false;

        if (w.y > -2) return false;
        if (!(hitW > 0.01 && onTop)) for (const [a2, b2, r2] of LG) if (r2 + 1 - segP(a2, b2, w.x, w.y) > 0) return false;
      }

      if (BB) {
        const h0 = pj(hb), t0 = pj(madd(hb, uu, BLf)), a0 = Math.atan2(t0.y - h0.y, t0.x - h0.x), LL = BLf * (h0.s || 1);
        for (const sp of [-FSP, FSP, -FSP / 2, FSP / 2]) for (let i = 2; i <= 12; i++) {
          const d = (LL * i) / 12, x = h0.x + Math.cos(a0 + sp) * d, y = h0.y + Math.sin(a0 + sp) * d;
          if (16 - Math.hypot(x - hd.x, y - hd.y) > 0 || 10 - neckD(x, y) > 0) return false;
          if (!(hitW > 0.01 && onTop) && TORSO_R - 4 - segD(x, y) > 0) return false;
        }
      }
      return true;
    };
    const pose = (c) => {
      HB.delete(c.back * 1000 + c.up); let hb = handAt(c.back, c.up) || h; let uu = flat(hb, c.ang ? rot(u, c.ang) : u);
      if (c.dq < 0.999) { const r = Math.hypot(uu[0], uu[1]) || 1, q = r * c.dq; uu = [uu[0] / r * q, uu[1] / r * q, (uu[2] < 0 ? -1 : 1) * Math.sqrt(Math.max(0, 1 - q * q))]; }
      return { hb, uu };
    };
    let h2 = best.h, u2 = best.u, cur = tgt;
    const dtc = ap ? Math.max(0, now - (ap.clk === now ? ap.prevClk : ap.clk)) : 1;
    const k0 = 1 - Math.exp(-dtc / 0.02);
    for (const k of [k0, 0.5, 0.75]) {
      if (k >= 1) break;
      const c = { ang: from.ang + (tgt.ang - from.ang) * k, back: from.back + (tgt.back - from.back) * k, up: from.up + (tgt.up - from.up) * k, dq: from.dq + (tgt.dq - from.dq) * k };
      const q = pose(c);
      if (throughOk(q.hb, q.uu)) { h2 = q.hb; u2 = q.uu; cur = c; break; }
    }
    s.bsAp = { cur, prev: ap && ap.clk === now ? ap.prev : from, clk: now, prevClk: ap && ap.clk === now ? ap.prevClk : ap ? ap.clk : now - 1 };
    if (cur.ang === 0 && cur.back === 0 && cur.up === 0 && cur.dq === 1 && h2 === h) return;

    const pole = sub(P.elR, lerp(P.shR, h2, 0.5));
    if (j20) { const r = Mo.ik3(P.shR, h2, L.uArm, L20.fw + L20.hd, pole); P.elR = r.m; P.haR = r.e; P.wrR = lerp(r.m, r.e, L20.fw / (L20.fw + L20.hd)); }
    else { const r = Mo.ik3(P.shR, h2, L.uArm, L.fArm, pole); P.elR = r.m; P.haR = r.e; }
    let e = sub(P.blade.e, mul(u2, dot(P.blade.e, u2))); e = len(e) > 1e-4 ? norm(e) : P.blade.e;
    P.blade = { h: P.haR, u: u2, e };
    MD.stats.bladeStop = (MD.stats.bladeStop || 0) + 1;
  }









  MD.ACTS = ACTS; MD.SEG = SEG; MD.MOVE = MOVE;



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
        default: place(/dash|nagare|oikomi/.test(id) ? 330 : 130); try { A.startAtk(id); } catch (e) {                    }
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

  MD.actOf = (f) => { const s = ST.get(f); return s && s.act ? s.act.id : s && s.actTail ? s.actTail.id + ' (end)' : null; };
  MD.actLegs = (f) => { const s = ST.get(f); return s && s.act ? s.act.legs : s && s.actTail ? s.actTail.legs : null; };
  MD.rigOf = (f) => { const s = ST.get(f); return s ? s.rig : null; };


  MD.pose = (f) => {
    if (!MD.ready || !f || !f.dz || f.dead || f.hidden || D.lite) return null;
    const s = tick(f); if (!s || !s.rig.P) return null;
    if (finStruckArmed(f)) bladeUp(s.rig.P);
    return s.rig;
  };
  MD.sourceOf = (f) => { const s = ST.get(f); const l = s && s.rig.layers[s.rig.layers.length - 1]; return l ? l.key : null; };


  const FP = ND.Fighter.prototype, draw0 = FP.draw;
  FP.draw = function (ctx, reflect, layer) {
    if (reflect || !MD.ready || !this.dz || this.dead || this.hidden || D.lite) return draw0.call(this, ctx, reflect, layer);
    const s = tick(this);
    if (!s || !s.rig.P) return draw0.call(this, ctx, reflect, layer);
    if (finStruckArmed(this)) bladeUp(s.rig.P);
    Mo.draw(ctx, s.rig, {});
  };


  const build0 = Mo.Rig.prototype.build;
  Mo.Rig.prototype.build = function (F, dt) {
    if (this.noSword && F) { F.armed = 0; F.inside = 0; F.tw = 0; }
    const P = build0.call(this, F, dt);

    const FA = this.fist, Pf = P || this.P;
    if (FA && FA.w > 0 && Pf) {
      const S = FA.S, sh = Pf['sh' + S], ha = Pf['ha' + S], el = Pf['el' + S];
      const r = Mo.ik3(sh, lerp(ha, FA.T, FA.w), L.uArm, L.fArm, sub(el, lerp(sh, ha, 0.5)));
      Pf['el' + S] = r.m; Pf['ha' + S] = r.e;
      if (Pf['wr' + S]) Pf['wr' + S] = madd(r.e, norm(sub(r.e, r.m)), -Mo.L20.hd);
      Pf['fist' + S] = true;
    }

    const Q = P || this.P;
    if (Q && Q.armed && Q.blade && !this.noSword) {
      const BL = (this.look.wpn || L).blade || 96, u = Q.blade.u, ty = Q.blade.h[1] + u[1] * BL;
      if (ty > -1.5 && Q.blade.h[1] < -1.5) { const sy = clamp((-1.5 - Q.blade.h[1]) / BL, -1, 1), h = Math.hypot(u[0], u[2]) || 1, k = Math.sqrt(1 - sy * sy) / h; let nx = u[0] * k, nz = u[2] * k;


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
  Mo.noWeapon = (rg) => !!(rg && rg.noSword);
  const kat0 = A3.drawKatana3;
  A3.drawKatana3 = function () { if (drawingNoSword) return; return kat0.apply(this, arguments); };
  const moDraw0 = Mo.draw;
  Mo.draw = function (ctx, rg) { drawingNoSword = !!(rg && rg.noSword); try { return moDraw0.apply(this, arguments); } finally { drawingNoSword = false; } };

  const snap0 = A3.snap;
  A3.snap = function (f, o) {

    const s = MD.ready && !D.lite && f && f.dz && !f.dead && !f.hidden ? tick(f) : null;
    if (!s || !s.rig.P) return snap0.call(this, f, o);
    const rg = s.rig, P = rg.P, pj = (p) => Mo.project(rg, p);
    o = o || {};
    const put = (k, p) => { const q = pj(p); const t = o[k] || (o[k] = { x: 0, y: 0 }); t.x = q.x; t.y = q.y; };
    put('hip', P.hip); put('neck', P.neck); put('head', P.head); put('sh', P.shR);
    put('elF', P.elR); put('haF', P.haR); put('elB', P.elL); put('haB', P.haL);
    put('knF', P.knR); put('ftF', P.ftR); put('knB', P.knL); put('ftB', P.ftL); put('hipF', P.hipR); put('hipB', P.hipL); put('shB', P.shL);
    const BL = f.wpn.blade, u = P.blade.u;
    const sl = rg.poleSlide || 0;
    put('tip', madd(P.blade.h, u, BL - sl)); put('pom', madd(P.blade.h, u, -f.wpn.handle - sl)); put('hilt', P.armed ? madd(P.blade.h, u, 4) : P.blade.h); put('pomm', madd(P.blade.h, u, P.armed ? 4 - f.wpn.handle : -f.wpn.handle));
    put('saya', P.saya.a); put('sayaEnd', madd(P.saya.a, P.saya.u, P.saya.L)); put('obi', P.saya.a);
    o.u = { x: u[0], y: u[1], z: u[2] }; o.e = { x: P.blade.e[0], y: P.blade.e[1], z: P.blade.e[2] };
    o.armed = P.armed; o.sheathed = !P.armed; o.grip = P.gripL || 0; o.dir = rg.dir; o.mocap = true; o.fist = rg.fist && rg.fist.w > 0.3 ? rg.fist.S : null;
    return o;
  };
})(window.ND);
