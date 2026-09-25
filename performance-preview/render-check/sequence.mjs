// A finite, moving, 120 Hz state sequence. Generation is outside measured drawing.
// Both renderers read the same joints, cloth momentum, ropes, rain and random seed.
export const sequenceHz = 120, sequenceFrames = 240;
export function makeSequence(N, g) {
  const frames = [], rain = N.scene.parts.map(p => ({ ...p }));
  for (let index = 0; index < sequenceFrames; index++) {
    const t = index / sequenceHz; N.scene.t = t;
    for (const f of g.F) {
      const u = (1 - Math.cos(t * Math.PI * 2 + f.id * Math.PI)) / 2;
      f.x = (f.id ? 170 : -170) + Math.sin(t * 2) * 18; f.dir = f.id ? -1 : 1;
      N.pose.lerp(f.P.stance || N.POSES.stance, f.P.guard || N.POSES.guard, u, f.pose);
      f.solve(1 / sequenceHz); N.updateCloth(f.j, index ? 1 / sequenceHz : 0);
      f.posture = Math.round(u * 45);
    }
    frames.push({ t, fighters: g.F.map(f => ({ x: f.x, posture: f.posture, j: N.cloneJ(f.j),
      ropes: f.ropeList().map(r => r.rope.p.map(p => ({ x: p.x, y: p.y }))) })) });
  }
  function apply(index) {
    index = ((index % frames.length) + frames.length) % frames.length;
    const frame = frames[index], t = frame.t; N.scene.t = t; N.simClock = t;
    N.scene.flashL = 0; N.scene.bolt = null; N.scene.splashes.length = 0;
    for (let i = 0; i < N.scene.parts.length; i++) {
      const p = N.scene.parts[i], start = rain[i];
      p.y = -850 + ((start.y + 850 + start.vy * t) % 880 + 880) % 880;
      p.x = -1500 + ((start.x + 1500 + start.vx * t) % 3000 + 3000) % 3000;
    }
    for (let i = 0; i < g.F.length; i++) {
      const f = g.F[i], s = frame.fighters[i]; f.x = s.x; f.j = s.j; f.posture = s.posture;
      const ropes = f.ropeList(); for (let r = 0; r < ropes.length; r++) ropes[r].rope.p = s.ropes[r];
    }
    g.timer = 60 - t; g.clock = t;
    return frame;
  }
  return { frames, apply };
}

export function cacheCounts(N, g) { return g.F.map(f => N.bakeStats(f.highBakeCache())); }
export function cacheDelta(before, after) {
  return after.map((s, i) => Object.fromEntries(['bakes', 'hits', 'live', 'evictions', 'bornPixels'].map(k => [k, s[k] - before[i][k]])));
}
export function assertPrepared(delta) {
  if (delta.some(s => s.bakes !== 0 || s.live !== 0 || s.evictions !== 0)) throw Error('Prepared run produced, evicted or missed character parts');
}
