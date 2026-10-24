// The box, drawn two ways for the fulfilment page.
//
// A decision's box: a column per fact, each value once as a tile, then a column of outcomes. A region of the decision
// is a bundle of pathways: tile to tile, or, where it covers several tiles on either side, gathered at a knot and
// fanned out. Fog: lines some decision of the day took are solid, the rest dashed, and tiles are shaded by how many
// decisions crossed them. Lines taken at the clock's hour are marked.
//
// A journey box: the lifecycle column, a lifecycle's stages in order, then a column per hour with a tile per stage
// counting who is there. Each order or line threads its stage hour by hour: flat while it stays, slanting when it
// moves on. Journeys that run together share a line, drawn thicker.

const BOX = { tile: 24, gap: 8, head: 24, letter: 7 };

const heightOf = count => count * BOX.tile + (count - 1) * BOX.gap;
const centreOf = (column, key) => column.tiles.find(tile => tile.key === key).y + BOX.tile / 2;
const averageOf = numbers => numbers.reduce((total, n) => total + n, 0) / numbers.length;

// Places columns side by side, each as wide as its longest label and centred vertically, with the gaps widened to
// fill the space there is.
function placeColumns(columns, available, gaps) {
  for (const column of columns) {
    column.width = Math.max(56, ...column.tiles.map(tile => tile.label.length * BOX.letter + 16), column.name.length * BOX.letter + 8);
  }
  const spare = available - columns.reduce((total, column) => total + column.width, 0);
  const between = Math.min(gaps.most, Math.max(gaps.least, spare / Math.max(1, columns.length - 1)));
  const tallest = Math.max(...columns.map(column => heightOf(column.tiles.length)));
  let x = 0;
  for (const column of columns) {
    column.x = x;
    const top = BOX.head + (tallest - heightOf(column.tiles.length)) / 2;
    column.tiles.forEach((tile, i) => { tile.y = top + i * (BOX.tile + BOX.gap); });
    x += column.width + between;
  }
  return { width: x - between, height: BOX.head + tallest };
}

function tileSvg(column, i, tile, { traffic, now, of }) {
  const classes = ['box-tile', `tone-${tile.tone ?? 'plain'}`, traffic ? 'is-trodden' : 'is-fog', now && 'is-now'].filter(Boolean).join(' ');
  const shade = traffic ? ` style="--traffic: ${Math.round(15 + 70 * Math.min(1, traffic / of))}%"` : '';
  return `
    <g class="${classes}" data-column="${i}" data-key="${escapeHtml(tile.key)}"${shade}>
      <title>${traffic}</title>
      <rect x="${column.x}" y="${tile.y}" width="${column.width}" height="${BOX.tile}" rx="4"/>
      <text x="${column.x + 8}" y="${tile.y + BOX.tile / 2 + 4}">${escapeHtml(tile.label)}</text>
    </g>`;
}

const headSvg = (column, now) => `<text class="box-head${now ? ' is-now' : ''}" x="${column.x}" y="14">${escapeHtml(column.name)}</text>`;

// ---- A decision's box ----

function decisionColumns(decision, regions) {
  const facts = Object.entries(decision.facts).map(([fact, { values }]) => ({
    name: fact,
    tiles: values.map(value => ({ key: value, label: value })),
    covers: region => region.facts[fact],
    landsOn: record => record.facts[fact],
  }));
  const outcomes = [...new Set(regions.map(region => region.outcome))];
  const result = {
    name: 'outcome',
    tiles: outcomes.map(outcome => ({ key: outcome, label: outcome, tone: toneOf(outcome) })),
    covers: region => [region.outcome],
    landsOn: record => record.outcome,
  };
  return [...facts, result];
}

function segmentSvg(r, x1, y1, x2, y2, { trodden, now }) {
  const classes = ['box-path', trodden && 'is-trodden', now && 'is-now'].filter(Boolean).join(' ');
  return `<line class="${classes}" data-region="${r}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
}

// A bundle's lines between each pair of columns: solid where one of its decisions went that way, marked where one
// taken at the clock's hour did.
function bundleSvg(region, r, columns, records, nowRecords) {
  const lines = [];
  const took = (list, column, key) => list.some(record => column.landsOn(record) === key);
  for (let i = 0; i < columns.length - 1; i++) {
    const [from, to] = [columns[i], columns[i + 1]];
    const [starts, ends] = [from.covers(region), to.covers(region)];
    const [x1, x2] = [from.x + from.width, to.x];
    const style = (column, key) => ({ trodden: took(records, column, key), now: took(nowRecords, column, key) });
    if (starts.length === 1 && ends.length === 1) {
      const both = list => list.some(record => from.landsOn(record) === starts[0] && to.landsOn(record) === ends[0]);
      lines.push(segmentSvg(r, x1, centreOf(from, starts[0]), x2, centreOf(to, ends[0]), { trodden: both(records), now: both(nowRecords) }));
      continue;
    }
    const knot = { x: (x1 + x2) / 2, y: averageOf([...starts.map(key => centreOf(from, key)), ...ends.map(key => centreOf(to, key))]) };
    for (const start of starts) lines.push(segmentSvg(r, x1, centreOf(from, start), knot.x, knot.y, style(from, start)));
    for (const end of ends) lines.push(segmentSvg(r, knot.x, knot.y, x2, centreOf(to, end), style(to, end)));
    lines.push(`<circle class="box-knot${records.length ? ' is-trodden' : ''}" data-region="${r}" cx="${knot.x}" cy="${knot.y}" r="3"/>`);
  }
  return lines;
}

// Draws a decision's box into an element; returns what pointing needs.
function drawDecisionBox(element, decision, records, nowRecords) {
  const regions = regionsOf(decision);
  const columns = decisionColumns(decision, regions);
  const { width, height } = placeColumns(columns, element.parentElement.clientWidth, { least: 72, most: 240 });
  const recordsIn = regions.map(region => records.filter(record => isIn(record.facts, region)));
  const nowIn = regions.map(region => nowRecords.filter(record => isIn(record.facts, region)));
  const count = (list, column, key) => list.filter(record => column.landsOn(record) === key).length;
  element.innerHTML = `
    <svg width="${width}" height="${height + 4}" viewBox="0 0 ${width} ${height + 4}" role="img">
      <g>${regions.flatMap((region, r) => bundleSvg(region, r, columns, recordsIn[r], nowIn[r])).join('')}</g>
      ${columns.map(column => headSvg(column)).join('')}
      ${columns.map((column, i) => column.tiles.map(tile => tileSvg(column, i, tile, {
        traffic: count(records, column, tile.key), now: count(nowRecords, column, tile.key) > 0, of: records.length / 3,
      })).join('')).join('')}
    </svg>`;
  return { regions, columns, records };
}

// The bundles through a tile, and lighting a set of them with every tile they touch.
function bundlesThrough(drawn, tile) {
  const column = drawn.columns[Number(tile.dataset.column)];
  return drawn.regions.map((region, r) => (column.covers(region).includes(tile.dataset.key) ? r : -1)).filter(r => r >= 0);
}

function lightBundles(element, drawn, lit) {
  const touched = new Set(lit.flatMap(r => drawn.columns.flatMap((column, i) => column.covers(drawn.regions[r]).map(key => `${i}|${key}`))));
  for (const mark of element.querySelectorAll('[data-region]')) mark.classList.toggle('is-lit', lit.includes(Number(mark.dataset.region)));
  for (const tile of element.querySelectorAll('.box-tile')) tile.classList.toggle('is-lit', touched.has(`${tile.dataset.column}|${tile.dataset.key}`));
  element.classList.toggle('is-pointing', lit.length > 0);
}

// ---- A journey box ----

// The stages of each lifecycle, in the order they're drawn.
const LIFECYCLES = {
  order: ['back-ordered', 'part allocated', 'allocated', 'open', 'split for the van', 'for the van', 'ships tomorrow', 'ready to collect', 'dispatched', 'collected'],
  line: ['waiting', 'back-ordered', 'queued', 'awaiting delivery', 'part allocated', 'substituted', 'allocated', 'shipped'],
};

// Each order's or line's stage at every hour it existed: { id, stages: { hour: stage } }.
function journeysOf(version, day, kind) {
  const journeys = new Map();
  for (const snapshot of day) {
    for (const order of snapshot.orders) {
      const entries = kind === 'order'
        ? [[order.id, version.order ? order.stage : statusOf(order)]]
        : order.lines.map(line => [`${order.id} ${line.qty} ${PARTS[line.part]}`, line.shipped ? 'shipped' : line.status]);
      for (const [id, stage] of entries) {
        if (!journeys.has(id)) journeys.set(id, { id, order: order.id, stages: {} });
        journeys.get(id).stages[snapshot.hour] = stage;
      }
    }
  }
  return [...journeys.values()];
}

// Draws the journeys into an element; returns what pointing needs.
function drawJourneys(element, journeys, kind, hourNow) {
  const seen = new Set(journeys.flatMap(journey => Object.values(journey.stages)));
  const stages = LIFECYCLES[kind].filter(stage => seen.has(stage));
  const at = (hour, stage) => journeys.filter(journey => journey.stages[hour] === stage).length;
  const lifecycle = { name: 'stage', tiles: stages.map(stage => ({ key: stage, label: stage, tone: toneOf(stage) })) };
  const hours = [];
  for (let hour = OPEN; hour <= CLOSE; hour++) {
    hours.push({ name: hourLabel(hour), hour, tiles: stages.map(stage => ({ key: stage, label: String(at(hour, stage) || ''), tone: toneOf(stage) })) });
  }
  const columns = [lifecycle, ...hours];
  const { width, height } = placeColumns(columns, element.parentElement.clientWidth, { least: 16, most: 72 });
  const columnAt = hour => hours[hour - OPEN];

  const segments = new Map();   // "hour|from|to" -> the journeys that take it
  for (const journey of journeys) {
    for (let hour = OPEN; hour < CLOSE; hour++) {
      const [from, to] = [journey.stages[hour], journey.stages[hour + 1]];
      if (!from || !to) continue;
      const key = `${hour}|${from}|${to}`;
      if (!segments.has(key)) segments.set(key, []);
      segments.get(key).push(journey.id);
    }
  }
  const lines = [...segments.entries()].map(([key, ids]) => {
    const [hour, from, to] = key.split('|');
    const [a, b] = [columnAt(Number(hour)), columnAt(Number(hour) + 1)];
    return `<line class="journey-path${from !== to ? ' is-move' : ''}" data-journeys="${escapeHtml(ids.join('|'))}" style="stroke-width: ${1 + ids.length}"
      x1="${a.x + a.width}" y1="${centreOf(a, from)}" x2="${b.x}" y2="${centreOf(b, to)}"/>`;
  });
  const arrivals = journeys.map(journey => {
    const first = Math.min(...Object.keys(journey.stages).map(Number));
    const column = columnAt(first);
    return `<circle class="journey-start" data-journeys="${escapeHtml(journey.id)}" cx="${column.x - 5}" cy="${centreOf(column, journey.stages[first])}" r="3"/>`;
  });
  element.innerHTML = `
    <svg width="${width}" height="${height + 4}" viewBox="0 0 ${width} ${height + 4}" role="img">
      <g>${lines.join('')}${arrivals.join('')}</g>
      ${columns.map(column => headSvg(column, column.hour === hourNow)).join('')}
      ${columns.map((column, i) => column.tiles.map(tile => tileSvg(column, i, tile, {
        traffic: column.hour ? at(column.hour, tile.key) : 1, now: column.hour === hourNow, of: journeys.length / 2,
      })).join('')).join('')}
    </svg>`;
  return { journeys, columns };
}

// The journeys through a tile, and lighting a set of them.
// A tile in the lifecycle column stands for its stage at any hour.
function journeysThrough(drawn, tile) {
  const hour = drawn.columns[Number(tile.dataset.column)].hour;
  const there = journey => (hour ? journey.stages[hour] === tile.dataset.key : Object.values(journey.stages).includes(tile.dataset.key));
  return drawn.journeys.filter(there).map(journey => journey.id);
}

function lightJourneys(element, drawn, ids) {
  for (const mark of element.querySelectorAll('[data-journeys]')) {
    mark.classList.toggle('is-lit', mark.dataset.journeys.split('|').some(id => ids.includes(id)));
  }
  for (const tile of element.querySelectorAll('.box-tile')) {
    const hour = drawn.columns[Number(tile.dataset.column)].hour;
    const there = journey => (hour ? journey.stages[hour] === tile.dataset.key : Object.values(journey.stages).includes(tile.dataset.key));
    tile.classList.toggle('is-lit', drawn.journeys.some(journey => ids.includes(journey.id) && there(journey)));
  }
  element.classList.toggle('is-pointing', ids.length > 0);
}
