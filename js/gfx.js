// Shadow Duel — graphics quality: Auto (default) / High / Medium / Low.
// The player's choice (pref) is saved in ND.save settings as `gfx` (game.js persists it). The tier actually drawn
// (active) equals the choice, except on Auto: there game.js starts from a guess for the device and steps down a
// ladder of tier + resolution rungs while fights run slow (see "auto quality" in game.js).
// What each tier draws (ND.gfx.f):
//   high    everything: bloom + film grain, lantern shadows, light rays, dust motes, reflections, full weather;
//           canvas up to 2× pixel ratio (phones 1.5×, weak phones 1.25×)
//   medium  light bloom (small buffer, no blur filter, no grain), rays, half the motes, reflections, full weather;
//           no lantern shadows; canvas up to 1.5× (phones 1.25×)
//   low     no bloom / grain / shadows / rays / motes / reflections, every other weather particle; canvas 1×
// ND.settings.hq stays true only on High (older code and effects read it for their extra glows).
// UI: ND.gfx.levels lists the choices, ND.gfx.setQuality(level) / ND.gfx.getQuality(), ND.gfx.onChange(fn).
// Texts: ND.STR.gfx (i18n.js / i18n-en.js, block "GRAPHICS QUALITY").
window.ND = window.ND || {};
(function (ND) {
  'use strict';
  const T = ND.touch || {}, MOBILE = !!T.mobile, LOW_END = !!T.lowEnd;
  let mem = 8, cores = 8;
  try { mem = navigator.deviceMemory || 8; cores = navigator.hardwareConcurrency || 8; } catch (e) { /* unknown: assume capable */ }
  // clearly weak phone/tablet: little memory or few cores
  const WEAK = MOBILE && (mem <= 2 || cores <= 4);
  const LEVELS = ['auto', 'high', 'medium', 'low'];
  const TIERS = {
    high: { hq: true, rays: true, motes: 1, bloom: 2, grain: true, shadows: true, reflect: true, weather: 1, dpr: MOBILE ? (LOW_END ? 1.25 : 1.5) : 2 },
    medium: { hq: false, rays: true, motes: 0.5, bloom: 1, grain: false, shadows: false, reflect: true, weather: 1, dpr: MOBILE ? 1.25 : 1.5 },
    low: { hq: false, rays: false, motes: 0, bloom: 0, grain: false, shadows: false, reflect: false, weather: 2, dpr: 1 },
  };
  const fns = [];
  const G = ND.gfx = {
    levels: LEVELS,
    tiers: ['high', 'medium', 'low'],
    mobile: MOBILE,
    pref: 'auto',
    tier: 'high',
    f: TIERS.high,
    flags: (tier) => TIERS[tier] || TIERS.high,
    // Auto's starting tier: computers High, phones and tablets Medium, clearly weak phones Low
    guess() { return !MOBILE ? 'high' : WEAK ? 'low' : 'medium'; },
    getQuality() { return G.pref; },
    active() { return G.tier; },
    // Player's choice: 'auto' | 'high' | 'medium' | 'low'. Applies at once and is saved (game.js listens).
    setQuality(level) {
      if (!LEVELS.includes(level)) return false;
      G.pref = level;
      G._setTier(level === 'auto' ? G.guess() : level, 'user');
      return true;
    },
    // Active tier only (Auto's ladder calls this; `why` = 'user' | 'auto' | 'init')
    _setTier(tier, why) {
      if (!TIERS[tier]) tier = 'high';
      G.tier = tier; G.f = TIERS[tier];
      if (ND.settings) ND.settings.hq = G.f.hq;
      for (const fn of fns) { try { fn(G.pref, tier, why || 'user'); } catch (e) { console.warn('[ND.gfx] listener failed', e); } }
    },
    onChange(fn) { fns.push(fn); return () => { const i = fns.indexOf(fn); if (i >= 0) fns.splice(i, 1); }; },
  };
})(window.ND);
