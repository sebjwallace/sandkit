// Sandkit sb-ontology 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Kinds of things and how they relate: classes, the individuals of each and the relations between
// them, a few at a time, with what each kind inherits and the problems the model has found.
//
//   <sb-ontology level="schema"></sb-ontology>
//   onto.data = { classes, properties, relations, individuals };
//   onto.show = ['parrotfish', 'turf'];
//   onto.problems = [{ ref: 'transect-7', text: 'No diver leads this survey' }];
//
// See manifest.md for the full contract.
(function () {
  if (typeof customElements === 'undefined') return;

  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-ontology';
  const existing = customElements.get('sb-ontology');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-ontology>, so only one can run. Rename one by replacing every "sb-ontology" in its file.`);
    }
    return;
  }

  // ---- Reading the ontology ----

  // The ontology with every list present, each item findable by id, and what everything inherits:
  // each class's ancestors, nearest first, and each individual's classes, its own and those above.
  // This is reading the ontology as it's meant, not modelling: names that match nothing are passed over.
  function read(data) {
    const [classes, properties, relations, individuals] = ['classes', 'properties', 'relations', 'individuals'].map((list) => data[list] ?? []);
    const byId = (items) => new Map(items.map((item) => [item.id, item]));
    const o = { classes, properties, relations, individuals, class: byId(classes), property: byId(properties), relation: byId(relations), individual: byId(individuals) };
    o.ancestors = new Map(classes.map((c) => [c.id, ancestorsOf(c, o.class)]));
    o.classesOf = new Map(individuals.map((ind) => {
      const own = (ind.is ?? []).filter((id) => o.class.has(id));
      return [ind.id, [...new Set([...own, ...own.flatMap((id) => o.ancestors.get(id))])]];
    }));
    return o;
  }

  // Everything above a class through `is`, nearest first, each once. A loop stops where it closes.
  function ancestorsOf(item, byId) {
    const found = [];
    const queue = [...(item.is ?? [])];
    while (queue.length) {
      const id = queue.shift();
      if (id === item.id || found.includes(id) || !byId.has(id)) continue;
      found.push(id);
      queue.push(...(byId.get(id).is ?? []));
    }
    return found;
  }

  const CSS = `
    .sb-ontology { display: block; font-size: 13px; color: var(--sb-text, #1f2933); }
    .sb-ontology__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; margin-bottom: 8px; }
    .sb-ontology__group { display: inline-flex; gap: 4px; }
    .sb-ontology__bar button, .sb-ontology__key { font: inherit; font-size: 12px; padding: 2px 9px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: inherit; cursor: pointer; }
    .sb-ontology__bar button[aria-pressed="true"] { background: var(--sb-accent-soft, #eaf0ff); border-color: var(--sb-accent, #2563eb); }
    .sb-ontology__summary { color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-ontology__drawing { display: block; margin: 0 auto; max-width: 100%; height: auto; }
    .sb-ontology__drawing { overflow: visible; }
    .sb-ontology__node { cursor: pointer; touch-action: none; }
    .sb-ontology__node--dragging { cursor: grabbing; }
    .sb-ontology__node rect { fill: var(--sb-surface, #fff); stroke: var(--sb-border, #d5d9e0); stroke-width: 1.2; }
    .sb-ontology__node:hover rect { stroke: var(--sb-muted, #616e7c); }
    .sb-ontology__node:focus-visible { outline: none; }
    .sb-ontology__node:focus-visible rect { stroke: var(--sb-accent, #2563eb); stroke-dasharray: 3 2; }
    .sb-ontology__node--neighbour rect { fill: color-mix(in srgb, var(--sb-accent-soft, #eaf0ff) 50%, var(--sb-surface, #fff)); stroke: color-mix(in srgb, var(--sb-accent, #2563eb) 50%, transparent); }
    .sb-ontology__node--selected rect { fill: var(--sb-accent-soft, #eaf0ff); stroke: var(--sb-accent, #2563eb); stroke-width: 2.2; }
    .sb-ontology__node--highlighted rect { stroke: var(--sb-warn, #d69e2e); stroke-width: 3; }
    .sb-ontology__label { font-size: 12px; fill: var(--sb-text, #1f2933); }
    .sb-ontology__node--selected .sb-ontology__label { font-weight: 600; }
    .sb-ontology__kind { font-size: 10.5px; fill: var(--sb-muted, #616e7c); }
    .sb-ontology__link { cursor: pointer; --sb-ontology-line: var(--sb-muted, #616e7c); }
    .sb-ontology__link--in { --sb-ontology-line: color-mix(in srgb, var(--sb-accent, #2563eb) 45%, transparent); }
    .sb-ontology__link--out { --sb-ontology-line: var(--sb-accent, #2563eb); }
    .sb-ontology__link--problem { --sb-ontology-line: var(--sb-bad, #c53030); }
    .sb-ontology__link--highlighted { --sb-ontology-line: var(--sb-warn, #d69e2e); }
    .sb-ontology__line { fill: none; stroke: var(--sb-ontology-line); stroke-width: 1.2; }
    .sb-ontology__link--is .sb-ontology__line { stroke-dasharray: 4 3; }
    .sb-ontology__link--in .sb-ontology__line, .sb-ontology__link--out .sb-ontology__line { stroke-width: 2; }
    .sb-ontology__link--highlighted .sb-ontology__line { stroke-width: 3; stroke-dasharray: none; }
    .sb-ontology__head { fill: var(--sb-ontology-line); }
    .sb-ontology__link--is .sb-ontology__head { fill: var(--sb-surface, #fff); stroke: var(--sb-ontology-line); stroke-width: 1.2; }
    .sb-ontology__hit { fill: none; stroke: transparent; stroke-width: 10; }
    .sb-ontology__verb { font-size: 11px; fill: var(--sb-muted, #616e7c); paint-order: stroke; stroke: var(--sb-surface, #fff); stroke-width: 4px; stroke-linejoin: round; }
    .sb-ontology__link--in .sb-ontology__verb, .sb-ontology__link--out .sb-ontology__verb, .sb-ontology__link--highlighted .sb-ontology__verb { fill: var(--sb-text, #1f2933); }
    .sb-ontology__legend { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 8px; }
    .sb-ontology__legend-name { width: 3.5em; color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-ontology__key:hover { border-color: var(--sb-warn, #d69e2e); }
    .sb-ontology__key[aria-pressed="true"] { border-color: var(--sb-warn, #d69e2e); background: color-mix(in srgb, var(--sb-warn, #d69e2e) 22%, var(--sb-surface, #fff)); }
    .sb-ontology__count { color: var(--sb-muted, #616e7c); margin-left: 4px; }
    .sb-ontology__badge circle { fill: var(--sb-bad, #c53030); }
    .sb-ontology__badge text { font-size: 10px; font-weight: 600; fill: #fff; }
    .sb-ontology__details { margin-top: 10px; padding: 10px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); line-height: 1.6; }
    .sb-ontology__details p { margin: 0 0 6px; }
    .sb-ontology__details .sb-ontology__relation-row { margin: 0; }
    .sb-ontology__title { font-weight: 600; }
    .sb-ontology__muted { color: var(--sb-muted, #616e7c); }
    .sb-ontology__section { margin: 8px 0 2px; font-size: 12px; font-weight: 600; color: var(--sb-muted, #616e7c); }
    .sb-ontology__rows { display: grid; grid-template-columns: max-content 1fr max-content; gap: 0 14px; }
    .sb-ontology__rows > * { padding: 1px 0; border-bottom: 1px solid var(--sb-surface-2, #eef0f3); }
    .sb-ontology__row { display: contents; }
    .sb-ontology__from { color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-ontology__go { all: unset; color: var(--sb-accent, #2563eb); cursor: pointer; }
    .sb-ontology__go:hover { text-decoration: underline; }
    .sb-ontology__go:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-ontology__problems { margin: 0; padding-left: 18px; }
    .sb-ontology__problem { color: var(--sb-bad, #c53030); }
    .sb-ontology__empty { color: var(--sb-muted, #616e7c); }`;

  const IS = 'is'; // subclass links, as a relation in the legend
  const SPRING = 80; // the length links settle towards
  const ROUNDS = 300;
  const GRAVITY = 0.05; // a gentle pull to the middle, so groups that aren't linked come together
  const REACH = 3 * SPRING; // how far a box's push reaches
  const WIDE = 1.4; // spread wider than tall, as the boxes are
  const GAP = { x: 64, y: 22 }; // the least room between boxes: side by side, room for a link's label
  const CHAR = 6.6; // a character's estimated width at 12px, so nothing needs measuring
  const PAD = 10;
  const MARGIN = 16;
  const HEAD = 9; // arrowhead length

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const round = (n) => Math.round(n * 10) / 10;
  const refOf = (link) => `${link.from}.${link.relation}.${link.to}`;
  const groupBy = (items, keyOf) => items.reduce((groups, item) => groups.set(keyOf(item), [...(groups.get(keyOf(item)) ?? []), item]), new Map());
  const aOrAnWord = (name) => (/^[aeiou]/i.test(name) ? 'an' : 'a');
  const tally = (items) => items.reduce((counts, item) => counts.set(item, (counts.get(item) ?? 0) + 1), new Map());

  // ---- Layout: worked out once before drawing, so nothing drifts; viewers can drag from there ----

  // Force-directed: linked things pull together like springs, nearby boxes push apart, and
  // children are pulled below their parents. It starts from the same circle every time, so the
  // same ontology always settles the same way.
  function settle(boxes, links) {
    const index = new Map(boxes.map((box, i) => [box.id, i]));
    const pairs = links.map((link) => [index.get(link.from), index.get(link.to), link.relation === IS]).filter(([a, b]) => a !== b);
    const start = (SPRING * Math.sqrt(boxes.length)) / 2;
    const at = boxes.map((_, i) => {
      const angle = (i / boxes.length) * 2 * Math.PI;
      return { x: start * Math.cos(angle), y: start * Math.sin(angle) };
    });

    for (let round = 0; round < ROUNDS; round++) {
      const push = at.map(() => ({ x: 0, y: 0 }));
      const apply = (i, x, y) => { push[i].x += x; push[i].y += y; };
      for (let i = 0; i < at.length; i++) {
        for (let j = i + 1; j < at.length; j++) {
          const dx = at[i].x - at[j].x, dy = at[i].y - at[j].y, d = Math.max(Math.hypot(dx, dy), 1);
          if (d > REACH) continue; // boxes push only on those near them, so unlinked groups stay close
          const force = (SPRING * SPRING) / d / d;
          apply(i, dx * force, dy * force);
          apply(j, -dx * force, -dy * force);
        }
      }
      for (const [a, b, isA] of pairs) {
        const dx = at[b].x - at[a].x, dy = at[b].y - at[a].y, d = Math.max(Math.hypot(dx, dy), 1);
        const force = d / SPRING;
        apply(a, dx * force, dy * force);
        apply(b, -dx * force, -dy * force);
        const short = at[b].y + SPRING - at[a].y; // a child sits a spring's length below its parent
        if (isA && short > 0) { apply(a, 0, short); apply(b, 0, -short); }
      }
      // Each round moves less than the one before, so the layout comes to rest.
      const most = SPRING * (1 - round / ROUNDS);
      at.forEach((point, i) => {
        apply(i, -point.x * GRAVITY, -point.y * GRAVITY);
        const length = Math.hypot(push[i].x, push[i].y);
        if (!length) return;
        const step = Math.min(length, most) / length;
        point.x += push[i].x * step;
        point.y += push[i].y * step;
      });
    }
    // Finally every child goes at least a step below its parents, deepest last, so kinds read downwards.
    for (let pass = 0; pass < boxes.length; pass++) {
      let lowered = false;
      for (const [a, b, isA] of pairs) {
        if (isA && at[a].y < at[b].y + SPRING) { at[a].y = at[b].y + SPRING; lowered = true; }
      }
      if (!lowered) break;
    }
    const placed = boxes.map((box, i) => ({ ...box, x: at[i].x * WIDE, y: at[i].y }));
    separate(placed);
    return new Map(placed.map((box) => [box.id, { ...box, x: round(box.x), y: round(box.y) }]));
  }

  // Pushes overlapping boxes apart, along whichever way is shorter, until none overlap.
  function separate(boxes) {
    for (let pass = 0; pass < 100; pass++) {
      let moved = false;
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b = boxes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const overX = (a.w + b.w) / 2 + GAP.x - Math.abs(dx), overY = (a.h + b.h) / 2 + GAP.y - Math.abs(dy);
          if (overX <= 0 || overY <= 0) continue;
          moved = true;
          if (overX < overY) { const s = (dx < 0 ? -1 : 1) * overX / 2; a.x -= s; b.x += s; }
          else { const s = (dy < 0 ? -1 : 1) * overY / 2; a.y -= s; b.y += s; }
        }
      }
      if (!moved) return;
    }
  }

  // The drawing's frame: every box, with a margin.
  function frame(boxes) {
    const all = [...boxes.values()];
    const left = Math.min(...all.map((b) => b.x - b.w / 2)) - MARGIN;
    const top = Math.min(...all.map((b) => b.y - b.h / 2)) - MARGIN;
    const width = round(Math.max(...all.map((b) => b.x + b.w / 2)) + MARGIN - left);
    const height = round(Math.max(...all.map((b) => b.y + b.h / 2)) + MARGIN - top);
    return { viewBox: `${round(left)} ${round(top)} ${width} ${height}`, width, height };
  }

  // Where a line from a box's centre towards a point leaves the box.
  function boxEdge(box, toward) {
    const dx = toward.x - box.x, dy = toward.y - box.y;
    if (!dx && !dy) return { x: box.x, y: box.y };
    const t = Math.min(dx ? box.w / 2 / Math.abs(dx) : Infinity, dy ? box.h / 2 / Math.abs(dy) : Infinity);
    return { x: box.x + dx * t, y: box.y + dy * t };
  }

  function addStyle() {
    if (document.getElementById('sb-ontology-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-ontology-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbOntology extends HTMLElement {
    static origin = ORIGIN;

    static observedAttributes = ['level', 'empty-text'];

    constructor() {
      super();
      this._data = null;
      this._show = null;
      this._problems = [];
      this._pinned = new Set(); // legend keys a viewer has clicked to keep lit: `relation:eats`, `kind:Fish`
      this._hovered = null;
      this._previewed = null; // the box pointed at, whose links show as if it were selected
      this._selected = null;
      this._highlight = [];
      this._pointed = null;
      this._moved = { schema: new Map(), instances: new Map() }; // where viewers dragged boxes, kept across updates
      this.addEventListener('click', (e) => this._click(e.target));
      this.addEventListener('pointerdown', (e) => this._grab(e));
      this.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.sb-ontology__node')) {
          e.preventDefault();
          this._click(e.target);
        }
      });
      for (const type of ['pointerover', 'focusin']) {
        this.addEventListener(type, (e) => {
          this._point(e.target);
          this._hover(e.target.closest('.sb-ontology__key')?.dataset.key ?? null);
        });
      }
      this.addEventListener('pointerleave', () => { this._point(null); this._hover(null); });
      this.addEventListener('focusout', (e) => {
        if (this.contains(e.relatedTarget)) return;
        this._point(null);
        this._hover(null);
      });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-ontology');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    get data() { return this._data; }
    set data(value) {
      this._data = value ?? null;
      this._o = value ? read(value) : null;
      this._layouts = null;
      this.render();
    }

    // What the model found wrong: [{ ref, text }], the ref naming a class, individual or link.
    get problems() { return this._problems; }
    set problems(list) {
      this._problems = list ? [...list] : [];
      this.render();
    }

    get level() { return this.getAttribute('level') === 'schema' ? 'schema' : 'instances'; }
    set level(value) { this.setAttribute('level', value); }

    // The classes and individuals to draw, by id, or null for all of them. Checking still covers
    // the whole ontology, so a few things can be shown without false problems.
    get show() { return this._show; }
    set show(ids) {
      this._show = ids ? [...ids] : null;
      this._layouts = null;
      this.render();
    }

    // The selected class, individual or link (by its ref), or null.
    get selected() { return this._selected; }
    set selected(id) {
      this._selected = id ?? null;
      this._paint();
      const details = this.querySelector('.sb-ontology__details');
      if (details) details.outerHTML = this._details();
    }

    // The refs to light up: classes, individuals and links.
    get highlight() { return this._highlight; }
    set highlight(refs) {
      this._highlight = refs == null ? [] : [].concat(refs).map(String);
      this._paint();
    }

    // Shows the level where a ref can be seen: a class or individual, or a link or property's ref
    // (`lion-4.preysOn.zebra-12`), by the thing it starts from.
    reveal(ref) {
      const o = this._o;
      if (!o) return false;
      const id = [ref, String(ref).split('.')[0]].find((candidate) => o.class.has(candidate) || o.individual.has(candidate));
      if (id === undefined) return false;
      this.level = o.class.has(id) ? 'schema' : 'instances';
      return true;
    }

    // ---- What's drawn ----

    // What's drawn at a level: everything, or what `show` names. Among individuals, a class named
    // brings its own individuals; among classes, the classes of the individuals named come too, with
    // every class above them, so each chain of kinds stays whole.
    _drawn(level) {
      const o = this._o;
      if (!this._show) return (level === 'schema' ? o.classes : o.individuals).map((item) => item.id);
      const named = new Set(this._show);
      if (level === 'instances') {
        return o.individuals.filter((ind) => named.has(ind.id) || ind.is?.some((c) => named.has(c))).map((ind) => ind.id);
      }
      const theirs = o.individuals.filter((ind) => named.has(ind.id)).flatMap((ind) => ind.is ?? []);
      const kinds = [...named, ...theirs].filter((id) => o.class.has(id)).flatMap((id) => [id, ...o.ancestors.get(id)]);
      return o.classes.filter((c) => kinds.includes(c.id)).map((c) => c.id);
    }

    // Every link between things drawn at a level: individuals' links, or classes' subclass links and relations.
    _links(level) {
      const o = this._o;
      const drawn = new Set(this._drawn(level));
      const links = level === 'schema'
        ? [
          ...o.classes.flatMap((c) => (c.is ?? []).map((parent) => ({ from: c.id, relation: IS, to: parent }))),
          ...o.relations.map((r) => ({ from: r.from, relation: r.id, to: r.to })),
        ]
        : o.individuals.flatMap((ind) => (ind.links ?? []).filter((link) => o.relation.has(link.relation))
          .map((link) => ({ from: ind.id, relation: link.relation, to: link.to })));
      return links.filter((link) => drawn.has(link.from) && drawn.has(link.to));
    }

    // The kinds a box belongs to: an individual's classes, inherited ones too, or a class and every class above it.
    _kindsOf(id, level) {
      return level === 'schema' ? [id, ...this._o.ancestors.get(id)] : this._o.classesOf.get(id);
    }

    _name(id) {
      const o = this._o;
      return (o.class.get(id) ?? o.individual.get(id) ?? o.relation.get(id))?.label ?? id;
    }

    _propertyName(id) { return this._o.property.get(id)?.label ?? id; }

    // Every class or individual, sized to its name (and, for an individual, its classes), where the
    // layout put it or a viewer dragged it.
    _boxes(level) {
      this._layouts ??= {};
      this._layouts[level] ??= this._layout(level);
      const moved = this._moved[level];
      return new Map([...this._layouts[level]].map(([id, box]) => [id, { ...box, ...moved.get(id) }]));
    }

    _layout(level) {
      const items = this._drawn(level).map((id) => (level === 'schema' ? this._o.class : this._o.individual).get(id));
      const boxes = items.map((item) => {
        const label = this._name(item.id);
        const kind = level === 'instances' ? (item.is ?? []).map((c) => this._name(c)).join(', ') : '';
        return { id: item.id, label, kind, w: Math.max(label.length, kind.length * 0.9) * CHAR + 2 * PAD, h: kind ? 38 : 26 };
      });
      return boxes.length ? settle(boxes, this._links(level)) : new Map();
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      if (!this._o) {
        this.innerHTML = `<div class="sb-ontology__empty">${esc(this.getAttribute('empty-text') || 'No ontology yet.')}</div>`;
        return;
      }
      const level = this.level;
      const links = this._links(level);
      const boxes = this._boxes(level);
      this._shown = links;
      this.innerHTML = `
        ${this._bar(level)}
        ${boxes.size ? this._drawing(boxes, links, level) : `<div class="sb-ontology__empty">Nothing at this level.</div>`}
        ${this._legend(links, level)}
        ${this._details()}`;
      this._paint();
    }

    _bar(level) {
      const { classes, individuals } = this._o, problems = this._problems.length;
      const pressed = (value) => `aria-pressed="${level === value}"`;
      const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
      return `
        <div class="sb-ontology__bar">
          <span class="sb-ontology__group" role="group" aria-label="Show">
            <button type="button" data-action="level" data-level="schema" ${pressed('schema')}>Kinds</button>
            <button type="button" data-action="level" data-level="instances" ${pressed('instances')}>Things</button>
          </span>
          <span class="sb-ontology__summary">${plural(classes.length, 'class', 'classes')}, ${plural(individuals.length, 'individual', 'individuals')}${problems ? `, ${plural(problems, 'problem', 'problems')}` : ''}</span>
        </div>`;
    }

    _drawing(boxes, links, level) {
      const { viewBox, width, height } = frame(boxes);
      return `
        <svg class="sb-ontology__drawing" viewBox="${viewBox}" width="${width}" height="${height}" role="img" aria-label="${level === 'schema' ? 'Classes' : 'Individuals'} and how they relate">
          <g class="sb-ontology__links">${this._lines(links, boxes)}</g>
          ${[...boxes.values()].map((box) => this._node(box, level)).join('')}
        </svg>`;
    }

    _node(box, level) {
      return `
        <g class="sb-ontology__node" data-ref="${esc(box.id)}" data-type="${level === 'schema' ? 'class' : 'individual'}" transform="translate(${box.x},${box.y})" tabindex="0" role="button">
          <rect x="${round(-box.w / 2)}" y="${-box.h / 2}" width="${round(box.w)}" height="${box.h}" rx="6"/>
          <text class="sb-ontology__label" y="${box.kind ? -3 : 4}" text-anchor="middle">${esc(box.label)}</text>
          ${box.kind ? `<text class="sb-ontology__kind" y="12" text-anchor="middle">${esc(box.kind)}</text>` : ''}
          ${this._badge(box)}
        </g>`;
    }

    // How many problems a box has, on its corner.
    _badge(box) {
      const count = this._problemsOf(box.id).length;
      if (!count) return '';
      return `
        <g class="sb-ontology__badge" transform="translate(${round(box.w / 2)},${-box.h / 2})" aria-label="${count} ${count === 1 ? 'problem' : 'problems'}">
          <circle r="8"/><text y="3.5" text-anchor="middle">${count}</text>
        </g>`;
    }

    // Straight lines. Links between the same two things sit side by side, their labels spread along them.
    _lines(links, boxes) {
      const pairs = new Map();
      for (const link of links) {
        const key = [link.from, link.to].sort().join('\n');
        pairs.set(key, [...(pairs.get(key) ?? []), link]);
      }
      return [...pairs.values()].flatMap((shared) => shared.map((link, i) => {
        const a = boxes.get(link.from), b = boxes.get(link.to);
        // The same sideways direction for links either way between the pair.
        const [p, q] = link.from < link.to ? [a, b] : [b, a];
        const length = Math.hypot(q.x - p.x, q.y - p.y) || 1;
        const shift = (i - (shared.length - 1) / 2) * 6;
        const side = { x: (-(q.y - p.y) / length) * shift, y: ((q.x - p.x) / length) * shift };
        const start = boxEdge(a, b), end = boxEdge(b, a);
        const from = { x: start.x + side.x, y: start.y + side.y }, to = { x: end.x + side.x, y: end.y + side.y };
        return this._line(link, from, to, (i + 1) / (shared.length + 1));
      })).join('');
    }

    _line(link, from, to, along) {
      const isA = link.relation === IS;
      const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
      const u = { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
      const base = { x: to.x - u.x * HEAD, y: to.y - u.y * HEAD };
      const corner = (sign) => `${round(base.x - u.y * HEAD / 2 * sign)},${round(base.y + u.x * HEAD / 2 * sign)}`;
      const d = `M${round(from.x)},${round(from.y)} L${round(base.x)},${round(base.y)}`;
      const label = { x: from.x + (to.x - from.x) * along, y: from.y + (to.y - from.y) * along };
      return `
        <g class="sb-ontology__link${isA ? ' sb-ontology__link--is' : ''}${this._problemsOf(refOf(link)).length ? ' sb-ontology__link--problem' : ''}" data-ref="${esc(refOf(link))}" data-relation="${esc(link.relation)}" data-from="${esc(link.from)}" data-to="${esc(link.to)}">
          <path class="sb-ontology__hit" d="M${round(from.x)},${round(from.y)} L${round(to.x)},${round(to.y)}"/>
          <path class="sb-ontology__line" d="${d}"/>
          <path class="sb-ontology__head" d="M${round(to.x)},${round(to.y)} L${corner(1)} L${corner(-1)} z"/>
          ${isA ? '' : `<text class="sb-ontology__verb" x="${round(label.x)}" y="${round(label.y + 4)}" text-anchor="middle">${esc(this._name(link.relation))}</text>`}
        </g>`;
    }

    // Keys for the relations among the links drawn and the kinds among the boxes, each counted.
    // Pointing at a key lights what it names; clicking keeps it lit until it's clicked again. A kind
    // every box shares, or only one has, says nothing the boxes don't, so it isn't listed; nor is one
    // lighting the same boxes as a more specific kind, as Coral would beside Stony coral.
    _legend(links, level) {
      const ids = this._drawn(level);
      const relations = [...tally(links.map((link) => link.relation))];
      const members = new Map();
      for (const id of ids) for (const kind of this._kindsOf(id, level)) members.set(kind, [...(members.get(kind) ?? []), id]);
      const depth = (kind) => this._o.ancestors.get(kind).length;
      const deepest = new Map(); // the most specific kind for each set of boxes
      for (const [kind, boxes] of members) {
        const same = boxes.join('\n');
        if (!deepest.has(same) || depth(kind) > depth(deepest.get(same))) deepest.set(same, kind);
      }
      const kinds = this._o.classes.map((c) => c.id)
        .filter((kind) => members.has(kind) && deepest.get(members.get(kind).join('\n')) === kind)
        .map((kind) => [kind, members.get(kind).length])
        .filter(([, count]) => count > 1 && count < ids.length);
      const key = (type, id, name, count) => `
        <button type="button" class="sb-ontology__key" data-key="${type}:${esc(id)}" aria-pressed="false">${esc(name)}<span class="sb-ontology__count">${count}</span></button>`;
      const row = (name, keys) => (keys.length ? `<div class="sb-ontology__legend" role="group" aria-label="${name}"><span class="sb-ontology__legend-name">${name}</span>${keys.join('')}</div>` : '');
      return [
        row('Links', relations.map(([id, count]) => key('relation', id, id === IS ? 'is a' : this._name(id), count))),
        row('Kinds', kinds.map(([id, count]) => key('kind', id, this._name(id), count))),
      ].join('');
    }

    // Marks what's selected and lit, without redrawing. A selected thing's links out are marked,
    // its links in more faintly, and the things at their other ends as neighbours; pointing at a
    // thing shows the same while the pointer is on it. Lit are the sandbox's highlight, and whatever
    // the legend keys pointed at or kept lit name.
    _paint() {
      const selected = this._selected, level = this.level, lit = new Set(this._highlight);
      const focus = this._previewed ?? selected;
      const keys = [...this._pinned, this._hovered].filter(Boolean);
      const named = (type) => keys.filter((key) => key.startsWith(`${type}:`)).map((key) => key.slice(type.length + 1));
      const relations = named('relation'), kinds = named('kind');
      const neighbours = new Set();
      for (const link of this.querySelectorAll('.sb-ontology__link')) {
        const out = link.dataset.from === focus, into = link.dataset.to === focus;
        link.classList.toggle('sb-ontology__link--out', out || link.dataset.ref === selected);
        link.classList.toggle('sb-ontology__link--in', into && !out);
        link.classList.toggle('sb-ontology__link--highlighted', lit.has(link.dataset.ref) || relations.includes(link.dataset.relation));
        if (out) neighbours.add(link.dataset.to);
        if (into) neighbours.add(link.dataset.from);
      }
      for (const node of this.querySelectorAll('.sb-ontology__node')) {
        const id = node.dataset.ref;
        node.classList.toggle('sb-ontology__node--selected', id === selected);
        node.classList.toggle('sb-ontology__node--neighbour', id !== focus && neighbours.has(id));
        node.classList.toggle('sb-ontology__node--highlighted', lit.has(id) || this._kindsOf(id, level).some((kind) => kinds.includes(kind)));
      }
      for (const key of this.querySelectorAll('.sb-ontology__key')) key.setAttribute('aria-pressed', this._pinned.has(key.dataset.key));
    }

    // ---- Details: what's selected, or else the problems in view ----

    _problemsOf(ref) { return this._problems.filter((problem) => problem.ref === ref); }

    _details() {
      const o = this._o, id = this._selected, level = this.level;
      const drawn = this._drawn(level).includes(id);
      let content;
      if (drawn && level === 'schema') content = this._classDetails(o.class.get(id));
      else if (drawn) content = this._individualDetails(o.individual.get(id));
      else {
        const link = this._shown?.find((l) => refOf(l) === id);
        content = link ? this._linkDetails(link) : this._problemList(level);
      }
      return `<div class="sb-ontology__details" aria-live="polite">${content}</div>`;
    }

    // A name that selects its class or individual when clicked.
    _go(id) {
      const type = this._o.class.has(id) ? 'class' : 'individual';
      return `<button type="button" class="sb-ontology__go" data-go="${esc(id)}" data-type="${type}">${esc(this._name(id))}</button>`;
    }

    // A ref as a way to it: a class or individual by name, a link in words.
    _goRef(ref) {
      const link = this._shown.find((l) => refOf(l) === ref);
      if (!link) return this._go(ref);
      const verb = link.relation === IS ? 'is a kind of' : this._name(link.relation);
      return `<button type="button" class="sb-ontology__go" data-go="${esc(ref)}" data-type="link">${esc(`${this._name(link.from)} ${verb} ${this._name(link.to)}`)}</button>`;
    }

    _list(ids) { return ids.map((id) => this._go(id)).join(', '); }

    _section(title, body) { return body ? `<div class="sb-ontology__section">${title}</div>${body}` : ''; }

    // "own" for what a kind declares, or the kind above it that it comes from.
    _origin(own, from) { return `<span class="sb-ontology__from">${own === from ? 'own' : `from ${this._go(from)}`}</span>`; }

    _problemsHtml(problems) {
      return problems.length ? `<ul class="sb-ontology__problems">${problems.map((p) => `<li class="sb-ontology__problem">${esc(p.text)}</li>`).join('')}</ul>` : '';
    }

    _source(item) { return item.source ? `<p class="sb-ontology__muted">Source: ${esc(item.source)}</p>` : ''; }

    _individualDetails(ind) {
      const o = this._o;
      const own = (ind.is ?? []).filter((c) => o.class.has(c));
      const classes = o.classesOf.get(ind.id);
      const inherited = classes.filter((c) => !own.includes(c));
      const values = o.properties.filter((p) => classes.includes(p.on) || ind.values?.[p.id] != null).map((p) => {
        const value = ind.values?.[p.id];
        const shown = value == null ? '<span class="sb-ontology__muted">none</span>' : esc([value, p.unit].filter((part) => part != null).join(' '));
        return `<div class="sb-ontology__row" data-ref="${esc(`${ind.id}.${p.id}`)}"><span>${esc(this._propertyName(p.id))}</span><span>${shown}</span>${this._origin(null, p.on)}</div>`;
      }).join('');
      const out = groupBy((ind.links ?? []).filter((l) => o.relation.has(l.relation) && o.individual.has(l.to)), (l) => l.relation);
      const into = groupBy(o.individuals.flatMap((other) => (other.links ?? []).filter((l) => l.to === ind.id && o.relation.has(l.relation)).map((l) => ({ ...l, from: other.id }))), (l) => l.relation);
      const outLines = [...out].map(([r, links]) => `<p class="sb-ontology__relation-row">${esc(this._name(r))} ${this._list(links.map((l) => l.to))}</p>`);
      const inLines = [...into].map(([r, links]) => {
        const inverse = o.relation.get(r).inverse;
        return `<p class="sb-ontology__relation-row">${inverse ? esc(inverse) : `<span class="sb-ontology__muted">${esc(this._name(r))} from</span>`} ${this._list(links.map((l) => l.from))}</p>`;
      });
      return `
        <p><span class="sb-ontology__title">${esc(this._name(ind.id))}</span> ${this._list(own)}${inherited.length ? `<span class="sb-ontology__muted">, and so ${this._list(inherited)}</span>` : ''}</p>
        ${this._problemsHtml(this._problemsOf(ind.id))}
        ${this._section('Values', values && `<div class="sb-ontology__rows">${values}</div>`)}
        ${this._section('Links', [...outLines, ...inLines].join(''))}
        ${this._source(ind)}`;
    }

    _classDetails(c) {
      const o = this._o;
      const lineage = [c.id, ...o.ancestors.get(c.id)];
      const children = o.classes.filter((other) => other.is?.includes(c.id)).map((other) => other.id);
      const row = (ref, name, detail, from) => `<div class="sb-ontology__row" data-ref="${esc(ref)}"><span>${name}</span><span>${detail}</span>${this._origin(c.id, from)}</div>`;
      const properties = o.properties.filter((p) => lineage.includes(p.on)).map((p) => row(`${c.id}.${p.id}`, esc(this._propertyName(p.id)),
        esc([p.type, p.unit && `in ${p.unit}`].filter(Boolean).join(', ')), p.on)).join('');
      const relations = o.relations.filter((r) => lineage.includes(r.from)).map((r) => row(`${c.id}.${r.id}`, esc(this._name(r.id)),
        this._go(r.to), r.from)).join('');
      const direct = o.individuals.filter((ind) => ind.is?.includes(c.id)).length;
      const individuals = o.individuals.filter((ind) => o.classesOf.get(ind.id).includes(c.id)).length;
      return `
        <p><span class="sb-ontology__title">${esc(this._name(c.id))}</span>${c.is?.length ? ` <span class="sb-ontology__muted">is ${aOrAnWord(this._name(c.is[0]))}</span> ${this._list(c.is)}` : ''}</p>
        ${c.description ? `<p>${esc(c.description)}</p>` : ''}
        ${this._problemsHtml(this._problemsOf(c.id))}
        ${children.length ? `<p><span class="sb-ontology__muted">Kinds below:</span> ${this._list(children)}</p>` : ''}
        ${this._section('Properties', properties && `<div class="sb-ontology__rows">${properties}</div>`)}
        ${this._section('Relations', relations && `<div class="sb-ontology__rows">${relations}</div>`)}
        <p class="sb-ontology__muted">${individuals} ${individuals === 1 ? 'individual' : 'individuals'}${individuals !== direct ? `, ${direct} directly` : ''}</p>
        ${this._source(c)}`;
    }

    _linkDetails(link) {
      const relation = this._o.relation.get(link.relation);
      const verb = link.relation === IS ? 'is a kind of' : this._name(link.relation);
      return `
        <p>${this._go(link.from)} ${esc(verb)} ${this._go(link.to)}</p>
        ${relation?.description ? `<p>${esc(relation.description)}</p>` : ''}
        ${relation ? this._source(relation) : ''}`;
    }

    // With nothing selected: the problems with what's drawn, each one a way to its thing or link.
    _problemList(level) {
      const drawn = new Set([...this._drawn(level), ...this._shown.map(refOf)]);
      const here = this._problems.filter((problem) => drawn.has(problem.ref));
      if (!here.length) return '<p class="sb-ontology__muted">Select a box or link to see its details.</p>';
      return `
        <p class="sb-ontology__muted">${here.length} ${here.length === 1 ? 'problem' : 'problems'} here. Select a box or link to see its details.</p>
        <ul class="sb-ontology__problems">${here.map((p) => `<li class="sb-ontology__problem">${this._goRef(p.ref)}: ${esc(p.text)}</li>`).join('')}</ul>`;
    }

    // ---- Interaction ----

    _click(target) {
      if (this._dropped) return void (this._dropped = false); // the end of a drag isn't a click
      const key = target.closest('.sb-ontology__key');
      if (key) return this._pin(key.dataset.key);
      const go = target.closest('.sb-ontology__go');
      if (go) {
        this.reveal(go.dataset.go);
        return this._select(go.dataset.type, go.dataset.go);
      }
      const button = target.closest('button[data-action]');
      if (button) return this._act(button);
      const part = target.closest('.sb-ontology__node, .sb-ontology__link');
      if (part) this._select(part.matches('.sb-ontology__node') ? part.dataset.type : 'link', part.dataset.ref);
      else if (target.closest('.sb-ontology__drawing') && this._selected !== null) this._select(null, null);
    }

    _act(button) {
      const { action } = button.dataset;
      if (action === 'level' && button.dataset.level !== this.level) {
        this.level = button.dataset.level;
        this._fire('sb-level', { level: this.level });
      }
    }

    // A legend key clicked stays lit until it's clicked again.
    _pin(key) {
      if (this._pinned.has(key)) this._pinned.delete(key);
      else this._pinned.add(key);
      this._paint();
    }

    // A legend key pointed at lights what it names, until the pointer moves off it.
    _hover(key) {
      if (key === this._hovered) return;
      this._hovered = key;
      this._paint();
    }

    // Dragging a box moves it, with its links following; the drawing's frame fits when it's let go.
    // A press that hardly moves is a click.
    _grab(e) {
      const node = e.target.closest('.sb-ontology__node');
      this._dropped = false;
      if (!node || e.button !== 0) return;
      const svg = node.ownerSVGElement, level = this.level, id = node.dataset.ref;
      const toDrawing = (event) => new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
      const start = toDrawing(e), from = this._boxes(level).get(id);
      let dragging = false;
      const move = (event) => {
        const at = toDrawing(event);
        if (!dragging && Math.hypot(at.x - start.x, at.y - start.y) < 4) return;
        dragging = true;
        node.classList.add('sb-ontology__node--dragging');
        const x = round(from.x + at.x - start.x), y = round(from.y + at.y - start.y);
        this._moved[level].set(id, { x, y });
        node.setAttribute('transform', `translate(${x},${y})`);
        this.querySelector('.sb-ontology__links').innerHTML = this._lines(this._shown, this._boxes(level));
        this._paint();
      };
      const drop = () => {
        node.removeEventListener('pointermove', move);
        node.classList.remove('sb-ontology__node--dragging');
        if (!dragging) return;
        this._dropped = true;
        const { viewBox, width, height } = frame(this._boxes(level));
        Object.entries({ viewBox, width, height }).forEach(([name, value]) => svg.setAttribute(name, value));
      };
      node.setPointerCapture?.(e.pointerId);
      node.addEventListener('pointermove', move);
      node.addEventListener('pointerup', drop, { once: true });
      node.addEventListener('pointercancel', drop, { once: true });
    }

    // Selecting marks a thing or link and tells the sandbox; nothing moves.
    _select(type, id) {
      this.selected = id;
      this._fire('sb-select', { type, id });
    }

    // Pointing at a thing or link tells the sandbox, so it can light up the same thing elsewhere.
    _point(target) {
      const part = target?.closest?.('.sb-ontology__node, .sb-ontology__link');
      const ref = part?.dataset.ref ?? null;
      if (ref === this._pointed) return;
      this._pointed = ref;
      this._previewed = part?.matches('.sb-ontology__node') ? ref : null;
      this._paint();
      this._fire('sb-point', part ? { type: part.matches('.sb-ontology__node') ? part.dataset.type : 'link', id: ref } : { type: null, id: null });
    }

    _fire(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
    }
  }

  customElements.define('sb-ontology', SbOntology);
})();
