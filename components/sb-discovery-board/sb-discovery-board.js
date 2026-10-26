// Sandkit sb-discovery-board 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A board of discovery: the sandbox's own items in columns, one per role they play, running across
// or down. Pointing at an item lights its chain, back along what leads to it and on along what it
// leads to, and draws only those links, labelled. A column folds down to make room. The board
// places what it's given by data-ref; what the items are is the sandbox's business.
//
//   <sb-discovery-board><div data-ref="SRC-1">…</div><div data-ref="CLM-1">…</div></sb-discovery-board>
//   board.columns = [{ title: 'Gathered', refs: ['SRC-1'] }, { title: 'Interpreted', refs: ['CLM-1'] }];
//   board.links = [{ from: 'SRC-1', to: 'CLM-1', label: 'supports' }];
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-discovery-board';
  const existing = customElements.get('sb-discovery-board');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-discovery-board>, so only one can run. Rename one by replacing every "sb-discovery-board" in its file.`);
    }
    return;
  }

  const SVG = 'http://www.w3.org/2000/svg';

  // The tones a link can take, as everywhere in Sandkit: fine, needs a look, wrong, or quiet.
  const TONES = {
    accent: 'var(--sb-accent, #2563eb)',
    good: 'var(--sb-good, #3f9142)',
    warn: 'var(--sb-warn, #d69e2e)',
    bad: 'var(--sb-bad, #c53030)',
    muted: 'var(--sb-muted, #616e7c)',
    text: 'var(--sb-text, #1f2933)',
  };
  const toneRules = Object.entries(TONES)
    .map(([tone, colour]) => `.sb-discovery-board__lines [data-tone="${tone}"] { --sb-discovery-board-link: ${colour}; }`).join('\n');
  const toneOf = (link) => (TONES[link.tone] ? link.tone : 'accent');

  // Columns side by side going across, with room between them for links to turn and be labelled;
  // bands one under another going down. Links are drawn only while a chain is lit.
  const CSS = `
    .sb-discovery-board { display: block; min-width: 0; overflow-x: auto; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-bg, #f5f6f8); color: var(--sb-text, #1f2933); }
    .sb-discovery-board__flow { position: relative; display: grid; gap: var(--sb-discovery-board-spacing, 30px); padding: 12px 14px 16px; }
    .sb-discovery-board--across .sb-discovery-board__flow { grid-auto-flow: column; grid-auto-columns: max-content; gap: var(--sb-discovery-board-spacing, 96px); align-items: start; width: max-content; min-width: 100%; box-sizing: border-box; }
    .sb-discovery-board__column { display: grid; grid-template-columns: var(--sb-discovery-board-folded, 96px) 1fr; gap: 12px; align-items: start; }
    .sb-discovery-board--across .sb-discovery-board__column { width: var(--sb-discovery-board-column, 170px); grid-template-columns: 1fr; gap: 18px; }
    .sb-discovery-board--across .sb-discovery-board__column--folded { width: var(--sb-discovery-board-folded, 96px); }
    .sb-discovery-board__title { margin: 6px 0 0; color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
    .sb-discovery-board--across .sb-discovery-board__title { margin: 0; }
    .sb-discovery-board__toggle { display: inline-flex; align-items: baseline; gap: 5px; padding: 0; border: 0; background: none; color: inherit; font: inherit; letter-spacing: inherit; text-transform: inherit; text-align: left; cursor: pointer; }
    .sb-discovery-board__toggle::before { content: '▾'; font-size: 11px; }
    .sb-discovery-board__column--folded .sb-discovery-board__toggle::before { content: '▸'; }
    .sb-discovery-board__toggle:hover { color: var(--sb-text, #1f2933); }
    .sb-discovery-board__toggle:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 2px; }
    .sb-discovery-board__items { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; align-items: start; min-width: 0; }
    .sb-discovery-board__column--folded .sb-discovery-board__items { grid-template-columns: repeat(auto-fill, minmax(var(--sb-discovery-board-folded, 96px), max-content)); }
    .sb-discovery-board--across .sb-discovery-board__items { grid-template-columns: 1fr; }
    .sb-discovery-board__item { position: relative; z-index: 1; min-width: 0; border-radius: var(--sb-radius, 8px); transition: opacity 0.15s; }
    .sb-discovery-board--tracing .sb-discovery-board__item:not(.sb-discovery-board__item--lit) { opacity: 0.25; }
    .sb-discovery-board__item--lit { box-shadow: 0 0 0 2px var(--sb-accent-soft, #eaf0ff); }
    .sb-discovery-board__item--focus { box-shadow: 0 0 0 2px var(--sb-accent, #2563eb); }
    .sb-discovery-board__lines { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
    .sb-discovery-board__lines { --sb-discovery-board-link: var(--sb-accent, #2563eb); }
    ${toneRules}
    .sb-discovery-board__lines > path { fill: none; stroke: var(--sb-discovery-board-link); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
    .sb-discovery-board__lines marker > * { fill: var(--sb-discovery-board-link); }
    .sb-discovery-board__lines text { fill: var(--sb-discovery-board-link); font: 600 10px var(--sb-font, system-ui, sans-serif); paint-order: stroke; stroke: var(--sb-bg, #f5f6f8); stroke-width: 4px; stroke-linejoin: round; }
    .sb-discovery-board__empty { padding: 12px 14px; color: var(--sb-muted, #616e7c); font-size: 13px; }`;

  function addStyle() {
    if (document.getElementById('sb-discovery-board-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-discovery-board-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  function el(tag, parts, text) {
    const node = document.createElement(tag);
    if (parts) node.className = parts.split(' ').map((part) => `sb-discovery-board__${part}`).join(' ');
    if (text != null) node.textContent = text;
    return node;
  }

  function svg(tag, attributes = {}) {
    const node = document.createElementNS(SVG, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    return node;
  }

  function groupBy(list, key) {
    const groups = new Map();
    for (const item of list) groups.set(key(item), [...(groups.get(key(item)) ?? []), item]);
    return groups;
  }

  const average = (list) => list.reduce((sum, n) => sum + n, 0) / list.length;

  // Everything reached from a ref by following links one way: back to what leads to it, or on to
  // what it leads to.
  function reach(ref, links, way) {
    const found = new Set([ref]);
    const queue = [ref];
    while (queue.length) {
      const at = queue.shift();
      for (const { from, to } of links) {
        const [here, next] = way === 'back' ? [to, from] : [from, to];
        if (here === at && !found.has(next)) {
          found.add(next);
          queue.push(next);
        }
      }
    }
    return found;
  }

  const unit = (dx, dy) => { const length = Math.hypot(dx, dy) || 1; return [dx / length, dy / length]; };
  const round = (n) => Math.round(n * 10) / 10;

  // A route of straight runs as a path with rounded corners, leaving out points that turn nothing.
  function rounded(points, radius = 8) {
    const distinct = points.filter((p, i) => !i || p[0] !== points[i - 1][0] || p[1] !== points[i - 1][1]);
    const turns = distinct.filter((p, i, all) => !i || i === all.length - 1
      || (p[0] - all[i - 1][0]) * (all[i + 1][1] - p[1]) !== (p[1] - all[i - 1][1]) * (all[i + 1][0] - p[0]));
    let d = `M${turns[0].map(round)}`;
    for (let i = 1; i < turns.length - 1; i++) {
      const [px, py] = turns[i], [ax, ay] = turns[i - 1], [bx, by] = turns[i + 1];
      const r = Math.min(radius, Math.hypot(px - ax, py - ay) / 2, Math.hypot(bx - px, by - py) / 2);
      const [ix, iy] = unit(px - ax, py - ay), [ox, oy] = unit(bx - px, by - py);
      d += ` L${[px - ix * r, py - iy * r].map(round)} Q${[px, py].map(round)} ${[px + ox * r, py + oy * r].map(round)}`;
    }
    return `${d} L${turns[turns.length - 1].map(round)}`;
  }

  // The point nearest to the one wanted that's clear of every block, with room either side, so a link
  // passing other items runs between them rather than behind or against them.
  function freeLane(blocks, wanted, min, max, margin = 10) {
    const taken = blocks.map(([start, end]) => [start - margin, end + margin]);
    const free = (v) => v >= min && v <= max && !taken.some(([start, end]) => v > start && v < end);
    if (free(wanted)) return wanted;
    return taken.flat().filter(free).sort((p, q) => Math.abs(p - wanted) - Math.abs(q - wanted))[0] ?? wanted;
  }

  // Whether two boxes come within a few pixels of each other.
  const crowds = (a, b, room = 2) => a.x < b.x + b.width + room && b.x < a.x + a.width + room && a.y < b.y + b.height + room && b.y < a.y + a.height + room;

  let instances = 0; // gives each board its own arrowhead id

  class SbDiscoveryBoard extends HTMLElement {
    static origin = ORIGIN;

    static observedAttributes = ['direction', 'spacing'];

    constructor() {
      super();
      this._columns = [];
      this._links = [];
      this._highlight = [];
      this._items = new Map();   // ref → the sandbox's element, kept while the board redraws
      this._places = new Map();  // ref → the board's holder for it, while it's on the board
      this._columnOf = new Map(); // ref → the position of its column among those shown
      this._folded = new Map();  // column title → folded or not, once the viewer has chosen
      this._id = `sb-discovery-board-${++instances}`; // names its arrowhead and dot
      this.addEventListener('pointerover', (e) => this._point(e.target));
      this.addEventListener('pointerleave', () => this._clear());
      this.addEventListener('focusin', (e) => this._point(e.target));
      this.addEventListener('focusout', () => this._clear());
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-discovery-board');
      this._space();
      this.render();
    }

    attributeChangedCallback(name) {
      if (name === 'spacing') this._space();
      else this.render();
    }

    // ---- Public API ----

    // [{ title, refs, folded }]: the columns in order, each with the refs of the items it holds.
    get columns() { return this._columns; }
    set columns(list) {
      this._columns = list || [];
      this.render();
    }

    // [{ from, to, label, tone }]: what leads to what, and in which tone. Drawn only along a lit chain.
    get links() { return this._links; }
    set links(list) {
      this._links = list || [];
      this._clear();
    }

    // `across` (the default): each column side by side. `down`: each a band, one under another.
    get direction() { return this.getAttribute('direction') === 'down' ? 'down' : 'across'; }
    set direction(name) { this.setAttribute('direction', name); }

    // The room between columns going across, or between bands going down, in pixels.
    get spacing() { return Number(this.getAttribute('spacing')) || null; }
    set spacing(px) {
      if (px) this.setAttribute('spacing', px);
      else this.removeAttribute('spacing');
    }

    // Refs to light, from outside: those items stand out, nothing fades, no links are drawn.
    get highlight() { return this._highlight; }
    set highlight(refs) {
      this._highlight = refs || [];
      if (!this._tracing) this._light(new Set(this._highlight));
    }

    // Unfolds the column holding a ref, so it shows in full. Returns whether the board holds it.
    reveal(ref) {
      const column = this._columns.find((c) => c.refs?.includes(ref) && this._items.has(ref));
      if (!column) return false;
      if (this._isFolded(column)) this._fold(column, false);
      return true;
    }

    // ---- Drawing ----

    render() {
      if (!this.isConnected) return;
      this._keepItems();
      this.classList.toggle('sb-discovery-board--across', this.direction === 'across');
      this._places.clear();
      this._columnOf.clear();
      const flow = el('div', 'flow');
      for (const column of this._columns) {
        const refs = (column.refs ?? []).filter((ref) => this._items.has(ref));
        if (!refs.length) continue;
        const position = flow.children.length;
        refs.forEach((ref) => this._columnOf.set(ref, position));
        flow.append(this._column(column, refs));
      }
      this._lines = svg('svg', { class: 'sb-discovery-board__lines' });
      flow.append(this._lines);
      this.replaceChildren(this._places.size ? flow : el('p', 'empty', 'Nothing on the board yet.'));
      this._tracing = null;
      this._light(new Set(this._highlight));
    }

    // A column: its title, which folds it, and a holder for each of its items.
    _column(column, refs) {
      const box = el('section', this._isFolded(column) ? 'column column--folded' : 'column');
      box.dataset.title = column.title;
      const toggle = el('button', 'toggle', column.title);
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', String(!this._isFolded(column)));
      toggle.addEventListener('click', () => this._fold(column, !this._isFolded(column)));
      const title = el('h5', 'title');
      title.append(toggle);
      const items = el('div', 'items');
      for (const ref of refs) {
        const place = el('div', 'item');
        place.append(this._items.get(ref));
        this._places.set(ref, place);
        items.append(place);
      }
      box.append(title, items);
      return box;
    }

    // Children carrying a data-ref are taken in, and placed wherever a column lists them.
    _keepItems() {
      for (const child of [...this.children]) {
        if (child.classList.contains('sb-discovery-board__flow') || !child.dataset.ref) continue;
        this._items.set(child.dataset.ref, child);
        child.remove();
      }
    }

    // Spacing sets the board's token, so the sandbox's own CSS can set it too; a lit chain is redrawn
    // to follow the items it moved.
    _space() {
      if (this.spacing) this.style.setProperty('--sb-discovery-board-spacing', `${this.spacing}px`);
      else this.style.removeProperty('--sb-discovery-board-spacing');
      const lit = this._tracing;
      this._clear();
      if (lit) this._point(this._places.get(lit));
    }

    _isFolded(column) {
      return this._folded.get(column.title) ?? Boolean(column.folded);
    }

    _fold(column, folded) {
      this._folded.set(column.title, folded);
      const box = [...this.querySelectorAll('.sb-discovery-board__column')].find((b) => b.dataset.title === column.title);
      box?.classList.toggle('sb-discovery-board__column--folded', folded);
      box?.querySelector('.sb-discovery-board__toggle').setAttribute('aria-expanded', String(!folded));
    }

    // ---- Chains ----

    // Pointing at an item lights everything that leads to it and everything it leads to, and draws
    // the links along those two ways only.
    _point(target) {
      const ref = [...this._places].find(([, place]) => place.contains(target))?.[0];
      if (!ref) return this._tracing && this._clear();
      if (ref === this._tracing) return;
      const shown = this._links.filter(({ from, to }) => this._places.has(from) && this._places.has(to));
      const back = reach(ref, shown, 'back'), on = reach(ref, shown, 'on');
      this._tracing = ref;
      this.classList.add('sb-discovery-board--tracing');
      this._light(new Set([...back, ...on]), ref);
      const onPath = ({ from, to }) => (back.has(from) && back.has(to)) || (on.has(from) && on.has(to));
      this._lines.replaceChildren(this._markers());
      this._drawLinks(shown.filter(onPath));
    }

    _clear() {
      if (!this._lines) return;
      this._tracing = null;
      this.classList.remove('sb-discovery-board--tracing');
      this._lines.replaceChildren();
      this._light(new Set(this._highlight));
    }

    _light(lit, focus = null) {
      for (const [ref, place] of this._places) {
        place.classList.toggle('sb-discovery-board__item--lit', lit.has(ref));
        place.classList.toggle('sb-discovery-board__item--focus', ref === focus);
      }
    }

    // An arrowhead where a link arrives, and a dot where it leaves, in each tone.
    _markers() {
      const defs = svg('defs');
      for (const tone of Object.keys(TONES)) {
        const arrow = svg('marker', { id: `${this._id}-arrow-${tone}`, 'data-tone': tone, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' });
        arrow.append(svg('path', { d: 'M0,1 L9,5 L0,9 z' }));
        const dot = svg('marker', { id: `${this._id}-dot-${tone}`, 'data-tone': tone, viewBox: '0 0 10 10', refX: '5', refY: '5', markerWidth: '5', markerHeight: '5' });
        dot.append(svg('circle', { cx: '5', cy: '5', r: '4' }));
        defs.append(arrow, dot);
      }
      return defs;
    }

    // ---- Links ----

    // Every link on a lit chain is planned together, so none shares a run with another. Routes are
    // worked out along the flow (u: x going across, y going down) and across it (v), then turned into
    // the board's x and y, so both directions route alike.
    _drawLinks(links) {
      const across = this.direction === 'across';
      const box = this._lines.getBoundingClientRect();
      const frame = new Map([...this._places].map(([ref, place]) => {
        const r = place.getBoundingClientRect();
        const [x0, x1, y0, y1] = [r.left - box.left, r.right - box.left, r.top - box.top, r.bottom - box.top];
        return [ref, across ? { u0: x0, u1: x1, v0: y0, v1: y1 } : { u0: y0, u1: y1, v0: x0, v1: x1 }];
      }));
      const columnOf = (ref) => this._columnOf.get(ref);
      const inColumn = (i) => [...frame].filter(([ref]) => columnOf(ref) === i).map(([, f]) => f);
      const middle = (f) => (f.v0 + f.v1) / 2;
      const columns = new Set(this._columnOf.values()).size;
      // The gap after each column: from its furthest item to the next column's nearest.
      const gaps = Array.from({ length: columns }, (_, i) => {
        const start = Math.max(...inColumn(i).map((f) => f.u1));
        const next = inColumn(i + 1);
        return { start, end: next.length ? Math.min(...next.map((f) => f.u0)) : start + 48, tracks: [] };
      });

      // Each link moves on to a later column, stays in its own, or goes back. Moving on, it leaves an
      // item's far end and arrives at the near end of its target; otherwise it arrives at the far end.
      const routes = links.map((link) => {
        const ca = columnOf(link.from), cb = columnOf(link.to);
        const way = cb > ca ? 'on' : cb === ca ? 'stay' : 'back';
        return { link, way, a: frame.get(link.from), b: frame.get(link.to), ca, cb,
          leaves: way === 'back' ? 'near' : 'far', arrives: way === 'on' ? 'near' : 'far' };
      });

      // Every point where links meet an item's side is laid out together (see _layoutSide), and each
      // kind arriving gets one label.
      const sides = new Map();
      const sideOf = (ref, end) => {
        const key = `${ref} ${end}`;
        if (!sides.has(key)) sides.set(key, { f: frame.get(ref), column: columnOf(ref), end, kinds: new Map(), leaving: [] });
        return sides.get(key);
      };
      for (const r of routes) {
        sideOf(r.link.from, r.leaves).leaving.push(r);
        const { kinds } = sideOf(r.link.to, r.arrives), label = r.link.label ?? '';
        kinds.set(label, [...(kinds.get(label) ?? []), r]);
      }
      const labels = [];
      for (const side of sides.values()) labels.push(...this._layoutSide(side, middle, across));

      // A lane past any columns in between, clear of their items and of lanes already taken: going
      // on, as near as can be to where the link leaves, so it runs straight when it can; going back,
      // beyond them all, so links running opposite ways never meet.
      const taken = [];
      for (const r of routes) {
        const [from, to] = r.way === 'on' ? [r.ca, r.cb] : [r.cb, r.ca];
        if (to - from < 2) continue;
        const items = [];
        for (let i = from + 1; i < to; i++) items.push(...inColumn(i).map((f) => [f.v0 - 10, f.v1 + 10]));
        const lanes = taken.filter((l) => l.from < to && from < l.to).map((l) => [l.v - 6, l.v + 6]);
        const wanted = r.way === 'back' ? Math.max(...items.map(([, end]) => end)) + 4 : r.port;
        r.lane = freeLane([...items, ...lanes], wanted, 4, (across ? box.height : box.width) - 4, 0);
        taken.push({ from, to, v: r.lane });
      }

      // The runs across each gap, each on its own track.
      for (const r of routes) {
        const out = r.way === 'back' ? r.ca - 1 : r.ca, into = r.way === 'on' ? r.cb - 1 : r.cb;
        if (out === into) gaps[out].tracks.push({ r, part: 'only', from: r.port, to: r.entry });
        else {
          gaps[out].tracks.push({ r, part: 'out', from: r.port, to: r.lane });
          gaps[into].tracks.push({ r, part: 'in', from: r.lane, to: r.entry });
        }
      }
      // Going across, a gap's runs keep clear of the labels arriving at the next column.
      labels.filter((l) => across && l.side === 'near').forEach((l) => {
        const gap = gaps[l.column - 1];
        gap.labels = Math.max(gap.labels ?? 0, this._measure(l.label) + 16);
      });
      for (const gap of gaps) this._tracks(gap, across);

      for (const r of routes) {
        const start = [r.leaves === 'far' ? r.a.u1 : r.a.u0, r.port], end = [r.arrives === 'near' ? r.b.u0 : r.b.u1, r.entry];
        const points = r.lane == null
          ? [start, [r.only, r.port], [r.only, r.entry], end]
          : [start, [r.out, r.port], [r.out, r.lane], [r.in, r.lane], [r.in, r.entry], end];
        const tone = toneOf(r.link);
        const path = svg('path', { d: rounded(points.map(([u, v]) => (across ? [u, v] : [v, u]))), 'data-tone': tone,
          'marker-start': `url(#${this._id}-dot-${tone})`, 'marker-end': `url(#${this._id}-arrow-${tone})` });
        path.dataset.from = r.link.from;
        path.dataset.to = r.link.to;
        this._lines.append(path);
      }
      this._placeLabels(labels, across);
    }

    // Places a gap's runs side by side, a few pixels apart, near the column they arrive at but clear of
    // the labels there (going down, labels sit along the band, so only a little room is kept). Runs
    // heading further along the gap sit nearer its start, so the runs into and out of it don't cross.
    _tracks(gap, across) {
      const { tracks } = gap;
      if (!tracks.length) return;
      const room = across ? Math.min(gap.labels ?? 20, (gap.end - gap.start) * 0.6) : 14;
      const first = gap.start + 10, last = Math.max(first, gap.end - room);
      const down = (t) => t.to >= t.from;
      tracks.sort((p, q) => (down(p) !== down(q) ? (down(p) ? -1 : 1) : down(p) ? q.to - p.to : p.to - q.to));
      const step = tracks.length > 1 ? Math.min(8, (last - first) / (tracks.length - 1)) : 0;
      tracks.forEach((t, i) => { t.r[t.part] = last - (tracks.length - 1 - i) * step; });
    }

    // Lays out every point where links meet one side of an item: on the near side, the kinds arriving
    // and then any links leaving back; on the far side, the links leaving and then any arriving. Each
    // is in the order of where it comes from or heads, so nothing crosses at the item; links sit a few
    // pixels apart, each kind keeps room for its label, and the whole is centred on the side, drawn
    // closer together only if it must. Returns the labels to place.
    _layoutSide({ f, column, end, kinds, leaving }, middle, across) {
      const step = 7;
      leaving.sort((p, q) => middle(p.b) - middle(q.b));
      const arriving = [...kinds].sort(([, p], [, q]) => average(p.map((r) => middle(r.a))) - average(q.map((r) => middle(r.a))));
      // Room before and after each kind's links: above them for a label at a column's near side,
      // below at its far side, after them along a band.
      const room = ([label]) => (!label ? [5, 5] : !across ? [5, this._measure(label) + 12] : end === 'near' ? [14, 4] : [4, 16]);
      const blocks = arriving.map((kind) => {
        const [before, after] = room(kind);
        kind[1].sort((p, q) => middle(p.a) - middle(q.a));
        return { kind, before, after, links: kind[1] };
      });
      const out = { links: leaving, before: 5, after: 5 };
      const order = (end === 'near' ? [...blocks, out] : [out, ...blocks]).filter((block) => block.links.length);
      const size = (block) => block.before + (block.links.length - 1) * step + block.after;
      const needed = order.reduce((sum, block) => sum + size(block), 0), length = f.v1 - f.v0;
      const scale = Math.min(1, length / needed);
      let at = f.v0 + Math.max(0, (length - needed) / 2);
      const labels = [];
      for (const block of order) {
        const points = block.links.map((_, i) => at + (block.before + i * step) * scale);
        block.links.forEach((r, i) => { r[block === out ? 'port' : 'entry'] = points[i]; });
        if (block.kind?.[0]) {
          const [label, group] = block.kind;
          labels.push({ label, side: end, column, at: across && end === 'near' ? points[0] : points[points.length - 1], b: f, tone: toneOf(group[0].link) });
        }
        at += size(block) * scale;
      }
      return labels;
    }

    // How wide a label is, drawn as the board draws them.
    _measure(label) {
      if (!label) return 0;
      const text = svg('text');
      text.textContent = label;
      this._lines.append(text);
      const width = text.getBBox().width;
      text.remove();
      return width;
    }

    // Each label beside where its links come in: above the line arriving at a column's near side,
    // below it at the far side, so labels in one gap face away from each other; along a band, just
    // before the item. Any that would still crowd another moves along until it's clear: up or down
    // beside a column, sideways along a band, never onto an item.
    _placeLabels(labels, across) {
      const placed = [];
      for (const { label, side, at, b, tone } of labels) {
        const [x, y, anchor, [dx, dy]] = across
          ? (side === 'near' ? [b.u0 - 8, at - 5, 'end', [0, -12]] : [b.u1 + 8, at + 13, 'start', [0, 12]])
          : (side === 'near' ? [at + 5, b.u0 - 4, 'start', [10, 0]] : [at + 5, b.u1 + 12, 'start', [10, 0]]);
        const text = svg('text', { x, y, 'text-anchor': anchor, 'data-tone': tone });
        text.textContent = label;
        this._lines.append(text);
        for (let tries = 0; tries < 12 && placed.some((box) => crowds(box, text.getBBox())); tries++) {
          text.setAttribute('x', Number(text.getAttribute('x')) + dx);
          text.setAttribute('y', Number(text.getAttribute('y')) + dy);
        }
        placed.push(text.getBBox());
      }
    }
  }

  customElements.define('sb-discovery-board', SbDiscoveryBoard);
})();
