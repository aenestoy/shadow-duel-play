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
const CHUDAN = { hip: [0, -80, 0], py: 14, cy: 22, lean: 6, nod: 4, R: [38, -104, 2], by: -2, el: 18, n: [0, 0, 1], pR: [-0.15, 1, 0.6], pL: [-0.15, 1, -0.6], lw: 1, d: 1,
  pitch: 0, L: [16, -96, -14], lf: 0, FR: [24, 0, 6], FL: [-22, 0, -6] };
// phase 3 (falls, the rise, the throw):
//   pitch  the whole body tipped back round the hip (deg, + = falling back: 90 = lying on the back, face up)
//   lf     the left hand let go (1) of the handle / saya, free at L [x, y, z] (in the fight's frame, never tipped: a palm on
//          the floor stays where it is on the floor)
//   FR, FL the feet, for a move with ownFeet (a fall, the rise: knees, heels and toes where the move puts them)
//   w: 1   R, by / el, n and the elbow poles of this key are given in the fight's frame (not the tipped body's): a fist on
//          the floor beside a lying body is written where it is
// lw: the left fist on the handle (1) or holding the saya's mouth (0); d: how much of the blade is out of the saya (1 all,
// 0 sheathed: the iai draw and the noto; while d < 1 the blade runs from the right fist through the saya's mouth)
// elbows: pR / pL is the side each elbow points to (down and out at rest; up and back with the fists over the head, so the
// upper arms go up beside the head instead of across the face)
const UPEL = { pR: [-1, -0.25, 0.3], pL: [-1, -0.25, -0.3] };
const pose = (o) => Object.assign({}, CHUDAN, o);
const at = (t, o, e = 'io') => Object.assign(pose(o), { t, e });
// (phase 4) a key pose turned round the vertical by deg - the hips' place, the fists, the elbows' poles, the cut's plane
// and the feet with it: a spin is keyed as turned poses, its channels running on past 360 (a cross-fade takes angles the
// short way round). A turn the fight makes by flipping the facing (mawari's turn, a special's end) is keyed through it:
// the keys after the flip are the same pose turned 180 more (in the picture the same, the near and far side swapped).
const yawK = (o, deg) => {
  const q = pose(o), c = Math.cos(deg * D2R), s = Math.sin(deg * D2R), r = (v) => [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c];
  return { ...q, hip: r(q.hip), R: r(q.R), pR: r(q.pR), pL: r(q.pL), n: r(q.n), L: r(q.L), FR: r(q.FR), FL: r(q.FL), py: q.py + deg, cy: q.cy + deg, by: q.by + deg };
};
// the three held guards (the pose the guard stays on, and the block's start and end)
const G_MID = { hip: [-2, -77.5, 0], py: 16, cy: 26, lean: 4, nod: 3, R: [36, -118, 8], by: 4, el: 62, pR: [-0.3, 0.8, 0.6], pL: [-0.2, 0.9, -0.5] };
const G_HI = { hip: [-3, -79, 0], py: 12, cy: 18, lean: 0, nod: -2, R: [2, -173, 5], by: 0, el: 184, ...UPEL };
// (4b) the raise to the high guard and its release: the fists go up in front with the near elbow low and forward (under
// the chin, toward the opponent), the blade rising back over the head - the near arm never crosses the face (before: the
// elbows swung out at the camera and the near forearm passed over the face for 4-8 frames, every guard change in the fight)
const G_RISE = { hip: [-2, -79.5, 0], py: 22, cy: 26, lean: 2, nod: 0, R: [30, -158, 5], by: 0, el: 134, pR: [0.1, 0.6, -0.8], pL: [-0.6, -0.15, -0.8] };
const G_LOW = { hip: [-2, -75, 0], py: 16, cy: 24, lean: 7, nod: 8, R: [47, -96, 4], by: 6, el: -36, pR: [-0.2, 1, 0.5], pL: [-0.2, 1, -0.5] };

// lying on the back after a fall (the fight's 'down'): both palms on the floor (the break-fall), the sword hand out on the
// camera side with the blade flat and a little up off the floor, the chin tucked, the heels down (toes up)
// (3b, the reviewer: lying, the blade lay across her legs - now the fist is on the floor beside the ribs and the blade rises
// from it toward him, well above the legs: a guard from the floor)
// phase 4: the lock (hilts pressed together, blades crossed above), the bind (blade on blade at one point)
const LOCK = { hip: [-8, -71, 0], py: 12, cy: 18, lean: 16, nod: 2, R: [44, -110, 4], by: 0, el: 76, pR: [-0.3, 0.85, 0.5], pL: [-0.3, 0.85, -0.55] };
const LOCK_P = { ...LOCK, hip: [-4, -69.5, 0], py: 10, cy: 15, lean: 20, nod: 3, R: [48, -112, 4], el: 72 };
const BIND_D = { hip: [-6, -72, 0], py: 14, cy: 22, lean: 10, nod: 3, R: [42, -100, 6], by: 0, el: 62, pR: [-0.3, 0.8, 0.6], pL: [-0.3, 0.8, -0.5] };
const BIND_A = { hip: [-2, -74, 0], py: 10, cy: 16, lean: 16, nod: 5, R: [47, -114, 8], by: 0, el: 30, pR: [-0.3, 0.8, 0.6], pL: [-0.3, 0.8, -0.5] };
// phase 4: the post (the blade bitten at chest height; the tug: the fists come back, the point stays in the wood), the
// low crouch behind it; the light kesa's ear and crown keys (the strings start from them); the iai draw out and its
// held follow-through (the blade swept out to the right, one-handed, the body long and low)
const STUCK_B = { hip: [-2, -75, 0], py: 12, cy: 18, lean: 8, nod: 5, R: [52, -104, 6], by: 0, el: -10, n: [0, 0.6, 0.8], pR: [-0.3, 0.8, 0.6], pL: [-0.3, 0.8, -0.5] };
const STUCK_T = { ...STUCK_B, hip: [-10, -74.5, 0], lean: -3, nod: 3, R: [32, -112, 6], el: -8 };
const POST_LOW = { hip: [-6, -56, 0], py: 14, cy: 22, lean: 28, nod: 10, R: [36, -64, 14], by: 0, el: -20, FR: [30, 0, 7] };
// (4b) the right-shoulder raise (kesaS, tsubame, renga, sandan, airCut, airSpike) keyed higher and nearer the camera: the
// fists go up in front of the face's far side and the near elbow stays under the face line (before: the near forearm
// crossed the face as the fists passed the ear - the fight held that pose when the cut was blocked)
const K_UP1 = { hip: [-2, -80.5, 0.5], py: 18, cy: 30, lean: 3, nod: 3, R: [36, -148, 12], by: 30, el: 80, n: [0, 0.5, 0.87], pR: [-0.2, 0.9, 0.4], pL: [-0.3, 0.8, -0.5] };
const K_UP3 = { hip: [-3, -81.2, 1], py: 21, cy: 36, lean: 1, nod: 2, R: [2, -174, 24], by: 140, el: 55, n: [0, 0.6, 0.8], ...UPEL, pL: [0.6, 0.6, -0.4] };
const K_EAR = { hip: [-2.5, -81, 0.8], py: 20, cy: 34, lean: 2, nod: 2, R: [32, -155, 22], by: 95, el: 66, n: [0, 0.55, 0.84], pR: [-0.3, 0.3, 0.9], pL: [0.6, 0.6, -0.4] };
const K_TOP = { hip: [-4, -81.5, 1], py: 22, cy: 38, lean: 0, nod: 1, R: [-3, -182, 18], by: 158, el: 52, n: [0, 0.6, 0.8], ...UPEL, pL: [0.6, 0.6, -0.4] };
const IAI_OUT = { hip: [-4, -65, -1], py: 4, cy: 4, lean: 19, nod: 7, R: [40, -88, -6], by: -152, el: -8, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0 };
const IAI2 = { hip: [18, -64, 0], py: 14, cy: 30, lean: 24, nod: 9, R: [62, -100, 26], by: 60, el: 4, n: [0, -1, 0], lw: 0, pL: [-0.2, 0.9, -0.6], FR: [44, 0, 8], FL: [-34, 0, -7] };
// the turning cuts: the low duck (the blade low behind on the right), the blade trailing back low on the right, and the
// level cut from the right - in, through, out to the left
const MW_DUCK = { hip: [4, -60, 0], py: 14, cy: 22, lean: 30, nod: 12, R: [40, -72, 28], by: 150, el: -16, n: [0, 1, 0], pR: [-0.5, 0.7, 0.6], pL: [0, 0.85, -0.6] };
const MW_TRAIL = { hip: [-2, -75, 1], py: 18, cy: 34, lean: 8, nod: 5, R: [16, -106, 32], by: 140, el: -6, n: [0, 1, 0], pR: [-0.5, 0.7, 0.6], pL: [0, 0.85, -0.6] };
// (6) the wind-ups of the turns with the fists back at the right hip (wakigamae: the hands at or behind the spine as drawn),
// so the blade trailing back never lies across the belly, hips or thighs (the turn after it is unchanged); the elbow points
// back and out (a pole with no downward share: with the arm hanging along a downward pole the elbow flipped)
const MW_DUCKB = { ...MW_DUCK, R: [6, -72, 26], pR: [-0.7, 0, 0.7] };
const MW_WAKI = { ...MW_TRAIL, R: [-6, -100, 30], by: 150, el: -10, pR: [-0.7, 0, 0.7] };
const MW_IN = { hip: [6, -74, 0], py: 4, cy: 18, lean: 8, nod: 5, R: [44, -108, 30], by: 80, el: 0, n: [0, 1, 0] };
const MW_MID = { hip: [12, -74, 0], py: -6, cy: 2, lean: 9, nod: 6, R: [70, -110, 8], by: 6, el: 2, n: [0, 1, 0] };
const MW_END = { hip: [14, -74, 0], py: -12, cy: -14, lean: 9, nod: 6, R: [64, -108, -16], by: -52, el: 0, n: [0, 1, 0] };
const LIE = { hip: [-15, -12, 0], pitch: 86, py: 22, cy: 30, lean: -2, nod: 10, w: 1, R: [-44, -4.5, 37], by: 16, el: 40, n: [0, 0, -1], pR: [-0.3, -0.6, 0.7], pL: [0, -0.6, -0.8], lf: 1, L: [-34, -3.5, -28], FR: [62, -3.5, 8], FL: [52, -3.5, -8] };

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
      at(75, G_RISE, 'io'),
      at(150, { hip: [-3, -79, 0], py: 12, cy: 18, lean: 0, nod: -2, R: [2, -173, 5], by: 0, el: 184, ...UPEL }, 'out'),
      at(260, { hip: [-3.5, -79, 0], py: 12, cy: 18, lean: 0, nod: -2, R: [2, -173.5, 5], by: 0, el: 184, ...UPEL }, 'io'),
      // the impact: the blade gives a little, the knees take it, the body sinks
      at(300, { hip: [-6, -75, 0], py: 12, cy: 17, lean: -1, nod: 0, R: [1, -167, 5], by: 0, el: 189, ...UPEL }, 'out3'),
      at(380, { hip: [-5, -76.5, 0], py: 12, cy: 17, lean: 0, nod: -1, R: [2, -170, 5], by: 0, el: 187, ...UPEL }, 'io'),
      // release in one move: the near elbow swings out toward the camera (not across the face) as the blade comes over
      // to the front, then the fists sink to the centre line and the weight settles
      at(460, { ...G_RISE, hip: [-1, -77.5, 0], nod: 1 }, 'io'),
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
      at(85, K_UP1, 'io'),
      at(112, K_EAR, 'io'),
      at(145, K_UP3, 'io'),
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
      at(115, { hip: [-2.5, -81, -0.8], py: 9, cy: 12, lean: 2, nod: 2, R: [24, -166, -2], by: -75, el: 72, n: [0, -0.55, 0.84], pR: [-0.3, 0.6, 0.75], pL: [0.2, -0.1, -0.9] }, 'io'),
      at(145, { hip: [-3, -81.2, -1], py: 8, cy: 10, lean: 1, nod: 1, R: [14, -179, -3], by: -120, el: 58, n: [0, -0.6, 0.8], ...UPEL, pL: [-0.75, -0.2, -0.65] }, 'io'),
      at(180, { hip: [-4, -81.5, -1], py: 6, cy: 8, lean: 0, nod: 1, R: [0, -180, -4], by: -150, el: 50, n: [0, -0.6, 0.8], ...UPEL, pL: [-0.75, -0.2, -0.65] }, 'out'),
      at(205, { hip: [0, -81, -1], py: 7, cy: 9, lean: 1, nod: 2, R: [2, -180, -3], by: -150, el: 46, n: [0, -0.6, 0.8], ...UPEL, pL: [-0.75, -0.2, -0.65] }, 'io'),
      at(240, { hip: [9, -78, 0], py: 9, cy: 12, lean: 3, nod: 2, R: [44, -162, -2], by: -35, el: 40, n: [0, -0.6, 0.8], pR: [-0.55, 0.15, 0.85], pL: [-0.65, 0, -0.8] }, 'in'),
      // the strike crosses from the left shoulder to the right hip; the follow-through ends low on the near side
      at(256, { hip: [12.5, -77, 0], py: 10, cy: 15, lean: 5, nod: 4, R: [60, -147, -4], by: -12, el: 10, n: [0, -0.6, 0.8], pR: [-0.25, 0.6, 0.75], pL: [-0.4, 0.5, -0.8] }, 'lin'),
      at(272, { hip: [15, -76.5, 0], py: 12, cy: 20, lean: 7, nod: 6, R: [68, -128, 4], by: 14, el: -22, n: [0, -0.6, 0.8], pL: [-0.3, 0.7, -0.65] }, 'lin'),
      at(325, { hip: [17, -74, 0], py: 16, cy: 26, lean: 10, nod: 7, R: [62, -100, 20], by: 46, el: -37, n: [0, -0.6, 0.8] }, 'out'),
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
  // after a finishing cut (the fight's zanshin / a counter's held pose): a short, hard flick (chiburi) that stops with the
  // point low on the line to the fallen opponent, held a beat (zanshin: the eyes and the point stay on him), then the
  // point rises to the throat line (chudan) and stays there. Never a blade hanging to the floor.
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
      // the blade is knocked back up off the other's, the body rocks back onto the rear foot
      at(60, { hip: [4, -78.5, 0], py: 14, cy: 26, lean: 1, nod: 1, R: [42, -138, 6], by: -4, el: 70, pR: [-0.4, 0.6, 0.7], pL: [-0.4, 0.6, -0.7] }, 'out3'),
      at(140, { hip: [1, -79, 0], py: 15, cy: 26, lean: 2, nod: 2, R: [42, -134, 6], by: -4, el: 64, pR: [-0.4, 0.6, 0.7], pL: [-0.4, 0.6, -0.7] }, 'io'),
      at(240, { hip: [1, -79.5, 0], py: 14, cy: 23, lean: 5, nod: 4, R: [38, -112, 4], by: -3, el: 30 }, 'io'),
      at(340, {}, 'io'),
    ],
    phases: null,
  },

  // ---------------------------------------------------------------- phase 3: walking, the fall and the rise, the throw
  // The gaits (gait: the clock is the ground covered, moves.js gaitFeet places the feet). The sword stays on the centre
  // line, the fists still in front of the belly: only the hips and legs walk. walkF: two steps a cycle (strideOf: S 130 at
  // the fight's full walk, 255 a second: ~3.9 steps a second; slower walks take shorter steps): the hips are
  // lowest as a foot lands (u 0 and 0.5), highest as the other passes it, and turn with the leg that leads.
  // (3b: lower and with a clear rise and fall - knees bent at the plant, the hips 4 higher as the legs pass; the fists ride
  // a little with the body, the point stays on the line)
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
  // back-steps: the front foot goes back first; the weight stays forward over the sword (the body leans in a little)
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
  // the run (a dash, over 260 a second): the body leans into it, the hips drop as a foot takes the weight (u 0, 0.5) and
  // rise in the flight between; the fists a little lower, the point still forward
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

  // knocked off the feet (the fight's 'launch': thrown back through the air). The blow snaps the head and chest back, the
  // arms fly out (the sword arm out to the camera side, the blade up and back, clear of the body; the left hand lets go),
  // the feet leave the floor; then the body tips back as the knees come up and the chin tucks (a fall is taken on the back,
  // never on the head) and is held there until it lands - the fight's own height carries it.
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
  // on the floor (the fight's 'down', 0.75 s) and up again ('getup', 0.46 s), one move: the back hits the floor - both
  // palms slap it (the break-fall), the legs come down a beat later, the chin stays tucked - a held still moment with the
  // weight on the floor, then the head comes up to find him, the right knee bends, the body sits up with the blade already
  // pointing at him, rolls forward over the right foot onto the left knee, the left hand goes back to the handle, and the
  // body rises out of the kneel into the guard.
  downRise: {
    name: 'Down and up again (break-fall, kneel, rise)', feet: FEET, ownFeet: true,
    keys: [
      at(0, { hip: [-6, -72, 0], pitch: 60, py: 22, cy: 32, lean: -4, nod: 12, w: 1, R: [-34, -116, 34], by: 158, el: 22, pR: [-0.4, -0.3, 0.9], pL: [0.2, -0.3, -0.9], lf: 1, L: [-10, -128, -28], FR: [36, -48, 6], FL: [28, -40, -6] }),
      // (the palm comes down onto its spot from above: it lands, it does not skid)
      at(85, { hip: [-12, -24, 0], pitch: 80, py: 22, cy: 30, lean: -2, nod: 15, w: 1, R: [-42, -14, 36], by: 24, el: 56, n: [0, 0, -1], pR: [-0.3, -0.6, 0.7], pL: [0, -0.6, -0.8], lf: 1, L: [-34, -12, -28], FR: [62, -20, 8], FL: [52, -16, -8] }, 'in'),
      at(110, { ...LIE, hip: [-14, -12.5, 0], pitch: 85, nod: 16, R: [-43, -5, 36], el: 38, FR: [62, -12, 8], FL: [52, -9, -8] }, 'lin'),
      at(210, { ...LIE }, 'out'),
      at(400, { ...LIE, hip: [-15, -11.8, 0], nod: 13 }, 'io'),
      // (the right foot lifts off its heel before it comes in)
      at(435, { ...LIE, hip: [-15, -12, 0], nod: 18, FR: [61, -11, 8] }, 'io'),
      // the head comes up to find him; the right knee bends (the foot lifts and comes in)
      at(470, { ...LIE, hip: [-15, -12, 0], pitch: 84, lean: 0, nod: 24, R: [-40, -8, 36], by: 10, el: 38, FR: [44, -16, 8] }, 'io'),
      // (the right foot comes down onto its spot from above)
      at(525, { ...LIE, hip: [-14, -12, 0], pitch: 58, py: 21, cy: 29, lean: 3, nod: 14, R: [-22, -46, 26], by: 6, el: 34, n: [0, 0, 1], pR: [-0.2, 0.4, 0.8], pL: [0, 0.2, -0.9], FR: [24, -7, 6] }, 'io'),
      // sit up on the left palm, the right foot planted, the point already at him
      at(545, { ...LIE, hip: [-14, -12, 0], pitch: 46, py: 20, cy: 28, lean: 4, nod: 10, R: [-12, -58, 22], by: 0, el: 28, n: [0, 0, 1], pR: [-0.2, 0.6, 0.7], pL: [0, 0.6, -0.8], FR: [24, 0, 6] }, 'io'),
      // over the right foot, the palm pushing off: the left knee comes in under the body (the foot off the floor)
      // (the left foot comes up off the floor first, straight up)
      at(568, { hip: [-13, -16, 0], pitch: 38, py: 19, cy: 27, lean: 5, nod: 9, w: 1, R: [-6, -60, 20], by: 0, el: 23, n: [0, 0, 1], pR: [-0.2, 0.7, 0.65], pL: [0, 0.6, -0.8], lf: 1, L: [-31, -12, -27], FR: [24, 0, 6], FL: [52, -11, -8] }, 'io'),
      // the palm pushes off, the hips go up over the right foot (the left knee still in front, bent)
      at(605, { hip: [-10, -30, 0], pitch: 24, py: 18, cy: 26, lean: 7, nod: 8, w: 1, R: [4, -70, 15], by: 0, el: 22, n: [0, 0, 1], pR: [-0.2, 0.8, 0.6], pL: [-0.3, 0.6, -0.75], lf: 1, L: [-26, -34, -26], FR: [24, 0, 6], FL: [30, -12, -9] }, 'io'),
      // the left foot passes under the raised hips, the knee forward; then it goes back to kneel
      at(650, { hip: [-8, -44, 0], pitch: 10, py: 17, cy: 25, lean: 10, nod: 7, w: 1, R: [18, -66, 9], by: 0, el: 22, n: [0, 0, 1], pR: [-0.2, 0.8, 0.6], pL: [-0.2, 0.7, -0.7], lf: 0.7, L: [-8, -66, -22], FR: [24, 0, 6], FL: [-6, -16, -9] }, 'io'),
      at(690, { hip: [-7, -51, 0], pitch: 3, py: 16, cy: 24, lean: 11, nod: 6, R: [28, -72, 6], el: 20, lf: 0.3, L: [0, -80, -18], FR: [24, 0, 6], FL: [-40, -12, -7] }, 'io'),
      // the left knee down: kneeling, the left hand back on the handle
      at(730, { hip: [-6, -50, 0], py: 16, cy: 24, lean: 12, nod: 5, R: [36, -75, 4], el: 20, lf: 0, L: [6, -92, -14], FR: [24, 0, 6], FL: [-56, -9, -6] }, 'out'),
      // up out of the kneel: the left foot comes up off its toes and steps in to the stance (it comes down from above)
      at(840, { hip: [-4, -64, 0], py: 15, cy: 23, lean: 9, nod: 5, R: [37, -88, 3], el: 19, FR: [24, 0, 6], FL: [-38, -12, -6] }, 'io'),
      at(915, { hip: [-2, -73, 0], py: 14, cy: 22, lean: 8, nod: 4, R: [37, -97, 2], el: 18, FR: [24, 0, 6], FL: [-22, -7, -6] }, 'io'),
      at(970, { hip: [-1, -77.5, 0], py: 14, cy: 22, lean: 7, nod: 4, R: [37, -103, 2], el: 18, FR: [24, 0, 6], FL: [-22, 0, -6] }, 'io'),
      at(1210, {}, 'io'),
    ],
    phases: null,
  },
  // the parry (the fight's 'parry', 0.2 s, from the guard): one short hard beat of the blade that sends his cut away - up
  // (the blade snaps up to the forehead line, the knees give), down (the point beats down onto his blade), or aside (the
  // wrists roll the blade out to the far side) - and straight back to the guard
  parryUp: {
    name: 'Parry (sends the cut up)', feet: FEET,
    keys: [
      at(0, G_MID),
      at(55, { ...G_MID, hip: [-4, -76.5, 0], cy: 24, lean: 2, nod: 1, R: [40, -138, 6], by: 2, el: 96, pR: [-0.4, 0.5, 0.8], pL: [-0.4, 0.4, -0.8] }, 'out3'),
      at(120, { ...G_MID, hip: [-3.5, -77, 0], cy: 25, lean: 3, nod: 2, R: [39, -134, 6], by: 2, el: 90, pR: [-0.4, 0.5, 0.8], pL: [-0.4, 0.4, -0.8] }, 'io'),
      at(200, G_MID, 'io'),
    ],
    phases: null,
  },
  parryDown: {
    name: 'Parry (beats the cut down)', feet: FEET,
    keys: [
      at(0, G_MID),
      at(55, { ...G_MID, hip: [-3, -76, 0], cy: 24, lean: 8, nod: 6, R: [49, -103, 7], by: 2, el: -12, pR: [-0.2, 0.9, 0.5], pL: [-0.2, 0.9, -0.5] }, 'out3'),
      at(120, { ...G_MID, hip: [-3, -76.5, 0], cy: 25, lean: 7, nod: 5, R: [48, -105, 7], by: 2, el: -6, pR: [-0.2, 0.9, 0.5], pL: [-0.2, 0.9, -0.5] }, 'io'),
      at(200, G_MID, 'io'),
    ],
    phases: null,
  },
  parrySide: {
    name: 'Parry (rolls the cut aside)', feet: FEET,
    keys: [
      at(0, G_MID),
      at(55, { ...G_MID, hip: [-3, -77, 0], py: 20, cy: 32, lean: 4, nod: 3, R: [40, -122, 14], by: 40, el: 50, n: [0, 0.5, 0.85] }, 'out3'),
      at(120, { ...G_MID, hip: [-3, -77.3, 0], py: 19, cy: 31, lean: 4, nod: 3, R: [39, -121, 13], by: 36, el: 50, n: [0, 0.5, 0.85] }, 'io'),
      at(200, G_MID, 'io'),
    ],
    phases: null,
  },
  // the dodge (the fight's 'dodge', 0.36 s; the fight carries the body 520 a second back, 760 forward - the feet step under
  // it, planted): back - the body sways away from the cut, the blade comes up across the line; forward - a low dash in,
  // the point kept on him
  // (3b, the reviewer: the dodges read as standing still - now real evasions.) Back: a hop away - the hips drop and go back
  // over the rear foot, the chest leans far back out of the cut, the head goes back, the blade comes up across the line;
  // both feet leave the floor together (the fight carries the body ~110 back) and land under it, knees soft.
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
  // forward: a low dash in - the hips drop and drive, the trunk leans far over the front knee, the point stays on him;
  // the front foot reaches out and the rear one drives off and follows (the fight carries the body ~170 in)
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
  // ---------------------------------------------------------------- phase 3b: the draw and the noto (Akane's iai katana)
  // The noto (the fight's calm moment, js/duel.js drawnStep: the sword goes home, 0.55 s): a hard one-handed flick
  // (chiburi), the left hand goes to the saya's mouth, the blade swings round to the left hip, its point meets the mouth
  // (the left hand tips the saya up to it) and the blade slides home; the hand rests on the hilt (the iai stance).
  noto: {
    name: 'Noto (flick, the blade slides home)', feet: FEET, jump: [[244, 247]],
    keys: [
      at(0, {}),
      at(110, { hip: [1, -78.5, 0], py: 16, cy: 26, lean: 6, nod: 5, R: [47, -100, 14], by: 26, el: -24, n: [0, 0.45, 0.9], pR: [-0.2, 0.9, 0.4], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'out3'),
      at(200, { hip: [0, -79, 0], py: 18, cy: 30, lean: 5, nod: 6, R: [46, -110, 2], by: -150, el: -20, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),
      // (the point at the mouth: the next key's line with the blade still all out - kilic-deneme NOTO_AT below)
      at(244, { hip: [0, -79, 0], py: 18, cy: 30, lean: 5, nod: 6, iai: true, d: 0.36, sby: -172, sel: -30, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0, at: 1 }, 'out'),
      // (in one frame: the point goes in - the blade 96 long, the arms 59: no pose shows its point at the mouth with the hilt
      // in reach, so the first half slides home between two frames, the saya taking it)
      at(247, { hip: [0, -79, 0], py: 18, cy: 30, lean: 5, nod: 6, iai: true, d: 0.36, sby: -172, sel: -30, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'in'),
      at(420, { hip: [0, -79.5, 0], py: 17, cy: 27, lean: 5, nod: 5, iai: true, d: 0.1, sby: -172, sel: -26, n: [0, -0.6, 0.8], pR: [-0.3, 0.85, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),
      at(510, { hip: [0, -80, 0], py: 15, cy: 23, lean: 6, nod: 4, iai: true, d: 0, sby: -172, sel: -22, n: [0, -0.6, 0.8], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'out'),
      at(600, { iai: true, d: 0, n: [0, -0.6, 0.8], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),
    ],
    phases: null,
  },
  // The nukitsuke from the saya (ak_dNuki when the sword is home; the same timing as yokoL: the cut 250-335 of 700): the
  // left thumb breaks the saya open, the hips sink, the hilt goes forward along the saya, then the blade whips out and on
  // round the front in one horizontal cut, one-handed (the left hand stays on the saya), stopped past the right side; the
  // left hand comes back to the handle and the guard is taken.
  nuki: {
    name: 'Nukitsuke (draw and cut from the saya)', feet: FEET, jump: [[140, 144]],
    keys: [
      at(0, { iai: true, d: 0, n: [0, -0.6, 0.8], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }),
      at(80, { hip: [-2, -77, 0], py: 8, cy: 12, lean: 6, nod: 5, iai: true, d: 0.26, sby: -168, sel: -14, n: [0, -0.6, 0.8], pR: [-0.3, 0.8, 0.5], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'in'),
      at(140, { hip: [-2, -77, -1], py: 4, cy: 4, lean: 9, nod: 4, iai: true, d: 0.36, sby: -160, sel: -10, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'in'),
      // (the blade whips out between two frames - as the noto, its length against the arms - on the saya's own line)
      at(144, { hip: [-3, -77, -1], py: 4, cy: 4, lean: 6, nod: 4, R: [42, -92, -4], by: -152, el: -8, n: [0, -0.6, 0.8], pR: [-0.3, 0.7, 0.6], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'lin'),
      at(175, { hip: [-1, -77.5, -1.5], py: 2, cy: 2, lean: 5, nod: 4, R: [26, -104, -24], by: -146, el: -6, n: [0, -0.8, 0.6], pR: [-0.3, 0.6, 0.7], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),
      at(225, { hip: [2, -78, -1], py: 4, cy: 4, lean: 6, nod: 4, R: [24, -106, -28], by: -128, el: -4, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'io'),
      at(250, { hip: [8, -77, 0], py: 6, cy: 6, lean: 7, nod: 5, R: [50, -110, -24], by: -70, el: 0, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'in'),
      at(280, { hip: [15, -76, 0], py: 8, cy: 8, lean: 8, nod: 6, R: [70, -112, -4], by: 0, el: 2, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'lin'),
      at(335, { hip: [17, -76, 0], py: 16, cy: 28, lean: 8, nod: 6, R: [66, -110, 22], by: 55, el: 2, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0 }, 'out'),
      at(390, { hip: [16.5, -76.5, 0], py: 16, cy: 27, lean: 8, nod: 6, R: [62, -110, 21], by: 53, el: 4, n: [0, -1, 0], pL: [-0.2, 0.9, -0.6], lw: 0.2 }, 'io'),
      at(540, { hip: [7, -78, 0], py: 15, cy: 22, lean: 7, nod: 5, R: [52, -108, 10], by: 22, el: 10, n: [0, -0.4, 0.92] }, 'io'),
      at(700, {}, 'io'),
    ],
    phases: { windup: [0, 250], active: [250, 335], recovery: [335, 700] },
  },
  // ---------------------------------------------------------------- phase 3b: kicks with the sword in hand
  // Played on the fight's own clock (duel-hook.js PLAY: the fight's hit window is the move's phases.active), the timing
  // of each kick is the fight's (ms at speed 1). The front (right) foot kicks; the left stays planted, the knee giving.
  // The sword is held two-handed, upright and a little forward (clear of the face, the legs and the floor).
  kakato: {
    // (the owner, 2026-11-20: "the kick thrown upward while standing is bad" - the knee only came to the waist, the shin
    // and foot dangled under it and the foot rose into her hands. Now a real axe kick: the knee chambers, the nearly
    // straight leg swings up in front to head height, hangs, and the heel drives down in front into a long stance. The
    // sword goes up high and back (hasso-like, two-handed) so the leg never crosses the hands, handle or blade; the trunk
    // leans back at the top for balance; the left foot stays planted. The fight's timing is unchanged (PLAY, active).)
    name: 'Axe kick (kakato-otoshi)', feet: FEET, kick: 'R', kneeUp: 'R',
    keys: [
      at(0, {}),
      // the weight goes back onto the left leg, the front heel peels off; the sword starts round to the right side, the
      // point swinging out toward the camera (never across the body or the leg)
      at(60, { hip: [-4, -79.5, 0], py: 12, cy: 20, lean: 2, nod: 3, R: [24, -106, 12], by: 60, el: 6, n: [0, 1, 0], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.5], FR: [25, -9, 7] }, 'io'),
      at(110, { hip: [-7, -81, 0], py: 10, cy: 20, lean: -2, nod: 2, R: [-6, -97, 22], by: 140, el: -14, n: [0, 1, 0], pR: [-0.6, 0.6, 0.6], pL: [0, 0.85, -0.6], FR: [30, -30, 9] }, 'io'),
      // chamber: the knee up in front at hip height, the foot under it; the sword low at the right hip (waki), its point
      // back and down - the arms stay below the face and behind the leg for the whole kick
      at(150, { hip: [-9, -82, 0], py: 9, cy: 18, lean: -5, nod: 0, R: [-34, -100, 16], by: 178, el: -24, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [36, -48, 10] }, 'io'),
      // the leg unfolds forward and up, nearly straight, and swings on up in front
      at(200, { hip: [-11, -84, 0], py: 7, cy: 16, lean: -12, nod: -3, R: [-38, -99, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [62, -114, 12] }, 'out'),
      at(235, { hip: [-12.5, -85, 0], py: 6, cy: 15, lean: -17, nod: -5, R: [-40, -98, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [53, -143, 12] }, 'out'),
      // the top: the foot at head height, the leg straight, the trunk back for balance - a short hang
      at(265, { hip: [-13, -85, 0], py: 6, cy: 15, lean: -20, nod: -6, R: [-41, -98, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [43, -153, 12] }, 'out'),
      at(305, { hip: [-12, -85, 0], py: 6, cy: 15, lean: -19, nod: -6, R: [-40, -98, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [47, -151, 12] }, 'io'),
      // the heel drives down in front (the hit: the fight's window 336-470); the hips come forward over it, the knee gives
      // only near the floor
      at(345, { hip: [-6, -84, 0], py: 7, cy: 16, lean: -10, nod: -2, R: [-34, -100, 16], by: 180, el: -24, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [62, -126, 11] }, 'in'),
      at(385, { hip: [3, -80, 0], py: 8, cy: 17, lean: 2, nod: 3, R: [-24, -100, 16], by: 178, el: -22, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [66, -72, 10] }, 'lin'),
      at(425, { hip: [10, -72, 0], py: 9, cy: 18, lean: 10, nod: 6, R: [-14, -94, 16], by: 176, el: -20, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [58, -16, 9] }, 'lin'),
      // landed: a long, low front stance; the sword comes round from the hip (the point out toward the camera) to the front
      at(470, { hip: [13, -68, 0], py: 10, cy: 18, lean: 12, nod: 7, R: [-6, -94, 20], by: 172, el: -18, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [57, 0, 8] }, 'out'),
      at(520, { hip: [12.5, -68.5, 0], py: 10, cy: 18, lean: 12, nod: 7, R: [-2, -95, 22], by: 170, el: -17, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [57, 0, 8] }, 'io'),
      // the front foot steps back into the stance (lifted: it never slides) as the sword comes round from the hip, the
      // point out toward the camera, to the centre line
      at(595, { hip: [9, -71, 0], py: 11, cy: 18, lean: 10, nod: 6, R: [34, -100, 34], by: 110, el: -6, n: [0, 1, 0], pR: [-0.7, 0.4, 0.6], pL: [0, 0.85, -0.6], FR: [54, -6, 8] }, 'io'),
      at(650, { hip: [6, -74, 0], py: 12, cy: 19, lean: 9, nod: 5, R: [50, -108, 10], by: 24, el: 22, n: [0, 0.5, 0.86], pR: [-0.3, 0.8, 0.6], pL: [-0.2, 0.9, -0.5], FR: [36, -11, 7] }, 'io'),
      at(695, { hip: [3, -77, 0], py: 13, cy: 20, lean: 8, nod: 5, R: [40, -107, 4], by: 0, el: 26, FR: [24, -5, 6] }, 'io'),
      at(720, { hip: [2, -78, 0], py: 13, cy: 20, lean: 8, nod: 5, R: [38, -106, 3], by: -1, el: 26, FR: [24, 0, 6] }, 'out'),
      at(941, {}, 'io'),
    ],
    phases: { windup: [0, 336], active: [336, 470], recovery: [470, 941] },
  },
  // ashi-barai: down onto the back leg, the front leg sweeps out along the floor at his ankles (an arc toward the camera)
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
  // ushiro-mawashi: the body turns a full round on the planted left foot (back to him for an instant), the right leg
  // chambers and drives out at chest height as the turn ends, the trunk leaning away
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
  // kote-geri: a quick rising snap kick at his sword hand
  // (2026-11-20, as the axe kick: the knee bent backward under a foot raised into her own hands. Now the knee chambers
  // high, the shin snaps out and up nearly straight at chest height, the foot comes back under the knee and down; the
  // sword goes up and back out of the leg's way. The fight's timing is unchanged.)
  snapKick: {
    name: 'Snap kick at the wrist (kote-geri)', feet: FEET, kick: 'R', kneeUp: 'R',
    keys: [
      at(0, {}),
      // the weight back onto the left leg; the sword starts round to the right side, the point out toward the camera
      at(50, { hip: [-3, -80, 0], py: 12, cy: 20, lean: 1, nod: 3, R: [24, -106, 12], by: 60, el: 6, n: [0, 1, 0], pR: [-0.3, 0.9, 0.5], pL: [-0.2, 0.9, -0.5], FR: [25, -10, 7] }, 'io'),
      at(95, { hip: [-6, -81, 0], py: 11, cy: 19, lean: -2, nod: 2, R: [-6, -97, 22], by: 140, el: -14, n: [0, 1, 0], pR: [-0.6, 0.6, 0.6], pL: [0, 0.85, -0.6], FR: [28, -30, 9] }, 'io'),
      // chamber: the knee high in front, the foot tucked under it; the sword low at the right hip (waki), point back -
      // the arms stay below the face and behind the leg
      at(135, { hip: [-8, -82, 0], py: 10, cy: 17, lean: -6, nod: 0, R: [-34, -100, 16], by: 178, el: -24, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [31, -54, 10] }, 'io'),
      // the snap: the shin whips out and up, the leg nearly straight, the foot at chest height
      at(185, { hip: [-11, -84, 0], py: 8, cy: 15, lean: -14, nod: -4, R: [-38, -99, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [70, -118, 11] }, 'out'),
      at(300, { hip: [-11, -84, 0], py: 8, cy: 15, lean: -13, nod: -4, R: [-37, -99, 16], by: 180, el: -26, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [68, -115, 11] }, 'io'),
      // back under the knee, then down onto the floor (lifted: it lands, never slides)
      at(380, { hip: [-7, -82, 0], py: 10, cy: 17, lean: -5, nod: 0, R: [-30, -100, 17], by: 178, el: -24, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [34, -58, 10] }, 'io'),
      at(460, { hip: [-3, -80, 0], py: 12, cy: 18, lean: 3, nod: 3, R: [-8, -96, 20], by: 172, el: -18, n: [0, 1, 0], pR: [-0.8, 0.3, 0.6], pL: [0.2, 0.8, -0.6], FR: [26, -14, 7] }, 'io'),
      // the sword comes round from the hip, the point out toward the camera, to the centre line
      at(540, { hip: [-2, -79.5, 0], py: 12, cy: 19, lean: 5, nod: 3, R: [24, -100, 34], by: 110, el: -6, n: [0, 1, 0], pR: [-0.7, 0.4, 0.6], pL: [0, 0.85, -0.6], FR: [24, -4, 6] }, 'io'),
      at(570, { hip: [-1, -79, 0], py: 13, cy: 20, lean: 6, nod: 4, R: [30, -103, 24], by: 70, el: 6, n: [0, 0.8, 0.6], pR: [-0.5, 0.6, 0.6], pL: [-0.1, 0.9, -0.5], FR: [24, 0, 6] }, 'out'),
      at(640, { hip: [-0.5, -79, 0], py: 13, cy: 20, lean: 6, nod: 4, R: [38, -106, 6], by: 8, el: 22, n: [0, 0.5, 0.86], pR: [-0.2, 0.95, 0.6], pL: [-0.15, 1, -0.6] }, 'io'),
      at(773, {}, 'io'),
    ],
    phases: { windup: [0, 168], active: [168, 319], recovery: [319, 773] },
  },
  // hiza-geri: up onto the left toes, the right knee drives up into him
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
  // nidan-geri (Akane's own): low to the knee, the foot comes back without touching down, then high to the head
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

  // ---------------------------------------------------------------- phase 3b: rising and low cuts (kiri-age, sune-gari)
  // kiri-age from the right (the launcher): the blade low and back on the right side (waki), the hips turned open; it
  // swings under along the right side and rises through him from below, edge up, and on over the head - the follow-through
  // high, the face clear under the arms
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
      at(639, { hip: [16, -80, 0], py: 0, cy: 2, lean: 0, nod: -1, R: [46, -164, -4], by: -8, el: 82, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8] }, 'out'),
      at(800, { hip: [8, -79, 0], py: 8, cy: 14, lean: 4, nod: 3, R: [50, -130, 2], by: -4, el: 46, pR: [-0.3, 0.7, 0.6], pL: [-0.3, 0.7, -0.6] }, 'io'),
      at(1076, {}, 'io'),
    ],
    phases: { windup: [0, 370], active: [370, 538], recovery: [538, 1076] },
  },
  // kiri-age from the left (Akane's light, backhand): low on the left side, up through him to high on the right
  kiriL: {
    name: 'Rising cut from the left (gyaku kiri-age)', feet: FEET,
    keys: [
      at(0, {}),
      at(143, { hip: [-3, -78, -1], py: 6, cy: 6, lean: 6, nod: 5, R: [14, -98, -22], by: -160, el: -30, n: [0, 0, -1], pR: [-0.2, 0.8, 0.6], pL: [-0.4, 0.7, -0.6] }, 'io'),
      at(185, { hip: [-4, -77.5, -1], py: 5, cy: 5, lean: 6, nod: 5, R: [18, -97, -21], by: -140, el: -31, n: [0, 0, -1], pR: [-0.2, 0.8, 0.6], pL: [-0.4, 0.7, -0.6] }, 'out'),
      at(230, { hip: [5, -77, 0], py: 6, cy: 8, lean: 7, nod: 5, R: [54, -98, -4], by: -40, el: -32, n: [0, 0, -1] }, 'in'),
      at(261, { hip: [12, -77, 0], py: 8, cy: 12, lean: 6, nod: 4, R: [66, -114, 2], by: -4, el: 8, n: [0, 0, -1] }, 'lin'),
      at(328, { hip: [15, -79, 0], py: 12, cy: 20, lean: 2, nod: 0, R: [56, -148, 4], by: 8, el: 62, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8] }, 'lin'),
      at(412, { hip: [15, -80, 0], py: 13, cy: 22, lean: 0, nod: -1, R: [46, -162, 6], by: 10, el: 82, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8] }, 'out'),
      at(600, { hip: [7, -79, 0], py: 13, cy: 20, lean: 4, nod: 3, R: [50, -128, 4], by: 2, el: 44, pR: [-0.3, 0.7, 0.6], pL: [-0.3, 0.7, -0.6] }, 'io'),
      at(891, {}, 'io'),
    ],
    phases: { windup: [0, 193], active: [193, 328], recovery: [328, 891] },
  },
  // sune-gari (Kuro's low cut from the right): down onto the front knee, the blade sweeps level at the shins
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
  // the throw (a shuriken from the obi, left hand): the sword hand keeps the point forward, one-handed; the left hand goes
  // to the belt, cocks back by the left ear as the chest turns away, then the hips and chest turn into it and the arm
  // whips out at him (the release: the fight's own, 0.386 of the move), follows through and goes back to the handle.
  throwL: {
    name: 'Throw (shuriken, left hand)', feet: FEET,
    keys: [
      at(0, {}),
      at(100, { hip: [-3, -79, 0], py: 8, cy: 10, lean: 4, nod: 4, R: [36, -100, 8], el: 10, lf: 1, L: [6, -90, -16], pL: [-1, 0.1, -0.4] }, 'out'),
      // (a side-arm flick: the hand goes back past the left hip, the arm long behind, the chest turned away)
      at(140, { hip: [-4, -79.5, 0], py: 6, cy: 2, lean: 2, nod: 3, R: [35, -100, 9], el: 10, lf: 1, L: [-24, -98, -30], pL: [-0.7, 0.3, -0.65] }, 'io'),
      at(175, { hip: [-5, -80, 0], py: 4, cy: -6, lean: 1, nod: 2, R: [34, -101, 10], el: 10, lf: 1, L: [-36, -110, -32], pL: [-0.6, 0.4, -0.7] }, 'out'),
      at(208, { hip: [2, -78.5, 0], py: 10, cy: 14, lean: 6, nod: 4, R: [37, -101, 10], el: 10, lf: 1, L: [8, -112, -40], pL: [-0.2, 1, 0.1] }, 'in'),
      at(240, { hip: [8, -77, 0], py: 18, cy: 34, lean: 10, nod: 6, R: [40, -101, 10], el: 10, lf: 1, L: [58, -120, -14], pL: [-0.2, 1, -0.3] }, 'in'),
      at(330, { hip: [10, -76, 0], py: 18, cy: 32, lean: 12, nod: 7, R: [42, -100, 9], el: 11, lf: 1, L: [54, -104, -6], pL: [-0.2, 0.8, -0.6] }, 'out'),
      at(470, { hip: [4, -78, 0], py: 16, cy: 26, lean: 8, nod: 5, R: [40, -102, 4], el: 15, lf: 0.5, L: [30, -100, -8] }, 'io'),
      at(620, {}, 'io'),
    ],
    // (the whip of the arm is a quick move: the light class's limits)
    phases: { windup: [0, 175], active: [175, 240], recovery: [240, 620] },
  },

  // ---------------------------------------------------------------- phase 4: blade on blade (the lock, the bind, the clash)
  // The lock (tsubazeriai, js/game.js startLock: the two 100 apart, up to 2.8 s, mashing): hilts pressed together between
  // the bodies, blades up and crossed above the hands, the hips low and the trunk leaning in; the fists low enough that
  // the face stays clear over them. A grinding loop; the one winning the mash (f.lockWin) presses further in.
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
  // the lock won (js/game.js endLock 'shove', 0.3 s): both arms drive the locked hilts out at him, then back to the guard
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
  // two cuts met head on (the fight's 'clash', 0.34 s, both knocked 330 back): the blade bounces up and back off his,
  // the trunk rocks back over the rear foot, then the guard again
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
  // The bind (js/duel.js startBind: a full defence chain; up to 0.43 s, then the strike): the blades meet at one point
  // between them (js/duel-bind.js bindGeom - the drawing takes the fight's own hand and blade line there); the bodies:
  // the defender low under it, blade rising steeply, the attacker over it, pressing down flatter. A short grinding loop.
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
  // the bind won (the strike, 0.62 s on its own clock c.t2): maki-otoshi - the defender's blade winds over his (the tip
  // circles up and over toward the camera side), then beats down hard through his blade (it flies at 0.19), follows
  // through low, and the point comes up into a thrust at him, held
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
  // the bind lost: he presses once more, then his blade is beaten down and out of his hands (0.19: from there the fight
  // has him empty-handed and its own picture plays)
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

  // ---------------------------------------------------------------- phase 4: the post (js/duel-env.js ACT.stuck / dodgePost)
  // stuck (0.9 s): the cut bites into the post at chest height - the blade level and still, the hips drop behind it;
  // twice the hands tug it back (the blade's point stays in the wood: the fists come back, the blade levels), then it
  // comes free and the guard is taken. The arms stay low: the face is clear the whole time.
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
  // dodgePost (1.0 s): the defender hops round the post (the fight carries the body, 0-0.18 s) and drops low behind it,
  // the sword low at the right hip; then up, the knee chambers and the front kick drives out at his middle (0.72), the
  // foot comes back and down, the guard. (Off the floor for the fight - c.Y stays 0: the feet hop, then plant.)
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

  // ---------------------------------------------------------------- phase 4: Akane's and Kuro's own strings and specials
  // Played on the fight's own clock (duel-hook.js PLAY: each blow's window is the fight's, phases.hits). ms = the fight's.
  // tsubame-gaeshi (0.62 s; blows 0.09-0.15, 0.23-0.29): kesa down from the right shoulder through him, the wrists roll
  // low on the left, and the blade comes straight back up the same line (gyaku kiri-age) to high on the right
  tsubame: {
    name: 'Tsubame-gaeshi (down, and straight back up)', feet: FEET,
    keys: [
      at(0, {}),
      at(28, K_UP1, 'io'),
      at(50, K_EAR, 'io'),
      at(71, { ...K_UP3, R: [2, -177, 20], by: 150, el: 54 }, 'io'),
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
  // Kurenai renga (Akane's str1, 0.72 s; blows 0.09-0.14, 0.26-0.32): kesa from the right shoulder, then from over the
  // left shoulder gyaku-kesa, a hard chiburi, the guard
  renga: {
    name: 'Kurenai renga (kesa, gyaku-kesa, chiburi)', feet: FEET,
    keys: [
      at(0, {}),
      at(28, K_UP1, 'io'),
      at(50, K_EAR, 'io'),
      at(71, { ...K_UP3, R: [2, -177, 20], by: 150, el: 54 }, 'io'),
      at(98, { hip: [6, -79, 0], py: 9, cy: 20, lean: 3, nod: 2, R: [46, -160, 24], by: 35, el: 36, n: [0, 0.6, 0.8], pR: [-0.3, 0.4, 0.85], pL: [0.2, 0.8, -0.6] }, 'in'),
      at(121, { hip: [12, -77, 0], py: -2, cy: 2, lean: 7, nod: 6, R: [68, -128, 4], by: -14, el: -22, n: [0, 0.6, 0.8] }, 'lin'),
      at(145, { hip: [14, -74.5, 0], py: -8, cy: -8, lean: 10, nod: 7, R: [60, -97, -10], by: -46, el: -38, n: [0, 0.6, 0.8] }, 'out'),
      // round the left side behind (the blade level, out to the left, then back) and up over the left side of the crown
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
  // Higanbana (Akane's str2, 0.72 s, from the saya; the cut 0.17-0.27 while the fight carries her ~165 through him):
  // the hips drop into a low iai, the hilt goes forward along the saya, the blade whips out and she dashes through him
  // with one level one-handed cut, lands long and low with the blade swept out to the right, holds, flicks, the guard;
  // at the end she turns round to him (turnFrom: only when she has passed him - the fight then faces her to him). Both
  // feet leave the floor for the dash.
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
      // (she stands where she came down; then she turns round to him - the fight faces her to him as the move ends)
      at(570, { hip: [6, -75, 0], py: 15, cy: 24, lean: 8, nod: 5, R: [50, -104, 10], by: 12, el: 0, n: [0, 0.4, 0.92], lw: 0.8 }, 'io'),
      at(640, yawK({ hip: [3, -75, 0], py: 14, cy: 22, lean: 7, nod: 4, R: [44, -103, 4], el: 12 }, 80), 'io'),
      at(690, yawK({ hip: [1, -76, 0], py: 14, cy: 22, lean: 6, nod: 4, R: [40, -101, 2], el: 16 }, 150), 'io'),
      at(720, yawK({ hip: [0, -77, 0], R: [38, -101, 2] }, 180), 'io'),
    ],
    phases: { windup: [0, 170], active: [170, 270], recovery: [270, 720] },
  },
  // Kurenai issen (Akane's ki special, 1.0 s; the cut 0.3-0.45 as the fight carries her ~250 through him): the same
  // draw-dash as Higanbana, longer - the gather in a deep iai (embers), the blade out and through, held long and low.
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
  // Yama kudaki (Kuro's ki special, 1.04 s; the fight lifts him 150 between 0.25 and 0.52 and carries him in; the blow
  // 0.45-0.56): a deep crouch with the blade low behind, the leap with the fists going up past the side of the head to
  // high over the crown (the face clear under them), the legs tucked, then down onto the floor in a deep stance as the
  // blade splits the ground in front; held, then up into the guard, the feet stepping back under him.
  yama: {
    name: 'Yama kudaki (ki: the leap that splits the ground)', feet: { R: [44, 8], L: [-34, -7] }, ownFeet: [0, 540], air: true,
    steps: [{ foot: 'R', t0: 860, t1: 950, dx: -20, dz: -2, h: 6 }, { foot: 'L', t0: 940, t1: 1030, dx: 12, dz: 1, h: 5 }],
    keys: [
      at(0, {}),
      // the crouch: the blade held low in front, the knees deep
      at(200, { hip: [-6, -62, 0], py: 14, cy: 24, lean: 18, nod: 8, R: [50, -86, 4], by: 0, el: 4, pR: [-0.3, 0.8, 0.6], pL: [-0.3, 0.8, -0.5] }, 'io'),
      at(250, { hip: [-6, -60, 0], py: 14, cy: 24, lean: 19, nod: 8, R: [50, -84, 4], by: 0, el: 4, pR: [-0.3, 0.8, 0.6], pL: [-0.3, 0.8, -0.5] }, 'out'),
      // up: the overhead's own raise (the fists out in front, then the elbows flick up behind the face), the legs tuck
      at(300, { hip: [-2, -82, 0], py: 14, cy: 30, lean: 3, nod: 3, R: [44, -140, 4], by: 0, el: 62, pR: [-0.5, 0.45, 0.75], pL: [-0.5, 0.45, -0.75], FR: [24, -16, 6], FL: [-22, -20, -6] }, 'io'),
      at(335, { hip: [-3, -81, 0], py: 13, cy: 34, lean: 2, nod: 2, R: [30, -162, 4], by: 0, el: 96, pR: [-0.2, 0.9, 0.4], pL: [-0.6, 0.3, -0.75], FR: [32, -30, 7], FL: [-14, -36, -7] }, 'io'),
      at(358, { hip: [-3.5, -81.2, 0], py: 12.5, cy: 36, lean: 2, nod: 2, R: [21, -171, 4], by: 0, el: 110, pR: [-0.3, 0.3, 0.9], pL: [-0.8, 0, -0.6], FR: [34, -36, 7], FL: [-12, -42, -7] }, 'io'),
      at(382, { hip: [-4, -81.5, 0], py: 12, cy: 38, lean: 2, nod: 2, R: [10, -180, 3], by: 0, el: 122, ...UPEL, FR: [34, -38, 7], FL: [-10, -44, -7] }, 'io'),
      at(410, { hip: [-5, -82, 0], py: 11, cy: 40, lean: 1, nod: 1, R: [-8, -185, 3], by: 0, el: 150, ...UPEL, FR: [36, -34, 7], FL: [-12, -40, -7] }, 'io'),
            // the cleave: down with the body, onto the floor in a deep stance, the point just over the ground in front
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
  // the air chase (0.46 s, the fight jumps him at the launched one and steers him there): the knees tuck, the fists go
  // up by the right side of the crown and one kesa cuts through him in the air (0.17-0.27), the legs hang for the fall
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
  // the spike from the air (0.36 s): from the fall the fists go up over the crown and the blade comes down hard through
  // him (0.07-0.17), on down to point low in front; the legs come under for the landing
  airSpike: {
    name: 'Air spike (otoshi)', feet: FEET, ownFeet: true, air: true,
    keys: [
      at(0, { hip: [4, -79, 0], py: 6, cy: 10, lean: 7, nod: 5, R: [50, -106, -3], by: -18, el: 6, n: [0, 0.4, 0.92], FR: [26, -12, 7], FL: [-20, -16, -7] }),
      at(26, { ...K_UP1, FR: [27, -18, 7], FL: [-18, -22, -7] }, 'io'),
      at(46, { ...K_EAR, FR: [28, -22, 7], FL: [-16, -26, -7] }, 'io'),
      at(65, { ...K_UP3, R: [2, -177, 20], by: 150, el: 54, FR: [28, -24, 7], FL: [-15, -28, -7] }, 'io'),
      at(93, { hip: [8, -79, 0], py: 7, cy: 18, lean: 4, nod: 2, R: [50, -160, 24], by: 35, el: 36, n: [0, 0.6, 0.8], pR: [-0.3, 0.4, 0.85], pL: [0.2, 0.8, -0.6], FR: [28, -22, 7], FL: [-15, -26, -7] }, 'in'),
      at(123, { hip: [12, -77, 0], py: -2, cy: 2, lean: 10, nod: 7, R: [70, -126, 4], by: -10, el: -26, n: [0, 0.6, 0.8], FR: [28, -18, 7], FL: [-16, -22, -7] }, 'lin'),
      at(170, { hip: [13, -75, 0], py: -6, cy: -4, lean: 14, nod: 8, R: [66, -104, -2], by: -18, el: -40, n: [0, 0.6, 0.8], FR: [27, -12, 7], FL: [-18, -14, -7] }, 'out'),
      at(360, { hip: [6, -77, 0], py: 4, cy: 8, lean: 10, nod: 6, R: [54, -104, 0], by: -10, el: -6, n: [0, 0.5, 0.86], FR: [26, -6, 7], FL: [-20, -8, -7] }, 'io'),
    ],
    phases: { windup: [0, 70], active: [70, 170], recovery: [170, 360] },
  },
  // sandan-giri (the chain's finisher, 0.76 s; blows 0.08-0.13, 0.2-0.25, 0.33-0.4): kiri-age from low on the right,
  // gyaku-kesa from over the left shoulder, then the fists go up over the crown and the big men cleaves down; chiburi.
  // sandan-giri (the chain's finisher, 0.76 s; blows 0.08-0.13, 0.2-0.25, 0.33-0.4): kesa down from the right shoulder,
  // the wrists roll low on the left and it comes straight back up (kiri-age) to high on the right, over to the right side
  // of the crown and down once more through him, harder, the hips forward; held, chiburi, the guard.
  sandan: {
    name: 'Sandan-giri (down, up, down)', feet: FEET,
    keys: [
      at(0, {}),
      at(26, K_UP1, 'io'),
      at(47, K_EAR, 'io'),
      at(67, { ...K_UP3, R: [2, -177, 20], by: 150, el: 54 }, 'io'),
      at(93, { hip: [6, -79, 0], py: 9, cy: 20, lean: 3, nod: 2, R: [46, -160, 24], by: 35, el: 36, n: [0, 0.6, 0.8], pR: [-0.3, 0.4, 0.85], pL: [0.2, 0.8, -0.6] }, 'in'),
      at(115, { hip: [11, -77, 0], py: -2, cy: 2, lean: 7, nod: 6, R: [66, -128, 4], by: -14, el: -22, n: [0, 0.6, 0.8] }, 'lin'),
      at(140, { hip: [12, -74.5, 0], py: -8, cy: -8, lean: 10, nod: 7, R: [58, -97, -10], by: -46, el: -38, n: [0, 0.6, 0.8] }, 'out'),
      at(170, { hip: [12, -75, 0], py: -6, cy: -4, lean: 10, nod: 7, R: [56, -97, -11], by: -44, el: -36, n: [0, 0, -1] }, 'io'),
      at(204, { hip: [12, -76.5, 0], py: 4, cy: 8, lean: 7, nod: 5, R: [62, -110, 0], by: -8, el: 0, n: [0, 0, -1] }, 'in'),
      at(230, { hip: [12, -78, 0], py: 10, cy: 18, lean: 3, nod: 1, R: [56, -140, 4], by: 6, el: 50, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8] }, 'lin'),
      at(262, { hip: [11, -80, 0], py: 13, cy: 22, lean: 0, nod: -1, R: [44, -162, 6], by: 10, el: 82, n: [0, 0, -1], pR: [-0.4, 0.5, 0.7], pL: [-0.5, 0.3, -0.8] }, 'out'),
      // over to the right side of the crown: the elbows up and back, the blade tips back over the shoulder
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
  // the turning counters. Mawari (0.58 s, keys in the fight's ms; the fight dashes him past the other 0.02-0.2, flips his
  // facing at 0.21 and the level cut runs 0.27-0.35): a low duck out of his line with both feet off the floor for the
  // dash, down planted behind him, the hips and chest already turning; the facing flips (turnAt: the keys either side are
  // the same pose turned 180 - in the picture nothing moves), the turn goes on, the blade trailing low on the right, and
  // comes round into one level cut from the right (the spin and the cut the same way round), held, back to the guard.
  mawari: {
    name: 'Mawari (duck past him, turn, cut)', feet: { R: [30, 7], L: [-30, -7] }, ownFeet: [0, 200], turnAt: 210,
    keys: [
      at(0, {}),
      at(25, { hip: [2, -76, 0], lean: 12, nod: 6, R: [42, -100, 4], FR: [24, -5, 6], FL: [-22, -6, -6] }, 'io'),
      at(80, { ...MW_DUCKB, FR: [34, -10, 7], FL: [-26, -8, -7] }, 'io'),
      at(130, { ...MW_DUCKB, hip: [6, -58, 0], lean: 31, FR: [40, -12, 7], FL: [-30, -14, -7] }, 'io'),
      at(180, { ...yawK(MW_DUCKB, -20), FR: [30, -6, 7], FL: [-30, -6, -7] }, 'io'),
      at(200, { ...yawK({ ...MW_DUCKB, R: [-10, -74, 22] }, -45), FR: [30, 0, 7], FL: [-30, 0, -7] }, 'io'),
      at(209, yawK(MW_DUCK, -70), 'lin'),
      at(211, yawK(MW_DUCK, -250), 'lin'),
      at(245, yawK(MW_TRAIL, -290), 'io'),
      at(272, yawK(MW_IN, -335), 'in'),
      at(305, yawK(MW_MID, -360), 'lin'),
      at(350, yawK(MW_END, -360), 'out'),
      at(430, yawK({ ...MW_END, hip: [10, -76, 0], py: -6, cy: -2, lean: 8, nod: 5, R: [58, -106, -8], by: -30, el: 8, n: [0, 0.6, 0.8] }, -360), 'io'),
      at(500, yawK({ hip: [4, -78, 0], py: 8, cy: 14, lean: 7, nod: 5, R: [48, -106, 0], by: -8, el: 14 }, -360), 'io'),
      at(580, yawK({}, -360), 'io'),
    ],
    phases: { windup: [0, 270], active: [270, 350], recovery: [350, 580] },
  },
  // Kuruma-giri (Kuro's wheel: the fight spins him one full turn while the level cut from the right runs; keys in the
  // move's ms - the fight's window laid on 200-300): a short wind with the blade back low on the right, the whole body
  // turns once round (the back to him half way, the blade trailing), and the turn carries the blade round level through
  // him; held, back to the guard. The feet stay planted (the fight's own small travel: steps).
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
};
export const ORDER = ['idle', 'overhead', 'horizontal', 'diagonal', 'thrust', 'block',
  'kesaS', 'gyakuS', 'menS', 'yokoL', 'tsukiS', 'guardMid', 'guardHi', 'guardLow', 'blockMid', 'blockHi', 'blockLow', 'hurtHi', 'hurtBody', 'stagger', 'recoil', 'zanshin',
  'walkF', 'walkB', 'run', 'fall', 'downRise', 'throwL', 'parryUp', 'parryDown', 'parrySide', 'dodgeB', 'dodgeF', 'noto', 'nuki',
  'kakato', 'sweep', 'spinKick', 'snapKick', 'knee', 'nidan', 'kiriR', 'kiriL', 'sune',
  'lock', 'lockPush', 'shove', 'clash', 'bindDef', 'bindAtt', 'makiDef', 'flungAtt',
  'stuck', 'dodgePost', 'tsubame', 'renga', 'higan', 'issen', 'yama', 'airCut', 'airSpike', 'sandan', 'mawari', 'kuruma'];
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
const CH = ['hx', 'hy', 'hz', 'py', 'cy', 'lean', 'nod', 'by', 'el', 'nx', 'ny', 'nz', 'rr', 'raz', 'rel', 'prx', 'pry', 'prz', 'plx', 'ply', 'plz', 'lw', 'dr',
  'pt', 'lx', 'ly', 'lz', 'lf', 'frx', 'fry', 'frz', 'flx', 'fly', 'flz'];
// the pitch: a vector of the body (relative to the hip) tipped back by a deg (+: the head goes back and down, the face up)
function tip(v, a) { if (!a) return v; const c = Math.cos(a * D2R), s = Math.sin(a * D2R); return [v[0] * c + v[1] * s, -v[0] * s + v[1] * c, v[2]]; }
const tipAt = (p, hip, a) => (a ? add(hip, tip(sub(p, hip), a)) : p);
const dirOf = (u) => ({ by: Math.atan2(u[2], u[0]) / D2R, el: Math.asin(clamp(-u[1], -1, 1)) / D2R });
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
  if (k.w && k.pitch) {
    // (written in the fight's frame: back into the tipped body's own)
    const a = -k.pitch, h = k.hip, u = tip(bladeDir(k.by, k.el), a), d = dirOf(u);
    k = Object.assign({}, k, { w: 0, R: tipAt(k.R, h, a), by: d.by, el: d.el, n: tip(k.n, a), pR: tip(k.pR, a), pL: tip(k.pL, a) });
  }
  if (!k.iai) return k;
  // (sby / sel: the saya tipped by the left hand - its mouth stays at the obi, the blade lies along the tipped line)
  const B = torso(k), S = sayaOf(B), u = k.sby != null ? bladeDir(k.sby, k.sel) : S.u, vis = (k.d || 0) * LEN.blade;
  return Object.assign({}, k, { by: Math.atan2(u[2], u[0]) / D2R, el: Math.asin(clamp(-u[1], -1, 1)) / D2R, R: madd(S.a, u, -(vis + 4)) });
}
function channels(id) {
  let C = CACHE.get(id);
  if (C) return C;
  const K = MOVES[id].keys.map(iaiKey), n = K.length, t = K.map((k) => k.t), v = {};
  // (a key with at: 1 - the point meeting the saya's mouth: its own iai line, the blade still all out)
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
    else if (c === 'by' || c === 'py' || c === 'cy') d = ((((d + 540) % 360) + 360) % 360) - 180; // (a spin ends a turn round)
    o[c] = a[c] + d * w;
  }
  return o;
}
// the drawn body from a channel set. opt: { feet: { R: [x, y, z], L: [x, y, z] } (the fight's planted feet, local),
// grip (the distance between the fists: the weapon's handle), blade (its length) }
export function poseFromCh(id, o, t, prev, opt) {
  const M = MOVES[id];
  const k = { hip: [o.hx, o.hy, o.hz], py: o.py, cy: o.cy, lean: o.lean, nod: o.nod, by: o.by, el: o.el, n: norm([o.nx, o.ny, o.nz]), pR: [o.prx, o.pry, o.prz], pL: [o.plx, o.ply, o.plz], lw: clamp(o.lw, 0, 1), d: clamp(o.dr, 0, 1),
    pitch: o.pt || 0, L: [o.lx, o.ly, o.lz], lf: clamp(o.lf || 0, 0, 1), FR: [o.frx, o.fry, o.frz], FL: [o.flx, o.fly, o.flz] };
  const B = torso(k), ce = Math.cos(o.rel);
  let R = madd(B.shC, [ce * Math.cos(o.raz), -Math.sin(o.rel), ce * Math.sin(o.raz)], o.rr);
  // (the sword home in the saya - Akane between moves, opt.sheathed: the right fist on the handle at the saya's mouth, the
  // left hand holding the saya, whatever the body does)
  if (opt && opt.sheathed) {
    const S = sayaOf(B), d = dirOf(S.u);
    k.by = d.by; k.el = d.el; k.d = 0; k.lw = 0; R = madd(S.a, S.u, -6);
    k.pR = [-0.3, 0.9, 0.5];
  }
  return build(M, k, B, R, prev, t, opt);
}
export function poseAt(id, t, prev, opt) {
  const T = durOf(id), M = MOVES[id];
  // (a gait on its own - the checks, the viewer: one cycle at its own stride, the body carried along by it)
  if (M.gait && !(opt && opt.feet)) {
    const u = (((t % T) + T) % T) / T;
    opt = Object.assign({}, opt, { feet: gaitFeet(id, u, M.gait.S) });
    const P = poseFromCh(id, chAt(id, t), u * T, prev, opt);
    P.bodyX = M.gait.S * (Math.floor(t / T) + u);
    return P;
  }
  return poseFromCh(id, chAt(id, t), M.loop ? ((t % T) + T) % T : clamp(t, 0, T), prev, opt);
}
// ------------------------------------------------------------------ gaits (walk, back-step, run)
// A gait's clock is the ground the body covers (the fight moves it): one cycle = S of it, u = 0 ... 1. The keys are the
// body over one cycle (the hips rise and fall, turn with the stepping leg; the sword stays on the centre line); the feet
// are placed by the cycle: a foot on the floor stays where it is on the floor (in the body's frame it goes back exactly
// as fast as the body goes forward), a foot in the air travels the stride on a smoothstep, lifted on a half sine. Nothing
// slides. S is the stride of one cycle (two steps); walkB's is backward.
const s5 = (v) => v * v * v * (v * (v * 6 - 15) + 10);
function swing(u, a, b) { if (u <= a) return [0, 0]; if (u >= b) return [1, 0]; const v = (u - a) / (b - a); return [s5(v), Math.sin(Math.PI * v)]; }
// The walk (phase 3b, the reviewer: the old walk barely moved the legs - short strides from the fixed stance read as a
// glide): a real stride. Each foot travels the whole stride S in one swing, lifted clear (WALK_H), and lands S/4 past the
// body's middle; at double support (u 0 and 0.5) the feet are S/2 apart round the middle (WALK_C). Forward the rear foot
// passes the planted one; backward the front foot goes back first. The fight's drawing (duel-hook.js gaitAt) plays the
// same swings from where each foot really is, so a change of stride never moves a planted foot.
export const WALK_C = 1, WALK_Z = 7, WALK_SW = [0.04, 0.46];
export const WALK_H = (S) => 10 + Math.abs(S) * 0.03;
// the stride of one cycle (two steps) for a speed: forward 70-130 (the fight's full walk, 255 a second: ~2 cycles, 3.9
// steps a second), backward 64-118, the run 120-200
export const strideOf = (id, sp) => (id === 'run' ? clamp(Math.abs(sp) * 0.33, 120, 200) : id === 'walkB' ? -clamp(Math.abs(sp) * 0.6, 64, 118) : clamp(Math.abs(sp) * 0.55, 70, 130));
export function gaitFeet(id, u, S) {
  const G = MOVES[id].gait, o = {};
  if (G.kind === 'walk') {
    const first = S >= 0 ? 'L' : 'R', W = { [first]: [WALK_SW[0], WALK_SW[1]], [first === 'L' ? 'R' : 'L']: [0.5 + WALK_SW[0], 0.5 + WALK_SW[1]] };
    const h = WALK_H(S);
    for (const s of ['R', 'L']) { const b = WALK_C + (s === first ? -S / 4 : S / 4), [w, l] = swing(u, W[s][0], W[s][1]); o[s] = [b + S * w - S * u, -l * h, s === 'R' ? WALK_Z : -WALK_Z]; }
  } else {
    // run: each foot on the floor 35 % of the cycle, under the body; in the air the rest (both off it between): R's middle
    // of the floor time at u 0, L's at 0.5 (the hips lowest there)
    for (const [s, c0, cx, z] of [['R', 0.825, 10, 5], ['L', 0.325, 6, -5]]) {
      let v = u - c0; if (v < 0) v += 1;
      const x0 = cx + 0.175 * S; // (where it lands: the middle of its time on the floor is under the hip)
      if (v <= 0.35) o[s] = [x0 - S * v, 0, z];
      else { const q = (v - 0.35) / 0.65, w = s5(q); o[s] = [x0 + S * w - S * v, -Math.sin(Math.PI * q) * G.h, z]; }
    }
  }
  return o;
}

// The walk played from where the feet really are (the fight's drawing, the viewer): the same swings as gaitFeet, but each
// half cycle's swing leaves from the foot's real spot and lands where that half's stride puts it (S/4 past the body's
// middle as the half ends), so a stride that changes (the body speeding up, slowing down) only makes the next step longer
// or shorter: a planted foot never moves. G: kept between frames ({} to start); x, dir: the body on the floor now;
// at(s): the foot's world spot now ([x, z]). Returns the feet in the body's frame.
export function walkFeetLive(G, u, S, x, dir, at) {
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
// (a high kick - a move with kneeUp naming the foot: the knee cap faces along the leg's own front - forward for a leg
// hanging down, up for one raised level, up and back for one raised past level - so a leg swung up high never bends
// backward at the knee; for a leg hanging down it is the same pole as every other leg)
export function layLeg(P, s, ft) {
  const fw = P.fP || [1, 0, 0];
  let pole = add(fw, [0, -0.15, s === 'R' ? 0.25 : -0.25]);
  if (P.kneeUp === s) {
    const d = norm(sub(ft, P['hip' + s])), a = dot(d, norm([fw[0], 0, fw[2]]));
    pole = add(add(mul(norm([fw[0], 0, fw[2]]), d[1]), [0, -a, 0]), [0, 0, s === 'R' ? 0.25 : -0.25]);
  }
  const r = ik3(P['hip' + s], ft, LEN.thigh, LEN.shin, pole);
  P['kn' + s] = r.m; P['ft' + s] = r.e; P['legReach' + s] = r.reach / (LEN.thigh + LEN.shin);
}
export function layArm(P, s, ha, pole) {
  const r = ik3(P['sh' + s], ha, LEN.uArm, LEN.fArm, pole);
  P['el' + s] = r.m; P['ha' + s] = r.e; P['reach' + s] = r.reach / (LEN.uArm + LEN.fArm);
  return r;
}
function build(M, k, B, R, prev, t = 0, opt = {}) {
  const P = {}, a = k.pitch || 0, h0 = B.hip, TP = (p) => tipAt(p, h0, a), TD = (v) => tip(v, a);
  P.hip = B.hip; P.chest = TP(B.chest); P.neck = TP(B.neck); P.head = TP(B.head); P.shR = TP(B.shR); P.shL = TP(B.shL);
  P.hipR = TP(madd(B.hip, B.rP, LEN.hipW)); P.hipL = TP(madd(B.hip, B.rP, -LEN.hipW));
  if (M.kneeUp) P.kneeUp = M.kneeUp;
  P.pl = TD(B.rP); P.cf = TD(norm(sub(mul(B.fC, Math.cos(k.lean * D2R)), mul(UP, Math.sin(k.lean * D2R))))); P.hf = TD(B.fH); P.fP = TD(B.fP);
  R = TP(R);
  // legs: planted feet, knees forward over the toes (the fight's own planted feet when it gives them; a fall's own)
  // (a kick: M.kick names the kicking foot, placed by the keys' FR / FL like a fall's; the other stays planted)
  // (ownFeet [t0, t1]: the move's own feet only then - a dash's lifted feet; after it they stand where they came down)
  const own = Array.isArray(M.ownFeet) ? t >= M.ownFeet[0] && t <= M.ownFeet[1] : !!M.ownFeet, kf = M.kick, ownS = (s) => own || kf === s;
  for (const s of ['R', 'L']) layLeg(P, s, ownS(s) ? k['F' + s] : opt.feet ? opt.feet[s] : footAt(M, s, t));
  P.toR = [1, 0, 0]; P.toL = norm([0.96, 0, -0.28]);
  // (a foot off the floor, or a body tipped over: the foot square to its shin - toes up when lying, pointed in the air)
  for (const s of ['R', 'L']) if (ownS(s)) {
    const ft = P['ft' + s], sh = norm(sub(ft, P['kn' + s])), toe = norm([sh[1], -sh[0], s === 'R' ? 0 : -0.28]), flat = s === 'R' ? [1, 0, 0] : P.toL;
    const w = Math.max(clamp((-ft[1] - 2) / 8, 0, 1), clamp((a - 25) / 30, 0, 1));
    P['to' + s] = norm(lerp(flat, toe, w));
  }
  P.ownFeet = own;
  // the saya at the left hip (moved off the obi only while the blade is coming out of it, below)
  const SY0 = sayaOf(B), SY = { a: TP(SY0.a), u: TD(SY0.u) };
  // (on the floor - lying, sitting up - the saya's end stays on top of it: turned up just enough, its line kept)
  { const L = LEN.blade + 6, ey = SY.a[1] + SY.u[1] * L, lim = -2.5;
    if (ey > lim) { const uy = clamp((lim - SY.a[1]) / L, -1, 1), hz = Math.hypot(SY.u[0], SY.u[2]) || 1, kk = Math.sqrt(Math.max(0, 1 - uy * uy)) / hz; SY.u = norm([SY.u[0] * kk, uy, SY.u[2] * kk]); } }
  // sword: the blade's direction and edge, both fists on the handle
  const u = opt && opt.sheathed ? SY.u : TD(bladeDir(k.by, k.el));
  let e = cross(TD(k.n), u); if (len(e) < 1e-3) e = cross([0, 0, 1], u); e = norm(sub(e, mul(u, dot(e, u))));
  const grip = opt.grip || LEN.grip, d = k.d == null ? 1 : k.d, lw = k.lw == null ? 1 : k.lw;
  // the iai draw: while the blade is not all out it runs from the right fist through the saya's mouth (the saya follows
  // it, held at its mouth by the left hand); sheathed (d 0) the fist rests on the handle at the mouth
  const vis = d * LEN.blade, mouth = d < 0.999 ? madd(R, u, vis + 4) : SY.a;
  // (a longer handle - Kuro's nodachi, fists 27 apart; the keys are written for the katana's 19: the extra is shared
  // between the fists - the right one up the handle, the left one down - so that neither arm is stretched out (right
  // reach over 0.93) nor folded in (left under 0.5); half each when both are comfortable)
  const lf = k.lf || 0, X = Math.max(0, grip - LEN.grip) * (opt.sheathed ? 0 : 1) * clamp(lw, 0, 1) * (1 - lf);
  let ext = X / 2;
  if (X > 0) {
    const AL = LEN.uArm + LEN.fArm, sq = (v) => v * v;
    let best = 1e9;
    // (soft limits that start early and a fine search: the fists slide along the handle a little each frame, never in
    // quarter-unit jumps)
    // (phase 4: and the longer handle kept off his own face - the pommel, the fists and the blade's root 19 off the head's
    // centre: through a cut passing in front of the face the sword slides out along its line)
    const sd = (p, a, b) => { const ab = sub(b, a), q = clamp(dot(sub(p, a), ab) / Math.max(1e-9, dot(ab, ab)), 0, 1); return len(sub(p, madd(a, ab, q))); };
    for (let x = -2; x <= X + 2.001; x += 0.05) {
      const hr = madd(R, u, x), hl = madd(hr, u, -grip), rR = len(sub(hr, P.shR)) / AL, rL = len(sub(hl, P.shL)) / AL;
      const dH = Math.min(sd(P.head, madd(hl, u, -5), madd(hr, u, LEN.guard + 40)), len(sub(P.head, hr)), len(sub(P.head, hl)));
      const c = sq(Math.max(0, rR - 0.9)) + sq(Math.max(0, 0.56 - rL)) + 3e-4 * sq(x - X / 2) + 0.02 * sq(Math.max(0, 19.5 - dH));
      if (c < best) { best = c; ext = x; }
    }
  }
  let HR = madd(R, u, ext);
  // (a pose the longer handle cannot share out - the low guard: the point down, the left fist up at the belt - the fists
  // come in toward the right shoulder by what the right arm lacks, and out from the left one by what folds it)
  if (X > 0) {
    const AL = LEN.uArm + LEN.fArm, dR = sub(HR, P.shR), rR = len(dR) / AL;
    if (rR > 0.93) HR = madd(HR, dR, -(rR - 0.93) * AL / len(dR));
    const dL = sub(madd(HR, u, -grip), P.shL), rL = len(dL) / AL;
    // (eased off as the right arm nears its reach - never switched, which made the elbows jump a frame)
    if (rL < 0.48) { const q = madd(HR, dL, (0.48 - rL) * AL / Math.max(1e-6, len(dL))); HR = lerp(HR, q, clamp((0.97 - len(sub(q, P.shR)) / AL) / 0.04, 0, 1)); }
  }
  // (phase 4: the longer handle's back fist and pommel never in front of his own face - both fists move out of its way,
  // by what they lack of 19 from the head's centre, as far as the sword arm reaches without locking)
  if (X > 0) {
    const np = (p, a, b) => { const ab = sub(b, a), q = clamp(dot(sub(p, a), ab) / Math.max(1e-9, dot(ab, ab)), 0, 1); return madd(a, ab, q); };
    const AL = LEN.uArm + LEN.fArm, dv = sub(np(P.head, madd(HR, u, -grip - 6), madd(HR, u, LEN.guard + 4)), P.head), dd = len(dv), need = 19 - dd;
    if (need > 0 && dd > 1e-3) {
      let m = need; while (m > 0 && len(sub(madd(HR, dv, m / dd), P.shR)) / AL > 0.955) m -= 0.25;
      HR = madd(HR, dv, Math.max(0, m) / dd);
    }
  }
  let HL = lw >= 0.999 ? madd(HR, u, -grip) : lerp(madd(mouth, d < 0.999 ? u : SY.u, 3), madd(HR, u, -grip), lw);
  if (lf > 0.001) HL = lerp(HL, k.L, lf);
  const poleR = TD(k.pR);
  let poleL = TD(k.pL);
  // (a free left hand sweeps through many directions - a throw, a palm to the floor: its elbow keeps the side it bent to a
  // moment ago, the key's pole only leaning on it, so it never flips over when the arm passes the pole's line)
  const cw = clamp((lf - 0.15) / 0.6, 0, 1) * 0.75;
  if (cw > 0 && prev && prev.elL && prev.shL && prev.haL) { const off = sub(prev.elL, lerp(prev.shL, prev.haL, 0.5)); if (len(off) > 2) poleL = norm(add(mul(norm(off), cw), mul(norm(poleL), 1 - cw))); }
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
  P.armed = true; P.inside = false; P.bladeVis = null; P.gripL = lw * (1 - lf); P.fistR = true; P.fistL = lf < 0.5;
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
