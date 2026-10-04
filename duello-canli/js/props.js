














































(function (ND) {
  'use strict';
  const Math = ND.DM || globalThis.Math;
  const NM = globalThis.Math;
  const { clamp, segSeg } = ND.M;
  const fx = ND.fx, au = ND.audio, cam = ND.cam, pose = ND.pose, PO = ND.POSES;
  const G = () => ND.game;
  const pres = () => { const g = G(); return !(g && g.simOnly); };
  const qs = (() => { try { return location.search + location.hash; } catch (e) { return ''; } })();
  const FLAG = /[?&](props|esya)=1(&|#|$)/.test(qs) || /#.*esya/.test(qs);
  const TAU = Math.PI * 2;
  const GRAV = 2000, FGRAV = 2500;




  const MAT = {
    ceramic: { brk: 300, dk: 0.035, e: 0.22, mu: 0.45, snd: 'ceramic' },
    wood: { brk: 560, dk: 0.022, e: 0.28, mu: 0.6, snd: 'wood' },
    paper: { brk: 240, dk: 0.03, e: 0.12, mu: 0.7, snd: 'paper' },
    straw: { brk: 520, dk: 0.012, e: 0.1, mu: 0.85, snd: 'straw' },
    metal: { brk: Infinity, dk: 0, e: 0.32, mu: 0.4, snd: 'metal' },
  };










  const KINDS = ND.PROP_KINDS = {
    cup: { w: 13, h: 10, m: 0.3, hp: 1, mat: 'ceramic', liquid: 'sake', carry: 1, grip: [0, -5], upright: 1, kick: 1, throw: 1,
      hull: [[-4.5, 0], [4.5, 0], [6.5, -10], [-6.5, -10]], grid: [2, 2],
      weapon: { dmg: 7, stun: 0.85, kb: 150, post: 10, head: 1 } },
    bottle: { w: 17, h: 31, m: 0.8, hp: 2, mat: 'ceramic', liquid: 'sake', carry: 1, grip: [0, -24], upright: 1, kick: 1, throw: 1,
      hull: [[-6.5, 0], [6.5, 0], [8.5, -11], [4, -24], [3.6, -31], [-3.6, -31], [-4, -24], [-8.5, -11]],
      solid: [[[-6.5, 0], [6.5, 0], [8.5, -11], [5.5, -22], [-5.5, -22], [-8.5, -11]], [[-4.2, -21], [4.2, -21], [3.8, -31], [-3.8, -31]]],
      grid: [2, 3], weapon: { dmg: 9, stun: 0.9, kb: 180, post: 14, head: 1 } },
    jar: { w: 42, h: 46, m: 4, hp: 5, mat: 'ceramic', liquid: 'water', carry: 2, grip: [0, -42], upright: 1, kick: 1, throw: 1,
      hull: [[-13, 0], [13, 0], [20, -16], [20, -28], [13, -40], [10, -46], [-10, -46], [-13, -40], [-20, -28], [-20, -16]],
      grid: [3, 3], weapon: { dmg: 13, stun: 0.6, kb: 320, knock: 1, post: 30 } },
    stool: { w: 40, h: 42, m: 3, hp: 9, mat: 'wood', carry: 2, grip: [-17, -38], hold: 0, swing: 1, kick: 1, throw: 1, top: 42,
      hull: [[-20, 0], [20, 0], [21, -42], [-21, -42]],
      parts: [[-21, -42, 21, -35, 'split'], [-19, -35, -12, 0], [12, -35, 19, 0], [-12, -18, 12, -13]],
      weapon: { dmg: 14, stun: 0.6, kb: 380, knock: 1, post: 40 } },
    table: { w: 112, h: 34, m: 9, hp: 14, mat: 'wood', top: 34, kick: 0,
      hull: [[-56, 0], [56, 0], [56, -34], [-56, -34]],
      parts: [[-56, -34, 56, -26, 'split'], [-50, -26, -40, 0], [40, -26, 50, 0], [-40, -26, 40, -20]] },
    crate: { w: 56, h: 52, m: 10, hp: 20, mat: 'wood', top: 52, kick: 1,
      hull: [[-28, 0], [28, 0], [28, -52], [-28, -52]],
      parts: [[-28, -52, -21, 0], [21, -52, 28, 0], [-21, -52, 21, -35, 'split'], [-21, -35, 21, -18, 'split'], [-21, -18, 21, 0, 'split']] },
    barrel: { w: 48, h: 62, m: 12, hp: 18, mat: 'wood', liquid: 'sake', top: 62, kick: 1, round: 1,
      hull: [[-19, 0], [19, 0], [24, -15], [24, -47], [19, -62], [-19, -62], [-24, -47], [-24, -15]],
      parts: [[-24, -62, -14.4, 0], [-14.4, -62, -4.8, 0], [-4.8, -62, 4.8, 0], [4.8, -62, 14.4, 0], [14.4, -62, 24, 0]],
      weapon: { dmg: 10, stun: 0.5, kb: 300, knock: 1, trip: 1, post: 30 } },
    lantern: { w: 30, h: 74, m: 2, hp: 2, mat: 'paper', light: 1,
      hull: [[-15, 0], [15, 0], [14, -74], [-14, -74]],
      parts: [[-15, -8, 15, 0], [-13, -60, 0, -18], [0, -60, 13, -18], [-15, -18, -11, -8], [11, -18, 15, -8], [-14, -74, 14, -60]] },
    rack: { w: 74, h: 86, m: 9, hp: 16, mat: 'wood', swords: 2,
      hull: [[-37, 0], [37, 0], [37, -86], [-37, -86]],
      parts: [[-37, -6, 37, 0], [-33, -86, -24, -6], [24, -86, 33, -6], [-24, -66, 24, -58], [-24, -40, 24, -32]] },
    bale: { w: 56, h: 40, m: 5, hp: 8, mat: 'straw', top: 40, kick: 1, round: 1,
      hull: [[-25, 0], [25, 0], [28, -10], [28, -30], [25, -40], [-25, -40], [-28, -30], [-28, -10]],
      parts: [[[-28, -40], [-6, -40], [-2, -22], [-9, 0], [-28, 0]], [[-6, -40], [12, -40], [16, -20], [8, 0], [-9, 0], [-2, -22]], [[12, -40], [28, -40], [28, 0], [8, 0], [16, -20]]],
      weapon: { dmg: 6, stun: 0.4, kb: 260, post: 16 } },
    bucket: { w: 28, h: 26, m: 2, hp: 4, mat: 'wood', liquid: 'water', carry: 1, grip: [0, -34], upright: 1, kick: 1, throw: 1,
      hull: [[-11, 0], [11, 0], [13.5, -24], [-13.5, -24]],
      parts: [[-13.5, -24, -6.75, 0], [-6.75, -24, 0, 0], [0, -24, 6.75, 0], [6.75, -24, 13.5, 0]],
      weapon: { dmg: 8, stun: 0.6, kb: 220, post: 16 } },


    post: { w: 24, h: 210, m: 60, hp: 40, mat: 'wood', fixed: 1, kick: 0,
      hull: [[-12, 0], [12, 0], [12, -210], [-12, -210]], parts: [[-12, -210, 12, -140], [-12, -140, 12, -70], [-12, -70, 12, 0]] },

    veranda: { w: 190, h: 48, m: 400, hp: Infinity, mat: 'wood', fixed: 1, top: 48, kick: 0,
      hull: [[-95, 0], [95, 0], [95, -48], [-95, -48]] },

    shopfront: { w: 80, h: 236, m: 80, hp: 6, mat: 'paper', fixed: 1, kick: 0,
      hull: [[-40, 0], [40, 0], [40, -236], [-40, -236]],
      parts: [[-40, -236, 40, -204], [-40, -204, 0, -112], [0, -204, 40, -112], [-40, -112, 0, -18], [0, -112, 40, -18], [-40, -18, 40, 0]] },
    burner: { w: 50, h: 52, m: 30, hp: Infinity, mat: 'metal',
      hull: [[-17, 0], [17, 0], [25, -26], [22, -38], [15, -52], [-15, -52], [-22, -38], [-25, -26]],
      weapon: { dmg: 12, stun: 0.5, kb: 300, knock: 1, post: 40 } },
  };




  const ARENA_SETS = ND.PROP_SETS = {
    temple: [['burner', -560, -18], ['lantern', -380, -10], ['bale', -700, -6], ['table', 400, -8], ['cup', 382, 0, { on: 3 }], ['cup', 402, 0, { on: 3 }], ['bottle', 428, 0, { on: 3 }], ['rack', 640, -20]],
    rain: [['barrel', -560, -14], ['bucket', -470, -4], ['stool', -330, -6], ['crate', 430, -12], ['crate', 436, 0, { on: 3 }], ['jar', 560, -6], ['lantern', 700, -16]],
    snow: [['bale', -540, -10], ['bale', -486, -4], ['bucket', -380, -2], ['crate', 420, -14], ['jar', 520, -8], ['rack', 680, -22]],
    village: [['crate', -520, -14], ['barrel', -440, -6], ['bucket', -350, 0], ['stool', 340, -6], ['jar', 450, -10], ['bale', 620, -16], ['bottle', 380, -2]],
    market: [['table', -400, -8], ['cup', -420, 0, { on: 0 }], ['cup', -396, 0, { on: 0 }], ['bottle', -372, 0, { on: 0 }], ['stool', -300, -2, { fx: -1 }], ['stool', -520, -10],
      ['lantern', 330, -12], ['barrel', 450, -10], ['crate', 560, -16], ['jar', 563, 0, { on: 8 }], ['bucket', 690, -4]],
    waterfall: [['jar', -420, -8], ['jar', -360, -2], ['bucket', -300, 0], ['bale', 420, -12], ['crate', 560, -16], ['stool', 660, -6]],
    castle: [['rack', -600, -20], ['stool', -400, -6], ['barrel', 420, -12], ['crate', 520, -16], ['burner', 680, -20]],
  };


  function polyCentroid(P) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[(i + 1) % P.length], c = p[0] * q[1] - q[0] * p[1];
      a += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c;
    }
    if (Math.abs(a) < 1e-9) { let sx = 0, sy = 0; for (const p of P) { sx += p[0]; sy += p[1]; } return [sx / P.length, sy / P.length, 0]; }
    a *= 0.5;
    return [cx / (6 * a), cy / (6 * a), Math.abs(a)];
  }

  function clipPoly(P, C) {
    let out = P;
    const n = C.length, A0 = polyCentroid(C);
    for (let i = 0; i < n && out.length; i++) {
      const a = C[i], b = C[(i + 1) % n];
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const side = (p) => ex * (p[1] - a[1]) - ey * (p[0] - a[0]);
      const ins = side(A0) >= 0 ? (p) => side(p) >= -1e-9 : (p) => side(p) <= 1e-9;
      const inp = out; out = [];
      for (let j = 0; j < inp.length; j++) {
        const p = inp[j], q = inp[(j + 1) % inp.length], pi = ins(p), qi = ins(q);
        if (pi) out.push(p);
        if (pi !== qi) {
          const sp = side(p), sq = side(q), t = sp / (sp - sq);
          out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
        }
      }
    }
    return out;
  }
  function convexHull(pts) {
    const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (P.length < 3) return P;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }

  function mul(seed) { let s = seed | 0; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function jag(a, b, n, amp, r) {
    const L = [a], dx = b[0] - a[0], dy = b[1] - a[1], ln = Math.hypot(dx, dy) || 1, nx = -dy / ln, ny = dx / ln;
    for (let i = 1; i < n; i++) { const u = i / n + (r() - 0.5) * 0.18 / n, o = (r() - 0.5) * 2 * amp; L.push([a[0] + dx * u + nx * o, a[1] + dy * u + ny * o]); }
    L.push(b);
    return L;
  }



  function buildPieces(k, K) {
    const r = mul(0x51ed + k.length * 977 + k.charCodeAt(0) * 131), solid = K.solid || [K.hull], out = [];
    const add = (polys, cut, edge) => {
      polys = polys.filter((p) => p.length >= 3 && polyCentroid(p)[2] > 1.2);
      if (!polys.length) return;
      let ax = 0, ay = 0, A = 0;
      const pts = [];
      for (const p of polys) { const c = polyCentroid(p); ax += c[0] * c[2]; ay += c[1] * c[2]; A += c[2]; for (const q of p) pts.push(q); }
      const cx = ax / A, cy = ay / A, hull = convexHull(pts);
      const v = hull.map((p) => [p[0] - cx, p[1] - cy]);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, rr = 0;
      for (const p of v) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); rr = Math.max(rr, Math.hypot(p[0], p[1])); }
      const m = Math.max(0.05, K.m * A / (K.w * K.h)), w = x1 - x0, h = y1 - y0;
      out.push({ polys, edge: edge || null, cut: cut || null, cx, cy, v, m, I: m * (w * w + h * h) / 12, r: rr, A });
    };
    if (K.grid) {

      const [C, R] = K.grid, x0 = -K.w / 2 - 1, x1 = K.w / 2 + 1, y0 = -K.h - 1, y1 = 1;
      const pt = [];
      for (let j = 0; j <= R; j++) {
        pt.push([]);
        for (let i = 0; i <= C; i++) {
          const inner = i > 0 && i < C && j > 0 && j < R, jx = inner ? (r() - 0.5) * 0.5 : 0, jy = inner ? (r() - 0.5) * 0.5 : 0;
          pt[j].push([x0 + (x1 - x0) * (i + jx) / C, y0 + (y1 - y0) * (j + jy) / R]);
        }
      }
      const amp = Math.min(K.w / C, K.h / R) * 0.16, H = [], V = [];
      for (let j = 0; j <= R; j++) { H.push([]); for (let i = 0; i < C; i++) H[j].push(j === 0 || j === R ? [pt[j][i], pt[j][i + 1]] : jag(pt[j][i], pt[j][i + 1], 3, amp, r)); }
      for (let j = 0; j < R; j++) { V.push([]); for (let i = 0; i <= C; i++) V[j].push(i === 0 || i === C ? [pt[j][i], pt[j + 1][i]] : jag(pt[j][i], pt[j + 1][i], 3, amp, r)); }
      for (let j = 0; j < R; j++) {
        for (let i = 0; i < C; i++) {
          const cell = [].concat(H[j][i], V[j][i + 1].slice(1), H[j + 1][i].slice().reverse().slice(1), V[j][i].slice().reverse().slice(1, -1));

          const c = polyCentroid(cell), parts = [];
          for (let q = 0; q < cell.length; q++) {
            const tri = [[c[0], c[1]], cell[q], cell[(q + 1) % cell.length]];
            for (const S of solid) { const cp = clipPoly(tri, S); if (cp.length >= 3) parts.push(cp); }
          }
          add(parts, null, cell);
        }
      }
    } else if (K.parts) {
      for (const pr of K.parts) {
        if (typeof pr[0] === 'number') {
          const [a, b, c, d, sp] = pr, poly = [[a, b], [c, b], [c, d], [a, d]];
          if (sp === 'split') {

            const mx = (a + c) / 2 + (r() - 0.5) * (c - a) * 0.3, J = jag([mx + (r() - 0.5) * 6, b], [mx + (r() - 0.5) * 6, d], 4, (c - a) * 0.025 + 1.4, r);
            { const e = [[a, b]].concat(J, [[a, d]]); add(fan(e), null, e); }
            { const e = [[c, b]].concat(J, [[c, d]]); add(fan(e), null, e); }
          } else add([poly], null, poly);
        } else add(fan(pr), null, pr);
      }
    }
    return out;
  }

  function fan(P) {
    const c = polyCentroid(P), T = [];
    for (let i = 0; i < P.length; i++) T.push([[c[0], c[1]], P[i], P[(i + 1) % P.length]]);
    return T;
  }

  const CUTS = {};
  function cutPieces(k, K, bucket) {
    const key = k + bucket;
    if (CUTS[key]) return CUTS[key];
    const th = (bucket / 16) * Math.PI, c = Math.cos(th), s = Math.sin(th), com = K._com, L = 400;
    const nx = -s, ny = c;
    const half = (sg) => [[com[0] + c * L, com[1] + s * L], [com[0] + c * L + nx * L * sg, com[1] + s * L + ny * L * sg], [com[0] - c * L + nx * L * sg, com[1] - s * L + ny * L * sg], [com[0] - c * L, com[1] - s * L]];
    const out = [];
    for (const sg of [1, -1]) {
      const H = half(sg), polys = [];
      for (const S of K.solid || [K.hull]) { const cp = clipPoly(S, H); if (cp.length >= 3) polys.push(cp); }
      const P0 = { polys, cut: [com[0], com[1], th], cx: 0, cy: 0 };

      let ax = 0, ay = 0, A = 0; const pts = [];
      for (const p of polys) { const q = polyCentroid(p); ax += q[0] * q[2]; ay += q[1] * q[2]; A += q[2]; for (const z of p) pts.push(z); }
      if (!A) continue;
      P0.cx = ax / A; P0.cy = ay / A; P0.A = A;
      P0.v = convexHull(pts).map((p) => [p[0] - P0.cx, p[1] - P0.cy]);
      let w = 0, h = 0, rr = 0;
      for (const p of P0.v) { w = Math.max(w, Math.abs(p[0]) * 2); h = Math.max(h, Math.abs(p[1]) * 2); rr = Math.max(rr, Math.hypot(p[0], p[1])); }
      P0.m = K.m * 0.5; P0.I = P0.m * (w * w + h * h) / 12; P0.r = rr;
      out.push(P0);
    }
    return (CUTS[key] = out);
  }


  const SCALE = { cup: 1.35, bottle: 1.25, jar: 1.12, stool: 1.1, table: 1.14, barrel: 1.06, lantern: 1.08, bucket: 1.2, rack: 1.2 };
  const scl = (v, s) => (typeof v === 'number' ? v * s : Array.isArray(v) ? v.map((q) => scl(q, s)) : v);

  for (const k in KINDS) {
    const K = KINDS[k];
    K.id = k;
    const sc = (K.sc = SCALE[k] || 1);
    if (sc !== 1) {
      K.w *= sc; K.h *= sc; if (K.top) K.top *= sc; K.m *= sc * sc;
      K.hull = scl(K.hull, sc); if (K.solid) K.solid = scl(K.solid, sc); if (K.grip) K.grip = scl(K.grip, sc);
      if (K.parts) K.parts = K.parts.map((pr) => (typeof pr[0] === 'number' ? pr.map((v) => (typeof v === 'number' ? v * sc : v)) : scl(pr, sc)));
    }
    const c = polyCentroid(K.hull);
    K._com = [c[0], c[1]];
    K._v = K.hull.map((p) => [p[0] - c[0], p[1] - c[1]]);
    K._r = Math.max(...K._v.map((p) => Math.hypot(p[0], p[1])));
    K._I = K.m * (K.w * K.w + K.h * K.h) / 12;
    K._mat = MAT[K.mat];

    K._ph = K.round ? Object.assign({}, K._mat, { mu: K._mat.mu * 0.3, roll: 0.5 }) : K._mat;
    K._pieces = K.hp === Infinity ? [] : buildPieces(k, K);
  }


  const S = {
    on: false, cpu: false, arena: null, rs: 1, t: 0, nid: 1, items: [], shards: [],
    tasks: [null, null], brain: [{ cd: 1.5 }, { cd: 2.5 }], dizzy: [0, 0], fy: [0, 0], fvy: [0, 0],
  };
  const lowDebris = () => (ND.game && ND.game.mode === 'online') || !!(ND.gfx && (ND.gfx.tier === 'low' || ND.gfx.mobile));
  const P = ND.props = {
    on: false, S, KINDS, ARENA_SETS, MAT,
    get items() { return S.items; },
    get shards() { return S.shards; },


    debrisCap: () => (lowDebris() ? 26 : 48),
    debrisKeep: () => (lowDebris() ? 3.5 : 6),
    listeners: [],
    stats: { breaks: 0, maxShards: 0 },
  };
  const rnd = () => { let t = (S.rs = (S.rs + 0x6d2b79f5) | 0); t = Math.imul(t ^ (t >>> 15), 1 | t); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rr = (a, b) => a + rnd() * (b - a);
  const emit = (ev) => { if (!pres()) return; for (const fn of P.listeners) { try { fn(ev); } catch (e) {                                         } } };
  P.on = (fn) => { P.listeners.push(fn); return () => { const i = P.listeners.indexOf(fn); if (i >= 0) P.listeners.splice(i, 1); }; };


  P.live = false;
  P.enable = function (o = {}) {
    P.live = S.on = true; S.cpu = !!o.cpu;
    installMoves(); installSolve();
    return P;
  };
  P.disable = function () { P.live = S.on = false; S.items.length = 0; S.shards.length = 0; FXP.length = 0; };
  P.setCpu = (v) => { S.cpu = !!v; };

  P.kind = (k) => KINDS[k];
  P.get = (id) => { for (const p of S.items) if (p.id === id) return p; return null; };
  P.held = (f) => { for (const p of S.items) if (p.st === 2 && p.hold === f.id) return p; return null; };

  P.reset = function (arena, o = {}) {
    S.arena = arena; S.items.length = 0; S.shards.length = 0; S.t = 0; S.nid = 1; S.brk = 0; S.mv = 0;
    S.rs = ((o.seed != null ? o.seed : ND.rng ? ND.rng.s : 1) ^ 0x5bd1e995) | 0;
    S.tasks[0] = S.tasks[1] = null; S.dizzy[0] = S.dizzy[1] = 0;
    S.brain[0] = { cd: 1.5 }; S.brain[1] = { cd: 2.6 };
    const L = o.layout || ARENA_SETS[arena] || ARENA_SETS.temple, made = [];
    for (const e of L) {
      const x = e[3] || {};
      made.push(P.spawn(e[0], e[1], { gz: e[2], on: x.on != null ? made[x.on] : null, fx: x.fx }));
    }
    if (ND.propArt && pres()) { ND.propArt.prepare(arena); ND.propArt.warm(); }
  };

  P.spawn = function (k, x, o = {}) {
    const K = KINDS[k];
    if (!K) return null;
    let sup = o.on != null ? (typeof o.on === 'object' ? o.on : P.get(o.on)) : null;
    if (sup && !KINDS[sup.k].top) sup = null;
    const gz = sup ? sup.gz : o.gz || 0, floor = sup ? sup.y - KINDS[sup.k]._com[1] - KINDS[sup.k].top : gz;
    const p = {
      id: S.nid++, k, x: x + K._com[0] * (o.fx || 1), y: floor + K._com[1], vx: 0, vy: 0, a: 0, w: 0, gz, hp: K.hp, st: 0,
      sup: sup ? sup.id : -1, hold: -1, hand: 'B', owner: -1, tt: 0, sl: 0, fx: o.fx || 1, lit: K.light ? 1 : 0,
      n: K.swords || 0, cut: 0, q: K.liquid ? 1 : 0, imp: 0, gz0: gz, hitF: -1, hitT: 0, spin: 0,
    };
    S.items.push(p);
    return p;
  };



  function toWorld(p, lx, ly, out) {
    const K = KINDS[p.k], c = Math.cos(p.a), s = Math.sin(p.a), x = (lx - K._com[0]) * p.fx, y = ly - K._com[1];
    out[0] = p.x + c * x - s * y; out[1] = p.y + s * x + c * y;
    return out;
  }
  const TW = [0, 0], TW2 = [0, 0];

  function topOf(q) {
    const K = KINDS[q.k];
    if (!K.top || q.st === 3 || q.st === 2 || Math.abs(Math.sin(q.a)) > 0.12) return null;
    return q.y - K._com[1] * Math.cos(q.a) - K.top;
  }

  function surfaceAt(x, b, cy) {
    let s = b.gz;
    for (const q of S.items) {
      if (q === b || q.st !== 0 || q.sup === b.id) continue;
      const K = KINDS[q.k];
      if (!K.top) continue;
      const t = topOf(q);
      if (t == null || Math.abs(x - q.x) > K.w / 2 + 1 || !(cy < t)) continue;
      if (t < s) s = t;
    }
    return s;
  }





  const CV = [];
  function integrate(b, V, m, I, mat, h, fl, surf) {
    b.vy += GRAV * h;
    b.x += b.vx * h; b.y += b.vy * h; b.a += b.w * h;
    const c = Math.cos(b.a), s = Math.sin(b.a);
    let n = 0, pen = 0, imp = 0;
    for (let i = 0; i < V.length; i++) {
      const lx = V[i][0] * fl, ly = V[i][1], rx = c * lx - s * ly, ry = s * lx + c * ly, wy = b.y + ry;
      const f = surf ? surfaceAt(b.x + rx, b, b.y) : b.gz;
      if (wy > f) { const d = wy - f; CV[n * 3] = rx; CV[n * 3 + 1] = ry; CV[n * 3 + 2] = d; n++; if (d > pen) pen = d; }
    }
    if (n) {

      let i0 = 0, i1 = -1;
      for (let i = 1; i < n; i++) if (CV[i * 3 + 2] > CV[i0 * 3 + 2]) i0 = i;
      for (let i = 0; i < n; i++) if (i !== i0 && (i1 < 0 || CV[i * 3 + 2] > CV[i1 * 3 + 2])) i1 = i;
      const nIds = i1 >= 0 ? 2 : 1;
      for (let it = 0; it < 3; it++) {
        for (let q = 0; q < nIds; q++) {
          const i = q === 0 ? i0 : i1;
          const rx = CV[i * 3], ry = CV[i * 3 + 1];
          const vcy = b.vy + b.w * rx, vcx = b.vx - b.w * ry;
          if (vcy <= 0) continue;
          if (it === 0) imp = Math.max(imp, vcy);

          const e = vcy > 120 ? mat.e : 0, rn = -rx, kn = 1 / m + (rn * rn) / I;
          const jn = ((1 + e) * vcy) / kn / nIds;
          b.vy -= jn / m; b.w += (rn * jn) / I;

          const rt = -ry, kt = 1 / m + (rt * rt) / I, vt = b.vx - b.w * ry;
          let jt = -vt / kt;
          const lim = mat.mu * jn;
          if (jt > lim) jt = lim; else if (jt < -lim) jt = -lim;
          b.vx += jt / m; b.w += (rt * jt) / I;
        }
      }
      b.y -= pen;
      b.w *= 1 - (mat.roll ?? 3) * h;
      b.vx *= 1 - 0.6 * h;
    }

    const A = ND.ARENA + 30;
    if (b.x > A) { b.x = A; if (b.vx > 0) { b.vx *= -0.35; b.w *= 0.6; imp = Math.max(imp, Math.abs(b.vx) * 2); } }
    if (b.x < -A) { b.x = -A; if (b.vx < 0) { b.vx *= -0.35; b.w *= 0.6; imp = Math.max(imp, Math.abs(b.vx) * 2); } }
    b._ct = n > 0;
    return imp;
  }


  function wake(p) { if (p.st === 0 && !KINDS[p.k].fixed) { p.st = 1; p.sl = 0; S.mv = (S.mv || 0) + 1; } }
  function freeSupported(p) { for (const q of S.items) if (q.sup === p.id && q.st === 0) { q.sup = -1; wake(q); } }
  P.hurt = function (p, dmg, how, ix, iy, dx, dy, by) {
    if (p.st === 3 || !(dmg > 0)) return false;
    p.hp -= dmg;
    if (p.hp <= 0) { breakProp(p, how, ix, iy, dx, dy, by); return true; }
    if (pres()) { snd(p, 'knock', Math.min(1.2, dmg / 6)); if (KINDS[p.k].mat === 'wood') splinters(ix, iy, dx, 3); }
    return false;
  };

  function breakProp(p, how, ix, iy, dx, dy, by) {
    S.brk = (S.brk || 0) + 1;
    const K = KINDS[p.k];
    if (p.st === 3) return;
    if (K.hp === Infinity) return;
    freeSupported(p);
    if (p.st === 2) p.hold = -1;
    p.st = 3; P.stats.breaks++;
    let pieces = K._pieces;
    if (how === 'cut') {
      let th = Math.atan2(dy, dx) - p.a; th = ((th % Math.PI) + Math.PI) % Math.PI;
      pieces = cutPieces(p.k, K, Math.round((th / Math.PI) * 16) % 16);
    }
    const sp = how === 'crush' ? 1.25 : how === 'cut' ? 0.35 : 1;
    const c = Math.cos(p.a), s = Math.sin(p.a);
    for (let i = 0; i < pieces.length; i++) {
      const pc = pieces[i], lx = (pc.cx - K._com[0]) * p.fx, ly = pc.cy - K._com[1];
      const wx = p.x + c * lx - s * ly, wy = p.y + s * lx + c * ly;

      let ox = wx - ix, oy = wy - iy;
      if (how === 'cut') { const nx = -dy, ny = dx, d = nx * ox + ny * oy; ox = nx * Math.sign(d || 1); oy = ny * Math.sign(d || 1); }
      const ol = Math.hypot(ox, oy) || 1;
      const v = (how === 'cut' ? 90 : rr(120, 340)) * sp, up = how === 'crush' ? rr(120, 300) : rr(40, 200);
      S.shards.push({
        k: p.k, pi: how === 'cut' ? 100 + i : i, cb: how === 'cut' ? pieces : null, x: wx, y: wy,
        vx: p.vx * 0.6 + (ox / ol) * v + (how === 'crush' ? (ox / ol) * 120 : 0) + rr(-30, 30),
        vy: p.vy * 0.4 + (oy / ol) * v * 0.6 - up, a: p.a, w: p.w + rr(-9, 9) * (how === 'cut' ? 0.4 : 1),
        gz: p.gz, fl: p.fx, age: 0, sl: 0, fade: 0, ct: 0,
      });
    }

    if (K.swords && p.n > 0) for (let i = 0; i < p.n; i++) S.shards.push({ k: p.k, pi: -1, sword: 1, x: p.x + (i ? 14 : -14), y: p.y - 30, vx: rr(-140, 140), vy: rr(-380, -200), a: rr(-0.4, 0.4), w: rr(-6, 6), gz: p.gz, fl: 1, age: 0, sl: 0, fade: 0, ct: 0 });
    capShards();
    if (pres()) breakFx(p, how, ix, iy, dx, dy);
    emit({ type: 'break', p, how, x: ix, y: iy, by });
  }
  P.breakProp = (p, how = 'shatter', o = {}) => breakProp(p, how, o.x ?? p.x, o.y ?? p.y, o.dx ?? 1, o.dy ?? 0, o.by);
  function capShards() {
    const cap = P.debrisCap();

    let n = S.shards.length - cap;
    for (let i = 0; i < S.shards.length && n > 0; i++) { const d = S.shards[i]; if (d.fade === 0 && d.sl > 0.2) { d.fade = 0.0001; d.fq = 1; n--; } }
    while (S.shards.length > cap + 12) S.shards.shift();
    P.stats.maxShards = Math.max(P.stats.maxShards, S.shards.length);
  }


  P.step = function (h, F) {
    if (!P.live) return;
    const g = G();
    F = F || (g && g.F);
    S.t += h;
    for (let i = 0; i < 2; i++) if (S.dizzy[i] > 0) S.dizzy[i] = Math.max(0, S.dizzy[i] - h);

    if (F) for (const f of F) { runTask(f, h); if (S.cpu && !f.dead) cpuThink(f, h); }

    if (F) for (const p of S.items) if (p.st === 2) { const f = F[p.hold]; if (!f || f.dead) dropProp(p, f); else holdPose(p, f); }

    if (F) for (const f of F) { const p = P.held(f); if (p && (f.dead || DROP_ON[f.state])) dropProp(p, f, true); }

    for (const p of S.items) {
      if (p.st !== 1) continue;
      const K = KINDS[p.k];
      if (p.tt < 9) p.tt += h;
      if (p.owner >= 0 && p.tt < 2) p.gz += (0 - p.gz) * Math.min(1, h * 10);
      const vy0 = p.vy;
      const imp = integrate(p, K._v, K.m, K._I, K._ph, h, p.fx, true);
      if (imp > 0) {
        if (imp > K._mat.brk) {
          const ix = p.x, iy = p.y + K.h * 0.4;
          if (P.hurt(p, (imp - K._mat.brk) * K._mat.dk + (p.owner >= 0 && p.tt < 2 ? 1 : 0), 'shatter', ix, iy, p.vx * 0.002, -1)) continue;
        }
        if (pres() && imp > 90 && (vy0 > 90 || Math.abs(p.w) > 3)) snd(p, 'land', Math.min(1.2, imp / 500));
        if (imp > 150 && p.owner >= 0 && p.k !== 'table') p.owner = -1;
      }
      p.spin = p.w;


      if (p._ct && Math.abs(p.vx) < 8 && Math.abs(p.vy) < 24 && Math.abs(p.w) < 0.35) { p.sl += h; if (p.sl > 0.2) { p.st = 0; p.vx = p.vy = p.w = 0; p.owner = -1; } }
      else p.sl = 0;
      if (p.y > 400) p.st = 3;
    }

    for (const p of S.items) if (p.st === 0 && p.sup >= 0) { const q = P.get(p.sup); if (!q || q.st !== 0) { p.sup = -1; wake(p); } }

    propVsProp(h);
    if (F) {
      for (const f of F) {
        fighterFalls(f, h);
        bladeCuts(f, h);
        feetKicks(f, h);
        for (const p of S.items) if (p.st === 1) flyingHits(p, f, h);
      }
    }

    const keep = P.debrisKeep();
    for (let i = S.shards.length - 1; i >= 0; i--) {
      const d = S.shards[i];
      d.age += h;

      if (d.sl >= 0.25 && d.y < (d.gz || 0) - 6 && (d.brk !== (S.brk || 0) || d.mv !== (S.mv || 0))) d.sl = 0;
      if (d.sl < 0.25 || d.fade === 0) {
        const pc = shardPiece(d);
        if (d.sl < 0.25) {
          const imp = integrate(d, pc.v, pc.m, pc.I, KINDS[d.k]._mat, h, d.fl, false);
          if (imp > 160 && d.age > 0.05 && d.ct < 2) { d.ct++; if (pres()) shardTick(d, imp); }
          if (d._ct && Math.abs(d.vx) < 10 && Math.abs(d.vy) < 14 && Math.abs(d.w) < 0.5) d.sl += h; else d.sl = 0;
          if (d.sl >= 0.25) { d.vx = d.vy = d.w = 0; d.brk = S.brk || 0; d.mv = S.mv || 0; }
        }
      }
      if (d.fade === 0 && d.sl >= 0.25 && d.age > keep) d.fade = 0.0001;
      if (d.fade > 0) { d.fade += h * (d.fq ? 4 : 1); if (d.fade >= 1) S.shards.splice(i, 1); }
      else if (d.y > 400) S.shards.splice(i, 1);
    }

    if (F) for (const f of F) { S.fy[f.id] = f.dead ? f.rag.p.hip.y : f.y; S.fvy[f.id] = f.dead ? 0 : f.vy; }
    for (const p of S.items) if (p.cut > 0) p.cut = Math.max(0, p.cut - h);
    if (pres()) P.updateFx(h);
  };
  const DROP_ON = { hurt: 1, launch: 1, stagger: 1, gbreak: 1, down: 1, getup: 1, lock: 1, clash: 1 };
  function shardPiece(d) { return d.sword ? SWORD_PIECE : d.pi >= 100 ? d.cb[d.pi - 100] : KINDS[d.k]._pieces[d.pi]; }
  const SWORD_PIECE = { v: [[-62, -3], [62, -3], [62, 3], [-62, 3]], m: 1.2, I: 1.2 * 124 * 124 / 12, r: 62 };
  P.shardPiece = shardPiece;

  P.draw = (ctx, layer) => { if (ND.propArt) ND.propArt.draw(ctx, layer); };



  const handOf = (f) => (f.wpn && f.wpn.none ? 'F' : 'B');
  P.handOf = handOf;

  function carryTarget(f, out) {
    const j = f.j, d = f.dir;
    out[0] = j.sh.x + d * 21; out[1] = j.sh.y + 40;
    return out;
  }
  P.carryTarget = carryTarget;

  function holdPose(p, f) {
    const K = KINDS[p.k], j = f.j, d = f.dir, H = p.hand === 'F' ? ['elF', 'haF'] : ['elB', 'haB'];
    const moving = f.state === 'atk' && f.atk && f.atk.prop;
    let hx, hy, phi;
    if (moving || p.hand === 'F') { hx = j[H[1]].x; hy = j[H[1]].y; phi = Math.atan2(j[H[1]].y - j[H[0]].y, (j[H[1]].x - j[H[0]].x) * d); }
    else { carryTarget(f, TW); hx = TW[0]; hy = TW[1]; phi = Math.PI / 2 - 0.25; }
    p.fx = d;


    const a = moving || p.hand === 'F' ? (K.upright ? clamp(phi * 0.35, -0.9, 0.9) : phi + (K.hold || 0)) : 0;
    p.a = d * a;

    const gx = (K.grip[0] - K._com[0]) * p.fx, gy = K.grip[1] - K._com[1], c = Math.cos(p.a), s = Math.sin(p.a);
    p.x = hx - (c * gx - s * gy); p.y = hy - (s * gx + c * gy); p.w = 0;
  }
  function dropProp(p, f, hit) {
    p.st = 1; p.hold = -1; p.sl = 0; p.owner = -1; p.tt = 9;
    p.gz = 0; p.gz0 = 0;
    if (f) { p.vx = (f.vx || 0) * 0.5 + (hit ? -f.dir * rr(40, 120) : 0); p.vy = hit ? rr(-260, -120) : -40; p.w = rr(-8, 8); }
    if (pres()) snd(p, 'whoosh', 0.4);
  }
  P.drop = (f) => { const p = P.held(f); if (p) dropProp(p, f, false); };




  function fighterFalls(f, h) {
    const g = G();
    let x, y, vy, y0 = S.fy[f.id];
    if (f.dead) { const hp = f.rag.p.hip; x = hp.x; y = hp.y; vy = (hp.y - hp.py) * 120; }
    else { if (!(f.state === 'launch' || (f.state === 'down' && f.st < 0.02) || f.state === 'plunge')) return; x = f.x; y = f.y; vy = f.vy; }
    if (!(vy > 60)) return;
    for (const p of S.items) {
      if (p.st === 3 || p.st === 2) continue;
      const K = KINDS[p.k], top = p.y - K._com[1] * Math.cos(p.a) - (K.top || K.h * 0.85);

      if (Math.abs(x - p.x) > K.w / 2 + (f.dead ? 18 : 40)) continue;
      const yb = f.dead ? y + 12 : y;
      if (!(yb >= top - 2 && y0 + (f.dead ? 12 : 0) < top + 6)) continue;
      const e = (f.dead ? 1.2 : 1) * Math.max(vy, 260), ix = clamp(x, p.x - K.w / 2, p.x + K.w / 2), iy = top;
      if (K.hp === Infinity) {

        wake(p); p.vx += (p.x - x) * 2 + f.dir * 40; p.w += (x < p.x ? 1 : -1) * 3.5;
        if (!f.dead) { f.vy = -Math.min(420, vy * 0.45); f.vx = (x < p.x ? -1 : 1) * Math.max(140, Math.abs(f.vx)); f.y = Math.min(f.y, top - 1); }
        if (pres()) { snd(p, 'metal', 1.2); fx.dust(ix, iy, 10, 1.1); cam.punch(8); }
        g && g.hitstop(0.06);
        emit({ type: 'land', p, f, x: ix, y: iy });
        return;
      }
      const brk = P.hurt(p, e * 0.06 + 6, 'crush', ix, iy, f.vx * 0.002, 1, f);

      const small = K.m < 1.5;
      if (!f.dead) {

        if (brk && !small) { f.vy = Math.min(f.vy, 150); f.vx *= 0.55; }
        else if (!brk) { f.vy = -Math.min(320, vy * 0.4); f.y = Math.min(f.y, top - 1); f.vx *= 0.7; }
        if (!small) fallDamage(f, brk ? 5 : 3);
      } else if (!small) {

        for (const k in f.rag.p) { const q = f.rag.p[k]; const v = q.y - q.py; if (v > 0) q.py = q.y - v * (brk ? 0.35 : -0.2); }
      }
      g && g.hitstop(small ? 0.02 : brk ? 0.085 : 0.05);
      if (pres() && !small) { cam.punch(brk ? 10 : 6); fx.dust(ix, Math.min(iy + 10, 0), 7, 1.1); }
      emit({ type: 'land', p, f, x: ix, y: iy, broke: brk });
      return;
    }
  }
  function fallDamage(f, raw) {
    if (f.dead || !(f.hp > 1)) return;
    const d = Math.max(1, Math.round(raw * (ND.DMG ? ND.DMG.base : 0.65)));
    f.hp = Math.max(1, f.hp - d); f.damageTaken = (f.damageTaken || 0) + d; f.flash = Math.max(f.flash || 0, 0.45); f.ghostT = 0.55;
  }


  const BLADE_PREV = [null, null];
  function bladeCuts(f, h) {
    if (f.dead || !f.j || !f.j.tip || (f.wpn && f.wpn.none)) { BLADE_PREV[f.id] = null; return; }

    const j = f.j, pb = f.sweepFrom || f.prevBlade;
    if (!pb) return;
    const swinging = f.state === 'atk' && f.atk && f.atk.kind === 'blade' && Math.hypot(j.tip.x - pb[2], j.tip.y - pb[3]) > 5;
    if (!(swinging || (f.bladeActive && f.bladeActive()))) return;
    for (const p of S.items) {
      if (p.st === 3 || p.st === 2 || p.cut > 0) continue;
      const K = KINDS[p.k];
      if (K.hp === Infinity) continue;

      const r1 = segSeg(j.haF.x, j.haF.y, j.tip.x, j.tip.y, p.x, p.y, p.x, p.y), r2 = segSeg(pb[0], pb[1], pb[2], pb[3], p.x, p.y, p.x, p.y);
      const rad = K._r * 0.62;
      if (r1.d > rad && r2.d > rad && segSeg(pb[2], pb[3], j.tip.x, j.tip.y, p.x, p.y, p.x, p.y).d > rad) continue;
      const dx = j.tip.x - j.haF.x, dy = j.tip.y - j.haF.y, dl = Math.hypot(dx, dy) || 1;
      p.cut = 0.25;
      const light = K.m <= 6 || K.mat === 'ceramic' || K.mat === 'paper' || K.mat === 'straw';
      if (light) {
        const g = G();
        g && g.hitstop(p.st === 1 ? 0.07 : 0.035);
        if (pres()) { fx.flash(p.x, p.y, Math.atan2(dy, dx), 50, '255,244,225'); if (p.st === 1) { cam.punch(5); fx.text(p.x, p.y - 40, 'CUT!', '#ffe3a1'); } }
        breakProp(p, 'cut', p.x, p.y, dx / dl, dy / dl, f);
        emit({ type: 'cut', p, f, x: p.x, y: p.y });
      } else {
        if (!K.fixed) { wake(p); p.vx += f.dir * 60; p.w += f.dir * 1.2; }
        P.hurt(p, 5, 'shatter', p.x, p.y - 10, f.dir, 0, f);
        if (pres()) { fx.spark(p.x - f.dir * 10, p.y - 10, Math.atan2(-1, -f.dir), 6, 0.6, '240,220,180'); splinters(p.x, p.y - 10, f.dir, 4); }
      }
    }
  }


  function feetKicks(f, h) {
    if (f.dead || !f.j || !f.j.ftF) return;
    const kicking = f.state === 'atk' && f.atk && f.atk.kind === 'kick' && f.atk.active && f.st >= f.atk.active[0] && f.st <= f.atk.active[1];
    const fast = (f.state === 'dodge' || Math.abs(f.vx) > 240) && f.onGround;
    if (!kicking && !fast) return;
    for (const p of S.items) {
      if (p.st === 3 || p.st === 2) continue;
      const K = KINDS[p.k];
      if (!K.kick && !(K.m <= 2)) continue;
      const ft = f.j.ftF, near = Math.abs(ft.x - p.x) < K.w / 2 + 10 && ft.y > p.y - K.h * 0.6 - 12 && ft.y < p.y + K.h;
      if (!near || p.hitF === f.id && p.hitT > S.t - 0.3) continue;
      p.hitF = f.id; p.hitT = S.t;
      if (kicking) kickProp(p, f, 1);
      else if (K.m <= 2 && p.st === 0) { wake(p); p.vx = f.dir * rr(120, 220) + f.vx * 0.4; p.vy = -rr(80, 160); p.w = f.dir * rr(4, 9); if (pres()) snd(p, 'knock', 0.5); }
    }
  }
  function kickProp(p, f, power) {
    const K = KINDS[p.k], o = f.opp;
    freeSupported(p);
    if (p.st === 0 && p.sup >= 0) p.sup = -1;
    p.st = 1; p.sl = 0; p.owner = f.id; p.tt = 0; p.gz0 = p.gz;
    const m = clamp(12 / (K.m + 2), 0.55, 2.2);
    p.vx = f.dir * (460 + 260 * m) * power; p.vy = -(K.m > 8 ? 70 : 240) * power; p.w = f.dir * (K.m > 8 ? 7 : 14) * power;
    if (o && !o.dead) {
      const dx = o.x - p.x;
      if (dx * f.dir > 0 && Math.abs(dx) < 700) p.vx = f.dir * Math.max(Math.abs(p.vx), Math.min(900, Math.abs(dx) * 2.2));
    }
    if (pres()) { snd(p, 'kick', 1); fx.dust(p.x, p.gz, 6, 0.7); cam.punch(4); }
    G() && G().hitstop(0.04);
    emit({ type: 'kick', p, f, x: p.x, y: p.y });
  }


  function flyingHits(p, f, h) {
    const K = KINDS[p.k], sp = Math.hypot(p.vx, p.vy);
    if (f.dead || sp < 230 || (p.owner === f.id && (p.tt < 0.6 || p.k === 'table')) || (p.hitF === f.id && p.hitT > S.t - 0.4)) return;
    if (!f.j || !f.j.hip) return;
    const hb = ND.hurtboxes(f.j), rad = K._r * 0.7;
    let hit = null;
    for (const b of hb) { const r = segSeg(p.x, p.y, p.x - p.vx * h, p.y - p.vy * h, b[0], b[1], b[2], b[3]); if (r.d < b[4] + rad) { hit = [r.x, r.y, b[5]]; break; } }
    if (!hit) return;
    p.hitF = f.id; p.hitT = S.t;
    const from = p.owner >= 0 && p.owner !== f.id && G() ? G().F[p.owner] : (f.opp || null), g = G();
    if (f.isInv && f.isInv()) return;
    const dirx = Math.sign(p.vx) || 1;
    if (f.guardingFrom && f.guardingFrom(from || f.opp, p.x - p.vx * 0.1)) {
      const parry = f.ctrl && f.ctrl.since && ND.parryWin && f.ctrl.since('guard') <= ND.parryWin(f);
      if (parry || K.m <= 5) {

        g && g.hitstop(parry ? 0.1 : 0.05);
        if (pres()) { au.clang(0.5, cam.pan(p.x), 1.6); fx.spark(hit[0], hit[1], dirx > 0 ? Math.PI : 0, 10, 0.8); fx.text(f.x, -205, parry ? 'CUT!' : 'BLOCK', '#ffe3a1'); cam.punch(parry ? 7 : 4); }
        if (parry && f.j.tip) breakProp(p, 'cut', p.x, p.y, f.j.tip.x - f.j.haF.x, f.j.tip.y - f.j.haF.y, f);
        else breakProp(p, 'shatter', hit[0], hit[1], -dirx, 0, f);
        if (parry && f.gainKi) f.gainKi(10);
      } else {

        p.vx = -p.vx * 0.3; p.vy = -180; p.w = -p.w * 0.5;
        P.hurt(p, 6, 'shatter', hit[0], hit[1], -dirx, 0, f);
        if (pres()) { au.thud(1, cam.pan(p.x)); fx.dust(hit[0], hit[1], 6, 0.7); cam.punch(5); }
        g && g.hitstop(0.06);
      }
      f.posture = Math.min(99, (f.posture || 0) + (K.weapon ? K.weapon.post : 12) * 0.5);
      if (f.state === 'guard' || f.state === 'move') f.setState('block', { dur: 0.22 });
      f.vx = dirx * 120;
      return;
    }
    const W = K.weapon || { dmg: 6, stun: 0.4, kb: 200, post: 10 };
    const pw = clamp(sp / 650, 0.6, 1.4);
    const a = attackOf(K, W, pw, sp);
    if (f.takeHit) f.takeHit(Math.round(W.dmg * pw), a, from, hit[0], hit[1], hit[2], dirx);
    if (pres()) { cam.punch(7); }

    if (K.mat === 'ceramic' || K.mat === 'paper') breakProp(p, 'shatter', hit[0], hit[1], -dirx, -0.3, from);
    else if (!P.hurt(p, sp * 0.036, 'shatter', hit[0], hit[1], -dirx, -0.3, from)) { p.vx = -p.vx * 0.25; p.vy = -200; p.w = -p.w * 0.4; }
    g && g.hitstop(0.06);
    if (hit[2] === 'head' && W.stun > 0.7) S.dizzy[f.id] = Math.max(S.dizzy[f.id], W.stun);
    emit({ type: 'hit', p, f, x: hit[0], y: hit[1] });
  }

  const ATKS = {};
  function attackOf(K, W, pw, sp = 700) {
    const kn = !!W.knock && sp > 260, key = K.id + (pw > 1.15 ? 'h' : pw < 0.8 ? 'l' : 'm') + (kn ? 'k' : '');
    return ATKS[key] || (ATKS[key] = { kind: 'prop', blunt: true, dmg: W.dmg, kb: W.kb * Math.min(1.2, pw), stun: W.stun, post: W.post, knock: kn, trip: !!W.trip, prop: K.id });
  }


  function propVsProp(h) {
    const L = S.items;
    for (let i = 0; i < L.length; i++) {
      const a = L[i];
      if (a.st !== 1) continue;
      const sa = Math.hypot(a.vx, a.vy);
      if (sa < 260) continue;
      const Ka = KINDS[a.k];
      for (let j = 0; j < L.length; j++) {
        const b = L[j];
        if (b === a || b.st === 3 || b.st === 2 || b.id === a.hitP) continue;
        const Kb = KINDS[b.k], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), R = (Ka._r + Kb._r) * 0.62;
        if (d > R) continue;
        a.hitP = b.id;
        const rv = sa, mt = Ka.m + Kb.m;
        if (Kb.fixed) { P.hurt(b, sa * Ka.m * 0.0006 + 1, 'shatter', a.x + dx * 0.5, a.y + dy * 0.5, Math.sign(a.vx), 0); a.vx = -a.vx * 0.3; a.hitP = b.id; break; }
        wake(b);
        b.vx += a.vx * (2 * Ka.m / mt) * 0.8; b.vy += Math.min(0, a.vy * (Ka.m / mt)) - 80; b.w += (Math.sign(a.vx) || 1) * 4 * Ka.m / mt;
        a.vx *= (Ka.m - Kb.m * 0.6) / mt; a.vy = Math.min(a.vy, -60);
        const ix = a.x + dx * 0.5, iy = a.y + dy * 0.5;
        P.hurt(b, rv * Ka.m / mt * 0.02 + 1, 'shatter', ix, iy, Math.sign(a.vx), 0);
        P.hurt(a, rv * Kb.m / mt * 0.02 + 1, 'shatter', ix, iy, -Math.sign(a.vx), 0);
        if (pres()) { cam.punch(3); snd(b, 'knock', 1); }
        break;
      }
    }
  }





  const MK = (o) => pose.mk(o);
  const POSE = {
    crouchGrab: MK({ hx: 10, hy: -50, lean: 0.62, hd: 0.25, ax: 22, ay: 40, sw: 0.9, grip: 0, gx: 30, gy: 40, f1x: 38, f2x: -30 }),
    tableGrab: MK({ hx: 8, hy: -70, lean: 0.38, hd: 0.2, ax: 22, ay: 36, sw: 0.7, grip: 0, gx: 40, gy: 30, f1x: 34, f2x: -28 }),
    carry: MK({ hx: -2, hy: -80, lean: 0.12, hd: 0.05, ax: 26, ay: 28, sw: -0.78, grip: 0, gx: -10, gy: 44, f1x: 24, f2x: -26 }),
    smashA: MK({ hx: -8, hy: -82, lean: -0.08, hd: -0.1, ax: 22, ay: 34, sw: 0.65, grip: 0, gx: -8, gy: -56, f1x: 20, f2x: -30 }),
    smashB: MK({ hx: 18, hy: -74, lean: 0.46, hd: 0.15, ax: 26, ay: 40, sw: 0.9, grip: 0, gx: 48, gy: -26, f1x: 58, f2x: -22 }),
    smashC: MK({ hx: 16, hy: -72, lean: 0.4, hd: 0.15, ax: 24, ay: 42, sw: 1.0, grip: 0, gx: 40, gy: 18, f1x: 58, f2x: -22 }),
    throwA: MK({ hx: -10, hy: -80, lean: -0.12, hd: -0.05, ax: 30, ay: 22, sw: -0.4, grip: 0, gx: -44, gy: -34, f1x: 24, f2x: -30 }),
    throwB: MK({ hx: 14, hy: -76, lean: 0.36, hd: 0.1, ax: 18, ay: 40, sw: 0.9, grip: 0, gx: 50, gy: -22, f1x: 50, f2x: -24 }),
    throwC: MK({ hx: 12, hy: -76, lean: 0.3, hd: 0.1, ax: 20, ay: 40, sw: 0.9, grip: 0, gx: 38, gy: 26, f1x: 50, f2x: -24 }),
    swingA: MK({ hx: -10, hy: -78, lean: -0.1, hd: 0, ax: 24, ay: 34, sw: 0.8, grip: 0, gx: -46, gy: -40, f1x: 22, f2x: -32 }),
    swingB: MK({ hx: 20, hy: -72, lean: 0.42, hd: 0.15, ax: 22, ay: 40, sw: 1.0, grip: 0, gx: 54, gy: -14, f1x: 62, f2x: -22 }),
    swingC: MK({ hx: 18, hy: -72, lean: 0.38, hd: 0.15, ax: 22, ay: 42, sw: 1.0, grip: 0, gx: 34, gy: 34, f1x: 60, f2x: -22 }),
    rearmA: MK({ hx: 6, hy: -66, lean: 0.36, hd: 0.2, ax: 46, ay: 18, sw: 0.4, grip: 0, gx: -8, gy: 36, f1x: 36, f2x: -30 }),
    rearmB: MK({ hx: -2, hy: -80, lean: 0.06, hd: -0.05, ax: 30, ay: -10, sw: -1.2, grip: 0, gx: -8, gy: 36, f1x: 24, f2x: -28 }),
  };
  P.POSE = POSE;

  function shoulderOf(p) { return [p.hx + Math.sin(p.lean) * 56 * 0.86, p.hy - Math.cos(p.lean) * 56 * 0.86]; }

  function reachPose(base, f, wx, wy, front) {
    const q = pose.copy(base), lx = (wx - f.x) * f.dir, ly = wy - f.y;
    for (let it = 0; it < 6; it++) {
      const sh = shoulderOf(q), dx = lx - sh[0], dy = ly - sh[1], d = Math.hypot(dx, dy);
      if (d <= 56 || it === 5) {
        const k = d > 57 ? 57 / d : 1;
        if (front) { q.ax = dx * k; q.ay = dy * k; } else { q.gx = dx * k; q.gy = dy * k; }
        q.grip = 0;
        break;
      }

      q.lean = Math.min(0.95, q.lean + 0.1); q.hy = Math.min(-34, q.hy + (dy > 0 ? 6 : -2)); q.hx += dx > 0 ? 4 : -2; q.f1x += 4;
    }
    return q;
  }
  const E = ND.M.ease;
  const MOVES = {};
  function defMove(name, o) { MOVES[name] = Object.assign({ kind: 'prop', prop: name, blunt: true }, o); }
  defMove('pr_grab', { dur: 0.42, active: null, post: 0, dmg: 0 });
  defMove('pr_smash', { dur: 0.6, active: [0.17, 0.27], dmg: 0, post: 0, sw: 0.14, pw: 0.8 });
  defMove('pr_swing', { dur: 0.66, active: [0.2, 0.3], dmg: 0, post: 0, sw: 0.18, pw: 1.2 });
  defMove('pr_throw', { dur: 0.56, active: null, dmg: 0, post: 0, sw: 0.16, pw: 0.9 });
  defMove('pr_kick', { dur: 0.5, active: [0.15, 0.26], dmg: 0, post: 0 });
  defMove('pr_shove', { dur: 0.55, active: [0.15, 0.25], dmg: 0, post: 0 });
  defMove('pr_rearm', { dur: 0.55, active: null, dmg: 0, post: 0 });
  let movesIn = false;
  function installMoves() {
    if (movesIn) return;
    movesIn = true;
    for (const k in MOVES) ND.ATK[k] = MOVES[k];
  }


  let solveIn = false;
  function installSolve() {
    if (solveIn || !ND.solve) return;
    solveIn = true;
    const s0 = ND.solve;
    ND.solve = function (p, rx, ry, dir, j, wpn) { const r = s0(p, rx, ry, dir, j, wpn); if (wpn && wpn.none) r.hasSword = false; return r; };
  }


  let actSpeed = 1;
  function startMove(f, name, keys, mem) {
    const a = MOVES[name];


    const own = keys.map((k) => [k[0], pose.copy(k[1]), k[2]]);
    f.setState('atk', { atk: a, atkName: name, keys: [[0, f.entry]].concat(own), aspd: actSpeed });
    Object.assign(f.mem, mem || {});
    f.chainN = 0;
    return true;
  }
  P.free = (f) => !f.dead && f.onGround && (f.state === 'move' || f.state === 'guard' || f.state === 'land' || f.state === 'zanshin');
  const facing = (f, x) => (x - f.x) * f.dir;

  P.canUse = function (f, p, act) {
    if (!f || f.dead) return false;
    const held = P.held(f);
    switch (act) {
      case 'grab': return !!p && !held && p.st === 0 && !!KINDS[p.k].carry && Math.abs(p.x - f.x) < 120 && P.free(f);
      case 'smash': return !!held && !KINDS[held.k].swing && P.free(f);
      case 'swing': return !!held && !!KINDS[held.k].swing && P.free(f);
      case 'throw': return !!held && !!KINDS[held.k].throw && P.free(f);
      case 'kick': return !!p && p.st === 0 && !!KINDS[p.k].kick && Math.abs(p.x - f.x) < 110 && P.free(f);
      case 'rearm': return !!p && p.st === 0 && p.k === 'rack' && p.n > 0 && Math.abs(p.x - f.x) < 120 && P.free(f);
      case 'shove': return !!p && P.free(f) && !!f.opp && !f.opp.dead && Math.abs(f.opp.x - f.x) < 120;
      default: return false;
    }
  };
  P.act = function (f, act, p) {
    if (!P.live) return false;
    if (act === 'smash' || act === 'swing' || act === 'throw') p = P.held(f);
    if (!P.canUse(f, p, act)) return false;
    const o = f.opp;
    f.dir = o && Math.abs(o.x - f.x) > 1 ? (o.x >= f.x ? 1 : -1) : f.dir;
    const front = handOf(f) === 'F';
    if (act === 'grab') {

      const K = KINDS[p.k];
      f.dir = p.x >= f.x ? 1 : -1;
      toWorld(p, K.grip[0], K.grip[1], TW);
      const low = TW[1] > -60, base = low ? POSE.crouchGrab : POSE.tableGrab;
      const R = reachPose(base, f, TW[0], TW[1], front);
      return startMove(f, 'pr_grab', [[0.15, R, E.outCubic], [0.22, R], [0.42, front ? POSE.rearmB : POSE.carry, E.inOut]], { pid: p.id, gt: 0.16 });
    }
    if (act === 'smash') {
      const k = front ? [[0.13, Object.assign(pose.copy(POSE.smashA), { ax: -6, ay: -56, gx: -10, gy: 36 }), E.outCubic], [0.22, Object.assign(pose.copy(POSE.smashB), { ax: 48, ay: -26, gx: -6, gy: 36 }), E.inQuad], [0.3, POSE.smashC, E.outCubic], [0.6, front ? POSE.rearmB : f.P.stance, E.inOut]]
        : [[0.13, POSE.smashA, E.outCubic], [0.22, POSE.smashB, E.inQuad], [0.3, POSE.smashC, E.outCubic], [0.6, f.P.stance, E.inOut]];
      return startMove(f, 'pr_smash', k, { pid: p.id });
    }
    if (act === 'swing') return startMove(f, 'pr_swing', [[0.16, POSE.swingA, E.outCubic], [0.26, POSE.swingB, E.inQuad], [0.36, POSE.swingC, E.outCubic], [0.66, f.P.stance, E.inOut]], { pid: p.id });
    if (act === 'throw') return startMove(f, 'pr_throw', [[0.15, POSE.throwA, E.outCubic], [0.22, POSE.throwB, E.inQuad], [0.32, POSE.throwC, E.outCubic], [0.56, f.P.stance, E.inOut]], { pid: p.id, rt: 0.2 });
    if (act === 'kick' || act === 'shove') {
      f.dir = act === 'kick' ? (o && Math.abs(o.x - f.x) > 1 ? (o.x >= f.x ? 1 : -1) : p.x >= f.x ? 1 : -1) : f.dir;
      return startMove(f, act === 'kick' ? 'pr_kick' : 'pr_shove', [[0.11, PO.k1a, E.inOutSine], [0.19, PO.k1b, E.outQuart], [0.28, PO.k1b], [act === 'kick' ? 0.5 : 0.55, f.P.stance, E.inOut]], { pid: p.id, kt: 0.17 });
    }
    if (act === 'rearm') {
      f.dir = p.x >= f.x ? 1 : -1;
      toWorld(p, 0, -KINDS.rack.h * 0.72, TW);
      const R = reachPose(POSE.rearmA, f, TW[0], TW[1], true);
      return startMove(f, 'pr_rearm', [[0.16, R, E.outCubic], [0.24, R], [0.4, POSE.rearmB, E.outCubic], [0.55, f.P.stance, E.inOut]], { pid: p.id, gt: 0.2 });
    }
    return false;
  };


  for (const name of Object.keys(MOVES)) MOVES[name].tick = (f, dt, t, o) => moveTick(f, name, dt, t, o);
  function moveTick(f, name, dt, t, o) {
    const m = f.mem, p = m.pid != null ? P.get(m.pid) : null;
    if (name === 'pr_grab') {
      if (!m.done && t >= m.gt) {
        m.done = true;
        if (p && p.st === 0 && !P.held(f)) {
          const K = KINDS[p.k], hand = handOf(f), j = f.j, ha = hand === 'F' ? j.haF : j.haB;
          toWorld(p, K.grip[0], K.grip[1], TW);
          if (Math.hypot(ha.x - TW[0], ha.y - TW[1]) < 46 + K._r) {
            freeSupported(p); p.sup = -1; p.st = 2; p.hold = f.id; p.hand = hand; p.owner = -1;
            if (pres()) snd(p, 'grab', 0.7);
            emit({ type: 'grab', p, f, x: p.x, y: p.y });
          }
        }
      }
      return;
    }
    if (name === 'pr_smash' || name === 'pr_swing') {
      const a = MOVES[name];

      if (t > 0.04 && t < a.active[0] + 0.02 && o && !o.dead) {
        const gap = facing(f, o.x), want = name === 'pr_swing' ? 92 : 78;
        f.vx = gap > want ? f.dir * Math.min(520, (gap - want) / 0.12) : 0; f.drive = true;
      }
      if (!p || p.st !== 2 || m.hit || t < a.active[0] || t > a.active[1] || !o || o.dead) return;
      const K = KINDS[p.k], W = K.weapon || { dmg: 6, stun: 0.5, kb: 200, post: 10 };
      if (o.isInv && o.isInv()) return;

      const hb = ND.hurtboxes(o.j), rad = K._r * 0.75 + 4;
      let hit = null;
      for (const b of hb) { if (b[5] === 'leg') continue; const r = segSeg(p.x, p.y, m.px ?? p.x, m.py ?? p.y, b[0], b[1], b[2], b[3]); if (r.d < b[4] + rad) { hit = [r.x, r.y, b[5]]; break; } }
      m.px = p.x; m.py = p.y;
      if (!hit) return;
      m.hit = true;
      const g = G();
      if (o.guardingFrom && o.guardingFrom(f)) {
        const parry = o.ctrl && o.ctrl.since && ND.parryWin && o.ctrl.since('guard') <= ND.parryWin(o);
        g && g.hitstop(parry ? 0.12 : 0.07);
        o.posture = Math.min(99, (o.posture || 0) + W.post);
        if (o.state === 'guard' || o.state === 'move') o.setState('block', { dur: 0.2 });
        if (parry || K.mat === 'ceramic') {
          if (parry && o.j.tip) breakProp(p, 'cut', p.x, p.y, o.j.tip.x - o.j.haF.x, o.j.tip.y - o.j.haF.y, o);
          else breakProp(p, 'shatter', hit[0], hit[1], -f.dir, 0, o);
          if (parry) { f.setState('recoil'); f.vx = -f.dir * 200; f.lockAtk && f.lockAtk('parry'); o.openCounter && o.openCounter(ND.CWIN ? ND.CWIN.parry : 0.5, 'parry', { from: f, serial: f.serial, counter: false }); }
        } else P.hurt(p, 5, 'shatter', hit[0], hit[1], -f.dir, 0, o);
        if (pres()) { au.clang(0.6, cam.pan(hit[0]), 1.4); fx.spark(hit[0], hit[1], Math.atan2(-0.6, -f.dir), 12, 0.9); cam.punch(5); if (parry) fx.text(o.x, -205, 'CUT!', '#ffe3a1'); }
        return;
      }
      const head = hit[2] === 'head';
      const a2 = attackOf(K, W, name === 'pr_swing' ? 1.2 : 1);
      o.takeHit(Math.round(W.dmg * (head ? 1.2 : 1)), a2, f, hit[0], hit[1], hit[2], f.dir);
      if (head && !W.knock) S.dizzy[o.id] = Math.max(S.dizzy[o.id], W.stun + 0.2);

      if (K.mat === 'ceramic' || name === 'pr_swing' || p.hp <= 6) breakProp(p, 'shatter', hit[0], hit[1], f.dir, -0.4, f);
      else P.hurt(p, 6, 'shatter', hit[0], hit[1], f.dir, 0, f);
      g && g.hitstop(0.1);
      if (pres()) { cam.punch(9); fx.text(o.x, -215, head ? 'SMASH!' : 'WHAM!', '#ffd27a'); }
      emit({ type: 'hit', p, f: o, by: f, x: hit[0], y: hit[1] });
      return;
    }
    if (name === 'pr_throw') {
      if (m.rel || t < m.rt || !p || p.st !== 2) return;
      m.rel = true;
      throwProp(p, f, o);
      return;
    }
    if (name === 'pr_kick' || name === 'pr_shove') {
      if (m.done || t < m.kt) return;
      m.done = true;
      if (name === 'pr_kick') {
        if (p && p.st !== 3 && p.st !== 2 && Math.abs(p.x - f.j.ftF.x) < KINDS[p.k].w / 2 + 34) kickProp(p, f, 1.15);
        else if (pres()) au.swoosh(0.6, f.pan);
      } else if (o && !o.dead && Math.abs(o.x - f.x) < 140) {

        o.setState('hurt', { dur: 0.1, hurtPose: PO.hurt2 });
        if (pres()) { au.thud(1.2, f.pan); fx.dust(o.x, o.y - 100, 8, 0.8); cam.punch(8); }
        G() && G().hitstop(0.08);
        if (p && p.st !== 3) P.slam(o, p, { from: f }); else { o.setState('launch', { wallBounced: false }); o.onGround = false; o.vx = f.dir * 420; o.vy = -420; }
        fallDamage(o, 4);
      }
      return;
    }
    if (name === 'pr_rearm') {
      if (m.done || t < m.gt) return;
      m.done = true;
      if (p && p.st === 0 && p.n > 0 && Math.abs(p.x - f.j.haF.x) < 80) {
        p.n--;
        if (f.wpn) f.wpn.none = false;
        if (pres()) { au.clang(0.35, f.pan, 1.6); au.swoosh(0.5, f.pan); fx.spark(f.j.haF.x, f.j.haF.y, -Math.PI / 2, 6, 0.5); fx.text(f.x, -215, 'RE-ARMED', '#ffe3a1'); }
        emit({ type: 'rearm', p, f, x: p.x, y: p.y });
      }
    }
  }

  function throwProp(p, f, o) {
    const K = KINDS[p.k];
    p.st = 1; p.hold = -1; p.owner = f.id; p.tt = 0; p.sl = 0; p.gz0 = p.gz; p.sup = -1;
    let tx = f.x + f.dir * 400, ty = -100;
    if (o && !o.dead) { tx = o.x; ty = o.y - 120; }
    const dx = tx - p.x, T = clamp(Math.abs(dx) / 980, 0.2, 0.62);
    p.vx = dx / T; p.vy = (ty - p.y - 0.5 * GRAV * T * T) / T;
    p.w = f.dir * (K.m > 2 ? 8 : 14);
    if (pres()) { au.swoosh(0.9, f.pan); snd(p, 'whoosh', 0.8); }
    emit({ type: 'throw', p, f, x: p.x, y: p.y, T });
  }
  P.throwProp = throwProp;

  P.slam = function (f, p, o = {}) {
    if (!f || f.dead || !p || p.st === 3) return false;
    const K = KINDS[p.k], top = p.y - K._com[1] - (K.top || K.h * 0.85);
    const dx = p.x - f.x, T = clamp(0.36 + Math.abs(dx) / 1100, 0.42, 0.85);
    f.setState('launch', { wallBounced: false }); f.onGround = false; f.jug = 0;
    f.vx = dx / T; f.vy = (top - f.y - 0.5 * FGRAV * T * T) / T;
    f.dir = o.from ? (o.from.x >= f.x ? 1 : -1) : f.dir;
    if (pres()) au.whoosh(0.9);
    return true;
  };







  P.go = function (f, p, act, done) {
    if (!P.live || !f || f.dead || !p) { if (done) done(false); return false; }
    return task(f, act, p, act === 'smash' || act === 'swing' ? 'opp' : act === 'throw' ? 'now' : 'to', done);
  };
  function task(f, act, p, ph, done, sp) {
    const T = S.tasks[f.id];
    const lock = T ? T.lock : !f.locked;
    S.tasks[f.id] = { act, pid: p.id, t: 0, lock, done: done || null, ph, sp: sp || 1 };
    f.locked = true;
    return true;
  }
  function standX(f, p, act) {
    const K = KINDS[p.k], o = f.opp;
    if (act === 'kick') {

      const s = o ? (o.x >= p.x ? -1 : 1) : -f.dir;
      return p.x + s * (K.w / 2 + 30);
    }
    const s = f.x >= p.x ? 1 : -1;
    return p.x + s * (K.w / 2 + (act === 'rearm' ? 34 : 22));
  }
  function runTask(f, h) {
    const T = S.tasks[f.id];
    if (!T) return;
    const p = P.get(T.pid), o = f.opp;
    const end = (ok) => { S.tasks[f.id] = null; if (T.lock) f.locked = false; if (T.done) { const d = T.done; T.done = null; d(ok); } };
    T.t += h;
    if (f.dead || T.t > 4 || (T.ph !== 'act' && (!p || p.st === 3 || (T.ph === 'to' && p.st === 2)))) { end(false); return; }
    if (T.ph === 'act') { if (f.state !== 'atk' || !f.atk || !f.atk.prop) end(true); return; }
    if (!P.free(f)) { if (f.state !== 'dodge' && T.t > 1.5) end(false); return; }
    let ready = false;
    if (T.ph === 'to') {
      const d = standX(f, p, T.act) - f.x;
      if (Math.abs(d) <= 10) ready = true;
      else if (Math.abs(d) > 240 && f.state === 'move' && !T.dashed) { T.dashed = true; f.setState('dodge', { ddir: Math.sign(d), back: Math.sign(d) !== f.dir }); }
      else if (f.state === 'move') f.vx = Math.sign(d) * Math.min(330 * T.sp, Math.abs(d) * 9);
    } else if (T.ph === 'opp') {
      if (!o || o.dead) { end(false); return; }
      const want = T.act === 'shove' ? 70 : T.act === 'swing' ? 100 : 92, gap = Math.abs(o.x - f.x);
      f.dir = o.x >= f.x ? 1 : -1;
      if (gap > want + 8) f.vx = f.dir * Math.min(360 * T.sp, (gap - want) * 8); else ready = true;
    } else ready = true;
    if (!ready) return;
    f.vx = 0;
    actSpeed = T.sp || 1;
    const ok = P.act(f, T.act, T.act === 'smash' || T.act === 'swing' || T.act === 'throw' ? null : p);
    actSpeed = 1;
    if (!ok) { end(false); return; }
    T.ph = 'act';
  }





  function cpuThink(f, h) {
    const g = G();
    if (!g || !g.ais || !g.ais.some((a) => a.me === f) || S.tasks[f.id] || g.phase !== 'fight') return;
    const B = S.brain[f.id];
    B.cd -= h;
    const o = f.opp, held = P.held(f);
    if (!o || o.dead || !P.free(f)) return;
    const dist = Math.abs(o.x - f.x);
    if (held) {
      const K = KINDS[held.k];
      if (dist < 130 && o.state !== 'atk' && rnd() < h * 3) P.act(f, K.swing ? 'swing' : 'smash');
      else if (dist > 230 && dist < 560 && K.throw && rnd() < h * 0.9) P.act(f, 'throw');
      else if (B.cd < -6) P.act(f, 'throw');
      return;
    }
    if (B.cd > 0) return;
    B.cd = rr(2.5, 5);
    if (f.wpn && f.wpn.none) { const r = P.nearest(f, 'rack', 600); if (r) P.go(f, r.p, 'rearm'); return; }

    const kk = P.nearest(f, (p) => KINDS[p.k].kick && p.st === 0 && (o.x - p.x) * (p.x - f.x) >= 0 && Math.abs(o.x - p.x) < 520, 170);
    const cc = P.nearest(f, (p) => KINDS[p.k].carry && p.st === 0, 190);
    const r = rnd();
    if (kk && (r < 0.5 || !cc) && dist > 120) P.go(f, kk.p, 'kick');
    else if (cc && dist > 150) P.go(f, cc.p, 'grab');
  }
  P.cpuThink = cpuThink;


  const FILTERS = {
    carry: (p) => !!KINDS[p.k].carry, kick: (p) => !!KINDS[p.k].kick, platform: (p) => !!KINDS[p.k].top,
    rack: (p) => p.k === 'rack' && p.n > 0, any: () => true,
  };
  P.nearest = function (f, filter = 'any', maxDist = 1e9) {
    const fn = typeof filter === 'function' ? filter : FILTERS[filter] || ((p) => p.k === filter);
    let best = null, bd = maxDist;
    for (const p of S.items) {
      if (p.st !== 0 || !fn(p)) continue;
      const d = Math.abs(p.x - f.x);
      if (d < bd) { bd = d; best = p; }
    }
    return best ? { p: best, d: bd } : null;
  };


  P.cineCandidates = function (att, def) {
    const out = [];
    if (!P.live || !att || !def || att.dead || def.dead) return out;
    const mid = (att.x + def.x) / 2, gap = Math.abs(att.x - def.x);
    const away = Math.sign(att.x - def.x) || def.dir;
    const focus = (x) => ({ x: (x + mid) / 2, y: -110, z: 1.35 });
    for (const p of S.items) {
      if (p.st !== 0) continue;
      const K = KINDS[p.k], dd = Math.abs(p.x - def.x);
      if (K.carry && dd < 260 && gap < 260) {
        const type = K.swing ? 'swing' : 'smash';
        out.push({ type, prop: p, user: def, target: att, dist: dd, score: (K.mat === 'ceramic' ? 3 : 2.4) - dd / 200 + (K.weapon && K.weapon.head ? 0.6 : 0), focus: focus(p.x) });
      }
      if (K.top && K.hp !== Infinity) {

        const beyond = (p.x - att.x) * away, d = Math.abs(p.x - att.x);
        if (beyond > 30 && d < 420 && gap < 200) out.push({ type: 'slam', prop: p, user: def, target: att, dist: d, score: 2.6 - d / 300 + (p.k === 'table' ? 0.8 : 0), focus: focus(p.x) });
      }
      if (K.kick && dd < 200 && (att.x - p.x) * (p.x - def.x) >= -10) out.push({ type: 'kick', prop: p, user: def, target: att, dist: dd, score: 1.6 - dd / 200, focus: focus(p.x) });
      if (K.throw && K.carry && dd < 200 && gap > 220) out.push({ type: 'throw', prop: p, user: def, target: att, dist: dd, score: 1.4 - dd / 250, focus: focus(p.x) });
      if (p.k === 'rack' && p.n > 0 && def.wpn && def.wpn.none && dd < 500) out.push({ type: 'rearm', prop: p, user: def, target: att, dist: dd, score: 5, focus: focus(p.x) });
    }
    out.sort((a, b) => b.score - a.score);
    return out;
  };


  P.playCine = function (c, o = {}) {
    if (!c || !P.live) { if (o.done) o.done(false); return false; }
    const f = c.user, p = c.prop, sp = o.speed || 1.3;
    const next = (ok) => {
      if (ok && o.then) { const n = typeof o.then === 'function' ? o.then() : o.then; if (n) { P.playCine(n, { done: o.done, speed: sp }); return; } }
      if (o.done) o.done(ok);
    };
    if (c.type === 'smash' || c.type === 'swing' || c.type === 'throw') {
      if (P.held(f) === p) return task(f, c.type, p, c.type === 'throw' ? 'now' : 'opp', next, sp);
      return task(f, 'grab', p, 'to', (ok) => { if (!ok) { next(false); return; } task(f, c.type, p, c.type === 'throw' ? 'now' : 'opp', next, sp); }, sp);
    }
    if (c.type === 'slam') return task(f, 'shove', p, 'opp', next, sp);
    return task(f, c.type, p, 'to', next, sp);
  };




  const ITEM_KEYS = ['id', 'k', 'x', 'y', 'vx', 'vy', 'a', 'w', 'gz', 'gz0', 'hp', 'st', 'sup', 'hold', 'hand', 'owner', 'tt', 'sl', 'fx', 'lit', 'n', 'cut', 'q', 'hitF', 'hitT', 'hitP', 'spin'];
  const SHARD_KEYS = ['k', 'pi', 'sword', 'x', 'y', 'vx', 'vy', 'a', 'w', 'gz', 'fl', 'age', 'sl', 'fade', 'fq', 'ct', 'brk', 'mv'];
  const cp = (o, K) => { const r = {}; for (const k of K) if (o[k] !== undefined) r[k] = o[k]; return r; };
  P.save = function () {
    return {
      rs: S.rs, t: S.t, nid: S.nid, arena: S.arena, brk: S.brk || 0, mv: S.mv || 0,
      items: S.items.map((p) => cp(p, ITEM_KEYS)),
      shards: S.shards.map((d) => Object.assign(cp(d, SHARD_KEYS), d.cb ? { cb: d.cb } : null)),
      tasks: S.tasks.map((t) => (t ? Object.assign({}, t) : null)),
      brain: S.brain.map((b) => Object.assign({}, b)), dizzy: S.dizzy.slice(), fy: S.fy.slice(), fvy: S.fvy.slice(),
    };
  };
  P.load = function (s) {
    if (!s) return;
    S.rs = s.rs; S.t = s.t; S.nid = s.nid; S.arena = s.arena; S.brk = s.brk || 0; S.mv = s.mv || 0;
    S.items = s.items.map((p) => Object.assign({}, p));
    S.shards = s.shards.map((d) => Object.assign({}, d));
    S.tasks = s.tasks.map((t) => (t ? Object.assign({}, t) : null));
    S.brain = s.brain.map((b) => Object.assign({}, b)); S.dizzy = s.dizzy.slice(); S.fy = s.fy.slice(); S.fvy = s.fvy.slice();
  };
  const F64 = new Float64Array(1), U32 = new Uint32Array(F64.buffer);
  P.hash = function () {
    let h0 = 0x811c9dc5 | 0, h1 = 0x9e3779b9 | 0;
    const w = (x) => { h0 = Math.imul(h0 ^ (x | 0), 16777619); h1 = Math.imul(h1 ^ (x | 0), 2246822519) ^ (h1 >>> 15); };
    const v = (x) => { if (typeof x === 'number') { F64[0] = x; w(U32[0]); w(U32[1]); } else if (typeof x === 'string') { for (let i = 0; i < x.length; i++) w(x.charCodeAt(i)); } else w(x === true ? 3 : x === false ? 4 : 5); };
    v(S.rs); v(S.t); v(S.items.length); v(S.shards.length); v(S.brk || 0); v(S.mv || 0);
    for (const p of S.items) for (const k of ITEM_KEYS) v(p[k]);
    for (const d of S.shards) for (const k of SHARD_KEYS) v(d[k]);
    for (const t of S.tasks) if (t) { v(t.act); v(t.pid); v(t.t); v(t.ph); }
    for (const b of S.brain) v(b.cd);
    v(S.dizzy[0]); v(S.dizzy[1]);
    return ((h0 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0'));
  };



  const V = (a) => 1 + (NM.random() * 2 - 1) * a;
  const SND = P.sfx = {
    wood(p, pan) {
      const k = V(0.1);
      au.noise({ type: 'highpass', f0: 2600 * k, dur: 0.014, gain: 1.1 * p, attack: 0.0006, send: 0.1, pan });
      au.noise({ type: 'bandpass', f0: 880 * k, q: 3.5, dur: 0.11, gain: 4.2 * p, attack: 0.001, send: 0.18, pan });
      au.noise({ type: 'bandpass', f0: 1900 * k, q: 5, dur: 0.06, gain: 3 * p, attack: 0.001, send: 0.12, pan });
      au.tone({ freq: 150 * k, freq1: 62, glide: 0.08, dur: 0.16, gain: 0.7 * p, attack: 0.002, send: 0.1, pan });

      if (!au.lite) for (let i = 0; i < 4; i++) au.noise({ type: 'highpass', f0: 3200 + NM.random() * 2500, dur: 0.012, gain: 0.5 * p * V(0.3), attack: 0.0006, send: 0.12, pan, delay: 0.02 + NM.random() * 0.14 });
    },
    ceramic(p, pan) {
      const k = V(0.08);
      au.noise({ type: 'highpass', f0: 3000 * k, dur: 0.02, gain: 1.3 * p, attack: 0.0005, send: 0.15, pan });
      au.noise({ type: 'bandpass', f0: 4400 * k, q: 1.6, dur: 0.2, gain: 1.4 * p, attack: 0.001, send: 0.25, pan });
      au.tone({ freq: 240 * k, freq1: 110, glide: 0.05, dur: 0.07, gain: 0.35 * p, attack: 0.001, send: 0.08, pan });

      const n = au.lite ? 4 : 8;
      for (let i = 0; i < n; i++) au.tone({ freq: 2400 + NM.random() * 3400, dur: 0.04 + NM.random() * 0.09, gain: (0.05 + NM.random() * 0.06) * p, type: 'sine', attack: 0.0008, send: 0.3, pan, delay: 0.015 + NM.random() * 0.32 });
    },
    splash(p, pan) {
      const k = V(0.1);
      au.noise({ type: 'bandpass', f0: 1500 * k, f1: 420, q: 0.8, dur: 0.32, gain: 1.1 * p, attack: 0.008, send: 0.2, pan });
      au.noise({ type: 'lowpass', f0: 650 * k, dur: 0.22, gain: 0.6 * p, attack: 0.01, send: 0.1, pan, delay: 0.03 });
      for (let i = 0; i < 3; i++) au.tone({ freq: 700 + NM.random() * 900, freq1: 1300 + NM.random() * 600, glide: 0.04, dur: 0.06, gain: 0.05 * p, type: 'sine', attack: 0.002, send: 0.2, pan, delay: 0.12 + NM.random() * 0.25 });
    },
    metal(p, pan) {
      au.clang(0.85 * p, pan, 0.42 * V(0.05));
      au.tone({ freq: 168 * V(0.04), dur: 1.4, gain: 0.16 * p, attack: 0.002, send: 0.5, pan });
      au.noise({ type: 'lowpass', f0: 700, dur: 0.2, gain: 0.6 * p, attack: 0.002, send: 0.2, pan });
    },
    straw(p, pan) {
      au.noise({ type: 'lowpass', f0: 1800 * V(0.15), dur: 0.26, gain: 1.2 * p, attack: 0.006, send: 0.12, pan });
      au.noise({ type: 'highpass', f0: 4200, dur: 0.18, gain: 0.25 * p, attack: 0.01, send: 0.1, pan, delay: 0.02 });
      au.tone({ freq: 120, freq1: 60, dur: 0.12, gain: 0.35 * p, attack: 0.003, send: 0.05, pan });
    },
    paper(p, pan) {
      au.noise({ type: 'bandpass', f0: 2600 * V(0.12), q: 1.4, dur: 0.14, gain: 1.1 * p, attack: 0.002, send: 0.18, pan });
      au.noise({ type: 'bandpass', f0: 1200 * V(0.12), q: 1, dur: 0.24, gain: 0.6 * p, attack: 0.01, send: 0.15, pan, delay: 0.03 });
      au.noise({ type: 'highpass', f0: 3600, dur: 0.012, gain: 0.7 * p, attack: 0.0006, send: 0.1, pan, delay: 0.08 });
    },
    knock(p, pan, mat) {
      if (mat === 'metal') { au.clang(0.35 * p, pan, 0.5); return; }
      if (mat === 'ceramic') { au.tone({ freq: 2100 * V(0.1), dur: 0.05, gain: 0.12 * p, type: 'sine', attack: 0.0008, send: 0.2, pan }); au.noise({ type: 'highpass', f0: 2500, dur: 0.012, gain: 0.5 * p, attack: 0.0006, send: 0.1, pan }); return; }
      au.noise({ type: 'bandpass', f0: (mat === 'straw' ? 500 : 1150) * V(0.1), q: mat === 'straw' ? 1 : 5, dur: 0.06, gain: 2.6 * p, attack: 0.001, send: 0.12, pan });
      au.tone({ freq: 130 * V(0.1), freq1: 70, dur: 0.09, gain: 0.35 * p, attack: 0.002, send: 0.08, pan });
    },
  };
  function snd(p, what, pw = 1) {
    if (!au || !au.ready || !pres()) return;
    const K = KINDS[p.k], pan = cam.pan(p.x), mat = K.mat;
    if (what === 'break') {
      SND[K._mat.snd](Math.min(1.4, pw), pan);
      if (K.liquid && p.q > 0.2) SND.splash(0.8 * Math.min(1.2, pw + 0.2), pan);
    } else if (what === 'land' || what === 'knock') SND.knock(pw, pan, mat);
    else if (what === 'kick') { SND.knock(1.2 * pw, pan, mat); au.thud(0.7, pan); }
    else if (what === 'grab') au.noise({ type: 'bandpass', f0: 900, q: 2, dur: 0.05, gain: 0.5 * pw, attack: 0.004, send: 0.1, pan });
    else if (what === 'whoosh') au.swoosh(0.45 * pw, pan);
    else if (what === 'metal') SND.metal(pw, pan);
  }
  P.snd = snd;



  const FXP = P.fxp = [];
  const fxCap = () => (ND.gfx && ND.gfx.tier === 'low' ? 60 : 150);
  const rnd2 = (a, b) => a + NM.random() * (b - a);
  function addFx(o) { FXP.push(o); if (FXP.length > fxCap()) FXP.splice(0, FXP.length - fxCap()); }
  const LIQ = { sake: ['236,226,196', 'rgba(150,140,110,.38)'], water: ['200,226,240', 'rgba(110,140,160,.34)'] };
  function splinters(x, y, dir, n) {
    for (let i = 0; i < n; i++) addFx({ k: 'sp', x, y, vx: dir * rnd2(60, 260) + rnd2(-80, 80), vy: rnd2(-320, -80), a: rnd2(0, 6.28), w: rnd2(-20, 20), l: rnd2(3, 7), life: rnd2(0.6, 1.2), max: 1.2 });
  }
  function breakFx(p, how, ix, iy, dx, dy) {
    const K = KINDS[p.k], g = G();
    snd(p, 'break', how === 'crush' ? 1.25 : how === 'cut' ? 0.8 : 1);
    if (K.mat === 'wood') { splinters(ix, iy, dx >= 0 ? 1 : -1, 7); fx.dust(p.x, Math.min(0, p.y + 10), 8, 0.9); }
    if (K.mat === 'ceramic') { for (let i = 0; i < 8; i++) addFx({ k: 'cr', x: ix, y: iy, vx: rnd2(-260, 260), vy: rnd2(-360, -60), r: rnd2(0.8, 1.8), life: rnd2(0.5, 1), max: 1 }); fx.dust(p.x, Math.min(0, p.y + 6), 4, 0.5); }
    if (K.mat === 'straw') for (let i = 0; i < 26; i++) addFx({ k: 'st', x: p.x + rnd2(-20, 20), y: p.y + rnd2(-15, 10), vx: rnd2(-260, 260) + p.vx * 0.3, vy: rnd2(-380, -60), a: rnd2(0, 6.28), w: rnd2(-14, 14), l: rnd2(6, 13), life: rnd2(1.2, 2.4), max: 2.4 });
    if (K.mat === 'paper') { for (let i = 0; i < 10; i++) addFx({ k: 'pp', x: p.x + rnd2(-10, 10), y: p.y + rnd2(-30, 10), vx: rnd2(-160, 160), vy: rnd2(-260, -40), a: rnd2(0, 6.28), w: rnd2(-10, 10), s: rnd2(3, 6), ph: rnd2(0, 6.28), life: rnd2(1.4, 2.4), max: 2.4 }); }
    if (K.light && p.lit > 0) {

      for (let i = 0; i < 12; i++) addFx({ k: 'em', x: p.x + rnd2(-8, 8), y: p.y - 10 + rnd2(-10, 10), vx: rnd2(-120, 120), vy: rnd2(-260, -40), life: rnd2(0.6, 1.4), max: 1.4 });
      addFx({ k: 'out', x: p.x, y: p.y - 12, life: 0.45, max: 0.45 });
    }
    if (K.liquid && p.q > 0.2) {
      const L = LIQ[K.liquid], n = K.m > 3 ? 34 : 18;
      for (let i = 0; i < n; i++) addFx({ k: 'lq', c: L[0], x: ix + rnd2(-6, 6), y: iy + rnd2(-6, 6), vx: rnd2(-1, 1) * rnd2(80, 340) + dx * 120 + p.vx * 0.3, vy: rnd2(-420, -80), r: rnd2(1.1, 2.6) * (K.m > 3 ? 1.3 : 1), life: 1.6, max: 1.6, st: L[1] });

      fx.decals.push({ x: p.x + rnd2(-6, 6), y: rnd2(2, 12), rx: K.m > 3 ? 46 : 22, ry: K.m > 3 ? 7 : 4, a: 0.5, c: L[1], fade: 7, age: 0 });
    }
    if (how === 'crush') fx.dust(ix, 0, 10, 1.4);
    if (how === 'cut') fx.flash(ix, iy, Math.atan2(dy, dx), 36, '255,250,235');
  }
  function shardTick(d, imp) {
    if (!au || !au.ready || NM.random() < 0.4) return;
    const pan = cam.pan(d.x), mat = d.sword ? 'metal' : KINDS[d.k].mat, p = Math.min(0.5, imp / 900);
    if (d.sword) { au.tick(pan); return; }
    SND.knock(p, pan, mat);
  }
  P.updateFx = function (dt) {
    for (let i = FXP.length - 1; i >= 0; i--) {
      const q = FXP[i];
      q.life -= dt;
      if (q.k === 'lq') {
        q.vy += 1500 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
        if (q.y > 2 && q.vy > 0) { if (NM.random() < 0.35) fx.decals.push({ x: q.x, y: rnd2(2, 18), rx: q.r * rnd2(2, 3.6), ry: q.r * 0.5, a: 0.4, c: q.st, fade: 5, age: 0 }); q.life = 0; }
      } else if (q.k === 'sp' || q.k === 'st' || q.k === 'cr') {
        q.vy += (q.k === 'st' ? 900 : 1600) * dt; q.vx *= 1 - (q.k === 'st' ? 2.2 : 0.4) * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.a != null) q.a += q.w * dt;
        if (q.y > 0) { q.y = 0; q.vy *= -0.25; q.vx *= 0.5; if (q.w) q.w *= 0.5; }
      } else if (q.k === 'pp') {
        q.vy += 300 * dt; q.vy *= 1 - 1.5 * dt; q.vx *= 1 - 1.4 * dt; q.ph += dt * 7; q.x += (q.vx + NM.sin(q.ph) * 30) * dt; q.y += q.vy * dt; q.a += q.w * dt;
        if (q.y > -1) { q.y = -1; q.vy = 0; q.vx *= 0.8; q.w *= 0.8; }
      } else if (q.k === 'em') { q.vy += 200 * dt; q.vx *= 1 - 1.5 * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
      if (q.life <= 0) FXP.splice(i, 1);
    }
  };


  P.flag = FLAG;
  if (FLAG) P.enable({ cpu: /[?&]esya=1/.test(qs) || /#.*esya/.test(qs) });
})(window.ND);
