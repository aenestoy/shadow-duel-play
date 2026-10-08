












(function (root) {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  function rgb2lab(r, g, b) {
    r = lin(r); g = lin(g); b = lin(b);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  }
  function lab2rgb(L, a, b) {
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3), s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
    return [gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), gam(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)];
  }
  const hexLab = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return null; const v = parseInt(m[1], 16); return rgb2lab(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255); };




  const one = (h) => { const c = hexLab(h); return c ? [[c[0] * 0.72, c[1] * 0.9, c[2] * 0.9], c, [c[0] + (1 - c[0]) * 0.3, c[1] * 0.9, c[2] * 0.9]] : null; };
  const two = (mid, dark) => { const m = hexLab(mid); if (!m) return null; const d = hexLab(dark) || [m[0] * 0.72, m[1] * 0.9, m[2] * 0.9]; return [d, m, [clamp(m[0] + 0.6 * (m[0] - d[0]), 0, 1), m[1], m[2]]]; };
  const three = (mid, dark, hi) => { const s = two(mid, dark); const h = hexLab(hi); if (s && h) s[2] = h; return s; };
  function stops(c, key) {
    if (!c) return null;
    switch (key) {
      case 'cloth': return three(c.cloth, c.clothDark, c.clothHi);
      case 'hakama': return c.hakama ? two(c.hakama, c.hakamaDark) : stops(c, 'cloth');
      case 'wrap': return two(c.wrap, c.wrapDark);
      case 'accent': return two(c.accent, c.accentDark);
      case 'haori': return c.haori ? one(c.haori) : stops(c, 'cloth');
      case 'hood': return c.hood ? three(c.hood.cloth, c.hood.clothDark, c.hood.clothHi) : stops(c, 'hakama');
      case 'armor': return c.armor ? one(c.armor) : stops(c, 'cloth');
      case 'mask': return c.mask ? one(c.mask) : stops(c, 'accent');
      case 'glove': return c.glove ? one(c.glove) : stops(c, 'wrap');
      case 'tabi': return c.tabi ? one(c.tabi) : one(c.wrapDark);
      case 'clothDark': return one(c.clothDark);
      case 'clothHi': return one(c.clothHi);
      case 'wrapDark': return one(c.wrapDark);
      case 'accentDark': return one(c.accentDark);
      case 'ui': return one(c.ui);
      default: return null;
    }
  }
  const same = (A, B) => !!A && !!B && A.every((s, k) => Math.abs(s[0] - B[k][0]) + Math.abs(s[1] - B[k][1]) + Math.abs(s[2] - B[k][2]) < 1e-5);


  const lev = (x, b, t) => (t <= b ? (b > 1e-4 ? (x * t) / b : t) : b < 1 - 1e-4 ? 1 - ((1 - x) * (1 - t)) / (1 - b) : t);

  const MAXS = 12, SMIN = 0.5;



  function plan(meta, base, col) {
    if (!meta || !col || col === base) return null;
    const P = new Float32Array(MAXS * 16);
    let any = false;
    meta.slots.forEach((s, k) => {
      if (k + 1 >= MAXS || !s.n) return;
      const S = stops(base, s.key), T = stops(col, s.key);
      if (!S || !T || same(S, T)) return;
      any = true;
      const o = (k + 1) * 16;
      const sl = s.L.slice();
      sl[1] = Math.max(sl[1], sl[0] + 0.01); sl[2] = Math.max(sl[2], sl[1] + 0.01);




      const t1 = s.mode === 'abs' ? T[1][0] : lev(sl[1], S[1][0], T[1][0]);
      const ls = t1 <= sl[1] ? t1 / Math.max(sl[1], 1e-3) : (1 - t1) / Math.max(1 - sl[1], 1e-3);
      const slope = clamp(Math.max(ls, s.smin ?? SMIN), 0, 1);


      const cs = Math.hypot(s.a, s.b), ct = Math.hypot(T[1][1], T[1][2]);
      const kc = clamp((ct + 0.02) / (cs + 0.02), 0.15, 1);
      P.set([sl[0], sl[1], sl[2], 1, t1, slope, 0, kc, T[0][1], T[0][2], T[1][1], T[1][2], T[2][1], T[2][2], s.a, s.b], o);
    });
    return any ? P : null;
  }

  const planKey = (P) => { if (!P) return ''; let s = ''; for (let i = 0; i < P.length; i++) s += P[i] ? i + ':' + P[i].toFixed(4) + ';' : ''; return s; };


  const VS = `#version 300 es
void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
  const FS = `#version 300 es
precision highp float; precision highp int;
uniform sampler2D uSrc, uMap; uniform vec4 uP[${MAXS * 4}]; uniform vec2 uK, uSz; uniform int uLv;
out vec4 o;
float lin(float c){ return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4); }
float gam(float c){ c = clamp(c, 0.0, 1.0); return c <= 0.0031308 ? 12.92 * c : 1.055 * pow(c, 1.0 / 2.4) - 0.055; }
vec3 toLab(vec3 c){
  c = vec3(lin(c.r), lin(c.g), lin(c.b));
  vec3 lms = vec3(0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b, 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b, 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b);
  lms = pow(max(lms, vec3(0.0)), vec3(1.0 / 3.0));
  return vec3(0.2104542553 * lms.x + 0.793617785 * lms.y - 0.0040720468 * lms.z, 1.9779984951 * lms.x - 2.428592205 * lms.y + 0.4505937099 * lms.z, 0.0259040371 * lms.x + 0.7827717662 * lms.y - 0.808675766 * lms.z);
}
vec3 toRgb(vec3 q){
  vec3 lms = vec3(q.x + 0.3963377774 * q.y + 0.2158037573 * q.z, q.x - 0.1055613458 * q.y - 0.0638541728 * q.z, q.x - 0.0894841775 * q.y - 1.291485548 * q.z);
  lms = lms * lms * lms;
  return vec3(gam(4.0767416621 * lms.x - 3.3077115913 * lms.y + 0.2309699292 * lms.z), gam(-1.2684380046 * lms.x + 2.6097574011 * lms.y - 0.3413193965 * lms.z), gam(-0.0041960863 * lms.x - 0.7034186147 * lms.y + 1.707614701 * lms.z));
}
vec3 shift(vec3 c, vec3 q, int s){
  if (s <= 0 || s >= ${MAXS}) return c;
  vec4 A = uP[s * 4], B = uP[s * 4 + 1], C = uP[s * 4 + 2], D = uP[s * 4 + 3];
  if (A.w < 0.5) return c;
  // lightness along the region's line (plan), hue / chroma from the palette's three levels by where the texel sits
  // in the painting's own dark / mid / light spread
  float L = q.x, Ln = B.x + (L - A.y) * B.y;
  float u = L < A.y ? clamp((L - A.x) / max(A.y - A.x, 1e-4), 0.0, 1.0) : 1.0 + clamp((L - A.y) / max(A.z - A.y, 1e-4), 0.0, 1.0);
  vec2 ab = u < 1.0 ? mix(C.xy, C.zw, u) : mix(C.zw, D.xy, u - 1.0);
  // (the painting's own hue variation, weaker where the costume is darker: chroma goes with lightness)
  // (bounded: a texel far from the region's own hue - a bead or a speck that fell into it - must not flip to the
  // opposite hue, it only keeps a little of its difference)
  vec2 r = q.yz - D.zw; r *= min(1.0, 0.035 / max(length(r), 1e-4));
  ab += r * B.w * clamp(Ln / max(L, 1e-3), 0.0, 1.0);
  return toRgb(vec3(clamp(Ln, 0.0, 1.0), ab));
}
void main(){
  // level uLv of the costume texture: the model's own picture at that level (its filtered colour, as the model has it),
  // shifted by the region under the texel's middle - so at a distance two charts packed side by side mix as they do in
  // the painting, never as two different costume colours (that drew light cracks along the charts' seams)
  int k = 1 << uLv;
  ivec2 p = ivec2(gl_FragCoord.xy) * k + ivec2(k >> 1);
  vec3 m = texelFetch(uMap, ivec2(vec2(p) * uK), 0).rgb * 255.0;
  vec3 c = uLv == 0 ? texelFetch(uSrc, p, 0).rgb : textureLod(uSrc, vec2(p) / uSz, float(uLv)).rgb;
  int a = int(m.r + 0.5), b = int(m.g + 0.5); float w = m.b / 255.0;
  if (a == 0 && b == 0) { o = vec4(c, 1.0); return; }
  vec3 q = toLab(c);
  o = vec4(mix(shift(c, q, b), shift(c, q, a), w), 1.0);
}`;
  const PROG = new WeakMap();
  function prog(gl) {
    let P = PROG.get(gl);
    if (P) return P;
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error('r3d-costume: ' + gl.getShaderInfoLog(x)); return x; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('r3d-costume: ' + gl.getProgramInfoLog(p));
    P = { p, uSrc: gl.getUniformLocation(p, 'uSrc'), uMap: gl.getUniformLocation(p, 'uMap'), uP: gl.getUniformLocation(p, 'uP'), uK: gl.getUniformLocation(p, 'uK'), uSz: gl.getUniformLocation(p, 'uSz'), uLv: gl.getUniformLocation(p, 'uLv'), vao: gl.createVertexArray() };
    PROG.set(gl, P);
    return P;
  }

  function mapTex(gl, img) {
    const t = gl.createTexture(), a0 = gl.getParameter(gl.ACTIVE_TEXTURE);
    gl.activeTexture(gl.TEXTURE5);
    const b0 = gl.getParameter(gl.TEXTURE_BINDING_2D);
    gl.bindTexture(gl.TEXTURE_2D, t);
    const ps = [gl.UNPACK_FLIP_Y_WEBGL, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, gl.UNPACK_COLORSPACE_CONVERSION_WEBGL].map((k) => [k, gl.getParameter(k)]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
    for (const [k, v] of ps) gl.pixelStorei(k, v);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    gl.bindTexture(gl.TEXTURE_2D, b0); gl.activeTexture(a0);
    return t;
  }


  function bake(gl, src, w, h, map, mw, mh, P, aniso) {
    const S = prog(gl);
    const st = {
      fb: gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING), rfb: gl.getParameter(gl.READ_FRAMEBUFFER_BINDING), vp: gl.getParameter(gl.VIEWPORT), pr: gl.getParameter(gl.CURRENT_PROGRAM),
      va: gl.getParameter(gl.VERTEX_ARRAY_BINDING), at: gl.getParameter(gl.ACTIVE_TEXTURE), cm: gl.getParameter(gl.COLOR_WRITEMASK),
      en: [gl.BLEND, gl.DEPTH_TEST, gl.CULL_FACE, gl.SCISSOR_TEST, gl.STENCIL_TEST, gl.SAMPLE_ALPHA_TO_COVERAGE, gl.RASTERIZER_DISCARD].map((e) => [e, gl.isEnabled(e)]),
    };
    const tb = {};
    for (const u of [5, 6, 7]) { gl.activeTexture(gl.TEXTURE0 + u); tb[u] = gl.getParameter(gl.TEXTURE_BINDING_2D); }
    const out = gl.createTexture();
    gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, out);
    const NL = Math.floor(Math.log2(Math.max(w, h))) + 1;
    gl.texStorage2D(gl.TEXTURE_2D, NL, gl.RGBA8, w, h);
    gl.bindTexture(gl.TEXTURE_2D, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    let ok = true;
    for (const [e] of st.en) gl.disable(e);
    gl.colorMask(true, true, true, true);
    gl.useProgram(S.p);
    gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, src);
    gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, map);
    gl.uniform1i(S.uSrc, 5); gl.uniform1i(S.uMap, 6); gl.uniform4fv(S.uP, P); gl.uniform2f(S.uK, mw / w, mh / h); gl.uniform2f(S.uSz, w, h);
    gl.bindVertexArray(S.vao);


    for (let lv = 0; lv < NL && ok; lv++) {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, out, lv);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) { ok = false; break; }
      gl.viewport(0, 0, Math.max(1, w >> lv), Math.max(1, h >> lv));
      gl.uniform1i(S.uLv, lv);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
    if (ok) {
      gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, out);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.ext.TEXTURE_MAX_ANISOTROPY_EXT, aniso.n);
    } else gl.deleteTexture(out);

    for (const u of [5, 6, 7]) { gl.activeTexture(gl.TEXTURE0 + u); gl.bindTexture(gl.TEXTURE_2D, tb[u]); }
    gl.activeTexture(st.at);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, st.fb); gl.bindFramebuffer(gl.READ_FRAMEBUFFER, st.rfb);
    gl.viewport(st.vp[0], st.vp[1], st.vp[2], st.vp[3]);
    gl.colorMask(st.cm[0], st.cm[1], st.cm[2], st.cm[3]);
    for (const [e, on] of st.en) if (on) gl.enable(e); else gl.disable(e);
    gl.useProgram(st.pr); gl.bindVertexArray(st.va);
    return ok ? out : null;
  }
  const CR = { rgb2lab, lab2rgb, hexLab, stops, plan, planKey, bake, mapTex, MAXS };
  CR.lose = (gl) => { PROG.delete(gl); };
  if (root.ND) root.ND.r3dCostume = CR;
  root.R3DCOSTUME = CR;
})(typeof window !== 'undefined' ? window : globalThis);
