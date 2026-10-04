




(function (ND) {
  'use strict';
  const D = ND.duel;
  if (!D || !D.FIN || !ND.cine) return;
  const G = ND.game, cam = ND.cam, fx = ND.fx, au = ND.audio;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const oc = (t) => 1 - Math.pow(1 - t, 3);
  const NUM = ['', '一', '二', '三'];
  const U = (D.finUi = { strokes: [], card: null, bars: 0, gathers: [], petals: [], smoke: [] });
  const sim = () => !!G.simOnly;
  const tt = (s) => (ND.i18n ? ND.i18n.t(s) : s);


  try { localStorage.removeItem('sd_fin_seen'); } catch (e) {                    }

  D.finFx = (k, c, o) => {
    if (sim()) return;
    const A = c.A, V = c.V, S = D.FIN_SCRIPTS[c.key] || {};
    const col = (A.col && A.col.ui) || '#e04a3c';
    switch (k) {
      case 'start': {
        U.card = null;
        au.whoosh(1.1 + 0.15 * c.tier);
        if (c.tier >= 2 || c.un) au.taiko(0.9 + 0.1 * c.tier);
        if (au.kShing) au.kShing(A.pan);
        cam.punch(5 + 2 * c.tier);
        break;
      }
      case 'cut': {
        const L = ND.ARENA - 260, x = Math.max(-L, Math.min(L, D.finCamX(c, o.on)));
        cam.x = x; cam.y = o.y || -112; cam.z = Math.min(o.z || 1.35, D.lite ? 1.6 : 9);
        break;
      }
      case 'ink': {
        const dir = A.x <= V.x ? 1 : -1;
        U.strokes.push({ x: V.x - dir * 6, y: V.y - (o.y || 112), a: (o.a || 0) * dir, len: o.len || 0.4, w: o.w || 1, col, age: 0, life: 0.6, seed: (c.t * 977) % 1 });
        break;
      }
      case 'card':
        if (S.card) U.card = { k: S.card.k, n: S.card.n, tier: c.un ? 0 : c.tier, un: c.un, col, side: A.id, age: 0, life: 1.7 };
        break;
      case 'gather':
        U.gathers.push({ f: A, age: 0, life: 0.45, col });
        au.tone({ freq: 320, freq1: 980, dur: 0.42, gain: 0.05, send: 0.5, pan: A.pan, type: 'triangle' });
        break;
      case 'click':
        au.tone({ freq: 2600, dur: 0.06, gain: 0.08, send: 0.25, pan: A.pan, type: 'square' });
        au.tone({ freq: 1800, dur: 0.12, gain: 0.05, send: 0.5, pan: A.pan, delay: 0.03 });
        break;
      case 'snap':
        au.noise({ type: 'bandpass', f0: 3200, f1: 1800, q: 2, dur: 0.07, gain: 0.18, send: 0.2, pan: A.pan });
        au.noise({ type: 'bandpass', f0: 3600, f1: 2000, q: 2, dur: 0.07, gain: 0.16, send: 0.2, pan: A.pan, delay: 0.06 });
        break;
      case 'petals': { if (D.lite) break;
        const n = o.n || 10, acc = o.col || (A.col && A.col.accent) || col;
        for (let i = 0; i < n; i++) U.petals.push({ x: A.x + (Math.random() - 0.5) * 220, y: A.y - 60 - Math.random() * 140, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 60, a: Math.random() * 6.28, va: (Math.random() - 0.5) * 8, age: 0, life: 1 + Math.random() * 0.8, col: acc });
        break;
      }
      case 'thud':
        au.taiko(0.9); au.thud(1.1, A.pan); fx.dust(A.x + A.dir * 60, 0, 10, 1.2); cam.punch(6);
        break;
      case 'roar':
        au.noise({ type: 'lowpass', f0: 420, f1: 180, dur: 0.6, gain: 0.32, attack: 0.08, send: 0.3, pan: A.pan });
        au.tone({ freq: 110, freq1: 80, dur: 0.55, gain: 0.2, send: 0.3, pan: A.pan, type: 'sawtooth' });
        break;
      case 'chain':
        for (let i = 0; i < 5; i++) au.tone({ freq: 2400 + i * 180, dur: 0.07, gain: 0.05, send: 0.3, pan: A.pan, delay: i * 0.07, type: 'square' });
        break;
      case 'smoke': { if (D.lite) break;
        const sc = o.col || 'rgba(20,18,28,';
        for (let i = 0; i < 9; i++) U.smoke.push({ x: A.x + (Math.random() - 0.5) * 70, y: A.y - 30 - Math.random() * 150, r: 16 + Math.random() * 18, vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 30, age: 0, life: 0.6 + Math.random() * 0.4, col: sc });
        au.noise({ type: 'bandpass', f0: 900, f1: 300, q: 1, dur: 0.3, gain: 0.18, send: 0.4, pan: A.pan });
        break;
      }
    }
  };





  const HINT_KEY = 'sd_fin_hint';
  const hintN = (() => { try { return JSON.parse(localStorage.getItem(HINT_KEY) || '[0,0]'); } catch (e) { return [0, 0]; } })();
  const saveHint = () => { try { localStorage.setItem(HINT_KEY, JSON.stringify(hintN)); } catch (e) {               } };
  U.hint = null; U.hintChain = 0;
  function hintStep() {


    const F = G.F; if (!F || G.phase !== 'fight' || G.mode === 'attract' || G.mode === 'watch' || (ND.tutor && ND.tutor.on)) return;
    const me = F.find((f) => G.isHuman && G.isHuman(f) && f.dz);
    if (!me || U.hint) return;
    const z = me.dz, tier = D.FIN.tierOf(z.chain);
    if (z.chain > 0 && U.hintChain === 0 && hintN[0] < 3 && !z.cine) { hintN[0]++; saveHint(); U.hint = { s: 'Block or parry, then strike back at once!', age: 0, life: 3 }; }
    else if (tier >= 2 && tier > (z.finTier || 0) && z.chainT <= D.FIN.win && hintN[1] < 2 && !z.cine) { hintN[1]++; saveHint(); U.hint = { s: 'Defend more for a stronger counter: 一 二 三', age: 0, life: 3 }; }
    U.hintChain = z.chain;
  }
  function drawHint(ctx, u, rdt) {
    const h = U.hint; if (!h) return;
    h.age += rdt; if (h.age >= h.life || active()) { U.hint = null; return; }
    const a = h.age < 0.2 ? h.age / 0.2 : h.age > h.life - 0.4 ? (h.life - h.age) / 0.4 : 1;
    const tch = !!(ND.touch && ND.touch.active), k = tch ? Math.max(u, (G.pxr || 1) * 0.8) : Math.max(u, 0.85), s = D.tr ? D.tr(h.s) : h.s, sz = Math.round(15 * k);
    ctx.font = `600 ${sz}px "Source Sans 3", "Noto Serif JP", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = Math.min(cam.W - 20, ctx.measureText(s).width + 24 * k), x = cam.W / 2, y = cam.H * 0.2;
    ctx.globalAlpha = a * 0.8; ctx.fillStyle = 'rgba(6,6,10,.8)'; ctx.fillRect(x - w / 2, y - sz, w, sz * 2);
    ctx.globalAlpha = a; ctx.fillStyle = '#ffd27a'; ctx.fillText(s, x, y + k, cam.W - 30);
    ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
  }
  function active() { const F = G.F; if (!F) return null; for (const f of F) { const c = D.finOf && D.finOf(f); if (c) return c; } return null; }




  const follow0 = cam.follow;
  cam.follow = function (dt, fa, fb, focus) {
    const c = focus && active();
    if (c) {


      let z = focus.z, x = focus.x;
      const V = c.V, A = c.A;
      if (V && (V.state === 'launch' || V.state === 'down' || V.state === 'getup')) {
        const lo = Math.min(A.x, V.x) - 110, hi = Math.max(A.x, V.x) + 110;
        z = Math.min(z, Math.max(1.05, this.W / (this.s * (hi - lo))));
        const half = this.W / (2 * this.s * z);
        x = Math.max(hi - half, Math.min(lo + half, x));
      }


      let y = focus.y;
      const apex = (f) => f.y + (f.vy < 0 ? -(f.vy * f.vy) / 5000 : 0), top = Math.min(apex(A), apex(V)) - 300, room = this.gy - this.H * 0.075;
      if ((y - top) * this.s * z > room) {
        const k = this.s * z, yFloor = -(this.H - 30 - this.gy) / k;
        y = Math.max(yFloor, top + room / k);
        if ((y - top) * this.s * z > room) z = Math.max(0.9, room / (this.s * (y - top)));
      }
      if (D.lite) z = Math.min(z, 1.6);
      if (z !== focus.z || x !== focus.x || y !== focus.y) focus = { x, y, z };
    }
    return follow0.call(this, dt, fa, fb, focus);
  };

  const text0 = fx.text;
  fx.text = function () { if (active()) return; return text0.apply(this, arguments); };

  const combo0 = ND.cine.combo;
  ND.cine.combo = function (from, to, hits, name) { if (active()) return true; return combo0.call(this, from, to, hits, name); };


  const draw0 = ND.cine.draw;
  ND.cine.draw = function (ctx) {
    draw0.call(this, ctx);
    if (!G.F || !(G.phase === 'fight' || G.phase === 'ko')) { U.strokes.length = 0; U.petals.length = 0; U.smoke.length = 0; U.card = null; U.bars = 0; return; }
    const now = ND.scene ? ND.scene.t : 0, dt = U.lt != null ? clamp(now - U.lt, 0, 0.1) : 0; U.lt = now;

    const rdt = G.slow > 0 ? dt / Math.max(0.2, G.slow) : dt;
    const c = active();
    U.bars = clamp(U.bars + (c ? 1 : -1) * rdt * 5, 0, 1);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const u = Math.max(cam.ui || cam.s, 0.55);
    if (U.bars > 0) {
      const h = cam.H * 0.055 * oc(U.bars);
      ctx.fillStyle = 'rgba(4,4,8,.85)'; ctx.fillRect(0, 0, cam.W, h); ctx.fillRect(0, cam.H - h, cam.W, h);
    }
    for (let i = U.gathers.length - 1; i >= 0; i--) { const g = U.gathers[i]; g.age += rdt; if (g.age >= g.life) { U.gathers.splice(i, 1); continue; } drawGather(ctx, g); }
    for (let i = U.smoke.length - 1; i >= 0; i--) { const p = U.smoke[i]; p.age += rdt; if (p.age >= p.life) { U.smoke.splice(i, 1); continue; } p.x += p.vx * rdt; p.y += p.vy * rdt; const u2 = p.age / p.life; ctx.fillStyle = p.col + (0.55 * (1 - u2)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(cam.sx(p.x), cam.sy(p.y), (p.r + 20 * u2) * cam.k, 0, 6.283); ctx.fill(); }
    for (let i = U.petals.length - 1; i >= 0; i--) { const p = U.petals[i]; p.age += rdt; if (p.age >= p.life) { U.petals.splice(i, 1); continue; } p.vy += 60 * rdt; p.x += (p.vx + Math.sin(p.age * 5 + p.a) * 40) * rdt; p.y += p.vy * rdt; p.a += p.va * rdt; drawPetal(ctx, p); }
    for (let i = U.strokes.length - 1; i >= 0; i--) { const s = U.strokes[i]; s.age += rdt; if (s.age >= s.life) { U.strokes.splice(i, 1); continue; } drawStroke(ctx, s); }
    hintStep(); drawHint(ctx, u, rdt);
    if (U.card) { U.card.age += rdt; if (U.card.age >= U.card.life) U.card = null; else drawCard(ctx, U.card, u); }
    ctx.restore();
  };


  function drawStroke(ctx, s) {
    const u = s.age / s.life, grow = oc(clamp(s.age / 0.08, 0, 1)), fade = u < 0.45 ? 1 : 1 - (u - 0.45) / 0.55;
    const x = cam.sx(s.x), y = cam.sy(s.y), L = cam.W * s.len * 0.5 * grow, c = Math.cos(s.a), sn = Math.sin(s.a);
    const W = 9 * cam.k * s.w;
    const band = (w, style, alpha, off) => {
      const nx = -sn * w, ny = c * w, ox = -sn * off, oy = c * off;
      ctx.globalAlpha = alpha * fade; ctx.fillStyle = style;
      ctx.beginPath();
      ctx.moveTo(x - c * L + ox, y - sn * L + oy);
      ctx.quadraticCurveTo(x - c * L * 0.4 + nx + ox, y - sn * L * 0.4 + ny + oy, x + nx * 0.6 + ox, y + ny * 0.6 + oy);
      ctx.lineTo(x + c * L + ox, y + sn * L + oy);
      ctx.lineTo(x - nx * 0.5 + ox, y - ny * 0.5 + oy);
      ctx.quadraticCurveTo(x - c * L * 0.4 - nx * 0.6 + ox, y - sn * L * 0.4 - ny * 0.6 + oy, x - c * L + ox, y - sn * L + oy);
      ctx.closePath(); ctx.fill();
    };
    band(W, 'rgb(8,7,10)', 0.7, 0);

    ctx.globalAlpha = 0.35 * fade; ctx.strokeStyle = 'rgba(230,220,200,.5)'; ctx.lineWidth = Math.max(1, cam.k);
    for (let i = 0; i < 3; i++) {
      const o = (i - 1) * W * 0.35, t0 = 0.15 + ((s.seed * 7 + i * 0.31) % 0.4);
      ctx.beginPath(); ctx.moveTo(x + c * L * t0 - sn * o, y + sn * L * t0 + c * o); ctx.lineTo(x + c * L * (t0 + 0.35) - sn * o, y + sn * L * (t0 + 0.35) + c * o); ctx.stroke();
    }
    band(W * 0.28, s.col, 0.85, 0);
    ctx.globalAlpha = 1;
  }
  function drawPetal(ctx, p) {
    const k = cam.k, x = cam.sx(p.x), y = cam.sy(p.y), u = p.age / p.life;
    ctx.globalAlpha = (u < 0.15 ? u / 0.15 : u > 0.7 ? (1 - u) / 0.3 : 1) * 0.85; ctx.fillStyle = p.col;
    ctx.beginPath(); ctx.ellipse(x, y, 4.2 * k, 2.2 * k * Math.abs(Math.cos(p.a)) + 0.6 * k, p.a, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
  }

  function drawGather(ctx, g) {
    const f = g.f, u = g.age / g.life, hx = cam.sx(f.x + f.dir * 6), hy = cam.sy(f.y - 92), k = cam.k;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const a = i * 0.698 + g.age * 2, r = (70 - 62 * oc(u)) * k;
      ctx.globalAlpha = (1 - u) * 0.8; ctx.fillStyle = g.col;
      ctx.beginPath(); ctx.arc(hx + Math.cos(a) * r, hy + Math.sin(a) * r * 0.6, 2.2 * k, 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }


  function drawCard(ctx, cd, u) {
    const t = cd.age, inT = oc(clamp(t / 0.18, 0, 1)), a = t < cd.life - 0.3 ? 1 : (cd.life - t) / 0.3;
    const tch = !!(ND.touch && ND.touch.active), pr = G.pxr || 1, k = tch ? Math.max(u, pr * 0.8) : Math.max(u, 0.8);
    const left = cd.side === 0, bw = Math.min(cam.W * 0.42, 300 * k), bh = 62 * k;
    const x0 = left ? cam.W * 0.06 : cam.W * 0.94 - bw, y0 = cam.H * (tch ? 0.6 : 0.68);
    const slide = (1 - inT) * 40 * k * (left ? -1 : 1);
    ctx.globalAlpha = a;
    ctx.save(); ctx.translate(slide, 0);

    ctx.fillStyle = 'rgba(6,6,10,.74)';
    ctx.beginPath(); ctx.moveTo(x0, y0 + 8 * k); ctx.quadraticCurveTo(x0 + bw * 0.5, y0 - 4 * k, x0 + bw * inT, y0 + 4 * k);
    ctx.lineTo(x0 + bw * inT - 14 * k, y0 + bh); ctx.quadraticCurveTo(x0 + bw * 0.45, y0 + bh + 6 * k, x0 + 10 * k, y0 + bh - 4 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = cd.col; ctx.fillRect(x0 + 12 * k, y0 + bh - 9 * k, (bw - 34 * k) * inT, 2.5 * k);

    const sx = x0 + 26 * k, sy = y0 + bh * 0.45, sr = 15 * k;
    ctx.fillStyle = cd.col; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    ctx.fillStyle = 'rgba(12,8,8,.92)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round((cd.un ? 11 : 19) * k)}px "Noto Serif JP", serif`;
    ctx.fillText(cd.un ? '素手' : NUM[cd.tier] || '', sx, sy + k);

    ctx.textAlign = 'left';
    ctx.font = `700 ${Math.round(26 * k)}px "Noto Serif JP", serif`;
    ctx.lineWidth = 4 * k; ctx.strokeStyle = 'rgba(5,5,8,.9)'; ctx.strokeText(cd.k, sx + sr + 12 * k, y0 + 22 * k);
    ctx.fillStyle = '#f3ead8'; ctx.fillText(cd.k, sx + sr + 12 * k, y0 + 22 * k);
    ctx.font = `600 ${Math.round(13 * k)}px Oswald, sans-serif`; ctx.fillStyle = cd.col;
    ctx.fillText(cd.n, sx + sr + 12 * k, y0 + 45 * k, bw - (sr * 2 + 50 * k));
    ctx.restore();
    ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
  }
})(window.ND);

(function (ND) {
  'use strict';
  const D = ND.duel; if (!D || !D.finDemo) return;
  let tries = 0;
  const iv = setInterval(() => {
    const bar = document.getElementById('duelBar');
    if (!bar) { if (++tries > 40) clearInterval(iv); return; }
    clearInterval(iv);

    const who = () => [...new Set(Object.keys(D.FIN_SCRIPTS).map((k) => k.split(':')[0]).filter((id) => id !== '_'))];
    const nb = document.createElement('button'); nb.type = 'button';
    const cur = () => (ND.game.F && ND.game.F[0] ? ND.game.F[0].ch.id : 'akane');
    const label = () => { nb.textContent = 'CINE: ' + cur().toUpperCase(); };
    nb.onclick = (e) => {
      e.stopPropagation(); const L = who(), i = (L.indexOf(cur()) + 1) % L.length, id = L[i];
      const ix = (c) => ND.CHARS.findIndex((x) => x.id === c);
      ND.game.start('cpu', { c1: ix(id), c2: ix(id === 'kuro' ? 'akane' : 'kuro'), arena: 'temple' });
      setTimeout(label, 300);
    };
    bar.appendChild(nb); setTimeout(label, 600);
    const bb = document.createElement('button'); bb.type = 'button'; bb.textContent = 'CINE BIND';
    bb.onclick = (e) => { e.stopPropagation(); const g = ND.game; if (g.phase !== 'fight' || !g.F) return; const [A, V] = g.F; for (const f of g.F) { if (f.dz && f.dz.cine) f.dz.cine = null; f.setState('move'); f.hp = f.maxHp; } if (!A.dz.armed) D.rearm(A, true); if (!V.dz.armed) D.rearm(V, true); A.x = -60; V.x = 60; A.dir = 1; V.dir = -1; D.startBind(A, V); };
    for (const [label, tier] of [['CINE 一', '1'], ['CINE 二', '2'], ['CINE 三', '3'], ['CINE 素手', 'u']]) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      b.onclick = (e) => { e.stopPropagation(); const g = ND.game; if (g.phase === 'fight' && g.F) D.finDemo(tier, g.F[0].ch.id); };
      bar.appendChild(b);
    }
    bar.appendChild(bb);
  }, 250);
})(window.ND);




(function (ND) {
  'use strict';
  const D = ND.duel, FP = ND.Fighter && ND.Fighter.prototype, A3 = ND.depth25;
  if (!D || !FP || !FP.drawTrail) return;
  const tr0 = FP.drawTrail, SN = {};
  FP.drawTrail = function (ctx) {
    if (!this.dz || this.dz.armed !== false) return tr0.call(this, ctx);
    const a = this.state === 'atk' ? this.atk : null;
    if (!a || D.lite) return;
    const W = a.hits && a.hits.length ? a.hits : a.active ? [a.active] : [];
    let on = false; for (const w of W) if (this.st >= w[0] - 0.03 && this.st <= w[1] + 0.03) on = true;
    if (!on || !A3 || !A3.snap) return;
    const s = A3.snap(this, SN);
    const lim = a.limb === 'haB' ? ['elB', 'haB'] : ['elF', 'haF'];
    const e = s && s[lim[0]], h = s && s[lim[1]];
    if (!e || !h || a.kind === 'kick') return;
    const dx = h.x - e.x, dy = h.y - e.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const x0 = e.x + dx * 0.45, y0 = e.y + dy * 0.45, x1 = h.x + ux * 9, y1 = h.y + uy * 9, w = 5;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(220,232,255,.35)';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 + nx * w, y1 + ny * w); ctx.lineTo(x1 - nx * w, y1 - ny * w); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
})(window.ND);



(function (ND) {
  'use strict';

  const later = (fn) => { if (ND.mocap && ND.mocap.Rig) fn(ND.mocap); else setTimeout(() => later(fn), 200); };
  if (!ND.duel) return;
  later((Mo) => {
  const b0 = Mo.Rig.prototype.build, HANG = (() => { const v = [-0.82, 0.55, -0.12], l = Math.hypot(v[0], v[1], v[2]); return v.map((x) => x / l); })();
  Mo.Rig.prototype.build = function (F, dt) {
    if (this.noSword && F && F.d) { F.d.ss = HANG.slice(); }
    return b0.call(this, F, dt);
  };
  });
})(window.ND);




(function (ND) {
  'use strict';
  const D = ND.duel, FP = ND.Fighter && ND.Fighter.prototype;
  if (!D || !FP || !D.finOf) return;
  const CAP = 140, cap = (v) => (v > CAP ? CAP : v < -CAP ? -CAP : v);
  const inFin = (f) => !!(f && f.dz && D.finOf(f));


  const MAXA = 0.8;
  const hang = (R) => {
    const p = R && R.p; if (!p || p.length < 2) return;


    const far = (R.seg || 7) * p.length * 1.3;
    for (let i = 1; i < p.length; i++) if (!(Math.abs(p[i].x - p[0].x) < far && Math.abs(p[i].y - p[0].y) < far)) { R.init = false; return; }
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-3;
      const ang = Math.atan2(dx, dy);
      if (Math.abs(ang) <= MAXA) continue;
      const t = ang > 0 ? MAXA : -MAXA; b.x = a.x + Math.sin(t) * d; b.y = a.y + Math.cos(t) * d; b.px = b.x; b.py = b.y;
    }
  };

  const demo0 = D.finDemo;
  if (demo0) D.finDemo = function () {
    const r = demo0.apply(this, arguments), g = ND.game;
    if (g && g.F) for (const f of g.F) {
      const rs = [f.tails, [f.sash]]; const rg = ND.duel.mocap && ND.duel.mocap.rigOf && ND.duel.mocap.rigOf(f);
      if (rg && rg.puppet) rs.push(rg.puppet.tails, [rg.puppet.sash]);
      for (const L of rs) if (L) for (const R of L) if (R) R.init = false;
    }
    return r;
  };
  const cl0 = FP.cloth;
  FP.cloth = function (j, dt) {
    if (!inFin(this) && !this.__fin) return cl0.call(this, j, dt);
    const v = this.vx; this.vx = cap(v);
    try { return cl0.call(this, j, dt); } finally {
      this.vx = v;
      if (this.tails) for (const r of this.tails) hang(r);
      hang(this.sash);
    }
  };

  const later = (fn) => { if (ND.mocap && ND.mocap.Rig) fn(ND.mocap); else setTimeout(() => later(fn), 200); };
  later((M) => {
    const up0 = M.Rig.prototype.update;
    M.Rig.prototype.update = function (dt) { const on = inFin(this.look); if (this.puppet) this.puppet.__fin = on; if (on) this.vx = cap(this.vx || 0); return up0.call(this, dt); };
  });
})(window.ND);
