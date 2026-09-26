// Authored Arcade routes and optional mastery. No per-frame allocations or save access here.
(function (ND) {
  'use strict';
  const routes = {
    akane: ['hana yuki tetsu kuro mai kage aoi ren', 'temple market snow village rain waterfall temple castle', 'parry counter heavy counter parry counter combo counter'],
    aoi: ['yuki hana jin tsubame ren tora kage akane', 'rain market temple snow village waterfall rain castle', 'dash air dash parry combo dash counter counter'],
    kuro: ['hana ren yuki mai aoi tora jin tetsu', 'snow village rain market temple waterfall snow castle', 'heavy heavy parry break heavy counter heavy break'],
    yuki: ['ren akane kuro tetsu jin tsubame aoi hana', 'snow temple village waterfall rain snow market castle', 'ranged air dash ranged counter air ranged combo'],
    hana: ['akane jin ren tetsu kuro kage mai yuki', 'market temple village waterfall snow rain market castle', 'combo dash combo air counter combo parry counter'],
    tetsu: ['yuki hana ren aoi mai tora jin kuro', 'village market rain temple waterfall snow village castle', 'heavy parry kick heavy counter break parry heavy'],
    ren: ['hana yuki tetsu jin mai tora akane kage', 'village snow temple waterfall market rain village castle', 'kick heavy kick break counter kick combo break'],
    kage: ['tetsu kuro hana mai jin tsubame akane ren', 'rain snow market temple waterfall village rain castle', 'dash counter air counter parry special counter combo'],
    tora: ['hana yuki akane ren mai tsubame tetsu jin', 'waterfall snow temple village market rain waterfall castle', 'heavy kick heavy counter break heavy parry heavy'],
    jin: ['ren hana yuki aoi kage mai tetsu tora', 'temple market snow rain village waterfall temple castle', 'parry heavy kick parry counter break heavy counter'],
    mai: ['ren kuro tetsu jin akane kage hana tsubame', 'market snow village temple rain waterfall market castle', 'parry counter parry combo special parry counter parry'],
    tsubame: ['tetsu kuro ren akane hana aoi yuki mai', 'rain snow village temple market waterfall rain castle', 'ranged air ranged dash ranged special air ranged'],
    shura: ['hana yuki ren tora tetsu jin kage akane', 'castle snow village waterfall market temple rain castle', 'heavy counter break special parry combo counter counter'],
  };
  const goals = { parry: 2, counter: 2, heavy: 2, kick: 2, air: 2, dash: 2, combo: 1, ranged: 3, special: 1, break: 1 };
  const J = ND.JOURNEY = {
    version: 2, masteryNeed: 6, shuraNeed: 3, routes, goals,
    route(id) {
      const r = routes[id]; if (!r) return [];
      const arenas = r[1].split(' '), tasks = r[2].split(' ');
      // difficulty ladder (2026-09, harder start): 1 Apprentice (the learning fight), 2–3 Master, 4–6 Legend,
      // 7 Legend with +15 % health, 8 the boss (J.level / J.hp; arcade.js uses the same for legacy routes)
      return r[0].split(' ').map((opp, k) => ({ opp, arena: arenas[k], level: J.level(k), ...(J.hp(k) ? { hp: J.hp(k) } : {}),
        ...(k === 7 ? { boss: true } : {}), goal: tasks[k], need: k < 2 ? 1 : goals[tasks[k]] }));
    },
    level(k) { return k < 1 ? 0 : k < 3 ? 1 : k < 7 ? 2 : 3; },
    hp(k) { return k === 6 ? 1.15 : 0; },
    count(mask) { let n = 0; for (let i = 0; i < 8; i++) if ((mask | 0) & (1 << i)) n++; return n; },
    mask(value) { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(255, Math.floor(value))) : 0; },
    // Hits are credited only after real health loss, never for a button press or a blocked attack.
    hit(metrics, from, a) {
      const add = (k) => { metrics[k] = Math.min(99, (metrics[k] || 0) + 1); };
      if (a.counter) add('counter');
      if (a.special) add('special');
      if (a.air) add('air');
      // Projectiles can arrive during a different move. Never classify them by the owner's current animation.
      if (a.kind === 'shuriken' || a.kind === 'arrow') { add('ranged'); return; }
      if (a.special) return;
      if (a.kind === 'kick') add('kick');
      if (from.state !== 'atk') return;
      if (!a.air && (from.atkName === 'air' || from.atkName === 'plunge')) add('air');
      if (from.atkName === 'dash' || from.atkName === 'dashHeavy') add('dash');
      if (from.atkName === 'light3') add('combo');
      if (from.atkName === 'heavy' || /^kaeshiHeavy/.test(from.atkName || '')) add('heavy');
    },
    value(fight, metrics, parries = 0) { return fight ? Math.min(fight.need, fight.goal === 'parry' ? parries : metrics[fight.goal] || 0) : 0; },
  };
})(window.ND);
