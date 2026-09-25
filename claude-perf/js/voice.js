// Shadow Duel — voices: the announcer and a small voice set per fighter (Japanese free voice libraries; sources,
// licences and processing in docs/ASSET-LOG.md, casting in docs/SES-PLANI.md).
//
// Files: voice/announcer/<line>.mp3 and voice/<fighter id>/<line>.mp3 (mono MP3, trimmed, loudness-matched).
// Loading: per match only the two fighters' sets + the announcer are fetched (when the VS screen / match starts) and
// decoded once the audio context exists; every set stays cached. A file that fails to load is simply silent — the
// fight never waits for a voice.
// Playback: through the effects level (ND.audio.out → dry / reverb send → master), so the Effects slider, the Sound
// switch, portal mute, ads and a hidden tab silence voices too; the Voices switch (Settings > Audio,
// ND.settings.voice) turns just the voices off. Announcer lines never overlap each other (short queue) and dip the
// music a few dB (ND.music.duck) while they speak. A fighter says one thing at a time: a more important line (KO >
// ki shout / victory > hurt > attack shout) cuts a lesser one; a lesser one is skipped while a bigger one plays.
// Announcer lines are the same in every language (on-screen banners carry the translation).
// Hooks are wrappers (as elsewhere), so fighter.js / game.js need no edits for them:
//   game.start / game.showStage (preload), game.banner (round, begin, K.O., time up, perfect), game.matchEnd (match
//   decided), game.onSpecial (ki shout), Fighter.startAtk (attack shouts), Fighter.takeHit (hurt), Fighter.die (KO
//   scream), Fighter.setState('win') (victory line).
// URL: ?voice=off → no voices; ?voice=log → also print each decision to the console. ND.voice.log keeps the last 400.
(function (ND) {
  'use strict';
  let mode = '';
  try { mode = (ND.qs && ND.qs.get('voice')) || ''; } catch (e) { /* no URL */ }

  const BASE = 'voice/';
  const ANNOUNCER = ['round1', 'round2', 'round3', 'final', 'fight', 'ko', 'perfect', 'time', 'decided'];
  const FIGHTER = ['atk1', 'atk2', 'atk3', 'hurt1', 'hurt2', 'ko', 'ki', 'win'];
  // sets with fewer attack shouts (Kage is the quiet one)
  const LINES = { announcer: ANNOUNCER, kage: ['atk1', 'atk2', 'hurt1', 'hurt2', 'ko', 'ki', 'win'] };
  const ROSTER = ['akane', 'aoi', 'kuro', 'yuki', 'hana', 'tetsu', 'ren', 'kage', 'tora', 'jin', 'mai', 'tsubame', 'shura'];
  const linesOf = (set) => LINES[set] || FIGHTER;
  const PRIO = { atk: 1, hurt: 2, ki: 3, win: 3, ko: 4 };
  const prioOf = (line) => PRIO[line.replace(/\d+$/, '')] || 1;

  // Rate limits (real seconds: slow motion does not multiply shouts)
  const R = {
    atkGap: 1.8,      // a fighter shouts at most this often
    atkLight: 0.15,   // chance a light attack gets a shout
    atkHeavy: 0.5,    // heavy / launcher / knockdown attack
    atkBoth: 0.8,     // no attack shout this soon after any fighter voice started (exchanges stay readable)
    hurtGap: 1.1,     // hurt sounds per fighter
    hurtMin: 7,       // damage below this is too small for a voice
    hurtHeavy: 18,    // from here the heavier pain sound
    winRound: 0.5,    // chance of the victory line after a round that does not end the match (always on match point)
    winTrain: 0.3,    // training: the dummy goes down again and again
  };
  const LEVEL = { fighter: 0.8, announcer: 0.95 }; // voice gain into the effects bus (files are loudness-matched)
  const DUCK_DB = 7;

  const au = ND.audio;
  const now = () => performance.now() / 1000;
  const cache = new Map();   // set → { raw: Map(line → ArrayBuffer), buf: Map(line → AudioBuffer), p: Promise }

  const V = ND.voice = {
    enabled: mode !== 'off',
    debug: mode === 'log',
    log: [],
    ANNOUNCER, FIGHTER, ROSTER, R, LEVEL,
    last: new Map(),        // fighter → { atk, hurt } times
    playing: new Map(),     // fighter → { src, g, prio, end }
    ann: { busyUntil: 0, queue: [], timer: 0 },
    lastVoiceT: 0,
    sets: cache,
    linesOf,

    setEnabled(v) {
      this.enabled = !!v && mode !== 'off';
      if (!this.enabled) this.stopAll();
    },
    // fetch (and decode, once there is an audio context) the given sets; resolves when all are done or failed
    preload(ids) {
      const sets = ['announcer', ...ids.filter((id) => ROSTER.includes(id))];
      return Promise.all([...new Set(sets)].map((s) => this.loadSet(s)));
    },
    loadSet(set) {
      let e = cache.get(set);
      if (e) { this.decodeSet(set); return e.p; }
      e = { raw: new Map(), buf: new Map(), p: null, failed: 0 };
      cache.set(set, e);
      if (typeof fetch !== 'function') { e.p = Promise.resolve(); return e.p; }
      e.p = Promise.all(linesOf(set).map((line) => fetch(BASE + set + '/' + line + '.mp3')
        .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
        .then((ab) => { e.raw.set(line, ab); return this.decodeOne(set, line); })
        .catch(() => { e.failed++; })))
        .then(() => { if (e.failed && this.debug) console.debug('[voice]', set, e.failed, 'file(s) missing'); });
      return e.p;
    },
    decodeSet(set) {
      const e = cache.get(set);
      if (!e) return;
      for (const line of [...e.raw.keys()]) this.decodeOne(set, line);
    },
    // decodeAudioData: promise form, with the callback form for old Safari; the raw bytes are dropped once decoded
    decodeOne(set, line) {
      const e = cache.get(set), ab = e && e.raw.get(line), c = au && au.ctx;
      if (!ab || !c) return Promise.resolve();
      e.raw.delete(line);
      return new Promise((res) => {
        let done = false;
        const ok = (b) => { if (done) return; done = true; if (b) e.buf.set(line, b); res(); };
        const bad = () => { if (done) return; done = true; e.failed++; res(); };
        try { const p = c.decodeAudioData(ab, ok, bad); if (p && p.then) p.then(ok, bad); } catch (err) { bad(); }
      });
    },
    buffer(set, line) {
      const e = cache.get(set);
      if (!e) { this.loadSet(set); return null; }
      if (!e.buf.has(line) && e.raw.has(line)) this.decodeOne(set, line); // context appeared after the fetch
      return e.buf.get(line) || null;
    },
    canPlay() {
      return this.enabled && (!ND.settings || ND.settings.voice !== false) && !!au && au.ready && !au.quiet && au.audible();
    },
    record(who, line, info, played) {
      const e = { t: +now().toFixed(2), who, line, info: info || '', played: !!played };
      this.log.push(e);
      if (this.log.length > 400) this.log.shift();
      if (this.debug) { try { console.debug('[voice]', who, line, info || '', played ? '' : '(silent)'); } catch (err) { /* yok */ } }
    },
    // one buffer through the effects bus; returns { src, g, end }
    play(buf, o) {
      const c = au.ctx, t = c.currentTime;
      const src = c.createBufferSource(); src.buffer = buf;
      src.playbackRate.value = o.rate || 1;
      const g = au.out(o.send, o.pan);
      g.gain.setValueAtTime(o.gain, t);
      src.connect(g);
      src.start(t);
      const end = t + buf.duration / (o.rate || 1);
      src.onended = () => { try { g.disconnect(); } catch (e) { /* yok */ } };
      return { src, g, end };
    },
    stop(p, fade = 0.06) {
      if (!p) return;
      try {
        const t = au.ctx.currentTime;
        au.ramp(p.g.gain, 0.0001, fade / 3);
        p.src.stop(t + fade);
      } catch (e) { /* already stopped */ }
    },
    stopAll() {
      this.playing.forEach((p) => this.stop(p));
      this.playing.clear();
      this.ann.queue.length = 0;
      clearTimeout(this.ann.timer);
    },

    // ------------------------------------------------------------ the two speakers
    // A fighter line. f = a Fighter (its ch.id picks the set)
    say(f, line, info) {
      const id = f && f.ch && f.ch.id;
      if (!id) return false;
      if (!this.canPlay()) { this.record(id, line, info, false); return false; }
      const buf = ROSTER.includes(id) ? this.buffer(id, line) : null;
      if (!buf) { this.record(id, line, info || 'not loaded', false); return false; }
      const t = au.ctx.currentTime, prio = prioOf(line), cur = this.playing.get(f);
      if (cur && cur.end > t) {
        if (cur.prio > prio || (cur.prio === prio && prio < PRIO.ki)) { this.record(id, line, 'busy', false); return false; }
        this.stop(cur);
      }
      const pan = Math.max(-1, Math.min(1, (f.pan || 0) * 0.6));
      const p = this.play(buf, { gain: LEVEL.fighter, rate: 0.975 + Math.random() * 0.05, pan, send: 0.14 });
      p.prio = prio;
      this.playing.set(f, p);
      this.lastVoiceT = now();
      this.record(id, line, info, true);
      return true;
    },
    // An announcer line: queued so two never overlap; a line that waited too long is dropped (it would be stale)
    announce(line, info) {
      if (!this.canPlay()) { this.record('ann', line, info, false); return false; }
      this.ann.queue.push({ line, info, at: now() });
      this.pump();
      return true;
    },
    pump() {
      const A = this.ann;
      clearTimeout(A.timer);
      if (!A.queue.length || !au.ctx) return;
      const t = au.ctx.currentTime;
      if (t < A.busyUntil) { A.timer = setTimeout(() => this.pump(), (A.busyUntil - t) * 1000 + 10); return; }
      const it = A.queue.shift();
      if (now() - it.at > 1.6 || !this.canPlay()) { this.record('ann', it.line, 'dropped', false); this.pump(); return; }
      const buf = this.buffer('announcer', it.line);
      if (!buf) { this.record('ann', it.line, 'not loaded', false); this.pump(); return; }
      const p = this.play(buf, { gain: LEVEL.announcer, rate: 1, pan: 0, send: 0.2 });
      A.busyUntil = p.end + 0.06;
      if (ND.music && ND.music.duck) ND.music.duck(DUCK_DB, buf.duration + 0.1);
      this.record('ann', it.line, it.info, true);
      if (A.queue.length) this.pump();
    },

    // ------------------------------------------------------------ decisions
    gate(f, kind, gap) {
      const m = this.last.get(f) || {};
      const t = now();
      if (m[kind] && t - m[kind] < gap) return false;
      m[kind] = t; this.last.set(f, m);
      return true;
    },
    // attack started: heavier moves shout more often; the ki technique has its own hook (special)
    attack(f, a) {
      if (!a || a.kind === 'throw' || a.special) return;
      const heavy = !!(a.knock || a.launch || (a.pw || 1) >= 1.3);
      if (Math.random() > (heavy ? R.atkHeavy : R.atkLight)) return;
      if (now() - this.lastVoiceT < R.atkBoth) return;
      if (!this.gate(f, 'atk', R.atkGap)) return;
      const n = linesOf(f.ch.id).filter((l) => l.startsWith('atk')).length || 2;
      // light moves use the short shouts (1–2), heavy ones any, favouring the last (biggest) one of the set
      const i = heavy ? (Math.random() < 0.5 ? n : 1 + ((Math.random() * n) | 0)) : 1 + ((Math.random() * Math.min(2, n)) | 0);
      this.say(f, 'atk' + i, heavy ? 'heavy' : 'light');
    },
    special(f) { this.gate(f, 'atk', 0); this.say(f, 'ki'); },
    hurt(f, dmg) {
      if (f.dead || f.hp <= 0) return; // the KO scream comes from die()
      if (dmg < R.hurtMin || !this.gate(f, 'hurt', R.hurtGap)) return;
      const big = dmg >= R.hurtHeavy;
      this.say(f, (Math.random() < 0.8 ? big : !big) ? 'hurt2' : 'hurt1', Math.round(dmg));
    },
  };

  // ---------------------------------------------------------------- hooks (wrappers, no edits elsewhere)
  function hook() {
    const G = ND.game, FP = ND.Fighter && ND.Fighter.prototype;
    if (!G || !FP || G._voice) return;
    G._voice = true;
    const live = () => G.mode !== 'attract' && !G.replay;
    const safe = (fn) => { try { fn(); } catch (e) { if (V.debug) console.warn('[voice]', e); } };
    const idOf = (i) => (ND.CHARS && ND.CHARS[i] ? ND.CHARS[i].id : null);

    const start = G.start;
    G.start = function (mode) {
      const r = start.apply(this, arguments);
      safe(() => { V.stopAll(); if (mode !== 'attract' && G.F) V.preload(G.F.map((f) => f.ch.id)); });
      return r;
    };
    // the VS / select stage names both fighters a moment before the match: start fetching there
    if (G.showStage) {
      const stage = G.showStage;
      G.showStage = function (phase, ids, c1, c2) {
        const r = stage.apply(this, arguments);
        safe(() => { const s = [idOf(c1), idOf(c2)].filter(Boolean); if (s.length) V.preload(s); });
        return r;
      };
    }
    const banner = G.banner;
    G.banner = function (text, kanji) {
      const r = banner.apply(this, arguments);
      safe(() => {
        if (this.mode === 'attract') return;
        if (this.phase === 'intro') {
          if (kanji === '始め') V.announce('fight');
          else {
            const need = this.winsNeed || 2, last = this.wins[0] === need - 1 && this.wins[1] === need - 1;
            V.announce(last ? 'final' : 'round' + Math.min(3, this.round));
          }
        } else if (this.phase === 'ko') {
          V.announce('ko');
          if (this.winner && this.winner.damageTaken === 0 && !this.doubleKO) V.announce('perfect', 'after ko');
        } else if (this.phase === 'timeup') V.announce('time');
      });
      return r;
    };
    const matchEnd = G.matchEnd;
    G.matchEnd = function (w) {
      safe(() => { if (this.mode !== 'attract' && w) V.announce('decided'); });
      return matchEnd.apply(this, arguments);
    };
    const onSpecial = G.onSpecial;
    G.onSpecial = function (f) {
      const r = onSpecial.apply(this, arguments);
      safe(() => { if (live()) V.special(f); });
      return r;
    };
    const startAtk = FP.startAtk;
    FP.startAtk = function () {
      const r = startAtk.apply(this, arguments);
      safe(() => { if (G.phase === 'fight' && live()) V.attack(this, this.atk); });
      return r;
    };
    const take = FP.takeHit;
    FP.takeHit = function () {
      const hp0 = this.hp, r = take.apply(this, arguments);
      safe(() => { if (live() && hp0 > this.hp) V.hurt(this, hp0 - this.hp); });
      return r;
    };
    const die = FP.die;
    FP.die = function () {
      const r = die.apply(this, arguments);
      safe(() => { if (live()) V.say(this, 'ko'); });
      return r;
    };
    const setSt = FP.setState;
    FP.setState = function (s) {
      const was = this.state, r = setSt.apply(this, arguments);
      safe(() => {
        if (s !== 'win' || was === 'win' || !live()) return;
        const need = G.winsNeed || 2, point = !!G.wins && G.wins[this.id] + 1 >= need;
        const chance = G.mode === 'train' ? R.winTrain : point ? 1 : R.winRound;
        if (Math.random() < chance) V.say(this, 'win');
      });
      return r;
    };
    // sets fetched before the first tap (no audio context yet) are decoded as soon as the context exists
    if (au && au.init) {
      const init = au.init;
      au.init = function () {
        const r = init.apply(this, arguments);
        safe(() => { if (au.ctx) cache.forEach((e, set) => { if (e.raw.size) V.decodeSet(set); }); });
        return r;
      };
    }
    // the Voices switch may have been saved off
    V.setEnabled(!ND.settings || ND.settings.voice !== false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else setTimeout(hook, 0);
})(window.ND);
