// Shadow Duel — interactive props: the pictures (drawing only; js/props.js is the simulation).
//
// Every prop is drawn in code in the game's look (flat ink-dark tones, a dark outline, thin warm / cold rim lights,
// the arena's own light baked in) into a small picture once per arena, then placed with one drawImage per frame on both
// renderers (WebGL2 and Canvas 2D). A shard is the same picture cut along the piece's outline (with a pale fracture
// line on the broken edges), so the pieces look like the object they came from. Liquid, splinters, straw, paper,
// embers, lantern glow, incense smoke and the dizzy stars are drawn live.
(function (ND) {
  'use strict';
  const P = ND.props;
  if (!P) return;
  const cam = ND.cam, KINDS = P.KINDS;
  const TAU = Math.PI * 2;
  const INK = '#0a0b12';
  const A = ND.propArt = {};

  // ------------------------------------------------------------------------------------------ the arena's light
  // mood: a dark (or warm / cold) wash over the picture; key: where the arena's key light comes from (rim side)
  function mood(th) {
    const id = ND.scene ? ND.scene.themeId : 'temple';
    const M = {
      temple: ['rgba(14,18,40,.34)', 'rgba(170,190,255,.22)'],
      rain: ['rgba(10,16,22,.36)', 'rgba(160,190,220,.2)'],
      snow: ['rgba(60,62,100,.16)', 'rgba(255,210,170,.26)'],
      village: ['rgba(40,10,6,.30)', 'rgba(255,130,60,.3)'],
      market: ['rgba(26,12,20,.24)', 'rgba(255,170,110,.26)'],
      waterfall: ['rgba(30,50,46,.08)', 'rgba(255,248,225,.3)'],
      castle: ['rgba(10,14,32,.36)', 'rgba(200,212,255,.26)'],
    }[id] || ['rgba(14,18,40,.3)', 'rgba(200,210,240,.2)'];
    return { wash: M[0], rim: M[1], from: (th && th.key && th.key.from) || 1, id };
  }

  // ------------------------------------------------------------------------------------------ drawing helpers
  const path = (x, pts) => { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.closePath(); };
  function fillLine(x, fill, lw = 1.4, line = INK) { x.fillStyle = fill; x.fill(); x.lineWidth = lw; x.strokeStyle = line; x.stroke(); }
  function rr(x, x0, y0, w, h, r) { x.beginPath(); x.moveTo(x0 + r, y0); x.arcTo(x0 + w, y0, x0 + w, y0 + h, r); x.arcTo(x0 + w, y0 + h, x0, y0 + h, r); x.arcTo(x0, y0 + h, x0, y0, r); x.arcTo(x0, y0, x0 + w, y0, r); x.closePath(); }
  function lines(x, col, lw, L) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); for (const l of L) { x.moveTo(l[0], l[1]); x.lineTo(l[2], l[3]); } x.stroke(); }
  // deterministic little stream for texture lines (same picture every time)
  function rs(seed) { let s = seed | 0; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // wood grain inside the current path (clipped)
  function grain(x, x0, y0, x1, y1, col, n, seed, vertical) {
    const r = rs(seed);
    x.save(); x.clip();
    x.strokeStyle = col; x.lineWidth = 0.7; x.beginPath();
    for (let i = 0; i < n; i++) {
      if (vertical) { const gx = x0 + (x1 - x0) * r(); x.moveTo(gx, y0); x.bezierCurveTo(gx + (r() - 0.5) * 3, y0 + (y1 - y0) * 0.3, gx + (r() - 0.5) * 3, y0 + (y1 - y0) * 0.7, gx + (r() - 0.5) * 2, y1); }
      else { const gy = y0 + (y1 - y0) * r(); x.moveTo(x0, gy); x.bezierCurveTo(x0 + (x1 - x0) * 0.3, gy + (r() - 0.5) * 2.5, x0 + (x1 - x0) * 0.7, gy + (r() - 0.5) * 2.5, x1, gy + (r() - 0.5) * 1.5); }
    }
    x.stroke(); x.restore();
  }
  // a soft vertical shading band (darker away from the light) inside the current path
  function shade(x, x0, y0, x1, y1, from, a = 0.32) {
    const g = x.createLinearGradient(x0, 0, x1, 0);
    const dark = `rgba(0,0,0,${a})`, clear = 'rgba(0,0,0,0)';
    if (from > 0) { g.addColorStop(0, dark); g.addColorStop(0.55, clear); g.addColorStop(1, clear); }
    else { g.addColorStop(0, clear); g.addColorStop(0.45, clear); g.addColorStop(1, dark); }
    x.save(); x.clip(); x.fillStyle = g; x.fillRect(x0, y0, x1 - x0, y1 - y0); x.restore();
  }

  // ------------------------------------------------------------------------------------------ the props
  // Each draws in local coordinates (origin = middle of the bottom, y up negative) at world size. m = mood, o = state
  const ART = {
    cup(x, m) {
      // sake cup (sakazuki): cream glaze, an indigo band under the rim, a dark foot ring, the sake inside
      const B = [[-3.6, 0], [3.6, 0], [4.4, -1.6], [6.6, -9.2], [6.6, -10], [-6.6, -10], [-6.6, -9.2], [-4.4, -1.6]];
      path(x, B); fillLine(x, '#e4dccb', 1.3);
      x.fillStyle = '#2d3e78'; x.fillRect(-6.4, -9.6, 12.8, 1.9);
      x.fillStyle = '#3a2c20'; x.fillRect(-3.6, -1.6, 7.2, 1.4);
      x.beginPath(); x.ellipse(0, -10, 6.4, 1.5, 0, 0, TAU); x.fillStyle = '#b08a46'; x.fill(); x.lineWidth = 1; x.strokeStyle = INK; x.stroke();
      path(x, B); shade(x, -7, -11, 7, 1, m.from, 0.28);
      lines(x, 'rgba(255,255,255,.75)', 0.9, [[m.from > 0 ? 4.6 : -4.6, -8, m.from > 0 ? 3.6 : -3.6, -3]]);
    },
    bottle(x, m) {
      // tokkuri: round body, long neck, flared lip; two-tone glaze (cream over deep indigo) with a brush wave
      const B = [[-6.5, 0], [6.5, 0], [8.2, -4], [8.6, -11], [6.8, -17], [4.1, -22.5], [3.5, -28.5], [4.6, -31], [-4.6, -31], [-3.5, -28.5], [-4.1, -22.5], [-6.8, -17], [-8.6, -11], [-8.2, -4]];
      path(x, B); fillLine(x, '#ddd3bf', 1.4);
      x.save(); path(x, B); x.clip();
      x.fillStyle = '#26356b'; x.beginPath(); x.moveTo(-10, -9); x.bezierCurveTo(-4, -12, 2, -6, 10, -10); x.lineTo(10, 1); x.lineTo(-10, 1); x.closePath(); x.fill();
      x.strokeStyle = '#ddd3bf'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(-7, -4.5); x.bezierCurveTo(-3, -7, 1, -3, 6, -5.5); x.stroke();
      x.fillStyle = '#26356b'; x.fillRect(-5, -31.2, 10, 1.6);
      x.restore();
      path(x, B); shade(x, -9, -32, 9, 1, m.from, 0.3);
      x.lineWidth = 1.4; x.strokeStyle = INK; path(x, B); x.stroke();
      x.beginPath(); x.ellipse(0, -31, 4.6, 1, 0, 0, TAU); x.fillStyle = '#1b1612'; x.fill();
      lines(x, 'rgba(255,255,255,.7)', 1, [[m.from > 0 ? 6.4 : -6.4, -14, m.from > 0 ? 6.9 : -6.9, -8], [m.from > 0 ? 2.8 : -2.8, -27, m.from > 0 ? 2.9 : -2.9, -24]]);
    },
    jar(x, m) {
      // water jar (kame): brown glaze with darker drips and a pale shoulder, two lugs, a wooden lid
      const B = [[-13, 0], [13, 0], [18.5, -9], [20, -18], [19, -28], [14.5, -37], [10.5, -41.5], [10.5, -43], [-10.5, -43], [-10.5, -41.5], [-14.5, -37], [-19, -28], [-20, -18], [-18.5, -9]];
      path(x, B); fillLine(x, '#6e3d22', 1.6);
      x.save(); path(x, B); x.clip();
      x.fillStyle = '#9a6a40'; x.beginPath(); x.moveTo(-22, -30); x.bezierCurveTo(-10, -33, 10, -33, 22, -30); x.lineTo(22, -46); x.lineTo(-22, -46); x.closePath(); x.fill();
      x.fillStyle = '#3d1d10';
      const r = rs(42);
      for (let i = 0; i < 7; i++) { const dx = -17 + i * 5.6 + r() * 2, len = 4 + r() * 9; x.beginPath(); x.moveTo(dx - 2.4, -30.5); x.quadraticCurveTo(dx, -30 + len, dx + 0.4, -30 + len + 1.5); x.quadraticCurveTo(dx + 1.6, -30 + len, dx + 2.6, -30.5); x.closePath(); x.fill(); }
      x.fillStyle = 'rgba(30,14,8,.6)'; x.fillRect(-22, -6, 44, 7);
      x.restore();
      path(x, B); shade(x, -21, -46, 21, 1, m.from, 0.36);
      x.lineWidth = 1.6; x.strokeStyle = INK; path(x, B); x.stroke();
      for (const s of [-1, 1]) { rr(x, s * 16.5 - 2.5, -36, 5, 4, 1.4); fillLine(x, '#7a4a2a', 1.1); }
      // lid
      rr(x, -12.5, -46.5, 25, 4, 1.2); fillLine(x, '#5a3a22', 1.2);
      rr(x, -3, -49.5, 6, 3.4, 1.2); fillLine(x, '#4a2e1a', 1);
      lines(x, 'rgba(255,220,180,.45)', 1, [[-11.5, -45.8, 11.5, -45.8]]);
      lines(x, 'rgba(255,236,210,.5)', 1.2, [[m.from > 0 ? 15 : -15, -24, m.from > 0 ? 13 : -13, -12]]);
    },
    stool(x, m) {
      // wooden stool: a thick seat plank with end grain, two splayed legs, a stretcher
      x.lineJoin = 'round';
      for (const s of [-1, 1]) { path(x, [[s * 12.5, -35], [s * 17.5, -35], [s * 19.5, 0], [s * 13.5, 0]]); fillLine(x, '#4f3420', 1.3); }
      rr(x, -12.5, -18, 25, 4.6, 1); fillLine(x, '#5a3b25', 1.2);
      rr(x, -21, -42, 42, 7.5, 1.6); fillLine(x, '#6e4a2c', 1.5);
      rr(x, -21, -42, 42, 7.5, 1.6); grain(x, -21, -42, 21, -34.5, 'rgba(30,16,8,.45)', 5, 7, false);
      lines(x, 'rgba(255,214,160,.5)', 1, [[-19.5, -41.2, 19.5, -41.2]]);
      for (const s of [-1, 1]) lines(x, 'rgba(255,214,160,.28)', 0.9, [[s * 13.4 + (m.from > 0 ? 3.4 : 0), -33, s * 14.4 + (m.from > 0 ? 3.6 : 0), -2]]);
      rr(x, -21, -42, 42, 7.5, 1.6); shade(x, -22, -43, 22, 1, m.from, 0.25);
    },
    // --- the duel market's set pieces (js/duel-seq.js)
    post(x, m) {
      // a wooden shop post on a stone footing, a cap beam, scars of old cuts
      rr(x, -16, -12, 32, 12, 2); fillLine(x, '#5d5a55', 1.4);
      lines(x, 'rgba(255,255,255,.18)', 1, [[-14, -11, 14, -11]]);
      rr(x, -11.5, -204, 23, 194, 2); fillLine(x, '#5b3a22', 1.5);
      rr(x, -11.5, -204, 23, 194, 2); grain(x, -11.5, -204, 11.5, -10, 'rgba(25,12,6,.45)', 7, 31, true);
      rr(x, -11.5, -204, 23, 194, 2); shade(x, -12, -205, 12, -9, m.from, 0.34);
      lines(x, 'rgba(255,214,160,.32)', 1.1, [[m.from > 0 ? 8 : -8, -200, m.from > 0 ? 8 : -8, -14]]);
      lines(x, 'rgba(20,10,4,.7)', 1, [[-9, -120, 4, -128], [-6, -88, 8, -92]]);
      rr(x, -17, -212, 34, 9, 1.5); fillLine(x, '#3f2615', 1.4);
    },
    veranda(x, m) {
      // a raised plank deck with a lower step at its end, dark under it, posts down to the ground
      x.fillStyle = 'rgba(16,10,7,.9)'; x.fillRect(-94, -34, 188, 34);
      for (const px of [-88, -30, 28, 86]) { rr(x, px - 4, -36, 8, 36, 1); fillLine(x, '#3e2716', 1.2); }
      rr(x, -95, -48, 155, 9, 1.4); fillLine(x, '#7a5232', 1.5);
      rr(x, -95, -48, 155, 9, 1.4); grain(x, -95, -48, 60, -39, 'rgba(30,16,8,.4)', 4, 51, false);
      rr(x, -95, -39, 155, 6, 1); fillLine(x, '#4e321d', 1.2);
      rr(x, 58, -25, 37, 8, 1.2); fillLine(x, '#6e4a2c', 1.4);
      rr(x, 58, -17, 37, 5, 1); fillLine(x, '#46301c', 1.1);
      lines(x, 'rgba(255,214,160,.45)', 1, [[-93, -47.2, 58, -47.2], [60, -24.2, 93, -24.2]]);
      lines(x, 'rgba(20,10,4,.55)', 0.8, [[-55, -48, -55, -39], [-15, -48, -15, -39], [25, -48, 25, -39]]);
    },
    shopfront(x, m) {
      // a shop front: two posts, a top beam, a paper screen (shoji) with its lattice, an indigo noren with a crest
      for (const s of [-1, 1]) { rr(x, s > 0 ? 31 : -40, -236, 9, 236, 1.5); fillLine(x, '#4a2e1a', 1.4); }
      rr(x, -40, -236, 80, 13, 1.5); fillLine(x, '#3a2414', 1.4);
      rr(x, -31, -204, 62, 186, 1); fillLine(x, '#e6dcc4', 1.2);
      x.save(); rr(x, -31, -204, 62, 186, 1); x.clip();
      x.fillStyle = 'rgba(255,200,130,.18)'; x.fillRect(-31, -204, 62, 186);
      x.strokeStyle = '#5a3a22'; x.lineWidth = 1.3; x.beginPath();
      for (let gx = -31 + 15.5; gx < 31; gx += 15.5) { x.moveTo(gx, -204); x.lineTo(gx, -18); }
      for (let gy = -204 + 23; gy < -18; gy += 23) { x.moveTo(-31, gy); x.lineTo(31, gy); }
      x.stroke(); x.restore();
      for (let i = 0; i < 3; i++) {
        const x0 = -33 + i * 22.4;
        path(x, [[x0, -223], [x0 + 21, -223], [x0 + 21, -168], [x0 + 15, -165], [x0 + 6, -168], [x0, -166]]); fillLine(x, '#26356b', 1.2);
      }
      x.beginPath(); x.arc(0, -196, 8, 0, TAU); x.fillStyle = '#e8e0cc'; x.fill();
      x.beginPath(); x.arc(0, -196, 4.4, 0, TAU); x.fillStyle = '#26356b'; x.fill();
      rr(x, -40, -18, 80, 18, 1.5); fillLine(x, '#3a2414', 1.4);
      rr(x, -40, -236, 80, 236, 1); shade(x, -41, -237, 41, 1, m.from, 0.22);
    },
    table(x, m) {
      // low lacquered table: thick top with a gold edge line, an apron, two square legs with feet
      for (const s of [-1, 1]) { path(x, [[s * 40.5, -26], [s * 49.5, -26], [s * 50, -2], [s * 52, 0], [s * 38.5, 0], [s * 40, -2]]); fillLine(x, '#2e1410', 1.4); }
      rr(x, -40, -26.5, 80, 6.5, 0.8); fillLine(x, '#3a1913', 1.2);
      rr(x, -56, -34, 112, 8.5, 1.6); fillLine(x, '#4a1f16', 1.6);
      lines(x, 'rgba(214,170,90,.75)', 1, [[-54.5, -28.6, 54.5, -28.6]]);
      lines(x, 'rgba(255,220,190,.42)', 1.1, [[-54, -33.2, 54, -33.2]]);
      for (const s of [-1, 1]) lines(x, 'rgba(255,200,170,.22)', 1, [[s * 41.5 + (m.from > 0 ? 7 : 0), -24.5, s * 41.8 + (m.from > 0 ? 7 : 0), -3]]);
      rr(x, -56, -34, 112, 8.5, 1.6); shade(x, -57, -35, 57, 1, m.from, 0.22);
    },
    crate(x, m) {
      // wooden crate: two corner battens, three boards with gaps, nails and a painted mark
      x.fillStyle = '#1a1009'; x.fillRect(-21, -52, 42, 52);
      const r = rs(91);
      for (let i = 0; i < 3; i++) {
        const y0 = -52 + i * 17.33 + 0.5;
        rr(x, -21, y0, 42, 16.3, 0.6); fillLine(x, i === 1 ? '#6a4a2c' : '#634427', 1.1);
        rr(x, -21, y0, 42, 16.3, 0.6); grain(x, -21, y0, 21, y0 + 16.3, 'rgba(28,14,6,.42)', 3, 13 + i * 7, false);
        lines(x, 'rgba(255,214,160,.32)', 0.9, [[-20, y0 + 0.9, 20, y0 + 0.9]]);
        x.fillStyle = 'rgba(15,10,8,.85)'; for (const s of [-1, 1]) { x.beginPath(); x.arc(s * 18.3, y0 + 8, 0.9 + r() * 0.2, 0, TAU); x.fill(); }
      }
      for (const s of [-1, 1]) {
        rr(x, s > 0 ? 21 : -28, -52, 7, 52, 0.8); fillLine(x, '#57391f', 1.3);
        rr(x, s > 0 ? 21 : -28, -52, 7, 52, 0.8); grain(x, s > 0 ? 21 : -28, -52, s > 0 ? 28 : -21, 0, 'rgba(25,12,5,.45)', 2, 30 + s, true);
        lines(x, 'rgba(255,214,160,.3)', 0.9, [[(s > 0 ? 21 : -28) + (m.from > 0 ? 6 : 1), -51, (s > 0 ? 21 : -28) + (m.from > 0 ? 6 : 1), -1]]);
      }
      // painted mark: a circle with a brush stroke (a merchant's sign)
      x.strokeStyle = 'rgba(160,40,28,.8)'; x.lineWidth = 2.2; x.beginPath(); x.arc(0, -26, 7.5, 0.3, TAU - 0.2); x.stroke();
      x.lineWidth = 2.6; x.beginPath(); x.moveTo(-4.5, -26.5); x.quadraticCurveTo(0, -29, 4.5, -25.5); x.stroke();
      rr(x, -28, -52, 56, 52, 0.8); shade(x, -29, -53, 29, 1, m.from, 0.24);
      rr(x, -28, -52, 56, 52, 0.8); x.lineWidth = 1.6; x.strokeStyle = INK; x.stroke();
    },
    barrel(x, m) {
      // sake barrel (komodaru): straw-mat wrap, dark wooden rim, twisted rope bands, a paper label with a brewer's mark
      const B = [[-19, 0], [19, 0], [22.5, -8], [24, -20], [24, -42], [22.5, -54], [19, -62], [-19, -62], [-22.5, -54], [-24, -42], [-24, -20], [-22.5, -8]];
      path(x, B); fillLine(x, '#a6874f', 1.6);
      path(x, B); grain(x, -24, -62, 24, 0, 'rgba(70,50,20,.5)', 16, 77, true);
      // rim + lid line
      x.fillStyle = '#3a2416'; path(x, [[-19, -62], [19, -62], [21, -58], [-21, -58]]); x.fill();
      // rope bands
      for (const y of [-51, -12]) {
        x.save(); path(x, B); x.clip();
        x.fillStyle = '#4a321a'; x.fillRect(-26, y - 2.6, 52, 5.2);
        x.strokeStyle = 'rgba(200,170,110,.55)'; x.lineWidth = 0.9; x.beginPath();
        for (let i = -26; i < 26; i += 3.2) { x.moveTo(i, y + 2.4); x.lineTo(i + 2.6, y - 2.4); }
        x.stroke(); x.restore();
      }
      // label
      rr(x, -12, -44, 24, 27, 1); fillLine(x, '#e7dcc0', 1.1);
      x.strokeStyle = '#a12a1e'; x.lineWidth = 2.4; x.beginPath(); x.arc(0, -36.5, 5.5, 0, TAU); x.stroke();
      x.fillStyle = '#16120e';
      x.fillRect(-1.1, -28.5, 2.2, 9); x.fillRect(-5.5, -26.4, 11, 1.8); x.fillRect(-4.2, -22.6, 8.4, 1.6);
      path(x, B); shade(x, -25, -63, 25, 1, m.from, 0.36);
      x.lineWidth = 1.6; x.strokeStyle = INK; path(x, B); x.stroke();
      lines(x, 'rgba(255,228,170,.45)', 1.1, [[m.from > 0 ? 21.5 : -21.5, -44, m.from > 0 ? 21.5 : -21.5, -18]]);
    },
    lantern(x, m, o) {
      // andon: floor lantern, black frame, washi paper box glowing from inside, a little roof with a handle
      const lit = o ? o.lit : 1;
      rr(x, -15, -8, 30, 8, 1); fillLine(x, '#1d1612', 1.3);
      for (const s of [-1, 1]) { rr(x, s > 0 ? 11 : -15, -18, 4, 10.5, 0.6); fillLine(x, '#1d1612', 1.1); }
      rr(x, -13, -60, 26, 42, 1); fillLine(x, lit > 0.5 ? '#ffdf9e' : '#cbbf9f', 1.3);
      if (lit > 0.5) { const g = x.createRadialGradient(0, -38, 2, 0, -38, 22); g.addColorStop(0, 'rgba(255,250,220,.95)'); g.addColorStop(1, 'rgba(255,170,70,.0)'); x.fillStyle = g; x.fillRect(-13, -60, 26, 42); }
      // paper frame (kumiko) and the corner posts
      x.strokeStyle = 'rgba(40,24,12,.75)'; x.lineWidth = 1; x.beginPath();
      for (const y of [-46, -32]) { x.moveTo(-13, y); x.lineTo(13, y); }
      x.moveTo(0, -60); x.lineTo(0, -18); x.stroke();
      for (const s of [-1, 1]) { x.fillStyle = '#1a130f'; x.fillRect(s > 0 ? 11 : -14, -62, 3, 46); }
      rr(x, -14, -62, 28, 3, 0.8); fillLine(x, '#1d1612', 1);
      rr(x, -14, -19, 28, 2.6, 0.6); fillLine(x, '#1d1612', 1);
      // roof and handle
      path(x, [[-15, -62], [15, -62], [10, -69], [-10, -69]]); fillLine(x, '#241a14', 1.3);
      x.strokeStyle = INK; x.lineWidth = 2; x.beginPath(); x.moveTo(-5, -69); x.lineTo(-5, -73.5); x.lineTo(5, -73.5); x.lineTo(5, -69); x.stroke();
      x.strokeStyle = '#2d2219'; x.lineWidth = 1; x.beginPath(); x.moveTo(-5, -69); x.lineTo(-5, -73.5); x.lineTo(5, -73.5); x.lineTo(5, -69); x.stroke();
      lines(x, 'rgba(255,220,180,.4)', 0.9, [[-14, -61.6, 14, -61.6], [-9, -68.6, 9, -68.6]]);
    },
    rack(x, m, o) {
      // katana rack (katana-kake): black lacquer base and posts with red arms, sheathed swords resting across
      const n = o ? o.n : 2;
      rr(x, -37, -6, 74, 6, 1.2); fillLine(x, '#17110d', 1.4);
      for (const s of [-1, 1]) {
        rr(x, s > 0 ? 24 : -33, -86, 9, 80, 1.2); fillLine(x, '#1c1410', 1.4);
        lines(x, 'rgba(255,210,170,.3)', 0.9, [[(s > 0 ? 24 : -33) + (m.from > 0 ? 8 : 1), -84, (s > 0 ? 24 : -33) + (m.from > 0 ? 8 : 1), -8]]);
        // the arms that hold the swords (lacquer red)
        for (const y of [-66, -40]) { rr(x, s > 0 ? 18 : -36, y, 18, 6, 2); fillLine(x, '#6b1712', 1.1); }
      }
      rr(x, -24, -66, 48, 8, 1); fillLine(x, '#1c1410', 1.2);
      rr(x, -24, -40, 48, 8, 1); fillLine(x, '#1c1410', 1.2);
      lines(x, 'rgba(214,170,90,.6)', 0.9, [[-23, -64.8, 23, -64.8], [-23, -38.8, 23, -38.8]]);
      if (n >= 1) saya(x, -70, 0);
      if (n >= 2) saya(x, -44, 1);
    },
    bale(x, m) {
      // rice-straw bale (tawara) on its side: straw body, round end caps, three rope bands
      rr(x, -27, -40, 54, 40, 14); fillLine(x, '#b5975a', 1.5);
      rr(x, -27, -40, 54, 40, 14); grain(x, -27, -40, 27, 0, 'rgba(90,64,26,.55)', 14, 5, false);
      for (const s of [-1, 1]) { x.beginPath(); x.ellipse(s * 23, -20, 5, 19.5, 0, 0, TAU); fillLine(x, '#9a7c44', 1.2); x.beginPath(); x.ellipse(s * 23, -20, 2.4, 10, 0, 0, TAU); x.strokeStyle = 'rgba(60,40,15,.6)'; x.lineWidth = 0.9; x.stroke(); }
      for (const bx of [-12, 0, 12]) {
        x.save(); rr(x, -27, -40, 54, 40, 14); x.clip();
        x.fillStyle = '#5b4322'; x.fillRect(bx - 2.2, -41, 4.4, 42);
        x.strokeStyle = 'rgba(210,180,120,.5)'; x.lineWidth = 0.8; x.beginPath();
        for (let y = -40; y < 0; y += 3) { x.moveTo(bx - 2, y + 2.4); x.lineTo(bx + 2, y); }
        x.stroke(); x.restore();
      }
      rr(x, -27, -40, 54, 40, 14); shade(x, -28, -41, 28, 1, m.from, 0.3);
      lines(x, 'rgba(255,236,190,.45)', 1, [[-14, -39, 14, -39]]);
    },
    bucket(x, m) {
      // wooden bucket (oke): tapered staves, two bamboo hoops, a rope handle
      x.strokeStyle = '#2a1a10'; x.lineWidth = 2.6; x.beginPath(); x.moveTo(-11.5, -22); x.quadraticCurveTo(0, -38, 11.5, -22); x.stroke();
      x.strokeStyle = '#8a6a3a'; x.lineWidth = 1.2; x.stroke();
      const B = [[-11, 0], [11, 0], [13.5, -24], [-13.5, -24]];
      path(x, B); fillLine(x, '#7a5634', 1.4);
      x.save(); path(x, B); x.clip();
      x.strokeStyle = 'rgba(30,16,8,.6)'; x.lineWidth = 0.8; x.beginPath();
      for (let i = -3; i <= 3; i++) { x.moveTo(i * 3.6, 0); x.lineTo(i * 4.3, -24); }
      x.stroke();
      for (const y of [-5, -19]) { x.fillStyle = '#a89660'; x.fillRect(-15, y - 1.6, 30, 3.2); x.fillStyle = 'rgba(40,30,10,.5)'; x.fillRect(-15, y + 1, 30, 0.8); }
      x.restore();
      path(x, B); shade(x, -14, -25, 14, 1, m.from, 0.3);
      x.lineWidth = 1.4; x.strokeStyle = INK; path(x, B); x.stroke();
      x.beginPath(); x.ellipse(0, -24, 13.5, 1.6, 0, 0, TAU); x.fillStyle = '#2a1a10'; x.fill(); x.lineWidth = 1; x.strokeStyle = INK; x.stroke();
      lines(x, 'rgba(255,220,170,.4)', 0.9, [[-12.8, -23, 12.8, -23]]);
    },
    burner(x, m) {
      // incense burner (koro): bronze body on three curled legs, ear handles, a pierced lid with a knob
      for (const lx of [-13, 0, 13]) { path(x, [[lx - 3, -14], [lx + 3, -14], [lx + 2.2 + (lx ? Math.sign(lx) * 2 : 0), 0], [lx - 2.2 + (lx ? Math.sign(lx) * 2 : 0), 0]]); fillLine(x, '#2f2a1e', 1.2); }
      const B = [[-17, -12], [17, -12], [23, -20], [24.5, -27], [21, -35], [-21, -35], [-24.5, -27], [-23, -20]];
      path(x, B); fillLine(x, '#4a4230', 1.6);
      x.save(); path(x, B); x.clip();
      x.fillStyle = 'rgba(70,120,100,.45)'; x.beginPath(); x.ellipse(-8, -16, 12, 4, 0, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(190,160,90,.6)'; x.lineWidth = 1; x.beginPath(); x.moveTo(-24, -27); x.lineTo(24, -27); x.stroke();
      x.restore();
      path(x, B); shade(x, -25, -36, 25, -11, m.from, 0.38);
      x.lineWidth = 1.6; x.strokeStyle = INK; path(x, B); x.stroke();
      for (const s of [-1, 1]) { x.beginPath(); x.ellipse(s * 25, -31, 4, 5, 0, 0, TAU); x.lineWidth = 2.2; x.strokeStyle = INK; x.stroke(); x.lineWidth = 1.1; x.strokeStyle = '#6a5c3c'; x.stroke(); }
      // lid
      path(x, [[-20, -35], [20, -35], [15, -42], [-15, -42]]); fillLine(x, '#3d3727', 1.3);
      x.fillStyle = 'rgba(10,8,5,.8)'; for (const hx of [-9, -3, 3, 9]) { x.beginPath(); x.ellipse(hx, -38.6, 1.5, 1, 0, 0, TAU); x.fill(); }
      rr(x, -4.5, -49, 9, 7.5, 2.5); fillLine(x, '#4a4230', 1.2);
      x.beginPath(); x.arc(0, -50, 2.4, 0, TAU); fillLine(x, '#5a5038', 1);
      lines(x, 'rgba(255,230,170,.55)', 1.1, [[m.from > 0 ? 20 : -20, -33, m.from > 0 ? 22.5 : -22.5, -24], [-14, -41.4, 14, -41.4]]);
    },
  };
  // a sheathed katana lying across the rack: wrapped hilt, round guard, black lacquered scabbard
  function saya(x, y, i) {
    const x0 = -52 + i * 6, L = 104;
    x.save(); x.translate(0, y);
    rr(x, x0 + 26, -2.4, L - 26, 4.8, 2.2); fillLine(x, i ? '#22161a' : '#151318', 1.2);
    lines(x, 'rgba(220,210,240,.35)', 0.8, [[x0 + 28, -1.6, x0 + L - 3, -1.6]]);
    x.fillStyle = '#6a5a3c'; rr(x, x0 + L - 5, -2.6, 5, 5.2, 1.6); x.fill();
    rr(x, x0, -2.1, 24, 4.2, 1.8); fillLine(x, '#d9d0bf', 1.1);
    x.strokeStyle = '#1a1414'; x.lineWidth = 1; x.beginPath();
    for (let k = x0 + 2; k < x0 + 23; k += 3.2) { x.moveTo(k, -2); x.lineTo(k + 1.6, 0); x.lineTo(k, 2); }
    x.stroke();
    x.beginPath(); x.ellipse(x0 + 25, 0, 1.6, 4.2, 0, 0, TAU); fillLine(x, '#5c4a2a', 1);
    x.restore();
  }

  // ------------------------------------------------------------------------------------------ pictures (sprites)
  // scale: pixels per world unit in the cached pictures (a close-up on a 2× phone screen shows ~3 px per unit)
  const SC = () => (ND.gfx && (ND.gfx.tier === 'low' || ND.gfx.mobile) ? 3 : 4);
  let cache = {}, cacheKey = '';
  A.prepare = function (arena) {
    const k = arena + '|' + SC();
    if (k !== cacheKey) { for (const n in cache) { const c = cache[n].c; if (c) c.width = c.height = 0; } cache = {}; cacheKey = k; }
  };
  // the pictures of the props placed now and of their pieces, made at once (behind the round's start, not on the frame
  // something breaks: cutting a picture into pieces is a few milliseconds on a phone)
  A.warm = function () {
    for (const p of P.items) kindAtlas(p.k);
  };
  A.stats = () => ({ pictures: Object.keys(cache).length });
  // The pictures of one kind (its looks — a lantern lit and out, a rack with 2/1/0 swords — and all its pieces) live in
  // one canvas, the kind's atlas: with the WebGL2 renderer that is one texture, uploaded with the first frame that shows
  // the prop, so nothing new is uploaded on the frame things break. Each entry: { c, sx, sy, sw, sh, ox, oy, s }.
  const VARIANTS = { lantern: [['on', { lit: 1 }], ['off', { lit: 0 }]], rack: [['n2', { n: 2 }], ['n1', { n: 1 }], ['n0', { n: 0 }]] };
  function kindAtlas(k) {
    if (cache[k + '|atlas']) return;
    cache[k + '|atlas'] = { c: null };
    const parts = [];
    for (const [v, o] of VARIANTS[k] || [['', {}]]) parts.push([k + '|' + v, makeWhole(k, o)]);
    const base = parts[VARIANTS[k] ? parts.length - 1 : 0][1];
    for (const pc of KINDS[k]._pieces) parts.push([pieceKey(k, pc), makePiece(k, pc, base)]);
    // shelf packing, rows up to 1024 px wide, 2 px apart
    let x = 0, y = 0, rowH = 0, W = 0;
    const at = [];
    for (const [, S] of parts) {
      if (x + S.c.width > 1024 && x > 0) { x = 0; y += rowH + 2; rowH = 0; }
      at.push([x, y]); x += S.c.width + 2; rowH = Math.max(rowH, S.c.height); W = Math.max(W, x);
    }
    const c = document.createElement('canvas'); c.width = Math.max(1, W); c.height = Math.max(1, y + rowH);
    const g = c.getContext('2d');
    parts.forEach(([key, S], i) => {
      g.drawImage(S.c, at[i][0], at[i][1]);
      cache[key] = { c, sx: at[i][0], sy: at[i][1], sw: S.c.width, sh: S.c.height, ox: S.ox, oy: S.oy, s: S.s };
    });
    for (const [, S] of parts) S.c.width = S.c.height = 0; // the loose pictures are not kept
    cache[k + '|atlas'].c = c;
  }
  function sprite(k, v, o) {
    const key = k + '|' + v;
    if (!cache[key]) kindAtlas(k);
    return cache[key] || (cache[key] = makeWhole(k, o || {}));
  }
  // the whole prop: { c (canvas), ox, oy: where its origin (bottom middle) is, s: scale }
  function makeWhole(k, o) {
    const K = KINDS[k], s = SC(), m = mood(ND.scene && ND.scene.theme);
    const pad = 6, ex = k === 'rack' ? 30 : 0, w = Math.ceil((K.w + pad * 2 + ex * 2) * s), h = Math.ceil((K.h + pad * 2 + 8) * s);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    const ox = (K.w / 2 + pad + ex) * s, oy = (K.h + pad + 8) * s;
    x.setTransform(s, 0, 0, s, ox, oy); x.lineJoin = 'round'; x.lineCap = 'round';
    if (K.sc !== 1) x.scale(K.sc, K.sc);
    ART[k](x, m, o);
    // the arena's own light: a mood wash, then the key light from its side
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = m.wash; x.fillRect(0, 0, w, h);
    const g = x.createLinearGradient(m.from > 0 ? w : 0, 0, m.from > 0 ? w * 0.45 : w * 0.55, 0);
    g.addColorStop(0, m.rim); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'source-over';
    return { c, ox, oy, s };
  }
  const variant = (p) => (p.k === 'lantern' ? (p.lit > 0.5 ? 'on' : 'off') : p.k === 'rack' ? 'n' + p.n : '');
  const pieceKeys = new WeakMap();
  let pieceN = 0;
  function pieceKey(k, pc) {
    let id = pieceKeys.get(pc);
    if (id == null) { id = ++pieceN; pieceKeys.set(pc, id); }
    return k + '#' + id;
  }
  // a piece: from the kind's atlas (its regular pieces), or made when first needed (the two halves of a blade cut)
  function pieceSprite(k, pc) {
    const key = pieceKey(k, pc);
    if (cache[key]) return cache[key];
    if (!pc.cut) kindAtlas(k);
    if (cache[key]) return cache[key];
    const base = makeWhole(k, k === 'lantern' ? { lit: 0 } : k === 'rack' ? { n: 0 } : {});
    const S = cache[key] = makePiece(k, pc, base);
    base.c.width = base.c.height = 0;
    return S;
  }
  // the prop's picture cut along the piece's outline, fracture lines on the broken edges
  function makePiece(k, pc, full) {
    const K = KINDS[k], s = full.s;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const poly of pc.polys) for (const q of poly) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    x0 -= 2; y0 -= 2; x1 += 2; y1 += 2;
    const w = Math.max(2, Math.ceil((x1 - x0) * s)), h = Math.max(2, Math.ceil((y1 - y0) * s));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.drawImage(full.c, -(x0 * s + full.ox), -(y0 * s + full.oy));
    x.setTransform(s, 0, 0, s, -x0 * s, -y0 * s);
    const outline = () => { x.beginPath(); for (const poly of pc.polys) { x.moveTo(poly[0][0], poly[0][1]); for (let i = 1; i < poly.length; i++) x.lineTo(poly[i][0], poly[i][1]); x.closePath(); } };
    x.globalCompositeOperation = 'destination-in'; outline(); x.fillStyle = '#000'; x.fill();
    // the broken edges: unglazed clay / fresh wood / torn paper shows pale along the cut
    const mat = K.mat, fr = mat === 'ceramic' ? 'rgba(222,196,160,.9)' : mat === 'wood' ? 'rgba(236,200,150,.85)' : mat === 'straw' ? 'rgba(230,206,140,.7)' : 'rgba(240,230,210,.8)';
    x.globalCompositeOperation = 'source-atop';
    if (pc.cut) {
      // a clean blade cut: one bright straight edge along the cut line
      const [cx, cy, th] = pc.cut, cs = Math.cos(th), sn = Math.sin(th);
      x.strokeStyle = fr; x.lineWidth = 1.6; x.beginPath(); x.moveTo(cx - cs * 200, cy - sn * 200); x.lineTo(cx + cs * 200, cy + sn * 200); x.stroke();
    } else {
      // (the piece's own outline, not the triangles it is filled with)
      const edge = () => { const e = pc.edge; if (!e) { outline(); return; } x.beginPath(); x.moveTo(e[0][0], e[0][1]); for (let i = 1; i < e.length; i++) x.lineTo(e[i][0], e[i][1]); x.closePath(); };
      x.strokeStyle = fr; x.lineWidth = mat === 'ceramic' ? 1.3 : 1.1; edge(); x.stroke();
      x.strokeStyle = 'rgba(10,8,6,.55)'; x.lineWidth = 0.6; edge(); x.stroke();
    }
    x.globalCompositeOperation = 'source-over';
    // origin = the piece's centre of mass (the shard's position)
    return { c, ox: (pc.cx - x0) * s, oy: (pc.cy - y0) * s, s };
  }
  A.sprite = sprite; A.pieceSprite = pieceSprite;

  // ------------------------------------------------------------------------------------------ live pictures
  // soft glow (lighter), made once per colour
  const glows = {};
  function glow(ctx, c, x, y, rx, ry, a) {
    if (!(a > 0)) return;
    let g = glows[c];
    if (!g) {
      g = glows[c] = document.createElement('canvas'); g.width = g.height = 96;
      const q = g.getContext('2d'), rg = q.createRadialGradient(48, 48, 0, 48, 48, 48);
      rg.addColorStop(0, `rgba(${c},1)`); rg.addColorStop(0.3, `rgba(${c},.42)`); rg.addColorStop(0.65, `rgba(${c},.1)`); rg.addColorStop(1, `rgba(${c},0)`);
      q.fillStyle = rg; q.fillRect(0, 0, 96, 96);
    }
    ctx.globalAlpha = Math.min(1, a); ctx.drawImage(g, x - rx, y - ry, rx * 2, ry * 2);
  }
  // a contact shadow under each prop (flatter and fainter as it rises)
  let SHG = null;
  function shadow(ctx, x, gz, w, h, a) {
    if (!SHG) {
      SHG = document.createElement('canvas'); SHG.width = SHG.height = 64;
      const q = SHG.getContext('2d'), g = q.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      q.fillStyle = g; q.fillRect(0, 0, 64, 64);
    }
    ctx.globalAlpha = a; ctx.drawImage(SHG, x - w, gz + 1 - h, w * 2, h * 2);
  }
  function place(ctx, S, x, y, a, fl) {
    const k = 1 / S.s, c = Math.cos(a), s = Math.sin(a);
    // world: translate(x, y) · rotate(a) · scale(fl·k, k) · translate(-ox, -oy)
    ctx.transform(c * fl * k, s * fl * k, -s * k, c * k, x, y);
    if (S.sw) ctx.drawImage(S.c, S.sx, S.sy, S.sw, S.sh, -S.ox, -S.oy, S.sw, S.sh);
    else ctx.drawImage(S.c, -S.ox, -S.oy);
  }
  // draw prop p at (x, y, a) — its centre of mass — as the prop's picture
  function drawProp(ctx, p, x, y, a, fl) {
    const K = KINDS[p.k], S = sprite(p.k, variant(p), p);
    ctx.save();
    // origin of the picture is the bottom middle: move from the centre of mass to it
    const c = Math.cos(a), s = Math.sin(a), lx = -K._com[0] * fl, ly = -K._com[1];
    place(ctx, S, x + c * lx - s * ly, y + s * lx + c * ly, a, fl);
    ctx.restore();
  }

  // The duel: a prop in the hands must read at phone size against a dark arena and a dark body - drawn a little bigger
  // (round the grip), its wood lighter, with a thin warm light outline (a silhouette of the prop drawn 8 times round it).
  const SIL = new WeakMap();
  function silhouette(S) {
    let o = SIL.get(S);
    if (o) return o;
    const c = document.createElement('canvas'); c.width = S.sw || S.c.width; c.height = S.sh || S.c.height;
    const g = c.getContext('2d');
    if (S.sw) g.drawImage(S.c, S.sx, S.sy, S.sw, S.sh, 0, 0, S.sw, S.sh); else g.drawImage(S.c, 0, 0);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(255,226,170)'; g.fillRect(0, 0, c.width, c.height);
    o = { c, ox: S.ox, oy: S.oy, s: S.s };
    SIL.set(S, o);
    return o;
  }
  function heldBright(ctx, p, X) {
    const K = KINDS[p.k], S = sprite(p.k, variant(p), p), sc = 1.18, fl = X.fx, a = X.a;
    const c = Math.cos(a), s = Math.sin(a), lx = -K._com[0] * fl, ly = -K._com[1];
    // (scaled round the hand, so the grip stays in the fist)
    const bx = X.hx + (X.x + c * lx - s * ly - X.hx) * sc, by = X.hy + (X.y + s * lx + c * ly - X.hy) * sc;
    const sil = silhouette(S), d = 1.6;
    ctx.save(); ctx.globalAlpha = 0.85;
    for (let i = 0; i < 8; i++) {
      const th = (i / 8) * Math.PI * 2;
      ctx.save(); place(ctx, { c: sil.c, ox: sil.ox, oy: sil.oy, s: sil.s / sc }, bx + Math.cos(th) * d, by + Math.sin(th) * d, a, fl); ctx.restore();
    }
    ctx.restore();
    ctx.save(); place(ctx, { c: S.c, sx: S.sx, sy: S.sy, sw: S.sw, sh: S.sh, ox: S.ox, oy: S.oy, s: S.s / sc }, bx, by, a, fl); ctx.restore();
    // (the wood a shade lighter: the prop again, added at a third)
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3;
    place(ctx, { c: S.c, sx: S.sx, sy: S.sy, sw: S.sw, sh: S.sh, ox: S.ox, oy: S.oy, s: S.s / sc }, bx, by, a, fl);
    ctx.restore();
  }
  // the held prop where the DRAWN hand is (display joints), the same rule as the simulation's holdPose
  const XF = { x: 0, y: 0, a: 0, hx: 0, hy: 0, fx: 1 };
  function heldAt(p, f) {
    const K = KINDS[p.k], j = f.viewJ(), d = f.dir < 0 ? -1 : 1, front = p.hand === 'F';
    const moving = f.state === 'atk' && f.atk && f.atk.prop;
    const el = front ? j.elF : j.elB, ha = front ? j.haF : j.haB;
    if (!el || !ha) return null;
    const phi = Math.atan2(ha.y - el.y, (ha.x - el.x) * d);
    const a = moving || front ? (K.upright ? Math.max(-0.9, Math.min(0.9, phi * 0.35)) : phi + (K.hold || 0)) : 0;
    XF.a = d * a; XF.fx = d; XF.hx = ha.x; XF.hy = ha.y;
    const gx = (K.grip[0] - K._com[0]) * d, gy = K.grip[1] - K._com[1], c = Math.cos(XF.a), s = Math.sin(XF.a);
    XF.x = ha.x - (c * gx - s * gy); XF.y = ha.y - (s * gx + c * gy);
    return XF;
  }
  // Drawn body only: while a fighter carries a prop (no prop move running), its back hand hangs at its side holding it,
  // off the sword's hilt. Changes the display joints (js/anim.js), never the fight's own.
  function carryArm(f) {
    const S = f._anim;
    if (!S || !S.ok || f.dead) return;
    const j = S.j, d = f.dir < 0 ? -1 : 1;
    if (!j.sh || !j.haB || !j.elB) return;
    const sx = j.sh.x - 3 * d, sy = j.sh.y + 1, tx = j.sh.x + d * 21, ty = j.sh.y + 40;
    const l1 = 30, l2 = 29, dx = tx - sx, dy = ty - sy, dd = Math.min(l1 + l2 - 0.01, Math.hypot(dx, dy)) || 1e-3;
    const base = Math.atan2(dy, dx), an = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd))));
    // the elbow: of the two solutions, the lower one (hangs under the forearm)
    const e1 = base + an, e2 = base - an, e = Math.sin(e1) > Math.sin(e2) ? e1 : e2;
    j.elB.x = sx + Math.cos(e) * l1; j.elB.y = sy + Math.sin(e) * l1;
    j.haB.x = sx + Math.cos(base) * dd; j.haB.y = sy + Math.sin(base) * dd;
  }
  // a gloved fist closing over the grip (drawn over the held prop)
  function fist(ctx, f, x, y, a) {
    const D = ND._draw && ND._draw.pal ? ND._draw.pal(f.col) : null;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = D ? D.glove : '#222'; ctx.strokeStyle = D ? D.line : INK; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(0, 0, 4.6, 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 0.7; ctx.beginPath();
    for (let k = -1; k <= 1; k++) { ctx.moveTo(k * 2.2, -1); ctx.lineTo(k * 2.2, 3.6); }
    ctx.stroke(); ctx.restore();
  }

  // ------------------------------------------------------------------------------------------ the draw passes
  // 'back': before the fighters (props on the floor, pieces, carried props, lantern light, incense smoke)
  // 'front': after the fighters (props swung or thrown at them, the fists on them, liquid, splinters, dizzy stars)
  A.draw = function (ctx, layer) {
    if (!P.live) return;
    const g = ND.game, F = g ? g.F : [], t = ND.scene ? ND.scene.t : 0;
    cam.world(ctx);
    ctx.save();
    if (layer === 'back') {
      // (on guard the prop comes up in front with the guard's hands: it is what blocks)
      for (const f of F) if (P.held(f) && !(f.state === 'atk' && f.atk && f.atk.prop) && !GUARDS[f.state] && handOfDrawn(f) === 'B') carryArm(f);
      // contact shadows
      ctx.globalCompositeOperation = 'source-over';
      for (const p of P.items) {
        if (p.st === 3 || p.st === 2) continue;
        const K = KINDS[p.k], lift = Math.max(0, p.gz - (p.y - K._com[1] * Math.cos(p.a)));
        const sup = p.sup >= 0 ? P.get(p.sup) : null;
        if (sup) continue;
        shadow(ctx, p.x, p.gz, K.w * 0.62 * Math.max(0.4, 1 - lift / 300), 4.5, 0.5 * Math.max(0.15, 1 - lift / 200));
      }
      ctx.globalAlpha = 1;
      // shards (pieces on the floor first, so a falling one is drawn over them)
      for (const d of P.shards) {
        const pc = P.shardPiece(d);
        const a = d.fade > 0 ? Math.max(0, 1 - d.fade) : 1;
        if (a <= 0) continue;
        ctx.globalAlpha = a;
        ctx.save();
        if (d.sword) { swordShard(ctx, d); ctx.restore(); continue; }
        place(ctx, pieceSprite(d.k, pc), d.x, d.y, d.a, d.fl);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      // props (resting and moving; not the ones flying at the fighters' line: those go in front)
      for (const p of P.items) {
        if (p.st === 3 || p.st === 2 || (p.st === 1 && p.owner >= 0)) continue;
        drawProp(ctx, p, p.x, p.y, p.a, p.fx);
      }
      // light and smoke
      ctx.globalCompositeOperation = 'lighter';
      for (const p of P.items) {
        if (p.k !== 'lantern' || p.st === 3) continue;
        const fl = 0.86 + 0.14 * Math.sin(t * 11 + p.id) * Math.sin(t * 6.7 + p.id * 2), up = Math.cos(p.a);
        glow(ctx, '255,176,90', p.x, p.y - 8 * up, 120, 110, 0.32 * fl * p.lit);
        glow(ctx, '255,200,120', p.x, p.gz + 4, 110, 16, 0.4 * fl * p.lit);
      }
      ctx.globalCompositeOperation = 'source-over';
      for (const p of P.items) if (p.k === 'burner' && p.st === 0 && Math.abs(p.a) < 0.3) smoke(ctx, p, t);
    } else {
      // swung and thrown props, with the fist over a held one
      for (const p of P.items) {
        if (p.st === 1 && p.owner >= 0) drawProp(ctx, p, p.x, p.y, p.a, p.fx);
        if (p.st !== 2) continue;
        const f = F[p.hold];
        if (!f) continue;
        const X = heldAt(p, f);
        if (!X) continue;
        const hx = X.hx, hy = X.hy, a = X.a;
        if (f.dz) heldBright(ctx, p, X); else drawProp(ctx, p, X.x, X.y, a, X.fx);
        fist(ctx, f, hx, hy, a);
      }
      particles(ctx, t);
      for (const f of F) if (P.S.dizzy[f.id] > 0 && !f.dead) dizzy(ctx, f, P.S.dizzy[f.id], t);
    }
    ctx.restore();
    if (layer === 'front') ctx.globalAlpha = 1;
  };
  const GUARDS = { guard: 1, block: 1, parry: 1 };
  const handOfDrawn = (f) => (P.handOf ? P.handOf(f) : 'B');
  function swordShard(ctx, d) {
    const c = Math.cos(d.a), s = Math.sin(d.a);
    ctx.transform(c, s, -s, c, d.x, d.y);
    ctx.translate(62, 0); ctx.scale(1.2, 1.2);
    saya(ctx, 0, 0);
  }
  function smoke(ctx, p, t) {
    ctx.fillStyle = 'rgb(214,214,224)';
    for (let i = 0; i < 4; i++) {
      const ph = ((t * 0.18 + i / 4 + p.id * 0.37) % 1 + 1) % 1;
      ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.09;
      ctx.beginPath(); ctx.arc(p.x + Math.sin(ph * 5 + i) * 7 + ph * (ND.scene ? ND.scene.wind : 0) * 0.08, p.y - 30 - ph * 120, 4 + ph * 16, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function particles(ctx, t) {
    const L = P.fxp;
    if (!L.length) return;
    const low = ND.gfx && ND.gfx.tier === 'low';
    ctx.lineCap = 'round';
    for (const q of L) {
      const u = Math.max(0, q.life / q.max);
      if (q.k === 'lq') {
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.85 * Math.min(1, u * 3);
        ctx.strokeStyle = `rgb(${q.c})`; ctx.lineWidth = q.r * 1.7;
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * 0.018, q.y - q.vy * 0.018); ctx.stroke();
      } else if (q.k === 'sp') {
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, u * 2.5);
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a); ctx.fillStyle = '#7a5434'; ctx.fillRect(-q.l / 2, -0.9, q.l, 1.8); ctx.restore();
      } else if (q.k === 'st') {
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, u * 2);
        ctx.strokeStyle = '#c4a560'; ctx.lineWidth = 0.9;
        const c = Math.cos(q.a) * q.l / 2, s = Math.sin(q.a) * q.l / 2;
        ctx.beginPath(); ctx.moveTo(q.x - c, q.y - s); ctx.lineTo(q.x + c, q.y + s); ctx.stroke();
      } else if (q.k === 'cr') {
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, u * 2);
        ctx.fillStyle = '#d6cbb6'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill();
      } else if (q.k === 'pp') {
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, u * 2.5);
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a); ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(q.ph)));
        ctx.fillStyle = '#e6dac0'; ctx.fillRect(-q.s / 2, -q.s / 3, q.s, q.s * 0.66); ctx.restore();
      } else if (q.k === 'em') {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, u * 1.6);
        ctx.fillStyle = 'rgb(255,170,70)'; ctx.beginPath(); ctx.arc(q.x, q.y, 1.4, 0, TAU); ctx.fill();
      } else if (q.k === 'out' && !low) {
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, '255,190,110', q.x, q.y, 40 + (1 - u) * 90, 40 + (1 - u) * 80, u * 0.9);
      }
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  // dizzy: three small ink-and-gold stars circling the head while the stun lasts
  function dizzy(ctx, f, left, t) {
    const j = f.viewJ();
    if (!j || !j.head) return;
    const a = Math.min(1, left * 2.5);
    for (let i = 0; i < 3; i++) {
      const ang = t * 7 + (i * TAU) / 3, x = j.head.x + Math.cos(ang) * 17, y = j.head.y - 17 + Math.sin(ang) * 5;
      ctx.globalAlpha = a * (0.55 + 0.45 * (Math.sin(ang) + 1) / 2);
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 4 + i);
      ctx.beginPath();
      for (let k = 0; k < 8; k++) { const r = k % 2 ? 1.5 : 4.2, b = (k * Math.PI) / 4; ctx.lineTo(Math.cos(b) * r, Math.sin(b) * r); }
      ctx.closePath(); ctx.fillStyle = '#ffd98a'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
})(window.ND);
