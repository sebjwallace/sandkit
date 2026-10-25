// Sandkit sb-matrix 0.1.2 · MIT Licence · https://github.com/sebjwallace/sandkit
// A matrix, or a vector (a matrix with one column), shown as a block of numbers in brackets, inline
// in a sentence or on its own. Entries can be edited, and rows, columns or cells highlighted and
// coloured, so the numbers can point at what they mean elsewhere in the sandbox.
//
//   <sb-matrix name="A" editable></sb-matrix>
//   matrix.values = [[1, 1], [0, 1]];
//   matrix.tones = { columns: ['good', 'bad'] };
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-matrix';
  const existing = customElements.get('sb-matrix');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-matrix>, so only one can run. Rename one by replacing every "sb-matrix" in its file.`);
    }
    return;
  }

  const TONES = ['accent', 'good', 'warn', 'bad', 'muted'];
  const FALLBACK = { accent: '#2563eb', good: '#3f9142', warn: '#d69e2e', bad: '#c53030', muted: '#616e7c' };

  const CSS = `
    .sb-matrix { display: inline-flex; align-items: center; gap: 0.4em; vertical-align: middle; margin: 0.15em 0; color: var(--sb-text, #1f2933); font-variant-numeric: tabular-nums; }
    .sb-matrix__name { font-style: italic; font-weight: 600; }
    .sb-matrix__grid { position: relative; display: inline-grid; gap: 0.1em 0.5em; padding: 0.2em 0.55em; }
    .sb-matrix__grid::before, .sb-matrix__grid::after { content: ''; position: absolute; top: 0; bottom: 0; width: 0.35em; border: 2px solid currentColor; }
    .sb-matrix__grid::before { left: 0; border-right: 0; }
    .sb-matrix__grid::after { right: 0; border-left: 0; }
    .sb-matrix__cell { min-width: 1.6em; padding: 0.05em 0.2em; border-radius: 4px; text-align: center; font-family: ui-monospace, Menlo, Consolas, monospace; font-weight: 600; }
    .sb-matrix__cell--highlighted { background: var(--sb-accent-soft, #eaf0ff); box-shadow: 0 0 0 1px var(--sb-accent, #2563eb); }
    .sb-matrix__input { width: 3.6em; padding: 0.15em 0.2em; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 4px; background: var(--sb-bg, #f5f6f8); color: inherit; font: inherit; text-align: center; }
    .sb-matrix__input:focus { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 0; }
    ${TONES.map((tone) => `.sb-matrix--${tone} { color: var(--sb-${tone}, ${FALLBACK[tone]}); }`).join('\n    ')}`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // Numbers as people write them: a true minus sign, and no more than two decimal places.
  function formatNumber(n) {
    const rounded = Math.round(Number(n) * 100) / 100 || 0;
    return rounded < 0 ? `−${-rounded}` : String(rounded);
  }

  function addStyle() {
    if (document.getElementById('sb-matrix-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-matrix-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // A flat list of numbers is a vector: one column.
  const toRows = (values) => (values || []).map((entry) => (Array.isArray(entry) ? [...entry] : [entry]));

  class SbMatrix extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['name', 'editable', 'step'];

    constructor() {
      super();
      this._rows = [];
      this._tones = {};
      this._highlight = {};
      this.addEventListener('input', (e) => this._onInput(e));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-matrix');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // Rows of numbers: [[1, 0], [0, 1]]. A flat list, such as [2, 1], is a column vector.
    // Setting the values it already has does nothing, so a field being typed in keeps its focus
    // when a sandbox passes the edited values straight back.
    get values() { return this._rows.map((row) => [...row]); }
    set values(values) {
      const rows = toRows(values);
      if (JSON.stringify(rows) === JSON.stringify(this._rows)) return;
      this._rows = rows;
      this.render();
    }

    // Colours for whole rows or columns: { rows: [tone, …], columns: [tone, …] }. Columns win.
    get tones() { return this._tones; }
    set tones(value) {
      this._tones = value || {};
      this.render();
    }

    // What to point at: { rows: [indexes], columns: [indexes], cells: [[row, column], …] }.
    get highlight() { return this._highlight; }
    set highlight(value) {
      this._highlight = value || {};
      this.render();
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      const name = this.getAttribute('name');
      const columns = Math.max(1, ...this._rows.map((row) => row.length));
      this.setAttribute('role', 'group');
      this.setAttribute('aria-label', name ? `Matrix ${name}` : 'Matrix');
      this.innerHTML = `
        ${name ? `<span class="sb-matrix__name">${esc(name)}</span><span aria-hidden="true">=</span>` : ''}
        <span class="sb-matrix__grid" style="grid-template-columns: repeat(${columns}, auto)">
          ${this._rows.flatMap((row, r) => row.map((value, c) => this._cell(value, r, c))).join('')}
        </span>`;
    }

    _cell(value, row, column) {
      const classes = ['sb-matrix__cell'];
      const tone = this._tones.columns?.[column] ?? this._tones.rows?.[row];
      if (TONES.includes(tone)) classes.push(`sb-matrix--${tone}`);
      if (this._isHighlighted(row, column)) classes.push('sb-matrix__cell--highlighted');
      const label = `row ${row + 1}, column ${column + 1}`;
      const content = this.hasAttribute('editable')
        ? `<input class="sb-matrix__input" type="number" step="${esc(this.getAttribute('step') || 'any')}" value="${value}" data-row="${row}" data-column="${column}" aria-label="${label}">`
        : `<span aria-label="${label}: ${formatNumber(value)}">${formatNumber(value)}</span>`;
      return `<span class="${classes.join(' ')}">${content}</span>`;
    }

    _isHighlighted(row, column) {
      const { rows = [], columns = [], cells = [] } = this._highlight;
      return rows.includes(row) || columns.includes(column) || cells.some(([r, c]) => r === row && c === column);
    }

    // ---- Editing ----

    // Entries update in place as they are typed, so the input keeps its focus. A half-typed entry
    // that isn't a number yet (such as "-") is left alone until it is one.
    _onInput(e) {
      const input = e.target.closest('.sb-matrix__input');
      if (!input || input.value.trim() === '' || !Number.isFinite(Number(input.value))) return;
      const row = Number(input.dataset.row), column = Number(input.dataset.column), value = Number(input.value);
      this._rows[row][column] = value;
      this.dispatchEvent(new CustomEvent('sb-change', { bubbles: true, detail: { row, column, value, values: this.values } }));
    }
  }

  customElements.define('sb-matrix', SbMatrix);
})();
