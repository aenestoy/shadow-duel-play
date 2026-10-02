// Shadow Duel — built-in drawn costumes (new shapes over any fighter, drawn with the game's own code on the skeleton)
//
// A costume from the server's reward catalog (js/rewards.js) may name one of these: data { builtin: '<id>' }. The server
// only says who owns it; the drawing ships with the game (adding one needs a game update, so the catalog allow-list is
// ND.COSTUME_IDS and the same list in supabase/ranked.sql / ranked-admin.sql / studio/panel/validate.js).
// The palette of the fighter stays (the costume brings its own lacquer, lacing, metal and cloth colours).
//
// How it is drawn: js/skeleton.js ND.drawNinja calls the costume's layers in the fighter's own drawing order:
//   back     behind everything (capes, the back panel of a coat, a mane)       after the scabbard / quiver
//   backArm  over the far arm (its shoulder plate)                              after the back arm
//   body     over the torso and neck (a breastplate, the coat over the chest)   after the torso
//   head     over the head, in the head's own frame (x forward, y down, R = head radius)
//   hem      over the near leg (tassets, the coat's skirt)                      after the front leg
//   front    over the near arm (its shoulder plate)                             after the front arm
// Nothing here changes the fight (only pictures); a costume is drawn with paths (not the Low part cache) and not in
// reflections. Built-in ids: 'champion', a family: each fighter's own Season Champion costume (js/costumes-champion.js).
// (The first shared-armour concepts shogun_a/b/c were dropped on 2026-09-30: the owner chose a costume per fighter.)
(function (ND) {
  'use strict';
  const TAU = Math.PI * 2, HP = Math.PI / 2;
  const R = 12.5; // head radius (skeleton.js ND.LEN.headR)
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

  // ---------------------------------------------------------------- frames
  // torso: u along the spine from the hip (0) to the neck (~56), n forward (the way the fighter faces)
  function torso(j) {
    let ux = j.neck.x - j.hip.x, uy = j.neck.y - j.hip.y; const ln = Math.hypot(ux, uy) || 1; ux /= ln; uy /= ln;
    const d = j.dir < 0 ? -1 : 1;
    return { hx: j.hip.x, hy: j.hip.y, ux, uy, nx: d * -uy, ny: d * ux, ln, d,
      x(u, n) { return this.hx + this.ux * u + this.nx * n; }, y(u, n) { return this.hy + this.uy * u + this.ny * n; } };
  }
  const P = (F, u, n) => [F.x(u, n), F.y(u, n)];
  function poly(ctx, F, pts) { ctx.beginPath(); pts.forEach(([u, n], i) => (i ? ctx.lineTo(F.x(u, n), F.y(u, n)) : ctx.moveTo(F.x(u, n), F.y(u, n)))); ctx.closePath(); }
  function headFrame(ctx, j) { const h = j.head; ctx.translate(h.x, h.y); ctx.rotate(j.hang + HP); ctx.scale(j.dir, 1); }
  // a shoulder plate hangs: halfway between the upper arm's direction and straight down
  function hang(sh, el) {
    let dx = el.x - sh.x, dy = el.y - sh.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    let ux = dx * 0.45, uy = dy * 0.45 + 0.55; const l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l;
    return { ux, uy, nx: -uy, ny: ux };
  }
  const sway = (k, a) => Math.sin(now() * k) * a;
  const LINE = '#0b0a0c';

  // ---------------------------------------------------------------- shared pieces
  // lacquered lames (overlapping plates) with lacing: a panel from (u0 → u1) × (n0 → n1) in frame F, `rows` lames
  function lames(ctx, F, u0, u1, n0, n1, rows, M, flare = 0) {
    for (let i = 0; i < rows; i++) {
      const a = u0 + (u1 - u0) * (i / rows), b = u0 + (u1 - u0) * ((i + 1) / rows) + (u1 > u0 ? 0.8 : -0.8), f = flare * ((i + 1) / rows);
      poly(ctx, F, [[a, n0 - f * 0.4], [a, n1 + f * 0.6], [b, n1 + f], [b, n0 - f]]);
      const g = ctx.createLinearGradient(F.x(a, n0), F.y(a, n0), F.x(b, n1), F.y(b, n1));
      g.addColorStop(0, M.hi); g.addColorStop(0.5, M.base); g.addColorStop(1, M.dark);
      ctx.fillStyle = g; ctx.strokeStyle = LINE; ctx.lineWidth = 1.1; ctx.fill(); ctx.stroke();
      // lacing (odoshi): short vertical cords across the lame
      ctx.strokeStyle = M.lace; ctx.lineWidth = 1.2;
      ctx.beginPath();
      const w = n1 - n0 + f * 1.6, k = Math.max(3, Math.round(Math.abs(w) / 4.5));
      for (let s = 0; s <= k; s++) { const n = n0 - f * 0.4 + (w * s) / k; ctx.moveTo(F.x(a + (b - a) * 0.15, n), F.y(a + (b - a) * 0.15, n)); ctx.lineTo(F.x(b - (b - a) * 0.1, n), F.y(b - (b - a) * 0.1, n)); }
      ctx.stroke();
      if (M.rivet) { ctx.fillStyle = M.rivet; for (let s = 0; s <= k; s += 2) { const n = n0 + (n1 - n0) * (s / k); ctx.beginPath(); ctx.arc(F.x(a + (b - a) * 0.5, n), F.y(a + (b - a) * 0.5, n), 0.6, 0, TAU); ctx.fill(); } }
    }
  }
  // a big shoulder plate (sode) of `rows` lames hanging from the shoulder
  function sodePlate(ctx, sh, el, M, rows, len, w0, w1, dim, round) {
    const H = hang(sh, el), F = { x: (u, n) => sh.x + H.ux * u + H.nx * n, y: (u, n) => sh.y + H.uy * u + H.ny * n };
    ctx.save();
    if (dim) ctx.globalAlpha = 0.85;
    for (let i = 0; i < rows; i++) {
      const a = -3 + (len * i) / rows, b = -3 + (len * (i + 1)) / rows + 1, wa = w0 + (w1 - w0) * (i / rows), wb = w0 + (w1 - w0) * ((i + 1) / rows);
      ctx.beginPath();
      ctx.moveTo(F.x(a, -wa), F.y(a, -wa)); ctx.lineTo(F.x(a, wa), F.y(a, wa));
      ctx.lineTo(F.x(b, wb), F.y(b, wb));
      if (round && i === rows - 1) ctx.quadraticCurveTo(F.x(b + 6, 0), F.y(b + 6, 0), F.x(b, -wb), F.y(b, -wb));
      else ctx.lineTo(F.x(b, -wb), F.y(b, -wb));
      ctx.closePath();
      ctx.fillStyle = dim ? M.dark : i % 2 ? M.base : M.hi; ctx.strokeStyle = LINE; ctx.lineWidth = 1.1; ctx.fill(); ctx.stroke();
      if (dim) continue;
      ctx.strokeStyle = M.lace; ctx.lineWidth = 1.1; ctx.beginPath();
      for (let s = -2; s <= 2; s++) { const n = (wa * s) / 2.6; ctx.moveTo(F.x(a + 1.2, n), F.y(a + 1.2, n)); ctx.lineTo(F.x(b - 1.2, n * (wb / wa)), F.y(b - 1.2, n * (wb / wa))); }
      ctx.stroke();
    }
    // the top edge (kanmuri-ita) in metal
    ctx.strokeStyle = dim ? M.dark : M.metal; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(F.x(-3, -w0 - 0.5), F.y(-3, -w0 - 0.5)); ctx.lineTo(F.x(-3, w0 + 0.5), F.y(-3, w0 + 0.5)); ctx.stroke();
    ctx.restore();
  }
  ND.COSTUMES = ND.COSTUMES || {};
  // A family: one builtin id, a different costume for each fighter (js/costumes-champion.js registers
  // ND.COSTUMES.champion_<fighter>). A fighter without its own design yet wears nothing from the family.
  const FAMILIES = { champion: (chId) => 'champion_' + chId };
  // the builtin ids this build can draw (the server catalog's builtin field must be one of them; the same list in
  // ranked.sql nd_costume_builtins, ranked-admin.sql and studio/panel/validate.js)
  ND.COSTUME_IDS = ['champion'];
  // builtin id + fighter → the costume to draw (null: none for this fighter)
  ND.costumeKey = (b, chId) => {
    if (typeof b !== 'string' || !ND.COSTUME_IDS.includes(b)) return null;
    const k = FAMILIES[b] ? FAMILIES[b](chId) : b;
    return ND.COSTUMES[k] ? k : null;
  };
  // a palette wearing costume `key`: the costume's own colours over it (a design may keep or change the fighter's
  // colours), the costume named for skeleton.js
  ND.costumePal = (p, key) => {
    const K = ND.COSTUMES[key];
    const q = Object.assign({}, p, (K && K.pal) || {});
    if (K && K.pal && K.pal.hood) q.hood = Object.assign({}, K.pal.hood); else if (p.hood) q.hood = p.hood;
    if (p.atlas) Object.defineProperty(q, 'atlas', { value: p.atlas, enumerable: false });
    Object.defineProperty(q, 'costume', { value: key, enumerable: false });
    return q;
  };
  // the drawing kit for costume files (js/costumes-champion.js)
  ND._costumeKit = { R, TAU, LINE, torso, P, poly, headFrame, hang, sway, lames, sodePlate };
  // ---------------------------------------------------------------- owner's preview switch (not for players)
  // ?costume=champion puts each fighter in its own champion costume (fights, fighter select, the menu demo);
  // ?costume=none (or the costume-test/ preview folder) only shows the toggle. Honoured ONLY on our own preview site
  // (*.github.io) and on localhost, and only when the game is not running on a portal (CrazyGames, Yandex, Playgama,
  // Poki: ND.portalName); it draws, it never grants anything (ownership stays with the server). On the fighter select
  // screen a small corner toggle turns it on and off.
  const PV = (() => {
    let host = '', path = '', q = null;
    try { host = location.hostname || ''; path = location.pathname || ''; q = new URLSearchParams(location.search || '').get('costume'); } catch (e) { return null; }
    const ours = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host) || /(^|\.)github\.io$/.test(host);
    if (!ours || (ND.portalName && ND.portalName !== 'local')) return null;
    if (q == null && !/\/costume-test\//.test(path)) return null;
    return { id: ND.COSTUME_IDS.includes(q) ? q : null };
  })();
  ND.costumePreview = PV ? { get id() { return PV.id; }, set(id) { setPreview(id); } } : null;
  if (PV && ND.palOf) {
    const base = ND.palOf, cache = new Map();
    ND.palOf = (ch, look) => {
      const p = base(ch, look);
      const key = PV.id && ch && p ? ND.costumeKey(PV.id, ch.id) : null;
      if (!key || p.costume === key) return p;
      const k = ch.id + '|' + String(look) + '|' + key;
      let q = cache.get(k);
      if (!q) { q = ND.costumePal(p, key); cache.set(k, q); }
      return q;
    };
  }
  function setPreview(id) {
    if (!PV) return;
    PV.id = ND.COSTUME_IDS.includes(id) ? id : null;
    try { const u = new URL(location.href); u.searchParams.set('costume', PV.id || 'none'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) { /* no history */ }
    const G = ND.game;
    try {
      if (G && G.phase === 'select' && G.refreshSelect) G.refreshSelect();
    } catch (e) { /* redraws on the next fight */ }
    syncToggle();
  }
  // the corner toggle on the fighter select screen: Kostüm: A / B / C / yok
  let tog = null;
  function syncToggle() {
    if (!PV || typeof document === 'undefined') return;
    const sel = document.getElementById('select'), app = document.getElementById('app');
    if (!sel || !app) return;
    if (!tog) {
      tog = document.createElement('div');
      tog.id = 'costumeToggle';
      tog.setAttribute('role', 'group');
      tog.style.cssText = 'position:absolute;top:calc(env(safe-area-inset-top,0px) + 8px);right:8px;z-index:40;display:flex;gap:4px;align-items:center;' +
        'padding:4px 6px;background:rgba(8,9,16,.88);border:1px solid #d9b36c;font:600 12px/1 Oswald,sans-serif;letter-spacing:.06em;color:#e8dcc0';
      const lab = document.createElement('span'); lab.textContent = 'Kostüm:'; lab.style.marginRight = '2px'; tog.appendChild(lab);
      for (const [id, t] of [['champion', 'Şampiyon (her karaktere özel)'], [null, 'yok']]) {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = t; b.dataset.id = id || '';
        b.style.cssText = 'min-width:34px;min-height:30px;padding:4px 8px;border:1px solid rgba(217,179,108,.45);background:transparent;color:inherit;font:inherit;cursor:pointer';
        b.onclick = (e) => { e.stopPropagation(); setPreview(id); };
        tog.appendChild(b);
      }
      app.appendChild(tog);
    }
    tog.hidden = sel.hidden;
    for (const b of tog.querySelectorAll('button')) {
      const on = (b.dataset.id || null) === PV.id;
      b.setAttribute('aria-pressed', String(on)); b.style.background = on ? '#d9b36c' : 'transparent'; b.style.color = on ? '#17130a' : 'inherit';
    }
  }
  if (PV) setInterval(syncToggle, 300);

  // one layer of a costume, never an error that stops the fighter's drawing (also: skeleton.js asks .ownHead)
  ND.costumeLayer = function (id, layer, ctx, j) {
    const K = ND.COSTUMES[id], fn = K && K[layer];
    if (!fn || !j || !j.hip || !j.head) return;
    ctx.save();
    // (a layer that fails half-way may leave its own save() open: the transform is put back by hand)
    const t0 = ctx.getTransform ? ctx.getTransform() : null;
    try { ctx.lineJoin = 'round'; ctx.lineCap = 'round'; fn(ctx, j); } catch (e) { if (ND.costumeDebug) console.warn('[costume]', id, layer, e); if (t0) ctx.setTransform(t0); ctx.globalAlpha = 1; }
    ctx.restore();
  };
})(window.ND);
