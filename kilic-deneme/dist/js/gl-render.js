

















window.ND = window.ND || {};
(function (ND) {
  'use strict';
  ND.createGlRenderer = function (opts = {}) {
    if (typeof ND.createGL2D !== 'function') return null;
    const canvas = opts.canvas || document.createElement('canvas');
    let gl = null;
    try {


      gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: true,
        preserveDrawingBuffer: false, powerPreference: 'high-performance', desynchronized: false, failIfMajorPerformanceCaveat: !!opts.auto });
    } catch (e) { gl = null; }
    if (!gl) return null;



    if (opts.auto) {
      let name = '';
      try { const x = gl.getExtension('WEBGL_debug_renderer_info'); name = String(gl.getParameter(x ? x.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || ''); } catch (e) { name = ''; }
      if (/SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(name)) { try { const l = gl.getExtension('WEBGL_lose_context'); if (l) l.loseContext(); } catch (e) {            } return null; }
    }
    const R = ND.createGL2D(gl, { samples: opts.samples, textAtlas: opts.textAtlas });
    const E = R.exec;
    let lost = false, error = '', checked = false, lastReason = '', frames = 0, fallbacks = 0, streak = 0;

    const MAX_STREAK = opts.auto ? 180 : Infinity;
    const refuse = (why) => { lastReason = why; fallbacks++; if (++streak >= MAX_STREAK && !error) error = 'switched off: ' + streak + ' frames in a row fell back (' + why + ')'; return false; };
    let glowProg = null, finalProg = null, grainTex = null, glowTex = null, glowFb = null, glowW = 0, glowH = 0, GU = {}, FU = {};
    const M = 10;
    const taps = (opts.glowTaps || []).map((t) => t.slice());

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


    const finalFS = (small) => {
      let sum = '';

      if (small) sum = 'g=texture(u_glow, vec2(gx, gy) / u_gs).rgb;';
      else for (const [o, w] of W8) sum += `g+=${w.toFixed(9)}*texture(u_glow, vec2(gx, gy - (${o.toFixed(9)})) / u_gs).rgb;`;
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

    const vblurFS = () => {
      let sum = '';
      for (const [o, w] of W8) sum += `g+=${w.toFixed(9)}*texture(u_glow, vec2(p.x, p.y - (${o.toFixed(9)})) / u_gs).rgb;`;
      return `#version 300 es
      precision highp float; precision highp int;
      uniform sampler2D u_glow; uniform vec2 u_gs;
      out vec4 o;
      void main(){
        vec2 p = gl_FragCoord.xy; vec3 g = vec3(0.0);
        ${sum}
        o = vec4(g, 1.0);
      }`;
    };


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
    let smallProg = null, vblurProg = null, SU = {}, VU = {}, glow2Tex = null, glow2Fb = null;
    let liteProg = null, liteFinalProg = null, LU = {}, LFU = {}, liteTex = null, liteFb = null, liteW = 0, liteH = 0;
    function initPost() {
      const QVS = `#version 300 es
        layout(location=0) in vec2 a_pos; void main(){ gl_Position=vec4(a_pos,0.0,1.0); }`;
      glowProg = E.compile(QVS, glowFS());
      finalProg = E.compile(QVS, finalFS(false));
      smallProg = E.compile(QVS, finalFS(true));
      vblurProg = E.compile(QVS, vblurFS());
      SU = {}; for (const k of ['u_scene', 'u_glow', 'u_grain', 'u_size', 'u_gs', 'u_e', 'u_bloom', 'u_off', 'u_grainA']) SU[k] = gl.getUniformLocation(smallProg, k);
      VU = { u_glow: gl.getUniformLocation(vblurProg, 'u_glow'), u_gs: gl.getUniformLocation(vblurProg, 'u_gs') };
      glow2Tex = null; glow2Fb = null;
      GU = {}; for (const k of ['u_scene', 'u_size', 'u_q', 'u_e', 'u_H']) GU[k] = gl.getUniformLocation(glowProg, k);
      FU = {}; for (const k of ['u_scene', 'u_glow', 'u_grain', 'u_size', 'u_gs', 'u_e', 'u_bloom', 'u_off', 'u_grainA']) FU[k] = gl.getUniformLocation(finalProg, k);

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
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; E.lose(); inflight.length = 0; queries.length = fences.length = 0; tq = tq2 = null; tqx = undefined; glowProg = finalProg = liteProg = liteFinalProg = smallProg = vblurProg = null; glowTex = glowFb = liteTex = liteFb = glow2Tex = glow2Fb = null; });
    canvas.addEventListener('webglcontextrestored', () => {
      try { init(); lost = false; checked = false; streak = 0; } catch (e) { error = String(e && e.message || e); return; }
      if (!api.selfCheck()) console.info('[ND.gl] WebGL2 self-check failed after a context restore; drawing with Canvas 2D', error);
    });
    function glowTarget(w, h, small) {
      if (small && !glow2Tex && glowTex && glowW === w && glowH === h) glowW = 0;
      if (glowTex && glowW === w && glowH === h) return;
      if (glowTex) { gl.deleteTexture(glowTex); gl.deleteFramebuffer(glowFb); }
      if (glow2Tex) { gl.deleteTexture(glow2Tex); gl.deleteFramebuffer(glow2Fb); glow2Tex = glow2Fb = null; }
      if (small) {
        glow2Tex = E.tex2d(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR, null);
        glow2Fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, glow2Fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, glow2Tex, 0);
      }
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
      const small = !!p.smallBlur;
      glowTarget(gw, gh, small);

      gl.bindFramebuffer(gl.FRAMEBUFFER, glowFb); gl.viewport(0, 0, gw, gh);
      gl.useProgram(glowProg);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene);
      gl.uniform1i(GU.u_scene, 0); gl.uniform2f(GU.u_size, W, H); gl.uniform2i(GU.u_q, bw, bh); gl.uniform2i(GU.u_e, ew, eh); gl.uniform1i(GU.u_H, gh);
      E.quad();

      if (small) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, glow2Fb);
        gl.useProgram(vblurProg);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, glowTex);
        gl.uniform1i(VU.u_glow, 0); gl.uniform2f(VU.u_gs, gw, gh);
        E.quad();
      }

      const FP = small ? SU : FU;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
      gl.useProgram(small ? smallProg : finalProg);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, small ? glow2Tex : glowTex);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, grainTex);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(FP.u_scene, 0); gl.uniform1i(FP.u_glow, 1); gl.uniform1i(FP.u_grain, 2);
      gl.uniform2f(FP.u_size, W, H); gl.uniform2f(FP.u_gs, gw, gh); gl.uniform2f(FP.u_e, ew, eh);
      gl.uniform1f(FP.u_bloom, p.bloom); gl.uniform2i(FP.u_off, p.grainX | 0, p.grainY | 0); gl.uniform1f(FP.u_grainA, p.grain === false ? 0 : 0.07);
      E.quad();
    }





    let frameId = 0, tqx, tq = null, tq2 = null;
    const queries = [], fences = [], gpuDone = [];
    function gpuPoll() {
      while (queries.length) {
        const q = queries[0];
        if (!gl.getQueryParameter(q.q2 || q.q, gl.QUERY_RESULT_AVAILABLE)) break;
        const disjoint = gl.getParameter(tqx.GPU_DISJOINT_EXT);
        const a = disjoint ? -1 : gl.getQueryParameter(q.q, gl.QUERY_RESULT) / 1e6, b = disjoint || !q.q2 ? 0 : gl.getQueryParameter(q.q2, gl.QUERY_RESULT) / 1e6;
        gpuDone.push({ id: q.id, gpuMs: disjoint ? -1 : a + b, sceneMs: a, postMs: disjoint ? -1 : b });
        gl.deleteQuery(q.q); if (q.q2) gl.deleteQuery(q.q2); queries.shift();
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

      if (tq) { gl.endQuery(tqx.TIME_ELAPSED_EXT); gl.deleteQuery(tq); if (tq2) gl.deleteQuery(tq2); tq = tq2 = null; }
      if (tqx && queries.length < 8) { tq = gl.createQuery(); gl.beginQuery(tqx.TIME_ELAPSED_EXT, tq); }
    }
    function gpuMid() {
      if (!tq) return;
      gl.endQuery(tqx.TIME_ELAPSED_EXT);
      tq2 = gl.createQuery(); gl.beginQuery(tqx.TIME_ELAPSED_EXT, tq2);
    }
    function gpuEnd() {
      if (tq) { gl.endQuery(tqx.TIME_ELAPSED_EXT); queries.push({ q: tq, q2: tq2, id: frameId }); tq = tq2 = null; }
      if (fences.length < 8) { const f = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); if (f) fences.push({ s: f, id: frameId, t: performance.now() }); }
    }
    function gpuReset() {
      if (tq) { try { gl.endQuery(tqx.TIME_ELAPSED_EXT); } catch (e) {                  } gl.deleteQuery(tq); if (tq2) gl.deleteQuery(tq2); }
      for (const q of queries) { gl.deleteQuery(q.q); if (q.q2) gl.deleteQuery(q.q2); }
      for (const f of fences) gl.deleteSync(f.s);
      queries.length = fences.length = gpuDone.length = 0; tq = tq2 = null;
    }

    let loseX = null, settleFence = null;

    const inflight = [];
    function queued() {
      while (inflight.length && gl.getSyncParameter(inflight[0], gl.SYNC_STATUS) === gl.SIGNALED) gl.deleteSync(inflight.shift());
      return inflight.length;
    }
    const loseExt = () => loseX || (loseX = gl.isContextLost() ? null : gl.getExtension('WEBGL_lose_context'));
    const api = {
      canvas, gl, R,
      get ready() { return !lost && !error && !gl.isContextLost() && E.ready; },
      get error() { return error; },
      get lastReason() { return lastReason; },

      begin(W, H) {
        if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
        return R.begin(W, H);
      },

      end(p) {
        const rec = R.finish();
        if (R.unsupported) return refuse(R.unsupported);
        if (lost || gl.isContextLost()) { lastReason = 'context lost'; fallbacks++; return false; }
        try {
          const P = R.prof, t0 = P ? performance.now() : 0;
          frameId++;
          if (P) gpuBegin();
          const scene = E.run();
          if (P) gpuMid();
          const t1 = P ? performance.now() : 0;
          post(scene, R.W, R.H, p);
          if (P) { gpuEnd(); P.postMs = performance.now() - t1; P.endMs = performance.now() - t0; P.frameId = frameId; }
          if (api.queueLimit > 0 && inflight.length < 16) { const f = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); if (f) inflight.push(f); }
          if (!checked) { const code = gl.getError(); if (code !== gl.NO_ERROR) throw Error('GL error ' + code); checked = true; }
          frames++; streak = 0;
          api.last = Object.assign({}, rec, R.stats);

          const T = E.targets, pm = p.mode == null ? 2 : p.mode;
          api.last.targets = [T[0] && R.stats.passes > 1 ? [T[0].w, T[0].h, T[0].samples] : null, T[1] ? [T[1].w, T[1].h, T[1].samples] : null];
          api.last.postPasses = pm === 2 ? (p.smallBlur ? 3 : 2) : pm === 1 ? 2 : 1;
          return true;
        } catch (e) {
          error = String(e && e.message || e); lastReason = error; fallbacks++;
          return false;
        }
      },
      fail(e) { refuse(String(e && e.message || e)); },



      selfCheck() {
        if (error) return false;
        if (lost || gl.isContextLost()) return true;
        try {
          const W = 64, H = 32, c = api.begin(W, H);
          c.setTransform(1, 0, 0, 1, 0, 0);
          c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
          c.fillStyle = '#ff0000'; c.fillRect(0, 0, 16, 16);
          c.fillStyle = '#00ff00'; c.beginPath(); c.moveTo(16, 0); c.lineTo(32, 16); c.lineTo(32, 0); c.lineTo(16, 16); c.closePath(); c.fill();
          const L = c.layer(16, 16, 'selfcheck');
          if (!L) throw Error('no layer');
          L.ctx.fillStyle = '#0000ff'; L.ctx.fillRect(0, 0, 16, 16);
          c.drawImage(L, 0, 0, 16, 16, 32, 0, 16, 16);
          const gr = c.createLinearGradient(48, 0, 64, 0); gr.addColorStop(0, '#ffff00'); gr.addColorStop(1, '#ffff00');
          c.fillStyle = gr; c.fillRect(48, 0, 16, 16);
          const pic = document.createElement('canvas'); pic.width = pic.height = 4;
          const px2 = pic.getContext('2d'); px2.fillStyle = '#ff00ff'; px2.fillRect(0, 0, 4, 4);
          c.drawImage(pic, 0, 16, 16, 16);
          if (!api.end({ mode: 2, bloom: 0, grainX: 0, grainY: 0, grain: false })) throw Error(lastReason || 'frame refused');
          const px = new Uint8Array(4);
          const want = [[8, 8, 255, 0, 0], [18, 8, 0, 255, 0], [30, 8, 0, 255, 0], [24, 2, 0, 0, 0], [40, 8, 0, 0, 255], [56, 8, 255, 255, 0], [8, 24, 255, 0, 255], [40, 24, 0, 0, 0]];
          for (const [x, y, r, g, b] of want) {
            gl.readPixels(x, H - 1 - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
            if (Math.abs(px[0] - r) > 8 || Math.abs(px[1] - g) > 8 || Math.abs(px[2] - b) > 8) throw Error(`pixel ${x},${y} is ${px[0]},${px[1]},${px[2]}, expected ${r},${g},${b}`);
          }
          const code = gl.getError();
          if (code !== gl.NO_ERROR) throw Error('GL error ' + code);
          frames = 0; fallbacks = 0; streak = 0; lastReason = '';
          return true;
        } catch (e) {
          if (lost || gl.isContextLost()) return true;
          error = 'self-check: ' + String(e && e.message || e); lastReason = error;
          return false;
        }
      },

      dispose() { error = error || 'disposed'; try { loseExt()?.loseContext(); } catch (e) {                       } canvas.remove?.(); },
      info() {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        return {
          renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
          vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
          version: gl.getParameter(gl.VERSION), ...R.info(), memory: R.memory(),
        };
      },
      status() { return { ready: api.ready, error, lastReason, frames, fallbacks, streak, samples: E.samples, auto: !!opts.auto }; },
      setSamples(n) { E.setSamples(n); },




      queueLimit: 0,
      queued() { if (lost || gl.isContextLost()) { inflight.length = 0; return 0; } return queued(); },
      settle() {
        if (lost || gl.isContextLost()) { settleFence = null; return true; }
        if (!settleFence) { settleFence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush(); return !settleFence; }
        if (gl.getSyncParameter(settleFence, gl.SYNC_STATUS) !== gl.SIGNALED) return false;
        gl.deleteSync(settleFence); settleFence = null;
        return true;
      },

      setLayerSamples(n) { E.setLayerSamples(n); },

      profile(on, o) { R.profile(on, o); if (!on) gpuReset(); },


      gpuDrain() { if (!gl.isContextLost()) gpuPoll(); return gpuDone.splice(0, gpuDone.length); },
      get gpuTimer() { return !!tqx; },
      get prof() { return R.prof; },

      loseContext() { const x = loseExt(); if (x) x.loseContext(); return !!x; },
      restoreContext() { const x = loseExt(); if (x) x.restoreContext(); return !!x; },
    };
    return api;
  };
})(window.ND);
