// Shadow Duel — NEW SWORD MOVES, TRIAL (kilic-deneme.html only; the game never loads this file).
//
// One method for every move: hand-keyed key poses on the game's own skeleton (the 20-joint body that js/mocap.js
// draws with the game's parts and depth25's 3D katana). No recorded clips, no time warp, no smoothing layers: a move is
// its list of key poses and the time of each, and the picture at any moment is the in-between of two keys.
//
// Local 3D frame, as js/mocap.js: X forward (towards the opponent), Y down (floor y = 0), Z towards the camera (the
// figure's right side). Lengths are the game's (js/skeleton.js ND.LEN, js/mocap.js L20).
//
// A key pose names the body as a swordsman thinks of it:
//   hip   [x, y, z]  pelvis centre            py   pelvis yaw (deg, + = right hip back, chest opening to the camera)
//   cy    chest yaw (deg, same sense)        lean spine pitch forward (deg)      nod  head pitch (deg, + = chin down)
//   R     [x, y, z]  the RIGHT fist (just behind the tsuba); the LEFT fist is always 19 behind it on the handle
//   by, el blade yaw / elevation (deg; yaw 0 = at the opponent, 90 = at the camera; el + = up, past 90 = back over)
//   n     [x, y, z]  the cut's plane normal: the edge is n × blade, so it leads the cut along the plane
//   e     easing INTO this key from the one before: io (in-out), in (speeding up: the cut), out (slowing: the stop),
//         lin, in3 / out3 (stronger)
// Feet are planted for the whole move (MOVE.feet): they never slide; knees and the rest of the leg follow by IK.
// In-betweens: every number is eased on its segment; the fist travels on an arc round the shoulders (direction slerped,
// distance blended), the blade turns through its yaw / elevation, so the tip draws a clean arc.
export const LEN = { thigh: 46, shin: 46, ch: 38.4, nk: 17.6, head: 15, uArm: 30, fArm: 29, hd: 5.5, hipW: 7.5, shUp: 9.5, shW: 12.5, grip: 19, guard: 4, blade: 96 };
const D2R = Math.PI / 180;

// ------------------------------------------------------------------ vectors (arrays)
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
export const V = { add, sub, mul, madd, dot, cross, len, norm, lerp };
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
const rightOf = (f) => [-f[2], 0, f[0]]; // up × f for a level f
export function bladeDir(by, el) { const c = Math.cos(el * D2R); return [c * Math.cos(by * D2R), -Math.sin(el * D2R), c * Math.sin(by * D2R)]; }

// ------------------------------------------------------------------ easing
const EASE = {
  lin: (u) => u,
  io: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u),
  in: (u) => u * u,
  in3: (u) => u * u * u,
  out: (u) => 1 - (1 - u) * (1 - u),
  out3: (u) => 1 - (1 - u) ** 3,
};

// ------------------------------------------------------------------ the stance every move starts from and returns to
// Chudan-no-kamae: right foot forward, hips square to the opponent (a little open to the camera, so the body reads),
// left fist a fist's width in front of the navel, right fist at the tsuba, the tip at the opponent's throat.
const FEET = { R: [24, 6], L: [-22, -6] };
const CHUDAN = { hip: [0, -80, 0], py: 14, cy: 22, lean: 6, nod: 4, R: [38, -104, 2], by: -2, el: 18, n: [0, 0, 1], pR: [-0.15, 1, 0.6], pL: [-0.15, 1, -0.6] };
// elbows: pR / pL is the side each elbow points to (down and out at rest; up and back with the fists over the head, so the
// upper arms go up beside the head instead of across the face)
const UPEL = { pR: [-1, -0.25, 0.3], pL: [-1, -0.25, -0.3] };
const pose = (o) => Object.assign({}, CHUDAN, o);
const at = (t, o, e = 'io') => Object.assign(pose(o), { t, e });

// ------------------------------------------------------------------ the six moves
// keys: [time ms, pose, easing into it]; phases: wind-up / active / recovery in ms (the timing table, DEVIR.md)
export const MOVES = {
  idle: {
    name: 'Idle stance (breathing)', loop: true, feet: FEET,
    // a slow breath (2.6 s): the chest and shoulders rise, the hips sink a hair on the out-breath, the tip breathes with them
    keys: [
      at(0, {}),
      at(1100, { hip: [0.6, -81.2, 0], lean: 7.2, cy: 23, R: [38.6, -105.4, 2], el: 16.8, nod: 4.6 }),
      at(2600, {}),
    ],
    phases: null,
  },
  overhead: {
    name: 'Overhead cut (shomen)', feet: FEET,
    keys: [
      at(0, {}),
      // wind-up: the hands rise in front of the face (never through it), the hips settle back onto the rear foot
      at(180, { hip: [-3, -81, 0], py: 12, cy: 18, lean: 2, nod: 2, R: [42, -156, 4], by: 0, el: 80, pR: [-0.6, 0.3, 0.75], pL: [-0.6, 0.3, -0.75] }, 'io'),
      // furikaburi: both fists above the forehead, the blade back over the head; the body tall
      at(340, { hip: [-5, -82, 0], py: 10, cy: 18, lean: -2, nod: 0, R: [4, -181, 3], by: 0, el: 135, ...UPEL }, 'out'),
      // the hips start forward first; the hands wait (the hips lead the cut)
      at(430, { hip: [3, -81, 0], py: 6, cy: 16, lean: 0, nod: 1, R: [8, -181, 3], by: 0, el: 132, ...UPEL }, 'io'),
      at(495, { hip: [11, -78, 0], py: 3, cy: 6, lean: 3, nod: 3, R: [44, -168, 3], by: 0, el: 70, pR: [-0.3, 0.4, 0.85], pL: [-0.3, 0.4, -0.85] }, 'in'),
      // the strike: arms long (not locked), blade level at head height, hips and shoulders square, weight on the front foot
      at(545, { hip: [17, -76, 0], py: 0, cy: 2, lean: 6, nod: 5, R: [72, -146, 2], by: 0, el: 0 }, 'lin'),
      // follow-through and a controlled stop: the blade goes on down to chest height and the hands squeeze it still
      at(610, { hip: [19, -74.5, 0], py: 0, cy: 2, lean: 8, nod: 6, R: [76, -126, 2], by: 0, el: -20 }, 'out'),
      at(680, { hip: [19, -75, 0], py: 0, cy: 2, lean: 7.5, nod: 6, R: [75, -128, 2], by: 0, el: -16 }, 'io'),
      at(860, { hip: [18.5, -75.2, 0], py: 1, cy: 3, lean: 7, nod: 5, R: [74.5, -128.5, 2], by: 0, el: -15 }, 'io'),
      // recovery: the hips back first, the blade comes up to the throat line again
      at(1060, { hip: [8, -77.5, 0], py: 8, cy: 12, lean: 6, nod: 5, R: [58, -116, 2], by: -1, el: 6 }, 'io'),
      at(1300, {}, 'io'),
    ],
    phases: { windup: [0, 495], active: [495, 610], recovery: [610, 1300] },
  },
  horizontal: {
    name: 'Horizontal cut (yoko, from the right)', feet: FEET,
    keys: [
      at(0, {}),
      // wind-up: hips and shoulders turn right (open to the camera), the blade drawn back past the right hip, low
      at(210, { hip: [-6, -79, 2], py: 32, cy: 50, lean: 4, nod: 3, R: [2, -104, 32], by: 172, el: -14, n: [0, 0.55, 0.84] }, 'io'),
      at(300, { hip: [-6, -79, 2], py: 28, cy: 51, lean: 4, nod: 3, R: [1, -104, 32], by: 174, el: -12, n: [0, 0.6, 0.8] }, 'out'),
      // the hips turn first; the edge rolls into the cut
      at(365, { hip: [2, -78, 1], py: 10, cy: 40, lean: 6, nod: 4, R: [12, -108, 34], by: 150, el: -6, n: [0, 1, 0] }, 'io'),
      at(415, { hip: [10, -77, 0], py: 0, cy: 20, lean: 7, nod: 5, R: [42, -110, 30], by: 80, el: 0, n: [0, 1, 0] }, 'in'),
      // the strike: level through the target, both arms long, the hips square
      at(455, { hip: [16, -76, 0], py: -6, cy: 2, lean: 8, nod: 6, R: [70, -112, 8], by: 6, el: 2, n: [0, 1, 0] }, 'lin'),
      // follow-through to the far side and a stop: the hips close a little, the blade points past the left
      at(520, { hip: [18, -76, 0], py: -12, cy: -14, lean: 8, nod: 6, R: [64, -110, -16], by: -52, el: 0, n: [0, 1, 0] }, 'out'),
      at(590, { hip: [18, -76.5, 0], py: -12, cy: -15, lean: 8, nod: 6, R: [63, -110, -17], by: -56, el: 1, n: [0, 1, 0] }, 'io'),
      at(770, { hip: [17.5, -76.6, 0], py: -11, cy: -14, lean: 8, nod: 6, R: [62.5, -110.5, -16.5], by: -55, el: 1, n: [0, 1, 0] }, 'io'),
      // recovery: the blade comes back round the front to the centre line
      at(990, { hip: [8, -78, 0], py: 4, cy: 8, lean: 7, nod: 5, R: [52, -108, -4], by: -22, el: 10, n: [0, 0.6, 0.8] }, 'io'),
      at(1250, {}, 'io'),
    ],
    phases: { windup: [0, 415], active: [415, 520], recovery: [520, 1250] },
  },
  diagonal: {
    name: 'Diagonal cut (kesa-giri)', feet: FEET,
    keys: [
      at(0, {}),
      // wind-up over the right shoulder: hands up by the right temple (in front of it), blade back and up, hips open
      at(200, { hip: [-4, -81, 1], py: 24, cy: 34, lean: 1, nod: 2, R: [32, -152, 18], by: 30, el: 82, n: [0, 0.5, 0.87] }, 'io'),
      at(330, { hip: [-6, -82, 1], py: 24, cy: 36, lean: -1, nod: 1, R: [12, -168, 24], by: 165, el: 52, n: [0, 0.6, 0.8], pR: UPEL.pR }, 'out'),
      at(410, { hip: [1, -81, 1], py: 16, cy: 32, lean: 1, nod: 2, R: [13, -169, 24], by: 165, el: 50, n: [0, 0.6, 0.8], pR: UPEL.pR }, 'io'),
      at(470, { hip: [10, -78, 0], py: 6, cy: 18, lean: 4, nod: 4, R: [50, -160, 24], by: 35, el: 40, n: [0, 0.6, 0.8] }, 'in'),
      // the strike crosses the target from the right shoulder to the left hip
      at(520, { hip: [17, -76, 0], py: -2, cy: 2, lean: 7, nod: 6, R: [70, -128, 4], by: -14, el: -22, n: [0, 0.6, 0.8] }, 'lin'),
      // follow-through low on the left, stopped (the tip clear of the floor and of the front knee)
      at(585, { hip: [19, -73, 0], py: -10, cy: -10, lean: 11, nod: 7, R: [62, -94, -10], by: -48, el: -46, n: [0, 0.6, 0.8] }, 'out'),
      at(655, { hip: [19, -73.5, 0], py: -10, cy: -11, lean: 10.5, nod: 7, R: [61, -95, -11], by: -50, el: -43, n: [0, 0.6, 0.8] }, 'io'),
      at(835, { hip: [18.5, -73.6, 0], py: -9, cy: -10, lean: 10, nod: 6, R: [60.5, -95.5, -10.5], by: -49, el: -42, n: [0, 0.6, 0.8] }, 'io'),
      at(1040, { hip: [8, -78, 0], py: 4, cy: 8, lean: 7, nod: 5, R: [50, -106, -4], by: -18, el: 4, n: [0, 0.4, 0.92] }, 'io'),
      at(1290, {}, 'io'),
    ],
    phases: { windup: [0, 470], active: [470, 585], recovery: [585, 1290] },
  },
  thrust: {
    name: 'Thrust (tsuki)', feet: FEET,
    // the front foot steps in with the thrust (lifted, set down: no slide) and back out in the recovery
    steps: [{ foot: 'R', t0: 300, t1: 390, dx: 20, h: 7 }, { foot: 'R', t0: 690, t1: 800, dx: -20, h: 5 }],
    keys: [
      at(0, {}),
      // coil: the hips sink and draw back, the fists come in to the belly, the tip rises a hair and stays on the line
      at(200, { hip: [-8, -76, 0], py: 14, cy: 16, lean: 4, nod: 5, R: [28, -102, 2], by: -1, el: 9 }, 'io'),
      at(290, { hip: [-9, -75.5, 0], py: 14, cy: 16, lean: 4, nod: 5, R: [27, -102, 2], by: -1, el: 8 }, 'out'),
      // the drive: hips first, then the arms shoot the point straight down the line as the front foot lands
      at(335, { hip: [6, -76, 0], py: 8, cy: 6, lean: 6, nod: 6, R: [52, -114, 2], by: 0, el: 3 }, 'in'),
      at(390, { hip: [28, -73, 0], py: 2, cy: 0, lean: 10, nod: 7, R: [86, -126, 2], by: 0, el: 1 }, 'lin'),
      // the point stops dead and holds (a hair of overshoot in the hands)
      at(435, { hip: [29, -72.5, 0], py: 1, cy: 0, lean: 10.5, nod: 7, R: [88, -126.5, 2], by: 0, el: 0.5 }, 'out'),
      at(485, { hip: [29, -72.6, 0], py: 1, cy: 0, lean: 10.2, nod: 7, R: [87, -126.2, 2], by: 0, el: 0.8 }, 'io'),
      at(660, { hip: [28, -72.7, 0], py: 2, cy: 1, lean: 10, nod: 7, R: [86, -126, 2], by: 0, el: 1 }, 'io'),
      // pull back (hiki): the hips go back over the stance as the front foot steps out, then chudan
      at(830, { hip: [6, -78, 0], py: 10, cy: 14, lean: 7, nod: 5, R: [54, -112, 2], by: -1, el: 10 }, 'io'),
      at(1080, {}, 'io'),
    ],
    phases: { windup: [0, 335], active: [335, 435], recovery: [435, 1080] },
  },
  block: {
    name: 'Block (overhead, against a cut to the head)', feet: FEET,
    keys: [
      at(0, {}),
      // up fast: the tip swings up and back over the head, the fists end above the forehead and the blade lies flat over
      // the head like a roof, edge up, tip a hair low at the back (reads clearly from the side)
      at(75, { hip: [-2, -79.5, 0], py: 13, cy: 20, lean: 2, nod: 0, R: [34, -146, 5], by: 0, el: 96, pR: [-0.5, 0.3, 0.8], pL: [-0.6, -0.15, -0.8] }, 'io'),
      at(150, { hip: [-3, -79, 0], py: 12, cy: 18, lean: 0, nod: -2, R: [2, -173, 5], by: 0, el: 184, ...UPEL }, 'out'),
      at(260, { hip: [-3.5, -79, 0], py: 12, cy: 18, lean: 0, nod: -2, R: [2, -173.5, 5], by: 0, el: 184, ...UPEL }, 'io'),
      // the impact: the blade gives a little, the knees take it, the body sinks
      at(300, { hip: [-6, -75, 0], py: 12, cy: 17, lean: -1, nod: 0, R: [1, -167, 5], by: 0, el: 189, ...UPEL }, 'out3'),
      at(380, { hip: [-5, -76.5, 0], py: 12, cy: 17, lean: 0, nod: -1, R: [2, -170, 5], by: 0, el: 187, ...UPEL }, 'io'),
      // release: the blade swings back over the head to the front and settles in chudan
      at(520, { hip: [2, -78, 0], py: 10, cy: 16, lean: 3, nod: 2, R: [26, -168, 5], by: 0, el: 140, pR: [-0.6, 0.3, 0.75], pL: [-0.6, 0.3, -0.75] }, 'io'),
      at(900, {}, 'io'),
    ],
    phases: { windup: [0, 150], active: [260, 380], recovery: [380, 900] },
    impact: 300,
  },
};
export const ORDER = ['idle', 'overhead', 'horizontal', 'diagonal', 'thrust', 'block'];
export const durOf = (id) => MOVES[id].keys[MOVES[id].keys.length - 1].t;

// ------------------------------------------------------------------ the body of one key (joints, no arms yet)
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

// ------------------------------------------------------------------ the pose at time t (ms) of a move: the drawn joints
// Returns P in js/mocap.js's shape (Mo.draw reads it) plus a few numbers the checks read (reachR / reachL).
// Every number of the key poses is a channel; between keys it runs on a monotone cubic (speed continuous through a key,
// never past either key's value — no overshoot, no wobble). A key reached with e 'out' / 'out3' (a stop: the top of a
// wind-up, the end of a follow-through) and the first and last keys are reached at rest; a key between two that both
// lie on the same side (a turning point) too. The right fist is a channel in spherical form round the shoulder centre
// (distance, azimuth, elevation), so it travels on arcs round the shoulders, never on the chord through the body.
const CH = ['hx', 'hy', 'hz', 'py', 'cy', 'lean', 'nod', 'by', 'el', 'nx', 'ny', 'nz', 'rr', 'raz', 'rel', 'prx', 'pry', 'prz', 'plx', 'ply', 'plz'];
const STOP = { out: 1, out3: 1 };
const CACHE = new Map();
function channels(id) {
  let C = CACHE.get(id);
  if (C) return C;
  const K = MOVES[id].keys, n = K.length, t = K.map((k) => k.t), v = {};
  for (const c of CH) v[c] = new Array(n);
  let az0 = null;
  K.forEach((k, i) => {
    const B = torso(k), r = sub(k.R, B.shC), rr = len(r);
    let az = Math.atan2(r[2], r[0]);
    if (az0 != null) while (az - az0 > Math.PI) az -= 2 * Math.PI; else az0 = az;
    if (az0 != null) while (az - az0 < -Math.PI) az += 2 * Math.PI;
    az0 = az;
    const o = { hx: k.hip[0], hy: k.hip[1], hz: k.hip[2], py: k.py, cy: k.cy, lean: k.lean, nod: k.nod, by: k.by, el: k.el, nx: k.n[0], ny: k.n[1], nz: k.n[2], rr, raz: az, rel: Math.asin(clamp(-r[1] / rr, -1, 1)), prx: k.pR[0], pry: k.pR[1], prz: k.pR[2], plx: k.pL[0], ply: k.pL[1], plz: k.pL[2] };
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
  CACHE.set(id, C);
  return C;
}
function sampleCh(C, t) {
  const T = C.t, n = T.length;
  let i = 1;
  while (i < n - 1 && t > T[i]) i++;
  const h = T[i] - T[i - 1], s = clamp((t - T[i - 1]) / Math.max(1e-6, h), 0, 1), s2 = s * s, s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2, o = {};
  for (const c of CH) { const p = C.v[c], m = C.m[c]; o[c] = h00 * p[i - 1] + h10 * h * m[i - 1] + h01 * p[i] + h11 * h * m[i]; }
  return o;
}
export function poseAt(id, t, prev) {
  const M = MOVES[id], T = durOf(id);
  if (M.loop) t = ((t % T) + T) % T;
  t = clamp(t, 0, T);
  const o = sampleCh(channels(id), t);
  const k = { hip: [o.hx, o.hy, o.hz], py: o.py, cy: o.cy, lean: o.lean, nod: o.nod, by: o.by, el: o.el, n: norm([o.nx, o.ny, o.nz]), pR: [o.prx, o.pry, o.prz], pL: [o.plx, o.ply, o.plz] };
  const B = torso(k), ce = Math.cos(o.rel);
  const R = madd(B.shC, [ce * Math.cos(o.raz), -Math.sin(o.rel), ce * Math.sin(o.raz)], o.rr);
  return build(M, k, B, R, prev, t);
}

// where a foot is at time t: planted, or in a step (MOVE.steps: { foot, t0, t1, dx, dz, h }) — it travels only while it is
// off the floor: forward on a smoothstep, lifted on a half sine, so it leaves and lands vertically and never slides
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
function build(M, k, B, R, prev, t = 0) {
  const P = {};
  P.hip = B.hip; P.chest = B.chest; P.neck = B.neck; P.head = B.head; P.shR = B.shR; P.shL = B.shL;
  P.hipR = madd(B.hip, B.rP, LEN.hipW); P.hipL = madd(B.hip, B.rP, -LEN.hipW);
  P.pl = B.rP; P.cf = norm(sub(mul(B.fC, Math.cos(k.lean * D2R)), mul(UP, Math.sin(k.lean * D2R)))); P.hf = B.fH;
  // legs: planted feet, knees forward over the toes
  for (const s of ['R', 'L']) {
    const ft = footAt(M, s, t), hp = P['hip' + s];
    const r = ik3(hp, ft, LEN.thigh, LEN.shin, add(B.fP, [0, -0.15, s === 'R' ? 0.25 : -0.25]));
    P['kn' + s] = r.m; P['ft' + s] = r.e; P['legReach' + s] = r.reach / (LEN.thigh + LEN.shin);
  }
  P.toR = [1, 0, 0]; P.toL = norm([0.96, 0, -0.28]);
  // sword: the blade's direction and edge, both fists on the handle
  const u = bladeDir(k.by, k.el);
  let e = cross(k.n, u); if (len(e) < 1e-3) e = cross([0, 0, 1], u); e = norm(sub(e, mul(u, dot(e, u))));
  const HR = R, HL = madd(R, u, -LEN.grip);
  const poleR = k.pR, poleL = k.pL;
  const aR = ik3(P.shR, HR, LEN.uArm, LEN.fArm, poleR), aL = ik3(P.shL, HL, LEN.uArm, LEN.fArm, poleL);
  P.elR = aR.m; P.haR = aR.e; P.elL = aL.m; P.haL = aL.e;
  P.reachR = aR.reach / (LEN.uArm + LEN.fArm); P.reachL = aL.reach / (LEN.uArm + LEN.fArm);
  P.gripErr = len(sub(P.haL, HL)) + len(sub(P.haR, HR)); // (0 unless an arm could not reach: a hand off the handle)
  for (const s of ['R', 'L']) {
    const el = P['el' + s], ha = P['ha' + s], fw = norm(sub(ha, el));
    let hd = norm(add(mul(fw, 0.6), mul(u, 0.4)));
    const c = clamp(dot(fw, hd), -1, 1), MAXW = 50 * D2R;
    if (Math.acos(c) > MAXW) { let q = sub(hd, mul(fw, c)); q = len(q) > 1e-5 ? norm(q) : [0, 1, 0]; hd = add(mul(fw, Math.cos(MAXW)), mul(q, Math.sin(MAXW))); }
    P['wr' + s] = madd(ha, hd, -LEN.hd);
  }
  P.blade = { h: P.haR, u, e };
  P.armed = true; P.inside = false; P.bladeVis = null; P.gripL = 1; P.fistR = true; P.fistL = true;
  // the scabbard stays in the obi at the left hip, turning with the pelvis (as depth25's obiAt / restDirAt)
  const r0 = [-0.955, 0.296, -0.12];
  P.saya = { a: add(add(madd(B.hip, B.fP, 13), mul(UP, 5)), mul(B.rP, -6)), u: norm(add(add(mul(B.fP, r0[0]), [0, r0[1], 0]), mul(B.rP, r0[2]))), L: LEN.blade + 6 };
  // back to the camera (the drawing then mirrors the upper body's depth, as js/mocap.js build): with hysteresis
  const bk = norm(sub(P.shR, P.shL))[0];
  const was = prev && prev.mir;
  P.mir = was ? bk > 0.25 : bk > 0.45;
  return P;
}
