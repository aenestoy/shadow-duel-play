// Gölge Düellosu — üretken müzik: koto (Karplus-Strong), shakuhachi, taiko; Japon "in" dizisi
(function (ND) {
  'use strict';
  const au = ND.audio;
  const SCALE = [0, 1, 5, 7, 8];           // miyako-bushi (in-sen) — Re tabanlı
  const BASE = 146.83;                     // D3

  const mu = ND.music = {
    ready: false, enabled: true, mode: 'off', nextMode: 'off', tempo: 66, step: 0, nextT: 0, timer: null,
    kotoBufs: [], walk: 7, phrase: [], shaku: null,

    init() {
      if (this.ready || !au.ready) return;
      const c = au.ctx;
      // bus level = on/off switch × music slider (ND.audio.vol.music); the reverb send is taken after it
      this.bus = c.createGain(); this.bus.gain.value = this.level();
      this.bus.connect(au.master);
      const send = c.createGain(); send.gain.value = 0.45; this.bus.connect(send); send.connect(au.rev);
      // koto örneklerini önceden üret (2,5 oktav)
      for (let i = 0; i < 13; i++) {
        const oct = Math.floor(i / 5), deg = SCALE[i % 5];
        this.kotoBufs.push(this.ks(BASE * Math.pow(2, (oct * 12 + deg) / 12), 2.2));
      }
      this.ready = true;
      this.nextT = c.currentTime + 0.1;
      this.timer = setInterval(() => this.schedule(), 30);
    },

    level() { return this.enabled ? 0.38 * au.curve(au.vol.music) : 0; },
    setEnabled(v) {
      this.enabled = v;
      if (this.bus) au.ramp(this.bus.gain, this.level(), 0.3);
    },
    // music slider moved (ND.audio.setVolume): short glide, no clicks
    applyVolume() { if (this.bus) au.ramp(this.bus.gain, this.level(), 0.04); },
    setMode(m) { this.nextMode = m; if (this.mode === 'off' || m === 'off' || m === 'ko') { this.mode = m; this.step = 0; } },

    freq(i) { const oct = Math.floor(i / 5), deg = SCALE[((i % 5) + 5) % 5]; return BASE * Math.pow(2, (oct * 12 + deg) / 12); },

    // Karplus-Strong telli çalgı sentezi
    ks(f, dur) {
      const c = au.ctx, sr = c.sampleRate, len = (sr * dur) | 0, N = Math.max(2, Math.round(sr / f));
      const buf = c.createBuffer(1, len, sr), out = buf.getChannelData(0), ring = new Float32Array(N);
      let prev = 0;
      for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; ring[i] = (r + prev) * 0.5; prev = r; }
      let idx = 0;
      const decay = 0.9965 - f / 60000;
      for (let i = 0; i < len; i++) {
        const nx = (idx + 1) % N;
        const v = ring[idx];
        out[i] = v * (i < 40 ? i / 40 : 1);
        ring[idx] = (v + ring[nx]) * 0.5 * decay;
        idx = nx;
      }
      return buf;
    },

    koto(t, i, vel = 1, pan = 0) {
      const b = this.kotoBufs[Math.max(0, Math.min(this.kotoBufs.length - 1, i))];
      if (!b) return;
      const c = au.ctx, s = c.createBufferSource(); s.buffer = b;
      const g = c.createGain(); g.gain.value = 0.55 * vel;
      const p = c.createStereoPanner ? c.createStereoPanner() : null;
      if (p) { p.pan.value = pan; s.connect(g); g.connect(p); p.connect(this.bus); } else { s.connect(g); g.connect(this.bus); }
      s.start(t);
    },

    shakuhachi(t, f, dur, vel = 1) {
      const c = au.ctx;
      const o = c.createOscillator(); o.type = 'sine';
      const o2 = c.createOscillator(); o2.type = 'triangle';
      o.frequency.setValueAtTime(f * 0.965, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.22);
      o2.frequency.setValueAtTime(f * 2 * 0.965, t); o2.frequency.exponentialRampToValueAtTime(f * 2, t + 0.22);
      const vib = c.createOscillator(); vib.frequency.value = 5.2;
      const vg = c.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.012, t + dur * 0.8);
      vib.connect(vg); vg.connect(o.frequency);
      const g = c.createGain(), g2 = c.createGain(); g2.gain.value = 0.08;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22 * vel, t + 0.25);
      g.gain.setValueAtTime(0.22 * vel, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
      // nefes
      const n = c.createBufferSource(); n.buffer = au.noiseBuf;
      const bf = c.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = f * 2; bf.Q.value = 3;
      const ng = c.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.06 * vel, t + 0.12); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.4);
      o.connect(g); o2.connect(g2); g2.connect(g); n.connect(bf); bf.connect(ng); ng.connect(this.bus); g.connect(this.bus);
      [o, o2, vib].forEach((x) => { x.start(t); x.stop(t + dur + 0.6); });
      n.start(t, Math.random()); n.stop(t + dur + 0.6);
    },

    drum(t, kind, vel = 1) {
      const c = au.ctx;
      if (kind === 'o') { // odaiko
        const o = c.createOscillator(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.3);
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9 * vel, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.75);
      }
      const n = c.createBufferSource(); n.buffer = au.noiseBuf;
      const f = c.createBiquadFilter();
      const g = c.createGain();
      if (kind === 'o') { f.type = 'lowpass'; f.frequency.value = 500; g.gain.setValueAtTime(0.4 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15); }
      else { // shime-daiko: kısa, gergin
        f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.5;
        g.gain.setValueAtTime(0.35 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        const o = c.createOscillator(); o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(260, t + 0.06);
        const og = c.createGain(); og.gain.setValueAtTime(0.25 * vel, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        o.connect(og); og.connect(this.bus); o.start(t); o.stop(t + 0.1);
      }
      n.connect(f); f.connect(g); g.connect(this.bus); n.start(t, Math.random()); n.stop(t + 0.2);
    },

    // Rastgele yürüyüşle dizi içinde melodi
    stepWalk(lo, hi) {
      const r = Math.random();
      this.walk += r < 0.4 ? 1 : r < 0.8 ? -1 : r < 0.9 ? 2 : -2;
      if (this.walk < lo) this.walk = lo + 1; if (this.walk > hi) this.walk = hi - 1;
      return this.walk;
    },

    // Hidden tab or running ad: schedule nothing (the master gain is down anyway), keep the clock moving
    schedule() {
      if (!this.ready || this.mode === 'off' || document.hidden || au.adMuted) { if (this.ready) this.nextT = Math.max(this.nextT, au.ctx.currentTime + 0.05); return; }
      const c = au.ctx;
      while (this.nextT < c.currentTime + 0.15) {
        this.play(this.nextT, this.step);
        const spb = 60 / this.tempo / 4; // 16'lık
        this.nextT += spb;
        this.step++;
        if (this.step % 16 === 0 && this.nextMode !== this.mode) { this.mode = this.nextMode; this.step = 0; }
      }
    },

    play(t, s) {
      const m = this.mode, bar = Math.floor(s / 16), b16 = s % 16;
      if (m === 'menu') {
        this.tempo = 64;
        if (b16 % 4 === 0 && Math.random() < 0.55) this.koto(t, this.stepWalk(3, 11), 0.6 + Math.random() * 0.3, Math.random() * 0.6 - 0.3);
        if (b16 === 0 && bar % 2 === 0) this.koto(t, 0, 0.5, -0.3);
        if (b16 === 0 && bar % 4 === 1) { const n = this.stepWalk(5, 11); this.shakuhachi(t, this.freq(n), 2.2 + Math.random() * 1.5, 0.8); }
      } else if (m === 'fight' || m === 'final') {
        const fin = m === 'final';
        this.tempo = fin ? 116 : 98;
        // taiko
        const ost = fin ? [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1] : [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0];
        if (ost[b16]) this.drum(t, 'o', b16 === 0 ? 1 : 0.7);
        if (b16 % 2 === 0 || (fin && Math.random() < 0.35)) this.drum(t, 's', b16 % 4 === 0 ? 0.8 : 0.4);
        if (bar % 4 === 3 && b16 >= 12) this.drum(t, 's', 0.5 + (b16 - 12) * 0.12);
        // koto ostinato
        const pat = [0, 2, 3, 2, 5, 3, 2, 1];
        if (b16 % 2 === 0) {
          const k = pat[(b16 / 2) | 0] + (bar % 4 === 2 ? 1 : 0) + (fin ? 3 : 0);
          this.koto(t, k, b16 % 4 === 0 ? 0.7 : 0.45, (b16 % 4 === 0 ? -0.25 : 0.25));
        }
        if (b16 === 0 && bar % 8 === 4) this.shakuhachi(t, this.freq(this.stepWalk(6, 12)), 3, 0.7);
      } else if (m === 'ko') {
        this.tempo = 60;
        if (s < 8 && s % 2 === 0) this.koto(t, 10 - s, 0.8);
        if (s === 10) this.shakuhachi(t, this.freq(5), 3.5, 0.7);
      }
    },
  };
})(window.ND);
