// Shadow Duel — voices (STUB). Announcer lines and a small voice set per fighter, from free licensed recordings
// (plan and candidate packs: docs/SES-PLANI.md). No recording is in the repository yet, so this file only decides
// WHEN a line would be spoken; nothing is loaded or played. With ?voice=log it writes each decision to ND.voice.log
// (and the console), which is how the timing and the rate limits can be checked before any file exists.
//
// How it will work once the files are in (sounds/voice/, one small mono .mp3 per line, see MANIFEST):
//   - per match only the two fighters' sets + the announcer are fetched and decoded (preload), lazily after the
//     match starts loading; a missing file is skipped silently (the fight never waits for a voice)
//   - playback goes through the effects level (ND.audio.out → dry / reverb send → master), so the Effects slider,
//     the Sound switch, portal mute, ads (adMuted) and a hidden tab already silence it
//   - announcer lines duck the music bus (ND.music.bus) by about 8 dB for their length, then glide back
//   - one voice per fighter at a time; the announcer never overlaps itself
//   - the announcer speaks English (optionally one Japanese call such as "Hajime!") in every language: the
//     on-screen banners are what gets translated
// Hooks are wrappers (like game.js does for the score), so fighter.js / game.js need no edits:
//   game.banner (round, fight, K.O., time), game.matchEnd (winner), Fighter.startAtk (attack shouts),
//   Fighter.takeHit (hurt / KO scream), Fighter.setState('win') (victory line), game.onSpecial (ki shout).
(function (ND) {
  'use strict';
  let mode = '';
  try { mode = (ND.qs && ND.qs.get('voice')) || ''; } catch (e) { /* no URL */ }

  // Lines each set will have (file names = keys). Fighter sets: 2–3 attack shouts, 2 hurt, KO, ki shout, victory.
  const ANNOUNCER = ['round1', 'round2', 'round3', 'final', 'fight', 'ko', 'perfect', 'time', 'win', 'lose', 'draw'];
  const FIGHTER = ['atk1', 'atk2', 'atk3', 'hurt1', 'hurt2', 'ko', 'ki', 'win'];

  // Rate limits (seconds, game time is not used: real time, so slow motion doesn't multiply shouts)
  const R = {
    atkGap: 0.9,      // a fighter shouts at most this often
    atkLight: 0.22,   // chance a light attack gets a shout
    atkHeavy: 0.6,    // heavy / launcher / knockdown attack
    hurtGap: 0.7,     // hurt sounds per fighter
    hurtMin: 7,       // damage below this is too small for a voice
  };

  const now = () => performance.now() / 1000;
  const V = ND.voice = {
    on: mode === 'log',
    log: [],
    ANNOUNCER, FIGHTER, R,
    last: new Map(),       // fighter → { atk, hurt } times
    // the two fighters of the match: fetch + decode their sets and the announcer (stub: nothing to fetch yet)
    preload(ids) { this.pending = ids.slice(); },
    // One line: who = 'ann' or a fighter; line = a key above. The real version picks the buffer, applies a small
    // pitch spread (playbackRate 0.96–1.04) and plays it; here it is only recorded.
    say(who, line, info) {
      if (!this.on) return false;
      if (ND.audio && ND.audio.audible && !ND.audio.audible() && mode !== 'log') return false;
      const id = who === 'ann' ? 'ann' : (who && who.ch && who.ch.id) || '?';
      const e = { t: +now().toFixed(2), who: id, line, info: info || '' };
      this.log.push(e);
      if (this.log.length > 400) this.log.shift();
      try { console.debug('[voice]', id, line, info || ''); } catch (err) { /* yok */ }
      return true;
    },
    gate(f, kind, gap) {
      const m = this.last.get(f) || {};
      const t = now();
      if (m[kind] && t - m[kind] < gap) return false;
      m[kind] = t; this.last.set(f, m);
      return true;
    },
    // attack started: heavier moves shout more often; specials always (ki shout)
    attack(f, a) {
      if (!a || a.kind === 'throw') return;
      if (a.special) { this.say(f, 'ki'); return; }
      const heavy = a.knock || a.launch || (a.pw || 1) >= 1.3;
      if (Math.random() > (heavy ? R.atkHeavy : R.atkLight)) return;
      if (!this.gate(f, 'atk', R.atkGap)) return;
      this.say(f, 'atk' + (1 + ((Math.random() * (heavy ? 3 : 2)) | 0)), heavy ? 'heavy' : 'light');
    },
    hurt(f, dmg) {
      if (f.dead || f.hp <= 0) { this.say(f, 'ko'); return; }
      if (dmg < R.hurtMin || !this.gate(f, 'hurt', R.hurtGap)) return;
      this.say(f, dmg >= 18 ? 'hurt2' : 'hurt1', Math.round(dmg));
    },
  };
  if (!V.on) return;

  // ---------------------------------------------------------------- hooks (wrappers, no edits elsewhere)
  function hook() {
    const G = ND.game, FP = ND.Fighter && ND.Fighter.prototype;
    if (!G || !FP || G._voice) return;
    G._voice = true;
    const banner = G.banner;
    G.banner = function (text, kanji) {
      const r = banner.apply(this, arguments);
      try {
        if (this.mode !== 'attract') {
          if (this.phase === 'intro') {
            if (kanji === '始め') V.say('ann', 'fight');
            else {
              const need = this.winsNeed || 2, last = this.wins[0] === need - 1 && this.wins[1] === need - 1;
              V.say('ann', last ? 'final' : 'round' + Math.min(3, this.round));
            }
          } else if (this.phase === 'ko') {
            V.say('ann', 'ko');
            if (this.winner && this.winner.damageTaken === 0 && !this.doubleKO) V.say('ann', 'perfect', 'after ko');
          } else if (this.phase === 'timeup') V.say('ann', 'time');
        }
      } catch (e) { /* a voice never breaks the fight */ }
      return r;
    };
    const matchEnd = G.matchEnd;
    G.matchEnd = function (w) {
      try { if (this.mode !== 'attract') V.say('ann', !w ? 'draw' : this.mode === '2p' ? 'win' : w.id === 0 ? 'win' : 'lose'); } catch (e) { /* yok */ }
      return matchEnd.apply(this, arguments);
    };
    const startAtk = FP.startAtk;
    FP.startAtk = function () {
      const r = startAtk.apply(this, arguments);
      try { if (G.phase === 'fight' && G.mode !== 'attract') V.attack(this, this.atk); } catch (e) { /* yok */ }
      return r;
    };
    const take = FP.takeHit;
    FP.takeHit = function () {
      const hp0 = this.hp, r = take.apply(this, arguments);
      try { if (G.mode !== 'attract' && hp0 > this.hp) V.hurt(this, hp0 - this.hp); } catch (e) { /* yok */ }
      return r;
    };
    const setSt = FP.setState;
    FP.setState = function (s) {
      const was = this.state, r = setSt.apply(this, arguments);
      try { if (s === 'win' && was !== 'win' && G.mode !== 'attract') V.say(this, 'win'); } catch (e) { /* yok */ }
      return r;
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else setTimeout(hook, 0);
})(window.ND);
