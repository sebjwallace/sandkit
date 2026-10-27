// Sandkit sb-lineage 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Where things come from and what they lead to: the sandbox's own items in columns, running across
// or down, with labelled links between them. Every link is drawn, and pointing at an item dims
// everything not linked to it; or links show only along the chain pointed at. Given a subject, it
// shows only what leads to it and what it leads to, and viewers follow items with a trail back.
// Viewers pan and zoom, or scroll sideways with it switched off, in the page or full screen. A
// column folds down to make room. It places what it's given by data-ref; what the items are is
// the sandbox's business.
//
//   <sb-lineage><div data-ref="M-1">…</div><div data-ref="R-1">…</div></sb-lineage>
//   lineage.columns = [{ title: 'Meters', refs: ['M-1'] }, { title: 'Readings', refs: ['R-1'] }];
//   lineage.links = [{ from: 'M-1', to: 'R-1', label: 'records' }];
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-lineage';
  const existing = customElements.get('sb-lineage');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-lineage>, so only one can run. Rename one by replacing every "sb-lineage" in its file.`);
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
    .map(([tone, colour]) => `.sb-lineage__lines [data-tone="${tone}"] { --sb-lineage-link: ${colour}; }`).join('\n');
  const toneOf = (link) => (TONES[link.tone] ? link.tone : 'accent');

  // Columns side by side going across, with room between them for links to turn and be labelled;
  // bands one under another going down. While an item is pointed at, what isn't lit fades.
  const CSS = `
    .sb-lineage { display: block; min-width: 0; }
    .sb-lineage__box { display: flex; flex-direction: column; box-sizing: border-box; height: 100%; overflow: hidden; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-bg, #f5f6f8); color: var(--sb-text, #1f2933); }
    .sb-lineage__box--full { position: fixed; inset: 0; z-index: 1000; height: auto; border: 0; border-radius: 0; }
    .sb-lineage__box--full .sb-lineage__viewport { max-height: none; }
    .sb-lineage__flow { position: relative; display: grid; gap: var(--sb-lineage-spacing, 30px); padding: 12px 14px 16px; }
    .sb-lineage--across .sb-lineage__flow { grid-auto-flow: column; grid-auto-columns: max-content; gap: var(--sb-lineage-spacing, 96px); align-items: start; width: max-content; min-width: 100%; box-sizing: border-box; }
    .sb-lineage__column { display: grid; grid-template-columns: var(--sb-lineage-folded, 96px) 1fr; gap: 12px; align-items: start; }
    .sb-lineage--across .sb-lineage__column { width: var(--sb-lineage-column, 170px); grid-template-columns: 1fr; gap: 18px; }
    .sb-lineage--across .sb-lineage__column--folded { width: var(--sb-lineage-folded, 96px); }
    .sb-lineage__title { margin: 6px 0 0; color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
    .sb-lineage--across .sb-lineage__title { margin: 0; }
    .sb-lineage__toggle { display: inline-flex; align-items: baseline; gap: 5px; padding: 0; border: 0; background: none; color: inherit; font: inherit; letter-spacing: inherit; text-transform: inherit; text-align: left; cursor: pointer; }
    .sb-lineage__toggle::before { content: '▾'; font-size: 11px; }
    .sb-lineage__column--folded .sb-lineage__toggle::before { content: '▸'; }
    .sb-lineage__toggle:hover { color: var(--sb-text, #1f2933); }
    .sb-lineage__toggle:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 2px; }
    .sb-lineage__items { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; align-items: start; min-width: 0; }
    .sb-lineage__column--folded .sb-lineage__items { grid-template-columns: repeat(auto-fill, minmax(var(--sb-lineage-folded, 96px), max-content)); }
    .sb-lineage--across .sb-lineage__items { grid-template-columns: 1fr; }
    .sb-lineage__item { position: relative; z-index: 1; min-width: 0; border-radius: var(--sb-radius, 8px); transition: opacity 0.15s; }
    .sb-lineage--pointing .sb-lineage__item:not(.sb-lineage__item--lit) { opacity: 0.25; }
    .sb-lineage__item--lit { box-shadow: 0 0 0 2px var(--sb-accent-soft, #eaf0ff); }
    .sb-lineage__item--focus { box-shadow: 0 0 0 2px var(--sb-accent, #2563eb); }
    .sb-lineage__item--subject { box-shadow: 0 0 0 3px var(--sb-accent, #2563eb); }
    .sb-lineage__frame { position: relative; display: flex; flex: 1 1 auto; min-height: 0; }
    .sb-lineage__viewport { flex: 1; min-width: 0; overflow-x: auto; }
    .sb-lineage--zoom .sb-lineage__viewport { overflow: hidden; max-height: var(--sb-lineage-max-height, 70vh); touch-action: none; cursor: grab; }
    .sb-lineage--zoom .sb-lineage__viewport--dragging { cursor: grabbing; }
    .sb-lineage__viewport:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -2px; }
    /* Dragging pans, so it never selects text on the way. */
    .sb-lineage--zoom .sb-lineage__flow { transform-origin: 0 0; user-select: none; -webkit-user-select: none; }
    .sb-lineage__tools { position: absolute; bottom: 8px; right: 8px; z-index: 2; display: flex; gap: 4px; }
    .sb-lineage:not(.sb-lineage--zoom) .sb-lineage__tool--zoom { display: none; }
    .sb-lineage__trail { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 10px 14px 0; font-size: 12px; color: var(--sb-muted, #616e7c); }
    .sb-lineage__trail button, .sb-lineage__tool { padding: 2px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: inherit; cursor: pointer; }
    .sb-lineage__tool svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; vertical-align: -1px; }
    .sb-lineage__tool { min-width: 26px; font-size: 12px; box-shadow: var(--sb-lift-shadow, none); }
    .sb-lineage__tool[aria-pressed="true"] { border-color: var(--sb-accent, #2563eb); color: var(--sb-accent, #2563eb); }
    .sb-lineage__trail button:disabled { opacity: 0.4; cursor: default; }
    .sb-lineage__trail button:focus-visible, .sb-lineage__tool:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 2px; }
    .sb-lineage__trail .sb-lineage__crumb { font-family: ui-monospace, Menlo, Consolas, monospace; }
    .sb-lineage__current { color: var(--sb-text, #1f2933); font: 600 12px ui-monospace, Menlo, Consolas, monospace; }
    .sb-lineage__lines { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
    .sb-lineage__lines { --sb-lineage-link: var(--sb-accent, #2563eb); }
    ${toneRules}
    .sb-lineage__lines > path { fill: none; stroke: var(--sb-lineage-link); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
    .sb-lineage__lines marker > * { fill: var(--sb-lineage-link); }
    .sb-lineage__link, .sb-lineage__label { transition: opacity 0.15s; }
    .sb-lineage--pointing .sb-lineage__link:not(.sb-lineage__link--lit), .sb-lineage--pointing .sb-lineage__label:not(.sb-lineage__label--lit) { opacity: 0.12; }
    .sb-lineage__lines text { fill: var(--sb-lineage-link); font: 600 10px var(--sb-font, system-ui, sans-serif); paint-order: stroke; stroke: var(--sb-bg, #f5f6f8); stroke-width: 4px; stroke-linejoin: round; }
    .sb-lineage__empty { padding: 12px 14px; color: var(--sb-muted, #616e7c); font-size: 13px; }`;

  function addStyle() {
    if (document.getElementById('sb-lineage-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-lineage-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  function el(tag, parts, text) {
    const node = document.createElement(tag);
    if (parts) node.className = parts.split(' ').map((part) => `sb-lineage__${part}`).join(' ');
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

  // A link named by its ends, as labels list the links they name.
  const linkKey = ({ from, to }) => `${from}>${to}`;

  const average = (list) => list.reduce((sum, n) => sum + n, 0) / list.length;

  // Everything within so many steps of a ref, following links one way: back to what leads to it,
  // or on to what it leads to.
  function reach(ref, links, way, steps = Infinity) {
    const found = new Set([ref]);
    let front = [ref];
    for (let step = 0; front.length && step < steps; step++) {
      const next = [];
      for (const { from, to } of links) {
        const [here, there] = way === 'back' ? [to, from] : [from, to];
        if (front.includes(here) && !found.has(there)) {
          found.add(there);
          next.push(there);
        }
      }
      front = next;
    }
    return found;
  }

  // Controls inside an item are the sandbox's own: clicking them never selects or follows it.
  const CONTROLS = 'a, button, input, select, textarea, summary, label';

  // How many crumbs the trail shows, latest last.
  const CRUMBS = 4;

  // Zooming: as far in as twice full size, a step for each button press or key, and how far a drag
  // must move before it pans rather than clicks.
  const MAX_ZOOM = 2, ZOOM_STEP = 1.25, PAN_STEP = 40, DRAG = 4;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  // Corners pointing out, to go full screen, and in, to leave it.
  const FULL_SCREEN = {
    enter: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1 4.5V1h3.5M11 4.5V1H7.5M1 7.5V11h3.5M11 7.5V11H7.5"/></svg>',
    leave: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 1v3.5H1M7.5 1v3.5H11M4.5 11V7.5H1M7.5 11V7.5H11"/></svg>',
  };

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

  let instances = 0; // gives each lineage its own arrowhead id

  class SbLineage extends HTMLElement {
    static origin = ORIGIN;

    static observedAttributes = ['direction', 'spacing', 'links-shown', 'back', 'on', 'zoom', 'fullscreen'];

    constructor() {
      super();
      this._columns = [];
      this._links = [];
      this._highlight = [];
      this._subject = null;
      this._trail = [];          // the subjects before this one, oldest first
      this._items = new Map();   // ref → the sandbox's element, kept while the lineage redraws
      this._places = new Map();  // ref → the lineage's holder for it, while it's shown
      this._columnOf = new Map(); // ref → the position of its column among those shown
      this._folded = new Map();  // column title → folded or not, once the viewer has chosen
      this._id = `sb-lineage-${++instances}`; // names its arrowhead and dot
      this._pointing = null; // the ref pointed at, if any
      this._view = { x: 0, y: 0, k: 1 }; // panned by x and y, zoomed by k, while pan and zoom is on
      this._drag = null;    // a press that may become a drag
      this._dragged = false; // a drag just ended, so the click it ends with is no choice
      this._resizes = new ResizeObserver(() => this.linksShown === 'all' && this._redraw()); // links follow items that move
      this.addEventListener('pointerover', (e) => this._point(e.target));
      this.addEventListener('pointerleave', () => this._clear());
      this.addEventListener('focusin', (e) => this._point(e.target));
      this.addEventListener('focusout', () => this._clear());
      this.addEventListener('click', (e) => {
        if (!this._dragged) return;
        this._dragged = false;
        e.stopPropagation();
        e.preventDefault();
      }, true);
      this.addEventListener('click', (e) => this._select(this._chosen(e.target)));
      this.addEventListener('dblclick', (e) => this._follow(this._chosen(e.target)));
      this.addEventListener('keydown', (e) => {
        const ref = e.key === 'Enter' && this._chosen(e.target);
        if (!ref) return;
        e.preventDefault();
        if (e.shiftKey) this._follow(ref);
        else this._select(ref);
      });
      this.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !this.fullscreen) return;
        e.preventDefault(); // nor closes a window it's in
        e.stopPropagation();
        this.fullscreen = false;
      });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-lineage');
      this._space();
      this.render();
    }

    disconnectedCallback() { this._resizes.disconnect(); }

    attributeChangedCallback(name) {
      if (name === 'spacing') this._space();
      else if (name === 'links-shown') this._redraw();
      else if (name === 'zoom') this._switchZoom();
      else if (name === 'fullscreen') this._switchFullScreen();
      else this.render();
    }

    // ---- Public API ----

    // [{ title, refs, folded }]: the columns in order, each with the refs of the items it holds.
    get columns() { return this._columns; }
    set columns(list) {
      this._columns = list || [];
      this.render();
    }

    // [{ from, to, label, tone }]: what leads to what, and in which tone.
    get links() { return this._links; }
    set links(list) {
      this._links = list || [];
      this.render();
    }

    // The ref being looked at: only what leads to it and what it leads to is shown. A different
    // one puts the one before on the trail. null shows everything.
    get subject() { return this._subject; }
    set subject(ref) {
      if ((ref ?? null) === this._subject) return;
      this._go(ref ?? null, this._subject == null ? this._trail : [...this._trail, this._subject]);
    }

    // The subjects looked at before this one, oldest first.
    get trail() { return this._trail.slice(); }

    clearTrail() {
      this._trail = [];
      this.render();
    }

    // Whether viewers pan and zoom (the default), or the lineage scrolls sideways at full size.
    get zoom() { return this.getAttribute('zoom') !== 'off'; }
    set zoom(on) { this.setAttribute('zoom', on ? 'on' : 'off'); }

    // Lays the lineage over the whole page; Escape leaves it. The element keeps its place meanwhile.
    get fullscreen() { return this.hasAttribute('fullscreen'); }
    set fullscreen(on) { this.toggleAttribute('fullscreen', Boolean(on)); }

    // Zooms out, no larger than full size, until the whole lineage is in view, and centres it.
    fit() {
      if (!this.zoom || !this._flow) return;
      const k = this._fitScale();
      const { clientWidth: width, clientHeight: height } = this._viewport;
      this._setView({ k, x: (width - this._flow.offsetWidth * k) / 2, y: Math.max(0, (height - this._flow.offsetHeight * k) / 2) });
    }

    // How many steps back from the subject, and on from it, to show. All of them by default.
    get back() { return this._steps('back'); }
    set back(n) { this._setSteps('back', n); }
    get on() { return this._steps('on'); }
    set on(n) { this._setSteps('on', n); }

    // `all` (the default): every link drawn, always. `chain`: only along the chain pointed at.
    get linksShown() { return this.getAttribute('links-shown') === 'chain' ? 'chain' : 'all'; }
    set linksShown(name) { this.setAttribute('links-shown', name); }

    // `across` (the default): each column side by side. `down`: each a band, one under another.
    get direction() { return this.getAttribute('direction') === 'down' ? 'down' : 'across'; }
    set direction(name) { this.setAttribute('direction', name); }

    // The room between columns going across, or between bands going down, in pixels.
    get spacing() { return Number(this.getAttribute('spacing')) || null; }
    set spacing(px) {
      if (px) this.setAttribute('spacing', px);
      else this.removeAttribute('spacing');
    }

    // Refs to light, from outside: those items stand out, and nothing fades.
    get highlight() { return this._highlight; }
    set highlight(refs) {
      this._highlight = refs || [];
      if (!this._pointing) this._light(new Set(this._highlight));
    }

    // Unfolds the column holding a ref, so it shows in full. Returns whether the lineage holds it.
    reveal(ref) {
      const column = this._columns.find((c) => c.refs?.includes(ref) && this._places.has(ref));
      if (!column) return false;
      if (this._isFolded(column)) this._fold(column, false);
      return true;
    }

    // ---- Drawing ----

    render() {
      if (!this.isConnected) return;
      this._keepItems();
      this.classList.toggle('sb-lineage--across', this.direction === 'across');
      this._places.clear();
      this._columnOf.clear();
      const shown = this._lineage();
      const flow = el('div', 'flow');
      for (const column of this._columns) {
        const refs = (column.refs ?? []).filter((ref) => this._items.has(ref) && (!shown || shown.has(ref)));
        if (!refs.length) continue;
        const position = flow.children.length;
        refs.forEach((ref) => this._columnOf.set(ref, position));
        flow.append(this._column(column, refs));
      }
      this._lines = svg('svg', { class: 'sb-lineage__lines' });
      flow.append(this._lines);
      const trail = this._subject != null || this._trail.length ? [this._trailBar()] : [];
      this._flow = this._places.size ? flow : null;
      this._viewport = el('div', 'viewport');
      this._viewport.append(this._flow ?? el('p', 'empty', 'Nothing to show yet.'));
      this._watchViewport();
      const frame = el('div', 'frame');
      frame.append(this._viewport, ...(this._flow ? [this._tools()] : []));
      this.classList.toggle('sb-lineage--zoom', this.zoom);
      const box = el('div', this.fullscreen ? 'box box--full' : 'box');
      if (this.fullscreen) Object.entries({ role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Lineage, full screen' }).forEach(([name, value]) => box.setAttribute(name, value));
      box.append(...trail, frame);
      this.replaceChildren(box);
      this._setView(this._view);
      this._resizes.disconnect();
      if (this._flow) this._resizes.observe(flow);
      this._redraw();
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
        const place = el('div', ref === this._subject ? 'item item--subject' : 'item');
        place.append(this._items.get(ref));
        this._places.set(ref, place);
        items.append(place);
      }
      box.append(title, items);
      return box;
    }

    // The refs in the subject's lineage, within the steps asked for, or null to show everything.
    _lineage() {
      if (this._subject == null) return null;
      return new Set([...reach(this._subject, this._links, 'back', this.back), ...reach(this._subject, this._links, 'on', this.on)]);
    }

    // A button to switch pan and zoom on or off, and while it's on, zoom out, in and fit.
    _tools() {
      const tools = el('div', 'tools');
      const tool = (text, label, act, parts = 'tool tool--zoom') => {
        const button = el('button', parts, text);
        button.type = 'button';
        button.title = label;
        button.setAttribute('aria-label', label);
        button.addEventListener('click', act);
        tools.append(button);
        return button;
      };
      tool('−', 'Zoom out', () => this._zoomBy(1 / ZOOM_STEP));
      tool('+', 'Zoom in', () => this._zoomBy(ZOOM_STEP));
      tool('Fit', 'Fit the whole lineage', () => this.fit());
      tool('✥', 'Pan and zoom', () => { this.zoom = !this.zoom; }, 'tool tool--switch').setAttribute('aria-pressed', String(this.zoom));
      const full = tool('', this.fullscreen ? 'Leave full screen' : 'Full screen', () => { this.fullscreen = !this.fullscreen; }, 'tool tool--full');
      full.innerHTML = FULL_SCREEN[this.fullscreen ? 'leave' : 'enter'];
      full.setAttribute('aria-pressed', String(this.fullscreen));
      return tools;
    }

    // Back, the latest crumbs and the subject now.
    _trailBar() {
      const bar = el('nav', 'trail');
      bar.setAttribute('aria-label', 'Trail');
      const back = el('button', 'back', '‹ Back');
      back.type = 'button';
      back.disabled = !this._trail.length;
      back.addEventListener('click', () => this._back(this._trail.length - 1));
      bar.append(back);
      const first = Math.max(0, this._trail.length - CRUMBS);
      this._trail.slice(first).forEach((ref, i) => {
        const crumb = el('button', 'crumb', ref);
        crumb.type = 'button';
        crumb.addEventListener('click', () => this._back(first + i));
        bar.append(crumb, el('span', 'separator', '›'));
      });
      bar.append(el('span', 'current', this._subject ?? 'Everything'));
      return bar;
    }

    // Children carrying a data-ref are taken in, and placed wherever a column lists them.
    _keepItems() {
      for (const child of [...this.children]) {
        if (child.classList.contains('sb-lineage__flow') || !child.dataset.ref) continue;
        this._items.set(child.dataset.ref, child);
        child.remove();
      }
    }

    // Spacing sets the lineage's token, so the sandbox's own CSS can set it too; links are redrawn
    // to follow the items it moved.
    _space() {
      if (this.spacing) this.style.setProperty('--sb-lineage-spacing', `${this.spacing}px`);
      else this.style.removeProperty('--sb-lineage-spacing');
      this._redraw();
    }

    _steps(way) {
      return this.hasAttribute(way) ? Math.max(0, Number(this.getAttribute(way)) || 0) : Infinity;
    }

    _setSteps(way, n) {
      if (n == null || n === Infinity) this.removeAttribute(way);
      else this.setAttribute(way, n);
    }

    _isFolded(column) {
      return this._folded.get(column.title) ?? Boolean(column.folded);
    }

    _fold(column, folded) {
      this._folded.set(column.title, folded);
      const box = [...this.querySelectorAll('.sb-lineage__column')].find((b) => b.dataset.title === column.title);
      box?.classList.toggle('sb-lineage__column--folded', folded);
      box?.querySelector('.sb-lineage__toggle').setAttribute('aria-expanded', String(!folded));
      this._redraw();
    }

    // ---- Choosing and following ----

    // The item chosen by a click or a key, unless it was on one of the item's own controls.
    _chosen(target) {
      const ref = this._refOf(target);
      const control = target.closest?.(CONTROLS);
      return ref && !(control && this._places.get(ref).contains(control)) ? ref : null;
    }

    _select(ref) {
      if (ref) this._fire('sb-select', ref);
    }

    // Following makes an item the subject, unless the sandbox prevents it to show it its own way.
    _follow(ref) {
      if (!ref || ref === this._subject || !this._fire('sb-follow', ref, true)) return;
      this._go(ref, this._subject == null ? this._trail : [...this._trail, this._subject]);
    }

    // Back to a subject on the trail, forgetting everything after it.
    _back(index) {
      if (index < 0) return;
      const ref = this._trail[index];
      this._go(ref, this._trail.slice(0, index));
      this._fire('sb-back', ref);
    }

    // A new subject: drawn, and scrolled just far enough to show it going across.
    _go(ref, trail) {
      this._subject = ref;
      this._trail = trail;
      this.render();
      const place = this._places.get(ref);
      if (place) this._bringIntoView(place);
    }

    // Returns false if the sandbox prevented it.
    _fire(type, ref, cancelable = false) {
      return this.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable, detail: { ref } }));
    }

    // ---- Panning and zooming ----

    // Pressing anywhere but a control and moving pans; wheeling with Ctrl or ⌘ held (a pinch on a
    // trackpad) zooms at the pointer, leaving plain scrolling to the page; the keys pan and zoom too.
    _watchViewport() {
      const viewport = this._viewport;
      viewport.tabIndex = this.zoom ? 0 : -1;
      viewport.addEventListener('pointerdown', (e) => {
        this._dragged = false;
        if (!this.zoom || e.button !== 0 || e.target.closest(CONTROLS)) return;
        this._drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: { ...this._view }, moved: false };
      });
      viewport.addEventListener('pointermove', (e) => {
        const drag = this._drag;
        if (!drag || drag.id !== e.pointerId) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) < DRAG) return;
        if (!drag.moved) {
          drag.moved = true;
          viewport.setPointerCapture?.(e.pointerId);
          viewport.classList.add('sb-lineage__viewport--dragging');
        }
        this._setView({ ...drag.from, x: drag.from.x + dx, y: drag.from.y + dy });
      });
      const end = () => {
        this._dragged = Boolean(this._drag?.moved);
        this._drag = null;
        viewport.classList.remove('sb-lineage__viewport--dragging');
      };
      viewport.addEventListener('pointerup', end);
      viewport.addEventListener('pointercancel', end);
      viewport.addEventListener('wheel', (e) => {
        if (!this.zoom || !(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        const box = viewport.getBoundingClientRect();
        this._zoomBy(Math.exp(-e.deltaY * 0.01), [e.clientX - box.left, e.clientY - box.top]);
      }, { passive: false });
      viewport.addEventListener('keydown', (e) => {
        if (!this.zoom || e.target !== viewport || e.ctrlKey || e.metaKey || e.altKey) return;
        const pans = { ArrowLeft: [PAN_STEP, 0], ArrowRight: [-PAN_STEP, 0], ArrowUp: [0, PAN_STEP], ArrowDown: [0, -PAN_STEP] };
        if (pans[e.key]) this._setView({ ...this._view, x: this._view.x + pans[e.key][0], y: this._view.y + pans[e.key][1] });
        else if (e.key === '+' || e.key === '=') this._zoomBy(ZOOM_STEP);
        else if (e.key === '-') this._zoomBy(1 / ZOOM_STEP);
        else if (e.key === '0') this.fit();
        else return;
        e.preventDefault();
      });
    }

    // Holds the element's place while its box lies over the page, so nothing behind it moves, and
    // keeps the keyboard on the button that went full screen or back.
    _switchFullScreen() {
      this.style.minHeight = this.fullscreen ? `${this.offsetHeight}px` : '';
      this.render();
      this.querySelector('.sb-lineage__tool--full')?.focus({ preventScroll: true });
    }

    // Switching on starts on the very picture that was showing; switching off scrolls to where the
    // view was, at full size.
    _switchZoom() {
      const scrolled = this._viewport?.scrollLeft ?? 0, panned = -this._view.x;
      this._view = { x: -scrolled, y: 0, k: 1 };
      this.render();
      if (!this.zoom && this._viewport) this._viewport.scrollLeft = panned;
    }

    _setView(view) {
      this._view = view;
      if (this._flow) this._flow.style.transform = this.zoom ? `translate(${view.x}px, ${view.y}px) scale(${view.k})` : '';
    }

    // Zooms by a factor, keeping the point given (in the viewport, its middle by default) still.
    _zoomBy(factor, at) {
      if (!this.zoom || !this._flow) return;
      const [px, py] = at ?? [this._viewport.clientWidth / 2, this._viewport.clientHeight / 2];
      const { x, y, k: before } = this._view;
      const k = clamp(before * factor, Math.min(1, this._fitScale()), MAX_ZOOM);
      this._setView({ k, x: px - ((px - x) * k) / before, y: py - ((py - y) * k) / before });
    }

    // The scale at which the whole lineage fits, never larger than full size.
    _fitScale() {
      const { clientWidth: width, clientHeight: height } = this._viewport;
      return Math.min(1, width / this._flow.offsetWidth, height / this._flow.offsetHeight);
    }

    // Moves the view, or scrolls, just far enough to show an item, with a little room around it.
    _bringIntoView(place) {
      const margin = 16, viewport = this._viewport;
      if (!this.zoom) {
        if (this.direction !== 'across') return;
        const start = place.offsetLeft - margin, end = place.offsetLeft + place.offsetWidth + margin;
        if (end > viewport.scrollLeft + viewport.clientWidth) viewport.scrollLeft = end - viewport.clientWidth;
        if (start < viewport.scrollLeft) viewport.scrollLeft = start;
        return;
      }
      const { x, y, k } = this._view;
      const shift = (start, size, offset, room) => {
        const from = offset + (start - margin) * k, to = offset + (start + size + margin) * k;
        return to > room ? room - to : from < 0 ? -from : 0;
      };
      this._setView({ k, x: x + shift(place.offsetLeft, place.offsetWidth, x, viewport.clientWidth),
        y: y + shift(place.offsetTop, place.offsetHeight, y, viewport.clientHeight) });
    }

    // ---- Pointing ----

    // The ref of the item holding an element, if any.
    _refOf(target) {
      return [...this._places].find(([, place]) => place.contains(target))?.[0];
    }

    // The links whose ends are both shown.
    _shownLinks() {
      return this._links.filter(({ from, to }) => this._places.has(from) && this._places.has(to));
    }

    // Draws the links that show at rest, every one or none, and points again at whatever was
    // pointed at, so links follow the items wherever they've moved.
    _redraw() {
      if (!this._lines) return;
      const pointing = this._pointing;
      this._pointing = null;
      this.classList.remove('sb-lineage--pointing');
      this._lines.replaceChildren();
      if (this.linksShown === 'all') this._drawLinks(this._shownLinks());
      this._light(new Set(this._highlight));
      if (this._places.has(pointing)) this._point(this._places.get(pointing));
    }

    // Pointing at an item lights it and what it's linked to, and fades the rest.
    _point(target) {
      const ref = this._refOf(target);
      if (!ref) return this._clear();
      if (ref === this._pointing) return;
      this._pointing = ref;
      this.classList.add('sb-lineage--pointing');
      if (this.linksShown === 'all') this._lightLinked(ref);
      else this._lightChain(ref);
    }

    _clear() {
      if (!this._pointing || !this._lines) return;
      this._pointing = null;
      this.classList.remove('sb-lineage--pointing');
      if (this.linksShown === 'chain') this._lines.replaceChildren();
      this._light(new Set(this._highlight));
    }

    // With every link drawn: the item's own links, their labels and the items at their other ends.
    _lightLinked(ref) {
      const linked = this._shownLinks().filter(({ from, to }) => from === ref || to === ref);
      const keys = new Set(linked.map(linkKey));
      this._light(new Set([ref, ...linked.flatMap(({ from, to }) => [from, to])]), ref);
      for (const path of this._lines.querySelectorAll('.sb-lineage__link')) {
        path.classList.toggle('sb-lineage__link--lit', keys.has(`${path.dataset.from}>${path.dataset.to}`));
      }
      for (const label of this._lines.querySelectorAll('.sb-lineage__label')) {
        label.classList.toggle('sb-lineage__label--lit', label.dataset.links.split(' ').some((key) => keys.has(key)));
      }
    }

    // With links shown along a chain: everything that leads to the item and everything it leads to,
    // with the links along those two ways drawn, so a side branch into the chain stays dark.
    _lightChain(ref) {
      const shown = this._shownLinks();
      const back = reach(ref, shown, 'back'), on = reach(ref, shown, 'on');
      this._light(new Set([...back, ...on]), ref);
      const onPath = ({ from, to }) => (back.has(from) && back.has(to)) || (on.has(from) && on.has(to));
      this._lines.replaceChildren();
      this._drawLinks(shown.filter(onPath));
      this._lines.querySelectorAll('.sb-lineage__link').forEach((path) => path.classList.add('sb-lineage__link--lit'));
      this._lines.querySelectorAll('.sb-lineage__label').forEach((label) => label.classList.add('sb-lineage__label--lit'));
    }

    _light(lit, focus = null) {
      for (const [ref, place] of this._places) {
        place.classList.toggle('sb-lineage__item--lit', lit.has(ref));
        place.classList.toggle('sb-lineage__item--focus', ref === focus);
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

    // Every link drawn is planned together, so none shares a run with another. Routes are
    // worked out along the flow (u: x going across, y going down) and across it (v), then turned into
    // the lineage's x and y, so both directions route alike.
    _drawLinks(links) {
      if (!links.length) return;
      this._lines.append(this._markers());
      const across = this.direction === 'across';
      // Measured on the page, then unzoomed, since the lines are drawn inside what's zoomed.
      const box = this._lines.getBoundingClientRect(), k = this.zoom ? this._view.k : 1;
      const frame = new Map([...this._places].map(([ref, place]) => {
        const r = place.getBoundingClientRect();
        const [x0, x1, y0, y1] = [r.left - box.left, r.right - box.left, r.top - box.top, r.bottom - box.top].map((n) => n / k);
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
        r.lane = freeLane([...items, ...lanes], wanted, 4, (across ? box.height : box.width) / k - 4, 0);
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
        const path = svg('path', { class: 'sb-lineage__link', d: rounded(points.map(([u, v]) => (across ? [u, v] : [v, u]))), 'data-tone': tone,
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
          labels.push({ label, side: end, column, at: across && end === 'near' ? points[0] : points[points.length - 1], b: f,
            tone: toneOf(group[0].link), links: group.map((r) => linkKey(r.link)).join(' ') });
        }
        at += size(block) * scale;
      }
      return labels;
    }

    // How wide a label is, drawn as the lineage draws them.
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
      for (const { label, side, at, b, tone, links } of labels) {
        const [x, y, anchor, [dx, dy]] = across
          ? (side === 'near' ? [b.u0 - 8, at - 5, 'end', [0, -12]] : [b.u1 + 8, at + 13, 'start', [0, 12]])
          : (side === 'near' ? [at + 5, b.u0 - 4, 'start', [10, 0]] : [at + 5, b.u1 + 12, 'start', [10, 0]]);
        const text = svg('text', { class: 'sb-lineage__label', x, y, 'text-anchor': anchor, 'data-tone': tone, 'data-links': links });
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

  customElements.define('sb-lineage', SbLineage);
})();
