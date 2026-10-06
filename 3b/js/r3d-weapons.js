




















(function (ND) {
  'use strict';
  const Q = (() => { try { return location.search || ''; } catch (e) { return ''; } })();
  if (!/[?&]r3d=1(&|$)/.test(Q) || /[?&]r3dwpn=0(&|$)/.test(Q)) return;
  const R3 = ND.r3d;
  if (!R3 || !R3.lib) return;
  const { v3, sub, add, mul, madd, dot, cross, len, norm, lerp, rotAx, hex, clamp, segDist, hcarry, EX, EY, EZ, LIGHT, EYE, MAXP } = R3.lib;
  const TAU = Math.PI * 2;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const perp = (a, u) => { const p = sub(a, mul(u, dot(a, u))); return len(p) > 1e-5 ? norm(p) : null; };
  const anyPerp = (u) => perp(EZ, u) || perp(EY, u) || perp(EX, u);
  const W = (ND.r3dW = { on: true, tris: {}, last: null });




  const GOLD = '#c9a24a', SILVER = '#b9c1cb', IRON = '#3d3a38', STEEL_HA = '#eef2f6', STEEL_JI = '#a4afbd', STEEL_MUNE = '#8792a2';


  const FIT = {
    akane: (c) => ({ ito: c.accentDark, same: '#1a1215', tsuba: GOLD, fit: GOLD, saya: '#1b1012', sageo: c.accent }),
    aoi: (c) => ({ ito: c.accent, same: '#12161d', tsuba: '#4a4f58', fit: SILVER, saya: '#121419', sageo: c.accent }),
    kuro: (c) => ({ ito: c.accent, same: '#141216', tsuba: '#2e2b2e', fit: '#5a5560', saya: '#131216', sageo: '#2a2420' }),
    yuki: (c) => ({ ito: '#d9dee6', same: '#1c1f25', tsuba: SILVER, fit: SILVER, saya: '#15171b', sageo: c.accent }),
    hana: (c) => ({ ito: c.accent, same: '#1b1218', tsuba: GOLD, fit: GOLD, saya: '#17111a', sageo: c.accent }),
    tetsu: (c) => ({ wood: '#2b1b12', fit: c.accent, tsuba: '#3b3530' }),
    ren: (c) => ({ ito: c.accent, same: '#1a1414', tsuba: GOLD, fit: GOLD, saya: '#141012', sageo: c.accentDark }),
    kage: (c) => ({ ito: c.accent, same: '#101214', tsuba: '#34322f', fit: '#45423e', saya: '#0f1013', sageo: '#23262d' }),
    tora: (c) => ({ wood: '#5b3b22', ito: '#24180f', same: '#6a4526', fit: IRON, chain: '#474a52', weight: '#2f3137' }),
    jin: (c) => ({ wood: '#6b4322', cap: '#4b505a', wrap: c.accentDark }),
    mai: (c) => ({ rib: '#2b2e35', leaf: c.accent, pivot: GOLD, tassel: c.accentDark, band: c.accent }),
    tsubame: (c) => ({ bow: '#2c1d15', rattan: c.accent, grip: c.accentDark, string: '#ece4ce', ito: c.accent, same: '#121820', fit: SILVER, saya: '#141a22', quiver: '#3b2a1e', fletch: '#ece6da', band: c.accent }),
    shura: (c) => ({ ito: c.accent, same: '#160c0e', tsuba: GOLD, fit: GOLD, saya: '#120a0c', sageo: '#3a2a20', strap: '#3a2a20' }),
  };
  const fitOf = (ch, c) => (FIT[ch.id] || ((cc) => ({ ito: cc.accentDark || '#3a2e30', same: '#151215', tsuba: '#3b3530', fit: '#5a5248', saya: '#141116', sageo: cc.accent || '#888' })))(c);

  const kindOf = (w) => w.type || (w.blade > 110 ? 'nodachi' : w.blade < 80 ? 'kodachi' : 'katana');
  const KATANA = { katana: 1, nodachi: 1, kodachi: 1, ninjato: 1 };
  const realW = (f) => (f.dz && f.dz.realWpn) || (f.wpn && f.wpn.fist ? Object.getPrototypeOf(f.wpn) : f.wpn) || ND.LEN;


  const mesh = () => ({ p: [], n: [], i: [] });
  function append(a, b) { const o = a.p.length / 3; a.p.push(...b.p); a.n.push(...b.n); for (const q of b.i) a.i.push(q + o); return a; }

  function orient(m) {
    const P = m.p, N = m.n, I = m.i;
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const A = v3(P[a], P[a + 1], P[a + 2]), fn = cross(sub(v3(P[b], P[b + 1], P[b + 2]), A), sub(v3(P[c], P[c + 1], P[c + 2]), A));
      const vn = v3(N[a] + N[b] + N[c], N[a + 1] + N[b + 1] + N[c + 1], N[a + 2] + N[b + 2] + N[c + 2]);
      if (dot(fn, vn) < 0) { const s = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = s; }
    }
    return m;
  }

  function facet(m) {
    orient(m);
    const P = [], N = [], I = [];
    for (let t = 0; t < m.i.length; t += 3) {
      const q = [m.i[t] * 3, m.i[t + 1] * 3, m.i[t + 2] * 3], V = q.map((k) => v3(m.p[k], m.p[k + 1], m.p[k + 2]));
      const n = norm(cross(sub(V[1], V[0]), sub(V[2], V[0])));
      for (const X of V) { P.push(X.x, X.y, X.z); N.push(n.x, n.y, n.z); I.push(I.length); }
    }
    m.p = P; m.n = N; m.i = I;
    return m;
  }

  function tube(prof, seg = 10, kz = 1, caps = true, kx = 1) {
    const m = mesh(), n = prof.length;
    for (let j = 0; j < n; j++) {
      const [y, r] = prof[j], a0 = prof[Math.max(0, j - 1)], a1 = prof[Math.min(n - 1, j + 1)];
      const dr = (a1[1] - a0[1]) / Math.max(1e-4, a1[0] - a0[0]);
      for (let k = 0; k < seg; k++) {
        const a = (k / seg) * TAU + Math.PI / seg, c = Math.cos(a), s = Math.sin(a);
        m.p.push(c * r * kx, y, s * r * kz);
        const q = norm(v3(c / kx, -dr, s / kz)); m.n.push(q.x, q.y, q.z);
      }
    }
    for (let j = 0; j < n - 1; j++) for (let k = 0; k < seg; k++) { const a = j * seg + k, b = j * seg + ((k + 1) % seg), c = a + seg, d = b + seg; m.i.push(a, c, b, b, c, d); }
    if (caps) for (const [j, ny] of [[0, -1], [n - 1, 1]]) {
      const base = m.p.length / 3, [y, r] = prof[j];
      if (r < 1e-3) continue;
      m.p.push(0, y, 0); m.n.push(0, ny, 0);
      for (let k = 0; k < seg; k++) { const a = (k / seg) * TAU + Math.PI / seg; m.p.push(Math.cos(a) * r * kx, y, Math.sin(a) * r * kz); m.n.push(0, ny, 0); }
      for (let k = 0; k < seg; k++) m.i.push(base, base + 1 + k, base + 1 + ((k + 1) % seg));
    }
    return orient(m);
  }
  function box(w, h, d, cx = 0, cy = 0, cz = 0) {
    const m = mesh(), X = w / 2, Y = h / 2, Z = d / 2;
    const F = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 1, 0], [0, 0, 1]], [[0, 1, 0], [1, 0, 0], [0, 0, 1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [1, 0, 0], [0, 1, 0]]];
    for (const [n, u, v] of F) {
      const base = m.p.length / 3;
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) m.p.push(cx + (n[0] + u[0] * a + v[0] * b) * X, cy + (n[1] + u[1] * a + v[1] * b) * Y, cz + (n[2] + u[2] * a + v[2] * b) * Z), m.n.push(n[0], n[1], n[2]);
      m.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    return orient(m);
  }

  function ball(rx, ry, rz, ws = 8, hs = 6, cx = 0, cy = 0, cz = 0) {
    const m = mesh();
    for (let h = 0; h <= hs; h++) {
      const t = (h / hs) * Math.PI, y = Math.cos(t), r = Math.sin(t);
      for (let w = 0; w <= ws; w++) { const a = (w / ws) * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r; m.p.push(cx + x * rx, cy + y * ry, cz + z * rz); const q = norm(v3(x / rx, y / ry, z / rz)); m.n.push(q.x, q.y, q.z); }
    }
    for (let h = 0; h < hs; h++) for (let w = 0; w < ws; w++) { const a = h * (ws + 1) + w, b = a + 1, c = a + ws + 1, d = c + 1; m.i.push(a, c, b, b, c, d); }
    return orient(m);
  }

  function plate(out, t) {
    const m = mesh(), n = out.length;
    let cx = 0, cy = 0; for (const [x, y] of out) { cx += x / n; cy += y / n; }
    for (const s of [1, -1]) {
      const base = m.p.length / 3;
      m.p.push(cx, cy, (s * t) / 2); m.n.push(0, 0, s);
      for (const [x, y] of out) { m.p.push(x, y, (s * t) / 2); m.n.push(0, 0, s); }
      for (let k = 0; k < n; k++) m.i.push(base, base + 1 + k, base + 1 + ((k + 1) % n));
    }
    return orient(m);
  }



  function blade(L, w, t, sori, o = {}) {
    const N = o.n || 12, tipK = o.tipK || 0.12, straight = !!o.straight, m = { p: [], n: [], i: [], c: [] };
    const st = [];
    for (let i = 0; i <= N; i++) {
      const q = i / N, y = q * L, off = sori * 4 * q * (1 - q) * (q < 0.5 ? 1 : 1), ww = w * (1 - 0.18 * q), tt = t * (1 - 0.45 * q);

      const k = q > 1 - tipK ? (q - (1 - tipK)) / tipK : 0, ke = straight ? 1 - k * 0.5 : Math.cos(k * Math.PI * 0.45);
      const sc = 0.35 + 0.65 * ke, c0 = off - ww * (1 - ke) * 0.5, W2 = ww * sc, T2 = tt * (0.5 + 0.5 * ke);
      st.push([[c0 + W2, y, 0], [c0 + W2 * 0.25, y, T2], [c0 - W2 * 0.7, y, T2 * 0.7], [c0 - W2 * 0.9, y, 0], [c0 - W2 * 0.7, y, -T2 * 0.7], [c0 + W2 * 0.25, y, -T2]]);
    }
    const tip = [st[N][3][0] * 0.6 + st[N][0][0] * 0.4 - (straight ? 0 : w * 0.25), L + (o.tipLen != null ? o.tipLen : 3), 0];
    const bands = o.bands || [STEEL_HA, STEEL_JI, STEEL_MUNE, STEEL_MUNE, STEEL_JI, STEEL_HA];
    const tri = (A, B, C, col) => { const k = m.p.length / 3; m.p.push(...A, ...B, ...C); const n = norm(cross(sub(v3(...B), v3(...A)), sub(v3(...C), v3(...A)))); for (let j = 0; j < 3; j++) { m.n.push(n.x, n.y, n.z); m.c.push(col); } m.i.push(k, k + 1, k + 2); };
    const ctr = (i) => v3((st[i][0][0] + st[i][3][0]) / 2, st[i][0][1], 0);
    for (let i = 0; i < N; i++) for (let s = 0; s < 6; s++) {
      const a = st[i][s], b = st[i][(s + 1) % 6], c = st[i + 1][s], d = st[i + 1][(s + 1) % 6];

      const mid = v3((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3), out = sub(mid, ctr(i));
      const fn = cross(sub(v3(...c), v3(...a)), sub(v3(...b), v3(...a)));
      if (dot(fn, out) >= 0) { tri(a, c, b, bands[s]); tri(b, c, d, bands[s]); } else { tri(a, b, c, bands[s]); tri(b, d, c, bands[s]); }
    }
    for (let s = 0; s < 6; s++) {
      const a = st[N][s], b = st[N][(s + 1) % 6], mid = v3((a[0] + b[0] + tip[0]) / 3, (a[1] + b[1] + tip[1]) / 3, (a[2] + b[2] + tip[2]) / 3), out = sub(mid, ctr(N));
      const fn = cross(sub(v3(...b), v3(...a)), sub(v3(...tip), v3(...a)));
      if (dot(fn, out) >= 0) tri(a, b, tip, bands[s]); else tri(a, tip, b, bands[s]);
    }

    for (let s = 1; s < 5; s++) { const a = st[0][0], b = st[0][s], c = st[0][s + 1]; const fn = cross(sub(v3(...b), v3(...a)), sub(v3(...c), v3(...a))); if (fn.y <= 0) tri(a, b, c, bands[2]); else tri(a, c, b, bands[2]); }
    return m;
  }


  function Kit(name) {
    this.name = name; this.parts = [null]; this.P = []; this.N = []; this.C = []; this.A = []; this.I = []; this.id = {};
    this.M = new Float32Array(MAXP * 12); this.tris = 0;
  }

  Kit.prototype.part = function (name, list) {
    const pi = this.parts.length;
    if (pi >= MAXP) throw new Error('r3d weapons: too many parts in ' + this.name);
    for (const [m, col, mat, ink = 1] of list) {
      const base = this.P.length / 3, rgb = hex(col);
      for (let k = 0; k < m.p.length / 3; k++) {
        const cc = m.c ? hex(m.c[k]) : rgb;
        this.P.push(m.p[k * 3], m.p[k * 3 + 1], m.p[k * 3 + 2]); this.N.push(m.n[k * 3], m.n[k * 3 + 1], m.n[k * 3 + 2]);
        this.C.push(cc[0], cc[1], cc[2], ink); this.A.push(pi + 64 * mat);
      }
      for (const q of m.i) this.I.push(base + q);
    }
    this.parts.push(name); this.id[name] = pi;
    return pi;
  };
  Kit.prototype.done = function () {
    this.P = new Float32Array(this.P); this.N = new Float32Array(this.N); this.C = new Float32Array(this.C); this.A = new Float32Array(this.A);
    this.I = this.P.length / 3 > 65535 ? new Uint32Array(this.I) : new Uint16Array(this.I);
    this.tris = this.I.length / 3;
    return this;
  };

  Kit.prototype.set = function (name, X, Y, Z, o) {
    const i = typeof name === 'number' ? name : this.id[name]; if (!i) return;
    const M = this.M, k = i * 12;
    M[k] = X.x; M[k + 1] = Y.x; M[k + 2] = Z.x; M[k + 3] = o.x;
    M[k + 4] = X.y; M[k + 5] = Y.y; M[k + 6] = Z.y; M[k + 7] = o.y;
    M[k + 8] = X.z; M[k + 9] = Y.z; M[k + 10] = Z.z; M[k + 11] = o.z;
    this.shown[i] = 1;
  };
  Kit.prototype.hide = function (name) { const i = typeof name === 'number' ? name : this.id[name]; if (i) { this.M.fill(0, i * 12, i * 12 + 12); this.shown[i] = 0; } };
  Kit.prototype.clear = function () { this.M.fill(0); this.shown = new Uint8Array(this.parts.length); this.clip = null; };

  function rig(u, e) { const Y = norm(u), X = perp(e, Y) || anyPerp(Y), Z = cross(X, Y); return [X, Y, Z]; }
  Kit.prototype.place = function (name, F, o) { this.set(name, F[0], F[1], F[2], o); };

  Kit.prototype.span = function (name, a, b, ref) {
    const d = sub(b, a), l = len(d); if (l < 1e-4) { this.hide(name); return; }
    const Y = mul(d, 1 / l), X = perp(ref || EZ, Y) || anyPerp(Y), Z = cross(X, Y);
    this.set(name, X, d, Z, a);
  };



  function katanaParts(K, pre, w, F, kind) {
    const BL = w.blade, HL = w.handle, ninjato = kind === 'ninjato', tanto = kind === 'tanto';
    const tr = tanto ? 2.15 : kind === 'nodachi' ? 2.75 : 2.5, kz = 0.78;

    const prof = [[-HL, tr * 1.04], [-HL * 0.5, tr * 0.93], [-1.4, tr * 1.04]];
    const hilt = [[tube(prof, 12, kz), F.ito, 5, 0.7], [tube([[-1.6, tr * 1.12], [-0.2, tr * 1.12]], 12, kz), F.fit, 3, 0.5], [tube([[-HL - 1.6, tr * 0.9], [-HL - 1.1, tr * 1.1], [-HL + 0.4, tr * 1.1]], 12, kz), F.fit, 3, 0.5]];

    hilt.push([box(1.1, 3.2, 0.7, 0, -HL * 0.55, tr * kz * 0.98), F.fit, 3, 0.2], [box(1.1, 3.2, 0.7, 0, -HL * 0.45, -tr * kz * 0.98), F.fit, 3, 0.2]);

    if (ninjato) hilt.push([box(12.6, 1.3, 12.6, 0, 0.1, 0), F.tsuba, 2, 0.6], [box(10.2, 1.5, 10.2, 0, 0.1, 0), F.tsuba, 2, 0]);
    else if (!tanto) { const r = kind === 'nodachi' ? 7 : kind === 'kodachi' ? 5.4 : 6.4; hilt.push([tube([[-0.7, r * 0.9], [-0.45, r], [0.45, r], [0.7, r * 0.9]], 18, 0.86), F.tsuba, 3, 0.6], [tube([[-0.8, r * 0.5], [0.8, r * 0.5]], 14, 0.7), F.tsuba, 2, 0]); }
    else hilt.push([tube([[-0.4, tr * 1.25], [0.9, tr * 1.25]], 12, kz), F.fit, 3, 0.5]);

    hilt.push([tube([[0.6, 2.2], [3.4, 2.0]], 8, 0.5, true, 1.1), GOLD, 3, 0.3]);
    K.part(pre, hilt);
    const sori = ninjato ? 0.15 : tanto ? 0.5 : (3.2 * BL) / 96 * 0.55;
    const bw = (kind === 'nodachi' ? 2.75 : kind === 'kodachi' ? 2.05 : tanto ? 1.9 : 2.3), bm = blade(BL - 3, bw, 0.62, sori, { straight: ninjato, tipK: ninjato ? 0.06 : 0.11, n: tanto ? 8 : 12, tipLen: ninjato ? 1 : 2.5 });
    for (let k = 0; k < bm.p.length; k += 3) bm.p[k + 1] += 3;
    K.part(pre + 'Blade', [[bm, STEEL_JI, 1, 0.6]]);
  }

  function sayaParts(K, name, L, r, F, cord = true) {
    const kz = 0.62, list = [[tube([[0, r * 1.05], [L * 0.45, r], [L - 4, r * 0.86], [L, r * 0.82]], 12, kz), F.saya, 0, 0.8], [tube([[-0.3, r * 1.12], [2.4, r * 1.12]], 12, kz), F.fit || '#2a2420', 3, 0.5], [tube([[L - 5.5, r * 0.9], [L - 1, r * 0.88], [L + 0.6, r * 0.6]], 12, kz), F.fit || '#2a2420', 3, 0.5]];
    if (cord) list.push([tube([[8.6, r * 1.1], [11.6, r * 1.1]], 12, kz), F.sageo || '#3a2a20', 6, 0.4], [box(2.2, 3, 1.6, r * 1.1, 13, 0), F.saya, 0, 0.4]);
    return K.part(name, list);
  }

  function naginataParts(K, w, F) {
    const BL = w.blade, HL = w.handle, se = BL - 48, r = 2.3;
    const list = [[tube([[-HL, r], [se, r * 0.96]], 10), F.wood, 4, 0.8], [tube([[-HL - 2.6, r * 0.9], [-HL - 0.4, r * 1.15], [-HL + 5, r * 1.15]], 10), F.fit, 3, 0.5]];
    for (const d of [se - 14, se - 8]) list.push([tube([[d, r * 1.12], [d + 2.6, r * 1.12]], 10), F.fit, 3, 0.4]);
    list.push([tube([[se - 2.2, r * 1.2], [se + 0.6, r * 1.2]], 10), F.fit, 3, 0.4], [tube([[se - 0.4, 4.8], [se + 1.2, 4.8]], 12, 0.6), F.tsuba, 2, 0.5]);
    K.part('main', list);
    const bm = blade(48, 3.9, 0.85, 3.6, { tipK: 0.22, n: 10, tipLen: 3 });
    for (let k = 0; k < bm.p.length; k += 3) bm.p[k + 1] += se + 1.2;
    K.part('mainBlade', [[bm, STEEL_JI, 1, 0.6]]);
  }

  function boParts(K, w, F) {
    const BL = w.blade, HL = w.handle, r = 2.6;
    const list = [[tube([[-HL + 7, r], [0, r * 1.02], [BL - 7, r]], 10), F.wood, 4, 0.8]];
    list.push([tube([[BL - 8, r * 1.1], [BL - 0.8, r * 1.1], [BL, r * 0.8]], 10), F.cap, 2, 0.6], [tube([[-HL, r * 0.8], [-HL + 0.8, r * 1.1], [-HL + 8, r * 1.1]], 10), F.cap, 2, 0.6]);
    for (const f of [0.34, -0.18, -0.72]) { const k = f > 0 ? BL * f : HL * f; list.push([tube([[k, r * 1.12], [k + 5, r * 1.12]], 10), F.wrap, 6, 0.5]); }
    K.part('main', list);
  }


  function kamaParts(K, w, F) {
    const HL = w.handle, TOP = w.blade - 16;
    const list = [[tube([[-HL, 2.1], [TOP - 4, 2.0]], 10), F.ito, 5, 0.8], [tube([[TOP - 5.4, 2.6], [TOP + 1.4, 2.6], [TOP + 2.2, 1.9]], 10), F.fit, 2, 0.5], [tube([[-HL - 1, 2.4], [-HL + 0.6, 2.4]], 10), F.fit, 2, 0.4]];

    { const m = mesh(), S = 10, T = 6, R0 = 2.4, r0 = 0.6, cy = -HL - 2.6;
      for (let a = 0; a <= S; a++) for (let b = 0; b <= T; b++) { const A = (a / S) * TAU, B = (b / T) * TAU, cx = Math.cos(A) * (R0 + Math.cos(B) * r0), yy = Math.sin(A) * (R0 + Math.cos(B) * r0); m.p.push(0, cy + yy, cx + 0 * Math.sin(B)); m.p[m.p.length - 3] = Math.sin(B) * r0; m.n.push(Math.sin(B), Math.sin(A) * Math.cos(B), Math.cos(A) * Math.cos(B)); }
      for (let a = 0; a < S; a++) for (let b = 0; b < T; b++) { const i0 = a * (T + 1) + b, i1 = i0 + 1, i2 = i0 + T + 1, i3 = i2 + 1; m.i.push(i0, i2, i1, i1, i2, i3); }
      list.push([orient(m), F.fit, 2, 0.4]); }
    K.part('main', list);

    const qb = (a, c, b, t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
    const N = 10, m = { p: [], n: [], i: [], c: [] };

    const O0 = [-3, TOP + 1.5], O1 = [14, TOP + 8], O2 = [31, TOP - 5], I0 = [1, TOP - 2.5], I1 = [15, TOP - 1];
    const outer = [], inner = [];
    for (let i = 0; i <= N; i++) { outer.push(qb(O0, O1, O2, i / N)); inner.push(qb(I0, I1, O2, i / N)); }
    const th = (i) => 0.75 * (1 - i / N) + 0.15;
    const tri = (A, B, C, col) => { const k = m.p.length / 3; m.p.push(...A, ...B, ...C); const n = norm(cross(sub(v3(...B), v3(...A)), sub(v3(...C), v3(...A)))); for (let j = 0; j < 3; j++) { m.n.push(n.x, n.y, n.z); m.c.push(col); } m.i.push(k, k + 1, k + 2); };
    const quad = (a, b, c, d, col, out) => { const fn = cross(sub(v3(...b), v3(...a)), sub(v3(...d), v3(...a))); if (dot(fn, out) >= 0) { tri(a, b, c, col); tri(a, c, d, col); } else { tri(a, c, b, col); tri(a, d, c, col); } };
    for (let i = 0; i < N; i++) {
      const o0 = outer[i], o1 = outer[i + 1], n0 = inner[i], n1 = inner[i + 1];
      for (const s of [1, -1]) {

        const A = [o0[0], o0[1], s * th(i)], B = [o1[0], o1[1], s * th(i + 1)], C = [n1[0], n1[1], 0], D = [n0[0], n0[1], 0];
        const mA = [(o0[0] * 0.6 + n0[0] * 0.4), (o0[1] * 0.6 + n0[1] * 0.4), s * th(i) * 0.5], mB = [(o1[0] * 0.6 + n1[0] * 0.4), (o1[1] * 0.6 + n1[1] * 0.4), s * th(i + 1) * 0.5];
        quad(A, B, mB, mA, STEEL_JI, v3(0, 0, s)); quad(mA, mB, C, D, STEEL_HA, v3(0, 0, s));
      }

      quad([o0[0], o0[1], th(i)], [o1[0], o1[1], th(i + 1)], [o1[0], o1[1], -th(i + 1)], [o0[0], o0[1], -th(i)], STEEL_MUNE, v3(o0[0] - n0[0], o0[1] - n0[1], 0));
    }
    K.part('mainBlade', [[m, STEEL_JI, 1, 0.6]]);
  }

  function linkMesh() {
    const m = mesh(), S = 8, T = 4, ax = 1.35, r0 = 0.55;
    for (let a = 0; a <= S; a++) for (let b = 0; b <= T; b++) {
      const A = (a / S) * TAU, B = (b / T) * TAU, ca = Math.cos(A), sa = Math.sin(A), cb = Math.cos(B), sb = Math.sin(B);
      m.p.push(ca * (ax + cb * r0), 0.5 + sa * 0.5 * (1 + (cb * r0) / ax) * 0.92, sb * r0); m.n.push(ca * cb, sa * cb, sb);
    }
    for (let a = 0; a < S; a++) for (let b = 0; b < T; b++) { const i0 = a * (T + 1) + b, i1 = i0 + 1, i2 = i0 + T + 1, i3 = i2 + 1; m.i.push(i0, i2, i1, i1, i2, i3); }
    return orient(m);
  }


  function fanParts(K, pre, R, F) {
    K.part(pre + 'Bar', [[tube([[-5, 2.3], [R * 0.6, 2.25], [R, 1.6]], 10, 0.55), F.rib, 2, 0.8], [tube([[R * 0.62, 2.45], [R * 0.9, 2.2]], 10, 0.6), F.band, 6, 0.4], [tube([[-0.9, 1.0], [0.9, 1.0]], 8), F.pivot, 3, 0.2]]);
    const r0 = 0.3;
    for (let i = 0; i < 10; i++) {

      const shade = i % 2 ? hex(F.leaf).map((v) => v * 0.82) : hex(F.leaf), col = '#' + shade.map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');

      K.part(pre + 'P' + i, [[plate([[r0 * R, 0], [R, 0], [0, R], [0, r0 * R]], 0.35), col, 6, 0.35], [plate([[0.07 * R, 0], [r0 * R + 0.2, 0], [0, r0 * R + 0.2], [0, 0.07 * R]], 0.5), F.rib, 2, 0.2]]);
    }
    for (const s of ['A', 'B']) K.part(pre + 'Rib' + s, [[tube([[-5, 1.3], [R + 1.5, 1.0]], 6, 0.6), F.rib, 2, 0.6]]);
    { const out = []; for (let k = 0; k < 14; k++) out.push([Math.cos((k / 14) * TAU), Math.sin((k / 14) * TAU)]); K.part(pre + 'Sun', [[plate(out, 0.6), '#f4ecdc', 6, 0]]); }
    K.part(pre + 'Tassel', [[tube([[-10, 0.35], [0, 0.35]], 5), F.tassel, 6, 0.2], [ball(1.5, 1.8, 1.5, 6, 4, 0, -11.5, 0), F.band, 6, 0.3]]);
  }

  function arrowParts(K, name, Ls, F) {
    const list = [[tube([[0, 0.62], [Ls, 0.62]], 6), '#d6c296', 4, 0.5], [tube([[-0.6, 0.8], [0.4, 0.8]], 6), '#2a1d14', 6, 0.3]];
    { const m = tube([[Ls - 0.5, 0.9], [Ls, 2.3], [Ls + 8, 0.05]], 4, 0.45); list.push([facet(m), '#cfd5de', 1, 0.4]); }
    for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU + 0.5, m = plate([[0, 1.5], [0, 14], [3.6, 4.5]], 0.25), c = Math.cos(a), s = Math.sin(a); for (let q = 0; q < m.p.length; q += 3) { const x = m.p[q], z = m.p[q + 2]; m.p[q] = x * c - z * s; m.p[q + 2] = x * s + z * c; const nx = m.n[q], nz = m.n[q + 2]; m.n[q] = nx * c - nz * s; m.n[q + 2] = nx * s + nz * c; } list.push([m, k === 0 ? F.band || '#a33' : F.fletch || '#ece6da', 6, 0.2]); }
    return K.part(name, list);
  }
  const BOWN = 12;
  function bowParts(K, F) {


    for (let i = 0; i < BOWN; i++) {
      const t0 = i / BOWN, t1 = (i + 1) / BOWN, tm = (t0 + t1) / 2, rr = 1.05 + 0.75 * Math.exp(-Math.pow((tm - 0.41) / 0.22, 2));
      const grip = tm > 0.34 && tm < 0.48, list = [[tube([[0, rr], [1, rr]], 7, 0.8), grip ? F.grip : F.bow, grip ? 6 : 0, 0.7]];

      for (const b of [0.1, 0.16, 0.8, 0.86, 0.93]) if (b >= t0 && b < t1) { const y = (b - t0) / (t1 - t0); list.push([tube([[Math.max(0, y - 0.07), rr * 1.22], [Math.min(1, y + 0.07), rr * 1.22]], 7, 0.8), F.rattan, 6, 0.3]); }
      K.part('bow' + i, list);
    }
    K.part('strA', [[tube([[0, 0.32], [1, 0.32]], 4), F.string, 7, 0.15]]);
    K.part('strB', [[tube([[0, 0.32], [1, 0.32]], 4), F.string, 7, 0.15]]);
    arrowParts(K, 'nockArrow', 80, F);

    K.part('quiver', [[tube([[0, 3.6], [2, 4.2], [44, 4.6], [46, 4.9]], 10, 0.75), F.quiver, 6, 0.8], [tube([[3, 4.5], [6, 4.5]], 10, 0.75), F.band, 6, 0.4], [tube([[40, 4.8], [43, 4.8]], 10, 0.75), F.band, 6, 0.4], [tube([[-0.5, 3.4], [1, 3.8]], 10, 0.75), '#1d1510', 6, 0.4]]);
    for (let k = 0; k < 5; k++) {
      const list = [[tube([[0, 0.55], [6, 0.55]], 5), '#1b140e', 4, 0.3]];
      for (let v = 0; v < 2; v++) { const m = plate([[0, 4], [0, 17], [3.2, 6]], 0.22); if (v) for (let q = 0; q < m.p.length; q += 3) { m.p[q] = -m.p[q]; m.n[q] = -m.n[q]; } list.push([orient(m), k & 1 ? F.band : F.fletch, 6, 0.2]); }
      K.part('qa' + k, list);
    }
  }


  const KITS = new WeakMap();
  function kitOf(f) {
    const w = realW(f), c = f.col || {}, ch = f.ch;
    let K = KITS.get(f);
    if (K && K.ch === ch && K.col === c && K.w === w) return K;
    K = buildKit(ch, c, w);
    KITS.set(f, K);
    W.tris[ch.id] = K.tris;
    return K;
  }
  function buildKit(ch, c, w) {
    const F = fitOf(ch, c), kind = kindOf(w), K = new Kit(ch.id);
    K.ch = ch; K.col = c; K.w = w; K.kind = kind; K.F = F; K.same = hex(F.same || '#151215');
    if (KATANA[kind] || kind === 'tanto') {
      katanaParts(K, 'main', w, F, kind);
      if (w.twin) { katanaParts(K, 'sec', w, F, kind); sayaParts(K, 'saya', w.blade + 6, 2.6, F); sayaParts(K, 'saya2', w.blade + 6, 2.6, F); }
      else sayaParts(K, 'saya', w.blade + 6, kind === 'nodachi' ? 3.6 : kind === 'kodachi' ? 3 : 3.3, F);
      K.lie = kind === 'tanto' ? 2.4 : 5.5;
      if (kind === 'nodachi') for (const s of ['strap', 'strap2', 'strap3']) K.part(s, [[tube([[0, 1.1], [1, 1.1]], 6, 0.4, true, 1.5), F.strap || F.sageo || '#2a2420', 6, 0.4]]);
    } else if (kind === 'naginata') { naginataParts(K, w, F); K.lie = 4.2; }
    else if (kind === 'bo') { boParts(K, w, F); K.lie = 2.9; }
    else if (kind === 'kusarigama') {
      kamaParts(K, w, F);
      const lm = linkMesh();
      for (let i = 0; i < 22; i++) K.part('lk' + i, [[lm, F.chain, 2, 0.3]]);
      K.part('weight', [[facet(tube([[-4.5, 1.4], [-3.4, 2.7], [3.4, 2.7], [4.5, 1.4]], 6)), F.weight, 2, 0.6]]);
      K.lie = 2.6;
    } else if (kind === 'tessen') { fanParts(K, 'main', w.blade, F); fanParts(K, 'sec', w.blade * 0.94, F); K.lie = 1.6; }
    else if (kind === 'yumi') {
      katanaParts(K, 'main', w, F, 'tanto'); sayaParts(K, 'saya', w.blade + 6, 2.6, F, false); bowParts(K, F); K.lie = 2.4;
    } else { katanaParts(K, 'main', w, F, 'katana'); sayaParts(K, 'saya', w.blade + 6, 3.3, F); K.lie = 5.5; }
    K.done();
    return K;
  }




  function bodyOf(f, k, hd) {
    let hip = k.hip, neck = k.neck;
    if (hd && hd.M && hd.M.ix.hips != null) {
      const X = hd.M.ix, w = (p) => v3(hd.x0 + p.x * hd.dir, p.y, p.z);
      hip = w(hd.b[X.hips].p); neck = w(hd.b[X.neck].p);
    }
    const Y = norm(sub(neck, hip)), Xf = perp(k.cf, Y) || v3(k.dir, 0, 0), R = mul(cross(Xf, Y), k.dir < 0 ? -1 : 1);

    const Yp = norm(lerp(EY, Y, 0.4)), Xp = perp(Xf, Yp) || Xf, Rp = mul(cross(Xp, Yp), k.dir < 0 ? -1 : 1);
    return { k, glb: !!(hd && hd.M && hd.M.glb), o: hip, neck, X: Xf, Y, R, at: (fw, up, rt, from) => add(add(add(from || hip, mul(Xf, fw)), mul(Y, up)), mul(R, rt)), dir: (fw, up, rt) => norm(add(add(mul(Xf, fw), mul(Y, up)), mul(R, rt))),
      hdir: (fw, up, rt) => norm(add(add(mul(Xp, fw), mul(Yp, up)), mul(Rp, rt))), Yp };
  }


  function mountOf(K, B, which) {
    const kind = K.kind, id = K.ch.id;
    if (which === 'saya') {

      if (kind === 'nodachi' && B.k.sayaBk) { const [a, b] = B.k.sayaBk; return { a, u: norm(sub(b, a)), x: mul(B.X, -1) }; }
      if (kind === 'nodachi') { const a = B.at(-8.5, 4, 9, B.neck), b = B.at(-11, -14, -12); return { a, u: norm(sub(b, a)), x: mul(B.X, -1) }; }
      if (K.w.twin) return { a: B.at(4, 8, 13), u: B.hdir(-0.28, -0.96, 0.08), x: B.X };
      if (kind === 'tanto' || kind === 'yumi') return { a: B.at(6, 8, -12.5), u: B.hdir(-0.55, -0.83, -0.08), x: B.X };

      if (id === 'aoi') return { a: B.at(5, 6, -13.5), u: B.hdir(-0.62, -0.77, -0.14), x: mul(B.Yp, -1) };
      return { a: B.at(5, 7, -13.5), u: B.hdir(-0.75, -0.63, -0.16), x: B.Yp };
    }
    if (which === 'saya2') return { a: B.at(4, 8, -13), u: B.hdir(-0.28, -0.96, -0.08), x: B.X };
    if (which === 'quiver') { const top = B.at(-11, 10, 3, B.neck), bot = B.at(-13, 1, -3); return { a: bot, u: norm(sub(top, bot)), x: mul(B.X, -1) }; }
    return null;
  }




  function handAt(f, k, hd, s) {
    if (hd && hd.M && hd.M.grip && hd.M.ix['hand.' + s] != null) {
      const q = hcarry(hd, hd.M.ix['hand.' + s], hd.M.grip[s].c);
      return v3(hd.x0 + q.x * hd.dir, q.y, q.z);
    }
    const el = s === 'R' ? k.elF : k.elB, ha = s === 'R' ? k.haF : k.haB;
    return madd(ha, norm(sub(ha, el)), 1.2);
  }





  const SEC = new WeakMap();
  function secondLine(f, k, kind) {
    const rg = k.rg, el = k.elB, ha = k.haB, d = norm(sub(ha, el)), sgn = k.dir < 0 ? -1 : 1;
    const da = (kind === 'tessen' ? -sgn * 0.3 : sgn * 0.25) + ((rg && rg.secA) || 0);
    const base = kind === 'tessen' ? d : mul(d, -1), u0 = rotAx(base, EZ, -da), q0 = (rg && rg.secQ) || 1, o0 = rg && rg.secO != null ? rg.secO : 1;
    const clk = ND.simClock || 0, key = clk + ':' + ha.x + ':' + ha.y + ':' + el.x + ':' + el.y;
    let st = SEC.get(f); if (!st) SEC.set(f, (st = { a: 0, q: 1, clk: null, key: null, out: null }));
    if (st.key === key && st.out) return st.out;
    const w = realW(f), L0 = (kind === 'tessen' ? w.blade * 0.94 : w.blade) * q0, o = f.opp, ok = o && !o.dead && R3.pose && R3.pose(o);
    const half = kind === 'tessen' ? (0.14 + ((f.j && f.j.wFanB) || 0) * o0 * 2.35) / 2 : 0;


    const caps = ok ? [[ok.hip, ok.neck, 12.5], [ok.head, ok.head, 12.5], [ok.hipF, ok.knF, 10], [ok.hipB, ok.knB, 10], [ok.knF, ok.ftF, 9], [ok.knB, ok.ftB, 9]] : [];


    const handIn = segDist(ha, k.hip, k.neck) < 9;
    if (!handIn) caps.push([k.hip, k.neck, 10.5], [k.head, k.head, 10.5]);


    const uOf = (a, t) => { const u1 = rotAx(u0, EZ, -a); if (!t) return u1; const ax = perp(cross(u1, EZ), u1); return ax ? rotAx(u1, ax, t) : u1; };
    const pen = (a, q, t = 0) => {
      let m = 0;
      for (const sp of half > 0.05 ? [0, -half, half] : [0]) {
        const u = uOf(a - sp, t);
        for (let i = 0; i <= 8; i++) { const P = madd(ha, u, 6 + ((L0 * q - 6) * i) / 8); for (const [A, B, r] of caps) m = Math.max(m, r - segDist(P, A, B)); }
      }
      return m;
    };
    st.t = st.t || 0;
    let ta = 0, tq = 1, tt = 0;
    const inNow = pen(st.a, st.q, st.t) > 0;
    if (inNow) {

      let best = null, least = null;
      for (const t of [0, 0.5, -0.5, 1, -1, 1.4, -1.4]) {
        if (best) break;
        for (const q of [1, 0.8, 0.6]) for (let i = 0; i <= 20; i++) for (const sg of i ? [Math.sign(st.a) || 1, -(Math.sign(st.a) || 1)] : [1]) {
          const a = sg * i * 0.15, c = Math.abs(a - st.a) + Math.abs(a) * 0.3 + (1 - q) * 3 + Math.abs(t) * 2;
          if (best && c >= best.c) continue;
          const p = pen(a, q, t);
          if (p <= 0) best = { a, q, t, c }; else if (!least || p < least.p) least = { a, q, t, p };
        }
      }
      const pk = best || least; ta = pk.a; tq = pk.q; tt = pk.t;
    } else if (Math.abs(st.a) > 1e-3 || st.q < 1 || Math.abs(st.t) > 1e-3) {

      if (pen(0, 1, 0) > 0) { ta = st.a; tq = st.q; tt = st.t; }
    }
    const dt = st.clk == null ? 1 : clk - st.clk;

    if (dt < 0 || dt > 0.25 || inNow) { st.a = ta; st.q = tq; st.t = tt; } else {
      const k2 = Math.min(1, dt / 0.05), a1 = st.a + (ta - st.a) * k2, q1 = st.q + (tq - st.q) * k2, t1 = st.t + (tt - st.t) * k2;

      if (pen(a1, q1, t1) > 0) { st.a = ta; st.q = tq; st.t = tt; } else { st.a = a1; st.q = q1; st.t = t1; }
    }
    st.clk = clk; st.key = key;
    st.out = { u: uOf(st.a, st.t), q: q0 * st.q, o: o0, el, ha, turn: st.a, tilt: st.t, handIn };
    return st.out;
  }

  function gripFor(f, k, kind) {
    const out = perp(sub(k.elB, lerp(k.shB, k.haB, 0.5)), norm(sub(k.haB, k.elB))) || EY;
    if (kind === 'tanto' || kind === 'tessen') {
      const S = secondLine(f, k, kind), e = perp(out, S.u) || anyPerp(S.u);

      return { u: S.u, e, c: k.haB };
    }
    return null;
  }
  W.grip = function (f, s, k) {
    if (s !== 'L' || !f || !k) return null;
    const w = realW(f), kind = kindOf(w), armed = !k.noSword || (k.rg && k.rg.oneHand === 'R');
    if (w.twin && armed && !k.inside) return gripFor(f, k, kind);

    const j = f.j || {};
    if (armed && (kind === 'kusarigama' || (kind === 'yumi' && j.wBow > 0.5))) {
      const d = norm(sub(k.haB, k.elB)), out = perp(sub(k.elB, lerp(k.shB, k.haB, 0.5)), d) || anyPerp(d);
      return { u: perp(out, d) ? norm(cross(d, out)) : anyPerp(d), e: d, c: k.haB };
    }
    return null;
  };


  const PEN = new WeakMap();
  W.prep = function (E, f, k) {
    if (!W.arrows) W.arrows = poseArrows();
    if (!f || !k || !f.ch) { E.W = null; return; }
    const K = kitOf(f); E.W = K; K.clear();
    const w = K.w, kind = K.kind, hd = E.hd, B = bodyOf(f, k, hd), rg = k.rg;
    const shown = { hand: [], body: [], floor: [] };

    const koLoose = !!(f.dead && f.looseSword && !f.looseSword.none);



    const away = !k.noSword && !koLoose && !k.inHand && !w.iai;
    const armed = !k.noSword && !koLoose && !away, sheathedTanto = kind === 'yumi' && armed && f.j && f.j.wBow > 0.5;

    const u = norm(k.bu), e = perp(k.be, u) || anyPerp(u), FR = [e, u, cross(e, u)];


    const handPt = KATANA[kind] ? k.bh : madd(k.bh, u, -((k.src === 'mocap' && armed && !k.inside ? 4 : 0) + ((rg && rg.poleSlide) || 0)));

    if (armed && !sheathedTanto) {
      if (kind === 'tessen') poseFan(K, 'main', handPt, u, (f.j && f.j.wFan) || 0, w.blade, f);
      else if (kind === 'kusarigama') { K.place('main', FR, handPt); K.place('mainBlade', FR, handPt); poseChain(K, f, k, E, madd(handPt, u, -w.handle - 2.6)); }
      else {
        K.place('main', FR, handPt); K.place('mainBlade', FR, handPt);

        if (w.iai && k.saya && (!k.inHand || k.inside)) K.clip = { p: k.saya.a, n: norm(k.saya.u) };
      }

      (w.iai && !k.inHand ? shown.body : shown.hand).push(kind === 'tessen' ? 'fan' : kind);
    }

    if (w.twin && (armed || (rg && rg.oneHand === 'R' && !koLoose)) && !k.inside) {
      const S = secondLine(f, k, kind), h = handAt(f, k, hd, 'L');
      if (kind === 'tessen') poseFan(K, 'sec', h, S.u, ((f.j && f.j.wFanB) || 0) * S.o, w.blade * 0.94 * S.q, f);
      else {
        const F2 = rig(S.u, (gripFor(f, k, kind) || {}).e || anyPerp(S.u));
        const o = madd(h, S.u, w.handle * 0.42);

        const Fq = [F2[0], mul(F2[1], S.q), F2[2]];
        K.place('sec', F2, o); K.set('secBlade', Fq[0], Fq[1], Fq[2], o);
      }
      shown.hand.push(kind === 'tessen' ? 'fan' : kind);
    }

    if (K.id.saya) {
      if (w.iai && k.saya) { const su = norm(k.saya.u); K.place('saya', rig(su, perp(EY, su) || anyPerp(su)), k.saya.a); }
      else { const m = mountOf(K, B, 'saya'); K.place('saya', rig(m.u, m.x), m.a); if (K.id.strap && !B.glb) strap(K, B, m); }
      shown.body.push('saya');
    }
    if (K.id.saya2) { const m = mountOf(K, B, 'saya2'); K.place('saya2', rig(m.u, m.x), m.a); shown.body.push('saya2'); }

    if (sheathedTanto) { const m = mountOf(K, B, 'saya'); K.place('main', rig(m.u, m.x), m.a); shown.body.push('tanto'); }

    if (kind === 'yumi') { poseBow(K, f, k, E, B, handPt, u, armed && f.j && f.j.wBow > 0.5); shown[armed && f.j && f.j.wBow > 0.5 ? 'hand' : 'body'].push('bow'); }
    if (away && K.id.saya) {
      const m = mountOf(K, B, 'saya'); K.place('main', rig(m.u, m.x), m.a); shown.body.push(kind === 'yumi' ? 'tanto' : kind);
      if (w.twin && K.id.saya2) { const m2 = mountOf(K, B, 'saya2'); K.place('sec', rig(m2.u, m2.x), m2.a); shown.body.push(kind); }
    }

    if (!armed && !away) {
      const ls = looseOf(f);
      if (ls) { poseLoose(K, f, ls); shown.floor.push(kind); }
    }

    let sec = null;
    if (w.twin && shown.hand.length > (armed ? 1 : 0)) { const S = secondLine(f, k, kind), h = handAt(f, k, hd, 'L'); sec = [h, madd(h, S.u, (kind === 'tessen' ? w.blade * 0.94 : w.blade) * S.q), S.handIn]; }

    const A0 = f.state === 'atk' ? f.atk : null, W0 = A0 && (A0.hits && A0.hits.length ? A0.hits : A0.active ? [A0.active] : null);
    const hitting = !!(W0 && W0.some((q) => f.st >= q[0] - 0.05 && f.st <= q[1] + 0.12));
    PEN.set(f, { shown, k, K, handPt, u, sec, hitting, chain: kind === 'kusarigama' && armed ? E.chainPts : null });
  };

  function strap(K, B, m) {
    const a = madd(m.a, m.u, 12), s1 = B.at(1, 4, 9.5, B.neck), s2 = B.at(11.5, -14, 1, B.neck), s3 = B.at(9.5, 7, -11);
    K.span('strap', a, s1, B.R); K.span('strap2', s1, s2, B.X); K.span('strap3', s2, s3, B.X);
  }



  function poseFan(K, pre, h, u, open, R, f) {
    const nP = perp(cross(EZ, u), u) || anyPerp(u), Z = norm(cross(u, nP));
    const tsw = Math.sin(((ND.scene && ND.scene.t) || 0) * 4 + h.x * 0.05) * 1.5;

    const piv = madd(h, u, -5);
    K.place(pre + 'Tassel', rig(norm(v3(-tsw * 0.08, 1, 0)), EZ), piv);
    if (open < 0.06) {
      K.place(pre + 'Bar', rig(u, nP), h);
      for (let i = 0; i < 10; i++) K.hide(pre + 'P' + i);
      K.hide(pre + 'RibA'); K.hide(pre + 'RibB'); K.hide(pre + 'Sun');
      return;
    }
    K.hide(pre + 'Bar');
    const S = 0.14 + open * 2.35, d = (i) => add(mul(u, Math.cos(-S / 2 + (S * i) / 10)), mul(nP, Math.sin(-S / 2 + (S * i) / 10)));
    for (let i = 0; i < 10; i++) K.set(pre + 'P' + i, mul(d(i), 1 / R * R), mul(d(i + 1), 1), Z, h);

    const ra = d(0), rb = d(10);
    K.place(pre + 'RibA', [norm(cross(ra, Z)), ra, Z], h); K.place(pre + 'RibB', [norm(cross(rb, Z)), rb, Z], h);
    const sr = R * 0.14 * Math.min(1, open * 1.4);
    K.set(pre + 'Sun', mul(u, sr), mul(nP, sr), Z, madd(h, u, R * 0.66));
  }




  const CH = { P: [] };
  function poseChain(K, f, k, E, butt) {
    const rg = k.rg, C = rg ? rg.chain : (f.j && f.j.chain) || f.chain;
    const hand = handAt(f, k, E.hd, 'L');
    const n = C && C.init ? C.n || C.x.length : 0;
    if (!n) { for (let i = 0; i < 22; i++) K.hide('lk' + i); K.hide('weight'); return; }
    const HN = 7, Lw = n - 1, P = CH.P;

    const cam = (ND.mocap && ND.mocap.cam) || 320, zs = rg && rg.P ? k.hip.z - rg.P.hip[2] : 0;
    const lift = (i, z) => { const x = C.x[i], y = C.y[i]; if (!rg) return v3(x, -y, z); const s = cam / (cam - (z - zs)); return v3(rg.x + (x - rg.x) / s, -y / s, z); };
    const held = (() => { const q = lift(HN, hand.z); return len(sub(q, hand)) < 6; })();

    const o = f.opp, ok = o && R3.pose && R3.pose(o);
    let zW = held ? hand.z : butt.z;
    if (!held && ok) { const w0 = lift(Lw, butt.z), dch = segDist(w0, ok.hip, ok.neck); zW = lerp(v3(0, 0, butt.z), v3(0, 0, ok.chest.z), clamp(1 - (dch - 20) / 60, 0, 1)).z; }
    for (let i = 0; i < n; i++) {
      const z = held ? (i <= HN ? lerp(butt, hand, i / HN).z : hand.z) : butt.z + (zW - butt.z) * (i / Lw);
      P[i] = lift(i, z);
    }

    const o0 = sub(butt, P[0]), oH = held ? sub(hand, P[HN]) : v3(0, 0, 0);
    for (let i = 0; i < n; i++) {
      const t = held ? (i <= HN ? i / HN : 1) : i / Lw, off = held ? lerp(o0, oH, t) : mul(o0, 1 - t);
      P[i] = add(P[i], off);
    }

    const caps = [];
    if (ok) caps.push([ok.hip, ok.neck, 13], [ok.head, ok.head, 12], [ok.hipF, ok.knF, 9], [ok.hipB, ok.knB, 9]);
    caps.push([k.hip, k.neck, 11.5], [k.hipF, k.knF, 8.5], [k.hipB, k.knB, 8.5]);
    for (let it = 0; it < 2; it++) for (let i = 1; i < n; i++) {
      if (held && i === HN) continue;
      for (const [a, b, r] of caps) {
        const ab = sub(b, a), t = clamp(dot(sub(P[i], a), ab) / Math.max(1e-6, dot(ab, ab)), 0, 1), c = madd(a, ab, t), d = sub(P[i], c), dl = len(d);
        if (dl < r) P[i] = dl > 1e-3 ? madd(c, d, r / dl) : madd(c, EZ, r);
      }
    }
    let li = 0;
    for (let i = 0; i < n - 1 && li < 22; i++) {
      const a = P[i], b = P[i + 1], m = lerp(a, b, 0.5), d = sub(b, a), l = len(d) || 1e-3, y = mul(d, 1 / l);
      const x0 = perp(EZ, y) || anyPerp(y), x1 = cross(y, x0);
      for (const [p, q, x] of [[a, m, x0], [m, b, x1]]) {
        const ext = mul(y, l * 0.12), A = sub(p, ext), D = add(sub(q, p), mul(ext, 2));
        K.set('lk' + li, x, D, cross(x, y), A); li++;
      }
    }
    for (; li < 22; li++) K.hide('lk' + li);
    const wd = norm(sub(P[Lw], P[Lw - 1])), wx = perp(EZ, wd) || anyPerp(wd);
    K.place('weight', [wx, wd, cross(wx, wd)], madd(P[Lw], wd, 3));
    E.chainPts = P.slice(0, n);
  }




  function poseBow(K, f, k, E, B, h, u, inHand) {
    const j = f.j || {}, dirS = k.dir < 0 ? -1 : 1;
    let T, Bt, C, kn;
    if (inHand) {
      const n = perp(mul(cross(u, EZ), dirS), u) || v3(dirS, 0, 0), dr = clamp(j.wDraw || 0, 0, 1), tn = -(6 + 10 * dr);
      T = add(madd(h, u, 68), mul(n, tn)); Bt = add(madd(h, u, -46), mul(n, tn * 0.85)); C = add(madd(h, u, -11), mul(n, -tn * 0.93));
      kn = lerp(T, Bt, 0.5);
      if (dr > 0.01) kn = lerp(kn, handAt(f, k, E.hd, 'L'), dr);
      if (j.wArrow) K.place('nockArrow', rig(n, u), kn); else K.hide('nockArrow');
    } else {
      T = B.at(-7, 16, 10, B.neck); Bt = B.at(-8, -40, -10); C = add(lerp(T, Bt, 0.5), mul(B.X, -13)); kn = lerp(T, Bt, 0.5);
      K.hide('nockArrow');
    }
    const q = (t) => add(add(mul(Bt, (1 - t) * (1 - t)), mul(C, 2 * (1 - t) * t)), mul(T, t * t));
    const pl = norm(cross(sub(T, Bt), sub(C, Bt)));
    for (let i = 0; i < BOWN; i++) K.span('bow' + i, q(i / BOWN), q((i + 1) / BOWN), len(pl) > 0.5 ? pl : EZ);
    K.span('strA', Bt, kn, EZ); K.span('strB', kn, T, EZ);

    const m = mountOf(K, B, 'quiver'), Fq = rig(m.u, m.x);
    K.place('quiver', Fq, m.a);
    const nA = Math.max(0, Math.min(5, j.wAmmo == null ? 5 : j.wAmmo));
    for (let i = 0; i < 5; i++) {
      if (i >= nA) { K.hide('qa' + i); continue; }
      const sp = (i - 2) * 0.13, d = norm(add(Fq[1], mul(Fq[0], sp)));
      K.place('qa' + i, rig(d, Fq[2]), add(madd(m.a, m.u, 42), mul(Fq[2], (i - 2) * 1.3)));
    }
  }


  function looseOf(f) {
    const D = ND.duel, s = D && D.swordOf ? D.swordOf(f) : null;
    if (s) {
      const wob = s.mode === 'stuck' ? s.wob : 0, ang = (s.rot - 77000) + Math.sin(((ND.scene && ND.scene.t) || 0) * 42) * (wob || 0) * 0.06;
      return { o: v3(s.x, -s.y, 0), u: v3(Math.cos(ang), -Math.sin(ang), 0), rest: s.mode === 'rest', src: s };
    }
    const L = f.looseSword;
    if (L && !L.none && L.a && L.b) {
      const a = v3(L.a.x, -L.a.y, 0), b = v3(L.b.x, -L.b.y, 0);
      return { o: a, u: norm(sub(b, a)), rest: !!L.stuck || Math.abs(L.a.y - L.b.y) < 6, src: L };
    }
    return null;
  }
  const DRAWN = new Set();
  function poseLoose(K, f, ls) {
    const kind = K.kind;
    let u = ls.u, e = ls.rest ? EZ : perp(cross(EZ, u), u) || anyPerp(u);

    let o = ls.o;
    if (ls.rest) o = v3(o.x, Math.max(o.y, K.lie || 3), o.z);
    const Fm = rig(u, e);
    if (kind === 'tessen') { poseFan(K, 'main', o, u, 0, K.w.blade, f); }
    else {
      const o2 = KATANA[kind] ? madd(o, u, 1.5) : o;
      K.place('main', Fm, o2); if (K.id.mainBlade) K.place('mainBlade', Fm, o2);
      if (kind === 'kusarigama') {

        const butt = madd(o2, u, -K.w.handle - 2.6), back = v3(-u.x, 0, -u.z), side = norm(cross(EY, len(back) > 0.1 ? back : EX));
        const P = []; for (let i = 0; i < 12; i++) { const t = i / 11; P.push(add(add(madd(butt, len(back) > 0.1 ? norm(back) : EX, t * 52), mul(side, Math.sin(t * 3.4) * 10)), v3(0, ls.rest ? 1 - butt.y + 0.6 : 0, 0))); }
        let li = 0;
        for (let i = 0; i < 11; i++) { const a = P[i], b = P[i + 1], m = lerp(a, b, 0.5), y = norm(sub(b, a)), x0 = perp(EY, y) || anyPerp(y), x1 = cross(y, x0); for (const [p, q, x] of [[a, m, x0], [m, b, x1]]) { K.set('lk' + li, x, mul(sub(q, p), 1.24), cross(x, y), madd(p, y, -0.12 * len(sub(q, p)))); li++; } }
        const wd = norm(sub(P[11], P[10])), wx = perp(EY, wd) || anyPerp(wd); K.place('weight', [wx, wd, cross(wx, wd)], madd(P[11], wd, 3));
      }
    }
    if (ls.src) DRAWN.add(ls.src);
  }


  const AK = new Map();
  function arrowKit(col) {
    const key = (col && col.accent) || '#a33';
    let K = AK.get(key);
    if (!K) { K = new Kit('arrows'); for (let i = 0; i < 8; i++) arrowParts(K, 'a' + i, 66, { band: key, fletch: '#ece6da' }); K.done(); AK.set(key, K); }
    return K;
  }
  function poseArrows() {
    const G = ND.game, out = [];
    if (!G || !G.projs || !ND.Arrow) return out;
    const used = new Map();
    for (const p of G.projs) {
      if (!(p instanceof ND.Arrow) || p.dead || p.wait > 0) continue;
      const K = arrowKit(p.col);
      let n = used.get(K) || 0; if (n >= 8) continue;
      if (!n) { K.clear(); out.push(K); }
      const a = (p.rot % 1000) - Math.PI, u = v3(Math.cos(a), -Math.sin(a), 0), tip = v3(p.x, -p.y, 0), Fm = rig(u, EZ);
      K.place('a' + n, Fm, madd(tip, u, -66));
      used.set(K, n + 1); DRAWN.add(p);
    }
    return out;
  }


  const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aP; layout(location=1) in vec3 aN; layout(location=2) in vec4 aC; layout(location=3) in float aI;
uniform vec4 uM[${MAXP * 3}];
uniform mat4 uVP; uniform float uInk; uniform vec2 uView;
out vec3 vN; out vec3 vW; out vec4 vC; out vec3 vL; flat out float vM;
void main(){
  float pi = mod(aI + 0.5, 64.0) - 0.5; vM = floor((aI + 0.5) / 64.0);
  int i = int(pi + 0.5) * 3;
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
    c.z += 0.0006 * c.w;
  }
  gl_Position = c; vN = n; vW = w; vC = aC; vL = aP;
}`;
  const FS = `#version 300 es
precision highp float;
in vec3 vN; in vec3 vW; in vec4 vC; in vec3 vL; flat in float vM;
uniform float uInk; uniform vec3 uInkC;
uniform vec3 uKeyD, uKeyC, uShade, uEye, uSame; uniform float uKeyA, uFlash;
uniform vec4 uL[4]; uniform vec3 uLC[4];
uniform vec4 uClipP, uClipN;
out vec4 o;
void main(){
  int m = int(vM + 0.5);
  if (uClipN.w > 0.5 && m == 1 && dot(vW - uClipP.xyz, uClipN.xyz) > 0.0) discard;
  if (uInk > 0.0) { o = vec4(uInkC, 1.0); return; }
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 V = normalize(uEye - vW);
  vec3 base = vC.rgb;
  if (m == 5) {
    // tsuka-ito: two wraps crossing round the handle (4.4 apart), the ray skin in the diamonds between them
    float a = atan(vL.z, vL.x) / 6.28318, y = vL.y / 4.4;
    float s = y + a * 2.0, t = y - a * 2.0;
    float d = max(abs(s - floor(s + 0.5)), abs(t - floor(t + 0.5)));
    float fw = fwidth(d) * 1.2;
    float hole = 1.0 - smoothstep(0.27 - fw, 0.27 + fw, d);
    float ridge = smoothstep(0.42, 0.5, max(abs(fract(s) - 0.5) < 0.08 ? 1.0 : 0.0, 0.0));
    base = mix(base, uSame, hole) * (1.0 - 0.12 * ridge);
  }
  float dk = dot(n, uKeyD), sky = 0.5 + 0.5 * n.y;
  vec3 kc = normalize(uKeyC + vec3(0.6)) * 1.732;
  float diff = smoothstep(-0.3, 0.95, dk);
  vec3 shade = mix(uShade, vec3(1.0), 0.55);
  vec3 col = base * (mix(0.4, 0.74, sky) * shade + 0.62 * diff * mix(vec3(1.0), kc, 0.35));
  vec3 h = normalize(uKeyD + V);
  if (m == 0) col += pow(max(dot(n, h), 0.0), 70.0) * 0.55 * (kc * 0.5 + 0.5) + smoothstep(0.6, 1.0, dot(n, h)) * base * 0.35;
  if (m == 3) col = base * (0.35 + 0.8 * diff) * shade + pow(max(dot(n, h), 0.0), 26.0) * 0.6 * (kc * 0.4 + 0.6) * (base + 0.3);
  if (m == 2) col += pow(max(dot(n, h), 0.0), 30.0) * 0.25 * (kc * 0.5 + 0.5);
  if (m == 1) {
    // steel: the sky above and the dark floor below in its reflection, a sharp line of the key light
    vec3 R = reflect(-V, n);
    vec3 env = mix(vec3(0.2, 0.21, 0.26) * uShade, mix(vec3(0.86, 0.9, 0.97), kc * 0.6, 0.25), smoothstep(-0.35, 0.45, R.y));
    col = base * (0.3 + 0.9 * env) + pow(max(dot(R, uKeyD), 0.0), 60.0) * 1.1 * (kc * 0.5 + 0.5);
  }
  if (m == 7) col = base * (0.72 + 0.28 * diff);
  for (int k = 0; k < 4; k++) {
    vec4 L = uL[k];
    if (L.w <= 0.0) continue;
    vec3 v = L.xyz - vW; float dist = length(v);
    float I = L.w * (dist < 234.0 ? mix(0.42, 0.12, dist / 234.0) : mix(0.12, 0.0, clamp((dist - 234.0) / 286.0, 0.0, 1.0)));
    col += uLC[k] * I * 0.75 * max(dot(n, v / max(dist, 1.0)), 0.0) * (base * 1.3 + (m == 1 || m == 3 ? 0.25 : 0.0));
  }
  col += smoothstep(0.82, 0.98, 1.0 - max(dot(n, V), 0.0)) * uKeyC * 0.08;
  col *= mix(0.78, 1.0, clamp(vW.y / 60.0, 0.0, 1.0));
  o = vec4(mix(col, vec3(1.0, 0.96, 0.94), uFlash * 0.38), 1.0);
}`;
  let GLW = null;
  function glInit(gl) {
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('r3d weapons shader: ' + gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('r3d weapons link: ' + gl.getProgramInfoLog(p));
    const U = {};
    for (const k of ['uM', 'uVP', 'uInk', 'uView', 'uInkC', 'uKeyD', 'uKeyC', 'uShade', 'uEye', 'uSame', 'uKeyA', 'uFlash', 'uL', 'uLC', 'uClipP', 'uClipN']) U[k] = gl.getUniformLocation(p, k);
    GLW = { gl, p, U, vao: new Map() };
  }
  function vaoOf(gl, K) {
    let o = GLW.vao.get(K);
    if (o) return o;
    o = { vao: gl.createVertexArray(), n: K.I.length, it: K.I instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT };
    gl.bindVertexArray(o.vao);
    for (const [a, sz, loc] of [[K.P, 3, 0], [K.N, 3, 1], [K.C, 4, 2], [K.A, 1, 3]]) {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, sz, gl.FLOAT, false, 0, 0);
    }
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, K.I, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    GLW.vao.set(K, o);
    return o;
  }
  const INKK = (() => { const m = /[?&]r3dwink=([\d.]+)/.exec(Q); return m ? +m[1] : 0.8; })();

  W.draw = function (gl, w, h, vp, reflect, inkPx) {
    if (!GLW || GLW.gl !== gl) { try { glInit(gl); } catch (e) { W.on = false; W.why = String(e && e.message); R3.wpn = null; console.warn('[r3d] weapons off:', W.why); return 0; } }
    const { p, U } = GLW, FRl = R3.lib.FR.list;
    gl.useProgram(p);
    gl.uniformMatrix4fv(U.uVP, false, vp); gl.uniform2f(U.uView, w, h);
    gl.uniform3fv(U.uInkC, LIGHT.ink); gl.uniform3fv(U.uKeyD, LIGHT.keyD); gl.uniform3fv(U.uKeyC, LIGHT.keyC); gl.uniform1f(U.uKeyA, LIGHT.keyA);
    gl.uniform3fv(U.uShade, LIGHT.shade); gl.uniform3fv(U.uEye, EYE); gl.uniform4fv(U.uL, LIGHT.L); gl.uniform3fv(U.uLC, LIGHT.LC);
    const list = [];
    for (const E of FRl) if (E.W) list.push([E.W, E.flash || 0]);
    for (const K of W.arrows || []) list.push([K, 0]);
    let tris = 0;
    gl.enable(gl.CULL_FACE);
    const passes = reflect ? [1] : [0, 1];
    for (const pass of passes) {
      gl.cullFace(reflect ? gl.FRONT : pass === 0 ? gl.FRONT : gl.BACK);
      gl.uniform1f(U.uInk, pass === 0 ? Math.max(1, inkPx * INKK) : 0);
      for (const [K, fl] of list) {
        const o = vaoOf(gl, K);
        gl.uniform4fv(U.uM, K.M); gl.uniform1f(U.uFlash, reflect ? 0 : fl); gl.uniform3fv(U.uSame, K.same || [0.1, 0.1, 0.1]);
        if (K.clip) { gl.uniform4f(U.uClipP, K.clip.p.x, K.clip.p.y, K.clip.p.z, 0); gl.uniform4f(U.uClipN, K.clip.n.x, K.clip.n.y, K.clip.n.z, 1); } else gl.uniform4f(U.uClipN, 0, 0, 0, 0);
        gl.bindVertexArray(o.vao); gl.drawElements(gl.TRIANGLES, o.n, o.it, 0);
        if (!reflect && pass === 1) tris += o.n / 3;
      }
    }
    gl.bindVertexArray(null);
    if (!reflect) W.last = { kits: list.length, tris };
    return tris;
  };


  const on3d = (ctx) => !!(R3.prep && ctx && ctx.isGL === true && typeof ctx.custom === 'function');
  if (ND.duel && ND.duel.DuelSword) {
    const P0 = ND.duel.DuelSword.prototype, d0 = P0.draw;
    P0.draw = function (ctx) {
      if (on3d(ctx) && DRAWN.has(this)) { const ang = this.rot - 77000; if (ND.duel.drawSwordMark && this.mode !== 'fly') ND.duel.drawSwordMark(ctx, this.x, this.y, ang, this.owner); return; }
      return d0.apply(this, arguments);
    };
  }
  if (ND.LooseSword) { const P0 = ND.LooseSword.prototype, d0 = P0.draw; P0.draw = function (ctx) { if (on3d(ctx) && DRAWN.has(this)) return; return d0.apply(this, arguments); }; }
  if (ND.Arrow) {
    const P0 = ND.Arrow.prototype, d0 = P0.draw;
    P0.draw = function (ctx) {
      if (!(on3d(ctx) && DRAWN.has(this))) return d0.apply(this, arguments);
      if (this.glow > 0 && this.wait <= 0) { const a = (this.rot % 1000) - Math.PI, ux = Math.cos(a), uy = Math.sin(a); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = this.glow; ctx.strokeStyle = (this.col && this.col.glow) || 'rgba(170,235,255,.8)'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x - ux * 66, this.y - uy * 66); ctx.stroke(); ctx.restore(); }
    };
  }

  { const G = ND.game, rs0 = G && G.renderScene; if (rs0) G.renderScene = function () { DRAWN.clear(); W.arrows = null; return rs0.apply(this, arguments); }; }




  W.audit = function () {
    const G = ND.game, out = [];
    for (const f of (G && G.F) || []) {
      const A = PEN.get(f); if (!A) continue;
      const { shown, k, K } = A, o = { id: f.ch.id, hit: A.hitting, kind: K.kind, hand: shown.hand.join('+'), body: shown.body.join('+'), floor: shown.floor.join('+') };

      const segs = [];
      const w = K.w, uu = norm(k.bu);
      if (!k.noSword && shown.hand.length) {
        const BLn = K.kind === 'kusarigama' ? w.blade : K.kind === 'yumi' && f.j && f.j.wBow > 0.5 ? 0 : w.blade;
        if (BLn && !(K.w.iai && (!k.inHand || k.inside))) segs.push(['main', madd(A.handPt, uu, 8), madd(A.handPt, uu, BLn * (k.bladeVis || 1))]);
        const hd = R3.lib.hdOf(f), hp = handAt(f, k, hd, 'R');

        const pole = K.kind === 'naginata' || K.kind === 'bo', g1 = pole ? w.blade - (K.kind === 'naginata' ? 48 : 0) : 4;
        o.gripR = +segDist(hp, madd(A.handPt, uu, -w.handle), madd(A.handPt, uu, g1)).toFixed(1);
      }
      if (A.sec) segs.push(['sec', madd(A.sec[0], norm(sub(A.sec[1], A.sec[0])), 6), A.sec[1]]);
      let pen = 0, penSec = 0, penChain = 0;
      for (const g of G.F) {
        const q = R3.pose && R3.pose(g); if (!q) continue;
        const own = g === f, caps = own ? [[q.hip, q.neck, 10], [q.head, q.head, 10]] : [[q.hip, q.neck, 11], [q.head, q.head, 11], [q.hipF, q.knF, 9], [q.knF, q.ftF, 8], [q.hipB, q.knB, 9], [q.knB, q.ftB, 8]];
        for (const [nm, a0, a1] of segs) for (const [a, b, r] of caps) {
          if (nm === 'sec' && own && A.sec[2]) { o.handIn = 1; continue; }
          let m = 1e9; for (let i = 0; i <= 12; i++) m = Math.min(m, segDist(lerp(a0, a1, i / 12), a, b)); if (m < r - 2) { if (nm === 'sec') { penSec = Math.max(penSec, r - m); if (own) o.secOwn = 1; } else pen = Math.max(pen, r - m); } }

        if (A.chain && !own) for (const P of A.chain) for (const [a, b, r] of caps.slice(0, 2)) { const m = segDist(P, a, b); if (m < r - 2.5) penChain = Math.max(penChain, r - m); }
      }
      o.pen = +pen.toFixed(1); o.penSec = +penSec.toFixed(1); o.penChain = +penChain.toFixed(1);
      out.push(o);
    }
    return out;
  };
  W.info = () => Object.assign({ tris: W.tris }, W.last || {});
  W._sec = (f) => SEC.get(f);
  W._buildKit = buildKit;

  R3.wpn = W;
})(window.ND);
