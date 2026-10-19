// Sandkit sb-sources 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A sandbox's source material as cards of paper to search, filter and sort: each source with its
// labelled details, what it supersedes and what supersedes it, and files not yet catalogued, so
// nothing waits unseen. Each filter value says how many sources it would show.
//
//   <sb-sources></sb-sources>
//   list.catalogue = catalogue.sources;   // the page loads the catalogue; the component never fetches
//   list.addEventListener('sb-open', (e) => showSource(e.detail.id));
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-sources';
  const existing = customElements.get('sb-sources');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-sources>, so only one can run. Rename one by replacing every "sb-sources" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-sources { display: flex; flex-direction: column; min-height: 0; color: var(--sb-text, #1f2933); font: 13px/1.45 var(--sb-font, system-ui, sans-serif); }
    .sb-sources__bar { flex: none; display: flex; align-items: center; gap: 10px; padding-bottom: 8px; }
    .sb-sources__search { flex: 1; min-width: 0; padding: 5px 9px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: inherit; font: inherit; }
    .sb-sources__search:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -1px; }
    /* The browser's own arrow drawn over with a plain chevron in the theme's colours. */
    .sb-sources__sorter { position: relative; flex: none; }
    .sb-sources__sorter::after { content: ''; position: absolute; top: 50%; right: 11px; width: 5px; height: 5px; margin-top: -4px; border: solid var(--sb-muted, #616e7c); border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); pointer-events: none; }
    .sb-sources__sort { appearance: none; padding: 5px 28px 5px 9px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: inherit; font: inherit; cursor: pointer; }
    .sb-sources__sort:hover { border-color: var(--sb-muted, #616e7c); }
    .sb-sources__sort:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -1px; }
    .sb-sources__count { flex: none; color: var(--sb-muted, #616e7c); font-size: 12px; }

    /* Filters: each value with how many sources it would show, so the material's shape shows at a glance. */
    .sb-sources__filters { flex: none; display: grid; grid-template-columns: max-content 1fr; gap: 5px 10px; align-items: baseline; padding: 2px 0 12px; }
    .sb-sources__facet { color: var(--sb-muted, #616e7c); font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
    .sb-sources__values { display: flex; flex-wrap: wrap; gap: 4px; }
    .sb-sources__value { display: inline-flex; align-items: baseline; gap: 5px; padding: 1px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 999px; background: var(--sb-surface, #fff); color: inherit; font: 12px/1.5 var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-sources__value:hover { border-color: var(--sb-muted, #616e7c); }
    .sb-sources__value:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-sources__value[aria-pressed="true"] { border-color: var(--sb-accent, #2563eb); background: var(--sb-accent-soft, #eaf0ff); font-weight: 600; }
    .sb-sources__value--none { opacity: 0.45; }
    .sb-sources__tally { color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 400; font-variant-numeric: tabular-nums; }
    .sb-sources__clear { padding: 0; border: 0; background: none; color: var(--sb-accent, #2563eb); font: 12px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-sources__chips, .sb-sources__written, .sb-sources__show { display: contents; }

    /* When sources were written: two handles choosing a stretch of the whole span, with a tick for each source.
       The rail sits in from the ends by half a handle, so a tick lines up with a handle on the same date. */
    .sb-sources__dates { display: flex; align-items: center; gap: 12px; align-self: center; }
    .sb-sources__range { --sb-sources-handle: 14px; position: relative; flex: 1; max-width: 420px; height: 22px; }
    .sb-sources__rail { position: absolute; inset: 0 calc(var(--sb-sources-handle) / 2); }
    .sb-sources__track, .sb-sources__span { position: absolute; top: 9px; height: 4px; border-radius: 2px; }
    .sb-sources__track { left: 0; right: 0; background: var(--sb-surface-2, #eef0f3); box-shadow: inset 0 0 0 1px var(--sb-border, #d5d9e0); }
    .sb-sources__span { background: var(--sb-accent, #2563eb); }
    .sb-sources__tick { position: absolute; top: 0; width: 2px; height: 7px; margin-left: -1px; border-radius: 1px; background: var(--sb-text, #1f2933); opacity: 0.7; }
    .sb-sources__tick--out { opacity: 0.2; }
    .sb-sources__written > .sb-sources__facet { align-self: center; }
    .sb-sources__handle { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; appearance: none; background: none; pointer-events: none; }
    .sb-sources__handle::-webkit-slider-thumb { appearance: none; width: var(--sb-sources-handle); height: var(--sb-sources-handle); margin-top: 4px; border: 2px solid var(--sb-accent, #2563eb); border-radius: 50%; background: var(--sb-surface, #fff); cursor: grab; pointer-events: auto; }
    .sb-sources__handle::-moz-range-thumb { width: 10px; height: 10px; border: 2px solid var(--sb-accent, #2563eb); border-radius: 50%; background: var(--sb-surface, #fff); cursor: grab; pointer-events: auto; }
    .sb-sources__handle::-webkit-slider-runnable-track { height: 22px; background: none; }
    .sb-sources__handle:focus-visible { outline: none; }
    .sb-sources__handle:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px var(--sb-accent-soft, #eaf0ff); }
    .sb-sources__between { flex: none; font-size: 12px; font-variant-numeric: tabular-nums; }
    .sb-sources__list { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); align-content: start; gap: 16px 18px; margin: 0; padding: 16px; border-radius: var(--sb-radius, 8px); background: color-mix(in srgb, var(--sb-bg, #f5f6f8) 70%, var(--sb-surface-2, #eef0f3)); box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06); list-style: none; }
    .sb-sources__empty { grid-column: 1 / -1; margin: 0; padding: 0 2px; color: var(--sb-muted, #616e7c); }

    /* Each source as a sheet of paper with a folded corner, so material looks
       like material wherever it appears. The edges are drawn from the text colour, for light and dark alike. */
    .sb-sources { --sb-sources-fold: 16px; --sb-sources-edge: color-mix(in srgb, var(--sb-text, #1f2933) 24%, transparent); }
    .sb-sources__card { --sb-sources-sheet: var(--sb-sources-paper, color-mix(in srgb, var(--sb-surface, #fff) 94%, #f3e2b8)); position: relative; display: flex; cursor: pointer; filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.12)) drop-shadow(0 3px 7px rgba(0, 0, 0, 0.14)); transition: transform 0.12s, filter 0.12s; }
    .sb-sources__card:hover { transform: translateY(-2px); filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.12)) drop-shadow(0 7px 12px rgba(0, 0, 0, 0.2)); }
    .sb-sources__card:focus-visible { outline: none; }
    .sb-sources__card::after { content: ''; position: absolute; top: 0; right: 0; width: var(--sb-sources-fold); height: var(--sb-sources-fold); border-left: 1px solid var(--sb-sources-edge); border-bottom: 1px solid var(--sb-sources-edge); border-bottom-left-radius: 2px; background: linear-gradient(to top right, color-mix(in srgb, var(--sb-sources-sheet) 84%, var(--sb-text, #1f2933)) 50%, transparent 50%); }
    .sb-sources__paper { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 10px 14px 10px 13px; border: 1px solid var(--sb-sources-edge); border-radius: 2px; clip-path: polygon(0 0, calc(100% - var(--sb-sources-fold)) 0, 100% var(--sb-sources-fold), 100% 100%, 0 100%); background: linear-gradient(135deg, color-mix(in srgb, var(--sb-sources-sheet) 97%, #fff), var(--sb-sources-sheet) 45%, color-mix(in srgb, var(--sb-sources-sheet) 93%, #000)); }
    .sb-sources__card--lit .sb-sources__paper { background: color-mix(in srgb, var(--sb-accent, #2563eb) 12%, var(--sb-sources-sheet)); }
    .sb-sources__card--selected .sb-sources__paper, .sb-sources__card:focus-visible .sb-sources__paper { border-color: var(--sb-accent, #2563eb); box-shadow: inset 0 0 0 1px var(--sb-accent, #2563eb); }
    .sb-sources__card--superseded .sb-sources__paper > :not(.sb-sources__links) { opacity: 0.55; }
    .sb-sources__card--superseded .sb-sources__name { text-decoration: line-through; text-decoration-color: var(--sb-muted, #616e7c); }

    .sb-sources__running { display: flex; align-items: center; gap: 8px; margin-right: 8px; }
    .sb-sources__title { margin: 0; font: 600 15px/1.35 var(--sb-sources-font, Georgia, 'Iowan Old Style', 'Times New Roman', serif); }
    .sb-sources__name { overflow-wrap: anywhere; }
    .sb-sources__id { flex: none; padding: 0 6px; border-radius: 4px; background: color-mix(in srgb, var(--sb-text, #1f2933) 8%, transparent); color: var(--sb-muted, #616e7c); font: 600 11px/1.6 ui-monospace, Menlo, Consolas, monospace; }
    .sb-sources__format { flex: none; margin-left: auto; padding: 1px 7px; border: 1px solid var(--sb-sources-edge); border-radius: 4px; font: 600 10px/1.5 var(--sb-font, system-ui, sans-serif); letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
    .sb-sources__summary { flex: 1; color: var(--sb-muted, #616e7c); font: 13px/1.5 var(--sb-sources-font, Georgia, 'Iowan Old Style', 'Times New Roman', serif); }
    .sb-sources__fields { display: grid; grid-template-columns: max-content 1fr; gap: 1px 10px; margin: 2px 0 0; padding-top: 7px; border-top: 1px solid var(--sb-sources-edge); font-size: 12px; }
    .sb-sources__fields div { display: contents; }
    .sb-sources__fields dt { align-self: baseline; }
    .sb-sources__fields dt { color: var(--sb-muted, #616e7c); font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
    .sb-sources__fields dd { margin: 0; }
    .sb-sources__status::before { content: ''; display: inline-block; width: 7px; height: 7px; margin-right: 5px; border-radius: 50%; background: var(--sb-sources-status, var(--sb-muted, #616e7c)); vertical-align: 1px; }
    .sb-sources__status--inbox { --sb-sources-status: var(--sb-warn, #d69e2e); }
    .sb-sources__status--catalogued { --sb-sources-status: var(--sb-accent, #2563eb); }
    .sb-sources__status--reviewed { --sb-sources-status: var(--sb-good, #3f9142); }
    .sb-sources__status--superseded { --sb-sources-status: var(--sb-bad, #c53030); font-weight: 600; }
    .sb-sources__links { color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-sources__links strong { color: var(--sb-bad, #c53030); }

    /* Files not yet catalogued: loose sheets, only outlined, waiting to be filed. */
    .sb-sources__group { grid-column: 1 / -1; margin-top: 6px; padding: 0 2px; color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
    .sb-sources__file { display: flex; flex-direction: column; gap: 4px; padding: 10px 14px; border: 1.5px dashed var(--sb-warn, #d69e2e); border-radius: 2px; font-size: 12px; }
    .sb-sources__path { overflow-wrap: anywhere; font: 12px/1.5 ui-monospace, Menlo, Consolas, monospace; }
    .sb-sources__size { color: var(--sb-muted, #616e7c); }`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // What kind of material it is, and the file's type: "transcript · txt".
  function formatOf(source) {
    const type = (source.path ?? '').match(/\.(\w+)$/)?.[1]?.toLowerCase();
    return [source.format, type !== source.format && type].filter(Boolean).join(' · ');
  }

  function sizeOf(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  // The words a search looks through: the id, title, summary, author and tags.
  const searchable = (source) => [source.id, source.title, source.summary, source.author, ...(source.tags ?? [])].join(' ').toLowerCase();

  // The details a viewer can filter by, in the order they're offered.
  const FACETS = [['author', 'Author'], ['format', 'Format'], ['stance', 'Stance'], ['status', 'Status']];
  const STATUSES = ['inbox', 'catalogued', 'reviewed', 'superseded'];

  // Dates as whole days, so the slider moves a day at a time. Anything that isn't a date is NaN.
  const DAY = 24 * 60 * 60 * 1000;
  const dayOf = (date) => Math.floor(Date.parse(date) / DAY);
  const dateOf = (day) => new Date(day * DAY).toISOString().slice(0, 10);

  // Primary material is what people wrote or said; derived material is an analysis of it.
  const isPrimary = (source) => !source.derivedFrom?.length;

  // Orders by one detail in natural order ("Part 2" before "Part 10"), with sources missing it last
  // whichever way it runs.
  const by = (key, direction = 1) => (a, b) => {
    if (!a[key] || !b[key]) return Boolean(b[key]) - Boolean(a[key]);
    return direction * String(a[key]).localeCompare(String(b[key]), undefined, { numeric: true, sensitivity: 'base' });
  };

  const SORTS = {
    newest: { label: 'Newest written', compare: by('authored', -1) },
    oldest: { label: 'Oldest written', compare: by('authored') },
    title: { label: 'Title', compare: by('title') },
    author: { label: 'Author', compare: by('author') }
  };

  function addStyle() {
    if (document.getElementById('sb-sources-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-sources-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbSources extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._catalogue = [];
      this._files = [];
      this._query = '';
      this._filter = {};
      this._sort = null;
      this._selected = null;
      this._highlight = [];
      this._pointed = null;

      this.addEventListener('input', (e) => {
        if (e.target.matches('.sb-sources__search')) this.query = e.target.value;
        if (e.target.matches('.sb-sources__handle')) this._slide(e.target);
      });
      this.addEventListener('change', (e) => { if (e.target.matches('.sb-sources__sort')) this.sort = e.target.value || null; });
      this.addEventListener('pointerover', (e) => this._pointAt(this._idAt(e.target)));
      this.addEventListener('pointerleave', () => this._pointAt(null));
      this.addEventListener('focusin', (e) => this._pointAt(this._idAt(e.target)));
      this.addEventListener('focusout', (e) => { if (!this.contains(e.relatedTarget)) this._pointAt(null); });
      this.addEventListener('click', (e) => { this._toggleValue(e.target); this._open(this._idAt(e.target)); });
      this.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.sb-sources__card')) { e.preventDefault(); this._open(this._idAt(e.target)); }
      });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-sources');
      if (!this.querySelector('.sb-sources__bar')) {
        this.innerHTML = `
          <div class="sb-sources__bar">
            <input class="sb-sources__search" type="search" placeholder="Search sources" aria-label="Search sources">
            <span class="sb-sources__sorter"><select class="sb-sources__sort" aria-label="Sort by">
              <option value="">Catalogue order</option>
              ${Object.entries(SORTS).map(([key, { label }]) => `<option value="${key}">${label}</option>`).join('')}
            </select></span>
            <span class="sb-sources__count"></span>
          </div>
          <div class="sb-sources__filters">
            <div class="sb-sources__chips"></div>
            <div class="sb-sources__written"></div>
            <div class="sb-sources__show"></div>
          </div>
          <ul class="sb-sources__list"></ul>`;
      }
      this.querySelector('.sb-sources__search').value = this._query;
      this.querySelector('.sb-sources__sort').value = this._sort ?? '';
      this._renderDates();
      this._render();
    }

    // ---- Public API ----

    // The catalogue's entries: [{ id, title, path, format, author, authored, status, … }].
    get catalogue() { return this._catalogue; }
    set catalogue(sources) {
      this._catalogue = (sources || []).map((source) => ({ ...source }));
      this._renderDates();
      this._render();
    }

    // The files in the sandbox's sources folder, as the server lists them: [{ path, size, modified }].
    get files() { return this._files; }
    set files(files) {
      this._files = (files || []).map((file) => ({ ...file }));
      this._render();
    }

    get query() { return this._query; }
    set query(text) {
      this._query = String(text ?? '');
      const box = this.querySelector('.sb-sources__search');
      if (box && box.value !== this._query) box.value = this._query;
      this._render();
    }

    // { author: [...], format: [...], stance: [...], status: [...], written: [from, to], primary: true }:
    // the values chosen in each detail, and the dates written between. Any value chosen in a detail
    // shows; every detail must agree.
    get filter() { return this._filter; }
    set filter(filter) {
      this._filter = {};
      for (const [key] of FACETS) if (filter?.[key]?.length) this._filter[key] = filter[key].map(String);
      if (filter?.written?.length === 2) this._filter.written = filter.written.map(String);
      if (filter?.primary) this._filter.primary = true;
      this._renderDates();
      this._render();
    }

    // 'newest', 'oldest', 'title', 'author', or null for the catalogue's own order.
    get sort() { return this._sort; }
    set sort(key) {
      this._sort = SORTS[key] ? key : null;
      const menu = this.querySelector('.sb-sources__sort');
      if (menu) menu.value = this._sort ?? '';
      this._render();
    }

    get selected() { return this._selected; }
    set selected(id) {
      this._selected = id ?? null;
      this._showMarks();
    }

    get highlight() { return this._highlight; }
    set highlight(ids) {
      this._highlight = (ids || []).map(String);
      this._showMarks();
    }

    // ---- Rendering ----

    _render() {
      const list = this.querySelector('.sb-sources__list');
      if (!list) return;
      const shown = this._shown();
      if (this._sort) shown.sort(SORTS[this._sort].compare);
      const uncatalogued = this._uncatalogued();
      const total = this._catalogue.length;
      const count = shown.length === total ? `${total} ${total === 1 ? 'source' : 'sources'}` : `${shown.length} of ${total} sources`;
      this.querySelector('.sb-sources__count').textContent = count + (uncatalogued.length ? ` · ${uncatalogued.length} not yet catalogued` : '');
      this.querySelector('.sb-sources__chips').innerHTML = this._chipsHtml();
      this.querySelector('.sb-sources__show').innerHTML = this._showHtml();

      const cards = shown.map((source) => this._cardHtml(source)).join('');
      const files = uncatalogued.map((file) => this._fileHtml(file)).join('');
      const empty = !total ? 'No sources catalogued yet.' : !shown.length ? 'No sources match.' : '';
      list.innerHTML = (empty ? `<li class="sb-sources__empty">${empty}</li>` : cards) +
        (files ? `<li class="sb-sources__group">Not yet catalogued</li>${files}` : '');
      this._showMarks();
    }

    // The sources the search and filters let through. `except` leaves one detail's filter out,
    // to count what each of its values would show.
    _shown(except = null) {
      const words = this._query.toLowerCase().split(/\s+/).filter(Boolean);
      const chosen = FACETS.map(([key]) => [key, this._filter[key]]).filter(([key, values]) => values && key !== except);
      const { written, primary } = this._filter;
      return this._catalogue.filter((source) =>
        words.every((word) => searchable(source).includes(word)) &&
        chosen.every(([key, values]) => values.includes(String(source[key] ?? ''))) &&
        (!written || except === 'written' || this._writtenWithin(source, written)) &&
        (!primary || except === 'primary' || isPrimary(source)));
    }

    // Undated sources are left out once a stretch of dates is chosen, since they can't be placed in it.
    _writtenWithin(source, [from, to]) {
      const day = dayOf(source.authored);
      return day >= dayOf(from) && day <= dayOf(to);
    }

    // Each detail's values, with how many sources each would show alongside the other filters.
    // Every value in the catalogue stays offered, so choosing one never hides the others.
    _chipsHtml() {
      return FACETS.map(([key, label]) => {
        const values = this._valuesOf(key);
        if (!values.length) return '';
        const others = this._shown(key);
        const chips = values.map((value) => {
          const count = others.filter((source) => String(source[key] ?? '') === value).length;
          const name = key === 'status' ? `<span class="sb-sources__status sb-sources__status--${esc(value.replace(/\W+/g, '-'))}">${esc(value)}</span>` : esc(value);
          return this._chipHtml(name, count, this._filter[key]?.includes(value), `data-facet="${key}" data-value="${esc(value)}"`);
        }).join('');
        return `<span class="sb-sources__facet">${label}</span><span class="sb-sources__values">${chips}</span>`;
      }).join('');
    }

    _showHtml() {
      if (!this._catalogue.length) return '';
      const primary = this._shown('primary').filter(isPrimary).length;
      const anything = Object.keys(this._filter).length;
      return `<span class="sb-sources__facet">Show</span><span class="sb-sources__values">
        ${this._chipHtml('Primary only', primary, this._filter.primary, 'data-facet="primary"')}
        ${anything ? '<button class="sb-sources__clear" type="button">Clear filters</button>' : ''}</span>`;
    }

    // The slider over every date a source was written, its handles at the chosen stretch.
    // Drawn only when the catalogue or filter is set, so dragging never replaces a handle.
    _renderDates() {
      const holder = this.querySelector('.sb-sources__written');
      if (!holder) return;
      const days = this._catalogue.map((source) => dayOf(source.authored)).filter(Number.isFinite);
      const first = Math.min(...days);
      const last = Math.max(...days);
      if (!(last > first)) { holder.innerHTML = ''; return; }
      this._span = { first, last };
      const [from, to] = this._filter.written?.map(dayOf) ?? [first, last];
      const ticks = days.map((day) => `<span class="sb-sources__tick" data-day="${day}" style="left: ${this._place(day)}%"></span>`).join('');
      const handle = (value, label) =>
        `<input class="sb-sources__handle" type="range" min="${first}" max="${last}" step="1" value="${value}" aria-label="${label}">`;
      holder.innerHTML = `
        <span class="sb-sources__facet">Written</span>
        <div class="sb-sources__dates">
          <div class="sb-sources__range">
            <div class="sb-sources__rail"><div class="sb-sources__track"></div><div class="sb-sources__span"></div>${ticks}</div>
            ${handle(Math.max(from, first), 'Written from')}
            ${handle(Math.min(to, last), 'Written to')}
          </div>
          <span class="sb-sources__between"></span>
        </div>`;
      this._showDates();
    }

    // Where a day sits along the slider, as a percentage.
    _place(day) {
      return ((day - this._span.first) / (this._span.last - this._span.first)) * 100;
    }

    // The filled stretch between the handles, the dates it runs between, and the ticks outside it faded.
    _showDates() {
      const [from, to] = [...this.querySelectorAll('.sb-sources__handle')].map((handle) => Number(handle.value));
      if (from == null) return;
      const span = this.querySelector('.sb-sources__span');
      span.style.left = `${this._place(from)}%`;
      span.style.width = `${this._place(to) - this._place(from)}%`;
      for (const tick of this.querySelectorAll('.sb-sources__tick')) {
        const day = Number(tick.dataset.day);
        tick.classList.toggle('sb-sources__tick--out', day < from || day > to);
      }
      this.querySelector('.sb-sources__between').textContent = `${dateOf(from)} – ${dateOf(to)}`;
    }

    _chipHtml(name, count, on, data) {
      return `<button class="sb-sources__value${count || on ? '' : ' sb-sources__value--none'}" type="button" aria-pressed="${Boolean(on)}" ${data}>${name}<span class="sb-sources__tally">${count}</span></button>`;
    }

    // A detail's values across the catalogue: statuses in the order a source moves through them,
    // the rest most common first.
    _valuesOf(key) {
      const tally = new Map();
      for (const source of this._catalogue) if (source[key]) tally.set(String(source[key]), (tally.get(String(source[key])) ?? 0) + 1);
      const order = key === 'status'
        ? (a, b) => (STATUSES.indexOf(a) + 1 || 99) - (STATUSES.indexOf(b) + 1 || 99)
        : (a, b) => tally.get(b) - tally.get(a) || a.localeCompare(b);
      return [...tally.keys()].sort(order);
    }

    // Files in the folder that no source's path names, the catalogue itself aside.
    _uncatalogued() {
      const known = new Set(this._catalogue.map((source) => source.path));
      return this._files.filter((file) => !known.has(file.path) && !/(^|\/)catalogue\.json$/.test(file.path) && !/(^|\/)\.gitkeep$/.test(file.path));
    }

    _cardHtml(source) {
      const format = formatOf(source);
      const superseded = source.status === 'superseded' || this._supersededBy(source.id);
      return `
        <li class="sb-sources__card${superseded ? ' sb-sources__card--superseded' : ''}" tabindex="0" data-ref="${esc(source.id)}">
          <div class="sb-sources__paper">
            <div class="sb-sources__running">
              <span class="sb-sources__id">${esc(source.id)}</span>
              ${format ? `<span class="sb-sources__format">${esc(format)}</span>` : ''}
            </div>
            <h4 class="sb-sources__title"><span class="sb-sources__name">${esc(source.title ?? source.path ?? '')}</span></h4>
            <div class="sb-sources__summary">${esc(source.summary ?? '')}</div>
            ${this._fieldsHtml(source)}
            ${this._linksHtml(source)}
          </div>
        </li>`;
    }

    // Each detail labelled, so nothing needs guessing. Only what the catalogue gives is shown.
    _fieldsHtml(source) {
      const fields = [
        ['Author', source.author],
        ['Written', source.authored],
        ['Status', source.status, 'status']
      ].filter(([, value]) => value);
      if (!fields.length) return '';
      const html = fields.map(([label, value, kind]) => {
        const kindClass = kind ? ` class="sb-sources__${kind} sb-sources__${kind}--${esc(String(value).replace(/\W+/g, '-'))}"` : '';
        return `<div><dt>${label}</dt><dd${kindClass}>${esc(value)}</dd></div>`;
      }).join('');
      return `<dl class="sb-sources__fields">${html}</dl>`;
    }

    // How it stands among the others: what replaced it, what it replaced, and what it came from.
    _linksHtml(source) {
      const by = this._supersededBy(source.id);
      const links = [
        by && `<strong>Superseded by ${esc(by.id)}</strong>`,
        source.supersedes && `Supersedes ${esc(source.supersedes)}`,
        source.derivedFrom?.length && `Derived from ${source.derivedFrom.map(esc).join(', ')}`
      ].filter(Boolean).join(' · ');
      return links ? `<div class="sb-sources__links">${links}</div>` : '';
    }

    _supersededBy(id) {
      return this._catalogue.find((source) => source.supersedes === id);
    }

    _fileHtml(file) {
      return `
        <li class="sb-sources__file">
          <span class="sb-sources__path">${esc(file.path)}</span>
          ${file.size != null ? `<span class="sb-sources__size">${sizeOf(file.size)}</span>` : ''}
        </li>`;
    }

    _showMarks() {
      const lit = new Set([...this._highlight, this._pointed].filter(Boolean));
      for (const card of this.querySelectorAll('.sb-sources__card')) {
        const selected = card.dataset.ref === this._selected;
        card.classList.toggle('sb-sources__card--lit', lit.has(card.dataset.ref));
        card.classList.toggle('sb-sources__card--selected', selected);
        card.toggleAttribute('aria-current', selected);
      }
    }

    // ---- Interaction ----

    // A handle can't pass the other. Both at the ends means no stretch is chosen.
    _slide(handle) {
      const [from, to] = this.querySelectorAll('.sb-sources__handle');
      if (Number(from.value) > Number(to.value)) handle.value = handle === from ? to.value : from.value;
      for (const each of [from, to]) each.style.zIndex = each === handle ? 1 : ''; // the one moved last stays on top
      const whole = Number(from.value) === this._span.first && Number(to.value) === this._span.last;
      if (whole) delete this._filter.written;
      else this._filter.written = [dateOf(Number(from.value)), dateOf(Number(to.value))];
      this._showDates();
      this._render();
    }

    // A chip turns its value on or off; Clear turns every filter off.
    _toggleValue(target) {
      if (target.closest('.sb-sources__clear')) { this.filter = {}; return; }
      const chip = target.closest('.sb-sources__value');
      if (!chip || !this.contains(chip)) return;
      const { facet, value } = chip.dataset;
      const filter = { ...this._filter };
      if (facet === 'primary') filter.primary = !filter.primary;
      else {
        const values = filter[facet] ?? [];
        filter[facet] = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
      }
      this.filter = filter;
      // The chips are drawn again, so focus moves to the new one.
      [...this.querySelectorAll('.sb-sources__value')].find((c) => c.dataset.facet === facet && c.dataset.value === value)?.focus();
    }

    _idAt(target) {
      const card = target?.closest?.('.sb-sources__card');
      return card && this.contains(card) ? card.dataset.ref : null;
    }

    _pointAt(id) {
      if (id === this._pointed) return;
      this._pointed = id;
      this._showMarks();
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail: { id } }));
    }

    _open(id) {
      if (!id) return;
      this.selected = id;
      this.dispatchEvent(new CustomEvent('sb-open', { bubbles: true, detail: { id } }));
    }
  }

  customElements.define('sb-sources', SbSources);
})();
