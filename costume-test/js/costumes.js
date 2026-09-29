// Shadow Duel — built-in drawn costumes (new shapes over any fighter, drawn with the game's own code on the skeleton)
//
// A costume from the server's reward catalog (js/rewards.js) may name one of these: data { builtin: '<id>' }. The server
// only says who owns it; the drawing ships with the game (adding one needs a game update, so the catalog allow-list is
// ND.COSTUME_IDS and the same list in supabase/ranked.sql / ranked-admin.sql / studio/panel/validate.js).
// The palette of the fighter stays (the costume brings its own lacquer, lacing, metal and cloth colours).
//
// How it is drawn: js/skeleton.js ND.drawNinja calls the costume's layers in the fighter's own drawing order:
//   back     behind everything (capes, the back panel of a coat, a mane)       after the scabbard / quiver
//   backArm  over the far arm (its shoulder plate)                              after the back arm
//   body     over the torso and neck (a breastplate, the coat over the chest)   after the torso
//   head     over the head, in the head's own frame (x forward, y down, R = head radius)
//   hem      over the near leg (tassets, the coat's skirt)                      after the front leg
//   front    over the near arm (its shoulder plate)                             after the front arm
// Nothing here changes the fight (only pictures); a costume is drawn with paths (not the Low part cache) and not in
// reflections. Three concepts for the ranked season champion (owner's choice pending): shogun_a, shogun_b, shogun_c.
(function (ND) {
  'use strict';
  const TAU = Math.PI * 2, HP = Math.PI / 2;
  const R = 12.5; // head radius (skeleton.js ND.LEN.headR)
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

  // ---------------------------------------------------------------- frames
  // torso: u along the spine from the hip (0) to the neck (~56), n forward (the way the fighter faces)
  function torso(j) {
    let ux = j.neck.x - j.hip.x, uy = j.neck.y - j.hip.y; const ln = Math.hypot(ux, uy) || 1; ux /= ln; uy /= ln;
    const d = j.dir < 0 ? -1 : 1;
    return { hx: j.hip.x, hy: j.hip.y, ux, uy, nx: d * -uy, ny: d * ux, ln, d,
      x(u, n) { return this.hx + this.ux * u + this.nx * n; }, y(u, n) { return this.hy + this.uy * u + this.ny * n; } };
  }
  const P = (F, u, n) => [F.x(u, n), F.y(u, n)];
  function poly(ctx, F, pts) { ctx.beginPath(); pts.forEach(([u, n], i) => (i ? ctx.lineTo(F.x(u, n), F.y(u, n)) : ctx.moveTo(F.x(u, n), F.y(u, n)))); ctx.closePath(); }
  function headFrame(ctx, j) { const h = j.head; ctx.translate(h.x, h.y); ctx.rotate(j.hang + HP); ctx.scale(j.dir, 1); }
  // a shoulder plate hangs: halfway between the upper arm's direction and straight down
  function hang(sh, el) {
    let dx = el.x - sh.x, dy = el.y - sh.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    let ux = dx * 0.45, uy = dy * 0.45 + 0.55; const l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l;
    return { ux, uy, nx: -uy, ny: ux };
  }
  const sway = (k, a) => Math.sin(now() * k) * a;
  const LINE = '#0b0a0c';

  // ---------------------------------------------------------------- shared pieces
  // lacquered lames (overlapping plates) with lacing: a panel from (u0 → u1) × (n0 → n1) in frame F, `rows` lames
  function lames(ctx, F, u0, u1, n0, n1, rows, M, flare = 0) {
    for (let i = 0; i < rows; i++) {
      const a = u0 + (u1 - u0) * (i / rows), b = u0 + (u1 - u0) * ((i + 1) / rows) + (u1 > u0 ? 0.8 : -0.8), f = flare * ((i + 1) / rows);
      poly(ctx, F, [[a, n0 - f * 0.4], [a, n1 + f * 0.6], [b, n1 + f], [b, n0 - f]]);
      const g = ctx.createLinearGradient(F.x(a, n0), F.y(a, n0), F.x(b, n1), F.y(b, n1));
      g.addColorStop(0, M.hi); g.addColorStop(0.5, M.base); g.addColorStop(1, M.dark);
      ctx.fillStyle = g; ctx.strokeStyle = LINE; ctx.lineWidth = 1.1; ctx.fill(); ctx.stroke();
      // lacing (odoshi): short vertical cords across the lame
      ctx.strokeStyle = M.lace; ctx.lineWidth = 1.2;
      ctx.beginPath();
      const w = n1 - n0 + f * 1.6, k = Math.max(3, Math.round(Math.abs(w) / 4.5));
      for (let s = 0; s <= k; s++) { const n = n0 - f * 0.4 + (w * s) / k; ctx.moveTo(F.x(a + (b - a) * 0.15, n), F.y(a + (b - a) * 0.15, n)); ctx.lineTo(F.x(b - (b - a) * 0.1, n), F.y(b - (b - a) * 0.1, n)); }
      ctx.stroke();
      if (M.rivet) { ctx.fillStyle = M.rivet; for (let s = 0; s <= k; s += 2) { const n = n0 + (n1 - n0) * (s / k); ctx.beginPath(); ctx.arc(F.x(a + (b - a) * 0.5, n), F.y(a + (b - a) * 0.5, n), 0.6, 0, TAU); ctx.fill(); } }
    }
  }
  // a big shoulder plate (sode) of `rows` lames hanging from the shoulder
  function sodePlate(ctx, sh, el, M, rows, len, w0, w1, dim, round) {
    const H = hang(sh, el), F = { x: (u, n) => sh.x + H.ux * u + H.nx * n, y: (u, n) => sh.y + H.uy * u + H.ny * n };
    ctx.save();
    if (dim) ctx.globalAlpha = 0.85;
    for (let i = 0; i < rows; i++) {
      const a = -3 + (len * i) / rows, b = -3 + (len * (i + 1)) / rows + 1, wa = w0 + (w1 - w0) * (i / rows), wb = w0 + (w1 - w0) * ((i + 1) / rows);
      ctx.beginPath();
      ctx.moveTo(F.x(a, -wa), F.y(a, -wa)); ctx.lineTo(F.x(a, wa), F.y(a, wa));
      ctx.lineTo(F.x(b, wb), F.y(b, wb));
      if (round && i === rows - 1) ctx.quadraticCurveTo(F.x(b + 6, 0), F.y(b + 6, 0), F.x(b, -wb), F.y(b, -wb));
      else ctx.lineTo(F.x(b, -wb), F.y(b, -wb));
      ctx.closePath();
      ctx.fillStyle = dim ? M.dark : i % 2 ? M.base : M.hi; ctx.strokeStyle = LINE; ctx.lineWidth = 1.1; ctx.fill(); ctx.stroke();
      if (dim) continue;
      ctx.strokeStyle = M.lace; ctx.lineWidth = 1.1; ctx.beginPath();
      for (let s = -2; s <= 2; s++) { const n = (wa * s) / 2.6; ctx.moveTo(F.x(a + 1.2, n), F.y(a + 1.2, n)); ctx.lineTo(F.x(b - 1.2, n * (wb / wa)), F.y(b - 1.2, n * (wb / wa))); }
      ctx.stroke();
    }
    // the top edge (kanmuri-ita) in metal
    ctx.strokeStyle = dim ? M.dark : M.metal; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(F.x(-3, -w0 - 0.5), F.y(-3, -w0 - 0.5)); ctx.lineTo(F.x(-3, w0 + 0.5), F.y(-3, w0 + 0.5)); ctx.stroke();
    ctx.restore();
  }
  // helmet bowl (hachi) in the head frame: ridged lacquer dome, a brim (mabizashi), a flared neck guard (shikoro)
  function bowl(ctx, M, o = {}) {
    const top = o.tall || 1;
    // shikoro: three flaring lames behind and below
    for (let i = 2; i >= 0; i--) {
      ctx.beginPath();
      ctx.moveTo(-R * 0.1, -R * 0.35 + i * 1.5);
      ctx.quadraticCurveTo(-R * (1.2 + i * 0.12), -R * 0.25 + i * 2, -R * (1.35 + i * 0.28), R * (0.35 + i * 0.3));
      ctx.lineTo(-R * (0.95 + i * 0.2), R * (0.5 + i * 0.3));
      ctx.quadraticCurveTo(-R * 0.6, R * 0.05 + i * 2, -R * 0.05, R * 0.05 + i * 1.5);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? M.base : M.hi; ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = M.lace; ctx.lineWidth = 1; ctx.beginPath();
      for (let s = 0; s < 4; s++) { const t = 0.25 + s * 0.2; ctx.moveTo(-R * (0.2 + t * (1.0 + i * 0.25)), -R * 0.28 + i * 1.8 + t * 3); ctx.lineTo(-R * (0.2 + t * (1.0 + i * 0.25)) - 1, R * (0.25 + i * 0.3) - (1 - t) * 3); }
      ctx.stroke();
    }
    // the dome
    const g = ctx.createLinearGradient(R * 0.6, -R * 1.5 * top, -R * 0.8, R * 0.2);
    g.addColorStop(0, M.hi); g.addColorStop(0.5, M.base); g.addColorStop(1, M.dark);
    ctx.beginPath();
    ctx.moveTo(-R * 1.12, -2);
    ctx.bezierCurveTo(-R * 1.15, -R * 1.25 * top, R * 1.1, -R * 1.3 * top, R * 1.12, -2.5);
    ctx.closePath();
    ctx.fillStyle = g; ctx.strokeStyle = LINE; ctx.lineWidth = 1.4; ctx.fill(); ctx.stroke();
    if (o.ridges !== false) {
      ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 0.8; ctx.beginPath();
      for (let i = -3; i <= 3; i++) { ctx.moveTo(i * R * 0.3, -2.4); ctx.quadraticCurveTo(i * R * 0.18, -R * 0.9 * top, i * R * 0.02, -R * 1.08 * top); }
      ctx.stroke();
      ctx.strokeStyle = M.shine; ctx.lineWidth = 0.6; ctx.beginPath();
      for (let i = -3; i <= 3; i++) { ctx.moveTo(i * R * 0.3 + 0.9, -2.7); ctx.quadraticCurveTo(i * R * 0.18 + 0.7, -R * 0.9 * top, i * R * 0.02 + 0.4, -R * 1.05 * top); }
      ctx.stroke();
    }
    // the brim over the eyes
    ctx.beginPath(); ctx.moveTo(-R * 0.3, -3.6); ctx.quadraticCurveTo(R * 0.7, -4.8, R * 1.45, -2.2); ctx.lineTo(R * 1.35, -0.8); ctx.quadraticCurveTo(R * 0.6, -2.8, -R * 0.3, -2);
    ctx.closePath(); ctx.fillStyle = M.dark; ctx.strokeStyle = LINE; ctx.lineWidth = 1.1; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = M.metal; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-R * 0.25, -3.9); ctx.quadraticCurveTo(R * 0.7, -5.1, R * 1.42, -2.5); ctx.stroke();
    // the top ornament (tehen)
    if (o.tehen !== false) { ctx.fillStyle = M.metal; ctx.strokeStyle = LINE; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(-R * 0.05, -R * 1.02 * top, 2.2, 1.2, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  }
  // fukigaeshi: the turned-back wing at the temple, with a small crest
  function turnback(ctx, M, crest) {
    ctx.beginPath(); ctx.moveTo(R * 0.05, -3.4); ctx.lineTo(R * 0.78, -4.2); ctx.quadraticCurveTo(R * 0.95, 0.2, R * 0.35, 2.4); ctx.quadraticCurveTo(R * 0.05, -0.5, R * 0.05, -3.4);
    ctx.closePath(); ctx.fillStyle = M.base; ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = M.metal; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(R * 0.12, -3.3); ctx.lineTo(R * 0.75, -4.0); ctx.stroke();
    if (crest) { ctx.fillStyle = M.metal; ctx.beginPath(); ctx.arc(R * 0.46, -1.2, 1.8, 0, TAU); ctx.fill(); ctx.fillStyle = M.dark; ctx.beginPath(); ctx.arc(R * 0.46, -1.2, 0.8, 0, TAU); ctx.fill(); }
  }

  // ================================================================ A: 将軍 Ō-yoroi — the lacquered great armour
  // Black lacquer and indigo lacing, a gold sun-disc crest, a black half-mask with a white moustache, big square
  // shoulder boards, a breastplate and hanging tassets.
  const A = { hi: '#3a3b44', base: '#1b1c22', dark: '#0c0c10', lace: '#3456b8', metal: '#d7a73c', shine: 'rgba(210,220,255,.28)', rivet: '#d7a73c' };
  const shogunA = {
    back(ctx, j) { /* no cape */ },
    backArm(ctx, j) { sodePlate(ctx, { x: j.sh.x - 3, y: j.sh.y + 1 }, j.elB, A, 5, 26, 10, 12, true); },
    body(ctx, j) {
      const F = torso(j);
      // dō: the breastplate over the chest and belly, with lacing rows and a gilt top plate
      poly(ctx, F, [[10, -12], [10, 14.5], [30, 16.5], [47, 15], [52, 7], [52, -9], [46, -13.5], [26, -13]]);
      const g = ctx.createLinearGradient(F.x(50, 14), F.y(50, 14), F.x(10, -12), F.y(10, -12));
      g.addColorStop(0, A.hi); g.addColorStop(0.45, A.base); g.addColorStop(1, A.dark);
      ctx.fillStyle = g; ctx.strokeStyle = LINE; ctx.lineWidth = 1.4; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = A.lace; ctx.lineWidth = 1.3; ctx.beginPath();
      for (const u of [16, 22, 28, 34]) for (let n = -10; n <= 14; n += 4) { ctx.moveTo(F.x(u - 2, n), F.y(u - 2, n)); ctx.lineTo(F.x(u + 2, n), F.y(u + 2, n)); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 0.9; ctx.beginPath();
      for (const u of [19, 25, 31, 37]) { ctx.moveTo(F.x(u, -11.5), F.y(u, -11.5)); ctx.lineTo(F.x(u, 15.8), F.y(u, 15.8)); }
      ctx.stroke();
      poly(ctx, F, [[40, -11], [40, 15.5], [47, 15], [52, 7], [52, -9], [46, -12.5]]);
      ctx.fillStyle = A.metal; ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 1.1; ctx.stroke();
      ctx.fillStyle = A.dark; ctx.beginPath(); ctx.arc(F.x(45, 6), F.y(45, 6), 2.4, 0, TAU); ctx.fill();
      // the cord of the breastplate
      ctx.strokeStyle = '#c93a2e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(F.x(40, 12), F.y(40, 12)); ctx.quadraticCurveTo(F.x(36, 18), F.y(36, 18), F.x(33, 16), F.y(33, 16)); ctx.stroke();
    },
    hem(ctx, j) {
      const F = torso(j);
      // kusazuri: two layers of hanging tassets over the hips and thighs
      lames(ctx, F, 10, -24, -13, 3, 4, A, 3);
      lames(ctx, F, 9, -22, 1, 17, 4, A, 4);
    },
    front(ctx, j) { sodePlate(ctx, j.sh, j.elF, A, 5, 27, 10.5, 12.5, false); },
    head(ctx, j) {
      ctx.save(); headFrame(ctx, j);
      bowl(ctx, A);
      turnback(ctx, A, true);
      // menpō: the black lacquer half mask with a nose, a white moustache and a throat guard
      ctx.beginPath(); ctx.moveTo(R * 0.05, 0.6); ctx.quadraticCurveTo(R * 0.8, 0.2, R * 1.15, 1.4); ctx.lineTo(R * 1.25, 3.4); ctx.lineTo(R * 1.05, 4.2);
      ctx.quadraticCurveTo(R * 1.12, 8.6, R * 0.75, 11.4); ctx.quadraticCurveTo(R * 0.3, 12.6, R * 0.0, 10.4); ctx.closePath();
      const mg = ctx.createLinearGradient(R, 0, 0, R); mg.addColorStop(0, A.hi); mg.addColorStop(1, A.dark);
      ctx.fillStyle = mg; ctx.strokeStyle = LINE; ctx.lineWidth = 1.2; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#efe9dc'; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.beginPath();
      for (let s = 0; s < 4; s++) { ctx.moveTo(R * 1.02, 5 + s * 0.6); ctx.quadraticCurveTo(R * 0.8, 6.5 + s * 0.9, R * (0.45 - s * 0.05), 6.2 + s * 1.2); }
      ctx.stroke();
      ctx.strokeStyle = A.metal; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(R * 0.95, 9.3); ctx.lineTo(R * 0.6, 9.6); ctx.stroke();
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(R * (0.05 - i * 0.05), 10.4 + i * 2.3); ctx.lineTo(R * (0.85 - i * 0.12), 11.6 + i * 2.3); ctx.lineTo(R * (0.8 - i * 0.12), 13.6 + i * 2.3); ctx.lineTo(R * (0.0 - i * 0.05), 12.6 + i * 2.3); ctx.closePath(); ctx.fillStyle = i % 2 ? A.base : A.hi; ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 0.9; ctx.stroke(); }
      // maedate: the golden sun disc on a stem above the brim
      ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(R * 0.72, -R * 0.62); ctx.lineTo(R * 0.8, -R * 1.05); ctx.stroke();
      ctx.strokeStyle = A.metal; ctx.lineWidth = 1.6; ctx.stroke();
      const cx = R * 0.82, cy = -R * 1.62, rr = R * 0.72;
      const sg = ctx.createRadialGradient(cx - rr * 0.35, cy - rr * 0.35, 1, cx, cy, rr);
      sg.addColorStop(0, '#fff1b8'); sg.addColorStop(0.45, '#e6b848'); sg.addColorStop(1, '#8c5f14');
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.fillStyle = sg; ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(120,70,10,.55)'; ctx.lineWidth = 0.7; ctx.beginPath();
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.moveTo(cx + Math.cos(a) * rr * 0.32, cy + Math.sin(a) * rr * 0.32); ctx.lineTo(cx + Math.cos(a) * rr * 0.86, cy + Math.sin(a) * rr * 0.86); }
      ctx.stroke();
      ctx.fillStyle = '#b42a1e'; ctx.beginPath(); ctx.arc(cx, cy, rr * 0.3, 0, TAU); ctx.fill();
      ctx.restore();
    },
  };

  // ================================================================ B: 陣羽織 Jinbaori — the commander's war coat
  // An ivory sleeveless war coat with a black hem, a turned-back gold collar and a large family crest, a skirt that
  // flares over the legs; a tall swept-back helmet with a long silver crescent moon. No mask: the face shows.
  const B = { coat: '#e9e1cc', coatHi: '#fffaf0', coatDk: '#b9ae93', hem: '#1a1714', collar: '#d4a23a', mon: '#15120f' };
  const BH = { hi: '#4a4d57', base: '#25272e', dark: '#101115', lace: '#6b1f2a', metal: '#d8dde6', shine: 'rgba(230,236,255,.3)' };
  function monCrest(ctx, x, y, r) {
    // three-comma tomoe in a ring
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = B.mon; ctx.lineWidth = r * 0.14; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.fillStyle = B.mon;
    for (let i = 0; i < 3; i++) {
      ctx.rotate(TAU / 3); ctx.beginPath(); ctx.arc(r * 0.32, 0, r * 0.3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(r * 0.6, 0); ctx.quadraticCurveTo(r * 0.55, r * 0.55, 0, r * 0.62); ctx.quadraticCurveTo(r * 0.3, r * 0.25, r * 0.05, 0); ctx.fill();
    }
    ctx.restore();
  }
  const shogunB = {
    back(ctx, j) {
      const F = torso(j), s = sway(2.1, 2.5);
      // the coat's back panel, down to the knees, flaring and slit
      poly(ctx, F, [[54, -9], [50, -15], [20, -16], [-6, -19 + s], [-40, -25 + s * 1.5], [-43, -9 + s], [-30, -6], [-12, -10], [10, -10]]);
      const g = ctx.createLinearGradient(F.x(50, -15), F.y(50, -15), F.x(-40, -25), F.y(-40, -25));
      g.addColorStop(0, B.coatDk); g.addColorStop(1, '#8f866e');
      ctx.fillStyle = g; ctx.strokeStyle = LINE; ctx.lineWidth = 1.3; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = B.hem; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(F.x(-40, -25 + s * 1.5), F.y(-40, -25 + s * 1.5)); ctx.lineTo(F.x(-43, -9 + s), F.y(-43, -9 + s)); ctx.stroke();
    },
    backArm() {},
    body(ctx, j) {
      const F = torso(j);
      // the coat over the torso (open at the front: the chest shows), with winged shoulders
      poly(ctx, F, [[58, -12], [59, 4], [54, 16], [46, 11], [30, 8], [12, 6], [4, -13], [30, -15.5], [50, -15]]);
      const g = ctx.createLinearGradient(F.x(56, 10), F.y(56, 10), F.x(8, -12), F.y(8, -12));
      g.addColorStop(0, B.coatHi); g.addColorStop(0.55, B.coat); g.addColorStop(1, B.coatDk);
      ctx.fillStyle = g; ctx.strokeStyle = LINE; ctx.lineWidth = 1.4; ctx.fill(); ctx.stroke();
      // the open front edge in black, the turned-back gold collar
      ctx.strokeStyle = B.hem; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(F.x(54, 16), F.y(54, 16)); ctx.lineTo(F.x(46, 11), F.y(46, 11)); ctx.lineTo(F.x(30, 8), F.y(30, 8)); ctx.lineTo(F.x(12, 6), F.y(12, 6)); ctx.stroke();
      poly(ctx, F, [[62, -6], [63, 6], [55, 13], [52, 4], [55, -8]]);
      ctx.fillStyle = B.collar; ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 1.1; ctx.stroke();
      // the crest on the side panel
      monCrest(ctx, F.x(38, -5), F.y(38, -5), 6.5);
      // folds
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(F.x(28, -12), F.y(28, -12)); ctx.lineTo(F.x(10, -10), F.y(10, -10)); ctx.moveTo(F.x(24, 4), F.y(24, 4)); ctx.lineTo(F.x(8, 3), F.y(8, 3)); ctx.stroke();
    },
    hem(ctx, j) {
      const F = torso(j), s = sway(2.1, 2.5);
      // the skirt over the near leg: flares wide, black hem band
      poly(ctx, F, [[8, 7], [8, -12], [-12, -15 + s], [-38, -20 + s * 1.4], [-40, 2 + s], [-36, 16 + s * 0.8], [-12, 12]]);
      const g = ctx.createLinearGradient(F.x(6, 0), F.y(6, 0), F.x(-38, 0), F.y(-38, 0));
      g.addColorStop(0, B.coat); g.addColorStop(1, B.coatDk);
      ctx.fillStyle = g; ctx.strokeStyle = LINE; ctx.lineWidth = 1.3; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = B.hem; ctx.lineWidth = 3.4; ctx.beginPath();
      ctx.moveTo(F.x(-37, -19 + s * 1.4), F.y(-37, -19 + s * 1.4)); ctx.lineTo(F.x(-39.5, 2 + s), F.y(-39.5, 2 + s)); ctx.lineTo(F.x(-35.5, 15.5 + s * 0.8), F.y(-35.5, 15.5 + s * 0.8)); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1; ctx.beginPath();
      for (const n of [-8, 0, 8]) { ctx.moveTo(F.x(2, n), F.y(2, n)); ctx.lineTo(F.x(-34, n * 1.3 + s), F.y(-34, n * 1.3 + s)); }
      ctx.stroke();
      // the sash knot at the waist
      ctx.fillStyle = B.collar; ctx.beginPath(); ctx.ellipse(F.x(9, 6), F.y(9, 6), 3.2, 2.2, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 0.9; ctx.stroke();
    },
    front() {},
    head(ctx, j) {
      ctx.save(); headFrame(ctx, j);
      // eboshi-nari: a tall helmet swept back to a point
      ctx.beginPath(); ctx.moveTo(-R * 0.3, R * 0.2); ctx.quadraticCurveTo(-R * 1.5, -R * 0.1, -R * 1.25, R * 0.55); ctx.lineTo(-R * 0.6, R * 0.5); ctx.quadraticCurveTo(-R * 0.35, R * 0.3, -R * 0.1, R * 0.4);
      ctx.fillStyle = BH.base; ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.fill(); ctx.stroke();
      const g = ctx.createLinearGradient(R * 0.5, -R * 2.2, -R, 0);
      g.addColorStop(0, BH.hi); g.addColorStop(0.5, BH.base); g.addColorStop(1, BH.dark);
      ctx.beginPath(); ctx.moveTo(-R * 1.1, -1.5);
      ctx.bezierCurveTo(-R * 1.25, -R * 1.2, -R * 1.2, -R * 2.3, -R * 1.9, -R * 2.75);
      ctx.bezierCurveTo(-R * 0.6, -R * 2.6, R * 1.2, -R * 1.6, R * 1.12, -2.5);
      ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.strokeStyle = BH.shine; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(R * 0.6, -R * 0.9); ctx.quadraticCurveTo(-R * 0.3, -R * 1.9, -R * 1.6, -R * 2.55); ctx.stroke();
      ctx.fillStyle = BH.metal; ctx.fillRect(-R * 1.12, -3.6, R * 2.3, 1.8);
      ctx.beginPath(); ctx.moveTo(-R * 0.3, -3.6); ctx.quadraticCurveTo(R * 0.7, -4.6, R * 1.4, -2.3); ctx.lineTo(R * 1.3, -1); ctx.quadraticCurveTo(R * 0.6, -2.8, -R * 0.3, -2);
      ctx.closePath(); ctx.fillStyle = BH.dark; ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.stroke();
      turnback(ctx, BH, false);
      // maedate: a long thin crescent moon, swept up and back across the brow
      const cg = ctx.createLinearGradient(R * 2.2, -R * 2.6, -R * 1.2, -R * 1.8);
      cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.5, '#c7ced9'); cg.addColorStop(1, '#7f8896');
      ctx.beginPath();
      ctx.moveTo(-R * 1.25, -R * 2.05);
      ctx.bezierCurveTo(-R * 0.2, -R * 0.55, R * 1.6, -R * 0.6, R * 2.35, -R * 2.75);
      ctx.bezierCurveTo(R * 1.5, -R * 1.25, -R * 0.05, -R * 1.05, -R * 1.25, -R * 2.05);
      ctx.closePath(); ctx.fillStyle = cg; ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = BH.metal; ctx.beginPath(); ctx.arc(R * 0.62, -R * 0.78, 2, 0, TAU); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 0.8; ctx.stroke();
      // a chin cord
      ctx.strokeStyle = '#6b1f2a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(R * 0.25, 1.5); ctx.quadraticCurveTo(R * 0.55, R * 0.95, R * 0.9, R * 0.8); ctx.stroke();
      ctx.restore();
    },
  };

  // ================================================================ C: 鹿角 Kazuno — the antlered warlord
  // A round black helmet with great gilt deer antlers and a flowing white yak-hair mane (shaguma), a gold lacquer
  // half-mask with a fierce brow, small rounded iron shoulder plates and a crimson horo: the war cloak that billows
  // behind the back like a sail.
  const Cm = { hi: '#50535c', base: '#2a2c32', dark: '#131418', lace: '#b8312a', metal: '#e0b24a', shine: 'rgba(255,240,210,.25)' };
  const HORO = { hi: '#e0463a', base: '#a51f1b', dark: '#5c0c0b', band: '#f2e6c8' };
  const shogunC = {
    back(ctx, j) {
      const F = torso(j), s = sway(1.6, 3);
      // the horo: a billowing cloak filled with wind, tied at the shoulders and the waist
      ctx.beginPath();
      ctx.moveTo(F.x(54, -8), F.y(54, -8));
      ctx.bezierCurveTo(F.x(70, -40 + s), F.y(70, -40 + s), F.x(10, -52 - s), F.y(10, -52 - s), F.x(4, -12), F.y(4, -12));
      ctx.bezierCurveTo(F.x(18, -24), F.y(18, -24), F.x(40, -22), F.y(40, -22), F.x(54, -8), F.y(54, -8));
      ctx.closePath();
      const g = ctx.createRadialGradient(F.x(40, -30), F.y(40, -30), 2, F.x(30, -28), F.y(30, -28), 32);
      g.addColorStop(0, HORO.hi); g.addColorStop(0.6, HORO.base); g.addColorStop(1, HORO.dark);
      ctx.fillStyle = g; ctx.strokeStyle = LINE; ctx.lineWidth = 1.4; ctx.fill(); ctx.stroke();
      // bands across the cloak (inside its outline)
      ctx.save(); ctx.clip();
      ctx.strokeStyle = HORO.band; ctx.lineWidth = 1.6; ctx.beginPath();
      for (const t of [0.3, 0.55, 0.78]) {
        const u = 54 - t * 50;
        ctx.moveTo(F.x(u, -10), F.y(u, -10)); ctx.quadraticCurveTo(F.x(u + 6, -36 - s * t), F.y(u + 6, -36 - s * t), F.x(u - 4, -60), F.y(u - 4, -60));
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(F.x(50, -12), F.y(50, -12)); ctx.bezierCurveTo(F.x(40, -24), F.y(40, -24), F.x(18, -26), F.y(18, -26), F.x(6, -14), F.y(6, -14)); ctx.stroke();
      ctx.restore();
      // the mane falling behind the shoulders (drawn with the head later: the rest of it)
    },
    backArm(ctx, j) { sodePlate(ctx, { x: j.sh.x - 3, y: j.sh.y + 1 }, j.elB, Cm, 3, 18, 8.5, 9.5, true, true); },
    body(ctx, j) {
      const F = torso(j);
      // a plain black cuirass with a red lacing band
      poly(ctx, F, [[14, -12], [14, 14], [44, 15], [50, 6], [50, -9], [44, -13]]);
      const g = ctx.createLinearGradient(F.x(48, 12), F.y(48, 12), F.x(14, -12), F.y(14, -12));
      g.addColorStop(0, Cm.hi); g.addColorStop(0.5, Cm.base); g.addColorStop(1, Cm.dark);
      ctx.fillStyle = g; ctx.strokeStyle = LINE; ctx.lineWidth = 1.3; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = Cm.lace; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(F.x(24, -11.5), F.y(24, -11.5)); ctx.lineTo(F.x(24, 14.5), F.y(24, 14.5)); ctx.stroke();
      ctx.strokeStyle = Cm.metal; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(F.x(44, -12.5), F.y(44, -12.5)); ctx.lineTo(F.x(44, 14.5), F.y(44, 14.5)); ctx.stroke();
      // the cords of the horo over the shoulder
      ctx.strokeStyle = HORO.band; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(F.x(54, -8), F.y(54, -8)); ctx.quadraticCurveTo(F.x(48, 4), F.y(48, 4), F.x(40, 13), F.y(40, 13)); ctx.stroke();
    },
    hem(ctx, j) { const F = torso(j); lames(ctx, F, 13, -16, -12, 14, 3, Cm, 2); },
    front(ctx, j) { sodePlate(ctx, j.sh, j.elF, Cm, 3, 19, 9, 10, false, true); },
    head(ctx, j) {
      ctx.save(); headFrame(ctx, j);
      // the shaguma: a white mane from the crown down the back (strands move a little)
      const s = sway(1.8, 1.4);
      ctx.fillStyle = '#e9e4d8'; ctx.strokeStyle = LINE; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-R * 0.2, -R * 1.05);
      ctx.bezierCurveTo(-R * 1.8, -R * 1.1, -R * 2.6 + s, R * 0.6, -R * 2.2 + s, R * 2.4);
      ctx.bezierCurveTo(-R * 1.6 + s, R * 1.4, -R * 1.3, R * 0.8, -R * 0.4, R * 0.3);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,110,95,.6)'; ctx.lineWidth = 0.8; ctx.beginPath();
      for (let i = 0; i < 6; i++) { const t = i / 5; ctx.moveTo(-R * (0.4 + t * 0.6), -R * (0.9 - t * 0.5)); ctx.quadraticCurveTo(-R * (1.6 + t * 0.4) + s, R * (0.2 + t * 0.4), -R * (2.0 - t * 0.2) + s, R * (1.8 + t * 0.4)); }
      ctx.stroke();
      bowl(ctx, Cm, { ridges: false, tehen: false });
      turnback(ctx, Cm, true);
      // the gold half-mask with a fierce brow and teeth
      ctx.beginPath(); ctx.moveTo(R * 0.1, 0.2); ctx.quadraticCurveTo(R * 0.8, -0.6, R * 1.2, 0.9); ctx.lineTo(R * 1.3, 3.2); ctx.lineTo(R * 1.08, 4.4);
      ctx.quadraticCurveTo(R * 1.15, 8.2, R * 0.78, 10.8); ctx.quadraticCurveTo(R * 0.3, 11.9, R * 0.05, 9.8); ctx.closePath();
      const mg = ctx.createLinearGradient(R * 1.2, 0, 0, R); mg.addColorStop(0, '#ffe39a'); mg.addColorStop(0.5, '#d6a23a'); mg.addColorStop(1, '#7e5412');
      ctx.fillStyle = mg; ctx.strokeStyle = LINE; ctx.lineWidth = 1.2; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f7f3ea'; ctx.fillRect(R * 0.55, 6.2, R * 0.5, 1.6);
      ctx.strokeStyle = LINE; ctx.lineWidth = 0.6; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(R * (0.62 + k * 0.1), 6.2); ctx.lineTo(R * (0.62 + k * 0.1), 7.8); } ctx.stroke();
      ctx.strokeStyle = '#6a3c08'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(R * 0.55, 1.6); ctx.lineTo(R * 1.1, 2.6); ctx.stroke();
      // the deer antlers: two gilt branching horns rising from the brow
      const antler = (ox, sc, alpha) => {
        ctx.save(); ctx.globalAlpha = alpha; ctx.translate(ox, -R * 0.7); ctx.scale(sc, sc);
        ctx.lineCap = 'round';
        const path = () => {
          ctx.beginPath();
          ctx.moveTo(0, 0); ctx.bezierCurveTo(R * 0.2, -R * 1.4, -R * 0.8, -R * 2.2, -R * 0.6, -R * 3.3);
          ctx.moveTo(-R * 0.05, -R * 1.0); ctx.quadraticCurveTo(R * 0.6, -R * 1.6, R * 0.9, -R * 2.3);
          ctx.moveTo(-R * 0.45, -R * 1.9); ctx.quadraticCurveTo(R * 0.1, -R * 2.6, R * 0.2, -R * 3.2);
          ctx.moveTo(-R * 0.62, -R * 2.6); ctx.quadraticCurveTo(-R * 1.3, -R * 2.9, -R * 1.5, -R * 3.4);
        };
        path(); ctx.strokeStyle = LINE; ctx.lineWidth = 5; ctx.stroke();
        path(); const ag = ctx.createLinearGradient(0, 0, -R * 0.4, -R * 3.3); ag.addColorStop(0, '#8a5d12'); ag.addColorStop(0.5, '#e7b94a'); ag.addColorStop(1, '#fff0b8');
        ctx.strokeStyle = ag; ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();
      };
      antler(-R * 0.25, 0.92, 0.75); // the far antler, a little smaller and in shade
      antler(R * 0.35, 1, 1);
      ctx.restore();
    },
  };

  ND.COSTUMES = { shogun_a: shogunA, shogun_b: shogunB, shogun_c: shogunC };
  // the ids this build can draw (the server catalog's builtin field must be one of them)
  ND.COSTUME_IDS = Object.keys(ND.COSTUMES);
  // ---------------------------------------------------------------- owner's preview switch (not for players)
  // ?costume=shogun_a|shogun_b|shogun_c puts that costume on every fighter (fights, fighter select, the menu demo);
  // ?costume=none (or the costume-test/ preview folder) only shows the toggle. Honoured ONLY on our own preview site
  // (*.github.io) and on localhost, and only when the game is not running on a portal (CrazyGames, Yandex, Playgama,
  // Poki: ND.portalName); it draws, it never grants anything (ownership stays with the server). On the fighter select
  // screen a small corner toggle switches between the concepts.
  const PV = (() => {
    let host = '', path = '', q = null;
    try { host = location.hostname || ''; path = location.pathname || ''; q = new URLSearchParams(location.search || '').get('costume'); } catch (e) { return null; }
    const ours = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host) || /(^|\.)github\.io$/.test(host);
    if (!ours || (ND.portalName && ND.portalName !== 'local')) return null;
    if (q == null && !/\/costume-test\//.test(path)) return null;
    return { id: ND.COSTUMES[q] ? q : null };
  })();
  ND.costumePreview = PV ? { get id() { return PV.id; }, set(id) { setPreview(id); } } : null;
  if (PV && ND.palOf) {
    const base = ND.palOf, cache = new Map();
    ND.palOf = (ch, look) => {
      const p = base(ch, look);
      if (!PV.id || !ch || !p || p.costume === PV.id) return p;
      const k = ch.id + '|' + String(look) + '|' + PV.id;
      let q = cache.get(k);
      if (!q) {
        q = Object.assign({}, p);
        if (p.atlas) Object.defineProperty(q, 'atlas', { value: p.atlas, enumerable: false });
        Object.defineProperty(q, 'costume', { value: PV.id, enumerable: false });
        cache.set(k, q);
      }
      return q;
    };
  }
  function setPreview(id) {
    if (!PV) return;
    PV.id = ND.COSTUMES[id] ? id : null;
    try { const u = new URL(location.href); u.searchParams.set('costume', PV.id || 'none'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) { /* no history */ }
    const G = ND.game;
    try {
      if (G && G.phase === 'select' && G.refreshSelect) G.refreshSelect();
    } catch (e) { /* redraws on the next fight */ }
    syncToggle();
  }
  // the corner toggle on the fighter select screen: Kostüm: A / B / C / yok
  let tog = null;
  function syncToggle() {
    if (!PV || typeof document === 'undefined') return;
    const sel = document.getElementById('select'), app = document.getElementById('app');
    if (!sel || !app) return;
    if (!tog) {
      tog = document.createElement('div');
      tog.id = 'costumeToggle';
      tog.setAttribute('role', 'group');
      tog.style.cssText = 'position:absolute;top:calc(env(safe-area-inset-top,0px) + 8px);right:8px;z-index:40;display:flex;gap:4px;align-items:center;' +
        'padding:4px 6px;background:rgba(8,9,16,.88);border:1px solid #d9b36c;font:600 12px/1 Oswald,sans-serif;letter-spacing:.06em;color:#e8dcc0';
      const lab = document.createElement('span'); lab.textContent = 'Kostüm:'; lab.style.marginRight = '2px'; tog.appendChild(lab);
      for (const [id, t] of [['shogun_a', 'A'], ['shogun_b', 'B'], ['shogun_c', 'C'], [null, 'yok']]) {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = t; b.dataset.id = id || '';
        b.style.cssText = 'min-width:34px;min-height:30px;padding:4px 8px;border:1px solid rgba(217,179,108,.45);background:transparent;color:inherit;font:inherit;cursor:pointer';
        b.onclick = (e) => { e.stopPropagation(); setPreview(id); };
        tog.appendChild(b);
      }
      app.appendChild(tog);
    }
    tog.hidden = sel.hidden;
    for (const b of tog.querySelectorAll('button')) {
      const on = (b.dataset.id || null) === PV.id;
      b.setAttribute('aria-pressed', String(on)); b.style.background = on ? '#d9b36c' : 'transparent'; b.style.color = on ? '#17130a' : 'inherit';
    }
  }
  if (PV) setInterval(syncToggle, 300);

  // one layer of a costume, never an error that stops the fighter's drawing
  ND.costumeLayer = function (id, layer, ctx, j) {
    const K = ND.COSTUMES[id], fn = K && K[layer];
    if (!fn || !j || !j.hip || !j.head) return;
    ctx.save();
    // (a layer that fails half-way may leave its own save() open: the transform is put back by hand)
    const t0 = ctx.getTransform ? ctx.getTransform() : null;
    try { ctx.lineJoin = 'round'; ctx.lineCap = 'round'; fn(ctx, j); } catch (e) { if (ND.costumeDebug) console.warn('[costume]', id, layer, e); if (t0) ctx.setTransform(t0); ctx.globalAlpha = 1; }
    ctx.restore();
  };
})(window.ND);
