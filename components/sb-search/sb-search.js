// Sandkit sb-search 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A collection to search, filter, sort and group, shown as a list, a grid or a table, in the page or
// full screen. Domain-agnostic: give it an array of objects and it works out the rest; say more
// through `fields`, or hand it functions of your own where the sandbox knows better.
//
//   <sb-search view="grid"></sb-search>
//   search.items = model.services;
//   search.fields = [{ key: 'operator', label: 'Operator', filter: true, group: true }, …];
//   search.card = { title: 'name', subtitle: 'route', details: ['operator', 'delay'] };
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-search';
  const existing = customElements.get('sb-search');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-search>, so only one can run. Rename one by replacing every "sb-search" in its file.`);
    }
    return;
  }

  const STYLES = `
    .sb-search { display: flex; flex-direction: column; min-height: 0; color: var(--sb-text, #1f2933); font: 13px/1.45 var(--sb-font, system-ui, sans-serif); }
    /* Parts set apart: the whole within a border, the criteria lifted, the results dropped a step below. */
    .sb-search { --sb-search-lift: var(--sb-lift, rgba(255, 255, 255, 0.7)); --sb-search-shadow: var(--sb-lift-shadow, 0 1px 2px rgba(16, 24, 40, 0.07)); }
    .sb-search__frame { container-type: inline-size; flex: 1; display: flex; flex-direction: column; gap: 10px; min-height: 0; padding: 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); }
    .sb-search__criteria { flex: none; display: grid; gap: 8px; padding: 10px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-search-lift); box-shadow: var(--sb-search-shadow); }

    /* Full screen: the frame lies over the page, the criteria stay put and the results scroll under them. */
    .sb-search__frame--full { position: fixed; inset: 0; z-index: 1000; padding: 16px; border: 0; border-radius: 0; background: var(--sb-bg, #f5f6f8); }

    /* The criteria: search, then how to order and show, then the filters. */
    .sb-search__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; }
    .sb-search__query { flex: 1 1 260px; display: flex; min-width: 0; }
    .sb-search__input { flex: 1; min-width: 0; padding: 5px 9px; border: 1px solid var(--sb-border, #d5d9e0); border-right: 0; border-radius: var(--sb-radius, 8px) 0 0 var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: inherit; font: inherit; }
    .sb-search__input[aria-invalid="true"] { border-color: var(--sb-bad, #c53030); }
    .sb-search__input:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -1px; }
    .sb-search__regex { flex: none; min-width: 34px; padding: 0 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 0 var(--sb-radius, 8px) var(--sb-radius, 8px) 0; background: var(--sb-surface-2, #eef0f3); color: var(--sb-muted, #616e7c); font: 600 12px ui-monospace, Menlo, Consolas, monospace; cursor: pointer; }
    .sb-search__regex[aria-pressed="true"] { border-color: var(--sb-accent, #2563eb); background: var(--sb-accent, #2563eb); color: var(--sb-accent-text, #fff); }
    .sb-search__count { flex: none; color: var(--sb-muted, #616e7c); font-size: 12px; font-variant-numeric: tabular-nums; }
    .sb-search__problem { margin: -2px 0 0; color: var(--sb-bad, #c53030); font-size: 12px; }
    .sb-search__problem:empty { display: none; }
    .sb-search__spacer { flex: 1; }

    .sb-search__choose { display: inline-flex; align-items: center; gap: 6px; }
    .sb-search__facet { color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
    /* The browser's own arrow drawn over with a plain chevron in the theme's colours. */
    .sb-search__picker { position: relative; display: inline-flex; }
    .sb-search__picker::after { content: ''; position: absolute; top: 50%; right: 10px; width: 5px; height: 5px; margin-top: -4px; border: solid var(--sb-muted, #616e7c); border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); pointer-events: none; }
    .sb-search__select { appearance: none; padding: 3px 26px 3px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: inherit; font: 12px/1.5 var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-search__select:hover { border-color: var(--sb-muted, #616e7c); }

    .sb-search__button { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); color: inherit; font: 12px/1.5 var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-search__button:hover, .sb-search__regex:hover { border-color: var(--sb-muted, #616e7c); }
    .sb-search__direction { min-width: 30px; justify-content: center; padding: 3px 6px; }
    .sb-search__views { display: inline-flex; }
    .sb-search__views .sb-search__button { margin-left: -1px; border-radius: 0; background: var(--sb-surface, #fff); }
    .sb-search__views .sb-search__button:first-child { margin-left: 0; border-radius: var(--sb-radius, 8px) 0 0 var(--sb-radius, 8px); }
    .sb-search__views .sb-search__button:last-child { border-radius: 0 var(--sb-radius, 8px) var(--sb-radius, 8px) 0; }
    .sb-search__views .sb-search__button[aria-pressed="true"] { position: relative; border-color: var(--sb-accent, #2563eb); background: var(--sb-accent-soft, #eaf0ff); font-weight: 600; }
    .sb-search__icon { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.5; }

    /* Filters: each value with how many items it would show, so the collection's shape shows at a glance. */
    .sb-search__filters { display: grid; grid-template-columns: max-content 1fr; gap: 5px 10px; align-items: baseline; }
    .sb-search__filters > .sb-search__facet--ranged { align-self: center; }
    .sb-search__filters:empty, .sb-search__filters[hidden] { display: none; }
    .sb-search__filtering { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
    .sb-search__toggle { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; background: none; color: var(--sb-muted, #616e7c); font: 600 11px/1.5 var(--sb-font, system-ui, sans-serif); letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; }
    .sb-search__toggle::before { content: ''; width: 5px; height: 5px; margin: 0 1px 2px; border: solid currentColor; border-width: 0 1.5px 1.5px 0; transform: rotate(-45deg); transition: transform 0.12s; }
    .sb-search__toggle[aria-expanded="true"]::before { transform: rotate(45deg); }
    .sb-search__toggle:hover { color: var(--sb-text, #1f2933); }
    .sb-search__chosen { min-width: 0; overflow: hidden; color: var(--sb-muted, #616e7c); font-size: 12px; white-space: nowrap; text-overflow: ellipsis; }
    .sb-search__chosen strong { color: var(--sb-text, #1f2933); font-weight: 600; }
    .sb-search__values { display: flex; flex-wrap: wrap; gap: 4px; }
    .sb-search__value { display: inline-flex; align-items: baseline; gap: 5px; padding: 1px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 999px; background: var(--sb-surface, #fff); color: inherit; font: 12px/1.5 var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-search__value:hover { border-color: var(--sb-muted, #616e7c); }
    .sb-search__value[aria-pressed="true"] { border-color: var(--sb-accent, #2563eb); background: var(--sb-accent-soft, #eaf0ff); font-weight: 600; }
    .sb-search__value--none { opacity: 0.45; }
    .sb-search__tally { color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 400; font-variant-numeric: tabular-nums; }
    /* A range: two handles choosing a stretch of a field's span, with a tick for each value, faded where the other
       criteria rule it out. Padded to breathe among the rows of values; the rail sits in from the ends by half a
       handle, so ticks line up with handles. */
    .sb-search__ranged { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 6px 0; }
    .sb-search__range { --sb-search-handle: 14px; position: relative; flex: 1; max-width: 420px; height: 22px; }
    .sb-search__rail { position: absolute; inset: 0 calc(var(--sb-search-handle) / 2); }
    .sb-search__track, .sb-search__span { position: absolute; top: 9px; height: 4px; border-radius: 2px; }
    .sb-search__track { left: 0; right: 0; background: var(--sb-surface-2, #eef0f3); box-shadow: inset 0 0 0 1px var(--sb-border, #d5d9e0); }
    .sb-search__span { background: var(--sb-accent, #2563eb); }
    .sb-search__tick { position: absolute; top: 0; width: 2px; height: 7px; margin-left: -1px; border-radius: 1px; background: var(--sb-text, #1f2933); opacity: 0.7; }
    .sb-search__tick--out { opacity: 0.2; }
    .sb-search__handle { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; appearance: none; background: none; pointer-events: none; }
    .sb-search__handle::-webkit-slider-thumb { appearance: none; width: var(--sb-search-handle); height: var(--sb-search-handle); margin-top: 4px; border: 2px solid var(--sb-accent, #2563eb); border-radius: 50%; background: var(--sb-surface, #fff); cursor: grab; pointer-events: auto; }
    .sb-search__handle::-moz-range-thumb { width: 10px; height: 10px; border: 2px solid var(--sb-accent, #2563eb); border-radius: 50%; background: var(--sb-surface, #fff); cursor: grab; pointer-events: auto; }
    .sb-search__handle::-webkit-slider-runnable-track { height: 22px; background: none; }
    .sb-search__handle:focus-visible { outline: none; }
    .sb-search__handle:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px var(--sb-accent-soft, #eaf0ff); }
    .sb-search__handle:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 3px var(--sb-accent-soft, #eaf0ff); }
    .sb-search__between { flex: none; font-size: 12px; font-variant-numeric: tabular-nums; }
    .sb-search__clear { padding: 0; border: 0; background: none; color: var(--sb-accent, #2563eb); font: 12px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-search__clear:hover { text-decoration: underline; }

    .sb-search__regex:focus-visible, .sb-search__button:focus-visible, .sb-search__select:focus-visible, .sb-search__value:focus-visible,
    .sb-search__clear:focus-visible, .sb-search__more:focus-visible, .sb-search__toggle:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }

    /* The results, dropped below the criteria so the items stand on them. */
    .sb-search__results { --sb-search-inset: 12px; flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: var(--sb-search-inset); border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-drop, rgba(16, 24, 40, 0.04)); }
    .sb-search__group + .sb-search__group { margin-top: 16px; }
    .sb-search__heading { margin: 0 2px 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--sb-muted, #616e7c); }
    .sb-search__heading .sb-search__tally { margin-left: 6px; letter-spacing: 0; }
    .sb-search__items { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
    .sb-search__items--grid { grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px; }
    .sb-search__empty { margin: 0; padding: 4px 2px; color: var(--sb-muted, #616e7c); }
    .sb-search__more { display: block; margin: 12px auto 0; padding: 4px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 999px; background: var(--sb-surface, #fff); color: inherit; font: 12px/1.5 var(--sb-font, system-ui, sans-serif); cursor: pointer; }

    /* An item: a card in a grid, a row in a list. Tone is a bar down its edge. */
    .sb-search__item { --sb-search-tone: transparent; position: relative; min-width: 0; padding: 8px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); box-shadow: inset 3px 0 var(--sb-search-tone), var(--sb-search-shadow); cursor: pointer; }
    .sb-search__item[data-tone="good"] { --sb-search-tone: var(--sb-good, #3f9142); }
    .sb-search__item[data-tone="warn"] { --sb-search-tone: var(--sb-warn, #d69e2e); }
    .sb-search__item[data-tone="bad"] { --sb-search-tone: var(--sb-bad, #c53030); }
    .sb-search__item:hover, .sb-search__item--highlighted { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-search__item--highlighted { border-color: var(--sb-accent, #2563eb); }
    .sb-search__item--selected { border-color: var(--sb-accent, #2563eb); box-shadow: inset 3px 0 var(--sb-search-tone), 0 0 0 1px var(--sb-accent, #2563eb), var(--sb-search-shadow); }
    .sb-search__item:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-search__title { font-weight: 600; overflow-wrap: anywhere; }
    .sb-search__subtitle { color: var(--sb-muted, #616e7c); overflow-wrap: anywhere; }
    .sb-search__details { display: flex; flex-wrap: wrap; gap: 2px 12px; margin: 0; font-size: 12px; }
    .sb-search__detail { display: inline-flex; gap: 5px; min-width: 0; }
    .sb-search__detail dt { color: var(--sb-muted, #616e7c); }
    .sb-search__detail dd { margin: 0; font-variant-numeric: tabular-nums; }
    /* Where the search found an item, as a note on a band of its own, apart from the item's own text. */
    .sb-search__found { flex-basis: 100%; margin: 6px 0 0; padding: 3px 8px; border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); color: var(--sb-muted, #616e7c); font-size: 12px; overflow-wrap: anywhere; }
    .sb-search__found-label { margin-right: 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
    .sb-search__found-field { color: var(--sb-text, #1f2933); font-weight: 600; }
    .sb-search__items--list .sb-search__item { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 12px; padding: 6px 12px; }
    .sb-search__items--list .sb-search__subtitle { flex: 1 1 160px; }
    .sb-search__items--list .sb-search__details { margin-left: auto; justify-content: flex-end; }
    .sb-search__items--grid .sb-search__item { display: flex; flex-direction: column; gap: 2px; }
    .sb-search__items--grid .sb-search__details { flex-direction: column; margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--sb-surface-2, #eef0f3); }
    .sb-search__items--grid .sb-search__detail dt { flex: none; min-width: 72px; }

    /* The table: one for all groups, so the columns line up between them. */
    .sb-search__table { width: 100%; border-collapse: separate; border-spacing: 0; overflow: clip; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); }
    .sb-search__table th, .sb-search__table td { padding: 5px 10px; text-align: left; vertical-align: baseline; border-bottom: 1px solid var(--sb-surface-2, #eef0f3); }
    .sb-search__table thead th { position: sticky; top: calc(-1 * var(--sb-search-inset)); z-index: 1; background: var(--sb-surface, #fff); color: var(--sb-muted, #616e7c); font-size: 12px; font-weight: 600; border-bottom-color: var(--sb-border, #d5d9e0); }
    .sb-search__table tbody:last-child tr:last-child td { border-bottom: 0; }
    .sb-search__table .sb-search__heading { margin: 0; padding: 12px 10px 4px; background: var(--sb-surface, #fff); }
    .sb-search__table .sb-search__item { display: table-row; padding: 0; border: 0; border-radius: 0; box-shadow: none; }
    .sb-search__table .sb-search__item td:first-child { box-shadow: inset 3px 0 var(--sb-search-tone); }
    .sb-search__table .sb-search__item--selected td { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-search__table .sb-search__item--selected td:first-child { box-shadow: inset 3px 0 var(--sb-accent, #2563eb); }
    .sb-search__table .sb-search__item:focus-visible { outline-offset: -2px; }
    .sb-search__table .sb-search__cell--number { text-align: right; font-variant-numeric: tabular-nums; }

    /* The detail: the sandbox's own content, in a pane beside the results while an item is chosen. */
    .sb-search__body { flex: 1; display: flex; align-items: flex-start; gap: 10px; min-height: 0; }
    .sb-search__body > .sb-search__results { flex: 3 1 0; align-self: stretch; }
    .sb-search__pane { position: sticky; top: 0; flex: 2 1 0; display: flex; flex-direction: column; max-height: 100%; min-width: 0; overflow: hidden; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-search-lift); box-shadow: var(--sb-search-shadow); }
    .sb-search__pane[hidden] { display: none; }
    /* Too narrow for two columns: the pane goes under the results. */
    @container (max-width: 640px) {
      .sb-search__body { flex-direction: column; align-items: stretch; }
      .sb-search__body > .sb-search__results { flex: 1 1 auto; }
      .sb-search__pane { position: static; flex: none; max-height: 50%; }
    }
    .sb-search__pane-head { flex: none; display: flex; align-items: center; gap: 8px; padding: 6px 6px 6px 12px; border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-search__pane-title { flex: 1; min-width: 0; overflow: hidden; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }
    .sb-search__close { flex: none; width: 26px; height: 26px; padding: 0; border: 0; border-radius: var(--sb-radius, 8px); background: none; color: var(--sb-muted, #616e7c); font: 18px/1 var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-search__close:hover { background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); }
    .sb-search__close:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-search__pane-body { flex: 1; min-height: 0; overflow-y: auto; padding: 10px 12px; }
    .sb-search__free { display: contents; }

    .sb-search__match { padding: 0 1px; border-radius: 2px; background: color-mix(in srgb, var(--sb-warn, #d69e2e) 35%, transparent); color: inherit; }`;

  const VIEWS = { list: 'List', grid: 'Grid', table: 'Table' };
  const DEFAULT_LIMIT = 200;
  const MOST_FILTER_VALUES = 8; // more than this many values makes a filter too long to read
  const NOT_SET = 'Not set';
  const MOST_FOUND_IN = 2;     // fields named in a "Found in" line before the rest are counted
  const EXCERPT_LENGTH = 80;   // characters of a long field shown around a match

  const ICONS = {
    enter: '<svg class="sb-search__icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 4.5V1h3.5M11 4.5V1H7.5M1 7.5V11h3.5M11 7.5V11H7.5"/></svg>',
    leave: '<svg class="sb-search__icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 1v3.5H1M7.5 1v3.5H11M4.5 11V7.5H1M7.5 11V7.5H11"/></svg>'
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const naturally = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare;
  const isEmpty = (value) => value == null || value === '' || (Array.isArray(value) && !value.length);
  const asList = (value) => (Array.isArray(value) ? value : [value]);
  const keyOf = (value) => (isEmpty(value) ? '' : String(value)); // filters and groups match values as text
  // A field's values as filters and groups see them: each once, as text, and an empty list as Not set.
  const keysOf = (value) => {
    const keys = [...new Set(asList(value).map(keyOf))];
    return keys.length ? keys : [''];
  };
  const asNumber = (value) => (value instanceof Date ? value.getTime() : value); // timestamps range like numbers

  const sortOf = (value) => (value?.key ? { key: value.key, direction: value.direction === 'descending' ? 'descending' : 'ascending' } : null);
  const chosenOf = (filters) => Object.fromEntries(Object.entries(filters || {}).map(([key, list]) => [key, new Set(asList(list).map(keyOf))]));
  const escapeForPattern = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Numbers by size, text naturally ("Item 2" before "Item 10"), empty values last.
  function compareValues(a, b) {
    if (isEmpty(a) || isEmpty(b)) return isEmpty(a) - isEmpty(b);
    return typeof a === 'number' && typeof b === 'number' ? a - b : naturally(String(a), String(b));
  }

  function addStyle() {
    if (document.getElementById('sb-search-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-search-style', textContent: STYLES });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbSearch extends HTMLElement {
    static origin = ORIGIN;

    static observedAttributes = ['view', 'limit', 'empty-text', 'placeholder', 'detail'];

    constructor() {
      super();
      this._items = [];
      this._givenFields = null;
      this._givenCard = null;
      this._columns = [];      // the fields as used: every flag and function filled in
      this._rows = [];         // each item with its values and texts worked out once
      this._query = '';
      this._regex = false;
      this._filters = {};      // key → Set of chosen values, as text
      this._ranges = {};       // key → { from, to }, only while narrower than the field's span
      this._presets = [];
      this._preset = null;     // the preset the criteria still match, until something changes them
      this._sort = null;
      this._group = null;
      this._selected = null;
      this._highlight = new Set();
      this._showAll = false;
      this._filtersOpen = true;
      this._drawn = [];        // the items drawn, so a click finds its item by index
      this._detail = null;     // the sandbox's detail content, kept across rebuilds
      this._built = false;
      this.match = null;
      this.filter = null;
      this.addEventListener('click', (e) => this._onClick(e));
      this.addEventListener('input', (e) => this._onInput(e));
      this.addEventListener('change', (e) => this._onChange(e));
      this.addEventListener('keydown', (e) => this._onKey(e));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-search');
      if (!this._built) this._build();
    }

    attributeChangedCallback(name) {
      if (!this._built) return;
      if (name === 'detail') return this._build();
      if (name === 'placeholder') this.querySelector('.sb-search__input').placeholder = this.getAttribute('placeholder') || 'Search…';
      if (name === 'view') {
        for (const button of this.querySelectorAll('[data-view]')) button.setAttribute('aria-pressed', button.dataset.view === this.view);
      }
      this._renderResults();
    }

    // ---- Public API ----

    get items() { return this._items; }
    // The chosen item is kept across new items with the same id, so its detail stays open.
    set items(list) {
      this._items = list || [];
      if (this._selected && !isEmpty(this._selected.id)) {
        this._selected = this._items.find((item) => item.id === this._selected.id) ?? null;
      }
      this._prepare();
    }

    get fields() { return this._columns.map(({ key, label, search, sort, filter, group, range }) => ({ key, label, search, sort, filter, group, range })); }
    set fields(list) {
      this._givenFields = list?.length ? list : null;
      this._prepare();
    }

    // Which fields the list and grid show: { title, subtitle, details: [key, …] }.
    get card() { return this._card(); }
    set card(value) {
      this._givenCard = value || null;
      this._refresh();
    }

    get view() { return VIEWS[this.getAttribute('view')] ? this.getAttribute('view') : 'list'; }
    set view(value) { this.setAttribute('view', value); }

    get query() { return this._query; }
    set query(text) {
      this._query = String(text ?? '');
      const input = this.querySelector('.sb-search__input');
      if (input) input.value = this._query;
      this._narrowed();
    }

    get regex() { return this._regex; }
    set regex(on) {
      this._regex = !!on;
      this._narrowed();
    }

    // The chosen filter values: { key: [value, …] }.
    get filters() {
      return Object.fromEntries(Object.entries(this._filters).filter(([, chosen]) => chosen.size).map(([key, chosen]) => [key, [...chosen]]));
    }
    set filters(value) {
      this._filters = chosenOf(value);
      this._narrowed();
    }

    // The chosen ranges: { key: [from, to] }.
    get ranges() {
      return Object.fromEntries(Object.entries(this._ranges).map(([key, { from, to }]) => [key, [from, to]]));
    }
    set ranges(value) {
      this._takeRanges(value);
      this._narrowed();
    }

    // Named sets of criteria for the viewer to choose from: [{ label, id, query, regex, filters, ranges, sort, group, view }].
    get presets() { return this._presets; }
    set presets(list) {
      this._presets = list || [];
      if (!this._presets.includes(this._preset)) this._preset = null;
      this._build();
    }

    // The preset the criteria match, by id (or label), or null once anything has changed them. Setting one applies it.
    get preset() { return this._preset ? this._preset.id ?? this._preset.label : null; }
    set preset(name) {
      const preset = this._presets.find((p) => (p.id ?? p.label) === name);
      if (preset) this._apply(preset);
      else {
        this._preset = null;
        this._refresh();
      }
    }

    // { key, direction } with direction 'ascending' (the default) or 'descending', or null for the items' own order.
    get sort() { return this._sort && { ...this._sort }; }
    set sort(value) {
      this._sort = sortOf(value);
      this._preset = null;
      this._build();
    }

    get group() { return this._group; }
    set group(key) {
      this._group = key || null;
      this._preset = null;
      this._build();
    }

    get fullscreen() { return this.hasAttribute('fullscreen'); }
    set fullscreen(on) {
      if (!!on === this.fullscreen) return;
      // Hold the element's place while its frame lies over the page, so nothing behind it moves.
      this.style.minHeight = on ? `${this.offsetHeight}px` : '';
      this.toggleAttribute('fullscreen', !!on);
      this._build();
      this.querySelector('.sb-search__full')?.focus();
    }

    // Ids of the items to point at: one id, a list, or null.
    get highlight() { return [...this._highlight]; }
    set highlight(ids) {
      this._highlight = new Set(isEmpty(ids) ? [] : asList(ids).map(String));
      for (const el of this.querySelectorAll('.sb-search__item[data-ref]')) {
        el.classList.toggle('sb-search__item--highlighted', this._highlight.has(el.dataset.ref));
      }
    }

    get selected() { return this._selected; }
    set selected(item) {
      this._selected = item ?? null;
      this._renderResults();
      this._renderDetail();
    }

    // How the detail is shown: 'pane' beside the results (the default), or 'free' for content that shows itself.
    get detail() { return this.getAttribute('detail') === 'free' ? 'free' : 'pane'; }
    set detail(value) { this.setAttribute('detail', value); }

    // The items the search and filters let through, in the order shown.
    get results() { return this._results().map((row) => row.item); }

    // Scrolls to the item with this id, if the search and filters let it through.
    reveal(ref) {
      const at = this._results().findIndex((row) => String(row.item.id) === String(ref));
      if (at < 0) return false;
      if (at >= this._limit && !this._showAll) {
        this._showAll = true;
        this._renderResults();
      }
      this._partsFor('.sb-search__item', 'ref', String(ref))[0]?.scrollIntoView({ block: 'nearest' });
      return true;
    }

    clear() {
      this._query = '';
      this._filters = {};
      this._ranges = {};
      const input = this.querySelector('.sb-search__input');
      if (input) input.value = '';
      this._narrowed();
    }

    // Whether the filters are shown; closed, the values chosen are listed beside the toggle instead.
    get filtersOpen() { return this._filtersOpen; }
    set filtersOpen(open) {
      this._filtersOpen = !!open;
      this._refresh();
    }

    // A preset sets everything it describes and resets the rest, so it looks the same however it's reached.
    _apply(preset) {
      this._query = String(preset.query ?? '');
      this._regex = !!preset.regex;
      this._filters = chosenOf(preset.filters);
      this._takeRanges(preset.ranges);
      this._sort = sortOf(preset.sort);
      this._group = preset.group || null;
      if (preset.view) this.setAttribute('view', preset.view);
      this._preset = this._presets.includes(preset) ? preset : null;
      this._showAll = false;
      this._build();
    }

    get _limit() { return Number(this.getAttribute('limit')) || DEFAULT_LIMIT; }

    // ---- Working out what to show ----

    // Fills in every field's flags and functions, then works out each item's values once.
    _prepare() {
      const given = this._givenFields || Object.keys(this._items[0] || {}).filter((key) => key !== 'id' && key !== 'tone').map((key) => ({ key }));
      this._columns = given.map((field) => this._column(field));
      this._rows = this._items.map((item, index) => {
        const values = {}, texts = {};
        for (const column of this._columns) {
          values[column.key] = column.valueOf(item);
          texts[column.key] = column.text(values[column.key], item);
        }
        return { item, index, values, texts };
      });
      const known = new Set(this._columns.map((column) => column.key));
      for (const key of Object.keys(this._filters)) if (!known.has(key)) delete this._filters[key];
      for (const key of Object.keys(this._ranges)) if (!this._columnFor(key)?.range) delete this._ranges[key];
      if (this._sort && !known.has(this._sort.key)) this._sort = null;
      if (this._group && !known.has(this._group)) this._group = null;
      this._build();
    }

    _column(field) {
      const given = field.value || ((item) => item[field.key]);
      const valueOf = (item) => { const value = given(item); return Array.isArray(value) ? value.map(asNumber) : asNumber(value); };
      const raw = this._items.flatMap((item) => asList(valueOf(item))).filter((value) => !isEmpty(value));
      const allNumbers = raw.length > 0 && raw.every((value) => typeof value === 'number');
      const min = allNumbers ? Math.min(...raw) : 0;
      const max = allNumbers ? Math.max(...raw) : 0;
      // Text with a few values repeated across the items reads well as a filter; names and numbers don't.
      const values = new Set(raw.map(keyOf));
      const repeats = !allNumbers && values.size >= 2 && values.size <= MOST_FILTER_VALUES && values.size < this._items.length / 2;
      const format = field.format;
      return {
        key: field.key,
        label: field.label ?? field.key,
        valueOf,
        compare: field.compare || compareValues,
        text: (value, item) => (format ? String(format(value, item) ?? '') : asList(value).filter((v) => !isEmpty(v)).join(', ')),
        labelOf: (value) => (isEmpty(value) ? NOT_SET : format ? String(format(value) ?? '') : String(value)),
        number: allNumbers,
        search: field.search ?? true,
        sort: field.sort ?? true,
        filter: field.filter ?? repeats,
        group: field.group ?? repeats,
        range: !!field.range && allNumbers && max > min,
        min, max,
        step: field.step ?? (raw.every(Number.isInteger) ? 1 : 'any')
      };
    }

    _columnFor(key) { return this._columns.find((column) => column.key === key); }

    _card() {
      if (this._givenCard) return { details: [], ...this._givenCard };
      const [title, ...rest] = this._columns.map((column) => column.key);
      return { title, details: rest.slice(0, 4) };
    }

    // The built-in search as a pattern: null when there's no search, undefined when the regex is unreadable.
    _pattern() {
      if (!this._query) return null;
      try { return new RegExp(this._regex ? this._query : escapeForPattern(this._query), 'gi'); }
      catch { return undefined; }
    }

    _searchFits(row, pattern) {
      if (!this._query) return true;
      if (this.match) return this.match(row.item, { text: this._query, regex: this._regex });
      if (!pattern) return true; // an unreadable regex searches nothing out
      return this._columns.some((column) => column.search && (pattern.lastIndex = 0, pattern.test(row.texts[column.key])));
    }

    _filtersFit(row, except) {
      const chosenFit = Object.entries(this._filters).every(([key, chosen]) =>
        key === except || !chosen.size || keysOf(row.values[key]).some((value) => chosen.has(value)));
      return chosenFit && Object.entries(this._ranges).every(([key, { from, to }]) =>
        key === except || asList(row.values[key]).some((value) => typeof value === 'number' && value >= from && value <= to));
    }

    get _isNarrowed() {
      return this._query || Object.values(this._filters).some((chosen) => chosen.size) || Object.keys(this._ranges).length;
    }

    // Ranges as given, { key: [from, to] }, each kept as it is until its field is known.
    _takeRanges(ranges) {
      this._ranges = {};
      for (const [key, [from, to]] of Object.entries(ranges || {})) {
        const column = this._columnFor(key);
        const range = { from: asNumber(from), to: asNumber(to) };
        if (column?.range) this._setRange(column, range);
        else this._ranges[key] = range;
      }
    }

    // Keeps a range only while it's narrower than the field's span, so a full range filters nothing out.
    _setRange(column, { from, to }) {
      from = Math.max(column.min, Math.min(from, to));
      to = Math.min(column.max, to);
      if (from <= column.min && to >= column.max) delete this._ranges[column.key];
      else this._ranges[column.key] = { from, to };
    }

    _passes(row, pattern, except) {
      return (!this.filter || this.filter(row.item)) && this._searchFits(row, pattern) && this._filtersFit(row, except);
    }

    _results() {
      const pattern = this._pattern();
      const passing = this._rows.filter((row) => this._passes(row, pattern));
      const column = this._sort && this._columnFor(this._sort.key);
      if (!column) return passing;
      // Empty values go last whichever way it's sorted; ties keep the items' own order.
      const sign = this._sort.direction === 'descending' ? -1 : 1;
      const by = (a, b) => {
        const [x, y] = [a.values[column.key], b.values[column.key]];
        return isEmpty(x) || isEmpty(y) ? isEmpty(x) - isEmpty(y) : sign * column.compare(x, y);
      };
      return passing.slice().sort((a, b) => by(a, b) || a.index - b.index);
    }

    // Groups in the field's order; an item with several values sits in each of their groups.
    _groups(rows) {
      const column = this._group && this._columnFor(this._group);
      if (!column) return [{ rows }];
      const groups = new Map();
      for (const row of rows) {
        for (const key of keysOf(row.values[column.key])) {
          if (!groups.has(key)) groups.set(key, { value: this._valueFor(row, column, key), rows: [] });
          groups.get(key).rows.push(row);
        }
      }
      return [...groups.values()]
        .sort((a, b) => column.compare(a.value, b.value))
        .map((group) => ({ label: column.labelOf(group.value), rows: group.rows }));
    }

    // Every value of a filter, with how many items it would show alongside the search and the other filters.
    _filterValues(column) {
      const pattern = this._pattern();
      const values = new Map();
      for (const row of this._rows) {
        const counts = this._passes(row, pattern, column.key);
        for (const key of keysOf(row.values[column.key])) {
          if (!values.has(key)) values.set(key, { key, value: this._valueFor(row, column, key), count: 0 });
          if (counts) values.get(key).count++;
        }
      }
      return [...values.values()].sort((a, b) => column.compare(a.value, b.value));
    }

    // The value behind one of a row's keys, so ordering and formats see the value, not its text.
    _valueFor(row, column, key) {
      return asList(row.values[column.key]).find((value) => keyOf(value) === key) ?? '';
    }

    // ---- What viewers do ----

    _onClick(e) {
      const button = e.target.closest('button');
      if (button?.dataset.view) return this._viewerSets(() => { this.view = button.dataset.view; });
      if (button?.dataset.value !== undefined) return this._toggleFilter(button.dataset.key, button.dataset.value);
      if (button?.matches('.sb-search__regex')) return this._viewerSets(() => { this.regex = !this._regex; });
      if (button?.matches('.sb-search__direction')) {
        const direction = this._sort.direction === 'ascending' ? 'descending' : 'ascending';
        return this._viewerSets(() => { this.sort = { ...this._sort, direction }; });
      }
      if (button?.matches('.sb-search__full')) return this._viewerSets(() => { this.fullscreen = !this.fullscreen; });
      if (button?.matches('.sb-search__close')) return this._letGo();
      if (button?.matches('.sb-search__toggle')) return void (this.filtersOpen = !this._filtersOpen);
      if (button?.matches('.sb-search__clear')) return this._viewerSets(() => this.clear());
      if (button?.matches('.sb-search__more')) {
        this._showAll = true;
        return this._renderResults();
      }
      const item = e.target.closest('.sb-search__item');
      if (item) this._choose(item);
    }

    _onInput(e) {
      if (e.target.matches('.sb-search__handle')) return this._moveHandle(e.target);
      if (!e.target.matches('.sb-search__input')) return;
      this._query = e.target.value;
      this._narrowed();
      this._announce();
    }

    _onChange(e) {
      if (e.target.matches('.sb-search__preset')) {
        const preset = this._presets[Number(e.target.value)];
        this._viewerSets(() => this._apply(preset || {})); // None starts afresh
        this.querySelector('.sb-search__preset')?.focus();
      } else if (e.target.matches('.sb-search__sort')) {
        const key = e.target.value;
        this._viewerSets(() => { this.sort = key ? { key, direction: this._sort?.direction } : null; });
        this.querySelector('.sb-search__sort')?.focus();
      } else if (e.target.matches('.sb-search__group')) {
        const key = e.target.value;
        this._viewerSets(() => { this.group = key; });
        this.querySelector('.sb-search__group')?.focus();
      }
    }

    // Escape closes the detail, then full screen; while there's search text it's left to clear that.
    _onKey(e) {
      const clearing = e.target.matches('.sb-search__input:not(:placeholder-shown)');
      if (e.key === 'Escape' && !clearing && this._paneOpen) {
        this._letGo();
      } else if (e.key === 'Escape' && !clearing && this.fullscreen) {
        this._viewerSets(() => { this.fullscreen = false; });
      } else if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.sb-search__item')) {
        e.preventDefault();
        this._choose(e.target);
      }
    }

    _toggleFilter(key, value) {
      const chosen = this._filters[key] ||= new Set();
      chosen.has(value) ? chosen.delete(value) : chosen.add(value);
      this._narrowed();
      this._announce();
    }

    // A handle never passes the other, so the range never turns inside out.
    _moveHandle(handle) {
      const column = this._columnFor(handle.dataset.key);
      const { from, to } = this._ranges[column.key] || { from: column.min, to: column.max };
      const value = Number(handle.value);
      this._setRange(column, handle.dataset.end === 'from' ? { from: Math.min(value, to), to } : { from, to: Math.max(value, from) });
      this._narrowed();
      this._announce();
    }

    _choose(el) {
      this._selected = this._drawn[Number(el.dataset.index)];
      for (const other of this.querySelectorAll('.sb-search__item--selected')) other.classList.remove('sb-search__item--selected');
      el.classList.add('sb-search__item--selected');
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { item: this._selected } }));
      this._renderDetail();
    }

    // Closing the detail lets go of the item, and puts focus back on it.
    _letGo() {
      const el = this.querySelector('.sb-search__item--selected');
      el?.classList.remove('sb-search__item--selected');
      this._selected = null;
      this._renderDetail();
      el?.focus();
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { item: null } }));
    }

    get _paneOpen() { return !!this._detail && this.detail === 'pane' && !!this._selected; }

    _viewerSets(change) {
      change();
      this._announce();
    }

    // Tells the sandbox where the viewer has got to, so it can keep or act on it.
    _announce() {
      const detail = { preset: this.preset, query: this._query, regex: this._regex, filters: this.filters, ranges: this.ranges, sort: this.sort, group: this._group, view: this.view, fullscreen: this.fullscreen, results: this.results };
      this.dispatchEvent(new CustomEvent('sb-change', { bubbles: true, detail }));
    }

    // ---- Rendering ----

    // The whole element: the criteria, built afresh, and the results.
    _build() {
      if (!this.isConnected) return;
      this._built = true;
      this._detail = this.querySelector(':scope > [slot="detail"]') || this._detail;
      const full = this.fullscreen;
      this.innerHTML = `
        <div class="sb-search__frame${full ? ' sb-search__frame--full' : ''}"${full ? ' role="dialog" aria-modal="true" aria-label="Search, full screen"' : ''}>
          <div class="sb-search__criteria">
            <div class="sb-search__bar">
              <div class="sb-search__query">
                <input class="sb-search__input" type="search" aria-label="Search" placeholder="${esc(this.getAttribute('placeholder') || 'Search…')}" value="${esc(this._query)}" autocomplete="off" spellcheck="false">
                <button class="sb-search__regex" type="button" aria-pressed="${this._regex}" title="Search with a regular expression">.*</button>
              </div>
              <span class="sb-search__count" aria-live="polite"></span>
            </div>
            <p class="sb-search__problem" role="alert"></p>
            <div class="sb-search__bar">
              ${this._presetHtml()}
              ${this._sortHtml()}
              ${this._groupHtml()}
              <span class="sb-search__spacer"></span>
              <span class="sb-search__views" role="group" aria-label="View">
                ${Object.entries(VIEWS).map(([view, label]) => `<button class="sb-search__button" type="button" data-view="${view}" aria-pressed="${this.view === view}">${label}</button>`).join('')}
              </span>
              <button class="sb-search__button sb-search__full" type="button" aria-pressed="${full}">${full ? `${ICONS.leave} Exit full screen` : `${ICONS.enter} Full screen`}</button>
            </div>
            ${this._columns.some((column) => column.filter || column.range) ? `<div class="sb-search__filtering">
              <button class="sb-search__toggle" type="button" aria-controls="${this._id('filters')}">Filters</button>
              <span class="sb-search__chosen"></span>
            </div>` : ''}
            <div class="sb-search__filters" id="${this._id('filters')}"></div>
          </div>
          <div class="sb-search__body">
            <div class="sb-search__results"></div>
            ${this._detail && this.detail === 'pane' ? `<aside class="sb-search__pane" aria-label="Details" hidden>
              <div class="sb-search__pane-head"><span class="sb-search__pane-title"></span><button class="sb-search__close" type="button" aria-label="Close details">×</button></div>
              <div class="sb-search__pane-body"></div>
            </aside>` : ''}
            ${this._detail && this.detail === 'free' ? '<div class="sb-search__free"></div>' : ''}
          </div>
        </div>`;
      this.querySelector('.sb-search__pane-body, .sb-search__free')?.append(this._detail);
      this._refresh();
      this._renderDetail();
    }

    // The pane shows while an item is chosen, headed by the item's title. Free content is the sandbox's to show.
    _renderDetail() {
      const pane = this.querySelector('.sb-search__pane');
      if (!pane) return;
      pane.hidden = !this._selected;
      if (!this._selected) return;
      const row = this._rows.find((r) => r.item === this._selected);
      const { title } = this._card();
      pane.querySelector('.sb-search__pane-title').textContent = row && title ? row.texts[title] ?? keyOf(row.item[title]) : '';
    }

    _presetHtml() {
      if (!this._presets.length) return '';
      const at = this._presets.indexOf(this._preset);
      return `<span class="sb-search__choose">
        <label class="sb-search__facet" for="${this._id('preset')}">Preset</label>
        <span class="sb-search__picker"><select class="sb-search__select sb-search__preset" id="${this._id('preset')}">
          <option value=""${at < 0 ? ' selected' : ''}>None</option>
          ${this._presets.map((preset, i) => `<option value="${i}"${i === at ? ' selected' : ''}>${esc(preset.label)}</option>`).join('')}
        </select></span>
      </span>`;
    }

    _sortHtml() {
      const sortable = this._columns.filter((column) => column.sort);
      if (!sortable.length) return '';
      const direction = this._sort?.direction === 'descending'
        ? { arrow: '↓', words: 'Descending: click for ascending' }
        : { arrow: '↑', words: 'Ascending: click for descending' };
      return `<span class="sb-search__choose">
        <label class="sb-search__facet" for="${this._id('sort')}">Sort</label>
        <span class="sb-search__picker"><select class="sb-search__select sb-search__sort" id="${this._id('sort')}">
          <option value="">As given</option>
          ${sortable.map((column) => `<option value="${esc(column.key)}"${this._sort?.key === column.key ? ' selected' : ''}>${esc(column.label)}</option>`).join('')}
        </select></span>
        ${this._sort ? `<button class="sb-search__button sb-search__direction" type="button" title="${direction.words}" aria-label="${direction.words}">${direction.arrow}</button>` : ''}
      </span>`;
    }

    _groupHtml() {
      const groupable = this._columns.filter((column) => column.group);
      if (!groupable.length) return '';
      return `<span class="sb-search__choose">
        <label class="sb-search__facet" for="${this._id('group')}">Group</label>
        <span class="sb-search__picker"><select class="sb-search__select sb-search__group" id="${this._id('group')}">
          <option value="">None</option>
          ${groupable.map((column) => `<option value="${esc(column.key)}"${this._group === column.key ? ' selected' : ''}>${esc(column.label)}</option>`).join('')}
        </select></span>
      </span>`;
    }

    // The parts whose data attribute holds a value, compared as written rather than through a selector.
    _partsFor(selector, name, value) {
      return [...this.querySelectorAll(selector)].filter((part) => part.dataset[name] === value);
    }

    // Ids unique to this instance, so labels find their controls with several on a page.
    _id(part) {
      this._uid ||= `sb-search-${Math.random().toString(36).slice(2, 8)}`;
      return `${this._uid}-${part}`;
    }

    // Everything that follows from the search and filters, leaving the criteria's controls (and focus) alone.
    _refresh() {
      if (!this._built) return;
      const pattern = this._pattern();
      this.querySelector('.sb-search__input').setAttribute('aria-invalid', pattern === undefined);
      this.querySelector('.sb-search__regex').setAttribute('aria-pressed', this._regex);
      this.querySelector('.sb-search__problem').textContent = pattern === undefined && !this.match
        ? 'That isn\'t a regular expression this browser can read, so nothing is searched out yet.' : '';
      const presets = this.querySelector('.sb-search__preset');
      const at = this._presets.indexOf(this._preset);
      if (presets) presets.value = at < 0 ? '' : String(at);
      this._renderFilters();
      this._renderResults();
    }

    _narrowed() {
      this._showAll = false;
      this._preset = null;
      this._refresh();
    }

    // The filters are drawn once, then kept in step, so a handle being dragged or a value just pressed stays put.
    _renderFilters() {
      const filters = this.querySelector('.sb-search__filters');
      filters.hidden = !this._filtersOpen;
      if (!this._filtersOpen) filters.innerHTML = '';
      else {
        if (!filters.childElementCount) filters.innerHTML = this._filtersHtml();
        this._syncFilters();
      }
      const toggle = this.querySelector('.sb-search__toggle');
      if (!toggle) return;
      toggle.setAttribute('aria-expanded', this._filtersOpen);
      this.querySelector('.sb-search__chosen').innerHTML = this._filtersOpen ? '' : this._chosenHtml() || 'None chosen';
    }

    // The values chosen, in words: "Status: Delayed · Operator: LNER, Northern".
    _chosenHtml() {
      return this._columns.flatMap((column) => {
        const chosen = this._filters[column.key];
        const range = this._ranges[column.key];
        return [
          chosen?.size ? `${esc(column.label)}: <strong>${[...chosen].map((key) => esc(column.labelOf(key))).join(', ')}</strong>` : '',
          range ? `${esc(column.label)}: <strong>${esc(this._between(column, range))}</strong>` : ''
        ];
      }).filter(Boolean).join(' · ');
    }

    _between(column, { from, to }) {
      return `${column.labelOf(from)} – ${column.labelOf(to)}`;
    }

    _filtersHtml() {
      return this._columns.map((column) => (column.filter ? this._valuesHtml(column) : '') + (column.range ? this._rangeHtml(column) : '')).join('');
    }

    _valuesHtml(column) {
      const values = this._filterValues(column).map(({ key, value }) =>
        `<button class="sb-search__value" type="button" data-key="${esc(column.key)}" data-value="${esc(key)}">${esc(column.labelOf(value))}<span class="sb-search__tally"></span></button>`).join('');
      return `<span class="sb-search__facet">${esc(column.label)}</span><span class="sb-search__values" role="group" aria-label="${esc(column.label)}">${values}</span>`;
    }

    _rangeHtml(column) {
      const values = [...new Set(this._rows.flatMap((row) => asList(row.values[column.key])).filter((value) => typeof value === 'number'))];
      const ticks = values.map((value) => `<span class="sb-search__tick" data-value="${value}" style="left: ${this._place(column, value)}%"></span>`).join('');
      const handle = (end, words) => `<input class="sb-search__handle" type="range" data-key="${esc(column.key)}" data-end="${end}" min="${column.min}" max="${column.max}" step="${column.step}" aria-label="${esc(column.label)}, ${words}">`;
      return `<span class="sb-search__facet sb-search__facet--ranged">${esc(column.label)}</span>
        <span class="sb-search__ranged" data-key="${esc(column.key)}">
          <span class="sb-search__range">
            <span class="sb-search__rail"><span class="sb-search__track"></span><span class="sb-search__span"></span>${ticks}</span>
            ${handle('from', 'from')}${handle('to', 'to')}
          </span>
          <span class="sb-search__between"></span>
        </span>`;
    }

    // Where a value sits along a range, as a percentage.
    _place(column, value) {
      return ((value - column.min) / (column.max - column.min)) * 100;
    }

    // Brings the drawn filters in line with the criteria: counts, pressed values, handles and ticks.
    _syncFilters() {
      const pattern = this._pattern();
      for (const column of this._columns.filter((c) => c.filter)) {
        const counts = new Map(this._filterValues(column).map(({ key, count }) => [key, count]));
        const chosen = this._filters[column.key] || new Set();
        for (const button of this._partsFor('.sb-search__value', 'key', column.key)) {
          const count = counts.get(button.dataset.value) ?? 0;
          const on = chosen.has(button.dataset.value);
          button.setAttribute('aria-pressed', on);
          button.classList.toggle('sb-search__value--none', !count && !on);
          button.querySelector('.sb-search__tally').textContent = count;
        }
      }
      for (const column of this._columns.filter((c) => c.range)) {
        const [box] = this._partsFor('.sb-search__ranged', 'key', column.key);
        const range = this._ranges[column.key] || { from: column.min, to: column.max };
        const handles = box.querySelectorAll('.sb-search__handle');
        handles[0].value = range.from;
        handles[1].value = range.to;
        const span = box.querySelector('.sb-search__span');
        span.style.left = `${this._place(column, range.from)}%`;
        span.style.width = `${this._place(column, range.to) - this._place(column, range.from)}%`;
        box.querySelector('.sb-search__between').textContent = this._between(column, range);
        const possible = new Set(this._rows.filter((row) => this._passes(row, pattern, column.key)).flatMap((row) => asList(row.values[column.key])));
        for (const tick of box.querySelectorAll('.sb-search__tick')) {
          const value = Number(tick.dataset.value);
          tick.classList.toggle('sb-search__tick--out', !possible.has(value) || value < range.from || value > range.to);
        }
      }
    }

    _renderResults() {
      const box = this.querySelector('.sb-search__results');
      if (!box) return;
      const results = this._results();
      this.querySelector('.sb-search__count').innerHTML = `${results.length} of ${this._rows.length} shown${this._isNarrowed ? ' · <button class="sb-search__clear" type="button">Clear</button>' : ''}`;
      this._drawn = [];
      if (!results.length) {
        const empty = this._rows.length ? 'Nothing matches. Try fewer filters or a shorter search.' : this.getAttribute('empty-text') || 'Nothing yet.';
        box.innerHTML = `<p class="sb-search__empty">${esc(empty)}</p>`;
        return;
      }
      const budget = { left: this._showAll ? Infinity : this._limit };
      const pattern = this.match ? null : this._pattern();
      const groups = this._groups(results);
      box.innerHTML = (this.view === 'table' ? this._tableHtml(groups, budget, pattern) : this._listHtml(groups, budget, pattern))
        + (budget.left < 0 ? `<button class="sb-search__more" type="button">Show all ${results.length}</button>` : '');
    }

    // Takes rows from the budget shared by every group; overdrawing it marks that some weren't drawn.
    _spend(rows, budget) {
      const taken = rows.slice(0, Math.max(budget.left, 0));
      budget.left -= rows.length;
      return taken;
    }

    _headingHtml(group) {
      return `<span>${esc(group.label)}</span><span class="sb-search__tally">${group.rows.length}</span>`;
    }

    _listHtml(groups, budget, pattern) {
      return groups.map((group) => {
        const rows = this._spend(group.rows, budget);
        if (!rows.length) return '';
        return `<section class="sb-search__group">
          ${group.label === undefined ? '' : `<h3 class="sb-search__heading">${this._headingHtml(group)}</h3>`}
          <ul class="sb-search__items sb-search__items--${this.view}">${rows.map((row) => this._itemHtml(row, pattern)).join('')}</ul>
        </section>`;
      }).join('');
    }

    _itemHtml(row, pattern) {
      const { title, subtitle, details = [] } = this._card();
      const show = (key) => this._marked(row.texts[key] ?? keyOf(row.item[key]), pattern);
      const shown = details.filter((key) => !isEmpty(row.texts[key] ?? row.item[key]));
      return `<li ${this._itemAttributes(row)}>
        ${title ? `<span class="sb-search__title">${show(title)}</span>` : ''}
        ${subtitle ? `<span class="sb-search__subtitle">${show(subtitle)}</span>` : ''}
        ${shown.length ? `<dl class="sb-search__details">${shown.map((key) => `<div class="sb-search__detail"><dt>${esc(this._columnFor(key)?.label ?? key)}</dt><dd>${show(key)}</dd></div>`).join('')}</dl>` : ''}
        ${this._foundHtml(row, pattern, [title, subtitle, ...details])}
      </li>`;
    }

    // Where the search matched in fields the card doesn't show, so no result appears without a reason.
    _foundHtml(row, pattern, shownKeys) {
      if (!pattern) return '';
      const found = this._columns.filter((column) => column.search && !shownKeys.includes(column.key)
        && (pattern.lastIndex = 0, pattern.test(row.texts[column.key])));
      if (!found.length) return '';
      const places = found.slice(0, MOST_FOUND_IN)
        .map((column) => `<span class="sb-search__found-field">${esc(column.label)}</span> ${this._excerpt(row.texts[column.key], pattern)}`);
      return `<p class="sb-search__found"><span class="sb-search__found-label">Found in</span>${places.join(' · ')}${found.length > MOST_FOUND_IN ? ` · and ${found.length - MOST_FOUND_IN} more` : ''}</p>`;
    }

    // Long text cut down to the words around its first match.
    _excerpt(text, pattern) {
      if (text.length <= EXCERPT_LENGTH) return this._marked(text, pattern);
      pattern.lastIndex = 0;
      const at = pattern.exec(text)?.index ?? 0;
      const start = Math.max(0, at - Math.floor(EXCERPT_LENGTH / 3));
      const end = Math.min(text.length, start + EXCERPT_LENGTH);
      return `${start > 0 ? '…' : ''}${this._marked(text.slice(start, end), pattern)}${end < text.length ? '…' : ''}`;
    }

    _tableHtml(groups, budget, pattern) {
      const columns = this._columns;
      const cell = (column) => (column.number ? ' class="sb-search__cell--number"' : '');
      const bodies = groups.map((group) => {
        const rows = this._spend(group.rows, budget);
        if (!rows.length) return '';
        return `<tbody>
          ${group.label === undefined ? '' : `<tr><th class="sb-search__heading" colspan="${columns.length}" scope="colgroup">${this._headingHtml(group)}</th></tr>`}
          ${rows.map((row) => `<tr ${this._itemAttributes(row)}>${columns.map((column) => `<td${cell(column)}>${this._marked(row.texts[column.key], pattern)}</td>`).join('')}</tr>`).join('')}
        </tbody>`;
      }).join('');
      return `<table class="sb-search__table">
        <thead><tr>${columns.map((column) => `<th scope="col"${cell(column)}>${esc(column.label)}</th>`).join('')}</tr></thead>
        ${bodies}
      </table>`;
    }

    _itemAttributes(row) {
      const { item } = row;
      const index = this._drawn.push(item) - 1;
      const classes = ['sb-search__item'];
      if (item === this._selected) classes.push('sb-search__item--selected');
      if (!isEmpty(item.id) && this._highlight.has(String(item.id))) classes.push('sb-search__item--highlighted');
      return `class="${classes.join(' ')}" tabindex="0" data-index="${index}"`
        + (isEmpty(item.id) ? '' : ` data-ref="${esc(item.id)}"`)
        + (item.tone ? ` data-tone="${esc(item.tone)}"` : '');
    }

    // The text, with what the search found marked.
    _marked(text, pattern) {
      text = String(text ?? '');
      if (!pattern) return esc(text);
      let html = '', from = 0;
      pattern.lastIndex = 0;
      for (let match; (match = pattern.exec(text));) {
        if (!match[0]) { pattern.lastIndex++; continue; } // an empty match marks nothing
        html += esc(text.slice(from, match.index)) + `<mark class="sb-search__match">${esc(match[0])}</mark>`;
        from = match.index + match[0].length;
      }
      return html + esc(text.slice(from));
    }
  }

  customElements.define('sb-search', SbSearch);
})();
