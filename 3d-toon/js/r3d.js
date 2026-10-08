
























(function (ND) {
  'use strict';



  const Q = (() => { try { const s = location.search || ''; return /[?&]ucb=toon(&|$)/.test(s) ? s + '&r3d=1&r3dglb=akane&r3dlook=ucb' : s; } catch (e) { return ''; } })();
  ND.r3dQ = Q;
  if (!/[?&]r3d=1(&|$)/.test(Q)) return;
  const UCB = /[?&]ucb=toon(&|$)/.test(Q);
  const UCBM = UCB && /[?&]ucbm=lod2(&|$)/.test(Q) ? '-lod2' : '';
  const G = ND.game, D25 = ND.depth25, cam = ND.cam, scene = ND.scene;
  if (!G || !D25 || !cam || !scene) return;

  const VIEWQ = /[?&]r3dview=(-?[\d.]+)(?:,(-?[\d.]+))?(?:,([\d.]+))?/.exec(Q);
  const NOCAM = /[?&]r3dcam=0(&|$)/.test(Q), NOPLANT = /[?&]r3dplant=0(&|$)/.test(Q);
  const R3 = (ND.r3d = { on: true, why: '', frames: 0, gl: null, rig: null, last: null, parts: 0, tris: 0 });
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u, 0, 1));
  const DEG = Math.PI / 180;


  const v3 = (x, y, z) => ({ x, y, z });
  const sub = (a, b) => v3(a.x - b.x, a.y - b.y, a.z - b.z);
  const add = (a, b) => v3(a.x + b.x, a.y + b.y, a.z + b.z);
  const mul = (a, k) => v3(a.x * k, a.y * k, a.z * k);
  const madd = (a, b, k) => v3(a.x + b.x * k, a.y + b.y * k, a.z + b.z * k);
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const cross = (a, b) => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  const len = (a) => Math.hypot(a.x, a.y, a.z);
  const norm = (a) => { const l = len(a) || 1; return v3(a.x / l, a.y / l, a.z / l); };
  const lerp = (a, b, t) => v3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);

  const rotAx = (v, k, a) => { const c = Math.cos(a), s = Math.sin(a), d = dot(k, v), x = cross(k, v); return v3(v.x * c + x.x * s + k.x * d * (1 - c), v.y * c + x.y * s + k.y * d * (1 - c), v.z * c + x.z * s + k.z * d * (1 - c)); };
  const hex = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return [0.5, 0.5, 0.5]; const v = parseInt(m[1], 16); return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]; };
  const rgbs = (s) => { const p = String(s || '255,255,255').split(',').map(Number); return [p[0] / 255, p[1] / 255, p[2] / 255]; };



  function mesh() { return { p: [], n: [], i: [] }; }

  function cylG(r0, r1, seg = 10, k = 1) {
    const m = mesh(), dr = r0 - r1;
    for (let j = 0; j <= 1; j++) for (let s = 0; s < seg; s++) {
      const a = (s / seg) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), r = j ? r1 : r0;
      m.p.push(c * r, j, sn * r * k);
      const n = norm(v3(c, dr, sn / k)); m.n.push(n.x, n.y, n.z);
    }
    for (let s = 0; s < seg; s++) { const a = s, b = (s + 1) % seg, c = a + seg, d = b + seg; m.i.push(a, c, b, b, c, d); }

    for (let j = 0; j <= 1; j++) {
      const base = m.p.length / 3, r = j ? r1 : r0, y = j;
      m.p.push(0, y, 0); m.n.push(0, j ? 1 : -1, 0);
      for (let s = 0; s < seg; s++) { const a = (s / seg) * Math.PI * 2; m.p.push(Math.cos(a) * r, y, Math.sin(a) * r * k); m.n.push(0, j ? 1 : -1, 0); }
      for (let s = 0; s < seg; s++) m.i.push(base, base + 1 + s, base + 1 + ((s + 1) % seg));
    }
    return m;
  }

  function latheG(prof, seg = 16, kz = 1) {
    const m = mesh(), n = prof.length;
    for (let j = 0; j < n; j++) {
      const [y, r] = prof[j], a0 = prof[Math.max(0, j - 1)], a1 = prof[Math.min(n - 1, j + 1)];
      const dr = (a1[1] - a0[1]) / Math.max(1e-4, a1[0] - a0[0]);
      for (let k = 0; k < seg; k++) {
        const a = (k / seg) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
        m.p.push(c * r, y, sn * r * kz);
        const nn = norm(v3(c, -dr, sn / kz)); m.n.push(nn.x, nn.y, nn.z);
      }
    }
    for (let j = 0; j < n - 1; j++) for (let k = 0; k < seg; k++) { const a = j * seg + k, b = j * seg + ((k + 1) % seg), c = a + seg, d = b + seg; m.i.push(a, c, b, b, c, d); }
    for (const [j, ny] of [[0, -1], [n - 1, 1]]) {
      const base = m.p.length / 3, [y, r] = prof[j];
      m.p.push(0, y, 0); m.n.push(0, ny, 0);
      for (let k = 0; k < seg; k++) { const a = (k / seg) * Math.PI * 2; m.p.push(Math.cos(a) * r, y, Math.sin(a) * r * kz); m.n.push(0, ny, 0); }
      for (let k = 0; k < seg; k++) m.i.push(base, base + 1 + k, base + 1 + ((k + 1) % seg));
    }
    return m;
  }

  function sphG(rx, ry = rx, rz = rx, ws = 12, hs = 8, cut = -1) {
    const m = mesh();
    const t0 = Math.acos(clamp(cut, -1, 1));
    for (let h = 0; h <= hs; h++) {
      const t = (h / hs) * t0, y = Math.cos(t), r = Math.sin(t);
      for (let w = 0; w <= ws; w++) {
        const a = (w / ws) * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
        m.p.push(x * rx, y * ry, z * rz);
        const n = norm(v3(x / rx, y / ry, z / rz)); m.n.push(n.x, n.y, n.z);
      }
    }
    for (let h = 0; h < hs; h++) for (let w = 0; w < ws; w++) {
      const a = h * (ws + 1) + w, b = a + 1, c = a + ws + 1, d = c + 1;
      m.i.push(a, c, b, b, c, d);
    }
    if (cut > -1) {
      const base = m.p.length / 3, y = cut * ry, r = Math.sqrt(1 - cut * cut);
      m.p.push(0, y, 0); m.n.push(0, -1, 0);
      for (let w = 0; w < ws; w++) { const a = (w / ws) * Math.PI * 2; m.p.push(Math.cos(a) * r * rx, y, Math.sin(a) * r * rz); m.n.push(0, -1, 0); }
      for (let w = 0; w < ws; w++) m.i.push(base, base + 1 + w, base + 1 + ((w + 1) % ws));
    }
    return m;
  }

  function boxG(w, h, d) {
    const m = mesh(), X = w / 2, Y = h / 2, Z = d / 2;
    const F = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 1, 0], [0, 0, 1]], [[0, 1, 0], [1, 0, 0], [0, 0, 1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [1, 0, 0], [0, 1, 0]]];
    for (const [n, u, v] of F) {
      const base = m.p.length / 3;
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        m.p.push((n[0] + u[0] * a + v[0] * b) * X, (n[1] + u[1] * a + v[1] * b) * Y, (n[2] + u[2] * a + v[2] * b) * Z); m.n.push(n[0], n[1], n[2]);
      }
      m.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    return m;
  }

  function shellG(r0, r1, h, seg = 14, kz = 1) {
    const m = mesh(), dr = (r0 - r1) / h;
    for (let side = 0; side < 2; side++) {
      const base = m.p.length / 3, sg = side ? -1 : 1, off = side ? -0.6 : 0;
      for (let j = 0; j <= 1; j++) for (let s = 0; s < seg; s++) {
        const a = (s / seg) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), r = (j ? r1 : r0) + off;
        m.p.push(c * r, j * h, sn * r * kz);
        const n = norm(v3(c, dr, sn / kz)); m.n.push(n.x * sg, n.y * sg, n.z * sg);
      }
      for (let s = 0; s < seg; s++) { const a = base + s, b = base + ((s + 1) % seg), c = a + seg, d = b + seg; m.i.push(a, c, b, b, c, d); }
    }
    return m;
  }

  function bladeG(L, w, t, sori) {
    const m = mesh(), N = 14;
    for (let i = 0; i <= N; i++) {
      const q = i / N, y = q * L, off = -sori * 4 * q * (1 - q), ww = w * (1 - Math.pow(q, 6) * 0.95), tt = t * (1 - q * 0.6);
      m.p.push(off + ww, y, 0, off, y, tt, off - ww * 0.9, y, 0, off, y, -tt);
    }
    m.p.push(-sori * 0.1, L + 4, 0);
    const tip = N * 4 + 4;
    for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) { const a = i * 4 + k, b = i * 4 + ((k + 1) % 4), c = a + 4, d = b + 4; m.i.push(a, c, b, b, c, d); }
    for (let k = 0; k < 4; k++) m.i.push(N * 4 + k, tip, N * 4 + ((k + 1) % 4));
    m.i.push(0, 1, 2, 0, 2, 3);
    flatNormals(m);
    return m;
  }

  function flatNormals(m) {
    const P = [], N = [], I = [];
    for (let t = 0; t < m.i.length; t += 3) {
      const a = m.i[t] * 3, b = m.i[t + 1] * 3, c = m.i[t + 2] * 3;
      const A = v3(m.p[a], m.p[a + 1], m.p[a + 2]), B = v3(m.p[b], m.p[b + 1], m.p[b + 2]), C = v3(m.p[c], m.p[c + 1], m.p[c + 2]);
      const n = norm(cross(sub(B, A), sub(C, A)));
      for (const V of [A, B, C]) { P.push(V.x, V.y, V.z); N.push(n.x, n.y, n.z); I.push(I.length); }
    }
    m.p = P; m.n = N; m.i = I;

    m.flat = true;
  }

  function fixWinding(m) {
    const I = m.i, p = m.p, n = m.n;
    let centre = v3(0, 0, 0);
    for (let k = 0; k < p.length; k += 3) centre = add(centre, v3(p[k], p[k + 1], p[k + 2]));
    centre = mul(centre, 3 / Math.max(3, p.length));
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const A = v3(p[a], p[a + 1], p[a + 2]), B = v3(p[b], p[b + 1], p[b + 2]), C = v3(p[c], p[c + 1], p[c + 2]);
      const fn = cross(sub(B, A), sub(C, A));
      let vn = v3(n[a] + n[b] + n[c], n[a + 1] + n[b + 1] + n[c + 1], n[a + 2] + n[b + 2] + n[c + 2]);
      if (m.flat) {
        const mid = mul(add(add(A, B), C), 1 / 3); vn = sub(mid, centre);
        if (dot(fn, vn) < 0) { for (const q of [a, b, c]) { n[q] = -n[q]; n[q + 1] = -n[q + 1]; n[q + 2] = -n[q + 2]; } }
      }
      if (dot(fn, vn) < 0) { const s = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = s; }
    }
    return m;
  }



  const MAXP = 44;
  function buildRig(f) {
    const c = f.col, acc = f.ch.acc, wpn = f.wpn || ND.LEN;
    const parts = [null];
    const P = [], N = [], C = [], I = [], IDX = [];
    const add_ = (name, m, col, ink = 1) => {
      fixWinding(m);
      const pi = parts.length, base = P.length / 3, rgb = Array.isArray(col) ? col : hex(col);
      for (let k = 0; k < m.p.length; k += 3) { P.push(m.p[k], m.p[k + 1], m.p[k + 2]); N.push(m.n[k], m.n[k + 1], m.n[k + 2]); C.push(rgb[0], rgb[1], rgb[2], ink); IDX.push(pi); }
      for (const q of m.i) I.push(base + q);
      parts.push(name);
      return pi;
    };
    const R = { ch: f.ch, col: f.col, acc, wpn, id: {} };
    const id = R.id;
    const leg = c.hakama || c.cloth, legB = c.hakamaDark || c.clothDark, skin = c.skin || '#c89c81';
    const hair = '#141012', ak = acc === 'akane', kasa = acc === 'kasa';

    id.torso = add_('torso', latheG([[0, 0.92], [0.2, 1], [0.5, 0.9], [0.82, 1.02], [1, 0.94]], 18), c.cloth);
    id.chest = add_('chest', sphG(1, 0.62, 1, 16, 8, 0), c.cloth);
    id.obi = add_('obi', cylG(1, 1, 12), c.accent, 0.8);
    id.collar = add_('collar', shellG(1, 0.7, 1, 12), ak ? c.clothHi || c.cloth : c.clothDark, 0.7);
    id.neck = add_('neck', cylG(4.8, 4.4, 8), ak ? skin : c.clothDark);
    id.head = add_('head', sphG(10.6, 12, 10.2, 18, 12), skin);
    if (ak) {
      id.hair = add_('hair', sphG(11.6, 12.8, 11.2, 14, 8, -0.1), hair);
      id.bun = add_('bun', sphG(5, 5, 5, 10, 8), hair, 0.6);
      id.fringe = add_('fringe', sphG(3.4, 3.6, 9.2, 12, 8), hair, 0.6);
      id.ribbon = add_('ribbon', boxG(7, 2.4, 9), c.accent, 0.5);
      id.tasA = add_('tasA', cylG(1.3, 1.3, 6), c.accent, 0.4);
      id.tasB = add_('tasB', cylG(1.3, 1.3, 6), c.accent, 0.4);
    } else if (kasa) {
      id.hat = add_('hat', shellG(29, 3, 11, 16), '#8a7650', 0.9);
      id.hatTop = add_('hatTop', sphG(4, 3, 4, 8, 4, 0), '#6f5d3c', 0.5);
      id.hair = add_('hood', sphG(11.4, 12.8, 11, 14, 8, -0.1), c.clothDark);
      id.mask = add_('mask', sphG(11.1, 6.4, 10.9, 14, 6), c.clothDark, 0.6);
    } else {
      id.hair = add_('hair', sphG(11.6, 12.8, 11.2, 14, 8, -0.05), c.clothDark);
    }
    id.eyeN = add_('eyeN', boxG(1.2, 1.9, 2.2), '#0a0809', 0);
    id.eyeF = add_('eyeF', boxG(1.2, 1.9, 2.2), '#0a0809', 0);
    


    const wide = ak ? 1.3 : 1, flare = ak ? 1.32 : 1;
    const TH = ak ? [[0, 10.4], [0.5, 11.6], [1, 12]] : [[0, 10.2], [0.4, 11], [1, 9.4]];
    const SH = ak ? [[0, 12], [0.6, 13.4], [0.94, 14.6], [1, 12.8]] : [[0, 9.8], [0.3, 10.2], [0.85, 8.2], [1, 7.2]];
    const sc = (P, k) => P.map(([y, r]) => [1 - y, r * k]);
    id.thighF = add_('thighF', latheG(TH.map(([y, r]) => [y, r * wide]), 16), leg); id.shinF = add_('shinF', latheG(SH.map(([y, r]) => [y, r * (ak ? 1.12 : 1)]), 16), leg);
    id.thighB = add_('thighB', latheG(TH.map(([y, r]) => [y, r * wide * 0.96]), 16), legB); id.shinB = add_('shinB', latheG(SH.map(([y, r]) => [y, r * (ak ? 1.08 : 0.97)]), 16), legB);
    id.kneeF = add_('kneeF', sphG(11.2 * wide, 11.2 * wide, 11.2 * wide, 16, 10), leg); id.kneeB = add_('kneeB', sphG(10.8 * wide, 10.8 * wide, 10.8 * wide, 16, 10), legB);
    id.hipBall = add_('hipBall', sphG(1, 1, 1, 16, 10), leg);
    id.skirt = add_('skirt', shellG(ak ? 1.42 : 1.2, 1, 1, 18), leg);
    id.footF = add_('footF', sphG(9.4, 4, 5, 12, 8), '#2a242c', 0.8); id.footB = add_('footB', sphG(9.4, 4, 5, 12, 8), '#1e1a21', 0.8);



    const SL = ak ? [[0, 8.4], [0.5, 10.4], [0.88, 10.9], [1, 9.6]] : [[0, 8.2], [0.6, 10], [0.95, 11.6], [1, 10.8]], FA = [[0, 5], [0.35, 5.5], [1, 4.1]];
    id.uArmF = add_('uArmF', latheG(SL, 16), c.cloth); id.fArmF = add_('fArmF', latheG(FA, 12), c.wrap);
    id.uArmB = add_('uArmB', latheG(SL.map(([y, r]) => [y, r * 0.96]), 16), c.clothDark); id.fArmB = add_('fArmB', latheG(FA.map(([y, r]) => [y, r * 0.96]), 12), c.wrapDark);
    id.elF = add_('elF', sphG(5.3, 5.3, 5.3, 12, 8), c.wrap, 0.7); id.elB = add_('elB', sphG(5.1, 5.1, 5.1, 12, 8), c.wrapDark, 0.7);
    id.handF = add_('handF', sphG(4.9, 6.2, 4.9, 12, 8), '#2a2026', 0.7); id.handB = add_('handB', sphG(4.6, 5.9, 4.6, 12, 8), '#231b20', 0.7);
    id.shoF = add_('shoF', sphG(8.8, 8.8, 8.8, 14, 8), c.cloth); id.shoB = add_('shoB', sphG(8.4, 8.4, 8.4, 14, 8), c.clothDark);

    const BL = wpn.blade, HL = wpn.handle;
    id.tsuka = add_('tsuka', cylG(2.6, 2.5, 8), '#17131a', 0.5);
    id.tsuba = add_('tsuba', cylG(6.6, 6.6, 14), '#3b3530', 0.4);
    id.blade = add_('blade', bladeG(BL, wpn.type === 'naginata' ? 2.6 : 2.2, 0.8, (3.2 * BL) / 96), '#dfe6ef', 0);
    if (wpn.iai) id.saya = add_('saya', cylG(3, 2.7, 8), '#2a1416', 0.5);
    else if (kasa) id.saya = add_('saya', cylG(3.2, 2.8, 8), '#1d1b20', 0.5);
    R.HL = HL; R.BL = BL;
    if (parts.length > MAXP) throw new Error('r3d: too many parts ' + parts.length);
    R.n = parts.length; R.names = parts;
    R.P = new Float32Array(P); R.N = new Float32Array(N); R.C = new Float32Array(C); R.IDX = new Float32Array(IDX); R.I = new Uint16Array(I);
    R.M = new Float32Array(MAXP * 12);

    R.M[0] = 1; R.M[5] = 1; R.M[10] = 1;
    R.tris = I.length / 3;
    return R;
  }


  function setM(R, i, X, Y, Z, o) {
    const M = R.M, k = i * 12;
    M[k] = X.x; M[k + 1] = Y.x; M[k + 2] = Z.x; M[k + 3] = o.x;
    M[k + 4] = X.y; M[k + 5] = Y.y; M[k + 6] = Z.y; M[k + 7] = o.y;
    M[k + 8] = X.z; M[k + 9] = Y.z; M[k + 10] = Z.z; M[k + 11] = o.z;
  }
  const hide = (R, i) => { if (i) R.M.fill(0, i * 12, i * 12 + 12); };
  const EX = v3(1, 0, 0), EY = v3(0, 1, 0), EZ = v3(0, 0, 1);

  function seg(R, i, a, b, ref) {
    if (!i) return;
    const Y = sub(b, a), l = len(Y) || 1e-3, y = mul(Y, 1 / l);
    let r = ref || (Math.abs(y.z) < 0.9 ? EZ : EX);
    let X = cross(y, r); const xl = len(X);
    if (xl < 1e-4) { r = EX; X = cross(y, r); }
    X = norm(X); const Z = cross(X, y);
    setM(R, i, X, Y, Z, a);
  }
  function at(R, i, p, s = 1, X0, Y0) {
    if (!i) return;
    if (X0 && Y0) { const Y = norm(Y0), X = norm(sub(X0, mul(Y, dot(X0, Y)))), Z = cross(X, Y); setM(R, i, mul(X, s), mul(Y, s), mul(Z, s), p); return; }
    setM(R, i, v3(s, 0, 0), v3(0, s, 0), v3(0, 0, s), p);
  }
  function basis(R, i, o, X, Y, Z, sx, sy, sz) { if (i) setM(R, i, mul(X, sx), mul(Y, sy), mul(Z, sz), o); }



  const SK = new WeakMap(), SWAY = new WeakMap();





  const CLEAR = !/[?&]r3dclear=0(&|$)/.test(Q), CLR = new WeakMap();
  function segDist3(p, a, b) { const ab = sub(b, a), t = clamp(dot(sub(p, a), ab) / (dot(ab, ab) || 1), 0, 1); return len(sub(p, madd(a, ab, t))); }
  function ownPen(o, h, u, BL) {
    let m = -1e9;
    const caps = [[o.hip, o.neck, 11], [o.hipF, o.knF, 9], [o.hipB, o.knB, 9]];
    for (let i = 2; i <= 12; i++) { const p = madd(h, u, 8 + ((BL - 8) * i) / 12); for (const [a, b, r] of caps) if (a && b) m = Math.max(m, r - segDist3(p, a, b)); }
    return m;
  }
  function bladeClear(f, o) {
    const S = CLR.get(f) || { a: 0, ax: null };
    CLR.set(f, S);
    const A = f.state === 'atk' ? f.atk : null, W0 = A && (A.hits && A.hits.length ? A.hits : A.active ? [A.active] : null);
    const hitting = !!(W0 && W0.some((q) => f.st >= q[0] - 0.05 && f.st <= q[1] + 0.12));
    const BL = (f.wpn && f.wpn.blade) || 96;

    const meet = { lock: 1, dbind: 1, block: 1, parry: 1, clash: 1, recoil: 1 }[f.state] || (f.opp && { lock: 1, dbind: 1 }[f.opp.state]) || (ND.duel && ND.duel.bindGeom && ND.duel.bindGeom(f));
    if (!CLEAR || !o.inHand || o.inside || o.noSword || hitting || meet || f.dead || !o.bh || !o.bu || f.wpn.fist || f.wpn.none || f.wpn.type === 'tessen' || f.wpn.type === 'yumi' || f.wpn.type === 'kusarigama') { S.a *= 0.6; if (Math.abs(S.a) < 0.01) S.a = 0; return; }
    const h = o.bh, u0 = o.bu;


    let ax = cross(u0, EZ); if (len(ax) < 0.2) ax = cross(u0, EY); ax = norm(ax);
    const p0 = ownPen(o, h, u0, BL);
    let best = 0;
    if (p0 > 2) {
      let bc = 1e9;
      for (let i = 1; i <= 16; i++) for (const sg of [1, -1]) {
        const a = sg * i * 0.08, pn = ownPen(o, h, rotAx(u0, ax, a), BL);
        if (pn <= 0) { const c = Math.abs(a) + Math.abs(a - S.a) * 0.5; if (c < bc) { bc = c; best = a; } }
      }
    }

    const k = Math.abs(best) > Math.abs(S.a) ? 0.6 : 0.25;
    S.a += (best - S.a) * k;
    if (Math.abs(S.a) < 0.005) { S.a = 0; return; }
    o.bu = norm(rotAx(u0, ax, S.a)); if (o.be) o.be = norm(rotAx(o.be, ax, S.a));
    R3.nClear = (R3.nClear || 0) + 1;
  }

  function skeleton(f) { const o = skeleton0(f); if (o) { bladeClear(f, o); if (UCB_TIP && o.src === 'mocap') tipSmooth(f, o); } return o; }







  const UCB_YAW = UCB && GQ0('ucbyaw', '1') !== '0', UCB_TIP = UCB && GQ0('ucbtip', '1') !== '0';
  function GQ0(k, d) { const m = new RegExp('[?&]' + k + '=([\w.]+)').exec(Q); return m ? m[1] : d; }
  const YAW_MAX = 22 * DEG, YAW_SOFT = 26 * DEG;
  const UPPER = ['chest', 'neck', 'head', 'shR', 'shL', 'elR', 'elL', 'wrR', 'wrL', 'haR', 'haL'], HALF = ['hipR', 'hipL'];
  const YP = new WeakMap();
  function yawClamp(P) {
    const cf = P.cf; if (!cf || !P.hip) return P;
    const ph = Math.atan2(cf[2], cf[0]);

    let ph2 = ph;
    const soft = (x) => YAW_MAX * (1 - Math.exp(-x / YAW_SOFT));



    if (ph < 0 && ph >= -Math.PI / 2) ph2 = -soft(-ph);
    else if (ph < -Math.PI / 2) { const t = clamp((-Math.PI / 2 - ph) / (Math.PI / 2), 0, 1), e = t * t * (3 - 2 * t), a0 = -soft(Math.PI / 2); ph2 = a0 + (Math.PI - a0) * e; }
    const d = ph2 - ph;
    if (Math.abs(d) < 1e-4) return P;
    let Q = YP.get(P); if (!Q) YP.set(P, (Q = {}));
    for (const k in P) Q[k] = P[k];
    const px = P.hip[0], pz = P.hip[2];
    const rot = (v, a, pos) => { if (!v) return v; const c = Math.cos(a), s = Math.sin(a), x = pos ? v[0] - px : v[0], z = pos ? v[2] - pz : v[2]; return [(pos ? px : 0) + x * c - z * s, v[1], (pos ? pz : 0) + x * s + z * c]; };
    for (const k of UPPER) if (P[k]) Q[k] = rot(P[k], d, true);
    for (const k of HALF) if (P[k]) Q[k] = rot(P[k], d / 3, true);
    Q.cf = rot(P.cf, d, false); if (P.hf) Q.hf = rot(P.hf, d, false);
    if (P.blade) Q.blade = { h: rot(P.blade.h, d, true), u: rot(P.blade.u, d, false), e: rot(P.blade.e, d, false) };
    if (P.saya) Q.saya = { a: rot(P.saya.a, d / 3, true), u: rot(P.saya.u, d / 3, false), L: P.saya.L };
    R3.yawClamped = (R3.yawClamped || 0) + 1; R3.yawLast = +(d / DEG).toFixed(1);
    return Q;
  }



  const TIP_MAX = 24 * DEG, TS = new WeakMap();
  function tipSmooth(f, o) {
    const clk = ND.simClock || 0;
    let T = TS.get(f); if (!T) TS.set(f, (T = { clk: -1, u: null, e: null, pu: null, pe: null }));
    if (T.clk !== clk) { T.pu = T.u; T.pe = T.e; T.clk = clk; }
    let u = o.bu, e = o.be;
    if (T.pu && o.inHand) {
      const a = Math.acos(clamp(dot(T.pu, u), -1, 1));
      if (a > TIP_MAX) {
        const step = Math.max(TIP_MAX, a * 0.25), ax0 = cross(T.pu, u), al = len(ax0);
        const ax = al > 1e-5 ? mul(ax0, 1 / al) : (Math.abs(T.pu.y) < 0.9 ? norm(cross(T.pu, EY)) : norm(cross(T.pu, EX)));
        u = norm(rotAx(T.pu, ax, step));
        e = T.pe ? norm(sub(rotAx(T.pe, ax, step), mul(u, dot(rotAx(T.pe, ax, step), u)))) : e;
        R3.tipSmoothed = (R3.tipSmoothed || 0) + 1;
      }
    }
    T.u = u; T.e = e; o.bu = u; o.be = e;
  }
  function skeleton0(f) {
    let o = SK.get(f); if (!o) SK.set(f, (o = {}));
    const MD = ND.duel && ND.duel.mocap, rg = MD && MD.pose ? MD.pose(f) : null;
    if (rg && rg.P) {
      const P = UCB_YAW ? yawClamp(rg.P) : rg.P, dir = rg.dir < 0 ? -1 : 1, X0 = rg.x;
      const W = (p) => v3(X0 + p[0] * dir, -p[1], p[2]), Wd = (d) => v3(d[0] * dir, -d[1], d[2]);
      o.src = 'mocap'; o.dir = dir; o.x0 = X0; o.rg = rg;
      o.hip = W(P.hip); o.chest = W(P.chest || P.neck); o.neck = W(P.neck); o.head = W(P.head);
      o.shF = W(P.shR); o.shB = W(P.shL); o.elF = W(P.elR); o.elB = W(P.elL); o.haF = W(P.haR); o.haB = W(P.haL);
      o.hipF = W(P.hipR); o.hipB = W(P.hipL); o.knF = W(P.knR); o.knB = W(P.knL); o.ftF = W(P.ftR); o.ftB = W(P.ftL);
      o.toF = P.toR ? norm(Wd(P.toR)) : v3(dir, 0, 0); o.toB = P.toL ? norm(Wd(P.toL)) : v3(dir, 0, 0);
      o.cf = P.cf ? norm(Wd(P.cf)) : v3(dir, 0, 0); o.hf = P.hf ? norm(Wd(P.hf)) : o.cf;
      const wpn = f.wpn || ND.LEN, B = P.blade;
      o.noSword = !!rg.noSword;
      o.inHand = !!P.armed && !o.noSword; o.inside = !!P.inside;
      o.bladeVis = !P.armed ? 0 : P.bladeVis != null ? clamp(P.bladeVis / wpn.blade, 0, 1) : 1;

      const h = P.armed && !P.inside ? [B.h[0] + B.u[0] * 4, B.h[1] + B.u[1] * 4, B.h[2] + B.u[2] * 4] : B.h;
      o.bh = W(h); o.bu = norm(Wd(B.u)); o.be = norm(Wd(B.e));
      o.saya = P.saya ? { a: W(P.saya.a), u: norm(Wd(P.saya.u)), L: P.saya.L } : null;
      return o;
    }
    const S = D25.pose3d(f, true);
    if (!S) return null;
    const dir = f.dir < 0 ? -1 : 1, W3 = (p) => v3(f.x + p.x * dir, -p.y, p.z), P = S.P;
    o.src = 'keyed'; o.dir = dir; o.x0 = f.x; o.rg = null;
    o.hip = W3(P.hip); o.neck = W3(P.neck); o.head = W3(P.head); o.chest = lerp(o.hip, o.neck, 0.72);
    o.shF = W3(S.shF); o.shB = W3(S.shB);
    o.elF = W3(P.elF); o.haF = W3(P.haF); o.elB = W3(P.elB); o.haB = W3(P.haB);
    const side = rotAx(EZ, EY, -S.psi * 0.55 * dir);
    o.hipF = madd(o.hip, side, 7.5); o.hipB = madd(o.hip, side, -7.5);
    o.knF = W3(P.knF); o.ftF = W3(P.ftF); o.knB = W3(P.knB); o.ftB = W3(P.ftB);
    o.toF = v3(dir, 0, 0); o.toB = v3(dir, 0, 0);
    o.cf = norm(rotAx(v3(dir, 0, 0), EY, -S.psi * dir)); o.hf = o.cf;
    const b = S.blade;
    o.noSword = S.armed === false; o.inHand = !o.noSword && !S.sheathed; o.bladeVis = o.inHand ? 1 - (S.sheathS || 0) : 0; o.inside = o.inHand && (S.sheathS || 0) > 0.01;
    o.bh = W3(b.h); o.bu = norm(v3(b.u.x * dir, -b.u.y, b.u.z)); o.be = norm(v3(b.e.x * dir, -b.e.y, b.e.z));
    if (f.wpn && f.wpn.iai) { const sy = D25.sayaPose(f, S); o.saya = { a: W3(sy.a), u: norm(v3(sy.u.x * dir, -sy.u.y, sy.u.z)), L: sy.L }; } else o.saya = null;
    return o;
  }

  function frame(fw, u) {
    const Y = norm(u); let X = sub(fw, mul(Y, dot(fw, Y)));
    if (len(X) < 1e-3) X = cross(Y, EZ);
    X = norm(X);
    return [X, Y, cross(X, Y)];
  }





  const PL = new WeakMap();
  function ik2(a, t, l1, l2, pole) {
    let d = sub(t, a), dist = len(d);
    const max = (l1 + l2) * 0.999;
    if (dist > max) { t = madd(a, d, max / dist); d = sub(t, a); dist = max; }
    dist = Math.max(dist, 1e-3);
    const u = mul(d, 1 / dist), x = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
    let pp = sub(pole, mul(u, dot(pole, u))); pp = len(pp) > 1e-4 ? norm(pp) : v3(0, 0, 1);
    return { k: madd(madd(a, u, x), pp, h), e: t };
  }
  function plantFeet(f, k) {
    let s = PL.get(f); if (!s) PL.set(f, (s = { F: null, B: null, clk: -1 }));
    const clk = ND.simClock || 0, dt = clk - s.clk;
    if (dt < 0 || dt > 0.25) s.F = s.B = null;
    s.clk = clk;
    const air = !f.onGround || f.dead || f.state === 'launch' || f.state === 'down' || f.state === 'jump' || f.state === 'roll';
    for (const n of ['F', 'B']) {
      const ft = k['ft' + n], hip = k['hip' + n], kn = k['kn' + n];
      let st = s[n];
      if (air || ft.y > 2.5) { s[n] = null; continue; }
      if (!st) { s[n] = { x: ft.x, z: ft.z, step: 0, fx: 0, fz: 0 }; continue; }
      const L1 = len(sub(kn, hip)), L2 = len(sub(ft, kn));
      let lift = 0;
      if (st.step > 0) {
        st.step = Math.max(0, st.step - dt / 0.12);
        const u = ease(1 - st.step);
        st.x = st.fx + (ft.x - st.fx) * u; st.z = st.fz + (ft.z - st.fz) * u; lift = 5 * Math.sin(Math.PI * u);
      } else {
        const far = Math.hypot(ft.x - st.x, ft.z - st.z), reach = len(sub(v3(st.x, ft.y, st.z), hip)) > (L1 + L2) * 0.995;
        if (far > 14 || reach) { st.step = 1; st.fx = st.x; st.fz = st.z; }
      }
      if (Math.hypot(ft.x - st.x, ft.z - st.z) < 0.05 && !lift) continue;
      const r = ik2(hip, v3(st.x, ft.y + lift, st.z), L1, L2, sub(kn, lerp(hip, ft, 0.5)));
      k['kn' + n] = r.k; k['ft' + n] = r.e;
    }
  }




  const DZS = new WeakMap(), DZ_NEAR = 46, DZ_MAX = /[?&]r3ddz=0(&|$)/.test(Q) ? 0 : 17;
  function depthApart(F) {
    if (F.length !== 2) return;
    const dx = Math.abs(F[0].x - F[1].x), want = DZ_MAX * clamp((DZ_NEAR - dx) / (DZ_NEAR * 0.45), 0, 1), clk = ND.simClock || 0;
    F.forEach((f, i) => {
      let s = DZS.get(f); if (!s) DZS.set(f, (s = { z: 0, v: 0, t: clk }));
      const back = clk < s.t, dt = clamp(clk - s.t, 0, 0.05); s.t = clk;
      if (back) { s.z = 0; s.v = 0; }
      if (dt > 0) springTo(s, 'z', 'v', (i ? -1 : 1) * want, 9, dt, 160);
    });
  }
  const shiftZ = (k, dz) => {
    if (!dz) return;
    for (const n of ['hip', 'chest', 'neck', 'head', 'shF', 'shB', 'elF', 'elB', 'haF', 'haB', 'hipF', 'hipB', 'knF', 'knB', 'ftF', 'ftB', 'bh']) if (k[n]) k[n] = v3(k[n].x, k[n].y, k[n].z + dz);
    if (k.saya) k.saya = { a: v3(k.saya.a.x, k.saya.a.y, k.saya.a.z + dz), u: k.saya.u, L: k.saya.L };
  };
  function pose(R, f) {
    if (f.hidden) return null;
    const k = skeleton(f);
    if (!k) return null;
    { const s = DZS.get(f); if (s) shiftZ(k, s.z); }
    const id = R.id;

    const [bx, by, bz] = frame(k.cf, sub(k.chest, k.hip));
    const bl = len(sub(k.chest, k.hip));
    basis(R, id.torso, madd(k.hip, by, -5), bx, by, bz, 9.4, bl + 5, 12.4);
    const [cx, cy, cz] = frame(k.cf, sub(k.neck, k.chest));
    const cl = len(sub(k.neck, k.chest));

    const sw = clamp(len(sub(k.shF, k.shB)) * 0.5, 10, 15);
    basis(R, id.chest, madd(k.chest, cy, cl * 0.25), cx, cy, cz, 10.4, Math.max(6, cl * 0.9), sw + 1);
    basis(R, id.obi, madd(k.hip, by, 3), bx, by, bz, 10.4, 8, 13.4);
    basis(R, id.collar, madd(k.neck, cy, -4), cx, cy, cz, 6.2, 6, 7.2);
    {

      const pz = norm(sub(k.hipF, k.hipB)); let px = norm(cross(EY, pz)); if (dot(px, k.cf) < 0) px = mul(px, -1);


      const sw = SWAY.get(f) || (SWAY.set(f, { x: k.hip.x, z: k.hip.z, ax: 0, az: 0, vx: 0, vz: 0, t: ND.simClock || 0 }), SWAY.get(f));
      const clk = ND.simClock || 0, dt = clamp(clk - sw.t, 0, 0.05); sw.t = clk;
      if (dt > 0) {
        const hvx = (k.hip.x - sw.x) / dt, hvz = (k.hip.z - sw.z) / dt;
        const tx = clamp(-hvx * 0.0009, -0.18, 0.18), tz = clamp(-hvz * 0.0009, -0.12, 0.12), w = 14;
        sw.vx += (w * w * (tx - sw.ax) - 2 * 0.55 * w * sw.vx) * dt; sw.ax = clamp(sw.ax + sw.vx * dt, -0.18, 0.18);
        sw.vz += (w * w * (tz - sw.az) - 2 * 0.55 * w * sw.vz) * dt; sw.az = clamp(sw.az + sw.vz * dt, -0.12, 0.12);
      }
      sw.x = k.hip.x; sw.z = k.hip.z;

      const up = norm(v3(-sw.ax, 1, -sw.az)), top = madd(k.hip, EY, 4), sx2 = norm(sub(px, mul(up, dot(px, up))));
      basis(R, id.skirt, madd(top, up, -24), sx2, up, cross(sx2, up), 11.5, 24, 13.5);
    }
    seg(R, id.neck, k.neck, lerp(k.neck, k.head, 0.6));

    const [hf, hu, hz] = frame(k.hf, sub(k.head, k.neck));
    at(R, id.head, k.head, 1, hf, hu);
    const eyeAt = (side) => madd(madd(madd(k.head, hf, 9.5), hu, 1.4), hz, side * 3.7);
    at(R, id.eyeN, eyeAt(1), 1, hf, hu);
    at(R, id.eyeF, eyeAt(-1), 1, hf, hu);
    if (id.brow) at(R, id.brow, madd(madd(k.head, hf, 9.4), hu, 4.6), 1, hf, hu);

    if (id.hair) at(R, id.hair, madd(madd(k.head, hf, -1.2), hu, 0.4), 1, rotAx(hf, hz, 0.6), rotAx(hu, hz, 0.6));
    if (id.fringe) at(R, id.fringe, madd(madd(k.head, hf, 6.4), hu, 8.4), 1, rotAx(hf, hz, -0.5), rotAx(hu, hz, -0.5));
    if (id.bun) at(R, id.bun, madd(madd(k.head, hf, -11.2), hu, -1.5), 1);
    if (id.ribbon) at(R, id.ribbon, madd(madd(k.head, hf, -13.4), hu, -1.5), 1, hf, hu);
    if (id.hat) { at(R, id.hat, madd(k.head, hu, 5.5), 1, hf, hu); at(R, id.hatTop, madd(k.head, hu, 16), 1, hf, hu); }
    if (id.mask) at(R, id.mask, madd(madd(k.head, hf, 0.5), hu, -6), 1, hf, hu);
    if (id.tasA) {
      seg(R, id.tasA, madd(madd(k.shF, cx, -3), cy, 2), madd(madd(k.hipB, bx, -6), by, 9));
      seg(R, id.tasB, madd(madd(k.shB, cx, -3), cy, 2), madd(madd(k.hipF, bx, -6), by, 9));
    }

    if (!NOPLANT) plantFeet(f, k);
    { const pz = norm(sub(k.hipF, k.hipB)); let px2 = norm(cross(EY, pz)); if (dot(px2, k.cf) < 0) px2 = mul(px2, -1); basis(R, id.hipBall, madd(k.hip, EY, -3), px2, EY, cross(px2, EY), 11 * (R.acc === 'akane' ? 1.25 : 1), 10, 14 * (R.acc === 'akane' ? 1.2 : 1)); }
    seg(R, id.thighF, k.hipF, k.knF); seg(R, id.shinF, k.knF, k.ftF); at(R, id.kneeF, k.knF);
    seg(R, id.thighB, k.hipB, k.knB); seg(R, id.shinB, k.knB, k.ftB); at(R, id.kneeB, k.knB);
    const foot = (i, p, to) => { const t = norm(v3(to.x, 0, to.z)); at(R, i, v3(p.x + t.x * 4.5, Math.max(3.6, p.y + 2.5), p.z + t.z * 4.5), 1, len(t) > 0.1 ? t : v3(k.dir, 0, 0), EY); };
    foot(id.footF, k.ftF, k.toF); foot(id.footB, k.ftB, k.toB);

    const fist = (i, el, ha) => { const d = norm(sub(ha, el)); at(R, i, madd(ha, d, 1.2), 1, cross(d, EZ).x || cross(d, EZ).y ? norm(cross(d, EZ)) : EX, d); };
    seg(R, id.uArmF, k.shF, k.elF); seg(R, id.fArmF, k.elF, k.haF); fist(id.handF, k.elF, k.haF); at(R, id.shoF, k.shF); at(R, id.elF, k.elF);
    seg(R, id.uArmB, k.shB, k.elB); seg(R, id.fArmB, k.elB, k.haB); fist(id.handB, k.elB, k.haB); at(R, id.shoB, k.shB); at(R, id.elB, k.elB);
    weaponPose(R, k);
    return k;
  }
  function weaponPose(R, k) {
    const id = R.id;

    if (R3.wpn) { for (const n of ['tsuka', 'tsuba', 'blade', 'saya']) hide(R, id[n]); return; }
    const [bx, by] = frame(k.cf, sub(k.chest, k.hip)), [cx, cy] = frame(k.cf, sub(k.neck, k.chest));

    const u = k.bu, e = norm(sub(k.be, mul(u, dot(k.be, u)))), fz = norm(cross(e, u)), H = k.bh;
    if (!k.noSword) {
      seg(R, id.tsuka, madd(H, u, -R.HL), H, e);
      at(R, id.tsuba, madd(H, u, -0.8), 1, e, u); { const q = id.tsuba * 12; for (const c of [1, 5, 9]) R.M[q + c] *= 0.24; }

      if (k.slim) for (const i of [id.tsuka, id.tsuba]) { const q = i * 12; for (const c of [0, 2, 4, 6, 8, 10]) R.M[q + c] *= 0.8; }


      if (k.inHand && k.bladeVis > 0.05) setM(R, id.blade, e, k.inside && k.slim ? mul(u, k.bladeVis) : u, fz, madd(H, u, 0.6)); else hide(R, id.blade);
    } else { hide(R, id.tsuka); hide(R, id.tsuba); hide(R, id.blade); }
    if (id.saya) {
      if (R.wpn.iai && k.saya) { seg(R, id.saya, k.saya.a, madd(k.saya.a, k.saya.u, k.saya.L)); if (k.slim) { const q = id.saya * 12; for (const c of [0, 2, 4, 6, 8, 10]) R.M[q + c] *= k.slim; } }
      else if (R.wpn.iai) hide(R, id.saya);
      else {

        const top = madd(madd(k.shB, cx, -9), cy, 12), bot = madd(madd(k.hipF, bx, -12), by, -24);
        if (k.sayaBk) { seg(R, id.saya, k.sayaBk[0], k.sayaBk[1]); const q = id.saya * 12; for (const c of [0, 2, 4, 6, 8, 10]) R.M[q + c] *= 0.85; }
        else seg(R, id.saya, top, bot);
      }
    }
  }


  const ROPE = { P: new Float32Array(4096 * 3), N: new Float32Array(4096 * 3), C: new Float32Array(4096 * 4), X: new Float32Array(4096), I: new Uint16Array(4096 * 6), nv: 0, ni: 0 };
  function ropes(f, S, out) {
    out.nv = 0; out.ni = 0;
    if (!S) return;
    const list = f.ropeList ? f.ropeList() : null;
    if (!list) return;
    const SIDES = 8;
    for (let r = 0; r < list.length; r++) {
      const L = list[r], pts = L.rope && L.rope.p;
      if (!pts || pts.length < 2) continue;
      const sash = L.rope === f.sash, rad = Math.max(0.9, (L.w || 3) * (sash ? 0.5 : 0.62)), col = hex(L.col);
      const z0 = sash ? -10 : -4;
      const n = pts.length;
      if (out.nv + n * SIDES >= 4096 || out.ni + n * SIDES * 6 >= 4096 * 6) break;
      const base = out.nv;
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)];
        let tx = q.x - o.x, ty = -(q.y - o.y); const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const sx = -ty, sy = tx;
        const rr = rad * (1 - 0.55 * (i / (n - 1)));
        const z = z0 + (sash ? -i * 0.8 : -i * 0.5);
        for (let s = 0; s < SIDES; s++) {
          const a = (s / SIDES) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a) * (sash ? 0.35 : 1);
          const k = out.nv * 3, kc = out.nv * 4;
          out.P[k] = p.x + sx * ca * rr; out.P[k + 1] = -p.y + sy * ca * rr; out.P[k + 2] = z + sa * rr;
          const nl = Math.hypot(ca, Math.sin(a)) || 1;
          out.N[k] = (sx * ca) / nl; out.N[k + 1] = (sy * ca) / nl; out.N[k + 2] = Math.sin(a) / nl;
          out.C[kc] = col[0]; out.C[kc + 1] = col[1]; out.C[kc + 2] = col[2]; out.C[kc + 3] = 0.55;
          out.X[out.nv] = 0;
          out.nv++;
        }
      }
      for (let i = 0; i < n - 1; i++) for (let s = 0; s < SIDES; s++) {
        const a = base + i * SIDES + s, b = base + i * SIDES + ((s + 1) % SIDES), c = a + SIDES, d = b + SIDES;

        out.I[out.ni++] = a; out.I[out.ni++] = b; out.I[out.ni++] = c; out.I[out.ni++] = b; out.I[out.ni++] = d; out.I[out.ni++] = c;
      }
    }
  }



  const TRAILS = new WeakMap();
  function streak(f, k, R, out) {
    out.nv = 0; out.ni = 0;
    let T = TRAILS.get(f); if (!T) TRAILS.set(f, (T = []));
    const clk = ND.simClock || 0, A = f.state === 'atk' ? f.atk : null;



    const live = !!(k && k.inHand && k.bladeVis > 0.5 && A && A.kind === 'blade' && A.active && f.st > A.active[0] - 0.05 && f.st < A.active[1] + 0.06 && !f.hitDone && f.state === 'atk');
    if (T.length && (clk < T[T.length - 1].t || clk - T[T.length - 1].t > 0.3)) T.length = 0;
    if (!live) T.length = 0;
    if (live && (!T.length || T[T.length - 1].t !== clk)) {
      const s = { t: clk, b: madd(k.bh, k.bu, R.BL * 0.45), p: madd(k.bh, k.bu, R.BL + 3), u: norm(k.bu) }, q = T[T.length - 1];
      if (q && dot(q.u, s.u) < 0.64) T.length = 0;
      T.push(s);
    }
    while (T.length && (clk - T[0].t > 0.06 || T.length > 24)) T.shift();
    const n = T.length;
    if (n < 2) return;
    for (let i = 0; i < n; i++) {
      const s = T[i], a = Math.pow((i + 1) / n, 2) * 0.45;
      const k3 = out.nv * 3, kc = out.nv * 4;
      out.P[k3] = s.b.x; out.P[k3 + 1] = s.b.y; out.P[k3 + 2] = s.b.z;
      out.P[k3 + 3] = s.p.x; out.P[k3 + 4] = s.p.y; out.P[k3 + 5] = s.p.z;
      for (let q = 0; q < 2; q++) { const w = q ? 1 : 0.3; out.C[kc + q * 4] = 0.8 * a * w; out.C[kc + q * 4 + 1] = 0.88 * a * w; out.C[kc + q * 4 + 2] = 1.0 * a * w; out.C[kc + q * 4 + 3] = 0; out.N[k3 + q * 3] = 0; out.N[k3 + q * 3 + 1] = 0; out.N[k3 + q * 3 + 2] = 1; out.X[out.nv + q] = 0; }
      out.nv += 2;
    }
    for (let i = 0; i < n - 1; i++) { const a = i * 2; out.I[out.ni++] = a; out.I[out.ni++] = a + 1; out.I[out.ni++] = a + 2; out.I[out.ni++] = a + 1; out.I[out.ni++] = a + 3; out.I[out.ni++] = a + 2; }
  }


  const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aP; layout(location=1) in vec3 aN; layout(location=2) in vec4 aC; layout(location=3) in float aI;
uniform vec4 uM[${MAXP * 3}];
uniform mat4 uVP; uniform float uInk; uniform vec2 uView;
out vec3 vN; out vec3 vW; out vec4 vC;
void main(){
  int i = int(aI + 0.5) * 3;
  vec4 r0 = uM[i], r1 = uM[i + 1], r2 = uM[i + 2];
  vec4 p = vec4(aP, 1.0);
  vec3 w = vec3(dot(r0, p), dot(r1, p), dot(r2, p));
  vec3 s2 = vec3(r0.x * r0.x + r1.x * r1.x + r2.x * r2.x, r0.y * r0.y + r1.y * r1.y + r2.y * r2.y, r0.z * r0.z + r1.z * r1.z + r2.z * r2.z);
  vec3 n0 = aN / max(s2, vec3(1e-8));
  vec3 n = vec3(dot(r0.xyz, n0), dot(r1.xyz, n0), dot(r2.xyz, n0));
  n = n / max(length(n), 1e-8);
  vec4 c = uVP * vec4(w, 1.0);
  if (uInk > 0.0) {
    vec4 cn = uVP * vec4(n, 0.0);
    vec2 d = cn.xy * c.w - c.xy * cn.w;
    float l = length(d);
    if (l > 1e-8) c.xy += (d / l) * (uInk * aC.a) * (2.0 / uView) * c.w;
    c.z += 0.0004 * c.w;
  }
  gl_Position = c; vN = n; vW = w; vC = aC;
}`;
  const FS = `#version 300 es
precision highp float;
in vec3 vN; in vec3 vW; in vec4 vC;
uniform float uInk, uMode; uniform vec3 uInkC;
uniform vec3 uKeyD, uKeyC, uShade, uEye, uLift; uniform float uFlash, uKeyA;
uniform vec4 uL[4]; uniform vec3 uLC[4];
out vec4 o;
void main(){
  if (uMode > 1.5) { o = vec4(vC.rgb, 0.0); return; }
  if (uInk > 0.0) { o = vec4(uInkC, 1.0); return; }
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 base = vC.rgb;
  float d = dot(n, uKeyD);
  float fw = max(fwidth(d), 1e-3) * 1.2;
  float t1 = smoothstep(0.26 - fw, 0.26 + fw, d), t0 = smoothstep(-0.24 - fw, -0.24 + fw, d);
  vec3 col = mix(base * 0.56 * uShade, base * 0.8, t0);
  col = mix(col, base * 1.04 + uKeyC * uKeyA * 1.6, t1);
  for (int k = 0; k < 4; k++) {
    vec4 L = uL[k];
    if (L.w <= 0.0) continue;
    vec3 v = L.xyz - vW; float dist = length(v);
    float I = L.w * (dist < 234.0 ? mix(0.42, 0.12, dist / 234.0) : mix(0.12, 0.0, clamp((dist - 234.0) / 286.0, 0.0, 1.0)));
    float nd = dot(n, v / max(dist, 1.0));
    float s = nd > 0.2 ? 1.0 : (nd > -0.25 ? 0.45 : 0.12);
    col += uLC[k] * I * s * (base * 1.4 + 0.12);
  }
  vec3 V = normalize(uEye - vW);
  float rim = smoothstep(0.66, 0.84, 1.0 - max(dot(n, V), 0.0));
  col += rim * (uKeyC * 0.16 + uLift);
  col *= mix(0.72, 1.0, clamp(vW.y / 70.0, 0.0, 1.0));
  col = mix(col, vec3(1.0, 0.96, 0.94), uFlash * 0.38);
  o = vec4(col, 1.0);
}`;
  let GLS = null;
  function glInit(gl) {
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('r3d shader: ' + gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('r3d link: ' + gl.getProgramInfoLog(p));
    const U = {};
    for (const k of ['uM', 'uVP', 'uInk', 'uView', 'uMode', 'uInkC', 'uKeyD', 'uKeyC', 'uShade', 'uEye', 'uLift', 'uFlash', 'uKeyA', 'uL', 'uLC']) U[k] = gl.getUniformLocation(p, k);
    GLS = { gl, p, U, rigs: new Map(), dyn: [] };
    R3.gl = gl;
  }
  function vaoOf(gl, P, N, C, X, I, dynamic) {
    const o = { vao: gl.createVertexArray(), b: [], ib: gl.createBuffer(), n: I ? I.length : 0 };
    gl.bindVertexArray(o.vao);
    const arr = [[P, 3, 0], [N, 3, 1], [C, 4, 2], [X, 1, 3]];
    for (const [a, sz, loc] of arr) {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, a, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, sz, gl.FLOAT, false, 0, 0);
      o.b.push(b);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, I, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return o;
  }
  function dynUpload(gl, o, D) {
    gl.bindVertexArray(o.vao);
    const arr = [[D.P, 3], [D.N, 3], [D.C, 4], [D.X, 1]];
    for (let k = 0; k < 4; k++) { gl.bindBuffer(gl.ARRAY_BUFFER, o.b[k]); gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr[k][0], 0, D.nv * arr[k][1]); }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.ib); gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, D.I, 0, D.ni);
  }




  const RIG = (R3.rig = { yaw: 0, vyaw: 0, pitch: 0, vpitch: 0, eye: -96, veye: 0, dist: 1100, vdist: 0, fit: 1, vfit: 0, zoom: 1, vzoom: 0, px: 0, t: null, shot: 'fight' });
  function springTo(o, k, vk, T, w, dt, vmax) {

    const n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;
    for (let i = 0; i < n; i++) {
      o[vk] += (w * w * (T - o[k]) - 2 * w * o[vk]) * h;
      if (vmax) o[vk] = clamp(o[vk], -vmax, vmax);
      o[k] += o[vk] * h;
    }
  }





  function rigTarget(F) {
    const D = ND.duel, CH = D && D.chor, SB = CH && CH.cur;
    let c = null;
    if (!SB && D && D.finOf && F) for (const f of F) { const k = D.finOf(f); if (k) c = k; }
    const T = { yaw: 0, pitch: 0, eye: -96, dist: 1100, zoom: 1, shot: 'fight' };
    if (NOCAM) return T;
    if (VIEWQ) { T.yaw = +VIEWQ[1] * DEG; T.eye = VIEWQ[2] != null ? +VIEWQ[2] : T.eye; T.dist = VIEWQ[3] != null ? +VIEWQ[3] : T.dist; T.shot = 'forced'; return T; }
    const slow = G.slowT > 0 && (G.slow || 1) < 0.9;
    if (SB) {
      const A = SB.A, u = clamp((SB.t || 0) / Math.max(0.1, SB.dur), 0, 1), side = A.dir >= 0 ? 1 : -1;

      let home = SB.acts ? SB.acts.findIndex((q) => q.k === 'home') : -1;
      const late = SB.final || (home >= 0 && SB.i > home);
      if (late) { T.yaw = -46 * DEG * side; T.eye = -132; T.pitch = -4 * DEG; T.dist = 880; T.shot = 'over-shoulder'; }
      else if (u < 0.4) { T.yaw = 34 * DEG * side; T.eye = -92; T.dist = 860; T.shot = 'three-quarter'; }
      else { T.yaw = -14 * DEG * side; T.eye = -52; T.pitch = 5 * DEG; T.dist = 880; T.shot = 'low'; }
      if (slow) { T.dist *= 0.88; T.zoom = 1.06; T.shot += '+dolly'; }
    } else if (c) {
      const side = c.A.dir >= 0 ? 1 : -1;
      if (RIG.cineOf !== c) { RIG.cineOf = c; RIG.cineT = scene.t || 0; }
      const ct = (scene.t || 0) - RIG.cineT;
      if (ct < 0.9 && CH && CH.handled && CH.handled(c)) { T.yaw = -46 * DEG * side; T.eye = -132; T.pitch = -4 * DEG; T.dist = 880; T.shot = 'over-shoulder'; if (slow) { T.dist *= 0.88; T.zoom = 1.06; T.shot += '+dolly'; } return T; }
      T.yaw = -22 * DEG * side; T.eye = -64; T.pitch = 3 * DEG; T.dist = 880; T.shot = 'cine';
      if (slow) { T.dist = 780; T.zoom = 1.06; T.shot += '+dolly'; }
    }
    return T;
  }
  function rigStep(F) {
    const now = scene.t || 0;
    const dt = RIG.t == null ? 0 : clamp(now - RIG.t, 0, 0.05);
    RIG.t = now;
    const T = rigTarget(F);
    RIG.shot = T.shot;
    if (!dt) { if (RIG.t0 == null) { RIG.yaw = T.yaw; RIG.pitch = T.pitch; RIG.eye = T.eye; RIG.dist = T.dist; RIG.zoom = T.zoom; RIG.t0 = now; } return; }
    springTo(RIG, 'yaw', 'vyaw', T.yaw, 2.4, dt, 48 * DEG);
    springTo(RIG, 'pitch', 'vpitch', T.pitch, 2.4, dt, 12 * DEG);
    springTo(RIG, 'eye', 'veye', T.eye, 2.4, dt, 140);
    springTo(RIG, 'dist', 'vdist', T.dist, 2.6, dt, 520);
    springTo(RIG, 'zoom', 'vzoom', T.zoom, 3.2, dt, 0.25);
  }


  const VP = new Float32Array(16), VPM = new Float32Array(16), EYE = [0, 0, 0];
  const ANCHOR_Y = -80;
  let anchored = false;
  function viewProjShift(W, H, fit, dy) { anchored = true; SHIFT = dy; try { return viewProj(W, H, fit); } finally { anchored = false; SHIFT = 0; } }
  let SHIFT = 0;
  function viewProj(W, H, fit) {
    const k = cam.k * RIG.zoom * fit, d = RIG.dist, th = RIG.yaw, ph = RIG.pitch, fpx = k * d, ye = RIG.eye;
    const st = Math.sin(th), ct = Math.cos(th), sp = Math.sin(ph), cp = Math.cos(ph);


    const C = v3(cam.x + d * st, -ye, d * ct);
    const fw = v3(-st * cp, sp, -ct * cp), X = v3(ct, 0, -st), Z = mul(fw, -1), Y = cross(Z, X);

    const cy0 = cam.gy + cam.shy + (ye - cam.y) * k + SHIFT;
    const n = Math.max(20, d - 700), fz = d + 900, A = (fz + n) / (fz - n), B = (-2 * fz * n) / (fz - n);
    const ax = (2 * fpx) / W, sx = (2 * cam.shx) / W, ay = (2 * fpx) / H, sy = 1 - (2 * cy0) / H;

    const V = [[X.x, X.y, X.z, -dot(X, C)], [Y.x, Y.y, Y.z, -dot(Y, C)], [Z.x, Z.y, Z.z, -dot(Z, C)]];
    const Pr = [[ax, 0, -sx, 0], [0, ay, -sy, 0], [0, 0, -A, B], [0, 0, -1, 0]];
    for (let r = 0; r < 4; r++) for (let cI = 0; cI < 4; cI++) {
      let v = 0;
      for (let m = 0; m < 3; m++) v += Pr[r][m] * V[m][cI];
      if (cI === 3) v += Pr[r][3];
      VP[cI * 4 + r] = v;
    }
    EYE[0] = C.x; EYE[1] = C.y; EYE[2] = C.z;
    if (!anchored) {
      const want = cam.gy + cam.shy + (ANCHOR_Y - cam.y) * cam.k * RIG.zoom, got = proj(v3(cam.x, -ANCHOR_Y, 0), W, H)[1];
      return viewProjShift(W, H, fit, want - got);
    }
    return VP;
  }

  function proj(p, W, H) {
    const x = VP[0] * p.x + VP[4] * p.y + VP[8] * p.z + VP[12], y = VP[1] * p.x + VP[5] * p.y + VP[9] * p.z + VP[13], w = VP[3] * p.x + VP[7] * p.y + VP[11] * p.z + VP[15];
    return [((x / w) * 0.5 + 0.5) * W, (0.5 - (y / w) * 0.5) * H];
  }

  const KEYPTS = ['head', 'haF', 'haB', 'ftF', 'ftB', 'knF', 'knB', 'tip', 'pom', 'elF', 'elB', 'hip'];

  function keyPt(k, name, f) {
    if (name === 'tip') return k.noSword || !k.inHand ? null : madd(k.bh, k.bu, ((f.wpn || ND.LEN).blade || 90) * Math.max(0.05, k.bladeVis));
    if (name === 'pom') return k.noSword ? null : madd(k.bh, k.bu, -((f.wpn || ND.LEN).handle || 24));
    return k[name] || null;
  }
  function fitFor(F, W, H) {
    if (Math.abs(RIG.yaw) < 0.01 && RIG.zoom <= 1.001) return 1;
    let need = 1;
    const cx = W / 2, cyy = cam.gy + (ANCHOR_Y - cam.y) * cam.k * RIG.zoom;
    const x0 = W * 0.05, x1 = W * 0.95, y0 = H * 0.11, y1 = H * 0.9;
    for (const f of F) {
      const S = POSES.get(f); if (!S) continue;
      for (const k of KEYPTS) {
        const p = keyPt(S, k, f); if (!p) continue;
        const up = k === 'head' ? 14 : 4;
        const [sx, sy] = proj(v3(p.x, p.y + up, p.z), W, H);
        if (sx < x0) need = Math.min(need, (cx - x0) / Math.max(1, cx - sx));
        if (sx > x1) need = Math.min(need, (x1 - cx) / Math.max(1, sx - cx));
        if (sy < y0) need = Math.min(need, (cyy - y0) / Math.max(1, cyy - sy));
        if (sy > y1) need = Math.min(need, (y1 - cyy) / Math.max(1, sy - cyy));
      }
    }
    return clamp(need, 0.6, 1);
  }










  const HDQ = /[?&]r3dlod=(\w+)/.exec(Q), LOD = HDQ ? HDQ[1] : 'hd';
  const HDM = {}, HDL = {}, HD_IDS = ['akane', 'kuro'];
  const MATN = ['cloth', 'gloss', 'skin', 'hair', 'metal', 'flat'];
  const MATP = [[1.08, 0.97, 0.78, 0.2, 1, 0], [1.08, 0.95, 0.7, 0.55, 1, 0], [1.04, 0.98, 0.84, 0, 0.6, 0], [1.0, 0.92, 0.72, 0.3, 1, 0], [1.18, 0.95, 0.68, 1.6, 1.2, 0], [1, 1, 1, 0, 0, 1],
    [1.04, 0.92, 0.74, 0.12, 0.75, 0]];
  async function hdLoad(id) {
    const res = await fetch('uc-boyut-test/model/' + id + '.sd3d');
    if (!res.ok) throw new Error(id + ': ' + res.status);
    let buf = await res.arrayBuffer();
    const u8 = new Uint8Array(buf), bytes = u8.length;
    if (u8[0] === 0x1f && u8[1] === 0x8b) buf = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x44334453) throw new Error('not a model file');
    const jl = dv.getUint32(4, true), H = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, jl))), base = 8 + jl;
    const B = H.bones.map((b) => ({ name: b.name, parentName: b.parent, R0: b.R.slice(), p0: v3(b.head[0], b.head[1], b.head[2]), len: Math.hypot(b.tail[0] - b.head[0], b.tail[1] - b.head[1], b.tail[2] - b.head[2]) }));
    const ix = {}; B.forEach((b, i) => (ix[b.name] = i));
    B.forEach((b) => { b.parent = b.parentName == null ? -1 : ix[b.parentName]; b.R0T = m3T(b.R0); b.d0 = v3(b.R0[3], b.R0[4], b.R0[5]); });
    const nb = B.length, STAT = ['hilt', 'blade', 'saya'];
    let nv = 0, ni = 0;
    const parts = ['body'].concat(STAT.filter((k) => H.meshes[k]));
    for (const k of parts) { const h = H.meshes[k]; nv += h.count; ni += h.groups.reduce((s, x) => Math.max(s, x.start + x.count), 0); }
    const P = new Float32Array(nv * 3), N = new Int8Array(nv * 4), C = new Uint8Array(nv * 4), SI = new Uint8Array(nv * 4), SW = new Uint8Array(nv * 4), MT = new Uint8Array(nv), I = new Uint16Array(ni);
    let vo = 0, io = 0;
    if (nv > 65535) throw new Error('model too big');
    for (const k of parts) {
      const h = H.meshes[k], n = h.count;
      const q = new Uint16Array(buf.slice(base + h.pos, base + h.pos + n * 6));
      for (let i = 0; i < n * 3; i++) P[vo * 3 + i] = h.lo[i % 3] + q[i] * h.sc[i % 3];
      N.set(new Int8Array(buf.slice(base + h.nrm, base + h.nrm + n * 4)), vo * 4);
      C.set(new Uint8Array(buf.slice(base + h.col, base + h.col + n * 4)), vo * 4);
      if (h.skinned) { SI.set(new Uint8Array(buf.slice(base + h.si, base + h.si + n * 4)), vo * 4); SW.set(new Uint8Array(buf.slice(base + h.sw, base + h.sw + n * 4)), vo * 4); }
      else { const sb = nb + STAT.indexOf(k); for (let i = 0; i < n; i++) { SI[(vo + i) * 4] = sb; SW[(vo + i) * 4] = 255; } }
      const tot = h.groups.reduce((s, x) => Math.max(s, x.start + x.count), 0);
      const idx = new Uint16Array(buf.slice(base + h.idx, base + h.idx + tot * 2));
      for (const g of h.groups) { const m = MATN.indexOf(g.mat); for (let t = g.start; t < g.start + g.count; t++) MT[vo + idx[t]] = m; }
      for (let t = 0; t < tot; t++) I[io + t] = idx[t] + vo;
      vo += n; io += tot;
    }


    {
      const skinM = MATN.indexOf('skin'), hidden = new Uint8Array(nb), neckY = B[ix.neck].p0.y - 10;
      for (const n of ['hips', 'spine', 'chest', 'thigh.R', 'thigh.L', 'upper.R', 'upper.L', 'clav.R', 'clav.L']) if (ix[n] != null) hidden[ix[n]] = 1;
      const under = (v) => { let bi = 0, bw = -1; for (let j = 0; j < 4; j++) if (SW[v * 4 + j] > bw) { bw = SW[v * 4 + j]; bi = SI[v * 4 + j]; } return MT[v] === skinM && bi < nb && hidden[bi] && P[v * 3 + 1] < neckY; };
      let w = 0;
      for (let t = 0; t < ni; t += 3) { const a = I[t], b = I[t + 1], c = I[t + 2]; if (under(a) && under(b) && under(c)) continue; I[w++] = a; I[w++] = b; I[w++] = c; }
      ni = w;
    }
    const ex = H.extra, grip = {};
    for (const s of ['R', 'L']) { const g = ex.grip[s]; grip[s] = { c: v3(...g.c), a: v3(...g.a), p: v3(...g.p) }; }
    const headSet = []; for (let i = 0; i < nb; i++) { let j = i; while (j >= 0 && B[j].name !== 'head') j = B[j].parent; if (j >= 0) headSet.push(i); }
    const M = { headSet, id, B, ix, nb, P, N, C, SI, SW, MT, I: I.subarray(0, ni), tris: ni / 3, bytes, extra: ex, grip, hc0: v3(...ex.headCenter), hasSaya: !!H.meshes.saya, springs: ex.springs || [] };
    const p0 = (n) => B[ix[n]].p0;
    M.W0 = p0('hips'); M.spineLen = len(sub(p0('neck'), M.W0));
    M.armRest = {};
    for (const s of ['R', 'L']) { const sh = p0('upper.' + s), el = p0('fore.' + s), wr = p0('hand.' + s); M.armRest[s] = { l1: len(sub(el, sh)), l2: len(sub(wr, el)), out: norm(sub(el, mul(add(sh, wr), 0.5))) }; }
    return M;
  }








  const GLBQ = /[?&]r3dglb=([a-z,]+)/.exec(Q), GLB = GLBQ ? GLBQ[1].split(',') : [];
  const NONRM = /[?&]r3dnrm=0(&|$)/.test(Q);
  const NOCLOTH = /[?&]r3dcloth=0(&|$)/.test(Q), MAXB = 48;
  const HEIGHT = { akane: 180, kuro: 187 };
  const ROLE = [
    ['hips', ['hips', 'pelvis', 'hip']], ['spine', ['spine', 'spine0', 'spine00', 'abdomen']], ['spine1', ['spine1', 'spine01']],
    ['chest', ['spine2', 'spine02', 'chest', 'upperchest', 'spine3', 'spine03']], ['neck', ['neck', 'neck01', 'neck1']], ['head', ['head']],
  ];
  for (const [s, w, a] of [['R', 'right', 'r'], ['L', 'left', 'l']]) {
    ROLE.push(['clav.' + s, [w + 'shoulder', 'shoulder' + a, 'clavicle' + a, w + 'clavicle']], ['upper.' + s, [w + 'arm', w + 'upperarm', 'upperarm' + a, 'arm' + a]],
      ['fore.' + s, [w + 'forearm', w + 'lowerarm', 'forearm' + a, 'lowerarm' + a]], ['hand.' + s, [w + 'hand', 'hand' + a]],
      ['thigh.' + s, [w + 'upleg', w + 'upperleg', w + 'thigh', 'thigh' + a, 'upperleg' + a]], ['shin.' + s, [w + 'leg', w + 'lowerleg', w + 'shin', 'shin' + a, 'calf' + a, 'lowerleg' + a]],
      ['foot.' + s, [w + 'foot', 'foot' + a]], ['toe.' + s, [w + 'toebase', w + 'toe', 'toe' + a, 'ball' + a]]);
  }





  const GLBCUT = {
    akane: { cut: [[[0.226, 0.5, 0.0784], [0.0991, 1.19, 0.1607], 0.03], [[0.1764, 0.89, 0.1092], [0.1654, 0.95, 0.1164], 0.047]], mouth: [0.1505, 0.91, 0.1273], u: [-0.85, -0.5, -0.18] },
  };
  const normName = (n) => String(n || '').toLowerCase().replace(/^.*[:|]/, '').replace(/^(mixamorig|bip0?1|def|cc_base)/, '').replace(/[^a-z0-9]/g, '');
  async function glbLoad(id) {

    const res = await fetch('uc-boyut/model/' + id + (id === 'akane' && /[?&]ucbm=lod2(&|$)/.test(Q) ? '-lod2' : '') + '.glb');
    if (!res.ok) throw new Error(id + '.glb: ' + res.status);
    const buf = await res.arrayBuffer(), dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not a GLB');
    let off = 12, J = null, BIN = null;
    while (off < buf.byteLength) {
      const ln = dv.getUint32(off, true), ty = dv.getUint32(off + 4, true);
      if (ty === 0x4e4f534a) J = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, off + 8, ln)));
      else if (ty === 0x004e4942) BIN = new Uint8Array(buf, off + 8, ln);
      off += 8 + ln;
    }
    if ((J.extensionsRequired || []).length) throw new Error('needs ' + J.extensionsRequired.join(', ') + ' (re-export without compression)');
    const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
    const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
    const acc = (i) => {
      const a = J.accessors[i], bv = J.bufferViews[a.bufferView], T = CT[a.componentType], nc = NC[a.type], es = T.BYTES_PER_ELEMENT;
      const stride = bv.byteStride || nc * es, o0 = (bv.byteOffset || 0) + (a.byteOffset || 0), out = new (a.componentType === 5126 || a.normalized ? Float32Array : T)(a.count * nc);
      const d = new DataView(BIN.buffer, BIN.byteOffset);
      const rd = { 5120: (o) => d.getInt8(o), 5121: (o) => d.getUint8(o), 5122: (o) => d.getInt16(o, true), 5123: (o) => d.getUint16(o, true), 5125: (o) => d.getUint32(o, true), 5126: (o) => d.getFloat32(o, true) }[a.componentType];
      const nm = a.normalized ? { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[a.componentType] : 1;
      for (let k = 0; k < a.count; k++) for (let c = 0; c < nc; c++) out[k * nc + c] = rd(o0 + k * stride + c * es) / nm;
      return out;
    };
    const skin = J.skins && J.skins[0];
    if (!skin) throw new Error('no skeleton (rig the model first)');
    const meshNodes = J.nodes.filter((n) => n.mesh != null && n.skin === 0);
    if (!meshNodes.length) throw new Error('no skinned mesh');

    const ibm = acc(skin.inverseBindMatrices), nj = skin.joints.length;
    const parentOf = {}; J.nodes.forEach((n, i) => (n.children || []).forEach((c) => (parentOf[c] = i)));
    const jIx = {}; skin.joints.forEach((nd, j) => (jIx[nd] = j));
    const jParent = skin.joints.map((nd) => { let p = parentOf[nd]; while (p != null && jIx[p] == null) p = parentOf[p]; return p == null ? -1 : jIx[p]; });
    const bind = [];
    for (let j = 0; j < nj; j++) bind.push(m4inv(ibm.subarray(j * 16, j * 16 + 16)));
    const role = {}, jRole = new Array(nj).fill(null);
    for (let j = 0; j < nj; j++) {
      const nm = normName(J.nodes[skin.joints[j]].name);
      for (const [r, al] of ROLE) if (!role[r] && al.includes(nm)) { role[r] = j; jRole[j] = r; break; }
    }

    if (role.hips != null && role.neck != null) {
      const ch = []; for (let j = jParent[role.neck]; j >= 0 && j !== role.hips; j = jParent[j]) ch.unshift(j);
      if (ch.length) {
        for (const r of ['spine', 'spine1', 'chest']) if (role[r] != null) { jRole[role[r]] = null; delete role[r]; }
        role.spine = ch[0]; role.chest = ch[ch.length - 1]; if (ch.length > 2) role.spine1 = ch[1];
        for (const r of ['spine', 'spine1', 'chest']) if (role[r] != null) jRole[role[r]] = r;
      }
    }
    if (role.chest == null && role.spine1 != null) { role.chest = role.spine1; jRole[role.chest] = 'chest'; delete role.spine1; }
    for (const r of ['hips', 'spine', 'chest', 'neck', 'head', 'upper.R', 'fore.R', 'hand.R', 'upper.L', 'fore.L', 'hand.L', 'thigh.R', 'shin.R', 'foot.R', 'thigh.L', 'shin.L', 'foot.L'])
      if (role[r] == null) throw new Error('skeleton: no ' + r + ' bone (names: ' + skin.joints.slice(0, 12).map((n) => J.nodes[n].name).join(' ') + ' ...)');
    const jp = (j) => v3(bind[j][12], bind[j][13], bind[j][14]);

    const Up = norm(sub(jp(role.head), jp(role.hips)));
    let Lt = sub(jp(role['thigh.L']), jp(role['thigh.R'])); Lt = norm(sub(Lt, mul(Up, dot(Lt, Up))));
    const Fw = norm(cross(Lt, Up)), Rt = mul(Lt, -1);

    const prims = [];
    let nv = 0, ni = 0;
    for (const node of meshNodes) for (const pr of J.meshes[node.mesh].primitives) {
      const A = pr.attributes;
      if (A.POSITION == null || A.JOINTS_0 == null || A.WEIGHTS_0 == null) continue;
      const pos = acc(A.POSITION), cnt = pos.length / 3;
      const idx = pr.indices != null ? acc(pr.indices) : Uint32Array.from({ length: cnt }, (_, i) => i);
      prims.push({ pos, cnt, nrm: A.NORMAL != null ? acc(A.NORMAL) : null, uv: A.TEXCOORD_0 != null ? acc(A.TEXCOORD_0) : null, col: A.COLOR_0 != null ? acc(A.COLOR_0) : null,
        js: acc(A.JOINTS_0), ws: acc(A.WEIGHTS_0), idx, mat: pr.material != null ? J.materials[pr.material] : null });
      nv += cnt; ni += idx.length;
    }
    let lo = 1e9, hi = -1e9;
    for (const pr of prims) for (let i = 0; i < pr.cnt; i++) { const h = pr.pos[i * 3] * Up.x + pr.pos[i * 3 + 1] * Up.y + pr.pos[i * 3 + 2] * Up.z; lo = Math.min(lo, h); hi = Math.max(hi, h); }


    const SX = (J.scenes && J.scenes[J.scene || 0] && J.scenes[J.scene || 0].extras) || {}, crown = +SX.sdCrown;


    const CUT = SX.sdPrep ? ((SX.sdSaya || SX.sdBackSaya) ? { cut: [], mouth: SX.sdSaya && SX.sdSaya.mouth, u: SX.sdSaya && SX.sdSaya.u, back: SX.sdBackSaya } : null) : GLBCUT[id];
    const K = (HEIGHT[id] || 180) / (crown > 0 ? crown : hi - lo), hp = jp(role.hips);
    const o0 = sub(hp, mul(Up, dot(hp, Up) - lo));
    const T = (p) => { const d = sub(p, o0); return v3(dot(d, Fw) * K, dot(d, Up) * K, dot(d, Rt) * K); };
    const Tn = (d) => v3(dot(d, Fw), dot(d, Up), dot(d, Rt));



    for (let j = 0; j < nj; j++) { const nm = String(J.nodes[skin.joints[j]].name || ''); if (/^sd_/.test(nm) && !NOCLOTH) jRole[j] = nm; }
    const keep = new Array(nj).fill(false);
    for (let j = 0; j < nj; j++) if (jRole[j]) keep[j] = true;
    const fold = (j) => { while (j >= 0 && !keep[j]) j = jParent[j]; return j < 0 ? role.hips : j; };
    const kept = []; for (let j = 0; j < nj; j++) if (keep[j]) kept.push(j);
    if (kept.length > MAXB - 6) throw new Error('too many bones');
    const newIx = {}; kept.forEach((j, i) => (newIx[j] = i));
    const B = kept.map((j) => {
      const m = bind[j], cx = norm(v3(m[0], m[1], m[2])), cy = norm(v3(m[4], m[5], m[6])), cz = norm(v3(m[8], m[9], m[10]));
      const X = Tn(cx), Y = Tn(cy), Z = Tn(cz);
      return { name: jRole[j] || 'j' + j, j, R0: [X.x, X.y, X.z, Y.x, Y.y, Y.z, Z.x, Z.y, Z.z], p0: T(jp(j)), parent: -1 };
    });
    B.forEach((b) => { const pj = fold(jParent[b.j]); b.parent = b.j === role.hips || pj === b.j ? -1 : newIx[pj]; b.R0T = m3T(b.R0); });
    const ix = {}; B.forEach((b, i) => (ix[b.name] = i));

    const NEXT = { hips: 'spine', spine: ix.spine1 != null ? 'spine1' : 'chest', spine1: 'chest', chest: 'neck', neck: 'head' };
    for (const s of ['R', 'L']) Object.assign(NEXT, { ['clav.' + s]: 'upper.' + s, ['upper.' + s]: 'fore.' + s, ['fore.' + s]: 'hand.' + s, ['thigh.' + s]: 'shin.' + s, ['shin.' + s]: 'foot.' + s, ['foot.' + s]: 'toe.' + s });
    for (const b of B) {
      const nx = NEXT[b.name] && ix[NEXT[b.name]] != null ? B[ix[NEXT[b.name]]] : null;
      let d = nx ? sub(nx.p0, b.p0) : null;
      if (!d || len(d) < 0.5) {
        if (b.name === 'head') d = v3(0, 22, 0);
        else if (b.name.startsWith('hand.')) { const f = B[ix['fore.' + b.name.slice(-1)]]; d = mul(norm(sub(b.p0, f.p0)), 16); }
        else if (b.name.startsWith('foot.') || b.name.startsWith('toe.')) d = v3(14, 0, 0);
        else d = v3(0, 10, 0);
      }
      b.d0 = norm(d); b.len = len(d);
    }





    const FING = {};
    if (ix['fing1.R'] == null) {
      const handOf = {}; for (const sd of ['R', 'L']) handOf[ix['hand.' + sd]] = sd;
      const domHand = (pr, i) => { let bw = 0, bk = -1; for (let c = 0; c < 4; c++) { const w = pr.ws[i * 4 + c]; if (w > bw) { bw = w; bk = newIx[fold(pr.js[i * 4 + c])]; } } return handOf[bk]; };
      for (const sd of ['R', 'L']) {
        const h = B[ix['hand.' + sd]], wr = h.p0;
        let ht = v3(0, 0, 0), n = 0;
        for (const pr of prims) for (let i = 0; i < pr.cnt; i++) if (domHand(pr, i) === sd) { ht = add(ht, sub(T(v3(pr.pos[i * 3], pr.pos[i * 3 + 1], pr.pos[i * 3 + 2])), wr)); n++; }
        if (n < 20) continue;
        ht = norm(ht);
        const med = sd === 'R' ? v3(0, 0, -1) : v3(0, 0, 1);
        const hw = norm(sub(med, mul(ht, dot(med, ht)))), hu0 = norm(cross(hw, ht)), hu = dot(hu0, EX) >= 0 ? hu0 : mul(hu0, -1);
        let Lh = 0;
        for (const pr of prims) for (let i = 0; i < pr.cnt; i++) if (domHand(pr, i) === sd) Lh = Math.max(Lh, dot(sub(T(v3(pr.pos[i * 3], pr.pos[i * 3 + 1], pr.pos[i * 3 + 2])), wr), ht));
        const at = (t, u, w) => add(add(add(wr, mul(ht, t * Lh)), mul(hu, u * Lh)), mul(hw, w * Lh));
        const mk = (name, p0, parent) => { const b = { name, j: -1, R0: h.R0.slice(), p0, parent, R0T: m3T(h.R0), d0: ht, len: 0.2 * Lh }; B.push(b); ix[name] = B.length - 1; return B.length - 1; };
        const f1 = mk('fing1.' + sd, at(0.57, 0, 0), ix['hand.' + sd]), f2 = mk('fing2.' + sd, at(0.77, 0, 0), f1), th = mk('thumb.' + sd, at(0.3, 0.17, 0), ix['hand.' + sd]);
        FING[sd] = { ht, hu, hw, Lh, wr, f1, f2, th, hand: ix['hand.' + sd] };
      }
    }
    const sstep = (x, a, b) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
    const out = new Float32Array(nv * 3), N = new Int8Array(nv * 4), C = new Uint8Array(nv * 4), SI = new Uint8Array(nv * 4), SW = new Uint8Array(nv * 4), MT = new Uint8Array(nv).fill(6), UV = new Float32Array(nv * 2);
    const I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    const draws = [], origT = new Int32Array(ni / 3);
    let vo = 0, io = 0, to = 0;
    for (const pr of prims) {
      for (let i = 0; i < pr.cnt; i++) {
        const v = vo + i, p = T(v3(pr.pos[i * 3], pr.pos[i * 3 + 1], pr.pos[i * 3 + 2]));
        out[v * 3] = p.x; out[v * 3 + 1] = p.y; out[v * 3 + 2] = p.z;
        const n = pr.nrm ? norm(Tn(v3(pr.nrm[i * 3], pr.nrm[i * 3 + 1], pr.nrm[i * 3 + 2]))) : v3(0, 1, 0);
        N[v * 4] = Math.round(n.x * 127); N[v * 4 + 1] = Math.round(n.y * 127); N[v * 4 + 2] = Math.round(n.z * 127); N[v * 4 + 3] = 64;
        const cc = pr.col ? (pr.col.length / pr.cnt === 4 ? [pr.col[i * 4], pr.col[i * 4 + 1], pr.col[i * 4 + 2]] : [pr.col[i * 3], pr.col[i * 3 + 1], pr.col[i * 3 + 2]]) : [1, 1, 1];
        const bf = pr.mat && pr.mat.pbrMetallicRoughness && pr.mat.pbrMetallicRoughness.baseColorFactor || [1, 1, 1, 1];
        for (let c = 0; c < 3; c++) C[v * 4 + c] = Math.round(255 * clamp(Math.pow(cc[c] * bf[c], 1 / 2.2), 0, 1));
        C[v * 4 + 3] = 255;
        if (pr.uv) { UV[v * 2] = pr.uv[i * 2]; UV[v * 2 + 1] = pr.uv[i * 2 + 1]; }
        const acc2 = {};
        for (let c = 0; c < 4; c++) { const w = pr.ws[i * 4 + c]; if (w > 0) { const k = newIx[fold(pr.js[i * 4 + c])]; acc2[k] = (acc2[k] || 0) + w; } }

        for (const sd in FING) {
          const Fg = FING[sd], wh = acc2[Fg.hand];
          if (!wh) continue;
          const q = sub(p, Fg.wr), t = dot(q, Fg.ht) / Fg.Lh, u = dot(q, Fg.hu) / Fg.Lh;
          if (u > 0.205 && t > 0.25) { const k = sstep(t, 0.3, 0.45); acc2[Fg.th] = wh * k; acc2[Fg.hand] = wh * (1 - k); }
          else { const s1 = sstep(t, 0.52, 0.62), s2 = sstep(t, 0.73, 0.81); acc2[Fg.hand] = wh * (1 - s1); if (s1 > s2) acc2[Fg.f1] = wh * (s1 - s2); if (s2 > 0) acc2[Fg.f2] = wh * s2; }
        }
        const ent = Object.entries(acc2).sort((a, b) => b[1] - a[1]).slice(0, 4), sum = ent.reduce((s, e) => s + e[1], 0) || 1;
        ent.forEach(([k, w], c) => { SI[v * 4 + c] = +k; SW[v * 4 + c] = Math.round((255 * w) / sum); });
      }

      const cut = (CUT && CUT.cut) || [], sel = new Uint8Array(pr.cnt);
      if (cut.length) for (let i = 0; i < pr.cnt; i++) { const q = v3(pr.pos[i * 3], pr.pos[i * 3 + 1], pr.pos[i * 3 + 2]); for (const [a, b, r] of cut) if (segDist(q, v3(...a), v3(...b)) < r) { sel[i] = 1; break; } }
      let kept = 0;
      for (let t = 0; t < pr.idx.length; t += 3) {
        const a = pr.idx[t], b = pr.idx[t + 1], c = pr.idx[t + 2];
        if (sel[a] + sel[b] + sel[c] >= 2) continue;
        origT[(io + kept) / 3] = to + t / 3;
        I[io + kept] = a + vo; I[io + kept + 1] = b + vo; I[io + kept + 2] = c + vo; kept += 3;
      }
      to += pr.idx.length / 3;
      const bt = pr.mat && pr.mat.pbrMetallicRoughness && pr.mat.pbrMetallicRoughness.baseColorTexture;

      const nt = pr.mat && pr.mat.normalTexture;
      draws.push({ start: io, count: kept, tex: bt ? J.textures[bt.index].source : null, nrm: nt && !NONRM ? J.textures[nt.index].source : null });
      vo += pr.cnt; io += kept;
    }

    const imgs = await Promise.all((J.images || []).map(async (im) => {
      if (im.bufferView == null) return null;
      const bv = J.bufferViews[im.bufferView];

      if (LOOK && LOOK.pic && id === 'akane') {
        const r = await fetch('uc-boyut/model/' + id + UCBM + '-' + LOOK.pic + '.png');
        if (r.ok) return createImageBitmap(await r.blob());
        console.warn('[r3d] no ' + id + '-' + LOOK.pic + '.png: the model own picture');
      }
      return createImageBitmap(new Blob([BIN.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength)], { type: im.mimeType || 'image/png' }));
    }));

    const grip = {}, armRest = {};
    for (const s of ['R', 'L']) {
      const h = B[ix['hand.' + s]], f = B[ix['fore.' + s]], u = B[ix['upper.' + s]];
      const hd = h.d0, a = norm(sub(EX, mul(hd, dot(EX, hd))));
      grip[s] = { c: madd(h.p0, hd, h.len * 0.5), a, p: norm(sub(mul(hd, -1), mul(a, dot(mul(hd, -1), a)))) };

      const Fg = FING[s];
      if (Fg) grip[s] = { c: add(add(add(Fg.wr, mul(Fg.ht, 0.46 * Fg.Lh)), mul(Fg.hu, 0.03 * Fg.Lh)), mul(Fg.hw, 0.11 * Fg.Lh)), a: Fg.hu, p: GRIPE > 0 ? Fg.ht : mul(Fg.ht, -1) };
      const out1 = sub(f.p0, mul(add(u.p0, h.p0), 0.5));
      armRest[s] = { l1: len(sub(f.p0, u.p0)), l2: len(sub(h.p0, f.p0)), out: len(out1) > 0.5 ? norm(out1) : v3(-1, 0, 0) };
    }
    const headSet = []; for (let i = 0; i < B.length; i++) { let q = i; while (q >= 0 && B[q].name !== 'head') q = B[q].parent; if (q >= 0) headSet.push(i); }



    if (LOOK && LOOK.pic && id === 'akane' && GQ('ucbweb', '1') !== '0') {
      const side = new Int8Array(B.length);
      for (const [n, sg] of [['thigh.L', -1], ['shin.L', -1], ['foot.L', -1], ['toe.L', -1], ['thigh.R', 1], ['shin.R', 1], ['foot.R', 1], ['toe.R', 1]]) if (ix[n] != null) side[ix[n]] = sg;
      for (let b2 = 0; b2 < B.length; b2++) if (!side[b2]) { let q = B[b2].parent; while (q >= 0 && !side[q]) q = B[q].parent; if (q >= 0) side[b2] = side[q]; }
      const yC = (B[ix['thigh.L']].p0.y + B[ix['thigh.R']].p0.y) / 2 - 6;
      let nW = 0;
      for (let v = 0; v < nv; v++) {
        const y = out[v * 3 + 1]; if (y > yC) continue;
        let L = 0, R = 0; for (let c = 0; c < 4; c++) { const sg = side[SI[v * 4 + c]]; if (sg < 0) L += SW[v * 4 + c]; else if (sg > 0) R += SW[v * 4 + c]; }
        if (!L || !R) continue;
        const k = clamp((yC - y) / 12, 0, 1), L3 = L * L * L, R3 = R * R * R, tot = L + R;
        const L2 = tot * (L / tot + k * (L3 / (L3 + R3) - L / tot)), R2 = tot - L2;
        let sum = 0; for (let c = 0; c < 4; c++) { const sg = side[SI[v * 4 + c]]; if (sg < 0) SW[v * 4 + c] = Math.round(SW[v * 4 + c] * L2 / L); else if (sg > 0) SW[v * 4 + c] = Math.round(SW[v * 4 + c] * R2 / R); sum += SW[v * 4 + c]; }
        if (sum !== 255) { let m = 0; for (let c = 1; c < 4; c++) if (SW[v * 4 + c] > SW[v * 4 + m]) m = c; SW[v * 4 + m] = clamp(SW[v * 4 + m] + 255 - sum, 0, 255); }
        nW++;
      }
      R3.ucbWeb = nW;
    }
    let NS = glbSmooth(out, N, I.subarray(0, io), nv);





    let P2 = out, N2 = N, C2 = C, SI2 = SI, SW2 = SW, MT2 = MT, UV2 = UV, I2 = I.subarray(0, io), nv2 = nv;
    if (LOOK && LOOK.pic && id === 'akane') {
      try {
        const r = await fetch('uc-boyut/model/' + id + UCBM + '-' + LOOK.pic + '.json');
        const TD = r.ok ? await r.json() : null;
        if (TD) {
          const tb = Uint8Array.from(atob(TD.tri), (ch) => ch.charCodeAt(0)), n = io;
          P2 = new Float32Array(n * 3); N2 = new Int8Array(n * 4); const NS2 = new Int8Array(n * 4); C2 = new Uint8Array(n * 4); SI2 = new Uint8Array(n * 4); SW2 = new Uint8Array(n * 4); MT2 = new Uint8Array(n); UV2 = new Float32Array(n * 2);
          for (let k = 0; k < n; k++) {
            const v = I[k], t = origT[(k / 3) | 0], b = tb[t] != null ? tb[t] : 128, pc = TD.pal[b & 127] || [255, 255, 255];
            for (let c = 0; c < 3; c++) P2[k * 3 + c] = out[v * 3 + c];
            for (let c = 0; c < 4; c++) { N2[k * 4 + c] = N[v * 4 + c]; NS2[k * 4 + c] = NS[v * 4 + c]; SI2[k * 4 + c] = SI[v * 4 + c]; SW2[k * 4 + c] = SW[v * 4 + c]; }
            MT2[k] = MT[v]; UV2[k * 2] = UV[v * 2]; UV2[k * 2 + 1] = UV[v * 2 + 1];

            if (b & 128) { C2[k * 4] = C2[k * 4 + 1] = C2[k * 4 + 2] = 255; C2[k * 4 + 3] = 255; } else { C2[k * 4] = pc[0]; C2[k * 4 + 1] = pc[1]; C2[k * 4 + 2] = pc[2]; C2[k * 4 + 3] = 0; }
          }
          I2 = new Uint32Array(n); for (let k = 0; k < n; k++) I2[k] = k;
          NS = NS2; nv2 = n;
        }
      } catch (e) { console.warn('[r3d] ' + id + '-' + LOOK.pic + '.json: ' + (e && e.message)); }
    }
    const M = { glb: true, id, B, ix, nb: B.length, P: P2, N: N2, NS, C: C2, SI: SI2, SW: SW2, MT: MT2, UV: UV2, I: I2, draws, imgs, tris: io / 3, cutSword: !!CUT, bytes: buf.byteLength, grip, armRest, headSet, fing: FING,
      hc0: madd(B[ix.head].p0, EY, 9), hasSaya: false, springs: [], extra: {} };

    const CLX = SX.sdCloth;
    if (CLX && !NOCLOTH) {
      const cl = {};
      if (CLX.skirt) {
        const S = CLX.skirt;
        cl.skirt = { legR: S.legR * K, shinR: S.shinR * K, k: S.k, damp: S.damp, grav: S.grav, max: S.max, chains: S.chains.filter((c) => ix[c.a] != null && ix[c.b] != null).map((c) => ({ a: ix[c.a], b: ix[c.b], tail: T(v3(...c.tail)), aff: c.aff })) };
        for (const c of cl.skirt.chains) { const A = B[c.a], Bb = B[c.b]; A.d0 = norm(sub(Bb.p0, A.p0)); A.len = len(sub(Bb.p0, A.p0)); Bb.d0 = norm(sub(c.tail, Bb.p0)); Bb.len = len(sub(c.tail, Bb.p0)); }
      }
      if (CLX.sleeves) {
        cl.sleeves = CLX.sleeves.filter((q) => ix[q.bone] != null).map((q) => ({ ...q, i: ix[q.bone], tail: T(v3(...q.tail)) }));
        for (const q of cl.sleeves) { const b = B[q.i]; b.d0 = norm(sub(q.tail, b.p0)); b.len = len(sub(q.tail, b.p0)); }
      }
      M.cloth = cl;
    }
    M.W0 = B[ix.hips].p0; M.spineLen = len(sub(B[ix.neck].p0, M.W0));

    M.toModel = T; M.toModelN = Tn; M.jointIx = {};
    for (let j = 0; j < nj; j++) M.jointIx[normName(J.nodes[skin.joints[j]].name)] = newIx[fold(j)];
    M.pieces = {};
    if (CUT && CUT.mouth) { M.sayaA = T(v3(...CUT.mouth)); M.sayaU = norm(v3(...CUT.u)); }

    if (CUT && CUT.back && CUT.back.top) M.sayaBk = [T(v3(...CUT.back.top)), T(v3(...CUT.back.bot))];
    M.kostum = await dressLoad(id);
    return M;
  }


  async function dressLoad(id) {
    if (!ND.r3dCostume || /[?&]r3dcos=0(&|$)/.test(Q)) return null;
    try {
      const [mr, jr] = await Promise.all([fetch('uc-boyut/model/' + id + '-kostum.png'), fetch('uc-boyut/model/' + id + '-kostum.json')]);
      if (!mr.ok || !jr.ok) return null;
      const meta = await jr.json(), img = await createImageBitmap(await mr.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      return { meta, img, bytes: +(mr.headers.get('content-length') || 0) };
    } catch (e) { console.warn('[r3d] costume regions', id, e && e.message); return null; }
  }




  function piecesOf(M, f) {
    const c = f && f.col && f.col.costume;
    if (!c || !M.toModel || /[?&]r3dek=0(&|$)/.test(Q)) return null;
    const key = String(c).replace('_' + M.id, '');
    let E = M.pieces[key];
    if (E === undefined) {
      E = M.pieces[key] = null;
      R3.ekPending = (R3.ekPending || 0) + 1;
      fetch('uc-boyut/model/' + M.id + '-ek-' + key + '.json').then((r) => (r.ok ? r.json() : null)).then(async (d) => {
        if (!d) return;
        const b64 = (s, T) => { const b = Uint8Array.from(atob(s), (x) => x.charCodeAt(0)); return new T(b.buffer, 0, b.byteLength / T.BYTES_PER_ELEMENT); };
        const pos = b64(d.pos, Float32Array), nrm = b64(d.nrm, Int8Array), uv = b64(d.uv, Float32Array), jj = b64(d.j, Uint8Array), ww = b64(d.w, Uint8Array);
        const I = b64(d.idx, d.n < 65536 ? Uint16Array : Uint32Array), n = d.n;
        const bi = d.bones.map((b) => M.jointIx[normName(b)]);
        if (bi.some((x) => x == null)) throw new Error('bones ' + d.bones.join(' '));
        const P = new Float32Array(n * 3), N = new Int8Array(n * 4), C = new Uint8Array(n * 4).fill(255), SI = new Uint8Array(n * 4), SW = new Uint8Array(n * 4), MT = new Uint8Array(n).fill(6);
        for (let i = 0; i < n; i++) {
          const p = M.toModel(v3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])), q = norm(M.toModelN(v3(nrm[i * 3] / 127, nrm[i * 3 + 1] / 127, nrm[i * 3 + 2] / 127)));
          P[i * 3] = p.x; P[i * 3 + 1] = p.y; P[i * 3 + 2] = p.z;
          N[i * 4] = Math.round(q.x * 127); N[i * 4 + 1] = Math.round(q.y * 127); N[i * 4 + 2] = Math.round(q.z * 127); N[i * 4 + 3] = 64;
          for (let k = 0; k < 4; k++) { SI[i * 4 + k] = bi[jj[i * 4 + k]]; SW[i * 4 + k] = ww[i * 4 + k]; }
        }
        const img = await createImageBitmap(new Blob([Uint8Array.from(atob(d.png), (x) => x.charCodeAt(0))], { type: 'image/png' }));
        M.pieces[key] = { glb: true, piece: key, P, N, C, SI, SW, MT, UV: uv, I, draws: [{ start: 0, count: I.length, tex: 0 }], imgs: [img], tris: I.length / 3 };
      }).catch((e) => console.warn('[r3d] costume pieces', M.id, key, e && e.message)).finally(() => { R3.ekPending--; });
    }
    return E;
  }
  function m4inv(m) {
    const a = Array.from(m), inv = new Array(16);
    inv[0] = a[5] * a[10] * a[15] - a[5] * a[11] * a[14] - a[9] * a[6] * a[15] + a[9] * a[7] * a[14] + a[13] * a[6] * a[11] - a[13] * a[7] * a[10];
    inv[4] = -a[4] * a[10] * a[15] + a[4] * a[11] * a[14] + a[8] * a[6] * a[15] - a[8] * a[7] * a[14] - a[12] * a[6] * a[11] + a[12] * a[7] * a[10];
    inv[8] = a[4] * a[9] * a[15] - a[4] * a[11] * a[13] - a[8] * a[5] * a[15] + a[8] * a[7] * a[13] + a[12] * a[5] * a[11] - a[12] * a[7] * a[9];
    inv[12] = -a[4] * a[9] * a[14] + a[4] * a[10] * a[13] + a[8] * a[5] * a[14] - a[8] * a[6] * a[13] - a[12] * a[5] * a[10] + a[12] * a[6] * a[9];
    inv[1] = -a[1] * a[10] * a[15] + a[1] * a[11] * a[14] + a[9] * a[2] * a[15] - a[9] * a[3] * a[14] - a[13] * a[2] * a[11] + a[13] * a[3] * a[10];
    inv[5] = a[0] * a[10] * a[15] - a[0] * a[11] * a[14] - a[8] * a[2] * a[15] + a[8] * a[3] * a[14] + a[12] * a[2] * a[11] - a[12] * a[3] * a[10];
    inv[9] = -a[0] * a[9] * a[15] + a[0] * a[11] * a[13] + a[8] * a[1] * a[15] - a[8] * a[3] * a[13] - a[12] * a[1] * a[11] + a[12] * a[3] * a[9];
    inv[13] = a[0] * a[9] * a[14] - a[0] * a[10] * a[13] - a[8] * a[1] * a[14] + a[8] * a[2] * a[13] + a[12] * a[1] * a[10] - a[12] * a[2] * a[9];
    inv[2] = a[1] * a[6] * a[15] - a[1] * a[7] * a[14] - a[5] * a[2] * a[15] + a[5] * a[3] * a[14] + a[13] * a[2] * a[7] - a[13] * a[3] * a[6];
    inv[6] = -a[0] * a[6] * a[15] + a[0] * a[7] * a[14] + a[4] * a[2] * a[15] - a[4] * a[3] * a[14] - a[12] * a[2] * a[7] + a[12] * a[3] * a[6];
    inv[10] = a[0] * a[5] * a[15] - a[0] * a[7] * a[13] - a[4] * a[1] * a[15] + a[4] * a[3] * a[13] + a[12] * a[1] * a[7] - a[12] * a[3] * a[5];
    inv[14] = -a[0] * a[5] * a[14] + a[0] * a[6] * a[13] + a[4] * a[1] * a[14] - a[4] * a[2] * a[13] - a[12] * a[1] * a[6] + a[12] * a[2] * a[5];
    inv[3] = -a[1] * a[6] * a[11] + a[1] * a[7] * a[10] + a[5] * a[2] * a[11] - a[5] * a[3] * a[10] - a[9] * a[2] * a[7] + a[9] * a[3] * a[6];
    inv[7] = a[0] * a[6] * a[11] - a[0] * a[7] * a[10] - a[4] * a[2] * a[11] + a[4] * a[3] * a[10] + a[8] * a[2] * a[7] - a[8] * a[3] * a[6];
    inv[11] = -a[0] * a[5] * a[11] + a[0] * a[7] * a[9] + a[4] * a[1] * a[11] - a[4] * a[3] * a[9] - a[8] * a[1] * a[7] + a[8] * a[3] * a[5];
    inv[15] = a[0] * a[5] * a[10] - a[0] * a[6] * a[9] - a[4] * a[1] * a[10] + a[4] * a[2] * a[9] + a[8] * a[1] * a[6] - a[8] * a[2] * a[5];
    const det = a[0] * inv[0] + a[1] * inv[4] + a[2] * inv[8] + a[3] * inv[12];
    return inv.map((x) => x / (det || 1));
  }
  function hdWant(id) {

    if ((LOD !== 'hd' && !GLB.includes(id)) || HDM[id] || HDL[id] || (!GLB.includes(id) && !HD_IDS.includes(id))) return;
    HDL[id] = (GLB.includes(id) ? glbLoad(id) : hdLoad(id)).then((m) => { HDM[id] = m; R3.hdBytes = (R3.hdBytes || 0) + m.bytes; }, (e) => { HDL[id] = 'failed'; R3.hdWhy = String(e && e.message); console.warn('[r3d] HD model', id, R3.hdWhy); });
  }

  function m3T(a) { return [a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]]; }
  function m3mul(a, b) { const o = new Array(9); for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) o[c * 3 + r] = a[r] * b[c * 3] + a[3 + r] * b[c * 3 + 1] + a[6 + r] * b[c * 3 + 2]; return o; }
  const m3v = (a, v) => v3(a[0] * v.x + a[3] * v.y + a[6] * v.z, a[1] * v.x + a[4] * v.y + a[7] * v.z, a[2] * v.x + a[5] * v.y + a[8] * v.z);
  function m3basis(y, ref) {
    const Y = norm(y); let X = sub(ref, mul(Y, dot(ref, Y)));
    if (len(X) < 1e-4) X = sub(EX, mul(Y, Y.x));
    X = norm(X); const Z = cross(X, Y);
    return [X.x, X.y, X.z, Y.x, Y.y, Y.z, Z.x, Z.y, Z.z];
  }
  const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  function rotM(k, a) { const x = rotAx(EX, k, a), y = rotAx(EY, k, a), z = rotAx(EZ, k, a); return [x.x, x.y, x.z, y.x, y.y, y.z, z.x, z.y, z.z]; }

  const FQ = /[?&]r3dfing=([-\d.]+),([-\d.]+),([-\d.]+)/.exec(Q), FC1 = FQ ? +FQ[1] : 1.45, FC2 = FQ ? +FQ[2] : 1.6, FCT = FQ ? +FQ[3] : 1.0;
  const GRIPE = /[?&]r3dgripe=-1/.test(Q) ? -1 : 1;

  function hdFig(f, M) {
    let F = HDF.get(f);
    if (F && F.M === M) return F;
    F = { M, b: M.B.map((b) => ({ Rd: I3, Rw: b.R0, p: b.p0, s: 1 })), springs: M.springs.map((s) => ({ ...s, i: M.ix[s.bone], P: null, Pp: null })), U: new Float32Array((M.nb + 3) * 12), clk: null, x0: 0 };
    HDF.set(f, F);
    return F;
  }
  const HDF = new WeakMap();
  function hset(F, i, p, Rd, s) { const b = F.b[i]; b.p = p; b.Rd = Rd; b.Rw = m3mul(Rd, F.M.B[i].R0); b.s = s; }
  function hcarry(F, i, q) { const B = F.M.B[i], b = F.b[i]; let d = sub(q, B.p0); if (b.s !== 1) d = madd(d, B.d0, dot(d, B.d0) * (b.s - 1)); return add(m3v(b.Rd, d), b.p); }
  function haim(F, i, head, tail, ref0, ref1, stretch) {
    const B = F.M.B[i], d0 = B.d0, d1 = sub(tail, head), L = len(d1) || 1e-3;
    const Rd = m3mul(m3basis(d1, ref1), m3T(m3basis(d0, ref0)));
    hset(F, i, head, Rd, stretch ? L / B.len : 1);
  }
  function hik(s, t, l1, l2, pole) {
    let d = sub(t, s), L = len(d);
    const max = (l1 + l2) * 0.999;
    if (L > max) { d = mul(d, max / L); L = max; }
    L = Math.max(L, 1e-3);
    const u = mul(d, 1 / L), a = (l1 * l1 - l2 * l2 + L * L) / (2 * L), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    let p = sub(pole, mul(u, dot(pole, u))); p = len(p) < 1e-4 ? v3(0, -1, 0) : norm(p);
    return { e: madd(madd(s, u, a), p, h), w: add(s, d) };
  }
  const HAT = { kasa: 1, oni: 1 }, HAT_PITCH = 0.12;
  const FACE_ON = !/[?&]r3dface=0(&|$)/.test(Q), FACE_PITCH = 0.2, FACE_TURN = 0.62;
  function hdPose(f, k, F) {
    const M = F.M, X = M.ix, dir = k.dir, x0 = k.x0;
    F.x0 = x0; F.dir = dir;
    const L = (p) => v3((p.x - x0) * dir, p.y, p.z), Ld = (d) => v3(d.x * dir, d.y, d.z);
    const hip0 = L(k.hip), chest = L(k.chest), neck = L(k.neck), head = L(k.head), cf = Ld(k.cf), hf = Ld(k.hf);


    const grounded = f.onGround && !f.dead && f.state !== 'down' && f.state !== 'launch';
    const hip = v3(hip0.x, grounded ? hip0.y + Math.max(0, M.B[X.hips].p0.y - hip0.y) * STAND : hip0.y, hip0.z);
    const hipR = L(k.hipF), hipL = L(k.hipB);
    let fxp = norm(cross(EY, sub(hipR, hipL))); if (dot(fxp, cf) < 0) fxp = mul(fxp, -1);
    const sc = 1;


    const vy = norm(sub(neck, hip)), tw = (k) => norm(add(mul(fxp, 1 - k), mul(cf, k)));
    const TWS = /[?&]r3dtw=1/.test(Q);
    const Rh = m3basis(vy, TWS ? tw(0.45) : cf), Rs = m3basis(vy, TWS ? tw(0.8) : cf), Rc = m3basis(vy, cf);
    const DBGT = /[?&]r3dtorso=0/.test(Q) ? I3 : null;
    if (M.glb && !DBGT && PELV < 1) {


      const up = norm(lerp(EY, vy, PELV)), Rp = m3basis(up, cf);
      hset(F, X.hips, hip, Rp, sc);
      const sp0 = hcarry(F, X.hips, M.B[X.spine].p0), vs = norm(sub(neck, sp0)), Ru = m3basis(vs, cf);
      hset(F, X.spine, sp0, m3basis(norm(lerp(up, vs, 0.6)), cf), sc);
      if (X.spine1 != null) hset(F, X.spine1, hcarry(F, X.spine, M.B[X.spine1].p0), Ru, sc);
      hset(F, X.chest, hcarry(F, X.spine1 != null ? X.spine1 : X.spine, M.B[X.chest].p0), Ru, sc);
    } else {
      hset(F, X.hips, hip, DBGT || Rh, sc);
      hset(F, X.spine, hcarry(F, X.hips, M.B[X.spine].p0), DBGT || Rs, sc);
      hset(F, X.chest, hcarry(F, X.spine, M.B[X.chest].p0), DBGT || Rc, sc);
    }


    let hu = norm(sub(head, neck)), hfx = hf;
    if (HAT[f.ch && f.ch.acc]) {
      const a = Math.atan2(hu.x, hu.y), lim = HAT_PITCH;
      if (a > lim) { const r = Math.hypot(hu.x, hu.y); hu = norm(v3(Math.sin(lim) * r, Math.cos(lim) * r, hu.z)); }
      if (hf.y < -0.2) hfx = norm(v3(hf.x, -0.2, hf.z));
    }



    if (M.glb && FACE_ON && !HAT[f.ch && f.ch.acc]) {
      const a = Math.atan2(hu.x, hu.y);
      if (a > FACE_PITCH) { const r = Math.hypot(hu.x, hu.y); hu = norm(v3(Math.sin(FACE_PITCH) * r, Math.cos(FACE_PITCH) * r, hu.z)); }
      let q = hfx; if (q.y < -0.12) q = v3(q.x, -0.12, q.z);
      hfx = norm(add(norm(q), v3(0, 0, FACE_TURN)));
    }
    const Rhd = m3basis(hu, hfx);

    const nk = hcarry(F, X.chest, M.B[X.neck].p0), nl = M.B[X.neck].len;
    haim(F, X.neck, nk, madd(nk, hu, nl), EX, norm(add(cf, hfx)), false);
    hset(F, X.head, hcarry(F, X.neck, M.B[X.head].p0), Rhd, 1);

    if (M.sayaA && k.saya) {
      const a = hcarry(F, X.hips, M.sayaA), su = m3v(F.b[X.hips].Rd, M.sayaU);
      k.saya = { a: v3(x0 + a.x * dir, a.y, a.z), u: norm(v3(su.x * dir, su.y, su.z)), L: k.saya.L }; k.slim = 0.85;

      if (!k.noSword && (!k.inHand || k.inside)) {
        const out = k.inHand ? ((f.wpn || ND.LEN).blade || 96) * k.bladeVis : 0;
        k.bu = k.saya.u; k.bh = madd(k.saya.a, k.bu, -out); k.be = norm(sub(EY, mul(k.bu, dot(EY, k.bu))));
      }
    }
    if (M.sayaBk) { const a = hcarry(F, X.chest, M.sayaBk[0]), b = hcarry(F, X.hips, M.sayaBk[1]); k.sayaBk = [v3(x0 + a.x * dir, a.y, a.z), v3(x0 + b.x * dir, b.y, b.z)]; }

    let H = L(k.bh); const u = Ld(k.bu), e = norm(sub(Ld(k.be), mul(u, dot(Ld(k.be), u))));
    const handle = (f.wpn || ND.LEN).handle || 24;
    const RcA = F.b[X.chest].Rd;
    for (const s of ['R', 'L']) {
      const front = s === 'R', gp = M.grip[s], ar = M.armRest[s];
      if (X['clav.' + s] != null) hset(F, X['clav.' + s], hcarry(F, X.chest, M.B[X['clav.' + s]].p0), RcA, 1);
      let sh = hcarry(F, X.chest, M.B[X['upper.' + s]].p0);
      const el = L(front ? k.elF : k.elB), ha = L(front ? k.haF : k.haB);
      const gripQ = () => m3mul(m3basis(u, e), m3T(m3basis(gp.a, gp.p)));
      let Rhand = null, G = null;
      if (!k.noSword) {
        if (front && (k.inHand || len(sub(ha, H)) < 12)) { Rhand = gripQ(); G = madd(H, u, -4.6); }
        else if (!front && k.inHand) {
          const along = dot(sub(ha, H), u), off = len(sub(sub(ha, H), mul(u, along)));
          if (off < 8 && along < 0 && along > -handle - 4) { Rhand = gripQ(); G = madd(H, u, -Math.min(handle - 5, Math.max(13.8, -along))); }
        }
      }


      let held = null;
      if (!Rhand && R3.wpn && R3.wpn.grip) { const q = R3.wpn.grip(f, s, k); if (q) { held = q; Rhand = m3mul(m3basis(Ld(q.u), Ld(q.e)), m3T(m3basis(gp.a, gp.p))); G = q.c ? L(q.c) : ha; } }
      if (!Rhand) {
        const fd = norm(sub(ha, el)), out = sub(el, mul(add(sh, ha), 0.5));
        const fd0 = norm(sub(M.B[X['hand.' + s]].p0, M.B[X['fore.' + s]].p0));
        Rhand = m3mul(m3basis(fd, out), m3T(m3basis(fd0, ar.out)));
        G = ha;
      }
      const hb = M.B[X['hand.' + s]];
      let wr = add(G, m3v(Rhand, sub(hb.p0, gp.c)));


      if (M.glb && X['clav.' + s] != null && CLAV > 0) {
        const a = norm(m3v(RcA, sub(M.B[X['fore.' + s]].p0, M.B[X['upper.' + s]].p0))), b = norm(sub(wr, sh)), ax = cross(a, b), sn = len(ax);
        if (sn > 1e-4) {
          const ang = Math.atan2(sn, dot(a, b)) * CLAV, k = mul(ax, 1 / sn);
          const c0 = rotAx(v3(RcA[0], RcA[1], RcA[2]), k, ang), c1 = rotAx(v3(RcA[3], RcA[4], RcA[5]), k, ang), c2 = rotAx(v3(RcA[6], RcA[7], RcA[8]), k, ang);
          hset(F, X['clav.' + s], F.b[X['clav.' + s]].p, [c0.x, c0.y, c0.z, c1.x, c1.y, c1.z, c2.x, c2.y, c2.z], 1);
          sh = hcarry(F, X['clav.' + s], M.B[X['upper.' + s]].p0);
        }
      }


      if (front && k.inside && M.sayaA && G !== ha) {
        const R = (ar.l1 + ar.l2) * 1.06 * 0.995, d = sub(wr, sh), du = dot(d, u), dd = dot(d, d);
        if (dd > R * R) {
          const disc = du * du - dd + R * R, t = clamp(disc >= 0 ? -du - Math.sqrt(disc) : -du, 0, Math.max(0, dot(sub(L(k.saya.a), H), u)));
          H = madd(H, u, t); G = madd(G, u, t); wr = madd(wr, u, t); k.bh = v3(x0 + H.x * dir, H.y, H.z);
        }
      }
      const pole = sub(el, mul(add(sh, wr), 0.5));
      const sol = hik(sh, wr, ar.l1 * 1.06, ar.l2 * 1.06, pole);

      if (front && G !== ha) { const r = sub(sol.w, wr); if (len(r) > 0.3) { H = add(H, r); k.bh = v3(x0 + H.x * dir, H.y, H.z); } }
      let out1 = sub(sol.e, mul(add(sh, sol.w), 0.5)); if (len(out1) < 1) out1 = pole;
      haim(F, X['upper.' + s], sh, sol.e, ar.out, out1, true);
      haim(F, X['fore.' + s], sol.e, sol.w, ar.out, out1, true);
      hset(F, X['hand.' + s], sol.w, Rhand, 1);

      const Fg = M.fing && M.fing[s];
      if (Fg) {
        const want = G !== ha || held ? 1 : 0.4, cu = F.curl || (F.curl = { R: want, L: want, clk: ND.simClock || 0 });
        cu[s] += (want - cu[s]) * clamp(((ND.simClock || 0) - (cu['t' + s] == null ? (ND.simClock || 0) : cu['t' + s])) * 14, 0, 1); cu['t' + s] = ND.simClock || 0;
        const c = cu[s], kf = cross(Fg.ht, Fg.hw), kt = cross(Fg.hu, Fg.hw), Rh = F.b[X['hand.' + s]].Rd;
        const R1 = m3mul(Rh, rotM(kf, c * FC1)); hset(F, Fg.f1, hcarry(F, X['hand.' + s], M.B[Fg.f1].p0), R1, 1);
        hset(F, Fg.f2, hcarry(F, Fg.f1, M.B[Fg.f2].p0), m3mul(R1, rotM(kf, c * FC2)), 1);
        hset(F, Fg.th, hcarry(F, X['hand.' + s], M.B[Fg.th].p0), m3mul(Rh, rotM(kt, c * FCT)), 1);
      }
    }

    for (const s of ['R', 'L']) {
      const front = s === 'R';
      const so = hcarry(F, X.hips, M.B[X['thigh.' + s]].p0);
      const kn = L(front ? k.knF : k.knB), ft = L(front ? k.ftF : k.ftB), to = Ld(front ? k.toF : k.toB);
      const an = v3(ft.x, ft.y + M.B[X['foot.' + s]].p0.y, ft.z);
      let kf = sub(kn, mul(add(so, an), 0.5)); if (len(kf) < 1) kf = fxp;

      const l1 = len(sub(M.B[X['shin.' + s]].p0, M.B[X['thigh.' + s]].p0)), l2 = len(sub(M.B[X['foot.' + s]].p0, M.B[X['shin.' + s]].p0));
      const lg = hik(so, an, l1, l2, kf);
      haim(F, X['thigh.' + s], so, lg.e, EX, kf, false);
      haim(F, X['shin.' + s], lg.e, lg.w, EX, kf, false);
      ft.x = lg.w.x; ft.z = lg.w.z;
      const th = v3(to.x, 0, to.z);
      hset(F, X['foot.' + s], lg.w, len(th) > 0.1 ? m3basis(EY, th) : I3, 1);
    }

    const done = new Uint8Array(M.nb);
    for (const n of ['hips', 'spine', 'spine1', 'chest', 'neck', 'head', 'clav.R', 'clav.L', 'upper.R', 'upper.L', 'fore.R', 'fore.L', 'hand.R', 'hand.L', 'thigh.R', 'thigh.L', 'shin.R', 'shin.L', 'foot.R', 'foot.L']) if (X[n] != null) done[X[n]] = 1;
    for (const s in M.fing || {}) { const Fg = M.fing[s]; done[Fg.f1] = done[Fg.f2] = done[Fg.th] = 1; }
    const follow = (i) => { if (done[i]) return; const pi = M.B[i].parent; follow(pi); hset(F, i, hcarry(F, pi, M.B[i].p0), F.b[pi].Rd, 1); done[i] = 1; };
    for (let i = 0; i < M.nb; i++) follow(i);
    clothStep(F, f, k);
    hdSprings(F, f, k);

    const z = cross(e, u);
    const put = (j, Xc, Yc, Zc, o) => { const q = (M.nb + j) * 12, U = F.U; U[q] = Xc.x; U[q + 1] = Yc.x; U[q + 2] = Zc.x; U[q + 3] = o.x; U[q + 4] = Xc.y; U[q + 5] = Yc.y; U[q + 6] = Zc.y; U[q + 7] = o.y; U[q + 8] = Xc.z; U[q + 9] = Yc.z; U[q + 10] = Zc.z; U[q + 11] = o.z; };
    const zero = (j) => F.U.fill(0, (M.nb + j) * 12, (M.nb + j) * 12 + 12);
    if (k.noSword || R3.wpn) { zero(0); zero(1); } else { put(0, e, u, z, H); if (k.inHand && k.bladeVis > 0.05) put(1, e, u, z, H); else zero(1); }
    if (M.hasSaya && k.saya && !R3.wpn) {
      const a = L(k.saya.a), su = Ld(k.saya.u);
      let x = k.inHand ? EY : e; x = norm(sub(x, mul(su, dot(x, su))));
      put(2, x, su, cross(x, su), a);
    } else zero(2);

    for (let i = 0; i < M.nb; i++) {
      const B = M.B[i], b = F.b[i], s = b.s, d = B.d0;
      const A = s === 1 ? b.Rd : m3mul(b.Rd, [1 + (s - 1) * d.x * d.x, (s - 1) * d.y * d.x, (s - 1) * d.z * d.x, (s - 1) * d.x * d.y, 1 + (s - 1) * d.y * d.y, (s - 1) * d.z * d.y, (s - 1) * d.x * d.z, (s - 1) * d.y * d.z, 1 + (s - 1) * d.z * d.z]);
      const t = sub(b.p, m3v(A, B.p0));
      const q = i * 12, U = F.U;
      U[q] = A[0]; U[q + 1] = A[3]; U[q + 2] = A[6]; U[q + 3] = t.x;
      U[q + 4] = A[1]; U[q + 5] = A[4]; U[q + 6] = A[7]; U[q + 7] = t.y;
      U[q + 8] = A[2]; U[q + 9] = A[5]; U[q + 10] = A[8]; U[q + 11] = t.z;
    }

    const hk = M.glb && !HQ ? 1 : HEADK;
    if (hk !== 1) {
      const pv = F.b[X.head].p, U = F.U;
      for (const i of M.headSet) { const q = i * 12; for (let r = 0; r < 3; r++) { const o = q + r * 4, c = r === 0 ? pv.x : r === 1 ? pv.y : pv.z; U[o] *= hk; U[o + 1] *= hk; U[o + 2] *= hk; U[o + 3] = c + hk * (U[o + 3] - c); } }
    }
    if (REST) for (let i = 0; i < M.nb; i++) { const q = i * 12; F.U.fill(0, q, q + 12); F.U[q] = F.U[q + 5] = F.U[q + 10] = 1; }
  }
  const REST = /[?&]r3drest=1(&|$)/.test(Q);
  const HQ = /[?&]r3dhead=([\d.]+)/.exec(Q), SQ = /[?&]r3dstand=([\d.]+)/.exec(Q);
  const HEADK = HQ ? +HQ[1] : 0.8, STAND = SQ ? +SQ[1] : 0.35;
  const CQ = /[?&]r3dclav=([\d.]+)/.exec(Q), CLAV = CQ ? +CQ[1] : 0.33;
  const PQ = /[?&]r3dpelvis=([\d.]+)/.exec(Q), PELV = PQ ? +PQ[1] : 0.45;





  function clothStep(F, f, k) {
    const M = F.M, CL = M.cloth;
    if (!CL) return;
    const X = M.ix, dir = F.dir, ox = F.x0, clk = ND.simClock || 0;
    let steps = 0;
    if (F.cclk == null || !F.cs) { F.cclk = clk; F.cs = { ch: [], sl: [] }; }
    else { steps = Math.round((clk - F.cclk) * 120); if (steps < 0 || steps > 30) { steps = 0; F.cclk = clk; F.cs = { ch: [], sl: [] }; } else F.cclk += steps / 120; }
    const toW = (p) => v3(ox + p.x * dir, p.y, p.z), toL = (p) => v3((p.x - ox) * dir, p.y, p.z), dt = 1 / 120;
    const hipsRd = F.b[X.hips].Rd;
    const verlet = (st, T, kk, damp, grav) => { const vel = mul(sub(st.P, st.Pp), damp), acc = madd(v3(0, -grav, 0), sub(T, st.P), kk); st.Pp = st.P; st.P = madd(add(st.P, vel), acc, dt * dt); };
    const keepLen = (P, H, l) => madd(H, norm(sub(P, H)), l);
    const capAng = (P, H, T, l, mx) => { let d = norm(sub(P, H)); const dr = norm(sub(T, H)), ang = Math.acos(clamp(dot(d, dr), -1, 1)); if (ang > mx) { const ax = cross(dr, d); if (len(ax) > 1e-6) d = rotAx(dr, norm(ax), mx); } return madd(H, d, l); };
    if (CL.skirt) {
      const S = CL.skirt, caps = [];
      for (const s of ['L', 'R']) {
        const hp = toW(F.b[X['thigh.' + s]].p), kn = toW(F.b[X['shin.' + s]].p), an = toW(F.b[X['foot.' + s]].p);
        caps.push([hp, kn, S.legR], [kn, an, S.shinR]);
      }
      const push = (P) => { for (const [a, b, r] of caps) { const ab = sub(b, a), t = clamp(dot(sub(P, a), ab) / (dot(ab, ab) || 1), 0, 1), q = madd(a, ab, t), d = sub(P, q), l = len(d); if (l < r && l > 1e-4) P = madd(q, d, r / l); } return P; };

      const lg = {};
      for (const s of ['L', 'R']) {
        const kn0 = hcarry(F, X.hips, M.B[X['shin.' + s]].p0), an0 = hcarry(F, X.hips, M.B[X['foot.' + s]].p0);
        lg[s] = { dk: sub(F.b[X['shin.' + s]].p, kn0), da: sub(F.b[X['foot.' + s]].p, an0) };
      }
      S.chains.forEach((c, n) => {
        const A = M.B[c.a], Bb = M.B[c.b];
        const head = hcarry(F, X.hips, A.p0);
        let Tm = hcarry(F, X.hips, Bb.p0), Tt = hcarry(F, X.hips, c.tail);
        for (const s of ['L', 'R']) { const w = c.aff[s] || 0; if (w > 0) { Tm = madd(Tm, lg[s].dk, w); Tt = madd(Tt, lg[s].da, w); } }
        const Hw = toW(head), TmW = toW(Tm), TtW = toW(Tt);
        let st = F.cs.ch[n];
        if (!st) st = F.cs.ch[n] = { m: { P: TmW, Pp: TmW }, t: { P: TtW, Pp: TtW } };
        for (let i = 0; i < steps; i++) {
          verlet(st.m, TmW, S.k, S.damp, S.grav); verlet(st.t, TtW, S.k, S.damp, S.grav);
          st.m.P = capAng(push(keepLen(st.m.P, Hw, A.len)), Hw, TmW, A.len, S.max);
          st.t.P = keepLen(push(keepLen(st.t.P, st.m.P, Bb.len)), st.m.P, Bb.len);
          st.t.P = capAng(st.t.P, st.m.P, add(st.m.P, sub(TtW, TmW)), Bb.len, S.max);
        }

        const Pm = capAng(push(keepLen(st.m.P, Hw, A.len)), Hw, TmW, A.len, S.max), Pt = keepLen(push(keepLen(st.t.P, Pm, Bb.len)), Pm, Bb.len);
        const r0 = v3(A.R0[0], A.R0[1], A.R0[2]), r1 = m3v(hipsRd, r0);
        haim(F, c.a, head, toL(Pm), r0, r1, false);
        haim(F, c.b, toL(Pm), toL(Pt), v3(Bb.R0[0], Bb.R0[1], Bb.R0[2]), r1, false);
      });
    }
    for (const [n, q] of (CL.sleeves || []).entries()) {
      const B = M.B[q.i], pi = B.parent, head = hcarry(F, pi, B.p0);
      const dRest = norm(m3v(F.b[pi].Rd, B.d0)), want = norm(lerp(dRest, v3(0, -1, 0), q.hang));
      const Hw = toW(head), TW = toW(madd(head, want, B.len));
      let st = F.cs.sl[n];
      if (!st) st = F.cs.sl[n] = { P: TW, Pp: TW };
      const RW = toW(madd(head, dRest, B.len));
      for (let i = 0; i < steps; i++) { verlet(st, TW, q.k, q.damp, q.grav); st.P = capAng(keepLen(st.P, Hw, B.len), Hw, RW, B.len, q.max); }
      const P = capAng(keepLen(st.P, Hw, B.len), Hw, RW, B.len, q.max);
      const r0 = v3(B.R0[0], B.R0[1], B.R0[2]);
      haim(F, q.i, head, toL(P), r0, m3v(F.b[pi].Rd, r0), false);
    }
  }


  function hdSprings(F, f, k) {
    const M = F.M, X = M.ix, dir = F.dir, ox = F.x0;
    const clk = ND.simClock || 0;
    let steps = 0;
    if (F.clk == null) F.clk = clk;
    else {
      steps = Math.round((clk - F.clk) * 120);
      if (steps < 0 || steps > 30) { steps = 0; F.clk = clk; for (const sp of F.springs) sp.P = null; } else F.clk += steps / 120;
    }
    const toW = (p) => v3(ox + p.x * dir, p.y, p.z), toL = (p) => v3((p.x - ox) * dir, p.y, p.z);
    const col = () => {
      const hd = X.head, ch = X.chest, sp = X.spine, hp = X.hips;
      return [[hcarry(F, hd, M.hc0), 11.5], [hcarry(F, ch, add(lerp(M.B[ch].p0, M.B[X.neck].p0, 0.45), v3(-3, 0, 0))), 13], [hcarry(F, sp, add(M.B[sp].p0, v3(-2, 0, 0))), 12.5], [hcarry(F, hp, add(M.B[hp].p0, v3(-2, -4, 0))), 13]];
    };
    const C = M.springs.some((s) => s.coll) ? col() : null;
    for (const sp of F.springs) {
      const i = sp.i, B = M.B[i], pi = B.parent, pb = F.b[pi];
      const head = hcarry(F, pi, B.p0);
      const Rf = m3mul(pb.Rd, B.R0), tailL = add(head, m3v(Rf, v3(0, B.len, 0)));
      const T = toW(tailL), Hw = toW(head);
      if (!sp.P) { sp.P = T; sp.Pp = T; }
      for (let n = 0; n < steps; n++) {
        const dt = 1 / 120, vel = mul(sub(sp.P, sp.Pp), sp.damp), acc = madd(v3(0, -sp.grav, 0), sub(T, sp.P), sp.k);
        sp.Pp = sp.P; sp.P = madd(add(sp.P, vel), acc, dt * dt);
        let d = sub(sp.P, Hw); const dl = len(d) || 1; d = mul(d, 1 / dl);
        const dr = norm(sub(T, Hw)), ang = Math.acos(clamp(dot(d, dr), -1, 1)), mx = sp.max || 1.2;
        if (ang > mx) { const ax = cross(dr, d); if (len(ax) > 1e-6) d = rotAx(dr, norm(ax), mx); }
        sp.P = madd(Hw, d, B.len);
        if (sp.coll && C) { let pl = toL(sp.P); for (const [c, r] of C) { const dd = sub(pl, c), l = len(dd); if (l < r) pl = madd(c, norm(dd), r); } sp.P = toW(pl); }
      }
      const tl = toL(sp.P);
      haim(F, i, head, tl, v3(B.R0[0], B.R0[1], B.R0[2]), v3(Rf[0], Rf[1], Rf[2]), false);
      for (let c = 0; c < M.nb; c++) if (M.B[c].parent === i && !F.springs.some((s) => s.i === c)) hset(F, c, hcarry(F, i, M.B[c].p0), F.b[i].Rd, 1);
    }
  }
  const VSH = `#version 300 es
precision highp float;
layout(location=0) in vec3 aP; layout(location=1) in vec4 aN; layout(location=2) in vec4 aC; layout(location=3) in vec4 aS; layout(location=4) in vec4 aW; layout(location=5) in float aM; layout(location=6) in vec2 aUV; layout(location=7) in vec4 aNs;
uniform vec4 uB[${(MAXB + 3) * 3}];
uniform mat4 uVP, uRoot; uniform float uInk, uInkZ, uInkU, uDarkPush, uHasTex; uniform vec2 uView; uniform sampler2D uTex;
uniform vec3 uTone[7]; uniform vec3 uMat[7];
out vec3 vN; out vec3 vNs; out vec3 vW; out vec4 vC; out vec2 vUV; flat out vec3 vTone; flat out vec3 vMat;
void main(){
  vec4 p = vec4(aP, 1.0); vec3 n0 = aN.xyz;
  // (the smoothed normal, js glbSmooth: the toon looks' light bands and the even ink edge; none: the model's own)
  vec3 s0 = dot(aNs.xyz, aNs.xyz) > 0.01 ? aNs.xyz : n0;
  vec3 w = vec3(0.0), n = vec3(0.0), ns = vec3(0.0);
  for (int j = 0; j < 4; j++) {
    float wt = aW[j];
    if (wt <= 0.0) continue;
    int b = int(aS[j] + 0.5) * 3;
    vec4 r0 = uB[b], r1 = uB[b + 1], r2 = uB[b + 2];
    w += wt * vec3(dot(r0, p), dot(r1, p), dot(r2, p));
    n += wt * vec3(dot(r0.xyz, n0), dot(r1.xyz, n0), dot(r2.xyz, n0));
    ns += wt * vec3(dot(r0.xyz, s0), dot(r1.xyz, s0), dot(r2.xyz, s0));
  }
  vec4 W = uRoot * vec4(w, 1.0);
  n = normalize(mat3(uRoot) * n);
  ns = normalize(mat3(uRoot) * ns);
  vec4 c = uVP * W;
  if (uInk > 0.0) {
    // (uInkU > 0, the looks' ink: the same width everywhere along the smoothed normal; else the model's own share)
    vec3 ne = uInkU > 0.0 ? ns : n;
    vec4 cn = uVP * vec4(ne, 0.0);
    vec2 d = cn.xy * c.w - c.xy * cn.w;
    float l = length(d);
    if (l > 1e-8) c.xy += (d / l) * (uInk * (uInkU > 0.0 ? uInkU : max(aN.w, 0.0))) * (2.0 / uView) * c.w;
    c.z += uInkZ * c.w;
  }
  int m = int(aM + 0.5);
  // (?ucb=toon: the darkest paint - the hair - a hair's breadth toward the camera: Meshy's hair lies on the kimono and
  // the ribbon, and where the posed body pressed them through it they showed as white and red specks in the hair)
  if (uDarkPush > 0.0 && uHasTex > 0.5) { vec3 tc = textureLod(uTex, aUV, 2.0).rgb; if (dot(tc, vec3(0.2126, 0.7152, 0.0722)) < 0.06) c.z -= uDarkPush * c.w; }
  vTone = uTone[m]; vMat = uMat[m]; vUV = aUV;
  gl_Position = c; vN = n; vNs = ns; vW = W.xyz; vC = aC;
}`;
  const FSH = `#version 300 es
precision highp float;
in vec3 vN; in vec3 vNs; in vec3 vW; in vec4 vC; in vec2 vUV; flat in vec3 vTone; flat in vec3 vMat;
uniform sampler2D uTex, uNrm, uFlat; uniform float uHasTex, uHasNrm, uBackDim, uSoft, uOldLook;
uniform float uInk; uniform vec3 uInkC;
uniform vec3 uKeyD, uKeyC, uShade, uEye, uLift; uniform float uFlash, uKeyA;
uniform vec4 uL[4]; uniform vec3 uLC[4];
// the look (js LOOK, ?r3dlook=): 0 painted (Sifu), 1 toon, 2 full toon; the flat-colour picture's share (js flatTex),
// the texture's level bias (sharper painting), the colours' saturation, the rim's strength
uniform float uLook, uHasFlat, uFlatK, uBias, uSat, uRim, uMask, uStep3; uniform vec2 uView;
out vec4 o;
// (alpha: 1 - uMask; the post passes leave the fighters out of the glow and the film grain where it is 0, js/gl-render.js)
void main(){
  float oa = 1.0 - uMask;
  if (uInk > 0.0) { o = vec4(uInkC, oa); return; }
  vec3 tx = vec3(1.0);
  if (uHasTex > 0.5) { tx = texture(uTex, vUV, uBias).rgb; if (uHasFlat > 0.5) tx = mix(tx, texture(uFlat, vUV, uBias).rgb, uFlatK); }
  vec3 base = tx * vC.rgb;
  if (uStep3 > 0.0 && vC.a < 0.5) base = vC.rgb; // (?ucb=toon: the triangle's own flat colour)
  if (uSat != 1.0) { float lb = dot(base, vec3(0.2126, 0.7152, 0.0722)); base = clamp(mix(vec3(lb), base, uSat), 0.0, 1.0); }
  if (vMat.z > 0.5) { o = vec4(base, oa); return; }
  vec3 n = normalize(vN); bool back = !gl_FrontFacing; if (back) n = -n;
  if (uLook > 0.5) {
    // the stylised looks, all lit from the smoothed normal (no relief map: its busy folds would break flat tones into
    // specks); tone edges a pixel wide (fwidth): crisp, never stair-stepped
    //   1 CEL (B): strictly two tones per colour - lit / shadow - with a hard edge, a cool shadow, a light rim
    //   2 COMIC (C): bold colour, hard near-black shadow shapes crossed by screen hatching, a hard white rim
    //   3 SOFT (D): painterly anime - no ink, soft wrapped light, bright clean colours, a soft sky fill and rim
    vec3 g = normalize(vNs); if (back) g = -g;
    vec3 V = normalize(uEye - vW);
    int lk = int(uLook + 0.5);
    float d = dot(g, uKeyD), fw = max(fwidth(d), 1e-3) * 0.75;
    vec3 kc = normalize(uKeyC + vec3(0.6)) * 1.732;
    float fr = 1.0 - max(dot(g, V), 0.0), fwr = max(fwidth(fr), 1e-3) * 0.75;
    vec3 col;
    if (lk == 3) {
      float wr = 0.5 + 0.5 * d;
      vec3 sky = mix(vec3(0.62, 0.66, 0.86), vec3(0.95, 0.93, 1.0), 0.5 + 0.5 * g.y);
      col = base * (sky * 0.5 + mix(vec3(1.0), kc, 0.22) * 0.68 * smoothstep(0.35, 0.8, wr));
      for (int k = 0; k < 4; k++) {
        vec4 L = uL[k];
        if (L.w <= 0.0) continue;
        vec3 v = L.xyz - vW; float dist = length(v);
        float I = L.w * (dist < 234.0 ? mix(0.42, 0.12, dist / 234.0) : mix(0.12, 0.0, clamp((dist - 234.0) / 286.0, 0.0, 1.0)));
        col += uLC[k] * I * smoothstep(-0.2, 0.7, dot(g, v / max(dist, 1.0))) * base * 1.1;
      }
      col += smoothstep(0.55, 1.0, fr) * mix(vec3(0.75, 0.82, 1.0), kc, 0.3) * 0.22 * uRim;
      col = col * 1.06 + 0.02;
    } else {
      bool comic = lk == 2;
      float t0 = comic ? 0.06 : -0.06;
      float lit = smoothstep(t0 - fw, t0 + fw, d);
      vec3 sh = comic ? vec3(0.3, 0.29, 0.4) : mix(uShade, vec3(1.0), 0.45) * vec3(0.58, 0.6, 0.78);
      col = base * mix(sh, mix(vec3(1.0), kc, 0.15) * (comic ? 1.08 : 1.0), lit);
      // (?ucb=toon: a third, darker step where the model's own surface turns well away from the light - the folds and
      // pleats the smoothed normal leaves out; a hard edge too)
      if (uStep3 > 0.0 && dot(base, vec3(0.2126, 0.7152, 0.0722)) > 0.08) { float dd = dot(n, uKeyD), f3 = max(fwidth(dd), 1e-3) * 0.75; col *= mix(vec3(0.72, 0.7, 0.8), vec3(1.0), smoothstep(-0.42 - f3, -0.42 + f3, dd) * uStep3 + (1.0 - uStep3)); }
      if (comic) {
        // hatching across the shadow (screen lines, about 5 px apart at 1080 rows), heavier where it is darkest
        float px = gl_FragCoord.x + gl_FragCoord.y, per = max(3.0, 5.0 * uView.y / 1080.0);
        float hw = mix(0.18, 0.42, smoothstep(t0, -0.6, d));
        float hl = 1.0 - smoothstep(hw - 0.12, hw + 0.12, abs(fract(px / per) - 0.5) * 2.0);
        col = mix(col, base * 0.08, hl * (1.0 - lit) * 0.85);
      }
      for (int k = 0; k < 4; k++) {
        vec4 L = uL[k];
        if (L.w <= 0.0) continue;
        vec3 v = L.xyz - vW; float dist = length(v);
        float I = L.w * (dist < 234.0 ? mix(0.42, 0.12, dist / 234.0) : mix(0.12, 0.0, clamp((dist - 234.0) / 286.0, 0.0, 1.0)));
        float nd = dot(g, v / max(dist, 1.0)), fl = max(fwidth(nd), 1e-3) * 0.75;
        col += uLC[k] * I * smoothstep(0.15 - fl, 0.15 + fl, nd) * base * 1.25;
      }
      float rw = comic ? 0.7 : 0.76;
      float rim = smoothstep(rw - fwr, rw + fwr, fr) * mix(0.1, 1.0, smoothstep(0.0, 0.4, d)) * uRim;
      // (?ucb=toon: no rim on the darkest paint - the hair's many thin strands each caught one: light streaks)
      if (uStep3 > 0.0) rim *= smoothstep(0.06, 0.2, dot(base, vec3(0.2126, 0.7152, 0.0722)));
      col = mix(col, comic ? vec3(1.0, 0.98, 0.94) : mix(vec3(0.8, 0.86, 1.0), kc * 0.7, 0.3) * (0.55 + 0.45 * base), rim * (comic ? 0.9 : 0.8));
    }
    // (?ucb=toon: no lift - its accent-red edge light caught every thin hair strand: red specks in the hair)
    if (uStep3 <= 0.0) col += uLift * smoothstep(0.7, 0.8, fr);
    col *= mix(0.88, 1.0, clamp(vW.y / 70.0, 0.0, 1.0));
    o = vec4(mix(col, vec3(1.0, 0.96, 0.94), uFlash * 0.38), oa); return;
  }
  if (uHasNrm > 0.5) {
    // the baked relief (tangent space of the model's UVs, Blender's: green toward the picture's top, so -v here): the
    // tangent frame from the screen derivatives of the position and the UVs (no tangents in the file)
    vec3 t = texture(uNrm, vUV).xyz * 2.0 - 1.0; t.y = -t.y;
    vec3 dp1 = dFdx(vW), dp2 = dFdy(vW); vec2 du1 = dFdx(vUV), du2 = dFdy(vUV);
    vec3 a1 = cross(dp2, n), a2 = cross(n, dp1);
    vec3 T = a1 * du1.x + a2 * du2.x, B = a1 * du1.y + a2 * du2.y;
    float im = inversesqrt(max(max(dot(T, T), dot(B, B)), 1e-20));
    vec3 pn = mat3(T * im, B * im, n) * t;
    if (dot(pn, pn) > 1e-6) n = normalize(pn);
  }
  vec3 V = normalize(uEye - vW);
  // (tools: the texture alone, unlit - the model's own painting. 2 only: until 2026-10-06 this caught 3 too, so the
  // studio light below never ran and every outside model was drawn unlit - flat, "faded", the owner's word)
  if (uSoft > 1.5 && uSoft < 2.5) { o = vec4(base, oa); return; }
  if (uSoft > 2.5) {
    // (the model's own look, as a model viewer shows it under an even studio light: the texture's painting kept bright
    // and clean - a sky / floor fill, a soft key from the arena's main light in its colour, the lanterns a little)
    // (owner, 2026-10-06: "faded" - the light was nearly all ambient (0.66-0.9 + 0.28 key), so a white kimono went past
    // 1.0 flat white and the relief barely read: less ambient, more key, and a soft shoulder below white, so the
    // painting's own light and dark and the normal map's folds show; ?r3dgold=1 the earlier light)
    float dk = dot(n, uKeyD), sky = 0.5 + 0.5 * n.y;
    vec3 kc = normalize(uKeyC + vec3(0.6)) * 1.732;
    vec3 ce = uOldLook > 0.5 ? base * (mix(0.66, 0.9, sky) + 0.28 * max(dk, 0.0) * mix(vec3(1.0), kc, 0.35))
      : base * (mix(0.56, 0.82, sky) + 0.38 * max(dk, 0.0) * mix(vec3(1.0), kc, 0.35));
    for (int k = 0; k < 4; k++) {
      vec4 L = uL[k];
      if (L.w <= 0.0) continue;
      vec3 v = L.xyz - vW; float dist = length(v);
      float I = L.w * (dist < 234.0 ? mix(0.42, 0.12, dist / 234.0) : mix(0.12, 0.0, clamp((dist - 234.0) / 286.0, 0.0, 1.0)));
      ce += uLC[k] * I * 0.6 * max(dot(n, v / max(dist, 1.0)), 0.0) * base;
    }
    ce += smoothstep(0.8, 0.96, 1.0 - max(dot(n, V), 0.0)) * (uKeyC * 0.06 + uLift * 0.6);
    if (uOldLook < 0.5) { vec3 x = max(ce - 0.82, 0.0); ce = min(ce, vec3(0.82)) + 0.18 * (1.0 - exp(-x / 0.18)); }
    if (uRim > 0.0) {
      // (the painted look at its crispest, ?r3dlook=sifu: a thin moonlit edge on the key light's side from the smoothed
      // normal - a dark coat stays readable against the night without the glow that used to haze it - and a breath of
      // night-blue in the darkest paint, so black cloth keeps its folds)
      vec3 g = normalize(vNs); if (back) g = -g;
      float fr = 1.0 - max(dot(g, V), 0.0), fwr = max(fwidth(fr), 1e-3) * 0.75;
      float rim = smoothstep(0.74 - fwr, 0.74 + fwr, fr) * mix(0.15, 1.0, smoothstep(0.0, 0.4, dot(g, uKeyD))) * uRim;
      ce = mix(ce, mix(vec3(0.74, 0.8, 0.96), kc * 0.6, 0.3) * (0.5 + 0.5 * base), rim * 0.5);
      ce += vec3(0.018, 0.022, 0.036) * (1.0 - smoothstep(0.0, 0.25, dot(ce, vec3(0.333))));
    }
    o = vec4(mix(ce, vec3(1.0, 0.96, 0.94), uFlash * 0.38), oa); return;
  }
  if (uSoft > 0.5) {
    // (a painted texture keeps its own painting: soft light only - no tone steps, no highlight, no rim speckles on the
    // model's busy normals; the key light's colour, the lanterns, a faint rim in the arena's colour)
    float dk = dot(n, uKeyD);
    vec3 cs = base * mix(0.74, 1.04, smoothstep(-0.55, 0.85, dk)) * mix(uShade, vec3(1.0), 0.6) + base * uKeyC * uKeyA * 0.7 * max(dk, 0.0);
    for (int k = 0; k < 4; k++) {
      vec4 L = uL[k];
      if (L.w <= 0.0) continue;
      vec3 v = L.xyz - vW; float dist = length(v);
      float I = L.w * (dist < 234.0 ? mix(0.42, 0.12, dist / 234.0) : mix(0.12, 0.0, clamp((dist - 234.0) / 286.0, 0.0, 1.0)));
      cs += uLC[k] * I * (0.35 + 0.65 * smoothstep(-0.3, 0.6, dot(n, v / max(dist, 1.0)))) * base * 1.2;
    }
    float rs = smoothstep(0.78, 0.95, 1.0 - max(dot(n, V), 0.0));
    cs += rs * (uKeyC * 0.08 + uLift * 0.7);
    cs *= mix(0.8, 1.0, clamp(vW.y / 70.0, 0.0, 1.0));
    o = vec4(mix(cs, vec3(1.0, 0.96, 0.94), uFlash * 0.38), oa); return;
  }
  float d = dot(n, uKeyD), fw = max(fwidth(d), 1e-3) * 1.2;
  float t = mix(vTone.z, vTone.y, smoothstep(-0.16 - fw, -0.08 + fw, d));
  t = mix(t, vTone.x, smoothstep(0.38 - fw, 0.46 + fw, d));
  vec3 col = base * t * mix(uShade, vec3(1.0), smoothstep(-0.2, 0.3, d)) + uKeyC * uKeyA * 0.9 * smoothstep(0.38, 0.46, d);
  vec3 h = normalize(uKeyD + V);
  col += smoothstep(0.945, 0.962, dot(n, h)) * vMat.x * (base * 0.55 + vec3(0.13));
  for (int k = 0; k < 4; k++) {
    vec4 L = uL[k];
    if (L.w <= 0.0) continue;
    vec3 v = L.xyz - vW; float dist = length(v);
    float I = L.w * (dist < 234.0 ? mix(0.42, 0.12, dist / 234.0) : mix(0.12, 0.0, clamp((dist - 234.0) / 286.0, 0.0, 1.0)));
    float nd = dot(n, v / max(dist, 1.0));
    col += uLC[k] * I * (nd > 0.2 ? 1.0 : (nd > -0.25 ? 0.45 : 0.12)) * (base * 1.4 + 0.12);
  }
  float rim = smoothstep(0.7, 0.84, 1.0 - max(dot(n, V), 0.0)) * vMat.y;
  col = mix(col, vec3(0.66, 0.71, 0.86), rim * 0.4);
  col += rim * uLift;
  if (back) col *= uBackDim;
  col *= mix(0.72, 1.0, clamp(vW.y / 70.0, 0.0, 1.0));
  col = mix(col, vec3(1.0, 0.96, 0.94), uFlash * 0.38);
  o = vec4(col, oa);
}`;



  const GQ = (k, d) => { const m = new RegExp('[?&]' + k + '=([\\w.]+)').exec(Q); return m ? m[1] : d; };
  const OLDLOOK = GQ('r3dglook', '') === 'old';
  const GLB_LOOK = { ink: GQ('r3dgink', OLDLOOK ? 'old' : 'sil'), soft: GQ('r3dgsoft', OLDLOOK ? '0' : '3') === '1', flat: GQ('r3dgsoft', '') === '2', env: GQ('r3dgsoft', OLDLOOK ? '0' : '3') === '3', cull: GQ('r3dgcull', '0') === '1', aniso: GQ('r3dganiso', OLDLOOK ? '0' : '1') === '1', inkZ: +GQ('r3dginkz', '0.006'), inkK: +GQ('r3dginkk', '1.3') };










  const LOOKS = {
    sifu: { id: 0, flatK: 0, sat: 1, bias: -0.5, ink: 0.95, inkMin: 1.25, z: 0.006, rim: 1, palSat: 1, palFloor: 0, edge: 0 },
    toon: { id: 1, flatK: 1, sat: 1.1, bias: -0.35, ink: 1.6, inkMin: 1.6, z: 0.004, rim: 0.85, palSat: 1.12, palFloor: 0.26, edge: 0 },
    comic: { id: 2, flatK: 1, sat: 1.3, bias: -0.25, ink: 3, inkMin: 2.5, z: 0.0012, rim: 1, palSat: 1.45, palFloor: 0.3, edge: 2.5 },
    soft: { id: 3, flatK: 0.85, sat: 1.15, bias: -0.35, ink: 0, inkMin: 0, z: 0.006, rim: 1, palSat: 1.15, palFloor: 0.32, edge: 0 },
  };







  LOOKS.ucb = Object.assign({}, LOOKS.toon, { k: 9, fwc: 3, skinHu: [0.2, 1.3], flatK: 0, sat: 1, bias: 0, pic: 'duz', step3: 1, darkPush: +GQ('ucbpush', '0'), z: +GQ('ucbinkz', '0.008') });
  LOOKS.anime = LOOKS.comic; LOOKS.cel = LOOKS.toon;
  const LOOKQ = GQ('r3dlook', 'sifu'), LOOK = OLDLOOK ? null : LOOKS[LOOKQ] || LOOKS.sifu;
  const LOOKN = { 0: 'sifu', 1: 'toon', 2: 'comic', 3: 'soft' };
  const NOMASK = GQ('r3dmask', '1') === '0';
  R3.look = LOOK ? LOOKN[LOOK.id] : 'old';
  R3.lookOf = () => LOOK;
  R3.maskOn = () => !!(LOOK && !NOMASK && R3.prep);

  R3.inkW = (base) => (LOOK ? clamp(LOOK.ink * cam.k * RIG.zoom * FR.fit, LOOK.inkMin, 7) : base);







  const FLAT = new Map();
  let FLATP = null;
  const OK = (r, g, b) => {
    const li = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    r = li(r); g = li(g); b = li(b);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), q = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * q, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * q, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * q];
  };
  const OKinv = (L, a, b) => {
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3), q = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
    const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * q, g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * q, bb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * q;
    const en = (c) => clamp(c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055, 0, 1);
    return [en(r), en(g), en(bb)];
  };
  const FW_L = 0.63, FW_C = (LOOK && LOOK.fwc) || 2;
  const FLAT_GLSL = `
vec3 lin(vec3 c){ return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c)); }
vec3 feat(vec3 c){
  c = lin(c);
  vec3 lms = vec3(0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b, 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b, 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b);
  lms = pow(max(lms, vec3(0.0)), vec3(1.0 / 3.0));
  vec3 ok = vec3(0.2104542553 * lms.x + 0.793617785 * lms.y - 0.0040720468 * lms.z, 1.9779984951 * lms.x - 2.428592205 * lms.y + 0.4505937099 * lms.z, 0.0259040371 * lms.x + 0.7827717662 * lms.y - 0.808675766 * lms.z);
  return vec3(ok.x * ${FW_L.toFixed(3)}, ok.y * ${FW_C.toFixed(3)}, ok.z * ${FW_C.toFixed(3)});
}`;
  function flatInit(gl) {
    const sh = (t, src) => { const x = gl.createShader(t); gl.shaderSource(x, src); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error('r3d flat shader: ' + gl.getShaderInfoLog(x)); return x; };
    const prog = (fs) => { const q = gl.createProgram(); gl.attachShader(q, sh(gl.VERTEX_SHADER, '#version 300 es\nlayout(location=0) in vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }')); gl.attachShader(q, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(q); if (!gl.getProgramParameter(q, gl.LINK_STATUS)) throw new Error('r3d flat link: ' + gl.getProgramInfoLog(q)); return q; };
    const samp = prog(`#version 300 es
precision highp float; precision highp int;
uniform sampler2D uS; uniform ivec2 uStep; out vec4 o;
void main(){ ivec2 q = ivec2(gl_FragCoord.xy) * uStep + uStep / 2; o = texelFetch(uS, q, 0); }`);
    const bake = prog(`#version 300 es
precision highp float; precision highp int;
uniform sampler2D uS; uniform int uN, uK, uE; uniform vec3 uF[16]; uniform vec3 uC[16]; out vec4 o;
${FLAT_GLSL}
int near(vec3 c){ vec3 f = feat(c); int bi = 0; float bd = 1e9; for (int i = 0; i < 16; i++) { if (i >= uN) break; vec3 d = f - uF[i]; float e = dot(d, d); if (e < bd) { bd = e; bi = i; } } return bi; }
void main(){
  ivec2 sz = textureSize(uS, 0), p = ivec2(gl_FragCoord.xy) * uK;
  float v[16]; for (int i = 0; i < 16; i++) v[i] = 0.0;
  // (a 9 x 9 texel neighbourhood, every second texel: thin painted streaks - a highlight along a fold, a stray
  // hair - go to the colour round them; the centre counts more, so small real shapes keep their place)
  for (int dy = -2; dy <= 2; dy++) for (int dx = -2; dx <= 2; dx++) {
    ivec2 q = clamp(p + ivec2(dx, dy) * 2, ivec2(0), sz - 1);
    int k = near(texelFetch(uS, q, 0).rgb);
    int r = max(abs(dx), abs(dy));
    v[k] += r == 0 ? 3.0 : r == 1 ? 1.5 : 1.0;
  }
  int b = 0; float bv = -1.0; for (int i = 0; i < 16; i++) { if (i >= uN) break; if (v[i] > bv) { bv = v[i]; b = i; } }
  // (the comic look: an ink line along the borders between two colour regions - the sash's edge, the collar, the
  // sleeve's cuff - uE texels to each side; only where the other colour is a real region: 2 of 8 samples agree)
  if (uE > 0) {
    int dif = 0;
    for (int k = 0; k < 8; k++) {
      float a = float(k) * 0.785398;
      ivec2 q = clamp(p + ivec2(round(vec2(cos(a), sin(a)) * float(uE * uK))), ivec2(0), sz - 1);
      if (near(texelFetch(uS, q, 0).rgb) != b) dif++;
    }
    if (dif >= 3) { o = vec4(uC[b] * 0.1 + vec3(0.02, 0.018, 0.03), 1.0); return; }
  }
  o = vec4(uC[b], 1.0);
}`);
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    FLATP = { gl, samp, bake, vao, fb: gl.createFramebuffer(), U: { sS: gl.getUniformLocation(samp, 'uS'), sStep: gl.getUniformLocation(samp, 'uStep'), bS: gl.getUniformLocation(bake, 'uS'), bN: gl.getUniformLocation(bake, 'uN'), bK: gl.getUniformLocation(bake, 'uK'), bE: gl.getUniformLocation(bake, 'uE'), bF: gl.getUniformLocation(bake, 'uF'), bC: gl.getUniformLocation(bake, 'uC') } };
  }


  function palette(px, n, k, look) {
    const F = new Float32Array(n * 3), Lk = new Float32Array(n);
    for (let i = 0; i < n; i++) { const q = OK(px[i * 4] / 255, px[i * 4 + 1] / 255, px[i * 4 + 2] / 255); Lk[i] = q[0]; F[i * 3] = q[0] * FW_L; F[i * 3 + 1] = q[1] * FW_C; F[i * 3 + 2] = q[2] * FW_C; }
    const d2 = (i, c) => { const a = F[i * 3] - c[0], b = F[i * 3 + 1] - c[1], e = F[i * 3 + 2] - c[2]; return a * a + b * b + e * e; };

    const cell = new Map();
    for (let i = 0; i < n; i++) { const key = Math.round(F[i * 3] / 0.05) + ',' + Math.round(F[i * 3 + 1] / 0.05) + ',' + Math.round(F[i * 3 + 2] / 0.05); const c = cell.get(key); if (c) c.n++; else cell.set(key, { n: 1, i }); }
    const cand = [...cell.values()].filter((c) => c.n >= n * 0.003).map((c) => c.i);
    const C = [];
    { let bi = 0, bn = -1; for (const c of cell.values()) if (c.n > bn) { bn = c.n; bi = c.i; } C.push([F[bi * 3], F[bi * 3 + 1], F[bi * 3 + 2]]); }
    while (C.length < k) {
      let bi = -1, bd = -1;
      for (const i of cand) { let m = 1e9; for (const c of C) m = Math.min(m, d2(i, c)); if (m > bd) { bd = m; bi = i; } }
      if (bi < 0 || bd < 0.0025) break;
      C.push([F[bi * 3], F[bi * 3 + 1], F[bi * 3 + 2]]);
    }
    const A = new Uint8Array(n);
    for (let it = 0; it < 10; it++) {
      const S = C.map(() => [0, 0, 0, 0]);
      for (let i = 0; i < n; i++) { let b = 0, bd = 1e9; for (let c = 0; c < C.length; c++) { const e = d2(i, C[c]); if (e < bd) { bd = e; b = c; } } A[i] = b; const t = S[b]; t[0] += F[i * 3]; t[1] += F[i * 3 + 1]; t[2] += F[i * 3 + 2]; t[3]++; }
      for (let c = 0; c < C.length; c++) if (S[c][3]) C[c] = [S[c][0] / S[c][3], S[c][1] / S[c][3], S[c][2] / S[c][3]];
    }


    {
      const sh = C.map((_, c) => { let m = 0; for (let i = 0; i < n; i++) if (A[i] === c) m++; return m / n; });
      const ok = C.map((c) => [c[0] / FW_L, c[1] / FW_C, c[2] / FW_C]), ch = ok.map((q) => Math.hypot(q[1], q[2])), hu = ok.map((q) => Math.atan2(q[2], q[1]));
      const dh = (a, b) => { let d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };
      const gone = new Array(C.length).fill(false), ord = C.map((_, c) => c).sort((a, b) => sh[b] - sh[a]);
      const SH = look.skinHu || [0.5, 1.25], skin = (c) => ok[c][0] > 0.6 && ch[c] > 0.03 && ch[c] < 0.13 && hu[c] > SH[0] && hu[c] < SH[1];
      for (const i of ord) {
        if (gone[i]) continue;
        for (const j of ord) {
          if (j === i || gone[j] || sh[j] > sh[i]) continue;
          const sameHue = ch[i] > 0.05 && ch[j] > 0.04 && Math.abs(ok[i][0] - ok[j][0]) < 0.36 && dh(hu[i], hu[j]) < (ok[j][0] < ok[i][0] ? 0.6 : 0.35);
          const blend = sh[j] < 0.02 && (ch[j] < 0.05 || ord.some((q) => q !== j && !gone[q] && sh[q] > sh[j] && ch[q] > 0.05 && dh(hu[q], hu[j]) < 0.45));

          const greys = ch[i] < 0.045 && ch[j] < 0.045 && Math.abs(ok[i][0] - ok[j][0]) < 0.16;
          if ((sameHue || blend || greys) && skin(i) === skin(j)) gone[j] = true;
        }
      }


      for (const j of ord) {
        if (gone[j] || sh[j] > 0.06 || skin(j)) continue;
        const big = ord.filter((q) => q !== j && !gone[q] && sh[q] > sh[j]);
        for (let a = 0; a < big.length && !gone[j]; a++) for (let b = a + 1; b < big.length; b++) {
          const P = C[big[a]], Qc = C[big[b]], X = C[j], d = [Qc[0] - P[0], Qc[1] - P[1], Qc[2] - P[2]], L2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
          if (L2 < 1e-6) continue;
          const t = ((X[0] - P[0]) * d[0] + (X[1] - P[1]) * d[1] + (X[2] - P[2]) * d[2]) / L2;
          if (t < 0.12 || t > 0.88) continue;
          const e = [P[0] + d[0] * t - X[0], P[1] + d[1] * t - X[1], P[2] + d[2] * t - X[2]];
          if (Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]) < 0.28 * Math.sqrt(L2)) { gone[j] = true; break; }
        }
      }
      const keep = C.filter((_, c) => !gone[c]);
      C.length = 0; C.push(...keep);
      for (let it = 0; it < 4; it++) {
        const S = C.map(() => [0, 0, 0, 0]);
        for (let i = 0; i < n; i++) { let b = 0, bd = 1e9; for (let c = 0; c < C.length; c++) { const e = d2(i, C[c]); if (e < bd) { bd = e; b = c; } } A[i] = b; const t = S[b]; t[0] += F[i * 3]; t[1] += F[i * 3 + 1]; t[2] += F[i * 3 + 2]; t[3]++; }
        for (let c = 0; c < C.length; c++) if (S[c][3]) C[c] = [S[c][0] / S[c][3], S[c][1] / S[c][3], S[c][2] / S[c][3]];
      }
    }


    const out = [];
    for (let c = 0; c < C.length; c++) {
      const mem = []; for (let i = 0; i < n; i++) if (A[i] === c) mem.push(i);
      if (!mem.length) continue;
      mem.sort((a, b) => Lk[a] - Lk[b]);
      const lo = Math.floor(mem.length * 0.45), hi = Math.max(lo + 1, Math.floor(mem.length * 0.9));
      let L = 0, a = 0, b = 0;
      for (let j = lo; j < hi; j++) { const i = mem[j]; L += Lk[i]; a += F[i * 3 + 1] / FW_C; b += F[i * 3 + 2] / FW_C; }
      const m = hi - lo; L /= m; a /= m; b /= m;
      a *= look.palSat; b *= look.palSat;
      if (L < look.palFloor) L = look.palFloor - (look.palFloor - L) * 0.35;
      out.push({ f: C[c], rgb: OKinv(L, a, b), share: mem.length / n });
    }
    return out;
  }
  function flatDrop(t) { const e = FLAT.get(t); if (e && e.tex) e.gl.deleteTexture(e.tex); FLAT.delete(t); }
  function flatTex(gl, src, w, h) {
    let e = FLAT.get(src);
    if (e) return e.tex;
    e = { gl, tex: null }; FLAT.set(src, e);
    const t0 = performance.now();

    const fb0 = gl.getParameter(gl.FRAMEBUFFER_BINDING), vp0 = gl.getParameter(gl.VIEWPORT), sc = gl.isEnabled(gl.SCISSOR_TEST), dt = gl.isEnabled(gl.DEPTH_TEST), cf = gl.isEnabled(gl.CULL_FACE), bl = gl.isEnabled(gl.BLEND);
    try {
      if (!FLATP || FLATP.gl !== gl) flatInit(gl);
      const P = FLATP, U = P.U;
      gl.disable(gl.SCISSOR_TEST); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
      gl.bindVertexArray(P.vao); gl.bindFramebuffer(gl.FRAMEBUFFER, P.fb);

      const SN = 160, step = Math.max(1, Math.floor(Math.min(w, h) / SN));
      const st = gl.createTexture(); gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, st);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, SN, SN, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, st, 0);
      gl.viewport(0, 0, SN, SN);
      gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, src);
      gl.useProgram(P.samp); gl.uniform1i(U.sS, 5); gl.uniform2i(U.sStep, step, step);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const px = new Uint8Array(SN * SN * 4); gl.readPixels(0, 0, SN, SN, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.deleteTexture(st);
      const pal = palette(px, SN * SN, LOOK.k || 12, LOOK).slice(0, 16);
      R3.pals = (R3.pals || []).concat([pal.map((q) => ({ rgb: q.rgb.map((v) => Math.round(v * 255)), share: +q.share.toFixed(3) }))]);

      const K = ND.gfx && ND.gfx.mobile && Math.min(w, h) > 1024 ? 2 : 1, fw = Math.max(1, Math.floor(w / K)), fh = Math.max(1, Math.floor(h / K));
      const ft = gl.createTexture(); gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, ft);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, fw, fh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ft, 0);
      gl.viewport(0, 0, fw, fh);
      gl.useProgram(P.bake); gl.uniform1i(U.bS, 5); gl.uniform1i(U.bN, pal.length); gl.uniform1i(U.bK, K); gl.uniform1i(U.bE, Math.max(0, Math.round((LOOK.edge || 0) * Math.min(w, h) / 2048 / K)));
      const UF = new Float32Array(48), UC = new Float32Array(48);
      pal.forEach((q, i) => { UF.set(q.f, i * 3); UC.set(q.rgb, i * 3); });
      gl.uniform3fv(U.bF, UF); gl.uniform3fv(U.bC, UC);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
      gl.bindTexture(gl.TEXTURE_2D, ft); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      const an = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
      if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      e.tex = ft; e.pal = pal.map((q) => ({ rgb: q.rgb.map((x) => Math.round(x * 255)), share: +q.share.toFixed(3) }));
      R3.flatMs = (R3.flatMs || 0) + performance.now() - t0; R3.flatN = (R3.flatN || 0) + 1; (R3.flatPal = R3.flatPal || []).push(e.pal);
    } catch (err) { console.warn('[r3d] flat picture:', err && err.message); e.tex = null; }
    gl.bindTexture(gl.TEXTURE_2D, null); gl.activeTexture(gl.TEXTURE0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb0); gl.viewport(vp0[0], vp0[1], vp0[2], vp0[3]);
    if (sc) gl.enable(gl.SCISSOR_TEST); if (dt) gl.enable(gl.DEPTH_TEST); if (cf) gl.enable(gl.CULL_FACE); if (bl) gl.enable(gl.BLEND);
    return e.tex;
  }



  function glbSmooth(P, N, I, nv, rounds = 8) {
    const rep = new Int32Array(nv), cellOf = new Map();
    for (let v = 0; v < nv; v++) {
      const key = Math.round(P[v * 3] * 20) + ',' + Math.round(P[v * 3 + 1] * 20) + ',' + Math.round(P[v * 3 + 2] * 20);
      let L = cellOf.get(key); if (!L) cellOf.set(key, (L = []));
      let r = -1;
      for (const u of L) if (N[u * 4] * N[v * 4] + N[u * 4 + 1] * N[v * 4 + 1] + N[u * 4 + 2] * N[v * 4 + 2] > 0.2 * 127 * 127) { r = u; break; }
      if (r < 0) { L.push(v); r = v; }
      rep[v] = r;
    }
    const deg = new Int32Array(nv + 1);
    for (let t = 0; t < I.length; t += 3) for (let k = 0; k < 3; k++) deg[rep[I[t + k]] + 1] += 2;
    for (let v = 0; v < nv; v++) deg[v + 1] += deg[v];
    const nb = new Int32Array(deg[nv]), fill = deg.slice(0, nv);
    for (let t = 0; t < I.length; t += 3) for (let k = 0; k < 3; k++) { const a = rep[I[t + k]]; nb[fill[a]++] = rep[I[t + (k + 1) % 3]]; nb[fill[a]++] = rep[I[t + (k + 2) % 3]]; }
    let A = new Float32Array(nv * 3), B = new Float32Array(nv * 3);
    for (let v = 0; v < nv; v++) { const r = rep[v]; A[r * 3] += N[v * 4]; A[r * 3 + 1] += N[v * 4 + 1]; A[r * 3 + 2] += N[v * 4 + 2]; }
    const nz = (X, r) => { const l = Math.hypot(X[r * 3], X[r * 3 + 1], X[r * 3 + 2]) || 1; X[r * 3] /= l; X[r * 3 + 1] /= l; X[r * 3 + 2] /= l; };
    for (let v = 0; v < nv; v++) if (rep[v] === v) nz(A, v);
    for (let it = 0; it < rounds; it++) {
      for (let v = 0; v < nv; v++) {
        if (rep[v] !== v) continue;
        let x = A[v * 3] * 2, y = A[v * 3 + 1] * 2, z = A[v * 3 + 2] * 2;
        for (let j = deg[v]; j < deg[v + 1]; j++) { const u = nb[j]; x += A[u * 3]; y += A[u * 3 + 1]; z += A[u * 3 + 2]; }
        B[v * 3] = x; B[v * 3 + 1] = y; B[v * 3 + 2] = z; nz(B, v);
      }
      const T = A; A = B; B = T;
    }
    const NS = new Int8Array(nv * 4);
    for (let v = 0; v < nv; v++) {
      const r = rep[v];
      let x = A[r * 3], y = A[r * 3 + 1], z = A[r * 3 + 2];

      if (x * N[v * 4] + y * N[v * 4 + 1] + z * N[v * 4 + 2] < 0) { x = N[v * 4] / 127; y = N[v * 4 + 1] / 127; z = N[v * 4 + 2] / 127; }
      NS[v * 4] = Math.round(x * 127); NS[v * 4 + 1] = Math.round(y * 127); NS[v * 4 + 2] = Math.round(z * 127); NS[v * 4 + 3] = 127;
    }
    return NS;
  }
  let GLH = null;
  function hdInit(gl) {
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('r3d HD shader: ' + gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VSH)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FSH)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('r3d HD link: ' + gl.getProgramInfoLog(p));
    const U = {};
    for (const k of ['uSoft', 'uInkZ', 'uInkU', 'uBackDim', 'uTex', 'uHasTex', 'uNrm', 'uHasNrm', 'uOldLook', 'uB', 'uVP', 'uRoot', 'uInk', 'uView', 'uTone', 'uMat', 'uInkC', 'uKeyD', 'uKeyC', 'uShade', 'uEye', 'uLift', 'uFlash', 'uKeyA', 'uL', 'uLC', 'uFlat', 'uLook', 'uHasFlat', 'uFlatK', 'uBias', 'uSat', 'uRim', 'uMask', 'uStep3', 'uDarkPush']) U[k] = gl.getUniformLocation(p, k);
    gl.useProgram(p);
    const tone = new Float32Array(21), mat = new Float32Array(21);
    MATP.forEach((m, i) => { tone.set(m.slice(0, 3), i * 3); mat.set([m[3], m[4], m[5]], i * 3); });
    gl.uniform3fv(U.uTone, tone); gl.uniform3fv(U.uMat, mat);
    gl.uniform1i(U.uTex, 3); gl.uniform1i(U.uNrm, 4); gl.uniform1i(U.uFlat, 5); gl.uniform1f(U.uOldLook, /[?&]r3dgold=1(&|$)/.test(Q) ? 1 : 0);
    GLH = { gl, p, U, vao: new Map(), tex: new Map() };
  }
  function hdVao(gl, M) {
    let o = GLH.vao.get(M);
    if (o) return o;
    o = { vao: gl.createVertexArray(), n: M.I.length };
    gl.bindVertexArray(o.vao);
    const at = (data, loc, size, type, normd) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, type, normd, 0, 0); };
    if (M.UV) at(M.UV, 6, 2, gl.FLOAT, false);
    o.it = M.I instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    at(M.P, 0, 3, gl.FLOAT, false); at(M.N, 1, 4, gl.BYTE, true); at(M.NS || M.N, 7, 4, gl.BYTE, true); at(M.C, 2, 4, gl.UNSIGNED_BYTE, true); at(M.SI, 3, 4, gl.UNSIGNED_BYTE, false); at(M.SW, 4, 4, gl.UNSIGNED_BYTE, true); at(M.MT, 5, 1, gl.UNSIGNED_BYTE, false);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, M.I, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    GLH.vao.set(M, o);
    return o;
  }
  const ROOT = new Float32Array(16);



  const DRESSN = 2, DRESS = [];
  function dressTex(gl, M, img, t, f) {
    const CR = ND.r3dCostume, K = M.kostum;
    if (!CR || !K || !f || !f.col || f.col === f.ch.col) return null;
    let D = DRESS.find((d) => d.gl === gl && d.M === M && d.col === f.col);
    if (!D) {
      const P = CR.plan(K.meta, f.ch.col, f.col), key = CR.planKey(P);
      if (!P) return null;
      D = DRESS.find((d) => d.gl === gl && d.M === M && d.key === key);
      if (!D) {
        if (!K.tex || K.gl !== gl) { K.tex = CR.mapTex(gl, K.img); K.gl = gl; }
        const an = GLB_LOOK.aniso && (gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic'));
        const t0 = performance.now();
        const tex = CR.bake(gl, t, img.width, img.height, K.tex, K.img.width, K.img.height, P, an ? { ext: an, n: Math.min(4, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) } : null);
        R3.dressMs = performance.now() - t0; R3.dressN = (R3.dressN || 0) + 1;
        if (!tex) return null;
        D = { gl, M, key, tex, col: f.col, used: 0 };
        DRESS.push(D);

        while (DRESS.length > DRESSN) { let o = -1; for (let i = 0; i < DRESS.length; i++) if (DRESS[i] !== D && (o < 0 || DRESS[i].used < DRESS[o].used)) o = i; flatDrop(DRESS[o].tex); DRESS[o].gl.deleteTexture(DRESS[o].tex); DRESS.splice(o, 1); }
      } else D.col = f.col;
    }
    D.used = R3.frames;
    return D.tex;
  }

  function hdRun(gl, w, h, list, inkPx, vp, reflect) {
    if (!GLH || GLH.gl !== gl) hdInit(gl);
    const { p, U } = GLH;
    gl.useProgram(p);
    gl.uniformMatrix4fv(U.uVP, false, vp); gl.uniform2f(U.uView, w, h);
    gl.uniform3fv(U.uInkC, LIGHT.ink);
    gl.uniform3fv(U.uKeyD, LIGHT.keyD); gl.uniform3fv(U.uKeyC, LIGHT.keyC); gl.uniform1f(U.uKeyA, LIGHT.keyA);
    gl.uniform3fv(U.uShade, LIGHT.shade); gl.uniform3fv(U.uEye, EYE);
    gl.uniform4fv(U.uL, LIGHT.L); gl.uniform3fv(U.uLC, LIGHT.LC);
    const LK = LOOK || { id: 0, flatK: 0, sat: 1, bias: 0, rim: 0 };
    gl.uniform1f(U.uLook, LK.id); gl.uniform1f(U.uFlatK, LK.flatK); gl.uniform1f(U.uBias, LK.bias); gl.uniform1f(U.uSat, LK.sat); gl.uniform1f(U.uRim, LK.rim); gl.uniform1f(U.uStep3, LK.step3 || 0); gl.uniform1f(U.uDarkPush, LK.darkPush || 0);
    gl.uniform1f(U.uMask, !reflect && R3.maskOn() ? 1 : 0); gl.uniform1f(U.uHasFlat, 0);
    let tris = 0;



    for (const E0 of list) for (const MM of [E0.hd.M, piecesOf(E0.hd.M, E0.f)]) {
      if (!MM) continue;
      const E = E0, F = E.hd, M = MM, o = hdVao(gl, M), sil = M.glb && GLB_LOOK.ink === 'sil', noInk = M.glb && (GLB_LOOK.ink === 'off' || !!(LOOK && !LOOK.ink));
      const order = reflect ? [1] : sil ? [1, 0] : noInk ? [1] : [0, 1];
      for (const pass of order) {

        const lk = M.glb && LOOK && sil;
        gl.uniform1f(U.uInk, pass === 0 ? (lk ? R3.inkW(inkPx) : inkPx * (M.glb && GLB_LOOK.ink !== 'old' ? GLB_LOOK.inkK : 1)) : 0);
        gl.uniform1f(U.uInkU, pass === 0 && lk ? 1 : 0);
        gl.uniform1f(U.uInkZ, pass === 0 && sil ? (lk ? LOOK.z : GLB_LOOK.inkZ) : 0.0004);
        gl.uniform1f(U.uSoft, M.glb ? (GLB_LOOK.flat ? 2 : GLB_LOOK.env ? 3 : GLB_LOOK.soft ? 1 : 0) : 0);
        ROOT.fill(0); ROOT[0] = F.dir; ROOT[5] = 1; ROOT[10] = 1; ROOT[15] = 1; ROOT[12] = F.x0;
        gl.uniformMatrix4fv(U.uRoot, false, ROOT);
        gl.uniform4fv(U.uB, F.U);
        gl.uniform3fv(U.uLift, E.lift); gl.uniform1f(U.uFlash, reflect ? 0 : E.flash);

        gl.frontFace((F.dir < 0) !== !!reflect ? gl.CW : gl.CCW);
        if (pass === 0) { gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT); } else if (M.glb && GLB_LOOK.cull) { gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); } else gl.disable(gl.CULL_FACE);
        gl.uniform1f(U.uBackDim, M.glb ? 1 : 0.45);
        gl.bindVertexArray(o.vao);
        if (M.draws) {
          for (const d of M.draws) {
            const img = d.tex != null ? M.imgs[d.tex] : null;
            if (img) {
              let t = GLH.tex.get(img);
              if (!t) {
                t = gl.createTexture(); gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

                const an = GLB_LOOK.aniso && (gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic'));
                if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));



                if (LOOK && LOOK.pic && M.id === 'akane') { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, 1); }


                if (LOOK && LOOK.pic && M.id === 'akane') {
                  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 2);
                  if (GQ('ucbfilt', '') === 'near') { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); }
                }
                GLH.tex.set(img, t);
              }
              if (M.kostum) t = dressTex(gl, M, img, t, E.f) || t;

              const ft = pass === 1 && LOOK && LOOK.flatK > 0 ? flatTex(gl, t, img.width, img.height) : null;
              if (ft) { gl.useProgram(p); gl.bindVertexArray(o.vao); gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, ft); }
              gl.uniform1f(U.uHasFlat, ft ? 1 : 0);
              gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, t); gl.activeTexture(gl.TEXTURE0);
            }
            gl.uniform1f(U.uHasTex, img ? 1 : 0);

            const nimg = d.nrm != null && pass === 1 ? M.imgs[d.nrm] : null;
            if (nimg) {
              let t = GLH.tex.get(nimg);
              if (!t) {
                t = gl.createTexture(); gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, nimg); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                GLH.tex.set(nimg, t);
              }
              gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, t); gl.activeTexture(gl.TEXTURE0);
            }
            gl.uniform1f(U.uHasNrm, nimg ? 1 : 0);
            gl.drawElements(gl.TRIANGLES, d.count, o.it, d.start * (o.it === gl.UNSIGNED_INT ? 4 : 2));
          }
          gl.uniform1f(U.uHasTex, 0); gl.uniform1f(U.uHasNrm, 0); gl.uniform1f(U.uHasFlat, 0);
        } else gl.drawElements(gl.TRIANGLES, o.n, gl.UNSIGNED_SHORT, 0);
        tris += o.n / 3;
      }
    }
    gl.frontFace(gl.CCW);
    return tris;
  }

  const POSES = new WeakMap();
  const PER = [{ rope: { P: new Float32Array(4096 * 3), N: new Float32Array(4096 * 3), C: new Float32Array(4096 * 4), X: new Float32Array(4096), I: new Uint16Array(4096 * 6), nv: 0, ni: 0 }, trail: { P: new Float32Array(64 * 3), N: new Float32Array(64 * 3), C: new Float32Array(64 * 4), X: new Float32Array(64), I: new Uint16Array(64 * 6), nv: 0, ni: 0 } },
    { rope: { P: new Float32Array(4096 * 3), N: new Float32Array(4096 * 3), C: new Float32Array(4096 * 4), X: new Float32Array(4096), I: new Uint16Array(4096 * 6), nv: 0, ni: 0 }, trail: { P: new Float32Array(64 * 3), N: new Float32Array(64 * 3), C: new Float32Array(64 * 4), X: new Float32Array(64), I: new Uint16Array(64 * 6), nv: 0, ni: 0 } }];
  const RIGS = new WeakMap();
  const LIGHT = { L: new Float32Array(16), LC: new Float32Array(12), keyD: [0, 0, 0], keyC: [0, 0, 0], keyA: 0, shade: [1, 1, 1], ink: [0.04, 0.035, 0.05] };
  const FR = { list: [], fit: 1, W: 0, H: 0 };



  function dressOk(f) {
    if (!f.col || !f.ch || f.col === f.ch.col) return true;
    const id = f.ch.id, M = HDM[id];
    if (!GLB.includes(id)) return !(f.col.costume || f.col.atlas);
    return M ? !!M.kostum : HDL[id] !== 'failed';
  }
  function eligible(f) { return f && !f.hidden && dressOk(f) && f.viewJ && f.ch; }
  function rigOf(f) {
    let R = RIGS.get(f);
    if (R && R.ch === f.ch && R.col === f.col && R.wpn === (f.wpn || ND.LEN)) return R;
    R = buildRig(f); RIGS.set(f, R);
    return R;
  }
  function lights(F) {
    const th = scene.theme, k = th.key || { from: 1, c: '200,210,255', a: 0.15 };
    const kd = norm(v3(0.62 * (k.from || 1), 0.72, 0.42)); LIGHT.keyD[0] = kd.x; LIGHT.keyD[1] = kd.y; LIGHT.keyD[2] = kd.z;
    const kc = rgbs(k.c); LIGHT.keyC[0] = kc[0]; LIGHT.keyC[1] = kc[1]; LIGHT.keyC[2] = kc[2]; LIGHT.keyA = k.a || 0.15;
    const fog = rgbs(th.fog || '60,70,110'), m = Math.max(fog[0], fog[1], fog[2]) || 1;
    for (let i = 0; i < 3; i++) LIGHT.shade[i] = 0.82 + 0.3 * (fog[i] / m);
    const Ls = scene.lights();
    LIGHT.L.fill(0);

    const mid = F.length ? (F[0].x + F[F.length - 1].x) / 2 : 0;
    const idx = Ls.map((L, i) => [Math.abs(L.x - mid), i]).sort((a, b) => a[0] - b[0]).slice(0, 4);
    idx.forEach(([, i], j) => {
      const L = Ls[i], c = rgbs(L.c);
      LIGHT.L[j * 4] = L.x; LIGHT.L[j * 4 + 1] = -L.y; LIGHT.L[j * 4 + 2] = 40; LIGHT.L[j * 4 + 3] = L.f * (ND.duel ? 0.35 : 1);
      LIGHT.LC[j * 3] = c[0]; LIGHT.LC[j * 3 + 1] = c[1]; LIGHT.LC[j * 3 + 2] = c[2];
    });
  }

  function liftCol(f, on) {
    const cl = hex(f.col && f.col.cloth), ac = hex(f.col && f.col.accent);
    const lum = 0.2126 * cl[0] + 0.7152 * cl[1] + 0.0722 * cl[2];
    const base = lum < 0.22 ? 0.22 : 0.06;
    const k = (on ? 1 : 0.55) * base;
    return [(ac[0] * 0.55 + 0.8 * 0.45) * k, (ac[1] * 0.55 + 0.8 * 0.45) * k, (ac[2] * 0.55 + 0.8 * 0.45) * k];
  }



  const HF = new WeakMap();
  function hitTint(f) {
    let h = HF.get(f); if (!h) HF.set(f, (h = { last: 0, n: 9 }));
    const fl = f.flash || 0;
    if (fl > h.last + 0.05) h.n = 0;
    h.last = fl; h.n++;
    return fl > 0 && h.n <= 3 ? 0.12 / 0.38 : 0;
  }

  function run(gl, w, h) {
    const t0 = performance.now();
    if (!GLS || GLS.gl !== gl) {
      try { glInit(gl); } catch (e) { R3.why = String(e && e.message); R3.on = false; console.warn('[r3d] off:', R3.why); return; }
    }
    const { p, U } = GLS;
    gl.useProgram(p);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true);
    gl.enable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.uniformMatrix4fv(U.uVP, false, VP);
    gl.uniform2f(U.uView, w, h);
    gl.uniform3fv(U.uInkC, LIGHT.ink);
    gl.uniform3fv(U.uKeyD, LIGHT.keyD); gl.uniform3fv(U.uKeyC, LIGHT.keyC); gl.uniform1f(U.uKeyA, LIGHT.keyA);
    gl.uniform3fv(U.uShade, LIGHT.shade); gl.uniform3fv(U.uEye, EYE);
    gl.uniform4fv(U.uL, LIGHT.L); gl.uniform3fv(U.uLC, LIGHT.LC);
    gl.uniform1f(U.uMode, 0);
    for (const E of FR.list) if (!GLS.rigs.get(E.R)) GLS.rigs.set(E.R, vaoOf(gl, E.R.P, E.R.N, E.R.C, E.R.IDX, E.R.I, false));
    const inkPx = clamp(1.6 * cam.k * RIG.zoom * FR.fit, 1.2, 5);
    let tris = 0;

    if (FR.refl > 0) {
      for (let q = 0; q < 16; q++) VPM[q] = VP[q];
      for (let q = 4; q < 8; q++) VPM[q] *= -0.55;
      gl.uniformMatrix4fv(U.uVP, false, VPM);
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA, gl.ZERO, gl.ONE); gl.blendColor(0, 0, 0, FR.refl);
      gl.cullFace(gl.FRONT); gl.uniform1f(U.uInk, 0);
      for (const E of FR.list) {
        if (E.hd) continue;
        const G0 = GLS.rigs.get(E.R); if (!G0) continue;
        gl.uniform4fv(U.uM, E.R.M); gl.uniform3fv(U.uLift, E.lift); gl.uniform1f(U.uFlash, 0);
        gl.bindVertexArray(G0.vao); gl.drawElements(gl.TRIANGLES, G0.n, gl.UNSIGNED_SHORT, 0);
      }
      const HL = FR.list.filter((E) => E.hd);
      if (HL.length) { hdRun(gl, w, h, HL, 0, VPM, true); gl.useProgram(p); }
      if (R3.wpn) { R3.wpn.draw(gl, w, h, VPM, true); gl.useProgram(p); }
      gl.disable(gl.BLEND); gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.CULL_FACE);
      gl.uniformMatrix4fv(U.uVP, false, VP);
    }
    for (let pass = 0; pass < 2; pass++) {
      gl.cullFace(pass === 0 ? gl.FRONT : gl.BACK);
      gl.uniform1f(U.uInk, pass === 0 ? inkPx : 0);
      for (let i = 0; i < FR.list.length; i++) {
        const E = FR.list[i], R = E.R;
        if (E.hd && E.weapon) {
          let G0 = GLS.rigs.get(R); if (!G0) { G0 = vaoOf(gl, R.P, R.N, R.C, R.IDX, R.I, false); GLS.rigs.set(R, G0); }
          const MW = R.MW || (R.MW = new Float32Array(R.M.length));
          MW.fill(0); for (const nm of E.hd.M.cutSword ? ['tsuka', 'tsuba', 'blade', 'saya'] : ['tsuka', 'tsuba', 'blade']) { const q = R.id[nm]; if (q) MW.set(R.M.subarray(q * 12, q * 12 + 12), q * 12); }
          gl.uniform4fv(U.uM, MW); gl.uniform3fv(U.uLift, E.lift); gl.uniform1f(U.uFlash, E.flash);
          gl.bindVertexArray(G0.vao); gl.drawElements(gl.TRIANGLES, G0.n, gl.UNSIGNED_SHORT, 0);
          continue;
        }
        if (E.hd) continue;
        let G0 = GLS.rigs.get(R);
        if (!G0) { G0 = vaoOf(gl, R.P, R.N, R.C, R.IDX, R.I, false); GLS.rigs.set(R, G0); }
        gl.uniform4fv(U.uM, R.M);
        gl.uniform3fv(U.uLift, E.lift); gl.uniform1f(U.uFlash, E.flash);
        gl.bindVertexArray(G0.vao);
        gl.drawElements(gl.TRIANGLES, G0.n, gl.UNSIGNED_SHORT, 0);
        tris += G0.n / 3;
        const D = E.rope;
        if (D.ni) {
          let o = GLS.dyn[i * 2]; if (!o) o = GLS.dyn[i * 2] = vaoOf(gl, D.P, D.N, D.C, D.X, D.I, true);
          if (pass === 0) dynUpload(gl, o, D); else gl.bindVertexArray(o.vao);

          if (pass === 1) gl.disable(gl.CULL_FACE);
          gl.drawElements(gl.TRIANGLES, D.ni, gl.UNSIGNED_SHORT, 0);
          if (pass === 1) gl.enable(gl.CULL_FACE);
          tris += D.ni / 3;
        }
      }
    }
    { const HL = FR.list.filter((E) => E.hd); if (HL.length) { tris += hdRun(gl, w, h, HL, inkPx, VP, false); gl.useProgram(p); gl.enable(gl.CULL_FACE); } }
    if (R3.wpn) { tris += R3.wpn.draw(gl, w, h, VP, false, inkPx); gl.useProgram(p); gl.enable(gl.CULL_FACE); }

    gl.disable(gl.CULL_FACE); gl.depthMask(false); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.uniform1f(U.uMode, 2); gl.uniform1f(U.uInk, 0);
    for (let i = 0; i < FR.list.length; i++) {
      const E = FR.list[i], D = E.trail;
      if (!D.ni) continue;
      let o = GLS.dyn[i * 2 + 1]; if (!o) o = GLS.dyn[i * 2 + 1] = vaoOf(gl, D.P, D.N, D.C, D.X, D.I, true);
      dynUpload(gl, o, D);
      gl.uniform4fv(U.uM, FR.list[i].R.M);
      gl.drawElements(gl.TRIANGLES, D.ni, gl.UNSIGNED_SHORT, 0);
    }
    gl.depthMask(true); gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
    R3.tris = tris; R3.gpuCallMs = performance.now() - t0;
  }



  const AFF = { on: false, c: 1, z: 1 };
  function prepare(game) {
    AFF.on = false;
    if (!R3.on || game.rendererMode !== 'gl' || game.phase === 'replay' || game.phase === 'select' || game.phase === 'vs' || !game.F) return null;
    const F = game.F.filter((f) => !f.hidden);
    for (const f of F) if (!eligible(f)) return null;
    const t0 = performance.now();
    rigStep(F);
    FR.list.length = 0;
    const W = cam.W, H = cam.H;
    lights(F);
    const D = ND.duel, CH = D && D.chor;
    let liftOn = !!(CH && CH.cur);
    if (!liftOn && D && D.finOf) for (const f of F) if (D.finOf(f)) liftOn = true;
    depthApart(F);
    F.forEach((f, i) => {
      const R = rigOf(f), S = pose(R, f);
      if (!S) return;
      POSES.set(f, S);
      const E = { R, f, rope: PER[i].rope, trail: PER[i].trail, lift: liftCol(f, liftOn), flash: hitTint(f), hd: null };
      if (LOD === 'hd' || GLB.includes(f.ch.id)) { hdWant(f.ch.id); const M = HDM[f.ch.id]; if (M) { E.hd = hdFig(f, M); hdPose(f, S, E.hd); if (M.glb && !R3.wpn) { weaponPose(R, S); E.weapon = true; } } }
      if (E.hd) E.rope.nv = E.rope.ni = 0; else ropes(f, S, E.rope);
      streak(f, S, R, E.trail);
      FR.list.push(E);
    });
    if (R3.wpn) for (const E of FR.list) R3.wpn.prep(E, E.f, POSES.get(E.f));
    viewProj(W, H, 1);
    const need = fitFor(F, W, H);

    FR.fit = need < FR.fit ? Math.max(need, FR.fit - 0.03) : Math.min(need, FR.fit + 0.004);
    viewProj(W, H, FR.fit);


    AFF.c = Math.cos(RIG.yaw); AFF.z = RIG.zoom * FR.fit; AFF.on = Math.abs(AFF.c - 1) > 1e-4 || Math.abs(AFF.z - 1) > 1e-4;
    const GF = ND.gfx && ND.gfx.f, th = scene.theme;
    FR.refl = GF && GF.reflect && th.reflect >= (GF.reflectMin || 0) ? th.reflect : 0;
    R3.prepMs = performance.now() - t0;
    return FR;
  }
  const world0 = cam.world;
  cam.world = function (ctx) {
    if (!AFF.on) return world0.call(this, ctx);

    const k = this.k * AFF.z, kx = k * AFF.c, row = this.gy + this.shy + (ANCHOR_Y - this.y) * this.k * RIG.zoom;
    ctx.setTransform(kx, 0, 0, k, this.W / 2 - this.x * kx + this.shx, row - ANCHOR_Y * k);
  };

  for (const name of ['drawBack', 'drawFront']) {
    const f0 = scene[name];
    if (typeof f0 !== 'function') continue;
    scene[name] = function (ctx) {
      const on = AFF.on; AFF.on = false;
      try { return f0.apply(this, arguments); } finally {
        AFF.on = on;
        const a = R3.prep && name === 'drawBack' ? clamp(Math.abs(RIG.yaw) / (40 * DEG), 0, 1) * 0.22 + clamp(-RIG.eye / 60, 0, 1) * 0 : 0;
        if (a > 0.004 && ctx && ctx.fillRect) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(6,8,16,' + a.toFixed(3) + ')'; ctx.fillRect(0, 0, cam.W, cam.H); ctx.restore(); }
      }
    };
  }

  if (ND.Fighter) {
    const fd0 = ND.Fighter.prototype.draw;
    ND.Fighter.prototype.draw = function (ctx, reflect) { if (reflect && R3.prep && ctx && ctx.isGL && ctx.pass === 1) return; return fd0.apply(this, arguments); };
  }
  const rs0 = G.renderScene;
  G.renderScene = function (withFighters) {
    R3.prep = withFighters ? prepare(this) : null;
    try { return rs0.apply(this, arguments); } finally { AFF.on = false; }
  };


  R3.drawFighters = function (ctx, ORD, game) {
    if (!R3.prep || !ctx || ctx.isGL !== true || typeof ctx.custom !== 'function') { AFF.on = false; return false; }
    const t0 = performance.now();
    ctx.custom(run);

    cam.world(ctx);
    for (const f of game.F) if (f.looseSword) f.looseSword.draw(ctx, f.col);
    R3.frames++;
    R3.cpuMs = (R3.prepMs || 0) + performance.now() - t0;
    R3.last = { lod: FR.list.map((E) => (E.hd ? 'hd' : 'simple')).join(','), pitch: +(RIG.pitch / DEG).toFixed(2), yaw: +(RIG.yaw / DEG).toFixed(2), eye: +RIG.eye.toFixed(1), dist: +RIG.dist.toFixed(0), zoom: +RIG.zoom.toFixed(3), fit: +FR.fit.toFixed(3), shot: RIG.shot };
    return true;
  };
  if ((LOD === 'hd' && typeof DecompressionStream !== 'undefined') || GLB.length) { hdWant('akane'); hdWant('kuro'); }
  R3.hdDebug = (f) => { const F = HDF.get(f); if (!F) return null; const o = {}; for (const n of ['hips','spine','chest','neck','head','thigh.R','shin.R','foot.R','upper.R']) { const i = F.M.ix[n], b = F.b[i], B = F.M.B[i]; o[n] = { p: [b.p.x, b.p.y, b.p.z].map(Math.round), p0: [B.p0.x, B.p0.y, B.p0.z].map(Math.round), s: +b.s.toFixed(2), len: Math.round(B.len), up: [b.Rw[3], b.Rw[4], b.Rw[5]].map((v) => +v.toFixed(2)) }; } return o; };

  R3.hdReady = (id) => !!HDM[id] || HDL[id] === 'failed';
  R3.info = () => Object.assign({ tipS: R3.tipSmoothed || 0, yawC: R3.yawClamped || 0, yawLast: R3.yawLast, tris: R3.tris, cpuMs: +(R3.cpuMs || 0).toFixed(3), glMs: +(R3.gpuCallMs || 0).toFixed(3) }, R3.last || {});



  const AUD = new WeakMap();
  const segDist = (p, a, b) => { const ab = sub(b, a), t = clamp(dot(sub(p, a), ab) / Math.max(1e-6, dot(ab, ab)), 0, 1); return len(sub(p, madd(a, ab, t))); };
  function segSeg(a0, a1, b0, b1) {
    let m = 1e9;
    for (let i = 0; i <= 12; i++) { const p = lerp(a0, a1, i / 12); m = Math.min(m, segDist(p, b0, b1)); }
    for (let i = 0; i <= 12; i++) { const p = lerp(b0, b1, i / 12); m = Math.min(m, segDist(p, a0, a1)); }
    return m;
  }
  R3.audit = function () {
    const F = (G.F || []).filter((f) => POSES.get(f));
    const out = [];
    for (const f of F) {
      const k = POSES.get(f), o = { id: f.ch.id, src: k.src, st: f.state };
      const air = !f.onGround || f.state === 'launch' || f.state === 'down' || f.dead || f.state === 'jump';
      const fy = Math.min(k.ftF.y, k.ftB.y);
      o.footY = +fy.toFixed(1); o.float = !air && fy > 4; o.sink = fy < -2;
      const A = AUD.get(f) || {}; AUD.set(f, A);
      o.slide = 0;
      for (const n of ['ftF', 'ftB']) {
        const p = k[n], q = A[n];
        if (q && !air && p.y < 1.2 && q.y < 1.2 && A.clk !== ND.simClock) o.slide = Math.max(o.slide, Math.abs(p.x - q.x) + Math.abs(p.z - q.z));
        A[n] = { x: p.x, y: p.y, z: p.z };
      }
      A.clk = ND.simClock;
      o.slide = +o.slide.toFixed(2);
      if (k.inHand && !k.noSword) {

        const HF0 = HDF.get(f); let hp = k.haF;
        if (HF0 && HF0.M.ix['hand.R'] != null) { const q = hcarry(HF0, HF0.M.ix['hand.R'], HF0.M.grip.R.c); hp = v3(HF0.x0 + q.x * HF0.dir, q.y, q.z); }
        o.grip = +segDist(hp, madd(k.bh, k.bu, -R3H(f)), k.bh).toFixed(1);
      }

      if (k.inHand && !k.noSword && k.bladeVis > 0.5) {
        const tip = madd(k.bh, k.bu, ((f.wpn || ND.LEN).blade || 90) * k.bladeVis), b0 = madd(k.bh, k.bu, 6);
        let pen = 0;
        for (const g of F) {
          const q = POSES.get(g), own = g === f;
          const caps = own ? [[q.hip, q.neck, 10], [q.head, q.head, 10.5]] : [[q.hip, q.neck, 11], [q.head, q.head, 11], [q.hipF, q.knF, 9], [q.knF, q.ftF, 8], [q.hipB, q.knB, 9], [q.knB, q.ftB, 8], [q.shF, q.elF, 7], [q.shB, q.elB, 7]];
          for (const [a, b, r] of caps) { const d = segSeg(b0, tip, a, b); if (d < r - 2) pen = Math.max(pen, r - d); }
        }
        o.bladeIn = +pen.toFixed(1);
      }

      let outPx = 0;
      for (const n of KEYPTS) { const p = keyPt(k, n, f); if (!p) continue; const [x, y] = proj(p, cam.W, cam.H); outPx = Math.max(outPx, -x, x - cam.W, cam.H * 0.08 - y, y - cam.H * 0.94); }
      o.outPx = Math.round(Math.max(0, outPx));
      out.push(o);
    }
    return out;
  };
  const R3H = (f) => ((f.wpn || ND.LEN).handle || 24);
  R3.pose = (f) => POSES.get(f);

  R3.lib = { v3, sub, add, mul, madd, dot, cross, len, norm, lerp, rotAx, hex, clamp, frame, segDist, m3v, m3mul, m3T, m3basis, hcarry, hdOf: (f) => HDF.get(f), EX, EY, EZ, LIGHT, EYE, MAXP, RIG, FR };
  R3.hdLoaded = () => Object.keys(HDM);
  R3.keyPoints = function (f) {
    const S = POSES.get(f); if (!S) return null;
    const o = { src: S.src };
    for (const k of KEYPTS) { const p = keyPt(S, k, f); if (p) o[k] = proj(p, cam.W, cam.H).map(Math.round); }
    return o;
  };





  {
    const DQ = /[?&]r3ddpr=([\d.]+)/.exec(Q), CAP = DQ ? +DQ[1] : 3, GX = ND.gfx;
    if (GX && GX.flags && GX.mobile) {
      for (const t of GX.tiers || ['high', 'medium', 'low']) { const fl = GX.flags(t); if (fl && fl.dpr < CAP) fl.dpr = CAP; }
      if (GX.f && GX.f.dpr < CAP) GX.f.dpr = CAP;
      setTimeout(() => { try { window.dispatchEvent(new Event('resize')); } catch (e) {            } }, 0);
    }
  }






  if (UCB && /[?&]ucbgo=1(&|$)/.test(Q)) {
    const ix = (c) => ND.CHARS.findIndex((x) => x.id === c), t0 = performance.now();
    const tag = document.createElement('div');
    tag.style.cssText = 'position:fixed;left:calc(env(safe-area-inset-left,0px) + 6px);top:calc(env(safe-area-inset-top,0px) + 54px);z-index:2147483646;font:600 12px/1.3 system-ui,sans-serif;color:#ffd27a;background:rgba(0,0,0,.65);padding:3px 8px;border-radius:4px;pointer-events:none;white-space:nowrap';
    tag.textContent = 'Akane 3D toon · ' + (/[?&]ucbm=lod2(&|$)/.test(Q) ? '15k (akane-lod2.glb)' : '30k (akane.glb)') + ' · loading';
    document.body.appendChild(tag);
    const go = setInterval(() => {
      const ready = G.F && ND.CHARS && ND.duel && (!ND.duel.mocap || ND.duel.mocap.ready || ND.duel.mocap.error) && (HDM.akane || HDL.akane === 'failed') && (HDM.kuro || HDL.kuro === 'failed');
      if (!ready && performance.now() - t0 < 25000) return;
      clearInterval(go);
      tag.textContent = tag.textContent.replace(' · loading', HDM.akane ? '' : ' · MODEL FAILED: ' + (R3.hdWhy || '?'));
      for (const id of ['first', 'menu']) { const e = document.getElementById(id); if (e) e.hidden = true; }
      G.start('cpu', { c1: ix('akane'), c2: ix('kuro'), arena: 'temple' });




      const name = tag.textContent.replace(' · loading', '');
      tag.style.font = '700 15px/1.25 system-ui,sans-serif'; tag.style.padding = '3px 8px';
      let last = performance.now(), T = [], low = null;
      const loop = (now) => { T.push(now - last); last = now; requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
      let wasEnd = false;
      setInterval(() => {
        if (!T.length) return;
        const fps = Math.round((1000 * T.length) / T.reduce((a, b) => a + b, 0));
        T = [];
        const ph = G.phase, inFight = ph === 'fight' && !document.hidden;
        if ((ph === 'intro' || ph === 'prepare') && wasEnd) { low = null; }
        wasEnd = ph === 'end' || ph === 'select' ? true : ph === 'fight' ? false : wasEnd;
        if (inFight && (low == null || fps < low)) low = fps;
        const col = (v) => (v != null && v < 30 ? '#ff6b6b' : '#ffd27a');
        tag.innerHTML = name + '<br>' + '<span style="color:' + col(fps) + '">' + fps + ' fps</span> · lowest <span style="color:' + col(low) + '">' + (low == null ? '-' : low + ' fps') + '</span>';
      }, 1000);
    }, 200);
  }



  if (/[?&]r3ddemo=1(&|$)/.test(Q)) {
    const ix = (c) => ND.CHARS.findIndex((x) => x.id === c);
    let st = { k: 'wait', t: 0, tier: 0 }, quiet = 0;
    const DEMO = (R3.demo = { step: 'wait' });
    const fresh = () => {
      for (const id of ['first', 'menu']) { const e = document.getElementById(id); if (e) e.hidden = true; }
      G.start('watch', { c1: ix('akane'), c2: ix('kuro'), arena: 'temple' });
      st = { k: 'fight', t: performance.now(), tier: 0 };
    };
    setInterval(() => {
      const now = performance.now(), D = ND.duel;
      DEMO.step = st.k + (st.tier ? ' ' + st.tier : '');
      if (st.k === 'wait') {
        const ready = G.F && ND.CHARS && D && D.finDemo && (!D.mocap || D.mocap.ready || D.mocap.error) && (HDM.akane || !GLB.includes('akane')) && (HDM.kuro || HDL.kuro === 'failed' || LOD !== 'hd');
        if (ready || now > 25000) fresh();
        return;
      }
      if (G.phase !== 'fight' && G.phase !== 'prepare' && G.phase !== 'intro' && now - st.t > 9000) { fresh(); return; }
      if (st.k === 'fight') {
        if (G.phase === 'fight' && now - st.t > 6000) {
          G.ais = []; for (const f of G.F) f.locked = false;
          if (D.finDemo('1', 'akane')) { st = { k: 'cine', t: now, tier: 1 }; quiet = 0; } else fresh();
        }
        return;
      }

      const busy = (D.chor && D.chor.cur) || (G.F && G.F.some((f) => D.finOf(f)));
      quiet = busy ? 0 : quiet + 1;
      if ((quiet > 10 && now - st.t > 1500) || now - st.t > 30000) {
        if (st.tier < 3 && G.phase === 'fight' && D.finDemo(String(st.tier + 1), 'akane')) { st = { k: 'cine', t: now, tier: st.tier + 1 }; quiet = 0; } else fresh();
      }
    }, 100);
  }
})(window.ND);
