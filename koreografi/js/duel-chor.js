


















(function (ND) {
  'use strict';
  const Q = (() => { try { return location.search || ''; } catch (e) { return ''; } })();
  const M = /[?&]cinedemo=([a-z,]+)/.exec(Q);
  const OFF = /[?&]chor=0(&|$)/.test(Q);
  const D = ND.duel, G = ND.game, cam = ND.cam, fx = ND.fx;
  if (!D || !D.FIN || !G || !G.saveState || !G.loadState || !ND.Fighter) return;



  const WHO = M ? M[1].split(',').filter(Boolean) : null;
  const ESC_OFF = /[?&]esc=0(&|$)/.test(Q);
  const FP = ND.Fighter.prototype, ATK = ND.ATK, FIN = D.FIN;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u, 0, 1));
  const CH = (D.chor = { on: !OFF, esc: !ESC_OFF, who: WHO, cur: null, log: [], beats: [], seen: new Set(), scripts: {}, vars: {}, last: {}, forceVar: null, escLog: [] });











  const x = (att, m, def, o) => Object.assign({ k: 'x', att, m, def, spd: 0.55, gap: 0.12 }, o || {});
  const c = (mA, mV, o) => Object.assign({ k: 'c', mA, mV, spd: 0.55, gap: 0.16 }, o || {});
  const step = (who, d, dur) => ({ k: 'step', who, d, dur: dur || 0.35 });
  const stagger = (kb, dur) => ({ k: 'stagger', kb: kb || 230, dur: dur || 0.42 });





















  CH.WIN = { 1: [1.5, 1.5], 2: [2.5, 2.8], 3: [3.0, 3.5] };
  const winDmg = (tier) => { const T = (ND.AI_KNOBS && ND.AI_KNOBS.finWin) || CH.WIN, v = T[tier] || T[String(tier)] || CH.WIN[tier]; return [clamp(+v[0] || 0, 0, 20), clamp(+v[1] || 0, 0, 20)]; };
  const h32 = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const prng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const cp = (b, o) => Object.assign({}, b, o || {});

  const VP = [x('V', 'L1', 'parry'), x('V', 'L1', 'block'), x('V', 'L2', 'parry'), x('V', 'L2', 'block'), x('V', 'L1', 'back'), x('V', 'FL', 'back'), x('V', 'L3', 'back'), x('V', 'FL', 'block')];

  const POOL = {
    akane: { sig: x('A', 'ak_dNuki', 'block'), A: [x('A', 'd_kiriUp', 'parry', { spd: 0.5 }), x('A', 'ak_dKesa', 'block'), x('A', 'FL', 'block'), x('A', 'd_tsuki', 'block')], C: c('L1', 'L1') },
    aoi: { sig: x('A', 'FL', 'block'), A: [x('A', 'L1', 'block'), x('A', 'S2', 'block'), x('A', 'L2', 'parry')], C: c('L2', 'L2') },
    kuro: { sig: x('A', 'BH', 'back', { spd: 0.6 }), A: [x('A', 'L3', 'parry'), x('A', 'L1', 'block'), x('A', 'H', 'back', { spd: 0.62 })], C: c('L3', 'L1') },
    yuki: { sig: x('A', 'FL', 'block'), A: [x('A', 'FL', 'parry'), x('A', 'L1', 'parry'), x('A', 'L1', 'block')], C: c('L2', 'L2') },
    ren: { sig: x('A', 'L2', 'block'), A: [x('A', 'L1', 'block'), x('A', 'L3', 'block')], C: c('L1', 'L1') },
    kage: { sig: x('A', 'BL', 'block'), A: [x('A', 'L1', 'block'), x('A', 'L2', 'block'), x('A', 'L1', 'parry')], C: c('L3', 'L1') },
    shura: { sig: c('L1', 'L1'), A: [x('A', 'L1', 'block'), x('A', 'L2', 'block'), x('A', 'S1', 'block')], C: c('L3', 'L1') },
    tetsu: { sig: x('A', 'FL', 'back'), A: [x('A', 'L2', 'block'), x('A', 'L1', 'parry'), x('A', 'S1', 'block')], C: c('L1', 'L1') },
    jin: { sig: x('A', 'L1', 'parry'), A: [x('A', 'L1', 'block'), x('A', 'L2', 'block'), x('A', 'S1', 'block')], C: c('L2', 'L1') },
    tsubame: { sig: x('A', 'H', 'block', { spd: 0.7 }), A: [x('A', 'L1', 'block'), x('A', 'L2', 'block')], C: c('L1', 'L1') },
    hana: { sig: x('A', 'FL', 'block'), A: [x('A', 'L2', 'block'), x('A', 'L2', 'parry'), x('A', 'S1', 'block')], C: c('L1', 'L1') },
    mai: { sig: x('A', 'L1', 'block'), A: [x('A', 'L3', 'block'), x('A', 'L2', 'block')], C: c('L1', 'L1') },
    tora: { sig: x('A', 'tr_l1', 'back'), A: [x('A', 'tr_l1', 'block'), x('A', 'tr_s1', 'block'), x('A', 'tr_l3', 'block')], C: c('L1', 'L1') },
  };

  const KIND = {
    blade: { W: null, open: null },
    body: { W: [x('A', 'd_hiza', 'hit', { spd: 0.6, want: 104 }), x('A', 'd_kakato', 'block', { spd: 0.6 })], open: [x('A', 'd_hiza', 'block', { spd: 0.6, want: 104 }), x('A', 'd_taiatari', 'hit', { spd: 0.6, want: 112 })] },
    trap: { W: [x('A', 'ua_elbow', 'hit', { spd: 0.6, want: 88 }), x('A', 'ua_cross', 'hit', { spd: 0.6, want: 92 }), x('A', 'dk_wrist', 'hit', { spd: 0.6 })], open: [x('A', 'dk_wrist', 'block', { spd: 0.6 })] },
    low: { W: [x('A', 'dk_spin', 'block', { spd: 0.6 }), x('A', 'd_kakato', 'block', { spd: 0.6 }), x('A', 'dk_wrist', 'block', { spd: 0.6 })], open: [x('A', 'dk_sweep', 'back', { spd: 0.6 }), x('A', 'd_ashibarai', 'back', { spd: 0.6 })] },
  };
  const OWN = { tora: { trap: [x('A', 'tr_hook', 'hit', { want: 150 })] }, mai: { trap: [x('A', 'mi_heavy', 'block')] }, jin: { low: [x('A', 'd_ashibarai', 'back', { spd: 0.6 })] } };
  const KINDS = ['blade', 'body', 'trap', 'low'];

  const winnable = (b) => b && b.k === 'x' && b.att === 'A' && b.m !== 'BL' && !(ATK[b.m] && ATK[b.m].kind === 'feint');
  function choreo(id, tier, ci) {
    const P = POOL[id], kind = KINDS[ci], r = prng(h32(id + ':' + tier + ':' + ci)), pick = (L) => L[Math.floor(r() * L.length)];
    const KW = kind === 'blade' ? P.A : KIND[kind].W.concat((OWN[id] && OWN[id][kind]) || []);
    const KO = kind === 'blade' ? [P.C] : KIND[kind].open.concat(((OWN[id] && OWN[id][kind]) || []).filter((b) => b.def !== 'hit'));
    const sigWin = winnable(P.sig);
    const opening = [];


    if (!sigWin || tier > 1) opening.push(cp(P.sig));
    if (tier >= 2) opening.splice(ci % 2 ? 0 : opening.length, 0, cp(pick(VP)));
    if (tier >= 3) { opening.push(cp(pick(KO))); opening.push(ci === 0 ? cp(P.C) : cp(pick(VP))); }
    const W1 = tier === 1 && sigWin ? cp(P.sig) : cp(pick(KW)), W2 = cp(pick(KW.filter((b) => b.m !== W1.m).concat(KW.length < 2 ? KW : [])));
    const first = opening[0] || W1;
    const reel = tier === 1 ? (first.att === 'A' ? stagger(200, 0.5) : stagger(200, 0.3)) : first.att === 'A' ? stagger(230, 0.62) : stagger();
    return { id, tier, ci, kind, beats: [reel].concat(opening), W: [W1, W2], fin: tier === 1 ? 0.62 : 0.5, home: tier === 1 ? 0.22 : 0.34 };
  }
  for (const id of Object.keys(POOL)) for (let t = 1; t <= 3; t++) {
    CH.vars[id + ':' + t] = [0, 1, 2, 3].map((ci) => choreo(id, t, ci));
    CH.scripts[id + ':' + t] = CH.vars[id + ':' + t][0];
  }

  const CONT = {
    held: [() => [x('V', 'L1', 'parry')], () => [c('L1', 'L1')], () => [x('V', 'FL', 'back')]],
    hit: [() => [stagger(200, 0.45)], (S) => [stagger(140, 0.62), cp(S.ch.W[0], { def: 'block' })], () => [stagger(280, 0.5), step('A', 70, 0.32)]],
  };
  const ENDS = { held: ['out', 'answer', 'clash'], hit: ['reel', 'zanshin', 'spun'] };
  CH.CONT = CONT; CH.ENDS = ENDS;



  const knobOff = () => !!(ND.AI_KNOBS && ND.AI_KNOBS.finChor === 0);
  const eligible = (c) => !!(c && !c.done && !c.un && !c.crown && CH.on && !knobOff() && CH.scripts[c.key] && (!WHO || WHO.includes(c.A.ch.id)) &&
    c.V.dz && c.V.dz.armed !== false && c.A.dz && c.A.dz.armed !== false &&
    G.mode !== 'online' && G.mode !== 'shadow' && G.mode !== 'attract' && G.mode !== 'train' && !(ND.net && ND.net.active) && !(ND.tutor && ND.tutor.on));
  const keyOf = (c) => c.key + '@' + c.t0;
  CH.handled = (c) => !!(c && CH.seen.has(keyOf(c)));





  const LONG = { naginata: 1, bo: 1, yumi: 1, kusarigama: 1, nodachi: 1 };
  CH.pickVar = (c) => pickVar(c);
  function pickVar(c) {
    const L0 = CH.vars[c.key];
    if (CH.forceVar != null) return clamp(CH.forceVar | 0, 0, L0.length - 1);
    const A = c.A, V = c.V, side = V.x >= A.x ? 1 : -1, room = (ND.ARENA || 900) - V.x * side;
    const ahead = A.hp / A.maxHp - V.hp / V.maxHp, long = !!(V.wpn && LONG[V.wpn.type]);
    const r = prng(h32(String(ND.rng ? ND.rng.s : 0) + ':' + (c.t0 || 0).toFixed(4) + ':' + c.key));
    const last = CH.last[c.key];
    let best = 0, bs = -1e9;
    L0.forEach((S, i) => {
      if (i === last && L0.length > 1) return;
      const s = r() - (room < 260 && S.kind === 'low' ? 0.2 : 0) - (long && S.kind === 'trap' ? 0.1 : 0) + (ahead < -0.15 && S.kind === 'body' ? 0.1 : 0);
      if (s > bs) { bs = s; best = i; }
    });
    return best;
  }
  function pickCont(S, wi, held) {
    if (CH.forceCont != null) return clamp(CH.forceCont | 0, 0, 2);
    const A = S.A, V = S.V, side = V.x >= A.x ? 1 : -1, roomV = (ND.ARENA || 900) - V.x * side, roomA = (ND.ARENA || 900) + A.x * side;
    const r = prng(h32(String(S.rs) + ':' + S.c.t0 + ':' + wi + ':' + (held ? 1 : 0) + ':' + S.c.key + ':' + S.vi));
    let best = 0, bs = -1e9;
    for (let i = 0; i < 3; i++) {
      const s = r() - (!held && i === 2 && roomV < 300 ? 1 : 0) - (held && i === 2 && roomA < 300 ? 1 : 0);
      if (s > bs) { bs = s; best = i; }
    }
    return best;
  }


  const kOf = (f, spd) => (f.ch.spd || 1) * spd;


  const LOG = { L1: 'light1', L2: 'light2', L3: 'light3', H: 'heavy', FL: 'fLight', BL: 'bLight', FH: 'fHeavy', BH: 'bHeavy', S1: 'str1', S2: 'str2' };
  const LOGICAL = /^(light[123]|heavy|fLight|bLight|fHeavy|bHeavy|str[12]|kick|dashHeavy)$/;
  function moveOf(f, m) {
    const n = LOG[m] || m;
    if (ATK[n] && !LOGICAL.test(n)) return n;
    const c0 = f.chainN; f.chainN = 1;
    let r = null;
    try { r = (ND.MOVES && ND.MOVES[f.ch.id] && ND.MOVES[f.ch.id](f, n)) || n; } catch (e) { r = n; } finally { f.chainN = c0; }
    if (n === 'kick' && !(ATK[r] && ATK[r].kind === 'kick' && r !== 'kick')) r = ATK.d_hiza ? 'd_hiza' : 'kick';
    const a = ATK[r];
    if (!a || a.special || !/^(blade|kick|whip|shoot|gust|feint)$/.test(a.kind || 'blade')) return 'light1';
    return r;
  }
  CH.moveOf = moveOf;
  const hitOf = (a) => (a.hits && a.hits.length ? a.hits : a.active ? [a.active] : [[0.1, 0.2]]);


  const CUE = 0.36;
  const winLen = (f) => clamp((ND.parryWin ? ND.parryWin(f) : 0.17) * 1.15, 0.16, 0.24);

  function planBeat(S, b, t, acts, wi) {
    const A = S.A, V = S.V, who = (w) => (w === 'A' ? A : V);
    if (b.k === 'stagger') { acts.push({ t, k: 'stagger', kb: b.kb }); return t + b.dur; }
    if (b.k === 'step') { acts.push({ t, k: 'step', f: who(b.who), d: b.d, dur: b.dur }); return t + b.dur; }
    if (b.k === 'c') {

      const mA = moveOf(A, b.mA), mV = moveOf(V, b.mV), aA = ATK[mA], aV = ATK[mV];
      if (!aA || !aV) return t;
      acts.push({ t, k: 'close', f: A, want: 150, dur: 0.17 });
      t += 0.18;
      const hA = hitOf(aA)[0][0] / kOf(A, b.spd), hV = hitOf(aV)[0][0] / kOf(V, b.spd), h = Math.max(hA, hV), hit = t + h;
      acts.push({ t: t + h - hA, k: 'atk', f: A, m: mA, spd: b.spd }, { t: t + h - hV, k: 'atk', f: V, m: mV, spd: b.spd });
      acts.push({ t: hit - 0.004, k: 'clash' }, { t: hit - 0.01, k: 'slow', v: 0.32, d: 0.3 });
      acts.push({ t: hit - 0.03, k: 'watch', f: V, att: A }, { t: hit + 0.2, k: 'check', f: V, att: A, want: 'clash', m: mA });
      const end = hit + 0.42;
      acts.push({ t: end, k: 'settle', f: A }, { t: end, k: 'settle', f: V });
      return end + b.gap;
    }


    const att = who(b.att), def = att === A ? V : A;
    let m = moveOf(att, b.m);
    if (att === V && ATK[m] && ATK[m].kind === 'kick' && b.m !== 'kick') m = moveOf(V, 'L1');
    const a = ATK[m];
    if (!a) return t;

    const want = b.want || (a.kind === 'kick' ? 112 : a.kind === 'shoot' ? 300 : a.kind === 'whip' ? 150 : 162);
    acts.push({ t, k: 'close', f: att, want, dur: 0.17 });
    t += 0.18;
    const W = hitOf(a);
    const hit = t + W[W.length - 1][0] / kOf(att, b.spd), end = Math.min(t + (a.dur || 0.5) / kOf(att, b.spd), hit + (b.rec || (a.kind === 'shoot' ? 0.6 : a.kind === 'whip' ? 0.5 : 0.34)));

    acts.push({ t: end, k: 'settle', f: att }, { t: end, k: 'settle', f: def });
    const win = wi != null;
    acts.push({ t, k: 'atk', f: att, m, spd: b.spd, hold: !win && b.def === 'back', def: win ? null : b.def });
    acts.push({ t: hit - 0.01, k: 'slow', v: b.def === 'hit' ? 0.4 : 0.35, d: 0.24 });
    const until = Math.max(hit + (a.kind === 'whip' ? 0.5 : 0.2), t + W[W.length - 1][1] / kOf(att, b.spd) + 0.12);
    if (win) {
      const we = hit - 0.05, ws = we - winLen(def);

      const how = a.trip || a.low ? 'back' : a.kind === 'blade' ? 'parry' : 'block';
      S.wins.push({ i: wi, ws, we, hit, end, f: def, att, m, how, until, fin: false, ok: null, open: false, cancel: false });
      acts.push({ t: ws - CUE, k: 'cue', wi });
      acts.push({ t: Math.max(hit + 0.12, end - 0.12), k: 'guardOff', f: def });
      acts.push({ t: hit - 0.03, k: 'watch', f: def, att }, { t: end - 0.005, k: 'check', f: def, att, m, wi });
      acts.push({ t: end, k: 'branch', wi });
    } else {
      if (b.def !== 'hit') acts.push({ t: Math.max(0, t - 0.25), k: 'guardOn', f: def, def: b.def });
      if (b.def === 'parry') acts.push({ t: hit - 0.05, k: 'tap', f: def });
      if (b.def === 'back') acts.push({ t: hit - 0.2, k: 'back', f: def, until });
      acts.push({ t: Math.max(hit + 0.12, end - 0.12), k: 'guardOff', f: def });
      acts.push({ t: hit - 0.03, k: 'watch', f: def, att }, { t: end - 0.005, k: 'check', f: def, att, want: b.def, m });
    }
    return end + b.gap;
  }

  function planFinal(S, t, acts) {
    const A = S.A, V = S.V, F = S.fin, CH0 = S.ch;
    const fs = CH0.fin, hd = Math.max(CH0.home, (Math.abs(A.x - F.x) + Math.abs(V.x - F.vx)) / 2 / 230), kf = kOf(A, fs), lead = F.st / kf;
    acts.push({ t, k: 'home', dur: hd });
    t += hd + 0.02;
    acts.push({ t, k: 'final', spd: fs });
    const hit = t + lead, we = hit - 0.05, ws = we - winLen(V);
    S.wins.push({ i: 2, ws, we, hit, end: hit, f: V, att: A, m: F.atkName, how: F.atk && F.atk.kind === 'blade' ? 'parry' : 'block', until: hit + 0.2, fin: true, ok: null, open: false, cancel: false });
    acts.push({ t: ws - CUE, k: 'cue', wi: 2 }, { t: hit, k: 'branch', wi: 2 });
    return hit;
  }

  function addActs(S, acts) {
    const rest = S.acts.slice(S.i).concat(acts).sort((p, q) => p.t - q.t);
    S.acts = S.acts.slice(0, S.i).concat(rest);
  }

  function branch(S, wi) {
    const w = S.wins[wi], held = !!w.ok, t0 = S.t, acts = [];
    const ci = pickCont(S, wi, held);
    S.path.push((held ? 'Y' : 'N') + ci);
    if (wi < 2) {
      let t = t0;
      for (const b of CONT[held ? 'held' : 'hit'][ci](S)) t = planBeat(S, b, t, acts);
      if (wi === 0) t = planBeat(S, S.ch.W[1], t, acts, 1);
      else t = planFinal(S, t, acts);
      addActs(S, acts);
      return;
    }

    const missed = S.wins.filter((q) => !q.ok).length;
    if (missed === 3) { S.dur = t0; S.allMissed = true; return; }
    const e = ENDS[held ? 'held' : 'hit'][ci];
    let t = t0 + 0.12;
    if (held) {
      if (e === 'answer') t = planBeat(S, x('V', 'L1', 'block'), t, acts);
      else if (e === 'clash') t = planBeat(S, c('L1', 'L1'), t, acts);
      acts.push({ t: t + 0.04, k: 'escOut', dur: 0.45 }, { t: t + 0.18, k: 'settle', f: S.A });
      S.dur = t + 0.66;
    } else {
      acts.push({ t: t0 + 0.02, k: 'stagger', kb: e === 'reel' ? 330 : e === 'spun' ? 230 : 150 });
      if (e === 'zanshin') acts.push({ t: t0 + 0.34, k: 'step', f: S.A, d: 46, dur: 0.3 });
      if (e === 'spun') acts.push({ t: t0 + 0.42, k: 'stagger', kb: 120 });
      acts.push({ t: t0 + 0.5, k: 'escOut', dur: 0.4 }, { t: t0 + 0.3, k: 'settle', f: S.A });
      S.dur = t0 + 1.0;
    }
    addActs(S, acts);
  }
  function plan(S) {
    const acts = [];
    let t = 0;
    for (const b of S.ch.beats) t = planBeat(S, b, t, acts);
    planBeat(S, S.ch.W[0], t, acts, 0);
    acts.sort((p, q) => p.t - q.t);
    return acts;
  }


  const ACTS = (ND.input && ND.input.Ctrl && ND.input.Ctrl.ACTS) || ['left', 'right', 'up', 'guard', 'light', 'heavy', 'kick', 'throw', 'dodge', 'special'];
  const MASK = {}; for (const a of ACTS) MASK[a] = true; MASK.ctx = true;
  const press = (f, a) => { f.ctrl.press(a, 'tut'); };
  const release = (f, a) => { f.ctrl.release(a, 'tut'); };
  let SB = null;
  const rngNext0 = ND.rng && ND.rng.next;

  const PRE = { V: null, clock: -1 };
  const HINT_KEY = 'sd_chor_esc_hint';
  let hintN = (() => { try { return +(localStorage.getItem(HINT_KEY) || 0) || 0; } catch (e) { return 0; } })();
  const escOff = () => !!(ND.AI_KNOBS && ND.AI_KNOBS.finEscOn === 0);

  CH.ESC = { 0: 0.15, 0.5: 0.25, 1: 0.45, 2: 0.65, 3: 0.75 };
  function escChance(ai) {
    if (!ai) return 0;
    const T = (ND.AI_KNOBS && ND.AI_KNOBS.finEsc) || CH.ESC, LVS = ND.AI_LEVELS || {};
    let k = '1';
    for (const key of ['0', '0.5', '1', '2', '3']) if (LVS[key] && ai.lv && LVS[key].name === ai.lv.name) k = key;
    const v = T[k] != null ? +T[k] : CH.ESC[k];
    return clamp(v || 0, 0, 1);
  }

  function guardHeld(f) { const s = f.ctrl && f.ctrl.srcs && f.ctrl.srcs.guard; if (!s) return false; for (const k of s) if (k !== 'tut') return true; return f.ctrl.gx != null && false; }


  function escapeTo(S) {
    const F = S.fin, side = F.vx >= F.x ? 1 : -1, L = (ND.ARENA || 900) - 40, gap = 240;
    let a = F.x, v = F.x + side * gap;
    if (Math.abs(v) > L) { const over = Math.abs(v) - L; v -= side * over; a -= side * over; }
    return { a, v };
  }
  function windows(S) {
    const V = S.V, held = guardHeld(V), edge = held && !S.gHeld;
    S.gHeld = held;
    for (const w of S.wins) {
      if (!w.open || w.ok !== null) continue;
      const t = S.t;
      let pressed = false;
      if (S.forced) pressed = S.forced[w.i] === 'Y' && t >= w.ws + 0.02;
      else if (S.human) pressed = edge && t >= w.ws - 1e-9;
      else pressed = w.cpu >= 0 && t >= w.cpu;

      if (!S.forced && S.human && edge && t < w.ws) { w.ok = false; w.early = true; w.at = t; }
      else if (pressed && t <= w.we + 1e-9) {
        w.ok = true; w.at = t;
        if (w.how === 'back') { V.setState('dodge', { ddir: -V.dir, back: true }); S.inv = { f: V, until: w.until }; S.cap = { f: V, x0: V.x, serial: V.serial, max: 64 }; }
        else { press(V, 'guard'); w.tapAt = w.how === 'parry' ? w.hit - 0.05 : -1; }
      } else if (t > w.we) { w.ok = false; w.at = t; }
    }
    for (const w of S.wins) {
      if (w.ok && w.tapAt > 0 && S.t >= w.tapAt) { w.tapAt = 0; release(V, 'guard'); press(V, 'guard'); }
      if (w.ok && !w.done && S.t >= w.hit + 0.12) { w.done = true; if (!w.fin) release(V, 'guard'); }
    }
  }



  function applyEnd(g, S) {
    const A = S.A, V = S.V, missed = S.wins.filter((q) => !q.ok).length, [w, b] = winDmg(S.c.tier);
    if (S.allMissed) {
      const d = Math.round(b / 100 * V.maxHp);
      if (d > 0 && !V.dead) { V.hp = Math.max(1, V.hp - d); V.damageTaken += d; }
      return;
    }
    const c = D.finOf(A) || D.finOf(V);
    if (c) D.endFin(c);
    const P = S.pre;
    if (P) { V.hp = P.hp; V.ghost = P.ghost; V.damageTaken = P.damageTaken; V.posture = P.posture; }
    const d = Math.round(missed * w / 100 * V.maxHp);
    if (d > 0) { V.ghost = Math.max(V.ghost || 0, V.hp); V.hp = Math.max(1, V.hp - d); V.damageTaken += d; }
    const ex = escapeTo(S);
    for (const f of [A, V]) { if (!f.dead) { f.setState('move'); f.vx = f.vy = 0; f.y = 0; f.onGround = true; f.locked = false; f.hitDone = true; } }
    A.x = ex.a; V.x = ex.v; A.dir = V.x >= A.x ? 1 : -1; V.dir = -A.dir;
    g.slowT = 0; g.slow = 1; g.hitstopT = 0; g.dim = 0; g.cineT = 0; g.focus = null;
    if (!missed) CH.escLog.push({ key: S.c.key, v: S.vi, human: S.human });
  }
    function begin(c) {
    const A = c.A, V = c.V, vi = pickVar(c), ch = CH.vars[c.key][vi];
    CH.seen.add(keyOf(c)); CH.last[c.key] = vi;
    const snap = G.saveState(), h0 = G.hashState();
    const fin = { atk: A.atk, atkName: A.atkName, keys: A.keys, aspd: A.aspd, st: A.st, x: A.x, vx: V.x, dir: A.dir, vdir: V.dir };


    const human = !!(G.isHuman && G.isHuman(V)), ai = (G.ais || []).find((q) => q.me === V) || null;
    const live = CH.esc && !escOff() && (human || !!ai);
    const pre = PRE.V === V && PRE.clock === c.t0 ? Object.assign({}, PRE) : null;
    SB = { c, A, V, ch, snap, h0, fin, acts: [], dur: Infinity, wins: [], path: [], vi, human: live && human, ai: live ? ai : null, live, pre, allMissed: false, i: 0, c0: G.clock, timer: G.timer, ais: G.ais, masks: [A.ctrl.mask, V.ctrl.mask],
      FON: FIN.on, rt: 0, glides: [], walk: null, hpA: A.hp, hpV: V.hp, gHeld: guardHeld(V), rs: ND.rng ? ND.rng.s : 0,
      forced: CH.forcePat || (live ? null : 'NNN') };
    SB.acts = plan(SB);
    CH.cur = SB;

    const sc = ND.score;
    SB.score = sc ? JSON.parse(JSON.stringify({ total: sc.total, cat: sc.cat, combo: sc.combo, comboT: sc.comboT, ring: sc.ring, style: sc.style, armed: sc.armed, t: sc.t, last: sc.last })) : null;
    SB.modHits = ND.mods ? ND.mods.hits : null;
    SB.runner = G.runner && G.runner.tick ? G.runner : null;
    if (SB.runner) { SB.runTick = SB.runner.tick; SB.runner.tick = () => {}; }

    A.dz.cine = V.dz.cine = null; A.locked = V.locked = false;
    A.dz.chain = V.dz.chain = 0; A.dz.finArm = V.dz.finArm = null;
    G.focus = null; G.cineT = 0; G.slowT = 0; G.slow = 1; G.hitstopT = 0;
    G.ais = [];
    FIN.on = false;
    for (const f of [A, V]) { f.ctrl.mask = MASK; for (const a of ACTS) release(f, a); f.posture = 0; }
    if (ND.rng) ND.rng.next = () => 0.95;

    for (const f of [A, V]) { if (f.trail) f.trail.length = 0; if (f.ghosts) f.ghosts.length = 0; }
    for (const f of [A, V]) { f.setState('move'); f.vx = f.vy = 0; f.y = 0; f.onGround = true; }
    A.dir = V.x >= A.x ? 1 : -1; V.dir = -A.dir;
  }

  function act(o) {
    const A = SB.A, V = SB.V;
    switch (o.k) {
      case 'cue': {
        const w = SB.wins.find((q) => q.i === o.wi);
        w.open = true;

        if (!SB.human && !SB.forced) {
          const p = escChance(SB.ai), r = prng(h32(String(ND.rng ? ND.rng.s : 0) + ':' + SB.c.t0 + ':' + o.wi + ':' + SB.c.key))();
          w.cpu = r < p ? w.ws + (w.we - w.ws) * (0.25 + 0.5 * prng(h32('t' + SB.c.t0 + o.wi))()) : -1;
        }

        if (SB.human && hintN < 2 && !SB.hinted) { SB.hinted = true; hintN++; try { localStorage.setItem(HINT_KEY, String(hintN)); } catch (e) {               } SB.hint = 2.4; }

        G.slowT = Math.max(G.slowT || 0, (w.we - SB.t) / 0.75 + 0.05); G.slowV = 0.75;
        return;
      }
      case 'branch': branch(SB, o.wi); return;
      case 'escOut': {

        const ex = escapeTo(SB);
        release(V, 'guard'); if (V.state !== 'move') V.setState('move');
        SB.glides.push({ f: V, x0: V.x, x1: ex.v, t0: SB.t, d: o.dur, face: 1 });
        return;
      }
      case 'stagger': V.setState('stagger'); V.vx = -V.dir * o.kb; return;
      case 'step': SB.glides.push({ f: o.f, x0: o.f.x, x1: o.f.x + o.f.dir * o.d, t0: SB.t, d: o.dur }); return;
      case 'close': { const f = o.f, d = Math.abs(f.opp.x - f.x); if (d > o.want + 12) SB.glides.push({ f, x0: f.x, x1: f.x + f.dir * (d - o.want), t0: SB.t, d: o.dur }); return; }
      case 'guardOn': press(o.f, 'guard'); return;
      case 'guardOff': release(o.f, 'guard'); return;
      case 'tap': release(o.f, 'guard'); press(o.f, 'guard'); return;
      case 'back': { const f = o.f; release(f, 'guard'); f.setState('dodge', { ddir: -f.dir, back: true }); SB.inv = { f, until: o.until }; SB.cap = { f, x0: f.x, serial: f.serial, max: 64 }; return; }
      case 'atk': {
        const f = o.f, a = ATK[o.m];
        f.dir = f.opp.x >= f.x ? 1 : -1;
        f.setState('atk', { atk: a, atkName: o.m, keys: [[0, f.entry]].concat(a.keys), aspd: o.spd });

        SB.pin = o.hold ? { f, x0: f.x, serial: f.serial } : null;
        SB.def = o.def || null;
        return;
      }
      case 'slow': G.slowT = o.d; G.slowV = o.v; return;
      case 'clash': {


        if (A.state === 'atk' && V.state === 'atk') { const P = cross(A.j, V.j) || { x: (A.x + V.x) / 2, y: Math.min(A.y, V.y) - 120 }; A.hitDone = V.hitDone = true; A.clash(P.x, P.y); }
        return;
      }
      case 'watch': SB.seen = new Set(); SB.seenA = new Set(); SB.watch = o; return;
      case 'check': {

        if (o.wi != null) { const w = SB.wins.find((q) => q.i === o.wi); o = Object.assign({}, o, { want: w.ok ? (w.how === 'back' ? 'back' : 'guarded') : 'hit' }); }
        const d = o.f, W = SB.seen || new Set([d.state]), has = (k) => W.has(k), s0 = [...W].join('/'), ok = o.want === 'parry' ? has('parry') || (has('block') && ATK[o.m] && ATK[o.m].kind === 'kick')
          : o.want === 'block' ? (has('block') || has('parry') || (ATK[o.m] && ATK[o.m].kind === 'feint')) && !has('hurt')
            : o.want === 'back' ? !has('hurt') && !has('stagger') && !has('launch') && !has('down')
              : o.want === 'guarded' ? (has('parry') || has('block')) && !has('hurt') && !has('stagger')
              : o.want === 'hit' ? has('hurt') || has('stagger') : o.want === 'clash' ? has('clash') && SB.seenA.has('clash') : true;
        SB.watch = null;
        CH.beats.push({ key: SB.c.key, v: SB.vi, att: o.att.ch.id, m: o.m, want: o.want, got: s0, ok, win: o.wi != null, path: SB.path.join('') });
        return;
      }
      case 'settle': { const f = o.f; if (f.state === 'atk' || f.state === 'dodge') { f.setState('move'); f.vx = 0; } return; }
      case 'home': {
        const F = SB.fin;

        for (const f of [A, V]) { release(f, 'guard'); if (f.state !== 'move') f.setState('move'); }
        SB.glides.push({ f: A, x0: A.x, x1: F.x, t0: SB.t, d: o.dur, face: 1 }, { f: V, x0: V.x, x1: F.vx, t0: SB.t, d: o.dur, face: 1 });
        return;
      }
      case 'final': {
        const F = SB.fin;
        A.x = F.x; V.x = F.vx; A.dir = F.dir; V.dir = F.vdir; A.vx = V.vx = 0;
        A.setState('atk', { atk: F.atk, atkName: F.atkName, keys: [[0, A.entry]].concat(F.atk.keys), aspd: o.spd });
        SB.final = true;
        return;
      }
    }
  }

  function sandboxStep(g, tick0) {
    const S = SB, A = S.A, V = S.V;
    S.t = g.clock - S.c0;
    while (S.i < S.acts.length && S.acts[S.i].t <= S.t + 1e-9) act(S.acts[S.i++]);

    for (let i = S.glides.length - 1; i >= 0; i--) {
      const gl = S.glides[i], u = clamp((S.t - gl.t0) / Math.max(0.01, gl.d), 0, 1);
      if (gl.f.state !== 'move' && gl.f.state !== 'stagger') { S.glides.splice(i, 1); continue; }
      const nx = gl.x0 + (gl.x1 - gl.x0) * ease(u);
      gl.f.vx = (nx - gl.f.x) / Math.max(1e-4, g.STEP);
      gl.f.x = nx;
      if (gl.face) gl.f.dir = gl.f.opp.x >= gl.f.x ? 1 : -1;
      if (u >= 1) { gl.f.vx = 0; S.glides.splice(i, 1); }
    }
    g.timer = S.timer;
    for (const f of [A, V]) { f.posture = 0; f.dz.chain = 0; f.dz.finArm = null; }
    windows(S);
    tick0.call(g, true);
    if (S.watch) { S.seen.add(S.watch.f.state); S.seenA.add(S.watch.att.state); }

    if (ND.cine) { ND.cine.rings.length = 0; ND.cine.slashes.length = 0; ND.cine.banner = null; }
    A.counterUntil = V.counterUntil = 0;
    { const P = fx.parts; if (P) for (let i = P.length - 1; i >= 0; i--) if (P[i].k === 'r') P.splice(i, 1); }
    const pn = S.pin;
    if (pn) { if (pn.f.serial !== pn.serial) S.pin = null; else { const d = (pn.f.x - pn.x0) * pn.f.dir; if (d > 28) pn.f.x = pn.x0 + pn.f.dir * 28; } }


    if (A.onGround && V.onGround && A.state !== 'clash') {
      const lunging = (f) => S.def !== 'hit' && f.state === 'atk' && f.atk && f.atk.kind !== 'kick' && (f.atk.lunge || f.atk.thrust);
      const close = (f) => f.state === 'atk' && /^ua_/.test(f.atkName || '');
      const d = V.x - A.x, ad = Math.abs(d), MIN = lunging(A) || lunging(V) ? 132 : close(A) || close(V) ? 76 : 98;
      if (ad < MIN) { const sd = d === 0 ? A.dir : Math.sign(d), push = (MIN - ad) / 2; A.x -= sd * push; V.x += sd * push; }
    }
    const cp = S.cap;
    if (cp) { if (cp.f.serial !== cp.serial) S.cap = null; else { const d = (cp.x0 - cp.f.x) * cp.f.dir; if (d > cp.max) { cp.f.x = cp.x0 - cp.f.dir * cp.max; cp.f.vx = 0; } } }
    S.rt += g.STEP;
    if (g.clock - S.c0 >= S.dur || g.phase !== 'fight' || S.rt > 40) finish(g);
  }

  function finish(g) {
    const S = SB;
    SB = null; CH.cur = null;
    if (ND.rng && rngNext0) ND.rng.next = rngNext0;
    FIN.on = S.FON;
    g.ais = S.ais;
    S.A.ctrl.mask = S.masks[0]; S.V.ctrl.mask = S.masks[1];
    g.loadState(S.snap);
    if (S.score && ND.score) { Object.assign(ND.score, S.score); ND.score.pops.length = 0; }
    if (ND.mods && S.modHits != null) ND.mods.hits = S.modHits;
    if (S.runner) S.runner.tick = S.runTick;
    const h1 = g.hashState();
    const missed = S.wins.filter((q) => !q.ok).length, hpB = S.V.hp;
    if (S.live && S.wins.length === 3) applyEnd(g, S);
    CH.log.push({ key: S.c.key, ok: h1 === S.h0, fightSecs: +(g.clock - S.c0).toFixed(3), realSecs: +S.rt.toFixed(3), v: S.vi, kind: S.ch.kind, wins: S.wins.map((w) => (w.ok ? 'Y' : 'N')).join(''), path: S.path.join(''), escaped: S.live && missed === 0 && S.wins.length === 3, hpPre: S.pre ? S.pre.hp : null, hpAfter: S.V.hp, hpCine: hpB, live: S.live });
    if (h1 !== S.h0) console.warn('[chor] the fight state did not come back the same', S.c.key);
    if (S.live && missed === 0 && S.wins.length === 3) { CH.escShow = { age: 0, x: (S.A.x + S.V.x) / 2 }; }
  }


  function cross(a, b) {
    if (!a || !b || !a.haF || !a.tip || !b.haF || !b.tip) return null;
    const x1 = a.haF.x, y1 = a.haF.y, x2 = a.tip.x, y2 = a.tip.y, x3 = b.haF.x, y3 = b.haF.y, x4 = b.tip.x, y4 = b.tip.y;
    const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(d) < 1e-6) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d, u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / d;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) } : null;
  }

  const flash0 = fx.flash;
  fx.flash = function (x, y, a, size, col) { if (SB) return flash0.call(this, x, y, a, (size == null ? 60 : size) * 0.35, col); return flash0.apply(this, arguments); };

  const takeHit0 = FP.takeHit;
  FP.takeHit = function (raw, a, from) {

    const cn = this.dz && this.dz.cine;
    if (!SB && D._finHit && cn && cn.fin && cn.V === this && cn.t === 0 && cn.i === 0 && !G.simOnly) {
      PRE.V = this; PRE.clock = ND.simClock || 0; PRE.hp = this.hp; PRE.ghost = this.ghost; PRE.damageTaken = this.damageTaken; PRE.posture = this.posture; PRE.sinceHit = this.sinceHit;
    }
    if (!SB) return takeHit0.apply(this, arguments);
    const hp = this.hp, gh = this.ghost, dt = this.damageTaken, args = Array.prototype.slice.call(arguments);
    if (args[1] && typeof args[1] === 'object') args[1] = Object.assign({}, args[1], { knock: false, launch: false, spike: false, trip: false, lift: 0 });
    this.hp = this.maxHp * 50;
    try { return takeHit0.apply(this, args); } finally { this.hp = hp; this.ghost = gh; this.damageTaken = dt; }
  };

  const isInv0 = FP.isInv;
  FP.isInv = function () { if (SB && SB.inv && SB.inv.f === this && SB.t <= SB.inv.until) return true; return isInv0.apply(this, arguments); };

  const ring0 = fx.ring;
  fx.ring = function () { if (SB) return; return ring0.apply(this, arguments); };
  const text0 = fx.text;
  fx.text = function () { if (SB) return; return text0.apply(this, arguments); };
  if (G.startLock) { const sl0 = G.startLock; G.startLock = function () { if (SB) return; return sl0.apply(this, arguments); }; }



  if (ND.props && ND.props.step) { const ps0 = ND.props.step; ND.props.step = function () { if (SB) return; return ps0.apply(this, arguments); }; }




  CH.viaTick = /[?&]chortick=1(&|$)/.test(Q);
  const tick0 = G.tick;
  G.tick = function (present = true) {
    const drive = !!(this.inBatch || CH.viaTick);
    if (SB) {
      if (drive && present !== false && !this.simOnly) { sandboxStep(this, tick0); return; }
      finish(this);
    }
    if (!drive) return tick0.call(this, present);
    const r = tick0.call(this, present);
    if (present !== false && !this.simOnly && CH.seen.size && this.F) {

      for (const k of CH.seen) if (!this.F.some((f) => { const c = D.finOf(f); return c && keyOf(c) === k; })) CH.seen.delete(k);
    }
    if (present !== false && !this.simOnly && CH.on && this.phase === 'fight' && this.F) {
      for (const f of this.F) {
        const c = D.finOf(f);
        if (c && c.A === f && !CH.seen.has(keyOf(c)) && eligible(c)) { begin(c); break; }
      }
    }
    return r;
  };







  const PV = new WeakMap();
  function ahead(f, dt) {
    let p = PV.get(f);

    const b = f.dead ? null : f.bounds(), bt = b ? b[1] : f.y - 236, b0 = b ? b[0] : f.x - 80, b2 = b ? b[2] : f.x + 80;
    if (!p) PV.set(f, (p = { x: f.x, top: bt, vx: 0, vt: 0 }));
    if (dt > 1e-4) {
      const k = 1 - Math.exp(-dt / 0.08);
      p.vx += ((f.x - p.x) / dt - p.vx) * k; p.vt += ((bt - p.top) / dt - p.vt) * k;
    }
    p.x = f.x; p.top = bt;
    const vx = clamp(p.vx, -1800, 1800), vt = clamp(Math.min(0, p.vt), -2400, 0);
    return { x: f.x + vx * 0.32, top: Math.min(bt, bt + vt * 0.3), b0: Math.min(b0, b0 + vx * 0.32), b2: Math.max(b2, b2 + vx * 0.32) };
  }
  function twoShot(A, V, dt) {

    const reach = (f) => 112 + Math.max(0, ((f.wpn && f.wpn.blade) || 90) + ((f.wpn && f.wpn.handle) || 24) - 120) * 0.7;
    const pa = ahead(A, dt), pv = ahead(V, dt);
    const lo = Math.min(A.x - reach(A), pa.x - reach(A), V.x - reach(V), pv.x - reach(V), pa.b0 - 20, pv.b0 - 20);
    const hi = Math.max(A.x + reach(A), pa.x + reach(A), V.x + reach(V), pv.x + reach(V), pa.b2 + 20, pv.b2 + 20);
    let z = clamp(cam.W / (cam.s * (hi - lo)), 1.0, 2.4);


    const len = (f) => ((f.wpn && f.wpn.blade) || 90) + ((f.wpn && f.wpn.handle) || 24);
    const top = Math.min(Math.min(A.y, V.y) - 236 - Math.max(0, Math.max(len(A), len(V)) - 120) * 0.9, pa.top - 30, pv.top - 30), Y = -100, room = cam.gy - cam.H * 0.08;
    if (room > 0 && (Y - top) * cam.s * z > room) z = Math.max(0.8, room / (cam.s * (Y - top)));
    return { x: (lo + hi) / 2, y: Y, z };
  }


  const SPR = { on: false, x: 0, vx: 0, z: 0, vz: 0 }, W0 = 9;
  function spring(T, dt) {
    if (!SPR.on) { SPR.on = true; SPR.x = T.x; SPR.z = T.z; SPR.vx = SPR.vz = 0; }
    const h = Math.min(0.05, Math.max(0, dt || 0)), n = Math.max(1, Math.ceil(h / 0.005)), k = h / n;
    for (let i = 0; i < n; i++) {

      const AM = 18000 / Math.max(0.5, cam.s * SPR.z), ax = clamp(W0 * W0 * (T.x - SPR.x) - 2 * W0 * SPR.vx, -AM, AM);
      SPR.vx += ax * k; SPR.x += SPR.vx * k;
      SPR.vz += (W0 * W0 * (T.z - SPR.z) - 2 * W0 * SPR.vz) * k; SPR.z += SPR.vz * k;
    }
    return { x: SPR.x, y: T.y, z: SPR.z };
  }
  const follow0 = cam.follow;
  cam.follow = function (dt, fa, fb, focus) {
    const F = G.F;
    let T = null;
    if (SB) T = twoShot(SB.A, SB.V, dt);
    else if (focus && F) {
      let c = null; for (const f of F) { const k = D.finOf(f); if (k && (CH.handled(k) || eligible(k))) c = k; }
      if (c) T = twoShot(c.A, c.V, dt);
    }
    CH.camOn = !!T;
    if (T) focus = spring(T, dt); else SPR.on = false;
    CH.camT = T; CH.camF = focus;
    return follow0.call(this, dt, fa, fb, focus);
  };




  const LIFT = new WeakMap(), LK = { u: 0, t: 0 }, LIFT_OFF = /[?&]lift=0(&|$)/.test(Q);
  const hexRgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return null; const v = parseInt(m[1], 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
  function liftOf(f) {
    let L = LIFT.get(f);
    if (L && L.col === f.col) return L.c;
    const cl = hexRgb(f.col && f.col.cloth), ac = hexRgb(f.col && f.col.accent);
    const lum = cl ? (0.2126 * cl[0] + 0.7152 * cl[1] + 0.0722 * cl[2]) / 255 : 1;
    let c = null;
    if (lum < 0.22 && ac) { const m = (k) => Math.round(ac[k] * 0.55 + 205 * 0.45); c = [m(0), m(1), m(2)]; }
    LIFT.set(f, { col: f.col, c });
    return c;
  }
  const scene = ND.scene;
  if (scene && scene.lightFighter) {
    const lf0 = scene.lightFighter;
    scene.lightFighter = function (c, f, x0, y0, x1, y1) {
      const r = lf0.apply(this, arguments);
      let on = !!SB;
      if (!on && G.F) for (const g of G.F) { const k = D.finOf(g); if (k && (CH.handled(k) || eligible(k))) on = true; }

      const now = ND.scene ? ND.scene.t : 0, dt = clamp(now - (LK.t || now), 0, 0.1); LK.t = now;

      const want = LIFT_OFF ? 0 : on ? 1 : G.F && (G.phase === 'fight' || G.phase === 'intro' || G.phase === 'ko' || G.phase === 'timeup') ? 0.65 : 0;
      LK.u = LK.u < want ? Math.min(want, LK.u + dt * 3.5) : Math.max(want, LK.u - dt * 3.5);
      const col = LK.u > 0 && f && f.ch ? liftOf(f) : null, K = ease(LK.u);
      if (col) {
        const op = c.globalCompositeOperation, a0 = c.globalAlpha;
        c.globalCompositeOperation = 'source-atop'; c.globalAlpha = 1;
        const g = c.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${(0.24 * K).toFixed(3)})`); g.addColorStop(0.55, `rgba(${col[0]},${col[1]},${col[2]},${(0.14 * K).toFixed(3)})`); g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},${(0.06 * K).toFixed(3)})`);
        c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
        c.globalCompositeOperation = op; c.globalAlpha = a0;
      }
      return r;
    };
  }




  const tr = (q) => (D.tr ? D.tr(q) : q);
  function keyFor(f) {
    if (ND.touch && ND.touch.active) return '▼';
    const c = f.ctrl;
    if (c && c.lastSrc && c.lastSrc[0] === 'g') return 'LB';
    if (G.mode === '2p' && G.F && f === G.F[1]) return '↓';
    return ND.input && ND.input.keyLabel ? ND.input.keyLabel('KeyS') : 'S';
  }

  let padCue = false;
  const PADCSS = '#tDpad .td-d.chor-cue{animation:chorCue .45s ease-in-out infinite alternate;border-color:#ffd27a!important;box-shadow:0 0 0 3px rgba(255,210,122,.85),0 0 18px rgba(255,210,122,.9)}@keyframes chorCue{from{transform:scale(1)}to{transform:scale(1.14)}}';
  function setPadCue(on) {
    if (on === padCue) return;
    padCue = on;
    try {
      if (on && !document.getElementById('chorCueCss')) { const st = document.createElement('style'); st.id = 'chorCueCss'; st.textContent = PADCSS; document.head.appendChild(st); }
      const b = document.querySelector('#tDpad .td-d'); if (b) b.classList.toggle('chor-cue', on);
    } catch (e) {               }
  }



  function drawCue(ctx) {
    const S = SB, u0 = Math.max(cam.ui || cam.s, 0.55);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    let anyOpen = false;
    if (S && S.human) {
      const Rmin = Math.max(45, cam.H * 0.115), f = S.V, side = f.x >= f.opp.x ? 1 : -1;
      const hx = cam.sx(f.x), hy = cam.sy(f.y - 225);
      const X = clamp(hx + side * (Rmin + 34 * u0), Rmin * 1.9 + 4, cam.W - Rmin * 1.9 - 4), Y = clamp(hy, cam.H * 0.09 + Rmin * 1.9, cam.H - Rmin * 2);
      for (const w of S.wins) {
        if (w.cancel || !w.open) continue;
        const T0 = w.ws - CUE, after = S.t - (w.ok !== null ? (w.at || w.we) : 9e9);
        if (w.ok !== null && after > 0.55) continue;
        if (w.ok === null) anyOpen = true;
        const u = clamp((w.we - S.t) / Math.max(0.05, w.we - T0), 0, 1), lit = S.t >= w.ws;
        const R = w.ok === null ? Rmin * (1 + 0.9 * u) : Rmin * (1 + 0.25 * clamp(after / 0.25, 0, 1));
        const col = w.ok === true ? '140,240,160' : w.ok === false ? '255,110,96' : lit ? '255,210,110' : '255,255,255';
        const a = w.ok === null ? 1 : clamp(1 - after / 0.55, 0, 1);
        ctx.globalAlpha = a;
        ctx.fillStyle = 'rgba(6,6,10,.45)'; ctx.beginPath(); ctx.arc(X, Y, Rmin * 0.92, 0, 6.283); ctx.fill();
        ctx.lineWidth = (lit || w.ok !== null ? 6 : 4) * u0; ctx.strokeStyle = `rgba(${col},.95)`;
        ctx.beginPath(); ctx.arc(X, Y, R, 0, 6.283); ctx.stroke();
        ctx.lineWidth = 2.5 * u0; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(X, Y, Rmin, 0, 6.283); ctx.stroke();
        const k = w.ok === true ? '✓' : w.ok === false ? '✗' : keyFor(f), sz = Math.round(Rmin * (k.length > 2 ? 0.55 : 0.95));
        ctx.font = `700 ${sz}px Oswald, "Arial Narrow", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 4 * u0; ctx.strokeStyle = 'rgba(5,6,12,.85)'; ctx.strokeText(k, X, Y + sz * 0.05);
        ctx.fillStyle = w.ok === true ? '#9df0a8' : w.ok === false ? '#ff8a7a' : lit ? '#ffd27a' : '#fff'; ctx.fillText(k, X, Y + sz * 0.05);
        ctx.globalAlpha = 1;
      }
      if (S.hint > 0 && anyOpen) {
        S.hint -= 1 / 60;
        const s = tr('Guard now to escape!'), sz = Math.round(Math.max(18, cam.H * 0.05));
        ctx.font = `700 ${sz}px "Source Sans 3", "Noto Serif JP", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const w2 = Math.min(cam.W - 20, ctx.measureText(s).width + 20 * u0), ty = Y - Rmin * 1.95 - sz * 0.4, tx = clamp(X, w2 / 2 + 6, cam.W - w2 / 2 - 6);
        ctx.globalAlpha = Math.min(1, S.hint / 0.4); ctx.fillStyle = 'rgba(6,6,10,.82)'; ctx.fillRect(tx - w2 / 2, ty - sz * 0.75, w2, sz * 1.5);
        ctx.fillStyle = '#ffd27a'; ctx.fillText(s, tx, ty, cam.W - 30); ctx.globalAlpha = 1;
      }
    }
    setPadCue(anyOpen && !!(ND.touch && ND.touch.active));
    const E = CH.escShow;
    if (E) {
      E.age += 1 / 60;
      if (E.age > 1.4 || !G.F || G.phase !== 'fight') CH.escShow = null;
      else {
        const s = tr('ESCAPED'), sz = Math.round(Math.max(26 * u0, cam.H * 0.07)), a = E.age < 0.15 ? E.age / 0.15 : E.age > 1.0 ? (1.4 - E.age) / 0.4 : 1;
        ctx.font = `700 ${sz}px Oswald, "Arial Narrow", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.globalAlpha = a; ctx.lineWidth = 5 * u0; ctx.strokeStyle = 'rgba(5,6,12,.88)';
        const X = clamp(cam.sx(E.x), 80, cam.W - 80), Y = Math.max(cam.H * 0.16, cam.sy(-300));
        ctx.strokeText(s, X, Y); ctx.fillStyle = '#9df0a8'; ctx.fillText(s, X, Y); ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }
  if (ND.cine && ND.cine.draw) { const cd0 = ND.cine.draw; ND.cine.draw = function (ctx) { const r = cd0.apply(this, arguments); if (!G.simOnly) drawCue(ctx); return r; }; }
  const finFx0 = D.finFx;

  if (finFx0) D.finFx = function (k, c, o) { if ((k === 'cut' || k === 'ink') && (CH.handled(c) || eligible(c))) return false; return finFx0.call(this, k, c, o); };
})(window.ND);
