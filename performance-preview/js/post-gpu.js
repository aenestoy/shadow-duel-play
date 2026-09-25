// Opt-in High post-processing experiment. The original Canvas path remains the default and fallback.
(function (ND) {
  'use strict';
  ND.createGpuPost = function (grain) {
    const canvas = document.createElement('canvas');
    let gl;
    try { gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true }); }
    catch (e) { return null; }
    if (!gl) return null;
    let lost = false, width = 0, height = 0, error = '', checked = false;
    canvas.addEventListener('webglcontextlost', () => { lost = true; });
    const textures = [], programs = [], framebuffers = [], shaders = [];
    const vertex = `attribute vec2 a_pos; varying vec2 v_uv; void main(){v_uv=a_pos*.5+.5;gl_Position=vec4(a_pos,0.,1.);}`;
    const header = `precision highp float; varying vec2 v_uv; uniform sampler2D u_image;`;
    function shader(kind, text) {
      const s = gl.createShader(kind); shaders.push(s); gl.shaderSource(s, text); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
      return s;
    }
    function program(fragment) {
      const p = gl.createProgram(); programs.push(p);
      gl.attachShader(p, shader(gl.VERTEX_SHADER, vertex)); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, header + fragment));
      gl.bindAttribLocation(p, 0, 'a_pos'); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(p));
      return { p, uniforms: new Map() };
    }
    function uniform(p, key) {
      if (!p.uniforms.has(key)) p.uniforms.set(key, gl.getUniformLocation(p.p, key));
      return p.uniforms.get(key);
    }
    function texture(nearest = false, repeat = false) {
      const t = gl.createTexture(); textures.push(t); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, nearest ? gl.NEAREST : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, nearest ? gl.NEAREST : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      return t;
    }
    function allocate(t, w, h) {
      gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    function target(t) {
      const f = gl.createFramebuffer(); framebuffers.push(f); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f;
    }
    function bind(t, unit) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); }
    function draw(p, f, w, h, input) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.viewport(0, 0, w, h); gl.useProgram(p.p); bind(input, 0);
      gl.uniform1i(uniform(p, 'u_image'), 0);
    }
    function finish() { gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
    let bright, blur, composite, source, glowA, glowB, noise, targetA, targetB, quad;
    try {
      bright = program(`void main(){vec3 c=texture2D(u_image,v_uv).rgb;c=floor(c*255.+.5)/255.;c=floor(c*c*255.+.5)/255.;c=floor(c*c*255.+.5)/255.;gl_FragColor=vec4(c,1.);}`);
      // Two separable Gaussian passes retain the same five-pixel standard deviation at quarter resolution.
      const weights = Array.from({ length: 16 }, (_, i) => Math.exp(-i * i / 50));
      const total = weights[0] + 2 * weights.slice(1).reduce((a, b) => a + b, 0);
      const terms = weights.map((v, i) => i ? `c+=(sampleAt(v_uv+u_step*${i}.)+sampleAt(v_uv-u_step*${i}.))*${(v / total).toFixed(10)};` : `vec4 c=sampleAt(v_uv)*${(v / total).toFixed(10)};`).join('');
      blur = program(`uniform vec2 u_step; vec4 sampleAt(vec2 uv){if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)return vec4(0.);return texture2D(u_image,uv);}void main(){${terms}gl_FragColor=c;}`);
      composite = program(`uniform sampler2D u_glow;uniform sampler2D u_noise;uniform vec2 u_size;uniform vec2 u_offset;uniform float u_strength;void main(){vec3 c=min(vec3(1.),texture2D(u_image,v_uv).rgb+texture2D(u_glow,v_uv).rgb*u_strength);vec2 pixel=vec2(gl_FragCoord.x,u_size.y-gl_FragCoord.y)-u_offset;float n=texture2D(u_noise,vec2(pixel.x/128.,1.-pixel.y/128.)).r;vec3 o=mix(2.*c*n,1.-2.*(1.-c)*(1.-n),step(vec3(.5),c));gl_FragColor=vec4(mix(c,o,.07),1.);}`);
      source = texture(); glowA = texture(); glowB = texture(); noise = texture(true, true);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, grain);
      quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.disable(gl.DITHER); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
    } catch (e) {
      for (const p of programs) gl.deleteProgram(p);
      for (const s of shaders) gl.deleteShader(s);
      for (const t of textures) gl.deleteTexture(t);
      if (quad) gl.deleteBuffer(quad);
      return null;
    }
    for (const s of shaders) gl.deleteShader(s);
    return {
      canvas,
      get ready() { return !lost && !error && !gl.isContextLost(); },
      get error() { return error; },
      render(input, output, strength, x, y) {
        if (lost || gl.isContextLost() || error) return false;
        try {
          const w = input.width, h = input.height, bw = Math.max(1, w >> 2), bh = Math.max(1, h >> 2);
          if (width !== w || height !== h) {
            canvas.width = w; canvas.height = h; allocate(source, w, h); allocate(glowA, bw, bh); allocate(glowB, bw, bh);
            if (!targetA) { targetA = target(glowA); targetB = target(glowB); }
            for (const f of [targetA, targetB]) {
              gl.bindFramebuffer(gl.FRAMEBUFFER, f);
              if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw Error('Incomplete post-processing framebuffer');
            }
            width = w; height = h;
          }
          bind(source, 0); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, input);
          draw(bright, targetA, bw, bh, source); finish();
          draw(blur, targetB, bw, bh, glowA); gl.uniform2f(uniform(blur, 'u_step'), 1 / bw, 0); finish();
          draw(blur, targetA, bw, bh, glowB); gl.uniform2f(uniform(blur, 'u_step'), 0, 1 / bh); finish();
          draw(composite, null, w, h, source); bind(glowA, 1); bind(noise, 2);
          gl.uniform1i(uniform(composite, 'u_glow'), 1); gl.uniform1i(uniform(composite, 'u_noise'), 2);
          gl.uniform2f(uniform(composite, 'u_size'), w, h); gl.uniform2f(uniform(composite, 'u_offset'), x, y);
          gl.uniform1f(uniform(composite, 'u_strength'), strength); finish();
          if (!checked) { const code = gl.getError(); if (code !== gl.NO_ERROR) throw Error('Post-processing GL error ' + code); checked = true; }
          output.save(); output.setTransform(1, 0, 0, 1, 0, 0); output.globalAlpha = 1; output.globalCompositeOperation = 'copy';
          try { output.drawImage(canvas, 0, 0); } finally { output.restore(); }
          return true;
        } catch (e) { error = String(e.message || e); return false; }
      },
    };
  };
})(window.ND = window.ND || {});
