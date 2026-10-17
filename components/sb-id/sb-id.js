// Sandkit sb-id · MIT Licence · https://github.com/sebjwallace/sandkit
// A short identifying code, shown as a pill. Hover or focus shows what it refers to; clicking
// highlights every mention of it on the page. Supports the identifiers practice
// (practices/identifiers.md).
//
//   <sb-id code="RUL-001"></sb-id>
//
//   document.addEventListener('sb-resolve', (e) => {
//     e.detail.definition = lookUp(e.detail.code);   // { title, description, kind }
//   });
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-id';
  const existing = customElements.get('sb-id');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-id>, so only one can run. Rename one by replacing every "sb-id" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-id { display: inline; }
    .sb-id__pill { display: inline-block; padding: 0 6px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 999px; background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); font: 600 0.85em/1.5 ui-monospace, Menlo, Consolas, monospace; vertical-align: baseline; cursor: pointer; }
    .sb-id__pill:hover { border-color: var(--sb-accent, #2563eb); }
    .sb-id__pill:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-id--unresolved .sb-id__pill { border-style: dashed; background: none; color: var(--sb-muted, #616e7c); }
    .sb-id--highlighted .sb-id__pill { border-color: var(--sb-accent, #2563eb); background: var(--sb-accent, #2563eb); color: var(--sb-accent-text, #fff); }
    .sb-id__card { position: fixed; inset: auto; margin: 0; max-width: 280px; padding: 8px 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18); font: 13px/1.45 var(--sb-font, system-ui, sans-serif); }
    .sb-id__kind { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--sb-muted, #616e7c); }
    .sb-id__title { font-weight: 600; }
    .sb-id__description { margin-top: 2px; color: var(--sb-muted, #616e7c); }`;

  const CARD_GAP = 6;
  const VIEWPORT_MARGIN = 8;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function addStyle() {
    if (document.getElementById('sb-id-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-id-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Runs once the page has been parsed, so the sandbox's sb-resolve listener exists wherever it was added.
  function whenParsed(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  // Highlighting is page-wide: every mention of the highlighted code lights up together.
  let highlightedCode = null;

  function highlight(code) {
    highlightedCode = code;
    document.querySelectorAll('sb-id').forEach((el) => el.classList.toggle('sb-id--highlighted', code !== null && el.code === code));
  }

  let instanceCount = 0; // links each pill to its own card

  class SbId extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['code'];

    constructor() {
      super();
      this._cardId = `sb-id-card-${++instanceCount}`;
      this._definition = null;
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-id');
      this.render();
      whenParsed(() => this._resolveOnArrival());
    }

    attributeChangedCallback() {
      if (!this.isConnected) return;
      this.render();
      this.refresh();
    }

    // ---- Public API ----

    get code() { return this.getAttribute('code') || ''; }
    set code(value) { this.setAttribute('code', value); }

    // What the code refers to, as supplied by the sandbox, or null if nothing answered.
    get definition() { return this._definition; }

    // Asks the sandbox again what the code refers to, e.g. after the model has changed.
    refresh() {
      const request = { code: this.code, definition: null };
      this.dispatchEvent(new CustomEvent('sb-resolve', { bubbles: true, detail: request }));
      this._definition = request.definition;
      this.classList.toggle('sb-id--unresolved', !this._definition);
    }

    // A sandbox often shows a code in the same moment it defines it, so an unresolved pill asks
    // once more on the next frame before settling as unresolved.
    _resolveOnArrival() {
      this.refresh();
      if (!this._definition) requestAnimationFrame(() => this.refresh());
    }

    // ---- Rendering ----

    // No whitespace around the pill: it sits inline in prose, where any would show as a space.
    render() {
      this.innerHTML =
        `<button type="button" class="sb-id__pill" aria-describedby="${this._cardId}">${esc(this.code)}</button>` +
        `<div class="sb-id__card" id="${this._cardId}" popover="manual" role="tooltip"></div>`;
      this.classList.toggle('sb-id--highlighted', highlightedCode !== null && this.code === highlightedCode);

      const pill = this.querySelector('.sb-id__pill');
      pill.addEventListener('mouseenter', () => this._showCard());
      pill.addEventListener('focus', () => this._showCard());
      pill.addEventListener('mouseleave', () => this._hideCard());
      pill.addEventListener('blur', () => this._hideCard());
      pill.addEventListener('click', () => this._toggleHighlight());
    }

    _cardContent() {
      if (!this._definition) return `<div class="sb-id__description">Nothing in this sandbox is defined as ${esc(this.code)}.</div>`;
      const { kind, title, description } = this._definition;
      return `
        ${kind ? `<div class="sb-id__kind">${esc(kind)}</div>` : ''}
        ${title ? `<div class="sb-id__title">${esc(title)}</div>` : ''}
        ${description ? `<div class="sb-id__description">${esc(description)}</div>` : ''}`;
    }

    // The card sits in the top layer, so scrolling containers never clip it; it is placed below
    // the pill, kept within the viewport.
    _showCard() {
      this.refresh();
      const card = this.querySelector('.sb-id__card');
      card.innerHTML = this._cardContent();
      card.showPopover();
      const pill = this.querySelector('.sb-id__pill').getBoundingClientRect();
      const left = Math.min(pill.left, innerWidth - card.offsetWidth - VIEWPORT_MARGIN);
      card.style.left = `${Math.max(VIEWPORT_MARGIN, left)}px`;
      card.style.top = `${pill.bottom + CARD_GAP}px`;
    }

    _hideCard() {
      const card = this.querySelector('.sb-id__card');
      if (card.matches(':popover-open')) card.hidePopover();
    }

    _toggleHighlight() {
      const on = highlightedCode !== this.code;
      highlight(on ? this.code : null);
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { code: this.code, highlighted: on } }));
    }
  }

  customElements.define('sb-id', SbId);
})();
