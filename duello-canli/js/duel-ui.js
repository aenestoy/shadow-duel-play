






(function (ND) {
  'use strict';
  const FLAG = (() => { try { return !/[?&]duel=0(&|$)/.test(location.search || ''); } catch (e) { return true; } })();
  if (!FLAG || !ND.duel || !ND.game) return;
  const D = ND.duel, G = ND.game, cam = ND.cam, T = D.T, pose = ND.pose;
  const QS = new URLSearchParams(location.search);


  const TEST = QS.get('duel') === '1';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const NAMES = {};
  for (const m of D.LIST || []) NAMES[m.id] = m.name.replace(/\s*\((?!R\)|L\)|low)[^)]*\)/, '');
  Object.assign(NAMES, { ak_catch: 'Iai no kamae (draw stance)', ak_catchCut: 'Iai-gaeshi', ak_s1: 'Kurenai Renga', ak_s2: 'Higanbana', ak_up: 'Kiriage (iai)',
    fk_s1: 'Yama-oroshi', fk_s2: 'Iwa-kudaki', fk_dh: 'Tatsu-maki', fk_up: 'Kiriage', fk_bh: 'Men-otoshi', ak_bl: 'Tsuka-ate (pommel)', kick: 'Mae-geri', throw: 'Shuriken',
    pr_smash: 'Breaks it over the head', pr_swing: 'Stool swing', pr_throw: 'Throws it', pr_kick: 'Kicks it at them', pr_shove: 'Kicked through the table', pr_rearm: 'Spare sword from the rack',
    sp_akane: 'KURENAI ISSEN (ki)', sp_kuro: 'YAMA KUDAKI (ki)', chase: 'Oikake (air chase)', chaseEnd: 'Otoshi (air spike)', air: 'Air cut' });

  const ONTO = { table: 'Kicked through the table', stool: 'Kicked over the stool', crate: 'Kicked into the crate', barrel: 'Kicked into the barrel',
    bale: 'Kicked into the straw', jar: 'Kicked into the jar', bucket: 'Kicked over the bucket' };
  function propName(f) {
    if (f.atkName !== 'pr_shove' || !ND.props || !f.mem || f.mem.pid == null) return null;
    const p = ND.props.get(f.mem.pid);
    return p ? ONTO[p.k] || 'Kicked into the ' + p.k : null;
  }
  const S = D.ui = {
    slow: TEST && QS.get('slow') === '1', names: TEST ? QS.get('names') !== '0' : QS.get('names') === '1', path: QS.get('path') === '1', help: QS.get('help') !== '0',
    side: QS.get('side') === '1' ? 1 : 0, lv: QS.has('lv') && [0, 1, 2].includes(+QS.get('lv')) ? +QS.get('lv') : 1, labels: [], seen: [null, null], hud: QS.get('hud') !== '0',
  };


  const adv0 = G.advance;

  G.advance = function (rdt) { if (S.helpEl && !S.helpEl.hidden && G.mode === 'cpu') { this.acc = 0; return 0; } return adv0.call(this, S.slow ? rdt * 0.25 : rdt); };






  const RANK = [[/DISARM/, 100], [/MAKI-OTOSHI|KIRI-OTOSHI|THROUGH THE STALL/, 95], [/BROKEN|ESCAPED|TOO EARLY|BREAKS/, 90], [/PUNISHED/, 80],
    [/SWORD BACK|RE-ARMED|TABLE FLIP|STOOL|TWIST|VAULT|KICK!|DUCK/, 75], [/SON VURUŞ|FINISHER/, 70], [/DENGE KIRILDI|POSTURE/, 65], [/KRİTİK|CRITICAL/, 60],
    [/YERE SERİLDİ|KNOCKDOWN|PINNED/, 55], [/KICKED AWAY|BIND/, 50], [/VURUŞLUK SERİ|RALLY/, 45], [/CATCH|IAI GAESHI|BLOCK|SWAY!|SLIP!/, 42], [/KARŞI!|COUNTER/, 40],
    [/SAVUŞTURMA|PARRY/, 35], [/OFF-LINE|ÇARPIŞMA|CLASH|KİLİTLENDİ|İTTİ|CUT!/, 30], [/KAFA|HEAD|HAVAYA|LAUNCH/, 22]];
  const rankOf = (s) => { for (const [re, p] of RANK) if (re.test(s)) return p; return 25; };
  const HL = S.hl = { head: null, sub: null };
  function headline(str, p, col) {
    const s0 = typeof str === 'string' && D.tr ? D.tr(str) : str, s = ND.i18n && typeof s0 === 'string' && s0 === str ? ND.i18n.t(s0) : String(s0);
    const it = { s, p: p ?? rankOf(str), col: col || '#ffd27a', age: 0 };
    const h = HL.head;


    if (!h || h.age > 0.85 || it.p >= h.p) HL.head = it;
  }
  D.headline = (s, p) => headline(s, p);

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
  const headUp = () => !!(HL.head && HL.head.age < 1.15);

  const ABOVE_HEADS = D.aboveHeads = () => { let y = -215; for (const f of G.F || []) if (f && !f.dead && !f.hidden) y = Math.min(y, f.y - 215); return y; };
  const ctrUp = () => !!(G.F && G.F.some((f) => G.isHuman && G.isHuman(f) && f.counterUntil > (G.clock || 0) && /^(block|parry|guard|move|recoil)$/.test(f.state)));
  const bindUp = () => !!(G.F && G.F.some((f) => f.dz && f.dz.cine && f.dz.cine.ph === 'bind' && f.dz.cine.def === f));


  D.underFlash = (b) => {
    const P = ND.fx && ND.fx.parts;
    if (!P) return false;
    for (const q of P) {
      if (q.k !== 'f' && q.k !== 'r' && q.k !== 's') continue;
      const r = (q.k === 's' ? 10 : (q.size || 60) * (q.k === 'r' ? 1 : 0.7)) * cam.k, x = cam.sx(q.x), y = cam.sy(q.y);
      const dx = Math.max(b.x0 - x, 0, x - b.x1), dy = Math.max(b.y0 - y, 0, y - b.y1);
      if (dx * dx + dy * dy < r * r) return true;
    }
    return false;
  };
  function drawHeadline(ctx, u) {
    const y0 = cam.H * 0.25;
    HL.sub = null;
    for (const [it, big] of [[HL.head, 1]]) {
      if (!it) continue;
      it.age += 1 / 60;
      const life = big ? 1.15 : 0.9;
      if (it.age > life) { if (big) HL.head = null; else HL.sub = null; continue; }
      const a = it.age < 0.8 * life ? 1 : 1 - (it.age - 0.8 * life) / (0.2 * life), pop = big ? 1 + Math.max(0, 0.12 - it.age) * 2.5 : 1;
      txt(ctx, it.s, cam.W / 2, big ? y0 : y0 + 34 * u, (big ? 30 : 17) * u * pop, big ? it.col : '#ece6d6', 'center', a, 'headline');
    }
  }


  const cineDraw0 = ND.cine.draw;
  ND.cine.draw = function (ctx) {
    cineDraw0.call(this, ctx);
    if (!S.hud) return;
    try { drawDuel(ctx); } catch (e) {                                                 }
  };

  D.textBoxes = [];
  function txt(ctx, s, x, y, px, col, align = 'center', a = 1, kind, who) {
    if (D.tr && typeof s === 'string') s = D.tr(s);
    ctx.globalAlpha = a; ctx.font = `700 ${Math.round(px)}px Oswald, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle';


    if (a > 0.05 && s) {
      const w = ctx.measureText(s).width, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, bx = { s: String(s), x0, y0: y - px * 0.55, x1: x0 + w, y1: y + px * 0.55, kind: kind || null, who: who ?? null };
      for (const o of D.textBoxes) if (Math.min(o.x1, bx.x1) - Math.max(o.x0, bx.x0) > 1 && Math.min(o.y1, bx.y1) - Math.max(o.y0, bx.y0) > 1) { ctx.globalAlpha = 1; return; }
      D.textBoxes.push(bx);
    }
    ctx.lineWidth = Math.max(2, px * 0.2); ctx.strokeStyle = 'rgba(5,6,12,.88)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y);
    ctx.globalAlpha = 1;
  }


  function clearTxt(ctx, s, x, y, px, col, kind, who) {
    ctx.font = `700 ${Math.round(px)}px Oswald, sans-serif`;
    const w = ctx.measureText(s).width;
    if (D.underFlash({ x0: x - w / 2, y0: y - px * 0.55, x1: x + w / 2, y1: y + px * 0.55 })) return;
    txt(ctx, s, x, y, px, col, 'center', 1, kind, who);
  }
  const human = (f) => !!(G.isHuman && G.isHuman(f));
  function drawDuel(ctx) {
    D.textBoxes.length = 0;
    if (!G.F || !(G.phase === 'fight' || G.phase === 'ko' || G.phase === 'intro')) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const k = cam.k, u = Math.max(cam.ui || cam.s, 0.55);

    drawHeadline(ctx, u);
    if (D.drawQuietFx) { const now = ND.scene.t, dt = S.qT != null ? Math.max(0, Math.min(0.1, now - S.qT)) : 0; S.qT = now; D.drawQuietFx(ctx, u, dt); }
    drawSeq(ctx, k, u);


    let promptWho = -1;
    const P0w = () => S.pick.who;
    if (S.pick && S.pick.t === ND.scene.t && !headUp()) {

      const own = G.F[P0w()], P0 = S.pick, X0 = own ? cam.sx(own.x) : cam.sx(P0.x), Y0 = own ? cam.sy(own.y - 236) + 16 * u : cam.sy(P0.y), sz0 = 13 * u;
      ctx.font = `700 ${Math.round(sz0)}px Oswald, sans-serif`;
      const w0 = ctx.measureText(P0.s).width;
      if (!D.underFlash({ x0: X0 - w0 / 2, y0: Y0 - sz0 * 0.55, x1: X0 + w0 / 2, y1: Y0 + sz0 * 0.55 })) { txt(ctx, P0.s, X0, Y0, sz0, '#ffd27a', 'center', 1, 'prompt', P0.who); promptWho = P0.who; }
    }
    S.pick = null;
    if (promptWho >= 0 && S.labels[0] && !S.labels[0].big && S.labels[0].f.id === promptWho) S.labels.length = 0;
    const tagsDue = [];
    for (const f of G.F) {
      const z = f.dz;
      if (!z || f.dead) continue;
      const hx = cam.sx(f.x), hy = cam.sy(f.y - 236);



      const FN = D.FIN, grp = FN ? 2 : 99, N = T.chainNeed, w = 11 * u, gap = 4 * u, gg = FN ? 5 * u : 0, ng = Math.floor((N - 1) / grp);
      const x0 = hx - ((N * w + (N - 1) * gap + ng * gg) / 2);
      if (z.chain > 0 || (z.cine && z.cine.def === f && !z.cine.fin)) {
        const tier = FN && z.chain > 0 && z.chain < N ? FN.tierOf(z.chain) : 0, hot = tier > (z.finTier || 0) && z.chainT <= FN.win;
        for (let i = 0; i < N; i++) {
          const x = x0 + i * (w + gap) + Math.floor(i / grp) * gg + w / 2, on = i < z.chain;
          ctx.beginPath(); ctx.moveTo(x, hy - w * 0.6); ctx.lineTo(x + w * 0.45, hy); ctx.lineTo(x, hy + w * 0.6); ctx.lineTo(x - w * 0.45, hy); ctx.closePath();
          ctx.fillStyle = on ? f.col.ui : 'rgba(10,12,20,.6)'; ctx.fill();
          ctx.lineWidth = 1.5 * u; ctx.strokeStyle = on ? '#fff3d0' : 'rgba(255,255,255,.35)'; ctx.stroke();
        }
        if (z.chain >= N) txt(ctx, 'BIND READY', hx, hy - 16 * u, 12 * u, '#ffd27a');
        else if (tier) {

          const xe = x0 + N * (w + gap) + ng * gg + 8 * u;
          ctx.globalAlpha = hot ? 1 : 0.45; ctx.font = `700 ${Math.round(15 * u)}px "Noto Serif JP", serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 3 * u; ctx.strokeStyle = 'rgba(5,5,8,.9)'; ctx.strokeText(['', '一', '二', '三'][tier], xe, hy + u);
          ctx.fillStyle = hot ? '#ffd27a' : '#e8e0cc'; ctx.fillText(['', '一', '二', '三'][tier], xe, hy + u);
          ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
        }
      }

      if (!z.armed) tagsDue.push([f, hx, hy]);

      if (S.names && f.state === 'atk' && f.serial !== S.seen[f.id]) {
        S.seen[f.id] = f.serial;

        const nm = (f.dz.lastMove && ND.ATK[f.dz.lastMove] === f.atk ? NAMES[f.dz.lastMove] : null) || propName(f) || NAMES[f.atkName];
        const ctr = f.atk && f.atk.counter;


        const pri = f.atk && f.atk.special ? 2 : ctr ? 1 : 0, cur = S.labels[0];
        if ((nm || ctr) && !(cur && cur.p > pri && cur.t < 0.7)) {
          const env = /^pr_/.test(f.atkName || '');
          S.labels.length = 0; S.labels.push({ f, s: nm || (ctr ? 'Counter' : (f.atkName || '').toUpperCase()), t: 0, col: env ? '#ffe3a1' : f.col.ui, p: env ? Math.max(pri, 1.5) : pri, big: env });
          if (D.clearQuietLabel) D.clearQuietLabel();
        }
      }
    }



    { const L0 = S.labels[0], labelOn = L0 && !L0.big ? L0.f : null;
      for (const [f, hx, hy] of tagsDue) if (!headUp() && !(L0 && L0.big) && promptWho !== f.id && labelOn !== f) clearTxt(ctx, 'UNARMED', hx, hy + 16 * u, 11 * u, '#ff9b7a', 'tag', f.id); }

    if (HL.head && HL.head.age < 1 && HL.head.p >= 60) S.labels.length = 0;
    for (let i = S.labels.length - 1; i >= 0; i--) {
      const L = S.labels[i]; L.t += 1 / 60;
      const life = L.big ? 1.25 : 0.9;
      if (L.t > life) { S.labels.splice(i, 1); continue; }
      const sz = (L.big ? 24 : 11) * u, w = L.big ? sz * 0.3 * L.s.length : 0;

      const x = L.big ? Math.max(w + 8 * u, Math.min(cam.W - w - 8 * u, cam.sx(L.f.x))) : cam.sx(L.f.x), y = L.big ? cam.sy(L.f.y - 200) - L.t * 12 * u : cam.sy(L.f.y - 236) + 17 * u;


      if (L.big && (headUp() || bindUp())) continue;
      if (!L.big && L.f.id === promptWho) continue;
      txt(ctx, L.s, x, y, sz, L.col, 'center', L.t < life - 0.2 ? 1 : 1 - (L.t - (life - 0.2)) / 0.2, L.big ? 'headline' : 'label', L.f.id);
    }

    for (const f of G.F) {
      const c = f.dz && f.dz.cine;
      if (!c || c.def !== f || c.ph !== 'bind') continue;



      if (!human(f)) { if (human(f.opp)) { const x = cam.sx(c.px), y = cam.sy(c.py); txt(ctx, 'BOUND!', x, y - 44 * k - 18 * u, 18 * u, '#ff9b7a'); } continue; }
      const x = cam.sx(c.px), y = cam.sy(c.py), W = T.bindWin, mid = (W[0] + W[1]) / 2;
      const r0 = 14 * k, r = r0 + Math.min(1, Math.max(0, (mid - c.t) / Math.max(0.05, mid))) * 14 * k - Math.max(0, c.t - mid) * 30 * k;
      const open = c.t >= W[0] && c.t <= W[1];
      ctx.lineWidth = 2 * u; ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.arc(x, y, r0, 0, 6.283); ctx.stroke();
      ctx.lineWidth = (open ? 4 : 3) * u; ctx.strokeStyle = open ? '#ffd27a' : '#ff9b7a';
      ctx.beginPath(); ctx.arc(x, y, Math.max(4, r), 0, 6.283); ctx.stroke();
      if (human(f)) {
        const tch = !!(ND.touch && ND.touch.active), key = tch ? 'ATTACK' : f.id === 0 ? 'F' : 'K';
        txt(ctx, 'STRIKE!', x, y - 28 * k - 18 * u, 20 * u, open ? '#ffd27a' : '#ece6d6');
        txt(ctx, key, x, y + 28 * k + 16 * u, 13 * u, '#ffd27a');
      }
    }

    if (S.path) for (const f of G.F) if (f.state === 'atk' && f.atk && f.atk.dz3 && f.atk.active && f.st < f.atk.active[1]) drawPath(ctx, f, k);
    ctx.restore();
  }

  function drawSeq(ctx, k, u) {
    const f = G.F.find((x) => x.dz && x.dz.seq && x.dz.seq.def === x);
    const c = f && f.dz.seq;
    if (!c || c.done || !D.SEQ) return;
    const B = D.SEQ.BEATS, b = B[c.next];
    if (!b) return;

    const dt = b.t - c.t, x = cam.sx(f.x), y = Math.max(40 * u, cam.sy(f.y - 236)), r0 = 15 * u, r = r0 + Math.max(0, dt) * 45 * u;
    const near = Math.abs(dt) <= D.SEQ.WIN;
    ctx.lineWidth = 2 * u; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(x, y, r0, 0, 6.283); ctx.stroke();
    if (dt > -D.SEQ.WIN && dt < 0.9) { ctx.lineWidth = (near ? 4 : 3) * u; ctx.strokeStyle = near ? '#ffd27a' : 'rgba(255,155,122,.9)'; ctx.beginPath(); ctx.arc(x, y, Math.max(4, r), 0, 6.283); ctx.stroke(); }
    if (dt < 0.9) txt(ctx, b.word, x, y - r0 - 12 * u, 15 * u, near ? '#ffd27a' : '#ece6d6');

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
      S.pick = { x: gx, y: gy - 46, s: D.tr('PICK UP') + (tch ? '' : ': ' + (owner.id === 0 ? 'T' : 'I')), t: ND.scene.t, who: owner.id };
    }
  };


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
  <li><b>Kicks:</b> KICK alone a front kick · <b>↓ + KICK</b> sweep (jump over it) · <b>← + KICK</b> spinning kick (slow, strong) · <b>→ + KICK</b> hand kick (into a cut's wind-up: the sword flies) · <b>in the air</b> flying kick · <b>← → + KICK</b> your ninja's own kick · unarmed at your sword: KICK flicks it up.</li>
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

    const unlock = () => {
      try { ND.audio.init(); ND.audio.setEnabled(ND.settings.sound); if (ND.music) { ND.music.init(); ND.music.setEnabled(ND.settings.music); ND.music.setMode('fight'); } } catch (e) {                }
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

  if (TEST && QS.get('auto') !== '0') {
    const go = () => setTimeout(boot, 0);
    if (document.readyState === 'complete') go(); else addEventListener('load', go);
  }













  const FXS = {
    small: { ring: 0.5, flash: 0.5, spark: 0.5, sparkPow: 0.7, slashLen: 0, slashW: 0.5, slashLife: 0.5, slashSat: 0.5, ghosts: 1, ghostLife: 0.55,
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
    const SL = D.slashMarks = [];
    D.quietDefence = quiet;
    D.clearQuietLabel = () => { Q.label = null; };
    const fx = ND.fx, ring0 = fx.ring, flash0 = fx.flash, spark0 = fx.spark, text1 = fx.text;
    fx.ring = function (x, y, col, size) { if (!quiet()) return ring0.apply(this, arguments); if (!X.ring || Q.inParry) return; return ring0.call(this, x, y, col, (size == null ? 90 : size) * X.ring); };
    fx.flash = function (x, y, ang, size, col) { if (!quiet()) return flash0.apply(this, arguments); if (!X.flash) return; return flash0.call(this, x, y, ang, (size == null ? 60 : size) * X.flash, col); };

    fx.spark = function (x, y, dir, n, power, col) {
      if (!quiet()) return spark0.apply(this, arguments);
      if (X.contact && !G.simOnly) {
        const t = ND.scene.t;
        if (t - Q.lastFl > 0.12 || Math.hypot(x - Q.flX, y - Q.flY) > 30) { Q.flashes.push({ x, y, age: 0 }); Q.lastFl = t; Q.flX = x; Q.flY = y; if (Q.flashes.length > 4) Q.flashes.shift(); }
      }
      return spark0.call(this, x, y, dir, Math.max(2, Math.round((n == null ? 14 : n) * X.spark)), (power == null ? 1 : power) * X.sparkPow, col);
    };

    fx.text = function (x, y, str, color) {
      const raw = String(str), sx = ND.i18n && typeof str === 'string' ? ND.i18n.t(str) : raw;

      if (/SER[İI]|RALLY/i.test(raw) && duel()) { if (!G.simOnly && X.rally) Q.corner = { s: sx, col: color || '#ff9b7a', age: 0 }; return; }
      if (!quiet() || /DISARM/i.test(raw)) return text1.apply(this, arguments);
      if (G.simOnly || !X.words) return;
      if (S.labels[0] && S.labels[0].p >= 2 && S.labels[0].t < 0.7) return;
      S.labels.length = 0;
      Q.label = { s: sx, col: color || '#ffe3a1', x: (ND.simClock || 0) - Q.ct < 0.6 ? Q.cx : x, age: 0, life: 0.75, k: X.words };
    };
    const FPq = ND.Fighter.prototype, blk0 = FPq.blocked, gh0 = FPq.addGhost;
    FPq.blocked = function (a, x, y) { if (this.dz) { mark(0.5); Q.cx = x; Q.cy = y; Q.ct = ND.simClock || 0; } return blk0.apply(this, arguments); };

    const tr0 = FPq.drawTrail;
    FPq.drawTrail = function (ctx) {
      if (!this.dz || !quiet()) return tr0.apply(this, arguments);
      const a = this.state === 'atk' && this.atk && this.atk.counter ? X.trailC : X.trail;
      if (a <= 0) return;
      const g0 = ctx.globalAlpha; ctx.globalAlpha = g0 * a;
      try { return tr0.apply(this, arguments); } finally { ctx.globalAlpha = g0; }
    };

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

      C.onParry = function (def, att, x, y) {
        if (!duel()) return onParry0.apply(this, arguments);
        mark(0.8); Q.cx = x; Q.cy = y; Q.ct = ND.simClock || 0; Q.inParry = true;
        try { onParry0.apply(this, arguments); } finally { Q.inParry = false; }
        this.rings.length = 0;
        if (X.ring) ring0.call(fx, x, y, '255,244,214', 130 * X.ring);
      };

      C.counterStart = function () {
        if (!duel()) return start0.apply(this, arguments);
        mark(0.8);
        const r = start0.apply(this, arguments);
        const b = this.banner;
        this.banner = null;
        if (b && X.banner && !G.simOnly && !(S.labels[0] && S.labels[0].p >= 2 && S.labels[0].t < 0.7)) S.labels.length = 0, Q.label = { s: b.name, col: 'rgb(' + (b.col || b.t.col) + ')', x: (ND.simClock || 0) - Q.ct < 0.6 ? Q.cx : (b.f.x + b.f.opp.x) / 2, age: 0, life: 1.05 * X.bannerLife, k: X.banner * 1.6 };

        if (G.dim > X.dim) G.dim = X.dim;
        return r;
      };

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


      const pr0 = C.drawPrompt;
      if (pr0) C.drawPrompt = function (ctx, f, s2) { if (duel() && bindUp()) return; return pr0.call(this, ctx, f, s2); };
      const num0 = C.drawNum;

      const numUp = (n, fn) => { const y0 = n.y; n.y = Math.min(n.y, ABOVE_HEADS() - 85); try { return fn(); } finally { n.y = y0; } };
      C.drawNum = function (ctx, n, s2) {
        if (!duel()) return num0.call(this, ctx, n, s2);
        if (!quiet()) return numUp(n, () => num0.call(this, ctx, n, s2));
        if (!X.nums || n !== this.nums[this.nums.length - 1]) return;
        const x = cam.sx(n.x), y = cam.sy(n.y);
        ctx.save(); ctx.translate(x, y); ctx.scale(X.nums, X.nums); ctx.translate(-x, -y);
        try { numUp(n, () => num0.call(this, ctx, n, s2)); } finally { ctx.restore(); }
      };
      C.drawSlash = function (ctx, sl, s2) {
        if (!sl.small) return slash0.call(this, ctx, sl, s2);
        const x = cam.sx(sl.x), y = cam.sy(sl.y);
        ctx.save(); ctx.translate(x, y); ctx.rotate(sl.a); ctx.scale(X.slashLen, X.slashW); ctx.rotate(-sl.a); ctx.translate(-x, -y);
        try { slash0.call(this, ctx, sl, s2); } finally { ctx.restore(); }
      };
    }


    const special = () => !!(G.F && G.F.some((f) => f.dz && f.state === 'atk' && f.atk && f.atk.special));


    if (ND.scene && ND.scene.lightFighter) {
      const lf0 = ND.scene.lightFighter, HF = new WeakMap();
      (ND.onLook || (ND.onLook = [])).push((f) => { HF.delete(f); });
      ND.scene.lightFighter = function (c, f) {
        if (!f || !f.dz) return lf0.apply(this, arguments);
        let h = HF.get(f); if (!h) HF.set(f, (h = { last: 0, n: 9 }));
        const fl = f.flash || 0;
        if (fl > h.last + 0.05) h.n = 0;
        h.last = fl; h.n++;
        f.flash = fl > 0 && h.n <= 3 ? 0.12 : 0;

        const ga = c.globalAlpha; c.globalAlpha = ga * 0.35;
        try { return lf0.apply(this, arguments); } finally { f.flash = fl; c.globalAlpha = ga; }
      };
    }

    const fl1 = fx.flash, rg1 = fx.ring;



    const big = () => !!(D.hitCur && D.hitCur.big), inHit = () => !!D.hitCur;
    fx.flash = function (x, y, ang, size, col) { if (!duel()) return fl1.apply(this, arguments); return fl1.call(this, x, y, ang, Math.min(size == null ? 60 : size, big() ? 48 : 36), col); };
    fx.ring = function (x, y, col, size) { if (!duel()) return rg1.apply(this, arguments); if (inHit() && !big()) return; return rg1.call(this, x, y, col, Math.min(size == null ? 90 : size, 70)); };
    if (fx.blood) { const bl0 = fx.blood; fx.blood = function (x, y, dx, dy, n, power) { if (!duel()) return bl0.apply(this, arguments); return bl0.call(this, x, y, dx, dy, Math.max(3, Math.round((n == null ? 18 : n) * (inHit() ? 0.6 : 0.35))), (power == null ? 1 : power) * (big() ? 1 : 0.55)); }; }


    if (ND.specialFx) {
      const add0 = ND.specialFx.add, ARC = {};
      ND.specialFx.add = function (o) {



        const ctrF = o && o.f && o.f.state === 'atk' && o.f.atk && (o.f.atk.counter || o.f.atkName === 'finisher');
        if (o && o.draw && o.span != null && duel() && !special() && ctrF) {
          o.r = Math.min(o.r || 0, 30); if (o.w) o.w = Math.min(o.w, 6); if (o.life) o.life = Math.min(o.life, 0.18);
          const dim = (c) => (typeof c === 'string' && /^\d+,\d+,\d+$/.test(c) ? c.split(',').map((v) => Math.round(+v * 0.6)).join(',') : c);
          o.col = dim(o.col); o.core = dim(o.core);
          return add0.call(this, o);
        }
        if (o && o.draw && o.span != null && duel() && !special()) { o.t = o.life || 1; return o; }
        if (o && o.draw && duel() && (quiet() || special())) {
          if (!X.special && quiet()) { o.t = 0; return o; }
          const k = X.special || 0.5;
          if (o.r) o.r = Math.min(o.r * k, o.span == null ? 22 : o.r * k); if (o.w) o.w *= k; if (o.life) o.life *= 0.6 + 0.4 * k;




          if (quiet() && o.span != null) {
            o.r = Math.min(o.r || 0, 34); if (o.w) o.w = Math.min(o.w, 8); if (o.life) o.life = Math.min(o.life, 0.25);
            const dim = (c) => (typeof c === 'string' && /^\d+,\d+,\d+$/.test(c) ? c.split(',').map((v) => Math.round(+v * 0.45)).join(',') : c);
            o.col = dim(o.col); o.core = dim(o.core);
            const now = ND.simClock || 0;
            if (o.f || o.x != null) { const key = o.f ? o.f.id : Math.round(o.x / 200); ARC[key] = ARC[key] || -9; if (now - ARC[key] < 0.2) { o.t = o.life || 1; return o; } ARC[key] = now; }
          }
        }
        return add0.call(this, o);
      };
    }

    {
      const GN2 = new WeakMap(), gh1 = FPq.addGhost, dg0 = FPq.drawGhosts;
      FPq.addGhost = function () {
        if (!this.dz) return gh1.apply(this, arguments);
        let g = GN2.get(this);
        if (!g || g.serial !== this.serial) GN2.set(this, (g = { serial: this.serial, n: 0 }));
        if (g.n >= 1 || this.ghosts.length >= 1) return;
        const before = this.ghosts.length;
        gh1.apply(this, arguments);
        if (this.ghosts.length > before) g.n++;
      };
      FPq.drawGhosts = function (ctx) {
        if (!this.dz || !this.ghosts.length) return dg0.apply(this, arguments);

        const all = this.ghosts, keep = all.filter((g) => !g.c), L = keep.map((g) => g.life);
        for (const g of keep) g.life *= 0.3;
        this.ghosts = keep;
        try { return dg0.apply(this, arguments); } finally { keep.forEach((g, i) => { g.life = L[i]; }); this.ghosts = all; }
      };
    }

    if (G.onFinisher) { const fin0 = G.onFinisher; G.onFinisher = function () { const r = fin0.apply(this, arguments); if (duel() && this.dim > X.dim) this.dim = X.dim; return r; }; }
    if (ND.depth25) ND.depth25.trailAlpha = (f) => ((f.state === 'atk' && f.atk && f.atk.counter) || f.state === 'dbind' || f.state === 'dcut' ? X.trailC : X.trail);

    D.drawQuietFx = function (ctx, u, dt) {
      const L = Q.label;
      if (L) {
        L.age += dt;

        if (L.age > L.life) Q.label = null;


        else if (!headUp() && !bindUp() && !ctrUp()) txt(ctx, L.s, cam.sx(L.x), cam.sy(ABOVE_HEADS() - 55) - 10 * Math.min(1, L.age / 0.3) * u, 14 * u * L.k, L.col, 'center', L.age < L.life - 0.2 ? 1 : (L.life - L.age) / 0.2, 'word');
      }
      const R = Q.corner;
      if (R) {
        R.age += dt;
        if (R.age > 1.6) Q.corner = null;
        else txt(ctx, R.s, cam.W - 18 * u, cam.H * 0.22, 13 * u, R.col, 'right', R.age < 1.3 ? 1 : (1.6 - R.age) / 0.3);
      }

      for (let i = SL.length - 1; i >= 0; i--) {
        const m = SL[i]; m.age += dt;
        if (m.age > m.life || !G.F || !G.F[0].dz) { SL.splice(i, 1); continue; }
        const sn = ND.depth25 && ND.depth25.snap ? ND.depth25.snap(m.def, {}) : null;
        if (!sn || !sn.hip || !sn.neck) continue;
        const kk = cam.k, a = 1 - m.age / m.life, hx = cam.sx(sn.hip.x), hy = cam.sy(sn.hip.y), nx = cam.sx(sn.neck.x), ny = cam.sy(sn.neck.y), R = 27 * kk;
        ctx.save();
        ctx.beginPath(); ctx.lineCap = 'round'; ctx.lineWidth = 2 * R; ctx.moveTo(hx, hy); ctx.lineTo(nx, ny);
        { const ang2 = Math.atan2(ny - hy, nx - hx), px = Math.cos(ang2 + Math.PI / 2) * R, py = Math.sin(ang2 + Math.PI / 2) * R; ctx.beginPath(); ctx.arc(hx, hy, R, ang2 + Math.PI / 2, ang2 - Math.PI / 2); ctx.lineTo(nx - px, ny - py); ctx.arc(nx, ny, R, ang2 - Math.PI / 2, ang2 + Math.PI / 2); ctx.closePath(); }
        ctx.clip();
        const cx = cam.sx(m.x), cy = cam.sy(m.y), L = m.len * kk * (0.75 + 0.25 * Math.min(1, m.age / 0.04)), ux = Math.cos(m.ang), uy = Math.sin(m.ang), bend = 0.18 * L;
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.lineCap = 'round';
        for (const [w, col] of [[m.w * 2.2, 'rgba(255,214,160,0.35)'], [m.w, 'rgba(255,250,236,1)']]) {
          ctx.strokeStyle = col; ctx.lineWidth = w * kk; ctx.beginPath(); ctx.moveTo(cx - ux * L / 2, cy - uy * L / 2);
          ctx.quadraticCurveTo(cx - uy * bend, cy + ux * bend, cx + ux * L / 2, cy + uy * L / 2); ctx.stroke();
        }
        ctx.restore();
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








  {
    const FPi = ND.Fighter.prototype, th = FPi.takeHit, hs0 = G.hitstop, pu0 = cam.punch, fxi = ND.fx;
    const BIG = /heavy|finisher|kaeshi|riposte|men|kabuto|ryusei|maki|iwa|sp_/i;
    let cur = null;
    FPi.takeHit = function (raw, a, from, x, y) {
      if (!(from && from.dz && this.dz && a)) return th.apply(this, arguments);
      const prev = cur;
      cur = { base: raw, big: !!(a.counter || a.crush || a.special || a.knock || a.launch || BIG.test(from.atkName || '')) };
      D.hitCur = cur;
      const hp0 = this.hp;
      try { return th.apply(this, arguments); } finally {
        const landed = this.hp < hp0 && this.state !== 'block' && this.state !== 'parry' && this.state !== 'guard';
        if (landed && fxi && fxi.spark && !G.simOnly) {

          let sx = x, sy = y;
          const sn = ND.depth25 && ND.depth25.snap ? ND.depth25.snap(this, {}) : null;
          if (sn && sn.hip && sn.neck && a.kind === 'blade') { const tw = from.x < this.x ? -1 : 1; sx = sn.hip.x + (sn.neck.x - sn.hip.x) * 0.58 + tw * 18; sy = sn.hip.y + (sn.neck.y - sn.hip.y) * 0.58; }
          if (sx != null && sy != null) fxi.spark(sx, sy, from.dir, cur.big ? 9 : 6, cur.big ? 1.25 : 1, '255,250,235');

          const J = from.viewJ ? from.viewJ() : from.j;
          if (a.kind === 'blade' && sx != null && J && J.haF && J.tip && D.slashMarks) {
            D.slashMarks.push({ def: this, x: sx - (from.x < this.x ? -1 : 1) * 6, y: sy, ang: Math.atan2(J.tip.y - J.haF.y, J.tip.x - J.haF.x), len: cur.big ? 46 : 30, w: cur.big ? 3.2 : 2, life: cur.big ? 0.16 : 0.11, age: 0 });
            if (D.slashMarks.length > 4) D.slashMarks.shift();
          }

          if (cur.big && fxi.ring) fxi.ring(sx, sy, '255,240,215', 44);
        }
        cur = prev; D.hitCur = prev;
      }
    };
    G.hitstop = function (t) {
      if (cur) {
        const sc = D.hitRawScaled;
        if (sc != null && Math.abs(t - (0.05 + sc * 0.0045)) < 1e-6) t = 0.05 + cur.base * 0.0045;
        t = Math.max(t * (cur.big ? 1.3 : 1.15), cur.big ? 0.15 : 0.09);
      }
      return hs0.call(this, t);
    };
    cam.punch = function (amt) {
      if (cur) {
        const sc = D.hitRawScaled;
        if (sc != null && Math.abs(amt - (2 + sc * 0.4)) < 1e-6) amt = 2 + cur.base * 0.4;
        amt = cur.big ? Math.max(amt, 8) : Math.min(amt, 2.5);
      }
      return pu0.call(this, amt);
    };
  }
})(window.ND);







(function (ND) {
  'use strict';
  const FP = ND.Fighter && ND.Fighter.prototype;
  if (!FP || !FP.cloth || !ND.duel) return;
  const LAST = new WeakMap(), JUMP = 60;
  const ropes = (f) => { const L = []; if (f.tails) for (const r of f.tails) if (r) L.push(r); if (f.sash) L.push(f.sash); return L; };
  const thrown = (R) => {
    const p = R.p; if (!R.init || !p || p.length < 2) return false;
    const far = (R.seg || 7) * p.length * 1.3;
    for (let i = 1; i < p.length; i++) if (!(Math.abs(p[i].x - p[0].x) < far && Math.abs(p[i].y - p[0].y) < far)) return true;
    return false;
  };
  const cl0 = FP.cloth;
  FP.cloth = function (j, dt) {
    const x = typeof this.x === 'number' ? this.x : null, y = typeof this.y === 'number' ? this.y : 0;
    if (x !== null) {
      const l = LAST.get(this);
      if (l && (Math.abs(x - l.x) > JUMP || Math.abs(y - l.y) > JUMP)) for (const R of ropes(this)) R.init = false;
      if (l) { l.x = x; l.y = y; } else LAST.set(this, { x, y });
    }
    const r = cl0.call(this, j, dt);
    for (const R of ropes(this)) if (thrown(R)) R.init = false;
    return r;
  };
})(window.ND);





(function (ND) {
  'use strict';
  const D = ND.duel, FP = ND.Fighter && ND.Fighter.prototype, G = ND.game, au = ND.audio;
  if (!D || !FP || !G || !au) return;
  const bladeless = (f) => !!(f && (f.dz ? f.dz.armed === false : false) || (f && f.wpn && (f.wpn.fist || f.wpn.none)));
  const soft = (a, b) => !!(a && b && (a.dz || b.dz) && (bladeless(a) || bladeless(b)));
  const S = D.softSound = { on: 0, env: 0, log: null };
  const smack = (p, pan, hi) => { au.noise({ type: 'bandpass', f0: (hi ? 1900 : 1150) * au.vr(0.15), q: 1.1, dur: hi ? 0.035 : 0.05, gain: (hi ? 0.55 : 0.4) * p, attack: 0.001, send: 0.08, pan }); };
  const body = {
    clang(power = 1, pan = 0) { if (S.log) S.log.push('body-block'); const p = Math.min(1.4, 0.5 + 0.45 * power); au.thud(p, pan); smack(p, pan, false); },
    parry(pan = 0) { if (S.log) S.log.push('body-parry'); au.thud(0.7, pan); smack(1.1, pan, true); },
    kShing() { if (S.log) S.log.push('body-noshing'); },
  };
  const real = { clang: au.clang, parry: au.parry, kShing: au.kShing };
  for (const k of ['clang', 'parry', 'kShing']) {
    if (typeof real[k] !== 'function') continue;
    au[k] = function () {


      if (S.on > 0 || (S.env === 0 && G.F && G.F.some((f) => f.dz && bladeless(f)))) return body[k].apply(this, arguments);
      if (S.log) S.log.push('metal-' + k + (S.trace ? ' @ ' + String(new Error().stack).split(String.fromCharCode(10)).slice(2, 5).map((l) => l.trim().split('/js/').pop()).join(' < ') : ''));
      return real[k].apply(this, arguments);
    };
  }
  const scoped = (fn, pair) => function () {
    const on = soft.apply(null, pair(this, arguments));
    if (on) S.on++;
    try { return fn.apply(this, arguments); } finally { if (on) S.on--; }
  };
  const envScope = (fn) => function () { S.env++; try { return fn.apply(this, arguments); } finally { S.env--; } };
  if (D.DuelSword && D.DuelSword.prototype.update) D.DuelSword.prototype.update = envScope(D.DuelSword.prototype.update);
  if (D.arenaStep) D.arenaStep = envScope(D.arenaStep);
  if (ND.props && ND.props.step) ND.props.step = envScope(ND.props.step);
  if (ND.KAESHI && ND.KAESHI.sound) { const ks0 = ND.KAESHI.sound; ND.KAESHI.sound = function (f, kind) { if (kind !== 'ground') return ks0.apply(this, arguments); S.env++; try { return ks0.apply(this, arguments); } finally { S.env--; } }; }
  if (FP.blocked) FP.blocked = scoped(FP.blocked, (f) => [f, f.opp]);
  if (FP.clash) FP.clash = scoped(FP.clash, (f) => [f, f.opp]);
  if (G.startLock) G.startLock = scoped(G.startLock, (g, a) => [a[0], a[1]]);
  if (G.endLock) G.endLock = scoped(G.endLock, (g) => [g.F[0], g.F[1]]);
})(window.ND);






(function (ND) {
  'use strict';
  if (typeof window === 'undefined' || !window.__ndTestBuild || typeof document === 'undefined') return;
  const G = ND.game, KEY = 'sd_test_speed', STEPS = [1, 0.75, 0.5];
  let mul = 1;
  try { const v = +localStorage.getItem(KEY); if (STEPS.includes(v)) mul = v; } catch (e) {                    }
  const local = () => !!(G && G.mode && G.mode !== 'online' && G.mode !== 'shadow');
  const ts0 = ND.timeScale;
  ND.timeScale = function (g) { const v = ts0 ? ts0(g) : 1; return local() ? v * mul : v; };
  const el = document.createElement('div');
  el.id = 'tbHud';
  el.style.cssText = 'position:fixed;left:6px;bottom:28px;z-index:2147483647;font:600 11px/1.3 system-ui,sans-serif;color:#cfe8ff;background:rgba(0,0,0,.6);padding:3px 7px;border-radius:4px;display:flex;gap:8px;align-items:center';
  const txt = document.createElement('span'), btn = document.createElement('button');
  btn.type = 'button';
  btn.style.cssText = 'font:700 11px/1 system-ui,sans-serif;color:#1b140c;background:#ffd27a;border:0;border-radius:4px;padding:3px 6px;cursor:pointer';
  const label = () => { btn.textContent = local() ? `Hız ${String(mul).replace('.', ',')}×` : '1×, çevrimiçi'; btn.disabled = !local(); };
  btn.onclick = (e) => { e.stopPropagation(); mul = STEPS[(STEPS.indexOf(mul) + 1) % STEPS.length]; try { localStorage.setItem(KEY, String(mul)); } catch (er) {                    } label(); };
  el.append(txt, btn);
  const put = () => { if (document.body) document.body.appendChild(el); else setTimeout(put, 200); };
  put();
  const TIER = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' };
  const T = [];
  let last = 0, shown = 0;
  const frame = (t) => {
    if (last) T.push([t, t - last]);
    last = t;
    while (T.length && T[0][0] < t - 2000) T.shift();
    if (t - shown > 500) {
      shown = t;
      const n1 = T.filter((q) => q[0] >= t - 1000).length, worst = T.reduce((m, q) => Math.max(m, q[1]), 0);
      const tier = ND.gfx ? TIER[ND.gfx.tier] || ND.gfx.tier : '?', dev = (ND.gfx && ND.gfx.mobile) || (ND.touch && ND.touch.mobile) ? 'telefon' : 'bilgisayar';
      txt.textContent = `${n1} fps · en yavaş ${Math.round(worst)} ms · ${tier} · ${dev}`;
      label();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})(window.ND);
