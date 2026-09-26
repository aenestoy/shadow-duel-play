// Cooperative match preparation. One bounded job per display frame; no fake countdown or network dependency.
(function (ND) {
  'use strict';
  let panel;
  function ui() {
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'matchLoading'; panel.hidden = true; panel.setAttribute('role', 'status');
    panel.setAttribute('aria-live', 'polite');
    panel.innerHTML = '<div class="match-loading-card"><span aria-hidden="true">影</span><h2>PREPARING DUEL</h2><p>Getting the arena ready</p><progress max="1" value="0" aria-label="Match preparation"></progress></div>';
    document.getElementById('app').appendChild(panel);
    return panel;
  }
  ND.prepare = {
    start(jobs, onDone) {
      const el = ui(), bar = el.querySelector('progress');
      let index = 0, cancelled = false;
      el.hidden = false; el.setAttribute('aria-busy', 'true'); bar.value = 0;
      return {
        step() {
          if (cancelled) return;
          // A false result means the job has more work; it will resume on the next frame.
          try { if (jobs[index]() !== false) index++; }
          catch (error) { console.warn('[ND.prepare] warm-up failed; using live drawing', error); index++; }
          bar.value = index / jobs.length;
          if (index >= jobs.length) { this.cancel(); onDone(); }
        },
        cancel() { cancelled = true; el.hidden = true; el.setAttribute('aria-busy', 'false'); },
      };
    },
  };
})(window.ND);
