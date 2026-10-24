// Fulfilment in a spare-parts warehouse that supplies rail maintenance depots, as a lineage of small runnable versions.
// A version runs a day: given the day's events, it returns the warehouse at every hour.
// Versions are never changed; a new idea is a new version. A rival branches off, kept until evidence picks one.

const OPEN = 8;
const CLOSE = 18;
const CUTOFF = 14;   // orders complete by now go on today's van
const VAN = 16;      // the van leaves

const PARTS = { BP: 'Brake pads', OF: 'Oil filters', CP: 'Couplers', OA: 'Alt. oil filters' };
const SUBSTITUTES = { OF: 'OA' };

// The days the versions run. Each version reads only what it knows about: earlier versions ignore priority,
// deliveries, collection times, the alternative filters and the damaged stock.
const DAYS = {
  single: {
    stock: { BP: 10 },
    orders: [
      { id: 'O1', time: '09:20', depot: 'Ashford depot', lines: [{ part: 'BP', qty: 6 }] },
    ],
    deliveries: [],
    damage: [],
  },
  busy: {
    stock: { BP: 12, OF: 8, CP: 2, OA: 5 },
    orders: [
      { id: 'O1', time: '08:15', depot: 'Ashford depot', lines: [{ part: 'BP', qty: 4 }, { part: 'OF', qty: 2 }] },
      { id: 'O2', time: '08:40', depot: 'Tonbridge depot', lines: [{ part: 'CP', qty: 2 }] },
      { id: 'O3', time: '08:50', depot: 'Ramsgate depot', priority: true, lines: [{ part: 'CP', qty: 1 }, { part: 'BP', qty: 2 }] },
      { id: 'O4', time: '09:30', depot: 'Hither Green', lines: [{ part: 'BP', qty: 6 }] },
      { id: 'O5', time: '10:30', depot: 'Ashford depot', priority: true, lines: [{ part: 'BP', qty: 3 }, { part: 'OF', qty: 4 }] },
      { id: 'O6', time: '10:20', depot: 'Tonbridge depot', lines: [{ part: 'OF', qty: 3 }] },
      { id: 'O10', time: '11:40', depot: 'Ramsgate depot', collect: '13:30', lines: [{ part: 'OF', qty: 2 }, { part: 'CP', qty: 1 }] },
      { id: 'O12', time: '12:30', depot: 'Ashford depot', lines: [{ part: 'OF', qty: 6 }] },
      { id: 'O7', time: '13:05', depot: 'Ramsgate depot', lines: [{ part: 'CP', qty: 1 }, { part: 'OF', qty: 1 }] },
      { id: 'O9', time: '14:20', depot: 'Tonbridge depot', lines: [{ part: 'BP', qty: 5 }, { part: 'OF', qty: 2 }] },
      { id: 'O8', time: '14:30', depot: 'Hither Green', priority: true, lines: [{ part: 'BP', qty: 2 }] },
      { id: 'O11', time: '15:10', depot: 'Hither Green', priority: true, collect: '17:30', lines: [{ part: 'BP', qty: 2 }] },
    ],
    deliveries: [
      { id: 'D1', time: '12:00', parts: { BP: 10 } },
      { id: 'D2', time: '15:00', parts: { CP: 4, OF: 6 } },
    ],
    damage: [
      { time: '13:00', part: 'BP', qty: 2 },
    ],
  },
};

// ---- The line's decision ----
// What one order line's decision can see when its turn comes. Quantities are bands against what the line still
// needs, split at the landmarks where behaviour might change: none, some but short, or enough.

const BANDS = ['none', 'short', 'enough'];
const bandOf = (count, qty) => {
  if (count === 0) return 'none';
  return count < qty ? 'short' : 'enough';
};
const STOCK = { values: BANDS, note: 'free stock of the part' };
const PRIORITY = { values: ['standard', 'priority'] };
const INBOUND = { values: BANDS, note: 'stock of the part on its way' };
const AHEAD = { values: ['clear', 'queue'], note: 'queue: an earlier line for the same part is still waiting' };
const SUBSTITUTE = { values: BANDS, note: 'free stock of a substitute part, if it has one' };

const allocateIfEnough = facts => (facts.stock === 'enough' ? 'allocated' : 'back-ordered');
const waitForDelivery = facts => {
  if (facts.stock === 'enough') return 'allocated';
  return facts.inbound === 'enough' ? 'awaiting delivery' : 'back-ordered';
};
const strictQueue = facts => (facts.ahead === 'queue' ? 'queued' : waitForDelivery(facts));
const takeWhatsThere = facts => {
  if (facts.stock === 'enough') return 'allocated';
  if (facts.inbound === 'enough') return 'awaiting delivery';
  return facts.stock === 'short' ? 'part allocated' : 'back-ordered';
};
const substituteFirst = facts => {
  if (facts.stock === 'enough') return 'allocated';
  if (facts.inbound === 'enough') return 'awaiting delivery';
  if (facts.substitute === 'enough') return 'substituted';
  return facts.stock === 'short' ? 'part allocated' : 'back-ordered';
};

// ---- The order's decision ----
// Whether an order goes anywhere yet, from what its lines have reached. Its lines fact joins it to its lines.

const LINES = { values: ['all', 'some', 'none'], note: 'how many of its unshipped lines are fully allocated' };
const CLOCK = { values: ['before cut-off', 'after cut-off'] };
const METHOD = { values: ['delivery', 'collection'] };

const vanIfComplete = facts => {
  if (facts.lines !== 'all') return 'waiting';
  return facts.clock === 'before cut-off' ? 'for the van' : 'ships tomorrow';
};
const splitForPriority = facts => {
  if (facts.lines === 'some' && facts.priority === 'priority' && facts.clock === 'before cut-off') return 'split for the van';
  return vanIfComplete(facts);
};
const collectOrDeliver = facts => {
  if (facts.method === 'collection') return facts.lines === 'all' ? 'ready to collect' : 'waiting';
  return splitForPriority(facts);
};

// ---- Who gets scarce stock first: an ordering of the lines waiting for it ----

const oldestFirst = (a, b) => minutesOf(a.time) - minutesOf(b.time);
const priorityFirst = (a, b) => Number(Boolean(b.priority)) - Number(Boolean(a.priority)) || oldestFirst(a, b);

// The ledger each version believes in: received equals the sum of these. A missing term shows as a break.
const HELD = ['free', 'reserved'];
const SHIPPING = [...HELD, 'shipped'];
const RECEIVING = [...SHIPPING, 'receiving'];

const LINE_V3 = { facts: { stock: STOCK, inbound: INBOUND }, decide: waitForDelivery };
const LINE_V6 = { facts: { stock: STOCK, inbound: INBOUND }, decide: takeWhatsThere };
const LINE_V7 = { facts: { stock: STOCK, inbound: INBOUND, substitute: SUBSTITUTE }, decide: substituteFirst };
const ORDER_V4 = { facts: { lines: LINES, clock: CLOCK }, decide: vanIfComplete };
const ORDER_V5 = { facts: { lines: LINES, clock: CLOCK, priority: PRIORITY }, decide: splitForPriority };
const ORDER_V8 = { facts: { lines: LINES, clock: CLOCK, priority: PRIORITY, method: METHOD }, decide: collectOrDeliver };

const VERSIONS = [
  {
    id: 'V1', parent: null, name: 'One order',
    cause: 'The simplest warehouse there is: one part on the shelf and one order for it. The order is allocated if there is enough stock, otherwise back-ordered.',
    day: 'single', queue: oldestFirst, ledger: HELD,
    line: { facts: { stock: STOCK }, decide: allocateIfEnough },
  },
  {
    id: 'V2', parent: 'V1', name: 'Many orders',
    cause: 'Depots order several parts at once, and several depots order in the same hour. Each hour, waiting lines take stock oldest first, and later orders find the shelf empty. Contention appears, and with it a policy for who goes first.',
    day: 'busy', queue: oldestFirst, ledger: HELD,
    line: { facts: { stock: STOCK }, decide: allocateIfEnough },
  },
  {
    id: 'V2b', parent: 'V2', name: 'Priority first', rival: true,
    cause: 'A rival to V2: a depot with a train out of service marks its order priority, and priority lines go first, oldest first among equals. Kept beside V2 until it is clear which policy is the deeper one.',
    day: 'busy', queue: priorityFirst, knows: ['priority'], ledger: HELD,
    line: { facts: { stock: STOCK, priority: PRIORITY }, decide: allocateIfEnough },
  },
  {
    id: 'V3', parent: 'V2', name: 'Deliveries',
    cause: 'Stock arrives during the day. Deliveries are known in advance, so a line short of stock can wait for one that will cover it, instead of being back-ordered with nothing coming. When a delivery lands, waiting lines take from it, oldest first, before the new orders.',
    day: 'busy', queue: oldestFirst, knows: ['deliveries'], ledger: HELD,
    line: LINE_V3,
  },
  {
    id: 'V4', parent: 'V3', name: 'Cut-off',
    cause: 'Stock has to leave the building. The van goes at 16:00 and takes orders complete by the 14:00 cut-off; complete later, they ship tomorrow. An order ships whole, so a part-allocated order holds its reserved stock until the rest arrives. The ledger gains shipped.',
    day: 'busy', queue: oldestFirst, knows: ['deliveries'], ledger: SHIPPING,
    line: LINE_V3, order: ORDER_V4,
  },
  {
    id: 'V4b', parent: 'V3', name: 'Strict queue', rival: true,
    cause: 'A rival to V4\'s queue: strictly first come, first served. A line can\'t take a part while an earlier line for the same part still waits, so small late orders no longer jump big early ones. The queue becomes a fact the line can see.',
    day: 'busy', queue: oldestFirst, knows: ['deliveries', 'strict'], ledger: SHIPPING,
    line: { facts: { stock: STOCK, inbound: INBOUND, ahead: AHEAD }, decide: strictQueue },
    order: ORDER_V4,
  },
  {
    id: 'V5', parent: 'V4', name: 'Split',
    cause: 'O5 is priority, but its oil filters wait for D2, so its brake pads sit reserved and miss the van. A priority order complete in part by the cut-off splits: what is ready goes on the van, the rest follows.',
    day: 'busy', queue: oldestFirst, knows: ['deliveries', 'priority'], ledger: SHIPPING,
    line: LINE_V3, order: ORDER_V5,
  },
  {
    id: 'V6', parent: 'V5', name: 'Part lines',
    cause: 'A line short of stock, with nothing on its way to cover it, takes what is there and waits for the rest, instead of leaving it on the shelf. "Short" now behaves differently from "none".',
    day: 'busy', queue: oldestFirst, knows: ['deliveries', 'priority'], ledger: SHIPPING,
    line: LINE_V6, order: ORDER_V5,
  },
  {
    id: 'V7', parent: 'V6', name: 'Substitutes',
    cause: 'Alternative oil filters fit the same engines, and five sit unused all day. A line that can\'t be covered by its own part or a delivery takes a substitute that covers it.',
    day: 'busy', queue: oldestFirst, knows: ['deliveries', 'priority', 'substitutes'], ledger: SHIPPING,
    line: LINE_V7, order: ORDER_V5,
  },
  {
    id: 'V8', parent: 'V7', name: 'Collection',
    cause: 'Some engineers drive over and collect at the counter. A collection order has no van and no cut-off: it is ready when complete, and gone when the engineer comes at the time they gave. Uncollected, its stock stays reserved.',
    day: 'busy', queue: oldestFirst, knows: ['deliveries', 'priority', 'substitutes', 'collection'], ledger: SHIPPING,
    line: LINE_V7, order: ORDER_V8,
  },
  {
    id: 'V9', parent: 'V8', name: 'Put-away',
    cause: 'A delivery isn\'t on the shelf the moment the lorry arrives: it is checked and put away, which takes an hour. Until then it can\'t be allocated, and the ledger gains receiving.',
    day: 'busy', queue: oldestFirst, knows: ['deliveries', 'priority', 'substitutes', 'collection', 'put-away'], ledger: RECEIVING,
    line: LINE_V7, order: ORDER_V8,
  },
  {
    id: 'V10', parent: 'V9', name: 'Damaged stock',
    cause: 'At 13:00 two brake pads are found damaged on the shelf and thrown away. The model now knows stock can be lost, but nothing records where it went.',
    day: 'busy', queue: oldestFirst, knows: ['deliveries', 'priority', 'substitutes', 'collection', 'put-away', 'damage'], ledger: RECEIVING,
    line: LINE_V7, order: ORDER_V8,
  },
  {
    id: 'V11', parent: 'V10', name: 'Write-offs',
    cause: 'V10\'s ledger broke at 13:00: two brake pads went missing from the books. Damaged stock is written off, and written off becomes a term of the ledger.',
    day: 'busy', queue: oldestFirst, knows: ['deliveries', 'priority', 'substitutes', 'collection', 'put-away', 'damage', 'write-offs'], ledger: [...RECEIVING, 'written off'],
    line: LINE_V7, order: ORDER_V8,
  },
];

const versionById = id => VERSIONS.find(version => version.id === id);
const parentOf = version => versionById(version.parent);
const depthOf = version => (version.parent ? depthOf(parentOf(version)) + 1 : 0);
const TRUNK = VERSIONS.filter(version => !version.rival);
const knows = (version, idea) => (version.knows ?? []).includes(idea);

const minutesOf = time => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
const hourLabel = hour => `${String(hour).padStart(2, '0')}:00`;
const arrivedBy = (hour, item) => minutesOf(item.time) <= hour * 60;
const copy = value => JSON.parse(JSON.stringify(value));
const sum = numbers => numbers.reduce((total, n) => total + n, 0);

// ---- A line and an order, as the run keeps them ----

const allocatedOf = line => sum(Object.values(line.takes));
const isCovered = line => allocatedOf(line) === line.qty;
const methodOf = (version, order) => (knows(version, 'collection') && order.collect ? 'collection' : 'delivery');

// An order's allocation, from its lines.
function statusOf(order) {
  const covered = order.lines.filter(isCovered).length;
  if (covered === order.lines.length) return 'allocated';
  return covered || order.lines.some(line => allocatedOf(line) > 0) ? 'part allocated' : 'back-ordered';
}

// Stock on its way, per part.
function inboundOf(deliveries) {
  const inbound = {};
  for (const delivery of deliveries) {
    for (const [part, qty] of Object.entries(delivery.parts)) inbound[part] = (inbound[part] ?? 0) + qty;
  }
  return inbound;
}

// ---- Running a day ----
// Every hour on the hour, in this order: stock put away, deliveries land, damage is found, orders arrive,
// waiting lines take their turn, orders decide where they're going, the van leaves, engineers collect.
// Every decision is kept, so the maps can show where each one landed.

function runDay(version) {
  const day = DAYS[version.day];
  const stock = Object.fromEntries(Object.entries(day.stock).map(([part, qty]) => [part, { received: qty, free: qty, reserved: 0, shipped: 0, receiving: 0, 'written off': 0 }]));
  const orders = [];
  const landed = new Set();
  const hours = [];

  for (let hour = OPEN; hour <= CLOSE; hour++) {
    const happened = [];
    const decisions = { line: [], order: [] };

    putAway(stock, happened);
    landDeliveries(version, day, hour, stock, landed, happened);
    findDamage(version, day, hour, stock, happened);
    arriveOrders(version, day, hour, orders);
    const onItsWay = knows(version, 'deliveries') ? day.deliveries.filter(delivery => !landed.has(delivery.id)) : [];
    allocate(version, orders, stock, inboundOf(onItsWay), decisions.line, happened);
    if (version.order) {
      decideOrders(version, orders, hour, decisions.order, happened);
      if (hour === VAN) loadVan(orders, stock, happened);
      collect(orders, hour, stock, happened);
    }

    hours.push({ hour, stock: copy(stock), orders: copy(orders), onItsWay: copy(onItsWay), happened, decisions });
  }
  return hours;
}

function putAway(stock, happened) {
  for (const [part, shelf] of Object.entries(stock)) {
    if (!shelf.receiving) continue;
    happened.push(`${shelf.receiving} ${PARTS[part]} put away`);
    shelf.free += shelf.receiving;
    shelf.receiving = 0;
  }
}

function landDeliveries(version, day, hour, stock, landed, happened) {
  if (!knows(version, 'deliveries')) return;
  for (const delivery of day.deliveries) {
    if (landed.has(delivery.id) || !arrivedBy(hour, delivery)) continue;
    landed.add(delivery.id);
    for (const [part, qty] of Object.entries(delivery.parts)) {
      stock[part].received += qty;
      if (knows(version, 'put-away')) stock[part].receiving += qty;
      else stock[part].free += qty;
    }
    happened.push(`${delivery.id} landed: ${Object.entries(delivery.parts).map(([part, qty]) => `${qty} ${PARTS[part]}`).join(', ')}`);
  }
}

// Damaged stock leaves the shelf. Only a version that writes it off records where it went.
function findDamage(version, day, hour, stock, happened) {
  if (!knows(version, 'damage')) return;
  for (const damage of day.damage.filter(each => minutesOf(each.time) === hour * 60)) {
    const lost = Math.min(damage.qty, stock[damage.part].free);
    stock[damage.part].free -= lost;
    if (knows(version, 'write-offs')) stock[damage.part]['written off'] += lost;
    happened.push(`${lost} ${PARTS[damage.part]} found damaged${knows(version, 'write-offs') ? ' and written off' : ''}`);
  }
}

function arriveOrders(version, day, hour, orders) {
  for (const order of day.orders) {
    if (orders.some(each => each.id === order.id) || !arrivedBy(hour, order)) continue;
    orders.push({
      ...copy(order),
      priority: knows(version, 'priority') && Boolean(order.priority),
      method: methodOf(version, order),
      stage: 'open',
      lines: order.lines.map(line => ({ ...line, takes: {}, status: 'waiting', shipped: false })),
    });
  }
}

// What a line's decision can see: only the facts this version knows about.
function lineFacts(version, order, line, stock, inbound, queued) {
  const needs = line.qty - allocatedOf(line);
  const substitute = SUBSTITUTES[line.part];
  const all = {
    stock: bandOf(stock[line.part].free, needs),
    priority: order.priority ? 'priority' : 'standard',
    inbound: bandOf(inbound[line.part] ?? 0, needs),
    ahead: queued.has(line.part) ? 'queue' : 'clear',
    substitute: substitute ? bandOf(stock[substitute].free, needs) : 'none',
  };
  return Object.fromEntries(Object.keys(version.line.facts).map(fact => [fact, all[fact]]));
}

// Takes stock for a line, from its own part or a substitute.
function take(stock, line, part, qty) {
  stock[part].free -= qty;
  stock[part].reserved += qty;
  line.takes[part] = (line.takes[part] ?? 0) + qty;
}

function allocate(version, orders, stock, inbound, decisions, happened) {
  const waiting = orders.flatMap(order => order.lines.filter(line => !isCovered(line)).map(line => ({ order, line })));
  waiting.sort((a, b) => version.queue(a.order, b.order));
  const queued = new Set();   // parts with an earlier line still waiting, for a strict queue
  for (const { order, line } of waiting) {
    const facts = lineFacts(version, order, line, stock, inbound, queued);
    const was = line.status;
    const needs = line.qty - allocatedOf(line);
    line.status = version.line.decide(facts);
    if (line.status === 'allocated') take(stock, line, line.part, needs);
    if (line.status === 'part allocated') take(stock, line, line.part, stock[line.part].free);
    if (line.status === 'substituted') take(stock, line, SUBSTITUTES[line.part], needs);
    if (!isCovered(line) && knows(version, 'strict')) queued.add(line.part);
    decisions.push({ order: order.id, part: line.part, qty: line.qty, facts, outcome: line.status });
    if (line.status !== was) happened.push(`${order.id} ${line.qty} ${PARTS[line.part]}: ${line.status}`);
  }
}

// Orders not yet committed decide where they're going. Once on the van, shipping tomorrow or ready, they stay.
const COMMITTED = ['for the van', 'split for the van', 'ships tomorrow', 'ready to collect', 'dispatched', 'collected'];

function orderFacts(version, order, hour) {
  const unshipped = order.lines.filter(line => !line.shipped);
  const covered = unshipped.filter(isCovered).length;
  const all = {
    lines: covered === unshipped.length ? 'all' : covered ? 'some' : 'none',
    clock: hour <= CUTOFF ? 'before cut-off' : 'after cut-off',
    priority: order.priority ? 'priority' : 'standard',
    method: order.method,
  };
  return Object.fromEntries(Object.keys(version.order.facts).map(fact => [fact, all[fact]]));
}

function decideOrders(version, orders, hour, decisions, happened) {
  for (const order of orders.filter(each => !COMMITTED.includes(each.stage))) {
    const facts = orderFacts(version, order, hour);
    const was = order.stage;
    const outcome = version.order.decide(facts);
    order.stage = outcome === 'waiting' ? 'open' : outcome;
    decisions.push({ order: order.id, facts, outcome });
    if (order.stage !== was) happened.push(`${order.id}: ${order.stage}`);
  }
}

function ship(stock, line) {
  for (const [part, qty] of Object.entries(line.takes)) {
    stock[part].reserved -= qty;
    stock[part].shipped += qty;
  }
  line.shipped = true;
}

// The van takes whole orders, and the ready lines of split ones; a split order's remaining lines stay open.
function loadVan(orders, stock, happened) {
  for (const order of orders) {
    if (order.stage === 'for the van') {
      order.lines.forEach(line => ship(stock, line));
      order.stage = 'dispatched';
      happened.push(`${order.id} left on the van`);
    }
    if (order.stage === 'split for the van') {
      order.lines.filter(line => isCovered(line) && !line.shipped).forEach(line => ship(stock, line));
      order.stage = 'open';
      happened.push(`${order.id} left on the van in part`);
    }
  }
}

function collect(orders, hour, stock, happened) {
  for (const order of orders.filter(each => each.stage === 'ready to collect' && minutesOf(each.collect) <= hour * 60)) {
    order.lines.forEach(line => ship(stock, line));
    order.stage = 'collected';
    happened.push(`${order.id} collected`);
  }
}

// ---- The ledger ----
// What the version believes must balance: everything received is in one of its terms. What's unaccounted for breaks it.

function ledgerOf(version, snapshot) {
  return Object.entries(snapshot.stock).map(([part, shelf]) => {
    const terms = Object.fromEntries(version.ledger.map(term => [term, shelf[term]]));
    return { part, received: shelf.received, terms, missing: shelf.received - sum(Object.values(terms)) };
  });
}

// ---- The maps ----
// Every combination of facts a decision can see, grouped into regions with the same outcome.

function combinations(facts) {
  return facts.reduce((all, [fact, { values }]) => all.flatMap(each => values.map(value => ({ ...each, [fact]: value }))), [{}]);
}

// Splits the facts one at a time, in order. Neighbouring values that lead to the same outcomes, whatever the later
// facts, share a tile; a fact whose values all agree is left whole. A region gives each fact its values.
function regionsOf(decision) {
  const pick = region => Object.fromEntries(Object.entries(region).map(([fact, values]) => [fact, values[0]]));
  function split(region, rest) {
    if (!rest.length) return [region];
    const [[fact, { values }], ...later] = rest;
    const outcomesOf = value => JSON.stringify(combinations(later).map(each => decision.decide({ ...pick(region), ...each, [fact]: value })));
    const groups = [];
    for (const value of values) {
      const last = groups.at(-1);
      if (last && outcomesOf(last[0]) === outcomesOf(value)) last.push(value);
      else groups.push([value]);
    }
    return groups.flatMap(group => split({ ...region, [fact]: group }, later));
  }
  return split({}, Object.entries(decision.facts)).map(facts => ({
    facts,
    size: Object.values(facts).reduce((product, values) => product * values.length, 1),
    outcome: decision.decide(pick(facts)),
  }));
}

const isIn = (facts, region) => Object.entries(region.facts).every(([fact, values]) => values.includes(facts[fact]));
