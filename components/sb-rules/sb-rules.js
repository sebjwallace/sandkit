// Sandkit sb-rules 0.1.2 · MIT Licence · https://github.com/sebjwallace/sandkit
// A table of the rules a model follows, showing which one is about to apply and which one just
// did. "A table that lists rules displays; one that highlights the rule that just fired reveals."
//
//   rules.columns = [{ key: 'when', label: 'When' }, { key: 'then', label: 'Then' }];
//   rules.rules = [{ id: 'RUL-001', when: 'Stock below 40', then: 'Order up to 100' }];
//   rules.active = 'RUL-001';
//
// Children marked slot="<rule id>" replace that rule's code cell, such as a richer code.
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-rules';
  const existing = customElements.get('sb-rules');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-rules>, so only one can run. Rename one by replacing every "sb-rules" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-rules { display: block; overflow: auto; font-size: 13px; }
    .sb-rules__table { width: 100%; border-collapse: collapse; }
    .sb-rules__table th, .sb-rules__table td { padding: 5px 10px; text-align: left; vertical-align: baseline; border-bottom: 1px solid var(--sb-surface-2, #eef0f3); }
    .sb-rules__table thead th { position: sticky; top: 0; z-index: 1; background: var(--sb-surface, #fff); color: var(--sb-muted, #616e7c); font-weight: 600; border-bottom-color: var(--sb-border, #d5d9e0); }
    .sb-rules__group th { padding-top: 10px; color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .sb-rules__code { white-space: nowrap; font: 600 0.92em ui-monospace, Menlo, Consolas, monospace; }
    .sb-rules__rule { cursor: pointer; }
    .sb-rules__rule:hover { background: var(--sb-surface-2, #eef0f3); }
    .sb-rules__rule--fired { background: var(--sb-surface-2, #eef0f3); }
    .sb-rules__rule--active { background: var(--sb-accent-soft, #eaf0ff); box-shadow: inset 3px 0 0 var(--sb-accent, #2563eb); }
    .sb-rules__status { width: 1%; white-space: nowrap; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .sb-rules__rule--active .sb-rules__status { color: var(--sb-accent, #2563eb); }
    .sb-rules__rule--fired .sb-rules__status { color: var(--sb-muted, #616e7c); }
    .sb-rules__empty { color: var(--sb-muted, #616e7c); }
    .sb-rules__for-screen-readers { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }`;

  const STATUS = { active: 'next', fired: 'just applied' };

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function addStyle() {
    if (document.getElementById('sb-rules-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-rules-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Splits rules into runs that share the same value of `key`, keeping their order.
  function groupBy(rules, key) {
    const groups = [];
    for (const rule of rules) {
      const name = rule[key];
      if (groups.at(-1)?.name !== name) groups.push({ name, rules: [] });
      groups.at(-1).rules.push(rule);
    }
    return groups;
  }

  class SbRules extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['group', 'code-label', 'empty-text'];

    constructor() {
      super();
      this._rules = [];
      this._columns = [];
      this._active = null;
      this._fired = null;
      this._slotted = {}; // the sandbox's content for each rule's code cell, by rule id
      this.addEventListener('click', (e) => this._select(e));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-rules');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // [{ id, ...fields }]: one row per rule, in order.
    get rules() { return this._rules; }
    set rules(list) {
      this._rules = list || [];
      this.render();
    }

    // [{ key, label, format }]: which fields to show, after the code.
    get columns() { return this._columns; }
    set columns(list) {
      this._columns = list || [];
      this.render();
    }

    // The id of the rule about to apply.
    get active() { return this._active; }
    set active(id) {
      this._active = id ?? null;
      this._showStatus();
    }

    // The id of the rule that applied last.
    get fired() { return this._fired; }
    set fired(id) {
      this._fired = id ?? null;
      this._showStatus();
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      this._takeSlotted();
      if (!this._rules.length) {
        this.innerHTML = `<div class="sb-rules__empty">${esc(this.getAttribute('empty-text') || 'No rules yet.')}</div>`;
        return;
      }
      const group = this.getAttribute('group');
      const groups = group ? groupBy(this._rules, group) : [{ rules: this._rules }];
      const width = this._columns.length + 2;

      this.innerHTML = `
        <table class="sb-rules__table">
          <thead><tr>
            <th scope="col">${esc(this.getAttribute('code-label') || 'Rule')}</th>
            ${this._columns.map((c) => `<th scope="col">${esc(c.label ?? c.key)}</th>`).join('')}
            <th scope="col"><span class="sb-rules__for-screen-readers">Status</span></th>
          </tr></thead>
          ${groups.map((g) => `
            <tbody>
              ${group ? `<tr class="sb-rules__group"><th colspan="${width}" scope="rowgroup">${esc(g.name)}</th></tr>` : ''}
              ${g.rules.map((rule) => this._row(rule)).join('')}
            </tbody>`).join('')}
        </table>`;
      this._placeSlotted();
      this._showStatus();
    }

    _row(rule) {
      const cells = this._columns.map((c) => {
        const value = c.format ? c.format(rule[c.key], rule) : rule[c.key];
        return `<td>${esc(value)}</td>`;
      }).join('');
      return `
        <tr class="sb-rules__rule" data-ref="${esc(rule.id)}">
          <td class="sb-rules__code">${esc(rule.id)}</td>${cells}<td class="sb-rules__status"></td>
        </tr>`;
    }

    // Slotted children are kept across re-renders, and replace their rule's code text.
    _takeSlotted() {
      for (const el of this.querySelectorAll(':scope > [slot]')) this._slotted[el.slot] = el;
    }

    _placeSlotted() {
      for (const [id, el] of Object.entries(this._slotted)) {
        this._rowFor(id)?.querySelector('.sb-rules__code').replaceChildren(el);
      }
    }

    // Marks the rule about to apply and the one that just did, in words as well as colour, and
    // keeps the active rule in view in a long table.
    _showStatus() {
      if (!this.isConnected || !this._rules.length) return;
      for (const row of this.querySelectorAll('.sb-rules__rule')) {
        const id = row.dataset.ref;
        const isActive = id === String(this._active), isFired = id === String(this._fired);
        row.classList.toggle('sb-rules__rule--active', isActive);
        row.classList.toggle('sb-rules__rule--fired', isFired && !isActive);
        row.toggleAttribute('aria-current', isActive);
        row.querySelector('.sb-rules__status').textContent = isActive ? STATUS.active : isFired ? STATUS.fired : '';
      }
      this._scrollIntoView(this._rowFor(this._active));
    }

    _scrollIntoView(row) {
      if (!row) return;
      const header = this.querySelector('thead').offsetHeight;
      const top = row.offsetTop - header, bottom = row.offsetTop + row.offsetHeight;
      if (top < this.scrollTop) this.scrollTop = top;
      else if (bottom > this.scrollTop + this.clientHeight) this.scrollTop = bottom - this.clientHeight;
    }

    _rowFor(id) {
      if (id == null) return null;
      return [...this.querySelectorAll('.sb-rules__rule')].find((row) => row.dataset.ref === String(id));
    }

    // ---- Interaction ----

    _select(e) {
      const row = e.target.closest('.sb-rules__rule');
      if (!row) return;
      const rule = this._rules.find((r) => String(r.id) === row.dataset.ref);
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { rule } }));
    }
  }

  customElements.define('sb-rules', SbRules);
})();
