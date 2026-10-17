// Sandkit sb-board 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Things moving through stages, as cards in columns: orders through a warehouse, bills through
// parliament, patients through a ward. Each column counts its cards against its limit, so a
// bottleneck shows, and cards that just moved say where they came from. Dragging a card asks the
// sandbox to move it; the model decides.
//
//   board.columns = [{ id: 'todo', label: 'To do' }, { id: 'doing', label: 'Doing', limit: 2 }];
//   board.items = [{ id: 'A1', label: 'Order 1', column: 'doing' }];
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-board';
  const existing = customElements.get('sb-board');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-board>, so only one can run. Rename one by replacing every "sb-board" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-board { display: block; font-size: 13px; }
    .sb-board__columns { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(150px, 1fr); gap: 8px; overflow-x: auto; }
    .sb-board__column { display: flex; flex-direction: column; min-width: 0; padding: 6px; background: var(--sb-surface-2, #eef0f3); border: 1px solid transparent; border-radius: var(--sb-radius, 8px); }
    .sb-board__column--over { border-color: var(--sb-bad, #c53030); background: color-mix(in srgb, var(--sb-bad, #c53030) 8%, var(--sb-surface-2, #eef0f3)); }
    .sb-board__column--highlighted { border-color: var(--sb-accent, #2563eb); background: var(--sb-accent-soft, #eaf0ff); }
    .sb-board__column--drop { border-style: dashed; border-color: var(--sb-accent, #2563eb); }
    .sb-board__head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 0 4px 6px; font-weight: 600; }
    .sb-board__count { color: var(--sb-muted, #616e7c); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .sb-board__column--over .sb-board__count { color: var(--sb-bad, #c53030); }
    .sb-board__cards { flex: 1 1 auto; display: flex; flex-direction: column; gap: 6px; min-height: 32px; margin: 0; padding: 0; list-style: none; }
    .sb-board__card { padding: 6px 8px; color: var(--sb-text, #1f2933); background: var(--sb-surface, #fff); border: 1px solid var(--sb-border, #d5d9e0); border-left-width: 3px; border-radius: 6px; cursor: pointer; }
    .sb-board[movable] .sb-board__card { cursor: grab; }
    .sb-board__card:hover { border-color: var(--sb-accent, #2563eb); }
    .sb-board__card:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-board__card[data-tone="good"] { border-left-color: var(--sb-good, #3f9142); }
    .sb-board__card[data-tone="warn"] { border-left-color: var(--sb-warn, #d69e2e); }
    .sb-board__card[data-tone="bad"] { border-left-color: var(--sb-bad, #c53030); }
    .sb-board__card--moved, .sb-board__card--new { background: color-mix(in srgb, var(--sb-warn, #d69e2e) 16%, var(--sb-surface, #fff)); }
    .sb-board__card--highlighted { background: var(--sb-accent-soft, #eaf0ff); box-shadow: 0 0 0 2px var(--sb-accent, #2563eb); }
    .sb-board__card--dragging { opacity: 0.4; }
    .sb-board__note, .sb-board__from { display: block; color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-board__from { font-style: italic; }
    .sb-board__empty { color: var(--sb-muted, #616e7c); }`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const same = (a, b) => String(a) === String(b);
  const plural = (n) => `${n} ${n === 1 ? 'item' : 'items'}`;

  function addStyle() {
    if (document.getElementById('sb-board-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-board-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbBoard extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['movable', 'empty-text'];

    constructor() {
      super();
      this._columns = [];
      this._items = [];
      this._previous = null; // each item's column as last set ({ [id]: column }), for marking moves
      this._moves = {};
      this._highlight = {};
      this._dragging = null; // the item being dragged
      this._pointed = null;
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('keydown', (e) => this._key(e));
      this.addEventListener('pointerover', (e) => this._pointAt(this._itemAt(e.target)));
      this.addEventListener('pointerleave', () => this._pointAt(null));
      this.addEventListener('dragstart', (e) => this._dragStart(e));
      this.addEventListener('dragover', (e) => this._dragOver(e));
      this.addEventListener('dragleave', (e) => this._dragLeave(e));
      this.addEventListener('drop', (e) => this._drop(e));
      this.addEventListener('dragend', () => this._dragEnd());
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-board');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // [{ id, label, limit }]: the stages, left to right.
    get columns() { return this._columns; }
    set columns(list) {
      this._columns = list || [];
      this.render();
    }

    // [{ id, label, column, note, tone }]: the cards, in order within each column. Setting them
    // marks each card that moved column, or arrived, since the last time.
    get items() { return this._items; }
    set items(list) {
      const before = this._previous;
      this._items = list || [];
      this._moves = before ? this._movesSince(before) : {};
      this._previous = Object.fromEntries(this._items.map((item) => [item.id, item.column]));
      this.render();
    }

    // { items: [id, …], columns: [id, …] }: what to point at.
    get highlight() { return this._highlight; }
    set highlight(value) {
      this._highlight = value || {};
      this.render();
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      if (!this._columns.length) {
        this.innerHTML = `<div class="sb-board__empty">${esc(this.getAttribute('empty-text') || 'Nothing yet.')}</div>`;
        return;
      }
      const focused = this._itemAt(document.activeElement);
      this.innerHTML = `<div class="sb-board__columns">${this._columns.map((c) => this._column(c)).join('')}</div>`;
      if (focused) this._card(focused.id)?.focus(); // keyboard moves keep their place
    }

    _column(column) {
      const cards = this._items.filter((item) => same(item.column, column.id));
      const over = column.limit != null && cards.length > column.limit;
      const classes = [
        'sb-board__column',
        over && 'sb-board__column--over',
        this._highlight.columns?.some((id) => same(id, column.id)) && 'sb-board__column--highlighted'
      ].filter(Boolean).join(' ');
      const count = column.limit == null ? cards.length : `${cards.length} / ${column.limit}`;
      const label = `${column.label ?? column.id}, ${plural(cards.length)}${over ? `, over its limit of ${column.limit}` : ''}`;
      return `
        <section class="${classes}" data-column="${esc(column.id)}" aria-label="${esc(label)}">
          <div class="sb-board__head"><span>${esc(column.label ?? column.id)}</span><span class="sb-board__count">${esc(count)}</span></div>
          <ul class="sb-board__cards">${cards.map((item) => this._cardHtml(item)).join('')}</ul>
        </section>`;
    }

    _cardHtml(item) {
      const move = this._moves[item.id];
      const classes = [
        'sb-board__card',
        move?.from != null && 'sb-board__card--moved',
        move?.arrived && 'sb-board__card--new',
        this._highlight.items?.some((id) => same(id, item.id)) && 'sb-board__card--highlighted'
      ].filter(Boolean).join(' ');
      const tone = item.tone ? ` data-tone="${esc(item.tone)}"` : '';
      const draggable = this.hasAttribute('movable') ? ' draggable="true"' : '';
      const note = item.note == null ? '' : `<span class="sb-board__note">${esc(item.note)}</span>`;
      return `
        <li class="${classes}" tabindex="0" data-id="${esc(item.id)}"${tone}${draggable}>
          ${esc(item.label ?? item.id)}${note}${this._fromHtml(move)}
        </li>`;
    }

    _fromHtml(move) {
      if (move?.arrived) return '<span class="sb-board__from">new</span>';
      if (move?.from == null) return '';
      const from = this._columns.find((c) => same(c.id, move.from));
      return `<span class="sb-board__from">from ${esc(from?.label ?? move.from)}</span>`;
    }

    // { [id]: { from } } for cards in a new column, { [id]: { arrived: true } } for new cards.
    _movesSince(before) {
      const moves = {};
      for (const item of this._items) {
        if (!(item.id in before)) moves[item.id] = { arrived: true };
        else if (!same(before[item.id], item.column)) moves[item.id] = { from: before[item.id] };
      }
      return moves;
    }

    _card(id) {
      return [...this.querySelectorAll('.sb-board__card')].find((card) => same(card.dataset.id, id));
    }

    _itemAt(node) {
      const card = node?.closest?.('.sb-board__card');
      return card && this.contains(card) ? this._items.find((item) => same(item.id, card.dataset.id)) : null;
    }

    // ---- Interaction ----
    // Moving a card only asks: sb-move tells the sandbox, whose model decides and sets the items.

    _requestMove(item, to) {
      if (!item || to == null || same(item.column, to)) return;
      this.dispatchEvent(new CustomEvent('sb-move', { bubbles: true, detail: { item, from: item.column, to } }));
    }

    _click(e) {
      const item = this._itemAt(e.target);
      if (item) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { item } }));
    }

    // Enter selects; on a movable board, the left and right arrows ask to move to the next column.
    _key(e) {
      const item = this._itemAt(e.target);
      if (!item) return;
      if (e.key === 'Enter') return this._click(e);
      const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!step || !this.hasAttribute('movable')) return;
      e.preventDefault();
      const index = this._columns.findIndex((c) => same(c.id, item.column));
      this._requestMove(item, this._columns[index + step]?.id);
    }

    _pointAt(item) {
      if (item === this._pointed) return;
      this._pointed = item;
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail: item ? { item } : null }));
    }

    _dragStart(e) {
      if (!this.hasAttribute('movable')) return;
      this._dragging = this._itemAt(e.target);
      if (!this._dragging) return;
      e.dataTransfer?.setData('text/plain', String(this._dragging.id)); // some browsers drag nothing without data
      e.target.classList.add('sb-board__card--dragging');
    }

    _dragOver(e) {
      const column = e.target.closest?.('.sb-board__column');
      if (!this._dragging || !column) return;
      e.preventDefault(); // allows the drop
      this._markDrop(column);
    }

    _dragLeave(e) {
      if (!this.contains(e.relatedTarget)) this._markDrop(null);
    }

    _drop(e) {
      const column = e.target.closest?.('.sb-board__column');
      if (!this._dragging || !column) return;
      e.preventDefault();
      const item = this._dragging;
      this._dragEnd();
      this._requestMove(item, this._columns.find((c) => same(c.id, column.dataset.column))?.id);
    }

    _dragEnd() {
      this._dragging = null;
      this._markDrop(null);
      this.querySelector('.sb-board__card--dragging')?.classList.remove('sb-board__card--dragging');
    }

    _markDrop(column) {
      for (const c of this.querySelectorAll('.sb-board__column')) c.classList.toggle('sb-board__column--drop', c === column);
    }
  }

  customElements.define('sb-board', SbBoard);
})();
