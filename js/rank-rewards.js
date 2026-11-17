






















(function (ND) {
  'use strict';
  if (!ND || typeof document === 'undefined') return;
  const doc = document;
  const safe = (f) => { try { return f(); } catch (e) { return undefined; } };
  const QS = new URLSearchParams(location.search);


  const FAMS = [['足軽', 'Ashigaru'], ['浪人', 'Rōnin'], ['侍', 'Samurai'], ['旗本', 'Hatamoto'], ['大名', 'Daimyō'], ['将軍', 'Shōgun']];
  const TCOL = ['#9aa3ad', '#8fb3c9', '#d9b36c', '#e38b5c', '#c65bd0', '#ffd35a'];
  const TOP = [2, 5, 8, 11, 14, 15];
  const SLUG = ['ashigaru', 'ronin', 'samurai', 'hatamoto', 'daimyo', 'shogun'];

  const PALS = {
    daimyo: { cloth: '#3a1846', clothHi: '#5a2a6c', clothDark: '#220d2a', wrap: '#d9b36c', wrapDark: '#8a6a2c', accent: '#f0d58a', accentDark: '#8d6417', ui: '#c65bd0', hakama: '#24102c', hakamaDark: '#150819', rim: 'rgba(214,150,235,.6)', rimDim: 'rgba(150,90,180,.32)' },
    shogun: { cloth: '#15120f', clothHi: '#2c2620', clothDark: '#0a0807', wrap: '#ffd35a', wrapDark: '#a07818', accent: '#ffe08a', accentDark: '#9a7420', ui: '#ffd35a', hakama: '#0f0c0a', hakamaDark: '#070605', rim: 'rgba(255,220,120,.7)', rimDim: 'rgba(200,160,60,.36)' },
  };
  const COSTUME_ID = { daimyo: 'costume_rank_daimyo', shogun: 'costume_rank_shogun' };

  const plan = (f) => ({ title: true, crest: f >= 2, colors: f === 5 ? ['shogun'] : f === 4 ? ['daimyo'] : [] });





  const TX = {
    en: ['Season rewards', 'Given when the season ends, for the highest tier you reached after placement. Your card also wears that tier\'s frame in next season\'s placement.', '#1 of the season', '{t} crest', '{t} colours', 'Season Champion costume', 'Season Champion title', 'You', '{n} points to {t}', 'Top tier: hold on to the end', 'Placement: {n} matches left', 'Your reward so far: {t}', 'Finish placement to earn a reward', 'Preview', 'Yours', 'Tap a tier to see its reward', 'Sign in to earn ranked rewards', 'with enough players on the board'],
    tr: ['Sezon ödülleri', 'Sezon bitince verilir: yerleştirmeden sonra ulaştığın en yüksek kademeye göre. Kartın sonraki sezonun yerleştirmesinde o kademenin çerçevesini de giyer.', 'Sezonun 1.\'si', '{t} arması', '{t} renkleri', 'Sezon Şampiyonu kostümü', 'Sezon Şampiyonu unvanı', 'Sen', '{t} için {n} puan', 'En üst kademe: sona kadar koru', 'Yerleştirme: {n} maç kaldı', 'Şimdiye kadarki ödülün: {t}', 'Ödül için yerleştirmeyi bitir', 'Ön izleme', 'Senin', 'Ödülünü görmek için bir kademeye dokun', 'Dereceli ödülleri için giriş yap', 'tabloda yeterli oyuncu varsa'],
    es: ['Recompensas de temporada', 'Se entregan al acabar la temporada, según el rango más alto alcanzado tras la clasificación. Tu tarjeta también lleva el marco de ese rango en la clasificación de la próxima temporada.', 'N.º 1 de la temporada', 'Emblema {t}', 'Colores {t}', 'Traje de campeón de temporada', 'Título de campeón de temporada', 'Tú', '{n} puntos para {t}', 'Rango máximo: mantenlo hasta el final', 'Clasificación: quedan {n} partidas', 'Tu recompensa por ahora: {t}', 'Termina la clasificación para ganar una recompensa', 'Vista previa', 'Tuyo', 'Toca un rango para ver su recompensa', 'Inicia sesión para ganar recompensas', 'con suficientes jugadores en la tabla'],
    pt: ['Recompensas da temporada', 'Entregues no fim da temporada, pela patente mais alta alcançada após a classificação. Seu cartão também usa a moldura dessa patente na classificação da próxima temporada.', '1º da temporada', 'Brasão {t}', 'Cores {t}', 'Traje de campeão da temporada', 'Título de campeão da temporada', 'Você', '{n} pontos para {t}', 'Patente máxima: segure até o fim', 'Classificação: faltam {n} partidas', 'Sua recompensa até agora: {t}', 'Termine a classificação para ganhar uma recompensa', 'Prévia', 'Seu', 'Toque numa patente para ver a recompensa', 'Entre para ganhar recompensas ranqueadas', 'com jogadores suficientes no placar'],
    ru: ['Награды сезона', 'Выдаются в конце сезона за высший ранг после калибровки. В калибровке следующего сезона ваша карточка носит рамку этого ранга.', '1-е место сезона', 'Герб: {t}', 'Цвета: {t}', 'Костюм чемпиона сезона', 'Титул чемпиона сезона', 'Вы', '{n} очк. до {t}', 'Высший ранг: удержите до конца', 'Калибровка: осталось {n}', 'Ваша награда пока: {t}', 'Пройдите калибровку, чтобы получить награду', 'Примерка', 'Ваше', 'Нажмите на ранг, чтобы увидеть награду', 'Войдите, чтобы получать награды', 'если в таблице достаточно игроков'],
    de: ['Saisonbelohnungen', 'Gibt es am Saisonende für den höchsten Rang nach der Platzierung. Deine Karte trägt dessen Rahmen auch in der Platzierung der nächsten Saison.', 'Platz 1 der Saison', '{t}-Wappen', '{t}-Farben', 'Saisonchampion-Kostüm', 'Titel Saisonchampion', 'Du', 'Noch {n} Punkte bis {t}', 'Höchster Rang: halte ihn bis zum Ende', 'Platzierung: noch {n} Spiele', 'Deine Belohnung bisher: {t}', 'Beende die Platzierung für eine Belohnung', 'Vorschau', 'Deins', 'Tippe auf einen Rang für seine Belohnung', 'Melde dich an für Ranglisten-Belohnungen', 'mit genug Spielern in der Tabelle'],
    fr: ['Récompenses de saison', 'Remises en fin de saison, selon le rang le plus haut atteint après le placement. Votre carte porte aussi le cadre de ce rang pendant le placement de la saison suivante.', 'N° 1 de la saison', 'Blason {t}', 'Couleurs {t}', 'Costume de champion de saison', 'Titre de champion de saison', 'Vous', '{n} points pour {t}', 'Rang maximal : tenez jusqu\'au bout', 'Placement : {n} matchs restants', 'Votre récompense actuelle : {t}', 'Terminez le placement pour gagner une récompense', 'Aperçu', 'À vous', 'Touchez un rang pour voir sa récompense', 'Connectez-vous pour gagner des récompenses', 'avec assez de joueurs au classement'],
    it: ['Premi di stagione', 'Assegnati a fine stagione per il grado più alto raggiunto dopo il piazzamento. La tua scheda indossa anche la cornice di quel grado nel piazzamento della stagione dopo.', '1º della stagione', 'Stemma {t}', 'Colori {t}', 'Costume del campione di stagione', 'Titolo di campione di stagione', 'Tu', '{n} punti per {t}', 'Grado massimo: tienilo fino alla fine', 'Piazzamento: {n} partite rimaste', 'Il tuo premio finora: {t}', 'Completa il piazzamento per un premio', 'Anteprima', 'Tuo', 'Tocca un grado per vedere il premio', 'Accedi per ottenere premi classificati', 'con abbastanza giocatori in classifica'],
    pl: ['Nagrody sezonu', 'Wręczane na koniec sezonu za najwyższą rangę po kwalifikacjach. Twoja karta nosi też ramkę tej rangi w kwalifikacjach następnego sezonu.', '1. miejsce sezonu', 'Herb: {t}', 'Barwy: {t}', 'Strój mistrza sezonu', 'Tytuł mistrza sezonu', 'Ty', '{n} pkt do {t}', 'Najwyższa ranga: utrzymaj do końca', 'Kwalifikacje: zostało {n}', 'Twoja nagroda na razie: {t}', 'Ukończ kwalifikacje, by zdobyć nagrodę', 'Podgląd', 'Twoje', 'Dotknij rangi, by zobaczyć nagrodę', 'Zaloguj się, by zdobywać nagrody', 'przy wystarczającej liczbie graczy w tabeli'],
    id: ['Hadiah musim', 'Diberikan saat musim berakhir, untuk peringkat tertinggi setelah penempatan. Kartumu juga memakai bingkai peringkat itu saat penempatan musim berikutnya.', 'Peringkat 1 musim', 'Lambang {t}', 'Warna {t}', 'Kostum juara musim', 'Gelar juara musim', 'Kamu', '{n} poin lagi ke {t}', 'Peringkat teratas: pertahankan sampai akhir', 'Penempatan: {n} laga lagi', 'Hadiahmu sejauh ini: {t}', 'Selesaikan penempatan untuk hadiah', 'Pratinjau', 'Milikmu', 'Ketuk peringkat untuk melihat hadiahnya', 'Masuk untuk mendapat hadiah peringkat', 'jika pemain di papan cukup'],
    vi: ['Phần thưởng mùa', 'Trao khi mùa kết thúc, theo bậc cao nhất đạt được sau phân hạng. Thẻ của bạn cũng mang khung bậc đó khi phân hạng mùa sau.', 'Hạng 1 của mùa', 'Huy hiệu {t}', 'Màu {t}', 'Trang phục vô địch mùa', 'Danh hiệu vô địch mùa', 'Bạn', 'Còn {n} điểm tới {t}', 'Bậc cao nhất: giữ đến cuối', 'Phân hạng: còn {n} trận', 'Phần thưởng hiện tại: {t}', 'Hoàn tất phân hạng để nhận thưởng', 'Xem thử', 'Của bạn', 'Chạm vào một bậc để xem thưởng', 'Đăng nhập để nhận thưởng xếp hạng', 'khi bảng có đủ người chơi'],
    th: ['รางวัลซีซัน', 'แจกเมื่อจบซีซัน ตามแรงก์สูงสุดหลังการจัดอันดับ การ์ดของคุณจะใช้กรอบของแรงก์นั้นตอนจัดอันดับซีซันถัดไปด้วย', 'อันดับ 1 ของซีซัน', 'ตรา {t}', 'สี {t}', 'ชุดแชมป์ซีซัน', 'ฉายาแชมป์ซีซัน', 'คุณ', 'อีก {n} แต้มถึง {t}', 'แรงก์สูงสุด: รักษาไว้จนจบ', 'จัดอันดับ: เหลือ {n} แมตช์', 'รางวัลของคุณตอนนี้: {t}', 'จัดอันดับให้จบเพื่อรับรางวัล', 'ลองดู', 'ของคุณ', 'แตะแรงก์เพื่อดูรางวัล', 'ลงชื่อเข้าใช้เพื่อรับรางวัลแรงก์', 'เมื่อมีผู้เล่นในตารางพอ'],
    hi: ['सीज़न इनाम', 'सीज़न खत्म होने पर मिलते हैं, प्लेसमेंट के बाद पहुंचे सबसे ऊंचे रैंक के हिसाब से। अगले सीज़न के प्लेसमेंट में आपका कार्ड उस रैंक का फ्रेम भी पहनता है।', 'सीज़न का नंबर 1', '{t} चिह्न', '{t} रंग', 'सीज़न चैंपियन पोशाक', 'सीज़न चैंपियन खिताब', 'आप', '{t} तक {n} अंक', 'सबसे ऊंचा रैंक: अंत तक बनाए रखें', 'प्लेसमेंट: {n} मैच बाकी', 'अब तक आपका इनाम: {t}', 'इनाम के लिए प्लेसमेंट पूरा करें', 'झलक', 'आपका', 'इनाम देखने के लिए रैंक पर टैप करें', 'रैंक्ड इनाम के लिए साइन इन करें', 'तालिका में पर्याप्त खिलाड़ी हों तो'],
    ar: ['جوائز الموسم', 'تُمنح عند نهاية الموسم حسب أعلى رتبة بلغتها بعد التصنيف. وتحمل بطاقتك إطار تلك الرتبة في تصنيف الموسم التالي.', 'الأول في الموسم', 'شعار {t}', 'ألوان {t}', 'زي بطل الموسم', 'لقب بطل الموسم', 'أنت', '{n} نقطة حتى {t}', 'أعلى رتبة: حافظ عليها حتى النهاية', 'التصنيف: بقيت {n} مباريات', 'جائزتك حتى الآن: {t}', 'أنهِ التصنيف لتربح جائزة', 'معاينة', 'لك', 'المس رتبة لترى جائزتها', 'سجّل الدخول لتربح جوائز التصنيف', 'إن كان في اللوحة لاعبون كفاية'],
    zh: ['赛季奖励', '赛季结束时按定级后达到的最高段位发放。下赛季定级期间，你的卡片也会使用该段位的边框。', '赛季第1名', '{t}纹章', '{t}配色', '赛季冠军服装', '赛季冠军称号', '你', '距{t}还差{n}分', '最高段位：坚持到最后', '定级：还剩{n}场', '目前的奖励：{t}', '完成定级即可获得奖励', '预览', '已拥有', '点击段位查看奖励', '登录以获得排位奖励', '榜上玩家足够时'],
    'zh-TW': ['賽季獎勵', '賽季結束時依定級後達到的最高段位發放。下賽季定級期間，你的卡片也會使用該段位的邊框。', '賽季第1名', '{t}紋章', '{t}配色', '賽季冠軍服裝', '賽季冠軍稱號', '你', '距{t}還差{n}分', '最高段位：堅持到最後', '定級：還剩{n}場', '目前的獎勵：{t}', '完成定級即可獲得獎勵', '預覽', '已擁有', '點擊段位查看獎勵', '登入以獲得排位獎勵', '榜上玩家足夠時'],
    ja: ['シーズン報酬', 'シーズン終了時、ランク決定後に到達した最高ランクに応じて贈られます。次シーズンのランク決定戦では、カードにそのランクの枠も付きます。', 'シーズン1位', '{t}の紋', '{t}カラー', 'シーズンチャンピオンの衣装', 'シーズンチャンピオンの称号', 'あなた', '{t}まであと{n}pt', '最高ランク：最後まで守ろう', 'ランク決定戦：残り{n}試合', '現在の報酬：{t}', 'ランク決定戦を終えると報酬', 'プレビュー', '獲得済み', 'ランクをタップして報酬を見る', 'サインインしてランク報酬を獲得', 'ランキングに十分な人数がいれば'],
    ko: ['시즌 보상', '시즌이 끝나면 배치 후 도달한 최고 티어에 따라 지급됩니다. 다음 시즌 배치 중에는 카드에 그 티어의 테두리도 붙습니다.', '시즌 1위', '{t} 문장', '{t} 색상', '시즌 챔피언 의상', '시즌 챔피언 칭호', '나', '{t}까지 {n}점', '최고 티어: 끝까지 지키세요', '배치: {n}경기 남음', '지금까지의 보상: {t}', '배치를 마치면 보상', '미리보기', '보유', '티어를 탭해 보상 보기', '로그인하고 랭크 보상 받기', '순위표에 인원이 충분하면'],
  };
  const lang = () => (ND.i18n && typeof ND.i18n.lang === 'string' ? ND.i18n.lang : 'tr');
  const tx = (i, n, t) => { const s = (TX[lang()] || TX.en)[i] || TX.en[i]; return s.replace('{n}', n == null ? '' : String(n)).replace('{t}', t == null ? '' : String(t)); };
  const el = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const latin = (e) => { e.lang = 'en'; e.setAttribute('translate', 'no'); return e; };
  const emblem = (t, size) => safe(() => { const e = ND.rankEmblem && ND.rankEmblem.el ? ND.rankEmblem.el(t, { size, glow: size >= 40, anim: size >= 40 }) : null; if (e) e.setAttribute('aria-hidden', 'true'); return e; }) || null;
  const famOf = (tier) => (tier >= 15 ? 5 : Math.max(0, Math.min(4, Math.floor((tier | 0) / 3))));
  const titleName = (season, f) => 'S' + season + ' ' + FAMS[f][1];

  const cat = (id) => safe(() => (ND.rewards && ND.rewards.get ? ND.rewards.get(id) : null)) || null;
  const owns = (id) => !!safe(() => ND.rewards && ND.rewards.owns && ND.rewards.owns(id));
  function champLook() {
    const R = ND.rewards, e = safe(() => R && R.catalog ? R.catalog().find((x) => x.kind === 'costume' && x.builtin === 'champion') : null);
    return e ? { look: 'rw:' + e.id, id: e.id, name: R.name(e) } : { look: 'cos:champion', id: null, name: tx(5) };
  }
  const colourLook = (k) => (cat(COSTUME_ID[k]) ? 'rw:' + COSTUME_ID[k] : { pal: PALS[k] });


  const CSS = `
  #rk .rk-card.rwd { width: min(1000px, 100%); }
  #mranked .rkc-head { display: flex; align-items: center; gap: 4px 10px; }
  #mranked .rkc-head > strong { flex: 1 1 auto; min-width: 0; }
  #mranked .rkc-rw { flex: none; display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border: 1px solid rgba(255,211,90,.55); border-radius: 3px;
    background: rgba(255,211,90,.08); color: #f1d69c; font: 600 12px/1.2 var(--display); letter-spacing: .06em; cursor: pointer; white-space: nowrap; }
  #mranked .rkc-rw b { font: 700 14px/1 var(--jp); color: #ffd35a; }
  #mranked .rkc-rw i { font-style: normal; color: var(--gold); }
  #mranked .rkc-rw:hover, #mranked .rkc-rw:focus-visible { background: rgba(255,211,90,.2); border-color: #ffd35a; }
  #app.touch #mranked .rkc-rw { min-height: 32px; }
  /* (short and narrow screens: the head row keeps its height; upright phones: the seal and the arrow only, the name read out) */
  @media (max-height: 430px) { #mranked .rkc-rw { padding: 1px 7px; font-size: 11px; } #app.touch #mranked .rkc-rw { min-height: 0; } }
  /* (upright phones: a small tab hanging on the card's top edge, outside the flow: the card keeps its height, so SINGLE
     MATCH and PLAY WITH A FRIEND stay on the first screen) */
  @media (max-width: 520px) { #mranked.rkc { position: relative; overflow: visible; } #mranked .rkc-rw { position: absolute; z-index: 2; top: -12px; right: 14px; height: 24px; padding: 0 9px; background: #2a1012; box-shadow: 0 2px 6px rgba(0,0,0,.5); } #mranked .rkc-rw span { display: none; } #app.touch #mranked .rkc-rw { min-height: 0; } }
  .btn.rwd-go { display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
  .btn.rwd-go svg { flex: none; }
  #rk .rk-card.rwd > .rk-head { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; }
  .btn.rwd-back { align-self: center; min-width: 96px; }
  .rwd-b { display: grid; grid-template-columns: minmax(200px, 36%) minmax(0, 1fr); gap: 12px 16px; align-items: stretch; min-height: 0; }
  .rwd-st { position: relative; min-height: 240px; }
  .rwd-st .cst { position: absolute; inset: 0; cursor: pointer; }
  .rwd-st .cst > canvas, .rwd-st .cst > .cst-pt { height: calc(100% - 38px); }
  .rwd-cap { position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; min-height: 38px; box-sizing: border-box; padding: 4px 10px; display: grid; align-content: center; justify-items: center; text-align: center;
    background: linear-gradient(180deg, rgba(6,7,12,.3), rgba(6,7,12,.94)); font: 600 13px/1.2 var(--display); letter-spacing: .05em; }
  .rwd-cap small { font: 500 11px/1.2 var(--body); letter-spacing: 0; color: var(--muted); }
  .rwd-tag { position: absolute; top: 10px; right: 10px; z-index: 4; padding: 3px 7px; border: 1px dashed #ffc79a; background: rgba(6,7,12,.75); color: #ffc79a; font: 700 10.5px/1.2 var(--display); letter-spacing: .12em; text-transform: uppercase; pointer-events: none; }
  .rwd-tag.own { border-style: solid; border-color: #7be08f; color: #7be08f; }
  .rwd-cr { position: absolute; top: 9px; left: 10px; z-index: 4; line-height: 0; pointer-events: none; }
  .rwd-l { display: grid; gap: 4px; align-content: start; min-width: 0; }
  .rwd-r { position: relative; display: grid; grid-template-columns: 30px minmax(74px, auto) minmax(0, 1fr); align-items: center; gap: 2px 10px; min-width: 0; padding: 4px 8px; box-sizing: border-box;
    border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.03); color: var(--text); text-align: left; cursor: pointer; font: inherit; }
  /* (a ladder row only chooses what the stage shows: full-width rows of ~30 px, below the touch screens' 44 px rule for buttons, so the ladder fits a phone held sideways) */
  #app.touch #rk button.rwd-r { min-height: 0; }
  .rwd-r[aria-pressed="true"] { border-color: var(--tc, var(--gold)); background: rgba(217,179,108,.12); }
  .rwd-r.me { box-shadow: inset 3px 0 0 var(--tc, var(--gold)); }
  .rwd-r .k { display: grid; place-items: center; width: 30px; height: 30px; }
  .rwd-r .n { font: 600 14px/1.15 var(--display); letter-spacing: .05em; color: var(--tc, var(--text)); white-space: nowrap; }
  .rwd-r .n i { display: block; font: 700 9.5px/1.2 var(--display); font-style: normal; letter-spacing: .12em; text-transform: uppercase; color: var(--gold-hi, var(--gold)); }
  .rwd-r .g { display: flex; flex-wrap: wrap; gap: 3px 5px; min-width: 0; }
  .rwd-c { display: inline-flex; align-items: center; gap: 4px; max-width: 100%; padding: 1px 6px; border: 1px solid rgba(255,255,255,.14); border-radius: 3px; font: 500 11.5px/1.3 var(--body); overflow-wrap: anywhere; box-sizing: border-box; padding-block: 2px; }
  .rwd-c.t { color: var(--tc); border-color: var(--tc); font-family: var(--display); font-weight: 600; letter-spacing: .03em; }
  .rwd-c b { font: 700 11px/1 var(--jp); }
  .rwd-c i { flex: none; width: 10px; height: 10px; border-radius: 2px; background: linear-gradient(135deg, var(--a), var(--a) 50%, var(--b) 50%); }
  .rwd-c.ok::after { content: '✓'; color: #7be08f; font: 700 11px/1 var(--display); }
  .rwd-me { grid-column: 2 / -1; font: 600 11px/1.3 var(--body); color: var(--gold-hi, var(--gold)); }
  .rwd-n { margin: 0; color: var(--muted); font: 500 12px/1.35 var(--body); }
  .rwd-so { margin: 0; color: var(--gold-hi, var(--gold)); font: 600 13px/1.3 var(--body); }
  @media (max-width: 700px) { .rwd-b { grid-template-columns: minmax(0, 1fr); } .rwd-st { min-height: 0; height: 240px; } }
  @media (max-height: 460px) {
    #rk .rk-card.rwd { gap: 6px; }
    #rk .rk-card.rwd > .rk-head .rk-k { font-size: 26px; } #rk .rk-card.rwd > .rk-head .rk-title { font-size: 20px; } #rk .rk-card.rwd > .rk-head .rk-sub { font-size: 12px; margin-top: 0; }
    .rwd-st { min-height: 0; }
    .rwd-so { font-size: 11.5px; }
    .rwd-b { gap: 6px 12px; }
    .rwd-r { padding: 2px 6px; gap: 1px 8px; grid-template-columns: 24px minmax(64px, auto) minmax(0, 1fr); }
    .rwd-r .k { width: 24px; height: 24px; } .rwd-r .n { font-size: 12.5px; }
    .rwd-c { font-size: 10.5px; line-height: 1.35; padding: 0 5px; }
    .rwd-n { display: none; }
    .rwd-l { gap: 3px; }
    .rwd-me { font-size: 10.5px; }
  }
  @media (max-height: 380px) {
    #rk.overlay:has(.rk-card.rwd) { padding-block: 4px; } #rk .rk-card.rwd { gap: 4px; padding-top: 8px; padding-bottom: 8px; } .rwd-l { gap: 2px; }
    .rwd-r { padding: 1px 6px; } .rwd-r .k { width: 22px; height: 22px; } .rwd-r .k svg { width: 22px; height: 22px; }
  }
  `;
  function css() {
    if (ND.charStage && ND.charStage.frameCss) ND.charStage.frameCss();
    if (doc.getElementById('rwdCss')) return;
    const s = doc.createElement('style'); s.id = 'rwdCss'; s.textContent = CSS; doc.head.appendChild(s);
  }



  let ui = null;
  function render(c, ctx) {
    css();
    const me = ctx.me || {}, L = ctx.labels || {}, season = (me.season && me.season.id) || 1;
    c.classList.add('rwd');
    if (ui && ui.stage) ui.stage.destroy();
    ui = { sel: ui && ui.season === season ? ui.sel : 'champ', season };

    const h = el('div', 'rk-head'), k = el('b', 'rk-k', '賞'), t = el('div');
    k.setAttribute('aria-hidden', 'true');
    const tt = el('p', 'rk-title', tx(0)); tt.id = 'rkTitle';
    t.append(tt, el('p', 'rk-sub', [L.season ? L.season(season) : 'S' + season, ctx.left || ''].filter(Boolean).join(' · ')));
    const bb = el('button', 'btn rwd-back', L.back || 'Back'); bb.type = 'button'; bb.onclick = () => { if (ctx.back) ctx.back(); };
    h.append(k, t, bb); c.append(h);
    const body = el('div', 'rwd-b'), box = el('div', 'rwd-st'), list = el('div', 'rwd-l');
    list.setAttribute('role', 'group'); list.setAttribute('aria-label', tx(0));
    body.append(box, list); c.append(body);
    const stage = ND.charStage ? ND.charStage.create({ ninja: ctx.ninja || 'akane', look: false, dir: 1, tier: 15, id: 0 }) : null;
    if (stage) { box.append(stage.el); stage.el.addEventListener('click', () => stage.play('pick')); }
    ui.stage = stage; ui.box = box;

    const placed = !me.guest && me.tier != null && !(me.placement > 0);
    const myFam = placed ? famOf(me.tier) : -1;
    const peakFam = placed && me.peak_tier != null ? famOf(Math.max(me.peak_tier | 0, me.tier | 0)) : myFam;
    const rows = [];
    const row = (key, tier, name, sub, chips, tc) => {
      const b = el('button', 'rwd-r'); b.type = 'button'; b.style.setProperty('--tc', tc);
      const kk = el('span', 'k'); const e = emblem(tier, innerHeight < 460 ? 24 : 30); if (e) kk.append(e);
      const n = latin(el('span', 'n', name)); if (sub) { const i = el('i', null, sub); i.lang = lang(); n.append(i); }
      const g = el('span', 'g'); chips.forEach((x) => g.append(x));
      b.append(kk, n, g);
      b.onclick = () => { ui.sel = key; show(); safe(() => ND.audio && ND.audio.ui && ND.audio.ui()); };
      b._key = key; rows.push(b); list.append(b);
      return b;
    };
    const chip = (text, cls, tc, ok) => { const s = el('span', 'rwd-c' + (cls ? ' ' + cls : '') + (ok ? ' ok' : ''), text); if (tc) s.style.setProperty('--tc', tc); s.title = text; return s; };
    const colourChip = (kk, f) => { const p = PALS[kk], s = chip(tx(4, null, FAMS[f][1]), '', null, owns(COSTUME_ID[kk])); const i = el('i'); i.style.setProperty('--a', p.cloth); i.style.setProperty('--b', p.wrap); s.prepend(i); return s; };

    const ch = champLook(), ct = cat('title_season_champion');
    row('champ', 15, '#1', tx(2), [chip(ch.name, '', null, ch.id && owns(ch.id)), chip((ct && ND.rewards.name(ct)) || tx(6), 't', '#ffd35a', owns('title_season_champion'))], '#ffd35a');

    for (let f = 5; f >= 0; f--) {
      const P = plan(f), chips = [];
      chips.push(chip(titleName(season, f), 't', TCOL[f], owns('title_s' + season + '_' + SLUG[f])));
      if (P.crest) { const s = chip(tx(3, null, FAMS[f][1]), '', null, owns('badge_s' + season + '_' + SLUG[f])); const b = el('b', null, FAMS[f][0][0]); b.style.color = TCOL[f]; s.prepend(b); chips.push(s); }
      for (const kk of P.colors) chips.push(colourChip(kk, kk === 'shogun' ? 5 : 4));
      const b = row('f' + f, TOP[f], FAMS[f][1], null, chips, TCOL[f]);
      if (f === myFam) {
        b.classList.add('me');
        let line = '';
        const ti = ctx.tierInfo ? ctx.tierInfo(me.tier) : null;
        if (me.tier >= 15) line = tx(9);
        else if (ctx.tierFloor && me.rating != null) { const nx = me.tier + 1, need = Math.max(1, Math.ceil(ctx.tierFloor(nx) - me.rating)); line = tx(8, need, ctx.tierInfo ? ctx.tierInfo(nx).n : ''); }
        const m = el('span', 'rwd-me', '▸ ' + (L.you || tx(7)) + (ti ? ' · ' + ti.n : '') + (line ? ' · ' + line : ''));
        b.append(m);
      }
    }

    const so = el('p', 'rwd-so');
    if (me.guest || !me.season) so.textContent = tx(16);
    else if (!placed) so.textContent = me.placement > 0 ? tx(10, me.placement) + ' · ' + tx(12) : tx(12);
    else { const cs = plan(peakFam).colors; so.textContent = tx(11, null, titleName(season, peakFam) + (plan(peakFam).crest ? ' · ' + tx(3, null, FAMS[peakFam][1]) : '') + (cs.length ? ' · ' + tx(4, null, cs.map((kk) => FAMS[kk === 'shogun' ? 5 : 4][1]).join(' · ')) : '')); }
    c.append(so, el('p', 'rwd-n', tx(1)));
    function show() {
      rows.forEach((b) => b.setAttribute('aria-pressed', String(b._key === ui.sel)));
      box.querySelectorAll('.rwd-cap, .rwd-tag, .rwd-cr').forEach((x) => x.remove());
      if (!stage) return;
      const key = ui.sel;
      let look = false, tier = 15, cap = '', sub = '', own = false;
      if (key === 'champ') { look = ch.look; tier = 15; cap = ch.name; sub = tx(2) + ' · ' + tx(17); own = !!(ch.id && owns(ch.id)); }
      else {
        const f = +key.slice(1), P = plan(f);
        tier = TOP[f];
        if (P.colors.length) { const kk = P.colors[P.colors.length - 1]; look = colourLook(kk); cap = tx(4, null, FAMS[kk === 'shogun' ? 5 : 4][1]); own = owns(COSTUME_ID[kk]); }
        else { look = safe(() => ND.save && ND.save.look ? ND.save.look(ctx.ninja) : false) || false; cap = titleName(season, f); }
        sub = titleName(season, f) + (P.crest ? ' · ' + tx(3, null, FAMS[f][1]) : '');
      }
      stage.set({ look, portrait: look === false ? '' : null }); stage.setTier(tier); stage.play('pick'); stage.glint();
      const cr = el('div', 'rwd-cr'), e = emblem(tier, 40); if (e) { cr.append(e); stage.el.append(cr); }
      const tg = el('div', 'rwd-tag' + (own ? ' own' : ''), own ? '✓ ' + tx(14) : tx(13)); stage.el.append(tg);
      const cp = el('div', 'rwd-cap'); cp.append(el('span', null, cap)); if (sub) cp.append(el('small', null, sub)); stage.el.append(cp);
    }
    show();
    return ui;
  }
  function stop() { if (ui && ui.stage) ui.stage.destroy(); ui = null; }


  function cardEntry(onOpen) {
    css();
    const b = el('button', 'rkc-rw'); b.type = 'button'; b.id = 'mrankedRw';
    const k = el('b', null, '賞'); k.setAttribute('aria-hidden', 'true');
    b.append(k, el('span', null, tx(0)), el('i', null, '›'));
    b.setAttribute('aria-label', tx(0)); b.title = tx(0);
    b.onclick = (e) => { e.stopPropagation(); onOpen(); };
    b.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); };
    return b;
  }
  const relabel = (b) => { const s = b && b.querySelector('span'); if (s) { s.textContent = tx(0); b.setAttribute('aria-label', tx(0)); b.title = tx(0); } };

  function entry(onOpen) {
    css();
    const b = el('button', 'btn rwd-go'); b.type = 'button';
    const e = emblem(15, 22); if (e) b.append(e);
    b.append(el('span', null, tx(0) + ' ›'));
    b.onclick = onOpen;
    return b;
  }

  ND.rankRewards = { render, stop, entry, cardEntry, relabel, plan, PALS, COSTUME_ID, FAMS, SLUG, titleName, texts: TX, t: tx };

  if (QS.get('rwdemo') === '1') {
    const go = () => setTimeout(() => safe(() => { if (ND.ranked && ND.ranked.demo) { const f = doc.getElementById('fMenu'); if (f && doc.getElementById('first') && !doc.getElementById('first').hidden) f.click(); ND.ranked.demo('rewards'); } }), 500);
    if (doc.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
  }
})(window.ND);
