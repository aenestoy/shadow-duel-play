














(function (ND) {
  'use strict';
  if (!ND || typeof document === 'undefined') return;
  const doc = document;
  const safe = (f) => { try { return f(); } catch (e) { return undefined; } };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const QS = new URLSearchParams(location.search);
  const RM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };





  const TX = {
    en: ['Character', 'Costume', 'Worn', 'Preview', 'Original', 'Legacy', 'Champion colours', 'Earn every journey star with this ninja', 'Win a Monthly Tournament with this ninja', 'Shadow Pass · tier {n}', 'Shadow Pass (another season)', 'Finish this ninja\'s journey {n} times', 'Finish a ranked season at #1', 'A ranked reward', 'Tap the ninja', 'Previous ninja', 'Next ninja', 'Season Champion costume'],
    tr: ['Karakter', 'Kostüm', 'Giyili', 'Ön izleme', 'Asıl renkler', 'Miras', 'Şampiyon renkleri', 'Bu ninjayla yolculuğun bütün yıldızlarını al', 'Bu ninjayla bir Aylık Turnuva kazan', 'Gölge Pass · {n}. kademe', 'Gölge Pass (başka bir sezon)', 'Bu ninjanın yolculuğunu {n} kez bitir', 'Bir dereceli sezonu 1. bitir', 'Bir dereceli ödülü', 'Ninjaya dokun', 'Önceki ninja', 'Sonraki ninja', 'Sezon Şampiyonu kostümü'],
    es: ['Personaje', 'Traje', 'Puesto', 'Vista previa', 'Original', 'Legado', 'Colores de campeón', 'Consigue todas las estrellas del viaje con este ninja', 'Gana un Torneo Mensual con este ninja', 'Pase Sombra · nivel {n}', 'Pase Sombra (otra temporada)', 'Termina el viaje de este ninja {n} veces', 'Termina una temporada clasificatoria en el n.º 1', 'Una recompensa clasificatoria', 'Toca al ninja', 'Ninja anterior', 'Ninja siguiente', 'Traje de campeón de temporada'],
    pt: ['Personagem', 'Traje', 'Usando', 'Prévia', 'Original', 'Legado', 'Cores de campeão', 'Ganhe todas as estrelas da jornada com este ninja', 'Vença um Torneio Mensal com este ninja', 'Passe Sombra · nível {n}', 'Passe Sombra (outra temporada)', 'Termine a jornada deste ninja {n} vezes', 'Termine uma temporada ranqueada em 1º', 'Uma recompensa ranqueada', 'Toque no ninja', 'Ninja anterior', 'Próximo ninja', 'Traje de campeão da temporada'],
    ru: ['Персонаж', 'Костюм', 'Надето', 'Примерка', 'Обычный', 'Наследие', 'Цвета чемпиона', 'Соберите все звёзды пути этим ниндзя', 'Выиграйте Ежемесячный турнир этим ниндзя', 'Пропуск Тени · ступень {n}', 'Пропуск Тени (другой сезон)', 'Пройдите путь этого ниндзя {n} раза', 'Завершите рейтинговый сезон первым', 'Рейтинговая награда', 'Нажмите на ниндзя', 'Предыдущий ниндзя', 'Следующий ниндзя', 'Костюм чемпиона сезона'],
    de: ['Figur', 'Kostüm', 'Getragen', 'Vorschau', 'Original', 'Vermächtnis', 'Championfarben', 'Hol alle Reisesterne mit diesem Ninja', 'Gewinne ein Monatsturnier mit diesem Ninja', 'Schattenpass · Stufe {n}', 'Schattenpass (andere Saison)', 'Beende die Reise dieses Ninjas {n}-mal', 'Beende eine Ranglisten-Saison auf Platz 1', 'Eine Ranglisten-Belohnung', 'Tippe auf den Ninja', 'Vorheriger Ninja', 'Nächster Ninja', 'Saisonchampion-Kostüm'],
    fr: ['Personnage', 'Costume', 'Porté', 'Aperçu', 'Original', 'Héritage', 'Couleurs de champion', 'Gagnez toutes les étoiles du voyage avec ce ninja', 'Gagnez un Tournoi mensuel avec ce ninja', 'Passe de l\'Ombre · palier {n}', 'Passe de l\'Ombre (autre saison)', 'Terminez le voyage de ce ninja {n} fois', 'Terminez une saison classée à la 1re place', 'Une récompense classée', 'Touchez le ninja', 'Ninja précédent', 'Ninja suivant', 'Costume de champion de saison'],
    it: ['Personaggio', 'Costume', 'Indossato', 'Anteprima', 'Originale', 'Eredità', 'Colori del campione', 'Ottieni tutte le stelle del viaggio con questo ninja', 'Vinci un Torneo mensile con questo ninja', 'Pass Ombra · livello {n}', 'Pass Ombra (altra stagione)', 'Completa il viaggio di questo ninja {n} volte', 'Chiudi una stagione classificata al 1º posto', 'Un premio classificato', 'Tocca il ninja', 'Ninja precedente', 'Ninja successivo', 'Costume del campione di stagione'],
    pl: ['Postać', 'Strój', 'Założony', 'Podgląd', 'Oryginał', 'Dziedzictwo', 'Barwy mistrza', 'Zdobądź wszystkie gwiazdy podróży tym ninją', 'Wygraj Turniej Miesięczny tym ninją', 'Przepustka Cienia · poziom {n}', 'Przepustka Cienia (inny sezon)', 'Ukończ podróż tego ninjy {n} razy', 'Zakończ sezon rankingowy na 1. miejscu', 'Nagroda rankingowa', 'Dotknij ninjy', 'Poprzedni ninja', 'Następny ninja', 'Strój mistrza sezonu'],
    id: ['Karakter', 'Kostum', 'Dipakai', 'Pratinjau', 'Asli', 'Warisan', 'Warna juara', 'Raih semua bintang perjalanan dengan ninja ini', 'Menangkan Turnamen Bulanan dengan ninja ini', 'Pass Bayangan · tingkat {n}', 'Pass Bayangan (musim lain)', 'Selesaikan perjalanan ninja ini {n} kali', 'Akhiri musim peringkat di posisi 1', 'Hadiah peringkat', 'Ketuk ninjanya', 'Ninja sebelumnya', 'Ninja berikutnya', 'Kostum juara musim'],
    vi: ['Nhân vật', 'Trang phục', 'Đang mặc', 'Xem thử', 'Nguyên bản', 'Di sản', 'Màu nhà vô địch', 'Lấy mọi sao hành trình với ninja này', 'Thắng một Giải đấu tháng với ninja này', 'Thẻ Bóng Tối · bậc {n}', 'Thẻ Bóng Tối (mùa khác)', 'Hoàn thành hành trình của ninja này {n} lần', 'Kết thúc một mùa xếp hạng ở hạng 1', 'Một phần thưởng xếp hạng', 'Chạm vào ninja', 'Ninja trước', 'Ninja sau', 'Trang phục vô địch mùa'],
    th: ['ตัวละคร', 'ชุด', 'สวมอยู่', 'ลองดู', 'ดั้งเดิม', 'มรดก', 'สีแชมป์', 'เก็บดาวการเดินทางทั้งหมดด้วยนินจาตัวนี้', 'ชนะทัวร์นาเมนต์รายเดือนด้วยนินจาตัวนี้', 'พาสเงา · ขั้น {n}', 'พาสเงา (ซีซันอื่น)', 'จบการเดินทางของนินจาตัวนี้ {n} ครั้ง', 'จบซีซันแรงก์เป็นอันดับ 1', 'รางวัลแรงก์', 'แตะที่นินจา', 'นินจาก่อนหน้า', 'นินจาถัดไป', 'ชุดแชมป์ซีซัน'],
    hi: ['किरदार', 'पोशाक', 'पहना हुआ', 'झलक', 'मूल', 'विरासत', 'चैंपियन रंग', 'इस निंजा से यात्रा के सारे सितारे जीतें', 'इस निंजा से मासिक टूर्नामेंट जीतें', 'शैडो पास · स्तर {n}', 'शैडो पास (दूसरा सीज़न)', 'इस निंजा की यात्रा {n} बार पूरी करें', 'रैंक्ड सीज़न नंबर 1 पर खत्म करें', 'रैंक्ड इनाम', 'निंजा पर टैप करें', 'पिछला निंजा', 'अगला निंजा', 'सीज़न चैंपियन पोशाक'],
    ar: ['الشخصية', 'الزي', 'مرتدى', 'معاينة', 'الأصلي', 'الإرث', 'ألوان البطل', 'اجمع كل نجوم الرحلة بهذا النينجا', 'اربح بطولة شهرية بهذا النينجا', 'تذكرة الظل · المستوى {n}', 'تذكرة الظل (موسم آخر)', 'أنهِ رحلة هذا النينجا {n} مرات', 'أنهِ موسمًا مصنفًا في المركز الأول', 'جائزة مصنفة', 'المس النينجا', 'النينجا السابق', 'النينجا التالي', 'زي بطل الموسم'],
    zh: ['角色', '服装', '已穿戴', '预览', '原版', '传承', '冠军配色', '用这名忍者拿下旅程的全部星星', '用这名忍者赢得一次月度锦标赛', '暗影通行证 · 第{n}级', '暗影通行证（其他赛季）', '完成这名忍者的旅程{n}次', '以第1名结束一个排位赛季', '排位奖励', '点击忍者', '上一名忍者', '下一名忍者', '赛季冠军服装'],
    'zh-TW': ['角色', '服裝', '已穿戴', '預覽', '原版', '傳承', '冠軍配色', '用這名忍者拿下旅程的全部星星', '用這名忍者贏得一次月度錦標賽', '暗影通行證 · 第{n}級', '暗影通行證（其他賽季）', '完成這名忍者的旅程{n}次', '以第1名結束一個排位賽季', '排位獎勵', '點擊忍者', '上一名忍者', '下一名忍者', '賽季冠軍服裝'],
    ja: ['キャラクター', 'コスチューム', '着用中', 'プレビュー', 'オリジナル', 'レガシー', 'チャンピオンカラー', 'この忍者で旅の星をすべて集める', 'この忍者で月間トーナメントに優勝する', 'シャドウパス · {n}段階', 'シャドウパス（別シーズン）', 'この忍者の旅を{n}回クリアする', 'ランクマッチのシーズンを1位で終える', 'ランクマッチの報酬', '忍者をタップ', '前の忍者', '次の忍者', 'シーズンチャンピオンの衣装'],
    ko: ['캐릭터', '의상', '착용 중', '미리보기', '기본', '유산', '챔피언 색상', '이 닌자로 여정의 별을 모두 모으기', '이 닌자로 월간 토너먼트 우승', '그림자 패스 · {n}단계', '그림자 패스 (다른 시즌)', '이 닌자의 여정을 {n}번 완료', '랭크 시즌을 1위로 마치기', '랭크 보상', '닌자를 탭하세요', '이전 닌자', '다음 닌자', '시즌 챔피언 의상'],
  };
  const lang = () => (ND.i18n && typeof ND.i18n.lang === 'string' ? ND.i18n.lang : 'tr');
  const tx = (i, n) => { const t = (TX[lang()] || TX.en)[i] || TX.en[i]; return n == null ? t : t.replace('{n}', String(n)); };
  const nice = (n) => String(n || '').charAt(0) + String(n || '').slice(1).toLowerCase();


  const LV = () => ND.LEVEL;
  const S = () => ND.save;
  function looksOf(id) {
    const out = [], sv = S(), P = ND.pass, R = ND.rewards, ch = ND.CHARS.find((c) => c.id === id);
    if (!sv || !ch) return out;
    const opts = safe(() => sv.lookOptions(id)) || [false];
    const has = (v) => opts.some((x) => x === v);
    out.push({ v: false, name: tx(4), owned: true });
    out.push({ v: true, name: tx(5), owned: has(true), how: tx(7) });

    if (has('champ') || safe(() => ND.leaderboard && ND.leaderboard.titlesEarnable && ND.leaderboard.titlesEarnable())) out.push({ v: 'champ', name: tx(6), owned: has('champ'), how: tx(8) });

    const L = LV();
    if (L && P && P.itemName) {
      const ids = [];
      for (const [th, nj] of (L.COSTUMES || [])) if (nj === id) ids.push('cos_' + th + '_' + nj);
      for (const k of Object.keys(L.ITEMS || {})) { const it = L.ITEMS[k]; if (it.kind === 'cos' && it.drawn && it.ninja === id) ids.push(k); }
      ids.push('jc2_' + id, 'jc3_' + id);
      const se = safe(() => P.season()), tiers = (se && se.C && se.C.tiers) || [];
      for (const it of ids) {
        if (!L.item(it)) continue;
        const v = 'ps:' + it, li = L.item(it);
        const tier = tiers.findIndex((t) => t && t.r === it);
        const how = li.journey ? tx(11, li.journey) : tier >= 0 ? tx(9, tier + 1) : tx(10);
        out.push({ v, name: P.itemName(it), owned: has(v), how, pass: true });
      }
    }

    let champCat = false;
    if (R && R.catalog) {
      for (const e of R.catalog()) {
        if (e.kind !== 'costume' || (e.ninjas && !e.ninjas.includes(id)) || !safe(() => R.palette(ch, e.id))) continue;
        const v = 'rw:' + e.id;
        if (e.builtin === 'champion') champCat = true;
        out.push({ v, name: R.name(e), owned: has(v), how: e.builtin === 'champion' ? tx(12) : tx(13), rank: true, champ: e.builtin === 'champion' });
      }
    }

    if (!champCat && ND.ranked && ND.costumeKey && ND.costumeKey('champion', id)) out.push({ v: 'cos:champion', name: tx(17), owned: false, how: tx(12), rank: true, champ: true });
    return out;
  }


  const CSS = `
  .pf-char { padding-top: 10px; }
  .cpv { display: grid; grid-template-columns: minmax(220px, 40%) minmax(0, 1fr); grid-template-areas: "st r" "w r"; gap: 6px 16px; align-items: start; }
  .cpv-st { grid-area: st; position: relative; height: clamp(220px, 50vh, 400px); min-width: 0; }
  .cpv-st .cst { position: absolute; inset: 0; cursor: pointer; touch-action: pan-y; }
  .cpv-st .cst > canvas, .cpv-st .cst > .cst-pt { height: calc(100% - 34px); }
  .cpv-ar { position: absolute; top: calc(50% - 34px); z-index: 5; width: 40px; height: 52px; display: grid; place-items: center; padding: 0; border: 1px solid rgba(255,255,255,.18);
    border-radius: 4px; background: rgba(6,7,12,.62); color: var(--gold-hi, #f6dfa6); font: 700 28px/1 var(--display); cursor: pointer; }
  .cpv-ar.p { left: 8px; } .cpv-ar.n { right: 8px; }
  .cpv-ar:hover { background: rgba(217,179,108,.22); }
  .cpv-nm { position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; height: 34px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 12px;
    background: linear-gradient(180deg, rgba(6,7,12,.3), rgba(6,7,12,.92)); font: 600 17px/1 var(--display); letter-spacing: .08em; white-space: nowrap; }
  .cpv-nm b { font: 700 19px/1 var(--jp); color: var(--nc, var(--gold)); }
  .cpv-nm small { font: 500 11px/1 var(--display); color: var(--muted); letter-spacing: .06em; }
  .cpv-cr { position: absolute; top: 10px; left: 11px; z-index: 4; line-height: 0; pointer-events: none; }
  .cpv-pv { position: absolute; top: 12px; right: 12px; z-index: 4; padding: 3px 7px; border: 1px dashed #ffc79a; background: rgba(6,7,12,.75); color: #ffc79a;
    font: 700 10.5px/1.2 var(--display); letter-spacing: .12em; text-transform: uppercase; pointer-events: none; }
  .cpv-tap { position: absolute; top: 12px; right: 12px; z-index: 4; color: var(--muted); font: 500 11px/1.2 var(--body); pointer-events: none; opacity: .8; }
  .cpv-worn { grid-area: w; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; padding: 2px 0 4px; font: 600 12.5px/1.45 var(--body); }
  .cpv-worn .lv { padding: 1px 5px; border: 1px solid var(--pf, var(--gold)); color: var(--gold-hi, var(--gold)); font: 700 11px/1.35 var(--display); letter-spacing: .08em; }
  .cpv-worn .ic { display: inline-grid; place-items: center; width: 20px; height: 20px; border: 1px solid currentColor; border-radius: 50%; font: 700 11px/1 var(--jp); }
  .cpv-worn .fr { display: inline-flex; align-items: center; gap: 4px; color: var(--muted); font-weight: 500; }
  .cpv-worn .fr i { width: 12px; height: 12px; border: 2px solid var(--pf); box-sizing: border-box; }
  .cpv-r { grid-area: r; display: grid; gap: 8px; min-width: 0; align-content: start; }
  .cpv-r h4 { margin: 0; display: flex; align-items: baseline; gap: 8px; min-width: 0; font: 600 11.5px/1.3 var(--display); letter-spacing: .14em; text-transform: uppercase; color: #d9c2ff; }
  .cpv-r h4 span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 600 13px/1.3 var(--body); letter-spacing: 0; text-transform: none; color: var(--text); }
  .cpv-g { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 6px; }
  .cpv-t { position: relative; display: grid; grid-template-rows: auto auto; justify-items: center; align-content: start; gap: 3px; min-width: 0; padding: 3px 3px 5px; box-sizing: border-box;
    border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.035); color: var(--text); cursor: pointer; font: inherit; }
  .cpv-t canvas { width: 100%; height: 100px; display: block; }
  .cpv-t small { max-width: 100%; font: 500 11px/1.25 var(--body); text-align: center; overflow-wrap: anywhere; }
  .cpv-t[aria-pressed="true"] { border-color: var(--gold); background: rgba(217,179,108,.16); box-shadow: 0 0 10px -4px var(--gold); }
  .cpv-t[aria-pressed="true"]::after { content: '✓'; position: absolute; top: 2px; right: 4px; color: #7be08f; font: 700 13px/1 var(--display); }
  .cpv-t.cpv-lock canvas { opacity: .55; filter: grayscale(.5); }
  .cpv-t.cpv-lock::before { content: '🔒'; position: absolute; z-index: 1; top: 3px; left: 4px; font-size: 11px; }
  .cpv-t.cpv-lock.cpv-rank { border-color: rgba(255,211,90,.35); }
  .cpv-t.cpv-sel { outline: 2px dashed #ffc79a; outline-offset: -3px; }
  .cpv-r h4 .h { display: none; color: #ffc79a; }
  .cpv-how { margin: 0; color: #ffc79a; font: 500 12.5px/1.35 var(--body); }
  .cpv-how:empty { display: none; }
  @media (max-width: 640px) { .cpv { grid-template-columns: minmax(0, 1fr); grid-template-areas: "st" "w" "r"; } .cpv-st { height: clamp(260px, 44vh, 360px); } }
  /* phones on their side: the section fits the profile's body without scrolling; the costumes in one row that scrolls
     sideways (its far end fades while there is more), what is worn under them */
  @media (max-height: 460px) and (orientation: landscape) {
    .pf-char { padding-top: 4px; } .pf-char > h3 { display: none; }
    .cpv { grid-template-columns: minmax(200px, 38%) minmax(0, 1fr); grid-template-areas: "st r" "st w"; grid-template-rows: auto 1fr; gap: 4px 12px; }
    .cpv-st { height: clamp(170px, calc(100vh - 160px), 220px); }
    .cpv-g { grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: 84px; overflow-x: auto; overscroll-behavior-x: contain; touch-action: pan-x; padding-bottom: 2px; }
    .cpv-g.more { -webkit-mask-image: linear-gradient(90deg, #000 82%, transparent); mask-image: linear-gradient(90deg, #000 82%, transparent); }
    .cpv-g.less { -webkit-mask-image: linear-gradient(90deg, transparent, #000 18%); mask-image: linear-gradient(90deg, transparent, #000 18%); }
    .cpv-g.more.less { -webkit-mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent); mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent); }
    .cpv-t canvas { height: 84px; }
    .cpv-t small { font-size: 10.5px; }
    .cpv-worn { align-self: end; }
    .cpv-how { display: none; } .cpv-r h4 .h { display: block; } .cpv-r h4 .h ~ .w, .cpv-r h4 .w:has(~ .h) { display: none; }
  }
  `;
  function css() {
    if (ND.charStage && ND.charStage.frameCss) ND.charStage.frameCss();
    if (doc.getElementById('cpvCss')) return;
    const s = doc.createElement('style'); s.id = 'cpvCss'; s.textContent = CSS; doc.head.appendChild(s);
  }


  let ui = null;
  const unlocked = () => (ND.CHARS || []).filter((c) => c.id !== 'shura' && !c.hidden && (!S() || !S().isCharUnlocked || S().isCharUnlocked(c.id)));
  const rankTier = () => safe(() => {
    if (ui && ui.tier !== undefined) return ui.tier;
    const me = ND.ranked && ND.ranked.state ? ND.ranked.state().me : null;
    if (!me || me.guest || me.tier == null) return null;

    const sid = me.season && me.season.id, last = Array.isArray(me.finals) ? me.finals.find((f) => f && f.season === sid - 1 && f.tier != null) : null;
    return me.placement > 0 ? (last ? last.tier : 'placement') : me.tier;
  });
  function build() {
    css();
    const el = doc.createElement('div'); el.className = 'cpv';
    const box = doc.createElement('div'); box.className = 'cpv-st';
    const list = unlocked();
    const g = ND.game, cur = g && g.sel && ND.CHARS[g.sel.c[0]];
    const start = Math.max(0, list.findIndex((c) => cur && c.id === cur.id));
    const ch = list[start] || list[0];

    const stage = ND.charStage.create({ ninja: ch.id, look: S() ? S().look(ch.id) : false, dir: 1, tier: null, id: 0, cls: 'cpv-cst', zoom: 1.2, foot: 0.96 });
    box.append(stage.el);
    const prev = doc.createElement('button'), next = doc.createElement('button');
    prev.type = next.type = 'button'; prev.className = 'cpv-ar p'; next.className = 'cpv-ar n'; prev.textContent = '‹'; next.textContent = '›';
    box.append(prev, next);
    const worn = doc.createElement('div'); worn.className = 'cpv-worn';
    const R = doc.createElement('div'); R.className = 'cpv-r';
    el.append(box, R, worn);
    ui = { el, box, stage, prev, next, worn, R, list, i: Math.max(0, start), preview: null, move: 0, thumb: null, tier: ui ? ui.tier : undefined };
    prev.onclick = (e) => { e.stopPropagation(); go(-1); };
    next.onclick = (e) => { e.stopPropagation(); go(1); };

    let sx = null, sy = 0, moved = false;
    stage.el.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; moved = false; });
    stage.el.addEventListener('pointermove', (e) => { if (sx != null && Math.abs(e.clientX - sx) > 12) moved = true; });
    stage.el.addEventListener('pointerup', (e) => {
      if (sx == null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) { go(dx < 0 ? 1 : -1); return; }
      if (!moved) act();
    });
    stage.el.tabIndex = 0;
    stage.el.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(-1); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); go(1); }
      else if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); act(); }
    });
    return ui;
  }
  const MOVES = ['pick', 'kata', 'bow', 'glance'];
  function act() {
    if (!ui) return;
    const m = MOVES[ui.move++ % MOVES.length];
    ui.stage.play(RM.matches && m !== 'pick' ? 'pick' : m);
    safe(() => ND.audio && ND.audio.swoosh && ND.audio.menu(() => ND.audio.swoosh(0.6, 0)));
    const t = ui.box.querySelector('.cpv-tap'); if (t) t.remove();
  }
  function go(d) {
    if (!ui || !ui.list.length) return;
    ui.i = (ui.i + d + ui.list.length) % ui.list.length;
    ui.preview = null;
    refresh(true);
    ui.stage.play('pick');
    safe(() => ND.audio && ND.audio.ui && ND.audio.ui());
  }
  function ch() { return ui.list[ui.i] || ui.list[0]; }
  function refresh(newNinja) {
    if (!ui) return;
    const c = ch(), sv = S(), now = sv ? sv.look(c.id) : false;


    const looks = looksOf(c.id);
    if (ui.preview != null && !looks.some((l) => l.v === ui.preview)) { const alt = String(ui.preview) === 'cos:champion' || String(ui.preview).startsWith('rw:') ? looks.find((l) => l.champ && !l.owned) : null; ui.preview = alt ? alt.v : null; }
    const look = ui.preview != null ? ui.preview : now;
    ui.stage.set({ ninja: c.id, look, portrait: look === false ? '' : null });
    ui.stage.setTier(rankTier());

    ui.box.querySelectorAll('.cpv-cr, .cpv-pv, .cpv-nm').forEach((x) => x.remove());
    const t = rankTier();
    if (t != null && ND.rankEmblem && ND.rankEmblem.el) { const cr = doc.createElement('div'); cr.className = 'cpv-cr'; const e = safe(() => ND.rankEmblem.el(t, { size: 46, glow: true, anim: true })); if (e) { e.setAttribute('aria-hidden', 'true'); cr.append(e); ui.stage.el.append(cr); } }
    if (ui.preview != null) { const old = ui.stage.el.querySelector('.cpv-tap'); if (old) old.remove(); const p = doc.createElement('div'); p.className = 'cpv-pv'; p.textContent = tx(3); ui.stage.el.append(p); }
    else if (!ui.tapped) { ui.tapped = true; const p = doc.createElement('div'); p.className = 'cpv-tap'; p.textContent = tx(14); ui.stage.el.append(p); }
    const nm = doc.createElement('div'); nm.className = 'cpv-nm';
    nm.innerHTML = `<b aria-hidden="true">${esc(c.kanji)}</b><span lang="en" translate="no">${esc(nice(c.name))}</span><small>${ui.i + 1} / ${ui.list.length}</small>`;
    nm.style.setProperty('--nc', (ui.stage.f && ui.stage.f.col && ui.stage.f.col.ui) || c.col.ui);
    ui.stage.el.append(nm);
    ui.prev.setAttribute('aria-label', tx(15)); ui.next.setAttribute('aria-label', tx(16));
    ui.prev.hidden = ui.next.hidden = ui.list.length < 2;
    ui.stage.el.setAttribute('aria-label', nice(c.name) + ' · ' + tx(14));
    const cur = looks.find((l) => l.v === now) || looks[0];
    const pv = ui.preview != null ? looks.find((l) => l.v === ui.preview) : null;


    const how = pv && !pv.owned ? '🔒 ' + esc(pv.name) + ' — ' + esc(pv.how || '') : '';
    ui.R.innerHTML = `<h4>${esc(tx(1))}<span class="w">${esc(tx(2))}: ${esc(cur ? cur.name : '')}</span>${how ? `<span class="h" aria-hidden="true">${how}</span>` : ''}</h4><p class="cpv-how" aria-live="polite">${how}</p><div class="cpv-g" role="group" aria-label="${esc(tx(1))}"></div>`;
    const grid = ui.R.querySelector('.cpv-g');
    for (const l of looks) {
      const b = doc.createElement('button');
      b.type = 'button'; b.className = 'cpv-t' + (l.owned ? '' : ' cpv-lock') + (l.rank ? ' cpv-rank' : '') + (ui.preview != null && l.v === ui.preview ? ' cpv-sel' : '');
      b.setAttribute('aria-pressed', String(l.owned && l.v === now));
      b.title = l.owned ? l.name : l.name + ' — ' + (l.how || '');
      const cv = doc.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
      const sm = doc.createElement('small'); sm.textContent = shortName(l, c);
      b.append(cv, sm);
      b.onclick = () => {
        if (l.owned) { ui.preview = null; if (sv) sv.setLook(c.id, l.v); safe(() => ND.audio && ND.audio.ui && ND.audio.ui()); safe(() => ND.game && ND.game.phase === 'select' && ND.game.refreshSelect && ND.game.refreshSelect()); }
        else ui.preview = ui.preview === l.v ? null : l.v;
        refresh(false);
        ui.stage.play('pick');
      };
      grid.append(b);
      b._look = l.v;
    }
    worn();
    thumbs(c);

    const more = () => { const over = grid.scrollWidth > grid.clientWidth + 2; grid.classList.toggle('more', over && grid.scrollLeft + grid.clientWidth < grid.scrollWidth - 2); grid.classList.toggle('less', over && grid.scrollLeft > 2); };
    grid.addEventListener('scroll', more, { passive: true });
    requestAnimationFrame(more);
    const on = grid.querySelector('.cpv-sel') || grid.querySelector('[aria-pressed="true"]');
    if (on) requestAnimationFrame(() => { if (grid.scrollWidth > grid.clientWidth + 2) { grid.scrollLeft = Math.max(0, on.offsetLeft - grid.clientWidth / 2 + on.offsetWidth / 2); more(); } });
  }

  function shortName(l, c) {
    const N = nice(c.name), s = String(l.name || '');
    let out = s;
    if (out.endsWith(' · ' + N)) out = out.slice(0, -(N.length + 3));
    else if (out.startsWith(N + ' · ')) out = out.slice(N.length + 3);
    return out.trim() || s;
  }

  function worn() {
    const P = ND.pass, w = ui.worn;
    w.textContent = '';
    const st = safe(() => P && P.state && P.state());
    if (!st) return;
    const info = (id) => (id && P.itemInfo ? P.itemInfo(id) : null);
    const fr = info(st.eq && st.eq.frame), ti = info(st.eq && st.eq.title), bd = info(st.eq && st.eq.badge);
    if (fr && fr.color) w.style.setProperty('--pf', fr.color); else w.style.removeProperty('--pf');
    const lv = safe(() => P.level().lv);
    if (lv) { const b = doc.createElement('b'); b.className = 'lv'; b.lang = 'en'; b.textContent = ((P.levelLabel && P.levelLabel()) || 'LV') + ' ' + lv; w.append(b); }
    if (ti) { const s = doc.createElement('span'); s.textContent = ti.name; s.style.color = ti.color || ''; s.dir = 'auto'; w.append(s); }
    if (bd && bd.icon) { const s = doc.createElement('i'); s.className = 'ic'; s.textContent = bd.icon; s.style.color = bd.color || ''; s.title = bd.name; w.append(s); }
    if (fr) { const s = doc.createElement('span'); s.className = 'fr'; s.innerHTML = '<i aria-hidden="true"></i>'; s.append(fr.name); w.append(s); }
  }

  function thumbs(c) {
    const g = ND.game;
    if (!g || !g.drawPv || !ND.Fighter || !ND.Ctrl) return;
    const run = () => {
      if (!ui || !ui.el.isConnected) return;
      if (!ui.thumb) { ui.thumb = new ND.Fighter(1, new ND.Ctrl()); ui.thumb.fullDetail = true; }
      const f = ui.thumb;
      for (const b of ui.R.querySelectorAll('.cpv-t')) {
        const cv = b.querySelector('canvas');
        safe(() => {
          const look = b._look;
          if (typeof look === 'string' && look.startsWith('cos:')) { f.setChar(c, false); const k = ND.costumeKey(look.slice(4), c.id); if (k) { f.col = ND.costumePal(ND.palOf(c, false), k); f._ropes = null; } }
          else f.setChar(c, look);
          f.reset(0); f.dir = 1; f.pvPose = null;
          for (let k = 0; k < 6; k++) g.stepPv(f, 1 / 60, k / 60);
          ND.charStage.drawFighter(cv, f, 1.45, 0.975);
        });
      }
    };
    requestAnimationFrame(run);
  }



  function mount(host) {
    if (!host || !ND.charStage || !ND.CHARS) return;
    safe(() => {
      if (!ui || !ui.el) build();
      else ui.list = unlocked();
      host.append(ui.el);
      refresh(false);
    });
  }
  function head() { return tx(0); }


  function demo() {
    const sv = S(), P = ND.pass;
    if (!sv || !P || !P.open) return;

    const fresh = safe(() => !Object.getOwnPropertyDescriptor(window, 'localStorage') ? false : !(window.localStorage instanceof Storage));
    if (!fresh && !window.confirm('profdemo: give this browser made-up progress (all ninjas, costumes)? It stays in this browser\'s save.')) return;
    sv.unlockAll();
    safe(() => { sv.p.journey.mastered.akane = true; sv.p.journey.mastered.aoi = true; sv.commit(); });
    const st = P.state(), add = (id) => { if (!st.own.includes(id)) st.own.push(id); };
    ['cos_sakura_akane', 'jc2_akane', 'pass1_akane', 'cos_moon_aoi', 'jc2_aoi', 'jc3_aoi', 'cos_ash_kuro', 'cos_lotus_hana', 'jc2_kage', 'title_nightblade', 'badge_moon', 'frame_jade'].forEach(add);
    st.eq.title = 'title_nightblade'; st.eq.badge = 'badge_moon'; st.eq.frame = 'frame_jade';
    st.xp = Math.max(st.xp | 0, 22000);
    safe(() => P.equip && P.equip('title', 'title_nightblade'));
    safe(() => sv.setLook('akane', 'ps:jc2_akane'));

    const q = QS.get('tier'), t = parseInt(q || '7', 10);
    ui = { tier: q === 'none' ? null : q === 'placement' ? 'placement' : Number.isFinite(t) ? Math.max(0, Math.min(15, t)) : 7 };
    if (ND.game && ND.game.goMenu) safe(() => { const f = doc.getElementById('fMenu'); if (f && !doc.getElementById('first').hidden) f.click(); });
    P.open('profile');
  }
  if (QS.get('profdemo') === '1') {
    const go = () => setTimeout(() => safe(demo), 400);
    if (doc.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
  }

  ND.charPreview = { mount, head, looksOf, texts: TX, get ui() { return ui; } };
})(window.ND);
