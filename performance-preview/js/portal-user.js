// CrazyGames display name only. Server authentication must verify a user token;
// neither a username nor __dangerousUserId is proof of account ownership.
(function (ND) {
  'use strict';
  const P = ND.portal;
  if (!P || P.name !== 'crazygames') return;
  ND.portalUserReady = P.ready.then(async () => {
    if (!P.sdk) return;
    const sdk = window.CrazyGames && window.CrazyGames.SDK;
    const user = sdk && sdk.user;
    if (!user || sdk.environment === 'disabled' || user.isUserAccountAvailable !== true) return;
    let revision = 0;
    const apply = (value) => {
      revision++;
      ND.leaderboard.usePlatformUser(value ? { provider: 'crazygames', name: value.username } : null);
    };
    // Subscribe before reading: a slow initial reply must not overwrite a later sign-in.
    try { if (typeof user.addAuthListener === 'function') user.addAuthListener(apply); } catch (e) { /* Still try the initial user lookup. */ }
    const initialRevision = revision;
    let timer;
    try {
      const value = await Promise.race([
        user.getUser(),
        new Promise((resolve) => { timer = setTimeout(() => resolve(undefined), 2500); }),
      ]);
      if (value !== undefined && revision === initialRevision) apply(value);
    } finally { clearTimeout(timer); }
  }).catch(() => { /* Account APIs must never prevent guest play. */ });
})(window.ND);
