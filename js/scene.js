// Gölge Düellosu — kamera, gece tapınak avlusu sahnesi, parçacık efektleri
(function (ND) {
  'use strict';
  const { clamp, lerp, rand } = ND.M;
  const PM = ND.pm;
  // blood: opt-in (game.js loads the saved choice); off → ink & shadow hits. ND.bloodAllowed() (core.js) gates it per portal.
  ND.settings = { blood: false, sound: true };
  const bloodOn = () => !!ND.settings.blood && (!ND.bloodAllowed || ND.bloodAllowed());
  ND.bloodOn = bloodOn;
  // Ink palette: sumi core, a cold moonlit rim so the ink reads on night arenas, cloth scraps in muted dye colours
  const INK = '#07080e', INK_RIM = '198,208,236', CLOTH = ['#1b1e2b', '#2a2f42', '#3a3346', '#cfc6b2', '#262231'];
  ND.ARENA = 880;

  function seeded(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Renkli yumuşak ışık lekesi — bir kez çizilip önbelleğe alınır (ucuz drawImage)
  const glowCache = {};
  function glowAt(ctx, c, x, y, rx, ry, a) {
    if (!(a > 0)) return;
    let g = glowCache[c];
    if (!g) {
      g = document.createElement('canvas'); g.width = g.height = 128;
      const x2 = g.getContext('2d'), rg = x2.createRadialGradient(64, 64, 0, 64, 64, 64);
      rg.addColorStop(0, `rgba(${c},1)`); rg.addColorStop(0.25, `rgba(${c},.45)`); rg.addColorStop(0.6, `rgba(${c},.12)`); rg.addColorStop(1, `rgba(${c},0)`);
      x2.fillStyle = rg; x2.fillRect(0, 0, 128, 128); glowCache[c] = g;
    }
    ctx.globalAlpha = Math.min(1, a); ctx.drawImage(g, x - rx, y - ry, rx * 2, ry * 2);
  }
  // ---- Önbellekli gradyanlar: tam ekran gradyan dolgusu (özellikle yazılım rasterında) pahalı. Dikey gradyanlar
  // bir kez 1×256'lık şeride çizilir ve gerilerek basılır; renk sabit, yalnız alfa değiştiğinden sonuç aynıdır.
  function vstrip(stops) {
    const c = document.createElement('canvas'); c.width = 1; c.height = 256;
    const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    x.fillStyle = g; x.fillRect(0, 0, 1, 256);
    return c;
  }
  // Şeridi ekran uzayında [y0, y1] aralığına gerer; y1'in altı (varsa) düz renkle doldurulur.
  // Alt sınır tam piksele yuvarlanır → şerit ile düz dolgu arasında kenar yumuşatma dikişi olmaz.
  // ymax: düz dolgunun alt sınırı (ör. opak zeminin üstü; altı zaten örtülecek)
  function vgrad(ctx, strip, y0, y1, below, ymax) {
    const W = cam.W, yb = Math.round(y1), H = Math.min(cam.H, ymax ?? cam.H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (yb > y0 && yb > 0 && y0 < cam.H) ctx.drawImage(strip, 0, 0, 1, 256, 0, y0, W, yb - y0);
    if (below && yb < H) { ctx.fillStyle = below; ctx.fillRect(0, Math.max(0, yb), W, H - Math.max(0, yb)); }
  }
  // Opak zeminin (dünya y = −45) ekrandaki üst sınırı; altı her temada opak zeminle örtülür
  const floorTop = () => Math.ceil(cam.sy(-45)) + 2;
  // Temaya bağlı önbellekler (tema nesnesi üzerinde; tema değişince kendiliğinden ayrı)
  const tc = (th) => th._c || (th._c = {});

  // Eğik kiriş/direk: (x,y)'den a açısıyla len boyunda, w kalınlığında dikdörtgen (yola ekler)
  function beam(ctx, x, y, len, w, a) {
    const c = Math.cos(a), s = Math.sin(a), nx = -s * w / 2, ny = c * w / 2;
    ctx.moveTo(x + nx, y + ny); ctx.lineTo(x + c * len + nx, y + s * len + ny); ctx.lineTo(x + c * len - nx, y + s * len - ny); ctx.lineTo(x - nx, y - ny); ctx.closePath();
  }

  // ------------------------------------------------------------ KAMERA
  const cam = ND.cam = {
    // gyK: zemin çizgisinin ekran yüksekliğine oranı; padX: yakınlaştırmada ek yan pay (dokunmatik kumanda açıkken
    // dövüşçüler biraz yukarıda ve ortada kalsın, alt köşelerdeki başparmak düğmeleri çoğunlukla zemini örtsün)
    x: 0, y: -118, z: 1, W: 1280, H: 720, s: 1, shk: 0, shx: 0, shy: 0, gyK: 0.6, padX: 0,
    get k() { return this.s * this.z; },
    get gy() { return this.H * this.gyK; },
    punch(a) { this.shk = Math.max(this.shk, a); },
    sx(x) { return this.W / 2 + (x - this.x) * this.k + this.shx; },
    sy(y) { return this.gy + (y - this.y) * this.k + this.shy; },
    pan(x) { return clamp(((x - this.x) * this.k) / (this.W / 2), -1, 1) * 0.7; },
    follow(dt, fa, fb, focus) {
      let tx, ty, tz;
      if (focus) { tx = focus.x; ty = focus.y; tz = focus.z; }
      else {
        const d = Math.abs(fa.x - fb.x);
        tx = (fa.x + fb.x) / 2;
        const top = Math.min(fa.y, fb.y);
        ty = -118 + Math.min(0, top) * 0.35;
        tz = clamp((this.W / this.s) / (d + 420 + this.padX), 0.55, 1.28);
        const half = this.W / (2 * this.s * tz);
        const lim = ND.ARENA + 120 - half;
        tx = lim > 0 ? clamp(tx, -lim, lim) : 0;
      }
      this.x = ND.M.approach(this.x, tx, 5, dt);
      this.y = ND.M.approach(this.y, ty, 4, dt);
      this.z = ND.M.approach(this.z, tz, 3, dt);
      this.shk = Math.max(0, this.shk - dt * 40);
      const a = this.shk;
      this.shx = (Math.random() * 2 - 1) * a;
      this.shy = (Math.random() * 2 - 1) * a * 0.7;
    },
    world(ctx) {
      const k = this.k;
      ctx.setTransform(k, 0, 0, k, this.W / 2 - this.x * k + this.shx, this.gy - this.y * k + this.shy);
    },
    layer(ctx, f) {
      const k = this.s * (1 + (this.z - 1) * f);
      const gy = this.gy - this.y * this.k; // zemin çizgisinin ekran y'si
      ctx.setTransform(k, 0, 0, k, this.W / 2 - this.x * f * k + this.shx * f, gy + this.shy * f);
    },
  };

  // ------------------------------------------------------------ EFEKTLER
  const fx = ND.fx = {
    parts: [], decals: [], texts: [],
    clear() { this.parts.length = 0; this.decals.length = 0; this.texts.length = 0; },
    spark(x, y, dir, n = 14, power = 1, color = '255,214,140') {
      for (let i = 0; i < n; i++) {
        const a = dir + rand(-1.1, 1.1), sp = rand(250, 900) * power;
        this.parts.push({ k: 's', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: rand(0.18, 0.5), max: 0.5, c: color });
      }
    },
    blood(x, y, dx, dy, n = 18, power = 1) {
      if (!bloodOn()) { this.ink(x, y, dx, dy, n, power); return; }
      for (let i = 0; i < n; i++) {
        const sp = rand(120, 620) * power, a = Math.atan2(dy, dx) + rand(-0.7, 0.7);
        this.parts.push({ k: 'b', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(60, 260), r: rand(1.2, 3.6), life: 2, max: 2 });
      }
      for (let i = 0; i < n / 3; i++) {
        this.parts.push({ k: 'm', x, y, vx: dx * 60 + rand(-60, 60), vy: rand(-80, 20), r: rand(4, 10), life: rand(0.25, 0.5), max: 0.5 });
      }
    },
    // ---- Ink & shadow hit (default; PEGI 12 / Poki safe): no fluids, no red. A calligraphy stroke tears through the
    // impact, a sumi splash bursts and scatters droplets that leave faint stains which fade, cut cloth scraps flutter
    // down, cold sparks fly. Same call signature as blood(), so replays and every caller get it for free.
    ink(x, y, dx, dy, n = 18, power = 1) {
      const ang = Math.atan2(dy, dx), big = clamp((n - 4) / 46, 0, 1), P = this.parts;
      const dir = Math.cos(ang) < 0 ? -1 : 1;
      // brush stroke: a slanted slash across the cut, longer and fatter for heavy hits / KO
      const sl = (70 + 150 * big) * (0.8 + 0.25 * power);
      P.push({ k: 'k', x, y, a: -dir * rand(0.35, 0.75) + (dir < 0 ? Math.PI : 0), len: sl, w: (5 + 9 * big) * (0.8 + 0.2 * power), bend: rand(-0.25, 0.25), life: 0.5 + 0.25 * big, max: 0.5 + 0.25 * big, seed: Math.random() * 1000 });
      if (big > 0.55) P.push({ k: 'k', x: x + rand(-8, 8), y: y + rand(-10, 6), a: ang + rand(-0.3, 0.3), len: sl * 0.62, w: 4 + 5 * big, bend: rand(-0.3, 0.3), life: 0.55, max: 0.55, seed: Math.random() * 1000, delay: 0.05 });
      // splash: irregular sumi burst with spikes thrown along the hit
      const spikes = [];
      for (let i = 0, m = 7 + ((big * 5) | 0); i < m; i++) { const a2 = ang + rand(-1.5, 1.5) * (i % 3 ? 1 : 1.8); spikes.push([a2, rand(0.55, 1.5) * (Math.abs(a2 - ang) < 0.8 ? 1.35 : 0.8), rand(0.24, 0.5), Math.random() < 0.5]); }
      P.push({ k: 'x', x, y, a: ang, r: (9 + 16 * big) * (0.85 + 0.2 * power), spikes, life: 0.42 + 0.2 * big, max: 0.42 + 0.2 * big });
      // droplets: fly with the blow, fall, leave a faint stain that fades
      const nd = Math.round(4 + n * 0.55);
      for (let i = 0; i < nd; i++) {
        const sp = rand(140, 640) * (0.7 + 0.3 * power), a = ang + rand(-0.75, 0.75);
        P.push({ k: 'i', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(80, 280), r: rand(1.1, 3.2) * (0.8 + 0.4 * big), life: 1.8, max: 1.8 });
      }
      // cut cloth scraps
      const nc = 1 + Math.round(big * 4 + Math.random() * 1.5);
      for (let i = 0; i < nc; i++) {
        const a = ang + rand(-0.9, 0.9), sp = rand(120, 380) * (0.7 + 0.3 * power);
        P.push({ k: 'c', x: x + rand(-6, 6), y: y + rand(-6, 6), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(120, 260), rot: rand(0, 6.28), vr: rand(-14, 14), w: rand(5, 11) * (0.8 + 0.5 * big), h: rand(2.5, 5.5), c: CLOTH[(Math.random() * CLOTH.length) | 0], ph: rand(0, 6.28), life: rand(1.3, 2.1), max: 2.1 });
      }
      // cold steel sparks
      this.spark(x, y, ang, 5 + Math.round(n / 5), 0.65 + 0.2 * power, '214,224,255');
    },
    dust(x, y, n = 8, spread = 1) {
      for (let i = 0; i < n; i++) {
        this.parts.push({ k: 'd', x: x + rand(-14, 14) * spread, y: y - rand(0, 6), vx: rand(-120, 120) * spread, vy: rand(-70, -10), r: rand(6, 16), life: rand(0.4, 0.9), max: 0.9 });
      }
    },
    flash(x, y, ang, size = 60, color = '255,255,255') {
      this.parts.push({ k: 'f', x, y, a: ang, size, life: 0.16, max: 0.16, c: color });
    },
    ring(x, y, color = '255,230,170', size = 90) {
      this.parts.push({ k: 'r', x, y, size, life: 0.35, max: 0.35, c: color });
    },
    text(x, y, str, color) {
      if (ND.i18n && typeof str === 'string') str = ND.i18n.t(str);
      this.texts.push({ x, y, str, color, life: 1.1, max: 1.1 });
    },
    update(dt) {
      const P = this.parts;
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.life -= dt;
        if (p.k === 'i') {
          p.vy += 1500 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.y > 0 && p.vy > 0) { // lands: faint stain that fades out
            this.decals.push({ x: p.x, y: rand(0, 24), rx: p.r * rand(1.8, 3.4) + Math.abs(p.vx) * 0.004, ry: p.r * rand(0.35, 0.65), a: rand(0.28, 0.45), c: INK, fade: rand(5, 8), age: 0 });
            if (this.decals.length > 420) this.decals.shift();
            p.life = 0;
          }
        } else if (p.k === 'c') { // cloth: drag, flutter, settle on the floor
          p.vx *= 1 - 2.2 * dt; p.vy += 520 * dt; p.vy *= 1 - 1.6 * dt; p.ph += dt * 9;
          p.x += (p.vx + Math.sin(p.ph) * 40) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
          if (p.y > -2) { p.y = -2; p.vy = 0; p.vx *= 0.8; p.vr *= 0.85; }
        }
        if (p.k === 's' || p.k === 'b' || p.k === 'd' || p.k === 'm') {
          const g = p.k === 's' ? 1400 : p.k === 'b' ? 1500 : p.k === 'm' ? 200 : -30;
          p.vy += g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.k === 'd' || p.k === 'm') { p.vx *= 1 - 3 * dt; p.vy *= 1 - 3 * dt; p.r += dt * 18; }
          if (p.k === 'b' && p.y > 0 && p.vy > 0) {
            const sat = [];
            for (let k = (Math.random() * 3) | 0; k > 0; k--) sat.push([rand(-1, 1) * p.r * 3, rand(-0.4, 0.4) * p.r, p.r * rand(0.4, 1)]);
            this.decals.push({ x: p.x, y: rand(0, 26), rx: p.r * rand(1.8, 3.6) + Math.abs(p.vx) * 0.004, ry: p.r * rand(0.35, 0.7), a: rand(0.55, 0.9), sat });
            if (this.decals.length > 420) this.decals.shift();
            p.life = 0;
          }
          if (p.k === 's' && p.y > 0) { p.y = 0; p.vy *= -0.35; p.vx *= 0.6; }
        }
        if (p.life <= 0) P.splice(i, 1);
      }
      // fading ink stains
      const D = this.decals;
      for (let i = D.length - 1; i >= 0; i--) { const d = D[i]; if (d.fade) { d.age += dt; if (d.age >= d.fade) D.splice(i, 1); } }
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i]; t.life -= dt; t.y -= 40 * dt;
        if (t.life <= 0) this.texts.splice(i, 1);
      }
    },
    drawDecals(ctx) {
      ctx.save();
      const bc = (S.theme && S.theme.blood) || '#4a0a0c', red = bloodOn();
      for (const d of this.decals) {
        if (!d.c && !red) continue; // blood stains never show in ink mode (e.g. the setting changed mid-fight)
        ctx.globalAlpha = d.fade ? d.a * clamp(1.4 * (1 - d.age / d.fade), 0, 1) : d.a;
        ctx.fillStyle = d.c || bc;
        ctx.beginPath(); ctx.ellipse(d.x, d.y, d.rx, d.ry, 0, 0, 6.283);
        if (d.sat) for (const q of d.sat) { ctx.moveTo(d.x + q[0] + q[2], d.y + q[1]); ctx.ellipse(d.x + q[0], d.y + q[1], q[2], q[2] * 0.4, 0, 0, 6.283); }
        ctx.fill();
        if (!d.c) { ctx.globalAlpha = d.a * 0.35; ctx.fillStyle = '#b3242a'; ctx.beginPath(); ctx.ellipse(d.x - d.rx * 0.2, d.y - d.ry * 0.2, d.rx * 0.45, d.ry * 0.35, 0, 0, 6.283); ctx.fill(); }
      }
      ctx.restore();
    },
    draw(ctx) {
      ctx.save();
      for (const p of this.parts) {
        const t = p.life / p.max;
        if (p.k === 'b') {
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
          ctx.strokeStyle = '#8e0f12'; ctx.lineWidth = p.r * 1.7; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.014, p.y - p.vy * 0.014); ctx.stroke();
        } else if (p.k === 'i') { // ink droplet: rimmed streak
          ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'round';
          const tx = p.x - p.vx * 0.016, ty = p.y - p.vy * 0.016;
          ctx.globalAlpha = 0.2; ctx.strokeStyle = `rgb(${INK_RIM})`; ctx.lineWidth = p.r * 1.9 + 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.globalAlpha = 1; ctx.strokeStyle = INK; ctx.lineWidth = p.r * 1.9;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(tx, ty); ctx.stroke();
        } else if (p.k === 'k') { // calligraphy stroke
          this.drawStroke(ctx, p);
        } else if (p.k === 'x') { // sumi splash
          this.drawSplash(ctx, p);
        } else if (p.k === 'c') { // cloth scrap
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, t * 3);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(p.ph)));
          ctx.fillStyle = p.c; ctx.beginPath();
          ctx.moveTo(-p.w / 2, -p.h / 2); ctx.lineTo(p.w / 2, -p.h / 2 + 1); ctx.lineTo(p.w / 2 - 1.5, p.h / 2); ctx.lineTo(-p.w / 2 + 2, p.h / 2 - 0.5); ctx.closePath(); ctx.fill();
          ctx.globalAlpha *= 0.5; ctx.strokeStyle = `rgb(${INK_RIM})`; ctx.lineWidth = 0.8; ctx.stroke();
          ctx.restore();
        } else if (p.k === 'm') {
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = t * 0.5;
          ctx.fillStyle = '#7a0d10';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        } else if (p.k === 'd') {
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = t * 0.28;
          ctx.fillStyle = '#8d93a8';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        } else if (p.k === 's') {
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, t * 2);
          ctx.strokeStyle = `rgb(${p.c})`; ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.022, p.y - p.vy * 0.022); ctx.stroke();
        } else if (p.k === 'f') {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = t;
          ctx.translate(p.x, p.y); ctx.rotate(p.a);
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
          g.addColorStop(0, `rgba(${p.c},1)`); g.addColorStop(0.3, `rgba(${p.c},.45)`); g.addColorStop(1, `rgba(${p.c},0)`);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.ellipse(0, 0, p.size * (1.6 - t * 0.6), p.size * 0.16, 0, 0, 6.283); ctx.fill();
          ctx.beginPath(); ctx.ellipse(0, 0, p.size * 0.5, p.size * 0.5, 0, 0, 6.283); ctx.fill();
          ctx.restore();
        } else if (p.k === 'r') {
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = t;
          ctx.strokeStyle = `rgb(${p.c})`; ctx.lineWidth = 3 * t + 0.5;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.15 - t), 0, 6.283); ctx.stroke();
        }
      }
      ctx.restore();
    },
    // Tapered brush stroke that is drawn on in the first fifth of its life, then thins and fades (world coords)
    drawStroke(ctx, p) {
      const age = p.max - p.life - (p.delay || 0);
      if (age < 0) return;
      const u = age / (p.max - (p.delay || 0)), grow = Math.min(1, u / 0.18), fade = u < 0.45 ? 1 : 1 - (u - 0.45) / 0.55;
      const L = p.len * (0.35 + 0.65 * ND.M.ease.outCubic(grow)), W = p.w * (0.55 + 0.45 * fade);
      const c = Math.cos(p.a), s = Math.sin(p.a), nx = -s, ny = c, N = 14;
      const top = [], bot = [];
      for (let i = 0; i <= N; i++) {
        const q = i / N, along = (q - 0.5) * L, off = Math.sin(q * Math.PI) * p.bend * L * 0.25;
        // dry-brush edge: pressure swells early, frays at the tail
        const w = W * Math.pow(Math.sin(Math.PI * Math.min(1, q * 1.15)), 0.6) * (1 - 0.25 * Math.sin(q * 11 + p.seed));
        const cx = p.x + c * along + nx * off, cy = p.y + s * along + ny * off;
        top.push(cx + nx * w, cy + ny * w); bot.push(cx - nx * w * 0.7, cy - ny * w * 0.7);
      }
      const path = () => {
        ctx.beginPath(); ctx.moveTo(top[0], top[1]);
        for (let i = 2; i < top.length; i += 2) ctx.lineTo(top[i], top[i + 1]);
        for (let i = bot.length - 2; i >= 0; i -= 2) ctx.lineTo(bot[i], bot[i + 1]);
        ctx.closePath();
      };
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.5 * fade; ctx.strokeStyle = `rgb(${INK_RIM})`; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; path(); ctx.stroke();
      ctx.globalAlpha = 0.95 * fade; ctx.fillStyle = INK; path(); ctx.fill();
      // a hair-thin cold highlight along the stroke's spine, like wet ink catching moonlight
      ctx.globalAlpha = 0.35 * fade; ctx.strokeStyle = `rgb(${INK_RIM})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x - c * L * 0.32, p.y - s * L * 0.32); ctx.lineTo(p.x + c * L * 0.2, p.y + s * L * 0.2); ctx.stroke();
    },
    // Sumi splash: a round core with spikes, bursting out fast and fading
    drawSplash(ctx, p) {
      const u = 1 - p.life / p.max, e = ND.M.ease.outCubic(Math.min(1, u / 0.35)), a = u < 0.4 ? 1 : 1 - (u - 0.4) / 0.6;
      const R = p.r * (0.45 + 0.75 * e);
      const path = (k) => {
        ctx.beginPath(); ctx.arc(p.x, p.y, R * 0.8 * k, 0, 6.283);
        for (const [sa, len, wid, dot] of p.spikes) {
          const L = R * len * k, bx = Math.cos(sa), by = Math.sin(sa), px = -by, py = bx, w = R * wid * k;
          ctx.moveTo(p.x + px * w, p.y + py * w); ctx.quadraticCurveTo(p.x + bx * L * 0.7 + px * w * 0.4, p.y + by * L * 0.7 + py * w * 0.4, p.x + bx * L, p.y + by * L);
          ctx.quadraticCurveTo(p.x + bx * L * 0.7 - px * w * 0.4, p.y + by * L * 0.7 - py * w * 0.4, p.x - px * w, p.y - py * w); ctx.closePath();
          if (dot) { ctx.moveTo(p.x + bx * L * 1.2 + R * 0.11 * k, p.y + by * L * 1.2); ctx.arc(p.x + bx * L * 1.2, p.y + by * L * 1.2, R * 0.11 * k, 0, 6.283); }
        }
      };
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.32 * a; ctx.fillStyle = `rgb(${INK_RIM})`; path(1.1); ctx.fill();
      ctx.globalAlpha = 0.92 * a; ctx.fillStyle = INK; path(1); ctx.fill();
    },
    drawTexts(ctx) {
      for (const t of this.texts) {
        const a = Math.min(1, t.life / t.max * 2.2);
        const x = cam.sx(t.x), y = cam.sy(t.y);
        const sc = 1 + Math.max(0, (t.life - t.max + 0.12)) * 4;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = a;
        ctx.font = `600 ${Math.round(22 * cam.s * sc)}px Oswald, "Noto Serif JP", "Arial Narrow", sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 5 * cam.s; ctx.strokeStyle = 'rgba(5,6,12,.85)';
        ctx.strokeText(t.str, x, y);
        ctx.fillStyle = t.color; ctx.fillText(t.str, x, y);
        ctx.restore();
      }
    },
  };

  const BUSH = [[-0.7, 0.15, 0.55], [-0.1, -0.2, 0.7], [0.55, 0.05, 0.6], [0.1, 0.25, 0.8]], BUSH_HI = [[-0.2, -0.45, 0.4], [0.45, -0.2, 0.3]];
  const FALL_DASH = [['rgba(60,118,116,.32)', [70, 45], 380, 0], ['rgba(255,255,255,.6)', [36, 80], 520, 6], ['rgba(210,240,236,.45)', [120, 70], 300, 3]];
  const CRATERS = [[-0.3, -0.1, 0.22], [0.25, 0.2, 0.16], [0.05, -0.4, 0.1], [0.35, -0.25, 0.08]];
  const CPUFF = [[-150, 4, 110, 18], [-70, -10, 80, 26], [20, -16, 95, 32], [110, -4, 90, 22], [190, 6, 80, 14], [0, 10, 230, 14]];

  // ------------------------------------------------------------ ARENA TEMALARI
  const THEMES = ND.THEMES = {
    temple: {
      sky: ['#05070f', '#0f1630', '#262d4c', '#141828'], stars: 1,
      orb: { x: 0.74, y: 0.2, r: 0.075, c0: '#fbf5e4', c1: '#e2d6b6', halo: '240,228,200', craters: true },
      cloud: 'rgba(40,46,78,.55)', ridgeA: ['#1a2140', '#1a2140'], ridgeB: ['#151b33', '#151b33'], fog: '60,70,110',
      mid: '#10152a', trees: 'round', pagoda: true, torii: '#2a1016', near: 'bamboo', bambooC: [18, 28, 32],
      floor: ['#2b3045', '#23283a', '#0d0f17'], wall: '#161a27', joint: 'rgba(8,9,14,.55)', fence: '#12151f',
      weather: 'petal', reflect: 0.12, sheen: '230,225,210', key: { from: 1, c: '170,190,255', a: 0.16 },
      lantern: '255,170,80', blood: '#4a0a0c', ambience: 'wind', wind: 0, fgC: '#05060a', bloom: 0.55, rays: '220,225,255', motes: '255,230,190',
    },
    rain: {
      sky: ['#030507', '#0a1016', '#1a242c', '#0b0f13'], stars: 0, orb: null,
      cloud: 'rgba(16,22,30,.9)', ridgeA: ['#111920', '#111920'], ridgeB: ['#0d141a', '#0d141a'], fog: '48,62,76',
      mid: '#0a1015', trees: 'round', pagoda: false, torii: '#24100f', near: 'bamboo', bambooC: [14, 26, 22],
      floor: ['#262e35', '#1b2228', '#080b0e'], wall: '#12181d', joint: 'rgba(5,7,9,.6)', fence: '#0e1317',
      weather: 'rain', reflect: 0.26, sheen: '190,210,230', key: { from: 1, c: '150,180,210', a: 0.12 },
      lantern: '255,160,70', blood: '#3d0a0c', ambience: 'rain', wind: -260, lightning: true, fgC: '#030405', bloom: 0.5,
    },
    snow: {
      sky: ['#1a2143', '#4b4f7a', '#c48c93', '#efc3a1'], stars: 0.25,
      orb: { x: 0.24, y: 0.46, r: 0.055, c0: '#fff6e6', c1: '#ffcfa6', halo: '255,196,150' },
      cloud: 'rgba(130,112,150,.4)', ridgeA: ['#e4e6f2', '#6d739a'], ridgeB: ['#c9cde0', '#545a7e'], fog: '220,196,210',
      mid: '#2b3048', trees: 'pine', pagoda: false, torii: false, near: 'pine', bambooC: [34, 40, 58],
      floor: ['#d7dcea', '#b4bbd0', '#737a95'], wall: '#8c93ad', joint: 'rgba(110,120,150,.3)', fence: '#3a3f55',
      weather: 'snow', reflect: 0.05, sheen: '255,230,210', key: { from: -1, c: '255,200,160', a: 0.2 },
      lantern: '255,170,90', blood: '#8c0f16', ambience: 'blizzard', wind: -110, prints: true, fgC: '#1c2033', bloom: 0.2, rays: '255,210,170'
    },
    // --- Yeni arenalar: props → far_/mid_/near_/edge_ çizimleri, floorStyle → floor_, fg → fg_, lamps → lights()
    village: {
      sky: ['#07030a', '#1c0a12', '#57190f', '#2a0d08'], stars: 0.15,
      orb: { x: 0.2, y: 0.17, r: 0.045, c0: '#ffc9a0', c1: '#cf5f3b', halo: '255,110,60' },
      cloud: 'rgba(36,13,13,.78)', cloudHi: 'rgba(255,110,50,.13)', cloudN: 8, cloudV: 14, cloudK: 1.6, skyGlow: '255,90,30',
      ridgeA: ['#3a1512', '#2a0e0c'], ridgeB: ['#250b0b', '#1c0909'], fog: '120,42,22',
      mid: '#170709', trees: 'round', pagoda: false, torii: false, near: null, props: 'village',
      floor: ['#2e1d18', '#21140f', '#080404'], wall: '#1a0e0c', wallHi: 'rgba(255,120,50,.12)', joint: 'rgba(5,2,2,.5)',
      floorStyle: 'ash', fence: '#0c0606', fenceStyle: 'broken',
      weather: 'embers', reflect: 0.04, sheen: '255,120,60', key: { from: -1, c: '255,120,60', a: 0.18 }, tint: '255,100,40',
      lantern: '255,120,40', lamps: [{ x: -(ND.ARENA - 90), y: -75, fire: 1 }, { x: ND.ARENA - 90, y: -75, fire: 1 }],
      blood: '#3a0707', ambience: 'fire', wind: 50, fgC: '#070304', fg: 'posts', bloom: 0.75, vig: 'rgba(14,2,0,.66)', fogA: 0.07,
    },
    market: {
      sky: ['#05040d', '#0f0b22', '#281a36', '#140c1a'], stars: 0.45,
      orb: { x: 0.84, y: 0.13, r: 0.026, c0: '#fff4dc', c1: '#e8d2a8', halo: '240,220,190' },
      cloud: 'rgba(34,26,52,.5)', ridgeA: ['#171229', '#171229'], ridgeB: null, fog: '90,50,70',
      mid: '#1b1322', trees: null, pagoda: false, torii: false, near: null, props: 'market', skyline: '#140e21',
      floor: ['#4a3223', '#36241a', '#110a07'], wall: '#23160f', joint: 'rgba(14,7,3,.6)', floorStyle: 'wood', fence: false,
      weather: null, reflect: 0.14, sheen: null, key: { from: -1, c: '255,160,100', a: 0.14 },
      lantern: '255,110,60', lamps: [{ x: -720, y: -290 }, { x: 720, y: -290 }, { x: 0, y: -330, k: 0.55, ns: 1 }],
      blood: '#420a0c', ambience: 'market', wind: -30, fgC: '#0a0507', fg: 'chochin', bloom: 0.8, motes: '255,200,150', vig: 'rgba(8,2,6,.58)',
    },
    waterfall: {
      sky: ['#8fb8c0', '#c7ddd5', '#efe6c8', '#c4d6c6'], stars: 0,
      orb: { x: 0.6, y: 0.12, r: 0.042, c0: '#fffdf0', c1: '#fff0c8', halo: '255,246,215' },
      cloud: 'rgba(255,255,255,.4)', ridgeA: ['#8db1a8', '#a9c6bc'], ridgeB: ['#6a938a', '#86aca1'], fog: '215,232,226',
      mid: '#2e4c40', trees: null, pagoda: false, torii: false, near: null, props: 'falls',
      floor: ['#747b6b', '#545d4f', '#1d2420'], wall: '#3e6a68', wallStyle: 'river', joint: 'rgba(15,22,20,.55)', floorStyle: 'rock', fence: false,
      weather: 'spray', reflect: 0.2, sheen: '255,250,230', key: { from: 1, c: '255,246,220', a: 0.16 },
      lantern: '255,230,190', lamps: [], blood: '#6a0c10', ambience: 'water', wind: -25, fgC: '#0e1d16', fg: 'foliage',
      bloom: 0.3, rays: '255,248,220', motes: '255,255,235', vig: 'rgba(8,26,28,.3)', fogA: 0.13,
    },
    castle: {
      sky: ['#02030a', '#0a1026', '#1c2544', '#0b0f1e'], stars: 0.8,
      orb: { x: 0.64, y: 0.3, r: 0.15, c0: '#fffaf0', c1: '#e6dcc4', halo: '225,220,205', craters: true },
      cloud: 'rgba(14,18,36,.86)', cloudHi: 'rgba(160,170,210,.2)', cloudN: 8, cloudV: 70, cloudK: 1.1, cloudY: 0.2, cloudPuff: true,
      ridgeA: ['#18203a', '#131a30'], ridgeABase: 70, ridgeB: null, fog: '50,60,95',
      mid: '#0b0f1e', trees: null, pagoda: false, torii: false, near: null, props: 'castle',
      floor: ['#343b52', '#232838', '#07080d'], wall: '#1b2030', wallStyle: 'none', joint: 'rgba(0,0,0,.35)', floorStyle: 'tiles', fence: false,
      weather: 'gust', reflect: 0.05, sheen: '220,225,240', key: { from: 1, c: '200,212,255', a: 0.24 },
      lantern: '255,170,90', lamps: [], blood: '#4a0a0c', ambience: 'gale', wind: -300, gust: 180, fgC: '#04050a', fg: 'banners', bloom: 0.5,
    },
  };

  // ------------------------------------------------------------ SAHNE
  const S = ND.scene = {
    t: 0, wind: 0, flashL: 0, nextBolt: 8, bolt: null, theme: THEMES.temple, themeId: 'temple',
    parts: [], stars: [], ridgeA: [], ridgeB: [], bamboo: [], fgBamboo: [], trees: [], splashes: [],

    init() {
      const r = seeded(7);
      for (let i = 0; i < 160; i++) this.stars.push({ x: r(), y: r() * 0.55, s: r() * 1.3 + 0.3, p: r() * 6 });
      const ridge = (amp, base, seed) => {
        const rr = seeded(seed), pts = [];
        const ph = [rr() * 6, rr() * 6, rr() * 6];
        for (let x = -3200; x <= 3200; x += 30) {
          const h = base + amp * (0.55 * Math.sin(x * 0.0021 + ph[0]) + 0.3 * Math.sin(x * 0.0057 + ph[1]) + 0.15 * Math.sin(x * 0.013 + ph[2])) + (rr() - 0.5) * amp * 0.06;
          pts.push([x, -h]);
        }
        return pts;
      };
      this.ridgeA = ridge(170, 330, 3);
      this.ridgeB = ridge(120, 200, 11);
      for (let i = 0; i < 70; i++) {
        const x = -2400 + i * 70 + r() * 50;
        if (Math.abs(x + 520) < 150) continue;
        this.bamboo.push({ x, h: 420 + r() * 260, w: 7 + r() * 6, p: r() * 6, shade: r() });
      }
      for (let i = 0; i < 26; i++) this.trees.push({ x: -2200 + i * 170 + r() * 90, h: 120 + r() * 120, w: 70 + r() * 60, seed: (r() * 1e6) | 0 });
      this.fgBamboo = [-1300, -620, 700, 1450, 2100, -2000].map((x, i) => ({ x, w: 26 + (i % 3) * 8, p: i }));
      this.motes = Array.from({ length: 46 }, () => ({ x: rand(-900, 900), y: rand(-360, -10), p: rand(0, 6), r: rand(0.8, 2) }));
      this.initProps();
      this.setTheme('temple');
    },

    // Yeni arenaların sabit (tohumlu) yerleşimleri
    initProps() {
      const q = seeded(1234), P = this.P = {};
      // Yanan köy
      P.vMid = []; for (let x = -2300; x < 2300; x += 150 + q() * 130) P.vMid.push({ x, w: 90 + q() * 80, h: 90 + q() * 60, roof: q() < 0.5 ? 0 : 1, burn: q() < 0.55 ? 0.5 + q() * 0.5 : 0, s: q() * 10 });
      P.vNear = []; for (let x = -2000; x < 2000; x += 300 + q() * 200) P.vNear.push({ x, w: 170 + q() * 110, h: 110 + q() * 70, roof: q() < 0.2 ? 2 : q() < 0.5 ? 0 : 1, burn: q() < 0.6 ? 0.6 + q() * 0.4 : 0, s: q() * 10 });
      P.scorch = Array.from({ length: 34 }, () => { const rx = 50 + q() * 180; return { x: (q() - 0.5) * 4800, y: -30 + q() * 330, rx, ry: rx * (0.12 + q() * 0.1) }; });
      P.ash = Array.from({ length: 70 }, () => ({ x: (q() - 0.5) * 3600, y: -38 + q() * 240, s: 1.5 + q() * 2.5, g: q() < 0.5 ? 0 : 1 }));
      P.debris = Array.from({ length: 16 }, () => ({ x: (q() - 0.5) * 4000, y: -30 + q() * 200, l: 40 + q() * 90, a: q() - 0.5 }));
      // Gece çarşısı
      P.sky = []; for (let x = -3000; x < 3000; x += 50 + q() * 90) P.sky.push({ x, w: 50 + q() * 80, h: 30 + q() * 120, win: q() < 0.6 });
      P.mach = []; for (let x = -2400; x < 2400;) { const w = 170 + q() * 80; P.mach.push({ x: x + w / 2, w, h: 270 + q() * 80, s: q() * 10 }); x += w + 6; }
      const NC = [['#26315c', '#e9e2cf'], ['#7c1c1a', '#f0e6d0'], ['#d8cfb8', '#2a1c14'], ['#1d3a2b', '#e9e2cf'], ['#3b1d3a', '#f0e6d0']];
      P.stalls = []; for (let x = -1900; x < 1900; x += 330 + q() * 90) { const c = NC[(q() * NC.length) | 0]; P.stalls.push({ x, w: 190 + q() * 70, col: c[0], mark: c[1], steam: q() < 0.65, s: q() * 10 }); }
      // Şelale
      const FX = -20;
      P.cliff = []; for (let x = -2800; x <= 2800; x += 50) { const d = Math.abs(x - FX); P.cliff.push([x, d < 230 ? -380 : -410 - 160 * Math.min(1, (d - 230) / 500) - 40 * Math.sin(x * 0.0035) + (q() - 0.5) * 26 + Math.max(0, d - 1500) * 0.25]); }
      const cy = (x) => P.cliff[clamp(Math.round((x + 2800) / 50), 0, P.cliff.length - 1)][1];
      P.cliffY = cy;
      P.ftrees = []; for (let x = -2600; x < 2600; x += 90 + q() * 90) { if (Math.abs(x - FX) < 300) continue; P.ftrees.push({ x, y: cy(x) + 14, h: 60 + q() * 60, w: 60 + q() * 60, seed: (q() * 1e6) | 0 }); }
      P.strata = Array.from({ length: 40 }, () => ({ x: (q() - 0.5) * 4800, y: -380 + q() * 330, l: 80 + q() * 200, d: (q() - 0.5) * 40 }));
      const offFall = () => { let x = (q() - 0.5) * 4800; if (Math.abs(x - FX) < 300) x += 700; return x; };
      P.vines = Array.from({ length: 40 }, () => { const x = offFall(); return { x, y: cy(x) + 6, l: 40 + q() * 150 }; });
      P.bushes = Array.from({ length: 46 }, () => { const x = offFall(), y0 = cy(x); return { x, y: y0 + 40 + q() * (-120 - y0 - 40), r: 18 + q() * 34 }; });
      const rock = (x, w, h) => {
        const pts = [[x - w / 2, 30]];
        for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI, k = 0.82 + q() * 0.3; pts.push([x + Math.cos(a) * (w / 2) * k, -Math.abs(Math.sin(a)) * h * k]); }
        pts.push([x + w / 2, 30]);
        return { x, w, h, pts, m: q() };
      };
      P.rocks = []; for (let x = -2200; x < 2200; x += 160 + q() * 200) { if (Math.abs(x) < 380) continue; P.rocks.push(rock(x, 170 + q() * 220, 130 + q() * 130)); }
      P.nTrees = [-1500, -900, 820, 1400, 2000].map((x) => ({ x, h: 240 + q() * 120, w: 150 + q() * 80, seed: (q() * 1e6) | 0 }));
      P.eRocks = []; for (const s of [-1, 1]) { P.eRocks.push(rock(s * (ND.ARENA + 90), 250, 230)); P.eRocks.push(rock(s * (ND.ARENA + 300), 320, 170)); P.eRocks.push(rock(s * (ND.ARENA + 10), 120, 90)); }
      P.cracks = [];
      for (const y0 of [-22, 30, 110, 250]) { const pts = []; for (let x = -3000; x <= 3000; x += 60 + q() * 60) pts.push([x, y0 + (q() - 0.5) * (8 + y0 * 0.12)]); P.cracks.push(pts); }
      const rowsY = [-45, -22, 30, 110, 250, 480];
      for (let i = 0; i < 60; i++) { const r = (q() * 5) | 0, x = (q() - 0.5) * 5000, y0 = rowsY[r], y1 = rowsY[r + 1]; P.cracks.push([[x, y0], [x + (q() - 0.5) * 30 * (1 + r), (y0 + y1) / 2], [x + (q() - 0.5) * 50 * (1 + r), y1]]); }
      P.puddles = Array.from({ length: 12 }, () => { const rx = 40 + q() * 110; return { x: (q() - 0.5) * 3600, y: -10 + q() * 200, rx, ry: rx * 0.14 }; });
      P.moss = Array.from({ length: 40 }, () => ({ x: (q() - 0.5) * 5000, y: -42 + q() * 16, rx: 20 + q() * 70, ry: 3 + q() * 5 }));
      // Kale çatısı
      const towns = P.towns = Array.from({ length: 16 }, () => [(q() - 0.5) * 3600, q()]);
      P.city = []; for (let i = 0; i < 480; i++) { const T = towns[(q() * towns.length) | 0], d = clamp(T[1] + (q() - 0.5) * 0.25, 0, 1); P.city.push({ x: T[0] + (q() - 0.5) * (160 + 500 * d), y: -232 + d * d * 125, s: 1.6 + d * 3, c: q() < 0.7 ? 0 : q() < 0.6 ? 1 : 2, g: q() < 0.5 ? 0 : 1 }); }
      P.turrets = [{ x: -1250, w: 150, b: -40, n: 3 }, { x: -620, w: 110, b: -30, n: 2 }, { x: 760, w: 130, b: -40, n: 3 }, { x: 1500, w: 100, b: -20, n: 2 }];
      P.cpines = [{ x: -900, h: 210 }, { x: 1150, h: 230 }, { x: -1900, h: 200 }, { x: 2000, h: 190 }];
      P.gables = [{ x: -1250, w: 260, top: -430 }, { x: 1300, w: 300, top: -470 }];
    },

    setTheme(id) {
      this.themeId = THEMES[id] ? id : 'temple';
      this.theme = THEMES[this.themeId];
      // yalnız etkin temanın önbellek tuvalleri bellekte kalır
      for (const k in THEMES) {
        const C = THEMES[k]._c;
        if (!C || THEMES[k] === this.theme) continue;
        for (const n in C) { const v = C[n], c = v && (v.getContext ? v : v.c); if (c && c.getContext) c.width = c.height = 0; }
        THEMES[k]._c = null;
      }
      this.wind = this.theme.wind;
      this.parts = [];
      const n = { petal: 70, rain: 320, snow: 220, embers: 150, spray: 130, gust: 70 }[this.theme.weather] || 0;
      for (let i = 0; i < n; i++) this.parts.push(this.newPart(true));
      for (const p of this.parts) if (p.lt) p.l = rand(0, p.lt);
      this.flashL = 0; this.bolt = null; this.nextBolt = rand(4, 9);
      ND.audio.setAmbience && ND.audio.setAmbience(this.theme.ambience);
    },

    newPart(anywhere) {
      const w = this.theme.weather, front = Math.random() < 0.35;
      const p = { x: cam.x + rand(-1500, 1500), y: anywhere ? rand(-760, 60) : rand(-900, -760), a: rand(0, 6), va: rand(-3, 3), p: rand(0, 6), front };
      if (w === 'rain') { p.vy = rand(1300, 1700); p.vx = this.wind * 1.4; p.len = rand(18, 34); p.y = anywhere ? rand(-800, 0) : rand(-950, -800); }
      else if (w === 'snow') { p.vy = rand(40, 95) * (front ? 1.4 : 1); p.vx = rand(-20, 20); p.r = front ? rand(2.2, 4.2) : rand(1, 2.4); }
      else if (w === 'embers') { // yükselen közler
        if (!anywhere) p.y = rand(0, 60);
        p.vy = -rand(40, 130); p.vx = rand(-30, 30); p.r = front ? rand(1.4, 2.8) : rand(0.8, 1.8); p.l = 0; p.lt = rand(2.5, 7); p.g = Math.random() < 0.5 ? 0 : 1;
      } else if (w === 'spray') { // şelale serpintisi
        p.y = rand(-600, 30); p.vy = -rand(5, 40); p.vx = rand(-30, 30); p.r = front ? rand(1.5, 3.4) : rand(0.8, 2); p.l = 0; p.lt = rand(2, 5);
      } else if (w === 'gust') { // rüzgâr çizgileri + savrulan yapraklar
        p.leaf = Math.random() < 0.3; p.vx = this.wind * (p.leaf ? rand(1.5, 2.3) : rand(3.5, 6)); p.vy = rand(-30, 50); p.len = rand(40, 150); p.r = rand(2, 3.5);
        p.y = rand(-750, 30); if (!anywhere) p.x = cam.x + (this.wind < 0 ? 1 : -1) * rand(1300, 1650);
      } else { p.vy = rand(30, 70); p.vx = rand(-40, 10); p.r = rand(2.2, 4); }
      return p;
    },

    // Karda ayak izi
    footprint(x, dir, big) {
      if (!this.theme.prints) return;
      fx.decals.push({ x: x + rand(-3, 3), y: rand(3, 16), rx: big ? 12 : 7.5, ry: big ? 3 : 2.2, a: 0.45, c: '#7d86a3' });
      if (fx.decals.length > 420) fx.decals.shift();
    },

    resize(W, H) { cam.W = W; cam.H = H; cam.s = Math.min(H / 720, W / 700); },

    update(dt) {
      this.t += dt;
      const th = this.theme;
      this.wind = th.wind + Math.sin(this.t * 0.4) * 60 + (th.gust ? th.gust * Math.sign(th.wind) * Math.pow(Math.max(0, Math.sin(this.t * 0.9)), 3) : 0);
      for (const p of this.parts) {
        if (th.weather === 'embers') {
          p.l += dt; p.x += (p.vx + this.wind * 0.5 + Math.sin(this.t * 1.7 + p.p) * 28) * dt; p.y += p.vy * dt;
          if (p.l > p.lt || p.y < -900) Object.assign(p, this.newPart(false));
        } else if (th.weather === 'spray') {
          p.l += dt; p.x += (p.vx + this.wind * 0.4 + Math.sin(this.t * 0.8 + p.p) * 12) * dt; p.y += (p.vy + Math.sin(this.t * 1.1 + p.p) * 8) * dt;
          if (p.l > p.lt) Object.assign(p, this.newPart(true));
        } else if (th.weather === 'gust') {
          p.x += p.vx * dt;
          if (p.leaf) { p.y += (p.vy + Math.sin(this.t * 3 + p.p) * 90) * dt; p.a += p.va * 3 * dt; }
          if ((p.vx < 0 ? p.x < cam.x - 1600 : p.x > cam.x + 1600) || p.y > 40) Object.assign(p, this.newPart(false));
        } else if (th.weather === 'rain') {
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.y > (p.front ? 30 : 0)) {
            if (Math.random() < 0.3 && Math.abs(p.x - cam.x) < 900) this.splashes.push({ x: p.x, y: rand(0, 30), life: 0.25 });
            Object.assign(p, this.newPart(false));
          }
        } else if (th.weather === 'snow') {
          p.x += (p.vx + this.wind * 0.6 + Math.sin(this.t * 1.1 + p.p) * 22) * dt; p.y += p.vy * dt;
          if (p.y > (p.front ? 40 : 10)) Object.assign(p, this.newPart(false));
        } else {
          p.x += (p.vx + Math.sin(this.t * 0.9 + p.p) * 30 - 25) * dt; p.y += p.vy * dt; p.a += p.va * dt;
          if (p.y > 40) Object.assign(p, this.newPart(false));
        }
        if (Math.abs(p.x - cam.x) > 1700) Object.assign(p, this.newPart(true));
      }
      for (let i = this.splashes.length - 1; i >= 0; i--) { this.splashes[i].life -= dt; if (this.splashes[i].life <= 0) this.splashes.splice(i, 1); }
      if (this.splashes.length > 120) this.splashes.splice(0, this.splashes.length - 120);
      // şimşek
      this.flashL = Math.max(0, this.flashL - dt * 3.2);
      if (th.lightning) {
        this.nextBolt -= dt;
        if (this.nextBolt <= 0) {
          this.nextBolt = rand(7, 15);
          this.flashL = 1;
          const bx = cam.W * rand(0.15, 0.85), pts = [[bx, 0]];
          let x = bx, y = 0;
          while (y < cam.H * 0.45) { x += rand(-40, 40) * cam.s; y += rand(20, 50) * cam.s; pts.push([x, y]); }
          this.bolt = { pts, life: 0.25 };
          setTimeout(() => { this.flashL = Math.max(this.flashL, 0.7); }, 120);
          ND.audio.thunder && ND.audio.thunder(rand(0.25, 1.1));
        }
        if (this.bolt) { this.bolt.life -= dt; if (this.bolt.life <= 0) this.bolt = null; }
      }
    },

    // Gök: dikey gradyan + ay halesi bir kez önbellek tuvaline çizilir (gradyan yatayda sabit olduğundan tuval,
    // halenin paralaksı kadar tam piksel kaydırılarak basılır). Yıldızlar, ay diski, bulutlar canlı çizilir.
    skyCache() {
      const th = this.theme, W = cam.W, H = cam.H, C = tc(th), o = th.orb;
      const M = Math.ceil(0.02 * cam.s * 1100) + 2;
      if (C.sky && C.skyW === W && C.skyH === H) return C.sky;
      const c = C.sky || document.createElement('canvas');
      c.width = W + 2 * M; c.height = H; C.skyW = W; C.skyH = H; C.skyM = M;
      const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, th.sky[0]); g.addColorStop(0.45, th.sky[1]); g.addColorStop(0.62, th.sky[2]); g.addColorStop(1, th.sky[3]);
      x.fillStyle = g; x.fillRect(0, 0, c.width, H);
      if (o) {
        const mx = M + W * o.x, my = H * o.y, mr = H * o.r;
        const halo = x.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 6);
        halo.addColorStop(0, `rgba(${o.halo},.35)`); halo.addColorStop(0.3, `rgba(${o.halo},.1)`); halo.addColorStop(1, `rgba(${o.halo},0)`);
        x.fillStyle = halo; x.fillRect(mx - mr * 6 - 1, my - mr * 6 - 1, mr * 12 + 2, mr * 12 + 2);
      }
      return (C.sky = c);
    },
    // Kabarık bulut kalıbı: CPUFF elipslerinin birleşimi (yarı saydam renkte tek yol olarak çizilmeli; ayrı ayrı
    // çizilse örtüşmeler koyulaşır). Ölçek (u) ya da renk değişince yeniden çizilir.
    puffSprite(pass, v, u, col) {
      const C = tc(this.theme), A = C.puff || (C.puff = []), key = pass * 4 + v;
      let s = A[key];
      if (s && s._u === u && s._col === col) return s;
      s = s || document.createElement('canvas');
      s.width = Math.ceil(532 * u) + 4; s.height = Math.ceil(84 * u) + 4; s._u = u; s._col = col;
      const x = s.getContext('2d'), ox = 262 * u + 2, oy = 50 * u + 2;
      x.fillStyle = col; x.beginPath();
      for (const [a, b, rx, ry] of CPUFF) { x.moveTo(ox + (a + rx) * u, oy + b * u); x.ellipse(ox + a * u, oy + b * u, rx * u, ry * u, 0, 0, 6.283); }
      x.fill();
      return (A[key] = s);
    },
    drawSky(ctx) {
      const W = cam.W, H = cam.H, t = this.t, th = this.theme, o = th.orb;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const sc = this.skyCache(), M = tc(th).skyM;
      const sh = Math.round(clamp(cam.x * 0.02 * cam.s, -M + 1, M - 1)); // halenin paralaksı (tam piksel)
      ctx.drawImage(sc, M + sh, 0, W, H, 0, 0, W, H);
      const mx = W * o?.x - cam.x * 0.02 * cam.s, my = H * o?.y, mr = H * o?.r;
      if (th.stars) {
        ctx.fillStyle = '#dfe6ff';
        // yıldızlar eskiden halenin altında kalıyordu: hale önbellekte olduğundan örtme payı alfaya yansıtılır
        const hx = W * o?.x - sh, hr0 = mr * 0.8, hr1 = mr * 2.36, hr2 = mr * 6;
        for (const s of this.stars) {
          let a = (0.35 + 0.35 * Math.sin(t * 1.3 + s.p)) * th.stars;
          const sx = ((s.x * W - cam.x * 0.01 * cam.s) % W + W) % W, sy = s.y * H * 0.8;
          if (o) {
            const d = Math.hypot(sx - hx, sy - my);
            if (d < hr2) a *= 1 - (d <= hr0 ? 0.35 : d <= hr1 ? 0.35 - 0.25 * (d - hr0) / (hr1 - hr0) : 0.1 * (hr2 - d) / (hr2 - hr1));
          }
          ctx.globalAlpha = a;
          ctx.fillRect(sx, sy, s.s, s.s);
        }
        ctx.globalAlpha = 1;
      }
      if (o) {
        const mg = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
        mg.addColorStop(0, o.c0); mg.addColorStop(1, o.c1);
        ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.283); ctx.fill();
        if (o.craters) {
          ctx.fillStyle = 'rgba(160,150,130,.18)';
          for (const [a, b, c] of CRATERS) { ctx.beginPath(); ctx.arc(mx + a * mr, my + b * mr, c * mr, 0, 6.283); ctx.fill(); }
        }
      }
      // yangın ufku: titreyen turuncu gök ışıması (şerit en parlak halinde; titreşim globalAlpha ile)
      if (th.skyGlow) {
        const C = tc(th), gy = cam.gy - cam.y * cam.k, ff = this.fireF(1.3) / 1.1;
        if (!C.glow) { C.glowB = `rgba(${th.skyGlow},${0.6 * 1.1})`; C.glow = vstrip([[0, `rgba(${th.skyGlow},0)`], [0.7, `rgba(${th.skyGlow},${0.22 * 1.1})`], [1, C.glowB]]); }
        ctx.globalAlpha = ff;
        vgrad(ctx, C.glow, H * 0.15, gy, C.glowB);
        ctx.globalAlpha = 1;
      }
      const heavy = th.weather === 'rain', cn = th.cloudN || (heavy ? 10 : 6), cv = th.cloudV || (heavy ? 30 : 8), k = th.cloudK || (heavy ? 2.2 : 1), cy0 = th.cloudY || 0.1;
      for (let pass = th.cloudHi ? 0 : 1; pass < 2; pass++) {
        ctx.fillStyle = pass ? th.cloud : th.cloudHi; // pass 0: bulut kenarı ışığı
        const oy = pass ? 0 : -5 * cam.s;
        for (let i = 0; i < cn; i++) {
          const cx = ((i * 380 + t * cv - cam.x * 0.05 * cam.s) % (W + 800) + W + 800) % (W + 800) - 400;
          const cy = H * (cy0 + (i % 3) * 0.08) + oy;
          if (th.cloudPuff) { // kümelenmiş, kabarık bulut (yarı saydam birleşik şekil → ölçeğe göre önbellekli kalıp)
            const u = cam.s * k * (0.8 + (i % 4) * 0.15), sp = this.puffSprite(pass, i % 4, u, ctx.fillStyle);
            ctx.drawImage(sp, cx - 262 * u - 2, cy - 50 * u - 2);
            continue;
          }
          ctx.beginPath(); ctx.ellipse(cx, cy, 240 * cam.s * k, 10 * cam.s * k * 1.6, 0, 0, 6.283); ctx.fill();
          ctx.beginPath(); ctx.ellipse(cx + 90 * cam.s, cy - 8 * cam.s, 140 * cam.s * k, 8 * cam.s * k * 1.6, 0, 0, 6.283); ctx.fill();
        }
      }
      if (this.flashL > 0) {
        ctx.fillStyle = `rgba(200,215,255,${this.flashL * 0.45})`; ctx.fillRect(0, 0, W, H);
        if (this.bolt) {
          ctx.strokeStyle = `rgba(235,240,255,${Math.min(1, this.bolt.life * 5)})`; ctx.lineWidth = 2.5 * cam.s;
          ctx.beginPath(); this.bolt.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        }
      }
    },

    // Sırt: iki durak aynı renkse düz dolgu (gradyan gereksiz); yol yalnız görünen aralıkta ve opak zeminin
    // (dünya y = −45'in altı her temada opak zeminle örtülür) biraz altına kadar kurulur
    // Uzak sırt: durağan olduğundan katman önbelleğinden basılır (yalnız sırt tepesi ile opak zeminin üstü arası
    // bant saklanır). Önbelleğe çizim: iki durak aynıysa düz renk, yol yalnız önbellek genişliği kadar.
    drawRidge(ctx, pts, f, col, base) {
      if (pts._top === undefined) { pts._top = 1e9; for (const p of pts) if (p[1] < pts._top) pts._top = p[1]; }
      const top = pts._top;
      this.layerCache(ctx, 'ridge' + f, f, (x) => {
        if (col[0] === col[1]) x.fillStyle = col[0];
        else { const g = x.createLinearGradient(0, -520 + base, 0, base); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]); x.fillStyle = g; }
        const m = x.getTransform(), lx0 = -m.e / m.a - 40, lx1 = (x.canvas.width - m.e) / m.a + 40;
        let i0 = 0, i1 = pts.length - 1;
        while (i0 < i1 && pts[i0 + 1][0] < lx0) i0++;
        while (i1 > i0 && pts[i1 - 1][0] > lx1) i1--;
        x.beginPath(); x.moveTo(pts[i0][0], 200);
        for (let i = i0; i <= i1; i++) x.lineTo(pts[i][0], pts[i][1] + base);
        x.lineTo(pts[i1][0], 200); x.closePath(); x.fill();
      }, top + base - 4, floorTop());
    },

    drawPagoda(ctx, x, base, col = '#10152a') {
      ctx.fillStyle = col;
      let y = base;
      for (let i = 0; i < 5; i++) {
        const w = 150 - i * 20, h = 52 - i * 3;
        ctx.fillRect(x - w * 0.33, y - h, w * 0.66, h);
        ctx.beginPath();
        ctx.moveTo(x - w * 0.62, y - h - 4);
        ctx.quadraticCurveTo(x - w * 0.4, y - h + 2, x - w * 0.2, y - h - 18);
        ctx.lineTo(x + w * 0.2, y - h - 18);
        ctx.quadraticCurveTo(x + w * 0.4, y - h + 2, x + w * 0.62, y - h - 4);
        ctx.lineTo(x + w * 0.55, y - h + 4); ctx.lineTo(x - w * 0.55, y - h + 4); ctx.closePath(); ctx.fill();
        if (i === 1 || i === 3) {
          ctx.fillStyle = `rgba(255,170,90,${0.25 + 0.1 * Math.sin(this.t * 3 + i)})`;
          ctx.fillRect(x - 6, y - h * 0.7, 12, h * 0.35);
          ctx.fillStyle = col;
        }
        y -= h + 14;
      }
      ctx.fillRect(x - 2, y - 70, 4, 74);
      for (let j = 0; j < 6; j++) ctx.fillRect(x - 7, y - 14 - j * 9, 14, 3);
    },

    // Ağaç: opak renkli elips kümesi. Her elips ayrı doldurulur (opak renkte birleşimle aynı görüntü; GPU'da çok
    // alt yollu tek yol yazılım maskesine düştüğü için pahalı). Elips parametreleri ağaç başına bir kez hesaplanır.
    drawTree(ctx, tr) {
      let E = tr._e;
      if (!E) {
        const r = seeded(tr.seed); E = tr._e = [];
        for (let j = 0; j < 7; j++) { const cx = tr.x + (r() - 0.5) * tr.w, cy = -tr.h * (0.35 + r() * 0.6), rr = tr.w * (0.25 + r() * 0.25); E.push(cx, cy, rr); }
      }
      for (let j = 0; j < 21; j += 3) { ctx.beginPath(); ctx.ellipse(E[j], E[j + 1], E[j + 2], E[j + 2] * 0.55, 0, 0, 6.283); ctx.fill(); }
      ctx.fillRect(tr.x - 3, -tr.h * 0.4, 6, tr.h * 0.4 + 10);
    },

    drawPine(ctx, x, h, w, col, snow, sway) {
      ctx.fillStyle = col;
      ctx.fillRect(x - w * 0.05, -h * 0.25, w * 0.1, h * 0.25 + 10);
      for (let i = 0; i < 5; i++) {
        const y0 = -h * (0.18 + i * 0.17), ww = w * (1 - i * 0.17), s = sway * (i + 1) * 0.3;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(x - ww / 2, y0); ctx.lineTo(x + s, y0 - h * 0.26); ctx.lineTo(x + ww / 2, y0); ctx.closePath(); ctx.fill();
        if (snow) {
          ctx.fillStyle = snow;
          ctx.beginPath(); ctx.moveTo(x - ww * 0.3, y0 - h * 0.1); ctx.lineTo(x + s, y0 - h * 0.26); ctx.lineTo(x + ww * 0.3, y0 - h * 0.1);
          ctx.quadraticCurveTo(x, y0 - h * 0.14, x - ww * 0.3, y0 - h * 0.1); ctx.fill();
        }
      }
    },

    drawTorii(ctx, x, col) {
      ctx.fillStyle = col;
      ctx.fillRect(x - 118, -300, 18, 300); ctx.fillRect(x + 100, -300, 18, 300);
      ctx.fillRect(x - 140, -262, 280, 14);
      ctx.beginPath();
      ctx.moveTo(x - 190, -318); ctx.quadraticCurveTo(x, -296, x + 190, -318);
      ctx.lineTo(x + 180, -300); ctx.quadraticCurveTo(x, -280, x - 180, -300); ctx.closePath(); ctx.fill();
      ctx.fillRect(x - 6, -300, 12, 40);
      ctx.fillStyle = 'rgba(210,120,110,.12)';
      ctx.fillRect(x - 118, -300, 4, 300); ctx.fillRect(x + 100, -300, 4, 300);
    },

    drawBambooGrove(ctx) {
      const t = this.t, [cr, cg, cb] = this.theme.bambooC, wk = 1 + Math.abs(this.wind) / 200, C = tc(this.theme);
      if (!C.bam) { C.bam = []; for (let d = 0; d < 15; d++) C.bam.push(`rgb(${cr + d},${cg + d},${cb + d})`, `rgb(${cr + d - 6},${cg + d - 4},${cb + d - 6})`); }
      const v = this.view(0.55);
      for (const b of this.bamboo) {
        if (b.x + 110 < v.x0 || b.x - 110 > v.x1) continue; // ekran dışı sap (salınım + yaprak payı)
        const sway = Math.sin(t * 0.6 * wk + b.p) * 8 * wk + this.wind * 0.03;
        const d = (b.shade * 14) | 0;
        ctx.strokeStyle = C.bam[d * 2];
        ctx.lineWidth = b.w;
        // sap: eğri yerine 6 düz parça (kalın eğri kontur GPU'da pahalı, düz çizgi hızlı yol). Sapma < 0.1 birim.
        // Ara eklemler yuvarlak uçla örtülür (opak renk → dikiş yok); en üst parça düz uçla biter (eskisi gibi).
        let px = b.x, py = 20;
        ctx.lineCap = 'round';
        for (let s = 1; s <= 6; s++) {
          const u = s / 6, iu = 1 - u;
          const qx = iu * iu * b.x + 2 * u * iu * (b.x + sway * 0.3) + u * u * (b.x + sway), qy = iu * iu * 20 + 2 * u * iu * (-b.h * 0.5) + u * u * (-b.h);
          if (s === 6) ctx.lineCap = 'butt';
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.stroke();
          px = qx; py = qy;
        }
        ctx.fillStyle = C.bam[d * 2 + 1];
        for (let y = 60; y < b.h; y += 70) {
          const k = y / b.h, xx = b.x + sway * k * k;
          ctx.fillRect(xx - b.w * 0.65, -y, b.w * 1.3, 2.5);
        }
        // yapraklar tek tek (opak renk; GPU'da çok alt yollu tek yol pahalı)
        for (let j = 0; j < 5; j++) {
          const k = 0.55 + j * 0.1, xx = b.x + sway * k * k, yy = -b.h * k, dd = j % 2 ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + dd * 26, yy - 6, xx + dd * 46, yy + 10 + Math.sin(t * wk + j) * 3);
          ctx.quadraticCurveTo(xx + dd * 24, yy + 4, xx, yy);
          ctx.fill();
        }
      }
    },

    drawLantern(ctx, x) {
      const fl = this.lanternFlicker(x);
      const lc = this.theme.lantern;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, -96, 4, x, -96, 260);
      g.addColorStop(0, `rgba(${lc},${0.35 * fl})`); g.addColorStop(0.4, `rgba(${lc},${0.08 * fl})`); g.addColorStop(1, `rgba(${lc},0)`);
      ctx.fillStyle = g; ctx.fillRect(x - 260, -360, 520, 420);
      ctx.translate(x, 14); ctx.scale(1, 0.2);
      const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, 260);
      pool.addColorStop(0, `rgba(${lc},${0.26 * fl})`); pool.addColorStop(1, `rgba(${lc},0)`);
      ctx.fillStyle = pool; ctx.beginPath(); ctx.arc(0, 0, 260, 0, 6.283); ctx.fill();
      ctx.restore();
      ctx.fillStyle = this.themeId === 'snow' ? '#4a4f68' : '#1c1f2b';
      ctx.fillRect(x - 26, -18, 52, 18); ctx.fillRect(x - 8, -70, 16, 54); ctx.fillRect(x - 22, -80, 44, 10);
      ctx.fillRect(x - 18, -112, 36, 32);
      ctx.beginPath(); ctx.moveTo(x - 36, -112); ctx.lineTo(x, -138); ctx.lineTo(x + 36, -112); ctx.closePath(); ctx.fill();
      ctx.fillRect(x - 4, -148, 8, 12);
      if (this.themeId === 'snow') { ctx.fillStyle = '#e8ebf5'; ctx.beginPath(); ctx.moveTo(x - 34, -114); ctx.lineTo(x, -140); ctx.lineTo(x + 34, -114); ctx.quadraticCurveTo(x, -124, x - 34, -114); ctx.fill(); }
      ctx.fillStyle = `rgba(255,190,110,${0.85 * fl})`;
      ctx.fillRect(x - 9, -106, 18, 20);
    },
    lanternFlicker(x) { return 0.85 + 0.15 * Math.sin(this.t * 13 + x) * Math.sin(this.t * 7.3 + x * 0.3); },
    // Işık kaynakları (dünya koordinatları) — dövüşçü aydınlatması için
    // (karede birkaç kez çağrılır: aynı an + tema için sonuç yeniden kullanılır, çöp üretmez)
    lights() {
      const th = this.theme, LC = this._lc || (this._lc = { t: NaN, th: null, a: [] });
      if (LC.t === this.t && LC.th === th) return LC.a;
      LC.t = this.t; LC.th = th;
      const a = LC.a;
      if (th.lamps) {
        a.length = th.lamps.length;
        th.lamps.forEach((L, i) => { const o = a[i] || (a[i] = {}); o.x = L.x; o.y = L.y; o.f = (L.fire ? this.fireF(L.x) : this.lanternFlicker(L.x)) * (L.k || 1); o.c = L.c || th.lantern; o.shadow = !L.ns; });
      } else {
        const A = ND.ARENA - 90; a.length = 2;
        for (let i = 0; i < 2; i++) { const o = a[i] || (a[i] = {}), x = i ? A : -A; o.x = x; o.y = -100; o.f = this.lanternFlicker(x); o.c = th.lantern; o.shadow = true; }
      }
      return a;
    },

    drawFloor(ctx) {
      const A = ND.ARENA, th = this.theme;
      if (th.wallStyle === 'river') this.drawRiver(ctx);
      else if (th.wallStyle !== 'none') {
        ctx.fillStyle = th.wall; ctx.fillRect(-3000, -70, 6000, 30);
        ctx.fillStyle = th.wallHi || 'rgba(255,255,255,.05)'; ctx.fillRect(-3000, -72, 6000, 4);
      }
      // zemin gradyanı (dünya y −45 → 420) önbellekli şeritten; üst kenar kesirli kalır, altı düz renk
      const C = tc(th);
      C.floor = C.floor || vstrip([[0, th.floor[0]], [0.25, th.floor[1]], [1, th.floor[2]]]);
      vgrad(ctx, C.floor, cam.sy(-45), cam.sy(420), th.floor[2]);
      cam.world(ctx);
      if ((th.orb || th.weather === 'rain') && th.sheen) {
        const mx = cam.x + (cam.W * ((th.orb ? th.orb.x : 0.5) - 0.5)) / cam.k;
        const rg = ctx.createRadialGradient(mx, 10, 5, mx, 10, 320);
        const a = th.weather === 'rain' ? 0.06 + this.flashL * 0.25 : 0.13;
        rg.addColorStop(0, `rgba(${th.sheen},${a})`); rg.addColorStop(1, `rgba(${th.sheen},0)`);
        ctx.fillStyle = rg; ctx.save(); ctx.translate(mx, 10); ctx.scale(2.2, 0.35); ctx.translate(-mx, -10);
        ctx.fillRect(mx - 330, -320, 660, 660); ctx.restore();
      }
      if (th.floorStyle) this['floor_' + th.floorStyle](ctx);
      else this.floorJoints(ctx);
      if (th.weather === 'rain') {
        ctx.strokeStyle = 'rgba(190,210,230,.25)'; ctx.lineWidth = 1;
        for (const s of this.splashes) {
          const k = 1 - s.life / 0.25;
          ctx.beginPath(); ctx.ellipse(s.x, s.y, 3 + k * 12, 1 + k * 3, 0, 0, 6.283); ctx.stroke();
        }
      }
      if (th.fence) for (const s of [-1, 1]) {
        ctx.fillStyle = th.fence;
        if (th.fenceStyle === 'broken') { // yanmış, kırık çit
          ctx.beginPath();
          for (let i = 0; i < 9; i++) {
            if (i % 4 === 2) continue;
            const x = s * (A + 40 + i * 26), h = 150 - ((i * 53) % 70) + (i % 2) * 14;
            beam(ctx, x, 30, h + 30, 10, -Math.PI / 2 + (((i * 7) % 5) - 2) * 0.07 * s);
          }
          beam(ctx, s > 0 ? A + 30 : -A - 30, -120, 150, 7, s > 0 ? 0.12 : Math.PI - 0.12);
          beam(ctx, s > 0 ? A + 30 : -A - 30, -60, 260, 7, s > 0 ? -0.03 : Math.PI + 0.03);
          ctx.fill();
          continue;
        }
        for (let i = 0; i < 9; i++) {
          const x = s * (A + 40 + i * 26);
          ctx.fillRect(x - 5, -150 + (i % 2) * 14, 10, 150 + 30);
          if (th.prints) { ctx.fillStyle = '#e6e9f3'; ctx.fillRect(x - 6, -152 + (i % 2) * 14, 12, 4); ctx.fillStyle = th.fence; }
        }
        ctx.fillRect(s > 0 ? A + 30 : -A - 30 - 260, -120, 260, 7);
        ctx.fillRect(s > 0 ? A + 30 : -A - 30 - 260, -60, 260, 7);
      }
    },

    // Taş döşeme derzleri / kar dalgaları (eski arenalar)
    floorJoints(ctx) {
      const th = this.theme;
      ctx.strokeStyle = th.joint; ctx.lineWidth = 1.5;
      const vx = cam.x, vy = -260;
      ctx.beginPath();
      if (th.weather !== 'snow') {
        for (let x = -3000; x <= 3000; x += 110) {
          const tt = (-45 - vy) / (700 - vy);
          ctx.moveTo(vx + (x - vx) * tt, -45); ctx.lineTo(x, 700);
        }
        let y = -45, step = 9;
        while (y < 700) { ctx.moveTo(-3000, y); ctx.lineTo(3000, y); y += step; step *= 1.35; }
      } else {
        // kar dalgaları
        for (let i = 0; i < 7; i++) {
          const y = -30 + i * i * 9;
          ctx.moveTo(-3000, y);
          for (let x = -3000; x <= 3000; x += 120) ctx.quadraticCurveTo(x + 60, y + Math.sin(x * 0.01 + i) * 4 - 3, x + 120, y);
        }
      }
      ctx.stroke();
    },

    drawBack(ctx) {
      const th = this.theme, pr = th.props, C = tc(th);
      this.drawSky(ctx);
      PM('sky');
      this.drawRidge(ctx, this.ridgeA, 0.06, th.ridgeA, th.ridgeABase ?? -80);
      if (!C.fog1) { C.fog1 = vstrip([[0, `rgba(${th.fog},0)`], [1, `rgba(${th.fog},.35)`]]); C.fog1b = `rgba(${th.fog},.35)`; }
      vgrad(ctx, C.fog1, cam.H * 0.35, cam.H * 0.62, C.fog1b, floorTop());
      if (th.ridgeB) this.drawRidge(ctx, this.ridgeB, 0.14, th.ridgeB, -60);
      if (pr && this['far_' + pr]) this['far_' + pr](ctx);
      PM('far');
      cam.layer(ctx, 0.28);
      ctx.fillStyle = th.mid;
      if (th.trees === 'pine') for (const tr of this.trees) this.drawPine(ctx, tr.x, tr.h * 1.3, tr.w * 0.8, th.mid, 'rgba(230,232,245,.55)', 0);
      else if (th.trees === 'round') for (const tr of this.trees) this.drawTree(ctx, tr);
      if (th.pagoda) this.drawPagoda(ctx, 420, -40);
      if (pr && this['mid_' + pr]) { ctx.save(); this['mid_' + pr](ctx); ctx.restore(); }
      PM('mid');
      cam.layer(ctx, 0.55);
      if (th.near === 'bamboo') this.drawBambooGrove(ctx);
      else if (th.near === 'pine') {
        const pc = C.pineC || (C.pineC = `rgb(${th.bambooC.join(',')})`);
        for (let i = 0; i < this.bamboo.length; i += 3) {
          const b = this.bamboo[i];
          this.drawPine(ctx, b.x, b.h * 0.8, 110 + b.w * 6, pc, 'rgba(236,238,248,.8)', Math.sin(this.t * 0.7 + b.p) * 3);
        }
      }
      if (th.torii) this.drawTorii(ctx, -520, th.torii);
      if (pr && this['near_' + pr]) { ctx.save(); this['near_' + pr](ctx); ctx.restore(); }
      PM('near');
      this.drawRays(ctx);
      if (!C.fog2) { C.fog2 = vstrip([[0, `rgba(${th.fog},0)`], [1, `rgba(${th.fog},.3)`]]); C.fog2b = `rgba(${th.fog},.3)`; }
      vgrad(ctx, C.fog2, cam.H * 0.4, cam.gy, C.fog2b, floorTop());
      PM('rays+fog');
      cam.world(ctx);
      this.drawFloor(ctx);
      PM('floor');
      if (pr) { if (this['edge_' + pr]) { ctx.save(); this['edge_' + pr](ctx); ctx.restore(); } }
      else {
        this.drawLantern(ctx, -ND.ARENA + 90);
        this.drawLantern(ctx, ND.ARENA - 90);
      }
      fx.drawDecals(ctx);
      PM('edge+decals');
    },

    // Ay/güneşten süzülen hacimsel ışık huzmeleri
    drawRays(ctx) {
      const th = this.theme;
      if (!th.rays || !th.orb || !ND.settings.hq) return;
      const W = cam.W, H = cam.H, ox = W * th.orb.x - cam.x * 0.02 * cam.s, oy = H * th.orb.y;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const base = (th.orb.x > 0.5 ? Math.PI * 0.62 : Math.PI * 0.38) + (i - 2.5) * 0.09 + Math.sin(this.t * 0.13 + i * 1.7) * 0.03;
        const len = H * 1.25, w = 0.022 + (i % 3) * 0.01;
        const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(base) * len, oy + Math.sin(base) * len);
        const a = 0.05 + 0.03 * Math.sin(this.t * 0.4 + i * 2.3);
        g.addColorStop(0, `rgba(${th.rays},${a})`); g.addColorStop(0.6, `rgba(${th.rays},${a * 0.4})`); g.addColorStop(1, `rgba(${th.rays},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(base - w) * len, oy + Math.sin(base - w) * len);
        ctx.lineTo(ox + Math.cos(base + w) * len, oy + Math.sin(base + w) * len); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    },
    drawMotes(ctx) {
      const th = this.theme;
      if (!th.motes || !ND.settings.hq) return;
      cam.world(ctx);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const m of this.motes) {
        const x = m.x + Math.sin(this.t * 0.3 + m.p) * 30 + cam.x * 0.2, y = m.y + Math.sin(this.t * 0.5 + m.p * 2) * 14;
        ctx.globalAlpha = 0.25 + 0.25 * Math.sin(this.t * 1.7 + m.p * 3);
        ctx.fillStyle = `rgb(${th.motes})`;
        ctx.beginPath(); ctx.arc(x, y, m.r, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    },

    // Hava parçacıkları tek tek çizilir: ekrana yayılmış yüzlerce alt yollu tek bir yol GPU rasterında büyük bir
    // yazılım maskesine düşüyordu (≈15 kat pahalı). Görünmeyenler atlanır. (Seyrek üst üste binmelerde yarı saydam
    // parçacıklar artık birleşim yerine üst üste harmanlanır — pratikte fark edilmez.)
    drawWeather(ctx, front) {
      cam.world(ctx);
      const th = this.theme, v = this.view(1), X0 = v.x0 - 40, X1 = v.x1 + 40, Y0 = v.y0 - 40, Y1 = v.y1 + 40;
      if (th.weather === 'rain') {
        ctx.strokeStyle = front ? 'rgba(190,205,225,.42)' : 'rgba(160,180,205,.22)'; ctx.lineWidth = front ? 1.4 : 1;
        for (const p of this.parts) {
          if (p.front !== front || p.x < X0 || p.x > X1 || p.y < Y0 || p.y > Y1) continue;
          const k = p.len / p.vy;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * k, p.y - p.vy * k); ctx.stroke();
        }
        return;
      }
      if (th.weather === 'snow') {
        ctx.fillStyle = front ? 'rgba(250,252,255,.9)' : 'rgba(235,238,250,.6)';
        for (const p of this.parts) {
          if (p.front !== front || p.x < X0 || p.x > X1 || p.y < Y0 || p.y > Y1) continue;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        }
        return;
      }
      if (th.weather === 'embers') { // hale + çekirdek, iki titreşim grubu
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let g = 0; g < 2; g++) {
          const fl = 0.7 + 0.3 * Math.sin(this.t * (7 + g * 5) + g * 2);
          for (let pass = 0; pass < 2; pass++) {
            ctx.globalAlpha = pass ? 0.9 * fl : 0.16 * fl;
            ctx.fillStyle = pass ? (g ? 'rgb(255,214,140)' : 'rgb(255,150,60)') : 'rgb(255,90,20)';
            for (const p of this.parts) {
              if (p.front !== front || p.g !== g || p.x < X0 || p.x > X1 || p.y < Y0 || p.y > Y1) continue;
              const r = p.r * (pass ? 1 : 3.4) * Math.sin(Math.PI * clamp(p.l / p.lt, 0, 1));
              if (r <= 0) continue;
              ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.283); ctx.fill();
            }
          }
        }
        ctx.restore();
        return;
      }
      if (th.weather === 'spray') {
        ctx.fillStyle = front ? 'rgba(240,250,250,.5)' : 'rgba(230,245,245,.3)';
        for (const p of this.parts) {
          if (p.front !== front || p.x < X0 || p.x > X1 || p.y < Y0 || p.y > Y1) continue;
          const r = p.r * Math.sin(Math.PI * clamp(p.l / p.lt, 0, 1));
          if (r <= 0) continue;
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.283); ctx.fill();
        }
        return;
      }
      if (th.weather === 'gust') {
        ctx.strokeStyle = front ? 'rgba(200,210,240,.2)' : 'rgba(170,185,220,.12)'; ctx.lineWidth = front ? 1.6 : 1;
        for (const p of this.parts) {
          if (p.front !== front || p.leaf || p.y < Y0 || p.y > Y1) continue;
          const x1 = p.x - Math.sign(p.vx) * p.len;
          if (Math.max(p.x, x1) < X0 || Math.min(p.x, x1) > X1) continue;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(x1, p.y); ctx.stroke();
        }
        ctx.fillStyle = front ? '#15161e' : 'rgba(30,32,44,.8)';
        for (const p of this.parts) {
          if (p.front !== front || !p.leaf || p.x < X0 || p.x > X1 || p.y < Y0 || p.y > Y1) continue;
          const rx = p.r * 1.8, ry = p.r * (0.3 + 0.6 * Math.abs(Math.sin(p.a * 1.3)));
          ctx.beginPath(); ctx.ellipse(p.x, p.y, rx, ry, p.a, 0, 6.283); ctx.fill();
        }
        return;
      }
      if (th.weather !== 'petal') return;
      ctx.fillStyle = front ? 'rgba(236,170,190,.85)' : 'rgba(200,150,175,.55)';
      for (const p of this.parts) {
        if (p.front !== front || p.x < X0 || p.x > X1 || p.y < Y0 || p.y > Y1) continue;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.scale(1, Math.abs(Math.sin(p.a * 1.7)) * 0.8 + 0.2);
        ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.6, p.r, 0, 0, 6.283); ctx.fill();
        ctx.restore();
      }
    },
    drawPetals(ctx, front) { this.drawWeather(ctx, front); },

    drawFront(ctx) {
      const th = this.theme;
      this.drawMotes(ctx);
      this.drawWeather(ctx, true);
      cam.layer(ctx, 1.45);
      if (th.fg) { ctx.save(); this['fg_' + th.fg](ctx); ctx.restore(); }
      else for (const b of this.fgBamboo) {
        const sway = Math.sin(this.t * 0.5 + b.p) * 6;
        ctx.strokeStyle = th.fgC; ctx.lineWidth = b.w;
        ctx.beginPath(); ctx.moveTo(b.x, 400); ctx.lineTo(b.x + sway, -900); ctx.stroke();
        ctx.fillStyle = th.fgC;
        for (let y = -40; y > -900; y -= 110) ctx.fillRect(b.x + sway * (-y / 900) - b.w * 0.7, y, b.w * 1.4, 5);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const W = cam.W, H = cam.H, t = this.t;
      ctx.fillStyle = `rgba(${th.fog},${th.fogA ?? (th.weather === 'snow' ? 0.1 : 0.05)})`;
      for (let i = 0; i < 4; i++) {
        const x = ((i * 520 + t * (22 - this.wind * 0.1) - cam.x * cam.k * 1.1) % (W + 900) + W + 900) % (W + 900) - 450;
        ctx.beginPath(); ctx.ellipse(x, cam.sy(10), 420 * cam.s, 36 * cam.s, 0, 0, 6.283); ctx.fill();
      }
      if (th.weather === 'rain' && this.flashL > 0) { ctx.fillStyle = `rgba(210,225,255,${this.flashL * 0.18})`; ctx.fillRect(0, 0, W, H); }
      // vinyet: tam çözünürlükte bir kez çizilip önbellekten 1:1 basılır (tam ekran radyal gradyan her karede pahalı)
      const C = tc(th);
      if (!C.vig || C.vigW !== W || C.vigH !== H) {
        const c = C.vig || document.createElement('canvas'); c.width = W; c.height = H; C.vigW = W; C.vigH = H;
        const x = c.getContext('2d'), v = x.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.8);
        v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, th.vig || (th.weather === 'snow' ? 'rgba(20,16,40,.45)' : 'rgba(0,0,6,.62)'));
        x.fillStyle = v; x.fillRect(0, 0, W, H); C.vig = c;
      }
      ctx.drawImage(C.vig, 0, 0);
    },

    // ================================================= YENİ ARENALAR
    // Katmanın ekranda görünen bölgesi (katman koordinatlarında)
    view(f) {
      const k = cam.s * (1 + (cam.z - 1) * f), tx = cam.W / 2 - cam.x * f * k + cam.shx * f, ty = cam.gy - cam.y * cam.k + cam.shy * f;
      return { x0: -tx / k, x1: (cam.W - tx) / k, y0: -ty / k, y1: (cam.H - ty) / k, k };
    },
    // Paralaks katmanı önbelleği: katmanın durağan kısmı ekran çözünürlüğünde (kenar paylı) bir kez çizilir, kamera
    // kaydıkça yalnız ötelenerek basılır (kamera durunca birebir). Ölçek %1.5'ten çok değişir, pay aşılır ya da
    // tuval/tema değişirse yeniden çizilir.
    // ly0: içeriğin katman uzayındaki üst sınırı; ybot: gereken en alt ekran satırı (ör. opak zeminin üstü) —
    // önbellek yalnız bu yatay bandı tutar (bellek).
    layerCache(ctx, key, f, draw, ly0 = -1e5, ybot = cam.H) {
      const W = cam.W, H = cam.H, C = tc(this.theme), k = cam.s * (1 + (cam.z - 1) * f);
      const tx = W / 2 - cam.x * f * k + cam.shx * f, ty = cam.gy - cam.y * cam.k + cam.shy * f;
      const Y0 = Math.max(0, k * ly0 + ty), Y1 = Math.min(H, ybot);
      if (Y1 <= Y0) return;
      let L = C[key], r = L ? k / L.k : 0;
      const ox = L ? tx - (L.tx - L.x0) * r : 0, oy = L ? ty - (L.ty - L.y0) * r : 0;
      if (!L || L.W !== W || L.H !== H || Math.abs(r - 1) > 0.015 || ox > 0 || ox + L.c.width * r < W || oy > Y0 || oy + L.c.height * r < Y1) {
        const M = Math.ceil(W * 0.12), MY = Math.ceil(H * 0.12);
        const x0 = -M, y0 = Math.max(-MY, Math.floor(k * ly0 + ty) - 2), y1 = Math.min(H + MY, Math.ceil(Y1) + MY);
        if (!L) L = C[key] = { c: document.createElement('canvas') };
        const c = L.c, x = c.getContext('2d');
        if (c.width !== W + 2 * M || c.height !== y1 - y0) { c.width = W + 2 * M; c.height = y1 - y0; }
        else { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); }
        x.setTransform(k, 0, 0, k, tx - x0, ty - y0);
        x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
        draw(x);
        L.W = W; L.H = H; L.k = k; L.tx = tx; L.ty = ty; L.x0 = x0; L.y0 = y0;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(c, x0, y0);
        return;
      }
      ctx.setTransform(r, 0, 0, r, ox, oy);
      ctx.drawImage(L.c, 0, 0);
    },
    fireF(x) { const t = this.t; return clamp(0.8 + 0.12 * Math.sin(t * 11 + x) + 0.08 * Math.sin(t * 23.7 + x * 1.7) + 0.06 * Math.sin(t * 5.3 + x * 0.3), 0.55, 1.1); },

    // ---------------- ateş ve duman
    drawFlames(ctx, cx, by, w, h, seed) {
      const t = this.t, n = Math.max(3, Math.round(w / 24)), lean = this.wind * 0.0016, fl = this.fireF(cx + seed);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glowAt(ctx, '255,100,30', cx, by - h * 0.35, w * 0.8 + h * 0.7, h * 1.1 + 20, 0.5 * fl);
      ctx.globalAlpha = 1;
      for (let pass = 0; pass < 2; pass++) {
        const k = pass ? 0.55 : 1;
        ctx.fillStyle = pass ? 'rgba(255,214,130,.7)' : 'rgba(255,96,24,.62)';
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const ph = seed * 1.7 + i * 2.3, x = cx - w / 2 + (i + 0.5) * (w / n), ww = (w / n) * 0.75 * k + 3 * k;
          const hh = h * k * (0.6 + 0.25 * Math.sin(t * 7 + ph) + 0.15 * Math.sin(t * 13.3 + ph * 1.3)) * (i % 2 ? 0.75 : 1) * (1 - (Math.abs(i - (n - 1) / 2) / n) * 0.8);
          const tip = x + Math.sin(t * 4.3 + ph) * ww * 0.6 + hh * lean;
          ctx.moveTo(x - ww, by);
          ctx.quadraticCurveTo(x - ww * 0.9, by - hh * 0.6, tip, by - hh);
          ctx.quadraticCurveTo(x + ww * 0.9, by - hh * 0.6, x + ww, by);
        }
        ctx.fill();
      }
      ctx.restore();
    },
    drawSmoke(ctx, cx, by, s, seed, c) {
      ctx.fillStyle = `rgb(${c})`;
      for (let j = 0; j < 5; j++) {
        const ph = (((this.t * 0.06 + j / 5 + seed * 0.137) % 1) + 1) % 1;
        ctx.globalAlpha = Math.min(1, ph * 6) * (1 - ph) * 0.5;
        ctx.beginPath(); ctx.arc(cx + ph * ph * this.wind * 3 * s + Math.sin(ph * 7 + seed) * 18 * s, by - ph * 520 * s, (24 + ph * 120) * s, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    // ---------------- YANAN KÖY
    drawHouse(ctx, o, col) {
      const { x, w, h } = o;
      ctx.fillStyle = col;
      if (o.roof === 2) { // yıkık ev: direkler, eğik kiriş, enkaz
        ctx.beginPath();
        beam(ctx, x - w * 0.45, 10, h * 0.9, 10, -Math.PI / 2); beam(ctx, x, 10, h * 0.55, 10, -Math.PI / 2 + 0.1); beam(ctx, x + w * 0.4, 10, h * 1.1, 10, -Math.PI / 2 - 0.05);
        beam(ctx, x - w * 0.55, -h * 0.55, w * 1.1, 12, -0.28);
        ctx.moveTo(x - w * 0.6, 12); ctx.lineTo(x - w * 0.3, -h * 0.25); ctx.lineTo(x + w * 0.1, -h * 0.15); ctx.lineTo(x + w * 0.55, 12); ctx.closePath();
        ctx.fill();
        return;
      }
      ctx.fillRect(x - w / 2, -h, w, h + 10);
      ctx.beginPath();
      if (o.roof === 0) { // saz çatı
        const top = -h - w * 0.5;
        ctx.moveTo(x - w / 2 - 16, -h + 6); ctx.quadraticCurveTo(x - w * 0.42, -h - w * 0.3, x - w * 0.14, top); ctx.lineTo(x + w * 0.14, top); ctx.quadraticCurveTo(x + w * 0.42, -h - w * 0.3, x + w / 2 + 16, -h + 6);
      } else { // kiremit çatı, kalkık saçak
        const top = -h - w * 0.3;
        ctx.moveTo(x - w / 2 - 26, -h - 8); ctx.quadraticCurveTo(x - w * 0.36, -h + 2, x - w * 0.3, top); ctx.lineTo(x + w * 0.3, top); ctx.quadraticCurveTo(x + w * 0.36, -h + 2, x + w / 2 + 26, -h - 8); ctx.lineTo(x + w / 2 + 18, -h + 5); ctx.lineTo(x - w / 2 - 18, -h + 5);
      }
      ctx.closePath(); ctx.fill();
      const fl = this.fireF(x);
      if (o.burn) { ctx.strokeStyle = `rgba(255,120,40,${0.4 * fl})`; ctx.lineWidth = 2.5; ctx.stroke(); } // ateş kenar ışığı
      // içeriden ateşle aydınlanan şoji pencereler
      const ww = w * 0.16, wh = h * 0.34, wy = -h * 0.86;
      ctx.fillStyle = `rgba(255,${(120 + 60 * fl) | 0},50,${(o.burn ? 0.75 : 0.28) * fl})`;
      ctx.fillRect(x - w * 0.3, wy, ww, wh); ctx.fillRect(x + w * 0.14, wy, ww, wh);
      ctx.fillStyle = col;
      for (const wx of [x - w * 0.3, x + w * 0.14]) { ctx.fillRect(wx + ww / 2 - 1, wy, 2, wh); ctx.fillRect(wx, wy + wh / 2 - 1, ww, 2); }
    },
    villageRow(ctx, L, f, col, s) {
      const v = this.view(f);
      const vis = (o, m) => o.x > v.x0 - m && o.x < v.x1 + m;
      for (const o of L) if (o.burn && vis(o, 500)) this.drawSmoke(ctx, o.x, o.roof === 2 ? -o.h * 0.6 : -o.h - 40, s, o.s, '24,10,10');
      // alevler çatının arkasından yükselir (taban gizli, ev silueti ışığa karşı)
      for (const o of L) if (o.burn && o.roof !== 2 && vis(o, o.w)) this.drawFlames(ctx, o.x, -o.h - o.w * (o.roof === 0 ? 0.12 : 0.06), o.w * 0.95 * o.burn, (60 + o.w * 0.8) * o.burn * s, o.s);
      for (const o of L) if (vis(o, o.w)) this.drawHouse(ctx, o, col);
      for (const o of L) if (o.burn && o.roof === 2 && vis(o, o.w)) this.drawFlames(ctx, o.x, -o.h * 0.1, o.w * 0.8 * o.burn, (40 + o.w * 0.6) * o.burn * s, o.s);
    },
    far_village(ctx) { // ufukta uzak yangınların ışıması
      cam.layer(ctx, 0.14);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) { const x = -2100 + i * 700 + Math.sin(i * 2.7) * 200; glowAt(ctx, '255,80,25', x, -120, 380 + (i % 3) * 120, 150, 0.28 * this.fireF(x)); }
      ctx.restore();
    },
    mid_village(ctx) { this.villageRow(ctx, this.P.vMid, 0.28, '#13070a', 0.8); },
    near_village(ctx) { this.villageRow(ctx, this.P.vNear, 0.55, '#0b0406', 1.15); },
    edge_village(ctx) { // arena kenarında yanan kiriş yığınları (ışık kaynağı)
      const A9 = ND.ARENA - 90;
      for (const s of [-1, 1]) {
        const x = s * A9, fl = this.fireF(x);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, '255,110,40', x, 10, 380, 70, 0.45 * fl); ctx.restore();
        this.drawSmoke(ctx, x, -150, 1, s + 3, '16,7,7');
        ctx.fillStyle = '#0c0605'; ctx.beginPath();
        beam(ctx, x - 70, 8, 150, 12, -0.5); beam(ctx, x + 60, 8, 140, 11, -2.6); beam(ctx, x - 20, 10, 120, 10, -1.2); beam(ctx, x - 90, 12, 180, 9, -0.08);
        ctx.fill();
        this.drawFlames(ctx, x, 6, 130, 160, s + 5);
        ctx.fillStyle = `rgba(255,120,40,${0.55 * fl})`; ctx.beginPath(); beam(ctx, x - 88, 9, 170, 2, -0.08); beam(ctx, x - 68, 6, 140, 2, -0.5); ctx.fill();
      }
    },
    floor_ash(ctx) { // is lekeleri, kömür kirişler, sönmekte olan közler
      const P = this.P, t = this.t, C = tc(this.theme), v = this.view(1);
      // ateş yansıması: şerit en parlak halinde, titreşim globalAlpha ile
      C.ash = C.ash || vstrip([[0, `rgba(255,90,30,${0.16 * 1.1})`], [1, 'rgba(255,90,30,0)']]);
      ctx.globalAlpha = this.fireF(2) / 1.1;
      ctx.drawImage(C.ash, 0, 0, 1, 256, Math.max(-3000, v.x0 - 8), -45, Math.min(3000, v.x1 + 8) - Math.max(-3000, v.x0 - 8), 205);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(4,2,2,.38)'; ctx.beginPath();
      for (const d of P.scorch) { ctx.moveTo(d.x + d.rx, d.y); ctx.ellipse(d.x, d.y, d.rx, d.ry, 0, 0, 6.283); }
      ctx.fill();
      ctx.fillStyle = 'rgba(10,5,4,.75)'; ctx.beginPath();
      for (const d of P.debris) beam(ctx, d.x, d.y, d.l, 4 + d.y * 0.02, d.a * 0.2);
      ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let g = 0; g < 2; g++) {
        ctx.fillStyle = `rgba(255,${100 + g * 50},40,${0.35 + 0.3 * Math.sin(t * (2.3 + g) + g * 2)})`; ctx.beginPath();
        for (const a of P.ash) if (a.g === g) ctx.rect(a.x, a.y, a.s * 1.6, a.s * 0.6);
        ctx.fill();
      }
      ctx.restore();
    },
    fg_posts(ctx) { // ön planda kömürleşmiş direkler, ateş tarafında kızıl kenar
      const v = this.view(1.45), fl = this.fireF(3);
      // direkler ayrı ayrı (ekran boyu tek yol GPU'da yazılım maskesine düşüyordu; direkler birbirine değmez)
      ctx.fillStyle = this.theme.fgC;
      for (const b of this.fgBamboo) { if (b.x < v.x0 - 400 || b.x > v.x1 + 400) continue; ctx.beginPath(); beam(ctx, b.x, v.y1 + 60, 1800, b.w * 1.25, -Math.PI / 2 + ((b.p % 3) - 1) * 0.1); ctx.fill(); }
      ctx.fillStyle = `rgba(255,110,40,${0.22 * fl})`;
      for (const b of this.fgBamboo) { if (b.x < v.x0 - 400 || b.x > v.x1 + 400) continue; ctx.beginPath(); beam(ctx, b.x + b.w * 0.55, v.y1 + 60, 1800, 3, -Math.PI / 2 + ((b.p % 3) - 1) * 0.1); ctx.fill(); }
    },

    // ---------------- GECE ÇARŞISI
    // Kâğıt fener (chōchin): (x,y) asılma noktası, r yarıçap, ang salınım açısı
    drawChochin(ctx, x, y, r, ang, fl) {
      const h = r * 1.3, cy = r * 0.5 + h;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.fillStyle = '#120806'; ctx.fillRect(-0.8, 0, 1.6, r * 0.5 + 1);
      ctx.fillRect(-r * 0.5, r * 0.5, r, r * 0.22); ctx.fillRect(-r * 0.5, cy + h - r * 0.2, r, r * 0.22);
      ctx.fillStyle = `rgb(${(170 + 70 * fl) | 0},${(38 + 30 * fl) | 0},24)`;
      ctx.beginPath(); ctx.ellipse(0, cy, r, h, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = `rgba(255,200,120,${0.55 * fl})`;
      ctx.beginPath(); ctx.ellipse(-r * 0.1, cy, r * 0.55, h * 0.75, 0, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(80,10,6,.45)'; ctx.lineWidth = Math.max(0.8, r * 0.06); ctx.beginPath();
      for (let i = -2; i <= 2; i++) { const yy = cy + i * h * 0.36, ww = r * Math.sqrt(1 - (i * 0.36) * (i * 0.36)); ctx.moveTo(-ww, yy); ctx.lineTo(ww, yy); }
      ctx.stroke();
      if (r > 13) { ctx.fillStyle = 'rgba(25,6,4,.7)'; ctx.fillRect(-r * 0.12, cy - h * 0.5, r * 0.24, h * 0.42); ctx.fillRect(-r * 0.3, cy + h * 0.02, r * 0.6, r * 0.14); ctx.fillRect(-r * 0.12, cy + h * 0.15, r * 0.24, h * 0.3); }
      ctx.restore();
    },
    // Fener dizisi: L = [x0,y0,x1,y1,...]; önce ışımalar, sonra gövdeler
    lanternRow(ctx, L, r, ga) {
      const t = this.t;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < L.length; i += 2) glowAt(ctx, '255,110,50', L[i], L[i + 1] + r * 1.8, r * 7, r * 7, ga * this.lanternFlicker(L[i]));
      ctx.restore();
      for (let i = 0; i < L.length; i += 2) this.drawChochin(ctx, L[i], L[i + 1], r, Math.sin(t * 1.5 + L[i] * 0.02) * 0.08 + this.wind * 0.0003, this.lanternFlicker(L[i]));
    },
    far_market(ctx) { // uzak çatılar + pagoda silueti
      const th = this.theme, v = this.view(0.14), S = this.P.sky;
      cam.layer(ctx, 0.14);
      // binalar tek tek (opak renk: birleşimle aynı; ekran boyu tek yol GPU'da yazılım maskesine düşüyordu)
      ctx.fillStyle = th.skyline;
      for (const b of S) {
        if (b.x < v.x0 - 150 || b.x > v.x1 + 150) continue;
        const y = -300 - b.h; ctx.fillRect(b.x - b.w / 2, y, b.w, 400 + b.h);
        ctx.beginPath(); ctx.moveTo(b.x - b.w / 2 - 12, y + 2); ctx.lineTo(b.x - b.w * 0.2, y - b.w * 0.22); ctx.lineTo(b.x + b.w * 0.2, y - b.w * 0.22); ctx.lineTo(b.x + b.w / 2 + 12, y + 2); ctx.closePath();
        ctx.fill();
      }
      ctx.save(); ctx.translate(-760, -300); ctx.scale(0.75, 0.75); this.drawPagoda(ctx, 0, 0, th.skyline); ctx.restore();
      ctx.fillStyle = 'rgba(255,190,120,.45)';
      for (const b of S) { if (!b.win || b.x < v.x0 - 150 || b.x > v.x1 + 150) continue; const y = -300 - b.h; ctx.fillRect(b.x - b.w * 0.3, y + 14, 5, 7); ctx.fillRect(b.x + b.w * 0.1, y + 30, 5, 7); }
    },
    mid_market(ctx) { // iki katlı machiya sırası, ışıklı kafesler
      const th = this.theme, v = this.view(0.28), t = this.t, lamps = [];
      for (const b of this.P.mach) {
        if (b.x + b.w < v.x0 || b.x - b.w > v.x1) continue;
        const x0 = b.x - b.w / 2, top = -b.h, ey = -b.h * 0.46;
        ctx.fillStyle = th.mid; ctx.fillRect(x0, top, b.w, b.h + 20);
        ctx.fillStyle = `rgba(255,176,100,${0.3 + 0.06 * Math.sin(t * 0.7 + b.s)})`;
        ctx.fillRect(x0 + b.w * 0.14, top + b.h * 0.16, b.w * 0.72, b.h * 0.16);
        ctx.fillRect(x0 + b.w * 0.08, ey + 20, b.w * 0.4, -ey - 34);
        ctx.fillStyle = 'rgba(255,200,130,.5)'; ctx.fillRect(x0 + b.w * 0.56, ey + 26, b.w * 0.3, -ey - 40);
        ctx.fillStyle = th.mid;
        for (let k = x0 + b.w * 0.14 + 6; k < x0 + b.w * 0.86; k += 8) ctx.fillRect(k, top + b.h * 0.16, 3, b.h * 0.16);
        for (let k = x0 + b.w * 0.08 + 5; k < x0 + b.w * 0.48; k += 7) ctx.fillRect(k, ey + 20, 2.5, -ey - 34);
        ctx.fillStyle = '#0d0813';
        ctx.beginPath(); ctx.moveTo(x0 - 16, top + 6); ctx.lineTo(x0 + 8, top - 30); ctx.lineTo(x0 + b.w - 8, top - 30); ctx.lineTo(x0 + b.w + 16, top + 6); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x0 - 12, ey + 12); ctx.lineTo(x0 - 2, ey - 10); ctx.lineTo(x0 + b.w + 2, ey - 10); ctx.lineTo(x0 + b.w + 12, ey + 12); ctx.fill();
        lamps.push(x0 + b.w * 0.5, ey + 12);
      }
      this.lanternRow(ctx, lamps, 9, 0.4);
    },
    near_market(ctx) { // yatai tezgâhları: noren perdeler, buhar, fenerler
      const v = this.view(0.55), t = this.t, lamps = [];
      for (const st of this.P.stalls) {
        const { x, w } = st, x0 = x - w / 2;
        if (x0 - 60 > v.x1 || x0 + w + 60 < v.x0) continue;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, '255,150,70', x, -140, w * 0.85, 150, 0.3 * this.lanternFlicker(x)); ctx.restore();
        ctx.fillStyle = '#1d110b'; ctx.fillRect(x0 + 2, -262, 9, 272); ctx.fillRect(x0 + w - 11, -262, 9, 272);
        ctx.fillStyle = '#2c1b11'; ctx.fillRect(x0 - 6, -96, w + 12, 110);
        ctx.fillStyle = '#4c3020'; ctx.fillRect(x0 - 10, -101, w + 20, 7);
        ctx.fillStyle = '#170d08'; ctx.beginPath();
        for (let i = 0; i < 2; i++) { const bx = x0 + w * (0.22 + i * 0.26); ctx.moveTo(bx - 15, -101); ctx.lineTo(bx - 11, -114); ctx.lineTo(bx + 11, -114); ctx.lineTo(bx + 15, -101); ctx.closePath(); }
        ctx.rect(x0 + w * 0.7, -128, 24, 27); ctx.rect(x0 + w * 0.7 - 3, -131, 30, 5);
        ctx.fill();
        if (st.steam) {
          ctx.fillStyle = 'rgb(236,230,240)';
          for (let j = 0; j < 5; j++) {
            const ph = (t * 0.22 + j / 5 + st.s) % 1;
            ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.13;
            ctx.beginPath(); ctx.arc(x0 + w * 0.7 + 12 + Math.sin(ph * 5 + j) * 10 + ph * this.wind * 0.6, -136 - ph * 150, 10 + ph * 28, 0, 6.283); ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = '#160c08'; ctx.beginPath(); ctx.moveTo(x0 - 26, -248); ctx.lineTo(x0 + w + 26, -248); ctx.lineTo(x0 + w + 8, -288); ctx.lineTo(x0 - 8, -288); ctx.fill();
        ctx.fillStyle = '#3b2517'; ctx.fillRect(x0 - 26, -250, w + 52, 5);
        const n = 4, pw = (w - 20) / n, sw = Math.sin(t * 1.3 + st.s) * 3 + this.wind * 0.02;
        ctx.fillStyle = st.col; ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const a = x0 + 10 + i * pw + 1.5, b = a + pw - 3, s2 = sw * (1 + 0.4 * Math.sin(t * 2.1 + i + st.s));
          ctx.moveTo(a, -245); ctx.lineTo(b, -245); ctx.lineTo(b + s2, -180); ctx.lineTo(a + s2, -180); ctx.closePath();
        }
        ctx.fill();
        ctx.strokeStyle = st.mark; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + sw * 0.6, -214, 12, 0, 6.283); ctx.stroke();
        ctx.fillStyle = '#d6c6a0'; ctx.fillRect(x0 + w - 4, -200, 16, 76);
        ctx.fillStyle = '#2a1a10'; for (let k = 0; k < 3; k++) ctx.fillRect(x0 + w, -192 + k * 22, 8, 12);
        lamps.push(x0 - 14, -250, x0 + w + 14, -250);
      }
      this.lanternRow(ctx, lamps, 15, 0.45);
    },
    edge_market(ctx) { // direkler, arena üstünde fener halatı, fıçılar
      const A9 = ND.ARENA - 90, ry = (x) => -408 + 78 * (1 - (x / A9) * (x / A9));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const L of this.lights()) glowAt(ctx, L.c, L.x, 14, 300, 46, 0.3 * L.f);
      ctx.restore();
      ctx.fillStyle = '#1b100a';
      for (const s of [-1, 1]) { const x = s * A9; ctx.fillRect(x - 9, -430, 18, 440); ctx.fillRect(x - 26, -438, 52, 10); ctx.fillRect(s > 0 ? x - 80 : x, -336, 80, 7); ctx.fillRect(x - 16, -12, 32, 14); }
      ctx.strokeStyle = '#150b07'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = -A9; x <= A9; x += 40) (x === -A9 ? ctx.moveTo(x, ry(x)) : ctx.lineTo(x, ry(x)));
      ctx.lineTo(A9, ry(A9)); ctx.stroke();
      const L = []; for (let x = -600; x <= 600; x += 100) L.push(x, ry(x));
      this.lanternRow(ctx, L, 11, 0.4);
      this.lanternRow(ctx, [-(A9 - 70), -333, A9 - 70, -333], 24, 0.55);
      for (const s of [-1, 1]) {
        const x = s * (ND.ARENA + 70);
        ctx.fillStyle = '#2a170d'; ctx.fillRect(x - 36, -84, 72, 90);
        ctx.fillStyle = '#140a06'; ctx.fillRect(x - 38, -70, 76, 6); ctx.fillRect(x - 38, -30, 76, 6);
        ctx.fillStyle = '#3a2616'; ctx.fillRect(x + s * 60 - 34, -60, 68, 66);
        ctx.strokeStyle = '#1a0f08'; ctx.lineWidth = 3; ctx.strokeRect(x + s * 60 - 34, -60, 68, 66);
      }
    },
    floor_wood(ctx) { // perspektifli ahşap tahtalar
      const th = this.theme, v = this.view(1), vx = cam.x, vy = -260, px = (X, y) => vx + (X - vx) * (y - vy) / (700 - vy);
      const rows = []; let y = -45, st = 10; while (y < 700) { rows.push(y); y += st; st *= 1.3; } rows.push(760);
      ctx.fillStyle = 'rgba(255,210,160,.035)'; ctx.beginPath();
      for (let i = 0; i < rows.length - 1; i += 2) ctx.rect(-3000, rows[i], 6000, rows[i + 1] - rows[i]);
      ctx.fill();
      ctx.strokeStyle = th.joint; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < rows.length - 1; i++) {
        const y0 = rows[i], y1 = rows[i + 1], off = (i * 157) % 380, sc = (y0 - vy) / (700 - vy);
        ctx.moveTo(-3000, y0); ctx.lineTo(3000, y0);
        const Xa = vx + (v.x0 - vx) / sc, Xb = vx + (v.x1 - vx) / sc;
        for (let X = Math.floor((Xa - off) / 380) * 380 + off; X < Xb + 380; X += 380) { ctx.moveTo(px(X, y0), y0); ctx.lineTo(px(X, y1), y1); }
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,180,.05)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < rows.length - 1; i++) { const yy = rows[i] + (rows[i + 1] - rows[i]) * 0.45; ctx.moveTo(-3000, yy); ctx.lineTo(3000, yy); }
      ctx.stroke();
    },
    fg_chochin(ctx) { // ekranın üstünde, flu büyük fener dizisi
      const v = this.view(1.45), H = v.y1 - v.y0, SP = 720, top = v.y0 + H * 0.02, sag = H * 0.07, r = H * 0.045;
      const ry = (x) => { const u = ((x % SP) + SP) % SP / SP * 2 - 1; return top + sag * (1 - u * u); };
      ctx.strokeStyle = this.theme.fgC; ctx.lineWidth = 3; ctx.beginPath();
      for (let x = Math.floor(v.x0 / 40) * 40; x <= v.x1 + 40; x += 40) (x === Math.floor(v.x0 / 40) * 40 ? ctx.moveTo(x, ry(x)) : ctx.lineTo(x, ry(x)));
      ctx.stroke();
      const L = [];
      for (let x = Math.floor(v.x0 / 240) * 240; x < v.x1 + 240; x += 240) if (((x % SP) + SP) % SP) L.push(x, ry(x));
      this.lanternRow(ctx, L, r, 0.35);
    },

    // ---------------- ŞELALE
    // Uçurumun durağan kısmı (kaya yüzü, güneş ışıması, katmanlar, sarmaşık, çalı, çimen, ağaçlar) — katman önbelleğine çizilir
    fallsStatic(ctx) {
      const P = this.P, FX = -20, FW = 230;
      const g = ctx.createLinearGradient(0, -620, 0, 0); g.addColorStop(0, '#4f7462'); g.addColorStop(0.5, '#34503f'); g.addColorStop(1, '#1d2e27');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-2800, 60);
      for (const p of P.cliff) ctx.lineTo(p[0], p[1]);
      ctx.lineTo(2800, 60); ctx.closePath(); ctx.fill();
      // güneşin vurduğu uçurum yüzü
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, '255,235,190', 420, -330, 700, 260, 0.12); ctx.restore();
      ctx.strokeStyle = 'rgba(18,32,26,.45)'; ctx.lineWidth = 3; ctx.beginPath();
      for (const s of P.strata) { ctx.moveTo(s.x, s.y); ctx.quadraticCurveTo(s.x + s.l * 0.5, s.y + s.d, s.x + s.l, s.y + s.d * 0.3); }
      ctx.stroke();
      // sarmaşıklar (önbellekte sabit duruşta; eski ±4 birimlik salınım bu katmanda piksel altıydı) ve çalılıklar
      ctx.strokeStyle = '#3f6a3d'; ctx.lineWidth = 3; ctx.beginPath();
      for (const vn of P.vines) { ctx.moveTo(vn.x, vn.y); ctx.quadraticCurveTo(vn.x + Math.sin(vn.x) * 4 + 6, vn.y + vn.l * 0.5, vn.x + 2, vn.y + vn.l); }
      ctx.stroke();
      for (let pass = 0; pass < 2; pass++) { // çalı kümeleri + güneşli üst yüz
        ctx.fillStyle = pass ? 'rgba(125,170,95,.35)' : '#2f5134'; ctx.beginPath();
        for (const b of P.bushes) for (const [a, c, k] of pass ? BUSH_HI : BUSH) { const rx = b.r * k; ctx.moveTo(b.x + a * b.r + rx, b.y + c * b.r); ctx.ellipse(b.x + a * b.r, b.y + c * b.r, rx, rx * 0.62, 0, 0, 6.283); }
        ctx.fill();
      }
      ctx.strokeStyle = '#679450'; ctx.lineWidth = 10; ctx.lineJoin = 'round'; ctx.beginPath();
      let pen = false;
      for (const p of P.cliff) { if (Math.abs(p[0] - FX) < FW) { pen = false; continue; } if (pen) ctx.lineTo(p[0], p[1] + 4); else ctx.moveTo(p[0], p[1] + 4); pen = true; }
      ctx.stroke();
      ctx.fillStyle = '#2d5038';
      for (const tr of P.ftrees) { ctx.save(); ctx.translate(0, tr.y); this.drawTree(ctx, tr); ctx.restore(); }
    },
    mid_falls(ctx) { // uçurum, akan su, taban sisi
      const P = this.P, t = this.t, FX = -20, FW = 230, top = P.cliffY(FX) + 2, FB = 50;
      this.layerCache(ctx, 'falls', 0.28, this._fallsFn || (this._fallsFn = (c) => this.fallsStatic(c)), -780, floorTop());
      cam.layer(ctx, 0.28);
      // ana şelale: tabana doğru genişleyen, kenarları dalgalı su perdesi
      const ex = (y, sd) => { const k = (y - top) / -top; return FX + sd * (FW + FB * k * k + Math.sin(y * 0.035 + t * 2.2 * sd) * 3 * k); };
      // Su perdesi ekran pikseline hizalı küçük bir tuvalde çizilir: akış çizgileri ve taban parlaması gövdeye
      // kırpma (clip) yerine 'source-atop' ile sınırlanır (GPU'da kırpılmış her çizim yeniden maske üretiyordu).
      const v = this.view(0.28), vk = v.k, vtx = -v.x0 * vk, vty = -v.y0 * vk;
      const sx0 = Math.max(0, Math.floor(vk * (FX - FW - FB - 12) + vtx)), sx1 = Math.min(cam.W, Math.ceil(vk * (FX + FW + FB + 12) + vtx));
      const sy0 = Math.max(0, Math.floor(vk * (top - 8) + vty)), sy1 = Math.min(cam.H, Math.ceil(vk * 24 + vty));
      if (sx1 > sx0 && sy1 > sy0) {
        const fw = sx1 - sx0, fh = sy1 - sy0, fc = this._fc || (this._fc = document.createElement('canvas')), f = fc.getContext('2d');
        if (fc.width < fw) fc.width = Math.ceil(fw / 64) * 64;
        if (fc.height < fh) fc.height = Math.ceil(fh / 64) * 64;
        f.setTransform(1, 0, 0, 1, 0, 0); f.globalCompositeOperation = 'source-over'; f.globalAlpha = 1; f.clearRect(0, 0, fw, fh);
        f.setTransform(vk, 0, 0, vk, vtx - sx0, vty - sy0);
        const wg = f.createLinearGradient(0, top, 0, 0);
        wg.addColorStop(0, '#d6ede8'); wg.addColorStop(0.12, '#8fbfb7'); wg.addColorStop(0.6, '#6fa69d'); wg.addColorStop(1, '#b9dcd6');
        f.fillStyle = wg; f.beginPath(); f.moveTo(ex(top, -1), top);
        for (let y = top; y <= 20; y += 30) f.lineTo(ex(y, -1), y);
        for (let y = 20; y >= top; y -= 30) f.lineTo(ex(y, 1), y);
        f.closePath(); f.fill();
        f.globalCompositeOperation = 'source-atop';
        f.lineWidth = 4;
        for (const [c, d, sp, o] of FALL_DASH) {
          f.strokeStyle = c; f.setLineDash(d); f.lineDashOffset = -t * sp; f.beginPath();
          for (let u = -1 + (8 + o) / FW; u < 1; u += 12 / FW) { const x = FX + u * FW; f.moveTo(x, top + ((((x * 37) % 90) + 90) % 90)); f.lineTo(FX + u * (FW + FB), 20); }
          f.stroke();
        }
        f.setLineDash([]);
        const pg = f.createLinearGradient(0, -260, 0, -80); pg.addColorStop(0, 'rgba(245,252,250,0)'); pg.addColorStop(1, 'rgba(245,252,250,.75)');
        f.fillStyle = pg; f.fillRect(FX - FW - FB, -260, (FW + FB) * 2, 280);
        f.globalCompositeOperation = 'source-over';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(fc, 0, 0, fw, fh, sx0, sy0, fw, fh);
        cam.layer(ctx, 0.28);
      }
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(FX, top + 3, FW + 4, 6, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(40,70,64,.35)'; ctx.beginPath(); ctx.ellipse(FX, top + 12, FW - 10, 4, 0, 0, 6.283); ctx.fill();
      // yan küçük şelale
      const sx = 700, sy = P.cliffY(sx) + 8;
      ctx.fillStyle = 'rgba(200,232,228,.85)'; ctx.fillRect(sx - 14, sy, 28, -sy + 20);
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.setLineDash([30, 50]); ctx.lineDashOffset = -t * 420; ctx.beginPath();
      for (let x = sx - 10; x < sx + 12; x += 7) { ctx.moveTo(x, sy + ((((x * 13) % 40) + 40) % 40)); ctx.lineTo(x, 20); }
      ctx.stroke(); ctx.setLineDash([]);
      // taban sisi (derenin üstünde görünür)
      glowAt(ctx, '238,248,246', FX, -150, (FW + FB) * 1.9, 190, 0.5);
      ctx.fillStyle = 'rgb(244,250,249)';
      for (let i = 0; i < 8; i++) {
        const ph = t * 0.6 + i * 1.3;
        ctx.globalAlpha = 0.28 + 0.14 * Math.sin(ph);
        ctx.beginPath(); ctx.ellipse(FX + (i - 3.5) * 52 + Math.sin(ph) * 14, -120 - (i % 3) * 26 - Math.max(0, Math.sin(ph * 0.5)) * 20, 80 + 18 * Math.sin(ph * 1.3), 40 + 8 * Math.sin(ph * 0.7), 0, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    drawRock(ctx, r, c, m) { // yosunlu kaya
      const p = r.pts, n = p.length;
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); ctx.lineTo(p[1][0], p[1][1]);
      for (let i = 1; i < n - 2; i++) ctx.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2);
      ctx.lineTo(p[n - 2][0], p[n - 2][1]); ctx.lineTo(p[n - 1][0], p[n - 1][1]);
      ctx.closePath(); ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = m; ctx.beginPath(); ctx.ellipse(r.x - r.w * 0.06, -r.h * (0.98 + r.m * 0.06), r.w * 0.42, r.h * 0.24, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(r.x - r.w, -r.h * 1.3, r.w * 0.8, r.h * 1.4 + 40);
      ctx.fillStyle = 'rgba(255,250,225,.08)'; ctx.fillRect(r.x + r.w * 0.2, -r.h * 1.3, r.w, r.h * 1.4 + 40);
      ctx.restore();
    },
    // Yakın kayalar + ağaçlar durağan → katman önbelleği (kaya başına kırpma GPU'da pahalıydı)
    near_falls(ctx) {
      this.layerCache(ctx, 'nfalls', 0.55, this._nfFn || (this._nfFn = (x) => {
        const P = this.P, m = x.getTransform(), lx0 = -m.e / m.a, lx1 = (x.canvas.width - m.e) / m.a;
        x.fillStyle = '#284135';
        for (const tr of P.nTrees) if (tr.x > lx0 - 200 && tr.x < lx1 + 200) this.drawTree(x, tr);
        for (const r of P.rocks) if (r.x + r.w > lx0 && r.x - r.w < lx1) this.drawRock(x, r, '#2d3d36', '#4c7442');
      }), -440, floorTop());
    },
    edge_falls(ctx) { for (const r of this.P.eRocks) this.drawRock(ctx, r, '#34443d', '#557d45'); },
    drawRiver(ctx) { // arka kenarda akan dere
      const t = this.t, C = tc(this.theme), v = this.view(1);
      C.river = C.river || vstrip([[0, '#79a6a0'], [1, '#2e5553']]);
      ctx.drawImage(C.river, 0, 0, 1, 256, Math.max(-3000, v.x0 - 8), -122, Math.min(3000, v.x1 + 8) - Math.max(-3000, v.x0 - 8), 82);
      ctx.strokeStyle = 'rgba(236,250,247,.45)'; ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.setLineDash([18 + i * 9, 36 + i * 14]); ctx.lineDashOffset = -t * (60 + i * 22);
        ctx.beginPath(); ctx.moveTo(-3000, -114 + i * 15); ctx.lineTo(3000, -114 + i * 15); ctx.stroke();
      }
      ctx.setLineDash([]);
      // şelalenin döküldüğü yerde köpük (orta katmandaki şelaleye hizalı)
      const k28 = cam.s * (1 + (cam.z - 1) * 0.28), wx = cam.x + (-cam.x * 0.28 * k28 + cam.shx * 0.28 - 20 * k28 - cam.shx) / cam.k, ww = 280 * k28 / cam.k;
      glowAt(ctx, '240,250,248', wx, -112, ww * 1.4, 46, 0.85); ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(245,252,250,.6)'; ctx.beginPath();
      for (let i = 0; i < 9; i++) { const ph = t * 1.4 + i * 1.9, x = wx + ((i - 4) / 4) * ww + Math.sin(ph) * 10, r = 26 + 8 * Math.sin(ph); ctx.moveTo(x + r, -112); ctx.ellipse(x, -112 + Math.sin(ph * 1.3) * 3, r, 7, 0, 0, 6.283); }
      ctx.fill();
      ctx.fillStyle = 'rgba(24,44,38,.55)'; ctx.fillRect(-3000, -124, 6000, 4);
    },
    floor_rock(ctx) { // ıslak kaya plakaları, yosun, su birikintileri
      const P = this.P, t = this.t;
      ctx.fillStyle = 'rgba(80,112,62,.5)'; ctx.beginPath();
      for (const m of P.moss) { ctx.moveTo(m.x + m.rx, m.y); ctx.ellipse(m.x, m.y, m.rx, m.ry, 0, 0, 6.283); }
      ctx.fill();
      ctx.strokeStyle = this.theme.joint; ctx.lineWidth = 1.6; ctx.beginPath();
      for (const c of P.cracks) { ctx.moveTo(c[0][0], c[0][1]); for (let i = 1; i < c.length; i++) ctx.lineTo(c[i][0], c[i][1]); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(190,222,218,.17)'; ctx.beginPath();
      for (const p of P.puddles) { ctx.moveTo(p.x + p.rx, p.y); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 6.283); }
      ctx.fill();
      ctx.strokeStyle = `rgba(255,255,245,${0.22 + 0.1 * Math.sin(t * 1.7)})`; ctx.lineWidth = 1.2; ctx.beginPath();
      for (const p of P.puddles) { ctx.moveTo(p.x - p.rx * 0.5, p.y - p.ry * 0.3); ctx.lineTo(p.x + p.rx * 0.2, p.y - p.ry * 0.3); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(225,242,238,.14)'; ctx.fillRect(-3000, -46, 6000, 3);
    },
    drawFern(ctx, x, y, L) {
      const t = this.t; ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI * (0.12 + i * 0.095) + Math.sin(t * 1.1 + i) * 0.03, l = L * (0.6 + 0.4 * Math.sin(i * 1.7 + 1) ** 2), w = l * 0.07;
        const tx = x + Math.cos(a) * l, ty = y + Math.sin(a) * l * 0.8 + l * 0.2, cx = x + Math.cos(a) * l * 0.55, cy = y + Math.sin(a) * l * 0.75;
        const nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
        ctx.moveTo(x, y); ctx.quadraticCurveTo(cx + nx, cy + ny, tx, ty); ctx.quadraticCurveTo(cx - nx, cy - ny, x, y);
      }
      ctx.fill();
    },
    fg_foliage(ctx) { // üstten sarkan dal + köşelerde eğrelti otları
      const v = this.view(1.45), t = this.t, H = v.y1 - v.y0, bx = -900, by = v.y0 - 20, sw = Math.sin(t * 0.8) * 8;
      ctx.fillStyle = ctx.strokeStyle = this.theme.fgC; ctx.lineCap = 'round';
      if (bx + 500 > v.x0) {
        ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(bx - 500, by + H * 0.02); ctx.quadraticCurveTo(bx - 100, by + H * 0.05, bx + 380 + sw, by + H * 0.16); ctx.stroke();
        ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(bx + 60, by + H * 0.07); ctx.quadraticCurveTo(bx + 160, by + H * 0.14, bx + 200 + sw, by + H * 0.25); ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
          const k = i / 15, x = bx - 300 + k * 700 + sw * k + Math.sin(i * 7.3) * 40, y = by + H * (0.05 + 0.13 * k) + Math.sin(i * 3.1) * 26 + Math.sin(t * 1.3 + i) * 3, r = 36 + (i % 4) * 12;
          ctx.moveTo(x + r, y); ctx.ellipse(x, y, r, r * 0.45, Math.sin(i) * 0.4, 0, 6.283);
        }
        ctx.fill();
      }
      for (const fx0 of [760, -1600, 1700]) if (fx0 > v.x0 - 400 && fx0 < v.x1 + 400) this.drawFern(ctx, fx0, v.y1 + 10, H * 0.32);
    },

    // ---------------- KALE ÇATISI
    far_castle(ctx) { // çok aşağıda uzanan şehir ışıkları
      const t = this.t, P = this.P;
      cam.layer(ctx, 0.1);
      // dikey gradyanlar önbellekli şeritten (−240→0 gradyanı; dolgu −236'dan başlar, 0'ın altı düz renk)
      const C = tc(this.theme), v = this.view(0.1), X0 = Math.max(-4000, v.x0 - 8), XW = Math.min(4000, v.x1 + 8) - X0;
      C.cg = C.cg || vstrip([[0, '#0d1224'], [1, '#05060d']]);
      C.hz = C.hz || vstrip([[0, 'rgba(50,60,95,0)'], [0.5, 'rgba(70,80,120,.4)'], [1, 'rgba(50,60,95,0)']]);
      ctx.drawImage(C.cg, 0, 256 * 4 / 240, 1, 256 * 236 / 240, X0, -236, XW, 236);
      ctx.fillStyle = '#05060d'; ctx.fillRect(X0, -2, XW, 166); // birleşim dikişi olmasın diye 2 birim bindirme
      ctx.drawImage(C.hz, 0, 0, 1, 256, X0, -290, XW, 100);
      ctx.strokeStyle = 'rgba(140,150,190,.18)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-3000, -150); ctx.bezierCurveTo(-1200, -230, 400, -120, 3000, -200); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const cols = ['255,190,110', '255,140,70', '200,215,255'];
      for (let c = 0; c < 3; c++) for (let gi = 0; gi < 2; gi++) {
        ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * (1.3 + gi) + c * 2 + gi * 3); ctx.fillStyle = `rgb(${cols[c]})`;
        for (const L of P.city) if (L.c === c && L.g === gi && L.x > v.x0 - 8 && L.x < v.x1 + 8) ctx.fillRect(L.x, L.y, L.s, L.s * 0.8);
      }
      for (const T of this.P.towns) glowAt(ctx, '255,150,80', T[0], -232 + T[1] * T[1] * 125, 160 + 300 * T[1], 30 + 40 * T[1], 0.22);
      ctx.restore();
    },
    drawTurret(ctx, T) { // yagura: eğimli taş kaide + kat kat kalkık çatılar
      const { x, w } = T; let y = T.b - 100, ww = w;
      ctx.fillStyle = '#0a0d19'; ctx.beginPath(); ctx.moveTo(x - w * 0.8, T.b + 40); ctx.quadraticCurveTo(x - w * 0.62, T.b - 30, x - w * 0.55, y); ctx.lineTo(x + w * 0.55, y); ctx.quadraticCurveTo(x + w * 0.62, T.b - 30, x + w * 0.8, T.b + 40); ctx.fill();
      for (let i = 0; i < T.n; i++) {
        const h = 46 - i * 6;
        ctx.fillStyle = '#272d45'; ctx.fillRect(x - ww * 0.44, y - h, ww * 0.88, h);
        ctx.fillStyle = 'rgba(170,180,220,.14)'; ctx.fillRect(x + ww * 0.1, y - h, ww * 0.34, h);
        ctx.fillStyle = '#0b0e1a'; ctx.fillRect(x - ww * 0.25, y - h * 0.65, 8, 12); ctx.fillRect(x + ww * 0.15, y - h * 0.65, 8, 12);
        ctx.beginPath(); ctx.moveTo(x - ww * 0.72, y - h + 4); ctx.quadraticCurveTo(x - ww * 0.46, y - h - 1, x - ww * 0.36, y - h - 24); ctx.lineTo(x + ww * 0.36, y - h - 24); ctx.quadraticCurveTo(x + ww * 0.46, y - h - 1, x + ww * 0.72, y - h + 4); ctx.lineTo(x + ww * 0.6, y - h + 8); ctx.lineTo(x - ww * 0.6, y - h + 8); ctx.fill();
        y -= h + 24; ww *= 0.74;
      }
    },
    drawBPine(ctx, x, y, h) { // kara çam: yassı bulut katmanları
      ctx.fillStyle = ctx.strokeStyle = '#070912'; ctx.lineWidth = h * 0.08; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + h * 0.25, y - h * 0.45, x - h * 0.05, y - h * 0.85);
      ctx.moveTo(x + h * 0.08, y - h * 0.4); ctx.lineTo(x + h * 0.4, y - h * 0.5); ctx.moveTo(x + h * 0.05, y - h * 0.62); ctx.lineTo(x - h * 0.3, y - h * 0.7); ctx.stroke();
      ctx.beginPath();
      for (const [a, b, r] of [[0.45, 0.52, 0.28], [-0.32, 0.72, 0.25], [0, 0.9, 0.3], [0.2, 0.62, 0.2], [-0.12, 1.02, 0.16]]) {
        const cx = x + a * h, cy = y - b * h, rx = r * h; ctx.moveTo(cx + rx, cy); ctx.ellipse(cx, cy, rx, rx * 0.34, 0, 0, 6.283);
      }
      ctx.fill();
    },
    mid_castle(ctx) { // dış sur, yagura kuleleri, çamlar
      const v = this.view(0.28), P = this.P;
      for (const p of P.cpines) if (p.x > v.x0 - 200 && p.x < v.x1 + 200) this.drawBPine(ctx, p.x, -60, p.h);
      for (const T of P.turrets) {
        if (T.x < v.x0 - T.w * 3 || T.x > v.x1 + T.w * 3) continue;
        ctx.fillStyle = '#0a0d1a'; ctx.fillRect(T.x - T.w * 2.6, -112, T.w * 5.2, 140); // kuleye bağlanan sur (dobei)
        ctx.fillStyle = '#1e2439'; ctx.fillRect(T.x - T.w * 2.6, -126, T.w * 5.2, 14);
        ctx.fillStyle = '#080a14'; ctx.fillRect(T.x - T.w * 2.7, -132, T.w * 5.4, 7);
        this.drawTurret(ctx, T);
      }
    },
    near_castle(ctx) { // yan tarafta komşu çatı alınları (chidori hafu)
      const v = this.view(0.55);
      for (const G of this.P.gables) {
        const { x, w, top } = G;
        if (x + w * 1.2 < v.x0 || x - w * 1.2 > v.x1) continue;
        ctx.fillStyle = '#0a0d19'; ctx.fillRect(x - w * 0.7, -170, w * 1.4, 200);
        ctx.beginPath(); ctx.moveTo(x - w * 1.15, -118); ctx.quadraticCurveTo(x - w * 0.9, -130, x - w * 0.8, -170); ctx.lineTo(x + w * 0.8, -170); ctx.quadraticCurveTo(x + w * 0.9, -130, x + w * 1.15, -118); ctx.lineTo(x + w, -106); ctx.lineTo(x - w, -106); ctx.fill();
        ctx.fillStyle = '#262c46'; ctx.fillRect(x - w * 0.6, -300, w * 1.2, 132);
        ctx.fillStyle = 'rgba(170,180,220,.12)'; ctx.fillRect(x, -300, w * 0.6, 132);
        ctx.fillStyle = '#0a0d19'; for (let i = -2; i <= 2; i++) ctx.fillRect(x + i * w * 0.22 - 7, -268, 14, 26);
        ctx.fillStyle = '#20263e'; ctx.beginPath(); ctx.moveTo(x - w * 0.62, -288); ctx.quadraticCurveTo(x - w * 0.3, -300, x, top + 30); ctx.quadraticCurveTo(x + w * 0.3, -300, x + w * 0.62, -288); ctx.fill();
        ctx.fillStyle = '#0a0d19'; ctx.beginPath();
        ctx.moveTo(x - w * 0.95, -286); ctx.quadraticCurveTo(x - w * 0.45, -300, x, top); ctx.quadraticCurveTo(x + w * 0.45, -300, x + w * 0.95, -286);
        ctx.lineTo(x + w * 0.85, -276); ctx.quadraticCurveTo(x + w * 0.4, -290, x, top + 26); ctx.quadraticCurveTo(x - w * 0.4, -290, x - w * 0.85, -276); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(180,190,230,.28)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, top); ctx.quadraticCurveTo(x + w * 0.45, -300, x + w * 0.95, -286); ctx.stroke();
      }
    },
    drawShachi(ctx) { // altın shachihoko (baş +x yönüne bakar)
      const g = ctx.createLinearGradient(-20, -190, 40, 0);
      g.addColorStop(0, '#f6dc8c'); g.addColorStop(0.5, '#b88a32'); g.addColorStop(1, '#5e4214');
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(48, -6); ctx.quadraticCurveTo(54, -40, 28, -54); ctx.quadraticCurveTo(8, -72, 18, -110); ctx.quadraticCurveTo(24, -128, 12, -140);
      ctx.lineTo(36, -170); ctx.lineTo(16, -160); ctx.lineTo(6, -186); ctx.lineTo(-4, -158); ctx.lineTo(-28, -172); ctx.lineTo(-10, -138);
      ctx.quadraticCurveTo(-8, -108, -16, -80); ctx.quadraticCurveTo(-26, -36, 0, -12); ctx.lineTo(-6, 0); ctx.lineTo(44, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(4, -40); ctx.lineTo(-24, -28); ctx.lineTo(-4, -26); ctx.closePath(); ctx.moveTo(-12, -96); ctx.lineTo(-34, -104); ctx.lineTo(-14, -84); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(80,50,10,.6)'; ctx.lineWidth = 1.4; ctx.beginPath();
      for (let i = 0; i < 5; i++) { const y = -60 - i * 14; ctx.moveTo(-8 + i, y); ctx.quadraticCurveTo(4, y + 8, 14 - i, y); }
      ctx.stroke();
      ctx.fillStyle = '#2a1a06'; ctx.beginPath(); ctx.arc(36, -30, 3.5, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(255,248,220,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(48, -8); ctx.quadraticCurveTo(54, -40, 28, -54); ctx.quadraticCurveTo(8, -72, 18, -110); ctx.stroke();
    },
    edge_castle(ctx) { // mahya uçlarında onigawara + shachihoko, içe bakar
      for (const s of [-1, 1]) {
        const x = s * (ND.ARENA + 60);
        ctx.fillStyle = '#161a28'; ctx.beginPath();
        ctx.moveTo(x - 46, -44); ctx.lineTo(x - 40, -112); ctx.quadraticCurveTo(x, -132, x + 40, -112); ctx.lineTo(x + 46, -44); ctx.fill();
        ctx.strokeStyle = 'rgba(190,200,235,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 40, -112); ctx.quadraticCurveTo(x, -132, x + 40, -112); ctx.stroke();
        ctx.save(); ctx.translate(x, -120); ctx.scale(-s * 1.05, 1.05); this.drawShachi(ctx); ctx.restore();
      }
    },
    floor_tiles(ctx) { // kavisli kiremit sıraları + mahya
      const v = this.view(1), vx = cam.x, vy = -260, SP = 78, px = (X, y) => vx + (X - vx) * (y - vy) / (700 - vy);
      const rows = []; let y = -45, st = 16; while (y < 760) { rows.push(y); y += st; st *= 1.3; }
      const sc0 = (-45 - vy) / (700 - vy), Xa = Math.floor((vx + (v.x0 - 60 - vx) / sc0) / SP) * SP, Xb = vx + (v.x1 + 60 - vx) / sc0;
      // (GPU: ekran boyu çok alt yollu tek yol yazılım maskesine düşüyordu; çizgiler birbirine değmediğinden tek tek
      // çizmek/doldurmak aynı görüntüyü verir. Yatay 1 birimlik çizgiler eşdeğer ince dikdörtgenler.)
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.3)';
      for (let X = Xa; X < Xb; X += SP) { ctx.beginPath(); ctx.moveTo(px(X + 8, -45), -45); ctx.lineTo(X + 8, 700); ctx.stroke(); }
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(175,190,230,.13)';
      for (let X = Xa; X < Xb; X += SP) { ctx.beginPath(); ctx.moveTo(px(X - 4, -45), -45); ctx.lineTo(X - 4, 700); ctx.stroke(); }
      ctx.fillStyle = 'rgba(0,0,0,.14)';
      for (let i = 1; i < rows.length; i++) ctx.fillRect(v.x0 - 10, rows[i] - 0.5, v.x1 - v.x0 + 20, 1);
      ctx.fillStyle = 'rgba(10,12,20,.6)';
      for (let i = 1; i < rows.length - 1; i++) {
        const y0 = rows[i], d = (rows[i + 1] - y0) * 0.3, sc = (y0 - vy) / (700 - vy), r = SP * 0.22 * sc;
        const Xa2 = Math.floor((vx + (v.x0 - vx) / sc) / SP) * SP - SP, Xb2 = vx + (v.x1 - vx) / sc + SP;
        if (r < 2.5) continue;
        for (let X = Xa2; X < Xb2; X += SP) { const a = px(X + 2, y0); ctx.beginPath(); ctx.moveTo(a + r, y0); ctx.ellipse(a, y0 + d * 0.3, r, d, 0, 0, 3.1416); ctx.fill(); }
      }
      // mahya (çatı sırtı) — arka kenar, ay ışığı üst çizgisi
      ctx.fillStyle = '#141827'; ctx.fillRect(-3000, -98, 6000, 56);
      ctx.fillStyle = '#262c40'; ctx.fillRect(-3000, -104, 6000, 12);
      ctx.fillStyle = 'rgba(200,210,240,.28)'; ctx.fillRect(-3000, -105, 6000, 2);
      ctx.fillStyle = 'rgba(0,0,0,.4)'; // 1.5 kalınlıklı dikey çizgiler = ince dikdörtgenler
      for (let x = Math.floor(v.x0 / 30) * 30; x < v.x1; x += 30) ctx.fillRect(x - 0.75, -90, 1.5, 44);
      ctx.fillStyle = '#0b0d16'; ctx.fillRect(-3000, -48, 6000, 5);
    },
    fg_banners(ctx) { // rüzgârda çırpınan sancaklar ve flamalar
      const v = this.view(1.45), t = this.t, dir = this.wind < 0 ? -1 : 1, H = v.y1 - v.y0, wk = Math.min(1.6, Math.abs(this.wind) / 250);
      for (const bx of [-620, 760, 1600]) {
        if (bx < v.x0 - 450 || bx > v.x1 + 450) continue;
        ctx.fillStyle = this.theme.fgC; ctx.fillRect(bx - 8, v.y0 - 40, 16, H + 80);
        const top = v.y0 + H * 0.1, bh = H * 0.36, bw = 78;
        ctx.fillRect(dir > 0 ? bx : bx - bw - 6, top - 6, bw + 6, 7);
        ctx.fillStyle = '#2a0b10'; ctx.beginPath(); ctx.moveTo(bx, top); ctx.lineTo(bx + dir * bw, top);
        for (let i = 1; i <= 10; i++) { const k = i / 10; ctx.lineTo(bx + dir * (bw + Math.sin(t * 8 - k * 6) * 12 * wk * k + k * 18 * wk), top + k * bh); }
        for (let i = 9; i >= 0; i--) { const k = i / 10; ctx.lineTo(bx + dir * (bw + k * 18 * wk) * k, top + bh + Math.sin(t * 7 + k * 4) * 12 * wk * k); }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(210,200,180,.3)'; ctx.lineWidth = 5; ctx.beginPath();
        ctx.arc(bx + dir * (bw * 0.5 + Math.sin(t * 8 - 2) * 3 * wk), top + bh * 0.3, bw * 0.24, 0, 6.283); ctx.stroke();
        ctx.strokeStyle = '#1a0a0e'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath();
        for (let r = 0; r < 2; r++) {
          const y0 = top - 24 - r * 26; ctx.moveTo(bx, y0);
          for (let i = 1; i <= 12; i++) { const k = i / 12; ctx.lineTo(bx + dir * k * 320 * Math.max(0.4, wk), y0 + Math.sin(t * 10 - k * 7 + r) * 16 * k + k * 40 * (1.6 - wk)); }
        }
        ctx.stroke();
      }
    },

    // Dövüşçü katmanının üzerine ışık (source-atop ile, dünya dönüşümü ayarlı bağlamda)
    lightFighter(c, f, x0, y0, x1, y1) {
      const th = this.theme;
      c.globalCompositeOperation = 'source-atop';
      for (const L of this.lights()) {
        const d = Math.abs(L.x - f.x);
        if (d > 520) continue;
        const g = c.createRadialGradient(L.x, L.y, 10, L.x, L.y, 520);
        g.addColorStop(0, `rgba(${L.c},${0.42 * L.f})`); g.addColorStop(0.45, `rgba(${L.c},${0.12 * L.f})`); g.addColorStop(1, `rgba(${L.c},0)`);
        c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      }
      const k = th.key, cx = (x0 + x1) / 2;
      const kg = c.createLinearGradient(cx + k.from * 40, 0, cx - k.from * 20, 0);
      kg.addColorStop(0, `rgba(${k.c},${k.a})`); kg.addColorStop(1, `rgba(${k.c},0)`);
      c.fillStyle = kg; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      const ao = c.createLinearGradient(0, 0, 0, -70);
      ao.addColorStop(0, 'rgba(0,0,0,.35)'); ao.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = ao; c.fillRect(x0, -70, x1 - x0, 80);
      if (this.flashL > 0) { c.fillStyle = `rgba(215,228,255,${this.flashL * 0.55})`; c.fillRect(x0, y0, x1 - x0, y1 - y0); }
      if (th.weather === 'snow') { c.fillStyle = 'rgba(255,240,235,.06)'; c.fillRect(x0, y0, x1 - x0, y1 - y0); }
      if (th.tint) { c.fillStyle = `rgba(${th.tint},${0.07 * this.fireF(f.x)})`; c.fillRect(x0, y0, x1 - x0, y1 - y0); }
      if (f.flash > 0) { c.fillStyle = `rgba(255,245,240,${f.flash * 0.38})`; c.fillRect(x0, y0, x1 - x0, y1 - y0); }
      c.globalCompositeOperation = 'source-over';
    },
  };
})(window.ND);
