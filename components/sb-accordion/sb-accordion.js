// Sandkit sb-accordion 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// Sections that open and close: one on its own, or a group. Each section is a <details> child,
// headed by its <summary>. A closed section still tells you something: a short note beside its
// heading, a mark when what's inside has changed, and a mark when something highlighted is inside.
// A group gets Expand all and Collapse all, or with `single`, one section open at a time.
//
//   <sb-accordion>
//     <details data-ref="pump-2" note="2 alerts"><summary>Pump 2</summary>…</details>
//     <details><summary>Reservoir</summary>…</details>
//   </sb-accordion>
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-accordion';
  const existing = customElements.get('sb-accordion');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-accordion>, so only one can run. Rename one by replacing every "sb-accordion" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-accordion { display: block; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font-family: var(--sb-font, system-ui, sans-serif); }
    .sb-accordion__controls { display: flex; justify-content: flex-end; gap: 4px; padding: 4px 8px; border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-accordion__controls[hidden] { display: none; }
    .sb-accordion__control { padding: 2px 8px; border: 0; border-radius: 4px; background: none; color: var(--sb-accent, #2563eb); font: 600 12px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-accordion__control:disabled { color: var(--sb-muted, #616e7c); opacity: 0.6; cursor: default; }
    .sb-accordion__control:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); }
    .sb-accordion > details { padding: 0 16px; }
    .sb-accordion > details + details { border-top: 1px solid var(--sb-border, #d5d9e0); }
    .sb-accordion > details[open] { padding-bottom: 14px; }
    .sb-accordion > details > summary { display: flex; align-items: center; gap: 10px; margin: 0 -16px; padding: 11px 16px; font-size: 14px; font-weight: 600; list-style: none; cursor: pointer; }
    .sb-accordion > details > summary::-webkit-details-marker { display: none; }
    .sb-accordion > details > summary::before { content: ''; flex: none; width: 6px; height: 6px; margin: 0 2px; border: solid var(--sb-muted, #616e7c); border-width: 0 2px 2px 0; transform: rotate(-45deg); transition: transform 0.15s; }
    .sb-accordion > details[open] > summary::before { transform: rotate(45deg); }
    .sb-accordion > details > summary:hover { background: var(--sb-surface-2, #eef0f3); }
    .sb-accordion > details > summary:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -2px; }
    .sb-accordion > details:last-child > summary { border-radius: 0 0 var(--sb-radius, 8px) var(--sb-radius, 8px); }
    .sb-accordion__note { margin-left: auto; color: var(--sb-muted, #616e7c); font-size: 13px; font-weight: 400; text-align: right; }
    .sb-accordion__changed { display: none; flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--sb-warn, #b7791f); }
    .sb-accordion__section--changed:not([open]) > summary > .sb-accordion__changed { display: inline-block; }
    .sb-accordion__section--highlighted > summary,
    .sb-accordion__section--lit-inside:not([open]) > summary { background: color-mix(in srgb, var(--sb-accent, #2563eb) 12%, transparent); box-shadow: inset 3px 0 0 var(--sb-accent, #2563eb); }`;

  const announce = (ref) => document.dispatchEvent(new CustomEvent('sb-highlight', { detail: { ref } }));

  function addStyle() {
    if (document.getElementById('sb-accordion-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-accordion-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // What a section says beyond its heading: its text, leaving out its own summary and the notes
  // and buttons accordions add, so only the sandbox's content counts as a change.
  function contentText(section) {
    const summary = section.querySelector(':scope > summary');
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
    let text = '';
    while (walker.nextNode()) {
      const parent = walker.currentNode.parentElement;
      if (summary?.contains(parent) || parent.closest('.sb-accordion__note, .sb-accordion__controls')) continue;
      text += walker.currentNode.textContent;
    }
    return text;
  }

  // Whether a part marked with the ref sits inside a section's content, below its heading.
  function holdsRef(section, ref) {
    const summary = section.querySelector(':scope > summary');
    return [...section.querySelectorAll('[data-ref]')].some((el) => el.dataset.ref === ref && !summary?.contains(el));
  }

  class SbAccordion extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['single'];

    constructor() {
      super();
      this._seen = new WeakMap(); // each section's content as the viewer last saw it
      this._lit = null; // the ref highlighted on the page
      this._observer = new MutationObserver(() => this._update());
      this._onHighlight = (e) => { this._lit = e.detail?.ref ?? null; this._showLit(); };
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-accordion');
      document.addEventListener('sb-highlight', this._onHighlight);
      if (this._built) {
        this._observe();
        return;
      }
      // The sections are the children, so wait until they have been parsed.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._build(), { once: true });
      } else {
        this._build();
      }
    }

    disconnectedCallback() {
      this._observer.disconnect();
      document.removeEventListener('sb-highlight', this._onHighlight);
    }

    attributeChangedCallback() { if (this._built) this._prepare(); }

    // ---- Public API ----

    // The sections: this element's own <details> children.
    get sections() {
      return [...this.children].filter((child) => child.localName === 'details');
    }

    get single() { return this.hasAttribute('single'); }
    set single(value) { this.toggleAttribute('single', Boolean(value)); }

    // Open or close every section, as the buttons do. Fires sb-toggle for each that changes.
    expandAll() { this.sections.forEach((section) => this._choose(section, true)); }
    collapseAll() { this.sections.forEach((section) => this._choose(section, false)); }

    // Opens the section holding `place`, or else the first holding a part marked data-ref="ref"
    // (or marked so itself), quietly: no sb-toggle. False if no section holds it.
    reveal(ref, place) {
      const holds = place
        ? (section) => section.contains(place)
        : (section) => section.dataset.ref === String(ref) || holdsRef(section, String(ref));
      const section = this.sections.find(holds);
      if (!section) return false;
      this._open(section, true);
      return true;
    }

    // ---- Building ----

    _build() {
      if (this._built) return; // an accordion moved while the page loads is asked twice
      this._built = true;
      this._controls = Object.assign(document.createElement('div'), { className: 'sb-accordion__controls' });
      this._controls.innerHTML = `
        <button type="button" class="sb-accordion__control" data-action="expand">Expand all</button>
        <button type="button" class="sb-accordion__control" data-action="collapse">Collapse all</button>`;
      this.prepend(this._controls);

      this.addEventListener('click', (e) => this._onClick(e));
      this._prepare();
      // Changes count once the page has loaded, so components inside drawing themselves aren't news.
      if (document.readyState === 'complete') this._observe();
      else window.addEventListener('load', () => this._observe(), { once: true });
    }

    _observe() {
      this.sections.forEach((section) => this._seen.set(section, contentText(section)));
      this._observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['open', 'note', 'data-ref'] });
    }

    // Gives every section its marks and note, and the group its buttons. Safe to repeat: it only
    // writes what differs, so its own writes settle at once.
    _prepare() {
      const sections = this.sections;
      for (const section of sections) {
        section.classList.add('sb-accordion__section');
        const summary = section.querySelector(':scope > summary');
        if (!summary) continue;
        if (!summary.querySelector(':scope > .sb-accordion__note')) this._addMarks(summary, section);
        const note = summary.querySelector(':scope > .sb-accordion__note');
        const text = section.getAttribute('note') ?? '';
        if (note.textContent !== text) note.textContent = text;
      }
      const grouped = sections.length > 1 && !this.single;
      if (this._controls.hidden === grouped) this._controls.hidden = !grouped;
      const [expand, collapse] = this._controls.children;
      const allOpen = sections.every((s) => s.open);
      const allClosed = sections.every((s) => !s.open);
      if (expand.disabled !== allOpen) expand.disabled = allOpen;
      if (collapse.disabled !== allClosed) collapse.disabled = allClosed;
      this._showLit();
    }

    _addMarks(summary, section) {
      const changed = Object.assign(document.createElement('span'), { className: 'sb-accordion__changed', title: 'Changed since you last looked' });
      changed.setAttribute('role', 'img');
      changed.setAttribute('aria-label', 'changed');
      summary.append(changed, Object.assign(document.createElement('span'), { className: 'sb-accordion__note' }));
      // Pointing at a heading announces the section's ref, read when pointed at so it can change.
      summary.addEventListener('pointerenter', () => { if (section.dataset.ref) announce(section.dataset.ref); });
      summary.addEventListener('pointerleave', () => { if (section.dataset.ref) announce(null); });
    }

    // After any change inside: an open section is seen as it is; a closed one whose content
    // differs from when it was last seen is marked changed.
    _update() {
      this._prepare();
      for (const section of this.sections) {
        const text = contentText(section);
        if (section.open || !this._seen.has(section)) {
          this._seen.set(section, text);
          section.classList.remove('sb-accordion__section--changed');
        } else if (text !== this._seen.get(section)) {
          section.classList.add('sb-accordion__section--changed');
        }
      }
    }

    _showLit() {
      const ref = this._lit;
      for (const section of this.sections) {
        section.classList.toggle('sb-accordion__section--highlighted', Boolean(ref) && section.dataset.ref === ref);
        section.classList.toggle('sb-accordion__section--lit-inside', Boolean(ref) && holdsRef(section, ref));
      }
    }

    // ---- Interaction ----

    _onClick(e) {
      // Only this accordion's own buttons and headings, not those of one nested inside.
      const control = e.target.closest('.sb-accordion__control');
      if (control) {
        if (control.parentElement !== this._controls) return;
        return control.dataset.action === 'expand' ? this.expandAll() : this.collapseAll();
      }
      const summary = e.target.closest('summary');
      const section = summary?.parentElement;
      if (!section || section.parentElement !== this || summary !== section.querySelector(':scope > summary')) return;
      e.preventDefault(); // opened here instead, so sb-toggle reports the state it's now in
      this._choose(section, !section.open);
    }

    // A viewer's choice: opened or closed, and reported.
    _choose(section, open) {
      if (section.open === open) return;
      this._open(section, open);
      const detail = { index: this.sections.indexOf(section), ref: section.dataset.ref ?? null, open };
      this.dispatchEvent(new CustomEvent('sb-toggle', { bubbles: true, detail }));
    }

    // With `single`, opening one section closes the rest.
    _open(section, open) {
      if (open && this.single) this.sections.forEach((other) => { if (other !== section) other.open = false; });
      section.open = open;
    }
  }

  customElements.define('sb-accordion', SbAccordion);
})();
