// Sandkit sb-board 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// A board to pan and zoom, holding the sandbox's own content where the agent placed it: notes,
// sources, images and diagrams, gathered so that what sits together says something.
//
//   <sb-board>
//     <article data-ref="N-1">…</article>
//     <img data-ref="IMG-2" src="…" alt="…">
//   </sb-board>
//   board.layout = {
//     frames: [{ ref: 'F-1', label: 'Evidence', x: 0, y: 0, w: 640, h: 300 }],
//     items: { 'N-1': { x: 20, y: 48, w: 240 }, 'IMG-2': { x: 290, y: 48, w: 320 } },
//     marks: [{ kind: 'arrow', from: 'N-1', to: 'IMG-2', label: 'taken here?' }]
//   };
//   board.reveal('IMG-2');
//   board.changes;   // what viewers moved, in words, when the board is `movable`
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-board';
  const existing = customElements.get('sb-board');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-board>, so only one can run. Rename one by replacing every "sb-board" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-board { display: block; }
    .sb-board__viewport { position: relative; overflow: hidden; height: var(--sb-board-height, 480px); border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background-color: var(--sb-bg, #f5f6f8); background-image: radial-gradient(color-mix(in srgb, var(--sb-text, #1f2933) 16%, transparent) 1px, transparent 1.5px); cursor: grab; touch-action: none; outline: none; }
    .sb-board__viewport:focus-visible { box-shadow: inset 0 0 0 2px var(--sb-accent, #2563eb); }
    .sb-board__viewport--dragging { cursor: grabbing; user-select: none; }
    .sb-board__space { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
    .sb-board__viewport--glide, .sb-board__viewport--glide .sb-board__space { transition: transform 0.4s ease, background-position 0.4s ease, background-size 0.4s ease; }
    @media (prefers-reduced-motion: reduce) { .sb-board__viewport--glide, .sb-board__viewport--glide .sb-board__space { transition: none; } }
    .sb-board__frame { position: absolute; box-sizing: border-box; border: 1px solid color-mix(in srgb, var(--sb-text, #1f2933) 18%, transparent); border-radius: var(--sb-radius, 8px); background: color-mix(in srgb, var(--sb-surface, #fff) 55%, transparent); }
    .sb-board__label { position: absolute; left: 12px; top: 8px; right: 12px; overflow: hidden; color: var(--sb-muted, #616e7c); font: 600 14px/1.4 var(--sb-font, system-ui, sans-serif); white-space: nowrap; text-overflow: ellipsis; }
    .sb-board { --sb-board-pen: color-mix(in srgb, var(--sb-bad, #c53030) 80%, var(--sb-text, #1f2933)); }
    .sb-board__marks { position: absolute; left: 0; top: 0; width: 1px; height: 1px; overflow: visible; pointer-events: none; }
    .sb-board__mark { color: var(--sb-board-pen); }
    .sb-board__mark[data-tone="good"] { color: var(--sb-good, #3f9142); }
    .sb-board__mark[data-tone="warn"] { color: var(--sb-warn, #d69e2e); }
    .sb-board__mark[data-tone="bad"] { color: var(--sb-bad, #c53030); }
    .sb-board__stroke { fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .sb-board__pen { fill: currentColor; font: 18px 'Bradley Hand', 'Marker Felt', 'Segoe Print', 'Comic Sans MS', cursive; paint-order: stroke; stroke: var(--sb-bg, #f5f6f8); stroke-width: 4px; stroke-linejoin: round; }
    .sb-board__item { position: absolute; box-sizing: border-box; cursor: auto; }
    .sb-board[movable] .sb-board__item { cursor: grab; }
    .sb-board__item--dragging { z-index: 1; cursor: grabbing; }
    .sb-board__tools { position: absolute; top: 8px; right: 8px; z-index: 1; display: flex; gap: 4px; }
    .sb-board__tool { min-width: 28px; height: 28px; padding: 0 8px; font: 600 13px/1 var(--sb-font, system-ui, sans-serif); color: var(--sb-text, #1f2933); background: var(--sb-surface, #fff); border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); cursor: pointer; }
    .sb-board__tool:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-board__empty { position: absolute; inset: 0; display: grid; place-items: center; padding: 16px; color: var(--sb-muted, #616e7c); font: 13px var(--sb-font, system-ui, sans-serif); text-align: center; }
    .sb-board__empty[hidden] { display: none; }`;

  const ITEM_WIDTH = 240;      // board units, for an item placed without a width
  const GAP = 24;              // between items the layout leaves unplaced, set in a row below the rest
  const MARGIN = 40;           // room around everything on the board
  const REVEAL_MARGIN = 24;    // room around an item or frame that's revealed
  const MAX_ZOOM = 2;
  const ZOOM_STEP = 1.25;      // each zoom button press or key
  const PAN_STEP = 0.15;       // each arrow key, as a share of the viewport
  const DRAG_THRESHOLD = 4;    // pixels a press moves before it pans
  const GRID = 24;             // spacing of the dots, in board units
  const NEAR = 80;             // a moved item is "beside" another within this gap, in board units

  // Pressing these inside an item uses them, rather than dragging the item.
  const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [contenteditable], [tabindex]';

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const round = (n) => Math.round(n * 10) / 10;

  // An item's box on the board. Offsets are unaffected by the zoom, so they're in board units.
  const boxOf = (el) => ({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });

  function union(boxes) {
    if (!boxes.length) return null;
    const x = Math.min(...boxes.map((b) => b.x)), y = Math.min(...boxes.map((b) => b.y));
    const right = Math.max(...boxes.map((b) => b.x + b.w)), bottom = Math.max(...boxes.map((b) => b.y + b.h));
    return { x, y, w: right - x, h: bottom - y };
  }

  const at = (point) => (point ? { x: Number(point.x), y: Number(point.y) } : null);
  const same = (a, b) => (a && b ? a.x === b.x && a.y === b.y : a === b);
  const frameBox = (f) => ({ x: Number(f.x), y: Number(f.y), w: Number(f.w), h: Number(f.h) });
  const centreOf = (box) => ({ x: box.x + box.w / 2, y: box.y + box.h / 2 });
  const contains = (box, point) => point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h;

  // The space between two boxes, 0 if they touch or overlap.
  const gap = (a, b) => Math.hypot(
    Math.max(0, Math.abs(centreOf(a).x - centreOf(b).x) - (a.w + b.w) / 2),
    Math.max(0, Math.abs(centreOf(a).y - centreOf(b).y) - (a.h + b.h) / 2)
  );

  // Each viewer's moves are kept in their browser, so they survive a reload. Storage can be refused,
  // as in a private window; moves are then kept for this visit only.
  const storage = {
    read(key) {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* kept for this visit only */ }
    }
  };

  const grow = (box, by) => ({ x: box.x - by, y: box.y - by, w: box.w + 2 * by, h: box.h + 2 * by });

  // ---- Pen marks ----
  // Marks look drawn with a marker pen, so commentary never blends with content: slightly rough,
  // and rough the same way every time for one mark, so nothing jitters as things move.

  const PEN = { wobble: 1.6, pad: 8, head: 12, letter: 9, line: 22 };
  const KINDS = ['box', 'circle', 'underline', 'label', 'arrow'];

  // A random sequence that's always the same for the same text.
  function seeded(text) {
    let h = 2166136261;
    for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => {
      h = Math.imul(h ^ (h >>> 15), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }

  const between = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const along = (a, b, n) => Array.from({ length: n }, (_, i) => between(a, b, i / n)); // a up to, not including, b
  const curveAt = (a, control, b, t) => between(between(a, control, t), between(control, b, t), t);

  // A smooth path through points, each nudged a little, as a hand would.
  function stroke(points, random) {
    const p = points.map(({ x, y }) => ({ x: x + (random() - 0.5) * 2 * PEN.wobble, y: y + (random() - 0.5) * 2 * PEN.wobble }));
    let d = `M${round(p[0].x)} ${round(p[0].y)}`;
    for (let i = 1; i < p.length - 1; i++) {
      d += ` Q${round(p[i].x)} ${round(p[i].y)} ${round((p[i].x + p[i + 1].x) / 2)} ${round((p[i].y + p[i + 1].y) / 2)}`;
    }
    return `${d} L${round(p.at(-1).x)} ${round(p.at(-1).y)}`;
  }

  // Where a line from a box's centre towards a point leaves the box, with a little room.
  function edgeToward(box, point) {
    const c = centreOf(box), dx = point.x - c.x, dy = point.y - c.y;
    const t = Math.min(dx ? (box.w / 2 + PEN.pad) / Math.abs(dx) : Infinity, dy ? (box.h / 2 + PEN.pad) / Math.abs(dy) : Infinity);
    return t >= 1 || (!box.w && !box.h) ? c : { x: c.x + dx * t, y: c.y + dy * t };
  }

  // Each kind of mark as strokes (lists of points) and where its label goes, around a box on the board.
  const SHAPES = {
    box(box) {
      const b = grow(box, PEN.pad);
      const corners = [{ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y }, { x: b.x + b.w, y: b.y + b.h }, { x: b.x, y: b.y + b.h }];
      const points = corners.flatMap((corner, i) => along(corner, corners[(i + 1) % 4], 3));
      points.push(between(corners[0], corners[1], 0.15)); // runs past where it started, as a pen does
      return { strokes: [points], label: { x: b.x, y: b.y - 10, anchor: 'start' } };
    },
    circle(box, random) {
      const c = centreOf(box), rx = box.w * 0.62 + PEN.pad, ry = box.h * 0.66 + PEN.pad;
      const start = random() * 2 * Math.PI, sweep = 2.15 * Math.PI;
      const points = Array.from({ length: 25 }, (_, i) => {
        const angle = start + (sweep * i) / 24;
        return { x: c.x + rx * Math.cos(angle), y: c.y + ry * Math.sin(angle) };
      });
      return { strokes: [points], label: { x: c.x - rx * 0.7, y: c.y - ry - 8, anchor: 'start' } };
    },
    underline(box) {
      const y = box.y + box.h + PEN.pad / 2, end = { x: box.x + box.w, y: y + 2 };
      return { strokes: [[...along({ x: box.x, y }, end, 6), end]], label: { x: box.x, y: y + PEN.line, anchor: 'start' } };
    },
    label(box) {
      const beside = box.w || box.h;
      return { strokes: [], label: { x: box.x + (beside ? box.w + 10 : 0), y: box.y + (beside ? 20 : 0), anchor: 'start' } };
    },
    // From one box to another, gently bent, with a head at the end.
    arrow(from, to, random) {
      const a = edgeToward(from, centreOf(to)), b = edgeToward(to, centreOf(from));
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const normal = { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
      const bend = (random() - 0.5) * 0.3 * length, mid = between(a, b, 0.5);
      const control = { x: mid.x + normal.x * bend, y: mid.y + normal.y * bend };
      const angle = Math.atan2(b.y - control.y, b.x - control.x);
      const barb = (turn) => [{ x: b.x - PEN.head * Math.cos(angle - turn), y: b.y - PEN.head * Math.sin(angle - turn) }, b];
      const top = curveAt(a, control, b, 0.5), side = bend < 0 ? -1 : 1;
      return {
        strokes: [Array.from({ length: 9 }, (_, i) => curveAt(a, control, b, i / 8)), barb(0.5), barb(-0.5)],
        label: { x: top.x + normal.x * 18 * side, y: top.y + normal.y * 18 * side + 6, anchor: 'middle' }
      };
    }
  };

  // Roughly where a mark sits, its label included, for fitting and revealing.
  function markBox({ strokes, label }, text) {
    const width = String(text ?? '').length * PEN.letter;
    const left = label.anchor === 'middle' ? label.x - width / 2 : label.x;
    const boxes = strokes.flat().map(({ x, y }) => ({ x, y, w: 0, h: 0 }));
    if (text) boxes.push({ x: left, y: label.y - PEN.line + 4, w: width, h: PEN.line });
    return union(boxes) ?? { x: label.x, y: label.y, w: 0, h: 0 };
  }

  function addStyle() {
    if (document.getElementById('sb-board-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-board-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // The camera is where the viewport looks: the board point at its centre (cx, cy) and the zoom z,
  // screen pixels per board unit. Until a viewer or the sandbox moves it, it keeps the whole board
  // in view, so content that grows or arrives late is never cut off.
  class SbBoard extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['empty-text'];

    constructor() {
      super();
      this._layout = { frames: [], items: {}, marks: [] };
      this._drawn = []; // the marks drawn: { ref, box }, in the order of the layer's elements
      this._moves = {}; // a viewer's moves by ref: { from, to }, from being where the layout put it
      this._camera = null;
      this._fitting = true;
      // New children are wrapped and placed as they arrive; removed ones take their wrapper with them.
      this._children = new MutationObserver((records) => {
        if (records.some((r) => r.target === this || r.target.parentElement === this._itemLayer)) this._update();
      });
      this._sizes = new ResizeObserver(() => {
        this._drawMarks();
        this._refresh(false);
      });
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('keydown', (e) => this._key(e));
      this.addEventListener('pointerdown', (e) => this._press(e));
      this.addEventListener('wheel', (e) => this._wheel(e), { passive: false });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-board');
      if (!this._viewport) this._build();
      this._children.observe(this, { childList: true, subtree: true });
      this._sizes.observe(this._viewport);
      this._update();
    }

    disconnectedCallback() {
      this._children.disconnect();
      this._sizes.disconnect();
    }

    attributeChangedCallback() {
      if (this._empty) this._empty.textContent = this.getAttribute('empty-text') || 'Nothing on the board yet.';
    }

    // ---- Public API ----

    // Where things go, in board units (pixels at full size): labelled frames, drawn behind, the
    // sandbox's items by ref, and pen marks on top, anchored to refs where they can be.
    // { frames: [{ ref, label, x, y, w, h }], items: { ref: { x, y, w } }, marks: [{ ref, kind, on, from, to, label, tone }] }
    get layout() { return structuredClone(this._layout); }
    set layout(layout) {
      this._layout = { frames: [...(layout?.frames ?? [])], items: { ...(layout?.items ?? {}) }, marks: [...(layout?.marks ?? [])] };
      this._loadMoves();
      this._drawFrames();
      this._update();
    }

    // Glides to the item, frame or mark holding `place`, or without one the frame or mark named
    // `ref` or the first item that is or holds `data-ref="ref"`, showing it whole but never larger
    // than full size. False if the board holds no such thing.
    reveal(ref, place) {
      const box = place ? this._boxHolding(place) : this._boxNamed(String(ref));
      if (!box) return false;
      this._fitting = false;
      this._place(this._fit(grow(box, REVEAL_MARGIN), 1), true);
      return true;
    }

    // What viewers have moved, in the order they first moved it: [{ ref, from, to, words }], with
    // `from` where the layout put it (null if it didn't) and `words` saying it for people and the agent.
    get changes() {
      return Object.entries(this._moves).map(([ref, { from, to }]) => ({ ref, from, to, words: this._describe(ref, from, to) }));
    }

    // Puts everything back where the layout says, forgetting the viewer's moves.
    revert() {
      this._moves = {};
      this._saveMoves();
      this._arrange();
    }

    // Glides back to the whole board, and keeps it in view as things change.
    fit() {
      this._fitting = true;
      this._refresh(true);
    }

    // The part of the board in view now, as { x, y, w, h } in board units, or null before it's shown.
    get shown() {
      if (!this._camera) return null;
      const { cx, cy, z } = this._camera, { width, height } = this._size();
      return { x: round(cx - width / (2 * z)), y: round(cy - height / (2 * z)), w: round(width / z), h: round(height / z) };
    }

    // ---- Rendering ----

    _build() {
      this.insertAdjacentHTML('beforeend', `
        <div class="sb-board__viewport" tabindex="0" role="region" aria-label="Board">
          <div class="sb-board__space">
            <div class="sb-board__frames"></div>
            <div class="sb-board__items"></div>
            <svg class="sb-board__marks"></svg>
          </div>
          <div class="sb-board__tools">
            <button type="button" class="sb-board__tool" data-tool="in" aria-label="Zoom in" title="Zoom in">+</button>
            <button type="button" class="sb-board__tool" data-tool="out" aria-label="Zoom out" title="Zoom out">−</button>
            <button type="button" class="sb-board__tool" data-tool="fit" title="Show the whole board">Fit</button>
          </div>
          <div class="sb-board__empty"></div>
        </div>`);
      this._viewport = this.querySelector(':scope > .sb-board__viewport');
      this._space = this._viewport.querySelector('.sb-board__space');
      this._frameLayer = this._space.querySelector('.sb-board__frames');
      this._itemLayer = this._space.querySelector('.sb-board__items');
      this._markLayer = this._space.querySelector('.sb-board__marks');
      this._empty = this._viewport.querySelector('.sb-board__empty');
      this.attributeChangedCallback();
      this._drawFrames();
    }

    _items() { return [...this._itemLayer.children]; }
    _frames() { return [...this._frameLayer.children]; }

    _marks() { return [...this._markLayer.children]; }

    // The first part inside an item that is or holds a ref.
    _partNamed(ref) { return [...this._itemLayer.querySelectorAll('[data-ref]')].find((el) => el.dataset.ref === ref); }

    _boxNamed(ref) {
      const frame = this._frames().find((f) => f.dataset.ref === ref);
      if (frame) return boxOf(frame);
      const mark = this._drawn.find((m) => m.ref === ref);
      if (mark) return mark.box;
      const part = this._partNamed(ref);
      return part ? boxOf(part.closest('.sb-board__item')) : null;
    }

    _boxHolding(place) {
      const mark = this._marks().findIndex((m) => m.contains(place));
      if (mark >= 0) return this._drawn[mark].box;
      const part = [...this._items(), ...this._frames()].find((p) => p.contains(place));
      return part ? boxOf(part) : null;
    }

    _drawFrames() {
      if (!this._frameLayer) return;
      this._frameLayer.innerHTML = this._layout.frames.map((f) => `
        <div class="sb-board__frame" data-ref="${esc(f.ref)}" style="left: ${Number(f.x)}px; top: ${Number(f.y)}px; width: ${Number(f.w)}px; height: ${Number(f.h)}px">
          <span class="sb-board__label">${esc(f.label ?? f.ref)}</span>
        </div>`).join('');
    }

    _update() {
      if (!this._viewport) return;
      this._adopt();
      this._arrange();
      this._refresh(false);
    }

    // Each of the sandbox's children goes into a wrapper the board owns, so placing it never
    // touches the sandbox's own element.
    _adopt() {
      for (const child of [...this.children]) {
        if (child === this._viewport) continue;
        const item = Object.assign(document.createElement('div'), { className: 'sb-board__item' });
        item.append(child);
        this._itemLayer.append(item);
        this._sizes.observe(item);
      }
      for (const item of this._items()) if (!item.firstElementChild) item.remove();
    }

    // Places each item from the layout by its ref. Items the layout leaves out go in a row below
    // everything else, so nothing goes missing.
    _arrange() {
      const unplaced = [];
      for (const item of this._items()) {
        const ref = item.firstElementChild.dataset.ref;
        const base = this._layout.items[ref], place = this._moves[ref]?.to ?? base;
        if (place) this._put(item, place.x, place.y, base?.w);
        else unplaced.push(item);
      }
      const placed = union([...this._frames(), ...this._items().filter((i) => !unplaced.includes(i))].map(boxOf));
      let x = placed ? placed.x : 0;
      const y = placed ? placed.y + placed.h + 2 * GAP : 0;
      for (const item of unplaced) {
        this._put(item, x, y);
        x += item.offsetWidth + GAP;
      }
      this._empty.hidden = this._items().length + this._frames().length > 0;
      this._drawMarks();
    }

    // ---- Marks ----

    _drawMarks() {
      if (!this._markLayer) return;
      this._drawn = [];
      let html = '';
      this._layout.marks.forEach((mark, i) => {
        const random = seeded(`${mark.ref ?? i}:${mark.kind}`);
        const shape = this._shape(mark, random);
        if (!shape) return;
        this._drawn.push({ ref: mark.ref == null ? null : String(mark.ref), box: markBox(shape, mark.label) });
        const ref = mark.ref == null ? '' : ` data-ref="${esc(mark.ref)}"`;
        const tone = mark.tone ? ` data-tone="${esc(mark.tone)}"` : '';
        const label = mark.label ? `<text class="sb-board__pen" x="${round(shape.label.x)}" y="${round(shape.label.y)}" text-anchor="${shape.label.anchor}">${esc(mark.label)}</text>` : '';
        html += `<g class="sb-board__mark sb-board__mark--${mark.kind}"${ref}${tone}>${shape.strokes.map((points) => `<path class="sb-board__stroke" d="${stroke(points, random)}"/>`).join('')}${label}</g>`;
      });
      this._markLayer.innerHTML = html;
    }

    // A mark's strokes and label, or null if it's of no known kind or what it's anchored to isn't here.
    _shape(mark, random) {
      if (!KINDS.includes(mark.kind)) return null;
      if (mark.kind === 'arrow') {
        const from = this._anchor(mark.from), to = this._anchor(mark.to);
        return from && to && SHAPES.arrow(from, to, random);
      }
      const on = this._anchor(mark.on);
      return on && SHAPES[mark.kind](on, random);
    }

    // What a mark is anchored to, as a box on the board: a frame, an item, or a part inside one, by
    // its ref; or a place given as { x, y } or { x, y, w, h }.
    _anchor(anchor) {
      if (anchor == null) return null;
      if (typeof anchor === 'object') return { x: Number(anchor.x), y: Number(anchor.y), w: Number(anchor.w ?? 0), h: Number(anchor.h ?? 0) };
      const frame = this._frames().find((f) => f.dataset.ref === String(anchor));
      if (frame) return boxOf(frame);
      const part = this._partNamed(String(anchor));
      return part ? this._partBox(part) : null;
    }

    // A part's box on the board. Inside an item it's measured on screen and scaled back to board units
    // by the item's own size, which stays right even while the board glides.
    _partBox(part) {
      const item = part.closest('.sb-board__item'), box = boxOf(item);
      if (part === item.firstElementChild) return box;
      const outer = item.getBoundingClientRect(), inner = part.getBoundingClientRect();
      const scale = item.offsetWidth / (outer.width || 1);
      return { x: box.x + (inner.left - outer.left) * scale, y: box.y + (inner.top - outer.top) * scale, w: inner.width * scale, h: inner.height * scale };
    }

    _put(item, x, y, w = ITEM_WIDTH) {
      Object.assign(item.style, { left: `${Number(x)}px`, top: `${Number(y)}px`, width: `${Number(w)}px` });
    }

    // ---- A viewer's moves ----

    get _storageKey() { return this.id ? `sb-board:${this.id}` : null; }

    _saveMoves() {
      if (this._storageKey) storage.write(this._storageKey, this._moves);
    }

    // Checks the viewer's moves against the layout. A move it now matches has been taken in by the
    // agent; one starting from where the layout no longer puts the item was overtaken by the agent
    // moving it too. Both are dropped, and the rest kept.
    _loadMoves() {
      const saved = (this._storageKey && storage.read(this._storageKey)) || this._moves;
      this._moves = {};
      for (const [ref, move] of Object.entries(saved)) {
        const base = at(this._layout.items[ref]), from = at(move?.from), to = at(move?.to);
        if (to && !same(to, base) && same(from, base)) this._moves[ref] = { from, to };
      }
      this._saveMoves();
    }

    // A viewer dropped an item. Dropping it back where the layout put it is no move at all.
    _moved(ref, to) {
      const base = at(this._layout.items[ref]);
      if (same(to, base)) delete this._moves[ref];
      else this._moves[ref] = { from: base, to };
      this._saveMoves();
      this._arrange();
      this.dispatchEvent(new CustomEvent('sb-moves', { bubbles: true, detail: { changes: this.changes } }));
    }

    // A move in words: which frame it left and entered, and what it now sits beside.
    // "Moved SRC-3 from Readings into Accounts, beside SRC-4."
    _describe(ref, from, to) {
      const item = this._itemNamed(ref);
      const size = { w: item?.offsetWidth ?? 0, h: item?.offsetHeight ?? 0 };
      const before = from && this._frameAround(centreOf({ ...from, ...size }));
      const after = this._frameAround(centreOf({ ...to, ...size }));
      const name = (frame) => frame.label ?? frame.ref;
      let where = '';
      if (before !== after) where = after ? `${before ? ` from ${name(before)}` : ''} into ${name(after)}` : ` out of ${name(before)}`;
      else if (after) where = ` within ${name(after)}`;
      const beside = item && this._nearest(item, { ...to, ...size });
      return `Moved ${ref}${where}${beside ? `, beside ${beside}` : ''}.`;
    }

    _itemNamed(ref) { return this._items().find((i) => i.firstElementChild.dataset.ref === ref); }

    // The smallest frame around a point, so a frame inside another is the one named.
    _frameAround(point) {
      const around = this._layout.frames.filter((f) => contains(frameBox(f), point));
      return around.sort((a, b) => a.w * a.h - b.w * b.h)[0] ?? null;
    }

    // The ref of the item closest to a box, if it's near enough to be beside it.
    _nearest(item, box) {
      const others = this._items().filter((i) => i !== item && i.firstElementChild.dataset.ref);
      const closest = others.map((i) => ({ ref: i.firstElementChild.dataset.ref, gap: gap(box, boxOf(i)) })).sort((a, b) => a.gap - b.gap)[0];
      return closest && closest.gap <= NEAR ? closest.ref : null;
    }

    // ---- The camera ----

    _size() { return { width: this._viewport.clientWidth, height: this._viewport.clientHeight }; }

    // Everything on the board, with room around it.
    _bounds() {
      const all = union([...[...this._frames(), ...this._items()].map(boxOf), ...this._drawn.map((m) => m.box)]);
      return all ? grow(all, MARGIN) : { x: 0, y: 0, w: 0, h: 0 };
    }

    // The camera showing a box whole, zoomed in no further than `most`.
    _fit(box, most = MAX_ZOOM) {
      const { width, height } = this._size();
      const z = Math.min(most, width / (box.w || 1), height / (box.h || 1));
      return { cx: box.x + box.w / 2, cy: box.y + box.h / 2, z };
    }

    // Fits the whole board while fitting; otherwise keeps the camera where it is.
    _refresh(glide) {
      if (this._fitting) this._place(this._fit(this._bounds(), 1), glide);
      else if (this._camera) this._place(this._camera, glide);
    }

    // Moves the camera, gliding when the sandbox or a button moves it, following at once when the
    // viewer drags or scrolls. Viewers can pan anywhere, and zoom out until the whole board fits.
    _place({ cx, cy, z }, glide) {
      const { width, height } = this._size();
      if (!width || !height) return; // hidden, as in a closed tab: placed once it's shown
      const zoom = clamp(z, Math.min(1, this._fit(this._bounds()).z), MAX_ZOOM);
      this._camera = { cx, cy, z: zoom };
      const tx = width / 2 - cx * zoom, ty = height / 2 - cy * zoom;
      this._viewport.classList.toggle('sb-board__viewport--glide', glide);
      this._space.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
      Object.assign(this._viewport.style, { backgroundSize: `${GRID * zoom}px ${GRID * zoom}px`, backgroundPosition: `${tx}px ${ty}px` });
    }

    // Zooms by a factor, keeping the board point under (x, y) in the viewport still; the centre by default.
    _zoomBy(factor, glide, at = null) {
      if (!this._camera) return;
      const { cx, cy, z } = this._camera, { width, height } = this._size();
      const zoom = clamp(z * factor, Math.min(1, this._fit(this._bounds()).z), MAX_ZOOM);
      const dx = at ? at.x - width / 2 : 0, dy = at ? at.y - height / 2 : 0;
      this._fitting = false;
      this._place({ cx: cx + dx / z - dx / zoom, cy: cy + dy / z - dy / zoom, z: zoom }, glide);
    }

    // Moves the view by a distance in screen pixels, as if dragging the board the other way.
    _panBy(dx, dy, glide) {
      if (!this._camera) return;
      const { cx, cy, z } = this._camera;
      this._fitting = false;
      this._place({ cx: cx - dx / z, cy: cy - dy / z, z }, glide);
    }

    // ---- Interaction ----

    _click(e) {
      const tool = e.target.closest('.sb-board__tool');
      if (!tool) return;
      if (tool.dataset.tool === 'in') this._zoomBy(ZOOM_STEP, true);
      if (tool.dataset.tool === 'out') this._zoomBy(1 / ZOOM_STEP, true);
      if (tool.dataset.tool === 'fit') this.fit();
    }

    // Dragging the background pans. On a movable board, dragging an item moves it, unless the press
    // was on something inside it to use, such as a button or a field.
    _press(e) {
      if (e.button !== 0 || !this._camera || e.target.closest('.sb-board__tools')) return;
      if (!e.target.closest('.sb-board__viewport')) return;
      const item = e.target.closest('.sb-board__item');
      if (!item) return this._pan(e);
      const used = e.target.closest(INTERACTIVE);
      if (this.hasAttribute('movable') && item.firstElementChild.dataset.ref && !(used && item.contains(used))) this._drag(e, item);
    }

    _pan(e) {
      const { cx, cy, z } = this._camera;
      this._follow(e, (dx, dy) => {
        this._fitting = false;
        this._place({ cx: cx - dx / z, cy: cy - dy / z, z }, false);
      });
    }

    _drag(e, item) {
      const ref = item.firstElementChild.dataset.ref, z = this._camera.z;
      const origin = { x: item.offsetLeft, y: item.offsetTop };
      let to = origin;
      this._follow(e, (dx, dy) => {
        this._fitting = false;
        item.classList.add('sb-board__item--dragging');
        getSelection()?.removeAllRanges();
        to = { x: Math.round(origin.x + dx / z), y: Math.round(origin.y + dy / z) };
        Object.assign(item.style, { left: `${to.x}px`, top: `${to.y}px` });
        this._drawMarks(); // so marks anchored to it follow
      }, () => {
        item.classList.remove('sb-board__item--dragging');
        this._swallowClick();
        this._moved(ref, to);
      });
    }

    // Follows a press once it has moved past the threshold, calling `step` with how far the pointer
    // has gone since the press, in screen pixels, and `done` when it's let go.
    _follow(e, step, done = () => {}) {
      const start = { x: e.clientX, y: e.clientY };
      let moving = false;
      const move = (m) => {
        const dx = m.clientX - start.x, dy = m.clientY - start.y;
        if (!moving && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        moving = true;
        this._viewport.classList.add('sb-board__viewport--dragging');
        step(dx, dy);
      };
      const stop = () => {
        removeEventListener('pointermove', move);
        removeEventListener('pointerup', stop);
        this._viewport.classList.remove('sb-board__viewport--dragging');
        if (moving) done();
      };
      addEventListener('pointermove', move);
      addEventListener('pointerup', stop);
    }

    // The click that ends a drag isn't a click on what was dragged.
    _swallowClick() {
      const swallow = (c) => { c.stopPropagation(); c.preventDefault(); };
      this.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => this.removeEventListener('click', swallow, { capture: true }));
    }

    // Zooming needs Ctrl or ⌘ (a trackpad pinch sends it), so scrolling the page past the board
    // still scrolls the page.
    _wheel(e) {
      if (!this._camera || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const box = this._viewport.getBoundingClientRect();
      this._zoomBy(Math.exp(-e.deltaY / 200), false, { x: e.clientX - box.left, y: e.clientY - box.top });
    }

    _key(e) {
      if (e.target !== this._viewport) return;
      const { width, height } = this._size();
      const actions = {
        '+': () => this._zoomBy(ZOOM_STEP, true),
        '=': () => this._zoomBy(ZOOM_STEP, true),
        '-': () => this._zoomBy(1 / ZOOM_STEP, true),
        '0': () => this.fit(),
        ArrowLeft: () => this._panBy(width * PAN_STEP, 0, true),
        ArrowRight: () => this._panBy(-width * PAN_STEP, 0, true),
        ArrowUp: () => this._panBy(0, height * PAN_STEP, true),
        ArrowDown: () => this._panBy(0, -height * PAN_STEP, true)
      };
      if (!actions[e.key]) return;
      e.preventDefault();
      actions[e.key]();
    }
  }

  customElements.define('sb-board', SbBoard);
})();
