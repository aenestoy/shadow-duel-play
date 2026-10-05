


















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
  const T1 = { fin: 0.62, home: 0.22 };

  const open = (tier, first) => (tier === 1 ? (first.att === 'A' ? stagger(200, 0.5) : stagger(200, 0.3)) : first.att === 'A' ? stagger(230, 0.62) : stagger());
  const mk = (tier, beats) => Object.assign({ beats: [open(tier, beats[0])].concat(beats) }, tier === 1 ? T1 : {});
  const L = (o) => Object.assign({ spd: 0.62, gap: 0.05 }, o || {});
  const E8 = { gap: 0.08 };
  const AUTH = {};
  const def = (id, t1, t2, t3) => { AUTH[id] = [t1, t2, t3]; };




  def('akane', [x('V', 'L1', 'parry', L())],
    [x('V', 'L1', 'parry'), x('A', 'ak_dNuki', 'block'), x('V', 'FL', 'back'), x('A', 'd_kiriUp', 'parry', { spd: 0.5, gap: 0.08 })],
    [x('V', 'L1', 'parry'), x('A', 'ak_dNuki', 'block'), x('V', 'L2', 'parry'), x('A', 'd_kiriUp', 'block', { spd: 0.5 }), x('V', 'FL', 'back'), x('A', 'd_hiza', 'hit', { spd: 0.6, gap: 0.1 })]);

  def('aoi', [x('V', 'L1', 'back', L())],
    [x('V', 'L2', 'parry'), x('A', 'FL', 'block'), x('V', 'L1', 'back'), x('A', 'L2', 'parry', E8)],
    [x('V', 'L1', 'parry'), x('A', 'L1', 'block'), c('L2', 'L2'), x('V', 'FL', 'back'), x('A', 'S2', 'block'), x('A', 'L3', 'hit', E8)]);

  def('kuro', [x('V', 'L2', 'block', L())],
    [x('V', 'L1', 'block'), x('A', 'L3', 'parry'), x('V', 'FL', 'block'), x('A', 'BH', 'back', { spd: 0.6, gap: 0.08 })],
    [x('V', 'L1', 'block'), x('A', 'L1', 'block'), x('V', 'L2', 'parry'), c('L3', 'L1'), x('A', 'H', 'back', { spd: 0.62 }), x('A', 'kick', 'hit', { spd: 0.6, gap: 0.08 })]);

  def('yuki', [x('A', 'FL', 'block', L())],
    [x('V', 'L1', 'back'), x('A', 'FL', 'parry'), x('V', 'L2', 'block'), x('A', 'L2', 'hit', E8)],
    [x('A', 'FL', 'block'), x('V', 'L1', 'back'), x('A', 'L1', 'parry'), x('V', 'L3', 'back'), c('L2', 'L2'), x('A', 'kick', 'hit', { spd: 0.6, gap: 0.08 })]);

  def('ren', [x('A', 'L2', 'block', L())],
    [x('V', 'L1', 'block'), x('A', 'L2', 'block'), x('V', 'FL', 'back'), x('A', 'L3', 'hit', E8)],
    [x('V', 'L1', 'parry'), x('A', 'L2', 'block'), x('V', 'L2', 'block'), c('L1', 'L1'), x('A', 'L1', 'block'), x('V', 'L3', 'back'), x('A', 'L3', 'hit', E8)]);

  def('kage', [x('A', 'BL', 'block', L())],
    [x('V', 'L1', 'back'), x('A', 'BL', 'block'), x('V', 'L2', 'parry'), x('A', 'L2', 'hit', E8)],
    [x('V', 'L1', 'parry'), x('A', 'BL', 'block'), x('V', 'L2', 'back'), x('A', 'L1', 'block'), c('L3', 'L1'), x('A', 'FL', 'hit', E8)]);

  def('shura', [c('L1', 'L1', { gap: 0.08 })],
    [x('V', 'L1', 'block'), x('A', 'L1', 'block'), x('V', 'FL', 'parry'), x('A', 'FL', 'hit', E8)],
    [x('V', 'L2', 'block'), x('A', 'L2', 'block'), c('L3', 'L1'), x('V', 'L1', 'back'), x('A', 'S1', 'block'), x('A', 'FL', 'hit', E8)]);

  def('tetsu', [x('A', 'FL', 'back', L())],
    [x('V', 'L1', 'block'), x('A', 'L2', 'block'), x('V', 'L2', 'parry'), x('A', 'FL', 'back', E8)],
    [x('A', 'FL', 'back'), x('V', 'L1', 'block'), x('A', 'L1', 'parry'), x('V', 'FL', 'block'), x('A', 'S1', 'block'), x('A', 'kick', 'hit', { spd: 0.6, gap: 0.08 })]);

  def('jin', [x('A', 'L1', 'block', L())],
    [x('V', 'L1', 'parry'), x('A', 'L2', 'block'), x('V', 'FL', 'back'), x('A', 'L1', 'parry', E8)],
    [x('V', 'L1', 'block'), x('A', 'L1', 'parry'), x('V', 'L2', 'back'), c('L2', 'L1'), x('A', 'S1', 'block'), x('A', 'L2', 'hit', E8)]);

  def('tsubame', [x('A', 'H', 'block', L({ spd: 0.7 }))],
    [x('V', 'L1', 'back'), x('A', 'H', 'block', { spd: 0.7 }), x('V', 'FL', 'parry'), x('A', 'L2', 'block', E8)],
    [x('V', 'L2', 'back'), x('A', 'L1', 'block'), x('V', 'L1', 'parry'), x('A', 'H', 'block', { spd: 0.7 }), x('V', 'FL', 'back'), x('A', 'kick', 'hit', { spd: 0.6, gap: 0.08 })]);

  def('hana', [x('A', 'L2', 'parry', L())],
    [x('V', 'L1', 'back'), x('A', 'FL', 'block'), x('V', 'L2', 'parry'), x('A', 'L1', 'hit', E8)],
    [x('A', 'FL', 'block'), x('V', 'L1', 'parry'), x('A', 'L2', 'block'), x('V', 'L3', 'back'), x('A', 'S1', 'block'), x('A', 'L1', 'hit', E8)]);

  def('mai', [x('V', 'L2', 'parry', L())],
    [x('V', 'L1', 'parry'), x('A', 'L1', 'block'), x('V', 'FL', 'back'), x('A', 'L3', 'block', E8)],
    [x('V', 'L1', 'back'), x('A', 'L1', 'block'), x('V', 'L2', 'parry'), x('A', 'L3', 'block'), x('V', 'FL', 'back'), x('A', 'L2', 'hit', E8)]);

  def('tora', [x('A', 'tr_l1', 'back', L())],
    [x('V', 'L1', 'block'), x('A', 'tr_l1', 'block'), x('V', 'L2', 'parry'), x('A', 'tr_s2', 'hit', E8)],
    [x('A', 'tr_l1', 'back'), x('V', 'L1', 'block'), x('A', 'tr_s1', 'block'), x('V', 'FL', 'parry'), x('A', 'tr_l3', 'block'), x('A', 'kick', 'hit', { spd: 0.6, gap: 0.08 })]);







  const VP = [x('V', 'L1', 'parry'), x('V', 'L1', 'block'), x('V', 'L2', 'parry'), x('V', 'L2', 'block'), x('V', 'L1', 'back'), x('V', 'FL', 'back'), x('V', 'L3', 'back'), x('V', 'FL', 'block'), x('V', 'FL', 'parry')];
  const POOL = {
    akane: { sig: x('A', 'ak_dNuki', 'block'), A: [x('A', 'd_kiriUp', 'parry', { spd: 0.5 }), x('A', 'd_kiriUp', 'block', { spd: 0.5 }), x('A', 'ak_dKesa', 'block'), x('A', 'FL', 'block')], hit: [x('A', 'd_hiza', 'hit', { spd: 0.6 }), x('A', 'ak_dKesa', 'hit')], C: [c('L1', 'L1'), c('L2', 'L2')] },
    aoi: { sig: x('A', 'FL', 'block'), A: [x('A', 'L1', 'block'), x('A', 'S2', 'block'), x('A', 'L2', 'parry')], hit: [x('A', 'L3', 'hit'), x('A', 'L2', 'hit')], C: [c('L2', 'L2'), c('L1', 'L1')] },
    kuro: { sig: x('A', 'BH', 'back', { spd: 0.6 }), A: [x('A', 'L3', 'parry'), x('A', 'L1', 'block'), x('A', 'H', 'back', { spd: 0.62 })], hit: [x('A', 'kick', 'hit', { spd: 0.6 }), x('A', 'L1', 'hit')], C: [c('L3', 'L1'), c('L1', 'L1')] },
    yuki: { sig: x('A', 'FL', 'block'), A: [x('A', 'FL', 'parry'), x('A', 'L1', 'parry'), x('A', 'L1', 'block')], hit: [x('A', 'L2', 'hit'), x('A', 'kick', 'hit', { spd: 0.6 })], C: [c('L2', 'L2'), c('L1', 'L1')] },
    ren: { sig: x('A', 'L2', 'block'), A: [x('A', 'L1', 'block'), x('A', 'L3', 'block')], hit: [x('A', 'L3', 'hit'), x('A', 'L2', 'hit')], C: [c('L1', 'L1')] },
    kage: { sig: x('A', 'BL', 'block'), A: [x('A', 'L1', 'block'), x('A', 'L2', 'block'), x('A', 'L1', 'parry')], hit: [x('A', 'L2', 'hit'), x('A', 'FL', 'hit')], C: [c('L3', 'L1'), c('L1', 'L1')] },
    shura: { sig: c('L1', 'L1'), A: [x('A', 'L1', 'block'), x('A', 'L2', 'block'), x('A', 'S1', 'block')], hit: [x('A', 'FL', 'hit')], C: [c('L3', 'L1'), c('L2', 'L2')] },
    tetsu: { sig: x('A', 'FL', 'back'), A: [x('A', 'L2', 'block'), x('A', 'L1', 'parry'), x('A', 'S1', 'block')], hit: [x('A', 'kick', 'hit', { spd: 0.6 }), x('A', 'L1', 'hit')], C: [c('L1', 'L1')] },
    jin: { sig: x('A', 'L1', 'parry'), A: [x('A', 'L1', 'block'), x('A', 'L2', 'block'), x('A', 'S1', 'block')], hit: [x('A', 'L2', 'hit')], C: [c('L2', 'L1'), c('L1', 'L1')] },
    tsubame: { sig: x('A', 'H', 'block', { spd: 0.7 }), A: [x('A', 'L1', 'block'), x('A', 'L2', 'block')], hit: [x('A', 'kick', 'hit', { spd: 0.6 }), x('A', 'L1', 'hit')], C: [c('L1', 'L1')] },
    hana: { sig: x('A', 'FL', 'block'), A: [x('A', 'L2', 'block'), x('A', 'L2', 'parry'), x('A', 'S1', 'block')], hit: [x('A', 'L1', 'hit')], C: [c('L1', 'L1')] },
    mai: { sig: x('A', 'L1', 'block'), A: [x('A', 'L3', 'block'), x('A', 'L2', 'block')], hit: [x('A', 'L2', 'hit')], C: [c('L1', 'L1')] },
    tora: { sig: x('A', 'tr_l1', 'back'), A: [x('A', 'tr_l1', 'block'), x('A', 'tr_s1', 'block'), x('A', 'tr_l3', 'block')], hit: [x('A', 'tr_s2', 'hit'), x('A', 'kick', 'hit', { spd: 0.6 })], C: [c('L1', 'L1')] },
  };
  const h32 = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const prng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const cp = (b, o) => Object.assign({}, b, o || {});

  const PAT = { 1: ['V', 'S', 'C', 'A'], 2: ['VSVH', 'SVAV', 'VAVS', 'SVVH', 'VSAH'], 3: ['VSVCAH', 'SVAVCH', 'VAVSVH', 'SVCVAH', 'VSAVCH', 'CVSVAH'] };
  const sigTxt = (bs) => bs.map((b) => b.k === 'c' ? 'c' + b.mA + b.mV : b.att + b.m + b.def).join(' ');
  function gen(id, tier, n) {
    const P = POOL[id], r = prng(h32(id + ':' + tier + ':' + n)), pick = (L) => L[Math.floor(r() * L.length)];
    const pats = PAT[tier];
    for (let tries = 0; tries < 40; tries++) {
      const pat = pick(pats), out = [];
      let lastV = null;
      for (const ch of pat) {
        let b;
        if (ch === 'V') { do b = pick(VP); while (lastV && b.m === lastV.m && b.def === lastV.def && VP.length > 1); lastV = b; }
        else if (ch === 'S') b = P.sig;
        else if (ch === 'A') b = pick(P.A);
        else if (ch === 'H') b = pick(P.hit);
        else b = pick(P.C);
        out.push(cp(b));
      }
      if (tier === 1) Object.assign(out[0], { spd: 0.62, gap: 0.05 }); else out[out.length - 1].gap = 0.08;
      return out;
    }
    return null;
  }
  for (const id of Object.keys(AUTH)) for (let t = 1; t <= 3; t++) {
    const L0 = [AUTH[id][t - 1]], seen = new Set([sigTxt(AUTH[id][t - 1])]);
    for (let n = 1; L0.length < 4 && n < 40; n++) { const g = gen(id, t, n); if (g && !seen.has(sigTxt(g))) { seen.add(sigTxt(g)); L0.push(g); } }
    CH.vars[id + ':' + t] = L0.map((bs) => mk(t, bs));
    CH.scripts[id + ':' + t] = CH.vars[id + ':' + t][0];
  }



  const knobOff = () => !!(ND.AI_KNOBS && ND.AI_KNOBS.finChor === 0);
  const eligible = (c) => !!(c && !c.done && !c.un && !c.crown && CH.on && !knobOff() && CH.scripts[c.key] && (!WHO || WHO.includes(c.A.ch.id)) &&
    c.V.dz && c.V.dz.armed !== false && c.A.dz && c.A.dz.armed !== false &&
    G.mode !== 'online' && G.mode !== 'shadow' && G.mode !== 'attract' && G.mode !== 'train' && !(ND.net && ND.net.active) && !(ND.tutor && ND.tutor.on));
  const keyOf = (c) => c.key + '@' + c.t0;
  CH.handled = (c) => !!(c && CH.seen.has(keyOf(c)));






  const LONG = { naginata: 1, bo: 1, yumi: 1, kusarigama: 1, nodachi: 1 };
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
      const bk = S.beats.filter((b) => b.def === 'back').length, aN = S.beats.filter((b) => b.att === 'A').length;
      const s = r() - (room < 260 ? 0.25 * bk : 0) - (long ? 0.08 * S.beats.filter((b) => b.k === 'c').length : 0) + (ahead < -0.15 ? 0.06 * aN : 0);
      if (s > bs) { bs = s; best = i; }
    });
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






  const CUE = 0.32;
  const winBeats = (S, tier) => {
    const idx = [];
    S.forEach((b, i) => { if (b.k === 'x' && b.att === 'A' && !(ATK[b.m] && ATK[b.m].kind === 'feint') && b.m !== 'BL') idx.push(i); });
    return idx.slice(Math.max(0, idx.length - (tier - 1)));
  };
  function plan(c, SC0, fin, esc) {
    const S = SC0.beats, A = c.A, V = c.V, acts = [], wins = [];
    let t = 0;
    const who = (w) => (w === 'A' ? A : V);
    const wset = esc ? new Set(winBeats(S, c.tier)) : new Set();
    S.forEach((b, bi) => {
      if (b.k === 'stagger') { acts.push({ t, k: 'stagger', kb: b.kb }); t += b.dur; return; }
      if (b.k === 'step') { acts.push({ t, k: 'step', f: who(b.who), d: b.d, dur: b.dur }); t += b.dur; return; }
      if (b.k === 'c') {

        const mA = moveOf(A, b.mA), mV = moveOf(V, b.mV), aA = ATK[mA], aV = ATK[mV];
        if (!aA || !aV) return;
        acts.push({ t, k: 'close', f: A, want: 150, dur: 0.17 });
        t += 0.18;
        const hA = hitOf(aA)[0][0] / kOf(A, b.spd), hV = hitOf(aV)[0][0] / kOf(V, b.spd), h = Math.max(hA, hV), hit = t + h;
        acts.push({ t: t + h - hA, k: 'atk', f: A, m: mA, spd: b.spd }, { t: t + h - hV, k: 'atk', f: V, m: mV, spd: b.spd });
        acts.push({ t: hit - 0.004, k: 'clash' }, { t: hit - 0.01, k: 'slow', v: 0.32, d: 0.3 });
        acts.push({ t: hit - 0.03, k: 'watch', f: V, att: A }, { t: hit + 0.2, k: 'check', f: V, att: A, want: 'clash', m: mA });
        const end = hit + 0.42;
        acts.push({ t: end, k: 'settle', f: A }, { t: end, k: 'settle', f: V });
        t = end + b.gap;
        return;
      }


      const att = who(b.att), def = att === A ? V : A;
      let m = moveOf(att, b.m);
      if (att === V && ATK[m] && ATK[m].kind === 'kick' && b.m !== 'kick') m = moveOf(V, 'L1');
      const a = ATK[m];
      if (!a) return;

      const want = b.want || (a.kind === 'kick' ? 112 : a.kind === 'shoot' ? 300 : a.kind === 'whip' ? 150 : 162);
      acts.push({ t, k: 'close', f: att, want, dur: 0.17 });
      t += 0.18;
      const W = hitOf(a);
      const hit = t + W[W.length - 1][0] / kOf(att, b.spd), end = Math.min(t + (a.dur || 0.5) / kOf(att, b.spd), hit + (b.rec || (a.kind === 'shoot' ? 0.6 : a.kind === 'whip' ? 0.5 : 0.34)));

      acts.push({ t: end, k: 'settle', f: att }, { t: end, k: 'settle', f: def });
      acts.push({ t, k: 'atk', f: att, m, spd: b.spd, hold: b.def === 'back' && !wset.has(bi), def: b.def });
      acts.push({ t: hit - 0.01, k: 'slow', v: b.def === 'hit' ? 0.4 : 0.35, d: 0.24 });
      if (wset.has(bi)) {

        const wi = wins.length, we = hit - 0.06, ws = we - ((ND.parryWin ? ND.parryWin(def) : 0.17) / Math.max(0.3, b.spd) + 0.06);
        wins.push({ i: wi, ws, we, hit, end, f: def, att, m, block: a.kind !== 'blade', fin: false, ok: null, cancel: false, def0: b.def });
        acts.push({ t: ws - CUE, k: 'cue', wi });
        const fb = (o) => Object.assign(o, { wf: wi });
        if (b.def !== 'hit') acts.push(fb({ t: Math.max(0, t - 0.25), k: 'guardOn', f: def, def: b.def }));
        if (b.def === 'parry') acts.push(fb({ t: hit - 0.05, k: 'tap', f: def }));
        if (b.def === 'back') acts.push(fb({ t: hit - 0.2, k: 'back', f: def, until: Math.max(hit + (a.kind === 'whip' ? 0.5 : 0.2), t + W[W.length - 1][1] / kOf(att, b.spd) + 0.12) }));
        acts.push({ t: Math.max(hit + 0.12, end - 0.12), k: 'guardOff', f: def });
        acts.push({ t: hit - 0.03, k: 'watch', f: def, att }, { t: end - 0.005, k: 'check', f: def, att, want: b.def, m, wi });
      } else {
        if (b.def !== 'hit') acts.push({ t: Math.max(0, t - 0.25), k: 'guardOn', f: def, def: b.def });
        if (b.def === 'parry') acts.push({ t: hit - 0.05, k: 'tap', f: def });
        if (b.def === 'back') acts.push({ t: hit - 0.2, k: 'back', f: def, until: Math.max(hit + (a.kind === 'whip' ? 0.5 : 0.2), t + W[W.length - 1][1] / kOf(att, b.spd) + 0.12) });
        acts.push({ t: Math.max(hit + 0.12, end - 0.12), k: 'guardOff', f: def });
        acts.push({ t: hit - 0.03, k: 'watch', f: def, att }, { t: end - 0.005, k: 'check', f: def, att, want: b.def, m });
      }
      t = end + b.gap;
    });

    const fs = SC0.fin || 0.5, hd = Math.max(SC0.home || 0.34, homeWay(c, S, fin) / 230), kf = kOf(A, fs), lead = fin.st / kf;
    acts.push({ t, k: 'home', dur: hd });
    t += hd + 0.02;
    acts.push({ t, k: 'final', spd: fs });
    const dur = t + lead;
    if (esc) {

      const wi = wins.length, we = dur - 0.06, ws = we - ((ND.parryWin ? ND.parryWin(V) : 0.17) / fs + 0.06);
      wins.push({ i: wi, ws, we, hit: dur, end: dur, f: V, att: A, m: fin.atkName, block: !(fin.atk && fin.atk.kind === 'blade'), fin: true, ok: null, cancel: false });
      acts.push({ t: ws - CUE, k: 'cue', wi });
    }
    acts.sort((p, q) => p.t - q.t);
    return { acts, dur, wins };
  }


  function homeWay(c, S) { let d = 0; for (const b of S) if (b.k === 'x' && b.def === 'back') d += 64; else if (b.k === 'x' && b.def === 'hit') d += 50; else if (b.k === 'c') d += 60; return d; }


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
      if (!w.open || w.cancel || w.ok !== null) continue;
      const t = S.t;
      let pressed = false;
      if (S.human) pressed = edge && t >= w.ws - 1e-9;
      else pressed = w.cpu >= 0 && t >= w.cpu;

      if (S.human && edge && t < w.ws) { w.ok = false; w.early = true; }
      else if (pressed && t <= w.we + 1e-9) {
        w.ok = true; w.at = t;
        press(V, 'guard');
        w.tapAt = w.block ? -1 : w.hit - 0.05;
      } else if (t > w.we) w.ok = false;
      if (w.ok === false) {
        S.failed = true; w.open = false;
        for (const q of S.wins) if (q !== w && q.ok === null) q.cancel = true;
      }
    }
    for (const w of S.wins) {
      if (w.ok && w.tapAt > 0 && S.t >= w.tapAt) { w.tapAt = 0; release(V, 'guard'); press(V, 'guard'); }
      if (w.ok && !w.done && S.t >= w.hit + 0.12) { w.done = true; if (!w.fin) release(V, 'guard'); }
    }


    const last = S.wins[S.wins.length - 1];
    if (last && last.fin && last.ok && !S.escaped && S.wins.every((w) => w.ok)) {
      S.escaped = true;
      S.dur = last.hit + 0.78;
      S.acts.push({ t: last.hit + 0.16, k: 'escOut', dur: 0.45 }, { t: last.hit + 0.3, k: 'settle', f: S.A });
      S.acts.sort((p, q) => p.t - q.t);
      if (S.i > S.acts.length) S.i = S.acts.length;
    }
  }


  function applyEscape(g, S) {
    const A = S.A, V = S.V, c = D.finOf(A) || D.finOf(V);
    if (c) D.endFin(c);
    const P = S.pre;
    if (P) { V.hp = P.hp; V.ghost = P.ghost; V.damageTaken = P.damageTaken; V.posture = P.posture; }
    const ex = escapeTo(S);
    for (const f of [A, V]) { if (!f.dead) { f.setState('move'); f.vx = f.vy = 0; f.y = 0; f.onGround = true; f.locked = false; f.hitDone = true; } }
    A.x = ex.a; V.x = ex.v; A.dir = V.x >= A.x ? 1 : -1; V.dir = -A.dir;
    g.slowT = 0; g.slow = 1; g.hitstopT = 0; g.dim = 0; g.cineT = 0; g.focus = null;
    CH.escLog.push({ key: S.c.key, v: S.vi, human: S.human });
  }

  function begin(c) {
    const A = c.A, V = c.V, vi = pickVar(c), S0 = CH.vars[c.key][vi];
    CH.seen.add(keyOf(c)); CH.last[c.key] = vi;
    const snap = G.saveState(), h0 = G.hashState();
    const fin = { atk: A.atk, atkName: A.atkName, keys: A.keys, aspd: A.aspd, st: A.st, x: A.x, vx: V.x, dir: A.dir, vdir: V.dir };

    const human = !!(G.isHuman && G.isHuman(V)), ai = (G.ais || []).find((q) => q.me === V) || null;
    const esc = CH.esc && !escOff() && (human || !!ai);
    const P = plan(c, S0, fin, esc);
    const pre = PRE.V === V && PRE.clock === c.t0 ? Object.assign({}, PRE) : null;
    SB = { c, A, V, snap, h0, fin, acts: P.acts, dur: P.dur, wins: P.wins, vi, human, ai, pre, failed: false, escaped: false, i: 0, c0: G.clock, timer: G.timer, ais: G.ais, masks: [A.ctrl.mask, V.ctrl.mask],
      FON: FIN.on, rt: 0, glides: [], walk: null, hpA: A.hp, hpV: V.hp, gHeld: guardHeld(V) };
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
    if (o.wf != null && !SB.wins[o.wf].cancel) return;
    switch (o.k) {
      case 'cue': {
        const w = SB.wins[o.wi];
        if (SB.failed) { w.cancel = true; return; }
        w.open = true;

        if (!SB.human) {
          const p = escChance(SB.ai), r = prng(h32(String(ND.rng ? ND.rng.s : 0) + ':' + SB.c.t0 + ':' + o.wi + ':' + SB.c.key))();
          w.cpu = r < p ? w.ws + (w.we - w.ws) * (0.25 + 0.5 * prng(h32('t' + SB.c.t0 + o.wi))()) : -1;
        }

        if (SB.human && hintN < 2 && !SB.hinted) { SB.hinted = true; hintN++; try { localStorage.setItem(HINT_KEY, String(hintN)); } catch (e) {               } SB.hint = 2.4; }

        G.slowT = Math.max(G.slowT || 0, (w.we - SB.t) / 0.5 + 0.1); G.slowV = 0.5;
        return;
      }
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

        if (o.wi != null) { const w = SB.wins[o.wi]; o = Object.assign({}, o, { want: w.cancel ? o.want : w.ok ? (w.block ? 'block' : 'parry') : 'hit' }); }
        const d = o.f, W = SB.seen || new Set([d.state]), has = (k) => W.has(k), s0 = [...W].join('/'), ok = o.want === 'parry' ? has('parry') || (has('block') && ATK[o.m] && ATK[o.m].kind === 'kick')
          : o.want === 'block' ? (has('block') || has('parry') || (ATK[o.m] && ATK[o.m].kind === 'feint')) && !has('hurt')
            : o.want === 'back' ? !has('hurt') && !has('stagger') && !has('launch') && !has('down')
              : o.want === 'hit' ? has('hurt') || has('stagger') : o.want === 'clash' ? has('clash') && SB.seenA.has('clash') : true;
        SB.watch = null;
        CH.beats.push({ key: SB.c.key, v: SB.vi, att: o.att.ch.id, m: o.m, want: o.want, got: s0, ok, win: o.wi != null });
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
      const d = V.x - A.x, ad = Math.abs(d), MIN = lunging(A) || lunging(V) ? 132 : 98;
      if (ad < MIN) { const sd = d === 0 ? A.dir : Math.sign(d), push = (MIN - ad) / 2; A.x -= sd * push; V.x += sd * push; }
    }
    const cp = S.cap;
    if (cp) { if (cp.f.serial !== cp.serial) S.cap = null; else { const d = (cp.x0 - cp.f.x) * cp.f.dir; if (d > cp.max) { cp.f.x = cp.x0 - cp.f.dir * cp.max; cp.f.vx = 0; } } }
    S.rt += g.STEP;
    if (g.clock - S.c0 >= S.dur || g.phase !== 'fight' || S.rt > 30) finish(g);
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
    if (S.escaped) applyEscape(g, S);
    CH.log.push({ key: S.c.key, ok: h1 === S.h0, fightSecs: +S.dur.toFixed(3), realSecs: +S.rt.toFixed(3), v: S.vi, wins: S.wins.map((w) => (w.cancel ? '-' : w.ok ? 'Y' : 'N')).join(''), escaped: !!S.escaped });
    if (h1 !== S.h0) console.warn('[chor] the fight state did not come back the same', S.c.key);
    if (S.escaped) { CH.escShow = { age: 0, x: (S.A.x + S.V.x) / 2 }; }
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
    const hp = this.hp, gh = this.ghost, dt = this.damageTaken;
    this.hp = this.maxHp * 50;
    try { return takeHit0.apply(this, arguments); } finally { this.hp = hp; this.ghost = gh; this.damageTaken = dt; }
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
  function drawCue(ctx) {
    const S = SB, u0 = Math.max(cam.ui || cam.s, 0.55);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (S && S.human) {
      for (const w of S.wins) {
        if (!w.open || w.cancel || (w.ok === false) || S.t > w.hit + 0.1) continue;
        const f = w.f, X = cam.sx(f.x), Y = cam.sy(f.y - 320),
           T0 = w.ws - CUE, u = clamp((w.we - S.t) / Math.max(0.05, w.we - T0), 0, 1);
        const lit = S.t >= w.ws, held = w.ok === true, R = (19 + 42 * u) * u0;
        ctx.lineWidth = (lit ? 5 : 3) * u0;
        ctx.strokeStyle = held ? 'rgba(140,240,160,.95)' : lit ? 'rgba(255,214,110,.95)' : 'rgba(255,255,255,.75)';
        ctx.beginPath(); ctx.arc(X, Y, R, 0, 6.283); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2 * u0; ctx.beginPath(); ctx.arc(X, Y, 19 * u0, 0, 6.283); ctx.stroke();
        const k = keyFor(f), sz = Math.round(18 * u0);
        ctx.font = `700 ${sz}px Oswald, "Arial Narrow", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const tw = ctx.measureText(k).width + 14 * u0, ty = Y;
        ctx.fillStyle = 'rgba(6,6,10,.8)'; ctx.fillRect(X - tw / 2, ty - sz * 0.75, tw, sz * 1.5);
        ctx.fillStyle = held ? '#9df0a8' : lit ? '#ffd27a' : '#fff'; ctx.fillText(k, X, ty);
      }
      if (S.hint > 0) {
        S.hint -= 1 / 60;
        const s = tr('Guard now to escape!'), sz = Math.round(17 * u0);
        ctx.font = `600 ${sz}px "Source Sans 3", "Noto Serif JP", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const w2 = Math.min(cam.W - 20, ctx.measureText(s).width + 24 * u0), y = cam.H * 0.2;
        ctx.globalAlpha = Math.min(1, S.hint / 0.4); ctx.fillStyle = 'rgba(6,6,10,.8)'; ctx.fillRect(cam.W / 2 - w2 / 2, y - sz, w2, sz * 2);
        ctx.fillStyle = '#ffd27a'; ctx.fillText(s, cam.W / 2, y + u0, cam.W - 30); ctx.globalAlpha = 1;
      }
    }
    const E = CH.escShow;
    if (E) {
      E.age += 1 / 60;
      if (E.age > 1.4 || !G.F || G.phase !== 'fight') CH.escShow = null;
      else {
        const s = tr('ESCAPED'), sz = Math.round(26 * u0), a = E.age < 0.15 ? E.age / 0.15 : E.age > 1.0 ? (1.4 - E.age) / 0.4 : 1;
        ctx.font = `700 ${sz}px Oswald, "Arial Narrow", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.globalAlpha = a; ctx.lineWidth = 5 * u0; ctx.strokeStyle = 'rgba(5,6,12,.88)';
        const X = cam.sx(E.x), Y = cam.sy(-300);
        ctx.strokeText(s, X, Y); ctx.fillStyle = '#9df0a8'; ctx.fillText(s, X, Y); ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }
  if (ND.cine && ND.cine.draw) { const cd0 = ND.cine.draw; ND.cine.draw = function (ctx) { const r = cd0.apply(this, arguments); if (!G.simOnly) drawCue(ctx); return r; }; }
  const finFx0 = D.finFx;

  if (finFx0) D.finFx = function (k, c, o) { if ((k === 'cut' || k === 'ink') && (CH.handled(c) || eligible(c))) return false; return finFx0.call(this, k, c, o); };
})(window.ND);
