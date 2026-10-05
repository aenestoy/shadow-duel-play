




(function (ND) {
  'use strict';
  const LANGS = ['tr', 'es', 'pt', 'ru', 'de', 'fr', 'it', 'pl', 'id', 'vi', 'th', 'hi', 'ar', 'zh', 'zh-TW', 'ja', 'ko'];
  const T = {

    'NEW NINJA: {0}': ['YENİ NİNJA: {0}', 'NUEVO NINJA: {0}', 'NOVO NINJA: {0}', 'НОВЫЙ НИНДЗЯ: {0}', 'NEUER NINJA: {0}', 'NOUVEAU NINJA : {0}', 'NUOVO NINJA: {0}', 'NOWY NINJA: {0}', 'NINJA BARU: {0}', 'NINJA MỚI: {0}', 'นินจาใหม่: {0}', 'नया निंजा: {0}', 'نينجا جديد: {0}', '新忍者：{0}', '新忍者：{0}', '新しい忍者：{0}', '새 닌자: {0}'],
    'Rival challenge in {0} wins': ['Meydan okuma: {0} galibiyet sonra', 'Desafío de rival en {0} victorias', 'Desafio de rival em {0} vitórias', 'Побед до вызова соперника: {0}', 'Rivalen-Duell in {0} Siegen', 'Défi du rival dans {0} victoires', 'Sfida del rivale tra {0} vittorie', 'Zwycięstw do wyzwania rywala: {0}', 'Tantangan rival dalam {0} kemenangan', 'Thách đấu đối thủ sau {0} trận thắng', 'ท้าดวลคู่ปรับในอีก {0} ชัยชนะ', '{0} जीत में प्रतिद्वंद्वी चुनौती', 'انتصارات متبقية لتحدي المنافس: {0}', '再赢{0}场开启对手挑战', '再贏{0}場開啟對手挑戰', 'あと{0}勝でライバル戦', '{0}승 더 하면 라이벌 도전'],
    'Rival challenge in 1 win': ['Meydan okuma: 1 galibiyet sonra', 'Desafío de rival en 1 victoria', 'Desafio de rival em 1 vitória', 'Ещё 1 победа до вызова соперника', 'Rivalen-Duell in 1 Sieg', 'Défi du rival dans 1 victoire', 'Sfida del rivale tra 1 vittoria', 'Jeszcze 1 zwycięstwo do wyzwania rywala', 'Tantangan rival dalam 1 kemenangan', 'Thách đấu đối thủ sau 1 trận thắng', 'ท้าดวลคู่ปรับในอีก 1 ชัยชนะ', '1 जीत में प्रतिद्वंद्वी चुनौती', 'تحدي المنافس بعد انتصار واحد', '再赢1场开启对手挑战', '再贏1場開啟對手挑戰', 'あと1勝でライバル戦', '1승 더 하면 라이벌 도전'],
    'Rival challenge ready!': ['Meydan okuma hazır!', '¡Desafío de rival listo!', 'Desafio de rival pronto!', 'Вызов соперника готов!', 'Rivalen-Duell bereit!', 'Défi du rival prêt !', 'Sfida del rivale pronta!', 'Wyzwanie rywala gotowe!', 'Tantangan rival siap!', 'Thách đấu đối thủ đã sẵn sàng!', 'ท้าดวลคู่ปรับได้แล้ว!', 'प्रतिद्वंद्वी चुनौती तैयार!', 'تحدي المنافس جاهز!', '对手挑战已开启！', '對手挑戰已開啟！', 'ライバル戦が解放！', '라이벌 도전 준비 완료!'],

    'Tap anywhere to stay': ['Kalmak için herhangi bir yere dokun', 'Toca en cualquier lugar para quedarte', 'Toque em qualquer lugar para ficar', 'Коснись экрана, чтобы остаться', 'Tippe irgendwo, um zu bleiben', 'Touche n’importe où pour rester', 'Tocca ovunque per restare', 'Dotknij gdziekolwiek, aby zostać', 'Ketuk di mana saja untuk tetap di sini', 'Chạm bất kỳ đâu để ở lại', 'แตะที่ใดก็ได้เพื่ออยู่ต่อ', 'रुकने के लिए कहीं भी टैप करो', 'المس أي مكان للبقاء', '点击任意处停留', '點擊任意處停留', 'どこかをタップで待機', '머무르려면 아무 곳이나 탭'],
    'Click anywhere to stay': ['Kalmak için herhangi bir yere tıkla', 'Haz clic en cualquier lugar para quedarte', 'Clique em qualquer lugar para ficar', 'Щёлкни где угодно, чтобы остаться', 'Klicke irgendwo, um zu bleiben', 'Clique n’importe où pour rester', 'Clicca ovunque per restare', 'Kliknij gdziekolwiek, aby zostać', 'Klik di mana saja untuk tetap di sini', 'Nhấp bất kỳ đâu để ở lại', 'คลิกที่ใดก็ได้เพื่ออยู่ต่อ', 'रुकने के लिए कहीं भी क्लिक करो', 'انقر في أي مكان للبقاء', '点击任意处停留', '點擊任意處停留', 'どこかをクリックで待機', '머무르려면 아무 곳이나 클릭'],

    'COME BACK TOMORROW': ['YARIN GEL', 'VUELVE MAÑANA', 'VOLTE AMANHÃ', 'ВОЗВРАЩАЙСЯ ЗАВТРА', 'KOMM MORGEN WIEDER', 'REVIENS DEMAIN', 'TORNA DOMANI', 'WRÓĆ JUTRO', 'KEMBALI BESOK', 'NGÀY MAI QUAY LẠI', 'พรุ่งนี้กลับมานะ', 'कल फिर आना', 'عُد غدًا', '明天再来', '明天再來', 'また明日', '내일 또 와'],
    'Daily reward waiting: your first win gives +{0} XP': ['Günlük ödül seni bekliyor: ilk galibiyetin +{0} XP', 'Recompensa diaria esperándote: tu primera victoria da +{0} XP', 'Recompensa diária à sua espera: a primeira vitória dá +{0} XP', 'Ежедневная награда ждёт: первая победа даст +{0} XP', 'Tagesbelohnung wartet: dein erster Sieg bringt +{0} XP', 'Récompense du jour : ta première victoire rapporte +{0} XP', 'Ricompensa giornaliera: la prima vittoria vale +{0} XP', 'Nagroda dzienna czeka: pierwsze zwycięstwo daje +{0} XP', 'Hadiah harian menunggu: kemenangan pertama memberi +{0} XP', 'Phần thưởng hằng ngày: trận thắng đầu tiên được +{0} XP', 'รางวัลประจำวันรออยู่: ชนะครั้งแรกได้ +{0} XP', 'रोज़ का इनाम तैयार: पहली जीत पर +{0} XP', 'مكافأة يومية بانتظارك: أول فوز يمنحك +{0} XP', '每日奖励等着你：首胜 +{0} XP', '每日獎勵等著你：首勝 +{0} XP', 'デイリー報酬：最初の勝利で +{0} XP', '일일 보상 대기 중: 첫 승리 시 +{0} XP'],
    'DAILY REWARD READY': ['GÜNLÜK ÖDÜL HAZIR', 'RECOMPENSA DIARIA LISTA', 'RECOMPENSA DIÁRIA PRONTA', 'ЕЖЕДНЕВНАЯ НАГРАДА ГОТОВА', 'TAGESBELOHNUNG BEREIT', 'RÉCOMPENSE DU JOUR PRÊTE', 'RICOMPENSA GIORNALIERA PRONTA', 'NAGRODA DZIENNA GOTOWA', 'HADIAH HARIAN SIAP', 'PHẦN THƯỞNG NGÀY ĐÃ SẴN SÀNG', 'รางวัลประจำวันพร้อมแล้ว', 'रोज़ का इनाम तैयार', 'المكافأة اليومية جاهزة', '每日奖励已就绪', '每日獎勵已就緒', 'デイリー報酬あり', '일일 보상 준비 완료'],
    'Win a fight today: +{0} XP': ['Bugün bir dövüş kazan: +{0} XP', 'Gana un combate hoy: +{0} XP', 'Vença uma luta hoje: +{0} XP', 'Победи сегодня: +{0} XP', 'Gewinne heute einen Kampf: +{0} XP', 'Gagne un combat aujourd’hui : +{0} XP', 'Vinci un duello oggi: +{0} XP', 'Wygraj dziś walkę: +{0} XP', 'Menangkan satu duel hari ini: +{0} XP', 'Thắng một trận hôm nay: +{0} XP', 'ชนะสักครั้งวันนี้: +{0} XP', 'आज एक लड़ाई जीतो: +{0} XP', 'اربح قتالًا اليوم: +{0} XP', '今天赢一场：+{0} XP', '今天贏一場：+{0} XP', '今日1勝で +{0} XP', '오늘 한 판 이기면 +{0} XP'],

    'CONTINUE JOURNEY': ['YOLCULUĞA DEVAM', 'CONTINUAR VIAJE', 'CONTINUAR JORNADA', 'ПРОДОЛЖИТЬ ПУТЬ', 'REISE FORTSETZEN', 'CONTINUER LE VOYAGE', 'CONTINUA IL VIAGGIO', 'KONTYNUUJ PODRÓŻ', 'LANJUTKAN PERJALANAN', 'TIẾP TỤC HÀNH TRÌNH', 'เดินทางต่อ', 'सफ़र जारी रखो', 'تابع الرحلة', '继续旅程', '繼續旅程', '旅を続ける', '여정 계속하기'],
    'Fight {0}/{1} · vs {2}': ['Dövüş {0}/{1} · rakip {2}', 'Combate {0}/{1} · contra {2}', 'Luta {0}/{1} · contra {2}', 'Бой {0}/{1} · против: {2}', 'Kampf {0}/{1} · gegen {2}', 'Combat {0}/{1} · contre {2}', 'Duello {0}/{1} · contro {2}', 'Walka {0}/{1} · z: {2}', 'Duel {0}/{1} · lawan {2}', 'Trận {0}/{1} · gặp {2}', 'ไฟต์ {0}/{1} · พบ {2}', 'लड़ाई {0}/{1} · सामने {2}', 'القتال {0}/{1} · ضد {2}', '第{0}/{1}战 · 对手 {2}', '第{0}/{1}戰 · 對手 {2}', '第{0}/{1}戦 · 相手 {2}', '{0}/{1}전 · 상대 {2}'],

    'The fight starts as soon as you turn it': ['Çevirdiğin anda dövüş başlar', 'El combate empieza en cuanto lo gires', 'A luta começa assim que você virar', 'Бой начнётся, как только повернёшь', 'Der Kampf beginnt, sobald du es drehst', 'Le combat commence dès que tu le tournes', 'Il duello inizia appena lo giri', 'Walka zacznie się, gdy tylko go obrócisz', 'Duel dimulai begitu kamu memutarnya', 'Trận đấu bắt đầu ngay khi bạn xoay ngang', 'การต่อสู้เริ่มทันทีที่หมุนจอ', 'घुमाते ही लड़ाई शुरू होगी', 'يبدأ القتال فور تدويره', '横过来就开打', '橫過來就開打', '横にするとすぐバトル開始', '돌리는 순간 싸움이 시작돼'],
    'Back': ['Geri', 'Atrás', 'Voltar', 'Назад', 'Zurück', 'Retour', 'Indietro', 'Wstecz', 'Kembali', 'Quay lại', 'กลับ', 'वापस', 'رجوع', '返回', '返回', '戻る', '뒤로'],
  };
  const IDX = {}; LANGS.forEach((l, i) => { IDX[l] = i; });
  const fill = (s, a) => String(s).replace(/\{(\d)\}/g, (m, k) => (a[k] != null ? String(a[k]) : m));
  ND.FIRST_TR = T; ND.FIRST_TR_LANGS = LANGS;
  ND.firstTr = (s, ...a) => {
    const lang = ND.i18n && ND.i18n.lang, i = IDX[lang], row = T[s];
    return fill(i != null && row && row[i] ? row[i] : s, a);
  };
})(window.ND = window.ND || {});
