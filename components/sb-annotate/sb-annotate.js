// Sandkit sb-annotate 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Text with the parts that matter marked, each carrying a note. Pointing at a mark shows its note
// in a card just above it, and clicking pins the card open. Kinds colour the marks, with a legend
// counting each; pointing at a kind in the legend fades the rest.
//
//   <sb-annotate>
//     <p>I've called three times and <mark data-note="Third contact in ten days." data-kind="risk">nobody's got back to me</mark>.</p>
//   </sb-annotate>
//
//   annotate.kinds = { risk: { label: 'Risk', tone: 'bad' } };
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-annotate';
  const existing = customElements.get('sb-annotate');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-annotate>, so only one can run. Rename one by replacing every "sb-annotate" in its file.`);
    }
    return;
  }

  const TONES = ['accent', 'good', 'warn', 'bad', 'muted'];
  const FALLBACK = { accent: '#2563eb', good: '#3f9142', warn: '#d69e2e', bad: '#c53030', muted: '#616e7c' };

  const CSS = `
    .sb-annotate { display: block; }
    ${TONES.map((tone) => `.sb-annotate--${tone} { --sb-annotate-tone: var(--sb-${tone}, ${FALLBACK[tone]}); }`).join('\n    ')}

    .sb-annotate mark { padding: 0 1px; border-bottom: 2px solid var(--sb-annotate-tone); border-radius: 2px; background: color-mix(in srgb, var(--sb-annotate-tone) 18%, transparent); color: inherit; box-decoration-break: clone; -webkit-box-decoration-break: clone; cursor: pointer; }
    .sb-annotate mark:hover, .sb-annotate mark.sb-annotate--pinned { background: color-mix(in srgb, var(--sb-annotate-tone) 34%, transparent); }
    .sb-annotate mark:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-annotate mark.sb-annotate--faded { border-bottom-color: transparent; background: none; }
    .sb-annotate mark.sb-annotate--pointed { outline: 1px dashed var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-annotate mark.sb-annotate--highlighted { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; background: color-mix(in srgb, var(--sb-annotate-tone) 34%, transparent); }

    .sb-annotate__legend { display: flex; flex-wrap: wrap; gap: 2px 12px; margin-bottom: 8px; color: var(--sb-muted, #616e7c); font: 12px/1.6 var(--sb-font, system-ui, sans-serif); }
    .sb-annotate__key { display: inline-flex; align-items: center; gap: 5px; padding: 0 4px; border-radius: 4px; cursor: default; }
    .sb-annotate__key:hover, .sb-annotate__key--highlighted { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-annotate__swatch { width: 10px; height: 10px; border-bottom: 2px solid var(--sb-annotate-tone); border-radius: 2px; background: color-mix(in srgb, var(--sb-annotate-tone) 30%, transparent); }
    .sb-annotate__count { font-weight: 600; color: var(--sb-text, #1f2933); }

    .sb-annotate__card { position: fixed; inset: auto; margin: 0; max-width: 300px; padding: 8px 10px; border: 1px solid var(--sb-border, #d5d9e0); border-top: 3px solid var(--sb-annotate-tone); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18); font: 13px/1.45 var(--sb-font, system-ui, sans-serif); }
    .sb-annotate__kind { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--sb-annotate-tone); }`;

  const CARD_GAP = 6;
  const VIEWPORT_MARGIN = 8;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function addStyle() {
    if (document.getElementById('sb-annotate-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-annotate-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  let instanceCount = 0; // links each instance's marks to its own card

  class SbAnnotate extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._kinds = {};
      this._highlight = [];
      this._pointed = null;      // the mark under the pointer or focus
      this._pointedRef = null;   // its ref, as last reported in sb-point
      this._pinned = null;       // the mark whose card stays open
      this._shown = null;        // { mark, line }: where the card is showing
      this._legend = Object.assign(document.createElement('div'), { className: 'sb-annotate__legend' });
      this._card = Object.assign(document.createElement('div'), { className: 'sb-annotate__card', id: `sb-annotate-card-${++instanceCount}` });
      this._card.popover = 'manual';
      this._card.setAttribute('role', 'tooltip');

      // Marks the sandbox adds or rewrites later are picked up too. The legend and card are ours.
      this._observer = new MutationObserver((records) => {
        if (records.some((r) => !this._legend.contains(r.target) && !this._card.contains(r.target))) this._render();
      });

      this.addEventListener('pointerover', (e) => {
        this._pointAtKind(this._closest(e.target, '.sb-annotate__key')?.dataset.kind ?? null);
        this._pointAt(this._closest(e.target, 'mark'), e.clientY);
      });
      this.addEventListener('pointerleave', () => { this._pointAtKind(null); this._pointAt(null); });
      this.addEventListener('focusin', (e) => this._pointAt(this._closest(e.target, 'mark')));
      this.addEventListener('focusout', (e) => { if (!this.contains(e.relatedTarget)) this._pointAt(null); });
      this.addEventListener('keydown', (e) => this._onKey(e));

      // A click anywhere pins the mark it landed on, or unpins: clicking off the text lets go.
      this._onDocumentClick = (e) => {
        const mark = this._closest(e.target, 'mark');
        this._pin(mark && mark !== this._pinned ? mark : null);
      };
      this._onDocumentKey = (e) => { if (e.key === 'Escape') this._pin(null); };
      this._onScroll = () => this._placeCard();
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-annotate');
      document.addEventListener('click', this._onDocumentClick);
      document.addEventListener('keydown', this._onDocumentKey);
      document.addEventListener('scroll', this._onScroll, { capture: true, passive: true });
      // The marks are children, so wait until they have been parsed.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._start(), { once: true });
      } else {
        this._start();
      }
    }

    disconnectedCallback() {
      this._observer.disconnect();
      document.removeEventListener('click', this._onDocumentClick);
      document.removeEventListener('keydown', this._onDocumentKey);
      document.removeEventListener('scroll', this._onScroll, { capture: true });
    }

    // ---- Public API ----

    // The marks, in the order they appear.
    get marks() {
      return [...this.querySelectorAll('mark')];
    }

    // { [kind]: { label, tone } }: how each data-kind looks and is named, in legend order.
    get kinds() { return this._kinds; }
    set kinds(kinds) {
      this._kinds = { ...kinds };
      this._render();
    }

    // The data-refs to light up: ['delay'].
    get highlight() { return this._highlight; }
    set highlight(refs) {
      this._highlight = (refs || []).map(String);
      this._showHighlight();
    }

    // ---- Rendering ----

    _start() {
      if (this._started) return;
      this._started = true;
      this._render();
      this._observer.observe(this, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-kind', 'data-ref', 'data-note'] });
    }

    _render() {
      if (!this._started) return;
      for (const mark of this.marks) {
        this._setTone(mark, this._toneOf(mark.dataset.kind));
        mark.tabIndex = 0;
        mark.setAttribute('aria-describedby', this._card.id);
      }
      if (!this.contains(this._pinned)) this._pinned = null;
      if (!this.contains(this._card)) this.append(this._card);
      this._renderLegend();
      this._showHighlight();
    }

    _toneOf(kind) {
      const tone = this._kinds[kind]?.tone;
      return TONES.includes(tone) ? tone : 'accent';
    }

    _setTone(element, tone) {
      for (const t of TONES) element.classList.toggle(`sb-annotate--${t}`, t === tone);
    }

    // One entry per kind, in the order given, counting its marks. No kinds, no legend.
    _renderLegend() {
      const kinds = Object.entries(this._kinds);
      if (!kinds.length) return this._legend.remove();
      if (this.firstElementChild !== this._legend) this.prepend(this._legend);
      const marks = this.marks;
      const html = kinds.map(([kind, { label }]) => `
        <span class="sb-annotate__key sb-annotate--${this._toneOf(kind)}" data-kind="${esc(kind)}">
          <span class="sb-annotate__swatch"></span>${esc(label ?? kind)}
          <span class="sb-annotate__count">${marks.filter((m) => m.dataset.kind === kind).length}</span>
        </span>`).join('');
      if (this._legend.innerHTML !== html) this._legend.innerHTML = html;
    }

    _showHighlight() {
      const pointedRef = this._pointed?.dataset.ref;
      for (const mark of this.marks) {
        mark.classList.toggle('sb-annotate--highlighted', this._highlight.includes(mark.dataset.ref));
        mark.classList.toggle('sb-annotate--pointed', pointedRef != null && mark.dataset.ref === pointedRef && mark !== this._pointed);
        mark.classList.toggle('sb-annotate--pinned', mark === this._pinned);
      }
    }

    // ---- The card ----

    // Shows the mark's note above the line of it nearest the pointer, or hides the card.
    _showCard(mark, y) {
      if (!this._started) return;
      if (!mark?.dataset.note) {
        this._shown = null;
        if (this._card.matches(':popover-open')) this._card.hidePopover();
        return;
      }
      const lines = [...mark.getClientRects()];
      const line = Math.max(0, lines.findIndex((r) => y >= r.top && y <= r.bottom));
      const kind = mark.dataset.kind;
      const label = this._kinds[kind]?.label ?? kind;
      this._card.innerHTML =
        (label ? `<div class="sb-annotate__kind">${esc(label)}</div>` : '') +
        `<div class="sb-annotate__note">${esc(mark.dataset.note)}</div>`;
      this._setTone(this._card, this._toneOf(kind));
      this._shown = { mark, line };
      this._card.showPopover();
      this._placeCard();
    }

    // The card sits in the top layer, so scrolling containers never clip it. It goes above the
    // line, or below when there is no room, kept within the viewport.
    _placeCard() {
      if (!this._shown) return;
      const { mark, line } = this._shown;
      const rect = mark.getClientRects()[line] ?? mark.getBoundingClientRect();
      const card = this._card;
      const above = rect.top - CARD_GAP - card.offsetHeight;
      const left = Math.min(rect.left, innerWidth - card.offsetWidth - VIEWPORT_MARGIN);
      card.style.left = `${Math.max(VIEWPORT_MARGIN, left)}px`;
      card.style.top = `${above >= VIEWPORT_MARGIN ? above : rect.bottom + CARD_GAP}px`;
    }

    // ---- Interaction ----

    // The nearest element matching the selector, inside this element's text.
    _closest(target, selector) {
      const found = target?.closest?.(selector);
      return found && found !== this && this.contains(found) ? found : null;
    }

    // Pointing at a mark shows its note (the pinned one's otherwise), lights the marks sharing its
    // ref, and tells the sandbox when the ref changes.
    _pointAt(mark, y) {
      if (mark === this._pointed) return;
      this._pointed = mark;
      this._showCard(mark ?? this._pinned, y);
      this._showHighlight();
      const ref = mark?.dataset.ref ?? null;
      if (ref === this._pointedRef) return;
      this._pointedRef = ref;
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail: { ref } }));
    }

    // Pointing at a kind in the legend fades every mark of another kind.
    _pointAtKind(kind) {
      for (const mark of this.marks) mark.classList.toggle('sb-annotate--faded', kind !== null && mark.dataset.kind !== kind);
      for (const key of this._legend.children) key.classList.toggle('sb-annotate__key--highlighted', key.dataset.kind === kind);
    }

    // Pinning keeps a mark's card open until another click, Escape, or a click elsewhere.
    _pin(mark) {
      if (mark === this._pinned) return;
      this._pinned = mark;
      this._showHighlight();
      this._showCard(mark ?? this._pointed);
      if (!mark) return;
      const { ref = null, kind = null, note = null } = mark.dataset;
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { ref, kind, note } }));
    }

    _onKey(e) {
      const mark = this._closest(e.target, 'mark');
      if (!mark || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      this._pin(mark === this._pinned ? null : mark);
    }
  }

  customElements.define('sb-annotate', SbAnnotate);
})();
