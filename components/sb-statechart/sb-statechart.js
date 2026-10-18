// Sandkit sb-statechart 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// A statechart: states inside states, parallel regions, history, guards and actions. Shows every
// state that's active, what can happen now, and what the last step exited and entered, in order.
//
//   <sb-statechart sendable></sb-statechart>
//   chart.machine = { initial: 'idle', states: {
//     idle: { on: { START: 'running' } },
//     running: { on: { STOP: 'idle' } }
//   } };
//   chart.state = chart.initial();
//   chart.addEventListener('sb-send', (e) => { chart.state = chart.next(chart.state, e.detail.event); });
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-statechart';
  const existing = customElements.get('sb-statechart');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-statechart>, so only one can run. Rename one by replacing every "sb-statechart" in its file.`);
    }
    return;
  }

  const HALO = 'paint-order: stroke; stroke: var(--sb-surface, #fff); stroke-width: 4px; stroke-linejoin: round;';
  const CSS = `
    .sb-statechart { display: block; }
    .sb-statechart__scroll { overflow-x: auto; contain: inline-size; } /* takes its container's width, and scrolls within it */
    .sb-statechart__svg { display: block; margin: 0 auto; font-family: inherit; overflow: visible; }
    .sb-statechart__state { cursor: pointer; }
    .sb-statechart__shape { fill: var(--sb-surface, #fff); stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; }
    .sb-statechart__state--compound > .sb-statechart__shape, .sb-statechart__state--parallel > .sb-statechart__shape { fill: none; }
    .sb-statechart .sb-statechart__state--region > .sb-statechart__shape { fill: none; stroke: none; } /* the lines between regions are drawn on their own */
    .sb-statechart__divider { stroke: var(--sb-muted, #616e7c); stroke-width: 1; }
    .sb-statechart__region-line { stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; stroke-dasharray: 6 4; }
    .sb-statechart__label { font-size: 12px; font-weight: 600; fill: var(--sb-text, #1f2933); }
    .sb-statechart__state--region > .sb-statechart__label { font-weight: 400; font-style: italic; fill: var(--sb-muted, #616e7c); }
    .sb-statechart__detail { font-size: 11px; fill: var(--sb-muted, #616e7c); }
    .sb-statechart__fold { font-size: 12px; fill: var(--sb-muted, #616e7c); cursor: pointer; }
    .sb-statechart__final-dot, .sb-statechart__initial { fill: var(--sb-text, #1f2933); }
    .sb-statechart__state--final > .sb-statechart__shape { fill: var(--sb-surface, #fff); }
    .sb-statechart__history { fill: var(--sb-surface, #fff); stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; }
    .sb-statechart__history-label { font-size: 10px; font-weight: 700; fill: var(--sb-text, #1f2933); }
    .sb-statechart__remembered { font-size: 11px; font-weight: 600; fill: var(--sb-accent, #2563eb); ${HALO} }
    .sb-statechart__state--good > .sb-statechart__shape { stroke: var(--sb-good, #3f9142); stroke-width: 2.5; }
    .sb-statechart__state--warn > .sb-statechart__shape { stroke: var(--sb-warn, #d69e2e); stroke-width: 2.5; }
    .sb-statechart__state--bad > .sb-statechart__shape { stroke: var(--sb-bad, #c53030); stroke-width: 2.5; }
    .sb-statechart__state--active > .sb-statechart__shape { stroke: var(--sb-accent, #2563eb); stroke-width: 2.5; }
    .sb-statechart__state--active.sb-statechart__state--atomic > .sb-statechart__shape,
    .sb-statechart__state--active.sb-statechart__state--folded > .sb-statechart__shape { fill: var(--sb-accent-soft, #eaf0ff); stroke-width: 3; }
    .sb-statechart__state--active > .sb-statechart__label { fill: var(--sb-accent, #2563eb); }
    .sb-statechart__state--highlighted > .sb-statechart__shape { stroke: var(--sb-accent, #2563eb); stroke-width: 3; filter: drop-shadow(0 0 5px var(--sb-accent, #2563eb)); }
    .sb-statechart .sb-statechart__state--region.sb-statechart__state--highlighted > .sb-statechart__shape { fill: var(--sb-accent-soft, #eaf0ff); stroke: var(--sb-accent, #2563eb); stroke-width: 2; filter: none; } /* a region has no outline of its own, so it fills */
    .sb-statechart__line { fill: none; stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; }
    .sb-statechart__arrow { fill: var(--sb-muted, #616e7c); }
    .sb-statechart__hit { fill: none; stroke: transparent; stroke-width: 12; }
    .sb-statechart__transition-label { font-size: 11px; fill: var(--sb-text, #1f2933); ${HALO} }
    .sb-statechart--running .sb-statechart__transition, .sb-statechart--running .sb-statechart__transition-label { opacity: 0.4; }
    .sb-statechart .sb-statechart__transition--enabled, .sb-statechart .sb-statechart__transition-label--enabled,
    .sb-statechart .sb-statechart__transition--taken, .sb-statechart .sb-statechart__transition-label--taken,
    .sb-statechart .sb-statechart__transition--blocked, .sb-statechart .sb-statechart__transition-label--blocked,
    .sb-statechart .sb-statechart__transition--highlighted, .sb-statechart .sb-statechart__transition-label--highlighted { opacity: 1; }
    .sb-statechart__transition--enabled .sb-statechart__line { stroke: var(--sb-accent, #2563eb); stroke-width: 2; }
    .sb-statechart__transition--enabled .sb-statechart__arrow { fill: var(--sb-accent, #2563eb); }
    .sb-statechart__transition-label--enabled { fill: var(--sb-accent, #2563eb); font-weight: 600; }
    .sb-statechart[sendable] .sb-statechart__transition--enabled, .sb-statechart[sendable] .sb-statechart__transition-label--enabled { cursor: pointer; }
    .sb-statechart__transition--blocked .sb-statechart__line { stroke: var(--sb-bad, #c53030); stroke-dasharray: 4 3; }
    .sb-statechart__transition--blocked .sb-statechart__arrow { fill: var(--sb-bad, #c53030); }
    .sb-statechart__transition-label--blocked { fill: var(--sb-bad, #c53030); }
    .sb-statechart__transition--taken .sb-statechart__line { stroke: var(--sb-accent, #2563eb); stroke-width: 3.5; }
    .sb-statechart__transition--taken .sb-statechart__arrow { fill: var(--sb-accent, #2563eb); }
    .sb-statechart__transition--highlighted .sb-statechart__line { stroke: var(--sb-accent, #2563eb); stroke-width: 3; filter: drop-shadow(0 0 4px var(--sb-accent, #2563eb)); }
    .sb-statechart__badge circle { stroke: var(--sb-accent, #2563eb); stroke-width: 1.5; }
    .sb-statechart__badge text { font-size: 10px; font-weight: 700; }
    .sb-statechart__badge--exit circle { fill: var(--sb-surface, #fff); }
    .sb-statechart__badge--exit text { fill: var(--sb-accent, #2563eb); }
    .sb-statechart__badge--enter circle, .sb-statechart__badge--transition circle { fill: var(--sb-accent, #2563eb); }
    .sb-statechart__badge--enter text, .sb-statechart__badge--transition text { fill: var(--sb-accent-text, #fff); }
    .sb-statechart__events { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 8px; font-size: 13px; color: var(--sb-muted, #616e7c); }
    .sb-statechart__events:empty, .sb-statechart__step:empty { display: none; }
    .sb-statechart__event { font: inherit; font-weight: 600; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--sb-accent, #2563eb); background: var(--sb-accent-soft, #eaf0ff); color: var(--sb-accent, #2563eb); cursor: pointer; }
    .sb-statechart__event:disabled { cursor: default; border-color: var(--sb-border, #d5d9e0); background: none; color: var(--sb-muted, #616e7c); text-decoration: line-through; }
    .sb-statechart__step { margin-top: 6px; font-size: 13px; color: var(--sb-text, #1f2933); }`;

  // Sizes, in SVG units (which are pixels, since the chart is never scaled up).
  const STATE = { minWidth: 80, padding: 24, charWidth: 7.5, height: 34, rx: 10 };
  const DETAIL = { charWidth: 6.2, line: 15 }; // entry, exit and internal lines
  const INSIDE = 18;       // padding inside a compound state
  const HEADER = 28;       // a compound state's name row
  const REGION_HEAD = 20;  // a region's name row
  const FOLD = 18;         // room for a compound's fold control
  const COLUMN_GAP = 48;   // the least room between columns, widened to fit the labels between them
  const ROW_GAP = 30;      // between states in one column
  const INITIAL = { r: 5, room: 44 };
  const FINAL = { r: 11, dot: 6 };
  const HISTORY = { r: 10, gap: 8 };
  const LABEL = { charWidth: 6.2, padding: 10, line: 13, margin: 16, along: [0.5, 0.35, 0.65, 0.2, 0.8, 0.1, 0.9] };
  const BENDS = [0, 24, -24, 48, -48, 80, -80, 120, -120, 170, -170, 230, -230, 300, -300];
  const SPREAD = 34;       // between transitions that join the same two states
  const CORNER = 8;        // how far transitions keep from a state's corners
  const LOOP = 26;         // how far a transition back to its own state reaches out
  const ARROW = { length: 9, half: 4.5 };
  const BADGE = { r: 8, gap: 18 };
  const FRAME_PADDING = 16;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const listOf = (value) => (value == null ? [] : [].concat(value)).map(String);
  const byOrder = (a, b) => a.order - b.order;

  function addStyle() {
    if (document.getElementById('sb-statechart-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-statechart-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // ---- The machine ----
  //
  // The machine as a flat index of states in document order, each knowing its parent, children,
  // history states and transitions. The root is the machine itself, always active and never drawn.

  function indexOf(machine) {
    const states = new Map(), transitions = [];
    const visit = (id, def, parent) => {
      const kind = def.type === 'history' ? 'history' : def.type === 'final' ? 'final'
        : def.type === 'parallel' ? 'parallel' : def.states ? 'compound' : 'atomic';
      const state = {
        id, def, kind, parent, order: states.size, children: [], histories: [], transitions: [], internals: [],
        label: String(def.label ?? id), entry: listOf(def.entry), exit: listOf(def.exit)
      };
      states.set(id, state);
      if (parent) (kind === 'history' ? parent.histories : parent.children).push(state);
      // The machine's own `on` is ignored: every transition belongs to a state, so it can be drawn.
      for (const [event, value] of Object.entries(parent ? def.on ?? {} : {})) {
        const choices = [].concat(value).map((t) => (typeof t === 'string' ? { target: t } : t ?? {}));
        choices.forEach((t, i) => {
          const transition = {
            id: String(t.id ?? (choices.length > 1 ? `${id}:${event}:${i}` : `${id}:${event}`)),
            source: id, event, target: t.target == null ? null : String(t.target),
            guard: t.guard == null ? null : String(t.guard), actions: listOf(t.actions), def: t
          };
          (transition.target == null ? state.internals : state.transitions).push(transition);
          transitions.push(transition);
        });
      }
      for (const [childId, child] of Object.entries(def.states ?? {})) visit(childId, child ?? {}, state);
      return state;
    };
    const root = visit('', machine, null);
    for (const t of transitions) {
      if (t.target != null && !states.has(t.target)) throw new Error(`sb-statechart: "${t.source}" on ${t.event} goes to "${t.target}", which isn't a state.`);
    }
    return { root, states, transitions };
  }

  const ancestorsOf = (s) => (s.parent ? [s.parent, ...ancestorsOf(s.parent)] : []);
  const isInside = (s, outer) => ancestorsOf(s).includes(outer);
  const initialChild = (s) => s.children.find((c) => c.id === String(s.def.initial)) ?? s.children.find((c) => c.kind !== 'history');

  // ---- Semantics ----
  //
  // How a statechart moves, as SCXML describes it, used by `initial()` and `next()` and to show
  // what can happen now. Each function takes the machine and a state and returns a new one.

  // Every active state: the ones named, and all their ancestors.
  function configurationOf(index, active) {
    const config = new Set([index.root]);
    for (const id of active) {
      const s = index.states.get(String(id));
      if (s) [s, ...ancestorsOf(s)].forEach((a) => config.add(a));
    }
    return config;
  }

  const passes = (t, guards) => t.guard == null || guards[t.guard] !== false;

  // The transitions an event fires: for each innermost active state, the first of its own whose
  // guard passes, or else its nearest ancestor's. A transition is dropped if one before it exits
  // the same states, so parallel regions only ever fire transitions that don't conflict.
  function selectTransitions(index, config, event, guards) {
    const atomic = [...config].filter((s) => !s.children.some((c) => config.has(c))).sort(byOrder);
    const chosen = [];
    for (const s of atomic) {
      for (const state of [s, ...ancestorsOf(s)]) {
        const t = [...state.transitions, ...state.internals].find((t) => t.event === event && passes(t, guards));
        if (t) {
          if (!chosen.includes(t)) chosen.push(t);
          break;
        }
      }
    }
    const kept = [];
    for (const t of chosen) {
      const exits = exitSet(index, config, t);
      if (!kept.some((k) => exitSet(index, config, k).some((s) => exits.includes(s)))) kept.push(t);
    }
    return kept;
  }

  // The innermost compound state holding the transition's source and target, outside the source,
  // so a transition back to its own state leaves it and comes in again.
  function domainOf(index, t) {
    const source = index.states.get(t.source), target = index.states.get(t.target);
    return ancestorsOf(source).find((a) => a.kind !== 'parallel' && (a === target || isInside(target, a))) ?? index.root;
  }

  function exitSet(index, config, t) {
    if (t.target == null) return [];
    const domain = domainOf(index, t);
    return [...config].filter((s) => isInside(s, domain));
  }

  // The states to enter for a transition, worked out as SCXML does: the target and whatever it
  // implies (an initial child, every region of a parallel state, what a history remembers), and
  // the ancestors between it and the domain, with all their regions.
  function entrySet(index, targets, domain, history) {
    const enter = new Set();
    const covers = (child) => [...enter].some((s) => s === child || isInside(s, child));
    const addDescendants = (s) => {
      if (s.kind === 'history') {
        const remembered = (history[s.id] ?? []).map((id) => index.states.get(id)).filter(Boolean);
        const restore = remembered.length ? remembered : [index.states.get(String(s.def.target)) ?? initialChild(s.parent)].filter(Boolean);
        restore.forEach(addDescendants);
        restore.forEach((r) => addAncestors(r, s.parent));
        return;
      }
      enter.add(s);
      if (s.kind === 'compound') {
        const child = initialChild(s);
        if (child) {
          addDescendants(child);
          addAncestors(child, s);
        }
      } else if (s.kind === 'parallel') {
        for (const region of s.children) if (!covers(region)) addDescendants(region);
      }
    };
    const addAncestors = (s, upTo) => {
      for (const a of ancestorsOf(s)) {
        if (a === upTo) break;
        enter.add(a);
        if (a.kind === 'parallel') for (const region of a.children) if (!covers(region)) addDescendants(region);
      }
    };
    targets.forEach(addDescendants);
    targets.forEach((t) => addAncestors(t, domain));
    return enter;
  }

  // What each history state remembers as its parent is left: the active children, or for deep
  // history the innermost active states inside it.
  function recordHistory(exited, config, history) {
    const next = { ...history };
    for (const s of exited) {
      for (const h of s.histories) {
        const deep = h.def.history === 'deep';
        const innermost = (c) => !c.children.some((k) => config.has(k));
        next[h.id] = [...config].filter((c) => (deep ? isInside(c, s) && innermost(c) : c.parent === s)).sort(byOrder).map((c) => c.id);
      }
    }
    return next;
  }

  const leavesOf = (config) => [...config].filter((s) => s.parent && !s.children.some((c) => config.has(c))).sort(byOrder).map((s) => s.id);

  function initialState(index) {
    const entered = [...entrySet(index, [index.root], null, {})].filter((s) => s.parent).sort(byOrder);
    return {
      active: leavesOf(new Set([index.root, ...entered])), history: {},
      last: { event: null, transitions: [], exited: [], entered: entered.map((s) => s.id), actions: entered.flatMap((s) => s.entry) }
    };
  }

  function nextState(index, state, event, guards) {
    const config = configurationOf(index, state?.active ?? []);
    const history = state?.history ?? {};
    const fired = selectTransitions(index, config, event, guards);
    const external = fired.filter((t) => t.target != null);
    const exited = unique(external.flatMap((t) => exitSet(index, config, t))).sort(byOrder).reverse();
    const after = new Set([...config].filter((s) => !exited.includes(s)));
    const entered = unique(external.flatMap((t) => [...entrySet(index, [index.states.get(t.target)], domainOf(index, t), history)]))
      .filter((s) => !after.has(s)).sort(byOrder);
    entered.forEach((s) => after.add(s));
    return {
      active: leavesOf(after),
      history: recordHistory(exited, config, history),
      last: {
        event, transitions: fired.map((t) => t.id), exited: exited.map((s) => s.id), entered: entered.map((s) => s.id),
        actions: [...exited.flatMap((s) => s.exit), ...fired.flatMap((t) => t.actions), ...entered.flatMap((s) => s.entry)]
      }
    };
  }

  const unique = (list) => [...new Set(list)];

  // ---- Layout ----
  //
  // Each state is sized from the inside out, then placed from the outside in. Inside a compound
  // state, children sit in columns from left to right, each a step further from the initial
  // child; parallel regions are stacked, sharing one width. Folded states are drawn as one box.

  const detailsOf = (s) => [
    ...s.entry.map((a) => `entry / ${a}`), ...s.exit.map((a) => `exit / ${a}`),
    ...s.internals.map((t) => `${t.event}${t.guard ? ` [${t.guard}]` : ''}${t.actions.length ? ` / ${t.actions.join(', ')}` : ''}`)
  ];
  const textWidth = (text, charWidth) => Math.max(0, ...text.map((t) => t.length)) * charWidth;
  const isRegion = (s) => s.parent?.kind === 'parallel';
  // A compound state's name row, and its entry, exit and internal lines.
  const headOf = (s) => (isRegion(s) ? REGION_HEAD : HEADER) + (detailsOf(s).length ? detailsOf(s).length * DETAIL.line + 6 : 0);

  function layout(index, folded) {
    const isFolded = (s) => (s.kind === 'compound' || s.kind === 'parallel') && folded.includes(s.id);
    // What can be seen of each state: itself, or the outermost folded state around it.
    const shown = new Map();
    const visit = (s, under) => {
      shown.set(s, under ?? s);
      [...s.children, ...s.histories].forEach((c) => visit(c, under ?? (isFolded(s) ? s : null)));
    };
    visit(index.root, null);
    const visible = (s) => shown.get(s) === s;

    // Transitions between what can be seen; a transition folded away entirely is dropped.
    const drawn = index.transitions.filter((t) => t.target != null).map((t) => {
      const from = shown.get(index.states.get(t.source)), to = shown.get(index.states.get(t.target));
      return { t, from, to };
    }).filter(({ t, from, to }) => from !== to || (t.source === t.target && from.id === t.source));
    // The event, then any guard and actions beneath it, keeping labels narrow.
    const labelOf = (t) => {
      const rest = [t.guard ? `[${t.guard}]` : '', t.actions.length ? `/ ${t.actions.join(', ')}` : ''].filter(Boolean).join(' ');
      return [t.event, ...(rest ? [rest] : [])];
    };
    const labelWidth = (t) => textWidth(labelOf(t), LABEL.charWidth) + LABEL.padding;

    // The child of `s` that holds `x`, if any.
    const childHolding = (s, x) => s.children.find((c) => c === x || isInside(x, c));

    const size = (s) => {
      const details = detailsOf(s);
      const headWidth = (charWidth) => Math.max(textWidth([s.label], charWidth) + STATE.padding, textWidth(details, DETAIL.charWidth) + STATE.padding);
      if (s.kind === 'final') {
        Object.assign(s, { width: Math.max(2 * FINAL.r, textWidth([s.label], STATE.charWidth)), height: 2 * FINAL.r + 18 });
      } else if (s.kind === 'atomic' || isFolded(s)) {
        Object.assign(s, { width: Math.max(STATE.minWidth, headWidth(STATE.charWidth) + (isFolded(s) ? FOLD : 0)), height: STATE.height + (details.length ? details.length * DETAIL.line + 6 : 0) });
      } else {
        s.children.forEach(size);
        const parallel = s.kind === 'parallel';
        const historyWidth = s.histories.length * (2 * HISTORY.r + HISTORY.gap);
        const inner = parallel ? stackRegions(s) : arrangeColumns(s);
        // Regions reach the sides of their parallel state, so the lines between them do too.
        const sides = s.parent && !parallel ? INSIDE : 0;
        s.head = !s.parent ? 0 : headOf(s);
        s.width = Math.max(inner.width + 2 * sides, s.parent ? headWidth(STATE.charWidth) + historyWidth + FOLD : 0);
        s.height = s.head + inner.height + sides;
        if (parallel) s.children.forEach((c) => stretch(c, s.width));
        // Children sit centred across the inside.
        const spare = s.width - 2 * sides - inner.width;
        for (const c of s.children) { c.rx += parallel ? 0 : sides + spare / 2; c.ry += s.head; }
        if (s.initialAt) { s.initialAt.rx += sides + spare / 2; s.initialAt.ry += s.head; }
      }
    };

    // Children in columns: each one step further on than the furthest way into it from the
    // initial child, loops set aside. Columns are spaced to fit the labels between them.
    const arrangeColumns = (s) => {
      const kids = s.children;
      if (!kids.length) return { width: 0, height: 0 };
      const links = drawn.flatMap(({ t, from, to }) => {
        const a = childHolding(s, from), b = childHolding(s, to);
        return a && b && a !== b ? [{ from: a, to: b, t }] : [];
      });
      const start = initialChild(s);
      const rank = rankStates(kids, links, start);
      const columns = [];
      for (const c of kids) (columns[rank.get(c)] ??= []).push(c);
      const filled = columns.filter(Boolean);
      const columnWidth = filled.map((col) => Math.max(...col.map((c) => c.width)));
      const columnHeight = filled.map((col) => col.reduce((sum, c) => sum + c.height, 0) + ROW_GAP * (col.length - 1));
      const height = Math.max(...columnHeight);
      const gapAfter = filled.map((col, i) => {
        const between = links.filter((l) => col.includes(l.from) && filled[i + 1]?.includes(l.to) || col.includes(l.to) && filled[i + 1]?.includes(l.from));
        return Math.max(COLUMN_GAP, ...between.map((l) => labelWidth(l.t) + LABEL.margin));
      });
      let x = start ? INITIAL.room : 0;
      filled.forEach((col, i) => {
        let y = (height - columnHeight[i]) / 2;
        for (const c of col) {
          c.rx = x + (columnWidth[i] - c.width) / 2;
          c.ry = y;
          y += c.height + ROW_GAP;
        }
        x += columnWidth[i] + (i < filled.length - 1 ? gapAfter[i] : 0);
      });
      if (start) s.initialAt = { rx: INITIAL.r, ry: start.ry + Math.min(start.height, STATE.height) / 2 };
      return { width: x, height };
    };

    // Regions one above another, later stretched to the width of their parallel state.
    const stackRegions = (s) => {
      let y = 0;
      for (const c of s.children) {
        c.rx = 0;
        c.ry = y;
        y += c.height;
      }
      return { width: Math.max(0, ...s.children.map((c) => c.width)), height: y };
    };
    const stretch = (region, width) => {
      const by = (width - region.width) / 2;
      if (region.kind === 'compound' && !isFolded(region)) {
        for (const c of region.children) c.rx += by;
        if (region.initialAt) region.initialAt.rx += by;
        region.width = width;
      } else region.rx += by;
    };

    // Relative places become absolute, from the root down.
    const place = (s, x, y) => {
      s.x = x;
      s.y = y;
      if (s.initialAt) s.initial = { x: x + s.initialAt.rx, y: y + s.initialAt.ry };
      s.histories.forEach((h, i) => { h.x = x + s.width - FOLD - (i + 0.5) * (2 * HISTORY.r + HISTORY.gap); h.y = y + Math.min(s.head, HEADER) / 2; });
      if (!isFolded(s)) s.children.forEach((c) => place(c, x + c.rx, y + c.ry));
    };

    // Laid out afresh each time, since folding changes what each state holds.
    for (const s of index.states.values()) Object.assign(s, { initialAt: null, initial: null, head: 0 });
    size(index.root);
    place(index.root, 0, 0);

    const states = [...index.states.values()].filter((s) => s.parent && s.kind !== 'history' && visible(s));
    const histories = [...index.states.values()].filter((s) => s.kind === 'history' && visible(s.parent) && !isFolded(s.parent));
    const boxed = states.filter((s) => s.kind === 'atomic' || s.kind === 'final' || isFolded(s));
    const routes = routeAll(drawn, states, [...boxed, ...histories], labelOf);
    const initials = [index.root, ...states].filter((s) => s.initial && !isFolded(s)).map((s) => {
      // Straight across, into the side of the state it starts.
      const { x, y } = s.initial;
      return { state: s, curve: straight({ x: x + INITIAL.r, y }, { x: boxOf(initialChild(s)).x, y }) };
    });
    return { states, histories, routes, initials, frame: frameOf(states, routes) };
  }

  // Each state's rank among its siblings: the longest way into it from the start, loops set aside.
  function rankStates(kids, links, start) {
    const outgoing = new Map(kids.map((k) => [k, links.filter((l) => l.from === k)]));
    const status = new Map(), finished = [], loops = new Set();
    const visit = (k) => {
      status.set(k, 'visiting');
      for (const link of outgoing.get(k)) {
        if (status.get(link.to) === 'visiting') loops.add(link);
        else if (!status.has(link.to)) visit(link.to);
      }
      status.set(k, 'done');
      finished.push(k);
    };
    if (start) visit(start);
    for (const k of kids) if (!status.has(k)) visit(k);
    const rank = new Map(kids.map((k) => [k, 0]));
    for (const k of finished.reverse()) {
      for (const link of outgoing.get(k)) if (!loops.has(link)) rank.set(link.to, Math.max(rank.get(link.to), rank.get(k) + 1));
    }
    return rank;
  }

  // ---- Routing ----

  const boxOf = (s) => (s.kind === 'history'
    ? { x: s.x - HISTORY.r, y: s.y - HISTORY.r, width: 2 * HISTORY.r, height: 2 * HISTORY.r }
    : s.kind === 'final' ? { x: s.x + s.width / 2 - FINAL.r, y: s.y, width: 2 * FINAL.r, height: 2 * FINAL.r }
    : { x: s.x, y: s.y, width: s.width, height: s.height });
  const centre = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
  const contains = (outer, inner) => inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;

  const clamp = (v, least, most) => Math.min(Math.max(v, least), most);

  // A point inside a box as near `toward` as it can be, keeping clear of the corners. A line between
  // two such points joins the facing sides of two states, however big either is.
  function anchorIn(box, toward) {
    const mx = Math.min(box.width / 2, CORNER), my = Math.min(box.height / 2, CORNER);
    return { x: clamp(toward.x, box.x + mx, box.x + box.width - mx), y: clamp(toward.y, box.y + my, box.y + box.height - my) };
  }

  // Where a line from a point inside a box, heading towards another point, leaves the box.
  function exitPoint(box, from, toward) {
    const dx = toward.x - from.x, dy = toward.y - from.y;
    const tx = dx > 0 ? (box.x + box.width - from.x) / dx : dx < 0 ? (box.x - from.x) / dx : Infinity;
    const ty = dy > 0 ? (box.y + box.height - from.y) / dy : dy < 0 ? (box.y - from.y) / dy : Infinity;
    const t = Math.min(tx, ty);
    return { x: from.x + dx * t, y: from.y + dy * t };
  }

  // A curve from box a to box b, moved sideways by `shift` and bowed by `bend`, with a way to find
  // any point along it. When one box holds the other, it runs straight from the inner box to the
  // nearest side of the outer one.
  function curveBetween(a, b, shift, bend) {
    const [outer, inner] = contains(a, b) ? [a, b] : contains(b, a) ? [b, a] : [];
    if (outer) {
      const c = centre(inner);
      const sides = [
        { d: c.y - outer.y, p: { x: c.x, y: outer.y }, q: { x: c.x, y: inner.y } },
        { d: outer.y + outer.height - c.y, p: { x: c.x, y: outer.y + outer.height }, q: { x: c.x, y: inner.y + inner.height } },
        { d: c.x - outer.x, p: { x: outer.x, y: c.y }, q: { x: inner.x, y: c.y } },
        { d: outer.x + outer.width - c.x, p: { x: outer.x + outer.width, y: c.y }, q: { x: inner.x + inner.width, y: c.y } }
      ];
      const { p, q } = sides.reduce((best, s) => (s.d < best.d ? s : best));
      const [start, end] = outer === a ? [p, q] : [q, p];
      return straight(start, end);
    }
    const ca = centre(a), cb = centre(b);
    const side = (p, q, by) => {
      const length = Math.hypot(q.x - p.x, q.y - p.y) || 1;
      return { x: -(q.y - p.y) / length * by, y: (q.x - p.x) / length * by };
    };
    const moved = side(ca, cb, shift);
    const pa = anchorIn(a, { x: cb.x + moved.x, y: cb.y + moved.y }), pb = anchorIn(b, { x: ca.x + moved.x, y: ca.y + moved.y });
    const bow = side(pa, pb, bend);
    const control = { x: (pa.x + pb.x) / 2 + bow.x, y: (pa.y + pb.y) / 2 + bow.y };
    const start = exitPoint(a, pa, control), end = exitPoint(b, pb, control);
    const pointAt = (t) => ({
      x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t * t * end.x,
      y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t * t * end.y
    });
    return { d: `M${start.x},${start.y} Q${control.x},${control.y} ${end.x},${end.y}`, pointAt, end };
  }

  function straight(start, end) {
    const pointAt = (t) => ({ x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t });
    return { d: `M${start.x},${start.y} L${end.x},${end.y}`, pointAt, end };
  }

  // Out of a box's top and back into its right side.
  function loopOn(box, i) {
    const reach = LOOP + i * 14;
    const start = { x: box.x + box.width - 18, y: box.y }, end = { x: box.x + box.width, y: box.y + 16 };
    const c1 = { x: start.x, y: start.y - reach }, c2 = { x: end.x + reach, y: end.y };
    const pointAt = (t) => ({
      x: (1 - t) ** 3 * start.x + 3 * (1 - t) ** 2 * t * c1.x + 3 * (1 - t) * t * t * c2.x + t ** 3 * end.x,
      y: (1 - t) ** 3 * start.y + 3 * (1 - t) ** 2 * t * c1.y + 3 * (1 - t) * t * t * c2.y + t ** 3 * end.y
    });
    return { d: `M${start.x},${start.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`, pointAt, end, loop: true };
  }

  // Every transition's curve and label. Transitions joining the same two states spread apart, and
  // each bows as little as it can while keeping clear of states it has nothing to do with.
  function routeAll(drawn, states, solid, labelOf) {
    const groups = new Map();
    for (const d of drawn) {
      const key = [d.from.id, d.to.id].sort().join('\n');
      groups.set(key, [...(groups.get(key) ?? []), d]);
    }
    // A transition keeps clear of every state except those it starts or ends in, or passes out of
    // on its way. Regions tile their parallel state, so they never stand in the way.
    const obstacles = (d) => {
      const related = (s) => s === d.from || s === d.to || isInside(d.from, s) || isInside(d.to, s) || isInside(s, d.from) || isInside(s, d.to);
      return states.filter((s) => !related(s) && !isRegion(s)).map(boxOf);
    };
    // Labels keep clear of the states drawn as boxes, and of compound states' name rows.
    const heads = states.filter((s) => s.head).map((s) => ({ x: s.x, y: s.y, width: s.width, height: s.head }));
    const avoid = [...solid.map(boxOf), ...heads];
    const placedLabels = [];
    const routes = [];
    for (const group of groups.values()) {
      group.forEach((d, i) => {
        const a = boxOf(d.from), b = boxOf(d.to);
        let curve;
        if (d.from === d.to) curve = loopOn(a, i);
        else {
          // Spread around the straight line, measured the same way round for both directions.
          const flip = d.from.id < d.to.id ? 1 : -1;
          const base = (i - (group.length - 1) / 2) * SPREAD * flip;
          const others = obstacles(d);
          // How much of the curve runs through states in its way: the least wins, the straightest first.
          const crossing = (c) => Array.from({ length: 19 }, (_, k) => c.pointAt((k + 1) / 20)).filter((p) => others.some((o) => inside(p, o))).length;
          const curves = BENDS.map((bend) => curveBetween(a, b, base, base + bend));
          const scores = curves.map(crossing);
          curve = curves[scores.indexOf(Math.min(...scores))];
        }
        const lines = labelOf(d.t);
        routes.push({ ...d, curve, lines, label: placeLabel(lines, curve, avoid, placedLabels) });
      });
    }
    return routes;
  }

  const inside = (p, box) => p.x > box.x - 4 && p.x < box.x + box.width + 4 && p.y > box.y - 4 && p.y < box.y + box.height + 4;

  // Where along its curve a label goes: the first spot clear of every state and label already
  // placed, trying the middle first; failing that, the first clear of other labels, so text stays readable.
  function placeLabel(lines, curve, boxes, placed) {
    const width = textWidth(lines, LABEL.charWidth) + LABEL.padding, height = lines.length * LABEL.line + 2;
    const at = (t) => { const p = curve.pointAt(t); return { x: p.x - width / 2, y: p.y - height / 2, width, height, centre: p }; };
    const overlaps = (r, o) => r.x < o.x + o.width && o.x < r.x + r.width && r.y < o.y + o.height && o.y < r.y + r.height;
    const spots = (curve.loop ? [0.5] : LABEL.along).map(at);
    const clearOfLabels = (r) => !placed.some((o) => overlaps(r, o));
    const spot = spots.find((r) => clearOfLabels(r) && !boxes.some((b) => overlaps(r, b))) ?? spots.find(clearOfLabels) ?? spots[0];
    placed.push(spot);
    return spot;
  }

  // Everything drawn, with room above for the badges that number the last step.
  function frameOf(states, routes) {
    const boxes = [...states.map(boxOf), ...routes.map((r) => r.label)];
    const points = [...boxes.flatMap((b) => [b, { x: b.x + b.width, y: b.y + b.height }]), ...routes.flatMap((r) => [0.25, 0.5, 0.75].map(r.curve.pointAt))];
    const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
    const x = Math.min(0, ...xs) - FRAME_PADDING, y = Math.min(0, ...ys) - BADGE.r - FRAME_PADDING;
    return { x, y, width: Math.max(...xs) - x + FRAME_PADDING, height: Math.max(...ys) - y + FRAME_PADDING };
  }

  // An arrowhead at the curve's end, pointing the way it arrives.
  function arrowAt(curve) {
    const q = curve.end, p = curve.pointAt(0.92);
    const length = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const ux = (q.x - p.x) / length, uy = (q.y - p.y) / length;
    const bx = q.x - ux * ARROW.length, by = q.y - uy * ARROW.length;
    return `M${q.x},${q.y} L${bx - uy * ARROW.half},${by + ux * ARROW.half} L${bx + uy * ARROW.half},${by - ux * ARROW.half} z`;
  }

  // ---- The element ----

  class SbStatechart extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._machine = null;
      this._index = null;
      this._state = null;
      this._guards = {};
      this._folded = [];
      this._highlight = [];
      this._layout = null;
      this._pointed = null;
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('pointerover', (e) => this._point(e.target.closest('[data-state-id], [data-transition-id]')));
      this.addEventListener('pointerleave', () => this._point(null));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-statechart');
      this.render();
    }

    // ---- Public API ----

    // { initial, states: { name: { label, initial, type, history, entry, exit, on: { EVENT: target | { target, guard, actions } | [...] }, states, tone } } }.
    get machine() { return this._machine; }
    set machine(value) {
      this._machine = value ?? null;
      this._index = value ? indexOf(value) : null;
      this.render();
    }

    // Where the machine is: { active: [names], history: { name: [names] }, last: { event, transitions, exited, entered, actions } }.
    get state() { return this._state; }
    set state(value) {
      this._state = value ?? null;
      this._showState();
    }

    // Which guards pass now: { guard: true | false }. A guard not named passes.
    get guards() { return this._guards; }
    set guards(value) {
      this._guards = value ?? {};
      this._showState();
    }

    // Names of compound or parallel states drawn folded, as one box.
    get folded() { return this._folded; }
    set folded(value) {
      this._folded = listOf(value);
      this.render();
    }

    // Names of states, or ids of transitions, to point at.
    get highlight() { return this._highlight; }
    set highlight(value) {
      this._highlight = listOf(value);
      this._showState();
    }

    // The state the machine starts in, with everything entered to get there.
    initial() {
      return initialState(this._requireIndex());
    }

    // The state after `event`, with what it exited, fired and entered. Changes nothing itself.
    next(state, event, guards = this._guards) {
      return nextState(this._requireIndex(), state, String(event), guards ?? {});
    }

    _requireIndex() {
      if (!this._index) throw new Error('sb-statechart: set machine first.');
      return this._index;
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      if (!this._index) {
        this._layout = null;
        this.innerHTML = '';
        return;
      }
      this._layout = layout(this._index, this._folded);
      const { states, histories, routes, initials, frame } = this._layout;
      this.innerHTML = `
        <div class="sb-statechart__scroll">
          <svg class="sb-statechart__svg" viewBox="${frame.x} ${frame.y} ${frame.width} ${frame.height}" width="${frame.width}" role="img" aria-label="Statechart">
            ${states.map((s) => this._drawState(s)).join('')}
            ${histories.map((h) => this._drawHistory(h)).join('')}
            ${initials.map((i) => this._drawInitial(i)).join('')}
            ${routes.map((r) => this._drawTransition(r)).join('')}
            ${routes.map((r) => this._drawLabel(r)).join('')}
            <g class="sb-statechart__badges"></g>
          </svg>
        </div>
        <div class="sb-statechart__events"></div>
        <div class="sb-statechart__step" aria-live="polite"></div>`;
      this._showState();
    }

    _drawState(s) {
      const folded = this._folded.includes(s.id) && s.children.length;
      const kind = isRegion(s) && s.kind === 'compound' && !folded ? 'region' : s.kind;
      const classes = ['sb-statechart__state', `sb-statechart__state--${kind}`, folded && 'sb-statechart__state--folded', s.def.tone && `sb-statechart__state--${esc(s.def.tone)}`].filter(Boolean).join(' ');
      const tag = `<g class="${classes}" data-state-id="${esc(s.id)}" data-ref="${esc(s.id)}">`;
      if (s.kind === 'final') {
        const cx = s.x + s.width / 2, cy = s.y + FINAL.r;
        return `${tag}<circle class="sb-statechart__shape" cx="${cx}" cy="${cy}" r="${FINAL.r}"/><circle class="sb-statechart__final-dot" cx="${cx}" cy="${cy}" r="${FINAL.dot}"/>
          <text class="sb-statechart__label" x="${cx}" y="${s.y + 2 * FINAL.r + 14}" text-anchor="middle">${esc(s.label)}</text></g>`;
      }
      const details = detailsOf(s);
      const boxed = s.kind === 'atomic' || folded;
      const nameY = s.y + (boxed ? STATE.height / 2 + 4 : kind === 'region' ? 14 : HEADER / 2 + 4);
      const nameX = boxed ? s.x + (s.width - (folded ? FOLD : 0)) / 2 : s.x + (kind === 'region' ? 8 : 12);
      const top = s.y + (boxed ? STATE.height : kind === 'region' ? REGION_HEAD : HEADER);
      const fold = s.children.length ? `<text class="sb-statechart__fold" data-fold-id="${esc(s.id)}" x="${s.x + s.width - 12}" y="${s.y + 16}" text-anchor="middle" role="button" aria-label="${folded ? 'Unfold' : 'Fold'} ${esc(s.label)}">${folded ? '⊕' : '⊖'}</text>` : '';
      const regionLine = kind === 'region' && s.parent.children[0] !== s ? `<line class="sb-statechart__region-line" x1="${s.x}" y1="${s.y}" x2="${s.x + s.width}" y2="${s.y}"/>` : '';
      return `${tag}
        <rect class="sb-statechart__shape" x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${kind === 'region' ? 0 : STATE.rx}"/>
        ${regionLine}
        <text class="sb-statechart__label" x="${nameX}" y="${nameY}" text-anchor="${boxed ? 'middle' : 'start'}">${esc(s.label)}</text>
        ${details.length ? `<line class="sb-statechart__divider" x1="${s.x}" y1="${top}" x2="${s.x + s.width}" y2="${top}"/>` : ''}
        ${details.map((d, i) => `<text class="sb-statechart__detail" data-detail="${esc(d)}" x="${s.x + 10}" y="${top + (i + 1) * DETAIL.line}">${esc(d)}</text>`).join('')}
        ${fold}</g>`;
    }

    _drawHistory(h) {
      return `<g class="sb-statechart__state sb-statechart__state--history" data-state-id="${esc(h.id)}" data-ref="${esc(h.id)}">
        <circle class="sb-statechart__history" cx="${h.x}" cy="${h.y}" r="${HISTORY.r}"/>
        <text class="sb-statechart__history-label" x="${h.x}" y="${h.y + 3.5}" text-anchor="middle">${h.def.history === 'deep' ? 'H*' : 'H'}</text>
        <text class="sb-statechart__remembered" data-remembered-id="${esc(h.id)}" x="${h.x}" y="${h.y - HISTORY.r - 4}" text-anchor="middle"></text></g>`;
    }

    _drawInitial({ state, curve }) {
      return `<g class="sb-statechart__start" data-initial-of="${esc(state.id)}">
        <circle class="sb-statechart__initial" cx="${state.initial.x}" cy="${state.initial.y}" r="${INITIAL.r}"/>
        <path class="sb-statechart__line" d="${curve.d}"/><path class="sb-statechart__arrow" d="${arrowAt(curve)}"/></g>`;
    }

    _drawTransition({ t, curve }) {
      return `<g class="sb-statechart__transition" data-transition-id="${esc(t.id)}">
        <path class="sb-statechart__hit" d="${curve.d}"/><path class="sb-statechart__line" d="${curve.d}"/><path class="sb-statechart__arrow" d="${arrowAt(curve)}"/></g>`;
    }

    _drawLabel({ t, lines, label }) {
      const top = label.centre.y - ((lines.length - 1) * LABEL.line) / 2 + 4;
      return `<text class="sb-statechart__transition-label" data-transition-id="${esc(t.id)}" text-anchor="middle">${lines.map((l, i) => `<tspan x="${label.centre.x}" y="${top + i * LABEL.line}">${esc(l)}</tspan>`).join('')}</text>`;
    }

    // Everything that follows from the state, guards and highlight, without laying out again:
    // what's active, what can happen now, the last step in order, and what history remembers.
    _showState() {
      if (!this._layout) return;
      const index = this._index;
      const config = configurationOf(index, this._state?.active ?? []);
      const running = this._state != null;
      const last = this._state?.last ?? {};
      const { enabled, blocked } = running ? this._possible(config) : { enabled: [], blocked: [] };
      const taken = listOf(last.transitions);
      this.classList.toggle('sb-statechart--running', running);

      for (const el of this.querySelectorAll('.sb-statechart__state')) {
        const s = index.states.get(el.dataset.stateId);
        el.classList.toggle('sb-statechart__state--active', config.has(s));
        el.classList.toggle('sb-statechart__state--highlighted', this._highlight.includes(s.id));
      }
      for (const el of this.querySelectorAll('[data-transition-id]')) {
        const id = el.dataset.transitionId, base = el.classList[0];
        el.classList.toggle(`${base}--enabled`, enabled.some((t) => t.id === id));
        el.classList.toggle(`${base}--blocked`, blocked.some((t) => t.id === id));
        el.classList.toggle(`${base}--taken`, taken.includes(id));
        el.classList.toggle(`${base}--highlighted`, this._highlight.includes(id));
      }
      for (const el of this.querySelectorAll('[data-remembered-id]')) {
        el.textContent = listOf(this._state?.history?.[el.dataset.rememberedId]).map((id) => index.states.get(id)?.label ?? id).join(', ');
      }
      this._showSteps(last);
      this._showEvents(enabled, blocked);
    }

    // The transitions that would fire now, event by event, and those held back only by a guard.
    _possible(config) {
      const outgoing = [...config].sort(byOrder).flatMap((s) => [...s.transitions, ...s.internals]);
      const enabled = unique(outgoing.map((t) => t.event)).flatMap((event) => selectTransitions(this._index, config, event, this._guards));
      const blocked = outgoing.filter((t) => !passes(t, this._guards));
      return { enabled, blocked };
    }

    // Numbers the last step's exits, transitions and entries in the order they happened, on the
    // chart and in a line of words beneath it.
    _showSteps(last) {
      const index = this._index, layer = this.querySelector('.sb-statechart__badges');
      const steps = [
        ...listOf(last.exited).map((id) => ({ kind: 'exit', id, s: index.states.get(id) })),
        ...listOf(last.transitions).map((id) => ({ kind: 'transition', id, t: index.transitions.find((t) => t.id === id) })),
        ...listOf(last.entered).map((id) => ({ kind: 'enter', id, s: index.states.get(id) }))
      ].filter((step) => step.s || step.t);
      const perPlace = new Map();
      const badges = steps.map((step, i) => {
        const at = this._badgePlace(step);
        if (!at) return '';
        const n = perPlace.get(at.key) ?? 0;
        perPlace.set(at.key, n + 1);
        const x = at.x + n * BADGE.gap;
        return `<g class="sb-statechart__badge sb-statechart__badge--${step.kind}" data-badge-for="${esc(step.id)}"><circle cx="${x}" cy="${at.y}" r="${BADGE.r}"/><text x="${x}" y="${at.y + 3.5}" text-anchor="middle">${i + 1}</text></g>`;
      });
      layer.innerHTML = badges.join('');

      // A transition is named by where it runs from and to, so one inherited from an enclosing state shows as such.
      const name = (id) => index.states.get(id)?.label ?? id;
      const words = steps.map((step, i) => {
        const [what, actions] = step.t
          ? [step.t.target == null ? name(step.t.source) : `${name(step.t.source)} → ${name(step.t.target)}`, step.t.actions]
          : [`${step.kind} ${step.s.label}`, step.kind === 'exit' ? step.s.exit : step.s.entry];
        return `${i + 1} ${what}${actions.length ? ` (${actions.join(', ')})` : ''}`;
      });
      const step = this.querySelector('.sb-statechart__step');
      const fired = listOf(last.transitions).length;
      const heading = last.event != null ? `Last: ${last.event}` : fired ? 'Last' : 'Started';
      step.textContent = last.event == null && !words.length ? '' : `${heading}: ${words.length ? words.join(' · ') : 'nothing happened'}`;
    }

    _badgePlace(step) {
      const shown = (s) => this._layout.states.includes(s) ? s : ancestorsOf(s).find((a) => this._layout.states.includes(a) && this._folded.includes(a.id));
      if (step.t) {
        const route = this._layout.routes.find((r) => r.t === step.t);
        return route && { key: step.id, x: route.label.x - BADGE.r - 2, y: route.label.centre.y };
      }
      const s = shown(step.s);
      return s && { key: s.id, x: s.x + BADGE.r + 2, y: s.y };
    }

    // With `sendable`, a button for each event that can happen now, and one crossed out for each
    // held back by a guard.
    _showEvents(enabled, blocked) {
      const bar = this.querySelector('.sb-statechart__events');
      if (!this.hasAttribute('sendable') || this._state == null) {
        bar.innerHTML = '';
        return;
      }
      const can = unique(enabled.map((t) => t.event));
      const held = blocked.filter((t) => !can.includes(t.event));
      bar.innerHTML = !can.length && !held.length ? '' : `<span>Can happen now:</span>
        ${can.map((e) => `<button type="button" class="sb-statechart__event" data-event="${esc(e)}">${esc(e)}</button>`).join('')}
        ${unique(held.map((t) => t.event)).map((e) => `<button type="button" class="sb-statechart__event" disabled title="${esc(`Held back by [${held.filter((t) => t.event === e).map((t) => t.guard).join('], [')}]`)}">${esc(e)}</button>`).join('')}`;
    }

    // ---- Interaction ----

    _click(e) {
      const fold = e.target.closest('[data-fold-id]');
      const button = e.target.closest('.sb-statechart__event:not(:disabled)');
      const transition = e.target.closest('[data-transition-id]');
      const state = e.target.closest('[data-state-id]');
      if (fold) this._toggle(fold.dataset.foldId);
      else if (button) this._send(button.dataset.event);
      else if (transition) {
        const enabled = transition.classList.contains(`${transition.classList[0]}--enabled`);
        if (enabled && this.hasAttribute('sendable')) this._send(this._transitionById(transition.dataset.transitionId).event);
      } else if (state) {
        this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: this._stateDetail(state.dataset.stateId) }));
      }
    }

    _send(event) {
      this.dispatchEvent(new CustomEvent('sb-send', { bubbles: true, detail: { event } }));
    }

    _toggle(id) {
      const folded = !this._folded.includes(id);
      this.folded = folded ? [...this._folded, id] : this._folded.filter((f) => f !== id);
      this.dispatchEvent(new CustomEvent('sb-toggle', { bubbles: true, detail: { id, folded } }));
    }

    _point(el) {
      const key = el ? (el.dataset.stateId != null ? `s:${el.dataset.stateId}` : `t:${el.dataset.transitionId}`) : null;
      if (key === this._pointed) return;
      this._pointed = key;
      const detail = !el ? null : el.dataset.stateId != null ? this._stateDetail(el.dataset.stateId) : { transition: this._transitionDetail(el.dataset.transitionId) };
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail }));
    }

    // A state as viewers' events describe it: its name, and its definition as given.
    _stateDetail(id) {
      return { id, state: this._index.states.get(id).def };
    }

    _transitionById(id) {
      return this._index.transitions.find((t) => t.id === id);
    }

    _transitionDetail(id) {
      const { source, event, target, guard, actions } = this._transitionById(id);
      return { id, source, event, target, guard, actions };
    }
  }

  customElements.define('sb-statechart', SbStatechart);
})();
