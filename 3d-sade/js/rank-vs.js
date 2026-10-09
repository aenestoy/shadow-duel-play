




























(function (ND) {
  'use strict';
  if (!ND || typeof document === 'undefined') return;
  const doc = document;
  const safe = (f) => { try { return f(); } catch (e) { return undefined; } };
  const QS = new URLSearchParams(location.search);
  const RM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const still = () => RM.matches || QS.get('motion') === 'off';


  const TX = {
    en: ['Season {n} finish', 'First season', 'Not ranked', '{n} pts', 'Ready', 'LV', 'Demo · made-up players · tap for the next pair'],
    tr: ['Sezon {n} sonu', 'İlk sezon', 'Derecesiz', '{n} puan', 'Hazır', 'SV', 'Deneme · uydurma oyuncular · sıradaki için dokun'],
    es: ['Final temp. {n}', 'Primera temporada', 'Sin rango', '{n} pts', 'Listo', 'NV', 'Demo · jugadores inventados · toca para el siguiente'],
    pt: ['Final da temp. {n}', 'Primeira temporada', 'Sem ranque', '{n} pts', 'Pronto', 'NV', 'Demo · jogadores fictícios · toque para o próximo'],
    ru: ['Итог сезона {n}', 'Первый сезон', 'Без ранга', '{n} очк.', 'Готово', 'УР', 'Демо · вымышленные игроки · нажмите для следующих'],
    de: ['Ende Saison {n}', 'Erste Saison', 'Ohne Rang', '{n} Pkt.', 'Bereit', 'ST', 'Demo · erfundene Spieler · tippen für die nächsten'],
    fr: ['Fin saison {n}', 'Première saison', 'Non classé', '{n} pts', 'Prêt', 'NV', 'Démo · joueurs fictifs · touchez pour la suite'],
    it: ['Fine stagione {n}', 'Prima stagione', 'Senza grado', '{n} pt', 'Pronto', 'LV', 'Demo · giocatori inventati · tocca per i prossimi'],
    pl: ['Koniec sezonu {n}', 'Pierwszy sezon', 'Bez rangi', '{n} pkt', 'Gotowe', 'POZ', 'Demo · zmyśleni gracze · dotknij, by zobaczyć kolejnych'],
    id: ['Akhir musim {n}', 'Musim pertama', 'Tanpa peringkat', '{n} poin', 'Siap', 'LV', 'Demo · pemain rekaan · ketuk untuk berikutnya'],
    vi: ['Cuối mùa {n}', 'Mùa đầu tiên', 'Chưa xếp hạng', '{n} điểm', 'Sẵn sàng', 'CẤP', 'Demo · người chơi giả · chạm để xem cặp tiếp'],
    th: ['จบซีซัน {n}', 'ซีซันแรก', 'ไม่มีแรงก์', '{n} แต้ม', 'พร้อม', 'เลเวล', 'เดโม · ผู้เล่นสมมติ · แตะเพื่อดูคู่ถัดไป'],
    hi: ['सीज़न {n} का अंत', 'पहला सीज़न', 'बिना रैंक', '{n} अंक', 'तैयार', 'लेवल', 'डेमो · काल्पनिक खिलाड़ी · अगली जोड़ी के लिए टैप करें'],
    ar: ['نهاية الموسم {n}', 'الموسم الأول', 'بلا تصنيف', '{n} نقطة', 'جاهز', 'مستوى', 'عرض · لاعبون وهميون · المس للتالي'],
    zh: ['第{n}赛季结束', '首个赛季', '未定级', '{n}分', '就绪', '等级', '演示 · 虚构玩家 · 点击查看下一组'],
    'zh-TW': ['第{n}賽季結束', '首個賽季', '未定級', '{n}分', '就緒', '等級', '示範 · 虛構玩家 · 點擊看下一組'],
    ja: ['シーズン{n}最終', '最初のシーズン', 'ランクなし', '{n}pt', '準備完了', 'Lv', 'デモ · 架空のプレイヤー · タップで次へ'],
    ko: ['시즌 {n} 최종', '첫 시즌', '랭크 없음', '{n}점', '준비 완료', 'Lv', '데모 · 가상의 플레이어 · 탭하여 다음'],
  };
  const lang = () => (ND.i18n && typeof ND.i18n.lang === 'string' ? ND.i18n.lang : 'tr');
  const tx = (i, n) => { const t = (TX[lang()] || TX.en)[i] || TX.en[i]; return n == null ? t : t.replace('{n}', String(n)); };

  const RL = () => (ND.ranked && ND.ranked.labels ? safe(() => ND.ranked.labels()) : null) || (ND.STR && ND.STR.ranked) || {};
  const tierInfo = (t) => (ND.ranked && ND.ranked.tierInfo ? ND.ranked.tierInfo(t) : { t: Math.min(5, Math.floor(t / 3)), d: 0, n: 'Tier ' + t, col: '#d9b36c' });
  const emblem = (tier, o) => safe(() => { const e = ND.rankEmblem && ND.rankEmblem.el ? ND.rankEmblem.el(tier, o) : null; if (e) e.setAttribute('aria-hidden', 'true'); return e; }) || null;
  const el = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const latin = (e) => { e.lang = 'en'; e.setAttribute('translate', 'no'); return e; };
  const rgba = (hex, a) => { const h = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#d9b36c'; const x = parseInt(h.slice(1), 16); return `rgba(${x >> 16},${(x >> 8) & 255},${x & 255},${a})`; };


  const finOk = (f) => f && Number.isFinite(+f.season) && (f.tier != null || f.peak != null);
  function sideOf(s, o) {
    s = s && typeof s === 'object' ? s : {}; o = o || {};
    const L = RL();
    const ghost = !!(o.ghost || s.ghost), guest = !ghost && !!s.guest;
    const m = {
      you: !!o.you, ninja: o.ninja || 'akane', look: o.look == null ? false : o.look, ghost, house: !!s.house, guest,
      name: o.name || s.name || s.nick || '—', tier: null, placement: 0, of: 0, rating: null, season: o.season | 0,
      lv: null, pf: null, title: null, badges: [], prev: null, card: null,
    };
    if (!guest && !(ghost && s.house)) {
      m.tier = Number.isFinite(+s.tier) && s.tier != null ? Math.max(0, Math.min(15, s.tier | 0)) : null;
      m.placement = s.placement > 0 ? s.placement | 0 : 0;
      m.of = s.placement > 0 ? Math.max(m.placement, s.placement_of | 0 || (s.games === 0 && m.placement > 3 ? m.placement : m.placement + (s.games | 0))) : 0;
      m.rating = Number.isFinite(+s.rating) && s.rating != null && !m.placement ? Math.round(+s.rating) : null;
    }



    const hasFin = Array.isArray(s.finals);
    const fin = (hasFin ? s.finals : Array.isArray(s.badges) ? s.badges : []).filter(finOk)
      .map((f) => ({ season: f.season | 0, tier: Math.max(0, Math.min(15, (f.tier != null ? f.tier : f.peak) | 0)), peak: f.peak != null ? Math.max(0, Math.min(15, f.peak | 0)) : null, place: f.place > 0 ? f.place | 0 : null }))
      .sort((a, b) => b.season - a.season);
    if (!guest && !ghost && !o.noRank) {
      if (!(m.season > 1)) m.prev = { first: true };
      else if (hasFin) { const f = fin.find((x) => x.season === m.season - 1); m.prev = f ? { season: f.season, tier: f.tier, place: f.place } : { season: m.season - 1, none: true }; }
    }
    m.fin = fin;

    const rt = s.title_id && ND.rewards ? safe(() => ND.rewards.title(s.title_id)) : null;
    if (rt) m.title = { name: rt.name, color: rt.color, icon: rt.icon };
    else if (o.title && o.title.name) m.title = o.title;
    m.dan = s.dan | 0;
    m.monthly = s.best_place ? safe(() => ND.leaderboard && ND.leaderboard.titleLabel ? ND.leaderboard.titleLabel({ place: s.best_place, wins: s.wins | 0, podiums: s.podiums | 0 }) : '') || '' : '';
    if (s.plate && typeof s.plate === 'object') plateInto(m, s.plate);
    else badgesOf(m);
    if (ghost) m.name = o.name || m.name;
    m.L = L;
    return m;
  }

  function plateInto(m, p) {
    if (!p || typeof p !== 'object') { badgesOf(m); return m; }
    const P = ND.pass, eq = p.eq && typeof p.eq === 'object' ? p.eq : {};
    m.lv = Number.isFinite(+p.lv) && p.lv > 0 ? p.lv | 0 : null;
    const fr = eq.frame && P && P.itemInfo ? P.itemInfo(eq.frame) : null; m.pf = fr && fr.color ? fr.color : null;
    if (!m.title && eq.title && P && P.itemInfo) { const t = P.itemInfo(eq.title); if (t && t.name) m.title = { name: t.name, color: t.color, icon: '' }; }
    m.badge = eq.badge && P && P.itemInfo ? P.itemInfo(eq.badge) : null;
    m.card = typeof eq.card === 'string' ? eq.card : null;
    m.seal = p.jc && typeof p.jc === 'object' ? Math.min(3, Math.max(0, ...Object.values(p.jc).map((v) => v | 0), 0)) : 0;
    return badgesOf(m);
  }

  function badgesOf(m) {
    const out = [], fin = m.fin || [];
    for (const f of fin) if (f.place === 1) out.push({ k: 'crest', tier: f.peak != null ? f.peak : f.tier, season: f.season, champ: true });
    if (m.seal) out.push({ k: 'seal', n: m.seal });
    if (m.badge && m.badge.icon) out.push({ k: 'icon', icon: m.badge.icon, color: m.badge.color, name: m.badge.name });
    for (const f of fin) if (f.place !== 1) out.push({ k: 'crest', tier: f.peak != null ? f.peak : f.tier, season: f.season, top: f.place && f.place <= 10 ? f.place : 0 });
    const ds = m.dan > 0 && ND.leaderboard && ND.leaderboard.danShort ? ND.leaderboard.danShort(m.dan) : '';
    if (ds) out.push({ k: 'txt', text: ds });
    if (!m.title && m.monthly) m.title = { name: m.monthly, color: '#d9b36c', icon: '' };
    m.more = Math.max(0, out.length - 5);
    m.badges = out.slice(0, 5);
    return m;
  }


  const CSS = `
  .rvs { --ph: 128px; position: absolute; inset: 0 var(--sr, 0px) 0 var(--sl, 0px); z-index: 2; box-sizing: border-box; overflow: hidden; display: grid;
    grid-template-rows: auto minmax(0, 1fr); gap: 8px; padding: 10px 12px 12px;
    background: linear-gradient(100deg, var(--c0a) 0%, rgba(0,0,0,0) 44%), linear-gradient(-100deg, var(--c1a) 0%, rgba(0,0,0,0) 44%),
                radial-gradient(ellipse at 50% 55%, rgba(14,15,26,.9), rgba(4,5,9,.98) 78%);
    font-family: var(--display); color: var(--text); user-select: none; -webkit-user-select: none; }
  .rvs::before { content: ''; position: absolute; left: 50%; top: -10%; bottom: -10%; width: 2px; z-index: 0; pointer-events: none;
    background: linear-gradient(180deg, rgba(217,179,108,0), rgba(246,223,166,.55) 45%, rgba(217,179,108,0)); transform: rotate(12deg); }
  body:has(#mocap-credit) .rvs { padding-bottom: 20px; } /* (the motion capture licence line stays readable under the cards) */
  .rvs-top { position: relative; z-index: 3; justify-self: center; max-width: 100%; display: flex; gap: 8px; align-items: center; min-width: 0;
    font: 600 12px/1.3 var(--display); letter-spacing: .14em; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
  .rvs-top > * { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .rvs-top b { flex: none; font: 700 15px/1 var(--jp); color: var(--gold); letter-spacing: 0; }
  .rvs-top .rk { flex: none; color: var(--gold-hi, var(--gold)); }
  .rvs-top .demo { flex: none; padding: 2px 6px; border: 1px dashed rgba(255,180,120,.7); color: #ffc79a; letter-spacing: .08em; text-transform: none; font-weight: 500; }
  .rvs-row { position: relative; z-index: 1; min-height: 0; display: grid; justify-content: center; align-items: center;
    grid-template-columns: minmax(0, 440px) clamp(70px, 12vw, 170px) minmax(0, 440px); }
  .rvs-side { position: relative; min-width: 0; height: 100%; display: grid; align-items: center; }
  .rvs-side .cst { width: 100%; height: min(100%, 620px); }
  .rvs-side .cst > canvas, .rvs-side .cst > .cst-pt { height: calc(100% - var(--ph)); }
  .rvs-side.gh .cst { outline: 2px dashed rgba(190,175,240,.7); outline-offset: -7px; }
  .rvs-side.gh .cst > canvas { filter: saturate(.55) brightness(.92) drop-shadow(0 0 10px rgba(150,120,255,.55)); }
  .rvs-crest { position: absolute; top: 12px; left: 13px; z-index: 3; line-height: 0; }
  .rvs-side.r .rvs-crest { left: auto; right: 13px; }
  .rvs-prev { position: absolute; top: 12px; right: 13px; z-index: 3; display: grid; grid-template-columns: auto minmax(0, auto); align-items: center; gap: 2px 6px;
    max-width: 52%; box-sizing: border-box; padding: 4px 8px 4px 5px; border: 1px solid var(--pc, rgba(255,255,255,.22)); border-radius: 3px;
    background: linear-gradient(180deg, rgba(10,11,20,.86), rgba(6,7,12,.92)); box-shadow: inset 0 0 0 1px rgba(0,0,0,.5); }
  .rvs-side.r .rvs-prev { right: auto; left: 13px; }
  .rvs-prev svg { grid-row: span 2; }
  .rvs-prev small { font: 500 9.5px/1.15 var(--display); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rvs-prev span { font: 600 12px/1.15 var(--display); letter-spacing: .05em; color: var(--pc, var(--text)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rvs-prev.empty { grid-template-columns: minmax(0, auto); border-style: dashed; background: rgba(6,7,12,.6); padding: 4px 8px; }
  .rvs-prev.empty span { color: var(--muted); font-weight: 500; }
  .rvs-plate { position: absolute; left: 0; right: 0; bottom: 0; height: var(--ph); z-index: 2; box-sizing: border-box; padding: 8px 22px 9px;
    display: flex; flex-direction: column; justify-content: flex-end; gap: 3px; min-width: 0;
    background: linear-gradient(180deg, rgba(6,7,12,0), rgba(6,7,12,.8) 18%, rgba(6,7,12,.95)); }
  .rvs-plate::before { content: ''; position: absolute; left: 14px; right: 14px; top: 0; height: 1px; background: linear-gradient(90deg, var(--fr1, rgba(255,255,255,.2)), rgba(255,255,255,0) 70%); opacity: .55; }
  .rvs-side.r .rvs-plate::before { background: linear-gradient(-90deg, var(--fr1, rgba(255,255,255,.2)), rgba(255,255,255,0) 70%); }
  .rvs-side.r .rvs-plate { align-items: flex-end; text-align: right; }
  .rvs-side.l .rvs-ti { text-align: left; } .rvs-side.r .rvs-ti { text-align: right; }
  .rvs-plate > * { max-width: 100%; min-width: 0; }
  .rvs-nmr { display: flex; align-items: center; gap: 7px; }
  .rvs-side.r .rvs-nmr { flex-direction: row-reverse; }
  .rvs-lv { flex: none; padding: 1px 5px; border: 1px solid var(--pf, var(--gold)); color: var(--gold-hi, var(--gold)); font: 700 11px/1.35 var(--display); letter-spacing: .08em; white-space: nowrap; }
  .rvs-nm { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 600 clamp(17px, 2.4vw, 26px)/1.15 var(--display); letter-spacing: .04em; }
  .rvs-you { flex: none; padding: 3px 5px 2px; background: var(--gold); color: #0c0d15; font: 700 10px/1 var(--display); letter-spacing: .14em; text-transform: uppercase; white-space: nowrap; }
  .rvs-ai { flex: none; padding: 2px 5px; border: 1px solid rgba(190,175,240,.8); color: #d8cdfa; font: 700 10px/1.1 var(--display); letter-spacing: .1em; white-space: nowrap; }
  .rvs-ti { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 600 13px/1.3 var(--body); color: var(--tic, var(--muted)); }
  .rvs-tr { display: flex; align-items: center; gap: 7px; white-space: nowrap; font: 600 14px/1.15 var(--display); letter-spacing: .06em; }
  .rvs-side.r .rvs-tr { flex-direction: row-reverse; }
  .rvs-tr .n { color: var(--tc, var(--text)); overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .rvs-tr .p { color: var(--muted); font-weight: 500; font-variant-numeric: tabular-nums; flex: none; }
  .rvs-tr .d { flex: none; display: inline-flex; gap: 2px; }
  .rvs-tr .d i { width: 7px; height: 7px; transform: rotate(45deg); border: 1px solid var(--tc, var(--gold)); box-sizing: border-box; }
  .rvs-tr .d i.on { background: var(--tc, var(--gold)); }
  .rvs-bd { display: flex; align-items: center; gap: 5px; height: 24px; overflow: hidden; }
  .rvs-side.r .rvs-bd { flex-direction: row-reverse; }
  .rvs-bd > * { flex: none; }
  .rvs-side.l .rvs-bd { padding-left: 10px; } .rvs-side.r .rvs-bd { padding-right: 10px; }
  .rvs-bd .cr { display: inline-flex; align-items: center; gap: 2px; height: 22px; padding: 0 5px 0 1px; border: 1px solid rgba(255,255,255,.16); border-radius: 11px; background: rgba(0,0,0,.35); }
  .rvs-bd .cr.ch { border-color: #ffd35a; box-shadow: 0 0 8px rgba(255,211,90,.45); }
  .rvs-bd .cr em { font: 600 11px/1 var(--display); font-style: normal; letter-spacing: .02em; color: var(--muted); white-space: nowrap; }
  .rvs-bd .cr.ch em { color: #ffd35a; }
  .rvs-bd .sl { display: grid; place-items: center; width: 20px; height: 20px; border: 1.5px solid; font: 700 12px/1 var(--jp); font-style: normal; }
  .rvs-bd .sl.s1 { color: #e8c46d; border-color: #e8c46d; } .rvs-bd .sl.s2 { color: #d9dde8; border-color: #d9dde8; } .rvs-bd .sl.s3 { color: #ff6b5e; border-color: #ff6b5e; background: rgba(255,80,60,.12); }
  .rvs-bd .ic { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; border: 1px solid currentColor; font: 700 12px/1 var(--jp); font-style: normal; background: rgba(0,0,0,.35); }
  .rvs-bd .tx { padding: 1px 5px; border: 1px solid var(--line); color: var(--muted); font: 700 12px/1.35 var(--jp); }
  .rvs-bd .mr { color: var(--muted); font: 600 11px/1 var(--display); }
  .rvs-mid { position: relative; z-index: 3; display: grid; justify-items: center; align-content: center; gap: 8px; min-width: 0; height: 100%; }
  .rvs-k { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -62%); font: 700 clamp(70px, 22vh, 190px)/1 var(--jp); color: rgba(217,179,108,.07); pointer-events: none; }
  .rvs-v { position: relative; font: 700 italic clamp(46px, 13vh, 112px)/.9 var(--display); letter-spacing: -.02em; color: var(--gold-hi, #f6dfa6);
    text-shadow: 0 0 22px rgba(217,179,108,.55), 0 3px 0 #6b4c1c, 0 6px 18px rgba(0,0,0,.8); }
  .rvs-st { max-width: 100%; text-align: center; font: 600 11px/1.25 var(--display); letter-spacing: .12em; text-transform: uppercase; color: var(--muted); overflow-wrap: anywhere; }
  .rvs-st.ok { color: #a5e6a0; }
  .rvs-st .dots { display: block; height: 7px; margin-top: 3px; white-space: nowrap; line-height: 0; }
  .rvs-st i { display: inline-block; width: 5px; height: 5px; margin: 0 1px; border-radius: 50%; background: currentColor; animation: rvsDot 1s infinite; }
  .rvs-st i:nth-child(2) { animation-delay: .15s; } .rvs-st i:nth-child(3) { animation-delay: .3s; }
  @keyframes rvsDot { 50% { opacity: .25; } }
  .rvs-flash { position: absolute; inset: 0; z-index: 5; pointer-events: none; opacity: 0; background: radial-gradient(circle at 50% 52%, rgba(255,244,210,.75), rgba(255,244,210,0) 55%); }
  /* the entrance */
  .rvs.in .rvs-side.l { animation: rvsInL .46s cubic-bezier(.2,.9,.25,1.08) backwards; }
  .rvs.in .rvs-side.r { animation: rvsInR .46s cubic-bezier(.2,.9,.25,1.08) .06s backwards; }
  @keyframes rvsInL { from { opacity: 0; transform: translateX(-75%) skewX(-8deg); } 60% { opacity: 1; } }
  @keyframes rvsInR { from { opacity: 0; transform: translateX(75%) skewX(8deg); } 60% { opacity: 1; } }
  .rvs.in .rvs-v { animation: rvsSlam .34s cubic-bezier(.3,1.5,.5,1) .4s backwards; }
  @keyframes rvsSlam { from { opacity: 0; transform: scale(2.8) rotate(-14deg); } 50% { opacity: 1; } }
  .rvs.in .rvs-k { animation: rvsFade .5s ease-out .5s backwards; }
  .rvs.in .rvs-flash { animation: rvsFlash .45s ease-out .44s; }
  @keyframes rvsFlash { 0% { opacity: .9; } 100% { opacity: 0; } }
  .rvs.in .rvs-row { animation: rvsShake .26s linear .44s; }
  @keyframes rvsShake { 20% { transform: translate(-5px, 2px); } 40% { transform: translate(4px, -3px); } 60% { transform: translate(-3px, 1px); } 80% { transform: translate(2px, 0); } }
  .rvs.in .rvs-crest { animation: rvsPop .36s cubic-bezier(.3,1.6,.5,1) .66s backwards; }
  .rvs.in .rvs-prev { animation: rvsPop .32s cubic-bezier(.3,1.4,.5,1) .82s backwards; }
  @keyframes rvsPop { from { opacity: 0; transform: scale(.4); } }
  .rvs.in .rvs-plate > * { animation: rvsUp .3s cubic-bezier(.2,.8,.3,1) backwards; animation-delay: calc(.62s + var(--i, 0) * 70ms); }
  .rvs.in .rvs-top, .rvs.in .rvs-st { animation: rvsFade .4s ease-out .8s backwards; }
  @keyframes rvsUp { from { opacity: 0; transform: translateY(8px); } }
  @keyframes rvsFade { from { opacity: 0; } }
  .rvs.calm.in * { animation-name: rvsFade !important; animation-duration: .3s !important; animation-delay: 0s !important; }
  .rvs.calm.in .rvs-flash { animation: none !important; }
  .rvs.calm .rvs-st i { animation: none; }
  /* short phones on their side (844×390, 740×360): a smaller plate, crest and VS */
  @media (max-height: 460px) {
    .rvs { --ph: 104px; gap: 5px; padding-top: 6px; padding-bottom: 8px; }
    .rvs-top { font-size: 11px; } .rvs-top b { font-size: 13px; }
    .rvs-plate { padding: 6px 20px 7px; gap: 2px; }
    .rvs-nm { font-size: 18px; }
    .rvs-ti { font-size: 12px; }
    .rvs-tr { font-size: 13px; }
    .rvs-bd { height: 22px; }
    .rvs-crest { top: 6px; left: 7px; } .rvs-side.r .rvs-crest { right: 7px; }
    .rvs-prev { top: 7px; right: 7px; padding: 3px 6px 3px 4px; } .rvs-side.r .rvs-prev { left: 7px; }
  }
  @media (min-height: 700px) { .rvs { --ph: 150px; } .rvs-ti { font-size: 15px; } .rvs-tr { font-size: 16px; } .rvs-bd { height: 28px; } }
  /* upright: the two cards one above the other (each one as on a wide screen: the ninja over its plate), VS between */
  @media (orientation: portrait) {
    .rvs-top { flex-wrap: wrap; justify-content: center; row-gap: 4px; }
    .rvs-row { grid-template-columns: minmax(0, 520px); grid-template-rows: minmax(0, 1fr) auto minmax(0, 1fr); gap: 6px; }
    .rvs-mid { height: auto; grid-auto-flow: column; align-items: center; gap: 14px; padding: 2px 0; }
    .rvs-v { font-size: 50px; } .rvs-k { font-size: 84px; }
    .rvs-st { text-align: left; }
    .rvs-side .cst { height: min(100%, 420px); }
  }
  `;
  function css() {
    if (ND.charStage && ND.charStage.frameCss) ND.charStage.frameCss();
    if (doc.getElementById('rvsCss')) return;
    const s = doc.createElement('style'); s.id = 'rvsCss'; s.textContent = CSS; doc.head.appendChild(s);
  }


  function plateRows(box, m, idx) {
    const L = m.L || RL();
    box.textContent = '';
    box.style.setProperty('--pf', m.pf || '');
    if (!m.pf) box.style.removeProperty('--pf');
    let i = 0;
    const add = (e) => { e.style.setProperty('--i', String(i++)); box.append(e); return e; };

    const nr = el('div', 'rvs-nmr');
    if (m.lv) nr.append(latin(el('b', 'rvs-lv', tx(5) + ' ' + m.lv)));
    const nm = el('span', 'rvs-nm', m.name); nm.dir = 'auto'; nm.setAttribute('translate', 'no'); nm.title = m.name;
    if (!(m.you && m.name === '—')) nr.append(nm);
    if (m.you) nr.append(el('span', 'rvs-you', L.you || 'You'));
    if (m.ghost) { const a = el('span', 'rvs-ai', '影 ' + (L.aiTag || 'AI')); nr.append(a); }
    add(nr);
    if (m.card && ND.flair && ND.flair.card) safe(() => ND.flair.card(nm, idx));

    if (m.title && m.title.name) {
      const t = add(el('div', 'rvs-ti', (m.title.icon ? m.title.icon + ' ' : '') + m.title.name)); t.dir = 'auto';
      if (m.title.color) t.style.setProperty('--tic', m.title.color);
    } else if (m.guest) add(el('div', 'rvs-ti', L.guestTag || 'Guest'));
    else if (m.ghost) add(el('div', 'rvs-ti', L.ghostTag || 'Shadow'));

    if (m.tier != null || m.placement > 0) {
      const tr = el('div', 'rvs-tr');
      if (m.placement > 0) {
        tr.style.setProperty('--tc', '#e8e2d2');
        tr.append(el('span', 'n', (L.placementTag || 'Placement') + (m.of ? ` ${Math.max(0, m.of - m.placement)}/${m.of}` : '')));
      } else {
        const T = tierInfo(m.tier);
        tr.style.setProperty('--tc', T.col);
        tr.append(latin(el('span', 'n', T.n)));
        if (T.d) { const d = el('span', 'd'); for (let k = 0; k < 3; k++) d.append(el('i', k < 4 - T.d ? 'on' : '')); d.setAttribute('aria-hidden', 'true'); tr.append(d); }
        if (m.rating != null) tr.append(el('span', 'p', tx(3, m.rating)));
      }
      add(tr);
    }

    if (m.badges.length) {
      const bd = el('div', 'rvs-bd');
      for (const b of m.badges) {
        if (b.k === 'crest') {
          const c = el('span', 'cr' + (b.champ ? ' ch' : '')), e = emblem(b.tier, { size: 20, glow: false, anim: false });
          if (e) c.append(e);
          c.append(latin(el('em', null, b.champ ? 'S' + b.season + ' #1' : 'S' + b.season)));
          c.title = 'S' + b.season + ' · ' + tierInfo(b.tier).n + (b.champ ? ' · #1' : b.top ? ' · #' + b.top : '');
          bd.append(c);
        } else if (b.k === 'seal') { const s = el('i', 'sl s' + b.n, ['', '一', '二', '三'][b.n]); s.setAttribute('aria-hidden', 'true'); bd.append(s); }
        else if (b.k === 'icon') { const s = el('i', 'ic', b.icon); s.style.color = b.color || ''; s.title = b.name || ''; bd.append(s); }
        else if (b.k === 'txt') bd.append(el('span', 'tx', b.text));
      }
      if (m.more) bd.append(el('span', 'mr', '+' + m.more));
      add(bd);
    }
  }
  function prevChip(m) {
    if (!m.prev) return null;
    const p = m.prev, c = el('div', 'rvs-prev');
    if (p.first || p.none) {
      c.classList.add('empty');
      if (p.none) c.append(el('small', null, tx(0, p.season)));
      c.append(el('span', null, p.first ? tx(1) : tx(2)));
      return c;
    }
    const T = tierInfo(p.tier), e = emblem(p.tier, { size: 26, glow: false, anim: false });
    c.style.setProperty('--pc', T.col);
    if (e) c.append(e);
    c.append(el('small', null, tx(0, p.season)), latin(el('span', null, T.n + (p.place && p.place <= 100 ? ' · #' + p.place : ''))));
    if (ND.charStage) c.dataset.fam = String(ND.charStage.fam(p.tier));
    return c;
  }
  function sideEl(m, idx, right) {
    const box = el('div', 'rvs-side ' + (right ? 'r' : 'l') + (m.ghost ? ' gh' : ''));

    const frameTier = m.guest || (m.tier == null && !m.placement) ? null : m.placement > 0 ? (m.prev && m.prev.tier != null ? m.prev.tier : 'placement') : m.tier;

    const st = ND.charStage ? ND.charStage.create({ ninja: m.ninja, look: m.look, dir: right ? -1 : 1, tier: frameTier, id: idx, portrait: m.look === false || m.look == null ? '' : null }) : null;
    const frame = st ? st.el : el('div', 'cst');
    box.append(frame);
    if (m.tier != null || m.placement > 0) {
      const cr = el('div', 'rvs-crest'), e = emblem(m.placement > 0 ? 'placement' : m.tier, { size: innerHeight < 460 ? 42 : 56, glow: true, anim: true, placed: m.of ? m.of - m.placement : undefined, of: m.of || undefined });
      if (e) { cr.append(e); frame.append(cr); }
    }
    const pc = prevChip(m); if (pc) frame.append(pc);
    const plate = el('div', 'rvs-plate');
    plateRows(plate, m, idx);
    frame.append(plate);
    box.setAttribute('aria-label', m.name + (m.tier != null ? ' · ' + tierInfo(m.tier).n : ''));
    return { box, st, plate };
  }


  let cur = null;
  function sound(t) {
    const A = ND.audio;
    if (!A) return;
    const run = (f) => safe(() => (A.menu ? A.menu(f) : f.call(A)));
    if (t === 0) run(() => { A.init && A.init(); A.swoosh && A.swoosh(1.4, -0.4); A.swoosh && A.swoosh(1.2, 0.4); });
    else if (t === 1) run(() => { A.taiko && A.taiko(1.3); A.clang && A.clang(0.45, 0, 0.78); });
    else if (t === 2) run(() => { const S = A.sfx; if (S && S.bell) { S.bell(1568, 0.03, 0, 1.1, -0.3); S.bell(2349, 0.022, 0.09, 1.0, 0.3); } });
  }
  function open(host, o) {
    close();
    css();
    o = o || {};
    const sides = (o.sides || []).slice(0, 2);
    if (sides.length < 2) return null;
    const root = el('div', 'rvs' + (still() ? ' calm' : ''));
    root.setAttribute('role', 'status');
    const col = (m) => safe(() => { const ch = ND.CHARS.find((c) => c.id === m.ninja); return ch && ch.col.ui; }) || '#d9b36c';
    root.style.setProperty('--c0a', rgba(col(sides[0]), 0.22)); root.style.setProperty('--c1a', rgba(col(sides[1]), 0.22));

    const top = el('div', 'rvs-top');
    if (o.demo) top.append(el('span', 'demo', tx(6)));
    if (o.arenaKanji) { const k = el('b', null, o.arenaKanji); k.setAttribute('aria-hidden', 'true'); top.append(k); }
    if (o.top) top.append(el('span', null, o.top));
    if (o.tag) top.append(el('span', 'rk', o.tag));
    const row = el('div', 'rvs-row');
    const a = sideEl(sides[0], 0, false), b = sideEl(sides[1], 1, true);
    const mid = el('div', 'rvs-mid'), k = el('span', 'rvs-k', '対'), v = latin(el('b', 'rvs-v', 'VS')), stx = el('p', 'rvs-st');
    k.setAttribute('aria-hidden', 'true');
    mid.append(k, v, stx);
    row.append(a.box, mid, b.box);
    root.append(top, row, el('div', 'rvs-flash'));
    host.append(root);
    const ui = cur = { el: root, sides, stages: [a.st, b.st], plates: [a.plate, b.plate], timers: [], t0: performance.now(), closed: false,
      close: () => { if (cur === ui) close(); else kill(ui); }, side: (i) => sides[i], refresh: (i, m) => { sides[i] = m; plateRows(ui.plates[i], m, i); } };

    let lastSt = '';
    const status = () => {
      if (ui.closed || !root.isConnected) { kill(ui); return; }
      const s = typeof o.status === 'function' ? safe(o.status) : o.status;
      const txt = s && typeof s === 'object' ? s.text : s, ok = !!(s && typeof s === 'object' && s.ok);
      const key = (txt || '') + ok;
      if (key === lastSt) return;
      lastSt = key;
      stx.textContent = txt || ''; stx.classList.toggle('ok', ok);
      if (txt && !ok && /…$/.test(txt)) { stx.textContent = txt.replace(/…$/, ''); const d = el('span', 'dots'); d.append(el('i'), el('i'), el('i')); d.setAttribute('aria-hidden', 'true'); stx.append(d); }
    };
    status();
    ui.timers.push(setInterval(status, 250));

    void root.offsetWidth; root.classList.add('in');
    const at = (ms, f) => ui.timers.push(setTimeout(() => { if (!ui.closed) safe(f); }, ms));
    if (o.sound !== false) sound(0);
    at(420, () => { if (o.sound !== false) sound(1); ui.stages.forEach((s) => s && s.play('ready', { hold: true })); });
    at(640, () => { a.st && a.st.glint(); if (o.sound !== false) sound(2); });
    at(760, () => { b.st && b.st.glint(); });

    sides.forEach((m, i) => {
      if (!o.plates || !o.plates[i] || m.lv != null) return;
      Promise.resolve(o.plates[i]).then((p) => { if (p && !ui.closed && cur === ui) ui.refresh(i, plateInto(m, p)); }, () => {});
    });
    return ui;
  }
  function kill(ui) {
    if (!ui || ui.closed) return;
    ui.closed = true;
    ui.timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    ui.stages.forEach((s) => s && s.destroy());
    ui.el.remove();
  }
  function close() { const u = cur; cur = null; kill(u); }



  function demoPairs() {
    const me = (ninja, extra) => Object.assign({ name: 'Aenes', tier: 7, placement: 0, rating: 1604, title_id: null, dan: 13,
      finals: [{ season: 1, tier: 4, peak: 5, place: 212 }], plate: { lv: 23, eq: { title: 'title_nightblade', badge: 'badge_moon', frame: 'frame_jade' }, jc: { akane: 2, aoi: 1 } } }, extra || {});
    return [

      { season: 2, me: me('akane'), my: 'akane', opp: { name: 'ninjaboy2014', tier: 7, placement: 5, games: 0, plate: { lv: 2, eq: {}, jc: {} }, finals: [] }, op: 'yuki', ol: false },

      { season: 2, me: me('aoi'), my: 'aoi', opp: { name: 'Kenji', tier: 15, placement: 0, rating: 2141, title_id: 'title_season_champion', dan: 19,
        finals: [{ season: 1, tier: 15, peak: 15, place: 1 }], plate: { lv: 87, eq: { badge: 'badge_dragon', frame: 'frame_gold', card: 'card_ryu' }, jc: { kuro: 3, akane: 2 } } }, op: 'kuro', ol: 'cos:champion' },

      { season: 2, me: me('kuro', { tier: 8, rating: 1671, plate: { lv: 31, eq: { title: 'title_duelist', badge: 'badge_fire', frame: 'frame_crimson' }, jc: { kuro: 1 } } }), my: 'kuro', ml: 'ps:cos_ash_kuro',
        opp: { name: 'Mira', tier: 9, placement: 0, rating: 1702, finals: [{ season: 1, tier: 6, peak: 7, place: 48 }], dan: 15,
          plate: { lv: 44, eq: { title: 'title_s1', badge: 'badge_sakura', frame: 'frame_silver' }, jc: { hana: 1 } } }, op: 'hana', ol: 'ps:cos_lotus_hana' },

      { season: 2, me: me('tetsu'), my: 'tetsu', opp: { name: 'Kenji', ghost: true, tier: 10, placement: 0 }, op: 'ren', ol: false, ghost: true },

      { season: 1, me: me('tsubame', { name: 'StolenBurntToast_99', tier: 13, rating: 1934, finals: [], plate: { lv: 64, eq: { title: 'jt3_kage', badge: 'badge_kage', frame: 'frame_gold' }, jc: { kage: 3 } } }), my: 'tsubame',
        opp: { name: 'Александра_Великая', tier: 12, placement: 0, rating: 1861, finals: [], dan: 18, plate: { lv: 58, eq: { title: 'jt2_jin', badge: 'badge_snow' }, jc: { jin: 2 } } }, op: 'jin', ol: 'ps:jc3_jin' },

      { season: 2, me: me('mai', { tier: 7, placement: 2, games: 3, rating: 1540, finals: [] }), my: 'mai', opp: { name: 'Guest-4821', guest: true }, op: 'tora', ol: false, unranked: true },
    ];
  }

  const CHAMP = { en: 'Season Champion', tr: 'Sezon Şampiyonu', es: 'Campeón de temporada', pt: 'Campeão da temporada', ru: 'Чемпион сезона', de: 'Saisonchampion', fr: 'Champion de saison' };
  function demo() {
    const app = doc.getElementById('app');
    if (!app || !ND.game || !ND.game.drawPv) return;
    let n = Math.max(0, (parseInt(QS.get('vs') || '1', 10) || 1) - 1);
    const host = el('div'); host.id = 'rvsDemo';
    host.style.cssText = 'position:absolute;inset:0;z-index:95;background:#05060c;';
    app.append(host);
    const pairs = demoPairs();
    const show = () => {
      const p = pairs[n % pairs.length], L = RL();
      const mine = sideOf(p.me, { you: true, ninja: p.my, look: p.ml || false, season: p.season });
      const champ = p.opp.title_id === 'title_season_champion' ? { name: CHAMP[lang()] || CHAMP.en, color: '#ffd35a', icon: '将' } : null;
      const theirs = sideOf(p.opp, { ninja: p.op, look: p.ol, season: p.season, ghost: p.ghost, title: champ,
        name: p.ghost ? safe(() => (L.ghostName ? L.ghostName(p.opp.name) : p.opp.name)) : null });
      const ar = ['temple', 'snow', 'castle', 'rain', 'waterfall', 'market'][n % 6], A = (ND.ARENAS || []).find((x) => x.id === ar);
      const t0 = performance.now();
      open(host, { sides: [mine, theirs], demo: true, top: A ? A.name : '', arenaKanji: A ? A.kanji : '', tag: p.unranked ? (L.unranked || 'Unranked') : (L.ranked || 'Ranked'),
        status: () => (performance.now() - t0 < 1900 ? (L.connecting || 'Connecting…') : { text: tx(4), ok: true }) });
      host.dataset.pair = String(n % pairs.length + 1);
    };
    host.addEventListener('click', () => { n++; show(); });
    doc.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { n++; show(); } });
    show();
  }
  if (QS.get('vsdemo') === '1') {
    const go = () => setTimeout(() => safe(demo), 120);
    const ready = () => (doc.fonts && doc.fonts.ready ? doc.fonts.ready.then(go, go) : go());
    if (doc.readyState === 'complete') ready(); else window.addEventListener('load', ready, { once: true });
  }

  ND.rankVs = { open, close, sideOf, plateInto, get current() { return cur; }, demoPairs, texts: TX, t: tx };
})(window.ND);
