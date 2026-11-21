








(function (ND) {
  'use strict';
  const CG = ND.cgAccount = { available: false, signedIn: false, busy: false, prompt: () => Promise.resolve(false) };
  const P = ND.portal;
  if (!P || P.name !== 'crazygames') return;
  ND.portalUserReady = P.ready.then(async () => {
    if (!P.sdk) return;
    const sdk = window.CrazyGames && window.CrazyGames.SDK;
    const user = sdk && sdk.user;
    if (!user || sdk.environment === 'disabled' || user.isUserAccountAvailable !== true) return;
    const LB = ND.leaderboard;

    const tokenFn = () => user.getUserToken();
    let revision = 0;
    const apply = (value) => {
      revision++;
      LB.usePlatformUser(value ? { provider: 'crazygames', name: value.username } : null);
      CG.signedIn = !!LB.nameLocked;

      if (LB.linkAccount) LB.linkAccount(CG.signedIn && typeof user.getUserToken === 'function' ? tokenFn : null, value === null);
    };
    CG.available = true;
    CG.prompt = async () => {
      if (CG.signedIn || CG.busy || typeof user.showAuthPrompt !== 'function') return CG.signedIn;
      CG.busy = true;
      try {
        const u = await user.showAuthPrompt();
        if (u && typeof u.username === 'string') apply(u);
      } catch (e) {                                                                                     }
      finally { CG.busy = false; }
      return CG.signedIn;
    };

    try { if (typeof user.addAuthListener === 'function') user.addAuthListener(apply); } catch (e) {                                          }
    const initialRevision = revision;
    let timer;
    try {
      const value = await Promise.race([
        user.getUser(),
        new Promise((resolve) => { timer = setTimeout(() => resolve(undefined), 2500); }),
      ]);
      if (value !== undefined && revision === initialRevision) apply(value);
    } finally { clearTimeout(timer); }
    if (!CG.signedIn && LB.hallClear) { LB.hallClear(); if (LB.onChange && LB._touch) LB._touch(); }
  }).catch(() => {                                                   });
})(window.ND);
