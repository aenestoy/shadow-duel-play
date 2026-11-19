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
const CHUDAN = { hip: [0, -80, 0], py: 14, cy: 22, lean: 6, nod: 4, R: [38, -104, 2], by: -2, el: 18, n: [0, 0, 1], pR: [-0.15, 1, 0.6], pL: [-0.15, 1, -0.6], lw: 1, d: 1 };
// lw: the left fist on the handle (1) or holding the saya's mouth (0); d: how much of the blade is out of the saya (1 all,
// 0 sheathed: the iai draw and the noto; while d < 1 the blade runs from the right fist through the saya's mouth)
// elbows: pR / pL is the side each elbow points to (down and out at rest; up and back with the fists over the head, so the
// upper arms go up beside the head instead of across the face)
const UPEL = { pR: [-1, -0.25, 0.3], pL: [-1, -0.25, -0.3] };
const pose = (o) => Object.assign({}, CHUDAN, o);
const at = (t, o, e = 'io') => Object.assign(pose(o), { t, e });
// the three held guards (the pose the guard stays on, and the block's start and end)
const G_MID = { hip: [-2, -77.5, 0], py: 16, cy: 26, lean: 4, nod: 3, R: [36, -118, 8], by: 4, el: 62, pR: [-0.3, 0.8, 0.6], pL: [-0.2, 0.9, -0.5] };
const G_HI = { hip: [-3, -79, 0], py: 12, cy: 18, lean: 0, nod: -2, R: [2, -173, 5], by: 0, el: 184, ...UPEL };
const G_LOW = { hip: [-2, -75, 0], py: 16, cy: 24, lean: 7, nod: 8, R: [47, -96, 4], by: 6, el: -36, pR: [-0.2, 1, 0.5], pL: [-0.2, 1, -0.5] };

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
      // wind-up: the chest opens to the camera (3/4, never the back), the fists go up out in front, under the chin line
      at(150, { hip: [-2, -80.5, 0], py: 14, cy: 30, lean: 3, nod: 3, R: [44, -140, 4], by: 0, el: 62, pR: [-0.5, 0.45, 0.75], pL: [-0.5, 0.45, -0.75] }, 'io'),
      // the fists keep rising out in front with the elbows still low (the forearms stand clear of the face) ...
      at(205, { hip: [-3, -81, 0], py: 13, cy: 34, lean: 2, nod: 2, R: [30, -162, 4], by: 0, el: 96, pR: [-0.2, 0.9, 0.4], pL: [-0.6, 0.3, -0.75] }, 'io'),
      at(238, { hip: [-3.5, -81.2, 0], py: 12.5, cy: 36, lean: 2, nod: 2, R: [21, -171, 4], by: 0, el: 110, pR: [-0.3, 0.3, 0.9], pL: [-0.8, 0, -0.6] }, 'io'),
      // ... then the elbows flick up and back so the near arm rises behind the face, the fists pass over the forehead
      at(268, { hip: [-4, -81.5, 0], py: 12, cy: 38, lean: 2, nod: 2, R: [10, -180, 3], by: 0, el: 122, ...UPEL }, 'io'),
      // furikaburi: fists high over the crown, the blade back over the head; the body tall, the face clear
      at(340, { hip: [-5, -82, 0], py: 11, cy: 40, lean: 1, nod: 1, R: [-8, -185, 3], by: 0, el: 150, ...UPEL }, 'out'),
      // the hips start forward first; the hands wait (the hips lead the cut)
      at(430, { hip: [3, -81, 0], py: 7, cy: 36, lean: 3, nod: 2, R: [2, -184, 3], by: 0, el: 156, ...UPEL }, 'io'),
      at(495, { hip: [11, -78, 0], py: 3, cy: 16, lean: 5, nod: 3, R: [44, -168, 3], by: 0, el: 70, pR: [-0.3, 0.4, 0.85], pL: [-0.5, 0.2, -0.85] }, 'in'),
      // the strike: arms long (not locked), blade level at head height, hips and shoulders square, weight on the front foot
      at(545, { hip: [17, -76, 0], py: 0, cy: 2, lean: 6, nod: 5, R: [72, -146, 2], by: 0, el: 0 }, 'lin'),
      // follow-through and a controlled stop: the blade goes on down to chest height and the hands squeeze it still
      at(610, { hip: [19, -74.5, 0], py: 0, cy: 2, lean: 8, nod: 6, R: [76, -126, 2], by: 0, el: -20 }, 'out'),
      at(670, { hip: [18.5, -75, 0], py: 1, cy: 3, lean: 7.5, nod: 6, R: [74, -127, 2], by: 0, el: -15 }, 'io'),
      // back to guard in one move: the hips come back over the stance, the blade rises to the centre line, the weight settles
      at(830, { hip: [7, -78, 0], py: 9, cy: 14, lean: 6, nod: 5, R: [54, -113, 2], by: -1, el: 9 }, 'io'),
      at(1010, {}, 'io'),
    ],
    phases: { windup: [0, 495], active: [495, 610], recovery: [610, 1010] },
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
      at(580, { hip: [17.5, -76.5, 0], py: -11, cy: -13, lean: 8, nod: 6, R: [62, -110, -15], by: -50, el: 2, n: [0, 1, 0] }, 'io'),
      // back to guard in one move: the blade comes back round the front to the centre line, the hips settle back
      at(750, { hip: [8, -78, 0], py: 4, cy: 9, lean: 7, nod: 5, R: [52, -108, -4], by: -22, el: 10, n: [0, 0.6, 0.8] }, 'io'),
      at(930, {}, 'io'),
    ],
    phases: { windup: [0, 415], active: [415, 520], recovery: [520, 930] },
  },
  diagonal: {
    name: 'Diagonal cut (kesa-giri)', feet: FEET,
    keys: [
      at(0, {}),
      // wind-up over the right shoulder: the chest opens to the camera, the fists rise out in front with the elbows low ...
      at(170, { hip: [-3, -81, 1], py: 22, cy: 32, lean: 2, nod: 2, R: [34, -150, 16], by: 30, el: 80, n: [0, 0.5, 0.87], pR: [-0.2, 0.9, 0.4], pL: [-0.3, 0.8, -0.5] }, 'io'),
      // ... then the elbows go up and back so the near arm rises behind the face; the blade swings back over the shoulder
      at(212, { hip: [-4, -81.5, 1], py: 23, cy: 36, lean: 1, nod: 2, R: [20, -166, 18], by: 95, el: 66, n: [0, 0.55, 0.84], pR: [-0.3, 0.3, 0.9], pL: [0.6, 0.6, -0.4] }, 'io'),
      at(255, { hip: [-5, -82, 1], py: 24, cy: 39, lean: 0, nod: 1, R: [4, -178, 18], by: 150, el: 56, n: [0, 0.6, 0.8], ...UPEL, pL: [0.6, 0.6, -0.4] }, 'io'),
      // the top: fists high by the right side of the crown, the face clear
      at(330, { hip: [-6, -82, 1], py: 24, cy: 41, lean: 0, nod: 1, R: [-4, -181, 18], by: 165, el: 52, n: [0, 0.6, 0.8], ...UPEL, pL: [0.6, 0.6, -0.4] }, 'out'),
      at(410, { hip: [1, -81, 1], py: 16, cy: 36, lean: 2, nod: 2, R: [2, -182, 20], by: 165, el: 48, n: [0, 0.6, 0.8], ...UPEL, pL: [0.6, 0.6, -0.4] }, 'io'),
      at(470, { hip: [10, -78, 0], py: 6, cy: 18, lean: 4, nod: 4, R: [50, -160, 24], by: 35, el: 40, n: [0, 0.6, 0.8], pR: [-0.3, 0.4, 0.85], pL: [0.2, 0.8, -0.6] }, 'in'),
      // the strike crosses the target from the right shoulder to the left hip
      at(520, { hip: [17, -76, 0], py: -2, cy: 2, lean: 7, nod: 6, R: [70, -128, 4], by: -14, el: -22, n: [0, 0.6, 0.8] }, 'lin'),
      // follow-through low on the left, stopped (the tip clear of the floor and of the front knee)
      at(585, { hip: [19, -73, 0], py: -10, cy: -10, lean: 11, nod: 7, R: [62, -94, -10], by: -48, el: -46, n: [0, 0.6, 0.8] }, 'out'),
      at(645, { hip: [18.5, -73.5, 0], py: -9, cy: -9, lean: 10.5, nod: 7, R: [60, -96, -10], by: -47, el: -40, n: [0, 0.6, 0.8] }, 'io'),
      // back to guard in one move: the blade comes up round the front to the centre line, the hips settle back
      at(815, { hip: [8, -78, 0], py: 5, cy: 9, lean: 7, nod: 5, R: [50, -106, -4], by: -18, el: 5, n: [0, 0.4, 0.92] }, 'io'),
      at(995, {}, 'io'),
    ],
    phases: { windup: [0, 470], active: [470, 585], recovery: [585, 995] },
  },
  thrust: {
    name: 'Thrust (tsuki)', feet: FEET,
    // the front foot steps in with the thrust (lifted, set down: no slide) and back out in the recovery
    steps: [{ foot: 'R', t0: 300, t1: 390, dx: 20, h: 7 }, { foot: 'R', t0: 505, t1: 625, dx: -20, h: 5 }],
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
      at(490, { hip: [28.5, -72.6, 0], py: 1, cy: 1, lean: 10, nod: 7, R: [86, -125.5, 2], by: 0, el: 1 }, 'io'),
      // pull back (hiki) in one move: the hips go back over the stance as the front foot steps out, the point stays on the line
      at(650, { hip: [6, -78, 0], py: 10, cy: 14, lean: 7, nod: 5, R: [54, -112, 2], by: -1, el: 10 }, 'io'),
      at(840, {}, 'io'),
    ],
    phases: { windup: [0, 335], active: [335, 435], recovery: [435, 840] },
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
      // release in one move: the near elbow swings out toward the camera (not across the face) as the blade comes over
      // to the front, then the fists sink to the centre line and the weight settles
      at(460, { hip: [-1, -77.5, 0], py: 12, cy: 20, lean: 2, nod: 1, R: [34, -146, 6], by: 0, el: 80, pR: [0, 0.2, 1], pL: [-0.6, 0, -0.8] }, 'io'),
      at(600, { hip: [2, -79, 0], py: 13, cy: 21, lean: 5, nod: 3, R: [44, -114, 3], by: -1, el: 26, pR: [-0.2, 0.8, 0.6], pL: [-0.2, 0.9, -0.6] }, 'io'),
      at(780, {}, 'io'),
    ],
    phases: { windup: [0, 150], active: [260, 380], recovery: [380, 780] },
    impact: 300,
  },

  // ---------------------------------------------------------------- phase 2: the fight's light cuts (small kendo strikes)
  // A light cut is the big cut made small: the same path (fists round the shoulders, elbows up and back past the face,
  // hips first, then the hands), a shorter wind-up and a quicker return; strike ~0.25 s, done ~0.7 s (the fight's light
  // class). Used by the light string (Akane: L1 yoko from the left, L2 kesa, L3 thrust; Kuro: kesa, gyaku-kesa, men).
  kesaS: {
    name: 'Light kesa (from the right shoulder)', feet: FEET,
    keys: [
      at(0, {}),
      // the fists go up and back past the right ear with the elbows low, then the elbows flick up behind the face
      at(85, { hip: [-2, -80.5, 0.5], py: 18, cy: 30, lean: 3, nod: 3, R: [38, -146, 10], by: 30, el: 80, n: [0, 0.5, 0.87], pR: [-0.2, 0.9, 0.4], pL: [-0.3, 0.8, -0.5] }, 'io'),
      at(112, { hip: [-2.5, -81, 0.8], py: 20, cy: 34, lean: 2, nod: 2, R: [24, -163, 14], by: 95, el: 66, n: [0, 0.55, 0.84], pR: [-0.3, 0.3, 0.9], pL: [0.6, 0.6, -0.4] }, 'io'),
      at(145, { hip: [-3, -81.2, 1], py: 21, cy: 36, lean: 1, nod: 2, R: [6, -174, 17], by: 140, el: 55, n: [0, 0.6, 0.8], ...UPEL, pL: [0.6, 0.6, -0.4] }, 'io'),
      // the top, short: fists by the right side of the crown, blade back over the shoulder
      at(175, { hip: [-4, -81.5, 1], py: 22, cy: 38, lean: 0, nod: 1, R: [-3, -182, 18], by: 158, el: 52, n: [0, 0.6, 0.8], ...UPEL, pL: [0.6, 0.6, -0.4] }, 'out'),
      at(195, { hip: [0, -81, 1], py: 18, cy: 35, lean: 1, nod: 2, R: [0, -182, 20], by: 158, el: 48, n: [0, 0.6, 0.8], ...UPEL, pL: [0.6, 0.6, -0.4] }, 'io'),
      at(238, { hip: [9, -78, 0], py: 7, cy: 18, lean: 3, nod: 2, R: [48, -160, 24], by: 35, el: 36, n: [0, 0.6, 0.8], pR: [-0.3, 0.4, 0.85], pL: [0.2, 0.8, -0.6] }, 'in'),
      at(268, { hip: [15, -76.5, 0], py: -2, cy: 2, lean: 7, nod: 6, R: [68, -128, 4], by: -14, el: -22, n: [0, 0.6, 0.8] }, 'lin'),
      at(320, { hip: [17, -74, 0], py: -9, cy: -9, lean: 10, nod: 7, R: [60, -96, -10], by: -46, el: -39, n: [0, 0.6, 0.8] }, 'out'),
      at(365, { hip: [16.5, -74.5, 0], py: -8, cy: -8, lean: 9.5, nod: 7, R: [58, -98, -10], by: -45, el: -34, n: [0, 0.6, 0.8] }, 'io'),
      at(530, { hip: [7, -78, 0], py: 5, cy: 9, lean: 7, nod: 5, R: [50, -106, -3], by: -18, el: 6, n: [0, 0.4, 0.92] }, 'io'),
      at(700, {}, 'io'),
    ],
    phases: { windup: [0, 235], active: [235, 320], recovery: [320, 700] },
  },
  gyakuS: {
    name: 'Light gyaku-kesa (from the left shoulder)', feet: FEET,
    keys: [
      at(0, {}),
      // up over the left side of the crown: the elbows go up and back so the near arm passes behind the face
      at(90, { hip: [-2, -80.5, -0.5], py: 10, cy: 14, lean: 3, nod: 3, R: [32, -148, 0], by: -30, el: 80, n: [0, -0.5, 0.87], pR: [-0.3, 0.4, 0.85], pL: [-0.1, 0.35, -0.9] }, 'io'),
      at(115, { hip: [-2.5, -81, -0.8], py: 9, cy: 12, lean: 2, nod: 2, R: [24, -166, -2], by: -75, el: 72, n: [0, -0.55, 0.84], pR: [-0.6, 0.1, 0.8], pL: [0.2, -0.1, -0.9] }, 'io'),
      at(145, { hip: [-3, -81.2, -1], py: 8, cy: 10, lean: 1, nod: 1, R: [14, -179, -3], by: -120, el: 58, n: [0, -0.6, 0.8], ...UPEL, pL: [-0.75, -0.2, -0.65] }, 'io'),
      at(180, { hip: [-4, -81.5, -1], py: 6, cy: 8, lean: 0, nod: 1, R: [0, -180, -4], by: -150, el: 50, n: [0, -0.6, 0.8], ...UPEL, pL: [-0.75, -0.2, -0.65] }, 'out'),
      at(205, { hip: [0, -81, -1], py: 7, cy: 9, lean: 1, nod: 2, R: [2, -180, -3], by: -150, el: 46, n: [0, -0.6, 0.8], ...UPEL, pL: [-0.75, -0.2, -0.65] }, 'io'),
      at(240, { hip: [9, -78, 0], py: 9, cy: 12, lean: 3, nod: 2, R: [44, -162, -2], by: -35, el: 40, n: [0, -0.6, 0.8], pR: [-0.55, 0.15, 0.85], pL: [-0.65, 0, -0.8] }, 'in'),
      // the strike crosses from the left shoulder to the right hip; the follow-through ends low on the near side
      at(256, { hip: [12.5, -77, 0], py: 10, cy: 15, lean: 5, nod: 4, R: [60, -147, -4], by: -12, el: 10, n: [0, -0.6, 0.8], pR: [-0.25, 0.6, 0.75], pL: [-0.4, 0.5, -0.8] }, 'lin'),
      at(272, { hip: [15, -76.5, 0], py: 12, cy: 20, lean: 7, nod: 6, R: [68, -128, 4], by: 14, el: -22, n: [0, -0.6, 0.8], pL: [-0.3, 0.7, -0.65] }, 'lin'),
      at(325, { hip: [17, -74, 0], py: 16, cy: 26, lean: 10, nod: 7, R: [60, -98, 20], by: 46, el: -44, n: [0, -0.6, 0.8] }, 'out'),
      at(370, { hip: [16.5, -74.5, 0], py: 16, cy: 25, lean: 9.5, nod: 7, R: [59, -100, 20], by: 45, el: -38, n: [0, -0.6, 0.8] }, 'io'),
      at(540, { hip: [7, -78, 0], py: 15, cy: 21, lean: 7, nod: 5, R: [52, -106, 8], by: 18, el: 6, n: [0, -0.3, 0.95] }, 'io'),
      at(720, {}, 'io'),
    ],
    phases: { windup: [0, 240], active: [240, 325], recovery: [325, 720] },
  },
  menS: {
    name: 'Light men (small cut to the head)', feet: FEET,
    keys: [
      at(0, {}),
      // kendo's small men: the fists rise only to the forehead, the blade a little past upright
      at(80, { hip: [-1.5, -80.5, 0], py: 14, cy: 28, lean: 3, nod: 3, R: [42, -142, 4], by: 0, el: 66, pR: [-0.5, 0.45, 0.75], pL: [-0.5, 0.45, -0.75] }, 'io'),
      at(140, { hip: [-3, -81, 0], py: 13, cy: 33, lean: 2, nod: 2, R: [32, -163, 4], by: 0, el: 100, pR: [-0.2, 0.9, 0.4], pL: [-0.6, 0.3, -0.75] }, 'io'),
      at(170, { hip: [-3.5, -81, 0], py: 12.5, cy: 34, lean: 2, nod: 2, R: [28, -166, 4], by: 0, el: 108, pR: [-0.3, 0.3, 0.9], pL: [-0.8, 0, -0.6] }, 'io'),
      at(205, { hip: [6, -79, 0], py: 6, cy: 18, lean: 4, nod: 3, R: [50, -160, 3], by: 0, el: 60, pR: [-0.3, 0.4, 0.85], pL: [-0.5, 0.2, -0.85] }, 'in'),
      at(245, { hip: [15, -76.5, 0], py: 0, cy: 2, lean: 6, nod: 5, R: [69, -145, 2], by: 0, el: 0 }, 'lin'),
      at(300, { hip: [17, -75, 0], py: 0, cy: 2, lean: 8, nod: 6, R: [73, -127, 2], by: 0, el: -18 }, 'out'),
      at(345, { hip: [16.5, -75.5, 0], py: 1, cy: 3, lean: 7.5, nod: 6, R: [71, -128, 2], by: 0, el: -14 }, 'io'),
      at(520, { hip: [6, -78, 0], py: 9, cy: 14, lean: 6, nod: 5, R: [54, -113, 2], by: -1, el: 9 }, 'io'),
      at(680, {}, 'io'),
    ],
    phases: { windup: [0, 205], active: [205, 300], recovery: [300, 680] },
  },
  yokoL: {
    name: 'Light yoko (from the left, backhand)', feet: FEET,
    keys: [
      at(0, {}),
      // the blade is taken back past the left hip (the far side), edge out, the hips turn a little away
      at(100, { hip: [-3, -79.5, -1], py: 8, cy: 10, lean: 4, nod: 3, R: [26, -102, -14], by: -110, el: -6, n: [0, -0.55, 0.84], pR: [-0.2, 0.8, 0.6], pL: [-0.4, 0.7, -0.6] }, 'io'),
      at(160, { hip: [-5, -79, -2], py: 2, cy: 2, lean: 4, nod: 3, R: [10, -100, -24], by: -165, el: -8, n: [0, -0.6, 0.8] }, 'io'),
      at(195, { hip: [-5.5, -79, -2], py: 0, cy: 0, lean: 4, nod: 3, R: [9, -100, -25], by: -168, el: -8, n: [0, -0.6, 0.8] }, 'out'),
      // the hips turn first, the edge rolls into the cut; level through the target, out to the near side, stopped
      at(225, { hip: [2, -78, -1], py: 4, cy: 4, lean: 6, nod: 4, R: [18, -106, -28], by: -140, el: -4, n: [0, -1, 0] }, 'io'),
      at(250, { hip: [8, -77, 0], py: 6, cy: 6, lean: 7, nod: 5, R: [50, -110, -24], by: -70, el: 0, n: [0, -1, 0] }, 'in'),
      at(280, { hip: [15, -76, 0], py: 8, cy: 8, lean: 8, nod: 6, R: [66, -112, -4], by: 0, el: 2, n: [0, -1, 0] }, 'lin'),
      at(335, { hip: [17, -76, 0], py: 16, cy: 28, lean: 8, nod: 6, R: [62, -110, 22], by: 55, el: 2, n: [0, -1, 0] }, 'out'),
      at(380, { hip: [16.5, -76.5, 0], py: 16, cy: 27, lean: 8, nod: 6, R: [61, -110, 21], by: 53, el: 4, n: [0, -1, 0] }, 'io'),
      at(540, { hip: [7, -78, 0], py: 15, cy: 22, lean: 7, nod: 5, R: [52, -108, 10], by: 22, el: 10, n: [0, -0.4, 0.92] }, 'io'),
      at(700, {}, 'io'),
    ],
    phases: { windup: [0, 250], active: [250, 335], recovery: [335, 700] },
  },
  tsukiS: {
    name: 'Light thrust (tsuki, quick)', feet: FEET,
    steps: [{ foot: 'R', t0: 150, t1: 215, dx: 18, h: 6 }, { foot: 'R', t0: 330, t1: 440, dx: -18, h: 4 }],
    keys: [
      at(0, {}),
      at(110, { hip: [-7, -76.5, 0], py: 14, cy: 16, lean: 4, nod: 5, R: [29, -102, 2], by: -1, el: 9 }, 'io'),
      at(150, { hip: [-8, -76, 0], py: 14, cy: 16, lean: 4, nod: 5, R: [28, -102, 2], by: -1, el: 8 }, 'out'),
      at(180, { hip: [5, -76, 0], py: 8, cy: 6, lean: 6, nod: 6, R: [50, -113, 2], by: 0, el: 3 }, 'in'),
      at(215, { hip: [25, -73.5, 0], py: 2, cy: 0, lean: 10, nod: 7, R: [84, -125, 2], by: 0, el: 1 }, 'lin'),
      at(250, { hip: [26, -73, 0], py: 1, cy: 0, lean: 10.5, nod: 7, R: [86, -125.5, 2], by: 0, el: 0.5 }, 'out'),
      at(290, { hip: [25.5, -73.1, 0], py: 1, cy: 1, lean: 10, nod: 7, R: [84, -124.5, 2], by: 0, el: 1 }, 'io'),
      at(430, { hip: [6, -78, 0], py: 10, cy: 14, lean: 7, nod: 5, R: [54, -112, 2], by: -1, el: 10 }, 'io'),
      at(580, {}, 'io'),
    ],
    phases: { windup: [0, 180], active: [180, 255], recovery: [255, 580] },
  },

  // ---------------------------------------------------------------- guards (held while GUARD is down) and their blocks
  // hold: the key the pose stays on while the fight holds the state; the keys after it are the release (the viewer).
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
      at(75, { hip: [-2, -79.5, 0], py: 13, cy: 20, lean: 2, nod: 0, R: [34, -146, 5], by: 0, el: 96, pR: [-0.5, 0.3, 0.8], pL: [-0.6, -0.15, -0.8] }, 'io'),
      at(150, G_HI, 'out'),
      at(450, G_HI, 'io'),
      at(530, { hip: [-1, -77.5, 0], py: 12, cy: 20, lean: 2, nod: 1, R: [34, -146, 6], by: 0, el: 80, pR: [0, 0.2, 1], pL: [-0.6, 0, -0.8] }, 'io'),
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
  // a blow met: from the held guard, the blade gives a little, the knees take it, then back to the guard
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

  // ---------------------------------------------------------------- reactions: struck, blocked
  // tail: the keys from this one on are placed against the END of the fight's state (the reel plays from its start, the
  // pose is held, the recovery ends as the state does): the stun stays the fight's own.
  hurtHi: {
    name: 'Hit high (cut to the head / shoulder)', feet: FEET, tail: 3,
    keys: [
      at(0, {}),
      // the head and chest snap back away from the blow, the hands fly up and back, the tip up off the line
      at(70, { hip: [-8, -79, 0], py: 20, cy: 34, lean: -10, nod: -12, R: [26, -122, 8], by: -10, el: 48, pR: [-0.3, 0.7, 0.7], pL: [-0.3, 0.8, -0.6] }, 'out3'),
      at(170, { hip: [-10, -77, 0], py: 22, cy: 36, lean: -6, nod: -6, R: [24, -116, 8], by: -8, el: 40, pR: [-0.3, 0.7, 0.7], pL: [-0.3, 0.8, -0.6] }, 'io'),
      // back to guard as the stun ends: the weight comes forward, the tip back to the centre line
      at(280, { hip: [-4, -79, 0], py: 16, cy: 26, lean: 3, nod: 2, R: [34, -108, 4], by: -2, el: 22 }, 'io'),
      at(400, {}, 'io'),
    ],
    phases: null,
  },
  hurtBody: {
    name: 'Hit to the body (folds)', feet: FEET, tail: 3,
    keys: [
      at(0, {}),
      // the trunk folds round the blow, the hips go back, the hands drop and the tip sinks
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
  recoil: {
    name: 'Recoil (the cut is blocked, the blade bounces)', feet: FEET, tail: 3,
    keys: [
      at(0, { hip: [15, -76.5, 0], py: 0, cy: 4, lean: 7, nod: 6, R: [66, -130, 3], by: -6, el: -8 }),
      // the blade is knocked back up off the other's, the body rocks back onto the rear foot
      at(60, { hip: [4, -78.5, 0], py: 14, cy: 26, lean: 1, nod: 1, R: [42, -138, 6], by: -4, el: 70, pR: [-0.4, 0.6, 0.7], pL: [-0.4, 0.6, -0.7] }, 'out3'),
      at(140, { hip: [1, -79, 0], py: 15, cy: 26, lean: 2, nod: 2, R: [42, -134, 6], by: -4, el: 64, pR: [-0.4, 0.6, 0.7], pL: [-0.4, 0.6, -0.7] }, 'io'),
      at(240, { hip: [1, -79.5, 0], py: 14, cy: 23, lean: 5, nod: 4, R: [38, -112, 4], by: -3, el: 30 }, 'io'),
      at(340, {}, 'io'),
    ],
    phases: null,
  },
};
export const ORDER = ['idle', 'overhead', 'horizontal', 'diagonal', 'thrust', 'block',
  'kesaS', 'gyakuS', 'menS', 'yokoL', 'tsukiS', 'guardMid', 'guardHi', 'guardLow', 'blockMid', 'blockHi', 'blockLow', 'hurtHi', 'hurtBody', 'stagger', 'recoil'];
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
const CH = ['hx', 'hy', 'hz', 'py', 'cy', 'lean', 'nod', 'by', 'el', 'nx', 'ny', 'nz', 'rr', 'raz', 'rel', 'prx', 'pry', 'prz', 'plx', 'ply', 'plz', 'lw', 'dr'];
const STOP = { out: 1, out3: 1 };
const CACHE = new Map();
// the saya in the obi at the left hip, turning with the pelvis (as depth25's obiAt / restDirAt)
function sayaOf(B) {
  const r0 = [-0.955, 0.296, -0.12];
  return { a: add(add(madd(B.hip, B.fP, 13), mul(UP, 5)), mul(B.rP, -6)), u: norm(add(add(mul(B.fP, r0[0]), [0, r0[1], 0]), mul(B.rP, r0[2]))) };
}
// a key with `iai: true` (the sword in the saya, or coming out of it): its blade lies along the saya and its right fist is
// on the handle where the blade's drawn length (d × blade) puts it - worked out here from the body, so the keys only say
// how far the blade is out
function iaiKey(k) {
  if (!k.iai) return k;
  const B = torso(k), S = sayaOf(B), u = S.u, vis = (k.d || 0) * LEN.blade;
  return Object.assign({}, k, { by: Math.atan2(u[2], u[0]) / D2R, el: Math.asin(clamp(-u[1], -1, 1)) / D2R, R: madd(S.a, u, -(vis + 4)) });
}
function channels(id) {
  let C = CACHE.get(id);
  if (C) return C;
  const K = MOVES[id].keys.map(iaiKey), n = K.length, t = K.map((k) => k.t), v = {};
  for (const c of CH) v[c] = new Array(n);
  let az0 = null;
  K.forEach((k, i) => {
    const B = torso(k), r = sub(k.R, B.shC), rr = len(r);
    let az = Math.atan2(r[2], r[0]);
    if (az0 != null) while (az - az0 > Math.PI) az -= 2 * Math.PI; else az0 = az;
    if (az0 != null) while (az - az0 < -Math.PI) az += 2 * Math.PI;
    az0 = az;
    const o = { hx: k.hip[0], hy: k.hip[1], hz: k.hip[2], py: k.py, cy: k.cy, lean: k.lean, nod: k.nod, by: k.by, el: k.el, nx: k.n[0], ny: k.n[1], nz: k.n[2], rr, raz: az, rel: Math.asin(clamp(-r[1] / rr, -1, 1)), prx: k.pR[0], pry: k.pR[1], prz: k.pR[2], plx: k.pL[0], ply: k.pL[1], plz: k.pL[2], lw: k.lw, dr: k.d };
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
// the channels of a move at time t (ms): a plain object of numbers (the fight's drawing blends two of them)
export function chAt(id, t) {
  const M = MOVES[id], T = durOf(id);
  if (M.loop) t = ((t % T) + T) % T;
  return sampleCh(channels(id), clamp(t, 0, T));
}
// a cross-fade between two channel sets (one move cut into by the next): angles the short way round
export function blendCh(a, b, w) {
  const o = {};
  for (const c of CH) {
    let d = b[c] - a[c];
    if (c === 'raz') d = Math.atan2(Math.sin(d), Math.cos(d));
    else if (c === 'by') d = ((d + 540) % 360) - 180;
    o[c] = a[c] + d * w;
  }
  return o;
}
// the drawn body from a channel set. opt: { feet: { R: [x, y, z], L: [x, y, z] } (the fight's planted feet, local),
// grip (the distance between the fists: the weapon's handle), blade (its length) }
export function poseFromCh(id, o, t, prev, opt) {
  const M = MOVES[id];
  const k = { hip: [o.hx, o.hy, o.hz], py: o.py, cy: o.cy, lean: o.lean, nod: o.nod, by: o.by, el: o.el, n: norm([o.nx, o.ny, o.nz]), pR: [o.prx, o.pry, o.prz], pL: [o.plx, o.ply, o.plz], lw: clamp(o.lw, 0, 1), d: clamp(o.dr, 0, 1) };
  const B = torso(k), ce = Math.cos(o.rel);
  const R = madd(B.shC, [ce * Math.cos(o.raz), -Math.sin(o.rel), ce * Math.sin(o.raz)], o.rr);
  return build(M, k, B, R, prev, t, opt);
}
export function poseAt(id, t, prev, opt) {
  const T = durOf(id);
  return poseFromCh(id, chAt(id, t), MOVES[id].loop ? ((t % T) + T) % T : clamp(t, 0, T), prev, opt);
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
// a leg on its foot (knee forward over the toes) and an arm onto its hand: the fight's drawing re-lays them on its
// planted feet and on the handle after its own corrections (js/mocap-duel.js keeps blades out of bodies)
export function layLeg(P, s, ft) {
  const r = ik3(P['hip' + s], ft, LEN.thigh, LEN.shin, add(P.fP || [1, 0, 0], [0, -0.15, s === 'R' ? 0.25 : -0.25]));
  P['kn' + s] = r.m; P['ft' + s] = r.e; P['legReach' + s] = r.reach / (LEN.thigh + LEN.shin);
}
export function layArm(P, s, ha, pole) {
  const r = ik3(P['sh' + s], ha, LEN.uArm, LEN.fArm, pole);
  P['el' + s] = r.m; P['ha' + s] = r.e; P['reach' + s] = r.reach / (LEN.uArm + LEN.fArm);
  return r;
}
function build(M, k, B, R, prev, t = 0, opt = {}) {
  const P = {};
  P.hip = B.hip; P.chest = B.chest; P.neck = B.neck; P.head = B.head; P.shR = B.shR; P.shL = B.shL;
  P.hipR = madd(B.hip, B.rP, LEN.hipW); P.hipL = madd(B.hip, B.rP, -LEN.hipW);
  P.pl = B.rP; P.cf = norm(sub(mul(B.fC, Math.cos(k.lean * D2R)), mul(UP, Math.sin(k.lean * D2R)))); P.hf = B.fH; P.fP = B.fP;
  // legs: planted feet, knees forward over the toes (the fight's own planted feet when it gives them)
  for (const s of ['R', 'L']) layLeg(P, s, opt.feet ? opt.feet[s] : footAt(M, s, t));
  P.toR = [1, 0, 0]; P.toL = norm([0.96, 0, -0.28]);
  // the saya at the left hip (moved off the obi only while the blade is coming out of it, below)
  const SY = sayaOf(B);
  // sword: the blade's direction and edge, both fists on the handle
  const u = bladeDir(k.by, k.el);
  let e = cross(k.n, u); if (len(e) < 1e-3) e = cross([0, 0, 1], u); e = norm(sub(e, mul(u, dot(e, u))));
  const grip = opt.grip || LEN.grip, d = k.d == null ? 1 : k.d, lw = k.lw == null ? 1 : k.lw;
  // the iai draw: while the blade is not all out it runs from the right fist through the saya's mouth (the saya follows
  // it, held at its mouth by the left hand); sheathed (d 0) the fist rests on the handle at the mouth
  const vis = d * LEN.blade, mouth = d < 0.999 ? madd(R, u, vis + 4) : SY.a;
  const HR = R, HL = lw >= 0.999 ? madd(R, u, -grip) : lerp(madd(mouth, d < 0.999 ? u : SY.u, 3), madd(R, u, -grip), lw);
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
  P.armed = true; P.inside = false; P.bladeVis = null; P.gripL = lw; P.fistR = true; P.fistL = true;
  // the scabbard stays in the obi at the left hip, turning with the pelvis; while the blade comes out it lies along it
  P.saya = { a: mouth, u: d < 0.999 ? u : SY.u, L: LEN.blade + 6 };
  if (d < 0.999) {
    if (d <= 0.02) { P.armed = false; let es = sub([0, -1, 0], mul(u, -u[1])); es = norm(es); P.blade = { h: madd(mouth, u, -2), u, e: es }; }
    else { P.inside = true; P.bladeVis = vis + 2; }
  }
  P.draw = d;
  // back to the camera (the drawing then mirrors the upper body's depth, as js/mocap.js build): with hysteresis
  const bk = norm(sub(P.shR, P.shL))[0];
  const was = prev && prev.mir;
  P.mir = was ? bk > 0.25 : bk > 0.45;
  return P;
}
