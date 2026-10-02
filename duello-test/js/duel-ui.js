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
  function txt(ctx, s, x, y, px, col, align = 'center', a = 1) {
    ctx.globalAlpha = a; ctx.font = `700 ${Math.round(px)}px Oswald, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, px * 0.2); ctx.strokeStyle = 'rgba(5,6,12,.88)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y);
    ctx.globalAlpha = 1;
  }
  const human = (f) => !!(G.isHuman && G.isHuman(f));
  function drawDuel(ctx) {
    if (!G.F || !(G.phase === 'fight' || G.phase === 'ko' || G.phase === 'intro')) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const k = cam.k, u = Math.max(cam.ui || cam.s, 0.55);
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
        const nm = (f.dz.lastMove && ND.ATK[f.dz.lastMove] === f.atk ? NAMES[f.dz.lastMove] : null) || NAMES[f.atkName];
        const ctr = f.atk && f.atk.counter;
        if (nm || ctr) S.labels.push({ f, s: nm || (f.atkName || '').toUpperCase(), t: 0, col: f.col.ui });
      }
    }
    // labels (fade over 0.9 s real time; quiet while a top headline is up)
    if (HL.head && HL.head.age < 1 && HL.head.p >= 60) S.labels.length = 0;
    for (let i = S.labels.length - 1; i >= 0; i--) {
      const L = S.labels[i]; L.t += 1 / 60;
      if (L.t > 0.9) { S.labels.splice(i, 1); continue; }
      const x = cam.sx(L.f.x), y = cam.sy(L.f.y - 200) - L.t * 18 * u;
      txt(ctx, L.s, x, y, 13 * u, L.col, 'center', L.t < 0.7 ? 1 : 1 - (L.t - 0.7) / 0.2);
    }
    // bind prompt: a ring closing on the crossed blades; gold while the window is open
    for (const f of G.F) {
      const c = f.dz && f.dz.cine;
      if (!c || c.def !== f || c.ph !== 'bind') continue;
      // (only for the player who has to press: the CPU's bind is told by the blades alone)
      if (!human(f) && !/[?&]fx=1(&|$)/.test(location.search || '')) continue;
      const x = cam.sx(c.px), y = cam.sy(c.py), W = T.bindWin, mid = (W[0] + W[1]) / 2;
      const r0 = 26 * k, r = r0 + Math.max(0, mid - c.t) * 260 * k - Math.max(0, c.t - mid) * 40 * k;
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
    drawSeq(ctx, k, u);
    drawHeadline(ctx, u);
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

  // ------------------------------------------------------------------ defence told by the swords, not by effects
  // (drawing only) Around a block, a parry, a bind and the counter that follows, the screen effects step back so the
  // blades themselves tell it: no rings, flashes, slash lines across the screen, coloured afterimages, name banners
  // or pop-up words; a small spark where the blades really touch and the sound stay. The blades' own contact, give
  // and deflection are drawn in js/duel-depth.js. ?fx=1 brings the old effects back (to compare).
  if (!/[?&]fx=1(&|$)/.test(location.search || '')) {
    const Q = { until: -1 };
    const DEF_ST = { block: 1, parry: 1, dbind: 1, dcut: 1, clash: 1 };
    const quiet = () => {
      if ((ND.simClock || 0) < Q.until) return true;
      const F = G.F;
      if (!F || !F[0] || !F[0].dz) return false;
      for (const f of F) if (f.dz && (DEF_ST[f.state] || (f.state === 'atk' && f.atk && f.atk.counter))) return true;
      return false;
    };
    const mark = (s) => { Q.until = Math.max(Q.until, (ND.simClock || 0) + (s || 0.6)); };
    D.quietDefence = quiet;
    const fx = ND.fx, ring0 = fx.ring, flash0 = fx.flash, spark0 = fx.spark, text1 = fx.text;
    fx.ring = function () { if (quiet()) return; return ring0.apply(this, arguments); };
    fx.flash = function () { if (quiet()) return; return flash0.apply(this, arguments); };
    // (the spark at the contact stays, small)
    fx.spark = function (x, y, dir, n, power, col) { if (quiet()) return spark0.call(this, x, y, dir, Math.min(n == null ? 14 : n, 6), (power == null ? 1 : power) * 0.6, col); return spark0.apply(this, arguments); };
    fx.text = function (x, y, str) { if (quiet() && !/DISARM/i.test(String(str))) return; return text1.apply(this, arguments); };
    const FPq = ND.Fighter.prototype, blk0 = FPq.blocked, gh0 = FPq.addGhost;
    FPq.blocked = function () { if (this.dz) mark(0.5); return blk0.apply(this, arguments); };
    FPq.addGhost = function () { if (this.dz && quiet()) return; return gh0.apply(this, arguments); };
    const C = ND.cine;
    if (C) {
      for (const k of ['onParry', 'counterStart', 'counterHit']) {
        const f0 = C[k];
        if (typeof f0 !== 'function') continue;
        C[k] = function () {
          const duel = G.F && G.F[0] && G.F[0].dz;
          if (duel) mark(k === 'counterHit' ? 0.5 : 0.8);
          const nS = this.slashes.length;
          const r = f0.apply(this, arguments);
          if (duel) { this.rings.length = 0; this.slashes.length = Math.min(this.slashes.length, nS); this.banner = null; }
          return r;
        };
      }
    }
    if (D.startBind) { const sb0 = D.startBind; D.startBind = function () { mark(0.6); return sb0.apply(this, arguments); }; }
    // the blade's streak: faint on a counter and while the blades are locked (the cut itself shows the line)
    if (ND.depth25) ND.depth25.trailAlpha = (f) => (f.state === 'atk' && f.atk && f.atk.counter) || f.state === 'dbind' || f.state === 'dcut' ? 0.3 : 0.7;
  }
})(window.ND);
