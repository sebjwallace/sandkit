// Sandkit sb-flowchart 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A flowchart, optionally in swim lanes, laid out from its structure: steps follow each other in
// the order their arrows give, and each sits in its lane. Marks where a process is and how it got there.
//
//   <sb-flowchart direction="down"></sb-flowchart>
//   chart.data = {
//     lanes: [{ id: 'customer', label: 'Customer' }, { id: 'kitchen', label: 'Kitchen' }],
//     nodes: [{ id: 'order', label: 'Order', kind: 'start', lane: 'customer' }, { id: 'cook', label: 'Cook', lane: 'kitchen' }],
//     edges: [{ from: 'order', to: 'cook' }]
//   };
//   chart.active = { nodes: ['cook'] };
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-flowchart';
  const existing = customElements.get('sb-flowchart');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-flowchart>, so only one can run. Rename one by replacing every "sb-flowchart" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-flowchart { display: block; overflow-x: auto; contain: inline-size; } /* takes its container's width, and scrolls within it */
    .sb-flowchart__svg { display: block; margin: 0 auto; font-family: inherit; overflow: visible; }
    .sb-flowchart__lane { fill: none; stroke: var(--sb-border, #d5d9e0); }
    .sb-flowchart__lane-head { fill: var(--sb-surface-2, #eef0f3); stroke: var(--sb-border, #d5d9e0); }
    .sb-flowchart__lane-label { font-size: 12px; font-weight: 600; fill: var(--sb-muted, #616e7c); }
    .sb-flowchart__node { cursor: pointer; }
    .sb-flowchart__shape { fill: var(--sb-surface, #fff); stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; }
    .sb-flowchart__node--start .sb-flowchart__shape, .sb-flowchart__node--end .sb-flowchart__shape { fill: var(--sb-surface-2, #eef0f3); }
    .sb-flowchart__label { font-size: 12px; fill: var(--sb-text, #1f2933); }
    .sb-flowchart__node--good .sb-flowchart__shape { stroke: var(--sb-good, #3f9142); stroke-width: 2.5; }
    .sb-flowchart__node--warn .sb-flowchart__shape { stroke: var(--sb-warn, #d69e2e); stroke-width: 2.5; }
    .sb-flowchart__node--bad .sb-flowchart__shape { stroke: var(--sb-bad, #c53030); stroke-width: 2.5; }
    .sb-flowchart__node--visited .sb-flowchart__shape { stroke: var(--sb-accent, #2563eb); }
    .sb-flowchart__node--active .sb-flowchart__shape { fill: var(--sb-accent-soft, #eaf0ff); stroke: var(--sb-accent, #2563eb); stroke-width: 3; }
    .sb-flowchart__node--active .sb-flowchart__label { font-weight: 700; }
    .sb-flowchart__edge { cursor: pointer; }
    .sb-flowchart__line { fill: none; stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; stroke-linejoin: round; }
    .sb-flowchart__arrow { fill: var(--sb-muted, #616e7c); }
    .sb-flowchart__hit { fill: none; stroke: transparent; stroke-width: 12; }
    .sb-flowchart__edge-label { font-size: 11px; fill: var(--sb-text, #1f2933); paint-order: stroke; stroke: var(--sb-surface, #fff); stroke-width: 4px; stroke-linejoin: round; }
    .sb-flowchart__edge--visited .sb-flowchart__line { stroke: var(--sb-accent, #2563eb); stroke-width: 2; }
    .sb-flowchart__edge--visited .sb-flowchart__arrow { fill: var(--sb-accent, #2563eb); }
    .sb-flowchart__edge--active .sb-flowchart__line { stroke: var(--sb-accent, #2563eb); stroke-width: 3; }
    .sb-flowchart__edge--active .sb-flowchart__arrow { fill: var(--sb-accent, #2563eb); }`;

  // Sizes, in SVG units (which are pixels, since the chart is never scaled up).
  const NODE = { minWidth: 100, padding: 24, charWidth: 7, lineHeight: 15, height: 38, decisionMinWidth: 120, decisionHeight: 64 };
  const RANK_GAP = 56;    // between one step and the next, along the flow
  const SLOT_GAP = 36;    // between steps side by side
  const LANE_PADDING = 36; // inside each lane's sides, leaving room for lines that loop back
  const LOOP_OFFSET = 18; // how far a loop runs outside the steps it passes
  const LANE_HEAD = { down: 32, padding: 24, charWidth: 7.5 };
  const ARROW = { length: 9, half: 4.5 };
  const LABEL_OFFSET = 16; // how far along its first stretch an edge's label sits
  const SLANT = 10;        // how far a data shape leans
  const FRAME_PADDING = 12;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const lines = (text) => String(text ?? '').split('\n');
  const edgeKey = (edge) => edge.id ?? `${edge.from}->${edge.to}`;

  function addStyle() {
    if (document.getElementById('sb-flowchart-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-flowchart-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // ---- Structure ----

  // Each node's rank: how many steps it is from the beginning, by its longest way in. Edges that
  // lead back to an earlier step (loops) are set aside, so they don't push anything further on.
  function rankNodes(nodes, edges) {
    const outgoing = new Map(nodes.map((n) => [n.id, []]));
    for (const edge of edges) outgoing.get(edge.from).push(edge);
    const state = new Map(), finished = [], loops = new Set();
    const visit = (id) => {
      state.set(id, 'visiting');
      for (const edge of outgoing.get(id)) {
        if (state.get(edge.to) === 'visiting') loops.add(edge);
        else if (!state.has(edge.to)) visit(edge.to);
      }
      state.set(id, 'done');
      finished.push(id);
    };
    // Begin where nothing leads in, so a loop back to the start isn't taken for the way in.
    const entered = new Set(edges.map((e) => e.to));
    for (const n of nodes) if (!entered.has(n.id) && !state.has(n.id)) visit(n.id);
    for (const n of nodes) if (!state.has(n.id)) visit(n.id);

    const rank = new Map(nodes.map((n) => [n.id, 0]));
    for (const id of finished.reverse()) {
      for (const edge of outgoing.get(id)) {
        if (!loops.has(edge)) rank.set(edge.to, Math.max(rank.get(edge.to), rank.get(id) + 1));
      }
    }
    return { rank, loops };
  }

  // A node's size from its label and kind.
  function measure(node) {
    const text = lines(node.label ?? node.id);
    const textWidth = Math.max(...text.map((t) => t.length)) * NODE.charWidth + NODE.padding;
    const textHeight = (text.length - 1) * NODE.lineHeight;
    if (node.kind === 'decision') {
      return { width: Math.max(NODE.decisionMinWidth, textWidth * 1.5), height: NODE.decisionHeight + textHeight * 1.5 };
    }
    return { width: Math.max(NODE.minWidth, textWidth + (node.kind === 'data' ? 2 * SLANT : 0)), height: NODE.height + textHeight };
  }

  // ---- Layout ----
  //
  // Everything is placed and routed in flow space: `a` runs along the flow (from one step to the
  // next) and `c` across it (from lane to lane). Only at the end is it turned into x and y, so the
  // chart can flow down or to the right with the same logic.

  function layout(data, direction) {
    const byId = new Map(data.nodes.map((n) => [n.id, n]));
    const edges = data.edges.filter((e) => byId.has(e.from) && byId.has(e.to) && e.from !== e.to);
    const { rank, loops } = rankNodes(data.nodes, edges);
    const laneIds = data.lanes.map((l) => l.id);
    const laneOf = (n) => Math.max(0, laneIds.indexOf(n.lane));
    const sideways = direction === 'right';

    // Sizes along and across the flow.
    const nodes = data.nodes.map((n) => {
      const { width, height } = measure(n);
      return { ...n, width, height, rank: rank.get(n.id), lane: laneOf(n), along: sideways ? width : height, across: sideways ? height : width };
    });

    // Steps that share a rank and a lane sit side by side, in the order they were given.
    const cells = new Map();
    for (const n of nodes) {
      const key = `${n.rank}|${n.lane}`;
      cells.set(key, [...(cells.get(key) ?? []), n]);
    }
    const cellAcross = (cell) => cell.reduce((sum, n) => sum + n.across, 0) + SLOT_GAP * (cell.length - 1);

    // Lanes are as wide as their widest cell; ranks as deep as their deepest step.
    const laneCount = Math.max(1, data.lanes.length);
    const laneAcross = Array.from({ length: laneCount }, (_, lane) =>
      Math.max(0, ...[...cells.values()].filter((cell) => cell[0].lane === lane).map(cellAcross)) + 2 * LANE_PADDING);
    const laneStart = laneAcross.map((_, i) => laneAcross.slice(0, i).reduce((a, b) => a + b, 0));
    const rankCount = Math.max(...nodes.map((n) => n.rank)) + 1;
    const rankAlong = Array.from({ length: rankCount }, (_, r) => Math.max(0, ...nodes.filter((n) => n.rank === r).map((n) => n.along)));
    const head = !data.lanes.length ? 0
      : sideways ? Math.max(...data.lanes.map((l) => String(l.label ?? l.id).length)) * LANE_HEAD.charWidth + LANE_HEAD.padding
      : LANE_HEAD.down;
    const rankMiddle = rankAlong.map((size, r) => head + RANK_GAP / 2 + rankAlong.slice(0, r).reduce((sum, s) => sum + s + RANK_GAP, 0) + size / 2);
    const totalAlong = head + rankAlong.reduce((sum, s) => sum + s + RANK_GAP, 0);

    for (const cell of cells.values()) {
      const { lane, rank: r } = cell[0];
      let c = laneStart[lane] + laneAcross[lane] / 2 - cellAcross(cell) / 2;
      for (const n of cell) {
        n.a = rankMiddle[r];
        n.c = c + n.across / 2;
        c += n.across + SLOT_GAP;
      }
    }

    const placed = new Map(nodes.map((n) => [n.id, n]));
    const outgoing = (n) => edges.filter((e) => e.from === n.id && !loops.has(e)).length;
    const toXY = sideways ? (p) => ({ x: p.a, y: p.c }) : (p) => ({ x: p.c, y: p.a });
    // The middle of the gap after a rank; rank -1 is the gap before the first.
    const gapAfter = (r) => (r < 0 ? head + RANK_GAP / 4 : rankMiddle[r] + rankAlong[r] / 2 + RANK_GAP / 2);
    const routes = edges.map((edge) => {
      const from = placed.get(edge.from), to = placed.get(edge.to);
      const blockers = nodes.filter((n) => n.rank > from.rank && n.rank < to.rank && Math.abs(n.c - to.c) < n.across / 2 + SLOT_GAP / 2);
      const points = loops.has(edge) ? loopRoute(from, to, nodes, gapAfter(to.rank - 1))
        : from.rank === to.rank ? acrossRoute(from, to)
        : blockers.length ? bypassRoute(from, to, blockers, gapAfter(from.rank), gapAfter(to.rank - 1))
        : from.kind === 'decision' && from.c !== to.c && outgoing(from) > 1 ? branchRoute(from, to)
        : forwardRoute(from, to, gapAfter(from.rank));
      return { edge, points: points.map(toXY) };
    });

    const lanes = data.lanes.map((lane, i) => {
      const box = (a0, a1) => {
        const [p, q] = [toXY({ a: a0, c: laneStart[i] }), toXY({ a: a1, c: laneStart[i] + laneAcross[i] })];
        return { x: p.x, y: p.y, width: q.x - p.x, height: q.y - p.y };
      };
      return { ...lane, box: box(0, totalAlong), head: box(0, head) };
    });

    return { nodes: nodes.map((n) => ({ ...n, ...toXY(n) })), routes, lanes };
  }

  // On from the far side of a step, across where the gap after its rank allows, then on into the target.
  function forwardRoute(from, to, turnAt) {
    const start = { a: from.a + from.along / 2, c: from.c };
    const end = { a: to.a - to.along / 2, c: to.c };
    if (from.c === to.c) return [start, end];
    return [start, { a: turnAt, c: from.c }, { a: turnAt, c: to.c }, end];
  }

  // Past steps that sit in the way, on their near side (loops back take the far side). A decision
  // leaves from its side; anything else first steps into the gap after its rank.
  function bypassRoute(from, to, blockers, turnAfter, turnBefore) {
    const c = Math.min(...blockers.map((n) => n.c - n.across / 2)) - LOOP_OFFSET;
    const start = from.kind === 'decision'
      ? [{ a: from.a, c: from.c - from.across / 2 }]
      : [{ a: from.a + from.along / 2, c: from.c }, { a: turnAfter, c: from.c }];
    const out = start.at(-1).a;
    return [...start, { a: out, c }, { a: turnBefore, c }, { a: turnBefore, c: to.c }, { a: to.a - to.along / 2, c: to.c }];
  }

  // A decision's branches leave from its sides, towards the step they lead to.
  function branchRoute(from, to) {
    const side = Math.sign(to.c - from.c);
    const start = { a: from.a, c: from.c + side * from.across / 2 };
    return [start, { a: from.a, c: to.c }, { a: to.a - to.along / 2, c: to.c }];
  }

  // Straight across, between neighbours in the same rank.
  function acrossRoute(from, to) {
    const side = Math.sign(to.c - from.c) || 1;
    return [{ a: from.a, c: from.c + side * from.across / 2 }, { a: to.a, c: to.c - side * to.across / 2 }];
  }

  // Back to an earlier step: out of the far side, past the steps in its lane, back through the gap
  // before the target, and in the way the target is usually entered, joining that line.
  function loopRoute(from, to, nodes, turnBefore) {
    const passed = nodes.filter((n) => n.lane === from.lane && n.rank >= to.rank && n.rank <= from.rank);
    const c = Math.max(...passed.map((n) => n.c + n.across / 2)) + LOOP_OFFSET;
    return [
      { a: from.a, c: from.c + from.across / 2 }, { a: from.a, c },
      { a: turnBefore, c }, { a: turnBefore, c: to.c }, { a: to.a - to.along / 2, c: to.c }
    ];
  }

  // ---- Drawing ----

  const pathOf = (points) => points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');

  // An arrowhead on the last stretch, pointing the way it runs.
  function arrowAt(points) {
    const [p, q] = points.slice(-2);
    const length = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const ux = (q.x - p.x) / length, uy = (q.y - p.y) / length;
    const bx = q.x - ux * ARROW.length, by = q.y - uy * ARROW.length;
    return `M${q.x},${q.y} L${bx - uy * ARROW.half},${by + ux * ARROW.half} L${bx + uy * ARROW.half},${by - ux * ARROW.half} z`;
  }

  // Where an edge's label sits: a little way along its first stretch.
  function labelAt(points) {
    const [p, q] = points;
    const length = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const along = Math.min(LABEL_OFFSET, length / 2);
    return { x: p.x + (q.x - p.x) / length * along, y: p.y + (q.y - p.y) / length * along };
  }

  function shape(node) {
    const w = node.width / 2, h = node.height / 2;
    switch (node.kind) {
      case 'start': case 'end':
        return `<rect class="sb-flowchart__shape" x="${-w}" y="${-h}" width="${node.width}" height="${node.height}" rx="${h}"/>`;
      case 'decision':
        return `<polygon class="sb-flowchart__shape" points="0,${-h} ${w},0 0,${h} ${-w},0"/>`;
      case 'data':
        return `<polygon class="sb-flowchart__shape" points="${-w + SLANT},${-h} ${w},${-h} ${w - SLANT},${h} ${-w},${h}"/>`;
      default:
        return `<rect class="sb-flowchart__shape" x="${-w}" y="${-h}" width="${node.width}" height="${node.height}" rx="4"/>`;
    }
  }

  // ---- The element ----

  const KINDS = ['start', 'end', 'step', 'decision', 'data'];

  class SbFlowchart extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['direction'];

    constructor() {
      super();
      this._data = { lanes: [], nodes: [], edges: [] };
      this._active = { nodes: [], edges: [] };
      this._visited = { nodes: [], edges: [] };
      this.addEventListener('click', (e) => this._select(e));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-flowchart');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // { lanes: [{ id, label }], nodes: [{ id, label, kind, lane, tone }], edges: [{ id, from, to, label }] }.
    // Without lanes, it's a plain flowchart.
    get data() { return this._data; }
    set data(value) {
      this._data = { lanes: [], nodes: [], edges: [], ...value };
      this.render();
    }

    // Where the process is now: { nodes: [ids], edges: [ids] }.
    get active() { return this._active; }
    set active(value) {
      this._active = { nodes: [], edges: [], ...value };
      this._showState();
    }

    // How it got there: { nodes: [ids], edges: [ids] }.
    get visited() { return this._visited; }
    set visited(value) {
      this._visited = { nodes: [], edges: [], ...value };
      this._showState();
    }

    get direction() { return this.getAttribute('direction') === 'right' ? 'right' : 'down'; }
    set direction(value) { this.setAttribute('direction', value); }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      if (!this._data.nodes.length) {
        this.innerHTML = '';
        return;
      }
      const { nodes, routes, lanes } = layout(this._data, this.direction);
      const frame = this._frame(nodes, routes, lanes);
      this.innerHTML = `
        <svg class="sb-flowchart__svg" viewBox="${frame.x} ${frame.y} ${frame.width} ${frame.height}" width="${frame.width}" role="img" aria-label="Flowchart">
          ${lanes.map((lane) => this._lane(lane)).join('')}
          ${routes.map((route) => this._edge(route)).join('')}
          ${nodes.map((n) => this._node(n)).join('')}
          ${routes.map((route) => this._edgeLabel(route)).join('')}
        </svg>`;
      this._showState();
    }

    _frame(nodes, routes, lanes) {
      const points = nodes.flatMap((n) => [{ x: n.x - n.width / 2, y: n.y - n.height / 2 }, { x: n.x + n.width / 2, y: n.y + n.height / 2 }])
        .concat(routes.flatMap((r) => r.points), lanes.flatMap(({ box }) => [box, { x: box.x + box.width, y: box.y + box.height }]));
      const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
      const x = Math.min(...xs) - FRAME_PADDING, y = Math.min(...ys) - FRAME_PADDING;
      return { x, y, width: Math.max(...xs) - x + FRAME_PADDING, height: Math.max(...ys) - y + FRAME_PADDING };
    }

    _lane({ id, label, box, head }) {
      return `
        <g data-lane-id="${esc(id)}">
          <rect class="sb-flowchart__lane" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"/>
          <rect class="sb-flowchart__lane-head" x="${head.x}" y="${head.y}" width="${head.width}" height="${head.height}"/>
          <text class="sb-flowchart__lane-label" x="${head.x + head.width / 2}" y="${head.y + head.height / 2 + 4}" text-anchor="middle">${esc(label ?? id)}</text>
        </g>`;
    }

    _node(n) {
      const kind = KINDS.includes(n.kind) ? n.kind : 'step';
      const tone = n.tone ? ` sb-flowchart__node--${esc(n.tone)}` : '';
      const text = lines(n.label ?? n.id);
      const top = -((text.length - 1) * NODE.lineHeight) / 2 + 4;
      return `
        <g class="sb-flowchart__node sb-flowchart__node--${kind}${tone}" data-node-id="${esc(n.id)}" transform="translate(${n.x}, ${n.y})">
          ${shape({ ...n, kind })}
          <text class="sb-flowchart__label" text-anchor="middle">${text.map((t, i) => `<tspan x="0" y="${top + i * NODE.lineHeight}">${esc(t)}</tspan>`).join('')}</text>
        </g>`;
    }

    _edge({ edge, points }) {
      const d = pathOf(points);
      return `
        <g class="sb-flowchart__edge" data-edge-id="${esc(edgeKey(edge))}">
          <title>${esc(edge.label ?? edgeKey(edge))}</title>
          <path class="sb-flowchart__hit" d="${d}"/>
          <path class="sb-flowchart__line" d="${d}"/>
          <path class="sb-flowchart__arrow" d="${arrowAt(points)}"/>
        </g>`;
    }

    // Drawn above the nodes, so a label beside a decision is never hidden.
    _edgeLabel({ edge, points }) {
      if (edge.label == null || edge.label === '') return '';
      const at = labelAt(points);
      return `<text class="sb-flowchart__edge-label" x="${at.x}" y="${at.y + 4}" text-anchor="middle" data-edge-id="${esc(edgeKey(edge))}">${esc(edge.label)}</text>`;
    }

    // Marks where the process is and how it got there, without redrawing.
    _showState() {
      const mark = (selector, key, kind) => {
        for (const el of this.querySelectorAll(selector)) {
          const id = el.dataset[key];
          el.classList.toggle(`${selector.slice(1)}--active`, this._active[kind].includes(id));
          el.classList.toggle(`${selector.slice(1)}--visited`, this._visited[kind].includes(id));
        }
      };
      mark('.sb-flowchart__node', 'nodeId', 'nodes');
      mark('.sb-flowchart__edge', 'edgeId', 'edges');
    }

    // ---- Interaction ----

    _select(e) {
      const node = e.target.closest('[data-node-id]');
      const edge = e.target.closest('[data-edge-id]');
      if (node) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { type: 'node', id: node.dataset.nodeId } }));
      else if (edge) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { type: 'edge', id: edge.dataset.edgeId } }));
    }
  }

  customElements.define('sb-flowchart', SbFlowchart);
})();
