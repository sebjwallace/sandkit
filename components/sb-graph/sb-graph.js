// Sandkit sb-graph 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Things joined by connections: state machines, workflows, networks, flows. Highlights what is
// active, and can show things moving along the connections.
//
//   graph.data = { nodes: [{ id: 'A', label: 'Idle' }, { id: 'B', label: 'Busy' }], edges: [{ from: 'A', to: 'B', label: 'start' }] };
//   graph.active = { nodes: ['B'] };
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-graph';
  const existing = customElements.get('sb-graph');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-graph>, so only one can run. Rename one by replacing every "sb-graph" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-graph { display: block; }
    .sb-graph__svg { display: block; max-width: 100%; height: auto; margin: 0 auto; font-family: inherit; overflow: visible; }
    .sb-graph__edge { fill: none; stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; }
    .sb-graph__edge--active { stroke: var(--sb-accent, #2563eb); stroke-width: 3; }
    .sb-graph__edge-hit { fill: none; stroke: transparent; stroke-width: 14; cursor: pointer; }
    .sb-graph__arrow { fill: var(--sb-muted, #616e7c); }
    .sb-graph__arrow--active { fill: var(--sb-accent, #2563eb); }
    .sb-graph__edge-label { font-size: 11px; fill: var(--sb-text, #1f2933); paint-order: stroke; stroke: var(--sb-surface, #fff); stroke-width: 4px; stroke-linejoin: round; cursor: pointer; }
    .sb-graph__line--active { fill: var(--sb-accent, #2563eb); font-weight: 700; }
    .sb-graph__node { cursor: pointer; }
    .sb-graph__shape { fill: var(--sb-surface, #fff); stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; }
    .sb-graph__ring { fill: none; stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; }
    .sb-graph__node--good .sb-graph__shape { stroke: var(--sb-good, #3f9142); }
    .sb-graph__node--warn .sb-graph__shape { stroke: var(--sb-warn, #d69e2e); }
    .sb-graph__node--bad .sb-graph__shape { stroke: var(--sb-bad, #c53030); }
    .sb-graph__node--active .sb-graph__shape { fill: var(--sb-accent-soft, #eaf0ff); stroke: var(--sb-accent, #2563eb); stroke-width: 3; }
    .sb-graph__node--selected .sb-graph__shape { stroke: var(--sb-accent, #2563eb); stroke-width: 3; }
    .sb-graph__label { font-size: 12px; font-weight: 600; fill: var(--sb-text, #1f2933); }
    .sb-graph__sublabel { font-size: 11px; fill: var(--sb-muted, #616e7c); }
    .sb-graph__meter-track { fill: var(--sb-surface-2, #eef0f3); }
    .sb-graph__meter { fill: var(--sb-accent, #2563eb); }
    .sb-graph__node--good .sb-graph__meter { fill: var(--sb-good, #3f9142); }
    .sb-graph__node--warn .sb-graph__meter { fill: var(--sb-warn, #d69e2e); }
    .sb-graph__node--bad .sb-graph__meter { fill: var(--sb-bad, #c53030); }
    .sb-graph__token { fill: var(--sb-accent, #2563eb); }
    .sb-graph__token-label { font-size: 9px; font-weight: 600; fill: var(--sb-accent-text, #fff); pointer-events: none; }`;

  // Sizes, in SVG units (which are pixels, since the graph is never scaled up).
  const BOX = { minWidth: 100, height: 40, heightWithDetail: 56, charWidth: 7, padding: 28 };
  const CIRCLE = { minRadius: 24, charRadius: 3.5 };
  const LOOP_SIZE = 46;       // how far a self-loop reaches out from its node
  const CURVE = 28;           // how far edges that run both ways bow apart
  const CIRCLE_SPACING = 140; // distance between neighbours in the circle layout
  const FRAME_PADDING = 24;
  const LINE_HEIGHT = 13;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const clamp01 = (n) => Math.max(0, Math.min(1, n || 0));

  function addStyle() {
    if (document.getElementById('sb-graph-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-graph-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // ---- Geometry ----

  const vector = (x, y) => ({ x, y });
  const add = (a, b) => vector(a.x + b.x, a.y + b.y);
  const scale = (a, k) => vector(a.x * k, a.y * k);
  const subtract = (a, b) => vector(a.x - b.x, a.y - b.y);
  const length = (a) => Math.hypot(a.x, a.y) || 1;
  const unit = (a) => scale(a, 1 / length(a));
  const normal = (a) => vector(-a.y, a.x);
  const fromAngle = (angle) => vector(Math.cos(angle), Math.sin(angle));

  // The size of a node, from its shape and how much it shows.
  function measure(node) {
    const text = String(node.label ?? node.id);
    if (node.shape === 'circle') {
      const radius = Math.max(CIRCLE.minRadius, text.length * CIRCLE.charRadius + 10) + (node.terminal ? 4 : 0);
      return { ...node, radius, width: radius * 2, height: radius * 2 };
    }
    const width = Math.max(BOX.minWidth, text.length * BOX.charWidth + BOX.padding);
    const height = node.sublabel != null || node.max ? BOX.heightWithDetail : BOX.height;
    return { ...node, width, height };
  }

  // Where a line from the node's centre towards `target` leaves the node's outline.
  function boundary(node, target) {
    const direction = unit(subtract(target, node));
    if (node.shape === 'circle') return add(node, scale(direction, node.radius));
    const t = Math.min(node.width / 2 / Math.abs(direction.x || 1e-9), node.height / 2 / Math.abs(direction.y || 1e-9));
    return add(node, scale(direction, t));
  }

  // Nodes without positions are placed evenly around a circle.
  function layout(nodes) {
    if (nodes.every((n) => n.x != null && n.y != null)) return nodes;
    const radius = Math.max(80, nodes.length * CIRCLE_SPACING / (2 * Math.PI));
    return nodes.map((n, i) => {
      const angle = -Math.PI / 2 + (i / nodes.length) * 2 * Math.PI;
      return { ...n, x: radius + radius * Math.cos(angle), y: radius + radius * Math.sin(angle) };
    });
  }

  // A quadratic curve (straight when its control point is the midpoint), with a way to find
  // any point along it, for labels and moving tokens.
  function curve(start, control, end) {
    const pointAt = (t) => add(add(scale(start, (1 - t) ** 2), scale(control, 2 * (1 - t) * t)), scale(end, t * t));
    return { d: `M${start.x},${start.y} Q${control.x},${control.y} ${end.x},${end.y}`, pointAt };
  }

  // The path an edge takes: a loop for a node connected to itself, a bow when the opposite edge
  // also exists, otherwise a straight line. Ends stop at the nodes' outlines. A loop's label sits
  // beyond the loop, clear of it.
  function route(edge, byId, centre, edges) {
    const from = byId[edge.from], to = byId[edge.to];
    if (from === to) {
      // Away from the middle of the graph; straight up for a node that is the middle.
      const offset = subtract(from, centre);
      const outward = Math.hypot(offset.x, offset.y) < 1 ? -Math.PI / 2 : Math.atan2(offset.y, offset.x);
      const reach = (from.radius ?? from.height / 2) + LOOP_SIZE;
      const start = boundary(from, add(from, fromAngle(outward - 0.45)));
      const end = boundary(from, add(from, fromAngle(outward + 0.45)));
      const c1 = add(from, scale(fromAngle(outward - 0.6), reach));
      const c2 = add(from, scale(fromAngle(outward + 0.6), reach));
      const pointAt = (t) => add(add(scale(start, (1 - t) ** 3), scale(c1, 3 * (1 - t) ** 2 * t)), add(scale(c2, 3 * (1 - t) * t * t), scale(end, t ** 3)));
      // Far enough out that the label's nearest side clears the loop, whichever way it points.
      const label = labelSize(edge);
      const direction = fromAngle(outward);
      const labelGap = Math.abs(direction.x) * label.width / 2 + Math.abs(direction.y) * label.height / 2 + 6;
      const labelAt = add(pointAt(0.5), scale(direction, labelGap));
      return { d: `M${start.x},${start.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`, pointAt, labelAt };
    }
    const twoWay = edges.some((other) => other.from === edge.to && other.to === edge.from);
    const middle = scale(add(from, to), 0.5);
    const control = twoWay ? add(middle, scale(unit(normal(subtract(to, from))), CURVE)) : middle;
    const path = curve(boundary(from, control), control, boundary(to, control));
    return { ...path, labelAt: path.pointAt(0.5) };
  }

  // ---- The element ----

  let instanceCount = 0; // gives each graph its own arrowhead ids

  class SbGraph extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['selected'];

    constructor() {
      super();
      this._id = `sb-graph-${++instanceCount}`;
      this._data = { nodes: [], edges: [], tokens: [] };
      this._active = { nodes: [], edges: [], lines: [] };
      // pointerdown, not click: the graph may re-render often, and a click can be lost between press and release.
      this.addEventListener('pointerdown', (e) => this._select(e));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-graph');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // { nodes: [{ id, label, sublabel, x, y, shape, tone, terminal, value, max }],
    //   edges: [{ id, from, to, label }], tokens: [{ from, to, progress, label, title }] }
    get data() { return this._data; }
    set data(value) {
      this._data = { nodes: [], edges: [], tokens: [], ...value };
      this.render();
    }

    // What is happening now: { nodes: [ids], edges: [ids], lines: [ids] }.
    get active() { return this._active; }
    set active(value) {
      this._active = { nodes: [], edges: [], lines: [], ...value };
      this.render();
    }

    get selected() { return this.getAttribute('selected'); }
    set selected(id) {
      if (id == null) this.removeAttribute('selected');
      else this.setAttribute('selected', id);
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      const nodes = layout(this._data.nodes).map(measure);
      if (!nodes.length) {
        this.innerHTML = '';
        return;
      }
      const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
      const centre = scale(nodes.reduce((sum, n) => add(sum, n), vector(0, 0)), 1 / nodes.length);
      const edges = this._data.edges.filter((e) => byId[e.from] && byId[e.to]);
      const routes = new Map(edges.map((e) => [e, route(e, byId, centre, edges)]));
      const frame = this._frame(nodes, edges.map((e) => labelBox(e, routes.get(e))), [...routes.values()]);

      this.innerHTML = `
        <svg class="sb-graph__svg" viewBox="${frame.x} ${frame.y} ${frame.width} ${frame.height}" width="${frame.width}" role="img">
          <defs>${this._arrow('arrow', 'sb-graph__arrow')}${this._arrow('arrow-active', 'sb-graph__arrow sb-graph__arrow--active')}</defs>
          ${edges.map((e) => this._edge(e, routes.get(e))).join('')}
          ${edges.map((e) => this._edgeLabel(e, routes.get(e))).join('')}
          ${nodes.map((n) => this._node(n)).join('')}
          ${this._data.tokens.map((t) => this._token(t, byId, edges, routes)).join('')}
        </svg>`;
    }

    // Frames the content snugly, including loops and labels, so small graphs aren't lost in space.
    _frame(nodes, labels, routes) {
      const corners = (box) => [vector(box.x - box.width / 2, box.y - box.height / 2), vector(box.x + box.width / 2, box.y + box.height / 2)];
      const points = nodes.flatMap(corners).concat(labels.flatMap(corners), routes.map((r) => r.pointAt(0.5)));
      const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
      const x = Math.min(...xs) - FRAME_PADDING, y = Math.min(...ys) - FRAME_PADDING;
      return { x, y, width: Math.max(...xs) - x + FRAME_PADDING, height: Math.max(...ys) - y + FRAME_PADDING };
    }

    _arrow(name, className) {
      // Sized in the graph's own units, so arrowheads don't grow with an active edge's thicker line.
      return `<marker id="${this._id}-${name}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
        <path class="${className}" d="M0,0 L10,5 L0,10 z"/></marker>`;
    }

    _edge(edge, path) {
      const key = edgeKey(edge);
      const active = this._active.edges.includes(key);
      return `
        <path class="sb-graph__edge${active ? ' sb-graph__edge--active' : ''}" d="${path.d}" marker-end="url(#${this._id}-${active ? 'arrow-active' : 'arrow'})"/>
        <path class="sb-graph__edge-hit" d="${path.d}" data-edge-id="${esc(key)}"><title>${esc(lineTexts(edge).join('\n') || key)}</title></path>`;
    }

    // Multi-line labels are centred on the edge; a line with an id can be highlighted on its own.
    _edgeLabel(edge, path) {
      const lines = labelLines(edge);
      if (!lines.length) return '';
      const top = path.labelAt.y - ((lines.length - 1) * LINE_HEIGHT) / 2 + 4;
      const spans = lines.map((line, i) => {
        const active = line.id != null && this._active.lines.includes(line.id);
        return `<tspan x="${path.labelAt.x}" y="${top + i * LINE_HEIGHT}"${active ? ' class="sb-graph__line--active"' : ''}>${esc(line.text)}</tspan>`;
      }).join('');
      return `<text class="sb-graph__edge-label" text-anchor="middle" data-edge-id="${esc(edgeKey(edge))}">${spans}</text>`;
    }

    _node(n) {
      const classes = ['sb-graph__node', `sb-graph__node--${n.shape === 'circle' ? 'circle' : 'box'}`];
      if (n.tone) classes.push(`sb-graph__node--${n.tone}`);
      if (n.terminal) classes.push('sb-graph__node--terminal');
      if (this._active.nodes.includes(n.id)) classes.push('sb-graph__node--active');
      if (n.id === this.selected) classes.push('sb-graph__node--selected');
      const hasDetail = n.sublabel != null || n.max;
      const labelY = n.shape === 'circle' || !hasDetail ? 4 : -9;

      const shape = n.shape === 'circle'
        ? `<circle class="sb-graph__shape" r="${n.terminal ? n.radius - 4 : n.radius}"/>${n.terminal ? `<circle class="sb-graph__ring" r="${n.radius}"/>` : ''}`
        : `<rect class="sb-graph__shape" x="${-n.width / 2}" y="${-n.height / 2}" width="${n.width}" height="${n.height}" rx="8"/>`;
      const sublabel = n.sublabel != null && n.shape !== 'circle'
        ? `<text class="sb-graph__sublabel" y="7" text-anchor="middle">${esc(n.sublabel)}</text>` : '';
      const meterWidth = n.width - 20;
      const meter = n.max && n.shape !== 'circle' ? `
        <rect class="sb-graph__meter-track" x="${-meterWidth / 2}" y="16" width="${meterWidth}" height="5" rx="2"/>
        <rect class="sb-graph__meter" x="${-meterWidth / 2}" y="16" width="${clamp01(n.value / n.max) * meterWidth}" height="5" rx="2"/>` : '';

      return `
        <g class="${esc(classes.join(' '))}" data-node-id="${esc(n.id)}" transform="translate(${n.x}, ${n.y})">
          <title>${esc(n.label ?? n.id)}</title>
          ${shape}
          <text class="sb-graph__label" y="${labelY}" text-anchor="middle">${esc(n.label ?? n.id)}</text>
          ${sublabel}${meter}
        </g>`;
    }

    // A token follows the route of the edge it travels along, or a straight line if there is none.
    _token(token, byId, edges, routes) {
      const from = byId[token.from], to = byId[token.to];
      if (!from || !to) return '';
      const edge = edges.find((e) => e.from === token.from && e.to === token.to);
      const p = clamp01(token.progress);
      const point = edge ? routes.get(edge).pointAt(p) : add(from, scale(subtract(to, from), p));
      return `
        <g><title>${esc(token.title ?? token.label ?? '')}</title>
          <circle class="sb-graph__token" cx="${point.x}" cy="${point.y}" r="11"/>
          <text class="sb-graph__token-label" x="${point.x}" y="${point.y + 3}" text-anchor="middle">${esc(token.label ?? '')}</text>
        </g>`;
    }

    // ---- Interaction ----

    _select(e) {
      const node = e.target.closest('[data-node-id]');
      const edge = e.target.closest('[data-edge-id]');
      if (node) {
        this.selected = node.dataset.nodeId;
        this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { type: 'node', id: node.dataset.nodeId } }));
      } else if (edge) {
        this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { type: 'edge', id: edge.dataset.edgeId } }));
      }
    }
  }

  const edgeKey = (edge) => edge.id ?? `${edge.from}->${edge.to}`;

  // An edge label is a string (lines separated by \n) or a list of lines, each a string or { id, text }.
  function labelLines(edge) {
    if (edge.label == null || edge.label === '') return [];
    const lines = Array.isArray(edge.label) ? edge.label : String(edge.label).split('\n');
    return lines.map((line) => (typeof line === 'string' ? { text: line } : line));
  }

  const lineTexts = (edge) => labelLines(edge).map((line) => line.text);

  // Roughly the space a label takes.
  function labelSize(edge) {
    const texts = lineTexts(edge);
    return { width: Math.max(0, ...texts.map((t) => t.length)) * 6.5, height: texts.length * LINE_HEIGHT };
  }

  const labelBox = (edge, path) => ({ ...path.labelAt, ...labelSize(edge) });

  customElements.define('sb-graph', SbGraph);
})();
