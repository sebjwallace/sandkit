// Sandkit sb-timeline 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// Events laid out in time: moments and spans in lanes, so what overlapped shows, with a line for
// now that leaves what hasn't happened yet faded. Viewers zoom and pan; setting `view` glides the
// timeline to the stretch the prose is about.
//
//   timeline.lanes = [{ id: 'army', label: 'Army' }, { id: 'navy', label: 'Navy' }];
//   timeline.events = [{ id: 'e1', label: 'Landing', at: 1944.4, lane: 'army' }];
//   timeline.now = 1944;
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
    .sb-timeline { display: block; font-size: 13px; color: var(--sb-text, #1f2933); }
    .sb-timeline__frame { display: grid; grid-template-columns: max-content minmax(0, 1fr); background: var(--sb-surface, #fff); border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); overflow: hidden; user-select: none; }
    .sb-timeline__label { grid-column: 1; display: flex; align-items: center; padding: 0 10px; font-weight: 600; background: var(--sb-surface-2, #eef0f3); border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-timeline__track { grid-column: 2; position: relative; overflow: hidden; border-bottom: 1px solid var(--sb-border, #d5d9e0); cursor: grab; }
    .sb-timeline__label--highlighted, .sb-timeline__track--highlighted { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-timeline__frame--dragging .sb-timeline__track { cursor: grabbing; }
    .sb-timeline__overlay { grid-column: 2; position: relative; overflow: hidden; pointer-events: none; }
    .sb-timeline__grid { position: absolute; z-index: 0; top: 0; bottom: 0; width: 1px; background: var(--sb-border, #d5d9e0); opacity: 0.6; }
    .sb-timeline__now { position: absolute; z-index: 2; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: var(--sb-accent, #2563eb); }
    .sb-timeline[scrubbable] .sb-timeline__now { pointer-events: auto; cursor: ew-resize; }
    .sb-timeline[scrubbable] .sb-timeline__now::after { content: ''; position: absolute; top: 0; bottom: 0; left: -5px; right: -5px; }
    .sb-timeline__now:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 2px; }
    .sb-timeline__tools { grid-column: 1; display: flex; gap: 4px; align-items: center; padding: 4px 6px; background: var(--sb-surface-2, #eef0f3); }
    .sb-timeline__tool { width: 24px; height: 22px; padding: 0; font: 600 14px/1 inherit; color: inherit; background: var(--sb-surface, #fff); border: 1px solid var(--sb-border, #d5d9e0); border-radius: 6px; cursor: pointer; }
    .sb-timeline__tool:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-timeline__axis { grid-column: 2; position: relative; height: 30px; overflow: hidden; }
    .sb-timeline[scrubbable] .sb-timeline__axis { cursor: ew-resize; }
    .sb-timeline__tick { position: absolute; top: 8px; transform: translateX(-50%); color: var(--sb-muted, #616e7c); font-size: 11px; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .sb-timeline__now-label { position: absolute; top: 5px; z-index: 1; transform: translateX(-50%); padding: 1px 6px; color: var(--sb-accent-text, #fff); background: var(--sb-accent, #2563eb); border-radius: 999px; font-size: 11px; font-weight: 600; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .sb-timeline__event { position: absolute; z-index: 1; display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 22px; padding: 0 6px 0 0; white-space: nowrap; border-radius: 4px; cursor: pointer; --sb-timeline-tone: var(--sb-accent, #2563eb); }
    .sb-timeline__event[data-tone="good"] { --sb-timeline-tone: var(--sb-good, #3f9142); }
    .sb-timeline__event[data-tone="warn"] { --sb-timeline-tone: var(--sb-warn, #d69e2e); }
    .sb-timeline__event[data-tone="bad"] { --sb-timeline-tone: var(--sb-bad, #c53030); }
    .sb-timeline__event--point { margin-left: -5px; }
    .sb-timeline__event--point::before { content: ''; flex: none; width: 10px; height: 10px; border-radius: 50%; background: var(--sb-timeline-tone); box-shadow: 0 0 0 2px var(--sb-surface, #fff); }
    .sb-timeline__event--span { min-width: 4px; padding-left: 6px; background: color-mix(in srgb, var(--sb-timeline-tone) 22%, var(--sb-surface, #fff)); border-left: 3px solid var(--sb-timeline-tone); }
    .sb-timeline__event--ongoing { background: linear-gradient(to right, color-mix(in srgb, var(--sb-timeline-tone) 22%, var(--sb-surface, #fff)) var(--sb-timeline-done), color-mix(in srgb, var(--sb-timeline-tone) 8%, var(--sb-surface, #fff)) var(--sb-timeline-done)); }
    .sb-timeline__event--future { opacity: 0.4; }
    .sb-timeline__event:hover { box-shadow: 0 0 0 1px var(--sb-accent, #2563eb); }
    .sb-timeline__event:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-timeline__event--highlighted { opacity: 1; font-weight: 600; box-shadow: 0 0 0 2px var(--sb-accent, #2563eb); background-color: var(--sb-accent-soft, #eaf0ff); }
    .sb-timeline--glide .sb-timeline__event, .sb-timeline--glide .sb-timeline__now, .sb-timeline--glide .sb-timeline__now-label { transition: left 0.45s ease, width 0.45s ease; }
    @media (prefers-reduced-motion: reduce) { .sb-timeline--glide * { transition: none !important; } }
    .sb-timeline__empty { color: var(--sb-muted, #616e7c); }`;

  const ROW = 26;           // height of one row of events in a lane, in pixels
  const CHAR = 7;           // rough width of a character of a label, so packing needs no measuring
  const GAP = 8;            // least room between events sharing a row
  const TICK_SPACING = 90;  // pixels between axis labels, roughly
  const ZOOM_STEP = 1.5;
  const DRAG_THRESHOLD = 4; // pixels a press must move to pan rather than click

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const same = (a, b) => String(a) === String(b);
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const isSpan = (event) => event.end != null && event.end > event.at;
  const endOf = (event) => (isSpan(event) ? event.end : event.at);
  const tidy = (v) => Number(v.toPrecision(12)); // 0.30000000000000004 becomes 0.3

  function addStyle() {
    if (document.getElementById('sb-timeline-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-timeline-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Round steps (1, 2 or 5 times a power of ten) that put about `count` labels across the range.
  function ticks(from, to, count) {
    const raw = (to - from) / Math.max(count, 2);
    const power = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 5, 10].find((m) => m * power >= raw) * power;
    const values = [];
    for (let i = Math.ceil(from / step); i * step <= to; i++) values.push(tidy(i * step));
    return values;
  }

  class SbTimeline extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['scrubbable', 'empty-text'];

    constructor() {
      super();
      this._lanes = [];
      this._events = [];
      this._now = null;
      this._view = null;     // the sandbox's [from, to], or null to fit the events
      this._shown = null;    // the [from, to] in the frame now, after viewers zoom and pan
      this._moved = false;   // whether viewers have moved away from the view
      this._rows = {};       // each event's row within its lane
      this._highlight = {};
      this._format = (v) => String(Math.round(v * 100) / 100);
      this._pointed = null;
      this._dragged = false;
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('keydown', (e) => this._key(e));
      this.addEventListener('pointerdown', (e) => this._press(e));
      this.addEventListener('wheel', (e) => this._wheel(e), { passive: false });
      this.addEventListener('pointerover', (e) => this._pointAt(this._eventAt(e.target)));
      this.addEventListener('pointerleave', () => this._pointAt(null));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-timeline');
      this._resizes = new ResizeObserver(() => this._fit());
      this._resizes.observe(this);
      this.render();
    }

    disconnectedCallback() { this._resizes?.disconnect(); }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // [{ id, label }]: the lanes, top to bottom. With none, every event shares one lane.
    get lanes() { return this._lanes; }
    set lanes(list) {
      this._lanes = list || [];
      this.render();
    }

    // [{ id, label, at, end, lane, note, tone }]: moments, and spans where `end` is given.
    get events() { return this._events; }
    set events(list) {
      this._events = list || [];
      this.render();
    }

    // The present, or null. Events after it are faded; spans running through it show how far along they are.
    get now() { return this._now; }
    set now(value) {
      this._now = value == null ? null : Number(value);
      this.render();
    }

    // [from, to]: the stretch to show. Setting it glides there. Null fits the events.
    get view() { return this._view && [...this._view]; }
    set view(range) {
      this._view = range ? [Number(range[0]), Number(range[1])] : null;
      this.reset();
    }

    // Read only. The [from, to] in the frame now, including viewers' zooming and panning.
    get shown() { return this._shown && [...this._shown]; }

    // A function from a time to the text shown for it, on the axis and elsewhere.
    get format() { return this._format; }
    set format(fn) {
      this._format = fn;
      this.render();
    }

    // { events: [id, …], lanes: [id, …] }: what to point at.
    get highlight() { return this._highlight; }
    set highlight(value) {
      this._highlight = value || {};
      this.render();
    }

    // Glides back to the view, undoing viewers' zooming and panning.
    reset() {
      this._moved = false;
      if (!this.querySelector('.sb-timeline__frame')) return this.render();
      this._pack();
      this._place(this._base(), true);
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      if (!this._events.length) {
        this.innerHTML = `<div class="sb-timeline__empty">${esc(this.getAttribute('empty-text') || 'Nothing yet.')}</div>`;
        this._shown = null;
        return;
      }
      const focused = this._eventAt(document.activeElement);
      const nowFocused = document.activeElement?.classList.contains('sb-timeline__now') && this.contains(document.activeElement);
      const lanes = this._laneList();
      // Measured before rebuilding: measuring the new lanes before they have their heights would
      // shrink the page for a moment, pulling a viewer scrolled to the bottom up with it.
      const width = this._trackWidth();
      this.innerHTML = `
        <div class="sb-timeline__frame">
          ${lanes.map((lane, i) => this._laneHtml(lane, i + 1)).join('')}
          <div class="sb-timeline__overlay" style="grid-row: 1 / span ${lanes.length}">${this._nowHtml()}</div>
          <div class="sb-timeline__tools" style="grid-row: ${lanes.length + 1}">
            <button type="button" class="sb-timeline__tool" data-tool="in" aria-label="Zoom in">+</button>
            <button type="button" class="sb-timeline__tool" data-tool="out" aria-label="Zoom out">−</button>
            <button type="button" class="sb-timeline__tool" data-tool="reset" aria-label="Back to the start">↺</button>
          </div>
          <div class="sb-timeline__axis" style="grid-row: ${lanes.length + 1}"></div>
        </div>`;
      this._pack(width || this._width());
      this._place(this._moved && this._shown ? this._shown : this._base(), false);
      if (focused) this._element(focused.id)?.focus();
      if (nowFocused) this.querySelector('.sb-timeline__now')?.focus(); // keyboard scrubbing keeps its place
    }

    // The lanes to draw: the sandbox's, or one unnamed lane holding everything.
    _laneList() {
      return this._lanes.length ? this._lanes : [{ id: null, label: '' }];
    }

    _eventsIn(lane) {
      return this._lanes.length ? this._events.filter((e) => same(e.lane, lane.id)) : this._events;
    }

    _laneHtml(lane, row) {
      const lit = lane.id != null && this._highlight.lanes?.some((id) => same(id, lane.id)) ? '--highlighted' : '';
      const cls = (name) => `sb-timeline__${name}${lit && ` sb-timeline__${name}${lit}`}`;
      const laneAttr = lane.id == null ? '' : ` data-lane="${esc(lane.id)}"`;
      return `
        <div class="${cls('label')}" style="grid-row: ${row}"${laneAttr}${lane.id == null ? '' : ` data-ref="${esc(lane.id)}"`}>${esc(lane.label ?? lane.id)}</div>
        <div class="${cls('track')}" style="grid-row: ${row}"${laneAttr}>${this._eventsIn(lane).map((e) => this._eventHtml(e)).join('')}</div>`;
    }

    _eventHtml(event) {
      const now = this._now;
      const ongoing = now != null && isSpan(event) && event.at <= now && now < event.end;
      const classes = [
        'sb-timeline__event',
        isSpan(event) ? 'sb-timeline__event--span' : 'sb-timeline__event--point',
        now != null && event.at > now && 'sb-timeline__event--future',
        ongoing && 'sb-timeline__event--ongoing',
        this._highlight.events?.some((id) => same(id, event.id)) && 'sb-timeline__event--highlighted'
      ].filter(Boolean).join(' ');
      const done = ongoing ? ` style="--sb-timeline-done: ${((now - event.at) / (event.end - event.at)) * 100}%"` : '';
      const tone = event.tone ? ` data-tone="${esc(event.tone)}"` : '';
      const when = isSpan(event) ? `${this._format(event.at)} to ${this._format(event.end)}` : this._format(event.at);
      const about = [event.label ?? event.id, when, event.note].filter((part) => part != null).join(', ');
      return `<div class="${classes}" tabindex="0" data-id="${esc(event.id)}" data-ref="${esc(event.id)}"${tone}${done} title="${esc(about)}" aria-label="${esc(about)}">${esc(event.label ?? event.id)}</div>`;
    }

    _nowHtml() {
      if (this._now == null) return '';
      const label = `Now, ${this._format(this._now)}`;
      const focusable = this.hasAttribute('scrubbable') ? ' tabindex="0" role="slider"' : '';
      return `<div class="sb-timeline__now"${focusable} aria-label="${esc(label)}"></div>`;
    }

    // The stretch the sandbox asks for: its view, or else every event (and now) with a margin.
    _base() {
      if (this._view) return this._view;
      const times = this._events.flatMap((e) => [e.at, endOf(e)]).concat(this._now ?? []);
      const from = Math.min(...times), to = Math.max(...times);
      const margin = (to - from) * 0.05 || 1;
      return [from - margin, to + margin];
    }

    _trackWidth() {
      return this.querySelector('.sb-timeline__track')?.clientWidth || 0;
    }

    _width() {
      return this._trackWidth() || 600;
    }

    // Shares out rows within each lane so events and their labels don't overlap at the sandbox's
    // view. Rows stay put while viewers zoom and pan, so nothing jumps under the pointer.
    _pack(width = this._width()) {
      const [from, to] = this._base();
      const px = (v) => ((v - from) / (to - from)) * width;
      this._rows = {};
      for (const lane of this._laneList()) {
        const ends = []; // where each row is taken up to, in pixels
        for (const event of [...this._eventsIn(lane)].sort((a, b) => a.at - b.at)) {
          const start = px(event.at);
          const label = String(event.label ?? event.id).length * CHAR + (isSpan(event) ? 12 : 16);
          let row = ends.findIndex((end) => end + GAP <= start);
          if (row === -1) row = ends.push(0) - 1;
          ends[row] = Math.max(px(endOf(event)), start + label);
          this._rows[event.id] = row;
        }
        const track = this._track(lane);
        if (track) track.style.height = `${Math.max(ends.length, 1) * ROW + 4}px`;
      }
    }

    // Moves everything to show [from, to], gliding there or not.
    _place([from, to], glide) {
      this._shown = [from, to];
      this.classList.toggle('sb-timeline--glide', glide);
      const at = (v) => `${((v - from) / (to - from)) * 100}%`;
      for (const el of this.querySelectorAll('.sb-timeline__event')) {
        const event = this._events.find((e) => same(e.id, el.dataset.id));
        el.style.left = at(event.at);
        el.style.top = `${(this._rows[event.id] ?? 0) * ROW + 4}px`;
        if (isSpan(event)) el.style.width = `${((event.end - event.at) / (to - from)) * 100}%`;
      }
      const values = ticks(from, to, Math.floor(this._width() / TICK_SPACING));
      const overlay = this.querySelector('.sb-timeline__overlay');
      overlay.querySelectorAll('.sb-timeline__grid').forEach((line) => line.remove());
      overlay.insertAdjacentHTML('afterbegin', values.map((v) => `<div class="sb-timeline__grid" style="left: ${at(v)}"></div>`).join(''));
      const nowLabel = this._now == null ? '' : `<span class="sb-timeline__now-label" style="left: ${at(this._now)}">${esc(this._format(this._now))}</span>`;
      this.querySelector('.sb-timeline__axis').innerHTML = values.map((v) => `<span class="sb-timeline__tick" style="left: ${at(v)}">${esc(this._format(v))}</span>`).join('') + nowLabel;
      const now = this.querySelector('.sb-timeline__now');
      if (now) now.style.left = at(this._now);
    }

    // On resizing, rows are shared out again for the new width.
    _fit() {
      if (!this._shown || !this.querySelector('.sb-timeline__frame')) return;
      this._pack();
      this._place(this._shown, false);
    }

    _track(lane) {
      const tracks = [...this.querySelectorAll('.sb-timeline__track')];
      return lane.id == null ? tracks[0] : tracks.find((t) => same(t.dataset.lane, lane.id));
    }

    _element(id) {
      return [...this.querySelectorAll('.sb-timeline__event')].find((el) => same(el.dataset.id, id));
    }

    _eventAt(node) {
      const el = node?.closest?.('.sb-timeline__event');
      return el && this.contains(el) ? this._events.find((e) => same(e.id, el.dataset.id)) : null;
    }

    // ---- Zooming and panning ----
    // Viewers can zoom from a thousandth of the view out to four times it, and pan while the
    // middle stays within it.

    _show(from, to, glide) {
      const [baseFrom, baseTo] = this._base();
      const base = baseTo - baseFrom;
      const span = clamp(to - from, base / 1000, base * 4);
      const middle = clamp((from + to) / 2, baseFrom, baseTo);
      this._moved = true;
      this._place([middle - span / 2, middle + span / 2], glide);
    }

    // Zooms by a factor, keeping the time at `share` of the width (0 left, 1 right) in place.
    _zoomBy(factor, glide, share = 0.5) {
      const [from, to] = this._shown;
      const anchor = from + share * (to - from);
      const span = (to - from) / factor;
      this._show(anchor - share * span, anchor + (1 - share) * span, glide);
    }

    _panBy(pixels) {
      const [from, to] = this._shown;
      const shift = (pixels / this._width()) * (to - from);
      this._show(from - shift, to - shift, false);
    }

    // The time at a pointer's position across the tracks.
    _timeAt(clientX) {
      const box = this.querySelector('.sb-timeline__axis').getBoundingClientRect();
      const [from, to] = this._shown;
      return tidy(from + ((clientX - box.left) / box.width) * (to - from));
    }

    // ---- Interaction ----
    // Moving now only asks: sb-now tells the sandbox, whose model decides and sets `now`.

    _requestNow(value) {
      if (value == null || !Number.isFinite(value)) return;
      this.dispatchEvent(new CustomEvent('sb-now', { bubbles: true, detail: { value } }));
    }

    // On a scrubbable timeline, pressing the now line or the axis drags now; anywhere else, dragging
    // pans. A press that barely moves is left to become a click.
    _press(e) {
      if (e.button !== 0 || !this._shown || e.target.closest('.sb-timeline__tools')) return;
      const scrubbing = this.hasAttribute('scrubbable') && e.target.closest('.sb-timeline__now, .sb-timeline__axis');
      if (!scrubbing && !e.target.closest('.sb-timeline__track')) return;
      if (scrubbing) {
        e.preventDefault();
        this._requestNow(this._timeAt(e.clientX));
      }
      this._dragged = false;
      const start = e.clientX;
      let last = start;
      const move = (m) => {
        if (scrubbing) return this._requestNow(this._timeAt(m.clientX));
        if (!this._dragged && Math.abs(m.clientX - start) < DRAG_THRESHOLD) return;
        this._dragged = true;
        this.querySelector('.sb-timeline__frame')?.classList.add('sb-timeline__frame--dragging');
        this._panBy(m.clientX - last);
        last = m.clientX;
      };
      const stop = () => {
        removeEventListener('pointermove', move);
        removeEventListener('pointerup', stop);
        this.querySelector('.sb-timeline__frame')?.classList.remove('sb-timeline__frame--dragging');
      };
      addEventListener('pointermove', move);
      addEventListener('pointerup', stop);
    }

    // Zooming needs Ctrl or ⌘ (a trackpad pinch sends it), so scrolling the page past the timeline
    // still scrolls the page. A sideways scroll pans.
    _wheel(e) {
      if (!this._shown) return;
      const box = this.querySelector('.sb-timeline__axis').getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        this._zoomBy(Math.exp(-e.deltaY / 200), false, clamp((e.clientX - box.left) / box.width, 0, 1));
      } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        this._panBy(-e.deltaX);
      }
    }

    _click(e) {
      const tool = e.target.closest('.sb-timeline__tool');
      if (tool) {
        if (tool.dataset.tool === 'reset') return this.reset();
        return this._zoomBy(tool.dataset.tool === 'in' ? ZOOM_STEP : 1 / ZOOM_STEP, true);
      }
      if (this._dragged) {
        this._dragged = false;
        return;
      }
      const event = this._eventAt(e.target);
      if (event) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { event } }));
    }

    // Enter selects an event. On the now line, the arrow keys ask to move now to the previous or
    // next moment something starts or ends.
    _key(e) {
      if (e.key === 'Enter' && this._eventAt(e.target)) return this._click(e);
      const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!step || !e.target.classList?.contains('sb-timeline__now')) return;
      e.preventDefault();
      const moments = [...new Set(this._events.flatMap((ev) => [ev.at, endOf(ev)]))].sort((a, b) => a - b);
      this._requestNow(step > 0 ? moments.find((t) => t > this._now) : moments.findLast((t) => t < this._now));
    }

    _pointAt(event) {
      if (event === this._pointed) return;
      this._pointed = event;
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail: event ? { event } : null }));
    }
  }

  customElements.define('sb-timeline', SbTimeline);
})();
