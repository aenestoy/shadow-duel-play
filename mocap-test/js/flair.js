// Shadow Duel — flair: cosmetic Shadow Pass rewards that are not costumes (victory poses, hit effects, counter slash
// colours, ki auras, KO finishes, VS name cards, arena variants, menu music). Drawing and sound only.
//
// ================================================================ SPEC (for the Pass side: js/level.js, js/pass.js)
// Catalogue: ND.FLAIR[kind][id] (ids are stable, they go into saves and the server). Kinds and ids:
//   pose   victory pose after a won round      pose_tenchi pose_rei pose_hiza pose_katsugi pose_kissaki
//   hitfx  hit sparks + ink colours             hitfx_kinpaku hitfx_aizome hitfx_sakura hitfx_kitsunebi hitfx_raijin
//   slash  counter (kaeshi-waza) slash theme    slash_kin slash_sumi slash_hana slash_rai
//   aura   ki aura (ki technique, round start)  aura_kitsunebi aura_raiun aura_hana aura_gekko
//   ko     KO finish on the final hit           ko_enso ko_hanafubuki ko_raiko ko_mikazuki
//   card   VS screen name card background       card_seigaiha card_yozakura card_ryu card_tsukiyo card_asanoha
//   arena  arena variant (needs its base arena) arena_temple_snow arena_rain_moon arena_snow_night arena_market_rain
//   music  menu music variant                   music_haru music_yuki music_matsuri
// The Season 1 final costume is a drawn costume, not flair: ND.COSTUMES.pass1_akane (js/costumes-pass.js, Akane only).
// Wear it like the other drawn costumes: palette = ND.costumePal(ch.col, 'pass1_akane') (ND.passCostume(ch) does it).
//
// API (ND.flair):
//   set(side, { pose, hitfx, slash, aura, ko, card })  side 0 = 1P / left fighter (ND.game.F[0]), 1 = 2P / right. Call it
//                                before every match (and before the VS screen shows: the cards are put on at once);
//                                unknown or empty ids = the default look. Both sides may wear flair (CPU, ranked, ghosts).
//   get(side)                    → a copy of what that side wears ({ pose: id|null, ... })
//   clear()                      both sides back to the default look
//   arena(arenaId, variantId|null) the variant drawn for that arena (null: the plain arena); the scene changes at once
//                                when that arena is on screen. variant(arenaId) → the variant id or null.
//                                base(variantId) → its arena id ('temple' for arena_temple_snow). The base arena must be
//                                unlocked to use a variant: check ND.save.isArenaUnlocked(base) before offering it.
//   music(id|null)               the menu music variant (null: the usual menu music); takes effect at the next bar
//   ids(kind)                    → the ids of a kind; kinds → the kind list; kind(id) → the kind of an id or null
//   name(id, lang?)              → display name (en tr de es fr pt ru; lang defaults to the game's language, else English)
//   kindName(kind, lang?)        → the wardrobe slot's name ('Victory pose', ...)
//   preview(kind, id, canvasOrEl, opts?) → draws a small preview into the canvas (or a new canvas appended to the
//                                element); opts: { w, h (css px, default 160×160), dpr, fighter: 'akane', look, t, bg }.
//                                music has no picture (a small music mark). Returns the canvas.
// Where the hooks live (each is one guarded line, `ND.flair && ...`; nothing here reads or writes the fight's state):
//   js/anim.js       A.present            display pose of a fighter in state 'win' (pose)
//   js/fighter.js    takeHit / die        hitBegin / hitEnd around the hit's effects (hitfx), onKO (ko)
//   js/scene.js      fx draw / update     ink colours per particle (p.ic / p.ir), flair particles (k 'F'); setTheme (arena)
//   js/game.js       onSpecial, the round's "Fight!" (aura), renderScene drawBehind (aura glow), showStage (card)
//   js/kaeshi-cine.js counterStart / counterHit / drawSlash / banner / afterimages (slash)
//   js/music.js      play('menu')         menu variant (music)
//   js/ranked.js     renderVs             card on the ranked VS card; js/arcade.js ending preview uses the victory pose
// What the Pass side does:
//   1. register every id above in LEVEL.ITEMS with the kinds above (kind: 'pose' | 'hitfx' | ... | 'music'); the names
//      come from ND.flair.name(id) (or copy them into i18n-pass.js); pictures from ND.flair.preview(kind, id, el)
//   2. add one wardrobe slot per kind in the Profile (equip one id per kind or none); arena: one choice per base arena
//   3. at match start call ND.flair.set(side, worn) for each side (your own save for your side; the opponent's synced
//      choice in online / ranked / ghost fights; CPU: nothing or a pick), ND.flair.arena(arena, variant) for the
//      match's arena, and ND.flair.music(id) whenever the menu music choice changes (and once at start-up)
//   4. sync what is worn so the opponent sees it (online / ranked: send the six ids + arena variant with the picks).
//      Both devices must agree on the arena variant only for the picture: wind and everything the fight reads stay the
//      base arena's, so a mismatch never desyncs the fight.
// Determinism: particles use Math.random (never ND.rng); poses change only the drawn body (js/anim.js), never f.pose.
(function (ND) {
  'use strict';
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const pose = ND.pose, PO = ND.POSES, E = ND.M.ease;
  const mk = pose && pose.mk ? pose.mk : (o) => Object.assign({}, PO.stance, o);
  const low = () => !!(ND.gfx && ND.gfx.tier === 'low');
  const G = () => ND.game;
  // the unwrapped fx functions (game.js records the wrapped ones for the KO replay; ours record their own event)
  const raw = (n) => (ND.fx['_' + n] || ND.fx[n]).bind(ND.fx);
  const rgba = (c, a) => `rgba(${c},${a})`;

  // ================================================================ VICTORY POSES (pose)
  // keys after the shared start (the chiburi flick, 0–0.5 s of state 'win', the fight's own pose): [t, pose, ease]
  const CHI = PO.chiburi;
  const P = {
    tenchiA: mk({ hx: -2, hy: -76, lean: 0.2, hd: 0.14, ax: 10, ay: 44, sw: 1.9, grip: 0, gx: -4, gy: 40, f1x: 18, f2x: -20 }),
    tenchi: mk({ hx: 0, hy: -88, lean: -0.06, hd: -0.3, ax: 4, ay: -57, sw: -1.62, grip: 0, gx: -8, gy: 40, f1x: 16, f2x: -18 }),
    reiUp: mk({ hx: 0, hy: -87, lean: 0.02, hd: -0.04, ax: 8, ay: 52, sw: 1.62, grip: 0, gx: 8, gy: 18, f1x: 10, f2x: -12 }),
    rei: mk({ hx: -6, hy: -88, lean: 0.5, hd: 0.42, ax: 6, ay: 50, sw: 1.7, grip: 0, gx: 10, gy: 16, f1x: 8, f2x: -10 }),
    hiza: mk({ hx: -6, hy: -50, lean: 0.1, hd: -0.04, ax: 32, ay: 36, sw: 1.5, grip: 0, gx: 22, gy: 34, f1x: 28, f2x: -30 }),
    katsugi: mk({ hx: 0, hy: -87, lean: -0.05, hd: -0.16, ax: 4, ay: -6, sw: -2.2, grip: 0, gx: -14, gy: 36, f1x: 22, f2x: -24 }),
    kissaki: mk({ hx: 6, hy: -74, lean: 0.22, hd: 0.05, ax: 54, ay: -4, sw: -0.08, grip: 0, gx: -38, gy: 14, f1x: 40, f2x: -38 }),
  };
  const POSE = {
    pose_tenchi: { end: P.tenchi, keys: [[0.5, CHI], [0.85, P.tenchiA, E.inOut], [1.25, P.tenchi, E.outBack]] },
    pose_rei: { end: P.rei, keys: [[0.5, CHI], [1.0, P.reiUp, E.inOut], [1.5, P.rei, E.inOut], [2.7, P.rei], [3.2, P.reiUp, E.inOut]] },
    pose_hiza: { end: P.hiza, keys: [[0.5, CHI], [1.2, P.hiza, E.inOut]] },
    pose_katsugi: { end: P.katsugi, keys: [[0.5, CHI], [1.1, P.katsugi, E.outCubic]] },
    pose_kissaki: { end: P.kissaki, keys: [[0.5, CHI], [0.95, P.kissaki, E.outQuart]] },
  };
  // (the select screen's preview poses read ND.POSES by name: the arcade ending shows the worn pose as 'fl_<id>')
  for (const id in POSE) PO['fl_' + id] = POSE[id].end;

  // ================================================================ HIT EFFECTS (hitfx)
  // spark / flash / ring: 'r,g,b' of those particles; ink + rim: the ink stroke, splash and droplets (and their stains);
  // cloth: the cut scraps; extra: flair particles thrown with the hit
  const HIT = {
    hitfx_kinpaku: { spark: '255,214,120', flash: '255,228,160', ring: '255,214,120', ink: '#b8862a', rim: 'rgb(255,236,186)', cloth: ['#e9c25a', '#c99a2e', '#fff0b8'], extra: 'leaf', ui: '#e9c25a' },
    hitfx_aizome: { spark: '150,190,255', flash: '175,205,255', ring: '160,195,255', ink: '#1f3a86', rim: 'rgb(170,200,255)', cloth: ['#1f3a86', '#2d4fa8', '#e8eefc'], extra: 'ripple', ui: '#4f7ce0' },
    hitfx_sakura: { spark: '255,175,210', flash: '255,205,225', ring: '255,180,210', ink: '#7a2950', rim: 'rgb(255,200,222)', cloth: ['#ffb7d2', '#f48fb8', '#fff0f5'], extra: 'petal', ui: '#ff8fbd' },
    hitfx_kitsunebi: { spark: '120,255,225', flash: '160,255,235', ring: '120,240,220', ink: '#0d4440', rim: 'rgb(150,255,230)', cloth: ['#0d4440', '#1d6b63', '#c8fff2'], extra: 'flame', ui: '#5fe8cf' },
    hitfx_raijin: { spark: '225,205,255', flash: '235,220,255', ring: '200,170,255', ink: '#2c1656', rim: 'rgb(214,186,255)', cloth: ['#2c1656', '#5a34a0', '#efe6ff'], extra: 'zap', ui: '#b48cff' },
  };
  const FLAME = { hitfx: ['110,240,220', '220,255,250'] };

  // ================================================================ COUNTER SLASH THEMES (slash)
  // per technique (kaeshi-cine.js TY ids) the theme's colour; edge: the ink band under it, core: the hot line on top
  const SLASH = {
    slash_kin: { col: { suriage: '255,206,96', harai: '255,232,150', nuki: '240,178,80', uchiotoshi: '255,160,64', sandan: '255,244,210' }, edge: 'rgb(56,34,6)', core: 'rgb(255,250,226)', extra: 'fleck', ui: '#ffd36a' },
    slash_sumi: { col: { suriage: '232,224,206', harai: '206,220,234', nuki: '222,210,236', uchiotoshi: '238,206,196', sandan: '248,244,236' }, edge: 'rgb(3,4,7)', edgeW: 2.5, core: 'rgb(255,255,255)', extra: 'brush', ui: '#e8e2d2' },
    slash_hana: { col: { suriage: '255,168,204', harai: '255,204,226', nuki: '236,150,222', uchiotoshi: '255,128,168', sandan: '255,226,238' }, edge: 'rgb(58,10,34)', core: 'rgb(255,246,250)', extra: 'petal', ui: '#ff9fc8' },
    slash_rai: { col: { suriage: '204,184,255', harai: '170,212,255', nuki: '218,160,255', uchiotoshi: '190,150,255', sandan: '236,230,255' }, edge: 'rgb(18,8,44)', core: 'rgb(246,242,255)', extra: 'bolt', ui: '#c3a6ff' },
  };

  // ================================================================ KI AURAS (aura)
  const AURA = {
    aura_kitsunebi: { glow: '70,200,255', hot: '210,250,255', kind: 'flame', ui: '#5fd2ff' },
    aura_raiun: { glow: '160,120,255', hot: '236,224,255', kind: 'zap', ui: '#a88cff' },
    aura_hana: { glow: '255,140,196', hot: '255,226,238', kind: 'petal', ui: '#ff8fc0' },
    aura_gekko: { glow: '190,210,255', hot: '255,255,255', kind: 'moon', ui: '#cfdcff' },
  };

  // ================================================================ KO FINISHES (ko)
  const KO = {
    ko_enso: { ui: '#e8e2d2' },
    ko_hanafubuki: { ui: '#ff9fc8' },
    ko_raiko: { ui: '#c3a6ff' },
    ko_mikazuki: { ui: '#dfe8ff' },
  };

  // ================================================================ NAME CARDS (card)
  // draw(g, w, h): the card picture (w × h px), the name side on the left (mirrored for the right-hand fighter)
  const CARD = {
    card_seigaiha: { ui: '#5aa8e6', draw: cardSeigaiha },
    card_yozakura: { ui: '#ff9fc8', draw: cardYozakura },
    card_ryu: { ui: '#e0b04a', draw: cardRyu },
    card_tsukiyo: { ui: '#cfdcff', draw: cardTsukiyo },
    card_asanoha: { ui: '#f0c55a', draw: cardAsanoha },
  };

  // ================================================================ ARENA VARIANTS (arena)
  // over: theme fields replaced (js/scene.js THEMES); wind / gust always stay the base arena's (fight state)
  const ARENA = {
    arena_temple_snow: { base: 'temple', ui: '#dfe6f5', over: {
      sky: ['#0a0f20', '#1b2544', '#46517a', '#262d48'], stars: 0.55, cloud: 'rgba(70,80,122,.5)',
      ridgeA: ['#c6cde4', '#323b5c'], ridgeB: ['#a7b0cb', '#262e4c'], fog: '170,182,220', fogA: 0.08, mid: '#1a2036',
      floor: ['#c3c9da', '#979fb6', '#4a516b'], wall: '#6c7490', joint: 'rgba(90,100,130,.35)', fence: '#262b40',
      weather: 'snow', reflect: 0.06, sheen: '235,240,255', key: { from: 1, c: '200,215,255', a: 0.18 }, prints: true,
      bambooC: [26, 36, 44], motes: null, rays: '210,220,255', bloom: 0.4 } },
    arena_rain_moon: { base: 'rain', ui: '#b9f5a0', over: {
      sky: ['#04070d', '#0c1624', '#1f3046', '#0d1520'], stars: 0.7,
      orb: { x: 0.7, y: 0.17, r: 0.06, c0: '#f6f2e2', c1: '#d8d0b4', halo: '230,226,200', craters: true },
      cloud: 'rgba(30,42,60,.55)', fog: '60,84,96', weather: null, lightning: false, reflect: 0.16, sheen: '210,225,235',
      key: { from: 1, c: '170,200,230', a: 0.15 }, ambience: 'wind', motes: '190,255,160', rays: '210,230,255', bloom: 0.6 } },
    arena_snow_night: { base: 'snow', ui: '#a9bfff', over: {
      sky: ['#03050d', '#0b1330', '#1d2a52', '#101734'], stars: 0.95,
      orb: { x: 0.74, y: 0.17, r: 0.05, c0: '#fbf8ee', c1: '#dcd8c8', halo: '215,222,255', craters: true },
      cloud: 'rgba(40,52,92,.45)', ridgeA: ['#b8c2e0', '#28325a'], ridgeB: ['#98a3c6', '#1f284c'], fog: '110,130,185',
      mid: '#161c34', floor: ['#9aa6c4', '#7480a2', '#353d5c'], wall: '#5a6488', joint: 'rgba(60,70,110,.35)', fence: '#22283f',
      key: { from: 1, c: '170,195,255', a: 0.2 }, rays: '200,215,255', bloom: 0.35, fgC: '#0b0f1e', vig: 'rgba(4,6,20,.5)' } },
    arena_market_rain: { base: 'market', ui: '#ffb37a', over: {
      stars: 0, orb: null, cloud: 'rgba(22,18,34,.88)', weather: 'rain', reflect: 0.3, sheen: '255,176,128',
      ambience: 'rain', motes: null, fog: '70,50,70', fogA: 0.06 } },
  };

  // ================================================================ MENU MUSIC (music)
  // scale: semitones of the five degrees; play(M, t, s): one 16th step (M = this player, see menuPlay)
  const MUSIC = {
    music_haru: { ui: '#ffb7d2', gain: 1.4, base: 196.0, scale: [0, 2, 5, 7, 9], tempo: 72, play: playHaru },
    music_yuki: { ui: '#cfdcff', gain: 1.5, base: 146.83, scale: [0, 2, 3, 7, 8], tempo: 50, play: playYuki },
    music_matsuri: { ui: '#ffb37a', base: 174.61, scale: [0, 3, 5, 7, 10], tempo: 84, play: playMatsuri },
  };

  const FLAIR = ND.FLAIR = { pose: POSE, hitfx: HIT, slash: SLASH, aura: AURA, ko: KO, card: CARD, arena: ARENA, music: MUSIC };
  const KINDS = Object.keys(FLAIR);
  const SLOTS = ['pose', 'hitfx', 'slash', 'aura', 'ko', 'card'];
  const KIND_OF = {};
  for (const k of KINDS) for (const id in FLAIR[k]) KIND_OF[id] = k;

  // ================================================================ NAMES (en tr de es fr pt ru)
  const L7 = ['en', 'tr', 'de', 'es', 'fr', 'pt', 'ru'];
  const N = {
    pose_tenchi: ['Heaven Raise', 'Göğe Kaldırış', 'Himmelsgruß', 'Alzada al cielo', 'Lame vers le ciel', 'Erguida ao céu', 'Клинок к небу'],
    pose_rei: ['Rei Bow', 'Rei Selamı', 'Rei-Verbeugung', 'Reverencia rei', 'Salut rei', 'Reverência rei', 'Поклон рэй'],
    pose_hiza: ['Kneeling Zanshin', 'Diz Çöküş', 'Kniender Zanshin', 'Zanshin de rodillas', 'Zanshin à genou', 'Zanshin ajoelhado', 'Дзансин на колене'],
    pose_katsugi: ['Shoulder Rest', 'Omuzda Dinlenme', 'Auf der Schulter', 'Arma al hombro', 'Arme sur l’épaule', 'Arma no ombro', 'Оружие на плече'],
    pose_kissaki: ['You’re Next', 'Sıradaki Sensin', 'Du bist der Nächste', 'Eres el siguiente', 'À ton tour', 'Você é o próximo', 'Ты следующий'],
    hitfx_kinpaku: ['Gold Leaf Hits', 'Altın Varak Darbesi', 'Blattgold-Treffer', 'Golpes de pan de oro', 'Coups à la feuille d’or', 'Golpes de folha de ouro', 'Удары сусального золота'],
    hitfx_aizome: ['Indigo Ink', 'Çivit Mürekkep', 'Indigo-Tinte', 'Tinta índigo', 'Encre indigo', 'Tinta índigo', 'Индиговая тушь'],
    hitfx_sakura: ['Sakura Burst', 'Sakura Patlaması', 'Kirschblütenstoß', 'Estallido sakura', 'Éclat de sakura', 'Explosão sakura', 'Вспышка сакуры'],
    hitfx_kitsunebi: ['Foxfire', 'Tilki Ateşi', 'Fuchsfeuer', 'Fuego de zorro', 'Feu de renard', 'Fogo-de-raposa', 'Лисий огонь'],
    hitfx_raijin: ['Raijin Sparks', 'Raijin Kıvılcımı', 'Raijin-Funken', 'Chispas de Raijin', 'Étincelles de Raijin', 'Faíscas de Raijin', 'Искры Райдзина'],
    slash_kin: ['Golden Edge', 'Altın Kesik', 'Goldene Schneide', 'Filo dorado', 'Tranchant doré', 'Fio dourado', 'Золотой разрез'],
    slash_sumi: ['Sumi Brush', 'Sumi Fırçası', 'Sumi-Pinsel', 'Pincel sumi', 'Pinceau sumi', 'Pincel sumi', 'Кисть суми'],
    slash_hana: ['Petal Wind', 'Yaprak Rüzgârı', 'Blütenwind', 'Viento de pétalos', 'Vent de pétales', 'Vento de pétalas', 'Ветер лепестков'],
    slash_rai: ['Thunder Cut', 'Yıldırım Kesik', 'Donnerschnitt', 'Corte del trueno', 'Coupe du tonnerre', 'Corte do trovão', 'Громовой разрез'],
    aura_kitsunebi: ['Foxfire Aura', 'Tilki Ateşi Halesi', 'Fuchsfeuer-Aura', 'Aura de fuego de zorro', 'Aura de feu de renard', 'Aura de fogo-de-raposa', 'Аура лисьего огня'],
    aura_raiun: ['Storm Aura', 'Fırtına Halesi', 'Sturmaura', 'Aura de tormenta', 'Aura d’orage', 'Aura de tempestade', 'Аура бури'],
    aura_hana: ['Blossom Aura', 'Çiçek Halesi', 'Blütenaura', 'Aura de flores', 'Aura de fleurs', 'Aura de flores', 'Аура цветения'],
    aura_gekko: ['Moonlight Aura', 'Ay Işığı Halesi', 'Mondlicht-Aura', 'Aura de luz de luna', 'Aura de clair de lune', 'Aura de luar', 'Аура лунного света'],
    ko_enso: ['Ensō Finish', 'Ensō Bitiriş', 'Ensō-Finale', 'Final ensō', 'Final ensō', 'Final ensō', 'Финал энсо'],
    ko_hanafubuki: ['Petal Storm', 'Yaprak Fırtınası', 'Blütensturm', 'Tormenta de pétalos', 'Tempête de pétales', 'Tempestade de pétalas', 'Буря лепестков'],
    ko_raiko: ['Lightning Strike', 'Yıldırım Düşüşü', 'Blitzschlag', 'Rayo final', 'Coup de foudre', 'Raio final', 'Удар молнии'],
    ko_mikazuki: ['Crescent Moon', 'Hilal', 'Mondsichel', 'Luna creciente', 'Croissant de lune', 'Lua crescente', 'Полумесяц'],
    card_seigaiha: ['Seigaiha Waves', 'Seigaiha Dalgaları', 'Seigaiha-Wellen', 'Olas seigaiha', 'Vagues seigaiha', 'Ondas seigaiha', 'Волны сэйгайха'],
    card_yozakura: ['Night Sakura', 'Gece Sakurası', 'Nachtkirschblüte', 'Sakura nocturno', 'Sakura de nuit', 'Sakura noturna', 'Ночная сакура'],
    card_ryu: ['Dragon Lacquer', 'Ejder Laka', 'Drachenlack', 'Laca del dragón', 'Laque du dragon', 'Laca do dragão', 'Лак дракона'],
    card_tsukiyo: ['Moonlit Pines', 'Ay Işığında Çamlar', 'Kiefern im Mondlicht', 'Pinos bajo la luna', 'Pins au clair de lune', 'Pinheiros ao luar', 'Сосны под луной'],
    card_asanoha: ['Asanoha Gold', 'Asanoha Altını', 'Asanoha-Gold', 'Oro asanoha', 'Or asanoha', 'Ouro asanoha', 'Золото асаноха'],
    arena_temple_snow: ['Snowfall Temple', 'Karlı Tapınak', 'Verschneiter Tempel', 'Templo nevado', 'Temple sous la neige', 'Templo nevado', 'Заснеженный храм'],
    arena_rain_moon: ['Moonlit Bamboo', 'Ay Işığında Bambu', 'Bambus im Mondlicht', 'Bambú bajo la luna', 'Bambous au clair de lune', 'Bambu ao luar', 'Бамбук под луной'],
    arena_snow_night: ['Snow Peak by Night', 'Gece Karlı Zirve', 'Schneegipfel bei Nacht', 'Cumbre nevada de noche', 'Sommet enneigé la nuit', 'Pico nevado à noite', 'Снежная вершина ночью'],
    arena_market_rain: ['Rainy Night Market', 'Yağmurlu Gece Çarşısı', 'Nachtmarkt im Regen', 'Mercado nocturno con lluvia', 'Marché de nuit sous la pluie', 'Mercado noturno com chuva', 'Ночной рынок под дождём'],
    music_haru: ['Spring Garden', 'Bahar Bahçesi', 'Frühlingsgarten', 'Jardín de primavera', 'Jardin de printemps', 'Jardim de primavera', 'Весенний сад'],
    music_yuki: ['Snow Moon', 'Karlı Ay', 'Schneemond', 'Luna de nieve', 'Lune de neige', 'Lua de neve', 'Снежная луна'],
    music_matsuri: ['Festival Night', 'Festival Gecesi', 'Festnacht', 'Noche de festival', 'Nuit de festival', 'Noite de festival', 'Ночь фестиваля'],
    // the Season 1 final costume (js/costumes-pass.js)
    pass1_akane: ['Moonshadow Regalia', 'Ay Gölgesi Kimonosu', 'Mondschatten-Ornat', 'Atuendo Sombra Lunar', 'Parure Ombre de lune', 'Traje Sombra da Lua', 'Наряд лунной тени'],
  };
  const KN = {
    pose: ['Victory pose', 'Zafer pozu', 'Siegerpose', 'Pose de victoria', 'Pose de victoire', 'Pose de vitória', 'Победная поза'],
    hitfx: ['Hit effect', 'Vuruş efekti', 'Treffereffekt', 'Efecto de golpe', 'Effet d’impact', 'Efeito de golpe', 'Эффект удара'],
    slash: ['Counter slash', 'Karşılık kesiği', 'Konterschnitt', 'Corte de contraataque', 'Coupe de riposte', 'Corte de contra-ataque', 'Разрез контратаки'],
    aura: ['Ki aura', 'Ki halesi', 'Ki-Aura', 'Aura de ki', 'Aura de ki', 'Aura de ki', 'Аура ки'],
    ko: ['KO finish', 'K.O. bitirişi', 'K.-o.-Finale', 'Remate K.O.', 'Final K.-O.', 'Final K.O.', 'Финальный нокаут'],
    card: ['Name card', 'İsim kartı', 'Namenskarte', 'Tarjeta de nombre', 'Carte de nom', 'Cartão de nome', 'Именная карта'],
    arena: ['Arena variant', 'Arena çeşidi', 'Arenavariante', 'Variante de arena', 'Variante d’arène', 'Variante de arena', 'Вариант арены'],
    music: ['Menu music', 'Menü müziği', 'Menümusik', 'Música del menú', 'Musique du menu', 'Música do menu', 'Музыка меню'],
  };
  const langNow = () => { const l = ND.i18n && ND.i18n.lang; return L7.includes(l) ? l : 'en'; };
  const pickL = (row, lang) => (row ? row[Math.max(0, L7.indexOf(L7.includes(lang) ? lang : langNow()))] || row[0] : null);

  // ================================================================ STATE
  const blank = () => ({ pose: null, hitfx: null, slash: null, aura: null, ko: null, card: null });
  const worn = [blank(), blank()];
  const VAR = {};          // arena id → variant id
  let musicId = null;
  // (the menu's demo fight wears nothing: it is not anyone's match)
  const wornOf = (f) => { const g = G(); return f && (f.id === 0 || f.id === 1) && !(g && g.mode === 'attract') ? worn[f.id] : null; };

  // ================================================================ PARTICLES (fx.parts, kind 'F'; js/scene.js calls upd / drw)
  // fn: the particle's look; every one keeps x, y, life, max like the other fx particles
  const FP = {};
  function add(p) { p.k = 'F'; ND.fx.parts.push(p); return p; }
  // gold leaf: a fluttering square flake with a glint
  FP.leaf = {
    u(p, dt) { p.vx *= 1 - 2.4 * dt; p.vy += 420 * dt; p.vy *= 1 - 1.8 * dt; p.ph += dt * 10; p.x += (p.vx + Math.sin(p.ph) * 36) * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y > -2) { p.y = -2; p.vy = 0; p.vx *= 0.8; } },
    d(ctx, p, t) {
      const s = p.s, fl = 0.35 + 0.65 * Math.abs(Math.cos(p.ph));
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, t * 3);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, fl);
      ctx.fillStyle = p.c || '#e9c25a'; ctx.fillRect(-s, -s, s * 2, s * 2);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.6 * fl; ctx.fillStyle = '#fff6d0'; ctx.fillRect(-s, -s, s, s * 0.7);
      ctx.restore();
    },
  };
  // a cherry petal: notched oval that turns and flutters down with the wind
  function petalPath(ctx, s) {
    ctx.beginPath(); ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.95, -s * 0.55, s * 0.55, s * 0.55); ctx.quadraticCurveTo(0, s * 1.05, -s * 0.55, s * 0.55);
    ctx.quadraticCurveTo(-s * 0.95, -s * 0.55, 0, -s); ctx.closePath();
  }
  FP.petal = {
    u(p, dt) { p.vx *= 1 - (p.drag || 1.6) * dt; p.vy += (p.g || 260) * dt; p.vy *= 1 - 1.4 * dt; p.ph += dt * (p.fs || 7); p.x += (p.vx + Math.sin(p.ph) * 46 + (p.wind || 0)) * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y > -1) { p.y = -1; p.vy = 0; p.vx *= 0.7; p.vr *= 0.8; } },
    d(ctx, p, t) {
      const s = p.s, fl = 0.3 + 0.7 * Math.abs(Math.cos(p.ph * 0.7));
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, t * 2.5) * (p.a || 1);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(fl, 1);
      petalPath(ctx, s); ctx.fillStyle = p.c || '#ffb7d2'; ctx.fill();
      ctx.globalAlpha *= 0.55; ctx.fillStyle = '#e06a9a'; ctx.beginPath(); ctx.ellipse(0, s * 0.35, s * 0.22, s * 0.38, 0, 0, TAU); ctx.fill();
      ctx.restore();
    },
  };
  // a small spirit flame that rises and shrinks (lighter)
  function flamePath(ctx, w, h) { ctx.beginPath(); ctx.moveTo(0, -h); ctx.quadraticCurveTo(w, -h * 0.15, 0, h * 0.35); ctx.quadraticCurveTo(-w, -h * 0.15, 0, -h); ctx.closePath(); }
  FP.flame = {
    u(p, dt) { p.vy -= 60 * dt; p.x += (p.vx + Math.sin(p.ph + p.max * 9 - p.life * 9) * 18) * dt; p.y += p.vy * dt; },
    d(ctx, p, t) {
      const k = Math.min(1, t * 1.6), h = p.s * (0.5 + 0.5 * k), w = h * 0.42;
      ctx.globalCompositeOperation = 'lighter';
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.globalAlpha = 0.55 * k; flamePath(ctx, w * 1.5, h * 1.35); ctx.fillStyle = rgba(p.c[0], 1); ctx.fill();
      ctx.globalAlpha = 0.9 * k; flamePath(ctx, w * 0.7, h * 0.8); ctx.fillStyle = rgba(p.c[1], 1); ctx.fill();
      ctx.restore();
    },
  };
  // a short crackling arc (the points are new on every frame it is drawn)
  function zigzag(ctx, x0, y0, x1, y1, n, amp) {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    ctx.moveTo(x0, y0);
    for (let i = 1; i < n; i++) { const q = i / n, o = rand(-amp, amp) * Math.sin(q * Math.PI); ctx.lineTo(x0 + dx * q + nx * o, y0 + dy * q + ny * o); }
    ctx.lineTo(x1, y1);
  }
  FP.zap = {
    u() {},
    d(ctx, p, t, lo) {
      ctx.globalCompositeOperation = 'lighter';
      const a = Math.min(1, t * 2) * (0.6 + 0.4 * Math.random());
      ctx.beginPath(); zigzag(ctx, p.x, p.y, p.x + p.dx, p.y + p.dy, 6, p.amp || 9);
      if (!lo) { ctx.globalAlpha = a * 0.35; ctx.strokeStyle = rgba(p.c[0], 1); ctx.lineWidth = 6; ctx.stroke(); }
      ctx.globalAlpha = a; ctx.strokeStyle = rgba(p.c[1], 1); ctx.lineWidth = 1.8; ctx.stroke();
    },
  };
  // two thin rings spreading like a drop on water
  FP.ripple = {
    u() {},
    d(ctx, p, t) {
      const u = 1 - t;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 2; i++) {
        const v = clamp(u * 1.25 - i * 0.25, 0, 1);
        if (v <= 0) continue;
        ctx.globalAlpha = (1 - v) * 0.85; ctx.strokeStyle = i ? 'rgb(235,242,255)' : rgba(p.c, 1); ctx.lineWidth = 2.4 - i;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * (0.3 + v), p.r * (0.3 + v) * 0.62, p.a, 0, TAU); ctx.stroke();
      }
    },
  };
  // ---- KO finishes
  // ensō: one brush circle painted round the fallen fighter, then it fades
  FP.enso = {
    u() {},
    d(ctx, p, t, lo) {
      const age = p.max - p.life, grow = E.outCubic(Math.min(1, age / 0.24)), fade = t < 0.35 ? t / 0.35 : 1;
      const n = 56, sweep = TAU * 0.9 * grow, R = p.r, top = [], bot = [];
      for (let i = 0; i <= n; i++) {
        const q = i / n, a = p.a0 + sweep * q;
        // pressure: heavy start, thinning and drying out at the tail
        const w = p.w * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + q * 0.95)), 0.45) * (1 - 0.45 * q) * (1 + 0.12 * Math.sin(q * 23 + p.seed));
        const r = R * (1 + 0.04 * Math.sin(q * 5 + p.seed));
        top.push(p.x + Math.cos(a) * (r + w), p.y + Math.sin(a) * (r + w) * 0.92);
        bot.push(p.x + Math.cos(a) * (r - w * 0.6), p.y + Math.sin(a) * (r - w * 0.6) * 0.92);
      }
      const path = () => { ctx.beginPath(); ctx.moveTo(top[0], top[1]); for (let i = 2; i < top.length; i += 2) ctx.lineTo(top[i], top[i + 1]); for (let i = bot.length - 2; i >= 0; i -= 2) ctx.lineTo(bot[i], bot[i + 1]); ctx.closePath(); };
      ctx.globalCompositeOperation = 'source-over'; ctx.lineJoin = 'round';
      if (!lo) { ctx.globalAlpha = 0.5 * fade; ctx.strokeStyle = 'rgb(198,208,236)'; ctx.lineWidth = 2.6; path(); ctx.stroke(); }
      ctx.globalAlpha = 0.94 * fade; ctx.fillStyle = '#07080e'; path(); ctx.fill();
      if (lo) return;
      // dry-brush hairs along the stroke
      ctx.globalAlpha = 0.45 * fade; ctx.strokeStyle = 'rgb(198,208,236)'; ctx.lineWidth = 0.8; ctx.beginPath();
      for (const k of [0.25, 0.6]) { const r = R + p.w * (k - 0.4); ctx.moveTo(p.x + Math.cos(p.a0) * r, p.y + Math.sin(p.a0) * r * 0.92); for (let i = 1; i <= 24; i++) { const a = p.a0 + sweep * 0.85 * (i / 24); ctx.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * 0.92); } }
      ctx.stroke();
    },
  };
  // a lightning bolt from the sky onto the fallen fighter: a few strikes, each a new path
  function boltPts(x0, y0, x1, y1, n, amp) {
    const a = [x0, y0];
    for (let i = 1; i < n; i++) { const q = i / n; a.push(x0 + (x1 - x0) * q + rand(-amp, amp) * (1 - q * 0.6), y0 + (y1 - y0) * q + rand(-amp, amp) * 0.25); }
    a.push(x1, y1);
    return a;
  }
  FP.bolt = {
    u(p, dt) { p.flick -= dt; if (p.flick <= 0) { p.flick = 0.035; p.pts = boltPts(p.x0, p.y0, p.x, p.y, 16, 34); p.br = [3, 6, 9].map((i) => boltPts(p.pts[i * 2], p.pts[i * 2 + 1], p.pts[i * 2] + rand(-90, 90), p.pts[i * 2 + 1] + rand(40, 120), 5, 14)); } },
    d(ctx, p, t, lo) {
      if (!p.pts) return;
      const a = Math.min(1, t * 1.5) * (0.65 + 0.35 * Math.random());
      const line = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); };
      ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (!lo) { line(p.pts); ctx.globalAlpha = a * 0.3; ctx.strokeStyle = 'rgb(150,110,255)'; ctx.lineWidth = 16; ctx.stroke(); }
      line(p.pts); ctx.globalAlpha = a * 0.7; ctx.strokeStyle = 'rgb(190,160,255)'; ctx.lineWidth = 6; ctx.stroke();
      ctx.globalAlpha = a; ctx.strokeStyle = 'rgb(250,246,255)'; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.lineWidth = 1.4; ctx.globalAlpha = a * 0.8;
      for (const b of p.br) { line(b); ctx.stroke(); }
    },
  };
  // the crescent moon: a huge silver crescent swept through the hit point, opening out and fading
  function crescentPath(ctx, R) {
    ctx.beginPath(); ctx.arc(0, 0, R, -1.9, 1.9, false); ctx.arc(-R * 0.22, 0, R * 0.95, 1.676, -1.676, true); ctx.closePath();
  }
  FP.crescent = {
    u() {},
    d(ctx, p, t, lo) {
      const age = p.max - p.life, g = E.outCubic(Math.min(1, age / 0.16)), fade = t < 0.5 ? t / 0.5 : 1;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(p.dir, 1);
      const R = p.r * (0.55 + 0.45 * g);
      ctx.globalCompositeOperation = 'lighter';
      if (!lo) { ctx.globalAlpha = 0.3 * fade; crescentPath(ctx, R * 1.12); ctx.fillStyle = 'rgb(150,170,255)'; ctx.fill(); }
      ctx.globalAlpha = 0.85 * fade; crescentPath(ctx, R); ctx.fillStyle = 'rgb(214,226,255)'; ctx.fill();
      ctx.globalAlpha = fade; ctx.strokeStyle = 'rgb(255,255,255)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R, -1.7, 1.7); ctx.stroke();
      ctx.restore();
    },
  };
  // a soft coloured glow that swells and fades (lighter)
  FP.glow = {
    u() {},
    d(ctx, p, t) {
      const u = 1 - t, r = p.r * (0.6 + 0.6 * E.outCubic(Math.min(1, u * 2)));
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, t * 1.6) * (p.a || 0.6);
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(r, r * (p.sy || 1)); ctx.fillStyle = glowGrad(ctx, p.c); ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
    },
  };
  // a silver fleck that twinkles (crescent KO, golden slash preview)
  FP.fleck = {
    u(p, dt) { p.vx *= 1 - 2 * dt; p.vy *= 1 - 2 * dt; p.vy += 40 * dt; p.x += p.vx * dt; p.y += p.vy * dt; },
    d(ctx, p, t) {
      const s = p.s * (0.6 + 0.4 * Math.abs(Math.sin(p.max * 31 + (p.max - p.life) * 24)));
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, t * 2);
      ctx.fillStyle = rgba(p.c, 1); ctx.beginPath(); ctx.moveTo(p.x, p.y - s * 2); ctx.lineTo(p.x + s * 0.6, p.y); ctx.lineTo(p.x, p.y + s * 2); ctx.lineTo(p.x - s * 0.6, p.y); ctx.closePath();
      ctx.moveTo(p.x - s * 2, p.y); ctx.lineTo(p.x, p.y - s * 0.6); ctx.lineTo(p.x + s * 2, p.y); ctx.lineTo(p.x, p.y + s * 0.6); ctx.closePath(); ctx.fill();
    },
  };
  // unit-radius glow gradients, one per colour and context (the GPU path's context has its own gradient objects)
  const GRAD = new WeakMap();
  function glowGrad(ctx, c) {
    let m = GRAD.get(ctx);
    if (!m) GRAD.set(ctx, (m = new Map()));
    let g = m.get(c);
    if (!g) { g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, rgba(c, 1)); g.addColorStop(0.35, rgba(c, 0.42)); g.addColorStop(1, rgba(c, 0)); m.set(c, g); }
    return g;
  }

  // ================================================================ HIT EFFECTS: the hook (js/fighter.js takeHit)
  let hitMark = -1;
  function recordFx(name, args) { const g = G(); if (g && g.recording) g.fxEvents.push([name, args]); }
  // the KO replay replays these (game.js updateReplay calls fx['_' + name])
  ND.fx._flairMark = () => { hitMark = ND.fx.parts.length; };
  ND.fx._flairHit = (id, x, y, kdir, raw) => applyHit(id, hitMark, x, y, kdir, raw);
  ND.fx._flairKO = (id, x, y, kdir) => spawnKO(id, x, y, kdir);
  function applyHit(id, mark, x, y, kdir, rawDmg) {
    const S = HIT[id], P = ND.fx.parts;
    if (!S || mark < 0) return;
    for (let i = mark; i < P.length; i++) {
      const p = P[i];
      if (p.k === 's') p.c = S.spark;
      else if (p.k === 'f') p.c = S.flash;
      else if (p.k === 'r') p.c = S.ring;
      else if (p.k === 'k' || p.k === 'x' || p.k === 'i') { p.ic = S.ink; p.ir = S.rim; }
      else if (p.k === 'c') p.c = S.cloth[(Math.random() * S.cloth.length) | 0];
    }
    const big = clamp((rawDmg || 8) / 24, 0, 1), lo = low();
    const n = Math.max(1, Math.round((lo ? 0.5 : 1) * ({ leaf: 3 + big * 4, petal: 4 + big * 6, flame: 2 + big * 3, zap: 2 + big * 2, ripple: 1 }[S.extra] || 0)));
    const ang = Math.atan2(-0.35, kdir || 1);
    for (let i = 0; i < n; i++) {
      const a = ang + rand(-0.9, 0.9), sp = rand(140, 420);
      if (S.extra === 'leaf') add({ fn: 'leaf', x: x + rand(-6, 6), y: y + rand(-6, 6), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(120, 260), rot: rand(0, 6.3), vr: rand(-12, 12), ph: rand(0, 6.3), s: rand(2.2, 4), c: S.cloth[i % 2], life: rand(1.1, 1.8), max: 1.8 });
      else if (S.extra === 'petal') add({ fn: 'petal', x: x + rand(-6, 6), y: y + rand(-6, 6), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(100, 240), rot: rand(0, 6.3), vr: rand(-8, 8), ph: rand(0, 6.3), s: rand(3.4, 5.4), c: S.cloth[i % 2], life: rand(1.2, 2), max: 2 });
      else if (S.extra === 'flame') add({ fn: 'flame', x: x + rand(-14, 14), y: y + rand(-10, 10), vx: rand(-40, 40), vy: rand(-140, -60), ph: rand(0, 6.3), s: rand(10, 18) * (0.8 + big * 0.5), c: FLAME.hitfx, life: rand(0.35, 0.6), max: 0.6 });
      else if (S.extra === 'zap') { const l = rand(30, 60) * (0.8 + big * 0.6); add({ fn: 'zap', x: x + rand(-6, 6), y: y + rand(-6, 6), dx: Math.cos(a) * l, dy: Math.sin(a) * l, amp: 8, c: ['170,130,255', '246,240,255'], life: rand(0.08, 0.16), max: 0.16 }); }
      else if (S.extra === 'ripple') add({ fn: 'ripple', x, y, r: 26 + big * 30, a: rand(-0.3, 0.3), c: S.ring, life: 0.42, max: 0.42 });
    }
  }

  // ================================================================ KO FINISHES: the hook (js/fighter.js die)
  function spawnKO(id, x, y, kdir) {
    if (!KO[id]) return;
    const lo = low(), d = kdir < 0 ? -1 : 1, fx = ND.fx;
    if (id === 'ko_enso') {
      add({ fn: 'enso', x: x - d * 8, y: y + 6, r: 104, w: 15, a0: rand(-2.6, -1.9), seed: rand(0, 100), life: 1.5, max: 1.5 });
      fx.ink(x, y, kdir, -0.3, 40, 1.5);
      if (!lo) for (let i = 0; i < 10; i++) { const a = rand(0, TAU), r = rand(95, 135); fx.parts.push({ k: 'i', x: x + Math.cos(a) * r * 0.6, y: y + Math.sin(a) * r * 0.5, vx: Math.cos(a) * rand(80, 220), vy: Math.sin(a) * rand(80, 220) - 120, r: rand(1.4, 3), life: 1.6, max: 1.6 }); }
    } else if (id === 'ko_hanafubuki') {
      const n = lo ? 26 : 56;
      for (let i = 0; i < n; i++) {
        const a = rand(0, TAU), sp = rand(220, 760);
        add({ fn: 'petal', x: x + rand(-10, 10), y: y + rand(-10, 10), vx: Math.cos(a) * sp + d * 120, vy: Math.sin(a) * sp * 0.75 - rand(120, 320), rot: rand(0, 6.3), vr: rand(-9, 9), ph: rand(0, 6.3), s: rand(3.6, 6.6), c: ['#ffb7d2', '#f48fb8', '#fff0f5', '#ffd0e2'][i % 4], wind: d * rand(30, 90), g: 150, drag: 1.2, fs: rand(5, 8), life: rand(2, 3.2), max: 3.2 });
      }
      add({ fn: 'glow', x, y, r: 150, c: '255,150,200', a: 0.55, life: 0.5, max: 0.5 });
    } else if (id === 'ko_raiko') {
      const x0 = x + rand(-80, 80), y0 = Math.min(y - 640, -700);
      add({ fn: 'bolt', x, y, x0, y0, flick: 0, life: 0.2, max: 0.2 });
      add({ fn: 'bolt', x: x + d * 10, y, x0: x0 + rand(-60, 60), y0, flick: 0, life: 0.14, max: 0.14, delay: 0 });
      add({ fn: 'glow', x, y: -6, r: 170, sy: 0.35, c: '170,140,255', a: 0.8, life: 0.7, max: 0.7 });
      add({ fn: 'glow', x, y, r: 120, c: '236,226,255', a: 0.7, life: 0.3, max: 0.3 });
      raw('spark')(x, y, -Math.PI / 2, lo ? 14 : 30, 1.4, '225,205,255');
      raw('ring')(x, -6, '200,170,255', 160);
    } else if (id === 'ko_mikazuki') {
      add({ fn: 'crescent', x, y, r: 125, rot: rand(-0.5, -0.2) * d, dir: d, life: 0.75, max: 0.75 });
      add({ fn: 'glow', x, y, r: 130, c: '190,210,255', a: 0.5, life: 0.45, max: 0.45 });
      const n = lo ? 8 : 18;
      for (let i = 0; i < n; i++) { const a = rand(-1.6, 1.6), r = rand(90, 170); add({ fn: 'fleck', x: x + Math.cos(a) * r * d, y: y + Math.sin(a) * r, vx: Math.cos(a) * d * rand(40, 140), vy: Math.sin(a) * rand(40, 140) - 40, s: rand(1.6, 3.4), c: '230,238,255', life: rand(0.6, 1.2), max: 1.2 }); }
    }
  }

  // ================================================================ AURAS: specialFx objects (js/specials.js list; game.js draws them)
  // behind(ctx): the glow behind the fighter (game.js renderScene: drawBehind); draw(ctx): its particles in front
  function Aura(f, id, mode) {
    this.fl = 1; this.f = f; this.A = AURA[id]; this.mode = mode; // 'special' | 'round' | 'hold' (previews)
    this.k = 0; this.life = mode === 'round' ? 1.3 : 6; this.ps = []; this.acc = 0; this.ph = rand(0, 6);
  }
  Aura.prototype.centre = function () {
    const j = this.f.viewJ ? this.f.viewJ() : this.f.j;
    return j && j.neck && j.hip ? { x: (j.neck.x + j.hip.x) / 2, y: (j.neck.y + j.hip.y) / 2, j } : null;
  };
  Aura.prototype.update = function (dt) {
    const f = this.f;
    const on = this.mode === 'hold' ? true : this.mode === 'round' ? this.t < 0.75 : !f.dead && ((f.state === 'atk' && f.atk && f.atk.special) || this.t < 0.45);
    this.k = on ? Math.min(1, this.k + dt / 0.18) : Math.max(0, this.k - dt / 0.35);
    if (!on && this.k <= 0.01 && !this.ps.length) return false;
    const c = this.centre();
    if (c && this.k > 0.05) {
      const rate = (low() ? 14 : 30) * this.k * (this.A.kind === 'zap' ? 1 : this.A.kind === 'moon' ? 0.6 : 1);
      this.acc += rate * dt;
      while (this.acc >= 1) { this.acc -= 1; this.spawn(c); }
    }
    for (let i = this.ps.length - 1; i >= 0; i--) {
      const p = this.ps[i]; p.life -= dt;
      if (p.life <= 0) { this.ps.splice(i, 1); continue; }
      if (p.orbit) { p.a += p.va * dt; if (c) { p.x = c.x + Math.cos(p.a) * p.rx; p.y = c.y - 10 + Math.sin(p.a) * p.ry + p.dy; } p.dy -= 12 * dt; p.rot += p.vr * dt; }
      else if (!p.zap) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= (p.up || 0) * dt; }
    }
  };
  Aura.prototype.spawn = function (c) {
    const A = this.A, j = c.j, kind = A.kind;
    // a point on the body: along the spine, the arms or the legs
    const pick = () => { const L = [j.head, j.neck, j.hip, j.elF, j.haF, j.elB, j.knF, j.knB, j.ftF, j.ftB]; const a = L[(Math.random() * L.length) | 0] || c, b = L[(Math.random() * L.length) | 0] || c, q = Math.random(); return { x: a.x + (b.x - a.x) * q + rand(-12, 12), y: a.y + (b.y - a.y) * q + rand(-8, 8) }; };
    if (kind === 'flame') { const p = pick(); this.ps.push({ x: p.x, y: p.y, vx: rand(-20, 20), vy: rand(-110, -60), up: 90, s: rand(9, 17), life: rand(0.35, 0.6), max: 0.6 }); }
    else if (kind === 'zap') { const a = pick(), b = pick(); this.ps.push({ zap: true, x: a.x, y: a.y, x1: b.x, y1: b.y, life: rand(0.06, 0.14), max: 0.14 }); }
    else if (kind === 'petal') this.ps.push({ orbit: true, a: rand(0, TAU), va: rand(2.2, 3.4) * (Math.random() < 0.5 ? -1 : 1), rx: rand(40, 70), ry: rand(50, 90), dy: rand(-30, 40), rot: rand(0, 6), vr: rand(-6, 6), s: rand(3.2, 5), x: c.x, y: c.y, life: rand(0.8, 1.3), max: 1.3 });
    else { const p = pick(); this.ps.push({ mote: true, x: p.x, y: p.y, vx: rand(-10, 10), vy: rand(-70, -30), up: 30, s: rand(1.2, 2.6), life: rand(0.6, 1.1), max: 1.1 }); }
  };
  Aura.prototype.behind = function (ctx) {
    const c = this.centre(); if (!c || this.k <= 0.01) return;
    const A = this.A, k = this.k, pulse = 0.85 + 0.15 * Math.sin(this.t * 9 + this.ph);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.62 * k * pulse;
    ctx.translate(c.x, c.y - 8); ctx.scale(92, 128); ctx.fillStyle = glowGrad(ctx, A.glow); ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();
    ctx.restore();
    if (A.kind === 'moon') {
      // the moon halo: a thin silver ring behind the head and shoulders
      const h = c.j.head || c;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.75 * k; ctx.strokeStyle = 'rgb(225,232,255)'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(h.x, h.y + 6, 44 + 3 * Math.sin(this.t * 3), 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.3 * k; ctx.lineWidth = 7; ctx.strokeStyle = rgba(A.glow, 1); ctx.stroke();
      ctx.restore();
    }
  };
  Aura.prototype.draw = function (ctx) {
    const A = this.A, lo = low();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.ps) {
      const t = p.life / p.max;
      if (p.zap) {
        ctx.beginPath(); zigzag(ctx, p.x, p.y, p.x1, p.y1, 7, 10);
        if (!lo) { ctx.globalAlpha = 0.35; ctx.strokeStyle = rgba(A.glow, 1); ctx.lineWidth = 6; ctx.stroke(); }
        ctx.globalAlpha = 0.95; ctx.strokeStyle = rgba(A.hot, 1); ctx.lineWidth = 2; ctx.stroke();
      } else if (p.orbit) {
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, t * 3) * Math.min(1, (1 - t) * 6);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot); petalPath(ctx, p.s); ctx.fillStyle = '#ffc2da'; ctx.fill();
        ctx.globalAlpha *= 0.5; ctx.fillStyle = '#e06a9a'; ctx.beginPath(); ctx.ellipse(0, p.s * 0.35, p.s * 0.22, p.s * 0.38, 0, 0, TAU); ctx.fill();
        ctx.restore();
      } else if (p.mote) {
        ctx.globalAlpha = Math.min(1, t * 2) * 0.9; ctx.fillStyle = rgba(A.hot, 1);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill();
        if (!lo) { ctx.globalAlpha *= 0.35; ctx.fillStyle = rgba(A.glow, 1); ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 3, 0, TAU); ctx.fill(); }
      } else {
        const k = Math.min(1, t * 1.6), h = p.s * (0.5 + 0.5 * k), w = h * 0.42;
        ctx.save(); ctx.translate(p.x, p.y);
        ctx.globalAlpha = 0.5 * k * this.k; flamePath(ctx, w * 1.5, h * 1.35); ctx.fillStyle = rgba(A.glow, 1); ctx.fill();
        ctx.globalAlpha = 0.85 * k * this.k; flamePath(ctx, w * 0.7, h * 0.8); ctx.fillStyle = rgba(A.hot, 1); ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  };
  function addAura(f, mode) {
    const w = wornOf(f), g = G();
    if (!w || !w.aura || !AURA[w.aura] || !ND.specialFx || (g && g.simOnly) || (g && g.mode === 'attract')) return null;
    return ND.specialFx.add(new Aura(f, w.aura, mode));
  }

  // ================================================================ SLASH THEMES (js/kaeshi-cine.js)
  function slashExtra(ctx, sl, x, y, L, c, sn, w, fade, s) {
    const S = SLASH[sl.sty]; if (!S) return;
    const lo = low();
    if (S.extra === 'fleck') {
      ctx.globalCompositeOperation = 'lighter';
      const n = lo ? 6 : 12;
      for (let i = 0; i < n; i++) {
        const q = ((i * 0.618 + sl.seed) % 1) * 2 - 1, o = Math.sin(i * 7.3 + sl.seed * 10) * w * 2.2, px = x + c * L * q * 0.8 - sn * o, py = y + sn * L * q * 0.8 + c * o, r = (2 + (i % 3)) * s;
        ctx.globalAlpha = fade * (0.5 + 0.5 * Math.sin(sl.age * 30 + i)); ctx.fillStyle = 'rgb(255,236,170)';
        ctx.beginPath(); ctx.moveTo(px, py - r * 2); ctx.lineTo(px + r * 0.6, py); ctx.lineTo(px, py + r * 2); ctx.lineTo(px - r * 0.6, py); ctx.closePath(); ctx.fill();
      }
    } else if (S.extra === 'brush') {
      // dry-brush hairs beside the stroke and a few ink drops thrown off its ends
      ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = 'rgb(3,4,7)'; ctx.lineWidth = 1.4 * s;
      for (let i = -2; i <= 2; i++) {
        if (!i) continue;
        const o = i * w * 1.35, l0 = L * (0.55 + 0.1 * Math.sin(i + sl.seed * 9));
        ctx.globalAlpha = fade * 0.55; ctx.beginPath(); ctx.moveTo(x - c * l0 - sn * o, y - sn * l0 + c * o); ctx.lineTo(x + c * l0 * 0.7 - sn * o, y + sn * l0 * 0.7 + c * o); ctx.stroke();
      }
      ctx.fillStyle = 'rgb(3,4,7)';
      for (let i = 0; i < (lo ? 3 : 7); i++) {
        const q = 0.6 + ((i * 0.37 + sl.seed) % 1) * 0.4, side = i % 2 ? 1 : -1, o = Math.sin(i * 3.1 + sl.seed) * w * 3, r = (2 + (i % 3) * 1.5) * s;
        ctx.globalAlpha = fade * 0.85; ctx.beginPath(); ctx.arc(x + c * L * q * side - sn * o, y + sn * L * q * side + c * o, r, 0, TAU); ctx.fill();
      }
    } else if (S.extra === 'petal') {
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < (lo ? 5 : 10); i++) {
        const q = ((i * 0.618 + sl.seed) % 1) * 1.6 - 0.8, o = Math.sin(i * 5.7 + sl.seed * 7) * w * 3 + (1 - fade) * 20 * s * (i % 2 ? 1 : -1);
        ctx.save(); ctx.globalAlpha = fade; ctx.translate(x + c * L * q - sn * o, y + sn * L * q + c * o + (1 - fade) * 30 * s); ctx.rotate(i * 1.7 + sl.age * 6);
        petalPath(ctx, (4 + (i % 3)) * s); ctx.fillStyle = i % 3 ? '#ffc2da' : '#fff0f5'; ctx.fill(); ctx.restore();
      }
    } else if (S.extra === 'bolt') {
      // a jagged lightning line along the cut, new on every frame
      ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
      ctx.beginPath(); zigzag(ctx, x - c * L * 0.85, y - sn * L * 0.85, x + c * L * 0.85, y + sn * L * 0.85, 18, w * 1.2);
      if (!lo) { ctx.globalAlpha = fade * 0.4; ctx.strokeStyle = 'rgb(150,110,255)'; ctx.lineWidth = 7 * s; ctx.stroke(); }
      ctx.globalAlpha = fade; ctx.strokeStyle = 'rgb(246,242,255)'; ctx.lineWidth = 1.8 * s; ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  // ================================================================ ARENA VARIANTS (js/scene.js setTheme)
  // a variant theme is built once and kept in ND.THEMES as '<arena>~<variant>' (scene.js frees its cached pictures like
  // any other theme's); the scene keeps the base arena's id
  function variantTheme(arenaId) {
    const vid = VAR[arenaId], V = vid && ARENA[vid], T = ND.THEMES;
    if (!V || !T || !T[arenaId] || V.base !== arenaId) return null;
    const key = arenaId + '~' + vid;
    if (!T[key]) {
      const B = T[arenaId];
      T[key] = Object.assign({}, B, V.over, { wind: B.wind, gust: B.gust, _c: null });
    }
    return T[key];
  }

  // ================================================================ MENU MUSIC (js/music.js play('menu'))
  // koto notes in the variant's own scale: Karplus-Strong buffers made on first use, one per note (~1 ms each)
  const KOTO = new Map();
  function kotoBuf(mu, V, i) {
    i = clamp(i | 0, 0, 14);
    const key = V.base + '|' + V.scale.join(',') + '|' + i;
    let b = KOTO.get(key);
    if (!b) { b = mu.ks(noteF(V, i), 2.2); KOTO.set(key, b); }
    return b;
  }
  function noteF(V, i) { const oct = Math.floor(i / 5), deg = V.scale[((i % 5) + 5) % 5]; return V.base * Math.pow(2, (oct * 12 + deg) / 12); }
  function koto(mu, V, t, i, vel = 1, pan = 0) {
    const au = ND.audio, c = au.ctx, s = c.createBufferSource(); s.buffer = kotoBuf(mu, V, i);
    const g = c.createGain(); g.gain.value = 0.5 * vel * (V.gain || 1);
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    if (p) { p.pan.value = pan; s.connect(g); g.connect(p); p.connect(mu.bus); } else { s.connect(g); g.connect(mu.bus); }
    s.start(t);
  }
  // a soft bell (two sines, long tail): the snow moon's high notes
  function bell(mu, t, f, vel) { // (vel includes the variant's gain)
    const c = ND.audio.ctx;
    for (const [m, a] of [[1, 1], [2.76, 0.35]]) {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * m;
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09 * vel * a, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6 / m);
      o.connect(g); g.connect(mu.bus); o.start(t); o.stop(t + 2.8);
    }
  }
  const walkN = (st, lo, hi) => { const r = Math.random(); st.w += r < 0.4 ? 1 : r < 0.8 ? -1 : r < 0.9 ? 2 : -2; if (st.w < lo) st.w = lo + 1; if (st.w > hi) st.w = hi - 1; return st.w; };
  const MST = { w: 6 };
  // Spring Garden: yo scale, flowing broken chords on the koto, a light shakuhachi line, an occasional temple bell tap
  function playHaru(mu, V, t, s) {
    const bar = Math.floor(s / 16), b16 = s % 16;
    const roots = [0, 3, 1, 4], r = roots[bar % 4];
    if (b16 % 2 === 0) { const arp = [r, r + 2, r + 4, r + 5, r + 7, r + 5, r + 4, r + 2]; koto(mu, V, t, arp[b16 / 2] + 2, b16 % 4 === 0 ? 0.55 : 0.36, b16 % 4 === 0 ? -0.25 : 0.25); }
    if (b16 === 0) koto(mu, V, t, r, 0.45, -0.35);
    if (b16 === 4 && bar % 4 === 1) mu.shakuhachi(t, noteF(V, walkN(MST, 6, 11)), 2.4, 0.6);
    if (b16 === 12 && bar % 8 === 6) mu.shakuhachi(t, noteF(V, walkN(MST, 5, 10)), 1.6, 0.5);
  }
  // Snow Moon: hirajoshi, slow and sparse, a low koto drone, high bell notes, long shakuhachi breaths
  function playYuki(mu, V, t, s) {
    const bar = Math.floor(s / 16), b16 = s % 16;
    if (b16 === 0 && bar % 2 === 0) koto(mu, V, t, 0, 0.5, -0.3);
    if (b16 === 8 && bar % 2 === 1) koto(mu, V, t, 2, 0.35, 0.3);
    if (b16 % 4 === 0 && Math.random() < 0.35) bell(mu, t, noteF(V, walkN(MST, 9, 14)), 0.8 * V.gain);
    if (b16 === 0 && bar % 4 === 2) mu.shakuhachi(t, noteF(V, walkN(MST, 5, 10)), 3.6, 0.65);
  }
  // Festival Night: min'yō scale, light taiko pattern, a call-and-response koto melody and a high flute
  function playMatsuri(mu, V, t, s) {
    const bar = Math.floor(s / 16), b16 = s % 16;
    if (b16 === 0 || b16 === 10) mu.drum(t, 'o', b16 ? 0.4 : 0.55);
    if (b16 % 4 === 2) mu.drum(t, 's', 0.32);
    if (bar % 4 === 3 && b16 >= 12 && b16 % 2 === 0) mu.drum(t, 's', 0.25 + (b16 - 12) * 0.06);
    const call = [5, 6, 7, 6, 5, 3, 5, 4], resp = [7, 8, 7, 5, 6, 5, 3, 2];
    if (b16 % 2 === 0) { const m = bar % 2 ? resp : call; if (b16 !== 14 || Math.random() < 0.5) koto(mu, V, t, m[b16 / 2], b16 % 4 === 0 ? 0.5 : 0.34, bar % 2 ? 0.25 : -0.25); }
    if (b16 === 0 && bar % 8 === 4) mu.shakuhachi(t, noteF(V, walkN(MST, 9, 13)), 2.2, 0.45);
  }

  // ================================================================ NAME CARDS (pictures, made once)
  function cardBase(g, w, h, c0, c1) {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, c0); gr.addColorStop(1, c1);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  // the name side (left) darker so the name reads on any motif; a fine gold edge line top and bottom
  function cardFinish(g, w, h, edge) {
    const sh = g.createLinearGradient(0, 0, w, 0); sh.addColorStop(0, 'rgba(6,7,12,.74)'); sh.addColorStop(0.5, 'rgba(6,7,12,.5)'); sh.addColorStop(1, 'rgba(6,7,12,.42)');
    g.fillStyle = sh; g.fillRect(0, 0, w, h);
    g.fillStyle = edge; g.fillRect(0, 0, w, h * 0.025); g.fillRect(0, h * 0.975, w, h * 0.025);
  }
  function cardSeigaiha(g, w, h) {
    cardBase(g, w, h, '#0b1f3a', '#123a63');
    const r = h * 0.3;
    g.lineWidth = h * 0.016;
    for (let row = -1, y = 0; y < h + r; row++, y = row * r * 0.5) {
      for (let x = (row % 2) * r - r; x < w + r; x += r * 2) {
        for (let k = 4; k >= 1; k--) {
          g.beginPath(); g.arc(x, y + r, r * k / 4, Math.PI, TAU);
          g.fillStyle = k === 4 ? '#123a63' : k % 2 ? '#1b4f86' : '#0f2f55'; g.fill();
          g.strokeStyle = k === 4 ? 'rgba(160,210,255,.55)' : 'rgba(120,180,240,.32)'; g.stroke();
        }
      }
    }
    cardFinish(g, w, h, '#7fc0f0');
  }
  function cardYozakura(g, w, h) {
    cardBase(g, w, h, '#120a1c', '#2d1430');
    // a moonlit glow and a dark branch with blossoms, from the far side
    const m = g.createRadialGradient(w * 0.82, h * 0.3, 2, w * 0.82, h * 0.3, h * 0.9); m.addColorStop(0, 'rgba(255,220,235,.35)'); m.addColorStop(1, 'rgba(255,220,235,0)');
    g.fillStyle = m; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#0a0508'; g.lineCap = 'round';
    const br = [[w * 1.02, h * 0.05, w * 0.78, h * 0.42, 10], [w * 0.78, h * 0.42, w * 0.6, h * 0.55, 6], [w * 0.78, h * 0.42, w * 0.7, h * 0.95, 5], [w * 0.88, h * 0.25, w * 0.92, h * 0.75, 4], [w * 0.6, h * 0.55, w * 0.5, h * 0.48, 3]];
    for (const [x0, y0, x1, y1, lw] of br) { g.lineWidth = lw * h / 120; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + h * 0.06, (y0 + y1) / 2 - h * 0.05, x1, y1); g.stroke(); }
    const blossom = (x, y, s, c) => { g.fillStyle = c; for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - Math.PI / 2; g.beginPath(); g.ellipse(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.42, s * 0.3, a, 0, TAU); g.fill(); } g.fillStyle = '#ffe680'; g.beginPath(); g.arc(x, y, s * 0.16, 0, TAU); g.fill(); };
    const P = [[0.6, 0.55], [0.52, 0.47], [0.7, 0.8], [0.73, 0.62], [0.82, 0.35], [0.9, 0.6], [0.93, 0.18], [0.66, 0.92], [0.86, 0.48], [0.97, 0.4], [0.55, 0.6]];
    P.forEach(([x, y], i) => blossom(w * x, h * y, h * (0.07 + (i % 3) * 0.02), i % 3 ? '#ffb7d2' : '#fff0f5'));
    for (let i = 0; i < 14; i++) { g.save(); g.translate(w * (0.25 + ((i * 0.618) % 1) * 0.7), h * ((i * 0.37) % 1)); g.rotate(i); petalPath(g, h * 0.025); g.fillStyle = 'rgba(255,190,215,.7)'; g.fill(); g.restore(); }
    cardFinish(g, w, h, '#ff9fc8');
  }
  function cardRyu(g, w, h) {
    cardBase(g, w, h, '#0a0606', '#1d0c0a');
    // gold dragon scales (uroko) sweeping in from the far side and a cloud scroll
    const s = h * 0.13;
    for (let row = 0; row * s * 0.55 < h + s; row++) {
      for (let col = 0; col * s < w; col++) {
        const x = w - col * s - (row % 2) * s * 0.5, y = row * s * 0.55, k = clamp((x / w - 0.35) * 1.8, 0, 1);
        if (k <= 0) continue;
        g.beginPath(); g.moveTo(x - s * 0.5, y); g.quadraticCurveTo(x, y + s * 0.9, x + s * 0.5, y); g.quadraticCurveTo(x, y + s * 0.35, x - s * 0.5, y); g.closePath();
        g.fillStyle = `rgba(200,150,50,${0.18 + 0.5 * k})`; g.fill(); g.strokeStyle = `rgba(255,220,130,${0.3 + 0.5 * k})`; g.lineWidth = h * 0.008; g.stroke();
      }
    }
    g.strokeStyle = 'rgba(236,190,90,.75)'; g.lineWidth = h * 0.018;
    for (const [cx, cy, r] of [[w * 0.62, h * 0.78, h * 0.16], [w * 0.5, h * 0.82, h * 0.1], [w * 0.72, h * 0.86, h * 0.1]]) { g.beginPath(); g.arc(cx, cy, r, Math.PI * 1.05, Math.PI * 2.1); g.stroke(); g.beginPath(); g.arc(cx + r * 0.3, cy - r * 0.05, r * 0.45, Math.PI * 1.1, Math.PI * 2.4); g.stroke(); }
    cardFinish(g, w, h, '#e0b04a');
  }
  function cardTsukiyo(g, w, h) {
    cardBase(g, w, h, '#060a18', '#142245');
    const mx = w * 0.8, my = h * 0.38, mr = h * 0.27;
    const halo = g.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 3); halo.addColorStop(0, 'rgba(210,222,255,.35)'); halo.addColorStop(1, 'rgba(210,222,255,0)');
    g.fillStyle = halo; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2f0e4'; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill();
    g.fillStyle = 'rgba(180,176,160,.35)'; for (const [dx, dy, r] of [[-0.3, -0.1, 0.22], [0.25, 0.2, 0.16], [0.05, -0.4, 0.1]]) { g.beginPath(); g.arc(mx + dx * mr, my + dy * mr, r * mr, 0, TAU); g.fill(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + (i % 3) * 0.2})`; g.fillRect(w * ((i * 0.618) % 1), h * ((i * 0.381) % 0.7), 1.5, 1.5); }
    // pine silhouettes over the moon
    const pine = (x, y, s) => { g.fillStyle = '#04060c'; g.fillRect(x - s * 0.04, y - s * 0.2, s * 0.08, s * 1.2); for (let k = 0; k < 4; k++) { const yy = y + k * s * 0.22, ww = s * (0.25 + k * 0.12); g.beginPath(); g.ellipse(x + (k % 2 ? 1 : -1) * s * 0.08, yy, ww, s * 0.08, 0, 0, TAU); g.fill(); } };
    pine(w * 0.68, h * 0.42, h * 0.75); pine(w * 0.93, h * 0.58, h * 0.6);
    g.fillStyle = '#04060c'; g.fillRect(0, h * 0.9, w, h * 0.1);
    cardFinish(g, w, h, '#cfdcff');
  }
  function cardAsanoha(g, w, h) {
    cardBase(g, w, h, '#2a0a0e', '#5a1218');
    // the hemp-leaf star pattern in gold on crimson lacquer
    const s = h * 0.34, hy = s * Math.sqrt(3) / 2;
    g.strokeStyle = 'rgba(240,197,90,.6)'; g.lineWidth = h * 0.01;
    for (let row = -1; row * hy < h + hy; row++) {
      for (let col = -1; col * s < w + s; col++) {
        const cx = col * s + (row % 2 ? s / 2 : 0), cy = row * hy;
        g.beginPath();
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * s / Math.sqrt(3), cy + Math.sin(a) * s / Math.sqrt(3)); }
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * s * 0.5, cy + Math.sin(a) * s * 0.5); }
        g.stroke();
      }
    }
    // gold leaf flakes thick on the far side
    for (let i = 0; i < 26; i++) { const x = w * (0.55 + ((i * 0.618) % 1) * 0.45), y = h * ((i * 0.37) % 1), r = h * (0.04 + (i % 4) * 0.02); g.fillStyle = `rgba(240,197,90,${0.35 + (i % 3) * 0.2})`; g.save(); g.translate(x, y); g.rotate(i); g.fillRect(-r, -r * 0.8, r * 2, r * 1.6); g.restore(); }
    cardFinish(g, w, h, '#f0c55a');
  }
  const CARD_PX = { w: 560, h: 140 };
  const cardCache = new Map();
  // the card picture as a data URL (flip: mirrored for the right-hand fighter)
  function cardURL(id, flip) {
    const key = id + (flip ? '|r' : '|l');
    let u = cardCache.get(key);
    if (u) return u;
    const C = CARD[id]; if (!C || typeof document === 'undefined') return null;
    const cv = document.createElement('canvas'); cv.width = CARD_PX.w; cv.height = CARD_PX.h;
    const g = cv.getContext('2d');
    if (flip) { g.translate(cv.width, 0); g.scale(-1, 1); }
    C.draw(g, cv.width, cv.height);
    try { u = cv.toDataURL('image/png'); } catch (e) { u = null; }
    if (u) cardCache.set(key, u);
    return u;
  }
  // puts the card behind a name block (or takes it away); side 1 is the right-hand fighter
  function applyCard(el, side, id) {
    if (!el) return;
    const u = id && CARD[id] ? cardURL(id, side === 1) : null;
    if (!u) {
      if (el.dataset.flairCard) { for (const k of ['backgroundImage', 'backgroundSize', 'backgroundPosition', 'padding', 'borderRadius', 'boxShadow']) el.style[k] = ''; delete el.dataset.flairCard; }
      return;
    }
    el.dataset.flairCard = id;
    el.style.backgroundImage = `url("${u}")`; el.style.backgroundSize = 'cover'; el.style.backgroundPosition = 'center';
    el.style.padding = '6px 12px'; el.style.borderRadius = '3px'; el.style.boxShadow = '0 2px 10px rgba(0,0,0,.45)';
  }
  function refreshCards() {
    if (typeof document === 'undefined') return;
    const vs = document.getElementById('vs');
    if (!vs) return;
    for (const n of [1, 2]) { const side = document.getElementById('vss' + n); applyCard(side && side.querySelector('.vs-name'), n - 1, worn[n - 1].card); }
  }

  // ================================================================ PREVIEWS (wardrobe, studio panel)
  let PVF = null;
  function pvFighter() {
    if (!PVF && ND.Fighter && ND.Ctrl) { PVF = new ND.Fighter(0, new ND.Ctrl()); PVF.fullDetail = true; }
    return PVF;
  }
  // a fighter standing in pose P (cloth settled), ready to draw
  function posed(chId, look, P, dir, costume) {
    const f = pvFighter(); if (!f) return null;
    const ch = ND.charById ? ND.charById(chId) : ND.CHARS[0];
    f.setChar(ch, look || false);
    if (costume && ND.COSTUMES && ND.COSTUMES[costume] && ND.costumePal) f.col = ND.costumePal(f.col, costume);
    f.reset(0); f.dir = dir || 1; f.state = 'move'; f.dead = false;
    pose.copy(P === 'stance' ? f.P.stance : P, f.pose); f._anim = null;
    for (let i = 0; i < 50; i++) { f.solve(1 / 60); ND.updateCloth(f.j, 1 / 60); }
    return f;
  }
  function pvCanvas(target, o) {
    let cv = target && target.getContext ? target : null;
    const dpr = o.dpr || (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    if (!cv) { cv = document.createElement('canvas'); if (target && target.appendChild) target.appendChild(cv); }
    const w = o.w || (cv.style.width ? parseFloat(cv.style.width) : 0) || (cv.clientWidth || 160), h = o.h || (cv.style.height ? parseFloat(cv.style.height) : 0) || (cv.clientHeight || 160);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    if (!cv.style.width) { cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
    return { cv, g: cv.getContext('2d'), w, h, dpr };
  }
  function pvBg(g, W, H, col) {
    const gr = g.createRadialGradient(W / 2, H * 0.62, 4, W / 2, H * 0.62, H * 0.7);
    gr.addColorStop(0, col ? col + '55' : 'rgba(120,130,180,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = '#0b0c14'; g.fillRect(0, 0, W, H); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  // world → picture: the floor at 88 % of the height, `span` world units tall
  function place(g, W, H, span, cx = 0) { const k = H / span; g.setTransform(k, 0, 0, k, W / 2 - cx * k, H * 0.88); return k; }
  function shadow(g) { g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(0, 3, 50, 7, 0, 0, TAU); g.fill(); }
  // runs fx particles made by fn on their own list for `t` seconds and draws them (the game's own fx code)
  function withFx(g, fn, t) {
    const fx = ND.fx, keep = { p: fx.parts, d: fx.decals, x: fx.texts };
    fx.parts = []; fx.decals = []; fx.texts = [];
    try { fn(); for (let s = 0; s < t; s += 1 / 120) fx.update(1 / 120); fx.drawDecals(g); fx.draw(g); }
    finally { fx.parts = keep.p; fx.decals = keep.d; fx.texts = keep.x; }
  }
  function preview(kind, id, target, opts) {
    const o = opts || {}, { cv, g, w, h, dpr } = pvCanvas(target, o), W = cv.width, H = cv.height;
    const F = FLAIR[kind] && FLAIR[kind][id], chId = o.fighter || 'akane';
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    if (o.bg !== false && kind !== 'card' && kind !== 'arena') pvBg(g, W, H, F && F.ui);
    try {
      if (!F) { /* nothing worn: the background only */ }
      else if (kind === 'pose') { const f = posed(chId, o.look, F.end, 1, o.costume); place(g, W, H, id === 'pose_tenchi' ? 340 : 250, 4); shadow(g); if (f) { f.draw(g, false); ND.eyeGlow?.(g, f.viewJ(), f.col, f.ch.acc); } }
      else if (kind === 'aura') {
        const f = posed(chId, o.look, 'stance', 1, o.costume); place(g, W, H, 250, 0);
        const a = new Aura(f, id, 'hold'); a.t = 0;
        for (let s = 0, T = o.t || 0.9; s < T; s += 1 / 60) { a.t += 1 / 60; a.update(1 / 60); }
        a.behind(g); shadow(g); f.draw(g, false); a.draw(g);
      } else if (kind === 'hitfx') {
        place(g, W, H, 200, 0);
        withFx(g, () => {
          const fx = ND.fx, m = fx.parts.length;
          fx.ink(0, -100, 1, -0.25, 26, 1.2); raw('spark')(0, -100, Math.atan2(-0.4, 1), 18, 1.1); raw('flash')(0, -100, 0.4, 70);
          applyHit(id, m, 0, -100, 1, 22);
        }, o.t || 0.08);
      } else if (kind === 'ko') {
        const f = posed(chId, o.look, PO.down, -1, o.costume); place(g, W, H, 300, 0);
        shadow(g); if (f) f.draw(g, false);
        withFx(g, () => spawnKO(id, 0, -100, 1), o.t || (id === 'ko_hanafubuki' ? 0.35 : id === 'ko_raiko' ? 0.05 : 0.3));
      } else if (kind === 'slash') {
        g.setTransform(1, 0, 0, 1, 0, 0);
        const S = SLASH[id], s = W / 320, list = [['suriage', -0.62, 0.38], ['harai', 0.05, 0.62], ['nuki', 0.72, 0.5]];
        for (const [tid, a, yy] of list) {
          const x = W * 0.5, y = H * yy, L = W * 0.62, c = Math.cos(a), sn = Math.sin(a), wd = 12 * s, col = S.col[tid];
          const band = (ww, style, alpha, comp) => { const nx = -sn * ww, ny = c * ww; g.globalCompositeOperation = comp; g.globalAlpha = alpha; g.fillStyle = style; g.beginPath(); g.moveTo(x - c * L, y - sn * L); g.lineTo(x + nx, y + ny); g.lineTo(x + c * L, y + sn * L); g.lineTo(x - nx, y - ny); g.closePath(); g.fill(); };
          band(wd * 1.7 * (S.edgeW ? S.edgeW / 1.7 : 1), S.edge, 0.6, 'source-over'); band(wd * 1.25, `rgb(${col})`, 0.45, 'lighter'); band(wd * 0.75, `rgb(${col})`, 0.9, 'lighter'); band(wd * 0.28, S.core, 1, 'lighter');
          slashExtra(g, { sty: id, seed: (a + 1) * 0.37, age: 0.1 }, x, y, L, c, sn, wd, 1, s);
        }
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      } else if (kind === 'card') {
        g.setTransform(1, 0, 0, 1, 0, 0);
        const ch = ND.charById ? ND.charById(chId) : null, cw = W, chh = Math.round(cw * CARD_PX.h / CARD_PX.w), y0 = Math.round((H - chh) / 2);
        const pic = document.createElement('canvas'); pic.width = CARD_PX.w; pic.height = CARD_PX.h; F.draw(pic.getContext('2d'), pic.width, pic.height);
        g.drawImage(pic, 0, y0, cw, chh);
        if (ch && o.text !== false) {
          g.textBaseline = 'middle'; g.fillStyle = ch.col.ui; g.font = `700 ${Math.round(chh * 0.5)}px "Noto Serif JP", serif`; g.fillText(ch.kanji, chh * 0.18, y0 + chh * 0.52);
          g.fillStyle = '#ece6d6'; g.font = `700 ${Math.round(chh * 0.32)}px Oswald, "Arial Narrow", sans-serif`; g.fillText(ch.name, chh * 0.8, y0 + chh * 0.54);
        }
      } else if (kind === 'arena') { g.setTransform(1, 0, 0, 1, 0, 0); arenaSwatch(g, W, H, F); }
      else if (kind === 'music') {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = F.ui; g.font = `700 ${Math.round(H * 0.42)}px "Noto Serif JP", serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('楽', W / 2, H * 0.48);
        g.strokeStyle = F.ui; g.globalAlpha = 0.6; g.lineWidth = Math.max(1, H * 0.012); g.beginPath();
        for (let i = 0; i <= 40; i++) { const x = W * (0.15 + 0.7 * i / 40), y = H * 0.82 + Math.sin(i * 0.9) * H * 0.04 * Math.sin(i / 40 * Math.PI); i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke(); g.globalAlpha = 1;
      }
    } catch (e) { if (typeof console !== 'undefined') console.warn('[flair] preview', kind, id, e); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    return cv;
  }
  // a small picture of an arena variant: its sky, moon, hills, floor and weather (the real arena is the panel's picture)
  function arenaSwatch(g, W, H, V) {
    const T = Object.assign({}, (ND.THEMES && ND.THEMES[V.base]) || {}, V.over);
    const sk = g.createLinearGradient(0, 0, 0, H * 0.7), S = T.sky || ['#05070f', '#0f1630', '#262d4c', '#141828'];
    S.forEach((c, i) => sk.addColorStop(i / (S.length - 1), c));
    g.fillStyle = sk; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40 * (T.stars || 0); i++) { g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(W * ((i * 0.618) % 1), H * ((i * 0.381) % 0.45), Math.max(1, W / 220), Math.max(1, W / 220)); }
    if (T.orb) { const o = T.orb, r = o.r * W * 1.4; const hl = g.createRadialGradient(o.x * W, o.y * H, r, o.x * W, o.y * H, r * 4); hl.addColorStop(0, `rgba(${o.halo},.35)`); hl.addColorStop(1, `rgba(${o.halo},0)`); g.fillStyle = hl; g.fillRect(0, 0, W, H); g.fillStyle = o.c0; g.beginPath(); g.arc(o.x * W, o.y * H, r, 0, TAU); g.fill(); }
    const ridge = (cols, base, amp, ph) => { if (!cols) return; const gr = g.createLinearGradient(0, H * (base - amp), 0, H * 0.75); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); g.fillStyle = gr; g.beginPath(); g.moveTo(0, H); for (let i = 0; i <= 30; i++) { const x = W * i / 30; g.lineTo(x, H * (base - amp * (0.5 + 0.35 * Math.sin(i * 0.7 + ph) + 0.15 * Math.sin(i * 1.9 + ph)))); } g.lineTo(W, H); g.closePath(); g.fill(); };
    ridge(T.ridgeA, 0.55, 0.22, 1); ridge(T.ridgeB, 0.66, 0.14, 3);
    const fl = T.floor || ['#2b3045', '#23283a', '#0d0f17'], fg = g.createLinearGradient(0, H * 0.72, 0, H);
    fl.forEach((c, i) => fg.addColorStop(i / (fl.length - 1), c));
    g.fillStyle = fg; g.fillRect(0, H * 0.72, W, H * 0.28);
    if (T.reflect > 0.12) { g.fillStyle = `rgba(${T.sheen || '220,230,255'},.12)`; g.fillRect(0, H * 0.74, W, H * 0.03); }
    const w = T.weather;
    for (let i = 0; i < 70; i++) {
      const x = W * ((i * 0.618 + 0.13) % 1), y = H * ((i * 0.381 + 0.07) % 1);
      if (w === 'snow') { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(x, y, W * (0.004 + (i % 3) * 0.002), 0, TAU); g.fill(); }
      else if (w === 'rain') { g.strokeStyle = 'rgba(190,210,235,.45)'; g.lineWidth = Math.max(1, W / 400); g.beginPath(); g.moveTo(x, y); g.lineTo(x - W * 0.01, y + H * 0.06); g.stroke(); }
      else if (T.motes && i < 24) { g.fillStyle = `rgba(${T.motes},.85)`; g.beginPath(); g.arc(x, H * 0.4 + y * 0.45, W * 0.005, 0, TAU); g.fill(); }
    }
  }

  // ================================================================ API
  const ok = (kind, id) => (typeof id === 'string' && FLAIR[kind] && FLAIR[kind][id] ? id : null);
  const flair = ND.flair = {
    kinds: KINDS.slice(), slots: SLOTS.slice(),
    set(side, o) {
      if (side !== 0 && side !== 1) return;
      const w = worn[side] = blank();
      if (o && typeof o === 'object') for (const k of SLOTS) w[k] = ok(k, o[k]);
      refreshCards();
    },
    get(side) { return Object.assign({}, worn[side === 1 ? 1 : 0]); },
    clear() { worn[0] = blank(); worn[1] = blank(); refreshCards(); },
    ids(kind) { return FLAIR[kind] ? Object.keys(FLAIR[kind]) : []; },
    kind(id) { return KIND_OF[id] || null; },
    name(id, lang) { return pickL(N[id], lang) || String(id); },
    kindName(kind, lang) { return pickL(KN[kind], lang) || String(kind); },
    arena(arenaId, variantId) {
      if (typeof arenaId !== 'string') return;
      const v = ok('arena', variantId);
      if (v && ARENA[v].base !== arenaId) return;
      if (v) VAR[arenaId] = v; else delete VAR[arenaId];
      const S = ND.scene;
      if (S && S.themeId === arenaId && S.setTheme) { const want = variantTheme(arenaId) || (ND.THEMES && ND.THEMES[arenaId]); if (S.theme !== want) S.setTheme(arenaId); }
    },
    variant(arenaId) { return VAR[arenaId] || null; },
    base(variantId) { return ARENA[variantId] ? ARENA[variantId].base : null; },
    music(id) { musicId = ok('music', id); },
    musicId() { return musicId; },
    preview,
    cardURL,

    // ---- hooks (called by the game files; see the spec at the top)
    // js/anim.js: the drawn pose of a winner in state 'win' (D: the display pose, written in place)
    winPose(f, D) {
      const w = wornOf(f), V = w && POSE[w.pose];
      if (!V || !(f.st > V.keys[0][0])) return;
      pose.seq(V.keys, f.st, D);
      const b = Math.min(1, (f.st - V.keys[V.keys.length - 1][0]) / 0.4);
      if (b > 0) { const t = f.st; D.hy += Math.sin(t * 2.2) * 1.1 * b; D.ay += Math.sin(t * 2.2 + 0.6) * 1.2 * b; }
    },
    // the preview fighters' pose name for side's worn victory pose (js/arcade.js ending), null when none
    pvPose(side) { const w = worn[side === 1 ? 1 : 0]; return w.pose && POSE[w.pose] ? 'fl_' + w.pose : null; },
    // js/fighter.js takeHit: mark = hitBegin(from) before the hit's effects, hitEnd(from, mark, ...) after them
    hitBegin(from) {
      const w = wornOf(from), g = G();
      if (!w || !w.hitfx || (g && g.simOnly)) return -1;
      recordFx('flairMark', []);
      return ND.fx.parts.length;
    },
    hitEnd(from, mark, x, y, kdir, rawDmg) {
      const w = wornOf(from);
      if (!w || !w.hitfx || mark < 0) return;
      recordFx('flairHit', [w.hitfx, x, y, kdir, rawDmg]);
      applyHit(w.hitfx, mark, x, y, kdir, rawDmg);
    },
    // js/fighter.js die: the winner's KO finish at the final hit
    onKO(from, loser, x, y, kdir) {
      const w = wornOf(from), g = G();
      if (!w || !w.ko || !KO[w.ko] || (g && (g.simOnly || g.mode === 'attract'))) return;
      recordFx('flairKO', [w.ko, x, y, kdir]);
      spawnKO(w.ko, x, y, kdir);
    },
    // js/game.js onSpecial (a ki technique starts) and the round's "Fight!"
    onSpecial(f) { addAura(f, 'special'); },
    onRoundStart(F) { if (F) for (const f of F) addAura(f, 'round'); },
    // js/game.js renderScene: the aura glows behind the fighters (world transform set)
    drawBehind(ctx) {
      const L = ND.specialFx && ND.specialFx.list;
      if (!L || !L.length) return;
      for (const o of L) if (o.fl === 1 && o.behind) { ctx.save(); o.behind(ctx); ctx.restore(); }
    },
    // js/kaeshi-cine.js: the counter's colour ('r,g,b') for fighter f and technique type t, its theme id (or null)
    slashCol(f, t) { const w = wornOf(f), S = w && SLASH[w.slash]; return S ? S.col[t.id] || t.col : t.col; },
    slashSty(f) { const w = wornOf(f); return w && SLASH[w.slash] ? w.slash : null; },
    slashEdge(sty) { return SLASH[sty] ? SLASH[sty] : null; },
    slashExtra,
    // js/scene.js setTheme: the theme to draw for arena id (a variant or null = the plain one)
    theme(arenaId) { return variantTheme(arenaId); },
    // js/music.js play: true when a menu variant played this step
    menuPlay(mu, t, s) {
      const V = musicId && MUSIC[musicId];
      if (!V || !mu.bus || !ND.audio || !ND.audio.ctx) return false;
      mu.tempo = V.tempo;
      V.play(mu, V, t, s);
      return true;
    },
    // js/game.js showStage / js/ranked.js renderVs: the name cards
    stage(phase) { if (phase === 'vs') refreshCards(); else if (phase === 'select') { for (const n of [1, 2]) { const s = typeof document !== 'undefined' && document.getElementById('vss' + n); applyCard(s && s.querySelector('.vs-name'), n - 1, null); } } },
    card(el, side) { applyCard(el, side, worn[side === 1 ? 1 : 0].card); },
    // js/scene.js fx: flair particles (kind 'F')
    upd(p, dt) { const f = FP[p.fn]; if (f) f.u(p, dt); },
    drw(ctx, p, t, lo) { const f = FP[p.fn]; if (f) f.d(ctx, p, t, lo); },
  };
})(window.ND);
