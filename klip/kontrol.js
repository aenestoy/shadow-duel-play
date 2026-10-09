// The cloth check for the gallery's Akane (tools/klip-galeri/kumas/check.mjs drives it, headless): every frame of a
// clip, the drawn mesh skinned here on the CPU exactly as the shader does it, then
//   stretch   each triangle edge of the cloth against its rest length (over 1.6 = a tear / a sheet, under 0.5 = a
//             spike's fold) - edges under 2 mm left out, and an edge counts only when it is also 1.5 cm longer /
//             1 cm shorter than at rest (a 3 mm edge at 3x is not something one sees);
//   seam      corners that sit together at rest (the file splits them along its painting seams) pulled apart;
//   inside    cloth corners inside the body capsules (thighs, shins, hips, torso, arms, head), deeper than at rest;
//   floor     hakama / sleeve corners under the floor.
// "where": hakama / sleeve / hair, and for 'inside' which capsule.
import * as THREE from 'three';
import { bodyCapsules, updateCapsules, capDist } from './cloth.js';

export const PART = ['body', 'hakama', 'sleeve', 'hair', 'headhair'];
// (which capsules each cloth is checked against: the skirt against the legs, the sleeves against everything but their
// own upper arm, the ponytail against the head, neck, torso and upper arms)
const CHECK_CAPS = {
  1: ['LeftThigh', 'RightThigh', 'LeftShin', 'RightShin'],
  2: ['Torso', 'Chest', 'Head', 'Hips', 'LeftThigh', 'RightThigh', 'LeftUpperArm', 'RightUpperArm', 'LeftForeArm', 'RightForeArm'],
  3: ['Head', 'Neck', 'Torso', 'Chest', 'LeftUpperArm', 'RightUpperArm'],
};

export class ClothCheck {
  constructor(A, CFG) {
    this.A = A;
    const sk = A.body, G = sk.geometry, n = G.attributes.position.count;
    this.n = n; this.reg = G.attributes._region ? G.attributes._region.array : new Uint8Array(n);
    this.RA = A.restPos.find((r) => r.m === sk).a;
    const RA = this.RA, reg = this.reg;
    // corners at the same rest place: one representative each
    const key = new Map(), rep = new Int32Array(n);
    for (let i = 0; i < n; i++) { const k = Math.round(RA[i * 3] * 2e4) + ',' + Math.round(RA[i * 3 + 1] * 2e4) + ',' + Math.round(RA[i * 3 + 2] * 2e4); let r = key.get(k); if (r === undefined) { r = i; key.set(k, i); } rep[i] = r; }
    this.rep = rep; this.uniq = [...key.values()];
    // the triangle edges with cloth on them (non-indexed: corners 3t, 3t+1, 3t+2)
    const E = [];
    for (let t = 0; t < n / 3; t++) for (let e = 0; e < 3; e++) {
      const a = t * 3 + e, b = t * 3 + ((e + 1) % 3), ra = reg[a], rb = reg[b], r = ra >= 1 && ra <= 3 ? ra : rb >= 1 && rb <= 3 ? rb : 0;
      if (!r) continue;
      const L = Math.hypot(RA[a * 3] - RA[b * 3], RA[a * 3 + 1] - RA[b * 3 + 1], RA[a * 3 + 2] - RA[b * 3 + 2]);
      if (L < 0.002) continue;
      E.push(a, b, r, L);
    }
    this.E = Float64Array.from(E);
    this.caps = bodyCapsules(A.bones, CFG.capsules); this.capBy = Object.fromEntries(this.caps.map((c) => [c.name, c]));
    this.clothU = this.uniq.filter((i) => reg[i] >= 1 && reg[i] <= 3);
    this.W = new Float32Array(n * 3);
  }
  // each cloth corner's depth in its capsules at rest (only deeper than that counts), measured at the bind pose
  rest() {
    const A = this.A, save = Object.entries(A.bones).map(([, b]) => [b, b.quaternion.clone(), b.position.clone()]);
    for (const [n, b] of Object.entries(A.bones)) if (A.rest[n]) { b.quaternion.copy(A.rest[n].q); b.position.copy(A.rest[n].p); }
    A.root.updateMatrixWorld(true); updateCapsules(this.caps);
    const P = this.RA, v = new THREE.Vector3(), q = new THREE.Vector3(), lift = A.root.position.y;
    this.d0 = new Map();
    for (const i of this.clothU) {
      const L = CHECK_CAPS[this.reg[i]]; if (!L) continue;
      v.set(P[i * 3], P[i * 3 + 1] + lift, P[i * 3 + 2]);
      this.d0.set(i, L.map((cn) => { const c = this.capBy[cn]; return c ? c.r - capDist(c, v, q) : -1; }));
    }
    for (const [b, qq, pp] of save) { b.quaternion.copy(qq); b.position.copy(pp); }
    A.root.updateMatrixWorld(true);
  }
  skin() {
    const sk = this.A.body, G = sk.geometry, n = this.n, Pb = G.attributes.position.array, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight;
    sk.skeleton.update();
    const bm = sk.skeleton.boneMatrices, nb = sk.skeleton.bones.length, M = new Float32Array(nb * 16), t = new THREE.Matrix4(), w = new THREE.Matrix4();
    const pre = new THREE.Matrix4().multiplyMatrices(sk.matrixWorld, sk.bindMatrixInverse);
    for (let k = 0; k < nb; k++) { t.fromArray(bm, k * 16); w.multiplyMatrices(pre, t).multiply(sk.bindMatrix); w.toArray(M, k * 16); }
    const out = this.W, si = SI.array, sw = SW.array, wn = SW.normalized ? 1 / 255 : 1;
    for (let i = 0; i < n; i++) {
      const x = Pb[i * 3], y = Pb[i * 3 + 1], z = Pb[i * 3 + 2]; let X = 0, Y = 0, Z = 0;
      for (let c = 0; c < 4; c++) {
        const ww = sw[i * 4 + c] * wn; if (!ww) continue;
        const o = si[i * 4 + c] * 16;
        X += ww * (M[o] * x + M[o + 4] * y + M[o + 8] * z + M[o + 12]); Y += ww * (M[o + 1] * x + M[o + 5] * y + M[o + 9] * z + M[o + 13]); Z += ww * (M[o + 2] * x + M[o + 6] * y + M[o + 10] * z + M[o + 14]);
      }
      out[i * 3] = X; out[i * 3 + 1] = Y; out[i * 3 + 2] = Z;
    }
    return out;
  }
  measure() {
    const W = this.skin(), E = this.E, r = { s: 1, sMin: 1, sR: 0, sP: null, sMinR: 0, nHi: 0, nLo: 0, ext: 0, shr: 0, gap: 0, gapR: 0, pen: 0, penR: 0, penC: '', floor: 0, floorR: 0 };
    for (let k = 0; k < E.length; k += 4) {
      const a = E[k], b = E[k + 1], L = Math.hypot(W[a * 3] - W[b * 3], W[a * 3 + 1] - W[b * 3 + 1], W[a * 3 + 2] - W[b * 3 + 2]) / E[k + 3];
      const ext = (L - 1) * E[k + 3];
      if (ext > -0.01 && ext < 0.015) continue; // (under 1.5 cm longer / 1 cm shorter: not something one sees)
      if (L > 1.6) { r.nHi++; if (ext > r.ext) r.ext = ext; }
      if (L < 0.5) { r.nLo++; if (-ext > r.shr) r.shr = -ext; }
      if (L > r.s) { r.s = L; r.sR = E[k + 2]; r.sP = [W[a * 3], W[a * 3 + 1], W[a * 3 + 2]].map((x) => +x.toFixed(3)); }
      if (L < r.sMin) { r.sMin = L; r.sMinR = E[k + 2]; }
    }
    for (let i = 0; i < this.n; i++) {
      const j = this.rep[i]; if (j === i || this.reg[i] !== this.reg[j]) continue; // (cloth parted from the body on purpose is not a seam)
      const d = Math.hypot(W[i * 3] - W[j * 3], W[i * 3 + 1] - W[j * 3 + 1], W[i * 3 + 2] - W[j * 3 + 2]);
      if (d > r.gap) { r.gap = d; r.gapR = this.reg[i]; }
    }
    updateCapsules(this.caps);
    const v = new THREE.Vector3(), q = new THREE.Vector3();
    for (const i of this.clothU) {
      const rg = this.reg[i];
      if ((rg === 1 || rg === 2) && -W[i * 3 + 1] > r.floor) { r.floor = -W[i * 3 + 1]; r.floorR = rg; }
      const L = CHECK_CAPS[rg], d0 = this.d0.get(i); if (!L) continue;
      v.set(W[i * 3], W[i * 3 + 1], W[i * 3 + 2]);
      const own = rg === 2 ? (this.RA[i * 3] > 0 ? 'Left' : 'Right') : null;
      for (let k = 0; k < L.length; k++) {
        // (a sleeve against its own arm: the arm is inside its sleeve, that is no fault)
        if (own && L[k].startsWith(own) && /Arm$/.test(L[k])) continue;
        const c = this.capBy[L[k]]; if (!c) continue;
        const d = c.r - capDist(c, v, q) - Math.max(0, d0[k]);
        if (d > r.pen) { r.pen = d; r.penR = rg; r.penC = L[k]; }
      }
    }
    return r;
  }
}

// one clip, every frame: `pose(f)` puts the model (and the cloth) at frame f
export function checkClip(ck, clip, on, pose, cloth) {
  ck.rest();
  const n = clip.frames, fr = [], t0 = performance.now();
  const c0 = cloth ? cloth.cost : 0, s0 = cloth ? cloth.steps : 0;
  for (let f = 0; f < n; f++) { pose(f); fr.push(ck.measure()); }
  const worst = (k) => { let b = 0; fr.forEach((x, i) => { if (x[k] > fr[b][k]) b = i; }); return b; };
  const fs = worst('s'), fl = fr.reduce((b, x, i) => (x.sMin < fr[b].sMin ? i : b), 0), fp = worst('pen'), ff = worst('floor'), fg = worst('gap');
  return {
    id: clip.id, cloth: on, frames: n, ms: Math.round(performance.now() - t0),
    physics: cloth && on ? { steps: cloth.steps - s0, msPerStep: +((cloth.cost - c0) / Math.max(1, cloth.steps - s0)).toFixed(4) } : null,
    stretch: { max: +fr[fs].s.toFixed(3), frame: fs, where: PART[fr[fs].sR], at: fr[fs].sP, edgesOver: fr[fs].nHi },
    squash: { min: +fr[fl].sMin.toFixed(3), frame: fl, where: PART[fr[fl].sMinR], edgesUnder: fr[fl].nLo },
    framesFlagged: fr.filter((x) => x.nHi + x.nLo > 0).length,
    inside: { depth: +fr[fp].pen.toFixed(3), frame: fp, where: PART[fr[fp].penR], capsule: fr[fp].penC },
    floor: { depth: +fr[ff].floor.toFixed(3), frame: ff, where: PART[fr[ff].floorR] },
    seam: { gap: +fr[fg].gap.toFixed(4), frame: fg, where: PART[fr[fg].gapR] },
    // (per frame: stretch, squash, edges over, edges under, inside, floor, seam, the longest stretch past the limit in m, the most shortening in m)
    perFrame: fr.map((x) => [+x.s.toFixed(2), +x.sMin.toFixed(2), x.nHi, x.nLo, +x.pen.toFixed(3), +x.floor.toFixed(3), +x.gap.toFixed(4), +x.ext.toFixed(3), +x.shr.toFixed(3)]),
  };
}

// (a look at the worst edges of the current frame: both corners' part, rest place and their bones)
export function worstEdges(ck, k = 12, minExt = 0.015) {
  const W = ck.skin(), E = ck.E, out = [];
  const G = ck.A.body.geometry, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight, names = ck.A.body.skeleton.bones.map((b) => b.name);
  for (let i = 0; i < E.length; i += 4) {
    const a = E[i], b = E[i + 1], L = Math.hypot(W[a * 3] - W[b * 3], W[a * 3 + 1] - W[b * 3 + 1], W[a * 3 + 2] - W[b * 3 + 2]);
    if (L - E[i + 3] > minExt) out.push([L / E[i + 3], a, b, L - E[i + 3]]);
  }
  out.sort((x, y) => y[0] - x[0]);
  const info = (v) => ({ reg: PART[ck.reg[v]], rest: [0, 1, 2].map((c) => +ck.RA[v * 3 + c].toFixed(3)), w: [0, 1, 2, 3].map((c) => names[SI.getComponent(v, c)] + ':' + SW.getComponent(v, c).toFixed(2)).join(' ') });
  return { n: out.length, top: out.slice(0, k).map(([r, a, b, ext]) => ({ ratio: +r.toFixed(1), ext: +ext.toFixed(3), a: info(a), b: info(b) })) };
}

// (a look at the current frame's worst seam openings and deepest cloth corners in the body)
export function worstOther(ck, k = 6) {
  const W = ck.skin(), G = ck.A.body.geometry, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight, names = ck.A.body.skeleton.bones.map((b) => b.name);
  const info = (v) => ({ reg: PART[ck.reg[v]], rest: [0, 1, 2].map((c) => +ck.RA[v * 3 + c].toFixed(3)), w: [0, 1, 2, 3].map((c) => names[SI.getComponent(v, c)] + ':' + SW.getComponent(v, c).toFixed(2)).join(' ') });
  const seams = [];
  for (let i = 0; i < ck.n; i++) { const j = ck.rep[i]; if (j === i || ck.reg[i] !== ck.reg[j]) continue; const d = Math.hypot(W[i * 3] - W[j * 3], W[i * 3 + 1] - W[j * 3 + 1], W[i * 3 + 2] - W[j * 3 + 2]); if (d > 0.01) seams.push([d, i, j]); }
  seams.sort((a, b) => b[0] - a[0]);
  return { seams: seams.length, top: seams.slice(0, k).map(([d, i, j]) => ({ d: +d.toFixed(3), a: info(i), b: info(j) })) };
}

// (the current frame's most squashed edges and deepest corners in the body capsules)
export function worstSquash(ck, k = 6) {
  const W = ck.skin(), E = ck.E, G = ck.A.body.geometry, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight, names = ck.A.body.skeleton.bones.map((b) => b.name);
  const info = (v) => ({ reg: PART[ck.reg[v]], rest: [0, 1, 2].map((c) => +ck.RA[v * 3 + c].toFixed(3)), w: [0, 1, 2, 3].map((c) => names[SI.getComponent(v, c)] + ':' + SW.getComponent(v, c).toFixed(2)).join(' ') });
  const sq = [];
  for (let i = 0; i < E.length; i += 4) { const a = E[i], b = E[i + 1], L = Math.hypot(W[a * 3] - W[b * 3], W[a * 3 + 1] - W[b * 3 + 1], W[a * 3 + 2] - W[b * 3 + 2]); if (E[i + 3] - L > 0.01 && L / E[i + 3] < 0.5) sq.push([L / E[i + 3], a, b, E[i + 3]]); }
  sq.sort((x, y) => x[0] - y[0]);
  updateCapsules(ck.caps);
  const v = new THREE.Vector3(), q = new THREE.Vector3(), pen = [];
  for (const i of ck.clothU) {
    const rg = ck.reg[i], L = CHECK_CAPS[rg], d0 = ck.d0 && ck.d0.get(i); if (!L || !d0) continue;
    v.set(W[i * 3], W[i * 3 + 1], W[i * 3 + 2]);
    const own = rg === 2 ? (ck.RA[i * 3] > 0 ? 'Left' : 'Right') : null;
    for (let kk = 0; kk < L.length; kk++) { if (own && L[kk].startsWith(own) && /Arm$/.test(L[kk])) continue; const c = ck.capBy[L[kk]]; const d = c.r - capDist(c, v, q) - Math.max(0, d0[kk]); if (d > 0.03) pen.push([d, i, L[kk]]); }
  }
  pen.sort((a, b) => b[0] - a[0]);
  return { squash: sq.length, sq: sq.slice(0, k).map(([r, a, b, L]) => ({ r: +r.toFixed(2), rest: +L.toFixed(3), a: info(a), b: info(b) })), inside: pen.length, pen: pen.slice(0, k).map(([d, i, c]) => ({ d: +d.toFixed(3), cap: c, v: info(i) })) };
}
