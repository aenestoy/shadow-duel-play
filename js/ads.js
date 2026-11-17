


















(function (ND) {
  'use strict';
  const P = ND.portal;
  const now = () => performance.now() / 1000;
  const FIRST_AFTER = 180, GAP = 180;


  const PG_FIRST = 20, PG_GAP = 90;
  const isPG = () => !!P && P.name === 'playgama';

  const stat = (kind) => { try { const s = ND.studioStats; if (s && s.ad) s.ad(kind); } catch (e) {                                       } };


  let adStarted = false;
  if (P && P.onAd) P.onAd((ph) => { if (ph === 'start') adStarted = true; });
  const network = () => !!P && (P.sdk || P.name === 'local');

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
      adStarted = false;
      return P.interstitial().catch(() => {}).then(() => {
        this.busy = false; this.lastAt = now();
        if (network()) stat(adStarted ? 'inter_shown' : 'inter_fail');
        return true;
      });
    },


    rewarded() {
      if (!this.rewardedAvailable() || this.busy) return Promise.resolve(false);
      stat('rew_click');
      this.busy = true;
      P.gameplayStop();
      return P.rewarded().catch(() => false).then((ok) => {
        this.busy = false; this.offered = false; this.lastAt = now();
        stat(ok ? 'rew_done' : 'rew_fail');
        return !!ok;
      });
    },

    offer() { this.offered = true; },

    showOffer(btn) {
      if (!btn) return;
      if (btn.hidden) stat('rew_offer');
      btn.hidden = false;
    },
  };
})(window.ND);
