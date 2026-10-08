


























window.ND = window.ND || {};
(function (ND) {
  'use strict';


  const COLORS = new Map();
  let colorScratch = null;
  const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
  function hexColor(t) {
    let h = t.slice(1);
    if (!/^[0-9a-f]+$/i.test(h)) return null;
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = parseInt(h.slice(0, 6), 16), a = h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
  }
  function num(s, max) {
    s = s.trim();
    if (s.endsWith('%')) return (parseFloat(s) / 100) * max;
    return parseFloat(s);
  }
  function parseColorRaw(s) {
    if (typeof s !== 'string') return null;
    const t = s.trim();
    if (t[0] === '#') return hexColor(t);
    const m = /^rgba?\(([^)]*)\)$/i.exec(t);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean);
      if (p.length < 3) return null;
      const r = num(p[0], 255), g = num(p[1], 255), b = num(p[2], 255), a = p.length > 3 ? num(p[3], 1) : 1;
      if (![r, g, b, a].every(Number.isFinite)) return null;
      return [Math.round(clamp255(r)), Math.round(clamp255(g)), Math.round(clamp255(b)), a < 0 ? 0 : a > 1 ? 1 : a];
    }
    if (typeof document === 'undefined') return null;

    if (!colorScratch) colorScratch = document.createElement('canvas').getContext('2d');
    colorScratch.fillStyle = '#010203'; colorScratch.fillStyle = t;
    let n = colorScratch.fillStyle;
    if (n === '#010203') { colorScratch.fillStyle = '#040506'; colorScratch.fillStyle = t; n = colorScratch.fillStyle; if (n === '#040506') return null; }
    return n[0] === '#' ? hexColor(n) : parseColorRaw(n);
  }
  function parseColor(s) {
    let c = COLORS.get(s);
    if (c !== undefined) return c;
    c = parseColorRaw(s);
    if (COLORS.size > 4096) COLORS.clear();
    COLORS.set(s, c);
    return c;
  }
  ND.glParseColor = parseColor;





  let installed = false;
  function install() {
    if (installed || typeof CanvasRenderingContext2D === 'undefined') return;
    installed = true; ND.glHooked = true;
    const protos = [CanvasRenderingContext2D.prototype];
    if (typeof OffscreenCanvasRenderingContext2D !== 'undefined') protos.push(OffscreenCanvasRenderingContext2D.prototype);
    for (const P of protos) {
      const lin = P.createLinearGradient, rad = P.createRadialGradient;
      P.createLinearGradient = function (x0, y0, x1, y1) {
        const g = lin.call(this, x0, y0, x1, y1);
        g.__gl = { t: 1, x0: +x0, y0: +y0, x1: +x1, y1: +y1, r0: 0, r1: 0, stops: [], key: null };
        return g;
      };
      P.createRadialGradient = function (x0, y0, r0, x1, y1, r1) {
        const g = rad.call(this, x0, y0, r0, x1, y1, r1);
        g.__gl = { t: 2, x0: +x0, y0: +y0, x1: +x1, y1: +y1, r0: +r0, r1: +r1, stops: [], key: null };
        return g;
      };
      for (const k of ['fill', 'stroke', 'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'putImageData', 'fillText', 'strokeText', 'reset']) {
        const o = P[k];
        if (typeof o !== 'function') continue;
        P[k] = function () { const c = this.canvas; if (c) c.__glv = (c.__glv | 0) + 1; return o.apply(this, arguments); };
      }
    }
    const add = CanvasGradient.prototype.addColorStop;
    CanvasGradient.prototype.addColorStop = function (o, c) {
      add.call(this, o, c);
      const m = this.__gl;
      if (m) { m.stops.push(+o, c); m.key = null; }
    };
    const dims = [];
    if (typeof HTMLCanvasElement !== 'undefined') dims.push(HTMLCanvasElement.prototype);
    if (typeof OffscreenCanvas !== 'undefined') dims.push(OffscreenCanvas.prototype);
    for (const P of dims) for (const k of ['width', 'height']) {
      const d = Object.getOwnPropertyDescriptor(P, k);
      if (!d || !d.set) continue;
      Object.defineProperty(P, k, { ...d, set(v) { this.__glv = (this.__glv | 0) + 1; d.set.call(this, v); } });
    }
  }
  ND.glInstallHooks = install;


  const OPS = { 'source-over': 0, lighter: 1, 'source-atop': 2, 'destination-over': 3, 'source-in': 4, 'destination-in': 5,
    'destination-out': 6, screen: 7, multiply: 8, copy: 9, clear: 10 };
  const OP_CLEAR = 10;
  const TAU = Math.PI * 2;



  const TOL0 = 0.2;
  const K_DRAW = 1, K_SFILL = 2, K_CLIP = 3, K_CUSTOM = 4;
  const PT_SOLID = 0, PT_LIN = 1, PT_RAD = 2, PT_TEX = 3, PT_NONE = 4;
  const STRIDE = 7;

  ND.createGL2D = function (gl, opts = {}) {
    install();
    const R = { gl, unsupported: '', stats: null, prof: null };

    const TL = new Float64Array(1); TL[0] = TOL0;



    const now = () => performance.now();
    let P = null;
    const stackOf = () => String(new Error().stack).split('\n').slice(3, 7).map((l) => l.trim().replace(/^at /, '').replace(/https?:\/\/[^/]+\//, '').replace(/\?[^:]*/, '')).join(' < ');
    function profReset() {
      if (!P) return;
      P.tessMs = 0; P.tessCalls = 0; P.texts = 0; P.textMs = 0; P.textPx = 0; P.textEvict = 0; P.ramps = 0; P.rampRows = 0;
      P.imgUploads = 0; P.imgPx = 0; P.imgMs = 0; P.imgWhy.length = 0; P.textWhy.length = 0;
      P.bufBytes = 0; P.bufMs = 0; P.bufAlloc = 0; P.endMs = 0; P.postMs = 0; P.runMs = 0; P.grow = 0; P.layerRegrow = 0; P.targetsNew = 0; P.textAtlasFull = 0;
    }
    let wantSamples = opts.samples == null ? 4 : opts.samples | 0;


    let capV = 1 << 16, capI = 1 << 17;
    let VB = new ArrayBuffer(capV * STRIDE * 4), VF = new Float32Array(VB), VU = new Uint32Array(VB);
    let IX = new Uint32Array(capI);
    let nv = 0, ni = 0;
    function growV(need) {
      if (P) P.grow++;
      let c = capV; while (c < need) c *= 2;
      const nb = new ArrayBuffer(c * STRIDE * 4); new Uint32Array(nb).set(VU.subarray(0, nv * STRIDE));
      VB = nb; VF = new Float32Array(nb); VU = new Uint32Array(nb); capV = c;
    }
    function growI(need) {
      if (P) P.grow++;
      let c = capI; while (c < need) c *= 2;
      const n = new Uint32Array(c); n.set(IX.subarray(0, ni)); IX = n; capI = c;
    }





    const ES = new Float64Array(20); ES[3] = 1; ES[6] = 1; ES[9] = 1; ES[12] = 1;
    const EU = new Uint32Array(2);
    let UVM = 0, zc = 0;
    let SU = false;
    const ZSTEP = 1 / (1 << 21);
    const nextZ = () => { ES[0] = 1 - (++zc) * ZSTEP; };
    const QX = new Float64Array(1100), QY = new Float64Array(1100), QU = new Float64Array(4), QV = new Float64Array(4);

    function emit(X, Y, i0, n) {
      if (nv + n > capV) growV(nv + n);
      const base = nv, z = ES[0], ox = ES[1], oy = ES[2], col = EU[0], paint = EU[1], end = i0 + n;
      let o = nv * STRIDE;
      if (SU) {
        const a = ES[9], b = ES[10], c = ES[11], d = ES[12], e = ES[13] + ox, f = ES[14] + oy;
        for (let i = i0; i < end; i++, o += STRIDE) {
          const x = X[i], y = Y[i];
          VF[o] = a * x + c * y + e; VF[o + 1] = b * x + d * y + f; VF[o + 2] = z; VF[o + 3] = x; VF[o + 4] = y; VU[o + 5] = col; VU[o + 6] = paint;
        }
      } else if (UVM) {
        const a = ES[3], b = ES[4], c = ES[5], d = ES[6], e = ES[7], f = ES[8];
        for (let i = i0; i < end; i++, o += STRIDE) {
          const x = X[i], y = Y[i];
          VF[o] = x + ox; VF[o + 1] = y + oy; VF[o + 2] = z; VF[o + 3] = a * x + c * y + e; VF[o + 4] = b * x + d * y + f; VU[o + 5] = col; VU[o + 6] = paint;
        }
      } else {
        for (let i = i0; i < end; i++, o += STRIDE) {
          VF[o] = X[i] + ox; VF[o + 1] = Y[i] + oy; VF[o + 2] = z; VF[o + 3] = 0; VF[o + 4] = 0; VU[o + 5] = col; VU[o + 6] = paint;
        }
      }
      nv += n;
      return base;
    }

    function emitUV4() {
      if (nv + 4 > capV) growV(nv + 4);
      const base = nv, z = ES[0], ox = ES[1], oy = ES[2], col = EU[0], paint = EU[1];
      let o = nv * STRIDE;
      for (let i = 0; i < 4; i++, o += STRIDE) {
        VF[o] = QX[i] + ox; VF[o + 1] = QY[i] + oy; VF[o + 2] = z; VF[o + 3] = QU[i]; VF[o + 4] = QV[i]; VU[o + 5] = col; VU[o + 6] = paint;
      }
      nv += 4;
      if (ni + 6 > capI) growI(ni + 6);
      IX[ni++] = base; IX[ni++] = base + 1; IX[ni++] = base + 2; IX[ni++] = base; IX[ni++] = base + 2; IX[ni++] = base + 3;
      return base;
    }
    function tri(a, b, c) {
      if (ni + 3 > capI) growI(ni + 3);
      IX[ni++] = a; IX[ni++] = b; IX[ni++] = c;
    }
    function fan(base, n) {
      if (ni + 3 * n > capI) growI(ni + 3 * n);
      for (let i = 1; i + 1 < n; i++) { IX[ni++] = base; IX[ni++] = base + i; IX[ni++] = base + i + 1; }
    }
    const pack = (r, g, b, a) => ((r + 0.5) & 255 | ((g + 0.5) & 255) << 8 | ((b + 0.5) & 255) << 16 | ((a + 0.5) & 255) << 24) >>> 0;


    let cmds = [];
    let bPass = -1, bBlend = -1, bTex = null, bClip = null, bSc = null, bStart = 0;
    function closeBatch() {
      if (ni > bStart && bPass >= 0) cmds.push({ k: K_DRAW, pass: bPass, blend: bBlend, tex: bTex, clip: bClip, sc: bSc, first: bStart, count: ni - bStart });
      bStart = ni;
    }
    function useState(pass, blend, tex, clip, sc) {
      if (pass !== bPass || blend !== bBlend || tex !== bTex || clip !== bClip || sc !== bSc) {
        closeBatch(); bPass = pass; bBlend = blend; bTex = tex; bClip = clip; bSc = sc;
      }
    }
    const fail = (why) => { if (!R.unsupported) R.unsupported = why; };


    const RAMP_W = 256, RAMP_ROWS = 512, PAINT_ROWS = 8192;
    const ramps = new Map();
    const rampData = new Uint8Array(RAMP_W * 4 * RAMP_ROWS);
    let rampDirty = [], rampFree = [];
    for (let i = RAMP_ROWS - 1; i >= 0; i--) rampFree.push(i);
    let frameNo = 0;
    function stopsKey(m) {
      if (m.key) return m.key;
      let k = '';
      for (let i = 0; i < m.stops.length; i += 2) k += m.stops[i] + ':' + m.stops[i + 1] + '|';
      return (m.key = k);
    }
    function rampRow(m) {
      const key = stopsKey(m);
      let e = ramps.get(key);
      if (e) { e.used = frameNo; return e.row; }
      let row = rampFree.pop();
      if (row === undefined) {
        let old = null;
        for (const [k, v] of ramps) if (v.used < frameNo && (!old || v.used < old[1].used)) old = [k, v];
        if (!old) { fail('too many gradients in one frame'); return 0; }
        ramps.delete(old[0]); row = old[1].row;
      }
      ramps.set(key, { row, used: frameNo });
      if (P) P.ramps++;

      const S = [];
      for (let i = 0; i < m.stops.length; i += 2) {
        const c = parseColor(m.stops[i + 1]) || [0, 0, 0, 0];
        S.push({ o: Math.min(1, Math.max(0, m.stops[i])), c, i });
      }
      S.sort((a, b) => a.o - b.o || a.i - b.i);
      const base = row * RAMP_W * 4;
      let j = 0;
      for (let x = 0; x < RAMP_W; x++) {
        const t = x / (RAMP_W - 1);
        let r = 0, g = 0, b = 0, a = 0;
        if (S.length) {
          while (j < S.length && S[j].o <= t) j++;
          if (j === 0) { const c = S[0].c; r = c[0]; g = c[1]; b = c[2]; a = c[3]; }
          else if (j === S.length) { const c = S[S.length - 1].c; r = c[0]; g = c[1]; b = c[2]; a = c[3]; }
          else {
            const p = S[j - 1], q = S[j], f = q.o > p.o ? (t - p.o) / (q.o - p.o) : 1;
            r = p.c[0] + (q.c[0] - p.c[0]) * f; g = p.c[1] + (q.c[1] - p.c[1]) * f; b = p.c[2] + (q.c[2] - p.c[2]) * f; a = p.c[3] + (q.c[3] - p.c[3]) * f;
          }
        }
        const o = base + x * 4;
        rampData[o] = Math.round(r); rampData[o + 1] = Math.round(g); rampData[o + 2] = Math.round(b); rampData[o + 3] = Math.round(a * 255);
      }
      rampDirty.push(row);
      return row;
    }
    const paintData = new Float32Array(PAINT_ROWS * 8);
    let np = 0;
    function paintRecord(m) {
      if (np >= PAINT_ROWS) { fail('too many gradient fills in one frame'); return 0; }
      const o = np * 8;
      paintData[o] = m.x0; paintData[o + 1] = m.y0; paintData[o + 2] = m.x1; paintData[o + 3] = m.y1;
      paintData[o + 4] = m.r0; paintData[o + 5] = m.r1; paintData[o + 6] = rampRow(m); paintData[o + 7] = 0;
      return np++;
    }


    const images = new Map();
    let pendingUploads = [];
    function imageEntry(img) {
      let e = images.get(img);
      const v = img.__glv | 0;
      if (!e) { e = { tex: null, w: 0, h: 0, v: -1, used: frameNo, flip: false, src: img }; images.set(img, e); }
      e.used = frameNo;
      const w = img.width, h = img.height;
      if (e.v !== v || e.w !== w || e.h !== h || !e.tex) {
        if (!e.pending) {
          e.pending = true; pendingUploads.push(e);
          if (P && P.imgWhy.length < 8) P.imgWhy.push((!e.tex ? 'new ' : e.w !== w || e.h !== h ? 'resized ' : 'redrawn ') + w + 'x' + h + (img.id ? ' #' + img.id : '') + (P.stacks ? ' @ ' + stackOf() : ''));
        }
        e.nw = w; e.nh = h; e.nv = v;
      }
      return e;
    }










    const SP_W = 1024, SP_H = 1024, SP_MAX = 16;
    const spPages = [];
    let spCanvas = null, spCtx = null, spM1 = null, spX1 = null, spM2 = null, spX2 = null, spW = 0, spH = 0, spGen = 0;





    let spOwner = null;
    R.spriteOwner = (o) => { spOwner = o || null; };
    R.spriteRelease = (o) => {
      for (const q of spPages) if (q.owner === o) { q.owner = null; q.gen = ++spGen; q.shelves.length = 0; q.top = 0; q.n = 0; }
    };
    const cpuCanvas = (c) => c.getContext('2d', { willReadFrequently: true });
    function spPage() {
      const p = { tex: null, gen: ++spGen, shelves: [], top: 0, used: frameNo, n: 0, owner: spOwner };
      if (E.ready) {
        p.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, p.tex);
        gl.texStorage2D(gl.TEXTURE_2D, 3, gl.RGBA8, SP_W, SP_H);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 2);
        CNT.texNew++; CNT.spritePages++;
      }
      spPages.push(p);
      return p;
    }

    function spAlloc(p, cw, ch) {
      for (const s of p.shelves) if (s.h >= ch && s.h <= ch + 8 && s.x + cw <= SP_W) { const r = { x: s.x, y: s.y }; s.x += cw; return r; }
      const h = Math.ceil(ch / 8) * 8;
      if (p.top + h > SP_H || cw > SP_W) return null;
      const s = { y: p.top, h, x: cw }; p.top += h; p.shelves.push(s);
      return { x: 0, y: s.y };
    }

    R.spriteBegin = function (w, h) {
      const cw = Math.ceil((w + 4) / 4) * 4, ch = Math.ceil((h + 4) / 4) * 4;
      if (!spCanvas) spCanvas = document.createElement('canvas');
      if (spCanvas.width < cw || spCanvas.height < ch) {
        spCanvas.width = Math.max(spCanvas.width, Math.ceil(cw / 64) * 64); spCanvas.height = Math.max(spCanvas.height, Math.ceil(ch / 64) * 64); spCtx = null;
      }
      if (!spCtx) spCtx = cpuCanvas(spCanvas);
      const x = spCtx;
      if (typeof x.reset === 'function') x.reset(); else { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
      x.clearRect(0, 0, cw, ch);
      spW = w; spH = h;
      return x;
    };

    R.spriteEnd = function () {
      if (!E.ready) return null;
      const w = spW, h = spH, cw = Math.ceil((w + 4) / 4) * 4, ch = Math.ceil((h + 4) / 4) * 4;
      if (cw > SP_W || ch > SP_H) return null;
      let p = null, r = null;
      for (let i = spPages.length - 1; i >= 0 && !r; i--) if (spPages[i].owner === spOwner) { r = spAlloc(spPages[i], cw, ch); if (r) p = spPages[i]; }

      if (!r) for (const q of spPages) if (!q.owner && !q.n && q !== p) { q.owner = spOwner; q.shelves.length = 0; q.top = 0; r = spAlloc(q, cw, ch); if (r) { p = q; break; } }
      if (!r && spPages.length < SP_MAX) { p = spPage(); r = spAlloc(p, cw, ch); }
      if (!r) {

        let old = null;
        for (const q of spPages) if (q.used < frameNo && (!old || q.used < old.used)) old = q;
        if (!old) return null;
        old.gen = ++spGen; old.shelves.length = 0; old.top = 0; old.n = 0; old.owner = spOwner; CNT.spriteDrops++;
        p = old; r = spAlloc(p, cw, ch);
        if (!r) return null;
      }

      const w1 = cw >> 1, h1 = ch >> 1, w2 = cw >> 2, h2 = ch >> 2;
      if (!spM1) { spM1 = document.createElement('canvas'); spM2 = document.createElement('canvas'); }
      if (spM1.width < w1 || spM1.height < h1) { spM1.width = Math.max(spM1.width, Math.ceil(w1 / 32) * 32); spM1.height = Math.max(spM1.height, Math.ceil(h1 / 32) * 32); spX1 = null; }
      if (spM2.width < w2 || spM2.height < h2) { spM2.width = Math.max(spM2.width, Math.ceil(w2 / 16) * 16); spM2.height = Math.max(spM2.height, Math.ceil(h2 / 16) * 16); spX2 = null; }
      if (!spX1) spX1 = cpuCanvas(spM1);
      if (!spX2) spX2 = cpuCanvas(spM2);
      spX1.setTransform(1, 0, 0, 1, 0, 0); spX1.globalAlpha = 1; spX1.globalCompositeOperation = 'copy'; spX1.imageSmoothingEnabled = true; spX1.imageSmoothingQuality = 'low';
      spX1.drawImage(spCanvas, 0, 0, cw, ch, 0, 0, w1, h1);
      spX2.setTransform(1, 0, 0, 1, 0, 0); spX2.globalAlpha = 1; spX2.globalCompositeOperation = 'copy'; spX2.imageSmoothingEnabled = true; spX2.imageSmoothingQuality = 'low';
      spX2.drawImage(spM1, 0, 0, w1, h1, 0, 0, w2, h2);
      gl.bindTexture(gl.TEXTURE_2D, p.tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, r.x, r.y, cw, ch, gl.RGBA, gl.UNSIGNED_BYTE, spCanvas);
      gl.texSubImage2D(gl.TEXTURE_2D, 1, r.x >> 1, r.y >> 1, w1, h1, gl.RGBA, gl.UNSIGNED_BYTE, spM1);
      gl.texSubImage2D(gl.TEXTURE_2D, 2, r.x >> 2, r.y >> 2, w2, h2, gl.RGBA, gl.UNSIGNED_BYTE, spM2);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      CNT.texUp += 3; CNT.texKB += (cw * ch * 4 * 1.3125) / 1024; CNT.sprites++;
      p.n++; p.used = frameNo;
      return { page: p, gen: p.gen, u0: (r.x + 2) / SP_W, v0: (r.y + 2) / SP_H, u1: (r.x + 2 + w) / SP_W, v1: (r.y + 2 + h) / SP_H };
    };
    R.spriteOk = (s) => !!s && s.gen === s.page.gen && !!s.page.tex;
    R.spriteInfo = () => ({ pages: spPages.length, sprites: spPages.reduce((n, p) => n + p.n, 0), maxPages: SP_MAX, pageSize: [SP_W, SP_H] });

    const CNT = R.count = { texNew: 0, texUp: 0, texKB: 0, texts: 0, shaders: 0, targets: 0, sprites: 0, spritePages: 0, spriteDrops: 0, surfaces: 0 };








    const TA_W = (opts.textAtlas && opts.textAtlas[0]) || 1024, TA_H = (opts.textAtlas && opts.textAtlas[1]) || 1024;
    const texts = new Map();
    const textSizes = new Map();
    const FONT_PX = /(\d+(?:\.\d+)?)px/;
    const shelves = [];
    let shelfTop = 0, textUploads = 0;
    let textCanvas = null, textCtx = null, measureCtx = null;
    function textClear() { texts.clear(); shelves.length = 0; shelfTop = 0; for (const q of textQ) q.length = 0; }




    let textRing = [], textCur = 0;
    const textQ = [[], [], []];
    R.textRing = false;
    R.textWarm = 0; R.textWarmFull = false;

    R.textUse = (detail) => ({ texts: texts.size, rows: shelfTop, height: TA_H, width: TA_W, made: textUploads, keys: detail ? [...texts].map(([k, e]) => [k, e.w * e.h]) : undefined });
    function textScratch(w, h) {
      if (!textCanvas) { textCanvas = document.createElement('canvas'); textCtx = null; }
      if (textCanvas.width < w || textCanvas.height < h) {
        textCanvas.width = Math.max(textCanvas.width, Math.ceil(w / 64) * 64); textCanvas.height = Math.max(textCanvas.height, Math.ceil(h / 32) * 32); textCtx = null;
      }
      if (!textCtx) textCtx = textCanvas.getContext('2d', { willReadFrequently: true });
      return textCtx;
    }
    function measurer() { return measureCtx || (measureCtx = document.createElement('canvas').getContext('2d')); }


    const METRICS = new Map();
    function metrics(t, font, align, baseline) {
      const k = font + '|' + align + '|' + baseline + '|' + t;
      let v = METRICS.get(k);
      if (v) return v;
      const m = measurer(); m.font = font; m.textAlign = align; m.textBaseline = baseline;
      const mt = m.measureText(t);
      v = { width: mt.width, actualBoundingBoxLeft: mt.actualBoundingBoxLeft, actualBoundingBoxRight: mt.actualBoundingBoxRight,
        actualBoundingBoxAscent: mt.actualBoundingBoxAscent, actualBoundingBoxDescent: mt.actualBoundingBoxDescent };

      if (typeof document !== 'undefined' && document.fonts && document.fonts.status !== 'loaded') return v;
      if (METRICS.size > 2048) METRICS.clear();
      METRICS.set(k, v);
      return v;
    }
    function textAlloc(w, h) {
      let best = null;
      for (const s of shelves) if (s.h >= h && s.h <= h * 1.25 + 4 && s.x + w + 1 <= TA_W && (!best || s.h < best.h)) best = s;
      if (!best && shelfTop + h + 1 <= TA_H) {
        const sh = Math.min(TA_H - shelfTop - 1, Math.ceil(h / 8) * 8);
        best = { y: shelfTop, h: sh, x: 0, used: frameNo, keys: [] };
        shelves.push(best); shelfTop += sh + 1;
      }
      if (!best) {

        for (const s of shelves) if (s.h >= h && s.h <= h * 2 + 8 && s.used < frameNo && (!best || s.used < best.used)) best = s;
        if (!best) for (const s of shelves) if (s.h >= h && s.used < frameNo && (!best || s.used < best.used)) best = s;
        if (best) textEvict(best);
      }
      if (!best) best = textMerge(h);
      if (!best) return null;
      const x = best.x;
      best.x += w + 1; best.used = frameNo;
      return { shelf: best, x, y: best.y };
    }
    function textEvict(s) { for (const k of s.keys) texts.delete(k); s.keys.length = 0; s.x = 0; if (P) P.textEvict++; }


    function textMerge(h) {
      let bi = -1, bj = -1, bu = Infinity;
      for (let i = 0; i < shelves.length; i++) {
        let u = -1, ok = false, j = i;
        for (; j < shelves.length && shelves[j].used < frameNo; j++) {
          if (shelves[j].used > u) u = shelves[j].used;
          const end = j === shelves.length - 1 ? TA_H - 1 : shelves[j].y + shelves[j].h;
          if (end - shelves[i].y >= h) { ok = true; break; }
        }
        if (ok && u < bu) { bu = u; bi = i; bj = j; }
      }
      if (bi < 0) return null;
      const first = shelves[bi], lastShelf = bj === shelves.length - 1, end = lastShelf ? TA_H - 1 : shelves[bj].y + shelves[bj].h;
      for (let k = bi; k <= bj; k++) textEvict(shelves[k]);
      first.h = end - first.y;
      shelves.splice(bi + 1, bj - bi);
      if (lastShelf) shelfTop = TA_H;
      return first;
    }


    let AW = 0, AH = 0, wantAW = 512, wantAH = 512;
    let shelfX = 0, shelfY = 0, shelfH = 0, usedW = 0, usedH = 0;
    const layerCtxs = new Map();


    const layerQuads = [];
    function layerAlloc(w, h) {
      const P = 2;
      if (w + P > AW || h + P > AH) return null;
      if (shelfX + w + P > AW) { shelfX = 0; shelfY += shelfH; shelfH = 0; }
      if (shelfY + h + P > AH) return null;
      const r = { x: shelfX + 1, y: shelfY + 1, w, h };
      shelfX += w + P; if (h + P > shelfH) shelfH = h + P;
      usedW = Math.max(usedW, shelfX); usedH = Math.max(usedH, shelfY + shelfH);
      return r;
    }


    let SX = new Float64Array(1024), SY = new Float64Array(1024);
    let TX = new Float64Array(1024), TY = new Float64Array(1024);
    let LP = new Int32Array(1024), LN = new Int32Array(1024), RF = new Uint8Array(1024);
    function growScratch(n) {
      let c = SX.length; while (c < n) c *= 2;
      if (c === SX.length) return;
      const a = new Float64Array(c), b = new Float64Array(c); a.set(SX); b.set(SY); SX = a; SY = b;
      TX = new Float64Array(c); TY = new Float64Array(c); LP = new Int32Array(c); LN = new Int32Array(c); RF = new Uint8Array(c);
    }

    const cross = (a, b, c) => (SX[b] - SX[a]) * (SY[c] - SY[b]) - (SY[b] - SY[a]) * (SX[c] - SX[b]);
    function earClip(n, base) {
      for (let i = 0; i < n; i++) { LP[i] = i === 0 ? n - 1 : i - 1; LN[i] = i === n - 1 ? 0 : i + 1; }
      for (let i = 0; i < n; i++) RF[i] = cross(LP[i], i, LN[i]) <= 0 ? 1 : 0;
      let left = n, i = 0, stall = 0, area = 0;
      while (left > 3) {
        const p = LP[i], q = LN[i];
        let ear = !RF[i];
        if (ear) {
          const ax = SX[p], ay = SY[p], bx = SX[i], by = SY[i], cx = SX[q], cy = SY[q];
          for (let k = LN[q]; k !== p; k = LN[k]) {
            if (!RF[k]) continue;
            const px = SX[k], py = SY[k];
            if ((px === ax && py === ay) || (px === bx && py === by) || (px === cx && py === cy)) continue;
            const d1 = (bx - ax) * (py - ay) - (by - ay) * (px - ax), d2 = (cx - bx) * (py - by) - (cy - by) * (px - bx), d3 = (ax - cx) * (py - cy) - (ay - cy) * (px - cx);
            if (d1 >= 0 && d2 >= 0 && d3 >= 0) { ear = false; break; }
          }
        }
        if (ear) {
          tri(base + p, base + i, base + q);
          area += cross(p, i, q);
          LN[p] = q; LP[q] = p; left--;
          RF[p] = cross(LP[p], p, LN[p]) <= 0 ? 1 : 0; RF[q] = cross(LP[q], q, LN[q]) <= 0 ? 1 : 0;
          i = q; stall = 0; continue;
        }
        i = q;
        if (++stall > left) {

          let k = i, found = -1;
          for (let s = 0; s < left; s++, k = LN[k]) {
            const c = cross(LP[k], k, LN[k]), e = Math.abs(SX[LN[k]] - SX[LP[k]]) + Math.abs(SY[LN[k]] - SY[LP[k]]);
            if (Math.abs(c) <= 1e-9 * (e * e + 1)) { found = k; break; }
          }
          if (found < 0) return -1;
          const p2 = LP[found], q2 = LN[found];
          LN[p2] = q2; LP[q2] = p2; left--;
          RF[p2] = cross(LP[p2], p2, LN[p2]) <= 0 ? 1 : 0; RF[q2] = cross(LP[q2], q2, LN[q2]) <= 0 ? 1 : 0;
          i = q2; stall = 0;
        }
      }
      const p = LP[i], q = LN[i];
      tri(base + p, base + i, base + q);
      area += Math.abs(cross(p, i, q));
      return area;
    }



    function copyState(d, s) {
      d.a = s.a; d.b = s.b; d.c = s.c; d.d = s.d; d.e = s.e; d.f = s.f; d.ga = s.ga; d.op = s.op; d.opb = s.opb;
      d.fs = s.fs; d.fsRaw = s.fsRaw; d.ss = s.ss; d.ssRaw = s.ssRaw; d.lw = s.lw; d.cap = s.cap; d.join = s.join; d.miter = s.miter;
      d.dash = s.dash; d.dashOff = s.dashOff; d.font = s.font; d.align = s.align; d.baseline = s.baseline; d.clp = s.clp; d.smooth = s.smooth;
    }
    const blankState = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, ga: 1, op: '', opb: 0, fs: null, fsRaw: null, ss: null, ssRaw: null, lw: 1, cap: 0, join: 0,
      miter: 10, dash: null, dashOff: 0, font: '', align: '', baseline: '', clp: null, smooth: true });
    const CAPS = { butt: 0, round: 1, square: 2 }, JOINS = { miter: 0, round: 1, bevel: 2 };
    const CAP_N = ['butt', 'round', 'square'], JOIN_N = ['miter', 'round', 'bevel'];
    const BLACK = { t: 0, c: [0, 0, 0, 1] };
    const SOLIDS = new Map();
    function styleOf(v) {
      if (typeof v === 'string') {
        let st = SOLIDS.get(v);
        if (st === undefined) { const c = parseColor(v); st = c ? { t: 0, c } : null; if (SOLIDS.size > 4096) SOLIDS.clear(); SOLIDS.set(v, st); }
        return st;
      }
      if (v && v.__gl) return v.__gl.style || (v.__gl.style = { t: v.__gl.t, g: v.__gl });
      if (v && typeof CanvasPattern !== 'undefined' && v instanceof CanvasPattern) return { t: -1 };
      return null;
    }

    class Ctx {
      constructor(pass, sc, w, h) {
        this.pass = pass; this.sc = sc; this.W = w; this.H = h; this.isGL = true;
        this.stack = []; this.sp = 0;
        this.px = new Float64Array(512); this.py = new Float64Array(512); this.n = 0;
        this.sub = new Int32Array(64); this.cl = new Uint8Array(64); this.cx = new Uint8Array(64); this.ns = 0;
        this.open = false; this.sx0 = 0; this.sy0 = 0;
        this._canvas = { width: w, height: h };
        this.reset();
      }
      reset() {
        this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
        this.ga = 1; this.op = 'source-over'; this.opb = 0;
        this.fs = BLACK; this.fsRaw = '#000000'; this.ss = BLACK; this.ssRaw = '#000000';
        this.lw = 1; this.cap = 0; this.join = 0; this.miter = 10; this.dash = null; this.dashOff = 0;
        this.font = '10px sans-serif'; this.align = 'start'; this.baseline = 'alphabetic'; this.clp = null; this.smooth = true;
        this.sp = 0; this.n = 0; this.ns = 0; this.open = false;
      }
      get canvas() { return this._canvas; }



      custom(fn) {
        closeBatch(); bPass = -1;
        cmds.push({ k: K_CUSTOM, pass: this.pass, blend: 0, tex: null, clip: null, sc: this.sc, fn });
      }

      save() {
        const s = this.stack[this.sp] || (this.stack[this.sp] = blankState());
        copyState(s, this); this.sp++;
      }
      restore() {
        if (!this.sp) return;
        copyState(this, this.stack[--this.sp]);
      }
      get globalAlpha() { return this.ga; }
      set globalAlpha(v) { v = +v; if (v >= 0 && v <= 1) this.ga = v; }
      get globalCompositeOperation() { return this.op; }
      set globalCompositeOperation(v) {
        if (typeof v !== 'string') return;
        const b = OPS[v];
        if (b === undefined) {
          if (/^(overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity|xor|source-out|destination-atop)$/.test(v)) { this.op = v; this.opb = -1; }
          return;
        }
        this.op = v; this.opb = b;
      }
      get fillStyle() { return this.fsRaw; }

      set fillStyle(v) { if (v === this.fsRaw) return; const s = styleOf(v); if (s) { this.fs = s; this.fsRaw = v; } }
      get strokeStyle() { return this.ssRaw; }
      set strokeStyle(v) { if (v === this.ssRaw) return; const s = styleOf(v); if (s) { this.ss = s; this.ssRaw = v; } }
      get lineWidth() { return this.lw; }
      set lineWidth(v) { v = +v; if (v > 0 && v < Infinity) this.lw = v; }
      get lineCap() { return CAP_N[this.cap]; }
      set lineCap(v) { const k = CAPS[v]; if (k !== undefined) this.cap = k; }
      get lineJoin() { return JOIN_N[this.join]; }
      set lineJoin(v) { const k = JOINS[v]; if (k !== undefined) this.join = k; }
      get miterLimit() { return this.miter; }
      set miterLimit(v) { v = +v; if (v > 0 && v < Infinity) this.miter = v; }
      get lineDashOffset() { return this.dashOff; }
      set lineDashOffset(v) { v = +v; if (Number.isFinite(v)) this.dashOff = v; }
      setLineDash(a) {
        if (!a || !a.length) { this.dash = null; return; }
        for (const v of a) if (!(v >= 0) || !Number.isFinite(v)) return;
        let d = Array.from(a, Number);
        if (d.length & 1) d = d.concat(d);
        this.dash = d.every((v) => v === 0) ? null : d;
      }
      getLineDash() { return this.dash ? this.dash.slice() : []; }
      get textAlign() { return this.align; }
      set textAlign(v) { if (/^(start|end|left|right|center)$/.test(v)) this.align = v; }
      get textBaseline() { return this.baseline; }
      set textBaseline(v) { if (/^(top|hanging|middle|alphabetic|ideographic|bottom)$/.test(v)) this.baseline = v; }
      get imageSmoothingEnabled() { return this.smooth; }
      set imageSmoothingEnabled(v) { this.smooth = !!v; }
      get filter() { return 'none'; }
      set filter(v) { if (v && v !== 'none') fail('ctx.filter'); }
      get shadowBlur() { return 0; }
      set shadowBlur(v) { if (v) fail('shadowBlur'); }
      get shadowColor() { return 'rgba(0, 0, 0, 0)'; }
      set shadowColor(v) {                                                                }
      get shadowOffsetX() { return 0; }
      set shadowOffsetX(v) { if (v) fail('shadowOffset'); }
      get shadowOffsetY() { return 0; }
      set shadowOffsetY(v) { if (v) fail('shadowOffset'); }

      setTransform(a, b, c, d, e, f) {
        if (a !== undefined && typeof a === 'object') { const m = a; a = m.a ?? m.m11 ?? 1; b = m.b ?? m.m12 ?? 0; c = m.c ?? m.m21 ?? 0; d = m.d ?? m.m22 ?? 1; e = m.e ?? m.m41 ?? 0; f = m.f ?? m.m42 ?? 0; }
        else if (a === undefined) { a = 1; b = 0; c = 0; d = 1; e = 0; f = 0; }
        if (!(Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c) && Number.isFinite(d) && Number.isFinite(e) && Number.isFinite(f))) return;
        this.a = a; this.b = b; this.c = c; this.d = d; this.e = e; this.f = f;
      }
      resetTransform() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
      getTransform() {
        return typeof DOMMatrix === 'function' ? new DOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f]) : { a: this.a, b: this.b, c: this.c, d: this.d, e: this.e, f: this.f };
      }
      transform(A, B, C, D, E, F) {
        if (!(Number.isFinite(A) && Number.isFinite(B) && Number.isFinite(C) && Number.isFinite(D) && Number.isFinite(E) && Number.isFinite(F))) return;
        const a = this.a, b = this.b, c = this.c, d = this.d;
        this.a = a * A + c * B; this.b = b * A + d * B; this.c = a * C + c * D; this.d = b * C + d * D;
        this.e += a * E + c * F; this.f += b * E + d * F;
      }
      translate(x, y) { if (!(Number.isFinite(x) && Number.isFinite(y))) return; this.e += this.a * x + this.c * y; this.f += this.b * x + this.d * y; }
      scale(x, y) { if (!(Number.isFinite(x) && Number.isFinite(y))) return; this.a *= x; this.b *= x; this.c *= y; this.d *= y; }
      rotate(t) {
        if (!Number.isFinite(t)) return;
        const cs = Math.cos(t), sn = Math.sin(t), a = this.a, b = this.b, c = this.c, d = this.d;
        this.a = a * cs + c * sn; this.b = b * cs + d * sn; this.c = c * cs - a * sn; this.d = d * cs - b * sn;
      }

      beginPath() { this.n = 0; this.ns = 0; this.open = false; }
      _pt(x, y) {
        if (this.n >= this.px.length) this._grow();
        this.px[this.n] = x; this.py[this.n] = y; this.n++;
      }
      _grow() { const c = this.px.length * 2, a = new Float64Array(c), b = new Float64Array(c); a.set(this.px); b.set(this.py); this.px = a; this.py = b; }
      _sub(x, y) {
        if (this.ns >= this.sub.length) { const s = new Int32Array(this.sub.length * 2), c = new Uint8Array(this.sub.length * 2), v = new Uint8Array(this.sub.length * 2); s.set(this.sub); c.set(this.cl); v.set(this.cx); this.sub = s; this.cl = c; this.cx = v; }
        this.sub[this.ns] = this.n; this.cl[this.ns] = 0; this.cx[this.ns] = 0; this.ns++;
        this.open = true; this.sx0 = x; this.sy0 = y;
        this._pt(x, y);
      }
      moveTo(x, y) {
        if (!(Number.isFinite(x) && Number.isFinite(y))) return;
        this._sub(this.a * x + this.c * y + this.e, this.b * x + this.d * y + this.f);
      }
      lineTo(x, y) {
        if (!(Number.isFinite(x) && Number.isFinite(y))) return;
        const X = this.a * x + this.c * y + this.e, Y = this.b * x + this.d * y + this.f;
        if (!this.open) this._sub(X, Y);
        this.cx[this.ns - 1] = 0;
        this._pt(X, Y);
      }
      closePath() {
        if (!this.open || !this.ns) return;
        this.cl[this.ns - 1] = 1;
        this._sub(this.sx0, this.sy0);
      }
      quadraticCurveTo(cx, cy, x, y) {
        if (!(Number.isFinite(cx) && Number.isFinite(cy) && Number.isFinite(x) && Number.isFinite(y))) return;
        const X1 = this.a * cx + this.c * cy + this.e, Y1 = this.b * cx + this.d * cy + this.f;
        const X2 = this.a * x + this.c * y + this.e, Y2 = this.b * x + this.d * y + this.f;
        if (!this.open) this._sub(X1, Y1);
        this.cx[this.ns - 1] = 0;
        const X0 = this.px[this.n - 1], Y0 = this.py[this.n - 1];
        const ddx = X0 - 2 * X1 + X2, ddy = Y0 - 2 * Y1 + Y2, dd = Math.sqrt(ddx * ddx + ddy * ddy);
        const m = Math.min(256, Math.max(1, Math.ceil(Math.sqrt(dd / (4 * TL[0])))));
        for (let i = 1; i < m; i++) {
          const t = i / m, u = 1 - t, A = u * u, B = 2 * u * t, C = t * t;
          this._pt(A * X0 + B * X1 + C * X2, A * Y0 + B * Y1 + C * Y2);
        }
        this._pt(X2, Y2);
      }
      bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
        if (!(Number.isFinite(c1x) && Number.isFinite(c1y) && Number.isFinite(c2x) && Number.isFinite(c2y) && Number.isFinite(x) && Number.isFinite(y))) return;
        const X1 = this.a * c1x + this.c * c1y + this.e, Y1 = this.b * c1x + this.d * c1y + this.f;
        const X2 = this.a * c2x + this.c * c2y + this.e, Y2 = this.b * c2x + this.d * c2y + this.f;
        const X3 = this.a * x + this.c * y + this.e, Y3 = this.b * x + this.d * y + this.f;
        if (!this.open) this._sub(X1, Y1);
        this.cx[this.ns - 1] = 0;
        const X0 = this.px[this.n - 1], Y0 = this.py[this.n - 1];
        const ex = X0 - 2 * X1 + X2, ey = Y0 - 2 * Y1 + Y2, gx = X1 - 2 * X2 + X3, gy = Y1 - 2 * Y2 + Y3;
        const d1 = Math.sqrt(ex * ex + ey * ey), d2 = Math.sqrt(gx * gx + gy * gy);
        const m = Math.min(256, Math.max(1, Math.ceil(Math.sqrt((0.75 * Math.max(d1, d2)) / TL[0]))));
        for (let i = 1; i < m; i++) {
          const t = i / m, u = 1 - t, A = u * u * u, B = 3 * u * u * t, C = 3 * u * t * t, D = t * t * t;
          this._pt(A * X0 + B * X1 + C * X2 + D * X3, A * Y0 + B * Y1 + C * Y2 + D * Y3);
        }
        this._pt(X3, Y3);
      }
      arc(x, y, r, a0, a1, ccw) {
        if (r < 0) throw new DOMException('The radius provided is negative.', 'IndexSizeError');
        this.ellipse(x, y, r, r, 0, a0, a1, ccw);
      }
      ellipse(x, y, rx, ry, rot, a0, a1, ccw) {
        if (!(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(rx) && Number.isFinite(ry) && Number.isFinite(rot) && Number.isFinite(a0) && Number.isFinite(a1))) return;
        if (rx < 0 || ry < 0) throw new DOMException('The radius provided is negative.', 'IndexSizeError');
        let sweep;
        if (!ccw && a1 - a0 >= TAU) sweep = TAU;
        else if (ccw && a0 - a1 >= TAU) sweep = -TAU;
        else if (!ccw) { sweep = (a1 - a0) % TAU; if (sweep < 0) sweep += TAU; }
        else { sweep = (a0 - a1) % TAU; if (sweep < 0) sweep += TAU; sweep = -sweep; }
        const a = this.a, b = this.b, c = this.c, d = this.d, e = this.e, f = this.f;
        const s = Math.sqrt(Math.max(a * a + b * b, c * c + d * d)), R = Math.max(rx, ry) * s;
        let m;
        const tol = TL[0];
        if (R <= tol) m = 4;
        else { const dt = 2 * Math.acos(Math.max(-1, 1 - tol / R)); m = Math.ceil(Math.abs(sweep) / dt); }
        m = Math.min(512, Math.max(Math.abs(sweep) >= TAU - 1e-9 ? 8 : 1, m));
        const cr = Math.cos(rot), sr = Math.sin(rot), step = sweep / m, cd = Math.cos(step), sd = Math.sin(step);
        let co = Math.cos(a0), si = Math.sin(a0), fresh = false;
        for (let i = 0; i <= m; i++) {
          if (i === m) { co = Math.cos(a0 + sweep); si = Math.sin(a0 + sweep); }
          const ct = co * rx, st = si * ry;
          const ux = x + ct * cr - st * sr, uy = y + ct * sr + st * cr;
          const X = a * ux + c * uy + e, Y = b * ux + d * uy + f;
          if (i === 0) { if (this.open) { this._pt(X, Y); this.cx[this.ns - 1] = 0; } else { this._sub(X, Y); fresh = true; } } else this._pt(X, Y);
          const n = co * cd - si * sd; si = si * cd + co * sd; co = n;
        }

        if (fresh && Math.abs(sweep) >= TAU - 1e-9) this.cx[this.ns - 1] = 1;
      }
      rect(x, y, w, h) {
        if (!(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w) && Number.isFinite(h))) return;
        this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h); this.closePath();
      }
      roundRect(x, y, w, h) { this.rect(x, y, w, h); fail('roundRect'); }
      arcTo() { fail('arcTo'); }
      isPointInPath() { return false; }

      _blend() {
        if (this.opb < 0) { fail('composite ' + this.op); return 0; }
        return this.opb;
      }
      _paint(style, mul) {
        const al = this.ga * mul;
        if (style.t === 0) {
          const k = style.c, a = k[3] * al;
          EU[0] = pack(k[0] * a, k[1] * a, k[2] * a, a * 255); EU[1] = PT_SOLID; UVM = 0;
          return true;
        }
        if (style.t === 1 || style.t === 2) {
          const g = style.g;
          if (style.t === 1 && g.x0 === g.x1 && g.y0 === g.y1) { EU[0] = 0; EU[1] = PT_NONE; UVM = 0; return true; }
          const rec = paintRecord(g);
          EU[0] = pack(al * 255, al * 255, al * 255, al * 255); EU[1] = (style.t === 1 ? PT_LIN : PT_RAD) | (rec << 3); UVM = 1;
          const det = this.a * this.d - this.b * this.c;
          if (!det) { EU[1] = PT_NONE; UVM = 0; return true; }
          ES[3] = this.d / det; ES[4] = -this.b / det; ES[5] = -this.c / det; ES[6] = this.a / det;
          ES[7] = (this.c * this.f - this.d * this.e) / det; ES[8] = (this.b * this.e - this.a * this.f) / det;
          return true;
        }
        fail('pattern paint');
        return false;
      }

      fill(a, b) {
        if (a && typeof a === 'object') { fail('Path2D'); return; }
        const evenodd = a === 'evenodd' || b === 'evenodd';
        const blend = this._blend();
        if (!this._paint(this.fs, 1)) return;
        this._fillPath(blend, evenodd);
      }

      _collect(s) {
        const i0 = this.sub[s], i1 = s + 1 < this.ns ? this.sub[s + 1] : this.n;
        growScratch(i1 - i0 + 1);
        let n = 0, lx = NaN, ly = NaN;
        for (let i = i0; i < i1; i++) {
          const x = this.px[i], y = this.py[i];
          if (x === lx && y === ly) continue;
          SX[n] = x; SY[n] = y; n++; lx = x; ly = y;
        }
        while (n > 1 && SX[n - 1] === SX[0] && SY[n - 1] === SY[0]) n--;
        return n;
      }
      _fillPath(blend, evenodd) {
        if (!this.ns) return;
        nextZ();
        const pass = this.pass, sc = this.sc, clip = this.clp;
        const v0 = nv, i0 = ni;
        let mode = evenodd ? 2 : 0;
        let sign = 0, pre = -1;
        if (!mode) {
          for (let s = 0; s < this.ns; s++) {
            const n = this._collect(s);
            if (this.ns === 1) pre = n;
            if (n < 3) continue;
            let A = 0;
            for (let i = 0, j = n - 1; i < n; j = i++) A += SX[j] * SY[i] - SX[i] * SY[j];
            if (!A) continue;
            const sg = A > 0 ? 1 : -1;
            if (sign && sg !== sign) { mode = 2; break; }
            sign = sg;
          }
        }
        if (!mode) {
          useState(pass, blend, null, clip, sc);
          for (let s = 0; s < this.ns && !mode; s++) {
            let n = pre >= 0 ? pre : this._collect(s);
            if (n < 3) continue;
            if (sign < 0) for (let i = 0, j = n - 1; i < j; i++, j--) { let t = SX[i]; SX[i] = SX[j]; SX[j] = t; t = SY[i]; SY[i] = SY[j]; SY[j] = t; }

            let convex = true, turns = 0, px = 0, py = 0, fx = 0, fy = 0, lastdx = 0, lastdy = 0;
            for (let i = this.cx[s] ? n : 0; i < n && convex; i++) {
              const j = i + 1 < n ? i + 1 : 0, k = j + 1 < n ? j + 1 : 0;
              const ex = SX[j] - SX[i], ey = SY[j] - SY[i], gx = SX[k] - SX[j], gy = SY[k] - SY[j];
              if (ex * gy - ey * gx < -1e-9 * (Math.abs(ex) + Math.abs(ey)) * (Math.abs(gx) + Math.abs(gy))) convex = false;
              if (ex) { const sx = ex > 0 ? 1 : -1; if (lastdx && sx !== lastdx) px++; lastdx = sx; if (!fx) fx = sx; }
              if (ey) { const sy = ey > 0 ? 1 : -1; if (lastdy && sy !== lastdy) py++; lastdy = sy; if (!fy) fy = sy; }
            }
            if (lastdx && fx && lastdx !== fx) px++;
            if (lastdy && fy && lastdy !== fy) py++;
            if (px > 2 || py > 2) convex = false;
            void turns;
            const base = emit(SX, SY, 0, n);
            if (convex) { fan(base, n); continue; }
            let A = 0;
            for (let i = 0, j = n - 1; i < n; j = i++) A += SX[j] * SY[i] - SX[i] * SY[j];
            const ti = ni, got = earClip(n, base);
            if (got < 0 || Math.abs(got - A) > 1e-3 * Math.abs(A) + 1e-3) { mode = 2; void ti; }
          }
          if (!mode) return;
          nv = v0; ni = i0;
        }
        closeBatch();
        const first = ni;
        for (let s = 0; s < this.ns; s++) {
          const n = this._collect(s);
          if (n < 3) continue;
          fan(emit(SX, SY, 0, n), n);
        }
        if (ni > first) cmds.push({ k: K_SFILL, pass, blend, tex: null, clip, sc, first, count: ni - first, evenodd });
        bStart = ni;
      }

      stroke(a) {
        if (a && typeof a === 'object') { fail('Path2D'); return; }
        this._stroke(this);
      }
      _stroke(P) {
        if (!P.ns) return;
        const a = this.a, b = this.b, c = this.c, d = this.d;
        const det = a * d - b * c;
        if (!det) return;
        const sim = Math.abs(a * a + b * b - c * c - d * d) <= 1e-9 * (a * a + b * b + c * c + d * d) && Math.abs(a * c + b * d) <= 1e-9 * (a * a + b * b + c * c + d * d);
        const s = Math.sqrt(Math.abs(det));
        let wdev = this.lw * s, mul = 1;
        if (wdev < 1) { mul = wdev; wdev = 1; }
        const blend = this._blend();
        if (!this._paint(this.ss, mul)) return;
        nextZ();
        useState(this.pass, blend, null, this.clp, this.sc);

        SU = !sim;
        let hw;
        const ME = this.e, MF = this.f, IA2 = d / det, IB2 = -b / det, IC2 = -c / det, ID2 = a / det;
        if (sim) hw = wdev / 2;
        else {
          hw = (wdev / s) / 2;
          ES[9] = a; ES[10] = b; ES[11] = c; ES[12] = d; ES[13] = ME; ES[14] = MF;
        }
        const hwDev = sim ? hw : hw * s;
        ES[15] = hw; ES[16] = hwDev; ES[19] = this.miter; CAP = this.cap; JOIN = this.join;
        strokeWidth(hwDev);
        const dash = this.dash, dk = sim ? s : 1;
        for (let si = 0; si < P.ns; si++) {
          const i0 = P.sub[si], i1 = si + 1 < P.ns ? P.sub[si + 1] : P.n;
          if (i1 - i0 < 2 && !P.cl[si]) continue;
          growScratch(i1 - i0 + 2);
          let n = 0, lx = NaN, ly = NaN;
          for (let i = i0; i < i1; i++) {
            let x = P.px[i], y = P.py[i];
            if (!sim) { const X = x - ME, Y = y - MF; x = IA2 * X + IC2 * Y; y = IB2 * X + ID2 * Y; }
            if (x === lx && y === ly) continue;
            SX[n] = x; SY[n] = y; n++; lx = x; ly = y;
          }
          let closed = !!P.cl[si];
          if (closed && n > 1 && SX[n - 1] === SX[0] && SY[n - 1] === SY[0]) n--;
          if (n === 1) {
            if (i1 - i0 >= 2 || closed) dot(SX, SY, 0);
            continue;
          }
          if (dash) strokeDashed(n, closed, dash, this.dashOff * dk, dk);
          else strokeLine(SX, SY, 0, n, closed);
        }
        SU = false;
      }

      fillRect(x, y, w, h) {
        if (!(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w) && Number.isFinite(h)) || !w || !h) return;
        const blend = this._blend();
        if (!this._paint(this.fs, 1)) return;
        this._quad(x, y, w, h, blend);
      }
      _quad(x, y, w, h, blend) {
        nextZ();
        useState(this.pass, blend, null, this.clp, this.sc);
        const a = this.a, b = this.b, c = this.c, d = this.d, e = this.e, f = this.f;
        const x1 = x + w, y1 = y + h;
        QX[0] = a * x + c * y + e; QY[0] = b * x + d * y + f; QX[1] = a * x1 + c * y + e; QY[1] = b * x1 + d * y + f;
        QX[2] = a * x1 + c * y1 + e; QY[2] = b * x1 + d * y1 + f; QX[3] = a * x + c * y1 + e; QY[3] = b * x + d * y1 + f;
        const p = emit(QX, QY, 0, 4);
        tri(p, p + 1, p + 2); tri(p, p + 2, p + 3);
      }
      strokeRect(x, y, w, h) {
        if (!(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w) && Number.isFinite(h))) return;
        const T = tmpPath;
        T.a = this.a; T.b = this.b; T.c = this.c; T.d = this.d; T.e = this.e; T.f = this.f;
        T.beginPath(); T.rect(x, y, w, h);
        this._stroke(T);
      }
      clearRect(x, y, w, h) {
        if (!(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w) && Number.isFinite(h)) || !w || !h) return;
        EU[0] = 0; EU[1] = PT_SOLID; UVM = 0;
        this._quad(x, y, w, h, OP_CLEAR);
      }

      clip(a) {
        if (a && typeof a === 'object') { fail('Path2D clip'); return; }
        closeBatch();
        const first = ni;
        const sv = UVM; UVM = 0; EU[0] = 0; EU[1] = PT_SOLID;
        for (let s = 0; s < this.ns; s++) {
          const n = this._collect(s);
          if (n < 3) continue;
          fan(emit(SX, SY, 0, n), n);
        }
        UVM = sv;
        bStart = ni;
        this.clp = { parent: this.clp, first, count: ni - first, pass: this.pass, sc: this.sc };
      }

      drawImage(img, a1, a2, a3, a4, a5, a6, a7, a8) {
        let sx, sy, sw, sh, dx, dy, dw, dh;
        const L = img && img.__glLayer, SF = img && img.__glSurf;
        const iw = L || SF ? img.w : img.naturalWidth || img.videoWidth || img.width, ih = L || SF ? img.h : img.naturalHeight || img.videoHeight || img.height;
        if (!(iw > 0 && ih > 0)) return;
        const n = arguments.length;
        if (n === 3) { sx = 0; sy = 0; sw = iw; sh = ih; dx = a1; dy = a2; dw = iw; dh = ih; }
        else if (n === 5) { sx = 0; sy = 0; sw = iw; sh = ih; dx = a1; dy = a2; dw = a3; dh = a4; }
        else if (n === 9) { sx = a1; sy = a2; sw = a3; sh = a4; dx = a5; dy = a6; dw = a7; dh = a8; }
        else return;
        if (!(Number.isFinite(sx) && Number.isFinite(sy) && Number.isFinite(sw) && Number.isFinite(sh) && Number.isFinite(dx) && Number.isFinite(dy) && Number.isFinite(dw) && Number.isFinite(dh)) || !sw || !sh || !dw || !dh) return;
        if (sw < 0) { sx += sw; sw = -sw; } if (sh < 0) { sy += sh; sh = -sh; }
        if (dw < 0) { dx += dw; dw = -dw; } if (dh < 0) { dy += dh; dh = -dh; }

        const kx = dw / sw, ky = dh / sh;
        if (sx < 0) { dx -= sx * kx; dw += sx * kx; sw += sx; sx = 0; }
        if (sy < 0) { dy -= sy * ky; dh += sy * ky; sh += sy; sy = 0; }
        if (sx + sw > iw) { const o = sx + sw - iw; sw -= o; dw -= o * kx; }
        if (sy + sh > ih) { const o = sy + sh - ih; sh -= o; dh -= o * ky; }
        if (!(sw > 0 && sh > 0 && dw > 0 && dh > 0)) return;
        const blend = this._blend();
        let tex, u0, v0, u1, v1;
        if (L) {
          if (img.frame !== frameNo) { fail('stale layer'); return; }
          tex = LAYER_TEX;
          u0 = (img.x + sx) / AW; u1 = (img.x + sx + sw) / AW; v0 = 1 - (img.y + sy) / AH; v1 = 1 - (img.y + sy + sh) / AH;
        } else if (SF) {
          if (img.rec !== frameNo && !R.surfaceOk(img)) { fail('empty surface'); return; }
          tex = img.ent;
          u0 = sx / iw; u1 = (sx + sw) / iw; v0 = 1 - sy / ih; v1 = 1 - (sy + sh) / ih;
        } else {
          if (!img || typeof img.width !== 'number') { fail('image source'); return; }
          const e = imageEntry(img);
          tex = e;
          u0 = sx / iw; u1 = (sx + sw) / iw; v0 = sy / ih; v1 = (sy + sh) / ih;
        }
        const al = this.ga;
        EU[0] = pack(al * 255, al * 255, al * 255, al * 255); EU[1] = PT_TEX; UVM = 0;
        nextZ();
        useState(this.pass, blend, tex, this.clp, this.sc);
        const a = this.a, b = this.b, c = this.c, d = this.d, e = this.e, f = this.f;
        const x1 = dx + dw, y1 = dy + dh;
        QX[0] = a * dx + c * dy + e; QY[0] = b * dx + d * dy + f; QX[1] = a * x1 + c * dy + e; QY[1] = b * x1 + d * dy + f;
        QX[2] = a * x1 + c * y1 + e; QY[2] = b * x1 + d * y1 + f; QX[3] = a * dx + c * y1 + e; QY[3] = b * dx + d * y1 + f;
        QU[0] = u0; QV[0] = v0; QU[1] = u1; QV[1] = v0; QU[2] = u1; QV[2] = v1; QU[3] = u0; QV[3] = v1;
        const vb = emitUV4();
        if (L) layerQuads.push(vb);
      }

      drawSprite(s, dx, dy, dw, dh) {
        if (!R.spriteOk(s)) return;
        const p = s.page;
        p.used = frameNo;
        const blend = this._blend(), al = this.ga;
        EU[0] = pack(al * 255, al * 255, al * 255, al * 255); EU[1] = PT_TEX; UVM = 0;
        nextZ();
        useState(this.pass, blend, p, this.clp, this.sc);
        const a = this.a, b = this.b, c = this.c, d = this.d, e = this.e, f = this.f, x1 = dx + dw, y1 = dy + dh;
        QX[0] = a * dx + c * dy + e; QY[0] = b * dx + d * dy + f; QX[1] = a * x1 + c * dy + e; QY[1] = b * x1 + d * dy + f;
        QX[2] = a * x1 + c * y1 + e; QY[2] = b * x1 + d * y1 + f; QX[3] = a * dx + c * y1 + e; QY[3] = b * dx + d * y1 + f;
        QU[0] = s.u0; QV[0] = s.v0; QU[1] = s.u1; QV[1] = s.v0; QU[2] = s.u1; QV[2] = s.v1; QU[3] = s.u0; QV[3] = s.v1;
        emitUV4();
      }
      spriteBegin(w, h) { return R.spriteBegin(w, h); }
      spriteEnd() { return R.spriteEnd(); }
      spriteOk(s) { return R.spriteOk(s); }
      spriteOwner(o) { R.spriteOwner(o); }
      spriteRelease(o) { R.spriteRelease(o); }
      createLinearGradient(x0, y0, x1, y1) { return gradCtx().createLinearGradient(x0, y0, x1, y1); }
      createRadialGradient(x0, y0, r0, x1, y1, r1) { return gradCtx().createRadialGradient(x0, y0, r0, x1, y1, r1); }
      createPattern(img, rep) { return gradCtx().createPattern(img, rep); }

      measureText(t) { const m = measurer(); m.font = this.font; return m.measureText(t); }
      fillText(t, x, y, mw) { this._text(t, x, y, mw, false); }
      strokeText(t, x, y, mw) { this._text(t, x, y, mw, true); }
      _text(t, x, y, mw, stroke) {
        t = String(t);
        if (!t || !Number.isFinite(x) || !Number.isFinite(y)) return;
        const st = stroke ? this.ss : this.fs;
        if (st.t !== 0) { fail('gradient text'); return; }
        const a = this.a, b = this.b, c = this.c, d = this.d;
        const X = a * x + c * y + this.e, Y = b * x + d * y + this.f;



        const snap = R.textSnap, free = !snap && !!R.textFree;
        let ix = snap ? Math.round(X) : free ? X : Math.floor(X), fx = snap || free ? 0 : Math.round((X - ix) * 4) / 4;
        if (fx === 1) { ix++; fx = 0; }
        const iy = free ? Y : Math.round(Y);
        const col = st.c;











        if (R.textWarm) {
          if (!(snap || free) || R.textWarmFull) return;
          const m = FONT_PX.exec(this.font), px = m ? +m[1] : 0;
          const ak = m ? (stroke ? 'S' : 'F') + this.font.replace(m[0], '') + '|' + t + '|' + col.join(',') : '';
          const z = m ? textSizes.get(ak) : null;
          const q = px > 1 ? Math.round(Math.pow(2, Math.ceil(Math.log2(px) * 4 - 1e-6) / 4) * 4) / 4 : px;
          if (R.textWarm === 2 || !(q > px)) this._textPic(t, stroke, col, this.font, this.lw, mw, 0);


          if (q > px && (R.textWarm === 2 || !(z && z.px === px && (!stroke || z.lw === this.lw)))) { const k = px / q; this._textPic(t, stroke, col, this.font.replace(m[0], q + 'px'), this.lw / k, mw === undefined ? undefined : mw / k, 0); }
          if (m) { if (z) { z.px = px; z.until = 0; z.lw = this.lw; } else { if (textSizes.size > 512) textSizes.clear(); textSizes.set(ak, { px, until: 0, lw: this.lw }); } }
          return;
        }
        let font = this.font, lw = this.lw, mwq = mw, k = 1;
        if (snap || free) {
          const m = FONT_PX.exec(font);
          if (m) {
            const px = +m[1], ak = (stroke ? 'S' : 'F') + font.replace(m[0], '') + '|' + t + '|' + col.join(',');
            let z = textSizes.get(ak);
            if (!z) { if (textSizes.size > 512) textSizes.clear(); textSizes.set(ak, (z = { px, until: 0 })); }
            else if (z.px !== px) { z.px = px; z.until = frameNo + 30; }
            if (frameNo < z.until && px > 1) {
              const q = Math.round(Math.pow(2, Math.ceil(Math.log2(px) * 4 - 1e-6) / 4) * 4) / 4;
              if (q > px) { k = px / q; font = font.replace(m[0], q + 'px'); lw = lw / k; if (mw !== undefined) mwq = mw / k; }
            }
          }
        }
        const e = this._textPic(t, stroke, col, font, lw, mwq, fx);
        if (!e) return;
        const blend = this._blend(), al = this.ga;
        EU[0] = pack(al * 255, al * 255, al * 255, al * 255); EU[1] = PT_TEX; UVM = 0;
        nextZ();
        useState(this.pass, blend, TEXT_TEX, this.clp, this.sc);


        const ins = free ? 1 : 0;
        const x0 = ix - (e.ox - ins) * k, y0 = iy - (e.oy - ins) * k, qw = (e.w - 2 * ins) * k, qh = (e.h - 2 * ins) * k, u0 = (e.x + ins) / TA_W, v0 = (e.y + ins) / TA_H, u1 = (e.x + e.w - ins) / TA_W, v1 = (e.y + e.h - ins) / TA_H;
        QX[0] = x0; QY[0] = y0; QX[1] = x0 + qw; QY[1] = y0; QX[2] = x0 + qw; QY[2] = y0 + qh; QX[3] = x0; QY[3] = y0 + qh;
        QU[0] = u0; QV[0] = v0; QU[1] = u1; QV[1] = v0; QU[2] = u1; QV[2] = v1; QU[3] = u0; QV[3] = v1;
        emitUV4();
      }



      _textPic(t, stroke, col, font, lw, mwq, fx) {
        const a = this.a, b = this.b, c = this.c, d = this.d;


        if (!R.textSnap && R.textFree && stroke) lw = Math.max(0.5, Math.round(lw * 2) / 2);


        if (mwq !== undefined && !(metrics(t, font, this.align, this.baseline).width > mwq)) mwq = undefined;
        const key = (stroke ? 'S' : 'F') + font + '|' + this.align + '|' + this.baseline + '|' + (mwq === undefined ? '' : mwq) + '|' +
          col.join(',') + '|' + (stroke ? lw + this.join + '/' + this.miter : '') + '|' + a.toFixed(4) + ',' + b.toFixed(4) + ',' + c.toFixed(4) + ',' + d.toFixed(4) + '|' + fx + '|' + t;
        let e = texts.get(key);
        if (!e) {
          const tt = P ? now() : 0;
          const mt = metrics(t, font, this.align, this.baseline);
          let w0 = mt.width, sxk = 1;
          if (mwq !== undefined && mwq > 0 && w0 > mwq) { sxk = mwq / w0; }
          const pad = (stroke ? lw : 0) + 2;
          const l = -mt.actualBoundingBoxLeft * sxk - pad, r = mt.actualBoundingBoxRight * sxk + pad, tp = -mt.actualBoundingBoxAscent - pad, bt = mt.actualBoundingBoxDescent + pad;
          let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
          for (const [px, py] of [[l, tp], [r, tp], [r, bt], [l, bt]]) {
            const qx = a * px + c * py, qy = b * px + d * py;
            if (qx < minx) minx = qx; if (qx > maxx) maxx = qx; if (qy < miny) miny = qy; if (qy > maxy) maxy = qy;
          }
          const ox = Math.ceil(-minx) + 1, oy = Math.ceil(-miny) + 1;
          const w = Math.min(TA_W, Math.ceil(maxx + fx) + ox + 2), h = Math.min(TA_H, Math.ceil(maxy) + oy + 2);
          if (w <= 0 || h <= 0) return null;
          let r0 = textAlloc(w, h);
          if (!r0) {
            if (R.textWarm) { R.textWarmFull = true; return null; }


            textClear();
            if (P) P.textAtlasFull++;
            fail('text atlas full');
            return null;
          }
          const tc = textScratch(w, h);
          tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalAlpha = 1; tc.globalCompositeOperation = 'copy';
          tc.fillStyle = 'rgba(0,0,0,0)'; tc.fillRect(0, 0, w, h); tc.globalCompositeOperation = 'source-over';
          tc.setTransform(a, b, c, d, ox + fx, oy);
          tc.font = font; tc.textAlign = this.align; tc.textBaseline = this.baseline;
          const cs = `rgba(${col[0]},${col[1]},${col[2]},${col[3]})`;
          if (stroke) { tc.strokeStyle = cs; tc.lineWidth = lw; tc.lineJoin = JOIN_N[this.join]; tc.miterLimit = this.miter; if (mwq !== undefined) tc.strokeText(t, 0, 0, mwq); else tc.strokeText(t, 0, 0); }
          else { tc.fillStyle = cs; if (mwq !== undefined) tc.fillText(t, 0, 0, mwq); else tc.fillText(t, 0, 0); }
          e = { x: r0.x, y: r0.y, w, h, ox, oy, used: frameNo, shelf: r0.shelf };
          r0.shelf.keys.push(key);

          if (E.ready) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            if (R.textWarm && textRing.length === 3) {

              for (const T of textRing) { gl.bindTexture(gl.TEXTURE_2D, T); gl.texSubImage2D(gl.TEXTURE_2D, 0, e.x, e.y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas); }
              CNT.texUp += 2; CNT.texKB += (w * h) / 128;
            } else {
              gl.bindTexture(gl.TEXTURE_2D, textTex);
              gl.texSubImage2D(gl.TEXTURE_2D, 0, e.x, e.y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
              if (textRing.length === 3) {
                const px = tc.getImageData(0, 0, w, h).data, u = { x: e.x, y: e.y, w, h, px };
                for (let i = 1; i < 3; i++) textQ[(textCur + i) % 3].push(u);
              }
            }
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            textUploads++; CNT.texUp++; CNT.texts++; CNT.texKB += (w * h) / 256;
          }
          texts.set(key, e);
          if (P) { P.texts++; P.textPx += w * h; P.textMs += now() - tt; if (P.textWhy.length < 6) P.textWhy.push(P.stacks ? key : t.slice(0, 24) + ' ' + w + 'x' + h); }
        }
        e.used = frameNo; e.shelf.used = frameNo;
        return e;
      }



      layer(w, h, key) { return R.layer(w, h, key); }

      surface(key, w, h) { return R.surface(key, w, h); }
      surfaceOk(s) { return R.surfaceOk(s); }
    }



    let CAP = 0, JOIN = 0, STEPCAP = false;
    const SW = new Float64Array(1); SW[0] = -1;
    function strokeWidth(hwDev) {
      if (hwDev === SW[0]) return;
      SW[0] = hwDev;
      const tol = TL[0];
      if (hwDev <= tol) { ES[17] = 1.6; STEPCAP = false; } else { ES[17] = 2 * Math.acos(Math.max(-1, 1 - tol / hwDev)); STEPCAP = true; }
      ES[18] = Math.cos(ES[17]);
    }
    const WP = new Float64Array(8);

    function wedge() {
      const cx = WP[0], cy = WP[1], hw = ES[15], ang = WP[4];
      let m;
      if (WP[7]) m = 1;
      else { m = Math.ceil(Math.abs(ang) / ES[17]); if (m < 1) m = 1; if (STEPCAP && m > 128) m = 128; }
      let co = WP[2], si = WP[3];
      QX[0] = cx; QY[0] = cy; QX[1] = cx + co * hw; QY[1] = cy + si * hw;
      if (WP[7]) { QX[2] = cx + WP[5] * hw; QY[2] = cy + WP[6] * hw; }
      else {
        const cd = Math.cos(ang / m), sd = Math.sin(ang / m);
        for (let i = 1; i <= m; i++) {
          const n = co * cd - si * sd; si = si * cd + co * sd; co = n;
          QX[i + 1] = cx + co * hw; QY[i + 1] = cy + si * hw;
        }
      }
      const base = emit(QX, QY, 0, m + 2);
      if (ni + 3 * m > capI) growI(ni + 3 * m);
      for (let i = 1; i <= m; i++) { IX[ni++] = base; IX[ni++] = base + i; IX[ni++] = base + i + 1; }
    }

    function dot(X, Y, i) {
      const x = X[i], y = Y[i], hw = ES[15];
      if (CAP === 1) { WP[0] = x; WP[1] = y; WP[2] = 1; WP[3] = 0; WP[4] = TAU; WP[7] = 0; wedge(); }
      else if (CAP === 2) {
        QX[0] = x - hw; QY[0] = y - hw; QX[1] = x + hw; QY[1] = y - hw; QX[2] = x + hw; QY[2] = y + hw; QX[3] = x - hw; QY[3] = y + hw;
        const p = emit(QX, QY, 0, 4); tri(p, p + 1, p + 2); tri(p, p + 2, p + 3);
      }
    }

    let SQ = new Int32Array(1024);
    const RUN = new Int32Array(256);

    function strokeLine(X, Y, i0, n, closed) {
      const hw = ES[15], cap = CAP, join = JOIN;
      const segs = closed ? n : n - 1;
      if (SQ.length < segs) SQ = new Int32Array(Math.max(segs, SQ.length * 2));

      let q = 0;
      for (let s = 0; s < segs; s++) {
        const i = i0 + s, j = i0 + ((s + 1) % n);
        const x0 = X[i], y0 = Y[i], x1 = X[j], y1 = Y[j];
        let dx = x1 - x0, dy = y1 - y0; const L = Math.sqrt(dx * dx + dy * dy); if (!L) { SQ[s] = -1; continue; }
        dx /= L; dy /= L;
        const nx = -dy * hw, ny = dx * hw;
        let ex0 = 0, ey0 = 0, ex1 = 0, ey1 = 0;
        if (!closed && cap === 2) { if (s === 0) { ex0 = -dx * hw; ey0 = -dy * hw; } if (s === segs - 1) { ex1 = dx * hw; ey1 = dy * hw; } }
        QX[q] = x0 + nx + ex0; QY[q] = y0 + ny + ey0; QX[q + 1] = x0 - nx + ex0; QY[q + 1] = y0 - ny + ey0;
        QX[q + 2] = x1 + nx + ex1; QY[q + 2] = y1 + ny + ey1; QX[q + 3] = x1 - nx + ex1; QY[q + 3] = y1 - ny + ey1;
        RUN[q >> 2] = s;
        q += 4;
        if (q === 1024) { runQuads(q); q = 0; }
      }
      if (q) runQuads(q);

      const j0 = closed ? 0 : 1, j1 = closed ? n : n - 1;
      for (let k = j0; k < j1; k++) {
        const i = i0 + k, h = i0 + ((k - 1 + n) % n), j = i0 + ((k + 1) % n);
        let ax = X[i] - X[h], ay = Y[i] - Y[h], bx = X[j] - X[i], by = Y[j] - Y[i];
        const la = Math.sqrt(ax * ax + ay * ay), lb = Math.sqrt(bx * bx + by * by);
        if (!la || !lb) continue;
        ax /= la; ay /= la; bx /= lb; by /= lb;
        const cr = ax * by - ay * bx, dt = ax * bx + ay * by;
        if (Math.abs(cr) < 1e-9 && dt > 0) continue;
        const sg = cr > 0 ? -1 : 1;
        const n0x = -ay * sg, n0y = ax * sg, n1x = -by * sg, n1y = bx * sg;
        const cx = X[i], cy = Y[i];
        if (join === 1) {







          const single = Math.abs(cr) >= 1e-9 && n0x * n1x + n0y * n1y >= ES[18];
          if (single && hw * Math.abs(cr) <= lb) {
            const qa = SQ[k > 0 ? k - 1 : n - 1], qb = SQ[k];
            if (qa >= 0 && qb >= 0) {
              if (ni + 3 > capI) growI(ni + 3);

              if (sg > 0) { IX[ni++] = qa + 3; IX[ni++] = qa + 2; IX[ni++] = qb; } else { IX[ni++] = qa + 2; IX[ni++] = qa + 3; IX[ni++] = qb + 1; }
              continue;
            }
          }
          WP[0] = cx; WP[1] = cy; WP[2] = n0x; WP[3] = n0y;
          if (single) { WP[5] = n1x; WP[6] = n1y; WP[7] = 1; }
          else { WP[4] = Math.abs(cr) < 1e-9 ? Math.PI : Math.atan2(n0x * n1y - n0y * n1x, n0x * n1x + n0y * n1y); WP[7] = 0; }
          wedge();
        } else {
          QX[0] = cx; QY[0] = cy; QX[1] = cx + n0x * hw; QY[1] = cy + n0y * hw; QX[2] = cx + n1x * hw; QY[2] = cy + n1y * hw;
          const cosHalf = Math.sqrt(Math.max(0, (1 + dt) / 2));
          if (join === 0 && cosHalf > 1e-6 && 1 / cosHalf <= ES[19]) {
            let mx = n0x + n1x, my = n0y + n1y; const ml = Math.sqrt(mx * mx + my * my);
            mx /= ml; my /= ml;
            QX[3] = cx + mx * hw / cosHalf; QY[3] = cy + my * hw / cosHalf;
            const c0 = emit(QX, QY, 0, 4);
            tri(c0, c0 + 1, c0 + 3); tri(c0, c0 + 3, c0 + 2);
          } else { const c0 = emit(QX, QY, 0, 3); tri(c0, c0 + 1, c0 + 2); }
        }
      }

      if (!closed && cap === 1) {
        let dx = X[i0 + 1] - X[i0], dy = Y[i0 + 1] - Y[i0]; let L = Math.sqrt(dx * dx + dy * dy) || 1;
        WP[0] = X[i0]; WP[1] = Y[i0]; WP[2] = -dy / L; WP[3] = dx / L; WP[4] = Math.PI; WP[7] = 0; wedge();
        const e = i0 + n - 1;
        dx = X[e] - X[e - 1]; dy = Y[e] - Y[e - 1]; L = Math.sqrt(dx * dx + dy * dy) || 1;
        WP[0] = X[e]; WP[1] = Y[e]; WP[2] = dy / L; WP[3] = -dx / L; WP[4] = Math.PI; WP[7] = 0; wedge();
      }
    }

    function segQuads(q) {
      const base = emit(QX, QY, 0, q);
      if (ni + q * 3 / 2 > capI) growI(ni + q * 3 / 2);
      for (let p = base, e = base + q; p < e; p += 4) { IX[ni++] = p; IX[ni++] = p + 1; IX[ni++] = p + 2; IX[ni++] = p + 2; IX[ni++] = p + 1; IX[ni++] = p + 3; }
      return base;
    }

    function runQuads(q) {
      const base = segQuads(q);
      for (let t = 0, m = q >> 2; t < m; t++) SQ[RUN[t]] = base + 4 * t;
    }
    function strokeDashed(n, closed, dash, off, dk) {

      let total = 0;
      for (let i = 0; i < dash.length; i++) total += dash[i] * dk;
      if (!(total > 0)) { strokeLine(SX, SY, 0, n, closed); return; }
      let pos = ((off % total) + total) % total, di = 0;
      while (pos >= dash[di] * dk) { pos -= dash[di] * dk; di = (di + 1) % dash.length; }
      let left = dash[di] * dk - pos, on = !(di & 1), m = 0;
      const segs = closed ? n : n - 1;
      if (on) { TX[0] = SX[0]; TY[0] = SY[0]; m = 1; }
      for (let s = 0; s < segs; s++) {
        const x0 = SX[s], y0 = SY[s], x1 = SX[(s + 1) % n], y1 = SY[(s + 1) % n];
        const L = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
        let t = 0;
        while (L - t > left) {
          t += left;
          const x = x0 + ((x1 - x0) * t) / L, y = y0 + ((y1 - y0) * t) / L;
          if (on) { TX[m] = x; TY[m] = y; m++; emitDash(m); m = 0; }
          else { TX[0] = x; TY[0] = y; m = 1; }
          on = !on; di = (di + 1) % dash.length; left = dash[di] * dk;
        }
        left -= L - t;
        if (on) { if (m >= TX.length - 1) { emitDash(m); TX[0] = TX[m - 1]; TY[0] = TY[m - 1]; m = 1; } TX[m] = x1; TY[m] = y1; m++; }
      }
      if (on && m > 1) emitDash(m);
    }
    function emitDash(m) {

      let k = 0;
      for (let i = 0; i < m; i++) { if (k && TX[i] === TX[k - 1] && TY[i] === TY[k - 1]) continue; TX[k] = TX[i]; TY[k] = TY[i]; k++; }
      if (k === 1) { dot(TX, TY, 0); return; }
      strokeLine(TX, TY, 0, k, false);
    }
    let gctx = null;
    function gradCtx() { return gctx || (gctx = document.createElement('canvas').getContext('2d')); }
    const tmpPath = new Ctx(1, null, 1, 1);
    const LAYER_TEX = { layer: true }, TEXT_TEX = { text: true };


    let main = null;
    R.layer = function (w, h, key) {
      w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h));
      let r = layerAlloc(w, h);



      for (let k = 0; !r && k < 4 && (AW < 4096 || AH < 4096); k++) {
        const ow = AW, oh = AH;
        const nw = Math.max(AW <= AH ? Math.min(4096, AW * 2) : AW, Math.min(4096, Math.ceil((w + 4) / 64) * 64));
        const nh = Math.max(AW > AH ? Math.min(4096, AH * 2) : AH, Math.min(4096, Math.ceil((h + 4) / 64) * 64));
        if (nw === AW && nh === AH) break;
        AW = wantAW = nw; AH = wantAH = nh; R._layerResize = true;
        const kx = ow / AW, ky = oh / AH;
        for (const b of layerQuads) for (let i = 0, o = b * STRIDE; i < 4; i++, o += STRIDE) { VF[o + 3] *= kx; VF[o + 4] = 1 - (1 - VF[o + 4]) * ky; }
        if (P) P.layerRegrow++;
        r = layerAlloc(w, h);
      }
      if (!r) {

        if (AW <= AH) wantAW = Math.min(4096, AW * 2); else wantAH = Math.min(4096, AH * 2);
        wantAW = Math.max(wantAW, Math.min(4096, Math.ceil((w + 4) / 64) * 64)); wantAH = Math.max(wantAH, Math.min(4096, Math.ceil((h + 4) / 64) * 64));
        if (P) P.layerRegrow++;
        fail('layer atlas too small');
        return null;
      }
      let cx = key != null ? layerCtxs.get(key) : null;
      if (!cx) { cx = new Ctx(0, null, w, h); if (key != null) layerCtxs.set(key, cx); }
      cx.sc = r; cx._canvas = { width: w, height: h }; cx.W = w; cx.H = h;
      cx.clp = null; cx.sp = 0; cx.beginPath();
      return { __glLayer: true, x: r.x, y: r.y, w, h, width: w, height: h, frame: frameNo, ctx: cx };
    };





    const surfaces = new Map();
    let surfPass = 2, surfRec = [], gen = 0;
    R.surface = function (key, w, h) {
      w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h));
      let sf = surfaces.get(key);
      if (!sf) {
        const pass = surfPass++;
        sf = { __glSurf: true, key, pass, w, h, width: w, height: h, rec: -1, done: -1, gen: -1, ctx: null,
          ent: { get tex() { const t = targets[pass]; return t ? t.tex : null; } } };
        surfaces.set(key, sf);
      }
      sf.w = sf.width = w; sf.h = sf.height = h;
      const cx = sf.ctx || (sf.ctx = new Ctx(sf.pass, null, w, h));
      cx.W = w; cx.H = h; cx._canvas = { width: w, height: h };
      cx.reset(); cx.beginPath();
      if (sf.rec !== frameNo) { sf.rec = frameNo; surfRec.push(sf); }
      return sf;
    };
    R.surfaceOk = (sf) => !!sf && sf.gen === gen && sf.done >= 0 && sf.done === sf.rec && !!targets[sf.pass];

    const origPaint = Ctx.prototype._paint;
    Ctx.prototype._paint = function (style, mul) {
      if (this.pass === 0) { ES[1] = this.sc.x; ES[2] = this.sc.y; } else { ES[1] = 0; ES[2] = 0; }
      return origPaint.call(this, style, mul);
    };
    for (const k of ['clip', 'clearRect', 'drawImage', 'drawSprite', '_text']) {
      const o = Ctx.prototype[k];
      Ctx.prototype[k] = function () {
        if (this.pass === 0) { ES[1] = this.sc.x; ES[2] = this.sc.y; } else { ES[1] = 0; ES[2] = 0; }
        return o.apply(this, arguments);
      };
    }

    function textTurn() {
      const want = !!R.textRing && E.ready;
      if (want !== (textRing.length === 3)) {

        if (textRing.length) { textTex = textRing[0]; for (let i = 1; i < textRing.length; i++) gl.deleteTexture(textRing[i]); }
        textRing = want ? [textTex, tex2d(TA_W, TA_H, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR, null), tex2d(TA_W, TA_H, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR, null)] : [];
        textCur = 0; textClear();
      }
      if (textRing.length !== 3) return;
      textCur = (textCur + 1) % 3; textTex = textRing[textCur];
      const q = textQ[textCur];
      if (!q.length) return;
      gl.bindTexture(gl.TEXTURE_2D, textTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      for (const u of q) { gl.texSubImage2D(gl.TEXTURE_2D, 0, u.x, u.y, u.w, u.h, gl.RGBA, gl.UNSIGNED_BYTE, u.px); CNT.texUp++; CNT.texKB += (u.w * u.h) / 256; }
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      q.length = 0;
    }
    R.begin = function (W, H) {
      frameNo++;
      nv = 0; ni = 0; np = 0; zc = 0; cmds = []; bPass = -1; bStart = 0; bBlend = -1; bTex = null; bClip = null; bSc = null;
      surfRec.length = 0;
      R.unsupported = '';


      profReset();

      if (W !== R.W || H !== R.H) {
        wantAW = Math.max(wantAW, Math.min(2048, Math.max(512, Math.ceil((W * 0.8) / 64) * 64)));
        wantAH = Math.max(wantAH, Math.min(2048, Math.max(512, Math.ceil(H / 64) * 64 + 64)));
      }
      if (AW !== wantAW || AH !== wantAH) { AW = wantAW; AH = wantAH; R._layerResize = true; }
      shelfX = shelfY = shelfH = usedW = usedH = 0; layerQuads.length = 0;
      textTurn();
      if (!main) main = new Ctx(1, null, W, H);
      main.W = W; main.H = H; main._canvas = { width: W, height: H };
      main.clp = null; main.sp = 0; main.beginPath();
      R.W = W; R.H = H;
      return main;
    };
    R.finish = function () {
      closeBatch();
      return { vertices: nv, indices: ni, commands: cmds.length, paints: np, layersUsed: usedW * usedH };
    };
    R.main = () => main;

    R.setTolerance = function (t) {
      t = t > 0.05 && t < 2 ? +t : TOL0;
      if (t !== TL[0]) { TL[0] = t; SW[0] = -1; }
    };
    R.tolerance = () => TL[0];


    R.textSnap = false;
    R.textFree = false;


    R.spriteBias = 0;

    const TIMED = ['_fillPath', '_stroke', 'clip'], untimed = {};


    let timedOn = false;
    R.profile = function (on, opts = {}) {
      if (on && !P) { P = R.prof = { imgWhy: [], textWhy: [], stacks: false }; profReset(); }
      const tess = !!P && on && opts.tess !== false;
      if (tess && !timedOn) {
        for (const k of TIMED) {
          const o = untimed[k] = Ctx.prototype[k];
          Ctx.prototype[k] = function () { const t = now(); try { return o.apply(this, arguments); } finally { P.tessMs += now() - t; P.tessCalls++; } };
        }
        timedOn = true;
      } else if (!tess && timedOn) { for (const k of TIMED) Ctx.prototype[k] = untimed[k]; timedOn = false; }
      if (!on && P) P = R.prof = null;
      if (P) P.stacks = !!opts.stacks;
    };

    R.indexCount = () => ni;
    R.dump = () => {
      const xy = new Float64Array(nv * 2);
      const uv = new Float64Array(nv * 2);
      for (let i = 0; i < nv; i++) { xy[i * 2] = VF[i * STRIDE]; xy[i * 2 + 1] = VF[i * STRIDE + 1]; uv[i * 2] = VF[i * STRIDE + 3]; uv[i * 2 + 1] = VF[i * STRIDE + 4]; }
      return { xy, uv, idx: Array.from(IX.subarray(0, ni)), cmds: cmds.map((c) => ({ k: c.k === K_DRAW ? 'draw' : c.k === K_SFILL ? 'stencil-fill' : 'clip', pass: c.pass, blend: c.blend, first: c.first, count: c.count, clip: !!c.clip })) };
    };


    const E = R.exec = {};
    let paintRing = [], paintI = 0;
    let emptyTex = null, prog = null, vao = null, rampTex = null, paintTex = null, textTex = null, quadProg = null, quadVao = null, quadBuf = null;
    let U = {};
    const targets = { 0: null, 1: null };
    E.samples = 0;
    const VS = `#version 300 es
      layout(location=0) in vec2 a_pos; layout(location=1) in float a_z; layout(location=2) in vec2 a_uv;
      layout(location=3) in vec4 a_col; layout(location=4) in uint a_paint;
      uniform vec2 u_view;
      out vec2 v_uv; out vec4 v_col; flat out uint v_paint;
      void main(){ v_uv=a_uv; v_col=a_col; v_paint=a_paint; gl_Position=vec4(a_pos.x*u_view.x-1.0, 1.0-a_pos.y*u_view.y, a_z, 1.0); }`;
    const FS = `#version 300 es
      precision highp float; precision highp int;
      in vec2 v_uv; in vec4 v_col; flat in uint v_paint;
      uniform sampler2D u_tex; uniform sampler2D u_ramp; uniform highp sampler2D u_paint; uniform float u_rampH; uniform float u_bias;
      out vec4 o;
      void main(){
        uint t = v_paint & 7u;
        if (t == 0u) { o = v_col; return; }
        if (t == 3u) { o = texture(u_tex, v_uv, u_bias) * v_col; return; }
        if (t == 4u) { o = vec4(0.0); return; }
        int idx = int(v_paint >> 3u);
        vec4 A = texelFetch(u_paint, ivec2(0, idx), 0), B = texelFetch(u_paint, ivec2(1, idx), 0);
        float s;
        if (t == 1u) {
          vec2 d = A.zw - A.xy; s = dot(v_uv - A.xy, d) / dot(d, d);
        } else {
          vec2 cd = A.zw - A.xy, pd = v_uv - A.xy; float r0 = B.x, dr = B.y - B.x;
          float a = dot(cd, cd) - dr * dr, b = dot(pd, cd) + r0 * dr, c = dot(pd, pd) - r0 * r0;
          if (abs(a) < 1e-6 * max(1.0, dot(cd, cd) + dr * dr)) {
            if (abs(b) < 1e-12) { o = vec4(0.0); return; }
            s = c / (2.0 * b);
            if (r0 + s * dr < 0.0) { o = vec4(0.0); return; }
          } else {
            float disc = b * b - a * c;
            if (disc < 0.0) { o = vec4(0.0); return; }
            float q = sqrt(disc), w1 = (b + q) / a, w2 = (b - q) / a;
            float hi = max(w1, w2), lo = min(w1, w2);
            if (r0 + hi * dr >= 0.0) s = hi; else if (r0 + lo * dr >= 0.0) s = lo; else { o = vec4(0.0); return; }
          }
        }
        s = clamp(s, 0.0, 1.0);
        vec4 c = texture(u_ramp, vec2((s * 255.0 + 0.5) / 256.0, (B.z + 0.5) / u_rampH));
        o = vec4(c.rgb * c.a, c.a) * v_col;
      }`;
    const QVS = `#version 300 es
      layout(location=0) in vec2 a_pos; void main(){ gl_Position=vec4(a_pos,0.0,1.0); }`;
    const QFS = `#version 300 es
      precision mediump float; out vec4 o; void main(){ o=vec4(0.0); }`;
    function compile(vs, fs, binds) {
      const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); CNT.shaders++; if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const l = gl.getShaderInfoLog(s); gl.deleteShader(s); throw Error('shader: ' + l); } return s; };
      const v = mk(gl.VERTEX_SHADER, vs), f = mk(gl.FRAGMENT_SHADER, fs), p = gl.createProgram();
      gl.attachShader(p, v); gl.attachShader(p, f);
      if (binds) binds(p);
      gl.linkProgram(p);
      gl.deleteShader(v); gl.deleteShader(f);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw Error('link: ' + gl.getProgramInfoLog(p));
      return p;
    }
    E.compile = compile;
    const ring = [];
    let ringI = 0;

    function ringSize(o, v, i) {
      if (o.vcap < v) { o.vcap = v; gl.bindBuffer(gl.ARRAY_BUFFER, o.vbo); gl.bufferData(gl.ARRAY_BUFFER, v * STRIDE * 4, gl.DYNAMIC_DRAW); if (P) P.bufAlloc++; }
      if (o.icap < i) { o.icap = i; gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, i * 4, gl.DYNAMIC_DRAW); if (P) P.bufAlloc++; }
    }
    function tex2d(w, h, internal, format, type, filter, data) {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); CNT.texNew++;
      if (data) { CNT.texUp++; CNT.texKB += (w * h * (type === gl.FLOAT ? 16 : 4)) / 1024; }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data || null);
      return t;
    }
    E.tex2d = tex2d;

    E.init = function () {
      prog = compile(VS, FS);
      U = { view: gl.getUniformLocation(prog, 'u_view'), tex: gl.getUniformLocation(prog, 'u_tex'), ramp: gl.getUniformLocation(prog, 'u_ramp'),
        paint: gl.getUniformLocation(prog, 'u_paint'), rampH: gl.getUniformLocation(prog, 'u_rampH'), bias: gl.getUniformLocation(prog, 'u_bias') };
      quadProg = compile(QVS, QFS);


      ring.length = 0; ringI = 0;
      for (let r = 0; r < 3; r++) {
        const o = { vao: gl.createVertexArray(), vbo: gl.createBuffer(), ibo: gl.createBuffer(), vcap: 0, icap: 0 };
        gl.bindVertexArray(o.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, o.vbo); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.ibo);
        const S = STRIDE * 4;
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, S, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, S, 8);
        gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, S, 12);
        gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, S, 20);
        gl.enableVertexAttribArray(4); gl.vertexAttribIPointer(4, 1, gl.UNSIGNED_INT, S, 24);
        ringSize(o, capV, capI);
        ring.push(o);
      }
      vao = ring[0].vao;
      gl.bindVertexArray(null);
      quadVao = gl.createVertexArray(); gl.bindVertexArray(quadVao);
      quadBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
      gl.bindVertexArray(null);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      rampTex = tex2d(RAMP_W, RAMP_ROWS, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR, rampData);


      paintRing = [0, 1, 2].map(() => tex2d(2, PAINT_ROWS, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST, null)); paintI = 0;
      paintTex = paintRing[0];
      textTex = tex2d(TA_W, TA_H, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR, null); textRing = []; textCur = 0; for (const q of textQ) q.length = 0;
      emptyTex = tex2d(1, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST, new Uint8Array(4));
      const max = gl.getParameter(gl.MAX_SAMPLES) | 0;
      E.samples = Math.max(0, Math.min(wantSamples, max));
      if (E.samples === 1) E.samples = 0;
      E.maxSamples = max;
      for (const k in targets) targets[k] = null;
      gen++; surfRec.length = 0;
      for (const e of images.values()) { e.tex = null; e.v = -1; e.pending = false; }
      images.clear(); pendingUploads = [];
      textClear(); textUploads = 0;
      for (const p of spPages) { p.gen = -1; p.tex = null; } spPages.length = 0;
      ramps.clear(); rampFree = []; for (let i = RAMP_ROWS - 1; i >= 0; i--) rampFree.push(i); rampDirty = [];
      E.ready = true;
    };


    E.layerSamples = null;
    E.setLayerSamples = function (n) {
      const v = n == null ? null : Math.max(0, Math.min(n | 0, E.maxSamples | 0));
      E.layerSamples = v === 1 ? 0 : v;
    };
    E.setSamples = function (n) { wantSamples = n | 0; if (E.ready) { const max = E.maxSamples | 0; E.samples = Math.max(0, Math.min(wantSamples, max)); if (E.samples === 1) E.samples = 0; freeTarget(0); freeTarget(1); } };
    function freeTarget(i) {
      const t = targets[i]; if (!t) return;
      for (const k of ['fbMS', 'fbTex']) if (t[k]) gl.deleteFramebuffer(t[k]);
      for (const k of ['rbColor', 'rbDS']) if (t[k]) gl.deleteRenderbuffer(t[k]);
      if (t.tex) gl.deleteTexture(t.tex);
      targets[i] = null;
    }


    function target(i, w, h, ns = E.samples) {
      let t = targets[i];
      if (t && t.w === w && t.h === h && t.samples === ns) return t;
      freeTarget(i);
      if (P) P.targetsNew++;
      CNT.targets++;
      t = { w, h, samples: ns };
      t.tex = tex2d(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR, null);
      t.fbTex = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbTex);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
      t.rbDS = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, t.rbDS);
      if (t.samples) {
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, t.samples, gl.DEPTH24_STENCIL8, w, h);
        t.rbColor = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, t.rbColor);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, t.samples, gl.RGBA8, w, h);
        t.fbMS = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbMS);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, t.rbColor);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, t.rbDS);
      } else {
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, w, h);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, t.rbDS);
      }
      const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (st !== gl.FRAMEBUFFER_COMPLETE) throw Error('incomplete framebuffer ' + st);
      targets[i] = t;
      return t;
    }
    E.target = target;
    const BL = [];
    function blendOf(i) {
      if (BL.length) return BL[i];
      const g = gl;

      BL.push([g.ONE, g.ONE_MINUS_SRC_ALPHA, g.ONE, g.ONE_MINUS_SRC_ALPHA], [g.ONE, g.ONE, g.ONE, g.ONE],
        [g.DST_ALPHA, g.ONE_MINUS_SRC_ALPHA, g.ZERO, g.ONE], [g.ONE_MINUS_DST_ALPHA, g.ONE, g.ONE_MINUS_DST_ALPHA, g.ONE],
        [g.DST_ALPHA, g.ZERO, g.DST_ALPHA, g.ZERO], [g.ZERO, g.SRC_ALPHA, g.ZERO, g.SRC_ALPHA],
        [g.ZERO, g.ONE_MINUS_SRC_ALPHA, g.ZERO, g.ONE_MINUS_SRC_ALPHA], [g.ONE, g.ONE_MINUS_SRC_COLOR, g.ONE, g.ONE_MINUS_SRC_ALPHA],
        [g.DST_COLOR, g.ONE_MINUS_SRC_ALPHA, g.ONE, g.ONE_MINUS_SRC_ALPHA], [g.ONE, g.ZERO, g.ONE, g.ZERO], [g.ZERO, g.ZERO, g.ZERO, g.ZERO]);
      return BL[i];
    }
    function uploadImage(e) {
      const t0 = P ? now() : 0;
      uploadImage0(e);
      if (P) { P.imgUploads++; P.imgPx += e.w * e.h; P.imgMs += now() - t0; }
    }
    function uploadImage0(e) {
      e.pending = false;
      const src = e.src;
      if (!e.tex || e.w !== e.nw || e.h !== e.nh) {
        if (e.tex) gl.deleteTexture(e.tex);
        e.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, e.tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
        e.w = e.nw; e.h = e.nh;
        R.stats.uploads++; CNT.texNew++; CNT.texUp++; CNT.texKB += (e.w * e.h) / 256;
      } else {
        gl.bindTexture(gl.TEXTURE_2D, e.tex);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, src);
        R.stats.uploads++; CNT.texUp++; CNT.texKB += (e.w * e.h) / 256;
      }
      e.v = e.nv;
    }


    function sweepImages() {
      for (const [k, e] of images) if (frameNo - e.used > 600 && !(k.__glKeep && k.width > 0)) { if (e.tex) gl.deleteTexture(e.tex); images.delete(k); }
    }

    E.run = function () {
      const t0 = P ? now() : 0;
      run0();
      if (P) P.runMs += now() - t0;
      return targets[1].tex;
    };
    function run0() {
      const st = R.stats = { draws: 0, stencilFills: 0, clips: 0, uploads: 0, passes: 0, vertices: nv, indices: ni, paints: np };
      if (R._layerResize) { R._layerResize = false; freeTarget(0); }
      gl.disable(gl.DITHER); gl.disable(gl.CULL_FACE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      for (const e of pendingUploads) uploadImage(e);
      pendingUploads = [];
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      st.uploads += textUploads; textUploads = 0;
      if (rampDirty.length) {
        gl.bindTexture(gl.TEXTURE_2D, rampTex);
        for (const row of rampDirty) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, row, RAMP_W, 1, gl.RGBA, gl.UNSIGNED_BYTE, rampData, row * RAMP_W * 4);
        CNT.texUp += rampDirty.length; CNT.texKB += rampDirty.length;
        if (P) P.rampRows += rampDirty.length;
        rampDirty = [];
      }
      if (np) { paintI = (paintI + 1) % paintRing.length; paintTex = paintRing[paintI]; gl.bindTexture(gl.TEXTURE_2D, paintTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 2, np, gl.RGBA, gl.FLOAT, paintData, 0); }
      const tb = P ? now() : 0;
      ringI = (ringI + 1) % ring.length;
      const rb = ring[ringI];
      vao = rb.vao;
      gl.bindVertexArray(vao);
      if (rb.vcap < nv || rb.icap < ni) ringSize(rb, Math.max(rb.vcap, capV), Math.max(rb.icap, capI));
      gl.bindBuffer(gl.ARRAY_BUFFER, rb.vbo);
      if (nv) gl.bufferSubData(gl.ARRAY_BUFFER, 0, VU, 0, nv * STRIDE);
      if (ni) gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, IX, 0, ni);
      if (P) { P.bufMs += now() - tb; P.bufBytes += nv * STRIDE * 4 + ni * 4; }
      gl.useProgram(prog);
      gl.uniform1i(U.tex, 0); gl.uniform1i(U.ramp, 1); gl.uniform1i(U.paint, 2); gl.uniform1f(U.rampH, RAMP_ROWS); gl.uniform1f(U.bias, R.spriteBias || 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, rampTex);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, paintTex);
      gl.activeTexture(gl.TEXTURE0);
      let hasLayers = false;
      for (const c of cmds) if (c.pass === 0) { hasLayers = true; break; }
      if (hasLayers) runPass(0, AW, AH, usedW, usedH, E.layerSamples == null ? E.samples : E.layerSamples);



      const sns = Math.min(4, E.maxSamples | 0) > 1 ? Math.min(4, E.maxSamples | 0) : 0;
      for (const sf of surfRec) { runPass(sf.pass, sf.w, sf.h, sf.w, sf.h, sns); sf.done = sf.rec; sf.gen = gen; CNT.surfaces++; }
      surfRec.length = 0;
      runPass(1, R.W, R.H, R.W, R.H);
      gl.bindVertexArray(null);
      sweepImages();
    }
    function runPass(pass, w, h, uw, uh, ns) {
      const t = target(pass, w, h, ns), st = R.stats;
      st.passes++;
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.samples ? t.fbMS : t.fbTex);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.SCISSOR_TEST);
      gl.colorMask(true, true, true, true); gl.depthMask(true); gl.stencilMask(0xff);
      gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clearStencil(0x80);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS);
      gl.enable(gl.STENCIL_TEST); gl.stencilFunc(gl.EQUAL, 0x80, 0x80); gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); gl.stencilMask(0);
      gl.enable(gl.BLEND);
      gl.useProgram(prog);
      gl.uniform2f(U.view, 2 / w, 2 / h);

      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, emptyTex);
      let curBlend = -1, curTex = null, curSc;
      const built = new Map();
      const setSc = (sc) => {
        if (sc === curSc) return;
        curSc = sc;
        if (sc) { gl.enable(gl.SCISSOR_TEST); gl.scissor(sc.x, h - sc.y - sc.h, sc.w, sc.h); } else gl.disable(gl.SCISSOR_TEST);
      };
      curSc = undefined; setSc(null);
      for (const c of cmds) {
        if (c.pass !== pass) continue;
        setSc(c.sc);
        const sk = c.sc || 'main';
        if ((built.get(sk) || null) !== c.clip) { buildClip(c.clip, h, c.sc); built.set(sk, c.clip); gl.useProgram(prog); gl.bindVertexArray(vao); }
        if (c.blend !== curBlend) { curBlend = c.blend; const b = blendOf(c.blend); gl.blendFuncSeparate(b[0], b[1], b[2], b[3]); }
        if (c.tex !== curTex) {
          curTex = c.tex;
          if (c.tex === LAYER_TEX) gl.bindTexture(gl.TEXTURE_2D, targets[0] ? targets[0].tex : null);
          else if (c.tex === TEXT_TEX) gl.bindTexture(gl.TEXTURE_2D, textTex);
          else if (c.tex) gl.bindTexture(gl.TEXTURE_2D, c.tex.tex);
          else gl.bindTexture(gl.TEXTURE_2D, emptyTex);
        }
        if (c.k === K_DRAW) { gl.drawElements(gl.TRIANGLES, c.count, gl.UNSIGNED_INT, c.first * 4); st.draws++; }
        else if (c.k === K_CUSTOM) {
          setSc(c.sc);
          gl.disable(gl.STENCIL_TEST); gl.disable(gl.BLEND);
          gl.depthMask(true); gl.clearDepth(1); gl.clear(gl.DEPTH_BUFFER_BIT);
          try { c.fn(gl, w, h); } catch (e) { fail('custom: ' + (e && e.message)); }
          gl.depthMask(true); gl.clearDepth(1); gl.clear(gl.DEPTH_BUFFER_BIT);
          gl.disable(gl.CULL_FACE); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.enable(gl.BLEND); gl.enable(gl.STENCIL_TEST);
          gl.colorMask(true, true, true, true);
          gl.stencilFunc(gl.EQUAL, 0x80, 0x80); gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); gl.stencilMask(0);
          gl.useProgram(prog); gl.bindVertexArray(vao);
          gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, rampTex);
          gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, paintTex);
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, emptyTex);
          gl.bindBuffer(gl.ARRAY_BUFFER, ring[ringI].vbo);
          gl.viewport(0, 0, w, h);
          curBlend = -1; curTex = null; curSc = undefined; setSc(c.sc);
          st.draws++;
        }
        else if (c.k === K_SFILL) {
          st.stencilFills++;
          gl.colorMask(false, false, false, false); gl.depthMask(false); gl.disable(gl.DEPTH_TEST);
          gl.stencilFunc(gl.EQUAL, 0x80, 0x80);
          if (c.evenodd) { gl.stencilOp(gl.KEEP, gl.KEEP, gl.INVERT); gl.stencilMask(0x01); }
          else { gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.KEEP, gl.INCR_WRAP); gl.stencilOpSeparate(gl.BACK, gl.KEEP, gl.KEEP, gl.DECR_WRAP); gl.stencilMask(0x7f); }
          gl.drawElements(gl.TRIANGLES, c.count, gl.UNSIGNED_INT, c.first * 4);
          gl.colorMask(true, true, true, true); gl.depthMask(true); gl.enable(gl.DEPTH_TEST);
          gl.stencilFunc(gl.LESS, 0x80, 0xff); gl.stencilOp(gl.KEEP, gl.ZERO, gl.ZERO); gl.stencilMask(0x7f);
          gl.drawElements(gl.TRIANGLES, c.count, gl.UNSIGNED_INT, c.first * 4);
          gl.stencilFunc(gl.EQUAL, 0x80, 0x80); gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); gl.stencilMask(0);
          st.draws += 2;
        }
      }
      gl.disable(gl.SCISSOR_TEST); gl.disable(gl.STENCIL_TEST); gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      gl.stencilMask(0xff);
      if (t.samples) {


        gl.invalidateFramebuffer(gl.FRAMEBUFFER, DS_ATT);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, t.fbMS); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, t.fbTex);
        const y0 = h - uh;
        gl.blitFramebuffer(0, y0, uw, h, 0, y0, uw, h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
        gl.invalidateFramebuffer(gl.READ_FRAMEBUFFER, COLOR_ATT);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      } else {
        gl.invalidateFramebuffer(gl.FRAMEBUFFER, DS_ATT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    const DS_ATT = [gl.DEPTH_STENCIL_ATTACHMENT], COLOR_ATT = [gl.COLOR_ATTACHMENT0];

    function buildClip(clip, h, sc) {
      R.stats.clips++;
      gl.stencilMask(0xff); gl.clearStencil(0x80); gl.clear(gl.STENCIL_BUFFER_BIT);
      if (clip) {
        const chain = [];
        for (let c = clip; c; c = c.parent) chain.unshift(c);
        gl.colorMask(false, false, false, false); gl.depthMask(false); gl.disable(gl.DEPTH_TEST);
        for (const c of chain) {
          gl.useProgram(prog); gl.bindVertexArray(vao);
          gl.stencilFunc(gl.ALWAYS, 0, 0xff);
          gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.KEEP, gl.INCR_WRAP); gl.stencilOpSeparate(gl.BACK, gl.KEEP, gl.KEEP, gl.DECR_WRAP); gl.stencilMask(0x7f);
          if (c.count) gl.drawElements(gl.TRIANGLES, c.count, gl.UNSIGNED_INT, c.first * 4);

          gl.useProgram(quadProg); gl.bindVertexArray(quadVao);
          gl.stencilFunc(gl.EQUAL, 0, 0x7f); gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE); gl.stencilMask(0x80);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          gl.stencilMask(0x7f); gl.clearStencil(0); gl.clear(gl.STENCIL_BUFFER_BIT);
          R.stats.draws += 2;
        }
        gl.colorMask(true, true, true, true); gl.depthMask(true); gl.enable(gl.DEPTH_TEST);
      }
      gl.stencilFunc(gl.EQUAL, 0x80, 0x80); gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); gl.stencilMask(0);
    }
    E.targets = targets;
    E.quad = () => { gl.bindVertexArray(quadVao); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.bindVertexArray(null); };
    E.lose = function () {
      E.ready = false; prog = quadProg = null;
      for (const k in targets) targets[k] = null;
      gen++; surfRec.length = 0;
      images.clear(); pendingUploads = []; textClear(); textUploads = 0; ramps.clear(); rampDirty = [];
      for (const p of spPages) { p.gen = -1; p.tex = null; } spPages.length = 0;
      BL.length = 0;
    };
    R.info = () => ({ samples: E.samples, maxSamples: E.maxSamples, layerAtlas: [AW, AH], textAtlas: [TA_W, TA_H], rampRows: RAMP_ROWS, images: images.size, sprites: R.spriteInfo() });
    R.memory = function () {
      let img = 0;
      for (const e of images.values()) img += e.w * e.h * 4;
      const s = Math.max(1, E.samples);
      const tgt = (w, h) => w * h * 4 * (E.samples ? 1 + 2 * s : 2);
      return { imagesBytes: img, spriteBytes: spPages.length * SP_W * SP_H * 4 * 4 / 3, textAtlasBytes: TA_W * TA_H * 4, rampBytes: RAMP_W * RAMP_ROWS * 4, paintBytes: PAINT_ROWS * 32,
        layerTargetBytes: AW && AH ? tgt(AW, AH) : 0, sceneTargetBytes: R.W ? tgt(R.W, R.H) : 0,
        surfaceBytes: [...surfaces.values()].reduce((n, sf) => { const t = targets[sf.pass]; return n + (t ? sf.w * sf.h * 4 * (t.samples ? 1 + 2 * t.samples : 2) : 0); }, 0) };
    };
    return R;
  };
})(window.ND);
