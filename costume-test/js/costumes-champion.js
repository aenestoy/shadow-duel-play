// Shadow Duel — the ranked Season Champion costume: a different drawn costume for EACH fighter
// (builtin 'champion' in the reward catalog → ND.COSTUMES['champion_<fighter>']; js/costumes.js has the system).
// Each design grows out of the fighter's own identity (title, weapon, style, colours, kanji) and keeps the fighter
// recognisable (their weapon, hair or mask where it matters), and reads as a prize: ceremonial, rich, clearly special.
// It is not the Monthly Tournament's "Champion colors" (a recolour of the same outfit): these are new shapes.
// A design may bring its own colours (pal) and may keep the fighter's own head (ownHead: hair, mask, helmet stay and the
// costume adds to them). Drawing only: nothing here changes the fight.
// Done: akane, kuro, tetsu, ren (batch 1); aoi, yuki, hana, kage (batch 2).
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


  // ================================================================ AOI 葵 — Blue Wind: the wind lord
  // The one-handed tachi fencer as the wind's own lord (Fūjin's attire): a white court haori over deep indigo, a silver
  // breastplate laced in sky blue, a silver circlet with a wind-swirl crest on her tall topknot, and the wind bag: a
  // long white sash that arches in the air behind her from shoulder to shoulder, its ends always in the wind.
  const AO = { white: '#eef3f8', whiteDk: '#aebdd0', blue: '#1f5aa0', blueHi: '#4a8fd6', silver: '#d6dde8', silverDk: '#7d8898' };
  function swirl(ctx, x, y, r, col) {
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.8, r * 0.22); ctx.beginPath();
    for (let a = 0; a < 3.4 * Math.PI; a += 0.25) { const q = r * (1 - a / (3.6 * Math.PI)); const px = x + Math.cos(a) * q, py = y + Math.sin(a) * q; if (!a) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke();
  }
  const aoi = {
    ownHead: true,
    pal: { cloth: '#e8eef5', clothHi: '#ffffff', clothDark: '#a9b8cc', haori: AO.blue, accent: '#7fc4ff', accentDark: '#2c6aa8' },
    back(ctx, j) {
      const F = torso(j), s = sway(1.7, 3);
      // the wind bag: a broad white sash in a high arch behind the body, from the back shoulder over the head to the front
      const path = (w) => {
        ctx.beginPath();
        ctx.moveTo(F.x(50, -12), F.y(50, -12));
        ctx.bezierCurveTo(F.x(92, -46 + s), F.y(92, -46 + s), F.x(112, 14 + s), F.y(112, 14 + s), F.x(70, 30 + s * 0.5), F.y(70, 30 + s * 0.5));
        ctx.lineTo(F.x(70 - w * 0.3, 30 + w + s * 0.5), F.y(70 - w * 0.3, 30 + w + s * 0.5));
        ctx.bezierCurveTo(F.x(104, 18 + w + s), F.y(104, 18 + w + s), F.x(86, -40 + w + s), F.y(86, -40 + w + s), F.x(46, -12 + w * 0.4), F.y(46, -12 + w * 0.4));
        ctx.closePath();
      };
      path(7);
      fillStroke(ctx, grad(ctx, F.x(100, -20), F.y(100, -20), F.x(60, 20), F.y(60, 20), [[0, '#ffffff'], [0.6, AO.white], [1, AO.whiteDk]]), 1.3);
      swirl(ctx, F.x(98, -18 + s), F.y(98, -18 + s), 4, AO.blueHi);
      swirl(ctx, F.x(96, 12 + s), F.y(96, 12 + s), 3.4, AO.blueHi);
      // the fluttering tie at the front end
      ctx.strokeStyle = AO.blue; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(F.x(68, 32 + s * 0.5), F.y(68, 32 + s * 0.5)); ctx.quadraticCurveTo(F.x(60, 44 + s), F.y(60, 44 + s), F.x(54, 40 + s * 1.4), F.y(54, 40 + s * 1.4)); ctx.stroke();
    },
    body(ctx, j) {
      const F = torso(j);
      // the silver breastplate laced in sky blue over the white robe
      poly(ctx, F, [[26, -12], [26, 13], [46, 15], [52, 7], [52, -9], [45, -13]]);
      fillStroke(ctx, grad(ctx, F.x(50, 13), F.y(50, 13), F.x(26, -12), F.y(26, -12), [[0, '#ffffff'], [0.5, AO.silver], [1, AO.silverDk]]), 1.3);
      ctx.strokeStyle = AO.blueHi; ctx.lineWidth = 1.2; ctx.beginPath();
      for (const u of [31, 37]) { ctx.moveTo(F.x(u, -11), F.y(u, -11)); ctx.lineTo(F.x(u, 14), F.y(u, 14)); }
      ctx.stroke();
      swirl(ctx, F.x(44, 3), F.y(44, 3), 3.6, AO.blue);
      // a deep blue sash at the waist
      poly(ctx, F, [[14, -13], [14, 15], [8, 15.5], [8, -13.5]]); fillStroke(ctx, AO.blue, 1.1);
    },
    head(ctx, j) {
      ctx.save(); headFrame(ctx, j);
      // the silver circlet round the brow, the wind-swirl crest at the front, silver ties on the topknot
      ctx.strokeStyle = LINE; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(-1, -4.8, R * 1.04, R * 0.5, -0.1, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
      ctx.strokeStyle = AO.silver; ctx.lineWidth = 1.9; ctx.stroke();
      ctx.beginPath(); ctx.arc(R * 0.72, -R * 0.78, 3.4, 0, TAU); fillStroke(ctx, AO.silver, 0.9);
      swirl(ctx, R * 0.72, -R * 0.78, 2.4, AO.blue);
      ctx.fillStyle = AO.silver; ctx.fillRect(-R * 0.62, -R * 1.5, R * 0.52, 2.2);
      ctx.restore();
    },
  };

  // ================================================================ YUKI 雪 — Snow Fox: the white kitsune
  // The fastest blade becomes the snow fox spirit: a white winter shinobi suit with ice-blue trim, a white fox mask
  // with red markings, fox ears on the hood and three great white tails behind her. Her long scarf stays.
  const YU = { white: '#f3f6fa', whiteDk: '#b9c4d2', ice: '#8fd3ff', red: '#d6283a', fur: '#ffffff', furDk: '#c9d3df' };
  const yuki = {
    ownHead: true,
    pal: { cloth: '#e7ecf3', clothHi: '#ffffff', clothDark: '#9ba8ba', wrap: '#c8d2df', wrapDark: '#8e9aab', accent: '#bfe6ff', accentDark: '#5a8fb8', ui: '#bfe6ff' },
    back(ctx, j) {
      const F = torso(j);
      // three fox tails from the small of the back, each its own sway
      for (let i = 0; i < 3; i++) {
        const s = sway(1.6 + i * 0.35, 3), a = -1 + i;
        ctx.beginPath();
        ctx.moveTo(F.x(8, -10), F.y(8, -10));
        ctx.bezierCurveTo(F.x(-4 + a * 6, -26 + s), F.y(-4 + a * 6, -26 + s), F.x(10 + a * 16, -44 + s), F.y(10 + a * 16, -44 + s), F.x(24 + a * 18, -40 + s * 1.3), F.y(24 + a * 18, -40 + s * 1.3));
        ctx.bezierCurveTo(F.x(12 + a * 10, -34 + s), F.y(12 + a * 10, -34 + s), F.x(10, -20), F.y(10, -20), F.x(14, -10), F.y(14, -10));
        ctx.closePath();
        fillStroke(ctx, grad(ctx, F.x(10, -10), F.y(10, -10), F.x(20 + a * 16, -42), F.y(20 + a * 16, -42), [[0, YU.furDk], [0.6, YU.fur], [1, '#ffffff']]), 1.2);
        // the ice-blue tip
        ctx.beginPath(); ctx.arc(F.x(22 + a * 17, -40 + s * 1.3), F.y(22 + a * 17, -40 + s * 1.3), 2.6, 0, TAU); ctx.fillStyle = YU.ice; ctx.fill();
      }
    },
    body(ctx, j) {
      const F = torso(j);
      // a snowflake crest on the chest and an ice-blue belt with a silver clasp
      ctx.save(); ctx.translate(F.x(42, 5), F.y(42, 5)); ctx.strokeStyle = YU.ice; ctx.lineWidth = 1.1; ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 4, Math.sin(a) * 4); ctx.moveTo(Math.cos(a) * 2.4, Math.sin(a) * 2.4); ctx.lineTo(Math.cos(a + 0.5) * 3.2, Math.sin(a + 0.5) * 3.2); }
      ctx.stroke(); ctx.restore();
      poly(ctx, F, [[13, -13], [13, 15.5], [8, 16], [8, -13.5]]); fillStroke(ctx, '#5a8fb8', 1.1);
      ctx.beginPath(); ctx.arc(F.x(10.5, 12), F.y(10.5, 12), 2, 0, TAU); fillStroke(ctx, '#e6edf6', 0.8);
    },
    head(ctx, j) {
      ctx.save(); headFrame(ctx, j);
      // fox ears on the hood
      const ear = (x, sc) => {
        ctx.beginPath(); ctx.moveTo(x - 3 * sc, -R * 0.82); ctx.lineTo(x - 1 * sc, -R * 1.72); ctx.lineTo(x + 4 * sc, -R * 0.9); ctx.closePath(); fillStroke(ctx, YU.white, 1.1);
        ctx.beginPath(); ctx.moveTo(x - 1.4 * sc, -R * 0.95); ctx.lineTo(x - 0.6 * sc, -R * 1.5); ctx.lineTo(x + 2.2 * sc, -R * 0.98); ctx.closePath(); ctx.fillStyle = '#f2a9b6'; ctx.fill();
      };
      ear(-R * 0.55, 0.85); ear(R * 0.15, 1);
      // the white fox mask over the face: a pointed snout, red markings, slit eyes
      ctx.beginPath(); ctx.moveTo(R * 0.05, -R * 0.62); ctx.quadraticCurveTo(R * 0.85, -R * 0.62, R * 1.02, -2.4);
      ctx.lineTo(R * 1.65, 2.2); ctx.quadraticCurveTo(R * 1.35, 4.6, R * 0.9, 4.2); ctx.quadraticCurveTo(R * 0.6, R * 0.62, R * 0.05, R * 0.5); ctx.closePath();
      fillStroke(ctx, grad(ctx, R * 1.2, -R * 0.5, 0, R * 0.5, [[0, '#ffffff'], [1, YU.whiteDk]]), 1.2);
      ctx.strokeStyle = YU.red; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.beginPath();
      ctx.moveTo(R * 0.45, -R * 0.45); ctx.quadraticCurveTo(R * 0.7, -R * 0.2, R * 0.95, -R * 0.35);
      ctx.moveTo(R * 0.55, 1); ctx.lineTo(R * 1.05, 0.2); ctx.moveTo(R * 0.55, 3); ctx.lineTo(R * 1.0, 2.8);
      ctx.stroke();
      ctx.fillStyle = '#101216'; ctx.beginPath(); ctx.ellipse(R * 0.8, -2.2, 1.8, 0.7, -0.3, 0, TAU); ctx.fill();
      ctx.fillStyle = YU.red; ctx.beginPath(); ctx.arc(R * 1.6, 2.2, 1, 0, TAU); ctx.fill();
      ctx.restore();
    },
  };

  // ================================================================ HANA 花 — Cherry Dance: the blossom princess
  // The kunoichi of twin tantō in a dancer-princess's kimono of falling sakura: a pale pink kimono top patterned with
  // blossoms, a gold obi with a great butterfly bow at her back, a short kimono skirt over dark leggings, sakura
  // kanzashi in her ponytail with dangling petals.
  const HA = { pink: '#f7d7e4', pinkHi: '#fff1f6', pinkDk: '#c4819e', petal: '#ff8fbf', petalDk: '#d45a8f', gold: '#e8b94e', goldDk: '#9a7022', plum: '#3a1830' };
  function blossom(ctx, x, y, r, col, core) {
    ctx.fillStyle = col;
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - Math.PI / 2; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, r * 0.34, a, 0, TAU); ctx.fill(); }
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(x, y, r * 0.22, 0, TAU); ctx.fill();
  }
  const hana = {
    ownHead: true,
    pal: { cloth: '#f4d3e1', clothHi: '#fff0f6', clothDark: '#b97a95', hakama: '#2e1427', hakamaDark: '#1b0b17', accent: '#ff7fb6', accentDark: '#b53a74', ui: '#ff8fbf',
      hood: { cloth: '#2e1427', clothHi: '#4c2542', clothDark: '#1b0b17' } },
    back(ctx, j) {
      const F = torso(j), s = sway(2, 1.5);
      // the butterfly obi bow at the back of the waist: two big loops and two hanging tails
      for (const [du, dn] of [[10, -12], [-8, -14]]) {
        ctx.beginPath(); ctx.moveTo(F.x(14, -12), F.y(14, -12));
        ctx.bezierCurveTo(F.x(14 + du * 1.6, -12 + dn), F.y(14 + du * 1.6, -12 + dn), F.x(14 + du * 2.4, -12 + dn * 2.4 + s), F.y(14 + du * 2.4, -12 + dn * 2.4 + s), F.x(14 + du * 0.6, -14 + dn * 1.8 + s), F.y(14 + du * 0.6, -14 + dn * 1.8 + s));
        ctx.closePath(); fillStroke(ctx, grad(ctx, F.x(14, -12), F.y(14, -12), F.x(14 + du * 2, -12 + dn * 2), F.y(14 + du * 2, -12 + dn * 2), [[0, HA.goldDk], [0.5, HA.gold], [1, '#fff0c2']]), 1.2);
      }
      for (const dn of [-4, 2]) {
        poly(ctx, F, [[12, -13 + dn], [-18, -15 + dn + s], [-20, -9 + dn + s], [10, -9 + dn]]);
        fillStroke(ctx, HA.petalDk, 1);
      }
      ctx.beginPath(); ctx.arc(F.x(14, -13), F.y(14, -13), 3, 0, TAU); fillStroke(ctx, HA.petal, 0.9);
    },
    body(ctx, j) {
      const F = torso(j);
      // blossoms over the kimono top, the gold obi with a pink cord
      for (const [u, n, r] of [[44, 6, 3.2], [36, -5, 2.6], [28, 8, 2.8], [48, -6, 2.2], [22, -2, 2.4]]) blossom(ctx, F.x(u, n), F.y(u, n), r, HA.petal, HA.gold);
      poly(ctx, F, [[18, -13.5], [18, 16], [8, 16.5], [8, -14]]);
      fillStroke(ctx, grad(ctx, F.x(18, 0), F.y(18, 0), F.x(8, 0), F.y(8, 0), [[0, '#fff0c2'], [0.5, HA.gold], [1, HA.goldDk]]), 1.2);
      ctx.strokeStyle = HA.petalDk; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(F.x(13, -13.5), F.y(13, -13.5)); ctx.lineTo(F.x(13, 16.2), F.y(13, 16.2)); ctx.stroke();
      // a crossed pink collar
      ctx.strokeStyle = HA.petal; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(F.x(55, 2), F.y(55, 2)); ctx.lineTo(F.x(36, 12), F.y(36, 12)); ctx.stroke();
    },
    hem(ctx, j) {
      const F = torso(j), s = sway(2.3, 1.5);
      // the short kimono skirt over the thighs, its hem sprinkled with petals
      poly(ctx, F, [[9, -14], [9, 16.5], [-12, 23 + s], [-17, 5 + s], [-14, -20 + s]]);
      fillStroke(ctx, grad(ctx, F.x(8, 0), F.y(8, 0), F.x(-15, 0), F.y(-15, 0), [[0, HA.pinkHi], [0.5, HA.pink], [1, HA.pinkDk]]), 1.2);
      ctx.strokeStyle = HA.petalDk; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(F.x(-14, -20 + s), F.y(-14, -20 + s)); ctx.lineTo(F.x(-17, 5 + s), F.y(-17, 5 + s)); ctx.lineTo(F.x(-12, 23 + s), F.y(-12, 23 + s)); ctx.stroke();
      for (const [u, n] of [[-6, 10], [-2, -6], [-10, 3]]) blossom(ctx, F.x(u, n + s * 0.5), F.y(u, n + s * 0.5), 2.4, HA.petal, HA.gold);
    },
    head(ctx, j) {
      ctx.save(); headFrame(ctx, j);
      // sakura kanzashi in the hair: a cluster of blossoms and hanging petal strings
      for (const [x, y, r] of [[-R * 0.55, -R * 1.02, 3.4], [-R * 0.1, -R * 1.12, 2.8], [-R * 0.9, -R * 0.7, 2.6]]) blossom(ctx, x, y, r, HA.petal, HA.gold);
      ctx.strokeStyle = HA.gold; ctx.lineWidth = 0.9; ctx.beginPath();
      ctx.moveTo(-R * 0.9, -R * 0.6); ctx.lineTo(-R * 1.0, R * 0.1); ctx.moveTo(-R * 0.7, -R * 0.62); ctx.lineTo(-R * 0.76, R * 0.25); ctx.stroke();
      for (const [x, y] of [[-R * 1.0, R * 0.12], [-R * 0.76, R * 0.27]]) { ctx.fillStyle = HA.petal; ctx.beginPath(); ctx.ellipse(x, y + 1.4, 1.2, 2, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
    },
  };

  // ================================================================ KAGE 影 — the Shadow itself: the shadow lord
  // The hooded shadow crowned lord of the dark: a great black cloak to the ankles, its torn hem and high collar edged in
  // his green ghost-fire, a deep outer cowl over his hood with a silver crest, a silver chain clasp. The reversed
  // ninjatō stays.
  const KA = { cloak: '#0b0c0f', cloakHi: '#23262e', cloakDk: '#040405', fire: '#7be08f', fireDk: '#2a6b38', silver: '#c9cfd8' };
  function ghostEdge(ctx, pts) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(123,224,143,.55)'; ctx.lineWidth = 3; ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.strokeStyle = 'rgba(210,255,220,.8)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
  const kage = {
    ownHead: true,
    pal: { accent: '#8dff9f', accentDark: '#2f7f40' },
    back(ctx, j) {
      const F = torso(j), s = sway(1.8, 3);
      // the cloak: from the shoulders down to the ankles, torn into flame-like points at the hem
      const hem = [];
      for (let i = 0; i <= 8; i++) { const n = -2 - i * 5; hem.push([(i % 2 ? -78 : -66) + s * (0.5 + i * 0.1), n + s * 0.4]); }
      const pts = [[58, -4], [56, -18], [24, -34 + s * 0.5], ...hem.reverse(), [-60, 2], [10, -8]];
      poly(ctx, F, pts);
      fillStroke(ctx, grad(ctx, F.x(56, -10), F.y(56, -10), F.x(-60, -20), F.y(-60, -20), [[0, KA.cloakHi], [0.4, KA.cloak], [1, KA.cloakDk]]), 1.3);
      ghostEdge(ctx, hem.map(([u, n]) => [F.x(u, n), F.y(u, n)]));
    },
    body(ctx, j) {
      const F = torso(j);
      // the high standing collar round the neck and the silver chain clasp
      poly(ctx, F, [[66, -12], [68, 4], [58, 10], [54, -2], [56, -12]]);
      fillStroke(ctx, grad(ctx, F.x(66, 0), F.y(66, 0), F.x(54, 0), F.y(54, 0), [[0, KA.cloakHi], [1, KA.cloakDk]]), 1.2);
      ghostEdge(ctx, [[F.x(66, -12), F.y(66, -12)], [F.x(68, 4), F.y(68, 4)], [F.x(58, 10), F.y(58, 10)]]);
      ctx.strokeStyle = KA.silver; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(F.x(54, -6), F.y(54, -6)); ctx.quadraticCurveTo(F.x(49, 3), F.y(49, 3), F.x(54, 9), F.y(54, 9)); ctx.stroke();
      ctx.beginPath(); ctx.arc(F.x(51, 2), F.y(51, 2), 2.2, 0, TAU); fillStroke(ctx, KA.silver, 0.8);
    },
    front(ctx, j) {
      const F = torso(j), s = sway(1.8, 1.5);
      // a short cape over the near shoulder
      poly(ctx, F, [[58, -2], [58, 14], [38, 18 + s], [34, 8 + s], [46, 0]]);
      fillStroke(ctx, grad(ctx, F.x(58, 6), F.y(58, 6), F.x(36, 14), F.y(36, 14), [[0, KA.cloakHi], [1, KA.cloak]]), 1.2);
      ghostEdge(ctx, [[F.x(58, 14), F.y(58, 14)], [F.x(38, 18 + s), F.y(38, 18 + s)], [F.x(34, 8 + s), F.y(34, 8 + s)]]);
    },
    head(ctx, j) {
      ctx.save(); headFrame(ctx, j);
      // the outer cowl: deeper and higher than the hood, pointed back, a silver crest at the brow
      ctx.beginPath(); ctx.moveTo(R * 1.35, -4); ctx.quadraticCurveTo(R * 0.8, -R * 1.9, -R * 0.6, -R * 1.95);
      ctx.quadraticCurveTo(-R * 2.3, -R * 1.5, -R * 1.9, R * 0.9); ctx.quadraticCurveTo(-R * 1.1, 0, -R * 0.6, -R * 1.2);
      ctx.quadraticCurveTo(R * 0.3, -R * 1.3, R * 1.1, -5.8); ctx.closePath();
      fillStroke(ctx, grad(ctx, R, -R * 1.8, -R * 1.5, R * 0.5, [[0, KA.cloakHi], [0.5, KA.cloak], [1, KA.cloakDk]]), 1.4);
      ghostEdge(ctx, [[R * 1.35, -4], [R * 0.8, -R * 1.72], [-R * 0.6, -R * 1.9]]);
      ctx.save(); ctx.translate(R * 0.55, -R * 1.45); ctx.rotate(-0.3);
      ctx.beginPath(); ctx.moveTo(0, -3.4); ctx.lineTo(2.4, 0); ctx.lineTo(0, 3.4); ctx.lineTo(-2.4, 0); ctx.closePath(); fillStroke(ctx, KA.silver, 0.8);
      ctx.restore();
      ctx.restore();
    },
  };

  Object.assign(ND.COSTUMES, { champion_akane: akane, champion_kuro: kuro, champion_tetsu: tetsu, champion_ren: ren,
    champion_aoi: aoi, champion_yuki: yuki, champion_hana: hana, champion_kage: kage });
})(window.ND);
