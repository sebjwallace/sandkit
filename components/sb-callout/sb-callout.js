// Sandkit sb-callout 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A block that stands out from the text around it, like a textbook's "Definition" box: for
// definitions, notes, tips, questions, answers and warnings. Its content is whatever is inside it.
//
//   <sb-callout kind="definition" heading="Span">
//     <p>All the places you can reach with combinations of some vectors.</p>
//   </sb-callout>
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-callout';
  const existing = customElements.get('sb-callout');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-callout>, so only one can run. Rename one by replacing every "sb-callout" in its file.`);
    }
    return;
  }

  // Each kind has a title, a tone and an icon (Feather outlines, MIT).
  const KINDS = {
    definition: { title: 'Definition', tone: 'accent', icon: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>' },
    note: { title: 'Note', tone: 'muted', icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>' },
    tip: { title: 'Tip', tone: 'good', icon: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>' },
    question: { title: 'Question', tone: 'accent', icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
    answer: { title: 'Answer', tone: 'good', icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' },
    warning: { title: 'Warning', tone: 'warn', icon: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' }
  };
  const TONES = ['accent', 'good', 'warn', 'bad', 'muted'];
  const FALLBACK = { accent: '#2563eb', good: '#3f9142', warn: '#d69e2e', bad: '#c53030', muted: '#616e7c' };

  const CSS = `
    .sb-callout { display: block; margin: 12px 0; padding: 10px 14px; border: 1px solid var(--sb-border, #d5d9e0); border-left: 4px solid var(--sb-callout-tone); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); }
    .sb-callout__title { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--sb-callout-tone); font-size: 13px; font-weight: 700; letter-spacing: 0.02em; }
    .sb-callout__title svg { flex: none; }
    .sb-callout__body { margin-top: 6px; }
    .sb-callout__body > :first-child { margin-top: 0; }
    .sb-callout__body > :last-child { margin-bottom: 0; }
    .sb-callout__details > summary { cursor: pointer; list-style: none; }
    .sb-callout__details > summary::-webkit-details-marker { display: none; }
    .sb-callout__details > summary::after { content: 'Show'; margin-left: auto; color: var(--sb-muted, #616e7c); font-weight: 600; font-size: 12px; }
    .sb-callout__details[open] > summary::after { content: 'Hide'; }
    .sb-callout__details > summary:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 2px; border-radius: 4px; }
    ${TONES.map((tone) => `.sb-callout--${tone} { --sb-callout-tone: var(--sb-${tone}, ${FALLBACK[tone]}); }`).join('\n    ')}`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const icon = (paths) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

  function addStyle() {
    if (document.getElementById('sb-callout-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-callout-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbCallout extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['kind', 'heading', 'tone'];

    connectedCallback() {
      addStyle();
      this.classList.add('sb-callout');
      if (this._built) return;
      // The callout takes its children as content, so wait until they have been parsed.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._build(), { once: true });
      } else {
        this._build();
      }
    }

    attributeChangedCallback() {
      if (this._built) this._showTitle();
    }

    // ---- Public API ----

    get kind() { return KINDS[this.getAttribute('kind')] ? this.getAttribute('kind') : 'note'; }

    // For a collapsible callout: whether its content is showing.
    get open() { return this.querySelector(':scope > .sb-callout__details')?.open ?? true; }
    set open(value) {
      const details = this.querySelector(':scope > .sb-callout__details');
      if (details) details.open = Boolean(value);
    }

    // ---- Building ----

    // A collapsible callout uses the browser's own disclosure element, so it opens with a click or
    // the keyboard and is announced properly; a plain one is a titled block.
    _build() {
      this._built = true;
      const body = Object.assign(document.createElement('div'), { className: 'sb-callout__body' });
      body.append(...this.childNodes);
      if (this.hasAttribute('collapsible')) {
        this.innerHTML = '<details class="sb-callout__details"><summary class="sb-callout__title"></summary></details>';
        this.querySelector('details').append(body);
      } else {
        this.innerHTML = '<div class="sb-callout__title"></div>'; // not a <p>, so a sandbox's paragraph styles leave it alone
        this.append(body);
      }
      this.setAttribute('role', this.getAttribute('role') || 'note');
      this._showTitle();
    }

    _showTitle() {
      const kind = KINDS[this.kind];
      const tone = TONES.includes(this.getAttribute('tone')) ? this.getAttribute('tone') : kind.tone;
      TONES.forEach((t) => this.classList.toggle(`sb-callout--${t}`, t === tone));
      const title = this.getAttribute('heading') || kind.title;
      this.querySelector('.sb-callout__title').innerHTML = `${icon(kind.icon)}<span>${esc(title)}</span>`;
      this.setAttribute('aria-label', title);
    }
  }

  customElements.define('sb-callout', SbCallout);
})();
