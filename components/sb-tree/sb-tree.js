// Sandkit sb-tree 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A tree of nested things, as in a file system or an outline: branches open and close, lines
// join children to their parent, and everything a viewer can do, the sandbox can do too.
//
//   tree.nodes = [{ id: 'src', label: 'src', children: [{ id: 'src/app.js', label: 'app.js', meta: '2 KB' }] }];
//   tree.expanded = ['src'];
//   tree.reveal('src/app.js');
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-tree';
  const existing = customElements.get('sb-tree');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-tree>, so only one can run. Rename one by replacing every "sb-tree" in its file.`);
    }
    return;
  }

  // Rows are a fixed height, so the guide lines can meet each row at its middle.
  const CSS = `
    .sb-tree { display: block; overflow: auto; font-size: 13px; --sb-tree-row: 26px; --sb-tree-indent: 18px; --sb-tree-line: color-mix(in srgb, var(--sb-muted, #616e7c) 55%, transparent); }
    .sb-tree__group { list-style: none; margin: 0; padding: 0; }
    .sb-tree__group[hidden] { display: none; }
    .sb-tree__group .sb-tree__group { margin-left: calc(var(--sb-tree-indent) / 2); }
    .sb-tree__group .sb-tree__group > .sb-tree__item { position: relative; padding-left: calc(var(--sb-tree-indent) / 2); }
    .sb-tree__group .sb-tree__group > .sb-tree__item::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; border-left: 1px solid var(--sb-tree-line); }
    .sb-tree__group .sb-tree__group > .sb-tree__item:last-child::before { bottom: auto; height: calc(var(--sb-tree-row) / 2); }
    .sb-tree__group .sb-tree__group > .sb-tree__item::after { content: ''; position: absolute; left: 0; top: calc(var(--sb-tree-row) / 2); width: calc(var(--sb-tree-indent) / 2 - 2px); border-top: 1px solid var(--sb-tree-line); }
    .sb-tree__item { outline: none; }
    .sb-tree__row { display: flex; align-items: center; gap: 4px; height: var(--sb-tree-row); padding-right: 8px; border-radius: 4px; cursor: pointer; white-space: nowrap; }
    .sb-tree__row:hover { background: var(--sb-surface-2, #eef0f3); }
    .sb-tree__item:focus-visible > .sb-tree__row { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -2px; }
    .sb-tree__twisty { flex: none; width: 16px; text-align: center; color: var(--sb-muted, #616e7c); font-size: 10px; transition: transform 0.1s; }
    .sb-tree__item[aria-expanded] > .sb-tree__row .sb-tree__twisty::before { content: '▶'; }
    .sb-tree__item[aria-expanded="true"] > .sb-tree__row .sb-tree__twisty { transform: rotate(90deg); }
    .sb-tree__label { overflow: hidden; text-overflow: ellipsis; }
    .sb-tree__meta { margin-left: auto; padding-left: 16px; color: var(--sb-muted, #616e7c); font-size: 12px; font-variant-numeric: tabular-nums; }
    .sb-tree__item[data-tone="good"] > .sb-tree__row .sb-tree__label { color: var(--sb-good, #3f9142); }
    .sb-tree__item[data-tone="warn"] > .sb-tree__row .sb-tree__label { color: var(--sb-warn, #d69e2e); font-weight: 600; }
    .sb-tree__item[data-tone="bad"] > .sb-tree__row .sb-tree__label { color: var(--sb-bad, #c53030); font-weight: 600; }
    .sb-tree__item--selected > .sb-tree__row { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-tree__item--selected > .sb-tree__row .sb-tree__label { font-weight: 600; }
    .sb-tree__item--highlighted > .sb-tree__row { box-shadow: inset 0 0 0 1.5px var(--sb-accent, #2563eb); }
    .sb-tree__item--holds-highlight > .sb-tree__row .sb-tree__label::after { content: ''; display: inline-block; width: 7px; height: 7px; margin-left: 6px; border-radius: 50%; background: var(--sb-accent, #2563eb); vertical-align: middle; }
    .sb-tree__empty { color: var(--sb-muted, #616e7c); }`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const isBranch = (node) => Array.isArray(node.children);

  function addStyle() {
    if (document.getElementById('sb-tree-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-tree-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Every node by its id, with its parent's id, for finding the way to a node.
  function index(nodes, parent = null, found = new Map()) {
    for (const node of nodes) {
      found.set(String(node.id), { node, parent });
      if (isBranch(node)) index(node.children, String(node.id), found);
    }
    return found;
  }

  class SbTree extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['empty-text'];

    constructor() {
      super();
      this._nodes = [];
      this._index = new Map();
      this._expanded = new Set();
      this._selected = null;
      this._highlight = [];
      this._focused = null; // the one item reachable with Tab
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('keydown', (e) => this._key(e));
      this.addEventListener('focusin', (e) => {
        const item = e.target.closest('.sb-tree__item');
        if (!item) return;
        this._focused = item.dataset.id;
        this._rove();
      });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-tree');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // [{ id, label, meta, tone, children: [...] }]. A node with children, even none, is a branch.
    get nodes() { return this._nodes; }
    set nodes(list) {
      this._nodes = list || [];
      this.render();
    }

    // The ids of the open branches. Kept by id when the nodes are set again.
    get expanded() { return [...this._expanded]; }
    set expanded(ids) {
      this._expanded = new Set((ids || []).map(String));
      this._showState();
    }

    // The selected node's id, or null.
    get selected() { return this._selected; }
    set selected(id) {
      this._selected = id == null ? null : String(id);
      this._showState();
    }

    // Ids of the nodes to point at. A highlighted node inside a closed branch marks that branch.
    get highlight() { return this._highlight; }
    set highlight(ids) {
      this._highlight = (ids || []).map(String);
      this._showState();
    }

    expand(id) { this._setOpen(id, true); }
    collapse(id) { this._setOpen(id, false); }
    toggle(id) { this._setOpen(id, !this._expanded.has(String(id))); }

    expandAll() {
      this._expanded = new Set([...this._index].filter(([, { node }]) => isBranch(node)).map(([id]) => id));
      this._showState();
    }

    collapseAll() {
      this._expanded.clear();
      this._showState();
    }

    // Opens every branch on the way to a node, and scrolls it into view.
    reveal(id) {
      for (const ancestor of this._ancestors(String(id))) this._expanded.add(ancestor);
      this._showState();
      this._item(id)?.querySelector('.sb-tree__row').scrollIntoView({ block: 'nearest' });
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      this._index = index(this._nodes);
      if (!this._nodes.length) {
        this.innerHTML = `<div class="sb-tree__empty">${esc(this.getAttribute('empty-text') || 'Nothing here.')}</div>`;
        return;
      }
      this.innerHTML = `<ul class="sb-tree__group" role="tree">${this._nodes.map((n) => this._itemHtml(n, 1)).join('')}</ul>`;
      this._showState();
    }

    _itemHtml(node, level) {
      const branch = isBranch(node);
      const tone = node.tone ? ` data-tone="${esc(node.tone)}"` : '';
      return `
        <li class="sb-tree__item" role="treeitem" data-id="${esc(node.id)}" aria-level="${level}" tabindex="-1"${branch ? ' aria-expanded="false"' : ''}${tone}>
          <div class="sb-tree__row">
            <span class="sb-tree__twisty" aria-hidden="true"></span>
            <span class="sb-tree__label">${esc(node.label ?? node.id)}</span>
            ${node.meta != null ? `<span class="sb-tree__meta">${esc(node.meta)}</span>` : ''}
          </div>
          ${branch ? `<ul class="sb-tree__group" role="group" hidden>${node.children.map((c) => this._itemHtml(c, level + 1)).join('')}</ul>` : ''}
        </li>`;
    }

    // Shows what is open, selected and highlighted, without redrawing, so focus stays put.
    _showState() {
      const holders = new Set(this._highlight.flatMap((id) => this._ancestors(id).filter((a) => !this._expanded.has(a))));
      for (const item of this.querySelectorAll('.sb-tree__item')) {
        const id = item.dataset.id;
        if (item.hasAttribute('aria-expanded')) {
          const open = this._expanded.has(id);
          item.setAttribute('aria-expanded', String(open));
          item.querySelector(':scope > .sb-tree__group').hidden = !open;
        }
        const selected = id === this._selected;
        item.classList.toggle('sb-tree__item--selected', selected);
        item.setAttribute('aria-selected', String(selected));
        item.classList.toggle('sb-tree__item--highlighted', this._highlight.includes(id));
        item.classList.toggle('sb-tree__item--holds-highlight', holders.has(id));
      }
      this._rove();
    }

    // One item takes Tab: the focused one if still visible, else the selected, else the first.
    _rove() {
      const visible = this._visibleItems();
      const focusable = [this._focused, this._selected].map((id) => visible.find((item) => item.dataset.id === id)).find(Boolean) ?? visible[0];
      for (const item of this.querySelectorAll('.sb-tree__item')) item.tabIndex = item === focusable ? 0 : -1;
    }

    // ---- Finding things ----

    _item(id) {
      return [...this.querySelectorAll('.sb-tree__item')].find((item) => item.dataset.id === String(id));
    }

    // The ids of a node's branches, outermost first.
    _ancestors(id) {
      const ancestors = [];
      for (let parent = this._index.get(id)?.parent; parent != null; parent = this._index.get(parent).parent) ancestors.unshift(parent);
      return ancestors;
    }

    // Items whose branches are all open, in the order they appear.
    _visibleItems() {
      return [...this.querySelectorAll('.sb-tree__item')].filter((item) => !item.parentElement.closest('[hidden]'));
    }

    // ---- Interaction ----

    // Opening or closing from outside is quiet; a viewer doing it fires sb-toggle.
    _setOpen(id, open, byViewer = false) {
      const entry = this._index.get(String(id));
      if (!entry || !isBranch(entry.node) || this._expanded.has(String(id)) === open) return;
      if (open) this._expanded.add(String(id));
      else this._expanded.delete(String(id));
      this._showState();
      if (byViewer) this.dispatchEvent(new CustomEvent('sb-toggle', { bubbles: true, detail: { node: entry.node, expanded: open } }));
    }

    _choose(id) {
      this.selected = id;
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { node: this._index.get(id).node } }));
    }

    // The twisty opens and closes; anywhere else on the row selects.
    _click(e) {
      const item = e.target.closest('.sb-tree__item');
      if (!item) return;
      item.focus();
      if (e.target.closest('.sb-tree__twisty') && item.hasAttribute('aria-expanded')) this._setOpen(item.dataset.id, !this._expanded.has(item.dataset.id), true);
      else this._choose(item.dataset.id);
    }

    // The keys of a tree view: up and down move, right opens or goes in, left closes or goes out.
    _key(e) {
      const item = e.target.closest('.sb-tree__item');
      if (!item) return;
      const id = item.dataset.id;
      const visible = this._visibleItems();
      const at = visible.indexOf(item);
      const open = this._expanded.has(id), branch = item.hasAttribute('aria-expanded');
      const moveTo = (target) => target?.focus();
      const firstChild = item.querySelector(':scope > .sb-tree__group > .sb-tree__item');
      const parent = this._index.get(id).parent;
      const actions = {
        ArrowDown: () => moveTo(visible[at + 1]),
        ArrowUp: () => moveTo(visible[at - 1]),
        Home: () => moveTo(visible[0]),
        End: () => moveTo(visible.at(-1)),
        ArrowRight: () => (branch && !open ? this._setOpen(id, true, true) : moveTo(open && firstChild)),
        ArrowLeft: () => (open ? this._setOpen(id, false, true) : parent != null && moveTo(this._item(parent))),
        Enter: () => this._choose(id),
        ' ': () => this._choose(id)
      };
      if (!actions[e.key]) return;
      e.preventDefault();
      actions[e.key]();
    }
  }

  customElements.define('sb-tree', SbTree);
})();
