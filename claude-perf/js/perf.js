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

  // Timings measure synchronous CPU/Canvas submission work, not GPU completion or displayed frames.
  // Optional &flush=1|2 adds a canvas copy (per frame / mark). That can expose deferred work, but it is NOT
  // a GPU fence and changes the workload. Leave it off for phone reports. No pixel readback in live profiling.
  const FLUSH = ['1', '2'].includes(qs.get('flush')), FLUSH_ALL = qs.get('flush') === '2';
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
    gapSum: 0, gapMax: 0, gapCount: 0, slow: 0, lastBegin: 0, frameStart: 0, frameOpen: false, context: '',
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
      // A report window never mixes gameplay with menus, pause, ads, quality changes or another arena.
      const g = ND.game, cv = document.getElementById('cv');
      const context = JSON.stringify([g?.mode, g?.phase, !!g?.paused, !!ND.portal?.inAd, !!document.hidden,
        ND.gfx?.tier, cv?.width, cv?.height, ND.scene?.themeId, g?.F?.map((f) => f.ch?.id)]);
      if (context !== this.context) { this.context = context; this.reset(true); this.lastBegin = 0; }
      if (this.lastBegin) {
        const gap = t - this.lastBegin;
        this.gapSum += gap; this.gapCount++; if (gap > this.gapMax) this.gapMax = gap; if (gap > 20) this.slow++;
      }
      this.lastBegin = t; this.last = t; this.frameStart = t; this.frameOpen = true;
      this.curSteps = 0;
      for (const k in this.cur) this.cur[k] = 0;
    },
    end() {
      if (!this.frameOpen) return;
      this.frameOpen = false;
      this.m('other');
      // hudDom is a nested measurement inside sim. Summing all buckets would count it twice.
      const total = this.last - this.frameStart;
      for (const k in this.cur) {
        const v = this.cur[k];
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
        frames: this.frames, seconds: +secs.toFixed(3),
        fps: +(n / secs).toFixed(1), gapAvg: +(this.gapSum / Math.max(1, this.gapCount)).toFixed(2), gapMax: +this.gapMax.toFixed(1), slowFrames: this.slow,
        stepsAvg: +(this.steps / n).toFixed(2), stepsMax: this.stepsMax, stepHist: this.stepHist.slice(),
        allocKBps: +(this.alloc / 1024 / secs).toFixed(0), gcs: this.gcs,
        canvas: cv ? cv.width + 'x' + cv.height : '?', css: cv ? Math.round(cv.clientWidth) + 'x' + Math.round(cv.clientHeight) : '?',
        dpr: window.devicePixelRatio, tier: ND.gfx && ND.gfx.getQuality ? ND.gfx.getQuality() + (ND.gfx.active ? '→' + ND.gfx.active() : '') : (ND.settings && ND.settings.hq ? 'hq' : 'low'),
        drs: g && g.aq ? g.aq.R[g.aq.i].s : g && g.drs ? g.drs.i : null, phase: g ? g.phase : '', arena: ND.scene ? ND.scene.themeId : '',
        mode: g?.mode, paused: !!g?.paused, hidden: !!document.hidden, inAd: !!ND.portal?.inAd,
        fighters: g?.F?.map((f) => f.ch?.id),
        caches: g?.F?.map((f) => f._bake && ND.bakeStats ? ND.bakeStats(f._bake) : null),
        fighterMode: g?.fighterMode,
        post: g ? { glow: g.glowMode, scene: g.sceneMode, grain: g.grainMode, gpu: g.postMode } : null,
        pace: g?.pace ? { on: g.pace.on, ...g.pace.stat() } : null,
        highCaches: g?.F?.map((f) => f._highBake && ND.bakeStats ? ND.bakeStats(f._highBake) : null),
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
      this.gapSum = 0; this.gapMax = 0; this.gapCount = 0; this.slow = 0; this.alloc = 0; this.gcs = 0; this.t0 = now();
      if (!keepHist) { this.history.length = 0; this.lastBegin = 0; this.frameOpen = false; }
    },
    stats() { return this.snap; },
    // average of the last n windows (skips windows outside a fight when fightOnly)
    avg(n = 5, fightOnly = true) {
      const H = this.history.filter((s) => !fightOnly || this.isFight(s)).slice(-n);
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
    isFight(s) { return s.phase === 'fight' && s.mode !== 'attract' && !s.paused && !s.hidden && !s.inAd; },
    report() {
      const windows = this.history.filter((s) => this.isFight(s)).slice(-10);
      return {
        report: 'shadow-duel-phone-v2',
        renderer: ND.game?.renderVersion || 'shared-surfaces',
        note: 'Frame callback rate and synchronous CPU/Canvas submission only; GPU/display time is not measured. hudDom is included in sim and TOTAL.',
        device: { userAgent: navigator.userAgent, dpr: window.devicePixelRatio, cores: navigator.hardwareConcurrency, memoryGB: navigator.deviceMemory },
        probeCopies: FLUSH_ALL ? 'per-mark' : FLUSH ? 'per-frame' : 'off',
        emulated: ['phone', 'lowend', 'dpr'].some((k) => qs.has(k)),
        windows,
      };
    },
    async copyReport() {
      const report = this.report();
      if (!report.windows.length) { this.copyButton.textContent = 'PLAY A FIGHT FIRST'; return; }
      const text = JSON.stringify(report, null, 2);
      try {
        if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
        await navigator.clipboard.writeText(text);
        this.copyButton.textContent = 'COPIED';
      } catch (e) {
        // Manual copy also works in browsers which refuse clipboard access. Nothing is uploaded.
        if (!this.copyPanel) {
          const box = this.copyPanel = document.createElement('div');
          box.style.cssText = 'position:fixed;inset:10%;z-index:100001;background:#111722;padding:16px;display:flex;flex-direction:column;gap:8px';
          const label = document.createElement('label'); label.textContent = 'Select and copy this performance report';
          const area = this.copyArea = document.createElement('textarea'); area.readOnly = true; area.style.cssText = 'flex:1;min-height:80px';
          label.htmlFor = area.id = 'perfReportText';
          const close = document.createElement('button'); close.textContent = 'CLOSE'; close.onclick = () => { box.style.display = 'none'; this.copyButton.focus(); };
          box.append(label, area, close); (document.getElementById('app') || document.body).appendChild(box);
        }
        this.copyPanel.style.display = 'flex'; this.copyArea.value = text; this.copyArea.focus(); this.copyArea.select();
      }
    },
    el: null,
    draw() {
      if (!this.el) {
        const d = this.el = document.createElement('pre');
        d.id = 'perfBox';
        d.style.cssText = 'position:fixed;left:4px;top:40px;z-index:99999;margin:0;padding:6px 8px;background:rgba(0,0,0,.72);color:#cfe;font:11px/1.25 ui-monospace,Consolas,monospace;pointer-events:none;white-space:pre;max-height:90vh;overflow:hidden';
        (document.getElementById('app') || document.body).appendChild(d);
        const b = this.copyButton = document.createElement('button');
        b.id = 'perfCopy'; b.type = 'button'; b.textContent = 'COPY REPORT';
        b.style.cssText = 'position:fixed;right:8px;top:48px;z-index:100000;padding:10px 14px;font:600 12px sans-serif;background:#17232b;color:#cfe;border:1px solid #8bbaac;touch-action:manipulation';
        b.onclick = () => this.copyReport();
        (document.getElementById('app') || document.body).appendChild(b);
      }
      const s = this.snap; if (!s) return;
      let t = `${s.fps} fps  gap ${s.gapAvg}/${s.gapMax}ms  slow ${s.slowFrames}\nsteps ${s.stepsAvg} max ${s.stepsMax} [${s.stepHist.join(' ')}]\n${s.canvas} (${s.css} @${s.dpr}) ${s.tier} drs${s.drs}\nalloc ${s.allocKBps} KB/s  gc ${s.gcs}\n`;
      if (qs.get('compact') === '1') t = `${s.fps} fps · CPU ${s.parts.TOTAL?.avg.toFixed(2)} ms\n${s.tier} · ${s.canvas}\nFight samples: ${this.history.filter((v) => this.isFight(v)).length} · report v2`;
      else {
        t += 'CPU avg / max ms (GPU not measured)\n';
        for (const k in s.parts) t += `${k.padEnd(15)}${s.parts[k].avg.toFixed(2).padStart(6)} ${s.parts[k].max.toFixed(1).padStart(5)}\n`;
      }
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
    wrap(g, 'render', function (orig, a) { const r = orig.apply(this, a); if (this.preparing) return r; if (FLUSH) { P.m('render-tail'); flush(); P.m('flush'); } P.end(); return r; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(hook, 0)); else setTimeout(hook, 0);
})(window.ND);
