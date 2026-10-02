// Shadow Duel — player level (Seviye) and the season pass (Gölge Pass): pure rules and numbers, no DOM and no save
// access, so Node tests (scripts/pass-check.mjs) run this very file. The game side (saving, the screens, the end-screen
// XP bar, claiming) is js/pass.js; the texts are js/i18n-pass.js (docs/SHADOW-DUEL-PASS.md explains it in Turkish).
//
// - XP comes from every fight (journey, vs CPU, tournament, Dan, rival challenge, friend online, ranked), a little from
//   training (combo trials, the tutorial), plus a daily first-win bonus that grows with a streak of days played.
// - Level is permanent (1 … MAX). The pass is per 28-day season: the same XP also fills the season's tiers.
// - Anti-farm: XP per fight is capped; very short fights earn less, and several short ones in a row less and less.
// - Every function that changes a state takes it as an argument (a plain object from the save) and the time `now`
//   (ms) and the time-zone offset `tz` (minutes, Date#getTimezoneOffset) explicitly: the tests drive the clock.
(function (ND) {
  'use strict';
  const MAX = 100;
  const clampInt = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : lo);
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const ID = /^[a-z0-9_]{2,40}$/;

  // ---------------------------------------------------------------- level curve
  // XP from level L to L+1: 46 → 70 → 96 → 124 … (levels 2-5 in the first ~10-15 minutes, ~10 after a few days of
  // play), never more than 4000 per level (the long tail to 100).
  const need = (L) => (L >= MAX ? Infinity : Math.min(4000, Math.round(25 + 20 * L + 1.2 * L * L)));
  const BASE = [0, 0]; // BASE[L] = total XP at the start of level L
  for (let L = 2; L <= MAX; L++) BASE[L] = BASE[L - 1] + need(L - 1);
  const XP_MAX = BASE[MAX] * 4; // a sane upper bound for a saved total (XP past MAX still counts for the pass)

  // ---------------------------------------------------------------- XP per fight
  const XP = {
    win: 40, loss: 15, round: 5,                       // a won fight / a lost one + each round it took
    parry: 2, counter: 2, rally: 4, perfect: 6, styleCap: 20,
    lvMul: [0.9, 1, 1.15, 1.3],                        // AI level (Apprentice, Master, Legend, Shura)
    // per kind of fight (on the win/loss base). journey = Arcade journey fights
    // (shadow: a ranked shadow fight, js/ghost.js, pays like a ranked one)
    mode: { cpu: 1, arcade: 1, tourney: 1.2, dan: 1.2, rival: 1.1, friend: 1, ranked: 1.3, shadow: 1.3 },
    fightCap: 150,                                     // most XP one fight gives (before boosters and daily bonus)
    firstWin: 100, streak: 15, streakMax: 6,           // first won fight of the day; +15 per extra day in a row (≤ +90)
    shortSec: 25, minSec: 6, shortWin: 1800,           // < 25 s of fighting earns less; < 6 s nothing; window 30 min
    boostMul: 1.5,                                     // an XP booster's multiplier (per fight while it lasts)
    // fixed amounts
    trial: 25, trialAgain: 5, trialAgainMax: 10, tutorial: 50, lesson: 10,
    clear: [150, 250, 400, 100],                       // journey clears: 1st, 2nd, 3rd, every later one
  };

  // day number in the player's own time zone (days since 1970)
  const dayOf = (now, tz) => Math.floor((now - (tz | 0) * 60000) / 864e5);

  // ---------------------------------------------------------------- season calendar (offline / local)
  // 28-day seasons from a fixed start. The online build may take the season from the server instead (pass.js); the
  // offline portal packages always use this calendar.
  const SEASON = { days: 28, epoch: Date.UTC(2026, 9, 1) };
  function seasonAt(now, cal) {
    const C = cal || SEASON, len = C.days * 864e5;
    const n = Math.max(1, Math.floor((now - C.epoch) / len) + 1);
    const start = C.epoch + (n - 1) * len;
    return { key: 'L' + n, n, start, end: start + len };
  }

  // ---------------------------------------------------------------- items (rewards)
  // kind: cos (costume: a palette for one ninja, worn on the select screen's Colors row), title, badge (a kanji
  // seal next to the name), frame (name-plate colour), trail (blade-trail colour of your own fighter), boost (XP
  // booster: n fights × boostMul), honor (honor points: opens rival challenges sooner). Names: js/i18n-pass.js.
  // colour themes of the pass costumes (a palette over the fighter's own; js/pass.js themePal)
  const THEMES = {
    sakura: { cloth: '#e9c6d0', clothHi: '#f7e3e8', clothDark: '#b38593', wrap: '#5a2a3c', wrapDark: '#3a1a27', accent: '#ff7fa8', accentDark: '#9c3658', ui: '#ff8fb3', hakama: '#3d2230', hakamaDark: '#26141e' },
    ember: { cloth: '#2c1b14', clothHi: '#46291c', clothDark: '#190e0a', wrap: '#6a2a14', wrapDark: '#41180b', accent: '#ff7a2a', accentDark: '#8a3510', ui: '#ff8c42', hakama: '#1a100c', hakamaDark: '#0e0806', rim: 'rgba(255,150,80,.6)', rimDim: 'rgba(200,90,40,.32)' },
    frost: { cloth: '#cfe0ea', clothHi: '#eef6fb', clothDark: '#8ea7b8', wrap: '#2c3e52', wrapDark: '#1b2735', accent: '#58c8f0', accentDark: '#1f6f8f', ui: '#7fd6f5', hakama: '#26364a', hakamaDark: '#172231', rim: 'rgba(190,230,255,.62)', rimDim: 'rgba(130,170,210,.32)' },
    jade: { cloth: '#1f4b3b', clothHi: '#2f6a54', clothDark: '#123024', wrap: '#c9a96a', wrapDark: '#8a7040', accent: '#e8d08a', accentDark: '#8a7442', ui: '#6fdcaa', hakama: '#0f241c', hakamaDark: '#08150f' },
    ash: { cloth: '#5a5c62', clothHi: '#7d8088', clothDark: '#3a3c41', wrap: '#16171a', wrapDark: '#0c0d0f', accent: '#d6262e', accentDark: '#6e0e12', ui: '#e8434a', hakama: '#202125', hakamaDark: '#121316' },
    moon: { cloth: '#1b2440', clothHi: '#2c3a63', clothDark: '#101629', wrap: '#c8ccd8', wrapDark: '#8a8fa0', accent: '#e6ecff', accentDark: '#8c96b8', ui: '#c9d6ff', hakama: '#121a30', hakamaDark: '#0a0f1c', rim: 'rgba(200,215,255,.7)', rimDim: 'rgba(140,155,200,.36)' },
    lotus: { cloth: '#3a2458', clothHi: '#553780', clothDark: '#241638', wrap: '#f0a8c8', wrapDark: '#a8607e', accent: '#ff9ad0', accentDark: '#9a3f70', ui: '#d9a2ff', hakama: '#1e1230', hakamaDark: '#120a1d' },
    storm: { cloth: '#2a3138', clothHi: '#414b56', clothDark: '#181d22', wrap: '#1a1f24', wrapDark: '#0f1215', accent: '#ffe14a', accentDark: '#8a7410', ui: '#ffe866', hakama: '#14181c', hakamaDark: '#0b0d10', rim: 'rgba(255,240,140,.55)', rimDim: 'rgba(200,180,80,.3)' },
    yami: { cloth: '#0b0a10', clothHi: '#1c1828', clothDark: '#06050a', wrap: '#24182f', wrapDark: '#140d1b', accent: '#b77cff', accentDark: '#4d2c80', ui: '#c79bff', hakama: '#08070c', hakamaDark: '#040306', rim: 'rgba(190,140,255,.85)', rimDim: 'rgba(150,100,230,.45)' },
  };
  // pass costumes: one theme for ONE champion (owner, 2026-10-01: a colour belongs to its own ninja, not to all)
  // id cos_<theme>_<ninja>; the name is the theme's and the ninja's (js/i18n-pass.js themes)
  const COSTUMES = [['sakura', 'akane'], ['moon', 'aoi'], ['ash', 'kuro'], ['frost', 'yuki'], ['lotus', 'hana'], ['jade', 'tetsu'],
    ['ember', 'ren'], ['yami', 'kage'], ['storm', 'tora'], ['jade', 'jin'], ['sakura', 'mai'], ['frost', 'tsubame']];
  const ITEMS = {};
  for (const [th, nj] of COSTUMES) ITEMS['cos_' + th + '_' + nj] = { kind: 'cos', theme: th, ninja: nj, pal: THEMES[th] };
  Object.assign(ITEMS, {
    // blade trails (r,g,b of your own fighter's blade streak)
    trail_sakura: { kind: 'trail', rgb: '255,160,200' },
    trail_ember: { kind: 'trail', rgb: '255,150,70' },
    trail_frost: { kind: 'trail', rgb: '150,235,255' },
    trail_jade: { kind: 'trail', rgb: '110,240,170' },
    trail_violet: { kind: 'trail', rgb: '200,150,255' },
    trail_gold: { kind: 'trail', rgb: '255,215,110' },
    // titles (shown under the level, on the pass and profile; online name plates when synced)
    title_novice: { kind: 'title', color: '#c9c2b0' },
    title_wanderer: { kind: 'title', color: '#b9d0e6' },
    title_duelist: { kind: 'title', color: '#e8b86a' },
    title_parry: { kind: 'title', color: '#9fe0ff' },
    title_ronin: { kind: 'title', color: '#e07a62' },
    title_nightblade: { kind: 'title', color: '#b99cff' },
    title_s1: { kind: 'title', color: '#d9a2ff' },
    // badges (a kanji seal by the name)
    badge_blade: { kind: 'badge', icon: '刃', color: '#d9dde8' },
    badge_moon: { kind: 'badge', icon: '月', color: '#c9d6ff' },
    badge_fire: { kind: 'badge', icon: '炎', color: '#ff8c42' },
    badge_snow: { kind: 'badge', icon: '雪', color: '#e6f4ff' },
    badge_sakura: { kind: 'badge', icon: '桜', color: '#ff9ec0' },
    badge_dragon: { kind: 'badge', icon: '龍', color: '#6fdcaa' },
    badge_kage: { kind: 'badge', icon: '影', color: '#c79bff' },
    // name-plate frames
    frame_bronze: { kind: 'frame', color: '#c07b45' },
    frame_silver: { kind: 'frame', color: '#c3c8d4' },
    frame_crimson: { kind: 'frame', color: '#d8392d' },
    frame_jade: { kind: 'frame', color: '#45c08e' },
    frame_gold: { kind: 'frame', color: '#f0c55a' },
    // XP boosters and honor
    boost3: { kind: 'boost', n: 3 },
    boost5: { kind: 'boost', n: 5 },
    honor100: { kind: 'honor', n: 100 },
    honor200: { kind: 'honor', n: 200 },
    // 1.3.2 progress rewards: bigger honor packs; a rival key (the next locked ninja's Rival Challenge opens now, else
    // KEY_HONOR honor); an arena key (the next honor-locked arena opens now, else KEY_HONOR honor); a trial ticket (any
    // locked ninja for n CPU fights, the ad trial's lending in js/game.js); a ranked shield (one ranked loss costs no
    // rating: held and used on the server, supabase/pass.sql + ranked.sql; at most SHIELD_MAX held, one used a day)
    honor300: { kind: 'honor', n: 300 },
    honor500: { kind: 'honor', n: 500 },
    key_rival: { kind: 'rkey' },
    key_arena: { kind: 'akey' },
    ticket_trial: { kind: 'ticket', n: 3 },
    shield: { kind: 'shield' },
    // the Season 1 final reward: Akane's drawn costume (js/costumes-pass.js, ND.COSTUMES.pass1_akane)
    pass1_akane: { kind: 'cos', ninja: 'akane', drawn: 'pass1_akane' },
  });
  // Fight flair (js/flair.js ND.FLAIR: drawing and sound only). The ids are fixed here too (saves, the server's list,
  // Node tests run without flair.js); scripts/flair-check.mjs checks them against ND.flair.ids(kind).
  const FLAIR_IDS = {
    pose: ['pose_tenchi', 'pose_rei', 'pose_hiza', 'pose_katsugi', 'pose_kissaki'],
    hitfx: ['hitfx_kinpaku', 'hitfx_aizome', 'hitfx_sakura', 'hitfx_kitsunebi', 'hitfx_raijin'],
    slash: ['slash_kin', 'slash_sumi', 'slash_hana', 'slash_rai'],
    aura: ['aura_kitsunebi', 'aura_raiun', 'aura_hana', 'aura_gekko'],
    ko: ['ko_enso', 'ko_hanafubuki', 'ko_raiko', 'ko_mikazuki'],
    card: ['card_seigaiha', 'card_yozakura', 'card_ryu', 'card_tsukiyo', 'card_asanoha'],
    arena: ['arena_temple_snow', 'arena_rain_moon', 'arena_snow_night', 'arena_market_rain'],
    music: ['music_haru', 'music_yuki', 'music_matsuri'],
  };
  // (the base arena of each variant: the variant is offered only where its base arena is open)
  const ARENA_BASE = { arena_temple_snow: 'temple', arena_rain_moon: 'rain', arena_snow_night: 'snow', arena_market_rain: 'market' };
  const FLAIR_KINDS = Object.keys(FLAIR_IDS);
  for (const k of FLAIR_KINDS) for (const id of FLAIR_IDS[k]) ITEMS[id] = k === 'arena' ? { kind: k, flair: true, base: ARENA_BASE[id] } : { kind: k, flair: true };
  // the kinds worn one at a time (eq): name plate, blade trail, the fight flair slots and the menu music (an arena
  // variant is chosen per base arena instead: av)
  const EQ_KINDS = ['title', 'badge', 'frame', 'trail', 'pose', 'hitfx', 'slash', 'aura', 'ko', 'card', 'music'];
  // kinds used up when claimed (never in `own`): XP booster, honor, the keys, the trial ticket, the shield
  const USED = { boost: 1, honor: 1, rkey: 1, akey: 1, ticket: 1, shield: 1, rw: 1 };
  const SHIELD_MAX = 3, TICKET_MAX = 9, KEY_HONOR = 300;
  // Journey clears of one ninja (the 2nd and the 3rd time the same ninja's journey is finished): a costume and a
  // title each, made per ninja from its own colours (pass.js journeyPal). ids: jc2_<ninja> / jc3_<ninja> (costume),
  // jt2_<ninja> / jt3_<ninja> (title: "<NINJA> · Menkyo" / "<NINJA> · Kaiden").
  const isJourneyItem = (id) => /^j[ct][23]_[a-z]{2,12}$/.test(id);
  // 'rw:<id>': a reward from the server's reward catalog (js/rewards.js, supabase/ranked.sql nd_rewards). Only a season
  // from the server can hold one (the built-in season never does); the server grants it on a claim (supabase/pass.sql:
  // nd_reward_owned), so it is never added to the local `own` list.
  const RW = /^rw:[a-z0-9_]{3,40}$/;
  function item(id) {
    if (typeof id !== 'string') return null;
    if (ITEMS[id]) return Object.assign({ id }, ITEMS[id]);
    if (RW.test(id)) return { id, kind: 'rw', ref: id.slice(3) };
    if (isJourneyItem(id)) return { id, kind: id[1] === 'c' ? 'cos' : 'title', journey: +id[2], ninja: id.slice(4), color: id[2] === '3' ? '#ff6a4a' : '#e6e9f0' };
    return null;
  }

  // ---------------------------------------------------------------- season content (the built-in default)
  // One track, one reward per tier (r); the track's length comes from the season (1.3.1: 10 tiers; more later). Every
  // reward is claimed with one rewarded ad (owner, 2026-10-01); where rewarded ads cannot be shown (no ad network, an ad
  // blocker, offline), a reward opens for free once the player is waitTiers tiers further, and the last ones open when
  // the last tier is reached (claimWay). XP per tier: the first `earlyN` tiers cost `early` each, every later one `per`.
  // Season 1: only the pass's own rewards, no two neighbouring tiers of the same kind, a champion's costume last.
  // Pace: about 100 fights for the 10 tiers (a 60 % win mix at ~10 fights a day with the first-win bonus: ~5,400 XP).
  // soon: the announced length (tiers soon+…: "coming soon" slots after the real ones; the season XP keeps counting
  // past the last real tier, so it already counts when they come). 0 / missing: none.
  // 1.3.2 (owner, 2026-10-01): 30 real tiers. Tiers 1-7 as in 1.3.1 (rewards already claimed stay right); progress
  // rewards early (honor, rival key, trial ticket, arena key), ranked shields at 8 / 18 / 26, the new fight flair mixed
  // in, Akane's drawn costume last; no two neighbours of the same kind.
  // Pace: 3 tiers of 200 XP, then 27 of 500: 14,100 XP. A player at ~10 fights a day (60 % wins, the first win of the
  // day; ~54 XP a fight) reaches tier 30 on about day 26 of 28 (~260 fights; 40 % wins ~day 28, 15 fights a day ~day 19):
  // ~4 fights a tier at first, then ~9 (about a day each). Cheaper per tier than 1.3.1 (680): every season XP already
  // earned in 1.3.1 counts for at least the same tier, and the server's tier check accepts both.
  const SEASON_1 = ['title_novice', 'boost3', 'trail_frost', 'cos_sakura_akane', 'badge_moon', 'honor200', 'cos_frost_yuki',
    'shield', 'key_rival', 'hitfx_sakura', 'ticket_trial', 'pose_rei', 'key_arena', 'frame_jade', 'aura_kitsunebi',
    'honor300', 'card_yozakura', 'shield', 'title_ronin', 'slash_kin', 'arena_temple_snow', 'honor500', 'ko_hanafubuki',
    'music_haru', 'cos_yami_kage', 'shield', 'pose_tenchi', 'trail_gold', 'title_s1', 'pass1_akane'];
  const DEFAULT_SEASON = {
    v: 1, id: 's1',
    xp: { early: 200, earlyN: 3, per: 500 },
    waitTiers: 3, soon: 0,
    tiers: SEASON_1.map((r) => ({ r })),
  };

  // Only the pass's own rewards may sit on its track (owner, 2026-10-01): no reward-catalog item ('rw:', ranked's) and
  // no journey reward (Menkyo / Kaiden): those come from elsewhere; a server season holding one shows nothing there
  const passItem = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(ITEMS, id);
  // A season's content from the server (or the built-in one): checked and clamped; anything broken → null (the
  // caller keeps the default). Unknown item ids are dropped from their slot (an older build shows nothing there).
  // An older content ({ f, b } per tier, freeEvery) is still read: the tier's reward is r, else f, else b.
  function cleanSeason(c) {
    if (!isObj(c) || (c.v != null && c.v !== 1) || !Array.isArray(c.tiers) || !c.tiers.length) return null;
    const tiers = c.tiers.slice(0, 60).map((t) => {
      const r = !isObj(t) ? null : 'r' in t ? t.r : passItem(t.f) ? t.f : t.b;
      return { r: passItem(r) ? r : null };
    });
    const x = isObj(c.xp) ? c.xp : {};
    const out = {
      v: 1, id: typeof c.id === 'string' && ID.test(c.id) ? c.id : 's1',
      xp: { early: clampInt(x.early ?? 200, 50, 5000), earlyN: clampInt(x.earlyN ?? 5, 0, 60), per: clampInt(x.per ?? 400, 50, 5000) },
      waitTiers: clampInt(c.waitTiers ?? 3, 1, 60), soon: clampInt(c.soon ?? 0, 0, 60),
      // season XP multiplier (the pass fills faster) and level XP multiplier (e.g. a double-XP weekend), from the panel
      mul: typeof c.mul === 'number' && Number.isFinite(c.mul) ? Math.max(0.5, Math.min(3, c.mul)) : 1,
      lvMul: typeof c.lvMul === 'number' && Number.isFinite(c.lvMul) ? Math.max(0.5, Math.min(3, c.lvMul)) : 1,
      tiers,
    };
    if (isObj(c.names)) out.names = c.names;
    return out;
  }
  // cumulative XP to reach tier t (1-based); tier 0 = 0
  function tierXp(S, t) {
    const e = Math.min(t, S.xp.earlyN);
    return e * S.xp.early + Math.max(0, t - S.xp.earlyN) * S.xp.per;
  }
  function tierOf(S, x) {
    const N = S.tiers.length;
    let t = 0;
    while (t < N && x >= tierXp(S, t + 1)) t++;
    const from = tierXp(S, t), to = t < N ? tierXp(S, t + 1) : from;
    return { tier: t, max: N, into: x - from, need: to - from, pct: t >= N ? 1 : (x - from) / Math.max(1, to - from) };
  }

  // ---------------------------------------------------------------- the saved state (save.p.lv)
  // { v, xp: lifetime XP, d: { k: last day played, s: streak days, w: day of the last first-win bonus },
  //   sh: { t: last short fight (ms), n: short fights in a row }, bo: booster fights left,
  //   (d.t: repeated combo trials paid today)
  //   ps: { <season key>: { x: season XP, f: [claimed free tiers], b: [claimed bonus tiers], a: ads watched, w: first wins
  //         of the day, id } } (keys: L<n> the local calendar, S<n> a season from the server),
  //   own: [item ids], eq: { title, badge, frame, trail, pose, hitfx, slash, aura, ko, card, music }, av: { base arena:
  //   arena variant }, wear: { ninja: item id }, jc: { ninja: journey clears }, tk: trial tickets held, sd: ranked
  //   shields held (the server's count where there is one), seen: last level shown (the level-up moment),
  //   mig: 1 once migrated from honor }
  const V = 1;
  const intList = (a, hi) => (Array.isArray(a) ? [...new Set(a.filter((n) => Number.isInteger(n) && n >= 1 && n <= hi))].sort((p, q) => p - q) : []);
  function cleanState(o, chars) {
    const s = isObj(o) ? o : {};
    const ids = Array.isArray(chars) ? chars : null;
    const okNinja = (k) => /^[a-z]{2,12}$/.test(k) && (!ids || ids.includes(k));
    const d = isObj(s.d) ? s.d : {};
    const out = {
      v: V, xp: clampInt(s.xp, 0, XP_MAX),
      d: { k: clampInt(d.k, 0, 1e6), s: clampInt(d.s, 0, 9999), w: clampInt(d.w, 0, 1e6), t: clampInt(d.t, 0, 999) },
      sh: isObj(s.sh) ? { t: clampInt(s.sh.t, 0, 1e14), n: clampInt(s.sh.n, 0, 99) } : { t: 0, n: 0 },
      bo: clampInt(s.bo, 0, 99), ps: {}, own: [], eq: {}, av: {}, wear: {}, jc: {}, seen: clampInt(s.seen, 0, MAX),
      tk: clampInt(s.tk, 0, TICKET_MAX), sd: clampInt(s.sd, 0, SHIELD_MAX),
    };
    if (s.mig) out.mig = 1;
    if (isObj(s.ps)) {
      const keys = Object.keys(s.ps).filter((k) => /^[LS]\d{1,5}$/.test(k)).sort((p, q) => +p.slice(1) - +q.slice(1)).slice(-6);
      for (const k of keys) {
        const p = isObj(s.ps[k]) ? s.ps[k] : {};
        // (f: the claimed tiers; an older save's second list b joins it)
        out.ps[k] = { x: clampInt(p.x, 0, 1e7), f: intList([...(Array.isArray(p.f) ? p.f : []), ...(Array.isArray(p.b) ? p.b : [])], 60), b: [], a: clampInt(p.a, 0, 999), w: clampInt(p.w, 0, 60) };
        if (typeof p.id === 'string' && ID.test(p.id)) out.ps[k].id = p.id;
      }
    }
    if (Array.isArray(s.own)) out.own = [...new Set(s.own.filter((id) => { const it = item(id); return it && !USED[it.kind]; }))].slice(0, 400);
    if (isObj(s.eq)) for (const k of EQ_KINDS) {
      const it = item(s.eq[k]);
      if (it && it.kind === k && out.own.includes(it.id)) out.eq[k] = it.id;
    }
    if (isObj(s.av)) for (const b of Object.keys(s.av)) {
      const it = item(s.av[b]);
      if (it && it.kind === 'arena' && it.base === b && out.own.includes(it.id)) out.av[b] = it.id;
    }
    if (isObj(s.wear)) for (const k of Object.keys(s.wear)) {
      const it = item(s.wear[k]);
      if (okNinja(k) && it && it.kind === 'cos' && out.own.includes(it.id) && (!it.ninja || it.ninja === k)) out.wear[k] = it.id;
    }
    if (isObj(s.jc)) for (const k of Object.keys(s.jc)) if (okNinja(k)) { const n = clampInt(s.jc[k], 0, 9999); if (n) out.jc[k] = n; }
    return out;
  }

  // An older save (before levels): the lifetime XP starts at the player's honor (a returning player gets the levels
  // that match what they already did; honor and XP pay about alike per fight), journey clears start at 1 for each
  // ninja already cleared. The level-up moment is not replayed for those levels (seen).
  function migrate(st, p) {
    if (!p || st.mig) return st;
    const hon = p.hon && typeof p.hon.t === 'number' ? p.hon.t : 0;
    st.xp = Math.max(st.xp, clampInt(hon, 0, BASE[60]));
    const cl = p.journey && isObj(p.journey.cleared) ? p.journey.cleared : {};
    for (const k of Object.keys(cl)) if (cl[k] && /^[a-z]{2,12}$/.test(k)) st.jc[k] = Math.max(st.jc[k] | 0, 1);
    st.seen = Math.max(st.seen, levelOf(st.xp).lv);
    st.mig = 1;
    return st;
  }

  function levelOf(xp) {
    xp = Math.max(0, xp | 0);
    let lv = 1;
    while (lv < MAX && xp >= BASE[lv + 1]) lv++;
    const into = xp - BASE[lv], nd = lv < MAX ? need(lv) : 0;
    return { lv, into, need: nd, pct: lv >= MAX ? 1 : into / nd, xp };
  }

  // The day bookkeeping for a fight played at `now`: a new day continues (yesterday) or restarts the streak.
  function touchDay(st, now, tz) {
    const today = dayOf(now, tz);
    if (st.d.k !== today) { st.d.s = st.d.k === today - 1 ? st.d.s + 1 : 1; st.d.k = today; st.d.t = 0; }
    return today;
  }

  // XP for one finished fight. c = { mode, won, level, roundsWon, parries, counters, rallies, perfects, sec }
  // → { total, rows: [[key, value, n?]], short, boosted } and the state updated (day, streak, short-fight run, booster)
  // (the caller adds total to the level and the season: add()).
  function fight(st, c, now, tz) {
    const rows = [];
    const today = touchDay(st, now, tz);
    const sec = typeof c.sec === 'number' && Number.isFinite(c.sec) ? Math.max(0, c.sec) : XP.shortSec;
    if (sec < XP.minSec) return { total: 0, rows, short: true, boosted: false };
    const mul = (XP.mode[c.mode] ?? 1) * (XP.lvMul[c.level] ?? 1);
    if (c.won) rows.push(['win', Math.round(XP.win * mul)]);
    else {
      rows.push(['loss', Math.round(XP.loss * mul)]);
      if (c.roundsWon > 0) rows.push(['rounds', Math.round(XP.round * Math.min(3, c.roundsWon) * mul), c.roundsWon]);
    }
    let cap = XP.styleCap;
    const style = (key, n, each) => {
      n = Math.max(0, n | 0); if (!n || cap <= 0) return;
      const v = Math.min(cap, n * each); cap -= v; rows.push([key, v, n]);
    };
    style('perfect', c.perfects, XP.perfect);
    style('rally', c.rallies, XP.rally);
    style('counter', c.counters, XP.counter);
    style('parry', c.parries, XP.parry);
    let total = Math.min(XP.fightCap, rows.reduce((s, r) => s + r[1], 0));
    // short fights: less XP; several in a row (within shortWin) less and less (½, ¼, … never below a tenth)
    let short = false;
    if (sec < XP.shortSec) {
      short = true;
      st.sh = now - st.sh.t < XP.shortWin * 1000 ? { t: now, n: st.sh.n + 1 } : { t: now, n: 1 };
      const f = Math.max(0.1, (sec / XP.shortSec) * Math.pow(0.5, st.sh.n - 1));
      total = Math.round(total * f);
      rows.push(['short', -Math.max(0, rows.reduce((s, r) => s + r[1], 0) - total)]);
    } else st.sh.n = 0; // a real fight ends a run of short ones
    let boosted = false;
    if (st.bo > 0 && total > 0) {
      const extra = Math.round(total * (XP.boostMul - 1));
      total += extra; st.bo--; boosted = true;
      rows.push(['boost', extra]);
    }
    // the first won fight of the day (a real one, not a short one)
    if (c.won && !short && st.d.w !== today) {
      st.d.w = today;
      rows.push(['daily', XP.firstWin]);
      total += XP.firstWin;
      const extra = XP.streak * Math.min(XP.streakMax, Math.max(0, st.d.s - 1));
      if (extra) { rows.push(['streak', extra, st.d.s]); total += extra; }
    }
    return { total: Math.max(0, total), rows, short, boosted };
  }

  // Add XP to the lifetime total and to the current season (key); the season's multipliers (a server season: mul for
  // the pass, lvMul for the level) apply here. → { from: levelOf, to: levelOf, ups: [levels], n }
  function add(st, n, key, seasonMul, levelMul) {
    n = Math.max(0, Math.round(n || 0));
    const from = levelOf(st.xp);
    st.xp = Math.min(XP_MAX, st.xp + Math.round(n * (levelMul || 1)));
    if (key) {
      const p = st.ps[key] || (st.ps[key] = { x: 0, f: [], b: [], a: 0, w: 0 });
      p.x = Math.min(1e7, p.x + Math.round(n * (seasonMul || 1)));
    }
    const to = levelOf(st.xp), ups = [];
    for (let L = from.lv + 1; L <= to.lv; L++) ups.push(L);
    return { from, to, ups, n };
  }

  // ---------------------------------------------------------------- claiming
  // How the reward of tier t can be claimed now: 'ad' (rewarded ads work here: one finished ad), 'wait' (no rewarded
  // ads here: it opens once the player is waitTiers tiers further, or at the last tier), or null (not reached, already
  // claimed, nothing there, or still waiting). → 'ad' | 'wait' | null
  function claimWay(S, p, t, adsOk) {
    const T = S.tiers[t - 1], reached = tierOf(S, p.x).tier;
    if (!T || !T.r || t > reached || p.f.includes(t)) return null;
    if (adsOk) return 'ad';
    return reached >= Math.min(S.tiers.length, t + S.waitTiers) ? 'wait' : null;
  }
  // without rewarded ads: the tier the player must reach for tier t's reward
  function waitTier(S, t) { return Math.min(S.tiers.length, t + S.waitTiers); }
  // Grant one item into the state. → { id, kind, n?, dup } (honor, the keys' unlocks are paid by the caller: they live
  // in the honor save, js/arcade.js). o.ranked: this build has ranked (a shield is useful): without it, or with
  // SHIELD_MAX already held, a shield pays KEY_HONOR honor instead ({ kind: 'honor', n, from: 'shield' })
  function grant(st, id, o) {
    const it = item(id);
    if (!it) return null;
    if (it.kind === 'boost') { st.bo = Math.min(99, st.bo + it.n); return { id, kind: 'boost', n: it.n }; }
    if (it.kind === 'honor') return { id, kind: 'honor', n: it.n };
    if (it.kind === 'rkey' || it.kind === 'akey') return { id, kind: it.kind }; // (the caller opens, or pays honor)
    if (it.kind === 'ticket') { st.tk = Math.min(TICKET_MAX, (st.tk | 0) + 1); return { id, kind: 'ticket', n: it.n }; }
    if (it.kind === 'shield') {
      if (!(o && o.ranked) || (st.sd | 0) >= SHIELD_MAX) return { id, kind: 'honor', n: KEY_HONOR, from: 'shield' };
      st.sd = Math.min(SHIELD_MAX, (st.sd | 0) + 1);
      return { id, kind: 'shield' };
    }
    if (it.kind === 'rw') return { id, kind: 'rw', ref: it.ref }; // (the server grants it: pass-net.js)
    if (st.own.includes(id)) {
      // already owned (a repeated offline season): an XP booster instead, so the tier still pays
      st.bo = Math.min(99, st.bo + 2);
      return { id, kind: it.kind, dup: true, n: 2 };
    }
    st.own.push(id);
    // the first of a kind is put on at once (titles, badges, frames, trails, fight flair, menu music; an arena variant
    // for its own arena)
    if (EQ_KINDS.includes(it.kind) && !st.eq[it.kind]) st.eq[it.kind] = id;
    if (it.kind === 'arena' && it.base && !st.av[it.base]) st.av[it.base] = id;
    return { id, kind: it.kind };
  }
  // Claim tier t's reward the way given ('ad' only after a finished rewarded ad: the caller checks). → the grant, or null
  function claim(S, st, key, t, way, adsOk, o) {
    const p = st.ps[key];
    if (!p) return null;
    const w = claimWay(S, p, t, adsOk);
    if (!w || w !== way) return null;
    p.f.push(t); p.f.sort((a, b) => a - b);
    if (way === 'ad') p.a = Math.min(999, p.a + 1);
    return grant(st, S.tiers[t - 1].r, o);
  }
  // Wear one item of a kind (EQ_KINDS) or none (id null); an arena variant per base arena. → true when done
  function equip(st, kind, id) {
    if (kind === 'arena') {
      const it = item(id);
      if (!it || it.kind !== 'arena' || !st.own.includes(id)) return false;
      st.av[it.base] = id; return true;
    }
    if (!EQ_KINDS.includes(kind)) return false;
    if (id == null) { delete st.eq[kind]; return true; }
    const it = item(id);
    if (!it || it.kind !== kind || !st.own.includes(id)) return false;
    st.eq[kind] = id; return true;
  }
  // what a fighter wears in a fight (js/flair.js set): the six fight slots of an eq object (own or another player's)
  function fightFlair(eq) {
    const o = {};
    for (const k of ['pose', 'hitfx', 'slash', 'aura', 'ko', 'card']) { const it = eq && item(eq[k]); o[k] = it && it.kind === k ? it.id : null; }
    return o;
  }

  // Journey clear n of one ninja: the XP and the items (2nd: Menkyo costume + title, 3rd: Kaiden costume + title)
  function journeyClear(st, ninja) {
    const n = st.jc[ninja] = Math.min(9999, (st.jc[ninja] | 0) + 1);
    const xp = XP.clear[Math.min(n, 4) - 1];
    const items = [];
    if (n === 2 || n === 3) for (const k of ['jc', 'jt']) { const g = grant(st, k + n + '_' + ninja); if (g && !g.dup) items.push(g); }
    return { n, xp, items };
  }

  ND.LEVEL = {
    MAX, XP, SEASON, ITEMS, THEMES, COSTUMES, DEFAULT_SEASON, BASE, FLAIR_IDS, FLAIR_KINDS, ARENA_BASE, EQ_KINDS, USED,
    SHIELD_MAX, TICKET_MAX, KEY_HONOR,
    need, levelOf, dayOf, seasonAt, item, cleanSeason, tierXp, tierOf,
    cleanState, migrate, touchDay, fight, add, grant, claimWay, waitTier, claim, journeyClear, equip, fightFlair,
  };
})(typeof window !== 'undefined' ? (window.ND = window.ND || {}) : (globalThis.ND = globalThis.ND || {}));
