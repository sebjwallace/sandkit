// Sandkit sb-controls 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Play, pause, step, reset and speed for anything that runs over time. The controls keep the
// clock: while playing they fire sb-tick with how many steps to take, so the sandbox only steps
// its model.
//
//   controls.addEventListener('sb-tick', (e) => { for (let i = 0; i < e.detail.steps; i++) model.step(); render(); });
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-controls';
  const existing = customElements.get('sb-controls');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-controls>, so only one can run. Rename one by replacing every "sb-controls" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .sb-controls__button { font: inherit; font-size: 13px; padding: 5px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); cursor: pointer; }
    .sb-controls__button:hover { background: var(--sb-surface-2, #eef0f3); }
    .sb-controls__play { min-width: 76px; }
    .sb-controls__speed { font-size: 13px; }
    .sb-controls__speed select { font: inherit; margin-left: 4px; padding: 3px 4px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); }
    .sb-controls__label { margin-left: auto; font-variant-numeric: tabular-nums; font-weight: 600; }`;

  // Speeds are steps per second. Fast speeds take several steps per tick.
  const DEFAULT_SPEEDS = [
    { label: 'Slow', value: 2 },
    { label: 'Normal', value: 10 },
    { label: 'Fast', value: 60 },
    { label: 'Turbo', value: 600 }
  ];
  const DEFAULT_SPEED = 10;
  const TICK_MS = 1000 / 30;
  const LONGEST_CATCH_UP_MS = 250; // after a pause in the page (e.g. a hidden tab), don't rush to catch up

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function addStyle() {
    if (document.getElementById('sb-controls-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-controls-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Built once, then updated in place, so the speed menu keeps focus while the label changes.
  class SbControls extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._running = false;
      this._speeds = DEFAULT_SPEEDS;
      this._speed = DEFAULT_SPEED;
      this._label = '';
      this._timer = null;
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-controls');
      if (!this._built) this._build();
      if (this._running) this._startClock();
    }

    disconnectedCallback() {
      this._stopClock();
    }

    // ---- Public API ----

    // Whether the clock is running. Setting it doesn't fire sb-play or sb-pause: those report
    // what the viewer did. A sandbox sets it to false when its model comes to a stop.
    get running() { return this._running; }
    set running(value) {
      this._running = Boolean(value);
      if (this._running) this._startClock();
      else this._stopClock();
      this._update();
    }

    // [{ label, value }], where value is steps per second.
    get speeds() { return this._speeds; }
    set speeds(list) {
      this._speeds = list;
      this._update();
    }

    get speed() { return this._speed; }
    set speed(value) {
      this._speed = Number(value);
      this._update();
    }

    // Text shown at the end of the controls, such as the model's clock.
    get label() { return this._label; }
    set label(text) {
      this._label = text;
      if (this._built) this._parts.label.textContent = text;
    }

    // ---- Building ----

    _build() {
      this._built = true;
      this.innerHTML = `
        <button type="button" class="sb-controls__button sb-controls__play" data-action="play"></button>
        <button type="button" class="sb-controls__button" data-action="step">Step</button>
        <button type="button" class="sb-controls__button" data-action="reset">Reset</button>
        <label class="sb-controls__speed">Speed<select></select></label>
        <span class="sb-controls__label"></span>`;
      this._parts = {
        play: this.querySelector('.sb-controls__play'),
        speed: this.querySelector('select'),
        label: this.querySelector('.sb-controls__label')
      };

      this.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action === 'play') {
          this.running = !this._running;
          this._emit(this._running ? 'sb-play' : 'sb-pause');
        }
        if (action === 'step') this._emit('sb-tick', { steps: 1 });
        if (action === 'reset') this._emit('sb-reset');
      });
      this._parts.speed.addEventListener('change', () => {
        this._speed = Number(this._parts.speed.value);
        this._emit('sb-speed', { value: this._speed });
      });

      this._update();
      this.label = this._label;
    }

    _update() {
      if (!this._built) return;
      const { play, speed } = this._parts;
      play.textContent = this._running ? '❚❚ Pause' : '▶ Play';
      speed.innerHTML = this._speeds.map((s) => `<option value="${esc(s.value)}">${esc(s.label)}</option>`).join('');
      speed.value = String(this._speed);
    }

    // ---- The clock ----

    // Steps build up at the chosen speed; each tick hands over the whole steps owed, so a slow
    // speed ticks now and then with one step, and a fast one ticks often with several.
    _startClock() {
      if (this._timer || !this.isConnected) return;
      this._owed = 0;
      this._last = performance.now();
      this._timer = setInterval(() => this._tick(), TICK_MS);
    }

    _stopClock() {
      clearInterval(this._timer);
      this._timer = null;
    }

    _tick() {
      const now = performance.now();
      this._owed += Math.min(now - this._last, LONGEST_CATCH_UP_MS) / 1000 * this._speed;
      this._last = now;
      const steps = Math.floor(this._owed);
      if (steps < 1) return;
      this._owed -= steps;
      this._emit('sb-tick', { steps });
    }

    _emit(name, detail = {}) {
      this.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
    }
  }

  customElements.define('sb-controls', SbControls);
})();
