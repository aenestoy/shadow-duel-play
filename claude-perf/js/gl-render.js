// Shadow Duel — WebGL2 fight renderer (opt-in: ?renderer=gl). The Canvas 2D path stays the default and the fallback.
// One frame = the game's normal drawing code (game.renderScene / renderReplay) run against a GL2D context (gl2d.js),
// then four render passes:
//   1. layers  — the two lit fighter layers and their cast-shadow silhouettes (one atlas, multisampled, resolved)
//   2. scene   — sky, arena, weather, reflections, the layers, effects, texts (multisampled, resolved)
//   3. glow    — High bloom input at 1/8 size: the same 1/4 bright pass (colour⁴ with 8-bit steps) and 2×2
//                halving as the Canvas path, blurred horizontally with its taps (black outside the picture)
//   4. present — scene + vertical blur of the glow × theme strength, film grain overlay (7%), straight into the
//                visible WebGL canvas (no copy back to Canvas 2D, drawing buffer not preserved)
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
    }
    function init() { E.init(); initPost(); }
    try { init(); } catch (e) { error = String(e && e.message || e); return null; }
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; E.lose(); glowProg = finalProg = null; glowTex = glowFb = null; });
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
    function post(scene, W, H, p) {
      const bw = Math.max(1, W >> 2), bh = Math.max(1, H >> 2), ew = Math.max(1, Math.round(bw / 2)), eh = Math.max(1, Math.round(bh / 2));
      const gw = ew + 2 * M, gh = eh + 2 * M;
      glowTarget(gw, gh);
      gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.disable(gl.STENCIL_TEST); gl.disable(gl.SCISSOR_TEST);
      gl.colorMask(true, true, true, true);
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
          const scene = E.run();
          post(scene, R.W, R.H, p);
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
      // test hook: simulate a lost context (WEBGL_lose_context)
      loseContext() { const x = loseExt(); if (x) x.loseContext(); return !!x; },
      restoreContext() { const x = loseExt(); if (x) x.restoreContext(); return !!x; },
    };
    return api;
  };
})(window.ND);
