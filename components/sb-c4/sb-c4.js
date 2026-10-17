// Sandkit sb-c4 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A C4 architecture diagram you can walk into. The sandbox describes the whole architecture once,
// as nested elements and the relationships between them; each view shows one level, with a path
// back up. Relationships deep inside roll up to the boxes you can see, so every view stays true.
//
//   c4.model = {
//     elements: [{ id: 'shop', name: 'Shop', kind: 'system', children: [{ id: 'web', name: 'Web app', kind: 'container' }] },
//                { id: 'pay', name: 'Payments', kind: 'system', external: true }],
//     relationships: [{ from: 'web', to: 'pay', label: 'Takes payment' }]
//   };
//   c4.path = ['shop'];
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-c4';
  const existing = customElements.get('sb-c4');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-c4>, so only one can run. Rename one by replacing every "sb-c4" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-c4 { display: block; overflow-x: auto; contain: inline-size; outline: none; } /* takes its container's width, and scrolls within it */
    .sb-c4__path { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; margin-bottom: 8px; font-size: 13px; }
    .sb-c4__step { padding: 1px 6px; font: inherit; color: var(--sb-accent, #2563eb); background: none; border: 0; border-radius: 4px; cursor: pointer; }
    .sb-c4__step:hover { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-c4__step[aria-current] { color: var(--sb-text, #1f2933); font-weight: 600; cursor: default; background: none; }
    .sb-c4__divider { color: var(--sb-muted, #616e7c); }
    .sb-c4__svg { display: block; margin: 0 auto; font-family: inherit; overflow: visible; }
    .sb-c4__boundary { fill: none; stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; stroke-dasharray: 6 4; }
    .sb-c4__boundary-label { font-size: 12px; font-weight: 600; fill: var(--sb-muted, #616e7c); }
    .sb-c4__element { cursor: pointer; }
    .sb-c4__shape { fill: var(--sb-accent, #2563eb); stroke: var(--sb-accent, #2563eb); stroke-width: 1.5; }
    .sb-c4__element--person .sb-c4__shape { fill: var(--sb-text, #1f2933); stroke: var(--sb-text, #1f2933); }
    .sb-c4__element--external .sb-c4__shape { fill: var(--sb-muted, #616e7c); stroke: var(--sb-muted, #616e7c); }
    .sb-c4__element--good .sb-c4__shape { stroke: var(--sb-good, #3f9142); stroke-width: 4; }
    .sb-c4__element--warn .sb-c4__shape { stroke: var(--sb-warn, #d69e2e); stroke-width: 4; }
    .sb-c4__element--bad .sb-c4__shape { stroke: var(--sb-bad, #c53030); stroke-width: 4; }
    .sb-c4__name { font-size: 13px; font-weight: 700; fill: var(--sb-accent-text, #fff); }
    .sb-c4__kind { font-size: 10.5px; fill: var(--sb-accent-text, #fff); opacity: 0.85; }
    .sb-c4__description { font-size: 11px; fill: var(--sb-accent-text, #fff); }
    .sb-c4__inside { font-size: 10.5px; font-weight: 600; fill: var(--sb-accent-text, #fff); text-decoration: underline; }
    .sb-c4__element--highlighted .sb-c4__shape { stroke: var(--sb-warn, #d69e2e); stroke-width: 4; }
    .sb-c4__element--holds-highlight .sb-c4__shape { stroke: var(--sb-warn, #d69e2e); stroke-width: 4; stroke-dasharray: 5 3; }
    .sb-c4__element--faded, .sb-c4__relationship--faded { opacity: 0.3; }
    .sb-c4__relationship { cursor: pointer; }
    .sb-c4__line { fill: none; stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; stroke-dasharray: 5 3; }
    .sb-c4__arrow { fill: var(--sb-muted, #616e7c); }
    .sb-c4__hit { fill: none; stroke: transparent; stroke-width: 12; }
    .sb-c4__label { font-size: 11px; fill: var(--sb-text, #1f2933); paint-order: stroke; stroke: var(--sb-surface, #fff); stroke-width: 4px; stroke-linejoin: round; }
    .sb-c4__label-detail { font-size: 10px; fill: var(--sb-muted, #616e7c); }
    .sb-c4__relationship--highlighted .sb-c4__line { stroke: var(--sb-warn, #d69e2e); stroke-width: 3; stroke-dasharray: none; }
    .sb-c4__relationship--highlighted .sb-c4__arrow { fill: var(--sb-warn, #d69e2e); }
    .sb-c4__empty { color: var(--sb-muted, #616e7c); font-size: 13px; }`;

  // Sizes, in SVG units (which are pixels, since the diagram is never scaled).
  const BOX = { width: 190, padding: 10, line: 15, wrap: 28, descriptionLines: 3 };
  const GAP = { across: 56, down: 84 };
  const BOUNDARY = { padding: 26, title: 22 };
  const HEAD = 16;          // a person's head, above their box
  const RIM = 8;            // a database's rounded top, above its text
  const ARROW = { length: 9, half: 4.5 };
  const BENDS = [0, 70, -70, 140, -140, 220, -220]; // how far a line may bow out to get round boxes
  const CLEARANCE = 6;      // how close a line may pass a box it doesn't join
  const LABEL = { charWidth: 6.2, detailCharWidth: 5.6, padding: 8, line: 13, along: [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8] };
  const FRAME_PADDING = 12;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const KIND_NAMES = { person: 'Person', system: 'Software system', container: 'Container', component: 'Component', database: 'Database', queue: 'Queue' };

  function addStyle() {
    if (document.getElementById('sb-c4-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-c4-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Words wrapped into lines of about `width` characters, at most `most` lines.
  function wrap(text, width, most) {
    const lines = [];
    for (const word of String(text ?? '').split(/\s+/).filter(Boolean)) {
      if (lines.length && (lines.at(-1) + ' ' + word).length <= width) lines[lines.length - 1] += ' ' + word;
      else lines.push(word);
    }
    if (lines.length > most) lines.splice(most - 1, Infinity, lines[most - 1] + '…');
    return lines;
  }

  // ---- The model ----

  // Every element by id, with the ids of its ancestors, outermost first.
  function index(elements, ancestors = [], found = new Map()) {
    for (const element of elements) {
      found.set(String(element.id), { element, ancestors });
      index(element.children ?? [], [...ancestors, String(element.id)], found);
    }
    return found;
  }

  // Which box stands for an element in the view inside `path`: the element itself, or the
  // ancestor of it that's shown. Null for the focus itself and anything enclosing it.
  function standIn(id, path, elements) {
    const entry = elements.get(String(id));
    if (!entry) return null;
    const line = [...entry.ancestors, String(id)];
    const depth = path.findIndex((step, i) => line[i] !== step);
    const at = depth < 0 ? path.length : depth;
    return line[at] ?? null;
  }

  // The view inside `path`: the boxes inside the focus, the boxes outside it that they talk to,
  // and every relationship rolled up onto those boxes, those joining the same two boxes merged.
  function view(model, elements, path) {
    const focus = path.length ? elements.get(path.at(-1)).element : null;
    const inside = focus ? focus.children ?? [] : model.elements;
    const insideIds = new Set(inside.map((e) => String(e.id)));
    const links = new Map();
    for (const relationship of model.relationships) {
      const from = standIn(relationship.from, path, elements), to = standIn(relationship.to, path, elements);
      if (!from || !to || from === to) continue;
      if (focus && !insideIds.has(from) && !insideIds.has(to)) continue;
      const key = `${from}->${to}`;
      if (!links.has(key)) links.set(key, { key, from, to, relationships: [] });
      links.get(key).relationships.push(relationship);
    }
    const outsideIds = [...new Set([...links.values()].flatMap((l) => [l.from, l.to]))].filter((id) => !insideIds.has(id));
    return { focus, inside, outside: outsideIds.map((id) => elements.get(id).element), links: [...links.values()] };
  }

  // ---- Layout ----

  // How tall a box is, from what it says.
  function measure(element) {
    const description = wrap(element.description, BOX.wrap, BOX.descriptionLines);
    const lines = 2 + description.length + (element.children?.length ? 1 : 0);
    const rim = element.kind === 'database' ? RIM : 0;
    return { width: BOX.width, height: lines * BOX.line + 2 * BOX.padding + (description.length ? 4 : 0) + rim, description, rim };
  }

  // Rows from top to bottom, by who calls whom: each element sits below everything that leads
  // to it, loops set aside.
  function rows(elements, links) {
    const ids = elements.map((e) => String(e.id));
    const outgoing = new Map(ids.map((id) => [id, links.filter((l) => l.from === id && ids.includes(l.to)).map((l) => l.to)]));
    const state = new Map(), finished = [], loops = new Set();
    const visit = (id) => {
      state.set(id, 'visiting');
      for (const to of outgoing.get(id)) {
        if (state.get(to) === 'visiting') loops.add(`${id}->${to}`);
        else if (!state.has(to)) visit(to);
      }
      state.set(id, 'done');
      finished.push(id);
    };
    const entered = new Set([...outgoing.values()].flat());
    for (const id of ids) if (!entered.has(id) && !state.has(id)) visit(id);
    for (const id of ids) if (!state.has(id)) visit(id);
    const rank = new Map(ids.map((id) => [id, 0]));
    for (const id of finished.reverse()) {
      for (const to of outgoing.get(id)) if (!loops.has(`${id}->${to}`)) rank.set(to, Math.max(rank.get(to), rank.get(id) + 1));
    }
    const grouped = [];
    for (const element of elements) (grouped[rank.get(String(element.id))] ??= []).push(element);
    return grouped.filter(Boolean);
  }

  // Places rows of boxes, centred on x = 0 and starting at `top`. Returns the placed boxes and the
  // block's extent.
  function placeRows(rowList, top) {
    const placed = [];
    let y = top, width = 0;
    for (const row of rowList) {
      const sized = row.map((e) => ({ element: e, ...measure(e) }));
      const rowWidth = sized.reduce((sum, b) => sum + b.width, 0) + GAP.across * (sized.length - 1);
      const rowHeight = Math.max(...sized.map((b) => b.height + (b.element.kind === 'person' ? HEAD : 0)));
      let x = -rowWidth / 2;
      for (const b of sized) {
        const head = b.element.kind === 'person' ? HEAD : 0;
        placed.push({ ...b, x, y: y + head + (rowHeight - head - b.height) / 2 });
        x += b.width + GAP.across;
      }
      width = Math.max(width, rowWidth);
      y += rowHeight + GAP.down;
    }
    return { placed, width, bottom: y - GAP.down };
  }

  // The whole view's positions. At the top, rows by who calls whom. Inside an element, its
  // children sit in a boundary, with what calls into them above and what they call below.
  function layout(v) {
    if (!v.focus) {
      const { placed } = placeRows(rows(v.inside, v.links), 0);
      return { boxes: placed, boundary: null };
    }
    const sends = (id) => v.links.filter((l) => l.from === id).length;
    const receives = (id) => v.links.filter((l) => l.to === id).length;
    const above = v.outside.filter((e) => sends(String(e.id)) >= receives(String(e.id)));
    const below = v.outside.filter((e) => !above.includes(e));

    const top = above.length ? placeRows([above], 0) : { placed: [], bottom: -GAP.down };
    const innerTop = top.bottom + GAP.down + BOUNDARY.padding + BOUNDARY.title;
    const inner = v.inside.length ? placeRows(rows(v.inside, v.links), innerTop) : { placed: [], width: BOX.width, bottom: innerTop + 40 };
    const boundary = {
      x: -inner.width / 2 - BOUNDARY.padding, y: top.bottom + GAP.down,
      width: inner.width + 2 * BOUNDARY.padding, height: inner.bottom - (top.bottom + GAP.down) + BOUNDARY.padding,
      label: v.focus.name ?? v.focus.id, kind: v.focus.kind
    };
    const bottom = below.length ? placeRows([below], boundary.y + boundary.height + GAP.down) : { placed: [] };
    return { boxes: [...top.placed, ...inner.placed, ...bottom.placed], boundary };
  }

  // ---- Drawing ----

  const centre = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

  // Where a line from a box's centre towards a point leaves the box.
  function edge(box, toward) {
    const c = centre(box);
    const dx = toward.x - c.x, dy = toward.y - c.y;
    const t = Math.min(box.width / 2 / Math.abs(dx || 1e-9), box.height / 2 / Math.abs(dy || 1e-9));
    return { x: c.x + dx * t, y: c.y + dy * t };
  }

  // A line from box a to box b that doesn't cross any other box: straight if it can be, otherwise
  // bowed to one side, as little as will do. A curve through a control point, with a way to find
  // any point along it.
  function route(a, b, others) {
    const ca = centre(a), cb = centre(b);
    const length = Math.hypot(cb.x - ca.x, cb.y - ca.y) || 1;
    const normal = { x: -(cb.y - ca.y) / length, y: (cb.x - ca.x) / length };
    const inside = (p, box) => p.x > box.x - CLEARANCE && p.x < box.x + box.width + CLEARANCE &&
      p.y > box.y - CLEARANCE - (box.element.kind === 'person' ? HEAD : 0) && p.y < box.y + box.height + CLEARANCE;
    const curve = (bend) => {
      const control = { x: (ca.x + cb.x) / 2 + normal.x * bend, y: (ca.y + cb.y) / 2 + normal.y * bend };
      const start = edge(a, control), end = edge(b, control);
      const pointAt = (t) => ({
        x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t * t * end.x,
        y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t * t * end.y
      });
      return { start, control, end, pointAt };
    };
    const clear = (c) => Array.from({ length: 19 }, (_, i) => c.pointAt((i + 1) / 20)).every((p) => !others.some((box) => inside(p, box)));
    return BENDS.map(curve).find(clear) ?? curve(0);
  }

  // Where along its line a label goes: the first spot clear of every box and every label already
  // placed, trying the middle first.
  function placeLabel(lines, pointAt, boxes, placed) {
    const width = Math.max(...lines.map((l, i) => l.length * (i ? LABEL.detailCharWidth : LABEL.charWidth))) + LABEL.padding;
    const height = lines.length * LABEL.line + 2;
    const at = (t) => { const p = pointAt(t); return { x: p.x - width / 2, y: p.y - LABEL.line + 2, width, height, centre: p }; };
    const overlaps = (r, o) => r.x < o.x + o.width && o.x < r.x + r.width && r.y < o.y + o.height && o.y < r.y + r.height;
    const spot = LABEL.along.map(at).find((r) => !boxes.some((b) => overlaps(r, b)) && !placed.some((o) => overlaps(r, o))) ?? at(0.5);
    placed.push(spot);
    return spot.centre;
  }

  function shape(b) {
    const { x, y, width: w, height: h } = b;
    switch (b.element.kind) {
      case 'person':
        return `<circle class="sb-c4__shape" cx="${x + w / 2}" cy="${y - HEAD / 2 + 2}" r="${HEAD - 2}"/>
          <rect class="sb-c4__shape" x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/>`;
      case 'database': {
        const r = 9;
        return `<path class="sb-c4__shape" d="M${x},${y + r} A${w / 2},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${w / 2},${r} 0 0 1 ${x},${y + h - r} Z"/>
          <path class="sb-c4__shape" style="stroke: var(--sb-accent-text, #fff); stroke-opacity: 0.5; fill: none" d="M${x},${y + r} A${w / 2},${r} 0 0 0 ${x + w},${y + r}"/>`;
      }
      case 'queue':
        return `<rect class="sb-c4__shape" x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/>`;
      default:
        return `<rect class="sb-c4__shape" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>`;
    }
  }

  // ---- The element ----

  class SbC4 extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['root-label'];

    constructor() {
      super();
      this._model = { elements: [], relationships: [] };
      this._elements = new Map();
      this._path = [];
      this._highlight = {};
      this._pointedAt = null; // { type, id } of what is under the pointer
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('dblclick', (e) => {
        const box = e.target.closest('[data-element]');
        if (box) this._enter(box.dataset.element);
      });
      this.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this._path.length) {
          e.preventDefault();
          this._go(this._path.slice(0, -1));
        }
      });
      this.addEventListener('pointerover', (e) => {
        const part = e.target.closest('[data-element], [data-link]');
        this._pointAt(part ? (part.dataset.element ? { type: 'element', id: part.dataset.element } : { type: 'link', id: part.dataset.link }) : null);
      });
      this.addEventListener('pointerleave', () => this._pointAt(null));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-c4');
      if (!this.hasAttribute('tabindex')) this.tabIndex = 0; // focusable, so Escape can go back up
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // { elements: [{ id, name, kind, technology, description, external, tone, children }],
    //   relationships: [{ id, from, to, label, technology }] }
    get model() { return this._model; }
    set model(value) {
      this._model = { elements: [], relationships: [], ...value };
      this._elements = index(this._model.elements);
      this._path = this._validPath(this._path);
      this.render();
    }

    // The ids of the elements we're inside, outermost first; [] for the top. Setting it doesn't
    // fire sb-navigate.
    get path() { return [...this._path]; }
    set path(ids) {
      this._path = this._validPath((ids || []).map(String));
      this.render();
    }

    // { elements: [ids], relationships: [ids] }: what to point at. An element folded inside a box
    // marks that box; a relationship lights the line it's rolled into.
    get highlight() { return this._highlight; }
    set highlight(value) {
      this._highlight = value || {};
      this._showHighlight();
    }

    // Goes to the view where an element can be seen, and highlights it.
    reveal(id) {
      const entry = this._elements.get(String(id));
      if (!entry) return;
      this.path = entry.ancestors;
      this.highlight = { elements: [String(id)] };
    }

    // Only elements with children can be entered; a path stops at the first that can't.
    _validPath(ids) {
      const valid = [];
      for (const id of ids) {
        const entry = this._elements.get(id);
        const parent = valid.at(-1) ?? null;
        if (!entry || !entry.element.children?.length || (entry.ancestors.at(-1) ?? null) !== parent) break;
        valid.push(id);
      }
      return valid;
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      if (!this._model.elements.length) {
        this.innerHTML = '<div class="sb-c4__empty">Nothing yet.</div>';
        return;
      }
      this._view = view(this._model, this._elements, this._path);
      const { boxes, boundary } = layout(this._view);
      this._boxes = new Map(boxes.map((b) => [String(b.element.id), b]));
      const frame = this._frame(boxes, boundary);
      this.innerHTML = `
        <nav class="sb-c4__path" aria-label="Where you are">${this._crumbs()}</nav>
        <svg class="sb-c4__svg" viewBox="${frame.x} ${frame.y} ${frame.width} ${frame.height}" width="${frame.width}" role="img" aria-label="${esc(this._describe())}">
          ${boundary ? this._boundary(boundary) : ''}
          ${this._links()}
          ${boxes.map((b) => this._box(b)).join('')}
        </svg>`;
      this._showHighlight();
    }

    _frame(boxes, boundary) {
      const xs = [], ys = [];
      for (const b of boxes) { xs.push(b.x, b.x + b.width); ys.push(b.y - HEAD, b.y + b.height); }
      if (boundary) { xs.push(boundary.x, boundary.x + boundary.width); ys.push(boundary.y, boundary.y + boundary.height); }
      const x = Math.min(...xs) - FRAME_PADDING, y = Math.min(...ys) - FRAME_PADDING;
      return { x, y, width: Math.max(...xs) - x + FRAME_PADDING, height: Math.max(...ys) - y + FRAME_PADDING };
    }

    _crumbs() {
      const steps = [{ path: [], name: this.getAttribute('root-label') || 'Overview' },
        ...this._path.map((id, i) => ({ path: this._path.slice(0, i + 1), name: this._elements.get(id).element.name ?? id }))];
      return steps.map((step, i) => {
        const current = i === steps.length - 1;
        return `${i ? '<span class="sb-c4__divider" aria-hidden="true">›</span>' : ''}<button type="button" class="sb-c4__step" data-path="${esc(JSON.stringify(step.path))}"${current ? ' aria-current="location"' : ''}>${esc(step.name)}</button>`;
      }).join('');
    }

    _describe() {
      const where = this._path.length ? `Inside ${this._view.focus.name ?? this._view.focus.id}` : 'Overview';
      return `${where}: ${this._view.inside.map((e) => e.name ?? e.id).join(', ')}`;
    }

    // Titled at its bottom left, as C4 boundaries are, clear of the lines coming in from above.
    _boundary(b) {
      const kind = KIND_NAMES[b.kind] ?? b.kind;
      return `
        <rect class="sb-c4__boundary" x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="8"/>
        <text class="sb-c4__boundary-label" x="${b.x + 10}" y="${b.y + b.height - 9}">${esc(b.label)}${kind ? ` [${esc(kind)}]` : ''}</text>`;
    }

    _box(b) {
      const e = b.element;
      const kind = KIND_NAMES[e.kind] ?? e.kind ?? 'Software system';
      const classes = ['sb-c4__element', `sb-c4__element--${esc(e.kind ?? 'system')}`];
      if (e.external) classes.push('sb-c4__element--external');
      if (e.tone) classes.push(`sb-c4__element--${esc(e.tone)}`);
      const lines = [
        `<tspan class="sb-c4__name" x="${b.x + b.width / 2}" dy="0">${esc(e.name ?? e.id)}</tspan>`,
        `<tspan class="sb-c4__kind" x="${b.x + b.width / 2}" dy="${BOX.line}">[${esc(kind)}${e.technology ? `: ${esc(e.technology)}` : ''}]</tspan>`,
        ...b.description.map((line, i) => `<tspan class="sb-c4__description" x="${b.x + b.width / 2}" dy="${BOX.line + (i ? 0 : 4)}">${esc(line)}</tspan>`)
      ];
      const count = e.children?.length;
      const inside = count ? `<text class="sb-c4__inside" data-enter="${esc(e.id)}" x="${b.x + b.width / 2}" y="${b.y + b.height - BOX.padding + 1}" text-anchor="middle">⤢ ${count} inside</text>` : '';
      return `
        <g class="${classes.join(' ')}" data-element="${esc(e.id)}">
          <title>${esc(e.name ?? e.id)}${e.description ? `: ${esc(e.description)}` : ''}</title>
          ${shape(b)}
          <text text-anchor="middle" y="${b.y + BOX.padding + 12 + b.rim}">${lines.join('')}</text>
          ${inside}
        </g>`;
    }

    // Every line, then their labels, each placed clear of the boxes and of the labels before it.
    _links() {
      const boxes = [...this._boxes.values()];
      const placed = [];
      return this._view.links.map((link) => this._link(link, boxes, placed)).join('');
    }

    // A line between two boxes, labelled with what it is, or how many relationships it carries.
    _link(link, boxes, placed) {
      const a = this._boxes.get(link.from), b = this._boxes.get(link.to);
      if (!a || !b) return '';
      const { start, control, end, pointAt } = route(a, b, [...this._boxes.values()].filter((box) => box !== a && box !== b));
      // The arrow points along the curve as it arrives.
      const length = Math.hypot(end.x - control.x, end.y - control.y) || 1;
      const ux = (end.x - control.x) / length, uy = (end.y - control.y) / length;
      const bx = end.x - ux * ARROW.length, by = end.y - uy * ARROW.length;
      const d = `M${start.x},${start.y} Q${control.x},${control.y} ${bx},${by}`;
      const one = link.relationships.length === 1 ? link.relationships[0] : null;
      const label = one ? one.label ?? '' : `${link.relationships.length} relationships`;
      const technology = one?.technology ? `[${one.technology}]` : '';
      const mid = placeLabel(technology ? [label, technology] : [label], pointAt, boxes, placed);
      const detail = technology ? `<tspan class="sb-c4__label-detail" x="${mid.x}" dy="${LABEL.line}">${esc(technology)}</tspan>` : '';
      const listing = link.relationships.map((r) => `${this._name(r.from)} → ${this._name(r.to)}${r.label ? `: ${r.label}` : ''}`).join('\n');
      return `
        <g class="sb-c4__relationship" data-link="${esc(link.key)}">
          <title>${esc(listing)}</title>
          <path class="sb-c4__hit" d="${d}"/>
          <path class="sb-c4__line" d="${d}"/>
          <path class="sb-c4__arrow" d="M${end.x},${end.y} L${bx - uy * ARROW.half},${by + ux * ARROW.half} L${bx + uy * ARROW.half},${by - ux * ARROW.half} z"/>
          <text class="sb-c4__label" text-anchor="middle" x="${mid.x}" y="${mid.y}"><tspan x="${mid.x}" dy="0">${esc(label)}</tspan>${detail}</text>
        </g>`;
    }

    _name(id) {
      const entry = this._elements.get(String(id));
      return entry ? entry.element.name ?? id : id;
    }

    // ---- Pointing ----

    // Lights what is highlighted or pointed at. Highlighted elements are outlined, or, when folded
    // inside a box, mark that box; highlighted relationships light the line they're rolled into.
    // Pointing at a box lights it with its lines and neighbours, and at a line, it and its two
    // boxes; everything else fades.
    _showHighlight() {
      if (!this._view) return;
      const outlined = new Set(), holders = new Set(), lines = new Set(), kept = new Set();
      for (const id of (this._highlight.elements ?? []).map(String)) {
        const shown = standIn(id, this._path, this._elements);
        if (shown && this._boxes.has(shown)) (shown === id ? outlined : holders).add(shown);
      }
      const wanted = new Set((this._highlight.relationships ?? []).map(String));
      for (const link of this._view.links) {
        if (link.relationships.some((r) => r.id != null && wanted.has(String(r.id)))) lines.add(link.key);
      }
      const pointed = this._pointedAt;
      if (pointed) {
        const isBox = pointed.type === 'element';
        if (isBox) {
          outlined.add(pointed.id);
          kept.add(pointed.id);
        }
        const touching = this._view.links.filter((l) => (isBox ? l.from === pointed.id || l.to === pointed.id : l.key === pointed.id));
        for (const link of touching) {
          lines.add(link.key);
          kept.add(link.from);
          kept.add(link.to);
        }
      }
      for (const el of this.querySelectorAll('.sb-c4__element')) {
        const id = el.dataset.element;
        el.classList.toggle('sb-c4__element--highlighted', outlined.has(id));
        el.classList.toggle('sb-c4__element--holds-highlight', holders.has(id));
        el.classList.toggle('sb-c4__element--faded', !!pointed && !kept.has(id));
      }
      for (const el of this.querySelectorAll('.sb-c4__relationship')) {
        el.classList.toggle('sb-c4__relationship--highlighted', lines.has(el.dataset.link));
        el.classList.toggle('sb-c4__relationship--faded', !!pointed && !lines.has(el.dataset.link));
      }
    }

    _pointAt(part) {
      if (part?.type === this._pointedAt?.type && part?.id === this._pointedAt?.id) return;
      this._pointedAt = part;
      this._showHighlight();
    }

    // ---- Navigation ----

    _go(path) {
      const before = JSON.stringify(this._path);
      this.path = path;
      this._pointedAt = null;
      if (JSON.stringify(this._path) !== before) {
        this.dispatchEvent(new CustomEvent('sb-navigate', { bubbles: true, detail: { path: this.path } }));
      }
    }

    _enter(id) {
      const entry = this._elements.get(String(id));
      if (entry?.element.children?.length) this._go([...entry.ancestors, String(id)]);
    }

    // The path steps go back up; a box's "inside" link goes in; anywhere else on a box selects it.
    _click(e) {
      const step = e.target.closest('.sb-c4__step');
      if (step) return this._go(JSON.parse(step.dataset.path));
      const enter = e.target.closest('[data-enter]');
      if (enter) return this._enter(enter.dataset.enter);
      const box = e.target.closest('[data-element]');
      const link = e.target.closest('[data-link]');
      if (box) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { type: 'element', id: box.dataset.element } }));
      else if (link) {
        const found = this._view.links.find((l) => l.key === link.dataset.link);
        this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { type: 'relationship', relationships: found.relationships } }));
      }
    }
  }

  customElements.define('sb-c4', SbC4);
})();
