// Gölge Düellosu — ikinci kadro (Tora, Jin, Mai, Tsubame): arcade sözleri, özel eşleşmeler ve sonlar.
// arcade.js'ten SONRA yüklenir; arcade.js'e dokunmadan ND.STR tablolarını genişletir.
// Karakter verisi characters.js'te, mekanikler fighter.js + specials.js'te: bu dosya yüklenmese de dövüşler çalışır,
// yalnızca arcade metinleri varsayılana düşer.
(function (ND) {
  'use strict';
  if (!ND || !ND.STR) return;
  const STR = ND.STR;
  const R2 = ['tora', 'jin', 'mai', 'tsubame'];

  // Kilitler artık onurla (honor.js: eşik → meydan okuma → düello); bu dosya yalnız metinleri taşır
  // Arcade'de rakibin "ev" arenası (arcade.js HOME kapalı; entegrasyon için öneri, bkz. rapor)
  const HOME = { tora: 'waterfall', jin: 'temple', mai: 'market', tsubame: 'rain' };
  STR.roster2 = { ids: R2, home: HOME };
  // Karaktere özel hareket notları (antrenman / seçim ekranında gösterilebilir; entegrasyon isteğe bağlı)
  STR.roster2.notes = {
    tora: ['Hafif: orta mesafede zincir kamçısı, yakında orak', 'Ağır: zinciri fırlatır; isabet ederse rakibi yanına çeker', 'Seri sonu: rakip uzaktaysa zincirle çekip yaklaştırır'],
    jin: ['Asanın iki ucu da vurur; darbeler künttür, kan dökmez', 'Üçüncü vuruş ve ağır süpürme yere serer', 'Gard tutarken denge daha yavaş dolar'],
    mai: ['Savuşturma penceresi daha geniş', 'Gard tutarken yelpazeler mermileri geri yollar', 'Ağır: rüzgâr dalgası rakibi iter, mermileri savurur'],
    tsubame: ['Ağır: yayla ok atar; basılı tutarsan güçlü atış', 'Fırlatma: geriye ters takla atıp havadan ok yollar', 'Ok bitince ağır saldırı tantō ile yapılır; oklar zamanla dolar'],
  };

  // ---------------------------------------------------------------- DÖVÜŞ ÖNCESİ SÖZLER
  // open = önce konuşan (rakip), reply = cevap veren (oyuncu), boss = son patrona söylenen
  Object.assign(STR.talk || (STR.talk = {}), {
    tora: {
      open: ['Zincirimin ucunda kaç kişi sallandı, bilmiyorum. Sen de say.', 'Av başladı. Kaçabilirsin, ama zincir uzun.', 'Kaplan pusuda bekler derler. Ben beklemem!'],
      reply: ['Hırrr… İyi. Kaçmayan avı severim.', 'Yaklaşmana gerek yok. Ben seni çekerim.', 'Sözlerin uzun, zincirim daha uzun.'],
      boss: 'Şura, sen de bir avsın. Sadece biraz daha büyük.',
    },
    jin: {
      open: ['Kan dökmeye gelmedim. Yalnızca seni biraz yere yatıracağım.', 'Asa sabırla konuşur. Dinle.', 'Yolun öfkeyle dolu, genç savaşçı. Yükünü hafifletelim.'],
      reply: ['Peki. Ama sonra birlikte çay içeceğiz.', 'Öfken sana ağır geliyor. Bırak da ben taşıyayım.', 'Kılıç keser; asa uyandırır.'],
      boss: 'Şura, içindeki iblisi yenmek için seni öldürmem gerekmiyor. Durdurmam yeter.',
    },
    mai: {
      open: ['Sahne hazır, perde açık. Senin rolün: yenilen.', 'Yelpazem açılınca gözlerini kapatma; gösteriyi kaçırırsın.', 'Her adımım bir nota. Tempoyu tutabilir misin?'],
      reply: ['Ne kaba bir giriş. Neyse, zarafet ikimize de yeter.', 'Rüzgâr benden yana esiyor, tatlım.', 'Alkış istemem. Düşüşün yeter.'],
      boss: 'Şura, bu son dansta sahneyi kimseyle paylaşmam.',
    },
    tsubame: {
      open: ['Aramızdaki mesafe benim silahım.', 'Kırlangıç bir kez ıskalar. İkincisinde dönüp vurur.', 'Rüzgârı ölçtüm. Okum yolunu biliyor.'],
      reply: ['Yaklaşmak mı istiyorsun? Dene.', 'Nefesini tut. Ok yoldayken ses çıkmaz.', 'Gözüm sende. Okum da.'],
      boss: 'Şura, gökyüzünde saklanacak yer yok. Okum seni bulur.',
    },
  });

  // ---------------------------------------------------------------- ÖZEL EŞLEŞMELER
  // Anahtar: iki kimlik alfabetik sırayla 'a|b'. Satırlar yazıldığı sırayla söylenir.
  Object.assign(STR.pairs || (STR.pairs = {}), {
    'kuro|tora': [['tora', 'Dağ, ha? Dağlarda da kaplan yaşar.'], ['kuro', 'Kaplanlar dağda ölür.']],
    'tora|yuki': [['tora', 'Tilki! Kaplanın önünde tilki ne yapar?'], ['yuki', 'Kaçar. Sonra kaplanın kuyruğunu dondurur.']],
    'jin|tora': [['tora', 'Zincirim asana dolanınca ne yapacaksın, keşiş?'], ['jin', 'Çözerim. Düğüm çözmek benim işim.']],
    'jin|ren': [['ren', 'Keşiş mi? Dua etmeye başla, kel kafa!'], ['jin', 'Senin için zaten ediyorum, oni. İçindeki ateş seni de yakıyor.']],
    'jin|tetsu': [['tetsu', 'Bir keşişin savaş alanında ne işi var?'], ['jin', 'Senin gibi zırhlı yürekler için geldim, Tetsu. Zırhın ağır, yüreğin daha ağır.']],
    'akane|jin': [['akane', 'Yolumdan çekil, keşiş. Bu intikam benim.'], ['jin', 'İntikam bir zincirdir, Akane. Önce onu kıralım.']],
    'hana|mai': [['hana', 'Aa, bir dansçı daha! Bakalım kim daha hızlı dönecek!'], ['mai', 'Hız zarafetin gölgesidir, Hana. Sana ışığı göstereyim.']],
    'kage|mai': [['mai', 'Gölgeler de dans eder mi, Kage?'], ['kage', 'Yalnızca ışık söndüğünde.']],
    'aoi|tsubame': [['tsubame', 'Rüzgârın okumu saptırabilir mi, Aoi?'], ['aoi', 'Rüzgâr kimseyi tutmaz, Tsubame. Okunu da.']],
    'kage|tsubame': [['kage', 'Göremediğini vuramazsın, okçu.'], ['tsubame', 'Gölge ışıkla gelir. Ben de.']],
    'mai|tsubame': [['mai', 'Uzaktan bakmak ayıptır, okçu. Gel de yakından izle.'], ['tsubame', 'Sahneni yakından görmek için okumu gönderirim.']],
  });

  // ---------------------------------------------------------------- SONLAR (arcade bitince)
  Object.assign(STR.endings || (STR.endings = {}), {
    tora: ['Şura’nın düşüşünü zincirinin şangırtısı haber verdi.', 'Tora kırık maskeyi zincirine taktı: yeni bir av hatırası.', 'O günden sonra ormanda kimse kaplan kükremesini masal sanmadı.'],
    jin: ['Jin, yere düşen Şura’nın yanına diz çöktü ve onun için dua etti.', 'Tapınağa dönerken asasına bir damla bile kan bulaşmamıştı.', 'O gece dağda yeniden çanlar çaldı; bu kez yas için değil, barış için.'],
    mai: ['Şura düştüğünde Mai yelpazesini kapattı ve eğilip selam verdi.', 'Gece çarşısında o danstan hâlâ söz ediliyor.', 'Perde kapandı. Ama Mai sahneden hiç inmedi.'],
    tsubame: ['Son ok kale çatısında sessizce titredi.', 'Tsubame yayını omzuna aldı ve güneye uçan kırlangıçları izledi.', 'Bir daha görülmedi; geriye yalnızca hedefe saplanmış, tüyleri renkli oklar kaldı.'],
  });
})(window.ND);
