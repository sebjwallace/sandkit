// Sandkit sb-chart · MIT Licence · https://github.com/sebjwallace/sandkit
// A line chart of values over time, with optional reference lines (thresholds, targets).
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

  const CSS = `
    .sb-chart { display: block; }
    .sb-chart__heading { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
    .sb-chart__svg { width: 100%; height: auto; display: block; }
    .sb-chart__axis { stroke: var(--sb-border, #d5d9e0); stroke-width: 1; }
    .sb-chart__tick { font-size: 10px; fill: var(--sb-muted, #616e7c); }
    .sb-chart__series { fill: none; stroke: var(--sb-accent, #2563eb); stroke-width: 1.5; }
    .sb-chart__series--1 { stroke: var(--sb-good, #3f9142); }
    .sb-chart__series--2 { stroke: var(--sb-warn, #d69e2e); }
    .sb-chart__line { stroke: var(--sb-bad, #c53030); stroke-width: 1; stroke-dasharray: 4 3; }
    .sb-chart__line-label { font-size: 10px; fill: var(--sb-bad, #c53030); }
    .sb-chart__line--1 { stroke: var(--sb-muted, #616e7c); }
    .sb-chart__line-label--1 { fill: var(--sb-muted, #616e7c); }
    .sb-chart__empty { font-size: 12px; color: var(--sb-muted, #616e7c); padding: 12px 0; }`;

  // Drawing area, in SVG units. The right margin leaves room for reference line labels.
  const WIDTH = 400, HEIGHT = 150;
  const LEFT = 34, RIGHT = 70, TOP = 8, BOTTOM = 18;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function addStyle() {
    if (document.getElementById('sb-chart-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-chart-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbChart extends HTMLElement {
    static origin = ORIGIN;

    static observedAttributes = ['heading'];

    constructor() {
      super();
      this._data = { series: [], lines: [] };
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-chart');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    get data() { return this._data; }
    set data(value) {
      this._data = { series: [], lines: [], ...value };
      this.render();
    }

    render() {
      if (!this.isConnected) return;
      const { series, lines, yMax, xLabel } = this._data;
      const heading = this.getAttribute('heading');
      const head = heading ? `<div class="sb-chart__heading">${esc(heading)}</div>` : '';
      const length = Math.max(0, ...series.map((s) => s.values.length));

      if (length < 2) {
        this.innerHTML = `${head}<div class="sb-chart__empty">No data yet.</div>`;
        return;
      }

      const top = yMax || Math.max(1, ...series.flatMap((s) => s.values), ...lines.map((l) => l.value)) * 1.1;
      const x = (i) => LEFT + (i / (length - 1)) * (WIDTH - LEFT - RIGHT);
      const y = (v) => TOP + (1 - v / top) * (HEIGHT - TOP - BOTTOM);
      const right = WIDTH - RIGHT;

      const axes = `
        <line class="sb-chart__axis" x1="${LEFT}" y1="${y(0)}" x2="${right}" y2="${y(0)}"/>
        <text class="sb-chart__tick" x="${LEFT - 4}" y="${y(0) + 3}" text-anchor="end">0</text>
        <text class="sb-chart__tick" x="${LEFT - 4}" y="${y(top) + 8}" text-anchor="end">${Math.round(top)}</text>
        ${xLabel ? `<text class="sb-chart__tick" x="${right}" y="${HEIGHT - 4}" text-anchor="end">${esc(xLabel)}</text>` : ''}`;

      const referenceLines = lines.map((l, i) => `
        <line class="sb-chart__line sb-chart__line--${i}" x1="${LEFT}" y1="${y(l.value)}" x2="${right}" y2="${y(l.value)}"/>
        <text class="sb-chart__line-label sb-chart__line-label--${i}" x="${right + 4}" y="${y(l.value) + 3}">${esc(l.label)}</text>`);

      // Shorter series are right-aligned, so the latest values always line up.
      const polylines = series.map((s, i) => {
        const offset = length - s.values.length;
        const points = s.values.map((v, j) => `${x(j + offset).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
        return `<polyline class="sb-chart__series sb-chart__series--${i}" points="${points}"><title>${esc(s.label)}</title></polyline>`;
      });

      this.innerHTML = `${head}
        <svg class="sb-chart__svg" viewBox="0 0 ${WIDTH} ${HEIGHT}">
          ${axes}${referenceLines.join('')}${polylines.join('')}
        </svg>`;
    }
  }

  customElements.define('sb-chart', SbChart);
})();
