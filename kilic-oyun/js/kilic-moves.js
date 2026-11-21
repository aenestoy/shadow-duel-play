


(function () {
'use strict';




















const LEN = { thigh: 46, shin: 46, ch: 38.4, nk: 17.6, head: 15, uArm: 30, fArm: 29, hd: 5.5, hipW: 7.5, shUp: 9.5, shW: 12.5, grip: 19, guard: 4, blade: 96 };
const D2R = Math.PI / 180;


const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const madd = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

const KNEE = 0.03;
const knee = (x) => (x <= -KNEE ? 0 : x >= KNEE ? x : (x + KNEE) * (x + KNEE) / (4 * KNEE));
const smooth01 = (v) => { const t = clamp(v, 0, 1); return t * t * (3 - 2 * t); };
const V = { add, sub, mul, madd, dot, cross, len, norm, lerp };
function slerp(a, b, t) {
  const c = clamp(dot(a, b), -1, 1), th = Math.acos(c);
  if (th < 1e-4) return norm(lerp(a, b, t));
  const s = Math.sin(th);
  return norm(add(mul(a, Math.sin((1 - t) * th) / s), mul(b, Math.sin(t * th) / s)));
}
function ik3(s, h, l1, l2, pole) {
  let d = sub(h, s), dist = len(d);
  const max = l1 + l2 - 0.01, reach = dist;
  if (dist > max) { h = add(s, mul(d, max / dist)); d = sub(h, s); dist = max; }
  dist = Math.max(dist, 1e-3);
  const u = mul(d, 1 / dist);
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let p = sub(pole, mul(u, dot(pole, u)));
  if (len(p) < 1e-4) p = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  p = norm(p);
  return { m: add(add(s, mul(u, a)), mul(p, hh)), e: h, reach };
}
const UP = [0, -1, 0];
const yawDir = (deg) => [Math.cos(deg * D2R), 0, Math.sin(deg * D2R)];
const rightOf = (f) => [-f[2], 0, f[0]];
function bladeDir(by, el) { const c = Math.cos(el * D2R); return [c * Math.cos(by * D2R), -Math.sin(el * D2R), c * Math.sin(by * D2R)]; }











const ZMAX = 0.55;
const CAM = 320;
const wrapA = (d) => Math.atan2(Math.sin(d), Math.cos(d));
const scrA = (u) => Math.atan2(u[1], u[0]);

function fromScr(a, z) { const zz = clamp(z, -0.999, 0.999), r = Math.sqrt(1 - zz * zz); return [r * Math.cos(a), r * Math.sin(a), zz]; }


function flatU(u, zmax = ZMAX) {
  if (Math.abs(u[2]) <= zmax) return u;
  const r = Math.hypot(u[0], u[1]);
  return fromScr(r > 1e-6 ? Math.atan2(u[1], u[0]) : -Math.PI / 2, Math.sign(u[2]) * zmax);
}


function drawnR(h, u, BL = LEN.blade, py = 0) {
  const s0 = CAM / (CAM - h[2]), t = madd(h, u, BL), s1 = CAM / (CAM - t[2]);
  return Math.hypot(t[0] * s1 - h[0] * s0, (t[1] + py) * s1 - (h[1] + py) * s0) / (BL * s0);
}

function flatDrawn(h, u, BL = LEN.blade, rmin = 0.82, py = 0) {
  if (drawnR(h, u, BL, py) >= rmin) return u;
  const a = Math.hypot(u[0], u[1]) > 1e-6 ? scrA(u) : -Math.PI / 2, sg = Math.sign(u[2]) || 1;
  let lo = 0, hi = Math.abs(u[2]);
  for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (drawnR(h, fromScr(a, sg * m), BL, py) >= rmin) lo = m; else hi = m; }
  return fromScr(a, sg * lo);
}






function floorU(h, u, BL = LEN.blade, lim = -8, rot = false) {
  if (h[1] + u[1] * BL <= lim || u[1] <= 1e-4) return u;
  const r = Math.hypot(u[0], u[1]), a = Math.atan2(u[1], u[0]), ny = clamp((lim - h[1]) / (BL * r), -1, 1);
  const aL = u[0] >= 0 ? Math.asin(ny) : Math.PI - Math.asin(ny), w = rot ? clamp(Math.abs(u[0] / r) / 0.5, 0, 1) : 0;
  let v = fromScr(a + (aL - a) * w, u[2]);
  if (h[1] + v[1] * BL > lim) {
    const r1 = Math.hypot(v[0], v[1]), r2 = clamp((lim - h[1]) / (BL * (v[1] / r1)), 0.05, r1), k = r2 / r1;
    v = [v[0] * k, v[1] * k, Math.sqrt(Math.max(0, 1 - r2 * r2)) * (u[2] < 0 ? -1 : 1)];
  }
  return v;
}

function blendU(u0, u1, w) {
  const a0 = scrA(u0), a1 = scrA(u1), z = u0[2] + (u1[2] - u0[2]) * w;
  return flatU(fromScr(a0 + wrapA(a1 - a0) * w, z));
}

function turnU(u0, u1, m) {
  const a0 = scrA(u0), d = wrapA(scrA(u1) - a0);
  if (Math.abs(d) <= m) return u1;
  const w = m / Math.abs(d);
  return flatU(fromScr(a0 + Math.sign(d) * m, u0[2] + (u1[2] - u0[2]) * w));
}



function swingD(by0, el0, by1, el1, sense) {
  const N = 32;
  let tot = 0, ga = null, gi = -1;
  for (let j = 0; j <= N; j++) {
    const u = bladeDir(by0 + (by1 - by0) * j / N, el0 + (el1 - el0) * j / N), r = Math.hypot(u[0], u[1]);
    if (r < 0.35 && j > 0 && j < N) continue;
    const a = r > 1e-6 ? Math.atan2(u[1], u[0]) : -Math.PI / 2;
    if (ga != null) {
      let d = wrapA(a - ga);
      if (j - gi > 1 && Math.abs(d) > Math.PI / 2) {

        const sg = Math.sign(tot) || Math.sign(sense) || 0;
        if (sg) { if (Math.sign(d) !== sg) d += sg * 2 * Math.PI; }
        else { const up = wrapA(-Math.PI / 2 - ga); const via = (dd) => (dd > 0 ? up > 0 && up < dd : up < 0 && up > dd); if (!via(d)) d += d > 0 ? -2 * Math.PI : 2 * Math.PI; }
      }
      tot += d;
    }
    ga = a; gi = j;
  }
  return tot;
}


const EASE = {
  lin: (u) => u,
  io: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u),
  in: (u) => u * u,
  in3: (u) => u * u * u,
  out: (u) => 1 - (1 - u) * (1 - u),
  out3: (u) => 1 - (1 - u) ** 3,
};




const FEET = { R: [24, 6], L: [-22, -6] };
const CHUDAN = { hip: [0, -80, 0], py: 14, cy: 22, lean: 6, nod: 4, R: [38, -104, 2], by: -2, el: 18, n: [0, 0, 1], pR: [-0.15, 1, 0.6], pL: [-0.15, 1, -0.6], lw: 1, d: 1,
  pitch: 0, L: [16, -96, -14], lf: 0, FR: [24, 0, 6], FL: [-22, 0, -6] };











const UPEL = { pR: [-1, -0.25, 0.3], pL: [-1, -0.25, -0.3] };
const pose = (o) => Object.assign({}, CHUDAN, o);
const at = (t, o, e = 'io') => Object.assign(pose(o), { t, e });




const yawK = (o, deg) => {
  const q = pose(o), c = Math.cos(deg * D2R), s = Math.sin(deg * D2R), r = (v) => [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c];
  return { ...q, hip: r(q.hip), R: r(q.R), pR: r(q.pR), pL: r(q.pL), n: r(q.n), L: r(q.L), FR: r(q.FR), FL: r(q.FL), py: q.py + deg, cy: q.cy + deg, by: q.by + deg };
};

const G_MID = { hip: [-2, -77.5, 0], py: 16, cy: 26, lean: 4, nod: 3, R: [36, -118, 8], by: 4, el: 62, pR: [-0.3, 0.8, 0.6], pL: [-0.2, 0.9, -0.5] };
const G_HI = { hip: [-3, -79, 0], py: 12, cy: 18, lean: 0, nod: -2, R: [2, -173, 5], by: 0, el: 184, ...UPEL };



const G_RISE = { hip: [-2, -79.5, 0], py: 22, cy: 26, lean: 2, nod: 0, R: [30, -158, 5], by: 0, el: 134, pR: [0.1, 0.6, -0.8], pL: [-0.6, -0.15, -0.8] };
const G_LOW = { hip: [-2, -75, 0], py: 16, cy: 24, lean: 7, nod: 8, R: [47, -96, 4], by: 6, el: -36, pR: [-0.2, 1, 0.5], pL: [-0.2, 1, -0.5] };






const LOCK = { hip: [-8, -71, 0], py: 12, cy: 18, lean: 16, nod: 2, R: [44, -110, 4], by: 0, el: 76, pR: [-0.3, 0.85, 0.5], pL: [-0.3, 0.85, -0.55] };
const LOCK_P = { ...LOCK, hip: [-4, -69.5, 0], py: 10, cy: 15, lean: 20, nod: 3, R: [48, -112, 4], el: 72 };
const BIND_D = { hip: [-6, -72, 0], py: 14, cy: 22, lean: 10, nod: 3, R: [42, -100, 6], by: 0, el: 62, pR: [-0.3, 0.8, 0.6], pL: [-0.3, 0.8, -0.5] };
const BIND_A = { hip: [-2, -74, 0], py: 10, cy: 16, lean: 16, nod: 5, R: [47, -114, 8], by: 0, el: 30, pR: [-0.3, 0.8, 0.6], pL: [-0.3, 0.8, -0.5] };



const STUCK_B = { hip: [-2, -75, 0], py: 12, cy: 18, lean: 8, nod: 5, R: [52, -104, 6], by: 0, el: -10, n: [0, 0.6, 0.8], pR: [-0.3, 0.8, 0.6], pL: [-0.3, 0.8, -0.5] };
const STUCK_T = { ...STUCK_B, hip: [-10, -74.5, 0], lean: -3, nod: 3, R: [32, -112, 6], el: -8 };
const POST_LOW = { hip: [-6, -56, 0], py: 14, cy: 22, lean: 28, nod: 10, R: [36, -64, 14], by: 0, el: -20, FR: [30, 0, 7] };



const K_UP1 = { hip: [-2, -80.5, 0.5], py: 18, cy: 30, lean: 3, nod: 3, R: [36, -148, 12], by: 30, el: 80, n: [0, 0.5, 0.87], pR: [-0.2, 0.9, 0.4], pL: [-0.3, 0.8, -0.5] };
const K_UP3 = { hip: [-3, -81.2, 1], py: 21, cy: 36, lean: 1, nod: 2, R: [2, -174, 24], by: 140, el: 55, n: [0, 0.6, 0.8], ...UPEL, pL: [0.6, 0.6, -0.4] };
const K_EAR = { hip: [-2.5, -81, 0.8], py: 20, cy: 34, lean: 2, nod: 2, R: [32, -155, 22], by: 95, el: 66, n: [0, 0.55, 0.84], pR: [-0.3, 0.3, 0.9], pL: [0.6, 0.6, -0.4] };
const K_TOP = { hip: [-4, -81.5, 1], py: 22, cy: 38, lean: 0, nod: 1, R: [-3, -182, 18], by: 158, el: 52, n: [0, 0.6, 0.8], ...UPEL, pL: [0.6, 0.6, -0.4] };
const IAI_OUT = { hip: [-4, -65, -1], py: 4, cy: 4, lean: 19, nod: 7, R: [40, -88, -6], by: -152, el: -8, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0 };



const IAI_FWD = { ...IAI_OUT, R: [46, -94, -16], by: -40, el: -4, n: [0, -1, 0] };
const IAI2 = { hip: [18, -64, 0], py: 14, cy: 30, lean: 24, nod: 9, R: [62, -100, 26], by: 60, el: 4, n: [0, -1, 0], lw: 0, pL: [-0.2, 0.9, -0.6], FR: [44, 0, 8], FL: [-34, 0, -7] };


const MW_DUCK = { hip: [4, -60, 0], py: 14, cy: 22, lean: 30, nod: 12, R: [40, -72, 28], by: 150, el: -16, n: [0, 1, 0], pR: [-0.5, 0.7, 0.6], pL: [0, 0.85, -0.6] };
const MW_TRAIL = { hip: [-2, -75, 1], py: 18, cy: 34, lean: 8, nod: 5, R: [16, -106, 32], by: 140, el: -6, n: [0, 1, 0], pR: [-0.5, 0.7, 0.6], pL: [0, 0.85, -0.6] };



const MW_DUCKB = { ...MW_DUCK, R: [6, -72, 26], pR: [-0.7, 0, 0.7] };




const MW_DUCKU = { ...MW_DUCKB, R: [8, -78, 30], by: 160, el: 30, pR: [-0.7, 0, 0.7] };
const MW_WAKI = { ...MW_TRAIL, R: [-6, -100, 30], by: 150, el: -10, pR: [-0.7, 0, 0.7] };
const MW_IN = { hip: [6, -74, 0], py: 4, cy: 18, lean: 8, nod: 5, R: [44, -108, 30], by: 80, el: 0, n: [0, 1, 0] };
const MW_MID = { hip: [12, -74, 0], py: -6, cy: 2, lean: 9, nod: 6, R: [70, -110, 8], by: 6, el: 2, n: [0, 1, 0] };
const MW_END = { hip: [14, -74, 0], py: -12, cy: -14, lean: 9, nod: 6, R: [64, -108, -16], by: -52, el: 0, n: [0, 1, 0] };
const LIE = { hip: [-15, -12, 0], pitch: 86, py: 22, cy: 30, lean: -2, nod: 10, w: 1, R: [-44, -4.5, 37], by: 16, el: 40, n: [0, 0, -1], pR: [-0.3, -0.6, 0.7], pL: [0, -0.6, -0.8], lf: 1, L: [-34, -3.5, -28], FR: [62, -3.5, 8], FL: [52, -3.5, -8] };



const MOVES = {
  idle: {
    name: 'Idle stance (breathing)', loop: true, feet: FEET,

    keys: [
      at(0, {}),
      at(1100, { hip: [0.6, -81.2, 0], lean: 7.2, cy: 23, R: [38.6, -105.4, 2], el: 16.8, nod: 4.6 }),
      at(2600, {}),
    ],
    phases: null,
  },









  overhead: {
    name: 'Overhead cut (shomen)', feet: FEET,
    steps: [{ foot: 'R', t0: 425, t1: 525, dx: 18, h: 7 }, { foot: 'R', t0: 720, t1: 880, dx: -18, h: 4 }],
    keys: [
      at(0, {}),

      at(120, { hip: [-4, -79.5, 0], py: 16, cy: 28, lean: 3, nod: 3, R: [44, -138, 4], by: 0, el: 60, pR: [-0.5, 0.45, 0.75], pL: [-0.5, 0.45, -0.75] }, 'io'),
      at(190, { hip: [-7, -79.2, 0], py: 17, cy: 33, lean: 1, nod: 2, R: [28, -163, 4], by: 0, el: 98, pR: [-0.2, 0.9, 0.4], pL: [-0.6, 0.3, -0.75] }, 'io'),
      at(240, { hip: [-8, -79.2, 0], py: 18, cy: 36, lean: 0, nod: 1, R: [16, -170, 3], by: 0, el: 112, pR: [-0.3, 0.3, 0.9], pL: [-0.8, 0, -0.6] }, 'io'),


      at(330, { hip: [-9.5, -79, 0], py: 20, cy: 40, lean: -3, nod: 0, R: [-7, -178, 3], by: 0, el: 124, ...UPEL }, 'out'),
      at(395, { hip: [-10, -78.9, 0], py: 20, cy: 41, lean: -4, nod: 0, R: [-8, -178, 3], by: 0, el: 126, ...UPEL }, 'io'),

      at(450, { hip: [3, -77.5, 0], py: 11, cy: 32, lean: 1, nod: 1, R: [6, -180, 3], by: 0, el: 136, ...UPEL }, 'io'),
      at(495, { hip: [8, -77, 0], py: 4, cy: 15, lean: 3, nod: 3, R: [42, -165, 3], by: 0, el: 86, pR: [-0.3, 0.4, 0.85], pL: [-0.5, 0.2, -0.85] }, 'in'),

      at(530, { hip: [18, -74, 0], py: 0, cy: 2, lean: 7, nod: 6, R: [75, -141, 2], by: 0, el: -17 }, 'lin'),

      at(600, { hip: [27, -69, 0], py: -4, cy: -4, lean: 18, nod: 9, R: [82, -102, 3], by: 0, el: -22 }, 'out'),
      at(690, { hip: [26.5, -69.5, 0], py: -3, cy: -3, lean: 17, nod: 9, R: [81, -104, 3], by: 0, el: -19 }, 'io'),

      at(860, { hip: [8, -77, 0], py: 10, cy: 15, lean: 7, nod: 5, R: [52, -110, 2], by: -1, el: 10 }, 'io'),
      at(1010, {}, 'io'),
    ],
    phases: { windup: [0, 495], active: [495, 610], recovery: [610, 1010] },
    kp: [['anticipation', 360], ['contact', 530], ['follow-through', 640], ['recovery', 1010]],
  },
  horizontal: {
    name: 'Horizontal cut (yoko, from the right)', feet: FEET,
    steps: [{ foot: 'R', t0: 360, t1: 450, dx: 16, h: 6 }, { foot: 'R', t0: 640, t1: 800, dx: -16, h: 4 }],
    keys: [
      at(0, {}),


      at(150, { hip: [-4, -79.5, 1], py: 22, cy: 36, lean: 4, nod: 3, R: [18, -104, 24], by: 130, el: -6, n: [0, 0.55, 0.84] }, 'io'),
      at(250, { hip: [-9, -78.5, 2], py: 34, cy: 54, lean: 3, nod: 3, R: [0, -106, 32], by: 174, el: 4, n: [0, 0.6, 0.8] }, 'out'),
      at(330, { hip: [-9.5, -78.5, 2], py: 33, cy: 55, lean: 3, nod: 3, R: [-1, -106, 32], by: 176, el: 5, n: [0, 0.6, 0.8] }, 'io'),

      at(385, { hip: [3, -77.5, 1], py: 14, cy: 40, lean: 6, nod: 4, R: [12, -108, 34], by: 150, el: 0, n: [0, 1, 0] }, 'io'),
      at(425, { hip: [14, -75, 0], py: 2, cy: 18, lean: 9, nod: 5, R: [44, -110, 30], by: 80, el: 0, n: [0, 1, 0] }, 'in'),
      at(460, { hip: [22, -72, 0], py: -6, cy: 0, lean: 12, nod: 6, R: [72, -112, 8], by: 6, el: 2, n: [0, 1, 0] }, 'lin'),

      at(520, { hip: [25, -70.5, 0], py: -16, cy: -20, lean: 14, nod: 7, R: [66, -108, -18], by: -58, el: 0, n: [0, 1, 0] }, 'out'),
      at(590, { hip: [24.5, -71, 0], py: -15, cy: -19, lean: 13, nod: 7, R: [64, -108, -17], by: -55, el: 2, n: [0, 1, 0] }, 'io'),
      at(770, { hip: [8, -77, 0], py: 4, cy: 9, lean: 7, nod: 5, R: [52, -108, -4], by: -22, el: 10, n: [0, 0.6, 0.8] }, 'io'),
      at(930, {}, 'io'),
    ],
    phases: { windup: [0, 415], active: [415, 520], recovery: [520, 930] },
    kp: [['anticipation', 290], ['contact', 460], ['follow-through', 545], ['recovery', 930]],
  },
  diagonal: {
    name: 'Diagonal cut (kesa-giri)', feet: FEET,
    keys: [
      at(0, {}),

      at(170, { hip: [-3, -81, 1], py: 22, cy: 32, lean: 2, nod: 2, R: [34, -150, 16], by: 30, el: 80, n: [0, 0.5, 0.87], pR: [-0.2, 0.9, 0.4], pL: [-0.3, 0.8, -0.5] }, 'io'),

      at(212, { hip: [-4, -81.5, 1], py: 23, cy: 36, lean: 1, nod: 2, R: [20, -166, 18], by: 95, el: 66, n: [0, 0.55, 0.84], pR: [-0.3, 0.3, 0.9], pL: [0.6, 0.6, -0.4] }, 'io'),
      at(255, { hip: [-5, -82, 1], py: 24, cy: 39, lean: 0, nod: 1, R: [4, -178, 18], by: 150, el: 56, n: [0, 0.6, 0.8], ...UPEL, pL: [0.6, 0.6, -0.4] }, 'io'),

      at(330, { hip: [-6, -82, 1], py: 24, cy: 41, lean: 0, nod: 1, R: [-4, -181, 18], by: 165, el: 52, n: [0, 0.6, 0.8], ...UPEL, pL: [0.6, 0.6, -0.4] }, 'out'),
      at(410, { hip: [1, -81, 1], py: 16, cy: 36, lean: 2, nod: 2, R: [2, -182, 20], by: 165, el: 48, n: [0, 0.6, 0.8], ...UPEL, pL: [0.6, 0.6, -0.4] }, 'io'),
      at(470, { hip: [10, -78, 0], py: 6, cy: 18, lean: 4, nod: 4, R: [50, -160, 24], by: 35, el: 40, n: [0, 0.6, 0.8], pR: [-0.3, 0.4, 0.85], pL: [0.2, 0.8, -0.6] }, 'in'),

      at(520, { hip: [17, -76, 0], py: -2, cy: 2, lean: 7, nod: 6, R: [70, -128, 4], by: -14, el: -22, n: [0, 0.6, 0.8] }, 'lin'),

      at(585, { hip: [19, -73, 0], py: -10, cy: -10, lean: 11, nod: 7, R: [62, -94, -10], by: -48, el: -46, n: [0, 0.6, 0.8] }, 'out'),
      at(645, { hip: [18.5, -73.5, 0], py: -9, cy: -9, lean: 10.5, nod: 7, R: [60, -96, -10], by: -47, el: -40, n: [0, 0.6, 0.8] }, 'io'),

      at(815, { hip: [8, -78, 0], py: 5, cy: 9, lean: 7, nod: 5, R: [50, -106, -4], by: -18, el: 5, n: [0, 0.4, 0.92] }, 'io'),
      at(995, {}, 'io'),
    ],
    phases: { windup: [0, 470], active: [470, 585], recovery: [585, 995] },
  },
  thrust: {
    name: 'Thrust (tsuki)', feet: FEET,

    steps: [{ foot: 'R', t0: 300, t1: 390, dx: 24, h: 7 }, { foot: 'R', t0: 520, t1: 660, dx: -24, h: 5 }],
    keys: [
      at(0, {}),


      at(200, { hip: [-11, -75, 0], py: 16, cy: 18, lean: 2, nod: 5, R: [24, -100, 2], by: -1, el: 8 }, 'io'),
      at(290, { hip: [-12, -74.5, 0], py: 16, cy: 18, lean: 2, nod: 5, R: [23, -100, 2], by: -1, el: 7 }, 'out'),

      at(335, { hip: [6, -74, 0], py: 8, cy: 6, lean: 7, nod: 6, R: [52, -112, 2], by: 0, el: 3 }, 'in'),
      at(390, { hip: [29, -71, 0], py: 0, cy: -2, lean: 12, nod: 8, R: [88, -125, 2], by: 0, el: 1 }, 'lin'),

      at(435, { hip: [30, -70.5, 0], py: -1, cy: -2, lean: 12.5, nod: 8, R: [90, -125.5, 2], by: 0, el: 0.5 }, 'out'),
      at(490, { hip: [29.5, -70.7, 0], py: -1, cy: -1, lean: 12, nod: 8, R: [88, -124.5, 2], by: 0, el: 1 }, 'io'),

      at(660, { hip: [6, -78, 0], py: 10, cy: 14, lean: 7, nod: 5, R: [54, -112, 2], by: -1, el: 10 }, 'io'),
      at(840, {}, 'io'),
    ],
    phases: { windup: [0, 335], active: [335, 435], recovery: [435, 840] },
    kp: [['anticipation', 260], ['contact', 390], ['follow-through', 460], ['recovery', 840]],
  },
  block: {
    name: 'Block (overhead, against a cut to the head)', feet: FEET,
    keys: [
      at(0, {}),


      at(75, G_RISE, 'io'),
      at(150, { hip: [-3, -79, 0], py: 12, cy: 18, lean: 0, nod: -2, R: [2, -173, 5], by: 0, el: 184, ...UPEL }, 'out'),
      at(260, { hip: [-3.5, -79, 0], py: 12, cy: 18, lean: 0, nod: -2, R: [2, -173.5, 5], by: 0, el: 184, ...UPEL }, 'io'),

      at(300, { hip: [-6, -75, 0], py: 12, cy: 17, lean: -1, nod: 0, R: [1, -167, 5], by: 0, el: 189, ...UPEL }, 'out3'),
      at(380, { hip: [-5, -76.5, 0], py: 12, cy: 17, lean: 0, nod: -1, R: [2, -170, 5], by: 0, el: 187, ...UPEL }, 'io'),


      at(460, { ...G_RISE, hip: [-1, -77.5, 0], nod: 1 }, 'io'),
      at(600, { hip: [2, -79, 0], py: 13, cy: 21, lean: 5, nod: 3, R: [44, -114, 3], by: -1, el: 26, pR: [-0.2, 0.8, 0.6], pL: [-0.2, 0.9, -0.6] }, 'io'),
      at(780, {}, 'io'),
    ],
    phases: { windup: [0, 150], active: [260, 380], recovery: [380, 780] },
    impact: 300,
  },





  kesaS: {
    name: 'Light kesa (from the right shoulder)', feet: FEET,
    steps: [{ foot: 'R', t0: 205, t1: 272, dx: 16, h: 6 }, { foot: 'R', t0: 420, t1: 560, dx: -16, h: 4 }],
    keys: [
      at(0, {}),

      at(85, K_UP1, 'io'),
      at(112, K_EAR, 'io'),
      at(142, { ...K_UP3, hip: [-6, -80, 1], py: 23, cy: 39, lean: 0 }, 'io'),


      at(172, { ...K_TOP, hip: [-8, -79.5, 1], py: 25, cy: 43, lean: -2, R: [2, -161, 22], by: 168, el: 44 }, 'out'),
      at(200, { ...K_TOP, hip: [-8, -79.5, 1], py: 25, cy: 43, lean: -1.5, R: [1, -161, 22], by: 169, el: 45 }, 'io'),

      at(243, { hip: [11, -76, 0], py: 4, cy: 14, lean: 5, nod: 3, R: [50, -160, 22], by: 35, el: 36, n: [0, 0.6, 0.8], pR: [-0.3, 0.4, 0.85], pL: [0.2, 0.8, -0.6] }, 'in'),
      at(272, { hip: [20, -73, 0], py: -4, cy: -2, lean: 10, nod: 6, R: [71, -128, 6], by: -16, el: -42, n: [0, 0.6, 0.8] }, 'lin'),


      at(292, { hip: [23, -71.5, 0], py: -8, cy: -8, lean: 14, nod: 7, R: [66, -118, -30], by: -110, el: -60, n: [0, 0.6, 0.8] }, 'lin'),
      at(320, { hip: [25, -70, 0], py: -12, cy: -14, lean: 18, nod: 8, R: [52, -94, -30], by: -145, el: -12, n: [0, 0.6, 0.8] }, 'out'),
      at(365, { hip: [24.5, -70.5, 0], py: -11, cy: -13, lean: 17, nod: 8, R: [52, -96, -30], by: -147, el: -10, n: [0, 0.6, 0.8] }, 'io'),

      at(430, { hip: [18, -73, 0], py: -4, cy: -4, lean: 13, nod: 7, R: [62, -132, -30], by: -100, el: -70, n: [0, 0.6, 0.8] }, 'lin'),
      at(530, { hip: [8, -77, 0], py: 6, cy: 10, lean: 8, nod: 5, R: [50, -106, -3], by: -18, el: 6, n: [0, 0.4, 0.92] }, 'io'),
      at(700, {}, 'io'),
    ],
    phases: { windup: [0, 235], active: [235, 320], recovery: [320, 700] },
    kp: [['anticipation', 190], ['contact', 272], ['follow-through', 340], ['recovery', 700]],
    bzFar: [200, 272],
  },
  gyakuS: {
    name: 'Light gyaku-kesa (from the left shoulder)', feet: FEET,
    steps: [{ foot: 'R', t0: 210, t1: 277, dx: 16, h: 6 }, { foot: 'R', t0: 425, t1: 565, dx: -16, h: 4 }],
    keys: [
      at(0, {}),

      at(75, { hip: [-3, -80, -0.5], py: 10, cy: 14, lean: 2, nod: 3, R: [32, -150, 0], by: -30, el: 80, n: [0, -0.5, 0.87], pR: [-0.3, 0.4, 0.85], pL: [-0.1, 0.35, -0.9] }, 'io'),
      at(105, { hip: [-5, -79.8, -0.8], py: 8, cy: 10, lean: 1, nod: 2, R: [22, -167, -2], by: -75, el: 72, n: [0, -0.55, 0.84], pR: [-0.3, 0.6, 0.75], pL: [0.2, -0.1, -0.9] }, 'io'),
      at(135, { hip: [-7, -79.4, -1], py: 4, cy: 4, lean: 0, nod: 1, R: [10, -179, -3], by: -125, el: 60, n: [0, -0.6, 0.8], ...UPEL, pL: [-0.75, -0.2, -0.65] }, 'io'),


      at(165, { hip: [-9, -79, -1], py: 0, cy: -2, lean: -2, nod: 1, R: [2, -161, -6], by: -165, el: 44, n: [0, -0.6, 0.8], ...UPEL, pL: [-0.75, -0.2, -0.65] }, 'out'),
      at(200, { hip: [-8.5, -79, -1], py: 1, cy: -1, lean: -1.5, nod: 1, R: [1, -161, -6], by: -166, el: 45, n: [0, -0.6, 0.8], ...UPEL, pL: [-0.75, -0.2, -0.65] }, 'io'),

      at(228, { hip: [5, -77.5, 0], py: 6, cy: 6, lean: 3, nod: 2, R: [28, -164, -3], by: -120, el: 36, n: [0, -0.6, 0.8], pR: [-0.55, 0.15, 0.85], pL: [-0.65, 0, -0.8] }, 'io'),
      at(252, { hip: [12, -75.5, 0], py: 10, cy: 14, lean: 6, nod: 3, R: [50, -157, -3], by: -30, el: 30, n: [0, -0.6, 0.8], pR: [-0.25, 0.6, 0.75], pL: [-0.4, 0.5, -0.8] }, 'in'),
      at(275, { hip: [22, -72, 0], py: 14, cy: 22, lean: 13, nod: 6, R: [70, -129, 4], by: 16, el: -36, n: [0, -0.6, 0.8], pL: [-0.3, 0.7, -0.65] }, 'lin'),


      at(325, { hip: [25, -70, 0], py: 22, cy: 32, lean: 18, nod: 8, R: [64, -93, 20], by: 46, el: -48, n: [0, -0.75, 0.66] }, 'out'),
      at(370, { hip: [24.5, -70.5, 0], py: 21, cy: 31, lean: 17, nod: 8, R: [64, -95, 20], by: 45, el: -45, n: [0, -0.75, 0.66] }, 'io'),
      at(540, { hip: [8, -77, 0], py: 15, cy: 21, lean: 7, nod: 5, R: [52, -106, 8], by: 18, el: 6, n: [0, -0.3, 0.95] }, 'io'),
      at(720, {}, 'io'),
    ],
    phases: { windup: [0, 240], active: [240, 325], recovery: [325, 720] },
    kp: [['anticipation', 185], ['contact', 275], ['follow-through', 345], ['recovery', 720]],
  },
  menS: {
    name: 'Light men (small cut to the head)', feet: FEET,
    steps: [{ foot: 'R', t0: 180, t1: 248, dx: 16, h: 6 }, { foot: 'R', t0: 400, t1: 540, dx: -16, h: 4 }],
    keys: [
      at(0, {}),

      at(70, { hip: [-3, -80, 0], py: 15, cy: 28, lean: 3, nod: 3, R: [42, -142, 4], by: 0, el: 66, pR: [-0.5, 0.45, 0.75], pL: [-0.5, 0.45, -0.75] }, 'io'),
      at(120, { hip: [-6, -79.5, 0], py: 16, cy: 34, lean: 1, nod: 1, R: [30, -164, 4], by: 0, el: 104, pR: [-0.2, 0.9, 0.4], pL: [-0.6, 0.3, -0.75] }, 'io'),
      at(150, { hip: [-6, -79.3, 0], py: 16, cy: 36, lean: -1, nod: 1, R: [28, -164, 4], by: 0, el: 116, pR: [-0.3, 0.3, 0.9], pL: [-0.8, 0, -0.6] }, 'out'),
      at(180, { hip: [-5.5, -79.3, 0], py: 16, cy: 36, lean: -1, nod: 1, R: [27, -164, 4], by: 0, el: 117, pR: [-0.3, 0.3, 0.9], pL: [-0.8, 0, -0.6] }, 'io'),

      at(208, { hip: [5, -78, 0], py: 6, cy: 17, lean: 2, nod: 3, R: [45, -160, 3], by: 0, el: 80, pR: [-0.3, 0.4, 0.85], pL: [-0.5, 0.2, -0.85] }, 'in'),
      at(245, { hip: [15, -75, 0], py: 0, cy: 2, lean: 6, nod: 6, R: [72, -138, 2], by: 0, el: -9 }, 'lin'),

      at(300, { hip: [24, -70, 0], py: -3, cy: -2, lean: 17, nod: 8, R: [80, -104, 2], by: 0, el: -22 }, 'out'),
      at(345, { hip: [23.5, -70.5, 0], py: -2, cy: -1, lean: 16, nod: 8, R: [79, -106, 2], by: 0, el: -19 }, 'io'),
      at(520, { hip: [7, -78, 0], py: 9, cy: 14, lean: 6, nod: 5, R: [54, -113, 2], by: -1, el: 9 }, 'io'),
      at(680, {}, 'io'),
    ],
    phases: { windup: [0, 205], active: [205, 300], recovery: [300, 680] },
    kp: [['anticipation', 165], ['contact', 245], ['follow-through', 320], ['recovery', 680]],
  },
  yokoL: {
    name: 'Light yoko (from the left, backhand)', feet: FEET,
    steps: [{ foot: 'R', t0: 220, t1: 285, dx: 16, h: 6 }, { foot: 'R', t0: 430, t1: 570, dx: -16, h: 4 }],
    keys: [
      at(0, {}),


      at(90, { hip: [-4, -79.5, -1], py: 6, cy: 6, lean: 4, nod: 3, R: [24, -104, -14], by: -110, el: -2, n: [0, -0.55, 0.84], pR: [-0.2, 0.8, 0.6], pL: [-0.4, 0.7, -0.6] }, 'io'),
      at(150, { hip: [-8, -78.5, -2], py: -4, cy: -8, lean: 5, nod: 3, R: [6, -103, -26], by: -168, el: 6, n: [0, -0.6, 0.8] }, 'out'),
      at(215, { hip: [-8.5, -78.5, -2], py: -5, cy: -9, lean: 5, nod: 3, R: [5, -103, -26], by: -170, el: 7, n: [0, -0.6, 0.8] }, 'io'),

      at(235, { hip: [4, -77.5, -1], py: 2, cy: 0, lean: 6, nod: 4, R: [18, -106, -28], by: -140, el: 0, n: [0, -1, 0] }, 'io'),
      at(255, { hip: [14, -75, 0], py: 6, cy: 6, lean: 9, nod: 5, R: [52, -110, -22], by: -30, el: 0, n: [0, -1, 0] }, 'in'),
      at(280, { hip: [22, -72, 0], py: 10, cy: 12, lean: 12, nod: 6, R: [70, -112, -2], by: 0, el: 2, n: [0, -1, 0] }, 'lin'),

      at(335, { hip: [25, -70.5, 0], py: 22, cy: 36, lean: 14, nod: 7, R: [62, -108, 24], by: 62, el: 0, n: [0, -1, 0] }, 'out'),
      at(380, { hip: [24.5, -71, 0], py: 21, cy: 35, lean: 13, nod: 7, R: [61, -108, 23], by: 60, el: 2, n: [0, -1, 0] }, 'io'),
      at(540, { hip: [8, -77, 0], py: 15, cy: 22, lean: 7, nod: 5, R: [52, -108, 10], by: 22, el: 10, n: [0, -0.4, 0.92] }, 'io'),
      at(700, {}, 'io'),
    ],
    phases: { windup: [0, 250], active: [250, 335], recovery: [335, 700] },
    kp: [['anticipation', 185], ['contact', 280], ['follow-through', 355], ['recovery', 700]],
  },
  tsukiS: {
    name: 'Light thrust (tsuki, quick)', feet: FEET,
    steps: [{ foot: 'R', t0: 150, t1: 215, dx: 22, h: 6 }, { foot: 'R', t0: 330, t1: 450, dx: -22, h: 4 }],
    keys: [
      at(0, {}),

      at(100, { hip: [-10, -75.5, 0], py: 16, cy: 18, lean: 2, nod: 5, R: [25, -100, 2], by: -1, el: 8 }, 'io'),
      at(150, { hip: [-11, -75, 0], py: 16, cy: 18, lean: 2, nod: 5, R: [24, -100, 2], by: -1, el: 7 }, 'out'),

      at(180, { hip: [6, -74, 0], py: 8, cy: 6, lean: 7, nod: 6, R: [52, -112, 2], by: 0, el: 3 }, 'in'),
      at(215, { hip: [26, -71.5, 0], py: 0, cy: -2, lean: 12, nod: 8, R: [86, -124, 2], by: 0, el: 1 }, 'lin'),
      at(250, { hip: [27, -71, 0], py: -1, cy: -2, lean: 12.5, nod: 8, R: [88, -124.5, 2], by: 0, el: 0.5 }, 'out'),
      at(290, { hip: [26.5, -71.2, 0], py: -1, cy: -1, lean: 12, nod: 8, R: [86, -123.5, 2], by: 0, el: 1 }, 'io'),
      at(440, { hip: [6, -78, 0], py: 10, cy: 14, lean: 7, nod: 5, R: [54, -112, 2], by: -1, el: 10 }, 'io'),
      at(580, {}, 'io'),
    ],
    phases: { windup: [0, 180], active: [180, 255], recovery: [255, 580] },
    kp: [['anticipation', 150], ['contact', 215], ['follow-through', 270], ['recovery', 580]],
  },



  guardMid: {
    name: 'Guard (middle: blade upright in front)', feet: FEET, hold: 1,
    keys: [
      at(0, {}),
      at(120, G_MID, 'out'),
      at(420, G_MID, 'io'),
      at(600, {}, 'io'),
    ],
    phases: null,
  },
  guardHi: {
    name: 'Guard (high: the roof over the head)', feet: FEET, hold: 2,
    keys: [
      at(0, {}),
      at(75, G_RISE, 'io'),
      at(150, G_HI, 'out'),
      at(450, G_HI, 'io'),
      at(530, { ...G_RISE, hip: [-1, -77.5, 0], nod: 1 }, 'io'),
      at(670, { hip: [2, -79, 0], py: 13, cy: 21, lean: 5, nod: 3, R: [44, -114, 3], by: -1, el: 26, pR: [-0.2, 0.8, 0.6], pL: [-0.2, 0.9, -0.6] }, 'io'),
      at(850, {}, 'io'),
    ],
    phases: null,
  },
  guardLow: {
    name: 'Guard (low: tip down across the legs)', feet: FEET, hold: 1,
    keys: [
      at(0, {}),
      at(120, G_LOW, 'out'),
      at(420, G_LOW, 'io'),
      at(600, {}, 'io'),
    ],
    phases: null,
  },

  blockMid: {
    name: 'Block (middle)', feet: FEET,
    keys: [
      at(0, G_MID),
      at(45, { ...G_MID, hip: [-6, -74.5, 0], py: 17, cy: 28, lean: 2, nod: 2, R: [30, -115, 9], by: 6, el: 67 }, 'out3'),
      at(130, { ...G_MID, hip: [-4.5, -76, 0], py: 16.5, cy: 27, lean: 3, R: [34, -117, 8], by: 5, el: 63 }, 'io'),
      at(260, G_MID, 'io'),
    ],
    phases: null, impact: 45,
  },
  blockHi: {
    name: 'Block (high)', feet: FEET,
    keys: [
      at(0, G_HI),
      at(45, { ...G_HI, hip: [-6, -75, 0], cy: 17, lean: -1, nod: 0, R: [1, -167, 5], el: 189 }, 'out3'),
      at(130, { ...G_HI, hip: [-5, -76.5, 0], cy: 17, nod: -1, R: [2, -170, 5], el: 187 }, 'io'),
      at(260, G_HI, 'io'),
    ],
    phases: null, impact: 45,
  },
  blockLow: {
    name: 'Block (low)', feet: FEET,
    keys: [
      at(0, G_LOW),
      at(45, { ...G_LOW, hip: [-6, -72.5, 0], py: 17, cy: 26, lean: 8, nod: 7, R: [43, -98, 5], by: 8, el: -30 }, 'out3'),
      at(130, { ...G_LOW, hip: [-4.5, -74, 0], py: 16.5, cy: 25, lean: 8.5, R: [45, -97, 4], by: 7, el: -34 }, 'io'),
      at(260, G_LOW, 'io'),
    ],
    phases: null, impact: 45,
  },




  hurtHi: {
    name: 'Hit high (cut to the head / shoulder)', feet: FEET, tail: 3,
    keys: [
      at(0, {}),

      at(70, { hip: [-8, -79, 0], py: 20, cy: 34, lean: -10, nod: -12, R: [26, -122, 8], by: -10, el: 48, pR: [-0.3, 0.7, 0.7], pL: [-0.3, 0.8, -0.6] }, 'out3'),
      at(170, { hip: [-10, -77, 0], py: 22, cy: 36, lean: -6, nod: -6, R: [24, -116, 8], by: -8, el: 40, pR: [-0.3, 0.7, 0.7], pL: [-0.3, 0.8, -0.6] }, 'io'),

      at(280, { hip: [-4, -79, 0], py: 16, cy: 26, lean: 3, nod: 2, R: [34, -108, 4], by: -2, el: 22 }, 'io'),
      at(400, {}, 'io'),
    ],
    phases: null,
  },
  hurtBody: {
    name: 'Hit to the body (folds)', feet: FEET, tail: 3,
    keys: [
      at(0, {}),

      at(70, { hip: [-7, -75, 0], py: 18, cy: 28, lean: 16, nod: 14, R: [40, -94, 6], by: 4, el: -4, pR: [-0.2, 1, 0.5], pL: [-0.2, 1, -0.5] }, 'out3'),
      at(170, { hip: [-9, -74, 0], py: 19, cy: 29, lean: 13, nod: 10, R: [38, -96, 6], by: 3, el: 2, pR: [-0.2, 1, 0.5], pL: [-0.2, 1, -0.5] }, 'io'),
      at(280, { hip: [-4, -78, 0], py: 16, cy: 25, lean: 8, nod: 5, R: [35, -103, 4], by: -1, el: 14 }, 'io'),
      at(400, {}, 'io'),
    ],
    phases: null,
  },
  stagger: {
    name: 'Stagger (rocked back, guard open)', feet: FEET, tail: 3,
    keys: [
      at(0, {}),
      at(90, { hip: [-12, -78, 0], py: 24, cy: 40, lean: -12, nod: -12, R: [18, -134, 10], by: -14, el: 64, pR: [-0.4, 0.5, 0.8], pL: [-0.4, 0.6, -0.7] }, 'out3'),
      at(240, { hip: [-13, -76, 0], py: 25, cy: 41, lean: -8, nod: -8, R: [18, -128, 10], by: -12, el: 56, pR: [-0.4, 0.5, 0.8], pL: [-0.4, 0.6, -0.7] }, 'io'),
      at(400, { hip: [-5, -79, 0], py: 17, cy: 27, lean: 2, nod: 2, R: [32, -110, 5], by: -3, el: 26 }, 'io'),
      at(560, {}, 'io'),
    ],
    phases: null,
  },



  zanshin: {
    name: 'Zanshin (flick, point on him, back to guard)', feet: FEET,
    keys: [
      at(0, {}),
      at(110, { hip: [2, -76.5, 0], py: 10, cy: 16, lean: 8, nod: 7, R: [50, -104, 6], by: 4, el: -16, pR: [-0.2, 1, 0.5], pL: [-0.2, 1, -0.5] }, 'out3'),
      at(420, { hip: [1.5, -76.8, 0], py: 10.5, cy: 17, lean: 7.5, nod: 6.5, R: [49, -105, 6], by: 3, el: -12, pR: [-0.2, 1, 0.5], pL: [-0.2, 1, -0.5] }, 'io'),
      at(760, { hip: [0, -79, 0], py: 13, cy: 20, lean: 6, nod: 4, R: [40, -106, 3], by: -1, el: 12 }, 'io'),
      at(980, {}, 'io'),
    ],
    phases: null,
  },
  recoil: {
    name: 'Recoil (the cut is blocked, the blade bounces)', feet: FEET, tail: 3,
    keys: [
      at(0, { hip: [15, -76.5, 0], py: 0, cy: 4, lean: 7, nod: 6, R: [66, -130, 3], by: -6, el: -8 }),

      at(60, { hip: [4, -78.5, 0], py: 14, cy: 26, lean: 1, nod: 1, R: [42, -138, 6], by: -4, el: 70, pR: [-0.4, 0.6, 0.7], pL: [-0.4, 0.6, -0.7] }, 'out3'),
      at(140, { hip: [1, -79, 0], py: 15, cy: 26, lean: 2, nod: 2, R: [42, -134, 6], by: -4, el: 64, pR: [-0.4, 0.6, 0.7], pL: [-0.4, 0.6, -0.7] }, 'io'),
      at(240, { hip: [1, -79.5, 0], py: 14, cy: 23, lean: 5, nod: 4, R: [38, -112, 4], by: -3, el: 30 }, 'io'),
      at(340, {}, 'io'),
    ],
    phases: null,
  },








  walkF: {
    name: 'Walk forward (sword on the line)', loop: true, gait: { kind: 'walk', S: 120 }, feet: FEET,
    keys: [
      at(0, { hip: [0, -75.6, 0], py: 12, cy: 22, lean: 9, nod: 4.5, R: [40, -101, 2], el: 18 }),
      at(175, { hip: [0, -79.8, 2], py: 20, cy: 24, lean: 7.5, nod: 3.5, R: [40, -104.5, 2], el: 16.5 }),
      at(350, { hip: [0, -75.6, 0], py: 30, cy: 26, lean: 9, nod: 4.5, R: [40, -101, 1], el: 18 }),
      at(525, { hip: [0, -79.8, -2], py: 20, cy: 24, lean: 7.5, nod: 3.5, R: [40, -104.5, 2], el: 16.5 }),
      at(700, { hip: [0, -75.6, 0], py: 12, cy: 22, lean: 9, nod: 4.5, R: [40, -101, 2], el: 18 }),
    ],
    phases: null,
  },

  walkB: {
    name: 'Step back (sword on the line)', loop: true, gait: { kind: 'walk', S: -100 }, feet: FEET,
    keys: [
      at(0, { hip: [0, -75.8, 0], py: 14, cy: 22, lean: 8, nod: 4.5, R: [39, -102, 2], el: 19 }),
      at(190, { hip: [0, -79.6, 1.8], py: 22, cy: 24, lean: 6.5, nod: 3.5, R: [39, -105, 2], el: 17.5 }),
      at(380, { hip: [0, -75.8, 0], py: 30, cy: 26, lean: 8, nod: 4.5, R: [39, -102, 1], el: 19 }),
      at(570, { hip: [0, -79.6, -1.8], py: 22, cy: 24, lean: 6.5, nod: 3.5, R: [39, -105, 2], el: 17.5 }),
      at(760, { hip: [0, -75.8, 0], py: 14, cy: 22, lean: 8, nod: 4.5, R: [39, -102, 2], el: 19 }),
    ],
    phases: null,
  },


  run: {
    name: 'Run (dash in, point forward)', loop: true, gait: { kind: 'run', S: 150, h: 18 }, feet: { R: [10, 5], L: [6, -5] },
    keys: [
      at(0, { hip: [5, -74.6, 0.8], py: 18, cy: 24, lean: 16, nod: 9, R: [52, -98, 6], by: 0, el: 6 }),
      at(82, { hip: [5, -80, 0], py: 22, cy: 25, lean: 15, nod: 8, R: [52, -100, 5], by: 0, el: 7 }),
      at(165, { hip: [5, -74.6, -0.8], py: 28, cy: 26, lean: 16, nod: 9, R: [52, -98, 4], by: 0, el: 6 }),
      at(247, { hip: [5, -80, 0], py: 22, cy: 25, lean: 15, nod: 8, R: [52, -100, 5], by: 0, el: 7 }),
      at(330, { hip: [5, -74.6, 0.8], py: 18, cy: 24, lean: 16, nod: 9, R: [52, -98, 6], by: 0, el: 6 }),
    ],
    phases: null,
  },





  fall: {
    name: 'Knocked off the feet (in the air)', feet: FEET, ownFeet: true,
    keys: [
      at(0, { hip: [-4, -80, 0], py: 16, cy: 26, lean: 2, nod: 0, R: [34, -112, 6], el: 30 }),
      at(80, { hip: [-8, -80, 0], pitch: 12, py: 22, cy: 36, lean: -12, nod: -18, w: 1, R: [6, -136, 26], by: 130, el: 52, pR: [-0.4, 0.4, 0.8], pL: [0.2, 0.3, -0.9], lf: 1, L: [18, -146, -22], FR: [24, -8, 6], FL: [-22, -14, -6] }, 'out3'),
      at(250, { hip: [-6, -74, 0], pitch: 46, py: 22, cy: 34, lean: -6, nod: 6, w: 1, R: [-26, -126, 32], by: 150, el: 30, pR: [-0.4, -0.2, 0.9], pL: [0.2, -0.2, -0.9], lf: 1, L: [-4, -136, -26], FR: [30, -40, 6], FL: [20, -30, -6] }, 'io'),
      at(420, { hip: [-6, -72, 0], pitch: 60, py: 22, cy: 32, lean: -4, nod: 12, w: 1, R: [-34, -116, 34], by: 158, el: 22, pR: [-0.4, -0.3, 0.9], pL: [0.2, -0.3, -0.9], lf: 1, L: [-10, -128, -28], FR: [36, -48, 6], FL: [28, -40, -6] }, 'out'),
    ],
    phases: null,
  },





  downRise: {
    name: 'Down and up again (break-fall, kneel, rise)', feet: FEET, ownFeet: true,
    keys: [
      at(0, { hip: [-6, -72, 0], pitch: 60, py: 22, cy: 32, lean: -4, nod: 12, w: 1, R: [-34, -116, 34], by: 158, el: 22, pR: [-0.4, -0.3, 0.9], pL: [0.2, -0.3, -0.9], lf: 1, L: [-10, -128, -28], FR: [36, -48, 6], FL: [28, -40, -6] }),

      at(85, { hip: [-12, -24, 0], pitch: 80, py: 22, cy: 30, lean: -2, nod: 15, w: 1, R: [-42, -14, 36], by: 24, el: 56, n: [0, 0, -1], pR: [-0.3, -0.6, 0.7], pL: [0, -0.6, -0.8], lf: 1, L: [-34, -12, -28], FR: [62, -20, 8], FL: [52, -16, -8] }, 'in'),
      at(110, { ...LIE, hip: [-14, -12.5, 0], pitch: 85, nod: 16, R: [-43, -5, 36], el: 38, FR: [62, -12, 8], FL: [52, -9, -8] }, 'lin'),
      at(210, { ...LIE }, 'out'),
      at(400, { ...LIE, hip: [-15, -11.8, 0], nod: 13 }, 'io'),

      at(435, { ...LIE, hip: [-15, -12, 0], nod: 18, FR: [61, -11, 8] }, 'io'),

      at(470, { ...LIE, hip: [-15, -12, 0], pitch: 84, lean: 0, nod: 24, R: [-40, -8, 36], by: 10, el: 38, FR: [44, -16, 8] }, 'io'),

      at(525, { ...LIE, hip: [-14, -12, 0], pitch: 58, py: 21, cy: 29, lean: 3, nod: 14, R: [-22, -46, 26], by: 6, el: 34, n: [0, 0, 1], pR: [-0.2, 0.4, 0.8], pL: [0, 0.2, -0.9], FR: [24, -7, 6] }, 'io'),

      at(545, { ...LIE, hip: [-14, -12, 0], pitch: 46, py: 20, cy: 28, lean: 4, nod: 10, R: [-12, -58, 22], by: 0, el: 28, n: [0, 0, 1], pR: [-0.2, 0.6, 0.7], pL: [0, 0.6, -0.8], FR: [24, 0, 6] }, 'io'),


      at(568, { hip: [-13, -16, 0], pitch: 38, py: 19, cy: 27, lean: 5, nod: 9, w: 1, R: [-6, -60, 20], by: 0, el: 23, n: [0, 0, 1], pR: [-0.2, 0.7, 0.65], pL: [0, 0.6, -0.8], lf: 1, L: [-31, -12, -27], FR: [24, 0, 6], FL: [52, -11, -8] }, 'io'),

      at(605, { hip: [-10, -30, 0], pitch: 24, py: 18, cy: 26, lean: 7, nod: 8, w: 1, R: [4, -70, 15], by: 0, el: 22, n: [0, 0, 1], pR: [-0.2, 0.8, 0.6], pL: [-0.3, 0.6, -0.75], lf: 1, L: [-26, -34, -26], FR: [24, 0, 6], FL: [30, -12, -9] }, 'io'),

      at(650, { hip: [-8, -44, 0], pitch: 10, py: 17, cy: 25, lean: 10, nod: 7, w: 1, R: [18, -66, 9], by: 0, el: 22, n: [0, 0, 1], pR: [-0.2, 0.8, 0.6], pL: [-0.2, 0.7, -0.7], lf: 0.7, L: [-8, -66, -22], FR: [24, 0, 6], FL: [-6, -16, -9] }, 'io'),
      at(690, { hip: [-7, -51, 0], pitch: 3, py: 16, cy: 24, lean: 11, nod: 6, R: [28, -72, 6], el: 20, lf: 0.3, L: [0, -80, -18], FR: [24, 0, 6], FL: [-40, -12, -7] }, 'io'),

      at(730, { hip: [-6, -50, 0], py: 16, cy: 24, lean: 12, nod: 5, R: [36, -75, 4], el: 20, lf: 0, L: [6, -92, -14], FR: [24, 0, 6], FL: [-56, -9, -6] }, 'out'),

      at(840, { hip: [-4, -64, 0], py: 15, cy: 23, lean: 9, nod: 5, R: [37, -88, 3], el: 19, FR: [24, 0, 6], FL: [-38, -12, -6] }, 'io'),
      at(915, { hip: [-2, -73, 0], py: 14, cy: 22, lean: 8, nod: 4, R: [37, -97, 2], el: 18, FR: [24, 0, 6], FL: [-22, -7, -6] }, 'io'),
      at(970, { hip: [-1, -77.5, 0], py: 14, cy: 22, lean: 7, nod: 4, R: [37, -103, 2], el: 18, FR: [24, 0, 6], FL: [-22, 0, -6] }, 'io'),
      at(1210, {}, 'io'),
    ],
    phases: null,
  },



  parryUp: {
    name: 'Parry (sends the cut up)', feet: FEET, beat: [0, 120],
    keys: [
      at(0, G_MID),
      at(55, { ...G_MID, hip: [-4, -76.5, 0], cy: 24, lean: 2, nod: 1, R: [40, -138, 6], by: 2, el: 96, pR: [-0.4, 0.5, 0.8], pL: [-0.4, 0.4, -0.8] }, 'out3'),
      at(120, { ...G_MID, hip: [-3.5, -77, 0], cy: 25, lean: 3, nod: 2, R: [39, -134, 6], by: 2, el: 90, pR: [-0.4, 0.5, 0.8], pL: [-0.4, 0.4, -0.8] }, 'io'),
      at(200, G_MID, 'io'),
    ],
    phases: null,
  },
  parryDown: {
    name: 'Parry (beats the cut down)', feet: FEET, beat: [0, 120],
    keys: [
      at(0, G_MID),
      at(55, { ...G_MID, hip: [-3, -76, 0], cy: 24, lean: 8, nod: 6, R: [49, -103, 7], by: 2, el: -12, pR: [-0.2, 0.9, 0.5], pL: [-0.2, 0.9, -0.5] }, 'out3'),
      at(120, { ...G_MID, hip: [-3, -76.5, 0], cy: 25, lean: 7, nod: 5, R: [48, -105, 7], by: 2, el: -6, pR: [-0.2, 0.9, 0.5], pL: [-0.2, 0.9, -0.5] }, 'io'),
      at(200, G_MID, 'io'),
    ],
    phases: null,
  },
  parrySide: {
    name: 'Parry (rolls the cut aside)', feet: FEET, beat: [0, 120],
    keys: [
      at(0, G_MID),
      at(55, { ...G_MID, hip: [-3, -77, 0], py: 20, cy: 32, lean: 4, nod: 3, R: [40, -122, 14], by: 40, el: 50, n: [0, 0.5, 0.85] }, 'out3'),
      at(120, { ...G_MID, hip: [-3, -77.3, 0], py: 19, cy: 31, lean: 4, nod: 3, R: [39, -121, 13], by: 36, el: 50, n: [0, 0.5, 0.85] }, 'io'),
      at(200, G_MID, 'io'),
    ],
    phases: null,
  },






  dodgeB: {
    name: 'Dodge back (hop away, blade up)', feet: FEET,
    steps: [{ foot: 'R', t0: 30, t1: 230, dx: -6, h: 13 }, { foot: 'L', t0: 45, t1: 220, dx: -4, h: 9 }],
    keys: [
      at(0, {}),
      at(40, { hip: [-6, -73, 0], py: 18, cy: 30, lean: 2, nod: 2, R: [34, -108, 4], by: -3, el: 30 }, 'in'),
      at(120, { hip: [-20, -76, 0], py: 26, cy: 44, lean: -20, nod: -12, R: [10, -128, 10], by: -6, el: 66, pR: [-0.4, 0.6, 0.7], pL: [-0.4, 0.6, -0.7] }, 'out'),
      at(235, { hip: [-17, -69, 0], py: 24, cy: 40, lean: -12, nod: -6, R: [16, -122, 9], by: -5, el: 56, pR: [-0.4, 0.6, 0.7], pL: [-0.4, 0.6, -0.7] }, 'io'),
      at(285, { hip: [-12, -71, 0], py: 21, cy: 34, lean: -4, nod: -1, R: [26, -114, 6], by: -4, el: 40 }, 'out'),
      at(360, {}, 'io'),
    ],
    phases: null,
  },


  dodgeF: {
    name: 'Dash in (low, the point on him)', feet: FEET,
    steps: [{ foot: 'R', t0: 20, t1: 200, dx: 10, h: 11 }, { foot: 'L', t0: 60, t1: 250, dx: 6, h: 14 }],
    keys: [
      at(0, {}),
      at(40, { hip: [2, -73, 0], py: 12, cy: 18, lean: 12, nod: 7, R: [46, -100, 3], by: -3, el: 10 }, 'in'),
      at(120, { hip: [14, -66, 0], py: 6, cy: 10, lean: 28, nod: 12, R: [74, -92, 4], by: -6, el: 2 }, 'out'),
      at(240, { hip: [12, -67, 0], py: 7, cy: 11, lean: 24, nod: 11, R: [71, -93, 4], by: -5, el: 4 }, 'io'),
      at(290, { hip: [7, -71, 0], py: 10, cy: 16, lean: 14, nod: 7, R: [54, -97, 3], by: -3, el: 10 }, 'out'),
      at(360, {}, 'io'),
    ],
    phases: null,
  },




  noto: {
    name: 'Noto (flick, the blade slides home)', feet: FEET, jump: [[244, 247]], rest: [[70, 248]],
    keys: [
      at(0, {}),
      at(110, { hip: [1, -78.5, 0], py: 16, cy: 26, lean: 6, nod: 5, R: [47, -100, 14], by: 26, el: -24, n: [0, 0.45, 0.9], pR: [-0.2, 0.9, 0.4], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'out3'),
      at(200, { hip: [0, -79, 0], py: 18, cy: 30, lean: 5, nod: 6, R: [46, -110, 2], by: -150, el: -20, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),

      at(244, { hip: [0, -79, 0], py: 18, cy: 30, lean: 5, nod: 6, iai: true, d: 0.36, sby: -172, sel: -30, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0, at: 1 }, 'out'),


      at(247, { hip: [0, -79, 0], py: 18, cy: 30, lean: 5, nod: 6, iai: true, d: 0.36, sby: -172, sel: -30, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'in'),
      at(420, { hip: [0, -79.5, 0], py: 17, cy: 27, lean: 5, nod: 5, iai: true, d: 0.1, sby: -172, sel: -26, n: [0, -0.6, 0.8], pR: [-0.3, 0.85, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),
      at(510, { hip: [0, -80, 0], py: 15, cy: 23, lean: 6, nod: 4, iai: true, d: 0, sby: -172, sel: -22, n: [0, -0.6, 0.8], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'out'),
      at(600, { iai: true, d: 0, n: [0, -0.6, 0.8], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),
    ],
    phases: null,
  },




  nuki: {
    name: 'Nukitsuke (draw and cut from the saya)', feet: FEET, jump: [[246, 250]],
    keys: [
      at(0, { iai: true, d: 0, n: [0, -0.6, 0.8], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }),
      at(80, { hip: [-2, -77, 0], py: 8, cy: 12, lean: 6, nod: 5, iai: true, d: 0.26, sby: -168, sel: -14, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'in'),
      at(212, { hip: [-2, -77, -1], py: 4, cy: 4, lean: 9, nod: 4, iai: true, d: 0.33, sby: -162, sel: -11, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),




      at(246, { hip: [2, -77, -0.5], py: 4, cy: 4, lean: 8, nod: 4, iai: true, d: 0.36, sby: -160, sel: -10, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),
      at(249.5, { hip: [2, -77, -0.5], py: 4, cy: 4, lean: 8, nod: 4, iai: true, d: 0.36, sby: -160, sel: -10, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'lin'),
      at(250, { hip: [8, -77, 0], py: 6, cy: 6, lean: 7, nod: 5, R: [48, -104, -22], by: -30, el: 0, n: [0, -1, 0], pR: [-0.3, 0.6, 0.7], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'lin'),
      at(280, { hip: [15, -76, 0], py: 8, cy: 8, lean: 8, nod: 6, R: [70, -112, -4], by: 0, el: 2, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'lin'),
      at(335, { hip: [17, -76, 0], py: 16, cy: 28, lean: 8, nod: 6, R: [66, -110, 22], by: 55, el: 2, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'out'),
      at(390, { hip: [16.5, -76.5, 0], py: 16, cy: 27, lean: 8, nod: 6, R: [62, -110, 21], by: 53, el: 4, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0.2 }, 'io'),
      at(540, { hip: [7, -78, 0], py: 15, cy: 22, lean: 7, nod: 5, R: [52, -108, 10], by: 22, el: 10, n: [0, -0.4, 0.92] }, 'io'),
      at(700, {}, 'io'),
    ],
    phases: { windup: [0, 250], active: [250, 335], recovery: [335, 700] },
  },




  kakato: {





    name: 'Axe kick (kakato-otoshi)', feet: FEET, kick: 'R', kneeUp: 'R',
    keys: [
      at(0, {}),


      at(60, { hip: [-4, -79.5, 0], py: 12, cy: 20, lean: 2, nod: 3, R: [24, -106, 12], by: 60, el: 6, n: [0, 1, 0], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.5], FR: [25, -9, 7] }, 'io'),
      at(110, { hip: [-7, -81, 0], py: 10, cy: 20, lean: -2, nod: 2, R: [-6, -97, 22], by: 140, el: -14, n: [0, 1, 0], pR: [-0.6, 0.6, 0.6], pL: [0, 0.85, -0.6], FR: [30, -30, 9] }, 'io'),


      at(150, { hip: [-9, -82, 0], py: 9, cy: 18, lean: -5, nod: 0, R: [-34, -100, 16], by: 178, el: -24, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [36, -48, 10] }, 'io'),

      at(200, { hip: [-11, -84, 0], py: 7, cy: 16, lean: -12, nod: -3, R: [-38, -99, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [62, -114, 12] }, 'out'),
      at(235, { hip: [-12.5, -85, 0], py: 6, cy: 15, lean: -17, nod: -5, R: [-40, -98, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [53, -143, 12] }, 'out'),

      at(265, { hip: [-13, -85, 0], py: 6, cy: 15, lean: -20, nod: -6, R: [-41, -98, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [43, -153, 12] }, 'out'),
      at(305, { hip: [-12, -85, 0], py: 6, cy: 15, lean: -19, nod: -6, R: [-40, -98, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [47, -151, 12] }, 'io'),


      at(345, { hip: [-6, -84, 0], py: 7, cy: 16, lean: -10, nod: -2, R: [-34, -100, 16], by: 180, el: -24, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [62, -126, 11] }, 'in'),
      at(385, { hip: [3, -80, 0], py: 8, cy: 17, lean: 2, nod: 3, R: [-24, -100, 16], by: 178, el: -22, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [66, -72, 10] }, 'lin'),
      at(425, { hip: [10, -72, 0], py: 9, cy: 18, lean: 10, nod: 6, R: [-14, -94, 16], by: 176, el: -20, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [58, -16, 9] }, 'lin'),

      at(470, { hip: [13, -68, 0], py: 10, cy: 18, lean: 12, nod: 7, R: [-6, -94, 20], by: 172, el: -18, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [57, 0, 8] }, 'out'),
      at(520, { hip: [12.5, -68.5, 0], py: 10, cy: 18, lean: 12, nod: 7, R: [-2, -95, 22], by: 170, el: -17, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [57, 0, 8] }, 'io'),


      at(595, { hip: [9, -71, 0], py: 11, cy: 18, lean: 10, nod: 6, R: [34, -100, 34], by: 110, el: -6, n: [0, 1, 0], pR: [-0.7, 0.4, 0.6], pL: [0, 0.85, -0.6], FR: [54, -6, 8] }, 'io'),
      at(650, { hip: [6, -74, 0], py: 12, cy: 19, lean: 9, nod: 5, R: [50, -108, 10], by: 24, el: 22, n: [0, 0.5, 0.86], pR: [-0.3, 0.8, 0.6], pL: [-0.2, 0.9, -0.5], FR: [36, -11, 7] }, 'io'),
      at(695, { hip: [3, -77, 0], py: 13, cy: 20, lean: 8, nod: 5, R: [40, -107, 4], by: 0, el: 26, FR: [24, -5, 6] }, 'io'),
      at(720, { hip: [2, -78, 0], py: 13, cy: 20, lean: 8, nod: 5, R: [38, -106, 3], by: -1, el: 26, FR: [24, 0, 6] }, 'out'),
      at(941, {}, 'io'),
    ],
    phases: { windup: [0, 336], active: [336, 470], recovery: [470, 941] },
  },

  sweep: {
    name: 'Low sweep (ashi-barai)', feet: FEET, kick: 'R',
    keys: [
      at(0, {}),
      at(168, { hip: [-10, -56, 0], py: 18, cy: 26, lean: 26, nod: 14, R: [46, -80, 12], by: 0, el: 40, FR: [30, -3, 10] }, 'io'),
      at(240, { hip: [-6, -49, 0], py: 16, cy: 24, lean: 27, nod: 15, R: [46, -80, 12], by: 0, el: 40, FR: [54, -4, 26] }, 'in'),
      at(303, { hip: [-3, -46, 0], py: 14, cy: 22, lean: 26, nod: 15, R: [46, -80, 12], by: 0, el: 40, FR: [74, -3, 12] }, 'out'),
      at(437, { hip: [-3, -46, 0], py: 14, cy: 22, lean: 26, nod: 15, R: [46, -80, 12], by: 0, el: 40, FR: [74, -3, 12] }, 'io'),
      at(620, { hip: [-4, -58, 0], py: 14, cy: 22, lean: 18, nod: 10, R: [46, -88, 10], by: 0, el: 38, FR: [48, -8, 8] }, 'io'),
      at(720, { hip: [-2, -68, 0], py: 14, cy: 22, lean: 10, nod: 6, R: [40, -100, 6], by: 4, el: 32, FR: [24, -5, 6] }, 'io'),
      at(760, { hip: [-2, -70, 0], py: 14, cy: 22, lean: 10, nod: 6, R: [36, -102, 3], by: -1, el: 26, FR: [24, 0, 6] }, 'out'),
      at(975, {}, 'io'),
    ],
    phases: { windup: [0, 218], active: [218, 370], recovery: [370, 975] },
  },


  spinKick: {
    name: 'Spinning kick (ushiro-mawashi)', feet: FEET, kick: 'R',
    keys: [
      at(0, {}),
      at(134, { hip: [2, -78, 0], py: 20, cy: 30, lean: 14, nod: 8, R: [34, -116, 6], by: 0, el: 68, FR: [24, -3, 6] }, 'io'),
      at(300, { hip: [-2, -80, 0], py: 194, cy: 204, lean: 8, nod: 6, R: [32, -118, 6], by: 0, el: 70, FR: [6, -30, 2] }, 'io'),
      at(420, { hip: [-6, -82, 0], py: 300, cy: 312, lean: -6, nod: 2, R: [30, -120, 5], by: 0, el: 74, FR: [30, -66, 10] }, 'io'),
      at(538, { hip: [-12, -84, 0], py: 374, cy: 384, lean: -26, nod: -6, R: [16, -126, 4], by: 0, el: 84, FR: [74, -80, 8] }, 'out'),
      at(739, { hip: [-12, -84, 0], py: 374, cy: 384, lean: -25, nod: -6, R: [17, -126, 4], by: 0, el: 83, FR: [73, -79, 8] }, 'io'),
      at(900, { hip: [-4, -80, 0], py: 374, cy: 382, lean: -6, nod: 2, R: [30, -114, 4], by: 0, el: 50, FR: [40, -20, 7] }, 'io'),
      at(1000, { hip: [-1, -79, 0], py: 374, cy: 382, lean: 4, nod: 3, R: [36, -108, 3], by: -1, el: 30, FR: [24, -5, 6] }, 'io'),
      at(1050, { hip: [0, -79, 0], py: 374, cy: 382, lean: 6, nod: 4, R: [38, -106, 3], by: -1, el: 24, FR: [24, 0, 6] }, 'out'),
      at(1445, { py: 374, cy: 382 }, 'io'),
    ],
    phases: { windup: [0, 487], active: [487, 672], recovery: [672, 1445] },
  },




  snapKick: {
    name: 'Snap kick at the wrist (kote-geri)', feet: FEET, kick: 'R', kneeUp: 'R',
    keys: [
      at(0, {}),

      at(50, { hip: [-3, -80, 0], py: 12, cy: 20, lean: 1, nod: 3, R: [24, -106, 12], by: 60, el: 6, n: [0, 1, 0], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.5], FR: [25, -10, 7] }, 'io'),
      at(95, { hip: [-6, -81, 0], py: 11, cy: 19, lean: -2, nod: 2, R: [-6, -97, 22], by: 140, el: -14, n: [0, 1, 0], pR: [-0.6, 0.6, 0.6], pL: [0, 0.85, -0.6], FR: [28, -30, 9] }, 'io'),


      at(135, { hip: [-8, -82, 0], py: 10, cy: 17, lean: -6, nod: 0, R: [-34, -100, 16], by: 178, el: -24, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [31, -54, 10] }, 'io'),

      at(185, { hip: [-11, -84, 0], py: 8, cy: 15, lean: -14, nod: -4, R: [-38, -99, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [70, -118, 11] }, 'out'),
      at(300, { hip: [-11, -84, 0], py: 8, cy: 15, lean: -13, nod: -4, R: [-37, -99, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [68, -115, 11] }, 'io'),

      at(380, { hip: [-7, -82, 0], py: 10, cy: 17, lean: -5, nod: 0, R: [-30, -100, 17], by: 178, el: -24, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [34, -58, 10] }, 'io'),
      at(460, { hip: [-3, -80, 0], py: 12, cy: 18, lean: 3, nod: 3, R: [-8, -96, 20], by: 172, el: -18, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [26, -14, 7] }, 'io'),

      at(540, { hip: [-2, -79.5, 0], py: 12, cy: 19, lean: 5, nod: 3, R: [24, -100, 34], by: 110, el: -6, n: [0, 1, 0], pR: [-0.7, 0.4, 0.6], pL: [0, 0.85, -0.6], FR: [24, -4, 6] }, 'io'),
      at(570, { hip: [-1, -79, 0], py: 13, cy: 20, lean: 6, nod: 4, R: [30, -103, 24], by: 70, el: 6, n: [0, 0.8, 0.6], pR: [-0.5, 0.6, 0.6], pL: [-0.1, 0.9, -0.5], FR: [24, 0, 6] }, 'out'),
      at(640, { hip: [-0.5, -79, 0], py: 13, cy: 20, lean: 6, nod: 4, R: [38, -106, 6], by: 8, el: 22, n: [0, 0.5, 0.86], pR: [-0.2, 0.95, 0.6], pL: [-0.15, 1, -0.6] }, 'io'),
      at(773, {}, 'io'),
    ],
    phases: { windup: [0, 168], active: [168, 319], recovery: [319, 773] },
  },

  knee: {
    name: 'Knee strike (hiza-geri)', feet: FEET, kick: 'R',
    keys: [
      at(0, {}),
      at(134, { hip: [0, -83, 0], py: 12, cy: 18, lean: 2, nod: 4, R: [30, -118, 6], by: 0, el: 70, FR: [22, -32, 8] }, 'io'),
      at(235, { hip: [6, -86, 0], py: 8, cy: 14, lean: -4, nod: 2, R: [34, -120, 6], by: 0, el: 72, FR: [34, -62, 8] }, 'out'),
      at(370, { hip: [6, -86, 0], py: 8, cy: 14, lean: -3, nod: 2, R: [34, -119, 6], by: 0, el: 71, FR: [33, -60, 8] }, 'io'),
      at(560, { hip: [2, -79, 0], py: 13, cy: 20, lean: 5, nod: 4, R: [36, -108, 3], by: -1, el: 30, FR: [26, -6, 6] }, 'io'),
      at(620, { hip: [1, -79, 0], py: 14, cy: 21, lean: 6, nod: 4, R: [37, -106, 2], by: -1, el: 24, FR: [24, 0, 6] }, 'out'),
      at(739, {}, 'io'),
    ],
    phases: { windup: [0, 168], active: [168, 303], recovery: [303, 739] },
  },

  nidan: {
    name: 'Double kick (nidan-geri)', feet: FEET, kick: 'R',
    keys: [
      at(0, {}),
      at(101, { hip: [-2, -82, 0], py: 12, cy: 18, lean: 0, nod: 3, R: [28, -120, 6], by: 0, el: 72, FR: [22, -40, 8] }, 'io'),
      at(185, { hip: [-6, -82, 0], py: 10, cy: 16, lean: -9, nod: 0, R: [24, -122, 6], by: 0, el: 76, FR: [68, -36, 8] }, 'out'),
      at(286, { hip: [-4, -84, 0], py: 10, cy: 16, lean: -4, nod: 2, R: [26, -122, 6], by: 0, el: 74, FR: [22, -62, 8] }, 'io'),
      at(387, { hip: [-12, -85, 0], py: 6, cy: 12, lean: -22, nod: -6, R: [18, -126, 4], by: 0, el: 82, FR: [70, -112, 8] }, 'out'),
      at(538, { hip: [-12, -85, 0], py: 6, cy: 12, lean: -21, nod: -6, R: [19, -126, 4], by: 0, el: 81, FR: [69, -110, 8] }, 'io'),
      at(760, { hip: [-3, -80, 0], py: 12, cy: 18, lean: 3, nod: 3, R: [34, -110, 4], by: 0, el: 40, FR: [30, -12, 7] }, 'io'),
      at(810, { hip: [-2, -79.5, 0], py: 12, cy: 19, lean: 5, nod: 4, R: [35, -108, 3], by: -1, el: 32, FR: [24, -5, 6] }, 'io'),
      at(840, { hip: [-1, -79, 0], py: 13, cy: 20, lean: 6, nod: 4, R: [36, -106, 3], by: -1, el: 26, FR: [24, 0, 6] }, 'out'),
      at(975, {}, 'io'),
    ],
    phases: { windup: [0, 151], active: [151, 470], recovery: [470, 975] },
  },





  kiriR: {
    name: 'Rising cut from the right (kiri-age)', feet: FEET,
    keys: [
      at(0, {}),
      at(100, { hip: [-3, -78, 1], py: 20, cy: 30, lean: 5, nod: 5, R: [2, -100, 28], by: 70, el: -12, n: [0, 0, -1], pR: [-0.2, 0.9, 0.4], pL: [-0.3, 0.8, -0.5] }, 'io'),
      at(168, { hip: [-5, -77, 1], py: 26, cy: 40, lean: 6, nod: 5, R: [-6, -96, 26], by: 160, el: -32, n: [0, 0, -1], pR: [-0.2, 0.9, 0.4], pL: [-0.3, 0.8, -0.5] }, 'io'),
      at(303, { hip: [-6, -76, 1], py: 28, cy: 42, lean: 7, nod: 5, R: [-8, -94, 26], by: 164, el: -34, n: [0, 0, -1], pR: [-0.2, 0.9, 0.4], pL: [-0.3, 0.8, -0.5] }, 'out'),
      at(380, { hip: [2, -76, 1], py: 18, cy: 30, lean: 8, nod: 6, R: [28, -100, 26], by: 120, el: -36, n: [0, 0, -1], pR: [-0.2, 0.9, 0.4], pL: [-0.3, 0.8, -0.5] }, 'in'),
      at(420, { hip: [8, -76, 0], py: 10, cy: 18, lean: 8, nod: 6, R: [52, -100, 16], by: 40, el: -30, n: [0, 0, -1] }, 'in'),
      at(454, { hip: [14, -77, 0], py: 4, cy: 8, lean: 6, nod: 4, R: [64, -118, 6], by: 4, el: 10, n: [0, 0, -1] }, 'lin'),
      at(538, { hip: [16, -79, 0], py: 0, cy: 2, lean: 2, nod: 0, R: [56, -148, -2], by: -6, el: 62, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8] }, 'lin'),
      at(639, { hip: [16, -80, 0], py: 0, cy: 2, lean: 0, nod: -1, R: [40, -168, -4], by: -8, el: 112, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8] }, 'out'),
      at(800, { hip: [8, -79, 0], py: 8, cy: 14, lean: 4, nod: 3, R: [50, -130, 2], by: -4, el: 46, pR: [-0.3, 0.7, 0.6], pL: [-0.3, 0.7, -0.6] }, 'io'),
      at(1076, {}, 'io'),
    ],
    phases: { windup: [0, 370], active: [370, 538], recovery: [538, 1076] },


    downPass: [[60, 200]],
  },

  kiriL: {
    name: 'Rising cut from the left (gyaku kiri-age)', feet: FEET,
    keys: [
      at(0, {}),
      at(143, { hip: [-3, -78, -1], py: 6, cy: 6, lean: 6, nod: 5, R: [14, -98, -22], by: -160, el: -30, n: [0, 0, -1], pR: [-0.2, 0.8, 0.6], pL: [-0.4, 0.7, -0.6] }, 'io'),
      at(185, { hip: [-4, -77.5, -1], py: 5, cy: 5, lean: 6, nod: 5, R: [18, -97, -21], by: -140, el: -31, n: [0, 0, -1], pR: [-0.2, 0.8, 0.6], pL: [-0.4, 0.7, -0.6] }, 'out'),
      at(230, { hip: [5, -77, 0], py: 6, cy: 8, lean: 7, nod: 5, R: [54, -98, -4], by: -40, el: -32, n: [0, 0, -1] }, 'in'),
      at(261, { hip: [12, -77, 0], py: 8, cy: 12, lean: 6, nod: 4, R: [66, -114, 2], by: -4, el: 8, n: [0, 0, -1] }, 'lin'),
      at(328, { hip: [15, -79, 0], py: 12, cy: 20, lean: 2, nod: 0, R: [56, -148, 4], by: 8, el: 62, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8] }, 'lin'),
      at(412, { hip: [15, -80, 0], py: 13, cy: 22, lean: 0, nod: -1, R: [40, -166, 6], by: 10, el: 110, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8] }, 'out'),
      at(600, { hip: [7, -79, 0], py: 13, cy: 20, lean: 4, nod: 3, R: [50, -128, 4], by: 2, el: 44, pR: [-0.3, 0.7, 0.6], pL: [-0.3, 0.7, -0.6] }, 'io'),
      at(891, {}, 'io'),
    ],
    phases: { windup: [0, 193], active: [193, 328], recovery: [328, 891] },
  },

  sune: {
    name: 'Low cut at the shins (sune-gari)', feet: FEET,
    keys: [
      at(0, {}),
      at(143, { hip: [-6, -74, 2], py: 30, cy: 46, lean: 10, nod: 8, R: [10, -98, 32], by: 170, el: -24, n: [0, 0.6, 0.8] }, 'io'),
      at(185, { hip: [-6, -73.5, 2], py: 30, cy: 46, lean: 10, nod: 8, R: [10, -97, 32], by: 172, el: -24, n: [0, 1, 0] }, 'out'),
      at(230, { hip: [4, -68, 1], py: 14, cy: 30, lean: 18, nod: 12, R: [30, -86, 30], by: 120, el: -28, n: [0, 1, 0] }, 'in'),
      at(261, { hip: [12, -64, 0], py: 2, cy: 10, lean: 24, nod: 14, R: [58, -76, 14], by: 10, el: -26, n: [0, 1, 0] }, 'lin'),
      at(328, { hip: [14, -64, 0], py: -8, cy: -8, lean: 24, nod: 14, R: [54, -76, -12], by: -50, el: -24, n: [0, 1, 0] }, 'out'),
      at(412, { hip: [14, -64.5, 0], py: -7, cy: -7, lean: 23, nod: 14, R: [53, -77, -12], by: -48, el: -22, n: [0, 1, 0] }, 'io'),
      at(640, { hip: [6, -74, 0], py: 6, cy: 12, lean: 12, nod: 7, R: [46, -98, 0], by: -16, el: 4, n: [0, 0.5, 0.86] }, 'io'),
      at(891, {}, 'io'),
    ],
    phases: { windup: [0, 193], active: [193, 328], recovery: [328, 891] },
  },



  throwL: {
    name: 'Throw (shuriken, left hand)', feet: FEET,
    keys: [
      at(0, {}),
      at(100, { hip: [-3, -79, 0], py: 8, cy: 10, lean: 4, nod: 4, R: [36, -100, 8], el: 10, lf: 1, L: [6, -90, -16], pL: [-1, 0.1, -0.4] }, 'out'),

      at(140, { hip: [-4, -79.5, 0], py: 6, cy: 2, lean: 2, nod: 3, R: [35, -100, 9], el: 10, lf: 1, L: [-24, -98, -30], pL: [-0.7, 0.3, -0.65] }, 'io'),
      at(175, { hip: [-5, -80, 0], py: 4, cy: -6, lean: 1, nod: 2, R: [34, -101, 10], el: 10, lf: 1, L: [-36, -110, -32], pL: [-0.6, 0.4, -0.7] }, 'out'),
      at(208, { hip: [2, -78.5, 0], py: 10, cy: 14, lean: 6, nod: 4, R: [37, -101, 10], el: 10, lf: 1, L: [8, -112, -40], pL: [-0.2, 1, 0.1] }, 'in'),
      at(240, { hip: [8, -77, 0], py: 18, cy: 34, lean: 10, nod: 6, R: [40, -101, 10], el: 10, lf: 1, L: [58, -120, -14], pL: [-0.2, 1, -0.3] }, 'in'),
      at(330, { hip: [10, -76, 0], py: 18, cy: 32, lean: 12, nod: 7, R: [42, -100, 9], el: 11, lf: 1, L: [54, -104, -6], pL: [-0.2, 0.8, -0.6] }, 'out'),
      at(470, { hip: [4, -78, 0], py: 16, cy: 26, lean: 8, nod: 5, R: [40, -102, 4], el: 15, lf: 0.5, L: [30, -100, -8] }, 'io'),
      at(620, {}, 'io'),
    ],

    phases: { windup: [0, 175], active: [175, 240], recovery: [240, 620] },
  },





  lock: {
    name: 'Blade lock (tsubazeriai)', loop: true, feet: { R: [28, 7], L: [-32, -7] },
    keys: [
      at(0, LOCK),
      at(120, { ...LOCK, hip: [-8.5, -70.4, 0], lean: 16.8, R: [45.5, -109, 4], el: 74.5 }),
      at(240, { ...LOCK, hip: [-7.6, -71.4, 0], lean: 15.4, R: [43.2, -111, 4], el: 77.2 }),
      at(360, LOCK),
    ],
    phases: null,
  },
  lockPush: {
    name: 'Blade lock, pressing in', loop: true, feet: { R: [30, 7], L: [-34, -7] },
    keys: [
      at(0, LOCK_P),
      at(120, { ...LOCK_P, hip: [-3.4, -69.2, 0], lean: 21, R: [49, -111, 4], el: 70.5 }),
      at(240, { ...LOCK_P, hip: [-4.4, -70.2, 0], lean: 19.4, R: [46.4, -113, 4], el: 73.4 }),
      at(360, LOCK_P),
    ],
    phases: null,
  },

  shove: {
    name: 'Shove out of the lock', feet: { R: [28, 7], L: [-32, -7] },
    steps: [{ foot: 'R', t0: 40, t1: 150, dx: 8, h: 6 }, { foot: 'L', t0: 170, t1: 280, dx: 10, h: 5 }],
    keys: [
      at(0, LOCK_P),
      at(80, { hip: [4, -72, 0], py: 8, cy: 12, lean: 18, nod: 4, R: [64, -116, 4], by: 0, el: 58, pR: [-0.3, 0.8, 0.5], pL: [-0.3, 0.8, -0.55] }, 'out3'),
      at(160, { hip: [3, -75, 0], py: 10, cy: 16, lean: 12, nod: 4, R: [52, -110, 3], by: -1, el: 34 }, 'io'),
      at(300, {}, 'io'),
    ],
    phases: null,
  },


  clash: {
    name: 'Clash (blades bounce apart)', feet: FEET,
    keys: [
      at(0, { hip: [4, -77, 0], py: 8, cy: 12, lean: 8, nod: 5, R: [54, -122, 3], by: 0, el: 30 }),
      at(60, { hip: [-8, -78.5, 0], py: 16, cy: 28, lean: -5, nod: -3, R: [32, -140, 7], by: -4, el: 80, pR: [-0.4, 0.6, 0.7], pL: [-0.4, 0.6, -0.7] }, 'out3'),
      at(150, { hip: [-9, -77.5, 0], py: 17, cy: 28, lean: -2, nod: 0, R: [33, -134, 7], by: -4, el: 70, pR: [-0.4, 0.6, 0.7], pL: [-0.4, 0.6, -0.7] }, 'io'),
      at(250, { hip: [-4, -79, 0], py: 15, cy: 24, lean: 4, nod: 3, R: [36, -114, 4], by: -2, el: 32 }, 'io'),
      at(340, {}, 'io'),
    ],
    phases: null,
  },



  bindDef: {
    name: 'Bind (defender, under)', loop: true, feet: { R: [26, 7], L: [-28, -7] },
    keys: [
      at(0, BIND_D),
      at(80, { ...BIND_D, hip: [-6.5, -71.5, 0], lean: 10.6, R: [43, -101, 6], el: 63.5 }),
      at(160, BIND_D),
    ],
    phases: null,
  },
  bindAtt: {
    name: 'Bind (attacker, pressing over)', loop: true, feet: { R: [28, 7], L: [-30, -7] },
    keys: [
      at(0, BIND_A),
      at(80, { ...BIND_A, hip: [-1.4, -73.4, 0], lean: 16.8, R: [48, -113, 8], el: 28.5 }),
      at(160, BIND_A),
    ],
    phases: null,
  },



  makiDef: {
    name: 'Maki-otoshi (the bind won)', feet: { R: [26, 7], L: [-28, -7] },
    keys: [
      at(0, BIND_D),
      at(90, { hip: [-4, -73, 0], py: 16, cy: 26, lean: 8, nod: 2, R: [46, -116, 12], by: 40, el: 96, n: [0, 0.5, 0.86], pR: [-0.4, 0.6, 0.7], pL: [-0.4, 0.6, -0.7] }, 'io'),
      at(190, { hip: [8, -71, 0], py: 6, cy: 10, lean: 16, nod: 7, R: [64, -102, 6], by: -4, el: -32, n: [0, 0.5, 0.86] }, 'in'),
      at(340, { hip: [9, -71.5, 0], py: 7, cy: 11, lean: 15, nod: 7, R: [62, -103, 5], by: -3, el: -26, n: [0, 0.5, 0.86] }, 'out'),
      at(500, { hip: [10, -73, 0], py: 6, cy: 8, lean: 11, nod: 6, R: [68, -114, 2], by: 0, el: 2 }, 'io'),
      at(620, { hip: [11, -73.5, 0], py: 5, cy: 7, lean: 10.5, nod: 6, R: [70, -115, 2], by: 0, el: 1 }, 'out'),
    ],
    phases: null,
  },


  flungAtt: {
    name: 'Bind lost (pressed, the blade beaten away)', feet: { R: [28, 7], L: [-30, -7] },
    keys: [
      at(0, BIND_A),
      at(100, { ...BIND_A, lean: 17 }, 'io'),
      at(210, { hip: [-6, -76, 0], py: 18, cy: 30, lean: 6, nod: 6, R: [44, -108, 16], by: 30, el: 0, pR: [-0.3, 0.9, 0.5], pL: [-0.3, 0.9, -0.5] }, 'out3'),
      at(420, { hip: [-12, -77, 0], py: 22, cy: 36, lean: -6, nod: -4, R: [26, -116, 8], by: -6, el: 30, pR: [-0.4, 0.6, 0.7], pL: [-0.4, 0.6, -0.7] }, 'io'),
      at(620, {}, 'io'),
    ],
    phases: null,
  },





  stuck: {
    name: 'Blade stuck in the post (bite, tug, free)', feet: { R: [26, 7], L: [-26, -7] },
    keys: [
      at(0, {}),
      at(80, STUCK_B, 'out3'),
      at(400, { ...STUCK_B, hip: [-1, -74.5, 0], lean: 11 }, 'io'),
      at(500, STUCK_T, 'io'),
      at(620, STUCK_B, 'io'),
      at(720, { ...STUCK_T, hip: [-12, -74, 0], lean: -5, R: [30, -111, 6], el: -7 }, 'io'),
      at(800, { hip: [-8, -77, 0], py: 14, cy: 22, lean: 3, nod: 3, R: [38, -116, 6], by: -2, el: 36 }, 'out'),
      at(900, G_MID, 'io'),
    ],
    phases: null,
  },



  dodgePost: {
    name: 'Round the post and kick', feet: FEET, kick: 'R', kneeUp: 'R', air: true,
    keys: [
      at(0, {}),
      at(90, { hip: [-4, -70, 0], py: 14, cy: 22, lean: 14, nod: 6, R: [34, -92, 14], by: 0, el: -6, FR: [28, -12, 7] }, 'io'),
      at(160, POST_LOW, 'out'),
      at(500, { ...POST_LOW, hip: [-6, -55, 0], lean: 27 }, 'io'),
      at(620, { hip: [-6, -80, 0], py: 9, cy: 17, lean: -2, nod: 1, R: [24, -116, 10], by: 0, el: 78, FR: [34, -52, 10] }, 'io'),
      at(720, { hip: [-10, -82, 0], py: 7, cy: 15, lean: -12, nod: -3, R: [20, -118, 10], by: 0, el: 82, FR: [78, -80, 10] }, 'out'),
      at(770, { hip: [-9, -82, 0], py: 7, cy: 15, lean: -11, nod: -3, R: [20, -118, 10], by: 0, el: 82, FR: [76, -78, 10] }, 'io'),
      at(870, { hip: [-5, -81, 0], py: 10, cy: 17, lean: -3, nod: 1, R: [24, -116, 10], by: 0, el: 64, FR: [34, -36, 9] }, 'io'),
      at(910, { hip: [-2, -79.5, 0], py: 12, cy: 19, lean: 4, nod: 3, R: [30, -104, 10], by: 20, el: 32, FR: [25, -8, 6] }, 'io'),
      at(950, { hip: [-1, -79, 0], py: 13, cy: 20, lean: 6, nod: 4, R: [34, -104, 14], by: 40, el: 14, n: [0, 0.7, 0.7], FR: [24, 0, 6] }, 'out'),
      at(1000, {}, 'io'),
    ],
    phases: null,
  },





  tsubame: {
    name: 'Tsubame-gaeshi (down, and straight back up)', feet: FEET,
    keys: [
      at(0, {}),
      at(28, K_UP1, 'io'),
      at(50, K_EAR, 'io'),
      at(71, { ...K_UP3, R: [16, -174, 21], by: 140, el: 58 }, 'io'),
      at(98, { hip: [6, -79, 0], py: 9, cy: 20, lean: 3, nod: 2, R: [46, -160, 24], by: 35, el: 36, n: [0, 0.6, 0.8], pR: [-0.3, 0.4, 0.85], pL: [0.2, 0.8, -0.6] }, 'in'),
      at(122, { hip: [13, -77, 0], py: -2, cy: 2, lean: 7, nod: 6, R: [68, -128, 4], by: -14, el: -22, n: [0, 0.6, 0.8] }, 'lin'),
      at(160, { hip: [15, -74, 0], py: -8, cy: -8, lean: 10, nod: 7, R: [60, -97, -10], by: -46, el: -38, n: [0, 0.6, 0.8] }, 'out'),
      at(195, { hip: [15, -74.5, 0], py: -6, cy: -4, lean: 10, nod: 7, R: [58, -97, -11], by: -44, el: -36, n: [0, 0, -1] }, 'io'),
      at(232, { hip: [15, -76, 0], py: 4, cy: 8, lean: 7, nod: 5, R: [64, -110, 0], by: -8, el: 0, n: [0, 0, -1] }, 'in'),
      at(262, { hip: [15, -78, 0], py: 10, cy: 18, lean: 3, nod: 1, R: [58, -140, 4], by: 6, el: 50, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8] }, 'lin'),
      at(350, { hip: [14, -80, 0], py: 13, cy: 22, lean: 0, nod: -1, R: [46, -162, 6], by: 10, el: 82, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8] }, 'out'),
      at(480, { hip: [6, -79, 0], py: 13, cy: 20, lean: 4, nod: 3, R: [50, -128, 4], by: 2, el: 44, pR: [-0.3, 0.7, 0.6], pL: [-0.3, 0.7, -0.6] }, 'io'),
      at(620, {}, 'io'),
    ],
    phases: { windup: [0, 90], active: [90, 150], hits: [[90, 150], [230, 290]], recovery: [290, 620] },
  },


  renga: {
    name: 'Kurenai renga (kesa, gyaku-kesa, chiburi)', feet: FEET,
    keys: [
      at(0, {}),
      at(28, K_UP1, 'io'),
      at(50, K_EAR, 'io'),
      at(71, { ...K_UP3, R: [16, -174, 21], by: 140, el: 58 }, 'io'),
      at(98, { hip: [6, -79, 0], py: 9, cy: 20, lean: 3, nod: 2, R: [46, -160, 24], by: 35, el: 36, n: [0, 0.6, 0.8], pR: [-0.3, 0.4, 0.85], pL: [0.2, 0.8, -0.6] }, 'in'),
      at(121, { hip: [12, -77, 0], py: -2, cy: 2, lean: 7, nod: 6, R: [68, -128, 4], by: -14, el: -22, n: [0, 0.6, 0.8] }, 'lin'),
      at(145, { hip: [14, -74.5, 0], py: -8, cy: -8, lean: 10, nod: 7, R: [60, -97, -10], by: -46, el: -38, n: [0, 0.6, 0.8] }, 'out'),

      at(181, { hip: [13, -77, -0.5], py: 6, cy: 6, lean: 6, nod: 5, R: [58, -120, -16], by: -110, el: -4, n: [0, -0.6, 0.8], pR: [-0.6, 0.1, 0.8], pL: [0.2, -0.1, -0.9] }, 'io'),
      at(212, { hip: [12, -80, -1], py: 6, cy: 8, lean: 2, nod: 2, R: [32, -148, -15], by: -140, el: 10, n: [0, -0.6, 0.8], pR: [0.5, 0.75, 0.2], pL: [-0.75, -0.2, -0.65] }, 'io'),
      at(237, { hip: [12, -81.5, -1], py: 6, cy: 8, lean: 0, nod: 1, R: [24, -156, -15], by: -152, el: 20, n: [0, -0.6, 0.8], pR: [0.5, 0.75, 0.2], pL: [-0.75, -0.2, -0.65] }, 'out'),
      at(262, { hip: [16, -78, 0], py: 9, cy: 12, lean: 3, nod: 2, R: [51, -162, -2], by: -35, el: 40, n: [0, -0.6, 0.8], pR: [0, 0.45, 0.9], pL: [-0.65, 0, -0.8] }, 'in'),
      at(277, { hip: [17, -77, 0], py: 10, cy: 15, lean: 5, nod: 4, R: [64, -147, -4], by: -12, el: 10, n: [0, -0.6, 0.8], pR: [-0.25, 0.6, 0.75], pL: [-0.45, 0.4, -0.8] }, 'lin'),
      at(293, { hip: [18, -76.5, 0], py: 12, cy: 20, lean: 7, nod: 6, R: [71, -128, 4], by: 14, el: -22, n: [0, -0.6, 0.8], pL: [-0.3, 0.7, -0.65] }, 'lin'),
      at(330, { hip: [19, -74, 0], py: 16, cy: 26, lean: 10, nod: 7, R: [64, -100, 20], by: 46, el: -37, n: [0, -0.6, 0.8] }, 'out'),
      at(400, { hip: [18.5, -74.5, 0], py: 16, cy: 25, lean: 9.5, nod: 7, R: [62, -101, 20], by: 45, el: -36, n: [0, -0.6, 0.8] }, 'io'),
      at(570, { hip: [7, -78, 0], py: 15, cy: 21, lean: 7, nod: 5, R: [55, -106, 8], by: 18, el: 6, n: [0, -0.3, 0.95] }, 'io'),
      at(720, {}, 'io'),
    ],
    phases: { windup: [0, 90], active: [90, 140], hits: [[90, 140], [260, 320]], recovery: [320, 720] },
  },





  oroshi: {
    name: 'Yama-oroshi (kesa, rising cut)', feet: FEET,
    keys: [
      at(0, {}),
      at(28, K_UP1, 'io'),
      at(50, K_EAR, 'io'),
      at(71, { ...K_UP3, R: [16, -174, 21], by: 140, el: 58 }, 'io'),
      at(98, { hip: [6, -79, 0], py: 9, cy: 20, lean: 3, nod: 2, R: [46, -160, 24], by: 35, el: 36, n: [0, 0.6, 0.8], pR: [-0.3, 0.4, 0.85], pL: [0.2, 0.8, -0.6] }, 'in'),
      at(121, { hip: [12, -77, 0], py: -2, cy: 2, lean: 7, nod: 6, R: [68, -128, 4], by: -14, el: -22, n: [0, 0.6, 0.8] }, 'lin'),
      at(145, { hip: [14, -74.5, 0], py: -8, cy: -8, lean: 10, nod: 7, R: [64, -100, -8], by: -40, el: -36, n: [0, 0.6, 0.8] }, 'out'),

      at(200, { hip: [14, -74, 0], py: -6, cy: -4, lean: 10, nod: 7, R: [62, -98, -4], by: -32, el: -40, n: [0, 0, 1] }, 'io'),
      at(240, { hip: [13, -74, 0], py: -4, cy: 0, lean: 9, nod: 6, R: [60, -97, 2], by: -24, el: -42, n: [0, -0.6, -0.8] }, 'io'),
      at(262, { hip: [14, -76, 0], py: 0, cy: 6, lean: 7, nod: 4, R: [64, -110, 6], by: -10, el: -18, n: [0, -0.6, -0.8] }, 'in'),
      at(290, { hip: [13, -78, 0], py: 6, cy: 12, lean: 4, nod: 2, R: [62, -132, 6], by: 2, el: 22, n: [0, -0.6, -0.8] }, 'lin'),
      at(320, { hip: [11, -79.5, 0], py: 10, cy: 16, lean: 2, nod: 0, R: [52, -150, 6], by: 6, el: 56, n: [0, -0.6, -0.8], pR: [-0.4, 0.5, 0.75], pL: [-0.3, 0.6, -0.75] }, 'out'),
      at(400, { hip: [10.5, -79.5, 0], py: 10, cy: 16, lean: 2, nod: 0, R: [51, -149, 6], by: 6, el: 58, n: [0, -0.6, -0.8], pR: [-0.4, 0.5, 0.75], pL: [-0.3, 0.6, -0.75] }, 'io'),
      at(570, { hip: [6, -78, 0], py: 14, cy: 21, lean: 6, nod: 4, R: [50, -116, 6], by: 6, el: 26, n: [0, 0, 1] }, 'io'),
      at(720, {}, 'io'),
    ],
    phases: { windup: [0, 90], active: [90, 140], hits: [[90, 140], [260, 320]], recovery: [320, 720] },
  },





  higan: {
    name: 'Higanbana (iai dash through him)', feet: { R: [44, 8], L: [-34, -7] }, ownFeet: [0, 500], saya: true, turnFrom: 570, jump: [[160, 166]],
    keys: [
      at(0, { iai: true, d: 0, n: [0, -0.6, 0.8], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }),
      at(80, { hip: [-6, -66, 0], py: 6, cy: 8, lean: 18, nod: 8, iai: true, d: 0.2, sby: -168, sel: -14, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'in'),
      at(160, { hip: [-5, -65, -1], py: 4, cy: 4, lean: 18, nod: 7, iai: true, d: 0.36, sby: -160, sel: -10, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'in'),
      at(166, { ...IAI_OUT, FR: [24, -4, 6], FL: [-22, -3, -6] }, 'lin'),
      at(205, { hip: [16, -66, 0], py: 4, cy: 6, lean: 22, nod: 8, R: [68, -102, -10], by: -40, el: 0, n: [0, -1, 0], lw: 0, pL: [-0.2, 0.9, -0.6], FR: [44, -16, 8], FL: [-34, -12, -7] }, 'in'),
      at(270, IAI2, 'out'),
      at(400, { ...IAI2, hip: [17, -64.5, 0], R: [60, -101, 28], by: 63, el: 6 }, 'io'),
      at(500, { hip: [10, -72, 0], py: 16, cy: 26, lean: 9, nod: 5, R: [56, -100, 18], by: 26, el: -24, n: [0, 0.45, 0.9], pR: [-0.2, 0.9, 0.4], pL: [-0.2, 0.9, -0.6], lw: 0.4, FR: [44, 0, 8], FL: [-34, 0, -7] }, 'out3'),

      at(570, { hip: [6, -75, 0], py: 15, cy: 24, lean: 8, nod: 5, R: [50, -104, 10], by: 12, el: 0, n: [0, 0.4, 0.92], lw: 0.8 }, 'io'),
      at(640, yawK({ hip: [3, -75, 0], py: 14, cy: 22, lean: 7, nod: 4, R: [44, -103, 4], el: 12 }, 80), 'io'),
      at(690, yawK({ hip: [1, -76, 0], py: 14, cy: 22, lean: 6, nod: 4, R: [40, -101, 2], el: 16 }, 150), 'io'),
      at(720, yawK({ hip: [0, -77, 0], R: [38, -101, 2] }, 180), 'io'),
    ],
    phases: { windup: [0, 170], active: [170, 270], recovery: [270, 720] },
  },


  issen: {
    name: 'Kurenai issen (ki: the crimson flash through him)', feet: { R: [44, 8], L: [-34, -7] }, ownFeet: [0, 800], saya: true, turnFrom: 850, jump: [[294, 300]],
    keys: [
      at(0, { iai: true, d: 0, n: [0, -0.6, 0.8], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }),
      at(260, { hip: [-7, -63, 0], py: 6, cy: 8, lean: 20, nod: 8, iai: true, d: 0.16, sby: -166, sel: -12, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),
      at(294, { hip: [-6, -63, -1], py: 4, cy: 4, lean: 20, nod: 7, iai: true, d: 0.36, sby: -160, sel: -10, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'in'),
      at(300, { ...IAI_OUT, FR: [24, -4, 6], FL: [-22, -3, -6] }, 'lin'),
      at(370, { hip: [18, -64, 0], py: 4, cy: 6, lean: 24, nod: 8, R: [68, -102, -10], by: -40, el: 0, n: [0, -1, 0], lw: 0, pL: [-0.2, 0.9, -0.6], FR: [44, -18, 8], FL: [-34, -14, -7] }, 'in'),
      at(445, IAI2, 'out'),
      at(640, { ...IAI2, hip: [17, -64.5, 0], R: [60, -101, 28], by: 63, el: 6 }, 'io'),
      at(800, { hip: [10, -72, 0], py: 16, cy: 26, lean: 9, nod: 5, R: [56, -100, 18], by: 26, el: -24, n: [0, 0.45, 0.9], pR: [-0.2, 0.9, 0.4], pL: [-0.2, 0.9, -0.6], lw: 0.4, FR: [44, 0, 8], FL: [-34, 0, -7] }, 'out3'),
      at(850, { hip: [6, -75, 0], py: 15, cy: 24, lean: 8, nod: 5, R: [50, -104, 10], by: 12, el: 0, n: [0, 0.4, 0.92], lw: 0.8 }, 'io'),
      at(920, yawK({ hip: [3, -75, 0], py: 14, cy: 22, lean: 7, nod: 4, R: [44, -103, 4], el: 12 }, 80), 'io'),
      at(970, yawK({ hip: [1, -76, 0], py: 14, cy: 22, lean: 6, nod: 4, R: [40, -101, 2], el: 16 }, 150), 'io'),
      at(1000, yawK({ hip: [0, -77, 0], R: [38, -101, 2] }, 180), 'io'),
    ],
    phases: { windup: [0, 300], active: [300, 450], recovery: [450, 1000] },
  },





  kage: {
    name: 'Kage-iai (feint, step back, lunging draw-cut)', feet: { R: [44, 8], L: [-34, -7] }, ownFeet: [0, 470], saya: true, jump: [[212, 216]],
    steps: [{ foot: 'R', t0: 480, t1: 600, dx: -20, dz: -2, h: 5 }, { foot: 'L', t0: 540, t1: 660, dx: 12, dz: 1, h: 4 }],
    keys: [
      at(0, { iai: true, d: 0, n: [0, -0.6, 0.8], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }),
      at(68, { hip: [5, -78, 0], py: 6, cy: 6, lean: 11, nod: 6, iai: true, d: 0.04, sby: -176, sel: -22, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'out3'),
      at(159, { hip: [-6, -69, 0], py: 6, cy: 8, lean: 16, nod: 7, iai: true, d: 0.2, sby: -168, sel: -14, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),
      at(205, { hip: [-5, -66, -1], py: 4, cy: 4, lean: 18, nod: 7, iai: true, d: 0.3, sby: -162, sel: -11, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0, FR: [24, 0, 6], FL: [-22, 0, -6] }, 'in'),
      at(212, { hip: [-5, -66, -1], py: 4, cy: 4, lean: 18, nod: 7, iai: true, d: 0.36, sby: -160, sel: -10, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0, FR: [24, -2, 6], FL: [-22, -1, -6] }, 'in'),
      at(216, { ...IAI_FWD, FR: [24, -4, 6], FL: [-22, -3, -6] }, 'lin'),
      at(236, { hip: [2, -67, -1], py: 3, cy: 3, lean: 18, nod: 7, R: [38, -97, -28], by: -40, el: 0, n: [0, -1, 0], pR: [-0.3, 0.6, 0.7], pL: [-0.2, 0.9, -0.6], lw: 0, FR: [34, -12, 7], FL: [-28, -9, -7] }, 'io'),
      at(250, { hip: [10, -67, 0], py: 5, cy: 5, lean: 19, nod: 7, R: [50, -102, -32], by: -30, el: 0, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0, FR: [40, -16, 8], FL: [-32, -12, -7] }, 'in'),
      at(280, { hip: [16, -66, 0], py: 7, cy: 8, lean: 21, nod: 8, R: [70, -104, -4], by: 0, el: 2, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0, FR: [44, -10, 8], FL: [-34, -10, -7] }, 'lin'),
      at(335, { ...IAI2, R: [64, -102, 24], by: 55, el: 2, FR: [44, 0, 8], FL: [-34, 0, -7] }, 'out'),
      at(420, { ...IAI2, hip: [17, -64.5, 0], R: [60, -101, 26], by: 56, el: 5, lw: 0.1, FR: [44, 0, 8], FL: [-34, 0, -7] }, 'io'),
      at(560, { hip: [8, -74, 0], py: 15, cy: 24, lean: 9, nod: 5, R: [54, -104, 12], by: 22, el: 8, n: [0, -0.4, 0.92], FR: [44, 0, 8], FL: [-34, 0, -7] }, 'io'),
      at(700, {}, 'io'),
    ],
    phases: { windup: [0, 250], active: [250, 335], recovery: [335, 700] },
  },




  ryusei: {
    name: 'Ryusei (leaping draw, cut from above)', feet: { R: [44, 8], L: [-34, -7] }, ownFeet: [0, 560], saya: true, jump: [[128, 132]],
    steps: [{ foot: 'R', t0: 600, t1: 720, dx: -20, dz: -2, h: 5 }, { foot: 'L', t0: 660, t1: 780, dx: 12, dz: 1, h: 4 }],
    keys: [
      at(0, { iai: true, d: 0, n: [0, -0.6, 0.8], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }),
      at(100, { hip: [-4, -70, 0], py: 6, cy: 8, lean: 14, nod: 7, iai: true, d: 0.24, sby: -168, sel: -14, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'in'),
      at(118, { hip: [-4, -69, -1], py: 5, cy: 6, lean: 15, nod: 7, iai: true, d: 0.32, sby: -162, sel: -11, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0, FR: [24, 0, 6], FL: [-22, 0, -6] }, 'in'),
      at(128, { hip: [-4, -70, -1], py: 5, cy: 6, lean: 15, nod: 7, iai: true, d: 0.36, sby: -160, sel: -10, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0, FR: [24, -1, 6], FL: [-22, -1, -6] }, 'in'),

      at(132, { ...IAI_OUT, hip: [-4, -70, -1], FR: [24, -6, 6], FL: [-22, -5, -6] }, 'lin'),
      at(190, { hip: [-3, -86, 0], py: 10, cy: 22, lean: 4, nod: 3, R: [24, -156, -8], by: -170, el: 58, n: [0, -0.6, 0.8], pR: [-0.4, 0.5, 0.75], pL: [-0.2, 0.9, -0.6], lw: 0, FR: [28, -16, 7], FL: [-24, -12, -6] }, 'io'),
      at(262, { hip: [-3, -96, 0], py: 12, cy: 34, lean: 1, nod: 1, R: [30, -182, 2], by: 0, el: 100, n: [0, 0, 1], pR: [-1, -0.25, 0.3], pL: [-0.2, 0.9, -0.6], lw: 0, FR: [28, -27, 7], FL: [-22, -19, -6] }, 'io'),
      at(326, { hip: [0, -95, 0], py: 11, cy: 36, lean: 1, nod: 1, R: [26, -186, 2], by: 0, el: 105, n: [0, 0, 1], pR: [-1, -0.25, 0.3], pL: [-0.2, 0.9, -0.6], lw: 0, FR: [30, -26, 7], FL: [-22, -18, -6] }, 'out'),

      at(380, { hip: [12, -86, 0], py: 5, cy: 18, lean: 8, nod: 4, R: [46, -178, 3], by: 0, el: 72, pR: [-0.3, 0.4, 0.85], pL: [-0.2, 0.9, -0.6], lw: 0, FR: [44, -14, 8], FL: [-34, -10, -7] }, 'in'),
      at(440, { hip: [22, -66, 0], py: 0, cy: 2, lean: 12, nod: 6, R: [78, -120, 2], by: 0, el: -2, pL: [-0.2, 0.9, -0.6], lw: 0, FR: [44, 0, 8], FL: [-34, 0, -7] }, 'lin'),
      at(500, { hip: [24, -62, 0], py: 0, cy: 2, lean: 14, nod: 7, R: [80, -106, 2], by: 0, el: -16, pL: [-0.2, 0.9, -0.6], lw: 0, FR: [44, 0, 8], FL: [-34, 0, -7] }, 'out'),
      at(640, { hip: [23.5, -62.5, 0], py: 1, cy: 3, lean: 13.5, nod: 7, R: [79, -107, 2], by: 0, el: -13, pL: [-0.2, 0.9, -0.6], lw: 0.1, FR: [44, 0, 8], FL: [-34, 0, -7] }, 'io'),
      at(840, { hip: [10, -74, 0], py: 9, cy: 14, lean: 8, nod: 5, R: [56, -110, 2], by: -1, el: 8, FR: [44, 0, 8], FL: [-34, 0, -7] }, 'io'),
      at(1000, {}, 'io'),
    ],
    phases: { windup: [0, 380], active: [380, 500], recovery: [500, 1000] },
  },




  yama: {
    name: 'Yama kudaki (ki: the leap that splits the ground)', feet: { R: [44, 8], L: [-34, -7] }, ownFeet: [0, 540], air: true,
    steps: [{ foot: 'R', t0: 860, t1: 950, dx: -20, dz: -2, h: 6 }, { foot: 'L', t0: 940, t1: 1030, dx: 12, dz: 1, h: 5 }],
    keys: [
      at(0, {}),

      at(200, { hip: [-6, -62, 0], py: 14, cy: 24, lean: 18, nod: 8, R: [50, -86, 4], by: 0, el: 4, pR: [-0.3, 0.8, 0.6], pL: [-0.3, 0.8, -0.5] }, 'io'),
      at(250, { hip: [-6, -60, 0], py: 14, cy: 24, lean: 19, nod: 8, R: [50, -84, 4], by: 0, el: 4, pR: [-0.3, 0.8, 0.6], pL: [-0.3, 0.8, -0.5] }, 'out'),

      at(300, { hip: [-2, -82, 0], py: 14, cy: 30, lean: 3, nod: 3, R: [44, -140, 4], by: 0, el: 62, pR: [-0.5, 0.45, 0.75], pL: [-0.5, 0.45, -0.75], FR: [24, -16, 6], FL: [-22, -20, -6] }, 'io'),
      at(335, { hip: [-3, -81, 0], py: 13, cy: 34, lean: 2, nod: 2, R: [30, -162, 4], by: 0, el: 96, pR: [-0.2, 0.9, 0.4], pL: [-0.6, 0.3, -0.75], FR: [32, -30, 7], FL: [-14, -36, -7] }, 'io'),
      at(358, { hip: [-3.5, -81.2, 0], py: 12.5, cy: 36, lean: 2, nod: 2, R: [21, -171, 4], by: 0, el: 110, pR: [-0.3, 0.3, 0.9], pL: [-0.8, 0, -0.6], FR: [34, -36, 7], FL: [-12, -42, -7] }, 'io'),
      at(382, { hip: [-4, -81.5, 0], py: 12, cy: 38, lean: 2, nod: 2, R: [10, -180, 3], by: 0, el: 122, ...UPEL, FR: [34, -38, 7], FL: [-10, -44, -7] }, 'io'),
      at(410, { hip: [-5, -82, 0], py: 11, cy: 40, lean: 1, nod: 1, R: [-8, -185, 3], by: 0, el: 150, ...UPEL, FR: [36, -34, 7], FL: [-12, -40, -7] }, 'io'),

      at(430, { hip: [0, -81, 0], py: 8, cy: 30, lean: 3, nod: 2, R: [10, -180, 3], by: 0, el: 128, pR: [-0.8, -0.1, 0.55], pL: [-0.85, -0.1, -0.5], FR: [38, -26, 8], FL: [-18, -30, -7] }, 'io'),
      at(450, { hip: [5, -79, 0], py: 4, cy: 16, lean: 8, nod: 4, R: [44, -166, 3], by: 0, el: 70, pR: [-0.3, 0.4, 0.85], pL: [-0.5, 0.2, -0.85], FR: [42, -14, 8], FL: [-26, -16, -7] }, 'io'),
      at(487, { hip: [9, -71, 0], py: 1, cy: 6, lean: 18, nod: 8, R: [72, -128, 2], by: 0, el: 6, pR: [-0.25, 0.6, 0.75], pL: [-0.4, 0.5, -0.8], FR: [44, -6, 8], FL: [-34, -7, -7] }, 'lin'),
      at(522, { hip: [10, -60, 0], py: 0, cy: 3, lean: 30, nod: 13, R: [72, -76, 2], by: 0, el: -26, pR: [-0.15, 0.9, 0.5], pL: [-0.2, 0.9, -0.5], FR: [44, 0, 8], FL: [-34, 0, -7] }, 'out3'),
      at(780, { hip: [10, -59, 0], py: 1, cy: 4, lean: 29, nod: 13, R: [71, -77, 2], by: 0, el: -24, pR: [-0.15, 0.9, 0.5], pL: [-0.2, 0.9, -0.5], FR: [44, 0, 8], FL: [-34, 0, -7] }, 'io'),
      at(870, { hip: [6, -70, 0], py: 8, cy: 14, lean: 16, nod: 8, R: [56, -94, 2], by: 0, el: 6 }, 'io'),
      at(940, { hip: [3, -75, 0], py: 11, cy: 18, lean: 10, nod: 6, R: [46, -100, 2], by: 0, el: 14 }, 'io'),
      at(990, { hip: [1, -78, 0], py: 13, cy: 21, lean: 7, nod: 4, R: [40, -104, 2], by: -1, el: 17 }, 'io'),
      at(1040, {}, 'io'),
    ],
    phases: { windup: [0, 450], active: [450, 560], recovery: [560, 1040] },
  },


  airCut: {
    name: 'Air chase cut (oikake)', feet: FEET, ownFeet: true, air: true,
    keys: [
      at(0, { FR: [24, -6, 6], FL: [-22, -8, -6] }),
      at(45, { ...K_UP1, FR: [26, -18, 7], FL: [-18, -24, -7] }, 'io'),
      at(85, { ...K_EAR, FR: [28, -26, 7], FL: [-14, -34, -7] }, 'io'),
      at(115, { ...K_UP3, FR: [30, -30, 7], FL: [-12, -38, -7] }, 'io'),
      at(140, { ...K_TOP, FR: [30, -32, 7], FL: [-12, -40, -7] }, 'out'),
      at(160, { ...K_TOP, hip: [0, -81, 1], R: [0, -182, 20], by: 158, el: 48, FR: [31, -32, 7], FL: [-12, -39, -7] }, 'io'),
      at(195, { hip: [8, -79, 0], py: 7, cy: 18, lean: 4, nod: 2, R: [50, -160, 24], by: 35, el: 36, n: [0, 0.6, 0.8], pR: [-0.3, 0.4, 0.85], pL: [0.2, 0.8, -0.6], FR: [32, -30, 7], FL: [-12, -37, -7] }, 'in'),
      at(225, { hip: [12, -77.5, 0], py: -2, cy: 2, lean: 7, nod: 6, R: [68, -128, 4], by: -14, el: -22, n: [0, 0.6, 0.8], FR: [30, -26, 7], FL: [-14, -32, -7] }, 'lin'),
      at(275, { hip: [13, -75, 0], py: -9, cy: -9, lean: 10, nod: 7, R: [62, -97, -10], by: -46, el: -39, n: [0, 0.6, 0.8], FR: [28, -20, 7], FL: [-16, -26, -7] }, 'out'),
      at(460, { hip: [4, -79, 0], py: 6, cy: 10, lean: 7, nod: 5, R: [50, -106, -3], by: -18, el: 6, n: [0, 0.4, 0.92], FR: [26, -12, 7], FL: [-20, -16, -7] }, 'io'),
    ],
    phases: { windup: [0, 170], active: [170, 270], recovery: [270, 460] },
  },


  airSpike: {
    name: 'Air spike (otoshi)', feet: FEET, ownFeet: true, air: true,
    keys: [
      at(0, { hip: [4, -79, 0], py: 6, cy: 10, lean: 7, nod: 5, R: [50, -106, -3], by: -18, el: 6, n: [0, 0.4, 0.92], FR: [26, -12, 7], FL: [-20, -16, -7] }),
      at(26, { ...K_UP1, FR: [27, -18, 7], FL: [-18, -22, -7] }, 'io'),
      at(46, { ...K_EAR, FR: [28, -22, 7], FL: [-16, -26, -7] }, 'io'),
      at(65, { ...K_UP3, R: [24, -168, 22], by: 130, el: 62, FR: [28, -24, 7], FL: [-15, -28, -7] }, 'io'),
      at(93, { hip: [8, -79, 0], py: 7, cy: 18, lean: 4, nod: 2, R: [50, -160, 24], by: 35, el: 36, n: [0, 0.6, 0.8], pR: [-0.3, 0.4, 0.85], pL: [0.2, 0.8, -0.6], FR: [28, -22, 7], FL: [-15, -26, -7] }, 'in'),
      at(123, { hip: [12, -77, 0], py: -2, cy: 2, lean: 10, nod: 7, R: [70, -126, 4], by: -10, el: -26, n: [0, 0.6, 0.8], FR: [28, -18, 7], FL: [-16, -22, -7] }, 'lin'),
      at(170, { hip: [13, -75, 0], py: -6, cy: -4, lean: 14, nod: 8, R: [66, -104, -2], by: -18, el: -40, n: [0, 0.6, 0.8], FR: [27, -12, 7], FL: [-18, -14, -7] }, 'out'),
      at(360, { hip: [6, -77, 0], py: 4, cy: 8, lean: 10, nod: 6, R: [54, -104, 0], by: -10, el: -6, n: [0, 0.5, 0.86], FR: [26, -6, 7], FL: [-20, -8, -7] }, 'io'),
    ],
    phases: { windup: [0, 70], active: [70, 170], recovery: [170, 360] },
  },





  sandan: {
    name: 'Sandan-giri (down, up, down)', feet: FEET,
    keys: [
      at(0, {}),
      at(26, K_UP1, 'io'),
      at(47, K_EAR, 'io'),
      at(67, { ...K_UP3, R: [24, -168, 22], by: 130, el: 62 }, 'io'),
      at(93, { hip: [6, -79, 0], py: 9, cy: 20, lean: 3, nod: 2, R: [46, -160, 24], by: 35, el: 36, n: [0, 0.6, 0.8], pR: [-0.3, 0.4, 0.85], pL: [0.2, 0.8, -0.6] }, 'in'),
      at(115, { hip: [11, -77, 0], py: -2, cy: 2, lean: 7, nod: 6, R: [66, -128, 4], by: -14, el: -22, n: [0, 0.6, 0.8] }, 'lin'),
      at(140, { hip: [12, -74.5, 0], py: -8, cy: -8, lean: 10, nod: 7, R: [58, -97, -10], by: -46, el: -38, n: [0, 0.6, 0.8] }, 'out'),
      at(170, { hip: [12, -75, 0], py: -6, cy: -4, lean: 10, nod: 7, R: [56, -97, -11], by: -44, el: -36, n: [0, 0, -1] }, 'io'),
      at(204, { hip: [12, -76.5, 0], py: 4, cy: 8, lean: 7, nod: 5, R: [62, -110, 0], by: -8, el: 0, n: [0, 0, -1] }, 'in'),
      at(230, { hip: [12, -78, 0], py: 10, cy: 18, lean: 3, nod: 1, R: [56, -140, 4], by: 6, el: 50, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8] }, 'lin'),
      at(262, { hip: [11, -80, 0], py: 13, cy: 22, lean: 0, nod: -1, R: [44, -162, 6], by: 10, el: 82, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8] }, 'out'),

      at(285, { hip: [9, -81, 0.8], py: 20, cy: 34, lean: 2, nod: 2, R: [35, -164, 14], by: 95, el: 66, n: [0, 0.55, 0.84], pR: [-0.35, 0.4, 0.85], pL: [0.1, 0.5, -0.85] }, 'io'),
      at(305, { hip: [8, -81.2, 1], py: 21, cy: 36, lean: 1, nod: 2, R: [17, -176, 17], by: 150, el: 54, n: [0, 0.6, 0.8], ...UPEL, pL: [0.6, 0.6, -0.4] }, 'io'),
      at(335, { hip: [14, -79, 0], py: 7, cy: 18, lean: 4, nod: 2, R: [54, -160, 24], by: 35, el: 36, n: [0, 0.6, 0.8], pR: [-0.3, 0.4, 0.85], pL: [0.2, 0.8, -0.6] }, 'in'),
      at(362, { hip: [17, -76.5, 0], py: -2, cy: 2, lean: 8, nod: 6, R: [70, -128, 4], by: -14, el: -22, n: [0, 0.6, 0.8] }, 'lin'),
      at(400, { hip: [18, -74, 0], py: -9, cy: -9, lean: 11, nod: 7, R: [62, -96, -10], by: -46, el: -39, n: [0, 0.6, 0.8] }, 'out'),
      at(500, { hip: [17.5, -74.5, 0], py: -8, cy: -8, lean: 10.5, nod: 7, R: [60, -98, -10], by: -45, el: -34, n: [0, 0.6, 0.8] }, 'io'),
      at(620, { hip: [7, -78, 0], py: 5, cy: 9, lean: 7, nod: 5, R: [52, -106, -3], by: -18, el: 6, n: [0, 0.4, 0.92] }, 'io'),
      at(760, {}, 'io'),
    ],
    phases: { windup: [0, 80], active: [80, 130], hits: [[80, 130], [200, 250], [330, 400]], recovery: [400, 760] },
  },





  mawari: {
    name: 'Mawari (duck past him, turn, cut)', feet: { R: [30, 7], L: [-30, -7] }, ownFeet: [0, 200], turnAt: 210,
    keys: [
      at(0, {}),

      at(25, { hip: [2, -78, 0], lean: 6, nod: 4, R: [34, -140, 14], by: 40, el: 84, n: [0, 0.5, 0.87], pR: [-0.2, 0.9, 0.4], pL: [-0.3, 0.8, -0.5], FR: [24, -5, 6], FL: [-22, -6, -6] }, 'io'),
      at(60, { hip: [3, -73, 0], lean: 14, nod: 7, R: [28, -146, 24], by: 150, el: 56, n: [0, 1, 0], pR: [-0.5, 0.5, 0.7], pL: [-0.5, 0.4, -0.75], FR: [30, -8, 7], FL: [-24, -7, -7] }, 'io'),
      at(82, { ...MW_DUCKU, hip: [4, -67, 0], lean: 20, nod: 9, R: [36, -96, 36], by: 156, el: 46, pR: [-0.75, 0.2, 0.65], pL: [-0.4, 0.6, -0.7], FR: [33, -10, 7], FL: [-26, -9, -7] }, 'io'),
      at(100, { ...MW_DUCKU, hip: [5, -62, 0], lean: 26, FR: [36, -11, 7], FL: [-28, -10, -7] }, 'io'),
      at(130, { ...MW_DUCKU, hip: [6, -58, 0], lean: 31, FR: [40, -12, 7], FL: [-30, -14, -7] }, 'io'),
      at(180, { ...yawK(MW_DUCKU, -20), FR: [30, -6, 7], FL: [-30, -6, -7] }, 'io'),
      at(200, { ...yawK({ ...MW_DUCKU, R: [-6, -90, 24] }, -45), FR: [30, 0, 7], FL: [-30, 0, -7] }, 'io'),
      at(209, yawK({ ...MW_DUCKU, R: [9, -87, 42] }, -70), 'lin'),
      at(211, yawK({ ...MW_DUCKU, R: [9, -87, 42] }, -250), 'lin'),

      at(245, yawK({ ...MW_TRAIL, el: 20 }, -290), 'io'),
      at(272, yawK(MW_IN, -335), 'in'),
      at(305, yawK(MW_MID, -360), 'lin'),
      at(350, yawK(MW_END, -360), 'out'),
      at(430, yawK({ ...MW_END, hip: [10, -76, 0], py: -6, cy: -2, lean: 8, nod: 5, R: [58, -106, -8], by: -30, el: 8, n: [0, 0.6, 0.8] }, -360), 'io'),
      at(500, yawK({ hip: [4, -78, 0], py: 8, cy: 14, lean: 7, nod: 5, R: [48, -106, 0], by: -8, el: 14 }, -360), 'io'),
      at(580, yawK({}, -360), 'io'),
    ],
    phases: { windup: [0, 270], active: [270, 350], recovery: [350, 580] },
  },




  kuruma: {
    name: 'Kuruma-giri (the wheel: one turn, a level cut)', feet: FEET,
    keys: [
      at(0, {}),
      at(60, { ...MW_WAKI, R: [4, -102, 30], by: 90, el: 0 }, 'io'),
      at(110, MW_WAKI, 'io'),
      at(140, yawK({ ...MW_WAKI, R: [-20, -100, 24] }, -30), 'in'),
      at(180, yawK(MW_WAKI, -130), 'lin'),
      at(220, yawK(MW_TRAIL, -240), 'lin'),
      at(256, yawK(MW_IN, -320), 'lin'),
      at(285, yawK(MW_MID, -360), 'lin'),
      at(325, yawK(MW_END, -360), 'out'),
      at(420, yawK({ hip: [10, -77, 0], py: -6, cy: -2, lean: 8, nod: 6, R: [58, -108, -8], by: -30, el: 8, n: [0, 0.6, 0.8] }, -360), 'io'),
      at(580, yawK({}, -360), 'io'),
    ],
    phases: { windup: [0, 200], active: [200, 300], recovery: [300, 580] },
  },








  kzAge: {
    name: 'Rising kick (keage, launcher)', feet: FEET, kick: 'R', kneeUp: 'R',
    keys: [
      at(0, {}),
      at(50, { hip: [-3, -80, 0], py: 12, cy: 20, lean: 1, nod: 3, R: [24, -106, 12], by: 60, el: 6, n: [0, 1, 0], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.5], FR: [25, -10, 7] }, 'io'),
      at(95, { hip: [-6, -81, 0], py: 11, cy: 19, lean: -2, nod: 2, R: [-6, -97, 22], by: 140, el: -14, n: [0, 1, 0], pR: [-0.6, 0.6, 0.6], pL: [0, 0.85, -0.6], FR: [28, -30, 9] }, 'io'),
      at(135, { hip: [-8, -82, 0], py: 10, cy: 17, lean: -6, nod: 0, R: [-34, -100, 16], by: 178, el: -24, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [31, -54, 10] }, 'io'),

      at(180, { hip: [-11, -84, 0], py: 8, cy: 15, lean: -13, nod: -3, R: [-38, -99, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [66, -116, 11] }, 'out'),
      at(235, { hip: [-12.5, -85, 0], py: 7, cy: 15, lean: -18, nod: -5, R: [-40, -98, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [52, -146, 12] }, 'out'),
      at(300, { hip: [-12.5, -85, 0], py: 7, cy: 15, lean: -19, nod: -6, R: [-40, -98, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [46, -150, 12] }, 'io'),

      at(390, { hip: [-8, -82, 0], py: 10, cy: 17, lean: -6, nod: 0, R: [-30, -100, 17], by: 178, el: -24, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [34, -58, 10] }, 'io'),
      at(480, { hip: [-3, -80, 0], py: 12, cy: 18, lean: 3, nod: 3, R: [-8, -96, 20], by: 172, el: -18, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [26, -12, 7] }, 'io'),
      at(560, { hip: [-2, -79.5, 0], py: 12, cy: 19, lean: 5, nod: 3, R: [24, -100, 34], by: 110, el: -6, n: [0, 1, 0], pR: [-0.7, 0.4, 0.6], pL: [0, 0.85, -0.6], FR: [24, -4, 6] }, 'io'),
      at(600, { hip: [-1, -79, 0], py: 13, cy: 20, lean: 6, nod: 4, R: [30, -103, 24], by: 70, el: 6, n: [0, 0.8, 0.6], pR: [-0.5, 0.6, 0.6], pL: [-0.1, 0.9, -0.5], FR: [24, 0, 6] }, 'out'),
      at(680, { hip: [-0.5, -79, 0], py: 13, cy: 20, lean: 6, nod: 4, R: [38, -106, 6], by: 8, el: 22, n: [0, 0.5, 0.86], pR: [-0.2, 0.95, 0.6], pL: [-0.15, 1, -0.6] }, 'io'),
      at(900, {}, 'io'),
    ],
    phases: { windup: [0, 170], active: [170, 300], recovery: [300, 900] },
  },



  kzTengu: {
    name: 'Tengu-giri (air rising cut)', feet: FEET, ownFeet: true, air: true,
    keys: [
      at(0, { FR: [24, -6, 6], FL: [-22, -8, -6] }),
      at(60, { hip: [-3, -79, 1], py: 20, cy: 32, lean: 5, nod: 5, R: [4, -100, 28], by: 90, el: -16, n: [0, 0, -1], pR: [-0.2, 0.9, 0.4], pL: [-0.3, 0.8, -0.5], FR: [28, -24, 7], FL: [-14, -30, -7] }, 'io'),
      at(130, { hip: [-5, -78, 1], py: 26, cy: 40, lean: 6, nod: 5, R: [-6, -96, 26], by: 160, el: -32, n: [0, 0, -1], pR: [-0.2, 0.9, 0.4], pL: [-0.3, 0.8, -0.5], FR: [30, -34, 7], FL: [-10, -42, -7] }, 'io'),
      at(165, { hip: [-5.5, -77.5, 1], py: 27, cy: 41, lean: 6.5, nod: 5, R: [-7, -95, 26], by: 162, el: -33, n: [0, 0, -1], pR: [-0.2, 0.9, 0.4], pL: [-0.3, 0.8, -0.5], FR: [30, -35, 7], FL: [-10, -43, -7] }, 'out'),
      at(188, { hip: [1, -77, 1], py: 18, cy: 30, lean: 8, nod: 6, R: [26, -100, 26], by: 120, el: -36, n: [0, 0, -1], pR: [-0.2, 0.9, 0.4], pL: [-0.3, 0.8, -0.5], FR: [31, -35, 7], FL: [-10, -42, -7] }, 'in'),
      at(205, { hip: [6, -77, 0], py: 10, cy: 18, lean: 8, nod: 6, R: [50, -100, 16], by: 40, el: -30, n: [0, 0, -1], FR: [32, -34, 7], FL: [-10, -40, -7] }, 'in'),
      at(228, { hip: [11, -78, 0], py: 4, cy: 8, lean: 6, nod: 4, R: [62, -118, 6], by: 4, el: 10, n: [0, 0, -1], FR: [32, -32, 7], FL: [-11, -38, -7] }, 'lin'),
      at(270, { hip: [13, -80, 0], py: 0, cy: 2, lean: 2, nod: 0, R: [54, -148, -2], by: -6, el: 62, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8], FR: [30, -28, 7], FL: [-12, -34, -7] }, 'lin'),
      at(330, { hip: [13, -80, 0], py: 0, cy: 2, lean: 0, nod: -1, R: [44, -164, -4], by: -8, el: 82, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8], FR: [28, -20, 7], FL: [-14, -26, -7] }, 'out'),
      at(460, { hip: [6, -79, 0], py: 8, cy: 14, lean: 4, nod: 3, R: [50, -130, 2], by: -4, el: 46, pR: [-0.3, 0.7, 0.6], pL: [-0.3, 0.7, -0.6], FR: [26, -10, 7], FL: [-20, -12, -7] }, 'io'),
    ],
    phases: { windup: [0, 185], active: [185, 270], recovery: [270, 460] },
  },




  kzIai: {
    name: 'Saya-gaeshi (sheathe, pause, draw-cut)', feet: FEET, jump: [[260.5, 263.5], [800, 804]], strikeFrom: 720,

    rest: [[90, 264]],
    steps: [{ foot: 'R', t0: 850, t1: 930, dx: 22, h: 6 }, { foot: 'R', t0: 1380, t1: 1500, dx: -22, h: 4 }],
    keys: [
      at(0, { hip: [17, -74, 0], py: -9, cy: -9, lean: 10, nod: 7, R: [60, -96, -10], by: -46, el: -39, n: [0, 0.6, 0.8] }),

      at(130, { hip: [6, -77, 0], py: 12, cy: 20, lean: 7, nod: 6, R: [52, -100, 14], by: 26, el: -24, n: [0, 0.45, 0.9], pR: [-0.2, 0.9, 0.4], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'out3'),
      at(220, { hip: [0, -79, 0], py: 18, cy: 30, lean: 5, nod: 6, R: [46, -110, 2], by: -150, el: -20, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),

      at(260.5, { hip: [0, -79, 0], py: 18, cy: 30, lean: 5, nod: 6, iai: true, d: 0.36, sby: -172, sel: -30, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0, at: 1 }, 'out'),
      at(263.5, { hip: [0, -79, 0], py: 18, cy: 30, lean: 5, nod: 6, iai: true, d: 0.36, sby: -172, sel: -30, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'in'),

      at(400, { hip: [-2, -73, -1], py: 14, cy: 22, lean: 10, nod: 7, iai: true, d: 0.08, sby: -170, sel: -22, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),
      at(470, { hip: [-3, -70, -1], py: 10, cy: 16, lean: 13, nod: 8, iai: true, d: 0, sby: -168, sel: -18, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'out'),

      at(720, { hip: [-3.5, -69.5, -1], py: 9, cy: 15, lean: 13.5, nod: 8, iai: true, d: 0, sby: -168, sel: -18, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),

      at(770, { hip: [-3, -70, 0], py: 6, cy: 10, lean: 12, nod: 7, iai: true, d: 0.26, sby: -168, sel: -14, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'in'),
      at(800, { hip: [-3, -70, -1], py: 4, cy: 4, lean: 14, nod: 6, iai: true, d: 0.36, sby: -160, sel: -10, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'in'),
      at(804, { hip: [-4, -70, -1], py: 4, cy: 4, lean: 12, nod: 5, R: [42, -85, -4], by: -152, el: -8, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'lin'),
      at(840, { hip: [-1, -71, -1.5], py: 2, cy: 2, lean: 11, nod: 5, R: [26, -97, -24], by: -146, el: -6, n: [0, -0.8, 0.6], pR: [-0.3, 0.6, 0.7], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),
      at(890, { hip: [4, -71, -1], py: 4, cy: 4, lean: 12, nod: 5, R: [26, -99, -28], by: -128, el: -4, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),

      at(910, { hip: [10, -70, 0], py: 6, cy: 6, lean: 13, nod: 6, R: [54, -103, -24], by: -70, el: 0, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'in'),
      at(945, { hip: [16, -69, 0], py: 8, cy: 8, lean: 14, nod: 7, R: [74, -105, -4], by: 0, el: 2, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'lin'),
      at(995, { hip: [18, -68, 0], py: 16, cy: 28, lean: 15, nod: 7, R: [68, -104, 22], by: 55, el: 2, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'out'),
      at(1150, { hip: [17.5, -68.5, 0], py: 16, cy: 27, lean: 14.5, nod: 7, R: [66, -104, 21], by: 53, el: 4, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0.2 }, 'io'),
      at(1400, { hip: [7, -77, 0], py: 15, cy: 22, lean: 7, nod: 5, R: [52, -107, 10], by: 22, el: 10, n: [0, -0.4, 0.92] }, 'io'),
      at(1700, {}, 'io'),
    ],

    phases: { windup: [0, 928], active: [928, 995], recovery: [995, 1700] },
  },



  kasumi: {
    name: 'Kasumi-gaeshi (low shin cut, then high)', feet: FEET,
    keys: [
      at(0, {}),
      at(120, { hip: [-6, -74, 2], py: 30, cy: 46, lean: 10, nod: 8, R: [10, -98, 32], by: 170, el: -24, n: [0, 0.6, 0.8] }, 'io'),
      at(160, { hip: [-6, -73.5, 2], py: 30, cy: 46, lean: 10, nod: 8, R: [10, -97, 32], by: 172, el: -24, n: [0, 1, 0] }, 'out'),
      at(200, { hip: [4, -68, 1], py: 14, cy: 30, lean: 18, nod: 12, R: [30, -86, 30], by: 120, el: -28, n: [0, 1, 0] }, 'in'),
      at(225, { hip: [12, -64, 0], py: 2, cy: 10, lean: 24, nod: 14, R: [58, -76, 14], by: 10, el: -26, n: [0, 1, 0] }, 'lin'),
      at(275, { hip: [14, -64, 0], py: -8, cy: -8, lean: 24, nod: 14, R: [54, -76, -12], by: -50, el: -24, n: [0, 1, 0] }, 'out'),


      at(330, { hip: [8, -74, 0], py: 4, cy: 6, lean: 12, nod: 7, R: [54, -110, -6], by: -40, el: 50, n: [0, -0.5, 0.87], pR: [-0.3, 0.4, 0.85], pL: [-0.1, 0.35, -0.9] }, 'io'),
      at(365, { hip: [3, -79, -0.5], py: 10, cy: 14, lean: 3, nod: 3, R: [38, -146, 0], by: -30, el: 80, n: [0, -0.5, 0.87], pR: [-0.3, 0.4, 0.85], pL: [-0.1, 0.35, -0.9] }, 'io'),
      at(390, { hip: [0, -81, -0.8], py: 9, cy: 12, lean: 2, nod: 2, R: [26, -166, -2], by: -75, el: 72, n: [0, -0.55, 0.84], pR: [-0.3, 0.6, 0.75], pL: [0.2, -0.1, -0.9] }, 'io'),
      at(420, { hip: [-1, -81.2, -1], py: 8, cy: 10, lean: 1, nod: 1, R: [14, -179, -3], by: -120, el: 58, n: [0, -0.6, 0.8], ...UPEL, pL: [-0.75, -0.2, -0.65] }, 'io'),
      at(455, { hip: [-2, -81.5, -1], py: 6, cy: 8, lean: 0, nod: 1, R: [0, -180, -4], by: -150, el: 50, n: [0, -0.6, 0.8], ...UPEL, pL: [-0.75, -0.2, -0.65] }, 'out'),
      at(480, { hip: [1, -81, -1], py: 7, cy: 9, lean: 1, nod: 2, R: [6, -181, -3], by: -150, el: 46, n: [0, -0.6, 0.8], ...UPEL, pL: [-0.75, -0.2, -0.65] }, 'io'),

      at(515, { hip: [10, -78, 0], py: 9, cy: 12, lean: 3, nod: 2, R: [47, -162, -2], by: -35, el: 40, n: [0, -0.6, 0.8], pR: [-0.55, 0.15, 0.85], pL: [-0.65, 0, -0.8] }, 'in'),
      at(531, { hip: [13, -77, 0], py: 10, cy: 15, lean: 5, nod: 4, R: [60, -147, -4], by: -12, el: 10, n: [0, -0.6, 0.8], pR: [-0.25, 0.6, 0.75], pL: [-0.4, 0.5, -0.8] }, 'lin'),
      at(547, { hip: [16, -76.5, 0], py: 12, cy: 20, lean: 7, nod: 6, R: [68, -128, 4], by: 14, el: -22, n: [0, -0.6, 0.8], pL: [-0.3, 0.7, -0.65] }, 'lin'),
      at(600, { hip: [18, -74, 0], py: 16, cy: 26, lean: 10, nod: 7, R: [62, -100, 20], by: 46, el: -37, n: [0, -0.6, 0.8] }, 'out'),
      at(650, { hip: [17.5, -74.5, 0], py: 16, cy: 25, lean: 9.5, nod: 7, R: [61, -100, 20], by: 45, el: -38, n: [0, -0.6, 0.8] }, 'io'),
      at(820, { hip: [7, -78, 0], py: 15, cy: 21, lean: 7, nod: 5, R: [55, -106, 8], by: 18, el: 6, n: [0, -0.3, 0.95] }, 'io'),
      at(1020, {}, 'io'),
    ],

    phases: { windup: [0, 212], active: [212, 275], hits: [[212, 275], [535, 600]], recovery: [600, 1020] },
  },


  hurtLow: {
    name: 'Hit low (shin cut, the leg buckles)', feet: FEET, tail: 3,
    keys: [
      at(0, {}),
      at(70, { hip: [-6, -73, 0], py: 18, cy: 26, lean: 14, nod: 12, R: [40, -94, 6], by: 4, el: -8, pR: [-0.2, 1, 0.5], pL: [-0.2, 1, -0.5], FR: [19, -14, 6] }, 'out3'),
      at(170, { hip: [-8, -72, 0], py: 19, cy: 27, lean: 12, nod: 10, R: [38, -95, 6], by: 3, el: -2, pR: [-0.2, 1, 0.5], pL: [-0.2, 1, -0.5], FR: [21, -7, 6] }, 'io'),
      at(280, { hip: [-4, -77, 0], py: 16, cy: 25, lean: 8, nod: 5, R: [35, -103, 4], by: -1, el: 14, FR: [24, 0, 6] }, 'io'),
      at(400, {}, 'io'),
    ],
    phases: null,
  },



  launchUp: {
    name: 'Kicked up into the air', feet: FEET, ownFeet: true,
    keys: [
      at(0, { hip: [-4, -80, 0], py: 16, cy: 26, lean: 2, nod: 0, R: [34, -112, 6], el: 30 }),
      at(70, { hip: [-6, -84, 0], pitch: 6, py: 20, cy: 34, lean: -16, nod: -20, w: 1, R: [10, -148, 24], by: 120, el: 66, pR: [-0.4, 0.4, 0.8], pL: [0.2, 0.3, -0.9], lf: 1, L: [20, -156, -22], FR: [24, -12, 6], FL: [-22, -10, -6] }, 'out3'),
      at(220, { hip: [-6, -78, 0], pitch: 30, py: 22, cy: 34, lean: -10, nod: 0, w: 1, R: [-14, -136, 30], by: 145, el: 40, pR: [-0.4, 0, 0.9], pL: [0.2, 0, -0.9], lf: 1, L: [6, -144, -26], FR: [30, -32, 6], FL: [14, -24, -6] }, 'io'),
      at(420, { hip: [-6, -72, 0], pitch: 60, py: 22, cy: 32, lean: -4, nod: 12, w: 1, R: [-34, -116, 34], by: 158, el: 22, pR: [-0.4, -0.3, 0.9], pL: [0.2, -0.3, -0.9], lf: 1, L: [-10, -128, -28], FR: [36, -48, 6], FL: [28, -40, -6] }, 'out'),
    ],
    phases: null,
  },


  airHit: {
    name: 'Cut in the air (folds)', feet: FEET, ownFeet: true,
    keys: [
      at(0, { hip: [-6, -74, 0], pitch: 46, py: 22, cy: 34, lean: -6, nod: 6, w: 1, R: [-26, -126, 32], by: 150, el: 30, pR: [-0.4, -0.2, 0.9], pL: [0.2, -0.2, -0.9], lf: 1, L: [-4, -136, -26], FR: [30, -40, 6], FL: [20, -30, -6] }),
      at(60, { hip: [-6, -74, 0], pitch: 36, py: 22, cy: 30, lean: 12, nod: 16, w: 1, R: [-10, -140, 40], by: 140, el: 34, pR: [-0.4, -0.2, 0.9], pL: [0.2, -0.2, -0.9], lf: 1, L: [0, -118, -26], FR: [34, -52, 6], FL: [26, -46, -6] }, 'out3'),
      at(200, { hip: [-6, -73, 0], pitch: 50, py: 22, cy: 31, lean: 2, nod: 12, w: 1, R: [-28, -116, 32], by: 155, el: 22, pR: [-0.4, -0.3, 0.9], pL: [0.2, -0.3, -0.9], lf: 1, L: [-6, -124, -27], FR: [36, -50, 6], FL: [28, -43, -6] }, 'io'),
      at(420, { hip: [-6, -72, 0], pitch: 60, py: 22, cy: 32, lean: -4, nod: 12, w: 1, R: [-34, -116, 34], by: 158, el: 22, pR: [-0.4, -0.3, 0.9], pL: [0.2, -0.3, -0.9], lf: 1, L: [-10, -128, -28], FR: [36, -48, 6], FL: [28, -40, -6] }, 'out'),
    ],
    phases: null,
  },










  krArashi: {
    name: 'Arashi-barai (storm sweep from the right)', feet: FEET, strikeFrom: 350,
    steps: [{ foot: 'R', t0: 350, t1: 445, dx: 26, h: 7 }, { foot: 'L', t0: 415, t1: 515, dx: 10, h: 4 }, { foot: 'R', t0: 790, t1: 960, dx: -26, h: 4 }, { foot: 'L', t0: 840, t1: 970, dx: -10, h: 3 }],
    keys: [
      at(0, {}),


      at(170, { hip: [-5, -79, 1], py: 24, cy: 40, lean: 4, nod: 3, R: [18, -104, 26], by: 135, el: -4, n: [0, 0.55, 0.84] }, 'io'),
      at(290, { hip: [-12, -77, 2], py: 38, cy: 60, lean: 2, nod: 3, R: [-2, -106, 34], by: 176, el: 5, n: [0, 0.6, 0.8] }, 'out'),
      at(350, { hip: [-12.5, -77, 2], py: 37, cy: 61, lean: 2, nod: 3, R: [-3, -106, 34], by: 178, el: 6, n: [0, 0.6, 0.8] }, 'io'),


      at(382, { hip: [-2, -76.5, 1.5], py: 28, cy: 52, lean: 4, nod: 3, R: [2, -105, 36], by: 165, el: -20, n: [0, 0.8, 0.6] }, 'io'),
      at(408, { hip: [6, -75.5, 1], py: 18, cy: 40, lean: 7, nod: 4, R: [18, -104, 36], by: 140, el: -40, n: [0, 1, 0] }, 'io'),
      at(430, { hip: [13, -74, 0.5], py: 10, cy: 26, lean: 9, nod: 5, R: [38, -104, 30], by: 100, el: -46, n: [0, 1, 0] }, 'io'),
      at(450, { hip: [19, -72, 0], py: 2, cy: 12, lean: 11, nod: 5, R: [58, -105, 20], by: 42, el: -36, n: [0, 1, 0] }, 'io'),
      at(472, { hip: [25, -70, 0], py: -6, cy: 0, lean: 13, nod: 6, R: [74, -106, 6], by: 8, el: -8, n: [0, 1, 0] }, 'lin'),



      at(545, { hip: [29, -66, 0], py: -18, cy: -24, lean: 18, nod: 8, R: [64, -96, -14], by: -28, el: -38, n: [0, 1, 0] }, 'out'),
      at(650, { hip: [28.5, -66.5, 0], py: -17, cy: -23, lean: 17, nod: 8, R: [62, -97, -13], by: -27, el: -40, n: [0, 1, 0] }, 'io'),

      at(870, { hip: [9, -76, 0], py: 4, cy: 8, lean: 8, nod: 5, R: [52, -106, -4], by: -22, el: 8, n: [0, 0.6, 0.8] }, 'io'),
      at(1100, {}, 'io'),
    ],
    phases: { windup: [0, 430], active: [430, 505], recovery: [505, 1100] },
    kp: [['anticipation', 320], ['contact', 472], ['follow-through', 600], ['recovery', 1100]],
  },



  krKawara: {
    name: 'Kawara-wari (two downward smashes, the second breaks the guard)', feet: FEET, strikeFrom: 270,
    steps: [{ foot: 'R', t0: 290, t1: 350, dx: 12, h: 5 }, { foot: 'R', t0: 700, t1: 790, dx: 22, h: 7 }, { foot: 'L', t0: 750, t1: 840, dx: 8, h: 4 },
      { foot: 'R', t0: 1070, t1: 1250, dx: -34, h: 4 }, { foot: 'L', t0: 1110, t1: 1240, dx: -8, h: 3 }],
    keys: [
      at(0, {}),

      at(110, { hip: [-4, -79.5, 0], py: 15, cy: 28, lean: 3, nod: 3, R: [42, -142, 4], by: 0, el: 66, pR: [-0.5, 0.45, 0.75], pL: [-0.5, 0.45, -0.75] }, 'io'),
      at(200, { hip: [-7, -79.2, 0], py: 16, cy: 34, lean: 0, nod: 1, R: [28, -166, 4], by: 0, el: 112, pR: [-0.3, 0.3, 0.9], pL: [-0.8, 0, -0.6] }, 'out'),
      at(270, { hip: [-7.5, -79.2, 0], py: 16, cy: 35, lean: -0.5, nod: 1, R: [27, -166, 4], by: 0, el: 114, pR: [-0.3, 0.3, 0.9], pL: [-0.8, 0, -0.6] }, 'io'),

      at(305, { hip: [5, -78, 0], py: 6, cy: 17, lean: 2, nod: 3, R: [45, -160, 3], by: 0, el: 80, pR: [-0.3, 0.4, 0.85], pL: [-0.5, 0.2, -0.85] }, 'in'),
      at(345, { hip: [14, -75, 0], py: 0, cy: 2, lean: 6, nod: 6, R: [72, -138, 2], by: 0, el: -9 }, 'lin'),
      at(390, { hip: [16, -74, 0], py: -1, cy: 0, lean: 8, nod: 6, R: [76, -128, 2], by: 0, el: -16 }, 'out'),


      at(470, { hip: [6, -77, 0], py: 12, cy: 24, lean: 3, nod: 3, R: [50, -150, 4], by: 0, el: 70, pR: [-0.5, 0.45, 0.75], pL: [-0.5, 0.45, -0.75] }, 'io'),
      at(545, { hip: [-2, -78.8, 0], py: 17, cy: 34, lean: 0, nod: 1, R: [18, -172, 3], by: 0, el: 116, pR: [-0.3, 0.3, 0.9], pL: [-0.8, 0, -0.6] }, 'io'),
      at(625, { hip: [-3, -77.8, 0], py: 20, cy: 41, lean: -4, nod: 0, R: [-8, -179, 3], by: 0, el: 128, ...UPEL }, 'out'),
      at(695, { hip: [-3.5, -77.7, 0], py: 20, cy: 42, lean: -5, nod: 0, R: [-9, -179, 3], by: 0, el: 130, ...UPEL }, 'io'),


      at(745, { hip: [6, -76.8, 0], py: 13, cy: 34, lean: 0, nod: 1, R: [6, -181, 3], by: 0, el: 134, ...UPEL }, 'io'),
      at(765, { hip: [10, -76.3, 0], py: 9, cy: 26, lean: 2, nod: 2, R: [28, -178, 3], by: 0, el: 110, pR: [-0.5, 0.2, 0.85], pL: [-0.7, 0, -0.7] }, 'io'),
      at(785, { hip: [12, -75.5, 0], py: 5, cy: 16, lean: 4, nod: 3, R: [64, -162, 3], by: 0, el: 70, pR: [-0.3, 0.4, 0.85], pL: [-0.5, 0.2, -0.85] }, 'io'),
      at(805, { hip: [17, -73.5, 0], py: 2, cy: 6, lean: 7, nod: 5, R: [80, -142, 2], by: 0, el: 20, pR: [-0.25, 0.7, 0.7], pL: [-0.35, 0.6, -0.75] }, 'io'),
      at(825, { hip: [23, -71, 0], py: 0, cy: 2, lean: 10, nod: 7, R: [88, -124, 2], by: 0, el: -18 }, 'lin'),

      at(890, { hip: [30, -64, 0], py: -4, cy: -4, lean: 22, nod: 10, R: [72, -92, 3], by: 0, el: -60 }, 'out'),
      at(1010, { hip: [29.5, -64.5, 0], py: -3, cy: -3, lean: 21, nod: 10, R: [71, -94, 3], by: 0, el: -58 }, 'io'),

      at(1210, { hip: [9, -76, 0], py: 10, cy: 15, lean: 8, nod: 5, R: [54, -110, 2], by: -1, el: 9 }, 'io'),
      at(1400, {}, 'io'),
    ],
    phases: { windup: [0, 330], active: [330, 400], hits: [[330, 400], [800, 870]], recovery: [870, 1400] },
    kp: [['anticipation', 660], ['contact', 810], ['follow-through', 930], ['recovery', 1400]],
  },



  krToya: {
    name: 'Toya-zuki (far-arrow thrust)', feet: FEET, strikeFrom: 335,
    steps: [{ foot: 'R', t0: 335, t1: 425, dx: 34, h: 8 }, { foot: 'L', t0: 395, t1: 485, dx: 18, h: 5 }, { foot: 'R', t0: 700, t1: 880, dx: -34, h: 5 }, { foot: 'L', t0: 730, t1: 860, dx: -18, h: 3 }],
    keys: [
      at(0, {}),


      at(170, { hip: [-12, -75, 1], py: 22, cy: 30, lean: 1, nod: 5, R: [18, -99, 8], by: -2, el: 6 }, 'io'),
      at(265, { hip: [-16, -73, 1.5], py: 26, cy: 36, lean: 0, nod: 5, R: [12, -98, 12], by: -3, el: 5 }, 'out'),
      at(335, { hip: [-16.5, -72.8, 1.5], py: 26, cy: 36, lean: 0, nod: 5, R: [11, -98, 12], by: -3, el: 5 }, 'io'),

      at(375, { hip: [8, -72, 0], py: 10, cy: 8, lean: 8, nod: 6, R: [48, -108, 4], by: 0, el: 3 }, 'in'),
      at(425, { hip: [38, -68, 0], py: 0, cy: -4, lean: 15, nod: 9, R: [98, -120, 2], by: 0, el: 1 }, 'lin'),

      at(480, { hip: [41, -66, 0], py: -2, cy: -5, lean: 17, nod: 9, R: [97, -112, 2], by: 0, el: -42 }, 'out'),
      at(580, { hip: [40.5, -66.5, 0], py: -2, cy: -4, lean: 16, nod: 9, R: [86, -108, 2], by: 0, el: -56 }, 'io'),

      at(820, { hip: [8, -77, 0], py: 10, cy: 14, lean: 7, nod: 5, R: [54, -112, 2], by: -1, el: 10 }, 'io'),
      at(1050, {}, 'io'),
    ],
    phases: { windup: [0, 390], active: [390, 470], recovery: [470, 1050] },
    kp: [['anticipation', 300], ['contact', 425], ['follow-through', 530], ['recovery', 1050]],
  },
};








const BODY = {
  kiriR: { coil: 0, drive: 9, lean: 7, sink: 3, step: 16 },
  kiriL: { coil: 0, drive: 9, lean: 7, sink: 3, step: 16 },
  sune: { coil: 2, drive: 6, lean: 2, sink: 1, step: 18 },
  nuki: { coil: 3, drive: 8, lean: 6, sink: 3, step: 16 },
  tsubame: { coil: 0, drive: 4, lean: 0, sink: 0, step: 16 },
  renga: { coil: 1, drive: 7, lean: 5, sink: 2, step: 16 },
  oroshi: { coil: 1, drive: 4, lean: 3, sink: 1, step: 16 },
  sandan: { coil: 1, drive: 6, lean: 3, sink: 2, step: 16 },
  kasumi: { coil: 3, drive: 4, lean: 1, sink: 1, step: 0 },
  kuruma: { coil: 0, drive: 6, lean: 5, sink: 2, step: 0 },
};
const sstep = (a, b, t) => { const u = clamp((t - a) / Math.max(1e-6, b - a), 0, 1); return u * u * (3 - 2 * u); };
for (const [id, B] of Object.entries(BODY)) {
  const M = MOVES[id], ph = M.phases, hits = ph.hits || [ph.active], A0 = hits[0][0], A1 = hits[0][1], Ae = hits[hits.length - 1][1];
  const T = M.keys[M.keys.length - 1].t, ta = Math.max(A0 * 0.55, A0 - 90);
  const coilW = (t) => sstep(A0 * 0.25, ta, t) * (1 - sstep(A0 - 25, A0 + 10, t));
  const driveW = (t) => sstep(A0 - 25, A0 + (A1 - A0) * 0.6, t) * (1 - sstep(Ae + 40, Ae + 40 + (T - Ae - 40) * 0.75, t));
  for (const k of M.keys) {
    if (k.t <= 0 || k.t >= T) continue;
    const dx = B.drive * driveW(k.t) - B.coil * coilW(k.t);
    k.hip = [k.hip[0] + dx, k.hip[1] + B.sink * driveW(k.t), k.hip[2]];
    if (!k.iai && !k.w) k.R = [k.R[0] + dx, k.R[1] + B.sink * driveW(k.t), k.R[2]];
    k.lean += B.lean * driveW(k.t) - 1.5 * coilW(k.t);
  }
  if (B.step && !M.steps && !M.ownFeet) {
    const back0 = Math.min(Ae + 120, T - 220);
    M.steps = [{ foot: 'R', t0: A0 - 35, t1: A0 + 40, dx: B.step, h: 6 }, { foot: 'R', t0: back0, t1: back0 + 150, dx: -B.step, h: 4 }];
  }
  M.kp = [['anticipation', Math.round(ta)], ['contact', Math.round(A0 + (A1 - A0) * 0.6)], ['follow-through', Math.round(Ae + 30)], ['recovery', T]];
}
const ORDER = ['idle', 'overhead', 'horizontal', 'diagonal', 'thrust', 'block',
  'kesaS', 'gyakuS', 'menS', 'yokoL', 'tsukiS', 'guardMid', 'guardHi', 'guardLow', 'blockMid', 'blockHi', 'blockLow', 'hurtHi', 'hurtBody', 'stagger', 'recoil', 'zanshin',
  'walkF', 'walkB', 'run', 'fall', 'downRise', 'throwL', 'parryUp', 'parryDown', 'parrySide', 'dodgeB', 'dodgeF', 'noto', 'nuki',
  'kakato', 'sweep', 'spinKick', 'snapKick', 'knee', 'nidan', 'kiriR', 'kiriL', 'sune',
  'lock', 'lockPush', 'shove', 'clash', 'bindDef', 'bindAtt', 'makiDef', 'flungAtt',
  'stuck', 'dodgePost', 'tsubame', 'renga', 'oroshi', 'higan', 'issen', 'kage', 'ryusei', 'yama', 'airCut', 'airSpike', 'sandan', 'mawari', 'kuruma',
  'kzAge', 'kzTengu', 'kzIai', 'kasumi', 'hurtLow', 'launchUp', 'airHit', 'krArashi', 'krKawara', 'krToya'];
const durOf = (id) => MOVES[id].keys[MOVES[id].keys.length - 1].t;


function torso(k) {
  const fP = yawDir(k.py), rP = rightOf(fP), fC = yawDir(k.cy), rC = rightOf(fC);
  const l = k.lean * D2R, s = add(mul(UP, Math.cos(l)), mul(fC, Math.sin(l)));
  const hip = k.hip.slice();
  const chest = madd(hip, s, LEN.ch);
  const ln = (k.lean * 0.6 + k.nod * 0.25) * D2R, sN = add(mul(UP, Math.cos(ln)), mul(fC, Math.sin(ln)));
  const neck = madd(chest, sN, LEN.nk);
  const fH = norm(add(mul(fC, 0.35), [0.65, 0, 0])), lh = (k.nod * 0.6 + k.lean * 0.3) * D2R;
  const head = madd(neck, add(mul(UP, Math.cos(lh)), mul(fH, Math.sin(lh))), LEN.head);
  const shC = madd(chest, s, LEN.shUp);
  return { fP, rP, fC, rC, s, hip, chest, neck, head, shC, shR: madd(shC, rC, LEN.shW), shL: madd(shC, rC, -LEN.shW), fH };
}








const CH = ['hx', 'hy', 'hz', 'py', 'cy', 'lean', 'nod', 'by', 'el', 'nx', 'ny', 'nz', 'rr', 'raz', 'rel', 'prx', 'pry', 'prz', 'plx', 'ply', 'plz', 'lw', 'dr',
  'pt', 'lx', 'ly', 'lz', 'lf', 'frx', 'fry', 'frz', 'flx', 'fly', 'flz', 'bp', 'bz'];

function tip(v, a) { if (!a) return v; const c = Math.cos(a * D2R), s = Math.sin(a * D2R); return [v[0] * c + v[1] * s, -v[0] * s + v[1] * c, v[2]]; }
const tipAt = (p, hip, a) => (a ? add(hip, tip(sub(p, hip), a)) : p);
const dirOf = (u) => ({ by: Math.atan2(u[2], u[0]) / D2R, el: Math.asin(clamp(-u[1], -1, 1)) / D2R });
const STOP = { out: 1, out3: 1 };
const CACHE = new Map();

function sayaOf(B) {
  const r0 = [-0.955, 0.296, -0.12];
  return { a: add(add(madd(B.hip, B.fP, 13), mul(UP, 5)), mul(B.rP, -6)), u: norm(add(add(mul(B.fP, r0[0]), [0, r0[1], 0]), mul(B.rP, r0[2]))) };
}



function iaiKey(k) {
  if (k.w && k.pitch) {

    const a = -k.pitch, h = k.hip, u = tip(bladeDir(k.by, k.el), a), d = dirOf(u);
    k = Object.assign({}, k, { w: 0, R: tipAt(k.R, h, a), by: d.by, el: d.el, n: tip(k.n, a), pR: tip(k.pR, a), pL: tip(k.pL, a) });
  }
  if (!k.iai) return k;

  const B = torso(k), S = sayaOf(B), u = k.sby != null ? bladeDir(k.sby, k.sel) : S.u, vis = (k.d || 0) * LEN.blade;
  return Object.assign({}, k, { by: Math.atan2(u[2], u[0]) / D2R, el: Math.asin(clamp(-u[1], -1, 1)) / D2R, R: madd(S.a, u, -(vis + 4)) });
}

function channels(id, BL) {
  const key = BL && BL !== LEN.blade ? id + '|' + BL : id;
  let C = CACHE.get(key);
  if (C) return C;
  const K = MOVES[id].keys.map(iaiKey), n = K.length, t = K.map((k) => k.t), v = {};

  K.forEach((k, i) => { if (k.at) K[i] = Object.assign({}, k, { iai: false, d: 1 }); });
  for (const c of CH) v[c] = new Array(n);
  let az0 = null;
  K.forEach((k, i) => {
    const B = torso(k), r = sub(k.R, B.shC), rr = len(r);
    let az = Math.atan2(r[2], r[0]);
    if (az0 != null) while (az - az0 > Math.PI) az -= 2 * Math.PI; else az0 = az;
    if (az0 != null) while (az - az0 < -Math.PI) az += 2 * Math.PI;
    az0 = az;
    const o = { hx: k.hip[0], hy: k.hip[1], hz: k.hip[2], py: k.py, cy: k.cy, lean: k.lean, nod: k.nod, by: k.by, el: k.el, nx: k.n[0], ny: k.n[1], nz: k.n[2], rr, raz: az, rel: Math.asin(clamp(-r[1] / rr, -1, 1)), prx: k.pR[0], pry: k.pR[1], prz: k.pR[2], plx: k.pL[0], ply: k.pL[1], plz: k.pL[2], lw: k.lw, dr: k.d,
      pt: k.pitch, lx: k.L[0], ly: k.L[1], lz: k.L[2], lf: k.lf, frx: k.FR[0], fry: k.FR[1], frz: k.FR[2], flx: k.FL[0], fly: k.FL[1], flz: k.FL[2] };


    const u = bladeDir(k.by, k.el), r2 = Math.hypot(u[0], u[1]);
    if (i === 0) o.bp = r2 > 1e-6 ? Math.atan2(u[1], u[0]) : -Math.PI / 2;
    else { const kp = K[i - 1], d = swingD(kp.by, kp.el, k.by, k.el, i > 1 ? v.bp[i - 1] - v.bp[i - 2] : 0); o.bp = v.bp[i - 1] + d; }
    o.bz = k.d != null && k.d < 0.999 ? u[2] : clamp(u[2], -ZMAX, ZMAX);
    for (const c of CH) v[c][i] = o[c];
  });
  const m = {};
  for (const c of CH) {
    const p = v[c], d = [], mm = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) d.push((p[i + 1] - p[i]) / (t[i + 1] - t[i]));
    for (let i = 1; i < n - 1; i++) {
      if (STOP[K[i].e] || d[i - 1] * d[i] <= 0) continue;
      const g = (d[i - 1] * (t[i + 1] - t[i]) + d[i] * (t[i] - t[i - 1])) / (t[i + 1] - t[i - 1]);
      const lim = 3 * Math.min(Math.abs(d[i - 1]), Math.abs(d[i]));
      mm[i] = clamp(g, -lim, lim);
    }
    m[c] = mm;
  }
  C = { t, v, m };
  C.bpT = bpTable(id, C, BL || LEN.blade);
  CACHE.set(key, C);
  return C;
}






const BP_W = 0.26, BP_DT = 1000 / 240;
const STRIKE_M = 35;



function followBp(prev, bp, dt, strike) {
  if (prev == null || strike || !(dt > 0)) return bp;
  const d = Math.atan2(Math.sin(bp - prev), Math.cos(bp - prev)), m = BP_W * Math.min(3, dt * 60);
  return prev + clamp(d, -m, m);
}





const BP_A = 0.06;
function followCh(st, ch, dt, strike) {
  if (ch.bp == null || !isFinite(ch.bp)) return ch;
  const pt = (ch.pt || 0) * D2R, tg = ch.bp - pt, wr = (x) => Math.atan2(Math.sin(x), Math.cos(x));
  const sc = clamp(dt * 60, 0, 3);

  let tv = st.tp != null && sc > 0 ? wr(tg - st.tp) / sc : 0;
  if (Math.abs(tv) > 1.5 * BP_W && !strike) tv = 0;
  st.tp = tg;
  if (st.e == null || strike || !(sc > 0)) { st.e = tg; st.v = tv; st.lock = true; return ch; }
  let d = wr(tg - st.e);
  if (st.lock && Math.abs(d) < 0.03) { st.e = tg; st.v = tv; return ch; }

  if (Math.abs(d) > 2.6 && st.v && Math.sign(d) !== Math.sign(st.v)) d += Math.sign(st.v) * 2 * Math.PI;



  if (Math.abs(tv) > 0.05) st.dir = 0;
  else if (st.lock || st.dir == null) {
    st.dir = Math.sign(d);
    const dn = wr(Math.PI / 2 - st.e);
    if (Math.abs(d) > 1.2 && Math.sign(dn) === Math.sign(d) && Math.abs(dn) < Math.abs(d) && 2 * Math.PI - Math.abs(d) < Math.abs(d) + 1.4) st.dir = -Math.sign(d);
  }
  if (st.dir && Math.sign(d) !== st.dir && Math.abs(d) > 0.5) d += st.dir * 2 * Math.PI;
  st.lock = false;

  const v = clamp(st.v || 0, -BP_W, BP_W), vd = clamp((Math.abs(d) < 0.8 ? tv : 0) + Math.sign(d) * Math.min(BP_W, Math.sqrt(2 * BP_A * Math.abs(d)), 0.5 * Math.abs(d)), -BP_W, BP_W);
  const ac = BP_A * sc * (v * d < 0 ? 2 : 1);
  st.v = v + clamp(vd - v, -ac, ac);
  st.e += st.v * sc;
  const d2 = wr(tg - st.e);
  if (Math.abs(d2) < 0.03 && Math.abs(st.v - tv) < BP_A) { st.e = tg; st.v = tv; st.lock = true; st.dir = 0; }
  ch.bp = st.e + pt; ch.bv = st.v * 60 / 1000;
  return ch;
}












const GOV_W = 0.26, DOWN_W = 0.55, DOWN_V = 0.15;

function scrP(h, u, BL = LEN.blade) { const s0 = CAM / (CAM - h[2]), t = madd(h, u, BL), s1 = CAM / (CAM - t[2]); return Math.atan2(t[1] * s1 - h[1] * s0, t[0] * s1 - h[0] * s0); }
function scrR(h, u, BL = LEN.blade) { const s0 = CAM / (CAM - h[2]), t = madd(h, u, BL), s1 = CAM / (CAM - t[2]); return Math.hypot(t[0] * s1 - h[0] * s0, t[1] * s1 - h[1] * s0) / (BL * s0); }
const rotZu = (u, a) => { const c = Math.cos(a), s = Math.sin(a); return [u[0] * c - u[1] * s, u[0] * s + u[1] * c, u[2]]; };

function rotToScr(h, u, BL, c) {
  let r = wrapA(c - scrP(h, u, BL)), v = rotZu(u, r);
  for (let i = 0; i < 5; i++) { const e = wrapA(c - scrP(h, v, BL)); if (Math.abs(e) < 2e-4) break; r += e; v = rotZu(u, r); }
  return v;
}
const inDown = (c) => Math.abs(wrapA(c - Math.PI / 2)) < DOWN_W;






const REV_HOLD = 4;
function legs(g, p) {
  if (g.lastP != null) {
    const w = wrapA(p - g.lastP);
    if (Math.abs(w) >= 0.03) {
      if (g.legS === Math.sign(w) && (g.slow || 0) <= 3) g.legAmp += Math.abs(w);
      else { g.legS = Math.sign(w); g.legAmp = Math.abs(w); g.legAge = 0; }
      g.slow = 0;
    } else g.slow = (g.slow || 0) + 1;
    g.legAge = (g.legAge || 0) + 1;
  }
  g.lastP = p;
}
const BU_CREEP = 0.05;
function govStep(g, a, o) {
  if (g.a != null) legs(g, g.a);


  if (!o.backUp) { if (g.bu && !o.strike) g.buL = 12; g.bu = false; }
  const tv = g.lt == null ? 0 : wrapA(a - g.lt); g.lt = a;
  if (g.a == null || o.strike) { g.a = a; g.dir = 0; g.v = 0; g.buL = 0; return a; }
  const bad = o.bad || (() => 0), p = g.a, v0 = g.v || 0;

  let t = a;
  if (!o.okDown && !o.downPass && inDown(t)) { const sp = wrapA(p - Math.PI / 2), sd = Math.abs(sp) > 1e-3 ? Math.sign(sp) : Math.sign(wrapA(t - Math.PI / 2)) || 1; t = Math.PI / 2 + sd * (DOWN_W + 0.02); }
  let d = wrapA(t - p);
  const lowBack = (q) => { const w = wrapA(q); return w > Math.PI / 2 + 0.1 || w < -Math.PI + 0.35; };


  if (o.backUp && t !== a && lowBack(p) && d < BU_CREEP && d > -GOV_W && !(bad(p + BU_CREEP) > 0.5)) { g.v = BU_CREEP; g.a = p + BU_CREEP; g.dir = 1; g.bu = true; return g.a; }
  if (g.buL > 0) { g.buL--; if (d < 0 && !(bad(p) > 0.5)) { g.v = 0; g.dir = 0; return p; } }
  if (Math.abs(d) < 1e-4) { g.v = 0; g.dir = 0; return p; }

  if (Math.abs(d) > GOV_W) {
    const cost = (dd) => { const n = Math.max(1, Math.ceil(Math.abs(dd) / 0.12)); let c = Math.abs(dd) * 0.3; for (let i = 1; i <= n; i++) { const q = p + dd * i / n; if (bad(q) > 0.5) c += 1; } return c; };
    const dl = d - Math.sign(d) * 2 * Math.PI, cs = cost(d), cl = cost(dl);
    let pick = cs <= cl ? d : dl;


    if (o.backUp && ((g.bu && Math.cos(p) < 0.2) || lowBack(p))) { const up = d > 0 ? d : dl, cu = up === d ? cs : cl; g.bu = cu <= Math.min(cs, cl) + 1.5; if (g.bu) pick = up; } else g.bu = false;

    if (g.bu) {            } else if (g.dir && Math.sign(pick) !== g.dir && g.legS === g.dir && g.legAmp >= 0.45 && g.legAge <= 10 && (g.slow || 0) < REV_HOLD) pick = g.dir === Math.sign(d) ? d : dl;
    else if (g.dir && Math.sign(pick) !== g.dir) { const keep = g.dir === Math.sign(d) ? d : dl, ck = keep === d ? cs : cl; if (ck <= Math.min(cs, cl) + 1.5) pick = keep; }




    if (!g.bu && !o.backUp && !g.dir && Math.abs(pick) > 4 && (g.wl || 0) < 10 && (o.okDown || !inDown(p)) && !(bad(p) > 0)) { g.wl = (g.wl || 0) + 1; g.v = 0; return p; }
    if (Math.abs(pick) <= 4) g.wl = 0;
    d = pick; g.dir = Math.sign(d);
  } else { g.dir = 0; g.wl = 0; }
  const sg = Math.sign(d);

  const back = (st) => g.legS && Math.sign(st) === -g.legS && Math.abs(st) >= 0.03 && g.legAmp >= 0.45 && g.legAge <= 10 && (g.slow || 0) < REV_HOLD;
  const full = Math.min(GOV_W, Math.abs(d));

  const bandOK = (c, st) => o.okDown || !inDown(c) || (Math.abs(st) >= DOWN_V && !(inDown(p) && v0 && Math.sign(st) !== Math.sign(v0) && Math.abs(v0) >= DOWN_V * 0.5));
  const ok = (st) => bandOK(p + st, st) && !back(st);



  if (o.inOpp && g.legS && g.legAmp >= 0.3 && (g.slow || 0) <= 2 && o.inOpp(p) && o.inOpp(t)) { const st = g.legS * GOV_W; if (bandOK(p + st, st)) { g.v = st; g.a = p + st; g.dir = g.legS; return g.a; } }




  if (o.raw != null && !g.bu && g.legS && g.legAmp >= 0.45 && (g.slow || 0) <= 2 && !(sg === g.legS && Math.abs(d) >= 0.03)) {
    const dr = wrapA(o.raw - p);
    if (Math.sign(dr) === g.legS && Math.abs(dr) >= 0.06) {
      const st = g.legS * clamp(Math.abs(dr) * 0.5, 0.04, GOV_W);
      if (bandOK(p + st, st) && !(bad(p + st) > 0)) { g.v = st; g.a = p + st; g.dir = g.legS; return g.a; }
    }
  }


  if (!g.bu && Math.abs(tv) >= 0.1 && Math.sign(tv) === -sg && Math.abs(d) > Math.abs(tv) && bandOK(p, 0) && !(bad(p) > 0) && !back(0)) { g.v = 0; return p; }

  if (ok(sg * full) && !(bad(p + sg * full) > 0)) { g.v = sg * full; g.a = p + sg * full; return g.a; }


  if (o.pass && ok(sg * full) && Math.abs(d) > full) {
    let fine = true, clear = false;
    for (let x = full; x <= Math.abs(d) + 1e-6; x += 0.08) { const q = p + sg * Math.min(x, Math.abs(d)); if (bad(q) > 0) { if (!o.pass(q) || clear) { fine = false; break; } } else if (x > full) clear = true; }
    if (fine && clear && !(bad(p + d) > 0)) { g.v = sg * full; g.a = p + sg * full; return g.a; }
  }
  let best = null, bs = Infinity;
  const cand = [];
  for (let k = 8; k >= 0; k--) cand.push(sg * full * k / 8);

  if (!g.bu) for (let k = 1; k <= 8; k++) cand.push(-sg * GOV_W * k / 8);
  cand.push(0.025, -0.025);
  for (const st of cand) {
    if (!bandOK(p + st, st)) continue;

    const b = bad(p + st), sc = (b > 0 ? 100 + 100 * b : 0) + Math.abs(d - st) + (back(st) ? 150 : 0);
    if (sc < bs) { bs = sc; best = st; }
  }
  if (best == null) {

    const sp = wrapA(p - Math.PI / 2), e = Math.PI / 2 + (Math.sign(sp) || 1) * (DOWN_W + 0.02);
    best = clamp(wrapA(e - p), -GOV_W, GOV_W);
  }
  g.v = best; g.a = p + best;
  return g.a;
}

function flipFollow(st) { if (st.e != null) st.e = Math.PI - st.e; if (st.tp != null) st.tp = Math.PI - st.tp; if (st.v) st.v = -st.v; return st; }


function strikeAt(M, t) { if (M.beat && t >= M.beat[0] && t <= M.beat[1]) return true; const ph = M.phases; if (!ph) return false; const W = ph.hits || (ph.active ? [ph.active] : []); return W.some(([a, b]) => t >= a - STRIKE_M && t <= b + STRIKE_M); }
function bpTable(id, C, BL) {
  const M = MOVES[id], T = C.t[C.t.length - 1], n = Math.max(2, Math.ceil(T / BP_DT) + 1), raw = new Float64Array(n), st = new Uint8Array(n), brk = new Uint8Array(n), Kz = new Float64Array(n), Rs = new Array(n);
  const P = C.v.bp, Mm = C.m.bp, TT = C.t;
  for (let i = 0; i < n; i++) {
    const t = Math.min(T, i * BP_DT);
    let j = 1; while (j < TT.length - 1 && t > TT[j]) j++;
    const h = TT[j] - TT[j - 1], s = clamp((t - TT[j - 1]) / Math.max(1e-6, h), 0, 1), s2 = s * s, s3 = s2 * s;
    raw[i] = (2 * s3 - 3 * s2 + 1) * P[j - 1] + (s3 - 2 * s2 + s) * h * Mm[j - 1] + (-2 * s3 + 3 * s2) * P[j] + (s3 - s2) * h * Mm[j];

    { const o = {}; for (const c of ['hx', 'hy', 'hz', 'py', 'cy', 'lean', 'nod', 'rr', 'raz', 'rel', 'bz', 'pt', 'dr']) { const p = C.v[c], m = C.m[c]; o[c] = (2 * s3 - 3 * s2 + 1) * p[j - 1] + (s3 - 2 * s2 + s) * h * m[j - 1] + (-2 * s3 + 3 * s2) * p[j] + (s3 - s2) * h * m[j]; }
      if (!o.pt && !(o.dr < 0.999)) {
        const B = torso({ hip: [o.hx, o.hy, o.hz], py: o.py, cy: o.cy, lean: o.lean, nod: o.nod }), ce = Math.cos(o.rel), R = madd(B.shC, [ce * Math.cos(o.raz), -Math.sin(o.rel), ce * Math.sin(o.raz)], o.rr);
        Kz[i] = o.bz; Rs[i] = R;
        const u0 = fromScr(raw[i], o.bz), u1 = floorU(R, u0, BL + LEN.guard, -8, true);
        if (u1 !== u0) raw[i] += Math.atan2(Math.sin(scrA(u1) - scrA(u0)), Math.cos(scrA(u1) - scrA(u0)));
      } }
    st[i] = strikeAt(M, t) ? 1 : 0;

    if (i > 0 && (M.jump || []).some(([a, b]) => t >= a && t - BP_DT <= b)) brk[i] = 1;

    if (M.turnAt != null && t > M.turnAt) { let m = Math.PI - raw[i]; if (i > 0) m += 2 * Math.PI * Math.round((raw[i - 1] - m) / (2 * Math.PI)); raw[i] = m; }
  }



  const w = BP_W * BP_DT / (1000 / 60), x = Float64Array.from(raw), fix = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (st[i] || brk[i] || (i + 1 < n && brk[i + 1])) fix[i] = 1;
  const free = (i) => !(st[i] && st[i + 1]) && !brk[i + 1];
  for (let it = 0; it < 600; it++) {
    let worst = 0;
    const fw = it % 2 === 0;
    for (let k = 0; k < n - 1; k++) {
      const i = fw ? k : n - 2 - k;
      if (!free(i)) continue;
      const d = x[i + 1] - x[i], ex = Math.abs(d) - w;
      if (ex <= 1e-6) continue;
      worst = Math.max(worst, ex);
      const sg = Math.sign(d);
      if (fix[i] && fix[i + 1]) continue;
      if (fix[i]) x[i + 1] -= sg * ex; else if (fix[i + 1]) x[i] += sg * ex; else { x[i] += sg * ex / 2; x[i + 1] -= sg * ex / 2; }
    }
    if (worst < 1e-4) break;
  }

  for (let k = n - 2; k >= 0; k--) if (!fix[k] && free(k)) x[k] = clamp(x[k], x[k + 1] - w, x[k + 1] + w);
  for (let k = 1; k < n; k++) if (!fix[k] && free(k - 1)) x[k] = clamp(x[k], x[k - 1] - w, x[k - 1] + w);
  const out = x;
  if (M.turnAt != null) for (let q = 0; q < n; q++) if (q * BP_DT > M.turnAt) out[q] = Math.PI - out[q];



  const L = BL + LEN.guard, need = new Float64Array(n).fill(-1), rate = BZ_RATE * BP_DT / (1000 / 60);
  for (let i = 0; i < n; i++) {
    if (!Rs[i]) continue;
    const sy = Math.sin(out[i]), Ry = Rs[i][1];

    if (sy <= 1e-3 || Ry + sy * L <= -20) continue;
    const r2 = clamp((-20 - Ry) / (L * sy), 0, 1);
    need[i] = Math.min(0.92, Math.sqrt(1 - r2 * r2) + 0.03);
  }
  for (let i = 1; i < n; i++) need[i] = Math.max(need[i], need[i - 1] - rate);
  for (let i = n - 2; i >= 0; i--) need[i] = Math.max(need[i], need[i + 1] - rate);




  const bz = new Float64Array(n), ov = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    bz[i] = Rs[i] && need[i] > Kz[i] ? need[i] : NaN;
    if (!M.bzFar || BL < 110 || !Rs[i]) continue;
    const t = i * BP_DT, wf = smooth01((t - M.bzFar[0]) / (M.bzFar[1] - M.bzFar[0]));
    if (wf > 0) { const zc = Math.max(Kz[i], need[i]), zf = Math.min(Kz[i], -Math.max(0, need[i])); bz[i] = zc + (zf - zc) * wf; ov[i] = 1; }
  }
  return { bp: out, bz, ov };
}
const BZ_RATE = 0.07;
function sampleCh(C, t) {
  const T = C.t, n = T.length;
  let i = 1;
  while (i < n - 1 && t > T[i]) i++;
  const h = T[i] - T[i - 1], s = clamp((t - T[i - 1]) / Math.max(1e-6, h), 0, 1), s2 = s * s, s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2, o = {};
  for (const c of CH) { const p = C.v[c], m = C.m[c]; o[c] = h00 * p[i - 1] + h10 * h * m[i - 1] + h01 * p[i] + h11 * h * m[i]; }
  if (C.bpT) {
    const B = C.bpT.bp, Z = C.bpT.bz, x = clamp(t, 0, T[n - 1]) / BP_DT, j = Math.min(B.length - 2, Math.floor(x)), f = clamp(x - j, 0, 1);
    o.bp = B[j] + (B[j + 1] - B[j]) * f; o.bv = (B[j + 1] - B[j]) / BP_DT;

    const z0 = isNaN(Z[j]) ? o.bz : Z[j], z1 = isNaN(Z[j + 1]) ? o.bz : Z[j + 1];
    if (!isNaN(Z[j]) || !isNaN(Z[j + 1])) { const z = z0 + (z1 - z0) * f, V = C.bpT.ov; o.bz = V && (V[j] || V[j + 1]) ? z : Math.max(o.bz, z); }
  }
  return o;
}

function chAt(id, t, BL) {
  const M = MOVES[id], T = durOf(id);
  if (M.loop) t = ((t % T) + T) % T;
  return sampleCh(channels(id, BL), clamp(t, 0, T));
}

function blendCh(a, b, w) {
  const o = {};
  for (const c of CH) {
    let d = b[c] - a[c];
    if (c === 'raz' || c === 'bp') d = Math.atan2(Math.sin(d), Math.cos(d));
    else if (c === 'by' || c === 'py' || c === 'cy') d = ((((d + 540) % 360) + 360) % 360) - 180;
    o[c] = a[c] + d * w;
  }
  if (b.bv != null) o.bv = b.bv;
  return o;
}


function poseFromCh(id, o, t, prev, opt) {
  const M = MOVES[id];
  const k = { hip: [o.hx, o.hy, o.hz], py: o.py, cy: o.cy, lean: o.lean, nod: o.nod, by: o.by, el: o.el, n: norm([o.nx, o.ny, o.nz]), pR: [o.prx, o.pry, o.prz], pL: [o.plx, o.ply, o.plz], lw: clamp(o.lw, 0, 1), d: clamp(o.dr, 0, 1),
    pitch: o.pt || 0, L: [o.lx, o.ly, o.lz], lf: clamp(o.lf || 0, 0, 1), FR: [o.frx, o.fry, o.frz], FL: [o.flx, o.fly, o.flz] };
  if (o.bp != null && isFinite(o.bp)) { k.bu = fromScr(o.bp, o.bz); k.bv = o.bv || 0; }
  const B = torso(k), ce = Math.cos(o.rel);
  let R = madd(B.shC, [ce * Math.cos(o.raz), -Math.sin(o.rel), ce * Math.sin(o.raz)], o.rr);


  if (opt && opt.sheathed) {
    const S = sayaOf(B), d = dirOf(S.u);
    k.by = d.by; k.el = d.el; k.bu = null; k.d = 0; k.lw = 0; R = madd(S.a, S.u, -6);
    k.pR = [-0.3, 0.9, 0.5];
  }
  return build(M, k, B, R, prev, t, opt);
}
function poseAt(id, t, prev, opt) {
  const T = durOf(id), M = MOVES[id];

  if (M.gait && !(opt && opt.feet)) {
    const u = (((t % T) + T) % T) / T;
    opt = Object.assign({}, opt, { feet: gaitFeet(id, u, M.gait.S) });
    const P = poseFromCh(id, chAt(id, t, opt.blade), u * T, prev, opt);
    P.bodyX = M.gait.S * (Math.floor(t / T) + u);
    return P;
  }
  return poseFromCh(id, chAt(id, t, opt && opt.blade), M.loop ? ((t % T) + T) % T : clamp(t, 0, T), prev, opt);
}






const s5 = (v) => v * v * v * (v * (v * 6 - 15) + 10);
function swing(u, a, b) { if (u <= a) return [0, 0]; if (u >= b) return [1, 0]; const v = (u - a) / (b - a); return [s5(v), Math.sin(Math.PI * v)]; }





const WALK_C = 1, WALK_Z = 7, WALK_SW = [0.04, 0.46];
const WALK_H = (S) => 10 + Math.abs(S) * 0.03;


const strideOf = (id, sp) => (id === 'run' ? clamp(Math.abs(sp) * 0.33, 120, 200) : id === 'walkB' ? -clamp(Math.abs(sp) * 0.6, 64, 118) : clamp(Math.abs(sp) * 0.55, 70, 130));
function gaitFeet(id, u, S) {
  const G = MOVES[id].gait, o = {};
  if (G.kind === 'walk') {
    const first = S >= 0 ? 'L' : 'R', W = { [first]: [WALK_SW[0], WALK_SW[1]], [first === 'L' ? 'R' : 'L']: [0.5 + WALK_SW[0], 0.5 + WALK_SW[1]] };
    const h = WALK_H(S);
    for (const s of ['R', 'L']) { const b = WALK_C + (s === first ? -S / 4 : S / 4), [w, l] = swing(u, W[s][0], W[s][1]); o[s] = [b + S * w - S * u, -l * h, s === 'R' ? WALK_Z : -WALK_Z]; }
  } else {


    for (const [s, c0, cx, z] of [['R', 0.825, 10, 5], ['L', 0.325, 6, -5]]) {
      let v = u - c0; if (v < 0) v += 1;
      const x0 = cx + 0.175 * S;
      if (v <= 0.35) o[s] = [x0 - S * v, 0, z];
      else { const q = (v - 0.35) / 0.65, w = s5(q); o[s] = [x0 + S * w - S * v, -Math.sin(Math.PI * q) * G.h, z]; }
    }
  }
  return o;
}






function walkFeetLive(G, u, S, x, dir, at) {
  const h = u < 0.5 ? 0 : 1, first = S >= 0 ? 'L' : 'R', sw = h ? (first === 'L' ? 'R' : 'L') : first, pl = sw === 'L' ? 'R' : 'L';
  if (G.h !== h) {
    const xs = x - (u - 0.5 * h) * S * dir, a = at(sw);
    G.h = h; G.x0 = a[0]; G.z0 = a[1]; G.x1 = xs + (0.5 * S + WALK_C + S / 4) * dir; G.S = S;
  }
  const [w, l] = swing(u - 0.5 * h, WALK_SW[0], WALK_SW[1]), zs = sw === 'R' ? WALK_Z : -WALK_Z, p = at(pl), o = {};
  o[sw] = [(G.x0 + (G.x1 - G.x0) * w - x) * dir, -l * WALK_H(G.S), G.z0 + (zs - G.z0) * w];
  o[pl] = [(p[0] - x) * dir, 0, p[1]];
  return o;
}



function footAt(M, s, t) {
  const f = M.feet[s];
  let x = f[0], z = f[1], y = 0;
  for (const st of M.steps || []) {
    if (st.foot !== s || t <= st.t0) continue;
    const u = Math.min(1, (t - st.t0) / (st.t1 - st.t0)), w = u * u * u * (u * (u * 6 - 15) + 10);
    x += st.dx * w; z += (st.dz || 0) * w; if (u < 1) y -= Math.sin(Math.PI * u) * st.h;
  }
  return [x, y, z];
}





function layLeg(P, s, ft) {
  const fw = P.fP || [1, 0, 0];
  let pole = add(fw, [0, -0.15, s === 'R' ? 0.25 : -0.25]);
  if (P.kneeUp === s) {
    const d = norm(sub(ft, P['hip' + s])), a = dot(d, norm([fw[0], 0, fw[2]]));
    pole = add(add(mul(norm([fw[0], 0, fw[2]]), d[1]), [0, -a, 0]), [0, 0, s === 'R' ? 0.25 : -0.25]);
  }
  const r = ik3(P['hip' + s], ft, LEN.thigh, LEN.shin, pole);
  P['kn' + s] = r.m; P['ft' + s] = r.e; P['legReach' + s] = r.reach / (LEN.thigh + LEN.shin);
}
function layArm(P, s, ha, pole) {
  const r = ik3(P['sh' + s], ha, LEN.uArm, LEN.fArm, pole);
  P['el' + s] = r.m; P['ha' + s] = r.e; P['reach' + s] = r.reach / (LEN.uArm + LEN.fArm);
  return r;
}




function edgeOf(n, u, bv) {
  let e = cross(n, u); if (len(e) < 1e-3) e = cross([0, 0, 1], u); e = norm(sub(e, mul(u, dot(e, u))));
  if (!bv) return e;
  const sv = [-u[1], u[0], 0], ls = len(sv), w = clamp(Math.abs(bv) / 0.012, 0, 1) * clamp((ls - 0.2) / 0.3, 0, 1);
  if (w <= 0) return e;
  const es = norm(sub(mul(sv, Math.sign(bv) / ls), mul(u, dot(sv, u) * Math.sign(bv) / ls))), ue = cross(u, e);
  const th = Math.atan2(dot(es, ue), dot(es, e)), ph = th * w * w * (3 - 2 * w);
  return norm(add(mul(e, Math.cos(ph)), mul(ue, Math.sin(ph))));
}
function build(M, k, B, R, prev, t = 0, opt = {}) {
  const P = {}, a = k.pitch || 0, h0 = B.hip, TP = (p) => tipAt(p, h0, a), TD = (v) => tip(v, a);
  P.hip = B.hip; P.chest = TP(B.chest); P.neck = TP(B.neck); P.head = TP(B.head); P.shR = TP(B.shR); P.shL = TP(B.shL);
  P.hipR = TP(madd(B.hip, B.rP, LEN.hipW)); P.hipL = TP(madd(B.hip, B.rP, -LEN.hipW));
  if (M.kneeUp) P.kneeUp = M.kneeUp;
  P.pl = TD(B.rP); P.cf = TD(norm(sub(mul(B.fC, Math.cos(k.lean * D2R)), mul(UP, Math.sin(k.lean * D2R))))); P.hf = TD(B.fH); P.fP = TD(B.fP);
  R = TP(R);



  const own = Array.isArray(M.ownFeet) ? t >= M.ownFeet[0] && t <= M.ownFeet[1] : !!M.ownFeet, kf = M.kick, ownS = (s) => own || kf === s;
  for (const s of ['R', 'L']) layLeg(P, s, ownS(s) ? k['F' + s] : opt.feet ? opt.feet[s] : footAt(M, s, t));
  P.toR = [1, 0, 0]; P.toL = norm([0.96, 0, -0.28]);

  for (const s of ['R', 'L']) if (ownS(s)) {
    const ft = P['ft' + s], sh = norm(sub(ft, P['kn' + s])), toe = norm([sh[1], -sh[0], s === 'R' ? 0 : -0.28]), flat = s === 'R' ? [1, 0, 0] : P.toL;
    const w = Math.max(clamp((-ft[1] - 2) / 8, 0, 1), clamp((a - 25) / 30, 0, 1));
    P['to' + s] = norm(lerp(flat, toe, w));
  }
  P.ownFeet = own;

  const SY0 = sayaOf(B), SY = { a: TP(SY0.a), u: TD(SY0.u) };

  { const L = LEN.blade + 6, ey = SY.a[1] + SY.u[1] * L, lim = -2.5;
    if (ey > lim) { const uy = clamp((lim - SY.a[1]) / L, -1, 1), hz = Math.hypot(SY.u[0], SY.u[2]) || 1, kk = Math.sqrt(Math.max(0, 1 - uy * uy)) / hz; SY.u = norm([SY.u[0] * kk, uy, SY.u[2] * kk]); } }

  let u = opt && opt.sheathed ? SY.u : TD(k.bu || bladeDir(k.by, k.el));

  const flat = !(opt && opt.sheathed) && !(k.d != null && k.d < 0.999);
  if (flat) u = floorU(R, flatDrawn(R, u, opt.blade || LEN.blade), opt.blade || LEN.blade);
  let e = edgeOf(TD(k.n), u, flat ? k.bv : 0);
  const grip = opt.grip || LEN.grip, d = k.d == null ? 1 : k.d, lw = k.lw == null ? 1 : k.lw;


  const vis = d * LEN.blade, mouth = d < 0.999 ? madd(R, u, vis + 4) : SY.a;



  const lf = k.lf || 0, X = Math.max(0, grip - LEN.grip) * (opt.sheathed ? 0 : 1) * clamp(lw, 0, 1) * (1 - lf);
  let ext = X / 2;
  if (X > 0) {
    const AL = LEN.uArm + LEN.fArm, sq = (v) => v * v;
    let best = 1e9;






    const R0 = R[0], R1 = R[1], R2 = R[2], u0 = u[0], u1 = u[1], u2 = u[2], S = P.shR, L2 = P.shL, H = P.head, G2 = LEN.guard + 40;
    for (let x = -2; x <= X + 2.001; x += 0.05) {



      if (3e-4 * sq(x - X / 2) >= best) continue;
      const r0 = R0 + u0 * x, r1 = R1 + u1 * x, r2 = R2 + u2 * x, l0 = r0 + u0 * -grip, l1 = r1 + u1 * -grip, l2 = r2 + u2 * -grip;
      const rR = Math.hypot(r0 - S[0], r1 - S[1], r2 - S[2]) / AL, rL = Math.hypot(l0 - L2[0], l1 - L2[1], l2 - L2[2]) / AL;

      const a0 = l0 + u0 * -5, a1 = l1 + u1 * -5, a2 = l2 + u2 * -5, b0 = r0 + u0 * G2, b1 = r1 + u1 * G2, b2 = r2 + u2 * G2;
      const ab0 = b0 - a0, ab1 = b1 - a1, ab2 = b2 - a2, pa0 = H[0] - a0, pa1 = H[1] - a1, pa2 = H[2] - a2;
      const q = clamp((pa0 * ab0 + pa1 * ab1 + pa2 * ab2) / Math.max(1e-9, ab0 * ab0 + ab1 * ab1 + ab2 * ab2), 0, 1);
      const sdv = Math.hypot(H[0] - (a0 + ab0 * q), H[1] - (a1 + ab1 * q), H[2] - (a2 + ab2 * q));
      const dH = Math.min(sdv, Math.hypot(H[0] - r0, H[1] - r1, H[2] - r2), Math.hypot(H[0] - l0, H[1] - l1, H[2] - l2));
      const c = sq(Math.max(0, rR - 0.9)) + sq(Math.max(0, 0.56 - rL)) + 3e-4 * sq(x - X / 2) + 0.02 * sq(Math.max(0, 19.5 - dH));
      if (c < best) { best = c; ext = x; }
    }
  }
  let HR = madd(R, u, ext);




  {


    const AL = LEN.uArm + LEN.fArm, dR = sub(HR, P.shR), rR = len(dR) / AL, kR = knee(rR - 0.93);
    if (X > 0 && kR > 0) HR = madd(HR, dR, -kR * AL / len(dR));
    const dL = sub(madd(HR, u, -grip), P.shL), rL = len(dL) / AL, kL = knee(0.48 - rL);

    if (kL > 0) { const q = madd(HR, dL, kL * AL / Math.max(1e-6, len(dL))); HR = lerp(HR, q, smooth01((0.97 - len(sub(q, P.shR)) / AL) / 0.04)); }
  }


  if (X > 0) {
    const np = (p, a, b) => { const ab = sub(b, a), q = clamp(dot(sub(p, a), ab) / Math.max(1e-9, dot(ab, ab)), 0, 1); return madd(a, ab, q); };
    const AL = LEN.uArm + LEN.fArm, dv = sub(np(P.head, madd(HR, u, -grip - 6), madd(HR, u, LEN.guard + 4)), P.head), dd = len(dv), need = 19 - dd;
    if (need > 0 && dd > 1e-3) {
      let m = need; while (m > 0 && len(sub(madd(HR, dv, m / dd), P.shR)) / AL > 0.955) m -= 0.25;
      HR = madd(HR, dv, Math.max(0, m) / dd);
    }
  }

  if (flat) { const u2 = floorU(HR, u, (opt.blade || LEN.blade) + LEN.guard); if (u2 !== u) { u = u2; e = edgeOf(TD(k.n), u, k.bv); } }
  let HL = lw >= 0.999 ? madd(HR, u, -grip) : lerp(madd(mouth, d < 0.999 ? u : SY.u, 3), madd(HR, u, -grip), lw);


  if (X > 0 && lw >= 0.999 && lf < 0.001) {
    const AL = LEN.uArm + LEN.fArm, s0 = grip, s1 = LEN.grip, rA = len(sub(madd(HR, u, -s0), P.shL)) / AL, rB = len(sub(madd(HR, u, -s1), P.shL)) / AL;

    const gain = (rB - rA) / (s0 - s1), fold = knee(0.5 - rA), str = knee(rA - 0.94);

    const sh = smooth01(gain / 0.004) * Math.min(s0 - s1, fold / Math.max(gain, 0.004)) + smooth01(-gain / 0.004) * Math.min(s0 - s1, str / Math.max(-gain, 0.004));
    if (sh > 0) HL = madd(HR, u, -(s0 - Math.min(s0 - s1, sh)));
  }
  if (lf > 0.001) HL = lerp(HL, k.L, lf);
  const poleR = TD(k.pR);
  let poleL = TD(k.pL);


  const cw = clamp((lf - 0.15) / 0.6, 0, 1) * 0.75;
  if (cw > 0 && prev && prev.elL && prev.shL && prev.haL) { const off = sub(prev.elL, lerp(prev.shL, prev.haL, 0.5)); if (len(off) > 2) poleL = norm(add(mul(norm(off), cw), mul(norm(poleL), 1 - cw))); }
  const aR = ik3(P.shR, HR, LEN.uArm, LEN.fArm, poleR), aL = ik3(P.shL, HL, LEN.uArm, LEN.fArm, poleL);
  P.elR = aR.m; P.haR = aR.e; P.elL = aL.m; P.haL = aL.e;
  P.reachR = aR.reach / (LEN.uArm + LEN.fArm); P.reachL = aL.reach / (LEN.uArm + LEN.fArm);
  P.gripErr = len(sub(P.haL, HL)) + len(sub(P.haR, HR));
  for (const s of ['R', 'L']) {
    const el = P['el' + s], ha = P['ha' + s], fw = norm(sub(ha, el));
    let hd = norm(add(mul(fw, 0.6), mul(u, 0.4)));
    const c = clamp(dot(fw, hd), -1, 1), MAXW = 50 * D2R;
    if (Math.acos(c) > MAXW) { let q = sub(hd, mul(fw, c)); q = len(q) > 1e-5 ? norm(q) : [0, 1, 0]; hd = add(mul(fw, Math.cos(MAXW)), mul(q, Math.sin(MAXW))); }
    P['wr' + s] = madd(ha, hd, -LEN.hd);
  }
  P.blade = { h: P.haR, u, e };
  P.armed = true; P.inside = false; P.bladeVis = null; P.gripL = lw * (1 - lf); P.fistR = true; P.fistL = lf < 0.5;

  P.saya = { a: mouth, u: d < 0.999 ? u : SY.u, L: LEN.blade + 6 };
  if (d < 0.999) {
    if (d <= 0.02) { P.armed = false; let es = sub([0, -1, 0], mul(u, -u[1])); es = norm(es); P.blade = { h: madd(mouth, u, -2), u, e: es }; }
    else { P.inside = true; P.bladeVis = vis + 2; }
  }
  P.draw = d;

  const bk = norm(sub(P.shR, P.shL))[0];
  const was = prev && prev.mir;
  P.mir = was ? bk > 0.25 : bk > 0.45;
  return P;
}

const API = { BP_A, BP_DT, BP_W, CAM, DOWN_V, DOWN_W, GOV_W, LEN, MOVES, ORDER, REV_HOLD, STRIKE_M, V, WALK_C, WALK_H, WALK_SW, WALK_Z, ZMAX, bladeDir, blendCh, blendU, chAt, drawnR, durOf, flatDrawn, flatU, flipFollow, floorU, followBp, followCh, footAt, fromScr, gaitFeet, govStep, layArm, layLeg, poseAt, poseFromCh, rotToScr, scrA, scrP, scrR, strideOf, strikeAt, turnU, walkFeetLive };
(globalThis.ND_KILIC || (globalThis.ND_KILIC = {})).moves = API;
})();
