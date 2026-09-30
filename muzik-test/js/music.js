// Shadow Duel — generative music, made entirely in code (no recordings, nothing downloaded).
// Instruments: koto, shamisen, biwa and the Okinawan sanshin (plucked strings, Karplus-Strong, each with its own
// colour: the shamisen and the biwa buzz on the bridge, "sawari"), shakuhachi and shinobue (sine voices with breath),
// taiko (odaiko, shime-daiko), kotsuzumi, bells (the small matsuri gong, the big temple bell, a singing bowl), hyoshigi.
// Scales: in-sen (miyako-bushi), yo-sen, hirajoshi, kumoijoshi, iwato, ryukyu.
// Themes (THEMES): one per arena (scale, key, tempo, and the drum / string / flute parts of a fight and of the final
// round), Shura's boss theme, the ranked theme, three menu themes that take turns, and the journey's ending.
// Callers only ask for a mode (setMode: 'menu' | 'fight' | 'final' | 'ko' | 'off'); the theme is read from the game on
// the next scheduler tick, when the caller's other changes (arena, fighters, screen) are all made:
//   fight / final / ko   Shura in the fight → boss; a ranked online match → ranked; otherwise the arena's theme
//   menu                 the journey just completed → ending; the VS card, KO replay and result screen of a real match →
//                        that fight theme's calm intro; otherwise the current menu theme
// A new theme crossfades (the old one's ringing notes fade out on their own bus); within a theme a fight starts on the
// next beat and fight <-> final round changes on the next bar. The menu's demo fight never changes the music.
// Cost: notes are scheduled 0.35 s ahead from a 60 ms timer, and nothing at all while the music can't be heard. Each
// plucked-string sample is computed once per pitch, in small slices while the browser is idle (requestIdleCallback),
// and cached; a note whose sample is not ready yet borrows the nearest one, re-pitched.
(function (ND) {
  'use strict';
  const au = ND.audio;
  const SCALES = { in: [0, 1, 5, 7, 8], yo: [0, 2, 5, 7, 9], hira: [0, 2, 3, 7, 8], kumoi: [0, 1, 5, 7, 10], iwato: [0, 1, 5, 6, 10], ryukyu: [0, 4, 5, 7, 11] };
  const SCALE = SCALES.in;                 // miyako-bushi (in-sen) on D: the original menu and temple music
  const BASE = 146.83;                     // D3 (MIDI 50)
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // drum / bell patterns: a character per 16th, '.' = rest, '1'…'9' = level 0.1…0.9, 'X' = 1
  const lv = (p, b) => { if (!p) return 0; const ch = p.charCodeAt(b % p.length); return ch === 46 ? 0 : ch === 88 ? 1 : (ch - 48) / 10; };
  // string patterns: a scale degree per 16th in base 36 ('0'…'9', 'a' = 10…), '.' = rest
  const dg = (p, b) => { const ch = p[b % p.length]; return ch === '.' ? null : parseInt(ch, 36); };
  const rnd = Math.random;

  // Plucked strings. sr: the sample's own rate (lower = warmer and half the work; none = the audio context's); w: loop
  // filter (0.5 = the koto's soft average, higher = brighter); dk: loss per round trip; sm: smoothing passes of the
  // first noise (darker); cl: sawari (the string's swing softly clipped on one side: a buzz that rings on); lp: a gentle
  // low-pass on the output (Hz); th: the plectrum's thump on the skin (level, Hz); k: peak level (none = as made, the
  // koto); g: note level; dur: length by pitch (s). The last 15 % fades out, so no note ends in a click.
  const STR = {
    koto: { w: 0.5, dk: (f) => 0.9965 - f / 60000, sm: 1, g: 0.55, dur: (f) => (f < 190 ? 2.2 : f < 400 ? 1.8 : 1.4) },
    sham: { sr: 24000, w: 0.6, dk: (f) => 0.993 - f / 40000, cl: 0.45, lp: 2800, th: [0.3, 190], k: 0.7, g: 0.42, dur: (f) => (f < 300 ? 1.1 : 0.8) },
    biwa: { sr: 24000, w: 0.5, dk: (f) => 0.9975 - f / 50000, sm: 2, cl: 0.35, lp: 2200, th: [0.3, 120], k: 0.75, g: 0.5, dur: () => 1.8 },
    san: { sr: 24000, w: 0.55, dk: (f) => 0.994 - f / 45000, sm: 1, cl: 0.55, lp: 2000, th: [0.12, 170], k: 0.7, g: 0.4, dur: () => 1.2 },
  };
  const CAP = 3.2e6;                       // cached string samples, in 48 kHz frames (~13 MB); the least used go first

  // ---------------------------------------------------------------- themes
  // sc / root: scale and the MIDI note of degree 0; bpm: [calm intro / menu, fight, final round]; g: level trim (the
  // themes are matched in loudness to the original); og: odaiko level; st: the resting degrees (mod 5) a flute phrase
  // ends on; pre: the string samples to make ahead ({kind: [lo, hi]} degrees).
  // I: the calm intro (VS card, result screen): i walking string, lo / hi its range, p its chance per beat, bi / bd the
  //    bar's low note, l flute (shaku | fue), le every le bars, e events, pu a low pulse pattern, dr a drone.
  // N / F: the fight and the final round:
  //   o, s     odaiko and shime-daiko patterns; sr = chance of an extra soft shime on a free 16th
  //   x        a pattern for the theme's own percussion (xk: kane | tsu | hyo)
  //   pu, dr   a low pulse (pattern) / a drone under every two bars
  //   k        string layers: i instrument, p degrees, o offset, sh shift per bar (of 4), a [on the beat, between]
  //            levels, pan, dy a second string this many degrees higher, bend chance (bd semitones)
  //   l        flute: i shaku | fue, every ev bars on bar at, lo / hi walk range; d = one long note (s), or r = a phrase
  //            rhythm ('x' = a note, up to 2 bars); br = breath ×
  //   e        events on step b of bar at (of every ev): gl glissando (degrees a → z), tr tremolo (d, n notes), bon /
  //            rin bells, kane, hyo clappers, roll an odaiko roll, biwa a bent biwa note
  const KT = { i: 'koto', p: '0.2.3.2.5.3.2.1.', sh: [0, 0, 1, 0] };   // the original fight ostinato
  const THEMES = {
    // Moonlit Temple: the original music (fight and final round as they were) and a soft temple bell every 16 bars
    temple: {
      sc: 'in', root: 50, bpm: [64, 98, 116], pre: { koto: [0, 13] },
      N: { o: 'X.....7.7.......', s: '8.4.8.4.8.4.8.4.', k: [KT], l: { i: 'shaku', ev: 8, at: 4, lo: 6, hi: 12, d: 3, v: 0.7 }, e: [{ k: 'bon', ev: 16, at: 8, v: 0.3 }] },
      F: { o: 'X..7..7.7..7..77', s: '8.4.8.4.8.4.8.4.', sr: 0.35, k: [{ ...KT, o: 3 }], l: { i: 'shaku', ev: 8, at: 4, lo: 6, hi: 12, d: 3, v: 0.7 } },
    },
    // Stormy Bamboo: kumoijoshi on C, slow and low (under the rain's hiss), a biwa that bends, odaiko rolls like thunder
    rain: {
      sc: 'kumoi', root: 48, bpm: [56, 84, 100], g: [-0.2, 1.1, -0.3], pre: { koto: [2, 11], biwa: [-1, 1] },
      I: { lo: 2, hi: 9, p: 0.45, bi: 'biwa', llo: 4, lhi: 9 },
      N: { o: 'X.......6.......', s: '..3...3...3...3.', k: [{ i: 'koto', p: '0...1.0.3...2.1.', o: 3, sh: [0, 0, -1, 1], a: [0.6, 0.42], pan: 0.3 }, { i: 'biwa', p: '0...............', sh: [0, 0, 1, -1], a: [0.65, 0.65], pan: 0.1, bend: 0.5, bd: 1 }],
        l: { i: 'shaku', ev: 4, at: 2, lo: 5, hi: 10, d: 3.4, v: 0.7 }, e: [{ k: 'roll', ev: 8, at: 7, b: 8 }] },
      F: { o: 'X.....6.X...6.7.', s: '4.3.4.3.4.3.4.3.', sr: 0.2, k: [{ i: 'koto', p: '0.1.3.1.0.1.4.3.', o: 5, sh: [0, 0, -1, 1], a: [0.6, 0.4], pan: 0.3 }, { i: 'biwa', p: '0.......0.......', sh: [0, 0, 1, -1], a: [0.65, 0.5], pan: 0.1, bend: 0.5, bd: 1 }],
        l: { i: 'shaku', ev: 4, at: 2, lo: 6, hi: 12, d: 2.6, v: 0.75 }, e: [{ k: 'roll', ev: 4, at: 3, b: 8 }, { k: 'gl', ev: 8, at: 0, a: 3, z: 11, dt: 0.04, v: 0.45 }] },
    },
    // Snowy Peak: in-sen on E, sparse and cold, the shakuhachi leads; a high koto tremolo and a singing bowl
    snow: {
      sc: 'in', root: 52, bpm: [54, 76, 92], g: [-2.2, 0.2, 2], pre: { koto: [4, 12] },
      I: { lo: 4, hi: 12, p: 0.35, le: 2, llo: 4, lhi: 10, e: [{ k: 'rin', ev: 8, at: 0, v: 0.35 }] },
      N: { o: 'X...............', s: '....3.......3...', k: [{ i: 'koto', p: '5.......8...7...', sh: [0, 1, -1, 0], a: [0.55, 0.4], pan: 0.35 }],
        l: { i: 'shaku', ev: 2, at: 0, lo: 3, hi: 10, d: 2.8, v: 0.75 }, e: [{ k: 'tr', ev: 4, at: 3, b: 8, d: 10, n: 10, dt: 0.06, v: 0.28 }, { k: 'rin', ev: 8, at: 4, v: 0.35 }] },
      F: { o: 'X.......7.......', s: '4...3...4...3.3.', k: [{ i: 'koto', p: '5.7.8.7.5.7.9.8.', sh: [0, 0, 1, -1], a: [0.55, 0.38], pan: 0.3 }],
        l: { i: 'shaku', ev: 2, at: 0, lo: 5, hi: 12, d: 2.2, v: 0.8 }, e: [{ k: 'tr', ev: 2, at: 1, b: 8, d: 10, n: 12, dt: 0.05, v: 0.3 }, { k: 'rin', ev: 8, at: 4, v: 0.35 }] },
    },
    // Burning Village: iwato on D, fast and tense, heavy taiko, a driving shamisen, bent biwa stabs, a breathy flute
    village: {
      sc: 'iwato', root: 50, bpm: [66, 120, 136], g: [-0.5, -3.7, -3.7], og: 1.1, st: [0, 2], pre: { koto: [0, 10], sham: [3, 10], biwa: [0, 0] },
      I: { i: 'sham', lo: 3, hi: 9, p: 0.5, bi: 'biwa', llo: 5, lhi: 10 },
      N: { o: 'X..7..X.X..7.7..', s: '8.5.8.5.8.5.8.5.', sr: 0.25, k: [{ i: 'sham', p: '0.0.1.0.0.0.3.2.', o: 5, sh: [0, 0, 1, -1], a: [0.65, 0.45], pan: 0.2 }, { i: 'koto', p: '0.......0.......', a: [0.55, 0.55], pan: 0.3 }],
        l: { i: 'shaku', ev: 4, at: 2, lo: 6, hi: 12, d: 1.6, v: 0.7, br: 1.8 }, e: [{ k: 'biwa', ev: 2, at: 0, d: 0, bend: 1, v: 0.7 }] },
      F: { o: 'X.7.X.7.X.7.X777', s: '8.5.8.5.8.5.8.5.', sr: 0.5, k: [{ i: 'sham', p: '0.01.0.03.0.1.32', o: 5, sh: [0, 1, 0, 2], a: [0.65, 0.45], pan: 0.2 }, { i: 'koto', p: '0...0...0...0...', a: [0.55, 0.5], pan: 0.3 }],
        l: { i: 'shaku', ev: 2, at: 1, lo: 7, hi: 13, d: 1.4, v: 0.75, br: 1.8 }, e: [{ k: 'gl', ev: 4, at: 0, a: 0, z: 9, dt: 0.025, v: 0.45 }, { k: 'biwa', ev: 1, at: 0, d: 0, bend: 1, v: 0.7 }] },
    },
    // Night Market: yo-sen on G, a matsuri: the small gong (chan-chiki), shime patterns, a light shamisen, shinobue tunes
    market: {
      sc: 'yo', root: 55, bpm: [72, 112, 128], g: [4.2, -1.7, -2.1], xk: 'kane', pre: { koto: [4, 10], sham: [0, 9] },
      I: { i: 'sham', lo: 2, hi: 9, p: 0.5, l: 'fue', llo: 5, lhi: 10, e: [{ k: 'kane', ev: 2, at: 1, b: 8, v: 0.4 }] },
      N: { o: 'X...7...X..7.7..', s: '6.3.6..36.3.6.3.', x: '6.3.6.3.6.3.6.33', k: [{ i: 'sham', p: '0.2.3.2.4.3.2.1.', sh: [0, 0, 2, 0], a: [0.5, 0.35], pan: 0.3 }],
        l: { i: 'fue', r: 'x.x.x...x.x.x...x.x.x.x.x...x...', ev: 4, at: 0, lo: 5, hi: 11, v: 0.6 }, e: [{ k: 'hyo', ev: 8, at: 7, b: 12, v: 0.5 }] },
      F: { o: 'X.7.X.7.X.7.X.77', s: '6.36.36.6.36.363', x: '6.3.6.336.3.6336', k: [{ i: 'sham', p: '0.2.3.2.4.3.2.1.', o: 2, sh: [0, 0, 2, 0], a: [0.5, 0.35], pan: 0.3 }, { i: 'koto', p: '5.......7.......', a: [0.5, 0.5], pan: 0.35 }],
        l: { i: 'fue', r: 'x.x.x.x.x.x.x...', ev: 2, at: 0, lo: 5, hi: 12, v: 0.65 }, e: [{ k: 'hyo', ev: 4, at: 3, b: 12, v: 0.5 }] },
    },
    // Waterfall: hirajoshi on A, calm and flowing: koto arpeggios, falling glissandi, a soft kotsuzumi
    waterfall: {
      sc: 'hira', root: 45, bpm: [60, 88, 104], g: [-0.6, 2.3, 1.5], xk: 'tsu', pre: { koto: [3, 14] },
      I: { lo: 5, hi: 12, p: 0.5, bd: 3, e: [{ k: 'gl', ev: 8, at: 3, b: 8, a: 13, z: 5, dt: 0.06, v: 0.35 }] },
      N: { o: 'X.......5.......', s: '....3.......3...', x: '..........5.....', k: [{ i: 'koto', p: '5.7.8.7.a.8.7.6.', sh: [0, 0, -1, 1], a: [0.5, 0.32], pan: 0.3 }],
        l: { i: 'shaku', ev: 8, at: 4, lo: 8, hi: 13, d: 3.2, v: 0.65 }, e: [{ k: 'gl', ev: 4, at: 0, a: 13, z: 5, dt: 0.04, v: 0.42 }] },
      F: { o: 'X.....6.X...6...', s: '6.3.6.3.6.3.6.3.', x: '....6.....5.6...', k: [{ i: 'koto', p: '5.7.8.7.a.8.7.6.', o: 2, sh: [0, 0, -1, 1], a: [0.5, 0.32], pan: 0.3 }, { i: 'koto', p: '3.......5.......', a: [0.5, 0.5], pan: -0.3 }],
        l: { i: 'shaku', ev: 4, at: 2, lo: 8, hi: 14, d: 2.6, v: 0.7 }, e: [{ k: 'gl', ev: 2, at: 0, a: 14, z: 5, dt: 0.035, v: 0.42 }, { k: 'tr', ev: 4, at: 3, b: 8, d: 10, n: 8, dt: 0.05, v: 0.35 }] },
    },
    // Castle Roof: yo-sen on D, stately: a slow march of big odaiko, biwa on the beats, koto in thirds, the temple bell
    castle: {
      sc: 'yo', root: 50, bpm: [60, 84, 100], g: [-0.9, -1.1, -0.5], og: 1.1, pre: { koto: [3, 12], biwa: [-1, 4] },
      I: { lo: 3, hi: 10, p: 0.45, bi: 'biwa', e: [{ k: 'bon', ev: 8, at: 0, v: 0.35 }] },
      N: { o: 'X.......8.......', s: '....6.......6...', k: [{ i: 'biwa', p: '0...2...3...2...', sh: [0, 0, 1, -1], a: [0.6, 0.5], pan: 0.15, bend: 0.25, bd: 2 }, { i: 'koto', p: '..7...7...8...7.', dy: 2, sh: [0, 0, 1, 0], a: [0.45, 0.42], pan: 0.3 }],
        l: { i: 'shaku', ev: 4, at: 0, lo: 5, hi: 10, d: 3.2, v: 0.7 }, e: [{ k: 'bon', ev: 8, at: 0, v: 0.35 }, { k: 'roll', ev: 4, at: 3, b: 8 }] },
      F: { o: 'X...8...X...8.8.', s: '6.3.6.3.6.3.6.3.', sr: 0.15, k: [{ i: 'biwa', p: '0.0.2.0.3.0.2.0.', sh: [0, 0, 1, -1], a: [0.6, 0.45], pan: 0.15, bend: 0.2, bd: 2 }, { i: 'koto', p: '7.7.8.7.9.8.7.7.', dy: 2, sh: [0, 0, 1, 0], a: [0.45, 0.35], pan: 0.3 }],
        l: { i: 'shaku', ev: 2, at: 0, lo: 6, hi: 11, d: 2.4, v: 0.75 }, e: [{ k: 'tr', ev: 2, at: 1, b: 0, d: 10, n: 10, dt: 0.05, v: 0.35 }, { k: 'bon', ev: 8, at: 0, b: 8, v: 0.35 }] },
    },
    // Shura (boss): iwato on B, dark and heavy: a low drone, biting biwa, thick taiko, a rough breathy shakuhachi
    boss: {
      sc: 'iwato', root: 47, bpm: [60, 104, 120], g: [-1.4, -3.1, -2.9], og: 1.2, st: [0, 2], pre: { koto: [0, 10], biwa: [-1, 5] },
      I: { i: 'biwa', lo: 0, hi: 5, p: 0.35, llo: 3, lhi: 9, dr: 1, e: [{ k: 'bon', ev: 8, at: 0, v: 0.4, m: 35 }] },
      N: { o: 'X..7..7.X..7..7.', s: '6.3.6.3.6.3.6.3.', sr: 0.2, dr: 1, k: [{ i: 'biwa', p: '0..0..1.0..0..3.', sh: [0, 0, 1, -1], a: [0.7, 0.5], pan: 0.1, bend: 0.3, bd: 1 }, { i: 'koto', p: '5.......6.......', a: [0.45, 0.45], pan: 0.3 }],
        l: { i: 'shaku', ev: 4, at: 2, lo: 3, hi: 9, d: 2.6, v: 0.7, br: 2 }, e: [{ k: 'tr', ev: 4, at: 3, b: 0, d: 8, n: 12, dt: 0.045, v: 0.33 }, { k: 'bon', ev: 8, at: 0, v: 0.4, m: 35 }] },
      F: { o: 'X.7.X.7.X.7.X.77', s: '8.4.8.4.8.4.8.4.', sr: 0.45, dr: 1, k: [{ i: 'biwa', p: '0.00.0.1.0.00.3.', sh: [0, 0, 1, -1], a: [0.7, 0.5], pan: 0.1, bend: 0.3, bd: 1 }, { i: 'koto', p: '5...6...5...8...', a: [0.45, 0.45], pan: 0.3 }],
        l: { i: 'shaku', ev: 2, at: 1, lo: 4, hi: 10, d: 2, v: 0.75, br: 2 }, e: [{ k: 'gl', ev: 2, at: 0, a: 0, z: 10, dt: 0.022, v: 0.4 }, { k: 'tr', ev: 4, at: 3, b: 0, d: 8, n: 12, dt: 0.04, v: 0.35 }] },
    },
    // Ranked: hirajoshi on C#, tense and a little modern (a steady low pulse, a backbeat) on the same instruments
    ranked: {
      sc: 'hira', root: 49, bpm: [70, 124, 140], g: [3.3, -2.5, -2], xk: 'hyo', pre: { koto: [3, 11], sham: [4, 10] },
      I: { lo: 3, hi: 10, p: 0.5, l: 'fue', llo: 5, lhi: 10, pu: '6.......3.......' },
      N: { o: 'X..7..X...X..7..', s: '....8.......8...', pu: '6.3.6.3.6.3.6.3.', k: [{ i: 'sham', p: '5.58.5.56.65.8.7', sh: [0, 0, 1, -1], a: [0.55, 0.38], pan: 0.25 }],
        l: { i: 'fue', r: '..x.x.x...x.x...', ev: 4, at: 2, lo: 5, hi: 10, v: 0.55 }, e: [{ k: 'hyo', ev: 2, at: 1, b: 12, v: 0.4 }, { k: 'gl', ev: 8, at: 0, a: 3, z: 10, dt: 0.03, v: 0.35 }] },
      F: { o: 'X.7.X.7.X.7.X.7.', s: '....8.......8.88', pu: '6363636363636363', k: [{ i: 'sham', p: '5.58.5.56.65.8.7', o: 1, sh: [0, 0, 1, -1], a: [0.55, 0.38], pan: 0.25 }, { i: 'koto', p: '3.......5.......', a: [0.5, 0.5], pan: -0.3 }],
        l: { i: 'fue', r: 'x.x.x.x.x...x.x.', ev: 2, at: 1, lo: 5, hi: 11, v: 0.6 }, e: [{ k: 'hyo', ev: 1, at: 0, b: 12, v: 0.4 }, { k: 'gl', ev: 4, at: 0, a: 3, z: 11, dt: 0.025, v: 0.38 }] },
    },
    // Menu A: the original menu music (in-sen on D)
    menuA: { sc: 'in', root: 50, bpm: [64], menu: 1, pre: { koto: [0, 12] } },
    // Menu B, "dawn": yo-sen on F, two koto voices, a soft kotsuzumi, the shakuhachi every 4 bars
    menuB: {
      sc: 'yo', root: 53, bpm: [58], g: [2.8], menu: 1, pre: { koto: [0, 12] },
      step(t, s) {
        const bar = s >> 4, b = s & 15;
        if (bar % 4 !== 3 && b % 2 === 0 && rnd() < (b % 4 === 0 ? 0.7 : 0.3)) this.pl(t, 'koto', this.mid(this.stepWalk(5, 12)), 0.5 + rnd() * 0.25, 0.25);
        if (b === 0) this.pl(t, 'koto', this.mid(bar % 2 ? 3 : 0), 0.55, -0.35);
        if (b === 10 && bar % 2 === 1) this.pl(t, 'koto', this.mid(2), 0.4, -0.2);
        if (bar % 4 === 1 && b === 8) this.tsu(t, 0.35, false);
        if (bar % 4 === 1 && b === 14) this.tsu(t, 0.2, true);
        if (bar % 4 === 2 && b === 0) this.shakuhachi(t, hz(this.mid(this.stepWalk(5, 10))), 3, 0.7);
        if (bar % 8 === 7 && b === 8) this.gl(t, 5, 12, 0.07, 0.4);
      },
    },
    // Menu C, "island night": ryukyu on C, a gentle sanshin tune, sanba clicks, a quiet shinobue now and then
    menuC: {
      sc: 'ryukyu', root: 48, bpm: [76], g: [7.5], menu: 1, pre: { san: [0, 5], koto: [0, 0] },
      step(t, s) {
        const bar = s >> 4, b = s & 15, d = dg(['0.2.3.2.4.3.2...', '3.4.5.4.3.2.0...', '0.2.3.4.5.4.3.2.', '4.3.2.0.2...0...'][bar % 4], b);
        if (d !== null && rnd() < 0.9) this.pl(t, 'san', this.mid(d), b % 4 === 0 ? 0.55 : 0.4, b % 4 === 0 ? -0.15 : 0.15);
        if (b === 0 && bar % 2 === 0) this.pl(t, 'koto', this.mid(0), 0.45, -0.3);
        if (bar % 2 === 1 && (b === 6 || b === 14)) this.hyo(t, 0.15);
        if (bar % 4 === 2 && b === 0) this.lead(t, { i: 'fue', r: 'x...x.x.x.......', lo: 5, hi: 9, v: 0.45 });
      },
    },
    // The journey's ending: yo-sen on D, a composed cue (the temple bell, a rising glissando, two shakuhachi phrases
    // over koto arpeggios, a last chord), then a quiet loop for the ending screen
    ending: {
      sc: 'yo', root: 50, bpm: [60], g: [-1.2], pre: { koto: [0, 10] }, I: { lo: 3, hi: 10, p: 0.45 },
      step(t, s) {
        const bar = s >> 4, b = s & 15, spb = this.spb;
        if (bar >= 10) return this.introStep(t, s);
        if (bar === 0 && b === 0) { this.bon(t, 0.5, 38); this.gl(t, 0, 10, 0.06, 0.45); }
        if (bar === 0 && b === 8) this.pl(t, 'koto', this.mid(5), 0.5, 0);
        // the two phrases, [step, degree], each one breath
        if (b === 0 && (bar === 1 || bar === 5)) {
          const M = bar === 1 ? [[0, 8], [8, 9], [12, 8], [16, 7], [28, 6], [32, 5]] : [[0, 8], [8, 10], [16, 9], [22, 8], [24, 7], [32, 8], [48, 5]];
          this.wind(t, 'shaku', M.map(([o, d]) => [o * spb, this.mid(d)]), (bar === 1 ? 44 : 60) * spb, 0.75);
        }
        const A = bar === 3 ? '0...3...5...3...' : bar === 4 || bar >= 8 ? '' : bar >= 5 ? '2.3.5.7.5.3.2.3.' : '0.2.3.5.3.2.3.5.';
        const d = A && bar >= 1 ? dg(A, b) : null;
        if (d !== null) this.pl(t, 'koto', this.mid(d), b % 4 === 0 ? 0.42 : 0.32, b % 4 === 0 ? -0.25 : 0.25);
        if (bar === 4 && b === 0) { this.drum(t, 'o', 0.6); [0, 3, 5].forEach((k, i) => this.pl(t + i * 0.03, 'koto', this.mid(k), 0.5, i * 0.2 - 0.2)); }
        if (bar === 4 && b === 8) this.tsu(t, 0.35, false);
        if (bar === 8 && b === 0) { this.bon(t, 0.45, 38); this.gl(t, 0, 7, 0.05, 0.45); this.drum(t, 'o', 0.5); }
      },
    },
  };
  const MENUS = ['menuA', 'menuB', 'menuC'];
  const MENU_BARS = 40;                    // a menu theme hands over to the next after this many bars (2–3 minutes)
  const fightish = (m) => m === 'fight' || m === 'final';
  const ROLL = [0, 2, 4, 5, 6, 7];         // the steps of an odaiko roll

  const mu = ND.music = {
    ready: false, enabled: true, mode: 'off', nextMode: 'off', tempo: 66, step: 0, nextT: 0, timer: null,
    kotoBufs: [], walk: 7,
    THEMES, MENUS, th: 'temple', T: THEMES.temple, req: 'off', dirty: false, pend: null, fixed: null,
    bank: { koto: {}, sham: {}, biwa: {}, san: {}, g: {} }, jobs: [], job: null, pumping: false, frames: 0,
    menuIx: 0, fought: false, spb: 60 / 98 / 4,

    init() {
      if (this.ready || !au.ready) return;
      const c = au.ctx;
      // bus level = on/off switch × music slider (ND.audio.vol.music); the reverb send is taken after it
      this.bus = c.createGain(); this.bus.gain.value = this.level();
      // duck: a second gain after the level, only for short dips under the announcer (js/voice.js → duck()); the
      // reverb send is taken after it, so the music's tail dips too
      this.duckG = c.createGain(); this.bus.connect(this.duckG);
      this.duckG.connect(au.master);
      const send = c.createGain(); send.gain.value = 0.45; this.duckG.connect(send); send.connect(au.rev);
      // two theme buses for crossfades: every note goes into `out`; a new theme fades the old bus out (its notes ring
      // on under the fade) and the other one in
      // Each bus also keeps a few shared nodes, so a note makes fewer of its own: 7 pan positions (-0.3 … 0.3) for the
      // strings, and the two drum filters
      this.slots = [c.createGain(), c.createGain()];
      this.slots.forEach((g) => {
        g.gain.value = 0; g.connect(this.bus);
        if (c.createStereoPanner) g._pn = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3].map((v) => { const p = c.createStereoPanner(); p.pan.value = v; p.connect(g); return p; });
        g._fo = c.createBiquadFilter(); g._fo.type = 'lowpass'; g._fo.frequency.value = 500; g._fo.connect(g);
        g._fs = c.createBiquadFilter(); g._fs.type = 'bandpass'; g._fs.frequency.value = 900; g._fs.Q.value = 1.5; g._fs.connect(g);
      });
      this.si = 0; this.out = this.slots[0]; this.out.gain.value = 1;
      // the original koto samples (in-sen on D, 2.5 octaves) are made at once: js/sfx.js plays them too
      for (let i = 0; i < 13; i++) {
        const m = 50 + Math.floor(i / 5) * 12 + SCALE[i % 5], j = this.job0('koto', m, 2.2);
        this.run(j, j.len);
        j.buf._base = true;
        this.bank.koto[m] = j.buf; this.kotoBufs.push(j.buf);
      }
      this.frames = 13 * ((c.sampleRate * 2.2) | 0);
      // the menu themes take turns: each visit starts with the next one
      try { const v = localStorage.getItem('sd-music-menu'); this.menuIx = v === null ? 0 : ((+v | 0) + 1) % MENUS.length; localStorage.setItem('sd-music-menu', String(this.menuIx)); } catch (e) { this.menuIx = 0; }
      this.ready = true;
      this.nextT = c.currentTime + 0.1;
      // notes are scheduled 0.35 s ahead, checked every 60 ms: a slow frame or a busy moment of up to ~0.3 s on the
      // main thread leaves no gap in the music
      this.timer = setInterval(() => this.schedule(), 60);
      if (this.req !== 'off' || this.fixed) this.dirty = true;
    },

    level() { return this.enabled ? 0.38 * au.curve(au.vol.music) : 0; },
    setEnabled(v) {
      this.enabled = v;
      if (this.bus) au.ramp(this.bus.gain, this.level(), 0.3);
    },
    // music slider moved (ND.audio.setVolume): short glide, no clicks
    applyVolume() { if (this.bus) au.ramp(this.bus.gain, this.level(), 0.04); },
    // Dip the music by `db` for `sec` seconds (announcer lines), then glide back. A new dip restarts the hold.
    duck(db, sec) {
      if (!this.duckG || !au.ctx) return;
      const g = this.duckG.gain, t = au.ctx.currentTime;
      au.ramp(g, Math.pow(10, -Math.abs(db) / 20), 0.05);
      try { g.setTargetAtTime(1, t + Math.max(0.1, sec), 0.22); } catch (e) { g.value = 1; }
    },
    // The game asks for a mode; the theme is chosen on the next tick (resolve), after the caller's other changes
    setMode(m) {
      this.req = this.nextMode = m; this.dirty = true;
      if (m === 'off') this.resolve();
    },
    // Listening page and tools: play this theme and mode whatever the game shows; force(null) gives the choice back
    force(th, md) {
      const T = THEMES[th];
      this.fixed = T ? { th, md: md || (T.N ? 'fight' : 'menu') } : null;
      this.dirty = true;
      if (this.ready) this.resolve();
    },

    // the original D in-sen degree → Hz (kept for tools)
    freq(i) { const oct = Math.floor(i / 5), deg = SCALE[((i % 5) + 5) % 5]; return BASE * Math.pow(2, (oct * 12 + deg) / 12); },
    // a degree of the current theme's scale → MIDI note
    mid(i) { const T = this.T, o = Math.floor(i / 5); return T.root + o * 12 + SCALES[T.sc][i - o * 5]; },
    bpm() { const b = this.T.bpm, m = this.mode; return m === 'ko' ? 60 : m === 'fight' ? b[1] || b[0] : m === 'final' ? b[2] || b[1] || b[0] : b[0]; },
    // the theme's level trim for a mode (dB → gain): every theme sits at the original music's loudness
    trim(md) { const g = this.T.g; if (!g) return 1; const db = md === 'final' ? g[2] ?? g[1] ?? g[0] : md === 'fight' || md === 'ko' ? g[1] ?? g[0] : g[0]; return Math.pow(10, db / 20); },

    // ---------------------------------------------------------------- choosing the theme
    fightTheme() {
      const G = ND.game;
      if (!G) return 'temple';
      if (this.isBoss(G)) return 'boss';
      try { if (G.mode === 'online' && ND.ranked && ND.ranked.state && ND.ranked.state().match) return 'ranked'; } catch (e) { /* no ranked */ }
      const a = ND.scene && ND.scene.themeId, T = THEMES[a];
      return T && T.N && a !== 'boss' && a !== 'ranked' ? a : 'temple';
    },
    isBoss(G) {
      const sh = (x) => { const ch = typeof x === 'number' ? ND.CHARS && ND.CHARS[x] : x; return !!(ch && (ch.id === 'shura' || ch.boss)); };
      if (G.phase === 'vs') {
        // the VS card comes before the fighters are set: the run's next fight tells
        const r = G.runner && G.runner.run; if (!r) return false;
        const fi = r.fights && r.fights[r.i];
        return !!((fi && (fi.boss || sh(fi.opp) || sh(fi.oppIdx))) || sh(r.opp));
      }
      return !!(G.F && G.F.some((f) => f && sh(f.ch)));
    },
    resolve() {
      this.dirty = false;
      const G = ND.game, attract = !G || G.mode === 'attract';
      let th, md;
      if (this.fixed) ({ th, md } = this.fixed);
      else {
        md = this.req;
        if (md === 'off') { this.mode = 'off'; this.pend = null; return; }
        if (attract) md = 'menu';               // the menu's demo fight (its KO, its rounds) leaves the menu music alone
        if (md === 'menu') {
          if (!attract && G.phase === 'ending' && G.runner && G.runner === ND.arcade && G.runner.run && G.runner.run.done) th = 'ending';
          else if (!attract && ['vs', 'replay', 'end', 'ko', 'timeup'].includes(G.phase)) { th = this.fightTheme(); md = 'intro'; }
          else {
            if (this.fought) this.menuIx = (this.menuIx + 1) % MENUS.length;
            this.fought = false;
            th = THEMES[this.th].menu && this.mode === 'menu' && !this.pend ? this.th : MENUS[this.menuIx];
          }
        } else {
          th = this.fightTheme();
          this.fought = true;
        }
      }
      this.go(th, md);
    },
    // Start `md` of theme `th`: a new theme at once with a crossfade; the same theme on the next beat (a fight starting,
    // the calm intro) or bar (fight <-> final round); the KO cue at once
    go(th, md) {
      this.pend = null;
      if (th === this.th && md === this.mode) return;
      if (th !== this.th || this.mode === 'off') { this.swap(th, md); return; }
      if (md === 'ko') { this.mode = md; this.step = 0; try { this.out.gain.setTargetAtTime(this.trim(md), au.ctx.currentTime, 0.08); } catch (e) { /* level stays */ } return; }
      this.pend = { md, at: fightish(md) && fightish(this.mode) ? 16 : 4 };
    },
    swap(th, md) {
      const c = au.ctx, was = this.mode;
      this.th = th; this.T = THEMES[th]; this.mode = md; this.step = 0;
      if (!c || !this.slots) return;
      this.prewarm();
      if (was === 'off') this.nextT = Math.max(this.nextT, c.currentTime + 0.05);
      // the old bus fades out (its notes still ringing); the new one comes in quickly for a fight, gently otherwise
      const old = this.slots[this.si]; this.si ^= 1; const nw = this.out = this.slots[this.si];
      const t = c.currentTime, g = this.trim(md), quick = fightish(md) || md === 'ko';
      try {
        old.gain.cancelScheduledValues(t); old.gain.setValueAtTime(old.gain.value, t); old.gain.setTargetAtTime(0, t, was === 'off' ? 0.05 : 0.5);
        nw.gain.cancelScheduledValues(t); nw.gain.setValueAtTime(was === 'off' ? g : nw.gain.value, t); nw.gain.setTargetAtTime(g, t, quick ? 0.05 : 0.35);
      } catch (e) { old.gain.value = 0; nw.gain.value = g; }
    },

    // ---------------------------------------------------------------- scheduler
    // Hidden tab, running ad, music switched off or turned down to nothing, sound off: nothing is scheduled (nothing
    // could be heard), the clock keeps moving
    schedule() {
      if (!this.ready) return;
      const c = au.ctx;
      if (this.dirty) this.resolve();
      if (this.mode === 'off' || document.hidden || au.adMuted || !(this.level() > 0) || (au.playerSilent && au.playerSilent())) { this.nextT = Math.max(this.nextT, c.currentTime + 0.05); return; }
      if (this.nextT < c.currentTime - 0.3) this.nextT = c.currentTime + 0.05;   // after a long stall: no burst of late notes
      while (this.nextT < c.currentTime + 0.35) {
        this.tempo = this.bpm();
        this.spb = 60 / this.tempo / 4; // a 16th
        this.play(this.nextT, this.step);
        this.nextT += this.spb;
        this.step++;
        if (this.pend && this.step % this.pend.at === 0) {
          this.mode = this.pend.md; this.pend = null; this.step = 0;
          try { this.out.gain.setTargetAtTime(this.trim(this.mode), this.nextT, 0.08); } catch (e) { /* level stays */ }
        }
        else if (this.T.menu && this.mode === 'menu' && !this.fixed && this.step >= MENU_BARS * 16 && this.step % 16 === 0) {
          this.menuIx = (this.menuIx + 1) % MENUS.length; this.swap(MENUS[this.menuIx], 'menu');
        }
      }
      if (this.jobs.length || this.job) this.pump();
    },

    play(t, s) {
      const m = this.mode;
      if (m === 'ko') return this.koStep(t, s);
      if (fightish(m) && this.T.N) return this.fightStep(t, s, m === 'final');
      if (this.T.step) return this.T.step.call(this, t, s);
      this.introStep(t, s);
    },

    // calm: a string walking in the scale, a low note every 2 bars, a long flute note every few bars (menu A = the
    // original menu music)
    introStep(t, s) {
      const I = this.T.I || {}, bar = s >> 4, b = s & 15, k = I.i || 'koto', le = I.le || 4;
      if (b % 4 === 0 && rnd() < (I.p ?? 0.55)) this.pl(t, k, this.mid(this.stepWalk(I.lo ?? 3, I.hi ?? 11)), 0.6 + rnd() * 0.3, rnd() * 0.6 - 0.3);
      if (b === 0 && bar % 2 === 0) this.pl(t, I.bi || k, this.mid(I.bd || 0), 0.5, -0.3);
      if (b === 0 && bar % le === 1 % le) this.lead(t, { i: I.l || 'shaku', lo: I.llo ?? 5, hi: I.lhi ?? 11, d: 2.2 + rnd() * 1.5, v: 0.8 });
      let v;
      if (I.pu && (v = lv(I.pu, b))) this.pulse(t, this.T.root, v * 0.8);
      if (I.dr && b === 0 && bar % 2 === 0) this.drone(t, this.T.root, 32 * this.spb);
      if (I.e) for (const E of I.e) if (b === (E.b || 0) && bar % E.ev === (E.at || 0)) this.ev(t, E);
    },

    fightStep(t, s, fin) {
      const T = this.T, P = fin ? T.F : T.N, bar = s >> 4, b = s & 15;
      let v;
      if ((v = lv(P.o, b))) this.drum(t, 'o', v * (T.og || 1));
      if ((v = lv(P.s, b))) this.drum(t, 's', v);
      else if (P.sr && rnd() < P.sr) this.drum(t, 's', 0.4);
      if (bar % 4 === 3 && b >= 12) this.drum(t, 's', 0.5 + (b - 12) * 0.12);
      if (P.x && (v = lv(P.x, b))) this.perc(t, T.xk, v);
      if (P.pu && (v = lv(P.pu, b))) this.pulse(t, T.root, v);
      if (P.dr && b === 0 && bar % 2 === 0) this.drone(t, T.root, 32 * this.spb);
      for (const L of P.k) {
        const d = dg(L.p, b);
        if (d === null) continue;
        const i = d + (L.o || 0) + (L.sh ? L.sh[bar % L.sh.length] : 0), acc = b % 4 === 0, a = L.a || [0.7, 0.45], pan = L.pan ?? 0.25;
        const vel = acc ? a[0] : a[1];
        this.pl(t, L.i, this.mid(i), vel, acc ? -pan : pan, L.bend && rnd() < L.bend ? L.bd || 1 : 0);
        if (L.dy) this.pl(t + 0.012, L.i, this.mid(i + L.dy), vel * 0.8, acc ? pan : -pan);
      }
      if (P.l && b === 0 && bar % P.l.ev === P.l.at) this.lead(t, P.l);
      if (P.e) for (const E of P.e) {
        if (bar % E.ev !== (E.at || 0)) continue;
        // an odaiko roll: one hit per step as it comes (not all at once), getting louder
        if (E.k === 'roll') { const n = ROLL.indexOf(b - (E.b || 0)); if (n >= 0) this.drum(t, 'o', 0.35 + n * 0.1); } else if (b === (E.b || 0)) this.ev(t, E);
      }
    },

    // KO: a falling koto run, then one long flute note
    koStep(t, s) {
      if (s < 8 && s % 2 === 0) this.pl(t, 'koto', this.mid(10 - s), 0.8, 0);
      if (s === 10) this.lead(t, { i: (this.T.I && this.T.I.l) || 'shaku', lo: 5, hi: 5, d: 3.5, v: 0.7 });
    },

    // a flute: one long note (d seconds) or a phrase (rhythm r over one or two bars), walking in the scale; a phrase ends
    // on a resting degree
    lead(t, L) {
      if (!L.r) {
        const i = L.lo === L.hi ? L.lo : this.stepWalk(L.lo, L.hi);
        if (L.i === 'shaku') this.shakuhachi(t, hz(this.mid(i)), L.d, L.v, L.br);
        else this.wind(t, L.i, [[0, this.mid(i)]], L.d, L.v * 0.9, L.br);
        return;
      }
      const spb = this.spb, n = L.r.length, notes = [], st = this.T.st || [0, 3];
      let last = -1;
      for (let k = 0; k < n; k++) if (L.r[k] === 'x') { notes.push([k * spb, 0]); last = k; }
      if (!notes.length) return;
      notes.forEach((x, k) => {
        let i = this.stepWalk(L.lo, L.hi);
        if (k === notes.length - 1) { while (!st.includes(((i % 5) + 5) % 5) && i > L.lo) i--; this.walk = i; }
        x[1] = this.mid(i);
      });
      this.wind(t, L.i, notes, (last + Math.min(8, Math.max(4, n - last))) * spb, L.v, L.br);
    },

    ev(t, E) {
      const spb = this.spb;
      switch (E.k) {
        case 'gl': this.gl(t, E.a, E.z, E.dt || 0.035, E.v || 0.5); break;
        case 'tr': this.tr(t, E.d, E.n || 8, E.dt || 0.05, E.v || 0.4); break;
        case 'bon': this.bon(t, E.v || 0.4, E.m); break;
        case 'rin': this.rin(t, E.v || 0.4); break;
        case 'kane': this.kane(t, E.v || 0.4, true); break;
        case 'hyo': this.hyo(t, E.v || 0.5); this.hyo(t + spb * 2, (E.v || 0.5) * 0.8); break;
        case 'biwa': this.pl(t, 'biwa', this.mid(E.d || 0), E.v || 0.7, 0, E.bend || 0); break;
      }
    },
    perc(t, k, v) {
      if (k === 'kane') this.kane(t, v, v >= 0.55);
      else if (k === 'tsu') this.tsu(t, v, v > 0.55);
      else if (k === 'hyo') this.hyo(t, v);
    },

    // a melody walking in the scale: mostly steps, sometimes a leap
    stepWalk(lo, hi) {
      const r = rnd();
      this.walk += r < 0.4 ? 1 : r < 0.8 ? -1 : r < 0.9 ? 2 : -2;
      if (this.walk < lo) this.walk = lo + 1; if (this.walk > hi) this.walk = hi - 1;
      if (this.walk < lo) this.walk = lo;
      return this.walk;
    },

    // ---------------------------------------------------------------- plucked strings (Karplus-Strong)
    // A new sample of `kind` at MIDI note m (dur: its length, s), computed by run
    job0(kind, m, dur) {
      const K = STR[kind], c = au.ctx, sr = K.sr || c.sampleRate, f = hz(m);
      const len = (sr * (dur || K.dur(f))) | 0, N = Math.max(2, Math.round(sr / f));
      const buf = c.createBuffer(1, len, sr), ring = new Float32Array(N);
      let prev = 0;
      for (let i = 0; i < N; i++) { const r = rnd() * 2 - 1; ring[i] = K.sm ? (r + prev) * 0.5 : r; prev = r; }
      if (K.sm === 2) for (let i = 1; i < N; i++) ring[i] = (ring[i] + ring[i - 1]) * 0.5;
      // tuning: the string loop is a whole number of samples long; the playback rate puts the note back in tune
      buf._r = (f * N) / sr; buf._k = 1; buf._t = 0;
      return { kind, m, K, buf, out: buf.getChannelData(0), ring, N, len, sr, i: 0, idx: 0, lp: 0, x1: 0, y1: 0, peak: 0, dk: K.dk(f), la: K.lp ? 1 - Math.exp((-2 * Math.PI * K.lp) / sr) : 0 };
    },
    // Compute up to n more frames of job j; true when it is finished
    run(j, n) {
      const out = j.out, ring = j.ring, N = j.N, len = j.len, K = j.K, dk = j.dk, la = j.la, w = K.w, w1 = 1 - w, cl = K.cl || 0;
      const fade = (len * 0.15) | 0, f0 = len - fade, th = K.th, sr = j.sr;
      const tl = th ? (0.05 * sr) | 0 : 0, tw = th ? (2 * Math.PI * th[1]) / sr : 0, td = th ? Math.exp(-1 / (0.012 * sr)) : 0;
      let idx = j.idx, lp = j.lp, x1 = j.x1, y1 = j.y1, peak = j.peak, i = j.i;
      const end = Math.min(len, i + n);
      for (; i < end; i++) {
        const nx = idx + 1 === N ? 0 : idx + 1, v = ring[idx];
        let fb = (v * w + ring[nx] * w1) * dk;
        if (cl && fb > cl) fb = cl + (fb - cl) * 0.4;   // sawari
        ring[idx] = fb; idx = nx;
        let y = v;
        if (i < tl) y += th[0] * Math.sin(tw * i) * Math.pow(td, i);
        if (la) { lp += la * (y - lp); const h = lp - x1 + 0.995 * y1; x1 = lp; y1 = h; y = h; }   // low-pass, then a DC blocker
        if (i < 40) y *= i / 40;
        if (i >= f0) y *= (len - i) / fade;
        out[i] = y;
        if (y > peak) peak = y; else if (-y > peak) peak = -y;
      }
      j.idx = idx; j.lp = lp; j.x1 = x1; j.y1 = y1; j.peak = peak; j.i = i;
      if (i < len) return false;
      if (K.k) j.buf._k = K.k / Math.max(0.05, peak);
      return true;
    },
    want(kind, m) {
      if (this.bank[kind][m] || (this.job && this.job.kind === kind && this.job.m === m)) return;
      for (const q of this.jobs) if (q[0] === kind && q[1] === m) return;
      this.jobs.push([kind, m]);
    },
    // the samples a theme will need, queued (made in idle time)
    prewarm() {
      const P = this.T.pre || {};
      for (const k in P) for (let d = P[k][0]; d <= P[k][1]; d++) this.want(k, this.mid(d));
      if (this.jobs.length) this.pump();
    },
    // Make the queued samples in slices of 2048 frames while the browser is idle (a few ms at most per call); without
    // requestIdleCallback (Safari), one slice per 20 ms timer
    pump() {
      if (this.pumping || !au.ctx) return;
      this.pumping = true;
      const work = (dl) => {
        this.pumping = false;
        const t0 = performance.now(), budget = dl && !dl.didTimeout ? Math.min(6, dl.timeRemaining() - 1) : 1;
        do {
          if (!this.job) {
            const q = this.jobs.shift(); if (!q) break;
            if (this.bank[q[0]][q[1]]) continue;
            this.job = q[0] === 'g' ? this.bake0(q[1], q[2]) : this.job0(q[0], q[1]);
            if (!this.job) continue;
          }
          if (this.job.bake ? this.bake(this.job) : this.run(this.job, 2048)) {
            const j = this.job, b = j.buf; this.job = null;
            this.bank[j.kind][j.m] = b; this.frames += b.length * b.numberOfChannels * (48000 / b.sampleRate);
            if (this.frames > CAP) this.evict();
          }
        } while (performance.now() - t0 < budget);
        if (this.job || this.jobs.length) this.pump();
      };
      if (window.requestIdleCallback) window.requestIdleCallback(work, { timeout: 1500 }); else setTimeout(work, 20);
    },
    // over the memory cap: the least recently played samples go (never the original koto set)
    evict() {
      const all = [];
      for (const k in this.bank) for (const m in this.bank[k]) { const b = this.bank[k][m]; if (!b._base) all.push([b._t, k, m, b]); }
      all.sort((x, y) => x[0] - y[0]);
      for (const [, k, m, b] of all) {
        if (this.frames <= CAP * 0.8) break;
        delete this.bank[k][m]; this.frames -= b.length * b.numberOfChannels * (48000 / b.sampleRate);
      }
    },

    // a plucked note: kind, MIDI note, level, pan; bend: semitones the string is pressed up after the attack (biwa)
    pl(t, kind, m, vel = 1, pan = 0, bend = 0) {
      const B = this.bank[kind];
      let b = B[m], r = 1;
      if (!b) {
        this.want(kind, m);
        for (let d = 1; d <= 7 && !b; d++) { if (B[m - d]) { b = B[m - d]; r = Math.pow(2, d / 12); } else if (B[m + d]) { b = B[m + d]; r = Math.pow(2, -d / 12); } }
        if (!b) return;
      }
      b._t = t;
      const c = au.ctx, s = c.createBufferSource(); s.buffer = b;
      const rate = r * b._r;
      if (bend) { s.playbackRate.setValueAtTime(rate, t); s.playbackRate.setTargetAtTime(rate * Math.pow(2, bend / 12), t + 0.14, 0.05); }
      else if (rate !== 1) s.playbackRate.value = rate;
      const g = c.createGain(); g.gain.value = STR[kind].g * vel * b._k;
      s.connect(g); g.connect(this.pan(pan));
      s.start(t);
    },
    // the bus input for a pan position (shared panners; equal-power, like a panner of its own)
    pan(p) { const P = this.out._pn; return P ? P[3 + Math.sign(p) * Math.min(3, Math.round(Math.abs(p) * 10))] : this.out; },
    // koto glissando (sararin): degrees a → z, dt apart, growing, sweeping across
    gl(t, a, z, dt, v) {
      const n = Math.abs(z - a) || 1, dir = z > a ? 1 : -1, N = [];
      for (let k = 0; k <= n; k++) N.push([k * dt, this.mid(a + k * dir), v * (0.55 + (0.45 * k) / n), -0.3 + (0.6 * k) / n]);
      this.gest(t, N);
    },
    // koto tremolo: one string plucked n times, swelling and fading
    tr(t, d, n, dt, v) {
      const m = this.mid(d), N = [];
      for (let k = 0; k < n; k++) N.push([k * dt, m, v * (0.55 + 0.45 * Math.sin((Math.PI * k) / Math.max(1, n - 1))), k % 2 ? 0.1 : -0.1]);
      this.gest(t, N);
    },
    // A koto gesture (glissando, tremolo: many notes in a moment). The first time its notes play one by one and the
    // whole gesture is mixed into one stereo sample in idle time; from then on it costs two nodes instead of ~20.
    // N: [[offset s, MIDI, level, pan], …]
    gest(t, N) {
      const key = N.map((n) => n[0].toFixed(3) + ':' + n[1] + ':' + n[2].toFixed(2) + ':' + n[3].toFixed(1)).join(','), b = this.bank.g[key];
      if (b) {
        b._t = t;
        const c = au.ctx, s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = STR.koto.g;
        s.connect(g); g.connect(this.out); s.start(t);
        return;
      }
      for (const n of N) this.pl(t + n[0], 'koto', n[1], n[2], n[3]);
      if (N.every((n) => this.bank.koto[n[1]]) && !this.jobs.some((q) => q[1] === key) && !(this.job && this.job.m === key)) { this.jobs.push(['g', key, N]); this.pump(); }
    },
    // mixing a gesture: one note per call; the tails are cut softly 1.6 s after the last note
    bake0(key, N) {
      const K = this.bank.koto, c = au.ctx, sr = c.sampleRate;
      if (!N.every((n) => K[n[1]])) return null;
      const len = Math.min(Math.max(...N.map((n) => ((n[0] * sr) | 0) + K[n[1]].length)), ((N[N.length - 1][0] + 1.6) * sr) | 0);
      const buf = c.createBuffer(2, len, sr);
      return { bake: true, kind: 'g', m: key, N, i: 0, buf, L: buf.getChannelData(0), R: buf.getChannelData(1) };
    },
    bake(j) {
      const n = j.N[j.i++], src = this.bank.koto[n[1]];
      if (src) {
        const d = src.getChannelData(0), o = (n[0] * j.buf.sampleRate) | 0, x = ((n[3] + 1) * Math.PI) / 4;
        const gl = Math.cos(x) * n[2] * src._k, gr = Math.sin(x) * n[2] * src._k, L = j.L, R = j.R, len = j.buf.length;
        for (let i = 0, k = o; i < d.length && k < len; i++, k++) { L[k] += d[i] * gl; R[k] += d[i] * gr; }
      }
      if (j.i < j.N.length) return false;
      const L = j.L, R = j.R, len = L.length, f = Math.min(len, (0.3 * j.buf.sampleRate) | 0);
      for (let i = 0; i < f; i++) { const k = i / f; L[len - 1 - i] *= k; R[len - 1 - i] *= k; }
      return true;
    },

    // ---------------------------------------------------------------- winds
    // the original shakuhachi note (br: breath ×)
    shakuhachi(t, f, dur, vel = 1, br = 1) {
      const c = au.ctx;
      const o = c.createOscillator(); o.type = 'sine';
      const o2 = c.createOscillator(); o2.type = 'triangle';
      o.frequency.setValueAtTime(f * 0.965, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.22);
      o2.frequency.setValueAtTime(f * 2 * 0.965, t); o2.frequency.exponentialRampToValueAtTime(f * 2, t + 0.22);
      const vib = c.createOscillator(); vib.frequency.value = 5.2;
      const vg = c.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.012, t + dur * 0.8);
      vib.connect(vg); vg.connect(o.frequency);
      const g = c.createGain(), g2 = c.createGain(); g2.gain.value = 0.08;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22 * vel, t + 0.25);
      g.gain.setValueAtTime(0.22 * vel, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
      // breath
      const n = c.createBufferSource(); n.buffer = au.noiseBuf;
      const bf = c.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = f * 2; bf.Q.value = 3;
      const ng = c.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.06 * vel * br, t + 0.12); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.4);
      o.connect(g); o2.connect(g2); g2.connect(g); n.connect(bf); bf.connect(ng); ng.connect(this.out); g.connect(this.out);
      [o, o2, vib].forEach((x) => { x.start(t); x.stop(t + dur + 0.6); });
      n.start(t, rnd()); n.stop(t + dur + 0.6);
    },
    // One breath for several notes (legato: one voice, the same few nodes however long the phrase).
    // notes: [[offset s, MIDI], …]; dur: the whole phrase (s)
    //   shaku  the shakuhachi, each note scooped up into (meri → kari)
    //   fue    shinobue: sine with a very soft triangle, a finger-struck grace note above each new note, a quicker
    //          vibrato, a lighter breath; kept soft so it never pierces
    wind(t, kind, notes, dur, vel = 1, br = 1) {
      const c = au.ctx, fue = kind === 'fue', f0 = hz(notes[0][1]);
      const o = c.createOscillator(), o2 = c.createOscillator(); o2.type = 'triangle';
      for (const [dt, m] of notes) {
        const f = hz(m), at = t + dt;
        if (fue) {
          const gr = dt > 0 ? f * 1.12 : f;
          o.frequency.setValueAtTime(gr, at); o.frequency.setTargetAtTime(f, at + 0.03, 0.012);
          o2.frequency.setValueAtTime(gr, at); o2.frequency.setTargetAtTime(f, at + 0.03, 0.012);
        } else {
          o.frequency.setValueAtTime(f * 0.965, at); o.frequency.exponentialRampToValueAtTime(f, at + 0.2);
          o2.frequency.setValueAtTime(f * 2 * 0.965, at); o2.frequency.exponentialRampToValueAtTime(f * 2, at + 0.2);
        }
      }
      const vib = c.createOscillator(); vib.frequency.value = fue ? 6.2 : 5.2;
      const vg = c.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f0 * (fue ? 0.007 : 0.011), t + Math.min(dur * 0.6, 1.5));
      vib.connect(vg); vg.connect(o.frequency);
      const lvl = (fue ? 0.13 : 0.2) * vel, g = c.createGain(), g2 = c.createGain(); g2.gain.value = fue ? 0.05 : 0.08;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + (fue ? 0.06 : 0.22));
      g.gain.setValueAtTime(lvl, t + dur * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.45);
      const n = c.createBufferSource(); n.buffer = au.noiseBuf; n.loop = true;
      const bf = c.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = f0 * (fue ? 1.5 : 2); bf.Q.value = fue ? 4 : 3;
      const nb = (fue ? 0.025 : 0.05) * vel * br, ng = c.createGain();
      ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(nb, t + 0.1); ng.gain.setValueAtTime(nb * 0.8, t + dur * 0.85); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.4);
      o.connect(g); o2.connect(g2); g2.connect(g); n.connect(bf); bf.connect(ng); ng.connect(this.out); g.connect(this.out);
      [o, o2, vib].forEach((x) => { x.start(t); x.stop(t + dur + 0.55); });
      n.start(t, rnd()); n.stop(t + dur + 0.55);
    },

    // ---------------------------------------------------------------- drums and bells
    drum(t, kind, vel = 1) {
      const c = au.ctx;
      if (kind === 'o') { // odaiko
        const o = c.createOscillator(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.3);
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9 * vel, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        o.connect(g); g.connect(this.out); o.start(t); o.stop(t + 0.75);
      }
      // the noise part goes through the bus's shared filter (odaiko: low-pass 500 Hz, shime: band-pass 900 Hz)
      const n = c.createBufferSource(); n.buffer = au.noiseBuf;
      const f = kind === 'o' ? this.out._fo : this.out._fs;
      const g = c.createGain();
      if (kind === 'o') { g.gain.setValueAtTime(0.4 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15); }
      else { // shime-daiko: short, tight
        g.gain.setValueAtTime(0.35 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        const o = c.createOscillator(); o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(260, t + 0.06);
        const og = c.createGain(); og.gain.setValueAtTime(0.25 * vel, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        o.connect(og); og.connect(this.out); o.start(t); o.stop(t + 0.1);
      }
      n.connect(g); g.connect(f); n.start(t, rnd()); n.stop(t + 0.2);
    },
    // a decaying sine (the bells and the small drums are built from these); f1: a short pitch drop
    sine(t, f, gain, dur, f1, type) {
      const c = au.ctx, o = c.createOscillator(), g = c.createGain();
      if (type) o.type = type;
      o.frequency.setValueAtTime(f, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + Math.min(0.06, dur));
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + 0.02);
    },
    // kotsuzumi (shoulder drum): pon = open and round, the pitch sinking; ta = tight and dry
    tsu(t, v, ta) {
      if (!ta) { this.sine(t, 410, 0.3 * v, 0.42, 330); this.sine(t, 740, 0.06 * v, 0.14, 600); return; }
      this.sine(t, 700, 0.22 * v, 0.09, 560);
      const c = au.ctx, n = c.createBufferSource(); n.buffer = au.noiseBuf;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.2;
      const g = c.createGain(); g.gain.setValueAtTime(0.16 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      n.connect(f); f.connect(g); g.connect(this.out); n.start(t, rnd()); n.stop(t + 0.06);
    },
    // kane: the small matsuri gong (atarigane): long = the open "chan", short = the damped "chiki"; low partials only
    kane(t, v, long) { const d = long ? 0.45 : 0.1; this.sine(t, 1180, 0.05 * v, d); this.sine(t, 1870, 0.025 * v, d * 0.7); },
    // bonsho: the big temple bell, deep, a slow beat between two of its partials (m: MIDI note of its hum)
    bon(t, v, m = 43) {
      const f = hz(m);
      [[1, 0.12, 5], [2.01, 0.07, 3.6], [1.995, 0.05, 3.2], [2.92, 0.04, 2.2]].forEach(([k, g, d]) => this.sine(t, f * k, g * v, d));
    },
    // a singing bowl, soft and cold, on the scale's upper key note
    rin(t, v) { const f = hz(this.mid(10)); this.sine(t, f, 0.045 * v, 3); this.sine(t, f * 2.71, 0.012 * v, 1.2); },
    // hyoshigi (wooden clappers), softer than the "time's up" ones
    hyo(t, v) {
      const c = au.ctx, n = c.createBufferSource(); n.buffer = au.noiseBuf;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 5;
      const g = c.createGain(); g.gain.setValueAtTime(1.1 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      n.connect(f); f.connect(g); g.connect(this.out); n.start(t, rnd()); n.stop(t + 0.05);
      this.sine(t, 1700, 0.08 * v, 0.045);
    },
    // a short low pulse (the ranked theme's modern touch): a triangle on the key note
    pulse(t, m, v) { this.sine(t, hz(m), 0.3 * v, 0.2, 0, 'triangle'); },
    // a drone for `dur` seconds (the boss): the key note and its octave, slow in and out
    drone(t, m, dur) {
      const c = au.ctx, g = c.createGain(), o = c.createOscillator(), o2 = c.createOscillator();
      o.type = 'triangle'; o.frequency.value = hz(m); o2.frequency.value = hz(m + 12) * 1.003;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 1.2); g.gain.setValueAtTime(0.09, t + dur - 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.8);
      o.connect(g); o2.connect(g); g.connect(this.out);
      o.start(t); o2.start(t); o.stop(t + dur + 0.9); o2.stop(t + dur + 0.9);
    },
  };
})(window.ND);
