// Shadow Duel — counter cinematic and combo HUD (ND.cine)
//
// A counter (kaeshi-waza) must never read as an ordinary cut. This module stages it in three beats:
//   1. the parry: brief slow motion, a ring on the defender, a metallic "shing", the camera leaning in and a
//      STRIKE! prompt with a shrinking bar over a human defender (smaller prompt after a plain block, with hints on);
//   2. the counter starts: its own sound, a name banner ("KAESHI-WAZA · SURIAGE" + one line of what it does),
//      the background dims, coloured afterimages and a long streak follow the body (fighter.js);
//   3. the counter lands: longer hitstop, a screen-wide slash line in the technique's shape, an ink splash,
//      a big damage number, its own impact sound, a short slow-motion zoom on the hit.
// Every type has its colour and slash shape: SURIAGE gold rising diagonal, HARAI cyan low sweep, NUKI violet X,
// UCHIOTOSHI red vertical drop with a ground ring, the rally finisher three white cuts. The AI's counters get the
// same show (the player learns what they are); only the prompt is for humans.
// It also draws the combo counter (hits + the combo's name) at the attacker's side of the screen.
// Cheap on phones: a handful of canvas paths per frame, no blur/gradient passes; glows only with ND.settings.hq.
// Sounds are new ND.audio functions built from its tone/noise voices, so they go through the effects bus.
// Texts: ND.STR.kaeshi (Turkish source in i18n.js, English in i18n-en.js).
(function (ND) {
  'use strict';
  const au = ND.audio, fx = ND.fx, cam = ND.cam;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const outCubic = (t) => 1 - Math.pow(1 - t, 3);

  // logical counter name (fighter.atkName) → presentation
  const TY = {
    riposte: { id: 'suriage', col: '255,204,96', cuts: [-0.62] },
    sweep: { id: 'harai', col: '96,212,255', cuts: [0.05], low: true },
    mawari: { id: 'nuki', col: '196,146,255', cuts: [-0.72, 0.72] },
    kaeshiHeavy: { id: 'uchiotoshi', col: '255,104,76', cuts: [1.45], ground: true },
    finisher: { id: 'sandan', col: '255,240,206', cuts: [-0.5, 0.35, 1.5] },
  };
  const S = () => (ND.STR && ND.STR.kaeshi) || {};
  const tt = (s) => (ND.i18n ? ND.i18n.t(s) : s);
  const G = () => ND.game;
  const hq = () => !!(ND.settings && ND.settings.hq);
  const shown = () => { const g = G(); return !!g && g.mode !== 'attract'; };

  // ---------------------------------------------------------------- sounds (effects bus: tone/noise → dry/reverb)
  if (au && !au.kShing) {
    Object.assign(au, {
      // parry: bright ringing "shing" on top of the clang, sliding up
      kShing(pan = 0) {
        this.tone({ freq: 2900, freq1: 3400, glide: 0.12, dur: 1.1, gain: 0.07, send: 0.7, pan });
        this.tone({ freq: 4650, freq1: 5200, glide: 0.1, dur: 0.8, gain: 0.04, send: 0.6, pan, type: 'triangle' });
        this.tone({ freq: 6900, dur: 0.5, gain: 0.02, send: 0.5, pan });
        this.noise({ type: 'bandpass', f0: 4200, f1: 9500, q: 4, dur: 0.28, gain: 0.16, attack: 0.01, send: 0.4, pan });
      },
      // counter start: the technique's own draw
      kDraw(id, pan = 0) {
        if (id === 'suriage') { this.noise({ type: 'bandpass', f0: 700, f1: 5200, q: 2, dur: 0.3, gain: 0.3, attack: 0.12, send: 0.3, pan }); this.tone({ freq: 520, freq1: 1900, dur: 0.32, gain: 0.07, send: 0.4, pan, type: 'triangle' }); }
        else if (id === 'harai') { this.noise({ type: 'lowpass', f0: 1800, f1: 300, dur: 0.34, gain: 0.34, attack: 0.08, send: 0.2, pan }); this.tone({ freq: 240, freq1: 130, dur: 0.3, gain: 0.18, send: 0.2, pan }); }
        else if (id === 'nuki') { this.noise({ type: 'bandpass', f0: 2600, f1: 900, q: 1.5, dur: 0.22, gain: 0.26, attack: 0.1, send: 0.35, pan }); this.noise({ type: 'bandpass', f0: 900, f1: 3400, q: 1.5, dur: 0.24, gain: 0.26, attack: 0.1, send: 0.35, pan, delay: 0.15 }); }
        else if (id === 'uchiotoshi') { this.tone({ freq: 95, freq1: 45, dur: 0.45, gain: 0.5, send: 0.3, pan }); this.noise({ type: 'bandpass', f0: 1500, f1: 4200, q: 3, dur: 0.22, gain: 0.2, attack: 0.02, send: 0.3, pan, delay: 0.06 }); }
        else { [0, 0.1, 0.2].forEach((d, i) => this.noise({ type: 'bandpass', f0: 600 + i * 300, f1: 3200 + i * 600, q: 1.4, dur: 0.18, gain: 0.24, attack: 0.08, send: 0.3, pan, delay: d })); }
      },
      // counter lands: heavier and more resonant than a normal cut (the cut sound itself still plays in takeHit)
      kHit(id, pan = 0) {
        if (id === 'suriage') { this.tone({ freq: 1760, dur: 0.9, gain: 0.07, send: 0.7, pan }); this.tone({ freq: 2640, dur: 0.7, gain: 0.04, send: 0.7, pan }); this.tone({ freq: 120, freq1: 50, dur: 0.3, gain: 0.45, send: 0.2, pan }); }
        else if (id === 'harai') { this.tone({ freq: 90, freq1: 40, dur: 0.4, gain: 0.55, send: 0.2, pan }); this.noise({ type: 'lowpass', f0: 1200, f1: 200, dur: 0.4, gain: 0.35, send: 0.25, pan }); }
        else if (id === 'nuki') { this.tone({ freq: 3100, freq1: 2400, dur: 0.6, gain: 0.05, send: 0.8, pan }); this.noise({ type: 'highpass', f0: 2500, f1: 800, dur: 0.25, gain: 0.3, send: 0.3, pan }); this.tone({ freq: 130, freq1: 55, dur: 0.3, gain: 0.4, send: 0.2, pan }); }
        else if (id === 'uchiotoshi') { this.taiko(1.1); this.tone({ freq: 62, dur: 1.1, gain: 0.28, send: 0.6, pan }); this.clang(0.7, pan, 0.6); }
        else { this.taiko(1.2); this.tone({ freq: 1320, freq1: 990, dur: 1.2, gain: 0.06, send: 0.8, pan }); }
      },
    });
  }

  const cine = ND.cine = {
    TY,
    slashes: [], nums: [], rings: [], banner: null, combos: [null, null], pops: [null, null],
    clear() { this.slashes.length = 0; this.nums.length = 0; this.rings.length = 0; this.banner = null; this.combos[0] = this.combos[1] = null; this.pops[0] = this.pops[1] = null; },
    type(f) { return f && f.state === 'atk' && f.atk && f.atk.counter ? TY[f.atkName] || TY.riposte : null; },
    rgb(f) { const t = this.type(f); return t ? t.col : null; },
    ghostCol(f) { const t = this.type(f); return t ? `rgb(${t.col})` : null; },
    human(f) { const g = G(); return !!(g && g.isHuman && g.isHuman(f)); },

    // ---- beat 1: a successful parry
    onParry(def, att, x, y) {
      const g = G(); if (!g) return;
      if (shown()) {
        // ~0.25 s at 30 % after the 0.1 s freeze (slowT counts real time, also during the freeze)
        g.slowT = Math.max(g.slowT || 0, 0.35); g.slowV = 0.3;
        g.cineT = Math.max(g.cineT || 0, 0.5); g.cineX = (def.x + att.x) / 2;
        g.cineZ = 1.22;
      }
      this.rings.push({ f: def, t: 0, max: 0.55 });
      fx.ring(def.x, def.y - 105, '255,244,214', 130);
      cam.z = Math.min(2.2, cam.z * 1.05);
      if (au.kShing) au.kShing(def.pan);
      if (this.human(def)) this.pops[def.id] = { t: 0 };
    },

    // ---- beat 2: the counter technique starts (human or AI)
    counterStart(f, name) {
      const t = TY[name] || TY.riposte, g = G();
      const stage = Math.max(1, f.counterStage || 1), beat = Math.min(stage, 3);
      // End the defense beat before showing the next body movement. Slow motion otherwise piles several
      // old rings, parry labels and fighter silhouettes on top of the current exchange.
      this.rings.length = 0;
      for (let i = fx.parts.length - 1; i >= 0; i--) if (fx.parts[i].k === 'r' || fx.parts[i].k === 'f') fx.parts.splice(i, 1);
      for (let i = fx.texts.length - 1; i >= 0; i--) if (fx.texts[i].str === tt('SAVUŞTURMA!')) fx.texts.splice(i, 1);
      f.ghosts.length = 0; if (f.opp) f.opp.ghosts.length = 0;
      if (au.kDraw) au.kDraw(t.id, f.pan);
      fx.flash(f.j.haF ? f.j.haF.x : f.x, f.j.haF ? f.j.haF.y : f.y - 100, 0, 40, t.col);
      if (!shown()) return;
      g.slowT = Math.min(g.slowT || 0, 0.06); // the parry's slow motion snaps back: the counter itself is fast
      g.dim = Math.max(g.dim || 0, [0, 0.35, 0.5, 0.65][beat]);
      g.cineT = 0.35 + beat * 0.1; g.cineX = (f.x + f.opp.x) / 2;
      // Keep both bodies in the shot, even on a phone or with a long weapon. No extra rendering passes.
      g.cineZ = Math.min([0, 1.22, 1.36, 1.5][beat], cam.W / (cam.s * (Math.abs(f.x - f.opp.x) + 360 + cam.padX)));
      const L = S();
      this.banner = { f, t, stage, age: 0, life: 1.05, name: (L.names && L.names[t.id]) || t.id.toUpperCase(), label: (L.labels && L.labels[t.id]) || '' };
    },

    // ---- beat 3: the counter lands (x, y world; dmg = health actually taken)
    counterHit(f, o, a, x, y, dmg, last) {
      const t = this.type(f) || TY.riposte, g = G(), dir = f.dir;
      const cuts = t.id === 'sandan' ? [t.cuts[Math.min(t.cuts.length - 1, Math.max(0, f.hitIdx))]] : t.cuts;
      cuts.forEach((ang, i) => this.slashes.push({ x, y: t.low ? Math.max(y, -60) : y, a: ang * dir, col: t.col, age: -i * 0.06, life: 0.55 }));
      if (dmg > 0) this.nums.push({ x: x + dir * 60, y: y - 85, v: dmg, col: t.col, age: 0, life: 1.1 }); // clear of the technique's name pop-up
      fx.blood(x, y, dir, -0.3, 30, 1.4);
      if (t.ground) { fx.ring(o.x, -4, `${t.col}`, 150); fx.dust(o.x, 0, 14, 1.6); }
      fx.spark(x, y, Math.atan2(-0.4, dir), 18, 1.2, t.col);
      if (au.kHit) au.kHit(t.id, f.pan);
      if (shown() && last && g.phase === 'fight') {
        g.cineT = Math.max(g.cineT || 0, 0.6); g.cineX = x;
        g.cineZ = 1.35 + 0.05 * Math.min(f.counterStage || 1, 3);
        g.slowT = Math.max(g.slowT || 0, (g.hitstopT || 0) + 0.2); g.slowV = 0.45;
      }
      cam.punch(9);
    },

    // ---- combo counter: returns true when it handled the display
    combo(from, to, hits, name) {
      if (!shown()) return false;
      const c = this.combos[from.id];
      this.combos[from.id] = { n: hits, name: name || (c && c.to === to && c.age < 1.2 ? c.name : null), age: 0, life: 1.5, col: from.col.ui, to, named: !!name && !(c && c.name === name) };
      return true;
    },

    update(dt) {
      for (const L of [this.slashes, this.nums]) for (let i = L.length - 1; i >= 0; i--) { L[i].age += dt; if (L[i].age >= L[i].life) L.splice(i, 1); }
      for (let i = this.rings.length - 1; i >= 0; i--) { const r = this.rings[i]; r.t += dt; if (r.t >= r.max) this.rings.splice(i, 1); }
      if (this.banner) { this.banner.age += dt; if (this.banner.age >= this.banner.life) this.banner = null; }
      for (let i = 0; i < 2; i++) {
        const c = this.combos[i]; if (c) { c.age += dt; if (c.age >= c.life) this.combos[i] = null; }
        const p = this.pops[i]; if (p) p.t += dt;
      }
      // touch: the ATTACK button pulses while the counter window after a parry is open (the coach's pulse style)
      const g = G(), f = g && g.F && g.F[0];
      const want = !!(f && ND.touch && ND.touch.active && !(ND.coach && ND.coach.on) && !(ND.tutor && ND.tutor.on) && this.human(f) && f.cwKind === 'parry' && f.counterUntil > g.clock && g.phase === 'fight');
      if (want !== !!this.pulsing) {
        this.pulsing = want;
        const pad = document.getElementById('touch');
        if (pad) { if (want) pad.dataset.coach = 'light'; else if (pad.dataset.coach === 'light') delete pad.dataset.coach; }
      }
    },

    // ---------------------------------------------------------------- drawing (screen space, after the fx texts)
    draw(ctx) {
      const g = G(); if (!g) return;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const s = cam.s;
      for (const r of this.rings) this.drawRing(ctx, r, s);
      for (const sl of this.slashes) this.drawSlash(ctx, sl, s);
      for (const n of this.nums) this.drawNum(ctx, n, s);
      if (shown()) {
        if (g.phase === 'fight') for (const f of g.F) this.drawPrompt(ctx, f, s);
        if (this.banner) this.drawBanner(ctx, this.banner, s);
        for (let i = 0; i < 2; i++) if (this.combos[i]) this.drawCombo(ctx, this.combos[i], i, s);
      }
      ctx.restore();
    },
    drawRing(ctx, r, s) {
      const f = r.f, u = r.t / r.max, x = cam.sx(f.x), y = cam.sy(f.y - 100), k = cam.k;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 1 - u; ctx.strokeStyle = 'rgb(255,236,190)'; ctx.lineWidth = (8 - 6 * u) * s;
      ctx.beginPath(); ctx.arc(x, y, (60 + 90 * outCubic(u)) * k, 0, 6.283); ctx.stroke();
      ctx.globalAlpha = (1 - u) * 0.6; ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.arc(x, y, (40 + 150 * outCubic(u)) * k, 0, 6.283); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    },
    // a tapered line through the hit point that crosses the whole screen, drawn on fast, then thins and fades
    drawSlash(ctx, sl, s) {
      if (sl.age < 0) return;
      const u = sl.age / sl.life, grow = outCubic(Math.min(1, sl.age / 0.09)), fade = u < 0.35 ? 1 : 1 - (u - 0.35) / 0.65;
      const x = cam.sx(sl.x), y = cam.sy(sl.y), L = Math.hypot(cam.W, cam.H) * 0.62 * grow, c = Math.cos(sl.a), sn = Math.sin(sl.a);
      const band = (w, style, alpha, comp) => {
        const nx = -sn * w, ny = c * w;
        ctx.globalCompositeOperation = comp; ctx.globalAlpha = alpha; ctx.fillStyle = style;
        ctx.beginPath(); ctx.moveTo(x - c * L, y - sn * L); ctx.lineTo(x + nx, y + ny); ctx.lineTo(x + c * L, y + sn * L); ctx.lineTo(x - nx, y - ny); ctx.closePath(); ctx.fill();
      };
      const w = (10 + 8 * (1 - u)) * s;
      band(w * 1.7, 'rgb(6,7,12)', 0.55 * fade, 'source-over'); // ink edge
      if (hq()) band(w * 1.25, `rgb(${sl.col})`, 0.45 * fade, 'lighter');
      band(w * 0.75, `rgb(${sl.col})`, 0.9 * fade, 'lighter');
      band(w * 0.28, 'rgb(255,255,255)', fade, 'lighter');
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    },
    drawNum(ctx, n, s) {
      const u = n.age / n.life, pop = 1 + Math.max(0, 0.18 - n.age) * 4;
      const x = cam.sx(n.x), y = cam.sy(n.y) - 40 * s * outCubic(Math.min(1, u * 1.6));
      ctx.globalAlpha = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
      ctx.font = `700 ${Math.round(40 * s * pop)}px Oswald, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 7 * s; ctx.strokeStyle = 'rgba(5,6,12,.9)'; ctx.strokeText('-' + n.v, x, y);
      ctx.fillStyle = `rgb(${n.col})`; ctx.fillText('-' + n.v, x, y);
      ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
    },
    // big "STRIKE!" over a human defender while the counter window is open, with a bar that shrinks to zero
    drawPrompt(ctx, f, s) {
      const g = G();
      if (!this.human(f) || f.dead || (ND.tutor && ND.tutor.on)) return; // the rally tutorial draws its own ATTACK!
      const cw = f.counterUntil - g.clock;
      if (!(cw > 0) || !['block', 'parry', 'guard', 'move', 'recoil'].includes(f.state)) return;
      const big = f.cwKind === 'parry';
      if (!big && !(ND.settings && ND.settings.hints)) return;
      const L = S(), tch = f === g.F[0] && !!(ND.touch && ND.touch.active);
      const TB = (ND.STR && ND.STR.touch && ND.STR.touch.btn) || {};
      const key = tch ? tt(TB.light || 'SALDIR') : f === g.F[0] ? (ND.input.keyLabel ? ND.input.keyLabel('KeyF') : 'F') : ND.input.keyLabel ? ND.input.keyLabel('KeyK') : 'K';
      let k = s * (big ? 1 : 0.72);
      if (tch) k = Math.max(k, (g.pxr || 1) * (big ? 1.05 : 0.8));
      const frac = clamp(cw / (f.counterWin || 0.5), 0, 1), p = this.pops[f.id], pt = p ? p.t : 1;
      const pop = big ? 1 + Math.max(0, 0.16 - pt) * 3 : 1, pulse = 1 + 0.06 * Math.sin(g.pt * 22);
      // above the PARRY! pop-up (world y −205); when that would run into the HUD (phones, zoomed camera) the block goes
      // beside the fighter at head height, on the side away from the opponent
      let x = cam.sx(f.x), y = cam.sy(f.y - 205) - 88 * k;
      if (y < cam.H * 0.2 + 20 * k) {
        const away = f.opp && f.opp.x > f.x ? -1 : 1;
        x = clamp(x + away * 105 * k, 60 * k, cam.W - 60 * k); y = Math.max(cam.H * 0.2 + 20 * k, cam.sy(f.y - 150));
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      // STRIKE!
      ctx.font = `700 ${Math.round(30 * k * pop * pulse)}px Oswald, sans-serif`;
      ctx.lineWidth = 6 * k; ctx.strokeStyle = 'rgba(5,6,12,.92)';
      const word = tt(L.strike || 'VUR!');
      ctx.strokeText(word, x, y); ctx.fillStyle = '#ffd27a'; ctx.fillText(word, x, y);
      // key chip
      ctx.font = `700 ${Math.round(15 * k)}px Oswald, sans-serif`;
      const kw = Math.max(26 * k, ctx.measureText(key).width + 14 * k), kh = 22 * k, ky = y + 27 * k;
      ctx.fillStyle = 'rgba(8,9,16,.9)'; ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 2 * k;
      this.rr(ctx, x - kw / 2, ky - kh / 2, kw, kh, 5 * k); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd27a'; ctx.fillText(key, x, ky + k);
      // shrinking bar
      const bw = 96 * k, bh = 6 * k, by = ky + kh / 2 + 8 * k;
      ctx.fillStyle = 'rgba(8,9,16,.85)'; ctx.fillRect(x - bw / 2 - 2 * k, by - 2 * k, bw + 4 * k, bh + 4 * k);
      ctx.fillStyle = frac > 0.3 ? '#ffd27a' : '#ff8a6a'; ctx.fillRect(x - bw / 2, by, bw * frac, bh);
      ctx.textBaseline = 'alphabetic';
    },
    // kaeshi-waza name banner: slides in from the side of the fighter who counters
    drawBanner(ctx, b, s) {
      const u = b.age / b.life, inT = outCubic(Math.min(1, b.age / 0.14)), a = u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25;
      const side = b.f.id === 0 ? -1 : 1, W = cam.W, tch = !!(ND.touch && ND.touch.active), pr = G().pxr || 1;
      const k = tch ? Math.max(s, pr * 0.8) : Math.max(s, 0.55);
      // phones: the top is taken by the HUD and the fighters' heads fill the middle, so the banner sits low, between
      // the stick and the buttons, over the floor
      const cx = W / 2 + side * (1 - inT) * W * 0.25, cy = tch ? cam.H - 56 * k : cam.H * 0.27;
      ctx.globalAlpha = a;
      // brush band behind the name
      const bw = Math.min(W * (tch ? 0.46 : 0.92), 560 * k), bh = 86 * k;
      ctx.fillStyle = 'rgba(6,7,12,.72)';
      ctx.beginPath(); ctx.moveTo(cx - bw / 2, cy - bh / 2 + 6 * k); ctx.lineTo(cx + bw / 2, cy - bh / 2); ctx.lineTo(cx + bw / 2 - 18 * k, cy + bh / 2); ctx.lineTo(cx - bw / 2 + 14 * k, cy + bh / 2 - 4 * k); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgb(${b.t.col})`; ctx.fillRect(cx - bw / 2 + 10 * k, cy + bh / 2 - 7 * k, (bw - 30 * k) * inT, 3 * k);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `600 ${Math.round(13 * k)}px Oswald, "Noto Serif JP", sans-serif`; ctx.fillStyle = 'rgba(236,230,214,.9)';
      ctx.fillText(b.f.ch.name + ' · ' + b.stage + '× · ' + tt(S().head || 'KAESHI-WAZA'), cx, cy - 28 * k, bw - 30 * k);
      ctx.font = `700 ${Math.round(38 * k * (1 + Math.max(0, 0.12 - b.age) * 2))}px Oswald, sans-serif`;
      ctx.lineWidth = 6 * k; ctx.strokeStyle = 'rgba(5,6,12,.95)'; ctx.strokeText(b.name, cx, cy + 3 * k, bw - 30 * k);
      ctx.fillStyle = `rgb(${b.t.col})`; ctx.fillText(b.name, cx, cy + 3 * k, bw - 30 * k);
      if (b.label) { ctx.font = `500 ${Math.round(14 * k)}px "Source Sans 3", sans-serif`; ctx.fillStyle = 'rgba(236,230,214,.95)'; ctx.fillText(tt(b.label), cx, cy + 31 * k, bw - 30 * k); }
      ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
    },
    // combo counter at the attacker's side: big hit number, "HITS", the combo's name when a named ender lands
    drawCombo(ctx, c, side, s) {
      const u = c.age / c.life, a = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3, pop = 1 + Math.max(0, 0.12 - c.age) * 3, k = Math.max(s, 0.55);
      const x = side === 0 ? cam.W * 0.16 : cam.W * 0.84, y = cam.H * 0.42;
      ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(48 * k * pop)}px Oswald, sans-serif`;
      ctx.lineWidth = 7 * k; ctx.strokeStyle = 'rgba(5,6,12,.9)'; ctx.strokeText(String(c.n), x, y);
      ctx.fillStyle = c.col; ctx.fillText(String(c.n), x, y);
      ctx.font = `600 ${Math.round(14 * k)}px Oswald, sans-serif`; ctx.lineWidth = 4 * k;
      const hw = tt(S().hits || 'VURUŞ');
      ctx.strokeText(hw, x, y + 32 * k); ctx.fillStyle = '#ece6d6'; ctx.fillText(hw, x, y + 32 * k);
      if (c.name) {
        const np = c.named ? 1 + Math.max(0, 0.15 - c.age) * 3 : 1;
        ctx.font = `700 ${Math.round(20 * k * np)}px Oswald, sans-serif`; ctx.lineWidth = 5 * k;
        ctx.strokeText(c.name, x, y + 58 * k); ctx.fillStyle = '#ffd27a'; ctx.fillText(c.name, x, y + 58 * k);
      }
      ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
    },
    rr(ctx, x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    },
  };
})(window.ND);
