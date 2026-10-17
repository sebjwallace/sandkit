// Sandkit sb-timeline 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A bounded stretch of progress people can scrub back and forth, or play: a transformation from
// start to finish, a year of seasons, the stages of a process. Marks name the moments that matter.
//
//   <sb-timeline min="0" max="1" duration="2"></sb-timeline>
//   timeline.marks = [{ value: 0, label: 'Before' }, { value: 1, label: 'After' }];
//   timeline.addEventListener('sb-change', (e) => { plane.progress = e.detail.value; });
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-timeline';
  const existing = customElements.get('sb-timeline');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-timeline>, so only one can run. Rename one by replacing every "sb-timeline" in its file.`);
    }
    return;
  }

  const CSS = `
    /* The label sits above the slider, so the slider keeps the full width even in a narrow space. */
    .sb-timeline { display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-areas: ". label" "play input" ". marks"; align-items: center; gap: 2px 10px; font-size: 13px; color: var(--sb-text, #1f2933); }
    .sb-timeline__play { grid-area: play; }
    .sb-timeline__input { grid-area: input; }
    .sb-timeline__play { font: inherit; min-width: 72px; padding: 5px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: inherit; cursor: pointer; }
    .sb-timeline__play:hover { background: var(--sb-surface-2, #eef0f3); }
    .sb-timeline__input { width: 100%; margin: 0; accent-color: var(--sb-accent, #2563eb); }
    .sb-timeline__label { grid-area: label; text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
    .sb-timeline__marks { grid-area: marks; position: relative; height: 1.4em; }
    .sb-timeline__mark { position: absolute; top: 0; transform: translateX(-50%); padding: 0 2px; border: 0; background: none; color: var(--sb-muted, #616e7c); font: inherit; font-size: 11px; white-space: nowrap; cursor: pointer; }
    .sb-timeline__mark::before { content: ''; display: block; width: 1px; height: 5px; margin: 0 auto 1px; background: currentColor; }
    .sb-timeline__mark:hover, .sb-timeline__mark--current { color: var(--sb-accent, #2563eb); }
    .sb-timeline__mark:first-child { transform: none; }
    .sb-timeline__mark:first-child::before { margin-left: 0; }
    .sb-timeline__mark:last-child:not(:first-child) { transform: translateX(-100%); }
    .sb-timeline__mark:last-child:not(:first-child)::before { margin-right: 0; }`;

  const TICK_MS = 1000 / 30;
  const DEFAULT_DURATION = 2; // seconds to play from start to end

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function addStyle() {
    if (document.getElementById('sb-timeline-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-timeline-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbTimeline extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['min', 'max', 'step'];

    constructor() {
      super();
      this._value = null; // null until set: then it starts at min
      this._marks = [];
      this._format = null;
      this._timer = null;
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-timeline');
      if (!this._built) this._build();
    }

    disconnectedCallback() {
      this.pause();
    }

    attributeChangedCallback() {
      if (this._built) this._renderRange();
    }

    // ---- Public API ----

    get min() { return Number(this.getAttribute('min') ?? 0); }
    get max() { return Number(this.getAttribute('max') ?? 1); }

    // The current position. Setting it moves the timeline without firing sb-change, which reports
    // the viewer's scrubbing and playing.
    get value() { return this._value ?? this.min; }
    set value(v) {
      this._value = this._clamp(Number(v));
      this._show();
    }

    // Named moments: [{ value, label }]. Clicking one jumps there.
    get marks() { return this._marks; }
    set marks(list) {
      this._marks = list || [];
      if (this._built) this._renderMarks();
    }

    // A function from value to the text shown beside the slider.
    get format() { return this._format; }
    set format(fn) {
      this._format = fn;
      this._show();
    }

    get playing() { return this._timer !== null; }

    // Plays to the end at a steady pace, taking `duration` seconds for the whole range. From the
    // end, it starts again; with `loop`, it keeps going round.
    play() {
      if (this.playing) return;
      if (this.value >= this.max) this._set(this.min);
      let last = performance.now();
      this._timer = setInterval(() => {
        const now = performance.now();
        const step = (this.max - this.min) * ((now - last) / 1000) / this._duration;
        last = now;
        const next = this.value + step;
        if (next >= this.max && this.hasAttribute('loop')) return this._set(this.min + (next - this.max));
        this._set(Math.min(next, this.max));
        if (next >= this.max) this.pause();
      }, TICK_MS);
      this._show();
    }

    pause() {
      clearInterval(this._timer);
      this._timer = null;
      this._show();
    }

    // ---- Building ----

    get _duration() { return Number(this.getAttribute('duration')) || DEFAULT_DURATION; }

    _build() {
      this._built = true;
      this.innerHTML = `
        <button type="button" class="sb-timeline__play" data-action="play"></button>
        <input type="range" class="sb-timeline__input" aria-label="${esc(this.getAttribute('label') || 'Progress')}">
        <span class="sb-timeline__label"></span>
        <div class="sb-timeline__marks"></div>`;
      this._parts = {
        play: this.querySelector('.sb-timeline__play'),
        input: this.querySelector('input'),
        label: this.querySelector('.sb-timeline__label'),
        marks: this.querySelector('.sb-timeline__marks')
      };
      this._parts.play.addEventListener('click', () => (this.playing ? this.pause() : this.play()));
      this._parts.input.addEventListener('input', () => {
        const scrubbedTo = Number(this._parts.input.value); // read before pausing, which redraws the slider
        this.pause();
        this._set(scrubbedTo);
      });
      this._parts.marks.addEventListener('click', (e) => {
        const mark = e.target.closest('[data-value]');
        if (!mark) return;
        this.pause();
        this._set(Number(mark.dataset.value));
      });
      this._renderRange();
      this._renderMarks();
    }

    _renderRange() {
      const { input } = this._parts;
      Object.assign(input, { min: this.min, max: this.max, step: this.getAttribute('step') || 'any' });
      this._value = this._value === null ? null : this._clamp(this._value);
      this._renderMarks();
      this._show();
    }

    _renderMarks() {
      if (!this._built) return;
      const span = this.max - this.min || 1;
      this._parts.marks.innerHTML = this._marks.map((m) => `
        <button type="button" class="sb-timeline__mark" data-value="${m.value}" style="left: ${((m.value - this.min) / span) * 100}%">${esc(m.label)}</button>`).join('');
      this._show();
    }

    // Brings the controls up to date with the current position, without redrawing them, so the
    // slider is never replaced under the pointer.
    _show() {
      if (!this._built) return;
      const { play, input, label, marks } = this._parts;
      play.textContent = this.playing ? '❚❚ Pause' : '▶ Play';
      input.value = String(this.value);
      label.textContent = this._format ? this._format(this.value) : String(Math.round(this.value * 100) / 100);
      input.setAttribute('aria-valuetext', label.textContent);
      for (const mark of marks.children) mark.classList.toggle('sb-timeline__mark--current', Number(mark.dataset.value) === this.value);
    }

    // ---- Changing position ----

    _set(v) {
      this._value = this._clamp(v);
      this._show();
      this.dispatchEvent(new CustomEvent('sb-change', { bubbles: true, detail: { value: this._value } }));
    }

    _clamp(v) {
      return Math.min(this.max, Math.max(this.min, Number.isFinite(v) ? v : this.min));
    }
  }

  customElements.define('sb-timeline', SbTimeline);
})();
