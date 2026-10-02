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
    // labels (fade over 0.9 s real time)
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
      const x = cam.sx(c.px), y = cam.sy(c.py), W = T.bindWin, mid = (W[0] + W[1]) / 2;
      const r0 = 34 * k, r = r0 + Math.max(0, mid - c.t) * 420 * k - Math.max(0, c.t - mid) * 60 * k;
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
  // tools (scripts/duel-*.mjs) start their own fights: ?duel=1&auto=0 leaves the page alone
  if (QS.get('auto') !== '0') {
    const go = () => setTimeout(boot, 0);
    if (document.readyState === 'complete') go(); else addEventListener('load', go);
  }
})(window.ND);
