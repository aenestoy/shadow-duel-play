// A warm-up delay must never consume the sampling window. The interval after
// each measured draw is retained in full, even when it exceeds the target.
export class MeasurementWindow {
  constructor(warmupMs, sampleMs) {
    if (!(warmupMs >= 0) || !Number.isFinite(warmupMs) || !(sampleMs > 0) || !Number.isFinite(sampleMs)) throw Error('Invalid measurement duration');
    this.warmupMs = warmupMs; this.sampleMs = sampleMs;
    this.begin = null; this.previous = null; this.sampleBegin = null;
    this.elapsedMs = 0; this.intervalMs = 0; this.warmupMaxGapMs = 0; this.frames = 0;
    this.recordPrevious = false; this.startsSample = false; this.done = false;
  }
  advance(now) {
    if (this.done) throw Error('Measurement already finished');
    if (!Number.isFinite(now) || (this.previous !== null && now <= this.previous)) throw Error('Frame timestamps did not advance');
    this.begin ??= now;
    this.elapsedMs = now - this.begin;
    this.intervalMs = this.previous === null ? 0 : now - this.previous;
    this.recordPrevious = this.sampleBegin !== null;
    this.startsSample = false;
    if (this.recordPrevious) {
      this.frames++;
      this.done = now - this.sampleBegin >= this.sampleMs;
    } else {
      this.warmupMaxGapMs = Math.max(this.warmupMaxGapMs, this.intervalMs);
      if (this.elapsedMs >= this.warmupMs) {
        this.sampleBegin = now;
        this.startsSample = true;
      }
    }
    this.previous = now;
    return this;
  }
  snapshot() {
    return {
      phase: this.done ? 'complete' : this.sampleBegin === null ? 'warmup' : 'sampling',
      warmupTargetMs: this.warmupMs,
      warmupElapsedMs: this.sampleBegin === null ? this.elapsedMs : this.sampleBegin - this.begin,
      warmupMaxGapMs: this.warmupMaxGapMs,
      sampleTargetMs: this.sampleMs,
      sampleElapsedMs: this.sampleBegin === null ? 0 : this.previous - this.sampleBegin,
      measuredIntervals: this.frames,
    };
  }
}
