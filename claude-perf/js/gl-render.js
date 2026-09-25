// Shadow Duel — WebGL2 fight renderer (opt-in: ?renderer=gl). The Canvas 2D path stays the default and the fallback.
// One frame = the game's normal drawing code (game.renderScene / renderReplay) run against a GL2D context (gl2d.js),
// then four render passes:
//   1. layers  — the two lit fighter layers and their cast-shadow silhouettes (one atlas, multisampled, resolved)
//   2. scene   — sky, arena, weather, reflections, the layers, effects, texts (multisampled, resolved)
//   3. glow    — High bloom input at 1/8 size: the same 1/4 bright pass (colour⁴ with 8-bit steps) and 2×2
//                halving as the Canvas path, blurred horizontally with its taps (black outside the picture)
//   4. present — scene + vertical blur of the glow × theme strength, film grain overlay (7%), straight into the
//                visible WebGL canvas (no copy back to Canvas 2D, drawing buffer not preserved)
// Medium: passes 3–4 are the light glow of game.postLite (1/4 bright pass halved to 1/8 and 1/16, stretched and
// added; no grain); Low: the resolved scene is copied to the screen as it is (no glow, no grain).
// Context loss: frames fall back to Canvas 2D until the context is restored (all GL objects are rebuilt).
window.ND = window.ND || {};
(function (ND) {
  'use strict';
  ND.createGlRenderer = function (opts = {}) {
    if (typeof ND.createGL2D !== 'function') return null;
    const canvas = opts.canvas || document.createElement('canvas');
    let gl = null;
    try {
      gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: true,
        preserveDrawingBuffer: false, powerPreference: 'high-performance', desynchronized: false });
    } catch (e) { gl = null; }
    if (!gl) return null;
    const R = ND.createGL2D(gl, { samples: opts.samples });
    const E = R.exec;
    let lost = false, error = '', checked = false, lastReason = '', frames = 0, fallbacks = 0;
    let glowProg = null, finalProg = null, grainTex = null, glowTex = null, glowFb = null, glowW = 0, glowH = 0, GU = {}, FU = {};
    const M = 10; // black margin of the glow picture (texels), as the Canvas blur
    const taps = (opts.glowTaps || []).map((t) => t.slice());
    // Canvas taps are [offset, running-mean alpha]; convert to plain normalised weights
    const W8 = (() => {
      const out = []; let rest = 1;
      for (let i = taps.length - 1; i >= 0; i--) { const a = taps[i][1]; out.unshift([taps[i][0], rest * a]); rest *= 1 - a; }
      return out;
    })();
    const q = 'floor(c*255.0+0.5)/255.0';
    const glowFS = () => {
      const lo = Math.floor(Math.min(...W8.map((t) => t[0]))), hi = Math.floor(Math.max(...W8.map((t) => t[0]))) + 1, n = hi - lo + 1;
      let sum = '';
      for (const [o, w] of W8) {
        const f = Math.floor(o), fr = o - f;
        sum += `s+=${w.toFixed(9)}*mix(b[${f - lo}],b[${f - lo + 1}],${fr.toFixed(9)});`;
      }
      return `#version 300 es
      precision highp float; precision highp int;
      uniform sampler2D u_scene; uniform vec2 u_size; uniform ivec2 u_q; uniform ivec2 u_e; uniform int u_H;
      out vec4 o;
      vec3 qz(vec3 c){ return ${q}; }
      vec3 bright(float x4, float y4){
        vec2 p = vec2((x4 + 0.5) * u_size.x / float(u_q.x), (y4 + 0.5) * u_size.y / float(u_q.y));
        vec3 c = qz(texture(u_scene, vec2(p.x / u_size.x, 1.0 - p.y / u_size.y)).rgb);
        c = qz(c * c); return qz(c * c);
      }
      vec3 b8(int ix, int iy){
        if (ix < 0 || ix >= u_e.x) return vec3(0.0);
        float sx = (float(ix) + 0.5) * float(u_q.x) / float(u_e.x) - 0.5, sy = (float(iy) + 0.5) * float(u_q.y) / float(u_e.y) - 0.5;
        float x0 = floor(sx), y0 = floor(sy), fx = sx - x0, fy = sy - y0;
        float xa = clamp(x0, 0.0, float(u_q.x - 1)), xb = clamp(x0 + 1.0, 0.0, float(u_q.x - 1));
        float ya = clamp(y0, 0.0, float(u_q.y - 1)), yb = clamp(y0 + 1.0, 0.0, float(u_q.y - 1));
        vec3 c = mix(mix(bright(xa, ya), bright(xb, ya), fx), mix(bright(xa, yb), bright(xb, yb), fx), fy);
        return qz(c);
      }
      void main(){
        int gx = int(gl_FragCoord.x) - ${M}, gy = u_H - 1 - int(gl_FragCoord.y) - ${M};
        if (gy < 0 || gy >= u_e.y) { o = vec4(0.0, 0.0, 0.0, 1.0); return; }
        vec3 b[${n}];
        for (int k = 0; k < ${n}; k++) b[k] = b8(gx + ${lo} + k, gy);
        vec3 s = vec3(0.0);
        ${sum}
        o = vec4(s, 1.0);
      }`;
    };
    const finalFS = () => {
      let sum = '';
      // a tap o rows further down the picture is o texels lower in GL orientation
      for (const [o, w] of W8) sum += `g+=${w.toFixed(9)}*texture(u_glow, vec2(gx, gy - (${o.toFixed(9)})) / u_gs).rgb;`;
      return `#version 300 es
      precision highp float; precision highp int;
      uniform sampler2D u_scene; uniform sampler2D u_glow; uniform sampler2D u_grain;
      uniform vec2 u_size; uniform vec2 u_gs; uniform vec2 u_e; uniform float u_bloom; uniform ivec2 u_off; uniform float u_grainA;
      out vec4 o;
      void main(){
        ivec2 p = ivec2(gl_FragCoord.xy);
        vec3 c = texelFetch(u_scene, p, 0).rgb;
        float dx = gl_FragCoord.x, dy = u_size.y - gl_FragCoord.y; // device position (pixel centre)
        // glow picture rect (M, M, e.x, e.y) stretched over the screen, bilinear; vertical taps here
        float gx = ${M}.0 + dx * u_e.x / u_size.x;
        float gyd = ${M}.0 + dy * u_e.y / u_size.y; // device-oriented row
        float gy = u_gs.y - gyd;                      // GL-oriented
        vec3 g = vec3(0.0);
        ${sum}
        c = min(vec3(1.0), c + g * u_bloom);
        c = ${q};
        // (kept non-negative: % of a negative int is undefined in GLSL ES; offsets are 0..127)
        ivec2 d = ivec2(int(dx) - u_off.x + 128, int(dy) - u_off.y + 128) % 128;
        float n = texelFetch(u_grain, ivec2(d.x, d.y), 0).r;
        vec3 ov = mix(2.0 * c * n, 1.0 - 2.0 * (1.0 - c) * (1.0 - n), step(vec3(0.5), c));
        o = vec4(mix(c, ov, u_grainA), 1.0);
      }`;
    };
    // Medium (game.postLite): the same 1/4 bright pass, halved twice by bilinear copies (1/8, 1/16, each stored as
    // 8-bit), then the 1/16 picture stretched over the screen and added ('lighter' × theme strength). No grain.
    const liteFS = `#version 300 es
      precision highp float; precision highp int;
      uniform sampler2D u_scene; uniform vec2 u_size; uniform ivec2 u_q; uniform ivec2 u_e8; uniform ivec2 u_e16;
      out vec4 o;
      vec3 qz(vec3 c){ return ${q}; }
      vec3 bright(float x4, float y4){
        vec2 p = vec2((x4 + 0.5) * u_size.x / float(u_q.x), (y4 + 0.5) * u_size.y / float(u_q.y));
        vec3 c = qz(texture(u_scene, vec2(p.x / u_size.x, 1.0 - p.y / u_size.y)).rgb);
        c = qz(c * c); return qz(c * c);
      }
      // bilinear copy of an a×b picture into c×d (drawImage scaling, edges clamped): source position of (ix, iy)
      vec4 src(float ix, float iy, ivec2 from, ivec2 to){
        float sx = (ix + 0.5) * float(from.x) / float(to.x) - 0.5, sy = (iy + 0.5) * float(from.y) / float(to.y) - 0.5;
        return vec4(floor(sx), floor(sy), sx - floor(sx), sy - floor(sy));
      }
      vec3 b8(float ix, float iy){
        vec4 s = src(ix, iy, u_q, u_e8);
        float xa = clamp(s.x, 0.0, float(u_q.x - 1)), xb = clamp(s.x + 1.0, 0.0, float(u_q.x - 1));
        float ya = clamp(s.y, 0.0, float(u_q.y - 1)), yb = clamp(s.y + 1.0, 0.0, float(u_q.y - 1));
        return qz(mix(mix(bright(xa, ya), bright(xb, ya), s.z), mix(bright(xa, yb), bright(xb, yb), s.z), s.w));
      }
      void main(){
        float ix = floor(gl_FragCoord.x), iy = float(u_e16.y - 1) - floor(gl_FragCoord.y);
        vec4 s = src(ix, iy, u_e8, u_e16);
        float xa = clamp(s.x, 0.0, float(u_e8.x - 1)), xb = clamp(s.x + 1.0, 0.0, float(u_e8.x - 1));
        float ya = clamp(s.y, 0.0, float(u_e8.y - 1)), yb = clamp(s.y + 1.0, 0.0, float(u_e8.y - 1));
        o = vec4(qz(mix(mix(b8(xa, ya), b8(xb, ya), s.z), mix(b8(xa, yb), b8(xb, yb), s.z), s.w)), 1.0);
      }`;
    const liteFinalFS = `#version 300 es
      precision highp float; precision highp int;
      uniform sampler2D u_scene; uniform sampler2D u_glow; uniform vec2 u_size; uniform float u_bloom;
      out vec4 o;
      void main(){
        vec3 c = texelFetch(u_scene, ivec2(gl_FragCoord.xy), 0).rgb;
        c = min(vec3(1.0), c + texture(u_glow, gl_FragCoord.xy / u_size).rgb * u_bloom);
        o = vec4(${q}, 1.0);
      }`;
    let liteProg = null, liteFinalProg = null, LU = {}, LFU = {}, liteTex = null, liteFb = null, liteW = 0, liteH = 0;
    function initPost() {
      const QVS = `#version 300 es
        layout(location=0) in vec2 a_pos; void main(){ gl_Position=vec4(a_pos,0.0,1.0); }`;
      glowProg = E.compile(QVS, glowFS());
      finalProg = E.compile(QVS, finalFS());
      GU = {}; for (const k of ['u_scene', 'u_size', 'u_q', 'u_e', 'u_H']) GU[k] = gl.getUniformLocation(glowProg, k);
      FU = {}; for (const k of ['u_scene', 'u_glow', 'u_grain', 'u_size', 'u_gs', 'u_e', 'u_bloom', 'u_off', 'u_grainA']) FU[k] = gl.getUniformLocation(finalProg, k);
      // grain: the same 128×128 picture as the Canvas pattern, rows top to bottom
      const g = opts.grain;
      grainTex = E.tex2d(128, 128, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST, null);
      if (g) { gl.bindTexture(gl.TEXTURE_2D, grainTex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, g); }
      glowTex = null; glowFb = null; glowW = glowH = 0;
      liteProg = E.compile(QVS, liteFS);
      liteFinalProg = E.compile(QVS, liteFinalFS);
      LU = {}; for (const k of ['u_scene', 'u_size', 'u_q', 'u_e8', 'u_e16']) LU[k] = gl.getUniformLocation(liteProg, k);
      LFU = {}; for (const k of ['u_scene', 'u_glow', 'u_size', 'u_bloom']) LFU[k] = gl.getUniformLocation(liteFinalProg, k);
      liteTex = null; liteFb = null; liteW = liteH = 0;
    }
    function init() { E.init(); initPost(); }
    try { init(); } catch (e) { error = String(e && e.message || e); return null; }
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; E.lose(); queries.length = fences.length = 0; tq = null; tqx = undefined; glowProg = finalProg = liteProg = liteFinalProg = null; glowTex = glowFb = liteTex = liteFb = null; });
    canvas.addEventListener('webglcontextrestored', () => {
      try { init(); lost = false; checked = false; } catch (e) { error = String(e && e.message || e); }
    });
    function glowTarget(w, h) {
      if (glowTex && glowW === w && glowH === h) return;
      if (glowTex) { gl.deleteTexture(glowTex); gl.deleteFramebuffer(glowFb); }
      glowTex = E.tex2d(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR, null);
      glowFb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, glowFb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, glowTex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      glowW = w; glowH = h;
    }
    function liteTarget(w, h) {
      if (liteTex && liteW === w && liteH === h) return;
      if (liteTex) { gl.deleteTexture(liteTex); gl.deleteFramebuffer(liteFb); }
      liteTex = E.tex2d(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR, null);
      liteFb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, liteFb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, liteTex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      liteW = w; liteH = h;
    }
    // p.mode: 2 High (glow + grain), 1 Medium (light glow), 0 Low (the scene as it is)
    function post(scene, W, H, p) {
      gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.disable(gl.STENCIL_TEST); gl.disable(gl.SCISSOR_TEST);
      gl.colorMask(true, true, true, true);
      const mode = p.mode == null ? 2 : p.mode;
      if (mode === 0) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, E.targets[1].fbTex); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        return;
      }
      if (mode === 1) {
        const w4 = Math.max(1, W >> 2), h4 = Math.max(1, H >> 2), w8 = Math.max(1, w4 >> 1), h8 = Math.max(1, h4 >> 1), w16 = Math.max(1, w8 >> 1), h16 = Math.max(1, h8 >> 1);
        liteTarget(w16, h16);
        gl.bindFramebuffer(gl.FRAMEBUFFER, liteFb); gl.viewport(0, 0, w16, h16);
        gl.useProgram(liteProg);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene);
        gl.uniform1i(LU.u_scene, 0); gl.uniform2f(LU.u_size, W, H); gl.uniform2i(LU.u_q, w4, h4); gl.uniform2i(LU.u_e8, w8, h8); gl.uniform2i(LU.u_e16, w16, h16);
        E.quad();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
        gl.useProgram(liteFinalProg);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, liteTex);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene);
        gl.uniform1i(LFU.u_scene, 0); gl.uniform1i(LFU.u_glow, 1); gl.uniform2f(LFU.u_size, W, H); gl.uniform1f(LFU.u_bloom, p.bloom);
        E.quad();
        return;
      }
      const bw = Math.max(1, W >> 2), bh = Math.max(1, H >> 2), ew = Math.max(1, Math.round(bw / 2)), eh = Math.max(1, Math.round(bh / 2));
      const gw = ew + 2 * M, gh = eh + 2 * M;
      glowTarget(gw, gh);
      // pass 3: glow
      gl.bindFramebuffer(gl.FRAMEBUFFER, glowFb); gl.viewport(0, 0, gw, gh);
      gl.useProgram(glowProg);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene);
      gl.uniform1i(GU.u_scene, 0); gl.uniform2f(GU.u_size, W, H); gl.uniform2i(GU.u_q, bw, bh); gl.uniform2i(GU.u_e, ew, eh); gl.uniform1i(GU.u_H, gh);
      E.quad();
      // pass 4: present
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
      gl.useProgram(finalProg);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, glowTex);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, grainTex);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(FU.u_scene, 0); gl.uniform1i(FU.u_glow, 1); gl.uniform1i(FU.u_grain, 2);
      gl.uniform2f(FU.u_size, W, H); gl.uniform2f(FU.u_gs, gw, gh); gl.uniform2f(FU.u_e, ew, eh);
      gl.uniform1f(FU.u_bloom, p.bloom); gl.uniform2i(FU.u_off, p.grainX | 0, p.grainY | 0); gl.uniform1f(FU.u_grainA, p.grain === false ? 0 : 0.07);
      E.quad();
    }
    // GPU timing (only while profiling): a timer query around each frame's GL work when the browser offers
    // EXT_disjoint_timer_query_webgl2, and a fence per frame (how many frames later the GPU had finished it; a GPU
    // that falls behind shows up here even without timer queries). Results arrive a few frames late: gpuDrain().
    let frameId = 0, tqx, tq = null;
    const queries = [], fences = [], gpuDone = [];
    function gpuPoll() {
      while (queries.length) {
        const q = queries[0];
        if (!gl.getQueryParameter(q.q, gl.QUERY_RESULT_AVAILABLE)) break;
        const disjoint = gl.getParameter(tqx.GPU_DISJOINT_EXT);
        gpuDone.push({ id: q.id, gpuMs: disjoint ? -1 : gl.getQueryParameter(q.q, gl.QUERY_RESULT) / 1e6 });
        gl.deleteQuery(q.q); queries.shift();
      }
      while (fences.length) {
        const f = fences[0];
        if (gl.getSyncParameter(f.s, gl.SYNC_STATUS) !== gl.SIGNALED) break;
        gpuDone.push({ id: f.id, lag: frameId - f.id, lagMs: performance.now() - f.t });
        gl.deleteSync(f.s); fences.shift();
      }
      if (gpuDone.length > 600) gpuDone.splice(0, gpuDone.length - 600);
    }
    function gpuBegin() {
      if (tqx === undefined) tqx = gl.getExtension('EXT_disjoint_timer_query_webgl2') || null;
      gpuPoll();
      if (tqx && queries.length < 8) { tq = gl.createQuery(); gl.beginQuery(tqx.TIME_ELAPSED_EXT, tq); }
    }
    function gpuEnd() {
      if (tq) { gl.endQuery(tqx.TIME_ELAPSED_EXT); queries.push({ q: tq, id: frameId }); tq = null; }
      if (fences.length < 8) { const f = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); if (f) fences.push({ s: f, id: frameId, t: performance.now() }); }
    }
    function gpuReset() {
      for (const q of queries) gl.deleteQuery(q.q);
      for (const f of fences) gl.deleteSync(f.s);
      queries.length = fences.length = gpuDone.length = 0; tq = null;
    }
    // (the extension object must be taken while the context is alive: a lost context hands out no extensions)
    let loseX = null;
    const loseExt = () => loseX || (loseX = gl.isContextLost() ? null : gl.getExtension('WEBGL_lose_context'));
    const api = {
      canvas, gl, R,
      get ready() { return !lost && !error && !gl.isContextLost() && E.ready; },
      get error() { return error; },
      get lastReason() { return lastReason; },
      // main context for a W×H frame (the canvas backing size)
      begin(W, H) {
        if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
        return R.begin(W, H);
      },
      // p: { bloom, grainX, grainY, grain }. false = nothing was shown (the caller draws this frame with Canvas 2D)
      end(p) {
        const rec = R.finish();
        if (R.unsupported) { lastReason = R.unsupported; fallbacks++; return false; }
        if (lost || gl.isContextLost()) { lastReason = 'context lost'; fallbacks++; return false; }
        try {
          const P = R.prof, t0 = P ? performance.now() : 0;
          frameId++;
          if (P) gpuBegin();
          const scene = E.run();
          const t1 = P ? performance.now() : 0;
          post(scene, R.W, R.H, p);
          if (P) { gpuEnd(); P.postMs = performance.now() - t1; P.endMs = performance.now() - t0; P.frameId = frameId; }
          if (!checked) { const code = gl.getError(); if (code !== gl.NO_ERROR) throw Error('GL error ' + code); checked = true; }
          frames++;
          api.last = Object.assign({}, rec, R.stats);
          return true;
        } catch (e) {
          error = String(e && e.message || e); lastReason = error; fallbacks++;
          return false;
        }
      },
      fail(e) { lastReason = String(e && e.message || e); fallbacks++; },
      info() {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        return {
          renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
          vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
          version: gl.getParameter(gl.VERSION), ...R.info(), memory: R.memory(),
        };
      },
      status() { return { ready: api.ready, error, lastReason, frames, fallbacks, samples: E.samples }; },
      setSamples(n) { E.setSamples(n); },
      // per-frame timings and upload causes (render-check page, ?perf=1): api.prof after each end()
      profile(on, o) { R.profile(on, o); if (!on) gpuReset(); },
      // finished GPU measurements since the last call: [{ id, gpuMs } | { id, lag, lagMs }] (id = prof.frameId)
      gpuDrain() { if (!gl.isContextLost()) gpuPoll(); return gpuDone.splice(0, gpuDone.length); },
      get gpuTimer() { return !!tqx; },
      get prof() { return R.prof; },
      // test hook: simulate a lost context (WEBGL_lose_context)
      loseContext() { const x = loseExt(); if (x) x.loseContext(); return !!x; },
      restoreContext() { const x = loseExt(); if (x) x.restoreContext(); return !!x; },
    };
    return api;
  };
})(window.ND);
