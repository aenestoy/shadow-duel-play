











(function (ND) {
  'use strict';
  const P = ND.portal;
  const now = () => performance.now() / 1000;
  const FIRST_AFTER = 180, GAP = 180;


  const PG_FIRST = 20, PG_GAP = 90;
  const isPG = () => !!P && P.name === 'playgama';

  const ads = ND.ads = {
    playSec: 0,
    lastAt: -1e9,
    offered: false,
    busy: false,

    get enabled() { return !!P && (P.name !== 'local' || (ND.qs && ND.qs.get('ads') === '1')); },


    rewardedAvailable() { return this.enabled && !(P && P.rewardedAvailable && P.rewardedAvailable() === false); },

    tick(dt) { if (!this.busy) this.playSec += dt; },
    eligible() {
      return this.enabled && !this.busy && !this.offered && this.playSec >= (isPG() ? PG_FIRST : FIRST_AFTER) && now() - this.lastAt >= (isPG() ? PG_GAP : GAP);
    },

    breakpoint() {
      const skip = !this.eligible();
      this.offered = false;
      if (skip) return Promise.resolve(false);
      this.busy = true;
      P.gameplayStop();
      return P.interstitial().catch(() => {}).then(() => { this.busy = false; this.lastAt = now(); return true; });
    },

    rewarded() {
      if (!this.rewardedAvailable() || this.busy) return Promise.resolve(false);
      this.busy = true;
      P.gameplayStop();
      return P.rewarded().catch(() => false).then((ok) => { this.busy = false; this.offered = false; this.lastAt = now(); return !!ok; });
    },

    offer() { this.offered = true; },
  };
})(window.ND);
