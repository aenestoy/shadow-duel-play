// Cloth physics for the gallery's Akane (drawing only, plain JS, no physics engine): the cloth bones of
// akane-kumas.glb (scene extras sdCloth: hakama 8 chains, sleeves 2, ponytail 1) as spring-damper chains.
// Each chain is a row of points: the root rides its parent bone, every other point is moved by
//   inertia (Verlet, damped) + gravity measured against the bind pose (the cloth hangs as modelled while she stands;
//   a tilt, a raised arm or a spin makes it swing) + a spring toward where the point would be if the chain were rigid,
// then held by its bone lengths (the skirt's may shorten / lengthen a little: G.lenRange), an angle limit from that rigid pose, the skirt's ring (neighbouring chains may not
// drift further apart than a set stretch, so the skirt stays one garment) and the body: capsules round the thighs,
// shins, hips, torso, upper arms, forearms and the head push points (and bone middles) out; nothing goes under the
// floor. A fixed time step (1/60 s of clip time): a clip at a given frame always looks the same.
// Settings per chain group: kumas.json.
import * as THREE from 'three';

const V = () => new THREE.Vector3();
const _a = V(), _b = V(), _c = V(), _d = V(), _s1 = V(), _s2 = V(), _h1 = V(), _h2 = V(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
// a bone's length: its rest length, or (G.lenRange [lo, hi]) anything between lo and hi times it - the skirt's bones
// shorten where the rig before squashed the cloth (a crouch) instead of buckling into a zigzag
function clampLen(G, L, d) { return G.lenRange ? Math.min(L * G.lenRange[1], Math.max(L * G.lenRange[0], d)) : L; }
// a direction `a` (unit, changed in place) turned back toward `ref` (unit) so it lies at most `deg` from it
function limitTurn(ref, a, deg) {
  _s1.crossVectors(ref, a); const sn = _s1.length();
  if (sn > 1e-6) { _s1.divideScalar(sn); _q2.setFromAxisAngle(_s1, deg * Math.PI / 180); a.copy(ref).applyQuaternion(_q2); } else a.copy(ref);
}
// the signed turn round axis `ax` (unit) taking direction u onto direction v, both seen across the axis
function hingeAngle(ax, u, v) {
  _h1.copy(u).addScaledVector(ax, -u.dot(ax)); _h2.copy(v).addScaledVector(ax, -v.dot(ax));
  if (_h1.lengthSq() < 1e-10 || _h2.lengthSq() < 1e-10) return 0;
  return Math.atan2(_s1.crossVectors(_h1, _h2).dot(ax), _h1.dot(_h2));
}

// the body capsules from the bones (segment from a bone to its child, or a sphere), radii from kumas.json
export function bodyCapsules(bones, R) {
  const C = [];
  const seg = (name, a, b, r, ext = 0) => { if (bones[a] && bones[b]) C.push({ name, a: bones[a], b: bones[b], r, ext, p: V(), q: V() }); };
  for (const s of ['Left', 'Right']) {
    seg(s + 'Thigh', s + 'UpLeg', s + 'Leg', R.thigh);
    seg(s + 'Shin', s + 'Leg', s + 'Foot', R.shin);
    seg(s + 'UpperArm', s + 'Arm', s + 'ForeArm', R.upperArm);
    seg(s + 'ForeArm', s + 'ForeArm', s + 'Hand', R.foreArm);
  }
  seg('Hips', 'LeftUpLeg', 'RightUpLeg', R.hips);
  seg('Torso', 'Spine', 'Spine2', R.torso);
  seg('Chest', 'Spine2', 'Neck', R.chest);
  seg('Neck', 'Neck', 'Head', R.neck);
  if (bones.Head) C.push({ name: 'Head', a: bones.Head, b: null, r: R.head, up: R.headUp, p: V(), q: V() });
  return C;
}
export function updateCapsules(C) {
  for (const c of C) {
    c.a.getWorldPosition(c.p);
    if (c.b) c.b.getWorldPosition(c.q);
    else { c.q.set(0, c.up, 0).applyMatrix4(c.a.matrixWorld); c.p.copy(c.q); }
  }
}
// closest point on a capsule's segment to x (into out); returns the distance
export function capDist(c, x, out) {
  _s1.subVectors(c.q, c.p); const L2 = _s1.lengthSq();
  const t = L2 > 1e-12 ? Math.min(1, Math.max(0, _s2.subVectors(x, c.p).dot(_s1) / L2)) : 0;
  out.copy(c.p).addScaledVector(_s1, t);
  return out.distanceTo(x);
}

export class Cloth {
  constructor(T, sdCloth, cfg) {
    this.T = T; this.cfg = cfg; this.h = 1 / (cfg.hz || 60);
    this.caps = bodyCapsules(T.bones, cfg.capsules);
    this.capBy = Object.fromEntries(this.caps.map((c) => [c.name, c]));
    this.chains = [];
    T.root.updateMatrixWorld(true);
    for (const ch of sdCloth.chains) {
      const G = cfg.groups[ch.group]; if (!G) continue;
      const bones = ch.bones.map((n) => T.bones[n]); if (bones.some((b) => !b)) { console.warn('[kumas] missing bones', ch.name); continue; }
      const parent = T.bones[ch.parent];
      const pts = bones.map((b) => b.getWorldPosition(V()));
      pts.push(V().set(0, ch.tip, 0).applyMatrix4(bones[bones.length - 1].matrixWorld));
      const pinv = parent.matrixWorld.clone().invert();
      const local = pts.map((p) => p.clone().applyMatrix4(pinv));            // (rest points in the parent's frame)
      // (G.legFollow: the skirt's target leans toward the thighs - each chain toward the thigh on its side, the centre
      // chains toward both equally - so a knee never leaves the skirt: Meshy's model has no thighs under it, only the
      // shins from the knee down. The bones stay the hips'; only the spring's target moves.)
      let legs = null, gw = null;
      // (ch.goalW + G.goalOld: each point's target is where the rig before carried the cloth there - linear skinning of
      // the rest point with the old weights of the nearest skirt vertex; the bones are still the hips')
      if (ch.goalW && G.goalOld) {
        gw = ch.goalW.map((L, i) => L.map(([n, w]) => { const b = T.bones[n]; return { b, w, inv: b.matrixWorld.clone().invert(), p: pts[i].clone() }; }));
      } else if (ch.follow) {
        legs = Object.entries(ch.follow).map(([n, k]) => { const b = T.bones[n], inv = b.matrixWorld.clone().invert(); return { b, k: k * (G.legFollow ?? 1), local: pts.map((p) => p.clone().applyMatrix4(inv)) }; });
      } else if (G.legFollow && T.bones.LeftUpLeg && T.bones.RightUpLeg) {
        const kL = Math.min(1, Math.max(0, 0.5 + 0.5 * Math.sin((ch.ang || 0) * Math.PI / 180) * (G.legSide || 1.3)));
        legs = ['LeftUpLeg', 'RightUpLeg'].map((n, j) => { const b = T.bones[n], inv = b.matrixWorld.clone().invert(); return { b, k: G.legFollow * (j ? 1 - kL : kL), local: pts.map((p) => p.clone().applyMatrix4(inv)) }; });
      }
      const len = pts.slice(1).map((p, i) => p.distanceTo(pts[i]));
      const restQ = bones.map((b) => b.quaternion.clone()), restP = bones.map((b) => b.position.clone());
      const pq0 = parent.getWorldQuaternion(new THREE.Quaternion()), dl = V().set(0, -1, 0).applyQuaternion(pq0.clone().invert());
      const caps = (G.collide || []).flatMap((n) => (n.endsWith('*') ? this.caps.filter((c) => c.name.startsWith(n.slice(0, -1))) : this.capBy[n] ? [this.capBy[n]] : []))
        .filter((c) => !(G.notOwn && ch.parent && c.a === parent));
      this.chains.push({ ch, G, bones, parent, local, len, restQ, restP, pq0, dl, caps, legs, gw, n: pts.length, x: pts.map((p) => p.clone()), xp: pts.map((p) => p.clone()), goal: pts.map(() => V()), ang: ch.ang });
    }
    // the skirt's ring: hakama chains in order round the body (by their angle), neighbours linked at every level
    const hk = this.chains.filter((c) => c.ch.group === 'hakama');
    hk.sort((a, b) => Math.atan2(a.local[a.n - 1].x, a.local[a.n - 1].z - 0) - Math.atan2(b.local[b.n - 1].x, b.local[b.n - 1].z));
    this.ring = [];
    for (let k = 0; k < hk.length; k++) {
      const A = hk[k], B = hk[(k + 1) % hk.length];
      for (let i = 1; i < Math.min(A.n, B.n); i++) this.ring.push({ A, B, i, L: A.x[i].distanceTo(B.x[i]) });
    }
    this.time = 0; this.steps = 0; this.cost = 0;
  }
  goals() {
    for (const c of this.chains) {
      c.parent.updateWorldMatrix(false, false);
      for (let i = 0; i < c.n; i++) c.goal[i].copy(c.local[i]).applyMatrix4(c.parent.matrixWorld);
      if (c.gw) for (let i = 1; i < c.n; i++) {
        _a.set(0, 0, 0); let ws = 0;
        for (const q of c.gw[i]) { _b.copy(q.p).applyMatrix4(q.inv).applyMatrix4(q.b.matrixWorld); _a.addScaledVector(_b, q.w); ws += q.w; }
        if (ws > 0) c.goal[i].copy(_a.divideScalar(ws));
      }
      else if (c.legs) for (let i = 1; i < c.n; i++) {
        let kk = 0; _a.set(0, 0, 0);
        for (const L of c.legs) { if (!L.k) continue; _b.copy(L.local[i]).applyMatrix4(L.b.matrixWorld); _a.addScaledVector(_b, L.k); kk += L.k; }
        c.goal[i].multiplyScalar(1 - kk).add(_a);
      }
    }
  }
  // the chains on their rigid pose, at rest (a clip's start, a jump in time)
  reset() {
    this.goals();
    for (const c of this.chains) for (let i = 0; i < c.n; i++) { c.x[i].copy(c.goal[i]); c.xp[i].copy(c.goal[i]); }
    this.time = 0;
  }
  settle(n) { for (let k = 0; k < n; k++) this.step(); }
  step() {
    const t0 = performance.now(), h = this.h, g = this.cfg.gravity ?? 9.81;
    updateCapsules(this.caps); this.goals();
    const floorY = this.cfg.floor ?? 0;
    for (const c of this.chains) {
      const G = c.G;
      // gravity against the bind pose: zero while the parent is turned as at rest
      c.parent.getWorldQuaternion(_q); _d.copy(c.dl).applyQuaternion(_q); // (the rest pose's down, turned with the parent)
      const gs = g * (G.gravity ?? 1), abs = G.gravityMode === 'absolute';
      const gx = abs ? 0 : -_d.x * gs, gy = abs ? -gs : (-1 - _d.y) * gs, gz = abs ? 0 : -_d.z * gs;
      c.x[0].copy(c.goal[0]); c.xp[0].copy(c.goal[0]);
      for (let i = 1; i < c.n; i++) {
        const x = c.x[i], xp = c.xp[i], k = G.stiff[Math.min(i - 1, G.stiff.length - 1)], dmp = G.damp;
        const vx = (x.x - xp.x) * (1 - dmp), vy = (x.y - xp.y) * (1 - dmp), vz = (x.z - xp.z) * (1 - dmp);
        xp.copy(x);
        x.x += vx + gx * h * h; x.y += vy + gy * h * h; x.z += vz + gz * h * h;
        x.x += (c.goal[i].x - x.x) * k; x.y += (c.goal[i].y - x.y) * k; x.z += (c.goal[i].z - x.z) * k;
      }
    }
    for (let it = 0; it < (this.cfg.iterations || 3); it++) {
      // the skirt's ring
      for (const r of this.ring) {
        const a = r.A.x[r.i], b = r.B.x[r.i]; _a.subVectors(b, a); const d = _a.length();
        const G = r.A.G, mx = r.L * (G.ringMax || 1.3), mn = r.L * (G.ringMin || 0.5);
        if (d > mx || d < mn) { const e = (d - (d > mx ? mx : mn)) / (d || 1) * 0.5; a.addScaledVector(_a, e); b.addScaledVector(_a, -e); }
      }
      for (const c of this.chains) this.solveChain(c, floorY, it);
    }
    this.time += h; this.steps++;
    this.cost += performance.now() - t0;
  }
  solveChain(c, floorY, it) {
    const G = c.G, x = c.x;
    for (let i = 1; i < c.n; i++) {
      // bone length
      { _a.subVectors(x[i], x[i - 1]); const d = _a.length() || 1e-9, L = clampLen(G, c.len[i - 1], d); x[i].copy(x[i - 1]).addScaledVector(_a, L / d); }
      // the angle limit from the rigid pose's direction (per bone down the chain, or one for all)
      const MA = Array.isArray(G.maxAngle) ? G.maxAngle[Math.min(i - 1, G.maxAngle.length - 1)] : G.maxAngle;
      if (MA) {
        _b.subVectors(c.goal[i], c.goal[i - 1]).normalize(); _a.subVectors(x[i], x[i - 1]).normalize();
        if (_a.dot(_b) < Math.cos(MA * Math.PI / 180)) { limitTurn(_b, _a, MA); x[i].copy(x[i - 1]).addScaledVector(_a, c.len[i - 1]); }
      }
      // the bend between this bone and the one above, against the rest bend (no sharp kinks: the skin between two bones
      // folds into a crease when they bend hard)
      if (G.maxBend && i >= 2) {
        _b.subVectors(x[i - 1], x[i - 2]).normalize();
        _d.subVectors(c.goal[i], c.goal[i - 1]).normalize(); _c.subVectors(c.goal[i - 1], c.goal[i - 2]).normalize();
        _q.setFromUnitVectors(_c, _b); _d.applyQuaternion(_q);          // (the rest bend carried onto the bone above)
        _a.subVectors(x[i], x[i - 1]).normalize();
        if (_a.dot(_d) < Math.cos(G.maxBend * Math.PI / 180)) { limitTurn(_d, _a, G.maxBend); x[i].copy(x[i - 1]).addScaledVector(_a, c.len[i - 1]); }
      }
      // the body: the point and its bone's middle out of the capsules
      for (const cap of c.caps) {
        const r = cap.r + (G.margin || 0);
        let dd = capDist(cap, x[i], _c);
        if (dd < r) { _d.subVectors(x[i], _c); if (dd < 1e-6) _d.set(0, 0, 1), dd = 1; x[i].copy(_c).addScaledVector(_d, r / dd); }
        _b.addVectors(x[i - 1], x[i]).multiplyScalar(0.5);
        dd = capDist(cap, _b, _c);
        if (dd < r) { _d.subVectors(_b, _c); if (dd < 1e-6) _d.set(0, 0, 1), dd = 1; const push = r - dd; x[i].addScaledVector(_d, (2 * push) / dd); }
      }
      if (x[i].y < floorY + (G.floorGap || 0.02)) x[i].y = floorY + (G.floorGap || 0.02);
      // (a sleeve's bag hangs along the arm: it may only swing round the arm's own line, like a door on its hinge)
      if (G.hinge) {
        c.parent.getWorldQuaternion(_q); _c.set(0, 1, 0).applyQuaternion(_q);
        _b.subVectors(c.goal[i], c.goal[i - 1]).normalize(); _a.subVectors(x[i], x[i - 1]);
        const phi = hingeAngle(_c, _b, _a), d = _a.length() || 1e-9;
        const b0 = Math.acos(Math.max(-1, Math.min(1, _b.dot(_c))));          // (the rest angle to the arm)
        _q.setFromAxisAngle(_c, phi); _b.applyQuaternion(_q);
        // (G.hingeSwing: the bag may also slide along the arm - toward the shoulder when the arm is raised - this far)
        if (G.hingeSwing) {
          const sw = G.hingeSwing * Math.PI / 180, bt = Math.acos(Math.max(-1, Math.min(1, _a.dot(_c) / d)));
          const be = Math.min(b0 + sw, Math.max(b0 - sw, bt));
          _d.copy(_b).addScaledVector(_c, -_b.dot(_c)); const pl = _d.length();
          if (pl > 1e-6) _b.copy(_c).multiplyScalar(Math.cos(be)).addScaledVector(_d, Math.sin(be) / pl);
        }
        x[i].copy(x[i - 1]).addScaledVector(_b, c.len[i - 1]);
      }
    }
    // (exact lengths last: the bones are rigid)
    for (let i = 1; i < c.n; i++) { _a.subVectors(x[i], x[i - 1]); const d = _a.length() || 1e-9; x[i].copy(x[i - 1]).addScaledVector(_a, clampLen(G, c.len[i - 1], d) / d); }
  }
  // the chain points onto the bones: each bone keeps its parent's twist and turns the shortest way onto its segment
  apply() {
    for (const c of this.chains) {
      // (every bone of a chain is its parent's child: its place, turn and length set from its two chain points)
      const pq = c.parent.getWorldQuaternion(new THREE.Quaternion()), pinv = c.parent.matrixWorld.clone().invert(), pqi = pq.clone().invert();
      for (let k = 0; k < c.bones.length; k++) {
        const b = c.bones[k];
        b.position.copy(c.x[k]).applyMatrix4(pinv);
        const wq = pq.clone().multiply(c.restQ[k]);              // (rigid world turn)
        _a.set(0, 1, 0).applyQuaternion(wq);                       // (its direction)
        _b.subVectors(c.x[k + 1], c.x[k]).normalize();             // (the simulated one)
        if (c.G.hinge) {
          // (round the arm first, then the slide along it: no twist of the bag about itself)
          c.parent.getWorldQuaternion(_q2); _c.set(0, 1, 0).applyQuaternion(_q2); _q.setFromAxisAngle(_c, hingeAngle(_c, _a, _b));
          _d.copy(_a).applyQuaternion(_q); _q2.setFromUnitVectors(_d, _b); _q.premultiply(_q2);
        }
        else _q.setFromUnitVectors(_a, _b);
        const nq = _q.multiply(wq);
        b.quaternion.copy(pqi).multiply(nq);
        b.scale.set(1, c.G.lenRange ? c.x[k + 1].distanceTo(c.x[k]) / c.len[k] : 1, 1);
      }
    }
  }
  // back to the rigid pose (cloth physics off)
  rest() { for (const c of this.chains) c.bones.forEach((b, k) => { b.position.copy(c.restP[k]); b.quaternion.copy(c.restQ[k]); b.scale.set(1, 1, 1); }); }
}
