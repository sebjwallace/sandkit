// Sandkit sb-log 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A stream of things that happened, in the order they happened. Domain-agnostic: the sandbox
// decides what an entry says; the log shows the stream and lets people look into it.
//
//   <sb-log limit="200" order="oldest-first"></sb-log>
//   log.columns = [{ key: 'topic', label: 'Topic' }];
//   log.append({ time: '12:00:01', text: 'OrderPlaced', tone: 'good', fields: { topic: 'orders' }, detail: { id: 42 } });
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-log';
  const existing = customElements.get('sb-log');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-log>, so only one can run. Rename one by replacing every "sb-log" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-log { display: block; overflow-y: auto; scroll-padding-top: 28px; font-size: 12px; }
    .sb-log__list { display: grid; list-style: none; margin: 0; padding: 0; column-gap: 12px; }
    .sb-log__head, .sb-log__entry { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; }
    .sb-log__head { position: sticky; top: 0; padding: 4px 0; background: var(--sb-surface, #fff); color: var(--sb-muted, #616e7c); font-weight: 600; border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-log__entry { padding: 3px 0; border-bottom: 1px solid var(--sb-surface-2, #eef0f3); cursor: default; }
    .sb-log__entry[data-has-detail] { cursor: pointer; }
    .sb-log__entry[data-has-detail]:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -2px; }
    .sb-log__entry--selected { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-log__time { color: var(--sb-muted, #616e7c); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .sb-log__field { white-space: nowrap; }
    .sb-log__text { min-width: 0; }
    .sb-log__entry[data-has-detail] .sb-log__text::before { content: '▸ '; color: var(--sb-muted, #616e7c); }
    .sb-log__entry[aria-expanded="true"] .sb-log__text::before { content: '▾ '; }
    .sb-log__entry[data-tone="good"] .sb-log__text { color: var(--sb-good, #3f9142); }
    .sb-log__entry[data-tone="warn"] .sb-log__text { color: var(--sb-warn, #d69e2e); font-weight: 600; }
    .sb-log__entry[data-tone="bad"] .sb-log__text { color: var(--sb-bad, #c53030); font-weight: 600; }
    .sb-log__detail { grid-column: 1 / -1; margin: 4px 0 2px; padding: 6px 8px; overflow-x: auto; border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); font: 11px/1.4 ui-monospace, Menlo, Consolas, monospace; }
    .sb-log__empty { color: var(--sb-muted, #616e7c); }`;

  const DEFAULT_LIMIT = 100;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const formatDetail = (detail) => (typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2));

  function addStyle() {
    if (document.getElementById('sb-log-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-log-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbLog extends HTMLElement {
    static origin = ORIGIN;

    static observedAttributes = ['limit', 'order', 'empty-text'];

    constructor() {
      super();
      this._entries = [];
      this._columns = [];
      this._expanded = new WeakSet(); // entries whose detail is open, kept across re-renders
      this._selected = null;
      this._shown = [];
      this.addEventListener('click', (e) => this._activate(e.target));
      this.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.sb-log__entry')) {
          e.preventDefault();
          this._activate(e.target);
        }
      });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-log');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // All entries, oldest first, as they happened.
    get entries() { return this._entries.slice(); }
    set entries(list) {
      this._entries = (list || []).slice(-this._limit);
      this._renderNewEntries();
    }

    append(entry) {
      this._entries.push(entry);
      if (this._entries.length > this._limit) this._entries.shift();
      this._renderNewEntries();
    }

    clear() {
      this._entries = [];
      this._selected = null;
      this.render();
    }

    // Entry fields to show as aligned columns: [{ key, label }].
    get columns() { return this._columns; }
    set columns(list) {
      this._columns = list || [];
      this.render();
    }

    get _limit() { return Number(this.getAttribute('limit')) || DEFAULT_LIMIT; }
    get _oldestFirst() { return this.getAttribute('order') === 'oldest-first'; }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      if (!this._entries.length) {
        this.innerHTML = `<div class="sb-log__empty">${esc(this.getAttribute('empty-text') || 'Nothing yet.')}</div>`;
        return;
      }
      this._shown = this._oldestFirst ? this._entries : this._entries.slice().reverse();
      const template = ['auto', ...this._columns.map(() => 'max-content'), 'minmax(0, 1fr)'].join(' ');
      this.innerHTML = `
        <ol class="sb-log__list" style="grid-template-columns: ${template}">
          ${this._columns.length ? this._head() : ''}
          ${this._shown.map((entry, index) => this._entry(entry, index)).join('')}
        </ol>`;
    }

    // Oldest-first logs follow new entries, like a terminal, unless the viewer has scrolled up.
    _renderNewEntries() {
      const following = this._oldestFirst && this.scrollHeight - this.scrollTop - this.clientHeight < 8;
      this.render();
      if (following) this.scrollTop = this.scrollHeight;
    }

    _head() {
      return `
        <li class="sb-log__head" aria-hidden="true">
          <span>Time</span>${this._columns.map((c) => `<span>${esc(c.label ?? c.key)}</span>`).join('')}<span></span>
        </li>`;
    }

    _entry(entry, index) {
      const hasDetail = entry.detail != null;
      const expanded = hasDetail && this._expanded.has(entry);
      const attributes = [
        `class="sb-log__entry${entry === this._selected ? ' sb-log__entry--selected' : ''}"`,
        `data-index="${index}"`,
        entry.tone ? `data-tone="${esc(entry.tone)}"` : '',
        entry.kind ? `data-kind="${esc(entry.kind)}"` : '',
        hasDetail ? `data-has-detail tabindex="0" aria-expanded="${expanded}"` : ''
      ].join(' ');

      return `
        <li ${attributes}>
          <span class="sb-log__time">${esc(entry.time)}</span>
          ${this._columns.map((c) => `<span class="sb-log__field">${esc(entry.fields?.[c.key])}</span>`).join('')}
          <span class="sb-log__text">${esc(entry.text)}</span>
          ${expanded ? `<pre class="sb-log__detail">${esc(formatDetail(entry.detail))}</pre>` : ''}
        </li>`;
    }

    // ---- Interaction ----

    // Selecting an entry highlights it, opens or closes its detail, and tells the sandbox.
    _activate(target) {
      const row = target.closest('.sb-log__entry');
      if (!row || target.closest('.sb-log__detail')) return;
      const entry = this._shown[row.dataset.index];
      if (entry.detail != null) {
        if (this._expanded.has(entry)) this._expanded.delete(entry);
        else this._expanded.add(entry);
      }
      this._selected = entry;
      this.render();
      this.querySelector(`.sb-log__entry[data-index="${row.dataset.index}"][tabindex]`)?.focus();
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { entry } }));
    }
  }

  customElements.define('sb-log', SbLog);
})();
