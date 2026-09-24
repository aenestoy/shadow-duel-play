// Gölge Düellosu — Arcade merdiveni, gizli son patron, kilit açma/ilerleme (ND.save), antrenman + eğitim, metin tablosu (ND.STR)
(function (ND) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const nice = (n) => n[0] + n.slice(1).toLowerCase();
  const fmtTime = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const fmtNum = (n) => { if (ND.i18n) return ND.i18n.num(n); try { return Math.round(n).toLocaleString('tr-TR'); } catch (e) { return String(Math.round(n)); } };

  // ================================================================ METİNLER (çeviri için tek tablo)
  const STR = ND.STR = {
    menu: {
      brand: (nc, na) => `${nc} savaşçı, ${na} arena ve gizli bir usta. Gerçek zamanlı kılıç çarpışması, kılıç kilitlenmesi, savuşturma, denge kırma, ki teknikleri ve ragdoll fiziği.`,
      arcade: 'Arcade',
      arcadeDesc: 'Her ninjanın sekiz dövüşlük yolculuğu. Kaldığın rakipten devam et, karakterin sonunu ve Usta mührünü aç.',
      arcadeProg: (best, c, ct, a, at) => `${best ? 'Rekor ' + fmtNum(best) + ' · ' : ''}${c}/${ct} ninja · ${a}/${at} arena açık`,
      train: 'Antrenman',
      trainDesc: 'Kuklayla serbest çalış ya da adım adım öğren',
      trainFree: 'Serbest',
      trainTut: 'Eğitim',
      watchShort: 'Rastgele iki ninja, Efsane yapay zekâ',
      specialKey: 'Ki tekniği (ki dolu)',
      play: 'Oyna',
      playSub: (name, lv) => `${name} ile CPU’ya karşı · ${lv}`,
    },
    // İlk açılış: tek büyük OYNA düğmesi (menü sonraki açılışlarda)
    first: { play: 'Oyna', sub: 'Tek tıkla dövüşe gir', menu: 'Tüm modlar' },
    // Ödüllü reklam teklifleri (yalnız reklam ağı olan portallarda görünür)
    ads: {
      cont: 'Kaldığın yerden devam', contSub: 'Reklam izle · cezasız tekrar',
      trial: (name) => `${name} ile bir dövüş dene`, trialSub: 'Reklam izle',
      fail: 'Şu an reklam yok, biraz sonra yeniden dene',
    },
    // İlk dövüşte üç kısa ipucu (l: hafif tuşu/düğmesi, g: gard tuşu/düğmesi — HTML)
    coach: {
      attack: (l) => `${l} ile saldır`,
      guard: (l, g) => `${g} basılı tut: gard`,
      parry: (l, g) => `Darbe inmeden hemen önce ${g}: savuştur`,
    },
    sel: {
      title: { '2p': 'Ninjanı seç', cpu: 'Ninjanı seç', arcade: 'Arcade · Karakter yolculuğu', train: 'Antrenman · Ninjanı seç', tutorial: 'Eğitim · Ninjanı seç', tourney: 'Aylık Turnuva · Ninjanı seç', dan: 'Dan Sınavı · Ninjanı seç', rival: 'Meydan Okuma · Ninjanı seç' },
      who1: { '2p': '1. Oyuncu · A / D ile seç, F ile onayla', def: 'Sen · A / D ile seç, F ile onayla' },
      who2: { '2p': '2. Oyuncu · ← / → ile seç, K ile onayla', cpu: 'Rakip (CPU) · ← / → ile seç', train: 'Kukla · ← / → ile seç' },
      go: { def: 'Dövüşe başla', arcade: 'Arcade’e başla', train: 'Antrenmana başla', tutorial: 'Eğitime başla', tourney: 'Turnuvaya başla', dan: 'Sınava başla', rival: 'Meydan oku' },
      random: 'Rastgele',
      arena: 'Arena',
      locked: 'Kilitli',
      lockMsg: (name, hint) => `${name} kilitli · ${hint}`,
      keyHint: '<kbd>Enter</kbd> başlatır · <kbd>⌫</kbd> menüye döner',
      moves: 'Hareketler',
      movesOf: (name) => `${name} · Hareketler`,
      close: 'Kapat',
    },
    journey: {
      start: 'Yolculuğa başla', resume: (i, n) => `Devam et · ${i}/${n}`, ending: 'Sonu izle', replay: 'Yolculuğu yeniden oyna',
      badge: 'Usta mührü', completed: 'Yolculuk tamamlandı', progress: (i, n) => `${i}/${n} dövüş tamamlandı · İlerleme kayıtlı`,
      reward: 'Ödül: karakter sonu ve kalıcı Usta mührü', saved: 'Her galibiyette kaydedilir. Dövüşten çıkmak tekrar denemesi sayılır.',
      menu: (done, active) => `${done} yolculuk tamamlandı · ${active} devam ediyor`, clearReward: 'Usta mührü kazanıldı · Karakter sonu açıldı',
    },
    hint: {
      honor: (have, need) => `Onur ${fmtNum(Math.min(have, need))}/${fmtNum(need)} → Meydan okuma açılır`,
      ready: 'Meydan okumaya hazır!',
      arenaHonor: (have, need) => `${fmtNum(need)} onurda açılır (${fmtNum(Math.min(have, need))}/${fmtNum(need)})`,
      wins: (n, cur) => `Arcade’de ${n} dövüş kazan (${Math.min(cur, n)}/${n})`,
      clear: 'Arcade’i bir kez bitir',
      boss: 'Arcade’de son patronu yen',
      arena: 'Arcade’de bu arenada bir dövüş kazan',
    },
    // Onur (誉): tek ilerleme kaynağı (honor.js kuralları)
    honor: {
      name: 'Onur', k: '誉',
      plus: (n) => `+${fmtNum(n)}`,
      head: 'Onur',
      rows: { win: 'Galibiyet', loss: 'Katılım', rounds: 'Alınan raund', perfect: 'Mükemmel raund', rally: 'Karşılıklı seri', counter: 'Karşılık', parry: 'Savuşturma', rivalWin: 'Meydan okuma', arcadeClear: 'Arcade bitirildi' },
      total: (n) => `Onur: ${fmtNum(n)}`,
      next: (name, left) => `Bir sonraki ninja: ${name} — ${fmtNum(left)} onur kaldı`,
      bar: (have, need) => `Onur ${fmtNum(Math.min(have, need))}/${fmtNum(need)} → Meydan okuma açılır`,
      ready: (name) => `${name} meydan okuyor!`,
      readyGo: 'Kabul et',
      all: 'Tüm ninjalar açık',
      bonus: { arcadeClear: 'Arcade bitirildi', tourneyClear: 'Turnuva fethedildi', danPass: 'Dan sınavı geçildi', rivalWin: 'Meydan okuma kazanıldı', tutorial: 'Eğitim tamamlandı' },
      bonusToast: (n, what) => `+${fmtNum(n)} onur · ${what}`,
      // Onur Yolu paneli
      road: 'Onur Yolu',
      roadSub: 'Onur tek oyunculu her modda kazanılır. Eşiğe ulaşınca o ninja sana meydan okur; düelloyu kazanırsan ninja senin.',
      earnHead: 'Onur nereden gelir',
      // H = ND.HONOR (sayılar kurallardan gelir)
      earn: (H) => [
        ['CPU’ya karşı', `Galibiyet: Çırak ${H.win[0]} · Usta ${H.win[1]} · Efsane ${H.win[2]}`],
        ['Arcade', `Galibiyet zorluğa göre · Şura ${H.win[3]} · bitirince +${H.arcadeClear}`],
        ['Turnuva ve Dan', `Galibiyetler ×${String(H.modeMul.tourney).replace('.', ',')} · turnuvayı bitir +${H.tourneyClear} · her Dan sınavı +${H.danPass(1)} ve üstü`],
        ['Yenilsen de', `Katılım ${H.loss} · alınan her raund ${H.roundWon}`],
        ['İyi oyun', `Savuşturma, karşılık, seri, mükemmel raund: maç başına en çok +${H.styleCap}`],
      ],
      rivalsHead: 'Rakipler',
      arenasHead: 'Arenalar',
      open: 'Açık',
      castle: 'Arcade’de Şura’yı yen',
      you: (n) => `Onurun: ${fmtNum(n)}`,
    },
    // Meydan okuma: kilitli ninjayla düello (kazanınca açılır)
    rival: {
      k: '挑',
      stage: 'Meydan okuma',
      selTitle: (name) => `${name} meydan okuyor · Ninjanı seç`,
      lvHp: (lv, p) => (p === 100 ? lv : `${lv} · rakip canı %${p}`),
      accept: 'Meydan okumayı kabul et',
      acceptSub: (name) => `Kazanırsan ${name} senin`,
      quit: 'Vazgeç',
      hud: 'MEYDAN OKUMA',
      winTitle: (name) => `${name} aramıza katıldı!`,
      winSub: (name) => `${name} artık seçim ekranında. Hemen dene!`,
      tryNew: (name) => `${name} ile oyna`,
      lossTitle: 'Meydan okuma sürüyor',
      lossSub: (name, p) => `${name} bu sefer kazandı. Kaybetmek bir şey kaybettirmez; bir sonraki denemede %${p} canla başlar.`,
      lossSubMin: (name) => `${name} bu sefer kazandı. Kaybetmek bir şey kaybettirmez; yeniden dene.`,
      retry: 'Yeniden meydan oku',
      reveal: 'Yeni ninja',
      toastReady: (name) => `${name} sana meydan okuyor!`,
      // rakibin açılış sözü (oyuncu kendi cevap havuzundan yanıt verir)
      lines: {
        hana: 'Onurunu duydum, çarşıda herkes senden söz ediyor! Dansıma ayak uydurursan seninle gelirim!',
        tetsu: 'Adın kulağıma geldi. Beni yenersen naginatam senin safında savaşır.',
        ren: 'Hah! Sonunda biri beni çağırdı! Kazanırsan seninleyim, kaybedersen kahkahamı dinlersin!',
        kage: 'Seni bir süredir izliyorum. Gölgemi yakalarsan senin olurum.',
        tora: 'Av olmadığını kanıtla. Zincirimden kurtulursan yanında yürürüm.',
        jin: 'Onurun yüreğinden geliyorsa asam bunu anlar. Gel, seni sınayayım.',
        mai: 'Sahneme davetlisin. Beni alkışlatırsan dansım senin olur.',
        tsubame: 'Uzaktan izledim; iyisin. Okumdan kaçabilirsen yayım seninle.',
      },
    },
    toast: {
      newChar: (name) => `Yeni karakter açıldı: ${name}`,
      newArena: (name) => `Yeni arena açıldı: ${name}`,
      newBest: (s) => `Yeni rekor: ${fmtNum(s)} puan`,
      lesson: (t) => `Ders tamam: ${t}`,
      tutDone: 'Eğitim tamamlandı!',
      charK: '解', bestK: '記',
      perf: 'Performans için grafik düşürüldü', perfK: '軽',
    },
    vs: {
      stage: (i, n) => `Dövüş ${i} / ${n}`,
      boss: 'Son dövüş',
      go: 'Dövüş!',
      quit: 'Arcade’den çık',
      keys: '<kbd>Enter</kbd> / <kbd>F</kbd> başlatır · <kbd>⌫</kbd> çıkar',
      unknown: '?',
    },
    hud: { you: 'SEN', cpu: 'CPU', dummy: 'KUKLA', stage: (i, n) => `${i}/${n}`, boss: 'SON PATRON', inf: '∞', lockSolo: 'F / K tuşuna hızlıca bas!', lockDuo: 'Hafif ya da ağır tuşuna hızlıca bas!' },
    end: {
      rematch: 'Rövanş', change: 'Karakter değiştir', menu: 'Ana menü',
      winTitle: 'Zafer senin',
      winSub: (i, n, pts) => `Dövüş ${i}/${n} tamamlandı · +${fmtNum(pts)} puan`,
      next: 'Sonraki dövüş',
      bossNext: 'Sona geç',
      lossTitle: 'Yenildin',
      lossSub: (name) => `${name} bu sefer üstün geldi. Yeniden dene.`,
      retry: 'Tekrar dene',
      quit: 'Arcade’den çık',
    },
    ending: {
      head: 'Son',
      rows: { fights: 'Dövüş', time: 'Toplam süre', retries: 'Tekrar', perfect: 'Mükemmel raund', score: 'Puan', best: 'Rekor' },
      newBest: 'Yeni rekor!',
      menu: 'Ana menü',
      again: 'Yeniden oyna',
      unlocked: 'Açılanlar',
      fightPts: 'Dövüş puanları',
      bonus: 'Bitiriş bonusu',
    },
    // Puan sistemi (tek oyunculu: CPU + Arcade)
    score: {
      hud: 'PUAN',
      rows: { hit: 'Vuruş', combo: 'Kombo', counter: 'Karşılık', defense: 'Savunma', pressure: 'Baskı', special: 'Ki tekniği', round: 'Galibiyet', perfect: 'Mükemmel', hp: 'Kalan can', time: 'Süre bonusu' },
      total: 'Maç puanı',
      diff: (name, m) => `${name} ×${String(m).replace('.', ',')} dahil`,
      best: (s) => `En iyin: ${fmtNum(s)}`,
      newBest: 'Yeni rekor!',
      arcadeTotal: (s) => `Arcade toplamı: ${fmtNum(s)}`,
      lossNote: (s, pen) => `Bu deneme sayılmaz · Arcade toplamı ${fmtNum(s)} · her tekrar −${fmtNum(pen)}`,
      clearBonus: (c, n) => `+${fmtNum(c)}${n ? ' · tek kredi +' + fmtNum(n) : ''}`,
      lossCpu: 'Yenilgi · tabloya yalnız galibiyetler girer',
      cpuBoardHint: 'Efsane zorlukta kazanılan maçlar sıralamaya girer',
    },
    // Sıralama tablosu
    lb: {
      menu: 'Sıralama',
      menuDesc: 'Arcade ve Efsane rekorları',
      title: 'Sıralama',
      back: 'Geri',
      boards: { arcade: 'Arcade', cpu_efsane: 'Efsane CPU' },
      boardDesc: { arcade: 'Bitirilen Arcade koşusunun toplam puanı', cpu_efsane: 'Efsane CPU’ya karşı kazanılan tek maçın puanı' },
      all: 'Tümü',
      status: { loading: 'Yükleniyor…', online: 'Çevrimiçi tablo', readonly: 'Çevrimiçi tablo · yalnızca görüntüleme', local: 'Yerel tablo', error: 'Hata · yerel tablo', offline: 'Çevrimdışı · yerel tablo' },
      empty: 'Henüz skor yok. İlk sen ol!',
      loadErr: 'Tablo yüklenemedi.',
      you: 'Sen', youTag: 'sen', player: 'Oyuncu',
      nick: 'Takma ad', nickPh: 'Takma adın', nickSave: 'Kaydet', nickEdit: 'Değiştir',
      nickAsk: 'Yerel tablo için takma ad:',
      saving: 'Kaydediliyor…',
      savedOnline: (r) => `Çevrimiçi sıralama: #${r}`,
      savedOnlineNoRank: 'Çevrimiçi tabloya kaydedildi',
      savedOnlineGap: (r, g) => `Çevrimiçi sıralama: #${r} · ilk 10’a ${g} puan`,
      // çevrimiçi gönderim olmadıysa neden (skor her durumda yerel tabloda)
      reason: {
        needName: 'Çevrimiçi tabloya girmek için bir takma ad seç',
        offline: 'Bağlantı yok — skor saklandı, bağlanınca gönderilecek',
        rate: 'Çok sık gönderim — skor birazdan gönderilecek',
        daily: 'Günlük gönderim sınırı doldu — skor yalnızca yerel tabloda',
        week: 'Ay bitti — skor yeni aya sayılmaz',
        invalid: 'Skor geçersiz',
      },
      nickErr: {
        nick_length: 'Takma ad 3–16 karakter olmalı',
        nick_chars: 'Yalnız harf, rakam, boşluk ve _ . - kullan (en az bir harf)',
        nick_bad: 'Bu takma ad uygun değil, başka bir ad dene',
        rate_limited: 'Biraz bekleyip yeniden dene',
      },
      nickErrDef: 'Takma ad kaydedilemedi',
      nickAskOnline: 'Çevrimiçi tablo için takma ad:',
      savedLocal: (r) => (r ? `Yerel tabloda #${r}` : 'Yerel tabloya kaydedildi'),
      rejected: 'Skorun kaydedilemedi — yalnızca yerel tabloda',
      // CrazyGames hesabıyla girmiş oyuncu: skor bu cihazda (çevrimiçi hesap sıralaması henüz yok)
      savedLocalAccount: (r) => (r ? `Bu cihazda #${r} · hesaplar için çevrimiçi sıralama yakında` : 'Bu cihaza kaydedildi · hesaplar için çevrimiçi sıralama yakında'),
      quota: 'Çevrimiçi tablo dolu — skor yalnızca yerel tabloda',
      open: 'Sıralama',
      keys: '<kbd>←</kbd> <kbd>→</kbd> tablo · <kbd>↑</kbd> <kbd>↓</kbd> ninja · <kbd>⌫</kbd> geri',
      k: '番付',
    },
    // Rekabet katmanı (番付): Aylık Turnuva, Dan Sınavı, Şampiyonlar Salonu (banzuke.js)
    bz: {
      back: 'Geri', toMenu: 'Ana menü', you: 'Sen', youTag: 'sen', newBest: 'Yeni rekor!', seeResult: 'Sonucu gör',
      resetIn: 'Sıfırlanmaya',
      // kalan süre: gün (g) · saat (s) · dakika (d) · saniye (sn)
      left: (ms) => { const t = Math.floor(ms / 1000), d = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60; return d ? `${d}g ${hh}s ${mm}d` : hh ? `${hh}s ${mm}d` : `${mm}d ${ss}sn`; },
      leftShort: (ms) => { const t = Math.floor(ms / 60000), d = Math.floor(t / 1440), hh = Math.floor((t % 1440) / 60), mm = t % 60; return d ? `${d}g ${hh}s` : hh ? `${hh}s ${mm}d` : `${mm}d`; },
      // turnuva dönemi = takvim ayı: weekName(ay 1–12, yıl) → "Eylül 2026"
      weekName: (m, y) => `${['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][m - 1] || m} ${y}`,
      monthName: (m) => ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][m - 1] || String(m),
      rank: (r) => (r <= 0 ? 'Rütbesiz' : r <= 10 ? `${11 - r}. Kyu` : `${r - 10}. Dan`),
      fightOf: (i, n) => `Dövüş ${i}/${n}`,
      hpBonus: (p) => `Rakip canı +%${p}`,
      mirrorOpp: 'Ayna · senin ninjan',
      suddenSub: 'Tek raund · ilk düşen kaybeder',
      rows: { fights: 'Galibiyet', time: 'Süre', fightPts: 'Dövüş puanları', stage: 'Basamak bonusu', clear: 'Bitiriş bonusu', total: 'Turnuva puanı', weekBest: 'Bu ayki en iyin' },
      // Kural değiştiriciler (n: ad, d: açıklama)
      mods: {
        rally2x: { n: 'Seri Ateşi', d: 'Karşılık vuruşlarının hasarı ×2' },
        fullKi: { n: 'Dolu Ki', d: 'Her raunda dolu ki ile başlanır' },
        sudden: { n: 'Ani Ölüm', d: 'Tek raund; iki taraf da yarım canla başlar' },
        mirror: { n: 'Ayna', d: 'Rakip senin ninjan' },
        parryOnly: { n: 'Yalnız Karşılık', d: 'Normal vuruşlar %25 hasar verir; karşılıklar ×1,5' },
        posture2x: { n: 'Kırık Denge', d: 'Denge hasarı ×2: gardlar çabuk kırılır' },
        shuriken3x: { n: 'Shuriken Yağmuru', d: 'Üç kat shuriken' },
        kiRush: { n: 'Ki Seli', d: 'Ki iki kat hızlı dolar' },
        glass: { n: 'Cam Kılıç', d: 'Tüm hasar ×1,5' },
      },
      menu: {
        tour: 'Aylık Turnuva', dan: 'Dan Sınavı', hall: 'Şampiyonlar Salonu',
        tourRank: (p, left) => `Bu ay: #${p} · sıfırlanmaya ${left}`,
        tourBest: (b, left) => `En iyin ${b} · sıfırlanmaya ${left}`,
        tourNew: (left) => `Herkese aynı 8 dövüş · sıfırlanmaya ${left}`,
        danRank: (name, next) => (next ? `Rütben: ${name} · sıradaki: ${next}` : `Rütben: ${name} · zirvedesin`),
        danNew: '10. Kyu’dan 10. Dan’a 20 sınav',
        hallRank: (p) => `Bu ay #${p} · rekorlar`,
        hallDesc: 'Ayın ilk 10’u ve rekorlar',
        nick: (n) => (n ? `Takma ad: ${n}` : 'Takma ad seç'),
      },
      t: {
        title: 'Aylık Turnuva', head: 'Turnuva',
        runNote: (s, st) => `Turnuva toplamı: ${fmtNum(s)} (her galibiyet +${fmtNum(st)} dahil)`,
        lossSub: (name, won) => `${name} turnuvanı bitirdi · ${won} galibiyet`,
        lossNote: (s) => `Bu dövüş sayılmaz · turnuva puanın ${fmtNum(s)}`,
        quit: 'Turnuvayı bitir',
        myBest: (b, a) => `Bu ayki en iyin: ${b} puan · ${a} deneme`,
        noTry: 'Bu ay henüz denemen yok.',
        place: (p, t) => (t ? `#${p} / ${t}` : `#${p}`),
        rules: (n, clear, stage) => `${n} dövüş; herkes için aynı rakipler, arenalar ve kurallar. Yenilince deneme biter; deneme sınırsız, en iyi denemen sayılır. Her galibiyet +${stage}, hepsini yenmek +${clear}.`,
        start: 'Ninjanı seç ve başla', again: 'Yeniden dene', go: 'Turnuvaya gir',
        clearTitle: 'Turnuva fethedildi', overTitle: 'Deneme bitti',
        savedToast: (s) => `Turnuva puanın kaydedildi: ${s}`,
      },
      d: {
        title: 'Dan Sınavı', head: 'Dan sınavı',
        sub: 'Her sınavı geç, rütben yükselsin. Rütben tablolarda adının yanında görünür.',
        trialOf: (n) => `${n} sınavı`,
        runNote: (i, n) => `Sınav: ${i}/${n} dövüş kazanıldı`,
        lossSub: (name) => `${name} sınavı durdurdu.`,
        lossNote: 'Sınav geçilemedi',
        quit: 'Sınavdan çık',
        yourRank: 'Rütben', bestWas: (n) => `En yüksek: ${n}`, ladder: 'Rütbe basamakları',
        nextTrial: (n) => `Sıradaki: ${n} sınavı`,
        fights: (n) => `${n} dövüş`,
        bossLast: 'Son dövüş: Şura',
        strikes: (left, max) => `Hak: ${left}/${max} · ${max} başarısız sınavda rütben bir basamak düşer`,
        safe: 'Bu rütbede başarısız sınav rütbeni düşürmez.',
        maxed: 'Zirvedesin: 10. Dan', maxedSub: 'Adın Dan tablosunda en üstte.',
        start: 'Ninjanı seç ve sınava gir', next: 'Sıradaki sınav', go: 'Sınava gir',
        promoted: (n) => `Terfi: ${n}`, demoted: (n) => `Rütbe düştü: ${n}`, failed: 'Sınav geçilemedi',
        promotedSub: (a, b) => `${a} → ${b}`, demotedSub: 'Üç başarısız sınav. Yeniden yüksel!', tryAgain: 'Yeniden dene; rütben korunuyor.',
        toast: (n) => `Yeni rütbe: ${n}`, leftToast: 'Sınav yarıda bırakıldı: başarısız sayıldı',
      },
      hall: {
        title: 'Şampiyonlar Salonu',
        tabs: { week: { k: '月', n: 'Bu Ay' }, alltime: { k: '歴', n: 'Tüm Zamanlar' }, archive: { k: '殿', n: 'Şampiyonlar' }, chars: { k: '忍', n: 'Ninjalar' }, dan: { k: '段', n: 'Dan' } },
        desc: { alltime: 'Aylık turnuvanın tüm zamanların en iyileri', archive: 'Biten her ayın ilk 10’u buraya kalıcı olarak kazınır', chars: 'Her ninjanın rekor sahibi · ninjaya dokun, ilk 20’yi gör', dan: 'En yüksek rütbeler' },
        loading: 'Yükleniyor…', error: 'Tablo yüklenemedi.', retry: 'Yeniden dene',
        empty: 'Henüz kimse yok. İlk sen ol!', emptyDan: 'Henüz rütbeli kimse yok.', emptyArchive: 'Henüz biten bir ay yok. İlk şampiyonlar bu ay bitince kazınacak.',
        anon: 'Oyuncu',
        meTop: (p, s) => `Sen: #${p} · ${s} puan · ilk 10’dasın!`,
        meGap: (p, g, s) => `Sen: #${p} · ${s} puan · ilk 10’a ${g} puan`,
        meNone: 'Bu ay henüz puanın yok.',
        meDan: (p, n) => `Sen: #${p} · ${n}`,
        meDanLocal: (n) => `Rütben: ${n}`, meNoDan: 'Henüz rütben yok. İlk sınav: 10. Kyu.',
        noRecord: 'Rekor yok', allNinjas: 'Tüm ninjalar',
        pending: (n) => `${n} kayıt gönderilmeyi bekliyor`,
        classic: 'Arcade · Efsane tabloları',
      },
      // Aylık turnuva ödülleri: kalıcı unvan (ilk 3) ve Şampiyon renkleri (1.) — leaderboard.js / banzuke.js / arcade.js
      ttl: {
        champ: 'Aylık Şampiyon', finalist: 'Finalist',
        reward: 'Her ayın ilk 3’ü kalıcı bir unvan kazanır. Şampiyon, kullandığı ninjanın özel Şampiyon renklerini de kazanır. Unvan için o ay en az 5 oyuncu gerekir.',
        hall: 'Ayın ilk 3’ü kalıcı unvan kazanır (en az 5 oyuncu) · şampiyona özel Şampiyon renkleri',
        colors: 'Şampiyon renkleri',
        how: 'Bu ninjayla bir Aylık Turnuva kazan',
        unlocked: (name) => `Aylık Şampiyon! ${name} için Şampiyon renkleri açıldı`,
        newTitle: (t) => `Yeni unvan: ${t}`,
      },
    },
    train: {
      title: 'Antrenman', tutTitle: 'Eğitim',
      dummy: 'Kukla',
      beh: { idle: 'Dur', guard: 'Gard tut', attack: 'Saldır', counter: 'Karşılık ver' },
      infHp: 'Sonsuz can', fullKi: 'Dolu ki',
      reset: 'Konumu sıfırla',
      hide: 'Gizle', show: 'Panel',
      moves: 'Hareket listesi',
      lessons: 'Dersler',
      lessonOf: (i, n) => `Ders ${i}/${n}`,
      done: 'Eğitim bitti! Kuklayı istediğin gibi ayarlayıp serbestçe çalışabilirsin.',
      progress: (a, b) => `${a}/${b}`,
      keysHelp: '<kbd>1</kbd>–<kbd>4</kbd> kukla · <kbd>⌫</kbd> sıfırla · <kbd>H</kbd> panel',
      specialFallback: { kanji: '影斬り', name: 'Gölge Kesiği', desc: 'Rakibin içinden geçen yıldırım hızında bir kesik.', tip: '' },
      kiFull: 'ki dolu',
      counterTip: 'Karşı koyma',
    },
    // Hareket listesi (P1 tuşları)
    moves: [
      ['<kbd>A</kbd><kbd>D</kbd>', 'Yürü', 'iki kez dokun: atılma'],
      ['<kbd>W</kbd>', 'Zıpla', ''],
      ['<kbd>F</kbd><kbd>F</kbd><kbd>F</kbd>', 'Hafif ×3 kombo', 'üçüncü vuruş iter'],
      ['<kbd>G</kbd>', 'Ağır kesik', 'yere serer'],
      ['<kbd>R</kbd>', 'Tekme', 'gardı zorlar, dengeyi doldurur'],
      ['<kbd>T</kbd>', 'Shuriken', ''],
      ['<kbd>Shift</kbd>', 'Atılma', 'sol Shift'],
      ['<kbd>Shift</kbd>›<kbd>F</kbd>', 'Atılarak kesik', ''],
      ['<kbd>W</kbd>›<kbd>F</kbd>', 'Hava kesiği', ''],
      ['<kbd>W</kbd>›<kbd>G</kbd>', 'Dalış', 'havadayken ağır'],
      ['<kbd>S</kbd>', 'Gard', 'basılı tut'],
      ['<kbd>S</kbd>!', 'Savuşturma', 'darbe inmeden hemen önce bas'],
      ['<kbd>F</kbd>', 'Düz karşılık', 'gard/savuşturma sonrası'],
      ['İleri+<kbd>F</kbd>', 'Süpürme', 'karşılık · bacağa'],
      ['Geri+<kbd>F</kbd>', 'Arkadan dönüş', 'karşılık · yanından geç'],
      ['<kbd>G</kbd>', 'Ağır karşılık', 'karşılık · yere serer'],
      ['Seri', 'Karşılıklı seri', 'karşılığı karşıla, yeniden karşılık ver; kendi 3. karşılığın bitiriş'],
      ['<kbd>F</kbd>/<kbd>G</kbd>!!', 'Kılıç kilidi', 'kilitte hızlıca bas, rakibi it'],
    ],
    // Dokunmatik arayüz metinleri (ND.touch.active iken klavye metinlerinin yerine geçer). Düğme adı SALDIR (btn.light),
    // kilit ipucu, yardım, not, dokunmatik hareket listesi (movesTouch) ve ders metinleri (lessonsTouch) i18n.js'te
    // (touchSource): basit dokunmatik düzenle birlikte orada yazıldı; buradaki eski sürümleri kaldırıldı.
    touch: {
      btn: { heavy: 'AĞIR', kick: 'TEKME', guard: 'GARD', dodge: 'ATIL', throw: 'SHUR.', special: 'KI', up: 'ZIPLA', down: 'GARD', stick: 'Yön çubuğu' },
      replaySkip: 'atlamak için dokun',
      rotateTitle: 'Ekranı yan çevir',
      rotateText: 'Gölge Düellosu yatay ekranda oynanır. Menüleri dik ekranda da kullanabilirsin.',
      need2p: 'Klavye / gamepad gerekir',
      need2pToast: 'İki oyuncu için klavye ya da gamepad bağla',
      hints: 'İpuçları',
      pause: 'Duraklat',
      sel: { who1: 'Sen · ninjana dokun', who2: 'Rakip (CPU) · dokunarak seç', who2train: 'Kukla · dokunarak seç' },
      keysHelp: '',
    },
    moveSpecialTouch: '<i class="tb ki">KI</i>',
    // Hareket listesi etiketleri (ND.MOVELIST[..].tags → görünen ad)
    moveTags: {
      normal: 'Temel', command: 'Komut', string: 'Seri', launcher: 'Fırlatıcı', juggle: 'Havada', air: 'Hava', dash: 'Atılma',
      strike: 'Darbe', counter: 'Karşılık', catch: 'Yakalama', feint: 'Aldatma', guardCrush: 'Gard ezer', knockdown: 'Yere serer',
      kiCancel: 'Ki iptali', special: 'Ki tekniği', throw: 'Atış',
    },
    lessons: [
      { id: 'walk', t: 'Yürü', d: '<kbd>A</kbd> / <kbd>D</kbd> ile ileri geri yürü.' },
      { id: 'combo', t: 'Üçlü kombo', d: '<kbd>F</kbd> <kbd>F</kbd> <kbd>F</kbd> ile üç hafif kesiği zincirle ve kuklaya vur.' },
      { id: 'heavy', t: 'Ağır kesik', d: '<kbd>G</kbd> ile ağır kesik vur. Yavaştır ama yere serer.' },
      { id: 'gbreak', t: 'Gardı kır', d: 'Kukla gard tutuyor. <kbd>R</kbd> ile tekme atarak denge çubuğunu doldur ve gardını kır.' },
      { id: 'block', t: 'Gard', d: 'Kukla saldırıyor. <kbd>S</kbd> tuşunu basılı tutarak bir kesiği karşıla.' },
      { id: 'parry', t: 'Savuşturma', d: 'Darbe inmeden hemen önce <kbd>S</kbd>’ye bas. Mavi halka küçülünce tam zamanıdır.' },
      { id: 'counter', t: 'Karşılık', d: 'Gard ya da savuşturmanın hemen ardından <kbd>F</kbd>: karşı kesik. İleri/geri + <kbd>F</kbd> ya da <kbd>G</kbd> de dene.' },
      { id: 'rally', t: 'Karşılıklı seri', d: 'Kukla da karşılık veriyor. Onun vuruşunu savuşturup karşılık ver. O da savuşturup vurunca yeniden karşılık ver: kendi 2× serini yap.' },
      { id: 'special', t: 'Ki tekniği', d: 'Ki barın dolu. <kbd>E</kbd> ile {sp} kullan.' },
    ],
    // Dövüş öncesi karşılıklı sözler: open = önce konuşan, reply = cevap, boss = son patrona
    talk: {
      akane: {
        open: ['Kılıcım kızıl, niyetim temiz. Onurunla karşıma çık.', 'Önce selam veririm, sonra keserim. Adil olan budur.', 'Bu düello şerefimiz için. Geri çekilmek yok.'],
        reply: ['Onurlu bir rakip… Kılıcımı hak ediyorsun.', 'Sözlerin keskin. Bakalım çeliğin de öyle mi.', 'Kızıl kılıç konuştuğunda sözler susar.'],
        boss: 'Ustalarımın kanı senin kılıcında, Şura. Bugün o borç kapanıyor.',
      },
      aoi: {
        open: ['Rüzgâr acele etmez. Ben de etmem.', 'Nefesini dinle. Birazdan duyacağın son ses rüzgâr olacak.', 'Bambular eğilir ama kırılmaz. Sen hangisisin?'],
        reply: ['Sakin ol. Öfke kılıcı ağırlaştırır.', 'Rüzgârı yakalayamazsın, yalnızca hissedersin.', 'Peki. Yaprak yere düşünce başlayalım.'],
        boss: 'Fırtınanın merkezinde bile sessizlik vardır. Senin içinde yalnızca gürültü var, Şura.',
      },
      kuro: {
        open: ['Dağ yerinden oynamaz. Sen oynayacaksın.', 'Konuşma. Kılıcını kaldır.', 'Küçüksün. Çabuk biter.'],
        reply: ['Hıh. Gel bakalım.', 'Çok konuşuyorsun.', 'Nodachim uzun. Sabrım kısa.'],
        boss: 'Şura. Çok bekledim. Artık konuşmak yok.',
      },
      yuki: {
        open: ['Kar sessiz yağar. Ben de sessiz vururum.', 'Tilki tuzağa düşmez; tuzağı kurar.', 'Üşüdün mü? Birazdan hiçbir şey hissetmeyeceksin.'],
        reply: ['Sıcakkanlısın. Bu seni yavaşlatır.', 'Ne kadar gürültülü… Kar bile senden utanıyor.', 'Gözünü kırpma. Kaçırırsın.'],
        boss: 'Herkes senden korkuyor, Şura. Ben yalnızca üşüyorum.',
      },
      hana: {
        open: ['Dans edelim mi? Ama önce ben başlarım!', 'Kiraz çiçekleri yere düşmeden bitiririz, söz!', 'İki tantō, bir gülümseme. Hangisinden korkarsın?'],
        reply: ['Ay, ne ciddisin! Biraz gülümse, daha güzel düşersin.', 'Yakala beni, yakalayabilirsen!', 'Tamam, tamam! Ama sonra ağlamak yok.'],
        boss: 'Sen hiç gülmez misin, Şura? Hadi, son dansımız olsun!',
      },
      tetsu: {
        open: ['Görev beni buraya getirdi. Yolumdan çekil ya da düş.', 'Zırhım yüz savaş gördü. Sen yüz birincisin.', 'Disiplin cesaretten önce gelir. Göstereyim.'],
        reply: ['Saygısızlık. Bunu düzelteceğim.', 'Sözlerin zırhımı delemez.', 'Hazır ol. Naginatam uyarmaz.'],
        boss: 'Efendimin kalesini yaktın, Şura. Görevimi bugün tamamlayacağım.',
      },
      ren: {
        open: ['Hah! Sonunda eğlence! Kemiklerin sağlam mı?', 'Maskem mi korkuttu? Asıl yüzümü görmek istemezsin!', 'Kafa mı, gard mı? Ben ikisini de kırarım!'],
        reply: ['Laf çok, kavga yok! Hadi!', 'Heh, sevdim seni. Yine de pataklayacağım.', 'Tekmemi hiç gördün mü? Şimdi göreceksin!'],
        boss: 'Demek asıl oni sensin, ha? Bakalım kimin boynuzu sağlam!',
      },
      kage: {
        open: ['Beni gördüğünü sanıyorsun. Gördüğün yalnızca gölgem.', 'Işık ne kadar parlaksa gölge o kadar derindir.', 'Adın yazıldı. Ben yalnızca okuyorum.'],
        reply: ['Konuşma. Gölgeler duyar.', 'Arkana bakma. Zaten oradayım.', 'Sesin çok. Sessizlik daha çabuk öldürür.'],
        boss: 'Gölgeler efendi tanımaz, Şura. Seni de yutacaklar.',
      },
      shura: {
        open: ['Yedi kılıç kırdın. Sekizincisi benim ve o seni kıracak.', 'Kanın beni çağırdı. Buraya kadar tırmanman iyi; düşüşün daha da görkemli olacak.', 'Ben yolun sonuyum. Diz çök.'],
        reply: ['Zayıflık. Kokusunu buradan alıyorum.', 'Sen yalnızca bir basamaksın.', 'Diz çök ya da düş.'],
        boss: 'Aynadaki iblis… İkimizden biri fazla.',
      },
    },
    // Özel eşleşmeler: sıra sabittir (ilk satır önce söylenir), taraf konuşana göre belirlenir
    pairs: {
      'akane|aoi': [['akane', 'Aoi! Yarım kalan düellomuzu bitirme zamanı.'], ['aoi', 'Rüzgâr hep aynı ateşe eser, Akane. Başla.']],
      'kuro|tetsu': [['kuro', 'Demir kabuk. İçi boş mu, bakalım.'], ['tetsu', 'Dağ bile disipline boyun eğer, Kuro.']],
      'hana|yuki': [['yuki', 'Çiçekler karda solar, Hana.'], ['hana', 'O zaman ben de karı eritirim, Yuki!']],
      'kage|ren': [['ren', 'Gölge oyunları bana sökmez! Çık ortaya!'], ['kage', 'Zaten ortadayım, oni. Sen bakmayı bilmiyorsun.']],
      'akane|ren': [['akane', 'Maskenin ardına saklanan onursuzdur.'], ['ren', 'Onur mu? Karnımı doyurmuyor ki!']],
      'aoi|yuki': [['aoi', 'Soğuk rüzgâr da rüzgârdır, Yuki.'], ['yuki', 'Ama kar, rüzgâr dinince de kalır.']],
    },
    endings: {
      akane: ['Şura’nın kılıcı toprağa düştüğünde tapınağın çanları kendiliğinden çaldı.', 'Akane kızıl kılıcını sildi ve ustalarının mezarı başında eğildi: borç ödendi.', 'Artık yolu intikam değil; yeni çıraklara onuru öğretmek.'],
      aoi: ['Şura yere düştüğünde fırtına da dindi; bulutlar yıllardır ilk kez aralandı.', 'Aoi kılıcını kınına sürdü ve bambu ormanına döndü.', 'Ardında yalnızca ıslık çalan bir rüzgâr kaldı.'],
      kuro: ['Kuro, Şura’nın kırık maskesini dağın zirvesine gömdü.', 'Tek kelime etmedi. Hasır şapkasını indirdi ve karların içinde kayboldu.', 'Köylüler o kış dağdan tek bir haydudun bile inmediğini anlatır.'],
      yuki: ['Şura’nın son nefesi soğuk havada buharlaşıp kayboldu.', 'Yuki atkısını düzeltti ve karda iz bırakmadan uzaklaştı.', 'O günden sonra zirvede yalnızca bir tilkinin gölgesini görenler oldu.'],
      hana: ['Şura’nın maskesi yere düştüğünde Hana yanına bir kiraz dalı bıraktı.', 'Çarşı o gece fenerlerle doldu; en büyük alkışı çatılarda dans eden bir kunoichi aldı.', 'Nereye gittiğini kimse bilmiyor. Geriye yalnızca uçuşan pembe yapraklar kaldı.'],
      tetsu: ['Tetsu, kale çatısında Şura’nın kılıcını dizine vurup ikiye böldü.', 'Efendisinin sancağını yeniden göndere çekti; rüzgâr onu gururla dalgalandırdı.', 'Görev tamamlandı. Ama bir samurayın görevi hiç bitmez.'],
      ren: ['Ren, Şura’nın kırık maskesini kendi maskesinin yanına astı. İki oni, tek kazanan.', 'O gece köyde şarkılar söylendi; en yüksek kahkaha her zamanki gibi ondandı.', 'Sabah olduğunda çoktan yola çıkmıştı. Bir sonraki kavgaya.'],
      kage: ['Şura düştüğünde Kage’nin gölgesi onu sessizce örttü.', 'Ne bir iz kaldı ne bir ses; yalnızca ay ışığında uzanan fazladan bir gölge.', 'Belki hep oradaydı. Belki de hiç var olmadı.'],
      shura: ['Kale çatısında yalnızca biri ayakta kaldı: aynı maskeyi takan, ama daha karanlık olanı.', 'Şura artık rakip aramıyor. Rakipler onu arıyor.'],
      def: ['Son usta da düştü. Gölgelerin yolu artık senin.', 'Kılıcını kınına sür; efsane şimdi başlıyor.'],
    },
  };

  // Veri özniteliklerini metin tablosundan doldur: data-s="menu.arcade"
  STR.apply = (root = document) => {
    root.querySelectorAll('[data-s]').forEach((el) => {
      const v = el.dataset.s.split('.').reduce((o, k) => (o ? o[k] : undefined), STR);
      if (typeof v === 'string') el.textContent = v;
    });
    // data-sh: tablodaki (güvenilir) HTML'i olduğu gibi yerleştir
    root.querySelectorAll('[data-sh]').forEach((el) => {
      const v = el.dataset.sh.split('.').reduce((o, k) => (o ? o[k] : undefined), STR);
      if (typeof v === 'string') el.innerHTML = v;
    });
  };
  // Dokunmatik arayüz açıkken dokunmatik metni, değilse klavye metnini döndür
  const touchOn = () => !!(ND.touch && ND.touch.active);
  STR.pickT = (kb, tch) => (touchOn() && tch != null ? tch : kb);
  // ND.MOVELIST girdisi → HTML. input: 'Shift › F', '→ + F', { kb, touch } ya da hazır HTML (< içeren, güvenilir tablo).
  // Klavyede tuşlar <kbd>, dokunmatikte düğme adı; tanınmayan sözcükler çeviriden geçer.
  const KEY_BTN = { F: 'light', G: 'heavy', R: 'kick', T: 'throw', S: 'guard', SHIFT: 'dodge', E: 'special', W: 'up' };
  function fmtInput(inp) {
    if (inp && typeof inp === 'object') inp = touchOn() && inp.touch != null ? inp.touch : inp.kb;
    const s = String(inp == null ? '' : inp);
    if (s.includes('<')) return s;
    const TB = (STR.touch && STR.touch.btn) || {}, t = touchOn();
    return s.split(/(\s*[+›>,]\s*|\s+)/).map((tok) => {
      if (!tok) return '';
      if (/^\s*[+›>,]\s*$|^\s+$/.test(tok)) return esc(tok.trim() ? ' ' + tok.trim() + ' ' : ' ');
      const k = tok.toUpperCase();
      if (KEY_BTN[k] || /^[A-Z]$/.test(k) || /^[←→↑↓]$/.test(tok)) {
        if (t && KEY_BTN[k] && TB[KEY_BTN[k]]) return `<i class="tb">${esc(TB[KEY_BTN[k]])}</i>`;
        if (t && /^[AD←→]$/.test(k)) return `<i class="tb">${k === 'A' || k === '←' ? '◀' : '▶'}</i>`;
        return `<kbd>${esc(tok)}</kbd>`;
      }
      return esc(ND.i18n ? ND.i18n.t(tok) : tok);
    }).join('');
  }

  // ================================================================ GİZLİ SON PATRON
  const rim = 'rgba(232,86,96,.5)', rimDim = 'rgba(150,40,52,.32)';
  if (!ND.CHARS.some((c) => c.id === 'shura')) {
    ND.CHARS.push({
      id: 'shura', name: 'SHURA', kanji: '修羅', title: 'Kanlı Usta', hidden: true, boss: true,
      desc: 'Yolunu kanla çizen iblis usta. Uzun nodachi, yıkıcı darbeler, neredeyse kusursuz savuşturma.',
      weapon: 'Nodachi', type: 'nodachi', blade: 118, handle: 30, spd: 1.02, dmg: 1.1, hp: 108, walk: 1.02, ammo: 3, acc: 'oni',
      post: 1.2, kickMul: 1.25, stunMul: 0.72,
      stats: { hiz: 4, guc: 5, menzil: 4, can: 5 },
      col: { rim, rimDim, skin: '#8e6a5e', cloth: '#120a0c', clothHi: '#271317', clothDark: '#0a0507', wrap: '#361419', wrapDark: '#200b0f', accent: '#c3162b', accentDark: '#5a0811', ui: '#e3263c', mask: '#141012' },
      alt: { rim: 'rgba(200,196,220,.5)', rimDim: 'rgba(120,118,140,.3)', skin: '#8e6a5e', cloth: '#0e0e12', clothHi: '#1d1d25', clothDark: '#08080b', wrap: '#2b2b35', wrapDark: '#1a1a21', accent: '#d8d3c4', accentDark: '#6e6a5e', ui: '#e6e0cf', mask: '#6d0c15' },
    });
  }
  const BOSS = 'shura';

  // ================================================================ KAYIT (tek kalıcılık modülü)
  // Tüm localStorage erişimi burada; ileride bir platform SDK'sı ile değiştirilebilir.
  const KEY = 'golge-duellosu', PKEY = 'golge-duellosu-progress';
  const mem = {};
  const ls = (() => { try { const s = window.localStorage, k = '__nd_probe'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e) { return null; } })();
  const rawGet = (k) => { try { if (ls) { const v = ls.getItem(k); if (v != null) return v; } } catch (e) { /* yok */ } return k in mem ? mem[k] : null; };
  const rawSet = (k, v) => { mem[k] = v; try { if (ls) ls.setItem(k, v); } catch (e) { /* kota/erişim yok */ } };
  const readJSON = (k, def) => { try { const s = rawGet(k); const v = s ? JSON.parse(s) : null; return v && typeof v === 'object' ? v : def; } catch (e) { return def; } };
  // Portal copy of the progress (CrazyGames data module follows a signed-in player across devices; 1 MB total).
  // localStorage stays the working copy; the portal copy is written a moment after each commit and read once at boot.
  const PORTAL_SAVE = { crazygames: 1, yandex: 1 };
  const MIRROR_MAX = 400000;
  let mirrorT = 0;
  const mirror = (k, v) => {
    const P = ND.portal;
    if (!P || !PORTAL_SAVE[P.name] || !P.sdk || typeof v !== 'string' || v.length > MIRROR_MAX) return;
    clearTimeout(mirrorT);
    mirrorT = setTimeout(() => { try { P.save(k, v); } catch (e) { /* yok */ } }, 500);
  };

  const START_CHARS = ['akane', 'aoi', 'kuro', 'yuki'];
  const START_ARENAS = ['temple', 'rain', 'snow'];
  // Honor opens rival challenges. Three distinct journeys open Shura's challenge; one clear opens the castle.
  const HONOR = ND.HONOR;
  const J = ND.JOURNEY;
  const BOSS_ARENA = 'castle';
  const bossArena = () => (ND.ARENAS.some((a) => a.id === BOSS_ARENA) ? BOSS_ARENA : ND.ARENAS[ND.ARENAS.length - 1].id);

  // SCORE_V: puan modeli sürümü. 2 = tek puan modeli (ND.score); eski ölçekteki rekorlar sıfırlanır (farklı ölçek)
  const SCORE_V = 2;
  const journeyNumber = (v, hi = 1e9) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.floor(v))) : 0;
  // Persist stable IDs only: roster order and live fighter objects must never enter a save.
  function cleanJourney(r, id) {
    if (!r || typeof r !== 'object' || !Array.isArray(r.fights) || r.fights.length !== 8) return null;
    const validChar = (x) => ND.CHARS.some((c) => c.id === x), seen = new Set();
    if (!validChar(id)) return null;
    const authored = r.version === J.version ? J.route(id) : null;
    const fights = [];
    for (let k = 0; k < r.fights.length; k++) {
      const f = r.fights[k], boss = k === 7;
      if (!f || !validChar(f.opp) || !ND.ARENAS.some((a) => a.id === f.arena) ||
        (authored ? f.opp !== authored[k].opp || f.arena !== authored[k].arena :
          (boss ? f.opp !== BOSS : f.opp === BOSS || f.opp === id || seen.has(f.opp)))) return null;
      seen.add(f.opp);
      fights.push(authored ? authored[k] : { opp: f.opp, arena: boss ? bossArena() : f.arena, level: boss ? 3 : k < 2 ? 0 : k < 5 ? 1 : 2, ...(boss ? { boss: true, alt: id === BOSS } : {}) });
    }
    const i = journeyNumber(r.i, 8), out = { version: authored ? J.version : 1, fights, i, won: i, done: i === 8 && r.done === true,
      needsRetry: i < 8 && !!r.needsRetry, started: i < 8 && !!r.started, contUsed: !!r.contUsed, ranked: !!r.ranked,
      fightPts: Array.isArray(r.fightPts) ? r.fightPts.slice(0, i).map((v) => journeyNumber(v)) : [],
      unlocked: Array.isArray(r.unlocked) ? r.unlocked.filter((e) => e && ((e.kind === 'char' && validChar(e.id)) || (e.kind === 'arena' && ND.ARENAS.some((a) => a.id === e.id)))).slice(0, 30).map((e) => ({ kind: e.kind, id: e.id })) : [] };
    for (const key of ['time', 'score', 'retries', 'perfect', 'rounds', 'rw', 'hits', 'honor']) out[key] = journeyNumber(r[key]);
    out.time = typeof r.time === 'number' && Number.isFinite(r.time) ? Math.max(0, Math.min(1e9, r.time)) : 0;
    return out;
  }
  function normalizeJourneys(value, bestBy) {
    const runs = {}, cleared = {}, stars = {}, mastered = {}, looks = {};
    for (const ch of ND.CHARS) {
      const r = value && value.runs && cleanJourney(value.runs[ch.id], ch.id);
      if (r) runs[ch.id] = r;
      // Existing earned endings remain earned when upgrading an older profile.
      if ((value && value.cleared && value.cleared[ch.id]) || (bestBy && bestBy[ch.id] > 0) || (r && r.done)) cleared[ch.id] = true;
      stars[ch.id] = J.mask(value && value.stars && value.stars[ch.id]);
      if (cleared[ch.id] && J.count(stars[ch.id]) >= J.masteryNeed && value && value.mastered && value.mastered[ch.id] === true) {
        mastered[ch.id] = true;
        if (value.looks && value.looks[ch.id] === true) looks[ch.id] = true;
      }
    }
    return { runs, cleared, stars, mastered, looks };
  }
  function normalize(p) {
    const d = { v: 1, chars: START_CHARS.slice(), arenas: START_ARENAS.slice(), wins: 0, clears: 0, bossWins: 0, best: 0, bestBy: {}, bestTime: 0, tutorial: false, lessons: [],
      scoreV: SCORE_V, cpuBest: {}, lb: { name: '', boards: {}, last: {}, out: [], champ: [], champSeen: [], champUse: {}, title: null }, bz: { t: {}, dan: { r: 0, best: 0, strikes: 0, tries: 0, passes: 0 } },
      hon: { t: 0, f: {} }, journey: { runs: {}, cleared: {}, stars: {}, mastered: {}, looks: {} }, coached: false };
    if (!p || typeof p !== 'object') return d;
    const o = Object.assign(d, p);
    // Saves from before the coach moved to the journey: anyone past the first screen has already had it.
    if (typeof p.coached !== 'boolean') o.coached = !!p.firstDone;
    for (const k of ['chars', 'arenas', 'lessons']) if (!Array.isArray(o[k])) o[k] = d[k].slice();
    START_CHARS.forEach((c) => { if (!o.chars.includes(c)) o.chars.push(c); });
    START_ARENAS.forEach((a) => { if (!o.arenas.includes(a)) o.arenas.push(a); });
    if (!o.bestBy || typeof o.bestBy !== 'object') o.bestBy = {};
    if (p.scoreV !== SCORE_V) { o.best = 0; o.bestBy = {}; o.bestTime = 0; o.scoreV = SCORE_V; } // eski kayıt: yeni ölçekle karşılaştırılamaz
    if (!o.cpuBest || typeof o.cpuBest !== 'object') o.cpuBest = {};
    o.journey = normalizeJourneys(p.journey, p.bestBy);
    // yerel sıralama tablosu (leaderboard.js 'local' bağdaştırıcısı): { name, boards: { pano: [ {n,s,c,t,d,v} ] }, last }
    if (!o.lb || typeof o.lb !== 'object') o.lb = { name: '', boards: {}, last: {} };
    if (typeof o.lb.name !== 'string') o.lb.name = '';
    if (!o.lb.boards || typeof o.lb.boards !== 'object') o.lb.boards = {};
    if (!o.lb.last || typeof o.lb.last !== 'object') o.lb.last = {};
    if (!Array.isArray(o.lb.out)) o.lb.out = []; // çevrimiçi gönderilmeyi bekleyen skorlar (leaderboard.js giden kutusu)
    // Aylık turnuva: kendi unvanım ve Şampiyon renkleri açık ninjalar (leaderboard.js yalnız sunucu cevabından yazar),
    // duyurusu yapılmış olanlar, hangi ninjada Şampiyon renklerinin seçili olduğu
    const cids = (a) => (Array.isArray(a) ? [...new Set(a.filter((x) => ND.CHARS.some((c) => c.id === x)))] : []);
    o.lb.champ = cids(o.lb.champ); o.lb.champSeen = cids(o.lb.champSeen);
    if (!o.lb.champUse || typeof o.lb.champUse !== 'object' || Array.isArray(o.lb.champUse)) o.lb.champUse = {};
    for (const k of Object.keys(o.lb.champUse)) if (o.lb.champUse[k] !== true || !ND.CHARS.some((c) => c.id === k)) delete o.lb.champUse[k];
    if (o.lb.title != null && (typeof o.lb.title !== 'object' || ![1, 2, 3].includes(o.lb.title.place))) o.lb.title = null;
    // rekabet katmanı (banzuke.js): { t: { '2026-W39': { best, char, att, won, date } }, dan: { r, best, strikes, tries, passes } }
    if (!o.bz || typeof o.bz !== 'object') o.bz = {};
    if (!o.bz.t || typeof o.bz.t !== 'object') o.bz.t = {};
    // turnuva dönemleri: ay ('2026-09'); eski haftalık kayıtlar ('2026-W39') da korunur. En çok 60 dönem.
    const wkRe = /^\d{4}-(W\d{2}|0[1-9]|1[0-2])$/, tk = Object.keys(o.bz.t).filter((k) => wkRe.test(k)).sort();
    Object.keys(o.bz.t).forEach((k) => { if (!wkRe.test(k) || tk.indexOf(k) < tk.length - 60 || !o.bz.t[k] || typeof o.bz.t[k] !== 'object') delete o.bz.t[k]; });
    const dn = o.bz.dan && typeof o.bz.dan === 'object' ? o.bz.dan : {};
    const di = (v, hi) => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
    o.bz.dan = { r: di(dn.r, 20), best: Math.max(di(dn.best, 20), di(dn.r, 20)), strikes: di(dn.strikes, 2), tries: di(dn.tries, 1e7), passes: di(dn.passes, 1e7) };
    // Onur: { t: toplam (harcanmaz), f: { ninja: kaybedilen meydan okuma } }. Onurdan önceki kayıt bir kez çevrilir:
    // eski kurallarla hak edilmiş ninjalar açılır (hiçbir şey geri alınmaz), yapılanlar bugünkü değerlerle onura sayılır.
    if (!p.hon || typeof p.hon !== 'object') {
      if (HONOR) {
        for (const id in HONOR.OLD_WINS) if (o.wins >= HONOR.OLD_WINS[id] && ND.CHARS.some((c) => c.id === id) && !o.chars.includes(id)) o.chars.push(id);
        if (o.clears > 0 && !o.chars.includes('kage')) o.chars.push('kage');
      }
      o.hon = { t: HONOR ? HONOR.migrate(o) : 0, f: {}, mig: 1 };
    }
    const h = o.hon;
    h.t = typeof h.t === 'number' && isFinite(h.t) ? Math.max(0, Math.min(1e7, Math.round(h.t))) : 0;
    if (!h.f || typeof h.f !== 'object') h.f = {};
    for (const k of Object.keys(h.f)) { const v = h.f[k]; if (!HONOR || (!HONOR.rival(k) && k !== BOSS) || typeof v !== 'number' || v <= 0) delete h.f[k]; else h.f[k] = Math.min(99, Math.round(v)); }
    // eşiği geçilmiş arenalar her zaman açık (kendini onaran kural)
    if (HONOR) for (const a of HONOR.ARENAS) if (h.t >= a.need && !o.arenas.includes(a.id) && ND.ARENAS.some((x) => x.id === a.id)) o.arenas.push(a.id);
    return o;
  }

  const save = ND.save = {
    available: !!ls,
    // --- ayarlar (ses, müzik, seçimler…)
    settings() { return readJSON(KEY, {}); },
    saveSettings(o) { rawSet(KEY, JSON.stringify(o || {})); },
    // --- ilerleme
    _p: null,
    get p() {
      if (!this._p) {
        this._p = normalize(readJSON(PKEY, null));
        // eski kayıt onura çevrildi: bir kez yerelde yaz (zaman damgası aynı kalır, portal kopyası daha yeniyse o kazanır)
        if (this._p.hon.mig) { delete this._p.hon.mig; rawSet(PKEY, JSON.stringify(this._p)); }
      }
      return this._p;
    },
    commit() { if (this._batch) { this._dirty = true; return; } this.p.ts = Date.now(); const v = JSON.stringify(this.p); rawSet(PKEY, v); mirror(PKEY, v); },
    transaction(fn) {
      this._batch = (this._batch || 0) + 1;
      try { return fn(); }
      finally { this._batch--; if (!this._batch && this._dirty) { this._dirty = false; this.commit(); } }
    },
    // Boot: adopt the portal copy when it is newer (another device), otherwise upload ours
    syncPortal() {
      const P = ND.portal;
      if (!P || !P.ready) return;
      P.ready.then(() => (P.sdk && PORTAL_SAVE[P.name] ? P.load(PKEY) : undefined)).then((remote) => {
        if (!P.sdk || !PORTAL_SAVE[P.name]) return;
        let r = null;
        try { r = typeof remote === 'string' ? JSON.parse(remote) : remote && typeof remote === 'object' ? remote : null; } catch (e) { r = null; }
        if (r && typeof r === 'object' && (r.ts || 0) > (this.p.ts || 0)) {
          rawSet(PKEY, JSON.stringify(r)); this._p = null;
          if (ND.arcade && ND.arcade.G) ND.arcade.refreshMenu();
          if (ND.game && ND.game.onSaveAdopted) ND.game.onSaveAdopted();
        } else if (!r) this.commit();
      }).catch(() => { /* portal save unavailable: local only */ });
    },
    reset() { this._p = normalize(null); this.commit(); },
    unlockAll() { this.p.chars = ND.CHARS.map((c) => c.id); this.p.arenas = ND.ARENAS.map((a) => a.id); this.commit(); },
    isCharUnlocked(id) { return this.p.chars.includes(id); },
    isArenaUnlocked(id) { return this.p.arenas.includes(id); },
    useLegacy(id) { return !!(this.p.journey.mastered[id] && this.p.journey.looks[id]); },
    toggleLegacy(id) { if (!this.p.journey.mastered[id]) return; this.p.journey.looks[id] = !this.useLegacy(id); this.commit(); },
    // Şampiyon renkleri: bu ninjayla bir Aylık Turnuva kazanılmış mı (sunucunun cevabı, yerelde önbellek)
    champOk(id) { const c = this.p.lb.champ; return Array.isArray(c) && c.includes(id); },
    // Görünüş: false = asıl renkler, true = Miras renkleri (yolculuk ustalığı), 'champ' = Şampiyon renkleri
    look(id) { const u = this.p.lb.champUse; return this.champOk(id) && !!u && u[id] === true ? 'champ' : this.useLegacy(id); },
    lookOptions(id) { const a = [false]; if (this.p.journey.mastered[id]) a.push(true); if (this.champOk(id)) a.push('champ'); return a; },
    setLook(id, v) {
      const L = this.p.lb;
      if (!L.champUse || typeof L.champUse !== 'object') L.champUse = {};
      if (v === 'champ') { if (!this.champOk(id)) return; L.champUse[id] = true; }
      else { delete L.champUse[id]; if (this.p.journey.mastered[id]) this.p.journey.looks[id] = v === true; }
      this.commit();
    },
    distinctClears() { return Object.keys(this.p.journey.cleared).filter((id) => id !== BOSS).length; },
    unlock(kind, id) {
      const list = kind === 'char' ? this.p.chars : this.p.arenas;
      if (!id || list.includes(id)) return null;
      list.push(id); this.commit();
      return { kind, id };
    },
    // --- onur (honor.js): toplam, meydan okumalar, arena eşikleri
    get honor() { return this.p.hon.t; },
    // Onur ekle → yeni açılan meydan okumalar ({kind:'ready'}) ve arenalar ({kind:'arena'})
    addHonor(n) {
      n = Math.max(0, Math.round(n || 0));
      if (!n || !HONOR) return [];
      const h = this.p.hon, t0 = h.t, ev = [];
      h.t = Math.min(1e7, t0 + n);
      for (const r of HONOR.RIVALS) if (t0 < r.need && h.t >= r.need && !this.isCharUnlocked(r.id) && ND.CHARS.some((c) => c.id === r.id)) ev.push({ kind: 'ready', id: r.id });
      for (const a of HONOR.ARENAS) if (h.t >= a.need && ND.ARENAS.some((x) => x.id === a.id)) { const e = this.unlock('arena', a.id); if (e) ev.push(e); }
      this.commit();
      return ev;
    },
    // Bir ninjanın meydan okuma durumu (kilitli sıradaki ninjalar); kuralda yoksa null
    rivalInfo(id) {
      if (id === BOSS) {
        const have = this.distinctClears();
        return { id, r: { id, lv: 3, hp: 1, arena: bossArena(), need: J.shuraNeed }, need: J.shuraNeed, have,
          ready: have >= J.shuraNeed, unlocked: this.isCharUnlocked(id), fails: this.p.hon.f[id] | 0, hp: 1 };
      }
      const r = HONOR && HONOR.rival(id);
      if (!r || !ND.CHARS.some((c) => c.id === id)) return null;
      const t = this.p.hon.t, fails = this.p.hon.f[id] | 0;
      return { id, r, need: r.need, have: t, ready: t >= r.need, unlocked: this.isCharUnlocked(id), fails, hp: HONOR.rivalHp(r, fails) };
    },
    // Sıradaki kilitli rakip (sırayla); hepsi açıksa null
    nextRival() { if (!HONOR) return null; const r = HONOR.RIVALS.find((x) => !this.isCharUnlocked(x.id) && ND.CHARS.some((c) => c.id === x.id)); return r ? this.rivalInfo(r.id) : null; },
    readyRivals() { return HONOR ? [this.rivalInfo(BOSS), ...HONOR.RIVALS.map((r) => this.rivalInfo(r.id))].filter((x) => x && x.ready && !x.unlocked) : []; },
    rivalLost(id) { const f = this.p.hon.f; f[id] = Math.min(99, (f[id] | 0) + 1); this.commit(); },
    rivalWon(id) { delete this.p.hon.f[id]; const e = this.unlock('char', id); return e ? [e] : []; },
    charHint(id) {
      if (id === BOSS) return this.rivalInfo(id).ready ? STR.hint.ready : J.text().shura;
      const ri = this.rivalInfo(id);
      if (!ri) return STR.hint.clear;
      return ri.ready ? STR.hint.ready : STR.hint.honor(ri.have, ri.need);
    },
    arenaHint(id) {
      if (id === bossArena()) return STR.hint.clear;
      const a = HONOR && HONOR.ARENAS.find((x) => x.id === id);
      return a ? STR.hint.arenaHonor(this.p.hon.t, a.need) : STR.hint.arena;
    },
    // Arcade dövüşü kazanıldı (sayaç; açılışlar artık onurla)
    recordWin() {
      this.p.wins++;
      this.commit();
      return [];
    },
    // Completing an authored route opens the castle; legacy routes retain their Shura reward.
    recordClear(charId, score, time, legacy = false) {
      const p = this.p, ev = [];
      p.clears++; p.bossWins++;
      // Existing routes keep their promised reward. New journeys earn a separate challenge.
      if (legacy) ev.push(this.unlock('char', BOSS));
      ev.push(this.unlock('arena', bossArena()));
      const newBest = score > (p.best || 0);
      if (newBest) p.best = score;
      if (score > (p.bestBy[charId] || 0)) p.bestBy[charId] = score;
      if (!p.bestTime || time < p.bestTime) p.bestTime = Math.round(time);
      this.commit();
      return { ev: ev.filter(Boolean), newBest };
    },
    // CPU maçı: zorluk başına kişisel rekor
    recordCpu(level, score) {
      const p = this.p, k = String(level), prev = p.cpuBest[k] || 0;
      const newBest = score > prev;
      if (newBest) { p.cpuBest[k] = Math.round(score); this.commit(); }
      return { newBest, best: Math.max(prev, score), prev };
    },
    // yerel sıralama verisi (leaderboard.js yazar, sonra commit())
    get lb() { return this.p.lb; },
    // Eğitim: her ders ilk kez bitince sessizce onur, eğitimin tamamı bir kez bonus
    lessonDone(id) { if (!this.p.lessons.includes(id)) { this.p.lessons.push(id); this.commit(); if (HONOR) toastEvents(this.addHonor(HONOR.lesson)); } },
    tutorialDone() { if (!this.p.tutorial) { this.p.tutorial = true; this.commit(); if (HONOR) honor.bonus('tutorial', HONOR.tutorial); } },
  };

  // ================================================================ BİLDİRİM (toast)
  // Kuyruklu: aynı anda en çok TOAST_MAX bildirim görünür, her yenisi TOAST_GAP ms arayla alt alta girer
  const TOAST_MAX = 3, TOAST_GAP = 700, TOAST_LIFE = 3400;
  const toastQ = [];
  let toastBusy = false;
  function pumpToasts() {
    const box = $('toasts');
    if (!box || toastBusy || !toastQ.length || box.querySelectorAll('.toast:not(.out)').length >= TOAST_MAX) return;
    const [text, kanji, color] = toastQ.shift();
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<b style="${color ? 'color:' + color : ''}">${esc(kanji || '解')}</b><span>${esc(text)}</span>`;
    box.appendChild(el);
    const au = ND.audio;
    if (au && au.ready) { au.tone({ freq: 880, dur: 0.9, gain: 0.07, send: 0.6, type: 'triangle' }); au.tone({ freq: 1320, dur: 1.1, gain: 0.06, send: 0.7, delay: 0.1, type: 'sine' }); }
    toastBusy = true;
    setTimeout(() => { toastBusy = false; pumpToasts(); }, TOAST_GAP);
    setTimeout(() => { el.classList.add('out'); pumpToasts(); }, TOAST_LIFE);
    setTimeout(() => { el.remove(); pumpToasts(); }, TOAST_LIFE + 450);
  }
  ND.toast = (text, kanji, color) => {
    if (toastQ.some((q) => q[0] === text)) return; // aynı bildirim kuyrukta zaten var
    toastQ.push([text, kanji, color]); pumpToasts();
  };
  function toastEvents(ev) {
    // sıralama/aralık kuyrukta; burada yalnızca kısa bir ilk gecikme
    setTimeout(() => ev.forEach((e) => {
      if (e.kind === 'char') { const ch = ND.CHARS.find((c) => c.id === e.id); if (ch) ND.toast(STR.toast.newChar(ch.name), ch.kanji, ch.col.ui); }
      else if (e.kind === 'ready') { const ch = ND.CHARS.find((c) => c.id === e.id); if (ch) ND.toast(STR.rival.toastReady(ch.name), STR.rival.k, ch.col.ui); }
      else { const a = ND.ARENAS.find((x) => x.id === e.id); if (a) ND.toast(STR.toast.newArena(a.name), a.kanji); }
    }), 350);
  }
  ND.toastEvents = toastEvents;

  // ================================================================ ONUR (誉): kazanma + ekranlar
  // Kurallar honor.js'te (ND.HONOR). game.js her tek oyunculu maçın sonunda award() çağırır; koşu bonusları
  // (Arcade/turnuva bitirme, Dan sınavı, meydan okuma, eğitim) bonus() ile gelir.
  const honor = ND.honor = {
    last: null,
    // Maç sonu: c = { mode, won, level, roundsWon, parries, counters, rallies, perfects } → { total, rows, ev }
    award(c) {
      if (!HONOR) return null;
      const cur = c.mode === 'arcade' && ND.arcade && ND.arcade.run && ND.arcade.run.cur;
      if (cur && cur.honorResult) { this.last = cur.honorResult; return this.last; }
      const r = HONOR.match(c);
      r.level = c.level;
      r.ev = save.addHonor(r.total);
      this.last = r;
      if (cur) cur.honorResult = r;
      toastEvents(r.ev);
      return r;
    },
    // Koşu bonusu. row: true → son maç dökümüne satır olarak eklenir (bildirim yerine)
    bonus(key, n, row) {
      if (!HONOR || !(n > 0)) return [];
      const ev = save.addHonor(n);
      if (row && this.last) { this.last.rows.push([key, n]); this.last.total += n; }
      else ND.toast(STR.honor.bonusToast(n, STR.honor.bonus[key] || key), STR.honor.k);
      toastEvents(ev);
      return ev;
    },
    // Sıradaki hedef: { kind: 'ready'|'next'|'all', ri, ch, pct, left }
    goal() {
      if (!HONOR) return { kind: 'all', pct: 1, left: 0 };
      const rd = save.readyRivals()[0];
      if (rd) return { kind: 'ready', ri: rd, ch: ND.CHARS.find((c) => c.id === rd.id), pct: 1, left: 0 };
      const nx = save.nextRival();
      if (!nx) return { kind: 'all', pct: 1, left: 0 };
      return { kind: 'next', ri: nx, ch: ND.CHARS.find((c) => c.id === nx.id), pct: this.pct(nx.id), left: nx.need - nx.have };
    },
    // Bir rakibin çubuğu: bir önceki eşikten bu eşiğe
    pct(id) {
      if (id === BOSS) return Math.min(1, save.distinctClears() / J.shuraNeed);
      const i = HONOR.RIVALS.findIndex((r) => r.id === id), r = HONOR.RIVALS[i], from = i > 0 ? HONOR.RIVALS[i - 1].need : 0, t = save.honor;
      return Math.max(0, Math.min(1, (t - from) / Math.max(1, r.need - from)));
    },
    bar(pct) { return `<i class="hbar" style="--p:${(pct * 100).toFixed(1)}%"></i>`; },
    // Maç sonu dökümü (#endHonor). r null → gizle. o.challenge: hazır meydan okuma için düğme göster
    render(box, r, o = {}) {
      if (!box) return;
      box.textContent = ''; box.hidden = !r;
      if (!r) return;
      const S = STR.honor, lvName = (lv) => (ND.AI_LEVELS[lv] || ND.AI_LEVELS[1]).name;
      const rows = r.rows.map(([k, v, n]) => {
        let lab = S.rows[k] || k;
        if (k === 'win') lab += ' · ' + lvName(r.level);
        else if (n > 1) lab += ' ×' + n;
        return `<span><small>${esc(lab)}</small><b>${esc(S.plus(v))}</b></span>`;
      }).join('');
      const g = this.goal();
      let foot = '';
      if (g.kind === 'ready') {
        foot = `<p class="hn-next rdy"><b class="k" style="color:${g.ch.col.ui}">${esc(g.ch.kanji)}</b><span>${esc(S.ready(g.ch.name))}</span>` +
          (o.challenge ? `<button class="btn primary hn-go" type="button" data-rival="${esc(g.ch.id)}">${esc(STR.rival.accept)}</button>` : '') + '</p>';
      } else if (g.kind === 'next') {
        foot = `<p class="hn-next"><b class="k">${esc(g.ch.kanji)}</b><span>${esc(S.next(g.ch.name, g.left))}</span>${this.bar(g.pct)}</p>`;
      } else foot = `<p class="hn-next"><span>${esc(S.all)}</span></p>`;
      box.innerHTML = `<div class="hn-head"><b class="k" aria-hidden="true">${esc(S.k)}</b><small>${esc(S.head)}</small><strong>${esc(S.plus(r.total))}</strong><em>${esc(S.total(save.honor))}</em></div><div class="hn-rows">${rows}</div>${foot}`;
      const go = box.querySelector('[data-rival]');
      if (go) go.onclick = () => rival.offer(go.dataset.rival);
    },
    // Ana menü şeridi (#mhonor): sıradaki ninja ve kalan onur, ya da hazır meydan okuma
    refreshStrip() {
      const el = $('mhonor'); if (!el) return;
      el.hidden = !HONOR;
      if (!HONOR) return;
      const S = STR.honor, g = this.goal();
      el.classList.toggle('rdy', g.kind === 'ready');
      let txt;
      if (g.kind === 'ready') txt = `<span class="t">${esc(S.ready(g.ch.name))}</span><span class="go">${esc(S.readyGo)}</span>`;
      else if (g.kind === 'next') txt = `<span class="t">${esc(S.next(g.ch.name, g.left))}</span>${this.bar(g.pct)}`;
      else txt = `<span class="t">${esc(S.all)}</span>`;
      const kj = g.ch ? `<b class="k" style="${g.kind === 'ready' ? 'color:' + g.ch.col.ui : ''}">${esc(g.ch.kanji)}</b>` : `<b class="k">${esc(S.k)}</b>`;
      el.innerHTML = `${kj}<span class="hs"><small>${esc(S.total(save.honor))}</small>${txt}</span>`;
    },
    // Onur Yolu paneli (#honorOv): rakipler, arenalar, onur kaynakları
    showRoad() {
      const ov = $('honorOv'); if (!ov || !HONOR) return;
      const S = STR.honor, t = save.honor;
      const riv = [...HONOR.RIVALS, { id: BOSS }].map((r) => save.rivalInfo(r.id)).filter(Boolean).map((ri) => {
        const ch = ND.CHARS.find((c) => c.id === ri.id);
        const st = ri.unlocked ? `<em class="ok">${esc(S.open)}</em>`
          : ri.ready ? `<button class="btn primary" type="button" data-rival="${esc(ri.id)}">${esc(STR.rival.accept)}</button>`
          : `<em>${esc(ri.id === BOSS ? J.text().shura : STR.hint.honor(t, ri.need))}</em>${this.bar(this.pct(ri.id))}`;
        return `<li class="${ri.unlocked ? 'ok' : ri.ready ? 'rdy' : ''}"><b class="k" style="color:${ri.unlocked || ri.ready ? ch.col.ui : 'inherit'}">${esc(ch.kanji)}</b><span class="n">${esc(ch.name)}<small>${esc(ri.id === BOSS ? Math.min(ri.have, ri.need) + '/' + ri.need : fmtNum(ri.need))}</small></span><span class="s">${st}</span></li>`;
      }).join('');
      const ar = HONOR.ARENAS.filter((a) => ND.ARENAS.some((x) => x.id === a.id)).map((a) => {
        const A = ND.ARENAS.find((x) => x.id === a.id), ok = save.isArenaUnlocked(a.id);
        return `<li class="${ok ? 'ok' : ''}"><b class="k">${esc(A.kanji)}</b><span class="n">${esc(A.name)}<small>${esc(fmtNum(a.need))}</small></span><span class="s">${ok ? `<em class="ok">${esc(S.open)}</em>` : `<em>${esc(STR.hint.arenaHonor(t, a.need))}</em>`}</span></li>`;
      }).join('');
      const ca = ND.ARENAS.find((x) => x.id === bossArena()), cok = ca && save.isArenaUnlocked(ca.id);
      const castle = ca ? `<li class="${cok ? 'ok' : ''}"><b class="k">${esc(ca.kanji)}</b><span class="n">${esc(ca.name)}</span><span class="s">${cok ? `<em class="ok">${esc(S.open)}</em>` : `<em>${esc(STR.hint.clear)}</em>`}</span></li>` : '';
      const earn = (typeof S.earn === 'function' ? S.earn(HONOR) : []).map(([a, b], i) => `<dt>${esc(a)}</dt><dd>${esc(i === 1 ? b.replace(/Shura|Şura|Шура/g, J.text().rival) : b)}</dd>`).join('');
      $('honorIn').innerHTML = `<div class="hr-head"><b class="k" aria-hidden="true">${esc(S.k)}</b><div><h2>${esc(S.road)}</h2><p>${esc(S.you(t))}</p></div><button class="btn" type="button" id="honorClose">${esc(STR.sel.close)}</button></div>` +
        `<p class="hr-sub">${esc(S.roadSub)}</p><div class="hr-cols"><section><h3>${esc(S.rivalsHead)}</h3><ul class="hr-list">${riv}</ul></section>` +
        `<section><h3>${esc(S.arenasHead)}</h3><ul class="hr-list">${ar}${castle}</ul><h3>${esc(S.earnHead)}</h3><dl class="hr-earn">${earn}</dl></section></div>`;
      ov.hidden = false;
      $('menu').hidden = true;
      $('honorClose').onclick = () => this.hideRoad(true);
      ov.querySelectorAll('[data-rival]').forEach((b) => (b.onclick = () => { this.hideRoad(false); rival.offer(b.dataset.rival); }));
      setTimeout(() => { const f = ov.querySelector('[data-rival]') || $('honorClose'); if (f) f.focus(); }, 0);
    },
    hideRoad(toMenu) {
      const ov = $('honorOv'); if (!ov || ov.hidden) return;
      ov.hidden = true;
      if (toMenu && ND.game && ND.game.mode === 'attract') { $('menu').hidden = false; setTimeout(() => { const m = $('mhonor'); if (m) m.focus(); }, 0); }
    },
    get roadOpen() { const ov = $('honorOv'); return !!ov && !ov.hidden; },
  };

  // Yeni ninja tanıtımı (#reveal): kısa tam ekran kart; dokunuş / tuş kapatır
  function reveal(ch) {
    const el = $('reveal'); if (!el || !ch) return;
    el.style.setProperty('--rc', ch.col.ui);
    el.innerHTML = `<div class="rv-in"><small>${esc(STR.rival.reveal)}</small><b class="k">${esc(ch.kanji)}</b><strong>${esc(ch.name)}</strong><span>${esc(ch.title)} · ${esc(ch.weapon)}</span></div>`;
    el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
    const au = ND.audio; if (au && au.ready) { au.gong(); au.taiko(1); }
    clearTimeout(reveal.t);
    const close = () => { el.hidden = true; el.onclick = null; };
    el.onclick = close;
    reveal.t = setTimeout(close, 2800);
  }
  reveal.close = () => { const el = $('reveal'); if (el && !el.hidden) { el.hidden = true; clearTimeout(reveal.t); return true; } return false; };
  ND.reveal = reveal;

  // ================================================================ ARCADE
  // Arcade toplamı = kazanılan dövüşlerin maç puanları (ND.score, zorluk çarpanı dahil) + bitiriş bonusu
  //                  + tek kredi bonusu (hiç tekrar yoksa) − tekrar başına ceza; kaybedilen denemenin puanı sayılmaz
  const AS = ND.ARCADE_SCORE = { clear: 10000, noRetry: 5000, retry: 2000 };
  const arcadeTotal = (R) => Math.max(0, R.score + AS.clear + (R.retries ? 0 : AS.noRetry) - R.retries * AS.retry);


  const arcade = ND.arcade = {
    run: null, G: null, mode: 'arcade', // koşu denetleyicisi (game.runner): banzuke.js'teki turnuva/Dan da aynı arayüzü kullanır

    init(G) {
      this.G = G;
      // VS ekranı paylaşılır: düğmeler o an etkin koşuya (arcade / turnuva / Dan) gider
      $('vsGo').onclick = () => (G.runner || this).fight();
      $('vsQuit').onclick = () => (G.runner || this).quit();
      $('edMenu').onclick = () => this.quit();
      $('edAgain').onclick = () => { const R = this.run; if (R && R.done) this.begin(R.me, true); };
      rival.G = G;
      const mh = $('mhonor');
      if (mh) mh.onclick = () => { if (ND.audio) ND.audio.ui(); const g = honor.goal(); if (g.kind === 'ready') rival.offer(g.ch.id); else honor.showRoad(); };
      this.refreshMenu();
    },

    refreshMenu() {
      if (ND.banzuke && ND.banzuke.ui) ND.banzuke.ui.refreshMenu();
      const el = $('arcProg'); if (!el) return;
      const p = save.p;
      el.textContent = STR.journey.menu(Object.keys(p.journey.cleared).length, Object.values(p.journey.runs).filter((r) => !r.done).length);
      const tb = $('mtTut'); if (tb) tb.classList.toggle('done', !!p.tutorial);
      honor.refreshStrip();
      const br = $('brandText'); if (br) br.textContent = STR.menu.brand(numWord(ND.CHARS.filter((c) => !c.hidden).length), ND.i18n ? ND.i18n.lower(numWord(ND.ARENAS.length)) : numWord(ND.ARENAS.length).toLowerCase());
    },

    refreshSelect() {
      const G = this.G; if (!G || G.phase !== 'select') return;
      // a locked ninja previewed on the select screen (game.js lockInfo): its texts, no colors, the journey it will have
      const shown = (i) => (G.selShown ? G.selShown(i) : G.sel.c[i]), peek = shown(0) !== G.sel.c[0];
      for (let n = 1; n <= 2; n++) {
        const ch = ND.CHARS[shown(n - 1)], done = save.p.journey.cleared[ch.id];
        $('st' + n).textContent = ch.title + ' · ' + ch.weapon + (done ? ' · ◆ ' + STR.journey.badge : '') + (save.p.journey.mastered[ch.id] ? ' · ★ ' + J.text().titles[ch.id] : '');
        const ro = $('ro' + n);
        if (ro) for (const b of ro.children) {
          const c = ND.CHARS[+b.dataset.k], badge = b.querySelector('[data-journey-badge]');
          if (c && save.p.journey.cleared[c.id]) {
            b.title = STR.journey.badge; b.setAttribute('aria-label', c.name + ' · ' + STR.journey.badge);
            if (!badge) { const seal = document.createElement('i'); seal.className = 'rdyb'; seal.dataset.journeyBadge = '1'; seal.textContent = '◆'; seal.setAttribute('aria-hidden', 'true'); b.appendChild(seal); }
          } else if (badge) { badge.remove(); b.title = ''; if (c) b.setAttribute('aria-label', c.name); }
        }
      }
      const selected = ND.CHARS[shown(0)], T = J.text(), profile = save.p.journey;
      const look = $('journeyLook'), panel = $('journeyPanel');
      if (look) {
        // Appearance slots: Original · Legacy (journey mastery) · Champion (won a Monthly Tournament with this ninja).
        // In the tournament a locked Champion slot says how to earn it.
        const id = selected.id, TT = (STR.bz && STR.bz.ttl) || {}, now = save.look(id), opts = save.lookOptions(id);
        const champLocked = !save.champOk(id) && G.selMode === 'tourney';
        look.hidden = peek || G.selMode === 'watch' || G.selMode === '2p' || (opts.length < 2 && !champLocked);
        look.textContent = '';
        const lab = document.createElement('span'); lab.className = 'look-l'; lab.textContent = T.colors; look.appendChild(lab);
        const slot = (v, text, locked) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'look-slot' + (v === 'champ' ? ' look-champ' : '') + (locked ? ' locked' : ''); b.textContent = text;
          b.setAttribute('aria-pressed', String(!locked && now === v));
          if (locked) { b.disabled = true; b.title = TT.how || ''; } else b.onclick = () => { save.setLook(id, v); G.refreshSelect(); };
          look.appendChild(b);
          return b;
        };
        slot(false, T.classic);
        if (opts.includes(true)) slot(true, T.legacy);
        if (opts.includes('champ')) slot('champ', TT.colors || 'Champion');
        else if (champLocked) {
          slot('champ', TT.colors || 'Champion', true);
          const how = document.createElement('small'); how.className = 'look-how'; how.textContent = TT.how || ''; look.appendChild(how);
        }
      }
      if (panel) panel.hidden = G.selMode !== 'arcade';
      // journey layout (index.html #select.journey): the ninja and its journey side by side where the screen is short
      if ($('select')) $('select').classList.toggle('journey', !!panel && !panel.hidden);
      if (G.selMode !== 'arcade') return;
      const ch = ND.CHARS[shown(0)], R = save.p.journey.runs[ch.id], S = STR.journey;
      if (!peek) {
        const sd = $('sd1'); sd.textContent = R && R.done ? S.completed : R ? S.progress(R.i, R.fights.length) : S.reward;
        const note = document.createElement('small'); note.className = 'cnote'; note.textContent = R && R.done ? '◆ ' + S.badge : S.saved; sd.appendChild(note);
      }
      $('bFight').textContent = R ? R.done ? S.ending : S.resume(R.i + 1, R.fights.length) : S.start;
      if (panel) {
        const route = R ? R.fights : J.route(ch.id), stars = profile.stars[ch.id] || 0, legacy = R && R.version !== J.version;
        const final = ND.CHARS.find((c) => c.id === route[7].opp);
        panel.innerHTML = `<div class="journey-heading"><b>${esc(T.route)} · ${esc(T.titles[ch.id])}</b><span>${esc(T.rival)}: ${esc(final.name)}</span></div>` +
          `<ol class="journey-chapters">${route.map((f, i) => { const op = ND.CHARS.find((c) => c.id === f.opp), star = !legacy && (stars & (1 << i));
            return `<li class="${star ? 'earned' : ''} ${R && R.i === i ? 'current' : ''}" title="${esc(op.name + (f.goal ? ' · ' + T.goals[f.goal] + ': ' + f.need : ''))}"><small>${i + 1} ${star ? '★' : '☆'}</small><b>${esc(op.kanji)}</b><span>${esc(op.name)}</span></li>`; }).join('')}</ol>` +
          `<p>${esc(T.mastery)}: <b>${J.count(stars)} / 8</b> · ${esc(profile.mastered[ch.id] ? T.titles[ch.id] + ' · ' + T.legacy : T.reward)}</p>` +
          (legacy ? `<p>${esc(T.old)}</p>` : '') + (!save.isCharUnlocked(BOSS) ? `<p>${esc(T.shura)} (${Math.min(J.shuraNeed, save.distinctClears())}/${J.shuraNeed})</p>` : '');
      }
    },

    checkpoint() {
      const R = this.run; if (!R) return;
      const id = ND.CHARS[R.me].id, i = R.last === 'win' ? Math.min(R.i + 1, R.fights.length) : R.i;
      const stored = { ...R, i, fights: R.fights.map((f) => ({ ...f, opp: ND.CHARS[f.opp].id })) };
      save.p.journey.runs[id] = cleanJourney(stored, id);
      save.commit();
    },

    // Each character keeps a separate route. Replaying a completed route is an explicit ending-screen action.
    begin(ci, replay = false) {
      const me = ND.CHARS[ci];
      const saved = save.p.journey.runs[me.id];
      if (saved && !replay) {
        this.run = { ...saved, me: ci, fights: saved.fights.map((f) => ({ ...f, opp: ND.CHARS.findIndex((c) => c.id === f.opp) })),
          fightPts: saved.fightPts.slice(), unlocked: saved.unlocked.map((e) => ({ ...e })), needsRetry: saved.needsRetry || saved.started, started: false, last: null, cur: null };
        this.G.runner = this;
        if (this.run.i >= this.run.fights.length) return this.showEnding();
        return this.openVs();
      }
      const fights = J.route(me.id).map((f) => ({ ...f, opp: ND.CHARS.findIndex((c) => c.id === f.opp) }));
      this.run = { version: J.version, me: ci, fights, i: 0, time: 0, score: 0, retries: 0, perfect: 0, won: 0, last: null, cur: null, unlocked: [], rounds: 0, rw: 0, hits: 0 };
      this.G.runner = this;
      this.checkpoint();
      this.openVs();
    },

    get fightInfo() { const R = this.run; return R ? R.fights[R.i] : null; },

    openVs() {
      const R = this.run, G = this.G, F = R.fights[R.i], me = ND.CHARS[R.me], op = ND.CHARS[F.opp];
      ND.scene.setTheme(F.arena);
      G.showStage('vs', ['vs1', 'vs2'], R.me, F.opp);
      ND.music.setMode(F.boss ? 'final' : 'menu');
      const vs = $('vs');
      vs.hidden = false; vs.classList.toggle('boss', !!F.boss);
      vs.classList.toggle('journey', R.version === J.version);
      vs.classList.remove('in'); void vs.offsetWidth; vs.classList.add('in');
      const alt = R.me === F.opp;
      const setSide = (n, ch, a) => {
        const col = ND.palOf(ch, a);
        $('vsk' + n).textContent = ch.kanji; $('vsk' + n).style.color = col.ui;
        $('vsn' + n).textContent = ch.name; $('vst' + n).textContent = ch.title + ' · ' + ch.weapon;
        $('vss' + n).style.setProperty('--sc', col.ui);
      };
      const legacyColors = save.look(me.id);
      setSide(1, me, legacyColors); setSide(2, op, alt && !legacyColors);
      const arena = ND.ARENAS.find((a) => a.id === F.arena);
      $('vsStage').textContent = R.version === J.version ? (F.boss ? J.text().rival : J.text().stage + ' ' + (R.i + 1) + ' / 8') + ' · ' + J.text().titles[me.id] : F.boss ? STR.vs.boss : STR.vs.stage(R.i + 1, R.fights.length);
      $('vsArena').innerHTML = arena ? `<b>${esc(arena.kanji)}</b>${esc(arena.name)}` : '';
      $('vsLevel').textContent = (ND.AI_LEVELS[F.level] || ND.AI_LEVELS[1]).name;
      $('vsQuit').textContent = STR.vs.quit; // VS ekranı turnuva/Dan ile paylaşılır
      const vm = $('vsMods'); if (vm) vm.hidden = true;
      const objective = $('journeyVs');
      if (objective) { objective.hidden = !F.goal; objective.textContent = F.goal ? '☆ ' + J.text().optional + ' · ' + J.text().goals[F.goal] + ': ' + F.need + ' — ' + J.text().win : ''; }
      $('vsKeys').innerHTML = STR.pickT(STR.vs.keys, '');
      $('vsLadder').innerHTML = R.fights.map((f, k) => {
        const ch = ND.CHARS[f.opp], cls = k < R.i ? 'done' : k === R.i ? 'cur' : '';
        const hideBoss = R.version !== J.version && f.boss && k > R.i;
        return `<i class="${cls}${f.boss ? ' boss' : ''}" title="${hideBoss ? '?' : esc(ch.name)}" style="--sc:${(f.alt ? ch.alt : ch.col).ui}">${hideBoss ? STR.vs.unknown : esc(ch.kanji)}</i>`;
      }).join('');
      const lines = this.talk(op.id, me.id, R.version !== J.version && F.boss);
      $('vsTalk').innerHTML = lines.map(([side, id, text], k) => {
        const ch = ND.CHARS.find((c) => c.id === id);
        const col = side === 'r' && alt ? ch.alt.ui : ch.col.ui;
        return `<p class="ln ${side}" style="--lc:${col};animation-delay:${0.35 + k * 0.75}s"><b>${esc(ch.name)}</b><span>${esc(text)}</span></p>`;
      }).join('');
      this.vsT = 0;
      setTimeout(() => { if (G.phase === 'vs') $('vsGo').focus(); }, 0);
    },

    // Karşılıklı sözler: rakip önce konuşur, sen cevap verirsin
    talk(opId, meId, boss) {
      const T = STR.talk, tOp = T[opId] || T.akane, tMe = T[meId] || T.akane;
      if (boss) return [['r', opId, pick(tOp.open)], ['l', meId, tMe.boss || pick(tMe.reply)]];
      const pair = STR.pairs[[opId, meId].sort().join('|')];
      if (pair) return pair.map(([id, text]) => [id === opId ? 'r' : 'l', id, text]);
      return [['r', opId, pick(tOp.open)], ['l', meId, pick(tMe.reply)]];
    },

    fight() {
      const R = this.run; if (!R) return;
      const F = R.fights[R.i];
      if (!F || R.done) return;
      if (R.needsRetry) R.retries++;
      R.needsRetry = false; R.started = true; R.last = null;
      $('vs').hidden = true;
      R.cur = { t: 0, lost: 0, perfect: 0, metrics: {} };
      this.checkpoint();
      ND.audio.gong();
      this.G.start('arcade', { c1: R.me, c2: F.opp, arena: F.arena, level: F.level });
      // The very first journey fight carries the five-tip coach (it used to ride on the old quick-play match).
      if (R.i === 0 && ND.coach && !save.p.coached) { save.p.coached = true; save.commit(); ND.coach.start(); }
      this.refreshGoal();
    },
    observeHit(from, a) {
      const R = this.run;
      if (!R || !R.cur || R.cur.settled || this.G.mode !== 'arcade' || this.G.phase !== 'fight') return;
      J.hit(R.cur.metrics, from, a); this.refreshGoal();
    },
    observeDefense(kind) {
      const R = this.run;
      if (kind !== 'break' || !R || !R.cur || R.cur.settled || this.G.mode !== 'arcade' || this.G.phase !== 'fight') return;
      const m = R.cur.metrics; m[kind] = Math.min(99, (m[kind] || 0) + 1); this.refreshGoal();
    },
    refreshGoal() {
      const el = $('journeyGoal'), R = this.run, F = this.fightInfo;
      if (!el) return;
      el.hidden = !F || !F.goal || !R.cur || this.G.mode !== 'arcade';
      if (el.hidden) return;
      const m = R.cur.metrics, n = J.value(F, m, m.parry), ready = n >= F.need, T = J.text();
      const text = (ready ? '★ ' : '☆ ') + T.goals[F.goal] + ' ' + n + '/' + F.need + (ready ? ' · ' + T.win : '');
      if (el.textContent !== text) { el.textContent = text; el.classList.toggle('earned', ready); }
    },
    retry() { const R = this.run; if (!R) return; if (R.last === 'win') return this.primary(); R.needsRetry = true; this.fight(); },
    quit() { this.abandon(); $('vs').hidden = true; $('ending').hidden = true; this.G.goMenu(); },
    abandon() { this.checkpoint(); this.run = null; if (this.G.runner === this) this.G.runner = null; this.refreshMenu(); },

    hudTags() {
      const R = this.run, F = R && R.fights[R.i];
      if (!F) return [STR.hud.you, STR.hud.cpu];
      const lv = ND.i18n ? ND.i18n.upper((ND.AI_LEVELS[F.level] || ND.AI_LEVELS[1]).name) : (ND.AI_LEVELS[F.level] || ND.AI_LEVELS[1]).name.toUpperCase();
      return [STR.hud.you + ' · ' + STR.hud.stage(R.i + 1, R.fights.length), F.boss ? (R.version === J.version ? J.text().rival : STR.hud.boss) : STR.hud.cpu + ' · ' + lv];
    },

    tick(rdt) {
      const R = this.run, G = this.G;
      if (!R || G.mode !== 'arcade' || !R.cur) return;
      // Some reflected projectiles increment parries without changing the fighter's animation.
      // Only update DOM when the counter changes, not every frame.
      if (R.cur.metrics && R.cur.metrics.parry !== (G.F[0].parries || 0)) { R.cur.metrics.parry = G.F[0].parries || 0; this.refreshGoal(); }
      if (G.phase === 'intro' || G.phase === 'fight' || G.phase === 'ko' || G.phase === 'timeup') { R.time += rdt; R.cur.t += rdt; }
    },

    onRoundEnd(w) {
      const R = this.run, G = this.G; if (!R || !R.cur) return;
      const f1 = G.F[0];
      R.rounds = (R.rounds || 0) + 1;
      if (w === f1) { R.rw = (R.rw || 0) + 1; if (f1.damageTaken === 0) R.cur.perfect++; }
      else if (w) R.cur.lost++;
    },

    // true döner: normal bitiş penceresini arcade kendisi yönetir
    // res: ND.score.matchEnd() sonucu (tek puan modeli; zorluk çarpanı dahil maç puanı)
    onMatchEnd(w, res) {
      const R = this.run, G = this.G; if (!R) return false;
      const F = R.fights[R.i], f1 = G.F[0], cur = R.cur || { t: 60, lost: 0, perfect: 0 };
      if (!F || cur.settled) return true;
      cur.settled = true; R.started = false;
      const won = w === f1;
      R.last = won ? 'win' : 'loss';
      R.hits = (R.hits || 0) + (ND.mods ? ND.mods.hits : 0);
      const E = STR.end;
      if (won) {
        const pts = res ? res.total : 0;
        R.score += pts; R.won++; R.perfect += cur.perfect;
        R.fightPts = R.fightPts || []; R.fightPts[R.i] = pts;
        R.honor = (R.honor || 0) + (honor.last ? honor.last.total : 0);
        R.needsRetry = false;
        cur.star = !!F.goal && J.value(F, cur.metrics || {}, f1.parries || 0) >= F.need;
        save.transaction(() => {
          if (cur.star) { const id = ND.CHARS[R.me].id; save.p.journey.stars[id] = (save.p.journey.stars[id] || 0) | (1 << R.i); }
          save.recordWin(); if (F.boss) this.complete(); else this.checkpoint();
        });
        if (G.showScore) G.showScore(res, { note: STR.score.arcadeTotal(R.score) });
        if (F.boss) { setTimeout(() => { if (this.run === R && G.phase === 'end') this.showEnding(); }, 900); return true; }
        $('endK').textContent = '勝利';
        $('endTitle').textContent = E.winTitle;
        $('endSub').textContent = E.winSub(R.i + 1, R.fights.length, pts);
        if (F.goal) $('endSub').textContent += ' · ' + (cur.star ? '★ ' + J.text().earned : J.text().missed);
        $('bRematch').textContent = E.next;
      } else {
        R.honor = (R.honor || 0) + (honor.last ? honor.last.total : 0);
        R.needsRetry = true; this.checkpoint();
        $('endK').textContent = '敗';
        $('endTitle').textContent = E.lossTitle;
        $('endSub').textContent = E.lossSub(nice(w ? w.ch.name : ND.CHARS[F.opp].name));
        $('bRematch').textContent = E.retry;
        // Rewarded: continue from here without the retry penalty (once per run, only where ads exist)
        const bc = $('bContinue'), A = STR.ads || {};
        if (bc && ND.ads && ND.ads.rewardedAvailable() && !R.contUsed) {
          bc.hidden = false;
          bc.innerHTML = `<span>${esc(A.cont || '')}</span><small>${esc(A.contSub || '')}</small>`;
          ND.ads.offer();
          bc.onclick = () => {
            if (ND.ads.busy) return;
            ND.ads.rewarded().then((ok) => {
              if (!ok) { if (ND.toast) ND.toast(A.fail || '', '忍'); return; }
              if (!this.run || this.run !== R) return;
              R.contUsed = true; R.needsRetry = false; bc.hidden = true; this.fight();
            });
          };
        }
        if (G.showScore) G.showScore(res, { lost: true, note: STR.score.lossNote(R.score, AS.retry) });
      }
      $('bChange').hidden = true;
      $('bEndMenu').textContent = E.quit;
      return false;
    },

    // Bitiş penceresindeki birincil düğme
    primary() {
      const R = this.run; if (!R) return this.G.goMenu();
      if (R.last === 'win') { R.i++; R.last = null; R.cur = null; if (R.i >= R.fights.length) return this.showEnding(); this.openVs(); }
      else this.retry();
    },

    complete() {
      const R = this.run; if (!R || R.done) return;
      const me = ND.CHARS[R.me];
      const final = arcadeTotal(R);
      let res;
      save.transaction(() => {
        R.done = true;
        res = save.recordClear(me.id, final, R.time, R.version !== J.version);
        R.unlocked.push(...res.ev);
        if (HONOR) { honor.bonus('arcadeClear', HONOR.arcadeClear); R.honor = (R.honor || 0) + HONOR.arcadeClear; }
        save.p.journey.cleared[me.id] = true;
        if (R.version === J.version && J.count(save.p.journey.stars[me.id]) >= J.masteryNeed) save.p.journey.mastered[me.id] = true;
        R.newBest = res.newBest;
        this.checkpoint();
      });
      if (ND.portal) ND.portal.happyTime();
      toastEvents(res.ev);
      if (res.newBest) setTimeout(() => ND.toast(STR.toast.newBest(final), STR.toast.bestK), 350 + res.ev.length * 650);
    },

    showEnding() {
      const R = this.run, G = this.G; if (!R || R.won < R.fights.length) return;
      this.complete();
      const me = ND.CHARS[R.me], final = arcadeTotal(R), res = { newBest: !!R.newBest };
      $('end').hidden = true;
      G.showStage('ending', ['edPv', null], R.me, null);
      G.pv[0].pvPose = 'victory';
      ND.music.setMode('menu');
      const S = STR.ending, lines = R.version === J.version ? [J.text().endings[me.id]] : STR.endings[me.id] || STR.endings.def;
      $('edK').textContent = me.kanji; $('edK').style.color = me.col.ui;
      $('edName').textContent = me.name;
      $('edHead').textContent = STR.journey.completed + ' · ' + me.title;
      $('edAgain').textContent = STR.journey.replay;
      $('edText').innerHTML = lines.map((l, k) => `<p style="animation-delay:${0.3 + k * 0.9}s">${esc(l)}</p>`).join('');
      const rows = [
        [S.rows.fights, R.won + ' / ' + R.fights.length],
        [S.rows.time, fmtTime(R.time)],
        [S.rows.perfect, R.perfect],
        [S.rows.retries, R.retries ? R.retries + ' (−' + fmtNum(R.retries * AS.retry) + ')' : '0'],
        [S.fightPts, fmtNum(R.score)],
        [S.bonus, STR.score.clearBonus(AS.clear, R.retries ? 0 : AS.noRetry)],
      ];
      const cell = (l, v, cls = '') => `<div class="${cls}"><small>${esc(l)}</small><b>${v}</b></div>`;
      $('edStats').innerHTML = rows.map((r) => cell(r[0], esc(r[1]))).join('') +
        cell(S.rows.score, fmtNum(final) + (res.newBest ? `<em>${esc(S.newBest)}</em>` : ''), 'sc') + cell(S.rows.best, fmtNum(save.p.best)) +
        (HONOR ? cell(STR.honor.head, esc(STR.honor.plus(R.honor || 0)) + `<em>${esc(STR.honor.total(save.honor))}</em>`, 'hn') : '');
      // Sıralama: otomatik gönder (yerelde takma ad yoksa tek dokunuşla sorulur), sonra sırayı göster
      if ($('edRank')) $('edRank').hidden = true;
      if (ND.lbUI && !R.ranked) {
        R.ranked = true; this.checkpoint();
        const back = () => { const e = $('ending'); if (e) e.hidden = false; setTimeout(() => $('edMenu').focus(), 0); };
        // maç özeti: sunucu makullük denetimi için (süre, dövüş, raund, isabet)
        const sum = { dur: R.time, fights: R.fights.length, won: R.won, rounds: R.rounds || 0, rw: R.rw || 0, hits: R.hits || 0, lvl: 3, mode: 'arcade' };
        ND.lbUI.panel($('edRank'), 'arcade', { score: final, char: me.id, time: Math.round(R.time), date: Date.now(), sum }, { back, onOpen: () => { $('ending').hidden = true; } });
      }
      const un = R.unlocked.map((e) => (e.kind === 'char' ? ND.CHARS.find((c) => c.id === e.id) : ND.ARENAS.find((a) => a.id === e.id))).filter(Boolean);
      $('edUnl').innerHTML = `<span>◆ ${esc(STR.journey.clearReward)}</span>` + (un.length ? `<span>${esc(S.unlocked)}</span>` + un.map((x) => `<i style="color:${x.col ? x.col.ui : 'var(--gold)'}" title="${esc(x.name)}">${esc(x.kanji)}</i>`).join('') : '');
      const mastery = $('journeyReward');
      if (mastery) {
        const T = J.text(), stars = J.count(save.p.journey.stars[me.id]);
        mastery.hidden = false;
        mastery.textContent = R.version !== J.version ? T.old : T.mastery + ': ' + stars + '/8 · ' + (save.p.journey.mastered[me.id] ? '★ ' + T.titles[me.id] + ' · ' + T.legacy : T.reward);
      }
      const el = $('ending'); el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
      this.refreshMenu();
      setTimeout(() => { if (G.phase === 'ending') $('edMenu').focus(); }, 0);
    },

    onKey(e) {
      const G = this.G;
      if (G.phase === 'vs') {
        if ((e.code === 'Enter' || e.code === 'KeyF' || e.code === 'Space') && !e.repeat) { this.fight(); return true; }
        if (ND.input.isBack(e)) { this.quit(); return true; }
        return false;
      }
      if (G.phase === 'ending') {
        if (ND.input.isBack(e) || (e.code === 'Enter' && document.activeElement === document.body && !e.repeat)) { this.quit(); return true; }
        return false;
      }
      return false;
    },
  };

  // ================================================================ MEYDAN OKUMA (挑): kilitli ninjayla düello
  // Onur eşiğine ulaşınca açılır; kazanınca ninja kalıcı olarak açılır. Kaybetmek bir şey kaybettirmez, yalnız
  // bir sonraki denemede rakibin canı biraz düşer (honor.js rivalHp). Koşu denetleyicisi arayüzü (game.runner).
  const rival = ND.rival = {
    mode: 'rival', run: null, G: null, target: null,
    // Menüden / bitiş ekranından / Onur Yolu'ndan: ninjanı seç, sonra düello
    offer(id) {
      const ri = save.rivalInfo(id);
      if (!ri || ri.unlocked || !ri.ready || !this.G) return;
      this.target = id;
      if (ND.audio) ND.audio.ui();
      this.G.openSelect('rival');
    },
    begin(ci, id) {
      id = id || this.target;
      const ri = save.rivalInfo(id), oi = ND.CHARS.findIndex((c) => c.id === id);
      if (!ri || ri.unlocked || !ri.ready || oi < 0) return this.G.goMenu();
      this.target = id;
      const arena = ND.ARENAS.some((a) => a.id === ri.r.arena) ? ri.r.arena : 'temple';
      this.run = { me: ci, id, opp: oi, level: ri.r.lv, arena, last: null, cur: null };
      this.G.runner = this;
      this.openVs();
    },
    openVs() {
      const R = this.run, G = this.G, me = ND.CHARS[R.me], op = ND.CHARS[R.opp], ri = save.rivalInfo(R.id);
      R.hp = ri ? ri.hp : 1;
      ND.scene.setTheme(R.arena);
      G.showStage('vs', ['vs1', 'vs2'], R.me, R.opp);
      ND.music.setMode('final');
      const vs = $('vs');
      vs.hidden = false; vs.classList.remove('boss'); vs.classList.add('rival');
      vs.classList.remove('in'); void vs.offsetWidth; vs.classList.add('in');
      const side = (n, ch) => {
        $('vsk' + n).textContent = ch.kanji; $('vsk' + n).style.color = ch.col.ui;
        $('vsn' + n).textContent = ch.name; $('vst' + n).textContent = ch.title + ' · ' + ch.weapon;
        $('vss' + n).style.setProperty('--sc', ch.col.ui);
      };
      side(1, me); side(2, op);
      const arena = ND.ARENAS.find((a) => a.id === R.arena);
      $('vsStage').textContent = STR.rival.stage;
      $('vsArena').innerHTML = arena ? `<b>${esc(arena.kanji)}</b>${esc(arena.name)}` : '';
      $('vsLevel').textContent = STR.rival.lvHp((ND.AI_LEVELS[R.level] || ND.AI_LEVELS[1]).name, Math.round(R.hp * 100));
      $('vsQuit').textContent = STR.rival.quit;
      const vm = $('vsMods'); if (vm) vm.hidden = true;
      $('vsKeys').innerHTML = STR.pickT(STR.vs.keys, '');
      $('vsLadder').innerHTML = `<i class="cur" style="--sc:${op.col.ui}">${esc(STR.rival.k)}</i>`;
      const T = STR.talk, tMe = T[me.id] || T.akane;
      const lines = [['r', op.id, (STR.rival.lines && STR.rival.lines[op.id]) || pick((T[op.id] || T.akane).open)], ['l', me.id, pick(tMe.reply)]];
      $('vsTalk').innerHTML = lines.map(([sd, id, text], k) => {
        const ch = ND.CHARS.find((c) => c.id === id);
        return `<p class="ln ${sd}" style="--lc:${ch.col.ui};animation-delay:${0.35 + k * 0.75}s"><b>${esc(ch.name)}</b><span>${esc(text)}</span></p>`;
      }).join('');
      setTimeout(() => { if (G.phase === 'vs') $('vsGo').focus(); }, 0);
    },
    fight() {
      const R = this.run; if (!R) return;
      $('vs').hidden = true; $('vs').classList.remove('rival');
      R.cur = { t: 0 };
      ND.audio.gong();
      this.G.start('rival', { c1: R.me, c2: R.opp, arena: R.arena, level: R.level, oppHp: R.hp });
    },
    hudTags() {
      const R = this.run;
      const lv = R ? (ND.i18n ? ND.i18n.upper((ND.AI_LEVELS[R.level] || ND.AI_LEVELS[1]).name) : (ND.AI_LEVELS[R.level] || ND.AI_LEVELS[1]).name.toUpperCase()) : '';
      return [STR.hud.you, STR.rival.hud + (lv ? ' · ' + lv : '')];
    },
    tick() {},
    onRoundEnd() {},
    // true → game.js normal bitiş penceresini göstermez
    onMatchEnd(w, res) {
      const R = this.run, G = this.G; if (!R) return false;
      const won = w === G.F[0], ch = ND.CHARS[R.opp], S = STR.rival;
      R.last = won ? 'win' : 'loss';
      if (won) {
        const ev = save.rivalWon(R.id);
        honor.bonus('rivalWin', HONOR.rivalWin, true);
        toastEvents(ev);
        $('endK').textContent = ch.kanji;
        $('endTitle').textContent = S.winTitle(ch.name);
        $('endSub').textContent = S.winSub(nice(ch.name));
        $('bRematch').textContent = S.tryNew(nice(ch.name));
        $('bEndMenu').textContent = STR.end.menu;
        setTimeout(() => reveal(ch), 250);
        if (ND.portal) ND.portal.happyTime();
      } else {
        save.rivalLost(R.id);
        const ri = save.rivalInfo(R.id), p = ri ? Math.round(ri.hp * 100) : 100;
        $('endK').textContent = '敗';
        $('endTitle').textContent = S.lossTitle;
        $('endSub').textContent = p < Math.round(R.hp * 100) ? S.lossSub(nice(ch.name), p) : S.lossSubMin(nice(ch.name));
        $('bRematch').textContent = S.retry;
        $('bEndMenu').textContent = S.quit;
      }
      $('bChange').hidden = true;
      if (G.showScore) G.showScore(res, { lost: !won });
      return false;
    },
    // Bitiş penceresindeki birincil düğme: kazandıysan yeni ninjayla seçim ekranı, kaybettiysen yeniden dene
    primary() {
      const R = this.run, G = this.G; if (!R) return G.goMenu();
      if (R.last === 'win') { const k = R.opp; this.abandon(); G.sel.c[0] = k; G.openSelect('cpu'); return; }
      this.retry();
    },
    retry() { const R = this.run; if (!R) return; if (save.isCharUnlocked(R.id)) return this.primary(); this.openVs(); },
    quit() { this.abandon(); $('vs').hidden = true; this.G.goMenu(); },
    abandon() { this.run = null; if (this.G && this.G.runner === this) this.G.runner = null; if ($('vs')) $('vs').classList.remove('rival'); },
    onKey(e) {
      const G = this.G;
      if (G.phase === 'vs') {
        if ((e.code === 'Enter' || e.code === 'KeyF' || e.code === 'Space') && !e.repeat) { this.fight(); return true; }
        if (ND.input.isBack(e)) { this.quit(); return true; }
      }
      return false;
    },
    onPad(st, prev) {
      const pr = (a) => st[a] && !prev[a];
      if (this.G.phase === 'vs') { if (pr('light') || pr('up')) this.fight(); else if (pr('kick')) this.quit(); }
    },
  };

  function numWord(n) {
    const I = ND.i18n, cat = I && I.lang !== I.source ? I.catalog(I.lang).NUMWORDS : null;
    const w = cat && cat.length ? cat : ['Sıfır', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz', 'On', 'On bir', 'On iki'];
    return w[n] || String(n);
  }

  // ================================================================ ANTRENMAN + EĞİTİM
  // Kukla davranışları için saldırgan ama savunmasız bir yapay zekâ ayarı
  const ATTACK_LV = { parry: 0, guard: 0.08, dodge: 0.04, aggr: 0.8, combo: 0.5, smart: 0.25, counter: 0, rally: 0, react: 0.3, tick: [0.3, 0.55] };

  class Dummy {
    constructor(me) { this.me = me; this.c = me.ctrl; this.beh = 'idle'; this.t = 0; this.ai = null; this.tapped = []; this.tok = -1; this.at = 0; this.mashT = 0; }
    set(beh) {
      this.c.clear(); this.beh = beh; this.at = 0; this.tok = -1;
      this.ai = null;
      if (beh === 'attack') { this.ai = new ND.AI(this.me, 1); this.ai.lv = Object.assign({}, ND.AI_LEVELS[1], ATTACK_LV); }
    }
    tap(a) { this.c.release(a, 'dm'); this.c.press(a, 'dm'); this.tapped.push(a); }
    update(dt) {
      if (this.ai) return this.ai.update(dt);
      const me = this.me, c = this.c, G = ND.game;
      this.t += dt;
      for (const a of this.tapped) c.release(a, 'dm');
      this.tapped.length = 0;
      if (me.locked || me.dead) { c.release('guard', 'dm'); return; }
      if (me.state === 'lock') { this.mashT -= dt; if (this.mashT <= 0) { this.tap('light'); this.mashT = 0.5; } return; }
      const g = this.beh === 'guard' || this.beh === 'counter';
      if (g) c.press('guard', 'dm'); else c.release('guard', 'dm');
      if (this.beh === 'counter') {
        if (me.counterUntil > G.clock && me.serial !== this.tok && ['block', 'parry', 'guard', 'move'].includes(me.state)) { this.tok = me.serial; this.at = this.t + 0.07; }
        if (this.at && this.t >= this.at) { this.at = 0; if (me.counterUntil > G.clock) this.tap('light'); }
      }
    }
  }

  // Savuşturma dersinde kukla daha çok okunaklı ağır kesik atar, seri baskıyı azaltır (hafif kesiği tepkiyle savuşturmak zordur)
  const LESSON_AI = { parry: { heavy: 0.6, combo: 0.15, aggr: 0.6 } };
  const LESSON_BEH = { walk: 'idle', combo: 'idle', heavy: 'idle', gbreak: 'guard', block: 'attack', parry: 'attack', counter: 'attack', rally: 'counter', special: 'idle' };

  const training = ND.training = {
    G: null, tut: false, beh: 'idle', opts: { infHp: true, fullKi: false }, panel: true, dummy: null,
    lesson: 0, ev: {}, acc: 0, doneT: 0, finished: false,

    init(G) {
      this.G = G;
      try { this.panel = window.innerWidth >= 900; } catch (e) { /* yok */ }
      // oyun kancalarını sar (orijinal davranışı bozmadan)
      const wrap = (name, fn) => {
        const orig = G[name];
        if (typeof orig !== 'function') return;
        G[name] = function (...args) { const r = orig.apply(this, args); try { fn(args, r); } catch (e) { /* yok say */ } return r; };
      };
      wrap('onCounter', ([f]) => { if (G.mode === 'train' && f === G.F[0]) this.ev.counter = true; });
      wrap('onSpecial', ([f]) => { if (G.mode === 'train' && f === G.F[0]) this.ev.special = true; });
      wrap('onHit', ([from]) => { if (G.mode === 'train' && from === G.F[0]) this.ev.hit = true; });

      this.labels();
      $('trInf').onclick = (e) => { this.opts.infHp = !this.opts.infHp; this.refresh(); e.currentTarget.blur(); };
      $('trKi').onclick = (e) => { this.opts.fullKi = !this.opts.fullKi; this.refresh(); e.currentTarget.blur(); };
      $('trReset').onclick = (e) => { this.reset(); e.currentTarget.blur(); };
      $('trHide').onclick = (e) => { this.togglePanel(); e.currentTarget.blur(); };
      $('trShow').onclick = (e) => { this.togglePanel(); e.currentTarget.blur(); };
      // dokunmatik ↔ klavye geçişinde açık ekranların metinlerini yenile
      if (ND.touch) ND.touch.onChange(() => this.retext());
      // language switched (menu or pause dialog): texts built here and an open training screen follow at once
      if (ND.i18n && ND.i18n.onChange) ND.i18n.onChange(() => { this.labels(); if (this.G.mode === 'train') $('trTitle').textContent = this.tut ? STR.train.tutTitle : STR.train.title; this.retext(); if (this.G.mode === 'train') this.refresh(); });
    },

    // Dummy behaviour buttons and the key help line, in the current language
    labels() {
      const box = $('trBeh');
      box.innerHTML = Object.keys(STR.train.beh).map((k, i) => `<button class="seg" data-beh="${k}" title="${i + 1}">${esc(STR.train.beh[k])}</button>`).join('');
      box.querySelectorAll('[data-beh]').forEach((b) => (b.onclick = () => { this.setBeh(b.dataset.beh); b.blur(); }));
      $('trKeys').innerHTML = STR.train.keysHelp;
    },

    retext() {
      const G = this.G; if (!G) return;
      if (G.phase === 'vs' && $('vsKeys')) $('vsKeys').innerHTML = STR.pickT(STR.vs.keys, '');
      if (G.mode !== 'train' || $('train').hidden && $('trShow').hidden) return;
      const open = $('trMovesBox').open;
      this.buildMoves(); $('trMovesBox').open = open;
      if (this.tut && !this.finished) this.renderTip();
    },

    begin(c1, c2, arena, tut) {
      this.tut = !!tut; this.lesson = 0; this.finished = false;
      // panel dar ekranda dövüşçünün üstünü kapatır: kullanıcı elle açıp kapatmadıysa genişliğe göre karar ver
      // dokunmatikte panel sol başparmak bölgesini kapatmasın: varsayılan kapalı
      if (!this.panelUser) { try { this.panel = window.innerWidth >= 900 && !(ND.touch && ND.touch.active); } catch (e) { /* yok */ } }
      if (this.tut) {
        // ilk tamamlanmamış dersten başla
        const L = STR.lessons, done = save.p.lessons;
        const k = L.findIndex((l) => !done.includes(l.id));
        this.lesson = k < 0 ? 0 : k;
      } else this.beh = this.beh || 'idle';
      this.G.start('train', { c1, c2, arena });
    },

    makeDummy(f) { this.dummy = new Dummy(f); this.setDummy(this.tut ? LESSON_BEH[STR.lessons[this.lesson].id] : this.beh); return this.dummy; },

    onStart() {
      $('train').hidden = !this.panel; $('trShow').hidden = this.panel;
      $('trTitle').textContent = this.tut ? STR.train.tutTitle : STR.train.title;
      $('trTut').hidden = !this.tut;
      this.buildMoves();
      if (this.tut) this.startLesson(this.lesson, true);
      this.refresh();
    },
    hide() { ['train', 'trShow', 'trTip'].forEach((id) => { const el = $(id); if (el) el.hidden = true; }); },
    togglePanel() { this.panelUser = true; this.panel = !this.panel; $('train').hidden = !this.panel; $('trShow').hidden = this.panel; },

    special(ch) {
      const sp = ND.SPECIALS?.[ch.id];
      return sp && sp.name ? { kanji: sp.kanji || '', name: sp.name, desc: sp.desc || '', tip: sp.tip || '' } : STR.train.specialFallback;
    },
    // Hareket listesi satırları (<dt>/<dd>): ND.MOVELIST[ch.id] varsa ondan (dövüş tarafının listesi), yoksa genel liste
    // + ki tekniği + ninjaya özel notlar. Antrenman paneli ve seçim ekranındaki Hareketler paneli ortak kullanır.
    movesHtml(ch) {
      const sp = this.special(ch), tr = (s) => (ND.i18n ? ND.i18n.t(String(s)) : String(s));
      const ML = ND.MOVELIST && Array.isArray(ND.MOVELIST[ch.id]) && ND.MOVELIST[ch.id].length ? ND.MOVELIST[ch.id] : null;
      let rows;
      if (ML) {
        rows = ML.map((m) => {
          if (!m || typeof m !== 'object') return '';
          const tags = Array.isArray(m.tags) && m.tags.length ? `<span class="mtags">${m.tags.map((t) => `<em>${esc((STR.moveTags && STR.moveTags[t]) || tr(t))}</em>`).join('')}</span>` : '';
          return `<dt>${fmtInput(m.input)}</dt><dd><b>${esc(tr(m.name || ''))}</b>${tags}${m.desc ? '<small>' + esc(tr(m.desc)) + '</small>' : ''}</dd>`;
        });
      } else {
        rows = STR.pickT(STR.moves, STR.movesTouch).map((m) => `<dt>${m[0]}</dt><dd><b>${esc(m[1])}</b>${m[2] ? '<small>' + esc(m[2]) + '</small>' : ''}</dd>`);
      }
      // ki tekniği: liste kendisi içermiyorsa ekle
      if (!ML || !ML.some((m) => m && Array.isArray(m.tags) && m.tags.some((t) => /^(ki|special|özel)$/i.test(String(t))))) {
        rows.push(`<dt>${STR.pickT('<kbd>E</kbd>', STR.moveSpecialTouch)}</dt><dd class="sp"><b><span class="k">${esc(sp.kanji)}</span> ${esc(sp.name)}</b><small>${esc(STR.train.kiFull)} · ${esc(sp.desc)}</small>` +
          (sp.tip ? `<small class="tip">${esc(STR.train.counterTip)}: ${esc(sp.tip)}</small>` : '') + '</dd>');
      }
      // ninjaya özel notlar (roster2.js: STR.roster2.notes)
      const notes = !ML && STR.roster2 && STR.roster2.notes && STR.roster2.notes[ch.id];
      if (Array.isArray(notes)) notes.forEach((t) => rows.push(`<dt><span class="k">${esc(ch.kanji)}</span></dt><dd class="nt"><small>${esc(t)}</small></dd>`));
      return rows.join('');
    },
    buildMoves() {
      $('trMoves').innerHTML = this.movesHtml(this.G.F[0].ch);
      $('trMovesBox').open = !this.tut;
    },

    setBeh(b) {
      if (this.tut && !this.finished) return;
      this.beh = b; if (this.dummy) this.dummy.set(b); ND.audio.ui(); this.refresh();
    },
    reset() {
      const G = this.G; if (G.mode !== 'train') return;
      G.startRound();
      if (this.dummy) this.setDummy(this.dummy.beh);
    },
    // kukla davranışı + (eğitimdeyse) derse özel yapay zekâ ayarı
    setDummy(beh) {
      if (!this.dummy) return;
      this.dummy.set(beh);
      const L = this.tut && !this.finished ? STR.lessons[this.lesson] : null;
      if (L && this.dummy.ai && LESSON_AI[L.id]) Object.assign(this.dummy.ai.lv, LESSON_AI[L.id]);
    },

    refresh() {
      const free = !this.tut || this.finished;
      $('trOpts').hidden = !free;
      document.querySelectorAll('[data-beh]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.beh === (this.dummy ? this.dummy.beh : this.beh))));
      $('trInf').setAttribute('aria-pressed', String(this.opts.infHp || (this.tut && !this.finished)));
      $('trKi').setAttribute('aria-pressed', String(this.opts.fullKi));
      if (this.tut) {
        const L = STR.lessons, done = save.p.lessons;
        $('trLessons').innerHTML = L.map((l, i) => `<li class="${done.includes(l.id) ? 'ok' : ''}${i === this.lesson && !this.finished ? ' cur' : ''}" data-l="${i}">${esc(l.t)}</li>`).join('');
        $('trLessons').querySelectorAll('[data-l]').forEach((li) => (li.onclick = () => { this.finished = false; this.startLesson(+li.dataset.l); }));
      }
    },

    startLesson(i, silent) {
      const L = STR.lessons[i]; if (!L) return;
      this.lesson = i; this.ev = {}; this.acc = 0; this.doneT = 0;
      this.setDummy(LESSON_BEH[L.id]);
      if (!silent) this.reset();
      $('trTip').hidden = false;
      this.renderTip();
      this.refresh();
    },
    renderTip() {
      const i = this.lesson, L = STR.lessons[i]; if (!L) return;
      const sp = this.special(this.G.F[0].ch), old = $('trProg');
      const d = STR.pickT(L.d, STR.lessonsTouch && STR.lessonsTouch[L.id]);
      $('trTip').innerHTML = `<small>${esc(STR.train.lessonOf(i + 1, STR.lessons.length))}</small><b>${esc(L.t)}</b><span>${d.replace('{sp}', '<em><span class="k">' + esc(sp.kanji) + '</span> ' + esc(sp.name) + '</em>')}</span><i id="trProg" hidden></i>`;
      if (old && !old.hidden) { const pe = $('trProg'); pe.hidden = false; pe.style.cssText = old.style.cssText; }
    },

    completeLesson() {
      const L = STR.lessons[this.lesson];
      save.lessonDone(L.id);
      ND.toast(STR.toast.lesson(L.t), '練');
      ND.audio.taiko(0.7);
      this.doneT = 1.3;
      this.refresh();
    },

    tick(rdt) {
      const G = this.G;
      if (G.mode !== 'train') return;
      const [f1, f2] = G.F;
      const tutOn = this.tut && !this.finished;
      if (this.opts.infHp || tutOn) for (const f of G.F) if (!f.dead && f.hp < f.maxHp && f.sinceHit > 0.7) f.hp = f.maxHp;
      const L = tutOn ? STR.lessons[this.lesson] : null;
      if (this.opts.fullKi || (L && L.id === 'special')) f1.ki = 100;
      if (!L || G.phase !== 'fight') return;
      if (this.doneT > 0) {
        this.doneT -= rdt;
        if (this.doneT <= 0) {
          if (this.lesson + 1 < STR.lessons.length) this.startLesson(this.lesson + 1);
          else this.finishTutorial();
        }
        return;
      }
      let ok = false, prog = null;
      switch (L.id) {
        case 'walk':
          if (f1.state === 'move' && f1.onGround) this.acc += Math.abs(f1.vx) * rdt;
          prog = Math.min(1, this.acc / 420); ok = prog >= 1; break;
        case 'combo': ok = f1.state === 'atk' && f1.atkName === 'light3' && f1.hitDone; break;
        case 'heavy': ok = f1.state === 'atk' && f1.atkName === 'heavy' && f1.hitDone; break;
        case 'gbreak': ok = f2.state === 'gbreak'; prog = Math.min(1, f2.posture / 100); break;
        case 'block': ok = f1.state === 'block' || f1.state === 'parry'; break; // tam zamanında basan oyuncu savuşturur: o da gard sayılır
        case 'parry': ok = f1.state === 'parry'; break;
        case 'counter': ok = !!this.ev.counter; break;
        case 'rally': { const turns = G.rally.turns ? G.rally.turns[0] : 0; prog = Math.min(1, turns / 2); ok = turns >= 2; break; }
        case 'special': ok = !!this.ev.special; break;
      }
      const pe = $('trProg');
      if (pe) { pe.hidden = prog == null; if (prog != null) pe.style.setProperty('--p', (prog * 100).toFixed(0) + '%'); }
      if (ok) this.completeLesson();
    },

    finishTutorial() {
      this.finished = true;
      save.tutorialDone();
      ND.toast(STR.toast.tutDone, '練');
      ND.audio.gong();
      this.beh = 'idle'; if (this.dummy) this.dummy.set('idle');
      $('trTip').innerHTML = `<b>${esc(STR.toast.tutDone)}</b><span>${esc(STR.train.done)}</span>`;
      setTimeout(() => { if (this.finished && this.G.mode === 'train') $('trTip').hidden = true; }, 6000);
      ND.arcade.refreshMenu();
      this.refresh();
    },

    onKey(e) {
      const G = this.G;
      if (G.mode !== 'train' || G.paused || e.repeat) return false;
      if (e.code === 'KeyH') { this.togglePanel(); return true; }
      if (e.code === 'Backspace') { this.reset(); return true; }
      const d = /^Digit([1-4])$/.exec(e.code);
      if (d) { this.setBeh(Object.keys(STR.train.beh)[+d[1] - 1]); return true; }
      return false;
    },
  };

  // Owner test shortcut: opening the game with #unlock-all (or #hepsi) unlocks every fighter and arena.
  // Only on the local portal (localhost, the claude.ai test link, own site) - never on CrazyGames/Poki/Yandex.
  const testUnlock = () => {
    try {
      if (ND.portalName !== 'local' || !/^#(unlock-all|hepsi)$/i.test(location.hash || '')) return;
      if (ND.CHARS.every((c) => save.isCharUnlocked(c.id)) && ND.ARENAS.every((a) => save.isArenaUnlocked(a.id))) return;
      save.unlockAll();
      if (ND.arcade && ND.arcade.G) ND.arcade.refreshMenu();
      if (ND.toast) ND.toast('Test: all fighters and arenas unlocked', '忍');
    } catch (e) { /* storage unavailable */ }
  };
  window.addEventListener('hashchange', testUnlock);
  window.addEventListener('load', testUnlock);
})(window.ND);
