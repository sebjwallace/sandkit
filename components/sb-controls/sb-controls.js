// Sandkit sb-controls · MIT Licence · https://github.com/sebjwallace/sandkit
// Play, pause, step, reset and speed for anything that runs over time.
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

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function addStyle() {
    if (document.getElementById('sb-controls-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-controls-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Built once, then updated in place, so the speed menu keeps focus while the label ticks.
  class SbControls extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._running = false;
      this._speeds = [{ label: '1×', value: 1 }, { label: '2×', value: 2 }, { label: '4×', value: 4 }];
      this._speed = 1;
      this._label = '';
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-controls');
      if (!this._built) this._build();
    }

    get running() { return this._running; }
    set running(value) {
      this._running = Boolean(value);
      this._update();
    }

    get speeds() { return this._speeds; }
    set speeds(list) {
      this._speeds = list;
      this._update();
    }

    get speed() { return this._speed; }
    set speed(value) {
      this._speed = value;
      this._update();
    }

    get label() { return this._label; }
    set label(text) {
      this._label = text;
      if (this._built) this._parts.label.textContent = text;
    }

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
        if (action === 'step') this._emit('sb-step');
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

    _emit(name, detail = {}) {
      this.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
    }
  }

  customElements.define('sb-controls', SbControls);
})();
