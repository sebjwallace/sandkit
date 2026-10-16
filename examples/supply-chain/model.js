// Supply chain model, chapter 1: the network.
// One product flows from suppliers to a distribution centre (DC) and on to stores.
// The clock steps one hour at a time. No UI here: the page reads `state` and renders it.

// The rules every location follows, with codes to cite them by (see practices/identifiers.md).
const SUPPLY_CHAIN_RULES = [
  { id: 'RUL-001', title: 'Reorder rule', description: 'When stock plus deliveries on the way falls below the reorder point, order enough to get back up to the order-up-to level.' },
  { id: 'RUL-002', title: 'Alternate suppliers', description: 'The distribution centre takes turns ordering from each supplier.' },
  { id: 'RUL-003', title: 'Empty shelves lose sales', description: 'Stores open from 08:00 to 20:00. A customer who finds no stock leaves without buying.' }
];

function createSupplyChain(options) {
  const opts = { seed: 1, demand: 1, storeLeadHours: 12, ...options };
  const HISTORY_HOURS = 24 * 7;
  const LOG_LIMIT = 300;
  const OPENING_HOURS = { from: 8, to: 20 };
  const BAD_NEWS = new Set(['stockout', 'short']);
  let state, random;

  function reset() {
    random = seededRandom(opts.seed);
    state = {
      hour: 0,
      nodes: [
        { id: 'SUP-A', name: 'Supplier A', type: 'supplier', x: 90, y: 110, leadHours: 36 },
        { id: 'SUP-B', name: 'Supplier B', type: 'supplier', x: 90, y: 290, leadHours: 60 },
        { id: 'DC-1', name: 'Distribution centre', type: 'dc', x: 350, y: 200,
          stock: 600, capacity: 1000, reorderPoint: 350, orderUpTo: 800, suppliers: ['SUP-A', 'SUP-B'], nextSupplier: 0 },
        { id: 'ST-N', name: 'Store North', type: 'store', x: 610, y: 70,
          stock: 80, capacity: 120, reorderPoint: 40, orderUpTo: 100, source: 'DC-1', dailyDemand: 40 },
        { id: 'ST-C', name: 'Store Central', type: 'store', x: 610, y: 200,
          stock: 80, capacity: 120, reorderPoint: 40, orderUpTo: 100, source: 'DC-1', dailyDemand: 30 },
        { id: 'ST-S', name: 'Store South', type: 'store', x: 610, y: 330,
          stock: 80, capacity: 120, reorderPoint: 40, orderUpTo: 100, source: 'DC-1', dailyDemand: 25 }
      ],
      shipments: [],
      log: [],
      history: {},
      totals: { sold: 0, lost: 0 },
      nextShipment: 1
    };
    stocked().forEach((n) => { state.history[n.id] = [n.stock]; });
  }

  function step() {
    state.hour++;
    deliver();
    sell();
    reorder();
    record();
  }

  // Shipments that have reached their destination are added to its stock.
  function deliver() {
    const [arrived, onTheWay] = partition(state.shipments, (s) => s.arrives <= state.hour);
    state.shipments = onTheWay;
    arrived.forEach((s) => {
      const to = node(s.to);
      to.stock += s.qty;
      to.soldOut = false;
      log('delivery', `${s.qty} arrived at ${to.name}`);
    });
  }

  // RUL-003: customers who find the shelf empty leave without buying.
  function sell() {
    const hourOfDay = state.hour % 24;
    if (hourOfDay < OPENING_HOURS.from || hourOfDay >= OPENING_HOURS.to) return;
    const openHours = OPENING_HOURS.to - OPENING_HOURS.from;

    stores().forEach((store) => {
      const wanted = poisson(store.dailyDemand * opts.demand / openHours);
      const sold = Math.min(wanted, store.stock);
      store.stock -= sold;
      state.totals.sold += sold;
      state.totals.lost += wanted - sold;
      if (store.stock === 0 && !store.soldOut) {
        store.soldOut = true;
        log('stockout', `${store.name} sold out`);
      }
    });
  }

  // RUL-001: when stock plus deliveries on the way falls below the reorder point,
  // order enough to get back up to the order-up-to level.
  function reorder() {
    stores().forEach(reorderForStore);
    reorderForDC(node('DC-1'));
  }

  function reorderForStore(store) {
    const position = store.stock + inbound(store.id);
    if (position >= store.reorderPoint) {
      store.short = false;
      return;
    }
    const dc = node(store.source);
    const wanted = store.orderUpTo - position;
    const sent = Math.min(wanted, dc.stock);
    if (sent > 0) {
      dc.stock -= sent;
      ship(dc, store, sent, opts.storeLeadHours);
      log('order', `${store.name} ordered ${wanted} from the DC (stock + on the way ${position}, below ${store.reorderPoint})`);
    }
    if (sent < wanted && !store.short) {
      store.short = true;
      log('short', `DC could only send ${sent} of ${wanted} to ${store.name}`);
    }
  }

  // RUL-002: the DC alternates its orders between suppliers.
  function reorderForDC(dc) {
    const position = dc.stock + inbound(dc.id);
    if (position >= dc.reorderPoint) return;
    const supplier = node(dc.suppliers[dc.nextSupplier]);
    dc.nextSupplier = (dc.nextSupplier + 1) % dc.suppliers.length;
    const qty = dc.orderUpTo - position;
    ship(supplier, dc, qty, supplier.leadHours);
    log('order', `DC ordered ${qty} from ${supplier.name} (stock + on the way ${position}, below ${dc.reorderPoint})`);
  }

  function record() {
    stocked().forEach((n) => {
      const history = state.history[n.id];
      history.push(n.stock);
      if (history.length > HISTORY_HOURS) history.shift();
    });
  }

  function ship(from, to, qty, hours) {
    state.shipments.push({
      id: `SHP-${state.nextShipment++}`,
      from: from.id, to: to.id, qty,
      departs: state.hour, arrives: state.hour + hours
    });
  }

  // Log entries follow the shape sb-log expects.
  function log(kind, text) {
    const tone = BAD_NEWS.has(kind) ? 'bad' : undefined;
    state.log.push({ hour: state.hour, time: formatTime(state.hour), kind, tone, text });
    if (state.log.length > LOG_LIMIT) state.log.shift();
  }

  const node = (id) => state.nodes.find((n) => n.id === id);
  const stores = () => state.nodes.filter((n) => n.type === 'store');
  const stocked = () => state.nodes.filter((n) => n.type !== 'supplier');
  const inbound = (id) => state.shipments.filter((s) => s.to === id).reduce((sum, s) => sum + s.qty, 0);

  // A random whole number of customers, averaging `mean`.
  function poisson(mean) {
    const limit = Math.exp(-mean);
    let k = 0, p = 1;
    do { k++; p *= random(); } while (p > limit);
    return k - 1;
  }

  reset();

  return {
    get state() { return state; },
    get options() { return opts; },
    rules: SUPPLY_CHAIN_RULES,
    step,
    reset,
    node,
    inbound,
    setOption(key, value) { opts[key] = value; }
  };
}

function formatTime(hour) {
  const day = Math.floor(hour / 24) + 1;
  const hh = String(hour % 24).padStart(2, '0');
  return `Day ${day} · ${hh}:00`;
}

function partition(list, test) {
  return [list.filter(test), list.filter((item) => !test(item))];
}

// Seeded random numbers (mulberry32), so a reset replays exactly the same run.
function seededRandom(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
