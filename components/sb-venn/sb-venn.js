// Sandkit sb-venn 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Two or three sets as overlapping circles, and every region they make: what's in each, how many,
// and which are empty. Pointing at a region reads it out ("In Mammals and Swimmers, not Egg-layers"),
// and things that changed region since the last update are marked.
//
//   venn.sets = [{ id: 'm', label: 'Mammals' }, { id: 's', label: 'Swimmers' }];
//   venn.items = [{ id: 'whale', label: 'Whale', sets: ['m', 's'] }];
//   venn.highlight = { regions: ['m&s'] };
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-venn';
  const existing = customElements.get('sb-venn');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-venn>, so only one can run. Rename one by replacing every "sb-venn" in its file.`);
    }
    return;
  }

  // Sets take these colours in turn, unless given a tone.
  const SET_TONES = ['accent', 'good', 'warn'];
  const TONES = { accent: '#2563eb', good: '#3f9142', warn: '#d69e2e', bad: '#c53030', muted: '#616e7c' };

  const CSS = `
    .sb-venn { display: block; font-size: 13px; }
    .sb-venn__svg { display: block; max-width: 100%; height: auto; margin: 0 auto; font-size: 11px; }
    .sb-venn__universe { fill: none; stroke: var(--sb-border, #d5d9e0); }
    .sb-venn__universe-label { fill: var(--sb-muted, #616e7c); font-size: 12px; }
    ${Object.entries(TONES).map(([tone, fallback]) => `.sb-venn--${tone} { --sb-venn-tone: var(--sb-${tone}, ${fallback}); }`).join('\n    ')}
    .sb-venn__circle { fill: color-mix(in srgb, var(--sb-venn-tone) 12%, transparent); pointer-events: none; }
    .sb-venn__circle.sb-venn--highlighted { fill: color-mix(in srgb, var(--sb-venn-tone) 24%, transparent); }
    .sb-venn__outline { fill: none; stroke: var(--sb-venn-tone); stroke-width: 1.5; pointer-events: none; }
    .sb-venn__outline.sb-venn--pointed { stroke-width: 2.5; }
    .sb-venn__outline.sb-venn--highlighted { stroke-width: 3.5; }
    .sb-venn__region { fill: var(--sb-accent, #2563eb); opacity: 0; pointer-events: none; transition: opacity 0.15s; }
    .sb-venn__region.sb-venn--pointed { opacity: 0.14; }
    .sb-venn__region.sb-venn--highlighted { opacity: 0.28; }
    .sb-venn__label { fill: var(--sb-text, #1f2933); font-size: 13px; font-weight: 600; cursor: pointer; }
    .sb-venn__total { fill: var(--sb-muted, #616e7c); font-weight: 400; }
    .sb-venn__label.sb-venn--highlighted, .sb-venn__label.sb-venn--pointed { fill: var(--sb-accent, #2563eb); }
    .sb-venn__item, .sb-venn__count, .sb-venn__more { fill: var(--sb-text, #1f2933); cursor: pointer; }
    .sb-venn__item[data-tone="good"] { fill: var(--sb-good, #3f9142); }
    .sb-venn__item[data-tone="warn"] { fill: var(--sb-warn, #d69e2e); font-weight: 600; }
    .sb-venn__item[data-tone="bad"] { fill: var(--sb-bad, #c53030); font-weight: 600; }
    .sb-venn__item.sb-venn--highlighted, .sb-venn__item.sb-venn--pointed { fill: var(--sb-accent, #2563eb); font-weight: 700; }
    .sb-venn__marker { fill: var(--sb-warn, #d69e2e); font-weight: 700; }
    .sb-venn__count { font-size: 18px; font-weight: 600; }
    .sb-venn__more, .sb-venn__delta { fill: var(--sb-muted, #616e7c); }
    .sb-venn__count.sb-venn--empty, .sb-venn__none { fill: var(--sb-muted, #616e7c); font-style: italic; font-weight: 400; cursor: pointer; }
    .sb-venn [tabindex]:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 2px; }
    .sb-venn__reading { margin: 6px 0 0; min-height: 1.5em; text-align: center; color: var(--sb-text, #1f2933); }
    .sb-venn__empty { color: var(--sb-muted, #616e7c); }`;

  const LINE = 13;      // between lines of labels
  const CHAR = 6.2;     // a rough width per character at 11px, to shorten labels that won't fit
  const LISTED = 12;    // names read out for a region before "and n more"

  // Fixed, symmetric layouts, centred on 0,0. A region is named by a bitmask of the sets it's in
  // (1 for the first, 2 the second, 4 the third; 0 for outside them all), and each has a place for
  // its contents: its middle, the width there, and how many lines fit. Outside's place is the
  // bottom-left corner, listing upwards.
  const LAYOUTS = {
    2: {
      box: { x: -200, y: -170, width: 400, height: 320 },
      r: 110,
      centres: [[-66, 0], [66, 0]],
      labels: [{ x: -110, y: -122 }, { x: 110, y: -122 }],
      places: {
        1: { x: -112, y: 0, width: 110, lines: 6 },
        2: { x: 112, y: 0, width: 110, lines: 6 },
        3: { x: 0, y: 0, width: 80, lines: 6 },
        0: { x: -192, y: 140, width: 75, lines: 4, corner: true }
      }
    },
    3: {
      box: { x: -240, y: -190, width: 480, height: 410 },
      r: 110,
      centres: [[-57, -33], [57, -33], [0, 66]],
      labels: [{ x: -110, y: -150 }, { x: 110, y: -150 }, { x: 0, y: 194 }],
      places: {
        1: { x: -100, y: -58, width: 105, lines: 5 },
        2: { x: 100, y: -58, width: 105, lines: 5 },
        4: { x: 0, y: 116, width: 105, lines: 5 },
        3: { x: 0, y: -85, width: 76, lines: 4 },
        5: { x: -63, y: 37, width: 70, lines: 3 },
        6: { x: 63, y: 37, width: 70, lines: 3 },
        7: { x: 0, y: 0, width: 80, lines: 3 },
        0: { x: -232, y: 208, width: 100, lines: 5, corner: true }
      }
    }
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const same = (a, b) => String(a) === String(b);
  const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const nameOf = (thing) => thing.label ?? thing.id;
  const signed = (n) => (n > 0 ? `+${n}` : `−${-n}`);

  // "A", "A and B", "A, B and C"
  const list = (names, last = 'and') => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} ${last} ${names.at(-1)}`);

  // Shortens a label to about the width given, in pixels.
  function fit(label, width) {
    const room = Math.floor(width / CHAR);
    return label.length > room ? `${label.slice(0, room - 1)}…` : label;
  }

  function addStyle() {
    if (document.getElementById('sb-venn-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-venn-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  let count = 0; // numbers each diagram, so its clip and mask ids are unique in the page

  class SbVenn extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['universe', 'show', 'empty-text'];

    constructor() {
      super();
      this._uid = `sb-venn-${++count}`;
      this._sets = [];
      this._items = null;     // null until given: the diagram then shows counts
      this._counts = {};
      this._highlight = {};
      this._lastItems = null; // each item's sets as last set ({ [id]: sets }), for marking moves
      this._moves = {};
      this._lastTally = null; // each region's count as last set, for marking changes
      this._deltas = {};
      this._pointed = null;
      this.addEventListener('pointermove', (e) => this._pointAt(this._targetAt(e)));
      this.addEventListener('pointerleave', () => this._pointAt(null));
      this.addEventListener('focusin', (e) => this._pointAt(this._targetOf(e.target)));
      this.addEventListener('focusout', (e) => { if (!this.contains(e.relatedTarget)) this._pointAt(null); });
      this.addEventListener('click', (e) => this._select(this._targetAt(e)));
      this.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._select(this._targetOf(e.target)); });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-venn');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // [{ id, label, tone }]: two or three sets.
    get sets() { return this._sets; }
    set sets(list) {
      this._sets = list || [];
      if (this._lastTally) this._lastTally = this._tally(); // regions now mean something else, so nothing has changed yet
      this._deltas = {};
      this.render();
    }

    // [{ id, label, sets: [setId, …], tone }]: the things to sort into regions. Setting them marks
    // each that changed region, or arrived, since the last time.
    get items() { return this._items; }
    set items(list) {
      const before = this._lastItems;
      this._items = list ?? null;
      this._lastItems = list ? Object.fromEntries(list.map((item) => [item.id, [...(item.sets ?? [])]])) : null;
      this._moves = before && list ? this._movesSince(before) : {};
      this._recount();
    }

    // { 'a': 12, 'a&b': 3, '': 40 }: how many are in each region, when there are no items to show.
    get counts() { return this._counts; }
    set counts(value) {
      this._counts = value || {};
      this._recount();
    }

    // { sets: [id, …], regions: [ref, …], items: [id, …] }: what to point at.
    get highlight() { return this._highlight; }
    set highlight(value) {
      this._highlight = value || {};
      this._mark();
    }

    // ---- Regions ----
    // A region's ref names exactly the sets it's in, joined by &, in any order: 'a&b' is in a and b
    // and no other. '' is outside every set.

    _maskOf(ids) {
      return this._sets.reduce((mask, set, i) => (ids.some((id) => same(id, set.id)) ? mask | (1 << i) : mask), 0);
    }

    _maskOfRef(ref) {
      return this._maskOf(String(ref).split('&'));
    }

    _ref(mask) {
      return this._sets.filter((_, i) => mask & (1 << i)).map((set) => set.id).join('&');
    }

    _masks() {
      return Array.from({ length: 1 << this._sets.length }, (_, mask) => mask);
    }

    _itemsIn(mask) {
      return (this._items ?? []).filter((item) => this._maskOf(item.sets ?? []) === mask);
    }

    _countOf(mask) {
      if (this._items) return this._itemsIn(mask).length;
      return Object.entries(this._counts).reduce((sum, [ref, n]) => (this._maskOfRef(ref) === mask ? sum + n : sum), 0);
    }

    _region(mask) {
      return { ref: this._ref(mask), sets: this._ref(mask).split('&').filter(Boolean), count: this._countOf(mask), items: this._itemsIn(mask) };
    }

    // How many are in a set, across all its regions.
    _totalOf(set) {
      const bit = 1 << this._sets.indexOf(set);
      return this._masks().filter((mask) => mask & bit).reduce((sum, mask) => sum + this._countOf(mask), 0);
    }

    _tally() {
      return Object.fromEntries(this._masks().map((mask) => [mask, this._countOf(mask)]));
    }

    _recount() {
      const tally = this._tally();
      const before = this._lastTally;
      this._deltas = before ? Object.fromEntries(this._masks().map((mask) => [mask, tally[mask] - (before[mask] ?? 0)])) : {};
      this._lastTally = tally;
      this.render();
    }

    // { [id]: { from: mask } } for items in a new region, { [id]: { arrived: true } } for new items.
    _movesSince(before) {
      const moves = {};
      for (const item of this._items) {
        if (!(item.id in before)) moves[item.id] = { arrived: true };
        else if (this._maskOf(before[item.id]) !== this._maskOf(item.sets ?? [])) moves[item.id] = { from: this._maskOf(before[item.id]) };
      }
      return moves;
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      const layout = LAYOUTS[this._sets.length];
      if (!layout) {
        this.innerHTML = `<div class="sb-venn__empty">${esc(this.getAttribute('empty-text') || 'Give two or three sets.')}</div>`;
        return;
      }
      const { box } = layout;
      const universe = this.getAttribute('universe');
      this.innerHTML = `
        <svg class="sb-venn__svg" viewBox="${box.x} ${box.y} ${box.width} ${box.height}" width="${box.width}" height="${box.height}" role="group" aria-label="${esc(`Overlaps of ${list(this._sets.map(nameOf))}`)}">
          <defs>${this._defs(layout)}</defs>
          <rect class="sb-venn__universe" x="${box.x + 0.5}" y="${box.y + 0.5}" width="${box.width - 1}" height="${box.height - 1}" rx="6"/>
          ${universe == null ? '' : `<text class="sb-venn__universe-label" x="${box.x + 8}" y="${box.y + 18}">${esc(universe)}</text>`}
          ${this._circles(layout, 'circle')}
          ${this._masks().map((mask) => this._overlay(mask, layout)).join('')}
          ${this._circles(layout, 'outline')}
          ${this._sets.map((set, i) => this._label(set, layout.labels[i])).join('')}
          ${this._masks().map((mask) => this._contents(mask, layout.places[mask])).join('')}
        </svg>
        <p class="sb-venn__reading" aria-live="polite"></p>`;
      this._mark();
    }

    // Per set, a clip to inside its circle and a mask to outside it, so any region is the box
    // clipped or masked by each set in turn.
    _defs({ box, r, centres }) {
      return centres.map(([cx, cy], i) => `
        <clipPath id="${this._uid}-in-${i}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
        <mask id="${this._uid}-out-${i}" maskUnits="userSpaceOnUse" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}">
          <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#000"/>
        </mask>`).join('');
    }

    _overlay(mask, { box, centres }) {
      let shape = `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"/>`;
      centres.forEach((_, i) => {
        shape = mask & (1 << i) ? `<g clip-path="url(#${this._uid}-in-${i})">${shape}</g>` : `<g mask="url(#${this._uid}-out-${i})">${shape}</g>`;
      });
      return `<g class="sb-venn__region" data-region="${esc(this._ref(mask))}">${shape}</g>`;
    }

    _circles({ r, centres }, part) {
      return this._sets.map((set, i) => `<circle class="sb-venn__${part} ${this._toneOf(set, i)}" data-set="${esc(set.id)}" cx="${centres[i][0]}" cy="${centres[i][1]}" r="${r}"/>`).join('');
    }

    _toneOf(set, i) {
      return `sb-venn--${set.tone in TONES ? set.tone : SET_TONES[i]}`;
    }

    _label(set, { x, y }) {
      const total = this._totalOf(set);
      return `<text class="sb-venn__label" data-set="${esc(set.id)}" tabindex="0" x="${x}" y="${y}" text-anchor="middle">${esc(nameOf(set))} <tspan class="sb-venn__total">${total}</tspan></text>`;
    }

    // A region's count, or its items' names, at its place. Outside appears only when something's there.
    _contents(mask, place) {
      if (mask === 0 && !this._countOf(mask)) return '';
      return `<g class="sb-venn__contents" data-region="${esc(this._ref(mask))}">${this._texts(mask, place)}</g>`;
    }

    _texts(mask, place) {
      const total = this._countOf(mask);
      const anchor = place.corner ? 'start' : 'middle';
      const lineY = (i, n) => (place.corner ? place.y - (n - 1 - i) * LINE : place.y + (i - (n - 1) / 2) * LINE + 4);
      if (!this._items || this.getAttribute('show') === 'counts') {
        const y = place.corner ? place.y - 16 : place.y + 6; // in the corner, the change sits on the bottom line
        const delta = this._deltas[mask] ? `<text class="sb-venn__delta" x="${place.x}" y="${y + 16}" text-anchor="${anchor}">${signed(this._deltas[mask])}</text>` : '';
        return `<text class="sb-venn__count${total ? '' : ' sb-venn--empty'}" tabindex="0" x="${place.x}" y="${y}" text-anchor="${anchor}">${total}</text>${delta}`;
      }
      const items = this._itemsIn(mask);
      if (!items.length) return `<text class="sb-venn__none" tabindex="0" x="${place.x}" y="${place.y + 4}" text-anchor="${anchor}">none</text>`;
      const shown = items.length > place.lines ? items.slice(0, place.lines - 1) : items;
      const lines = shown.map((item) => this._item(item, place));
      if (shown.length < items.length) lines.push(`<text class="sb-venn__more" tabindex="0">+${items.length - shown.length} more</text>`);
      return lines.map((line, i) => line.replace('<text', `<text x="${place.x}" y="${lineY(i, lines.length)}" text-anchor="${anchor}"`)).join('');
    }

    _item(item, place) {
      const move = this._moves[item.id];
      const marker = move ? `<tspan class="sb-venn__marker">${move.arrived ? '+' : '→'} </tspan>` : '';
      const label = String(nameOf(item));
      const shown = fit(label, place.width - (marker ? 2 * CHAR : 0));
      const tone = item.tone ? ` data-tone="${esc(item.tone)}"` : '';
      const title = shown === label ? '' : `<title>${esc(label)}</title>`;
      return `<text class="sb-venn__item" data-item="${esc(item.id)}"${tone} tabindex="0">${title}${marker}${esc(shown)}</text>`;
    }

    // ---- Highlighting and reading ----

    // Marks what's highlighted and what's pointed at, and reads out the pointed thing, or else the
    // first thing highlighted.
    _mark() {
      const reading = this.querySelector('.sb-venn__reading');
      if (!reading) return;
      const { sets = [], regions = [], items = [] } = this._highlight;
      const masks = regions.map((ref) => this._maskOfRef(ref));
      const pointed = this._pointed;
      for (const el of this.querySelectorAll('[data-set]')) {
        el.classList.toggle('sb-venn--highlighted', sets.some((id) => same(id, el.dataset.set)));
        el.classList.toggle('sb-venn--pointed', !!pointed?.set && same(pointed.set.id, el.dataset.set));
      }
      for (const el of this.querySelectorAll('.sb-venn__region')) {
        const mask = this._maskOfRef(el.dataset.region);
        el.classList.toggle('sb-venn--highlighted', masks.includes(mask));
        el.classList.toggle('sb-venn--pointed', !!pointed?.region && pointed.region.ref === el.dataset.region);
      }
      for (const el of this.querySelectorAll('[data-item]')) {
        el.classList.toggle('sb-venn--highlighted', items.some((id) => same(id, el.dataset.item)));
        el.classList.toggle('sb-venn--pointed', !!pointed?.item && same(pointed.item.id, el.dataset.item));
      }
      reading.textContent = this._reading(pointed ?? this._firstHighlighted(sets, masks, items));
    }

    _firstHighlighted(sets, masks, items) {
      const set = this._sets.find((s) => sets.some((id) => same(id, s.id)));
      if (set) return { set };
      if (masks.length) return { region: this._region(masks[0]) };
      const item = this._items?.find((it) => items.some((id) => same(id, it.id)));
      return item ? { item } : null;
    }

    // "in Mammals and Swimmers, not Egg-layers"
    _phrase(mask) {
      const inside = this._sets.filter((_, i) => mask & (1 << i)).map(nameOf);
      const outside = this._sets.filter((_, i) => !(mask & (1 << i))).map(nameOf);
      if (!inside.length) return 'in none of them';
      return outside.length ? `in ${list(inside)}, not ${list(outside, 'or')}` : `in ${list(inside)}`;
    }

    _reading(target) {
      if (target?.set) return `${nameOf(target.set)}: ${this._totalOf(target.set)}`;
      if (target?.region) {
        const mask = this._maskOfRef(target.region.ref);
        return `${capital(this._phrase(mask))}: ${this._items ? this._names(this._itemsIn(mask)) : this._countOf(mask)}`;
      }
      if (target?.item) {
        const move = this._moves[target.item.id];
        const was = move?.arrived ? ' (new)' : move ? ` (was ${this._phrase(move.from)})` : '';
        return `${nameOf(target.item)}: ${this._phrase(this._maskOf(target.item.sets ?? []))}${was}`;
      }
      return '';
    }

    _names(items) {
      if (!items.length) return 'none';
      const names = items.slice(0, LISTED).map(nameOf);
      return items.length > LISTED ? `${names.join(', ')} and ${items.length - LISTED} more` : list(names);
    }

    // ---- Interaction ----
    // Pointing shows and reads out; clicking reports. The model decides what a click means.

    _targetOf(el) {
      const node = el?.closest?.('[data-item], [data-set], [data-region]');
      if (!node || !this.contains(node)) return null;
      if (node.dataset.item != null) return { item: this._items.find((item) => same(item.id, node.dataset.item)) };
      if (node.dataset.set != null) return { set: this._sets.find((set) => same(set.id, node.dataset.set)) };
      return { region: this._region(this._maskOfRef(node.dataset.region)) };
    }

    // What's under the pointer: a label if there is one, otherwise the region by where it is.
    _targetAt(e) {
      const labelled = this._targetOf(e.target);
      if (labelled) return labelled;
      const svg = this.querySelector('.sb-venn__svg');
      if (!svg?.contains(e.target)) return null;
      const { x, y } = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
      const { box, r, centres } = LAYOUTS[this._sets.length];
      if (x < box.x || x > box.x + box.width || y < box.y || y > box.y + box.height) return null;
      const mask = centres.reduce((m, [cx, cy], i) => (Math.hypot(x - cx, y - cy) < r ? m | (1 << i) : m), 0);
      return { region: this._region(mask) };
    }

    _keyOf(target) {
      if (target?.set) return `set:${target.set.id}`;
      if (target?.region) return `region:${target.region.ref}`;
      if (target?.item) return `item:${target.item.id}`;
      return null;
    }

    _pointAt(target) {
      if (this._keyOf(target) === this._keyOf(this._pointed)) return;
      this._pointed = target;
      this._mark();
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail: target }));
    }

    _select(target) {
      if (target) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: target }));
    }
  }

  customElements.define('sb-venn', SbVenn);
})();
