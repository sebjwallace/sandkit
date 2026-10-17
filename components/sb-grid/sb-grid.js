// Sandkit sb-grid 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A grid of cells coloured by their state or value: a forest burning, cells living and dying,
// heat spreading, seats filling. A legend counts each state, and pointing at one shows where it
// is. Painting reports cells to the sandbox, whose model decides what changes.
//
//   grid.states = { 0: { label: 'Empty', tone: 'muted' }, 1: { label: 'Tree', tone: 'good' }, 2: { label: 'Fire', tone: 'bad' } };
//   grid.cells = [[1, 1, 0], [1, 2, 1]];
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-grid';
  const existing = customElements.get('sb-grid');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-grid>, so only one can run. Rename one by replacing every "sb-grid" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-grid { display: block; font-size: 12px; }
    .sb-grid__canvas { display: block; max-width: 100%; touch-action: none; }
    .sb-grid[paintable] .sb-grid__canvas { cursor: crosshair; }
    .sb-grid__under { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 16px; margin-top: 6px; }
    .sb-grid__legend { display: flex; flex-wrap: wrap; gap: 2px 12px; }
    .sb-grid__key { display: inline-flex; align-items: center; gap: 5px; padding: 0 4px; border-radius: 4px; cursor: default; }
    .sb-grid__key:hover, .sb-grid__key--highlighted { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-grid__swatch { width: 10px; height: 10px; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--sb-border, #d5d9e0); }
    .sb-grid__count { font-weight: 600; font-variant-numeric: tabular-nums; }
    .sb-grid__readout { min-height: 1.4em; color: var(--sb-muted, #616e7c); font-variant-numeric: tabular-nums; }
    .sb-grid__empty { color: var(--sb-muted, #616e7c); }`;

  const TONES = { accent: '#2563eb', good: '#3f9142', warn: '#d69e2e', bad: '#c53030', muted: '#616e7c', text: '#1f2933', 'surface-2': '#eef0f3', surface: '#fff' };
  const MAX_CELL = 24;  // cells never grow beyond this, so a small grid stays small
  const GAP = 1;        // between cells, once they're big enough to show it

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const sameCell = (a, b) => a && b && a.row === b.row && a.column === b.column;

  function addStyle() {
    if (document.getElementById('sb-grid-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-grid-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbGrid extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['paintable', 'mark-changes', 'empty-text'];

    constructor() {
      super();
      this._cells = [];
      this._previous = null; // the cells as last set, for marking changes
      this._changed = [];
      this._states = null;
      this._scale = null;
      this._highlight = {};
      this._pointedState = null; // a legend entry under the pointer
      this._pointedCell = null;
      this._painting = false;
      this._resizeObserver = new ResizeObserver(() => this._fitWidth());
      this._onTheme = () => this._draw();
      this.addEventListener('pointerdown', (e) => this._press(e));
      this.addEventListener('pointermove', (e) => this._move(e));
      this.addEventListener('pointerup', () => { this._painting = false; });
      this.addEventListener('pointerleave', () => {
        this._painting = false;
        this._pointAt(null);
        this._pointAtState(null);
      });
      this.addEventListener('pointerover', (e) => {
        const key = e.target.closest('.sb-grid__key');
        this._pointAtState(key ? key.dataset.state : null);
      });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-grid');
      this._resizeObserver.observe(this);
      document.addEventListener('sb-theme', this._onTheme);
      this.render();
    }

    disconnectedCallback() {
      this._resizeObserver.disconnect();
      document.removeEventListener('sb-theme', this._onTheme);
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // Rows of values, top row first. Setting them again redraws, marking changed cells if asked.
    get cells() { return this._cells; }
    set cells(rows) {
      const before = this._previous;
      this._cells = rows || [];
      this._previous = this._cells.map((row) => [...row]); // a copy, in case the model edits in place
      this._changed = before ? this._differences(before) : [];
      this.render();
    }

    // { [value]: { label, tone, color } }: what each value means and how it's coloured.
    get states() { return this._states; }
    set states(value) {
      this._states = value || null;
      this.render();
    }

    // { min, max, tone }: colours numbers from faint (min) to full (max), as a heat map.
    get scale() { return this._scale; }
    set scale(value) {
      this._scale = value || null;
      this.render();
    }

    // { cells: [[row, column]], rows: [row], columns: [column], states: [value] }: what to point at.
    get highlight() { return this._highlight; }
    set highlight(value) {
      this._highlight = value || {};
      this._draw();
      this._showLegendHighlight();
    }

    // ---- Rendering ----

    get _rows() { return this._cells.length; }
    get _columns() { return Math.max(0, ...this._cells.map((row) => row.length)); }

    render() {
      if (!this.isConnected) return;
      if (!this._rows || !this._columns) {
        this.innerHTML = `<div class="sb-grid__empty">${esc(this.getAttribute('empty-text') || 'Nothing yet.')}</div>`;
        return;
      }
      if (!this.querySelector('.sb-grid__canvas')) {
        this.innerHTML = `
          <canvas class="sb-grid__canvas" role="img"></canvas>
          <div class="sb-grid__under"><div class="sb-grid__legend"></div><div class="sb-grid__readout" aria-live="polite"></div></div>`;
      }
      this._showLegend();
      this._draw();
    }

    _fitWidth() {
      if (this.clientWidth && this.clientWidth !== this._drawnWidth) this._draw();
    }

    // The size of a cell: as large as fits the width, up to a limit.
    _cellSize() {
      const width = this.clientWidth || this._columns * MAX_CELL;
      return Math.max(1, Math.min(MAX_CELL, Math.floor(width / this._columns)));
    }

    // Colours come from the theme, read when drawing so a change of theme is picked up.
    _colour(tone) {
      const value = getComputedStyle(this).getPropertyValue(`--sb-${tone}`).trim();
      return value || TONES[tone] || tone;
    }

    _fillFor(value) {
      if (this._states && value in this._states) {
        const state = this._states[value];
        return { colour: state.color ?? this._colour(state.tone ?? 'muted'), alpha: 1 };
      }
      if (this._scale && typeof value === 'number') {
        const { min = 0, max = 1, tone = 'accent' } = this._scale;
        const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
        return { colour: this._colour(tone), alpha: 0.08 + 0.92 * t };
      }
      return null;
    }

    _draw() {
      const canvas = this.querySelector('.sb-grid__canvas');
      if (!canvas || !this._rows) return;
      const size = this._cellSize();
      const ratio = window.devicePixelRatio || 1;
      const [width, height] = [size * this._columns, size * this._rows];
      this._drawnWidth = this.clientWidth;
      this._size = size;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.setAttribute('aria-label', this._summary());

      const context = canvas.getContext('2d');
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.fillStyle = this._colour('surface-2');
      context.fillRect(0, 0, width, height);
      const gap = size >= 6 ? GAP : 0;
      const shownStates = this._pointedState != null ? [this._pointedState] : (this._highlight.states ?? []).map(String);

      this._cells.forEach((row, r) => row.forEach((value, c) => {
        const fill = this._fillFor(value);
        if (!fill) return;
        // Pointing at a state, or highlighting states, fades every other cell.
        const faded = shownStates.length && !shownStates.includes(String(value));
        context.globalAlpha = fill.alpha * (faded ? 0.15 : 1);
        context.fillStyle = fill.colour;
        context.fillRect(c * size, r * size, size - gap, size - gap);
      }));
      context.globalAlpha = 1;

      const cell = ({ row, column }) => ({ row, column, rows: 1, columns: 1 });
      if (this.hasAttribute('mark-changes')) this._outline(context, this._changed.map(cell), this._colour('text'), 1);
      this._outline(context, this._highlighted(), this._colour('accent'), 2);
      if (this._pointedCell) this._outline(context, [cell(this._pointedCell)], this._colour('text'), 2);
    }

    // Outlines blocks of cells: { row, column, rows, columns }.
    _outline(context, blocks, colour, width) {
      const size = this._size;
      context.strokeStyle = colour;
      context.lineWidth = width;
      for (const b of blocks) context.strokeRect(b.column * size + width / 2, b.row * size + width / 2, b.columns * size - width, b.rows * size - width);
    }

    // Highlighted cells, and whole rows and columns, each as one block.
    _highlighted() {
      const { cells = [], rows = [], columns = [] } = this._highlight;
      return [
        ...cells.map(([row, column]) => ({ row, column, rows: 1, columns: 1 })),
        ...rows.map((row) => ({ row, column: 0, rows: 1, columns: this._columns })),
        ...columns.map((column) => ({ row: 0, column, rows: this._rows, columns: 1 }))
      ];
    }

    _differences(before) {
      const changed = [];
      this._cells.forEach((row, r) => row.forEach((value, c) => {
        if (before[r]?.[c] !== value) changed.push({ row: r, column: c });
      }));
      return changed;
    }

    // ---- Legend and readout ----

    // How many cells hold each value.
    _counts() {
      const counts = new Map();
      for (const row of this._cells) for (const value of row) counts.set(String(value), (counts.get(String(value)) ?? 0) + 1);
      return counts;
    }

    // Each state with its colour and how many cells are in it.
    _showLegend() {
      const legend = this.querySelector('.sb-grid__legend');
      if (!this._states) {
        legend.innerHTML = '';
        return;
      }
      const counts = this._counts();
      legend.innerHTML = Object.entries(this._states).map(([value, state]) => `
        <span class="sb-grid__key" data-state="${esc(value)}">
          <span class="sb-grid__swatch" style="background: ${esc(state.color ?? `var(--sb-${state.tone ?? 'muted'}, ${TONES[state.tone ?? 'muted']})`)}"></span>
          ${esc(state.label ?? value)} <span class="sb-grid__count">${(counts.get(value) ?? 0).toLocaleString('en')}</span>
        </span>`).join('');
      this._showLegendHighlight();
    }

    _showLegendHighlight() {
      const lit = new Set([...(this._highlight.states ?? []).map(String), this._pointedState].filter((s) => s != null));
      for (const key of this.querySelectorAll('.sb-grid__key')) key.classList.toggle('sb-grid__key--highlighted', lit.has(key.dataset.state));
    }

    _summary() {
      const counts = this._counts();
      const parts = this._states ? Object.entries(this._states).map(([value, s]) => `${s.label ?? value}: ${counts.get(value) ?? 0}`) : [];
      return `Grid of ${this._rows} by ${this._columns}${parts.length ? `. ${parts.join(', ')}` : ''}`;
    }

    _describe(cell) {
      const value = this._cells[cell.row][cell.column];
      const meaning = this._states?.[value]?.label ?? value;
      return `Row ${cell.row + 1}, column ${cell.column + 1}: ${meaning}`;
    }

    // ---- Interaction ----

    // The cell under the pointer, or null off the grid.
    _cellAt(e) {
      const canvas = this.querySelector('.sb-grid__canvas');
      if (!canvas || e.target !== canvas) return null;
      const box = canvas.getBoundingClientRect();
      const column = Math.floor((e.clientX - box.left) / this._size), row = Math.floor((e.clientY - box.top) / this._size);
      return row >= 0 && row < this._rows && column >= 0 && column < (this._cells[row]?.length ?? 0) ? { row, column } : null;
    }

    _detail(cell) {
      return { ...cell, value: this._cells[cell.row][cell.column] };
    }

    // Pressing selects a cell, and starts painting when the grid is paintable.
    _press(e) {
      const cell = this._cellAt(e);
      if (!cell) return;
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: this._detail(cell) }));
      if (!this.hasAttribute('paintable')) return;
      this._painting = true;
      this._paintedLast = cell;
      this.dispatchEvent(new CustomEvent('sb-paint', { bubbles: true, detail: this._detail(cell) }));
    }

    // Moving reads out the cell, and while painting, reports each new cell passed over.
    _move(e) {
      const cell = this._cellAt(e);
      this._pointAt(cell);
      if (this._painting && cell && !sameCell(cell, this._paintedLast)) {
        this._paintedLast = cell;
        this.dispatchEvent(new CustomEvent('sb-paint', { bubbles: true, detail: this._detail(cell) }));
      }
    }

    _pointAt(cell) {
      if (sameCell(cell, this._pointedCell) || (!cell && !this._pointedCell)) return;
      this._pointedCell = cell;
      const readout = this.querySelector('.sb-grid__readout');
      if (readout) readout.textContent = cell ? this._describe(cell) : '';
      this._draw();
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail: cell ? this._detail(cell) : null }));
    }

    _pointAtState(state) {
      if (state === this._pointedState) return;
      this._pointedState = state;
      this._draw();
      this._showLegendHighlight();
    }
  }

  customElements.define('sb-grid', SbGrid);
})();
