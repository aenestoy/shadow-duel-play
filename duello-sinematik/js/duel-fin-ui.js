




(function (ND) {
  'use strict';
  const D = ND.duel;
  if (!D || !D.FIN || !ND.cine) return;
  const G = ND.game, cam = ND.cam, fx = ND.fx, au = ND.audio;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const oc = (t) => 1 - Math.pow(1 - t, 3);
  const NUM = ['', '一', '二', '三'];
  const U = (D.finUi = { strokes: [], card: null, bars: 0, gathers: [], seen: null });
  const sim = () => !!G.simOnly;
  const tt = (s) => (ND.i18n ? ND.i18n.t(s) : s);


  const SEEN_KEY = 'sd_fin_seen';
  U.seen = (() => { try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch (e) { return new Set(); } })();
  const markSeen = (k) => { if (U.seen.has(k)) return; U.seen.add(k); try { localStorage.setItem(SEEN_KEY, JSON.stringify([...U.seen])); } catch (e) {                    } };

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
      case 'end':
        markSeen(c.key);
        break;
    }
  };


  const Q = (() => { try { return location.search || ''; } catch (e) { return ''; } })();
  D.finCanSkip = (c) => {
    if (G.mode === 'online' || G.mode === 'shadow' || G.mode === 'attract') return false;
    if (/[?&]finskip=0(&|$)/.test(Q)) return false;
    const auto = (() => { try { return !!navigator.webdriver; } catch (e) { return false; } })();
    if (auto && !/[?&]finskip=1(&|$)/.test(Q)) return false;
    return U.seen.has(c.key);
  };

  function active() { const F = G.F; if (!F) return null; for (const f of F) { const c = D.finOf && D.finOf(f); if (c) return c; } return null; }


  const text0 = fx.text;
  fx.text = function () { if (active()) return; return text0.apply(this, arguments); };

  const combo0 = ND.cine.combo;
  ND.cine.combo = function (from, to, hits, name) { if (active()) return true; return combo0.call(this, from, to, hits, name); };


  const draw0 = ND.cine.draw;
  ND.cine.draw = function (ctx) {
    draw0.call(this, ctx);
    if (!G.F || !(G.phase === 'fight' || G.phase === 'ko')) { U.strokes.length = 0; U.card = null; U.bars = 0; return; }
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
    for (let i = U.strokes.length - 1; i >= 0; i--) { const s = U.strokes[i]; s.age += rdt; if (s.age >= s.life) { U.strokes.splice(i, 1); continue; } drawStroke(ctx, s); }
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
    const tch = !!(ND.touch && ND.touch.active), pr = G.pxr || 1, k = tch ? Math.max(u, pr * 0.8) : u;
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
    for (const [label, tier] of [['CINE 一', '1'], ['CINE 二', '2'], ['CINE 三', '3'], ['CINE 素手', 'u']]) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      b.onclick = (e) => { e.stopPropagation(); const g = ND.game; if (g.phase === 'fight' && g.F) D.finDemo(tier, g.F[0].ch.id); };
      bar.appendChild(b);
    }
  }, 250);
})(window.ND);
