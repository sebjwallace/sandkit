// Sandkit sb-tabs 0.1.4 · MIT Licence · https://github.com/sebjwallace/sandkit
// Tabs over the panels inside it: chapters of a sandbox, views of a model, anything. Each panel is
// a direct child titled by its `heading`; only the selected one shows. Tab sets only ever look at
// their own direct children, so they nest freely.
//
//   <sb-tabs id="chapters">
//     <section heading="1 · Vectors">…</section>
//     <section heading="2 · Combinations">…</section>
//   </sb-tabs>
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-tabs';
  const existing = customElements.get('sb-tabs');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-tabs>, so only one can run. Rename one by replacing every "sb-tabs" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-tabs { display: block; }
    .sb-tabs__list { display: flex; flex-wrap: wrap; gap: 2px; margin-bottom: 14px; border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-tabs__tab { margin-bottom: -1px; padding: 8px 14px; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--sb-muted, #616e7c); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
    .sb-tabs__tab:hover { color: var(--sb-text, #1f2933); }
    .sb-tabs__tab[aria-selected="true"] { color: var(--sb-text, #1f2933); border-bottom-color: var(--sb-accent, #2563eb); }
    .sb-tabs__tab:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -2px; border-radius: 4px; }
    /* Hidden panels stay hidden even when the sandbox gives them a display of their own. */
    .sb-tabs > [role="tabpanel"][hidden] { display: none !important; }`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function addStyle() {
    if (document.getElementById('sb-tabs-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-tabs-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Tab sets with an id remember each viewer's choice.
  const storage = {
    read(key) {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* kept for this visit only */ }
    }
  };

  let instanceCount = 0; // gives each tab set unique ids for linking tabs to panels

  class SbTabs extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._id = `sb-tabs-${++instanceCount}`;
      this._selected = null; // null until chosen, by the sandbox or the viewer
      // Panels added or removed later get their tabs too.
      this._observer = new MutationObserver(() => this._renderTabs());
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-tabs');
      if (this._built) {
        this._observer.observe(this, { childList: true });
        return;
      }
      // The tabs come from the children, so wait until they have been parsed.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._build(), { once: true });
      } else {
        this._build();
      }
    }

    disconnectedCallback() {
      this._observer.disconnect();
    }

    // ---- Public API ----

    // The panels: this element's own children, apart from its tab list.
    get panels() {
      return [...this.children].filter((child) => child !== this._list);
    }

    // The index of the panel showing. Setting it fires no event: sb-select reports the viewer's choices.
    get selected() { return this._selected ?? 0; }
    set selected(index) {
      this._selected = this._clamp(Number(index));
      this._showSelected();
    }

    next() { this._choose(this._selected + 1); }
    previous() { this._choose(this._selected - 1); }

    // Shows the panel holding `place`, or else the first holding a part marked data-ref="ref",
    // quietly, as setting selected does. False if no panel holds it.
    reveal(ref, place) {
      const holds = place
        ? (panel) => panel.contains(place)
        : (panel) => [panel, ...panel.querySelectorAll('[data-ref]')].some((el) => el.dataset.ref === String(ref));
      const index = this.panels.findIndex(holds);
      if (index === -1) return false;
      this.selected = index;
      return true;
    }

    // ---- Building ----

    _build() {
      if (this._built) return; // a tab set moved while the page loads is asked twice
      this._built = true;
      this._list = Object.assign(document.createElement('div'), { className: 'sb-tabs__list' });
      this._list.setAttribute('role', 'tablist');
      this.prepend(this._list);

      // A viewer's remembered choice wins; then one the sandbox set before the tabs were built.
      const saved = this.id ? storage.read(`sb-tabs:${this.id}`) : null;
      this._selected = saved ?? this._selected ?? Number(this.getAttribute('selected') ?? 0);

      this._list.addEventListener('click', (e) => {
        const tab = e.target.closest('[role="tab"]');
        if (tab) this._choose(Number(tab.dataset.index));
      });
      this._list.addEventListener('keydown', (e) => this._onKey(e));
      this._renderTabs();
      this._observer.observe(this, { childList: true });
    }

    _renderTabs() {
      const panels = this.panels;
      this._list.innerHTML = panels.map((panel, i) => `
        <button type="button" role="tab" class="sb-tabs__tab" id="${this._id}-tab-${i}" data-index="${i}">${esc(panel.getAttribute('heading') || `Tab ${i + 1}`)}</button>`).join('');
      panels.forEach((panel, i) => {
        if (!panel.id) panel.id = `${this._id}-panel-${i}`;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', `${this._id}-tab-${i}`);
        this._list.children[i].setAttribute('aria-controls', panel.id);
      });
      this._selected = this._clamp(this._selected);
      this._showSelected();
    }

    // Shows one panel, and makes its tab the one reached by Tab, so arrow keys move between tabs.
    _showSelected() {
      if (!this._built) return;
      this.panels.forEach((panel, i) => { panel.hidden = i !== this._selected; });
      [...this._list.children].forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === this._selected));
        tab.tabIndex = i === this._selected ? 0 : -1;
      });
    }

    // ---- Interaction ----

    _choose(index) {
      const target = this._clamp(index);
      if (target === this._selected) return;
      this.selected = target;
      if (this.id) storage.write(`sb-tabs:${this.id}`, target);
      const panel = this.panels[target];
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { index: target, heading: panel?.getAttribute('heading') ?? null } }));
    }

    // Arrow keys move between tabs (wrapping round), Home and End jump to the ends.
    _onKey(e) {
      const count = this.panels.length;
      const moves = { ArrowRight: this._selected + 1, ArrowLeft: this._selected - 1 + count, Home: 0, End: count - 1 };
      if (!(e.key in moves)) return;
      e.preventDefault();
      const index = e.key.startsWith('Arrow') ? moves[e.key] % count : moves[e.key];
      this._choose(index);
      this._list.children[this._selected]?.focus();
    }

    _clamp(index) {
      const last = Math.max(0, this.panels.length - 1);
      return Math.min(last, Math.max(0, Number.isFinite(index) ? index : 0));
    }
  }

  customElements.define('sb-tabs', SbTabs);
})();
