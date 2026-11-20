
















(function (ND) {
  'use strict';
  const FLAG = (() => { try { return !/[?&]duel=0(&|$)/.test(location.search || ''); } catch (e) { return true; } })();
  if (!FLAG || !ND.duel || !ND.Fighter || !ND.game) return;
  const Math = ND.DM || globalThis.Math;
  const D = ND.duel, G = ND.game, FP = ND.Fighter.prototype, ATK = ND.ATK, PO = ND.POSES, pose = ND.pose, fx = ND.fx, au = ND.audio, cam = ND.cam, E = ND.M.ease;
  const { clamp } = ND.M;
  const Q = (() => { try { return location.search || ''; } catch (e) { return ''; } })();
  const OFF = /[?&]fin=0(&|$)/.test(Q);

  const FIN = D.FIN = {
    on: !OFF,
    win: 1.0,
    dmgK: 0.7,
    gap: 128, gapUa: 104, gapDown: 72,
    tierOf: (pts) => (pts <= 0 ? 0 : pts <= 2 ? 1 : pts <= 4 ? 2 : 3),
    stats: null,
  };
  const stat = (k, v = 1) => { const S = FIN.stats; if (S) S[k] = (S[k] || 0) + v; if (D.stats) D.stats['fin_' + k] = (D.stats['fin_' + k] || 0) + v; };
  const isFin = (c) => !!(c && c.fin && !c.done);
  D.finOf = (f) => (f && f.dz && isFin(f.dz.cine) ? f.dz.cine : null);















  const SC = D.FIN_SCRIPTS = {};
  const def = (id, s) => { SC[id] = s; s.ops.sort((a, b) => a.t - b.t); return s; };


  def('akane:1', {
    dur: 1.15, trig: { knock: 1, kb: 300, mul: 1.15, lift: 0.9 }, card: { k: '早抜', n: 'HAYANUKI' },
    ops: [
      { t: 0, op: 'slow', v: 0.3, d: 0.3 }, { t: 0, op: 'cam', on: 'V', z: 2.26, y: -112, cut: 1 }, { t: 0, op: 'fx', k: 'ink', a: -0.15, len: 0.23 },
      { t: 0.42, op: 'cam', on: 'A', z: 2.12, y: -118, cut: 1 },
      { t: 0.46, op: 'pose', who: 'A', keys: [[0.16, 'chiburi', 'outQuart'], [0.3, 'chiburi'], [0.6, 'ak_stance', 'inOut']] },
      { t: 0.8, op: 'sheathe' }, { t: 0.98, op: 'fx', k: 'click' },
    ] });
  def('akane:2', {
    dur: 1.9, trig: { stun: 1.6, kb: 300 }, card: { k: '返し斬り', n: 'KAESHI-GIRI' },
    ops: [
      { t: 0, op: 'slow', v: 0.4, d: 0.22 }, { t: 0, op: 'cam', on: 'mid', z: 2.08, y: -118, cut: 1 }, { t: 0, op: 'fx', k: 'ink', a: 0.6, len: 0.16 },
      { t: 0.3, op: 'mv', m: 'ak_tsubame', spd: 0.85, hits: [{ dmg: 4, stun: 1.6, kb: 260 }, { dmg: 5, knock: 1, kb: 420, lift: 1.0 }] },
      { t: 0.36, op: 'cam', on: 'mid', z: 2.33, y: -122 }, { t: 0.36, op: 'dim', v: 0.35 },
      { t: 0.62, op: 'slow', v: 0.35, d: 0.4 }, { t: 0.62, op: 'fx', k: 'ink', a: -1.1, len: 0.20 }, { t: 0.66, op: 'fx', k: 'card' },
      { t: 0.95, op: 'cam', on: 'A', z: 2.16, y: -118, cut: 1 },
      { t: 1.05, op: 'pose', who: 'A', keys: [[0.16, 'chiburi', 'outQuart'], [0.32, 'chiburi'], [0.62, 'ak_stance', 'inOut']] },
      { t: 1.42, op: 'sheathe' }, { t: 1.62, op: 'fx', k: 'click' },
    ] });
  def('akane:3', {

    dur: 3.0, trig: { stun: 2.6, kb: 30 }, card: { k: '紅一閃', n: 'KURENAI ISSEN' },
    ops: [
      { t: 0, op: 'slow', v: 0.4, d: 0.2 }, { t: 0, op: 'cam', on: 'mid', z: 2.06, y: -118, cut: 1 },
      { t: 0.22, op: 'mv', m: 'ak_dKesa', spd: 1, hits: [{ dmg: 4, stun: 2.4, kb: 120 }] },
      { t: 0.62, op: 'glide', gap: 230, d: 0.34 }, { t: 0.62, op: 'pose', who: 'A', keys: [[0.3, 'ak_stance', 'inOutSine'], [0.6, 'ak_stance']] },
      { t: 0.66, op: 'sheathe' },
      { t: 0.72, op: 'cam', on: 'A', z: 2.59, y: -112, cut: 1 }, { t: 0.72, op: 'dim', v: 0.55 }, { t: 0.8, op: 'fx', k: 'gather' },
      { t: 1.22, op: 'mv', m: 'sp_akane', spd: 1, hits: [{ dmg: 9, stun: 1.6, kb: 0 }] },
      { t: 1.5, op: 'slow', v: 0.28, d: 0.65 }, { t: 1.5, op: 'cam', on: 'mid', z: 1.89, y: -120, cut: 1 }, { t: 1.52, op: 'fx', k: 'ink', a: -0.04, len: 0.32, w: 1.25 },
      { t: 1.62, op: 'fx', k: 'card' },
      { t: 2.05, op: 'sheathe' }, { t: 2.2, op: 'fx', k: 'click' },
      { t: 2.24, op: 'hit', h: { dmg: 3, fall: 1, kb: 110, lift: 0.45, back: 1 } },
      { t: 2.3, op: 'cam', on: 'V', z: 2.06, y: -100 },
    ] });
  def('akane:u', {
    dur: 1.6, trig: { stun: 1.5, kb: 620 }, card: { k: '掌打', n: 'SHOTEI RENDA' },
    ops: [
      { t: 0, op: 'slow', v: 0.45, d: 0.18 }, { t: 0, op: 'cam', on: 'mid', z: 2.22, y: -120, cut: 1 },
      { t: 0.2, op: 'mv', m: 'ua_palm', spd: 1.45, hits: [{ dmg: 2, stun: 1.5, kb: 480, part: 'body' }] },
      { t: 0.46, op: 'mv', m: 'ua_jab', spd: 1.3, hits: [{ dmg: 2, stun: 1.5, kb: 480, part: 'head' }] },
      { t: 0.66, op: 'mv', m: 'ua_palm', spd: 1.45, hits: [{ dmg: 2, stun: 1.5, kb: 480, part: 'head' }] },
      { t: 0.92, op: 'mv', m: 'ua_ram', spd: 1, hits: [{ dmg: 4, knock: 1, kb: 330, lift: 0.9 }] },
      { t: 1.12, op: 'slow', v: 0.35, d: 0.32 }, { t: 1.12, op: 'cam', on: 'V', z: 2.33, y: -110 }, { t: 1.14, op: 'fx', k: 'card' },
    ] });



  def('mai:1', {
    dur: 1.2, trig: { knock: 1, kb: 330, mul: 1.15, lift: 0.8 }, card: { k: '扇返し', n: 'OGI-GAESHI' },
    ops: [
      { t: 0, op: 'slow', v: 0.32, d: 0.28 }, { t: 0, op: 'cam', on: 'V', z: 2.2, y: -104, cut: 1 }, { t: 0, op: 'fx', k: 'ink', a: 0.35, len: 0.16 },
      { t: 0.4, op: 'cam', on: 'A', z: 2.35, y: -122, cut: 1 },
      { t: 0.42, op: 'pose', who: 'A', keys: [[0.14, 'mi_hA', 'outQuart'], [0.36, 'mi_hA'], [0.62, 'mi_stance', 'inOut']] },
      { t: 0.52, op: 'fx', k: 'snap' }, { t: 0.52, op: 'fx', k: 'petals', n: 14 },
    ] });
  def('mai:2', {
    dur: 2.1, trig: { stun: 1.7, kb: 230 }, card: { k: '胡蝶乱舞', n: 'KOCHO RANBU' },
    ops: [
      { t: 0, op: 'slow', v: 0.4, d: 0.2 }, { t: 0, op: 'cam', on: 'mid', z: 2.05, y: -116, cut: 1 },
      { t: 0.22, op: 'mv', m: 'mi_l1', spd: 1, hits: [{ dmg: 2, stun: 1.6, kb: 160 }] },
      { t: 0.44, op: 'mv', m: 'mi_l2', spd: 1, hits: [{ dmg: 3, stun: 1.6, kb: 160 }] },
      { t: 0.5, op: 'cam', on: 'A', z: 2.4, y: -118, cut: 1 }, { t: 0.5, op: 'fx', k: 'petals', n: 8 },
      { t: 0.68, op: 'mv', m: 'fm_dh', spd: 1, hits: [{ dmg: 4, knock: 1, kb: 440, lift: 1.0 }] },
      { t: 0.9, op: 'cam', on: 'mid', z: 1.8, y: -124, cut: 1 }, { t: 0.9, op: 'slow', v: 0.36, d: 0.42 }, { t: 0.9, op: 'fx', k: 'ink', a: -0.5, len: 0.2 },
      { t: 0.96, op: 'fx', k: 'card' },
      { t: 1.3, op: 'pose', who: 'A', keys: [[0.16, 'mi_hA', 'outQuart'], [0.34, 'mi_hA'], [0.6, 'mi_stance', 'inOut']] }, { t: 1.4, op: 'fx', k: 'snap' },
    ] });
  def('mai:3', {
    dur: 2.7, trig: { stun: 2.2, kb: 200 }, card: { k: '天女の舞', n: 'TENNYO NO MAI' },
    ops: [
      { t: 0, op: 'slow', v: 0.4, d: 0.2 }, { t: 0, op: 'cam', on: 'mid', z: 2.0, y: -118, cut: 1 },
      { t: 0.2, op: 'mv', m: 'fm_s1', spd: 1, hits: [{ dmg: 3, stun: 2, kb: 150 }, { dmg: 3, knock: 1, kb: 120, lift: 1.5 }] },
      { t: 0.3, op: 'cam', on: 'A', z: 2.4, y: -120, cut: 1 }, { t: 0.3, op: 'fx', k: 'petals', n: 10 },
      { t: 0.56, op: 'cam', on: 'V', z: 1.75, y: -170 }, { t: 0.58, op: 'slow', v: 0.35, d: 0.35 }, { t: 0.6, op: 'dim', v: 0.4 },
      { t: 0.72, op: 'mv', m: 'fm_up', spd: 1.1, hits: [{ dmg: 4, knock: 1, kb: 40, lift: 0.95 }] },
      { t: 0.8, op: 'fx', k: 'ink', a: -1.2, len: 0.2 },
      { t: 1.15, op: 'mv', m: 'mi_heavy', spd: 1 }, { t: 1.15, op: 'cam', on: 'mid', z: 1.6, y: -126, cut: 1 },
      { t: 1.43, op: 'hit', h: { dmg: 5, knock: 1, kb: 560, lift: 0.55 } }, { t: 1.43, op: 'slow', v: 0.3, d: 0.5 }, { t: 1.43, op: 'fx', k: 'petals', n: 18 },
      { t: 1.5, op: 'fx', k: 'card' },
      { t: 1.9, op: 'pose', who: 'A', keys: [[0.2, 'mi_hA', 'outQuart'], [0.5, 'mi_stance', 'inOut']] }, { t: 2.0, op: 'fx', k: 'snap' },
    ] });
  def('mai:u', {
    dur: 1.6, trig: { stun: 1.5, kb: 380 }, card: { k: '旋風脚', n: 'SENPU-KYAKU' },
    ops: [
      { t: 0, op: 'slow', v: 0.45, d: 0.18 }, { t: 0, op: 'cam', on: 'mid', z: 2.1, y: -118, cut: 1 },
      { t: 0.2, op: 'mv', m: 'ua_round', spd: 1.2, hits: [{ dmg: 3, stun: 1.5, kb: 320, part: 'head' }] },
      { t: 0.62, op: 'mv', m: 'ua_spinKick', spd: 1, hits: [{ dmg: 5, knock: 1, kb: 460, lift: 0.95 }] },
      { t: 0.7, op: 'cam', on: 'mid', z: 2.35, y: -116, cut: 1 }, { t: 0.95, op: 'slow', v: 0.35, d: 0.32 }, { t: 0.98, op: 'fx', k: 'card' },
      { t: 0.98, op: 'cam', on: 'V', z: 2.0, y: -106 },
    ] });



  const sl = (t, v, d) => ({ t, op: 'slow', v, d });
  const cm = (t, on, z, y, cut) => ({ t, op: 'cam', on, z, y, cut: cut ? 1 : 0 });
  const fxo = (t, k, o) => Object.assign({ t, op: 'fx', k }, o || {});
  const mv = (t, m, spd, hits) => ({ t, op: 'mv', m, spd, hits: hits || [] });
  const ps = (t, keys, who) => ({ t, op: 'pose', who: who || 'A', keys });
  const H = (dmg, o) => Object.assign({ dmg, stun: 2, kb: 160 }, o || {});
  const KO = (dmg, o) => Object.assign({ dmg, knock: 1, kb: 420, lift: 1 }, o || {});


  def('aoi:1', { dur: 1.15, trig: { knock: 1, kb: 360, mul: 1.15, lift: 0.7 }, card: { k: '突風', n: 'TOPPU' }, ops: [
    sl(0, 0.32, 0.26), cm(0, 'mid', 2.0, -118, 1), fxo(0, 'ink', { a: 0, len: 0.2 }),
    cm(0.44, 'A', 2.3, -124, 1), ps(0.44, [[0.16, 'ao_hB', 'outQuart'], [0.4, 'ao_hB'], [0.68, '@stance', 'inOut']]), fxo(0.48, 'petals', { n: 10, col: 'rgb(190,225,255)' })] });
  def('aoi:2', { dur: 1.8, trig: { stun: 1.8, kb: 220 }, card: { k: '疾風', n: 'HAYATE' }, ops: [
    sl(0, 0.4, 0.2), cm(0, 'A', 2.1, -118, 1),
    mv(0.22, 'ao_l2', 1, [H(3, { kb: 200 })]), mv(0.5, 'ao_s2', 1, [H(3, { kb: 160 }), KO(4, { kb: 480, lift: 0.8 })]),
    cm(0.62, 'mid', 1.85, -122, 1), sl(0.72, 0.36, 0.38), fxo(0.72, 'ink', { a: -0.1, len: 0.24 }), fxo(0.78, 'card'),
    ps(1.15, [[0.2, 'ao_hB', 'outQuart'], [0.55, '@stance', 'inOut']])] });
  def('aoi:3', { dur: 2.6, trig: { stun: 2.4, kb: 200 }, card: { k: '風の刃', n: 'KAZE NO HA' }, ops: [
    sl(0, 0.4, 0.2), cm(0, 'mid', 2.0, -118, 1),
    mv(0.2, 'ao_s1', 1, [H(2, { kb: 140 }), H(2, { kb: 140 }), H(2, { kb: 200 })]),
    { t: 0.85, op: 'glide', gap: 280, d: 0.3 }, cm(0.88, 'A', 2.35, -120, 1), sl(0.9, 0.5, 0.3), fxo(0.95, 'petals', { n: 12, col: 'rgb(190,225,255)' }),
    mv(1.2, 'sp_aoi', 1), cm(1.42, 'mid', 1.55, -122, 1),
    { t: 1.62, op: 'hit', h: KO(8, { kb: 560, lift: 0.7 }) }, sl(1.62, 0.3, 0.45), fxo(1.62, 'ink', { a: 0.05, len: 0.3, w: 1.2 }), fxo(1.7, 'card')] });
  def('aoi:u', { dur: 1.5, trig: { stun: 1.5, kb: 420 }, card: { k: '突き蹴り', n: 'TSUKI-GERI' }, ops: [
    sl(0, 0.45, 0.16), cm(0, 'A', 2.15, -120, 1),
    mv(0.2, 'ua_lunge', 1.1, [H(3, { stun: 1.5, kb: 360 })]), mv(0.56, 'ua_front', 1, [KO(4, { kb: 480, lift: 0.8 })]),
    cm(0.7, 'V', 2.0, -108, 1), sl(0.8, 0.36, 0.3), fxo(0.84, 'card')] });


  def('kuro:1', { dur: 1.35, trig: { knock: 1, kb: 420, mul: 1.2, lift: 0.9 }, card: { k: '一刀', n: 'ITTO' }, ops: [
    sl(0, 0.28, 0.32), cm(0, 'V', 2.05, -100, 1), fxo(0, 'ink', { a: 0.9, len: 0.24, w: 1.2 }),
    cm(0.5, 'A', 1.9, -100, 1), ps(0.5, [[0.3, 'ks_zanLow', 'inOutSine'], [0.6, 'ks_zanLow'], [0.85, '@stance', 'inOut']]), fxo(0.78, 'thud')] });
  def('kuro:2', { dur: 2.0, trig: { stun: 2, kb: 260 }, card: { k: '岩砕き', n: 'IWA-KUDAKI' }, ops: [
    sl(0, 0.4, 0.2), cm(0, 'mid', 1.85, -112, 1),
    mv(0.24, 'd_kesaL', 1, [H(4, { kb: 220 })]), mv(0.7, 'fk_s2', 1, [KO(6, { kb: 520, lift: 0.8 })]),
    cm(0.82, 'V', 1.95, -100, 1), sl(0.98, 0.32, 0.4), fxo(0.98, 'ink', { a: 0.1, len: 0.26, w: 1.3 }), fxo(0.98, 'thud'), fxo(1.05, 'card')] });
  def('kuro:3', { dur: 2.9, trig: { stun: 2.6, kb: 220 }, card: { k: '山砕き', n: 'YAMA KUDAKI' }, ops: [
    sl(0, 0.4, 0.2), cm(0, 'mid', 1.8, -112, 1),
    mv(0.2, 'fk_s1', 1, [H(3, { kb: 160 }), H(3, { kb: 300 })]),
    { t: 1.0, op: 'glide', gap: 230, d: 0.25 }, cm(1.05, 'A', 1.75, -150, 1), sl(1.25, 0.45, 0.5),
    mv(1.25, 'sp_kuro', 1, [KO(9, { kb: 380, lift: 1.3 })]),
    cm(1.78, 'mid', 1.6, -96, 1), fxo(1.8, 'thud'), fxo(1.8, 'ink', { a: 1.4, len: 0.26, w: 1.4 }), sl(1.8, 0.3, 0.45), fxo(1.86, 'card')] });
  def('kuro:u', { dur: 1.7, trig: { stun: 1.7, kb: 300 }, card: { k: '背負い投げ', n: 'SEOI-NAGE' }, ops: [
    sl(0, 0.45, 0.18), cm(0, 'mid', 2.05, -114, 1),
    mv(0.2, 'ua_ram', 0.9, [H(4, { stun: 1.7, kb: 220 })]), mv(0.78, 'ua_upper', 0.9, [KO(5, { kb: 300, lift: 1.5 })]),
    cm(0.95, 'V', 1.7, -150, 1), sl(1.05, 0.34, 0.35), fxo(1.1, 'card'), fxo(1.4, 'thud')] });


  def('yuki:1', { dur: 1.05, trig: { knock: 1, kb: 330, mul: 1.15, lift: 0.8 }, card: { k: '雪月', n: 'SETSUGETSU' }, ops: [
    sl(0, 0.34, 0.24), cm(0, 'V', 2.2, -110, 1), fxo(0, 'ink', { a: -0.35, len: 0.18 }),
    cm(0.38, 'A', 2.4, -126, 1), ps(0.4, [[0.12, 'ks_zanHi', 'outQuart'], [0.36, 'ks_zanHi'], [0.6, '@stance', 'inOut']]), fxo(0.42, 'petals', { n: 12, col: 'rgb(240,246,255)' })] });
  def('yuki:2', { dur: 1.7, trig: { stun: 1.7, kb: 220 }, card: { k: '狐火', n: 'KITSUNE-BI' }, ops: [
    sl(0, 0.4, 0.18), cm(0, 'A', 2.2, -118, 1),
    mv(0.2, 'fd_fl', 1, [H(3, { kb: 240 })]), mv(0.48, 'fd_s1', 1, [H(3, { kb: 160 }), KO(4, { kb: 460, lift: 1 })]),
    cm(0.56, 'mid', 2.0, -120, 1), sl(0.74, 0.36, 0.36), fxo(0.74, 'ink', { a: -0.7, len: 0.2 }), fxo(0.8, 'card'), fxo(0.8, 'petals', { n: 10, col: 'rgb(255,190,120)' })] });
  def('yuki:3', { dur: 2.3, trig: { stun: 2.2, kb: 200 }, card: { k: '吹雪', n: 'FUBUKI' }, ops: [
    sl(0, 0.45, 0.16), cm(0, 'mid', 2.0, -118, 1),
    mv(0.18, 'fd_fl', 1, [H(3, { kb: 300 })]), cm(0.44, 'A', 2.45, -120, 1), fxo(0.44, 'petals', { n: 16, col: 'rgb(240,246,255)' }),
    mv(0.5, 'sp_yuki', 1, [H(2, { kb: 90 }), H(2, { kb: 90 }), H(2, { kb: 90 }), H(2, { kb: 90 }), KO(4, { kb: 480, lift: 1.1 })]),
    cm(0.82, 'mid', 1.75, -120, 1), sl(0.9, 0.34, 0.45), fxo(0.92, 'ink', { a: -0.4, len: 0.26 }), fxo(0.98, 'card'), fxo(1.0, 'petals', { n: 14, col: 'rgb(240,246,255)' })] });
  def('yuki:u', { dur: 1.5, trig: { stun: 1.5, kb: 380 }, card: { k: '飛び膝', n: 'TOBI-HIZA' }, ops: [
    sl(0, 0.45, 0.16), cm(0, 'mid', 2.1, -118, 1),
    mv(0.18, 'ua_jab', 1.3, [H(2, { stun: 1.5, kb: 300, part: 'head' })]), mv(0.42, 'ua_flyknee', 1, [KO(5, { kb: 460, lift: 1.2 })]),
    cm(0.55, 'V', 1.9, -150, 1), sl(0.7, 0.34, 0.32), fxo(0.75, 'card')] });


  def('hana:1', { dur: 1.1, trig: { knock: 1, kb: 320, mul: 1.15, lift: 0.8 }, card: { k: '桜散', n: 'SAKURA-CHIRI' }, ops: [
    sl(0, 0.32, 0.26), cm(0, 'mid', 2.05, -116, 1), fxo(0, 'ink', { a: 0.5, len: 0.16 }), fxo(0, 'petals', { n: 10 }),
    cm(0.42, 'A', 2.3, -122, 1), ps(0.44, [[0.14, 'ks_chiburi', 'outQuart'], [0.36, 'ks_chiburi'], [0.6, '@stance', 'inOut']]), fxo(0.5, 'petals', { n: 14 })] });
  def('hana:2', { dur: 1.7, trig: { stun: 1.7, kb: 220 }, card: { k: '花三連', n: 'HANA SANREN' }, ops: [
    sl(0, 0.4, 0.18), cm(0, 'A', 2.2, -118, 1),
    mv(0.18, 'ft_fl', 1, [H(3, { kb: 240 })]), mv(0.44, 'ft_s1', 1, [H(3, { kb: 160 }), KO(4, { kb: 460, lift: 0.9 })]),
    fxo(0.5, 'petals', { n: 10 }), cm(0.6, 'mid', 1.95, -120, 1), sl(0.72, 0.36, 0.36), fxo(0.72, 'ink', { a: 0.6, len: 0.2 }), fxo(0.78, 'card')] });
  def('hana:3', { dur: 2.4, trig: { stun: 2.2, kb: 220 }, card: { k: '花吹雪', n: 'HANAFUBUKI' }, ops: [
    sl(0, 0.42, 0.18), cm(0, 'mid', 2.0, -118, 1),
    mv(0.18, 'ft_fl', 1, [H(3, { kb: 300 })]), cm(0.42, 'mid', 1.7, -124, 1), fxo(0.45, 'petals', { n: 18 }),
    mv(0.48, 'sp_hana', 1, [H(2, { kb: 100 }), H(2, { kb: 100 }), H(2, { kb: 100 }), H(2, { kb: 100 }), KO(4, { kb: 480, lift: 1.1 })]),
    sl(1.06, 0.34, 0.45), fxo(1.06, 'ink', { a: 0.3, len: 0.26 }), fxo(1.1, 'card'), fxo(1.12, 'petals', { n: 20 })] });
  def('hana:u', { dur: 1.5, trig: { stun: 1.5, kb: 380 }, card: { k: '回転肘', n: 'KAITEN-HIJI' }, ops: [
    sl(0, 0.45, 0.16), cm(0, 'A', 2.2, -118, 1),
    mv(0.18, 'ua_elbow', 1.2, [H(3, { stun: 1.5, kb: 320 })]), mv(0.5, 'ua_bf', 1, [KO(4, { kb: 460, lift: 0.9 })]),
    cm(0.6, 'mid', 2.0, -116, 1), sl(0.72, 0.36, 0.3), fxo(0.76, 'card'), fxo(0.76, 'petals', { n: 10 })] });


  def('tetsu:1', { dur: 1.3, trig: { knock: 1, kb: 400, mul: 1.2, lift: 0.8 }, card: { k: '鉄壁', n: 'TEPPEKI' }, ops: [
    sl(0, 0.3, 0.3), cm(0, 'mid', 1.75, -104, 1), fxo(0, 'ink', { a: 0.15, len: 0.26, w: 1.2 }),
    cm(0.48, 'A', 1.95, -108, 1), ps(0.5, [[0.22, 'sp_tzEnd', 'outCubic'], [0.5, 'sp_tzEnd'], [0.8, '@stance', 'inOut']]), fxo(0.72, 'thud')] });
  def('tetsu:2', { dur: 1.9, trig: { stun: 1.9, kb: 240 }, card: { k: '薙刀払い', n: 'NAGINATA-BARAI' }, ops: [
    sl(0, 0.4, 0.2), cm(0, 'mid', 1.8, -110, 1),
    mv(0.22, 'fn_fl', 1, [H(4, { kb: 260 })]), mv(0.62, 'fn_bl', 1, [KO(5, { kb: 300, lift: 1.2 })]),
    cm(0.78, 'V', 1.9, -96, 1), sl(0.86, 0.34, 0.4), fxo(0.86, 'ink', { a: 0.05, len: 0.28, w: 1.2 }), fxo(0.92, 'card')] });
  def('tetsu:3', { dur: 2.45, trig: { stun: 2.4, kb: 220 }, card: { k: '鉄の渦', n: 'TETSU NO UZU' }, ops: [
    sl(0, 0.4, 0.16), cm(0, 'mid', 1.75, -112, 1),
    mv(0.18, 'fn_s1', 1, [H(3, { kb: 160 }), H(3, { kb: 280 })]),
    cm(0.82, 'mid', 1.5, -118, 1), mv(0.84, 'sp_tetsu', 1, [H(2, { kb: 120 }), H(2, { kb: 120 }), H(2, { kb: 120 }), H(2, { kb: 120 }), KO(4, { kb: 520, lift: 1 })]),
    sl(1.68, 0.32, 0.36), fxo(1.68, 'ink', { a: -0.1, len: 0.3, w: 1.3 }), fxo(1.72, 'card'), fxo(1.72, 'thud')] });
  def('tetsu:u', { dur: 1.6, trig: { stun: 1.6, kb: 360 }, card: { k: '鉄掌', n: 'TESSHO' }, ops: [
    sl(0, 0.45, 0.18), cm(0, 'mid', 2.0, -112, 1),
    mv(0.2, 'ua_knee', 1, [H(3, { stun: 1.6, kb: 300 })]), mv(0.6, 'ua_cHeavy', 0.9, [KO(5, { kb: 520, lift: 0.8 })]),
    cm(0.72, 'V', 1.9, -108, 1), sl(0.82, 0.34, 0.32), fxo(0.86, 'card'), fxo(0.86, 'thud')] });


  def('ren:1', { dur: 1.2, trig: { knock: 1, kb: 400, mul: 1.15, lift: 1 }, card: { k: '鬼哭', n: 'KIKOKU' }, ops: [
    sl(0, 0.3, 0.26), cm(0, 'V', 2.0, -116, 1), fxo(0, 'ink', { a: -0.6, len: 0.2 }),
    cm(0.46, 'A', 2.25, -130, 1), ps(0.48, [[0.16, 'sp_onA', 'outQuart'], [0.44, 'sp_onA'], [0.7, '@stance', 'inOut']]), fxo(0.52, 'roar')] });
  def('ren:2', { dur: 1.8, trig: { stun: 1.8, kb: 220 }, card: { k: '鬼蹴り', n: 'ONI-GERI' }, ops: [
    sl(0, 0.4, 0.18), cm(0, 'mid', 2.05, -118, 1),
    mv(0.2, 'rn_l2', 1, [H(3, { kb: 220 })]), mv(0.44, 'rn_l3', 1, [H(3, { kb: 220 })]), mv(0.72, 'rn_s2', 1, [KO(4, { kb: 500, lift: 1 })]),
    cm(0.5, 'A', 2.3, -118, 1), cm(0.86, 'mid', 1.9, -122, 1), sl(0.88, 0.36, 0.36), fxo(0.88, 'ink', { a: -0.3, len: 0.2 }), fxo(0.94, 'card')] });
  def('ren:3', { dur: 2.7, trig: { stun: 2.6, kb: 220 }, card: { k: '鬼の怒り', n: 'ONI NO IKARI' }, ops: [
    sl(0, 0.4, 0.2), cm(0, 'mid', 2.0, -118, 1),
    mv(0.2, 'rn_s1', 1, [H(3, { kb: 160 }), H(3, { kb: 320 })]),
    fxo(0.92, 'roar'), cm(0.92, 'A', 2.3, -128, 1), { t: 0.92, op: 'glide', gap: 240, d: 0.22 },
    mv(1.12, 'sp_ren', 1, [KO(9, { kb: 300, lift: 1.5 })]), cm(1.6, 'V', 1.7, -170, 1),
    sl(1.82, 0.32, 0.45), fxo(1.82, 'ink', { a: -1.2, len: 0.26 }), fxo(1.88, 'card')] });
  def('ren:u', { dur: 1.6, trig: { stun: 1.6, kb: 360 }, card: { k: '鉄山靠', n: 'TETSUZAN-KO' }, ops: [
    sl(0, 0.45, 0.16), cm(0, 'mid', 2.05, -116, 1),
    mv(0.18, 'ua_cross', 1.1, [H(3, { stun: 1.6, kb: 300, part: 'head' })]), fxo(0.42, 'roar'), mv(0.46, 'ua_ki', 1, [KO(6, { kb: 560, lift: 0.8 })]),
    cm(0.7, 'V', 1.95, -110, 1), sl(0.8, 0.34, 0.32), fxo(0.84, 'card')] });


  def('kage:1', { dur: 1.2, trig: { knock: 1, kb: 340, mul: 1.15, lift: 0.8 }, card: { k: '影走り', n: 'KAGE-BASHIRI' }, ops: [
    sl(0, 0.32, 0.26), cm(0, 'V', 2.1, -110, 1), fxo(0, 'ink', { a: -0.2, len: 0.2 }), { t: 0.05, op: 'dim', v: 0.4 },
    cm(0.44, 'A', 2.35, -122, 1), ps(0.46, [[0.16, 'sp_kbSeal', 'outQuart'], [0.44, 'sp_kbSeal'], [0.7, '@stance', 'inOut']]), fxo(0.6, 'smoke')] });
  def('kage:2', { dur: 1.8, trig: { stun: 1.8, kb: 220 }, card: { k: '影縫い', n: 'KAGE-NUI' }, ops: [
    sl(0, 0.4, 0.18), cm(0, 'A', 2.15, -118, 1), { t: 0, op: 'dim', v: 0.35 },
    mv(0.18, 'kg_l2', 1, [H(3, { kb: 220 })]), mv(0.42, 'kg_l3', 1, [H(3, { kb: 260 })]), mv(0.76, 'kg_s2', 1, [KO(4, { kb: 460, lift: 0.9 })]),
    cm(0.86, 'mid', 1.95, -118, 1), sl(0.98, 0.36, 0.38), fxo(0.98, 'ink', { a: 0.2, len: 0.22 }), fxo(1.02, 'card')] });
  def('kage:3', { dur: 2.5, trig: { stun: 2.4, kb: 220 }, card: { k: '影分身', n: 'KAGE BUNSHIN' }, ops: [
    sl(0, 0.4, 0.18), cm(0, 'mid', 2.0, -118, 1), { t: 0, op: 'dim', v: 0.45 },
    mv(0.18, 'kg_s1', 1, [H(2, { kb: 140 }), H(2, { kb: 140 }), H(2, { kb: 240 })]),
    fxo(0.84, 'smoke'), mv(0.86, 'sp_kage', 1, [KO(9, { kb: 440, lift: 1 })]), cm(1.0, 'V', 2.1, -116, 1),
    sl(1.32, 0.3, 0.45), fxo(1.32, 'ink', { a: 0.3, len: 0.26 }), fxo(1.38, 'card'), cm(1.6, 'mid', 1.8, -118, 1)] });
  def('kage:u', { dur: 1.5, trig: { stun: 1.5, kb: 300 }, card: { k: '影肘', n: 'KAGE-HIJI' }, ops: [
    sl(0, 0.45, 0.16), cm(0, 'mid', 2.05, -116, 1), { t: 0, op: 'dim', v: 0.4 },
    fxo(0.2, 'smoke'), { t: 0.26, op: 'blink', gap: 110 }, fxo(0.26, 'smoke'), cm(0.26, 'mid', 2.2, -116, 1),
    mv(0.32, 'ua_cSpin', 1, [KO(5, { kb: 440, lift: 0.9 })]),
    sl(0.6, 0.34, 0.32), fxo(0.64, 'card')] });


  def('tora:1', { dur: 1.2, trig: { knock: 1, kb: 360, mul: 1.15, lift: 0.8 }, card: { k: '虎爪', n: 'TORA-ZUME' }, ops: [
    sl(0, 0.32, 0.26), cm(0, 'V', 2.05, -110, 1), fxo(0, 'ink', { a: 0.7, len: 0.2 }),
    cm(0.44, 'A', 2.1, -140, 1), ps(0.46, [[0.16, 'tr_spin', 'inOutSine'], [0.3, 'tr_spin2', 'inOutSine'], [0.44, 'tr_spin', 'inOutSine'], [0.7, '@stance', 'inOut']]), fxo(0.5, 'chain')] });
  def('tora:2', { dur: 1.9, trig: { stun: 1.9, kb: 200 }, card: { k: '鎖縛り', n: 'KUSARI SHIBARI' }, ops: [
    sl(0, 0.4, 0.2), cm(0, 'mid', 1.95, -118, 1),
    mv(0.2, 'tr_l2', 1, [H(3, { kb: 120 })]), fxo(0.3, 'chain'), mv(0.62, 'fc_s2', 1, [KO(5, { kb: 480, lift: 0.9 })]),
    cm(0.7, 'A', 2.2, -118, 1), cm(0.9, 'mid', 1.85, -120, 1), sl(0.92, 0.34, 0.38), fxo(0.92, 'ink', { a: 0.4, len: 0.22 }), fxo(0.98, 'card')] });
  def('tora:3', { dur: 2.6, trig: { stun: 2.6, kb: 220 }, card: { k: '鎖竜巻', n: 'KUSARI TATSUMAKI' }, ops: [
    sl(0, 0.4, 0.2), cm(0, 'mid', 1.95, -118, 1),
    mv(0.2, 'fc_s1', 1, [H(3, { kb: 160 }), H(3, { kb: 260 })]),
    cm(0.84, 'A', 1.7, -150, 1), fxo(0.86, 'chain'),
    mv(0.86, 'sp_tora', 1, [H(2, { kb: 80 }), H(2, { kb: 80 }), H(2, { kb: 80 }), H(2, { kb: 80 }), KO(4, { kb: 420, lift: 1.4 })]),
    cm(1.76, 'V', 1.75, -160, 1), sl(1.91, 0.32, 0.34), fxo(1.91, 'ink', { a: -0.9, len: 0.24 }), fxo(1.96, 'card')] });
  def('tora:u', { dur: 1.5, trig: { stun: 1.5, kb: 340 }, card: { k: '虎足払い', n: 'TORA-BARAI' }, ops: [
    sl(0, 0.45, 0.16), cm(0, 'mid', 2.05, -110, 1),
    mv(0.18, 'ua_jab', 1.3, [H(2, { stun: 1.5, kb: 280, part: 'head' })]), mv(0.42, 'ua_sweep', 1, [KO(4, { kb: 260, lift: 1.3 })]),
    cm(0.56, 'V', 2.0, -96, 1), sl(0.66, 0.34, 0.32), fxo(0.7, 'card')] });


  def('jin:1', { dur: 1.45, trig: { knock: 1, kb: 360, mul: 1.15, lift: 0.9 }, card: { k: '一礼', n: 'ICHIREI' }, ops: [
    sl(0, 0.32, 0.26), cm(0, 'V', 2.0, -108, 1), fxo(0, 'ink', { a: 1.0, len: 0.2 }),
    cm(0.5, 'A', 2.2, -122, 1), ps(0.52, [[0.3, 'jn_bow', 'inOutSine'], [0.66, 'jn_bow'], [0.92, '@stance', 'inOut']])] });
  def('jin:2', { dur: 1.9, trig: { stun: 1.9, kb: 220 }, card: { k: '三節', n: 'SANSETSU' }, ops: [
    sl(0, 0.4, 0.2), cm(0, 'mid', 1.95, -116, 1),
    mv(0.2, 'jn_l2', 1, [H(3, { kb: 240 })]), mv(0.54, 'jn_l3', 1, [KO(5, { kb: 460, lift: 1 })]),
    cm(0.64, 'A', 2.2, -120, 1), sl(0.76, 0.36, 0.36), fxo(0.76, 'ink', { a: 0.9, len: 0.2 }), fxo(0.82, 'card'),
    ps(1.2, [[0.24, 'jn_bow', 'inOutSine'], [0.6, '@stance', 'inOut']])] });
  def('jin:3', { dur: 2.45, trig: { stun: 2.4, kb: 220 }, card: { k: '金剛輪舞', n: 'KONGO RINBU' }, ops: [
    sl(0, 0.4, 0.16), cm(0, 'mid', 1.9, -118, 1),
    mv(0.18, 'fb_s1', 1, [H(3, { kb: 160 }), H(3, { kb: 280 })]),
    cm(0.76, 'mid', 1.6, -120, 1), mv(0.78, 'sp_jin', 1, [H(2, { kb: 110 }), H(2, { kb: 110 }), H(2, { kb: 110 }), H(2, { kb: 110 }), KO(4, { kb: 460, lift: 1.3 })]),
    sl(1.7, 0.32, 0.34), fxo(1.7, 'ink', { a: -1.0, len: 0.24 }), fxo(1.75, 'card'),
    cm(1.9, 'A', 2.1, -122, 1), ps(1.92, [[0.22, 'jn_bow', 'inOutSine'], [0.5, 'jn_bow']])] });
  def('jin:u', { dur: 1.6, trig: { stun: 1.6, kb: 320 }, card: { k: '三連拳', n: 'SANRENKEN' }, ops: [
    sl(0, 0.45, 0.16), cm(0, 'A', 2.1, -118, 1),
    mv(0.2, 'ua_cFin', 0.9, [H(2, { stun: 1.6, kb: 200, part: 'head' }), H(2, { stun: 1.6, kb: 220 }), KO(4, { kb: 460, lift: 1 })]),
    cm(0.5, 'mid', 2.0, -118, 1), sl(0.62, 0.34, 0.32), fxo(0.66, 'card')] });


  def('tsubame:1', { dur: 1.3, trig: { knock: 1, kb: 340, mul: 1.15, lift: 0.8 }, card: { k: '燕翔', n: 'ENSHO' }, ops: [
    sl(0, 0.32, 0.26), cm(0, 'V', 2.05, -110, 1), fxo(0, 'ink', { a: -0.3, len: 0.18 }),
    cm(0.46, 'A', 2.2, -128, 1), ps(0.48, [[0.2, 'ts_aim', 'outCubic'], [0.55, 'ts_aim'], [0.8, '@stance', 'inOut']])] });
  def('tsubame:2', { dur: 1.8, trig: { stun: 1.8, kb: 220 }, card: { k: '疾燕', n: 'SHITSUEN' }, ops: [
    sl(0, 0.4, 0.18), cm(0, 'mid', 2.05, -118, 1),
    mv(0.2, 'fs_fl', 1, [H(3, { kb: 240 })]), mv(0.46, 'fs_s1', 1, [H(3, { kb: 160 }), KO(4, { kb: 460, lift: 1 })]),
    cm(0.56, 'A', 2.25, -124, 1), sl(0.74, 0.36, 0.36), fxo(0.74, 'ink', { a: -0.6, len: 0.2 }), fxo(0.8, 'card')] });
  def('tsubame:3', { dur: 2.6, trig: { stun: 2.6, kb: 220 }, card: { k: '燕返し', n: 'TSUBAME GAESHI' }, ops: [
    sl(0, 0.4, 0.18), cm(0, 'mid', 2.0, -118, 1),
    mv(0.18, 'fs_fl', 1, [H(3, { kb: 300 })]), { t: 0.5, op: 'glide', gap: 300, d: 0.32 }, cm(0.55, 'mid', 1.45, -175, 1),
    mv(0.86, 'sp_tsubame', 1), sl(1.05, 0.4, 0.35),
    { t: 1.52, op: 'hit', h: H(3, { kb: 120 }) }, { t: 1.62, op: 'hit', h: KO(6, { kb: 420, lift: 1.1 }) },
    cm(1.5, 'V', 1.85, -130, 1), sl(1.62, 0.3, 0.42), fxo(1.62, 'ink', { a: 0.2, len: 0.24 }), fxo(1.68, 'card')] });
  def('tsubame:u', { dur: 1.5, trig: { stun: 1.5, kb: 340 }, card: { k: '燕蹴', n: 'TSUBAME-GERI' }, ops: [
    sl(0, 0.45, 0.16), cm(0, 'mid', 2.05, -118, 1),
    mv(0.18, 'ua_knee', 1.1, [H(3, { stun: 1.5, kb: 260 })]), mv(0.5, 'ua_upper', 1, [KO(4, { kb: 260, lift: 1.5 })]),
    cm(0.62, 'V', 1.8, -160, 1), sl(0.72, 0.34, 0.32), fxo(0.76, 'card')] });


  def('shura:1', { dur: 1.3, trig: { knock: 1, kb: 420, mul: 1.2, lift: 0.9 }, card: { k: '修羅', n: 'SHURA' }, ops: [
    sl(0, 0.3, 0.28), cm(0, 'V', 2.0, -108, 1), fxo(0, 'ink', { a: 0.8, len: 0.22, w: 1.2 }),
    cm(0.48, 'A', 2.15, -130, 1), ps(0.5, [[0.18, 'sp_shRoar', 'outQuart'], [0.5, 'sp_shRoar'], [0.78, '@stance', 'inOut']]), fxo(0.54, 'roar'), fxo(0.54, 'smoke', { tone: 'asura' })] });
  def('shura:2', { dur: 1.9, trig: { stun: 1.9, kb: 220 }, card: { k: '羅刹', n: 'RASETSU' }, ops: [
    sl(0, 0.4, 0.2), cm(0, 'mid', 1.95, -116, 1),
    mv(0.2, 'fk_s1', 1, [H(3, { kb: 160 }), H(3, { kb: 280 })]), mv(0.98, 'rn_s2', 1, [KO(4, { kb: 500, lift: 1 })]),
    cm(1.0, 'A', 2.2, -120, 1), sl(1.1, 0.34, 0.38), fxo(1.1, 'ink', { a: 0.4, len: 0.22 }), fxo(1.16, 'card')] });
  def('shura:3', { dur: 3.0, trig: { stun: 2.8, kb: 220 }, card: { k: '阿修羅', n: 'ASHURA RASETSU' }, ops: [
    sl(0, 0.4, 0.2), cm(0, 'mid', 1.95, -118, 1), { t: 0.1, op: 'dim', v: 0.45 },
    mv(0.2, 'fk_dh', 1, [H(4, { kb: 300 })]), fxo(0.72, 'roar'), fxo(0.74, 'smoke', { tone: 'asura' }),
    mv(0.76, 'sp_shura', 1, [H(3, { kb: 120 }), H(3, { kb: 120 }), KO(5, { kb: 480, lift: 1.1 })]),
    cm(1.25, 'V', 2.05, -118, 1), cm(1.65, 'mid', 1.8, -118, 1), cm(2.0, 'V', 1.9, -110, 1),
    sl(2.0, 0.3, 0.42), fxo(2.0, 'ink', { a: -0.5, len: 0.26, w: 1.2 }), fxo(2.06, 'card')] });
  def('shura:u', { dur: 1.6, trig: { stun: 1.6, kb: 320 }, card: { k: '鬼体当', n: 'ONI-TAIATARI' }, ops: [
    sl(0, 0.45, 0.16), cm(0, 'mid', 2.05, -116, 1),
    mv(0.18, 'ua_bf', 1, [H(3, { stun: 1.6, kb: 260 })]), fxo(0.5, 'roar'), mv(0.56, 'ua_ram', 1, [KO(5, { kb: 540, lift: 0.8 })]),
    cm(0.7, 'V', 1.95, -110, 1), sl(0.8, 0.34, 0.32), fxo(0.84, 'card')] });




  const kneel = (t) => ps(t, [[0.22, 'kneel', 'outCubic'], [1.2, 'kneel']], 'V');
  const crown = (id, card, pose, extra) => def(id + ':b', { dur: 1.7, crown: true, card, ops: [
    sl(0, 0.45, 0.25), cm(0, 'mid', 2.1, -112, 1), { t: 0, op: 'glide', gap: 190, d: 0.3 }, kneel(0.05), ps(0.1, pose), fxo(0.9, 'card'), cm(0.85, 'mid', 2.05, -116), ...(extra || [])] });
  crown('akane', { k: '鞘鳴り', n: 'SAYANARI' }, [[0.3, 'chiburi', 'outQuart'], [0.6, 'chiburi'], [1.1, 'ak_stance', 'inOut']], [{ t: 0.8, op: 'sheathe' }, fxo(1.2, 'click')]);
  crown('aoi', { k: '風止み', n: 'KAZE-YAMI' }, [[0.3, 'ao_hB', 'outQuart'], [1.3, 'ao_hB']], [fxo(0.4, 'petals', { n: 8, col: 'rgb(190,225,255)' })]);
  crown('kuro', { k: '山の影', n: 'YAMA NO KAGE' }, [[0.35, 'ks_oRaise', 'outCubic'], [1.3, 'ks_oRaise']], [fxo(0.5, 'thud')]);
  crown('yuki', { k: '雪化粧', n: 'YUKIGESHO' }, [[0.25, 'ks_zanTsuki', 'outQuart'], [1.3, 'ks_zanTsuki']], [fxo(0.3, 'petals', { n: 14, col: 'rgb(240,246,255)' })]);
  crown('hana', { k: '花散らし', n: 'HANA-CHIRASHI' }, [[0.25, 'ks_chiburi', 'outQuart'], [1.3, 'ks_chiburi']], [fxo(0.3, 'petals', { n: 16 })]);
  crown('tetsu', { k: '鉄城', n: 'TETSUJO' }, [[0.35, 'sp_tzEnd', 'outCubic'], [1.3, 'sp_tzEnd']], [fxo(0.5, 'thud')]);
  crown('ren', { k: '鬼笑い', n: 'ONI-WARAI' }, [[0.25, 'sp_onA', 'outQuart'], [1.3, 'sp_onA']], [fxo(0.3, 'roar')]);
  crown('kage', { k: '影法師', n: 'KAGEBOSHI' }, [[0.25, 'sp_kbSeal', 'outQuart'], [1.3, 'sp_kbSeal']], [fxo(0.15, 'smoke'), { t: 0.2, op: 'blink', gap: 120 }, fxo(0.2, 'smoke'), { t: 0.1, op: 'dim', v: 0.45 }]);
  crown('tora', { k: '虎の睨み', n: 'TORA NO NIRAMI' }, [[0.2, 'tr_spin', 'inOutSine'], [0.4, 'tr_spin2', 'inOutSine'], [0.6, 'tr_spin', 'inOutSine'], [0.8, 'tr_spin2', 'inOutSine'], [1.3, 'tr_stance', 'inOut']], [fxo(0.2, 'chain'), fxo(0.7, 'chain')]);
  crown('jin', { k: '合掌', n: 'GASSHO' }, [[0.35, 'jn_bow', 'inOutSine'], [1.3, 'jn_bow']]);
  crown('mai', { k: '扇閉じ', n: 'OGI-TOJI' }, [[0.25, 'mi_hA', 'outQuart'], [0.8, 'mi_hA'], [1.2, 'mi_stance', 'inOut']], [fxo(0.3, 'petals', { n: 12 }), fxo(1.0, 'snap')]);
  crown('tsubame', { k: '残心', n: 'ZANSHIN' }, [[0.3, 'ts_aim', 'outCubic'], [1.3, 'ts_aim']]);
  crown('shura', { k: '阿修羅王', n: 'ASHURA-O' }, [[0.25, 'sp_shRoar', 'outQuart'], [1.3, 'sp_shRoar']], [fxo(0.3, 'roar'), fxo(0.3, 'smoke', { tone: 'asura' })]);


  def('_:any', { dur: 0.9, trig: { knock: 1, kb: 300, mul: 1.1 }, ops: [{ t: 0, op: 'slow', v: 0.35, d: 0.28 }, { t: 0, op: 'cam', on: 'V', z: 2.19, y: -112, cut: 1 }, { t: 0, op: 'fx', k: 'ink', a: -0.2, len: 0.18 }] });
  const scriptKey = (f, tier) => {
    const id = f.ch.id, un = !(f.dz && f.dz.armed);
    const k = un ? id + ':u' : id + ':' + tier;
    if (SC[k]) return k;
    for (let t = tier - 1; !un && t >= 1; t--) if (SC[id + ':' + t]) return id + ':' + t;
    return '_:any';
  };
  D.finKey = scriptKey;








  const setState0 = FP.setState;
  FP.setState = function (s, extra) {
    const z = this.dz;
    const r = setState0.call(this, s, extra);
    if (z && FIN.on && s === 'atk' && !D._finScript && !isFin(z.cine)) {
      const tier = FIN.tierOf(z.chain);
      if (tier > (z.finTier || 0) && !z.cine && z.chainT <= FIN.win) { z.finArm = { serial: this.serial, tier }; stat('armed'); }
      else { z.finArm = null; if (tier > (z.finTier || 0) && z.chainT > FIN.win) stat('late'); }
    }
    return r;
  };


  const takeHit0 = FP.takeHit;
  FP.takeHit = function (raw, a, from, x, y, part, kdir) {
    const V = this, z = V.dz;
    if (!z || D._finHit) return takeHit0.call(this, raw, a, from, x, y, part, kdir);

    if (isFin(z.cine)) return;
    z.finArm = null;
    const A = from, arm = A && A.dz && A.dz.finArm;
    if (arm && A.state === 'atk' && A.serial === arm.serial && canFin(A, V)) {
      A.dz.finArm = null; A.dz.finTier = arm.tier;
      return startFin(A, V, arm.tier, raw, a, x, y, part, kdir);
    }
    if (arm) A.dz.finArm = null;
    return takeHit0.call(this, raw, a, from, x, y, part, kdir);
  };

  const landHit0 = FP.landHit;
  FP.landHit = function (a, part, x, y, kdir) {
    if (this.dz && isFin(this.dz.cine)) { this.hitDone = true; return; }
    return landHit0.call(this, a, part, x, y, kdir);
  };
  function canFin(A, V) {
    return FIN.on && G.phase === 'fight' && !A.dead && !V.dead && A.dz && V.dz && !A.dz.cine && !V.dz.cine && !G.lock &&
      V.state !== 'dbind' && V.state !== 'dseq' && A.state === 'atk' && !(A.atk && A.atk.special);
  }

  function blow(c, h, trig) {
    const A = c.A, V = c.V;
    if (V.dead || A.dead) return;
    const dir = A.x <= V.x ? 1 : -1, kdir = h.back ? -dir : dir;
    const part = h.part || 'body', y = V.y - (part === 'head' ? 150 : 108), x = V.x - dir * 18;
    const kind = trig && trig.kind ? trig.kind : A.state === 'atk' && A.atk ? A.atk.kind || 'blade' : A.dz.armed ? 'blade' : 'kick';
    const a2 = { dmg: 0, post: 0, kb: h.kb || 0, stun: h.stun || 0.5, kind, knock: !!h.knock, lift: h.lift || 1, fin: true, blunt: trig ? trig.blunt : A.state === 'atk' && A.atk ? A.atk.blunt : undefined };


    const dk = G.mode === 'online' || G.mode === 'shadow' ? FIN.dmgK : ND.AI_KNOBS && ND.AI_KNOBS.finDmg > 0 ? ND.AI_KNOBS.finDmg : FIN.dmgK;
    const target = h.raw != null ? null : Math.max(1, Math.round((h.dmg || 0) * dk / 100 * V.maxHp));
    const hp0 = V.hp;
    if (h.fall) {

      const t2 = Math.max(0, Math.round((h.dmg || 0) * dk / 100 * V.maxHp));
      V.hp = Math.max(0, V.hp - t2); V.damageTaken += hp0 - V.hp; V.sinceHit = 0;
      if (V.hp <= 0) { V.die(A, a2, x, y, kdir); return; }
      V.setState('launch', { wallBounced: false }); V.onGround = false;
      V.vy = -300 * (h.lift || 1); V.vx = kdir * (h.kb || 0) * 0.75;
      fx.blood(x, y, kdir, -0.3, 14, 0.9);
      stat('knockdowns');
      return;
    }

    const raw = h.raw != null ? h.raw : Math.max(2, target / ND.dmgScale(a2) / 1.4);
    D._finHit = true;
    try { V.takeHit(raw, a2, A, x, y, part, kdir); } finally { D._finHit = false; }
    if (target != null && !V.dead) {
      const want = Math.max(0, hp0 - target);
      if (V.hp !== want) { V.damageTaken += V.hp - want; V.hp = want; V.ghost = Math.max(V.ghost, hp0); }
      if (V.hp <= 0) V.die(A, a2, x, y, kdir);
    }
    if (h.knock) stat('knockdowns');
  }


  function startFin(A, V, tier, raw, a, x, y, part, kdir) {
    const key = scriptKey(A, tier), S = SC[key];
    const c = { fin: true, tier, key, un: !A.dz.armed, t: 0, i: 0, q: [], A, V, def: A, att: V, done: false, gl: null, cam: null, mvS: -1, skip: false };
    A.dz.cine = V.dz.cine = c;
    A.locked = V.locked = true;
    c.t0 = ND.simClock || 0;
    stat('starts'); stat('tier' + (c.un ? 'U' : tier));

    if (ND.cine) { ND.cine.rings.length = 0; ND.cine.slashes.length = 0; ND.cine.banner = null; }
    V.ghosts.length = 0;
    for (let i = fx.texts.length - 1; i >= 0; i--) fx.texts.splice(i, 1);

    const T = S.trig || {};
    const a1 = Object.assign({}, a, { knock: !!T.knock, launch: false, spike: false, kb: T.kb != null ? T.kb : a.kb, stun: T.stun != null ? T.stun : a.stun, lift: T.lift || a.lift, onHit: undefined });
    D._finHit = true;
    try { V.takeHit(raw * (T.mul || 1), a1, A, x, y, part, kdir); } finally { D._finHit = false; }
    if (V.dead) { endFin(c); return; }
    if (D.finFx) D.finFx('start', c, { x, y });
    step(c, 0);
  }
  D.startFin = startFin;

  function startCrown(A, V) {
    const key = A.ch.id + ':b';
    if (!SC[key] || G.phase !== 'fight' || A.dead || V.dead || A.dz.cine || V.dz.cine || G.lock || A.dz.propT > 0) return false;
    const c = { fin: true, crown: true, tier: 4, key, un: false, t: 0, i: 0, q: [], A, V, def: A, att: V, done: false, gl: null, cam: null, mvS: -1, skip: false };
    A.dz.cine = V.dz.cine = c;
    A.locked = V.locked = true;
    c.t0 = ND.simClock || 0;
    A.dir = V.x >= A.x ? 1 : -1; V.dir = -A.dir; A.vx = V.vx = 0;
    stat('starts'); stat('crown');
    if (D.finFx) D.finFx('start', c, null);
    step(c, 0);
    return true;
  }
  D.startCrown = startCrown;

  const easeOf = (n) => (n && E[n]) || undefined;
  const PK = [];
  function poseKeys(f, keys) {
    PK.length = 0; PK.push([0, f.entry]);
    for (const [t, p, e] of keys) PK.push([t, p[0] === '@' ? f.P[p.slice(1)] || PO.stance : PO[p] || PO.stance, easeOf(e)]);
    return PK;
  }

  function run(c, o) {
    const A = c.A, V = c.V;
    switch (o.op) {
      case 'mv': {
        const a = ATK[o.m];
        if (!a || A.dead) return;
        A.dir = V.x >= A.x ? 1 : -1;
        D._finScript = true;
        try { A.setState('atk', { atk: a, atkName: o.m, keys: [[0, A.entry]].concat(a.keys), aspd: o.spd || 1 }); } finally { D._finScript = false; }
        c.mvS = A.serial;

        const W = a.hits && a.hits.length ? a.hits : a.active ? [a.active] : [];
        const k = (A.ch.spd || 1) * (o.spd || 1);
        (o.hits || []).forEach((h, i) => { if (W[i]) c.q.push({ t: c.t + W[i][0] / k, h }); });
        c.q.sort((p, q) => p.t - q.t);
        return;
      }
      case 'hit': c.q.push({ t: c.t, h: o.h }); c.q.sort((p, q) => p.t - q.t); return;
      case 'pose': {
        const f = o.who === 'V' ? V : A;
        if (f.dead) return;
        D._finScript = true;
        try { f.setState(o.st || 'dfinp', { zp: PO[o.keys[o.keys.length - 1][1]] || f.P.stance, dur: 9 }); } finally { D._finScript = false; }
        f.dz.finKeys = o.keys;
        return;
      }
      case 'blink': {

        const side = A.x <= V.x ? 1 : -1, L = ND.ARENA - 30;
        let nx = V.x + side * (o.gap || 110);
        if (Math.abs(nx) > L) nx = V.x - side * (o.gap || 110);
        A.x = nx; A.vx = 0; A.dir = V.x >= A.x ? 1 : -1;
        return;
      }
      case 'glide': {

        const side = A.x <= V.x ? -1 : 1, d0 = Math.abs(V.x - A.x), need = Math.max(0, o.gap - d0), L = ND.ARENA - 30;
        let ax = A.x + side * need / 2, vx = V.x - side * need / 2;
        if (Math.abs(ax) > L) { vx -= side * (Math.abs(ax) - L); ax = Math.sign(ax) * L; }
        if (Math.abs(vx) > L) { ax += side * (Math.abs(vx) - L); vx = Math.sign(vx) * L; }
        c.gl = { a0: A.x, v0: V.x, a1: ax, v1: vx, t0: c.t, d: o.d };
        return;
      }
      case 'slow': if (!c.skip) { G.slowT = ND.atkSlow ? o.d / ND.atkSlow(A) : o.d; G.slowV = o.v; } return;
      case 'cam':
        c.cam = { on: o.on, z: o.z, y: o.y };

        if (o.cut && !c.skip && D.finFx) D.finFx('cut', c, o);
        return;
      case 'dim': if (!c.skip) G.dim = Math.max(G.dim || 0, o.v); return;
      case 'sheathe': if (A.wpn && A.wpn.iai) A.dz.drawn = false; return;
      case 'draw': A.dz.drawn = true; return;
      case 'fx': if (!c.skip && D.finFx) D.finFx(o.k, c, o); return;
    }
  }
  const camX = D.finCamX = (c, on) => { const A = c.A, V = c.V; return on === 'A' ? A.x * 0.75 + V.x * 0.25 : on === 'V' ? V.x * 0.75 + A.x * 0.25 : (A.x + V.x) / 2; };

  function step(c, dt) {
    if (c.done) return;
    const A = c.A, V = c.V;
    if (G.phase !== 'fight' || A.dead || V.dead) { endFin(c); return; }


    const ck = ND.atkSlow ? ND.atkSlow(A) : 1;
    c.t += ck !== 1 ? dt * ck : dt;
    const S = SC[c.key];
    while (c.i < S.ops.length && S.ops[c.i].t <= c.t + 1e-9) run(c, S.ops[c.i++]);
    while (c.q.length && c.q[0].t <= c.t + 1e-9) { const b = c.q.shift(); blow(c, b.h); if (V.dead) { endFin(c); return; } }

    for (const f of [A, V]) if (f.dz.finKeys && (f.state === 'zanshin' || f.state === 'dfinp')) { pose.seq(poseKeys(f, f.dz.finKeys), ck !== 1 ? f.st * ck : f.st, f.pose); f.vx = 0; }
    if (c.gl) {
      const g = c.gl, u = E.inOutSine(clamp((c.t - g.t0) / Math.max(0.01, g.d), 0, 1));
      A.x = g.a0 + (g.a1 - g.a0) * u; V.x = g.v0 + (g.v1 - g.v0) * u; A.vx = 0; V.vx = 0;
      if (u >= 1) c.gl = null;
    }


    if (!c.gl && !(A.state === 'atk' && A.atk && A.atk.cross) && Math.abs(V.y - A.y) < 120) {
      const d = V.x - A.x, ad = Math.abs(d), MIN = (A.dz.armed ? FIN.gap + Math.max(0, ((A.wpn.blade || 96) + (A.wpn.handle || 24)) - 120) * 0.4 : FIN.gapUa) + (V.state === 'launch' || V.state === 'down' ? FIN.gapDown : 0) + (A.state === 'atk' && A.atk && A.atk.special ? 36 : 0);
      if (ad < MIN) {

        const sd = d === 0 ? A.dir : Math.sign(d), L = ND.ARENA;
        let ax = V.x - sd * MIN;
        if (Math.abs(ax) > L) { V.x += sd * (Math.abs(ax) - L); ax = Math.sign(ax) * L; }
        A.x = ax; if (A.vx * sd > 0) A.vx = 0;
      }
    }

    if (c.cam && !c.skip) {
      const C = c.cam, x = camX(c, C.on);

      G.focus = { x: clamp(x, -ND.ARENA + 260, ND.ARENA - 260), y: C.y || -112, z: C.z || 1.35 };
    }
    if (c.t >= S.dur) endFin(c);
  }
  function endFin(c) {
    if (c.done) return;
    c.done = true;
    const A = c.A, V = c.V;
    if (A.dz && A.dz.cine === c) A.dz.cine = null;
    if (V.dz && V.dz.cine === c) V.dz.cine = null;
    for (const f of [A, V]) {
      if (f.dz) f.dz.finKeys = null;
      if (G.phase === 'fight') f.locked = false;
      const b = f.ctrl && f.ctrl.buf; if (b) for (const k of ['light', 'heavy', 'kick', 'special', 'throw', 'dodge']) if (k in b) b[k] = null;
      if (!f.dead && (f.state === 'zanshin' || f.state === 'dfinp')) f.setState('move');
    }

    if (A.state === 'atk') A.hitDone = true;

    if (G.projs) for (const p of G.projs) if (p.owner === A && !(D.DuelSword && p instanceof D.DuelSword)) p.dead = true;
    if (G.phase === 'fight') { G.focus = null; G.cineT = 0; }
    if (D.finFx) D.finFx('end', c, null);
  }
  D.endFin = endFin;


  const upd0 = FP.update;
  FP.update = function (dt) {
    const z = this.dz, t0 = z ? z.chainT : 0;
    const r = upd0.call(this, dt);
    if (z) {
      const o = this.opp, wait = isFin(z.cine) || (o && (o.state === 'down' || o.state === 'getup' || o.state === 'launch' || o.dead));
      if (wait && z.chainT > t0) z.chainT = t0;
      if (!(z.chain > 0)) z.finTier = 0;

      const bc = z.cine && !z.cine.fin && z.cine.ph ? z.cine : null;
      if (bc && bc.def === this) z.finBind = bc;
      else if (z.finBind && !z.cine) { const b0 = z.finBind; z.finBind = null; if (b0.done && b0.ok && b0.outcome === 'disarm' && FIN.on) startCrown(this, this.opp); }
    }
    const c = z && z.cine;
    if (isFin(c) && c.A === this) step(c, dt);
    return r;
  };

  const passing0 = FP.passing;
  FP.passing = function () { return (this.dz && isFin(this.dz.cine)) || passing0.call(this); };

  const sheathed0 = FP.sheathed;
  FP.sheathed = function () {
    if (this.state === 'dfinp' && this.dz && this.dz.drawn === false && this.wpn && this.wpn.iai) {
      const p = this.pose, q = this.P.stance;
      return Math.abs(p.sw - q.sw) < 0.32 && Math.abs(p.ax - q.ax) + Math.abs(p.ay - q.ay) < 16 ? 1 : 0;
    }
    return sheathed0.call(this);
  };

  const isInv0 = FP.isInv;
  FP.isInv = function () { return (this.dz && isFin(this.dz.cine) && !D._finHit) || isInv0.call(this); };








  FIN.holdMin = 5;
  FIN.bindHold = { 0: 0, 0.5: 0.15, 1: 0.55, 2: 0.9, 3: 0.95 };
  const HQ = (/[?&]finhold=([\d.]+)/.exec(Q) || [])[1];
  const LVS = ND.AI_LEVELS;
  const lvKey = (lv) => {


    if (lv && lv.name) for (const k of ['0', '0.5', '1', '2', '3']) if (LVS && LVS[k] && LVS[k].name === lv.name) return k;

    let best = '1', d = 9;
    for (const k of ['0', '0.5', '1', '2']) { const L = LVS && LVS[k]; if (L && lv && Math.abs((L.parry || 0) - (lv.parry || 0)) < d) { d = Math.abs((L.parry || 0) - (lv.parry || 0)); best = k; } }
    return best;
  };
  const holdP = (lv, id) => {
    if (HQ != null) return +HQ;
    const N = ND.AI_KNOBS || {}, K = N.duelBindPlay, C = N.duelBindPlayCh, k = lvKey(lv);
    if (C && id && C[id] != null) return +C[id];
    if (K && typeof K === 'object') return K[k] != null ? +K[k] : 0;
    return FIN.bindHold[k] || 0;
  };
  FIN.holdP = holdP;
  if (ND.AI) {
    const AP = ND.AI.prototype, aup0 = AP.update;
    AP.update = function (dt) {
      const me = this.me, z = me && me.dz, g = ND.game;
      if (z && FIN.on && z.armed && z.chain >= FIN.holdMin && z.chain < D.T.chainNeed && me.counterUntil > g.clock && me.serial !== this.cTok && me.serial !== this.hTokB &&
        ['block', 'parry', 'guard', 'move'].includes(me.state)) {
        this.hTokB = me.serial;
        if (ND.rng.next() < holdP(this.lv, me.ch && me.ch.id)) {
          this.cTok = me.serial; this.cAt = 0;
          this.guardUntil = Math.max(this.guardUntil || 0, (this.t || 0) + dt + 0.75); this.setHeld('guard', true); this.move = 0;
          stat('holds');
        }
      }
      return aup0.call(this, dt);
    };
  }



  D.finDemo = (tier, who, at) => {
    const g = G; if (!g.F || g.phase !== 'fight') return false;
    const A = g.F.find((f) => f.ch.id === who) || g.F[0], V = A.opp;
    for (const f of g.F) { if (f.dz && f.dz.cine) { f.dz.cine = null; } f.setState('move'); f.vx = f.vy = 0; f.y = 0; f.onGround = true; f.hp = f.maxHp; }
    if (tier === 'u') { if (A.dz.armed) D.disarm(A, V, -A.dir, 'break'); }
    else if (!A.dz.armed) D.rearm(A, true);
    { const c0 = typeof at === 'number' ? Math.max(-ND.ARENA + 70, Math.min(ND.ARENA - 70, at)) : 0; A.x = c0 - 60; V.x = c0 + 60; } A.dir = 1; V.dir = -1;
    { const sw = D.swordOf && D.swordOf(A); if (sw && sw.resting() && Math.abs(sw.x - A.x) < 260) { sw.x = A.x - 320; sw.vx = 0; } }
    const m = A.dz.armed ? (A.wpn.iai ? 'ak_dKesa' : 'd_kesaR') : 'ua_jab';
    const a = ATK[m] || ATK.light1;
    A.setState('atk', { atk: a, atkName: m, keys: [[0, A.entry]].concat(a.keys) });
    const W = a.hits && a.hits.length ? a.hits[0] : a.active || [0.1, 0.2];
    A.st = W[0]; A.dz.drawn = true;
    A.dz.finArm = null;
    startFin(A, V, tier === 'u' ? 1 : +tier, a.dmg * A.ch.dmg, a, V.x - 20, V.y - 110, 'body', 1);
    return true;
  };
})(window.ND);
