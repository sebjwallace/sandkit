// Sandkit sb-source-trace 0.1.2 · MIT Licence · https://github.com/sebjwallace/sandkit
// Why something in the model is there, as one graph flowing left to right: the sources and items
// it rests on to its left, what rests on it to its right. Sources are sheets of paper to open;
// items are boxes to trace from. Unknown ids, loops and items resting on nothing cited are drawn.
//
//   <sb-source-trace></sb-source-trace>
//   trace.items = model.items;
//   trace.catalogue = catalogue.sources;
//   trace.subject = 'RUL-014';
//   trace.addEventListener('sb-open', (e) => openSource(e.detail.id));
//
// The tracing is a plain function, run from Node too: node tools/analyse.mjs trace items.json catalogue.json --ref RUL-014
// See manifest.md for the full contract.
(function () {
  // ---- Core: tracing, plain functions returning plain JSON. ----

  // The graph around `ref`: everything it rests on, and everything resting on it. Edges run the way
  // material flows: from a source to what was derived from it or cites it, and from an item to what
  // rests on it. Nodes and edges follow the given order, so the same model always traces the same way.
  function traceSources({ items = [], catalogue = [] } = {}, ref) {
    const itemOf = new Map(items.map((item) => [item.id, item]));
    const sourceOf = new Map(catalogue.map((source) => [source.id, source]));
    const isSource = sourceOf.has(ref) && !itemOf.has(ref);
    const graph = builder(items, itemOf, sourceOf);

    graph.node(ref);
    if (isSource) { graph.behindSource(ref); graph.shapedBySource(ref); }
    else if (itemOf.has(ref)) { graph.behindItem(ref); graph.shapedByItem(ref); }

    const { nodes, edges } = graph;
    const cycles = markCycles(nodes, edges);
    placeInColumns(nodes, edges);
    const subject = itemOf.get(ref) ?? sourceOf.get(ref);
    const behind = new Set(graph.behind);
    return {
      subject: { id: ref, title: subject?.title ?? null, kind: subject ? (isSource ? 'Source' : subject.kind ?? null) : null, isSource },
      nodes,
      edges,
      missing: nodes.filter((n) => n.type === 'missing').map((n) => ({ id: n.id, from: edges.find((e) => e.from === n.id)?.to ?? null })),
      cycles,
      unsupported: nodes.filter((n) => n.type === 'item' && behind.has(n.id) && !edges.some((e) => e.to === n.id)).map((n) => n.id)
    };
  }

  // Collects nodes and edges, each once. Each walk keeps its own record of where it has been, so
  // walking back and walking forward from the same node both go all the way.
  function builder(items, itemOf, sourceOf) {
    const nodes = [];
    const edges = [];
    const nodeOf = new Map();
    const behind = new Set();
    const ahead = new Set();

    const node = (id) => {
      if (nodeOf.has(id)) return;
      const item = itemOf.get(id);
      const source = sourceOf.get(id);
      const made = item ? { id, type: 'item', title: item.title ?? null, kind: item.kind ?? null }
        : source ? { id, type: 'source', title: source.title ?? null, derived: Boolean(source.derivedFrom?.length) }
          : { id, type: 'missing', title: null };
      nodeOf.set(id, made);
      nodes.push(made);
    };
    const edge = (from, to, kind, citation) => {
      let made = edges.find((e) => e.from === from && e.to === to);
      if (!made) edges.push(made = { from, to, kind, citations: [] });
      if (citation) made.citations.push({ ...citation });
    };
    const visit = (seen, id) => {
      node(id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    };

    // A source and everything it was derived from.
    const behindSource = (id) => {
      if (!visit(behind, id)) return;
      for (const from of sourceOf.get(id)?.derivedFrom ?? []) {
        edge(from, id, 'derived');
        behindSource(from);
      }
    };

    // An item, the sources it cites and the items it rests on, all the way back.
    const behindItem = (id) => {
      if (!visit(behind, id)) return;
      const item = itemOf.get(id);
      for (const citation of item?.sources ?? []) {
        edge(citation.source, id, 'cites', citation);
        behindSource(citation.source);
      }
      for (const from of item?.restsOn ?? []) {
        edge(from, id, 'rests');
        behindItem(from);
      }
    };

    // Everything resting on an item, all the way forward.
    const shapedByItem = (id) => {
      if (!visit(ahead, id)) return;
      for (const item of items.filter((i) => (i.restsOn ?? []).includes(id))) {
        edge(id, item.id, 'rests');
        shapedByItem(item.id);
      }
    };

    // Everything derived from a source, every item citing any of them, and all that rests on those.
    const shapedBySource = (id) => {
      if (!visit(ahead, id)) return;
      for (const derived of [...sourceOf.values()].filter((s) => (s.derivedFrom ?? []).includes(id))) {
        edge(id, derived.id, 'derived');
        shapedBySource(derived.id);
      }
      for (const item of items) {
        for (const citation of (item.sources ?? []).filter((c) => c.source === id)) {
          edge(id, item.id, 'cites', citation);
          shapedByItem(item.id);
        }
      }
    };

    return { nodes, edges, behind, node, behindSource, behindItem, shapedByItem, shapedBySource };
  }

  // Marks the edges that close a loop, and returns each loop as the ids it goes round, in flow order.
  function markCycles(nodes, edges) {
    const cycles = [];
    const state = new Map(); // id → 'open' while being walked, 'done' after
    const walk = (id, stack) => {
      state.set(id, 'open');
      for (const e of edges.filter((e) => e.from === id)) {
        if (state.get(e.to) === 'open') {
          e.cycle = true;
          cycles.push([...stack.slice(stack.indexOf(e.to)), id, e.to]);
        } else if (!state.has(e.to)) walk(e.to, [...stack, id]);
      }
      state.set(id, 'done');
    };
    for (const n of nodes) if (!state.has(n.id)) walk(n.id, []);
    for (const e of edges) e.cycle = Boolean(e.cycle);
    return cycles;
  }

  // Each node's column: the longest way in from something nothing flows into, loops aside, so
  // everything sits to the right of what it rests on.
  function placeInColumns(nodes, edges) {
    const flowing = edges.filter((e) => !e.cycle);
    const column = new Map();
    const columnOf = (id) => {
      if (!column.has(id)) {
        column.set(id, 0);
        column.set(id, Math.max(0, ...flowing.filter((e) => e.to === id).map((e) => columnOf(e.from) + 1)));
      }
      return column.get(id);
    };
    for (const n of nodes) n.column = columnOf(n.id);
  }

  const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

  // What tells two citations apart: the source, and the words, page, region or comment.
  const passageKey = (citation) => JSON.stringify([citation.source ?? null, citation.quote ?? null, citation.page ?? null, citation.region ?? null, citation.annotation ?? null]);

  // The trace in a sentence: "4 sources and 3 items lead to RUL-3, citing 4 passages; 2 items rest on it".
  function summary(result) {
    const { subject, nodes, edges } = result;
    const reach = (from, to) => { // ids reached from `from` along edges, one way
      const found = new Set();
      const walk = (id) => edges.filter((e) => (to ? e.from === id : e.to === id)).forEach((e) => {
        const next = to ? e.to : e.from;
        if (!found.has(next) && next !== from) { found.add(next); walk(next); }
      });
      walk(from);
      return [...found].map((id) => nodes.find((n) => n.id === id));
    };
    const count = (list, type) => list.filter((n) => n.type === type).length;
    const before = reach(subject.id, false);
    const after = reach(subject.id, true);
    const parts = [];
    if (before.length) {
      const sources = count(before, 'source');
      const items = count(before, 'item');
      const passages = subject.isSource ? 0 : new Set(edges.filter((e) => before.some((n) => n.id === e.to) || e.to === subject.id).flatMap((e) => e.citations.map(passageKey))).size;
      const what = [sources && plural(sources, 'source'), items && plural(items, 'item')].filter(Boolean).join(' and ');
      parts.push(`${what} ${sources + items === 1 ? 'leads' : 'lead'} to ${subject.id}${passages ? `, citing ${plural(passages, 'passage')}` : ''}`);
    } else if (!subject.isSource && nodes.some((n) => n.id === subject.id && n.type === 'item')) {
      parts.push(`${subject.id} rests on no cited source`);
    }
    const shaped = count(after, 'item');
    if (shaped) parts.push(`${plural(shaped, 'item')} ${shaped === 1 ? 'rests' : 'rest'} on it`);
    if (!parts.length) parts.push(subject.isSource ? `Nothing cites ${subject.id}` : `${subject.id} isn't in the model`);
    return parts.join('; ');
  }

  // A citation in words: the quote, or what else it points at.
  function passageText(citation) {
    const where = [citation.page != null && `p. ${citation.page}`, citation.annotation != null && `comment ${citation.annotation}`, citation.region && 'a region of the image']
      .filter(Boolean).join(', ');
    return [where, citation.quote != null && `“${citation.quote}”`].filter(Boolean).join(' ');
  }

  // A short readable summary: problems first, then the columns and what flows between them.
  function markdown(result) {
    const section = (title, lines) => (lines.length ? [`## ${title}`, '', ...lines, ''] : []);
    const columns = [...new Set(result.nodes.map((n) => n.column))].sort((a, b) => a - b);
    const name = (n) => `${n.id}${n.title ? ` ${n.title}` : ''}${n.type === 'missing' ? ' (unknown)' : ''}`;
    const flow = (e) => `- ${e.from} → ${e.to}${e.cycle ? ' (closes a loop)' : ''}${e.citations.map((c) => `\n  - ${passageText(c)}`).join('')}`;
    return [
      `# Tracing ${result.subject.id}`, '',
      `${summary(result)}.`, '',
      ...section('Unknown', result.missing.map((m) => `- ${m.id}${m.from ? `, named by ${m.from}` : ''}`)),
      ...section('Loops', result.cycles.map((c) => `- ${c.join(' → ')}`)),
      ...section('Resting on nothing cited', result.unsupported.map((id) => `- ${id}`)),
      ...section('Columns, left to right', columns.map((c) => `${c + 1}. ${result.nodes.filter((n) => n.column === c).map(name).join('; ')}`)),
      ...section('Flows', result.edges.map(flow))
    ].join('\n');
  }

  // For tools/analyse.mjs: the inputs are the model's items and the catalogue, in any files.
  function trace(documents, { ref } = {}) {
    if (!ref) throw new Error('Name what to trace: --ref RUL-014');
    const items = documents.flatMap((doc) => doc.items ?? []);
    const catalogue = documents.flatMap((doc) => doc.sources ?? []);
    return traceSources({ items, catalogue }, String(ref));
  }
  trace.markdown = markdown;
  const core = { trace };

  // ---- Node: hand the core to tools. ----
  if (typeof module !== 'undefined' && module.exports) module.exports = core;

  // ---- Browser: the element. ----
  if (typeof customElements === 'undefined') return;

  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-source-trace';
  const existing = customElements.get('sb-source-trace');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-source-trace>, so only one can run. Rename one by replacing every "sb-source-trace" in its file.`);
    }
    return;
  }

  // Every node is the same size, so the layout is exact without measuring the page. A sandbox that
  // draws its own nodes can give another size.
  const NODE = { width: 152, height: 70 };
  const GAP = { across: 44, down: 14 };
  const PAD = 18;

  const CSS = `
    .sb-source-trace { --sb-source-trace-edge: color-mix(in srgb, var(--sb-text, #1f2933) 24%, transparent); --sb-source-trace-fold: 12px;
      display: flex; flex-direction: column; gap: 10px; min-height: 0; color: var(--sb-text, #1f2933); font: 13px/1.45 var(--sb-font, system-ui, sans-serif); }
    .sb-source-trace__empty { margin: 0; color: var(--sb-muted, #616e7c); }

    .sb-source-trace__trail { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 12px; color: var(--sb-muted, #616e7c); }
    .sb-source-trace__back, .sb-source-trace__crumb { padding: 1px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 999px; background: var(--sb-surface, #fff); color: inherit; font: inherit; cursor: pointer; }
    .sb-source-trace__crumb { border-color: transparent; background: none; font-family: ui-monospace, Menlo, Consolas, monospace; }
    .sb-source-trace__back:hover, .sb-source-trace__crumb:hover { color: var(--sb-text, #1f2933); border-color: var(--sb-muted, #616e7c); }

    .sb-source-trace__head { display: grid; gap: 4px; }
    .sb-source-trace__title { display: flex; align-items: baseline; gap: 8px; margin: 0; font-size: 15px; font-weight: 600; }
    .sb-source-trace__kind { color: var(--sb-muted, #616e7c); font-size: 12px; font-weight: 400; }
    .sb-source-trace__summary { color: var(--sb-muted, #616e7c); }
    .sb-source-trace__full { display: grid; place-items: center; width: 26px; height: 26px; margin: 0 0 0 auto; padding: 0; border: 0; border-radius: 4px; background: none; color: var(--sb-muted, #616e7c); cursor: pointer; align-self: center; }
    .sb-source-trace__full:hover { background: color-mix(in srgb, var(--sb-text, #1f2933) 8%, transparent); color: var(--sb-text, #1f2933); }
    .sb-source-trace:fullscreen { padding: 20px 24px; background: var(--sb-surface, #fff); }
    .sb-source-trace__problems { color: var(--sb-bad, #c53030); font-weight: 600; }
    .sb-source-trace button:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }

    /* The graph, on a slightly darker ground so the paper stands out. Wide graphs scroll rather than shrink. */
    .sb-source-trace__graph { flex: 1; min-height: 0; overflow: auto; border-radius: var(--sb-radius, 8px); background: color-mix(in srgb, var(--sb-bg, #f5f6f8) 70%, var(--sb-surface-2, #eef0f3)); box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06); }
    .sb-source-trace__canvas { position: relative; margin: 0 auto; }
    .sb-source-trace__lines { position: absolute; inset: 0; overflow: visible; pointer-events: none; }
    .sb-source-trace__line { fill: none; stroke: color-mix(in srgb, var(--sb-text, #1f2933) 38%, transparent); stroke-width: 1.5; }
    .sb-source-trace__arrow { fill: color-mix(in srgb, var(--sb-text, #1f2933) 38%, transparent); }
    .sb-source-trace__flow--lit .sb-source-trace__line { stroke: var(--sb-accent, #2563eb); stroke-width: 2.5; }
    .sb-source-trace__flow--lit .sb-source-trace__arrow { fill: var(--sb-accent, #2563eb); }
    .sb-source-trace__flow--cycle .sb-source-trace__line, .sb-source-trace__flow--missing .sb-source-trace__line { stroke: var(--sb-bad, #c53030); stroke-dasharray: 5 4; }
    .sb-source-trace__flow--cycle .sb-source-trace__arrow, .sb-source-trace__flow--missing .sb-source-trace__arrow { fill: var(--sb-bad, #c53030); }

    .sb-source-trace__node { box-sizing: border-box; position: absolute; display: flex; flex-direction: column; gap: 2px; padding: 7px 10px; overflow: hidden; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: inherit; font: inherit; text-align: left; cursor: pointer; }
    .sb-source-trace__node:hover, .sb-source-trace__node--lit { border-color: var(--sb-accent, #2563eb); box-shadow: 0 0 0 2px var(--sb-accent-soft, #eaf0ff); }
    .sb-source-trace__node--subject { border-width: 2px; border-color: var(--sb-accent, #2563eb); box-shadow: 0 0 0 3px var(--sb-accent-soft, #eaf0ff); cursor: default; }
    .sb-source-trace__node--unsupported { border-left: 4px solid var(--sb-warn, #d69e2e); }
    .sb-source-trace__node--missing { border: 1.5px dashed var(--sb-bad, #c53030); background: color-mix(in srgb, var(--sb-bad, #c53030) 6%, var(--sb-surface, #fff)); cursor: default; }
    .sb-source-trace__top { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .sb-source-trace__id { flex: none; padding: 0 5px; border-radius: 4px; background: color-mix(in srgb, var(--sb-text, #1f2933) 8%, transparent); color: var(--sb-muted, #616e7c); font: 600 10.5px/1.6 ui-monospace, Menlo, Consolas, monospace; }
    .sb-source-trace__tag { overflow: hidden; color: var(--sb-muted, #616e7c); font-size: 11px; white-space: nowrap; text-overflow: ellipsis; }
    .sb-source-trace__node--unsupported .sb-source-trace__tag, .sb-source-trace__node--missing .sb-source-trace__tag { color: var(--sb-bad, #c53030); font-weight: 600; }
    .sb-source-trace__name { display: -webkit-box; overflow: hidden; -webkit-line-clamp: 2; -webkit-box-orient: vertical; font-size: 12.5px; font-weight: 600; line-height: 1.3; }

    /* Sources are small sheets of paper with a folded corner; the sandbox's items stay plain beside them. */
    .sb-source-trace__node--source { --sb-source-trace-sheet: var(--sb-source-trace-paper, color-mix(in srgb, var(--sb-surface, #fff) 94%, #f3e2b8));
      border-color: var(--sb-source-trace-edge); border-radius: 2px; clip-path: polygon(0 0, calc(100% - var(--sb-source-trace-fold)) 0, 100% var(--sb-source-trace-fold), 100% 100%, 0 100%);
      background: linear-gradient(to top right, color-mix(in srgb, var(--sb-source-trace-sheet) 84%, var(--sb-text, #1f2933)) 50%, transparent 50%) top right / var(--sb-source-trace-fold) var(--sb-source-trace-fold) no-repeat,
        linear-gradient(135deg, color-mix(in srgb, var(--sb-source-trace-sheet) 97%, #fff), var(--sb-source-trace-sheet) 45%, color-mix(in srgb, var(--sb-source-trace-sheet) 93%, #000)); }
    .sb-source-trace__node--source .sb-source-trace__name { font: 600 13px/1.3 var(--sb-source-trace-font, Georgia, 'Iowan Old Style', 'Times New Roman', serif); }
    .sb-source-trace__node--source:hover, .sb-source-trace__node--source.sb-source-trace__node--lit,
    .sb-source-trace__node--source.sb-source-trace__node--subject { border-color: var(--sb-accent, #2563eb); box-shadow: inset 0 0 0 1px var(--sb-accent, #2563eb); }

    /* A node the sandbox draws: the frame only places it and shows its state, the sandbox's look inside. */
    .sb-source-trace__node--own { display: block; padding: 0; border: 0; border-radius: var(--sb-radius, 8px); background: none; clip-path: none; overflow: visible; }
    .sb-source-trace__node--own > * { box-sizing: border-box; width: 100%; height: 100%; }
    .sb-source-trace__node--own:hover, .sb-source-trace__node--own.sb-source-trace__node--lit { box-shadow: 0 0 0 2px var(--sb-accent, #2563eb); }
    .sb-source-trace__node--own.sb-source-trace__node--subject { box-shadow: 0 0 0 3px var(--sb-accent, #2563eb); }
    .sb-source-trace__node--own.sb-source-trace__node--unsupported { border: 0; box-shadow: -4px 0 0 var(--sb-warn, #d69e2e); }`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const FULL_SCREEN_ICON = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/></svg>';

  // What kind of material it is, and the file's type: "transcript · txt".
  function formatOf(source) {
    const type = (source.path ?? '').match(/\.(\w+)$/)?.[1]?.toLowerCase();
    return [source.format, type !== source.format && type].filter(Boolean).join(' · ');
  }

  // A line that skips columns holds an empty place in each column it crosses, so it's ordered with
  // the nodes and passes between them, never behind one. Then each column is ordered so lines cross
  // as little as they can: each place goes to the average of what flows into it, then of what it
  // flows into, and once more forward. Every place is the same size, each column centred on the tallest.
  function layOut(nodes, edges, size = NODE) {
    const columns = [];
    const columnOf = new Map(nodes.map((n) => [n.id, n.column]));
    for (const n of nodes) (columns[n.column] ??= []).push(n.id);
    const links = [];
    const routes = edges.map((e, i) => {
      if (e.cycle) return [];
      const passing = [];
      for (let column = columnOf.get(e.from) + 1; column < columnOf.get(e.to); column++) {
        const id = `\u0000${i}:${column}`; // can't be an id from the model
        columns[column].push(id);
        passing.push(id);
      }
      [e.from, ...passing, e.to].forEach((id, k, all) => k && links.push({ from: all[k - 1], to: id }));
      return passing;
    });

    const row = new Map();
    const number = () => columns.forEach((ids) => ids.forEach((id, i) => row.set(id, i)));
    const sortBy = (ids, neighbours) => {
      const place = (id) => {
        const near = neighbours(id);
        return near.length ? near.reduce((sum, other) => sum + row.get(other), 0) / near.length : row.get(id);
      };
      const at = new Map(ids.map((id) => [id, place(id)]));
      ids.sort((a, b) => at.get(a) - at.get(b));
    };
    const into = (id) => links.filter((l) => l.to === id).map((l) => l.from);
    const outOf = (id) => links.filter((l) => l.from === id).map((l) => l.to);

    number();
    for (const sweep of [1, -1, 1]) {
      const order = sweep > 0 ? columns.slice(1) : columns.slice(0, -1).reverse();
      for (const ids of order) { sortBy(ids, sweep > 0 ? into : outOf); number(); }
    }

    const tallest = Math.max(...columns.map((ids) => ids.length));
    const step = size.height + GAP.down;
    const place = new Map();
    columns.forEach((ids, column) => {
      const offset = ((tallest - ids.length) * step) / 2;
      ids.forEach((id, i) => place.set(id, { x: PAD + column * (size.width + GAP.across), y: PAD + offset + i * step }));
    });
    return {
      place,
      routes,
      width: PAD * 2 + columns.length * size.width + (columns.length - 1) * GAP.across,
      height: PAD * 2 + tallest * step - GAP.down
    };
  }

  // A line from the right of one node to the left of the next, with an arrowhead: curving between
  // columns, straight through the empty places it holds. A line closing a loop runs backwards, so it
  // swings below both nodes instead.
  function flowPath(from, passing, to, size = NODE) {
    const middle = (p) => p.y + size.height / 2;
    const curve = (x1, y1, x2, y2, dip = 0) => {
      const bend = x2 > x1 ? (x2 - x1) / 2 : 70;
      return ` C${x1 + bend} ${y1 + dip}, ${x2 - bend} ${y2 + dip}, ${x2} ${y2}`;
    };
    let [x, y] = [from.x + size.width, middle(from)];
    let line = `M${x} ${y}`;
    for (const p of passing) {
      line += curve(x, y, p.x, middle(p)) + ` L${p.x + size.width} ${middle(p)}`;
      [x, y] = [p.x + size.width, middle(p)];
    }
    const [x2, y2] = [to.x - 2, middle(to)];
    line += curve(x, y, x2, y2, x2 > x ? 0 : size.height);
    return { line, arrow: `M${x2} ${y2} l-8 -4.5 v9 z` };
  }

  function addStyle() {
    if (document.getElementById('sb-source-trace-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-source-trace-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbSourceTrace extends HTMLElement {
    static origin = ORIGIN;

    static traceSources = traceSources;

    constructor() {
      super();
      this._items = [];
      this._catalogue = [];
      this._subject = null;
      this._trail = [];
      this._highlight = [];
      this._pointed = null;
      this._result = null;
      this._drawNode = null;
      this._nodeSize = NODE;

      this.addEventListener('click', (e) => this._click(e.target));
      this.addEventListener('pointerover', (e) => this._pointAt(this._nodeAt(e.target)));
      this.addEventListener('pointerleave', () => this._pointAt(null));
      this.addEventListener('focusin', (e) => this._pointAt(this._nodeAt(e.target)));
      this.addEventListener('focusout', (e) => { if (!this.contains(e.relatedTarget)) this._pointAt(null); });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-source-trace');
      this._render();
    }

    // ---- Public API ----

    // The model's items: [{ id, title, kind, sources: [citation], restsOn: [id] }].
    get items() { return this._items; }
    set items(items) {
      this._items = (items || []).map((item) => ({ ...item }));
      this._render();
    }

    // The catalogue's sources: [{ id, title, path, format, derivedFrom, … }].
    get catalogue() { return this._catalogue; }
    set catalogue(sources) {
      this._catalogue = (sources || []).map((source) => ({ ...source }));
      this._render();
    }

    // The id being traced. Setting a different one puts the one before on the trail.
    get subject() { return this._subject; }
    set subject(id) {
      id = id == null ? null : String(id);
      if (id === this._subject) return;
      if (this._subject) this._trail.push(this._subject);
      this._subject = id;
      this._render();
    }

    get trail() { return [...this._trail]; }
    clearTrail() {
      this._trail = [];
      this._render();
    }

    // Ids of items or sources to light up, with the lines touching them.
    get highlight() { return this._highlight; }
    set highlight(ids) {
      this._highlight = (ids || []).map(String);
      this._showMarks();
    }

    // The latest trace, as traceSources returns it.
    get result() { return this._result; }

    // (node) => element or null: the sandbox's own look for a source or an item, so a trace looks
    // like the rest of the sandbox. The node is { id, type, title, kind, derived } as traceSources
    // gives it. The trace places what comes back and shows its state; clicks still go to the trace,
    // so draw nothing to interact with inside. Null keeps the trace's own look; unknown ids always do.
    get drawNode() { return this._drawNode; }
    set drawNode(draw) {
      this._drawNode = typeof draw === 'function' ? draw : null;
      this._render();
    }

    // { width, height } of every node, in pixels: the size the sandbox's own nodes are drawn at.
    get nodeSize() { return { ...this._nodeSize }; }
    set nodeSize(size) {
      this._nodeSize = { width: Number(size?.width) || NODE.width, height: Number(size?.height) || NODE.height };
      this._render();
    }

    // ---- Rendering ----

    _render() {
      if (!this.isConnected) return;
      if (!this._subject) {
        this._result = null;
        this.innerHTML = '<p class="sb-source-trace__empty">Choose something to see where it comes from.</p>';
        return;
      }
      const result = this._result = traceSources({ items: this._items, catalogue: this._catalogue }, this._subject);
      this.innerHTML = this._trailHtml() + this._headHtml(result) + this._graphHtml(result);
      this._placeOwnNodes(result);
      this._showMarks();
      this._showSubject();
    }

    // A graph wider than its room scrolls. It starts at the sources, scrolled only as far as it takes
    // to bring the subject into view.
    _showSubject() {
      const graph = this.querySelector('.sb-source-trace__graph');
      const subject = this.querySelector('.sb-source-trace__node--subject');
      if (!graph || !subject) return;
      graph.scrollLeft = Math.max(0, subject.offsetLeft + this._nodeSize.width + PAD - graph.clientWidth);
      graph.scrollTop = Math.max(0, subject.offsetTop + this._nodeSize.height + PAD - graph.clientHeight);
    }

    _trailHtml() {
      if (!this._trail.length) return '';
      const crumbs = this._trail.slice(-3).map((id, i, shown) =>
        `<button class="sb-source-trace__crumb" type="button" data-crumb="${this._trail.length - shown.length + i}">${esc(id)}</button>`).join('›');
      return `<div class="sb-source-trace__trail"><button class="sb-source-trace__back" type="button">← Back</button>${crumbs}</div>`;
    }

    _headHtml(result) {
      const { subject, missing, cycles } = result;
      const unsupported = result.unsupported.filter((id) => id !== subject.id); // the summary already says so of the subject
      const problems = [
        missing.length && plural(missing.length, 'unknown id'),
        cycles.length && plural(cycles.length, 'loop'),
        unsupported.length && `${plural(unsupported.length, 'item')} resting on nothing cited`
      ].filter(Boolean).join(', ');
      return `
        <div class="sb-source-trace__head">
          <h3 class="sb-source-trace__title">
            <span class="sb-source-trace__id">${esc(subject.id)}</span>
            <span>${esc(subject.title ?? '')}</span>
            ${subject.kind ? `<span class="sb-source-trace__kind">${esc(subject.kind)}</span>` : ''}
            <button class="sb-source-trace__full" type="button" aria-label="Full screen" title="Full screen">${FULL_SCREEN_ICON}</button>
          </h3>
          <div class="sb-source-trace__summary">${esc(summary(result))}.${problems ? ` <span class="sb-source-trace__problems">${esc(problems)}.</span>` : ''}</div>
        </div>`;
    }

    _graphHtml(result) {
      const size = this._nodeSize;
      const { place, routes, width, height } = layOut(result.nodes, result.edges, size);
      const flows = result.edges.map((e, i) => {
        const { line, arrow } = flowPath(place.get(e.from), routes[i].map((id) => place.get(id)), place.get(e.to), size);
        const missing = result.nodes.find((n) => n.id === e.from).type === 'missing';
        const kind = e.cycle ? ' sb-source-trace__flow--cycle' : missing ? ' sb-source-trace__flow--missing' : '';
        return `<g class="sb-source-trace__flow${kind}" data-from="${esc(e.from)}" data-to="${esc(e.to)}"><path class="sb-source-trace__line" d="${line}"/><path class="sb-source-trace__arrow" d="${arrow}"/></g>`;
      }).join('');
      const nodes = result.nodes.map((n) => this._nodeHtml(n, place.get(n.id), result)).join('');
      return `
        <div class="sb-source-trace__graph">
          <div class="sb-source-trace__canvas" style="width: ${width}px; height: ${height}px">
            <svg class="sb-source-trace__lines" width="${width}" height="${height}" aria-hidden="true">${flows}</svg>
            ${nodes}
          </div>
        </div>`;
    }

    // A source opens; an item can be traced from; the subject and unknown ids are only shown.
    _nodeHtml(n, { x, y }, result) {
      const source = n.type === 'source' ? this._catalogue.find((s) => s.id === n.id) : null;
      const unsupported = result.unsupported.includes(n.id);
      const tag = n.type === 'missing' ? 'Not in the model'
        : unsupported ? 'Nothing cited'
          : source ? [n.derived && 'derived', formatOf(source)].filter(Boolean).join(' · ') : n.kind ?? '';
      const name = n.type === 'missing' ? `Named by ${result.edges.filter((e) => e.from === n.id).map((e) => e.to).join(', ')}` : n.title ?? '';
      const subject = n.id === result.subject.id;
      const action = n.type === 'source' ? `Open ${n.id}` : n.type === 'item' && !subject ? `Trace from ${n.id}` : '';
      const classes = ['sb-source-trace__node', `sb-source-trace__node--${n.type}`, subject && 'sb-source-trace__node--subject', unsupported && 'sb-source-trace__node--unsupported']
        .filter(Boolean).join(' ');
      const style = `left: ${x}px; top: ${y}px; width: ${this._nodeSize.width}px; height: ${this._nodeSize.height}px`;
      const inner = `
        <span class="sb-source-trace__top"><span class="sb-source-trace__id">${esc(n.id)}</span><span class="sb-source-trace__tag">${esc(tag)}</span></span>
        <span class="sb-source-trace__name">${esc(name)}</span>`;
      return action
        ? `<button class="${classes}" type="button" data-ref="${esc(n.id)}" data-node="${esc(n.id)}" style="${style}" title="${esc(action)}">${inner}</button>`
        : `<div class="${classes}" data-ref="${esc(n.id)}" data-node="${esc(n.id)}" style="${style}">${inner}</div>`;
    }

    // Puts the sandbox's own node inside each frame it draws for, emptying the trace's look there.
    _placeOwnNodes(result) {
      if (!this._drawNode) return;
      const nodeOf = new Map(result.nodes.map((n) => [n.id, n]));
      for (const frame of this.querySelectorAll('.sb-source-trace__node')) {
        const n = nodeOf.get(frame.dataset.node);
        if (n.type === 'missing') continue;
        const own = this._drawNode({ ...n });
        if (!(own instanceof Element)) continue;
        frame.classList.add('sb-source-trace__node--own');
        frame.replaceChildren(own);
      }
    }

    // Lights the pointed and highlighted nodes, and the lines touching them or the subject.
    _showMarks() {
      const lit = new Set([...this._highlight, this._pointed].filter(Boolean));
      for (const node of this.querySelectorAll('.sb-source-trace__node')) node.classList.toggle('sb-source-trace__node--lit', lit.has(node.dataset.node));
      const touching = lit.size ? lit : new Set([this._subject]);
      for (const flow of this.querySelectorAll('.sb-source-trace__flow')) {
        flow.classList.toggle('sb-source-trace__flow--lit', touching.has(flow.dataset.from) || touching.has(flow.dataset.to));
      }
    }

    // ---- Interaction ----

    _click(target) {
      const part = target.closest?.('button[data-node], [data-crumb], .sb-source-trace__back, .sb-source-trace__full');
      if (!part || !this.contains(part)) return;
      if (part.matches('.sb-source-trace__full')) return this._toggleFullScreen();
      if (part.matches('.sb-source-trace__back')) return this._goBack(this._trail.length - 1);
      if (part.dataset.crumb) return this._goBack(Number(part.dataset.crumb));
      const id = part.dataset.node;
      if (part.matches('.sb-source-trace__node--source')) {
        this.dispatchEvent(new CustomEvent('sb-open', { bubbles: true, detail: { id } }));
      } else {
        this.subject = id;
        this.dispatchEvent(new CustomEvent('sb-follow', { bubbles: true, detail: { id } }));
      }
    }

    // The whole trace fills the screen, so a big graph has room; retracing keeps it there.
    _toggleFullScreen() {
      if (document.fullscreenElement) document.exitFullscreen();
      else this.requestFullscreen?.();
    }

    // Back to a subject on the trail, dropping it and everything after.
    _goBack(index) {
      const id = this._trail[index];
      if (id == null) return;
      this._trail = this._trail.slice(0, index);
      this._subject = id;
      this._render();
      this.dispatchEvent(new CustomEvent('sb-back', { bubbles: true, detail: { id } }));
    }

    _nodeAt(target) {
      const node = target?.closest?.('[data-node]');
      return node && this.contains(node) ? node.dataset.node : null;
    }

    _pointAt(id) {
      if (id === this._pointed) return;
      this._pointed = id;
      this._showMarks();
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail: { id } }));
    }
  }

  customElements.define('sb-source-trace', SbSourceTrace);
})();
