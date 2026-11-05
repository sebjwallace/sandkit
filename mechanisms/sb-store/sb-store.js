// Sandkit sb-store 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// A level between a floor and a ceiling, filled and taken from. A stock.
//
// Units: Q is any one quantity (litres, kWh, pounds, people). Every setting, amount and output is in Q.
// The store has no clock: a model turns rates into amounts (rate × step length) before calling it.
// `lasts` is the one place time appears.
//
// State: { capacity, floor, level, overflow, shortfall }, plain data, never changed.
// Every operation that moves the level returns { state, ...what happened }. Amounts are exactly zero when
// nothing happened, and otherwise accurate to rounding (relative 1e-9).

const SbStore = (() => {
  const POLICIES = {
    overflow: ['spill', 'reject'],     // more arriving than there's room for: keep what fits, or refuse it all
    shortfall: ['partial', 'reject']   // more demanded than is available: supply what there is, or supply nothing
  };

  const fail = (where, message) => { throw new Error(`SbStore.${where}: ${message}`); };

  function requirePolicy(name, value) {
    if (!POLICIES[name].includes(value)) fail('create', `unknown ${name} '${value}'; use one of ${POLICIES[name].join(', ')}`);
  }

  function requireSettings(capacity, floor, level) {
    if (typeof capacity !== 'number' || Number.isNaN(capacity)) fail('create', `capacity must be a number, or Infinity for no ceiling (got ${capacity})`);
    if (!Number.isFinite(floor)) fail('create', `floor must be a finite number (got ${floor}); an unlimited source doesn't need a store, so treat it as a plain number in the model`);
    if (floor > capacity) fail('create', `floor ${floor} is above capacity ${capacity}; lower the floor or raise the capacity`);
    if (level === undefined) return;
    if (!Number.isFinite(level)) fail('create', `level must be a finite number (got ${level}); leave it out to start at 0`);
    if (level < floor || level > capacity) fail('create', `level ${level} is outside ${floor} to ${capacity}; start it within them, or change them`);
  }

  // capacity: Q (the ceiling, may be Infinity) · floor: Q (the lowest level, negative for an overdraft)
  // level: Q (where it starts; 0 if left out, brought within floor and capacity)
  // overflow, shortfall: policies, above
  function create({ capacity = Infinity, floor = 0, level, overflow = 'spill', shortfall = 'partial' } = {}) {
    requireSettings(capacity, floor, level);
    requirePolicy('overflow', overflow);
    requirePolicy('shortfall', shortfall);
    const start = level === undefined ? Math.min(Math.max(0, floor), capacity) : level;
    return { capacity, floor, level: start, overflow, shortfall };
  }

  function requireAmount(where, name, value, otherWay) {
    if (!Number.isFinite(value) || value < 0) fail(where, `${name} must be a finite number, zero or more (got ${value}); ${otherWay}`);
  }

  // Rounding leaves residue about 1e-16 of the numbers worked with, growing slowly as a level is carried from step
  // to step, so two values this close, relative to those numbers, count as the same. A model testing `spilled > 0`
  // is then never misled, and a reject policy never refuses an amount that fits. It's far above rounding and far below
  // any amount a model means.
  const PRECISION = 1e-9;
  const isClose = (a, b, ...workedWith) => Math.abs(a - b) <= PRECISION * Math.max(...[a, b, ...workedWith].filter(Number.isFinite).map(Math.abs));
  const exceeds = (a, b, ...workedWith) => a > b && !isClose(a, b, ...workedWith);

  // What can be supplied of `amount` when `available` is there, by the shortfall policy.
  function supply(state, amount, available, ...workedWith) {
    if (!exceeds(amount, available, ...workedWith)) return amount;
    return state.shortfall === 'reject' ? 0 : available;
  }

  // A level that reaches a bound sits exactly on it, and rounding never carries it past.
  function withLevel(state, level, ...workedWith) {
    if (isClose(level, state.capacity, ...workedWith)) return { ...state, level: state.capacity };
    if (isClose(level, state.floor, ...workedWith)) return { ...state, level: state.floor };
    return { ...state, level: Math.min(Math.max(level, state.floor), state.capacity) };
  }

  // amount: Q → { state, added Q, spilled Q, rejected Q }, where added + spilled + rejected = amount
  function fill(state, amount) {
    requireAmount('fill', 'amount', amount, 'to take away, use SbStore.take');
    const filled = state.level + amount;
    if (!exceeds(filled, state.capacity, state.level, amount)) return { state: withLevel(state, filled, state.level, amount), added: amount, spilled: 0, rejected: 0 };
    if (state.overflow === 'reject') return { state, added: 0, spilled: 0, rejected: amount };
    const room = state.capacity - state.level;
    return { state: withLevel(state, state.capacity), added: room, spilled: amount - room, rejected: 0 };
  }

  // amount: Q → { state, supplied Q, short Q }, where supplied + short = amount
  function take(state, amount) {
    requireAmount('take', 'amount', amount, 'to add, use SbStore.fill');
    const supplied = supply(state, amount, state.level - state.floor, state.level, state.floor);
    return { state: withLevel(state, state.level - supplied, state.level, supplied), supplied, short: amount - supplied };
  }

  // Everything that happens to the store in one model step, in before out: what arrives can meet this
  // step's demand before any overflow is judged. For out before in, call take then fill.
  // inflow, outflow: Q → { state, added Q, spilled Q, rejected Q, supplied Q, short Q }
  function step(state, inflow, outflow) {
    requireAmount('step', 'inflow', inflow, 'for a net outflow, pass it as outflow');
    requireAmount('step', 'outflow', outflow, 'for a net inflow, pass it as inflow');
    const supplied = supply(state, outflow, state.level - state.floor + inflow, state.level, state.floor, inflow);
    const short = outflow - supplied;
    const wouldBe = state.level + inflow - supplied;
    const workedWith = [state.level, inflow, supplied];

    if (!exceeds(wouldBe, state.capacity, ...workedWith)) {
      return { state: withLevel(state, wouldBe, ...workedWith), added: inflow, spilled: 0, rejected: 0, supplied, short };
    }
    if (state.overflow === 'reject') return { ...take(state, outflow), added: 0, spilled: 0, rejected: inflow };
    const spilled = inflow - supplied - (state.capacity - state.level);
    return { state: withLevel(state, state.capacity), added: inflow - spilled, spilled, rejected: 0, supplied, short };
  }

  // How long until the floor at a steady net rate out. netOutRate: Q per unit of time → that unit of time.
  // Infinity if it isn't draining.
  function lasts(state, netOutRate) {
    if (!Number.isFinite(netOutRate)) fail('lasts', `netOutRate must be a finite number (got ${netOutRate}); use 0 or less if it isn't draining`);
    return netOutRate > 0 ? (state.level - state.floor) / netOutRate : Infinity;
  }

  // For a sandbox's model tests. Rounding grows with the numbers, so the tolerance is relative, keeping
  // these true in any unit: 1e-9 is far above rounding error and far below any amount a model means.
  const near = (a, b, scale) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(scale));

  const invariants = {
    // floor ≤ level ≤ capacity
    withinBounds: (state) => state.floor <= state.level && state.level <= state.capacity,

    // result: what an operation returned · before: the state it was given
    // inflow: what was offered, for fill and step · outflow: what was asked, for take and step
    // Every amount is accounted for, and the level moved by exactly added − supplied.
    accounted(result, { before, inflow = 0, outflow = 0 }) {
      const { added = 0, spilled = 0, rejected = 0, supplied = 0, short = 0 } = result;
      const scale = Math.max(Math.abs(before.level), Math.abs(result.state.level), inflow, outflow);
      return near(added + spilled + rejected, inflow, scale)
        && near(supplied + short, outflow, scale)
        && near(result.state.level, before.level + added - supplied, scale);
    }
  };

  return { POLICIES, create, fill, take, step, lasts, invariants };
})();

if (typeof module !== 'undefined') module.exports = SbStore;
