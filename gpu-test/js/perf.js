// Shadow Duel — developer frame profiler. Off unless the address has ?perf=1 (costs one flag read otherwise).
// Shows a small overlay, refreshed every second: frames per second, the screen's refresh rate as the browser delivers
// it (estimated by the frame pacer) and the frame-rate cap, frame time median / 95th percentile, the frame's processor
// time split into simulation / drawing (recording the picture) / WebGL, graphics quality, canvas backing store size and
// pixel ratio; the one-off work of that second that frame timers do not see (WebGL texture uploads and their size, new
// textures, shader compiles, fighter part pictures drawn / dropped / drawn as paths: each can stall a phone's GPU);
// below it the average / worst milliseconds of each part (simulation steps, HUD DOM updates, background,
// reflections, shadows, fighters, effects, bloom...), simulation steps per frame and a rough allocation rate.
// Test switches (only together with ?perf=1): &dpr=3 pretends the screen has that pixel ratio (phone emulation on a
// desktop browser), &phone=1 / &lowend=1 steer the device guesses, &flush=0|2 (see below).
// Console: ND.prof.stats() = numbers of the last one-second window, ND.prof.avg(n) = average of the last n fight
// windows, ND.prof.reset().
// Hitch recorder (ND.prof.hitches): every frame that comes much later than it should — at least 40 ms and twice the
// display interval and twice the usual frame time of the last second — is kept (the last 200) with what happened since
// the frame before it: the game's state and screen, that frame's processor time and its heaviest parts, simulation
// steps, online rollbacks, fighter part pictures drawn (bakes), WebGL texture uploads (count, KB), new textures,
// shader compiles, sprite atlas draws, a heap drop (a garbage collection, where the browser reports memory), audio
// decodes / new sound buffers / sounds started, DOM changes and HUD time, vibrations, resize / visibility events and
// the browser's long tasks (PerformanceObserver 'longtask'). The COPY REPORT button copies a short text report: the
// device, the session summary and the last 50 hitches with their likely causes (nothing is sent anywhere).
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
    heapPrev: 0, alloc: 0, gcs: 0, memN: 0,
    t0: now(), snap: null,
    // frame gaps of the window (for the median and 95th percentile) and the match context of the last frame
    gaps: new Float64Array(1024), nGaps: 0, ctx: [], ctxChanged: false, cv: null,
    ck(i, v) { if (this.ctx[i] !== v) { this.ctx[i] = v; this.ctxChanged = true; } },
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
      HR.frame(t);
      // A report window never mixes gameplay with menus, pause, ads, quality changes or another arena.
      // (compared field by field: no string or array made per frame, so the profiler adds no garbage of its own)
      const g = ND.game, cv = this.cv || (this.cv = document.getElementById('cv'));
      this.ctxChanged = false;
      this.ck(0, g?.mode); this.ck(1, g?.phase); this.ck(2, !!g?.paused); this.ck(3, !!ND.portal?.inAd); this.ck(4, !!document.hidden);
      this.ck(5, ND.gfx?.tier); this.ck(6, cv?.width); this.ck(7, cv?.height); this.ck(8, ND.scene?.themeId);
      this.ck(9, g?.F?.[0]?.ch?.id); this.ck(10, g?.F?.[1]?.ch?.id);
      if (this.ctxChanged) { this.reset(true); this.lastBegin = 0; this.work0 = this.workNow(); }
      if (this.lastBegin) {
        const gap = t - this.lastBegin;
        this.gapSum += gap; this.gapCount++; if (gap > this.gapMax) this.gapMax = gap; if (gap > 20) this.slow++;
        if (this.nGaps < this.gaps.length) this.gaps[this.nGaps++] = gap;
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
      // heap size every 8th frame (reading performance.memory is itself slow; a drop between reads = a collection)
      const mem = ++this.memN % 8 === 0 ? performance.memory : null;
      if (mem) {
        const h = mem.usedJSHeapSize;
        if (this.heapPrev) { if (h >= this.heapPrev) this.alloc += h - this.heapPrev; else this.gcs++; }
        this.heapPrev = h;
      }
      this.frames++;
      GP.frame();
      if (now() - this.t0 >= 1000) this.flush();
    },
    flush() {
      const n = Math.max(1, this.frames), secs = (now() - this.t0) / 1000, g = ND.game, cv = document.getElementById('cv');
      const parts = {};
      for (const k of this.order.concat(['TOTAL'])) if (this.sum[k] != null) parts[k] = { avg: +(this.sum[k] / n).toFixed(3), max: +(this.max[k] || 0).toFixed(2) };
      // the summary groups of the overlay: simulation, recording the picture (Canvas calls → triangles), WebGL / post
      const grp = { sim: 0, draw: 0, gl: 0, other: 0 };
      for (const k in this.sum) {
        if (k === 'TOTAL' || k === 'hudDom') continue;
        const v = this.sum[k] / n;
        if (k === 'sim' || k === 'pre-sim') grp.sim += v;
        else if (k === 'post' || k === 'flush' || k === 'render-tail') grp.gl += v;
        else if (k === 'input' || k === 'portal' || k === 'syncTouch' || k === 'other') grp.other += v;
        else grp.draw += v;
      }
      for (const k in grp) grp[k] = +grp[k].toFixed(3);
      // one-off work the frame timers do not see (GPU uploads and driver work): WebGL texture uploads and their size,
      // new textures, shader compiles, render targets made, fighter part pictures drawn (bakes), dropped (evictions)
      // and drawn as paths instead (budget), per window
      const w0 = this.work0 || (this.work0 = this.workNow()), w1 = this.workNow(), work = {};
      for (const k in w1) work[k] = +(w1[k] - (w0[k] || 0)).toFixed(k === 'texKB' ? 1 : 0);
      this.work0 = w1;
      const G = this.gaps.subarray(0, this.nGaps).sort(), pct = (p) => (G.length ? +G[Math.min(G.length - 1, Math.floor(p * G.length))].toFixed(2) : 0);
      this.snap = {
        frames: this.frames, seconds: +secs.toFixed(3),
        fps: +(n / secs).toFixed(1), gapAvg: +(this.gapSum / Math.max(1, this.gapCount)).toFixed(2), gapMax: +this.gapMax.toFixed(1), slowFrames: this.slow,
        gapP50: pct(0.5), gapP95: pct(0.95), groups: grp,
        stepsAvg: +(this.steps / n).toFixed(2), stepsMax: this.stepsMax, stepHist: this.stepHist.slice(),
        allocKBps: +(this.alloc / 1024 / secs).toFixed(0), gcs: this.gcs,
        canvas: cv ? cv.width + 'x' + cv.height : '?', css: cv ? Math.round(cv.clientWidth) + 'x' + Math.round(cv.clientHeight) : '?',
        dpr: window.devicePixelRatio, tier: ND.gfx && ND.gfx.getQuality ? ND.gfx.getQuality() + (ND.gfx.active ? '→' + ND.gfx.active() : '') : (ND.settings && ND.settings.hq ? 'hq' : 'low'),
        drs: g && g.aq ? g.aq.R[g.aq.i].s : g && g.drs ? g.drs.i : null, phase: g ? g.phase : '', arena: ND.scene ? ND.scene.themeId : '',
        mode: g?.mode, paused: !!g?.paused, hidden: !!document.hidden, inAd: !!ND.portal?.inAd,
        fighters: g?.F?.map((f) => f.ch?.id),
        caches: g?.F?.map((f) => f._bake && ND.bakeStats ? ND.bakeStats(f._bake) : null),
        work,
        gl: g?.glStatus ? g.glStatus() : null,
        pace: g?.pace ? { on: g.pace.on, ...g.pace.stat() } : null,
        gpu: GP.window(),
        parts,
      };
      this.history.push(this.snap); if (this.history.length > 120) this.history.shift();
      this.reset(true);
      this.draw();
    },
    history: [],
    // running totals (differences per window go into snap.work)
    workNow(into) {
      const R = ND.game?.glRenderer?.()?.R, C = R?.count || {}, o = into || {};
      o.texUp = C.texUp || 0; o.texKB = C.texKB || 0; o.texNew = C.texNew || 0; o.texts = C.texts || 0; o.shaders = C.shaders || 0; o.targets = C.targets || 0; o.sprites = C.sprites || 0; o.spriteDrops = C.spriteDrops || 0; o.bakes = 0; o.evictions = 0; o.paths = 0;
      for (const f of ND.game?.F || []) { const b = f._bake; if (b) { o.bakes += b.bakes; o.evictions += b.evictions; o.paths += b.live; } }
      return o;
    },
    reset(keepHist) {
      this.frames = 0; this.sum = Object.create(null); this.max = Object.create(null);
      this.steps = 0; this.stepsMax = 0; this.stepHist = [0, 0, 0, 0, 0, 0];
      this.gapSum = 0; this.gapMax = 0; this.gapCount = 0; this.slow = 0; this.alloc = 0; this.gcs = 0; this.t0 = now(); this.nGaps = 0;
      GP.clear();
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
      // GPU: mean of the windows that measured it; p95 = the worst window's p95
      const GW = H.map((s) => s.gpu).filter((x) => x && x.avg != null), LW = H.map((s) => s.gpu).filter((x) => x && x.lag != null);
      if (GW.length) out.gpu = { avg: +(GW.reduce((a, x) => a + x.avg, 0) / GW.length).toFixed(3), scene: +(GW.reduce((a, x) => a + x.scene, 0) / GW.length).toFixed(3), post: +(GW.reduce((a, x) => a + x.post, 0) / GW.length).toFixed(3), p95: Math.max(...GW.map((x) => x.p95)) };
      if (LW.length) (out.gpu || (out.gpu = {})).lag = +(LW.reduce((a, x) => a + x.lag, 0) / LW.length).toFixed(2);
      ['fps', 'gapAvg', 'stepsAvg', 'allocKBps'].forEach((k) => (out[k] = +out[k].toFixed(2)));
      Object.assign(out, { canvas: H[H.length - 1].canvas, tier: H[H.length - 1].tier, arena: H[H.length - 1].arena });
      return out;
    },
    isFight(s) { return s.phase === 'fight' && s.mode !== 'attract' && !s.paused && !s.hidden && !s.inAd; },
    report() {
      const windows = this.history.filter((s) => this.isFight(s)).slice(-10);
      return {
        report: 'shadow-duel-phone-v3',
        renderer: ND.game?.renderVersion || 'shared-surfaces',
        note: 'Frame callback rate and synchronous CPU/Canvas submission only; gpu = GPU time per frame of the WebGL2 renderer (timer queries where the browser offers them; lag = frames until the GPU finished a frame). hudDom is included in sim and TOTAL. work = per-window counts of WebGL texture uploads (texUp, texKB), new textures, shader compiles, render targets, fighter part pictures drawn (bakes), dropped (evictions) and drawn as paths (paths).',
        device: { userAgent: navigator.userAgent, dpr: window.devicePixelRatio, cores: navigator.hardwareConcurrency, memoryGB: navigator.deviceMemory },
        probeCopies: FLUSH_ALL ? 'per-mark' : FLUSH ? 'per-frame' : 'off',
        emulated: ['phone', 'lowend', 'dpr'].some((k) => qs.has(k)),
        windows,
      };
    },
    async copyReport() {
      const text = HR.text();
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
        b.setAttribute('translate', 'no');
        b.style.cssText = 'position:fixed;right:8px;top:48px;z-index:100000;padding:10px 14px;font:600 12px sans-serif;background:#17232b;color:#cfe;border:1px solid #8bbaac;touch-action:manipulation';
        b.onclick = () => this.copyReport();
        (document.getElementById('app') || document.body).appendChild(b);
      }
      const s = this.snap; if (!s) return;
      // Summary first (the numbers to compare High / Medium / Low on a phone): frame rate, the screen's refresh rate
      // as the browser delivers it and the game's frame-rate cap, frame time median / 95th percentile, the frame's
      // processor time split into simulation / picture recording / WebGL, then quality, canvas size and pixel ratio.
      // (the pacer's refresh estimate reads the gaps between frame callbacks: while frames are slower than the screen it
      // reads the slower rate, so the fastest rate seen this session, e.g. in the menus, is shown too)
      const pc = s.pace, hz = pc && pc.periodMs > 0 ? Math.round(1000 / pc.periodMs) : 0, cap = pc ? (pc.target ? String(pc.target) : 'max') : '?';
      if (hz > (this.hzBest || 0)) this.hzBest = hz;
      const gr = s.groups || {}, f2 = (v) => (v || 0).toFixed(2), g = ND.game;
      const scr = !hz ? '?' : this.hzBest > hz * 1.1 ? `${hz} (up to ${this.hzBest})` : String(hz);
      let t = `${s.fps} fps · screen ${scr} Hz · cap ${cap}\n` +
        `frame p50 ${s.gapP50} · p95 ${s.gapP95} ms · slow ${s.slowFrames}\n` +
        `CPU ${f2(s.parts.TOTAL?.avg)} ms = sim ${f2(gr.sim)} + draw ${f2(gr.draw)} + GL ${f2(gr.gl)} + other ${f2(gr.other)}\n` +
        `${GP.line(s.gpu, g?.rendererMode === 'gl')}\n` +
        `${String(ND.gfx?.active ? ND.gfx.active() : s.tier).toUpperCase()} (${ND.gfx?.getQuality ? ND.gfx.getQuality() : ''}) ${s.canvas} · css ${s.css} @${s.dpr}` +
        ` (max ${ND.gfx?.f?.dpr ?? '?'}${s.drs != null && s.drs !== 1 ? ' ×' + s.drs : ''}) · ${g?.rendererMode === 'gl' ? 'WebGL2' : 'Canvas'}\n`;
      if (Math.max(hz, this.hzBest || 0) > 70 && pc && pc.target && pc.target < Math.max(hz, this.hzBest) - 5) t += `(cap ${pc.target}: Settings > Graphics > Frame rate 120 / Max for more)\n`;
      const wk = s.work || {};
      t += `uploads ${wk.texUp ?? '?'} (${wk.texKB ?? '?'} KB, texts ${wk.texts ?? '?'}) · new tex ${wk.texNew ?? '?'} · shaders ${wk.shaders ?? '?'} · bakes ${wk.bakes ?? '?'} evict ${wk.evictions ?? '?'} paths ${wk.paths ?? '?'}
`;
      t += `hitches ${HR.count} (worst ${HR.worst.toFixed(0)} ms)${HR.list.length ? ' · last: ' + HR.brief(HR.list[HR.list.length - 1]) : ''}\n`;
      if (qs.get('compact') === '1') t += `Fight samples: ${this.history.filter((v) => this.isFight(v)).length} · report v3`;
      else {
        t += `steps ${s.stepsAvg} max ${s.stepsMax} [${s.stepHist.join(' ')}] · alloc ${s.allocKBps} KB/s gc ${s.gcs}\n`;
        t += 'CPU avg / max ms\n';
        for (const k in s.parts) t += `${k.padEnd(15)}${s.parts[k].avg.toFixed(2).padStart(6)} ${s.parts[k].max.toFixed(1).padStart(5)}\n`;
      }
      this.el.textContent = t;
    },
  };

  // ---------------------------------------------------------------- GPU time (WebGL2 renderer only)
  // The renderer's profiling is switched on (gl-render.js: a timer query around the recorded passes and one around the
  // post passes when the browser offers EXT_disjoint_timer_query_webgl2, and a fence per frame everywhere). Results come
  // a few frames late; each one is matched to its frame by id. gpuMs: GPU time of a frame (scene = layers + scene
  // pass, post = glow + present); lag: frames between submitting a frame and the GPU finishing it (a GPU that cannot
  // keep up shows here even where timer queries are missing, e.g. many Mali phones).
  const GP = P.gpu = {
    N: 1024, n: 0, nl: 0, ms: new Float64Array(1024), sc: new Float64Array(1024), po: new Float64Array(1024), lag: new Float64Array(1024),
    timer: null, lastId: 0, byId: new Map(),
    frame() {
      const glr = ND.game?.glRenderer?.();
      if (!glr) return;
      if (!glr.prof && glr.ready) glr.profile(true, { tess: false });
      const pf = glr.prof;
      if (pf && pf.frameId) this.lastId = pf.frameId;
      const D = glr.gpuDrain();
      for (let i = 0; i < D.length; i++) {
        const d = D[i];
        if (d.gpuMs !== undefined) {
          if (d.gpuMs >= 0 && this.n < this.N) { this.ms[this.n] = d.gpuMs; this.sc[this.n] = d.sceneMs; this.po[this.n] = d.postMs; this.n++; }
        } else if (d.lag !== undefined && this.nl < this.N) this.lag[this.nl++] = d.lag;
        HR.gpuResult(d);
        if (this.sink) this.sink(d); // (scripts/bench-gfx.mjs --gpu: every measurement)
      }
      if (glr.prof && this.lastId) this.timer = glr.gpuTimer; // (known once a WebGL frame asked for the extension)
    },
    clear() { this.n = 0; this.nl = 0; },
    // this window's GPU numbers (null: no WebGL frame measured)
    window() {
      if (!this.n && !this.nl) return this.timer === false ? { timer: false } : null;
      const pct = (a, n, p) => { const s = Array.from(a.subarray(0, n)).sort((x, y) => x - y); return s[Math.min(n - 1, Math.floor(p * n))]; };
      const avg = (a, n) => { let s = 0; for (let i = 0; i < n; i++) s += a[i]; return s / n; };
      const o = { timer: !!this.n };
      if (this.n) { o.avg = +avg(this.ms, this.n).toFixed(3); o.p95 = +pct(this.ms, this.n, 0.95).toFixed(2); o.max = +pct(this.ms, this.n, 1).toFixed(2); o.scene = +avg(this.sc, this.n).toFixed(3); o.post = +avg(this.po, this.n).toFixed(3); }
      if (this.nl) { o.lag = +avg(this.lag, this.nl).toFixed(2); o.lagMax = pct(this.lag, this.nl, 1); }
      if (!this.n && this.timer === false) o.timer = false;
      return o;
    },
    // overlay line
    line(w, gl) {
      if (!gl) return 'GPU - (Canvas 2D frame)';
      if (!w) return 'GPU (measuring...)';
      const lag = w.lag != null ? ` · lag ${w.lag} (max ${w.lagMax}) frames` : '';
      if (w.avg == null) return `GPU time n/a (no timer on this browser)${lag}`;
      return `GPU ${w.avg.toFixed(2)} ms = scene ${w.scene.toFixed(2)} + post ${w.post.toFixed(2)} · p95 ${w.p95} max ${w.max}${lag}`;
    },
  };

  // ---------------------------------------------------------------- hitch recorder (see the header)
  const HR = P.hr = {
    list: [], count: 0, worst: 0, frames: 0, t0: now(), last: 0, recent: new Float64Array(60), nRecent: 0, iRecent: 0,
    w0: null, w1: {}, ev: { decodes: 0, buffers: 0, sounds: 0, vibrates: 0, resizes: 0, vis: 0, dom: 0, keys: 0 }, ev0: null,
    long: [], heap: 0, rb: 0, rbSteps: 0, loadAt: -1, byCtx: Object.create(null),
    // the usual frame time: the median of the last 60 gaps
    usual() {
      const n = this.nRecent; if (!n) return 16.7;
      const a = Array.from(this.recent.subarray(0, n)).sort((x, y) => x - y);
      return a[n >> 1];
    },
    period() { const pc = ND.game?.pace?.stat?.(); return pc && pc.periodMs > 0 ? pc.periodMs * (pc.every || 1) : 16.7; },
    frame(t) {
      const gap = this.last ? t - this.last : 0, prev = this.last;
      this.last = t; this.frames++;
      const w = P.workNow(this.w1);
      const S = ND.net?.session?.(), rb = S ? S.st.rollbacks : 0, rbs = S ? S.st.rolledSteps : 0;
      const mem = performance.memory, heap = mem ? mem.usedJSHeapSize : 0;
      if (gap > 0) {
        const lim = Math.max(40, 2 * this.period(), 2 * this.usual());
        if (gap >= lim && this.w0) this.record(t, prev, gap, w, rb, rbs, heap);
        if (gap < 1000) { this.recent[this.iRecent] = gap; this.iRecent = (this.iRecent + 1) % this.recent.length; if (this.nRecent < this.recent.length) this.nRecent++; }
      }
      // counters of the interval that starts now
      this.w0 = Object.assign(this.w0 || {}, w); this.ev0 = Object.assign(this.ev0 || {}, this.ev);
      this.rb = rb; this.rbSteps = rbs; this.heap = heap;
      if (this.long.length > 40) this.long.splice(0, this.long.length - 40);
    },
    screen() {
      const g = ND.game, vis = (id) => { const e = document.getElementById(id); return !!e && !e.hidden; };
      const scr = ['onl', 'onlEnd', 'onlWait', 'end', 'pause', 'select', 'menu', 'first', 'lb', 'hall', 'bzLobby', 'bzRes', 'movesOv', 'rotate'].filter((id) => id === 'rotate' ? getComputedStyle(document.getElementById(id) || document.body).display !== 'none' && !!document.getElementById(id) : vis(id));
      if (document.getElementById('setOv') && !document.getElementById('setOv').hidden) scr.push('settings');
      const on = ND.online?.state?.().screen;
      return (g ? g.mode + '/' + g.phase + (g.paused ? '/paused' : '') + (g.preparing ? '/loading' : '') : '?') + (on ? ' online:' + on : '') + (scr.length ? ' [' + scr.join(',') + ']' : '');
    },
    record(t, prev, gap, w, rb, rbs, heap) {
      const d = (k) => +((w[k] || 0) - (this.w0[k] || 0)).toFixed(k === 'texKB' ? 0 : 0), e = (k) => this.ev[k] - (this.ev0[k] || 0);
      const parts = Object.keys(P.cur).filter((k) => k !== 'hudDom').map((k) => [k, P.cur[k]]).sort((x, y) => y[1] - x[1]).slice(0, 3).filter((x) => x[1] >= 1);
      const cpu = P.frameStart && P.last >= P.frameStart ? P.last - P.frameStart : 0;
      const longs = this.long.filter((l) => l.end > prev - 5 && l.start < t).map((l) => Math.round(l.dur));
      const h = {
        at: +((t - this.t0) / 1000).toFixed(1), gap: Math.round(gap), where: this.screen(),
        cpu: Math.round(cpu), parts: parts.map((x) => x[0] + ' ' + x[1].toFixed(0)).join(', '), steps: P.curSteps, hud: +(P.cur.hudDom || 0).toFixed(1),
        rollbacks: rb - this.rb, rolled: rbs - this.rbSteps,
        bakes: d('bakes'), texUp: d('texUp'), texKB: d('texKB'), texNew: d('texNew'), shaders: d('shaders'), sprites: d('sprites'), evictions: d('evictions'),
        gc: this.heap && heap && heap < this.heap - 256 * 1024 ? Math.round((this.heap - heap) / 1048576 * 10) / 10 : 0,
        decodes: e('decodes'), buffers: e('buffers'), sounds: e('sounds'), vibrates: e('vibrates'), resizes: e('resizes'), vis: e('vis'), dom: e('dom'), keys: e('keys'),
        longtasks: longs, loading: this.loadAt > prev, hidden: document.hidden || e('vis') > 0, from: prev, to: t,
        // GPU time / lag of the last WebGL frames before the hitch (filled in when the results arrive: gpuResult)
        glId: GP.lastId, gpu: -1, lag: -1,
      };
      h.causes = this.causes(h);
      this.list.push(h); if (this.list.length > 200) this.list.shift();
      if (!h.loading && !h.hidden) { this.count++; if (gap > this.worst) this.worst = gap; const k = h.where.split(' ')[0]; this.byCtx[k] = (this.byCtx[k] || 0) + 1; }
    },
    // a GPU measurement (GP.frame) for one of the three WebGL frames before a recent hitch
    gpuResult(d) {
      for (let i = this.list.length - 1; i >= 0 && i >= this.list.length - 6; i--) {
        const h = this.list[i];
        if (!h.glId || d.id > h.glId || d.id < h.glId - 2) continue;
        let ch = false;
        if (d.gpuMs !== undefined && d.gpuMs > h.gpu) { h.gpu = +d.gpuMs.toFixed(1); ch = true; }
        if (d.lag !== undefined && d.lag > h.lag) { h.lag = d.lag; ch = true; }
        if (ch) h.causes = this.causes(h);
      }
    },
    causes(h) {
      const c = [];
      if (h.loading) c.push('after loading');
      if (h.hidden) c.push('tab hidden / shown');
      if (h.resizes) c.push('resize ×' + h.resizes);
      if (h.shaders) c.push('shader compile ×' + h.shaders);
      if (h.texNew || h.texUp) c.push(`texture upload ×${h.texUp} (${h.texKB} KB, new ${h.texNew})`);
      if (h.bakes) c.push('part pictures drawn ×' + h.bakes);
      if (h.sprites) c.push('atlas draws ×' + h.sprites);
      if (h.gc) c.push('garbage collection? (heap -' + h.gc + ' MB)');
      if (h.decodes || h.buffers) c.push(`audio decode ×${h.decodes} / new buffers ×${h.buffers}`);
      if (h.sounds > 12) c.push('many sounds ×' + h.sounds);
      if (h.rolled > 12) c.push(`rollback (${h.rollbacks}, ${h.rolled} steps)`);
      if (h.steps > 3) c.push('catch-up steps ×' + h.steps);
      if (h.dom > 60 || h.hud > 3) c.push(`DOM changes ×${h.dom} (HUD ${h.hud} ms)`);
      if (h.vibrates) c.push('vibrate ×' + h.vibrates);
      if (h.longtasks.length) c.push('long task ' + h.longtasks.join('+') + ' ms');
      if (h.cpu > h.gap * 0.6) c.push('slow frame work (' + h.cpu + ' ms: ' + h.parts + ')');
      if (h.gpu > Math.max(16, h.gap * 0.4)) c.push('GPU busy (' + h.gpu + ' ms)');
      if (h.lag >= 3) c.push('GPU behind (' + h.lag + ' frames)');
      if (!c.length) c.push(h.cpu < 8 ? (h.gpu >= 0 ? `outside the game (browser / system; GPU ${h.gpu} ms)` : 'outside the game (browser / GPU / system)') : 'frame work ' + h.cpu + ' ms (' + h.parts + ')');
      return c;
    },
    brief(h) { return `${h.at}s ${h.gap}ms ${h.causes[0]}`; },
    text() {
      const g = ND.game, cv = document.getElementById('cv'), pc = g?.pace?.stat?.() || {}, mins = Math.max(1 / 60, (now() - this.t0) / 60000);
      const L = [];
      L.push('Shadow Duel hitch report · ' + new Date().toISOString().slice(0, 19).replace('T', ' ') + (ND.game?.renderVersion ? ' · ' + ND.game.renderVersion : ''));
      L.push('Device: ' + navigator.userAgent);
      L.push(`cores ${navigator.hardwareConcurrency || '?'} · memory ${navigator.deviceMemory || '?'} GB · dpr ${window.devicePixelRatio} · screen ${screen.width}x${screen.height} · canvas ${cv ? cv.width + 'x' + cv.height : '?'} (css ${cv ? Math.round(cv.clientWidth) + 'x' + Math.round(cv.clientHeight) : '?'})`);
      const K = ND.gfx?.knobs ? ND.gfx.knobs() : null;
      L.push(`quality ${ND.gfx?.getQuality ? ND.gfx.getQuality() : '?'} → ${ND.gfx?.active ? ND.gfx.active() : '?'}${K ? ` (scale ${K.scale} msaa ${K.msaa} glow ${K.bloom} shadows ${K.shadows} effects ${K.effects})` : ''} · renderer ${g?.rendererMode === 'gl' ? 'WebGL2' + (ND.gpuPath ? ' gpu-path' : '') : 'Canvas'} · fps cap ${pc.target || 'max'} · refresh ${pc.periodMs ? Math.round(1000 / pc.periodMs) : '?'} Hz (best ${P.hzBest || '?'}) · ${qs.has('phone') || qs.has('lowend') || qs.has('dpr') ? 'EMULATED' : 'real device'}`);
      const S = P.snap;
      L.push(`Session: ${(mins).toFixed(1)} min, ${this.frames} frames, ${this.count} hitches (${(this.count / mins).toFixed(1)}/min), worst ${Math.round(this.worst)} ms, usual frame ${this.usual().toFixed(1)} ms${S ? ` · last second: ${S.fps} fps, p95 ${S.gapP95} ms, CPU ${S.parts.TOTAL ? S.parts.TOTAL.avg : '?'} ms/frame, alloc ${S.allocKBps} KB/s` : ''}`);
      L.push('Hitches by state: ' + (Object.keys(this.byCtx).map((k) => k + ' ' + this.byCtx[k]).join(', ') || 'none'));
      const a = P.avg(10);
      if (a) L.push(`Fight average (last ${a.windows} s): ${a.fps} fps, frame ${a.gapAvg} ms, steps ${a.stepsAvg}, alloc ${a.allocKBps} KB/s; heaviest: ` + Object.keys(a.parts).filter((k) => k !== 'TOTAL').sort((x, y) => a.parts[y].avg - a.parts[x].avg).slice(0, 5).map((k) => `${k} ${a.parts[k].avg}/${a.parts[k].max}`).join(', '));
      if (a) L.push('Fight GPU: ' + (a.gpu ? (a.gpu.avg != null ? `${a.gpu.avg} ms/frame (scene ${a.gpu.scene} + post ${a.gpu.post}), worst p95 ${a.gpu.p95} ms` : 'no timer on this browser') + (a.gpu.lag != null ? `, lag ${a.gpu.lag} frames` : '') : (g?.rendererMode === 'gl' ? 'not measured yet' : 'Canvas 2D (not measured)')) + ` · CPU ${a.parts.TOTAL ? a.parts.TOTAL.avg : '?'} ms/frame`);
      L.push('');
      L.push('Last hitches (seconds since start · frame gap · state · causes):');
      for (const h of this.list.slice(-50)) {
        L.push(`${h.at}s ${h.gap}ms ${h.where} · cpu ${h.cpu} (${h.parts || '-'})${h.gpu >= 0 ? ' gpu ' + h.gpu : ''}${h.lag >= 0 ? ' lag ' + h.lag : ''} steps ${h.steps}${h.rolled ? ' rb ' + h.rolled : ''} · ${h.causes.join('; ')}`);
      }
      if (!this.list.length) L.push('(none recorded yet: play a while, then copy again)');
      return L.join('\n');
    },
  };
  // counters the recorder reads (installed only with ?perf=1)
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC && AC.prototype.decodeAudioData) { const f = AC.prototype.decodeAudioData; AC.prototype.decodeAudioData = function () { HR.ev.decodes++; return f.apply(this, arguments); }; }
    const BAC = window.BaseAudioContext;
    for (const C of [BAC, AC]) if (C && C.prototype.createBuffer && !C.prototype.createBuffer.__hr) { const f = C.prototype.createBuffer; C.prototype.createBuffer = function () { HR.ev.buffers++; return f.apply(this, arguments); }; C.prototype.createBuffer.__hr = true; }
    const SN = window.AudioScheduledSourceNode;
    if (SN && SN.prototype.start) { const f = SN.prototype.start; SN.prototype.start = function () { HR.ev.sounds++; return f.apply(this, arguments); }; }
  } catch (e) { /* no audio API */ }
  try { if (typeof navigator.vibrate === 'function') { const v = navigator.vibrate.bind(navigator); navigator.vibrate = (x) => { HR.ev.vibrates++; return v(x); }; } } catch (e) { /* read-only */ }
  window.addEventListener('resize', () => HR.ev.resizes++);
  window.addEventListener('orientationchange', () => HR.ev.resizes++);
  window.addEventListener('keydown', () => HR.ev.keys++, true);
  document.addEventListener('visibilitychange', () => HR.ev.vis++);
  try { new MutationObserver((l) => { HR.ev.dom += l.length; }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true }); } catch (e) { /* none */ }
  try {
    // (long-task entries arrive a little after the frame that recorded the hitch: they are added to it then)
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        const L = { start: e.startTime, end: e.startTime + e.duration, dur: e.duration };
        HR.long.push(L);
        for (let i = HR.list.length - 1; i >= 0 && i >= HR.list.length - 5; i--) {
          const h = HR.list[i];
          if (L.end > h.from - 5 && L.start < h.to && !h.longtasks.includes(Math.round(L.dur))) { h.longtasks.push(Math.round(L.dur)); h.causes = HR.causes(h); }
        }
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch (e) { /* no longtask API (Safari, Firefox) */ }

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
    wrap(g, 'prepareMatch', function (orig, a) { HR.loadAt = now(); return orig.apply(this, a); });
    wrap(g, 'render', function (orig, a) { const r = orig.apply(this, a); if (this.preparing) return r; if (FLUSH) { P.m('render-tail'); flush(); P.m('flush'); } P.end(); return r; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(hook, 0)); else setTimeout(hook, 0);
})(window.ND);
