// CrazyGames account → Shadow Duel identity.
// The display name comes from getUser(); proof of the account is the signed user token (getUserToken), which only our
// server checks (supabase/functions/cg-session): neither a username nor __dangerousUserId is ever trusted.
//   signed in  → ND.leaderboard.usePlatformUser (name shown, nickname form hidden) + linkAccount(tokenFn): the server
//                verifies the token and the account becomes the identity (titles, Champion colors, Dan, scores follow it)
//   signed out → guest (device identity, recovery code in Settings)
// ND.cgAccount = { available, signedIn, busy, prompt() }: prompt() opens CrazyGames' own sign-in window (showAuthPrompt);
// used by the "Save your progress to your CrazyGames account" buttons and once after a new title (leaderboard.js).
// Any SDK failure keeps guest play: the game never waits on the account.
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
    // the SDK refreshes the 1-hour token itself; it is asked for every time it is needed and never stored
    const tokenFn = () => user.getUserToken();
    let revision = 0;
    const apply = (value) => {
      revision++;
      LB.usePlatformUser(value ? { provider: 'crazygames', name: value.username } : null);
      CG.signedIn = !!LB.nameLocked;
      // value === null: CrazyGames says nobody is signed in (a missing answer is not that)
      if (LB.linkAccount) LB.linkAccount(CG.signedIn && typeof user.getUserToken === 'function' ? tokenFn : null, value === null);
    };
    CG.available = true;
    CG.prompt = async () => {
      if (CG.signedIn || CG.busy || typeof user.showAuthPrompt !== 'function') return CG.signedIn;
      CG.busy = true;
      try {
        const u = await user.showAuthPrompt();
        if (u && typeof u.username === 'string') apply(u);
      } catch (e) { /* userCancelled / showAuthPromptInProgress / userAlreadySignedIn: nothing to do */ }
      finally { CG.busy = false; }
      return CG.signedIn;
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
    if (!CG.signedIn && LB.hallClear) { LB.hallClear(); if (LB.onChange && LB._touch) LB._touch(); }
  }).catch(() => { /* Account APIs must never prevent guest play. */ });
})(window.ND);
