// Sandkit sb-decision-tree 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A decision tree: questions that branch on their answers down to outcomes. Shows the way one case
// went, with its value at each question, and which other answers would have changed the outcome.
//
//   <sb-decision-tree direction="down"></sb-decision-tree>
//   tree.root = { id: 'income', question: 'Income?', children: [
//     { id: 'decline', answer: '< 30k', outcome: 'Decline', tone: 'bad' },
//     { id: 'approve', answer: '≥ 30k', outcome: 'Approve', tone: 'good' }
//   ] };
//   tree.trace = [{ id: 'income', value: '42k' }, { id: 'approve' }];
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-decision-tree';
  const existing = customElements.get('sb-decision-tree');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-decision-tree>, so only one can run. Rename one by replacing every "sb-decision-tree" in its file.`);
    }
    return;
  }

  const HALO = 'paint-order: stroke; stroke: var(--sb-surface, #fff); stroke-width: 4px; stroke-linejoin: round;';
  const CSS = `
    .sb-decision-tree { display: block; overflow-x: auto; contain: inline-size; } /* takes its container's width, and scrolls within it */
    .sb-decision-tree__svg { display: block; margin: 0 auto; font-family: inherit; overflow: visible; }
    .sb-decision-tree__branch { fill: none; stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; stroke-linejoin: round; }
    .sb-decision-tree__node { cursor: pointer; }
    .sb-decision-tree__shape { fill: var(--sb-surface, #fff); stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; }
    .sb-decision-tree__node--outcome .sb-decision-tree__shape { fill: var(--sb-surface-2, #eef0f3); }
    .sb-decision-tree__label { font-size: 12px; fill: var(--sb-text, #1f2933); }
    .sb-decision-tree__answer { font-size: 11px; fill: var(--sb-text, #1f2933); ${HALO} }
    .sb-decision-tree__otherwise { display: none; font-size: 11px; font-weight: 600; fill: var(--sb-accent, #2563eb); ${HALO} }
    .sb-decision-tree__value { font-size: 11px; font-weight: 700; fill: var(--sb-accent, #2563eb); ${HALO} }
    .sb-decision-tree__node--good .sb-decision-tree__shape { stroke: var(--sb-good, #3f9142); stroke-width: 2.5; }
    .sb-decision-tree__node--warn .sb-decision-tree__shape { stroke: var(--sb-warn, #d69e2e); stroke-width: 2.5; }
    .sb-decision-tree__node--bad .sb-decision-tree__shape { stroke: var(--sb-bad, #c53030); stroke-width: 2.5; }
    .sb-decision-tree__node--good .sb-decision-tree__label { fill: var(--sb-good, #3f9142); font-weight: 600; }
    .sb-decision-tree__node--warn .sb-decision-tree__label { fill: var(--sb-warn, #d69e2e); font-weight: 600; }
    .sb-decision-tree__node--bad .sb-decision-tree__label { fill: var(--sb-bad, #c53030); font-weight: 600; }
    .sb-decision-tree__node--on-path .sb-decision-tree__shape { stroke: var(--sb-accent, #2563eb); stroke-width: 2; }
    .sb-decision-tree__node--current .sb-decision-tree__shape { fill: var(--sb-accent-soft, #eaf0ff); stroke: var(--sb-accent, #2563eb); stroke-width: 3; }
    .sb-decision-tree__node--current .sb-decision-tree__label { font-weight: 700; }
    .sb-decision-tree__branch--taken { stroke: var(--sb-accent, #2563eb); stroke-width: 3; }
    .sb-decision-tree__node--off, .sb-decision-tree__branch--off, .sb-decision-tree__answer--off { opacity: 0.35; }
    .sb-decision-tree__branch--alternative { opacity: 1; stroke: var(--sb-accent, #2563eb); stroke-dasharray: 4 3; }
    .sb-decision-tree__answer--alternative { opacity: 1; }
    .sb-decision-tree__otherwise--alternative { display: inline; }
    /* Pointed at: shown even when faded, and glowing, so it stands apart from where the case is. */
    .sb-decision-tree__node--highlighted { opacity: 1; filter: drop-shadow(0 0 5px var(--sb-accent, #2563eb)); }
    .sb-decision-tree__node--highlighted .sb-decision-tree__shape { stroke: var(--sb-accent, #2563eb); stroke-width: 3; }`;

  // Sizes, in SVG units (which are pixels, since the tree is never scaled up).
  const NODE = { minWidth: 72, padding: 24, charWidth: 7, lineHeight: 15, height: 36 };
  const LABEL = { charWidth: 6, padding: 8, line: 14 }; // a branch's answer, and what it would have led to
  const STEM = 36;          // from a question's row to where its branches part
  const DROP = 44;          // going down, from where branches part into the answers below, room for two lines
  const LABEL_MARGIN = 16;  // going right, around the answers between the rows
  const SLOT_GAP = 24;      // between neighbours across the tree
  const BRANCH_WIDTH = { least: 1.5, most: 9 }; // a branch's thickness, from no cases to the most
  const FRAME_PADDING = 12;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const lines = (text) => String(text ?? '').split('\n');
  const unique = (list) => [...new Set(list)];
  const listed = (items) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} or ${items.at(-1)}` : items[0] ?? '');
  const present = (v) => v != null && v !== '';

  function addStyle() {
    if (document.getElementById('sb-decision-tree-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-decision-tree-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // ---- Structure ----

  // Each node of the tree as an item: its size, its place in the tree, the outcomes it can lead to,
  // and the text on the branch into it.
  function itemsOf(root, counts, sideways) {
    const items = [];
    const build = (node, depth, parent) => {
      const children = Array.isArray(node.children) ? node.children : [];
      const text = String(node.question ?? node.outcome ?? node.id);
      const item = { node, id: String(node.id), depth, parent, leaf: !children.length, lines: lines(text) };
      Object.assign(item, measure(item.lines));
      items.push(item);
      item.children = children.map((child) => build(child, depth + 1, item));
      item.outcomes = item.leaf ? [text] : unique(item.children.flatMap((c) => c.outcomes));
      if (parent) {
        item.answer = [node.answer, counts[item.id]].filter(present).join(' · ');
        item.otherwise = `→ ${listed(item.outcomes)}`;
        item.labelWidth = Math.max(item.answer.length, item.otherwise.length) * LABEL.charWidth + LABEL.padding;
      }
      item.along = sideways ? item.width : item.height;
      item.across = sideways ? item.height : item.width;
      return item;
    };
    build(root, 0, null);
    return items;
  }

  function measure(text) {
    const width = Math.max(NODE.minWidth, Math.max(...text.map((t) => t.length)) * NODE.charWidth + NODE.padding);
    return { width, height: NODE.height + (text.length - 1) * NODE.lineHeight };
  }

  // ---- Layout ----
  //
  // Placed in tree space: `a` runs along the tree (from a question to its answers) and `c` across
  // it (between neighbours). Only at the end is it turned into x and y, so the tree can grow down
  // or to the right with the same logic.

  function layout(root, direction, counts) {
    const sideways = direction === 'right';
    const items = itemsOf(root, counts, sideways);
    const toXY = sideways ? (p) => ({ x: p.a, y: p.c }) : (p) => ({ x: p.c, y: p.a });

    // Across: each outcome takes the next place along, and each question sits over its answers.
    // Going down, a place is wide enough for the labels on the branch into it.
    const room = (item) => (sideways || !item.parent ? item.across : Math.max(item.across, item.labelWidth));
    const shift = (item, by) => { item.c += by; item.children.forEach((child) => shift(child, by)); };
    let next = 0;
    const place = (item) => {
      const start = next;
      if (item.leaf) {
        item.c = start + room(item) / 2;
        next = start + room(item) + SLOT_GAP;
        return;
      }
      item.children.forEach(place);
      item.c = (item.children[0].c + item.children.at(-1).c) / 2;
      // A question wider than all its answers together moves them over, to sit centred under it.
      const spare = room(item) - (next - SLOT_GAP - start);
      if (spare > 0) {
        shift(item, spare / 2);
        next += spare;
      }
    };
    place(items[0]);

    // Along: one row per depth, as deep as its deepest node, with the answers in the gap before it.
    const depths = Math.max(...items.map((i) => i.depth)) + 1;
    const atDepth = (d) => items.filter((i) => i.depth === d);
    const rowAlong = Array.from({ length: depths }, (_, d) => Math.max(...atDepth(d).map((i) => i.along)));
    const gapBefore = (d) => STEM + (sideways ? Math.max(...atDepth(d).map((i) => i.labelWidth)) + LABEL_MARGIN : DROP);
    const rowStart = [];
    let a = 0;
    for (let d = 0; d < depths; d++) {
      if (d) a += gapBefore(d);
      rowStart[d] = a;
      a += rowAlong[d];
    }
    const partAt = (d) => rowStart[d] + rowAlong[d] + STEM;
    for (const item of items) item.a = rowStart[item.depth] + rowAlong[item.depth] / 2;

    // Each branch: out of its question, across where the branches part, and into its answer.
    for (const item of items) {
      if (item.parent) {
        const from = item.parent, part = partAt(from.depth);
        item.branch = [
          { a: from.a + from.along / 2, c: from.c }, { a: part, c: from.c },
          { a: part, c: item.c }, { a: item.a - item.along / 2, c: item.c }
        ].map(toXY);
        item.labels = labelPlaces(part, item, sideways, toXY);
      }
      // The case's value sits on the stem of its question, where its branches leave.
      const edge = item.a + item.along / 2;
      item.valueAt = sideways ? { ...toXY({ a: edge + 6, c: item.c - 6 }), anchor: 'start' } : { ...toXY({ a: edge + 14, c: item.c }), anchor: 'middle' };
      Object.assign(item, toXY(item));
    }
    return { items, frame: frameOf(items) };
  }

  // Going down, the answer and what it would have led to sit one above the other on the branch's
  // last stretch. Going right, they sit above and below it.
  function labelPlaces(part, item, sideways, toXY) {
    if (sideways) {
      const a = (part + item.a - item.along / 2) / 2;
      return { answer: toXY({ a, c: item.c - 5 }), otherwise: toXY({ a, c: item.c + LABEL.line }) };
    }
    return { answer: toXY({ a: part + LABEL.line + 4, c: item.c }), otherwise: toXY({ a: part + 2 * LABEL.line + 4, c: item.c }) };
  }

  function frameOf(items) {
    const points = items.flatMap((i) => [
      { x: i.x - i.width / 2, y: i.y - i.height / 2 }, { x: i.x + i.width / 2, y: i.y + i.height / 2 },
      ...(i.labels ? Object.values(i.labels).flatMap((p) => [{ x: p.x - i.labelWidth / 2, y: p.y - LABEL.line }, { x: p.x + i.labelWidth / 2, y: p.y }]) : [])
    ]);
    const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
    const x = Math.min(...xs) - FRAME_PADDING, y = Math.min(...ys) - FRAME_PADDING;
    return { x, y, width: Math.max(...xs) - x + FRAME_PADDING, height: Math.max(...ys) - y + FRAME_PADDING };
  }

  const pathOf = (points) => points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');

  // ---- The element ----

  class SbDecisionTree extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['direction'];

    constructor() {
      super();
      this._root = null;
      this._trace = [];
      this._counts = {};
      this._highlight = [];
      this._items = new Map();
      this._pointed = null;
      this.addEventListener('click', (e) => this._select(e));
      this.addEventListener('pointerover', (e) => this._point(e.target.closest('[data-node-id]')?.dataset.nodeId ?? null));
      this.addEventListener('pointerleave', () => this._point(null));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-decision-tree');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // The first question: { id, question, children: [{ id, answer, question, children } | { id, answer, outcome, tone }] }.
    get root() { return this._root; }
    set root(value) {
      this._root = value ?? null;
      this.render();
    }

    // The way one case went, as the model decided it: [{ id, value }, …] from the first question on.
    get trace() { return this._trace; }
    set trace(value) {
      this._trace = value ?? [];
      this._showState();
    }

    // How many cases reached each node: { id: number }.
    get counts() { return this._counts; }
    set counts(value) {
      this._counts = value ?? {};
      this.render();
    }

    // Ids of nodes to point at.
    get highlight() { return this._highlight; }
    set highlight(value) {
      this._highlight = (value ?? []).map(String);
      this._showState();
    }

    get direction() { return this.getAttribute('direction') === 'right' ? 'right' : 'down'; }
    set direction(value) { this.setAttribute('direction', value); }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      if (!this._root) {
        this._items = new Map();
        this.innerHTML = '';
        return;
      }
      const { items, frame } = layout(this._root, this.direction, this._counts);
      this._items = new Map(items.map((i) => [i.id, i]));
      const branches = items.filter((i) => i.parent);
      this.innerHTML = `
        <svg class="sb-decision-tree__svg" viewBox="${frame.x} ${frame.y} ${frame.width} ${frame.height}" width="${frame.width}" role="img" aria-label="Decision tree">
          ${branches.map((i) => this._branch(i)).join('')}
          ${items.map((i) => this._node(i)).join('')}
          ${branches.map((i) => this._labels(i)).join('')}
          ${items.filter((i) => !i.leaf).map((i) => this._value(i)).join('')}
        </svg>`;
      this._showState();
    }

    // Thicker for more cases, when counts are given.
    _branch(item) {
      const count = this._counts[item.id];
      const most = Math.max(0, ...Object.values(this._counts).filter(Number.isFinite));
      const width = Number.isFinite(count) && most ? BRANCH_WIDTH.least + (BRANCH_WIDTH.most - BRANCH_WIDTH.least) * count / most : null;
      return `<path class="sb-decision-tree__branch" data-branch-id="${esc(item.id)}" d="${pathOf(item.branch)}"${width == null ? '' : ` style="stroke-width: ${width}"`}/>`;
    }

    _node(item) {
      const kind = item.leaf ? 'outcome' : 'question';
      const tone = item.node.tone ? ` sb-decision-tree__node--${esc(item.node.tone)}` : '';
      const { width: w, height: h } = item;
      const top = -((item.lines.length - 1) * NODE.lineHeight) / 2 + 4;
      return `
        <g class="sb-decision-tree__node sb-decision-tree__node--${kind}${tone}" data-node-id="${esc(item.id)}" transform="translate(${item.x}, ${item.y})">
          <rect class="sb-decision-tree__shape" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${item.leaf ? h / 2 : 4}"/>
          <text class="sb-decision-tree__label" text-anchor="middle">${item.lines.map((t, i) => `<tspan x="0" y="${top + i * NODE.lineHeight}">${esc(t)}</tspan>`).join('')}</text>
        </g>`;
    }

    // Drawn above the nodes, so nothing hides them. What the branch would have led to shows only
    // when it would have changed the outcome.
    _labels(item) {
      const { answer, otherwise } = item.labels;
      const id = esc(item.id);
      return `
        ${item.answer ? `<text class="sb-decision-tree__answer" data-branch-id="${id}" x="${answer.x}" y="${answer.y}" text-anchor="middle">${esc(item.answer)}</text>` : ''}
        <text class="sb-decision-tree__otherwise" data-branch-id="${id}" x="${otherwise.x}" y="${otherwise.y}" text-anchor="middle">${esc(item.otherwise)}</text>`;
    }

    // Filled in from the trace.
    _value(item) {
      const { x, y, anchor } = item.valueAt;
      return `<text class="sb-decision-tree__value" data-value-id="${esc(item.id)}" x="${x}" y="${y}" text-anchor="${anchor}"></text>`;
    }

    // Marks the case's way through, its values, the answers that would have changed its outcome,
    // and what's pointed at, without laying the tree out again.
    _showState() {
      const path = this._trace.map((step) => String(step.id));
      const values = new Map(this._trace.map((step) => [String(step.id), step.value]));
      const onPath = new Set(path);
      const tracing = path.length > 0;
      const end = this._items.get(path.at(-1));
      const outcome = end?.leaf ? end.outcomes[0] : null;

      const wentOnFrom = (item) => onPath.has(item.id) && item.children.some((c) => onPath.has(c.id));
      const taken = (item) => onPath.has(item.id) && onPath.has(item.parent.id);
      const alternative = (item) => !onPath.has(item.id) && wentOnFrom(item.parent) && item.outcomes.some((o) => o !== outcome);

      for (const el of this.querySelectorAll('[data-node-id]')) {
        const id = el.dataset.nodeId;
        el.classList.toggle('sb-decision-tree__node--on-path', onPath.has(id));
        el.classList.toggle('sb-decision-tree__node--current', id === path.at(-1));
        el.classList.toggle('sb-decision-tree__node--off', tracing && !onPath.has(id));
        el.classList.toggle('sb-decision-tree__node--highlighted', this._highlight.includes(id));
      }
      for (const el of this.querySelectorAll('[data-branch-id]')) {
        const item = this._items.get(el.dataset.branchId), base = el.classList[0];
        el.classList.toggle(`${base}--taken`, taken(item));
        el.classList.toggle(`${base}--off`, tracing && !taken(item));
        el.classList.toggle(`${base}--alternative`, alternative(item));
      }
      for (const el of this.querySelectorAll('[data-value-id]')) {
        const id = el.dataset.valueId;
        el.textContent = present(values.get(id)) ? String(values.get(id)) : '';
      }
    }

    // ---- Interaction ----

    _select(e) {
      const el = e.target.closest('[data-node-id]');
      if (el) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { node: this._items.get(el.dataset.nodeId).node } }));
    }

    _point(id) {
      if (id === this._pointed) return;
      this._pointed = id;
      const detail = id == null ? null : { node: this._items.get(id).node };
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail }));
    }
  }

  customElements.define('sb-decision-tree', SbDecisionTree);
})();
