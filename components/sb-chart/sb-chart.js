// Sandkit sb-chart 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Values over time, as lines, with reference lines for thresholds and targets. The latest value
// of each line is marked, so it's always clear where things stand now.
//
//   chart.data = { series: [{ label: 'Stock', values: [80, 64, 51] }], lines: [{ value: 40, label: 'Reorder', tone: 'warn' }] };
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
    .sb-chart__series { fill: none; stroke-width: 1.75; stroke-linejoin: round; }
    .sb-chart__line { stroke-width: 1; stroke-dasharray: 4 3; }
    .sb-chart__line-label { font-size: 10px; }
    .sb-chart__legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 4px; font-size: 12px; }
    .sb-chart__key { display: inline-flex; align-items: center; gap: 6px; }
    .sb-chart__swatch { width: 12px; height: 3px; border-radius: 2px; }
    .sb-chart__latest { font-weight: 600; font-variant-numeric: tabular-nums; }
    .sb-chart__empty { font-size: 12px; color: var(--sb-muted, #616e7c); padding: 12px 0; }
    ${SERIES_TONES.map((tone) => `
    .sb-chart--${tone} { stroke: var(--sb-${tone}, ${FALLBACK[tone]}); }
    .sb-chart__point.sb-chart--${tone}, .sb-chart__swatch.sb-chart--${tone} { fill: var(--sb-${tone}, ${FALLBACK[tone]}); background: var(--sb-${tone}, ${FALLBACK[tone]}); }
    .sb-chart__line-label.sb-chart--${tone} { stroke: none; fill: var(--sb-${tone}, ${FALLBACK[tone]}); }`).join('')}`;

  // Drawing margins, in pixels. The right margin leaves room for reference line labels.
  const MARGIN = { left: 38, right: 72, top: 8, bottom: 18 };
  const DEFAULT_WIDTH = 400;
  const DEFAULT_HEIGHT = 150;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const round = (n) => Math.round(n * 10) / 10; // one decimal place is plenty for pixels
  const formatNumber = (n) => (Math.abs(n) >= 100 || Number.isInteger(n) ? String(Math.round(n)) : n.toFixed(1));

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

  class SbChart extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['heading', 'height'];

    constructor() {
      super();
      this._data = { series: [], lines: [] };
      // Drawn at its real width, so text stays the same size whatever space the chart is given.
      this._resizeObserver = new ResizeObserver(() => this._fitWidth());
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

    // { series: [{ label, values, tone }], lines: [{ value, label, tone }], yMin, yMax, xLabel }
    get data() { return this._data; }
    set data(value) {
      this._data = { series: [], lines: [], ...value };
      this.render();
    }

    // ---- Rendering ----

    _fitWidth() {
      if (this.clientWidth && this.clientWidth !== this._drawnWidth) this.render();
    }

    render() {
      if (!this.isConnected) return;
      const { series, lines, xLabel } = this._data;
      const heading = this.getAttribute('heading');
      const head = heading ? `<div class="sb-chart__heading">${esc(heading)}</div>` : '';
      const length = Math.max(0, ...series.map((s) => s.values.length));
      if (length < 2) {
        this.innerHTML = `${head}<div class="sb-chart__empty">No data yet.</div>`;
        return;
      }

      const width = this._drawnWidth = this.clientWidth || DEFAULT_WIDTH;
      const height = Number(this.getAttribute('height')) || DEFAULT_HEIGHT;
      const { low, high } = range(this._data);
      const right = width - MARGIN.right;
      const x = (i) => MARGIN.left + (i / (length - 1)) * (right - MARGIN.left);
      const y = (v) => MARGIN.top + (1 - (v - low) / (high - low)) * (height - MARGIN.top - MARGIN.bottom);
      const tick = (value) => `<text class="sb-chart__tick" x="${MARGIN.left - 6}" y="${y(value) + 3}" text-anchor="end">${formatNumber(value)}</text>`;
      const axis = Math.min(high, Math.max(low, 0)); // zero, or the nearest edge when zero is out of range

      const axes = `
        <line class="sb-chart__axis" x1="${MARGIN.left}" y1="${y(axis)}" x2="${right}" y2="${y(axis)}"/>
        ${tick(high)}${low < 0 && high > 0 ? tick(0) : ''}${tick(low)}
        ${xLabel ? `<text class="sb-chart__tick" x="${right}" y="${height - 3}" text-anchor="end">${esc(xLabel)}</text>` : ''}`;

      const referenceLines = lines.map((l) => {
        const tone = `sb-chart--${l.tone || 'muted'}`;
        return `
          <line class="sb-chart__line ${tone}" x1="${MARGIN.left}" y1="${y(l.value)}" x2="${right}" y2="${y(l.value)}"/>
          <text class="sb-chart__line-label ${tone}" x="${right + 6}" y="${y(l.value) + 3}">${esc(l.label)}</text>`;
      });

      // Shorter series are right-aligned, so the latest values always line up.
      const drawn = series.map((s, i) => {
        const tone = `sb-chart--${s.tone || SERIES_TONES[i % SERIES_TONES.length]}`;
        const offset = length - s.values.length;
        const points = s.values.map((v, j) => `${round(x(j + offset))},${round(y(v))}`).join(' ');
        const last = s.values.at(-1);
        return `
          <polyline class="sb-chart__series ${tone}" points="${points}"><title>${esc(s.label)}</title></polyline>
          <circle class="sb-chart__point ${tone}" cx="${round(x(length - 1))}" cy="${round(y(last))}" r="3"><title>${esc(s.label)}: ${formatNumber(last)}</title></circle>`;
      });

      this.innerHTML = `${head}
        <svg class="sb-chart__svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(heading || series.map((s) => s.label).join(', '))}">
          ${axes}${referenceLines.join('')}${drawn.join('')}
        </svg>
        ${series.length > 1 ? this._legend(series) : ''}`;
    }

    // Names each line, with its latest value, so several series can be told apart at a glance.
    _legend(series) {
      return `<div class="sb-chart__legend">${series.map((s, i) => `
        <span class="sb-chart__key">
          <span class="sb-chart__swatch sb-chart--${s.tone || SERIES_TONES[i % SERIES_TONES.length]}"></span>
          ${esc(s.label)} <span class="sb-chart__latest">${formatNumber(s.values.at(-1))}</span>
        </span>`).join('')}</div>`;
    }
  }

  customElements.define('sb-chart', SbChart);
})();
