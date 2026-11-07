// Sandkit sb-board 0.2.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A board that lays itself out, for gathering what belongs together around one question. The agent
// says roughly where each thing goes; the board measures, aligns, frames groups and draws links.
//
//   <sb-board>
//     <article data-ref="SRC-4">…</article>
//     <figure data-ref="IMG-1">…</figure>
//   </sb-board>
//   board.layout = {
//     groups: [{ label: 'Accounts', x: 10, y: 10, items: ['SRC-4'] }],
//     items: [{ ref: 'IMG-1', x: 60, y: 10, size: 'large' }],
//     links: [{ from: 'SRC-4', to: 'IMG-1', label: 'which is right?' }]
//   };
//   board.problems;   // anything in the layout that didn't work, in words
//   board.placed;     // where everything ended up
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

  const DOT = 10;              // a tag's coloured dot, above an item that carries it
  const DOT_GAP = 3;
  const SCROLL_ROOM = 50000;   // pixels the board can be scrolled each way, for whatever asks to go to a part
  const SCROLL_SETTLED = 120;  // milliseconds after the last scroll that it's over

  const CSS = `
    .sb-board { display: block; }
    .sb-board__viewport { position: relative; overflow: hidden; height: var(--sb-board-height, 480px); border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-bg, #f5f6f8); cursor: grab; touch-action: none; outline: none; }
    .sb-board__viewport:focus-visible { box-shadow: inset 0 0 0 2px var(--sb-accent, #2563eb); }
    .sb-board__viewport--dragging { cursor: grabbing; user-select: none; }
    .sb-board[fullscreen] .sb-board__viewport { position: fixed; inset: 0; z-index: 1000; height: auto; border: 0; border-radius: 0; }
    .sb-board__scroller { position: absolute; inset: 0; overflow: hidden; }
    .sb-board__room { position: absolute; left: 0; top: 0; width: ${2 * SCROLL_ROOM}px; height: ${2 * SCROLL_ROOM}px; pointer-events: none; }
    .sb-board__space { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
    .sb-board__viewport--glide .sb-board__space { transition: transform 0.4s ease; }
    .sb-board__frame { position: absolute; box-sizing: border-box; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: color-mix(in srgb, var(--sb-surface, #fff) 55%, transparent); }
    .sb-board__label { position: absolute; left: 14px; top: 8px; right: 14px; overflow: hidden; color: var(--sb-muted, #616e7c); font: 600 13px/1.4 var(--sb-font, system-ui, sans-serif); white-space: nowrap; text-overflow: ellipsis; }
    .sb-board__links { position: absolute; left: 0; top: 0; width: 1px; height: 1px; overflow: visible; pointer-events: none; }
    .sb-board__link { color: var(--sb-muted, #616e7c); }
    .sb-board__link[data-tone="accent"] { color: var(--sb-accent, #2563eb); }
    .sb-board__link[data-tone="good"] { color: var(--sb-good, #3f9142); }
    .sb-board__link[data-tone="warn"] { color: var(--sb-warn, #d69e2e); }
    .sb-board__link[data-tone="bad"] { color: var(--sb-bad, #c53030); }
    .sb-board__line { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .sb-board__head { fill: currentColor; }
    .sb-board__words { fill: currentColor; font: 12px var(--sb-font, system-ui, sans-serif); text-anchor: middle; dominant-baseline: central; paint-order: stroke; stroke: var(--sb-bg, #f5f6f8); stroke-width: 4px; stroke-linejoin: round; }
    .sb-board__item { position: absolute; box-sizing: border-box; cursor: auto; isolation: isolate; }
    .sb-board__veil { position: absolute; left: 0; top: 0; z-index: 2; width: 1px; height: 1px; overflow: visible; pointer-events: none; fill: var(--sb-board-veil, rgb(0 0 0 / 0.6)); fill-rule: evenodd; opacity: 0; transition: opacity 0.2s ease; }
    .sb-board__veil--on { opacity: 1; }
    .sb-board__dots { position: absolute; left: 0; top: 0; z-index: 3; width: 1px; height: 1px; pointer-events: none; }
    .sb-board__dot-row { position: absolute; display: flex; gap: ${DOT_GAP}px; }
    .sb-board__dot { box-sizing: border-box; width: ${DOT}px; height: ${DOT}px; border-radius: 50%; background: var(--sb-board-tag, var(--sb-accent, #2563eb)); pointer-events: auto; cursor: help; }
    .sb-board__space--settled .sb-board__item { transition: left 0.2s ease, top 0.2s ease; }
    .sb-board__space--settled .sb-board__frame { transition: left 0.2s ease, top 0.2s ease, width 0.2s ease, height 0.2s ease; }
    @media (prefers-reduced-motion: reduce) { .sb-board__veil, .sb-board__viewport--glide .sb-board__space, .sb-board__space--settled .sb-board__item, .sb-board__space--settled .sb-board__frame { transition: none; } }
    .sb-board__tools { position: absolute; top: 8px; right: 8px; z-index: 1; display: flex; gap: 4px; }
    .sb-board__tool { min-width: 28px; height: 28px; padding: 0 8px; font: 600 13px/1 var(--sb-font, system-ui, sans-serif); color: var(--sb-text, #1f2933); background: var(--sb-surface, #fff); border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); cursor: pointer; }
    .sb-board__tool:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-board__empty { position: absolute; inset: 0; display: grid; place-items: center; padding: 16px; color: var(--sb-muted, #616e7c); font: 13px var(--sb-font, system-ui, sans-serif); text-align: center; }
    .sb-board__empty[hidden] { display: none; }`;

  const WIDTHS = { small: 200, medium: 280, large: 440, wide: 640 };
  const NEAR = 10;             // rough positions this close share a column or a row
  const ITEM_GAP = 20;         // between items in a group
  const GROUP_PADDING = 14;
  const GROUP_LABEL = 42;      // room for a group's label above its items, and any dots between
  const COLUMN_GAP = 56;       // between columns on the board, more when a link's words need it
  const ROW_GAP = 48;
  const MOST_COLUMN_GAP = 220;
  const LETTER = 6.5;          // the rough width of a letter in a link's words
  const MARGIN = 40;           // room around everything on the board
  const REVEAL_MARGIN = 24;
  const MAX_ZOOM = 2;
  const ZOOM_STEP = 1.25;
  const PAN_STEP = 0.15;       // each arrow key, as a share of the viewport
  const DRAG_THRESHOLD = 4;    // pixels a press moves before it pans

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  // What the layout places, as one list. A group's items stack in order around the group's place.
  function placements({ groups, items }) {
    const STEP = 2 * NEAR;
    const fromGroups = groups.flatMap(({ label, x, y, items: members }) => listOf(members).map((member, i, all) => ({
      group: label, x, y: y + (i - (all.length - 1) / 2) * STEP,
      ...(typeof member === 'string' ? { ref: member } : member)
    })));
    return [...fromGroups, ...items];
  }

  const listOf = (value) => (Array.isArray(value) ? [...value] : []);
  const isNumber = (n) => typeof n === 'number' && Number.isFinite(n);
  const mean = (values) => values.reduce((sum, n) => sum + n, 0) / values.length;
  const grow = (box, by) => ({ x: box.x - by, y: box.y - by, w: box.w + 2 * by, h: box.h + 2 * by });
  const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  function union(boxes) {
    if (!boxes.length) return null;
    const x = Math.min(...boxes.map((b) => b.x)), y = Math.min(...boxes.map((b) => b.y));
    return { x, y, w: Math.max(...boxes.map((b) => b.x + b.w)) - x, h: Math.max(...boxes.map((b) => b.y + b.h)) - y };
  }

  // ---- Laying out ----
  // Widths come only from the layout and heights only from content, so what's measured can never
  // change what was measured: a change of size settles in one pass, and x positions never move.
  // A "box" here is an item or a group: rough { nearX, nearY }, then exact sizes and offsets.

  // Which band each rough position falls in: anything within NEAR of a band's first value joins it.
  function bandsOf(values) {
    const bands = new Map();
    let band = -1, start = -Infinity;
    for (const value of [...new Set(values)].sort((a, b) => a - b)) {
      if (value - start > NEAR) { band++; start = value; }
      bands.set(value, band);
    }
    return bands;
  }

  // Lines boxes up in columns, each as wide as its widest. Returns the width of them all.
  function placeColumns(boxes, gap, fill) {
    const columns = bandsOf(boxes.map((b) => b.nearX)), widths = [];
    for (const b of boxes) {
      b.column = columns.get(b.nearX);
      widths[b.column] = Math.max(widths[b.column] ?? 0, b.w);
    }
    const lefts = [];
    widths.reduce((left, width, i) => { lefts[i] = left; return left + width + gap; }, 0);
    for (const b of boxes) {
      b.left = lefts[b.column];
      if (fill) b.w = widths[b.column];
    }
    return widths.length ? lefts.at(-1) + widths.at(-1) : 0;
  }

  // Stacks boxes in rows. A row starts below whatever is above it in the columns it uses, so a tall
  // box only pushes down what's under it, and rows sharing columns stay aligned. It never starts
  // level with or above the row before, so what's further up stays further up. Boxes at one spot
  // stack in the order they're given. Returns the height of them all.
  function placeRows(boxes, gap) {
    const rows = bandsOf(boxes.map((b) => b.nearY));
    const inOrder = [...boxes].sort((a, b) => rows.get(a.nearY) - rows.get(b.nearY) || a.nearY - b.nearY || a.nearX - b.nearX);
    const bottoms = [];
    let height = 0, earliest = 0;
    for (let i = 0; i < inOrder.length;) {
      const row = rows.get(inOrder[i].nearY);
      let end = i;
      while (end < inOrder.length && rows.get(inOrder[end].nearY) === row) end++;
      const members = inOrder.slice(i, end);
      const top = Math.max(earliest, ...members.map((b) => bottoms[b.column] ?? 0));
      earliest = top + gap;
      for (const c of new Set(members.map((b) => b.column))) bottoms[c] = top;
      for (const b of members) {
        b.top = bottoms[b.column];
        bottoms[b.column] += b.h + gap;
        height = Math.max(height, b.top + b.h);
      }
      i = end;
    }
    return height;
  }

  // ---- Routing ----
  // A link is the cheapest square path across a sparse grid of tracks running clear of every item.
  // Bends cost extra, so paths stay simple, and running along another link costs extra, so links
  // keep apart. Nothing is random and ties go the same way, so a link always takes the same path.

  const TRACK = 9;            // from an item's edge to the first track beside it
  const BEND = 30;
  const SHARED = 4;           // how many times over a stretch costs when another link runs along it
  const OFF_CENTRE = 6;       // a link would rather meet the middle of a side
  const PORT_TAKEN = 80;      // and a point no other link uses
  const FRACTIONS = [0.5, 0.25, 0.75];

  // The points a link can meet a box at: each with its stub, the first point clear of the box.
  function portsOf(box) {
    const ports = [];
    const add = (x, y, dx, dy, fraction) => ports.push({ x, y, stubX: x + dx * TRACK, stubY: y + dy * TRACK, axis: dx ? 0 : 1, cost: fraction === 0.5 ? 0 : OFF_CENTRE });
    for (const f of FRACTIONS) {
      add(box.x, box.y + box.h * f, -1, 0, f);
      add(box.x + box.w, box.y + box.h * f, 1, 0, f);
      add(box.x + box.w * f, box.y, 0, -1, f);
      add(box.x + box.w * f, box.y + box.h, 0, 1, f);
    }
    return ports;
  }

  const costOfPort = (p, taken) => p.cost + (taken.ports.has(`${p.x},${p.y}`) ? PORT_TAKEN : 0);

  const sortedUnique = (values) => [...new Set(values)].sort((a, b) => a - b);

  function tracksAround(boxes, ports) {
    const xs = [], ys = [];
    for (const b of boxes) {
      xs.push(b.x - TRACK, b.x - 2 * TRACK, b.x + b.w + TRACK, b.x + b.w + 2 * TRACK);
      ys.push(b.y - TRACK, b.y - 2 * TRACK, b.y + b.h + TRACK, b.y + b.h + 2 * TRACK);
    }
    for (const p of ports) { xs.push(p.stubX); ys.push(p.stubY); }
    return { xs: sortedUnique(xs), ys: sortedUnique(ys) };
  }

  // The smallest first: a plain binary heap of [cost, state].
  function heap() {
    const items = [];
    const swap = (a, b) => { [items[a], items[b]] = [items[b], items[a]]; };
    return {
      get size() { return items.length; },
      push(entry) {
        items.push(entry);
        for (let i = items.length - 1, up; i > 0 && items[up = (i - 1) >> 1][0] > items[i][0]; i = up) swap(i, up);
      },
      pop() {
        const top = items[0], last = items.pop();
        if (items.length) {
          items[0] = last;
          for (let i = 0; ;) {
            const left = 2 * i + 1, right = left + 1;
            let least = i;
            if (left < items.length && items[left][0] < items[least][0]) least = left;
            if (right < items.length && items[right][0] < items[least][0]) least = right;
            if (least === i) break;
            swap(i, least);
            i = least;
          }
        }
        return top;
      }
    };
  }

  // The cheapest path from one box to another, as points, or null if there's no way through.
  // `taken` holds what earlier links used: their stretches, and the points they meet boxes at.
  function route(from, to, boxes, taken) {
    const starts = portsOf(from), ends = portsOf(to);
    const { xs, ys } = tracksAround(boxes, [...starts, ...ends]);
    const clear = boxes.map((b) => grow(b, TRACK - 1));
    const nx = xs.length, ny = ys.length;
    const stateOf = (i, j, axis) => (i + j * nx) * 2 + axis;
    const costs = new Float64Array(nx * ny * 2).fill(Infinity);
    const previous = new Int32Array(nx * ny * 2).fill(-1);
    const portCost = (p) => costOfPort(p, taken);
    const stateAt = (p, axis) => stateOf(xs.indexOf(p.stubX), ys.indexOf(p.stubY), axis);

    const queue = heap();
    const open = (state, cost, before) => {
      if (cost >= costs[state]) return;
      costs[state] = cost;
      previous[state] = before;
      queue.push([cost, state]);
    };
    const startPorts = new Map();
    for (const p of starts) {
      if (clear.some((b) => b.x < p.stubX && p.stubX < b.x + b.w && b.y < p.stubY && p.stubY < b.y + b.h)) continue;
      const state = stateAt(p, p.axis);
      if (portCost(p) < costs[state]) startPorts.set(state, p);
      open(state, portCost(p), -1);
    }

    const blocked = (a, b) => {
      const box = { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) };
      return clear.some((c) => box.x < c.x + c.w && c.x < box.x + box.w && box.y < c.y + c.h && c.y < box.y + box.h);
    };
    const sharedCost = (a, b, axis) => {
      const at = axis ? a.x : a.y, low = axis ? Math.min(a.y, b.y) : Math.min(a.x, b.x), high = axis ? Math.max(a.y, b.y) : Math.max(a.x, b.x);
      return taken.stretches.some((s) => s.axis === axis && Math.abs(s.at - at) < 3 && s.low < high && low < s.high) ? (high - low) * SHARED : 0;
    };

    while (queue.size) {
      const [cost, state] = queue.pop();
      if (cost > costs[state]) continue;
      const axis = state % 2, node = (state - axis) / 2, i = node % nx, j = (node - i) / nx;
      open(stateOf(i, j, axis ? 0 : 1), cost + BEND, state);
      for (const step of [-1, 1]) {
        const ni = axis ? i : i + step, nj = axis ? j + step : j;
        if (ni < 0 || nj < 0 || ni >= nx || nj >= ny) continue;
        const a = { x: xs[i], y: ys[j] }, b = { x: xs[ni], y: ys[nj] };
        if (!blocked(a, b)) open(stateOf(ni, nj, axis), cost + Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + sharedCost(a, b, axis), state);
      }
    }

    let best = null;
    for (const p of ends) {
      for (const axis of [0, 1]) {
        const cost = costs[stateAt(p, axis)] + portCost(p) + (axis === p.axis ? 0 : BEND);
        if (cost < (best?.cost ?? Infinity)) best = { cost, port: p, state: stateAt(p, axis) };
      }
    }
    if (!best) return null;

    const points = [{ x: best.port.x, y: best.port.y }];
    let state = best.state, first = state;
    for (; state !== -1; state = previous[state]) {
      const node = (state - state % 2) / 2, i = node % nx, j = (node - i) / nx;
      points.push({ x: xs[i], y: ys[j] });
      first = state;
    }
    const start = startPorts.get(first);
    points.push({ x: start.x, y: start.y });
    taken.ports.add(`${start.x},${start.y}`).add(`${best.port.x},${best.port.y}`);
    return straighten(points.reverse());
  }

  // Leaves out repeated points, then points in the middle of a straight stretch.
  function straighten(points) {
    const distinct = points.filter((p, i) => !i || p.x !== points[i - 1].x || p.y !== points[i - 1].y);
    return distinct.filter((p, i) => {
      const a = distinct[i - 1], b = distinct[i + 1];
      return !a || !b || !((a.x === p.x && p.x === b.x) || (a.y === p.y && p.y === b.y));
    });
  }

  const stretchesOf = (points) => points.slice(1).map((b, i) => {
    const a = points[i], axis = a.x === b.x ? 1 : 0;
    return { axis, at: axis ? a.x : a.y, low: axis ? Math.min(a.y, b.y) : Math.min(a.x, b.x), high: axis ? Math.max(a.y, b.y) : Math.max(a.x, b.x) };
  });

  // Words go at the first of a line's spots clear of items and other words, or else the first.
  function wordsPlace(spots, text, boxes, labels) {
    const w = text.length * LETTER, h = 18;
    const placed = spots.map(({ x, y }) => ({ x, y, box: { x: x - w / 2, y: y - h / 2, w, h } }));
    return placed.find(({ box }) => ![...boxes, ...labels].some((other) => overlap(box, other))) ?? placed[0];
  }

  const WORD_SPOTS = [0.5, 0.3, 0.7, 0.15, 0.85];
  const between = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

  // A square path with rounded corners.
  function pathOf(points) {
    const RADIUS = 6;
    let d = `M${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i], a = points[i - 1], b = points[i + 1];
      const r = Math.min(RADIUS, Math.hypot(p.x - a.x, p.y - a.y) / 2, Math.hypot(b.x - p.x, b.y - p.y) / 2);
      const toward = (q) => { const length = Math.hypot(q.x - p.x, q.y - p.y) || 1; return { x: p.x + (q.x - p.x) / length * r, y: p.y + (q.y - p.y) / length * r }; };
      const inn = toward(a), out = toward(b);
      d += ` L${inn.x} ${inn.y} Q${p.x} ${p.y} ${out.x} ${out.y}`;
    }
    return `${d} L${points.at(-1).x} ${points.at(-1).y}`;
  }

  function headOf(points) {
    const SIZE = 7, tip = points.at(-1), before = points.at(-2);
    const length = Math.hypot(tip.x - before.x, tip.y - before.y) || 1;
    const dx = (tip.x - before.x) / length, dy = (tip.y - before.y) / length;
    const base = { x: tip.x - dx * SIZE, y: tip.y - dy * SIZE };
    return `M${tip.x} ${tip.y} L${base.x - dy * SIZE / 2} ${base.y + dx * SIZE / 2} L${base.x + dy * SIZE / 2} ${base.y - dx * SIZE / 2}Z`;
  }

  // The two points where a direct line meets its boxes: the closest sides, a little apart from
  // where any other link meets them.
  function facingEnds(from, to, taken) {
    let best = null;
    for (const a of portsOf(from)) {
      for (const b of portsOf(to)) {
        const cost = Math.hypot(b.x - a.x, b.y - a.y) + costOfPort(a, taken) + costOfPort(b, taken);
        if (!best || cost < best.cost) best = { cost, a, b };
      }
    }
    taken.ports.add(`${best.a.x},${best.a.y}`).add(`${best.b.x},${best.b.y}`);
    return best;
  }

  // Each style of line: the points it runs through, its path, and the spots its words may go.
  // A curve's points are its start, two controls and end; it leaves and arrives square to each side.
  const CURVE_REACH = 0.4, LEAST_REACH = 24, MOST_REACH = 140;
  const LINE_STYLES = {
    curved: {
      points(from, to, boxes, taken) {
        const { a, b } = facingEnds(from, to, taken);
        const reach = clamp(Math.hypot(b.x - a.x, b.y - a.y) * CURVE_REACH, LEAST_REACH, MOST_REACH) / TRACK;
        const control = (p) => ({ x: p.x + (p.stubX - p.x) * reach, y: p.y + (p.stubY - p.y) * reach });
        return [{ x: a.x, y: a.y }, control(a), control(b), { x: b.x, y: b.y }];
      },
      path: ([a, c, d, b]) => `M${a.x} ${a.y} C${c.x} ${c.y} ${d.x} ${d.y} ${b.x} ${b.y}`,
      spots: ([a, c, d, b]) => WORD_SPOTS.map((t) => {
        const ac = between(a, c, t), cd = between(c, d, t), db = between(d, b, t);
        return between(between(ac, cd, t), between(cd, db, t), t);
      })
    },
    straight: {
      points(from, to, boxes, taken) {
        const { a, b } = facingEnds(from, to, taken);
        return [{ x: a.x, y: a.y }, { x: b.x, y: b.y }];
      },
      path: ([a, b]) => `M${a.x} ${a.y} L${b.x} ${b.y}`,
      spots: ([a, b]) => WORD_SPOTS.map((t) => between(a, b, t))
    },
    square: {
      points(from, to, boxes, taken) {
        const points = route(from, to, boxes, taken);
        if (points) taken.stretches.push(...stretchesOf(points));
        return points;
      },
      path: pathOf,
      spots(points) {
        const stretches = points.slice(1).map((b, i) => [points[i], b]);
        const longestFirst = stretches.sort(([a, b], [c, d]) => Math.hypot(d.x - c.x, d.y - c.y) - Math.hypot(b.x - a.x, b.y - a.y));
        return longestFirst.flatMap(([a, b]) => WORD_SPOTS.map((t) => between(a, b, t)));
      }
    }
  };
  const LINE_NAMES = Object.keys(LINE_STYLES);

  // ---- The veil ----
  // While tags are chosen, everything else on a board sits behind a dark veil with holes for what
  // carries them, and an item carrying any has a coloured dot for each above it. Heard once, here,
  // so a board made after the choice was announced still knows it.

  const VEIL_REACH = 100000;   // board units the veil covers each way, past wherever a viewer can pan
  const HOLE_CORNER = 6;
  const boards = new Set();
  let chosenTags = null;       // { tags, match, colors, without } while any are chosen

  document.addEventListener('sb-tag-focus', (e) => {
    const { tags, match, colors, without } = e.detail ?? {};
    const adding = Array.isArray(tags) ? tags : [], leavingOut = Array.isArray(without) ? without : [];
    chosenTags = adding.length || leavingOut.length ? { tags: adding, match, colors: colors ?? {}, without: leavingOut } : null;
    for (const board of boards) board._drawVeil();
  });

  const tagsOn = (el) => (el.dataset.tags ?? '').split(/\s+/);
  const carriesTag = (el, tag) => tagsOn(el).includes(String(tag));
  const carriesChosen = (el) => {
    if (chosenTags.without.some((tag) => carriesTag(el, tag))) return false;
    if (!chosenTags.tags.length) return Boolean(el.dataset.tags?.trim()); // only taking away: from everything tagged
    return chosenTags.match === 'any' ? chosenTags.tags.some((tag) => carriesTag(el, tag)) : chosenTags.tags.every((tag) => carriesTag(el, tag));
  };
  const outermost = (parts) => parts.filter((el) => !parts.some((other) => other !== el && other.contains(el)));

  const holePath = ({ x, y, w, h }) => {
    const r = Math.min(HOLE_CORNER, w / 2, h / 2);
    return `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y}Z`;
  };

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
    static observedAttributes = ['empty-text', 'lines'];

    constructor() {
      super();
      this._layout = { groups: [], items: [], links: [] };
      this._placed = { items: {}, groups: {}, links: [] };
      this._measured = '';  // the sizes last laid out, to tell a real change of size from a repeat
      this._camera = null;
      this._fitting = true;
      this._children = new MutationObserver((records) => {
        if (records.some((r) => r.target === this || r.target.parentElement === this._itemLayer)) this._adopt();
        if (records.some((r) => this._itemLayer?.contains(r.target))) this._drawVeil(); // an item may have been redrawn
      });
      this._itemSizes = new ResizeObserver(() => this._settle());
      this._viewSize = new ResizeObserver(() => this._refresh(false));
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('keydown', (e) => this._key(e));
      this.addEventListener('pointerdown', (e) => this._press(e));
      this.addEventListener('wheel', (e) => this._wheel(e), { passive: false });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-board');
      this.dataset.sbShowsChosen = ''; // the highlighting script leaves chosen tags in here to the board
      if (!this._viewport) this._build();
      boards.add(this);
      this._children.observe(this, { childList: true, subtree: true });
      this._viewSize.observe(this._viewport);
      for (const item of this._items()) this._itemSizes.observe(item);
      this._adopt();
    }

    disconnectedCallback() {
      boards.delete(this);
      this._children.disconnect();
      this._itemSizes.disconnect();
      this._viewSize.disconnect();
    }

    attributeChangedCallback(name) {
      if (name === 'lines') return this.arrange();
      if (this._empty) this._empty.textContent = this.getAttribute('empty-text') || 'Nothing on the board yet.';
    }

    // ---- Public API ----

    // What's on the board and roughly where, with x and y from 0 to 100, left to right and top to bottom:
    // { groups: [{ label, x, y, items: [ref | { ref, size }] }], items: [{ ref, x, y, group?, size? }], links: [{ from, to, label?, tone? }] }
    get layout() { return structuredClone(this._layout); }
    set layout(layout) {
      this._layout = { groups: listOf(layout?.groups), items: listOf(layout?.items), links: listOf(layout?.links) };
      this._laidOut = true;
      this._space?.classList.remove('sb-board__space--settled'); // a new layout lands at once
      if (this._viewport) { this._adopt(); this.arrange(); }
    }

    // Where everything ended up, in board units (pixels at full size).
    get placed() { return structuredClone(this._placed); }

    // Anything in the layout that didn't work, in words for the agent. Empty when all is well.
    get problems() {
      const problems = [];
      const wanted = new Map();
      for (const entry of placements(this._layout)) {
        const ref = String(entry.ref);
        if (wanted.has(ref)) problems.push(`${ref} is in the layout twice; the first counts.`);
        else wanted.set(ref, entry);
        if (!this._itemNamed(ref)) problems.push(`${ref} is in the layout but not on the board.`);
        else if (!isNumber(entry.x) || !isNumber(entry.y)) problems.push(`${ref} has no x and y, so it's under "Not placed yet".`);
        if (entry.size != null && !WIDTHS[entry.size]) problems.push(`${ref} has size "${entry.size}"; the sizes are ${Object.keys(WIDTHS).join(', ')}.`);
      }
      for (const item of this._items()) {
        const ref = this._refOf(item);
        if (!ref) problems.push('Something on the board has no data-ref, so it\'s under "Not placed yet".');
        else if (!wanted.has(ref)) problems.push(`${ref} is on the board but not in the layout, so it's under "Not placed yet".`);
        if (ref && item.firstElementChild.scrollWidth > item.clientWidth + 1) problems.push(`${ref} is wider than its place; try a larger size.`);
      }
      const style = this.getAttribute('lines');
      if (style != null && !LINE_NAMES.includes(style)) problems.push(`Lines can't be "${style}"; they can be ${LINE_NAMES.join(', ')}.`);
      for (const { from, to } of this._layout.links) {
        for (const end of [from, to]) if (!this._itemNamed(String(end))) problems.push(`A link from ${from} to ${to} can't be drawn: ${end} isn't on the board.`);
      }
      return problems;
    }

    // Lays everything out again now. It happens by itself when anything changes size; a sandbox
    // needs this only to be sure of `placed` straight after changing something.
    arrange() {
      if (!this._viewport) return;
      this._layOut();
      this._refresh(false);
      this._sayProblems();
    }

    // Glides to the item holding `place`, or without one the item that is or holds `data-ref="ref"`,
    // or the group labelled `ref`, showing it whole but never larger than full size.
    reveal(ref, place) {
      const box = place ? this._boxHolding(place) : this._boxNamed(String(ref));
      if (!box) return false;
      this._fitting = false;
      this._place(this._fit(grow(box, REVEAL_MARGIN), 1), true);
      return true;
    }

    // Glides back to the whole board, and keeps it in view as things change.
    fit() {
      this._fitting = true;
      this._refresh(true);
    }

    // The part of the board in view now, as { x, y, w, h }, or null before it's shown.
    get shown() {
      if (!this._camera) return null;
      const { cx, cy, z } = this._camera, { width, height } = this._size();
      return { x: Math.round(cx - width / (2 * z)), y: Math.round(cy - height / (2 * z)), w: Math.round(width / z), h: Math.round(height / z) };
    }

    // How links are drawn: curved, straight or square.
    get lines() { return LINE_NAMES.includes(this.getAttribute('lines')) ? this.getAttribute('lines') : LINE_NAMES[0]; }
    set lines(style) { this.setAttribute('lines', style); }

    get fullscreen() { return this.hasAttribute('fullscreen'); }
    set fullscreen(on) { this.toggleAttribute('fullscreen', Boolean(on)); }

    // ---- Items ----

    _build() {
      this.insertAdjacentHTML('beforeend', `
        <div class="sb-board__viewport" tabindex="0" role="region" aria-label="Board">
          <div class="sb-board__scroller">
            <div class="sb-board__room"></div>
            <div class="sb-board__space">
              <div class="sb-board__frames"></div>
              <svg class="sb-board__links" aria-hidden="true"></svg>
              <div class="sb-board__items"></div>
              <svg class="sb-board__veil" aria-hidden="true"><path></path></svg>
              <div class="sb-board__dots"></div>
            </div>
          </div>
          <div class="sb-board__tools" data-modes>
            <button type="button" class="sb-board__tool" data-tool="lines" title="Change how links are drawn"></button>
            <button type="button" class="sb-board__tool" data-tool="in" aria-label="Zoom in" title="Zoom in">+</button>
            <button type="button" class="sb-board__tool" data-tool="out" aria-label="Zoom out" title="Zoom out">−</button>
            <button type="button" class="sb-board__tool" data-tool="fit" title="Show the whole board">Fit</button>
            <button type="button" class="sb-board__tool" data-tool="full" title="Full screen, and back">⛶</button>
          </div>
          <div class="sb-board__empty"></div>
        </div>`);
      this._viewport = this.querySelector(':scope > .sb-board__viewport');
      this._space = this._viewport.querySelector('.sb-board__space');
      this._frameLayer = this._space.querySelector('.sb-board__frames');
      this._linkLayer = this._space.querySelector('.sb-board__links');
      this._itemLayer = this._space.querySelector('.sb-board__items');
      this._empty = this._viewport.querySelector('.sb-board__empty');
      this._veil = this._space.querySelector('.sb-board__veil');
      this._dots = this._space.querySelector('.sb-board__dots');
      this._itemLayer.addEventListener('scroll', () => this._drawVeil(), true); // a part scrolled inside its item
      this._linesTool = this._viewport.querySelector('[data-tool="lines"]');
      // Whatever asks to go to a part, such as a tour or a focused part, scrolls what holds it, and a
      // browser can't scroll past the start. So the scroller rests in the middle of plenty of room,
      // to go any way, and once a scroll is over it becomes a move of the camera, and rests again.
      this._scroller = this._viewport.querySelector('.sb-board__scroller');
      this._scroller.addEventListener('scroll', () => this._scrolled());
      this.attributeChangedCallback();
    }

    _items() { return [...this._itemLayer.children]; }

    // A child's ref is its own, or that of the top element it draws, as a component may.
    _refOf(item) {
      const child = item.firstElementChild;
      return child?.dataset.ref ?? child?.querySelector(':scope > [data-ref]')?.dataset.ref ?? '';
    }

    // Says what's wrong in the console, once things have settled, and once each time it changes.
    _sayProblems() {
      if (!this._laidOut) return;
      clearTimeout(this._saying);
      this._saying = setTimeout(() => {
        const said = this.problems.join(' ');
        if (said && said !== this._said) console.warn(`<sb-board>: ${said}`);
        this._said = said;
      });
    }
    _itemNamed(ref) { return this._items().find((item) => this._refOf(item) === ref); }

    // Each of the sandbox's children goes into a wrapper the board owns, so placing it never touches
    // the sandbox's own element. A wrapper whose child has gone goes too.
    _adopt() {
      let changed = false;
      for (const child of [...this.children]) {
        if (child === this._viewport) continue;
        const item = Object.assign(document.createElement('div'), { className: 'sb-board__item' });
        item.append(child);
        this._itemLayer.append(item);
        this._itemSizes.observe(item);
        changed = true;
      }
      for (const item of this._items()) {
        if (item.firstElementChild) continue;
        item.remove();
        changed = true;
      }
      if (changed) this.arrange();
    }

    // Anything the layout doesn't place, in rows of its own, so nothing goes missing.
    _unplaced(entries) {
      const placedItems = new Set(entries.map((e) => e.item));
      const COLUMNS = 4, STEP = 2 * NEAR;
      return this._items()
        .filter((item) => !placedItems.has(item))
        .map((item, i) => ({ item, nearX: (i % COLUMNS) * STEP, nearY: Math.floor(i / COLUMNS) * STEP, w: WIDTHS.medium, ref: this._refOf(item) }));
    }

    // Each item the layout places: its element, rough place, group and width. The first of a ref counts.
    _entries() {
      const seen = new Set(), entries = [];
      for (const { ref, x, y, group, size } of placements(this._layout)) {
        const name = String(ref), item = this._itemNamed(name);
        if (!item || seen.has(name) || !isNumber(x) || !isNumber(y)) continue;
        seen.add(name);
        entries.push({ ref: name, item, nearX: x, nearY: y, group: group == null ? null : String(group), w: WIDTHS[size] ?? WIDTHS.medium });
      }
      return entries;
    }

    // ---- Laying out ----

    // Everything on the board comes down to boxes in a grid, twice over: a group's items among
    // themselves, then the groups and loose items on the board. A group goes where its items
    // roughly are, so its frame always holds all of them and frames never overlap. What the layout
    // doesn't place sits in a group of its own below it all, so it can't disturb the rest.
    _layOut() {
      const entries = this._entries(), extras = this._unplaced(entries);
      const groups = new Map(), units = [];
      for (const entry of entries) {
        if (entry.group == null) { units.push(entry); continue; }
        if (!groups.has(entry.group)) groups.set(entry.group, { label: entry.group, members: [] });
        groups.get(entry.group).members.push(entry);
      }
      for (const group of groups.values()) {
        group.nearX = mean(group.members.map((m) => m.nearX));
        group.nearY = mean(group.members.map((m) => m.nearY));
        group.w = placeColumns(group.members, ITEM_GAP, true) + 2 * GROUP_PADDING;
        units.push(group);
      }
      placeColumns(units, this._columnGap(), false);
      const leftover = extras.length ? { label: 'Not placed yet', members: extras, left: 0, w: placeColumns(extras, ITEM_GAP, true) + 2 * GROUP_PADDING } : null;
      if (leftover) groups.set(leftover.label, leftover);

      const all = [...entries, ...extras];
      for (const { item, w } of all) item.style.width = `${w}px`;
      for (const entry of all) entry.h = entry.item.offsetHeight;

      for (const group of groups.values()) group.h = placeRows(group.members, ITEM_GAP) + GROUP_LABEL + GROUP_PADDING;
      const height = placeRows(units, ROW_GAP);
      if (leftover) leftover.top = units.length ? height + ROW_GAP : 0;

      for (const unit of units) if (!unit.members) { unit.x = unit.left; unit.y = unit.top; }
      for (const group of groups.values()) {
        for (const m of group.members) { m.x = group.left + GROUP_PADDING + m.left; m.y = group.top + GROUP_LABEL + m.top; }
      }

      this._placed = {
        items: Object.fromEntries(all.filter((e) => e.ref).map(({ ref, x, y, w, h }) => [ref, { x, y, w, h }])),
        groups: Object.fromEntries([...groups.values()].map(({ label, left, top, w, h }) => [label, { x: left, y: top, w, h }])),
        links: []
      };
      this._measured = this._sizesNow();
      for (const { item, x, y } of all) Object.assign(item.style, { left: `${x}px`, top: `${y}px` });
      this._drawFrames(groups);
      this._drawLinks(all);
      this._drawVeil();
      this._empty.hidden = all.length > 0;
      // Later changes of size glide. Only after this layout has landed, so it doesn't itself glide.
      this._space.getBoundingClientRect();
      this._space.classList.add('sb-board__space--settled');
    }

    // Wide enough for the longest words on any link to sit in the gap.
    _columnGap() {
      const longest = Math.max(0, ...this._layout.links.map((l) => String(l.label ?? '').length));
      return clamp(longest * LETTER + 24, COLUMN_GAP, MOST_COLUMN_GAP);
    }

    _sizesNow() { return this._items().map((item) => `${this._refOf(item)}:${item.offsetWidth}x${item.offsetHeight}`).join(); }

    // Something changed size. If it really did, lay out again; nothing here changes an item's size
    // beyond what the layout already set, so this settles at once.
    _settle() {
      if (this._sizesNow() !== this._measured) this.arrange();
    }

    _drawFrames(groups) {
      const frames = [...groups.values()];
      const existing = [...this._frameLayer.children];
      existing.slice(frames.length).forEach((frame) => frame.remove());
      frames.forEach(({ label, left, top, w, h }, i) => {
        const frame = existing[i] ?? this._frameLayer.appendChild(Object.assign(document.createElement('div'), { className: 'sb-board__frame', innerHTML: '<span class="sb-board__label"></span>' }));
        frame.firstElementChild.textContent = label;
        Object.assign(frame.style, { left: `${left}px`, top: `${top}px`, width: `${w}px`, height: `${h}px` });
      });
    }

    _drawLinks(entries) {
      const boxes = entries.map(({ ref, x, y, w, h }) => ({ ref, x, y, w, h }));
      const boxOfRef = new Map(boxes.map((b) => [b.ref, b]));
      const taken = { ports: new Set(), stretches: [] };
      const style = LINE_STYLES[this.lines];
      const labels = [];
      let html = '';
      for (const { from, to, label, tone } of this._layout.links) {
        const a = boxOfRef.get(String(from)), b = boxOfRef.get(String(to));
        if (!a || !b || a === b) continue;
        const points = style.points(a, b, boxes, taken);
        if (!points) continue;
        this._placed.links.push({ from: String(from), to: String(to), label: label ?? null, points });
        let words = '';
        if (label != null && label !== '') {
          const text = String(label), place = wordsPlace(style.spots(points), text, boxes, labels);
          labels.push(place.box);
          words = `<text class="sb-board__words" x="${place.x}" y="${place.y}">${esc(text)}</text>`;
        }
        const toneAttribute = tone ? ` data-tone="${esc(tone)}"` : '';
        html += `<g class="sb-board__link"${toneAttribute}><path class="sb-board__line" d="${style.path(points)}"/><path class="sb-board__head" d="${headOf(points)}"/>${words}</g>`;
      }
      this._linkLayer.innerHTML = html;
      this._linesTool.textContent = `Lines: ${this.lines}`;
    }

    // The veil, its holes, and the dots above each item.
    _drawVeil() {
      if (!this._veil) return;
      this._veil.classList.toggle('sb-board__veil--on', Boolean(chosenTags));
      this._dots.replaceChildren();
      if (!chosenTags) return;
      const holes = [];
      for (const item of this._items()) {
        const lit = [...item.querySelectorAll('[data-tags]')].filter((el) => carriesChosen(el) && el.checkVisibility());
        if (!lit.length) continue;
        holes.push(...outermost(lit).map((part) => this._boxWithin(item, part)));
        const tags = chosenTags.tags.filter((tag) => lit.some((el) => carriesTag(el, tag)));
        if (tags.length) this._dots.append(this._dotRow(item, tags));
      }
      const everywhere = `M${-VEIL_REACH} ${-VEIL_REACH} H${VEIL_REACH} V${VEIL_REACH} H${-VEIL_REACH}Z`;
      this._veil.firstElementChild.setAttribute('d', [everywhere, ...holes.map(holePath)].join(' '));
    }

    // A dot in each tag's colour, in a row just above the item's top left, naming the tag.
    _dotRow(item, tags) {
      const { x, y } = this._itemBox(item);
      const row = Object.assign(document.createElement('div'), { className: 'sb-board__dot-row' });
      Object.assign(row.style, { left: `${x}px`, top: `${y - DOT - DOT_GAP}px` });
      for (const tag of tags) {
        const dot = Object.assign(document.createElement('span'), { className: 'sb-board__dot', title: tag });
        dot.dataset.tag = tag;
        dot.setAttribute('role', 'img');
        dot.setAttribute('aria-label', tag);
        if (chosenTags.colors[tag]) dot.style.setProperty('--sb-board-tag', chosenTags.colors[tag]);
        row.append(dot);
      }
      return row;
    }

    // Where it's going, not where it is: it may be gliding there, and won't be measured again.
    _itemBox(item) {
      return { x: parseFloat(item.style.left), y: parseFloat(item.style.top), w: item.offsetWidth, h: item.offsetHeight };
    }

    // A part's box on the board, kept within its item. Measured on screen and scaled back by the
    // item's own size, which stays right whatever the zoom, and even while the board glides.
    _boxWithin(item, part) {
      const outer = item.getBoundingClientRect(), inner = part.getBoundingClientRect();
      const scale = item.offsetWidth / (outer.width || 1);
      const { x: left, y: top, w, h } = this._itemBox(item);
      const x = clamp(left + (inner.left - outer.left) * scale, left, left + w), y = clamp(top + (inner.top - outer.top) * scale, top, top + h);
      return {
        x, y,
        w: clamp(left + (inner.right - outer.left) * scale, left, left + w) - x,
        h: clamp(top + (inner.bottom - outer.top) * scale, top, top + h) - y
      };
    }

    _boxOfRef(ref) {
      const box = this._placed.items[ref];
      return box ? { ...box } : null;
    }

    _boxNamed(ref) {
      const part = [...this._itemLayer.querySelectorAll('[data-ref]')].find((el) => el.dataset.ref === ref);
      if (part) return this._boxOfRef(this._refOf(part.closest('.sb-board__item')));
      const group = this._placed.groups[ref];
      return group ? { ...group } : null;
    }

    _boxHolding(place) {
      const item = this._items().find((i) => i.contains(place));
      return item ? this._boxOfRef(this._refOf(item)) : null;
    }

    // ---- The camera ----

    _size() { return { width: this._viewport.clientWidth, height: this._viewport.clientHeight }; }

    // Everything on the board, with room around it.
    _bounds() {
      const all = union([...Object.values(this._placed.items), ...Object.values(this._placed.groups)]);
      return all ? grow(all, MARGIN) : { x: 0, y: 0, w: 0, h: 0 };
    }

    _fit(box, most = MAX_ZOOM) {
      const { width, height } = this._size();
      return { cx: box.x + box.w / 2, cy: box.y + box.h / 2, z: Math.min(most, width / (box.w || 1), height / (box.h || 1)) };
    }

    _refresh(glide) {
      if (!this._viewport) return;
      if (this._fitting) this._place(this._fit(this._bounds(), 1), glide);
      else if (this._camera) this._place(this._camera, glide);
    }

    _smallestZoom() { return Math.min(1, this._fit(this._bounds()).z); }

    _place({ cx, cy, z }, glide) {
      const { width, height } = this._size();
      if (!width || !height) return; // hidden, as in a closed tab: placed once it's shown
      const zoom = clamp(z, this._smallestZoom(), MAX_ZOOM);
      this._camera = { cx, cy, z: zoom };
      this._viewport.classList.toggle('sb-board__viewport--glide', glide);
      this._space.style.transform = `translate(${SCROLL_ROOM + width / 2 - cx * zoom}px, ${SCROLL_ROOM + height / 2 - cy * zoom}px) scale(${zoom})`;
      if (!this._scrolling) this._scroller.scrollTo(SCROLL_ROOM, SCROLL_ROOM);
    }

    // Zooms by a factor, keeping the board point under (x, y) in the viewport still; the centre by default.
    _zoomBy(factor, glide, at = null) {
      if (!this._camera) return;
      const { cx, cy, z } = this._camera, { width, height } = this._size();
      const zoom = clamp(z * factor, this._smallestZoom(), MAX_ZOOM);
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

    _scrolled() {
      clearTimeout(this._scrolling);
      this._scrolling = setTimeout(() => {
        this._scrolling = null;
        if (!this._size().width) return; // hidden, which forgets a scroll: nothing was asked for
        const dx = this._scroller.scrollLeft - SCROLL_ROOM, dy = this._scroller.scrollTop - SCROLL_ROOM;
        if (dx || dy) this._panBy(-dx, -dy, false);
      }, SCROLL_SETTLED);
    }

    // ---- Interaction ----

    _click(e) {
      const tool = e.target.closest('.sb-board__tool');
      if (!tool) return;
      if (tool.dataset.tool === 'in') this._zoomBy(ZOOM_STEP, true);
      if (tool.dataset.tool === 'out') this._zoomBy(1 / ZOOM_STEP, true);
      if (tool.dataset.tool === 'fit') this.fit();
      if (tool.dataset.tool === 'full') this.fullscreen = !this.fullscreen;
      if (tool.dataset.tool === 'lines') this.lines = LINE_NAMES[(LINE_NAMES.indexOf(this.lines) + 1) % LINE_NAMES.length];
    }

    // Dragging the background or a frame pans. Pressing an item is the item's own: text selects,
    // and buttons, folds and everything else in it work as they do anywhere.
    _press(e) {
      if (e.button !== 0 || !this._camera || e.target.closest('.sb-board__tools, .sb-board__item')) return;
      if (!e.target.closest('.sb-board__viewport')) return;
      const { cx, cy, z } = this._camera, start = { x: e.clientX, y: e.clientY };
      let moving = false;
      const move = (m) => {
        const dx = m.clientX - start.x, dy = m.clientY - start.y;
        if (!moving && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        moving = true;
        this._viewport.classList.add('sb-board__viewport--dragging');
        this._fitting = false;
        this._place({ cx: cx - dx / z, cy: cy - dy / z, z }, false);
      };
      const stop = () => {
        removeEventListener('pointermove', move);
        removeEventListener('pointerup', stop);
        this._viewport.classList.remove('sb-board__viewport--dragging');
      };
      addEventListener('pointermove', move);
      addEventListener('pointerup', stop);
    }

    // Zooming needs Ctrl or ⌘ (a trackpad pinch sends it), so scrolling past the board still scrolls the page.
    _wheel(e) {
      if (!this._camera || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const box = this._viewport.getBoundingClientRect();
      this._zoomBy(Math.exp(-e.deltaY / 200), false, { x: e.clientX - box.left, y: e.clientY - box.top });
    }

    _key(e) {
      if (e.key === 'Escape' && this.fullscreen) { this.fullscreen = false; return; }
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
