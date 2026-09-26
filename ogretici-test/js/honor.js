// Shadow Duel — Honor (誉 Onur): the single progression resource. Pure rules and numbers, no DOM and no save access,
// so scripts/economy.mjs can run this very file in Node to check the pace. The game side (earning, saving, the
// rival challenges, the screens) lives in arcade.js (ND.save / ND.honor / ND.rival) and game.js.
//
// - Honor is a lifetime total: it is never spent, it only opens things.
// - Every single-player match pays: a win by difficulty, a loss a little (plus its won rounds), and good play
//   (parries, counters, rallies, perfect rounds) a capped bonus, so a struggling player still moves forward.
// - Run bonuses: clearing Arcade or the Weekly Tournament, passing a Dan trial, beating a rival; the tutorial once.
// - Each locked ninja has an honor threshold (in order). Reaching it opens a Rival Challenge (a duel against that
//   ninja); winning it unlocks the ninja. A lost challenge costs nothing and makes the next attempt a little easier.
// - Arenas open at honor milestones; the castle roof stays the reward for beating Shura in Arcade.
(function (ND) {
  'use strict';
  const H = ND.HONOR = {
    // match honor
    win: [20, 35, 50, 80],          // won match by AI level: Apprentice, Master, Legend, Shura (boss)
    loss: 6, roundWon: 4,            // lost match: showing up + each round taken
    parry: 1, counter: 1, rally: 3, perfect: 5, styleCap: 15, // good play, win or lose (capped per match)
    modeMul: { cpu: 1, arcade: 1, tourney: 1.2, dan: 1.2, rival: 1 }, // on the win/loss base only
    // run bonuses
    arcadeClear: 150, tourneyClear: 150, rivalWin: 40, lesson: 5, tutorial: 25,
    danPass: (rank) => 30 + 5 * rank, // rank = the rank just earned (1 = 10th Kyu … 20 = 10th Dan)
    // Rival challenges, in unlock order. need = lifetime honor that opens the challenge, lv = AI level,
    // hp = rival HP multiplier, arena = where the duel is fought (the rival's home ground).
    RIVALS: [
      { id: 'hana', need: 100, lv: 0, hp: 1.3, arena: 'market' },
      { id: 'tetsu', need: 330, lv: 1, hp: 1, arena: 'village' },
      { id: 'ren', need: 620, lv: 1, hp: 1, arena: 'village' },
      { id: 'kage', need: 950, lv: 1, hp: 1.05, arena: 'market' },
      { id: 'tora', need: 1400, lv: 1, hp: 1.15, arena: 'waterfall' },
      { id: 'jin', need: 1950, lv: 2, hp: 0.9, arena: 'temple' },
      { id: 'mai', need: 2600, lv: 2, hp: 1, arena: 'market' },
      { id: 'tsubame', need: 3350, lv: 2, hp: 0.9, arena: 'rain' },
    ],
    soften: 0.1, softenMin: 0.6,      // each lost attempt: rival HP −10 % of base, never below 60 %
    // Arenas that open with honor (temple, rain, snow are open from the start; castle = beat Shura in Arcade)
    ARENAS: [{ id: 'village', need: 250 }, { id: 'market', need: 550 }, { id: 'waterfall', need: 900 }],
    // The old rules (before honor): unlocks by total Arcade wins, Kage by one clear. Used once to migrate a save.
    OLD_WINS: { hana: 2, tetsu: 4, ren: 6, tora: 8, jin: 10, mai: 12, tsubame: 14 },

    rival(id) { return H.RIVALS.find((r) => r.id === id) || null; },
    // Rival HP for the next attempt after `fails` lost attempts
    rivalHp(r, fails) { return Math.max(H.softenMin, +(r.hp - H.soften * (fails | 0)).toFixed(2)); },

    // Honor for one finished match. c = { mode, won, level, roundsWon, parries, counters, rallies, perfects }
    // → { total, rows: [[key, value, count?]] } (rows in display order; keys are ND.STR.honor.rows keys)
    match(c) {
      const rows = [], mul = H.modeMul[c.mode] || 1;
      if (c.won) rows.push(['win', Math.round((H.win[c.level] ?? H.win[1]) * mul)]);
      else {
        rows.push(['loss', Math.round(H.loss * mul)]);
        if (c.roundsWon > 0) rows.push(['rounds', Math.round(H.roundWon * c.roundsWon * mul), c.roundsWon]);
      }
      let cap = H.styleCap;
      const style = (key, n, each) => {
        n = Math.max(0, n | 0); if (!n || cap <= 0) return;
        const v = Math.min(cap, n * each); cap -= v; rows.push([key, v, n]);
      };
      style('perfect', c.perfects, H.perfect);
      style('rally', c.rallies, H.rally);
      style('counter', c.counters, H.counter);
      style('parry', c.parries, H.parry);
      return { total: rows.reduce((s, r) => s + r[1], 0), rows };
    },

    // Old save → honor. p = the progress object (wins, clears, bossWins, lessons, tutorial, bz). Credits what the
    // player did at today's rates, and never less than the threshold of the furthest rival they already own.
    migrate(p) {
      let t = (p.wins | 0) * 40 + (p.clears | 0) * H.arcadeClear;
      const dan = p.bz && p.bz.dan; if (dan) for (let r = 1; r <= Math.min(20, dan.best | 0); r++) t += H.danPass(r);
      const weeks = (p.bz && p.bz.t) || {};
      for (const k in weeks) t += Math.min(8, weeks[k] && weeks[k].won | 0) * 45;
      if (Array.isArray(p.lessons)) t += p.lessons.length * H.lesson;
      if (p.tutorial) t += H.tutorial;
      const own = Array.isArray(p.chars) ? p.chars : [];
      for (const r of H.RIVALS) if (own.includes(r.id)) t = Math.max(t, r.need);
      return Math.round(t);
    },
  };
})(typeof window !== 'undefined' ? window.ND : globalThis.ND);
