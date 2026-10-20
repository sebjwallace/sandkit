// Sandkit sb-notebook 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// A workshop's sections in one page, in order. Each direct child is a section, given a header bar
// with its kind, who and when, and the codes inside it counted from data-ref. Sections open and
// collapse; key ones are marked, asides start collapsed. An outline and up and down controls move
// between them. Inspired by the shape of Jupyter notebooks, but nothing runs and nothing is
// edited in place.
//
//   <sb-notebook id="workshop" heading="Reorder rules workshop">
//     <section heading="Does 40 still hold?" kind="question" by="Sam Okafor" time="2026-10-20T09:12" relevance="key">…</section>
//   </sb-notebook>
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-notebook';
  const existing = customElements.get('sb-notebook');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-notebook>, so only one can run. Rename one by replacing every "sb-notebook" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-notebook { display: block; }
    .sb-notebook__head { position: sticky; top: 0; z-index: 1; display: grid; gap: 6px; padding: 8px 0; background: var(--sb-surface, #fff); border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-notebook__heading { margin: 0; font-size: 16px; font-weight: 700; }
    .sb-notebook__summary { color: var(--sb-muted, #616e7c); font-size: 13px; }
    .sb-notebook__nav { display: flex; align-items: center; gap: 4px; font-size: 13px; }
    .sb-notebook__nav button { padding: 2px 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: inherit; cursor: pointer; }
    .sb-notebook__nav button:disabled { opacity: 0.4; cursor: default; }
    .sb-notebook__all { display: flex; gap: 4px; }
    .sb-notebook__all button { padding: 2px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: inherit; font-size: 12px; cursor: pointer; }
    .sb-notebook__all button:disabled { opacity: 0.4; cursor: default; }
    .sb-notebook__position { margin: 0 auto 0 6px; color: var(--sb-muted, #616e7c); font-variant-numeric: tabular-nums; }
    .sb-notebook__clear { padding: 0; border: 0; background: none; color: var(--sb-accent, #2563eb); font: inherit; text-decoration: underline; cursor: pointer; }
    .sb-notebook__facets { display: grid; gap: 6px; font-size: 12px; }
    .sb-notebook__facet-group { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
    .sb-notebook__facet-label { margin-right: 2px; color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .sb-notebook__facet { padding: 1px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 999px; background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: inherit; cursor: pointer; }
    .sb-notebook__facet[aria-pressed="true"] { border-color: var(--sb-accent, #2563eb); background: var(--sb-accent-soft, #eaf0ff); color: var(--sb-accent, #2563eb); font-weight: 600; }
    .sb-notebook__facet:disabled { opacity: 0.4; cursor: default; }
    .sb-notebook__facet-count { color: var(--sb-muted, #616e7c); font-variant-numeric: tabular-nums; }
    .sb-notebook__outline { margin: 0; padding: 0; list-style: none; max-height: 50vh; overflow-y: auto; font-size: 13px; }
    .sb-notebook__outline[hidden], .sb-notebook__facets[hidden] { display: none; }
    .sb-notebook__panel-toggle { justify-self: start; padding: 0; border: 0; background: none; color: var(--sb-muted, #616e7c); font: inherit; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; }
    .sb-notebook__panel-toggle:hover { color: var(--sb-text, #1f2933); }
    .sb-notebook__panel-toggle::before { content: '▸ '; font-size: 13px; }
    .sb-notebook__panel-toggle[aria-expanded="true"]::before { content: '▾ '; }
    .sb-notebook__entry { display: flex; gap: 6px; align-items: baseline; width: 100%; padding: 3px 8px; border: 0; border-left: 2px solid transparent; background: none; color: var(--sb-text, #1f2933); font: inherit; text-align: left; cursor: pointer; }
    .sb-notebook__entry:hover { background: var(--sb-surface-2, #eef0f3); }
    .sb-notebook__entry[aria-current="true"] { border-left-color: var(--sb-accent, #2563eb); background: var(--sb-accent-soft, #eaf0ff); font-weight: 600; }
    .sb-notebook__entry[data-collapsed] { color: var(--sb-muted, #616e7c); }
    .sb-notebook__entry-kind { margin-left: auto; color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 400; }
    .sb-notebook__entry-key { color: var(--sb-accent, #2563eb); }
    .sb-notebook button:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }

    /* Wide: the head is a column beside the sections. */
    .sb-notebook[data-wide] { display: grid; grid-template-columns: minmax(0, 1fr) 230px; column-gap: 20px; align-items: start; }
    .sb-notebook[data-wide] > * { grid-column: 1; }
    .sb-notebook[data-wide] > .sb-notebook__head { grid-column: 2; grid-row: 1 / span 999; top: 12px; max-height: calc(100vh - 24px); overflow-y: auto; padding: 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); }
    .sb-notebook[data-wide] .sb-notebook__outline { max-height: none; }
    .sb-notebook[data-wide] .sb-notebook__facets { padding-bottom: 8px; border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-notebook[data-wide] > .sb-notebook__head + .sb-notebook__bar { margin-top: 0; }

    .sb-notebook__bar { margin-top: 10px; scroll-margin-top: 100px; }
    .sb-notebook__bar[data-unmatched] { opacity: 0.55; }
    .sb-notebook[data-wide] > .sb-notebook__bar { scroll-margin-top: 12px; }
    .sb-notebook__toggle { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; width: 100%; padding: 8px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); font: inherit; font-size: 12px; text-align: left; cursor: pointer; }
    .sb-notebook__toggle:hover { border-color: var(--sb-muted, #616e7c); }
    .sb-notebook__bar[data-open] .sb-notebook__toggle { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
    .sb-notebook__bar[data-key] .sb-notebook__toggle, .sb-notebook__bar[data-key] + .sb-notebook__section { border-left: 3px solid var(--sb-accent, #2563eb); }
    .sb-notebook__title { font-size: 14px; font-weight: 600; }
    .sb-notebook__title::before { content: '▸ '; color: var(--sb-muted, #616e7c); }
    .sb-notebook__bar[data-open] .sb-notebook__title::before { content: '▾ '; }
    .sb-notebook__bar[data-relevance="aside"] .sb-notebook__title { font-weight: 500; color: var(--sb-muted, #616e7c); }
    .sb-notebook__key { color: var(--sb-accent, #2563eb); font-weight: 600; }
    .sb-notebook__kind { padding: 0 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 999px; background: var(--sb-surface, #fff); color: var(--sb-muted, #616e7c); }
    .sb-notebook__who { color: var(--sb-muted, #616e7c); }
    .sb-notebook__codes { margin-left: auto; color: var(--sb-muted, #616e7c); font-variant-numeric: tabular-nums; }
    .sb-notebook__section { padding: 12px 14px; border: 1px solid var(--sb-border, #d5d9e0); border-top: 0; border-radius: 0 0 var(--sb-radius, 8px) var(--sb-radius, 8px); background: var(--sb-surface, #fff); }
    /* Collapsed sections stay collapsed even when the sandbox gives them a display of their own. */
    .sb-notebook > .sb-notebook__section[hidden] { display: none !important; }`;

  const WIDE = 760; // notebooks at least this wide put the outline beside the sections

  // A code is PREFIX-NUMBER; a part of one (DEC-3.b) counts as the code itself.
  const CODE = /^[A-Z][A-Z0-9]*-[A-Za-z0-9]+/;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // An ISO date, or date and time, reads as "20 Oct 2026, 09:12"; anything else is shown as given.
  function formatTime(time) {
    const match = /^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d:\d\d))?/.exec(time ?? '');
    if (!match) return time;
    const [, year, month, day, clock] = match;
    return `${Number(day)} ${MONTHS[month - 1]} ${year}${clock ? `, ${clock}` : ''}`;
  }

  const peopleOf = (section) => (section.getAttribute('by') || '').split(',').map((name) => name.trim()).filter(Boolean);

  function codesIn(section) {
    const codes = new Set();
    section.querySelectorAll('[data-ref]').forEach((el) => {
      const code = CODE.exec(el.dataset.ref)?.[0];
      if (code) codes.add(code);
    });
    return [...codes];
  }

  // "2 DEC · 1 QST", in the order the prefixes first appear.
  function countByPrefix(codes) {
    const counts = new Map();
    codes.forEach((code) => {
      const prefix = code.split('-')[0];
      counts.set(prefix, (counts.get(prefix) || 0) + 1);
    });
    return [...counts].map(([prefix, count]) => `${count} ${prefix}`).join(' · ');
  }

  const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

  // Facets: choices within one widen the match, choices across them narrow it.
  const FACETS = [
    { name: 'codes', label: 'Codes' },
    { name: 'kinds', label: 'Kinds' },
    { name: 'people', label: 'People' }
  ];

  const tidyFilter = (filter) => ({
    codes: [...(filter?.codes || [])],
    kinds: [...(filter?.kinds || [])],
    people: [...(filter?.people || [])],
    key: Boolean(filter?.key)
  });
  const isFiltering = (filter) => filter.key || FACETS.some(({ name }) => filter[name].length);
  const unique = (values) => [...new Set(values)];
  const isKey = (section) => section.getAttribute('relevance') === 'key';

  function addStyle() {
    if (document.getElementById('sb-notebook-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-notebook-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  let instanceCount = 0; // gives each notebook unique ids for linking bars to sections

  class SbNotebook extends HTMLElement {
    static origin = ORIGIN;

    static observedAttributes = ['heading'];

    constructor() {
      super();
      this._id = `sb-notebook-${++instanceCount}`;
      this._sectionCount = 0;
      this._bars = new WeakMap(); // each section's header bar
      this._open = new WeakMap(); // sections opened or collapsed since; the rest follow their relevance
      this._openWhileFiltered = new WeakMap(); // the same while a filter is on, forgotten when it changes
      this._codes = new WeakMap(); // each section's codes, counted when added and on refresh()
      this._filter = tidyFilter();
      this._prefixes = {};
      this._current = 0;
      this._panels = {}; // filter and outline opened by the viewer; closed until then
      // Sections added or removed later get their bars too.
      this._observer = new MutationObserver(() => this._render());
      this._resizeObserver = new ResizeObserver(() => {
        if (this._wide === this.clientWidth >= WIDE) return;
        this.toggleAttribute('data-wide', this.clientWidth >= WIDE);
        this._render();
      });
      this._onScroll = () => this._followScroll();
      this.addEventListener('click', (e) => this._onClick(e));
      this.addEventListener('keydown', (e) => this._onKey(e));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-notebook');
      this._resizeObserver.observe(this);
      document.addEventListener('scroll', this._onScroll, { capture: true, passive: true });
      if (this._built) {
        this._observer.observe(this, { childList: true });
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
      this._resizeObserver.disconnect();
      document.removeEventListener('scroll', this._onScroll, { capture: true });
    }

    attributeChangedCallback() { this._render(); }

    // ---- Public API ----

    // The sections: this element's own children, apart from the parts it adds.
    get sections() {
      return [...this.children].filter((child) => !child.matches('.sb-notebook__head, .sb-notebook__bar'));
    }

    // The section in view, or last gone to.
    get current() {
      const index = Math.min(this._current, Math.max(0, this.sections.length - 1));
      return { index, element: this.sections[index] ?? null };
    }

    // Move as a viewer would: open the section if collapsed, scroll to it, and fire sb-section.
    goTo(index) {
      const section = this.sections[index];
      if (!section) return;
      this._current = index;
      this._pinned = section; // stays current while in view, even if it can't scroll to the top
      if (!this._wide) this._panels.outline = false; // out of the way of the section gone to
      if (!this._isOpen(section)) this._choices.set(section, true);
      this._render();
      this._bars.get(section).scrollIntoView({ block: 'start' });
      this.dispatchEvent(new CustomEvent('sb-section', { bubbles: true, detail: { index, element: section } }));
    }

    next() { this.goTo(this.current.index + 1); }
    previous() { this.goTo(this.current.index - 1); }

    // Quiet, like setting a property: sb-toggle reports only what viewers do.
    expand(index) { this._setOpen(this.sections[index], true); }
    collapse(index) { this._setOpen(this.sections[index], false); }
    expandAll() { this._setAllOpen(true); }
    collapseAll() { this._setAllOpen(false); }

    // { codes, kinds, people, key }: code prefixes, kinds and people to match, and key sections
    // only. Matching sections open and the rest collapse. Setting it fires no event: sb-filter
    // reports the viewer's choices.
    get filter() { return tidyFilter(this._filter); }
    set filter(filter) {
      this._filter = tidyFilter(filter);
      this._openWhileFiltered = new WeakMap();
      this._render();
    }

    // Names for code prefixes in the filters, such as { DEC: 'Decisions' }.
    get prefixes() { return this._prefixes; }
    set prefixes(names) {
      this._prefixes = names || {};
      this._render();
    }

    // Counts the codes in each section again, for parts drawn after the section was added.
    refresh() {
      this.sections.forEach((section) => this._codes.delete(section));
      this._render();
    }

    // Expands the section holding `place`, or else the first holding a part marked data-ref="ref"
    // (its header bar included), quietly. False if no section holds it.
    reveal(ref, place) {
      const holds = place
        ? (section) => section.contains(place) || this._bars.get(section)?.contains(place)
        : (section) => [this._bars.get(section), ...section.querySelectorAll('[data-ref]')].some((el) => el?.dataset.ref === String(ref));
      const section = this.sections.find(holds);
      if (!section) return false;
      this._setOpen(section, true);
      return true;
    }

    // ---- Building ----

    _build() {
      if (this._built) return; // a notebook moved while the page loads is asked twice
      this._built = true;
      this._head = Object.assign(document.createElement('div'), { className: 'sb-notebook__head' });
      this.prepend(this._head);
      this._render();
      this._observer.observe(this, { childList: true });
    }

    // Everything is redrawn from the sections and their state; focus stays on the same control.
    _render() {
      if (!this._built) return;
      const focused = this.contains(document.activeElement) ? document.activeElement.dataset.focus : null;
      const sections = this.sections;
      sections.forEach((section, i) => this._renderSection(section, i));
      const bars = new Set(sections.map((section) => this._bars.get(section)));
      this.querySelectorAll(':scope > .sb-notebook__bar').forEach((bar) => { if (!bars.has(bar)) bar.remove(); });
      this._renderHead(sections);
      if (focused) [...this.querySelectorAll('[data-focus]')].find((el) => el.dataset.focus === focused)?.focus();
      this._observer.takeRecords(); // our own changes aren't sections arriving
    }

    _renderHead(sections) {
      const heading = this.getAttribute('heading');
      const people = new Set(sections.flatMap(peopleOf));
      const filtering = isFiltering(this._filter);
      const collapsed = sections.filter((section) => !this._isOpen(section)).length;
      const summary = [
        filtering ? `Showing ${sections.filter((section) => this._matches(section)).length} of ${sections.length}` : plural(sections.length, 'section', 'sections'),
        !filtering && collapsed ? `${collapsed} collapsed` : null,
        people.size ? plural(people.size, 'person', 'people') : null
      ].filter(Boolean).join(' · ');
      const facets = this._renderFacets(sections);
      const chosen = FACETS.reduce((count, { name }) => count + this._filter[name].length, Number(this._filter.key));
      const entries = sections.map((section, i) => {
        const kind = section.getAttribute('kind');
        const key = section.getAttribute('relevance') === 'key';
        return `<li><button type="button" class="sb-notebook__entry" data-index="${i}" data-focus="entry-${i}"${this._isOpen(section) ? '' : ' data-collapsed'}>
          ${key ? '<span class="sb-notebook__entry-key" title="Key">★</span>' : ''}
          <span>${esc(this._title(section, i))}</span>
          ${kind ? `<span class="sb-notebook__entry-kind">${esc(kind)}</span>` : ''}
        </button></li>`;
      }).join('');
      this._head.innerHTML = `
        ${heading ? `<h2 class="sb-notebook__heading">${esc(heading)}</h2>` : ''}
        <span class="sb-notebook__summary">${esc(summary)}${filtering ? ' · <button type="button" class="sb-notebook__clear" data-action="clear" data-focus="clear">Clear</button>' : ''}</span>
        <div class="sb-notebook__nav">
          <button type="button" data-action="previous" data-focus="previous" aria-label="Previous section">▲</button>
          <button type="button" data-action="next" data-focus="next" aria-label="Next section">▼</button>
          <span class="sb-notebook__position"></span>
        </div>
        <div class="sb-notebook__all">
          <button type="button" data-action="expand-all" data-focus="expand-all"${collapsed ? '' : ' disabled'}>Expand all</button>
          <button type="button" data-action="collapse-all" data-focus="collapse-all"${collapsed === sections.length ? ' disabled' : ''}>Collapse all</button>
        </div>
        ${facets ? this._panelToggle('filter', chosen ? `Filter · ${chosen}` : 'Filter') : ''}
        ${facets ? `<div class="sb-notebook__facets" id="${this._id}-filter"${this._panelOpen('filter') ? '' : ' hidden'}>${facets}</div>` : ''}
        ${this._panelToggle('outline', 'Sections')}
        <ol class="sb-notebook__outline" id="${this._id}-outline" aria-label="Sections"${this._panelOpen('outline') ? '' : ' hidden'}>${entries}</ol>`;
      this._markCurrent();
    }

    get _wide() { return this.hasAttribute('data-wide'); }

    // The filters and the outline stay closed until a viewer opens them.
    _panelOpen(panel) { return Boolean(this._panels[panel]); }

    _panelToggle(panel, label) {
      return `<button type="button" class="sb-notebook__panel-toggle" data-action="${panel}" data-focus="${panel}" aria-expanded="${this._panelOpen(panel)}" aria-controls="${this._id}-${panel}">${esc(label)}</button>`;
    }

    // A row per facet, each choice counting the sections it would show alongside the other facets.
    _renderFacets(sections) {
      const key = sections.some(isKey)
        ? `<div class="sb-notebook__facet-group">${this._facet('key', '', '★ Key only', sections.filter((section) => isKey(section) && this._matches(section, 'key')).length)}</div>`
        : '';
      const rows = FACETS.map(({ name, label }) => {
        const values = unique(sections.flatMap((section) => this._valuesOf(section, name)));
        if (!values.length) return '';
        const choices = values.map((value) => {
          const count = sections.filter((section) => this._valuesOf(section, name).includes(value) && this._matches(section, name)).length;
          return this._facet(name, value, name === 'codes' ? this._prefixes[value] ?? value : value, count);
        });
        return `<div class="sb-notebook__facet-group"><span class="sb-notebook__facet-label">${label}</span>${choices.join('')}</div>`;
      });
      return key + rows.join('');
    }

    _facet(facet, value, label, count) {
      const pressed = facet === 'key' ? this._filter.key : this._filter[facet].includes(value);
      return `<button type="button" class="sb-notebook__facet" data-facet="${facet}" data-value="${esc(value)}" data-focus="facet-${facet}-${esc(value)}" aria-pressed="${pressed}"${count || pressed ? '' : ' disabled'}>
        ${esc(label)} <span class="sb-notebook__facet-count">${count}</span></button>`;
    }

    // The current section, in the count and the outline; cheap enough to run on every scroll.
    _markCurrent() {
      const { index } = this.current;
      const count = this.sections.length;
      this._head.querySelector('.sb-notebook__position').textContent = count ? `${index + 1} of ${count}` : 'No sections';
      this._head.querySelector('[data-action="previous"]').disabled = index <= 0;
      this._head.querySelector('[data-action="next"]').disabled = index >= count - 1;
      this._head.querySelectorAll('.sb-notebook__entry').forEach((entry) => {
        entry.setAttribute('aria-current', String(Number(entry.dataset.index) === index));
      });
    }

    _renderSection(section, index) {
      let bar = this._bars.get(section);
      if (!bar) {
        bar = Object.assign(document.createElement('div'), { className: 'sb-notebook__bar' });
        this._bars.set(section, bar);
        if (!section.id) section.id = `${this._id}-section-${++this._sectionCount}`;
        section.classList.add('sb-notebook__section');
      }
      if (section.previousElementSibling !== bar) section.before(bar);

      const open = this._isOpen(section);
      const relevance = section.getAttribute('relevance');
      const ref = section.getAttribute('ref');
      section.hidden = !open;
      bar.toggleAttribute('data-unmatched', isFiltering(this._filter) && !this._matches(section));
      bar.dataset.index = index;
      bar.toggleAttribute('data-open', open);
      bar.toggleAttribute('data-key', relevance === 'key');
      if (relevance) bar.dataset.relevance = relevance; else delete bar.dataset.relevance;
      if (ref) bar.dataset.ref = ref; else delete bar.dataset.ref;

      const kind = section.getAttribute('kind');
      const who = [peopleOf(section).join(', '), formatTime(section.getAttribute('time'))].filter(Boolean).join(' · ');
      const codes = countByPrefix(this._codesOf(section));
      bar.innerHTML = `
        <button type="button" class="sb-notebook__toggle" data-focus="bar-${esc(section.id)}" aria-expanded="${open}" aria-controls="${esc(section.id)}">
          <span class="sb-notebook__title">${esc(this._title(section, index))}</span>
          ${relevance === 'key' ? '<span class="sb-notebook__key">★ Key</span>' : ''}
          ${kind ? `<span class="sb-notebook__kind">${esc(kind)}</span>` : ''}
          ${who ? `<span class="sb-notebook__who">${esc(who)}</span>` : ''}
          ${codes ? `<span class="sb-notebook__codes">${esc(codes)}</span>` : ''}
        </button>`;
    }

    _title(section, index) {
      return section.getAttribute('heading') || `Section ${index + 1}`;
    }

    _codesOf(section) {
      if (!this._codes.has(section)) this._codes.set(section, codesIn(section));
      return this._codes.get(section);
    }

    // A section's values for a facet: the prefixes of its codes, its kind, or its people.
    _valuesOf(section, facet) {
      if (facet === 'codes') return unique(this._codesOf(section).map((code) => code.split('-')[0]));
      if (facet === 'kinds') return [section.getAttribute('kind')].filter(Boolean);
      return peopleOf(section);
    }

    // Whether a section matches the filter, leaving out one facet to count what choosing in it would show.
    _matches(section, except) {
      const filter = this._filter;
      if (filter.key && except !== 'key' && !isKey(section)) return false;
      return FACETS.every(({ name }) => name === except || !filter[name].length ||
        this._valuesOf(section, name).some((value) => filter[name].includes(value)));
    }

    // While filtering, matches are open and the rest collapsed. Otherwise sections are open unless
    // collapsed since, or an aside never opened. Either way, opening or collapsing one wins.
    _isOpen(section) {
      if (isFiltering(this._filter)) return this._openWhileFiltered.get(section) ?? this._matches(section);
      return this._open.get(section) ?? section.getAttribute('relevance') !== 'aside';
    }

    // Where opening and collapsing is kept: filtering never changes what was open before it.
    get _choices() {
      return isFiltering(this._filter) ? this._openWhileFiltered : this._open;
    }

    _setOpen(section, open) {
      if (!section) return;
      this._choices.set(section, open);
      this._render();
    }

    _setAllOpen(open) {
      this.sections.forEach((section) => this._choices.set(section, open));
      this._render();
    }

    // ---- Interaction ----

    _onClick(e) {
      const bar = e.target.closest('.sb-notebook__bar');
      if (bar?.parentElement === this) return this._toggle(Number(bar.dataset.index));
      if (!this._head?.contains(e.target)) return;
      const entry = e.target.closest('.sb-notebook__entry');
      if (entry) return this.goTo(Number(entry.dataset.index));
      const facet = e.target.closest('.sb-notebook__facet');
      if (facet) return this._choose(facet.dataset.facet, facet.dataset.value);
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'previous') this.previous();
      if (action === 'next') this.next();
      if (action === 'clear') this._changeFilter({});
      if (action === 'expand-all') this.expandAll();
      if (action === 'collapse-all') this.collapseAll();
      if (action === 'filter' || action === 'outline') {
        this._panels[action] = !this._panelOpen(action);
        this._render();
      }
    }

    // A choice widens its own facet, or turns key only on or off.
    _choose(facet, value) {
      const filter = this.filter;
      if (facet === 'key') filter.key = !filter.key;
      else filter[facet] = filter[facet].includes(value) ? filter[facet].filter((v) => v !== value) : [...filter[facet], value];
      this._changeFilter(filter);
    }

    _changeFilter(filter) {
      this.filter = filter;
      this.dispatchEvent(new CustomEvent('sb-filter', { bubbles: true, detail: { filter: this.filter } }));
    }

    _toggle(index) {
      const section = this.sections[index];
      const open = !this._isOpen(section);
      this._setOpen(section, open);
      this.dispatchEvent(new CustomEvent('sb-toggle', { bubbles: true, detail: { index, element: section, open } }));
    }

    // Alt with the up and down arrows moves between sections; in the outline, the arrows alone do.
    _onKey(e) {
      const step = { ArrowUp: -1, ArrowDown: 1 }[e.key];
      if (!step || e.target.closest('sb-notebook') !== this) return;
      const inOutline = this._head.querySelector('.sb-notebook__outline').contains(e.target);
      if (!e.altKey && !inOutline) return;
      e.preventDefault();
      this.goTo(this.current.index + step);
      if (inOutline) this._head.querySelector(`[data-focus="entry-${this.current.index}"]`)?.focus();
    }

    // The current section is the last whose bar has passed a line a third of the way down the
    // window, unless the one just gone to is still in view.
    _followScroll() {
      if (!this._built || !this.getClientRects().length) return;
      const sections = this.sections;
      const top = (section) => this._bars.get(section).getBoundingClientRect().top;
      if (this._pinned && sections.includes(this._pinned) && top(this._pinned) >= 0 && top(this._pinned) < innerHeight) return;
      this._pinned = null;
      const passed = sections.filter((section) => top(section) <= innerHeight / 3).length;
      const index = Math.max(0, passed - 1);
      if (index === this._current) return;
      this._current = index;
      this._markCurrent();
    }
  }

  customElements.define('sb-notebook', SbNotebook);
})();
