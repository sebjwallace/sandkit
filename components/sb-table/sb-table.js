// Sandkit sb-table 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Rows and columns to sort, search and filter, with the cells that just changed marked, so a
// step of the model shows what it changed rather than only how things now stand.
//
//   table.columns = [{ key: 'name', label: 'Name' }, { key: 'stock', label: 'Stock' }];
//   table.rows = [{ id: 'S1', name: 'North', stock: 37, tone: 'warn' }];
//   table.sort = { key: 'stock', direction: 'descending' };
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-table';
  const existing = customElements.get('sb-table');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-table>, so only one can run. Rename one by replacing every "sb-table" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-table { display: flex; flex-direction: column; font-size: 13px; }
    .sb-table__bar { display: flex; align-items: center; gap: 10px; padding-bottom: 6px; }
    .sb-table__bar[hidden] { display: none; }
    .sb-table__search { flex: 0 1 220px; min-width: 0; padding: 4px 8px; font: inherit; color: inherit; background: var(--sb-surface, #fff); border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); }
    .sb-table__count { color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-table__scroll { flex: 1 1 auto; min-height: 0; overflow: auto; }
    .sb-table__table { width: 100%; border-collapse: collapse; }
    .sb-table__table th, .sb-table__table td { padding: 5px 10px; text-align: left; vertical-align: baseline; border-bottom: 1px solid var(--sb-surface-2, #eef0f3); }
    .sb-table__table thead th { position: sticky; top: 0; z-index: 1; padding: 0; background: var(--sb-surface, #fff); border-bottom-color: var(--sb-border, #d5d9e0); }
    .sb-table__sort { all: unset; box-sizing: border-box; display: block; width: 100%; padding: 5px 10px; color: var(--sb-muted, #616e7c); font-weight: 600; text-align: inherit; white-space: nowrap; cursor: pointer; }
    .sb-table__sort:hover, th[aria-sort] .sb-table__sort { color: var(--sb-text, #1f2933); }
    .sb-table__sort:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -2px; }
    th[aria-sort="ascending"] .sb-table__sort::after { content: ' ▲'; font-size: 0.8em; }
    th[aria-sort="descending"] .sb-table__sort::after { content: ' ▼'; font-size: 0.8em; }
    .sb-table__table .sb-table__cell--number { text-align: right; font-variant-numeric: tabular-nums; }
    .sb-table__row { cursor: pointer; }
    .sb-table__row:hover { background: var(--sb-surface-2, #eef0f3); }
    .sb-table__row[data-tone="good"] { color: var(--sb-good, #3f9142); }
    .sb-table__row[data-tone="warn"] { color: var(--sb-warn, #d69e2e); font-weight: 600; }
    .sb-table__row[data-tone="bad"] { color: var(--sb-bad, #c53030); font-weight: 600; }
    .sb-table__cell--changed { background: color-mix(in srgb, var(--sb-warn, #d69e2e) 20%, transparent); }
    .sb-table__cell[data-change="up"]::after { content: ' ▲'; font-size: 0.75em; }
    .sb-table__cell[data-change="down"]::after { content: ' ▼'; font-size: 0.75em; }
    .sb-table__table .sb-table__cell--highlighted { background: var(--sb-accent-soft, #eaf0ff); box-shadow: inset 0 0 0 1px var(--sb-accent, #2563eb); }
    .sb-table__table .sb-table__row--highlighted { background: var(--sb-accent-soft, #eaf0ff); box-shadow: inset 3px 0 0 var(--sb-accent, #2563eb); }
    .sb-table__empty { padding: 5px 0; color: var(--sb-muted, #616e7c); }`;

  // Fields on a row that steer the table rather than being shown.
  const RESERVED = ['id', 'tone'];
  const NEXT_SORT = { undefined: 'ascending', ascending: 'descending', descending: undefined };

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const isEmpty = (value) => value === null || value === undefined || value === '';

  function addStyle() {
    if (document.getElementById('sb-table-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-table-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Numbers by size, everything else as text, with "Item 2" before "Item 10".
  function compare(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true });
  }

  // A column is numeric when it holds numbers and nothing else, empty cells aside.
  function isNumeric(rows, key) {
    const values = rows.map((row) => row[key]).filter((value) => !isEmpty(value));
    return values.length > 0 && values.every((value) => typeof value === 'number');
  }

  // The cells of each row (matched by id) that differ from before: { [id]: { [key]: previous value } }.
  function changesBetween(before, after) {
    const previous = new Map(before.map((row) => [String(row.id), row]));
    const changes = {};
    for (const row of after) {
      const was = row.id == null ? null : previous.get(String(row.id));
      if (!was) continue;
      for (const key of Object.keys(row)) {
        if (!Object.is(row[key], was[key])) (changes[row.id] ??= {})[key] = was[key];
      }
    }
    return changes;
  }

  class SbTable extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['search', 'empty-text'];

    constructor() {
      super();
      this._rows = [];
      this._snapshot = []; // copies of the rows as last set, so changes show even if the model edits rows in place
      this._changes = {};
      this._columns = null;
      this._sort = null;
      this._filter = null;
      this._query = '';
      this._highlight = {};
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('input', (e) => {
        if (!e.target.matches('.sb-table__search')) return;
        this._query = e.target.value;
        this.render();
      });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-table');
      if (!this.querySelector('.sb-table__scroll')) {
        this.innerHTML = `
          <div class="sb-table__bar">
            <input class="sb-table__search" type="search" placeholder="Search" aria-label="Search the table">
            <span class="sb-table__count" aria-live="polite"></span>
          </div>
          <div class="sb-table__scroll"></div>`;
      }
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // [{ id, tone, ...fields }]: one per row. Setting them marks each cell that changed since the
    // last time, matching rows by id.
    get rows() { return this._rows; }
    set rows(list) {
      this._rows = list || [];
      this._changes = changesBetween(this._snapshot, this._rows);
      this._snapshot = this._rows.map((row) => ({ ...row }));
      this.render();
    }

    // [{ key, label, format, align }]: which fields to show. Defaults to every field of the first row.
    get columns() { return this._columns ?? this._defaultColumns(); }
    set columns(list) {
      this._columns = list;
      this.render();
    }

    // { key, direction: 'ascending' | 'descending' }, or null for the rows' own order.
    get sort() { return this._sort; }
    set sort(value) {
      this._sort = value?.key ? { key: value.key, direction: value.direction === 'descending' ? 'descending' : 'ascending' } : null;
      this.render();
    }

    // (row) => boolean: which rows to show, decided by the sandbox.
    get filter() { return this._filter; }
    set filter(fn) {
      this._filter = fn || null;
      this.render();
    }

    // The search text: rows whose shown text contains it, ignoring case.
    get query() { return this._query; }
    set query(text) {
      this._query = text ?? '';
      this.render();
    }

    // { rows: [id, …], columns: [key, …], cells: [[id, key], …] }: what to point at.
    get highlight() { return this._highlight; }
    set highlight(value) {
      this._highlight = value || {};
      this.render();
    }

    // ---- Rendering ----

    render() {
      const scroll = this.querySelector('.sb-table__scroll');
      if (!this.isConnected || !scroll) return;
      const shown = this._sorted(this._rows.filter((row) => this._isShown(row)));
      this._showBar(shown.length);

      if (!shown.length) {
        const text = this._rows.length ? 'No matching rows.' : this.getAttribute('empty-text') || 'Nothing yet.';
        scroll.innerHTML = `<div class="sb-table__empty">${esc(text)}</div>`;
        return;
      }
      const columns = this.columns.map((c) => ({ ...c, numeric: c.align ? c.align === 'right' : isNumeric(this._rows, c.key) }));
      scroll.innerHTML = `
        <table class="sb-table__table">
          <thead><tr>${columns.map((c) => this._heading(c)).join('')}</tr></thead>
          <tbody>${shown.map((row) => this._row(row, columns)).join('')}</tbody>
        </table>`;
    }

    _showBar(shownCount) {
      const search = this.querySelector('.sb-table__search');
      const count = this.querySelector('.sb-table__count');
      const hasSearch = this.hasAttribute('search');
      const hidden = this._rows.length - shownCount;
      search.hidden = !hasSearch;
      if (search.value !== this._query) search.value = this._query;
      count.textContent = hidden ? `${shownCount} of ${this._rows.length} rows` : '';
      this.querySelector('.sb-table__bar').hidden = !hasSearch && !hidden;
    }

    _heading(column) {
      const sorted = this._sort?.key === column.key ? ` aria-sort="${this._sort.direction}"` : '';
      const number = column.numeric ? ' class="sb-table__cell--number"' : '';
      return `<th scope="col"${number}${sorted}><button type="button" class="sb-table__sort" data-key="${esc(column.key)}">${esc(column.label ?? column.key)}</button></th>`;
    }

    _row(row, columns) {
      const highlighted = this._highlight.rows?.some((id) => String(id) === String(row.id));
      const classes = ['sb-table__row', highlighted && 'sb-table__row--highlighted'].filter(Boolean).join(' ');
      const tone = row.tone ? ` data-tone="${esc(row.tone)}"` : '';
      return `<tr class="${classes}" data-index="${this._rows.indexOf(row)}"${tone}>${columns.map((c) => this._cell(row, c)).join('')}</tr>`;
    }

    _cell(row, column) {
      const value = row[column.key];
      const changes = row.id == null ? null : this._changes[row.id];
      const changed = changes && column.key in changes;
      const classes = [
        'sb-table__cell',
        column.numeric && 'sb-table__cell--number',
        changed && 'sb-table__cell--changed',
        this._isHighlighted(row, column.key) && 'sb-table__cell--highlighted'
      ].filter(Boolean).join(' ');
      const was = changed ? ` title="was ${esc(this._text(changes[column.key], row, column))}"` : '';
      return `<td class="${classes}"${changed ? this._direction(changes[column.key], value) : ''}${was}>${esc(this._text(value, row, column))}</td>`;
    }

    // Numbers that went up or down say which way.
    _direction(before, after) {
      if (typeof before !== 'number' || typeof after !== 'number') return '';
      return ` data-change="${after > before ? 'up' : 'down'}"`;
    }

    _text(value, row, column) {
      return column.format ? column.format(value, row) : value;
    }

    _isHighlighted(row, key) {
      const { columns = [], cells = [] } = this._highlight;
      return columns.includes(key) || cells.some(([id, k]) => String(id) === String(row.id) && k === key);
    }

    _isShown(row) {
      if (this._filter && !this._filter(row)) return false;
      const query = this._query.trim().toLowerCase();
      if (!query) return true;
      return this.columns.some((c) => String(this._text(row[c.key], row, c) ?? '').toLowerCase().includes(query));
    }

    // Empty values go last whichever way the column is sorted; ties keep the rows' own order.
    _sorted(rows) {
      if (!this._sort) return rows;
      const { key, direction } = this._sort;
      const sign = direction === 'descending' ? -1 : 1;
      return [...rows].sort((a, b) => {
        if (isEmpty(a[key]) || isEmpty(b[key])) return isEmpty(a[key]) - isEmpty(b[key]);
        return sign * compare(a[key], b[key]);
      });
    }

    _defaultColumns() {
      return Object.keys(this._rows[0] ?? {}).filter((key) => !RESERVED.includes(key)).map((key) => ({ key }));
    }

    // ---- Interaction ----

    _click(e) {
      const button = e.target.closest('.sb-table__sort');
      if (button) return this._cycleSort(button.dataset.key);
      const tr = e.target.closest('.sb-table__row');
      if (tr) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { row: this._rows[tr.dataset.index] } }));
    }

    // Each click on a heading goes ascending, descending, then back to the rows' own order.
    _cycleSort(key) {
      const current = this._sort?.key === key ? this._sort.direction : undefined;
      const direction = NEXT_SORT[current];
      this.sort = direction ? { key, direction } : null;
    }
  }

  customElements.define('sb-table', SbTable);
})();
