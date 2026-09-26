// Gölge Düellosu — çekirdek: matematik yardımcıları + sentez ses motoru
window.ND = window.ND || {};
(function (ND) {
  'use strict';

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  // Geliştirici profili: ND.prof (test düzeneği) tanımlı ve açıkken çizim aşamalarını işaretler; normalde tek okuma
  ND.profBuiltin = true;
  ND.pm = function (name) { const p = ND.prof; if (p && p.on) p.m(name); };

  const M = ND.M = {
    TAU: Math.PI * 2,
    clamp,
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a, b) => a + Math.random() * (b - a),
    pick: (arr) => arr[(Math.random() * arr.length) | 0],
    sign: (v) => (v < 0 ? -1 : 1),
    approach: (v, target, rate, dt) => target + (v - target) * Math.exp(-rate * dt),
    ease: {
      linear: (t) => t,
      inQuad: (t) => t * t,
      inCubic: (t) => t * t * t,
      outCubic: (t) => 1 - Math.pow(1 - t, 3),
      outQuart: (t) => 1 - Math.pow(1 - t, 4),
      outBack: (t) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
      inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
      inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    },
    // İki doğru parçası arasındaki en kısa mesafe (Ericson, RTCD)
    segSeg(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y) {
      const d1x = q1x - p1x, d1y = q1y - p1y, d2x = q2x - p2x, d2y = q2y - p2y;
      const rx = p1x - p2x, ry = p1y - p2y;
      const a = d1x * d1x + d1y * d1y, e = d2x * d2x + d2y * d2y, f = d2x * rx + d2y * ry;
      let s, t;
      if (a <= 1e-9 && e <= 1e-9) { s = t = 0; }
      else if (a <= 1e-9) { s = 0; t = clamp(f / e, 0, 1); }
      else {
        const c = d1x * rx + d1y * ry;
        if (e <= 1e-9) { t = 0; s = clamp(-c / a, 0, 1); }
        else {
          const b = d1x * d2x + d1y * d2y, den = a * e - b * b;
          s = den !== 0 ? clamp((b * f - c * e) / den, 0, 1) : 0;
          t = (b * s + f) / e;
          if (t < 0) { t = 0; s = clamp(-c / a, 0, 1); }
          else if (t > 1) { t = 1; s = clamp((b - c) / a, 0, 1); }
        }
      }
      const cx1 = p1x + d1x * s, cy1 = p1y + d1y * s, cx2 = p2x + d2x * t, cy2 = p2y + d2y * t;
      return { d: Math.hypot(cx1 - cx2, cy1 - cy2), x: (cx1 + cx2) / 2, y: (cy1 + cy2) / 2, s };
    },
  };

  // ---------------------------------------------------------------- PORTAL
  // Which portal we run on, guessed synchronously (same rules as @studio/portal detectPortal) so classic
  // scripts can decide things at load time (blood allowed? Escape allowed?). The real SDK wrapper is the
  // module src/portal-bridge.ts: it arrives later as window.NDPortal and resolves ND.portal.ready.
  const qs = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(''); } })();
  ND.qs = qs;
  ND.portalName = (() => {
    const known = (v) => v === 'crazygames' || v === 'poki' || v === 'yandex' || v === 'playgama' || v === 'local';
    const f = qs.get('portal');
    if (known(f)) return f;
    // Portal-only build (npm run build:yandex / build:playgama): <meta name="nd-portal"> fixes the portal whatever the host is
    let b = null;
    try { const m = document.querySelector('meta[name="nd-portal"]'); b = m && m.getAttribute('content'); } catch (e) { /* no DOM */ }
    if (known(b)) return b;
    let ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) { /* bad referrer */ }
    const hosts = (location.hostname || '') + ' ' + ref;
    if (/crazygames\.com|1001juegos\.com|crazygames\.[a-z.]+/.test(hosts)) return 'crazygames';
    if (/poki\.com|poki-gdn\.com/.test(hosts)) return 'poki';
    if (/yandex\.(ru|net|com)/.test(hosts)) return 'yandex';
    return 'local';
  })();
  // Online leaderboard (leaderboard.js) reads ND.platform: Poki forbids external requests; the portal guess wins
  // over its own host sniffing so ?portal=poki behaves like the real thing.
  // Yandex Games too: sign-in only with a Yandex ID (rule 1.2), no links out (8.4) and every outside host must be
  // approved in the console; there the leaderboards stay on the device and the progress rides Yandex player data.
  // Playgama too: one build goes to many partner sites, several of them (YouTube Playables, GameDistribution…) forbid
  // outside requests; there the progress rides Bridge storage.
  if (ND.portalName === 'poki' || ND.portalName === 'yandex' || ND.portalName === 'playgama') ND.platform = Object.assign({ name: ND.portalName, allowNetwork: false }, ND.platform || {});
  else if (ND.portalName !== 'local') ND.platform = Object.assign({ name: ND.portalName }, ND.platform || {});
  // Portals that forbid links out of the game (Yandex 8.4): no Privacy Policy & Terms links. The game sends no personal
  // data there (no network above), so there is no policy to point at.
  // Playgama: neither Playgama itself nor most partner sites allow links out (Bridge platform.isExternalLinksAllowed).
  ND.NO_LINK_PORTALS = { yandex: true, playgama: true };
  ND.linksAllowed = () => !ND.NO_LINK_PORTALS[ND.portalName];
  // Blood is opt-in and only where the portal's age rating allows it (PEGI 12 forbids blood on human
  // characters; Poki forbids body fluids). Everywhere else hits use the ink & shadow style (scene.js).
  ND.BLOOD_PORTALS = { local: true, crazygames: false, poki: false, yandex: false, playgama: false };
  ND.bloodAllowed = () => !!ND.BLOOD_PORTALS[ND.portalName];
  ND.isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname || '') || location.protocol === 'file:';

  // Shared deferred with the bridge module (whichever loads first creates it)
  const PD = window.__ndPortalD || (window.__ndPortalD = (() => { let r; const p = new Promise((x) => (r = x)); return { p, r }; })());
  const api = () => window.NDPortal || null;
  const adFns = new Set(), muteFns = new Set();
  const want = { loaded: false, play: false };
  let firstPlay = false;
  const mark = (n) => { try { performance.mark(n); } catch (e) { /* no User Timing */ } };
  const P = ND.portal = {
    name: ND.portalName,
    ready: PD.p,
    inAd: false,
    muted: false,
    get sdk() { const a = api(); return !!(a && a.sdk); },
    // Game became playable (menu shown, first frame drawn)
    // (performance marks nd-loading-finished / nd-first-gameplay: load-time checks read them, they cost nothing)
    loadingFinished() { if (!want.loaded) mark('nd-loading-finished'); want.loaded = true; const a = api(); if (a) a.loadingFinished(); },
    // Player is actually fighting (not menus, not paused, not end screens). Idempotent.
    gameplayStart() { if (!firstPlay) { firstPlay = true; mark('nd-first-gameplay'); } want.play = true; const a = api(); if (a) a.gameplayStart(); },
    gameplayStop() { want.play = false; const a = api(); if (a) a.gameplayStop(); },
    happyTime() { const a = api(); if (a) a.happyTime(); },
    // Forced ad at a natural break; resolves when the game may continue (also without a bridge)
    interstitial() { const a = api(); return a ? a.interstitial() : Promise.resolve(); },
    // Rewarded ad; true only when the reward must be granted. Without a bridge (plain file serve) it grants.
    rewarded() { const a = api(); return a ? a.rewarded() : Promise.resolve(true); },
    save(k, v) { const a = api(); return a ? a.save(k, v) : Promise.resolve(); },
    load(k) { const a = api(); return a ? a.load(k) : Promise.resolve(undefined); },
    language() { const a = api(); try { return a ? a.language() : (navigator.language || 'en').slice(0, 2).toLowerCase(); } catch (e) { return 'en'; } },
    // Language the portal makes the game use (Yandex: SDK environment.i18n.lang), or null (the game picks: English).
    // Only meaningful after `ready` (js/i18n.js waits for it).
    requiredLanguage() {
      const a = api();
      try { return a && a.requiredLanguage ? a.requiredLanguage() : null; } catch (e) { return null; }
    },
    // fn('start' | 'end'); returns unsubscribe
    onAd(fn) { adFns.add(fn); return () => adFns.delete(fn); },
    // fn(muted) — the portal's own audio switch
    onMute(fn) { muteFns.add(fn); if (P.muted) fn(true); return () => muteFns.delete(fn); },
  };
  const emit = (set, v) => set.forEach((fn) => { try { fn(v); } catch (e) { console.warn('[ND.portal] listener failed', e); } });
  PD.p.then((a) => {
    if (!a) return;
    if (want.loaded) a.loadingFinished();
    if (want.play) a.gameplayStart();
    a.onAd((ph) => { P.inAd = ph === 'start'; emit(adFns, ph); });
    a.onMute((m) => { P.muted = m; emit(muteFns, m); });
  });

  // ---------------------------------------------------------------- SES
  const A = ND.audio = {
    ctx: null, enabled: true, ready: false,
    // Silence sources on top of the player's own switch (enabled): portal switch, running ad,
    // ?mute=1 (tools), and "away" (tab hidden; on localhost also window unfocused).
    portalMuted: false, adMuted: false, paramMuted: qs.get('mute') === '1', away: false,
    audible() { return this.enabled && !this.portalMuted && !this.adMuted && !this.paramMuted && !this.away; },
    // Player volume sliders, 0..1 (js/volume.js shows them and saves them as whole percents in settings.vol).
    // Routing: every effect (hits, voices, UI, ambience) → dry/revIn ("sfx" level) → master; music has its own
    // bus (music.js, "music" level) → master. Master = mute gate × "master" level → compressor → speakers.
    VOL_DEFAULT: { master: 0.8, music: 0.6, sfx: 0.9 },
    vol: { master: 0.8, music: 0.6, sfx: 0.9 },
    // Slider position → gain: squared, so the travel feels even to the ear (about a 40 dB range) and 0 is silence
    curve(v) { v = clamp(+v || 0, 0, 1); return v * v; },
    masterLevel() { return this.audible() ? 0.85 * this.curve(this.vol.master) : 0; },
    // Click-free change: hold the value where it is right now, then glide to the new one
    ramp(param, v, tc = 0.04) {
      if (!param || !this.ctx) return;
      const t = this.ctx.currentTime;
      try {
        if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(t);
        else { param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); }
        param.setTargetAtTime(v, t, tc);
      } catch (e) { param.value = v; }
    },
    applyGain(tc = 0.05) {
      if (!this.master || !this.ctx) return;
      this.ramp(this.master.gain, this.masterLevel(), tc);
      this.syncRev();
    },
    // The reverb (a 2.6 s convolution, the costliest part of the sound) only runs while something can be heard: when
    // the game is muted its input is unplugged (after the fade-out), so the browser stops computing it.
    syncRev() {
      if (!this.rev || !this.revIn) return;
      const on = this.masterLevel() > 0;
      clearTimeout(this.revTimer);
      if (on === this.revOn) return;
      const apply = () => {
        this.revOn = on;
        try { if (on) this.revIn.connect(this.rev); else this.revIn.disconnect(this.rev); } catch (e) { /* already (dis)connected */ }
      };
      if (on) apply(); else this.revTimer = setTimeout(apply, 400);
    },
    // Low graphics (weak devices): a shorter reverb tail, about half the convolution work (game.js calls this)
    setLite(v) {
      v = !!v;
      if (v === !!this.lite) return;
      this.lite = v;
      if (this.rev) this.rev.buffer = this.makeIR(v ? 1.2 : 2.6);
    },
    // kind: 'master' | 'music' | 'sfx'; v 0..1. Applies at once (short glide); saving is the caller's job.
    setVolume(kind, v) {
      if (!(kind in this.vol)) return;
      this.vol[kind] = clamp(+v || 0, 0, 1);
      if (kind === 'master') this.applyGain(0.04);
      else if (kind === 'sfx') { const g = this.curve(this.vol.sfx); this.ramp(this.dry && this.dry.gain, g); this.ramp(this.revIn && this.revIn.gain, g); }
      else if (ND.music && ND.music.applyVolume) ND.music.applyVolume();
    },
    // Short sample at the current effects level (slider preview). Plays even on the menu, where the demo fight is quiet.
    previewFx() {
      if (!this.ready) return;
      const q = this.quiet; this.quiet = false;
      try { this.tick(0); } finally { this.quiet = q; }
    },
    // Portal's own audio switch (CrazyGames settings): the in-game toggle cannot lift it
    setPortalMute(v) { this.portalMuted = !!v; this.applyGain(); },
    // Ads run silent; the player's own sound setting is left untouched
    suspendForAd() { this.adMuted = true; this.applyGain(0.01); },
    resumeAfterAd() { this.adMuted = false; this.applyGain(0.1); },
    // Dev rule (CLAUDE.md): on localhost the game is silent while the window is not focused; live only a hidden tab silences
    updateAway() {
      let away = false;
      try { away = document.hidden || (ND.isLocalHost && !document.hasFocus()); } catch (e) { /* no document */ }
      if (away !== this.away) { this.away = away; this.applyGain(away ? 0.02 : 0.15); }
    },

    init() {
      // iOS arka plandan dönünce 'interrupted' kalabilir; jest dışında reddedilen resume sessizce yutulur
      if (this.ctx) { if (this.ctx.state !== 'running' && this.ctx.state !== 'closed') { try { const p = this.ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* yok */ } } return; }
      let c;
      try { c = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      this.ctx = c;
      this.master = c.createGain();
      this.updateAway();
      this.master.gain.value = this.masterLevel();
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
      this.master.connect(comp); comp.connect(c.destination);
      // effects level: dry path and reverb send share it (the reverb itself is shared with the music bus, whose
      // send is taken after the music level, so each slider scales its own reverb tail too)
      const fx = this.curve(this.vol.sfx);
      this.dry = c.createGain(); this.dry.gain.value = fx; this.dry.connect(this.master);
      this.rev = c.createConvolver(); this.rev.buffer = this.makeIR(this.lite ? 1.2 : 2.6);
      this.revIn = c.createGain(); this.revIn.gain.value = fx; this.revIn.connect(this.rev); this.revOn = true;
      const rg = c.createGain(); rg.gain.value = 0.32; this.rev.connect(rg); rg.connect(this.master);
      const len = c.sampleRate * 2;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.ready = true;
      this.syncRev();
      this.ambience();
    },

    setEnabled(v) {
      this.enabled = !!v;
      this.applyGain();
    },

    makeIR(sec) {
      const c = this.ctx, len = (c.sampleRate * sec) | 0, b = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = b.getChannelData(ch);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4);
      }
      return b;
    },

    out(send, pan) {
      const c = this.ctx, g = c.createGain();
      let head = g;
      if (pan && c.createStereoPanner) {
        const p = c.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
        g.connect(p); head = p;
      }
      head.connect(this.dry);
      if (send > 0) { const s = c.createGain(); s.gain.value = send; head.connect(s); s.connect(this.revIn); }
      return g;
    },

    noise(o) {
      if (!this.ready || this.quiet) return;
      const c = this.ctx, t = c.currentTime + (o.delay || 0);
      const src = c.createBufferSource(); src.buffer = this.noiseBuf;
      src.playbackRate.value = o.rate || 1;
      const f = c.createBiquadFilter(); f.type = o.type || 'bandpass'; f.Q.value = o.q || 1;
      f.frequency.setValueAtTime(o.f0 || 1000, t);
      if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
      const g = this.out(o.send ?? 0.2, o.pan);
      const gain = o.gain ?? 0.5, at = o.attack ?? 0.004;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + at);
      g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
      src.connect(f); f.connect(g);
      src.start(t, Math.random() * 1.5); src.stop(t + o.dur + 0.05);
    },

    tone(o) {
      if (!this.ready || this.quiet) return;
      const c = this.ctx, t = c.currentTime + (o.delay || 0);
      const osc = c.createOscillator(); osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(o.freq, t);
      if (o.freq1) osc.frequency.exponentialRampToValueAtTime(o.freq1, t + (o.glide || o.dur));
      const g = this.out(o.send ?? 0.25, o.pan);
      const gain = o.gain ?? 0.3, at = o.attack ?? 0.003;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + at);
      g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
      osc.connect(g); osc.start(t); osc.stop(t + o.dur + 0.05);
    },

    // --- oyun sesleri
    swoosh(power = 1, pan = 0) {
      const d = 0.16 + 0.12 * power;
      this.noise({ type: 'bandpass', f0: 500 + 300 * power, f1: 2600 + 900 * power, q: 1.4, dur: d, gain: 0.22 + 0.2 * power, attack: d * 0.55, send: 0.12, pan });
      this.noise({ type: 'highpass', f0: 3000, dur: d * 0.8, gain: 0.05 * power, attack: d * 0.5, send: 0.05, pan });
    },
    clang(power = 1, pan = 0, pitch = 1) {
      const base = (560 + Math.random() * 90) * pitch;
      [1, 2.76, 5.4, 8.93, 13.3].forEach((r, i) => {
        this.tone({ freq: base * r, type: i ? 'sine' : 'triangle', dur: (1.3 - i * 0.18) * (0.6 + power * 0.5), gain: (0.2 / (i + 1)) * power, send: 0.5, pan });
      });
      this.noise({ type: 'highpass', f0: 2500, dur: 0.06, gain: 0.5 * power, send: 0.3, pan });
    },
    parry(pan = 0) {
      this.clang(1.3, pan, 1.45);
      this.tone({ freq: 2400, freq1: 1800, dur: 1.6, gain: 0.08, send: 0.7, pan });
    },
    cut(power = 1, pan = 0) {
      this.noise({ type: 'highpass', f0: 1800, f1: 700, dur: 0.12, gain: 0.35 * power, send: 0.1, pan });
      this.tone({ freq: 140, freq1: 45, dur: 0.22, gain: 0.55 * power, send: 0.08, pan });
      this.noise({ type: 'lowpass', f0: 900, dur: 0.18, gain: 0.3 * power, send: 0.05, pan, delay: 0.01 });
    },
    thud(power = 1, pan = 0) {
      this.tone({ freq: 110, freq1: 38, dur: 0.28, gain: 0.6 * power, send: 0.1, pan });
      this.noise({ type: 'lowpass', f0: 500, dur: 0.14, gain: 0.35 * power, send: 0.05, pan });
    },
    step(pan = 0, g = 1) {
      this.noise({ type: 'lowpass', f0: 380 + Math.random() * 200, dur: 0.07, gain: 0.07 * g, send: 0.02, pan });
    },
    whistle(pan = 0) {
      this.tone({ freq: 2600, freq1: 1500, dur: 0.35, gain: 0.05, send: 0.2, pan, type: 'sine' });
      this.noise({ type: 'bandpass', f0: 3500, f1: 2000, q: 6, dur: 0.3, gain: 0.12, send: 0.15, pan });
    },
    tick(pan = 0) {
      this.tone({ freq: 3200, freq1: 2400, dur: 0.12, gain: 0.08, send: 0.3, pan, type: 'triangle' });
      this.noise({ type: 'highpass', f0: 4000, dur: 0.04, gain: 0.2, send: 0.2, pan });
    },
    gong() {
      [1, 1.49, 2.03, 2.74, 3.4].forEach((r, i) => this.tone({ freq: 92 * r, dur: 3.5 - i * 0.4, gain: 0.26 / (i + 1), attack: 0.01, send: 0.6 }));
      this.noise({ type: 'lowpass', f0: 300, dur: 0.3, gain: 0.25, send: 0.4 });
    },
    taiko(power = 1, delay = 0) {
      this.tone({ freq: 150, freq1: 52, glide: 0.25, dur: 0.6, gain: 0.8 * power, send: 0.35, delay });
      this.noise({ type: 'lowpass', f0: 700, dur: 0.12, gain: 0.35 * power, send: 0.3, delay });
    },
    ko() {
      this.taiko(1.2); this.taiko(1, 0.32);
      this.tone({ freq: 55, dur: 2.5, gain: 0.4, send: 0.7, delay: 0.05 });
      this.tone({ freq: 880, freq1: 660, dur: 2.8, gain: 0.05, send: 0.9, delay: 0.1 });
    },
    ui() { this.tone({ freq: 1200, freq1: 900, dur: 0.09, gain: 0.07, send: 0.2, type: 'triangle' }); },

    // Ortam sesi katmanları: rüzgâr, yağmur, tipi, ateş, su, çarşı, fırtına — arenaya göre yumuşak geçiş
    // (katmanlar ilk kullanıldıklarında kurulur; kullanılmayan arena ses işlemcisi harcamaz)
    ambience() {
      const c = this.ctx;
      const layer = (type, freq, q, level, lfoRate, lfoDepth, fRate, fDepth, buf) => {
        const src = c.createBufferSource(); src.buffer = buf || this.noiseBuf; src.loop = true; src.playbackRate.value = 0.9 + Math.random() * 0.2;
        const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
        const g = c.createGain(); g.gain.value = 0;
        const bus = c.createGain(); bus.gain.value = 1;
        if (lfoRate) { const l = c.createOscillator(); l.frequency.value = lfoRate; const lg = c.createGain(); lg.gain.value = lfoDepth; l.connect(lg); lg.connect(bus.gain); l.start(); }
        if (fRate) { const l = c.createOscillator(); l.frequency.value = fRate; const lg = c.createGain(); lg.gain.value = fDepth; l.connect(lg); lg.connect(f.frequency); l.start(); }
        src.connect(f); f.connect(bus); bus.connect(g); g.connect(this.dry); // ambience counts as an effect
        src.start(0, Math.random() * 1.5);
        g._level = level;
        return g;
      };
      // çıtırtı tamponu: seyrek, hızla sönen kıvılcım patlamaları (ateş / ızgara)
      const crackle = () => {
        if (this.crackBuf) return this.crackBuf;
        const len = c.sampleRate * 3, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
        for (let n = 0; n < 55; n++) {
          const at = (Math.random() * (len - 4000)) | 0, l = (40 + Math.random() * (Math.random() < 0.15 ? 2500 : 500)) | 0, a = 0.25 + Math.random() * 0.75;
          for (let i = 0; i < l; i++) d[at + i] += (Math.random() * 2 - 1) * a * Math.exp((-4 * i) / l);
        }
        return (this.crackBuf = b);
      };
      this.ambDefs = {
        wind: () => [layer('lowpass', 380, 0.7, 0.05, 0.09, 0.6, 0.05, 180)],
        rain: () => [layer('bandpass', 2600, 0.5, 0.11, 0.3, 0.15, 0, 0), layer('lowpass', 240, 0.6, 0.08, 0.07, 0.4, 0, 0), layer('highpass', 6000, 0.4, 0.03, 0, 0, 0, 0)],
        blizzard: () => [layer('lowpass', 650, 0.8, 0.08, 0.13, 0.7, 0.07, 300), layer('bandpass', 1300, 4, 0.025, 0.21, 0.8, 0.11, 500)],
        // yangın: çıtırtı + alçak uğultu + nefes alan alev hışırtısı
        fire: () => [layer('highpass', 900, 0.7, 0.2, 0, 0, 0, 0, crackle()), layer('lowpass', 150, 0.8, 0.14, 0.19, 0.5, 0, 0), layer('bandpass', 420, 0.8, 0.035, 0.37, 0.7, 0.13, 160)],
        // şelale: sürekli gürleyen akış
        water: () => [layer('lowpass', 1200, 0.5, 0.12, 0.05, 0.1, 0, 0), layer('bandpass', 420, 0.7, 0.09, 0.11, 0.2, 0.07, 90), layer('highpass', 3800, 0.5, 0.035, 0.23, 0.25, 0, 0)],
        // çarşı: uzak kalabalık mırıltısı + ızgara cızırtısı
        market: () => [layer('bandpass', 480, 1.6, 0.045, 3.1, 0.55, 0.7, 140), layer('bandpass', 950, 2.4, 0.022, 4.3, 0.6, 1.1, 250), layer('lowpass', 200, 0.6, 0.035, 0.09, 0.3, 0, 0),
          layer('highpass', 1800, 0.7, 0.05, 0, 0, 0, 0, crackle()), layer('highpass', 6000, 0.5, 0.01, 0.3, 0.8, 0, 0)],
        // kale çatısı: sert, uluyan rüzgâr
        gale: () => [layer('lowpass', 520, 0.8, 0.1, 0.11, 0.8, 0.06, 320), layer('bandpass', 820, 7, 0.04, 0.17, 0.9, 0.09, 380), layer('bandpass', 1650, 9, 0.014, 0.23, 0.9, 0.13, 650)],
      };
      this.amb = {};
      this.setAmbience(this.ambKind || 'wind');
    },
    setAmbience(kind) {
      this.ambKind = kind;
      if (!this.amb) return;
      if (kind && !this.amb[kind] && this.ambDefs[kind]) this.amb[kind] = this.ambDefs[kind]();
      const t = this.ctx.currentTime;
      for (const k in this.amb) for (const g of this.amb[k]) g.gain.setTargetAtTime(k === kind ? g._level : 0, t, 0.9);
    },
    thunder(delay = 0.5) {
      this.noise({ type: 'lowpass', f0: 220, f1: 60, dur: 3.4, gain: 0.8, attack: 0.08, send: 0.6, delay });
      this.noise({ type: 'lowpass', f0: 1200, f1: 300, dur: 0.5, gain: 0.35, attack: 0.01, send: 0.4, delay });
      this.tone({ freq: 48, freq1: 30, dur: 2.6, gain: 0.45, attack: 0.1, send: 0.4, delay: delay + 0.05 });
    },
    whoosh(power = 1) { this.noise({ type: 'bandpass', f0: 300, f1: 3000, q: 0.8, dur: 0.5, gain: 0.3 * power, attack: 0.35, send: 0.4 }); },
  };

  // Silence follows focus/visibility, the portal switch and ads (ND.portal hooks)
  const away = () => A.updateAway();
  document.addEventListener('visibilitychange', away);
  window.addEventListener('focus', away);
  window.addEventListener('blur', away);
  window.addEventListener('pageshow', away);
  P.onMute((m) => A.setPortalMute(m));
  P.onAd((ph) => (ph === 'start' ? A.suspendForAd() : A.resumeAfterAd()));
})(window.ND);
