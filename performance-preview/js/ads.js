// Shadow Duel — ad policy (ND.ads). All ad calls go through here; SDK details live in the portal bridge.
//
// Rules (docs/PORTAL-SDK-NOTLARI.md, docs/NINJA-DUEL-CRAZYGAMES.md):
// - Interstitials only at natural breaks between matches (end screen → next fight / rematch / menu),
//   never during a fight, the first one only after 3 minutes of actual fighting, then at most one every 3 minutes
//   (portals add their own cooldown on top). No interstitial at a break where a rewarded offer was shown.
// - Rewarded ads only when the player asks; the reward is granted only when the ad completed. With an ad blocker
//   the game still works fully, the offer just gives nothing.
// - While an ad runs the game is frozen (game.js checks ND.portal.inAd), silent (core.js) and input is locked (input.js).
// - On the plain local build (own site, dev server) there is no ad network: no interstitials, no rewarded offers.
//   Add ?ads=1 to exercise the whole flow with the local portal's simulated ad overlay.
(function (ND) {
  'use strict';
  const P = ND.portal;
  const now = () => performance.now() / 1000;
  const FIRST_AFTER = 180, GAP = 180;

  const ads = ND.ads = {
    playSec: 0,           // seconds of real fighting this session
    lastAt: -1e9,         // when the last interstitial (or rewarded) finished
    offered: false,       // a rewarded offer is on screen at this break → skip the interstitial
    busy: false,
    // A real ad network behind the bridge (or ?ads=1 for testing with the simulated local ad)
    get enabled() { return !!P && (P.name !== 'local' || (ND.qs && ND.qs.get('ads') === '1')); },
    rewardedAvailable() { return this.enabled; },
    // game.js calls this every frame with rdt while a match is being fought
    tick(dt) { if (!this.busy) this.playSec += dt; },
    eligible() {
      return this.enabled && !this.busy && !this.offered && this.playSec >= FIRST_AFTER && now() - this.lastAt >= GAP;
    },
    // Natural break between matches: maybe show an interstitial; resolves when the game may go on.
    breakpoint() {
      const skip = !this.eligible();
      this.offered = false;
      if (skip) return Promise.resolve(false);
      this.busy = true;
      P.gameplayStop();
      return P.interstitial().catch(() => {}).then(() => { this.busy = false; this.lastAt = now(); return true; });
    },
    // Rewarded ad; resolves true only when the reward must be granted.
    rewarded() {
      if (!this.rewardedAvailable() || this.busy) return Promise.resolve(false);
      this.busy = true;
      P.gameplayStop();
      return P.rewarded().catch(() => false).then((ok) => { this.busy = false; this.offered = false; this.lastAt = now(); return !!ok; });
    },
    // Mark that the current break shows a rewarded offer (so no forced ad on the same transition)
    offer() { this.offered = true; },
  };
})(window.ND);
