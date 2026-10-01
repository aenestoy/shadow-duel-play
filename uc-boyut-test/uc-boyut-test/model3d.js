// B: the same fighters as a low-poly real-3D model (branch claude/sd-3d test page only; never in the game).
// Each fighter is a set of simple solids (tapered cylinders, spheres, boxes, a curved blade) placed every frame on the
// 3D skeleton js/depth25.js builds from the fight (ND.depth25.pose3d), so the timing is exactly the game's.
// Look: toon shading (three light steps) and a dark ink outline (inverted hull), lit from the arena's key-light side.
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

const UP = new THREE.Vector3(0, 1, 0);
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpV = new THREE.Vector3();
const vx = new THREE.Vector3(), vy = new THREE.Vector3(), vz = new THREE.Vector3();

function toonRamp() {
  const d = new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
}
// ink outline: the back faces pushed out along the view-space normal (constant thickness under any scale)
function inkMaterial(thick, color = 0x0b0a0d) {
  return new THREE.ShaderMaterial({
    uniforms: { thick: { value: thick }, color: { value: new THREE.Color(color) } },
    vertexShader: 'uniform float thick; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vec3 n = normalize(normalMatrix * normal); mv.xyz += n * thick; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 color; void main(){ gl_FragColor = vec4(color, 1.0); }',
    side: THREE.BackSide,
  });
}
// cylinder from y = 0 to y = 1 (radius r0 at the root, r1 at the end)
function limbGeo(r0, r1, seg = 7) { const g = new THREE.CylinderGeometry(r1, r0, 1, seg, 1, false); g.translate(0, 0.5, 0); return g; }

export class Model3D {
  constructor(canvas, ND, opt = {}) {
    this.ND = ND; this.D = ND.depth25;
    const r = (this.r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: !!opt.preserve, powerPreference: 'high-performance' }));
    r.setPixelRatio(1);
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(30, 1, 20, 5000);
    this.ramp = toonRamp();
    this.ink = inkMaterial(1.7); this.inkThin = inkMaterial(0.6);
    // background: the 2D panels' gradient; floor: dark, with the stage line at the back
    const bg = document.createElement('canvas'); bg.width = 4; bg.height = 256;
    const bctx = bg.getContext('2d'), gr = bctx.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#2a2f3b'); gr.addColorStop(1, '#1a1d24'); bctx.fillStyle = gr; bctx.fillRect(0, 0, 4, 256);
    const bt = new THREE.CanvasTexture(bg); bt.colorSpace = THREE.SRGBColorSpace; this.scene.background = bt;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 900), new THREE.MeshToonMaterial({ color: 0x14161d, gradientMap: this.ramp }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 420); this.scene.add(floor); // from z = -30 (the stage line) toward the camera
    const edge = new THREE.Mesh(new THREE.BoxGeometry(6000, 0.8, 0.8), new THREE.MeshBasicMaterial({ color: 0x6a7284 }));
    edge.position.set(0, 0.2, -30); this.scene.add(edge);
    for (let x = -600; x <= 600; x += 30) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 8), new THREE.MeshBasicMaterial({ color: 0x3a4050 })); m.position.set(x, 0.2, -26); this.scene.add(m); }
    // light: key from above on the arena's lit side, soft fill
    this.key = new THREE.DirectionalLight(0xfff4e6, 2.6); this.key.position.set(260, 420, 300); this.scene.add(this.key);
    this.scene.add(new THREE.HemisphereLight(0xb9c4e0, 0x2a2430, 1.15));
    this.figs = new Map();
    // blob shadow texture
    const sc = document.createElement('canvas'); sc.width = sc.height = 64;
    const sx = sc.getContext('2d'), sg = sx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sg.addColorStop(0, 'rgba(0,0,0,.6)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); sx.fillStyle = sg; sx.fillRect(0, 0, 64, 64);
    this.shadowTex = new THREE.CanvasTexture(sc);
  }

  mat(color) { return new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: this.ramp }); }
  // a part: solid + ink hull sharing one geometry
  part(group, geo, color, ink = this.ink) {
    const m = new THREE.Mesh(geo, typeof color === 'object' && color.isMaterial ? color : this.mat(color));
    const o = new THREE.Mesh(geo, ink);
    m.matrixAutoUpdate = o.matrixAutoUpdate = false;
    group.add(o); group.add(m);
    return { m, o, set(mx) { m.matrix.copy(mx); o.matrix.copy(mx); m.matrixWorldNeedsUpdate = o.matrixWorldNeedsUpdate = true; }, vis(v) { m.visible = o.visible = v; } };
  }

  rig(f) {
    let R = this.figs.get(f);
    if (R && R.ch === f.ch && R.col === f.col) return R;
    if (R) this.scene.remove(R.g);
    const c = f.col, g = new THREE.Group(), acc = f.ch.acc, wpn = f.wpn;
    const leg = c.hakama || c.cloth, legB = c.hakamaDark || c.clothDark;
    const skin = c.skin || '#c89c81', hair = 0x151012;
    R = { ch: f.ch, col: f.col, g, acc };
    R.torso = this.part(g, (() => { const t = new THREE.CylinderGeometry(1, 0.86, 1, 8, 2); t.translate(0, 0.5, 0); return t; })(), c.cloth);
    R.obi = this.part(g, (() => { const t = new THREE.CylinderGeometry(1, 1, 1, 8); return t; })(), c.accent);
    R.neck = this.part(g, limbGeo(5.2, 4.8), acc === 'akane' || acc === 'monk' ? skin : c.clothDark);
    R.head = this.part(g, new THREE.SphereGeometry(12.2, 10, 8), acc === 'kasa' || acc === 'hood' ? c.clothDark : skin);
    if (acc === 'akane') {
      R.hair = this.part(g, new THREE.SphereGeometry(13, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), hair);
      R.tail = this.part(g, limbGeo(4.2, 2.2), hair);
      R.ribbon = this.part(g, new THREE.BoxGeometry(7, 2.4, 9), c.accent, this.inkThin);
    } else if (acc === 'kasa') {
      R.hat = this.part(g, new THREE.ConeGeometry(28, 12, 12, 1, true), '#7d6a44');
      R.hat.m.material.side = THREE.DoubleSide;
    } else {
      R.hair = this.part(g, new THREE.SphereGeometry(13, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), c.clothDark);
    }
    R.eye = this.part(g, new THREE.BoxGeometry(2.6, 1.4, 2.2), 0x0a0808, this.inkThin);
    R.thighF = this.part(g, limbGeo(11, 12.6), leg); R.shinF = this.part(g, limbGeo(12.6, 11.4), leg);
    R.thighB = this.part(g, limbGeo(10.4, 12), legB); R.shinB = this.part(g, limbGeo(12, 10.8), legB);
    R.kneeF = this.part(g, new THREE.SphereGeometry(12.4, 8, 6), leg); R.kneeB = this.part(g, new THREE.SphereGeometry(11.8, 8, 6), legB);
    // the hakama's pleated top: a flared skirt from the obi over both hip joints
    R.skirt = this.part(g, (() => { const t = new THREE.CylinderGeometry(1, 1.25, 1, 10, 1, true); t.translate(0, -0.5, 0); return t; })(), leg);
    R.skirt.m.material.side = THREE.DoubleSide;
    R.footF = this.part(g, new THREE.BoxGeometry(16, 6, 8), 0x26222a); R.footB = this.part(g, new THREE.BoxGeometry(16, 6, 8), 0x1c191f);
    R.uArmF = this.part(g, limbGeo(8.4, 10.4), c.cloth); R.fArmF = this.part(g, limbGeo(4.8, 4.2), c.wrap);
    R.uArmB = this.part(g, limbGeo(8, 9.8), c.clothDark); R.fArmB = this.part(g, limbGeo(4.6, 4), c.wrapDark);
    R.handF = this.part(g, new THREE.SphereGeometry(5.6, 8, 6), 0x2a2026); R.handB = this.part(g, new THREE.SphereGeometry(5, 8, 6), 0x241c21);
    R.shoF = this.part(g, new THREE.SphereGeometry(8.4, 8, 6), c.cloth); R.shoB = this.part(g, new THREE.SphereGeometry(8, 8, 6), c.clothDark);
    // the weapon
    const BL = wpn.blade, HL = wpn.handle;
    R.tsuka = this.part(g, limbGeo(2.7, 2.6), 0x141116, this.inkThin);
    R.tsuba = this.part(g, new THREE.CylinderGeometry(7, 7, 1.6, 14), 0x3b3530, this.inkThin);
    R.blade = this.part(g, bladeGeo(BL, wpn.type === 'naginata' ? 2.6 : 2.1, 0.75, 3.2 * BL / 96), new THREE.MeshToonMaterial({ color: 0xdfe6ef, gradientMap: this.ramp, emissive: 0x2a3140 }), this.inkThin);
    if (wpn.iai) R.saya = this.part(g, limbGeo(3, 2.8, 8), 0x2a1416, this.inkThin);
    R.HL = HL; R.BL = BL;
    // blob shadow
    R.shadow = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false }));
    R.shadow.rotation.x = -Math.PI / 2; R.shadow.scale.set(1, 0.3, 1);
    g.add(R.shadow);
    // blade streak
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(26 * 2 * 3), 3));
    tg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(26 * 2 * 3), 3));
    const idx = []; for (let i = 0; i < 25; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    tg.setIndex(idx);
    R.trail = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    R.trail.frustumCulled = false;
    g.add(R.trail);
    this.scene.add(g);
    this.figs.set(f, R);
    return R;
  }

  // place one fighter on its 3D skeleton
  pose(f) {
    const R = this.rig(f), S = this.D.pose3d(f, true);
    if (!S || f.hidden) { R.g.visible = false; return; }
    R.g.visible = true;
    const dir = f.dir < 0 ? -1 : 1;
    const W3 = (p, out = new THREE.Vector3()) => out.set(f.x + p.x * dir, -p.y, p.z);
    const P = S.P;
    const hip = W3(P.hip), neck = W3(P.neck), head = W3(P.head);
    const shF = W3(S.shF), shB = W3(S.shB);
    // torso: spine up, forward turned by the twist, width across
    vy.subVectors(neck, hip); const tl = vy.length(); vy.normalize();
    vx.set(dir, 0, 0); vx.addScaledVector(vy, -vx.dot(vy)).normalize(); // forward ⟂ spine
    vx.applyAxisAngle(vy, -S.psi * dir).normalize(); // + twist: the chest turns toward the camera (+z)
    vz.crossVectors(vx, vy).normalize();
    const basis = (o, X, Y, Z, sx, sy, sz) => { tmpM.makeBasis(tmpS.copy(X).multiplyScalar(sx), tmpV.copy(Y).multiplyScalar(sy), new THREE.Vector3().copy(Z).multiplyScalar(sz)); tmpM.setPosition(o); return tmpM; };
    R.torso.set(basis(new THREE.Vector3().copy(hip).addScaledVector(vy, -6), vx, vy, vz, 9.5, tl + 8, 12.5));
    R.obi.set(basis(new THREE.Vector3().copy(hip).addScaledVector(vy, 7), vx, vy, vz, 10.2, 9, 13.2));
    { // hakama top: from the obi down, turned with the pelvis
      const pv = new THREE.Vector3(dir, 0, 0).applyAxisAngle(UP, -S.psi * 0.55 * dir), pz = new THREE.Vector3().crossVectors(pv, UP);
      R.skirt.set(basis(new THREE.Vector3().copy(hip).addScaledVector(vy, 4), pv, UP, pz, 11, 22, 13.5));
    }
    const seg = (pt, a, b) => { tmpV.subVectors(b, a); const l = tmpV.length() || 1e-3; tmpQ.setFromUnitVectors(UP, tmpV.multiplyScalar(1 / l)); tmpM.compose(a, tmpQ, tmpS.set(1, l, 1)); pt.set(tmpM); };
    const at = (pt, p, s = 1) => { tmpM.makeScale(s, s, s); tmpM.setPosition(p); pt.set(tmpM); };
    seg(R.neck, neck, new THREE.Vector3().lerpVectors(neck, head, 0.6));
    at(R.head, head);
    // face toward the opponent: eye on the near side, hair over the top and back
    const hu = new THREE.Vector3((P.head.x - P.neck.x) * dir, -(P.head.y - P.neck.y), 0).normalize();
    const hf = new THREE.Vector3().crossVectors(hu, new THREE.Vector3(0, 0, 1)).multiplyScalar(dir).normalize(); // forward of the face
    at(R.eye, new THREE.Vector3().copy(head).addScaledVector(hf, 10.6).addScaledVector(hu, 1.8).add(new THREE.Vector3(0, 0, 5.2)));
    if (R.hair) { tmpQ.setFromUnitVectors(UP, new THREE.Vector3().copy(hu).addScaledVector(hf, -0.35).normalize()); tmpM.compose(new THREE.Vector3().copy(head).addScaledVector(hf, -1.2), tmpQ, tmpS.set(1, 1, 1)); R.hair.set(tmpM); }
    if (R.tail) {
      const nape = new THREE.Vector3().copy(head).addScaledVector(hf, -11).addScaledVector(hu, -3);
      const end = new THREE.Vector3().copy(nape).addScaledVector(hf, -10).addScaledVector(hu, -20).add(new THREE.Vector3(-f.vx * 0.01, 0, 0));
      seg(R.tail, nape, end);
      tmpQ.setFromUnitVectors(UP, hu); tmpM.compose(new THREE.Vector3().copy(nape).addScaledVector(hf, -2), tmpQ, tmpS.set(1, 1, 1)); R.ribbon.set(tmpM);
    }
    if (R.hat) { tmpQ.setFromUnitVectors(UP, hu); tmpM.compose(new THREE.Vector3().copy(head).addScaledVector(hu, 9), tmpQ, tmpS.set(1, 1, 1)); R.hat.set(tmpM); }
    // legs: hip joints across the pelvis, turned with it
    const py = -S.psi * 0.55 * dir;
    const side = new THREE.Vector3(0, 0, 1).applyAxisAngle(UP, py);
    const hipF = new THREE.Vector3().copy(hip).addScaledVector(side, 6), hipB = new THREE.Vector3().copy(hip).addScaledVector(side, -6);
    const knF = W3(P.knF), ftF = W3(P.ftF), knB = W3(P.knB), ftB = W3(P.ftB);
    seg(R.thighF, hipF, knF); seg(R.shinF, knF, ftF); at(R.kneeF, knF);
    seg(R.thighB, hipB, knB); seg(R.shinB, knB, ftB); at(R.kneeB, knB);
    const foot = (pt, p) => { tmpM.makeTranslation(p.x + dir * 4, p.y + 3, p.z); pt.set(tmpM); };
    foot(R.footF, ftF); foot(R.footB, ftB);
    // arms (solved in 3D by depth25)
    const elF = W3(P.elF), haF = W3(P.haF), elB = W3(P.elB), haB = W3(P.haB);
    seg(R.uArmF, shF, elF); seg(R.fArmF, elF, haF); at(R.handF, haF); at(R.shoF, shF);
    seg(R.uArmB, shB, elB); seg(R.fArmB, elB, haB); at(R.handB, haB); at(R.shoB, shB);
    // weapon: blade frame X = edge, Y = along the blade, Z = flat normal
    const b = S.blade, u = new THREE.Vector3(b.u.x * dir, -b.u.y, b.u.z).normalize(), e = new THREE.Vector3(b.e.x * dir, -b.e.y, b.e.z).normalize();
    const fz = new THREE.Vector3().crossVectors(e, u).normalize();
    const H = W3(b.h);
    seg(R.tsuka, new THREE.Vector3().copy(H).addScaledVector(u, -R.HL), H);
    tmpQ.setFromUnitVectors(UP, u); tmpM.compose(new THREE.Vector3().copy(H).addScaledVector(u, 1.5), tmpQ, tmpS.set(1, 1, 1)); R.tsuba.set(tmpM);
    R.blade.vis(!S.sheathed);
    if (!S.sheathed) { tmpM.makeBasis(e, u, fz); tmpM.setPosition(new THREE.Vector3().copy(H).addScaledVector(u, 3)); R.blade.set(tmpM); }
    if (R.saya) {
      const sy = this.D.sayaPose(f, S), a = W3(sy.a), su = new THREE.Vector3(sy.u.x * dir, -sy.u.y, sy.u.z).normalize();
      seg(R.saya, a, new THREE.Vector3().copy(a).addScaledVector(su, sy.L));
    }
    // shadow
    R.shadow.position.set(f.dead ? W3(P.hip).x : f.x, 0.3, 0);
    const hgt = Math.max(0, -f.y); R.shadow.material.opacity = Math.max(0.3, 1 - hgt / 300);
    // streak
    this.D.sampleTrail(f, S);
    const T = this.D.trail(f), pos = R.trail.geometry.attributes.position, col = R.trail.geometry.attributes.color;
    const n = Math.min(T.length, 26);
    for (let i = 0; i < 26; i++) {
      const s = T[Math.max(0, Math.min(n - 1, i - (26 - n)))];
      const k = n ? Math.max(0, (i - (26 - n)) / n) : 0;
      if (!s) { pos.setXYZ(i * 2, 0, -9999, 0); pos.setXYZ(i * 2 + 1, 0, -9999, 0); continue; }
      const p0 = W3(s.b, tmpV), x0 = p0.x, y0 = p0.y, z0 = p0.z, p1 = W3(s.p, tmpV);
      pos.setXYZ(i * 2, x0, y0, z0); pos.setXYZ(i * 2 + 1, p1.x, p1.y, p1.z);
      const a = k * 0.55;
      col.setXYZ(i * 2, 0.78 * a * 0.5, 0.86 * a * 0.5, a * 0.5); col.setXYZ(i * 2 + 1, 0.9 * a, 0.95 * a, a);
    }
    pos.needsUpdate = true; col.needsUpdate = true;
    R.trail.visible = n > 1;
  }

  render(F, v, kick) {
    const { w, h, s, cx, fy } = v;
    if (this._w !== w || this._h !== h) { this.r.setSize(w, h, false); this._w = w; this._h = h; }
    for (const f of F) this.pose(f);
    const dist = this.D.cam, zoom = kick ? kick.zoom : 1;
    const visH = h / s, yc = (h / 2 - fy) / s; // game y at the screen centre
    this.cam.aspect = w / h;
    this.cam.fov = (2 * Math.atan(visH / 2 / dist) * 180) / Math.PI / zoom;
    const ox = kick ? (kick.sx / s) * 1.2 : 0, oy = kick ? (kick.sy / s) * 1.2 : 0;
    const [a] = F, px = zoom !== 1 ? (a.x + 30 - cx) * (1 - 1 / zoom) : 0;
    this.cam.position.set(cx + px - ox, -yc + oy, dist);
    this.cam.lookAt(cx + px - ox, -yc + oy, 0);
    this.cam.updateProjectionMatrix();
    this.r.render(this.scene, this.cam);
  }
  // wait for the GPU (bench only)
  sync() { const gl = this.r.getContext(), px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
}

// a curved katana blade along +Y: diamond section (edge +X, spine -X, flats ±Z), tapering to the point, sori toward
// the spine
function bladeGeo(L, w, t, sori) {
  const N = 14, P = [], I = [];
  for (let i = 0; i <= N; i++) {
    const q = i / N, y = q * L, off = -sori * 4 * q * (1 - q), ww = w * (1 - Math.pow(q, 6) * 0.95), tt = t * (1 - q * 0.6);
    P.push(off + ww, y, 0, off, y, tt, off - ww * 0.9, y, 0, off, y, -tt);
  }
  P.push(-sori * 0.1, L + 4, 0);
  const tip = N * 4 + 4;
  for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) {
    const a = i * 4 + k, b = i * 4 + ((k + 1) % 4), c = a + 4, d = b + 4;
    I.push(a, c, b, b, c, d);
  }
  for (let k = 0; k < 4; k++) I.push(N * 4 + k, tip, N * 4 + ((k + 1) % 4));
  I.push(0, 1, 2, 0, 2, 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}
