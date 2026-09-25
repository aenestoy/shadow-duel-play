// Shadow Duel — local portal stand-in for builds without Vite (claude.ai Artifact: dist-artifact/).
//
// The portal builds load src/portal-bridge.ts (bundled by Vite, with the CrazyGames/Poki/Yandex SDK adapters).
// The Artifact host has no bundler and no ad network, so scripts/build-artifact.mjs puts this classic script in
// its place. It publishes the same window.NDPortal surface as the bridge on its local fallback: no SDK, no ads
// (ND.ads stays disabled on 'local'), saves in localStorage under the same "game:" keys, browser language.
// Loaded before js/core.js; core.js reuses the shared deferred (window.__ndPortalD) created here.
(function () {
  'use strict';
  if (window.NDPortal) return;
  const d = window.__ndPortalD || (window.__ndPortalD = (() => { let r; const p = new Promise((x) => (r = x)); return { p, r }; })());
  const lang = () => { try { return ((navigator.language || 'en').slice(0, 2) || 'en').toLowerCase(); } catch (e) { return 'en'; } };
  const k = (key) => 'game:' + key;
  let loaded = false, playing = false;
  const api = window.NDPortal = {
    ready: d.p,
    name: 'local',
    sdk: false,
    loadingFinished() { loaded = true; },
    gameplayStart() { playing = true; },
    gameplayStop() { playing = false; },
    happyTime() { /* no portal */ },
    interstitial() { return Promise.resolve(); },
    // No ad network here: ND.ads never offers a rewarded ad on 'local', so this is only a safe default
    rewarded() { return Promise.resolve(false); },
    save(key, value) { try { localStorage.setItem(k(key), JSON.stringify(value)); } catch (e) { /* storage blocked */ } return Promise.resolve(); },
    load(key) { try { const raw = localStorage.getItem(k(key)); return Promise.resolve(raw === null ? undefined : JSON.parse(raw)); } catch (e) { return Promise.resolve(undefined); } },
    language: lang,
    // No portal here: nothing forces a language (the game starts in the device language, else English; the player can switch)
    requiredLanguage() { return null; },
    onAd() { return () => {}; },
    onMute() { return () => {}; },
    state() { return { name: 'local', sdk: false, playing, inAd: false, muted: false, loaded }; },
  };
  d.r(api);
})();
