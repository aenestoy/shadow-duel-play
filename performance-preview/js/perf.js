// Shadow Duel — developer frame profiler. Off unless the address has ?perf=1 (costs one flag read otherwise).
// Shows a small overlay: average / worst milliseconds per frame spent in each part (simulation steps, HUD DOM
// updates, background, reflections, shadows, fighters, effects, bloom...), simulation steps per frame, frame gap,
// canvas backing store size, graphics tier and a rough allocation rate (Chromium only).
// Test switches (only together with ?perf=1): &dpr=3 pretends the screen has that pixel ratio (phone emulation on a
// desktop browser), &phone=1 / &lowend=1 steer the device guesses, &flush=0|2 (see below).
// Console: ND.prof.stats() = numbers of the last one-second window, ND.prof.avg(n) = average of the last n fight
// windows, ND.prof.reset().
window.ND = window.ND || {};
(function (ND) {
  'use strict';
  let qs;
  try { qs = new URLSearchParams(location.search); } catch (e) { return; }
  if (qs.get('perf') !== '1') return;

  // Canvas drawing is only recorded when called; the browser turns it into GPU work later (when the canvas is
  // shown, or used as the source of another drawImage). To count that hidden work, the frame is "flushed" by
  // drawing the game canvas into a small GPU sink canvas: 'flush' bucket = the real cost of what was drawn
  // since the previous flush point. &flush=0 turns it off; &flush=2 flushes at every mark (cost of each part).
  // (Never getImageData: Chrome then moves the canvas to software drawing and every number is wrong.)
  const FLUSH = qs.get('flush') !== '0', FLUSH_ALL = qs.get('flush') === '2';
  let sink = null, sinkX = null, gameCv = null;
  const flush = () => {
    if (!gameCv) { gameCv = document.getElementById('cv'); sink = document.createElement('canvas'); sink.width = sink.height = 256; sinkX = sink.getContext('2d'); }
    if (gameCv && gameCv.width > 0) sinkX.drawImage(gameCv, 0, 0, 2, 2, 0, 0, 2, 2);
  };
  const fakeDpr = parseFloat(qs.get('dpr'));
  const def = (o, k, v) => { try { Object.defineProperty(o, k, { get: () => v, configurable: true }); } catch (e) { /* read-only */ } };
  if (fakeDpr > 0) def(window, 'devicePixelRatio', fakeDpr);
  // &phone=1 (a phone's browser: Android user agent) and &lowend=1 (4 cores, 3 GB) steer the device guesses in input.js
  if (qs.get('phone') === '1') def(navigator, 'userAgent', 'Mozilla/5.0 (Linux; Android 13; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36');
  if (qs.get('lowend') === '1') { def(navigator, 'hardwareConcurrency', 4); def(navigator, 'deviceMemory', 3); }
  // &seed=N: Math.random becomes a seeded generator from here on (film grain, dust motes, the menu demo...), so two
  // builds render the same frames and can be compared pixel by pixel
  const seed = parseInt(qs.get('seed'), 10);
  if (seed > 0) {
    let s = seed;
    Math.random = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  const now = () => performance.now();
  const P = ND.prof = {
    on: true,
    last: 0,
    frames: 0, // frames in the current window
    sum: Object.create(null), max: Object.create(null), cur: Object.create(null),
    order: [],
    steps: 0, stepsMax: 0, stepHist: [0, 0, 0, 0, 0, 0], curSteps: 0,
    gapSum: 0, gapMax: 0, slow: 0, lastBegin: 0,
    heapPrev: 0, alloc: 0, gcs: 0,
    t0: now(), snap: null,
    // mark: time since the previous mark goes to bucket `name`
    m(name) {
      if (FLUSH_ALL) flush();
      const t = now(), d = t - this.last;
      this.last = t;
      if (!(name in this.cur)) { this.cur[name] = 0; if (!this.order.includes(name)) this.order.push(name); }
      this.cur[name] += d;
    },
    begin() {
      const t = now();
      if (this.lastBegin) {
        const gap = t - this.lastBegin;
        if (gap < 250) { this.gapSum += gap; if (gap > this.gapMax) this.gapMax = gap; if (gap > 20) this.slow++; }
      }
      this.lastBegin = t; this.last = t;
      this.curSteps = 0;
      for (const k in this.cur) this.cur[k] = 0;
    },
    end() {
      this.m('other');
      let total = 0;
      for (const k in this.cur) {
        const v = this.cur[k];
        total += v;
        this.sum[k] = (this.sum[k] || 0) + v;
        if (!(this.max[k] >= v)) this.max[k] = v;
      }
      this.sum.TOTAL = (this.sum.TOTAL || 0) + total;
      if (!(this.max.TOTAL >= total)) this.max.TOTAL = total;
      this.steps += this.curSteps;
      if (this.curSteps > this.stepsMax) this.stepsMax = this.curSteps;
      this.stepHist[Math.min(5, this.curSteps)]++;
      const mem = performance.memory;
      if (mem) {
        const h = mem.usedJSHeapSize;
        if (this.heapPrev) { if (h >= this.heapPrev) this.alloc += h - this.heapPrev; else this.gcs++; }
        this.heapPrev = h;
      }
      this.frames++;
      if (now() - this.t0 >= 1000) this.flush();
    },
    flush() {
      const n = Math.max(1, this.frames), secs = (now() - this.t0) / 1000, g = ND.game, cv = document.getElementById('cv');
      const parts = {};
      for (const k of this.order.concat(['TOTAL'])) if (this.sum[k] != null) parts[k] = { avg: +(this.sum[k] / n).toFixed(3), max: +(this.max[k] || 0).toFixed(2) };
      this.snap = {
        fps: +(n / secs).toFixed(1), gapAvg: +(this.gapSum / n).toFixed(2), gapMax: +this.gapMax.toFixed(1), slowFrames: this.slow,
        stepsAvg: +(this.steps / n).toFixed(2), stepsMax: this.stepsMax, stepHist: this.stepHist.slice(),
        allocKBps: +(this.alloc / 1024 / secs).toFixed(0), gcs: this.gcs,
        canvas: cv ? cv.width + 'x' + cv.height : '?', css: cv ? Math.round(cv.clientWidth) + 'x' + Math.round(cv.clientHeight) : '?',
        dpr: window.devicePixelRatio, tier: ND.gfx && ND.gfx.getQuality ? ND.gfx.getQuality() + (ND.gfx.active ? '→' + ND.gfx.active() : '') : (ND.settings && ND.settings.hq ? 'hq' : 'low'),
        drs: g && g.aq ? g.aq.R[g.aq.i].s : g && g.drs ? g.drs.i : null, phase: g ? g.phase : '', arena: ND.scene ? ND.scene.themeId : '',
        parts,
      };
      this.history.push(this.snap); if (this.history.length > 120) this.history.shift();
      this.reset(true);
      this.draw();
    },
    history: [],
    reset(keepHist) {
      this.frames = 0; this.sum = Object.create(null); this.max = Object.create(null);
      this.steps = 0; this.stepsMax = 0; this.stepHist = [0, 0, 0, 0, 0, 0];
      this.gapSum = 0; this.gapMax = 0; this.slow = 0; this.alloc = 0; this.gcs = 0; this.t0 = now();
      if (!keepHist) this.history.length = 0;
    },
    stats() { return this.snap; },
    // average of the last n windows (skips windows outside a fight when fightOnly)
    avg(n = 5, fightOnly = true) {
      const H = this.history.filter((s) => !fightOnly || s.phase === 'fight').slice(-n);
      if (!H.length) return null;
      const out = { windows: H.length, fps: 0, gapAvg: 0, stepsAvg: 0, allocKBps: 0, parts: {} };
      for (const s of H) {
        out.fps += s.fps / H.length; out.gapAvg += s.gapAvg / H.length; out.stepsAvg += s.stepsAvg / H.length; out.allocKBps += s.allocKBps / H.length;
        for (const k in s.parts) { const o = out.parts[k] || (out.parts[k] = { avg: 0, max: 0 }); o.avg += s.parts[k].avg / H.length; o.max = Math.max(o.max, s.parts[k].max); }
      }
      for (const k in out.parts) { out.parts[k].avg = +out.parts[k].avg.toFixed(3); out.parts[k].max = +out.parts[k].max.toFixed(2); }
      ['fps', 'gapAvg', 'stepsAvg', 'allocKBps'].forEach((k) => (out[k] = +out[k].toFixed(2)));
      Object.assign(out, { canvas: H[H.length - 1].canvas, tier: H[H.length - 1].tier, arena: H[H.length - 1].arena });
      return out;
    },
    el: null,
    draw() {
      if (!this.el) {
        const d = this.el = document.createElement('pre');
        d.id = 'perfBox';
        d.style.cssText = 'position:fixed;left:4px;top:40px;z-index:99999;margin:0;padding:6px 8px;background:rgba(0,0,0,.72);color:#cfe;font:11px/1.25 ui-monospace,Consolas,monospace;pointer-events:none;white-space:pre;max-height:90vh;overflow:hidden';
        (document.getElementById('app') || document.body).appendChild(d);
      }
      const s = this.snap; if (!s) return;
      let t = `${s.fps} fps  gap ${s.gapAvg}/${s.gapMax}ms  slow ${s.slowFrames}\nsteps ${s.stepsAvg} max ${s.stepsMax} [${s.stepHist.join(' ')}]\n${s.canvas} (${s.css} @${s.dpr}) ${s.tier} drs${s.drs}\nalloc ${s.allocKBps} KB/s  gc ${s.gcs}\n`;
      for (const k in s.parts) t += `${k.padEnd(15)}${s.parts[k].avg.toFixed(2).padStart(6)} ${s.parts[k].max.toFixed(1).padStart(5)}\n`;
      this.el.textContent = t;
    },
  };

  // Hooks: wrap the game's own methods once every script has run (method calls are looked up at call time)
  function hook() {
    const g = ND.game, input = ND.input;
    if (!g || g._profHooked) return;
    g._profHooked = true;
    const wrap = (obj, name, fn) => { const orig = obj[name]; if (typeof orig !== 'function') return; obj[name] = function (...a) { return fn.call(this, orig, a); }; };
    // frameBody starts with input.pollPads(): frame begins there
    wrap(input, 'pollPads', function (orig, a) { P.begin(); const r = orig.apply(this, a); P.m('input'); return r; });
    wrap(g, 'advance', function (orig, a) { P.m('pre-sim'); const r = orig.apply(this, a); P.m('sim'); return r; });
    wrap(g, 'update', function (orig, a) { P.curSteps++; return orig.apply(this, a); });
    wrap(g, 'hud', function (orig, a) { const t = now(); const r = orig.apply(this, a); P.cur.hudDom = (P.cur.hudDom || 0) + now() - t; if (!P.order.includes('hudDom')) P.order.push('hudDom'); return r; });
    wrap(g, 'syncTouch', function (orig, a) { P.m('portal'); const r = orig.apply(this, a); P.m('syncTouch'); return r; });
    wrap(g, 'render', function (orig, a) { const r = orig.apply(this, a); if (FLUSH) { P.m('render-tail'); flush(); P.m('flush'); } P.end(); return r; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(hook, 0)); else setTimeout(hook, 0);
})(window.ND);
