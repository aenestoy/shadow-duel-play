// Shadow Duel — the ranked Season Champion costume: a different drawn costume for EACH fighter
// (builtin 'champion' in the reward catalog → ND.COSTUMES['champion_<fighter>']; js/costumes.js has the system).
// Each design grows out of the fighter's own identity (title, weapon, style, colours, kanji) and keeps the fighter
// recognisable (their weapon, hair or mask where it matters), and reads as a prize: ceremonial, rich, clearly special.
// It is not the Monthly Tournament's "Champion colors" (a recolour of the same outfit): these are new shapes.
// A design may bring its own colours (pal) and may keep the fighter's own head (ownHead: hair, mask, helmet stay and the
// costume adds to them). Drawing only: nothing here changes the fight.
// Done: akane, kuro, tetsu, ren (batch 1).
(function (ND) {
  'use strict';
  const K = ND._costumeKit;
  if (!K || !ND.COSTUMES) return;
  const { R, TAU, LINE, torso, poly, headFrame, sway, lames, sodePlate } = K;
  const grad = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([t, c]) => g.addColorStop(t, c)); return g; };
  const fillStroke = (ctx, fill, lw = 1.2) => { ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = lw; ctx.stroke(); };
  // a family crest: a ring with a motif (drawn by fn in a unit circle)
  function crest(ctx, x, y, r, col, bg, fn) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = r * 0.14; ctx.stroke();
    ctx.fillStyle = col; ctx.strokeStyle = col; fn(ctx, r * 0.72);
    ctx.restore();
  }

  // ================================================================ AKANE 茜 — Crimson Blade: the iai grand master
  // Formal kamishimo of an iaidō grand master at a court demonstration: a spotless white kimono, deep crimson hakama,
  // a stiff winged crimson kataginu over the shoulders with her gold crest, gold tasuki cords and a gold kanzashi in
  // her low-tied hair. She keeps her bare face, hair and her sheathed katana.
  const AK = { vest: '#a3141b', vestHi: '#d02a2f', vestDk: '#5f070c', gold: '#e2b547', goldDk: '#8d6417' };
  const akaneCrest = (ctx, r) => { for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); ctx.beginPath(); ctx.ellipse(0, -r * 0.5, r * 0.28, r * 0.46, 0, 0, TAU); ctx.fill(); } };
  const akane = {
    ownHead: true,
    pal: { cloth: '#f2ede3', clothHi: '#fffdf8', clothDark: '#b9b0a2', hakama: '#8f0e16', hakamaDark: '#55070c', accent: AK.gold, accentDark: AK.goldDk },
    back(ctx, j) {
      const F = torso(j);
      // the far wing of the kataginu, behind the body
      poly(ctx, F, [[50, -4], [56, -31], [60, -31], [55, -4]]);
      fillStroke(ctx, AK.vestDk, 1.1);
    },
    body(ctx, j) {
      const F = torso(j);
      // the vest over the chest (it tucks into the hakama at the waist) with pleats
      poly(ctx, F, [[55, -12], [55, 12], [40, 14], [12, 11], [12, -11], [40, -13]]);
      fillStroke(ctx, grad(ctx, F.x(54, 12), F.y(54, 12), F.x(12, -11), F.y(12, -11), [[0, AK.vestHi], [0.5, AK.vest], [1, AK.vestDk]]), 1.3);
      ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1; ctx.beginPath();
      for (const n of [-6, 0, 6]) { ctx.moveTo(F.x(50, n), F.y(50, n)); ctx.lineTo(F.x(14, n * 1.05), F.y(14, n * 1.05)); }
      ctx.stroke();
      // the gold crest on the chest and the gold cords crossing the back (tasuki)
      crest(ctx, F.x(42, 5), F.y(42, 5), 4.4, AK.gold, AK.vestDk, akaneCrest);
      ctx.strokeStyle = AK.gold; ctx.lineWidth = 1.6; ctx.beginPath();
      ctx.moveTo(F.x(54, -11), F.y(54, -11)); ctx.lineTo(F.x(22, 11), F.y(22, 11)); ctx.stroke();
    },
    front(ctx, j) {
      const F = torso(j);
      // the stiff near wing of the kataginu standing out past the shoulder (over the arm), with a gold edge
      poly(ctx, F, [[50, 4], [56, 31], [60, 31], [55, 4]]);
      fillStroke(ctx, grad(ctx, F.x(56, 4), F.y(56, 4), F.x(58, 31), F.y(58, 31), [[0, AK.vest], [1, AK.vestHi]]), 1.1);
      ctx.strokeStyle = AK.gold; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(F.x(59.4, 6), F.y(59.4, 6)); ctx.lineTo(F.x(59.4, 30.5), F.y(59.4, 30.5)); ctx.stroke();
    },
    head(ctx, j) {
      ctx.save(); headFrame(ctx, j);
      // the gold kanzashi across the tied hair, with a hanging string of beads
      ctx.strokeStyle = LINE; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(-R * 1.25, -R * 0.55); ctx.lineTo(-R * 0.05, -R * 1.05); ctx.stroke();
      ctx.strokeStyle = AK.gold; ctx.lineWidth = 1.8; ctx.stroke();
      crest(ctx, -R * 0.2, -R * 1.0, 2.8, AK.gold, AK.vest, akaneCrest);
      ctx.fillStyle = AK.gold;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-R * 1.15 - i * 0.4, -R * 0.4 + i * 3, 0.95, 0, TAU); ctx.fill(); }
      ctx.fillStyle = AK.vestHi; ctx.beginPath(); ctx.arc(-R * 1.15 - 1.6, -R * 0.4 + 12, 1.4, 0, TAU); ctx.fill();
      ctx.restore();
    },
    hem(ctx, j) {
      const F = torso(j);
      // the gold hakama tie at the front and its cord ends
      ctx.fillStyle = AK.gold; ctx.strokeStyle = LINE; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.ellipse(F.x(9, 11), F.y(9, 11), 3, 2, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = AK.gold; ctx.lineWidth = 1.4; ctx.beginPath();
      ctx.moveTo(F.x(9, 11), F.y(9, 11)); ctx.lineTo(F.x(-6, 15 + sway(2, 1)), F.y(-6, 15 + sway(2, 1)));
      ctx.moveTo(F.x(9, 11), F.y(9, 11)); ctx.lineTo(F.x(-3, 18 + sway(2.3, 1)), F.y(-3, 18 + sway(2.3, 1))); ctx.stroke();
    },
  };

  // ================================================================ KURO 黒 — Black Mountain: the mountain warlord
  // The lord of the black peaks: a huge black-lacquered war hat (jingasa, his straw kasa made a warlord's) with a gold
  // rim and a snow-capped mountain crest, a shaggy bear-fur mantle over the shoulders, heavy black armour laced in his
  // violet, broad shoulder boards. The long nodachi stays.
  const KU = { lac: '#16161b', lacHi: '#3a3a46', lacDk: '#08080a', gold: '#d2a441', fur: '#2d2219', furHi: '#5a4633', furDk: '#140e09', snow: '#eef2f8' };
  const KUA = { hi: '#34343e', base: '#1a1a20', dark: '#0b0b0e', lace: '#8b6fd6', metal: '#d2a441', shine: 'rgba(200,190,255,.25)', rivet: '#d2a441' };
  function fur(ctx, pts, fill) {
    // a shaggy outline: every segment gets small tufts
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
      if (!i) ctx.moveTo(x0, y0);
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 5));
      for (let k = 1; k <= n; k++) {
        const t = k / n, mx = x0 + (x1 - x0) * (t - 0.5 / n), my = y0 + (y1 - y0) * (t - 0.5 / n), nx = -(y1 - y0) / Math.hypot(x1 - x0, y1 - y0) * 2.6, ny = (x1 - x0) / Math.hypot(x1 - x0, y1 - y0) * 2.6;
        ctx.quadraticCurveTo(mx + nx, my + ny, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
      }
    }
    ctx.closePath(); fillStroke(ctx, fill, 1.1);
  }
  const kuro = {
    pal: { accent: '#9d7cf0', accentDark: '#4a3585' },
    back(ctx, j) {
      const F = torso(j), s = sway(1.4, 1.5);
      // the bear-fur mantle hanging behind the shoulders
      const pts = [[58, -4], [57, -16], [40, -22 + s], [22, -20 + s], [18, -12], [36, -9], [50, -6]].map(([u, n]) => [F.x(u, n), F.y(u, n)]);
      fur(ctx, pts, grad(ctx, F.x(56, -10), F.y(56, -10), F.x(20, -20), F.y(20, -20), [[0, KU.furHi], [0.5, KU.fur], [1, KU.furDk]]));
    },
    backArm(ctx, j) { sodePlate(ctx, { x: j.sh.x - 3, y: j.sh.y + 1 }, j.elB, KUA, 5, 28, 11, 13.5, true); },
    body(ctx, j) {
      const F = torso(j);
      // heavy black cuirass laced in violet, a gilt top plate
      poly(ctx, F, [[10, -12.5], [10, 15], [46, 16.5], [52, 7], [52, -10], [44, -14]]);
      fillStroke(ctx, grad(ctx, F.x(50, 14), F.y(50, 14), F.x(10, -12), F.y(10, -12), [[0, KUA.hi], [0.5, KUA.base], [1, KUA.dark]]), 1.4);
      ctx.strokeStyle = KUA.lace; ctx.lineWidth = 1.4; ctx.beginPath();
      for (const u of [16, 23, 30, 37]) { ctx.moveTo(F.x(u, -11.5), F.y(u, -11.5)); ctx.lineTo(F.x(u, 15.8), F.y(u, 15.8)); }
      ctx.stroke();
      poly(ctx, F, [[42, -12], [42, 16], [47, 16], [52, 7], [52, -10], [46, -13]]); fillStroke(ctx, KUA.metal, 1);
      // the fur collar round the neck and over the near shoulder
      const pts = [[60, -6], [60, 10], [52, 16], [46, 10], [50, 2], [50, -8]].map(([u, n]) => [F.x(u, n), F.y(u, n)]);
      fur(ctx, pts, grad(ctx, F.x(60, 10), F.y(60, 10), F.x(48, -6), F.y(48, -6), [[0, KU.furHi], [1, KU.fur]]));
    },
    hem(ctx, j) { const F = torso(j); lames(ctx, F, 10, -26, -14, 3, 4, KUA, 3); lames(ctx, F, 9, -24, 1, 18, 4, KUA, 4); },
    front(ctx, j) { sodePlate(ctx, j.sh, j.elF, KUA, 5, 29, 11.5, 14, false); },
    head(ctx, j) {
      ctx.save(); headFrame(ctx, j);
      // a violet chin cord
      ctx.strokeStyle = KUA.lace; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-R * 0.4, -R * 0.2); ctx.quadraticCurveTo(R * 0.2, R * 0.9, R * 0.8, R * 0.75); ctx.stroke();
      // the wide lacquered war hat: a low cone much wider than the head, gold rim
      const hy = -R * 0.55;
      ctx.beginPath(); ctx.moveTo(-R * 2.15, hy + 3); ctx.quadraticCurveTo(-R * 0.4, hy - R * 1.05, R * 0.1, hy - R * 1.2);
      ctx.quadraticCurveTo(R * 0.6, hy - R * 1.05, R * 2.15, hy + 3); ctx.quadraticCurveTo(0, hy - 1, -R * 2.15, hy + 3); ctx.closePath();
      fillStroke(ctx, grad(ctx, R, hy - R * 1.2, -R, hy + 3, [[0, KU.lacHi], [0.5, KU.lac], [1, KU.lacDk]]), 1.4);
      ctx.strokeStyle = KU.gold; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-R * 2.05, hy + 2.2); ctx.quadraticCurveTo(0, hy - 1.8, R * 2.05, hy + 2.2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 0.7; ctx.beginPath();
      for (let i = -3; i <= 3; i++) { ctx.moveTo(R * 0.1, hy - R * 1.15); ctx.lineTo(i * R * 0.6, hy + 1); }
      ctx.stroke();
      // the crest: a black mountain with a snow cap, in gold, on the hat's front
      ctx.save(); ctx.translate(R * 0.85, hy - R * 0.45);
      ctx.beginPath(); ctx.arc(0, 0, 5.2, 0, TAU); fillStroke(ctx, KU.gold, 1);
      ctx.beginPath(); ctx.moveTo(-4, 2.6); ctx.lineTo(-0.6, -3.4); ctx.lineTo(1.2, -1); ctx.lineTo(2.2, -2.4); ctx.lineTo(4, 2.6); ctx.closePath(); ctx.fillStyle = KU.lac; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-1.8, -1.3); ctx.lineTo(-0.6, -3.4); ctx.lineTo(0.5, -1.8); ctx.closePath(); ctx.fillStyle = KU.snow; ctx.fill();
      ctx.restore();
      ctx.restore();
    },
  };

  // ================================================================ TETSU 鉄 — Iron Fortress: the daimyō's parade armour
  // He keeps his own helmet; for the parade it grows a great pair of gilt kuwagata blades, his armour turns to gold
  // lacquer laced in crimson, gilt shoulder boards, and a tall crimson sashimono banner with 鉄 rises from his back.
  const TE = { gold: '#cfa134', goldHi: '#f3d67a', goldDk: '#7a5a14', red: '#b3201a', redHi: '#d9423a', redDk: '#650e0b' };
  const TEA = { hi: TE.goldHi, base: TE.gold, dark: TE.goldDk, lace: TE.red, metal: '#fff1c2', shine: 'rgba(255,250,220,.4)', rivet: TE.redDk };
  const tetsu = {
    ownHead: true,
    pal: { armor: '#b8902e', accent: TE.red, accentDark: TE.redDk },
    back(ctx, j) {
      const F = torso(j), s = sway(1.9, 2);
      // the sashimono: a pole from the back of the armour to far above the head, a tall banner on it
      const pole = [[20, -14], [128, -14]];
      ctx.strokeStyle = LINE; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(F.x(...pole[0]), F.y(...pole[0])); ctx.lineTo(F.x(...pole[1]), F.y(...pole[1])); ctx.stroke();
      ctx.strokeStyle = '#2a2016'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(F.x(126, -14), F.y(126, -14)); ctx.lineTo(F.x(126, -38 + s), F.y(126, -38 + s)); ctx.lineWidth = 2; ctx.strokeStyle = '#2a2016'; ctx.stroke();
      poly(ctx, F, [[125, -15], [125, -37 + s], [76, -37 + s * 0.6], [76, -15]]);
      fillStroke(ctx, grad(ctx, F.x(120, -16), F.y(120, -16), F.x(80, -36), F.y(80, -36), [[0, TE.redHi], [0.6, TE.red], [1, TE.redDk]]), 1.3);
      ctx.strokeStyle = TE.gold; ctx.lineWidth = 1.2; ctx.beginPath();
      ctx.moveTo(F.x(122, -17), F.y(122, -17)); ctx.lineTo(F.x(122, -35 + s), F.y(122, -35 + s)); ctx.lineTo(F.x(79, -35 + s * 0.6), F.y(79, -35 + s * 0.6)); ctx.lineTo(F.x(79, -17), F.y(79, -17)); ctx.closePath(); ctx.stroke();
      // 鉄 in gold on the banner (upright on screen)
      ctx.save(); ctx.translate(F.x(101, -26 + s * 0.8), F.y(101, -26 + s * 0.8));
      ctx.fillStyle = TE.goldHi; ctx.font = '700 14px "Noto Serif JP", "Yu Mincho", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('鉄', 0, 0);
      ctx.restore();
      // the gilt finial on top
      ctx.fillStyle = TE.gold; ctx.beginPath(); ctx.arc(F.x(129, -14), F.y(129, -14), 2.2, 0, TAU); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 0.8; ctx.stroke();
    },
    backArm(ctx, j) { sodePlate(ctx, { x: j.sh.x - 3, y: j.sh.y + 1 }, j.elB, TEA, 5, 27, 10.5, 12.5, true); },
    body(ctx, j) {
      const F = torso(j);
      poly(ctx, F, [[11, -12], [11, 14.5], [30, 16.5], [47, 15], [52, 7], [52, -9], [46, -13.5], [26, -13]]);
      fillStroke(ctx, grad(ctx, F.x(50, 14), F.y(50, 14), F.x(10, -12), F.y(10, -12), [[0, TE.goldHi], [0.45, TE.gold], [1, TE.goldDk]]), 1.4);
      ctx.strokeStyle = TE.red; ctx.lineWidth = 1.4; ctx.beginPath();
      for (const u of [17, 23, 29, 35]) for (let n = -10; n <= 14; n += 4) { ctx.moveTo(F.x(u - 2, n), F.y(u - 2, n)); ctx.lineTo(F.x(u + 2, n), F.y(u + 2, n)); }
      ctx.stroke();
      // a red lacquer breastplate band with a gold rosette (agemaki knot)
      poly(ctx, F, [[40, -11], [40, 15.5], [47, 15], [52, 7], [52, -9], [46, -12.5]]); fillStroke(ctx, TE.red, 1.1);
      ctx.fillStyle = TE.goldHi; ctx.beginPath(); ctx.arc(F.x(45, 6), F.y(45, 6), 2.6, 0, TAU); ctx.fill();
    },
    front(ctx, j) { sodePlate(ctx, j.sh, j.elF, TEA, 5, 28, 11, 13, false); },
    head(ctx, j) {
      ctx.save(); headFrame(ctx, j);
      // the parade kuwagata: two tall gilt blades rising from the helmet's front
      const blade = (dx, a) => {
        ctx.beginPath(); ctx.moveTo(R * 0.55 + dx, -R * 0.9);
        ctx.bezierCurveTo(R * (0.2 + a) + dx, -R * 1.8, R * (0.1 + a) + dx, -R * 2.6, R * (0.6 + a * 1.4) + dx, -R * 3.4);
        ctx.bezierCurveTo(R * (0.5 + a) + dx, -R * 2.5, R * (0.55 + a) + dx, -R * 1.7, R * 0.85 + dx, -R * 0.95); ctx.closePath();
        fillStroke(ctx, grad(ctx, 0, -R * 0.9, 0, -R * 3.4, [[0, TE.goldDk], [0.5, TE.gold], [1, TE.goldHi]]), 1.1);
      };
      blade(-R * 0.35, -0.35); blade(0, 0.25);
      ctx.fillStyle = TE.red; ctx.beginPath(); ctx.arc(R * 0.72, -R * 0.95, 2.4, 0, TAU); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.restore();
    },
  };

  // ================================================================ REN 蓮 — Crimson Oni: the oni general
  // The brawler made general of the oni host: his own oni mask now crowned with two great horns and a gold third eye,
  // a tattered crimson war cloak, spiked iron pauldrons, a string of heavy prayer beads across the chest and a
  // shimenawa (the sacred straw rope) round the waist with its white paper zigzags.
  const RE = { cape: '#a8151a', capeHi: '#d6322e', capeDk: '#56070a', iron: '#3a3a40', ironHi: '#6a6a74', ironDk: '#1a1a1e', bone: '#efe6d2', boneDk: '#b9ad92', rope: '#c9a86a', ropeDk: '#8a6c35', bead: '#5a2c14', gold: '#e2b547' };
  function pauldron(ctx, sh, el, dim) {
    const dx = el.x - sh.x, dy = el.y - sh.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
    const X = (u, n) => sh.x + ux * u + nx * n, Y = (u, n) => sh.y + uy * u + ny * n;
    // spikes first (behind the plate's edge)
    for (const n of [-7, 0, 7]) {
      ctx.beginPath(); ctx.moveTo(X(-2, n - 2.6), Y(-2, n - 2.6)); ctx.lineTo(X(-9, n * 1.4), Y(-9, n * 1.4)); ctx.lineTo(X(-2, n + 2.6), Y(-2, n + 2.6)); ctx.closePath();
      fillStroke(ctx, dim ? RE.ironDk : RE.boneDk, 0.9);
    }
    ctx.beginPath(); ctx.moveTo(X(-3, -11), Y(-3, -11));
    ctx.quadraticCurveTo(X(-6, 0), Y(-6, 0), X(-3, 11), Y(-3, 11)); ctx.lineTo(X(15, 12), Y(15, 12)); ctx.quadraticCurveTo(X(19, 0), Y(19, 0), X(15, -12), Y(15, -12)); ctx.closePath();
    fillStroke(ctx, dim ? RE.ironDk : grad(ctx, X(-3, 0), Y(-3, 0), X(16, 0), Y(16, 0), [[0, RE.ironHi], [1, RE.ironDk]]), 1.2);
    if (dim) return;
    ctx.fillStyle = RE.gold; for (const n of [-7, 0, 7]) { ctx.beginPath(); ctx.arc(X(9, n), Y(9, n), 1, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = RE.cape; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(X(15, -12), Y(15, -12)); ctx.quadraticCurveTo(X(19, 0), Y(19, 0), X(15, 12), Y(15, 12)); ctx.stroke();
  }
  const ren = {
    ownHead: true,
    pal: { cloth: '#151013', clothHi: '#2a2025', clothDark: '#0d090b', accent: '#e0392c', accentDark: '#74140f', mask: '#c01a14' },
    back(ctx, j) {
      const F = torso(j), s = sway(2.2, 3);
      // the tattered war cloak from the shoulders to below the knees, torn into points
      const hem = [];
      for (let i = 0; i <= 7; i++) { const n = -14 - i * 3.6, u = i % 2 ? -44 + s : -34 + s * 0.6; hem.push([u - i * 0.8, n]); }
      poly(ctx, F, [[56, -6], [54, -13], ...hem, [-20, -44 + s], [14, -18]]);
      fillStroke(ctx, grad(ctx, F.x(54, -10), F.y(54, -10), F.x(-40, -30), F.y(-40, -30), [[0, RE.capeHi], [0.5, RE.cape], [1, RE.capeDk]]), 1.3);
      ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1; ctx.beginPath();
      for (const n of [-18, -26, -34]) { ctx.moveTo(F.x(48, -12), F.y(48, -12)); ctx.lineTo(F.x(-32, n + s * 0.5), F.y(-32, n + s * 0.5)); }
      ctx.stroke();
    },
    backArm(ctx, j) { pauldron(ctx, { x: j.sh.x - 3, y: j.sh.y + 1 }, j.elB, true); },
    body(ctx, j) {
      const F = torso(j);
      // the prayer beads across the chest (shoulder → opposite hip), big dark wooden beads with a gold one
      for (let i = 0; i <= 10; i++) {
        const t = i / 10, u = 54 - t * 42, n = -10 + t * 24, big = i === 5;
        ctx.beginPath(); ctx.arc(F.x(u, n), F.y(u, n), big ? 3.2 : 2.4, 0, TAU);
        fillStroke(ctx, big ? RE.gold : RE.bead, 0.8);
      }
    },
    hem(ctx, j) {
      const F = torso(j), s = sway(2.4, 1.2);
      // the shimenawa: a thick twisted straw rope round the waist, white paper zigzags hanging from it
      poly(ctx, F, [[14, -14], [14, 17], [7, 17.5], [7, -14.5]]);
      fillStroke(ctx, grad(ctx, F.x(14, 0), F.y(14, 0), F.x(7, 0), F.y(7, 0), [[0, RE.rope], [1, RE.ropeDk]]), 1.2);
      ctx.strokeStyle = RE.ropeDk; ctx.lineWidth = 1; ctx.beginPath();
      for (let n = -12; n <= 16; n += 3.5) { ctx.moveTo(F.x(14, n), F.y(14, n)); ctx.lineTo(F.x(7, n + 2.6), F.y(7, n + 2.6)); }
      ctx.stroke();
      for (const n of [-6, 5, 14]) {
        ctx.beginPath();
        const z = [[7, n], [1, n + 2.4], [-2, n - 0.4], [-8, n + 2.2], [-11, n - 0.4], [-17, n + 2 + s], [-17, n + 4.6 + s], [-11, n + 2.4], [-8, n + 4.8], [-2, n + 2.2], [1, n + 4.8], [7, n + 3]];
        z.forEach(([u, v], i) => (i ? ctx.lineTo(F.x(u, v), F.y(u, v)) : ctx.moveTo(F.x(u, v), F.y(u, v))));
        ctx.closePath(); fillStroke(ctx, '#f7f4ec', 0.8);
      }
    },
    front(ctx, j) { pauldron(ctx, j.sh, j.elF, false); },
    head(ctx, j) {
      ctx.save(); headFrame(ctx, j);
      // two great horns from the brow, sweeping back and up, bone white with blood-red roots
      const horn = (ox, sc) => {
        ctx.save(); ctx.translate(ox, -R * 0.75); ctx.scale(sc, sc);
        ctx.beginPath(); ctx.moveTo(-3.6, 1); ctx.bezierCurveTo(-6, -R * 1.1, -R * 1.4, -R * 1.9, -R * 2.3, -R * 2.2);
        ctx.bezierCurveTo(-R * 1.1, -R * 1.5, 1, -R * 0.9, 3.6, 0.5); ctx.closePath();
        fillStroke(ctx, grad(ctx, 0, 0, -R * 2, -R * 2, [[0, RE.cape], [0.25, RE.boneDk], [1, RE.bone]]), 1.2);
        ctx.strokeStyle = 'rgba(80,60,40,.35)'; ctx.lineWidth = 0.7; ctx.beginPath();
        for (let k = 1; k < 5; k++) { const t = k / 5; ctx.moveTo(-3.6 - t * R * 1.2, -t * R * 1.4); ctx.lineTo(3 - t * R * 1.0, -t * R * 1.1); }
        ctx.stroke();
        ctx.restore();
      };
      horn(-R * 0.1, 1.15); horn(R * 0.45, 1.35);
      // the gold third eye on the brow
      ctx.beginPath(); ctx.ellipse(R * 0.75, -R * 0.5, 1.6, 2.4, 0.3, 0, TAU); fillStroke(ctx, RE.gold, 0.8);
      ctx.restore();
    },
  };

  Object.assign(ND.COSTUMES, { champion_akane: akane, champion_kuro: kuro, champion_tetsu: tetsu, champion_ren: ren });
})(window.ND);
