// Gölge Düellosu — karakterler: silah, istatistik, renk, aksesuar
(function (ND) {
  'use strict';
  const rim = 'rgba(168,180,220,.55)', rimDim = 'rgba(120,130,175,.3)';
  const pal = (o) => Object.assign({ rim, rimDim, skin: '#c89c81' }, o);

  ND.CHARS = [
    {
      id: 'akane', name: 'AKANE', kanji: '茜', title: 'Kızıl Kılıç',
      desc: 'Iaijutsu ustası. Kılıcı kınında bekler, her kesiği kından çekerek vurur; çekiş duruşuyla gelen darbeyi yakalar.',
      // iai: the katana rests in a hip scabbard between strikes (fighter.sheathed, skeleton sayaHip); ivory kimono,
      // crimson hakama and tasuki, bare face with the hair tied low (acc 'akane')
      weapon: 'Katana (iai)', blade: 96, handle: 24, spd: 1.03, dmg: 1, hp: 108, walk: 1, ammo: 3, acc: 'akane', iai: true,
      poses: { stance: 'ak_stance', guard: 'ak_guard' },
      stats: { hiz: 3, guc: 4, menzil: 3, can: 4 },
      col: pal({ cloth: '#c9bfb0', clothHi: '#e6ddcf', clothDark: '#877e72', wrap: '#3b2e34', wrapDark: '#251d21', accent: '#d8392d', accentDark: '#7c1d17', ui: '#e04a3c', hakama: '#8a1d1b', hakamaDark: '#5a1311', skin: '#d4a78d' }),
      alt: pal({ cloth: '#262a33', clothHi: '#3a404c', clothDark: '#171a20', wrap: '#3d3629', wrapDark: '#27221a', accent: '#e0a02d', accentDark: '#7a5415', ui: '#e8a93a', hakama: '#c8bfae', hakamaDark: '#8c8476', skin: '#d4a78d' }),
    },
    {
      id: 'aoi', name: 'AOI', kanji: '葵', title: 'Mavi Rüzgâr',
      desc: 'Tek elle tachi tutan rüzgâr eskrimcisi. Uzun menzilli dürtüşler ve rüzgâr adımlarıyla mesafeyi bir anda kapatır.',
      // kaze-ryū: one-handed tachi held point-forward, off hand behind the back; flowing haori (two wide cloth
      // ropes, col.haori) and a tall tied topknot (acc 'aoi')
      weapon: 'Tachi', blade: 104, handle: 22, spd: 1.03, dmg: 1.02, hp: 104, walk: 1.08, ammo: 3, acc: 'aoi',
      poses: { stance: 'ao_stance', guard: 'ao_guard' }, ai: { cmd: 0.45 },
      stats: { hiz: 4, guc: 2, menzil: 4, can: 3 },
      // cloth = the light haori (torso, sleeves); hakama and hood stay dark
      col: pal({ cloth: '#5f7d9e', clothHi: '#8aa6c4', clothDark: '#3a4f69', wrap: '#2b3445', wrapDark: '#1a202c', accent: '#2f97dc', accentDark: '#164c74', ui: '#3ea8ea', skin: '#c29a83',
        hakama: '#151a24', hakamaDark: '#0c0f15', haori: '#4d6886', hood: { cloth: '#13171f', clothHi: '#232b3a', clothDark: '#0c0f15' } }),
      alt: pal({ cloth: '#5f8f78', clothHi: '#87b59e', clothDark: '#3a5c4c', wrap: '#2a3a31', wrapDark: '#1a241f', accent: '#3fcf8e', accentDark: '#1a6a45', ui: '#4bd69a', skin: '#c29a83',
        hakama: '#141d18', hakamaDark: '#0c120f', haori: '#4b7462', hood: { cloth: '#141d18', clothHi: '#223229', clothDark: '#0c120f' } }),
    },
    {
      id: 'kuro', name: 'KURO', kanji: '黒', title: 'Kara Dağ',
      desc: 'Uzun nodachi taşır. Yavaş ama menzili geniş, darbeleri yıkıcı.',
      weapon: 'Nodachi', blade: 126, handle: 32, spd: 0.8, dmg: 1, hp: 95, walk: 0.8, ammo: 2, acc: 'kasa',
      stats: { hiz: 1, guc: 5, menzil: 5, can: 3 },
      col: pal({ cloth: '#16161a', clothHi: '#28282f', clothDark: '#0e0e11', wrap: '#35343a', wrapDark: '#222126', accent: '#8b6fd6', accentDark: '#43336f', ui: '#9d83ea', skin: '#b98f76' }),
      alt: pal({ cloth: '#1a1512', clothHi: '#2f2620', clothDark: '#110d0b', wrap: '#3c3129', wrapDark: '#261f1a', accent: '#c8733a', accentDark: '#6b3714', ui: '#dd8a4c', skin: '#b98f76' }),
    },
    {
      id: 'yuki', name: 'YUKI', kanji: '雪', title: 'Kar Tilkisi',
      desc: 'Kısa kodachi ile çok hızlı saldırır. Bol shuriken, uzun atkı.',
      weapon: 'Kodachi', blade: 70, handle: 18, spd: 1.26, dmg: 0.85, hp: 88, walk: 1.18, ammo: 5, acc: 'scarf',
      stats: { hiz: 5, guc: 2, menzil: 1, can: 2 },
      col: pal({ cloth: '#1b1d22', clothHi: '#2e323b', clothDark: '#111317', wrap: '#3a3e48', wrapDark: '#24272e', accent: '#e8eef6', accentDark: '#8a94a6', ui: '#dfe8f5', skin: '#d2a78d' }),
      alt: pal({ cloth: '#1e171c', clothHi: '#34272f', clothDark: '#140f13', wrap: '#40303a', wrapDark: '#291f25', accent: '#f08bb4', accentDark: '#8a3a5b', ui: '#f59bc0', skin: '#d2a78d' }),
    },
    {
      id: 'hana', name: 'HANA', kanji: '花', title: 'Kiraz Dansı',
      desc: 'Kunoichi. İki tantō ile dans eder gibi dövüşür; en hızlı el, en kısa menzil.',
      weapon: 'İkiz Tantō', type: 'tanto', twin: true, blade: 58, handle: 16, spd: 1.32, dmg: 0.88, hp: 92, walk: 1.2, ammo: 4, acc: 'ponytail',
      stats: { hiz: 5, guc: 2, menzil: 1, can: 2 },
      col: pal({ cloth: '#1d141a', clothHi: '#33222d', clothDark: '#130d11', wrap: '#3f2c37', wrapDark: '#281c23', accent: '#ec5a9a', accentDark: '#7d2350', ui: '#f06aa5', skin: '#d4a58c' }),
      alt: pal({ cloth: '#121a1a', clothHi: '#1f2d2c', clothDark: '#0b1111', wrap: '#2a3b3a', wrapDark: '#1a2524', accent: '#35c2b0', accentDark: '#15645a', ui: '#45d4c1', skin: '#d4a58c' }),
    },
    {
      id: 'tetsu', name: 'TETSU', kanji: '鉄', title: 'Demir Kale',
      desc: 'Zırhlı samuray. Naginata ile en uzun menzile sahip; darbeler onu zor sarsar.',
      weapon: 'Naginata', type: 'naginata', blade: 150, handle: 46, spd: 0.8, dmg: 1.06, hp: 100, walk: 0.8, ammo: 1, acc: 'kabuto', stunMul: 0.75,
      stats: { hiz: 1, guc: 5, menzil: 5, can: 4 },
      col: pal({ cloth: '#1a1712', clothHi: '#2e2920', clothDark: '#110f0b', wrap: '#3a3226', wrapDark: '#241f18', accent: '#d7a53c', accentDark: '#6e5117', ui: '#e2b24a', skin: '#b8906f', armor: '#2a2622' }),
      alt: pal({ cloth: '#14171b', clothHi: '#232830', clothDark: '#0d0f12', wrap: '#2e343d', wrapDark: '#1d2127', accent: '#a9c1d6', accentDark: '#4b6275', ui: '#b7cde0', skin: '#b8906f', armor: '#262a30' }),
    },
    {
      id: 'ren', name: 'REN', kanji: '蓮', title: 'Kızıl Oni',
      desc: 'Oni maskeli serseri. Kılıcı omzunda; dirsek, diz, omuz ve kafayla dövüşür, gardları ezer.',
      weapon: 'Uchigatana', type: 'katana', blade: 90, handle: 26, spd: 1, dmg: 1.05, hp: 106, walk: 1, ammo: 3, acc: 'oni', post: 1.35, kickMul: 1.5,
      poses: { stance: 'rn_stance', guard: 'rn_guard' },
      stats: { hiz: 3, guc: 4, menzil: 3, can: 4 },
      col: pal({ cloth: '#1b1515', clothHi: '#2f2424', clothDark: '#120e0e', wrap: '#3c2f2c', wrapDark: '#261e1c', accent: '#e8743b', accentDark: '#7a3414', ui: '#f08a4b', skin: '#c4957a', mask: '#b3261e' }),
      alt: pal({ cloth: '#16171a', clothHi: '#26282d', clothDark: '#0e0f11', wrap: '#33353b', wrapDark: '#212226', accent: '#c9d24a', accentDark: '#5e6419', ui: '#d6de5c', skin: '#c4957a', mask: '#2f4f8a' }),
    },
    {
      id: 'kage', name: 'KAGE', kanji: '影', title: 'Gölgenin Kendisi',
      desc: 'Kapüşonlu gölge. Ninjatō’yu ters tutar; gölge adımları, aldatmalar ve sis bombasıyla dövüşür.',
      weapon: 'Ninjatō', type: 'ninjato', blade: 84, handle: 22, spd: 1.08, dmg: 1.02, hp: 100, walk: 1.12, ammo: 4, acc: 'hood', dodge: 1.3, shadow: true,
      poses: { stance: 'kg_stance', guard: 'kg_guard' },
      stats: { hiz: 4, guc: 3, menzil: 2, can: 3 },
      col: pal({ cloth: '#0d0e11', clothHi: '#1b1d23', clothDark: '#08090b', wrap: '#23262d', wrapDark: '#15171b', accent: '#7be08f', accentDark: '#2a6b38', ui: '#8ee6a0', skin: '#a98a78', rim: 'rgba(140,170,160,.45)' }),
      alt: pal({ cloth: '#0f0d12', clothHi: '#1e1a24', clothDark: '#09080b', wrap: '#28222f', wrapDark: '#18141c', accent: '#b07cff', accentDark: '#4e2f82', ui: '#bc8fff', skin: '#a98a78', rim: 'rgba(160,150,190,.45)' }),
    },
    // --- ikinci kadro (roster2): özel silahlar. Mekanikler: fighter.js genel kancaları + specials.js (ND.MOVES, ND.wpnState)
    {
      id: 'tora', name: 'TORA', kanji: '虎', title: 'Zincirli Kaplan',
      desc: 'Kusarigama ustası. Zincirli ağırlıkla orta mesafeden kamçılar, ağır saldırısıyla rakibi çekip orakla bitirir.',
      weapon: 'Kusarigama', type: 'kusarigama', blade: 46, handle: 12, spd: 0.97, dmg: 1.15, hp: 106, walk: 0.98, ammo: 2, acc: 'tora',
      poses: { stance: 'tr_stance', guard: 'tr_guard' }, ai: { ideal: 215 },
      stats: { hiz: 3, guc: 3, menzil: 5, can: 4 },
      col: pal({ cloth: '#1d1712', clothHi: '#33281e', clothDark: '#120e0b', wrap: '#3d3024', wrapDark: '#271e17', accent: '#f6cf1d', accentDark: '#8a5a10', ui: '#f8d83a', skin: '#c0916f' }),
      alt: pal({ cloth: '#171b20', clothHi: '#27303a', clothDark: '#0e1115', wrap: '#303a46', wrapDark: '#1e252d', accent: '#5fd8e6', accentDark: '#1f6a78', ui: '#6fe2ef', skin: '#c0916f' }),
    },
    {
      id: 'jin', name: 'JIN', kanji: '仁', title: 'Demir Asa Keşişi',
      desc: 'Bō asalı keşiş. İki ucu da vuran uzun asa, sağlam gard ve yere seren künt darbeler; kan dökmez, kemik sarsar.',
      weapon: 'Bō', type: 'bo', blade: 96, handle: 72, spd: 0.93, dmg: 1, hp: 106, walk: 0.94, ammo: 2, acc: 'monk', blunt: true, guardMul: 0.8, stunMul: 0.85,
      poses: { stance: 'jn_stance', guard: 'jn_guard' },
      stats: { hiz: 2, guc: 4, menzil: 4, can: 4 },
      col: pal({ cloth: '#6a3c16', clothHi: '#8c5424', clothDark: '#43250c', wrap: '#3a2c22', wrapDark: '#261c15', accent: '#9c2f2a', accentDark: '#561511', ui: '#ffb347', skin: '#c89479', glove: '#b8876a', tabi: '#2a211b', rim: 'rgba(230,190,150,.45)' }),
      alt: pal({ cloth: '#2c3038', clothHi: '#424855', clothDark: '#1b1e24', wrap: '#2a2d33', wrapDark: '#1a1c21', accent: '#e6a23c', accentDark: '#83561a', ui: '#c9d3e6', skin: '#c89479', glove: '#b8876a', tabi: '#1c1d22' }),
    },
    {
      id: 'mai', name: 'MAI', kanji: '舞', title: 'Yelpaze Dansçısı',
      desc: 'Savaş yelpazeli kunoichi. Çok hızlı ve geniş savuşturma penceresi; yelpazesi mermileri geri yollar, rüzgârı rakibi iter.',
      weapon: 'İkiz Tessen', type: 'tessen', twin: true, blade: 44, handle: 8, spd: 1.2, dmg: 1.04, hp: 100, walk: 1.15, ammo: 3, acc: 'mai', parryWin: 0.25, reflect: true,
      poses: { stance: 'mi_stance', guard: 'mi_guard' },
      stats: { hiz: 5, guc: 2, menzil: 2, can: 3 },
      col: pal({ cloth: '#1f1420', clothHi: '#352338', clothDark: '#140d15', wrap: '#402a44', wrapDark: '#2a1b2c', accent: '#e04fd8', accentDark: '#7a2276', ui: '#ec63e4', skin: '#d8ab93' }),
      alt: pal({ cloth: '#2a1012', clothHi: '#431c20', clothDark: '#1b0a0c', wrap: '#4a2226', wrapDark: '#301517', accent: '#f0d9a0', accentDark: '#8a7442', ui: '#f5e2b0', skin: '#d8ab93' }),
    },
    {
      id: 'tsubame', name: 'TSUBAME', kanji: '燕', title: 'Kırlangıç Okçu',
      desc: 'Yay ve tantō taşır. Uzaktan ok atar (ağır saldırıyı basılı tut: güçlü atış), yakına gelene ters takla atıp havadan ok yollar.',
      weapon: 'Yumi + Tantō', type: 'yumi', blade: 58, handle: 16, spd: 1.12, dmg: 0.96, hp: 94, walk: 1.1, ammo: 5, acc: 'tsubame',
      poses: { stance: 'ts_stance', guard: 'ts_guard' }, ai: { ideal: 330, zoner: true },
      stats: { hiz: 4, guc: 2, menzil: 5, can: 2 },
      col: pal({ cloth: '#121a22', clothHi: '#1f2c39', clothDark: '#0b1016', wrap: '#27384a', wrapDark: '#18232f', accent: '#1fd0ea', accentDark: '#136a78', ui: '#45dcef', skin: '#c99d82' }),
      alt: pal({ cloth: '#221a14', clothHi: '#382b21', clothDark: '#15100c', wrap: '#43342a', wrapDark: '#2b2119', accent: '#b5dc4a', accentDark: '#566c1c', ui: '#c3e862', skin: '#c99d82' }),
    },
  ];
  ND.charById = (id) => ND.CHARS.find((c) => c.id === id) || ND.CHARS[0];

  // Champion colors: the Monthly Tournament winner's palette for the ninja they won with (never sold, never earned
  // any other way). Gilded robe, lacquer-black sash and trousers, crimson accents, a gold rim light; skin and the
  // ninja's own shapes stay. Visibly different from both the original (col) and the Legacy (alt) palettes.
  // Built once per ninja on first use (the palette object is a cache key in skeleton.js).
  function champPal(c) {
    const o = Object.assign({}, c, {
      rim: 'rgba(255,214,120,.62)', rimDim: 'rgba(200,150,60,.34)',
      cloth: '#c99a3e', clothHi: '#f1d58a', clothDark: '#7a5518',
      wrap: '#18110e', wrapDark: '#0b0706',
      accent: '#d81f30', accentDark: '#6a0a13', ui: '#ffd35a',
    });
    if (c.hakama) { o.hakama = '#1b1310'; o.hakamaDark = '#0d0908'; }
    if (c.haori) o.haori = '#b3862f';
    if (c.hood) o.hood = { cloth: '#1c1511', clothHi: '#33271c', clothDark: '#0e0a08' };
    if (c.armor) o.armor = '#6b4d17';
    if (c.mask) o.mask = '#a8101d';
    if (c.glove) o.glove = '#2b1d12';
    if (c.tabi) o.tabi = '#15100d';
    return o;
  }
  // Palette for an appearance choice: false = original, true = Legacy colors, 'champ' = Champion colors
  ND.palOf = (ch, look) => (look === 'champ' ? ch.champ || (ch.champ = champPal(ch.col)) : look ? ch.alt : ch.col);

  ND.ARENAS = [
    { id: 'temple', name: 'Ay Işığı Tapınağı', kanji: '月' },
    { id: 'rain', name: 'Fırtınalı Bambu Ormanı', kanji: '嵐' },
    { id: 'snow', name: 'Karlı Zirve', kanji: '雪' },
    { id: 'village', name: 'Yanan Köy', kanji: '炎' },
    { id: 'market', name: 'Gece Çarşısı', kanji: '市' },
    { id: 'waterfall', name: 'Şelale', kanji: '滝' },
    { id: 'castle', name: 'Kale Çatısı', kanji: '城' },
  ];
})(window.ND);
