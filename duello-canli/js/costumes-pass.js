











(function (ND) {
  'use strict';
  const K = ND._costumeKit;
  if (!K || !ND.COSTUMES) return;
  const { R, TAU, LINE, torso, poly, headFrame, sway } = K;
  const grad = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([t, c]) => g.addColorStop(t, c)); return g; };
  const fillStroke = (ctx, fill, lw = 1.2) => { ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = lw; ctx.stroke(); };
  const C = {
    silver: '#d9def0', silverHi: '#ffffff', silverDk: '#8a90ab',
    crimson: '#d6263a', crimsonDk: '#7a0c18', crimsonHi: '#ff5a66',
    jewel: '#9b6cff',
  };

  function moon(ctx, x, y, r, col, rot = -0.5) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.arc(0, 0, r, 0.35, TAU - 0.35, false); ctx.arc(r * 0.42, 0, r * 0.78, TAU - 0.62, 0.62, true); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.restore();
  }
  const pass1_akane = {
    ownHead: true,
    pal: {
      cloth: '#3a2c66', clothHi: '#5e4b9c', clothDark: '#1d1440',
      hakama: '#261c42', hakamaDark: '#130d24',
      accent: C.crimson, accentDark: C.crimsonDk,
      rim: 'rgba(206,194,255,.62)', rimDim: 'rgba(140,120,205,.32)',
    },
    back(ctx, j) {

      const F = torso(j), d = F.d, s2 = sway(1.7, 4);

      const bx = F.x(9, -15), by = F.y(9, -15), ang = Math.atan2(F.uy, F.ux);
      ctx.save(); ctx.translate(bx, by); ctx.rotate(ang);
      for (const [ox, oy, rx, ry, rt] of [[6, -8 * d, 7, 4.2, -0.5 * d], [-6, -8 * d, 7, 4.2, 0.5 * d]]) {
        ctx.beginPath(); ctx.ellipse(ox, oy, rx, ry, rt, 0, TAU);
        fillStroke(ctx, grad(ctx, ox, oy - 5, ox, oy + 5, [[0, C.crimsonHi], [0.5, C.crimson], [1, C.crimsonDk]]), 1.1);
      }
      ctx.beginPath(); ctx.ellipse(0, -7 * d, 3, 3.4, 0, 0, TAU); fillStroke(ctx, C.crimsonDk, 1);
      ctx.restore();
      poly(ctx, F, [[7, -17], [-26, -22 + s2 * 0.6], [-30, -18 + s2 * 0.6], [4, -14]]);
      fillStroke(ctx, grad(ctx, F.x(6, -16), F.y(6, -16), F.x(-28, -20), F.y(-28, -20), [[0, C.crimson], [1, C.crimsonDk]]), 1);
      ctx.strokeStyle = C.silver; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(F.x(-26, -22 + s2 * 0.6), F.y(-26, -22 + s2 * 0.6)); ctx.lineTo(F.x(-30, -18 + s2 * 0.6), F.y(-30, -18 + s2 * 0.6)); ctx.stroke();
    },
    body(ctx, j) {
      const F = torso(j);

      [['#f4f1ea', 2.2], [C.crimson, 1.6], [C.silver, 1]].forEach(([col, lw], i) => {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
        ctx.moveTo(F.x(56 - i * 0.6, -1 + i * 2.4), F.y(56 - i * 0.6, -1 + i * 2.4)); ctx.lineTo(F.x(28 - i, 13 + i * 0.4), F.y(28 - i, 13 + i * 0.4)); ctx.stroke();
      });

      for (const [u, n, r, rot] of [[46, -6, 2.4, -0.4], [34, -9, 1.8, -0.9], [24, 2, 2, -0.2], [40, 4, 1.6, 0.3]]) moon(ctx, F.x(u, n), F.y(u, n), r, 'rgba(217,222,240,.75)', rot);
      ctx.beginPath(); ctx.arc(F.x(43, 7), F.y(43, 7), 4.6, 0, TAU); fillStroke(ctx, '#1a1230', 1);
      ctx.strokeStyle = C.silver; ctx.lineWidth = 0.9; ctx.stroke();
      moon(ctx, F.x(43, 7), F.y(43, 7), 3.2, C.silverHi, -0.6);

      poly(ctx, F, [[13.5, -13.6], [13.5, 15.2], [8.5, 15.6], [8.5, -14]]);
      fillStroke(ctx, grad(ctx, F.x(13.5, 0), F.y(13.5, 0), F.x(8.5, 0), F.y(8.5, 0), [[0, C.silverHi], [0.5, C.silver], [1, C.silverDk]]), 1.1);
      ctx.strokeStyle = 'rgba(120,100,170,.6)'; ctx.lineWidth = 0.7; ctx.beginPath();
      for (let n = -12; n <= 14; n += 4.5) { ctx.moveTo(F.x(13, n), F.y(13, n)); ctx.lineTo(F.x(9, n + 2), F.y(9, n + 2)); }
      ctx.stroke();
      ctx.strokeStyle = C.crimson; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(F.x(11, -13.8), F.y(11, -13.8)); ctx.lineTo(F.x(11, 15.6), F.y(11, 15.6)); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(F.x(11, 14.6), F.y(11, 14.6), 2.6, 2.1, 0, 0, TAU); fillStroke(ctx, C.jewel, 0.8);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(F.x(11.6, 14.1), F.y(11.6, 14.1), 0.8, 0, TAU); ctx.fill();
    },
    head(ctx, j) {
      ctx.save(); headFrame(ctx, j);
      const s = sway(2.6, 1.4);

      ctx.save(); ctx.translate(-R * 0.3, -R * 1.36); ctx.rotate(-Math.PI / 2 - 0.3);
      const mr = R * 0.6;
      ctx.beginPath(); ctx.arc(0, 0, mr, 0.4, TAU - 0.4, false); ctx.arc(mr * 0.4, 0, mr * 0.65, TAU - 0.64, 0.64, true); ctx.closePath();
      fillStroke(ctx, grad(ctx, -mr, 0, mr, 0, [[0, C.silverHi], [0.6, C.silver], [1, C.silverDk]]), 0.8);
      ctx.restore();
      ctx.beginPath(); ctx.arc(-R * 0.36, -R * 0.96, 2, 0, TAU); fillStroke(ctx, C.jewel, 0.7);

      ctx.strokeStyle = LINE; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-R * 1.16, -R * 0.62); ctx.lineTo(-R * 0.8, -R * 0.9); ctx.stroke();
      ctx.strokeStyle = C.silver; ctx.lineWidth = 1.4; ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const x0 = -R * 1.1 + i * R * 0.13, y0 = -R * 0.66 - i * R * 0.1, l = 6 + i * 2, x1 = x0 - 1 + s * (0.6 + i * 0.2), y1 = y0 + l;
        ctx.strokeStyle = 'rgba(217,222,240,.7)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.beginPath(); ctx.arc(x1, y1 + 0.8, 0.95, 0, TAU); ctx.fillStyle = C.silverHi; ctx.fill();
      }

      ctx.save(); ctx.translate(-R * 0.78, -R * 0.62);
      for (let i = 0; i < 5; i++) { const a = i * TAU / 5; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 1.8, Math.sin(a) * 1.8, 2.1, 1.5, a, 0, TAU); fillStroke(ctx, i % 2 ? C.crimson : C.crimsonHi, 0.5); }
      ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.restore();
    },
    hem(ctx, j) {
      const F = torso(j), s = sway(2.2, 1.2);

      ctx.strokeStyle = C.silver; ctx.lineWidth = 1.1; ctx.beginPath();
      ctx.moveTo(F.x(9, 14), F.y(9, 14)); ctx.lineTo(F.x(-12, 17 + s), F.y(-12, 17 + s)); ctx.stroke();
      const tx = F.x(-12, 17 + s), ty = F.y(-12, 17 + s);
      ctx.beginPath(); ctx.moveTo(tx - 1.8, ty); ctx.lineTo(tx + 1.8, ty); ctx.lineTo(tx + 2.4 + s * 0.3, ty + 9); ctx.lineTo(tx - 2.4 + s * 0.3, ty + 9); ctx.closePath();
      fillStroke(ctx, C.jewel, 0.7);

      const k = j.knF, f = j.ftF;
      if (k && f) {
        const dx = f.x - k.x, dy = f.y - k.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l * 9.5, ny = dx / l * 9.5;
        const hx = k.x + dx * 0.78, hy = k.y + dy * 0.78;
        ctx.strokeStyle = C.silver; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx - nx, hy - ny); ctx.lineTo(hx + nx * 0.9, hy + ny * 0.9); ctx.stroke();
        ctx.strokeStyle = 'rgba(217,222,240,.55)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(hx - nx + dx / l * 3, hy - ny + dy / l * 3); ctx.lineTo(hx + nx * 0.9 + dx / l * 3, hy + ny * 0.9 + dy / l * 3); ctx.stroke();
        const mx = (j.hip.x + k.x) / 2, my = (j.hip.y + k.y) / 2;
        moon(ctx, mx, my, 2.6, 'rgba(217,222,240,.8)', -0.3);
        moon(ctx, k.x + dx * 0.4, k.y + dy * 0.4, 1.9, 'rgba(217,222,240,.65)', 0.4);
      }
    },
  };
  ND.COSTUMES.pass1_akane = pass1_akane;

  ND.passCostume = (ch, base) => (ch && ND.COSTUMES['pass1_' + ch.id] && ND.costumePal ? ND.costumePal(base || ch.col, 'pass1_' + ch.id) : null);
})(window.ND);
