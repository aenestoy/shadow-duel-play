// Shadow Duel — attack telegraph (ND.telegraph): the opponent's blow, read from its real timing.
//   glint  a short flash on the part that will hit (blade tip, staff end, fan edge, chain weight, foot, the throwing /
//          drawing hand), on every device, for any fighter whose opponent is a human player (the CPU in a solo fight,
//          both players in 2P). It grows over LEAD seconds and is brightest on the first step of the move's hit window
//          (ND.ATK[..].active / .hits[0] of the move actually running, variants included; the release of a thrown or
//          shot projectile), then fades within FADE. Subtle on computers, bigger and brighter on phones.
//   ring   Easy assist on a touch screen (ND.touchPrefs.assist): a small ring over the player that shrinks and closes
//          in the middle of the parry window, while the centre is lit exactly while a GUARD press parries: from the
//          player's own window (ND.parryWin: level, Mai's fans) less one 60 Hz frame before the blow, up to the blow.
//          Only for blows a guard can parry (blade and chain; not kicks, projectiles, feints), not during the rally
//          tutorial (it has its own ring) or when the hint prompt already shows SAVUŞTUR for that blow.
// The time to the blow counts simulation steps (1/120 s) as game.js runs them: hit-stop and slow motion included, the
// frame rate plays no part (scripts/telegraph-check.mjs measures it against real parries at 60 / 90 / 120 Hz).
// Drawing: a few lines and arcs in screen space, fixed colour strings, no gradients, nothing allocated per frame (the
// WebGL2 renderer replays these Canvas calls).
(function (ND) {
  'use strict';
  const STEP = 1 / 120;
  const LEAD = 0.26;   // s before the blow the glint starts
  const FADE = 0.07;   // s after the blow starts it fades out
  const RING = 0.34;   // s the ring takes to close (it closes in the middle of the parry window)
  const MARGIN = 1 / 60; // the lit centre starts one 60 Hz frame inside the window (a blade may touch a step late)
  const NO_TELL = { feint: 1, stance: 1 };
  const PROJ = { throw: 1, shoot: 1, gust: 1 };
  // defender states from which a GUARD press guards at once (fighter.js: move / guard / block / parry / recoil /
  // zanshin all turn a held guard into 'guard'); mid-attack, in the air, hurt, dodging… a press would come too late
  const READY = { move: 1, guard: 1, block: 1, parry: 1, recoil: 1, zanshin: 1 };
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  // seconds of simulation until `game` seconds of fight time have passed (hit-stop first, then the slow motion that
  // is left, then normal speed), as game.update advances it
  function realLeft(G, g) {
    let t = 0;
    const hs = Math.max(0, G.hitstopT || 0);
    t += hs;
    let slowLeft = Math.max(0, (G.slowT || 0) - hs);
    const sv = G.slowT > 0 ? (G.slowV != null ? G.slowV : G.slow) : 1;
    if (slowLeft > 0 && sv > 0 && sv < 1) {
      const inSlow = slowLeft * sv;
      if (g <= inSlow) return t + g / sv;
      t += slowLeft; g -= inSlow;
    }
    return t + g;
  }
  // whole steps until fight time `g` has passed at normal speed (the step on which st crosses the window start)
  const stepsLeft = (sec) => Math.max(0, Math.ceil(sec / STEP - 1e-6)) * STEP;

  // what the telegraph shows for attacker `a` against defender `d` (scratch object, reused)
  const P = { on: false, u: 0, glint: 0, x: 0, y: 0, ring: false, lit: false, frac: 0, win: 0, kind: '' };
  function probe(a, d, G) {
    P.on = false; P.glint = 0; P.ring = false; P.lit = false;
    G = G || ND.game;
    if (!a || !d || !G || a.state !== 'atk' || !a.atk || a.dead) return P;
    const A = a.atk, sp = (a.ch && a.ch.spd || 1) * (a.aspd || 1);
    if (NO_TELL[A.kind]) return P;
    let w0, w1;
    if (A.release != null && A.kind === 'throw') { if (a.thrown) return P; w0 = A.release; w1 = A.release; }
    else if (A.active) { const W = A.hits ? A.hits[0] : A.active; w0 = W[0]; w1 = W[1]; }
    else return P;
    const J = a.j, part = A.kind === 'kick' ? J[A.limb || 'ftF'] || J.ftF : A.kind === 'throw' || A.kind === 'shoot' ? J.haB : null;
    let px, py;
    if (part) { px = part.x; py = part.y; }
    else if (A.kind === 'whip' && a.chain && a.chain.init) { const C = a.chain, L = C.n - 1; px = C.x[L]; py = C.y[L]; }
    else if (J.tip && J.hasSword !== false) { px = J.tip.x; py = J.tip.y; }
    else if (J.haF) { px = J.haF.x; py = J.haF.y; }
    else return P;
    P.x = px; P.y = py; P.kind = A.kind;
    if (a.st < w0) {
      // before the blow: real seconds to the step on which it starts
      const u = realLeft(G, stepsLeft((w0 - a.st) / sp));
      P.u = u;
      if (u <= LEAD) {
        P.on = true;
        const k = 1 - u / LEAD;
        P.glint = 0.2 + 0.65 * k * k; // (up to 0.85: the blow's own first step is the brightest)
      }
      // the ring (parryable blows, a defender able to guard): lit while a press still parries, closed mid-window
      if (!PROJ[A.kind] && A.kind !== 'kick' && READY[d.state] && d.onGround && !d.locked) {
        const win = ND.parryWin ? ND.parryWin(d) : 0.17, mid = win / 2;
        P.win = win;
        if (u <= mid + RING) {
          P.on = true; P.ring = true;
          P.frac = clamp((u - mid) / RING, 0, 1);
          P.lit = u <= win - MARGIN;
        }
      }
      return P;
    }
    // the blow has started: the flash fades
    const e = (a.st - w0) / sp;
    if (e > FADE || a.st > w1 + FADE * sp) return P;
    const q = e / FADE;
    P.on = true; P.u = -e; P.glint = 1 - q * q;
    return P;
  }

  // ---------------------------------------------------------------- drawing (screen space)
  const GLINT_HI = '#fff6dc', GLINT_CORE = '#ffffff', RING_OPEN = '#96d2ff', RING_LIT = '#e8f6ff', RING_BG = 'rgba(8,9,16,.7)';
  function drawGlint(ctx, cam, G, big) {
    const x = cam.sx(P.x), y = cam.sy(P.y), px = G.pxr || 1;
    const g = P.glint, k = (big ? 1.35 : 1) * px, a0 = big ? 1 : 0.72;
    const r = (7 + 15 * g) * k, r2 = r * 0.45;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a0 * (0.35 + 0.65 * g);
    ctx.strokeStyle = GLINT_HI; ctx.lineWidth = Math.max(1, 1.6 * k); ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
    ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
    ctx.moveTo(x - r2, y - r2); ctx.lineTo(x + r2, y + r2);
    ctx.moveTo(x - r2, y + r2); ctx.lineTo(x + r2, y - r2);
    ctx.stroke();
    ctx.fillStyle = GLINT_CORE; ctx.globalAlpha = a0 * g;
    ctx.beginPath(); ctx.arc(x, y, (1.6 + 2.6 * g) * k, 0, 6.2832); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  function drawRing(ctx, cam, G, f) {
    const px = G.pxr || 1, k = Math.max(cam.ui || cam.s, 0.55 * px) * 1.05;
    const x = cam.sx(f.x), y = cam.sy(f.y - 215) - 18 * k, r0 = 11 * k;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = RING_BG; ctx.beginPath(); ctx.arc(x, y, r0, 0, 6.2832); ctx.fill();
    ctx.lineWidth = Math.max(1.5, 2.4 * k);
    ctx.strokeStyle = P.lit ? RING_LIT : RING_OPEN;
    if (P.lit) { ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, r0 * 0.55, 0, 6.2832); ctx.fillStyle = RING_LIT; ctx.fill(); }
    ctx.globalAlpha = 0.45 + 0.55 * (1 - P.frac);
    ctx.beginPath(); ctx.arc(x, y, r0 + 30 * k * P.frac, 0, 6.2832); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const T = ND.telegraph = {
    LEAD, FADE, RING, MARGIN, probe,
    // Easy assist ring for the player on a touch screen
    ringFor(f, G) {
      const P0 = ND.touchPrefs;
      if (!(ND.touch && ND.touch.active) || !P0 || P0.assist === false) return false;
      if (f !== G.F[0] || !G.isHuman(f) || (ND.tutor && ND.tutor.on)) return false;
      // the hint prompt (Settings: hints) already draws SAVUŞTUR over this blow (game.js drawPrompts)
      const o = f.opp;
      if (ND.settings && ND.settings.hints && o && o.atk && (o.atk.counter || (G.mode === 'train' && o.atk.kind === 'blade'))) return false;
      return true;
    },
    draw(ctx, G) {
      G = G || ND.game;
      const cam = ND.cam;
      if (!G || !cam || G.phase !== 'fight' || G.mode === 'attract' || !G.isHuman || !G.F) return;
      const big = !!(G.phoneCam || (ND.touch && ND.touch.active));
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (let i = 0; i < 2; i++) {
        const a = G.F[i], d = a && a.opp;
        if (!d || d.dead || !G.isHuman(d)) continue;
        probe(a, d, G);
        if (!P.on) continue;
        if (P.glint > 0.01) drawGlint(ctx, cam, G, big);
        if (P.ring && T.ringFor(d, G)) drawRing(ctx, cam, G, d);
      }
      ctx.restore();
    },
  };
})(window.ND);
