// Sandkit sb-plane 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A two-dimensional coordinate plane for vectors, points and shapes, which can be transformed by a
// matrix, smoothly, so people watch space itself move. Vectors and points can be dragged.
//
//   plane.objects = [{ type: 'vector', id: 'v', x: 2, y: 1, label: 'v', draggable: true }];
//   plane.matrix = [[1, 1], [0, 1]];   // a shear
//   plane.progress = 0.5;              // halfway from no change to the full transformation
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-plane';
  const existing = customElements.get('sb-plane');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-plane>, so only one can run. Rename one by replacing every "sb-plane" in its file.`);
    }
    return;
  }

  const TONES = ['accent', 'good', 'warn', 'bad', 'muted', 'text'];
  const FALLBACK = { accent: '#2563eb', good: '#3f9142', warn: '#d69e2e', bad: '#c53030', muted: '#616e7c', text: '#1f2933' };

  const CSS = `
    .sb-plane { display: block; }
    .sb-plane__svg { display: block; touch-action: none; }
    .sb-plane__grid { stroke: var(--sb-border, #d5d9e0); stroke-width: 1; }
    .sb-plane__axis { stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; }
    .sb-plane__tick { font-size: 10px; fill: var(--sb-muted, #616e7c); }
    .sb-plane__moved-grid { stroke: var(--sb-accent, #2563eb); stroke-width: 1; opacity: 0.45; }
    .sb-plane__moved-axis { stroke: var(--sb-accent, #2563eb); stroke-width: 1.75; opacity: 0.8; }
    .sb-plane__shaft { stroke-width: 3; stroke-linecap: round; }
    .sb-plane__polygon { stroke-width: 2; fill-opacity: 0.18; }
    .sb-plane__label { font-size: 14px; font-weight: 700; font-style: italic; paint-order: stroke; stroke: var(--sb-surface, #fff); stroke-width: 4px; stroke-linejoin: round; }
    .sb-plane__handle { fill: transparent; cursor: grab; }
    .sb-plane--dragging, .sb-plane--dragging .sb-plane__handle { cursor: grabbing; }
    ${TONES.map((tone) => `
    .sb-plane--${tone} { stroke: var(--sb-${tone}, ${FALLBACK[tone]}); fill: var(--sb-${tone}, ${FALLBACK[tone]}); }
    .sb-plane__label.sb-plane--${tone} { stroke: var(--sb-surface, #fff); }`).join('')}`;

  const DEFAULT_RANGE = 5;       // units from the origin to the nearer edge
  const DEFAULT_HEIGHT = 360;
  const DEFAULT_WIDTH = 480;
  const ARROWHEAD = { length: 12, width: 9 };
  const HANDLE_RADIUS = 14;
  const GRID_REACH = 4;          // grid lines extend this many ranges out, so they still cover the view when transformed
  const IDENTITY = [[1, 0], [0, 1]];

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const round = (n) => Math.round(n * 100) / 100;

  function addStyle() {
    if (document.getElementById('sb-plane-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-plane-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // ---- Linear algebra ----
  // A matrix [[a, b], [c, d]] sends î = (1, 0) to (a, c) and ĵ = (0, 1) to (b, d).

  const apply = ([[a, b], [c, d]], [x, y]) => [a * x + b * y, c * x + d * y];

  // Partway between doing nothing (t = 0) and the full transformation (t = 1).
  const between = (m, t) => m.map((row, i) => row.map((value, j) => IDENTITY[i][j] + (value - IDENTITY[i][j]) * t));

  function inverse([[a, b], [c, d]]) {
    const det = a * d - b * c;
    return Math.abs(det) < 1e-9 ? null : [[d / det, -b / det], [-c / det, a / det]];
  }

  class SbPlane extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['range', 'height', 'basis', 'snap'];

    constructor() {
      super();
      this._objects = [];
      this._matrix = IDENTITY;
      this._progress = 1;
      // Drawn at its real width, so the grid stays square and text keeps its size.
      this._resizeObserver = new ResizeObserver(() => { if (this.clientWidth !== this._drawnWidth) this.render(); });
      this.addEventListener('pointerdown', (e) => this._startDrag(e));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-plane');
      this._resizeObserver.observe(this);
      this.render();
    }

    disconnectedCallback() {
      this._resizeObserver.disconnect();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // [{ type: 'vector' | 'point' | 'polygon', id, x, y, from, points, label, tone, draggable, fixed }]
    get objects() { return this._objects; }
    set objects(list) {
      this._objects = (list || []).map((o) => ({ ...o }));
      this.render();
    }

    // The transformation, as [[a, b], [c, d]].
    get matrix() { return this._matrix; }
    set matrix(m) {
      this._matrix = m || IDENTITY;
      this.render();
    }

    // How far through the transformation, from 0 (no change) to 1 (the full matrix).
    get progress() { return this._progress; }
    set progress(t) {
      this._progress = Math.max(0, Math.min(1, Number(t)));
      this.render();
    }

    // ---- Rendering ----

    get _current() { return between(this._matrix, this._progress); }

    render() {
      if (!this.isConnected) return;
      const width = this._drawnWidth = this.clientWidth || DEFAULT_WIDTH;
      const height = Number(this.getAttribute('height')) || DEFAULT_HEIGHT;
      const range = Number(this.getAttribute('range')) || DEFAULT_RANGE;
      const unit = Math.min(width, height) / 2 / range;
      this._view = { width, height, unit, cx: width / 2, cy: height / 2 };
      const moved = this._current;
      const isMoved = moved.some((row, i) => row.some((v, j) => Math.abs(v - IDENTITY[i][j]) > 1e-9));

      this.innerHTML = `
        <svg class="sb-plane__svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Coordinate plane">
          ${this._grid(IDENTITY, range, 'sb-plane__grid', 'sb-plane__axis')}
          ${this._ticks(range)}
          ${isMoved ? this._grid(moved, range, 'sb-plane__moved-grid', 'sb-plane__moved-axis') : ''}
          ${this.hasAttribute('basis') ? this._basis(moved) : ''}
          ${this._objects.map((o) => this._object(o, moved)).join('')}
        </svg>`;
    }

    _toScreen([x, y]) {
      const { cx, cy, unit } = this._view;
      return [round(cx + x * unit), round(cy - y * unit)];
    }

    // Lines of constant x and constant y, each sent through the matrix. Linear maps keep lines
    // straight, so each is just its two transformed ends.
    _grid(matrix, range, lineClass, axisClass) {
      const reach = Math.ceil(range * GRID_REACH);
      const line = (from, to, cls) => {
        const [x1, y1] = this._toScreen(apply(matrix, from)), [x2, y2] = this._toScreen(apply(matrix, to));
        return `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      };
      const lines = [];
      for (let k = -reach; k <= reach; k++) {
        if (k === 0) continue;
        lines.push(line([k, -reach], [k, reach], lineClass), line([-reach, k], [reach, k], lineClass));
      }
      lines.push(line([0, -reach], [0, reach], axisClass), line([-reach, 0], [reach, 0], axisClass));
      return lines.join('');
    }

    // Whole-number ticks along each axis, leaving out any that would sit on the edge and be cut off.
    _ticks(range) {
      const ticks = [];
      const last = Math.ceil(range) - 1;
      for (let k = -last; k <= last; k++) {
        if (k === 0) continue;
        const [x, y] = this._toScreen([k, 0]), [x2, y2] = this._toScreen([0, k]);
        ticks.push(`<text class="sb-plane__tick" x="${x}" y="${y + 14}" text-anchor="middle">${k}</text>`);
        ticks.push(`<text class="sb-plane__tick" x="${x2 - 6}" y="${y2 + 4}" text-anchor="end">${k}</text>`);
      }
      return ticks.join('');
    }

    // î in green and ĵ in red, as they move with the transformation.
    _basis(matrix) {
      return this._arrow([0, 0], apply(matrix, [1, 0]), 'good', 'î') + this._arrow([0, 0], apply(matrix, [0, 1]), 'bad', 'ĵ');
    }

    _object(o, matrix) {
      const place = (point) => (o.fixed ? point : apply(matrix, point));
      const tone = TONES.includes(o.tone) ? o.tone : 'accent';
      if (o.type === 'polygon') {
        const points = (o.points || []).map((p) => this._toScreen(place(p)).join(',')).join(' ');
        return `<polygon class="sb-plane__polygon sb-plane--${tone}" points="${points}" data-object-id="${esc(o.id)}"><title>${esc(o.label ?? o.id)}</title></polygon>`;
      }
      const tip = place([o.x, o.y]);
      const handle = o.draggable ? this._handle(o, tip) : '';
      if (o.type === 'point') {
        const [x, y] = this._toScreen(tip);
        return `<g data-object-id="${esc(o.id)}"><circle class="sb-plane__dot sb-plane--${tone}" cx="${x}" cy="${y}" r="5"/>${this._label(o.label, tip, [1, 1], tone)}${handle}</g>`;
      }
      const tail = place(o.from || [0, 0]);
      return `<g data-object-id="${esc(o.id)}">${this._arrow(tail, tip, tone, o.label)}${handle}</g>`;
    }

    // An arrow from tail to tip, with its head drawn as a triangle so it takes the arrow's tone.
    _arrow(tail, tip, tone, label) {
      const [x1, y1] = this._toScreen(tail), [x2, y2] = this._toScreen(tip);
      const length = Math.hypot(x2 - x1, y2 - y1);
      if (length < 1) return '';
      const [ux, uy] = [(x2 - x1) / length, (y2 - y1) / length];
      const head = Math.min(ARROWHEAD.length, length * 0.6);
      const [bx, by] = [x2 - ux * head, y2 - uy * head];
      const [px, py] = [-uy * ARROWHEAD.width / 2, ux * ARROWHEAD.width / 2];
      return `
        <line class="sb-plane__shaft sb-plane--${tone}" x1="${x1}" y1="${y1}" x2="${round(bx)}" y2="${round(by)}"/>
        <polygon class="sb-plane__head sb-plane--${tone}" points="${x2},${y2} ${round(bx + px)},${round(by + py)} ${round(bx - px)},${round(by - py)}"/>
        ${this._label(label, tip, [tip[0] - tail[0], tip[1] - tail[1]], tone)}`;
    }

    // A label just beyond the tip, in the direction the arrow points.
    _label(text, at, direction, tone) {
      if (text == null || text === '') return '';
      const length = Math.hypot(...direction) || 1;
      const [x, y] = this._toScreen(at);
      const [dx, dy] = [direction[0] / length * 16, -direction[1] / length * 16];
      return `<text class="sb-plane__label sb-plane--${tone}" x="${round(x + dx)}" y="${round(y + dy + 5)}" text-anchor="middle">${esc(text)}</text>`;
    }

    _handle(o, tip) {
      const [x, y] = this._toScreen(tip);
      return `<circle class="sb-plane__handle" data-drag-id="${esc(o.id)}" cx="${x}" cy="${y}" r="${HANDLE_RADIUS}"><title>Drag ${esc(o.label ?? o.id)}</title></circle>`;
    }

    // ---- Dragging ----

    // Dragging moves an object by however far the pointer moves, so it doesn't jump to the pointer.
    // The movement is taken back through the current transformation (unless the object is fixed),
    // so the object moves in its own space. While space is squashed flat there's no way back, so
    // dragging waits.
    _startDrag(e) {
      const id = e.target.closest('[data-drag-id]')?.dataset.dragId;
      const object = this._objects.find((o) => String(o.id) === id);
      if (!object) return;
      e.preventDefault();
      this.classList.add('sb-plane--dragging');
      const start = { pointer: [e.clientX, e.clientY], x: object.x, y: object.y };
      const move = (event) => {
        const back = object.fixed ? IDENTITY : inverse(this._current);
        if (!back) return;
        const { unit } = this._view;
        const onPlane = [(event.clientX - start.pointer[0]) / unit, (start.pointer[1] - event.clientY) / unit];
        const [dx, dy] = apply(back, onPlane);
        const [x, y] = this._snap([start.x + dx, start.y + dy]);
        if (x === object.x && y === object.y) return;
        Object.assign(object, { x, y });
        this.render();
        this.dispatchEvent(new CustomEvent('sb-change', { bubbles: true, detail: { id: object.id, x, y } }));
      };
      const stop = () => {
        this.classList.remove('sb-plane--dragging');
        removeEventListener('pointermove', move);
        removeEventListener('pointerup', stop);
      };
      addEventListener('pointermove', move);
      addEventListener('pointerup', stop);
    }

    _snap([x, y]) {
      const step = Number(this.getAttribute('snap'));
      if (!step) return [round(x), round(y)];
      return [round(Math.round(x / step) * step), round(Math.round(y / step) * step)];
    }
  }

  customElements.define('sb-plane', SbPlane);
})();
