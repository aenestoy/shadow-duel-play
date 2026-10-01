// B (detailed): the fighters as real 3D models (branch claude/sd-3d test page only; never in the game).
// Models: uc-boyut-test/model/<id>.sd3d, built by tools/fighter3d/build.py (Blender; MakeHuman CC0 body, clothes,
// hair, katana and scabbard from code in the game's palette). Each frame the bones are placed on the 3D skeleton of
// js/depth25.js (ND.depth25.pose3d, the fight's own time), so the strike times exactly like NOW and A.
// Look: toon shading (three tones from the drawn palette), gloss band, cool rim light, dark ink outline (inverted
// hull), soft contact shadows; the stage is the 2D panels' own drawing.
// Secondary motion (ponytail, ribbon tails, sleeves, hakama hems) is a small spring per bone stepped with the fight
// (tick(), 120 steps a second), so a replay or a seek always looks the same.
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

const V3 = THREE.Vector3, Q4 = THREE.Quaternion, M4 = THREE.Matrix4;
const Y = new V3(0, 1, 0);
const _v = new V3(), _w = new V3(), _m = new M4(), _m2 = new M4(), _q = new Q4(), _s = new V3();

// ------------------------------------------------------------ file
async function loadModel(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url + ': ' + res.status);
  let buf = await res.arrayBuffer();
  const u8 = new Uint8Array(buf);
  if (u8[0] === 0x1f && u8[1] === 0x8b) {
    if (typeof DecompressionStream === 'undefined') throw new Error('this browser cannot unpack the model');
    buf = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  }
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x44334453) throw new Error('not a model file');
  const jl = dv.getUint32(4, true);
  const H = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, jl)));
  const base = 8 + jl;
  const meshes = {};
  for (const name in H.meshes) {
    const h = H.meshes[name], n = h.count;
    const g = new THREE.BufferGeometry();
    const q = new Uint16Array(buf.slice(base + h.pos, base + h.pos + n * 6));
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) pos[i] = h.lo[i % 3] + q[i] * h.sc[i % 3];
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const nb = new Int8Array(buf.slice(base + h.nrm, base + h.nrm + n * 4));
    const ib = new THREE.InterleavedBuffer(nb, 4);
    g.setAttribute('normal', new THREE.InterleavedBufferAttribute(ib, 3, 0, true));
    g.setAttribute('ink', new THREE.InterleavedBufferAttribute(ib, 1, 3, true));
    g.setAttribute('col', new THREE.BufferAttribute(new Uint8Array(buf.slice(base + h.col, base + h.col + n * 4)), 4, true));
    if (h.skinned) {
      g.setAttribute('skinIndex', new THREE.BufferAttribute(new Uint8Array(buf.slice(base + h.si, base + h.si + n * 4)), 4));
      g.setAttribute('skinWeight', new THREE.BufferAttribute(new Uint8Array(buf.slice(base + h.sw, base + h.sw + n * 4)), 4, true));
    }
    const tot = h.groups.reduce((s, x) => Math.max(s, x.start + x.count), 0);
    const idx = new Uint16Array(buf.slice(base + h.idx, base + h.idx + tot * 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    for (const gr of h.groups) g.addGroup(gr.start, gr.count, MATS.indexOf(gr.mat));
    // the outline (inverted hull) draws the same triangles in one call (no groups)
    const hg = new THREE.BufferGeometry();
    for (const k in g.attributes) hg.setAttribute(k, g.attributes[k]);
    hg.setIndex(g.index);
    g.computeBoundingSphere(); hg.boundingSphere = g.boundingSphere;
    meshes[name] = { g, hg, skinned: h.skinned, tris: tot / 3 };
  }
  return { bones: H.bones, meshes, extra: H.extra, bytes: u8.length };
}

// ------------------------------------------------------------ materials
const MATS = ['cloth', 'gloss', 'skin', 'hair', 'metal', 'flat'];
const MAT_P = { // tones: lit, mid, shadow multipliers of the drawn base colour; spec: gloss band; rim: rim light
  cloth: { tone: [1.08, 0.97, 0.78], spec: 0.2, rim: 1 },
  gloss: { tone: [1.08, 0.95, 0.7], spec: 0.55, rim: 1 },
  skin: { tone: [1.04, 0.98, 0.84], spec: 0, rim: 0.6 },
  hair: { tone: [1.0, 0.92, 0.72], spec: 0.3, rim: 1 },
  metal: { tone: [1.18, 0.95, 0.68], spec: 1.6, rim: 1.2 },
  flat: { tone: [1, 1, 1], spec: 0, rim: 0, flat: 1 },
};
const VS = /* glsl */`
#include <common>
#include <skinning_pars_vertex>
attribute vec4 col;
attribute float ink;
uniform float uInk;
varying vec3 vN; varying vec3 vV; varying vec4 vC;
void main() {
  #include <skinbase_vertex>
  #include <beginnormal_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
#ifdef HULL
  transformed += normalize(objectNormal) * uInk * ink;
#endif
  vec4 mv = modelViewMatrix * vec4(transformed, 1.0);
  vN = normalize(normalMatrix * objectNormal);
  vV = -mv.xyz; vC = col;
  gl_Position = projectionMatrix * mv;
}`;
const FS = /* glsl */`
uniform vec3 uL; uniform vec3 uRimDir; uniform vec3 uRimC; uniform vec3 uTone; uniform float uSpec; uniform float uRim; uniform float uFlat;
varying vec3 vN; varying vec3 vV; varying vec4 vC;
void main() {
  vec3 base = vC.rgb;
  if (uFlat > 0.5) { gl_FragColor = vec4(base, 1.0); return; }
  vec3 n = normalize(vN); vec3 v = normalize(vV);
  bool back = !gl_FrontFacing;
  if (back) n = -n;
  float d = dot(n, uL);
  float t = mix(uTone.z, uTone.y, smoothstep(-0.16, -0.08, d));
  t = mix(t, uTone.x, smoothstep(0.38, 0.46, d));
  vec3 c = base * t;
  vec3 h = normalize(uL + v);
  float sp = smoothstep(0.945, 0.962, dot(n, h)) * uSpec;
  c += sp * (base * 0.55 + vec3(0.13));
  float fr = 1.0 - max(dot(n, v), 0.0);
  float rim = smoothstep(0.7, 0.84, fr) * smoothstep(0.0, 0.5, dot(n, uRimDir)) * uRim;
  c = mix(c, uRimC, rim * 0.45);
  if (back) c *= 0.45;
  gl_FragColor = vec4(c, 1.0);
}`;
const HFS = /* glsl */`uniform vec3 uInkC; void main() { gl_FragColor = vec4(uInkC, 1.0); }`;

const rgb = (h) => { const n = parseInt(h.slice(1), 16); return new V3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };

// ------------------------------------------------------------ a fighter instance
class Fig {
  constructor(M, data, f) {
    this.M = M; this.f = f; this.data = data;
    this.root = new THREE.Group(); // fighter placement: x and the mirror for dir < 0
    this.root.matrixAutoUpdate = false;
    const B = data.bones;
    this.B = B.map((b) => {
      const R = new THREE.Matrix3().fromArray(b.R), m = new M4().setFromMatrix3(R);
      const q0 = new Q4().setFromRotationMatrix(m), p0 = new V3().fromArray(b.head), t0 = new V3().fromArray(b.tail);
      return { name: b.name, parent: b.parent, q0, p0, len: t0.distanceTo(p0), q: q0.clone(), p: p0.clone(), s: 1, done: false };
    });
    this.ix = {}; this.B.forEach((b, i) => (this.ix[b.name] = i));
    this.bones = this.B.map((b) => { const o = new THREE.Bone(); o.matrixAutoUpdate = false; this.root.add(o); o.matrix.compose(b.p0, b.q0, _s.set(1, 1, 1)); return o; });
    const inv = this.B.map((b) => new M4().compose(b.p0, b.q0, new V3(1, 1, 1)).invert());
    this.skel = new THREE.Skeleton(this.bones, inv);
    const bm = data.meshes.body;
    this.body = new THREE.SkinnedMesh(bm.g, M.mats);
    this.hull = new THREE.SkinnedMesh(bm.hg, M.hullMat(data.extra.ink || '#2a2622'));
    for (const m of [this.body, this.hull]) { m.frustumCulled = false; this.root.add(m); m.bind(this.skel, new M4()); }
    // static parts: hilt, blade, scabbard (their own frames)
    this.stat = {};
    for (const k of ['hilt', 'blade', 'saya']) {
      const sm = data.meshes[k]; if (!sm) continue;
      const g = new THREE.Group(); g.matrixAutoUpdate = false;
      const a = new THREE.Mesh(sm.g, M.mats), b2 = new THREE.Mesh(sm.hg, this.hull.material);
      a.frustumCulled = b2.frustumCulled = false;
      g.add(a); g.add(b2); this.root.add(g); this.stat[k] = g;
    }
    // springs: [{bone, k, damp, grav, coll}]
    this.springs = (data.extra.springs || []).map((s) => ({ ...s, i: this.ix[s.bone], P: new V3(), Pp: new V3(), init: false }));
    const ex = data.extra;
    this.grip = {};
    for (const s of ['R', 'L']) { const g = ex.grip[s]; this.grip[s] = { c: new V3().fromArray(g.c), a: new V3().fromArray(g.a), p: new V3().fromArray(g.p) }; }
    this.hc0 = new V3().fromArray(ex.headCenter);
    // rest quantities used by the solver
    const P0 = (n) => this.B[this.ix[n]].p0;
    this.W0 = P0('hips').clone();
    this.spineLen = P0('neck').distanceTo(this.W0);
    this.armRest = {};
    for (const s of ['R', 'L']) {
      const sh = P0('upper.' + s), el = P0('fore.' + s), wr = P0('hand.' + s);
      this.armRest[s] = { l1: el.distanceTo(sh), l2: wr.distanceTo(el), out: new V3().subVectors(el, new V3().addVectors(sh, wr).multiplyScalar(0.5)).normalize() };
    }
    this.shadow = [];
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(M.shadowGeo, M.shadowMat.clone()); m.rotation.x = -Math.PI / 2; m.renderOrder = -1; M.scene.add(m); this.shadow.push(m); }
    M.scene.add(this.root);
    this.dirty = true;
  }
  bone(n) { return this.B[this.ix[n]]; }
  // place bone n: head p, world rotation = R * q0, y-scale s
  setR(n, p, R, s = 1) { const b = this.bone(n); b.p.copy(p); b.q.copy(R).multiply(b.q0); b.s = s; b.R = R.clone(); return b; }
  // aim bone n from head to tail; rest reference ref0 maps to ref1 (both world, will be orthogonalised)
  aim(n, head, tail, ref0, ref1, stretch = true) {
    const b = this.bone(n), d0 = _v.set(0, 1, 0).applyQuaternion(b.q0).clone(), d1 = new V3().subVectors(tail, head);
    const L = d1.length(); d1.multiplyScalar(1 / (L || 1));
    const R = basisQ(d1, ref1).multiply(basisQ(d0, ref0).invert());
    return this.setR(n, head, R, stretch ? L / b.len : 1);
  }
  mat(b) { return _m.compose(b.p, b.q, _s.set(1, b.s, 1)); }
  // a rest point carried by bone b's current transform (with its stretch)
  carry(b, p0, out = new V3()) { return out.copy(p0).sub(b.p0).applyQuaternion(_q.copy(b.q0).invert()).multiply(_s.set(1, b.s, 1)).applyQuaternion(b.q).add(b.p); }
}

// rotation whose basis is (x from ref ⟂ y, y, z)
function basisQ(y, ref) {
  const yy = y.clone().normalize();
  const x = ref.clone().addScaledVector(yy, -ref.dot(yy));
  if (x.lengthSq() < 1e-8) x.set(1, 0, 0).addScaledVector(yy, -yy.x);
  x.normalize();
  const z = new V3().crossVectors(x, yy);
  return new Q4().setFromRotationMatrix(new M4().makeBasis(x, yy, z));
}
function ik2(s, t, l1, l2, pole) {
  const d = new V3().subVectors(t, s); let L = d.length();
  const max = (l1 + l2) * 0.999;
  if (L > max) { d.multiplyScalar(max / L); L = max; }
  L = Math.max(L, 1e-3);
  const u = d.clone().multiplyScalar(1 / L);
  const a = (l1 * l1 - l2 * l2 + L * L) / (2 * L), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const p = pole.clone().addScaledVector(u, -pole.dot(u)); if (p.lengthSq() < 1e-8) p.set(0, -1, 0); p.normalize();
  return { e: s.clone().addScaledVector(u, a).addScaledVector(p, h), w: s.clone().add(d) };
}

export class Model3DHD {
  static async create(canvas, ND, opt = {}) {
    const m = new Model3DHD(canvas, ND, opt);
    const ids = opt.ids || ['akane', 'kuro'];
    const base = opt.base || new URL('./model/', import.meta.url).href;
    const t0 = performance.now();
    const res = await Promise.all(ids.map((id) => loadModel(base + id + '.sd3d')));
    m.loadMs = performance.now() - t0;
    ids.forEach((id, i) => (m.models[id] = res[i]));
    m.bytes = res.reduce((s, r) => s + r.bytes, 0);
    return m;
  }
  constructor(canvas, ND, opt) {
    this.ND = ND; this.D = ND.depth25; this.models = {}; this.figs = new Map();
    const r = (this.r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: !!opt.preserve, powerPreference: 'high-performance' }));
    r.setPixelRatio(1);
    r.outputColorSpace = THREE.LinearSRGBColorSpace; // the palette is used as is (drawn sRGB colours)
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(30, 1, 20, 5000);
    // stage: the 2D panels' drawing as the background
    this.bgc = document.createElement('canvas');
    this.bgt = new THREE.CanvasTexture(this.bgc);
    this.scene.background = this.bgt;
    const L = new V3(0.45, 0.75, 0.8).normalize(); // the drawn key light (upper right), turned a little toward the camera
    this.U = {
      uL: { value: L.clone() }, uRimDir: { value: new V3(0.6, 0.8, 0).normalize() }, uRimC: { value: rgb('#a8b4dc') },
      uInk: { value: 1.3 },
    };
    this.Lw = L;
    this.mats = MATS.map((k) => {
      const p = MAT_P[k];
      return new THREE.ShaderMaterial({
        vertexShader: VS, fragmentShader: FS, side: THREE.DoubleSide,
        uniforms: { ...this.U, uTone: { value: new V3(...p.tone) }, uSpec: { value: p.spec }, uRim: { value: p.rim }, uFlat: { value: p.flat || 0 } },
      });
    });
    this.inks = {};
    // contact shadow
    const sc = document.createElement('canvas'); sc.width = sc.height = 64;
    const sx = sc.getContext('2d'), sg = sx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sg.addColorStop(0, 'rgba(0,0,0,.55)'); sg.addColorStop(0.55, 'rgba(0,0,0,.28)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    sx.fillStyle = sg; sx.fillRect(0, 0, 64, 64);
    this.shadowGeo = new THREE.PlaneGeometry(1, 1);
    this.shadowMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false });
    this.trails = new Map();
  }
  hullMat(col) {
    if (this.inks[col]) return this.inks[col];
    return (this.inks[col] = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: HFS, side: THREE.BackSide, defines: { HULL: 1 }, uniforms: { uInk: this.U.uInk, uInkC: { value: rgb(col) } } }));
  }
  fig(f) {
    let F = this.figs.get(f);
    if (F) return F;
    const data = this.models[f.ch.id];
    if (!data) return null;
    F = new Fig(this, data, f);
    this.figs.set(f, F);
    return F;
  }
  get tris() { let n = 0; for (const id in this.models) for (const k in this.models[id].meshes) n += this.models[id].meshes[k].tris; return n; }

  // ---------------------------------------------------------- pose from the fight
  solve(F) {
    const f = F.f, S = this.D.pose3d(f, true);
    if (!S) return false;
    F.S = S;
    const L = (p, out = new V3()) => out.set(p.x, -p.y, p.z);
    const P = S.P;
    const hip = L(P.hip), neck = L(P.neck);
    const vy = new V3().subVectors(neck, hip); const sl = vy.length(); vy.normalize();
    const fx = new V3(1, 0, 0).addScaledVector(vy, -vy.x).normalize();
    const tq = (k) => { const x = fx.clone().applyAxisAngle(vy, -S.psi * k); return basisQ(vy, x); };
    const sc = sl / F.spineLen;
    // torso: hips (pelvis turns 55 % of the chest), spine (80 %), chest
    const Rh = tq(0.55), Rs = tq(0.8), Rc = tq(1);
    const restRel = (n, from) => new V3().subVectors(F.bone(n).p0, from);
    const scaled = (v) => { v.y *= sc; return v; };
    const bh = F.setR('hips', hip, Rh, sc);
    const sp = hip.clone().add(scaled(restRel('spine', F.W0)).applyQuaternion(Rh));
    F.setR('spine', sp, Rs, sc);
    const ch = sp.clone().add(scaled(restRel('chest', F.bone('spine').p0)).applyQuaternion(Rs));
    const bc = F.setR('chest', ch, Rc, sc);
    // head: rigid round the game's head centre; up from the drawn head angle, face toward the opponent
    const j = f.viewJ(), dir = f.dir < 0 ? -1 : 1;
    const hu = new V3(Math.cos(j.hang) * dir, -Math.sin(j.hang), 0).normalize();
    const hf = new V3(hu.y, -hu.x, 0).applyAxisAngle(hu, -S.psi * 0.25);
    const Rhd = basisQ(hu, hf);
    const Hc = L(P.head);
    const headP = Hc.clone().add(new V3().subVectors(F.bone('head').p0, F.hc0).applyQuaternion(Rhd));
    F.setR('head', headP, Rhd, 1);
    const nk = F.carry(bc, F.bone('neck').p0);
    F.aim('neck', nk, headP, new V3(1, 0, 0), fx.clone().applyAxisAngle(vy, -S.psi * 0.6).lerp(hf, 0.5));
    // arms
    const b = S.blade, u = new V3(b.u.x, -b.u.y, b.u.z).normalize(), e = new V3(b.e.x, -b.e.y, b.e.z).normalize(), H = L(b.h);
    F.H = H; F.u = u; F.e = e;
    for (const s of ['R', 'L']) {
      F.setR('clav.' + s, F.carry(bc, F.bone('clav.' + s).p0), Rc, 1);
      const sh = F.carry(bc, F.bone('upper.' + s).p0);
      const gp = F.grip[s], ar = F.armRest[s];
      const front = s === 'R';
      let Rhand, G;
      const gripQ = () => basisQ(u, e).multiply(basisQ(gp.a, gp.p).invert());
      if (front) { Rhand = gripQ(); G = H.clone().addScaledVector(u, -4.6); }
      else {
        const hb = L(P.haB);
        const along = new V3().subVectors(hb, H).dot(u), off = new V3().subVectors(hb, H).addScaledVector(u, -along).length();
        const handle = (f.wpn || {}).handle || 24;
        if (j.hasSword && off < 8 && along < 0 && along > -handle - 4) {
          Rhand = gripQ(); G = H.clone().addScaledVector(u, -Math.min(handle - 5, Math.max(13.8, -along)));
        } else {
          // free hand: wrist straight along the forearm from the drawn elbow
          const el = L(P.elB), fd = new V3().subVectors(hb, el).normalize();
          const out = new V3().subVectors(el, new V3().addVectors(sh, hb).multiplyScalar(0.5));
          const fd0 = new V3().subVectors(F.bone('hand.' + s).p0, F.bone('fore.' + s).p0).normalize();
          Rhand = basisQ(fd, out).multiply(basisQ(fd0, ar.out).invert());
          G = hb;
        }
      }
      const hbn = F.bone('hand.' + s);
      const wr = G.clone().add(new V3().subVectors(hbn.p0, gp.c).applyQuaternion(Rhand));
      const pole = new V3().subVectors(L(front ? P.elF : P.elB), new V3().addVectors(sh, wr).multiplyScalar(0.5));
      const k = 1.1, sol = ik2(sh, wr, ar.l1 * k, ar.l2 * k, pole);
      const mid = new V3().addVectors(sh, sol.w).multiplyScalar(0.5), out1 = new V3().subVectors(sol.e, mid);
      if (out1.lengthSq() < 1) out1.copy(pole);
      const sh0 = F.bone('upper.' + s).p0, wr0 = hbn.p0;
      F.aim('upper.' + s, sh, sol.e, ar.out, out1);
      F.aim('fore.' + s, sol.e, sol.w, ar.out, out1);
      F.setR('hand.' + s, sol.w, Rhand, 1);
      void sh0; void wr0;
    }
    // legs: knees and feet from the drawing, spread like a standing body
    for (const s of ['R', 'L']) {
      const front = s === 'R', sg = front ? 1 : -1;
      const so = F.carry(bh, F.bone('thigh.' + s).p0);
      const kn = L(front ? P.knF : P.knB); kn.z = sg * 11;
      const ft = L(front ? P.ftF : P.ftB); ft.z = sg * 13;
      const a0 = F.bone('foot.' + s).p0;
      const an = ft.clone(); an.y += a0.y;
      const mid = new V3().addVectors(so, an).multiplyScalar(0.5), kf = new V3().subVectors(kn, mid);
      if (kf.lengthSq() < 1) kf.copy(fx);
      F.aim('thigh.' + s, so, kn, new V3(1, 0, 0), kf);
      F.aim('shin.' + s, kn, an, new V3(1, 0, 0), kf);
      F.setR('foot.' + s, an, new Q4(), 1);
    }
    // anything else (secondary bones) follows its parent rigidly; springs bend it afterwards
    for (const bb of F.B) bb.done = false;
    for (const n of ['hips', 'spine', 'chest', 'neck', 'head', 'clav.R', 'clav.L', 'upper.R', 'upper.L', 'fore.R', 'fore.L', 'hand.R', 'hand.L', 'thigh.R', 'thigh.L', 'shin.R', 'shin.L', 'foot.R', 'foot.L']) F.bone(n).done = true;
    for (const bb of F.B) this.follow(F, bb);
    return true;
  }
  follow(F, b) {
    if (b.done) return;
    const pb = F.bone(b.parent);
    this.follow(F, pb);
    const R = pb.R || new Q4().multiplyQuaternions(pb.q, _q.copy(pb.q0).invert());
    F.setR(b.name, F.carry(pb, b.p0), R, 1);
    b.done = true;
  }
  // springs: one step (dt = 1/120 s) in world space
  springs(F, dt) {
    const f = F.f, dir = f.dir < 0 ? -1 : 1, ox = f.x;
    const toW = (p, o) => o.set(ox + p.x * dir, p.y, p.z), toL = (p, o) => o.set((p.x - ox) * dir, p.y, p.z);
    for (const sp of F.springs) {
      const b = F.B[sp.i];
      // rest-follow pose of this bone under its (already sprung) parent
      const pb = F.bone(b.parent);
      const R = pb.R || new Q4();
      const head = F.carry(pb, b.p0);
      const Rf = R.clone();
      const qf = Rf.clone().multiply(b.q0);
      const tailL = new V3(0, b.len, 0).applyQuaternion(qf).add(head);
      const T = toW(tailL, new V3()), Hw = toW(head, new V3());
      if (!sp.init) { sp.P.copy(T); sp.Pp.copy(T); sp.init = true; }
      const vel = new V3().subVectors(sp.P, sp.Pp).multiplyScalar(sp.damp);
      const acc = new V3(0, -sp.grav, 0).addScaledVector(new V3().subVectors(T, sp.P), sp.k);
      sp.Pp.copy(sp.P);
      sp.P.add(vel).addScaledVector(acc, dt * dt);
      // keep the length, and keep within maxAng of the rest-follow direction
      const d = new V3().subVectors(sp.P, Hw), dl = d.length() || 1;
      d.multiplyScalar(1 / dl);
      const dr = new V3().subVectors(T, Hw).normalize();
      const ang = d.angleTo(dr), mx = sp.max || 1.2;
      if (ang > mx) { const ax = new V3().crossVectors(dr, d).normalize(); if (ax.lengthSq() > 0) d.copy(dr).applyAxisAngle(ax, mx); }
      sp.P.copy(Hw).addScaledVector(d, b.len);
      // collision spheres (local): push out
      if (sp.coll) {
        const pl = toL(sp.P, new V3());
        for (const c of this.colliders(F)) {
          const dd = new V3().subVectors(pl, c.c), l = dd.length();
          if (l < c.r) { pl.copy(c.c).addScaledVector(dd.normalize(), c.r); }
        }
        toW(pl, sp.P);
      }
      const tl = toL(sp.P, new V3());
      F.aim(b.name, head, tl, new V3(1, 0, 0).applyQuaternion(b.q0), new V3(1, 0, 0).applyQuaternion(qf), false);
      // children of a sprung bone follow it
      for (const c of F.B) if (c.parent === b.name && !F.springs.some((s) => s.i === F.ix[c.name])) { c.done = false; this.follow(F, c); }
    }
  }
  colliders(F) {
    const out = [];
    const hd = F.bone('head'), ch = F.bone('chest'), sp = F.bone('spine'), hp = F.bone('hips');
    out.push({ c: F.carry(hd, F.hc0), r: 11.5 });
    out.push({ c: F.carry(ch, new V3().lerpVectors(ch.p0, F.bone('neck').p0, 0.45).add(new V3(-3, 0, 0))), r: 13 });
    out.push({ c: F.carry(sp, sp.p0.clone().add(new V3(-2, 0, 0))), r: 12.5 });
    out.push({ c: F.carry(hp, hp.p0.clone().add(new V3(-2, -4, 0))), r: 13 });
    return out;
  }
  // ---------------------------------------------------------- per fight step / per picture
  reset() { for (const F of this.figs.values()) for (const s of F.springs) s.init = false; }
  tick(Fs) {
    for (const f of Fs) {
      const F = this.fig(f); if (!F) continue;
      if (!this.solve(F)) continue;
      this.springs(F, 1 / 120);
      F.ready = true;
    }
  }
  place(F) {
    const f = F.f, dir = f.dir < 0 ? -1 : 1, S = F.S;
    F.root.matrix.makeScale(dir, 1, 1).setPosition(f.x, 0, 0);
    F.root.matrixWorldNeedsUpdate = true;
    F.root.visible = !f.hidden;
    F.B.forEach((b, i) => { F.bones[i].matrix.copy(F.mat(b)); F.bones[i].matrixWorldNeedsUpdate = true; });
    // katana and scabbard
    const u = F.u, e = F.e, H = F.H, z = new V3().crossVectors(e, u);
    if (F.stat.hilt) { const m = F.stat.hilt.matrix.makeBasis(e, u, z).setPosition(H); F.stat.hilt.matrixWorldNeedsUpdate = true; if (F.stat.blade) { F.stat.blade.matrix.copy(m); F.stat.blade.matrixWorldNeedsUpdate = true; F.stat.blade.visible = !S.sheathed; } }
    if (F.stat.saya && f.wpn && f.wpn.iai) {
      const sy = this.D.sayaPose(f, S), a = new V3(sy.a.x, -sy.a.y, sy.a.z), su = new V3(sy.u.x, -sy.u.y, sy.u.z).normalize();
      const x = S.sheathed ? e.clone() : new V3(0, 1, 0);
      x.addScaledVector(su, -x.dot(su)).normalize();
      F.stat.saya.matrix.makeBasis(x, su, new V3().crossVectors(x, su)).setPosition(a);
      F.stat.saya.matrixWorldNeedsUpdate = true;
    }
    // contact shadows: under both feet and the hips
    const pts = [F.bone('foot.R').p, F.bone('foot.L').p, F.bone('hips').p];
    pts.forEach((p, i) => {
      const m = F.shadow[i], h = Math.max(0, p.y - (i < 2 ? 7 : 80));
      m.position.set(f.x + p.x * dir + (i < 2 ? 5 * dir : 0), 0.15 + i * 0.02, p.z);
      const sz = i < 2 ? 30 : 80;
      m.scale.set(sz * (1 + h * 0.01), sz * (i < 2 ? 0.45 : 0.32), 1);
      m.material.opacity = (i < 2 ? 0.9 : 0.7) * Math.max(0, 1 - h / 60);
      m.visible = !f.hidden;
    });
  }
  trail(f, F) {
    let T = this.trails.get(f);
    if (!T) {
      const tg = new THREE.BufferGeometry();
      tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(26 * 2 * 3), 3));
      tg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(26 * 2 * 3), 3));
      const idx = []; for (let i = 0; i < 25; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      tg.setIndex(idx);
      T = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      T.frustumCulled = false; this.scene.add(T); this.trails.set(f, T);
    }
    const dir = f.dir < 0 ? -1 : 1, W3 = (p, o) => o.set(f.x + p.x * dir, -p.y, p.z);
    this.D.sampleTrail(f, F.S);
    const S = this.D.trail(f), pos = T.geometry.attributes.position, col = T.geometry.attributes.color, n = Math.min(S.length, 26);
    for (let i = 0; i < 26; i++) {
      const s = S[Math.max(0, Math.min(n - 1, i - (26 - n)))], k = n ? Math.max(0, (i - (26 - n)) / n) : 0;
      if (!s) { pos.setXYZ(i * 2, 0, -9999, 0); pos.setXYZ(i * 2 + 1, 0, -9999, 0); continue; }
      W3(s.b, _v); W3(s.p, _w);
      pos.setXYZ(i * 2, _v.x, _v.y, _v.z); pos.setXYZ(i * 2 + 1, _w.x, _w.y, _w.z);
      const a = k * 0.55;
      col.setXYZ(i * 2, 0.78 * a * 0.5, 0.86 * a * 0.5, a * 0.5); col.setXYZ(i * 2 + 1, 0.9 * a, 0.95 * a, a);
    }
    pos.needsUpdate = col.needsUpdate = true;
    T.visible = n > 1;
  }
  render(Fs, v, kick, stage) {
    const { w, h, s, cx, fy } = v;
    if (this._w !== w || this._h !== h) { this.r.setSize(w, h, false); this._w = w; this._h = h; }
    // background: the panels' stage, redrawn only when the view moves
    const key = `${w}x${h}:${cx.toFixed(2)}:${s.toFixed(4)}`;
    if (key !== this._bgk && stage) {
      this._bgk = key; this.bgc.width = w; this.bgc.height = h;
      stage(this.bgc.getContext('2d'), v); this.bgt.needsUpdate = true;
    }
    for (const f of Fs) {
      const F = this.fig(f); if (!F) continue;
      if (!F.ready) { this.solve(F); F.ready = true; }
      this.place(F); this.trail(f, F);
    }
    const dist = this.D.cam, zoom = kick ? kick.zoom : 1;
    const visH = h / s, yc = (h / 2 - fy) / s;
    this.cam.aspect = w / h;
    this.cam.fov = (2 * Math.atan(visH / 2 / dist) * 180) / Math.PI / zoom;
    const ox = kick ? (kick.sx / s) * 1.2 : 0, oy = kick ? (kick.sy / s) * 1.2 : 0;
    const [a] = Fs, px = zoom !== 1 ? (a.x + 30 - cx) * (1 - 1 / zoom) : 0;
    this.cam.position.set(cx + px - ox, -yc + oy, dist);
    this.cam.lookAt(cx + px - ox, -yc + oy, 0);
    if (this.debugCam) { // inspection only (tools): {p: [x,y,z], t: [x,y,z], fov}
      const d = this.debugCam; this.cam.position.fromArray(d.p); this.cam.lookAt(new V3().fromArray(d.t)); this.cam.fov = d.fov || 20;
      this.scene.background = d.bg ? this.bgt : new THREE.Color(0x30343f);
    } else this.scene.background = this.bgt;
    this.cam.updateProjectionMatrix();
    this.cam.updateMatrixWorld();
    // lights in view space; outline ~1.3 game units like the drawn ink line
    this.U.uL.value.copy(this.Lw).transformDirection(this.cam.matrixWorldInverse);
    this.U.uRimDir.value.set(0.75, 0.55, 0).normalize().transformDirection(this.cam.matrixWorldInverse);
    // outline: like the drawn stroke (1.3 units outside) on small pictures, never thicker than ~2 px on big ones
    const ppu = h / (2 * this.cam.position.distanceTo(new V3(this.cam.position.x, this.cam.position.y, 0)) * Math.tan((this.cam.fov * Math.PI) / 360));
    this.U.uInk.value = 2 * Math.min(1.3, 2.0 / ppu); // (the ink attribute is the part's factor / 2)
    this.r.render(this.scene, this.cam);
  }
  sync() { const gl = this.r.getContext(), px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
}
