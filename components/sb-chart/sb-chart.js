// Sandkit sb-chart 0.1.2 · MIT Licence · https://github.com/sebjwallace/sandkit
// Values over time, as lines, with reference lines for thresholds and targets. The latest value
// of each line is marked, so it's always clear where things stand now. Point anywhere to read the
// values there; mark events in time; bring a line forward; show where a scrubbed history is.
//
//   chart.data = { series: [{ label: 'Stock', values: [80, 64, 51] }], lines: [{ value: 40, label: 'Reorder', tone: 'warn' }] };
//   chart.current = 1;
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-chart';
  const existing = customElements.get('sb-chart');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-chart>, so only one can run. Rename one by replacing every "sb-chart" in its file.`);
    }
    return;
  }

  // Series take these colours in turn; reference lines take the tone they're given.
  const SERIES_TONES = ['accent', 'good', 'warn', 'bad', 'muted'];
  const FALLBACK = { accent: '#2563eb', good: '#3f9142', warn: '#d69e2e', bad: '#c53030', muted: '#616e7c' };

  const CSS = `
    .sb-chart { display: block; }
    .sb-chart__heading { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
    .sb-chart__svg { display: block; overflow: visible; }
    .sb-chart__axis { stroke: var(--sb-border, #d5d9e0); stroke-width: 1; }
    .sb-chart__tick { font-size: 10px; fill: var(--sb-muted, #616e7c); }
    .sb-chart__series { fill: none; stroke-width: 1.75; stroke-linejoin: round; transition: opacity 0.15s; }
    .sb-chart__series--highlighted { stroke-width: 3; }
    .sb-chart__series--faded, .sb-chart__point--faded { opacity: 0.2; }
    .sb-chart__line { stroke-width: 1; stroke-dasharray: 4 3; }
    .sb-chart__line-label { font-size: 10px; }
    .sb-chart__line--highlighted, .sb-chart__mark--highlighted { stroke-width: 2.5; stroke-dasharray: none; }
    .sb-chart__line-label--highlighted, .sb-chart__mark-label--highlighted { font-weight: 700; }
    .sb-chart__mark { stroke: var(--sb-muted, #616e7c); stroke-width: 1; stroke-dasharray: 2 3; }
    .sb-chart__mark-label { font-size: 10px; fill: var(--sb-muted, #616e7c); }
    .sb-chart__cursor { stroke: var(--sb-text, #1f2933); stroke-width: 1.5; }
    .sb-chart__guide { stroke: var(--sb-muted, #616e7c); stroke-width: 1; }
    .sb-chart__readout-box { fill: var(--sb-surface, #fff); stroke: var(--sb-border, #d5d9e0); }
    .sb-chart__readout { font-size: 11px; fill: var(--sb-text, #1f2933); font-variant-numeric: tabular-nums; }
    .sb-chart__readout-head { font-weight: 600; }
    .sb-chart__legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 4px; font-size: 12px; }
    .sb-chart__key { display: inline-flex; align-items: center; gap: 6px; cursor: default; transition: opacity 0.15s; }
    .sb-chart__key--faded { opacity: 0.4; }
    .sb-chart__swatch { width: 12px; height: 3px; border-radius: 2px; }
    .sb-chart__latest { font-weight: 600; font-variant-numeric: tabular-nums; }
    .sb-chart__empty { font-size: 12px; color: var(--sb-muted, #616e7c); padding: 12px 0; }
    ${SERIES_TONES.map((tone) => `
    .sb-chart--${tone} { stroke: var(--sb-${tone}, ${FALLBACK[tone]}); }
    .sb-chart__point.sb-chart--${tone}, .sb-chart__swatch.sb-chart--${tone} { fill: var(--sb-${tone}, ${FALLBACK[tone]}); background: var(--sb-${tone}, ${FALLBACK[tone]}); }
    .sb-chart__line-label.sb-chart--${tone}, .sb-chart__mark-label.sb-chart--${tone} { stroke: none; fill: var(--sb-${tone}, ${FALLBACK[tone]}); }`).join('')}`;

  // Drawing margins, in pixels. The right margin leaves room for reference line labels.
  const MARGIN = { left: 38, right: 72, top: 8, bottom: 18 };
  const MARK_ROOM = 14;       // above the drawing, for event labels
  const X_LABEL_SPACING = 56; // the least room between labels along the bottom
  const READOUT = { charWidth: 6.2, lineHeight: 14, padding: 6, gap: 8 };
  const DEFAULT_WIDTH = 400;
  const DEFAULT_HEIGHT = 150;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const round = (n) => Math.round(n * 10) / 10; // one decimal place is plenty for pixels
  const formatNumber = (n) => (Math.abs(n) >= 100 || Number.isInteger(n) ? String(Math.round(n)) : n.toFixed(1));
  const seriesId = (s) => String(s.id ?? s.label);
  const toneOf = (s, i) => `sb-chart--${s.tone || SERIES_TONES[i % SERIES_TONES.length]}`;

  function addStyle() {
    if (document.getElementById('sb-chart-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-chart-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  const HEADROOM = 1.1;

  // The range to draw. yMin and yMax set the least range to show; data beyond them always widens
  // it, so a line is never cut off. Without them, the range includes zero, with a little headroom.
  function range({ series, lines, yMin, yMax }) {
    const values = series.flatMap((s) => s.values).concat(lines.map((l) => l.value));
    const dataLow = Math.min(...values), dataHigh = Math.max(...values);
    const low = Math.min(yMin ?? Math.min(0, dataLow * HEADROOM), dataLow);
    const high = Math.max(yMax ?? Math.max(0, dataHigh * HEADROOM), dataHigh);
    return { low, high: high > low ? high : low + 1 };
  }

  // A series' value at a position along the chart. Shorter series line up with the latest values,
  // so they have nothing to show at the earliest positions.
  const valueAt = (s, position, length) => s.values[position - (length - s.values.length)];

  class SbChart extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['heading', 'height'];

    constructor() {
      super();
      this._data = { series: [], lines: [], marks: [] };
      this._highlight = [];
      this._current = null;
      this._pointedAt = null;      // the position under the pointer
      this._pointedSeries = null;  // the series under the pointer, by id
      // Drawn at its real width, so text stays the same size whatever space the chart is given.
      this._resizeObserver = new ResizeObserver(() => this._fitWidth());
      this.addEventListener('pointermove', (e) => this._point(e));
      this.addEventListener('pointerover', (e) => this._pointAtSeries(e.target.closest('[data-series]')?.dataset.series ?? null));
      this.addEventListener('pointerleave', () => {
        this._pointAtSeries(null);
        this._pointAt(null);
      });
      this.addEventListener('click', (e) => {
        const position = this._positionAt(e);
        if (position != null) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { position } }));
      });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-chart');
      this._resizeObserver.observe(this);
      this.render();
    }

    disconnectedCallback() {
      this._resizeObserver.disconnect();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // { series: [{ id, label, values, tone }], lines: [{ value, label, tone }], marks: [{ at, label, tone }],
    //   xLabels: [text], yMin, yMax, xLabel }
    get data() { return this._data; }
    set data(value) {
      this._data = { series: [], lines: [], marks: [], ...value };
      this.render();
    }

    // Ids (or labels) of the series to bring forward, the others fading, and labels of reference
    // lines and marks to make stand out.
    get highlight() { return this._highlight; }
    set highlight(ids) {
      this._highlight = (ids || []).map(String);
      this.render();
    }

    // A position along the chart, counting from 0, to mark with a cursor; null for none. The legend
    // then gives the values there.
    get current() { return this._current; }
    set current(position) {
      this._current = position == null ? null : Math.round(Number(position));
      this.render();
    }

    // ---- Rendering ----

    _fitWidth() {
      if (this.clientWidth && this.clientWidth !== this._drawnWidth) this.render();
    }

    render() {
      if (!this.isConnected) return;
      const { series, lines, marks, xLabels, xLabel } = this._data;
      const heading = this.getAttribute('heading');
      const head = heading ? `<div class="sb-chart__heading">${esc(heading)}</div>` : '';
      const length = Math.max(0, ...series.map((s) => s.values.length));
      this._geometry = null;
      if (length < 2) {
        this.innerHTML = `${head}<div class="sb-chart__empty">No data yet.</div>`;
        return;
      }

      const width = this._drawnWidth = this.clientWidth || DEFAULT_WIDTH;
      const top = MARGIN.top + (marks.length ? MARK_ROOM : 0);
      const height = Number(this.getAttribute('height')) || DEFAULT_HEIGHT;
      const { low, high } = range(this._data);
      const right = width - MARGIN.right;
      const x = (i) => MARGIN.left + (i / (length - 1)) * (right - MARGIN.left);
      const y = (v) => top + (1 - (v - low) / (high - low)) * (height - top - MARGIN.bottom);
      this._geometry = { x, y, length, right, height, top };
      const tick = (value) => `<text class="sb-chart__tick" x="${MARGIN.left - 6}" y="${y(value) + 3}" text-anchor="end">${formatNumber(value)}</text>`;
      const axis = Math.min(high, Math.max(low, 0)); // zero, or the nearest edge when zero is out of range

      const axes = `
        <line class="sb-chart__axis" x1="${MARGIN.left}" y1="${y(axis)}" x2="${right}" y2="${y(axis)}"/>
        ${tick(high)}${low < 0 && high > 0 ? tick(0) : ''}${tick(low)}
        ${xLabels?.length ? this._xLabels(xLabels) : xLabel ? `<text class="sb-chart__tick" x="${right}" y="${height - 3}" text-anchor="end">${esc(xLabel)}</text>` : ''}`;

      const lit = (part, item) => (this._highlight.includes(String(item.id ?? item.label)) ? ` sb-chart__${part}--highlighted` : '');
      const referenceLines = lines.map((l) => {
        const tone = `sb-chart--${l.tone || 'muted'}`;
        return `
          <line class="sb-chart__line ${tone}${lit('line', l)}" x1="${MARGIN.left}" y1="${y(l.value)}" x2="${right}" y2="${y(l.value)}"/>
          <text class="sb-chart__line-label ${tone}${lit('line-label', l)}" x="${right + 6}" y="${y(l.value) + 3}">${esc(l.label)}</text>`;
      });

      const events = marks.filter((m) => m.at >= 0 && m.at < length).map((m) => {
        const tone = m.tone ? ` sb-chart--${esc(m.tone)}` : '';
        const anchor = m.at === 0 ? 'start' : m.at === length - 1 ? 'end' : 'middle'; // kept clear of the axes
        return `
          <line class="sb-chart__mark${tone}${lit('mark', m)}" x1="${round(x(m.at))}" y1="${top}" x2="${round(x(m.at))}" y2="${height - MARGIN.bottom}"/>
          <text class="sb-chart__mark-label${tone}${lit('mark-label', m)}" x="${round(x(m.at))}" y="${top - 4}" text-anchor="${anchor}">${esc(m.label)}</text>`;
      });

      // Shorter series are right-aligned, so the latest values always line up.
      const chosen = this._chosenSeries();
      const state = (s) => (!chosen.size ? '' : chosen.has(seriesId(s)) ? 'highlighted' : 'faded');
      const drawn = series.map((s, i) => {
        const tone = toneOf(s, i), mark = state(s);
        const offset = length - s.values.length;
        const points = s.values.map((v, j) => `${round(x(j + offset))},${round(y(v))}`).join(' ');
        const last = s.values.at(-1);
        return `
          <polyline class="sb-chart__series ${tone}${mark ? ` sb-chart__series--${mark}` : ''}" data-series="${esc(seriesId(s))}" points="${points}"><title>${esc(s.label)}</title></polyline>
          <circle class="sb-chart__point ${tone}${mark === 'faded' ? ' sb-chart__point--faded' : ''}" cx="${round(x(length - 1))}" cy="${round(y(last))}" r="3"><title>${esc(s.label)}: ${formatNumber(last)}</title></circle>`;
      });

      this.innerHTML = `${head}
        <svg class="sb-chart__svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(heading || series.map((s) => s.label).join(', '))}">
          ${axes}${referenceLines.join('')}${events.join('')}${drawn.join('')}${this._cursor()}${this._readout()}
        </svg>
        ${series.length > 1 ? this._legend(series, state) : ''}`;
    }

    // Labels along the bottom, as many as fit, always including the latest. Labels line up with
    // the latest positions, as shorter series do.
    _xLabels(labels) {
      const { x, length, right, height } = this._geometry;
      const every = Math.max(1, Math.ceil(length / Math.max(1, Math.floor((right - MARGIN.left) / X_LABEL_SPACING))));
      const offset = length - labels.length;
      return labels.map((label, j) => {
        const position = j + offset;
        // Counting back from the latest, so the latest is always labelled.
        if (position < 0 || (length - 1 - position) % every !== 0) return '';
        const anchor = position === length - 1 ? 'end' : position === 0 ? 'start' : 'middle';
        return `<text class="sb-chart__tick sb-chart__x-label" x="${round(x(position))}" y="${height - 3}" text-anchor="${anchor}">${esc(label)}</text>`;
      }).join('');
    }

    // A cursor at the current position, with each line's value there.
    _cursor() {
      if (this._current == null || this._current < 0 || this._current >= this._geometry.length) return '';
      const { x, height, top } = this._geometry;
      return `<line class="sb-chart__cursor" x1="${round(x(this._current))}" y1="${top}" x2="${round(x(this._current))}" y2="${height - MARGIN.bottom}"/>
        ${this._dots(this._current)}`;
    }

    _dots(position) {
      const { x, y, length } = this._geometry;
      return this._data.series.map((s, i) => {
        const v = valueAt(s, position, length);
        return v == null ? '' : `<circle class="sb-chart__point ${toneOf(s, i)}" cx="${round(x(position))}" cy="${round(y(v))}" r="3.5"/>`;
      }).join('');
    }

    // Where the pointer is: a guide line, each line's value there, and its label along the bottom.
    _readout() {
      const position = this._pointedAt;
      if (position == null) return '';
      const { x, length, right, top, height } = this._geometry;
      const { series, xLabels } = this._data;
      const label = xLabels?.[position - (length - xLabels.length)];
      const rows = series.map((s) => [s.label, valueAt(s, position, length)]).filter(([, v]) => v != null)
        .map(([name, v]) => `${name}: ${formatNumber(v)}`);
      const lines = label != null ? [String(label), ...rows] : rows;
      const boxWidth = Math.max(...lines.map((l) => l.length)) * READOUT.charWidth + 2 * READOUT.padding;
      const boxHeight = lines.length * READOUT.lineHeight + READOUT.padding;
      const at = x(position);
      const left = at + READOUT.gap + boxWidth > right + MARGIN.right ? at - READOUT.gap - boxWidth : at + READOUT.gap;
      const texts = lines.map((line, i) => `<text class="sb-chart__readout${i === 0 && label != null ? ' sb-chart__readout-head' : ''}" x="${round(left + READOUT.padding)}" y="${round(top + (i + 1) * READOUT.lineHeight - 2)}">${esc(line)}</text>`);
      return `<g class="sb-chart__pointed" pointer-events="none">
        <line class="sb-chart__guide" x1="${round(at)}" y1="${top}" x2="${round(at)}" y2="${height - MARGIN.bottom}"/>
        ${this._dots(position)}
        <rect class="sb-chart__readout-box" x="${round(left)}" y="${top}" width="${round(boxWidth)}" height="${boxHeight}" rx="4"/>
        ${texts.join('')}
      </g>`;
    }

    // Names each line, with its latest value (or its value at the cursor), so several series can
    // be told apart at a glance. Pointing at a name brings its line forward.
    _legend(series, state) {
      const { length } = this._geometry;
      const at = this._current != null && this._current >= 0 && this._current < length ? this._current : length - 1;
      return `<div class="sb-chart__legend">${series.map((s, i) => {
        const v = valueAt(s, at, length);
        return `
        <span class="sb-chart__key${state(s) === 'faded' ? ' sb-chart__key--faded' : ''}" data-series="${esc(seriesId(s))}">
          <span class="sb-chart__swatch ${toneOf(s, i)}"></span>
          ${esc(s.label)} <span class="sb-chart__latest">${v == null ? '—' : formatNumber(v)}</span>
        </span>`;
      }).join('')}</div>`;
    }

    // The series highlighted or pointed at. Highlighted ids naming lines or marks don't fade the series.
    _chosenSeries() {
      const ids = new Set(this._data.series.map(seriesId));
      return new Set([...this._highlight, this._pointedSeries].filter((id) => ids.has(id)));
    }

    // ---- Interaction ----

    // The position nearest the pointer, while it's over the drawing; otherwise null.
    _positionAt(e) {
      const svg = this.querySelector('.sb-chart__svg');
      if (!svg || !this._geometry || !svg.contains(e.target)) return null;
      const { length, right } = this._geometry;
      const px = e.clientX - svg.getBoundingClientRect().left;
      if (px < MARGIN.left - 10 || px > right + 10) return null;
      return Math.max(0, Math.min(length - 1, Math.round(((px - MARGIN.left) / (right - MARGIN.left)) * (length - 1))));
    }

    _point(e) {
      this._pointAt(this._positionAt(e));
    }

    // Pointing at a position fires sb-point, so a sandbox can show that moment elsewhere too.
    _pointAt(position) {
      if (position === this._pointedAt) return;
      this._pointedAt = position;
      this.render();
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail: { position } }));
    }

    _pointAtSeries(id) {
      if (id === this._pointedSeries) return;
      this._pointedSeries = id;
      this.render();
    }
  }

  customElements.define('sb-chart', SbChart);
})();
