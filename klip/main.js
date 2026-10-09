// Mixamo clip gallery (tools/klip-galeri): every downloaded Mixamo clip played on the simple 3D Akane (50k level,
// our free rig: 22 Mixamo-named bones, A-pose rest). Clips come from klipler.json (mixamo_dump.py + pack.mjs): per
// bone, per frame, the bone's world rotation relative to Mixamo's T-pose rest, and the hip positions.
// Retarget (per clip, per model): each target bone is first turned from its own rest direction onto Mixamo's rest
// direction for that bone (shortest turn: Akane's A-pose arms swing up to the T-pose about the forward axis, no twist),
// then gets Mixamo's world rotation from the rest; local rotations follow from the parents. Hips: Mixamo's hip motion
// scaled by the hip-height ratio. X Bot (the pack's own character) takes the same data, for comparison.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const Q = new URLSearchParams(location.search);
const REC = Q.get('rec') === '1', DBG = Q.get('dbg') || '';
if (REC) document.body.classList.add('rec');
const $ = (id) => document.getElementById(id);
const CHILD = { Hips: 'Spine', Spine: 'Spine1', Spine1: 'Spine2', Spine2: 'Neck', Neck: 'Head', Head: 'HeadTop_End' };
for (const s of ['Left', 'Right']) Object.assign(CHILD, { [s + 'Shoulder']: s + 'Arm', [s + 'Arm']: s + 'ForeArm', [s + 'ForeArm']: s + 'Hand', [s + 'Hand']: s + 'HandMiddle1', [s + 'UpLeg']: s + 'Leg', [s + 'Leg']: s + 'Foot', [s + 'Foot']: s + 'ToeBase', [s + 'ToeBase']: s + 'Toe_End' });

// ---- scene
const view = $('view');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: REC });
renderer.setPixelRatio(REC ? 1 : Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
view.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb9bcc0);
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = !REC; controls.target.set(0, 0.95, 0);
scene.add(new THREE.HemisphereLight(0xf2f2f0, 0x6d6a66, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 1.5);
key.position.set(-2.5, 4.5, 3); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 15 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
scene.add(key, key.target);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ color: 0xd8d6d1 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const lines = new THREE.GridHelper(60, 60, 0xc4c2bc, 0xc9c7c1); lines.position.y = 0.001; scene.add(lines);

function resize() {
  const w = REC ? 1280 : view.clientWidth, h = REC ? 720 : view.clientHeight;
  renderer.setSize(w, h, !REC); camera.aspect = w / h; camera.updateProjectionMatrix();
  if (REC) { renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px'; }
}
addEventListener('resize', resize);

// ---- a simple katana (ours, after the game's: curved blade with a diamond section, round guard, wrapped handle);
// built with the blade along +Z, the edge toward -Y, the grip's centre at the origin
function katana() {
  const g = new THREE.Group(), steel = new THREE.MeshLambertMaterial({ color: 0xd9dde2 }), dark = new THREE.MeshLambertMaterial({ color: 0x24201d }), gold = new THREE.MeshLambertMaterial({ color: 0x8a7444 });
  const L = 0.72, N = 16, P = [], I = [];
  for (let i = 0; i <= N; i++) {
    const q = i / N, z = 0.14 + q * L, sori = 0.022 * q * q, w = 0.016 * (1 - Math.pow(q, 8) * 0.9), t = 0.0045 * (1 - q * 0.5);
    P.push(0, sori - w, z, t, sori + w * 0.15, z, 0, sori + w, z, -t, sori + w * 0.15, z);
  }
  P.push(0, 0.022 + 0.004, 0.14 + L + 0.03);
  for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) { const a = i * 4 + k, b = i * 4 + ((k + 1) % 4); I.push(a, b, a + 4, b, b + 4, a + 4); }
  const tip = (N + 1) * 4; for (let k = 0; k < 4; k++) I.push(N * 4 + k, N * 4 + ((k + 1) % 4), tip);
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setIndex(I);
  const blade = new THREE.Mesh(bg.toNonIndexed(), steel); blade.geometry.computeVertexNormals(); blade.material.side = THREE.DoubleSide;
  const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.008, 20), gold); guard.rotation.x = Math.PI / 2; guard.position.z = 0.135;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.016, 0.27, 10), dark); grip.rotation.x = Math.PI / 2; grip.position.z = 0.0;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.012, 10), gold); cap.rotation.x = Math.PI / 2; cap.position.z = -0.14;
  for (const m of [blade, guard, grip, cap]) { m.castShadow = true; g.add(m); }
  return g;
}

// ---- models
const loader = new GLTFLoader();
function boneMap(root) {
  const m = {};
  root.traverse((o) => { if (o.isBone) m[o.name.replace(/^mixamorig\d*:?/, '')] = o; });
  return m;
}
// the skinned meshes' corners where they really are in the rest pose (the file's positions are quantised into a unit box;
// the skin's bind matrices carry the real size)
function restPositions(root) {
  root.updateMatrixWorld(true);
  const out = [];
  root.traverse((m) => {
    if (!m.isSkinnedMesh) return;
    m.skeleton.update();
    const P = m.geometry.attributes.position, a = new Float32Array(P.count * 3), v = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); m.applyBoneTransform(i, v); v.applyMatrix4(m.matrixWorld); a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z; }
    out.push({ m, a });
  });
  return out;
}
function prepModel(root, bones) {
  root.updateMatrixWorld(true);
  const T = { root, bones, W0: {}, dir0: {}, rest: {}, hipsParent: bones.Hips.parent };
  const v = new THREE.Vector3();
  for (const [n, b] of Object.entries(bones)) {
    T.W0[n] = b.getWorldQuaternion(new THREE.Quaternion());
    T.rest[n] = { q: b.quaternion.clone(), p: b.position.clone() };
    b.getWorldPosition(v);
    const c = bones[CHILD[n]];
    if (c) T.dir0[n] = c.getWorldPosition(new THREE.Vector3()).sub(v).normalize();
    else T.dir0[n] = new THREE.Vector3(0, 1, 0).applyQuaternion(T.W0[n]).normalize();
  }
  T.hips0 = bones.Hips.getWorldPosition(new THREE.Vector3());
  T.P0 = {}; for (const [n, b] of Object.entries(bones)) T.P0[n] = b.getWorldPosition(new THREE.Vector3());
  const RP = restPositions(root);
  T.floor = Math.min(...RP.map(({ a }) => { let mn = 1e9; for (let i = 1; i < a.length; i += 3) mn = Math.min(mn, a[i]); return mn; }));
  // (each foot's sole: its heel, its two sides and its toe tip, in the foot bone's frame - Akane's sandals are long, ~3x Mixamo's foot)
  T.sole = {};
  for (const sd of ['Left', 'Right']) {
    const fb = bones[sd + 'Foot']; if (!fb) continue;
    const names = new Set([sd + 'Foot', sd + 'ToeBase', sd + 'Toe_End']);
    let heel = null, tip = null, inS = null, outS = null;
    for (const { m, a } of RP) {
      const SI = m.geometry.attributes.skinIndex, SW = m.geometry.attributes.skinWeight;
      for (let i = 0; i < a.length / 3; i++) {
        let w = 0; for (let c = 0; c < 4; c++) if (names.has(m.skeleton.bones[SI.getComponent(i, c)].name.replace(/^mixamorig\d*:?/, ''))) w += SW.getComponent(i, c);
        if (w < 0.8 || a[i * 3 + 1] > T.floor + 0.05) continue;
        const z = a[i * 3 + 2];
        if (!heel || z < heel.z) heel = new THREE.Vector3(a[i * 3], a[i * 3 + 1], z);
        if (!tip || z > tip.z) tip = new THREE.Vector3(a[i * 3], a[i * 3 + 1], z);
        const x = a[i * 3];
        if (!inS || x < inS.x) inS = new THREE.Vector3(x, a[i * 3 + 1], z);
        if (!outS || x > outS.x) outS = new THREE.Vector3(x, a[i * 3 + 1], z);
      }
    }
    const P0 = fb.getWorldPosition(new THREE.Vector3()), qi = fb.getWorldQuaternion(new THREE.Quaternion()).invert();
    T.sole[sd] = [heel, inS, outS, tip].filter(Boolean).map((p) => ({ off: p.clone().sub(P0).applyQuaternion(qi), y0: p.y }));
  }
  T.restPos = RP;
  // (the grip: the middle of the right hand's own corners, in the hand bone's frame - Akane's hands are big, the bone
  // sits at the wrist)
  {
    const hb = bones.RightHand, sum = new THREE.Vector3(); let k = 0;
    for (const { m, a } of RP) {
      const SI = m.geometry.attributes.skinIndex, SW = m.geometry.attributes.skinWeight, hi = m.skeleton.bones.indexOf(hb);
      for (let i = 0; i < a.length / 3; i++) { let w = 0; for (let c = 0; c < 4; c++) if (SI.getComponent(i, c) === hi) w += SW.getComponent(i, c); if (w > 0.8) { sum.x += a[i * 3]; sum.y += a[i * 3 + 1]; sum.z += a[i * 3 + 2]; k++; } }
    }
    const P0 = hb.getWorldPosition(new THREE.Vector3());
    T.grip = k ? sum.divideScalar(k).sub(P0) : null; // (model space, from the wrist)
  }
  T.parentQ = T.hipsParent.getWorldQuaternion(new THREE.Quaternion());
  T.parentInv = T.hipsParent.matrixWorld.clone().invert();
  T.handScale = bones.RightHand.getWorldScale(new THREE.Vector3()).x;
  T.par = {}; for (const [n, b] of Object.entries(bones)) T.par[n] = n === 'Hips' ? null : Object.keys(bones).find((x) => bones[x] === b.parent) || null;
  // (stand on the floor: the rest pose's lowest point at y 0)
  // (each bone's rest offset from its parent, in the parent's frame: forward kinematics for the floor check)
  T.off = {}; for (const n of Object.keys(bones)) if (T.par[n]) T.off[n] = T.P0[n].clone().sub(T.P0[T.par[n]]).applyQuaternion(T.W0[T.par[n]].clone().invert());
  root.position.y = -T.floor; root.updateMatrixWorld(true);
  return T;
}

// the game's hakama fix (js/r3d.js, ucbweb): below the crotch the hakama's skin shares both legs, so a kick stretched it
// into a sheet from the hip to the foot; there the two sides' shares are sharpened (cubed, renormalised), fading in
// over 12 cm below a line 6 cm under the hip joints
function hakamaFix(sk, RA) {
  const bones = sk.skeleton.bones, side = new Int8Array(bones.length);
  bones.forEach((b, i) => { const m = /^(Left|Right)(UpLeg|Leg|Foot|ToeBase)$/.exec(b.name); if (m) side[i] = m[1] === 'Left' ? -1 : 1; });
  sk.updateMatrixWorld(true);
  const lift = sk.parent ? new THREE.Vector3().setFromMatrixPosition(sk.matrixWorld).y : 0; // (the root's lift onto the floor; RA was taken before it)
  const yOf = (n) => bones.find((b) => b.name === n).getWorldPosition(new THREE.Vector3()).y - lift;
  const yC = (yOf('LeftUpLeg') + yOf('RightUpLeg')) / 2 - 0.06;
  const P = sk.geometry.attributes.position, SI = sk.geometry.attributes.skinIndex, SW = sk.geometry.attributes.skinWeight;
  let nW = 0;
  for (let v = 0; v < P.count; v++) {
    const y = RA[v * 3 + 1]; if (y > yC) continue;
    let L = 0, R = 0; for (let c = 0; c < 4; c++) { const sg = side[SI.getComponent(v, c)], w = SW.getComponent(v, c); if (sg < 0) L += w; else if (sg > 0) R += w; }
    if (!L || !R) continue;
    const k = Math.min(1, Math.max(0, (yC - y) / 0.12)), L3 = L * L * L, R3 = R * R * R, tot = L + R;
    const L2 = tot * (L / tot + k * (L3 / (L3 + R3) - L / tot)), R2 = tot - L2;
    for (let c = 0; c < 4; c++) { const sg = side[SI.getComponent(v, c)], w = SW.getComponent(v, c); if (sg < 0) SW.setComponent(v, c, w * L2 / L); else if (sg > 0) SW.setComponent(v, c, w * R2 / R); }
    nW++;
  }
  SW.needsUpdate = true;
  console.log('[klip] hakama fix:', nW, 'corners');
}

async function loadAkane() {
  const g = await loader.loadAsync('model/akane-toon.glb');
  const root = g.scene;
  let sk = null; root.traverse((o) => { if (o.isSkinnedMesh) sk = o; });
  // (the matte painting on its own islands: akane-mat.webp, each triangle corner's place in akane-detay-uv.bin, uint16
  // u v per corner in the file's triangle order - the game's &ucbmat=1 look, no painted shine)
  const [tex, ub] = await Promise.all([new THREE.TextureLoader().loadAsync('model/akane-mat.webp'), fetch('model/akane-detay-uv.bin').then((r) => (r.ok ? r.arrayBuffer() : null))]);
  tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const geo = sk.geometry.toNonIndexed(), n = geo.attributes.position.count, U = ub ? new Uint16Array(ub) : null;
  if (U && U.length === n * 2) { const uv = new Float32Array(n * 2); for (let i = 0; i < n * 2; i++) uv[i] = U[i] / 65535; geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }
  else console.warn('[klip] uv file does not match: the model own UVs');
  sk.geometry = geo;

  sk.material = new THREE.MeshLambertMaterial({ map: tex });
  // ("Etek yere girmesin": the hakama's wide hem is rigid with the shins, so in wide stances and crouches its front sinks
  // through the floor; this option only lays such corners on the floor - drawing only, off by default)
  const hem = { value: -1e9 };
  sk.material.onBeforeCompile = (sh) => { sh.uniforms.uHem = hem; sh.vertexShader = 'uniform float uHem;\n' + sh.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\n transformed.y = max(transformed.y, uHem);'); };
  HEM = hem;
  sk.castShadow = true; sk.frustumCulled = false;
  scene.add(root);
  const T = prepModel(root, boneMap(root));
  if (DBG !== 'noweb') hakamaFix(sk, T.restPos.find((r) => r.m === sk).a);
  T.sword = katana(); T.bones.RightHand.add(T.sword); T.swordSize = 1.35; // (her hands are about 1.5x X Bot's)
  return T;
}
async function loadXBot() {
  const g = await loader.loadAsync('xbot.glb');
  const root = g.scene;
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; o.material = new THREE.MeshLambertMaterial({ color: o.material.color || 0x888888 }); } });
  scene.add(root);
  const T = prepModel(root, boneMap(root));
  T.sword = katana(); T.bones.RightHand.add(T.sword);
  return T;
}

// ---- clips
let DATA = null, HEM = null;
function decode(c) {
  if (c.dq) return c;
  const b = (s) => { const r = atob(s), a = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return new Int16Array(a.buffer); };
  c.dq = b(c.q); c.dh = b(c.hips);
  return c;
}
// (the head and the feet keep their parent's turn: Mixamo's head-top end leans 20 degrees forward and its ankle-to-toe
// line is steeper than Akane's, so aiming those bones at them tipped her head back and pushed her toes into the floor)
const KEEP = { Head: 'Neck', LeftFoot: 'LeftLeg', LeftToeBase: 'LeftFoot', RightFoot: 'RightLeg', RightToeBase: 'RightFoot' };
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const hmRaw = (c, f) => new THREE.Vector3(c.dh[f * 3], c.dh[f * 3 + 1], c.dh[f * 3 + 2]).multiplyScalar(0.001);
// the clip on one model: local rotation per bone per frame, hip position (in its parent's space) per frame
function retarget(c, T, inPlace) {
  decode(c);
  const n = c.frames, names = DATA.bones, R = c.rest;
  const mdir = {}, Ca = {};
  for (const b of names) {
    const ch = CHILD[b] && R[CHILD[b]] ? V3(R[CHILD[b]]) : null;
    mdir[b] = ch ? ch.sub(V3(R[b])).normalize() : T.dir0[b].clone();
    Ca[b] = KEEP[b] ? Ca[KEEP[b]].clone() : new THREE.Quaternion().setFromUnitVectors(T.dir0[b], mdir[b]);
  }
  const loc = {}, W = {}, D = new THREE.Quaternion(), inv = new THREE.Quaternion();
  for (const b of names) loc[b] = new Float32Array(n * 4);
  const pos = new Float32Array(n * 3);
  // (scale: hip-to-ankle height, Akane's over Mixamo's)
  const s = (T.hips0.y - (T.P0.LeftFoot.y + T.P0.RightFoot.y) / 2) / Math.max(0.3, R.Hips[1] - (R.LeftFoot[1] + R.RightFoot[1]) / 2);
  const FEET = ['LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase'], CHAIN = {};
  for (const f of FEET) { const ch = []; let b = f; while (b) { ch.unshift(b); b = T.par[b]; } CHAIN[f] = ch; }
  const h0 = V3(R.Hips), first = new THREE.Vector3(c.dh[0], c.dh[1], c.dh[2]).multiplyScalar(0.001), last = new THREE.Vector3(c.dh[(n - 1) * 3], c.dh[(n - 1) * 3 + 1], c.dh[(n - 1) * 3 + 2]).multiplyScalar(0.001);
  const Dq = (b) => { const k = (names.indexOf(b) * n + Dq.f) * 4; return new THREE.Quaternion(c.dq[k] / 32767, c.dq[k + 1] / 32767, c.dq[k + 2] / 32767, c.dq[k + 3] / 32767).normalize(); };
  // Mixamo's sole points (toe base, toe end, a heel under the ankle) by forward kinematics: hips, then each parent's
  // world turn applied to its rest offset; their rise above the rest height
  const fkM = (f, end, extra) => {
    const ch = CHAIN[end], pm = hmRaw(c, f);
    for (let i = 1; i < ch.length; i++) pm.add(V3(R[ch[i]]).sub(V3(R[ch[i - 1]])).applyQuaternion(Dq(ch[i - 1])));
    if (extra) pm.add(extra.clone().applyQuaternion(Dq(end)));
    return pm;
  };
  const riseM = (f, sd) => {
    const F = sd + 'Foot', TB = sd + 'ToeBase', TE = sd + 'Toe_End';
    let e = Math.min(fkM(f, TB).y - R[TB][1], fkM(f, F, new THREE.Vector3(0, -R[F][1], -0.03)).y);
    if (R[TE]) e = Math.min(e, fkM(f, TB, V3(R[TE]).sub(V3(R[TB]))).y - R[TE][1]);
    return e;
  };
  const yAx = new THREE.Vector3(0, 1, 0), fw = new THREE.Vector3(), corr = [], cRaw = new Float32Array(n), wps = [], Wf = [], clear = {};
  for (let f = 0; f < n; f++) {
    Dq.f = f;
    names.forEach((b, bi) => {
      const k = (bi * n + f) * 4;
      D.set(c.dq[k] / 32767, c.dq[k + 1] / 32767, c.dq[k + 2] / 32767, c.dq[k + 3] / 32767).normalize();
      if (DBG === 'tpose') D.identity();
      W[b] = D.clone().multiply(Ca[b]).multiply(T.W0[b]);
    });
    const rise = { Left: riseM(f, 'Left'), Right: riseM(f, 'Right') };
    for (const sd of ['Left', 'Right']) {
      const F = sd + 'Foot', TB = sd + 'ToeBase'; if (!T.bones[F]) continue;
      // a foot on the floor stays flat on it (only its heading follows Mixamo's), fading out as it lifts 3-12 cm:
      // Akane's sandals are about three times Mixamo's foot, so his ankle's tilt drove the long sole through the floor
      // or lifted her off it
      const cw = DBG === 'noplant' ? 0 : Math.min(1, Math.max(0, 1 - (rise[sd] - 0.03) / 0.09));
      if (cw > 0) {
        const dl = W[F].clone().multiply(T.W0[F].clone().invert());
        fw.set(0, 0, 1).applyQuaternion(dl);
        const flat = new THREE.Quaternion().setFromAxisAngle(yAx, Math.atan2(fw.x, fw.z)).multiply(T.W0[F]);
        W[F].slerp(flat, cw);
      }
      // (the toes stay as they are in the sandal: her toe joint sits near the heel of the long sole)
      if (T.bones[TB] && DBG !== 'toes') W[TB] = W[F].clone().multiply(T.W0[F].clone().invert()).multiply(T.W0[TB]);
    }
    for (const b of names) {
      if (!T.bones[b]) continue;
      const pn = T.par[b], pq = pn && W[pn] ? W[pn] : T.parentQ;
      inv.copy(pq).invert().multiply(W[b]);
      loc[b].set([inv.x, inv.y, inv.z, inv.w], f * 4);
    }
    const hp = hmRaw(c, f);
    if (inPlace) { const t = n > 1 ? f / (n - 1) : 0; const drift = first.clone().lerp(last, t); hp.x -= drift.x - h0.x; hp.z -= drift.z - h0.z; }
    // (model space, the model's root at the origin as when prepared; then the hips' parent's own space)
    const wp = T.hips0.clone().add(hp.sub(h0).multiplyScalar(s));
    // the floor: Akane's lowest sole point rises above its rest height as much as Mixamo's does (scaled)
    if (DBG !== 'nofloor') {
      const fkA = (end) => { const ch = CHAIN[end], pa = wp.clone(); for (let i = 1; i < ch.length; i++) pa.add(T.off[ch[i]].clone().applyQuaternion(W[ch[i - 1]])); return pa; };
      // (each foot matched on its own - a lifted foot's long sandal pointing down must not lift her - and the two
      // blended toward the foot Mixamo has lower, softly, so the choice never jumps; only while a foot is near the
      // floor, as the flat-foot rule: in the air the hips move as Mixamo's, scaled)
      const lo = Math.min(rise.Left, rise.Right);
      let num = 0, den = 0;
      for (const sd of ['Left', 'Right']) {
        const F = sd + 'Foot', pf = fkA(F), so = T.sole[sd] || [];
        let eA = 1e9;
        for (const p of so) eA = Math.min(eA, pf.y + p.off.clone().applyQuaternion(W[F]).y - p.y0);
        if (!so.length) eA = pf.y - T.P0[F].y;
        const wf = Math.min(1, Math.max(0, 1 - (rise[sd] - 0.03) / 0.09)), k = Math.exp(-(rise[sd] - lo) / 0.025);
        num += k * wf * (s * rise[sd] - eA); den += k;
      }
      cRaw[f] = num / den; corr.push([+rise.Left.toFixed(3), +rise.Right.toFixed(3), +(num / den).toFixed(3)]);
    }
    wps[f] = wp;
    Wf[f] = {}; for (const sd of ['Left', 'Right']) for (const b of ['UpLeg', 'Leg', 'Foot']) if (W[sd + b]) Wf[f][sd + b] = W[sd + b].clone();
    Wf[f].Hips = W.Hips.clone();
  }
  // (the floor corrections smoothed over a few frames: a foot leaving the floor on its long sandal's tip gave one-frame hops)
  for (let f = 0; f < n; f++) {
    let a = 0, w = 0;
    for (let d = -4; d <= 4; d++) { const g = f + d; if (g < 0 || g >= n) continue; const k = Math.exp(-(d * d) / 4.5); a += k * cRaw[g]; w += k; }
    const wp = wps[f].clone(); wp.y += w ? a / w : 0;
    // a sandal that would go through the floor turns up at the ankle just enough to clear it (her sandals are about
    // three times Mixamo's foot: a pointed foot in a kick or a step drove the long sole under the floor)
    if (DBG !== 'noclear') for (const sd of ['Left', 'Right']) {
      const F = sd + 'Foot', so = T.sole[sd] || []; if (!so.length || !Wf[f][F]) continue;
      const Q = Wf[f], ank = wp.clone();
      for (const [b, pb] of [[sd + 'UpLeg', 'Hips'], [sd + 'Leg', sd + 'UpLeg'], [F, sd + 'Leg']]) ank.add(T.off[b].clone().applyQuaternion(Q[pb]));
      const low = (q) => Math.min(...so.map((p) => ank.y + p.off.clone().applyQuaternion(q).y - p.y0));
      const l0 = low(Q[F]); if (l0 >= -0.005) continue;
      // (the turn about the horizontal line across the foot; its sign is whichever lifts the lowest corner)
      const tipW = so[so.length - 1].off.clone().applyQuaternion(Q[F]); tipW.y = 0;
      if (tipW.lengthSq() < 1e-6) continue;
      const ax = new THREE.Vector3().crossVectors(tipW.normalize(), yAx).normalize();
      const turn = (t) => new THREE.Quaternion().setFromAxisAngle(ax, t).multiply(Q[F]);
      const sg = low(turn(0.05)) > low(turn(-0.05)) ? 1 : -1;
      let lo2 = 0, hi2 = 1.6;
      if (low(turn(sg * hi2)) < -0.005) { lo2 = hi2; } else for (let it = 0; it < 18; it++) { const mid = (lo2 + hi2) / 2; if (low(turn(sg * mid)) < -0.005) lo2 = mid; else hi2 = mid; }
      const qn = turn(sg * (lo2 === 1.6 ? 1.6 : hi2));
      const lq = Q[sd + 'Leg'].clone().invert().multiply(qn);
      loc[F].set([lq.x, lq.y, lq.z, lq.w], f * 4);
      clear[sd] = (clear[sd] || 0) + 1;
    }
    wp.applyMatrix4(T.parentInv);
    pos.set([wp.x, wp.y, wp.z], f * 3);
  }
  // the sword: held as in Mixamo's T-pose (blade forward along +Z out of the fist, edge down), in the hand's frame
  const H = V3(R.RightHand), M = R.RightHandMiddle1 ? V3(R.RightHandMiddle1) : H.clone().add(new THREE.Vector3(-0.09, 0, 0));
  const handRestT = Ca.RightHand.clone().multiply(T.W0.RightHand), hi = handRestT.clone().invert();
  const gp = T.grip ? T.grip.clone().applyQuaternion(T.W0.RightHand.clone().invert()) : M.clone().sub(H).multiplyScalar(0.62 * s).applyQuaternion(hi);
  const sw = { p: gp.divideScalar(T.handScale), q: hi.clone() };
  return { n, fps: c.fps, loc, pos, sw, corr, clear };
}

// ---- state
let A = null, X = null, cur = null, rtA = null, rtX = null, t = 0, playing = true, speed = 1, viewMode = 'side';
const opt = { sword: true, inPlace: true, xbot: false, hem: false };
function applyPose(T, rt, time) {
  if (!T || !rt || DBG === 'bind') return;
  const fr = Math.min(Math.max(time * rt.fps, 0), rt.n - 1), f0 = Math.floor(fr), f1 = Math.min(f0 + 1, rt.n - 1), a = fr - f0;
  const q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion();
  for (const [b, arr] of Object.entries(rt.loc)) {
    const bone = T.bones[b]; if (!bone) continue;
    q0.fromArray(arr, f0 * 4); q1.fromArray(arr, f1 * 4); bone.quaternion.copy(q0).slerp(q1, a);
  }
  const P = rt.pos; T.bones.Hips.position.set(P[f0 * 3] + (P[f1 * 3] - P[f0 * 3]) * a, P[f0 * 3 + 1] + (P[f1 * 3 + 1] - P[f0 * 3 + 1]) * a, P[f0 * 3 + 2] + (P[f1 * 3 + 2] - P[f0 * 3 + 2]) * a);
  T.sword.visible = opt.sword && cur && cur.group === 'kilic';
  T.sword.position.copy(rt.sw.p); T.sword.quaternion.copy(rt.sw.q); T.sword.scale.setScalar((T.swordSize || 1) / T.handScale);
}
function rebuild() {
  if (!cur) return;
  rtA = retarget(cur, A, opt.inPlace);
  rtX = X ? retarget(cur, X, opt.inPlace) : null;
  $('slider').max = String(cur.frames - 1);
}
function dur() { return cur ? (cur.frames - 1) / cur.fps : 1; }
const followT = new THREE.Vector3(0, 0.95, 0);
function setView(m, snap = true) {
  viewMode = m;
  $('side-v').classList.toggle('on', m === 'side'); $('front-v').classList.toggle('on', m === 'front');
  const tg = controls.target, d = 6.2 * Math.max(1, 1.1 / camera.aspect); // (a narrow phone view stands further back)
  if (m === 'side') camera.position.set(tg.x - d, tg.y + 0.25, tg.z + (X && opt.xbot ? -0.6 : 0));
  else camera.position.set(tg.x + (X && opt.xbot ? 0.5 : 0), tg.y + 0.25, tg.z + d);
  if (snap) controls.update();
}
function follow(snap) {
  // the camera keeps Akane's hips in view (sideways only; height stays), moving with her
  const hp = A.bones.Hips.getWorldPosition(new THREE.Vector3());
  const want = new THREE.Vector3(hp.x, 0.95 + Math.max(0, hp.y - 1.15) * 0.8, hp.z);
  if (X && opt.xbot) { const xp = X.bones.Hips.getWorldPosition(new THREE.Vector3()); want.x = (hp.x + xp.x) / 2; want.z = (hp.z + xp.z) / 2; }
  const d = snap ? want.clone().sub(controls.target) : want.clone().sub(controls.target).multiplyScalar(0.12);
  controls.target.add(d); camera.position.add(d);
}

function select(id, keepTime = false) {
  const c = DATA.clips.find((x) => x.id === id); if (!c) return;
  cur = c; if (!keepTime) t = 0;
  rebuild();
  $('label').querySelector('.n').textContent = c.name;
  const gl = DATA.groups.find((g) => g.id === c.group).label;
  $('label').querySelector('.g').textContent = gl + ' · ' + c.frames + ' kare · ' + (c.frames / c.fps).toFixed(1) + ' sn';
  for (const el of document.querySelectorAll('.it')) el.classList.toggle('sel', el.dataset.id === id);
  const el = document.querySelector('.it.sel'); if (el && !REC) el.scrollIntoView({ block: 'nearest' });
  if (!REC) history.replaceState(null, '', '#' + encodeURIComponent(id));
  applyPose(A, rtA, t); applyPose(X, rtX, t); follow(true);
}

function buildList() {
  const L = $('list'), qs = $('search').value.trim().toLowerCase();
  L.innerHTML = '';
  for (const g of DATA.groups) {
    const cl = DATA.clips.filter((c) => c.group === g.id && (!qs || c.name.toLowerCase().includes(qs)));
    const all = DATA.clips.filter((c) => c.group === g.id).length;
    const h = document.createElement('div'); h.className = 'gh'; h.innerHTML = `<span>${g.label}</span><span class="c">${qs ? cl.length + ' / ' : ''}${all}</span>`;
    L.append(h);
    if (!cl.length) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = all ? 'eşleşen yok' : 'henüz klip yok'; L.append(e); }
    for (const c of cl) {
      const it = document.createElement('div'); it.className = 'it' + (cur && cur.id === c.id ? ' sel' : ''); it.dataset.id = c.id;
      it.innerHTML = `${c.name}<div class="d">${(c.frames / c.fps).toFixed(1)} sn</div>`;
      it.onclick = () => { select(c.id); setPlaying(true); };
      L.append(it);
    }
  }
}
function step(k) {
  const vis = [...document.querySelectorAll('.it')].map((e) => e.dataset.id);
  const i = vis.indexOf(cur && cur.id); const n = vis[(i + k + vis.length) % vis.length]; if (n) select(n);
}
function setPlaying(p) { playing = p; $('play').textContent = p ? '❚❚ Durdur' : '▶ Oynat'; }

// ---- UI
$('play').onclick = () => setPlaying(!playing);
$('prev').onclick = () => step(-1); $('next').onclick = () => step(1);
for (const b of document.querySelectorAll('#speeds button')) b.onclick = () => { speed = +b.dataset.s; for (const x of document.querySelectorAll('#speeds button')) x.classList.toggle('on', x === b); };
$('slider').oninput = () => { setPlaying(false); t = +$('slider').value / (cur ? cur.fps : 30); };
$('side-v').onclick = () => setView('side'); $('front-v').onclick = () => setView('front');
$('sword').onchange = () => { opt.sword = $('sword').checked; };
$('hem').onchange = () => { opt.hem = $('hem').checked; setHem(); };
function setHem() { if (HEM && A) HEM.value = opt.hem ? -A.root.position.y + 0.004 : -1e9; }
$('inplace').onchange = () => { opt.inPlace = $('inplace').checked; rebuild(); };
$('xbot').onchange = async () => {
  opt.xbot = $('xbot').checked;
  if (opt.xbot && !X) { $('xbot').disabled = true; try { X = await loadXBot(); X.root.position.x = 0.9; X.root.position.z = -0.9; X.root.updateMatrixWorld(true); } catch (e) { console.error(e); } $('xbot').disabled = false; rebuild(); }
  if (X) X.root.visible = opt.xbot;
  setView(viewMode);
};
$('search').oninput = buildList;
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' && e.target.type === 'search') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { step(1); e.preventDefault(); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { step(-1); e.preventDefault(); }
  if (e.key === ' ') { setPlaying(!playing); e.preventDefault(); }
});

// ---- loop
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.1);
  if (cur && playing) { t += dt * speed; const D = dur(); if (t > D) t = D > 0 ? t % (D + 1 / cur.fps) : 0; }
  if (cur) {
    applyPose(A, rtA, t); if (X && opt.xbot) applyPose(X, rtX, t);
    const f = Math.min(Math.round(t * cur.fps), cur.frames - 1);
    if (!$('slider').matches(':active')) $('slider').value = String(f);
    $('fr').textContent = 'kare ' + (f + 1) + ' / ' + cur.frames;
    follow(false);
  }
  key.position.set(controls.target.x - 2.5, 4.5, controls.target.z + 3); key.target.position.set(controls.target.x, 0, controls.target.z);
  controls.update();
  renderer.render(scene, camera);
  if (!REC) requestAnimationFrame(frame);
}

// ---- start
(async () => {
  resize();
  try {
    [DATA, A] = await Promise.all([fetch('klipler.json').then((r) => r.json()), loadAkane()]);
  } catch (e) { $('msg').textContent = 'Yüklenemedi: ' + e.message; throw e; }
  $('msg').remove();
  const per = DATA.groups.map((g) => g.label + ' ' + DATA.clips.filter((c) => c.group === g.id).length).join(' · ');
  $('count').textContent = DATA.clips.length + ' klip — ' + per;
  buildList();
  setView('side');
  const h = decodeURIComponent(location.hash.slice(1));
  select(DATA.clips.find((c) => c.id === h) ? h : (Q.get('klip') || DATA.clips[0].id));
  setView('side');
  if (!REC) requestAnimationFrame(frame);
  // (recording / test hooks: tools/klip-galeri/rec.mjs drives the page frame by frame)
  window.__kg = {
    ready: true, dbg: () => ({ THREE, A, X, cur, rtA, CHILD, camera, controls, renderer, scene }), clips: () => DATA.clips.map((c) => ({ id: c.id, name: c.name, group: c.group, frames: c.frames, fps: c.fps })),
    select: (id) => { select(id); setPlaying(false); },
    at: (f) => { t = f / cur.fps; applyPose(A, rtA, t); if (X && opt.xbot) applyPose(X, rtX, t); follow(true); renderer.render(scene, camera); key.position.set(controls.target.x - 2.5, 4.5, controls.target.z + 3); key.target.position.set(controls.target.x, 0, controls.target.z); controls.update(); renderer.render(scene, camera); },
    view: (m) => setView(m), opt: (k, v) => { opt[k] = v; if (k === 'inPlace') rebuild(); if (k === 'hem') setHem(); },
    // (checks: lowest point of Akane's skinned mesh at the current pose, and the world positions of a few bones)
    probe: () => {
      const sk = []; A.root.traverse((o) => { if (o.isSkinnedMesh) sk.push(o); });
      const m = sk[0], p = m.geometry.attributes.position, v = new THREE.Vector3();
      if (!A.footIdx) { // (the sandals' corners: mostly on a foot or toe bone)
        const SI = m.geometry.attributes.skinIndex, SW = m.geometry.attributes.skinWeight, fb = new Set(m.skeleton.bones.map((b, i) => (/(Foot|ToeBase)$/.test(b.name) ? i : -1)));
        A.footIdx = []; for (let i = 0; i < p.count; i++) { let w = 0; for (let c = 0; c < 4; c++) if (fb.has(SI.getComponent(i, c))) w += SW.getComponent(i, c); if (w >= 0.5) A.footIdx.push(i); }
      }
      const hp = A.bones.Hips.getWorldPosition(new THREE.Vector3());
      let minY = 1e9, maxY = -1e9, far = 0, minFoot = 1e9;
      for (let i = 0; i < p.count; i += 5) { v.fromBufferAttribute(p, i); m.applyBoneTransform(i, v); v.applyMatrix4(m.matrixWorld); minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y); far = Math.max(far, v.distanceTo(hp)); }
      for (const i of A.footIdx) { v.fromBufferAttribute(p, i); m.applyBoneTransform(i, v); v.applyMatrix4(m.matrixWorld); minFoot = Math.min(minFoot, v.y); }
      const bw = (n) => A.bones[n].getWorldPosition(new THREE.Vector3()).toArray().map((x) => +x.toFixed(3));
      return { minY: +minY.toFixed(3), minFoot: +minFoot.toFixed(3), maxY: +maxY.toFixed(3), far: +far.toFixed(3), hips: bw('Hips'), lh: bw('LeftHand'), rh: bw('RightHand'), lf: bw('LeftFoot'), rf: bw('RightFoot'), head: bw('Head') };
    },
  };
})();
