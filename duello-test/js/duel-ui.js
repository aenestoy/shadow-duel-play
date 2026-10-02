// Shadow Duel — DUEL PROTOTYPE screen (?duel=1 only; js/duel.js). Pictures and the test page's own controls only:
// nothing here changes the fight (the slow-motion toggle runs fewer fight steps per real second, the same steps).
//   - opens straight into Akane vs Kuro against the CPU (?duel=1&side=1 plays Kuro; &lv=0..2 the CPU level)
//   - a small bar: SLOW-MO, SWAP SIDE, CPU level, NAMES (move names over the fighters), PATH (the coming cut's path),
//     HELP (a short English list of what is new)
//   - in the fight: the DEFENCE pips over each fighter, the BIND prompt (a ring closing on the crossed blades), the
//     loose sword's marker (and "PICK UP" over your own one when you can), UNARMED over a disarmed fighter
(function (ND) {
  'use strict';
  const FLAG = (() => { try { return /[?&]duel=\d/.test(location.search || ''); } catch (e) { return false; } })();
  if (!FLAG || !ND.duel || !ND.game) return;
  const D = ND.duel, G = ND.game, cam = ND.cam, T = D.T, pose = ND.pose;
  const QS = new URLSearchParams(location.search);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const NAMES = {};
  for (const m of D.LIST || []) NAMES[m.id] = m.name.replace(/\s*\((?!R\)|L\)|low)[^)]*\)/, '');
  Object.assign(NAMES, { ak_catch: 'Iai no kamae (draw stance)', ak_catchCut: 'Iai-gaeshi', ak_s1: 'Kurenai Renga', ak_s2: 'Higanbana', ak_up: 'Kiriage (iai)',
    fk_s1: 'Yama-oroshi', fk_s2: 'Iwa-kudaki', fk_dh: 'Tatsu-maki', fk_up: 'Kiriage', fk_bh: 'Men-otoshi', ak_bl: 'Tsuka-ate (pommel)', kick: 'Mae-geri', throw: 'Shuriken',
    pr_smash: 'Breaks it over the head', pr_swing: 'Stool swing', pr_throw: 'Throws it', pr_kick: 'Kicks it at them', pr_shove: 'Kicked through the table', pr_rearm: 'Spare sword from the rack',
    sp_akane: 'KURENAI ISSEN (ki)', sp_kuro: 'YAMA KUDAKI (ki)', chase: 'Oikake (air chase)', chaseEnd: 'Otoshi (air spike)', air: 'Air cut' });
  // (the front kick onto a prop: named after the prop it lands him on, the table only when it is the table)
  const ONTO = { table: 'Kicked through the table', stool: 'Kicked over the stool', crate: 'Kicked into the crate', barrel: 'Kicked into the barrel',
    bale: 'Kicked into the straw', jar: 'Kicked into the jar', bucket: 'Kicked over the bucket' };
  function propName(f) {
    if (f.atkName !== 'pr_shove' || !ND.props || !f.mem || f.mem.pid == null) return null;
    const p = ND.props.get(f.mem.pid);
    return p ? ONTO[p.k] || 'Kicked into the ' + p.k : null;
  }
  const S = D.ui = {
    slow: QS.get('slow') === '1', names: QS.get('names') !== '0', path: QS.get('path') === '1', help: QS.get('help') !== '0',
    side: QS.get('side') === '1' ? 1 : 0, lv: QS.has('lv') && [0, 1, 2].includes(+QS.get('lv')) ? +QS.get('lv') : 1, labels: [], seen: [null, null], hud: QS.get('hud') !== '0',
  };

  // ------------------------------------------------------------------ slow motion: fewer fight steps per real second
  const adv0 = G.advance;
  // (the fight waits while the help box is open)
  G.advance = function (rdt) { if (S.helpEl && !S.helpEl.hidden && G.mode === 'cpu') { this.acc = 0; return 0; } return adv0.call(this, S.slow ? rdt * 0.25 : rdt); };

  // ------------------------------------------------------------------ one headline at a time (decluttered pop-up texts)
  // The fight's pop-up words (fx.text: PARRY!, CRITICAL!, KNOCKDOWN, 5-HIT RALLY!, DISARMED! …) no longer pile up over
  // the fighters: each is ranked, the strongest one alive is THE headline (big, in a fixed band under the HUD, never on
  // the faces), one more may stay as a smaller second line, the rest are dropped. The counter-name banner and the damage
  // numbers step aside while a top headline (disarm, bind result, finisher…) is up; the score pop-ups are off here.
  const RANK = [[/DISARM/, 100], [/MAKI-OTOSHI|KIRI-OTOSHI|THROUGH THE STALL/, 95], [/BROKEN|ESCAPED|TOO EARLY|BREAKS/, 90], [/PUNISHED/, 80],
    [/SWORD BACK|RE-ARMED|TABLE FLIP|STOOL|TWIST|VAULT|KICK!|DUCK/, 75], [/SON VURUŞ|FINISHER/, 70], [/DENGE KIRILDI|POSTURE/, 65], [/KRİTİK|CRITICAL/, 60],
    [/YERE SERİLDİ|KNOCKDOWN|PINNED/, 55], [/KICKED AWAY|BIND/, 50], [/VURUŞLUK SERİ|RALLY/, 45], [/CATCH|IAI GAESHI|BLOCK/, 42], [/KARŞI!|COUNTER/, 40],
    [/SAVUŞTURMA|PARRY/, 35], [/OFF-LINE|ÇARPIŞMA|CLASH|KİLİTLENDİ|İTTİ|CUT!/, 30], [/KAFA|HEAD|HAVAYA|LAUNCH/, 22]];
  const rankOf = (s) => { for (const [re, p] of RANK) if (re.test(s)) return p; return 25; };
  const HL = S.hl = { head: null, sub: null };
  function headline(str, p, col) {
    const s = ND.i18n && typeof str === 'string' ? ND.i18n.t(str) : String(str);
    const it = { s, p: p ?? rankOf(str), col: col || '#ffd27a', age: 0 };
    const h = HL.head;
    if (!h || h.age > 0.85 || it.p >= h.p) { if (h && h.age < 0.85 && h.p >= 30 && h.s !== it.s) HL.sub = h; HL.head = it; }
    else if (it.p >= 30 && (!HL.sub || HL.sub.age > 0.6 || it.p >= HL.sub.p)) HL.sub = it;
  }
  D.headline = (s, p) => headline(s, p);
  // an environment moment's name (js/duel-env.js): the one label, big, over the fighter who does it
  D.envLabel = (f, s) => {
    const cur = S.labels[0];
    if (cur && cur.p >= 2 && cur.t < 0.7) return;
    S.labels.length = 0; S.labels.push({ f, s, t: 0, col: '#ffe3a1', p: 1.5, big: true });
    if (D.clearQuietLabel) D.clearQuietLabel();
  };
  if (S.hud) {
    const text0 = ND.fx.text;
    ND.fx.text = function (x, y, str, color) { if (G.simOnly) return; if (!G.F || !G.F[0].dz) return text0.apply(this, arguments); headline(str, rankOf(String(str)), color); };
    if (ND.score && ND.score.drawPops) ND.score.drawPops = () => {};
    const banner0 = ND.cine.drawBanner, num0 = ND.cine.drawNum;
    ND.cine.drawBanner = function (ctx, b, s) { if (HL.head && HL.head.age < 1 && HL.head.p >= 60) return; return banner0.call(this, ctx, b, s); };
    ND.cine.drawNum = function (ctx, n, s) { if (HL.head && HL.head.age < 1 && HL.head.p >= 45) return; return num0.call(this, ctx, n, s); };
  }
  function drawHeadline(ctx, u) {
    const y0 = cam.H * 0.25;
    for (const [it, big] of [[HL.head, 1], [HL.sub, 0]]) {
      if (!it) continue;
      it.age += 1 / 60;
      const life = big ? 1.15 : 0.9;
      if (it.age > life) { if (big) HL.head = null; else HL.sub = null; continue; }
      const a = it.age < 0.8 * life ? 1 : 1 - (it.age - 0.8 * life) / (0.2 * life), pop = big ? 1 + Math.max(0, 0.12 - it.age) * 2.5 : 1;
      txt(ctx, it.s, cam.W / 2, big ? y0 : y0 + 34 * u, (big ? 30 : 17) * u * pop, big ? it.col : '#ece6d6', 'center', a);
    }
  }

  // ------------------------------------------------------------------ overlay drawing (screen space, after ND.cine)
  const cineDraw0 = ND.cine.draw;
  ND.cine.draw = function (ctx) {
    cineDraw0.call(this, ctx);
    if (!S.hud) return;
    try { drawDuel(ctx); } catch (e) { /* the test overlay must never break a frame */ }
  };
  // every text the overlay draws this frame, as a box (scripts/duel-labels.mjs: no two may overlap)
  D.textBoxes = [];
  function txt(ctx, s, x, y, px, col, align = 'center', a = 1) {
    ctx.globalAlpha = a; ctx.font = `700 ${Math.round(px)}px Oswald, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle';
    // (one text per place: a text that would land on one already drawn this frame is left out. The overlay draws the
    // most important first: the headline, the defence / technique label, then the prompts, names and markers)
    if (a > 0.05 && s) {
      const w = ctx.measureText(s).width, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, bx = { s: String(s), x0, y0: y - px * 0.55, x1: x0 + w, y1: y + px * 0.55 };
      for (const o of D.textBoxes) if (Math.min(o.x1, bx.x1) - Math.max(o.x0, bx.x0) > 1 && Math.min(o.y1, bx.y1) - Math.max(o.y0, bx.y0) > 1) { ctx.globalAlpha = 1; return; }
      D.textBoxes.push(bx);
    }
    ctx.lineWidth = Math.max(2, px * 0.2); ctx.strokeStyle = 'rgba(5,6,12,.88)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y);
    ctx.globalAlpha = 1;
  }
  const human = (f) => !!(G.isHuman && G.isHuman(f));
  function drawDuel(ctx) {
    D.textBoxes.length = 0;
    if (!G.F || !(G.phase === 'fight' || G.phase === 'ko' || G.phase === 'intro')) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const k = cam.k, u = Math.max(cam.ui || cam.s, 0.55);
    // the most important texts first (a later one never lands on them)
    drawHeadline(ctx, u);
    if (D.drawQuietFx) { const now = ND.scene.t, dt = S.qT != null ? Math.max(0, Math.min(0.1, now - S.qT)) : 0; S.qT = now; D.drawQuietFx(ctx, u, dt); }
    drawSeq(ctx, k, u); // (the showpiece's beat ring and its word: the player's prompt, before names and markers)
    for (const f of G.F) {
      const z = f.dz;
      if (!z || f.dead) continue;
      const hx = cam.sx(f.x), hy = cam.sy(f.y - 236);
      // defence pips: one diamond per point, the bind threshold at the end
      const N = T.chainNeed, w = 11 * u, gap = 4 * u, x0 = hx - ((N * w + (N - 1) * gap) / 2);
      if (z.chain > 0 || (z.cine && z.cine.def === f)) {
        for (let i = 0; i < N; i++) {
          const x = x0 + i * (w + gap) + w / 2, on = i < z.chain;
          ctx.beginPath(); ctx.moveTo(x, hy - w * 0.6); ctx.lineTo(x + w * 0.45, hy); ctx.lineTo(x, hy + w * 0.6); ctx.lineTo(x - w * 0.45, hy); ctx.closePath();
          ctx.fillStyle = on ? f.col.ui : 'rgba(10,12,20,.6)'; ctx.fill();
          ctx.lineWidth = 1.5 * u; ctx.strokeStyle = on ? '#fff3d0' : 'rgba(255,255,255,.35)'; ctx.stroke();
        }
        if (z.chain >= N) txt(ctx, 'BIND READY', hx, hy - 16 * u, 12 * u, '#ffd27a');
      }
      if (!z.armed) txt(ctx, 'UNARMED', hx, hy + 16 * u, 11 * u, '#ff9b7a');
      // move name label
      if (S.names && f.state === 'atk' && f.serial !== S.seen[f.id]) {
        S.seen[f.id] = f.serial;
        // (the move started through the duel's choice, else by its logical / own name: the props' moves have their own)
        const nm = (f.dz.lastMove && ND.ATK[f.dz.lastMove] === f.atk ? NAMES[f.dz.lastMove] : null) || propName(f) || NAMES[f.atkName];
        const ctr = f.atk && f.atk.counter;
        // (ONE label on screen at a time: a new one replaces the last at once; a special's name is not replaced by an
        // ordinary move's name while it is up)
        const pri = f.atk && f.atk.special ? 2 : ctr ? 1 : 0, cur = S.labels[0];
        if ((nm || ctr) && !(cur && cur.p > pri && cur.t < 0.7)) {
          const env = /^pr_/.test(f.atkName || '');
          S.labels.length = 0; S.labels.push({ f, s: nm || (f.atkName || '').toUpperCase(), t: 0, col: env ? '#ffe3a1' : f.col.ui, p: env ? Math.max(pri, 1.5) : pri, big: env });
          if (D.clearQuietLabel) D.clearQuietLabel();
        }
      }
    }
    // labels (fade over 0.9 s real time; quiet while a top headline is up)
    if (HL.head && HL.head.age < 1 && HL.head.p >= 60) S.labels.length = 0;
    for (let i = S.labels.length - 1; i >= 0; i--) {
      const L = S.labels[i]; L.t += 1 / 60;
      if (L.t > 0.9) { S.labels.splice(i, 1); continue; }
      const x = cam.sx(L.f.x), y = cam.sy(L.f.y - 200) - L.t * 18 * u;
      // (an environment moment reads at phone size: bigger than a move name)
      txt(ctx, L.s, x, y, (L.big ? 16 : 11) * u, L.col, 'center', L.t < 0.7 ? 1 : 1 - (L.t - 0.7) / 0.2);
    }
    // bind prompt: a ring closing on the crossed blades; gold while the window is open
    for (const f of G.F) {
      const c = f.dz && f.dz.cine;
      if (!c || c.def !== f || c.ph !== 'bind') continue;
      // (the effects table, below: full size with ?fx=1, smaller by default, the player's only with ?fx=0)
      const sc = D.fxMode === 'full' ? 1 : (D.FXS[D.fxMode] || {}).bindRing || 0;
      if (!sc && !human(f)) continue;
      const x = cam.sx(c.px), y = cam.sy(c.py), W = T.bindWin, mid = (W[0] + W[1]) / 2, kk = k * (sc || 0.6);
      const r0 = 34 * kk, r = r0 + Math.max(0, mid - c.t) * 420 * kk - Math.max(0, c.t - mid) * 60 * kk;
      const open = c.t >= W[0] && c.t <= W[1];
      ctx.lineWidth = 3 * u; ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.arc(x, y, r0, 0, 6.283); ctx.stroke();
      ctx.lineWidth = (open ? 6 : 4) * u; ctx.strokeStyle = open ? '#ffd27a' : '#ff9b7a';
      ctx.beginPath(); ctx.arc(x, y, Math.max(4, r), 0, 6.283); ctx.stroke();
      if (human(f)) {
        const tch = !!(ND.touch && ND.touch.active), key = tch ? 'ATTACK' : f.id === 0 ? 'F' : 'K';
        txt(ctx, 'STRIKE!', x, y - r0 - 30 * u, 26 * u, open ? '#ffd27a' : '#ece6d6');
        txt(ctx, key, x, y + r0 + 22 * u, 15 * u, '#ffd27a');
      } else if (human(f.opp)) txt(ctx, 'BOUND!', x, y - r0 - 30 * u, 22 * u, '#ff9b7a');
    }
    // the coming cut's path (PATH toggle): from the wind-up tip through the strike to the follow-through
    if (S.path) for (const f of G.F) if (f.state === 'atk' && f.atk && f.atk.dz3 && f.atk.active && f.st < f.atk.active[1]) drawPath(ctx, f, k);
    ctx.restore();
  }
  // the showpiece's beats (js/duel-seq.js): a ring closing on the defender for each beat, the lane of the beats to come
  function drawSeq(ctx, k, u) {
    const f = G.F.find((x) => x.dz && x.dz.seq && x.dz.seq.def === x);
    const c = f && f.dz.seq;
    if (!c || c.done || !D.SEQ) return;
    const B = D.SEQ.BEATS, b = B[c.next];
    if (!b) return;
    // the closing ring: small, above D's head (never over a face); the beat's word beside it
    const dt = b.t - c.t, x = cam.sx(f.x), y = Math.max(40 * u, cam.sy(f.y - 236)), r0 = 15 * u, r = r0 + Math.max(0, dt) * 45 * u;
    const near = Math.abs(dt) <= D.SEQ.WIN;
    ctx.lineWidth = 2 * u; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(x, y, r0, 0, 6.283); ctx.stroke();
    if (dt > -D.SEQ.WIN && dt < 0.9) { ctx.lineWidth = (near ? 4 : 3) * u; ctx.strokeStyle = near ? '#ffd27a' : 'rgba(255,155,122,.9)'; ctx.beginPath(); ctx.arc(x, y, Math.max(4, r), 0, 6.283); ctx.stroke(); }
    if (dt < 0.9) txt(ctx, b.word, x, y - r0 - 12 * u, 15 * u, near ? '#ffd27a' : '#ece6d6');
    // the lane: the beats to come slide to the mark
    const lx = cam.W / 2, ly = cam.H * 0.86, span = cam.W * 0.32, pxs = span / 1.6;
    ctx.globalAlpha = 0.85; ctx.fillStyle = 'rgba(6,7,12,.6)'; ctx.fillRect(lx - span * 0.15, ly - 14 * u, span * 1.3, 28 * u); ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(lx, ly - 16 * u); ctx.lineTo(lx, ly + 16 * u); ctx.stroke();
    for (let i = c.next; i < B.length; i++) {
      const bx = lx + (B[i].t - c.t) * pxs;
      if (bx > lx + span * 1.15) break;
      ctx.fillStyle = i === c.next && near ? '#ffd27a' : '#ece6d6';
      ctx.beginPath(); ctx.arc(bx, ly, (i === c.next ? 9 : 6) * u, 0, 6.283); ctx.fill();
    }
    txt(ctx, `${c.hits} / ${B.length}`, lx - span * 0.08, ly - 26 * u, 12 * u, '#ece6d6');
    // the stations: where the scene is now
    const S = D.SEQ.STATIONS;
    if (S) {
      const cur = b.at || 0, sy = ly + 30 * u;
      S.forEach((n, i) => txt(ctx, n, lx + (i - (S.length - 1) / 2) * span * 0.36, sy, (i === cur ? 12 : 10) * u, i === cur ? '#ffd27a' : i < cur ? 'rgba(236,230,214,.45)' : 'rgba(236,230,214,.75)'));
    }
  }
  const PP = {}, PJ = {};
  function tipAt(f, t) { pose.seq(f.keys, t, PP); const j = ND.solve(PP, f.x, f.y, f.dir, PJ, f.wpn); return [j.tip.x, j.tip.y]; }
  function drawPath(ctx, f, k) {
    const a = f.atk, t0 = a.active[0] - 0.04, t1 = a.active[1] + 0.06, n = 10, pts = [];
    for (let i = 0; i <= n; i++) pts.push(tipAt(f, t0 + (t1 - t0) * (i / n)));
    const side = a.dz3.side, col = side > 0 ? '255,214,140' : side < 0 ? '140,200,255' : '240,240,240';
    const al = clamp(1 - f.st / a.active[0], 0.25, 1);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.setLineDash(side < 0 ? [10 * k, 8 * k] : []);
    ctx.strokeStyle = `rgba(${col},${0.75 * al})`; ctx.lineWidth = 5 * k;
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(cam.sx(p[0]), cam.sy(p[1])) : ctx.moveTo(cam.sx(p[0]), cam.sy(p[1])))); ctx.stroke();
    ctx.setLineDash([]);
    const p1 = pts[n], p0 = pts[n - 2], ang = Math.atan2(cam.sy(p1[1]) - cam.sy(p0[1]), cam.sx(p1[0]) - cam.sx(p0[0])), X = cam.sx(p1[0]), Y = cam.sy(p1[1]), L = 16 * k;
    ctx.fillStyle = `rgba(${col},${0.85 * al})`;
    ctx.beginPath(); ctx.moveTo(X + Math.cos(ang) * L, Y + Math.sin(ang) * L); ctx.lineTo(X + Math.cos(ang + 2.5) * L, Y + Math.sin(ang + 2.5) * L); ctx.lineTo(X + Math.cos(ang - 2.5) * L, Y + Math.sin(ang - 2.5) * L); ctx.closePath(); ctx.fill();
  }
  // the loose sword's marker (world space, drawn with the sword)
  D.drawSwordMark = function (ctx, x, y, ang, owner) {
    if (!owner || !S.hud) return;
    const gx = x - Math.cos(ang) * 6, gy = y - Math.sin(ang) * 6;
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.15 * Math.sin(ND.scene.t * 6);
    ctx.strokeStyle = owner.col.ui; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(gx, Math.max(gy, -6), 26, 10, 0, 0, 6.283); ctx.stroke();
    ctx.restore();
    if (human(owner) && D.canPick(owner) && owner.state !== 'dpick') {
      const tch = !!(ND.touch && ND.touch.active);
      ctx.save(); ctx.font = '700 15px Oswald, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(5,6,12,.9)';
      const s = tch ? 'PICK UP: SHURIKEN' : 'PICK UP: ' + (owner.id === 0 ? 'T' : 'I');
      ctx.strokeText(s, gx, gy - 46); ctx.fillStyle = '#ffd27a'; ctx.fillText(s, gx, gy - 46); ctx.restore();
    }
  };

  // ------------------------------------------------------------------ the test page: straight into the duel
  const css = `
  #duelBar{position:fixed;left:50%;top:62px;transform:translateX(-50%);z-index:60;display:flex;gap:5px;flex-wrap:wrap;justify-content:center;
    font:600 11px/1 Oswald,system-ui,sans-serif;pointer-events:auto;max-width:96vw;opacity:.88}
  #duelBar button{background:rgba(10,12,20,.72);color:#ece6d6;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:5px 7px;font:inherit;cursor:pointer}
  #duelBar button.on{background:#ffd27a;color:#1a1408;border-color:#ffd27a}
  #duelHelp{position:fixed;left:50%;top:92px;transform:translateX(-50%);z-index:60;background:rgba(8,9,16,.9);color:#ece6d6;border:1px solid rgba(255,210,122,.5);
    border-radius:10px;padding:12px 16px;max-width:min(560px,92vw);font:14px/1.45 "Source Sans 3",system-ui,sans-serif}
  #duelHelp b{color:#ffd27a} #duelHelp ul{margin:6px 0 4px;padding-left:18px} #duelHelp li{margin:3px 0}
  #duelHelp .x{float:right;margin:-4px -6px 0 8px;background:none;border:0;color:#ece6d6;font-size:18px;cursor:pointer}
  @media (max-height:500px){#duelHelp{font-size:12px;top:86px;padding:8px 12px;max-height:calc(100vh - 96px);overflow:auto}#duelBar{top:56px}#duelBar button{padding:4px 6px}}`;
  const HELP = `<button class="x" aria-label="close">×</button><b>DUEL TEST · Akane vs Kuro</b>
  <div style="opacity:.8;font-size:.9em">The fight starts when you close this box.</div>
  <ul>
  <li><b>Every cut has a direction:</b> watch which shoulder the blade loads on (right = in front of the body, left = behind it), and whether it falls, rises, sweeps or thrusts.</li>
  <li><b>Hold GUARD:</b> your blade goes to meet theirs on its own. If the next cut comes from the other side too fast, the guard is <b>OFF-LINE</b> (costs balance).</li>
  <li><b>Defence chain:</b> blocks and parries fill the pips over your head. A <b>parry</b> with full pips locks the blades (<b>BIND</b>): press <b>ATTACK</b> when the ring closes on the gold circle → the sword flies away.</li>
  <li><b>Disarm</b> also with a heavy hit on a broken guard, or <b>← → + HEAVY</b> (50 ki).</li>
  <li><b>Unarmed:</b> punches, elbows, knees, kicks. Near your sword press <b>SHURIKEN</b> to pick it up, or roll over it (dodge). Kick their sword away, punish their pickup.</li>
  <li><b>Props</b> (PROPS button): after a won bind the cup, stool or table may finish the job; a weapon rack holds a spare sword.</li>
  <li><b>Same buttons, more moves:</b> distance, height, guard, walls, air and fists change the move. Combos: ← → or → ← then LIGHT / HEAVY.</li>
  </ul>`;
  function el(tag, attrs, html) { const e = document.createElement(tag); Object.assign(e, attrs || {}); if (html != null) e.innerHTML = html; return e; }
  function boot() {
    const st = el('style'); st.textContent = css; document.head.appendChild(st);
    const bar = el('div', { id: 'duelBar' });
    const btn = (label, on, fn) => { const b = el('button', { type: 'button', textContent: label }); b.classList.toggle('on', !!on); b.onclick = (e) => { e.stopPropagation(); fn(b); }; bar.appendChild(b); return b; };
    btn('SLOW', S.slow, (b) => { S.slow = !S.slow; b.classList.toggle('on', S.slow); });
    const sideB = btn(S.side ? 'AS AKANE' : 'AS KURO', false, () => { S.side = S.side ? 0 : 1; sideB.textContent = S.side ? 'AS AKANE' : 'AS KURO'; startDuel(); });
    const LV = ['CPU: EASY', 'CPU: MASTER', 'CPU: LEGEND'];
    const lvB = btn(LV[S.lv], false, () => { S.lv = (S.lv + 1) % 3; lvB.textContent = LV[S.lv]; startDuel(); });
    btn('NAMES', S.names, (b) => { S.names = !S.names; b.classList.toggle('on', S.names); });
    btn('PATH', S.path, (b) => { S.path = !S.path; b.classList.toggle('on', S.path); });
    if (ND.props) btn('PROPS', !!ND.props.live, (b) => { b.classList.toggle('on', D.propsOn(!ND.props.live)); startDuel(); });
    const help = el('div', { id: 'duelHelp' }, HELP);
    help.hidden = !S.help; S.helpEl = help;
    help.querySelector('.x').onclick = (e) => { e.stopPropagation(); help.hidden = true; };
    btn('HELP', false, () => { help.hidden = !help.hidden; });
    btn('↻', false, () => startDuel());
    if (ND.props) btn('SHOWPIECE', false, () => showpiece());
    document.body.appendChild(bar); document.body.appendChild(help);
    // audio starts with the first touch / key (as the menus do)
    const unlock = () => {
      try { ND.audio.init(); ND.audio.setEnabled(ND.settings.sound); if (ND.music) { ND.music.init(); ND.music.setEnabled(ND.settings.music); ND.music.setMode('fight'); } } catch (e) { /* no audio */ }
      removeEventListener('pointerdown', unlock, true); removeEventListener('keydown', unlock, true);
    };
    addEventListener('pointerdown', unlock, true); addEventListener('keydown', unlock, true);
    startDuel();
  }
  function startDuel() {
    const ak = ND.CHARS.findIndex((c) => c.id === 'akane'), ku = ND.CHARS.findIndex((c) => c.id === 'kuro');
    const first = document.getElementById('first'); if (first) first.hidden = true;
    G.level = S.lv;
    G.start('cpu', { c1: S.side ? ku : ak, c2: S.side ? ak : ku, arena: QS.get('arena') || 'temple' });
  }
  D.startDuel = startDuel;
  // the market showpiece on demand: a fresh match in the market (props on), the sequence starts with the fight
  function showpiece() {
    if (ND.props && !ND.props.live) D.propsOn(true);
    const ak = ND.CHARS.findIndex((c) => c.id === 'akane'), ku = ND.CHARS.findIndex((c) => c.id === 'kuro');
    const first = document.getElementById('first'); if (first) first.hidden = true;
    if (S.helpEl) S.helpEl.hidden = true;
    G.level = S.lv;
    G.start('cpu', { c1: S.side ? ku : ak, c2: S.side ? ak : ku, arena: 'market' });
    D.wantSeq = true;
  }
  D.showpiece = showpiece;
  // tools (scripts/duel-*.mjs) start their own fights: ?duel=1&auto=0 leaves the page alone
  if (QS.get('auto') !== '0') {
    const go = () => setTimeout(boot, 0);
    if (document.readyState === 'complete') go(); else addEventListener('load', go);
  }

  // ------------------------------------------------------------------ defence: the swords first, the effects second
  // (drawing only) Around a block, a parry, a bind and the counter after it, the screen effects are scaled down so the
  // blades tell it (their contact, give and deflection: js/duel-depth.js). One table, one look per mode:
  //   default 'small': every effect back, smaller, shorter, centred on the blades' contact;
  //   ?fx=1 'full': the old effects as they were;  ?fx=0 'none': only the contact spark and the sounds.
  // Per effect: ring / flash (size), spark (count, power), slash (length, width, life, colour saturation), ghosts
  // (how many per counter, life), banner (the technique's name: size, life; 0 = none), words (PARRY!, OFF-LINE!: size
  // near the contact; 0 = none), nums (damage numbers: size, the newest only), dim (the screen tint of a counter
  // chain / finisher: its most), trail / trailC (blade streak alpha: any cut / a counter or the bind), contact (the
  // white-gold flash at every blade-on-blade contact: size), bindRing (the bind's timing ring for a CPU too: size; 0 =
  // the player's only), rally (the exchange count: small, in a corner).
  // In an exchange (counter after counter) only ONE label shows at a time, by the contact, never over a face.
  const FXS = {
    small: { ring: 0.5, flash: 0.5, spark: 0.5, sparkPow: 0.7, slashLen: 0.12, slashW: 0.5, slashLife: 0.5, slashSat: 0.5, ghosts: 1, ghostLife: 0.55,
      banner: 0.5, bannerLife: 0.7, words: 1, nums: 0.6, dim: 0.2, trail: 0.3, trailC: 0.2, contact: 1, bindRing: 0.6, rally: 1, special: 0.5 },
    none: { ring: 0, flash: 0, spark: 0.5, sparkPow: 0.6, slashLen: 0, slashW: 0, slashLife: 0, slashSat: 0, ghosts: 0, ghostLife: 0,
      banner: 0, bannerLife: 0, words: 0, nums: 0, dim: 0, trail: 0.7, trailC: 0.3, contact: 0, bindRing: 0, rally: 1, special: 0 },
  };
  const FXQ = (/[?&]fx=([01])(&|$)/.exec(location.search || '') || [])[1];
  const MODE = FXQ === '1' ? 'full' : FXQ === '0' ? 'none' : 'small';
  D.fxMode = MODE; D.FXS = FXS;
  if (MODE !== 'full') {
    const X = FXS[MODE];
    const Q = { until: -1, cx: 0, cy: -130, ct: -9, label: null, corner: null, flashes: [], lastFl: -9, inParry: false };
    const DEF_ST = { block: 1, parry: 1, dbind: 1, dcut: 1, clash: 1 };
    const quiet = () => {
      if ((ND.simClock || 0) < Q.until) return true;
      const F = G.F;
      if (!F || !F[0] || !F[0].dz) return false;
      for (const f of F) if (f.dz && (DEF_ST[f.state] || (f.state === 'atk' && f.atk && f.atk.counter))) return true;
      return false;
    };
    const mark = (s) => { Q.until = Math.max(Q.until, (ND.simClock || 0) + (s || 0.6)); };
    const duel = () => !!(G.F && G.F[0] && G.F[0].dz);
    D.quietDefence = quiet;
    D.clearQuietLabel = () => { Q.label = null; };
    const fx = ND.fx, ring0 = fx.ring, flash0 = fx.flash, spark0 = fx.spark, text1 = fx.text;
    fx.ring = function (x, y, col, size) { if (!quiet()) return ring0.apply(this, arguments); if (!X.ring || Q.inParry) return; return ring0.call(this, x, y, col, (size == null ? 90 : size) * X.ring); };
    fx.flash = function (x, y, ang, size, col) { if (!quiet()) return flash0.apply(this, arguments); if (!X.flash) return; return flash0.call(this, x, y, ang, (size == null ? 60 : size) * X.flash, col); };
    // (a spark in a defence moment is a blade-on-blade contact: it gets the contact flash, the same every time)
    fx.spark = function (x, y, dir, n, power, col) {
      if (!quiet()) return spark0.apply(this, arguments);
      if (X.contact && !G.simOnly) {
        const t = ND.scene.t;
        if (t - Q.lastFl > 0.12 || Math.hypot(x - Q.flX, y - Q.flY) > 30) { Q.flashes.push({ x, y, age: 0 }); Q.lastFl = t; Q.flX = x; Q.flY = y; if (Q.flashes.length > 4) Q.flashes.shift(); }
      }
      return spark0.call(this, x, y, dir, Math.max(2, Math.round((n == null ? 14 : n) * X.spark)), (power == null ? 1 : power) * X.sparkPow, col);
    };
    // pop-up words: one at a time, small, by the blades' contact (the disarm keeps its headline)
    fx.text = function (x, y, str, color) {
      const raw = String(str), sx = ND.i18n && typeof str === 'string' ? ND.i18n.t(str) : raw;
      // the exchange's count: small, in a corner
      if (/SER[İI]|RALLY/i.test(raw) && duel()) { if (!G.simOnly && X.rally) Q.corner = { s: sx, col: color || '#ff9b7a', age: 0 }; return; }
      if (!quiet() || /DISARM/i.test(raw)) return text1.apply(this, arguments);
      if (G.simOnly || !X.words) return;
      if (S.labels[0] && S.labels[0].p >= 2 && S.labels[0].t < 0.7) return; // (a special's name is up)
      S.labels.length = 0;
      Q.label = { s: sx, col: color || '#ffe3a1', x: (ND.simClock || 0) - Q.ct < 0.6 ? Q.cx : x, age: 0, life: 0.75, k: X.words };
    };
    const FPq = ND.Fighter.prototype, blk0 = FPq.blocked, gh0 = FPq.addGhost;
    FPq.blocked = function (a, x, y) { if (this.dz) { mark(0.5); Q.cx = x; Q.cy = y; Q.ct = ND.simClock || 0; } return blk0.apply(this, arguments); };
    // the 2D blade streak of a counter (its technique's colour band) stays faint in an exchange
    const tr0 = FPq.drawTrail;
    FPq.drawTrail = function (ctx) {
      if (!this.dz || !quiet()) return tr0.apply(this, arguments);
      const a = this.state === 'atk' && this.atk && this.atk.counter ? X.trailC : X.trail;
      if (a <= 0) return;
      const g0 = ctx.globalAlpha; ctx.globalAlpha = g0 * a;
      try { return tr0.apply(this, arguments); } finally { ctx.globalAlpha = g0; }
    };
    // afterimages: at most X.ghosts per move, short
    const GN = new WeakMap();
    FPq.addGhost = function (life, col) {
      if (!this.dz || !quiet()) return gh0.apply(this, arguments);
      if (!X.ghosts) return;
      let g = GN.get(this);
      if (!g || g.serial !== this.serial) GN.set(this, (g = { serial: this.serial, n: 0 }));
      if (g.n >= X.ghosts) return;
      const before = this.ghosts.length;
      gh0.call(this, life * X.ghostLife, col);
      if (this.ghosts.length > before) g.n++;
    };
    const C = ND.cine;
    if (C) {
      const onParry0 = C.onParry, start0 = C.counterStart, hit0 = C.counterHit, slash0 = C.drawSlash;
      // the parry's ring: on the blades' contact, not round the defender's body
      C.onParry = function (def, att, x, y) {
        if (!duel()) return onParry0.apply(this, arguments);
        mark(0.8); Q.cx = x; Q.cy = y; Q.ct = ND.simClock || 0; Q.inParry = true;
        try { onParry0.apply(this, arguments); } finally { Q.inParry = false; }
        this.rings.length = 0;
        if (X.ring) ring0.call(fx, x, y, '255,244,214', 130 * X.ring);
      };
      // the technique's name: one short line, small, high (drawn by drawDuel), instead of the big band
      C.counterStart = function () {
        if (!duel()) return start0.apply(this, arguments);
        mark(0.8);
        const r = start0.apply(this, arguments);
        const b = this.banner;
        this.banner = null;
        if (b && X.banner && !G.simOnly && !(S.labels[0] && S.labels[0].p >= 2 && S.labels[0].t < 0.7)) S.labels.length = 0, Q.label = { s: b.name, col: 'rgb(' + (b.col || b.t.col) + ')', x: (ND.simClock || 0) - Q.ct < 0.6 ? Q.cx : (b.f.x + b.f.opp.x) / 2, age: 0, life: 1.05 * X.bannerLife, k: X.banner * 1.6 };
        // (the screen tint of a counter chain stays light: the bodies stay clear)
        if (G.dim > X.dim) G.dim = X.dim;
        return r;
      };
      // the slash: short, along the cut near the target, thin, quick, the colour softened
      C.counterHit = function () {
        if (!duel()) return hit0.apply(this, arguments);
        mark(0.5);
        const n0 = this.slashes.length, r = hit0.apply(this, arguments);
        if (!X.slashLen) this.slashes.length = Math.min(this.slashes.length, n0);
        else {
          for (let i = n0; i < this.slashes.length; i++) {
            const sl = this.slashes[i];
            sl.small = 1; sl.life *= X.slashLife;
            const c = String(sl.col).split(',').map(Number), m = (c[0] + c[1] + c[2]) / 3;
            sl.col = c.map((v) => Math.round(m + (v - m) * X.slashSat)).join(',');
          }
        }
        return r;
      };
      const num0 = C.drawNum;
      C.drawNum = function (ctx, n, s2) {
        if (!duel() || !quiet()) return num0.call(this, ctx, n, s2);
        if (!X.nums || n !== this.nums[this.nums.length - 1]) return; // (the newest only)
        const x = cam.sx(n.x), y = cam.sy(n.y);
        ctx.save(); ctx.translate(x, y); ctx.scale(X.nums, X.nums); ctx.translate(-x, -y);
        try { num0.call(this, ctx, n, s2); } finally { ctx.restore(); }
      };
      C.drawSlash = function (ctx, sl, s2) {
        if (!sl.small) return slash0.call(this, ctx, sl, s2);
        const x = cam.sx(sl.x), y = cam.sy(sl.y);
        ctx.save(); ctx.translate(x, y); ctx.rotate(sl.a); ctx.scale(X.slashLen, X.slashW); ctx.rotate(-sl.a); ctx.translate(-x, -y);
        try { slash0.call(this, ctx, sl, s2); } finally { ctx.restore(); }
      };
    }
    // ---- the bodies always read (any moment, not only defence): no effect may hide a fighter
    // (scripts/duel-visibility.mjs checks it). A special counts like a defence moment for its arcs and glows.
    const special = () => !!(G.F && G.F.some((f) => f.dz && f.state === 'atk' && f.atk && f.atk.special));
    // the hit tint: a brief light touch (the fight's flash at 0.12: a visible lift, details kept) for the first 3 DRAWN frames of a hit, never a flat pale body (the
    // fight's own flash fades in fight time, so through a hit-stop or slow motion it would stay for many frames)
    if (ND.scene && ND.scene.lightFighter) {
      const lf0 = ND.scene.lightFighter, HF = new WeakMap();
      ND.scene.lightFighter = function (c, f) {
        if (!f || !f.dz) return lf0.apply(this, arguments);
        let h = HF.get(f); if (!h) HF.set(f, (h = { last: 0, n: 9 }));
        const fl = f.flash || 0;
        if (fl > h.last + 0.05) h.n = 0; // (a new hit)
        h.last = fl; h.n++;
        f.flash = fl > 0 && h.n <= 3 ? 0.12 : 0;
        // (local lights — a lantern's warm glow — at most a subtle warm edge: the body keeps its own colours)
        const ga = c.globalAlpha; c.globalAlpha = ga * 0.35;
        try { return lf0.apply(this, arguments); } finally { f.flash = fl; c.globalAlpha = ga; }
      };
    }
    // flashes and rings never bigger than ~1.5 heads / a body's width; ink and blood a small burst at the hit point
    const fl1 = fx.flash, rg1 = fx.ring;
    fx.flash = function (x, y, ang, size, col) { if (!duel()) return fl1.apply(this, arguments); return fl1.call(this, x, y, ang, Math.min(size == null ? 60 : size, 36), col); };
    fx.ring = function (x, y, col, size) { if (!duel()) return rg1.apply(this, arguments); return rg1.call(this, x, y, col, Math.min(size == null ? 90 : size, 70)); };
    if (fx.blood) { const bl0 = fx.blood; fx.blood = function (x, y, dx, dy, n, power) { if (!duel()) return bl0.apply(this, arguments); return bl0.call(this, x, y, dx, dy, Math.max(3, Math.round((n == null ? 18 : n) * 0.35)), (power == null ? 1 : power) * 0.55); }; }
    // a technique's own arcs and glows (js/specials.js: the crescent swept round a counter, a special's white ball …):
    // smaller and shorter, a glow under ~1.5 heads
    if (ND.specialFx) {
      const add0 = ND.specialFx.add;
      ND.specialFx.add = function (o) {
        if (o && o.draw && duel() && (quiet() || special())) {
          if (!X.special && quiet()) { o.t = 0; return o; }
          const k = X.special || 0.5;
          if (o.r) o.r = Math.min(o.r * k, o.span == null ? 22 : o.r * k); if (o.w) o.w *= k; if (o.life) o.life *= 0.6 + 0.4 * k;
        }
        return add0.call(this, o);
      };
    }
    // afterimages: at most 2 a move whatever the moment, faint (≤ ~25 %), behind the real body (drawn before it)
    {
      const GN2 = new WeakMap(), gh1 = FPq.addGhost, dg0 = FPq.drawGhosts;
      FPq.addGhost = function () {
        if (!this.dz) return gh1.apply(this, arguments);
        let g = GN2.get(this);
        if (!g || g.serial !== this.serial) GN2.set(this, (g = { serial: this.serial, n: 0 }));
        if (g.n >= 2) return;
        const before = this.ghosts.length;
        gh1.apply(this, arguments);
        if (this.ghosts.length > before) g.n++;
      };
      FPq.drawGhosts = function (ctx) {
        if (!this.dz || !this.ghosts.length) return dg0.apply(this, arguments);
        const L = this.ghosts.map((g) => g.life);
        for (const g of this.ghosts) g.life *= 0.8;
        try { return dg0.apply(this, arguments); } finally { this.ghosts.forEach((g, i) => { g.life = L[i]; }); }
      };
    }
    // the finisher of an exchange: its tint stays light too
    if (G.onFinisher) { const fin0 = G.onFinisher; G.onFinisher = function () { const r = fin0.apply(this, arguments); if (duel() && this.dim > X.dim) this.dim = X.dim; return r; }; }
    if (ND.depth25) ND.depth25.trailAlpha = (f) => ((f.state === 'atk' && f.atk && f.atk.counter) || f.state === 'dbind' || f.state === 'dcut' ? X.trailC : X.trail);
    // the one label, the exchange count and the contact flashes (screen space, over the fight)
    D.drawQuietFx = function (ctx, u, dt) {
      const L = Q.label;
      if (L) {
        L.age += dt;
        // by the contact, at waist height: between the two bodies, never over a face
        if (L.age > L.life) Q.label = null;
        else txt(ctx, L.s, cam.sx(L.x), cam.sy(-92) + 10 * Math.min(1, L.age / 0.3) * u, 14 * u * L.k, L.col, 'center', L.age < L.life - 0.2 ? 1 : (L.life - L.age) / 0.2);
      }
      const R = Q.corner;
      if (R) {
        R.age += dt;
        if (R.age > 1.6) Q.corner = null;
        else txt(ctx, R.s, cam.W - 18 * u, cam.H * 0.22, 13 * u, R.col, 'right', R.age < 1.3 ? 1 : (1.6 - R.age) / 0.3);
      }
      const k = cam.k * X.contact;
      for (let i = Q.flashes.length - 1; i >= 0; i--) {
        const f = Q.flashes[i];
        f.age += dt;
        if (f.age > 0.1) { Q.flashes.splice(i, 1); continue; }
        const x = cam.sx(f.x), y = cam.sy(f.y), a = 1 - f.age / 0.1, r = (7 + 9 * (f.age / 0.1)) * k;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
        ctx.fillStyle = 'rgba(255,246,214,1)'; ctx.beginPath(); ctx.arc(x, y, 3.2 * k, 0, 6.283); ctx.fill();
        ctx.strokeStyle = 'rgba(255,226,150,1)'; ctx.lineWidth = 1.6 * k; ctx.beginPath();
        for (let q = 0; q < 4; q++) { const an = q * Math.PI / 2 + 0.3, l = q % 2 ? r * 0.65 : r; ctx.moveTo(x - Math.cos(an) * l, y - Math.sin(an) * l); ctx.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l); }
        ctx.stroke(); ctx.restore();
      }
    };
  }
})(window.ND);
